const asyncHandler = require("../utils/asyncHandler");
const inboxService = require("../services/inbox.service");

const listConversations = asyncHandler(async (req, res) => {
  const data = await inboxService.listConversations(req.tenantId, req.query);

  res.json({
    success: true,
    ...data
  });
});

const getUnreadSummary = asyncHandler(async (req, res) => {
  const data = await inboxService.getUnreadSummary(req.tenantId);

  res.json({
    success: true,
    ...data
  });
});

const getConversationMessages = asyncHandler(async (req, res) => {
  const data = await inboxService.getConversationMessages(req.tenantId, req.params.conversationId, req.query);

  res.json({
    success: true,
    ...data
  });
});

const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await inboxService.markConversationRead(req.tenantId, req.params.conversationId);

  res.json({
    success: true,
    conversation
  });
});

const deleteConversation = asyncHandler(async (req, res) => {
  const data = await inboxService.deleteConversation(req.tenantId, req.params.conversationId);

  res.json({
    success: true,
    message: "Chat deleted",
    ...data
  });
});

const sendReply = asyncHandler(async (req, res) => {
  const data = await inboxService.sendReply(req.tenantId, req.params.conversationId, req.body);

  res.status(201).json({
    success: true,
    message: "Reply sent",
    ...data
  });
});

module.exports = {
  listConversations,
  getUnreadSummary,
  getConversationMessages,
  markConversationRead,
  deleteConversation,
  sendReply
};
