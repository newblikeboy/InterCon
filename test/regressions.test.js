const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, {
  NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "integration-test-jwt-secret-not-production-123",
  DATA_ENCRYPTION_KEY: "integration-test-data-secret-not-production-456",
  FB_APP_ID: "test-app-id", FB_APP_SECRET: "test-app-secret",
  RAZORPAY_KEY_ID: "test-key", RAZORPAY_KEY_SECRET: "test-secret",
  RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret", WHATSAPP_DAILY_UNIQUE_LIMIT: "0", WHATSAPP_PAIR_MIN_INTERVAL_MS: "0"
});
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Tenant = require("../src/models/Tenant");
const Contact = require("../src/models/Contact");
const Template = require("../src/models/Template");
const Message = require("../src/models/Message");
const Payment = require("../src/models/Payment");
const RecipientUsage = require("../src/models/RecipientUsage");
const billing = require("../src/services/billing.service");
const messages = require("../src/services/message.service");
const webhook = require("../src/services/webhook.service");
const { ensureCriticalIndexes } = require("../src/config/indexes");
let database;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" }, instanceOpts: [{ launchTimeout: 60000 }] });
  mongoose.set("strictQuery", true);
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await ensureCriticalIndexes();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
});
async function workspace() {
  return Tenant.create({ businessName: "Test Shop", contactPerson: "Test Owner", businessEmail: "owner@example.test", whatsappNumber: "9876543210",
    billing: { plan: "monthly", status: "active", amount: 1000, currency: "INR", currentPeriodEnd: new Date(Date.now() + 90 * 86400000) },
    meta: { phoneNumberId: "123456", wabaId: "987654", accessToken: "test-access-token" } });
}
function response(data) { return { ok: true, status: 200, headers: new Headers(), json: async () => data }; }
test("fresh database provisions unique contact, inbox, and idempotency indexes", async () => {
  for (const [model, key] of [[Contact, { tenantId: 1, phone: 1 }], [Message, { tenantId: 1, idempotencyKey: 1 }], [require("../src/models/InboxMessage"), { tenantId: 1, metaMessageId: 1 }]]) {
    assert.ok((await model.collection.indexes()).some(index => index.unique && JSON.stringify(index.key) === JSON.stringify(key)));
  }
  await ensureCriticalIndexes();
});
test("phone-name update cannot change another tenant", async () => {
  const a = await workspace();
  const b = await Tenant.create({ businessName: "Other", contactPerson: "Other", businessEmail: "other@example.test", whatsappNumber: "9876543211" });
  await webhook.processPhoneNameUpdate(b._id, { requested_verified_name: "Updated Other" });
  assert.equal((await Tenant.findById(b._id)).meta.verifiedName, "Updated Other");
  assert.equal((await Tenant.findById(a._id)).meta.verifiedName, undefined);
});
test("late sent status cannot replace read", async () => {
  const tenant = await workspace();
  const message = await Message.create({ tenantId: tenant._id, to: "919999999999", templateName: "hello", status: "read", metaMessageId: "wamid-read" });
  await webhook.processMessageStatuses(tenant._id, [{ id: "wamid-read", status: "sent" }]);
  assert.equal((await Message.findById(message._id)).status, "read");
});
test("phone-based send preserves an existing block and consent evidence", async () => {
  const tenant = await workspace();
  await Template.create({ tenantId: tenant._id, name: "order_update", category: "utility", language: "en", status: "approved", body: "Your order is ready", parameterCount: 0 });
  const contact = await Contact.create({ tenantId: tenant._id, name: "Blocked", phone: "919999999999", status: "blocked", optIn: { status: false, proof: "Withdrawn" } });
  await assert.rejects(messages.sendTemplateMessage(tenant._id, { phone: contact.phone, optIn: true, templateName: "order_update" }), /active opted-in/);
  const saved = await Contact.findById(contact._id);
  assert.equal(saved.status, "blocked");
  assert.equal(saved.optIn.proof, "Withdrawn");
  assert.equal(await Message.countDocuments(), 0);
});
test("queued delivery checks current suppression before any provider call", async t => {
  const tenant = await workspace();
  const contact = await Contact.create({ tenantId: tenant._id, name: "Blocked", phone: "919999999999", status: "blocked" });
  const message = await Message.create({ tenantId: tenant._id, contactId: contact._id, phoneNumberId: "123456", to: contact.phone, templateName: "order_update", language: "en" });
  const provider = t.mock.method(global, "fetch", async () => { throw new Error("Must not send"); });
  const result = await messages.processNextQueuedMessage("test-worker");
  assert.equal(result.action, "failed");
  assert.equal(provider.mock.callCount(), 0);
  assert.match((await Message.findById(message._id)).error, /opted in/);
});
test("opening multiple checkouts preserves access and an older paid order still activates once", async t => {
  const tenant = await workspace();
  let sequence = 0;
  t.mock.method(global, "fetch", async (url, options) => {
    if (url.endsWith("/orders")) return response({ id: `order_${++sequence}`, ...JSON.parse(options.body) });
    return response({ id: "pay_1", order_id: "order_1", status: "captured", amount: 100000, currency: "INR" });
  });
  const first = await billing.selectPlan(tenant._id, "monthly");
  await billing.selectPlan(tenant._id, "yearly");
  assert.equal((await billing.getBillingStatus(tenant._id)).active, true);
  assert.equal((await Tenant.findById(tenant._id)).billing.plan, "monthly");
  const signature = require("crypto").createHmac("sha256", "test-secret").update(`${first.checkout.orderId}|pay_1`).digest("hex");
  const payload = { razorpay_order_id: first.checkout.orderId, razorpay_payment_id: "pay_1", razorpay_signature: signature };
  const firstResult = await billing.verifyPayment(tenant._id, payload);
  const secondResult = await billing.verifyPayment(tenant._id, payload);
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal(secondResult.idempotent, true);
  assert.equal(+firstResult.billing.currentPeriodEnd, +secondResult.billing.currentPeriodEnd);
  assert.ok(+secondResult.billing.currentPeriodEnd > +tenant.billing.currentPeriodEnd);
});
test("subscription month arithmetic clamps month end", () => {
  assert.equal(billing.addMonths(new Date("2026-01-31T10:00:00Z"), 1).toISOString(), "2026-02-28T10:00:00.000Z");
});

