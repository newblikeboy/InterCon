const portalMenu = document.querySelector("[data-portal-menu]");
const portalSidebar = document.querySelector("[data-portal-sidebar]");
const portalNavLinks = document.querySelectorAll(".portal-nav a");
const portalViews = document.querySelectorAll("[data-portal-view]");
const consoleTitle = document.querySelector("[data-console-title]");
const consoleEyebrow = document.querySelector("[data-console-eyebrow]");
const setupProgressCount = document.querySelector("[data-setup-progress-count]");
const setupProgressBar = document.querySelector("[data-setup-progress-bar]");
const setupCurrentStep = document.querySelector("[data-setup-current-step]");
const setupCurrentMessage = document.querySelector("[data-setup-current-message]");
const setupCurrentLink = document.querySelector("[data-setup-current-link]");
const setupStepCards = document.querySelectorAll("[data-setup-step]");
const statContacts = document.querySelector("[data-stat-contacts]");
const statContactsDetail = document.querySelector("[data-stat-contacts-detail]");
const statTemplates = document.querySelector("[data-stat-templates]");
const statTemplatesDetail = document.querySelector("[data-stat-templates-detail]");
const statPendingTemplates = document.querySelector("[data-stat-pending-templates]");
const statPendingTemplatesDetail = document.querySelector("[data-stat-pending-templates-detail]");
const statMessages = document.querySelector("[data-stat-messages]");
const statMessagesDetail = document.querySelector("[data-stat-messages-detail]");
const connectWhatsAppButtons = document.querySelectorAll("[data-connect-whatsapp]");
const coexistenceButtons = document.querySelectorAll("[data-coexistence-onboard]");
const coexMessage = document.querySelector("[data-coex-message]");
const coexState = document.querySelector("[data-coex-state]");
const metaConnectState = document.querySelector("[data-meta-connect-state]");
const metaWabaId = document.querySelector("[data-meta-waba-id]");
const metaPhoneNumberId = document.querySelector("[data-meta-phone-number-id]");
const metaPhoneStatus = document.querySelector("[data-meta-phone-status]");
const metaDisplayNameStatus = document.querySelector("[data-meta-display-name-status]");
const metaWebhookStatus = document.querySelector("[data-meta-webhook-status]");
const metaHealthStatus = document.querySelector("[data-meta-health-status]");
const metaConversationTier = document.querySelector("[data-meta-conversation-tier]");
const metaPaymentStatus = document.querySelector("[data-meta-payment-status]");
const metaPaymentAction = document.querySelector("[data-meta-payment-action]");
const connectStepCards = document.querySelectorAll("[data-connect-step]");
const metaConnectMessage = document.querySelector("[data-meta-connect-message]");
const metaRegisterPhoneButton = document.querySelector("[data-meta-register-phone]");
const profileMenu = document.querySelector("[data-profile-menu]");
const profileTrigger = document.querySelector("[data-profile-trigger]");
const profileDropdown = document.querySelector("[data-profile-dropdown]");
const profileAvatar = document.querySelector("[data-profile-avatar]");
const profileBusinessName = document.querySelector("[data-profile-business-name]");
const profileRole = document.querySelector("[data-profile-role]");
const logoutButton = document.querySelector("[data-logout]");
const contactFileInput = document.querySelector("[data-contact-file]");
const contactUploadButtons = document.querySelectorAll("[data-contact-upload]");
const contactMessage = document.querySelector("[data-contact-message]");
const contactList = document.querySelector("[data-contact-list]");
const refreshContactsButton = document.querySelector("[data-refresh-contacts]");
const templateNameInput = document.querySelector("[data-template-name]");
const templateLanguageSelect = document.querySelector("[data-template-language]");
const templateCategorySelect = document.querySelector("[data-template-category]");
const templateBodyInput = document.querySelector("[data-template-body]");
const templateSamplesInput = document.querySelector("[data-template-samples]");
const templatePresetSelect = document.querySelector("[data-template-preset]");
const templateHeaderTypeSelect = document.querySelector("[data-template-header-type]");
const templateHeaderMediaField = document.querySelector("[data-template-header-media-field]");
const templateHeaderMediaSelect = document.querySelector("[data-template-header-media]");
const templateMessages = document.querySelectorAll("[data-template-message]");
const templateStatusList = document.querySelector("[data-template-status-list]");
const submitTemplateButtons = document.querySelectorAll("[data-submit-template]");
const templateModal = document.querySelector("[data-template-modal]");
const openTemplateModalButton = document.querySelector("[data-open-template-modal]");
const closeTemplateModalButtons = document.querySelectorAll("[data-close-template-modal]");
const confirmModal = document.querySelector("[data-confirm-modal]");
const confirmTitle = document.querySelector("[data-confirm-title]");
const confirmMessage = document.querySelector("[data-confirm-message]");
const confirmAcceptButton = document.querySelector("[data-confirm-accept]");
const confirmCancelButtons = document.querySelectorAll("[data-confirm-cancel]");
const sendMessageForm = document.querySelector("[data-send-message-form]");
const sendRecipientPicker = document.querySelector("[data-send-recipient-picker]");
const sendContactList = document.querySelector("[data-send-contact-list]");
const sendGroupList = document.querySelector("[data-send-group-list]");
const sendRecipientSearch = document.querySelector("[data-send-recipient-search]");
const sendRecipientCount = document.querySelector("[data-send-recipient-count]");
const sendSelectAllButton = document.querySelector("[data-send-select-all]");
const sendClearRecipientsButton = document.querySelector("[data-send-clear-recipients]");
const sendTemplateSelect = document.querySelector("[data-send-template-select]");
const sendLanguageSelect = document.querySelector("[data-send-language-select]");
const sendVariableEditor = document.querySelector("[data-send-variable-editor]");
const sendVariableHint = document.querySelector("[data-send-variable-hint]");
const sendMediaField = document.querySelector("[data-send-media-field]");
const sendMediaSelect = document.querySelector("[data-send-media-select]");
const sendMediaHint = document.querySelector("[data-send-media-hint]");
const sendMessageStatus = document.querySelector("[data-send-message-status]");
const sendSubmitButton = document.querySelector("[data-send-submit]");
const sendHistory = document.querySelector("[data-send-history]");
const refreshSendDataButtons = document.querySelectorAll("[data-refresh-send-data]");
const previewContact = document.querySelector("[data-preview-contact]");
const previewMessage = document.querySelector("[data-preview-message]");
const previewTime = document.querySelector("[data-preview-time]");
const previewBubbleTime = document.querySelector("[data-preview-bubble-time]");
const previewTemplate = document.querySelector("[data-preview-template]");
const previewCategory = document.querySelector("[data-preview-category]");
const previewMedia = document.querySelector("[data-preview-media]");
const bulkPreviewModal = document.querySelector("[data-bulk-preview-modal]");
const closeBulkPreviewButtons = document.querySelectorAll("[data-close-bulk-preview]");
const bulkPreviewTemplate = document.querySelector("[data-bulk-preview-template]");
const bulkPreviewSummary = document.querySelector("[data-bulk-preview-summary]");
const bulkPreviewSearch = document.querySelector("[data-bulk-preview-search]");
const bulkPreviewRange = document.querySelector("[data-bulk-preview-range]");
const bulkPreviewTable = document.querySelector("[data-bulk-preview-table]");
const bulkPreviewPrevious = document.querySelector("[data-bulk-preview-previous]");
const bulkPreviewNext = document.querySelector("[data-bulk-preview-next]");
const bulkPreviewPage = document.querySelector("[data-bulk-preview-page]");
const apiKeyForm = document.querySelector("[data-api-key-form]");
const apiKeyNameInput = document.querySelector("[data-api-key-name]");
const apiKeyList = document.querySelector("[data-api-key-list]");
const apiMessage = document.querySelector("[data-api-message]");
const apiGeneratedPanel = document.querySelector("[data-api-generated-panel]");
const apiGeneratedKey = document.querySelector("[data-api-generated-key]");
const copyApiKeyButton = document.querySelector("[data-copy-api-key]");
const refreshApiKeysButton = document.querySelector("[data-refresh-api-keys]");
const apiBaseUrl = document.querySelector("[data-api-base-url]");
const billingStatus = document.querySelector("[data-billing-status]");
const billingCurrentPlan = document.querySelector("[data-billing-current-plan]");
const billingMessage = document.querySelector("[data-billing-message]");
const billingPlanGrid = document.querySelector("[data-billing-plan-grid]");
const mediaGrid = document.querySelector("[data-media-grid]");
const mediaStatus = document.querySelector("[data-media-status]");
const mediaFilter = document.querySelector("[data-media-filter]");
const mediaModal = document.querySelector("[data-media-modal]");
const openMediaModalButton = document.querySelector("[data-open-media-modal]");
const closeMediaModalButtons = document.querySelectorAll("[data-close-media-modal]");
const mediaUploadForm = document.querySelector("[data-media-upload-form]");
const mediaFileInput = document.querySelector("[data-media-file]");
const mediaTitleInput = document.querySelector("[data-media-title]");
const mediaFileLabel = document.querySelector("[data-media-file-label]");
const mediaUploadStatus = document.querySelector("[data-media-upload-status]");
const mediaUploadSubmit = document.querySelector("[data-media-upload-submit]");
const refreshMediaButton = document.querySelector("[data-refresh-media]");
const defaultPortalView = "home";
let facebookSdkPromise;
// Once resolved, holds { FB, config } synchronously so the Meta popup can be
// opened directly inside a click gesture (required by Safari's popup blocker).
let facebookSdk = null;
let razorpayCheckoutPromise;
let embeddedSignupSessionInfo = null;
let embeddedSignupSessionResolvers = [];
let embeddedSignupSessionRejecters = [];
const setupState = {
  tenant: null,
  contacts: [],
  groups: [],
  templates: [],
  messages: [],
  apiKeys: [],
  billing: {
    plan: "none",
    status: "not_started",
    active: false
  },
  plans: []
};
const mediaState = { assets: [], loaded: false, loading: false };
const sendRecipientState = {
  contactIds: new Set(),
  groupIds: new Set(),
  search: ""
};
const sendVariableDataState = {
  templateKey: "",
  parameterCount: 0,
  rows: [],
  fileName: ""
};
const bulkPreviewState = {
  rows: [],
  summary: {},
  template: {},
  search: "",
  page: 1,
  pageSize: 25
};

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

// Top-level launcher pages (rail items) and the feature views they own.
const PAGES = ["home", "setup", "send-whatsapp", "inbox", "reports", "payments", "api"];
const PAGE_TITLES = { home: "Home", setup: "Setup", "send-whatsapp": "Send WhatsApp", inbox: "Inbox", reports: "Reports", payments: "Payments", api: "API" };
const VIEW_PARENT = {
  connect: "setup",
  coexistence: "setup",
  templates: "setup",
  "template-library": "setup",
  "media-library": "setup",
  contacts: "setup",
  optout: "setup",
  groups: "setup",
  blacklist: "setup",
  billing: "payments",
  "developer-api": "api"
};
const VIEW_META = {
  connect: { title: "Connected WABA", related: ["templates", "contacts", "coexistence"] },
  coexistence: { title: "Coexistence Onboarding", related: ["connect", "templates"] },
  templates: { title: "Manage Template", related: ["template-library", "media-library", "send-whatsapp"] },
  "template-library": { title: "Template Library", related: ["templates", "media-library"] },
  "media-library": { title: "Media Library", related: ["templates", "template-library"] },
  contacts: { title: "WhatsApp Contacts", related: ["optout", "groups", "blacklist"] },
  optout: { title: "Opt-out Contacts", related: ["contacts", "blacklist"] },
  groups: { title: "Manage Groups", related: ["contacts", "optout"] },
  blacklist: { title: "Blacklist Numbers", related: ["contacts", "optout"] },
  "send-whatsapp": { title: "Send WhatsApp", related: ["templates", "contacts"] },
  billing: { title: "Billing", related: ["connect"] },
  "developer-api": { title: "API Access", related: ["contacts", "templates"] }
};

