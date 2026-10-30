// Synthetic browser checks; intercept all APIs and external traffic.
const assert = require("node:assert/strict");
const path = require("node:path"), os = require("node:os");
Object.assign(process.env, { NODE_ENV: "test", MONGODB_URI: "", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000" });
const { chromium } = require("playwright");
const app = require("../app");
const { REPORT_FIELDS } = require("../services/reportDelivery.service");
let server, browser;
async function run() {
  server = await new Promise(resolve => { const listener = app.listen(0, "127.0.0.1", () => resolve(listener)); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(15000);
  const tenant = { id: "000000000000000000000001", businessName: "Synthetic Lab", status: "active", meta: {},
    billing: { plan: "monthly", status: "active", active: true, platformAccess: true, currentPeriodEnd: "2027-12-01T00:00:00Z" } };
  const user = { id: "000000000000000000000002", name: "Owner", role: "owner", tenant };
  const template = { _id: "000000000000000000000003", name: "report_ready", language: "en", category: "utility",
    status: "approved", headerType: "document", mediaMode: "unique", parameterCount: 2,
    body: "Hello {{1}}, your report from {{2}} is attached.", reportMappingEligible: true, reportConfigured: false };
  const approvedTemplates = [template,
    { ...template, _id: "000000000000000000000004", name: "report_ready_hindi", language: "hi", reportConfigured: true },
    { ...template, _id: "common", name: "common_pdf", mediaMode: "common", reportMappingEligible: false },
    { ...template, _id: "pending", name: "pending_pdf", status: "in_review", reportMappingEligible: true },
    { ...template, _id: "image", name: "image_template", headerType: "image", reportMappingEligible: false },
    { ...template, _id: "marketing", name: "marketing_pdf", category: "marketing", reportMappingEligible: false }];
  let bindings = [], saves = 0, failSave = false, failRead = false, failList = false, emptyList = false;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (!url.pathname.startsWith("/api/")) return route.continue();
    const data = { success: true, contacts: [], templates: [], groups: [], segments: [], messages: [], media: [],
      conversations: [], flows: [], keys: [], payments: [], plans: [], nextCursor: null };
    if (url.pathname === "/api/auth/me") data.user = user;
    if (url.pathname === "/api/auth/session") data.authenticated = true;
    if (url.pathname === "/api/meta/onboarding") data.tenant = tenant;
    if (url.pathname === "/api/billing") data.billing = tenant.billing;
    if (["/api/templates", "/api/templates/approved"].includes(url.pathname)) {
      if (failList) return route.fulfill({ status: 503, json: { message: "Synthetic template list failure" } });
      data.templates = emptyList ? [] : approvedTemplates;
    }
    if (url.pathname.endsWith("/report-mapping")) {
      if (route.request().method() === "PATCH") {
        saves++;
        if (failSave) return route.fulfill({ status: 503, json: { message: "Synthetic save failure" } });
        bindings = route.request().postDataJSON().bindings;
        template.reportConfigured = true;
        data.template = { _id: template._id, reportConfigured: true };
      } else {
        if (failRead) return route.fulfill({ status: 503, json: { message: "Synthetic read failure" } });
        data.template = { ...template, reportBindings: bindings };
        data.fields = REPORT_FIELDS;
      }
    }
    return route.fulfill({ status: 200, json: data });
  });
  await page.goto(`${origin}/customer`);
  await page.waitForFunction(() => typeof setupState !== "undefined" && setupState.user);
  await page.evaluate(() => showPortalView("templates"));
  await page.locator("[data-template-status-list] [data-delete-template]").first().waitFor();
  assert.equal(await page.locator("#templates [data-report-mapping]").count(), 0);
  assert.doesNotMatch(await page.locator("[data-template-status-list]").innerText(), /[Mm]apping/);
  await page.evaluate(() => showPortalView("api"));
  const accessCard = page.locator('#api .launch-card[href="#developer-api"]');
  const integrationCard = page.locator('#api .launch-card[href="#integration"]');
  const accessBounds = await accessCard.boundingBox(), integrationBounds = await integrationCard.boundingBox();
  assert.ok(integrationBounds.x > accessBounds.x && Math.abs(integrationBounds.y - accessBounds.y) < 1, "Integration must appear to the right of API Access");
  await page.screenshot({ path: path.join(os.tmpdir(), "intercon-api-menu-1440.png"), fullPage: true });
  await accessCard.click();
  assert.equal(await page.locator("#developer-api").isVisible(), true);
  assert.equal(await page.locator("#developer-api [data-integration-panel]").count(), 0, "Integration must be separate from API Access");
  await page.locator('#developer-api .console-back[href="#api"]').click();
  await integrationCard.click();
  assert.equal(await page.locator("#integration").isVisible(), true);
  assert.equal(await page.locator("[data-console-title]").innerText(), "Integration");
  assert.equal(await page.locator('.portal-nav a[href="#api"]').getAttribute("class"), "active");
  const panel = page.locator("[data-integration-panel]");
  const trigger = panel.locator(`[data-report-mapping="${template._id}"]`);
  await trigger.waitFor();
  assert.equal(await panel.locator("h2").innerText(), "Integration");
  assert.equal(await panel.evaluate(node => node.closest("[data-portal-view]").id), "integration");
  assert.equal(await panel.locator("[data-report-mapping]").count(), 2, "List all eligible approved template languages only");
  assert.equal(await panel.locator("[data-integration-count]").innerText(), "2 templates");
  assert.match(await panel.innerText(), /Mapping pending/);
  assert.match(await panel.innerText(), /Mapping ready/);
  assert.doesNotMatch(await panel.innerText(), /common_pdf|pending_pdf|image_template|marketing_pdf/);
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await panel.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-integration-${width}.png`), fullPage: true });
  }
  const modal = page.locator("[data-report-mapping-modal]");
  await trigger.click();
  await modal.locator("[data-report-source]").first().waitFor();
  assert.equal(await modal.locator("[data-report-source]").count(), 2);
  assert.equal(await modal.locator("[data-report-source]").first().inputValue(), "", "Never guess placeholder meanings");
  await modal.locator("[data-save-report-mapping]").click();
  assert.equal(saves, 0, "Incomplete mappings must not be submitted");
  await modal.locator('[data-report-source="0"]').selectOption("patientName");
  await modal.locator('[data-report-source="1"]').selectOption("literal");
  await modal.locator("[data-report-literal]").nth(1).fill('Synthetic Lab <branch> "A"');
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    const bounds = await modal.locator(".report-mapping-card").boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(os.tmpdir(), `intercon-report-mapping-${width}.png`), fullPage: true });
  }
  failSave = true;
  await modal.locator("[data-save-report-mapping]").click();
  await page.waitForFunction(() => document.querySelector("[data-report-mapping-message]").textContent.includes("Synthetic save failure"));
  assert.equal(await modal.locator('[data-report-source="0"]').inputValue(), "patientName");
  assert.equal(await modal.locator("[data-save-report-mapping]").isEnabled(), true);
  failSave = false;
  await modal.locator("[data-save-report-mapping]").click();
  await modal.waitFor({ state: "hidden" });
  assert.deepEqual(bindings, ["patientName", { literal: 'Synthetic Lab <branch> "A"' }]);
  assert.equal(await trigger.innerText(), "Edit mapping");
  assert.match(await panel.innerText(), /Mapping ready/);
  await trigger.click();
  await modal.locator("[data-report-source]").first().waitFor();
  assert.equal(await modal.locator('[data-report-source="0"]').inputValue(), "patientName");
  assert.equal(await modal.locator("[data-report-literal]").nth(1).inputValue(), 'Synthetic Lab <branch> "A"');
  await modal.locator('[data-report-source="1"]').selectOption("labName");
  assert.equal(await modal.locator("[data-report-literal]").nth(1).isDisabled(), true);
  await modal.locator("[data-save-report-mapping]").click();
  await modal.waitFor({ state: "hidden" });
  assert.deepEqual(bindings, ["patientName", "labName"]);
  await trigger.click();
  await modal.locator("[data-report-source]").first().waitFor();
  await page.keyboard.press("Escape");
  await modal.waitFor({ state: "hidden" });
  template.parameterCount = 0; bindings = [];
  await trigger.click();
  await page.waitForFunction(() => document.querySelector("[data-report-mapping-message]").textContent.includes("no placeholders"));
  assert.equal(await modal.locator("[data-report-mapping-form]").isVisible(), false);
  await modal.locator(".modal-close").click();
  failRead = true;
  await trigger.click();
  await page.waitForFunction(() => document.querySelector("[data-report-mapping-message]").textContent.includes("Synthetic read failure"));
  assert.equal(await modal.locator("[data-report-mapping-form]").isVisible(), false);
  await modal.locator(".modal-close").click();
  failList = true;
  await panel.locator("[data-refresh-integration]").click();
  await page.waitForFunction(() => document.querySelector("[data-integration-message]").textContent.includes("Synthetic template list failure"));
  assert.equal(await panel.locator("[data-refresh-integration]").isEnabled(), true);
  failList = false; emptyList = true;
  await panel.locator("[data-refresh-integration]").click();
  await page.waitForFunction(() => document.querySelector("[data-integration-templates]").textContent.includes("No eligible templates"));
  assert.equal(await panel.locator("[data-report-mapping]").count(), 0);
  emptyList = false;
  await panel.locator("[data-refresh-integration]").click();
  await trigger.waitFor();
  await page.evaluate(() => { setupState.user.role = "agent"; renderIntegrationTemplates(); });
  assert.equal(await trigger.count(), 0, "Agents must not see the mapping editor action");
  assert.equal(await panel.locator(".integration-template-row").count(), 2);
  await page.goto(`${origin}/customer#integration`);
  await page.reload();
  await page.waitForFunction(() => typeof setupState !== "undefined" && setupState.user);
  await trigger.waitFor();
  assert.equal(await page.locator("#integration").isVisible(), true, "Direct Integration links must work");
  assert.deepEqual(errors, []);
  console.log("Integration UI passed: separate card right of API Access, independent screen and navigation, direct links, eligible approved templates, save/reopen/edit, failure and empty states, role visibility and responsive layouts.");
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
