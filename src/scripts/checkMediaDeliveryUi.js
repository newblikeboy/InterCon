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
templates.push({ ...templates[0], name: "common_document", mediaMode: "common" }, { ...templates[0], name: "unique_document", mediaMode: "unique" });
const contacts = ["Priya Sharma", "Rahul Mehta", "Anita Verma"].map((name, index) => ({ _id: String(index + 10).padStart(24, "0"), name, phone: `91987654321${index}`, status: "active", optIn: { status: true }, tags: [] }));
async function run() {
  server = await new Promise(resolve => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const errors = [], calls = [], uploads = []; let failOnce = true, mediaFails = false;
  const libraryMedia = [{ mediaId: "shared-pdf", title: "Product catalogue", purpose: "general", deliveryScope: "shared", mediaType: "document", mimeType: "application/pdf", bytes: 1024, url: "/fixture.pdf", createdAt: "2026-10-29T00:00:00Z" }];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    if (url.pathname === "/api/media" && route.request().method() === "POST") {
      const body = route.request().postDataBuffer().toString("utf8");
      assert.doesNotMatch(body, /name="recipientContactId"|name="recipientVerified"/);
      uploads.push(body);
      const scope = /name="deliveryScope"\r\n\r\nunique\r\n/.test(body) ? "unique" : "shared";
      const mimeType = /Content-Type: image\/png/i.test(body) ? "image/png" : "application/pdf";
      const asset = { mediaId: `library-${uploads.length}`, title: scope === "unique" ? "Individual invoice" : "Shared brochure", deliveryScope: scope,
        storageProvider: scope === "unique" ? "meta" : "cloudinary", ...(scope === "unique" ? { accessExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString() } : {}),
        mediaType: mimeType.startsWith("image/") ? "image" : "document", mimeType, purpose: "general", bytes: 1024, url: "/fixture.pdf", createdAt: "2026-10-29T00:00:00Z" };
      libraryMedia.unshift(asset);
      return route.fulfill({ status: 201, json: { success: true, media: asset } });
    }
    if (url.pathname === "/api/messages/send-media") {
      const request = route.request(), body = request.postDataBuffer().toString("utf8"), key = request.headers()["idempotency-key"];
      assert.match(request.headers()["content-type"], /multipart\/form-data/);
      if (/name="mediaId"/.test(body)) {
        assert.match(body, /library-1/); assert.doesNotMatch(body, /name="file"/);
        const asset = libraryMedia.find(asset => asset.mediaId === "library-1");
        asset.deliveryScope = "recipient"; asset.recipientContactId = contacts[0]._id;
        return route.fulfill({ status: 202, json: { success: true, messageId: "library-message-test", mediaId: asset.mediaId } });
      }
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
    if (url.pathname === "/api/media") {
      if (mediaFails) return route.fulfill({ status: 503, json: { message: "Sample library temporarily unavailable" } });
      data.media = libraryMedia;
    }
    return route.fulfill({ status: 200, json: data });
  });
  await page.goto(`${origin}/customer`);
  await page.waitForFunction(() => typeof setupState !== "undefined" && setupState.user);
  await page.evaluate(() => showPortalView("media-library"));
  const library = page.locator("#media-library"), modal = page.locator("[data-media-modal]");
  await page.locator('[data-media-category="unique"]').click();
  assert.match(await library.innerText(), /No unique media yet/);
  await page.locator('[data-open-media-modal]').click();
  assert.equal(await modal.locator('[name="deliveryScope"]:checked').inputValue(), "unique");
  assert.equal(await modal.locator('[name="recipientContactId"]').count(), 0);
  await modal.locator('[name="purpose"]').selectOption("patient_report");
  assert.equal(await modal.locator('[name="file"]').getAttribute("accept"), ".pdf,application/pdf");
  await modal.locator('[name="deliveryScope"][value="shared"]').check();
  assert.equal(await modal.locator('[name="purpose"]').inputValue(), "general");
  assert.equal(await modal.locator('[data-media-purpose-field]').isVisible(), false);
  await modal.locator('[name="deliveryScope"][value="unique"]').check();
  await modal.locator('[name="file"]').setInputFiles({ name: "individual.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nIndividual file\n") });
  const assertLibraryFits = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Media library must fit viewport");
  for (const width of [1440, 1024, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await assertLibraryFits();
    const bounds = await modal.locator(".media-modal-card").boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y >= 0 && bounds.y + bounds.height <= 1000);
    const submitBounds = await modal.locator('[data-media-upload-submit]').boundingBox();
    assert.ok(submitBounds.y >= bounds.y && submitBounds.y + submitBounds.height <= bounds.y + bounds.height, "Upload action must stay visible inside the modal");
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-media-upload-${width}.png`), fullPage: true });
  }
  await modal.locator('[data-media-upload-submit]').click();
  await modal.waitFor({ state: "hidden" });
  assert.equal(uploads.length, 1);
  assert.match(await library.innerText(), /Individual invoice/);
  assert.doesNotMatch(await library.locator('[data-media-grid]').innerText(), /Product catalogue/);
  await page.locator('[data-media-filter]').selectOption("image");
  assert.match(await library.innerText(), /No media matches/);
  await page.locator('[data-media-filter]').selectOption("all");
  for (const width of [1440, 1024, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 }); await assertLibraryFits();
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-media-library-${width}.png`), fullPage: true });
  }
  await page.locator('[data-media-category="shared"]').click();
  assert.match(await library.locator('[data-media-grid]').innerText(), /Product catalogue/);
  assert.doesNotMatch(await library.locator('[data-media-grid]').innerText(), /Individual invoice/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => showPortalView("send-whatsapp"));
  await page.locator('[data-send-template-select]').selectOption("file_document");
  await page.locator('[data-send-media-select]').selectOption("shared-pdf");
  assert.equal(await page.locator('[data-send-template-select] option[value="unique_document"]').count(), 0, "Common sending must exclude Unique Media templates");
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
  await page.locator("#send-whatsapp").getByText("Unique Media", { exact: true }).click();
  assert.equal(await shared.isVisible(), false);
  assert.equal(await recipient.isVisible(), true);
  await page.locator('[data-recipient-delivery-form] [name="templateChoice"]').selectOption(JSON.stringify(["file_document", "en"]));
  assert.equal(await page.locator('[data-recipient-delivery-form] [name="templateChoice"] option').filter({ hasText: "common_document" }).count(), 0, "Unique sending must exclude Common Media templates");
  const form = page.locator("[data-recipient-delivery-form]");
  await form.locator('[name="to"]').fill("919876543210");
  await form.locator('[name="name"]').fill("Customer");
  await form.getByLabel("Text variable 1", { exact: true }).fill("Customer");
  await form.locator('[name="file"]').setInputFiles({ name: "invoice.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nSynthetic invoice\n") });
  await form.locator('[name="permissionConfirmed"]').check();
  assert.match(await page.locator("[data-recipient-preview-text]").innerText(), /Hello Customer/);
  assert.equal(await page.locator('[data-recipient-preview-document]').isVisible(), true);
  await page.locator("#send-whatsapp").getByText("Common Media", { exact: true }).click();
  assert.equal(await form.isVisible(), false);
  assert.equal(await page.locator('[data-send-template-select]').inputValue(), "file_document");
  await page.locator("#send-whatsapp").getByText("Unique Media", { exact: true }).click();
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
  assert.equal(await form.locator('[name="templateChoice"] option').count(), 3);
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
  await form.locator('[name="templateChoice"]').selectOption(JSON.stringify(["file_document", "en"]));
  await form.locator('[name="mediaId"]').selectOption("library-1");
  assert.equal(await form.locator('[name="file"]').isVisible(), false);
  await form.locator('[name="to"]').fill("919876543210");
  await form.getByLabel("Text variable 1", { exact: true }).fill("Customer");
  await form.locator('[name="permissionConfirmed"]').check();
  await form.locator('button[type="submit"]').click();
  await page.locator("[data-confirm-accept]").click();
  await page.waitForFunction(() => document.querySelector("[data-recipient-delivery-status]").textContent.includes("library-message-test"));
  assert.equal(uploads.length, 1, "Library sends must not upload again");
  await page.locator("#send-whatsapp").getByText("Common Media", { exact: true }).click();
  assert.equal(await page.locator("[data-send-message-form]").isVisible(), true);
  await page.locator('[data-delivery-mode][value="shared"]').focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await form.isVisible(), true, "Delivery modes must support keyboard navigation");
  const savedCommon = libraryMedia.find(asset => asset.mediaId === "shared-pdf");
  libraryMedia.splice(libraryMedia.indexOf(savedCommon), 1);
  libraryMedia.push({ ...savedCommon, mediaId: "unique-sample", title: "Synthetic unique sample", deliveryScope: "unique" },
    { ...savedCommon, mediaId: "private-report", title: "Confidential report", deliveryScope: "unique", purpose: "patient_report" },
    { ...savedCommon, mediaId: "sample-gif", title: "Unsupported image", mediaType: "image", mimeType: "image/gif" },
    { ...savedCommon, mediaId: "sample-mov", title: "Unsupported video", mediaType: "video", mimeType: "video/quicktime" });
  await page.evaluate(() => showPortalView("templates"));
  await page.locator('[data-open-template-modal]').click();
  await page.waitForFunction(() => !mediaState.loading);
  await page.locator('[data-template-category]').selectOption("utility");
  await page.locator('[data-template-name]').fill("invoice_update");
  await page.locator('[data-template-language]').selectOption("en");
  await page.locator('[data-template-body]').fill("Your invoice is ready.");
  await page.locator('[data-template-header-type]').selectOption("document");
  await page.waitForFunction(() => !mediaState.loading);
  const sampleSelect = page.locator('[data-template-header-media]');
  const sampleHint = page.locator('[data-template-header-media-hint]');
  assert.equal(await sampleSelect.isEnabled(), true, "The library picker must remain accessible with an explanatory empty state");
  assert.match(await sampleHint.innerText(), /selected file is uploaded to Meta/);
  assert.equal(await sampleSelect.locator('option[value="__upload_sample__"]').count(), 0, "Template creation only selects existing library media");
  assert.equal(await sampleSelect.locator('option[value="shared-pdf"]').count(), 0, "Opening the builder must refresh stale cached media");
  assert.equal(await page.locator('[data-template-upload-sample], [data-template-refresh-media]').count(), 0, "The picker must not add separate upload or refresh buttons");
  assert.equal(await sampleSelect.locator('option[value="library-1"]').isDisabled(), true, "Assigned private files must be listed with an unavailable reason");
  assert.equal(await sampleSelect.locator('option[value="private-report"]').isEnabled(), true, "An unassigned PDF must not be disabled just because its purpose is patient_report");
  await sampleSelect.selectOption("private-report");
  assert.equal(await sampleSelect.inputValue(), "private-report");
  assert.equal(await sampleSelect.locator('option[value="unique-sample"]').isEnabled(), true, "Unassigned general Unique Media must be selectable as a sample");
  assert.equal(await sampleSelect.locator('option[value="sample-gif"]').count(), 0, "PDF headers must only list PDFs");
  await page.locator('[data-template-media-mode]').selectOption("unique");
  await sampleSelect.selectOption("unique-sample");
  assert.deepEqual(await page.evaluate(() => ({ mode: getTemplatePayload().mediaMode, sample: getTemplatePayload().headerMediaId })), { mode: "unique", sample: "unique-sample" });
  await page.locator('[data-template-media-mode]').selectOption("common");
  assert.equal(await sampleSelect.inputValue(), "unique-sample", "Delivery mode must not change which approval samples are listed");
  libraryMedia.push(savedCommon);
  await page.locator('[data-template-header-type]').selectOption("document");
  await page.waitForFunction(() => !mediaState.loading);
  assert.equal(await sampleSelect.isEnabled(), true);
  await sampleSelect.selectOption("shared-pdf");
  mediaFails = true;
  await page.locator('[data-template-header-type]').selectOption("document");
  await page.waitForFunction(() => !mediaState.loading && mediaState.loadError);
  assert.match(await sampleHint.innerText(), /Sample library temporarily unavailable/);
  mediaFails = false;
  await page.locator('[data-template-header-type]').selectOption("document");
  await page.waitForFunction(() => !mediaState.loading && !mediaState.loadError);
  assert.equal(await sampleSelect.inputValue(), "shared-pdf", "Refreshing must preserve a valid sample selection");
  await page.locator('[data-template-header-type]').selectOption("image");
  await page.waitForFunction(() => !mediaState.loading);
  assert.equal(await sampleSelect.locator('option[value="sample-gif"]').isDisabled(), true, "All images must be shown, with unsupported formats labelled");
  assert.equal(await sampleSelect.locator('option[value="shared-pdf"]').count(), 0);
  await page.locator('[data-template-header-type]').selectOption("video");
  await page.waitForFunction(() => !mediaState.loading);
  assert.equal(await sampleSelect.locator('option[value="sample-mov"]').isDisabled(), true, "All videos must be shown, with unsupported formats labelled");
  assert.equal(await sampleSelect.locator('option[value="sample-gif"]').count(), 0);
  assert.equal(uploads.length, 1, "Selecting template media must not trigger uploads");
  await page.locator('[data-template-header-type]').selectOption("document");
  await page.waitForFunction(() => !mediaState.loading);
  await sampleSelect.selectOption("shared-pdf");
  await page.locator('[data-template-media-mode]').selectOption("unique");
  assert.equal(await sampleSelect.isEnabled(), true);
  assert.equal(await sampleSelect.inputValue(), "shared-pdf", "Existing Media Library samples must be selectable");
  assert.equal(await page.locator('[data-template-name]').inputValue(), "invoice_update");
  assert.equal(await page.locator('[data-template-body]').inputValue(), "Your invoice is ready.");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 }); await assertFits();
    await page.locator('[data-template-header-media-field]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-template-media-${width}.png`), fullPage: true, animations: "disabled" });
  }
  assert.deepEqual(errors, []);
  console.log("Media library and template flows passed: header-type filtering across both library categories, separate Common/Unique delivery field, unavailable sample reasons, mode-specific send templates, library sends, responsive layouts, retry safety and draft preservation.");
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
});
