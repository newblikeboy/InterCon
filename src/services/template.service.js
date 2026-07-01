const mongoose = require("mongoose");
const Template = require("../models/Template");
const MediaAsset = require("../models/MediaAsset");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { requireActivePaidPlan } = require("./billing.service");

const templateSyncCache = new Map();
const TEMPLATE_SYNC_TTL_MS = 30 * 1000;
const TEMPLATE_STALE_GRACE_MS = 5 * 60 * 1000;
const AUTHENTICATION_CODE_EXPIRATION_MINUTES = 10;
const AUTHENTICATION_TEMPLATE_BODY = `{{1}} is your verification code. For your security, do not share this code. This code expires in ${AUTHENTICATION_CODE_EXPIRATION_MINUTES} minutes.`;

function normalizeCategory(category) {
  const normalized = String(category || "").toLowerCase().trim();
  if (!["utility", "marketing", "authentication"].includes(normalized)) {
    throw new HttpError(400, "Template category must be utility, marketing, or authentication");
  }

  return normalized;
}

function normalizeLanguage(language) {
  const normalized = String(language || "en").trim();
  return normalized === "English" ? "en" : normalized;
}

function normalizeHeaderType(headerType) {
  const normalized = String(headerType || "none").toLowerCase().trim();
  if (!["none", "image", "video"].includes(normalized)) {
    throw new HttpError(400, "Template header must be none, image, or video");
  }
  return normalized;
}

function normalizeTemplateName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function extractBodyPlaceholders(text) {
  const placeholders = new Set();
  const pattern = /\{\{\s*(\d+)\s*\}\}/g;
  let match = pattern.exec(text);

  while (match) {
    placeholders.add(Number(match[1]));
    match = pattern.exec(text);
  }

  return [...placeholders].sort((left, right) => left - right);
}

function getBodyComponent(components = []) {
  return components.find((component) => String(component.type || "").toUpperCase() === "BODY");
}

function getHeaderTypeFromComponents(components = []) {
  const header = components.find((component) => String(component.type || "").toUpperCase() === "HEADER");
  const format = String(header?.format || "").toLowerCase();
  return ["image", "video"].includes(format) ? format : "none";
}

function getBodyTextFromComponents(components = []) {
  return String(getBodyComponent(components)?.text || "").trim();
}

function getStoredTemplateBody(template) {
  if (String(template?.category || "").toLowerCase() === "authentication") {
    return AUTHENTICATION_TEMPLATE_BODY;
  }

  return getBodyTextFromComponents(template?.components || []);
}

function assertSequentialPlaceholders(placeholders) {
  placeholders.forEach((placeholder, index) => {
    const expected = index + 1;
    if (placeholder !== expected) {
      throw new HttpError(400, `Template variables must be sequential. Use {{${expected}}} before {{${placeholder}}}.`);
    }
  });
}

function parseBodyExamples(variableSamples, expectedCount = 0) {
  if (!expectedCount) return undefined;

  const fallbackValues = ["Name", "ORD1234", "12 Jun", "10:00 AM", "Rs 100"];
  if (!variableSamples) {
    return [fallbackValues.slice(0, expectedCount)];
  }

  const values = String(variableSamples)
    .split(",")
    .map((pair) => pair.split("=").pop()?.trim())
    .filter(Boolean);

  while (values.length < expectedCount) {
    values.push(fallbackValues[values.length] || `sample ${values.length + 1}`);
  }

  return [values.slice(0, expectedCount)];
}

