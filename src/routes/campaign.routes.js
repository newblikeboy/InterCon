const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const campaignController = require("../controllers/campaign.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("owner", "admin"));

router.get("/", campaignController.listCampaigns);
router.post("/", campaignController.createCampaign);
router.patch("/:id/status", campaignController.updateCampaignStatus);

module.exports = router;
