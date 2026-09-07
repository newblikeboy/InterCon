// Local browser checks. All API/provider traffic is intercepted; no live account is used.
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000" });
const app = require("../app");
const output = path.resolve("docs/review-2026-09-06/fixes");
fs.mkdirSync(output, { recursive: true });
const tenant = { id: "000000000000000000000001", businessName: "Test Shop", status: "active", onboardingStatus: "account_created", meta: {}, billing: { plan: "monthly", status: "active", active: true, currentPeriodEnd: "2027-01-01T00:00:00Z" } };
const user = { id: "000000000000000000000002", tenantId: tenant.id, name: "Test Owner", email: "test@example.test", role: "owner", tenant };
const contact = (index) => ({ _id: index.toString(16).padStart(24, "0"), name: "Customer " + index, phone: String(919900000000 + index), status: "active", optIn: { status: true }, tags: [] });
const conversation = { id: "000000000000000000000999", customerName: "Test Customer", customerPhone: "919999999999", unreadCount: 5, lastMessageAt: new Date().toISOString(), windowOpen: true, windowExpiresAt: new Date(Date.now() + 3600000).toISOString() };
const message = index => ({ id: index.toString(16).padStart(24, "0"), direction: "in", text: "Message " + index, sentAt: new Date(Date.now() - (206 - index) * 1000).toISOString() });
const results = [], errors = [], apiCalls = [];
let server, browser;
async function run() {
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const origin = "http://127.0.0.1:" + server.address().port;
  const chrome = process.env.UI_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const context = await browser.newContext();
  let signedIn = false;
  let logoutFails = true, stopFails = false;
  const liveFlow = {
    _id: "000000000000000000000123", name: "Live welcome bot", status: "active",
    triggerType: "keyword", triggerValue: "hi", firstReply: "Welcome back!",
    nodes: [
      { id: "trigger", type: "trigger", keyword: "hi", position: { x: 40, y: 40 } },
      { id: "reply", type: "message", title: "Welcome reply", message: "Welcome back!", position: { x: 350, y: 40 } }
    ]
  };
  const flows = [{ ...liveFlow, _id: "000000000000000000000124", name: "Newer draft", status: "draft" }, liveFlow];
  const automationMutations = [];
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/admin") return route.fulfill({ contentType: "text/html", body: fs.readFileSync(path.resolve("src/views/admin-portal.html"), "utf8") });
    if (!url.pathname.startsWith("/api/")) return route.continue();
    apiCalls.push(url.pathname + url.search);
    let data = { success: true, contacts: [], templates: [], messages: [], groups: [], segments: [], media: [], conversations: [], keys: [], totalUnread: 0, nextCursor: null };
    if (url.pathname === "/api/auth/session") data.authenticated = signedIn;
    if (url.pathname === "/api/auth/me") {
      if (!signedIn) return route.fulfill({ status: 401, json: { message: "Authentication required" } });
      data.user = user;
    }
    if (url.pathname === "/api/auth/reset-password") data.message = "Password changed. Please log in with your new password.";
    if (url.pathname === "/api/auth/login") { signedIn = true; data.user = user; }
    if (url.pathname === "/api/auth/logout") {
      if (logoutFails) return route.fulfill({ status: 503, json: { message: "Temporary server failure" } });
      signedIn = false;
    }
    if (url.pathname.startsWith("/api/automations")) {
      const method = route.request().method();
      if (method === "GET") data.flows = flows;
      else {
        const body = route.request().postDataJSON();
        automationMutations.push({ method, path: url.pathname, body });
        if (stopFails && body.status === "paused") return route.fulfill({ status: 503, json: { message: "Could not stop chatbot" } });
        assert.ok(url.pathname.startsWith("/api/automations/" + liveFlow._id), "Must update the restored bot, not create a duplicate");
        Object.assign(liveFlow, body);
        data.flow = liveFlow;
      }
    }
    if (url.pathname === "/api/billing") Object.assign(data, { billing: tenant.billing, plans: [{ id: "monthly", name: "Monthly", amount: 1000, currency: "INR", interval: "month" }], ...(url.searchParams.get("summary") === "1" ? {} : { payments: [] }) });
    if (url.pathname === "/api/messages/send-template" && tenant.billing.platformAccess === false) {
      return route.fulfill({ status: 402, json: { message: "Free allowance complete", details: { code: "INTERCON_PLAN_REQUIRED", trial: tenant.billing.trial } } });
    }
    if (url.pathname === "/api/meta/onboarding") data.tenant = tenant;
    if (url.pathname === "/api/contacts" && !url.searchParams.has("status")) {
      data.contacts = url.searchParams.has("after") ? [contact(501)] : Array.from({ length: 500 }, (_, index) => contact(index + 1));
      data.nextCursor = url.searchParams.has("after") ? null : contact(500)._id;
    }
    if (url.pathname === "/api/inbox/conversations") data.conversations = [conversation];
    if (url.pathname.endsWith("/messages") && url.pathname.includes("/conversations/")) {
      data.conversation = conversation;
      data.messages = url.searchParams.has("before") ? Array.from({ length: 5 }, (_, index) => message(index + 1)) : Array.from({ length: 200 }, (_, index) => message(index + 6));
      data.nextCursor = url.searchParams.has("before") ? null : message(6).id;
    }
    if (url.pathname.endsWith("/read")) data.conversation = { ...conversation, unreadCount: 0 };
    if (url.pathname === "/api/admin/overview") data.counts = { tenants: 1, queued: 0, uncertain: 0, failedWebhooks: 0, payments: 0 };
    if (url.pathname.startsWith("/api/admin/records/")) Object.assign(data, { records: [{ businessName: "Test Shop", status: "active" }], fields: ["businessName", "status"] });
    await route.fulfill({ json: data });
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin);
  await page.evaluate(() => openAuth("login"));
  await page.waitForTimeout(100);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.querySelector("[data-auth-modal]").contains(document.activeElement)), true);
  }
  await page.locator('[data-auth-form="login"] [data-open-auth="forgot-password"]').click();
  assert.equal(await page.locator('[data-auth-form="forgot-password"]').isVisible(), true);
  await page.screenshot({ path: path.join(output, "password-recovery-mobile.png") });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("[data-auth-modal]").isVisible(), false);
  await page.evaluate(() => { passwordResetToken = "test-reset-token"; openAuth("reset-password"); });
  await page.locator('[data-auth-form="reset-password"] [name="password"]').fill("NewPassword123!");
  await page.locator('[data-auth-form="reset-password"] [name="confirm_password"]').fill("NewPassword123!");
  await page.locator('[data-auth-form="reset-password"] button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-auth-form="login"]').classList.contains("active"));
  assert.equal(await page.locator('[data-auth-form="reset-password"]').isVisible(), false);
  assert.match(await page.locator('[data-auth-form="login"] [data-form-message]').innerText(), /Password changed/);
  results.push({ check: "login keyboard focus stays inside dialog; recovery opens; reset completion returns to login; Escape closes", passed: true });
  signedIn = true;
  await page.goto(origin + "/customer#setup");
  await page.waitForFunction(() => setupState.user?.id);
  await page.evaluate(() => loadContacts());
  assert.equal(await page.evaluate(() => setupState.contacts.length), 501);
  assert.deepEqual(await page.evaluate(() => parseCsv('name,phone,city\n"Doe, Jane",919876543210,"New\nDelhi"')), [{ name: "Doe, Jane", phone: "919876543210", city: "New\nDelhi" }]);
  assert.equal(await page.evaluate(() => { try { parseCsv('name,phone\n"unfinished,919876543210'); return false; } catch { return true; } }), true);
  results.push({ check: "501 contacts available across pages; quoted CSV commas/newlines preserved; malformed CSV rejected", passed: true });
  await page.evaluate(() => showPortalView("billing"));
  await page.waitForFunction(() => document.querySelector("[data-select-plan]")?.textContent === "Renew plan");
  assert.equal(await page.locator("[data-select-plan]").isEnabled(), true);
  await page.evaluate(() => showPortalView("contacts"));
  await page.goBack();
  await page.waitForFunction(() => !document.getElementById("billing").hidden);
  await page.evaluate(() => showPortalView("template-modal-title"));
  assert.equal(await page.locator("[data-portal-view]:visible").count(), 1);
  results.push({ check: "renewal enabled, browser Back restores view, invalid view ID cannot blank portal", passed: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ["setup", "send-whatsapp", "billing", "contacts", "blacklist", "optout"]) {
      await page.evaluate(view => showPortalView(view), view);
      await page.waitForTimeout(100);
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      assert.ok(dimensions.content <= dimensions.viewport + 1, view + " overflows at " + width);
      results.push({ view, width, ...dimensions, passed: true });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(async () => { showPortalView("inbox"); await loadInboxConversations(); await openInboxConversation("000000000000000000000999"); });
  assert.ok((await page.locator("[data-inbox-messages]").innerText()).includes("Message 205"));
  await page.locator("[data-inbox-older]").click();
  await page.waitForFunction(() => inboxState.messages.length === 205);
  assert.equal(await page.locator("[data-inbox-older]").isVisible(), false);
  await page.screenshot({ path: path.join(output, "inbox-mobile.png") });
  await page.evaluate(async () => { inboxMessagesEl.scrollTop = 0; await refreshActiveConversation(); });
  assert.equal(await page.evaluate(() => inboxMessagesEl.scrollTop), 0);
  results.push({ check: "inbox displays latest message, loads older history, and preserves reading position", passed: true });
  let logoutWarning = "";
  page.on("dialog", async dialog => { logoutWarning = dialog.message(); await dialog.accept(); });
  await page.evaluate(() => document.querySelector("[data-logout]").click());
  await page.waitForFunction(() => !document.querySelector("[data-logout]").disabled);
  assert.ok(logoutWarning.includes("still signed in"));
  assert.ok(page.url().includes("/customer"));
  results.push({ check: "failed logout retains the session and displays an error", passed: true });
  await page.evaluate(() => showPortalView("chatbot"));
  await page.waitForFunction(() => chatbotState.currentId === "000000000000000000000123");
  assert.equal(await page.locator("[data-chatbot-status]").innerText(), "Live");
  assert.equal(await page.locator("[data-chatbot-stop]").isVisible(), true);
  assert.equal(await page.locator("[data-chatbot-edit]").isVisible(), true);
  assert.equal(await page.locator("[data-chatbot-launch]").isVisible(), false);
  logoutFails = false;
  await page.evaluate(() => document.querySelector("[data-logout]").click());
  await page.waitForURL(origin + "/");
  await page.evaluate(() => openAuth("login"));
  await page.locator('[data-auth-form="login"] [name="login_id"]').fill("test@example.test");
  await page.locator('[data-auth-form="login"] [name="password"]').fill("TestPassword123!");
  await page.locator('[data-auth-form="login"] button[type="submit"]').click();
  await page.waitForURL(origin + "/customer");
  await page.waitForFunction(() => setupState.user?.id);
  await page.evaluate(() => showPortalView("chatbot"));
  await page.waitForFunction(() => chatbotState.currentId === "000000000000000000000123");
  assert.equal(await page.locator("[data-chatbot-name]").inputValue(), "Live welcome bot");
  assert.equal(await page.locator("[data-chatbot-status]").innerText(), "Live");
  await page.locator("[data-chatbot-edit]").click();
  await page.locator('[data-chatbot-field="message"]').fill("Updated welcome!");
  await page.locator("[data-chatbot-refresh]").click();
  assert.equal(await page.locator('[data-chatbot-field="message"]').inputValue(), "Updated welcome!");
  await page.locator("[data-chatbot-save]").click();
  await page.waitForFunction(() => !document.querySelector("[data-chatbot-save]").disabled);
  assert.equal(liveFlow.firstReply, "Updated welcome!");
  assert.equal(liveFlow.status, "active");
  stopFails = true;
  await page.locator("[data-chatbot-stop]").click();
  await page.waitForFunction(() => document.querySelector("[data-chatbot-message]").textContent === "Could not stop chatbot");
  assert.equal(await page.locator("[data-chatbot-status]").innerText(), "Live");
  stopFails = false;
  await page.locator("[data-chatbot-stop]").click();
  await page.waitForFunction(() => chatbotState.status === "paused");
  assert.equal(liveFlow.status, "paused");
  assert.equal(await page.locator("[data-chatbot-stop]").isVisible(), false);
  assert.equal(await page.locator("[data-chatbot-launch-label]").textContent(), "Resume");
  await page.locator("[data-chatbot-launch]").click();
  await page.waitForFunction(() => chatbotState.status === "active" && !document.querySelector("[data-chatbot-launch]").disabled);
  assert.equal(liveFlow.status, "active");
  assert.ok(automationMutations.every(call => call.method !== "POST"));
  await page.reload();
  await page.waitForFunction(() => chatbotState.currentId === "000000000000000000000123");
  assert.equal(await page.locator("[data-chatbot-status]").innerText(), "Live");
  await page.locator("[data-chatbot-new]").click();
  await page.locator("[data-chatbot-name]").fill("Unsaved flow");
  await page.evaluate(() => loadChatbotFlows());
  assert.equal(await page.evaluate(() => chatbotState.currentId), null);
  assert.equal(await page.locator("[data-chatbot-name]").inputValue(), "Unsaved flow");
  await page.locator('[data-chatbot-load-flow="000000000000000000000123"]').click();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Chatbot overflows at " + width);
    assert.equal(await page.locator("[data-chatbot-stop]").isVisible(), true);
    assert.equal(await page.locator("[data-chatbot-edit]").isVisible(), true);
  }
  results.push({ check: "live chatbot survives logout/login and reload; editing updates same flow; stop failure keeps Live; stop/resume persists; refresh preserves drafts; mobile controls fit", passed: true });
  const paidBilling = tenant.billing;
  tenant.billing = { plan: "none", status: "not_started", active: false, platformAccess: true, trial: { limit: 20, used: 0, remaining: 20, reserved: 0, active: true } };
  await page.evaluate(() => loadBilling());
  assert.match(await page.locator("[data-trial-usage]").innerText(), /0 of 20 unique WhatsApp recipients/);
  const billingCallsBeforeAction = apiCalls.filter(url => url.startsWith("/api/billing")).length;
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setSendMessage)), true);
  assert.equal(apiCalls.filter(url => url.startsWith("/api/billing")).length, billingCallsBeforeAction, "Allowed actions avoid a billing preflight request");
  await page.evaluate(() => { document.querySelector("[data-payment-history]").textContent = "Saved payment history"; });
  await page.evaluate(() => loadBilling({ summary: true }));
  assert.equal(await page.locator("[data-payment-history]").textContent(), "Saved payment history", "Usage refresh must preserve payment history");
  tenant.billing.trial = { limit: 20, used: 19, remaining: 1, reserved: 0, active: true };
  await page.evaluate(() => loadBilling());
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setTemplateMessage)), true);
  assert.match(await page.locator("[data-trial-usage]").innerText(), /19 of 20/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Trial banner fits mobile");
  tenant.billing.trial = { limit: 20, used: 20, remaining: 0, reserved: 0, active: false };
  tenant.billing.platformAccess = false;
  assert.equal(await page.evaluate(async () => {
    try { await requestJson("/api/messages/send-template", { method: "POST", body: "{}" }); return false; }
    catch (error) { return error.details?.code === "INTERCON_PLAN_REQUIRED" && !hasInterconPlatformAccess(setupState.billing); }
  }), true, "Server rejection refreshes stale local allowance");
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setSendMessage)), false);
  await page.waitForFunction(() => !document.getElementById("billing").hidden);
  assert.match(await page.locator("[data-billing-message]").innerText(), /Free allowance complete/);
  await page.reload();
  await page.waitForFunction(() => setupState.billing.trial?.used === 20);
  assert.equal(await page.evaluate(() => hasInterconPlatformAccess(setupState.billing)), false);
  tenant.billing = paidBilling;
  await page.evaluate(() => loadBilling());
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setSendMessage)), true);
  assert.equal(await page.locator("[data-trial-usage]").isVisible(), false);
  results.push({ check: "free usage shown at 0/20 and 19/20; actions allowed before limit; 20/20 prompts payment across reload; paid access restored", passed: true });
  await page.goto(origin + "/admin");
  await page.waitForFunction(() => document.querySelector("[data-admin-records]")?.textContent.includes("Test Shop"));
  await page.screenshot({ path: path.join(output, "admin-mobile.png") });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Admin mobile overflow");
  }
  assert.deepEqual(errors, []);
  results.push({ check: "admin renders API records; no uncaught browser exceptions", passed: true });
  fs.writeFileSync(path.join(output, "ui-checks.json"), JSON.stringify({ results, errors, apiCalls, limitations: "Mocked APIs; Chrome only; no live providers or production data." }, null, 2));
  console.log("UI checks passed:", results.length);
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
