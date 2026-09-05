const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const User = require("../models/User");
async function main() {
  const [email, action] = process.argv.slice(2);
  if (!email || !["grant", "revoke"].includes(action)) throw new Error("Usage: node src/scripts/setPlatformAdmin.js <email> <grant|revoke>");
  await connectDatabase();
  const user = await User.findOneAndUpdate({ email: email.trim().toLowerCase(), isVerified: true, status: "active" }, {
    $set: { platformRole: action === "grant" ? "admin" : "none" }
  });
  if (!user) throw new Error("An active, verified user with that email was not found");
  console.log("Platform administrator access", action === "grant" ? "granted" : "revoked");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
