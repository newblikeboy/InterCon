const express = require("express");
const healthController = require("../controllers/health.controller");

const router = express.Router();

router.get("/", healthController.getHealth);
router.get("/ready", healthController.getReadiness);
router.get("/metrics", healthController.getMetrics);

module.exports = router;
