/* ==========================================================================
   InterCon Admin Console
   - Mobile menu toggle
   - Hash-based SPA router: launcher cards -> deep-linkable detail views
   ========================================================================== */

const portalMenu = document.querySelector("[data-portal-menu]");
const portalSidebar = document.querySelector("[data-portal-sidebar]");
const railLinks = document.querySelectorAll(".console-rail-nav a");
const homeView = document.getElementById("home");
const detailView = document.getElementById("detail-view");
const detailHost = document.querySelector("[data-detail-host]");

const STORAGE_KEY = "intercon_admin_console_view";
const DEFAULT_VIEW = "home";

/* Top-level groups also act as scroll anchors inside the launcher. */
const GROUPS = {
  channels: "Channels & Templates",
  contacts: "Customers & Contacts",
  messaging: "Messaging & Growth",
  account: "Account & Platform"
};

/* Every launcher card maps to a detail view here. `related` builds real
   in-app cross-links so the console is genuinely navigable. */
const FEATURES = {
  waba: {
    group: "channels",
    title: "WABA Channels",
    summary: "Connect WhatsApp Business Accounts and keep every channel healthy.",
    tasks: [
      "Review connected WABA IDs, phone number IDs, and display names.",
      "Watch quality rating, messaging tier, and token expiry.",
      "Reconnect or refresh phone registration when status drops."
    ],
    related: ["onboarding", "webhooks", "templates"]
  },
  onboarding: {
    group: "channels",
    title: "Onboarding Monitor",
    summary: "Track every Embedded Signup session from start to live messaging.",
    tasks: [
      "See who started signup and who returned WABA + phone details.",
      "Spot customers blocked on Meta payment setup.",
      "Re-open failed sessions before they churn."
    ],
    related: ["waba", "customers", "support"]
  },
  templates: {
    group: "channels",
    title: "Manage Templates",
    summary: "Monitor template approvals, rejections, and quality across customers.",
    tasks: [
      "Review pending submissions and rejection reasons.",
      "Track category changes and quality warnings.",
      "Audit which templates customers actually send."
    ],
    related: ["library", "media", "campaigns"]
  },
  library: {
    group: "channels",
    title: "Template Library",
    summary: "Browse the catalogue of approved, reusable templates.",
    tasks: [
      "Find approved templates by category and language.",
      "Promote high-performing templates to customers.",
      "Retire templates that breach policy."
    ],
    related: ["templates", "media"]
  },
  media: {
    group: "channels",
    title: "Media Library",
    summary: "Manage images, video, and documents used in messaging.",
    tasks: [
      "Review uploaded media and storage usage.",
      "Replace expired media handles.",
      "Remove assets that violate policy."
    ],
    related: ["templates", "library"]
  },
  customers: {
    group: "contacts",
    title: "Customers",
    summary: "Monitor every account from signup to live WhatsApp messaging.",
    tasks: [
      "See plan, status, and connection health per account.",
      "Flag accounts missing a payment method.",
      "Add internal notes for the support team."
    ],
    related: ["onboarding", "billing", "support"]
  },
  groups: {
    group: "contacts",
    title: "Manage Groups",
    summary: "Organise contacts into segments for targeted messaging.",
    tasks: [
      "Create and edit contact segments.",
      "Review segment sizes before a campaign.",
      "Keep groups clean of opted-out numbers."
    ],
    related: ["customers", "unsubscribers", "campaigns"]
  },
  unsubscribers: {
    group: "contacts",
    title: "Unsubscribers",
    summary: "View and manage numbers that opted out of messaging.",
    tasks: [
      "Audit recent opt-outs and the campaigns that triggered them.",
      "Ensure unsubscribers are excluded from new sends.",
      "Export opt-out lists for compliance."
    ],
    related: ["blacklist", "groups", "campaigns"]
  },
  blacklist: {
    group: "contacts",
    title: "Blacklist Numbers",
    summary: "Block specific numbers for better delivery control.",
    tasks: [
      "Add numbers that should never be messaged.",
      "Review blocks that are driving delivery failures.",
      "Remove numbers that were blocked in error."
    ],
    related: ["unsubscribers", "webhooks"]
  },
  campaigns: {
    group: "messaging",
    title: "Campaigns",
    summary: "Watch the campaign queue, delivery, and throttling in real time.",
    tasks: [
      "Track queued, sending, and failed campaigns.",
      "Spot opt-out spikes and suspicious volume.",
      "Throttle or pause risky sends."
    ],
    related: ["templates", "automation", "reports"]
  },
  automation: {
    group: "messaging",
    title: "Automation Flows",
    summary: "Build and monitor auto-reply journeys across customers.",
    tasks: [
      "Review active flows and their triggers.",
      "Check delivery and drop-off at each step.",
      "Disable flows that misfire."
    ],
    related: ["campaigns", "webhooks", "templates"]
  },
  webhooks: {
    group: "messaging",
    title: "Webhook Health",
    summary: "Track inbound events, retries, duplicates, and latency.",
    tasks: [
      "Monitor message and status callbacks.",
      "Investigate retries and duplicate events.",
      "Confirm processing latency stays in budget."
    ],
    related: ["waba", "automation", "reports"]
  },
  reports: {
    group: "messaging",
    title: "Reports",
    summary: "Usage, delivery, and revenue analytics across the platform.",
    tasks: [
      "Review message volume and delivery rates.",
      "Compare usage against plan limits.",
      "Export reports for billing and review."
    ],
    related: ["campaigns", "billing", "webhooks"]
  },
  billing: {
    group: "account",
    title: "Billing",
    summary: "Plans, invoices, wallets, and the usage ledger.",
    tasks: [
      "Track active plans and failed payments.",
      "Reconcile the usage ledger against invoices.",
      "Review wallet balances per customer."
    ],
    related: ["customers", "reports", "settings"]
  },
  support: {
    group: "account",
    title: "Support",
    summary: "Handle tickets, escalations, and customer issues.",
    tasks: [
      "Triage failed onboarding and delivery problems.",
      "Resolve template rejections and billing issues.",
      "Escalate webhook errors to engineering."
    ],
    related: ["customers", "onboarding", "webhooks"]
  },
  api: {
    group: "account",
    title: "API Keys",
    summary: "Manage developer keys and programmatic access.",
    tasks: [
      "Review issued keys and last-used activity.",
      "Rotate or revoke compromised keys.",
      "Scope access to the right customers."
    ],
    related: ["settings", "webhooks"]
  },
  settings: {
    group: "account",
    title: "Settings",
    summary: "Meta app config, plan limits, alert rules, and permissions.",
    tasks: [
      "Manage the Meta app and webhook endpoint.",
      "Tune plan limits and alert thresholds.",
      "Control admin roles and permissions."
    ],
    related: ["api", "billing"]
  }
};

