const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
const Tenant = require("../models/Tenant");

async function encryptTenantTokens() {
  await connectDatabase();

  const tenants = await Tenant.find({ "meta.accessToken": { $exists: true, $nin: ["", null] } }).select("+meta.accessToken");
  let migrated = 0;

  for (const tenant of tenants) {
    if (String(tenant.meta.accessToken).startsWith("enc:v1:")) {
      continue;
    }

    tenant.markModified("meta.accessToken");
    await tenant.save();
    migrated += 1;
  }

  console.log(`Encrypted ${migrated} tenant Meta access token(s).`);
}

encryptTenantTokens()
  .catch((error) => {
    console.error("Failed to encrypt tenant Meta access tokens:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (env.mongoUri) {
      await mongoose.connection.close();
    }
  });