function setActiveNav(viewId) {
  const section = VIEW_PARENT[viewId] || viewId;
  portalNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${section}`);
  });
}

function updateConsoleTitle(viewId) {
  const parent = VIEW_PARENT[viewId];
  const title = VIEW_META[viewId]?.title || PAGE_TITLES[viewId] || "Home";

  if (consoleTitle) {
    consoleTitle.textContent = title;
  }

  if (consoleEyebrow) {
    consoleEyebrow.textContent = parent ? (PAGE_TITLES[parent] || "Your workspace") : "Your workspace";
  }

  document.title = `InterCon ${title}`;
}

function showPortalView(viewId, shouldPersist = true) {
  const nextViewId = viewExists(viewId) ? viewId : defaultPortalView;

  portalViews.forEach((view) => {
    view.hidden = view.id !== nextViewId;
  });

  setActiveNav(nextViewId);
  updateConsoleTitle(nextViewId);
  closePortalMenu();
  window.scrollTo({ top: 0, behavior: "auto" });

  if (typeof onPortalViewShown === "function") {
    onPortalViewShown(nextViewId);
  }

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

function setTemplateMessage(message, isError = false) {
  if (!templateMessages.length) return;
  templateMessages.forEach((templateMessage) => {
    templateMessage.textContent = message;
    templateMessage.classList.toggle("error", isError);
  });
}

function openTemplateModal() {
  if (!templateModal) return;
  templateModal.hidden = false;
  document.body.classList.add("modal-open");
  setTemplateMessage("");
  loadMediaLibrary().then(updateTemplateHeaderControls).catch(() => updateTemplateHeaderControls());
  setTimeout(() => {
    templateModal.querySelector("[data-template-preset]")?.focus();
  }, 50);
}

function closeTemplateModal() {
  if (!templateModal) return;
  templateModal.hidden = true;
  if (!confirmModal || confirmModal.hidden) {
    document.body.classList.remove("modal-open");
  }
}

let confirmModalResolve = null;

function closeConfirmModal(confirmed = false) {
  if (!confirmModal) return;
  confirmModal.hidden = true;
  if (!templateModal || templateModal.hidden) {
    document.body.classList.remove("modal-open");
  }
  if (confirmModalResolve) {
    confirmModalResolve(confirmed);
    confirmModalResolve = null;
  }
}

function showConfirmModal({ title, message, confirmText = "Confirm", eyebrow = "Confirm action" }) {
  if (!confirmModal) {
    return Promise.resolve(false);
  }

  if (confirmTitle) confirmTitle.textContent = title;
  if (confirmMessage) confirmMessage.textContent = message;
  const eyebrowElement = confirmModal.querySelector("[data-confirm-eyebrow]");
  if (eyebrowElement) eyebrowElement.textContent = eyebrow;
  if (confirmAcceptButton) confirmAcceptButton.textContent = confirmText;

  confirmModal.hidden = false;
  document.body.classList.add("modal-open");

  setTimeout(() => {
    confirmModal.querySelector("[data-confirm-cancel]")?.focus();
  }, 50);

  return new Promise((resolve) => {
    confirmModalResolve = resolve;
  });
}

function setSendMessage(message, isError = false) {
  if (!sendMessageStatus) return;
  sendMessageStatus.textContent = message;
  sendMessageStatus.classList.toggle("error", isError);
}

function setApiMessage(message, isError = false) {
  if (!apiMessage) return;
  apiMessage.textContent = message;
  apiMessage.classList.toggle("error", isError);
}

function setMetaConnectMessage(message, isError = false) {
  if (!metaConnectMessage) return;
  metaConnectMessage.textContent = message;
  metaConnectMessage.classList.toggle("error", isError);
}

function setCoexMessage(message, isError = false) {
  if (!coexMessage) return;
  coexMessage.textContent = message;
  coexMessage.classList.toggle("error", isError);
}

function getInitials(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "IC";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function formatAccountRole(role) {
  if (!role) return "Account";

  return `${String(role)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())} account`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderAuthenticatedProfile(user = {}) {
  const tenant = user.tenant || {};
  const displayName = tenant.businessName || user.name || user.email || "InterCon workspace";
  if (tenant.billing) {
    setupState.billing = {
      ...setupState.billing,
      ...tenant.billing,
      active: isInterconPlanActive(tenant.billing)
    };
  }

  if (profileBusinessName) profileBusinessName.textContent = displayName;
  if (profileRole) profileRole.textContent = formatAccountRole(user.role);
  if (profileAvatar) profileAvatar.textContent = getInitials(displayName);
}

function getSetupSteps() {
  const tenant = setupState.tenant || {};
  const meta = tenant.meta || {};
  const optedInContacts = setupState.contacts.filter((contact) => contact.status === "active" && contact.optIn?.status);
  const approvedTemplates = setupState.templates.filter((template) => template.status === "approved");
  const hasInReviewTemplate = setupState.templates.some((template) => template.status === "in_review");
  const whatsappConnected = tenant.onboardingStatus === "meta_connected" && Boolean(meta.wabaId && meta.phoneNumberId);
  const phoneRegistered = whatsappConnected && isPhoneRegisteredForCloudApi(meta);
  const webhookSubscribed = meta.webhookStatus === "subscribed";
  const contactsReady = optedInContacts.length > 0;
  const templatesReady = approvedTemplates.length > 0;
  const paymentReady = isPaymentReady(meta);
  const paidPlanReady = isInterconPlanActive(setupState.billing);
  const messagingReady = phoneRegistered && webhookSubscribed && contactsReady && templatesReady && paymentReady && paidPlanReady;

  return [
    {
      key: "whatsapp",
      label: "WhatsApp connection",
      href: "#connect",
      action: "Open connection",
      done: phoneRegistered && webhookSubscribed && paymentReady,
      message: !whatsappConnected
        ? "Connect WABA and phone number through Meta Embedded Signup."
        : !phoneRegistered
          ? "Register the connected phone number for Cloud API."
          : !webhookSubscribed
            ? "Confirm the webhook subscription before sending."
            : !paymentReady
              ? "Fix Meta billing or WABA health before sending."
              : "WhatsApp is ready."
    },
    {
      key: "contacts",
      label: "Opted-in contacts",
      href: "#contacts",
      action: "Open contacts",
      done: contactsReady,
      message: "Add at least one active contact with WhatsApp opt-in."
    },
    {
      key: "plan",
      label: "InterCon paid plan",
      href: "#billing",
      action: "Choose plan",
      done: paidPlanReady,
      message: "Activate a paid InterCon plan before template approval and sending."
    },
    {
      key: "templates",
      label: "Approved templates",
      href: "#templates",
      action: "Open templates",
      done: templatesReady,
      message: hasInReviewTemplate
        ? "Wait for at least one template to be approved by Meta."
        : "Submit at least one template for Meta review."
    },
    {
      key: "messaging",
      label: "Ready to send",
      href: "#send-whatsapp",
      action: "Open sender",
      done: messagingReady,
      message: !paidPlanReady
        ? "Activate an InterCon plan before sending messages."
        : !paymentReady
        ? "Fix Meta WABA health before sending messages."
        : "Send approved templates to opted-in contacts."
    }
  ];
}

function isInterconPlanActive(billing = {}) {
  if (!["monthly", "quarterly", "yearly"].includes(billing.plan)) return false;
  if (billing.status !== "active") return false;
  if (!billing.currentPeriodEnd) return true;

  return new Date(billing.currentPeriodEnd).getTime() > Date.now();
}

function formatCurrency(amount, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function formatPlanName(planId) {
  const labels = {
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
    none: "No plan"
  };

  return labels[planId] || "No plan";
}

function formatBillingStatus(status) {
  const labels = {
    not_started: "No plan",
    pending_payment: "Payment pending",
    active: "Active",
    past_due: "Past due",
    cancelled: "Cancelled"
  };

  return labels[status] || "No plan";
}

function isPaymentReady(meta = {}) {
  if (!meta.wabaId) return false;
  if (meta.canSendMessage === "blocked") return false;
  if (String(meta.wabaHealthError || "").toLowerCase().includes("payment")) return false;
  return ["available", "limited"].includes(meta.canSendMessage);
}

function getPaymentStatus(meta = {}) {
  if (!meta.wabaId) {
    return {
      label: "Waiting",
      needsAction: false
    };
  }

  if (isPaymentReady(meta)) {
    return {
      label: "Ready",
      needsAction: false
    };
  }

  if (meta.canSendMessage === "blocked" || String(meta.wabaHealthError || "").toLowerCase().includes("payment")) {
    return {
      label: "Action needed",
      needsAction: true
    };
  }

  return {
    label: "Unknown",
    needsAction: false
  };
}

function isPhoneRegisteredForCloudApi(meta = {}) {
  const phoneStatus = String(meta.phoneStatus || "").toUpperCase();
  const verificationStatus = String(meta.codeVerificationStatus || "").toUpperCase();

  return phoneStatus === "CONNECTED" || verificationStatus === "CONNECTED";
}

function getDisplayNameStatus(meta = {}) {
  const newNameStatus = String(meta.newNameStatus || "").toUpperCase();
  if (newNameStatus && newNameStatus !== "NONE") {
    return newNameStatus;
  }

  return String(meta.nameStatus || "").toUpperCase();
}

function isDisplayNameApproved(meta = {}) {
  return ["APPROVED", "AVAILABLE_WITHOUT_REVIEW"].includes(getDisplayNameStatus(meta));
}

function formatDisplayNameStatus(meta = {}) {
  const status = getDisplayNameStatus(meta);
  const decision = String(meta.displayNameDecision || "").toUpperCase();
  const labels = {
    APPROVED: "Approved",
    PENDING_REVIEW: "Submitted for Review",
    SUBMITTED: "Submitted for Review",
    AVAILABLE_WITHOUT_REVIEW: "Available Without Review",
    DECLINED: "Declined",
    EXPIRED: "Expired",
    NONE: "No New Name Submitted"
  };

  const decisionLabels = {
    APPROVED: "Approved",
    DEFERRED: "Deferred - review pending",
    DECLINED: "Declined",
    NONE: ""
  };
  const statusLabel = labels[status] || (status ? status.replace(/_/g, " ") : "Waiting");
  const decisionLabel = decision && decision !== "NONE"
    ? decisionLabels[decision] || decision.replace(/_/g, " ")
    : "";
  const label = decisionLabel && decisionLabel !== statusLabel
    ? `${statusLabel} (review: ${decisionLabel})`
    : statusLabel;
  const rejection = meta.displayNameRejectionReason && meta.displayNameRejectionReason !== "NONE"
    ? ` (${meta.displayNameRejectionReason})`
    : "";

  return meta.verifiedName ? `${meta.verifiedName} - ${label}${rejection}` : `${label}${rejection}`;
}

function getConnectSteps() {
  const tenant = setupState.tenant || {};
  const meta = tenant.meta || {};
  const metaConnected = tenant.onboardingStatus === "meta_connected" && Boolean(meta.wabaId && meta.phoneNumberId);
  const phoneRegistered = metaConnected && isPhoneRegisteredForCloudApi(meta);
  const webhookSubscribed = meta.webhookStatus === "subscribed";
  const paymentReady = isPaymentReady(meta);

  return [
    {
      key: "meta",
      done: phoneRegistered
    },
    {
      key: "webhook",
      done: phoneRegistered && webhookSubscribed
    },
    {
      key: "billing",
      done: paymentReady
    },
    {
      key: "health",
      done: phoneRegistered && webhookSubscribed && paymentReady
    }
  ];
}

function renderConnectProgress() {
  const steps = getConnectSteps();
  const current = steps.find((step) => !step.done);

  connectStepCards.forEach((card) => {
    const step = steps.find((item) => item.key === card.dataset.connectStep);
    card.classList.toggle("done", Boolean(step?.done));
    card.classList.toggle("active", step?.key === current?.key);
  });
}

function formatHealthLabel(status, error = "") {
  if (error) return error;

  const labels = {
    available: "Available",
    limited: "Limited",
    blocked: "Blocked",
    unknown: "Unknown",
    waiting: "Waiting"
  };

  return labels[String(status || "unknown").toLowerCase()] || String(status || "Unknown");
}

function updateConnectHeader({ isMetaConnected, hasPartialMetaConnection, isPhoneRegistered, webhookSubscribed, paymentStatus }) {
  const isReady = isMetaConnected && isPhoneRegistered && webhookSubscribed && paymentStatus.ready;

  if (metaConnectState) {
    metaConnectState.textContent = isReady ? "Ready" : hasPartialMetaConnection ? "Needs action" : "Not connected";
    metaConnectState.classList.toggle("approved", isReady);
    metaConnectState.classList.toggle("warning", !isReady);
  }

  connectWhatsAppButtons.forEach((button) => {
    button.hidden = false;
    button.textContent = hasPartialMetaConnection && !isMetaConnected
      ? "Finish Meta setup"
      : "Register New WhatsApp";
  });
}

function renderSetupProgress() {
  if (!setupProgressCount || !setupProgressBar || !setupCurrentStep || !setupCurrentMessage) return;

  const steps = getSetupSteps();
  const completed = steps.filter((step) => step.done).length;
  const current = steps.find((step) => !step.done) || steps[steps.length - 1];
  const percent = Math.round((completed / steps.length) * 100);

  setupProgressCount.textContent = `${completed} of ${steps.length} completed`;
  setupProgressCount.classList.toggle("warning", completed < steps.length);
  setupProgressCount.classList.toggle("approved", completed === steps.length);
  setupProgressBar.style.width = `${percent}%`;
  setupCurrentStep.textContent = current.label;
  setupCurrentMessage.textContent = current.message;
  if (setupCurrentLink) {
    setupCurrentLink.href = current.href || "#connect";
    setupCurrentLink.textContent = current.action || "Open next step";
  }

  setupStepCards.forEach((card) => {
    const step = steps.find((item) => item.key === card.dataset.setupStep);
    card.classList.toggle("done", Boolean(step?.done));
    card.classList.toggle("active", step?.key === current.key && !step.done);
  });

  renderConnectProgress();
}

function renderOverviewStats() {
  const optedInContacts = setupState.contacts.filter((contact) => contact.status === "active" && contact.optIn?.status);
  const approvedTemplates = setupState.templates.filter((template) => template.status === "approved");
  const pendingTemplates = setupState.templates.filter((template) => ["draft", "in_review"].includes(template.status));
  const rejectedTemplates = setupState.templates.filter((template) => template.status === "rejected");
  const failedMessages = setupState.messages.filter((message) => message.status === "failed");

  if (statContacts) statContacts.textContent = String(optedInContacts.length);
  if (statContactsDetail) statContactsDetail.textContent = `${setupState.contacts.length} total contacts`;
  if (statTemplates) statTemplates.textContent = String(approvedTemplates.length);
  if (statTemplatesDetail) statTemplatesDetail.textContent = `${pendingTemplates.length} pending review`;
  if (statPendingTemplates) statPendingTemplates.textContent = String(pendingTemplates.length);
  if (statPendingTemplatesDetail) statPendingTemplatesDetail.textContent = `${rejectedTemplates.length} rejected`;
  if (statMessages) statMessages.textContent = String(failedMessages.length);
  if (statMessagesDetail) statMessagesDetail.textContent = `${setupState.messages.length} total sends`;
}

function renderBilling() {
  const billing = setupState.billing || {};
  const active = isInterconPlanActive(billing);
  const selectedPlan = setupState.plans.find((plan) => plan.id === billing.plan);

  if (billingStatus) {
    billingStatus.textContent = active ? "Active" : formatBillingStatus(billing.status);
    billingStatus.classList.toggle("approved", active);
    billingStatus.classList.toggle("warning", !active);
  }

  if (billingCurrentPlan) {
    billingCurrentPlan.textContent = selectedPlan
      ? `${selectedPlan.name} - ${formatCurrency(selectedPlan.amount, selectedPlan.currency)}`
      : "No active plan";
  }

  if (billingMessage) {
    billingMessage.classList.remove("error");
    billingMessage.textContent = active
      ? "Your InterCon platform plan is active. Template submission and WhatsApp sending are unlocked."
      : billing.status === "pending_payment"
        ? "Plan selected. Complete payment confirmation with InterCon to activate template submission and WhatsApp sending."
        : "Choose a paid InterCon plan when you are ready to submit templates or send WhatsApp messages.";
  }

  if (billingPlanGrid) {
    if (!setupState.plans.length) {
      billingPlanGrid.innerHTML = `<div class="empty-row">No plans configured.</div>`;
    } else {
      billingPlanGrid.innerHTML = setupState.plans.map((plan) => {
        const isSelected = plan.id === billing.plan;
        const isActive = isSelected && active;
        const buttonText = isActive ? "Active plan" : isSelected && billing.status === "pending_payment" ? "Pay now" : "Pay now";

        return `
          <article class="billing-plan-card ${isSelected ? "selected" : ""}">
            <span>${plan.name}</span>
            <strong>${formatCurrency(plan.amount, plan.currency)}</strong>
            <small>${plan.interval === "quarter" ? "Every 3 months" : `Per ${plan.interval}`}</small>
            <button class="btn ${isSelected ? "btn-outline" : ""}" type="button" data-select-plan="${plan.id}" ${isActive ? "disabled" : ""}>${buttonText}</button>
          </article>
        `;
      }).join("");
    }
  }

  renderSetupProgress();
}

async function loadBilling() {
  const data = await requestJson("/api/billing");
  setupState.billing = {
    ...(data.billing || {}),
    active: isInterconPlanActive(data.billing || {})
  };
  setupState.plans = data.plans || [];
  renderBilling();
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayCheckoutPromise) return razorpayCheckoutPromise;

  razorpayCheckoutPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout"));
    document.head.appendChild(script);
  });

  return razorpayCheckoutPromise;
}

async function startRazorpayPayment(planId) {
  if (billingMessage) {
    billingMessage.classList.remove("error");
    billingMessage.textContent = "Creating secure Razorpay order...";
  }

  const orderData = await requestJson("/api/billing/select-plan", {
    method: "POST",
    body: JSON.stringify({ plan: planId })
  });
  setupState.billing = {
    ...(orderData.billing || {}),
    active: isInterconPlanActive(orderData.billing || {})
  };
  renderBilling();

  if (!orderData.checkout) {
    throw new Error("Razorpay checkout details were not returned");
  }

  const Razorpay = await loadRazorpayCheckout();

  return new Promise((resolve, reject) => {
    const checkout = new Razorpay({
      key: orderData.checkout.key,
      amount: orderData.checkout.amount,
      currency: orderData.checkout.currency,
      name: orderData.checkout.name,
      description: orderData.checkout.description,
      order_id: orderData.checkout.orderId,
      prefill: orderData.checkout.prefill || {},
      theme: {
        color: "#0f9f6e"
      },
      handler: async (response) => {
        try {
          if (billingMessage) {
            billingMessage.textContent = "Verifying payment...";
          }
          const verified = await requestJson("/api/billing/verify-payment", {
            method: "POST",
            body: JSON.stringify(response)
          });
          setupState.billing = {
            ...(verified.billing || {}),
            active: isInterconPlanActive(verified.billing || {})
          };
          renderBilling();
          if (billingMessage) {
            billingMessage.textContent = verified.message || "Payment verified. Your InterCon plan is active.";
          }
          resolve(verified);
        } catch (error) {
          reject(error);
        }
      },
      modal: {
        ondismiss() {
          reject(new Error("Payment was not completed"));
        }
      }
    });

    checkout.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || response.error?.reason || "Razorpay payment failed"));
    });
    checkout.open();
  });
}

function requirePaidPlanBeforeAction(messageSetter) {
  if (isInterconPlanActive(setupState.billing)) return true;

  const message = "Choose and activate an InterCon paid plan before using this action.";
  messageSetter(message, true);
  showPortalView("billing");
  return false;
}

async function requestJson(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };
  const response = await fetch(url, {
    credentials: "include",
    ...options,
    headers
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.details = data.details || data.error || null;
    throw error;
  }

  return data;
}

async function loadAuthenticatedProfile() {
  const data = await requestJson("/api/auth/me");
  renderAuthenticatedProfile(data.user || {});
}

function parseEmbeddedSignupMessage(event) {
  if (!String(event.origin || "").endsWith("facebook.com")) {
    return null;
  }

  let payload = event.data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (error) {
      return null;
    }
  }

  if (payload?.type !== "WA_EMBEDDED_SIGNUP") {
    return null;
  }

  return payload;
}

function isCompletedEmbeddedSignupPayload(payload) {
  const data = payload?.data || {};
  return Boolean(
    payload?.event === "FINISH" ||
    data.waba_id ||
    data.wabaId ||
    data.whatsapp_business_account_id ||
    data.business_id ||
    data.businessId
  );
}

function resolveEmbeddedSignupSessionInfo(payload) {
  embeddedSignupSessionResolvers.forEach((resolve) => resolve(payload));
  embeddedSignupSessionResolvers = [];
  embeddedSignupSessionRejecters = [];
}

function rejectEmbeddedSignupSessionInfo(error) {
  embeddedSignupSessionRejecters.forEach((reject) => reject(error));
  embeddedSignupSessionResolvers = [];
  embeddedSignupSessionRejecters = [];
}

function waitForEmbeddedSignupSessionInfo(timeoutMs = 8000) {
  if (isCompletedEmbeddedSignupPayload(embeddedSignupSessionInfo)) {
    return Promise.resolve(embeddedSignupSessionInfo);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      embeddedSignupSessionResolvers = embeddedSignupSessionResolvers.filter((item) => item !== resolveSession);
      embeddedSignupSessionRejecters = embeddedSignupSessionRejecters.filter((item) => item !== rejectSession);
      reject(new Error("Meta signup details were not received. Please complete the full Embedded Signup flow and try again."));
    }, timeoutMs);

    function resolveSession(payload) {
      clearTimeout(timer);
      resolve(payload);
    }

    function rejectSession(error) {
      clearTimeout(timer);
      reject(error);
    }

    embeddedSignupSessionResolvers.push(resolveSession);
    embeddedSignupSessionRejecters.push(rejectSession);
  });
}

window.addEventListener("message", (event) => {
  const payload = parseEmbeddedSignupMessage(event);
  if (!payload) return;

  embeddedSignupSessionInfo = payload;

  if (payload.event === "CANCEL") {
    const error = new Error(payload.data?.error_message || "Embedded Signup was cancelled.");
    rejectEmbeddedSignupSessionInfo(error);
    setMetaConnectMessage(error.message, true);
    return;
  }

  if (isCompletedEmbeddedSignupPayload(payload)) {
    resolveEmbeddedSignupSessionInfo(payload);
    setMetaConnectMessage("Meta signup details received. Complete the login popup to finish connection.");
  }
});

async function loadFacebookSdk() {
  if (facebookSdk) {
    return facebookSdk;
  }

  if (facebookSdkPromise) {
    return facebookSdkPromise;
  }

  facebookSdkPromise = requestJson("/api/meta/facebook-sdk-config")
    .then((data) => data.config)
    .then((config) => new Promise((resolve, reject) => {
      window.fbAsyncInit = function () {
        window.FB.init({
          appId: config.appId,
          autoLogAppEvents: true,
          cookie: true,
          xfbml: true,
          version: config.version || "v25.0"
        });
        facebookSdk = { FB: window.FB, config };
        resolve(facebookSdk);
      };

      const existingScript = document.getElementById("facebook-jssdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          facebookSdk = { FB: window.FB, config };
          resolve(facebookSdk);
        });
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Facebook SDK")));
        return;
      }

      const firstScript = document.getElementsByTagName("script")[0];
      const sdkScript = document.createElement("script");
      sdkScript.id = "facebook-jssdk";
      sdkScript.async = true;
      sdkScript.defer = true;
      sdkScript.crossOrigin = "anonymous";
      sdkScript.src = "https://connect.facebook.net/en_US/sdk.js";
      sdkScript.onerror = () => reject(new Error("Unable to load Facebook SDK"));
      firstScript.parentNode.insertBefore(sdkScript, firstScript);
    }));

  return facebookSdkPromise;
}

function launchEmbeddedSignup(FB, config, overrides = {}) {
  if (window.location.protocol !== "https:") {
    let securePortalUrl = "";

    try {
      securePortalUrl = config.redirectUri ? `${new URL(config.redirectUri).origin}/customer#connect` : "";
    } catch (error) {
      securePortalUrl = "";
    }

    throw new Error(
      securePortalUrl
        ? `Meta login requires HTTPS. Open ${securePortalUrl} and connect again.`
        : "Meta login requires HTTPS. Open the portal through your HTTPS ngrok URL and connect again."
    );
  }

  const extras = getEmbeddedSignupExtras(config, overrides);

  return new Promise((resolve) => {
    FB.login(resolve, {
      config_id: config.loginConfigId,
      response_type: "code",
      override_default_response_type: true,
      return_scopes: true,
      extras
    });
  });
}

function getEmbeddedSignupExtras(config, overrides = {}) {
  const configuredExtras = config.loginExtras && typeof config.loginExtras === "object"
    ? config.loginExtras
    : {};
  const extras = {
    ...configuredExtras,
    setup: configuredExtras.setup && typeof configuredExtras.setup === "object" ? configuredExtras.setup : {},
    sessionInfoVersion: "3"
  };

  // Optional Meta feature flow override (empty = standard Cloud API onboarding).
  if (overrides.featureType) {
    extras.featureType = overrides.featureType;
  } else if (!Object.prototype.hasOwnProperty.call(extras, "featureType")) {
    extras.featureType = "";
  }

  return extras;
}

function redirectToManualEmbeddedSignup(config) {
  throw new Error("Meta Embedded Signup must be completed through the Facebook JavaScript SDK popup. Use a normal browser window with Facebook cookies enabled, then try again.");
}

function getMetaLoginFailureMessage(loginResponse) {
  const authResponse = loginResponse?.authResponse || {};
  const errorMessage = loginResponse?.error_message || loginResponse?.error?.message;
  const errorReason = loginResponse?.error_reason || loginResponse?.error;
  const status = loginResponse?.status || "unknown";
  const authKeys = Object.keys(authResponse);
  const details = [
    `status=${status}`,
    errorReason ? `reason=${errorReason}` : "",
    errorMessage ? `message=${errorMessage}` : "",
    authKeys.length ? `authResponse=${authKeys.join(",")}` : "authResponse=missing"
  ].filter(Boolean).join("; ");

  console.warn("Meta Embedded Signup login response did not include code", loginResponse);

  if (status === "unknown" && !loginResponse?.authResponse) {
    return `Meta did not return an authorization code (${details}). Open the portal in a normal Chrome window, allow Facebook/third-party cookies for this site, log into Facebook there, and try Connect with Meta again.`;
  }

  return `Meta did not return an authorization code (${details}). Finish the Meta popup with Complete it, and make sure the app Login for Business configuration uses WhatsApp Embedded Signup with code response enabled.`;
}

