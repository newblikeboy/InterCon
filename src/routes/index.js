const express = require("express");
const automationRoutes = require("./automation.routes");
const authRoutes = require("./auth.routes");
const campaignRoutes = require("./campaign.routes");
const contactRoutes = require("./contact.routes");
const healthRoutes = require("./health.routes");
const messageRoutes = require("./message.routes");
const metaRoutes = require("./meta.routes");
const templateRoutes = require("./template.routes");
const webhookRoutes = require("./webhook.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/automations", automationRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/contacts", contactRoutes);
router.use("/health", healthRoutes);
router.use("/messages", messageRoutes);
router.use("/meta", metaRoutes);
router.use("/templates", templateRoutes);
router.use("/webhooks", webhookRoutes);

module.exports = router;
