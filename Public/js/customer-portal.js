const portalMenu = document.querySelector("[data-portal-menu]");
const portalSidebar = document.querySelector("[data-portal-sidebar]");
const portalNavLinks = document.querySelectorAll(".portal-nav a");
const portalViews = document.querySelectorAll("[data-portal-view]");
const connectWhatsAppButtons = document.querySelectorAll("[data-connect-whatsapp]");
const profileMenu = document.querySelector("[data-profile-menu]");
const profileTrigger = document.querySelector("[data-profile-trigger]");
const profileDropdown = document.querySelector("[data-profile-dropdown]");
const profileActionButtons = document.querySelectorAll("[data-profile-action]");
const logoutButton = document.querySelector("[data-logout]");
const contactFileInput = document.querySelector("[data-contact-file]");
const contactUploadButtons = document.querySelectorAll("[data-contact-upload]");
const contactMessage = document.querySelector("[data-contact-message]");
const contactList = document.querySelector("[data-contact-list]");
const refreshContactsButton = document.querySelector("[data-refresh-contacts]");
const createSegmentButton = document.querySelector("[data-create-segment]");
const segmentPanel = document.querySelector("[data-segment-panel]");
const segmentForm = document.querySelector("[data-segment-form]");
const segmentList = document.querySelector("[data-segment-list]");
const viewOptOutsButton = document.querySelector("[data-view-optouts]");
const optOutPanel = document.querySelector("[data-optout-panel]");
const optOutList = document.querySelector("[data-optout-list]");
const campaignForm = document.querySelector("[data-campaign-form]");
const campaignMessage = document.querySelector("[data-campaign-message]");
const campaignList = document.querySelector("[data-campaign-list]");
const refreshCampaignsButton = document.querySelector("[data-refresh-campaigns]");
const campaignTemplateSelect = document.querySelector("[data-campaign-template-select]");
const templateNameInput = document.querySelector("[data-template-name]");
const templateLanguageSelect = document.querySelector("[data-template-language]");
const templateCategorySelect = document.querySelector("[data-template-category]");
const templateBodyInput = document.querySelector("[data-template-body]");
const templateSamplesInput = document.querySelector("[data-template-samples]");
const templateMessage = document.querySelector("[data-template-message]");
const saveTemplateDraftButtons = document.querySelectorAll("[data-save-template-draft]");
const submitTemplateButtons = document.querySelectorAll("[data-submit-template]");
const sendMessageForm = document.querySelector("[data-send-message-form]");
const sendContactSelect = document.querySelector("[data-send-contact-select]");
const sendTemplateSelect = document.querySelector("[data-send-template-select]");
const sendMessageStatus = document.querySelector("[data-send-message-status]");
const sendPreviewText = document.querySelector("[data-send-preview-text]");
const sendHistory = document.querySelector("[data-send-history]");
const refreshSendDataButton = document.querySelector("[data-refresh-send-data]");
const flowBuilder = document.querySelector("[data-flow-builder]");
const flowCanvas = document.querySelector("[data-flow-canvas]");
const flowNameInput = document.querySelector("[data-flow-name]");
const saveFlowButton = document.querySelector("[data-save-flow]");
const addQuestionNodeButton = document.querySelector("[data-add-question-node]");
const addHandoffNodeButton = document.querySelector("[data-add-handoff-node]");
const automationMessage = document.querySelector("[data-automation-message]");
const automationList = document.querySelector("[data-automation-list]");
const refreshAutomationsButton = document.querySelector("[data-refresh-automations]");
const automationTemplateButtons = document.querySelectorAll("[data-automation-template]");
const defaultPortalView = "overview";

function closePortalMenu() {
  document.body.classList.remove("portal-menu-open");
  portalMenu.setAttribute("aria-expanded", "false");
}

function closeProfileMenu() {
  if (!profileDropdown || !profileTrigger) return;
  profileDropdown.hidden = true;
  profileTrigger.setAttribute("aria-expanded", "false");
}

