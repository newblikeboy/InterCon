const asyncHandler = require("../utils/asyncHandler");
const messageService = require("../services/message.service");

const listMessages = asyncHandler(async (req, res) => {
  const result = await messageService.listMessagesPage(req.tenantId, req.query);

  res.json({
    success: true,
    ...result
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

const sendTemplateMessages = asyncHandler(async (req, res) => {
  const result = await messageService.sendTemplateMessages(req.tenantId, { ...req.body, idempotencyKey: req.get("Idempotency-Key") || req.body.idempotencyKey });

  res.status(201).json({
    success: true,
    message: `${result.queuedCount} WhatsApp message${result.queuedCount === 1 ? "" : "s"} queued`,
    ...result
  });
});

const listBulkRecipients = asyncHandler(async (req, res) => {
  const result = await messageService.listBulkRecipients(req.tenantId, req.body);

  res.json({
    success: true,
    ...result
  });
});

const previewBulkTemplateMessages = asyncHandler(async (req, res) => {
  const result = await messageService.previewBulkTemplateMessages(req.tenantId, req.body);

  res.json({
    success: true,
    ...result
  });
});

module.exports = {
  listMessages,
  listBulkRecipients,
  previewBulkTemplateMessages,
  sendTemplateMessage,
  sendTemplateMessages
};
