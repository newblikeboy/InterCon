const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "media-test-jwt-key-isolated-1234567890", DATA_ENCRYPTION_KEY: "media-test-data-key-isolated-1234567890",
  CLOUDINARY_CLOUD_NAME: "media-test", CLOUDINARY_API_KEY: "test-key", CLOUDINARY_API_SECRET: "test-secret",
  FB_APP_ID: "sample-test-app",
  WEBHOOK_RETENTION_DAYS: "366", WHATSAPP_PAIR_MIN_INTERVAL_MS: "0", WHATSAPP_DAILY_UNIQUE_LIMIT: "0", WHATSAPP_DEFAULT_MPS: "1000" });
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");
const app = require("../src/app");
const { v2: cloudinary } = require("cloudinary");
const metaMedia = require("../src/services/metaMedia.service");
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
  const cloudUpload = t.mock.method(cloudinary.uploader, "upload", async (file, options) => {
    assert.equal(options.type, "authenticated"); assert.ok(fs.existsSync(file));
    return { public_id: options.public_id, asset_id: options.public_id, secure_url: `https://res.cloudinary.com/media-test/${options.resource_type}/authenticated/${options.public_id}`,
      bytes: fs.statSync(file).size, format: options.resource_type === "image" ? "png" : options.resource_type === "video" ? "mp4" : "" };
  });
  let sequence = 0;
  const metaUpload = t.mock.method(metaMedia, "upload", async (_tenantId, file) => {
    assert.ok(fs.existsSync(file.path));
    return { metaMediaId: String(123450000 + ++sequence), metaPhoneNumberId: "123456", metaMediaExpiresAt: new Date(Date.now() + 30 * 86400000 - 300000) };
  });
  t.mock.method(metaMedia, "remove", async () => {});
  metaUpload.cloudinary = cloudUpload;
  return metaUpload;
}
function send(type = "document", fields = {}, idempotency = "request-0001", fixture = fixtures[type], auth = key) {
  let req = request(app).post("/api/v1/messages/send-media");
  if (auth) req = req.set("Authorization", `Bearer ${auth}`);
  req = req.set("Idempotency-Key", idempotency);
  for (const [name, value] of Object.entries({ to: phone, templateName: `file_${type}`, language: "en", permissionConfirmed: "true", variables: '["Customer"]', ...fields })) req = req.field(name, value);
  return req.attach("file", fixture.buffer, { filename: fixture.name, contentType: fixture.mime });
}

async function libraryUpload(scope = "unique", purpose = "general") {
  const response = await request(app).post("/api/media").set("Origin", "http://localhost:5000")
    .set("Authorization", `Bearer ${signAuthToken(owner)}`).field("deliveryScope", scope).field("purpose", purpose)
    .field("title", "Library invoice").attach("file", fixtures.document.buffer, { filename: "invoice.pdf", contentType: "application/pdf" }).expect(201);
  return response.body.media;
}
function sendLibrary(mediaId, to = phone, idempotency = "library-send-0001", extra = {}) {
  return request(app).post("/api/v1/messages/send-media").set("Authorization", `Bearer ${key}`).set("Idempotency-Key", idempotency)
    .send({ to, mediaId, templateName: "file_document", language: "en", permissionConfirmed: true, variables: ["Customer"], ...extra });
}

test("unique library uploads remain unassigned until sending; common media stays reusable", async t => {
  const upload = mockUpload(t);
  const unique = await libraryUpload();
  assert.equal(unique.deliveryScope, "unique");
  assert.equal(unique.recipientContactId, undefined);
  const stored = await Media.findOne({ mediaId: unique.mediaId }).lean();
  assert.equal(stored.recipientHash, undefined);
  assert.ok(stored.accessExpiresAt);
  assert.equal(stored.storageProvider, "meta");
  const common = await libraryUpload("shared");
  assert.equal(common.deliveryScope, "shared");
  const queued = await sendLibrary(unique.mediaId).expect(202);
  assert.equal(queued.body.mediaId, unique.mediaId);
  assert.equal(upload.mock.callCount(), 1, "Sending an existing file must not upload it again");
  assert.equal(upload.cloudinary.mock.callCount(), 1, "Only the reusable common file belongs in Cloudinary");
  const assigned = await Media.findOne({ mediaId: unique.mediaId }).select("+recipientHash").lean();
  assert.equal(assigned.deliveryScope, "recipient");
  assert.equal(String(assigned.recipientContactId), String(contact._id));
  assert.ok(assigned.recipientHash);
  assert.ok(assigned.accessExpiresAt);
  assert.ok(assigned.accessExpiresAt <= stored.accessExpiresAt, "Assignment must not extend the provider file lifetime");
  const retry = await sendLibrary(unique.mediaId).expect(202);
  assert.equal(retry.body.messageId, queued.body.messageId);
  assert.equal(retry.body.idempotent, true);
  await Contact.create({ tenantId: tenant._id, name: "Other", phone: "919111111111", optIn: { status: true } });
  await sendLibrary(unique.mediaId, "919111111111", "library-other-0001").expect(403);
  await sendLibrary(common.mediaId, phone, "common-as-unique-0001").expect(400);
});

