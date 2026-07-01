const express = require("express");
const authenticate = require("../middleware/authenticate");
const messageController = require("../controllers/message.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", messageController.listMessages);
router.get("/send-template", (req, res) => {
  res.status(405).json({
    success: false,
    message: "Use POST /api/messages/send-template to send a WhatsApp template message."
  });
});
router.post("/send-template", messageController.sendTemplateMessage);
router.post("/bulk-recipients", messageController.listBulkRecipients);
router.post("/bulk-preview", messageController.previewBulkTemplateMessages);
router.post("/send-template-bulk", messageController.sendTemplateMessages);

module.exports = router;
