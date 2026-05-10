const asyncHandler = require("../utils/asyncHandler");
const campaignService = require("../services/campaign.service");

const listCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await campaignService.listCampaigns(req.tenantId);

  res.json({
    success: true,
    campaigns
  });
});

const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign(req.tenantId, req.body);

  res.status(201).json({
    success: true,
    campaign
  });
});

const updateCampaignStatus = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaignStatus(req.tenantId, req.params.id, req.body.status);

  res.json({
    success: true,
    campaign
  });
});

module.exports = {
  listCampaigns,
  createCampaign,
  updateCampaignStatus
};
