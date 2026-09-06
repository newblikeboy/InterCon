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
const contactTemplateButtons = document.querySelectorAll("[data-contact-template]");
const contactMessage = document.querySelector("[data-contact-message]");
const contactList = document.querySelector("[data-contact-list]");
const refreshContactsButton = document.querySelector("[data-refresh-contacts]");
const contactEditModal = document.querySelector("[data-contact-edit-modal]");
const contactEditForm = document.querySelector("[data-contact-edit-form]");
const contactEditName = document.querySelector("[data-contact-edit-name]");
const contactEditPhone = document.querySelector("[data-contact-edit-phone]");
const contactEditEmail = document.querySelector("[data-contact-edit-email]");
const contactEditCity = document.querySelector("[data-contact-edit-city]");
const contactEditTag = document.querySelector("[data-contact-edit-tag]");
const contactEditOptIn = document.querySelector("[data-contact-edit-opt-in]");
const contactEditProof = document.querySelector("[data-contact-edit-proof]");
const contactEditStatus = document.querySelector("[data-contact-edit-status]");
const contactEditMessage = document.querySelector("[data-contact-edit-message]");
const contactEditSave = document.querySelector("[data-contact-edit-save]");
const closeContactEditButtons = document.querySelectorAll("[data-close-contact-edit]");
const templateNameInput = document.querySelector("[data-template-name]");
const templateLanguageSelect = document.querySelector("[data-template-language]");
const templateCategorySelect = document.querySelector("[data-template-category]");
const templateBodyInput = document.querySelector("[data-template-body]");
const templateSamplesInput = document.querySelector("[data-template-samples]");
const templateVariableSamplesHost = document.querySelector("[data-template-variable-samples]");
const templateHeaderTypeSelect = document.querySelector("[data-template-header-type]");
const templateHeaderMediaField = document.querySelector("[data-template-header-media-field]");
const templateHeaderMediaSelect = document.querySelector("[data-template-header-media]");
const templateAddCtaButton = document.querySelector("[data-template-add-cta]");
const templateCtaMenu = document.querySelector("[data-template-cta-menu]");
const templateCtaList = document.querySelector("[data-template-cta-list]");
const templatePreviewName = document.querySelector("[data-template-preview-name]");
const templatePreviewCategory = document.querySelector("[data-template-preview-category]");
const templatePreviewBody = document.querySelector("[data-template-preview-body]");
const templatePreviewMedia = document.querySelector("[data-template-preview-media]");
const templatePreviewCtas = document.querySelector("[data-template-preview-ctas]");
const templatePreviewTime = document.querySelector("[data-template-preview-time]");
const templatePreviewBubbleTime = document.querySelector("[data-template-preview-bubble-time]");
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
const reportForm = document.querySelector("[data-report-form]");
const reportSearchButton = reportForm?.querySelector("button[type=\"submit\"]");
const reportFromInput = document.querySelector("[data-report-from]");
const reportToInput = document.querySelector("[data-report-to]");
const reportStatusSelect = document.querySelector("[data-report-status]");
const reportPhoneInput = document.querySelector("[data-report-phone]");
const reportLimitSelect = document.querySelector("[data-report-limit]");
const reportHistory = document.querySelector("[data-report-history]");
const reportMessage = document.querySelector("[data-report-message]");
const reportPagination = document.querySelector("[data-report-pagination]");
const reportPreviousButton = document.querySelector("[data-report-previous]");
const reportNextButton = document.querySelector("[data-report-next]");
const reportPageLabel = document.querySelector("[data-report-page]");
const reportRange = document.querySelector("[data-report-range]");
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
const chatbotNameInput = document.querySelector("[data-chatbot-name]");
const chatbotCanvas = document.querySelector("[data-chatbot-canvas]");
const chatbotInspector = document.querySelector("[data-chatbot-inspector]");
const chatbotMessage = document.querySelector("[data-chatbot-message]");
const chatbotFlowList = document.querySelector("[data-chatbot-flow-list]");
const chatbotSaveButton = document.querySelector("[data-chatbot-save]");
const chatbotLaunchButton = document.querySelector("[data-chatbot-launch]");
const chatbotNewButton = document.querySelector("[data-chatbot-new]");
const chatbotRefreshButton = document.querySelector("[data-chatbot-refresh]");
const chatbotAutoLayoutButton = document.querySelector("[data-chatbot-auto-layout]");
const chatbotAddNodeButtons = document.querySelectorAll("[data-chatbot-add-node]");
const chatbotPlusButton = document.querySelector("[data-chatbot-plus]");
const chatbotPlusMenu = document.querySelector("[data-chatbot-plus-menu]");
const chatbotFloatingActions = chatbotPlusButton?.closest(".chatbot-floating-actions") || null;
const chatbotZoomOutButton = document.querySelector("[data-chatbot-zoom-out]");
const chatbotZoomInButton = document.querySelector("[data-chatbot-zoom-in]");
const chatbotPanButton = document.querySelector("[data-chatbot-pan]");
const chatbotZoomLabel = document.querySelector("[data-chatbot-zoom-label]");
const chatbotStatus = document.querySelector("[data-chatbot-status]");
const defaultPortalView = "home";
let facebookSdkPromise;
// Once resolved, holds { FB, config } synchronously so the Meta popup can be
// opened directly inside a click gesture (required by Safari's popup blocker).
let facebookSdk = null;
let metaOnboardingSession = null;
let razorpayCheckoutPromise;
let embeddedSignupSessionInfo = null;
let embeddedSignupSessionResolvers = [];
let embeddedSignupSessionRejecters = [];
const setupState = {
  user: null,
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
  sampleValues: [],
  rows: [],
  fileName: ""
};
const contactEditState = {
  contactId: null,
  saving: false
};
const bulkPreviewState = {
  rows: [],
  summary: {},
  template: {},
  search: "",
  page: 1,
  pageSize: 25
};
const reportState = {
  searched: false,
  loading: false,
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1,
  filters: {}
};
const chatbotState = {
  currentId: null,
  status: "draft",
  loaded: false,
  selectedNodeId: "trigger",
  draggingNodeId: null,
  dragOffset: { x: 0, y: 0 },
  panMode: false,
  panning: false,
  panStart: { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 },
  zoom: 1,
  flows: [],
  nodes: [],
  edges: []
};

if (templateModal) {
  document.querySelector("#templates .portal-section-head")?.insertAdjacentElement("afterend", templateModal);
}

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
  return Array.from(portalViews).some((view) => view.id === viewId);
}

// Top-level launcher pages (rail items) and the feature views they own.
const PAGES = ["home", "setup", "send-whatsapp", "inbox", "chatbot", "reports", "payments", "api"];
const PAGE_TITLES = { home: "Home", setup: "Setup", "send-whatsapp": "Send WhatsApp", inbox: "Inbox", chatbot: "ChatBot", reports: "Reports", payments: "Payments", api: "API" };
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
  chatbot: { title: "ChatBot Builder", related: ["inbox", "templates", "contacts"] },
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
      history.pushState(null, "", `#${nextViewId}`);
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

function openTemplateModal({ reset = false } = {}) {
  if (!templateModal) return;
  if (reset) resetTemplateBuilder();
  templateModal.hidden = false;
  setTemplateMessage("");
  loadMediaLibrary().then(updateTemplateHeaderControls).catch(() => updateTemplateHeaderControls());
  templateModal.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    templateModal.querySelector("[data-template-category]")?.focus();
  }, 50);
}

