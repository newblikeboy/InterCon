const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, {
  NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "privacy-test-jwt-key-that-is-not-production",
  DATA_ENCRYPTION_KEY: "privacy-test-data-key-that-is-not-production"
});
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Contact = require("../src/models/Contact");
const Conversation = require("../src/models/Conversation");
const InboxMessage = require("../src/models/InboxMessage");
const Message = require("../src/models/Message");
const RecipientUsage = require("../src/models/RecipientUsage");
const WebhookEvent = require("../src/models/WebhookEvent");
const Execution = require("../src/models/AutomationExecution");
const MessageBatch = require("../src/models/MessageBatch");
const contacts = require("../src/services/contact.service");
const env = require("../src/config/env");
const { encrypt, decrypt } = require("../src/utils/privateData");
const { migrateCustomerData, migrateTrialRecipientData } = require("../src/services/contactPrivacyMigration.service");
let database;
const phone = "919876543210";
const input = { name: "Private Customer", phone, email: "CUSTOMER@example.test", city: "Delhi", optIn: true };
let tenantId;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await require("../src/config/indexes").ensureCriticalIndexes();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  tenantId = new mongoose.Types.ObjectId();
});
function assertPrivate(raw, values) {
  const stored = JSON.stringify(raw);
  for (const value of values) assert.ok(!stored.includes(value), "Raw database contains customer data");
}

test("contacts store randomized ciphertext and keyed phone lookup, while documents and lean responses remain readable", async () => {
  const contact = await contacts.createContact(tenantId, input);
  const raw = await Contact.collection.findOne({ _id: contact._id });
  assertPrivate(raw, [phone, input.name, "customer@example.test", input.city]);
  assert.match(raw.phone, /^lookup:v1:/);
  assert.match(raw.__private_phone, /^private:v1:/);
  assert.equal(contact.phone, phone);
  assert.equal(contact.name, input.name);
  assert.equal(contact.toJSON().email, "customer@example.test");
  assert.ok(!JSON.stringify(contact.toJSON()).includes("__private"));
  const projected = await Contact.findOne({ tenantId, phone }).select("phone name").lean();
  assert.equal(projected.phone, phone);
  assert.equal(projected.name, input.name);
  assert.ok(!JSON.stringify(projected).includes("__private"));
  const other = await Contact.create({ tenantId: new mongoose.Types.ObjectId(), ...input });
  assert.notEqual((await Contact.collection.findOne({ _id: other._id })).__private_phone, raw.__private_phone);
  await assert.rejects(Contact.create({ tenantId, ...input }), error => error.code === 11000);
});

test("bulk import, edits, suppression and partial search retain readable tenant-scoped behavior", async () => {
  await contacts.importContacts(tenantId, [input, { name: "Someone Else", phone: "919000000001" }]);
  await contacts.importContacts(tenantId, [input]);
  assert.equal(await Contact.countDocuments({ tenantId }), 2);
  assert.equal((await contacts.listContacts(tenantId, { search: "CUSTOMER" })).length, 1);
  assert.equal((await contacts.listContacts(tenantId, { search: "6543" }))[0].phone, phone);
  assert.equal((await contacts.listContacts(tenantId, { search: "private.*" })).length, 0);
  assert.equal((await contacts.listContacts(tenantId, { search: "Pr" })).length, 1);
  assert.equal((await contacts.listContacts(new mongoose.Types.ObjectId(), { search: "customer" })).length, 0);
  const current = await Contact.findOne({ tenantId, phone });
  current.name = "Updated Customer";
  await current.save();
  await contacts.suppressContact(tenantId, { phone, status: "opted_out", reason: "Customer withdrew" });
  await contacts.importContacts(tenantId, [input]);
  assert.equal((await Contact.findOne({ tenantId, phone }).lean()).status, "opted_out");
  assertPrivate(await Contact.collection.findOne({ _id: current._id }), [phone, input.name]);
});