test("direct Meta uploads bypass Cloudinary quotas, stream the original file, clean temporary files and reuse the upload on retry", async t => {
  const env = require("../src/config/env");
  const previous = { cloudinaryCloudName: env.cloudinaryCloudName, cloudinaryApiKey: env.cloudinaryApiKey,
    cloudinaryApiSecret: env.cloudinaryApiSecret, mediaMaxAssetsPerTenant: env.mediaMaxAssetsPerTenant, mediaStorageQuotaBytes: env.mediaStorageQuotaBytes };
  t.after(() => Object.assign(env, previous));
  Object.assign(env, { cloudinaryCloudName: "", cloudinaryApiKey: "", cloudinaryApiSecret: "", mediaMaxAssetsPerTenant: 1, mediaStorageQuotaBytes: 1 });
  await Media.create({ tenantId: tenant._id, title: "Existing common file", mediaType: "document", bytes: 500,
    cloudinaryPublicId: "existing-common", secureUrl: "https://example.test/existing.pdf" });
  const cloud = t.mock.method(cloudinary.uploader, "upload", async () => { throw new Error("Unique files must never use Cloudinary"); });
  const paths = [], originalOpen = fs.openAsBlob;
  t.mock.method(fs, "openAsBlob", (...args) => { paths.push(args[0]); return originalOpen(...args); });
  let uploads = 0;
  t.mock.method(global, "fetch", async (url, options) => {
    assert.match(String(url), /\/123456\/media$/);
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get("messaging_product"), "whatsapp");
    assert.equal(options.body.get("type"), "application/pdf");
    const file = options.body.get("file");
    assert.equal(file.name, "invoice.pdf");
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), fixtures.document.buffer);
    uploads++;
    return new Response(JSON.stringify({ id: "987654321001" }), { status: 200 });
  });
  const first = await send().expect(202);
  const replay = await send().expect(202);
  assert.equal(replay.body.messageId, first.body.messageId);
  assert.equal(uploads, 1); assert.equal(cloud.mock.callCount(), 0);
  assert.equal(paths.length, 1); assert.equal(fs.existsSync(paths[0]), false, "Local binary must be removed after a durable upload");
  const asset = await Media.findOne({ mediaId: first.body.mediaId }).lean();
  assert.equal(asset.storageProvider, "meta"); assert.equal(asset.metaMediaId, "987654321001");
  assert.equal(asset.secureUrl, undefined); assert.equal(asset.cloudinaryAssetId, undefined);
  const queued = await Message.findById(first.body.messageId).lean();
  assert.equal(queued.metaMediaId, "987654321001"); assert.equal(queued.mediaUrl, undefined);
});

test("a failed Meta upload can be retried with the same request without keeping a local file or creating duplicate messages", async t => {
  const paths = [], originalOpen = fs.openAsBlob;
  t.mock.method(fs, "openAsBlob", (...args) => { paths.push(args[0]); return originalOpen(...args); });
  let attempts = 0;
  t.mock.method(global, "fetch", async (_url, options) => {
    await options.body.get("file").arrayBuffer();
    return ++attempts === 1 ? new Response(JSON.stringify({ error: { code: 2 } }), { status: 503 })
      : new Response(JSON.stringify({ id: "987654321002" }), { status: 200 });
  });
  await send().expect(502);
  assert.equal(await Media.countDocuments({}), 0); assert.equal(fs.existsSync(paths[0]), false);
  await send().expect(202);
  assert.equal(attempts, 2); assert.equal(await Message.countDocuments({}), 1); assert.equal(await Media.countDocuments({}), 1);
  assert.ok(paths.every(filePath => !fs.existsSync(filePath)));
});

