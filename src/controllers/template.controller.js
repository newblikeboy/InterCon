const asyncHandler = require("../utils/asyncHandler");
const templateService = require("../services/template.service");

const listTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listTemplates(req.tenantId);

  res.json({
    success: true,
    templates
  });
});

const listApprovedTemplates = asyncHandler(async (req, res) => {
  const templates = await templateService.listApprovedTemplates(req.tenantId);

  res.json({
    success: true,
    templates
  });
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

const deleteTemplate = asyncHandler(async (req, res) => {
  await templateService.deleteTemplate(req.tenantId, req.params.templateId);

  res.json({
    success: true,
    message: "Template deleted"
  });
});

module.exports = {
  listTemplates,
  listApprovedTemplates,
  createTemplateDraft,
  submitTemplateForMetaReview,
  deleteTemplate
};
