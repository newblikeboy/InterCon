const asyncHandler = require("../utils/asyncHandler");
module.exports = resource => asyncHandler(async (req, res, next) => {
  res.set("Cache-Control", "no-store, private");
  // Metadata only: never log query strings, phone numbers, filenames or bodies.
  await require("../models/SecurityAudit").create({ tenantId: req.tenantId,
    actorId: req.user?._id, apiKeyId: req.apiKey?._id, action: `${resource}.${req.method.toLowerCase()}.attempt`, requestId: req.id });
  next();
});
