const Template = require("../models/Template");
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

  const fallbackValues = ["Aashish", "ORD1234", "12 Jun", "10:00 AM", "Rs 100"];
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
  const text = String(body.body || body.messageBody || body.message_body || "").trim();

  if (!name || (!text && category !== "authentication")) {
    throw new HttpError(400, "Template name and message body are required");
  }

  if (category === "authentication") {
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
      parameterCount: 1
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
    parameterCount: placeholders.length
  };
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

module.exports = {
  listTemplates,
  listApprovedTemplates,
  createTemplateDraft,
  submitTemplateForMetaReview,
  isMetaSampleTemplate
};