function buildMetaTemplatePayload(body) {
  const name = normalizeTemplateName(body.name || body.templateName || body.template_name);
  const category = normalizeCategory(body.category);
  const language = normalizeLanguage(body.language);
  const headerType = normalizeHeaderType(body.headerType || body.header_type);
  const headerMediaId = String(body.headerMediaId || body.header_media_id || "").trim();
  const text = String(body.body || body.messageBody || body.message_body || "").trim();

  if (!name || (!text && category !== "authentication")) {
    throw new HttpError(400, "Template name and message body are required");
  }

  if (category === "authentication") {
    if (headerType !== "none") {
      throw new HttpError(400, "Authentication templates cannot use an image or video header");
    }
    return {
      name,
      category: category.toUpperCase(),
      language,
      components: [
        {
          type: "BODY",
          add_security_recommendation: true
        },
        {
          type: "FOOTER",
          code_expiration_minutes: AUTHENTICATION_CODE_EXPIRATION_MINUTES
        },
        {
          type: "BUTTONS",
          buttons: [
            {
              type: "OTP",
              otp_type: "COPY_CODE",
              text: "Copy Code"
            }
          ]
        }
      ],
      messageSendTtlSeconds: AUTHENTICATION_CODE_EXPIRATION_MINUTES * 60,
      localCategory: category,
      body: AUTHENTICATION_TEMPLATE_BODY,
      parameterCount: 1,
      headerType: "none",
      headerMediaId: ""
    };
  }

  const placeholders = extractBodyPlaceholders(text);
  assertSequentialPlaceholders(placeholders);

  const bodyComponent = {
    type: "BODY",
    text
  };

  const bodyText = parseBodyExamples(body.variableSamples || body.variable_samples, placeholders.length);
  if (bodyText) {
    bodyComponent.example = {
      body_text: bodyText
    };
  }

  return {
    name,
    category: category.toUpperCase(),
    language,
    components: [bodyComponent],
    localCategory: category,
    body: text,
    parameterCount: placeholders.length,
    headerType,
    headerMediaId
  };
}

function assertTemplateMediaCompatible(asset, headerType) {
  if (!asset || asset.mediaType !== headerType) {
    throw new HttpError(400, `Choose a ${headerType} from the Media Library`);
  }

  const allowedMimeTypes = headerType === "image"
    ? ["image/jpeg", "image/png"]
    : ["video/mp4"];
  const maximumBytes = headerType === "image" ? 5 * 1024 * 1024 : 16 * 1024 * 1024;

  if (!allowedMimeTypes.includes(asset.mimeType)) {
    throw new HttpError(400, headerType === "image"
      ? "Meta template image headers require a JPG or PNG asset"
      : "Meta template video headers require an MP4 asset");
  }
  if (asset.bytes > maximumBytes) {
    throw new HttpError(400, `Meta template ${headerType} samples must be ${headerType === "image" ? "5" : "16"} MB or smaller`);
  }
}

async function createMetaHeaderHandle(accessToken, asset) {
  if (!env.facebookAppId) {
    throw new HttpError(503, "Meta App ID is required to upload a template header sample");
  }

  const sourceResponse = await fetch(asset.secureUrl);
  if (!sourceResponse.ok) {
    throw new HttpError(502, "Unable to download the selected Cloudinary media");
  }
  const buffer = Buffer.from(await sourceResponse.arrayBuffer());
  const maximumBytes = asset.mediaType === "image" ? 5 * 1024 * 1024 : 16 * 1024 * 1024;
  if (buffer.length > maximumBytes) {
    throw new HttpError(400, `Meta template ${asset.mediaType} samples must be ${asset.mediaType === "image" ? "5" : "16"} MB or smaller`);
  }
  const params = new URLSearchParams({
    file_name: asset.originalName || `${asset.mediaId}.${asset.format}`,
    file_length: String(buffer.length),
    file_type: asset.mimeType,
    access_token: accessToken
  });
  const sessionResponse = await fetch(
    `https://graph.facebook.com/${env.metaGraphApiVersion}/${env.facebookAppId}/uploads?${params}`,
    { method: "POST", headers: { "Authorization": `Bearer ${accessToken}` } }
  );
  const session = await sessionResponse.json().catch(() => ({}));
  if (!sessionResponse.ok || session.error || !session.id) {
    throw new HttpError(sessionResponse.status || 502, session.error?.message || "Meta could not start the template media upload", session.error || session);
  }

  const uploadResponse = await fetch(
    `https://graph.facebook.com/${session.id}`,
    {
      method: "POST",
      headers: {
        "Authorization": `OAuth ${accessToken}`,
        "file_offset": "0",
        "Content-Type": "application/octet-stream"
      },
      body: buffer
    }
  );
  const uploaded = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok || uploaded.error || !uploaded.h) {
    throw new HttpError(uploadResponse.status || 502, uploaded.error?.message || "Meta could not upload the template media sample", uploaded.error || uploaded);
  }
  return uploaded.h;
}

