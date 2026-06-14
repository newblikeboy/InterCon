const env = require("../config/env");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");

const onboardingMetaCache = new Map();
const ONBOARDING_META_TTL_MS = 20 * 1000;

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

function resolveOAuthRedirectUri(redirectUri, requestUrl, required = false) {
  if (redirectUri) return redirectUri;

  if (requestUrl) {
    const parsedUrl = new URL(requestUrl);
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString();
  }

  if (!required) return "";

  if (env.facebookOAuthRedirectUri) return env.facebookOAuthRedirectUri;

  if (env.clientOrigin) {
    return `${env.clientOrigin.replace(/\/$/, "")}/api/meta/oauth/callback`;
  }

  throw new HttpError(400, "redirectUri is required for OAuth code exchange");
}

function getFacebookAppSecret() {
  return env.facebookAppSecret;
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
      verifiedName: tenant.meta?.verifiedName,
      nameStatus: tenant.meta?.nameStatus,
      newNameStatus: tenant.meta?.newNameStatus,
      displayNameDecision: tenant.meta?.displayNameDecision,
      displayNameRejectionReason: tenant.meta?.displayNameRejectionReason,
      appId: tenant.meta?.appId,
      tokenType: tenant.meta?.tokenType,
      tokenExpiresAt: tenant.meta?.tokenExpiresAt,
      connectedAt: tenant.meta?.connectedAt,
      signupSessionId: tenant.meta?.signupSessionId,
      lastSignupEvent: tenant.meta?.lastSignupEvent,
      lastSignupError: tenant.meta?.lastSignupError,
      lastPhoneSetupError: tenant.meta?.lastPhoneSetupError
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
  };
}

function publicTenantWithMeta(tenant, extraMeta = {}) {
  const payload = publicTenant(tenant);
  payload.meta = {
    ...payload.meta,
    ...extraMeta
  };

  return payload;
}

function findFirstValue(input, keys, depth = 0) {
  if (!input || typeof input !== "object" || depth > 5) return undefined;

  for (const key of keys) {
    if (input[key]) return input[key];
  }

  for (const value of Object.values(input)) {
    const found = findFirstValue(value, keys, depth + 1);
    if (found) return found;
  }

  return undefined;
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
    event: parsed.event || data.event || findFirstValue(parsed, ["event"]),
    sessionId: data.session_id || data.sessionId || parsed.session_id || parsed.sessionId || findFirstValue(parsed, ["session_id", "sessionId"]),
    businessId: data.business_id || data.businessId || data.business?.id || parsed.business_id || parsed.businessId || findFirstValue(parsed, ["business_id", "businessId"]),
    wabaId: data.waba_id || data.wabaId || data.whatsapp_business_account_id || data.whatsappBusinessAccountId || data.waba?.id || parsed.waba_id || parsed.wabaId || findFirstValue(parsed, ["waba_id", "wabaId", "whatsapp_business_account_id", "whatsappBusinessAccountId"]),
    phoneNumberId: data.phone_number_id || data.phoneNumberId || data.phone?.id || parsed.phone_number_id || parsed.phoneNumberId || findFirstValue(parsed, ["phone_number_id", "phoneNumberId"]),
    errorMessage: data.error_message || data.errorMessage || parsed.error_message || parsed.errorMessage || findFirstValue(parsed, ["error_message", "errorMessage"])
  };
}

function getPublicOrigin(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch (error) {
    return "invalid-url";
  }
}

async function recordSignupFailure(tenantId, message, event = "ERROR") {
  if (!tenantId) return;

  await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        onboardingStatus: "meta_pending",
        "meta.lastSignupEvent": event,
        "meta.lastSignupError": message
      }
    }
  ).catch(() => null);
}