function toggleProfileMenu() {
  if (!profileDropdown || !profileTrigger) return;
  const isOpen = profileDropdown.hidden;
  profileDropdown.hidden = !isOpen;
  profileTrigger.setAttribute("aria-expanded", String(isOpen));
}

function viewExists(viewId) {
  return Boolean(document.getElementById(viewId));
}

function setActiveNav(viewId) {
  portalNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${viewId}`);
  });
}

function showPortalView(viewId, shouldPersist = true) {
  const nextViewId = viewExists(viewId) ? viewId : defaultPortalView;

  portalViews.forEach((view) => {
    view.hidden = view.id !== nextViewId;
  });

  setActiveNav(nextViewId);
  closePortalMenu();
  window.scrollTo({ top: 0, behavior: "auto" });

  if (shouldPersist) {
    localStorage.setItem("intercon_customer_portal_view", nextViewId);
    if (window.location.hash !== `#${nextViewId}`) {
      history.replaceState(null, "", `#${nextViewId}`);
    }
  }
}

function getInitialViewId() {
  const hashViewId = window.location.hash.replace("#", "");
  if (hashViewId && viewExists(hashViewId)) {
    return hashViewId;
  }

  const storedViewId = localStorage.getItem("intercon_customer_portal_view");
  if (storedViewId && viewExists(storedViewId)) {
    return storedViewId;
  }

  return defaultPortalView;
}

function setContactMessage(message, isError = false) {
  if (!contactMessage) return;
  contactMessage.textContent = message;
  contactMessage.classList.toggle("error", isError);
}

function setCampaignMessage(message, isError = false) {
  if (!campaignMessage) return;
  campaignMessage.textContent = message;
  campaignMessage.classList.toggle("error", isError);
}

function setTemplateMessage(message, isError = false) {
  if (!templateMessage) return;
  templateMessage.textContent = message;
  templateMessage.classList.toggle("error", isError);
}

function setAutomationMessage(message, isError = false) {
  if (!automationMessage) return;
  automationMessage.textContent = message;
  automationMessage.classList.toggle("error", isError);
}

