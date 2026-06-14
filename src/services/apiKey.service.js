const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");

const KEY_PREFIX = "ic_live";

function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(String(apiKey)).digest("hex");
}

function maskApiKey(key) {
  if (!key) return "";
  return `${key.slice(0, 11)}...${key.slice(-4)}`;
}

function serializeApiKey(apiKey) {
  return {
    id: apiKey._id,
    name: apiKey.name,
    prefix: apiKey.prefix,
    lastFour: apiKey.lastFour,
    maskedKey: `${apiKey.prefix}...${apiKey.lastFour}`,
    status: apiKey.status,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    revokedAt: apiKey.revokedAt
  };
}

function generateApiKey() {
  return `${KEY_PREFIX}_${crypto.randomBytes(32).toString("base64url")}`;
}

async function listApiKeys(tenantId) {
  const keys = await ApiKey.find({ tenantId }).sort({ createdAt: -1 }).lean();
  return keys.map(serializeApiKey);
}

async function createApiKey(tenantId, body = {}) {
  const tenant = await Tenant.findById(tenantId).select("_id status").lean();
  if (!tenant || tenant.status !== "active") {
    throw new HttpError(403, "Workspace is not active");
  }

  const name = String(body.name || "Default integration").trim();
  if (!name) {
    throw new HttpError(400, "API key name is required");
  }

  const plainKey = generateApiKey();
  const apiKey = await ApiKey.create({
    tenantId,
    name,
    keyHash: hashApiKey(plainKey),
    prefix: plainKey.slice(0, 11),
    lastFour: plainKey.slice(-4)
  });

  return {
    apiKey: serializeApiKey(apiKey),
    key: plainKey,
    maskedKey: maskApiKey(plainKey)
  };
}

async function revokeApiKey(tenantId, apiKeyId) {
  const apiKey = await ApiKey.findOneAndUpdate(
    { _id: apiKeyId, tenantId },
    {
      $set: {
        status: "revoked",
        revokedAt: new Date()
      }
    },
    { returnDocument: "after" }
  );

  if (!apiKey) {
    throw new HttpError(404, "API key not found");
  }

  return serializeApiKey(apiKey);
}

async function authenticateApiKey(rawKey) {
  const key = String(rawKey || "").trim();
  if (!key) {
    throw new HttpError(401, "API key required");
  }

  const apiKey = await ApiKey.findOne({
    keyHash: hashApiKey(key),
    status: "active"
  }).lean();

  if (!apiKey) {
    throw new HttpError(401, "Invalid API key");
  }

  const tenant = await Tenant.findById(apiKey.tenantId).select("_id status onboardingStatus meta billing").lean();
  if (!tenant || tenant.status !== "active") {
    throw new HttpError(403, "Workspace is not active");
  }

  await ApiKey.updateOne({ _id: apiKey._id }, { $set: { lastUsedAt: new Date() } });

  return {
    apiKey,
    tenant
  };
}

module.exports = {
  authenticateApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey
};
