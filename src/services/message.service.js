const Contact = require("../models/Contact");
const ContactSegment = require("../models/ContactSegment");
const Message = require("../models/Message");
const MediaAsset = require("../models/MediaAsset");
const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const mongoose = require("mongoose");
const crypto = require("crypto");
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

function normalizeSingleTag(tags, fallback = "") {
  const normalized = (Array.isArray(tags) ? tags : String(tags || fallback).split(","))
    .map((tag) => String(tag).trim())
    .filter(Boolean);
  const latestTag = normalized.at(-1);
  return latestTag ? [latestTag] : [];
}

function isMetaProvided555Number(value) {
  return /^\+?1\s*555[\s-]?/i.test(String(value || ""));
}

function buildTemplateComponents(message, template = {}) {
  const variables = message.variables || [];
  const components = [];

  if (template.headerType && template.headerType !== "none") {
    components.push({
      type: "header",
      parameters: [{
        type: template.headerType,
        [template.headerType]: {
          link: message.mediaUrl
        }
      }]
    });
  }

  if (template.category === "authentication") {
    components.push(
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
    );
    return components;
  }

  if (variables.length) {
    components.push({
      type: "body",
      parameters: variables.map((value) => ({
        type: "text",
        text: value
      }))
    });
  }
  return components.length ? components : undefined;
}