function setSendMessage(message, isError = false) {
  if (!sendMessageStatus) return;
  sendMessageStatus.textContent = message;
  sendMessageStatus.classList.toggle("error", isError);
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function renderContactRows(contacts) {
  if (!contactList) return;

  if (!contacts.length) {
    contactList.innerHTML = `<div class="empty-row">No contacts imported yet.</div>`;
    return;
  }

  contactList.innerHTML = contacts.map((contact) => `
    <div class="table-row contact-table-row">
      <strong>${contact.name}</strong>
      <span>${contact.phone}</span>
      <em class="${contact.optIn?.status ? "approved" : "pending"}">${contact.optIn?.status ? "Yes" : "Missing"}</em>
      <span>${(contact.tags || []).join(", ") || "-"}</span>
    </div>
  `).join("");
}

function renderSendContactOptions(contacts) {
  if (!sendContactSelect) return;
  const optedInContacts = contacts.filter((contact) => contact.status === "active" && contact.optIn?.status);

  if (!optedInContacts.length) {
    sendContactSelect.innerHTML = `<option value="">No opted-in contacts available</option>`;
    sendContactSelect.disabled = true;
    return;
  }

  sendContactSelect.disabled = false;
  sendContactSelect.innerHTML = [
    `<option value="">Select contact</option>`,
    ...optedInContacts.map((contact) => (
      `<option value="${contact._id}">${contact.name} - ${contact.phone}</option>`
    ))
  ].join("");
}

function renderOptOutRows(contacts) {
  if (!optOutList) return;

  if (!contacts.length) {
    optOutList.innerHTML = `<div class="empty-row">No opt-outs or blocked contacts.</div>`;
    return;
  }

  optOutList.innerHTML = contacts.map((contact) => `
    <div class="table-row contact-table-row">
      <strong>${contact.name}</strong>
      <span>${contact.phone}</span>
      <em class="rejected">${contact.status}</em>
      <span>${new Date(contact.updatedAt).toLocaleDateString()}</span>
    </div>
  `).join("");
}

function renderSegments(segments) {
  if (!segmentList) return;

  if (!segments.length) {
    segmentList.innerHTML = `<div class="empty-row">No saved segments yet.</div>`;
    return;
  }

  segmentList.innerHTML = segments.map((segment) => `
    <article>
      <strong>${segment.name}</strong>
      <span>tag: ${segment.tag}</span>
    </article>
  `).join("");
}

async function loadContacts() {
  if (!contactList) return;
  const data = await requestJson("/api/contacts");
  renderContactRows(data.contacts || []);
  renderSendContactOptions(data.contacts || []);
}

async function loadSegments() {
  if (!segmentList) return;
  const data = await requestJson("/api/contacts/segments");
  renderSegments(data.segments || []);
}

async function loadOptOuts() {
  if (!optOutList) return;
  const data = await requestJson("/api/contacts/opt-outs");
  renderOptOutRows(data.contacts || []);
}

function renderCampaignRows(campaigns) {
  if (!campaignList) return;

  if (!campaigns.length) {
    campaignList.innerHTML = `<div class="empty-row">No campaigns created yet.</div>`;
    return;
  }

  campaignList.innerHTML = campaigns.map((campaign) => `
    <div class="table-row campaign-table-row">
      <strong>${campaign.name}</strong>
      <span>${campaign.templateName}</span>
      <em class="${campaign.status === "failed" ? "rejected" : campaign.status === "draft" ? "pending" : "approved"}">${campaign.status}</em>
      <span>${campaign.stats?.recipients || 0}</span>
      <button type="button" data-campaign-pause="${campaign._id}">${campaign.status === "paused" ? "Resume" : "Pause"}</button>
    </div>
  `).join("");

  campaignList.querySelectorAll("[data-campaign-pause]").forEach((button) => {
    button.addEventListener("click", async () => {
      const campaignId = button.dataset.campaignPause;
      const currentStatus = button.closest(".campaign-table-row").querySelector("em").textContent;
      const nextStatus = currentStatus === "paused" ? "scheduled" : "paused";

      try {
        setCampaignMessage("Updating campaign...");
        await requestJson(`/api/campaigns/${campaignId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        await loadCampaigns();
        setCampaignMessage("Campaign updated.");
      } catch (error) {
        setCampaignMessage(error.message, true);
      }
    });
  });
}

async function loadCampaigns() {
  if (!campaignList) return;
  const data = await requestJson("/api/campaigns");
  renderCampaignRows(data.campaigns || []);
}

function renderApprovedTemplateOptions(templates) {
  if (!campaignTemplateSelect && !sendTemplateSelect) return;

  if (!templates.length) {
    [campaignTemplateSelect, sendTemplateSelect].forEach((select) => {
      if (!select) return;
      select.innerHTML = `<option value="">No approved templates available</option>`;
      select.disabled = true;
    });
    return;
  }

  const options = [
    `<option value="">Select approved template</option>`,
    ...templates.map((template) => (
      `<option value="${template.name}" data-category="${template.category}">${template.name} - ${template.category}</option>`
    ))
  ].join("");

  [campaignTemplateSelect, sendTemplateSelect].forEach((select) => {
    if (!select) return;
    select.disabled = false;
    select.innerHTML = options;
  });
}

async function loadApprovedTemplates() {
  if (!campaignTemplateSelect && !sendTemplateSelect) return;
  const data = await requestJson("/api/templates/approved");
  renderApprovedTemplateOptions(data.templates || []);
}

function renderSendHistory(messages) {
  if (!sendHistory) return;

  if (!messages.length) {
    sendHistory.innerHTML = `<div class="empty-row">No WhatsApp messages sent yet.</div>`;
    return;
  }

  sendHistory.innerHTML = messages.map((message) => `
    <div class="table-row send-table-row">
      <strong>${message.to}</strong>
      <span>${message.templateName}</span>
      <em class="${message.status === "failed" ? "rejected" : "approved"}">${message.status}</em>
      <span>${new Date(message.createdAt).toLocaleString()}</span>
    </div>
  `).join("");
}

async function loadSendHistory() {
  if (!sendHistory) return;
  const data = await requestJson("/api/messages");
  renderSendHistory(data.messages || []);
}

function updateSendPreview() {
  if (!sendPreviewText || !sendMessageForm) return;
  const formData = Object.fromEntries(new FormData(sendMessageForm).entries());
  const templateName = formData.templateName || "selected_template";
  const variables = formData.variables || "variables";
  sendPreviewText.textContent = `${templateName}: ${variables}`;
}

function getTemplatePayload() {
  return {
    name: templateNameInput?.value || "",
    language: templateLanguageSelect?.value || "en",
    category: templateCategorySelect?.value || "",
    body: templateBodyInput?.value || "",
    variableSamples: templateSamplesInput?.value || ""
  };
}

async function saveTemplateDraft() {
  setTemplateMessage("Saving template draft...");
  const data = await requestJson("/api/templates/drafts", {
    method: "POST",
    body: JSON.stringify(getTemplatePayload())
  });
  setTemplateMessage(data.message || "Template draft saved.");
  await loadApprovedTemplates();
}

async function submitTemplateForReview() {
  setTemplateMessage("Submitting template to Meta...");
  const data = await requestJson("/api/templates", {
    method: "POST",
    body: JSON.stringify(getTemplatePayload())
  });
  setTemplateMessage(data.message || "Template submitted to Meta for review.");
  await loadApprovedTemplates();
}

function renderAutomationRows(flows) {
  if (!automationList) return;

  if (!flows.length) {
    automationList.innerHTML = `<div class="empty-row">No automation flows saved yet.</div>`;
    return;
  }

  automationList.innerHTML = flows.map((flow) => `
    <div class="table-row automation-table-row">
      <strong>${flow.name}</strong>
      <span>${flow.triggerType}${flow.triggerValue ? `: ${flow.triggerValue}` : ""}</span>
      <span>${flow.routeTo}</span>
      <em class="${flow.status === "active" ? "approved" : "pending"}">${flow.status}</em>
      <button type="button" data-automation-toggle="${flow._id}">${flow.status === "active" ? "Pause" : "Activate"}</button>
    </div>
  `).join("");

  automationList.querySelectorAll("[data-automation-toggle]").forEach((button) => {
    button.addEventListener("click", async () => {
      const flowId = button.dataset.automationToggle;
      const currentStatus = button.closest(".automation-table-row").querySelector("em").textContent;
      const nextStatus = currentStatus === "active" ? "paused" : "active";

      try {
        setAutomationMessage("Updating automation...");
        await requestJson(`/api/automations/${flowId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus })
        });
        await loadAutomations();
        setAutomationMessage("Automation updated.");
      } catch (error) {
        setAutomationMessage(error.message, true);
      }
    });
  });
}

