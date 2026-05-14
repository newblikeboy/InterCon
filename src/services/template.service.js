const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

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

function parseBodyExamples(variableSamples) {
  if (!variableSamples) return undefined;

  const values = String(variableSamples)
    .split(",")
    .map((pair) => pair.split("=").pop()?.trim())
    .filter(Boolean);

  return values.length ? [values] : undefined;
}

function buildMetaTemplatePayload(body) {
  const name = normalizeTemplateName(body.name || body.templateName || body.template_name);
  const category = normalizeCategory(body.category);
  const language = normalizeLanguage(body.language);
  const text = String(body.body || body.messageBody || body.message_body || "").trim();

  if (!name || !text) {
    throw new HttpError(400, "Template name and message body are required");
  }

  const bodyComponent = {
    type: "BODY",
    text
  };

  const bodyText = parseBodyExamples(body.variableSamples || body.variable_samples);
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
    localCategory: category
  };
}

async function listApprovedTemplates(tenantId) {
  return Template.find({
    tenantId,
    status: "approved"
  }).sort({ name: 1 });
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
        status: "draft"
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function submitTemplateForMetaReview(tenantId, body) {
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
      components: payload.components
    })
  });

  const metaResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HttpError(response.status, metaResponse.error?.message || "Meta template submission failed", metaResponse.error || metaResponse);
  }

  const template = await Template.findOneAndUpdate(
    { tenantId, name: payload.name, language: payload.language },
    {
      $set: {
        tenantId,
        name: payload.name,
        category: payload.localCategory,
        language: payload.language,
        status: "in_review",
        metaTemplateId: metaResponse.id || metaResponse.message_template_id || ""
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return {
    template,
    meta: metaResponse
  };
}

module.exports = {
  listApprovedTemplates,
  createTemplateDraft,
  submitTemplateForMetaReview
};
