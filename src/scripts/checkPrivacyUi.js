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
const Contact = require("../models/Contact");
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
  await page.goto(`${origin}/customer`);
  await page.waitForFunction(() => document.querySelector('[data-profile-business-name]').textContent === "Synthetic Test Lab");
  for (const width of [1280, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('[data-profile-trigger]').click();
    const privacyLink = page.locator('[data-profile-dropdown] a[href="/privacy-center"]');
    assert.equal(await privacyLink.innerText(), "Data & privacy");
    const linkBounds = await privacyLink.boundingBox();
    assert.ok(linkBounds.x >= 0 && linkBounds.x + linkBounds.width <= width && linkBounds.height >= 44, "Profile privacy link must fit and provide a full clickable row");
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-profile-privacy-${width}.png`), animations: "disabled" });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator('[data-profile-dropdown]').isVisible(), false);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('[data-profile-trigger]').click();
  await page.locator('[data-profile-dropdown] a[href="/privacy-center"]').click();
  await page.waitForURL(`${origin}/privacy-center`);
  await page.waitForFunction(() => document.querySelector("#terms-status").textContent.includes("2026-10-29"));
  assert.match(await page.locator("#requests").innerText(), /No requests yet/);
  await page.screenshot({ path: path.join(os.tmpdir(), "intercon-privacy-initial.png"), fullPage: true });
  await page.locator('#terms-form input[type="checkbox"]').check();
  await page.locator("#terms-form button").click();
  await page.waitForFunction(() => document.querySelector("#terms-status").textContent.startsWith("Accepted"));
  assert.equal(await page.locator("#terms-form").isVisible(), false);
  assert.equal(await page.locator("#terms-badge").innerText(), "Terms accepted");
  await page.locator('#request-form [name="kind"]').selectOption("grievance");
  await page.locator('#request-form [name="notes"]').fill("Synthetic privacy workflow check");
  await page.locator("#request-form button").click();
  await page.waitForFunction(() => document.querySelector("#requests").textContent.toLowerCase().includes("grievance"));
  assert.equal(await page.locator("#review-section").isVisible(), false);
  const desktop = path.join(os.tmpdir(), "intercon-privacy-desktop.png");
  await page.screenshot({ path: desktop, fullPage: true });
  const contact = await Contact.create({ tenantId: tenant._id, name: "Synthetic Customer", phone: "919000000001", optIn: { status: true } });
  await page.locator('#request-form [name="subject"]').selectOption("customer");
  await page.locator('#request-form [name="contactId"]').selectOption(String(contact._id));
  await page.locator('#request-form [name="kind"]').selectOption("access");
  await page.locator("#request-form button").click();
  await page.waitForFunction(() => document.querySelector("#request-count").textContent === "2");
  assert.equal(await page.locator("#review-section").isVisible(), true);
  assert.match(await page.locator(".request-export").getAttribute("href"), new RegExp(String(contact._id)));
  await page.locator('#review-form [name="status"]').selectOption("in_review");
  await page.locator('#review-form [name="response"]').fill("Synthetic identity review in progress");
  await page.locator("#review-form button").click();
  await page.waitForFunction(() => document.querySelector("#requests").textContent.includes("Synthetic identity review in progress"));
  await page.locator("#restore-section summary").click();
  for (const width of [1280, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Privacy page must fit viewport");
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-privacy-manager-${width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = path.join(os.tmpdir(), "intercon-privacy-mobile.png");
  await page.screenshot({ path: mobile, fullPage: true });
  const agent = await User.create({ tenantId: tenant._id, name: "Synthetic Agent", email: "agent@example.test", passwordHash: "unused", isVerified: true, role: "agent" });
  await context.addCookies([{ name: env.authCookieName, value: signAuthToken(agent), url: origin }]);
  await page.goto(`${origin}/privacy-center`);
  await page.waitForFunction(() => typeof user !== "undefined" && user?.role === "agent" && document.querySelector("#requests").getAttribute("aria-busy") === "false");
  for (const selector of ["#terms-form", "#review-section", "#restore-section"]) assert.equal(await page.locator(selector).isVisible(), false, "Agent view must not expose owner/admin actions");
  assert.equal(await page.locator('#request-form option[value="customer"]').evaluate(option => option.disabled), true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, checks: "Profile navigation and keyboard closing; terms acceptance; account/customer requests and review; role visibility; 1280/1024/768/390/360px layouts", desktop, mobile }));
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  if (database) await database.stop();
});
