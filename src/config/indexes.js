const Tenant = require("../models/Tenant");
const Message = require("../models/Message");
const WebhookEvent = require("../models/WebhookEvent");
const Payment = require("../models/Payment");
const RecipientUsage = require("../models/RecipientUsage");
const OnboardingSession = require("../models/OnboardingSession");
const Contact = require("../models/Contact");

function sameKey(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function assertNoDuplicates(model, fields) {
  const fieldList = Array.isArray(fields) ? fields : [fields];
  const match = Object.fromEntries(fieldList.map((field) => [
    field,
    field === "tenantId" ? { $exists: true } : { $type: "string", $gt: "" }
  ]));
  const groupId = fieldList.length === 1
    ? `$${fieldList[0]}`
    : Object.fromEntries(fieldList.map((field) => [field.replace(/\./g, "_"), `$${field}`]));
  const duplicates = await model.aggregate([
    { $match: match },
    { $group: { _id: groupId, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 }
  ]);
  if (duplicates.length) {
    throw new Error(`Cannot create a unique index for ${model.modelName}.${fieldList.join("+")}: duplicate values exist`);
  }
}

async function ensureIndex(model, key, options) {
  const indexes = await model.collection.indexes();
  const existing = indexes.find((index) => sameKey(index.key, key));
  const correct = existing
    && Boolean(existing.unique) === Boolean(options.unique)
    && (
      !Object.prototype.hasOwnProperty.call(options, "expireAfterSeconds")
      || existing.expireAfterSeconds === options.expireAfterSeconds
    );
  if (correct) return;

  if (existing && existing.name !== "_id_") {
    try {
      await model.collection.dropIndex(existing.name);
    } catch (error) {
      if (error.code !== 27 && error.codeName !== "IndexNotFound") throw error;
    }
  }
  try {
    await model.collection.createIndex(key, options);
  } catch (error) {
    if (error.codeName !== "IndexOptionsConflict" && error.codeName !== "IndexKeySpecsConflict") {
      throw error;
    }
  }
}

async function ensureCriticalIndexes() {
  await Promise.all([
    assertNoDuplicates(Tenant, "meta.wabaId"),
    assertNoDuplicates(Tenant, "meta.phoneNumberId"),
    assertNoDuplicates(Message, ["tenantId", "metaMessageId"])
  ]);

  await ensureIndex(Tenant, { "meta.wabaId": 1 }, {
    name: "uniq_tenant_meta_waba",
    unique: true,
    partialFilterExpression: { "meta.wabaId": { $type: "string", $gt: "" } }
  });
  await ensureIndex(Tenant, { "meta.phoneNumberId": 1 }, {
    name: "uniq_tenant_meta_phone",
    unique: true,
    partialFilterExpression: { "meta.phoneNumberId": { $type: "string", $gt: "" } }
  });
  await ensureIndex(Message, { tenantId: 1, metaMessageId: 1 }, {
    name: "uniq_tenant_meta_message",
    unique: true,
    partialFilterExpression: { metaMessageId: { $type: "string", $gt: "" } }
  });
  await ensureIndex(Message, { status: 1, lockedAt: 1 }, { name: "message_stale_locks" });
  await ensureIndex(WebhookEvent, { provider: 1, eventKey: 1 }, {
    name: "uniq_provider_webhook_event",
    unique: true,
    partialFilterExpression: { eventKey: { $type: "string", $gt: "" } }
  });
  await ensureIndex(WebhookEvent, { status: 1, nextAttemptAt: 1, createdAt: 1 }, {
    name: "webhook_queue_claim"
  });
  await ensureIndex(WebhookEvent, { createdAt: 1 }, {
    name: "webhook_retention",
    expireAfterSeconds: Math.max(1, Number(require("./env").webhookRetentionDays || 30)) * 24 * 60 * 60
  });
  await ensureIndex(Payment, { provider: 1, providerPaymentId: 1 }, {
    name: "uniq_provider_payment",
    unique: true
  });
  await ensureIndex(Payment, { provider: 1, providerOrderId: 1 }, {
    name: "uniq_provider_order",
    unique: true
  });
  await ensureIndex(RecipientUsage, { tenantId: 1, phoneNumberId: 1, recipient: 1 }, {
    name: "uniq_recipient_usage",
    unique: true
  });
  await ensureIndex(RecipientUsage, { tenantId: 1, phoneNumberId: 1, lastAcceptedAt: 1 }, {
    name: "recipient_usage_window"
  });
  await ensureIndex(RecipientUsage, { lastAcceptedAt: 1 }, {
    name: "recipient_usage_retention",
    expireAfterSeconds: 2 * 24 * 60 * 60
  });
  await ensureIndex(OnboardingSession, { stateHash: 1 }, {
    name: "uniq_onboarding_state",
    unique: true
  });
  await ensureIndex(OnboardingSession, { expiresAt: 1 }, {
    name: "onboarding_session_retention",
    expireAfterSeconds: 0
  });
  await ensureIndex(Contact, { tenantId: 1, status: 1, tags: 1 }, {
    name: "contact_status_tags"
  });
}

module.exports = {
  ensureCriticalIndexes
};