function closeTemplateModal() {
  if (!templateModal) return;
  templateModal.hidden = true;
  clearTemplateLibrarySource();
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
  setupState.user = user || null;
  const tenant = user.tenant || {};
  if (tenant.id) {
    setupState.tenant = {
      ...(setupState.tenant || {}),
      ...tenant,
      meta: {
        ...(setupState.tenant?.meta || {}),
        ...(tenant.meta || {})
      }
    };
  }
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
      ? "Your plan is active" + (billing.currentPeriodEnd ? " through " + new Date(billing.currentPeriodEnd).toLocaleDateString() : "") + ". Renewals add time after your current paid period."
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
        const buttonText = isActive ? "Renew plan" : "Pay now";

        return `
          <article class="billing-plan-card ${isSelected ? "selected" : ""}">
            <span>${plan.name}</span>
            <strong>${formatCurrency(plan.amount, plan.currency)}</strong>
            <small>${plan.interval === "quarter" ? "Every 3 months" : `Per ${plan.interval}`}</small>
            <button class="btn ${isSelected ? "btn-outline" : ""}" type="button" data-select-plan="${plan.id}" >${buttonText}</button>
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
  const history = document.querySelector("[data-payment-history]");
  if (history) {
    history.replaceChildren();
    for (const payment of data.payments || []) {
      const row = document.createElement("p");
      row.textContent = new Date(payment.capturedAt).toLocaleDateString() + " ? " + payment.plan + " ? " + formatCurrency(payment.amount / 100, payment.currency) + " ? " + payment.status + " ? " + payment.providerPaymentId;
      history.append(row);
    }
    if (!history.childElementCount) history.textContent = "No completed payments yet.";
  }
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
          reject(new Error("Payment confirmation is pending. If money was deducted, do not pay again. Refresh billing shortly; payment notifications will recover your payment. " + error.message));
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
  let hostname = "";
  try {
    const origin = new URL(String(event.origin || ""));
    if (origin.protocol !== "https:") return null;
    hostname = origin.hostname.toLowerCase();
  } catch (error) {
    return null;
  }

  if (hostname !== "facebook.com" && !hostname.endsWith(".facebook.com")) {
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

async function loadMetaOnboardingSession() {
  const data = await requestJson("/api/meta/onboarding-session", { method: "POST" });
  metaOnboardingSession = {
    state: data.state,
    expiresAt: data.expiresAt
  };
  return metaOnboardingSession;
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
  reportState.searched = false;
  reportState.total = 0;
  reportState.totalPages = 1;
  renderReportHistory([]);
  updateReportPagination();
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
  const rows = parseCsvMatrix(text).filter(row => row.some(value => String(value).trim()));
  if (rows.length < 2) return [];
  const headers = rows.shift().map(value => value.trim());
  if (headers.some(value => !value) || new Set(headers).size !== headers.length) throw new Error("CSV column names must be present and unique.");
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error("CSV row " + (index + 2) + " has a different number of columns. Check commas and quotation marks.");
    return Object.fromEntries(headers.map((header, index) => [header, values[index].trim()]));
  });
}

function isSpreadsheetFile(file) {
  return /\.(xlsx|xls)$/i.test(file?.name || "");
}

async function parseSpreadsheetRows(file) {
  if (!window.XLSX) {
    throw new Error("Spreadsheet parser could not be loaded. Refresh the page and try again.");
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
    raw: false
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return window.XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false
  }).map((row) => Object.entries(row).reduce((normalized, [key, value]) => {
    normalized[String(key || "").trim()] = String(value ?? "").trim();
    return normalized;
  }, {}));
}

async function parseContactImportFile(file) {
  if (isSpreadsheetFile(file)) return parseSpreadsheetRows(file);
  if (/\.csv$/i.test(file.name || "") || /csv/i.test(file.type || "")) return parseCsv(await file.text());
  throw new Error("Upload a CSV, XLSX, or XLS contact file.");
}

// Header names mirror the fields accepted by contact.service.normalizeContact,
// with a sample row so businesses can fill in their own list and re-upload.
function downloadContactCsvTemplate() {
  const headers = ["name", "whatsapp_number", "optIn", "tags"];
  const sampleRow = [
    escapeCsvValue("Priya Sharma"),
    excelTextCell("919210699076"),
    escapeCsvValue("yes"),
    escapeCsvValue("vip")
  ];
  const csv = [
    headers.join(","),
    sampleRow.join(",")
  ].join("\r\n");
  const blobUrl = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "contacts_template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
  setContactMessage("Downloaded contacts_template.csv. Fill in your contacts, then use Upload contacts.");
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
        </span>
        <span class="contact-row-actions" data-label="Actions">
          <button
            type="button"
            class="contact-edit-action"
            data-edit-contact="${escapeHtml(contact._id)}"
            aria-label="Edit contact ${escapeHtml(contactLabel)}"
            title="Edit contact">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
          </button>
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

async function requestAllPages(path, field) {
  const items = [], cursors = new Set();
  let after = "", data;
  do {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("limit", "500");
    if (after) url.searchParams.set("after", after);
    data = await requestJson(url.pathname + url.search);
    items.push(...(data[field] || []));
    after = data.nextCursor || "";
    if (after && cursors.has(after)) throw new Error("The next page could not be loaded. Please refresh.");
    cursors.add(after);
  } while (after);
  return { ...data, [field]: items };
}

async function loadContacts() {
  if (!contactList) return;
  const data = await requestAllPages("/api/contacts", "contacts");
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
      return `<option value="${escapeHtml(template.name)}" data-category="${escapeHtml(template.category)}" data-language="${escapeHtml(template.language)}" data-parameter-count="${Number(template.parameterCount || 0)}" data-body="${escapeHtml(template.body || "")}" data-sample-values="${escapeHtml(JSON.stringify(template.sampleValues || []))}" data-header-type="${escapeHtml(headerType)}" data-header-media-id="${escapeHtml(template.headerMediaId || "")}">${escapeHtml(template.name)} · ${escapeHtml(formatLabel)} · ${escapeHtml(template.category)} (${escapeHtml(template.language)})</option>`;
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
  const maximumBytes = type === "image" ? 5 * 1024 * 1024 : type === "document" ? 100 * 1024 * 1024 : 16 * 1024 * 1024;
  const withinSizeLimit = Number(asset.bytes || 0) <= maximumBytes;
  if (type === "image") {
    return ["image/jpeg", "image/png"].includes(mimeType) && withinSizeLimit;
  }
  if (type === "document") {
    return mimeType === "application/pdf" && withinSizeLimit;
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

  let sampleValues = [];
  try {
    sampleValues = JSON.parse(selectedOption?.dataset.sampleValues || "[]");
  } catch (error) {
    sampleValues = [];
  }
  sendVariableDataState.sampleValues = Array.isArray(sampleValues) ? sampleValues.map(String) : [];

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
    ? "Bulk file sending supports templates with up to 10 variables."
    : `Upload one CSV or Excel row per customer. Phone uniquely matches that row's ${parameterCount} value${parameterCount === 1 ? "" : "s"}; sending is blocked if any eligible selected phone is missing.`;
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
    sendVariableEditor.innerHTML = `<div class="send-variable-empty error">This template has ${sendVariableDataState.parameterCount} variables. Bulk file sending supports a maximum of 10.</div>`;
    updateSendRecipientSummary();
    return;
  }

  const headers = getRecipientVariableHeaders();
  const knownSelectedPhones = new Set(getSelectedSendContacts().map((contact) => normalizeSendPhone(contact.phone)));
  const loadedPhoneSet = new Set(sendVariableDataState.rows.map((row) => row.phone));
  const knownMatchCount = [...knownSelectedPhones].filter((phone) => loadedPhoneSet.has(phone)).length;
  const previewRows = sendVariableDataState.rows.slice(0, 5);

  const samples = sendVariableDataState.sampleValues || [];
  const templateBody = sendTemplateSelect?.selectedOptions?.[0]?.dataset.body || "";
  const guideBody = escapeHtml(templateBody).replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => (
    `<mark class="lib-var">{{${index}}}</mark>`
  ));
  const guideItems = Array.from({ length: sendVariableDataState.parameterCount }, (_, index) => (
    `<li><mark class="lib-var">{{${index + 1}}}</mark> = Variable ${index + 1}${samples[index] ? ` <span>e.g. ${escapeHtml(samples[index])}</span>` : ""}</li>`
  )).join("");

  sendVariableEditor.innerHTML = `
    <div class="send-variable-guide">
      <p class="send-variable-guide-body">${guideBody}</p>
      <ul class="send-variable-guide-list">${guideItems}</ul>
    </div>
    <div class="send-variable-import">
      <div class="send-variable-actions">
        <button type="button" data-download-variable-csv>Download CSV for selected recipients</button>
        <label>
          Upload completed file
          <input type="file" accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden data-upload-variable-csv>
        </label>
        ${sendVariableDataState.rows.length ? `<button type="button" class="details" data-see-variable-details>See details</button>` : ""}
        ${sendVariableDataState.rows.length ? `<button type="button" class="clear" data-clear-variable-csv>Clear file</button>` : ""}
      </div>
      <code>${headers.map((header) => escapeHtml(header)).join(",")}</code>
      <div class="send-variable-file-state${sendVariableDataState.rows.length ? " is-ready" : ""}">
        <strong>${sendVariableDataState.rows.length
          ? `${sendVariableDataState.rows.length} phone row${sendVariableDataState.rows.length === 1 ? "" : "s"} loaded`
          : "No variable file uploaded"}</strong>
        <small>${sendVariableDataState.rows.length
          ? `${escapeHtml(sendVariableDataState.fileName || "file")} - ${knownMatchCount} currently visible selected contact${knownMatchCount === 1 ? "" : "s"} matched`
          : "Download the prepared CSV, fill every variable column, then upload CSV/XLSX/XLS."}</small>
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
  const samples = sendVariableDataState.sampleValues || [];
  return [
    "Phone Number",
    ...Array.from({ length: sendVariableDataState.parameterCount }, (_, index) => (
      samples[index] ? `Variable ${index + 1} (e.g. ${samples[index]})` : `Variable ${index + 1}`
    ))
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
  if (quoted) throw new Error("CSV contains an unfinished quoted value. Close the quotation mark and try again.");
  row.push(value.replace(/\r$/, ""));
  if (row.some((cell) => String(cell).trim()) || rows.length === 0) rows.push(row);
  return rows;
}

async function parseSpreadsheetMatrix(file) {
  if (!window.XLSX) {
    throw new Error("Spreadsheet parser could not be loaded. Refresh the page and try again.");
  }

  const workbook = window.XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
    raw: false
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  return window.XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false
  }).map((row) => row.map((value) => String(value ?? "").trim()));
}

async function parseRecipientVariableFile(file) {
  if (isSpreadsheetFile(file)) return parseRecipientVariableRows(await parseSpreadsheetMatrix(file), "Spreadsheet");
  if (/\.csv$/i.test(file.name || "") || /csv/i.test(file.type || "")) {
    return parseRecipientVariableRows(parseCsvMatrix(await file.text()), "CSV");
  }
  throw new Error("Upload a CSV, XLSX, or XLS variable file.");
}

function parseRecipientVariableRows(matrix, fileKind = "CSV") {
  const expectedColumnCount = sendVariableDataState.parameterCount + 1;
  const normalizeHeader = (header) => String(header || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const headerRow = matrix.shift() || [];
  // Only the phone column and the column count matter; variable header text is
  // free-form guidance (it carries example values) and may vary between files.
  if (!normalizeHeader(headerRow[0]).startsWith("phone")) {
    throw new Error(`The first ${fileKind} column must be the phone number.`);
  }
  if (headerRow.length !== expectedColumnCount) {
    throw new Error(`The ${fileKind} file must have ${expectedColumnCount} columns: the phone number plus ${sendVariableDataState.parameterCount} variable value${sendVariableDataState.parameterCount === 1 ? "" : "s"}.`);
  }

  const dataRows = matrix.filter((row) => row.some((value) => String(value).trim()));
  if (!dataRows.length) throw new Error(`The ${fileKind} file contains no recipient rows.`);
  if (dataRows.length > 1000) throw new Error(`The ${fileKind} file can contain at most 1000 rows.`);

  const seenPhones = new Set();
  return dataRows.map((row, index) => {
    const rowNumber = index + 2;
    if (row.length !== expectedColumnCount) {
      throw new Error(`${fileKind} row ${rowNumber} must contain ${expectedColumnCount} columns.`);
    }
    if (looksLikeExcelScientific(row[0])) {
      throw new Error(`${fileKind} row ${rowNumber}: Excel converted the phone number to scientific notation ("${String(row[0]).trim()}"), which loses digits. Re-download the CSV and fill it again, or format the phone column as Number (0 decimals) before saving.`);
    }
    const phone = normalizeSendPhone(row[0]);
    const variables = row.slice(1).map((value) => String(value).trim());
    if (!/^\d{11,15}$/.test(phone)) throw new Error(`${fileKind} row ${rowNumber} has an invalid phone number.`);
    if (seenPhones.has(phone)) throw new Error(`Phone ${phone} appears more than once in the ${fileKind} file.`);
    if (variables.some((value) => !value)) throw new Error(`${fileKind} row ${rowNumber} is missing a variable value.`);
    if (variables.some((value) => value.length > 300)) throw new Error(`${fileKind} row ${rowNumber} contains a value longer than 300 characters.`);
    seenPhones.add(phone);
    return { phone, variables };
  });
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// Excel turns 12+ digit numbers into scientific notation (9.19877E+11) and saves
// that back to the CSV, destroying the phone number. Emitting the cell as ="…"
// forces Excel to keep it as text; phone normalization strips the wrapper on upload.
function excelTextCell(value) {
  return `="${String(value ?? "").replace(/"/g, "")}"`;
}

function looksLikeExcelScientific(value) {
  return /^-?\d+(\.\d+)?E[+-]?\d+$/i.test(String(value ?? "").trim());
}

async function downloadRecipientVariableCsv() {
  if (!sendTemplateSelect?.value || !sendVariableDataState.parameterCount) {
    throw new Error("Select a template that contains variables first.");
  }
  if (sendVariableDataState.parameterCount > 10) {
    throw new Error("Bulk file sending supports a maximum of 10 template variables.");
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
    headers.map(escapeCsvValue).join(","),
    ...(data.contacts || []).map((contact) => (
      [excelTextCell(contact.phone), ...emptyVariables.map(escapeCsvValue)].join(",")
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
        : mediaType === "document"
          ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener">PDF document</a>`
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

function setReportMessage(message, isError = false) {
  if (!reportMessage) return;
  reportMessage.textContent = message || "";
  reportMessage.classList.toggle("error", Boolean(isError));
}

function formatReportDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function getReportStatusClass(status) {
  if (status === "failed" || status === "uncertain") return "rejected";
  if (status === "queued" || status === "scheduled" || status === "processing") return "pending";
  return "approved";
}

function getReportErrorText(message) {
  const details = [message.metaErrorCode, message.error].filter(Boolean).join(" - ");
  return details || "-";
}

function renderReportHistory(messages) {
  if (!reportHistory) return;

  if (!reportState.searched) {
    reportHistory.innerHTML = `<div class="empty-row">Choose filters and click Search to fetch reports.</div>`;
    return;
  }

  if (!messages.length) {
    reportHistory.innerHTML = `<div class="empty-row">No reports matched the selected filters.</div>`;
    return;
  }

  reportHistory.innerHTML = messages.map((message) => {
    const errorText = getReportErrorText(message);
    return `
      <div class="table-row report-table-row">
        <strong>${escapeHtml(message.to || "")}</strong>
        <span data-label="Template" class="send-template-cell">
          <span>${escapeHtml(message.templateName || "")}</span>
          ${message.mediaId ? `<small>${escapeHtml(`${message.mediaType || "media"} - ${message.mediaId}`)}</small>` : ""}
        </span>
        <span data-label="Status"><em class="${getReportStatusClass(message.status)}">${escapeHtml(message.status || "")}</em></span>
        <span data-label="Sent at">${escapeHtml(formatReportDate(message.createdAt))}</span>
        <span data-label="Last update">${escapeHtml(formatReportDate(message.updatedAt || message.acceptedAt || message.createdAt))}</span>
        <span data-label="Batch" class="report-muted-cell">${escapeHtml(message.batchId || "-")}</span>
        <span data-label="Error" class="report-error-cell" title="${escapeHtml(errorText)}">${escapeHtml(errorText)}</span>
      </div>
    `;
  }).join("");
}

function updateReportPagination() {
  if (!reportPagination) return;
  const shouldShow = reportState.searched && reportState.total > 0;
  reportPagination.hidden = !shouldShow;
  if (!shouldShow) return;

  const start = (reportState.page - 1) * reportState.limit + 1;
  const end = Math.min(reportState.page * reportState.limit, reportState.total);
  if (reportRange) reportRange.textContent = `Showing ${start}-${end} of ${reportState.total} reports`;
  if (reportPageLabel) reportPageLabel.textContent = `Page ${reportState.page} of ${reportState.totalPages}`;
  if (reportPreviousButton) reportPreviousButton.disabled = reportState.page <= 1 || reportState.loading;
  if (reportNextButton) reportNextButton.disabled = reportState.page >= reportState.totalPages || reportState.loading;
}

function getReportFiltersFromForm() {
  const from = reportFromInput?.value || "";
  const to = reportToInput?.value || "";

  if (from && to && from > to) {
    throw new Error("From date must be before or equal to To date.");
  }

  return {
    from,
    to_date: to,
    status: reportStatusSelect?.value || "",
    phone: reportPhoneInput?.value || "",
    limit: reportLimitSelect?.value || "25"
  };
}

function buildReportQuery(filters, page) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (normalized) params.set(key, normalized);
  });
  params.set("page", String(page));
  return params.toString();
}

function reportHasActiveFilters() {
  return Boolean(
    reportState.filters.from
    || reportState.filters.to_date
    || reportState.filters.status
    || reportState.filters.phone
  );
}

async function loadReports({ page = reportState.page, resetFilters = false } = {}) {
  if (!reportHistory || reportState.loading) return;

  try {
    if (resetFilters) {
      reportState.filters = getReportFiltersFromForm();
      reportState.limit = Number(reportState.filters.limit) || 25;
      page = 1;
    }

    reportState.loading = true;
    reportState.searched = true;
    reportState.page = page;
    if (reportSearchButton) reportSearchButton.disabled = true;
    setReportMessage("Fetching reports...");
    updateReportPagination();

    const data = await requestJson(`/api/messages?${buildReportQuery(reportState.filters, reportState.page)}`);
    const messages = data.messages || [];
    const pagination = data.pagination || {};
    reportState.page = Number(pagination.page) || reportState.page;
    reportState.limit = Number(pagination.limit) || reportState.limit;
    reportState.total = Number.isFinite(Number(pagination.total)) ? Number(pagination.total) : messages.length;
    reportState.totalPages = Math.max(1, Number(pagination.totalPages) || Math.ceil(reportState.total / reportState.limit) || 1);
    renderReportHistory(messages);
    setReportMessage(
      messages.length
        ? ""
        : reportHasActiveFilters()
          ? "No reports found for the selected filters."
          : "No report records found yet."
    );
  } catch (error) {
    reportState.total = 0;
    reportState.totalPages = 1;
    renderReportHistory([]);
    setReportMessage(error.message, true);
  } finally {
    reportState.loading = false;
    if (reportSearchButton) reportSearchButton.disabled = false;
    updateReportPagination();
  }
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
  const data = await requestJson("/api/messages?limit=25");
  setupState.messages = data.messages || [];
  if (sendHistory) renderSendHistory(data.messages || []);
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

function getTemplateVariableIndexes() {
  const indexes = new Set();
  const body = templateBodyInput?.value || "";
  body.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, indexText) => {
    indexes.add(Number(indexText));
    return match;
  });
  return [...indexes].filter(Boolean).sort((left, right) => left - right);
}

