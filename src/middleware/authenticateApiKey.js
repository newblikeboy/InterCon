const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const apiKeyService = require("../services/apiKey.service");

function getApiKey(req) {
  if (req.headers.authorization?.startsWith("Bearer ")) {
    return req.headers.authorization.slice(7);
  }

  return req.headers["x-api-key"];
}

const authenticateApiKey = asyncHandler(async (req, res, next) => {
  const rawKey = getApiKey(req);
  if (!rawKey) {
    throw new HttpError(401, "API key required");
  }

  const { apiKey, tenant } = await apiKeyService.authenticateApiKey(rawKey);
  req.apiKey = apiKey;
  req.tenant = tenant;
  req.tenantId = tenant._id;
  next();
});

module.exports = authenticateApiKey;
