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

module.exports = router;