const Conversation = require("../src/models/Conversation");
const InboxMessage = require("../src/models/InboxMessage");
const inbox = require("../src/services/inbox.service");
const contacts = require("../src/services/contact.service");
const User = require("../src/models/User");
const auth = require("../src/services/auth.service");
const request = require("supertest");
const app = require("../src/app");
const { signAuthToken } = require("../src/services/authToken.service");

test("newest inbox page, older cursor, and explicit read acknowledgement", async () => {
  const tenant = await workspace();
  const conversation = await Conversation.create({ tenantId: tenant._id, customerPhone: "919999999999", unreadCount: 5 });
  const records = await InboxMessage.insertMany(Array.from({ length: 205 }, (_, index) => ({ tenantId: tenant._id, conversationId: conversation._id, customerPhone: conversation.customerPhone, direction: "in", text: String(index + 1), metaMessageId: "wamid_" + index })));
  await Conversation.updateOne({ _id: conversation._id }, { $set: { lastStoredMessageId: records.at(-1)._id } });
  const page = await inbox.getConversationMessages(tenant._id, conversation._id);
  assert.equal(page.messages.length, 200);
  assert.equal(page.messages.at(-1).text, "205");
  assert.equal((await Conversation.findById(conversation._id)).unreadCount, 5);
  const older = await inbox.getConversationMessages(tenant._id, conversation._id, { before: page.nextCursor });
  assert.equal(older.messages.length, 5);
  await inbox.markConversationRead(tenant._id, conversation._id, { throughMessageId: records[199]._id });
  assert.equal((await Conversation.findById(conversation._id)).unreadCount, 5);
  await inbox.markConversationRead(tenant._id, conversation._id, { throughMessageId: records.at(-1)._id });
  assert.equal((await Conversation.findById(conversation._id)).unreadCount, 0);
});

