const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000", JWT_SECRET: "admin-integration-test-secret-123", DATA_ENCRYPTION_KEY: "admin-test-encryption-secret-456" });
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const admin = require("../src/services/admin.service");
const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const Payment = require("../src/models/Payment");
const Message = require("../src/models/Message");
const WebhookEvent = require("../src/models/WebhookEvent");
const Audit = require("../src/models/PlatformAudit");
const { signAuthToken } = require("../src/services/authToken.service");
let database;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(database.getUri());
  await Promise.all([Tenant.init(), User.init(), Payment.init(), Message.init(), WebhookEvent.init(), Audit.init()]);
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => { for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({}); });
async function tenant(extra = {}) { return Tenant.create({ businessName: "Customer shop", businessEmail: "shop@example.test", contactPerson: "Owner", whatsappNumber: "919999999999", ...extra }); }
async function member(workspace, extra = {}) { return User.create({ tenantId: workspace._id, name: "Member", email: new mongoose.Types.ObjectId() + "@example.test", passwordHash: "secret-hash", isVerified: true, ...extra }); }
async function actor() { return member(await tenant({ kind: "platform" }), { platformRole: "admin" }); }
const paid = source => ({ plan: "monthly", status: "active", amount: 1500, currency: "INR", accessSource: source, currentPeriodEnd: new Date(Date.now() + 3 * 86400000) });
async function payment(workspace, amount, status = "captured", currency = "INR") {
  const id = new mongoose.Types.ObjectId().toString();
  return Payment.create({ tenantId: workspace._id, providerOrderId: "order_" + id, providerPaymentId: "pay_" + id, signatureHash: "hidden-signature", plan: "monthly", amount, currency, status, capturedAt: new Date() });
}
test("administrator access is checked live and ordinary owners cannot read or change platform records", async () => {
  const user = await member(await tenant());
  const token = signAuthToken(user);
  await request(app).get("/admin/login").expect(200);
  await request(app).get("/admin").expect(302).expect("Location", "/admin/login");
  await request(app).get("/api/admin/me").expect(401);
  await request(app).get("/api/admin/overview").set("Authorization", "Bearer " + token).expect(403);
  await request(app).post(`/api/admin/users/${user._id}/actions`).set("Origin", "http://localhost:5000").set("Authorization", "Bearer " + token).send({ action: "disable", reason: "Unauthorized change" }).expect(403);
  await User.updateOne({ _id: user._id }, { $set: { platformRole: "admin" } });
  await request(app).get("/api/admin/me").set("Authorization", "Bearer " + token).expect(200);
  await User.updateOne({ _id: user._id }, { $set: { platformRole: "none" } });
  await request(app).get("/api/admin/me").set("Authorization", "Bearer " + token).expect(403);
});
test("revenue separates currencies, refunds and manual grants; paid users and MRR exclude internal accounts", async () => {
  const customer = await tenant({ billing: paid("payment") });
  const manual = await tenant({ billing: paid("manual") });
  const platform = await tenant({ kind: "platform", billing: paid("payment") });
  await member(customer); await member(customer); await member(manual); await member(platform);
  await payment(customer, 150000); await payment(customer, 50000, "refunded"); await payment(customer, 2500, "captured", "USD");
  const result = await admin.overview({});
  assert.equal(result.counts.tenants, 2);
  assert.equal(result.counts.users, 3);
  assert.equal(result.counts.paidTenants, 1);
  assert.equal(result.counts.paidUsers, 2);
  assert.equal(result.counts.manualTenants, 1);
  assert.equal(result.counts.expiring, 1);
  assert.deepEqual(result.revenue.mrr, [{ currency: "INR", amount: 150000 }]);
  assert.equal(result.revenue.period.find(row => row.currency === "INR" && row.status === "captured").amount, 150000);
  assert.equal(result.revenue.period.find(row => row.status === "refunded").amount, 50000);
  assert.equal(result.revenue.trend.find(row => row.currency === "USD").amount, 2500);
  const users = await admin.records("users", { segment: "paid" });
  assert.equal(users.records.length, 2);
});
test("record pagination, literal search, detail and CSV exports never expose credentials or webhook payloads", async () => {
  const administrator = await actor();
  const workspace = await tenant({ businessName: "=SUM(1,2)", meta: { accessToken: "never-expose-provider-token", phoneNumberId: "123" }, trial: { recipients: ["919888888888"] } });
  await member(workspace); await member(workspace);
  await payment(workspace, 150000);
  await WebhookEvent.create({ tenantId: workspace._id, eventKey: "safe-key", payload: { privateMessage: "do-not-expose" }, status: "dead" });
  const first = await admin.records("users", { limit: 1 });
  assert.equal(first.records.length, 1); assert.ok(first.nextCursor);
  const second = await admin.records("users", { limit: 1, after: first.nextCursor });
  assert.notEqual(String(first.records[0]._id), String(second.records[0]._id));
  assert.equal((await admin.records("tenants", { q: ".*" })).records.length, 0);
  for (const kind of ["tenants", "users", "payments", "webhooks"]) {
    const text = JSON.stringify(await admin.records(kind, {}));
    assert.ok(!/passwordHash|signatureHash|accessToken|payload|919888888888|do-not-expose/.test(text));
  }
  const detail = JSON.stringify(await admin.tenantDetails(String(workspace._id)));
  assert.ok(!/passwordHash|signatureHash|accessToken|919888888888/.test(detail));
  assert.equal(admin.csvCell("=SUM(1,2)"), '"\'=SUM(1,2)"');
  assert.equal(admin.csvCell("919999999999"), '"\'919999999999"');
  const csv = await request(app).get("/api/admin/export/tenants").set("Authorization", "Bearer " + signAuthToken(administrator)).expect(200);
  assert.match(csv.text, /'=SUM\(1,2\)/); assert.doesNotMatch(csv.text, /accessToken|never-expose/);
  await request(app).get("/api/admin/records/tenants?status=unknown").set("Authorization", "Bearer " + signAuthToken(administrator)).expect(400);
});
test("admin usage and trial segments use message counts rather than recipient counts", async () => {
  const workspace = await tenant({ trial: { recipients: ["919999999999"], messagesInitializedAt: new Date(), sentMessages: Array.from({ length: 20 }, (_, i) => `private-message-${i}`) } });
  const rows = await admin.records("tenants", {});
  assert.equal(rows.records.find(row => String(row._id) === String(workspace._id)).trialUsed, 20);
  assert.ok(!(await admin.records("tenants", { segment: "trial" })).records.some(row => String(row._id) === String(workspace._id)));
  const details = await admin.tenantDetails(String(workspace._id));
  assert.equal(details.trial.used, 20);
  assert.equal(details.trial.unit, "messages");
  assert.doesNotMatch(JSON.stringify(details), /private-message-/);
});
test("disabling users revokes cached sessions and records the actor and reason atomically", async () => {
  const administrator = await actor(); const user = await member(await tenant()); const token = signAuthToken(user);
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(200);
  await admin.userAction(administrator, String(user._id), { action: "disable", reason: "Account abuse review" });
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(401);
  const audit = await Audit.findOne({ action: "user.disable" }).lean();
  assert.equal(audit.actorEmail, administrator.email); assert.equal(audit.reason, "Account abuse review"); assert.equal(audit.before.status, "active"); assert.equal(audit.after.status, "disabled");
  await assert.rejects(admin.userAction(administrator, String(administrator._id), { action: "disable", reason: "Protect administrator" }), /protected/);
  assert.equal(await Audit.countDocuments(), 1);
});
test("suspension revokes every workspace member; manual grants do not invent payment revenue", async () => {
  const administrator = await actor(); const workspace = await tenant(); const user = await member(workspace); const token = signAuthToken(user);
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(200);
  await admin.tenantAction(administrator, String(workspace._id), { action: "suspend", reason: "Workspace under review" });
  assert.equal((await Tenant.findById(workspace._id)).status, "suspended");
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(401);
  await admin.tenantAction(administrator, String(workspace._id), { action: "reactivate", reason: "Review now completed" });
  const endDate = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  await admin.tenantAction(administrator, String(workspace._id), { action: "grant-plan", plan: "quarterly", endDate, reason: "Approved complimentary access" });
  assert.equal((await Tenant.findById(workspace._id)).billing.accessSource, "manual");
  assert.equal(await Payment.countDocuments(), 0); assert.equal((await admin.overview({})).counts.manualTenants, 1);
  await assert.rejects(admin.tenantAction(administrator, String(workspace._id), { action: "grant-plan", plan: "monthly", endDate: "2027-02-31", reason: "Invalid calendar date" }), /calendar date/);
  await assert.rejects(admin.tenantAction(administrator, String(administrator.tenantId), { action: "suspend", reason: "Protect admin workspace" }), /administrative workspace/);
  await assert.rejects(admin.tenantAction(administrator, String(workspace._id), { action: "suspend", reason: "x" }), /reason/);
  assert.equal(await Audit.countDocuments(), 3);
});
test("pending messages can be cancelled but unknown outcomes cannot; webhook retry preserves its payload", async () => {
  const administrator = await actor(); const workspace = await tenant();
  const queued = await Message.create({ tenantId: workspace._id, to: "919999999999", templateName: "hello", status: "queued" });
  const unknown = await Message.create({ tenantId: workspace._id, to: "919999999999", templateName: "hello", status: "uncertain" });
  await admin.operationAction(administrator, "message", String(queued._id), { action: "cancel", reason: "Customer requested cancellation" });
  assert.equal((await Message.findById(queued._id)).status, "cancelled");
  await assert.rejects(admin.operationAction(administrator, "message", String(unknown._id), { action: "cancel", reason: "Unsafe cancellation attempt" }), /not started delivery/);
  const hook = await WebhookEvent.create({ tenantId: workspace._id, eventKey: "retry-key", payload: { object: "original" }, status: "dead", attempts: 8 });
  await admin.operationAction(administrator, "webhook", String(hook._id), { action: "retry", reason: "Temporary issue resolved" });
  const saved = await WebhookEvent.findById(hook._id);
  assert.equal(saved.status, "queued"); assert.equal(saved.attempts, 0); assert.equal(saved.payload.object, "original");
  assert.equal(await Audit.countDocuments(), 2);
});
test("provisioning hashes passwords, preserves existing customer identity and revokes previous sessions", async () => {
  const workspace = await tenant(); const user = await member(workspace, { name: "Existing owner", email: "admin@example.test" });
  const password = "Testing123!"; const token = signAuthToken(user);
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(200);
  await admin.provisionAdmin(user.email, password);
  const saved = await User.findById(user._id).select("+passwordHash +platformRole +sessionVersion");
  assert.equal(saved.name, "Existing owner"); assert.equal(String(saved.tenantId), String(workspace._id)); assert.equal(saved.platformRole, "admin");
  assert.notEqual(saved.passwordHash, password); assert.ok(await bcrypt.compare(password, saved.passwordHash));
  await request(app).get("/api/auth/me").set("Authorization", "Bearer " + token).expect(401);
  const login = await request(app).post("/api/auth/login").set("Origin", "http://localhost:5000").send({ email: user.email, password }).expect(200);
  await request(app).get("/api/admin/me").set("Cookie", login.headers["set-cookie"]).expect(200);
  await admin.provisionAdmin("new-admin@example.test", password);
  const newUser = await User.findOne({ email: "new-admin@example.test" });
  assert.equal((await Tenant.findById(newUser.tenantId)).kind, "platform");
  assert.equal((await admin.overview({})).counts.tenants, 1);
});
