const asyncHandler = require("../utils/asyncHandler");
const messageService = require("../services/message.service");

const listMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.listMessages(req.tenantId);

  res.json({
    success: true,
    messages
  });
});

const sendTemplateMessage = asyncHandler(async (req, res) => {
  const result = await messageService.sendTemplateMessage(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: "WhatsApp message queued",
    ...result
  });
});

module.exports = {
  listMessages,
  sendTemplateMessage
};
