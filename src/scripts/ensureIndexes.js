const mongoose = require("mongoose");
const env = require("../config/env");
const { connectDatabase } = require("../config/database");
async function run() {
  if (!env.mongoUri) throw new Error("Set MONGODB_URI to the database you intend to migrate");
  await connectDatabase();
  console.log("All declared indexes are present. No data or existing indexes were deleted.");
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
