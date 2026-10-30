// Administrator CLI alternative to the dashboard's Report Field Mapping editor.
const fs = require("fs");
const mongoose = require("mongoose");
const env = require("../config/env");
const Template = require("../models/Template");
const { validateBindings } = require("../services/reportDelivery.service");

async function main() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("Usage: node src/scripts/configureReportTemplate.js path/to/report-template.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  if (!mongoose.isValidObjectId(config.tenantId) || !config.templateName || !config.language) throw new Error("Provide tenantId, templateName, language and bindings");
  await mongoose.connect(env.mongoUri);
  try {
    const template = await Template.findOne({ tenantId: config.tenantId, name: config.templateName, language: config.language,
      status: "approved", category: "utility", headerType: "document", mediaMode: { $ne: "common" } });
    if (!template) throw new Error("Approved utility PDF template not found in that workspace");
    template.reportBindings = validateBindings(config.bindings, template.parameterCount);
    await template.save();
    process.stdout.write("Report template mapping saved. Operators can now select it in Pathlogy.\n");
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { process.stderr.write(error.message + "\n"); process.exitCode = 1; });