function updateTemplateSamplesValue() {
  if (!templateSamplesInput) return;
  const pairs = [...(templateVariableSamplesHost?.querySelectorAll("[data-template-sample-input]") || [])]
    .map((input) => `{{${input.dataset.templateSampleInput}}} = ${input.value.trim()}`);
  templateSamplesInput.value = pairs.join(", ");
  updateTemplateDraftPreview();
}

function renderTemplateVariableSamples() {
  if (!templateVariableSamplesHost) return;
  const indexes = getTemplateVariableIndexes();
  const previous = new Map(
    [...templateVariableSamplesHost.querySelectorAll("[data-template-sample-input]")]
      .map((input) => [Number(input.dataset.templateSampleInput), input.value])
  );

  if (!indexes.length) {
    templateVariableSamplesHost.innerHTML = '<div class="empty-row">Add variables like {{1}} in the message body to enter sample values.</div>';
    updateTemplateSamplesValue();
    return;
  }

  templateVariableSamplesHost.innerHTML = indexes.map((index) => `
    <label class="template-variable-sample-row">
      <span>{{${index}}}</span>
      <input type="text" maxlength="120" placeholder="Sample value for {{${index}}}" value="${escapeHtml(previous.get(index) || "")}" data-template-sample-input="${index}">
    </label>
  `).join("");
  updateTemplateSamplesValue();
}

function setTemplateVariableSampleValues(values = []) {
  renderTemplateVariableSamples();
  [...(templateVariableSamplesHost?.querySelectorAll("[data-template-sample-input]") || [])].forEach((input) => {
    const index = Number(input.dataset.templateSampleInput) - 1;
    input.value = values[index] || "";
  });
  updateTemplateSamplesValue();
}

function getDefaultTemplateCallNumber() {
  const raw = setupState.tenant?.meta?.displayPhoneNumber
    || setupState.tenant?.whatsappNumber
    || setupState.user?.phone
    || "";
  const digits = String(raw).replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  return digits.length >= 8 ? `+${digits}` : "";
}

function closeTemplateCtaMenu() {
  if (templateCtaMenu) templateCtaMenu.hidden = true;
}

function addTemplateCta(type, values = {}) {
  if (!templateCtaList) return;
  closeTemplateCtaMenu();
  const id = `cta-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const callNumber = values.phoneNumber || getDefaultTemplateCallNumber();
  const label = values.text || "";
  const row = document.createElement("div");
  row.className = "template-cta-row";
  row.dataset.templateCtaRow = type;

  if (type === "call") {
    row.innerHTML = `
      <div>
        <strong>Call</strong>
        <small>${callNumber ? `Uses ${escapeHtml(callNumber)}` : "Connect or refresh your WhatsApp number before submitting."}</small>
      </div>
      <label for="${id}-label">
        Button text
        <input id="${id}-label" type="text" maxlength="25" value="${escapeHtml(label || "Call us")}" data-template-cta-label>
      </label>
      <input type="hidden" value="${escapeHtml(callNumber)}" data-template-cta-phone>
      <button type="button" aria-label="Remove CTA" title="Remove CTA" data-template-remove-cta>&times;</button>
    `;
  } else if (type === "visit") {
    row.innerHTML = `
      <div>
        <strong>Visit website</strong>
        <small>Requires an https:// link.</small>
      </div>
      <label for="${id}-label">
        Button text
        <input id="${id}-label" type="text" maxlength="25" value="${escapeHtml(label || "Visit website")}" data-template-cta-label>
      </label>
      <label for="${id}-url">
        Link
        <input id="${id}-url" type="url" maxlength="300" placeholder="https://example.com" value="${escapeHtml(values.url || "")}" data-template-cta-url>
      </label>
      <button type="button" aria-label="Remove CTA" title="Remove CTA" data-template-remove-cta>&times;</button>
    `;
  } else {
    row.innerHTML = `
      <div>
        <strong>Quick reply</strong>
        <small>Shows a simple reply button.</small>
      </div>
      <label for="${id}-label">
        Button text
        <input id="${id}-label" type="text" maxlength="25" value="${escapeHtml(label || "Reply")}" data-template-cta-label>
      </label>
      <button type="button" aria-label="Remove CTA" title="Remove CTA" data-template-remove-cta>&times;</button>
    `;
  }

  templateCtaList.appendChild(row);
  updateTemplateDraftPreview();
}

function getTemplateCtas() {
  return [...(templateCtaList?.querySelectorAll("[data-template-cta-row]") || [])].map((row) => {
    const type = row.dataset.templateCtaRow;
    const text = row.querySelector("[data-template-cta-label]")?.value.trim() || "";
    if (type === "call") {
      return {
        type: "PHONE_NUMBER",
        text,
        phoneNumber: row.querySelector("[data-template-cta-phone]")?.value.trim() || getDefaultTemplateCallNumber()
      };
    }
    if (type === "visit") {
      return {
        type: "URL",
        text,
        url: row.querySelector("[data-template-cta-url]")?.value.trim() || ""
      };
    }
    return { type: "QUICK_REPLY", text };
  });
}

function getTemplateSampleValues() {
  const values = [];
  [...(templateVariableSamplesHost?.querySelectorAll("[data-template-sample-input]") || [])].forEach((input) => {
    values[Number(input.dataset.templateSampleInput) - 1] = input.value.trim();
  });
  return values;
}

function formatTemplatePreviewCategory(value) {
  const labels = {
    utility: "Utility template",
    marketing: "Marketing template",
    authentication: "Authentication template"
  };
  return labels[value] || "Select category";
}

function getTemplatePreviewMediaAsset() {
  const mediaId = templateHeaderMediaSelect?.value || "";
  if (!mediaId) return null;
  return mediaState.assets.find((asset) => asset.mediaId === mediaId) || null;
}

function fillDraftTemplateBody(body, samples) {
  const text = String(body || "").trim() || "Start writing the message body to preview the template.";
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (match, indexText) => {
    const value = samples[Number(indexText) - 1];
    return value || match;
  });
}

function renderTemplatePreviewMedia(asset) {
  if (!templatePreviewMedia) return;
  if (!asset) {
    templatePreviewMedia.hidden = true;
    templatePreviewMedia.innerHTML = "";
    return;
  }

  templatePreviewMedia.hidden = false;
  if (asset.mediaType === "video") {
    templatePreviewMedia.innerHTML = `<video src="${escapeHtml(asset.url)}" muted playsinline controls></video>`;
  } else if (asset.mediaType === "document") {
    templatePreviewMedia.innerHTML = `<a href="${escapeHtml(asset.url)}" target="_blank" rel="noopener">PDF document</a>`;
  } else {
    templatePreviewMedia.innerHTML = `<img src="${escapeHtml(asset.url)}" alt="Template header preview">`;
  }
}

function renderTemplatePreviewCtas(buttons) {
  if (!templatePreviewCtas) return;
  const visibleButtons = buttons.filter((button) => button.text);
  templatePreviewCtas.hidden = !visibleButtons.length;
  templatePreviewCtas.innerHTML = visibleButtons.map((button) => {
    const action = button.type === "PHONE_NUMBER" ? "call" : button.type === "URL" ? "url" : "reply";
    return `
      <span class="template-preview-cta is-${action}">
        <i aria-hidden="true"></i>
        <b>${escapeHtml(button.text)}</b>
      </span>
    `;
  }).join("");
}

function updateTemplateDraftPreview() {
  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const templateName = (templateNameInput?.value || "").trim() || "Template draft";
  const category = templateCategorySelect?.value || "";
  const body = templateBodyInput?.value || "";
  const samples = getTemplateSampleValues();
  const headerType = templateHeaderTypeSelect?.value || "none";
  const mediaAsset = headerType === "none" ? null : getTemplatePreviewMediaAsset();

  if (templatePreviewName) templatePreviewName.textContent = templateName;
  if (templatePreviewCategory) templatePreviewCategory.textContent = formatTemplatePreviewCategory(category);
  if (templatePreviewBody) templatePreviewBody.textContent = fillDraftTemplateBody(body, samples);
  if (templatePreviewTime) templatePreviewTime.textContent = now;
  if (templatePreviewBubbleTime) templatePreviewBubbleTime.textContent = now;
  renderTemplatePreviewMedia(mediaAsset);
  renderTemplatePreviewCtas(getTemplateCtas());
}

function resetTemplateBuilder() {
  clearTemplateLibrarySource();
  if (templateCategorySelect) templateCategorySelect.value = "";
  if (templateNameInput) templateNameInput.value = "";
  if (templateLanguageSelect) templateLanguageSelect.value = "";
  if (templateBodyInput) templateBodyInput.value = "";
  if (templateSamplesInput) templateSamplesInput.value = "";
  if (templateHeaderTypeSelect) templateHeaderTypeSelect.value = "none";
  if (templateHeaderMediaSelect) templateHeaderMediaSelect.value = "";
  if (templateCtaList) templateCtaList.innerHTML = "";
  closeTemplateCtaMenu();
  renderTemplateVariableSamples();
  updateTemplateHeaderControls();
  updateTemplateDraftPreview();
}

function getTemplatePayload() {
  return {
    name: templateNameInput?.value || "",
    language: templateLanguageSelect?.value || "",
    category: templateCategorySelect?.value || "",
    body: templateBodyInput?.value || "",
    variableSamples: templateSamplesInput?.value || "",
    headerType: templateHeaderTypeSelect?.value || "none",
    headerMediaId: templateHeaderMediaSelect?.value || "",
    buttons: getTemplateCtas()
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
  const ctaBuilder = document.querySelector("[data-template-cta-builder]");
  if (ctaBuilder) ctaBuilder.hidden = isAuthentication;
  if (isAuthentication && templateCtaList) templateCtaList.innerHTML = "";
  const headerType = templateHeaderTypeSelect.value || "none";
  templateHeaderMediaField.hidden = headerType === "none";
  if (headerType === "none") {
    if (templateHeaderMediaSelect) {
      templateHeaderMediaSelect.required = false;
      templateHeaderMediaSelect.value = "";
    }
    updateTemplateDraftPreview();
    return;
  }
  renderTemplateHeaderMediaOptions();
  if (templateHeaderMediaSelect) templateHeaderMediaSelect.required = true;
  updateTemplateDraftPreview();
}

// Template Library: browses Meta's library of pre-approved utility and
// authentication templates (GET /message_template_library). Adopting one
// creates it in the connected WABA via library_template_name, so unchanged
// templates are usually approved instantly and synced into Manage Template.
const LIB_CATEGORY_LABEL = { utility: "Utility", marketing: "Marketing", authentication: "Authentication" };

const templateLibraryState = {
  items: [],
  nextCursor: "",
  topic: "",
  loading: false,
  loaded: false,
  builderSource: null
};

const LIB_BUTTON_ICONS = {
  URL: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5h-2V8.4l-6.3 6.3-1.4-1.4L15.6 7H14V5Z"/><path d="M5 7h6v2H7v8h8v-4h2v6H5V7Z"/></svg>',
  PHONE_NUMBER: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3h3l1.5 4.2-2 1.5a12.5 12.5 0 0 0 5.7 5.7l1.5-2L21 13.9v3.4A2.7 2.7 0 0 1 18.3 20 15.3 15.3 0 0 1 4 5.7 2.7 2.7 0 0 1 6.6 3Z"/></svg>',
  OTP: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h10v14h-2V5H8V3Z"/><path d="M6 7h10v14H6V7Zm2 2v10h6V9H8Z"/></svg>',
  QUICK_REPLY: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5v4c6 0 9 3 10 9-2.5-3.5-5.5-5-10-5v4l-7-6 7-6Z"/></svg>'
};

const LIB_BUTTON_LABEL = {
  URL: "Visit website",
  PHONE_NUMBER: "Call us",
  OTP: "Copy code",
  QUICK_REPLY: "Quick reply"
};

function setLibraryMessage(message, isError = false) {
  const host = document.querySelector("[data-lib-message]");
  if (!host) return;
  host.textContent = message;
  host.classList.toggle("error", isError);
}

function formatLibraryLabel(value) {
  const text = String(value || "").replace(/[_-]+/g, " ").trim().toLowerCase();
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

// Renders the body as a WhatsApp-style bubble, substituting {{n}} placeholders
// with Meta's sample values highlighted as chips.
function renderLibraryBodyHtml(tpl) {
  const samples = Array.isArray(tpl.bodyParams) ? tpl.bodyParams : [];
  return escapeText(tpl.body).replace(/\{\{\s*(\d+)\s*\}\}/g, (match, index) => (
    `<mark class="lib-var">${escapeText(samples[Number(index) - 1] || match)}</mark>`
  ));
}

function renderTemplateLibraryItems() {
  const host = document.querySelector("[data-template-library]");
  if (!host) return;
  const moreHost = document.querySelector("[data-lib-more-host]");
  if (moreHost) moreHost.hidden = !templateLibraryState.nextCursor;

  if (!templateLibraryState.items.length) {
    host.innerHTML = '<div class="empty-row">No library templates matched. Try a different search or topic.</div>';
    return;
  }

  host.innerHTML = templateLibraryState.items.map((tpl, index) => {
    const buttons = (tpl.buttons || []).map((button) => {
      const type = button.type === "COPY_CODE" ? "OTP" : button.type;
      const icon = LIB_BUTTON_ICONS[type] || LIB_BUTTON_ICONS.QUICK_REPLY;
      const label = button.text || LIB_BUTTON_LABEL[type] || formatLibraryLabel(button.type);
      return `<span class="lib-cta">${icon}${escapeText(label)}</span>`;
    }).join("");
    const meta = [formatLibraryLabel(tpl.topic), formatLibraryLabel(tpl.usecase)].filter(Boolean).join(" · ");
    return `
    <article class="lib-card">
      <div class="lib-preview">
        <div class="lib-bubble">
          <p>${renderLibraryBodyHtml(tpl)}</p>
          <span class="lib-bubble-time">11:45</span>
        </div>
        ${buttons ? `<div class="lib-ctas">${buttons}</div>` : ""}
      </div>
      <div class="lib-card-info">
        <div class="lib-card-title">
          <h3>${escapeText(formatLibraryLabel(tpl.name))}</h3>
          <span class="lib-badge cat-${escapeText(tpl.category)}">${LIB_CATEGORY_LABEL[tpl.category] || escapeText(tpl.category)}</span>
        </div>
        <p class="lib-meta">${escapeText(meta || "General")} · ${escapeText(tpl.language)}</p>
        <button class="btn btn-small" type="button" data-use-library-template="${index}">Use template</button>
      </div>
    </article>`;
  }).join("");
}

async function loadTemplateLibrary({ append = false } = {}) {
  const host = document.querySelector("[data-template-library]");
  if (!host || templateLibraryState.loading) return;
  templateLibraryState.loading = true;
  if (!append) {
    templateLibraryState.nextCursor = "";
    host.innerHTML = '<div class="empty-row">Loading Meta\'s template library...</div>';
  }
  setLibraryMessage("");

  try {
    const params = new URLSearchParams();
    const search = document.querySelector("[data-lib-search]")?.value.trim();
    const language = document.querySelector("[data-lib-language]")?.value || "";
    if (search) params.set("search", search);
    if (templateLibraryState.topic) params.set("topic", templateLibraryState.topic);
    if (language) params.set("language", language);
    if (append && templateLibraryState.nextCursor) params.set("after", templateLibraryState.nextCursor);

    const data = await requestJson(`/api/templates/library?${params}`);
    templateLibraryState.items = append
      ? [...templateLibraryState.items, ...(data.items || [])]
      : (data.items || []);
    templateLibraryState.nextCursor = data.nextCursor || "";
    templateLibraryState.loaded = true;
    renderTemplateLibraryItems();
  } catch (error) {
    if (!append) host.innerHTML = `<div class="empty-row">${escapeText(error.message)}</div>`;
    setLibraryMessage(error.message, true);
  } finally {
    templateLibraryState.loading = false;
  }
}

function libraryButtonLabel(button) {
  const type = button.type === "COPY_CODE" ? "OTP" : button.type;
  return button.text || LIB_BUTTON_LABEL[type] || formatLibraryLabel(button.type);
}

function normalizedLibraryButtonTypes(source = {}) {
  return (source.buttons || [])
    .map((button) => button.type === "COPY_CODE" ? "OTP" : String(button.type || "").toUpperCase())
    .filter((type) => ["URL", "PHONE_NUMBER", "QUICK_REPLY"].includes(type));
}

function normalizedBuilderButtonTypes() {
  return getTemplateCtas().map((button) => button.type);
}

function templateLibraryButtonsAreUnchanged(source) {
  const sourceTypes = normalizedLibraryButtonTypes(source);
  const builderTypes = normalizedBuilderButtonTypes();
  return sourceTypes.length === builderTypes.length
    && sourceTypes.every((type, index) => type === builderTypes[index]);
}

function addLibraryButtonsToCtaBuilder(tpl) {
  if (!templateCtaList) return;
  templateCtaList.innerHTML = "";
  (tpl.buttons || []).forEach((button) => {
    const type = button.type === "COPY_CODE" ? "OTP" : String(button.type || "").toUpperCase();
    if (type === "URL") {
      addTemplateCta("visit", {
        text: button.text || "Visit website",
        url: localStorage.getItem("intercon_lib_button_url") || button.url || ""
      });
    } else if (type === "PHONE_NUMBER") {
      addTemplateCta("call", {
        text: button.text || "Call us",
        phoneNumber: localStorage.getItem("intercon_lib_button_phone") || button.phoneNumber || getDefaultTemplateCallNumber()
      });
    } else if (type === "QUICK_REPLY") {
      addTemplateCta("quick_reply", {
        text: button.text || "Reply"
      });
    }
  });
}

// Resets the Create Template modal back to its normal (non-library) state.
function clearTemplateLibrarySource() {
  templateLibraryState.builderSource = null;
  const note = templateModal?.querySelector("[data-template-library-note]");
  if (note) note.hidden = true;
  const submitButton = templateModal?.querySelector("[data-submit-template]");
  if (submitButton) submitButton.textContent = "Send for Meta review";
}

// "Use template" opens the Create Template modal prefilled with the library
// template so the user can review or edit before sending. Kept unchanged, it
// submits through the instant-approval library path; edited, it goes through
// normal Meta review as a custom template.
function useLibraryTemplateInBuilder(tpl) {
  if (!tpl || !templateModal) return;
  templateLibraryState.builderSource = tpl;

  if (templateNameInput) templateNameInput.value = tpl.name;
  if (templateCategorySelect) templateCategorySelect.value = tpl.category;
  if (templateLanguageSelect) {
    if (![...templateLanguageSelect.options].some((option) => option.value === tpl.language)) {
      const option = document.createElement("option");
      option.value = tpl.language;
      option.textContent = tpl.language;
      templateLanguageSelect.appendChild(option);
    }
    templateLanguageSelect.value = tpl.language;
  }
  if (templateBodyInput) templateBodyInput.value = tpl.body;
  setTemplateVariableSampleValues((tpl.bodyParams || []).map((value) => String(value).trim()));
  if (templateHeaderTypeSelect) templateHeaderTypeSelect.value = "none";
  updateTemplateHeaderControls();
  addLibraryButtonsToCtaBuilder(tpl);

  const note = templateModal.querySelector("[data-template-library-note]");
  if (note) {
    const buttonSummary = (tpl.buttons || []).map(libraryButtonLabel).join(", ");
    note.textContent = `From Meta's Template Library: "${formatLibraryLabel(tpl.name)}" (${tpl.language})${buttonSummary ? ` - Buttons: ${buttonSummary}` : ""}. Keep the message text and CTA button types unchanged and it is usually approved instantly. Editing content or adding another CTA sends it through normal Meta review.`;
    note.hidden = false;
  }

  const submitButton = templateModal.querySelector("[data-submit-template]");
  if (submitButton) submitButton.textContent = "Add template";

  window.location.hash = "#templates";
  openTemplateModal();
  setTemplateMessage(`Loaded "${formatLibraryLabel(tpl.name)}" from Meta's library. Review it, then send.`);
}

