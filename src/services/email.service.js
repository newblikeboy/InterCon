const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

// Brand tokens mirrored from Public/style/landing.css so emails read as part
// of the product rather than a generic transactional blast.
const BRAND = {
  ink: "#0f1e34",
  muted: "#5a6b82",
  line: "#e3e9f2",
  paper: "#ffffff",
  soft: "#f2f6fc",
  brand: "#1f6feb",
  brandDark: "#0b4aa8",
  wa: "#0f9f6e",
  gold: "#d89a24"
};

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      }
    });
  }
  return transporter;
}

// Signup values (business name, contact person) are user-supplied and land in
// an HTML email, so they must never be interpolated raw.
function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function portalUrl(hash = "") {
  const base = env.clientOrigin.replace(/\/$/, "");
  return `${base}/customer${hash}`;
}

function renderButton(href, label, background = BRAND.brand) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td align="center" bgcolor="${background}" style="border-radius:10px;">
          <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

// Email clients ignore <style> blocks inconsistently, so the shell is
// table-based with inline styles and an explicit light background (dark-mode
// clients otherwise invert the card into unreadable contrast).
function renderEmailLayout({ preheader, eyebrow, heading, bodyHtml }) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.soft};">
  <div style="display:none;font-size:1px;color:${BRAND.soft};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.soft};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;">

          <tr>
            <td style="padding:0 4px 18px;font-family:${FONT_STACK};font-size:19px;font-weight:800;color:${BRAND.ink};letter-spacing:-0.01em;">
              Inter<span style="color:${BRAND.brand};">Con</span>
            </td>
          </tr>

          <tr>
            <td bgcolor="${BRAND.paper}" style="border-radius:14px;border:1px solid ${BRAND.line};overflow:hidden;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="height:4px;background-color:${BRAND.brand};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:34px 34px 36px;">
                    ${eyebrow ? `<p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:0.09em;text-transform:uppercase;color:${BRAND.brand};">${escapeHtml(eyebrow)}</p>` : ""}
                    <h1 style="margin:0 0 16px;font-family:${FONT_STACK};font-size:25px;line-height:1.25;font-weight:800;color:${BRAND.ink};letter-spacing:-0.02em;">${escapeHtml(heading)}</h1>
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 6px 0;font-family:${FONT_STACK};font-size:12px;line-height:1.7;color:${BRAND.muted};">
              <p style="margin:0 0 6px;font-weight:700;color:${BRAND.ink};">Synqvest System LLP</p>
              <p style="margin:0 0 6px;">121-C, MIG Flats, Rajouri Garden, New Delhi - 110027</p>
              <p style="margin:0 0 12px;">
                <a href="mailto:${env.emailFrom}" style="color:${BRAND.brand};text-decoration:none;">${env.emailFrom}</a>
                &nbsp;&middot;&nbsp;
                <a href="${env.clientOrigin.replace(/\/$/, "")}/privacy-policy" style="color:${BRAND.brand};text-decoration:none;">Privacy Policy</a>
              </p>
              <p style="margin:0;color:#8b99ad;">WhatsApp and Meta are trademarks of their respective owners.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendMail({ to, subject, text, html }) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.warn(`[email] SMTP is not configured — logging email instead of sending. to=${to} subject=${subject}\n${text}`);
    return;
  }

  await activeTransporter.sendMail({
    from: `"${env.emailFromName}" <${env.emailFrom}>`,
    to,
    subject,
    text,
    html
  });
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${env.clientOrigin.replace(/\/$/, "")}/api/auth/verify-email?token=${token}`;
  const firstName = String(user.name || "there").split(" ")[0];

  const bodyHtml = `
    <p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${BRAND.ink};">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 24px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${BRAND.muted};">
      Thanks for creating your InterCon account. Confirm your email address to activate it and unlock your WhatsApp Business setup dashboard.
    </p>
    ${renderButton(verifyUrl, "Verify my email")}
    <p style="margin:14px 0 26px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.muted};">
      This link expires in 24 hours. If the button does not work, paste this address into your browser:<br>
      <a href="${verifyUrl}" style="color:${BRAND.brand};word-break:break-all;">${verifyUrl}</a>
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${BRAND.line};">
      <tr>
        <td style="padding-top:18px;font-family:${FONT_STACK};font-size:13px;line-height:1.6;color:${BRAND.muted};">
          Did not sign up for InterCon? You can safely ignore this email — no account will be activated without this confirmation.
        </td>
      </tr>
    </table>`;

  const text = `Hi ${firstName},

Thanks for creating your InterCon account. Confirm your email address to activate it and unlock your WhatsApp Business setup dashboard:

${verifyUrl}

This link expires in 24 hours.

Did not sign up for InterCon? You can safely ignore this email — no account will be activated without this confirmation.