test("a database failure after Meta upload cleans up the remote file and leaves the request retryable", async t => {
  const calls = [];
  t.mock.method(Media.prototype, "save", async () => { throw new Error("Synthetic metadata write failure"); });
  t.mock.method(global, "fetch", async (_url, options) => {
    calls.push(options.method);
    if (options.method === "POST") {
      await options.body.get("file").arrayBuffer();
      return new Response(JSON.stringify({ id: "987654321003" }), { status: 200 });
    }
    assert.equal(options.method, "DELETE");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  await send().expect(500);
  assert.deepEqual(calls, ["POST", "DELETE"]);
  assert.equal(await Media.countDocuments({}), 0); assert.equal(await Message.countDocuments({}), 0);
  assert.equal((await Receipt.findOne({})).status, "failed");
});

test("deleting a temporary Unique library file uses Meta rather than Cloudinary", async t => {
  const cloud = t.mock.method(cloudinary.uploader, "destroy", async () => { throw new Error("Meta files have no Cloudinary object"); });
  const methods = [];
  t.mock.method(global, "fetch", async (_url, options) => {
    methods.push(options.method);
    if (options.method === "POST") { await options.body.get("file").arrayBuffer(); return new Response(JSON.stringify({ id: "987654321004" }), { status: 200 }); }
    assert.equal(options.method, "DELETE");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  });
  const asset = await libraryUpload();
  await request(app).delete(`/api/media/${asset.mediaId}`).set("Origin", "http://localhost:5000").set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(200);
  assert.deepEqual(methods, ["POST", "DELETE"]); assert.equal(cloud.mock.callCount(), 0);
  assert.equal(await Media.countDocuments({}), 0);
});

test("expired Meta media blocks delivery and requires the original file again", async t => {
  mockUpload(t);
  const sent = (await send().expect(202)).body;
  await Media.updateOne({ mediaId: sent.mediaId }, { $set: { metaMediaExpiresAt: new Date(0) } });
  const provider = t.mock.method(global, "fetch", async () => { throw new Error("Expired media must not be sent"); });
  await messages.processNextQueuedMessage("expired-meta-worker");
  assert.equal((await Message.findById(sent.messageId)).status, "failed"); assert.equal(provider.mock.callCount(), 0);
  await sendLibrary(sent.mediaId, phone, "expired-library-send").expect(410);
});

test("Meta media downloads reject untrusted URLs without forwarding credentials", async t => {
  mockUpload(t);
  const asset = await libraryUpload();
  const provider = t.mock.method(global, "fetch", async url => {
    assert.equal(new URL(url).hostname, "graph.facebook.com");
    return new Response(JSON.stringify({ url: "https://untrusted.example/file.pdf" }), { status: 200 });
  });
  await request(app).get(asset.url).set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(502);
  assert.equal(provider.mock.callCount(), 1);
});

test("legacy Cloudinary recipient files keep working without migration or another upload", async t => {
  const asset = await Media.create({ tenantId: tenant._id, title: "Legacy invoice", mediaType: "document", mimeType: "application/pdf", bytes: 1024,
    cloudinaryPublicId: "legacy-invoice", secureUrl: "https://example.test/invoice.pdf", deliveryType: "authenticated", deliveryScope: "recipient", recipientContactId: contact._id });
  await messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"], mediaId: asset.mediaId });
  let delivered;
  t.mock.method(global, "fetch", async (_url, options) => {
    if (!options.body) return new Response(JSON.stringify({ health_status: { can_send_message: "AVAILABLE" } }), { status: 200 });
    delivered = JSON.parse(options.body);
    return new Response(JSON.stringify({ messages: [{ id: "wamid.legacy-file" }] }), { status: 200 });
  });
  await messages.processNextQueuedMessage("legacy-media-worker");
  assert.match(delivered.template.components[0].parameters[0].document.link, /expires_at=/);
  assert.equal(delivered.template.components[0].parameters[0].document.id, undefined);
  assert.ok(await Media.exists({ _id: asset._id }));
});

test("competing library sends cannot assign a unique file to two recipients", async t => {
  mockUpload(t);
  const unique = await libraryUpload();
  await Contact.create({ tenantId: tenant._id, name: "Other", phone: "919111111111", optIn: { status: true } });
  const results = await Promise.all([
    sendLibrary(unique.mediaId, phone, "library-race-0001"),
    sendLibrary(unique.mediaId, "919111111111", "library-race-0002")
  ]);
  assert.deepEqual(results.map(response => response.status).sort(), [202, 403]);
  assert.equal(await Message.countDocuments({ tenantId: tenant._id, mediaId: unique.mediaId }), 1);
});

test("unassigned patient PDFs require permission at send time and unique files cannot bypass recipient checks", async t => {
  mockUpload(t);
  const unique = await libraryUpload("unique", "patient_report");
  await sendLibrary(unique.mediaId).expect(400);
  assert.equal((await Media.findOne({ mediaId: unique.mediaId })).recipientContactId, undefined);
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"], mediaId: unique.mediaId }), /different recipient/);
  await sendLibrary(unique.mediaId, phone, "library-report-0001", { consentReference: "SYNTHETIC-PERMISSION" }).expect(202);
});

test("template delivery mode is saved locally, survives Meta sync, and is excluded from Meta's payload", async t => {
  mockUpload(t);
  const sample = await libraryUpload("unique", "patient_report");
  const service = require("../src/services/template.service");
  const body = { name: "unique_invoice", category: "utility", language: "en", body: "Your invoice is ready.",
    headerType: "document", mediaMode: "unique", headerMediaId: sample.mediaId };
  assert.equal((await service.createTemplateDraft(tenant._id, body)).mediaMode, "unique");
  let metaPayload;
  t.mock.method(global, "fetch", async (url, options = {}) => {
    const parsed = new URL(url);
    const json = data => new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
    if (parsed.pathname.endsWith("/message_templates")) {
      if (options.method === "POST") {
        metaPayload = JSON.parse(options.body);
        assert.equal(metaPayload.mediaMode, undefined);
        assert.equal(metaPayload.components[0].format, "DOCUMENT");
        assert.deepEqual(metaPayload.components[0].example.header_handle, ["sample-handle"]);
        return json({ id: "meta-unique-invoice" });
      }
      return json({ data: [{ id: "meta-unique-invoice", name: body.name, category: "UTILITY", language: "en", status: "APPROVED",
        components: [{ type: "HEADER", format: "DOCUMENT" }, { type: "BODY", text: body.body }] }] });
    }
    if (parsed.pathname.endsWith("/uploads")) return json({ id: "sample-upload-session" });
    if (parsed.pathname.endsWith("/sample-upload-session")) return json({ h: "sample-handle" });
    if (parsed.hostname === "graph.facebook.com" && /\/\d+$/.test(parsed.pathname)) return json({ url: "https://lookaside.fbsbx.com/sample" });
    return new Response(fixtures.document.buffer, { status: 200 });
  });
  const submitted = await service.submitTemplateForMetaReview(tenant._id, body);
  assert.ok(metaPayload);
  assert.equal(submitted.template.mediaMode, "unique");
  const synced = await service.listApprovedTemplates(tenant._id);
  assert.equal(synced.find(template => template.name === body.name).mediaMode, "unique");
  assert.equal(synced.find(template => template.name === body.name).headerMediaId, sample.mediaId);
  await assert.rejects(service.createTemplateDraft(tenant._id, { ...body, mediaMode: "invalid" }), /common or unique/);
  const plain = await service.createTemplateDraft(tenant._id, { ...body, headerType: "none", headerMediaId: "" });
  assert.equal(plain.headerType, "none");
  assert.equal(plain.mediaMode, undefined, "Removing the header must clear its delivery setting");
});

test("common and unique templates enforce their delivery behavior; unique templates never send the approval sample by default", async t => {
  mockUpload(t);
  const sample = await libraryUpload("shared");
  await Template.updateOne({ tenantId: tenant._id, name: "file_document" }, { $set: { mediaMode: "common", headerMediaId: sample.mediaId } });
  await send("document", {}, "common-in-unique-flow").expect(400);
  const common = await messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"] });
  assert.equal(common.message.mediaId, sample.mediaId);
  await Template.updateOne({ tenantId: tenant._id, name: "file_document" }, { $set: { mediaMode: "unique" } });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"] }), /requires a document/);
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { contactId: contact._id, templateName: "file_document", variables: ["Customer"], mediaId: sample.mediaId }), /Unique Media template/);
  await send("document", {}, "unique-template-send").expect(202);
  await assert.rejects(messages.sendTemplateMessages(tenant._id, { templateName: "file_document", mediaId: sample.mediaId,
    idempotencyKey: "unique-bulk-not-allowed", contactIds: [String(contact._id)], variables: ["Customer"] }), /Unique Media/);
});

