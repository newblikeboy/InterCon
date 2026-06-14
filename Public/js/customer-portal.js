const portalMenu = document.querySelector("[data-portal-menu]");
const portalSidebar = document.querySelector("[data-portal-sidebar]");
const portalNavLinks = document.querySelectorAll(".portal-nav a");
const portalViews = document.querySelectorAll("[data-portal-view]");
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
const connectTitle = document.querySelector("[data-connect-title]");
const connectSubtitle = document.querySelector("[data-connect-subtitle]");
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
const metaRefreshPhoneButton = document.querySelector("[data-meta-refresh-phone]");
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
const templateMessage = document.querySelector("[data-template-message]");
const templateStatusList = document.querySelector("[data-template-status-list]");
const submitTemplateButtons = document.querySelectorAll("[data-submit-template]");
const sendMessageForm = document.querySelector("[data-send-message-form]");
const sendContactSelect = document.querySelector("[data-send-contact-select]");
const sendTemplateSelect = document.querySelector("[data-send-template-select]");
const sendLanguageSelect = document.querySelector("[data-send-language-select]");
const sendVariablesInput = document.querySelector("[data-send-variables]");
const sendVariableHint = document.querySelector("[data-send-variable-hint]");
const sendMessageStatus = document.querySelector("[data-send-message-status]");
const sendHistory = document.querySelector("[data-send-history]");
const refreshSendDataButton = document.querySelector("[data-refresh-send-data]");
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
const defaultPortalView = "overview";
let facebookSdkPromise;
let razorpayCheckoutPromise;
let embeddedSignupSessionInfo = null;
let embeddedSignupSessionResolvers = [];
let embeddedSignupSessionRejecters = [];
const setupState = {
  tenant: null,
  contacts: [],
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

function setTemplateMessage(message, isError = false) {
  if (!templateMessage) return;
  templateMessage.textContent = message;
  templateMessage.classList.toggle("error", isError);
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

  if (connectTitle) connectTitle.textContent = isReady ? "WhatsApp connected" : "Connect WhatsApp";
  if (connectSubtitle) {
    connectSubtitle.textContent = isReady
      ? "Tier 1: up to 250 business conversations in 24 hours."
      : "Finish only the items that affect sending from this WhatsApp number.";
  }
  if (metaConnectState) {
    metaConnectState.textContent = isReady ? "Ready" : hasPartialMetaConnection ? "Needs action" : "Not connected";
    metaConnectState.classList.toggle("approved", isReady);
    metaConnectState.classList.toggle("warning", !isReady);
  }

  connectWhatsAppButtons.forEach((button) => {
    if (isMetaConnected) {
      button.hidden = true;
      return;
    }

    button.hidden = false;
    button.textContent = hasPartialMetaConnection ? "Finish Meta setup" : "Connect with Meta";
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
  if (window.FB) {
    return window.FB;
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
        resolve({
          FB: window.FB,
          config
        });
      };

      const existingScript = document.getElementById("facebook-jssdk");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve({ FB: window.FB, config }));
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

function launchEmbeddedSignup(FB, config) {
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

  const extras = getEmbeddedSignupExtras(config);

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

function getEmbeddedSignupExtras(config) {
  const configuredExtras = config.loginExtras && typeof config.loginExtras === "object"
    ? config.loginExtras
    : {};
  const extras = {
    ...configuredExtras,
    setup: configuredExtras.setup && typeof configuredExtras.setup === "object" ? configuredExtras.setup : {},
    sessionInfoVersion: "3"
  };

  if (!Object.prototype.hasOwnProperty.call(extras, "featureType")) {
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
  const businessLimited = Boolean(meta.businessHealthError) || meta.businessHealthStatus === "blocked";

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
  } else if (isMetaConnected && meta.connectedAt) {
    setMetaConnectMessage(`Connected ${new Date(meta.connectedAt).toLocaleString()}. Tier 1: 250 conversations / 24h.`);
  } else if (meta.lastSignupError) {
    setMetaConnectMessage(meta.lastSignupError, true);
  } else if (hasPartialMetaConnection) {
    setMetaConnectMessage("Meta signup was saved, but the WhatsApp phone number is not connected yet. Complete phone number selection or verification in Meta and connect again.", true);
  }

  renderSetupProgress();
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
    return;
  }

  const options = [
    `<option value="">Select approved template</option>`,
    ...templates.map((template) => (
      `<option value="${escapeHtml(template.name)}" data-category="${escapeHtml(template.category)}" data-language="${escapeHtml(template.language)}" data-parameter-count="${Number(template.parameterCount || 0)}">${escapeHtml(template.name)} - ${escapeHtml(template.category)} (${escapeHtml(template.language)})</option>`
    ))
  ].join("");

  sendTemplateSelect.disabled = false;
  sendTemplateSelect.innerHTML = options;
  updateSendVariableHint();
}

async function loadApprovedTemplates() {
  if (!sendTemplateSelect) return;
  const data = await requestJson("/api/templates/approved");
  renderApprovedTemplateOptions(data.templates || []);
}

function updateSendVariableHint() {
  if (!sendTemplateSelect || !sendVariableHint) return;

  const selectedOption = sendTemplateSelect.selectedOptions?.[0];
  const parameterCount = Number(selectedOption?.dataset.parameterCount || 0);
  const language = selectedOption?.dataset.language || "";

  if (sendLanguageSelect && language) {
    sendLanguageSelect.value = language;
  }

  if (!sendTemplateSelect.value) {
    sendVariableHint.textContent = "Select a template to see required variables.";
    if (sendVariablesInput) sendVariablesInput.placeholder = "Aashish, ORD1234, confirmed";
    return;
  }

  if (!parameterCount) {
    sendVariableHint.textContent = "This template has no body variables. Leave Variables empty.";
    if (sendVariablesInput) sendVariablesInput.placeholder = "Leave empty";
    return;
  }

  const examples = Array.from({ length: parameterCount }, (_, index) => `value ${index + 1}`);
  sendVariableHint.textContent = `This template requires ${parameterCount} body variable${parameterCount === 1 ? "" : "s"}. Enter exactly ${parameterCount} comma-separated value${parameterCount === 1 ? "" : "s"}.`;
  if (sendVariablesInput) sendVariablesInput.placeholder = examples.join(", ");
}

function renderTemplateStatusRows(templates) {
  if (!templateStatusList) return;

  const header = `
    <div class="table-row table-head">
      <span>Name</span><span>Category</span><span>Status</span><span>Reason</span>
    </div>
  `;

  if (!templates.length) {
    templateStatusList.innerHTML = `${header}<div class="empty-row">No templates submitted yet.</div>`;
    return;
  }

  templateStatusList.innerHTML = header + templates.map((template) => {
    const statusClass = template.status === "approved"
      ? "approved"
      : ["rejected", "disabled"].includes(template.status)
        ? "rejected"
        : "pending";

    return `
      <div class="table-row">
        <strong>${template.name}</strong>
        <span>${template.category}</span>
        <em class="${statusClass}">${template.status}</em>
        <span>${template.rejectedReason || template.language || "-"}</span>
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
      <strong>${message.to}</strong>
      <span>${message.templateName}</span>
      <em class="${message.status === "failed" ? "rejected" : "approved"}">${message.status}</em>
      <span>${new Date(message.createdAt).toLocaleString()}</span>
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
        <span>${escapeHtml(apiKey.maskedKey)}</span>
        <em class="${isActive ? "approved" : "rejected"}">${escapeHtml(apiKey.status)}</em>
        <span>${apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt).toLocaleString() : "Never"}</span>
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
    variableSamples: templateSamplesInput?.value || ""
  };
}

const templatePresets = {
  order_update: {
    name: "order_update",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your order {{2}} has been shipped and will arrive by {{3}}.",
    samples: "{{1}} = Aashish, {{2}} = ORD1234, {{3}} = 12 Jun"
  },
  appointment_reminder: {
    name: "appointment_reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, this is a reminder for your appointment on {{2}} at {{3}}.",
    samples: "{{1}} = Aashish, {{2}} = 12 Jun, {{3}} = 10:00 AM"
  },
  payment_reminder: {
    name: "payment_reminder",
    category: "utility",
    language: "en_US",
    body: "Hi {{1}}, your payment of {{2}} is due on {{3}}.",
    samples: "{{1}} = Aashish, {{2}} = Rs 100, {{3}} = 12 Jun"
  },
  offer_update: {
    name: "offer_update",
    category: "marketing",
    language: "en_US",
    body: "Hi {{1}}, your exclusive offer is active until {{2}}. Reply STOP to opt out.",
    samples: "{{1}} = Aashish, {{2}} = 12 Jun"
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
  setTemplateMessage("");
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

connectWhatsAppButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Opening Meta...";

    try {
      const { FB, config } = await loadFacebookSdk();
      if (!config.loginConfigId) {
        throw new Error("Meta Embedded Signup configuration ID is missing");
      }

      embeddedSignupSessionInfo = null;
      setMetaConnectMessage("Complete the Meta popup to connect your WhatsApp account.");
      const loginResponse = await launchEmbeddedSignup(FB, config);
      const code = loginResponse.authResponse?.code;

      if (!code) {
        throw new Error(getMetaLoginFailureMessage(loginResponse));
      }

      const sessionInfo = await waitForEmbeddedSignupSessionInfo();

      const result = await requestJson("/api/meta/embedded-signup/complete", {
        method: "POST",
        body: JSON.stringify({
          code,
          sessionInfo
        })
      });

      renderOnboardingStatus(result.tenant);
      if (result.tenant?.onboardingStatus === "meta_connected" && result.tenant?.meta?.phoneNumberId) {
        if (result.meta?.phoneRegistration?.success) {
          setMetaConnectMessage("WhatsApp account connected and phone registered for Cloud API.");
        } else if (result.meta?.phoneRegistration) {
          setMetaConnectMessage(`WhatsApp account connected. Phone registration needs attention: ${result.meta.phoneRegistration.message}`, true);
        } else {
          setMetaConnectMessage("WhatsApp account connected.");
        }
      }
    } catch (error) {
      setMetaConnectMessage(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });
});

if (metaRefreshPhoneButton) {
  metaRefreshPhoneButton.addEventListener("click", async () => {
    metaRefreshPhoneButton.disabled = true;
    try {
      await refreshPhoneStatus();
    } catch (error) {
      setMetaConnectMessage(error.message, true);
    } finally {
      metaRefreshPhoneButton.disabled = false;
    }
  });
}

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

    try {
      if (!requirePaidPlanBeforeAction(setSendMessage)) return;

      setSendMessage("Queueing WhatsApp message...");
      await requestJson("/api/messages/send-template", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      sendMessageForm.reset();
      updateSendVariableHint();
      await loadSendHistory();
      setSendMessage("WhatsApp message queued. Delivery status will update automatically.");
    } catch (error) {
      setSendMessage(getSendFailureMessage(error), true);
      if (Number(error.details?.code || error.details?.error_subcode) === 131037 || String(error.message || "").toLowerCase().includes("display name approval")) {
        await loadOnboardingStatus().catch(() => null);
      }
    }
  });
}

if (sendTemplateSelect) {
  sendTemplateSelect.addEventListener("change", updateSendVariableHint);
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

if (templatePresetSelect) {
  templatePresetSelect.addEventListener("change", () => {
    applyTemplatePreset(templatePresetSelect.value);
  });
  applyTemplatePreset(templatePresetSelect.value || "order_update");
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

showPortalView(getInitialViewId(), true);
renderApiBaseUrl();
loadAuthenticatedProfile().catch(() => renderAuthenticatedProfile());
loadOnboardingStatus().catch((error) => setMetaConnectMessage(error.message, true));
loadBilling().catch((error) => {
  if (billingMessage) {
    billingMessage.textContent = error.message;
    billingMessage.classList.add("error");
  }
});
loadContacts().catch((error) => setContactMessage(error.message, true));
loadApprovedTemplates().catch((error) => setSendMessage(error.message, true));
loadTemplates().catch((error) => setTemplateMessage(error.message, true));
loadSendHistory().catch((error) => setSendMessage(error.message, true));
loadApiKeys().catch((error) => setApiMessage(error.message, true));