test("delayed inbound webhooks preserve newest preview and service window, and duplicates count once", async () => {
  const tenant = await workspace();
  const now = Math.floor(Date.now() / 1000);
  const value = (id, timestamp, text) => ({ messages: [{ id, from: "919999999999", timestamp: String(timestamp), type: "text", text: { body: text } }] });
  await webhook.processInboundMessages(tenant._id, value("new", now, "Latest"), "987654", "123456");
  await webhook.processInboundMessages(tenant._id, value("old", now - 3600, "Delayed"), "987654", "123456");
  await webhook.processInboundMessages(tenant._id, value("old", now - 3600, "Delayed"), "987654", "123456");
  const conversation = await Conversation.findOne({ tenantId: tenant._id });
  assert.equal(conversation.lastMessageText, "Latest");
  assert.equal(+conversation.lastInboundAt, now * 1000);
  assert.equal(conversation.unreadCount, 2);
  assert.equal(await InboxMessage.countDocuments(), 2);
});

test("bulk retry is atomic and concurrent submissions create one batch", async () => {
  const tenant = await workspace();
  await Template.create({ tenantId: tenant._id, name: "order_update", category: "utility", language: "en", status: "approved", body: "Ready", parameterCount: 0 });
  const contact = await Contact.create({ tenantId: tenant._id, name: "Customer", phone: "919999999999", optIn: { status: true } });
  const payload = { templateName: "order_update", contactIds: [String(contact._id)], idempotencyKey: "bulk-unique" };
  const [first, second] = await Promise.all([messages.sendTemplateMessages(tenant._id, payload), messages.sendTemplateMessages(tenant._id, payload)]);
  assert.equal(first.batchId, second.batchId);
  assert.equal(await Message.countDocuments(), 1);
  await assert.rejects(messages.sendTemplateMessages(tenant._id, { ...payload, templateName: "different" }), /different message details/);
});

test("recipient bookkeeping failure never resends an accepted message", async t => {
  const tenant = await workspace();
  await Template.create({ tenantId: tenant._id, name: "order_update", category: "utility", language: "en", status: "approved", body: "Ready", parameterCount: 0 });
  const contact = await Contact.create({ tenantId: tenant._id, name: "Customer", phone: "919999999999", optIn: { status: true } });
  await messages.sendTemplateMessage(tenant._id, { contactId: String(contact._id), templateName: "order_update" });
  let sent = 0;
  t.mock.method(global, "fetch", async (url, options) => { if (options.method === "POST") sent++; return response({ messages: [{ id: "accepted-id" }] }); });
  t.mock.method(RecipientUsage, "findOneAndUpdate", async () => { throw new Error("Simulated bookkeeping failure"); });
  const result = await messages.processNextQueuedMessage("delivery-test");
  assert.equal(result.action, "accepted");
  assert.equal((await Message.findOne()).status, "accepted");
  assert.equal(await messages.processNextQueuedMessage("delivery-test"), null);
  assert.equal(sent, 1);
});

test("contact cursor reaches older records without repeats", async () => {
  const tenant = await workspace();
  await Contact.insertMany(Array.from({ length: 105 }, (_, index) => ({ tenantId: tenant._id, name: "Customer " + index, phone: String(919900000000 + index) })));
  const first = await contacts.listContacts(tenant._id);
  const second = await contacts.listContacts(tenant._id, { after: String(first.at(-1)._id) });
  assert.equal(first.length, 100); assert.equal(second.length, 5);
  assert.equal(new Set([...first, ...second].map(item => String(item._id))).size, 105);
});