// Submits an unchanged library template through the instant-approval path.
async function submitLibraryTemplate(source) {
  setTemplateMessage("Adding the pre-approved template from Meta's library...");
  const ctas = getTemplateCtas();
  const websiteUrl = ctas.find((button) => button.type === "URL")?.url || "";
  const phoneNumber = ctas.find((button) => button.type === "PHONE_NUMBER")?.phoneNumber || "";

  const data = await requestJson("/api/templates/library", {
    method: "POST",
    body: JSON.stringify({
      libraryTemplateName: source.name,
      name: templateNameInput?.value || source.name,
      language: source.language,
      category: source.category,
      buttonTypes: (source.buttons || []).map((button) => button.type),
      websiteUrl,
      phoneNumber
    })
  });
  // Remember the business's button details so the next adoption is prefilled.
  if (websiteUrl) localStorage.setItem("intercon_lib_button_url", websiteUrl);
  if (phoneNumber) localStorage.setItem("intercon_lib_button_phone", phoneNumber);
  setTemplateMessage(data.message || "Template added from Meta's library.");
  setLibraryMessage(data.message || "Template added from Meta's library.");
  await Promise.all([loadApprovedTemplates(), loadTemplates()]);
}

function validateTemplateBuilder() {
  const payload = getTemplatePayload();
  if (!payload.category) {
    setTemplateMessage("Select the template category.", true);
    templateCategorySelect?.focus();
    return false;
  }
  if (!payload.name.trim()) {
    setTemplateMessage("Template name is required.", true);
    templateNameInput?.focus();
    return false;
  }
  if (!payload.language) {
    setTemplateMessage("Select the template language.", true);
    templateLanguageSelect?.focus();
    return false;
  }
  if (payload.category !== "authentication" && !payload.body.trim()) {
    setTemplateMessage("Message body is required.", true);
    templateBodyInput?.focus();
    return false;
  }
  const missingSample = [...(templateVariableSamplesHost?.querySelectorAll("[data-template-sample-input]") || [])]
    .find((input) => !input.value.trim());
  if (missingSample) {
    setTemplateMessage(`Enter a sample value for {{${missingSample.dataset.templateSampleInput}}}.`, true);
    missingSample.focus();
    return false;
  }
  if (payload.headerType !== "none" && !payload.headerMediaId) {
    setTemplateMessage(`Choose a ${payload.headerType === "document" ? "PDF" : payload.headerType} from the Media Library.`, true);
    templateHeaderMediaSelect?.focus();
    return false;
  }
  const invalidButton = payload.buttons.find((button) => {
    if (!button.text) return true;
    if (button.type === "URL") return !/^https:\/\/\S+\.\S+/.test(button.url || "");
    if (button.type === "PHONE_NUMBER") return !/^\+?\d{8,15}$/.test(button.phoneNumber || "");
    return false;
  });
  if (invalidButton) {
    setTemplateMessage("Complete the CTA button text and required URL or call number.", true);
    return false;
  }
  return true;
}

async function submitTemplateForReview() {
  if (!requirePaidPlanBeforeAction(setTemplateMessage)) return false;
  updateTemplateSamplesValue();

  // Unchanged library templates keep their pre-approved fast path; any edit
  // to the body, category, or language turns this into a normal submission.
  const source = templateLibraryState.builderSource;
  if (
    source
    && (templateBodyInput?.value || "").trim() === String(source.body || "").trim()
    && (templateCategorySelect?.value || "") === source.category
    && (templateLanguageSelect?.value || "") === source.language
    && (templateHeaderTypeSelect?.value || "none") === "none"
    && templateLibraryButtonsAreUnchanged(source)
  ) {
    if (!validateTemplateBuilder()) return false;
    await submitLibraryTemplate(source);
    return true;
  }

  if (!validateTemplateBuilder()) return false;

  setTemplateMessage("Submitting template to Meta...");
  const data = await requestJson("/api/templates", {
    method: "POST",
    body: JSON.stringify(getTemplatePayload())
  });
  setTemplateMessage(data.message || "Template submitted to Meta for review.");
  await Promise.all([loadApprovedTemplates(), loadTemplates()]);
  return true;
}

