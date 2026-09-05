const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const { cursorFilter } = require("../utils/pagination");
const Tenant = require("../models/Tenant");
const Message = require("../models/Message");
const Payment = require("../models/Payment");
const WebhookEvent = require("../models/WebhookEvent");
const Template = require("../models/Template");
const collections = {
  tenants: [Tenant, "businessName businessEmail status onboardingStatus billing.plan billing.currentPeriodEnd meta.phoneNumberId createdAt"],
  messages: [Message, "tenantId to templateName status error createdAt"],
  payments: [Payment, "tenantId providerOrderId providerPaymentId plan amount currency status capturedAt"],
  webhooks: [WebhookEvent, "tenantId eventType status attempts error createdAt"],
  templates: [Template, "tenantId name language category status updatedAt"]
};
router.use(require("../middleware/authenticate"), require("../middleware/platformAdmin"));
router.get("/overview", asyncHandler(async (req, res) => {
  const [tenants, queued, uncertain, failedWebhooks, payments] = await Promise.all([
    Tenant.countDocuments(), Message.countDocuments({ status: { $in: ["queued", "scheduled", "processing"] } }),
    Message.countDocuments({ status: "uncertain" }), WebhookEvent.countDocuments({ status: "failed" }), Payment.countDocuments({ status: "captured" })
  ]);
  res.json({ success: true, counts: { tenants, queued, uncertain, failedWebhooks, payments } });
}));
router.get("/records/:kind", asyncHandler(async (req, res) => {
  const definition = Object.hasOwn(collections, req.params.kind) && collections[req.params.kind];
  if (!definition) throw new HttpError(404, "Unknown record type");
  const [model, fields] = definition;
  const records = await model.find(cursorFilter(req.query.after)).select(fields).sort({ _id: -1 }).limit(100).lean();
  res.json({ success: true, records, fields: fields.split(" "), nextCursor: records.length === 100 ? String(records.at(-1)._id) : null });
}));
module.exports = router;
