const env = require("../config/env");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");

function getEmbeddedSignupUrl() {
  if (!env.embeddedSignupUrl) {
    throw new HttpError(500, "EMBED_SIGN_UP is not configured");
  }

  return env.embeddedSignupUrl;
}

function getFacebookSdkConfig() {
  if (!env.facebookAppId) {
    throw new HttpError(500, "FB_APP_ID is not configured");
  }

  let embeddedSignupConfigId = "";
  let embeddedSignupExtras = null;

  if (env.embeddedSignupUrl) {
    const parsedUrl = new URL(env.embeddedSignupUrl);
    embeddedSignupConfigId = parsedUrl.searchParams.get("config_id") || "";

    try {
      const extras = parsedUrl.searchParams.get("extras");
      embeddedSignupExtras = extras ? JSON.parse(extras) : null;
    } catch (error) {
      embeddedSignupExtras = null;
    }
  }

  return {
    appId: env.facebookAppId,
    version: env.facebookSdkVersion,
    redirectUri: env.facebookOAuthRedirectUri || (env.clientOrigin ? `${env.clientOrigin.replace(/\/$/, "")}/api/meta/oauth/callback` : ""),
    loginConfigId: env.facebookLoginConfigId || embeddedSignupConfigId,
    loginExtras: embeddedSignupExtras
  };
}

function resolveOAuthRedirectUri(redirectUri, requestUrl) {
  if (redirectUri) return redirectUri;
  if (env.facebookOAuthRedirectUri) return env.facebookOAuthRedirectUri;

  if (requestUrl) {
    const parsedUrl = new URL(requestUrl);
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString();
  }

  if (env.clientOrigin) {
    return `${env.clientOrigin.replace(/\/$/, "")}/api/meta/oauth/callback`;
  }

  throw new HttpError(400, "redirectUri is required for OAuth code exchange");
}

function getFacebookAppSecret() {
  return env.facebookAppSecret || env.metaAppSecret;
}

function publicToken(tokenData) {
  const accessToken = tokenData.access_token || "";

  return {
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    tokenStored: Boolean(accessToken)
  };
}

function publicTenant(tenant) {
  return {
    id: tenant._id,
    businessName: tenant.businessName,
    onboardingStatus: tenant.onboardingStatus,
    status: tenant.status,
    meta: {
      businessId: tenant.meta?.businessId,
      wabaId: tenant.meta?.wabaId,
      phoneNumberId: tenant.meta?.phoneNumberId,
      displayPhoneNumber: tenant.meta?.displayPhoneNumber,
      phoneStatus: tenant.meta?.phoneStatus,
      accountMode: tenant.meta?.accountMode,
      codeVerificationStatus: tenant.meta?.codeVerificationStatus,
      appId: tenant.meta?.appId,
      tokenType: tenant.meta?.tokenType,
      tokenExpiresAt: tenant.meta?.tokenExpiresAt,
      connectedAt: tenant.meta?.connectedAt,
      signupSessionId: tenant.meta?.signupSessionId,
      lastSignupEvent: tenant.meta?.lastSignupEvent,
      lastSignupError: tenant.meta?.lastSignupError,
      lastPhoneSetupError: tenant.meta?.lastPhoneSetupError
    }
  };
}

function parseSessionInfo(sessionInfo) {
  if (!sessionInfo) return {};

  let parsed = sessionInfo;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      return {};
    }
  }

  const data = parsed.data || parsed;

  return {
    event: parsed.event || data.event,
    sessionId: data.session_id || data.sessionId || parsed.session_id || parsed.sessionId,
    businessId: data.business_id || data.businessId || data.business?.id || parsed.business_id || parsed.businessId,
    wabaId: data.waba_id || data.wabaId || data.whatsapp_business_account_id || data.whatsappBusinessAccountId || parsed.waba_id || parsed.wabaId,
    phoneNumberId: data.phone_number_id || data.phoneNumberId || data.phone?.id || parsed.phone_number_id || parsed.phoneNumberId,
    errorMessage: data.error_message || data.errorMessage || parsed.error_message || parsed.errorMessage
  };
}

