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
  const accepted = terms.acceptance?.version === terms.version;
  document.querySelector("#workspace-label").textContent = user.tenant?.businessName || user.name || "Your workspace";
  document.querySelector("#terms-status").textContent = accepted ? `Accepted version ${terms.version}` : `Version ${terms.version} is awaiting the workspace owner's acceptance.`;
  const badge = document.querySelector("#terms-badge");
  badge.textContent = accepted ? "Terms accepted" : "Acceptance required";
  badge.classList.toggle("is-accepted", accepted);
  document.querySelector("#terms-form").hidden = user.role !== "owner" || accepted;
  const list = document.querySelector("#requests"); list.replaceChildren();
  list.setAttribute("aria-busy", "false");
  document.querySelector("#request-count").textContent = data.requests.length;
  const select = document.querySelector('#review-form [name="requestId"]'); select.replaceChildren();
  const kindLabels = { access: "Access / export", correction: "Correction", erasure: "Erasure", withdrawal: "Withdraw permission", nomination: "Nomination", grievance: "Grievance" };
  const statusLabels = { submitted: "Submitted", verified: "Verified", in_review: "In review", fulfilled: "Completed", rejected: "Rejected" };
  for (const request of data.requests) {
    const row = document.createElement("div"); row.className = "request";
    const heading = document.createElement("div"); heading.className = "request-heading";
    const copy = document.createElement("div");
    const title = document.createElement("strong"); title.className = "request-title"; title.textContent = kindLabels[request.kind] || request.kind;
    const subject = document.createElement("span"); subject.className = "request-subject"; subject.textContent = request.subject === "customer" ? "Customer / patient data" : "Account data";
    const state = document.createElement("span"); state.className = "request-state";
    state.classList.toggle("is-complete", request.status === "fulfilled");
    state.classList.toggle("is-rejected", request.status === "rejected");
    state.textContent = statusLabels[request.status] || request.status;
    copy.append(title, subject); heading.append(copy, state);
    const detail = document.createElement("p"); detail.className = "request-meta";
    const reference = document.createElement("span"); reference.textContent = `Reference: ${request._id}`;
    const due = document.createElement("span"); due.textContent = `Response target: ${new Date(request.dueAt).toLocaleDateString()}`;
    detail.append(reference, due);
    const response = document.createElement("p"); response.className = "request-response"; response.textContent = request.response || "Awaiting review";
    row.append(heading, detail, response); list.append(row);
    if (request.subject === "customer" && request.contactId) {
      const download = document.createElement("a"); download.href = `/api/privacy/contacts/${encodeURIComponent(request.contactId)}/export?format=ndjson`;
      download.textContent = "Export this contact's data"; download.className = "request-export"; row.append(download);
    }
    if (request.subject === "customer") select.add(new Option(`${request.kind} · ${request._id} · ${request.status}`, request._id));
  }
  if (!data.requests.length) list.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H5V3h2m8 0v5h4M8 12h8M8 16h5"/></svg><strong>No requests yet</strong><p>Your submitted requests and responses will appear here.</p></div>';
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
    const messages = { "terms-form": "Data Processing Terms accepted.", "request-form": "Your request has been submitted.", "restore-form": "Fresh permission recorded.", "review-form": "Request action saved." };
    feedback(messages[form.id] || "Changes saved."); await load();
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