test("template sync reads all pages and does not disable records after a partial failure", async t => {
  const tenant = await workspace();
  const service = require("../src/services/template.service");
  let calls = 0;
  t.mock.method(global, "fetch", async () => {
    calls++;
    return response({ data: [{ id: String(calls), name: calls === 1 ? "first" : "second", status: "APPROVED", category: "UTILITY", language: "en", components: [{ type: "BODY", text: "Ready" }] }], ...(calls === 1 ? { paging: { next: "unused", cursors: { after: "second" } } } : {}) });
  });
  await service.listTemplates(tenant._id);
  assert.equal(calls, 2); assert.equal(await Template.countDocuments({ status: "approved" }), 2);
  service.invalidateTemplateSync(tenant._id);
  await Template.updateMany({}, { $set: { updatedAt: new Date(Date.now() - 600000) } }, { timestamps: false });
  calls = 0;
  t.mock.method(global, "fetch", async () => { if (++calls === 2) throw new Error("Page two failed"); return response({ data: [], paging: { next: "unused", cursors: { after: "second" } } }); });
  await assert.rejects(service.listTemplates(tenant._id));
  assert.equal(await Template.countDocuments({ status: "approved" }), 2);
});

test("password recovery uses a one-time token and invalidates existing sessions", async t => {
  const tenant = await workspace();
  const user = await User.create({ tenantId: tenant._id, name: "Owner", email: "reset@example.test", passwordHash: await require("bcryptjs").hash("oldPassword1", 4), isVerified: true });
  let text;
  t.mock.method(require("../src/services/email.service"), "sendMail", async message => { text = message.text; });
  await auth.requestPasswordReset(user.email);
  const token = text.match(/reset=([a-f0-9]{64})/)[1];
  const payload = { token, password: "newPassword2", confirm_password: "newPassword2" };
  await auth.resetPassword(payload);
  await assert.rejects(auth.resetPassword(payload), /invalid or has expired/);
  assert.equal((await User.findById(user._id).select("+sessionVersion")).sessionVersion, 1);
  await assert.rejects(auth.loginCustomer({ email: user.email, password: "oldPassword1" }), /Invalid/);
  assert.ok((await auth.loginCustomer({ email: user.email, password: "newPassword2" })).user);
});

test("platform admin pages and data reject ordinary tenant owners and static bypasses", async () => {
  const tenant = await workspace();
  const user = await User.create({ tenantId: tenant._id, name: "Owner", email: "admin@example.test", passwordHash: "unused", isVerified: true });
  const token = signAuthToken(user);
  await request(app).get("/admin").expect(401);
  await request(app).get("/%61dmin-portal.html").expect(404);
  await request(app).get("/admin-portal.html").set("Authorization", "Bearer " + token).expect(403);
  await request(app).get("/api/admin/overview").set("Authorization", "Bearer " + token).expect(403);
  await User.updateOne({ _id: user._id }, { $set: { platformRole: "admin" } });
  await request(app).get("/api/admin/overview").set("Authorization", "Bearer " + token).expect(200);
  const result = await request(app).get("/api/admin/records/tenants").set("Authorization", "Bearer " + token).expect(200);
  assert.equal(result.body.records[0].meta.accessToken, undefined);
});

test("payment webhook recovers a captured payment without a browser confirmation", async t => {
  const tenant = await workspace();
  t.mock.method(global, "fetch", async (url, options) => url.endsWith("/orders") ? response({ id: "order_webhook", ...JSON.parse(options.body) }) : response({ id: "pay_webhook", order_id: "order_webhook", status: "captured", amount: 100000, currency: "INR" }));
  await billing.selectPlan(tenant._id, "monthly");
  const body = { event: "payment.captured", payload: { payment: { entity: { id: "pay_webhook", order_id: "order_webhook" } } } };
  const rawBody = Buffer.from(JSON.stringify(body));
  const signature = require("crypto").createHmac("sha256", "test-webhook-secret").update(rawBody).digest("hex");
  await assert.rejects(billing.handlePaymentWebhook({ body, rawBody, headers: { "x-razorpay-signature": "f".repeat(64) } }), /Invalid/);
  await billing.handlePaymentWebhook({ body, rawBody, headers: { "x-razorpay-signature": signature } });
  await billing.handlePaymentWebhook({ body, rawBody, headers: { "x-razorpay-signature": signature } });
  assert.equal(await Payment.countDocuments(), 1);
});


