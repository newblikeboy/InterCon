const asyncHandler = require("../utils/asyncHandler");
const templateService = require("../services/template.service");

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

module.exports = {
  listApprovedTemplates,
  createTemplateDraft,
  submitTemplateForMetaReview
};