test("desktop setup authenticates the workspace and exposes only approved utility PDF templates", async () => {
  await request(app).get("/api/v1/integration/status").expect(401);
  await request(app).get("/api/v1/templates/approved").expect(401);
  const status = await request(app).get("/api/v1/integration/status").set("Authorization", `Bearer ${key}`).expect(200);
  assert.equal(status.body.contractVersion, 1);
  assert.equal(status.body.reportSendingAvailable, true);
  assert.equal(status.body.workspaceId, String(tenant._id));
  assert.equal(status.body.workspaceName, "Synthetic Business");
  assert.equal(status.body.whatsappConnected, true);
  assert.equal(status.body.processingTermsAccepted, true);
  assert.equal(status.headers["cache-control"], "no-store");
  assert.ok(!JSON.stringify(status.body).includes("test-token"));
  assert.ok(!("meta" in status.body));
  await Template.create({ tenantId: tenant._id, name: "not_a_report", category: "marketing", status: "approved", headerType: "document" });
  await Template.create({ tenantId: tenant._id, name: "pending_report", category: "utility", status: "in_review", headerType: "document" });
  const other = await Tenant.create({ businessName: "Other", contactPerson: "Owner", businessEmail: "other@example.test", whatsappNumber: "9000000002" });
  await Template.create({ tenantId: other._id, name: "other_report", category: "utility", status: "approved", headerType: "document" });
  const templates = await request(app).get("/api/v1/templates/approved").set("Authorization", `Bearer ${key}`).expect(200);
  assert.deepEqual(templates.body.templates.map(item => item.name), ["file_document"]);
  assert.equal(templates.body.templates[0].parameterCount, 1);
  assert.equal(templates.body.templates[0].body, "Hello {{1}}");
  assert.ok(!("headerMediaId" in templates.body.templates[0]));
  assert.ok(!("tenantId" in templates.body.templates[0]));
  assert.equal(templates.body.templates[0].reportConfigured, false);
  assert.ok(!("reportBindings" in templates.body.templates[0]));
  await Tenant.updateOne({ _id: tenant._id }, { $unset: { processingTerms: "", "meta.accessToken": "" } });
  const incomplete = await request(app).get("/api/v1/integration/status").set("Authorization", `Bearer ${key}`).expect(200);
  assert.equal(incomplete.body.whatsappConnected, false);
  assert.equal(incomplete.body.processingTermsAccepted, false);
});

