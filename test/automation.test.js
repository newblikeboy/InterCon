const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "automation-test-secret-not-production-123", DATA_ENCRYPTION_KEY: "automation-encryption-not-production-456" });
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const Tenant = require("../src/models/Tenant");
const Conversation = require("../src/models/Conversation");
const Flow = require("../src/models/AutomationFlow");
const Execution = require("../src/models/AutomationExecution");
const InboxMessage = require("../src/models/InboxMessage");
const Contact = require("../src/models/Contact");
const automation = require("../src/services/automation.service");
const queue = require("../src/services/automationQueue.service");
const engine = require("../src/services/automationEngine");
const inbox = require("../src/services/inbox.service");
const webhook = require("../src/services/webhook.service");
const HttpError = require("../src/utils/httpError");
let database, tenant, serial = 0;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" }, instanceOpts: [{ launchTimeout: 60000 }] });
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await require("../src/config/indexes").ensureCriticalIndexes();
});
after(async () => { await mongoose.disconnect(); if (database) await database.stop(); });
beforeEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) await collection.deleteMany({});
  tenant = await Tenant.create({ businessName: "Test", contactPerson: "Owner", businessEmail: "automation@example.test", whatsappNumber: "9876543210",
    billing: { plan: "monthly", status: "active", currentPeriodEnd: new Date(Date.now() + 86400000) },
    meta: { phoneNumberId: "123456", wabaId: "987654", accessToken: "test-token" } });
});
function payload() { return { name: "Welcome", triggerType: "keyword", triggerValue: "hi", nodes: [
  { id: "trigger", type: "trigger", keyword: "hi" },
  { id: "menu", type: "menu", message: "Choose a team", options: [{ label: "Sales", nextNodeId: "sales" }, { label: "Support", nextNodeId: "support" }] },
  { id: "sales", type: "handoff", message: "Sales will continue.", routeTo: "sales" },
  { id: "support", type: "message", message: "Support information." }
], edges: [{ from: "trigger", to: "menu" }] }; }
async function launch(body = payload()) { const flow = await automation.createAutomationFlow(tenant._id, body); return automation.activateAutomationFlow(tenant._id, flow._id); }
function provider(t) {
  const sent = [];
  t.mock.method(global, "fetch", async (url, options) => {
    sent.push(JSON.parse(options.body).text.body);
    return { ok: true, status: 200, headers: new Headers(), json: async () => ({ messages: [{ id: "bot-" + ++serial }] }) };
  });
  return sent;
}
async function inbound(text, id = "in-" + ++serial, timestamp = Math.floor(Date.now() / 1000)) {
  await webhook.processInboundMessages(tenant._id, { messages: [{ id, from: "919999999999", timestamp: String(timestamp), type: "text", text: { body: text } }] }, "987654", "123456");
}
async function current() { return Conversation.findOne({ tenantId: tenant._id }); }