async function exchangeCodeForToken({ code, redirectUri, requestUrl, requireRedirectUri = false }) {
  if (!code) {
    throw new HttpError(400, "OAuth code is required");
  }

  if (!env.facebookAppId) {
    throw new HttpError(500, "FB_APP_ID is not configured");
  }

  const appSecret = getFacebookAppSecret();
  if (!appSecret) {
    throw new HttpError(500, "FB_APP_SECRET is not configured");
  }

  const resolvedRedirectUri = resolveOAuthRedirectUri(redirectUri, requestUrl, requireRedirectUri);
  const tokenUrl = `https://graph.facebook.com/${env.facebookSdkVersion}/oauth/access_token`;
  const params = new URLSearchParams({
    client_id: env.facebookAppId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    code
  });
  if (resolvedRedirectUri) {
    params.set("redirect_uri", resolvedRedirectUri);
  }

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

function invalidateOnboardingMetaCache(wabaId) {
  if (wabaId) {
    onboardingMetaCache.delete(String(wabaId));
  }
}

async function getOnboardingMetaState(tenant, accessToken) {
  if (!tenant.meta?.wabaId || !accessToken) {
    return {
      webhookStatus: "waiting",
      canSendMessage: "unknown",
      wabaHealthError: "",
      businessHealthStatus: "unknown",
      businessHealthError: ""
    };
  }

  const cacheKey = String(tenant.meta.wabaId);
  const cached = onboardingMetaCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = fetchOnboardingMetaState(tenant, accessToken).catch((error) => {
    onboardingMetaCache.delete(cacheKey);
    throw error;
  });

  onboardingMetaCache.set(cacheKey, {
    expiresAt: Date.now() + ONBOARDING_META_TTL_MS,
    promise
  });

  return promise;
}

async function fetchOnboardingMetaState(tenant, accessToken) {
  let webhookStatus = "unknown";
  let canSendMessage = "unknown";
  let wabaHealthError = "";
  let businessHealthStatus = "unknown";
  let businessHealthError = "";

  try {
    const data = await fetchMetaJson(`${tenant.meta.wabaId}/subscribed_apps`, accessToken);
    const subscribedApps = Array.isArray(data.data) ? data.data : [];
    const isSubscribed = subscribedApps.some((item) => {
      const appData = item.whatsapp_business_api_data || item;
      return String(appData.id || item.id || "") === String(env.facebookAppId);
    });
    webhookStatus = isSubscribed ? "subscribed" : "not_subscribed";
  } catch (error) {
    webhookStatus = "unknown";
  }

  try {
    const data = await fetchMetaJson(`${tenant.meta.wabaId}?fields=health_status`, accessToken);
    const entities = data.health_status?.entities || [];
    const wabaEntity = entities.find((entity) => String(entity.entity_type || "").toUpperCase() === "WABA");
    const businessEntity = entities.find((entity) => String(entity.entity_type || "").toUpperCase() === "BUSINESS");
    canSendMessage = String(wabaEntity?.can_send_message || data.health_status?.can_send_message || "unknown").toLowerCase();
    wabaHealthError = wabaEntity?.errors?.[0]?.possible_solution || wabaEntity?.errors?.[0]?.error_description || "";
    businessHealthStatus = String(businessEntity?.can_send_message || "unknown").toLowerCase();
    businessHealthError = businessEntity?.errors?.[0]?.possible_solution || businessEntity?.errors?.[0]?.error_description || "";
  } catch (error) {
    canSendMessage = "unknown";
    wabaHealthError = error.message;
    businessHealthStatus = "unknown";
    businessHealthError = error.message;
  }

  return {
    webhookStatus,
    canSendMessage,
    wabaHealthError,
    businessHealthStatus,
    businessHealthError
  };
}

async function debugMetaToken(accessToken) {
  const appSecret = getFacebookAppSecret();
  if (!env.facebookAppId || !appSecret || !accessToken) return null;

  const appAccessToken = `${env.facebookAppId}|${appSecret}`;
  const params = new URLSearchParams({
    input_token: accessToken,
    access_token: appAccessToken
  });
  const response = await fetch(`https://graph.facebook.com/${env.facebookSdkVersion}/debug_token?${params}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(response.status || 400, data.error?.message || "Unable to inspect Meta token", data.error || data);
  }

  return data;
}

function getTokenTargetIds(tokenDebug) {
  const granularScopes = tokenDebug?.data?.granular_scopes || [];
  const targetIds = [];

  granularScopes.forEach((scopeInfo) => {
    if (!["whatsapp_business_management", "whatsapp_business_messaging"].includes(scopeInfo.scope)) return;

    (scopeInfo.target_ids || []).forEach((targetId) => {
      if (targetId && !targetIds.includes(String(targetId))) {
        targetIds.push(String(targetId));
      }
    });
  });

  return targetIds;
}

function hasWhatsappPermissions(tokenDebug) {
  const scopes = tokenDebug?.data?.scopes || [];
  const granularScopes = tokenDebug?.data?.granular_scopes || [];
  const grantedScopes = new Set([
    ...scopes,
    ...granularScopes.map((scopeInfo) => scopeInfo.scope)
  ]);

  return grantedScopes.has("whatsapp_business_management") || grantedScopes.has("whatsapp_business_messaging");
}

async function getWabaPhoneCandidate(wabaId, accessToken) {
  const data = await fetchMetaJson(
    `${wabaId}/phone_numbers?fields=id,display_phone_number,status,account_mode,code_verification_status,verified_name,name_status,new_name_status`,
    accessToken
  );
  const phone = Array.isArray(data.data) ? data.data[0] : null;

  return {
    wabaId,
    phoneNumberId: phone?.id || "",
    phoneDetails: phone ? publicPhoneDetails(phone) : null
  };
}

async function discoverSignupAssets(accessToken) {
  const tokenDebug = await debugMetaToken(accessToken);
  const targetIds = getTokenTargetIds(tokenDebug);

  if (!hasWhatsappPermissions(tokenDebug)) {
    return {
      tokenDebug,
      error: "Meta returned a valid token, but it only has basic Facebook permissions. The Login for Business configuration must request WhatsApp Embedded Signup permissions."
    };
  }

  for (const targetId of targetIds) {
    try {
      const candidate = await getWabaPhoneCandidate(targetId, accessToken);
      return {
        ...candidate,
        tokenDebug
      };
    } catch (error) {
      continue;
    }
  }

  return {
    tokenDebug
  };
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
    verifiedName: data.verified_name || data.verifiedName || "",
    nameStatus: data.name_status || data.nameStatus || "",
    newNameStatus: data.new_name_status || data.newNameStatus || ""
  };
}

async function savePhoneDetails(tenantId, details, error = "") {
  const update = {
    ...(details.displayPhoneNumber ? { "meta.displayPhoneNumber": details.displayPhoneNumber } : {}),
    ...(details.status ? { "meta.phoneStatus": details.status } : {}),
    ...(details.accountMode ? { "meta.accountMode": details.accountMode } : {}),
    ...(details.codeVerificationStatus ? { "meta.codeVerificationStatus": details.codeVerificationStatus } : {}),
    ...(details.verifiedName ? { "meta.verifiedName": details.verifiedName } : {}),
    ...(details.nameStatus ? { "meta.nameStatus": details.nameStatus } : {}),
    ...(details.newNameStatus ? { "meta.newNameStatus": details.newNameStatus } : {}),
    "meta.lastPhoneSetupError": error
  };

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    { $set: update },
    { returnDocument: "after" }
  );

  return tenant ? publicTenant(tenant) : null;
}

async function getPhoneNumberStatus(tenantId) {
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  const data = await fetchMetaJson(
    `${tenant.meta.phoneNumberId}?fields=status,account_mode,display_phone_number,code_verification_status,verified_name,name_status,new_name_status`,
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
  invalidateOnboardingMetaCache(tenant.meta.wabaId);

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
    { returnDocument: "after" }
  );

  return {
    tenant: updatedTenant ? publicTenant(updatedTenant) : status?.tenant,
    phone: status?.phone,
    meta: result
  };
}

async function autoRegisterPhoneNumber(tenantId) {
  if (!env.facebookRegistrationPin) {
    const message = "FB_REG_PIN is not configured. Manual phone registration is required before sending.";
    await Tenant.findByIdAndUpdate(tenantId, {
      $set: { "meta.lastPhoneSetupError": message }
    }).catch(() => null);

    return {
      success: false,
      message
    };
  }

  try {
    const result = await registerPhoneNumber(tenantId);
    return {
      success: true,
      phone: result.phone,
      meta: result.meta
    };
  } catch (error) {
    await Tenant.findByIdAndUpdate(tenantId, {
      $set: { "meta.lastPhoneSetupError": error.message }
    }).catch(() => null);

    return {
      success: false,
      message: error.message,
      details: error.details
    };
  }
}

async function deregisterPhoneNumber(tenantId) {
  const { tenant, accessToken } = await getTenantWithMetaToken(tenantId);
  invalidateOnboardingMetaCache(tenant.meta.wabaId);
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
    { returnDocument: "after" }
  );

  return {
    tenant: updatedTenant ? publicTenant(updatedTenant) : null,
    meta: result
  };
}

async function getOnboardingStatus(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  const accessToken = tenant.getMetaAccessToken();
  const metaState = await getOnboardingMetaState(tenant, accessToken);

  return publicTenantWithMeta(tenant, metaState);
}

async function getMetaDiagnostics(tenantId, req) {
  const tenant = await Tenant.findById(tenantId).select("+meta.accessToken");
  const sdkConfig = getFacebookSdkConfig();
  const requestOrigin = req ? `${req.protocol}://${req.get("host")}` : "";
  const configuredOrigin = env.clientOrigin || "";
  const effectiveOrigin = configuredOrigin || requestOrigin;
  const accessToken = tenant?.getMetaAccessToken();
  let token = {
    stored: Boolean(accessToken)
  };

  if (accessToken) {
    try {
      const tokenDebug = await debugMetaToken(accessToken);
      const granularScopes = tokenDebug?.data?.granular_scopes || [];
      token = {
        stored: true,
        valid: Boolean(tokenDebug?.data?.is_valid),
        type: tokenDebug?.data?.type || "",
        appId: tokenDebug?.data?.app_id || "",
        scopes: tokenDebug?.data?.scopes || [],
        granularScopes: granularScopes.map((scopeInfo) => ({
          scope: scopeInfo.scope,
          targetIds: scopeInfo.target_ids || []
        })),
        targetIds: getTokenTargetIds(tokenDebug),
        hasWhatsappPermissions: hasWhatsappPermissions(tokenDebug)
      };
    } catch (error) {
      token = {
        stored: true,
        error: error.message
      };
    }
  }

  return {
    runtime: {
      nodeEnv: env.nodeEnv,
      requestOrigin,
      configuredClientOrigin: getPublicOrigin(configuredOrigin),
      effectiveOrigin: getPublicOrigin(effectiveOrigin)
    },
    meta: {
      appIdConfigured: Boolean(env.facebookAppId),
      appSecretConfigured: Boolean(getFacebookAppSecret()),
      registrationPinConfigured: Boolean(env.facebookRegistrationPin),
      graphApiVersion: env.metaGraphApiVersion,
      facebookSdkVersion: env.facebookSdkVersion,
      loginConfigIdConfigured: Boolean(sdkConfig.loginConfigId),
      embeddedSignupUrlConfigured: Boolean(env.embeddedSignupUrl),
      redirectUri: sdkConfig.redirectUri,
      redirectOrigin: getPublicOrigin(sdkConfig.redirectUri),
      webhookCallbackUrl: `${effectiveOrigin.replace(/\/$/, "")}/api/webhooks/meta`,
      webhookVerifyTokenConfigured: Boolean(env.metaWebhookVerifyToken),
      webhookAppSecretConfigured: Boolean(env.metaAppSecret || env.facebookAppSecret)
    },
    token,
    tenant: tenant ? publicTenant(tenant) : null
  };
}

async function completeEmbeddedSignup(tenantId, body) {
  const sessionInfo = parseSessionInfo(body.sessionInfo || body.session_info);
  let wabaId = body.wabaId || body.waba_id || sessionInfo.wabaId;
  let phoneNumberId = body.phoneNumberId || body.phone_number_id || sessionInfo.phoneNumberId;
  let businessId = body.businessId || body.business_id || sessionInfo.businessId;
  const signupSessionId = body.sessionId || body.session_id || sessionInfo.sessionId;
  const lastSignupEvent = body.event || sessionInfo.event || "FINISH";
  const lastSignupError = body.errorMessage || body.error_message || sessionInfo.errorMessage || "";

  if (!body.code) {
    await recordSignupFailure(tenantId, "Embedded Signup authorization code was not received from Meta", lastSignupEvent);
    throw new HttpError(400, "Embedded Signup authorization code is required");
  }

  let tokenData;
  try {
    tokenData = await exchangeCodeForToken({
      code: body.code,
      redirectUri: body.redirectUri,
      requestUrl: body.requestUrl
    });
  } catch (error) {
    await recordSignupFailure(tenantId, `Meta OAuth code exchange failed: ${error.message}`, lastSignupEvent);
    throw error;
  }

  let discoveredAssets = null;
  if (!wabaId || !phoneNumberId) {
    try {
      discoveredAssets = await discoverSignupAssets(tokenData.access_token);
      wabaId = wabaId || discoveredAssets.wabaId;
      phoneNumberId = phoneNumberId || discoveredAssets.phoneNumberId;
    } catch (error) {
      discoveredAssets = {
        error: error.message
      };
    }
  }

  if (!wabaId) {
    await recordSignupFailure(tenantId, "Embedded Signup finished in Meta, but no WABA ID was received by InterCon. Make sure FB.login extras include sessionInfoVersion 3 and the Login for Business configuration grants WhatsApp permissions.", lastSignupEvent);
    throw new HttpError(400, "Embedded Signup did not return a WABA ID");
  }

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
        ...(discoveredAssets?.phoneDetails?.displayPhoneNumber ? { "meta.displayPhoneNumber": discoveredAssets.phoneDetails.displayPhoneNumber } : {}),
        ...(discoveredAssets?.phoneDetails?.status ? { "meta.phoneStatus": discoveredAssets.phoneDetails.status } : {}),
        ...(discoveredAssets?.phoneDetails?.accountMode ? { "meta.accountMode": discoveredAssets.phoneDetails.accountMode } : {}),
        ...(discoveredAssets?.phoneDetails?.codeVerificationStatus ? { "meta.codeVerificationStatus": discoveredAssets.phoneDetails.codeVerificationStatus } : {}),
        ...(discoveredAssets?.phoneDetails?.verifiedName ? { "meta.verifiedName": discoveredAssets.phoneDetails.verifiedName } : {}),
        ...(discoveredAssets?.phoneDetails?.nameStatus ? { "meta.nameStatus": discoveredAssets.phoneDetails.nameStatus } : {}),
        ...(discoveredAssets?.phoneDetails?.newNameStatus ? { "meta.newNameStatus": discoveredAssets.phoneDetails.newNameStatus } : {}),
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
    { returnDocument: "after" }
  );

  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }
  invalidateOnboardingMetaCache(wabaId);

  const autoRegistration = phoneNumberId
    ? await autoRegisterPhoneNumber(tenantId)
    : null;
  const refreshedTenant = await Tenant.findById(tenantId);

  return {
    tenant: publicTenant(refreshedTenant || tenant),
    meta: {
      subscribed,
      phoneRegistration: autoRegistration,
      discoveredFromToken: Boolean(discoveredAssets?.wabaId || discoveredAssets?.phoneNumberId),
      discoveryError: discoveredAssets?.error
    },
    token: publicToken(tokenData)
  };
}