test("queued messages fail before sending after workspace suspension or plan expiry", async t => {
  const tenant = await workspace();
  const contact = await Contact.create({ tenantId: tenant._id, name: "Customer", phone: "919999999999", optIn: { status: true } });
  const provider = t.mock.method(global, "fetch", async () => { throw new Error("Must not send"); });
  for (const change of [{ status: "suspended" }, { status: "active", "billing.currentPeriodEnd": new Date(0) }]) {
    await Tenant.updateOne({ _id: tenant._id }, { $set: change });
    await Message.create({ tenantId: tenant._id, contactId: contact._id, phoneNumberId: "123456", to: contact.phone, templateName: "order_update", language: "en" });
    assert.equal((await messages.processNextQueuedMessage("eligibility-test")).action, "failed");
  }
  assert.equal(provider.mock.callCount(), 0);
});

test("suppression is recorded and restoring a contact requires fresh consent evidence", async () => {
  const tenant = await workspace();
  const contact = await contacts.suppressContact(tenant._id, { phone: "919999999999", status: "blocked", reason: "Customer asked not to receive messages" });
  assert.equal(contact.status, "blocked");
  assert.equal(contact.optIn.status, false);
  assert.equal(await require("../src/models/ContactStatusEvent").countDocuments(), 1);
  await assert.rejects(contacts.updateContact(tenant._id, contact._id, { name: "Customer", phone: contact.phone, status: "active", optIn: true }), /fresh consent/);
  await contacts.updateContact(tenant._id, contact._id, { name: "Customer", phone: contact.phone, status: "active", optIn: true, optInProof: "New signed consent received" });
  assert.equal(await require("../src/models/ContactStatusEvent").countDocuments(), 2);
});

test("unfinished scheduled campaigns and automatic replies cannot falsely activate", async () => {
  const tenant = await workspace();
  await assert.rejects(require("../src/services/campaign.service").createCampaign(tenant._id, { scheduledAt: "2027-01-01" }), /not available yet/);
  await assert.rejects(require("../src/services/automation.service").updateAutomationStatus(tenant._id, new mongoose.Types.ObjectId(), "active"), /not available yet/);
});

test("unremembered login uses a session cookie and a shorter signed token", async () => {
  const service = require("../src/services/authToken.service");
  const user = { _id: new mongoose.Types.ObjectId(), tenantId: new mongoose.Types.ObjectId(), role: "owner" };
  let cookie;
  service.setAuthCookie({ cookie: (...args) => { cookie = args; } }, service.signAuthToken(user, false), false);
  assert.equal(cookie[2].maxAge, undefined);
  const claims = service.verifyAuthToken(cookie[1]);
  assert.equal(claims.exp - claims.iat, 12 * 3600);
});

