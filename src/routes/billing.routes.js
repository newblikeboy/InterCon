const express = require("express");
const authenticate = require("../middleware/authenticate");
const billingController = require("../controllers/billing.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", billingController.getBilling);
router.post("/select-plan", billingController.selectPlan);
router.post("/verify-payment", billingController.verifyPayment);

module.exports = router;