async function exchangeCodeForToken({ code, redirectUri, requestUrl }) {
  if (!code) {
    throw new HttpError(400, "OAuth code is required");
  }

  if (!env.facebookAppId) {
    throw new HttpError(500, "FB_APP_ID is not configured");
  }

  const appSecret = getFacebookAppSecret();
  if (!appSecret) {
    throw new HttpError(500, "FB_APP_SECRET or META_APP_SECRET is not configured");
  }

  const resolvedRedirectUri = resolveOAuthRedirectUri(redirectUri, requestUrl);
  const tokenUrl = `https://graph.facebook.com/${env.facebookSdkVersion}/oauth/access_token`;
  const params = new URLSearchParams({
    client_id: env.facebookAppId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: resolvedRedirectUri,
    code
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const tokenData = await response.json().catch(() => ({}));

  if (!response.ok || tokenData.error) {
    throw new HttpError(400, tokenData.error?.message || "Unable to exchange OAuth code");
  }

  return tokenData;
}

async function fetchMetaJson(path, accessToken, options = {}) {
  const response = await fetch(`https://graph.facebook.com/${env.metaGraphApiVersion}/${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(response.status || 400, data.error?.message || "Meta API request failed", data.error || data);
  }

  return data;
}

async function subscribeAppToWaba(wabaId, accessToken) {
  if (!wabaId || !accessToken) return null;

  return fetchMetaJson(`${wabaId}/subscribed_apps`, accessToken, {
    method: "POST",
    body: JSON.stringify({})
  });
}

function requireConfiguredRegistrationPin() {
  if (!env.facebookRegistrationPin) {
    throw new HttpError(500, "FB_REG_PIN is not configured");
  }
}

async function getTenantWithMetaToken(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  const accessToken = tenant?.getMetaAccessToken();

  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  if (!tenant.meta?.wabaId || !tenant.meta?.phoneNumberId || !accessToken) {
    throw new HttpError(409, "Connect WhatsApp first. WABA ID, phone number ID, and Meta access token are required.");
  }

  return {
    tenant,
    accessToken
  };
}

function publicPhoneDetails(data = {}) {
  return {
    id: data.id,
    displayPhoneNumber: data.display_phone_number || data.displayPhoneNumber || "",
    status: data.status || "",
    accountMode: data.account_mode || data.accountMode || "",
    codeVerificationStatus: data.code_verification_status || data.codeVerificationStatus || "",
    verifiedName: data.verified_name || data.verifiedName || ""
  };
}

async function savePhoneDetails(tenantId, details, error = "") {
  const update = {
    ...(details.displayPhoneNumber ? { "meta.displayPhoneNumber": details.displayPhoneNumber } : {}),
    ...(details.status ? { "meta.phoneStatus": details.status } : {}),
    ...(details.accountMode ? { "meta.accountMode": details.accountMode } : {}),
    ...(details.codeVerificationStatus ? { "meta.codeVerificationStatus": details.codeVerificationStatus } : {}),
    "meta.lastPhoneSetupError": error
  };

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { $set: update },
    { new: true }
  );

  return tenant ? publicTenant(tenant) : null;
}

async function getPhoneNumberStatus(tenantId) {
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  const data = await fetchMetaJson(
    `${tenant.meta.phoneNumberId}?fields=status,account_mode,display_phone_number,code_verification_status,verified_name`,
    accessToken
  );
  const details = publicPhoneDetails(data);
  const updatedTenant = await savePhoneDetails(tenantId, details);

  return {
    tenant: updatedTenant,
    phone: details
  };
}

async function requestPhoneVerificationCode(tenantId, body = {}) {
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  const codeMethod = String(body.codeMethod || body.code_method || "SMS").toUpperCase();
  const language = String(body.language || "en").trim() || "en";

  if (!["SMS", "VOICE"].includes(codeMethod)) {
    throw new HttpError(400, "Verification code method must be SMS or VOICE");
  }

  const result = await fetchMetaJson(
    `${tenant.meta.phoneNumberId}/request_code?code_method=${encodeURIComponent(codeMethod)}&language=${encodeURIComponent(language)}`,
    accessToken,
    { method: "POST", body: JSON.stringify({}) }
  );

  return {
    phoneNumberId: tenant.meta.phoneNumberId,
    meta: result
  };
}

async function verifyPhoneCode(tenantId, body = {}) {
  const otpCode = String(body.otpCode || body.otp_code || body.code || "").trim();

  if (!otpCode) {
    throw new HttpError(400, "Verification code is required");
  }

  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  const result = await fetchMetaJson(
    `${tenant.meta.phoneNumberId}/verify_code?code=${encodeURIComponent(otpCode)}`,
    accessToken,
    { method: "POST", body: JSON.stringify({}) }
  );

  const status = await getPhoneNumberStatus(tenantId).catch(() => null);

  return {
    phoneNumberId: tenant.meta.phoneNumberId,
    phone: status?.phone,
    tenant: status?.tenant,
    meta: result
  };
}

async function registerPhoneNumber(tenantId) {
  requireConfiguredRegistrationPin();
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);

  const result = await fetchMetaJson(`${tenant.meta.phoneNumberId}/register`, accessToken, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      pin: env.facebookRegistrationPin
    })
  });

  const status = await getPhoneNumberStatus(tenantId).catch(() => null);
  const updatedTenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        onboardingStatus: "meta_connected",
        "meta.lastPhoneSetupError": ""
      }
    },
    { new: true }
  );

  return {
    tenant: updatedTenant ? publicTenant(updatedTenant) : status?.tenant,
    phone: status?.phone,
    meta: result
  };
}

async function deregisterPhoneNumber(tenantId) {
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  const result = await fetchMetaJson(`${tenant.meta.phoneNumberId}/deregister`, accessToken, {
    method: "POST",
    body: JSON.stringify({})
  });

  const updatedTenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        onboardingStatus: "meta_pending",
        "meta.phoneStatus": "DEREGISTERED",
        "meta.lastPhoneSetupError": ""
      }
    },
    { new: true }
  );

  return {
    tenant: updatedTenant ? publicTenant(updatedTenant) : null,
    meta: result
  };
}

async function getOnboardingStatus(tenantId) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  return publicTenant(tenant);
}

async function completeEmbeddedSignup(tenantId, body) {
  const sessionInfo = parseSessionInfo(body.sessionInfo || body.session_info);
  const wabaId = body.wabaId || body.waba_id || sessionInfo.wabaId;
  const phoneNumberId = body.phoneNumberId || body.phone_number_id || sessionInfo.phoneNumberId;
  const businessId = body.businessId || body.business_id || sessionInfo.businessId;
  const signupSessionId = body.sessionId || body.session_id || sessionInfo.sessionId;
  const lastSignupEvent = body.event || sessionInfo.event || "FINISH";
  const lastSignupError = body.errorMessage || body.error_message || sessionInfo.errorMessage || "";

  if (!body.code) {
    throw new HttpError(400, "Embedded Signup authorization code is required");
  }

  if (!wabaId) {
    throw new HttpError(400, "Embedded Signup did not return a WABA ID");
  }

  const tokenData = await exchangeCodeForToken({
    code: body.code,
    redirectUri: body.redirectUri,
    requestUrl: body.requestUrl
  });

  let subscribed = null;
  try {
    subscribed = await subscribeAppToWaba(wabaId, tokenData.access_token);
  } catch (error) {
    subscribed = {
      success: false,
      message: error.message
    };
  }

  const expiresInSeconds = Number(tokenData.expires_in || 0);
  const tokenExpiresAt = expiresInSeconds
    ? new Date(Date.now() + expiresInSeconds * 1000)
    : undefined;

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        onboardingStatus: phoneNumberId ? "meta_connected" : "meta_pending",
        "meta.businessId": businessId || "",
        "meta.wabaId": wabaId,
        "meta.phoneNumberId": phoneNumberId || "",
        "meta.lastPhoneSetupError": "",
        "meta.appId": env.facebookAppId,
        "meta.tokenType": tokenData.token_type || "",
        ...(tokenExpiresAt ? { "meta.tokenExpiresAt": tokenExpiresAt } : {}),
        "meta.connectedAt": new Date(),
        "meta.signupSessionId": signupSessionId || "",
        "meta.lastSignupEvent": lastSignupEvent,
        "meta.lastSignupError": lastSignupError,
        "meta.accessToken": tokenData.access_token
      }
    },
    { new: true }
  );

  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  return {
    tenant: publicTenant(tenant),
    meta: {
      subscribed
    },
    token: publicToken(tokenData)
  };
}

async function exchangeOAuthCode({ code, redirectUri, tenantId, wabaId, phoneNumberId, requestUrl }) {
  const tokenData = await exchangeCodeForToken({ code, redirectUri, requestUrl });

  let tenant = null;
  if (tenantId) {
    tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          onboardingStatus: "meta_connected",
          ...(wabaId ? { "meta.wabaId": wabaId } : {}),
          ...(phoneNumberId ? { "meta.phoneNumberId": phoneNumberId } : {}),
          "meta.appId": env.facebookAppId,
          "meta.tokenType": tokenData.token_type || "",
          ...(tokenData.expires_in ? { "meta.tokenExpiresAt": new Date(Date.now() + Number(tokenData.expires_in) * 1000) } : {}),
          "meta.connectedAt": new Date(),
          "meta.accessToken": tokenData.access_token
        }
      },
      { new: true }
    );
  }

  return {
    publicToken: publicToken(tokenData),
    tenant: tenant ? publicTenant(tenant) : null
  };
}

module.exports = {
  getEmbeddedSignupUrl,
  getFacebookSdkConfig,
  getOnboardingStatus,
  completeEmbeddedSignup,
  exchangeOAuthCode,
  getPhoneNumberStatus,
  requestPhoneVerificationCode,
  verifyPhoneCode,
  registerPhoneNumber,
  deregisterPhoneNumber
};
