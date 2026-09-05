// Real local browser -> HTTP/WebSocket -> disposable MongoDB test.
// No live provider requests or production data are used.
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const { once } = require("events");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const { chromium } = require("playwright");
Object.assign(process.env, {
  NODE_ENV: "test", REDIS_URL: "", MONGODB_URI: "", FB_APP_ID: "realtime-test-app", FB_APP_SECRET: "realtime-test-secret", META_APP_SECRET: "",
  JWT_SECRET: "realtime-browser-test-jwt-secret-123456",
  DATA_ENCRYPTION_KEY: "realtime-browser-test-data-key-987654"
});
let server, database, browser, realtime;
async function run() {
  server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = "http://127.0.0.1:" + server.address().port;
  process.env.CLIENT_ORIGIN = origin;
  const app = require("../app");
  server.on("request", app);
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" }, instanceOpts: [{ launchTimeout: 60000 }] });
  await mongoose.connect(database.getUri(), { autoIndex: false });
  await require("../config/indexes").ensureCriticalIndexes();
  realtime = require("../services/realtime.service");
  await realtime.initRealtime(server);
  const tenant = await require("../models/Tenant").create({
    businessName: "Realtime Test Shop", contactPerson: "Owner", businessEmail: "realtime@example.test", whatsappNumber: "9876543210",
    billing: { plan: "monthly", status: "active", currentPeriodEnd: new Date(Date.now() + 86400000) }
  });
  const user = await require("../models/User").create({ tenantId: tenant._id, name: "Owner", email: "realtime@example.test", passwordHash: "unused", isVerified: true });
  const contact = await require("../models/Contact").create({ tenantId: tenant._id, name: "Customer", phone: "919999999999", optIn: { status: true } });
  const conversation = await require("../models/Conversation").create({ tenantId: tenant._id, contactId: contact._id, customerName: "Customer", customerPhone: contact.phone, lastInboundAt: new Date() });
  const stored = await require("../models/InboxMessage").create({ tenantId: tenant._id, conversationId: conversation._id, customerPhone: contact.phone, direction: "out", text: "Your order is ready", status: "sent", metaMessageId: "test-delivery" });
  const chrome = process.env.UI_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: require("../config/env").authCookieName, value: require("../services/authToken.service").signAuthToken(user), url: origin, httpOnly: true, sameSite: "Lax" }]);
  await context.route("**/*", route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [], frames = [];
  let navigations = 0;
  page.on("pageerror", error => errors.push(error.message));
  page.on("framenavigated", frame => { if (frame === page.mainFrame()) navigations++; });
  page.on("websocket", socket => socket.on("framereceived", frame => frames.push(JSON.parse(String(frame.payload)))));
  await page.goto(origin + "/customer#inbox");
  await page.waitForFunction(() => inboxState.realtimeSocket?.readyState === WebSocket.OPEN);
  await page.locator('[data-inbox-thread="' + conversation._id + '"]').click();
  await page.locator('.inbox-ticks[aria-label="sent"]').waitFor();
  const webhook = require("../services/webhook.service");
  const timings = {};
  for (const status of ["delivered", "read"]) {
    const start = Date.now();
    await webhook.processMessageStatuses(tenant._id, [{ id: "test-delivery", status }]);
    await page.locator('.inbox-ticks[aria-label="' + status + '"]').waitFor({ timeout: 5000 });
    timings[status] = Date.now() - start;
  }
  // A late status and a stale REST response must not regress the blue read ticks.
  await webhook.processMessageStatuses(tenant._id, [{ id: "test-delivery", status: "sent" }]);
  await page.evaluate(messageId => {
    mergeInboxMessages({ messages: [{ ...inboxState.messages.find(item => item.id === messageId), status: "sent" }] });
  }, String(stored._id));
  assert.equal(await page.locator('.inbox-ticks[aria-label="read"]').count(), 1);
  const inbound = (id, text) => ({ messages: [{ id, from: contact.phone, timestamp: String(Math.floor(Date.now() / 1000)), type: "text", text: { body: text } }] });
  await webhook.processInboundMessages(tenant._id, inbound("live-reply", "Customer reply received live"));
  await page.getByText("Customer reply received live", { exact: true }).last().waitFor({ timeout: 5000 });
  // Drop the socket, store an event while offline, then let reconnect fetch it.
  await page.evaluate(() => inboxState.realtimeSocket.close());
  await page.waitForFunction(() => !inboxState.realtimeSocket);
  await webhook.processInboundMessages(tenant._id, inbound("offline-reply", "Reply received during reconnect"));
  await page.getByText("Reply received during reconnect", { exact: true }).last().waitFor({ timeout: 6000 });
  assert.equal(navigations, 1);
  const outgoing = frames.filter(event => event.type === "inbox:updated");
  assert.ok(outgoing.some(event => event.action === "status_updated" && event.status === "read"));
  for (const event of outgoing) {
    assert.ok(Object.keys(event).every(key => ["type", "action", "at", "conversationId", "messageId", "status"].includes(key)));
  }
  const directory = path.resolve("docs/review-2026-09-06/realtime");
  fs.mkdirSync(directory, { recursive: true });
  await page.screenshot({ path: path.join(directory, "inbox-live-mobile.png") });
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(directory, "browser-results.json"), JSON.stringify({
    passed: true, timingsMs: timings, pageNavigations: navigations,
    checks: ["real authenticated WebSocket", "delivered/read ticks without reload", "late status and stale fetch do not regress read", "incoming message without reload", "reconnect recovers missed message", "notification fields contain no message body, phone, or credentials"],
    errors, limitations: "Local Chrome and disposable MongoDB; provider webhook input simulated; no production or live Redis connection."
  }, null, 2));
  console.log("Realtime browser checks passed", JSON.stringify({ timingsMs: timings, pageNavigations: navigations }));
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (realtime) await realtime.closeRealtime();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});
