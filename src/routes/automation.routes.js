const express = require("express");
const authenticate = require("../middleware/authenticate");
const automationController = require("../controllers/automation.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", automationController.listAutomationFlows);
router.post("/", automationController.createAutomationFlow);
router.patch("/:id/status", automationController.updateAutomationStatus);

module.exports = router;
