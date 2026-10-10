// Local browser checks. All API/provider traffic is intercepted; no live account is used.
const fs = require("fs");
const path = require("path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const XLSX = require("xlsx");
Object.assign(process.env, { NODE_ENV: "test", REDIS_URL: "", CLIENT_ORIGIN: "http://localhost:5000" });
const app = require("../app");
const output = path.resolve(process.env.UI_CHECK_OUTPUT_DIR || "docs/review-2026-09-06/fixes");
fs.mkdirSync(output, { recursive: true });
const tenant = { id: "000000000000000000000001", businessName: "Test Shop", status: "active", onboardingStatus: "account_created", meta: {}, billing: { plan: "monthly", amount: 1000, currency: "INR", status: "active", active: true, currentPeriodEnd: "2027-01-01T00:00:00Z" } };
const user = { id: "000000000000000000000002", tenantId: tenant.id, name: "Test Owner", email: "test@example.test", role: "owner", tenant };
const contact = (index) => ({ _id: index.toString(16).padStart(24, "0"), name: "Customer " + index, phone: String(919900000000 + index), status: "active", optIn: { status: true }, tags: [] });
const conversation = { id: "000000000000000000000999", customerName: "Test Customer", customerPhone: "919999999999", unreadCount: 5, lastMessageAt: new Date().toISOString(), windowOpen: true, windowExpiresAt: new Date(Date.now() + 3600000).toISOString() };
const message = index => ({ id: index.toString(16).padStart(24, "0"), direction: "in", text: "Message " + index, sentAt: new Date(Date.now() - (206 - index) * 1000).toISOString() });
const results = [], errors = [], apiCalls = [];
let server, browser;
async function checkRecipientExcelRoundTrip(page) {
  await page.evaluate(() => showPortalView("send-whatsapp"));
  await page.locator('[data-send-template-select]').selectOption("csv_round_trip");
  for (const index of [1, 2]) {
    await page.locator(`[data-send-contact-choice][value="${contact(index)._id}"]`).check();
  }
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-download-variable-csv]').click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), "csv_round_trip_recipient_variables.csv");
  const downloadedCsv = fs.readFileSync(await download.path(), "utf8");
  assert.equal((await page.evaluate(text => parseCsvMatrix(text), downloadedCsv))[1][0], `="${contact(1).phone}"`);
  const workbook = XLSX.read(downloadedCsv, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  assert.equal(sheet.A2.v, contact(1).phone);
  assert.equal(sheet.A3.v, contact(2).phone);
  const upload = (name, buffer) => page.locator('[data-upload-variable-csv]').setInputFiles({ name, mimeType: /\.csv$/.test(name) ? "text/csv" : "application/octet-stream", buffer });
  await upload("unfilled.csv", Buffer.from(downloadedCsv));
  await page.waitForFunction(() => document.querySelector('[data-send-message-status]').textContent.includes("missing a variable value"));
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), false);

  const values = [["Priya, \"VIP\"\nSharma", "19.50"], ["Rahul; Mehta", "1,250"]];
  const expected = values.map((variables, index) => ({ phone: contact(index + 1).phone, variables }));
  values.forEach((variables, index) => {
    sheet[`B${index + 2}`] = { t: "s", v: variables[0] };
    sheet[`C${index + 2}`] = { t: "s", v: variables[1] };
  });
  for (const [name, separator, directive] of [
    ["excel-comma.csv", ",", ""],
    ["excel-regional.csv", ";", ""],
    ["excel-separator-directive.csv", ";", "sep=;\r\n"],
    ["excel-tabs.csv", "\t", ""],
    ["excel-mac.csv", ",", ""]
  ]) {
    const csv = XLSX.utils.sheet_to_csv(sheet, { FS: separator, RS: name === "excel-mac.csv" ? "\r" : "\r\n", forceQuotes: true });
    const buffer = Buffer.from("\uFEFF" + directive + csv);
    if (name === "excel-comma.csv") {
      const fileChooserPromise = page.waitForEvent("filechooser");
      await page.locator('[data-open-variable-file]').focus();
      await page.keyboard.press("Enter");
      await (await fileChooserPromise).setFiles({ name, mimeType: "text/csv", buffer });
    } else {
      await upload(name, buffer);
    }
    await page.waitForFunction(name => sendVariableDataState.fileName === name, name);
    assert.deepEqual(await page.evaluate(() => getRecipientVariableRows(true)), expected);
    assert.equal(await page.locator('[data-send-submit]').isEnabled(), true);
  }
  results.push({ check: "selected recipients CSV preserves phone text; Excel-saved comma/semicolon/tab/sep= CSVs and CR line endings upload with quoted variables intact; unfinished template values rejected", passed: true });

  for (const index of [1, 2]) {
    const phone = contact(index).phone;
    sheet[`A${index + 1}`] = { t: "s", v: `${phone[0]}.${phone.slice(1)}E+${phone.length - 1}` };
  }
  await upload("full-precision.csv", Buffer.from(XLSX.utils.sheet_to_csv(sheet)));
  await page.waitForFunction(() => sendVariableDataState.fileName === "full-precision.csv");
  assert.deepEqual(await page.evaluate(() => getRecipientVariableRows(true)), expected);
  for (const phone of ["12345678901", "123456789012345"]) {
    assert.equal(await page.evaluate(phone => normalizeRecipientFilePhone(`${phone[0]}.${phone.slice(1)}E+${phone.length - 1}`, "CSV", 2), phone), phone);
  }
  for (const [name, csv, message] of [
    ["rounded.csv", "Phone Number,Variable 1,Variable 2\r\n9.199E+11,Priya,19.50", "rounded scientific notation"],
    ["rounded-formula.csv", 'Phone Number,Variable 1,Variable 2\r\n"=""9.199E+11""",Priya,19.50', "rounded scientific notation"],
    ["duplicate.csv", "Phone Number,Variable 1,Variable 2\r\n919900000001,Priya,19.50\r\n919900000001,Rahul,25", "appears more than once"],
    ["missing.csv", "Phone Number,Variable 1,Variable 2\r\n919900000001,Priya,", "missing a variable value"],
    ["extra-column.csv", "Phone Number,Variable 1,Variable 2,Extra\r\n919900000001,Priya,19.50,test", "must have 3 columns"],
    ["bad-phone.csv", "Phone Number,Variable 1,Variable 2\r\n123,Priya,19.50", "invalid phone number"]
  ]) {
    await upload(name, Buffer.from(csv));
    await page.waitForFunction(message => document.querySelector('[data-send-message-status]').textContent.includes(message)
      && document.querySelector('[data-upload-variable-csv]').value === "", message);
    assert.deepEqual(await page.evaluate(() => getRecipientVariableRows(true)), expected, "Failed upload must not replace previously validated rows");
  }
  results.push({ check: "fully specified scientific phone numbers accepted without changing digits; rounded phones, duplicates, missing values and incorrect column counts rejected", passed: true });

  for (const index of [1, 2]) sheet[`A${index + 1}`] = { t: "n", v: Number(contact(index).phone), z: "0.00E+00" };
  sheet.C2 = { t: "n", v: 19.5, z: "0.00" };
  for (const [name, bookType] of [["excel-narrow-column.xlsx", "xlsx"], ["excel-narrow-column.xls", "biff8"]]) {
    await upload(name, XLSX.write(workbook, { type: "buffer", bookType }));
    await page.waitForFunction(name => sendVariableDataState.fileName === name, name);
    assert.deepEqual(await page.evaluate(() => getRecipientVariableRows(true)), expected);
  }
  assert.equal(await page.locator('[data-send-recipient-count]').innerText(), "2 recipients");
  assert.equal(await page.locator('[data-preview-contact]').innerText(), "Customer 1 +1");
  assert.match(await page.locator('[data-preview-message]').innerText(), /Priya, "VIP"\nSharma/);
  const variableReference = page.locator('.send-variable-format');
  assert.equal(await variableReference.getAttribute("open"), null);
  await variableReference.locator('summary').click();
  assert.match(await variableReference.locator('code').innerText(), /Phone Number,Variable 1/);
  assert.match(await variableReference.locator('.send-variable-guide-list').innerText(), /1,250/);
  await variableReference.locator('summary').click();
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Send WhatsApp overflow at " + width);
    const formBox = await page.locator('[data-send-message-form]').boundingBox();
    const previewBox = await page.locator('.whatsapp-phone-preview').boundingBox();
    if (width === 1440) assert.ok(previewBox.x >= formBox.x + formBox.width, "Desktop preview stays beside the form");
    else assert.ok(previewBox.y >= formBox.y + formBox.height, "Preview follows the form at " + width);
    await page.screenshot({ path: path.join(output, `send-whatsapp-${width}.png`), fullPage: true });
  }
  results.push({ check: "Send WhatsApp keeps the recipient picker and live preview, supports keyboard file selection and expandable variable guidance, and fits desktop/tablet/mobile layouts", passed: true });
  sheet.A2 = { t: "s", v: "9.199E+11" };
  await upload("already-rounded.xlsx", XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
  await page.waitForFunction(() => document.querySelector('[data-send-message-status]').textContent.includes("rounded scientific notation"));
  assert.deepEqual(await page.evaluate(() => getRecipientVariableRows(true)), expected);
  results.push({ check: "XLSX and XLS use stored numeric phone digits despite scientific display, preserve variable number formatting and reject already-rounded text phones", passed: true });
  await page.locator('[data-clear-variable-csv]').click();
  await page.locator('[data-send-clear-recipients]').click();
  await page.locator('[data-send-template-select]').selectOption("");
}
async function checkSendTemplateStates(page) {
  await page.evaluate(() => {
    setSendMessage("");
    renderApprovedTemplateOptions([]);
  });
  assert.equal(await page.locator('[data-send-template-select]').isEnabled(), false);
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), false);
  await page.evaluate(() => renderApprovedTemplateOptions([
    { name: "plain_notice", category: "utility", language: "en_US", parameterCount: 0, body: "Your order is ready." },
    { name: "document_notice", category: "utility", language: "hi", parameterCount: 0, body: "Your document is ready.", headerType: "document" }
  ]));
  await page.locator('[data-send-template-select]').selectOption("plain_notice");
  await page.locator(`[data-send-contact-choice][value="${contact(1)._id}"]`).check();
  assert.match(await page.locator('[data-send-variable-editor]').innerText(), /No recipient variable file required/);
  assert.equal(await page.locator('[data-send-media-field]').isVisible(), false);
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), true);
  assert.equal(await page.locator('[data-preview-message]').innerText(), "Your order is ready.");
  await page.locator('[data-send-template-select]').selectOption("document_notice");
  assert.equal(await page.locator('[data-send-language-select]').inputValue(), "hi");
  assert.equal(await page.locator('[data-send-media-field]').isVisible(), true);
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), false);
  await page.evaluate(() => {
    mediaState.assets = [{ mediaId: "test-pdf", title: "Order details", mediaType: "document", mimeType: "application/pdf", bytes: 100, url: "/fixture.pdf" }];
    renderSendMediaOptions();
  });
  await page.locator('[data-send-media-select]').selectOption("test-pdf");
  assert.equal(await page.locator('[data-preview-media] a').getAttribute("href"), "/fixture.pdf");
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), true);
  assert.deepEqual(await page.evaluate(() => Object.fromEntries(new FormData(sendMessageForm))), { templateName: "document_notice", language: "hi", mediaId: "test-pdf" });
  await page.locator('[data-send-clear-recipients]').click();
  await page.locator('[data-send-recipient-search]').fill("Customer 501");
  assert.equal(await page.locator('[data-send-contact-choice]').count(), 1);
  await page.locator('[data-send-select-all]').click();
  assert.deepEqual(await page.evaluate(() => [...sendRecipientState.contactIds]), [contact(501)._id]);
  assert.equal(await page.locator('[data-preview-contact]').innerText(), "Customer 501");
  await page.locator('[data-send-clear-recipients]').click();
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), false);
  await page.locator('[data-send-recipient-search]').fill("");
  await page.evaluate(() => {
    setupState.groups = [{ _id: "000000000000000000000321", name: "VIP customers", tag: "vip", memberCount: 2 }];
    renderSendGroupOptions(setupState.groups);
  });
  await page.locator('[data-send-group-choice]').check();
  assert.deepEqual(await page.evaluate(() => [...sendRecipientState.groupIds]), ["000000000000000000000321"]);
  assert.equal(await page.locator('[data-send-submit]').isEnabled(), true);
  await page.locator('[data-send-clear-recipients]').click();
  await page.evaluate(async () => {
    setupState.groups = [];
    mediaState.assets = [];
    renderSendGroupOptions(setupState.groups);
    await loadApprovedTemplates();
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.screenshot({ path: path.join(output, `send-whatsapp-empty-${width}.png`), fullPage: true });
  }
  results.push({ check: "Send WhatsApp preserves recipient search, filtered select-all, groups and clear; plain/media templates keep send readiness, language and form data correct", passed: true });
}
async function run() {
  server = await new Promise(resolve => { const instance = app.listen(0, "127.0.0.1", () => resolve(instance)); });
  const origin = "http://127.0.0.1:" + server.address().port;
  const chrome = process.env.UI_BROWSER_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
  browser = await chromium.launch({ headless: true, ...(fs.existsSync(chrome) ? { executablePath: chrome } : {}) });
  const context = await browser.newContext();
  let signedIn = false;
  let optOutsEmpty = false;
  let libraryFails = false;
  const libraryItems = [
    { id: 'library-order', name: 'order_delivery_update', category: 'utility', topic: 'ORDER_MANAGEMENT', usecase: 'DELIVERY_UPDATE', language: 'en_US', body: 'Hi {{1}}, your order {{2}} has shipped.\nTrack your delivery below.', bodyParams: ['Priya', 'ORD1024'], buttons: [{ type: 'URL', text: 'Track order' }] },
    { id: 'library-payment', name: 'payment_reminder', category: 'utility', topic: 'PAYMENTS', usecase: 'PAYMENT_REMINDER', language: 'en_US', body: 'Hi {{1}}, your payment of ₹{{2}} is due on {{3}}.', bodyParams: ['Rahul', '1,250', '15 October'], buttons: [{ type: 'QUICK_REPLY', text: 'Payment completed' }] },
    { id: 'library-code', name: 'verification_code', category: 'authentication', topic: 'ACCOUNT_UPDATE', usecase: 'VERIFICATION', language: 'en_US', body: '{{1}} is your verification code. Do not share it with anyone.', bodyParams: ['123456'], buttons: [{ type: 'COPY_CODE', text: 'Copy code' }] }
  ];
  let logoutFails = true, stopFails = false;
  const recipientTemplate = { name: "csv_round_trip", category: "utility", language: "en_US", status: "approved", body: "Hi {{1}}, your total is {{2}}.", parameterCount: 2, sampleValues: ["Priya", "1,250"] };
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
  const adminMutations = [];
  let adminFails = false;
  let billingFails = false, checkoutFails = false;
  let billingPayments = [];
  const billingPlans = [
    { id: "monthly", name: "Monthly", amount: 1500, currency: "INR", interval: "month", months: 1 },
    { id: "quarterly", name: "Quarterly", amount: 4000, currency: "INR", interval: "quarter", months: 3 },
    { id: "yearly", name: "Yearly", amount: 10000, currency: "INR", interval: "year", months: 12 }
  ];
  const selectedBillingPlans = [];
  const adminTenant = { ...tenant, _id: tenant.id, businessEmail: "shop@example.test", contactPerson: "Owner", whatsappNumber: "919999999999", trialUsed: 2, subscription: "paid", billing: { ...tenant.billing, accessSource: "payment" } };
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
    if (url.pathname === "/api/billing") {
      if (billingFails) return route.fulfill({ status: 503, json: { message: "Billing temporarily unavailable" } });
      Object.assign(data, { billing: tenant.billing, plans: billingPlans, ...(url.searchParams.get("summary") === "1" ? {} : { payments: billingPayments }) });
    }
    if (url.pathname === "/api/billing/select-plan") {
      const body = route.request().postDataJSON();
      selectedBillingPlans.push(body.plan);
      if (checkoutFails) return route.fulfill({ status: 503, json: { message: "Checkout temporarily unavailable" } });
      const plan = billingPlans.find(plan => plan.id === body.plan);
      Object.assign(data, { billing: tenant.billing, checkout: { key: "test_key", orderId: "order_mock", amount: plan.amount * 100, currency: plan.currency, name: "InterCon", description: plan.name + " plan" } });
    }
    if (url.pathname === "/api/messages/send-template" && tenant.billing.platformAccess === false) {
      return route.fulfill({ status: 402, json: { message: "Free allowance complete", details: { code: "INTERCON_PLAN_REQUIRED", trial: tenant.billing.trial } } });
    }
    if (url.pathname === "/api/meta/onboarding") data.tenant = tenant;
    if (url.pathname === "/api/templates/approved") data.templates = [recipientTemplate];
    if (url.pathname === "/api/messages/bulk-recipients") {
      const body = route.request().postDataJSON();
      assert.deepEqual(body.contactIds, [contact(1)._id, contact(2)._id]);
      assert.deepEqual(body.groupIds, []);
      data.contacts = [contact(1), contact(2)];
      data.eligibleCount = 2;
    }
    if (url.pathname === '/api/templates/library') {
      assert.equal(route.request().method(), 'GET', 'Browsing and previewing must not submit a template');
      if (libraryFails) return route.fulfill({ status: 503, json: { message: 'Template catalogue is temporarily unavailable' } });
      const search = (url.searchParams.get('search') || '').toLowerCase();
      data.items = libraryItems.filter(item => (!search || (item.name + ' ' + item.body).toLowerCase().includes(search)) && (!url.searchParams.get('topic') || item.topic === url.searchParams.get('topic')) && (!url.searchParams.get('language') || item.language === url.searchParams.get('language')));
      data.nextCursor = !search && !url.searchParams.get('topic') && !url.searchParams.get('language') ? 'library-next' : '';
      if (url.searchParams.get('after')) {
        assert.equal(url.searchParams.get('after'), 'library-next');
        data.items = [{ id: 'library-feedback', name: 'customer_feedback', category: 'utility', topic: 'CUSTOMER_FEEDBACK', language: 'en_GB', body: 'Hi {{1}}, how was your recent order?', bodyParams: ['Priya'], buttons: [{ type: 'QUICK_REPLY', text: 'Share feedback' }] }];
        data.nextCursor = '';
      }
    }
    if (url.pathname === "/api/contacts" && !url.searchParams.has("status")) {
      data.contacts = url.searchParams.has("after") ? [contact(501)] : Array.from({ length: 500 }, (_, index) => contact(index + 1));
      data.nextCursor = url.searchParams.has("after") ? null : contact(500)._id;
    }
    if (url.pathname === "/api/contacts" && url.searchParams.get("status") === "blocked") {
      data.contacts = [
        { ...contact(601), status: "blocked", suppression: { kind: "delivery_failure", reason: "WhatsApp could not deliver (131026). <script>alert('unsafe')</script>", recordedAt: "2026-10-10T10:00:00Z" } },
        { ...contact(602), status: "blocked", suppression: { kind: "customer_block", reason: "Customer confirmed blocking us", recordedAt: "2026-10-09T10:00:00Z" } }
      ];
    }
    if (url.pathname === "/api/contacts" && url.searchParams.get("status") === "opted_out") {
      data.contacts = optOutsEmpty ? [] : [
        { ...contact(604), name: "Priya Sharma", status: "opted_out", suppression: { kind: "opt_out", reason: "Customer asked to unsubscribe", recordedAt: "2026-10-10T09:00:00Z" } },
        { ...contact(605), name: "Rahul Mehta", status: "opted_out", suppression: { kind: "opt_out", reason: "No longer wishes to receive updates", recordedAt: "2026-10-09T09:00:00Z" } }
      ];
    }
    if (url.pathname === "/api/contacts/suppress") {
      const body = route.request().postDataJSON();
      assert.ok(["blocked", "opted_out"].includes(body.status));
      if (body.status === "blocked") assert.equal(body.kind, "customer_block");
      else assert.equal(body.reason, "Customer asked to unsubscribe");
      data.contact = { ...contact(603), status: body.status };
    }
    if (url.pathname === "/api/inbox/conversations") data.conversations = [conversation];
    if (url.pathname.endsWith("/messages") && url.pathname.includes("/conversations/")) {
      data.conversation = conversation;
      data.messages = url.searchParams.has("before") ? Array.from({ length: 5 }, (_, index) => message(index + 1)) : Array.from({ length: 200 }, (_, index) => message(index + 6));
      data.nextCursor = url.searchParams.has("before") ? null : message(6).id;
    }
    if (url.pathname.endsWith("/read")) data.conversation = { ...conversation, unreadCount: 0 };
    if (url.pathname === "/api/admin/me") data.user = { email: "admin@example.test", name: "Administrator", platformRole: "admin" };
    if (url.pathname === "/api/admin/overview") {
      if (adminFails) return route.fulfill({ status: 503, json: { message: "Business data temporarily unavailable" } });
      Object.assign(data, {
        counts: { tenants: 12, users: 20, paidTenants: 4, paidUsers: 7, manualTenants: 1, expiring: 2, suspendedTenants: 1, queued: 2, uncertain: 1, failedWebhooks: 1 },
        period: { from: url.searchParams.get("from"), to: url.searchParams.get("to") },
        revenue: { currencies: ["INR", "USD"], period: [{ currency: "INR", status: "captured", amount: 600000 }, { currency: "USD", status: "captured", amount: 7500 }], lifetime: [{ currency: "INR", status: "captured", amount: 2400000 }], mrr: [{ currency: "INR", amount: 500000 }], trend: [{ currency: "INR", month: new Date().toISOString().slice(0, 7), amount: 600000 }], note: "Manual plan access does not create revenue." },
        operations: { messages: { queued: 2 }, webhooks: { queued: 1, dead: 1 }, orders: { pending: 3 } },
        health: { database: "connected", redis: "not_configured", uptimeSeconds: 7500, memoryMB: 80 }, plans: [{ id: "monthly", name: "Monthly", amount: 1500, currency: "INR", months: 1 }], recentTenants: [adminTenant], recentPayments: [{ tenantId: { businessName: "Test Shop" }, amount: 150000, currency: "INR", status: "captured", capturedAt: new Date().toISOString(), plan: "monthly" }]
      });
    }
    if (url.pathname.startsWith("/api/admin/records/")) {
      const kind = url.pathname.split("/").at(-1);
      const records = {
        tenants: { records: [adminTenant], fields: ["businessName", "businessEmail", "status", "subscription", "billing.plan", "billing.currentPeriodEnd", "trialUsed"] },
        users: { records: [{ _id: "000000000000000000000003", name: "Support agent", email: "agent@example.test", workspace: "Test Shop", status: "active", role: "agent" }], fields: ["name", "email", "workspace", "role", "status"] },
        payments: { records: [{ _id: "000000000000000000000004", workspace: "Test Shop", amount: 150000, currency: "INR", status: "captured", plan: "monthly" }], fields: ["workspace", "plan", "amount", "currency", "status"] },
        webhooks: { records: [{ _id: "000000000000000000000005", workspace: "Test Shop", status: "dead", eventType: "messages", attempts: 8 }], fields: ["workspace", "status", "eventType", "attempts"] },
        audit: { records: [{ actorEmail: "admin@example.test", action: "workspace.suspend", reason: "Account abuse review", createdAt: new Date().toISOString() }], fields: ["actorEmail", "action", "reason", "createdAt"] }
      };
      Object.assign(data, records[kind] || { records: [], fields: ["status"] });
    }
    if (url.pathname === "/api/admin/tenants/" + tenant.id) Object.assign(data, { tenant: adminTenant, users: [{ _id: "000000000000000000000003", name: "Support agent", email: "agent@example.test", status: "active" }], payments: [], messages: { delivered: 12, failed: 1 }, contacts: { active: 20, opted_out: 2 }, templates: { approved: 3 }, audits: [], trial: { used: 2, reserved: 0, limit: 20 } });
    if (url.pathname.startsWith("/api/admin/") && url.pathname.endsWith("/actions")) {
      const body = route.request().postDataJSON();
      adminMutations.push({ path: url.pathname, body });
      assert.ok(body.reason.length >= 5);
      if (body.action === "suspend") adminTenant.status = "suspended";
      data.message = "Change saved.";
    }
    if (url.pathname.startsWith("/api/admin/export/")) return route.fulfill({ contentType: "text/csv", body: '\uFEFF"businessName","status"\r\n"Test Shop","active"\r\n' });
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
  await page.waitForFunction(() => document.querySelector('[data-auth-form="reset-password"] [data-form-message]').textContent === "Password successfully changed.");
  assert.equal(await page.locator('[data-auth-form="reset-password"]').isVisible(), true);
  assert.equal(await page.locator('[data-auth-form="reset-password"] [name="password"]').isVisible(), false);
  assert.equal(await page.locator('[data-auth-form="reset-password"] [name="confirm_password"]').isVisible(), false);
  assert.equal(await page.locator('[data-auth-form="reset-password"] [data-reset-password-submit]').isVisible(), false);
  assert.equal(await page.locator('[data-auth-form="reset-password"] h2').isVisible(), false);
  results.push({ check: "login keyboard focus stays inside dialog; recovery opens; reset completion shows success without password inputs; Escape closes", passed: true });
  signedIn = true;
  await page.goto(origin + "/customer#setup");
  await page.waitForFunction(() => setupState.user?.id);
  await page.evaluate(() => loadContacts());
  assert.equal(await page.evaluate(() => setupState.contacts.length), 501);
  assert.deepEqual(await page.evaluate(() => parseCsv('name,phone,city\n"Doe, Jane",919876543210,"New\nDelhi"')), [{ name: "Doe, Jane", phone: "919876543210", city: "New\nDelhi" }]);
  assert.equal(await page.evaluate(() => { try { parseCsv('name,phone\n"unfinished,919876543210'); return false; } catch { return true; } }), true);
  results.push({ check: "501 contacts available across pages; quoted CSV commas/newlines preserved; malformed CSV rejected", passed: true });
  await checkRecipientExcelRoundTrip(page);
  await checkSendTemplateStates(page);
  await page.evaluate(() => showPortalView("billing"));
  await page.waitForFunction(() => document.querySelector('[data-select-plan="monthly"]')?.textContent === "Renew plan");
  assert.equal(await page.locator('[data-select-plan="monthly"]').isEnabled(), true);
  assert.match(await page.locator("[data-billing-current-plan]").innerText(), /1,000/);
  assert.match(await page.locator(".billing-plan-card strong").first().innerText(), /1,500/);
  assert.equal(await page.evaluate(() => isInterconPlanActive({ plan: "monthly", status: "active" })), false);
  results.push({ check: "billing preserves the purchased price, shows the new renewal price, and rejects missing expiry", passed: true });
  assert.equal(await page.locator(".billing-plan-card").count(), 3);
  assert.match(await page.locator("[data-payment-history]").innerText(), /No completed payments yet/);
  billingPayments = [
    { plan: "monthly", amount: 150000, currency: "INR", status: "captured", capturedAt: "2026-10-01T12:00:00Z", providerPaymentId: '<img src=x onerror="window.paymentXss=true">' },
    { plan: "quarterly", amount: 400055, currency: "INR", status: "refunded", capturedAt: "2026-10-02T12:00:00Z", providerPaymentId: "pay_" + "reference".repeat(14) }
  ];
  await page.evaluate(() => loadBilling());
  assert.equal(await page.locator(".billing-history-table tbody tr").count(), 2);
  assert.match(await page.locator(".billing-history-table").innerText(), /1,500/);
  assert.match(await page.locator(".billing-history-table").innerText(), /4,000\.55/, "Payment amounts preserve minor currency units");
  assert.match(await page.locator(".billing-history-table").innerText(), /Refunded/, "Refunded payments keep their actual status");
  assert.equal(await page.locator("[data-payment-history] img").count(), 0, "Payment references are text, never markup");
  assert.equal(await page.locator("[data-payment-count]").innerText(), "2 recent payments");
  for (const width of [1440, 1024, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Plan comparison and payment history fit at " + width);
    await page.screenshot({ path: path.join(output, `billing-paid-${width}.png`), animations: "disabled" });
    if ([1440, 320].includes(width)) await page.locator(".billing-history").screenshot({ path: path.join(output, `billing-history-${width}.png`), animations: "disabled" });
  }
  billingFails = true;
  await page.locator("[data-billing-refresh]").click();
  await page.waitForFunction(() => !document.querySelector("[data-billing-history-error]").hidden);
  assert.equal(await page.locator(".billing-history-table tbody tr").count(), 2, "Failed refresh preserves previous payment records");
  billingFails = false;
  await page.locator("[data-billing-refresh]").click();
  await page.waitForFunction(() => !document.querySelector("[data-billing-refresh]").disabled && document.querySelector("[data-billing-history-error]").hidden);
  await page.evaluate(() => {
    window.Razorpay = class {
      constructor(options) { this.options = options; }
      on() {}
      open() { this.options.modal.ondismiss(); }
    };
  });
  await page.locator('[data-select-plan="monthly"]').click();
  await page.waitForFunction(() => document.querySelector("[data-billing-message]").textContent.includes("Payment was not completed"));
  assert.equal(await page.locator('[data-select-plan="monthly"]').isEnabled(), true);
  assert.equal(selectedBillingPlans.at(-1), "monthly");
  checkoutFails = true;
  await page.locator('[data-select-plan="quarterly"]').click();
  await page.waitForFunction(() => document.querySelector("[data-billing-message]").textContent.includes("Checkout temporarily unavailable"));
  assert.equal(selectedBillingPlans.at(-1), "quarterly");
  assert.equal(await page.locator('[data-select-plan="quarterly"]').isEnabled(), true);
  assert.equal(await page.evaluate(() => hasInterconPlatformAccess(setupState.billing)), true, "Checkout failure preserves existing paid access");
  checkoutFails = false;
  billingPayments = [];
  await page.evaluate(() => loadBilling());
  await page.evaluate(() => window.scrollTo(0, 0));
  results.push({ check: "three plan prices and current plan; responsive payment records and empty state; safe reference text; refresh failure preserves history and recovers; renewal cancellation and checkout failure preserve access", passed: true });
  await page.evaluate(() => showPortalView("contacts"));
  await page.goBack();
  await page.waitForFunction(() => !document.getElementById("billing").hidden);
  await page.evaluate(() => showPortalView("template-modal-title"));
  assert.equal(await page.locator("[data-portal-view]:visible").count(), 1);
  results.push({ check: "renewal enabled, browser Back restores view, invalid view ID cannot blank portal", passed: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ["setup", "send-whatsapp", "billing", "contacts", "blacklist", "optout", "template-library"]) {
      await page.evaluate(view => showPortalView(view), view);
      await page.waitForTimeout(100);
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      assert.ok(dimensions.content <= dimensions.viewport + 1, view + " overflows at " + width);
      results.push({ view, width, ...dimensions, passed: true });
    }
  }
  await page.evaluate(async () => { showPortalView("blacklist"); await loadSuppressionList("blocked"); });
  const blacklist = page.locator('[data-suppression-list="blocked"]');
  assert.equal(await blacklist.locator('.suppression-entry').count(), 2);
  assert.match(await blacklist.innerText(), /Possible block/);
  assert.match(await blacklist.innerText(), /Customer-reported/);
  assert.equal(await blacklist.locator('.suppression-date').count(), 2);
  assert.equal(await blacklist.locator('script').count(), 0, "Provider error text must be displayed safely");
  await blacklist.locator('button').first().click();
  await page.waitForFunction(() => !document.querySelector('[data-contact-edit-modal]').hidden);
  assert.equal(await page.locator('[data-contact-edit-phone]').inputValue(), String(919900000601));
  await page.evaluate(() => closeContactEditModal());
  assert.equal(await page.locator('[data-suppression-count="blocked"]').innerText(), '2');
  const blacklistForm = page.locator('[data-suppression-form="blocked"]');
  assert.equal(await blacklistForm.isVisible(), false);
  const addNumber = page.locator('[data-toggle-suppression="blocked"]');
  await addNumber.click();
  assert.equal(await addNumber.getAttribute('aria-expanded'), 'true');
  assert.equal(await blacklistForm.locator('[name="phone"]').evaluate(element => element === document.activeElement), true);
  await page.locator('[data-cancel-suppression="blocked"]').click();
  assert.equal(await blacklistForm.isVisible(), false);
  await addNumber.click();
  await blacklistForm.locator('[name="phone"]').fill("919876543210");
  await blacklistForm.locator('[name="reason"]').fill("Customer confirmed blocking us");
  await blacklistForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-suppression-status="blocked"]').textContent.includes('Saved.'));
  await page.waitForFunction(() => document.querySelector('[data-suppression-form="blocked"]').hidden);
  await page.locator('[data-refresh-suppression="blocked"]').click();
  await page.waitForFunction(() => !document.querySelector('[data-refresh-suppression="blocked"]').disabled);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(output, "blacklist-desktop.png"), fullPage: true });
  await addNumber.click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(output, "blacklist-add-desktop.png"), fullPage: true });
  await page.locator('[data-cancel-suppression="blocked"]').click();
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Blacklist mobile overflow');
    await page.screenshot({ path: path.join(output, 'blacklist-' + width + '.png'), fullPage: true });
    await addNumber.click();
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Blacklist form mobile overflow');
    await page.screenshot({ path: path.join(output, 'blacklist-add-' + width + '.png'), fullPage: true });
    await page.locator('[data-cancel-suppression="blocked"]').click();
  }
  await page.screenshot({ path: path.join(output, "blacklist-mobile.png"), fullPage: true });
  results.push({ check: "blacklist shows block types, date and safe error text; older contacts can be edited; customer-reported blocks save and refresh", passed: true });
  await page.evaluate(async () => { showPortalView("optout"); await loadSuppressionList("opted_out"); });
  const optOutList = page.locator('[data-suppression-list="opted_out"]');
  const optOutForm = page.locator('[data-suppression-form="opted_out"]');
  const addOptOut = page.locator('[data-toggle-suppression="opted_out"]');
  assert.equal(await optOutList.locator('.suppression-entry').count(), 2);
  assert.equal(await page.locator('[data-suppression-count="opted_out"]').innerText(), '2');
  assert.match(await optOutList.innerText(), /Opted out/);
  assert.equal(await optOutList.locator('[data-label="Status"]').count(), 2);
  assert.equal(await optOutForm.isVisible(), false);
  await optOutList.locator('button').first().click();
  await page.waitForFunction(() => !document.querySelector('[data-contact-edit-modal]').hidden);
  assert.equal(await page.locator('[data-contact-edit-phone]').inputValue(), String(919900000604));
  await page.evaluate(() => closeContactEditModal());
  await addOptOut.click();
  assert.equal(await optOutForm.locator('[name="phone"]').evaluate(element => element === document.activeElement), true);
  await page.locator('[data-cancel-suppression="opted_out"]').click();
  assert.equal(await optOutForm.isVisible(), false);
  assert.equal(await addOptOut.getAttribute('aria-expanded'), 'false');
  await addOptOut.click();
  await optOutForm.locator('[name="phone"]').fill("919876543210");
  await optOutForm.locator('[name="reason"]').fill("Customer asked to unsubscribe");
  await optOutForm.locator('button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('[data-suppression-form="opted_out"]').hidden);
  assert.match(await page.locator('[data-suppression-status="opted_out"]').innerText(), /Saved/);
  await page.locator('[data-refresh-suppression="opted_out"]').click();
  await page.waitForFunction(() => !document.querySelector('[data-refresh-suppression="opted_out"]').disabled);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Opt-out list overflow');
    await page.screenshot({ path: path.join(output, 'optout-' + width + '.png'), fullPage: true });
    await addOptOut.click();
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Opt-out form overflow');
    await page.screenshot({ path: path.join(output, 'optout-add-' + width + '.png'), fullPage: true });
    await page.locator('[data-cancel-suppression="opted_out"]').click();
  }
  optOutsEmpty = true;
  await page.evaluate(() => loadSuppressionList("opted_out"));
  assert.equal(await page.locator('[data-suppression-count="opted_out"]').innerText(), '0');
  assert.match(await optOutList.innerText(), /No opted-out contacts yet/);
  optOutsEmpty = false;
  results.push({ check: "opt-out list uses status labels and counts; editing, form focus, cancel, saving, refresh and empty state work on desktop and mobile", passed: true });
  await page.evaluate(() => showPortalView('template-library'));
  await page.waitForFunction(() => templateLibraryState.loaded && !templateLibraryState.loading);
  const library = page.locator('[data-template-library]');
  assert.equal(await library.locator('.lib-card').count(), 3);
  assert.match(await page.locator('[data-lib-results]').innerText(), /3 templates loaded/);
  assert.equal(await library.locator('.lib-var').count(), 6);
  assert.match(await library.innerText(), /Priya/);
  assert.match(await library.innerText(), /English \(US\)/);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(350);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Template library overflow');
    await page.screenshot({ path: path.join(output, 'template-library-' + width + '.png'), fullPage: true });
  }
  await page.locator('[data-lib-more]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 4);
  assert.equal(await library.locator('.lib-card').count(), 4);
  assert.equal(await page.locator('[data-lib-more]').isVisible(), false);
  await page.locator('[data-lib-topic-option="PAYMENTS"]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 1);
  assert.equal(await page.locator('[data-lib-topic-option="PAYMENTS"]').getAttribute('aria-pressed'), 'true');
  assert.match(await library.innerText(), /Payment reminder/);
  assert.ok(apiCalls.some(url => url.includes('/api/templates/library?topic=PAYMENTS')));
  await page.locator('[data-lib-clear]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 3);
  await page.locator('[data-lib-search]').fill('payment');
  await page.locator('[data-lib-search]').press('Enter');
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 1);
  assert.ok(apiCalls.some(url => url.includes('/api/templates/library?search=payment')));
  await page.locator('[data-lib-language]').selectOption('hi');
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 0);
  assert.match(await library.innerText(), /No library templates matched/);
  assert.equal(await page.locator('[data-lib-results]').innerText(), '0 templates');
  await page.locator('[data-lib-clear]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && templateLibraryState.items.length === 3);
  assert.equal(await page.locator('[data-lib-search]').inputValue(), '');
  assert.equal(await page.locator('[data-lib-language]').inputValue(), '');
  assert.equal(await page.locator('[data-lib-topic-option=""]').getAttribute('aria-pressed'), 'true');
  libraryFails = true;
  await page.locator('[data-lib-reload]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && document.querySelector('[data-lib-message]').classList.contains('error'));
  assert.match(await library.innerText(), /temporarily unavailable/);
  assert.equal(await page.locator('[data-lib-reload]').isEnabled(), true);
  libraryFails = false;
  await page.locator('[data-lib-reload]').click();
  await page.waitForFunction(() => !templateLibraryState.loading && document.querySelector('[data-lib-message]').textContent === '');
  await library.locator('[data-use-library-template]').first().click();
  await page.waitForFunction(() => !document.querySelector('[data-template-modal]').hidden);
  assert.equal(await page.locator('[data-template-name]').inputValue(), libraryItems[0].name);
  assert.equal(await page.locator('[data-template-body]').inputValue(), libraryItems[0].body);
  assert.match(await page.locator('[data-template-library-note]').innerText(), /Track order/);
  await page.evaluate(() => closeTemplateModal());
  await page.evaluate(() => showPortalView('template-library'));
  results.push({ check: 'template library is responsive; previews substitute variables; search, topic/language filters, reset, pagination, error recovery and editor prefilling work', passed: true });
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
  await page.evaluate(() => showPortalView("billing"));
  assert.equal(await page.locator("[data-trial-usage]").isVisible(), true, "Usage card appears on the plan page");
  assert.equal(await page.locator("[data-usage-used]").innerText(), "0");
  assert.equal(await page.locator("[data-usage-limit]").innerText(), "20");
  assert.equal(await page.locator("[data-usage-remaining]").innerText(), "20 remaining");
  assert.equal(await page.locator("[data-usage-pending]").isVisible(), false);
  for (const view of ["home", "setup", "send-whatsapp", "inbox", "chatbot", "reports", "payments", "api"]) {
    await page.evaluate(view => showPortalView(view), view);
    assert.equal(await page.locator("[data-trial-usage]").isVisible(), false, "Usage card is hidden in " + view);
  }
  const billingCallsBeforeAction = apiCalls.filter(url => url.startsWith("/api/billing")).length;
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setSendMessage)), true);
  assert.equal(apiCalls.filter(url => url.startsWith("/api/billing")).length, billingCallsBeforeAction, "Allowed actions avoid a billing preflight request");
  await page.evaluate(() => { document.querySelector("[data-payment-history]").textContent = "Saved payment history"; });
  await page.evaluate(() => loadBilling({ summary: true }));
  assert.equal(await page.locator("[data-payment-history]").textContent(), "Saved payment history", "Usage refresh must preserve payment history");
  tenant.billing.trial = { limit: 20, used: 8, remaining: 12, reserved: 3, active: true };
  await page.evaluate(() => loadBilling());
  await page.evaluate(() => showPortalView("billing"));
  assert.equal(await page.locator("[data-usage-progress]").getAttribute("aria-valuenow"), "8", "Pending sends do not count as used");
  assert.equal(await page.locator("[data-usage-remaining]").innerText(), "12 remaining", "Remaining follows the server's confirmed recipient allowance");
  assert.match(await page.locator("[data-usage-pending]").innerText(), /3 recipient sends awaiting confirmation/);
  for (const width of [1440, 1024, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector("[data-trial-usage]").scrollWidth <= document.querySelector("[data-trial-usage]").clientWidth + 1), "Recipient usage fits at " + width);
    assert.equal(await page.locator("[data-usage-plan]").isVisible(), true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `recipient-usage-${width}.png`), animations: "disabled" });
  }
  await page.locator("[data-usage-plan]").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.activeElement?.hasAttribute("data-select-plan"));
  tenant.billing.trial = { limit: 20, used: 19, remaining: 1, reserved: 0, active: true };
  await page.evaluate(() => loadBilling());
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setTemplateMessage)), true);
  assert.equal(await page.locator("[data-usage-used]").innerText(), "19");
  assert.equal(await page.locator("[data-trial-usage]").getAttribute("data-usage-state"), "low");
  assert.equal(await page.locator("[data-usage-pending]").isVisible(), false, "Completed reservations disappear after refresh");
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
  assert.equal(await page.locator("[data-trial-usage]").getAttribute("data-usage-state"), "complete");
  assert.equal(await page.locator("[data-usage-plan]").innerText(), "Activate plan");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, "recipient-usage-complete-mobile.png"), animations: "disabled" });
  await page.reload();
  await page.waitForFunction(() => setupState.billing.trial?.used === 20);
  assert.equal(await page.evaluate(() => hasInterconPlatformAccess(setupState.billing)), false);
  tenant.billing = paidBilling;
  await page.evaluate(() => loadBilling());
  assert.equal(await page.evaluate(() => requirePlatformAccessBeforeAction(setSendMessage)), true);
  assert.equal(await page.locator("[data-trial-usage]").isVisible(), false);
  results.push({ check: "recipient usage visible only on plan page and fits desktop/mobile; pending sends separate; keyboard plan link; 0/20 and 19/20 allow actions; 20/20 prompts payment across reload; paid access hides card", passed: true });
  await page.goto(origin + "/admin");
  await page.waitForFunction(() => document.querySelector("[data-admin-records]")?.textContent.includes("Test Shop"));
  await page.waitForFunction(() => document.querySelector("[data-admin-stats]")?.textContent.includes("20"));
  assert.equal(await page.locator("[data-admin-identity]").innerText(), "admin@example.test");
  assert.match(await page.locator("[data-admin-revenue]").innerText(), /6,000/);
  await page.screenshot({ path: path.join(output, "admin-mobile.png") });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Admin mobile overflow");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(output, "admin-desktop.png") });
  await page.locator("[data-admin-currency]").selectOption("USD");
  assert.match(await page.locator("[data-admin-revenue]").innerText(), /75/);
  await page.locator("[data-admin-currency]").selectOption("INR");
  await page.locator('.admin-nav [data-records="tenants"][data-segment="paid"]').click();
  await page.waitForFunction(() => document.querySelector("[data-admin-records]").getAttribute("aria-busy") === "false");
  assert.equal(await page.locator('[data-admin-filters] [name="segment"]').inputValue(), "paid");
  assert.ok(apiCalls.some(url => url.includes("/api/admin/records/tenants?") && url.includes("segment=paid")));
  await page.locator('[data-admin-records] [data-open-tenant]').first().click();
  await page.waitForFunction(() => document.querySelector("[data-admin-detail-body]").textContent.includes("Suspend workspace"));
  await page.screenshot({ path: path.join(output, "admin-workspace-detail.png") });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('[data-admin-detail]').scrollWidth <= document.querySelector('[data-admin-detail]').clientWidth + 1), "Admin workspace dialog fits mobile");
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('[data-admin-detail] [data-action="suspend"]').click();
  assert.equal(await page.locator("[data-admin-action-dialog]").isVisible(), true);
  await page.locator('[data-admin-action-form] [name="reason"]').fill("Account abuse review");
  await page.locator("[data-admin-confirm]").click();
  await page.waitForFunction(() => !document.querySelector("[data-admin-action-dialog]").open && document.querySelector("[data-admin-detail-body]").textContent.includes("Reactivate workspace"));
  assert.equal(adminMutations[0].body.action, "suspend");
  await page.locator('[data-admin-detail] [data-action="grant-plan"]').click();
  assert.equal(await page.locator("[data-admin-grant-fields]").isVisible(), true);
  assert.match(await page.locator("[data-admin-action-description]").innerText(), /does not charge/);
  await page.keyboard.press("Escape");
  await page.locator("[data-close-detail]").click();
  await page.locator('.admin-nav [data-records="users"]').click();
  await page.locator('[data-admin-records] [data-action="disable"]').click();
  await page.locator('[data-admin-action-form] [name="reason"]').fill("Access review completed");
  await page.locator("[data-admin-confirm]").click();
  await page.waitForFunction(() => !document.querySelector("[data-admin-action-dialog]").open);
  assert.equal(adminMutations[1].body.action, "disable");
  const exportDownload = page.waitForEvent("download");
  await page.locator("[data-admin-export]").click();
  assert.equal((await exportDownload).suggestedFilename(), "intercon-users.csv");
  await page.locator('.admin-nav [data-records="webhooks"]').click();
  await page.locator('[data-admin-records] [data-action="retry"]').click();
  await page.locator('[data-admin-action-form] [name="reason"]').fill("Temporary issue resolved");
  await page.locator("[data-admin-confirm]").click();
  await page.waitForFunction(() => !document.querySelector("[data-admin-action-dialog]").open);
  assert.equal(adminMutations[2].body.action, "retry");
  await page.locator('.admin-nav [data-admin-view="health"]').click();
  assert.match(await page.locator("[data-admin-health]").innerText(), /Connected/);
  await page.locator('.admin-nav [data-records="audit"]').click();
  await page.waitForFunction(() => document.querySelector("[data-admin-records]").textContent.includes("Account abuse review"));
  await page.locator('.admin-nav [data-admin-view="overview"]').click();
  adminFails = true;
  await page.locator("[data-admin-dates] button").click();
  await page.waitForFunction(() => document.querySelector("[data-admin-status]").textContent.includes("temporarily unavailable"));
  adminFails = false;
  await page.locator("[data-admin-dates] button").click();
  await page.waitForFunction(() => document.querySelector("[data-admin-status]").textContent === "");
  results.push({ check: "admin revenue/currency views, paid filters, workspace controls, reasoned user disable, webhook retry, CSV export, health, audit and error recovery", passed: true });
  assert.deepEqual(errors, []);
  results.push({ check: "admin renders API records; no uncaught browser exceptions", passed: true });
  fs.writeFileSync(path.join(output, "ui-checks.json"), JSON.stringify({ results, errors, apiCalls, limitations: "Mocked APIs; Chrome only; no live providers or production data." }, null, 2));
  console.log("UI checks passed:", results.length);
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