function escapeText(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function formatMessagingLimitTier(tier) {
  const normalized = String(tier || "").toUpperCase();
  const labels = {
    TIER_50: "50 / 24h",
    TIER_250: "250 / 24h",
    TIER_1K: "1,000 / 24h",
    TIER_10K: "10,000 / 24h",
    TIER_100K: "100,000 / 24h",
    TIER_UNLIMITED: "Unlimited"
  };

  return labels[normalized] || (normalized ? normalized.replace(/_/g, " ") : "");
}

function getQualityRatingDisplay(value) {
  const normalized = String(value || "").toUpperCase();
  const ratings = {
    GREEN: { label: "High", cls: "approved" },
    HIGH: { label: "High", cls: "approved" },
    YELLOW: { label: "Medium", cls: "pending" },
    MEDIUM: { label: "Medium", cls: "pending" },
    RED: { label: "Low", cls: "rejected" },
    LOW: { label: "Low", cls: "rejected" },
    UNKNOWN: { label: "Unknown", cls: "pending" }
  };

  return ratings[normalized] || { label: normalized ? normalized.replace(/_/g, " ") : "Unknown", cls: "pending" };
}

function renderWabaTable() {
  const host = document.querySelector("[data-waba-table]");
  if (!host) return;

  const tenant = setupState.tenant || {};
  const meta = tenant.meta || {};

  if (!meta.wabaId && !meta.phoneNumberId) {
    host.innerHTML = '<div class="empty-row">No WhatsApp number connected yet. Click "Register New WhatsApp" to onboard.</div>';
    return;
  }

  const connected = tenant.onboardingStatus === "meta_connected" && Boolean(meta.phoneNumberId);
  const healthMap = {
    available: { label: "Available", cls: "approved" },
    limited: { label: "Limited", cls: "pending" },
    blocked: { label: "Blocked", cls: "rejected" }
  };
  const health = healthMap[String(meta.canSendMessage || "").toLowerCase()]
    || { label: connected ? "Unknown" : "Pending", cls: "pending" };
  const healthTitle = meta.wabaHealthError ? ` title="${escapeText(meta.wabaHealthError)}"` : "";
  const quality = getQualityRatingDisplay(meta.qualityRating);
  const qualityTitle = meta.qualityRating ? ` title="Meta quality_rating: ${escapeText(meta.qualityRating)}"` : "";
  const webhookOk = meta.webhookStatus === "subscribed";
  const webhookLabel = webhookOk ? "Subscribed" : meta.webhookStatus === "not_subscribed" ? "Not subscribed" : "NA";
  const messagingLimit = formatMessagingLimitTier(meta.messagingLimitTier) || (connected ? "250 / 24h" : "—");
  const configured = meta.connectedAt ? new Date(meta.connectedAt).toLocaleString() : "—";

  host.innerHTML = `
    <div class="table-row waba-row">
      <strong>${escapeText(meta.displayPhoneNumber || meta.phoneNumberId || "—")}</strong>
      <span data-label="PhoneNumber Id">${escapeText(meta.phoneNumberId || "—")}</span>
      <span data-label="WABA BusinessId">${escapeText(meta.wabaId || "—")}</span>
      <span data-label="BSP Name">InterCon</span>
      <span data-label="Messaging Limit">${escapeText(messagingLimit)}</span>
      <span data-label="Quality Rating"><em class="${quality.cls}"${qualityTitle}>${escapeText(quality.label)}</em></span>
      <span data-label="Health"><em class="${health.cls}"${healthTitle}>${escapeText(health.label)}</em></span>
      <span data-label="Display Name">${escapeText(meta.verifiedName || "—")}</span>
      <span data-label="ConfigureDate">${escapeText(configured)}</span>
      <span data-label="Webhook"><em class="${webhookOk ? "approved" : "pending"}">${webhookLabel}</em></span>
      <span class="waba-row-actions" data-label="Actions">
        <button class="waba-action" type="button" data-waba-refresh title="Refresh" aria-label="Refresh"><span class="waba-action-icon" aria-hidden="true">&#x21bb;</span><span class="waba-action-label">Refresh</span></button>
        <button class="waba-action danger" type="button" data-waba-delete title="Delete connected WABA" aria-label="Delete connected WABA"><span class="waba-action-icon" aria-hidden="true">&times;</span><span class="waba-action-label">Delete</span></button>
      </span>
    </div>`;
}

function renderOnboardingStatus(tenant) {
  setupState.tenant = tenant || null;
  if (tenant?.billing) {
    setupState.billing = {
      ...setupState.billing,
      ...tenant.billing,
      active: isInterconPlanActive(tenant.billing)
    };
    renderBilling();
  }
  const meta = tenant?.meta || {};
  const isMetaConnected = tenant?.onboardingStatus === "meta_connected" && Boolean(meta.phoneNumberId);
  const hasPartialMetaConnection = Boolean(meta.wabaId);
  const isPhoneRegistered = isPhoneRegisteredForCloudApi(meta);
  const webhookSubscribed = meta.webhookStatus === "subscribed";
  // A pending/unverified business still sends at Tier 1 — Meta only returns an
  // advisory (businessHealthError) prompting verification to RAISE the limit.
  // Treat it as a blocking error only when Meta has actually blocked the business.
  const businessLimited = ["blocked", "restricted"].includes(meta.businessHealthStatus);

  if (metaWabaId) metaWabaId.textContent = meta.wabaId || "Not connected";
  if (metaPhoneNumberId) metaPhoneNumberId.textContent = meta.displayPhoneNumber || meta.phoneNumberId || "Not connected";
  if (metaPhoneStatus) metaPhoneStatus.textContent = isPhoneRegistered ? "Registered" : meta.codeVerificationStatus || meta.phoneStatus || "Waiting";
  if (metaDisplayNameStatus) metaDisplayNameStatus.textContent = formatDisplayNameStatus(meta);
  if (metaWebhookStatus) {
    const webhookLabels = {
      subscribed: "Subscribed",
      not_subscribed: "Not subscribed",
      unknown: "Unknown",
      waiting: "Waiting"
    };
    metaWebhookStatus.textContent = webhookLabels[meta.webhookStatus] || (meta.wabaId ? "Unknown" : "Waiting");
  }
  const paymentStatus = getPaymentStatus(meta);
  paymentStatus.ready = isPaymentReady(meta);
  if (metaPaymentStatus) metaPaymentStatus.textContent = paymentStatus.label;
  if (metaHealthStatus) metaHealthStatus.textContent = formatHealthLabel(meta.canSendMessage, meta.wabaHealthError);
  if (metaConversationTier) {
    metaConversationTier.textContent = isMetaConnected
      ? "Tier 1 - 250 conversations / 24h"
      : "Waiting";
  }
  if (metaPaymentAction) metaPaymentAction.hidden = !paymentStatus.needsAction;
  if (metaRegisterPhoneButton) {
    metaRegisterPhoneButton.hidden = !meta.phoneNumberId;
    metaRegisterPhoneButton.textContent = isPhoneRegistered ? "Sync registration" : "Register";
  }
  updateConnectHeader({ isMetaConnected, hasPartialMetaConnection, isPhoneRegistered, webhookSubscribed, paymentStatus });

  if (isMetaConnected && !isPhoneRegistered) {
    setMetaConnectMessage("Phone number is connected but not registered for Cloud API. Click Register before sending messages.", true);
  } else if (businessLimited) {
    setMetaConnectMessage(meta.businessHealthError || "Meta reports a business-level block. Check WABA health and billing before sending.", true);
  } else if (isMetaConnected) {
    // Healthy, connected and registered — clear the area so it only ever
    // carries genuine errors or important prompts, not a standing status line.
    setMetaConnectMessage("");
  } else if (meta.lastSignupError) {
    setMetaConnectMessage(meta.lastSignupError, true);
  } else if (hasPartialMetaConnection) {
    setMetaConnectMessage("Meta signup was saved, but the WhatsApp phone number is not connected yet. Complete phone number selection or verification in Meta and connect again.", true);
  }

  if (coexState) {
    const coexConnected = isMetaConnected && meta.onboardingType === "coexistence";
    coexState.textContent = coexConnected ? "Connected" : "Ready";
    coexState.classList.toggle("approved", coexConnected);
  }

  renderSetupProgress();
  renderWabaTable();
}

async function loadOnboardingStatus() {
  const data = await requestJson("/api/meta/onboarding");
  renderOnboardingStatus(data.tenant);
}

async function refreshPhoneStatus() {
  setMetaConnectMessage("Refreshing phone status...");
  await requestJson("/api/meta/phone/status");
  await loadOnboardingStatus();
  setMetaConnectMessage("Phone status refreshed.");
}

async function deleteConnectedWaba() {
  const confirmed = await showConfirmModal({
    eyebrow: "Connected WABA",
    title: "Remove this WABA from InterCon?",
    message: "This only disconnects it from InterCon and deletes local synced templates, message history, and webhook logs. The WABA, phone number, and templates in Meta Business Manager will not be deleted.",
    confirmText: "Remove WABA"
  });
  if (!confirmed) return;

  setMetaConnectMessage("Deleting connected WABA data...");
  const data = await requestJson("/api/meta/onboarding", {
    method: "DELETE"
  });
  renderOnboardingStatus(data.tenant);
  setupState.templates = [];
  setupState.messages = [];
  renderTemplateStatusRows([]);
  renderSendHistory([]);
  await Promise.all([
    loadTemplates().catch(() => null),
    loadApprovedTemplates().catch(() => null)
  ]);
  setMetaConnectMessage(data.message || "Connected WABA data deleted.");
}

async function registerPhoneNumber() {
  setMetaConnectMessage("Syncing phone registration with Cloud API...");
  await requestJson("/api/meta/phone/register", {
    method: "POST",
    body: JSON.stringify({})
  });
  await loadOnboardingStatus();
  setMetaConnectMessage("Phone registration synced. Try sending again.");
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

  contactList.innerHTML = contacts.map((contact) => {
    const group = contact.group || null;
    const contactLabel = contact.name || contact.phone || "";
    return `
      <div class="table-row contact-table-row contact-list-row">
        <strong>${escapeHtml(contact.name || "")}</strong>
        <span data-label="Phone">${escapeHtml(contact.phone || "")}</span>
        <span data-label="Opt-in"><em class="${contact.optIn?.status ? "approved" : "pending"}">${contact.optIn?.status ? "Yes" : "Missing"}</em></span>
        <span data-label="Tag">${contact.tags?.[0] ? `<code class="contact-tag-value">#${escapeHtml(contact.tags[0])}</code>` : "-"}</span>
        <span class="contact-group-cell" data-label="Group">
          <span class="contact-group-value${group ? " has-group" : ""}" title="${escapeHtml(group?.name || "No group assigned")}">
            <span class="contact-group-dot" aria-hidden="true"></span>
            <strong>${escapeHtml(group?.name || "No group")}</strong>
          </span>
          <button
            type="button"
            class="contact-group-assign"
            data-assign-groups="${escapeHtml(contact._id)}"
            data-contact-name="${escapeHtml(contactLabel)}"
            aria-label="Assign group for ${escapeHtml(contactLabel)}"
            title="Assign group">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5M3 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2m4-6v6m-3-3h6"/></svg>
          </button>
        </span>
      </div>
    `;
  }).join("");
}

function renderSendContactOptions(contacts) {
  if (!sendContactList) return;
  const optedInContacts = contacts.filter((contact) => contact.status === "active" && contact.optIn?.status);
  const availableIds = new Set(optedInContacts.map((contact) => String(contact._id)));
  sendRecipientState.contactIds.forEach((contactId) => {
    if (!availableIds.has(contactId)) sendRecipientState.contactIds.delete(contactId);
  });
  const search = sendRecipientState.search.toLowerCase();
  const visibleContacts = optedInContacts.filter((contact) => (
    !search
    || String(contact.name || "").toLowerCase().includes(search)
    || String(contact.phone || "").includes(search)
    || String(contact.group?.name || "").toLowerCase().includes(search)
  ));

  if (!optedInContacts.length) {
    sendContactList.innerHTML = `<div class="send-recipient-empty">No active opted-in contacts available.</div>`;
    updateSendRecipientSummary();
    return;
  }

  if (!visibleContacts.length) {
    sendContactList.innerHTML = `<div class="send-recipient-empty">No contacts match this search.</div>`;
    updateSendRecipientSummary();
    return;
  }

  sendContactList.innerHTML = visibleContacts.map((contact) => {
    const contactId = String(contact._id);
    const groupSelected = contact.group?.id && sendRecipientState.groupIds.has(String(contact.group.id));
    return `
      <label class="send-recipient-option${groupSelected ? " is-covered" : ""}">
        <input type="checkbox" value="${escapeHtml(contactId)}" data-send-contact-choice
          ${sendRecipientState.contactIds.has(contactId) ? "checked" : ""}>
        <span class="send-recipient-avatar">${escapeHtml(getInitials(contact.name || contact.phone || "?"))}</span>
        <span class="send-recipient-copy">
          <strong>${escapeHtml(contact.name || contact.phone || "Customer")}</strong>
          <small>${escapeHtml(contact.phone || "")}${contact.group?.name ? ` · ${escapeHtml(contact.group.name)}` : ""}</small>
        </span>
        ${groupSelected ? `<em>Via group</em>` : ""}
      </label>`;
  }).join("");
  updateSendRecipientSummary();
  updateWhatsAppPreview();
}

function renderSendGroupOptions(groups = setupState.groups) {
  if (!sendGroupList) return;
  const availableIds = new Set(groups.map((group) => String(group._id)));
  sendRecipientState.groupIds.forEach((groupId) => {
    if (!availableIds.has(groupId)) sendRecipientState.groupIds.delete(groupId);
  });
  const search = sendRecipientState.search.toLowerCase();
  const visibleGroups = groups.filter((group) => (
    !search
    || String(group.name || "").toLowerCase().includes(search)
    || String(group.tag || "").toLowerCase().includes(search)
  ));

  if (!groups.length) {
    sendGroupList.innerHTML = `<div class="send-recipient-empty">No groups created yet.</div>`;
  } else if (!visibleGroups.length) {
    sendGroupList.innerHTML = `<div class="send-recipient-empty">No groups match this search.</div>`;
  } else {
    sendGroupList.innerHTML = visibleGroups.map((group) => {
      const groupId = String(group._id);
      return `
        <label class="send-recipient-option send-group-option">
          <input type="checkbox" value="${escapeHtml(groupId)}" data-send-group-choice
            ${sendRecipientState.groupIds.has(groupId) ? "checked" : ""}>
          <span class="send-recipient-avatar group">${escapeHtml(getInitials(group.name || "G"))}</span>
          <span class="send-recipient-copy">
            <strong>${escapeHtml(group.name || "Group")}</strong>
            <small>${Number(group.memberCount || 0)} member${Number(group.memberCount || 0) === 1 ? "" : "s"} · #${escapeHtml(group.tag || "")}</small>
          </span>
        </label>`;
    }).join("");
  }
  renderSendContactOptions(setupState.contacts);
}

function getSelectedSendContacts() {
  return setupState.contacts.filter((contact) => {
    if (contact.status !== "active" || !contact.optIn?.status) return false;
    return sendRecipientState.contactIds.has(String(contact._id))
      || (contact.group?.id && sendRecipientState.groupIds.has(String(contact.group.id)));
  });
}

function getSendRecipientEstimate() {
  const selectedGroups = setupState.groups.filter((group) => sendRecipientState.groupIds.has(String(group._id)));
  const groupMemberEstimate = selectedGroups.reduce((total, group) => total + Number(group.memberCount || 0), 0);
  const directOutsideGroups = setupState.contacts.filter((contact) => (
    sendRecipientState.contactIds.has(String(contact._id))
    && !(contact.group?.id && sendRecipientState.groupIds.has(String(contact.group.id)))
  )).length;
  return groupMemberEstimate + directOutsideGroups;
}

function isSendMediaReady() {
  const selectedTemplate = sendTemplateSelect?.selectedOptions?.[0];
  const headerType = selectedTemplate?.dataset.headerType || "none";
  return headerType === "none" || Boolean(sendMediaSelect?.value);
}

function updateSendRecipientSummary() {
  const estimatedCount = getSendRecipientEstimate();
  const hasGroups = sendRecipientState.groupIds.size > 0;
  if (sendRecipientCount) {
    sendRecipientCount.textContent = estimatedCount
      ? `${estimatedCount}${hasGroups ? " estimated" : ""} recipient${estimatedCount === 1 ? "" : "s"}`
      : "0 selected";
  }
  if (sendSubmitButton) {
    const ready = estimatedCount > 0
      && Boolean(sendTemplateSelect?.value)
      && isSendMediaReady()
      && areSendVariablesReady();
    sendSubmitButton.disabled = !ready;
    sendSubmitButton.textContent = estimatedCount
      ? `Send to ${estimatedCount}${hasGroups ? "+" : ""} recipient${estimatedCount === 1 ? "" : "s"}`
      : "Select recipients";
  }
}

async function loadContacts() {
  if (!contactList) return;
  const data = await requestJson("/api/contacts");
  setupState.contacts = data.contacts || [];
  renderContactRows(data.contacts || []);
  renderSendContactOptions(data.contacts || []);
  renderSetupProgress();
  renderOverviewStats();
}

function renderApprovedTemplateOptions(templates) {
  if (!sendTemplateSelect) return;

  if (!templates.length) {
    sendTemplateSelect.innerHTML = `<option value="">No approved templates available</option>`;
    sendTemplateSelect.disabled = true;
    if (sendVariableHint) sendVariableHint.textContent = "No approved templates available.";
    renderSendMediaOptions();
    updateWhatsAppPreview();
    return;
  }

  const options = [
    `<option value="">Select approved template</option>`,
    ...templates.map((template) => {
      const headerType = template.headerType || "none";
      const formatLabel = headerType === "none" ? "Plain" : `${headerType[0].toUpperCase()}${headerType.slice(1)} header`;
      return `<option value="${escapeHtml(template.name)}" data-category="${escapeHtml(template.category)}" data-language="${escapeHtml(template.language)}" data-parameter-count="${Number(template.parameterCount || 0)}" data-body="${escapeHtml(template.body || "")}" data-header-type="${escapeHtml(headerType)}" data-header-media-id="${escapeHtml(template.headerMediaId || "")}">${escapeHtml(template.name)} · ${escapeHtml(formatLabel)} · ${escapeHtml(template.category)} (${escapeHtml(template.language)})</option>`;
    })
  ].join("");

  sendTemplateSelect.disabled = false;
  sendTemplateSelect.innerHTML = options;
  updateSendVariableHint();
  updateWhatsAppPreview();
}

function disableApprovedTemplateSelect(message = "No approved templates available") {
  if (!sendTemplateSelect) return;

  sendTemplateSelect.innerHTML = `<option value="">${escapeHtml(message)}</option>`;
  sendTemplateSelect.disabled = true;

  if (sendVariableHint) {
    sendVariableHint.textContent = message;
  }

  renderSendMediaOptions();
  updateWhatsAppPreview();
}

async function loadApprovedTemplates() {
  if (!sendTemplateSelect) return;

  try {
    const data = await requestJson("/api/templates/approved");
    renderApprovedTemplateOptions(data.templates || []);
  } catch (error) {
    disableApprovedTemplateSelect("No approved templates available");
  }
}

function isCompatibleWhatsAppMedia(asset, type, approvalSample = false) {
  if (!asset || asset.mediaType !== type) return false;
  const mimeType = String(asset.mimeType || "").toLowerCase();
  const maximumBytes = type === "image" ? 5 * 1024 * 1024 : 16 * 1024 * 1024;
  const withinSizeLimit = Number(asset.bytes || 0) <= maximumBytes;
  if (type === "image") {
    return ["image/jpeg", "image/png"].includes(mimeType) && withinSizeLimit;
  }
  return (approvalSample ? ["video/mp4"] : ["video/mp4", "video/3gpp"]).includes(mimeType)
    && withinSizeLimit;
}

function renderSendMediaOptions() {
  if (!sendMediaField || !sendMediaSelect) return;
  const selectedTemplate = sendTemplateSelect?.selectedOptions?.[0];
  const headerType = selectedTemplate?.dataset.headerType || "none";
  const defaultMediaId = selectedTemplate?.dataset.headerMediaId || "";
  const previousMediaId = sendMediaSelect.value;

  if (!sendTemplateSelect?.value || headerType === "none") {
    sendMediaField.hidden = true;
    sendMediaSelect.required = false;
    sendMediaSelect.disabled = true;
    sendMediaSelect.innerHTML = `<option value="">No media required</option>`;
    updateSendRecipientSummary();
    if (previewMedia) {
      previewMedia.hidden = true;
      previewMedia.innerHTML = "";
    }
    return;
  }

  const assets = mediaState.assets.filter((asset) => isCompatibleWhatsAppMedia(asset, headerType));
  sendMediaField.hidden = false;
  sendMediaSelect.required = true;
  sendMediaSelect.disabled = !assets.length;
  sendMediaSelect.innerHTML = [
    `<option value="">Choose ${escapeHtml(headerType)}</option>`,
    ...assets.map((asset) => (
      `<option value="${escapeHtml(asset.mediaId)}" data-url="${escapeHtml(asset.url)}" data-media-type="${escapeHtml(asset.mediaType)}">${escapeHtml(asset.title)} · ${escapeHtml(formatMediaBytes(asset.bytes))}</option>`
    ))
  ].join("");

  const preferredMediaId = assets.some((asset) => asset.mediaId === previousMediaId)
    ? previousMediaId
    : defaultMediaId;
  if (assets.some((asset) => asset.mediaId === preferredMediaId)) {
    sendMediaSelect.value = preferredMediaId;
  }
  if (sendMediaHint) {
    sendMediaHint.textContent = assets.length
      ? `Required ${headerType} header. The selected Cloudinary asset is sent with this approved template.`
      : `No compatible ${headerType} found. Add one in Media Library first.`;
  }
  updateSendRecipientSummary();
}

function updateSendVariableHint() {
  if (!sendTemplateSelect || !sendVariableHint) return;

  const selectedOption = sendTemplateSelect.selectedOptions?.[0];
  const parameterCount = Number(selectedOption?.dataset.parameterCount || 0);
  const language = selectedOption?.dataset.language || "";
  const templateKey = `${sendTemplateSelect.value}:${language}:${parameterCount}`;

  if (sendLanguageSelect && language) {
    sendLanguageSelect.value = language;
  }
  renderSendMediaOptions();

  if (!sendTemplateSelect.value) {
    sendVariableHint.textContent = "Select a template to see required variables.";
    sendVariableDataState.templateKey = "";
    sendVariableDataState.parameterCount = 0;
    sendVariableDataState.rows = [];
    sendVariableDataState.fileName = "";
    renderSendVariableEditor();
    updateWhatsAppPreview();
    return;
  }

  if (!parameterCount) {
    sendVariableHint.textContent = "This template has no variables, so no recipient data file is required.";
    sendVariableDataState.templateKey = templateKey;
    sendVariableDataState.parameterCount = 0;
    sendVariableDataState.rows = [];
    sendVariableDataState.fileName = "";
    renderSendVariableEditor();
    updateWhatsAppPreview();
    return;
  }

  if (sendVariableDataState.templateKey !== templateKey) {
    sendVariableDataState.templateKey = templateKey;
    sendVariableDataState.parameterCount = parameterCount;
    sendVariableDataState.rows = [];
    sendVariableDataState.fileName = "";
  }
  sendVariableHint.textContent = parameterCount > 10
    ? "Bulk CSV sending supports templates with up to 10 variables."
    : `Upload one CSV row per customer. Phone uniquely matches that row's ${parameterCount} value${parameterCount === 1 ? "" : "s"}; sending is blocked if any eligible selected phone is missing.`;
  renderSendVariableEditor();
  updateWhatsAppPreview();
}

function renderSendVariableEditor() {
  if (!sendVariableEditor) return;
  if (!sendTemplateSelect?.value) {
    sendVariableEditor.innerHTML = `<div class="send-variable-empty">Select a template to configure its variables.</div>`;
    updateSendRecipientSummary();
    return;
  }
  if (!sendVariableDataState.parameterCount) {
    sendVariableEditor.innerHTML = `<div class="send-variable-empty is-ready">No recipient variable file required for this template.</div>`;
    updateSendRecipientSummary();
    return;
  }
  if (sendVariableDataState.parameterCount > 10) {
    sendVariableEditor.innerHTML = `<div class="send-variable-empty error">This template has ${sendVariableDataState.parameterCount} variables. Bulk CSV sending supports a maximum of 10.</div>`;
    updateSendRecipientSummary();
    return;
  }

  const headers = getRecipientVariableHeaders();
  const knownSelectedPhones = new Set(getSelectedSendContacts().map((contact) => normalizeSendPhone(contact.phone)));
  const loadedPhoneSet = new Set(sendVariableDataState.rows.map((row) => row.phone));
  const knownMatchCount = [...knownSelectedPhones].filter((phone) => loadedPhoneSet.has(phone)).length;
  const previewRows = sendVariableDataState.rows.slice(0, 5);

  sendVariableEditor.innerHTML = `
    <div class="send-variable-import">
      <div class="send-variable-actions">
        <button type="button" data-download-variable-csv>Download CSV for selected recipients</button>
        <label>
          Upload completed CSV
          <input type="file" accept=".csv,text/csv" hidden data-upload-variable-csv>
        </label>
        ${sendVariableDataState.rows.length ? `<button type="button" class="details" data-see-variable-details>See details</button>` : ""}
        ${sendVariableDataState.rows.length ? `<button type="button" class="clear" data-clear-variable-csv>Clear file</button>` : ""}
      </div>
      <code>${headers.join(",")}</code>
      <div class="send-variable-file-state${sendVariableDataState.rows.length ? " is-ready" : ""}">
        <strong>${sendVariableDataState.rows.length
          ? `${sendVariableDataState.rows.length} phone row${sendVariableDataState.rows.length === 1 ? "" : "s"} loaded`
          : "No variable CSV uploaded"}</strong>
        <small>${sendVariableDataState.rows.length
          ? `${escapeHtml(sendVariableDataState.fileName || "CSV")} · ${knownMatchCount} currently visible selected contact${knownMatchCount === 1 ? "" : "s"} matched`
          : "Download the prepared CSV, fill every variable column, then upload it."}</small>
      </div>
      ${previewRows.length ? `
        <div class="send-variable-preview">
          <div class="send-variable-preview-row head" style="--variable-columns:${headers.length}">
            ${headers.map((header) => `<span>${escapeHtml(header)}</span>`).join("")}
          </div>
          ${previewRows.map((row) => `
            <div class="send-variable-preview-row" style="--variable-columns:${headers.length}">
              <span>${escapeHtml(row.phone)}</span>
              ${row.variables.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}
            </div>
          `).join("")}
        </div>` : ""}
    </div>`;
  updateSendRecipientSummary();
}

function normalizeSendPhone(phone) {
  const digits = String(phone || "").replace(/[^\d+]/g, "").replace(/^\+/, "").trim();
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : digits;
}

function getRecipientVariableHeaders() {
  return [
    "Phone Number",
    ...Array.from({ length: sendVariableDataState.parameterCount }, (_, index) => `Variable ${index + 1}`)
  ];
}

function areSendVariablesReady() {
  return sendVariableDataState.parameterCount <= 10
    && (!sendVariableDataState.parameterCount || sendVariableDataState.rows.length > 0);
}

function getRecipientVariableRows(strict = false) {
  if (strict && sendVariableDataState.parameterCount && !sendVariableDataState.rows.length) {
    throw new Error("Upload the completed recipient variable CSV before sending.");
  }
  return sendVariableDataState.rows.map((row) => ({
    phone: row.phone,
    variables: [...row.variables]
  }));
}

function getPreviewVariables(contact = null) {
  const phone = normalizeSendPhone(contact?.phone);
  return sendVariableDataState.rows.find((row) => row.phone === phone)?.variables || [];
}

function parseCsvMatrix(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value.replace(/\r$/, ""));
  if (row.some((cell) => String(cell).trim()) || rows.length === 0) rows.push(row);
  return rows;
}

function parseRecipientVariableCsv(text) {
  const matrix = parseCsvMatrix(text);
  const expectedHeaders = getRecipientVariableHeaders();
  const normalizeHeader = (header) => String(header || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const headers = (matrix.shift() || []).map(normalizeHeader);
  const normalizedExpectedHeaders = expectedHeaders.map(normalizeHeader);
  if (headers[0] === "phone") headers[0] = "phonenumber";
  if (headers.length !== expectedHeaders.length || headers.some((header, index) => header !== normalizedExpectedHeaders[index])) {
    throw new Error(`CSV columns must be exactly: ${expectedHeaders.join(",")}`);
  }

  const dataRows = matrix.filter((row) => row.some((value) => String(value).trim()));
  if (!dataRows.length) throw new Error("The CSV contains no recipient rows.");
  if (dataRows.length > 1000) throw new Error("The CSV can contain at most 1000 rows.");

  const seenPhones = new Set();
  return dataRows.map((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== expectedHeaders.length) {
      throw new Error(`CSV row ${rowNumber} must contain ${expectedHeaders.length} columns.`);
    }
    const phone = normalizeSendPhone(row[0]);
    const variables = row.slice(1).map((value) => String(value).trim());
    if (!/^\d{11,15}$/.test(phone)) throw new Error(`CSV row ${rowNumber} has an invalid phone number.`);
    if (seenPhones.has(phone)) throw new Error(`Phone ${phone} appears more than once in the CSV.`);
    if (variables.some((value) => !value)) throw new Error(`CSV row ${rowNumber} is missing a variable value.`);
    if (variables.some((value) => value.length > 300)) throw new Error(`CSV row ${rowNumber} contains a value longer than 300 characters.`);
    seenPhones.add(phone);
    return { phone, variables };
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function downloadRecipientVariableCsv() {
  if (!sendTemplateSelect?.value || !sendVariableDataState.parameterCount) {
    throw new Error("Select a template that contains variables first.");
  }
  if (sendVariableDataState.parameterCount > 10) {
    throw new Error("Bulk CSV sending supports a maximum of 10 template variables.");
  }
  if (!sendRecipientState.contactIds.size && !sendRecipientState.groupIds.size) {
    throw new Error("Select contacts or groups before downloading the CSV.");
  }

  const data = await requestJson("/api/messages/bulk-recipients", {
    method: "POST",
    body: JSON.stringify({
      contactIds: [...sendRecipientState.contactIds],
      groupIds: [...sendRecipientState.groupIds]
    })
  });
  const headers = getRecipientVariableHeaders();
  const emptyVariables = Array.from({ length: sendVariableDataState.parameterCount }, () => "");
  const csv = [
    headers.join(","),
    ...(data.contacts || []).map((contact) => (
      [contact.phone, ...emptyVariables].map(escapeCsvValue).join(",")
    ))
  ].join("\r\n");
  const blobUrl = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${sendTemplateSelect.value || "template"}_recipient_variables.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
  setSendMessage(
    `Prepared CSV for ${data.eligibleCount || 0} eligible recipient${data.eligibleCount === 1 ? "" : "s"}. Fill every variable column and upload it here.`
  );
}

function closeBulkPreviewModal() {
  if (!bulkPreviewModal) return;
  bulkPreviewModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function getFilteredBulkPreviewRows() {
  const search = bulkPreviewState.search.toLowerCase();
  if (!search) return bulkPreviewState.rows;
  return bulkPreviewState.rows.filter((row) => (
    [
      row.phone,
      row.name,
      row.group,
      row.tag,
      row.finalMessage,
      ...(row.variables || [])
    ].some((value) => String(value || "").toLowerCase().includes(search))
  ));
}

function renderBulkPreviewTable() {
  if (!bulkPreviewTable) return;
  const filteredRows = getFilteredBulkPreviewRows();
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / bulkPreviewState.pageSize));
  bulkPreviewState.page = Math.min(Math.max(1, bulkPreviewState.page), pageCount);
  const start = (bulkPreviewState.page - 1) * bulkPreviewState.pageSize;
  const pageRows = filteredRows.slice(start, start + bulkPreviewState.pageSize);

  if (!pageRows.length) {
    bulkPreviewTable.innerHTML = `<div class="empty-row">No recipient details match this search.</div>`;
  } else {
    bulkPreviewTable.innerHTML = `
      <div class="bulk-preview-row head">
        <span>Phone number</span><span>Name</span><span>Group</span><span>Tag</span><span>Variable values</span><span>Final message</span>
      </div>
      ${pageRows.map((row) => `
        <div class="bulk-preview-row${row.matched ? "" : " is-missing"}">
          <strong>${escapeHtml(row.phone)}</strong>
          <span data-label="Name">${escapeHtml(row.name || "-")}</span>
          <span data-label="Group">${escapeHtml(row.group || "-")}</span>
          <span data-label="Tag">${row.tag ? `<code>#${escapeHtml(row.tag)}</code>` : "-"}</span>
          <span class="bulk-preview-values" data-label="Variable values">
            ${row.variables?.length
              ? row.variables.map((value, index) => `<em><b>{{${index + 1}}}</b>${escapeHtml(value)}</em>`).join("")
              : `<small>${row.matched ? "No variables" : "Missing phone row"}</small>`}
          </span>
          <span class="bulk-preview-message" data-label="Final message">
            ${row.matched ? escapeHtml(row.finalMessage || "") : `<strong>Cannot send: phone row missing</strong>`}
          </span>
        </div>
      `).join("")}`;
  }

  if (bulkPreviewRange) {
    bulkPreviewRange.textContent = filteredRows.length
      ? `Showing ${start + 1}-${Math.min(start + pageRows.length, filteredRows.length)} of ${filteredRows.length}`
      : "0 results";
  }
  if (bulkPreviewPage) bulkPreviewPage.textContent = `Page ${bulkPreviewState.page} of ${pageCount}`;
  if (bulkPreviewPrevious) bulkPreviewPrevious.disabled = bulkPreviewState.page <= 1;
  if (bulkPreviewNext) bulkPreviewNext.disabled = bulkPreviewState.page >= pageCount;
}

function renderBulkPreviewSummary() {
  if (bulkPreviewTemplate) {
    const template = bulkPreviewState.template || {};
    const format = template.headerType && template.headerType !== "none"
      ? `${template.headerType} header`
      : "plain";
    bulkPreviewTemplate.textContent = `${template.name || "Template"} · ${format} · ${template.parameterCount || 0} variable${Number(template.parameterCount || 0) === 1 ? "" : "s"}`;
  }
  if (bulkPreviewSummary) {
    const summary = bulkPreviewState.summary || {};
    bulkPreviewSummary.innerHTML = `
      <span class="matched">${Number(summary.matchedCount || 0)} matched</span>
      <span class="${Number(summary.missingCount || 0) ? "missing" : ""}">${Number(summary.missingCount || 0)} missing</span>
      <span>${Number(summary.unmatchedVariableRowCount || 0)} CSV rows ignored</span>
    `;
  }
}

async function openBulkPreviewModal() {
  if (!bulkPreviewModal) return;
  if (!sendRecipientState.contactIds.size && !sendRecipientState.groupIds.size) {
    throw new Error("Select contacts or groups before reviewing details.");
  }

  bulkPreviewModal.hidden = false;
  document.body.classList.add("modal-open");
  if (bulkPreviewTable) bulkPreviewTable.innerHTML = `<div class="empty-row">Resolving phone matches and final messages...</div>`;
  if (bulkPreviewSummary) bulkPreviewSummary.innerHTML = "";
  if (bulkPreviewSearch) bulkPreviewSearch.value = "";

  const data = await requestJson("/api/messages/bulk-preview", {
    method: "POST",
    body: JSON.stringify({
      templateName: sendTemplateSelect?.value || "",
      language: sendLanguageSelect?.value || "",
      contactIds: [...sendRecipientState.contactIds],
      groupIds: [...sendRecipientState.groupIds],
      recipientVariables: getRecipientVariableRows(true)
    })
  });
  bulkPreviewState.rows = data.rows || [];
  bulkPreviewState.summary = data.summary || {};
  bulkPreviewState.template = data.template || {};
  bulkPreviewState.search = "";
  bulkPreviewState.page = 1;
  renderBulkPreviewSummary();
  renderBulkPreviewTable();
}

function fillTemplatePreview(body, variables) {
  const fallbackBody = "Select a template to preview the WhatsApp message.";
  const text = String(body || "").trim() || fallbackBody;

  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, indexText) => {
    const index = Number(indexText) - 1;
    return variables[index] || `{{${indexText}}}`;
  });
}

function updateWhatsAppPreview() {
  if (!previewMessage) return;

  const selectedTemplate = sendTemplateSelect?.selectedOptions?.[0];
  const selectedContacts = getSelectedSendContacts();
  const selectedContact = selectedContacts[0] || null;
  const contactName = selectedContact?.name || "Customer";
  const contactPhone = selectedContact?.phone || "";
  const body = selectedTemplate?.dataset.body || "";
  const templateName = selectedTemplate?.value || "Template preview";
  const category = selectedTemplate?.dataset.category || "Approved message";
  const variables = getPreviewVariables(selectedContact);
  const selectedMedia = sendMediaSelect?.selectedOptions?.[0];
  const mediaUrl = selectedMedia?.dataset.url || "";
  const mediaType = selectedMedia?.dataset.mediaType || "";

  if (previewContact) {
    const extraCount = Math.max(getSendRecipientEstimate() - 1, 0);
    previewContact.textContent = contactPhone
      ? `${contactName}${extraCount ? ` +${extraCount}` : ""}`
      : getSendRecipientEstimate() ? "Selected recipients" : "Customer";
  }

  previewMessage.textContent = fillTemplatePreview(body, variables);

  if (previewMedia) {
    previewMedia.hidden = !mediaUrl;
    previewMedia.innerHTML = !mediaUrl
      ? ""
      : mediaType === "video"
        ? `<video src="${escapeHtml(mediaUrl)}" muted playsinline controls></video>`
        : `<img src="${escapeHtml(mediaUrl)}" alt="Template header preview">`;
  }

  if (previewTemplate) {
    previewTemplate.textContent = templateName;
  }

  if (previewCategory) {
    previewCategory.textContent = category;
  }

  if (previewTime) {
    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    previewTime.textContent = currentTime;
    if (previewBubbleTime) {
      previewBubbleTime.textContent = currentTime;
    }
  }
}

const TEMPLATE_STATUS_META = {
  approved:  { label: "Approved",         cls: "approved", bucket: "approved" },
  rejected:  { label: "Rejected",         cls: "rejected", bucket: "rejected" },
  disabled:  { label: "Disabled",         cls: "rejected", bucket: "rejected" },
  in_review: { label: "Pending approval", cls: "pending",  bucket: "pending" },
  paused:    { label: "Paused",           cls: "pending",  bucket: "pending" },
  draft:     { label: "Draft",            cls: "draft",    bucket: "pending" }
};

function templateStatusMeta(status) {
  return TEMPLATE_STATUS_META[status] || { label: status ? status.replace(/_/g, " ") : "Unknown", cls: "pending", bucket: "pending" };
}

let templateStatusFilter = "all";

function renderTemplateStatusRows(templates) {
  if (!templateStatusList) return;

  const all = Array.isArray(templates) ? templates : [];

  const counts = { all: all.length, pending: 0, approved: 0, rejected: 0 };
  all.forEach((template) => {
    const bucket = templateStatusMeta(template.status).bucket;
    counts[bucket] = (counts[bucket] || 0) + 1;
  });
  document.querySelectorAll("[data-tpl-count]").forEach((el) => {
    el.textContent = String(counts[el.dataset.tplCount] ?? 0);
  });

  const header = `
    <div class="table-row template-table-row table-head">
      <span>Name</span><span>Category</span><span>Status</span><span>Reason</span><span>Actions</span>
    </div>
  `;

  const visible = templateStatusFilter === "all"
    ? all
    : all.filter((template) => templateStatusMeta(template.status).bucket === templateStatusFilter);

  if (!all.length) {
    templateStatusList.innerHTML = `${header}<div class="empty-row">No templates submitted yet.</div>`;
    return;
  }

  if (!visible.length) {
    templateStatusList.innerHTML = `${header}<div class="empty-row">No ${escapeText(templateStatusFilter)} templates.</div>`;
    return;
  }

  templateStatusList.innerHTML = header + visible.map((template) => {
    const meta = templateStatusMeta(template.status);
    const headerLabel = template.headerType && template.headerType !== "none"
      ? `${template.category} · ${template.headerType} header`
      : template.category;
    return `
      <div class="table-row template-table-row">
        <strong>${escapeText(template.name)}</strong>
        <span data-label="Category">${escapeText(headerLabel)}</span>
        <span data-label="Status"><em class="${meta.cls}">${escapeText(meta.label)}</em></span>
        <span data-label="Reason">${escapeText(template.rejectedReason || template.language || "-")}</span>
        <button class="template-delete-action" type="button" data-delete-template="${escapeText(template._id || template.id)}">Delete</button>
      </div>
    `;
  }).join("");
}

async function loadTemplates() {
  if (!templateStatusList) return;
  const data = await requestJson("/api/templates");
  setupState.templates = data.templates || [];
  renderTemplateStatusRows(data.templates || []);
  renderSetupProgress();
  renderOverviewStats();
}

function renderSendHistory(messages) {
  if (!sendHistory) return;

  if (!messages.length) {
    sendHistory.innerHTML = `<div class="empty-row">No WhatsApp messages sent yet.</div>`;
    return;
  }

  sendHistory.innerHTML = messages.map((message) => `
    <div class="table-row send-table-row">
      <strong>${escapeHtml(message.to || "")}</strong>
      <span data-label="Template" class="send-template-cell">
        <span>${escapeHtml(message.templateName || "")}</span>
        ${(message.mediaId || message.batchId) ? `<small>${[
          message.mediaId ? `${message.mediaType || "media"} · ${message.mediaId}` : "",
          message.batchId || ""
        ].filter(Boolean).map(escapeHtml).join(" · ")}</small>` : ""}
      </span>
      <span data-label="Status"><em class="${message.status === "failed" ? "rejected" : "approved"}">${escapeHtml(message.status || "")}</em></span>
      <span data-label="Sent at">${escapeHtml(new Date(message.createdAt).toLocaleString())}</span>
    </div>
  `).join("");
}

function isMetaProvided555Number(value) {
  return /^\+?1\s*555[\s-]?/i.test(String(value || ""));
}

function getSendFailureMessage(error) {
  const code = error.details?.code || error.details?.error_subcode;
  const rawMessage = String(error.message || "");
  const senderNumber = setupState.tenant?.meta?.displayPhoneNumber || "";

  if (code === "TEMPLATE_PARAMETER_COUNT_MISMATCH") {
    return rawMessage;
  }

  if (Number(code) === 133010) {
    return "Phone number is not registered for Cloud API. Open Connect WhatsApp and click Register, then try sending again.";
  }

  if (Number(code) === 131058) {
    return "The hello_world sample only works with Meta public test numbers. Select your own approved template or submit one from Create templates.";
  }

  if (Number(code) === 131037 || rawMessage.toLowerCase().includes("display name approval")) {
    return isMetaProvided555Number(senderNumber)
      ? "Meta blocked this send because the sender is a Meta-provided +1 555 number without an approved display name. Use your own business phone number, or change/submit the 555 number display name in WhatsApp Manager and wait for approval."
      : "Meta blocked this send because the sender display name still needs approval. Check the phone number display name status in WhatsApp Manager, then refresh and retry.";
  }

  return rawMessage || "WhatsApp message failed.";
}

async function loadSendHistory() {
  if (!sendHistory) return;
  const data = await requestJson("/api/messages");
  setupState.messages = data.messages || [];
  renderSendHistory(data.messages || []);
  renderOverviewStats();
}

function renderApiBaseUrl() {
  if (!apiBaseUrl) return;
  apiBaseUrl.textContent = `${window.location.origin}/api/v1`;
}

function renderApiKeys(apiKeys) {
  if (!apiKeyList) return;

  if (!apiKeys.length) {
    apiKeyList.innerHTML = `<div class="empty-row">No API keys created yet.</div>`;
    return;
  }

  apiKeyList.innerHTML = apiKeys.map((apiKey) => {
    const isActive = apiKey.status === "active";
    return `
      <div class="table-row api-key-table-row">
        <strong>${escapeHtml(apiKey.name)}</strong>
        <span data-label="Key">${escapeHtml(apiKey.maskedKey)}</span>
        <span data-label="Status"><em class="${isActive ? "approved" : "rejected"}">${escapeHtml(apiKey.status)}</em></span>
        <span data-label="Last used">${apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : "Never"}</span>
        <button type="button" data-revoke-api-key="${escapeHtml(apiKey.id)}" ${isActive ? "" : "disabled"}>Revoke</button>
      </div>
    `;
  }).join("");
}

async function loadApiKeys() {
  if (!apiKeyList) return;
  const data = await requestJson("/api/developer/api-keys");
  setupState.apiKeys = data.apiKeys || [];
  renderApiKeys(setupState.apiKeys);
}

async function createApiKey() {
  const name = apiKeyNameInput?.value || "Default integration";
  setApiMessage("Creating API key...");
  const data = await requestJson("/api/developer/api-keys", {
    method: "POST",
    body: JSON.stringify({ name })
  });

  if (apiGeneratedPanel && apiGeneratedKey) {
    apiGeneratedPanel.hidden = false;
    apiGeneratedKey.textContent = data.key || "";
  }

  if (apiKeyNameInput) apiKeyNameInput.value = "";
  setApiMessage(data.message || "API key created. Copy it now.");
  await loadApiKeys();
}

async function revokeApiKey(apiKeyId) {
  setApiMessage("Revoking API key...");
  await requestJson(`/api/developer/api-keys/${apiKeyId}`, {
    method: "DELETE"
  });
  setApiMessage("API key revoked.");
  await loadApiKeys();
}

function getTemplatePayload() {
  return {
    name: templateNameInput?.value || "",
    language: templateLanguageSelect?.value || "en",
    category: templateCategorySelect?.value || "",
    body: templateBodyInput?.value || "",
    variableSamples: templateSamplesInput?.value || "",
    headerType: templateHeaderTypeSelect?.value || "none",
    headerMediaId: templateHeaderMediaSelect?.value || ""
  };
}

function renderTemplateHeaderMediaOptions() {
  if (!templateHeaderMediaSelect) return;
  const headerType = templateHeaderTypeSelect?.value || "none";
  const previousMediaId = templateHeaderMediaSelect.value;
  const assets = mediaState.assets.filter((asset) => isCompatibleWhatsAppMedia(asset, headerType, true));

  templateHeaderMediaSelect.innerHTML = [
    `<option value="">Choose from Media Library</option>`,
    ...assets.map((asset) => (
      `<option value="${escapeHtml(asset.mediaId)}">${escapeHtml(asset.title)} · ${escapeHtml(formatMediaBytes(asset.bytes))}</option>`
    ))
  ].join("");
  if (assets.some((asset) => asset.mediaId === previousMediaId)) {
    templateHeaderMediaSelect.value = previousMediaId;
  }
  templateHeaderMediaSelect.disabled = !assets.length;
}

function updateTemplateHeaderControls() {
  if (!templateHeaderTypeSelect || !templateHeaderMediaField) return;
  const isAuthentication = templateCategorySelect?.value === "authentication";
  if (isAuthentication) templateHeaderTypeSelect.value = "none";
  templateHeaderTypeSelect.disabled = isAuthentication;
  const headerType = templateHeaderTypeSelect.value || "none";
  templateHeaderMediaField.hidden = headerType === "none";
  if (headerType === "none") {
    if (templateHeaderMediaSelect) {
      templateHeaderMediaSelect.required = false;
      templateHeaderMediaSelect.value = "";
    }
    return;
  }
  renderTemplateHeaderMediaOptions();
  if (templateHeaderMediaSelect) templateHeaderMediaSelect.required = true;
}

const templatePresets = {
  order_update: {
    name: "order_update",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your order {{2}} has been shipped and will arrive by {{3}}.",
    samples: "{{1}} = Name, {{2}} = ORD1234, {{3}} = 12 Jun"
  },
  appointment_reminder: {
    name: "appointment_reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}.",
    samples: "{{1}} = Name, {{2}} = 12 Jun, {{3}} = 10:00 AM"
  },
  payment_reminder: {
    name: "payment_reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your payment of {{2}} is due on {{3}}.",
    samples: "{{1}} = Name, {{2}} = Rs 100, {{3}} = 12 Jun"
  },
  offer_update: {
    name: "offer_update",
    category: "marketing",
    language: "en_US",
    body: "Hi {{1}}, your exclusive offer is active until {{2}}. Reply STOP to opt out.",
    samples: "{{1}} = Name, {{2}} = 12 Jun"
  },
  otp_code: {
    name: "otp_code",
    category: "authentication",
    language: "en_US",
    body: "{{1}} is your verification code.",
    samples: "{{1}} = 123456"
  }
};

function applyTemplatePreset(presetId) {
  const preset = templatePresets[presetId];
  if (!preset) return;

  if (templateNameInput) templateNameInput.value = preset.name;
  if (templateCategorySelect) templateCategorySelect.value = preset.category;
  if (templateLanguageSelect) templateLanguageSelect.value = preset.language;
  if (templateBodyInput) templateBodyInput.value = preset.body;
  if (templateSamplesInput) templateSamplesInput.value = preset.samples;
  if (templateHeaderTypeSelect) templateHeaderTypeSelect.value = "none";
  updateTemplateHeaderControls();
  setTemplateMessage("");
}

// Curated catalogue modelled on Meta's WhatsApp Template Library. Meta does not
// expose a public list API, so this is a maintained starter set. "Use template"
// prefills the builder so the user reviews and submits it for Meta approval.
const META_TEMPLATE_LIBRARY = [
  {
    id: "order_confirmation",
    title: "Order Confirmation",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, thank you for your order {{2}}. Your total is {{3}} and it will be delivered by {{4}}.",
    samples: "{{1}} = Name, {{2}} = ORD1234, {{3}} = Rs 1,499, {{4}} = 12 Jun"
  },
  {
    id: "delivery_update",
    title: "Delivery Update",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your order {{2}} is out for delivery and will arrive today by {{3}}.",
    samples: "{{1}} = Name, {{2}} = ORD1234, {{3}} = 6 PM"
  },
  {
    id: "payment_reminder_lib",
    title: "Payment Reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, a payment of {{2}} for invoice {{3}} is due on {{4}}. Please pay on time to avoid late fees.",
    samples: "{{1}} = Name, {{2}} = Rs 2,000, {{3}} = INV-88, {{4}} = 15 Jun"
  },
  {
    id: "appointment_reminder_lib",
    title: "Appointment Reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, reminder: your appointment is on {{2}} at {{3}}. Reply RESCHEDULE to change it.",
    samples: "{{1}} = Name, {{2}} = 12 Jun, {{3}} = 10:00 AM"
  },
  {
    id: "account_update",
    title: "Account Update",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your account was updated on {{2}}. If you didn't make this change, contact our support team immediately.",
    samples: "{{1}} = Name, {{2}} = 10 Jun 2026"
  },
  {
    id: "feedback_request",
    title: "Feedback Request",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, how was your experience with {{2}}? Reply with a number from 1 to 5 to rate us.",
    samples: "{{1}} = Name, {{2}} = order ORD1234"
  },
  {
    id: "otp_verification",
    title: "OTP Verification",
    category: "authentication",
    language: "en_US",
    body: "{{1}} is your verification code. For your security, do not share this code with anyone.",
    samples: "{{1}} = 123456"
  },
  {
    id: "welcome_message",
    title: "Welcome Message",
    category: "marketing",
    language: "en_US",
    body: "Hi {{1}}, welcome to {{2}}! Explore our latest products and enjoy {{3}} off your first order. Reply STOP to opt out.",
    samples: "{{1}} = Name, {{2}} = InterCon Store, {{3}} = 10%"
  },
  {
    id: "special_offer",
    title: "Special Offer",
    category: "marketing",
    language: "en_US",
    body: "Hi {{1}}, enjoy {{2}} off everything until {{3}}. Use code {{4}} at checkout. Reply STOP to opt out.",
    samples: "{{1}} = Name, {{2}} = 25%, {{3}} = 20 Jun, {{4}} = SAVE25"
  },
  {
    id: "abandoned_cart",
    title: "Abandoned Cart",
    category: "marketing",
    language: "en_US",
    body: "Hi {{1}}, you left {{2}} in your cart. Complete your purchase now and get {{3}} off. Reply STOP to opt out.",
    samples: "{{1}} = Name, {{2}} = 2 items, {{3}} = 5%"
  }
];

const LIB_CATEGORY_LABEL = { utility: "Utility", marketing: "Marketing", authentication: "Authentication" };

function renderTemplateLibrary(filter = "all") {
  const host = document.querySelector("[data-template-library]");
  if (!host) return;

  const items = META_TEMPLATE_LIBRARY.filter((tpl) => filter === "all" || tpl.category === filter);
  if (!items.length) {
    host.innerHTML = '<div class="empty-row">No templates in this category.</div>';
    return;
  }

  host.innerHTML = items.map((tpl) => `
    <article class="lib-card">
      <div class="lib-card-head">
        <span class="lib-badge cat-${tpl.category}">${LIB_CATEGORY_LABEL[tpl.category] || tpl.category}</span>
        <span class="lib-lang">${escapeText(tpl.language)}</span>
      </div>
      <h3>${escapeText(tpl.title)}</h3>
      <p class="lib-body">${escapeText(tpl.body)}</p>
      <button class="btn btn-small" type="button" data-use-template="${tpl.id}">Use template</button>
    </article>`).join("");
}

function useLibraryTemplate(id) {
  const tpl = META_TEMPLATE_LIBRARY.find((item) => item.id === id);
  if (!tpl) return;

  if (templateNameInput) templateNameInput.value = tpl.id;
  if (templateCategorySelect) templateCategorySelect.value = tpl.category;
  if (templateLanguageSelect) templateLanguageSelect.value = tpl.language;
  if (templateBodyInput) templateBodyInput.value = tpl.body;
  if (templateSamplesInput) templateSamplesInput.value = tpl.samples;
  if (templateHeaderTypeSelect) templateHeaderTypeSelect.value = "none";
  updateTemplateHeaderControls();
  window.location.hash = "#templates";
  openTemplateModal();
  setTemplateMessage(`Loaded "${tpl.title}" from the library. Review and submit it for Meta approval.`);
}

async function submitTemplateForReview() {
  if (!requirePaidPlanBeforeAction(setTemplateMessage)) return;

  setTemplateMessage("Submitting template to Meta...");
  const data = await requestJson("/api/templates", {
    method: "POST",
    body: JSON.stringify(getTemplatePayload())
  });
  setTemplateMessage(data.message || "Template submitted to Meta for review.");
  await Promise.all([loadApprovedTemplates(), loadTemplates()]);
}

async function deleteTemplate(templateId, button) {
  if (!templateId) return;
  const confirmed = await showConfirmModal({
    eyebrow: "Template",
    title: "Delete this template from InterCon?",
    message: "This removes the local template record from InterCon. If the template still exists in Meta, it can appear again after template sync.",
    confirmText: "Delete template"
  });
  if (!confirmed) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    await requestJson(`/api/templates/${encodeURIComponent(templateId)}`, {
      method: "DELETE"
    });
    setTemplateMessage("Template deleted.");
    await Promise.all([loadTemplates(), loadApprovedTemplates()]);
  } catch (error) {
    setTemplateMessage(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
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
  if (event.key === "Escape" && confirmModal && !confirmModal.hidden) {
    closeConfirmModal(false);
    return;
  }
  if (event.key === "Escape" && document.body.classList.contains("portal-menu-open")) {
    closePortalMenu();
  }
  if (event.key === "Escape" && templateModal && !templateModal.hidden) {
    closeTemplateModal();
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

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-select-plan]");
  if (!button) return;

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Opening...";

  try {
    await startRazorpayPayment(button.dataset.selectPlan);
  } catch (error) {
    await loadBilling().catch(() => null);
    if (billingMessage) {
      billingMessage.textContent = error.message;
      billingMessage.classList.add("error");
    }
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
});

function runEmbeddedSignup({ button, featureType, onboardingType, setMessage }) {
  if (button.disabled) return;

  // Safari (and iOS) only allow a popup that is opened synchronously inside the
  // click gesture. FB.login opens a popup, so the SDK must already be loaded —
  // we cannot `await` the SDK first or Safari will block the popup. If the SDK
  // is not ready yet, kick off loading and ask the user to click once more.
  if (!facebookSdk) {
    setMessage("Preparing Meta login, one moment...");
    loadFacebookSdk()
      .then(() => setMessage("Ready — click connect again to open Meta."))
      .catch((error) => setMessage(error.message, true));
    return;
  }

  const { FB, config } = facebookSdk;
  if (!config.loginConfigId) {
    setMessage("Meta Embedded Signup configuration ID is missing", true);
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Opening Meta...";
  embeddedSignupSessionInfo = null;
  setMessage(onboardingType === "coexistence"
    ? "Complete the Meta popup and scan the QR code with the WhatsApp Business app to connect in coexistence mode."
    : "Complete the Meta popup to connect your WhatsApp account.");

  // launchEmbeddedSignup calls FB.login synchronously (opens the popup); the
  // returned promise resolves once the user finishes the Meta flow. It may throw
  // synchronously (e.g. non-HTTPS), so guard before chaining.
  let loginPromise;
  try {
    loginPromise = launchEmbeddedSignup(FB, config, featureType ? { featureType } : {});
  } catch (error) {
    setMessage(error.message, true);
    button.disabled = false;
    button.textContent = originalText;
    return;
  }

  loginPromise
    .then(async (loginResponse) => {
      const code = loginResponse.authResponse?.code;
      if (!code) {
        throw new Error(getMetaLoginFailureMessage(loginResponse));
      }

      const sessionInfo = await waitForEmbeddedSignupSessionInfo();

      const result = await requestJson("/api/meta/embedded-signup/complete", {
        method: "POST",
        body: JSON.stringify({
          code,
          sessionInfo,
          onboardingType
        })
      });

      renderOnboardingStatus(result.tenant);
      if (result.tenant?.onboardingStatus === "meta_connected" && result.tenant?.meta?.phoneNumberId) {
        if (onboardingType === "coexistence") {
          setMessage("Number connected in coexistence mode. The customer keeps using the WhatsApp Business app while you message from InterCon.");
        } else if (result.meta?.phoneRegistration?.success) {
          setMessage("WhatsApp account connected and phone registered for Cloud API.");
        } else if (result.meta?.phoneRegistration) {
          setMessage(`WhatsApp account connected. Phone registration needs attention: ${result.meta.phoneRegistration.message}`, true);
        } else {
          setMessage("WhatsApp account connected.");
        }
      }
    })
    .catch((error) => setMessage(error.message, true))
    .finally(() => {
      button.disabled = false;
      button.textContent = originalText;
    });
}

connectWhatsAppButtons.forEach((button) => {
  button.addEventListener("click", () => runEmbeddedSignup({
    button,
    onboardingType: "cloud_api",
    setMessage: setMetaConnectMessage
  }));
});

coexistenceButtons.forEach((button) => {
  button.addEventListener("click", () => runEmbeddedSignup({
    button,
    featureType: "whatsapp_business_app_onboarding",
    onboardingType: "coexistence",
    setMessage: setCoexMessage
  }));
});

// Per-row "Actions" refresh in the WABA table.
document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-waba-refresh]");
  if (!action) return;
  action.disabled = true;
  try {
    await refreshPhoneStatus();
  } catch (error) {
    setMetaConnectMessage(error.message, true);
  } finally {
    action.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-waba-delete]");
  if (!action) return;
  action.disabled = true;
  try {
    await deleteConnectedWaba();
  } catch (error) {
    setMetaConnectMessage(error.message, true);
  } finally {
    action.disabled = false;
  }
});

if (metaRegisterPhoneButton) {
  metaRegisterPhoneButton.addEventListener("click", async () => {
    metaRegisterPhoneButton.disabled = true;
    try {
      await registerPhoneNumber();
    } catch (error) {
      setMetaConnectMessage(error.message, true);
    } finally {
      metaRegisterPhoneButton.disabled = false;
    }
  });
}

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

if (sendMessageForm) {
  sendMessageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(sendMessageForm).entries());
    const estimatedCount = getSendRecipientEstimate();

    try {
      if (!requirePaidPlanBeforeAction(setSendMessage)) return;
      if (!sendRecipientState.contactIds.size && !sendRecipientState.groupIds.size) {
        setSendMessage("Select at least one contact or group.", true);
        return;
      }
      const recipientVariables = getRecipientVariableRows(true);

      const confirmed = await showConfirmModal({
        eyebrow: "Bulk WhatsApp",
        title: `Queue this template for ${estimatedCount || "the selected"} recipient${estimatedCount === 1 ? "" : "s"}?`,
        message: "Each customer receives variables from the CSV row matching their unique phone number. Duplicate selections are deduplicated, and the batch is blocked if any eligible selected phone has no row. Meta messaging charges may apply.",
        confirmText: "Queue messages"
      });
      if (!confirmed) return;

      if (sendSubmitButton) sendSubmitButton.disabled = true;
      setSendMessage("Resolving recipients and queueing WhatsApp messages...");
      const result = await requestJson("/api/messages/send-template-bulk", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          recipientVariables,
          contactIds: [...sendRecipientState.contactIds],
          groupIds: [...sendRecipientState.groupIds]
        })
      });
      sendRecipientState.contactIds.clear();
      sendRecipientState.groupIds.clear();
      sendRecipientState.search = "";
      if (sendRecipientSearch) sendRecipientSearch.value = "";
      sendMessageForm.reset();
      renderSendContactOptions(setupState.contacts);
      renderSendGroupOptions(setupState.groups);
      updateSendVariableHint();
      await loadSendHistory();
      const unmatchedRowNote = result.unmatchedVariableRowCount
        ? ` ${result.unmatchedVariableRowCount} CSV row${result.unmatchedVariableRowCount === 1 ? " was" : "s were"} not part of the selected recipients and ignored.`
        : "";
      setSendMessage(
        `${result.queuedCount} WhatsApp message${result.queuedCount === 1 ? "" : "s"} queued`
        + (result.skippedCount ? `. ${result.skippedCount} recipient${result.skippedCount === 1 ? "" : "s"} skipped.` : ".")
        + unmatchedRowNote
      );
    } catch (error) {
      setSendMessage(getSendFailureMessage(error), true);
      if (Number(error.details?.code || error.details?.error_subcode) === 131037 || String(error.message || "").toLowerCase().includes("display name approval")) {
        await loadOnboardingStatus().catch(() => null);
      }
    } finally {
      updateSendRecipientSummary();
    }
  });
}