test("Hi and all restart commands work at every menu; unknown replies redisplay choices", async t => {
  await launch(); const sent = provider(t);
  for (const text of ["Hi", "Hi", "help me", "99", "restart", "menu", "main menu", "HI!"]) await inbound(text);
  assert.equal(sent.length, 8);
  assert.match(sent[2], /Please choose.*\n\nChoose a team/s);
  assert.match(sent[3], /1\. Sales\n2\. Support/);
  assert.equal((await current()).automation.status, "active");
});
test("unknown initial messages receive a deterministic fallback", async t => {
  await launch(); const sent = provider(t); await inbound("hello there");
  assert.match(sent[0], /Please choose/); assert.equal((await current()).automation.currentNodeId, "menu");
});
test("expired, missing, and legacy invalid menu states recover", async t => {
  await launch(); const sent = provider(t); await inbound("Hi");
  for (const update of [{ "automation.updatedAt": new Date(Date.now() - 30 * 86400000) }, { "automation.currentNodeId": "deleted" }, { "automation.flowId": new mongoose.Types.ObjectId() }]) {
    await Conversation.updateOne({ tenantId: tenant._id }, { $set: update }); await inbound("1");
    assert.match(sent.at(-1), /start again/); assert.equal((await current()).automation.status, "active");
  }
});
test("live edits retain the old flow for existing sessions, restart uses new flow", async t => {
  const flow = await launch(); const sent = provider(t); await inbound("Hi");
  const updated = payload(); updated.nodes[1].id = "new_menu"; updated.edges[0].to = "new_menu";
  updated.nodes[1].message = "New choices"; updated.nodes[3].message = "New support information";
  await automation.updateAutomationFlow(tenant._id, flow._id, updated);
  await inbound("2"); assert.equal(sent.at(-1), "Support information.");
  await inbound("Hi"); assert.match(sent.at(-1), /New choices/);
});
test("invalid live edits are rejected without changing the active graph", async () => {
  const flow = await launch(); const broken = payload(); broken.nodes[1].options[0].nextNodeId = "";
  await assert.rejects(automation.updateAutomationFlow(tenant._id, flow._id, broken), /next reply block/);
  assert.equal((await Flow.findById(flow._id)).nodes[1].options[0].nextNodeId, "sales");
});
test("automatic message chains reach the menu and resume through another chain", async t => {
  const p = payload(); p.nodes.splice(1, 0, { id: "welcome", type: "message", message: "Welcome", nextNodeId: "menu" });
  p.edges[0].to = "welcome"; p.nodes.find(n => n.id === "support").nextNodeId = "menu";
  await launch(p); const sent = provider(t); await inbound("Hi"); await inbound("2");
  assert.deepEqual(sent, ["Welcome", "Choose a team\n\n1. Sales\n2. Support", "Support information.", "Choose a team\n\n1. Sales\n2. Support"]);
  assert.equal((await current()).automation.currentNodeId, "menu");
});
test("validation rejects unsupported triggers, loops, unreachable nodes, and ambiguous labels", () => {
  for (const mutate of [
    p => { p.triggerType = "unknown_reply"; },
    p => { p.edges[0].to = "trigger"; },
    p => { p.nodes[3].nextNodeId = "support"; },
    p => { p.nodes.push({ id: "unused", type: "message", message: "Unused" }); },
    p => { p.nodes[1].options[1].label = "Sales"; },
    p => { p.nodes[1].options[0].label = "Hi"; },
    p => { p.nodes[1].options[0].label = "2"; },
    p => { p.edges.push({ from: "trigger", to: "support" }); }
  ]) { const p = payload(); mutate(p); assert.throws(() => engine.validateLiveFlow(p)); }
});
test("handoff stays held through Hi and pause/resume until explicitly released", async t => {
  const flow = await launch(); const sent = provider(t); await inbound("Hi"); await inbound("1"); await inbound("Hi");
  assert.equal(sent.length, 2); assert.equal((await current()).automation.status, "handoff");
  await automation.updateAutomationStatus(tenant._id, flow._id, "paused"); await automation.activateAutomationFlow(tenant._id, flow._id);
  await inbound("Hi"); assert.equal(sent.length, 2);
  await inbox.setAutomationControl(tenant._id, (await current())._id, { action: "release" });
  await inbound("Hi"); assert.equal(sent.length, 3);
});
test("manual inbox reply and business-app echo take over the bot", async t => {
  await launch(); const sent = provider(t); await inbound("Hi");
  const c = await current(); await inbox.sendReply(tenant._id, c._id, { text: "An agent is here" });
  await inbound("Hi"); assert.equal(sent.length, 2);
  await inbox.setAutomationControl(tenant._id, c._id, { action: "release" });
  await require("../src/models/WebhookEvent").create({ eventKey: "echo-event", wabaId: "987654", phoneNumberId: "123456", payload: {
    field: "smb_message_echoes", value: { metadata: { phone_number_id: "123456" }, message_echoes: [{ id: "echo", to: c.customerPhone, type: "text", text: { body: "Agent from phone" } }] }
  } });
  await webhook.processNextWebhookEvent("echo-test");
  await inbound("Hi"); assert.equal(sent.length, 2); assert.equal((await current()).automationControl.held, true);
});
test("two concurrent launches leave exactly one active flow", async () => {
  const a = await automation.createAutomationFlow(tenant._id, payload());
  const b = await automation.createAutomationFlow(tenant._id, { ...payload(), name: "Second" });
  await Promise.all([automation.activateAutomationFlow(tenant._id, a._id), automation.activateAutomationFlow(tenant._id, b._id)]);
  assert.equal(await Flow.countDocuments({ tenantId: tenant._id, status: "active" }), 1);
});
test("duplicate inbound webhook creates only one execution and one reply", async t => {
  await launch(); const sent = provider(t); await inbound("Hi", "duplicate"); await inbound("Hi", "duplicate");
  assert.equal(sent.length, 1); assert.equal(await Execution.countDocuments(), 1);
});
test("inbound storage rolls back if the durable automation job cannot be saved", async t => {
  await launch(); provider(t);
  t.mock.method(queue, "enqueueInbound", async () => { throw new Error("Queue storage failed"); });
  await assert.rejects(inbound("Hi"), /Queue storage failed/);
  assert.equal(await InboxMessage.countDocuments(), 0); assert.equal(await Conversation.countDocuments(), 0);
});
test("worker recovers a committed inbound message if immediate processing fails", async t => {
  await launch(); const sent = provider(t);
  const stub = t.mock.method(automation, "runAutomationForInboundMessage", async () => { throw new Error("Worker interrupted"); });
  await inbound("Hi"); assert.equal(sent.length, 0); assert.equal(await Execution.countDocuments({ status: "queued" }), 1);
  stub.mock.restore(); await queue.processNextAutomationJob(); assert.equal(sent.length, 1);
});
test("overlapping customer replies are queued and processed in order", async t => {
  await launch(); let entered, release, count = 0;
  const started = new Promise(resolve => { entered = resolve; }); const sent = [];
  t.mock.method(global, "fetch", async (url, options) => {
    sent.push(JSON.parse(options.body).text.body);
    if (++count === 1) { entered(); await new Promise(resolve => { release = resolve; }); }
    return { ok: true, status: 200, headers: new Headers(), json: async () => ({ messages: [{ id: "concurrent-" + count }] }) };
  });
  const first = inbound("Hi"); await started;
  try { await inbound("2"); assert.equal(sent.length, 1); } finally { release(); }
  await first; assert.equal(sent.length, 2); assert.equal(sent[1], "Support information.");
  assert.equal(await Execution.countDocuments({ status: "completed" }), 2);
});
test("known temporary rejection retries automatically before subsequent turns", async t => {
  await launch(); const sent = provider(t);
  const original = inbox.sendReply; let rejected = false;
  t.mock.method(inbox, "sendReply", async (...args) => {
    if (!rejected) { rejected = true; const error = new HttpError(503, "Temporarily rejected"); error.deliveryOutcome = "rejected"; throw error; }
    return original(...args);
  });
  await inbound("Hi"); await inbound("2"); assert.equal(sent.length, 0);
  assert.equal(await Execution.countDocuments({ status: "retry" }), 1);
  await Execution.updateMany({ status: "retry" }, { $set: { nextAttemptAt: new Date(0) } });
  await queue.processNextAutomationJob(); assert.equal(sent.length, 2); assert.equal(sent[1], "Support information.");
});
test("retry resumes a message chain without repeating its accepted first message", async t => {
  const p = payload(); p.nodes.push({ id: "welcome", type: "message", message: "Welcome", nextNodeId: "menu" }); p.edges[0].to = "welcome";
  await launch(p); const sent = provider(t); const original = inbox.sendReply; let calls = 0;
  t.mock.method(inbox, "sendReply", async (...args) => {
    if (++calls === 2) { const error = new HttpError(429, "Rejected rate limit"); error.deliveryOutcome = "rejected"; throw error; }
    return original(...args);
  });
  await inbound("Hi"); assert.deepEqual(sent, ["Welcome"]);
  await Execution.updateMany({ status: "retry" }, { $set: { nextAttemptAt: new Date(0) } });
  await queue.processNextAutomationJob(); assert.equal(sent.length, 2); assert.equal(sent.filter(text => text === "Welcome").length, 1);
});
test("uncertain delivery is never automatically resent; a fresh Hi can recover", async t => {
  await launch(); const sent = provider(t); const original = inbox.sendReply; let first = true;
  t.mock.method(inbox, "sendReply", async (...args) => { if (first) { first = false; throw new HttpError(503, "Timeout", { code: "UPSTREAM_TIMEOUT" }); } return original(...args); });
  await inbound("Hi"); assert.equal(await Execution.countDocuments({ status: "uncertain" }), 1);
  await queue.processNextAutomationJob(); assert.equal(sent.length, 0);
  await inbound("Hi"); assert.equal(sent.length, 1);
});
test("accepted send followed by local failure uses durable evidence without resending", async t => {
  await launch(); const sent = provider(t); const original = inbox.sendReply;
  t.mock.method(inbox, "sendReply", async (...args) => { await original(...args); throw new Error("Bookkeeping interrupted"); });
  await inbound("Hi"); assert.equal(sent.length, 1); assert.equal(await Execution.countDocuments({ status: "completed" }), 1);
  assert.equal((await current()).automation.status, "active");
});
test("takeover during a bot send stops further blocks and cannot be overwritten", async t => {
  const p = payload(); p.nodes.push({ id: "welcome", type: "message", message: "Welcome", nextNodeId: "menu" }); p.edges[0].to = "welcome";
  await launch(p); const sent = provider(t); const original = inbox.sendReply;
  t.mock.method(inbox, "sendReply", async (...args) => { const result = await original(...args); await inbox.setAutomationControl(tenant._id, args[1], { action: "takeover" }); return result; });
  await inbound("Hi"); assert.deepEqual(sent, ["Welcome"]); assert.equal((await current()).automation.status, "handoff");
});
test("takeover after planning is rechecked by the send service before provider delivery", async t => {
  await launch(); const sent = provider(t); const original = inbox.sendReply;
  t.mock.method(inbox, "sendReply", async (...args) => {
    await inbox.setAutomationControl(tenant._id, args[1], { action: "takeover" });
    return original(...args);
  });
  await inbound("Hi"); assert.equal(sent.length, 0);
  assert.equal((await current()).automationControl.held, true);
  assert.equal((await Execution.findOne()).action, "human_handoff");
});
test("blocked contacts are not sent replies and failure appears in diagnostics", async t => {
  await launch(); const sent = provider(t);
  await Contact.create({ tenantId: tenant._id, phone: "919999999999", name: "Blocked", status: "blocked" });
  await inbound("Hi"); assert.equal(sent.length, 0);
  const [entry] = await automation.listExecutions(tenant._id); assert.equal(entry.status, "failed"); assert.match(entry.error, /blocked/);
});
test("simulation uses runtime decisions without sending messages or saving customer state", async t => {
  const sent = provider(t);
  const result = await automation.simulateAutomation(tenant._id, { flow: payload(), messages: ["Hi", "help", "menu", "1", "Hi"] });
  assert.deepEqual(result.turns.map(turn => turn.action), ["restarted", "fallback", "restarted", "sent", "human_handoff"]);
  assert.equal(sent.length, 0); assert.equal(await Conversation.countDocuments(), 0); assert.equal(await Execution.countDocuments(), 0);
});
test("diagnostics and control cannot cross tenant boundaries", async t => {
  await launch(); provider(t); await inbound("Hi"); const other = new mongoose.Types.ObjectId();
  assert.deepEqual(await automation.listExecutions(other), []);
  await assert.rejects(inbox.setAutomationControl(other, (await current())._id, { action: "release" }), /not found/);
});

