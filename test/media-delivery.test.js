const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "media-test-jwt-key-isolated-1234567890", DATA_ENCRYPTION_KEY: "media-test-data-key-isolated-1234567890",
  CLOUDINARY_CLOUD_NAME: "media-test", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret",
  WEBHOOK_RETENTION_DAYS: "366", WHATSAPP_PAIR_MIN_INTERVAL_MS: "0", WHATSAPP_DAILY_UNIQUE_LIMIT: "0", WHATSAPP_DEFAULT_MPS: "1000" });
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../src/app");
const { v2: cloudinary } = require("cloudinary");
const Tenant = require("../src/models/Tenant"), Contact = require("../src/models/Contact"), User = require("../src/models/User");
const Media = require("../src/models/MediaAsset"), Receipt = require("../src/models/MediaDelivery"), Message = require("../src/models/Message");
const Template = require("../src/models/Template"), messages = require("../src/services/message.service");
const { signAuthToken } = require("../src/services/authToken.service");
const fixtures = {
  document: { buffer: Buffer.from("%PDF-1.4\nSynthetic invoice\n"), name: "invoice.pdf", mime: "application/pdf" },
  image: { buffer: Buffer.from("89504e470d0a1a0a0000000000000000", "hex"), name: "photo.png", mime: "image/png" },
  video: { buffer: Buffer.from("00000018667479706d703432000000006d70343269736f6d", "hex"), name: "video.mp4", mime: "video/mp4" }
};
let database, tenant, contact, owner, key;
const phone = "919876543210";
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await require("../src/config/indexes").ensureCriticalIndexes();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  tenant = await Tenant.create({ businessName: "Synthetic Business", contactPerson: "Owner", businessEmail: "owner@example.test", whatsappNumber: "9876543210",
    processingTerms: { version: "2026-10-29", acceptedAt: new Date() },
    billing: { plan: "monthly", status: "active", currentPeriodEnd: new Date(Date.now() + 86400000) },
    meta: { phoneNumberId: "123456", wabaId: "987654", accessToken: "test-token" } });
  contact = await Contact.create({ tenantId: tenant._id, name: "Customer", phone, optIn: { status: true, proof: "Client permission reference" } });
  owner = await User.create({ tenantId: tenant._id, name: "Owner", email: "owner@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  key = (await require("../src/services/apiKey.service").createApiKey(tenant._id, { name: "Test integration" })).key;
  for (const type of Object.keys(fixtures)) await Template.create({ tenantId: tenant._id, name: `file_${type}`, category: "utility",
    status: "approved", language: "en", body: "Hello {{1}}", parameterCount: 1, headerType: type });
});
function mockUpload(t) {
  return t.mock.method(cloudinary.uploader, "upload", async (file, options) => {
    assert.equal(options.type, "authenticated"); assert.ok(fs.existsSync(file));
    return { public_id: options.public_id, asset_id: options.public_id, secure_url: `https://res.cloudinary.com/media-test/${options.resource_type}/authenticated/${options.public_id}`,
      bytes: fs.statSync(file).size, format: options.resource_type === "image" ? "png" : options.resource_type === "video" ? "mp4" : "" };
  });
}
function send(type = "document", fields = {}, idempotency = "request-0001", fixture = fixtures[type], auth = key) {
  let req = request(app).post("/api/v1/messages/send-media");
  if (auth) req = req.set("Authorization", `Bearer ${auth}`);
  req = req.set("Idempotency-Key", idempotency);
  for (const [name, value] of Object.entries({ to: phone, templateName: `file_${type}`, language: "en", permissionConfirmed: "true", variables: '["Customer"]', ...fields })) req = req.field(name, value);
  return req.attach("file", fixture.buffer, { filename: fixture.name, contentType: fixture.mime });
}

