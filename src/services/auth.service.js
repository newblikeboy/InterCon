const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const HttpError = require("../utils/httpError");

function normalizeSignupBody(body) {
  return {
    businessName: body.businessName || body.business_name,
    contactPerson: body.contactPerson || body.contact_person,
    email: body.email || body.businessEmail,
    whatsappNumber: body.whatsappNumber || body.whatsapp_number,
    businessGoal: body.businessGoal || body.business_size || body.goal,
    password: body.password
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  if (!payload.businessName || !payload.contactPerson || !payload.email || !payload.whatsappNumber || !payload.password) {
    throw new HttpError(400, "Business name, contact person, email, WhatsApp number, and password are required");
  }

  if (!validateEmail(payload.email)) {
    throw new HttpError(400, "Enter a valid business email");
  }

  if (payload.password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  if (payload.password.length > 128) {
    throw new HttpError(400, "Password must be 128 characters or fewer");
  }

  const normalizedEmail = payload.email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

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
        role: "owner"
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

  return {
    user,
    tenant
  };
}

async function loginCustomer(body) {
  const loginId = body.email || body.login_id;
  const password = body.password;

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

  user.lastLoginAt = new Date();
  await user.save();

  const tenant = await Tenant.findById(user.tenantId);

  return {
    user,
    tenant
  };
}

async function getAuthenticatedProfile(user) {
  const tenant = await Tenant.findById(user.tenantId);

  return {
    user,
    tenant
  };
}

module.exports = {
  signupCustomer,
  loginCustomer,
  getAuthenticatedProfile,
  publicUser
};