test("an invalid legacy live graph sends a recovery notice and hands off", async t => {
  const flow = await launch(); const sent = provider(t);
  await Flow.updateOne({ _id: flow._id }, { $set: { edges: [{ from: "trigger", to: "trigger" }] } });
  await inbound("Hi"); assert.equal(sent.length, 1); assert.match(sent[0], /unable to open the menu/);
  assert.equal((await current()).automation.status, "handoff");
  const [entry] = await automation.listExecutions(tenant._id); assert.equal(entry.action, "invalid_flow_handoff"); assert.ok(entry.error);
});
test("expired worker lease with a sending marker records uncertainty without resending", async t => {
  const flow = await launch(); const sent = provider(t);
  const c = await Conversation.create({ tenantId: tenant._id, customerPhone: "919999999999", automationLock: { token: "dead-worker", expiresAt: new Date(0) } });
  await Execution.create({ tenantId: tenant._id, conversationId: c._id, inboundMessageId: new mongoose.Types.ObjectId(), sequence: 1, text: "Hi", status: "processing",
    plan: { ...engine.buildPlan({ flows: [flow.toObject()], text: "Hi" }), messages: [{ nodeId: "menu", text: "Choose", status: "sending" }] } });
  await queue.processNextAutomationJob(); assert.equal(sent.length, 0);
  assert.equal(await Execution.countDocuments({ status: "uncertain" }), 1);
  assert.equal((await current()).automation.needsRecovery, true);
});
test("crashed worker reconciles an already accepted step and advances state once", async t => {
  const flow = await launch(); const sent = provider(t);
  const c = await Conversation.create({ tenantId: tenant._id, customerPhone: "919999999999" });
  const plan = engine.buildPlan({ flows: [flow.toObject()], text: "Hi" }); plan.messages[0].status = "sending";
  const job = await Execution.create({ tenantId: tenant._id, conversationId: c._id, inboundMessageId: new mongoose.Types.ObjectId(), sequence: 1, text: "Hi", status: "processing", plan });
  await InboxMessage.create({ tenantId: tenant._id, conversationId: c._id, customerPhone: c.customerPhone, direction: "out", metaMessageId: "accepted-before-crash", status: "sent", automationExecutionId: job._id, automationStep: 0 });
  await queue.processNextAutomationJob(); assert.equal(sent.length, 0);
  assert.equal((await current()).automation.status, "active"); assert.equal((await Execution.findById(job._id)).status, "completed");
});
test("retry attempts are bounded and another customer can proceed during backoff", async t => {
  await launch(); const sent = provider(t); const original = inbox.sendReply; let rejectedConversation;
  t.mock.method(inbox, "sendReply", async (...args) => {
    rejectedConversation ||= String(args[1]);
    if (String(args[1]) === rejectedConversation) { const error = new HttpError(503, "Rejected temporarily"); error.deliveryOutcome = "rejected"; throw error; }
    return original(...args);
  });
  await inbound("Hi");
  await webhook.processInboundMessages(tenant._id, { messages: [{ id: "other-customer", from: "918888888888", type: "text", text: { body: "Hi" } }] }, "987654", "123456");
  assert.equal(sent.length, 1);
  for (let attempt = 0; attempt < 4; attempt++) {
    await Execution.updateMany({ status: "retry" }, { $set: { nextAttemptAt: new Date(0) } }); await queue.processNextAutomationJob();
  }
  const failed = await Execution.findOne({ status: "failed" }); assert.equal(failed.attempts, 5);
  assert.equal(await queue.processNextAutomationJob(), null);
});
test("release discards old queued messages but accepts the next inbound sequence", async t => {
  await launch(); const sent = provider(t);
  const stub = t.mock.method(automation, "runAutomationForInboundMessage", async () => ({ action: "queued" }));
  await inbound("Hi"); await inbound("1"); const c = await current();
  await inbox.setAutomationControl(tenant._id, c._id, { action: "takeover" });
  await inbox.setAutomationControl(tenant._id, c._id, { action: "release" });
  stub.mock.restore(); await inbound("Hi"); assert.equal(sent.length, 1);
  assert.equal((await current()).automation.status, "active");
  assert.equal(await Execution.countDocuments({ action: "human_handoff" }), 2);
});
test("older delayed messages cannot rewind the customer journey", async t => {
  await launch(); const sent = provider(t); const now = Math.floor(Date.now() / 1000);
  await inbound("Hi", "latest", now); await inbound("1", "older", now - 60);
  assert.equal(sent.length, 1); assert.equal((await current()).automation.status, "active");
  assert.equal(await Execution.countDocuments({ action: "stale_message" }), 1);
});

