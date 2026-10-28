const wrap = require("../utils/asyncHandler");
exports.sendMedia = wrap(async (req, res) => {
  const key = req.get("Idempotency-Key") || req.body.idempotencyKey;
  const delivery = await require("../services/mediaDelivery.service").sendMedia(req.tenantId, req.file, req.body, key,
    { userId: req.user?._id, apiKeyId: req.apiKey?._id });
  res.status(202).json({ success: true, message: "Recipient-specific media delivery queued", ...delivery });
});