function assertSendMediaCompatible(asset, headerType) {
  if (!asset || asset.mediaType !== headerType) {
    throw new HttpError(400, `Choose a ${headerType} from the Media Library for this template`);
  }
  const valid = headerType === "image"
    ? ["image/jpeg", "image/png"].includes(asset.mimeType)
    : ["video/mp4", "video/3gpp"].includes(asset.mimeType);
  if (!valid) {
    throw new HttpError(400, headerType === "image"
      ? "WhatsApp image headers require a JPG or PNG asset"
      : "WhatsApp video headers require an MP4 or 3GP asset");
  }
  const maximumBytes = headerType === "image" ? 5 * 1024 * 1024 : 16 * 1024 * 1024;
  if (Number(asset.bytes || 0) > maximumBytes) {
    throw new HttpError(400, `WhatsApp ${headerType} headers must be ${headerType === "image" ? "5" : "16"} MB or smaller`);
  }
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

function personalizeVariables(variables, contact) {
  return variables.map((value) => String(value).replace(
    /\{\{\s*(?:contact\.)?(name|phone|email|city|tag)\s*\}\}/gi,
    (match, field) => {
      const normalizedField = field.toLowerCase();
      if (normalizedField === "tag") return String(contact?.tags?.[0] || "");
      return String(contact?.[normalizedField] || "");
    }
  ));
}

function hasResolvedTemplateVariables(variables, contact) {
  return personalizeVariables(variables, contact).every((value) => String(value).trim());
}

async function resolveTemplateSendContext(tenantId, body = {}, options = {}) {
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
  if (language) templateFilter.language = language;

  const [tenant, template] = await Promise.all([
    Tenant.findById(tenantId).select("+meta.accessToken"),
    Template.findOne(templateFilter).select("name language category status body parameterCount headerType headerMediaId").lean()
  ]);

  if (!template) {
    throw new HttpError(400, language
      ? `Select a Meta-approved template for language ${language}`
      : "Select a Meta-approved template");
  }
  if (!options.perRecipientVariables) {
    assertTemplateParameterCount(template, variables);
  }

  let mediaAsset = null;
  if (template.headerType && template.headerType !== "none") {
    const mediaId = String(body.mediaId || body.media_id || template.headerMediaId || "").trim();
    if (!mediaId) {
      throw new HttpError(400, `This template requires a ${template.headerType} from the Media Library`);
    }
    mediaAsset = await MediaAsset.findOne({ tenantId, mediaId }).lean();
    assertSendMediaCompatible(mediaAsset, template.headerType);
  }

  const accessToken = tenant?.getMetaAccessToken();
  if (!tenant?.meta?.phoneNumberId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. Phone number ID and Meta access token are required before sending messages.");
  }

  return {
    tenant,
    template,
    templateName,
    language: language || template.language || "en",
    variables: options.perRecipientVariables ? [] : variables,
    mediaAsset
  };
}

function buildQueuedMessage(context, tenantId, contact, extra = {}) {
  return {
    tenantId,
    contactId: contact._id,
    to: contact.phone,
    wabaId: context.tenant.meta.wabaId,
    phoneNumberId: context.tenant.meta.phoneNumberId,
    templateName: context.templateName,
    language: context.language,
    variables: personalizeVariables(context.variables, contact),
    ...(context.mediaAsset ? {
      mediaId: context.mediaAsset.mediaId,
      mediaType: context.mediaAsset.mediaType,
      mediaUrl: context.mediaAsset.secureUrl
    } : {}),
    status: "queued",
    nextAttemptAt: new Date(),
    maxAttempts: env.messageQueueMaxRetries,
    ...extra
  };
}

function normalizeBulkSelection(body = {}) {
  const contactIds = [...new Set(
    (Array.isArray(body.contactIds) ? body.contactIds : [])
      .map((value) => String(value).trim())
      .filter(Boolean)
  )];
  const groupIds = [...new Set(
    (Array.isArray(body.groupIds) ? body.groupIds : [])
      .map((value) => String(value).trim())
      .filter(Boolean)
  )];

  if (!contactIds.length && !groupIds.length) {
    throw new HttpError(400, "Select at least one contact or group");
  }
  if ([...contactIds, ...groupIds].some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new HttpError(400, "One or more selected contacts or groups are invalid");
  }
  return { contactIds, groupIds };
}

async function resolveBulkRecipients(tenantId, body = {}) {
  const { contactIds, groupIds } = normalizeBulkSelection(body);
  const groups = groupIds.length
    ? await ContactSegment.find({ tenantId, _id: { $in: groupIds } }).select("_id tag name").lean()
    : [];
  if (groups.length !== groupIds.length) {
    throw new HttpError(400, "One or more selected groups no longer exist");
  }

  const recipientClauses = [];
  if (contactIds.length) recipientClauses.push({ _id: { $in: contactIds } });
  const groupTags = groups.map((group) => group.tag).filter(Boolean);
  if (groupTags.length) recipientClauses.push({ tags: { $in: groupTags } });

  const selectedContacts = await Contact.find({
    tenantId,
    $or: recipientClauses
  }).select("_id name phone status optIn tags").lean();
  const eligibleContacts = selectedContacts.filter(
    (contact) => contact.status === "active" && contact.optIn?.status
  );
  if (!eligibleContacts.length) {
    throw new HttpError(400, "No active opted-in contacts were found in this selection");
  }
  if (eligibleContacts.length > 500) {
    throw new HttpError(400, "A bulk send can include at most 500 eligible contacts");
  }

  const foundDirectIds = new Set(selectedContacts.map((contact) => String(contact._id)));
  const missingDirectCount = contactIds.filter((id) => !foundDirectIds.has(id)).length;
  return {
    contactIds,
    groupIds,
    selectedContacts,
    eligibleContacts,
    missingDirectCount,
    ineligibleCount: selectedContacts.length - eligibleContacts.length
  };
}

function buildRecipientVariableMap(rows, expectedCount) {
  if (!expectedCount) return new Map();
  if (expectedCount > 10) {
    throw new HttpError(400, "Bulk CSV sending supports templates with a maximum of 10 variables");
  }
  if (!Array.isArray(rows) || !rows.length) {
    throw new HttpError(400, "Upload recipient variable data keyed by phone number");
  }
  if (rows.length > 1000) {
    throw new HttpError(400, "Recipient variable data can contain at most 1000 rows");
  }

  const variableMap = new Map();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const phone = normalizePhone(row?.phone);
    const variables = Array.isArray(row?.variables)
      ? row.variables.map((value) => String(value ?? "").trim())
      : [];
    if (!/^\d{11,15}$/.test(phone)) {
      throw new HttpError(400, `Variable row ${rowNumber} has an invalid phone number`);
    }
    if (variableMap.has(phone)) {
      throw new HttpError(400, `Phone ${phone} appears more than once in the variable data`);
    }
    if (variables.length !== expectedCount || variables.some((value) => !value)) {
      throw new HttpError(400, `Variable row ${rowNumber} must contain all ${expectedCount} template values`);
    }
    if (variables.some((value) => value.length > 300)) {
      throw new HttpError(400, `Variable row ${rowNumber} contains a value longer than 300 characters`);
    }
    variableMap.set(phone, variables);
  });
  return variableMap;
}