if (sendTemplateSelect) {
  sendTemplateSelect.addEventListener("change", updateSendVariableHint);
}

if (sendMediaSelect) {
  sendMediaSelect.addEventListener("change", () => {
    updateSendRecipientSummary();
    updateWhatsAppPreview();
  });
}

sendRecipientPicker?.addEventListener("change", (event) => {
  const contactChoice = event.target.closest("[data-send-contact-choice]");
  const groupChoice = event.target.closest("[data-send-group-choice]");
  if (contactChoice) {
    if (contactChoice.checked) sendRecipientState.contactIds.add(contactChoice.value);
    else sendRecipientState.contactIds.delete(contactChoice.value);
  }
  if (groupChoice) {
    if (groupChoice.checked) sendRecipientState.groupIds.add(groupChoice.value);
    else sendRecipientState.groupIds.delete(groupChoice.value);
    renderSendGroupOptions(setupState.groups);
  }
  updateSendRecipientSummary();
  renderSendVariableEditor();
  updateWhatsAppPreview();
});

sendRecipientSearch?.addEventListener("input", () => {
  sendRecipientState.search = sendRecipientSearch.value.trim();
  renderSendContactOptions(setupState.contacts);
  renderSendGroupOptions(setupState.groups);
});

sendSelectAllButton?.addEventListener("click", () => {
  sendContactList?.querySelectorAll("[data-send-contact-choice]").forEach((choice) => {
    sendRecipientState.contactIds.add(choice.value);
  });
  renderSendContactOptions(setupState.contacts);
  renderSendVariableEditor();
});

