const Template = require("../models/Template");
const HttpError = require("../utils/httpError");
const mediaDelivery = require("./mediaDelivery.service");
const Receipt = require("../models/MediaDelivery");
const { lookup } = require("../utils/privateData");

const SOURCES = new Set(["patientName", "reportId", "labName", "testName", "collectedAt"]);
function validateBindings(bindings, count) {
  if (!Array.isArray(bindings) || bindings.length !== count || count > 100 || bindings.some(binding =>
    typeof binding === "string" ? !SOURCES.has(binding) :
      !binding || typeof binding !== "object" || Array.isArray(binding) || Object.keys(binding).length !== 1 ||
      typeof binding.literal !== "string" || !binding.literal.trim() || binding.literal.length > 300)) {
    throw new HttpError(409, "This report template needs its field mapping configured in InterCon by an administrator");
  }
  return bindings;
}
function isConfigured(template) {
  try { validateBindings(template.reportBindings ?? (template.parameterCount === 0 ? [] : undefined), template.parameterCount); return true; }
  catch { return false; }
}
async function sendReport(tenantId, file, body, key, actor) {
  // Report variables and service-only classification are controlled on the server.
  if (body.variables !== undefined || body.name !== undefined || body.purpose !== undefined || body.consentScope !== undefined ||
      body.contactIds || body.groupIds || body.recipients || body.contactId || body.recipientContactId || body.phone) {
    throw new HttpError(400, "Send one report recipient and report metadata; template values and purpose are managed by InterCon");
  }
  const metadata = {};
  for (const source of SOURCES) {
    const value = body[source];
    if (value !== undefined && (typeof value !== "string" || value.length > 300 || /[\r\n\x00-\x1f]/.test(value))) throw new HttpError(400, "Report metadata must be single-line text of up to 300 characters");
    metadata[source] = String(value || "").trim();
  }
  if (!metadata.reportId) throw new HttpError(400, "Report ID is required");
  if (typeof key !== "string" || !/^[A-Za-z0-9._:-]{8,160}$/.test(key)) throw new HttpError(400, "Provide a valid Idempotency-Key");
  const templateName = String(body.templateName || "").trim(), language = String(body.language || "").trim();
  const reportMetadataHash = lookup(JSON.stringify({ ...metadata, templateName, language }), `MediaDelivery.report:${tenantId}`);
  const previous = await Receipt.findOne({ tenantId, keyHash: lookup(`delivery:${key}`, `MediaDelivery.key:${tenantId}`) }).lean();
  if (previous?.status === "erased") throw new HttpError(410, "This delivery was erased; the original request will not send again");
  if (previous && previous.reportMetadataHash !== reportMetadataHash) throw new HttpError(409, "This request key was already used for different report information");
  let bindings = previous?.reportBindings;
  if (!bindings) {
    const template = await Template.findOne({ tenantId, name: templateName, language, status: "approved", category: "utility", headerType: "document", mediaMode: { $ne: "common" } }).lean();
    if (!template) throw new HttpError(400, "Select an approved utility PDF report template");
    bindings = validateBindings(template.reportBindings ?? (template.parameterCount === 0 ? [] : undefined), template.parameterCount);
  }
  const variables = bindings.map(binding => typeof binding === "string" ? metadata[binding] : binding.literal.trim());
  if (variables.some(value => !value)) throw new HttpError(400, "Report metadata required by this template is missing");
  return mediaDelivery.sendMedia(tenantId, file, { to: body.to, templateName, language,
    variables, purpose: "patient_report", consentScope: "service_only", permissionConfirmed: body.permissionConfirmed,
    consentReference: body.consentReference }, key, actor, { reportBindings: bindings, reportMetadataHash });
}
module.exports = { sendReport, isConfigured, validateBindings };
