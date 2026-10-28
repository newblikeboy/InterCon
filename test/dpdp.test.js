const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "dpdp-test-jwt-key-not-for-production-123456", DATA_ENCRYPTION_KEY: "dpdp-test-data-key-not-for-production-123456",
  CLOUDINARY_CLOUD_NAME: "privacy-test", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret", WEBHOOK_RETENTION_DAYS: "366",
  WHATSAPP_PAIR_MIN_INTERVAL_MS: "0", WHATSAPP_DAILY_UNIQUE_LIMIT: "0" });
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest"), app = require("../src/app");
const { v2: cloudinary } = require("cloudinary");
const Tenant = require("../src/models/Tenant"), User = require("../src/models/User"), Contact = require("../src/models/Contact");
const Media = require("../src/models/MediaAsset"), Message = require("../src/models/Message"), Conversation = require("../src/models/Conversation");
const Inbox = require("../src/models/InboxMessage"), Template = require("../src/models/Template"), Webhook = require("../src/models/WebhookEvent"), Batch = require("../src/models/MessageBatch");
const privacy = require("../src/services/privacy.service"), media = require("../src/services/media.service"), messages = require("../src/services/message.service");
const maintenance = require("../src/services/privacyMaintenance.service");
const { signAuthToken } = require("../src/services/authToken.service");
const phone = "919876543210";
let database, tenant, owner, contact;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await require("../src/config/indexes").ensureCriticalIndexes();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  tenant = await Tenant.create({ businessName: "Test Lab", contactPerson: "Owner", businessEmail: "lab@example.test", whatsappNumber: "9876543210",
    processingTerms: { version: "2026-10-29", acceptedAt: new Date() },
    billing: { plan: "monthly", status: "active", currentPeriodEnd: new Date(Date.now() + 86400000) },
    meta: { phoneNumberId: "123456", wabaId: "987654", accessToken: "test-token" } });
  owner = await User.create({ tenantId: tenant._id, name: "Owner", email: "owner@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  contact = await Contact.create({ tenantId: tenant._id, name: "Test Patient", phone, optIn: { status: true, proof: "Lab reference" } });
});
async function report(t) {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "intercon-dpdp-test-"));
  const filePath = path.join(folder, "report.pdf"); fs.writeFileSync(filePath, "%PDF-1.4\nSynthetic test report\n");
  t.after(() => { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); fs.rmdirSync(folder); });
  t.mock.method(cloudinary.uploader, "upload", async (_file, options) => {
    assert.equal(options.type, "authenticated");
    return { public_id: "private/report.pdf", asset_id: "test-asset", secure_url: "https://res.cloudinary.com/privacy-test/raw/authenticated/report.pdf", bytes: 40 };
  });
  return media.createMedia(tenant._id, { path: filePath, originalname: "test-patient-report.pdf", size: 40 }, {
    purpose: "patient_report", recipientContactId: String(contact._id), recipientVerified: true, consentReference: "LAB-CONSENT-TEST", title: "Private lab report"
  });
}
test("patient PDFs use authenticated storage, encrypted metadata and a single verified recipient", async t => {
  const asset = await report(t);
  assert.match(asset.url, /^\/api\/media\//);
  const stored = await Media.collection.findOne({ mediaId: asset.mediaId });
  assert.equal(stored.deliveryType, "authenticated"); assert.ok(!JSON.stringify(stored).includes("LAB-CONSENT-TEST"));
  const loaded = await Media.findOne({ mediaId: asset.mediaId }).lean();
  assert.throws(() => media.assertReportRecipient(loaded, { _id: new mongoose.Types.ObjectId() }, { category: "utility" }), /different recipient/);
  assert.throws(() => media.assertReportRecipient(loaded, contact, { category: "marketing" }), /utility/);
  await Template.create({ tenantId: tenant._id, name: "result_ready", category: "utility", status: "approved", language: "en", body: "Report ready", parameterCount: 0, headerType: "document" });
  const other = await Contact.create({ tenantId: tenant._id, name: "Other", phone: "919000000001", optIn: { status: true } });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: other._id, templateName: "result_ready", mediaId: asset.mediaId }), /different recipient/);
  assert.equal(await Message.countDocuments({}), 0);
  await messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "result_ready", mediaId: asset.mediaId });
  await Media.updateOne({ mediaId: asset.mediaId }, { $set: { recipientContactId: other._id } });
  let called = false; t.mock.method(global, "fetch", async () => { called = true; throw new Error("Provider should not be called"); });
  await messages.processNextQueuedMessage("test-worker");
  assert.equal(called, false); assert.equal((await Message.findOne({})).status, "failed");
});
test("patient-report content checks tenant and role, emits no public URL, and expires", async t => {
  const asset = await report(t);
  await request(app).get(asset.url).expect(401);
  const other = await User.create({ tenantId: new mongoose.Types.ObjectId(), name: "Other", email: "other@example.test", passwordHash: "unused" });
  await request(app).get(asset.url).set("Authorization", `Bearer ${signAuthToken(other)}`).expect(404);
  const agent = await User.create({ tenantId: tenant._id, name: "Agent", email: "agent@example.test", passwordHash: "unused", role: "agent" });
  await request(app).get(asset.url).set("Authorization", `Bearer ${signAuthToken(agent)}`).expect(403);
  t.mock.method(global, "fetch", async url => {
    const parsed = new URL(url); assert.ok(Number(parsed.searchParams.get("expires_at")) <= Date.now() / 1000 + 305);
    return new Response("%PDF-1.4\nSynthetic", { status: 200, headers: { "Content-Type": "application/pdf" } });
  });
  const response = await request(app).get(asset.url).set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(200);
  assert.match(response.headers["cache-control"], /no-store/); assert.equal(response.headers.location, undefined);
  assert.ok(await require("../src/models/SecurityAudit").exists({ action: "media.read", resourceId: asset.mediaId }));
  await Media.updateOne({ mediaId: asset.mediaId }, { $set: { accessExpiresAt: new Date(0) } });
  await request(app).get(asset.url).set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(410);
});
test("reports cannot be template-approval samples", async t => {
  const asset = await report(t);
  await assert.rejects(require("../src/services/template.service").createMetaHeaderHandle("test-token", await Media.findOne({ mediaId: asset.mediaId }).lean()), /synthetic sample|patient reports/i);
});
test("inbound enquiries do not grant marketing consent and STOP blocks queued messages", async t => {
  const webhook = require("../src/services/webhook.service");
  const inbound = (id, from, text) => webhook.processInboundMessages(tenant._id, { messages: [{ id, from, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: text } }] }, "987654", "123456");
  await inbound("enquiry", "919000000002", "What are your opening hours?");
  assert.equal((await Contact.findOne({ tenantId: tenant._id, phone: "919000000002" })).optIn.status, false);
  await Template.create({ tenantId: tenant._id, name: "notice", category: "utility", status: "approved", body: "Ready", parameterCount: 0 });
  await Message.create({ tenantId: tenant._id, contactId: contact._id, to: phone, templateName: "notice", phoneNumberId: "123456" });
  await inbound("withdrawal", phone, "STOP");
  assert.equal((await Contact.findById(contact._id)).status, "opted_out");
  let called = false; t.mock.method(global, "fetch", async () => { called = true; throw new Error("No send expected"); });
  await messages.processNextQueuedMessage("withdrawal-worker"); assert.equal(called, false);
});
test("verified erasure removes linked data and reports while preserving suppression and idempotency", async t => {
  const asset = await report(t);
  const conversation = await Conversation.create({ tenantId: tenant._id, contactId: contact._id, customerPhone: phone });
  await Inbox.create({ tenantId: tenant._id, conversationId: conversation._id, customerPhone: phone, direction: "in", text: "Private content" });
  await Message.create({ tenantId: tenant._id, to: phone, templateName: "result", mediaId: asset.mediaId });
  await Webhook.create({ tenantId: tenant._id, eventKey: "patient-event", payload: { value: { contacts: [{ wa_id: phone }] } } });
  await Batch.create({ tenantId: tenant._id, key: "old-key", requestHash: "hash", result: { to: phone } });
  const dataRequest = await privacy.createRequest(owner, { subject: "customer", kind: "erasure", contactId: contact._id, notes: "External request reference" });
  await assert.rejects(privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" }), /Verify/);
  await privacy.reviewRequest(owner, dataRequest._id, { status: "verified", response: "Identity and authority checked by client" });
  t.mock.method(cloudinary.uploader, "destroy", async (_id, options) => { assert.equal(options.type, "authenticated"); return { result: "ok" }; });
  await assert.rejects(privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" }), /webhook processing is pending/);
  await Webhook.updateOne({ eventKey: "patient-event" }, { $set: { status: "processed" } });
  await privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" });
  assert.equal(await Contact.countDocuments({ _id: contact._id }), 0); assert.equal(await Inbox.countDocuments({}), 0);
  assert.equal(await Message.countDocuments({}), 0); assert.equal(await Media.countDocuments({}), 0);
  const retainedWebhook = await Webhook.findOne({ eventKey: "patient-event" }).lean();
  assert.equal(retainedWebhook.status, "processed"); assert.deepEqual(retainedWebhook.payload, { privacyErased: true });
  assert.equal((await Batch.findOne({})).result.privacyErased, true);
  assert.ok(!JSON.stringify(await require("../src/models/SuppressionEntry").collection.findOne({})).includes(phone));
  await assert.rejects(require("../src/services/contact.service").createContact(tenant._id, { name: "Reimport", phone, optIn: true }), /erased/);
  const imported = await require("../src/services/contact.service").importContacts(tenant._id, [{ name: "Reimport", phone, optIn: true }]);
  assert.equal(imported.imported, 0);
  await privacy.restoreSuppression(owner, { phone, confirmedFreshConsent: true, reference: "New independently verified permission" });
  assert.ok(!JSON.stringify(await require("../src/models/ConsentEvidence").collection.findOne({})).includes("independently verified"));
  await require("../src/services/contact.service").createContact(tenant._id, { name: "New consent", phone, optIn: true });
});
test("privacy requests and exports enforce ownership, encrypt notes, and retain legal holds", async () => {
  const dataRequest = await privacy.createRequest(owner, { subject: "customer", kind: "erasure", contactId: contact._id, notes: "Private request details" });
  assert.ok(!JSON.stringify(await require("../src/models/PrivacyRequest").collection.findOne({})).includes("Private request details"));
  const foreign = { _id: new mongoose.Types.ObjectId(), tenantId: new mongoose.Types.ObjectId(), role: "owner" };
  assert.equal((await privacy.listRequests(foreign)).length, 0);
  await assert.rejects(privacy.contactExport(foreign, contact._id), /not found/);
  await privacy.reviewRequest(owner, dataRequest._id, { status: "verified", response: "Retention required by recorded legal instruction", legalHoldUntil: new Date(Date.now() + 86400000).toISOString() });
  await assert.rejects(privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" }), /retention hold/);
  assert.equal((await privacy.contactExport(owner, contact._id)).contact.phone, phone);
});
test("legacy-media, consent and TTL migrations default to read-only and are repeatable", async t => {
  await Media.create({ tenantId: tenant._id, title: "Legacy", mediaType: "document", cloudinaryPublicId: "legacy.pdf", cloudinaryAssetId: "legacy-id", secureUrl: "https://example.test/old.pdf" });
  assert.equal((await maintenance.media()).pending, 1); assert.equal((await Media.findOne({})).deliveryType, "upload");
  t.mock.method(cloudinary.uploader, "rename", async (_from, _to, options) => { assert.equal(options.to_type, "authenticated"); assert.equal(options.invalidate, true); return { secure_url: "https://example.test/authenticated.pdf" }; });
  await maintenance.media({ apply: true }); assert.equal((await maintenance.media()).pending, 0);
  const legacy = await Contact.create({ tenantId: tenant._id, phone: "919000000003", name: "Legacy", source: "whatsapp_inbound", optIn: { status: true, proof: "Customer initiated WhatsApp conversation" } });
  assert.equal((await maintenance.consent()).pending, 1); assert.equal((await Contact.findById(legacy._id)).optIn.status, true);
  await maintenance.consent({ apply: true }); assert.equal((await Contact.findById(legacy._id)).optIn.status, false);
  await mongoose.connection.db.command({ collMod: Webhook.collection.name, index: { name: "createdAt_1", expireAfterSeconds: 30 * 86400 } });
  assert.ok((await maintenance.indexes()).some(row => row.pending));
  await maintenance.indexes({ apply: true }); assert.ok((await maintenance.indexes()).every(row => !row.pending));
});

test("service-only permission does not authorise marketing and is checked again before delivery", async () => {
  await Contact.updateOne({ _id: contact._id }, { $set: { "optIn.scope": "service_only" } });
  await Template.create({ tenantId: tenant._id, name: "offer", category: "marketing", status: "approved", body: "Offer", parameterCount: 0 });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "offer" }), /Service-only/);
  await Message.create({ tenantId: tenant._id, to: phone, templateName: "offer", phoneNumberId: "123456" });
  await messages.processNextQueuedMessage("scope-worker");
  assert.match((await Message.findOne({})).error, /Service-only/);
});

test("full streamed contact export crosses the page boundary and excludes other tenants", async () => {
  await Message.insertMany(Array.from({ length: 1001 }, () => ({ tenantId: tenant._id, to: phone, templateName: "notice" })));
  const response = await request(app).get(`/api/privacy/contacts/${contact._id}/export?format=ndjson`).set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(200);
  const rows = (response.text || response.body.toString("utf8")).trim().split("\n").map(line => JSON.parse(line));
  assert.equal(rows.filter(row => row.type === "Message").length, 1001);
  assert.equal(rows[0].data.phone, phone); assert.match(response.headers["cache-control"], /no-store/);
  assert.ok(!JSON.stringify(rows).includes("__private"));
});

test("minimum-retention calculation uses processing time and does not extend on metadata-only updates", () => {
  const { processingRetentionUntil } = require("../src/utils/privacyRetention");
  const record = { createdAt: new Date("2027-05-15"), lastProcessedAt: new Date("2027-06-01"), updatedAt: new Date("2028-06-01") };
  assert.equal(processingRetentionUntil([record], Date.parse("2026-10-29")), null);
  assert.equal(processingRetentionUntil([record], Date.parse("2027-06-02")).getTime(), Date.parse("2027-06-01") + 366 * 86400000);
});
