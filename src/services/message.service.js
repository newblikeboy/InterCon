const Contact = require("../models/Contact");
const Message = require("../models/Message");
const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const mongoose = require("mongoose");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { isMetaSampleTemplate } = require("./template.service");
const { requireActivePaidPlan } = require("./billing.service");

const wabaSendHealthCache = new Map();
const WABA_SEND_HEALTH_TTL_MS = 30 * 1000;

function normalizeVariables(variables) {
  if (Array.isArray(variables)) {
    return variables.map((value) => String(value).trim()).filter(Boolean);
  }

  return String(variables || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "").trim();

  if (/^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }

  return digits;
}

function isMetaProvided555Number(value) {
  return /^\+?1\s*555[\s-]?/i.test(String(value || ""));
}

function buildTemplateComponents(variables, template = {}) {
  if (!variables.length) return undefined;

  if (template.category === "authentication") {
    return [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: variables[0]
          }
        ]
      },
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          {
            type: "text",
            text: variables[0]
          }
        ]
      }
    ];
  }

  return [{
    type: "body",
    parameters: variables.map((value) => ({
      type: "text",
      text: value
    }))
  }];
}

function assertTemplateParameterCount(template, variables) {
  if (!Number.isInteger(template.parameterCount)) return;

  const expectedCount = template.parameterCount;
  if (variables.length === expectedCount) return;

  throw new HttpError(
    400,
    `Template "${template.name}" expects ${expectedCount} body parameter${expectedCount === 1 ? "" : "s"}, but ${variables.length} ${variables.length === 1 ? "was" : "were"} provided.`,
    {
      code: "TEMPLATE_PARAMETER_COUNT_MISMATCH",
      expectedCount,
      providedCount: variables.length,
      templateName: template.name,
      language: template.language
    }
  );
}

async function assertWabaCanSendTemplates(tenant, accessToken) {
  if (!tenant?.meta?.wabaId || !accessToken) return;

  const cacheKey = String(tenant.meta.wabaId);
  const cached = wabaSendHealthCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = fetchWabaCanSendTemplates(tenant, accessToken).catch((error) => {
    wabaSendHealthCache.delete(cacheKey);
    throw error;
  });

  wabaSendHealthCache.set(cacheKey, {
    expiresAt: Date.now() + WABA_SEND_HEALTH_TTL_MS,
    promise
  });

  return promise;
}