async function deleteTemplate(templateId, button) {
  if (!templateId) return;
  const confirmed = await showConfirmModal({
    eyebrow: "Template",
    title: "Delete this template?",
    message: "This permanently deletes the template from InterCon and from your WhatsApp Business Account in Meta, including templates still pending approval. Meta blocks reusing a deleted template's name for 4 weeks.",
    confirmText: "Delete template"
  });
  if (!confirmed) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const data = await requestJson(`/api/templates/${encodeURIComponent(templateId)}`, {
      method: "DELETE"
    });
    setTemplateMessage(data.message || "Template deleted.");
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
  if (!facebookSdk || !metaOnboardingSession?.state) {
    setMessage("Preparing Meta login, one moment...");
    Promise.all([loadFacebookSdk(), loadMetaOnboardingSession()])
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
      const onboardingState = metaOnboardingSession.state;
      metaOnboardingSession = null;

      const result = await requestJson("/api/meta/embedded-signup/complete", {
        method: "POST",
        body: JSON.stringify({
          code,
          sessionInfo,
          onboardingType,
          state: onboardingState
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

contactTemplateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    try {
      downloadContactCsvTemplate();
    } catch (error) {
      setContactMessage(error.message, true);
    }
  });
});

if (contactFileInput) {
  contactFileInput.addEventListener("change", async () => {
    const file = contactFileInput.files?.[0];
    if (!file) return;

    try {
      setContactMessage("Importing contacts...");
      const contacts = await parseContactImportFile(file);
      contacts.forEach((row, index) => {
        const phone = row.whatsapp_number ?? row.phone ?? row.mobile;
        if (looksLikeExcelScientific(phone)) {
          throw new Error(`Row ${index + 2}: Excel converted the phone number to scientific notation ("${String(phone).trim()}"), which loses digits. Re-enter the numbers, or format the phone column as Number (0 decimals) before saving.`);
        }
      });
      const data = await requestJson("/api/contacts/import", {
        method: "POST",
        body: JSON.stringify({ contacts })
      });
      setContactMessage(`Imported ${data.result.imported} contacts. Skipped ${data.result.skipped}. ${(data.result.errors || []).join(" ")}`, Boolean(data.result.errors?.length));
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
      const payload = { ...formData, recipientVariables, contactIds: [...sendRecipientState.contactIds].sort(), groupIds: [...sendRecipientState.groupIds].sort() };
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)));
      const fingerprint = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      const storageKey = "intercon_pending_batch_" + setupState.user?.tenantId;
      let pending;
      try { pending = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
      if (pending?.fingerprint !== fingerprint) pending = { fingerprint, key: crypto.randomUUID() };
      sessionStorage.setItem(storageKey, JSON.stringify(pending));
      const result = await requestJson("/api/messages/send-template-bulk", {
        method: "POST", body: JSON.stringify({ ...payload, idempotencyKey: pending.key })
      });
      sessionStorage.removeItem(storageKey);
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
    const rows = await parseRecipientVariableFile(file);
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

reportPhoneInput?.addEventListener("input", () => {
  reportPhoneInput.value = reportPhoneInput.value.replace(/\D/g, "").slice(0, 15);
});

reportForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  loadReports({ page: 1, resetFilters: true });
});

reportPreviousButton?.addEventListener("click", () => {
  if (reportState.page <= 1) return;
  loadReports({ page: reportState.page - 1 });
});

reportNextButton?.addEventListener("click", () => {
  if (reportState.page >= reportState.totalPages) return;
  loadReports({ page: reportState.page + 1 });
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
  openTemplateModalButton.addEventListener("click", () => openTemplateModal({ reset: true }));
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
      const submitted = await submitTemplateForReview();
      if (submitted) closeTemplateModal();
    } catch (error) {
      setTemplateMessage(error.message, true);
    } finally {
      button.disabled = false;
    }
  });
});

templateHeaderTypeSelect?.addEventListener("change", updateTemplateHeaderControls);
templateHeaderMediaSelect?.addEventListener("change", updateTemplateDraftPreview);
templateNameInput?.addEventListener("input", updateTemplateDraftPreview);
templateLanguageSelect?.addEventListener("change", updateTemplateDraftPreview);
templateCategorySelect?.addEventListener("change", () => {
  updateTemplateHeaderControls();
  if (templateCategorySelect.value === "authentication") {
    if (templateCtaList) templateCtaList.innerHTML = "";
    closeTemplateCtaMenu();
  }
  updateTemplateDraftPreview();
});
templateBodyInput?.addEventListener("input", () => {
  renderTemplateVariableSamples();
  updateTemplateDraftPreview();
});
templateVariableSamplesHost?.addEventListener("input", (event) => {
  if (event.target.closest("[data-template-sample-input]")) updateTemplateSamplesValue();
});
templateAddCtaButton?.addEventListener("click", () => {
  if (!templateCtaMenu) return;
  templateCtaMenu.hidden = !templateCtaMenu.hidden;
});
templateCtaMenu?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-template-cta-type]");
  if (!option) return;
  addTemplateCta(option.dataset.templateCtaType);
});
templateCtaList?.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-template-remove-cta]");
  if (!removeButton) return;
  removeButton.closest("[data-template-cta-row]")?.remove();
  updateTemplateDraftPreview();
});
templateCtaList?.addEventListener("input", (event) => {
  if (event.target.closest("[data-template-cta-label], [data-template-cta-url]")) updateTemplateDraftPreview();
});

// Template Library: search/filter Meta's library and adopt templates into the WABA.
document.querySelector("[data-lib-refresh]")?.addEventListener("click", () => loadTemplateLibrary());
document.querySelector("[data-lib-language]")?.addEventListener("change", () => loadTemplateLibrary());
document.querySelector("[data-lib-more]")?.addEventListener("click", () => loadTemplateLibrary({ append: true }));

document.querySelector("[data-lib-topics]")?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-lib-topic-option]");
  if (!option) return;
  templateLibraryState.topic = option.dataset.libTopicOption || "";
  document.querySelectorAll("[data-lib-topic-option]").forEach((button) => {
    button.classList.toggle("is-active", button === option);
  });
  loadTemplateLibrary();
});

let libSearchDebounce = null;
document.querySelector("[data-lib-search]")?.addEventListener("input", () => {
  clearTimeout(libSearchDebounce);
  libSearchDebounce = setTimeout(() => loadTemplateLibrary(), 450);
});
document.querySelector("[data-lib-search]")?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  clearTimeout(libSearchDebounce);
  loadTemplateLibrary();
});