test("dashboard admins can configure report mappings and immediately enable desktop reports", async t => {
  mockUpload(t);
  const template = await Template.findOne({ tenantId: tenant._id, name: "file_document" });
  const path = `/api/templates/${template._id}/report-mapping`;
  const token = signAuthToken(owner);
  const read = () => request(app).get(path).set("Authorization", `Bearer ${token}`);
  const save = bindings => request(app).patch(path).set("Origin", "http://localhost:5000")
    .set("Authorization", `Bearer ${token}`).send({ bindings, tenantId: new mongoose.Types.ObjectId() });
  const pending = await read().expect(200);
  assert.equal(pending.body.template.reportConfigured, false);
  assert.deepEqual(pending.body.fields.map(field => field.value), ["patientName", "reportId", "labName", "testName", "collectedAt"]);
  assert.equal(pending.headers["cache-control"], "no-store");
  for (const invalid of [undefined, [], ["unknown"], ["patientName", "reportId"], [{ literal: " " }], [{ literal: "a".repeat(301) }], [{ literal: "ok", extra: true }]]) {
    await save(invalid).expect(400);
  }
  assert.equal((await read()).body.template.reportConfigured, false);
  await save(["patientName"]).expect(200);
  assert.deepEqual((await read()).body.template.reportBindings, ["patientName"]);
  const desktop = await request(app).get("/api/v1/templates/approved").set("Authorization", `Bearer ${key}`).expect(200);
  assert.equal(desktop.body.templates[0].reportConfigured, true);
  assert.equal(desktop.body.templates[0].reportBindings, undefined);
  const sent = await report().expect(202);
  assert.deepEqual((await Message.findById(sent.body.messageId)).variables, ["Synthetic Recipient"]);
  await save([{ literal: "Synthetic Lab" }]).expect(200);
  assert.deepEqual((await read()).body.template.reportBindings, [{ literal: "Synthetic Lab" }]);
  t.mock.method(require("../src/services/template.service"), "listTemplates", async () => Template.find({ tenantId: tenant._id }).lean());
  const list = await request(app).get("/api/templates").set("Authorization", `Bearer ${token}`).expect(200);
  const listed = list.body.templates.find(item => item.name === "file_document");
  assert.equal(listed.reportMappingEligible, true);
  assert.equal(listed.reportConfigured, true);
  assert.ok(list.body.templates.every(item => !("reportBindings" in item)));
});

