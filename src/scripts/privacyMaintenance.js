const mongoose = require("mongoose");
const env = require("../config/env");
async function main() {
  const [task, ...args] = process.argv.slice(2);
  if (!task || task === "--help") {
    console.log("npm run privacy:maintenance -- <media|indexes|consent|reports|media-expiry|deliveries|review> [--apply]\nDefault: read-only. --apply changes only the selected task. Stop app/workers and back up database and keys before migrations. Review never writes data."); return;
  }
  if (!["media", "indexes", "consent", "reports", "media-expiry", "deliveries", "review"].includes(task) || args.some(arg => arg !== "--apply")) throw new Error("Invalid maintenance arguments");
  if (!env.mongoUri) throw new Error("MONGODB_URI is required");
  await mongoose.connect(env.mongoUri, { autoIndex: false, autoCreate: false, maxPoolSize: 2, serverSelectionTimeoutMS: 10000 });
  const result = await require("../services/privacyMaintenance.service")[task === "media-expiry" ? "reports" : task]({ apply: args.includes("--apply") });
  console.log(JSON.stringify({ task, mode: args.includes("--apply") && task !== "review" ? "apply" : "read-only", result }, null, 2));
}
main().catch(error => { console.error("Privacy maintenance failed", error.name === "Error" ? error.message : error.name, error.code || ""); process.exitCode = 1; })
  .finally(async () => { await mongoose.disconnect(); });
