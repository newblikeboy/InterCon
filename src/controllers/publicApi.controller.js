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
    message: "WhatsApp message accepted",
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
  const messages = await messageService.listMessages(req.tenantId, req.query);
  const summary = messageService.summarizeMessages(messages);

  res.json({
    success: true,
    summary,
    messages
  });
});

module.exports = {
  createContact,
  getMessage,
  listReports,
  sendTemplateMessage
};
