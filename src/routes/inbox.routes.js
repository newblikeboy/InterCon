const express = require("express");
const authenticate = require("../middleware/authenticate");
const inboxController = require("../controllers/inbox.controller");

const router = express.Router();

router.use(authenticate);

router.get("/conversations", inboxController.listConversations);
router.get("/unread", inboxController.getUnreadSummary);
router.get("/conversations/:conversationId/messages", inboxController.getConversationMessages);
router.post("/conversations/:conversationId/read", inboxController.markConversationRead);
router.delete("/conversations/:conversationId", inboxController.deleteConversation);
router.post("/conversations/:conversationId/reply", inboxController.sendReply);

module.exports = router;