for (const type of Object.keys(fixtures)) test(`${type} is privately uploaded, bound to one number and delivered with template text`, async t => {
  mockUpload(t);
  const response = await send(type).expect(202);
  const asset = await Media.findOne({ mediaId: response.body.mediaId }).select("+recipientHash").lean();
  assert.equal(asset.deliveryScope, "recipient"); assert.equal(String(asset.recipientContactId), String(contact._id));
  assert.equal(asset.deliveryType, "authenticated"); assert.ok(asset.recipientHash.startsWith("lookup:v1:"));
  assert.ok(!JSON.stringify(response.body).includes("cloudinary"));
  assert.equal((await Receipt.findOne({})).status, "queued");
  const other = await Contact.create({ tenantId: tenant._id, name: "Other", phone: "919000000002", optIn: { status: true } });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: other._id, templateName: `file_${type}`, variables: ["Other"], mediaId: asset.mediaId }), /different recipient/);
  await assert.rejects(require("../src/services/template.service").createMetaHeaderHandle("unused", asset), /synthetic/);
  let delivered;
  t.mock.method(global, "fetch", async (_url, options) => {
    if (!options.body) return new Response(JSON.stringify({ health_status: { can_send_message: "AVAILABLE" } }), { status: 200, headers: { "Content-Type": "application/json" } });
    delivered = JSON.parse(options.body);
    return new Response(JSON.stringify({ messages: [{ id: `wamid.test-${type}` }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const processed = await messages.processNextQueuedMessage("media-test-worker");
  assert.ok(delivered, JSON.stringify({ processed, message: await Message.findOne({}).lean() }));
  assert.equal(delivered.to, phone);
  assert.equal(delivered.template.components[0].parameters[0].type, type);
  assert.match(delivered.template.components[0].parameters[0][type].link, /expires_at=/);
  assert.equal(delivered.template.components[1].parameters[0].text, "Customer");
  assert.equal(await Message.countDocuments({}), 1);
});

test("same request is replayed once; changed number, file and text conflict", async t => {
  const upload = mockUpload(t);
  const first = (await send().expect(202)).body;
  const retry = (await send().expect(202)).body;
  assert.equal(retry.idempotent, true); assert.equal(first.messageId, retry.messageId);
  await send("document", { to: "919000000002" }).expect(409);
  await send("document", { variables: '["Changed"]' }).expect(409);
  await send("document", {}, "request-0001", { ...fixtures.document, buffer: Buffer.from("%PDF-1.4\nDifferent invoice\n") }).expect(409);
  assert.equal(upload.mock.calls.length, 1); assert.equal(await Message.countDocuments({}), 1); assert.equal(await Media.countDocuments({}), 1);
});

test("parallel retries enqueue a single message and do not upload twice", async t => {
  const upload = mockUpload(t);
  const responses = await Promise.all([send(), send()]);
  assert.ok(responses.some(response => response.status === 202));
  assert.ok(responses.every(response => [202, 409].includes(response.status)));
  assert.equal(await Message.countDocuments({}), 1); assert.equal(upload.mock.calls.length, 1);
});

test("invalid permission, recipient lists, file/template mismatch and inactive recipients fail before upload", async t => {
  const upload = mockUpload(t);
  await send("document", { permissionConfirmed: "false" }).expect(400);
  await send("document", { to: phone + ",919000000002" }).expect(400);
  await send("document", { contactIds: String(contact._id) }).expect(400);
  await send("document", { templateName: "file_image" }).expect(400);
  await send("document", {}, "request-0001", fixtures.document, null).expect(401);
  await Contact.updateOne({ _id: contact._id }, { $set: { status: "opted_out" } });
  await send("document", {}, "request-optout").expect(403);
  assert.equal(upload.mock.calls.length, 0); assert.equal(await Message.countDocuments({}), 0);
});

test("a changed contact number cannot reuse an existing recipient-specific file", async t => {
  mockUpload(t);
  const sent = (await send().expect(202)).body;
  await Contact.updateOne({ _id: contact._id }, { $set: { phone: "919000000003" } });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"], mediaId: sent.mediaId }), /number changed/);
  let called = false; t.mock.method(global, "fetch", async () => { called = true; throw new Error("Do not send"); });
  await messages.processNextQueuedMessage("changed-number-worker");
  assert.equal(called, false); assert.equal((await Message.findOne({})).status, "failed");
});

test("failed upload and expired processing lease can recover safely using the same key", async t => {
  const upload = t.mock.method(cloudinary.uploader, "upload", async () => { throw new Error("Synthetic upload failure"); });
  await send().expect(502);
  const receipt = await Receipt.findOne({}); assert.equal(receipt.status, "failed");
  await Receipt.updateOne({ _id: receipt._id }, { $set: { status: "processing", leaseToken: "stale", leaseUntil: new Date(0) } });
  const maintenance = require("../src/services/privacyMaintenance.service");
  assert.equal((await maintenance.deliveries()).stale, 1);
  assert.equal((await Receipt.findById(receipt._id)).status, "processing");
  assert.equal((await maintenance.deliveries({ apply: true })).retryable, 1);
  await Receipt.updateOne({ _id: receipt._id }, { $set: { status: "processing", leaseToken: "stale-again", leaseUntil: new Date(0) } });
  upload.mock.restore(); const working = mockUpload(t);
  await send().expect(202);
  assert.equal(working.mock.calls.length, 1); assert.equal(await Receipt.countDocuments({}), 1); assert.equal(await Message.countDocuments({}), 1);
});

test("healthcare reference and terms apply only to report deliveries; new business contacts default to service-only", async t => {
  const upload = mockUpload(t);
  await Tenant.updateOne({ _id: tenant._id }, { $unset: { processingTerms: "" } });
  await send("document", { purpose: "patient_report", consentReference: "lab-ref" }, "request-health").expect(409);
  assert.equal(upload.mock.calls.length, 0);
  await send("image", { to: "919000000009", name: "New recipient" }, "request-business").expect(202);
  const created = await Contact.findOne({ tenantId: tenant._id, phone: "919000000009" });
  assert.equal(created.optIn.status, true); assert.equal(created.optIn.scope, "service_only");
});

test("portal permissions and private media access preserve tenant isolation", async t => {
  const upload = mockUpload(t);
  const sent = (await send("image").expect(202)).body;
  const agent = await User.create({ tenantId: tenant._id, name: "Agent", email: "agent@example.test", passwordHash: "unused", role: "agent", isVerified: true });
  await request(app).get(`/api/media/${sent.mediaId}/content`).set("Authorization", `Bearer ${signAuthToken(agent)}`).expect(403);
  const outsider = await User.create({ tenantId: new mongoose.Types.ObjectId(), name: "Outsider", email: "other@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  await request(app).get(`/api/media/${sent.mediaId}/content`).set("Authorization", `Bearer ${signAuthToken(outsider)}`).expect(404);
  await request(app).post("/api/messages/send-media").set("Origin", "http://localhost:5000").set("Authorization", `Bearer ${signAuthToken(agent)}`)
    .attach("file", fixtures.image.buffer, { filename: "photo.png", contentType: "image/png" }).expect(403);
  assert.equal(upload.mock.calls.length, 1);
});

test("verified erasure removes recipient files and preserves a receipt that cannot deliver again", async t => {
  mockUpload(t); t.mock.method(cloudinary.uploader, "destroy", async () => ({ result: "ok" }));
  await send().expect(202);
  const privacy = require("../src/services/privacy.service");
  const dataRequest = await privacy.createRequest(owner, { subject: "customer", kind: "erasure", contactId: contact._id });
  await privacy.reviewRequest(owner, dataRequest._id, { status: "verified", response: "Client identity and authority verified" });
  await privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" });
  const receipt = await Receipt.findOne({}).lean();
  assert.equal(receipt.status, "erased"); assert.equal(receipt.contactId, undefined);
  assert.equal(await Media.countDocuments({}), 0); assert.equal(await Message.countDocuments({}), 0);
  await send().expect(410);
});

test("erasure defers an in-progress file upload and blocks further messaging", async () => {
  const pending = await Receipt.create({ tenantId: tenant._id, contactId: contact._id, keyHash: "synthetic-key-hash",
    fingerprint: "synthetic-fingerprint", status: "processing", leaseToken: "active", leaseUntil: new Date(Date.now() + 60000) });
  const privacy = require("../src/services/privacy.service");
  const dataRequest = await privacy.createRequest(owner, { subject: "customer", kind: "erasure", contactId: contact._id });
  await privacy.reviewRequest(owner, dataRequest._id, { status: "verified", response: "Client checked authority" });
  await assert.rejects(privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" }), /upload is still processing/);
  assert.equal((await Contact.findById(contact._id)).status, "opted_out");
  await Receipt.updateOne({ _id: pending._id }, { $set: { status: "failed" } });
  await privacy.eraseContact(owner, dataRequest._id, { confirmation: "ERASE" });
  assert.equal((await Receipt.findById(pending._id)).status, "erased");
});
