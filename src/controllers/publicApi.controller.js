const asyncHandler = require("../utils/asyncHandler");
const contactService = require("../services/contact.service");
const messageService = require("../services/message.service");

// Minimal, tenant-scoped desktop setup responses. Never serialize Meta credentials.
const integrationStatus = asyncHandler(async (req, res) => {
  const tenant = await require("../models/Tenant").findById(req.tenantId)
    .select("businessName status processingTerms meta.phoneNumberId +meta.accessToken");
  if (!tenant || tenant.status !== "active") throw new (require("../utils/httpError"))(403, "Workspace is not active");
  res.set("Cache-Control", "no-store").json({ success: true, contractVersion: 1, reportSendingAvailable: true,
    workspaceId: String(tenant._id), workspaceName: tenant.businessName,
    whatsappConnected: Boolean(tenant.meta?.phoneNumberId && tenant.getMetaAccessToken()),
    processingTermsAccepted: tenant.processingTerms?.version === "2026-10-29" });
});

const approvedReportTemplates = asyncHandler(async (req, res) => {
  const templates = await require("../models/Template").find({ tenantId: req.tenantId,
    status: "approved", category: "utility", headerType: "document", mediaMode: { $ne: "common" } })
    .select("-_id name language body parameterCount category headerType mediaMode reportBindings").sort({ name: 1, language: 1 }).limit(500).lean();
  const { isConfigured } = require("../services/reportDelivery.service");
  res.set("Cache-Control", "no-store").json({ success: true, templates: templates.map(({ reportBindings, ...template }) =>
    ({ ...template, reportConfigured: isConfigured({ ...template, reportBindings }) })) });
});

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
  integrationStatus,
  approvedReportTemplates,
  createContact,
  getMessage,
  listReports,
  sendTemplateMessage
};
