const Template = require("../models/Template");
const Tenant = require("../models/Tenant");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { requireActivePaidPlan } = require("./billing.service");

const templateSyncCache = new Map();
const TEMPLATE_SYNC_TTL_MS = 30 * 1000;

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

  if (!name || !text) {
    throw new HttpError(400, "Template name and message body are required");
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
    const body = getBodyTextFromComponents(template.components || []);
    const placeholders = extractBodyPlaceholders(body);

    return Template.findOneAndUpdate(
      { tenantId, name: template.name, language: template.language || "en" },
      {
        $set: {
          tenantId,
          name: template.name,
          category: String(template.category || "utility").toLowerCase(),
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
