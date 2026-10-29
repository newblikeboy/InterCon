const wrap = require("../utils/asyncHandler");
async function sendReport(req, res) {
  const delivery = await require("../services/reportDelivery.service").sendReport(req.tenantId, req.file, req.body,
    req.get("Idempotency-Key"), { userId: req.user?._id, apiKeyId: req.apiKey?._id });
  res.status(202).json({ success: true, ...delivery });
}
exports.sendReport = wrap(sendReport); // Compatibility alias for earlier desktop requests.
exports.sendMedia = wrap(async (req, res) => {
  if (req.body.reportMode !== undefined) {
    if (req.body.reportMode !== "automatic") throw new (require("../utils/httpError"))(400, "Unsupported report delivery mode");
    return sendReport(req, res);
  }
  const key = req.get("Idempotency-Key") || req.body.idempotencyKey;
  const delivery = await require("../services/mediaDelivery.service").sendMedia(req.tenantId, req.file, req.body, key,
    { userId: req.user?._id, apiKeyId: req.apiKey?._id });
  res.status(202).json({ success: true, message: "Recipient-specific media delivery queued", ...delivery });
});
