const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const billingController = require("../controllers/billing.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", billingController.getBilling);
router.post("/select-plan", authorize("owner"), billingController.selectPlan);
router.post("/verify-payment", authorize("owner"), billingController.verifyPayment);

module.exports = router;
