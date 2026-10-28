// Browser contract checks: all APIs/providers are mocked; no live database.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), os = require("node:os");
Object.assign(process.env, { NODE_ENV: "test", MONGODB_URI: "", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000" });
const { chromium } = require("playwright");
const app = require("../app");
let server, browser;
const tenant = { id: "000000000000000000000001", businessName: "Synthetic Business", status: "active", meta: {},
  billing: { plan: "monthly", status: "active", active: true, platformAccess: true, currentPeriodEnd: "2027-12-01T00:00:00Z" } };
const user = { id: "000000000000000000000002", tenantId: tenant.id, name: "Test Owner", role: "owner", email: "test@example.test", tenant };
const templates = ["document", "image", "video"].map(headerType => ({ name: `file_${headerType}`, headerType, language: "en", category: "utility", status: "approved", parameterCount: 1, body: "Hello {{1}}, here is your file." }));
const contacts = ["Priya Sharma", "Rahul Mehta", "Anita Verma"].map((name, index) => ({ _id: String(index + 10).padStart(24, "0"), name, phone: `91987654321${index}`, status: "active", optIn: { status: true }, tags: [] }));
async function run() {
  server = await new Promise(resolve => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const errors = [], calls = []; let failOnce = true;
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/messages/send-media") {
      const request = route.request(), body = request.postDataBuffer().toString("utf8"), key = request.headers()["idempotency-key"];
      assert.match(request.headers()["content-type"], /multipart\/form-data/);
      assert.match(body, /919876543210/); assert.match(body, /Synthetic invoice/); assert.match(body, /file_document/);
      assert.match(body, /Customer/); assert.match(body, /permissionConfirmed/); assert.ok(key);
      calls.push({ key });
      if (failOnce) { failOnce = false; return route.fulfill({ status: 503, json: { message: "Synthetic temporary upload failure. Retry the same details." } }); }
      return route.fulfill({ status: 202, json: { success: true, queued: true, messageId: "message-test", mediaId: "media-test", deliveryId: "delivery-test", status: "queued" } });
    }
    const data = { success: true, contacts: [], segments: [], groups: [], templates: [], messages: [], media: [], apiKeys: [], payments: [], plans: [], flows: [], conversations: [], nextCursor: null };
    if (url.pathname === "/api/auth/me") data.user = user;
    if (url.pathname === "/api/auth/session") data.authenticated = true;
    if (url.pathname === "/api/billing") data.billing = tenant.billing;
    if (url.pathname === "/api/meta/onboarding") data.tenant = tenant;
    if (url.pathname === "/api/templates/approved") data.templates = templates;
    if (url.pathname === "/api/contacts") data.contacts = contacts;
    if (url.pathname === "/api/media") data.media = [{ mediaId: "shared-pdf", title: "Product catalogue", mediaType: "document", mimeType: "application/pdf", bytes: 1024, url: "/fixture.pdf" }];
    return route.fulfill({ status: 200, json: data });
  });
  await page.goto(`${origin}/customer`);
  await page.waitForFunction(() => typeof setupState !== "undefined" && setupState.user);
  await page.evaluate(() => showPortalView("send-whatsapp"));
  await page.locator('[data-send-template-select]').selectOption("file_document");
  await page.locator('[data-send-media-select]').selectOption("shared-pdf");
  await page.locator('[data-send-contact-choice]').first().check();
  const shared = page.locator('[data-shared-send-layout]');
  const recipient = page.locator('[data-recipient-delivery-panel]');
  const assertFits = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Delivery layout must fit viewport");
  const screenshot = mode => page.screenshot({ path: path.join(os.tmpdir(), `intercon-${mode}-delivery-${page.viewportSize().width}.png`), fullPage: true, animations: "disabled" });
  for (const width of [1440, 1024, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertFits(); await screenshot("shared");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByText("Unique Media", { exact: true }).click();
  assert.equal(await shared.isVisible(), false);
  assert.equal(await recipient.isVisible(), true);
  await page.locator('[data-recipient-delivery-form] [name="templateChoice"]').selectOption(JSON.stringify(["file_document", "en"]));
  const form = page.locator("[data-recipient-delivery-form]");
  await form.locator('[name="to"]').fill("919876543210");
  await form.locator('[name="name"]').fill("Customer");
  await form.getByLabel("Text variable 1", { exact: true }).fill("Customer");
  await form.locator('[name="file"]').setInputFiles({ name: "invoice.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nSynthetic invoice\n") });
  await form.locator('[name="permissionConfirmed"]').check();
  assert.match(await page.locator("[data-recipient-preview-text]").innerText(), /Hello Customer/);
  assert.equal(await page.locator('[data-recipient-preview-document]').isVisible(), true);
  await page.getByText("Common Media", { exact: true }).click();
  assert.equal(await form.isVisible(), false);
  assert.equal(await page.locator('[data-send-template-select]').inputValue(), "file_document");
  await page.getByText("Unique Media", { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-recipient-delivery-form] [name="templateChoice"]').options.length > 1);
  assert.equal(await form.getByLabel("Text variable 1", { exact: true }).inputValue(), "Customer", "Switching modes must preserve the composed message");
  for (const width of [1440, 1024, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertFits(); await screenshot("recipient");
    const number = await form.locator('[name="to"]').boundingBox();
    const name = await form.locator('[name="name"]').boundingBox();
    if (width === 1440) assert.equal(Math.round(number.y), Math.round(name.y), "Recipient inputs must align");
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    await form.locator('button[type="submit"]').click();
    await page.locator("[data-confirm-accept]").click();
    await page.waitForFunction(attempt => document.querySelector("[data-recipient-delivery-status]").textContent.includes(attempt === 0 ? "Synthetic temporary" : "message-test"), attempt);
  }
  assert.equal(calls.length, 2); assert.equal(calls[0].key, calls[1].key);
  await form.locator('[name="purpose"]').selectOption("patient_report");
  assert.equal(await form.locator('[name="consentReference"]').getAttribute("required"), "");
  assert.equal(await form.locator('[name="templateChoice"] option').count(), 2);
  assert.equal(await page.locator('[data-recipient-terms-note]').isVisible(), true);
  await form.locator('[name="purpose"]').selectOption("general");
  for (const [type, name, mimeType, buffer] of [
    ["image", "photo.png", "image/png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=", "base64")],
    ["video", "video.mp4", "video/mp4", Buffer.from("synthetic video preview")]
  ]) {
    await form.locator('[name="templateChoice"]').selectOption(JSON.stringify([`file_${type}`, "en"]));
    await form.locator('[name="file"]').setInputFiles({ name, mimeType, buffer });
    assert.equal(await page.locator(`[data-recipient-preview-media] ${type === "image" ? "img" : "video"}`).isVisible(), true);
    assert.equal(await page.locator('[data-recipient-preview-document]').isVisible(), false);
  }
  await page.getByText("Common Media", { exact: true }).click();
  assert.equal(await page.locator("[data-send-message-form]").isVisible(), true);
  await page.locator('[data-delivery-mode][value="shared"]').focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await form.isVisible(), true, "Delivery modes must support keyboard navigation");
  assert.deepEqual(errors, []);
  console.log("Both delivery types passed: 1440/1024/390/360px layouts, aligned inputs, keyboard switching, preserved drafts, PDF/photo/video previews, same-key retry and conditional patient fields.");
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
});
