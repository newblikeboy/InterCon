const express = require("express");
const webhookController = require("../controllers/webhook.controller");

const router = express.Router();

router.get("/meta/setup", webhookController.getMetaWebhookSetup);
router.get("/meta", webhookController.verifyMetaWebhook);
router.post("/meta", webhookController.receiveMetaWebhook);

module.exports = router;
