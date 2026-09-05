const express = require("express");
const webhookController = require("../controllers/webhook.controller");

const router = express.Router();
router.post("/razorpay", require("../utils/asyncHandler")(async (req, res) => {
  await require("../services/billing.service").handlePaymentWebhook(req);
  res.json({ success: true });
}));

router.get("/meta/setup", webhookController.getMetaWebhookSetup);
router.get("/meta", webhookController.verifyMetaWebhook);
router.post("/meta", webhookController.receiveMetaWebhook);

module.exports = router;