document.addEventListener("click", (event) => {
  const useButton = event.target.closest("[data-use-library-template]");
  if (!useButton) return;
  useLibraryTemplateInBuilder(templateLibraryState.items[Number(useButton.dataset.useLibraryTemplate)]);
});

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
      await requestJson("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("intercon_customer_portal_view");
      window.location.replace("/");
    } catch (error) {
      window.alert("Logout failed. You are still signed in. " + error.message);
    } finally {
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
// Media Library: tenant-scoped Cloudinary photos, videos, and PDFs.
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
        <small>${mediaState.assets.length ? "Choose another media type." : "Add a photo, video, or PDF to create your first reusable asset."}</small>
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
      : asset.mediaType === "document"
        ? `<a class="media-document-preview" href="${escapeHtml(asset.url)}" target="_blank" rel="noopener">PDF</a>`
        : `<img src="${escapeHtml(asset.url)}" alt="${escapeHtml(asset.title)}" loading="lazy">`;
    const mediaLabel = asset.mediaType === "video" ? "Video" : asset.mediaType === "document" ? "PDF" : "Photo";

    return `
      <article class="media-card">
        <div class="media-card-preview">
          ${preview}
          <span class="media-type-badge">${mediaLabel}</span>
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
    const data = await requestAllPages("/api/media", "media");
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
  if (mediaFileLabel) mediaFileLabel.textContent = "Choose a photo, video, or PDF";
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
// Inbox: two-way WhatsApp conversations (WhatsApp-Web style on desktop,
// single-pane chat on mobile). Inbound replies arrive via Meta webhook;
// WebSocket events refresh the browser, with polling kept as a fallback.
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
const inboxLiveState = document.querySelector("[data-inbox-live-state]");
const inboxChatLive = document.querySelector("[data-inbox-chat-live]");
const inboxBackButton = document.querySelector("[data-inbox-back]");
const inboxRailBadge = document.querySelector("[data-inbox-rail-badge]");
const inboxPhoneMedia = window.matchMedia("(max-width: 560px)");

const INBOX_POLL_MS = 15000;
const INBOX_UNREAD_POLL_MS = 30000;
const INBOX_STATUS_REFRESH_MS = 60000;
const INBOX_WS_RECONNECT_MAX_MS = 30000;

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
  realtimeSocket: null,
  realtimeReconnectTimer: null,
  realtimeReconnectDelay: 1000,
  realtimeStarted: false,
  sessionEnded: false,
  realtimePulseTimer: null,
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

function setInboxRealtimeState(state, label) {
  if (!inboxLiveState) return;
  inboxLiveState.dataset.state = state;
  const labelEl = inboxLiveState.querySelector("span");
  if (labelEl) labelEl.textContent = label;
}

function pulseInboxRealtimeUpdate(label = "New message") {
  if (!inboxChatActive) return;

  inboxChatActive.classList.add("has-live-update");
  if (inboxChatLive) {
    inboxChatLive.textContent = label;
    inboxChatLive.hidden = false;
  }

  if (inboxState.realtimePulseTimer) clearTimeout(inboxState.realtimePulseTimer);
  inboxState.realtimePulseTimer = setTimeout(() => {
    inboxChatActive.classList.remove("has-live-update");
    if (inboxChatLive) inboxChatLive.hidden = true;
    inboxState.realtimePulseTimer = null;
  }, 1600);
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

function mergeInboxMessages(data, older = false) {
  const existing = inboxState.messages || [];
  if (older || !existing.length) inboxState.olderCursor = data.nextCursor || null;
  const byId = new Map(existing.map(message => [message.id, message]));
  for (const message of data.messages || []) {
    const known = byId.get(message.id);
    if (known?.direction === "out" && !canAdvanceInboxStatus(known.status, message.status)) {
      byId.set(message.id, { ...message, status: known.status, error: known.error });
    } else byId.set(message.id, message);
  }
  inboxState.messages = Array.from(byId.values()).sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt) || a.id.localeCompare(b.id));
  const previousHeight = inboxMessagesEl?.scrollHeight || 0, previousTop = inboxMessagesEl?.scrollTop || 0;
  const wasNearBottom = previousHeight - previousTop - (inboxMessagesEl?.clientHeight || 0) < 80;
  renderInboxMessages(inboxState.messages);
  if (older && inboxMessagesEl) inboxMessagesEl.scrollTop = previousTop + inboxMessagesEl.scrollHeight - previousHeight;
  else if (existing.length && !wasNearBottom && inboxMessagesEl) inboxMessagesEl.scrollTop = previousTop;
  const button = document.querySelector("[data-inbox-older]");
  if (button) button.hidden = !inboxState.olderCursor;
}

async function acknowledgeInboxMessages(conversationId, messages) {
  if (document.hidden || document.getElementById("inbox")?.hidden || inboxState.activeId !== conversationId || !messages?.length) return;
  const data = await requestJson("/api/inbox/conversations/" + conversationId + "/read", {
    method: "POST", body: JSON.stringify({ throughMessageId: messages.at(-1).id })
  });
  if (inboxState.activeId === conversationId && data.conversation?.unreadCount === 0) markActiveConversationReadInList();
}

document.querySelector("[data-inbox-older]")?.addEventListener("click", async (event) => {
  const button = event.currentTarget, conversationId = inboxState.activeId;
  if (!conversationId || !inboxState.olderCursor) return;
  button.disabled = true;
  try {
    const data = await requestJson("/api/inbox/conversations/" + conversationId + "/messages?before=" + encodeURIComponent(inboxState.olderCursor));
    if (inboxState.activeId === conversationId) mergeInboxMessages(data, true);
  } catch (error) { setInboxStatus(error.message, true); }
  finally { button.disabled = false; }
});

function renderInboxMessages(messages) {
  if (!inboxMessagesEl) return;

  if (!messages.length) {
    inboxMessagesEl.innerHTML = `<div class="inbox-day-chip">No messages yet</div>`;
    return;
  }

  inboxMessagesEl.innerHTML = messages.map((message) => {
    const outbound = message.direction === "out";
    const caption = message.caption || message.mediaCaption || "";
    const statusLabel = message.status === "failed" ? "Delivery failed" : message.status || "sent";
    const tickText = message.status === "failed" ? "!" : ["delivered", "read"].includes(message.status) ? "&#10003;&#10003;" : message.status === "queued" ? "&#9695;" : "&#10003;";
    const ticks = outbound
      ? '<i class="inbox-ticks ' + (message.status === "read" ? "is-read" : "") + ' ' + (message.status === "failed" ? "is-failed" : "") + '" role="img" aria-label="' + escapeHtml(statusLabel) + '" title="' + escapeHtml(statusLabel) + '">' + tickText + '</i>'
      : "";

    if (message.revoked) {
      return `
        <div class="inbox-bubble ${outbound ? "is-out" : "is-in"} is-revoked">
          <p><em>🚫 This message was deleted</em></p>
          <span class="inbox-bubble-meta">${escapeHtml(formatClockTime(message.sentAt))}${ticks}</span>
        </div>
      `;
    }

    // Meta strips the content of an unsupported message, so this is a system
    // notice rather than something the customer actually said — render it like
    // a revoked message, with Meta's error code on hover for support triage.
    if (message.type === "unsupported") {
      const errorTitle = message.error ? ` title="${escapeHtml(message.error)}"` : "";
      return `
        <div class="inbox-bubble ${outbound ? "is-out" : "is-in"} is-revoked"${errorTitle}>
          <p><em>⚠️ ${escapeHtml(caption || "Unsupported message")}</em></p>
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
    const data = await requestAllPages("/api/inbox/conversations", "conversations");
    if (inboxState.sessionEnded) return;
    inboxState.conversations = (data.conversations || []).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
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
  inboxState.messages = [];
  inboxState.olderCursor = null;
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
    mergeInboxMessages(data);
    applyInboxWindowState(data.conversation);
    inboxState.activeLastMessageAt = data.conversation?.lastMessageAt || "";
    inboxState.lastMessageRefreshAt = Date.now();
    await acknowledgeInboxMessages(conversationId, data.messages);
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
    mergeInboxMessages(data);
    applyInboxWindowState(data.conversation);
    await acknowledgeInboxMessages(conversationId, data.messages);
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

function getInboxRealtimeUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function scheduleInboxRealtimeReconnect() {
  if (!inboxState.realtimeStarted || inboxState.realtimeReconnectTimer) return;
  setInboxRealtimeState("reconnecting", "Reconnecting");
  const delay = inboxState.realtimeReconnectDelay;
  inboxState.realtimeReconnectDelay = Math.min(
    INBOX_WS_RECONNECT_MAX_MS,
    Math.round(inboxState.realtimeReconnectDelay * 1.7)
  );
  inboxState.realtimeReconnectTimer = setTimeout(() => {
    inboxState.realtimeReconnectTimer = null;
    connectInboxRealtime();
  }, delay);
}

async function refreshInboxFromRealtime(event) {
  const eventConversationId = event?.conversationId ? String(event.conversationId) : "";
  const activeConversationUpdated = Boolean(
    eventConversationId
    && inboxState.activeId
    && String(inboxState.activeId) === eventConversationId
  );

  if (!isInboxViewVisible()) {
    await pollInboxUnread();
    return;
  }

  if (activeConversationUpdated) {
    await refreshActiveConversation();
    await loadInboxConversations(true);
    pulseInboxRealtimeUpdate(event?.action === "message_sent" ? "Message sent" : "New message");
    return;
  }

  await loadInboxConversations(true);

  // Older events may not include a conversation id. Keep the active pane fresh
  // in that case without waiting for the fallback poll interval.
  if (inboxState.activeId && !eventConversationId) {
    await refreshActiveConversation();
  }
}

let inboxRealtimeRefreshTimer = null;
let inboxRealtimeRefreshNeeded = false;
let inboxRealtimeRefreshing = false;
let inboxStatusRenderFrame = null;

function queueInboxRealtimeRefresh() {
  if (inboxState.sessionEnded) return;
  inboxRealtimeRefreshNeeded = true;
  if (inboxRealtimeRefreshing || inboxRealtimeRefreshTimer) return;
  inboxRealtimeRefreshTimer = setTimeout(async () => {
    inboxRealtimeRefreshTimer = null;
    if (inboxState.loadingActive) { queueInboxRealtimeRefresh(); return; }
    inboxRealtimeRefreshNeeded = false;
    inboxRealtimeRefreshing = true;
    try { await refreshInboxFromRealtime(); }
    catch { if (isInboxViewVisible()) await pollInboxView(); }
    finally {
      inboxRealtimeRefreshing = false;
      if (inboxRealtimeRefreshNeeded) queueInboxRealtimeRefresh();
    }
  }, 100);
}

function canAdvanceInboxStatus(current, next) {
  const predecessors = {
    queued: ["queued"], sent: ["queued", "sent"],
    delivered: ["queued", "sent", "delivered", "failed"],
    read: ["queued", "sent", "delivered", "read", "failed"],
    failed: ["queued", "sent", "failed"]
  }[next];
  return Boolean(predecessors?.includes(current));
}

function applyInboxDeliveryStatus(event) {
  if (event.conversationId !== inboxState.activeId) return true;
  const message = inboxState.messages?.find(item => item.id === event.messageId && item.direction === "out");
  if (!message) return false;
  if (!canAdvanceInboxStatus(message.status, event.status)) return true;
  message.status = event.status;
  if (event.status !== "failed") message.error = "";
  if (inboxStatusRenderFrame === null) inboxStatusRenderFrame = requestAnimationFrame(() => {
    inboxStatusRenderFrame = null;
    const scrollTop = inboxMessagesEl?.scrollTop || 0;
    renderInboxMessages(inboxState.messages || []);
    if (inboxMessagesEl) inboxMessagesEl.scrollTop = scrollTop;
  });
  return true;
}

function handleInboxRealtimeEvent(event) {
  if (event?.type !== "inbox:updated") return;
  if (event.action === "status_updated" && applyInboxDeliveryStatus(event)) return;
  queueInboxRealtimeRefresh();
}

function connectInboxRealtime() {
  if (!("WebSocket" in window)) {
    setInboxRealtimeState("fallback", "Refresh");
    return;
  }
  if (inboxState.realtimeSocket) return;

  setInboxRealtimeState("connecting", "Connecting");
  const socket = new WebSocket(getInboxRealtimeUrl());
  inboxState.realtimeSocket = socket;

  socket.addEventListener("open", () => {
    inboxState.realtimeReconnectDelay = 1000;
    setInboxRealtimeState("live", "Live");
    // Fetch durable state after reconnect; the notification channel has no replay.
    queueInboxRealtimeRefresh();
  });

  socket.addEventListener("message", (message) => {
    let event;
    try {
      event = JSON.parse(message.data);
    } catch (error) {
      return;
    }
    handleInboxRealtimeEvent(event);
  });

  socket.addEventListener("close", (event) => {
    if (inboxState.realtimeSocket === socket) inboxState.realtimeSocket = null;
    if (event.code === 1008) {
      inboxState.realtimeStarted = false;
      inboxState.sessionEnded = true;
      clearTimeout(inboxRealtimeRefreshTimer); inboxRealtimeRefreshTimer = null;
      clearTimeout(inboxState.realtimeReconnectTimer); inboxState.realtimeReconnectTimer = null;
      inboxRealtimeRefreshNeeded = false;
      inboxState.activeLoadToken++;
      inboxState.activeId = null; inboxState.messages = []; inboxState.conversations = [];
      inboxMessagesEl?.replaceChildren(); inboxThreads?.replaceChildren();
      stopInboxPolling();
      setInboxRealtimeState("fallback", "Sign in again");
      setInboxStatus("Your session ended. Sign in again to receive messages.", true);
      return;
    }
    if (inboxState.realtimeStarted) setInboxRealtimeState("reconnecting", "Reconnecting");
    scheduleInboxRealtimeReconnect();
  });

  socket.addEventListener("error", () => {
    setInboxRealtimeState("reconnecting", "Reconnecting");
    socket.close();
  });
}

function startInboxRealtime() {
  if (inboxState.realtimeStarted) return;
  inboxState.realtimeStarted = true;
  connectInboxRealtime();
}

function startInboxView() {
  if (inboxState.sessionEnded) return;
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
  if (["blacklist", "optout"].includes(viewId)) loadSuppressionList(viewId === "blacklist" ? "blocked" : "opted_out");
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
  if (viewId === "template-library" && !templateLibraryState.loaded) {
    loadTemplateLibrary();
  }
  if (viewId === "contacts") {
    Promise.all([loadContacts(), loadGroups()]).catch((error) => setContactMessage(error.message, true));
  }
  if (viewId === "groups") {
    loadGroups().catch((error) => setGroupMessage(error.message, true));
  }
  if (viewId === "chatbot") {
    loadChatbotFlows().catch((error) => setChatbotMessage(error.message, true));
  }
  if (viewId === "connect" || viewId === "coexistence") {
    loadOnboardingStatus().catch((error) => setMetaConnectMessage(error.message, true));
    // Warm up the Facebook SDK so the Meta popup can be opened synchronously on
    // click (Safari blocks popups opened after an async wait).
    loadFacebookSdk().catch(() => {});
    loadMetaOnboardingSession().catch(() => {});
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
    if (inboxState.realtimeStarted && !inboxState.realtimeSocket) connectInboxRealtime();
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
    const data = await requestAllPages(`/api/contacts/segments/${segmentId}/members`, "members");
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

function defaultChatbotNodes() {
  return [
    {
      id: "trigger",
      type: "trigger",
      title: "Customer message",
      keyword: "hi",
      message: "",
      routeTo: "human_agent",
      options: [],
      position: { x: 58, y: 104 }
    },
    {
      id: "menu_1",
      type: "menu",
      title: "Welcome menu",
      keyword: "",
      message: "Hi! Welcome to InterCon. How can we help you today?",
      routeTo: "human_agent",
      options: [
        { label: "Sales", nextNodeId: "handoff_sales" },
        { label: "Support", nextNodeId: "handoff_support" }
      ],
      position: { x: 258, y: 104 }
    },
    {
      id: "handoff_sales",
      type: "handoff",
      title: "Sales team",
      keyword: "",
      message: "Thanks. Our sales team will continue from here.",
      routeTo: "sales",
      options: [],
      position: { x: 580, y: 76 }
    },
    {
      id: "handoff_support",
      type: "handoff",
      title: "Support team",
      keyword: "",
      message: "Thanks. Our support team will continue from here.",
      routeTo: "support",
      options: [],
      position: { x: 580, y: 314 }
    }
  ];
}

function resetChatbotBuilder() {
  chatbotState.currentId = null;
  chatbotState.status = "draft";
  chatbotState.selectedNodeId = "trigger";
  chatbotState.nodes = defaultChatbotNodes();
  chatbotState.edges = buildChatbotEdges(chatbotState.nodes);
  if (chatbotNameInput) chatbotNameInput.value = "Welcome menu";
  updateChatbotStatus("draft");
  renderChatbotBuilder();
}

function setChatbotMessage(message, isError = false) {
  if (!chatbotMessage) return;
  chatbotMessage.textContent = message || "";
  chatbotMessage.classList.toggle("error", Boolean(isError));
}

function getChatbotNode(nodeId) {
  return chatbotState.nodes.find((node) => node.id === nodeId) || null;
}

function getChatbotFirstReplyNode(nodes = chatbotState.nodes) {
  return nodes.find((node) => ["message", "menu"].includes(node.type) && node.message) || nodes.find((node) => ["message", "menu"].includes(node.type)) || null;
}

function buildChatbotEdges(nodes = chatbotState.nodes) {
  const ids = new Set(nodes.map((node) => node.id));
  const edges = [];
  const firstReply = getChatbotFirstReplyNode(nodes);
  if (firstReply && ids.has("trigger")) edges.push({ from: "trigger", to: firstReply.id, label: "match" });

  nodes.forEach((node) => {
    (node.options || []).forEach((option) => {
      if (option.label && ids.has(option.nextNodeId)) {
        edges.push({ from: node.id, to: option.nextNodeId, label: option.label });
      }
    });
  });

  return edges;
}

function getChatbotNodeSize(node) {
  if (node.type === "trigger") return { width: 154, height: 104 };
  if (node.type === "menu") return { width: 282, height: 156 + Math.max(0, (node.options?.length || 0) - 3) * 34 };
  return { width: 278, height: 142 };
}

function renderChatbotConnections() {
  const nodeMap = new Map(chatbotState.nodes.map((node) => [node.id, node]));
  const paths = chatbotState.edges.map((edge) => {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) return "";
    const fromSize = getChatbotNodeSize(from);
    const toSize = getChatbotNodeSize(to);
    const optionIndex = (from.options || []).findIndex((option) => option.nextNodeId === edge.to && option.label === edge.label);
    const startX = Number(from.position?.x || 0) + fromSize.width;
    const startY = Number(from.position?.y || 0) + (optionIndex >= 0 ? 118 + optionIndex * 34 : fromSize.height / 2);
    const endX = Number(to.position?.x || 0);
    const endY = Number(to.position?.y || 0) + Math.min(68, toSize.height / 2);
    const midX = Math.max(startX + 48, startX + (endX - startX) / 2);
    return `<path d="M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}" />`;
  }).join("");

  return `<svg class="chatbot-connection-layer" viewBox="0 0 1200 760" aria-hidden="true">${paths}</svg>`;
}

function createChatbotNode(type, position = null) {
  const count = chatbotState.nodes.filter((node) => node.type === type).length + 1;
  const id = `${type}_${Date.now().toString(36)}_${count}`;
  const basePosition = position || { x: 320 + count * 24, y: 260 + count * 20 };
  const templates = {
    message: {
      title: `Reply ${count}`,
      message: "Thanks for messaging us. Please share a few details so we can help.",
      routeTo: "human_agent",
      options: []
    },
    menu: {
      title: `Menu ${count}`,
      message: "Choose an option:\n1. Sales\n2. Support",
      routeTo: "human_agent",
      options: [
        { label: "Sales", nextNodeId: "" },
        { label: "Support", nextNodeId: "" }
      ]
    },
    handoff: {
      title: `Handoff ${count}`,
      message: "A team member will continue this chat.",
      routeTo: "human_agent",
      options: []
    }
  };

  const node = {
    id,
    type,
    keyword: "",
    position: basePosition,
    ...templates[type]
  };
  chatbotState.nodes.push(node);
  chatbotState.selectedNodeId = id;
  chatbotState.edges = buildChatbotEdges();
  renderChatbotBuilder();
}

function renderChatbotCanvas() {
  if (!chatbotCanvas) return;
  chatbotState.edges = buildChatbotEdges();

  chatbotCanvas.innerHTML = [
    renderChatbotConnections(),
    ...chatbotState.nodes.map((node) => {
      const selected = node.id === chatbotState.selectedNodeId;
      const size = getChatbotNodeSize(node);
      const messageText = node.message || (node.type === "trigger" ? "" : "Add message");
      const icon = node.type === "trigger"
        ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h12v12M5 5v14"/><path d="m5 5 5 4"/></svg>`
        : node.type === "menu"
          ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5Z"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>`
          : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h14v10H7l-3 3Z"/><path d="M18 13l3 3-3 3"/></svg>`;
      const options = node.type === "menu"
        ? `<div class="chatbot-card-options">${(node.options || []).map((option, index) => `
            <div class="chatbot-option-chip">
              <span>${escapeHtml(option.label || `Option ${index + 1}`)}</span>
              <em>0</em>
              <i aria-hidden="true"></i>
            </div>
          `).join("")}</div>`
        : "";
      return `
        <article
          class="chatbot-node chatbot-node-${escapeHtml(node.type)} ${selected ? "is-selected" : ""}"
          data-chatbot-node="${escapeHtml(node.id)}"
          style="left:${Number(node.position?.x || 0) * chatbotState.zoom}px;top:${Number(node.position?.y || 0) * chatbotState.zoom}px;width:${size.width}px;min-height:${size.height}px;"
          role="button"
          tabindex="0"
          aria-pressed="${selected ? "true" : "false"}">
          <div class="chatbot-card-head">
            <span class="chatbot-card-icon">${icon}</span>
            <strong>${escapeHtml(node.title || node.type)}</strong>
            <i aria-hidden="true"></i>
          </div>
          <div class="chatbot-card-stats">
            <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 7-14 7v-5l8-2-8-2Z"/></svg>0</span>
            ${node.type === "menu" ? `<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 8 4 4-4 4M13 8h4"/></svg>${node.options?.length || 0}</span>` : ""}
          </div>
          ${node.type === "trigger"
            ? `<p class="chatbot-trigger-text">Customer sends <b>${escapeHtml(node.keyword || "hi")}</b></p>`
            : `<p class="chatbot-card-message">${escapeHtml(messageText)}</p>`}
          ${options}
        </article>
      `;
    })
  ].join("");
  chatbotCanvas.style.setProperty("--chatbot-zoom", chatbotState.zoom);
  if (chatbotZoomLabel) chatbotZoomLabel.textContent = `${Math.round(chatbotState.zoom * 100)}%`;
}

function renderChatbotInspector() {
  if (!chatbotInspector) return;
  const node = getChatbotNode(chatbotState.selectedNodeId);
  if (!node) {
    chatbotInspector.innerHTML = `<div class="chatbot-inspector-empty">Select a block to edit the trigger, reply, menu, or handoff.</div>`;
    return;
  }

  const nodeChoices = chatbotState.nodes
    .filter((item) => item.id !== node.id && item.type !== "trigger")
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.id)}</option>`)
    .join("");
  const optionsHtml = (node.options || []).map((option, index) => `
    <div class="chatbot-option-row">
      <input type="text" maxlength="80" value="${escapeHtml(option.label || "")}" placeholder="Button text" data-chatbot-option-label="${index}">
      <select data-chatbot-option-next="${index}">
        <option value="">No next block</option>
        ${chatbotState.nodes.filter((item) => item.id !== node.id && item.type !== "trigger").map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === option.nextNodeId ? "selected" : ""}>${escapeHtml(item.title || item.id)}</option>`).join("")}
      </select>
      <button type="button" aria-label="Remove option" title="Remove option" data-chatbot-remove-option="${index}">&times;</button>
    </div>
  `).join("");

  chatbotInspector.innerHTML = `
    <div class="chatbot-inspector-head">
      <span>${escapeHtml(node.type)}</span>
      <strong>${escapeHtml(node.title || node.type)}</strong>
    </div>
    <label>
      Block title
      <input type="text" maxlength="140" value="${escapeHtml(node.title || "")}" data-chatbot-field="title">
    </label>
    ${node.type === "trigger" ? `
      <label>
        Customer keyword
        <input type="text" maxlength="120" value="${escapeHtml(node.keyword || "")}" placeholder="hi" data-chatbot-field="keyword">
      </label>
    ` : `
      <label>
        Reply text
        <textarea rows="5" maxlength="900" data-chatbot-field="message">${escapeHtml(node.message || "")}</textarea>
      </label>
    `}
    ${node.type === "menu" ? `
      <div class="chatbot-options-head">
        <strong>Menu options</strong>
        <button type="button" data-chatbot-add-option>Add option</button>
      </div>
      <div class="chatbot-options">${optionsHtml || `<div class="empty-row">No menu options yet.</div>`}</div>
      <label>
        Quick connect next reply
        <select data-chatbot-quick-next>
          <option value="">Choose block</option>
          ${nodeChoices}
        </select>
      </label>
    ` : ""}
    ${node.type === "handoff" ? `
      <label>
        Team route
        <select data-chatbot-field="routeTo">
          <option value="human_agent" ${node.routeTo === "human_agent" ? "selected" : ""}>Human agent</option>
          <option value="sales" ${node.routeTo === "sales" ? "selected" : ""}>Sales</option>
          <option value="support" ${node.routeTo === "support" ? "selected" : ""}>Support</option>
          <option value="billing" ${node.routeTo === "billing" ? "selected" : ""}>Billing</option>
        </select>
      </label>
    ` : ""}
    ${node.type !== "trigger" ? `<button type="button" class="btn btn-outline btn-small" data-chatbot-delete-node>Delete block</button>` : ""}
  `;
}

function renderChatbotBuilder() {
  renderChatbotCanvas();
  renderChatbotInspector();
}

function updateChatbotStatus(status = "draft") {
  chatbotState.status = status || "draft";
  if (!chatbotStatus) return;
  const label = chatbotState.status === "active" ? "Live" : chatbotState.status === "paused" ? "Paused" : "Draft";
  chatbotStatus.textContent = label;
  chatbotStatus.classList.toggle("is-live", chatbotState.status === "active");
  chatbotStatus.classList.toggle("is-paused", chatbotState.status === "paused");
}

function chatbotPayload() {
  const nodes = chatbotState.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    title: node.title || "",
    keyword: node.keyword || "",
    message: node.message || "",
    routeTo: node.routeTo || "human_agent",
    options: (node.options || []).filter((option) => option.label).map((option) => ({
      label: option.label,
      nextNodeId: option.nextNodeId || ""
    })),
    position: node.position || { x: 0, y: 0 }
  }));
  const trigger = nodes.find((node) => node.type === "trigger") || {};
  const firstReply = getChatbotFirstReplyNode(nodes);
  const routeNode = nodes.find((node) => node.type === "handoff");

  return {
    name: (chatbotNameInput?.value || "").trim(),
    triggerType: "keyword",
    triggerValue: trigger.keyword || "hi",
    firstReply: firstReply?.message || "",
    routeTo: routeNode?.routeTo || "human_agent",
    nodes,
    edges: buildChatbotEdges(nodes),
    stopOnAgentJoin: true,
    respectServiceWindow: true,
    requireOptInForTemplate: true,
    fallbackForUnknownReply: true
  };
}

function renderChatbotFlowList() {
  if (!chatbotFlowList) return;
  if (!chatbotState.flows.length) {
    chatbotFlowList.innerHTML = `<div class="empty-row">No chatbot drafts yet.</div>`;
    return;
  }
  chatbotFlowList.innerHTML = chatbotState.flows.map((flow) => `
    <button type="button" class="chatbot-flow-item" data-chatbot-load-flow="${escapeHtml(flow._id)}">
      <strong>${escapeHtml(flow.name || "Untitled flow")}</strong>
      <span>${escapeHtml(flow.triggerValue || "hi")} -> ${escapeHtml(flow.firstReply || "Draft reply")}</span>
      <em>${escapeHtml(flow.status || "draft")}</em>
    </button>
  `).join("");
}

async function loadChatbotFlows() {
  if (!chatbotFlowList) return;
  const data = await requestJson("/api/automations");
  chatbotState.flows = data.flows || [];
  chatbotState.loaded = true;
  renderChatbotFlowList();
}

function loadChatbotFlowIntoBuilder(flow) {
  chatbotState.currentId = flow._id || null;
  chatbotState.status = flow.status || "draft";
  chatbotState.selectedNodeId = "trigger";
  chatbotState.nodes = Array.isArray(flow.nodes) && flow.nodes.length
    ? flow.nodes.map((node, index) => ({
        id: node.id || `node_${index + 1}`,
        type: node.type || "message",
        title: node.title || node.name || node.type || "Block",
        keyword: node.keyword || "",
        message: node.message || "",
        routeTo: node.routeTo || "human_agent",
        options: node.options || [],
        position: node.position || { x: 32 + index * 260, y: 48 }
      }))
    : [
        {
          id: "trigger",
          type: "trigger",
          title: "Customer message",
          keyword: flow.triggerValue || "hi",
          message: "",
          routeTo: "human_agent",
          options: [],
          position: { x: 58, y: 104 }
        },
        {
          id: "reply_1",
          type: "message",
          title: "First reply",
          keyword: "",
          message: flow.firstReply || "",
          routeTo: flow.routeTo || "human_agent",
          options: [],
          position: { x: 258, y: 104 }
        }
      ];
  chatbotState.edges = buildChatbotEdges();
  if (chatbotNameInput) chatbotNameInput.value = flow.name || "Welcome menu";
  updateChatbotStatus(flow.status || "draft");
  renderChatbotBuilder();
}

async function saveChatbotFlow() {
  const payload = chatbotPayload();
  if (!payload.name) {
    setChatbotMessage("Flow name is required.", true);
    return null;
  }
  if (!payload.firstReply) {
    setChatbotMessage("Add at least one reply or menu message before saving.", true);
    return null;
  }

  setChatbotMessage("Saving chatbot draft...");
  if (chatbotSaveButton) chatbotSaveButton.disabled = true;
  try {
    const data = await requestJson(chatbotState.currentId ? `/api/automations/${chatbotState.currentId}` : "/api/automations", {
      method: chatbotState.currentId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    chatbotState.currentId = data.flow?._id || chatbotState.currentId;
    updateChatbotStatus(data.flow?.status || chatbotState.status || "draft");
    setChatbotMessage("ChatBot flow saved.");
    await loadChatbotFlows();
    return data.flow;
  } catch (error) {
    setChatbotMessage(error.message, true);
    return null;
  } finally {
    if (chatbotSaveButton) chatbotSaveButton.disabled = false;
  }
}

async function launchChatbotFlow() {
  if (chatbotLaunchButton) chatbotLaunchButton.disabled = true;
  setChatbotMessage("Saving and launching chatbot...");
  try {
    const savedFlow = await saveChatbotFlow();
    if (!savedFlow?._id) return;
    const flowId = savedFlow._id;
    const data = await requestJson(`/api/automations/${flowId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" })
    });
    updateChatbotStatus(data.flow?.status || "active");
    setChatbotMessage("ChatBot is live. Incoming WhatsApp messages that match this trigger will receive automatic replies.");
    await loadChatbotFlows();
  } catch (error) {
    setChatbotMessage(error.message, true);
  } finally {
    if (chatbotLaunchButton) chatbotLaunchButton.disabled = false;
  }
}

function autoLayoutChatbot() {
  const columns = { trigger: 0, message: 1, menu: 1, handoff: 2 };
  const counts = {};
  chatbotState.nodes.forEach((node) => {
    const column = columns[node.type] ?? 1;
    const row = counts[column] || 0;
    node.position = { x: 58 + column * 260, y: 104 + row * 228 };
    counts[column] = row + 1;
  });
  renderChatbotBuilder();
}

function updateSelectedChatbotNode(field, value) {
  const node = getChatbotNode(chatbotState.selectedNodeId);
  if (!node) return;
  node[field] = value;
  chatbotState.edges = buildChatbotEdges();
  renderChatbotCanvas();
}

function setChatbotPlusMenuOpen(open) {
  if (!chatbotPlusButton || !chatbotPlusMenu || !chatbotFloatingActions) return;
  chatbotPlusButton.setAttribute("aria-expanded", open ? "true" : "false");
  chatbotFloatingActions.classList.toggle("is-open", open);

  if (open) {
    chatbotPlusMenu.hidden = false;
    window.requestAnimationFrame(() => chatbotPlusMenu.classList.add("is-open"));
    return;
  }

  chatbotPlusMenu.classList.remove("is-open");
  window.setTimeout(() => {
    if (!chatbotPlusMenu.classList.contains("is-open")) chatbotPlusMenu.hidden = true;
  }, 200);
}

function toggleChatbotPlusMenu() {
  setChatbotPlusMenuOpen(chatbotPlusButton?.getAttribute("aria-expanded") !== "true");
}

function setChatbotPanMode(enabled) {
  chatbotState.panMode = Boolean(enabled);
  chatbotCanvas?.classList.toggle("is-pan-mode", chatbotState.panMode);
  chatbotPanButton?.classList.toggle("is-active", chatbotState.panMode);
  chatbotPanButton?.setAttribute("aria-pressed", chatbotState.panMode ? "true" : "false");
  if (!chatbotState.panMode) chatbotState.panning = false;
}


chatbotCanvas?.addEventListener("click", (event) => {
  const nodeButton = event.target.closest("[data-chatbot-node]");
  if (!nodeButton) return;
  chatbotState.selectedNodeId = nodeButton.getAttribute("data-chatbot-node");
  renderChatbotBuilder();
});

chatbotCanvas?.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  const nodeButton = event.target.closest("[data-chatbot-node]");

  if (chatbotState.panMode && !nodeButton) {
    chatbotState.panning = true;
    chatbotState.panStart = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: chatbotCanvas.scrollLeft,
      scrollTop: chatbotCanvas.scrollTop
    };
    chatbotCanvas.setPointerCapture(event.pointerId);
    chatbotCanvas.classList.add("is-panning");
    return;
  }

  if (!nodeButton || chatbotState.panMode) return;
  const node = getChatbotNode(nodeButton.getAttribute("data-chatbot-node"));
  if (!node) return;
  const rect = nodeButton.getBoundingClientRect();
  chatbotState.draggingNodeId = node.id;
  chatbotState.dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  nodeButton.setPointerCapture(event.pointerId);
});

