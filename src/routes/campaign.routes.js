const express = require("express");
const authenticate = require("../middleware/authenticate");
const campaignController = require("../controllers/campaign.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", campaignController.listCampaigns);
router.post("/", campaignController.createCampaign);
router.patch("/:id/status", campaignController.updateCampaignStatus);

module.exports = router;
