const express = require("express");
const authenticate = require("../middleware/authenticate");
const messageController = require("../controllers/message.controller");

const router = express.Router();

router.use(authenticate);
router.use(require("../middleware/privacyAudit")("messages"));
router.post("/send-media", require("../middleware/authorize")("owner", "admin"),
  require("../middleware/concurrencyLimit")({ namespace: "media", max: 2, ttlMs: 10 * 60 * 1000 }),
  require("../middleware/mediaUpload"), require("../controllers/mediaDelivery.controller").sendMedia);

router.get("/", messageController.listMessages);
router.get("/send-template", (req, res) => {
  res.status(405).json({
    success: false,
    message: "Use POST /api/messages/send-template to send a WhatsApp template message."
  });
});
router.post("/send-template", require("../middleware/authorize")("owner", "admin"), messageController.sendTemplateMessage);
router.post("/bulk-recipients", messageController.listBulkRecipients);
router.post("/bulk-preview", messageController.previewBulkTemplateMessages);
router.post("/send-template-bulk", require("../middleware/authorize")("owner", "admin"), messageController.sendTemplateMessages);

module.exports = router;