async function fetchWabaCanSendTemplates(tenant, accessToken) {
  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.wabaId}?fields=health_status`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(response.status || 400, data.error?.message || "Unable to verify WABA health before sending", data.error || data);
  }

  const entities = data.health_status?.entities || [];
  const wabaEntity = entities.find((entity) => String(entity.entity_type || "").toUpperCase() === "WABA");
  const paymentError = wabaEntity?.errors?.find((error) => {
    const description = `${error.error_description || ""} ${error.possible_solution || ""}`.toLowerCase();
    return description.includes("payment method") || description.includes("payment");
  });

  if (paymentError) {
    wabaSendHealthCache.delete(String(tenant.meta.wabaId));
    throw new HttpError(403, paymentError.possible_solution || "Add a valid payment method in WhatsApp Manager before sending template messages.", paymentError);
  }
}

function buildMessageFilter(tenantId, query = {}) {
  const filter = { tenantId };

  if (query.status) {
    filter.status = String(query.status).trim();
  }

  if (query.to || query.phone || query.mobile) {
    filter.to = normalizePhone(query.to || query.phone || query.mobile);
  }

  if (query.from || query.to_date || query.until) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to_date || query.until) filter.createdAt.$lte = new Date(query.to_date || query.until);
  }

  return filter;
}

async function listMessages(tenantId, query = {}) {
  const limit = Math.min(Number(query.limit) || 100, 500);
  return Message.find(buildMessageFilter(tenantId, query)).sort({ createdAt: -1 }).limit(limit).lean();
}

async function getMessage(tenantId, messageId) {
  const clauses = [{ metaMessageId: messageId }];
  if (mongoose.Types.ObjectId.isValid(messageId)) {
    clauses.push({ _id: messageId });
  }

  const message = await Message.findOne({ tenantId, $or: clauses }).lean();

  if (!message) {
    throw new HttpError(404, "Message not found");
  }

  return message;
}

function summarizeMessages(messages = []) {
  return messages.reduce((summary, message) => {
    const status = message.status || "queued";
    summary.total += 1;
    summary[status] = (summary[status] || 0) + 1;
    return summary;
  }, {
    total: 0,
    queued: 0,
    scheduled: 0,
    processing: 0,
    accepted: 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0
  });
}

async function resolveContact(tenantId, body) {
  const contactId = body.contactId || body.contact_id;
  if (contactId) {
    if (!mongoose.Types.ObjectId.isValid(contactId)) {
      throw new HttpError(400, "Contact ID is invalid");
    }

    const contact = await Contact.findOne({ _id: contactId, tenantId }).select("phone name status optIn").lean();
    if (!contact) {
      throw new HttpError(404, "Contact not found");
    }
    return contact;
  }

  const phone = normalizePhone(body.phone || body.mobile || body.whatsapp_number || body.to);
  if (!phone) {
    throw new HttpError(400, "Contact or customer phone number is required");
  }

  if (!/^\d{11,15}$/.test(phone)) {
    throw new HttpError(400, "Customer WhatsApp number must include country code, for example 919210699076");
  }

  const optInValue = body.optIn ?? body.opt_in ?? body.consent;
  const hasOptIn = optInValue === true || ["true", "yes", "1"].includes(String(optInValue).trim().toLowerCase());
  if (!hasOptIn) {
    throw new HttpError(400, "Customer WhatsApp opt-in is required before sending");
  }

  return Contact.findOneAndUpdate(
    { tenantId, phone },
    {
      $set: {
        tenantId,
        phone,
        name: String(body.name || body.customer_name || body.customerName || phone).trim(),
        email: body.email || "",
        city: body.city || "",
        source: body.source || "api",
        tags: Array.isArray(body.tags)
          ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
          : String(body.tags || "api").split(",").map((tag) => tag.trim()).filter(Boolean),
        optIn: {
          status: true,
          proof: body.optInProof || body.opt_in_proof || body.proof || "API consent flag",
          capturedAt: body.optInAt || body.opt_in_at ? new Date(body.optInAt || body.opt_in_at) : new Date()
        },
        status: "active"
      }
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

function getIdempotencyKey(body = {}) {
  return String(body.idempotencyKey || body.idempotency_key || body.requestId || body.request_id || "").trim();
}

function buildMetaMessagePayload(message, template) {
  const payload = {
    messaging_product: "whatsapp",
    to: message.to.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template.name,
      language: {
        code: message.language || template.language || "en"
      }
    }
  };

  const components = buildTemplateComponents(message.variables || [], template);
  if (components) {
    payload.template.components = components;
  }

  return payload;
}

function getMetaSendErrorMessage(metaError = {}, tenant = {}) {
  if (Number(metaError.code) === 133010) {
    return "Phone number is not registered for WhatsApp Cloud API. Register the connected phone number before sending messages.";
  }

  if (Number(metaError.code) === 131058) {
    return "Meta's hello_world sample template can only be sent from public test numbers. Create and use your own approved template for this WhatsApp number.";
  }

  if (Number(metaError.code) === 131037) {
    return isMetaProvided555Number(tenant.meta?.displayPhoneNumber)
      ? "Meta blocked this send because the sender is a Meta-provided +1 555 number without an approved display name. Use your own business phone number, or change/submit the 555 number display name in WhatsApp Manager and wait for approval."
      : "Meta blocked this send because the sender display name still needs approval. Check the phone number display name status in WhatsApp Manager, then refresh and retry.";
  }

  return metaError.message || "Meta message send failed";
}

function isRetryableMetaError(statusCode, metaError = {}) {
  const code = Number(metaError.code);
  return statusCode >= 500
    || [1, 2, 4, 17, 32, 613, 130429, 131048, 131056, 131057].includes(code);
}

function getRetryDelayMs(attempts) {
  const baseDelayMs = 30 * 1000;
  const maxDelayMs = 30 * 60 * 1000;
  return Math.min(baseDelayMs * Math.max(1, 2 ** Math.max(0, attempts - 1)), maxDelayMs);
}

async function sendTemplateMessage(tenantId, body = {}) {
  await requireActivePaidPlan(tenantId);

  const templateName = String(body.templateName || body.template_name || "").trim();
  const language = String(body.language || "").trim();
  const variables = normalizeVariables(body.variables ?? body.parameters ?? body.templateParams);
  const idempotencyKey = getIdempotencyKey(body);

  if (idempotencyKey) {
    const existingMessage = await Message.findOne({ tenantId, idempotencyKey }).lean();
    if (existingMessage) {
      return {
        queued: true,
        message: existingMessage
      };
    }
  }

  if (!templateName) {
    throw new HttpError(400, "Approved template is required");
  }

  if (isMetaSampleTemplate(templateName)) {
    throw new HttpError(400, "Meta's hello_world sample template can only be sent from public test numbers. Create and use your own approved template for this WhatsApp number.", { code: 131058 });
  }

  const templateFilter = {
    tenantId,
    name: templateName,
    status: "approved"
  };

  if (language) {
    templateFilter.language = language;
  }

  const [tenant, contact, template] = await Promise.all([
    Tenant.findById(tenantId).select("+meta.accessToken"),
    resolveContact(tenantId, body),
    Template.findOne(templateFilter).select("name language category status body parameterCount").lean()
  ]);

  if (contact.status !== "active" || !contact.optIn?.status) {
    throw new HttpError(400, "Only active opted-in contacts can receive WhatsApp messages");
  }

  if (!template) {
    throw new HttpError(400, language
      ? `Select a Meta-approved template for language ${language}`
      : "Select a Meta-approved template");
  }

  assertTemplateParameterCount(template, variables);

  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant?.meta?.phoneNumberId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. Phone number ID and Meta access token are required before sending messages.");
  }

  const message = await Message.create({
    tenantId,
    contactId: contact._id,
    to: contact.phone,
    wabaId: tenant.meta.wabaId,
    phoneNumberId: tenant.meta.phoneNumberId,
    templateName,
    language: language || template.language || "en",
    variables,
    status: "queued",
    nextAttemptAt: new Date(),
    maxAttempts: env.messageQueueMaxRetries,
    ...(idempotencyKey ? { idempotencyKey } : {})
  });

  return {
    queued: true,
    message
  };
}

async function hasDailyUniqueCapacity(message) {
  if (!env.whatsappDailyUniqueLimit || env.whatsappDailyUniqueLimit <= 0) return true;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentStatuses = ["accepted", "sent", "delivered", "read"];
  const distinctRecipients = await Message.distinct("to", {
    tenantId: message.tenantId,
    phoneNumberId: message.phoneNumberId,
    status: { $in: sentStatuses },
    acceptedAt: { $gte: since }
  });

  return distinctRecipients.includes(message.to) || distinctRecipients.length < env.whatsappDailyUniqueLimit;
}

async function getPairDelayMs(message) {
  if (!env.whatsappPairMinIntervalMs || env.whatsappPairMinIntervalMs <= 0) return 0;

  const lastMessage = await Message.findOne({
    tenantId: message.tenantId,
    to: message.to,
    _id: { $ne: message._id },
    lastAttemptAt: { $exists: true }
  }).sort({ lastAttemptAt: -1 }).select("lastAttemptAt").lean();

  if (!lastMessage?.lastAttemptAt) return 0;

  const elapsedMs = Date.now() - new Date(lastMessage.lastAttemptAt).getTime();
  return Math.max(env.whatsappPairMinIntervalMs - elapsedMs, 0);
}

async function rescheduleMessage(message, delayMs, error = "") {
  const nextAttemptAt = new Date(Date.now() + Math.max(delayMs, 1000));
  await Message.updateOne(
    { _id: message._id },
    {
      $set: {
        status: "scheduled",
        nextAttemptAt,
        lockedAt: null,
        lockedBy: "",
        ...(error ? { error } : {})
      }
    }
  );

  return {
    action: "scheduled",
    messageId: message._id,
    nextAttemptAt
  };
}

async function failMessage(message, error, metaError = {}) {
  await Message.updateOne(
    { _id: message._id },
    {
      $set: {
        status: "failed",
        error,
        metaErrorCode: metaError.code ? String(metaError.code) : "",
        lockedAt: null,
        lockedBy: ""
      }
    }
  );

  return {
    action: "failed",
    messageId: message._id,
    phoneNumberId: message.phoneNumberId,
    error
  };
}

async function acceptMessage(message, metaResponse = {}) {
  const metaMessageId = metaResponse.messages?.[0]?.id || "";
  await Message.updateOne(
    { _id: message._id },
    {
      $set: {
        status: "accepted",
        metaMessageId,
        acceptedAt: new Date(),
        lockedAt: null,
        lockedBy: "",
        error: ""
      }
    }
  );

  return {
    action: "accepted",
    messageId: message._id,
    phoneNumberId: message.phoneNumberId,
    metaMessageId
  };
}

async function claimNextQueuedMessage(workerId) {
  const now = new Date();
  const staleLockCutoff = new Date(Date.now() - env.messageQueueLockMs);

  return Message.findOneAndUpdate(
    {
      $or: [
        {
          status: { $in: ["queued", "scheduled"] },
          nextAttemptAt: { $lte: now }
        },
        {
          status: "processing",
          lockedAt: { $lt: staleLockCutoff }
        }
      ]
    },
    {
      $set: {
        status: "processing",
        lockedAt: now,
        lockedBy: workerId
      }
    },
    {
      returnDocument: "after",
      sort: { nextAttemptAt: 1, createdAt: 1 }
    }
  ).lean();
}

async function processQueuedMessage(message) {
  const [tenant, template] = await Promise.all([
    Tenant.findById(message.tenantId).select("+meta.accessToken"),
    Template.findOne({
      tenantId: message.tenantId,
      name: message.templateName,
      language: message.language,
      status: "approved"
    }).select("name language category status body parameterCount").lean()
  ]);

  if (!tenant) {
    return failMessage(message, "Tenant not found for queued message.");
  }

  const accessToken = tenant.getMetaAccessToken();
  if (!tenant.meta?.phoneNumberId || !accessToken) {
    return failMessage(message, "Connect WhatsApp first. Phone number ID and Meta access token are required before sending messages.");
  }

  if (!template) {
    return failMessage(message, `Template "${message.templateName}" is not approved for language ${message.language}.`);
  }

  if (!await hasDailyUniqueCapacity(message)) {
    return rescheduleMessage(
      message,
      15 * 60 * 1000,
      `Daily unique customer limit reached for this phone. Message will retry automatically. Current safety limit: ${env.whatsappDailyUniqueLimit}.`
    );
  }

  const pairDelayMs = await getPairDelayMs(message);
  if (pairDelayMs > 0) {
    return rescheduleMessage(message, pairDelayMs, "Waiting to avoid sending too many messages to the same customer too quickly.");
  }

  await assertWabaCanSendTemplates(tenant, accessToken);

  const attempts = Number(message.attempts || 0) + 1;
  await Message.updateOne(
    { _id: message._id },
    {
      $set: {
        attempts,
        lastAttemptAt: new Date(),
        wabaId: tenant.meta.wabaId,
        phoneNumberId: tenant.meta.phoneNumberId
      }
    }
  );

  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildMetaMessagePayload(message, template))
  });

  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const metaError = metaResponse.error || {};
    const errorMessage = getMetaSendErrorMessage(metaError, tenant);

    if (isRetryableMetaError(response.status, metaError) && attempts < message.maxAttempts) {
      return rescheduleMessage(message, getRetryDelayMs(attempts), errorMessage);
    }

    return failMessage(message, errorMessage, metaError);
  }

  return acceptMessage(message, metaResponse);
}

async function processNextQueuedMessage(workerId) {
  const message = await claimNextQueuedMessage(workerId);
  if (!message) return null;

  try {
    return await processQueuedMessage(message);
  } catch (error) {
    const attempts = Number(message.attempts || 0) + 1;
    const errorDetails = error.details || {};
    await Message.updateOne(
      { _id: message._id },
      {
        $set: {
          attempts,
          lastAttemptAt: new Date()
        }
      }
    );

    if (isRetryableMetaError(error.statusCode || 500, errorDetails) && attempts < Number(message.maxAttempts || env.messageQueueMaxRetries)) {
      return rescheduleMessage(message, getRetryDelayMs(attempts), error.message);
    }

    if ((!error.statusCode || error.statusCode >= 500) && attempts < Number(message.maxAttempts || env.messageQueueMaxRetries)) {
      return rescheduleMessage(message, getRetryDelayMs(attempts), error.message);
    }

    return failMessage(message, error.message, errorDetails);
  }
}

module.exports = {
  getMessage,
  listMessages,
  processNextQueuedMessage,
  summarizeMessages,
  sendTemplateMessage
};
