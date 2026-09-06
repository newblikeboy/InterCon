const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const HttpError = require("../utils/httpError");
const env = require("../config/env");
const emailService = require("./email.service");

function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + env.emailVerificationTokenTtlMs);
  return { token, tokenHash, expires };
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSignupBody(body = {}) {
  const confirmPassword = firstDefined(body.confirmPassword, body.confirm_password);

  return {
    businessName: normalizeText(firstDefined(body.businessName, body.business_name)),
    contactPerson: normalizeText(firstDefined(body.contactPerson, body.contact_person)),
    email: normalizeText(firstDefined(body.email, body.businessEmail)),
    whatsappNumber: normalizeText(firstDefined(body.mobileNumber, body.mobile_number, body.whatsappNumber, body.whatsapp_number)),
    businessGoal: normalizeText(firstDefined(body.businessGoal, body.business_size, body.goal)),
    password: typeof body.password === "string" ? body.password : "",
    confirmPassword: typeof confirmPassword === "string" ? confirmPassword : ""
  };
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateMobileNumber(number) {
  return typeof number === "string" && /^\d{10}$/.test(number);
}

function validatePasswordStrength(password) {
  return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

function publicUser(user, tenant = null) {
  return {
    id: user._id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    tenant: tenant
      ? {
          id: tenant._id,
          businessName: tenant.businessName,
          whatsappNumber: tenant.whatsappNumber,
          onboardingStatus: tenant.onboardingStatus,
          status: tenant.status,
          meta: {
            businessId: tenant.meta?.businessId,
            wabaId: tenant.meta?.wabaId,
            phoneNumberId: tenant.meta?.phoneNumberId,
            connectedAt: tenant.meta?.connectedAt,
            lastSignupEvent: tenant.meta?.lastSignupEvent,
            lastSignupError: tenant.meta?.lastSignupError
          },
          billing: {
            plan: tenant.billing?.plan || "none",
            status: tenant.billing?.status || "not_started",
            amount: tenant.billing?.amount || 0,
            currency: tenant.billing?.currency || "INR",
            selectedAt: tenant.billing?.selectedAt,
            activatedAt: tenant.billing?.activatedAt,
            currentPeriodEnd: tenant.billing?.currentPeriodEnd
          }
        }
      : undefined
  };
}

async function signupCustomer(body) {
  const payload = normalizeSignupBody(body);

  if (!payload.businessName || !payload.contactPerson || !payload.email || !payload.whatsappNumber || !payload.password || !payload.confirmPassword) {
    throw new HttpError(400, "Business name, contact person name, email, mobile number, password, and confirm password are required");
  }

  if (!validateEmail(payload.email)) {
    throw new HttpError(400, "Enter a valid email address");
  }

  if (!validateMobileNumber(payload.whatsappNumber)) {
    throw new HttpError(400, "Enter a 10-digit mobile number using numbers only");
  }

  if (typeof payload.password !== "string" || payload.password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  if (payload.password.length > 128) {
    throw new HttpError(400, "Password must be 128 characters or fewer");
  }
  if (!validatePasswordStrength(payload.password)) {
    throw new HttpError(400, "Password must include at least one letter and one number");
  }
  if (payload.password !== payload.confirmPassword) {
    throw new HttpError(400, "Password and confirm password do not match");
  }

  const normalizedEmail = payload.email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const { token, tokenHash, expires } = generateVerificationToken();

  const session = await mongoose.startSession();
  let tenant;
  let user;
  try {
    await session.withTransaction(async () => {
      [tenant] = await Tenant.create([{
        businessName: payload.businessName,
        contactPerson: payload.contactPerson,
        businessEmail: normalizedEmail,
        whatsappNumber: payload.whatsappNumber,
        businessGoal: payload.businessGoal || ""
      }], { session });

      [user] = await User.create([{
        tenantId: tenant._id,
        name: payload.contactPerson,
        email: normalizedEmail,
        phone: payload.whatsappNumber,
        passwordHash,
        role: "owner",
        isVerified: false,
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: expires,
        emailVerificationSentAt: new Date()
      }], { session });
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, "An account with this email already exists");
    }
    throw error;
  } finally {
    await session.endSession();
  }

  try {
    await emailService.sendVerificationEmail(user, token);
  } catch (error) {
    console.error("[auth] Failed to send verification email:", error.message);
  }

  return {
    user,
    tenant
  };
}

async function loginCustomer(body) {
  const loginId = body.email || body.login_id;
  const password = body.password;
  if (typeof password !== "string" || password.length > 128) throw new HttpError(400, "Enter a valid password");

  if (!loginId || !password) {
    throw new HttpError(400, "Email and password are required");
  }

  const normalizedLoginId = String(loginId).toLowerCase().trim();
  const user = await User.findOne({
    $or: [
      { email: normalizedLoginId },
      { phone: String(loginId).trim() }
    ]
  }).select("+passwordHash +sessionVersion");
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.passwordHash) throw new HttpError(401, "Invalid email or password");

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (user.status !== "active") {
    throw new HttpError(403, "This account is disabled");
  }

  if (!user.isVerified) {
    throw new HttpError(403, "Please verify your email before logging in. Check your inbox or resend the verification email.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tenant = await Tenant.findById(user.tenantId);

  return {
    user,
    tenant
  };
}

async function verifyEmail(rawToken) {
  if (!rawToken || typeof rawToken !== "string") {
    throw new HttpError(400, "Verification token is required");
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpires: { $gt: new Date() }
  }).select("+emailVerificationTokenHash +emailVerificationExpires");

  if (!user) {
    throw new HttpError(400, "This verification link is invalid or has expired");
  }

  user.isVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  // The welcome guide is a nice-to-have; a mail failure must never turn a
  // successful verification into an "invalid link" page for the user.
  try {
    const tenant = await Tenant.findById(user.tenantId);
    await emailService.sendWelcomeEmail(user, tenant);
  } catch (error) {
    console.error("[auth] Failed to send welcome email:", error.message);
  }

  return { user };
}

async function resendVerificationEmail(identifier) {
  const generic = { message: "If an account matches, a verification email has been sent." };
  if (!identifier) return generic;

  const normalizedIdentifier = String(identifier).toLowerCase().trim();
  const user = await User.findOne({
    $or: [
      { email: normalizedIdentifier },
      { phone: String(identifier).trim() }
    ]
  }).select("+emailVerificationSentAt");

  if (!user || user.isVerified) {
    return generic;
  }

  // Enforce the resend cooldown server-side, but keep the response identical
  // either way: a distinct "wait 30 seconds" reply would reveal that this
  // email belongs to a real unverified account, which is exactly what the
  // generic message exists to hide.
  const lastSentAt = user.emailVerificationSentAt?.getTime();
  if (lastSentAt && Date.now() - lastSentAt < env.emailVerificationResendCooldownMs) {
    return generic;
  }

  const { token, tokenHash, expires } = generateVerificationToken();
  user.emailVerificationTokenHash = tokenHash;
  user.emailVerificationExpires = expires;
  user.emailVerificationSentAt = new Date();
  await user.save();

  try {
    await emailService.sendVerificationEmail(user, token);
  } catch (error) {
    console.error("[auth] Failed to resend verification email:", error.message);
  }

  return generic;
}

function dispatchPasswordResetEmail(user, token) {
  emailService.sendPasswordResetEmail(user, token)
    .catch((error) => console.error("Password reset email failed:", error.message));
}

async function requestPasswordReset(identifier) {
  const generic = { message: "If this email belongs to an active account, a password reset link will arrive shortly." };
  const email = String(identifier || "").trim().toLowerCase();
  if (!validateEmail(email)) return generic;
  const token = crypto.randomBytes(32).toString("hex");
  const user = await User.findOneAndUpdate({
    email, status: "active", isVerified: true,
    $or: [{ passwordResetSentAt: { $exists: false } }, { passwordResetSentAt: { $lt: new Date(Date.now() - 60000) } }]
  }, { $set: {
    passwordResetHash: crypto.createHash("sha256").update(token).digest("hex"),
    passwordResetExpires: new Date(Date.now() + 30 * 60000), passwordResetSentAt: new Date()
  } }, { returnDocument: "after" });
  if (user) dispatchPasswordResetEmail(user, token);
  return generic;
}

async function resetPassword(body = {}) {
  if (!/^[a-f0-9]{64}$/.test(String(body.token || ""))) throw new HttpError(400, "This reset link is invalid or has expired");
  if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128 || !validatePasswordStrength(body.password)) throw new HttpError(400, "Use 8 to 128 characters including a letter and a number");
  if (body.password !== body.confirm_password) throw new HttpError(400, "The passwords do not match");
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await User.findOneAndUpdate({
    passwordResetHash: crypto.createHash("sha256").update(body.token).digest("hex"),
    passwordResetExpires: { $gt: new Date() }, status: "active", isVerified: true
  }, { $set: { passwordHash }, $inc: { sessionVersion: 1 }, $unset: { passwordResetHash: "", passwordResetExpires: "" } });
  if (!user) throw new HttpError(400, "This reset link is invalid or has expired");
  await require("./sessionCache.service").invalidateUser(user._id);
  return { message: "Password changed. Please log in with your new password." };
}

async function getAuthenticatedProfile(user) {
  const tenant = await Tenant.findById(user.tenantId);

  return {
    user,
    tenant
  };
}

module.exports = {
  requestPasswordReset,
  resetPassword,
  signupCustomer,
  loginCustomer,
  verifyEmail,
  resendVerificationEmail,
  getAuthenticatedProfile,
  publicUser
};
