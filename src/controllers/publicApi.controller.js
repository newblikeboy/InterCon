const asyncHandler = require("../utils/asyncHandler");
const contactService = require("../services/contact.service");
const messageService = require("../services/message.service");

const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.createContact(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    contact
  });
});

const sendTemplateMessage = asyncHandler(async (req, res) => {
  const result = await messageService.sendTemplateMessage(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: "WhatsApp message queued",
    data: result.message
  });
});

const getMessage = asyncHandler(async (req, res) => {
  const message = await messageService.getMessage(req.tenantId, req.params.messageId);

  res.json({
    success: true,
    message
  });
});

const listReports = asyncHandler(async (req, res) => {
  const result = await messageService.listMessagesPage(req.tenantId, req.query);
  const messages = result.messages || [];
  const summary = messageService.summarizeMessages(messages);

  res.json({
    success: true,
    summary,
    ...result
  });
});

module.exports = {
  createContact,
  getMessage,
  listReports,
  sendTemplateMessage
};
