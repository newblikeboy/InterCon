const crypto = require("crypto");
const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const Message = require("../models/Message");
const InboxMessage = require("../models/InboxMessage");
const HttpError = require("../utils/httpError");
const { fetchWithPolicy } = require("../utils/httpClient");

const FREE_RECIPIENT_LIMIT = 20;

function normalizeRecipient(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
}

function hasActivePaidPlan(tenant) {
  const billing = tenant?.billing;
  return Boolean(billing && ["monthly", "quarterly", "yearly"].includes(billing.plan)
    && billing.status === "active"
    && (!billing.currentPeriodEnd || new Date(billing.currentPeriodEnd).getTime() > Date.now()));
}

function publicTrial(tenant) {
  const recipients = tenant.trial?.recipients || [];
  const reserved = new Set((tenant.trial?.reservations || []).map(item => item.recipient)
    .filter(phone => !recipients.includes(phone))).size;
  const used = Math.min(FREE_RECIPIENT_LIMIT, recipients.length);
  return {
    limit: FREE_RECIPIENT_LIMIT, used, remaining: FREE_RECIPIENT_LIMIT - used, reserved,
    active: tenant.status === "active" && used < FREE_RECIPIENT_LIMIT
  };
}

async function getAccessTenant(tenantId, { tenant: loadedTenant, recover = true } = {}) {
  // Reuse only a tenant loaded by this request, never a cached authorization.
  const tenant = loadedTenant || await Tenant.findById(tenantId).select("billing status trial").lean();
  if (!tenant) throw new HttpError(404, "Tenant not found");
  if (tenant.trial?.initializedAt) {
    if (!recover || !tenant.trial.reservations?.length) return tenant;
    // Recover a successful send whose quota write failed, using durable provider
    // acceptance evidence. Unknown outcomes retain their reservations.
    const since = new Date(Math.min(...tenant.trial.reservations.map(item => new Date(item.createdAt).getTime())));
    const phones = [...new Set(tenant.trial.reservations.map(item => item.recipient))];
    const id = new mongoose.Types.ObjectId(String(tenantId));
    const [messages, replies] = await Promise.all([
      Message.aggregate([
        { $match: { tenantId: id, to: { $in: phones }, acceptedAt: { $gte: since } } },
        { $group: { _id: "$to", at: { $max: "$acceptedAt" } } }
      ]),
      InboxMessage.aggregate([
        { $match: { tenantId: id, customerPhone: { $in: phones }, direction: "out", status: { $in: ["sent", "delivered", "read"] }, sentAt: { $gte: since } } },
        { $group: { _id: "$customerPhone", at: { $max: "$sentAt" } } }
      ])
    ]);
    const evidence = [...messages, ...replies];
    const recoverable = tenant.trial.reservations.filter(item => evidence.some(sent => sent._id === item.recipient && new Date(sent.at) >= new Date(item.createdAt)));
    for (const item of recoverable) await completeTrialSend(tenantId, item.recipient, item.token);
    return recoverable.length ? Tenant.findById(tenantId).select("billing status trial").lean() : tenant;
  }

  // Seed existing workspaces from outbound sends, never their contact count.
  const id = new mongoose.Types.ObjectId(String(tenantId));
  const histories = await Promise.all([
    Message.aggregate([
      { $match: { tenantId: id, $or: [{ acceptedAt: { $type: "date" } }, { status: { $in: ["accepted", "sent", "delivered", "read"] } }] } },
      { $group: { _id: "$to" } }, { $limit: FREE_RECIPIENT_LIMIT }
    ]),
    InboxMessage.aggregate([
      { $match: { tenantId: id, direction: "out", status: { $in: ["sent", "delivered", "read"] } } },
      { $group: { _id: "$customerPhone" } }, { $limit: FREE_RECIPIENT_LIMIT }
    ])
  ]);
  const recipients = [...new Set(histories.flat().map(row => normalizeRecipient(row._id)).filter(Boolean))].slice(0, FREE_RECIPIENT_LIMIT);
  await Tenant.updateOne({ _id: tenantId, "trial.initializedAt": { $exists: false } }, {
    $set: { "trial.initializedAt": new Date(), "trial.recipients": recipients, "trial.reservations": [] }
  });
  return Tenant.findById(tenantId).select("billing status trial").lean();
}