sendClearRecipientsButton?.addEventListener("click", () => {
  sendRecipientState.contactIds.clear();
  sendRecipientState.groupIds.clear();
  renderSendGroupOptions(setupState.groups);
  updateSendRecipientSummary();
  renderSendVariableEditor();
  updateWhatsAppPreview();
});

if (sendLanguageSelect) {
  sendLanguageSelect.addEventListener("change", updateWhatsAppPreview);
}

sendVariableEditor?.addEventListener("click", (event) => {
  const downloadButton = event.target.closest("[data-download-variable-csv]");
  const detailsButton = event.target.closest("[data-see-variable-details]");
  const clearButton = event.target.closest("[data-clear-variable-csv]");
  if (downloadButton) {
    downloadButton.disabled = true;
    downloadRecipientVariableCsv()
      .catch((error) => setSendMessage(error.message, true))
      .finally(() => {
        downloadButton.disabled = false;
      });
  }
  if (detailsButton) {
    detailsButton.disabled = true;
    openBulkPreviewModal()
      .catch((error) => {
        if (bulkPreviewTable) bulkPreviewTable.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}</div>`;
        setSendMessage(error.message, true);
      })
      .finally(() => {
        detailsButton.disabled = false;
      });
  }
  if (clearButton) {
    sendVariableDataState.rows = [];
    sendVariableDataState.fileName = "";
    renderSendVariableEditor();
    updateWhatsAppPreview();
    setSendMessage("Recipient variable CSV cleared.");
  }
});

closeBulkPreviewButtons.forEach((button) => button.addEventListener("click", closeBulkPreviewModal));
bulkPreviewSearch?.addEventListener("input", () => {
  bulkPreviewState.search = bulkPreviewSearch.value.trim();
  bulkPreviewState.page = 1;
  renderBulkPreviewTable();
});
bulkPreviewPrevious?.addEventListener("click", () => {
  bulkPreviewState.page -= 1;
  renderBulkPreviewTable();
});
bulkPreviewNext?.addEventListener("click", () => {
  bulkPreviewState.page += 1;
  renderBulkPreviewTable();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && bulkPreviewModal && !bulkPreviewModal.hidden) {
    closeBulkPreviewModal();
  }
});

sendVariableEditor?.addEventListener("change", async (event) => {
  const fileInput = event.target.closest("[data-upload-variable-csv]");
  const file = fileInput?.files?.[0];
  if (!file) return;
  try {
    const rows = parseRecipientVariableCsv(await file.text());
    sendVariableDataState.rows = rows;
    sendVariableDataState.fileName = file.name;
    renderSendVariableEditor();
    updateWhatsAppPreview();
    setSendMessage(`${rows.length} phone-keyed variable row${rows.length === 1 ? "" : "s"} loaded from ${file.name}.`);
  } catch (error) {
    fileInput.value = "";
    setSendMessage(error.message, true);
  }
});

refreshSendDataButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      setSendMessage("Refreshing sender data...");
      await Promise.all([loadContacts(), loadGroups(), loadApprovedTemplates(), loadSendHistory(), loadMediaLibrary(true)]);
      setSendMessage("Sender data refreshed.");
    } catch (error) {
      setSendMessage(error.message, true);
    }
  });
});

if (apiKeyForm) {
  apiKeyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = apiKeyForm.querySelector("[data-create-api-key]");
    if (submitButton) submitButton.disabled = true;

    try {
      await createApiKey();
    } catch (error) {
      setApiMessage(error.message, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (refreshApiKeysButton) {
  refreshApiKeysButton.addEventListener("click", async () => {
    try {
      setApiMessage("Refreshing API keys...");
      await loadApiKeys();
      setApiMessage("API keys refreshed.");
    } catch (error) {
      setApiMessage(error.message, true);
    }
  });
}

if (copyApiKeyButton) {
  copyApiKeyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(apiGeneratedKey?.textContent || "");
      setApiMessage("API key copied.");
    } catch (error) {
      setApiMessage("Copy failed. Select the key and copy it manually.", true);
    }
  });
}

if (openTemplateModalButton) {
  openTemplateModalButton.addEventListener("click", openTemplateModal);
}

closeTemplateModalButtons.forEach((button) => {
  button.addEventListener("click", closeTemplateModal);
});

confirmCancelButtons.forEach((button) => {
  button.addEventListener("click", () => closeConfirmModal(false));
});

if (confirmAcceptButton) {
  confirmAcceptButton.addEventListener("click", () => closeConfirmModal(true));
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-revoke-api-key]");
  if (!button || button.disabled) return;

  button.disabled = true;
  try {
    await revokeApiKey(button.dataset.revokeApiKey);
  } catch (error) {
    setApiMessage(error.message, true);
    button.disabled = false;
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete-template]");
  if (!button || button.disabled) return;
  await deleteTemplate(button.dataset.deleteTemplate, button);
});

submitTemplateButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      await submitTemplateForReview();
      closeTemplateModal();
    } catch (error) {
      setTemplateMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});

if (templatePresetSelect) {
  templatePresetSelect.addEventListener("change", () => {
    applyTemplatePreset(templatePresetSelect.value);
  });
  applyTemplatePreset(templatePresetSelect.value || "order_update");
}

templateHeaderTypeSelect?.addEventListener("change", updateTemplateHeaderControls);
templateCategorySelect?.addEventListener("change", updateTemplateHeaderControls);

// Template Library: render catalogue, filter by category, adopt a template.
const libFilter = document.querySelector("[data-lib-filter]");
if (libFilter) {
  libFilter.addEventListener("change", () => renderTemplateLibrary(libFilter.value));
}

document.addEventListener("click", (event) => {
  const useButton = event.target.closest("[data-use-template]");
  if (!useButton) return;
  useLibraryTemplate(useButton.dataset.useTemplate);
});

renderTemplateLibrary();

// Manage Template: status filter chips (All / Pending / Approved / Rejected).
const tplFilter = document.querySelector("[data-tpl-filter]");
if (tplFilter) {
  tplFilter.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-tpl-status]");
    if (!chip) return;
    templateStatusFilter = chip.dataset.tplStatus;
    tplFilter.querySelectorAll("[data-tpl-status]").forEach((item) => {
      item.classList.toggle("is-active", item === chip);
    });
    renderTemplateStatusRows(setupState.templates);
  });
}

const refreshTemplatesButton = document.querySelector("[data-refresh-templates]");
if (refreshTemplatesButton) {
  refreshTemplatesButton.addEventListener("click", async () => {
    refreshTemplatesButton.disabled = true;
    const original = refreshTemplatesButton.textContent;
    refreshTemplatesButton.textContent = "Refreshing...";
    try {
      await loadTemplates();
    } catch (error) {
      setTemplateMessage(error.message, true);
    } finally {
      refreshTemplatesButton.disabled = false;
      refreshTemplatesButton.textContent = original;
    }
  });
}

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

// Launcher flow: render every feature view in the Admin Console detail-view
// chrome — a "Back to <page>" pill on top — while keeping each view's real
// content untouched. Top-level launcher pages (Home, Setup, Send WhatsApp,
// Inbox, Reports, Payments, API) are left as-is.
portalViews.forEach((view) => {
  if (PAGES.includes(view.id)) return;

  const parent = VIEW_PARENT[view.id] || "home";
  const parentTitle = PAGE_TITLES[parent] || "Home";

  const back = document.createElement("a");
  back.className = "console-back";
  back.href = `#${parent}`;
  back.setAttribute("aria-label", `Back to ${parentTitle}`);
  back.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg>${parentTitle}`;
  view.prepend(back);
});

// ============================================================
// Media Library: tenant-scoped Cloudinary photos and videos.
// ============================================================
function setMediaStatus(message, isError = false) {
  if (!mediaStatus) return;
  mediaStatus.textContent = message || "";
  mediaStatus.classList.toggle("error", Boolean(isError));
}

function setMediaUploadStatus(message, isError = false) {
  if (!mediaUploadStatus) return;
  mediaUploadStatus.textContent = message || "";
  mediaUploadStatus.classList.toggle("error", Boolean(isError));
}

function formatMediaBytes(bytes) {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(1)} MB`;
}

function formatMediaDuration(seconds) {
  const value = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(value / 60);
  return `${minutes}:${String(value % 60).padStart(2, "0")}`;
}

function renderMediaLibrary() {
  if (!mediaGrid) return;
  const filter = mediaFilter?.value || "all";
  const assets = filter === "all"
    ? mediaState.assets
    : mediaState.assets.filter((asset) => asset.mediaType === filter);

  if (!assets.length) {
    mediaGrid.innerHTML = `
      <div class="media-library-empty">
        <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM7 15l3-3 2 2 2-2 3 3M9 9h.01"/></svg></span>
        <strong>${mediaState.assets.length ? "No media matches this filter" : "Your media library is empty"}</strong>
        <small>${mediaState.assets.length ? "Choose another media type." : "Add a photo or video to create your first reusable asset."}</small>
      </div>`;
    return;
  }

  mediaGrid.innerHTML = assets.map((asset) => {
    const dimensions = asset.width && asset.height ? `${asset.width} × ${asset.height}` : "";
    const duration = asset.mediaType === "video" && asset.duration ? formatMediaDuration(asset.duration) : "";
    const detail = [asset.format?.toUpperCase(), dimensions, duration, formatMediaBytes(asset.bytes)]
      .filter(Boolean)
      .join(" · ");
    const preview = asset.mediaType === "video"
      ? `<video src="${escapeHtml(asset.url)}" preload="metadata" controls playsinline></video>`
      : `<img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.title)}" loading="lazy">`;

    return `
      <article class="media-card">
        <div class="media-card-preview">
          ${preview}
          <span class="media-type-badge">${asset.mediaType === "video" ? "Video" : "Photo"}</span>
          <button class="media-card-delete" type="button" data-delete-media="${escapeHtml(asset.mediaId)}" data-media-title="${escapeHtml(asset.title)}" aria-label="Delete ${escapeHtml(asset.title)}" title="Delete media">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>
          </button>
        </div>
        <div class="media-card-body">
          <div class="media-card-title">
            <strong title="${escapeHtml(asset.title)}">${escapeHtml(asset.title)}</strong>
            <small>${escapeHtml(new Date(asset.createdAt).toLocaleDateString())}</small>
          </div>
          ${asset.description ? `<p>${escapeHtml(asset.description)}</p>` : ""}
          <small class="media-card-detail">${escapeHtml(detail)}</small>
          <div class="media-id-row">
            <code title="${escapeHtml(asset.mediaId)}">${escapeHtml(asset.mediaId)}</code>
            <button type="button" data-copy-media-id="${escapeHtml(asset.mediaId)}" aria-label="Copy media ID" title="Copy media ID">
              <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>
            </button>
          </div>
        </div>
      </article>`;
  }).join("");
}

async function loadMediaLibrary(force = false) {
  if (!mediaGrid || mediaState.loading || (mediaState.loaded && !force)) return;
  mediaState.loading = true;
  if (!mediaState.loaded) mediaGrid.innerHTML = `<div class="media-library-empty">Loading media...</div>`;
  setMediaStatus("");

  try {
    const data = await requestJson("/api/media");
    mediaState.assets = data.media || [];
    mediaState.loaded = true;
    renderMediaLibrary();
    renderSendMediaOptions();
    updateTemplateHeaderControls();
  } catch (error) {
    setMediaStatus(error.message, true);
    if (!mediaState.loaded) {
      mediaGrid.innerHTML = `<div class="media-library-empty">Media could not be loaded.</div>`;
    }
  } finally {
    mediaState.loading = false;
  }
}

function openMediaModal() {
  if (!mediaModal) return;
  mediaUploadForm?.reset();
  if (mediaFileLabel) mediaFileLabel.textContent = "Choose a photo or video";
  setMediaUploadStatus("");
  mediaModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeMediaModal() {
  if (!mediaModal || mediaUploadSubmit?.disabled) return;
  mediaModal.hidden = true;
  document.body.classList.remove("modal-open");
  mediaUploadForm?.reset();
  setMediaUploadStatus("");
}

async function uploadMedia() {
  if (!mediaUploadForm || !mediaFileInput?.files?.[0]) return;
  const file = mediaFileInput.files[0];
  if (file.size > 50 * 1024 * 1024) {
    setMediaUploadStatus("Media must be 50 MB or smaller.", true);
    return;
  }

  const formData = new FormData(mediaUploadForm);
  if (mediaUploadSubmit) mediaUploadSubmit.disabled = true;
  setMediaUploadStatus("Uploading securely to Cloudinary...");

  try {
    const data = await requestJson("/api/media", {
      method: "POST",
      body: formData
    });
    mediaState.assets.unshift(data.media);
    mediaState.loaded = true;
    renderMediaLibrary();
    renderSendMediaOptions();
    updateTemplateHeaderControls();
    if (mediaUploadSubmit) mediaUploadSubmit.disabled = false;
    closeMediaModal();
    setMediaStatus("Media uploaded.");
  } catch (error) {
    setMediaUploadStatus(error.message, true);
    if (mediaUploadSubmit) mediaUploadSubmit.disabled = false;
  }
}

async function deleteMediaAsset(mediaId, title) {
  const confirmed = await showConfirmModal({
    eyebrow: "Media library",
    title: `Delete "${title || "this media"}"?`,
    message: "This permanently deletes the asset from both InterCon and Cloudinary.",
    confirmText: "Delete media"
  });
  if (!confirmed) return;

  await requestJson(`/api/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" });
  mediaState.assets = mediaState.assets.filter((asset) => asset.mediaId !== mediaId);
  renderMediaLibrary();
  renderSendMediaOptions();
  updateTemplateHeaderControls();
  setMediaStatus("Media deleted.");
}

openMediaModalButton?.addEventListener("click", openMediaModal);
closeMediaModalButtons.forEach((button) => button.addEventListener("click", closeMediaModal));
refreshMediaButton?.addEventListener("click", () => loadMediaLibrary(true));
mediaFilter?.addEventListener("change", renderMediaLibrary);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mediaModal && !mediaModal.hidden) closeMediaModal();
});

mediaFileInput?.addEventListener("change", () => {
  const file = mediaFileInput.files?.[0];
  if (!file) return;
  if (mediaFileLabel) mediaFileLabel.textContent = file.name;
  if (mediaTitleInput && !mediaTitleInput.value.trim()) {
    mediaTitleInput.value = file.name.replace(/\.[^.]+$/, "");
  }
});

mediaUploadForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  uploadMedia();
});

mediaGrid?.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy-media-id]");
  if (copyButton) {
    navigator.clipboard.writeText(copyButton.getAttribute("data-copy-media-id") || "")
      .then(() => setMediaStatus("Media ID copied."))
      .catch(() => setMediaStatus("Could not copy the media ID.", true));
    return;
  }

  const deleteButton = event.target.closest("[data-delete-media]");
  if (deleteButton) {
    deleteMediaAsset(
      deleteButton.getAttribute("data-delete-media"),
      deleteButton.getAttribute("data-media-title")
    ).catch((error) => setMediaStatus(error.message, true));
  }
});

// ============================================================
// Inbox: two-way WhatsApp conversations (WhatsApp-Web style on
// desktop, single-pane chat on mobile). Inbound replies arrive via
// the Meta webhook; the browser polls to surface them.
// ============================================================
const inboxApp = document.querySelector("[data-inbox-app]");
const inboxListPane = document.querySelector("[data-inbox-list-pane]");
const inboxThreads = document.querySelector("[data-inbox-threads]");
const inboxSearchInput = document.querySelector("[data-inbox-search]");
const inboxRefreshButton = document.querySelector("[data-inbox-refresh]");
const inboxChatEmpty = document.querySelector("[data-inbox-chat-empty]");
const inboxChatActive = document.querySelector("[data-inbox-chat-active]");
const inboxMessagesEl = document.querySelector("[data-inbox-messages]");
const inboxActiveName = document.querySelector("[data-inbox-active-name]");
const inboxActivePhone = document.querySelector("[data-inbox-active-phone]");
const inboxActiveAvatar = document.querySelector("[data-inbox-active-avatar]");
const inboxComposer = document.querySelector("[data-inbox-composer]");
const inboxInput = document.querySelector("[data-inbox-input]");
const inboxSendButton = document.querySelector("[data-inbox-send]");
const inboxStatus = document.querySelector("[data-inbox-status]");
const inboxWindowNote = document.querySelector("[data-inbox-window-note]");
const inboxBackButton = document.querySelector("[data-inbox-back]");
const inboxRailBadge = document.querySelector("[data-inbox-rail-badge]");
const inboxPhoneMedia = window.matchMedia("(max-width: 560px)");

const INBOX_POLL_MS = 15000;
const INBOX_UNREAD_POLL_MS = 30000;
const INBOX_STATUS_REFRESH_MS = 60000;

const inboxState = {
  conversations: [],
  activeId: null,
  activeWindowOpen: false,
  windowTimer: null,
  activeLoadToken: 0,
  activeLastMessageAt: "",
  lastMessageRefreshAt: 0,
  search: "",
  pollTimer: null,
  unreadTimer: null,
  loadingActive: false,
  polling: false
};

function getInitials(value) {
  const parts = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatClockTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatThreadTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return formatClockTime(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function setInboxStatus(message, isError = false) {
  if (!inboxStatus) return;
  inboxStatus.textContent = message || "";
  inboxStatus.classList.toggle("error", Boolean(isError));
}

function updateInboxRailBadge(totalUnread) {
  if (!inboxRailBadge) return;
  const count = Number(totalUnread) || 0;
  if (count > 0) {
    inboxRailBadge.textContent = count > 99 ? "99+" : String(count);
    inboxRailBadge.hidden = false;
  } else {
    inboxRailBadge.hidden = true;
  }
}

function setInboxPane(pane) {
  if (!inboxApp) return;
  const resolvedPane = inboxPhoneMedia.matches ? pane : "split";
  inboxApp.setAttribute("data-inbox-pane", resolvedPane);

  // Desktop/tablet is permanently split-pane. Keep the list mounted and
  // visible even if stale responsive styles are still present in the browser.
  if (!inboxPhoneMedia.matches && inboxListPane) {
    inboxListPane.hidden = false;
    inboxListPane.style.setProperty("display", "grid", "important");
  } else if (inboxListPane) {
    inboxListPane.style.removeProperty("display");
  }
}

function syncInboxPaneToViewport() {
  setInboxPane(inboxState.activeId ? "chat" : "list");
}

function isInboxViewVisible() {
  const view = inboxApp?.closest("[data-portal-view]");
  return Boolean(view && !view.hidden && document.visibilityState !== "hidden");
}

function renderInboxConversations() {
  if (!inboxThreads) return;

  const term = inboxState.search.trim().toLowerCase();
  const list = term
    ? inboxState.conversations.filter((conversation) => {
      return [
        conversation.customerName,
        conversation.customerPhone,
        ...(conversation.groups || []),
        ...(conversation.tags || []),
        ...(conversation.manualTags || [])
      ].join(" ").toLowerCase().includes(term);
    })
    : inboxState.conversations;

  if (!list.length) {
    inboxThreads.innerHTML = `<div class="inbox-empty">${term ? "No matching conversations." : "No conversations yet. Customer replies will appear here."}</div>`;
    return;
  }

  inboxThreads.innerHTML = list.map((conversation) => {
    const isActive = conversation.id === inboxState.activeId;
    const unread = conversation.unreadCount > 0;
    const prefix = conversation.lastDirection === "out" ? "You: " : "";
    const groupDetails = conversation.groupDetails || [];
    const manualTags = conversation.manualTags || [];
    const primaryGroup = groupDetails[0] || null;
    const groupTitle = groupDetails
      .map((group) => `${group.name} (#${group.tag})`)
      .join(", ");
    const manualTagTitle = manualTags.map((tag) => `#${tag}`).join(", ");
    const metadata = [
      primaryGroup
        ? `<span class="inbox-contact-context" title="${escapeHtml(groupTitle)}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-1a2.5 2.5 0 1 0 0-5M3 19v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2m1-6h1a4 4 0 0 1 4 4v2"/></svg>
            <strong>${escapeHtml(primaryGroup.name)}</strong>
            <i>#${escapeHtml(primaryGroup.tag)}</i>
            ${groupDetails.length > 1 ? `<em>+${groupDetails.length - 1}</em>` : ""}
          </span>`
        : "",
      manualTags.length
        ? `<span class="inbox-manual-tags" title="${escapeHtml(manualTagTitle)}">#${escapeHtml(manualTags[0])}${manualTags.length > 1 ? ` +${manualTags.length - 1}` : ""}</span>`
        : ""
    ].filter(Boolean).join("");
    return `
      <div class="inbox-thread-row${isActive ? " is-active" : ""}">
        <button
          type="button"
          class="inbox-thread${isActive ? " is-active" : ""}"
          data-inbox-thread="${escapeHtml(conversation.id)}"
          aria-pressed="${isActive ? "true" : "false"}">
          <span class="inbox-avatar">${escapeHtml(getInitials(conversation.customerName))}</span>
          <span class="inbox-thread-body">
            <span class="inbox-thread-top">
              <strong>${escapeHtml(conversation.customerName)}</strong>
              <em>${escapeHtml(formatThreadTime(conversation.lastMessageAt))}</em>
            </span>
            <span class="inbox-thread-bottom">
              <span class="inbox-thread-preview">${escapeHtml(prefix + (conversation.lastMessageText || ""))}</span>
              ${metadata ? `<span class="inbox-contact-meta">${metadata}</span>` : ""}
              ${unread ? `<span class="inbox-thread-badge">${conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>` : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          class="inbox-thread-delete"
          data-inbox-delete="${escapeHtml(conversation.id)}"
          data-inbox-delete-name="${escapeHtml(conversation.customerName || conversation.customerPhone)}"
          aria-label="Delete chat with ${escapeHtml(conversation.customerName || conversation.customerPhone)}"
          title="Delete chat">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>
        </button>
      </div>
    `;
  }).join("");
}

function updateInboxActiveThread() {
  if (!inboxThreads) return;
  inboxThreads.querySelectorAll("[data-inbox-thread]").forEach((thread) => {
    const isActive = thread.getAttribute("data-inbox-thread") === inboxState.activeId;
    thread.classList.toggle("is-active", isActive);
    thread.closest(".inbox-thread-row")?.classList.toggle("is-active", isActive);
    thread.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function markActiveConversationReadInList() {
  const activeConversation = inboxState.conversations.find((item) => item.id === inboxState.activeId);
  if (activeConversation) activeConversation.unreadCount = 0;

  const activeThread = inboxThreads?.querySelector(`[data-inbox-thread="${CSS.escape(inboxState.activeId || "")}"]`);
  activeThread?.querySelector(".inbox-thread-badge")?.remove();

  const totalUnread = inboxState.conversations.reduce(
    (total, conversation) => total + (Number(conversation.unreadCount) || 0),
    0
  );
  updateInboxRailBadge(totalUnread);
}

function renderInboxMessages(messages) {
  if (!inboxMessagesEl) return;

  if (!messages.length) {
    inboxMessagesEl.innerHTML = `<div class="inbox-day-chip">No messages yet</div>`;
    return;
  }

  inboxMessagesEl.innerHTML = messages.map((message) => {
    const outbound = message.direction === "out";
    const caption = message.caption || message.mediaCaption || "";
    const ticks = outbound
      ? `<i class="inbox-ticks ${message.status === "read" ? "is-read" : ""}" aria-hidden="true">${["delivered", "read"].includes(message.status) ? "✓✓" : "✓"}</i>`
      : "";

    if (message.revoked) {
      return `
        <div class="inbox-bubble ${outbound ? "is-out" : "is-in"} is-revoked">
          <p><em>🚫 This message was deleted</em></p>
          <span class="inbox-bubble-meta">${escapeHtml(formatClockTime(message.sentAt))}${ticks}</span>
        </div>
      `;
    }

    const body = message.text || caption || "";
    const editedTag = message.edited ? `<span class="inbox-edited">edited</span>` : "";
    return `
      <div class="inbox-bubble ${outbound ? "is-out" : "is-in"}">
        ${caption && body !== caption ? `<span class="inbox-bubble-tag">${escapeHtml(caption)}</span>` : ""}
        <p>${escapeHtml(body)}</p>
        <span class="inbox-bubble-meta">${editedTag}${escapeHtml(formatClockTime(message.sentAt))}${ticks}</span>
      </div>
    `;
  }).join("");

  inboxMessagesEl.scrollTop = inboxMessagesEl.scrollHeight;
}

function applyInboxWindowState(conversation) {
  if (inboxState.windowTimer) {
    clearTimeout(inboxState.windowTimer);
    inboxState.windowTimer = null;
  }

  const expiresAt = conversation?.windowExpiresAt
    ? new Date(conversation.windowExpiresAt).getTime()
    : 0;
  const remainingMs = expiresAt ? expiresAt - Date.now() : 0;

  inboxState.activeWindowOpen = Boolean(
    conversation?.windowOpen
    && (!expiresAt || remainingMs > 0)
  );
  const disabled = !inboxState.activeWindowOpen;

  if (inboxInput) {
    inboxInput.disabled = disabled;
    inboxInput.placeholder = disabled
      ? "You can message this customer using an approved template."
      : "Type a message";
  }
  if (inboxSendButton) inboxSendButton.disabled = disabled;

  if (inboxWindowNote) {
    inboxWindowNote.hidden = true;
    inboxWindowNote.textContent = "";
  }

  // Close the free-form composer at the exact policy deadline even if no
  // polling request happens at that moment.
  if (!disabled && remainingMs > 0) {
    inboxState.windowTimer = setTimeout(() => {
      applyInboxWindowState({
        ...conversation,
        windowOpen: false,
        windowExpiresAt: conversation.windowExpiresAt
      });
    }, Math.min(remainingMs + 250, 2147483647));
  }
}

function setInboxConversationLoading() {
  inboxState.activeWindowOpen = false;

  if (inboxMessagesEl) {
    inboxMessagesEl.setAttribute("aria-busy", "true");
    inboxMessagesEl.innerHTML = `<div class="inbox-day-chip">Loading conversation...</div>`;
  }
  if (inboxInput) {
    inboxInput.value = "";
    inboxInput.style.height = "auto";
    inboxInput.disabled = true;
    inboxInput.placeholder = "Loading conversation...";
  }
  if (inboxSendButton) inboxSendButton.disabled = true;
  if (inboxWindowNote) inboxWindowNote.hidden = true;
}

function showInboxConversationPane() {
  if (inboxApp) inboxApp.classList.add("has-active-chat");

  if (inboxChatEmpty) {
    inboxChatEmpty.hidden = true;
    inboxChatEmpty.style.setProperty("display", "none", "important");
  }

  if (inboxChatActive) {
    inboxChatActive.hidden = false;
    inboxChatActive.style.setProperty("display", "grid", "important");
  }
}

function showInboxEmptyPane() {
  if (inboxApp) inboxApp.classList.remove("has-active-chat");

  if (inboxChatEmpty) {
    inboxChatEmpty.hidden = false;
    inboxChatEmpty.style.removeProperty("display");
  }

  if (inboxChatActive) {
    inboxChatActive.hidden = true;
    inboxChatActive.style.removeProperty("display");
  }
}

async function loadInboxConversations(silent = false) {
  if (!inboxThreads) return;
  try {
    const data = await requestJson("/api/inbox/conversations");
    inboxState.conversations = data.conversations || [];
    updateInboxRailBadge(data.totalUnread || 0);
    renderInboxConversations();
  } catch (error) {
    if (!silent) {
      inboxThreads.innerHTML = `<div class="inbox-empty">${escapeHtml(error.message)}</div>`;
    }
  }
}

async function openInboxConversation(conversationId) {
  if (!conversationId) return;
  const loadToken = ++inboxState.activeLoadToken;
  inboxState.activeId = conversationId;
  inboxState.loadingActive = true;
  setInboxStatus("");
  setInboxPane("chat");
  setInboxConversationLoading();
  showInboxConversationPane();

  const conversation = inboxState.conversations.find((item) => item.id === conversationId);
  if (conversation) {
    if (inboxActiveName) inboxActiveName.textContent = conversation.customerName;
    if (inboxActivePhone) inboxActivePhone.textContent = `+${conversation.customerPhone}`;
    if (inboxActiveAvatar) inboxActiveAvatar.textContent = getInitials(conversation.customerName);
  }

  updateInboxActiveThread();

  try {
    const data = await requestJson(`/api/inbox/conversations/${conversationId}/messages`);
    if (inboxState.activeId !== conversationId || inboxState.activeLoadToken !== loadToken) return;
    if (inboxMessagesEl) inboxMessagesEl.setAttribute("aria-busy", "false");
    renderInboxMessages(data.messages || []);
    applyInboxWindowState(data.conversation);
    inboxState.activeLastMessageAt = data.conversation?.lastMessageAt || "";
    inboxState.lastMessageRefreshAt = Date.now();
    // The server clears unread on open. Update the existing row without
    // replacing the left-pane DOM.
    markActiveConversationReadInList();
  } catch (error) {
    if (inboxState.activeId !== conversationId || inboxState.activeLoadToken !== loadToken) return;
    if (inboxMessagesEl) inboxMessagesEl.setAttribute("aria-busy", "false");
    if (inboxMessagesEl) {
      inboxMessagesEl.innerHTML = `<div class="inbox-day-chip">Conversation could not be loaded</div>`;
    }
    setInboxStatus(error.message, true);
  } finally {
    if (inboxState.activeLoadToken === loadToken) inboxState.loadingActive = false;
  }
}

async function refreshActiveConversation() {
  if (!inboxState.activeId || inboxState.loadingActive) return;
  const conversationId = inboxState.activeId;
  try {
    const data = await requestJson(`/api/inbox/conversations/${conversationId}/messages`);
    if (!data.conversation || inboxState.activeId !== conversationId || inboxState.loadingActive) return;
    renderInboxMessages(data.messages || []);
    applyInboxWindowState(data.conversation);
    inboxState.activeLastMessageAt = data.conversation.lastMessageAt || "";
    inboxState.lastMessageRefreshAt = Date.now();
  } catch (error) {
    // Silent during polling.
  }
}

async function sendInboxReply() {
  const conversationId = inboxState.activeId;
  if (!conversationId || !inboxInput) return;

  const text = inboxInput.value.trim();
  if (!text) return;

  if (inboxSendButton) inboxSendButton.disabled = true;
  setInboxStatus("");

  try {
    const data = await requestJson(`/api/inbox/conversations/${conversationId}/reply`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
    inboxInput.value = "";
    autoGrowInboxInput();
    if (data.conversation) applyInboxWindowState(data.conversation);
    await refreshActiveConversation();
    await loadInboxConversations(true);
  } catch (error) {
    setInboxStatus(error.message, true);
  } finally {
    if (inboxSendButton) inboxSendButton.disabled = !inboxState.activeWindowOpen;
  }
}

async function deleteInboxConversation(conversationId, customerName) {
  const confirmed = await showConfirmModal({
    eyebrow: "Delete chat",
    title: `Delete chat with ${customerName || "this contact"}?`,
    message: "This permanently deletes the local chat and its message history. The contact and messages in WhatsApp are not deleted.",
    confirmText: "Delete chat"
  });
  if (!confirmed) return;

  await requestJson(`/api/inbox/conversations/${conversationId}`, {
    method: "DELETE"
  });

  inboxState.conversations = inboxState.conversations.filter(
    (conversation) => conversation.id !== conversationId
  );

  if (inboxState.activeId === conversationId) {
    inboxState.activeId = null;
    inboxState.activeWindowOpen = false;
    inboxState.activeLastMessageAt = "";
    inboxState.lastMessageRefreshAt = 0;
    inboxState.activeLoadToken += 1;
    inboxState.loadingActive = false;
    if (inboxState.windowTimer) {
      clearTimeout(inboxState.windowTimer);
      inboxState.windowTimer = null;
    }
    showInboxEmptyPane();
    setInboxPane("list");
  }

  renderInboxConversations();
  updateInboxRailBadge(inboxState.conversations.reduce(
    (total, conversation) => total + (Number(conversation.unreadCount) || 0),
    0
  ));
}

function autoGrowInboxInput() {
  if (!inboxInput) return;
  inboxInput.style.height = "auto";
  inboxInput.style.height = `${Math.min(inboxInput.scrollHeight, 120)}px`;
}

async function pollInboxUnread() {
  // The visible inbox conversation-list response already contains this count.
  if (isInboxViewVisible()) return;
  try {
    const data = await requestJson("/api/inbox/unread");
    updateInboxRailBadge(data.totalUnread || 0);
  } catch (error) {
    // Ignore polling errors.
  }
}

async function pollInboxView() {
  if (!isInboxViewVisible() || inboxState.polling) return;
  inboxState.polling = true;

  try {
    await loadInboxConversations(true);

    const activeConversation = inboxState.conversations.find((item) => item.id === inboxState.activeId);
    const lastMessageChanged = Boolean(
      activeConversation
      && String(activeConversation.lastMessageAt || "") !== String(inboxState.activeLastMessageAt || "")
    );
    const statusRefreshDue = Date.now() - inboxState.lastMessageRefreshAt >= INBOX_STATUS_REFRESH_MS;

    if (inboxState.activeId && (lastMessageChanged || statusRefreshDue)) {
      await refreshActiveConversation();
    }
  } finally {
    inboxState.polling = false;
  }
}

function startInboxView() {
  loadInboxConversations();
  if (inboxState.activeId) refreshActiveConversation();

  if (inboxState.pollTimer) clearInterval(inboxState.pollTimer);
  inboxState.pollTimer = setInterval(pollInboxView, INBOX_POLL_MS);
}

function stopInboxPolling() {
  if (inboxState.pollTimer) {
    clearInterval(inboxState.pollTimer);
    inboxState.pollTimer = null;
  }
}

function onPortalViewShown(viewId) {
  if (viewId === "inbox") {
    startInboxView();
  } else {
    stopInboxPolling();
  }
  if (viewId === "media-library") loadMediaLibrary();
  if (viewId === "send-whatsapp") {
    Promise.all([
      loadContacts(),
      loadGroups(),
      loadApprovedTemplates(),
      loadSendHistory(),
      loadMediaLibrary()
    ]).then(renderSendMediaOptions).catch((error) => setSendMessage(error.message, true));
  }
  if (viewId === "templates") {
    loadTemplates().catch((error) => setTemplateMessage(error.message, true));
  }
  if (viewId === "contacts") {
    Promise.all([loadContacts(), loadGroups()]).catch((error) => setContactMessage(error.message, true));
  }
  if (viewId === "groups") {
    loadGroups().catch((error) => setGroupMessage(error.message, true));
  }
  if (viewId === "connect" || viewId === "coexistence") {
    loadOnboardingStatus().catch((error) => setMetaConnectMessage(error.message, true));
    // Warm up the Facebook SDK so the Meta popup can be opened synchronously on
    // click (Safari blocks popups opened after an async wait).
    loadFacebookSdk().catch(() => {});
  }
  if (viewId === "billing" || viewId === "payments") {
    loadBilling().catch((error) => {
      if (billingMessage) {
        billingMessage.textContent = error.message;
        billingMessage.classList.add("error");
      }
    });
  }
  if (viewId === "developer-api" || viewId === "api") {
    loadApiKeys().catch((error) => setApiMessage(error.message, true));
  }
  if (viewId === "reports") {
    loadSendHistory().catch((error) => setSendMessage(error.message, true));
  }
  if (viewId === "home" || viewId === "setup") {
    Promise.allSettled([
      loadOnboardingStatus(),
      loadBilling(),
      loadContacts(),
      loadTemplates(),
      loadSendHistory(),
      loadApiKeys()
    ]);
  }
}

if (inboxThreads) {
  inboxThreads.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-inbox-delete]");
    if (deleteButton) {
      event.preventDefault();
      event.stopPropagation();
      deleteInboxConversation(
        deleteButton.getAttribute("data-inbox-delete"),
        deleteButton.getAttribute("data-inbox-delete-name")
      ).catch((error) => setInboxStatus(error.message, true));
      return;
    }

    const thread = event.target.closest("[data-inbox-thread]");
    if (!thread) return;
    openInboxConversation(thread.getAttribute("data-inbox-thread"));
  });
}

if (inboxSearchInput) {
  inboxSearchInput.addEventListener("input", () => {
    inboxState.search = inboxSearchInput.value;
    renderInboxConversations();
  });
}

if (inboxRefreshButton) {
  inboxRefreshButton.addEventListener("click", () => loadInboxConversations());
}

if (inboxBackButton) {
  inboxBackButton.addEventListener("click", () => setInboxPane("list"));
}

if (typeof inboxPhoneMedia.addEventListener === "function") {
  inboxPhoneMedia.addEventListener("change", syncInboxPaneToViewport);
} else if (typeof inboxPhoneMedia.addListener === "function") {
  inboxPhoneMedia.addListener(syncInboxPaneToViewport);
}

if (inboxComposer) {
  inboxComposer.addEventListener("submit", (event) => {
    event.preventDefault();
    sendInboxReply();
  });
}

if (inboxInput) {
  inboxInput.addEventListener("input", autoGrowInboxInput);
  inboxInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendInboxReply();
    }
  });
}

document.addEventListener("visibilitychange", () => {
  if (isInboxViewVisible()) {
    pollInboxView();
  } else if (document.visibilityState === "visible") {
    pollInboxUnread();
  }
});

syncInboxPaneToViewport();

// ============================================================
// Manage Groups: contact segments defined by a shared tag.
// ============================================================
const groupForm = document.querySelector("[data-group-form]");
const groupNameInput = document.querySelector("[data-group-name]");
const groupTagInput = document.querySelector("[data-group-tag]");
const groupDescriptionInput = document.querySelector("[data-group-description]");
const groupMessage = document.querySelector("[data-group-message]");
const groupList = document.querySelector("[data-group-list]");
const refreshGroupsButton = document.querySelector("[data-refresh-groups]");
const toggleGroupFormButton = document.querySelector("[data-toggle-group-form]");
const groupModal = document.querySelector("[data-group-modal]");
const closeGroupModalButtons = document.querySelectorAll("[data-close-group-modal]");
const groupMembers = document.querySelector("[data-group-members]");
const groupMembersTitle = document.querySelector("[data-group-members-title]");
const groupMembersList = document.querySelector("[data-group-members-list]");
const groupMembersClose = document.querySelector("[data-group-members-close]");
const assignModal = document.querySelector("[data-assign-modal]");
const assignGroupListEl = document.querySelector("[data-assign-group-list]");
const assignMessage = document.querySelector("[data-assign-message]");
const assignContactName = document.querySelector("[data-assign-contact-name]");
const saveAssignGroupButton = document.querySelector("[data-save-assign-group]");
const closeAssignModalButtons = document.querySelectorAll("[data-close-assign-modal]");
const assignState = {
  contactId: null,
  originalSegmentId: null,
  selectedSegmentId: null,
  saving: false
};

function setGroupMessage(message, isError = false) {
  if (!groupMessage) return;
  groupMessage.textContent = message || "";
  groupMessage.classList.toggle("error", Boolean(isError));
}

function openGroupModal() {
  if (!groupModal) return;
  setGroupMessage("");
  groupModal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => groupNameInput?.focus(), 50);
}

function closeGroupModal() {
  if (!groupModal) return;
  groupModal.hidden = true;
  document.body.classList.remove("modal-open");
  if (groupNameInput) groupNameInput.value = "";
  if (groupTagInput) groupTagInput.value = "";
  if (groupDescriptionInput) groupDescriptionInput.value = "";
  setGroupMessage("");
}

function renderGroups(segments) {
  if (!groupList) return;

  if (!segments.length) {
    groupList.innerHTML = `<div class="empty-row">No groups yet. Create one to organise contacts by tag.</div>`;
    return;
  }

  groupList.innerHTML = segments.map((segment) => `
    <div class="table-row group-table-row">
      <strong>${escapeHtml(segment.name)}</strong>
      <span data-label="Tag"><code class="group-tag-pill">${escapeHtml(segment.tag)}</code></span>
      <span data-label="Members">${Number(segment.memberCount || 0)}</span>
      <span data-label="Description">${escapeHtml(segment.description || "-")}</span>
      <span class="group-row-actions" data-label="Actions">
        <button type="button" class="btn btn-outline btn-small" data-view-group="${escapeHtml(segment._id)}" data-group-label="${escapeHtml(segment.name)}">View</button>
        <button type="button" class="group-action danger" data-delete-group="${escapeHtml(segment._id)}" data-group-label="${escapeHtml(segment.name)}" aria-label="Delete group" title="Delete group">&times;</button>
      </span>
    </div>
  `).join("");
}

async function loadGroups() {
  if (!groupList) return;
  try {
    const data = await requestJson("/api/contacts/segments");
    setupState.groups = data.segments || [];
    renderGroups(setupState.groups);
    renderSendGroupOptions(setupState.groups);
    return setupState.groups;
  } catch (error) {
    groupList.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}</div>`;
  }
}

async function createGroup() {
  const name = (groupNameInput?.value || "").trim();
  const tag = (groupTagInput?.value || "").trim();
  const description = (groupDescriptionInput?.value || "").trim();

  if (!name || !tag) {
    setGroupMessage("Group name and tag are required.", true);
    return;
  }

  setGroupMessage("Creating group...");
  await requestJson("/api/contacts/segments", {
    method: "POST",
    body: JSON.stringify({ name, tag, description })
  });

  closeGroupModal();
  await loadGroups();
}

function renderGroupMembers(members) {
  if (!groupMembersList) return;

  if (!members.length) {
    groupMembersList.innerHTML = `<div class="empty-row">No contacts carry this tag yet.</div>`;
    return;
  }

  groupMembersList.innerHTML = members.map((contact) => `
    <div class="table-row contact-table-row">
      <strong>${escapeHtml(contact.name || "")}</strong>
      <span data-label="Phone">${escapeHtml(contact.phone || "")}</span>
      <span data-label="Opt-in"><em class="${contact.optIn?.status ? "approved" : "pending"}">${contact.optIn?.status ? "Yes" : "Missing"}</em></span>
      <span data-label="Status">${escapeHtml(contact.status || "active")}</span>
    </div>
  `).join("");
}

async function viewGroupMembers(segmentId, label) {
  if (!groupMembers) return;
  groupMembers.hidden = false;
  if (groupMembersTitle) groupMembersTitle.textContent = `Members of ${label || "group"}`;
  if (groupMembersList) groupMembersList.innerHTML = `<div class="empty-row">Loading members...</div>`;
  groupMembers.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const data = await requestJson(`/api/contacts/segments/${segmentId}/members`);
    renderGroupMembers(data.members || []);
  } catch (error) {
    if (groupMembersList) groupMembersList.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}</div>`;
  }
}

async function deleteGroup(segmentId, label) {
  const confirmed = await showConfirmModal({
    eyebrow: "Group",
    title: `Delete the group "${label || ""}"?`,
    message: "This removes the group only. Contacts and their tags are kept.",
    confirmText: "Delete group"
  });
  if (!confirmed) return;

  setGroupMessage("Deleting group...");
  await requestJson(`/api/contacts/segments/${segmentId}`, { method: "DELETE" });
  if (groupMembers) groupMembers.hidden = true;
  setGroupMessage("Group deleted.");
  await loadGroups();
}

if (groupForm) {
  groupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = groupForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    try {
      await createGroup();
    } catch (error) {
      setGroupMessage(error.message, true);
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (toggleGroupFormButton) {
  toggleGroupFormButton.addEventListener("click", () => openGroupModal());
}

closeGroupModalButtons.forEach((button) => {
  button.addEventListener("click", () => closeGroupModal());
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && groupModal && !groupModal.hidden) {
    closeGroupModal();
  }
});

if (refreshGroupsButton) {
  refreshGroupsButton.addEventListener("click", () => loadGroups());
}

if (groupList) {
  groupList.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-view-group]");
    if (viewButton) {
      viewGroupMembers(viewButton.getAttribute("data-view-group"), viewButton.getAttribute("data-group-label"));
      return;
    }
    const deleteButton = event.target.closest("[data-delete-group]");
    if (deleteButton) {
      deleteGroup(deleteButton.getAttribute("data-delete-group"), deleteButton.getAttribute("data-group-label"))
        .catch((error) => setGroupMessage(error.message, true));
    }
  });
}

