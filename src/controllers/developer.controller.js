const asyncHandler = require("../utils/asyncHandler");
const apiKeyService = require("../services/apiKey.service");

const listApiKeys = asyncHandler(async (req, res) => {
  const apiKeys = await apiKeyService.listApiKeys(req.tenantId);

  res.json({
    success: true,
    apiKeys
  });
});

const createApiKey = asyncHandler(async (req, res) => {
  const result = await apiKeyService.createApiKey(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: "API key created. Copy it now because it will not be shown again.",
    ...result
  });
});

const revokeApiKey = asyncHandler(async (req, res) => {
  const apiKey = await apiKeyService.revokeApiKey(req.tenantId, req.params.apiKeyId);

  res.json({
    success: true,
    message: "API key revoked",
    apiKey
  });
});

module.exports = {
  createApiKey,
  listApiKeys,
  revokeApiKey
};