test("isolated realtime servers receive worker notifications through a shared pubsub transport", async t => {
  const callbacks = new Set();
  const redis = {
    isReady: true,
    publish: async (channel, payload) => { for (const callback of callbacks) callback(payload); },
    duplicate: () => {
      let listener;
      return { isOpen: true, on() {}, connect: async () => {}, subscribe: async (channel, callback) => { listener = callback; callbacks.add(callback); }, quit: async () => { callbacks.delete(listener); } };
    }
  };
  t.mock.method(require("../src/config/redis"), "getRedisClient", () => redis);
  const filename = require.resolve("../src/services/realtime.service");
  function isolatedService() {
    const Module = require("module");
    const mod = new Module(filename, module); mod.filename = filename; mod.paths = module.paths;
    mod._compile(require("fs").readFileSync(filename, "utf8"), filename);
    return mod.exports;
  }
  const apiA = isolatedService(), apiB = isolatedService(), worker = isolatedService();
  const tenant = await workspace();
  const user = await User.create({ tenantId: tenant._id, name: "Owner", email: "socket@example.test", passwordHash: "unused", isVerified: true });
  const token = signAuthToken(user);
  const http = require("http"), { WebSocket } = require("ws"), { once } = require("events");
  const servers = [http.createServer(), http.createServer()], sockets = [];
  try {
    await apiA.initRealtime(servers[0]); await apiB.initRealtime(servers[1]);
    for (const server of servers) { server.listen(0, "127.0.0.1"); await once(server, "listening"); }
    for (const server of servers) {
      const socket = new WebSocket("ws://127.0.0.1:" + server.address().port + "/ws", { headers: { Origin: "http://localhost:5000", Cookie: require("../src/config/env").authCookieName + "=" + token } });
      const connected = once(socket, "message"); sockets.push(socket); await connected;
    }
    const arrivals = sockets.map(socket => once(socket, "message"));
    await worker.publishInboxUpdated(tenant._id, { action: "message_received", conversationId: String(new mongoose.Types.ObjectId()) });
    for (const [raw] of await Promise.all(arrivals)) assert.equal(JSON.parse(raw).action, "message_received");
    const disconnected = sockets.map(socket => once(socket, "close", { signal: AbortSignal.timeout(5000) }));
    await User.updateOne({ _id: user._id }, { $inc: { sessionVersion: 1 } });
    await worker.revokeUserSessions(user._id);
    for (const [code] of await Promise.all(disconnected)) assert.equal(code, 1008);
  } finally {
    for (const socket of sockets) socket.terminate();
    await apiA.closeRealtime(); await apiB.closeRealtime();
    await Promise.all(servers.map(server => new Promise(resolve => server.close(resolve))));
  }
});


test("Meta onboarding rejects an unrelated phone and failed event subscription before binding assets", async t => {
  const tenant = await workspace(), userId = new mongoose.Types.ObjectId();
  const meta = require("../src/services/meta.service");
  let matches = false;
  t.mock.method(global, "fetch", async url => {
    if (url.includes("oauth/access_token")) return response({ access_token: "exchanged-test-token" });
    if (url.includes("phone_numbers")) return response({ data: [{ id: matches ? "555" : "666" }] });
    if (url.includes("subscribed_apps")) return response({ success: false });
    throw new Error("Unexpected provider request");
  });
  let session = await meta.createOnboardingSession(tenant._id, userId);
  await assert.rejects(meta.completeEmbeddedSignup(tenant._id, userId, { state: session.state, code: "test-code", wabaId: "444", phoneNumberId: "555" }), /does not belong/);
  assert.equal((await Tenant.findById(tenant._id)).meta.wabaId, "987654");
  matches = true; session = await meta.createOnboardingSession(tenant._id, userId);
  await assert.rejects(meta.completeEmbeddedSignup(tenant._id, userId, { state: session.state, code: "test-code", wabaId: "444", phoneNumberId: "555" }), /subscription could not be completed/);
  assert.equal((await Tenant.findById(tenant._id)).meta.wabaId, "987654");
});

test("bulk insertion failure rolls back the entire batch ledger", async t => {
  const tenant = await workspace();
  await Template.create({ tenantId: tenant._id, name: "order_update", category: "utility", language: "en", status: "approved", body: "Ready", parameterCount: 0 });
  const contact = await Contact.create({ tenantId: tenant._id, name: "Customer", phone: "919999999999", optIn: { status: true } });
  t.mock.method(Message, "insertMany", async () => { throw new Error("Simulated batch write failure"); });
  await assert.rejects(messages.sendTemplateMessages(tenant._id, { templateName: "order_update", contactIds: [String(contact._id)], idempotencyKey: "rollback" }), /Simulated/);
  assert.equal(await require("../src/models/MessageBatch").countDocuments(), 0);
  assert.equal(await Message.countDocuments(), 0);
});