test("phone-only upserts, bulk updates and legacy plaintext rows work during migration", async () => {
  await Contact.collection.insertOne({ tenantId, ...input, email: "customer@example.test", status: "active", optIn: { status: true } });
  assert.equal((await Contact.findOne({ tenantId, phone }).lean()).phone, phone);
  await contacts.createContact(tenantId, input);
  assert.equal(await Contact.countDocuments({ tenantId }), 1);
  assertPrivate(await Contact.collection.findOne({ tenantId }), [phone, input.name]);
  await RecipientUsage.findOneAndUpdate({ tenantId, phoneNumberId: "sender", recipient: phone },
    { $set: { lastAcceptedAt: new Date() } }, { upsert: true, returnDocument: "after" });
  assert.equal((await RecipientUsage.findOne({ tenantId, recipient: phone }).lean()).recipient, phone);
  assertPrivate(await RecipientUsage.collection.findOne({ tenantId }), [phone]);
});

test("inbox, message queues, webhook payloads and cached send results do not retain clear contact copies", async () => {
  const contact = await Contact.create({ tenantId, ...input });
  const conversation = await Conversation.create({ tenantId, contactId: contact._id, customerPhone: phone, customerName: input.name, lastMessageText: `Call ${phone}` });
  const inbox = await InboxMessage.create({ tenantId, conversationId: conversation._id, customerPhone: phone, direction: "in", text: `My number is ${phone}` });
  const message = await Message.create({ tenantId, to: phone, templateName: "hello", variables: [input.name, phone] });
  const payload = { value: { contacts: [{ wa_id: phone, profile: { name: input.name } }] } };
  const [event] = await WebhookEvent.insertMany([{ eventKey: "event", payload }]);
  const batch = await MessageBatch.create({ tenantId, key: "request", requestHash: "digest", result: { to: phone } });
  for (const [model, doc] of [[Conversation, conversation], [InboxMessage, inbox], [Message, message], [WebhookEvent, event], [MessageBatch, batch]]) {
    assertPrivate(await model.collection.findOne({ _id: doc._id }), [phone, input.name]);
  }
  assert.equal((await Conversation.findOne({ tenantId, customerPhone: phone }).lean()).customerName, input.name);
  assert.equal((await Message.findById(message._id).lean()).to, phone);
  assert.deepEqual((await Message.findById(message._id).lean()).variables, [input.name, phone]);
  assert.deepEqual((await WebhookEvent.findById(event._id).lean()).payload, payload);
  const populated = await Conversation.findById(conversation._id).populate({ path: "contactId", select: "name tags" }).lean();
  assert.equal(populated.contactId.name, input.name);
});

test("mutated encrypted JSON is persisted after markModified without changing the chatbot contract", async () => {
  const job = await Execution.create({ tenantId, conversationId: new mongoose.Types.ObjectId(), inboundMessageId: new mongoose.Types.ObjectId(), sequence: 1, plan: { messages: [{ text: phone, status: "pending" }] } });
  const plan = job.plan;
  plan.messages[0].status = "sent";
  job.markModified("plan");
  await job.save();
  assert.equal((await Execution.findById(job._id)).plan.messages[0].status, "sent");
  assertPrivate(await Execution.collection.findOne({ _id: job._id }), [phone]);
});

test("ciphertext fails closed on tampering, a different field context or a wrong key", () => {
  const encrypted = encrypt(phone, "Contact.phone");
  assert.throws(() => decrypt(encrypted, "Conversation.customerPhone"));
  const parts = encrypted.split(".");
  parts[1] = (parts[1][0] === "a" ? "b" : "a") + parts[1].slice(1);
  assert.throws(() => decrypt(parts.join("."), "Contact.phone"));
  const previous = env.dataEncryptionKey;
  try {
    env.dataEncryptionKey = "wrong-key-that-is-at-least-thirty-two-characters";
    assert.throws(() => decrypt(encrypted, "Contact.phone"));
  } finally { env.dataEncryptionKey = previous; }
});