async function listBulkRecipients(tenantId, body = {}) {
  const result = await resolveBulkRecipients(tenantId, body);
  return {
    contacts: result.eligibleContacts.map((contact) => ({
      id: String(contact._id),
      name: contact.name,
      phone: contact.phone
    })),
    eligibleCount: result.eligibleContacts.length,
    skippedCount: result.ineligibleCount + result.missingDirectCount
  };
}

function renderTemplateBody(body, variables) {
  return String(body || "").replace(/\{\{\s*(\d+)\s*\}\}/g, (match, position) => (
    variables[Number(position) - 1] ?? match
  ));
}

async function previewBulkTemplateMessages(tenantId, body = {}) {
  const templateName = String(body.templateName || body.template_name || "").trim();
  const language = String(body.language || "").trim();
  if (!templateName) throw new HttpError(400, "Select an approved template");

  const templateFilter = { tenantId, name: templateName, status: "approved" };
  if (language) templateFilter.language = language;
  const [template, recipients] = await Promise.all([
    Template.findOne(templateFilter).select("name language category body parameterCount headerType").lean(),
    resolveBulkRecipients(tenantId, body)
  ]);
  if (!template) throw new HttpError(400, "The selected template is not approved or no longer exists");

  const expectedVariableCount = Number(template.parameterCount || 0);
  const recipientVariableMap = buildRecipientVariableMap(body.recipientVariables, expectedVariableCount);
  const tags = [...new Set(recipients.eligibleContacts.flatMap((contact) => contact.tags || []).filter(Boolean))];
  const segments = tags.length
    ? await ContactSegment.find({ tenantId, tag: { $in: tags } }).select("name tag").lean()
    : [];
  const groupByTag = new Map(segments.map((segment) => [segment.tag, segment.name]));
  const selectedPhones = new Set(recipients.eligibleContacts.map((contact) => normalizePhone(contact.phone)));

  const rows = recipients.eligibleContacts.map((contact) => {
    const phone = normalizePhone(contact.phone);
    const variables = expectedVariableCount ? recipientVariableMap.get(phone) || [] : [];
    const matched = !expectedVariableCount || variables.length === expectedVariableCount;
    const tag = contact.tags?.[0] || "";
    return {
      contactId: String(contact._id),
      phone,
      name: contact.name || "",
      group: groupByTag.get(tag) || "",
      tag,
      variables,
      matched,
      finalMessage: matched ? renderTemplateBody(template.body, variables) : ""
    };
  });

  return {
    template: {
      name: template.name,
      language: template.language,
      category: template.category,
      headerType: template.headerType || "none",
      parameterCount: expectedVariableCount
    },
    rows,
    summary: {
      selectedCount: rows.length,
      matchedCount: rows.filter((row) => row.matched).length,
      missingCount: rows.filter((row) => !row.matched).length,
      unmatchedVariableRowCount: [...recipientVariableMap.keys()].filter((phone) => !selectedPhones.has(phone)).length,
      skippedContactCount: recipients.ineligibleCount + recipients.missingDirectCount
    }
  };
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

    const contact = await Contact.findOne({ _id: contactId, tenantId }).select("phone name email city tags status optIn").lean();
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
        tags: normalizeSingleTag(body.tags, "api"),
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

  const components = buildTemplateComponents(message, template);
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
  const idempotencyKey = getIdempotencyKey(body);
  const context = await resolveTemplateSendContext(tenantId, body);

  if (idempotencyKey) {
    const existingMessage = await Message.findOne({ tenantId, idempotencyKey }).lean();
    if (existingMessage) {
      return {
        queued: true,
        message: existingMessage
      };
    }
  }

  const contact = await resolveContact(tenantId, body);

  if (contact.status !== "active" || !contact.optIn?.status) {
    throw new HttpError(400, "Only active opted-in contacts can receive WhatsApp messages");
  }
  if (!hasResolvedTemplateVariables(context.variables, contact)) {
    throw new HttpError(400, "This contact is missing data required by the selected template variable mapping");
  }

  const message = await Message.create({
    ...buildQueuedMessage(context, tenantId, contact),
    ...(idempotencyKey ? { idempotencyKey } : {})
  });

  return {
    queued: true,
    message
  };
}