test("billing reconciliation recovers payment when browser and webhook callbacks are absent", async t => {
  const tenant = await workspace();
  const captured = { id: "pay_recovered", order_id: "order_recovered", amount: 100000, currency: "INR", status: "captured" };
  t.mock.method(global, "fetch", async (url, options) => {
    if (url.endsWith("/orders")) return response({ id: "order_recovered", ...JSON.parse(options.body) });
    if (url.endsWith("/orders/order_recovered/payments")) return response({ items: [captured] });
    return response(captured);
  });
  await billing.selectPlan(tenant._id, "monthly");
  await billing.reconcilePendingOrders();
  assert.equal(await Payment.countDocuments(), 1);
  assert.equal((await require("../src/models/BillingOrder").findOne()).status, "paid");
});


const { startRealtime } = require("../test-support/realtime");
const realtime = require("../src/services/realtime.service");
const { once } = require("events");
const waitForSocket = (socket, event = "message") => once(socket, event, { signal: AbortSignal.timeout(5000) });
async function socketUser(tenant, email = "socket-owner@example.test") {
  return User.create({ tenantId: tenant._id, name: "Socket Owner", email, passwordHash: "unused", isVerified: true });
}

test("delivery webhook reaches only its own tenant socket and carries no contact or credential data", async t => {
  const tenantA = await workspace();
  const tenantB = await Tenant.create({ businessName: "Other", contactPerson: "Other", businessEmail: "other-socket@example.test", whatsappNumber: "9876543211" });
  const userA = await socketUser(tenantA), userB = await socketUser(tenantB, "other-owner@example.test");
  const chatA = await Conversation.create({ tenantId: tenantA._id, customerPhone: "919999999999" });
  const chatB = await Conversation.create({ tenantId: tenantB._id, customerPhone: "918888888888" });
  const records = await InboxMessage.create([
    { tenantId: tenantA._id, conversationId: chatA._id, customerPhone: chatA.customerPhone, direction: "out", status: "sent", text: "Private A", metaMessageId: "same-provider-id" },
    { tenantId: tenantB._id, conversationId: chatB._id, customerPhone: chatB.customerPhone, direction: "out", status: "sent", text: "Private B", metaMessageId: "same-provider-id" }
  ]);
  const server = await startRealtime(t);
  const socketA = await server.connect(signAuthToken(userA)), socketB = await server.connect(signAuthToken(userB));
  const otherEvents = []; socketB.on("message", raw => otherEvents.push(JSON.parse(raw)));
  let arrival = waitForSocket(socketA);
  await webhook.processMessageStatuses(tenantA._id, [{ id: "same-provider-id", status: "delivered" }]);
  const event = JSON.parse((await arrival)[0]);
  assert.equal(event.status, "delivered"); assert.equal(event.messageId, String(records[0]._id));
  assert.equal(event.conversationId, String(chatA._id));
  assert.deepEqual(Object.keys(event).sort(), ["action", "at", "conversationId", "messageId", "status", "type"]);
  assert.equal((await InboxMessage.findById(records[1]._id)).status, "sent");
  arrival = waitForSocket(socketA);
  await realtime.publishInboxUpdated(tenantA._id, { action: "message_received", conversationId: String(chatA._id), customerPhone: "secret-phone", accessToken: "secret-token", text: "secret-body", type: "override" });
  assert.deepEqual(Object.keys(JSON.parse((await arrival)[0])).sort(), ["action", "at", "conversationId", "type"]);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(otherEvents.length, 0);
  const closed = waitForSocket(socketA, "close");
  socketA.send(JSON.stringify({ action: "subscribe", tenantId: String(tenantB._id) }));
  assert.equal((await closed)[0], 1008);
});