test("report mapping enforces dashboard roles, tenant isolation and template eligibility", async () => {
  const template = await Template.findOne({ tenantId: tenant._id, name: "file_document" });
  const path = `/api/templates/${template._id}/report-mapping`;
  await request(app).get(path).expect(401);
  await request(app).get(path).set("Authorization", `Bearer ${key}`).expect(401);
  const agent = await User.create({ tenantId: tenant._id, name: "Agent", email: "agent@example.test", passwordHash: "unused", role: "agent" });
  for (const method of ["get", "patch"]) {
    await request(app)[method](path).set("Origin", "http://localhost:5000")
      .set("Authorization", `Bearer ${signAuthToken(agent)}`).send({ bindings: ["patientName"] }).expect(403);
  }
  const admin = await User.create({ tenantId: tenant._id, name: "Admin", email: "admin@example.test", passwordHash: "unused", role: "admin" });
  await request(app).patch(path).set("Origin", "http://localhost:5000").set("Authorization", `Bearer ${signAuthToken(admin)}`)
    .send({ bindings: ["reportId"] }).expect(200);
  const token = signAuthToken(owner);
  await request(app).patch(path).set("Authorization", `Bearer ${token}`).send({ bindings: ["patientName"] }).expect(403);
  const other = await Template.create({ tenantId: new mongoose.Types.ObjectId(), name: "other_workspace", category: "utility", status: "approved", headerType: "document" });
  for (const method of ["get", "patch"]) {
    await request(app)[method](`/api/templates/${other._id}/report-mapping`).set("Origin", "http://localhost:5000")
      .set("Authorization", `Bearer ${token}`).send({ bindings: [] }).expect(404);
  }
  await request(app).get("/api/templates/invalid/report-mapping").set("Authorization", `Bearer ${token}`).expect(400);
  for (const change of [{ status: "in_review" }, { status: "paused" }, { category: "marketing" }, { headerType: "image" }, { mediaMode: "common" }]) {
    await Template.updateOne({ _id: template._id }, { $set: { status: "approved", category: "utility", headerType: "document", mediaMode: "unique", ...change } });
    for (const method of ["get", "patch"]) {
      await request(app)[method](path).set("Origin", "http://localhost:5000").set("Authorization", `Bearer ${token}`)
        .send({ bindings: ["patientName"] }).expect(409);
    }
  }
  await Template.updateOne({ _id: template._id }, { $set: { mediaMode: "unique", parameterCount: 0 }, $unset: { reportBindings: "" } });
  const zero = await request(app).get(path).set("Authorization", `Bearer ${token}`).expect(200);
  assert.equal(zero.body.template.reportConfigured, true);
  await request(app).patch(path).set("Origin", "http://localhost:5000").set("Authorization", `Bearer ${token}`).send({ bindings: [] }).expect(200);
});

function report(fields = {}, idempotency = "report-request-0001", endpoint = "/api/v1/messages/send-media") {
  let req = request(app).post(endpoint).set("Authorization", `Bearer ${key}`).set("Idempotency-Key", idempotency);
  for (const [name, value] of Object.entries({ reportMode: "automatic", to: phone, templateName: "file_document", language: "en", reportId: "REPORT-SYNTHETIC-1",
    patientName: "Synthetic Recipient", labName: "Synthetic Lab", testName: "Synthetic Test", collectedAt: "2026-10-29T00:00:00Z",
    permissionConfirmed: "true", consentReference: "SYNTHETIC-PERMISSION", ...fields })) req = req.field(name, value);
  return req.attach("file", fixtures.document.buffer, { filename: "report.pdf", contentType: "application/pdf" });
}

