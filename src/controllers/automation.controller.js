const asyncHandler = require("../utils/asyncHandler");
const automationService = require("../services/automation.service");

const listAutomationFlows = asyncHandler(async (req, res) => {
  const flows = await automationService.listAutomationFlows(req.tenantId);

  res.json({
    success: true,
    flows
  });
});

const createAutomationFlow = asyncHandler(async (req, res) => {
  const flow = await automationService.createAutomationFlow(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    flow
  });
});

const updateAutomationStatus = asyncHandler(async (req, res) => {
  const flow = await automationService.updateAutomationStatus(req.tenantId, req.params.id, req.body.status);

  res.json({
    success: true,
    flow
  });
});

module.exports = {
  listAutomationFlows,
  createAutomationFlow,
  updateAutomationStatus
};
