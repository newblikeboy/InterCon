const asyncHandler = require("../utils/asyncHandler");
const templateService = require("../services/template.service");

function withReportStatus(templates) {
  const { isReportTemplate, isConfigured } = require("../services/reportDelivery.service");
  return templates.map(({ reportBindings, ...template }) => ({ ...template,
    reportMappingEligible: isReportTemplate(template),
    reportConfigured: isReportTemplate(template) && isConfigured({ ...template, reportBindings }) }));
}

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates(req.tenantId);

  res.json({
    success: true,
    templates: withReportStatus(templates)
  });
});

const listApprovedTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listApprovedTemplates(req.tenantId);

  res.json({
    success: true,
    templates: withReportStatus(templates)
  });
});

const getReportMapping = asyncHandler(async (req, res) => {
  const result = await templateService.getReportMapping(req.tenantId, req.params.templateId);
  res.set("Cache-Control", "no-store").json({ success: true, ...result });
});

const saveReportMapping = asyncHandler(async (req, res) => {
  const result = await templateService.saveReportMapping(req.tenantId, req.params.templateId, req.body);
  res.set("Cache-Control", "no-store").json({ success: true, message: "Report field mapping saved", ...result });
});

const createTemplateDraft = asyncHandler(async (req, res) => {
  const template = await templateService.createTemplateDraft(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: "Template draft saved",
    template
  });
});

const submitTemplateForMetaReview = asyncHandler(async (req, res) => {
  const result = await templateService.submitTemplateForMetaReview(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: "Template submitted to Meta for review",
    ...result
  });
});

const browseTemplateLibrary = asyncHandler(async (req, res) => {
  const result = await templateService.browseMetaTemplateLibrary(req.tenantId, {
    search: req.query.search,
    topic: req.query.topic,
    language: req.query.language,
    after: req.query.after
  });

  res.json({
    success: true,
    ...result
  });
});

const createTemplateFromLibrary = asyncHandler(async (req, res) => {
  const result = await templateService.createTemplateFromLibrary(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    message: result.status === "approved"
      ? "Template added from Meta's library and approved. It is ready to send."
      : "Template added from Meta's library and submitted for review.",
    ...result
  });
});

const deleteTemplate = asyncHandler(async (req, res) => {
  const result = await templateService.deleteTemplate(req.tenantId, req.params.templateId);

  res.json({
    success: true,
    message: result.deletedFromMeta
      ? "Template deleted from InterCon and your WhatsApp Business Account"
      : "Template deleted from InterCon"
  });
});

module.exports = {
  listTemplates,
  listApprovedTemplates,
  getReportMapping,
  saveReportMapping,
  createTemplateDraft,
  submitTemplateForMetaReview,
  browseTemplateLibrary,
  createTemplateFromLibrary,
  deleteTemplate
};
