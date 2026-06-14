const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const Tenant = require("../models/Tenant");
const billingService = require("../services/billing.service");

async function main() {
  const [, , businessEmail, planId] = process.argv;

  if (!businessEmail || !planId) {
    console.error("Usage: npm run billing:activate -- business@example.com monthly|quarterly|yearly");
    process.exitCode = 1;
    return;
  }

  await connectDatabase();

  const tenant = await Tenant.findOne({ businessEmail: String(businessEmail).toLowerCase().trim() });
  if (!tenant) {
    console.error(`Tenant not found for ${businessEmail}`);
    process.exitCode = 1;
    return;
  }

  const result = await billingService.activatePlan(tenant._id, planId);
  console.log(`Activated ${result.plan.name} plan for ${tenant.businessName}`);
  console.log(`Amount: ${result.billing.currency} ${result.billing.amount}`);
  console.log(`Current period ends: ${result.billing.currentPeriodEnd.toISOString()}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => null);
  });