async function loadAutomations() {
  if (!automationList) return;
  const data = await requestJson("/api/automations");
  renderAutomationRows(data.flows || []);
}

portalMenu.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("portal-menu-open");
  portalMenu.setAttribute("aria-expanded", String(isOpen));
});

portalNavLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showPortalView(link.getAttribute("href").replace("#", ""));
  });
});

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const viewId = link.getAttribute("href").replace("#", "");
    if (!viewExists(viewId)) return;

    event.preventDefault();
    showPortalView(viewId);
  });
});

window.addEventListener("hashchange", () => {
  showPortalView(window.location.hash.replace("#", ""), false);
});

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("portal-menu-open")) return;
  const clickedInsideSidebar = portalSidebar.contains(event.target);
  const clickedMenu = portalMenu.contains(event.target);

  if (!clickedInsideSidebar && !clickedMenu) {
    closePortalMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("portal-menu-open")) {
    closePortalMenu();
  }
  if (event.key === "Escape") {
    closeProfileMenu();
  }
});

if (profileTrigger) {
  profileTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleProfileMenu();
  });
}

document.addEventListener("click", (event) => {
  if (!profileMenu || !profileDropdown || profileDropdown.hidden) return;
  if (!profileMenu.contains(event.target)) {
    closeProfileMenu();
  }
});

profileActionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.profileAction;
    closeProfileMenu();

    if (action === "profile") {
      window.alert("My Profile page will be connected when the profile section is built.");
    }

    if (action === "password") {
      window.alert("Change Password form will be connected after account settings are added.");
    }
  });
});

connectWhatsAppButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Opening Meta...";

    try {
      const response = await fetch("/api/meta/embedded-signup-url", {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Missing backend endpoint");
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Missing signup URL");
      }

      window.location.href = data.url;
    } catch (error) {
      window.alert("Connect WhatsApp should open your Meta Embedded Signup URL. Add a backend route at /api/meta/embedded-signup-url that returns { url } from EMBED_SIGN_UP.");
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});

contactUploadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    contactFileInput?.click();
  });
});

if (contactFileInput) {
  contactFileInput.addEventListener("change", async () => {
    const file = contactFileInput.files?.[0];
    if (!file) return;

    try {
      setContactMessage("Importing contacts...");
      const contacts = parseCsv(await file.text());
      const data = await requestJson("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({ contacts })
      });
      setContactMessage(`Imported ${data.result.imported} contacts. Skipped ${data.result.skipped}.`);
      await loadContacts();
    } catch (error) {
      setContactMessage(error.message, true);
    } finally {
      contactFileInput.value = "";
    }
  });
}

if (refreshContactsButton) {
  refreshContactsButton.addEventListener("click", async () => {
    try {
      setContactMessage("Refreshing contacts...");
      await loadContacts();
      setContactMessage("Contacts refreshed.");
    } catch (error) {
      setContactMessage(error.message, true);
    }
  });
}

if (createSegmentButton) {
  createSegmentButton.addEventListener("click", async () => {
    segmentPanel.hidden = !segmentPanel.hidden;
    optOutPanel.hidden = true;
    if (!segmentPanel.hidden) {
      try {
        await loadSegments();
      } catch (error) {
        setContactMessage(error.message, true);
      }
    }
  });
}

if (segmentForm) {
  segmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(segmentForm).entries());

    try {
      setContactMessage("Saving segment...");
      await requestJson("/api/contacts/segments", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      segmentForm.reset();
      await loadSegments();
      setContactMessage("Segment saved.");
    } catch (error) {
      setContactMessage(error.message, true);
    }
  });
}

if (viewOptOutsButton) {
  viewOptOutsButton.addEventListener("click", async () => {
    optOutPanel.hidden = !optOutPanel.hidden;
    segmentPanel.hidden = true;
    if (!optOutPanel.hidden) {
      try {
        setContactMessage("Loading opt-outs...");
        await loadOptOuts();
        setContactMessage("Opt-out list loaded.");
      } catch (error) {
        setContactMessage(error.message, true);
      }
    }
  });
}

if (campaignForm) {
  campaignForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(campaignForm).entries());

    try {
      setCampaignMessage("Saving campaign...");
      await requestJson("/api/campaigns", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      campaignForm.reset();
      await loadCampaigns();
      setCampaignMessage("Campaign saved.");
    } catch (error) {
      setCampaignMessage(error.message, true);
    }
  });
}

if (campaignTemplateSelect) {
  campaignTemplateSelect.addEventListener("change", () => {
    const selectedOption = campaignTemplateSelect.selectedOptions[0];
    const category = selectedOption?.dataset.category;
    const categorySelect = campaignForm?.querySelector("[name='category']");

    if (category && categorySelect) {
      categorySelect.value = category;
    }
  });
}

