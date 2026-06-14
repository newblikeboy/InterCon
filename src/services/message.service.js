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

function buildTemplateComponents(variables) {
  if (!variables.length) return undefined;

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

async function sendTemplateMessage(tenantId, body = {}) {
  await requireActivePaidPlan(tenantId);

  const templateName = String(body.templateName || body.template_name || "").trim();
  const language = String(body.language || "").trim();
  const variables = normalizeVariables(body.variables ?? body.parameters ?? body.templateParams);

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
    Template.findOne(templateFilter).select("name language status body parameterCount").lean()
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

  await assertWabaCanSendTemplates(tenant, accessToken);

  const message = await Message.create({
    tenantId,
    contactId: contact._id,
    to: contact.phone,
    templateName,
    language,
    variables,
    status: "queued"
  });

  const payload = {
    messaging_product: "whatsapp",
    to: contact.phone.replace(/^\+/, ""),
    type: "template",
    template: {
      name: template.name,
      language: {
        code: language || template.language || "en"
      }
    }
  };

  const components = buildTemplateComponents(variables);
  if (components) {
    payload.template.components = components;
  }

  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    message.status = "failed";
    const metaError = metaResponse.error || {};
    if (Number(metaError.code) === 133010) {
      message.error = "Phone number is not registered for WhatsApp Cloud API. Register the connected phone number before sending messages.";
    } else if (Number(metaError.code) === 131058) {
      message.error = "Meta's hello_world sample template can only be sent from public test numbers. Create and use your own approved template for this WhatsApp number.";
    } else if (Number(metaError.code) === 131037) {
      message.error = "Meta blocked this send with display-name approval error. Open Connect WhatsApp, click Sync registration, then retry. If it still fails, resolve the Business verification request in Meta.";
    } else {
      message.error = metaError.message || "Meta message send failed";
    }
    await message.save();
    throw new HttpError(response.status, message.error, metaError || metaResponse);
  }

  message.status = "accepted";
  message.metaMessageId = metaResponse.messages?.[0]?.id || "";
  await message.save();

  return {
    message,
    meta: metaResponse
  };
}

module.exports = {
  getMessage,
  listMessages,
  summarizeMessages,
  sendTemplateMessage
};
