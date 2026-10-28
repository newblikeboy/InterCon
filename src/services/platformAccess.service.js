const crypto = require("crypto");
const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const Message = require("../models/Message");
const InboxMessage = require("../models/InboxMessage");
const Contact = require("../models/Contact");
const { suppressUndeliverableContact } = require("./contact.service");
const HttpError = require("../utils/httpError");
const { fetchWithPolicy } = require("../utils/httpClient");

const FREE_MESSAGE_LIMIT = 20;

function normalizeRecipient(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
}

function hasActivePaidPlan(tenant) {
  const billing = tenant?.billing;
  return Boolean(billing && ["monthly", "quarterly", "yearly"].includes(billing.plan)
    && billing.status === "active"
    && billing.currentPeriodEnd && new Date(billing.currentPeriodEnd).getTime() > Date.now());
}

function publicTrial(tenant) {
  const messages = tenant.trial?.messagesInitializedAt
    ? tenant.trial.sentMessages || [] : tenant.trial?.recipients || [];
  const reserved = (tenant.trial?.reservations || []).length;
  const used = Math.min(FREE_MESSAGE_LIMIT, messages.length);
  return {
    unit: "messages", limit: FREE_MESSAGE_LIMIT, used, remaining: FREE_MESSAGE_LIMIT - used, reserved,
    active: tenant.status === "active" && used < FREE_MESSAGE_LIMIT
  };
}

async function getAccessTenant(tenantId, { tenant: loadedTenant, recover = true } = {}) {
  // Reuse only a tenant loaded by this request, never a cached authorization.
  let tenant = loadedTenant || await Tenant.findById(tenantId).select("billing status trial").lean();
  if (!tenant) throw new HttpError(404, "Tenant not found");
  if (!tenant.trial?.messagesInitializedAt) {
    // Count historical accepted sends, including repeats to the same number.
    // Meta IDs deduplicate a template send mirrored in the inbox by a webhook.
    // A legacy recipient ledger remains a lower bound when history was deleted.
    const id = new mongoose.Types.ObjectId(String(tenantId));
    const historicalId = (prefix) => ({ $cond: [
      { $and: [{ $eq: [{ $type: "$metaMessageId" }, "string"] }, { $ne: ["$metaMessageId", ""] }] },
      "$metaMessageId", { $concat: [prefix, { $toString: "$_id" }] }
    ] });
    const histories = await Promise.all([
      Message.aggregate([
        { $match: { tenantId: id, $or: [{ acceptedAt: { $type: "date" } }, { status: { $in: ["accepted", "sent", "delivered", "read"] } }] } },
        { $project: { _id: historicalId("legacy-template:") } }, { $limit: FREE_MESSAGE_LIMIT }
      ]),
      InboxMessage.aggregate([
        { $match: { tenantId: id, direction: "out", $or: [
          { status: { $in: ["sent", "delivered", "read"] } },
          { status: "failed", metaMessageId: { $type: "string", $ne: "" } }
        ] } },
        { $project: { _id: historicalId("legacy-inbox:") } }, { $limit: FREE_MESSAGE_LIMIT }
      ])
    ]);
    const sentMessages = [...new Set(histories.flat().map(row => row._id))].slice(0, FREE_MESSAGE_LIMIT);
    const legacyUsed = Math.min(FREE_MESSAGE_LIMIT, tenant.trial?.recipients?.length || 0);
    while (sentMessages.length < legacyUsed) sentMessages.push(`legacy-usage:${sentMessages.length}`);
    await Tenant.updateOne({ _id: tenantId, "trial.messagesInitializedAt": { $exists: false } }, {
      $set: { "trial.messagesInitializedAt": new Date(), "trial.sentMessages": sentMessages,
        ...(!tenant.trial?.initializedAt ? { "trial.initializedAt": new Date() } : {}) }
    });
    tenant = await Tenant.findById(tenantId).select("billing status trial").lean();
  }
  if (!recover || !tenant.trial.reservations?.length) return tenant;
  // Recover only the exact accepted send belonging to a reservation. Phone/time
  // matching would mistake another send to the same number for this message.
  const tokens = tenant.trial.reservations.map(item => item.token);
  const id = new mongoose.Types.ObjectId(String(tenantId));
  const evidence = (await Promise.all([
    Message.aggregate([
      { $match: { tenantId: id, trialReservationToken: { $in: tokens }, metaMessageId: { $type: "string", $ne: "" },
        $or: [{ acceptedAt: { $type: "date" } }, { status: { $in: ["accepted", "sent", "delivered", "read"] } }] } },
      { $project: { trialReservationToken: 1, metaMessageId: 1 } }
    ]),
    InboxMessage.aggregate([
      { $match: { tenantId: id, direction: "out", trialReservationToken: { $in: tokens }, metaMessageId: { $type: "string", $ne: "" } } },
      { $project: { trialReservationToken: 1, metaMessageId: 1 } }
    ])
  ])).flat();
  for (const item of evidence) await completeTrialSend(tenantId, item.metaMessageId, item.trialReservationToken);
  return evidence.length ? Tenant.findById(tenantId).select("billing status trial").lean() : tenant;
}