/* --- Mobile menu --------------------------------------------------------- */
function closePortalMenu() {
  document.body.classList.remove("portal-menu-open");
  if (portalMenu) portalMenu.setAttribute("aria-expanded", "false");
}

if (portalMenu) {
  portalMenu.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("portal-menu-open");
    portalMenu.setAttribute("aria-expanded", String(isOpen));
  });
}

document.addEventListener("click", (event) => {
  if (!document.body.classList.contains("portal-menu-open")) return;
  const insideSidebar = portalSidebar && portalSidebar.contains(event.target);
  const onMenu = portalMenu && portalMenu.contains(event.target);
  if (!insideSidebar && !onMenu) closePortalMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("portal-menu-open")) {
    closePortalMenu();
  }
});

/* --- Router -------------------------------------------------------------- */
function railHasHref(id) {
  return Array.from(railLinks).some((link) => link.getAttribute("href") === `#${id}`);
}

function setRailActive(key) {
  railLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${key}`);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function renderDetail(id, feature) {
  const groupLabel = GROUPS[feature.group] || "";
  const tasks = feature.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("");
  const related = (feature.related || [])
    .filter((relatedId) => FEATURES[relatedId])
    .map((relatedId) => `<a class="admin-chip" href="#${relatedId}">${escapeHtml(FEATURES[relatedId].title)}</a>`)
    .join("");

  detailHost.innerHTML = `
    <header class="admin-detail-head">
      <p class="eyebrow">${escapeHtml(groupLabel)}</p>
      <h1>${escapeHtml(feature.title)}</h1>
      <p class="admin-detail-summary">${escapeHtml(feature.summary)}</p>
    </header>
    <div class="admin-detail-grid">
      <article class="admin-panel">
        <h2>What you'll do here</h2>
        <ul class="admin-task-list">${tasks}</ul>
      </article>
      ${related ? `<aside class="admin-panel admin-related">
        <h2>Related</h2>
        <div class="admin-chips">${related}</div>
      </aside>` : ""}
    </div>`;
}

function showHome(scrollGroup) {
  if (detailView) detailView.hidden = true;
  if (homeView) homeView.hidden = false;
  setRailActive(scrollGroup || "home");
  closePortalMenu();

  if (scrollGroup) {
    const target = document.getElementById(scrollGroup);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } else {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function showDetail(id) {
  const feature = FEATURES[id];
  renderDetail(id, feature);
  if (homeView) homeView.hidden = true;
  if (detailView) detailView.hidden = false;
  setRailActive(railHasHref(id) ? id : feature.group);
  closePortalMenu();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function route(persist = true) {
  const id = window.location.hash.replace("#", "") || DEFAULT_VIEW;

  if (id === "home") {
    showHome(null);
  } else if (GROUPS[id]) {
    showHome(id);
  } else if (FEATURES[id]) {
    showDetail(id);
  } else {
    showHome(null);
    if (persist) {
      history.replaceState(null, "", `#${DEFAULT_VIEW}`);
    }
    return;
  }

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (error) {
      /* storage may be unavailable (private mode) — navigation still works */
    }
  }
}

window.addEventListener("hashchange", () => route(true));

/* Restore last view on load when no explicit hash is present. */
(function initRoute() {
  if (!window.location.hash) {
    let stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      stored = null;
    }
    if (stored && (stored === "home" || GROUPS[stored] || FEATURES[stored])) {
      history.replaceState(null, "", `#${stored}`);
    }
  }
  route(false);
})();
