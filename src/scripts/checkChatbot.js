// Local browser verification; API traffic is simulated and no live account is used.
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000" });
const app = require("../app");
const automation = require("../services/automation.service");
const tenant = { id: "000000000000000000000001", businessName: "Test Shop", status: "active", meta: {}, billing: { plan: "monthly", status: "active", active: true, currentPeriodEnd: "2099-01-01T00:00:00Z" } };
const user = { id: "000000000000000000000002", tenantId: tenant.id, role: "owner", name: "Owner", email: "test@example.test", tenant };
const conversation = { id: "000000000000000000000999", customerName: "Test Customer", customerPhone: "919999999999", unreadCount: 0, lastMessageAt: new Date().toISOString(), windowOpen: true, windowExpiresAt: new Date(Date.now() + 3600000).toISOString(), automation: { status: "handoff", routeTo: "sales" } };
let server, browser;
async function run() {
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const origin = "http://127.0.0.1:" + server.address().port;
  const chrome = process.env.UI_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const context = await browser.newContext();
  const errors = [], actions = [], simulations = [];
  await context.route("**/*", async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/customer") return route.fulfill({ contentType: "text/html", body: fs.readFileSync(path.resolve("Public/customer-portal.html"), "utf8") });
    if (!url.pathname.startsWith("/api/")) return route.continue();
    let data = { success: true, contacts: [], templates: [], messages: [], groups: [], segments: [], media: [], conversations: [], flows: [], keys: [], totalUnread: 0, nextCursor: null };
    if (url.pathname === "/api/auth/session") data.authenticated = true;
    if (url.pathname === "/api/auth/me") data.user = user;
    if (url.pathname === "/api/billing") Object.assign(data, { billing: tenant.billing, plans: [], payments: [] });
    if (url.pathname === "/api/meta/onboarding") data.tenant = tenant;
    if (url.pathname === "/api/automations/simulate") {
      try { const body = request.postDataJSON(); simulations.push(body); Object.assign(data, await automation.simulateAutomation(tenant.id, body)); }
      catch (error) { return route.fulfill({ status: error.statusCode || 500, json: { message: error.message } }); }
    }
    if (url.pathname === "/api/automations/executions") data.executions = [{ conversationId: conversation.id, text: "<img src=x onerror=alert(1)>", status: "retry", action: "retry_scheduled", attempts: 1, error: "Temporary provider rejection", createdAt: new Date().toISOString() }];
    if (url.pathname === "/api/inbox/conversations") data.conversations = [conversation];
    if (url.pathname.includes("/conversations/") && url.pathname.endsWith("/messages")) { data.conversation = conversation; data.messages = []; }
    if (url.pathname.endsWith("/automation")) {
      const action = request.postDataJSON().action; actions.push(action);
      conversation.automation = { status: action === "release" ? "idle" : "handoff", routeTo: action === "release" ? "" : "human_agent" };
      data.conversation = conversation;
    }
    await route.fulfill({ json: data });
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin + "/customer#chatbot");
  await page.waitForFunction(() => setupState.user?.id);
  await page.locator("[data-chatbot-test-toggle]").click();
  await page.locator("[data-chatbot-test-run]").click();
  await page.waitForFunction(() => document.querySelectorAll(".chatbot-test-turn").length === 4);
  assert.match(await page.locator("[data-chatbot-test-results]").innerText(), /fallback/);
  assert.equal(simulations.length, 1);
  await page.locator("[data-chatbot-diagnostics]").click();
  await page.waitForFunction(() => document.querySelector("[data-chatbot-executions]").textContent.includes("Temporary provider rejection"));
  assert.equal(await page.locator("[data-chatbot-executions] img").count(), 0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    assert.ok(dimensions.content <= width + 1, "Chatbot panel overflows at " + width);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => {
    createChatbotNode("message");
    const message = getChatbotNode(chatbotState.selectedNodeId);
    message.message = "Welcome first"; message.nextNodeId = "menu_1";
    getChatbotNode("trigger").nextNodeId = message.id;
    renderChatbotBuilder();
  });
  assert.equal(await page.locator('[data-chatbot-field="nextNodeId"]').inputValue(), "menu_1");
  await page.locator("[data-chatbot-test-input]").fill("Hi");
  await page.locator("[data-chatbot-test-run]").click();
  await page.waitForFunction(() => document.querySelector("[data-chatbot-test-results]").textContent.includes("Welcome first"));
  assert.equal(await page.locator("[data-chatbot-test-results] p").count(), 2);
  await page.evaluate(() => { getChatbotNode(chatbotState.selectedNodeId).nextNodeId = chatbotState.selectedNodeId; });
  await page.locator("[data-chatbot-test-run]").click();
  await page.waitForFunction(() => document.querySelector("[data-chatbot-test-results]").textContent.includes("loop"));
  await page.locator("[data-chatbot-open-conversation]").click();
  await page.waitForFunction(() => document.querySelector("[data-inbox-automation-control]").textContent === "Release to chatbot");
  await page.locator("[data-inbox-automation-control]").click();
  await page.waitForFunction(() => document.querySelector("[data-inbox-automation-control]").textContent === "Take over");
  await page.locator("[data-inbox-automation-control]").click();
  await page.waitForFunction(() => document.querySelector("[data-inbox-automation-control]").textContent === "Release to chatbot");
  assert.deepEqual(actions, ["release", "takeover"]);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Inbox control overflows at " + width);
  }
  assert.deepEqual(errors, []);
  console.log("Chatbot browser checks passed: simulator, chain connections, invalid graph errors, escaped diagnostics, conversation navigation, takeover/release, desktop and mobile layouts.");
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
