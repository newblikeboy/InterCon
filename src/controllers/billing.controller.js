const asyncHandler = require("../utils/asyncHandler");
const billingService = require("../services/billing.service");

const getBilling = asyncHandler(async (req, res) => {
  const billing = await billingService.getBillingStatus(req.tenantId);

  res.json({
    success: true,
    billing,
    plans: billingService.getPlans()
  });
});

const selectPlan = asyncHandler(async (req, res) => {
  const result = await billingService.selectPlan(req.tenantId, req.body.plan || req.body.planId || req.body.plan_id);

  res.json({
    success: true,
    message: "Razorpay order created. Complete payment to activate sending.",
    ...result
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await billingService.verifyPayment(req.tenantId, req.body);

  res.json({
    success: true,
    message: "Payment verified. InterCon plan activated.",
    ...result
  });
});

module.exports = {
  getBilling,
  selectPlan,
  verifyPayment
};