if (groupMembersClose) {
  groupMembersClose.addEventListener("click", () => {
    if (groupMembers) groupMembers.hidden = true;
  });
}

// --- Assign one current group; its tag replaces the contact's current tag. ---
function setAssignMessage(message, isError = false) {
  if (!assignMessage) return;
  assignMessage.textContent = message || "";
  assignMessage.classList.toggle("error", Boolean(isError));
}

function getContactById(contactId) {
  return (setupState.contacts || []).find((contact) => contact._id === contactId) || null;
}

async function renderAssignGroups() {
  if (!assignGroupListEl) return;
  assignGroupListEl.innerHTML = `<div class="empty-row">Loading groups...</div>`;

  try {
    const data = await requestJson("/api/contacts/segments");
    const segments = data.segments || [];
    if (!segments.length) {
      assignGroupListEl.innerHTML = `<div class="empty-row">No groups yet. Create one from Manage Groups first.</div>`;
      return;
    }

    const contact = getContactById(assignState.contactId) || { tags: [] };
    const tags = contact.tags || [];
    const matchedSegments = segments.filter((segment) => tags.includes(segment.tag));
    const selectedSegment = matchedSegments.length === 1 ? matchedSegments[0] : null;
    assignState.originalSegmentId = matchedSegments.length > 1
      ? "__multiple__"
      : selectedSegment
        ? String(selectedSegment._id)
        : null;
    assignState.selectedSegmentId = selectedSegment ? String(selectedSegment._id) : null;
    assignGroupListEl.innerHTML = [
      matchedSegments.length > 1
        ? `<div class="assign-group-warning">This contact has ${matchedSegments.length} group tags. Choose one group to replace the previous assignments.</div>`
        : "",
      `<label class="assign-group-item">
        <input type="radio" name="contact-group" data-assign-group-choice value="" ${matchedSegments.length ? "" : "checked"}>
        <span class="assign-group-copy">
          <strong>No group</strong>
          <small>Remove the current tag</small>
        </span>
      </label>`,
      ...segments.map((segment) => {
      const checked = selectedSegment && String(selectedSegment._id) === String(segment._id);
      return `
        <label class="assign-group-item">
          <input type="radio" name="contact-group" data-assign-group-choice value="${escapeHtml(segment._id)}" ${checked ? "checked" : ""}>
          <span class="assign-group-copy">
            <strong>${escapeHtml(segment.name)}</strong>
            <code class="group-tag-pill">${escapeHtml(segment.tag)}</code>
          </span>
        </label>
      `;
      })
    ].join("");
  } catch (error) {
    assignGroupListEl.innerHTML = `<div class="empty-row">${escapeHtml(error.message)}</div>`;
  }
}

