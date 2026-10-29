const mongoose = require("mongoose");
const Request = require("../models/PrivacyRequest");
const Contact = require("../models/Contact");
const Audit = require("../models/SecurityAudit");
const HttpError = require("../utils/httpError");
const { lookup } = require("../utils/privateData");
const env = require("../config/env");
const { pageSize, cursorFilter } = require("../utils/pagination");
const owner = actor => ["owner", "admin"].includes(actor.role);
const suppressionHash = (tenantId, phone) => lookup(String(phone), `erased-recipient:${tenantId}`);
const id = value => { if (!mongoose.isValidObjectId(value)) throw new HttpError(400, "Invalid record ID"); return value; };

async function createRequest(actor, body) {
  const subject = body.subject || "account";
  if (subject === "customer" && !owner(actor)) throw new HttpError(403, "Only workspace owners and admins can make customer data requests");
  if (!Request.schema.path("kind").enumValues.includes(body.kind) || !["account", "customer"].includes(subject)) throw new HttpError(400, "Choose a valid request type");
  let contactId;
  if (subject === "customer") {
    contactId = id(body.contactId);
    if (!await Contact.exists({ _id: contactId, tenantId: actor.tenantId })) throw new HttpError(404, "Contact not found");
  }
  return Request.create({ tenantId: actor.tenantId, requesterId: actor._id, subject, contactId, kind: body.kind, notes: body.notes });
}
async function listRequests(actor, query = {}, platform = false) {
  const filter = platform ? {} : { tenantId: actor.tenantId, $or: [
    { requesterId: actor._id }, ...(owner(actor) ? [{ subject: "customer" }] : [])
  ] };
  return Request.find({ ...filter, ...cursorFilter(query.after) }).sort({ _id: -1 }).limit(pageSize(query.limit, 50)).lean();
}
async function reviewRequest(actor, requestId, body, platform = false) {
  const request = await Request.findOne({ _id: id(requestId), ...(platform ? {} : { tenantId: actor.tenantId, subject: "customer" }) });
  if (!request) throw new HttpError(404, "Request not found");
  if (!platform && !owner(actor)) throw new HttpError(403, "Owner or admin permission is required");
  if (!["verified", "in_review", "fulfilled", "rejected"].includes(body.status)) throw new HttpError(400, "Choose a valid request status");
  if (request.kind === "erasure" && request.subject === "customer" && body.status === "fulfilled") throw new HttpError(400, "Use the verified erasure action to complete this request");
  if (!String(body.response || "").trim()) throw new HttpError(400, "Record the verification or response details without medical information");
  if (request.subject === "customer" && request.kind === "withdrawal" && body.status === "fulfilled") {
    const contact = await Contact.findOne({ _id: request.contactId, tenantId: request.tenantId }).lean();
    if (contact) await require("./contact.service").suppressContact(request.tenantId, { phone: contact.phone,
      status: "opted_out", reason: "Verified customer withdrawal request" }, actor._id);
  }
  request.status = body.status; request.response = body.response;
  if (body.status === "verified") { request.verifiedAt = new Date(); request.verifiedBy = actor._id; }
  if (["fulfilled", "rejected"].includes(body.status)) request.resolvedAt = new Date();
  if (body.legalHoldUntil) {
    const hold = new Date(body.legalHoldUntil);
    if (!Number.isFinite(hold.getTime()) || hold <= new Date()) throw new HttpError(400, "Choose a future legal retention date");
    request.legalHoldUntil = hold;
  }
  await request.save();
  await Audit.create({ tenantId: request.tenantId, actorId: actor._id, action: `privacy.${body.status}`, resourceId: String(request._id) });
  return request;
}
async function contactExport(actor, contactId) {
  if (!owner(actor)) throw new HttpError(403, "Owner or admin permission is required");
  const contact = await Contact.findOne({ _id: id(contactId), tenantId: actor.tenantId }).lean();
  if (!contact) throw new HttpError(404, "Contact not found");
  const [messages, inboxMessages, reports, deliveries] = await Promise.all([
    require("../models/Message").find({ tenantId: actor.tenantId, to: contact.phone }).limit(1000).lean(),
    require("../models/InboxMessage").find({ tenantId: actor.tenantId, customerPhone: contact.phone }).limit(1000).lean(),
    require("../models/MediaAsset").find({ tenantId: actor.tenantId, recipientContactId: contact._id }).select("mediaId purpose createdAt").lean(),
    require("../models/MediaDelivery").find({ tenantId: actor.tenantId, contactId: contact._id }).select("status messageId mediaId createdAt").limit(1000).lean()
  ]);
  await Audit.create({ tenantId: actor.tenantId, actorId: actor._id, action: "privacy.export", resourceId: String(contact._id) });
  return { contact, messages, inboxMessages, reports, deliveries, limited: messages.length === 1000 || inboxMessages.length === 1000 || deliveries.length === 1000 };
}
async function matchingRows(model, filter, phone, field) {
  const ids = []; let after;
  for (;;) {
    const rows = await model.find({ ...filter, ...(after ? { _id: { $gt: after } } : {}) }).sort({ _id: 1 }).limit(200).lean();
    if (!rows.length) return ids;
    for (const row of rows) if (JSON.stringify(row[field] || {}).includes(phone)) ids.push(row._id);
    after = rows.at(-1)._id;
  }
}
async function streamContactExport(actor, contactId, res) {
  if (!owner(actor)) throw new HttpError(403, "Owner or admin permission is required");
  const contact = await Contact.findOne({ _id: id(contactId), tenantId: actor.tenantId }).lean();
  if (!contact) throw new HttpError(404, "Contact not found");
  await Audit.create({ tenantId: actor.tenantId, actorId: actor._id, action: "privacy.export", resourceId: String(contact._id) });
  res.set({ "Content-Type": "application/x-ndjson", "Content-Disposition": 'attachment; filename="contact-data.ndjson"', "Cache-Control": "no-store, private" });
  async function emit(value) {
    if (res.destroyed) return false;
    if (!res.write(JSON.stringify(value) + "\n")) await new Promise(resolve => {
      const done = () => { res.off("drain", done); res.off("close", done); resolve(); };
      res.once("drain", done); res.once("close", done);
    });
    return !res.destroyed;
  }
  await emit({ type: "contact", data: contact });
  for (const [name, filter] of [["Message", { tenantId: actor.tenantId, to: contact.phone }],
    ["InboxMessage", { tenantId: actor.tenantId, customerPhone: contact.phone }],
    ["MediaAsset", { tenantId: actor.tenantId, recipientContactId: contact._id }],
    ["MediaDelivery", { tenantId: actor.tenantId, contactId: contact._id }]]) {
    let after;
    for (;;) {
      const query = require(`../models/${name}`).find({ ...filter, ...(after ? { _id: { $gt: after } } : {}) }).sort({ _id: 1 }).limit(200);
      if (name === "MediaDelivery") query.select("status messageId mediaId createdAt");
      const rows = await query.lean();
      if (!rows.length) break;
      for (const row of rows) if (!await emit({ type: name, data: row })) return;
      after = rows.at(-1)._id;
    }
  }
  res.end();
}
async function eraseContact(actor, requestId, body) {
  if (!owner(actor) || body.confirmation !== "ERASE") throw new HttpError(400, "Owner/admin permission and ERASE confirmation are required");
  const request = await Request.findOne({ _id: id(requestId), tenantId: actor.tenantId, subject: "customer", kind: "erasure" });
  if (!request?.verifiedAt || request.status === "rejected") throw new HttpError(409, "Verify the customer's request before erasure");
  if (request.status === "fulfilled") return { erased: true };
  const contact = await Contact.findOne({ _id: request.contactId, tenantId: actor.tenantId }).lean();
  if (!contact) throw new HttpError(404, "Contact not found");
  const tenantId = actor.tenantId, phone = contact.phone;
  const Message = require("../models/Message"), Inbox = require("../models/InboxMessage"), Conversation = require("../models/Conversation");
  const Media = require("../models/MediaAsset"), Batch = require("../models/MessageBatch"), Webhook = require("../models/WebhookEvent");
  const reports = await Media.find({ tenantId, recipientContactId: contact._id }).lean();
  if (!request.processingRetentionEvaluatedAt) {
    const latest = await Promise.all([
      Message.findOne({ tenantId, to: phone }).sort({ updatedAt: -1 }).select("createdAt updatedAt").lean(),
      Inbox.findOne({ tenantId, customerPhone: phone }).sort({ updatedAt: -1 }).select("createdAt updatedAt").lean()
    ]);
    const minimum = require("../utils/privacyRetention").processingRetentionUntil([contact, ...reports, ...latest]);
    const holds = [request.legalHoldUntil, minimum, ...reports.map(report => report.legalHoldUntil)].filter(Boolean).map(value => new Date(value).getTime());
    if (holds.length) request.legalHoldUntil = new Date(Math.max(...holds));
    request.processingRetentionEvaluatedAt = new Date(); await request.save();
  }
  await require("../models/SuppressionEntry").updateOne({ tenantId, recipientHash: suppressionHash(tenantId, phone) }, { $setOnInsert: { reason: "erasure" } }, { upsert: true });
  await Contact.updateOne({ _id: contact._id, tenantId }, { $set: { status: "opted_out", "optIn.status": false } });
  await Media.updateMany({ tenantId, recipientContactId: contact._id }, { $set: { disabledAt: new Date() } });
  if (request.legalHoldUntil && request.legalHoldUntil > new Date()) {
    request.status = "in_review"; request.response = "Further messaging and report access have been restricted; erasure is deferred for the recorded legal retention period.";
    await request.save(); throw new HttpError(409, "The request has a legal retention hold; further messaging and report access are restricted");
  }
  if (await Message.exists({ tenantId, to: phone, status: "processing" })) throw new HttpError(409, "A send is already in progress. Future sends are blocked; retry erasure after it finishes");
  if (await require("../models/MediaDelivery").exists({ tenantId, contactId: contact._id, status: "processing" })) {
    throw new HttpError(409, "A recipient-specific upload is still processing. Further messaging and report access are restricted; retry erasure after the request finishes or is recovered");
  }
  await Message.updateMany({ tenantId, to: phone, status: { $in: ["queued", "scheduled"] } }, { $set: { status: "cancelled" } });
  const tenant = await require("../models/Tenant").findById(tenantId).select("meta.wabaId meta.phoneNumberId").lean();
  const webhookFilter = { $or: [{ tenantId }, ...(tenant?.meta?.wabaId ? [{ wabaId: tenant.meta.wabaId }] : [])] };
  const [webhookIds, batchIds, conversations] = await Promise.all([
    matchingRows(Webhook, webhookFilter, phone, "payload"), matchingRows(Batch, { tenantId }, phone, "result"),
    Conversation.find({ tenantId, customerPhone: phone }).select("_id").lean()
  ]);
  const conversationIds = conversations.map(row => row._id);
  if (await Webhook.exists({ _id: { $in: webhookIds }, status: { $in: ["queued", "processing", "retry"] } })) {
    throw new HttpError(409, "Related webhook processing is pending. Further messaging and report access are restricted; retry erasure after processing finishes");
  }
  for (const report of reports) await require("./media.service").deleteMedia(tenantId, report.mediaId);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Message.deleteMany({ tenantId, to: phone }, { session });
      await Inbox.deleteMany({ tenantId, customerPhone: phone }, { session });
      await require("../models/RecipientUsage").deleteMany({ tenantId, recipient: phone }, { session });
      await require("../models/AutomationExecution").deleteMany({ tenantId, conversationId: { $in: conversationIds } }, { session });
      await Conversation.deleteMany({ tenantId, customerPhone: phone }, { session });
      await require("../models/ContactStatusEvent").deleteMany({ tenantId, contactId: contact._id }, { session });
      // Preserve the provider event key so retries cannot recreate erased data.
      await Webhook.updateMany({ _id: { $in: webhookIds } }, { $set: { payload: { privacyErased: true }, error: "" } }, { session });
      await Batch.updateMany({ tenantId, _id: { $in: batchIds } }, { $set: { result: { privacyErased: true } } }, { session });
      await Contact.deleteOne({ _id: contact._id, tenantId }, { session });
      await require("../models/MediaDelivery").updateMany({ tenantId, contactId: contact._id }, {
        $set: { status: "erased" }, $unset: { contactId: "", mediaId: "", messageId: "", leaseToken: "", leaseUntil: "", reportBindings: "" }
      }, { session });
      request.status = "fulfilled"; request.resolvedAt = new Date(); request.notes = "Verified customer erasure request";
      request.response = "Operational contact data and linked reports erased. Minimal suppression and security/legal evidence remain; copies already delivered to recipients cannot be recalled.";
      await request.save({ session });
      await Audit.create([{ tenantId, actorId: actor._id, action: "privacy.erased", resourceId: String(request._id) }], { session });
    });
  } finally { await session.endSession(); }
  return { erased: true };
}
async function restoreSuppression(actor, body) {
  if (!owner(actor) || body.confirmedFreshConsent !== true || !String(body.reference || "").trim()) throw new HttpError(400, "Owner/admin permission and a fresh verified consent reference are required");
  const phone = String(body.phone || "").replace(/\D/g, "");
  if (!/^\d{11,15}$/.test(phone)) throw new HttpError(400, "Use the full number including country code");
  const recipientHash = suppressionHash(actor.tenantId, phone), session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await require("../models/ConsentEvidence").create([{ tenantId: actor.tenantId, actorId: actor._id, recipientHash, reference: body.reference }], { session });
      await require("../models/SuppressionEntry").deleteOne({ tenantId: actor.tenantId, recipientHash }, { session });
      await Audit.create([{ tenantId: actor.tenantId, actorId: actor._id, action: "privacy.fresh-consent", resourceId: recipientHash }], { session });
    });
  } finally { await session.endSession(); }
  return { restored: true };
}
module.exports = { createRequest, listRequests, reviewRequest, contactExport, streamContactExport, eraseContact, suppressionHash, restoreSuppression };
