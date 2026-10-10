(() => {
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const state = { view: "overview", kind: "tenants", cursor: null, rows: [], fields: [], version: 0, overviewVersion: 0, overview: null, user: null, currency: "INR", detailId: null, action: null, period: null };
  const titles = { tenants: "Workspaces", users: "Users", payments: "Payments & revenue", orders: "Checkout attempts", messages: "Message delivery", templates: "Templates", webhooks: "Webhook queue", audit: "Activity & audit" };
  const statuses = { tenants: ["active", "suspended"], users: ["active", "disabled"], payments: ["captured", "refunded", "disputed"], orders: ["creating", "pending", "paid"], messages: ["queued", "scheduled", "processing", "accepted", "sent", "delivered", "read", "failed", "uncertain", "cancelled"], templates: ["draft", "pending", "approved", "rejected"], webhooks: ["queued", "processing", "retry", "processed", "dead"], audit: [] };
  const labels = { businessName: "Business", businessEmail: "Email", status: "Status", subscription: "Access", "billing.plan": "Plan", "billing.currentPeriodEnd": "Plan expires", trialUsed: "Free recipients used", "meta.phoneNumberId": "WhatsApp phone ID", name: "Name", email: "Email", workspace: "Workspace", role: "Role", isVerified: "Verified", lastLoginAt: "Last login", createdAt: "Created", updatedAt: "Updated", plan: "Plan", amount: "Amount", currency: "Currency", providerPaymentId: "Payment reference", providerOrderId: "Order reference", capturedAt: "Captured", to: "Recipient", templateName: "Template", attempts: "Attempts", error: "Error", language: "Language", category: "Category", eventType: "Event", actorEmail: "Administrator", action: "Action", targetType: "Record type", reason: "Reason" };
  const human = value => String(value || "").replace(/[_-]/g, " ").replace(/^./, character => character.toUpperCase());
  const at = (row, path) => path.split(".").reduce((value, key) => value?.[key], row);
  function date(value, time = false) {
    if (!value) return "—";
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return "—";
    return parsed.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", ...(time ? { hour: "numeric", minute: "2-digit" } : {}) });
  }
  function money(value, currency = state.currency) {
    try {
      const formatter = new Intl.NumberFormat("en-IN", { style: "currency", currency });
      return formatter.format((Number(value) || 0) / (10 ** formatter.resolvedOptions().maximumFractionDigits));
    } catch { return `${currency} ${(Number(value) / 100 || 0).toFixed(2)}`; }
  }
  const badge = value => `<span class="badge ${escape(value)}">${escape(human(value) || "Unknown")}</span>`;
  function status(message, error = false) { $("[data-admin-status]").textContent = message; $("[data-admin-status]").classList.toggle("error", error); }
  async function request(path, options = {}) {
    const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
    const data = await response.json();
    if (response.status === 401) window.location.replace("/admin/login");
    if (!response.ok) throw new Error(data.message || "The request failed");
    return data;
  }
  function filterParams() {
    const parameters = new URLSearchParams();
    for (const [key, value] of new FormData($("[data-admin-filters]"))) if (String(value).trim()) parameters.set(key, String(value).trim());
    if (["payments", "orders"].includes(state.kind)) {
      const dates = state.period || Object.fromEntries(new FormData($("[data-admin-dates]")));
      if (dates.from) parameters.set("from", dates.from);
      if (dates.to) parameters.set("to", dates.to);
    }
    return parameters;
  }
  function configureFilters(segment = "") {
    const form = $("[data-admin-filters]"); form.reset();
    form.elements.status.innerHTML = '<option value="">All statuses</option>' + statuses[state.kind].map(value => `<option value="${value}">${escape(human(value))}</option>`).join("");
    const planEnabled = ["tenants", "payments", "orders"].includes(state.kind);
    $("[data-admin-plan-filter]").hidden = !planEnabled; form.elements.plan.disabled = !planEnabled;
    const segmentEnabled = ["tenants", "users"].includes(state.kind);
    $("[data-admin-segment-filter]").hidden = !segmentEnabled; form.elements.segment.disabled = !segmentEnabled;
    form.elements.status.disabled = !statuses[state.kind].length;
    form.elements.segment.querySelectorAll("option").forEach(option => { option.hidden = state.kind === "users" && !["", "paid"].includes(option.value); });
    form.elements.segment.value = segment;
    form.elements.q.placeholder = state.kind === "users" ? "Search name, email or phone…" : state.kind === "tenants" ? "Search business, email or phone…" : "Search record references…";
  }
  function showView(view, kind = state.kind, segment = "") {
    state.view = view; state.kind = kind; state.cursor = null; state.period = null;
    $("[data-admin-overview]").hidden = view !== "overview";
    $("[data-admin-record-panel]").hidden = view !== "records";
    $("[data-admin-health-panel]").hidden = view !== "health";
    $("[data-admin-heading]").textContent = view === "overview" ? "Business overview" : view === "health" ? "System health" : segment === "paid" && kind === "tenants" ? "Paid customers" : titles[kind];
    $("[data-admin-title]").textContent = $("[data-admin-heading]").textContent;
    $("[data-admin-description]").textContent = view === "overview" ? "Your customers, revenue and messaging operations in one place." : view === "health" ? "Monitor platform availability, queues and the current plan catalogue." : "Search, export and manage records across all InterCon workspaces.";
    $(".admin-nav").querySelectorAll("button").forEach(button => {
      const active = view === "records" ? button.dataset.records === kind && (button.dataset.segment || "") === segment : button.dataset.adminView === view;
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    if (view === "records") { configureFilters(segment); loadRecords(); }
    else { renderDashboard(); status(""); }
  }
  function actions(row) {
    if (!row._id) return "";
    if (state.kind === "tenants") return `<button type="button" data-open-tenant="${escape(row._id)}">View &amp; manage</button>`;
    if (state.kind === "users") return `<button type="button" data-action-kind="user" data-action="${row.status === "disabled" ? "reactivate" : "disable"}" data-action-id="${escape(row._id)}" data-action-name="${escape(row.name || row.email)}">${row.status === "disabled" ? "Reactivate" : "Disable"}</button><button type="button" data-action-kind="user" data-action="revoke-sessions" data-action-id="${escape(row._id)}" data-action-name="${escape(row.name || row.email)}">Sign out</button>`;
    if (state.kind === "messages" && ["queued", "scheduled"].includes(row.status)) return `<button type="button" data-action-kind="message" data-action="cancel" data-action-id="${escape(row._id)}" data-action-name="${escape(row.to)}">Cancel pending</button>`;
    if (state.kind === "webhooks" && ["dead", "retry"].includes(row.status)) return `<button type="button" data-action-kind="webhook" data-action="retry" data-action-id="${escape(row._id)}" data-action-name="${escape(row.eventType)}">Retry event</button>`;
    return "";
  }
  function cell(row, field) {
    const value = at(row, field);
    if (["status", "subscription"].includes(field)) return badge(value);
    if (field === "amount") return escape(money(value, row.currency));
    if (/At$|PeriodEnd$/.test(field)) return escape(date(value, true));
    if (field === "isVerified") return value ? "Yes" : "No";
    if (field === "trialUsed") return escape(value || 0) + " / 20";
    if (field === "businessName") return `<button type="button" class="text-button" data-open-tenant="${escape(row._id)}">${escape(value)}</button>`;
    if (field === "workspace" && row.tenantId) return `<button type="button" class="text-button" data-open-tenant="${escape(row.tenantId)}">${escape(value)}</button>`;
    return escape(value ?? "—");
  }
  function renderRecords() {
    const host = $("[data-admin-records]");
    if (!state.rows.length) { host.innerHTML = '<div class="empty-state">No records match these filters.</div>'; return; }
    const withActions = ["tenants", "users", "messages", "webhooks"].includes(state.kind);
    host.innerHTML = `<table><thead><tr>${state.fields.map(field => `<th scope="col">${escape(labels[field] || human(field))}</th>`).join("")}${withActions ? '<th scope="col">Actions</th>' : ""}</tr></thead><tbody>${state.rows.map(row => `<tr>${state.fields.map(field => `<td>${cell(row, field)}</td>`).join("")}${withActions ? `<td><div class="row-actions">${actions(row)}</div></td>` : ""}</tr>`).join("")}</tbody></table>`;
  }
  async function loadRecords(append = false) {
    const token = ++state.version, kind = state.kind, params = filterParams();
    if (append && state.cursor) params.set("after", state.cursor);
    $("[data-admin-more]").disabled = true;
    $("[data-admin-records]").setAttribute("aria-busy", "true");
    status("Loading " + titles[kind].toLowerCase() + "…");
    if (!append) { state.rows = []; $("[data-admin-records]").innerHTML = '<div class="empty-state">Loading records…</div>'; }
    try {
      const data = await request("/api/admin/records/" + kind + "?" + params);
      if (token !== state.version) return;
      state.rows = append ? state.rows.concat(data.records || []) : data.records || [];
      state.fields = data.fields || []; state.cursor = data.nextCursor;
      renderRecords(); $("[data-admin-more]").hidden = !state.cursor;
      $("[data-admin-record-count]").textContent = `${state.rows.length} records loaded${state.cursor ? " · more available" : ""}`;
      $("[data-admin-record-note]").textContent = kind === "payments" || kind === "orders" ? `Amounts displayed in currency units. Date range: ${params.get("from") || "all time"} to ${params.get("to") || "today"} (India time). Change revenue dates on Overview.` : kind === "users" ? "Disabling a user or signing them out invalidates their existing sessions. Platform administrator accounts are protected." : kind === "tenants" ? "Paid access uses the current plan and expiry. Manual access grants are listed separately. Open a workspace to see its members, usage and payments." : kind === "messages" ? "Only queued or scheduled messages can be cancelled. Unknown provider outcomes are never automatically resent." : kind === "webhooks" ? "Failed and retrying events can be returned to the webhook worker queue." : kind === "audit" ? "Every administrative change includes an actor, a reason and recorded before/after values." : "Live records from all workspaces.";
      if (state.view === "records") status(state.rows.length + " records displayed.");
    } catch (error) { if (token === state.version) { status(error.message, true); $("[data-admin-records]").innerHTML = '<div class="empty-state">Could not load records. Try Refresh data.</div>'; } }
    finally { if (token === state.version) { $("[data-admin-more]").disabled = false; $("[data-admin-records]").setAttribute("aria-busy", "false"); } }
  }
  const revenueAmount = (rows, statusValue = "captured") => (rows || []).filter(row => row.currency === state.currency && row.status === statusValue).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  function renderDashboard() {
    const data = state.overview;
    if (!data) return;
    const counts = data.counts || {}, revenue = data.revenue || {}, health = data.health || {};
    const currencyControl = $("[data-admin-currency]");
    currencyControl.innerHTML = (revenue.currencies || ["INR"]).map(currency => `<option value="${escape(currency)}">${escape(currency)}</option>`).join("");
    if (!(revenue.currencies || ["INR"]).includes(state.currency)) state.currency = revenue.currencies[0];
    currencyControl.value = state.currency;
    const captured = revenueAmount(revenue.period), lifetime = revenueAmount(revenue.lifetime), mrr = revenue.mrr?.find(row => row.currency === state.currency)?.amount || 0;
    const cards = [
      ["Total users", counts.users || 0, "All customer team members", "users"], ["Workspaces", counts.tenants || 0, "Customer businesses", "tenants"], ["Paid customers", counts.paidTenants || 0, `${counts.paidUsers || 0} active users on paid plans`, "tenants", "paid"], ["Captured revenue", money(captured), "Selected date range", "payments", "", true],
      ["Lifetime captured", money(lifetime), "Excludes refunded/disputed records", "payments"], ["Estimated monthly revenue", money(mrr), "Active paid plans · excludes manual grants", "tenants", "paid"], ["Expiring in 7 days", counts.expiring || 0, "Paid subscriptions to follow up", "tenants", "expiring"], ["Suspended workspaces", counts.suspendedTenants || 0, `${counts.manualTenants || 0} workspaces have manual plan access`, "tenants", "suspended"]
    ];
    $("[data-admin-stats]").innerHTML = cards.map(([label, value, note, kind, segment, accent]) => `<button type="button" class="stat-card${accent ? " accent" : ""}" data-records="${kind}" data-segment="${segment || ""}"><span>${escape(label)}</span><strong>${escape(value)}</strong><small>${escape(note)}</small></button>`).join("");
    $("[data-admin-revenue]").innerHTML = [["Captured in period", captured, "Retained payment records"], ["Lifetime captured", lifetime, "All recorded captured payments"], ["Marked refunded", revenueAmount(revenue.period, "refunded"), "Full amounts of refunded records"], ["Marked disputed", revenueAmount(revenue.period, "disputed"), "Full amounts of disputed records"]].map(([label, amount, note]) => `<div><span>${label}</span><strong>${escape(money(amount))}</strong><small>${note}</small></div>`).join("");
    renderChart(data);
    $("[data-admin-revenue-note]").textContent = revenue.note || "Only recorded captured payments contribute to revenue.";
    $("[data-admin-recent-tenants]").innerHTML = (data.recentTenants || []).map(row => `<div class="recent-row"><div><button type="button" class="text-button" data-open-tenant="${escape(row._id)}">${escape(row.businessName)}</button><small>${escape(row.businessEmail)}</small></div>${badge(row.status)}</div>`).join("") || '<div class="empty-state">No customer workspaces yet.</div>';
    $("[data-admin-recent-payments]").innerHTML = (data.recentPayments || []).map(row => `<div class="recent-row"><div><strong>${escape(row.tenantId?.businessName || "Customer")}</strong><small>${escape(human(row.plan))} · ${escape(date(row.capturedAt))}</small></div><div class="amount"><strong>${escape(money(row.amount, row.currency))}</strong>${badge(row.status)}</div></div>`).join("") || '<div class="empty-state">No payments recorded yet.</div>';
    $("[data-admin-alerts]").innerHTML = [[counts.queued || 0, "Messages awaiting delivery", "messages", "queued"], [counts.uncertain || 0, "Unknown delivery outcomes", "messages", "uncertain"], [counts.failedWebhooks || 0, "Failed webhook events", "webhooks", "dead"], [data.operations?.orders?.pending || 0, "Unpaid checkout attempts", "orders", "pending"]].map(([count, label, kind, statusValue]) => `<button type="button" class="alert-card${count ? " warning" : ""}" data-alert-kind="${kind}" data-alert-status="${statusValue}"><strong>${escape(count)}</strong><span>${label}</span></button>`).join("");
    const healthCards = [["Database", human(health.database || "Unknown"), "MongoDB availability"], ["Redis", human(health.redis || "Unknown"), "Optional shared cache"], ["API uptime", `${Math.floor((health.uptimeSeconds || 0) / 3600)}h ${Math.floor((health.uptimeSeconds || 0) % 3600 / 60)}m`, "Since this API process started"], ["API memory", `${health.memoryMB || 0} MB`, "Resident process memory"], ["Webhook backlog", (data.operations?.webhooks?.queued || 0) + (data.operations?.webhooks?.retry || 0), "Queued and retrying events"], ["Oldest queued message", date(data.operations?.oldestQueuedAt), "Queued and scheduled messages"]];
    $("[data-admin-health]").innerHTML = healthCards.map(([label, value, note]) => `<div class="health-card"><span>${label}</span><strong>${escape(value)}</strong><small>${note}</small></div>`).join("");
    $("[data-admin-plans]").innerHTML = (data.plans || []).map(plan => `<div class="health-card"><span>${escape(plan.name)}</span><strong>${escape(money(Number(plan.amount) * 100, plan.currency))}</strong><small>${escape(plan.months)} month${plan.months === 1 ? "" : "s"} of access</small></div>`).join("");
    $("[data-admin-updated]").textContent = "Updated " + date(data.generatedAt || new Date(), true) + " · India time";
  }
  function renderChart(data) {
    const points = (data.revenue?.trend || []).filter(point => point.currency === state.currency);
    if (!points.length) { $("[data-admin-chart]").innerHTML = '<div class="chart-empty">No captured revenue in this period.</div>'; return; }
    const map = new Map(points.map(point => [point.month, point]));
    const months = [], from = data.period?.from || points[0].month + "-01", to = data.period?.to || points.at(-1).month + "-28";
    let month = from.slice(0, 7);
    while (month <= to.slice(0, 7) && months.length < 61) {
      months.push(month);
      const [year, number] = month.split("-").map(Number);
      month = `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, "0")}`;
    }
    const maximum = Math.max(1, ...points.map(point => Number(point.amount) || 0));
    $("[data-admin-chart]").innerHTML = months.map(monthValue => {
      const amount = map.get(monthValue)?.amount || 0, label = new Date(monthValue + "-01T00:00:00+05:30").toLocaleDateString("en-IN", { month: "short", year: "2-digit", timeZone: "Asia/Kolkata" });
      return `<div class="chart-column"><button type="button" class="chart-bar" style="height:${Math.max(2, amount / maximum * 140)}px" data-revenue-month="${monthValue}" title="${escape(label + ': ' + money(amount))}" aria-label="${escape(label + ', ' + money(amount) + '. View payments.')}"></button><span>${escape(label)}</span></div>`;
    }).join("");
  }
  async function loadOverview() {
    const version = ++state.overviewVersion;
    const params = new URLSearchParams(new FormData($("[data-admin-dates]")));
    try {
      const data = await request("/api/admin/overview?" + params);
      if (version !== state.overviewVersion) return;
      state.overview = data; renderDashboard();
      if (state.view !== "records") status("");
    } catch (error) { if (version === state.overviewVersion) status(error.message, true); }
  }
  const descriptions = {
    suspend: "Sending will stop for this workspace and its existing user sessions will end.", reactivate: "Restore access. Existing subscription expiry dates remain unchanged.", disable: "Disable this user's access and sign them out of all devices.", "revoke-sessions": "Sign this user out of all devices. Their account remains available for a new login.",
    "grant-plan": "Grant manual access until the selected date. This does not charge the customer or create payment revenue.", "cancel-plan": "End plan access now. This does not refund payments. Remaining free trial allowance may still permit sending; suspend the workspace to stop all sending.", cancel: "Cancel this pending message before delivery. Messages already processing or accepted cannot be cancelled.", retry: "Return this failed event to the queue for the webhook worker to process."
  };
  function openAction(button) {
    state.action = { kind: button.dataset.actionKind, id: button.dataset.actionId, action: button.dataset.action };
    const form = $("[data-admin-action-form]"); form.reset();
    $("[data-admin-action-title]").textContent = `${human(state.action.action)} · ${button.dataset.actionName || "record"}`;
    $("[data-admin-action-description]").textContent = descriptions[state.action.action] || descriptions.reactivate;
    const grant = state.action.action === "grant-plan";
    $("[data-admin-grant-fields]").hidden = !grant;
    form.elements.endDate.required = grant;
    form.elements.endDate.min = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    form.elements.endDate.value = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    $("[data-admin-action-status]").textContent = "";
    $("[data-admin-confirm]").textContent = grant ? "Grant manual access" : "Confirm " + human(state.action.action).toLowerCase();
    $("[data-admin-confirm]").classList.toggle("danger", ["suspend", "disable", "cancel-plan", "cancel"].includes(state.action.action));
    $("[data-admin-action-dialog]").showModal();
    form.elements.reason.focus();
  }
  async function openTenant(id) {
    state.detailId = id;
    if (!$("[data-admin-detail]").open) $("[data-admin-detail]").showModal();
    $("[data-admin-detail-body]").innerHTML = '<div class="empty-state">Loading workspace…</div>';
    try {
      const data = await request("/api/admin/tenants/" + encodeURIComponent(id));
      if (state.detailId !== id) return;
      const tenant = data.tenant;
      $("[data-admin-detail-title]").textContent = tenant.businessName;
      const actionButton = (action, label) => `<button type="button" class="button secondary" data-action-kind="tenant" data-action-id="${escape(id)}" data-action="${action}" data-action-name="${escape(tenant.businessName)}">${label}</button>`;
      const details = [["Business email", tenant.businessEmail], ["Workspace", human(tenant.status)], ["Subscription", `${human(tenant.billing?.plan || "none")} · ${human(tenant.billing?.status || "not started")}`], ["Plan expires", date(tenant.billing?.currentPeriodEnd)], ["Access source", human(tenant.billing?.accessSource || "Legacy / not recorded")], ["Free allowance", `${data.trial?.used || 0} / 20 recipients used`], ["WhatsApp connection", tenant.meta?.phoneNumberId ? "Connected" : "Not connected"], ["Quality rating", tenant.meta?.qualityRating || "Not available"], ["Contact count", Object.values(data.contacts || {}).reduce((sum, count) => sum + count, 0)]];
      $("[data-admin-detail-body]").innerHTML = `<div class="detail-grid">${details.map(([label, value]) => `<div class="detail-item"><span>${label}</span><strong>${escape(value || "—")}</strong></div>`).join("")}</div><div class="detail-actions">${actionButton(tenant.status === "suspended" ? "reactivate" : "suspend", tenant.status === "suspended" ? "Reactivate workspace" : "Suspend workspace")}${actionButton("grant-plan", "Grant manual plan")}${actionButton("cancel-plan", "End plan access")}</div>
        <section class="detail-section"><h3>Team members · ${(data.users || []).length} shown</h3><div class="admin-table"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${(data.users || []).map(user => `<tr><td>${escape(user.name)}</td><td>${escape(user.email)}</td><td>${escape(human(user.role))}</td><td>${badge(user.status)}</td><td><button type="button" class="text-button" data-action-kind="user" data-action-id="${escape(user._id)}" data-action="${user.status === "disabled" ? "reactivate" : "disable"}" data-action-name="${escape(user.name)}">${user.status === "disabled" ? "Reactivate" : "Disable"}</button></td></tr>`).join("")}</tbody></table></div><p class="admin-note">Up to 100 members are shown here. The Users view lists all members.</p></section>
        <section class="detail-section"><h3>Delivery and templates</h3><p>${escape(Object.entries(data.messages || {}).map(([key, count]) => human(key) + ': ' + count).join(' · ') || "No messages yet.")}</p><p>${escape(Object.entries(data.templates || {}).map(([key, count]) => human(key) + ' templates: ' + count).join(' · ') || "No templates yet.")}</p></section>
        <section class="detail-section"><h3>Latest payments</h3>${(data.payments || []).map(payment => `<div class="recent-row"><div><strong>${escape(money(payment.amount, payment.currency))} · ${escape(human(payment.plan))}</strong><small>${escape(date(payment.capturedAt))} · ${escape(payment.providerPaymentId)}</small></div>${badge(payment.status)}</div>`).join("") || '<p>No payments recorded for this workspace.</p>'}</section>
        <section class="detail-section"><h3>Recent admin activity</h3>${(data.audits || []).map(audit => `<div class="audit-entry"><strong>${escape(human(audit.action))}</strong><p>${escape(audit.reason)}</p><small>${escape(audit.actorEmail)} · ${escape(date(audit.createdAt, true))}</small></div>`).join("") || '<p>No administrative changes recorded.</p>'}</section>`;
    } catch (error) { $("[data-admin-detail-body]").innerHTML = `<p class="admin-status error">${escape(error.message)}</p>`; }
  }
  document.addEventListener("click", event => {
    const recordsButton = event.target.closest("[data-records]");
    if (recordsButton) showView("records", recordsButton.dataset.records, recordsButton.dataset.segment || "");
    const viewButton = event.target.closest("[data-admin-view]");
    if (viewButton) showView(viewButton.dataset.adminView);
    const tenantButton = event.target.closest("[data-open-tenant]");
    if (tenantButton) openTenant(tenantButton.dataset.openTenant);
    const actionButton = event.target.closest("[data-action-kind]");
    if (actionButton) openAction(actionButton);
    if (event.target.closest("[data-close-detail]")) { $("[data-admin-detail]").close(); state.detailId = null; }
    if (event.target.closest("[data-close-action]") && !$("[data-admin-confirm]").disabled) $("[data-admin-action-dialog]").close();
    const alert = event.target.closest("[data-alert-kind]");
    if (alert) { showView("records", alert.dataset.alertKind); $("[data-admin-filters]").elements.status.value = alert.dataset.alertStatus; loadRecords(); }
    const chart = event.target.closest("[data-revenue-month]");
    if (chart) {
      showView("records", "payments");
      const [year, month] = chart.dataset.revenueMonth.split("-").map(Number);
      const first = chart.dataset.revenueMonth + "-01", last = chart.dataset.revenueMonth + "-" + new Date(Date.UTC(year, month, 0)).getUTCDate();
      state.period = { from: first > state.overview.period.from ? first : state.overview.period.from, to: last < state.overview.period.to ? last : state.overview.period.to };
      loadRecords();
    }
  });
  $("[data-admin-action-dialog]").addEventListener("cancel", event => { if ($("[data-admin-confirm]").disabled) event.preventDefault(); });
  $("[data-admin-action-form]").addEventListener("submit", async event => {
    event.preventDefault();
    const action = state.action, form = event.currentTarget, button = $("[data-admin-confirm]");
    const statusElement = $("[data-admin-action-status]"); button.disabled = true; statusElement.textContent = "Saving change…"; statusElement.classList.remove("error");
    try {
      const data = await request(`/api/admin/${action.kind === "tenant" ? "tenants" : action.kind === "user" ? "users" : action.kind === "message" ? "messages" : "webhooks"}/${encodeURIComponent(action.id)}/actions`, { method: "POST", body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), action: action.action }) });
      $("[data-admin-action-dialog]").close();
      await Promise.all([loadOverview(), loadRecords()]);
      if (state.detailId) await openTenant(state.detailId);
      status(data.message || "Change saved.");
    } catch (error) { statusElement.textContent = error.message; statusElement.classList.add("error"); }
    finally { button.disabled = false; }
  });
  $("[data-admin-filters]").addEventListener("submit", event => { event.preventDefault(); state.cursor = null; loadRecords(); });
  $("[data-admin-clear-filters]").addEventListener("click", () => { $("[data-admin-filters]").reset(); state.cursor = null; state.period = null; loadRecords(); });
  $("[data-admin-more]").addEventListener("click", () => loadRecords(true));
  $("[data-admin-refresh]").addEventListener("click", async event => { event.currentTarget.disabled = true; await Promise.all([loadOverview(), loadRecords()]); $("[data-admin-refresh]").disabled = false; });
  $("[data-admin-dates]").addEventListener("submit", event => { event.preventDefault(); state.period = null; loadOverview(); });
  $("[data-admin-currency]").addEventListener("change", event => { state.currency = event.target.value; renderDashboard(); });
  $("[data-admin-export]").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true;
    try {
      const response = await fetch(`/api/admin/export/${state.kind}?${filterParams()}`, { credentials: "include" });
      if (!response.ok) throw new Error((await response.json()).message || "Export failed");
      const url = URL.createObjectURL(await response.blob()), anchor = document.createElement("a");
      anchor.href = url; anchor.download = `intercon-${state.kind}.csv`; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
      status("Export downloaded. It includes all records matching your filters.");
    } catch (error) { status(error.message, true); }
    finally { button.disabled = false; }
  });
  $("[data-admin-logout]").addEventListener("click", async event => {
    const button = event.currentTarget; button.disabled = true;
    try { await request("/api/auth/logout", { method: "POST" }); window.location.replace("/admin/login"); }
    catch (error) { status("Logout failed. You are still signed in. " + error.message, true); button.disabled = false; }
  });
  const dates = $("[data-admin-dates]");
  dates.elements.from.value = new Date(Date.now() - 89 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  dates.elements.to.value = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  configureFilters();
  request("/api/admin/me").then(data => { state.user = data.user; $("[data-admin-identity]").textContent = data.user.email; }).catch(error => status(error.message, true));
  loadOverview(); loadRecords();
})();
