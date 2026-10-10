// Credentials are read from standard input, never command arguments or a file.
const fs = require("fs");
const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
async function main() {
  const input = JSON.parse(fs.readFileSync(0, "utf8"));
  await connectDatabase();
  const result = await require("../services/admin.service").provisionAdmin(input.email, input.password);
  input.password = undefined;
  console.log(JSON.stringify(result));
}
main().catch(() => { console.error("Administrator provisioning failed. Check the input and database connection."); process.exitCode = 1; }).finally(() => mongoose.disconnect());