function assertPlatformAccess(tenant) {
  if (tenant.status !== "active") throw new HttpError(403, "Workspace is suspended or unavailable.");
  if (!hasActivePaidPlan(tenant) && !publicTrial(tenant).active) {
    throw new HttpError(402, "Your free allowance of 20 WhatsApp messages is complete. Activate a paid InterCon plan to continue sending.", {
      code: "INTERCON_PLAN_REQUIRED", trial: publicTrial(tenant)
    });
  }
}

async function requirePlatformAccess(tenantId, { tenant: loadedTenant, recover = false } = {}) {
  const tenant = await getAccessTenant(tenantId, { tenant: loadedTenant, recover });
  assertPlatformAccess(tenant);
  return tenant;
}

async function reserveTrialSend(tenantId, recipient, recover = false) {
  // Always read current access immediately before sending, even for paid plans.
  const tenant = await requirePlatformAccess(tenantId, { recover });
  if (hasActivePaidPlan(tenant)) return {
    token: null, trackMessage: tenant.trial.sentMessages.length < FREE_MESSAGE_LIMIT
  };
  const token = crypto.randomUUID();
  const sentMessages = { $ifNull: ["$trial.sentMessages", []] };
  const reservations = { $ifNull: ["$trial.reservations", []] };
  const reserved = await Tenant.updateOne({
    _id: tenantId, status: "active",
    $expr: { $lt: [{ $add: [{ $size: sentMessages }, { $size: reservations }] }, FREE_MESSAGE_LIMIT] }
  }, { $push: { "trial.reservations": { token, recipient, createdAt: new Date() } } });
  if (!reserved.modifiedCount) {
    // Ordinary in-flight sends need no history scans. Recover durable acceptance
    // evidence only when capacity is full, then retry the atomic reservation once.
    if (!recover) return reserveTrialSend(tenantId, recipient, true);
    // Recheck after racing with a completion or a plan activation.
    const latest = await requirePlatformAccess(tenantId);
    if (hasActivePaidPlan(latest)) return {
      token: null, trackMessage: latest.trial.sentMessages.length < FREE_MESSAGE_LIMIT
    };
    throw new HttpError(409, "Other WhatsApp sends are using the remaining free allowance. Wait for their results before sending again.", {
      code: "INTERCON_TRIAL_BUSY", trial: publicTrial(latest)
    });
  }
  return { token, trackMessage: true };
}

async function releaseTrialSend(tenantId, token) {
  if (token) await Tenant.updateOne({ _id: tenantId }, { $pull: { "trial.reservations": { token } } });
}

async function completeTrialSend(tenantId, messageId, token) {
  // Cap lifetime storage at 20, including sends made while a plan is paid.
  // The provider message ID makes retries of bookkeeping idempotent.
  const result = await Tenant.updateOne({ _id: tenantId, $expr: { $lt: [{ $size: { $ifNull: ["$trial.sentMessages", []] } }, FREE_MESSAGE_LIMIT] } }, {
    $addToSet: { "trial.sentMessages": messageId },
    ...(token ? { $pull: { "trial.reservations": { token } } } : {})
  });
  // Successful completion already removed the reservation. Only a counter filled
  // by a concurrent send needs a separate removal.
  if (!result.matchedCount) await releaseTrialSend(tenantId, token);
}

async function sendWhatsAppWithAccess(tenantId, phone, url, options) {
  const recipient = normalizeRecipient(phone);
  const assertNotSuppressed = async () => {
    const erased = await require("../models/SuppressionEntry").exists({ tenantId,
      recipientHash: require("./privacy.service").suppressionHash(tenantId, recipient) });
    if (erased) throw new HttpError(403, "This recipient has an erasure suppression. Fresh verified permission is required before restoring messaging.");
    if (await Contact.exists({ tenantId, phone: recipient, status: { $ne: "active" } })) {
      throw new HttpError(403, "This contact is blocked or opted out. WhatsApp message was not sent.", { code: "CONTACT_SUPPRESSED" });
    }
  };
  await assertNotSuppressed();
  const { token, trackMessage } = await reserveTrialSend(tenantId, recipient);
  try { await assertNotSuppressed(); }
  catch (error) { await releaseTrialSend(tenantId, token); throw error; }
  const sentAt = new Date();
  let response;
  try {
    response = await fetchWithPolicy(url, options);
  } catch (error) {
    // A timeout or disconnected response can still mean Meta accepted the send.
    // Keep its slot reserved; never silently free an unknown delivery outcome.
    if (error.details?.code === "UPSTREAM_CIRCUIT_OPEN") await releaseTrialSend(tenantId, token);
    throw error;
  }
  const metaResponse = await response.json().catch(() => ({}));
  if (!response.ok || metaResponse.error) {
    await releaseTrialSend(tenantId, token);
    await suppressUndeliverableContact(tenantId, recipient, metaResponse.error, { sentAt });
  } else if (metaResponse.messages?.[0]?.id && trackMessage) {
    try {
      await completeTrialSend(tenantId, metaResponse.messages[0].id, token);
    } catch (error) {
      // A durable reservation remains if usage persistence fails. Returning the
      // accepted result prevents callers from retrying a successful delivery.
      console.error("WhatsApp trial usage update failed", String(tenantId), error.message);
    }
  }
  return { response, metaResponse, trialReservationToken: token };
}

module.exports = {
  FREE_MESSAGE_LIMIT, hasActivePaidPlan, publicTrial, getAccessTenant,
  requirePlatformAccess, sendWhatsAppWithAccess
};