chatbotCanvas?.addEventListener("pointermove", (event) => {
  if (chatbotState.panning) {
    chatbotCanvas.scrollLeft = chatbotState.panStart.scrollLeft - (event.clientX - chatbotState.panStart.x);
    chatbotCanvas.scrollTop = chatbotState.panStart.scrollTop - (event.clientY - chatbotState.panStart.y);
    return;
  }

  if (!chatbotState.draggingNodeId) return;
  const node = getChatbotNode(chatbotState.draggingNodeId);
  const rect = chatbotCanvas.getBoundingClientRect();
  if (!node) return;
  node.position = {
    x: Math.max(12, Math.min((rect.width - 300) / chatbotState.zoom, (event.clientX - rect.left - chatbotState.dragOffset.x) / chatbotState.zoom)),
    y: Math.max(12, Math.min((rect.height - 120) / chatbotState.zoom, (event.clientY - rect.top - chatbotState.dragOffset.y) / chatbotState.zoom))
  };
  renderChatbotCanvas();
});

chatbotCanvas?.addEventListener("pointerup", () => {
  chatbotState.draggingNodeId = null;
  chatbotState.panning = false;
  chatbotCanvas.classList.remove("is-panning");
});

chatbotCanvas?.addEventListener("pointercancel", () => {
  chatbotState.draggingNodeId = null;
  chatbotState.panning = false;
  chatbotCanvas.classList.remove("is-panning");
});