test("provider delivery failures remain visible separately from accepted execution", async t => {
  await launch(); provider(t); await inbound("Hi");
  const reply = await InboxMessage.findOne({ direction: "out" });
  await webhook.processMessageStatuses(tenant._id, [{ id: reply.metaMessageId, status: "failed", errors: [{ code: 131026, title: "Undeliverable" }] }]);
  const [entry] = await automation.listExecutions(tenant._id);
  assert.equal(entry.status, "completed"); assert.equal(entry.deliveryStatus, "failed"); assert.match(entry.deliveryError, /Undeliverable/);
});
test("HTTP endpoints enforce management roles and do not accept automation impersonation", async t => {
  await launch(); provider(t); await inbound("Hi");
  const request = require("supertest"), app = require("../src/app");
  const User = require("../src/models/User");
  const { signAuthToken } = require("../src/services/authToken.service");
  const owner = await User.create({ tenantId: tenant._id, name: "Owner", email: "owner@example.test", passwordHash: "unused", role: "owner", isVerified: true });
  const agent = await User.create({ tenantId: tenant._id, name: "Agent", email: "agent@example.test", passwordHash: "unused", role: "agent", isVerified: true });
  const token = signAuthToken(owner), agentToken = signAuthToken(agent);
  await request(app).get("/api/automations/executions").expect(401);
  await request(app).get("/api/automations/executions").set("Authorization", "Bearer " + agentToken).expect(403);
  const simulation = await request(app).post("/api/automations/simulate").set("Authorization", "Bearer " + token).set("Origin", "http://localhost:5000").send({ flow: payload(), messages: ["Hi"] }).expect(200);
  assert.equal(simulation.body.turns[0].action, "restarted");
  const c = await current();
  await request(app).post(`/api/inbox/conversations/${c._id}/reply`).set("Authorization", "Bearer " + agentToken).set("Origin", "http://localhost:5000")
    .send({ text: "Agent reply", automationSend: true, automationExecutionId: new mongoose.Types.ObjectId(), automationStep: 0 }).expect(201);
  assert.equal((await current()).automationControl.held, true);
  const manual = await InboxMessage.findOne({ text: "Agent reply" }); assert.equal(manual.automationExecutionId, undefined);
  await request(app).patch(`/api/inbox/conversations/${c._id}/automation`).set("Authorization", "Bearer " + agentToken).set("Origin", "http://localhost:5000").send({ action: "release" }).expect(200);
  assert.equal((await current()).automationControl.held, false);
});