async function sendTemplateMessages(tenantId, body = {}) {
  const context = await resolveTemplateSendContext(tenantId, body, { perRecipientVariables: true });
  const recipients = await resolveBulkRecipients(tenantId, body);
  const expectedVariableCount = Number(context.template.parameterCount || 0);
  const recipientVariableMap = buildRecipientVariableMap(body.recipientVariables, expectedVariableCount);
  const sendableContacts = expectedVariableCount
    ? recipients.eligibleContacts.filter((contact) => recipientVariableMap.has(normalizePhone(contact.phone)))
    : recipients.eligibleContacts;
  const missingVariableCount = recipients.eligibleContacts.length - sendableContacts.length;
  if (!sendableContacts.length) {
    throw new HttpError(400, "No selected contact has a matching phone row in the recipient variable data");
  }
  if (missingVariableCount) {
    throw new HttpError(
      400,
      `${missingVariableCount} selected recipient${missingVariableCount === 1 ? " does" : "s do"} not have a matching phone row in the variable data`,
      { code: "RECIPIENT_VARIABLE_ROWS_MISSING", missingVariableCount }
    );
  }
  const selectedPhones = new Set(recipients.selectedContacts.map((contact) => normalizePhone(contact.phone)));
  const unmatchedVariableRowCount = [...recipientVariableMap.keys()]
    .filter((phone) => !selectedPhones.has(phone))
    .length;
  const batchId = `BATCH-${crypto.randomUUID()}`;
  const messages = await Message.insertMany(
    sendableContacts.map((contact) => buildQueuedMessage(context, tenantId, contact, {
      batchId,
      variables: expectedVariableCount
        ? recipientVariableMap.get(normalizePhone(contact.phone))
        : []
    })),
    { ordered: false }
  );

  return {
    batchId,
    requestedContactCount: recipients.contactIds.length,
    requestedGroupCount: recipients.groupIds.length,
    selectedCount: recipients.selectedContacts.length + recipients.missingDirectCount,
    queuedCount: messages.length,
    skippedCount: recipients.ineligibleCount + recipients.missingDirectCount + missingVariableCount,
    missingVariableCount,
    unmatchedVariableRowCount,
    messageIds: messages.map((message) => String(message._id))
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
    }).select("name language category status body parameterCount headerType").lean()
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

  if (template.headerType && template.headerType !== "none" && !message.mediaUrl) {
    return failMessage(message, `Template "${message.templateName}" requires a ${template.headerType}, but this queued message has no media.`);
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
  buildMetaMessagePayload,
  getMessage,
  listBulkRecipients,
  listMessages,
  previewBulkTemplateMessages,
  processNextQueuedMessage,
  summarizeMessages,
  sendTemplateMessage,
  sendTemplateMessages
};