function mapMetaTemplateStatus(status) {
  const normalized = String(status || "").toLowerCase();

  if (["approved", "active"].includes(normalized)) return "approved";
  if (["rejected"].includes(normalized)) return "rejected";
  if (["paused"].includes(normalized)) return "paused";
  if (["disabled"].includes(normalized)) return "disabled";
  if (["pending", "in_review"].includes(normalized)) return "in_review";

  return "in_review";
}

function isMetaSampleTemplate(templateName) {
  return String(templateName || "").trim().toLowerCase() === "hello_world";
}

function getMetaTemplateSubmissionError(metaError = {}, category = "") {
  const rawMessage = String(metaError.message || "");
  const rawDetails = String(metaError.error_data?.details || metaError.error_user_msg || "");
  const combined = `${rawMessage} ${rawDetails}`.toLowerCase();

  if (
    category === "authentication"
    && (
      Number(metaError.code) === 10
      || combined.includes("does not have permission")
      || combined.includes("permission for this action")
      || combined.includes("permission to create")
      || combined.includes("मैसेज टेंप्लेट")
    )
  ) {
    return "Meta is allowing Utility templates, but this WhatsApp Business Account is not eligible to create Authentication/OTP templates yet. Complete or resolve Business Verification in Meta, then create the OTP template again.";
  }

  if (
    Number(metaError.code) === 10
    || combined.includes("does not have permission")
    || combined.includes("permission for this action")
    || combined.includes("permission to create")
    || combined.includes("मैसेज टेंप्लेट")
  ) {
    return "Meta did not allow this app to create templates for the connected WhatsApp Business Account. Create the template in WhatsApp Manager, then refresh/sync templates in InterCon. To create templates from InterCon, the Meta app must have approved WhatsApp Business Management access for client WABAs.";
  }

  const errorDetails = rawDetails.trim();
  return errorDetails
    ? `${rawMessage || "Meta template submission failed"}: ${errorDetails}`
    : rawMessage || "Meta template submission failed";
}

async function syncMetaTemplates(tenantId) {
  const cacheKey = String(tenantId);
  const cached = templateSyncCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = doSyncMetaTemplates(tenantId)
    .catch((error) => {
      templateSyncCache.delete(cacheKey);
      throw error;
    });

  templateSyncCache.set(cacheKey, {
    expiresAt: Date.now() + TEMPLATE_SYNC_TTL_MS,
    promise
  });

  return promise;
}

async function doSyncMetaTemplates(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant?.meta?.wabaId || !accessToken) return;

  const response = await fetch(
    `https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.wabaId}/message_templates?fields=id,name,status,category,language,rejected_reason,quality_score,components&limit=100`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );
  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok || metaResponse.error) {
    throw new HttpError(response.status || 400, metaResponse.error?.message || "Unable to sync Meta templates", metaResponse.error || metaResponse);
  }

  const templates = Array.isArray(metaResponse.data) ? metaResponse.data : [];
  await Promise.all(templates.map((template) => {
    const category = String(template.category || "utility").toLowerCase();
    const body = getStoredTemplateBody(template);
    const headerType = getHeaderTypeFromComponents(template.components || []);
    const placeholders = category === "authentication" ? [1] : extractBodyPlaceholders(body);

    return Template.findOneAndUpdate(
      { tenantId, name: template.name, language: template.language || "en" },
      {
        $set: {
          tenantId,
          name: template.name,
          category,
          language: template.language || "en",
          body,
          parameterCount: placeholders.length,
          headerType,
          status: mapMetaTemplateStatus(template.status),
          metaTemplateId: template.id || "",
          rejectedReason: template.rejected_reason || "",
          qualityRating: ["high", "medium", "low"].includes(String(template.quality_score?.score || "").toLowerCase())
            ? String(template.quality_score.score).toLowerCase()
            : "unknown"
        }
      },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );
  }));

  const staleFilter = {
    tenantId,
    name: { $ne: "hello_world" },
    status: { $in: ["approved", "in_review", "paused"] },
    updatedAt: { $lt: new Date(Date.now() - TEMPLATE_STALE_GRACE_MS) }
  };

  if (templates.length) {
    staleFilter.$nor = templates.map((template) => ({
      name: template.name,
      language: template.language || "en"
    }));
  }

  await Template.updateMany(staleFilter, {
    $set: {
      status: "disabled",
      rejectedReason: "Template is not available in the connected WABA. Submit it again for this WhatsApp account."
    }
  });
}