async function exchangeOAuthCode({ code, redirectUri, tenantId, wabaId, phoneNumberId, requestUrl }) {
  const tokenData = await exchangeCodeForToken({ code, redirectUri, requestUrl });

  let tenant = null;
  if (tenantId) {
    let discoveredAssets = null;
    let resolvedWabaId = wabaId;
    let resolvedPhoneNumberId = phoneNumberId;

    if (!resolvedWabaId || !resolvedPhoneNumberId) {
      try {
        discoveredAssets = await discoverSignupAssets(tokenData.access_token);
        resolvedWabaId = resolvedWabaId || discoveredAssets.wabaId;
        resolvedPhoneNumberId = resolvedPhoneNumberId || discoveredAssets.phoneNumberId;
      } catch (error) {
        discoveredAssets = {
          error: error.message
        };
      }
    }

    tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      {
        $set: {
          onboardingStatus: resolvedPhoneNumberId ? "meta_connected" : resolvedWabaId ? "meta_pending" : "account_created",
          ...(resolvedWabaId ? { "meta.wabaId": resolvedWabaId } : {}),
          ...(resolvedPhoneNumberId ? { "meta.phoneNumberId": resolvedPhoneNumberId } : {}),
          ...(discoveredAssets?.phoneDetails?.displayPhoneNumber ? { "meta.displayPhoneNumber": discoveredAssets.phoneDetails.displayPhoneNumber } : {}),
          ...(discoveredAssets?.phoneDetails?.status ? { "meta.phoneStatus": discoveredAssets.phoneDetails.status } : {}),
          ...(discoveredAssets?.phoneDetails?.accountMode ? { "meta.accountMode": discoveredAssets.phoneDetails.accountMode } : {}),
          ...(discoveredAssets?.phoneDetails?.codeVerificationStatus ? { "meta.codeVerificationStatus": discoveredAssets.phoneDetails.codeVerificationStatus } : {}),
          ...(discoveredAssets?.phoneDetails?.verifiedName ? { "meta.verifiedName": discoveredAssets.phoneDetails.verifiedName } : {}),
          ...(discoveredAssets?.phoneDetails?.nameStatus ? { "meta.nameStatus": discoveredAssets.phoneDetails.nameStatus } : {}),
          ...(discoveredAssets?.phoneDetails?.newNameStatus ? { "meta.newNameStatus": discoveredAssets.phoneDetails.newNameStatus } : {}),
          "meta.appId": env.facebookAppId,
          "meta.tokenType": tokenData.token_type || "",
          ...(tokenData.expires_in ? { "meta.tokenExpiresAt": new Date(Date.now() + Number(tokenData.expires_in) * 1000) } : {}),
          ...(resolvedWabaId ? { "meta.connectedAt": new Date() } : {}),
          "meta.lastSignupEvent": "OAUTH_CALLBACK",
          "meta.lastSignupError": discoveredAssets?.error || "",
          "meta.accessToken": tokenData.access_token
        }
      },
      { returnDocument: "after" }
    );
    invalidateOnboardingMetaCache(resolvedWabaId);
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
  getMetaDiagnostics,
  completeEmbeddedSignup,
  exchangeOAuthCode,
  getPhoneNumberStatus,
  requestPhoneVerificationCode,
  verifyPhoneCode,
  registerPhoneNumber,
  deregisterPhoneNumber
};