— InterCon Support
Synqvest System LLP · ${env.emailFrom}`;

  await sendMail({
    to: user.email,
    subject: "Verify your InterCon account",
    text,
    html: renderEmailLayout({
      preheader: "Confirm your email to activate your InterCon account.",
      eyebrow: "Confirm your email",
      heading: "Verify your email address",
      bodyHtml
    })
  });
}

// Mirrors the portal's own setup checklist (getSetupSteps in
// Public/js/customer-portal.js) so the email and the dashboard never
// disagree about what comes next — including the ordering constraint that a
// paid plan must be active before templates go to Meta for review.
const ONBOARDING_STEPS = [
  {
    title: "Connect your WhatsApp Business Account",
    body: "Link your WABA and business phone number through Meta's Embedded Signup, then register the number for the Cloud API and confirm the webhook subscription.",
    hash: "#connect"
  },
  {
    title: "Add your opted-in contacts",
    body: "Import or add at least one active contact who has given WhatsApp opt-in consent. Meta requires proof of opt-in before you message anyone.",
    hash: "#contacts"
  },
  {
    title: "Activate your InterCon plan",
    body: "Choose a monthly, quarterly, or yearly plan. An active plan is required before templates can be submitted for approval or messages sent.",
    hash: "#billing"
  },
  {
    title: "Submit a message template for approval",
    body: "Create your first template and send it to Meta for review. Approval usually lands within a few hours, and you need at least one approved template to start conversations.",
    hash: "#templates"
  },
  {
    title: "Send your first WhatsApp message",
    body: "With a registered number, an opted-in contact, an active plan, and an approved template, you are ready to go live from the sender.",
    hash: "#send-whatsapp"
  }
];

function renderStepRow(step, index) {
  const number = index + 1;
  const isLast = index === ONBOARDING_STEPS.length - 1;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 ${isLast ? "4px" : "16px"};">
      <tr>
        <td width="34" valign="top" style="padding-top:2px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="26" height="26" align="center" valign="middle" bgcolor="${BRAND.soft}" style="width:26px;height:26px;border-radius:13px;font-family:${FONT_STACK};font-size:13px;font-weight:800;color:${BRAND.brandDark};">${number}</td>
            </tr>
          </table>
        </td>
        <td valign="top">
          <p style="margin:0 0 4px;font-family:${FONT_STACK};font-size:15px;font-weight:750;color:${BRAND.ink};line-height:1.4;">
            <a href="${portalUrl(step.hash)}" style="color:${BRAND.ink};text-decoration:none;">${escapeHtml(step.title)}</a>
          </p>
          <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.6;color:${BRAND.muted};">${escapeHtml(step.body)}</p>
        </td>
      </tr>
    </table>`;
}

async function sendWelcomeEmail(user, tenant = null) {
  const firstName = String(user.name || "there").split(" ")[0];
  const businessName = tenant?.businessName || "";

  const bodyHtml = `
    <p style="margin:0 0 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${BRAND.ink};">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 22px;font-family:${FONT_STACK};font-size:15px;line-height:1.65;color:${BRAND.muted};">
      Your email is verified and ${businessName ? `<strong style="color:${BRAND.ink};">${escapeHtml(businessName)}</strong> is` : "your workspace is"} live on InterCon. Here is exactly what to do next to start sending WhatsApp messages — each step links straight to the right place in your dashboard.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 26px;background-color:${BRAND.soft};border-radius:12px;">
      <tr>
        <td style="padding:22px 22px 20px;">
          <p style="margin:0 0 18px;font-family:${FONT_STACK};font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.brandDark};">Your setup checklist</p>
          ${ONBOARDING_STEPS.map(renderStepRow).join("")}
        </td>
      </tr>
    </table>

    ${renderButton(portalUrl("#connect"), "Start with step 1", BRAND.wa)}

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;border-top:1px solid ${BRAND.line};">
      <tr>
        <td style="padding-top:20px;">
          <p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:14px;font-weight:750;color:${BRAND.ink};">Need a hand?</p>
          <p style="margin:0;font-family:${FONT_STACK};font-size:14px;line-height:1.65;color:${BRAND.muted};">
            Your dashboard tracks this checklist automatically and shows what is still pending. If you get stuck on Meta verification or template approval, reply to this email and our team will walk you through it.
          </p>
        </td>
      </tr>
    </table>`;

  const textSteps = ONBOARDING_STEPS
    .map((step, index) => `${index + 1}. ${step.title}\n   ${step.body}\n   ${portalUrl(step.hash)}`)
    .join("\n\n");

  const text = `Hi ${firstName},

Your email is verified and ${businessName ? `${businessName} is` : "your workspace is"} live on InterCon. Here is exactly what to do next to start sending WhatsApp messages:

${textSteps}

Open your dashboard: ${portalUrl()}

Your dashboard tracks this checklist automatically and shows what is still pending. If you get stuck on Meta verification or template approval, reply to this email and our team will walk you through it.

— InterCon Support
Synqvest System LLP · ${env.emailFrom}`;

  await sendMail({
    to: user.email,
    subject: "Welcome to InterCon — here's your WhatsApp setup guide",
    text,
    html: renderEmailLayout({
      preheader: "Your account is active. Five steps to your first WhatsApp message.",
      eyebrow: "Account verified",
      heading: "Welcome to InterCon",
      bodyHtml
    })
  });
}

module.exports = {
  sendMail,
  sendVerificationEmail,
  sendWelcomeEmail
};
