// Isolated browser/database check; never starts the application against .env's database.
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
Object.assign(process.env, {
  NODE_ENV: "test", MONGODB_URI: "", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000",
  JWT_SECRET: "privacy-ui-isolated-jwt-key-1234567890",
  DATA_ENCRYPTION_KEY: "privacy-ui-isolated-encryption-key-1234567890"
});
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");
const { chromium } = require("playwright");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const { signAuthToken } = require("../services/authToken.service");
const env = require("../config/env");
let database, server, browser;
async function run() {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1, ip: "127.0.0.1" } });
  await mongoose.connect(database.getUri());
  const tenant = await Tenant.create({ businessName: "Synthetic Test Lab", contactPerson: "Test Owner",
    businessEmail: "lab@example.test", whatsappNumber: "919999999999" });
  const owner = await User.create({ tenantId: tenant._id, name: "Test Owner", email: "owner@example.test",
    passwordHash: "unused", isVerified: true, role: "owner" });
  server = await new Promise(resolve => { const listener = require("node:http").createServer().listen(0, "127.0.0.1", () => resolve(listener)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  env.clientOrigin = origin;
  server.on("request", require("../app"));
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addCookies([{ name: env.authCookieName, value: signAuthToken(owner), url: origin }]);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  await page.goto(`${origin}/privacy-center`);
  await page.waitForFunction(() => document.querySelector("#terms-status").textContent.includes("2026-10-29"));
  await page.locator('#terms-form input[type="checkbox"]').check();
  await page.locator("#terms-form button").click();
  await page.waitForFunction(() => document.querySelector("#terms-status").textContent.startsWith("Accepted"));
  await page.locator('#request-form [name="kind"]').selectOption("grievance");
  await page.locator('#request-form [name="notes"]').fill("Synthetic privacy workflow check");
  await page.locator("#request-form button").click();
  await page.waitForFunction(() => document.querySelector("#requests").textContent.includes("grievance"));
  assert.equal(await page.locator("#review-section").isVisible(), false);
  const desktop = path.join(os.tmpdir(), "intercon-privacy-desktop.png");
  await page.screenshot({ path: desktop, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile page must fit viewport");
  const mobile = path.join(os.tmpdir(), "intercon-privacy-mobile.png");
  await page.screenshot({ path: mobile, fullPage: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, desktop, mobile }));
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});