chatbotCanvas?.addEventListener("dragover", (event) => {
  event.preventDefault();
});

chatbotCanvas?.addEventListener("drop", (event) => {
  event.preventDefault();
  const type = event.dataTransfer?.getData("text/chatbot-node");
  if (!["message", "menu", "handoff"].includes(type)) return;
  const rect = chatbotCanvas.getBoundingClientRect();
  createChatbotNode(type, { x: (event.clientX - rect.left) / chatbotState.zoom, y: (event.clientY - rect.top) / chatbotState.zoom });
});

chatbotAddNodeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    createChatbotNode(button.getAttribute("data-chatbot-add-node"));
    setChatbotPlusMenuOpen(false);
  });
  button.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData("text/chatbot-node", button.getAttribute("data-chatbot-add-node"));
  });
});

chatbotInspector?.addEventListener("input", (event) => {
  const field = event.target.getAttribute("data-chatbot-field");
  if (field) {
    updateSelectedChatbotNode(field, event.target.value);
    return;
  }
  const optionLabel = event.target.getAttribute("data-chatbot-option-label");
  if (optionLabel !== null) {
    const node = getChatbotNode(chatbotState.selectedNodeId);
    if (!node) return;
    node.options[Number(optionLabel)].label = event.target.value;
    chatbotState.edges = buildChatbotEdges();
    renderChatbotCanvas();
  }
});

chatbotInspector?.addEventListener("change", (event) => {
  const field = event.target.getAttribute("data-chatbot-field");
  if (field) {
    updateSelectedChatbotNode(field, event.target.value);
    renderChatbotInspector();
    return;
  }
  const optionNext = event.target.getAttribute("data-chatbot-option-next");
  if (optionNext !== null) {
    const node = getChatbotNode(chatbotState.selectedNodeId);
    if (!node) return;
    node.options[Number(optionNext)].nextNodeId = event.target.value;
    chatbotState.edges = buildChatbotEdges();
    renderChatbotCanvas();
    return;
  }
  if (event.target.matches("[data-chatbot-quick-next]") && event.target.value) {
    const node = getChatbotNode(chatbotState.selectedNodeId);
    const target = getChatbotNode(event.target.value);
    if (!node || !target) return;
    node.options = [...(node.options || []), { label: target.title || "Next", nextNodeId: target.id }];
    renderChatbotBuilder();
  }
});

chatbotInspector?.addEventListener("click", (event) => {
  const node = getChatbotNode(chatbotState.selectedNodeId);
  if (!node) return;
  if (event.target.closest("[data-chatbot-add-option]")) {
    node.options = [...(node.options || []), { label: "New option", nextNodeId: "" }];
    renderChatbotBuilder();
    return;
  }
  const removeOption = event.target.closest("[data-chatbot-remove-option]");
  if (removeOption) {
    node.options.splice(Number(removeOption.getAttribute("data-chatbot-remove-option")), 1);
    chatbotState.edges = buildChatbotEdges();
    renderChatbotBuilder();
    return;
  }
  if (event.target.closest("[data-chatbot-delete-node]")) {
    chatbotState.nodes = chatbotState.nodes.filter((item) => item.id !== node.id);
    chatbotState.nodes.forEach((item) => {
      item.options = (item.options || []).filter((option) => option.nextNodeId !== node.id);
    });
    chatbotState.selectedNodeId = "trigger";
    chatbotState.edges = buildChatbotEdges();
    renderChatbotBuilder();
  }
});

chatbotFlowList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-chatbot-load-flow]");
  if (!button) return;
  const flow = chatbotState.flows.find((item) => item._id === button.getAttribute("data-chatbot-load-flow"));
  if (flow) loadChatbotFlowIntoBuilder(flow);
});

chatbotNewButton?.addEventListener("click", () => {
  resetChatbotBuilder();
  setChatbotMessage("");
});

chatbotRefreshButton?.addEventListener("click", () => {
  loadChatbotFlows().catch((error) => setChatbotMessage(error.message, true));
});

chatbotSaveButton?.addEventListener("click", saveChatbotFlow);
chatbotLaunchButton?.addEventListener("click", launchChatbotFlow);
chatbotPanButton?.addEventListener("click", () => setChatbotPanMode(!chatbotState.panMode));
chatbotPlusButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleChatbotPlusMenu();
});
chatbotPlusMenu?.addEventListener("click", (event) => event.stopPropagation());
document.addEventListener("click", () => setChatbotPlusMenuOpen(false));
chatbotAutoLayoutButton?.addEventListener("click", () => {
  autoLayoutChatbot();
  setChatbotPlusMenuOpen(false);
});
chatbotZoomOutButton?.addEventListener("click", () => {
  chatbotState.zoom = Math.max(0.75, Number((chatbotState.zoom - 0.1).toFixed(2)));
  renderChatbotCanvas();
});
chatbotZoomInButton?.addEventListener("click", () => {
  chatbotState.zoom = Math.min(1.5, Number((chatbotState.zoom + 0.1).toFixed(2)));
  renderChatbotCanvas();
});
if (chatbotCanvas) resetChatbotBuilder();

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

function setContactEditMessage(message, isError = false) {
  if (!contactEditMessage) return;
  contactEditMessage.textContent = message || "";
  contactEditMessage.classList.toggle("error", Boolean(isError));
}

function openContactEditModal(contactId) {
  const contact = getContactById(contactId);
  if (!contactEditModal || !contact) return;

  contactEditState.contactId = contactId;
  contactEditState.saving = false;
  if (contactEditName) contactEditName.value = contact.name || "";
  if (contactEditPhone) contactEditPhone.value = contact.phone || "";
  if (contactEditEmail) contactEditEmail.value = contact.email || "";
  if (contactEditCity) contactEditCity.value = contact.city || "";
  if (contactEditTag) contactEditTag.value = contact.tags?.[0] || "";
  if (contactEditOptIn) contactEditOptIn.checked = Boolean(contact.optIn?.status);
  if (contactEditProof) contactEditProof.value = contact.optIn?.proof || "";
  if (contactEditStatus) contactEditStatus.value = contact.status || "active";
  if (contactEditSave) contactEditSave.disabled = false;
  setContactEditMessage("");
  contactEditModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeContactEditModal() {
  if (!contactEditModal || contactEditState.saving) return;
  contactEditModal.hidden = true;
  document.body.classList.remove("modal-open");
  contactEditState.contactId = null;
  setContactEditMessage("");
  contactEditForm?.reset();
}

function getContactEditPayload() {
  const tag = contactEditTag?.value.trim() || "";
  return {
    name: contactEditName?.value.trim() || "",
    phone: contactEditPhone?.value.trim() || "",
    email: contactEditEmail?.value.trim() || "",
    city: contactEditCity?.value.trim() || "",
    tags: tag ? [tag.replace(/^#/, "")] : [],
    optIn: Boolean(contactEditOptIn?.checked),
    optInProof: contactEditProof?.value.trim() || "",
    status: contactEditStatus?.value || "active"
  };
}

async function saveContactEdit() {
  if (!contactEditState.contactId || contactEditState.saving) return;

  const payload = getContactEditPayload();
  if (!payload.name || !payload.phone) {
    setContactEditMessage("Contact name and WhatsApp number are required.", true);
    return;
  }

  contactEditState.saving = true;
  if (contactEditSave) contactEditSave.disabled = true;
  setContactEditMessage("Saving contact...");

  try {
    const data = await requestJson(`/api/contacts/${contactEditState.contactId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    const index = setupState.contacts.findIndex((contact) => contact._id === contactEditState.contactId);
    if (index !== -1 && data.contact) {
      setupState.contacts[index] = {
        ...setupState.contacts[index],
        ...data.contact,
        group: setupState.contacts[index].group || null
      };
    }
    await loadContacts();
    if (["#blacklist", "#optout"].includes(location.hash)) await loadSuppressionList(location.hash === "#blacklist" ? "blocked" : "opted_out");
    loadInboxConversations(true);
    contactEditState.saving = false;
    closeContactEditModal();
    setContactMessage("Contact updated.");
  } catch (error) {
    contactEditState.saving = false;
    if (contactEditSave) contactEditSave.disabled = false;
    setContactEditMessage(error.message, true);
  }
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
    const editButton = event.target.closest("[data-edit-contact]");
    if (editButton) {
      openContactEditModal(editButton.getAttribute("data-edit-contact"));
      return;
    }

    const assignButton = event.target.closest("[data-assign-groups]");
    if (!assignButton) return;
    openAssignModal(assignButton.getAttribute("data-assign-groups"), assignButton.getAttribute("data-contact-name"));
  });
}

contactEditPhone?.addEventListener("input", () => {
  contactEditPhone.value = contactEditPhone.value.replace(/\D/g, "").slice(0, 15);
});

contactEditForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  saveContactEdit();
});

closeContactEditButtons.forEach((button) => {
  button.addEventListener("click", () => closeContactEditModal());
});

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
  if (event.key === "Escape" && contactEditModal && !contactEditModal.hidden) {
    closeContactEditModal();
  }
  if (event.key === "Escape" && assignModal && !assignModal.hidden) {
    closeAssignModal();
  }
});

showPortalView(getInitialViewId(), false);
renderApiBaseUrl();
loadAuthenticatedProfile()
  .then(startInboxRealtime)
  .catch(() => {
    window.location.replace("/");
  });

// Covers browsers where the portal gets restored from back/forward cache
// despite the no-store header (e.g. after logout) — re-check the session
// instead of leaving stale account data on screen.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    loadAuthenticatedProfile()
      .then(startInboxRealtime)
      .catch(() => window.location.replace("/"));
  }
});

// Preload the Facebook SDK at startup so the Meta onboarding popup can open
// synchronously inside the click gesture (required by Safari's popup blocker).
loadFacebookSdk().catch(() => {});

// Keep the Inbox rail badge live regardless of the current view.
pollInboxUnread();
if (inboxRailBadge) {
  inboxState.unreadTimer = setInterval(pollInboxUnread, INBOX_UNREAD_POLL_MS);
}

async function loadSuppressionList(status) {
  const host = document.querySelector('[data-suppression-list="' + status + '"]');
  try {
    const data = await requestAllPages('/api/contacts?status=' + status, 'contacts');
    host.replaceChildren();
    if (!data.contacts.length) { host.textContent = 'No contacts in this list.'; return; }
    for (const contact of data.contacts) {
      const row = document.createElement('div'), text = document.createElement('p'), button = document.createElement('button');
      text.textContent = contact.name + ' ? +' + contact.phone + ' ? ' + (contact.optIn?.proof || 'No reason recorded');
      button.type = 'button'; button.className = 'btn-link'; button.textContent = 'Edit contact';
      button.addEventListener('click', async () => { await loadContacts(); openContactEditModal(contact._id); });
      row.append(text, button); host.append(row);
    }
  } catch (error) { host.textContent = error.message; }
}
document.querySelectorAll('[data-suppression-form]').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = form.dataset.suppressionForm, button = form.querySelector('button[type=submit]');
  const note = document.querySelector('[data-suppression-status="' + status + '"]');
  button.disabled = true; note.textContent = 'Saving?';
  try {
    await requestJson('/api/contacts/suppress', { method: 'POST', body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), status }) });
    form.reset(); note.textContent = 'Saved. This number is excluded from sending.';
    await loadSuppressionList(status); await loadContacts();
  } catch (error) { note.textContent = error.message; }
  finally { button.disabled = false; }
}));