function invalidateTemplateSync(tenantId) {
  templateSyncCache.delete(String(tenantId));
}

async function listTemplates(tenantId) {
  await syncMetaTemplates(tenantId);

  return Template.find({
    tenantId,
    name: { $ne: "hello_world" }
  }).sort({ updatedAt: -1 }).lean();
}

async function listApprovedTemplates(tenantId) {
  await syncMetaTemplates(tenantId);

  return Template.find({
    tenantId,
    status: "approved",
    name: { $ne: "hello_world" }
  }).sort({ name: 1 }).lean();
}

async function createTemplateDraft(tenantId, body) {
  const payload = buildMetaTemplatePayload(body);

  return Template.findOneAndUpdate(
    { tenantId, name: payload.name, language: payload.language },
    {
      $set: {
        tenantId,
        name: payload.name,
        category: payload.localCategory,
        language: payload.language,
        body: payload.body,
        parameterCount: payload.parameterCount,
        headerType: payload.headerType,
        headerMediaId: payload.headerMediaId,
        status: "draft"
      }
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
}

async function submitTemplateForMetaReview(tenantId, body) {
  await requireActivePaidPlan(tenantId);

  const payload = buildMetaTemplatePayload(body);
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");

  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant?.meta?.wabaId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. WABA ID and Meta access token are required before template submission.");
  }

  if (payload.headerType !== "none") {
    if (!payload.headerMediaId) {
      throw new HttpError(400, `Choose a ${payload.headerType} from the Media Library for Meta review`);
    }
    const asset = await MediaAsset.findOne({
      tenantId,
      mediaId: payload.headerMediaId
    }).lean();
    assertTemplateMediaCompatible(asset, payload.headerType);
    const headerHandle = await createMetaHeaderHandle(accessToken, asset);
    payload.components.unshift({
      type: "HEADER",
      format: payload.headerType.toUpperCase(),
      example: {
        header_handle: [headerHandle]
      }
    });
  }

  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${tenant.meta.wabaId}/message_templates`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: payload.name,
      category: payload.category,
      language: payload.language,
      components: payload.components,
      ...(payload.messageSendTtlSeconds ? { message_send_ttl_seconds: payload.messageSendTtlSeconds } : {})
    })
  });

  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const metaError = metaResponse.error || metaResponse;
    throw new HttpError(response.status, getMetaTemplateSubmissionError(metaError, payload.localCategory), metaError);
  }

  const template = await Template.findOneAndUpdate(
    { tenantId, name: payload.name, language: payload.language },
    {
      $set: {
        tenantId,
        name: payload.name,
        category: payload.localCategory,
        language: payload.language,
        body: payload.body,
        parameterCount: payload.parameterCount,
        headerType: payload.headerType,
        headerMediaId: payload.headerMediaId,
        status: "in_review",
        metaTemplateId: metaResponse.id || metaResponse.message_template_id || ""
      }
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
  invalidateTemplateSync(tenantId);

  return {
    template,
    meta: metaResponse
  };
}

async function deleteTemplate(tenantId, templateId) {
  if (!mongoose.Types.ObjectId.isValid(templateId)) {
    throw new HttpError(400, "Invalid template id");
  }

  const template = await Template.findOneAndDelete({
    _id: templateId,
    tenantId
  });

  if (!template) {
    throw new HttpError(404, "Template not found");
  }

  invalidateTemplateSync(tenantId);

  return template;
}

module.exports = {
  buildMetaTemplatePayload,
  createMetaHeaderHandle,
  listTemplates,
  listApprovedTemplates,
  createTemplateDraft,
  submitTemplateForMetaReview,
  deleteTemplate,
  invalidateTemplateSync,
  isMetaSampleTemplate
};