if (sendMessageForm) {
  sendMessageForm.addEventListener("input", updateSendPreview);
  sendMessageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(sendMessageForm).entries());

    try {
      setSendMessage("Sending WhatsApp message...");
      await requestJson("/api/messages/send-template", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      sendMessageForm.reset();
      updateSendPreview();
      await loadSendHistory();
      setSendMessage("WhatsApp message sent.");
    } catch (error) {
      setSendMessage(error.message, true);
    }
  });
}

if (refreshSendDataButton) {
  refreshSendDataButton.addEventListener("click", async () => {
    try {
      setSendMessage("Refreshing sender data...");
      await Promise.all([loadContacts(), loadApprovedTemplates(), loadSendHistory()]);
      setSendMessage("Sender data refreshed.");
    } catch (error) {
      setSendMessage(error.message, true);
    }
  });
}

if (refreshCampaignsButton) {
  refreshCampaignsButton.addEventListener("click", async () => {
    try {
      setCampaignMessage("Refreshing campaigns...");
      await loadCampaigns();
      setCampaignMessage("Campaigns refreshed.");
    } catch (error) {
      setCampaignMessage(error.message, true);
    }
  });
}

saveTemplateDraftButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await saveTemplateDraft();
    } catch (error) {
      setTemplateMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});

submitTemplateButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await submitTemplateForReview();
    } catch (error) {
      setTemplateMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});

function getFlowPayload() {
  const controls = {};
  document.querySelectorAll("[data-flow-control]").forEach((control) => {
    controls[control.dataset.flowControl] = control.checked;
  });

  return {
    name: flowNameInput?.value || "Untitled flow",
    triggerType: document.querySelector("[data-trigger-type]")?.value || "keyword",
    triggerValue: document.querySelector("[data-trigger-value]")?.value || "",
    firstReply: document.querySelector("[data-first-reply]")?.value || "",
    routeTo: document.querySelector("[data-route-to]")?.value || "human_agent",
    ...controls
  };
}

function addFlowLine() {
  const line = document.createElement("div");
  line.className = "flow-line";
  flowCanvas.appendChild(line);
}

function renumberFlowNodes() {
  flowCanvas.querySelectorAll(".flow-builder-node").forEach((node, index) => {
    const icon = node.querySelector(".node-icon");
    if (icon) {
      icon.textContent = String(index + 1).padStart(2, "0");
    }
  });
}

function addQuestionNode(text = "Ask the next question") {
  if (!flowCanvas) return;
  addFlowLine();
  const node = document.createElement("article");
  node.className = "flow-builder-node question-node";
  node.setAttribute("data-dynamic-node", "");
  node.innerHTML = `
    <div class="node-icon"></div>
    <div class="node-body">
      <span>Question</span>
      <strong>Collect more detail</strong>
      <input type="text" value="${text}" data-question-text>
    </div>
  `;
  flowCanvas.appendChild(node);
  renumberFlowNodes();
}

function addHandoffNode(routeTo = "human_agent") {
  if (!flowCanvas) return;
  addFlowLine();
  const node = document.createElement("article");
  node.className = "flow-builder-node handoff-node";
  node.setAttribute("data-dynamic-node", "");
  node.innerHTML = `
    <div class="node-icon"></div>
    <div class="node-body">
      <span>Handoff</span>
      <strong>Route to team</strong>
      <select data-route-to>
        <option value="human_agent">Human agent</option>
        <option value="sales">Sales</option>
        <option value="support">Support</option>
        <option value="billing">Billing</option>
      </select>
    </div>
  `;
  flowCanvas.appendChild(node);
  node.querySelector("[data-route-to]").value = routeTo;
  renumberFlowNodes();
}

