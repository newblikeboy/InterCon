const statusNode = document.querySelector("#status");
let user;
async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...options });
  if (response.status === 401) { location.assign("/"); throw new Error("Please log in to continue"); }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
function feedback(message, error = false) { statusNode.textContent = message; statusNode.classList.toggle("error", error); }
async function load() {
  const [profile, terms, data] = await Promise.all([api("/api/auth/me"), api("/api/privacy/terms"), api("/api/privacy/requests")]);
  user = profile.user;
  document.querySelector("#terms-status").textContent = terms.acceptance?.version === terms.version ? `Accepted version ${terms.version}` : `Current version ${terms.version} has not been accepted by this workspace.`;
  document.querySelector("#terms-form").hidden = user.role !== "owner";
  const list = document.querySelector("#requests"); list.replaceChildren();
  const select = document.querySelector('#review-form [name="requestId"]'); select.replaceChildren();
  for (const request of data.requests) {
    const row = document.createElement("div"); row.className = "request";
    const title = document.createElement("strong"); title.textContent = `${request.kind} · ${request.subject} · ${request.status}`;
    const detail = document.createElement("p"); detail.textContent = `Reference: ${request._id} · Response target: ${new Date(request.dueAt).toLocaleDateString()}`;
    const response = document.createElement("p"); response.textContent = request.response || "Awaiting review";
    row.append(title, detail, response); list.append(row);
    if (request.subject === "customer" && request.contactId) {
      const download = document.createElement("a"); download.href = `/api/privacy/contacts/${encodeURIComponent(request.contactId)}/export?format=ndjson`;
      download.textContent = "Export this contact's data"; row.append(download);
    }
    if (request.subject === "customer") select.add(new Option(`${request.kind} · ${request._id} · ${request.status}`, request._id));
  }
  if (!data.requests.length) list.textContent = "No requests yet.";
  const manager = ["owner", "admin"].includes(user.role);
  document.querySelector("#review-section").hidden = !manager || !select.options.length;
  document.querySelector("#restore-section").hidden = !manager;
  document.querySelector('#request-form option[value="customer"]').disabled = !manager;
}
for (const form of document.querySelectorAll("form")) form.addEventListener("submit", async event => {
  event.preventDefault(); const button = form.querySelector("button"); button.disabled = true;
  try {
    const body = Object.fromEntries(new FormData(form));
    if (form.id === "terms-form") await api("/api/privacy/terms", { method: "POST", body: JSON.stringify({ accepted: true }) });
    else if (form.id === "request-form") await api("/api/privacy/requests", { method: "POST", body: JSON.stringify(body) });
    else if (form.id === "restore-form") await api("/api/privacy/suppressions/restore", { method: "POST", body: JSON.stringify({ ...body, confirmedFreshConsent: true }) });
    else {
      const erase = body.status === "erase";
      await api(`/api/privacy/requests/${encodeURIComponent(body.requestId)}${erase ? "/erase" : ""}`, { method: erase ? "POST" : "PATCH", body: JSON.stringify(body) });
    }
    feedback("Saved."); await load();
  } catch (error) { feedback(error.message, true); } finally { button.disabled = false; }
});
document.querySelector('#request-form [name="subject"]').addEventListener("change", async event => {
  const customer = event.target.value === "customer";
  document.querySelector("#contact-field").hidden = !customer;
  const select = document.querySelector('#request-form [name="contactId"]'); select.required = customer;
  if (customer) {
    try {
      select.replaceChildren(new Option("Choose a contact", "")); let after;
      do {
        const data = await api(`/api/contacts?limit=500${after ? `&after=${encodeURIComponent(after)}` : ""}`);
        for (const contact of data.contacts) select.add(new Option(`${contact.name} · ${contact.phone}`, contact._id));
        after = data.nextCursor;
      } while (after);
    } catch (error) { feedback(error.message, true); }
  }
});
load().catch(error => feedback(error.message, true));
