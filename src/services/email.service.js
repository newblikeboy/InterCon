const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

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

  await sendMail({
    to: user.email,
    subject: "Verify your InterCon account",
    text: `Hi ${user.name},\n\nWelcome to InterCon. Please verify your email address to activate your account:\n${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.\n\n— InterCon Support`,
    html: `<p>Hi ${user.name},</p><p>Welcome to InterCon. Please verify your email address to activate your account:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p><p>— InterCon Support</p>`
  });
}

module.exports = {
  sendMail,
  sendVerificationEmail
};