test("migration defaults to inspection, encrypts every legacy copy and can safely run twice", async () => {
  const Tenant = require("../src/models/Tenant");
  await Contact.collection.insertOne({ tenantId, name: input.name, phone, email: "customer@example.test" });
  await Message.collection.insertOne({ tenantId, to: phone, templateName: "hello", variables: [input.name] });
  await WebhookEvent.collection.insertOne({ eventKey: "legacy", payload: { phone } });
  await Tenant.collection.insertOne({ _id: tenantId, trial: { recipients: [phone], reservations: [{ token: "pending", recipient: phone }] } });
  const inspected = await migrateCustomerData();
  assert.equal(inspected.reduce((sum, row) => sum + row.pending, 0), 3);
  assert.equal((await Contact.collection.findOne({ tenantId })).phone, phone);
  const applied = await migrateCustomerData({ apply: true });
  assert.equal(applied.reduce((sum, row) => sum + row.migrated, 0), 3);
  await migrateTrialRecipientData({ apply: true });
  assertPrivate(await Contact.collection.findOne({ tenantId }), [phone, input.name]);
  assertPrivate(await Message.collection.findOne({ tenantId }), [phone, input.name]);
  assertPrivate(await WebhookEvent.collection.findOne({ eventKey: "legacy" }), [phone]);
  assertPrivate(await Tenant.collection.findOne({ _id: tenantId }), [phone]);
  assert.equal((await Contact.findOne({ tenantId, phone }).lean()).name, input.name);
  assert.equal((await migrateCustomerData({ apply: true })).reduce((sum, row) => sum + row.pending, 0), 0);
  assert.equal((await migrateTrialRecipientData({ apply: true })).pending, 0);
});

test("new trial reservations use keyed hashes while retaining usage accounting", async () => {
  const Tenant = require("../src/models/Tenant");
  const tenant = await Tenant.create({ businessName: "Privacy Test", contactPerson: "Owner", businessEmail: "owner@example.test", whatsappNumber: "9876543210",
    trial: { recipients: [phone], reservations: [{ token: "pending", recipient: phone }] } });
  await Tenant.updateOne({ _id: tenant._id }, { $push: { "trial.reservations": { token: "second", recipient: phone } } });
  const raw = await Tenant.collection.findOne({ _id: tenant._id });
  assertPrivate(raw.trial, [phone]);
  assert.equal(raw.trial.recipients.length, 1);
  assert.equal(raw.trial.reservations.length, 2);
});

test("contact API returns original values only within the authenticated client's workspace", async () => {
  const request = require("supertest"), app = require("../src/app");
  const User = require("../src/models/User");
  const { signAuthToken } = require("../src/services/authToken.service");
  const owner = await User.create({ tenantId, name: "Owner", email: "privacy-owner@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  const other = await User.create({ tenantId: new mongoose.Types.ObjectId(), name: "Other", email: "privacy-other@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  const created = await request(app).post("/api/contacts").set("Origin", "http://localhost:5000")
    .set("Authorization", `Bearer ${signAuthToken(owner)}`).send({ ...input, tenantId: other.tenantId }).expect(201);
  assert.equal(created.body.contact.phone, phone);
  const own = await request(app).get("/api/contacts?search=6543").set("Authorization", `Bearer ${signAuthToken(owner)}`).expect(200);
  assert.equal(own.body.contacts[0].name, input.name);
  assert.equal(own.body.contacts[0].phone, phone);
  assert.ok(!JSON.stringify(own.body).includes("__private"));
  const unrelated = await request(app).get("/api/contacts").set("Authorization", `Bearer ${signAuthToken(other)}`).expect(200);
  assert.equal(unrelated.body.contacts.length, 0);
  await request(app).get("/api/contacts").expect(401);
});

test("lean bulk inserts remain encrypted and admin search/exports decrypt before pagination", async () => {
  await Contact.insertMany([{ tenantId, ...input }], { lean: true });
  assertPrivate(await Contact.collection.findOne({ tenantId }), [phone, input.name]);
  assert.equal((await contacts.listContacts(tenantId))[0].phone, phone);
  await Message.insertMany([
    { tenantId, to: phone, templateName: "hello", variables: ["  Trimmed  "] },
    { tenantId, to: "919111111111", templateName: "other" }
  ]);
  const admin = require("../src/services/admin.service");
  const page = await admin.records("messages", { q: "6543", limit: 1 });
  assert.equal(page.records.length, 1);
  assert.equal(page.records[0].to, phone);
  assert.ok(!JSON.stringify(page).includes("__private"));
  const exported = [];
  for await (const row of admin.exportCursor("messages", { q: "6543" })) exported.push(row);
  assert.equal(exported.length, 1);
  assert.equal(exported[0].to, phone);
  assert.deepEqual((await Message.findOne({ tenantId, to: phone })).variables, ["Trimmed"]);
});
