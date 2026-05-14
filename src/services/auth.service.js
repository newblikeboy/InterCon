const bcrypt = require("bcryptjs");
const env = require("../config/env");
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

  const normalizedEmail = payload.email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new HttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);

  const tenant = await Tenant.create({
    businessName: payload.businessName,
    contactPerson: payload.contactPerson,
    businessEmail: normalizedEmail,
    whatsappNumber: payload.whatsappNumber,
    businessGoal: payload.businessGoal || ""
  });

  const user = await User.create({
    tenantId: tenant._id,
    name: payload.contactPerson,
    email: normalizedEmail,
    phone: payload.whatsappNumber,
    passwordHash,
    role: "owner"
  });

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
  }).select("+passwordHash");
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (!user.passwordHash) {
    throw new HttpError(401, "Use Facebook Login for this account");
  }

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

async function fetchFacebookJson(url, errorMessage) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(401, data.error?.message || errorMessage);
  }

  return data;
}

async function validateFacebookToken(accessToken) {
  if (!env.facebookAppId) {
    throw new HttpError(500, "FB_APP_ID is not configured");
  }

  if (!env.facebookAppSecret) {
    if (env.nodeEnv === "production") {
      throw new HttpError(500, "FB_APP_SECRET is required for Facebook Login in production");
    }

    return;
  }

  const appAccessToken = `${env.facebookAppId}|${env.facebookAppSecret}`;
  const tokenInfo = await fetchFacebookJson(
    `https://graph.facebook.com/${env.facebookSdkVersion}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appAccessToken)}`,
    "Unable to validate Facebook token"
  );

  if (!tokenInfo.data?.is_valid || String(tokenInfo.data.app_id) !== String(env.facebookAppId)) {
    throw new HttpError(401, "Invalid Facebook login token");
  }
}

async function getFacebookProfile(accessToken) {
  await validateFacebookToken(accessToken);

  const profile = await fetchFacebookJson(
    `https://graph.facebook.com/${env.facebookSdkVersion}/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`,
    "Unable to read Facebook profile"
  );

  if (!profile.id) {
    throw new HttpError(401, "Invalid Facebook profile");
  }

  return profile;
}

function resolveFacebookRedirectUri(redirectUri) {
  if (redirectUri) return redirectUri;
  if (env.facebookOAuthRedirectUri) return env.facebookOAuthRedirectUri;
  if (env.clientOrigin) return `${env.clientOrigin.replace(/\/$/, "")}/api/meta/oauth/callback`;

  throw new HttpError(400, "redirectUri is required for Facebook code exchange");
}

async function exchangeFacebookCode(code, redirectUri) {
  if (!env.facebookAppId) {
    throw new HttpError(500, "FB_APP_ID is not configured");
  }

  if (!env.facebookAppSecret) {
    throw new HttpError(500, "FB_APP_SECRET or META_APP_SECRET is not configured");
  }

  const response = await fetch(`https://graph.facebook.com/${env.facebookSdkVersion}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: env.facebookAppId,
      client_secret: env.facebookAppSecret,
      grant_type: "authorization_code",
      redirect_uri: resolveFacebookRedirectUri(redirectUri),
      code
    })
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error || !data.access_token) {
    throw new HttpError(401, data.error?.message || "Unable to exchange Facebook login code");
  }

  return data.access_token;
}

async function loginWithFacebook(body) {
  let accessToken = body.accessToken;

  if (!accessToken && body.code) {
    accessToken = await exchangeFacebookCode(body.code, body.redirectUri);
  }

  if (!accessToken) {
    throw new HttpError(400, "Facebook access token or authorization code is required");
  }

  const profile = await getFacebookProfile(accessToken);
  const payload = normalizeSignupBody(body);
  const suppliedEmail = payload.email || body.login_id;
  const normalizedEmail = suppliedEmail && validateEmail(String(suppliedEmail).trim())
    ? String(suppliedEmail).toLowerCase().trim()
    : `facebook_${profile.id}@facebook.local`;
  const lookupClauses = [{ "authProviders.facebookId": profile.id }];

  if (suppliedEmail && validateEmail(String(suppliedEmail).trim())) {
    lookupClauses.push({ email: normalizedEmail });
  }

  const existingUser = await User.findOne({ $or: lookupClauses });

  if (existingUser) {
    if (existingUser.status !== "active") {
      throw new HttpError(403, "This account is disabled");
    }

    if (!existingUser.authProviders?.facebookId) {
      existingUser.authProviders = {
        ...(existingUser.authProviders || {}),
        facebookId: profile.id
      };
    }

    existingUser.lastLoginAt = new Date();
    await existingUser.save();

    return {
      user: existingUser,
      tenant: await Tenant.findById(existingUser.tenantId),
      created: false
    };
  }

  if (!payload.businessName || !payload.whatsappNumber) {
    throw new HttpError(400, "Business name and WhatsApp number are required for Facebook signup");
  }

  const tenant = await Tenant.create({
    businessName: payload.businessName,
    contactPerson: payload.contactPerson || profile.name,
    businessEmail: normalizedEmail,
    whatsappNumber: payload.whatsappNumber,
    businessGoal: payload.businessGoal || ""
  });

  const user = await User.create({
    tenantId: tenant._id,
    name: payload.contactPerson || profile.name,
    email: normalizedEmail,
    phone: payload.whatsappNumber,
    authProviders: {
      facebookId: profile.id
    },
    role: "owner"
  });

  return {
    user,
    tenant,
    created: true
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
  loginWithFacebook,
  getAuthenticatedProfile,
  publicUser
};