test("socket handshake rejects absent/untrusted origins, forged tenant claims, and query credentials", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const server = await startRealtime(t), token = signAuthToken(user);
  assert.equal(await server.rejected(token), 403);
  assert.equal(await server.rejected(token, { headers: { Origin: "null" } }), 403);
  assert.equal(await server.rejected(token, { headers: { Origin: "https://evil.example", Host: "localhost:5000" } }), 403);
  assert.equal(await server.rejected("bogus", { headers: { Origin: "http://localhost:5000" } }), 401);
  const forged = signAuthToken({ ...user.toObject(), tenantId: new mongoose.Types.ObjectId() });
  assert.equal(await server.rejected(forged, { headers: { Origin: "http://localhost:5000" } }), 401);
  assert.equal(await server.rejected(token, { headers: { Origin: "http://localhost:5000" }, query: "?tenantId=other" }), 404);
});

test("logout closes an already-connected socket and rejects its revoked token", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const server = await startRealtime(t), token = signAuthToken(user);
  const socket = await server.connect(token);
  const closed = waitForSocket(socket, "close");
  await request(app).post("/api/auth/logout").set("Origin", "http://localhost:5000").set("Authorization", "Bearer " + token).send({}).expect(200);
  assert.equal((await closed)[0], 1008);
  assert.equal(await server.rejected(token, { headers: { Origin: "http://localhost:5000" } }), 401);
});

test("a live socket cannot receive events after a user or workspace is disabled", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const server = await startRealtime(t), token = signAuthToken(user);
  for (const target of ["user", "tenant"]) {
    await User.updateOne({ _id: user._id }, { $set: { status: "active" } });
    await Tenant.updateOne({ _id: tenant._id }, { $set: { status: "active" } });
    const socket = await server.connect(token), messagesReceived = [];
    socket.on("message", raw => messagesReceived.push(raw));
    if (target === "user") await User.updateOne({ _id: user._id }, { $set: { status: "disabled" } });
    else await Tenant.updateOne({ _id: tenant._id }, { $set: { status: "suspended" } });
    const closed = waitForSocket(socket, "close");
    await realtime.publishInboxUpdated(tenant._id, { action: "message_received", conversationId: String(new mongoose.Types.ObjectId()) });
    assert.equal((await closed)[0], 1008); assert.equal(messagesReceived.length, 0);
  }
});

test("socket closes at token expiry without waiting for another message", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const token = require("jsonwebtoken").sign({ sub: String(user._id), tenantId: String(tenant._id), sv: 0 }, require("../src/config/env").jwtSecret,
    { algorithm: "HS256", issuer: "intercon-api", audience: "intercon-portal", expiresIn: 2 });
  const server = await startRealtime(t), socket = await server.connect(token);
  assert.equal((await waitForSocket(socket, "close"))[0], 1008);
});

test("socket fails closed if current authorization cannot be checked", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const server = await startRealtime(t), socket = await server.connect(signAuthToken(user));
  const messagesReceived = []; socket.on("message", raw => messagesReceived.push(raw));
  t.mock.method(User, "find", () => { throw new Error("Simulated database outage"); });
  const closed = waitForSocket(socket, "close");
  await realtime.publishInboxUpdated(tenant._id, { action: "message_received", conversationId: String(new mongoose.Types.ObjectId()) });
  assert.equal((await closed)[0], 1011); assert.equal(messagesReceived.length, 0);
});


test("socket resource limits reject excessive tabs and oversized frames", async t => {
  const tenant = await workspace(), user = await socketUser(tenant);
  const server = await startRealtime(t), token = signAuthToken(user), sockets = [];
  for (let i = 0; i < 10; i++) sockets.push(await server.connect(token));
  assert.equal(await server.rejected(token, { headers: { Origin: "http://localhost:5000" } }), 429);
  const closed = waitForSocket(sockets[0], "close");
  sockets[0].send(Buffer.alloc(2048));
  assert.ok([1009, 1006].includes((await closed)[0]));
});