test("automatic report sends resolve template fields on the backend and retain the original mapping on retry", async t => {
  const upload = mockUpload(t);
  await Template.updateOne({ tenantId: tenant._id, name: "file_document" }, { $set: { reportBindings: ["patientName"] } });
  const templates = await request(app).get("/api/v1/templates/approved").set("Authorization", `Bearer ${key}`).expect(200);
  assert.equal(templates.body.templates[0].reportConfigured, true);
  assert.ok(!("reportBindings" in templates.body.templates[0]));
  const sent = await report().expect(202);
  const message = await Message.findById(sent.body.messageId).lean();
  assert.deepEqual(message.variables, ["Synthetic Recipient"]);
  assert.equal((await Media.findOne({ mediaId: sent.body.mediaId })).purpose, "patient_report");
  const rawReceipt = await Receipt.collection.findOne({});
  assert.ok(!JSON.stringify(rawReceipt).includes("Synthetic Recipient"));
  assert.ok(!JSON.stringify(rawReceipt).includes("REPORT-SYNTHETIC-1"));
  await Template.updateOne({ tenantId: tenant._id, name: "file_document" }, { $set: { reportBindings: ["labName"], status: "paused" } });
  const replay = await report().expect(202);
  assert.equal(replay.body.messageId, sent.body.messageId);
  assert.equal(replay.body.idempotent, true);
  const oldAlias = await report({}, "report-request-0001", "/api/v1/integration/send-report").expect(202);
  assert.equal(oldAlias.body.messageId, sent.body.messageId);
  await report({ reportId: "CHANGED-REPORT" }).expect(409);
  await report({ patientName: "Another patient" }).expect(409);
  assert.equal(await Message.countDocuments({}), 1);
  assert.equal(upload.mock.callCount(), 1);
  await Receipt.updateOne({}, { $set: { status: "erased" }, $unset: { reportBindings: "" } });
  await report().expect(410);
});

test("automatic report sends reject missing mappings, metadata, permissions and client-controlled template values", async t => {
  mockUpload(t);
  await report().expect(409);
  await Template.updateOne({ tenantId: tenant._id, name: "file_document" }, { $set: { reportBindings: ["reportId"] } });
  await report({ reportId: "" }).expect(400);
  await report({ reportMode: "unsupported" }).expect(400);
  await report({ variables: '["forged"]' }).expect(400);
  await report({ purpose: "general" }).expect(400);
  await report({ consentScope: "business_messages" }).expect(400);
  await report({ permissionConfirmed: "false" }).expect(400);
  await report({ consentReference: "" }).expect(400);
  assert.equal(await Media.countDocuments({}), 0);
  assert.equal(await Message.countDocuments({}), 0);
  const validate = require("../src/services/reportDelivery.service").validateBindings;
  assert.throws(() => validate(["unknownField"], 1));
  assert.throws(() => validate([{ literal: "" }], 1));
  assert.deepEqual(validate([{ literal: "Report ready" }], 1), [{ literal: "Report ready" }]);
});

for (const type of Object.keys(fixtures)) test(`${type} is privately uploaded, bound to one number and delivered with template text`, async t => {
  mockUpload(t);
  const response = await send(type).expect(202);
  const asset = await Media.findOne({ mediaId: response.body.mediaId }).select("+recipientHash").lean();
  assert.equal(asset.deliveryScope, "recipient"); assert.equal(String(asset.recipientContactId), String(contact._id));
  assert.equal(asset.deliveryType, "authenticated"); assert.ok(asset.recipientHash.startsWith("lookup:v1:"));
  assert.equal(asset.storageProvider, "meta");
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
  assert.equal(delivered.template.components[0].parameters[0][type].id, asset.metaMediaId);
  assert.equal(delivered.template.components[0].parameters[0][type].link, undefined);
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
  const upload = t.mock.method(metaMedia, "upload", async () => { throw new (require("../src/utils/httpError"))(502, "Synthetic upload failure"); });
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
