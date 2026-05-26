const asyncHandler = require("../utils/asyncHandler");
const metaService = require("../services/meta.service");

const getEmbeddedSignupUrl = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    url: metaService.getEmbeddedSignupUrl()
  });
});

const getFacebookSdkConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    config: metaService.getFacebookSdkConfig()
  });
});

const getOnboardingStatus = asyncHandler(async (req, res) => {
  const tenant = await metaService.getOnboardingStatus(req.tenantId);

  res.json({
    success: true,
    tenant
  });
});

const completeEmbeddedSignup = asyncHandler(async (req, res) => {
  const result = await metaService.completeEmbeddedSignup(req.tenantId, req.body);
  const isConnected = result.tenant?.onboardingStatus === "meta_connected" && Boolean(result.tenant?.meta?.phoneNumberId);

  res.json({
    success: true,
    message: isConnected
      ? "WhatsApp account connected"
      : "Meta signup saved, but WhatsApp phone number connection is pending",
    ...result
  });
});

const exchangeOAuthCode = asyncHandler(async (req, res) => {
  const result = await metaService.exchangeOAuthCode({
    code: req.body.code,
    redirectUri: req.body.redirectUri,
    tenantId: req.tenantId,
    wabaId: req.body.wabaId,
    phoneNumberId: req.body.phoneNumberId
  });

  res.json({
    success: true,
    token: result.publicToken,
    tenant: result.tenant
  });
});

const getPhoneNumberStatus = asyncHandler(async (req, res) => {
  const result = await metaService.getPhoneNumberStatus(req.tenantId);

  res.json({
    success: true,
    ...result
  });
});

const requestPhoneVerificationCode = asyncHandler(async (req, res) => {
  const result = await metaService.requestPhoneVerificationCode(req.tenantId, req.body);

  res.json({
    success: true,
    message: "Verification code requested",
    ...result
  });
});

const verifyPhoneCode = asyncHandler(async (req, res) => {
  const result = await metaService.verifyPhoneCode(req.tenantId, req.body);

  res.json({
    success: true,
    message: "Phone verification code accepted",
    ...result
  });
});

const registerPhoneNumber = asyncHandler(async (req, res) => {
  const result = await metaService.registerPhoneNumber(req.tenantId);

  res.json({
    success: true,
    message: "WhatsApp phone number registered",
    ...result
  });
});

const deregisterPhoneNumber = asyncHandler(async (req, res) => {
  const result = await metaService.deregisterPhoneNumber(req.tenantId);

  res.json({
    success: true,
    message: "WhatsApp phone number deregistered",
    ...result
  });
});

const handleOAuthCallback = asyncHandler(async (req, res) => {
  const result = await metaService.exchangeOAuthCode({
    code: req.query.code,
    redirectUri: req.query.redirect_uri,
    tenantId: req.tenantId,
    requestUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`
  });

  const status = result.tenant ? "connected" : "token_exchanged";
  res.redirect(`/customer?meta=${status}#connect`);
});

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
  deregisterPhoneNumber,
  handleOAuthCallback
};
