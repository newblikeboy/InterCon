// Run with application/worker processes stopped to avoid old recipient-based
// code sending while the new message ledger is initialized. Safe to rerun.
const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Tenant = require("../models/Tenant");
const { getAccessTenant } = require("../services/platformAccess.service");

async function migrateTrialMessages() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is required for trial migration");
  await connectDatabase();
  const cursor = Tenant.find({ kind: { $ne: "platform" }, "trial.messagesInitializedAt": { $exists: false } })
    .select("billing status trial").lean().cursor();
  let migrated = 0, pending = 0;
  for await (const tenant of cursor) {
    const updated = await getAccessTenant(tenant._id, { tenant, recover: false });
    migrated += 1;
    pending += updated.trial.reservations.length;
  }
  console.log(`Initialized message-based free usage for ${migrated} workspace(s).`);
  if (pending) console.log(`Preserved ${pending} pending send reservation(s); uncertain outcomes were not reset.`);
}

if (require.main === module) migrateTrialMessages()
  .catch(error => { console.error("Trial message migration failed:", error.message); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });

module.exports = { migrateTrialMessages };