function openAssignModal(contactId, name) {
  if (!assignModal) return;
  assignState.contactId = contactId;
  assignState.originalSegmentId = null;
  assignState.selectedSegmentId = null;
  assignState.saving = false;
  setAssignMessage("");
  if (assignContactName) assignContactName.textContent = `Group for ${name || "this contact"}`;
  assignModal.hidden = false;
  document.body.classList.add("modal-open");
  if (saveAssignGroupButton) saveAssignGroupButton.disabled = false;
  renderAssignGroups();
}

function closeAssignModal() {
  if (!assignModal || assignState.saving) return;
  assignModal.hidden = true;
  document.body.classList.remove("modal-open");
  assignState.contactId = null;
  assignState.originalSegmentId = null;
  assignState.selectedSegmentId = null;
  setAssignMessage("");
}

async function saveContactGroupAssignment() {
  if (!assignState.contactId || assignState.saving) return;

  if (assignState.selectedSegmentId === assignState.originalSegmentId) {
    closeAssignModal();
    return;
  }

  const choices = assignGroupListEl?.querySelectorAll("[data-assign-group-choice]") || [];
  assignState.saving = true;
  choices.forEach((choice) => {
    choice.disabled = true;
  });
  if (saveAssignGroupButton) saveAssignGroupButton.disabled = true;
  setAssignMessage("Saving group...");

  try {
    const data = await requestJson(`/api/contacts/${assignState.contactId}/group`, {
      method: "PUT",
      body: JSON.stringify({ segmentId: assignState.selectedSegmentId || null })
    });

    if (data.contact) {
      const contact = getContactById(assignState.contactId);
      if (contact) {
        contact.tags = data.contact.tags || [];
        contact.group = data.group || null;
      }
      renderContactRows(setupState.contacts);
    }
    assignState.originalSegmentId = assignState.selectedSegmentId;
    loadGroups().catch(() => null);
    loadInboxConversations(true);
    assignState.saving = false;
    closeAssignModal();
  } catch (error) {
    setAssignMessage(error.message, true);
    assignState.saving = false;
    choices.forEach((choice) => {
      choice.disabled = false;
    });
    if (saveAssignGroupButton) saveAssignGroupButton.disabled = false;
  }
}

