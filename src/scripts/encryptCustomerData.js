const mongoose = require("mongoose");
const env = require("../config/env");
const { encrypt } = require("../utils/privateData");
const { migrateCustomerData, migrateTrialRecipientData } = require("../services/contactPrivacyMigration.service");

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log("npm run encrypt:customer-data -- [--apply]\nDefault: read-only inspection. --apply encrypts existing customer data. Back up the database and pin DATA_ENCRYPTION_KEY first; stop app and workers during migration.");
    return;
  }
  if (args.some(arg => arg !== "--apply")) throw new Error("Unknown migration argument");
  if (!env.mongoUri) throw new Error("MONGODB_URI is required");
  if (!process.env.DATA_ENCRYPTION_KEY || process.env.DATA_ENCRYPTION_KEY.length < 32) throw new Error("Set an explicit, stable DATA_ENCRYPTION_KEY of at least 32 characters before migration");
  encrypt("preflight", "migration.preflight");
  // Do not call application startup: inspection must not create indexes or alter data.
  await mongoose.connect(env.mongoUri, { autoIndex: false, autoCreate: false, maxPoolSize: 2, serverSelectionTimeoutMS: 10000 });
  const apply = args.includes("--apply");
  const summary = [...await migrateCustomerData({ apply }), await migrateTrialRecipientData({ apply })];
  console.log(JSON.stringify({ mode: apply ? "apply" : "read-only", summary }, null, 2));
  if (summary.some(row => row.conflicts)) process.exitCode = 2;
}

main().catch(error => {
  // Driver errors can contain connection details. Never log their full objects.
  console.error("Customer-data migration failed.", error.name === "Error" ? error.message : error.name, error.code || "");
  process.exitCode = 1;
}).finally(async () => { await mongoose.disconnect(); });