function resetDynamicFlowNodes() {
  if (!flowCanvas) return;
  flowCanvas.querySelectorAll("[data-dynamic-node]").forEach((node) => {
    const previousLine = node.previousElementSibling;
    if (previousLine?.classList.contains("flow-line")) {
      previousLine.remove();
    }
    node.remove();
  });
  renumberFlowNodes();
}

function applyFlowTemplate(template) {
  if (!template) return;

  if (flowNameInput) flowNameInput.value = template.name;
  const triggerType = document.querySelector("[data-trigger-type]");
  const triggerValue = document.querySelector("[data-trigger-value]");
  const firstReply = document.querySelector("[data-first-reply]");
  const routeTo = document.querySelector("[data-route-to]");

  if (triggerType) triggerType.value = template.triggerType;
  if (triggerValue) triggerValue.value = template.triggerValue;
  if (firstReply) firstReply.value = template.firstReply;
  if (routeTo) routeTo.value = template.routeTo;

  resetDynamicFlowNodes();
  (template.questions || []).forEach((question) => addQuestionNode(question));
  addHandoffNode(template.routeTo);
  setAutomationMessage("Template loaded. Review the visual flow and save it.");
}

if (saveFlowButton) {
  saveFlowButton.addEventListener("click", async () => {
    const payload = getFlowPayload();

    try {
      setAutomationMessage("Saving automation...");
      await requestJson("/api/automations", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadAutomations();
      setAutomationMessage("Automation flow saved.");
    } catch (error) {
      setAutomationMessage(error.message, true);
    }
  });
}

if (addQuestionNodeButton) {
  addQuestionNodeButton.addEventListener("click", () => addQuestionNode());
}

if (addHandoffNodeButton) {
  addHandoffNodeButton.addEventListener("click", () => addHandoffNode());
}

if (refreshAutomationsButton) {
  refreshAutomationsButton.addEventListener("click", async () => {
    try {
      setAutomationMessage("Refreshing automations...");
      await loadAutomations();
      setAutomationMessage("Automations refreshed.");
    } catch (error) {
      setAutomationMessage(error.message, true);
    }
  });
}

const automationTemplates = {
  faq: {
    name: "FAQ bot",
    triggerType: "keyword",
    triggerValue: "help",
    firstReply: "Hi, I can help with price, timing, location, refund, warranty, or documents. Please reply with what you need.",
    routeTo: "support",
    questions: ["Which topic do you need help with?"]
  },
  lead: {
    name: "Lead capture flow",
    triggerType: "ad_click",
    triggerValue: "lead",
    firstReply: "Thanks for your interest. Please share your name, city, requirement, and preferred callback time.",
    routeTo: "sales",
    questions: ["What product or service are you interested in?", "What is your preferred callback time?"]
  },
  appointment: {
    name: "Appointment booking flow",
    triggerType: "keyword",
    triggerValue: "appointment",
    firstReply: "Please share your preferred date and time. Our team will confirm the available slot.",
    routeTo: "support",
    questions: ["Which date works for you?", "Which time slot do you prefer?"]
  }
};

automationTemplateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const template = automationTemplates[button.dataset.automationTemplate];
    applyFlowTemplate(template);
  });
});

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    closeProfileMenu();
    logoutButton.disabled = true;
    const originalText = logoutButton.textContent;
    logoutButton.textContent = "Logging out...";

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } finally {
      localStorage.removeItem("intercon_customer_portal_view");
      window.location.href = "/";
      logoutButton.disabled = false;
      logoutButton.textContent = originalText;
    }
  });
}

showPortalView(getInitialViewId(), true);
loadContacts().catch((error) => setContactMessage(error.message, true));
loadCampaigns().catch((error) => setCampaignMessage(error.message, true));
loadApprovedTemplates().catch((error) => setCampaignMessage(error.message, true));
loadAutomations().catch((error) => setAutomationMessage(error.message, true));
loadSendHistory().catch((error) => setSendMessage(error.message, true));