if (contactList) {
  contactList.addEventListener("click", (event) => {
    const assignButton = event.target.closest("[data-assign-groups]");
    if (!assignButton) return;
    openAssignModal(assignButton.getAttribute("data-assign-groups"), assignButton.getAttribute("data-contact-name"));
  });
}

if (assignGroupListEl) {
  assignGroupListEl.addEventListener("change", (event) => {
    const radio = event.target.closest("[data-assign-group-choice]");
    if (!radio || !radio.checked) return;
    assignState.selectedSegmentId = radio.value || null;
    setAssignMessage("Selection changed. Click Done to save.");
  });
}

if (saveAssignGroupButton) {
  saveAssignGroupButton.addEventListener("click", () => {
    saveContactGroupAssignment();
  });
}

closeAssignModalButtons.forEach((button) => {
  button.addEventListener("click", () => closeAssignModal());
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && assignModal && !assignModal.hidden) {
    closeAssignModal();
  }
});

showPortalView(getInitialViewId(), true);
renderApiBaseUrl();
loadAuthenticatedProfile().catch(() => renderAuthenticatedProfile());

// Preload the Facebook SDK at startup so the Meta onboarding popup can open
// synchronously inside the click gesture (required by Safari's popup blocker).
loadFacebookSdk().catch(() => {});

// Keep the Inbox rail badge live regardless of the current view.
pollInboxUnread();
if (inboxRailBadge) {
  inboxState.unreadTimer = setInterval(pollInboxUnread, INBOX_UNREAD_POLL_MS);
}
