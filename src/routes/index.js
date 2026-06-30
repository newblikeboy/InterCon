const express = require("express");
const automationRoutes = require("./automation.routes");
const authRoutes = require("./auth.routes");
const billingRoutes = require("./billing.routes");
const campaignRoutes = require("./campaign.routes");
const contactRoutes = require("./contact.routes");
const developerRoutes = require("./developer.routes");
const healthRoutes = require("./health.routes");
const inboxRoutes = require("./inbox.routes");
const messageRoutes = require("./message.routes");
const metaRoutes = require("./meta.routes");
const publicApiRoutes = require("./publicApi.routes");
const templateRoutes = require("./template.routes");
const webhookRoutes = require("./webhook.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/automations", automationRoutes);
router.use("/billing", billingRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/contacts", contactRoutes);
router.use("/developer", developerRoutes);
router.use("/health", healthRoutes);
router.use("/inbox", inboxRoutes);
router.use("/messages", messageRoutes);
router.use("/meta", metaRoutes);
router.use("/templates", templateRoutes);
router.use("/v1", publicApiRoutes);
router.use("/webhooks", webhookRoutes);

module.exports = router;
