const crypto = require("crypto");
const Message = require("../models/Message");
const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const WebhookEvent = require("../models/WebhookEvent");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

function getWebhookAppSecret() {
  return env.facebookAppSecret || env.metaAppSecret;
}

function getWebhookAppSecrets() {
  return [...new Set([
    env.facebookAppSecret,
    env.metaAppSecret
  ].filter(Boolean))];
}

function getMetaWebhookSetup(req) {
  const publicBaseUrl = env.clientOrigin || `${req.protocol}://${req.get("host")}`;

  return {
    callbackUrl: `${publicBaseUrl.replace(/\/$/, "")}/api/webhooks/meta`,
    verifyTokenConfigured: Boolean(env.metaWebhookVerifyToken),
    appSecretConfigured: Boolean(getWebhookAppSecret()),
    requiredSubscriptionFields: [
      "messages",
      "message_template_status_update"
    ]
  };
}

function verifyMetaChallenge(query) {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (!env.metaWebhookVerifyToken) {
    throw new HttpError(500, "META_WEBHOOK_VERIFY_TOKEN is not configured");
  }

  if (mode === "subscribe" && token && token === env.metaWebhookVerifyToken) {
    return challenge;
  }

  throw new HttpError(403, "Webhook verification failed");
}

function verifyMetaSignature(req) {
  const appSecrets = getWebhookAppSecrets();

  if (!appSecrets.length) {
    if (env.nodeEnv === "production") {
      throw new HttpError(500, "FB_APP_SECRET or META_APP_SECRET is required for Meta webhook signature validation");
    }

    return;
  }

  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !req.rawBody) {
    throw new HttpError(403, "Missing Meta webhook signature");
  }

  const signatureBuffer = Buffer.from(signature);
  const isValid = appSecrets.some((appSecret) => {
    const expected = `sha256=${crypto
      .createHmac("sha256", appSecret)
      .update(req.rawBody)
      .digest("hex")}`;
    const expectedBuffer = Buffer.from(expected);

    return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  });

  if (!isValid) {
    throw new HttpError(403, "Invalid Meta webhook signature");
  }
}

function extractEventType(change) {
  const value = change.value || {};

  if (change.field) return change.field;
  if (value.event) return value.event;
  if (value.statuses?.length) return "message_status";
  if (value.messages?.length) return "inbound_message";
  if (value.message_template_name || value.message_template_id) return "message_template_status_update";

  return "unknown";
}

async function resolveTenant(entry, change) {
  const value = change.value || {};
  const wabaId = entry.id || value.waba_id;
  const phoneNumberId = value.metadata?.phone_number_id || value.phone_number_id;
  const clauses = [];

  if (wabaId) clauses.push({ "meta.wabaId": wabaId });
  if (phoneNumberId) clauses.push({ "meta.phoneNumberId": phoneNumberId });

  const tenant = clauses.length
    ? await Tenant.findOne({ $or: clauses })
    : null;

  return {
    tenant,
    wabaId,
    phoneNumberId
  };
}

function mapTemplateStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "active"].includes(normalized)) return "approved";
  if (["rejected"].includes(normalized)) return "rejected";
  if (["paused"].includes(normalized)) return "paused";
  if (["disabled"].includes(normalized)) return "disabled";
  if (["pending", "in_review"].includes(normalized)) return "in_review";

  return "in_review";
}

async function processTemplateStatus(tenantId, value) {
  const templateName = value.message_template_name || value.name;
  const metaTemplateId = value.message_template_id || value.id;
  const status = mapTemplateStatus(value.event || value.status);
  const qualityRating = String(value.reason || value.quality_score?.score || "unknown").toLowerCase();
  const rejectedReason = value.rejected_reason || value.reason_info?.reason || value.reason || "";

  if (!templateName && !metaTemplateId) {
    return;
  }

  const filter = {
    tenantId,
    $or: [
      templateName ? { name: templateName } : null,
      metaTemplateId ? { metaTemplateId } : null
    ].filter(Boolean)
  };

  await Template.findOneAndUpdate(
    filter,
    {
      $set: {
        status,
        ...(qualityRating ? { qualityRating: ["high", "medium", "low"].includes(qualityRating) ? qualityRating : "unknown" } : {}),
        ...(metaTemplateId ? { metaTemplateId } : {}),
        rejectedReason
      }
    },
    { returnDocument: "after" }
  );
}

async function processMessageStatuses(tenantId, statuses = []) {
  for (const status of statuses) {
    const metaMessageId = status.id;
    const mappedStatus = ["sent", "delivered", "read", "failed"].includes(status.status)
      ? status.status
      : "sent";

    if (!metaMessageId) continue;
    const error = status.errors?.[0];
    const errorMessage = error
      ? [error.code, error.title || error.message, error.error_data?.details]
        .filter(Boolean)
        .join(" - ")
      : "";

    await Message.findOneAndUpdate(
      { tenantId, metaMessageId },
      {
        $set: {
          status: mappedStatus,
          ...(errorMessage ? { error: errorMessage } : {})
        }
      }
    );
  }
}

async function processPhoneNameUpdate(tenantId, value = {}) {
  const displayPhoneNumber = String(value.display_phone_number || "").replace(/^\+/, "");
  const requestedName = value.requested_verified_name || value.verified_name || "";

  const filter = {
    tenantId,
    ...(displayPhoneNumber ? { "meta.displayPhoneNumber": new RegExp(`${displayPhoneNumber}$`) } : {})
  };

  await Tenant.findOneAndUpdate(
    filter,
    {
      $set: {
        ...(requestedName ? { "meta.verifiedName": requestedName } : {}),
        ...(value.decision ? { "meta.displayNameDecision": value.decision } : {}),
        ...(value.rejection_reason ? { "meta.displayNameRejectionReason": value.rejection_reason } : {})
      }
    }
  );
}

async function processChange(entry, change, payload) {
  const { tenant, wabaId, phoneNumberId } = await resolveTenant(entry, change);
  const eventType = extractEventType(change);

  const event = await WebhookEvent.create({
    tenantId: tenant?._id,
    object: payload.object,
    eventType,
    wabaId,
    phoneNumberId,
    payload: change,
    status: "received"
  });

  try {
    if (tenant && eventType === "message_template_status_update") {
      await processTemplateStatus(tenant._id, change.value || {});
    }

    if (tenant && eventType === "phone_number_name_update") {
      await processPhoneNameUpdate(tenant._id, change.value || {});
    }

    if (tenant && change.value?.statuses?.length) {
      await processMessageStatuses(tenant._id, change.value.statuses);
    }

    event.status = "processed";
    await event.save();
  } catch (error) {
    event.status = "failed";
    event.error = error.message;
    await event.save();
    throw error;
  }
}

async function processMetaWebhook(req) {
  verifyMetaSignature(req);

  const payload = req.body;
  const entries = payload.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      await processChange(entry, change, payload);
    }
  }
}

module.exports = {
  getMetaWebhookSetup,
  verifyMetaChallenge,
  processMetaWebhook
};