function assertPlatformAccess(tenant) {
  if (tenant.status !== "active") throw new HttpError(403, "Workspace is suspended or unavailable.");
  if (!hasActivePaidPlan(tenant) && !publicTrial(tenant).active) {
    throw new HttpError(402, "Your free allowance of 20 unique WhatsApp recipients is complete. Activate a paid InterCon plan to continue sending.", {
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
    token: null,
    trackRecipient: tenant.trial.recipients.length < FREE_RECIPIENT_LIMIT
      && !tenant.trial.recipients.includes(recipient)
  };
  const token = crypto.randomUUID();
  const recipients = { $ifNull: ["$trial.recipients", []] };
  const reservations = { $ifNull: ["$trial.reservations", []] };
  const occupied = { $setUnion: [recipients, { $map: { input: reservations, as: "r", in: "$$r.recipient" } }] };
  const reserved = await Tenant.updateOne({
    _id: tenantId, status: "active",
    $expr: { $and: [
      { $lt: [{ $size: recipients }, FREE_RECIPIENT_LIMIT] },
      { $lt: [{ $size: occupied }, FREE_RECIPIENT_LIMIT] },
      { $lt: [{ $size: reservations }, FREE_RECIPIENT_LIMIT] }
    ] }
  }, { $push: { "trial.reservations": { token, recipient, createdAt: new Date() } } });
  if (!reserved.modifiedCount) {
    // Ordinary in-flight sends need no history scans. Recover durable acceptance
    // evidence only when capacity is full, then retry the atomic reservation once.
    if (!recover) return reserveTrialSend(tenantId, recipient, true);
    // Recheck after racing with a completion or a plan activation.
    const latest = await requirePlatformAccess(tenantId);
    if (hasActivePaidPlan(latest)) return {
      token: null,
      trackRecipient: latest.trial.recipients.length < FREE_RECIPIENT_LIMIT
        && !latest.trial.recipients.includes(recipient)
    };
    throw new HttpError(409, "Other WhatsApp sends are using the remaining free allowance. Wait for their results before sending again.", {
      code: "INTERCON_TRIAL_BUSY", trial: publicTrial(latest)
    });
  }
  return { token, trackRecipient: true };
}

async function releaseTrialSend(tenantId, token) {
  if (token) await Tenant.updateOne({ _id: tenantId }, { $pull: { "trial.reservations": { token } } });
}

async function completeTrialSend(tenantId, recipient, token) {
  // Cap lifetime storage at 20, including sends made while a plan is paid.
  const result = await Tenant.updateOne({ _id: tenantId, $expr: { $lt: [{ $size: { $ifNull: ["$trial.recipients", []] } }, FREE_RECIPIENT_LIMIT] } }, {
    $addToSet: { "trial.recipients": recipient },
    ...(token ? { $pull: { "trial.reservations": { token } } } : {})
  });
  // Successful completion already removed the reservation. Only a counter filled
  // by a concurrent send needs a separate removal.
  if (!result.matchedCount) await releaseTrialSend(tenantId, token);
}

async function sendWhatsAppWithAccess(tenantId, phone, url, options) {
  const recipient = normalizeRecipient(phone);
  const { token, trackRecipient } = await reserveTrialSend(tenantId, recipient);
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
  } else if (metaResponse.messages?.[0]?.id && trackRecipient) {
    try {
      await completeTrialSend(tenantId, recipient, token);
    } catch (error) {
      // A durable reservation remains if usage persistence fails. Returning the
      // accepted result prevents callers from retrying a successful delivery.
      console.error("WhatsApp trial usage update failed", String(tenantId), error.message);
    }
  }
  return { response, metaResponse };
}

module.exports = {
  FREE_RECIPIENT_LIMIT, hasActivePaidPlan, publicTrial, getAccessTenant,
  requirePlatformAccess, sendWhatsAppWithAccess
};
