const asyncHandler = require("../utils/asyncHandler");
const { signAuthToken, setAuthCookie, clearAuthCookie, verifyAuthToken } = require("../services/authToken.service");
const authService = require("../services/auth.service");
const User = require("../models/User");
const sessionCache = require("../services/sessionCache.service");
const env = require("../config/env");

const signup = asyncHandler(async (req, res) => {
  const { user, tenant } = await authService.signupCustomer(req.body);

  res.status(201).json({
    success: true,
    message: "Account created. Please check your email to verify your account before logging in.",
    user: authService.publicUser(user, tenant)
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const baseUrl = env.clientOrigin.replace(/\/$/, "");

  try {
    await authService.verifyEmail(req.query.token);
    return res.redirect(`${baseUrl}/?verified=1`);
  } catch (error) {
    return res.redirect(`${baseUrl}/?verify=invalid`);
  }
});

const resendVerification = asyncHandler(async (req, res) => {
  const identifier = req.body.email || req.body.login_id;
  const result = await authService.resendVerificationEmail(identifier);

  res.json({
    success: true,
    message: result.message
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, tenant } = await authService.loginCustomer(req.body);
  const remember = req.body.remember === true || req.body.remember === "on";
  const token = signAuthToken(user, remember);
  setAuthCookie(res, token, remember);

  res.json({
    success: true,
    message: "Login successful",
    user: authService.publicUser(user, tenant)
  });
});

const logout = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user._id },
    { $inc: { sessionVersion: 1 } }
  );
  await sessionCache.invalidateUser(req.user._id);
  clearAuthCookie(res);

  res.json({
    success: true,
    message: "Logged out"
  });
});

const me = asyncHandler(async (req, res) => {
  const { user, tenant } = await authService.getAuthenticatedProfile(req.user);

  res.json({
    success: true,
    user: authService.publicUser(user, tenant)
  });
});

const session = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.authCookieName];
  if (!token) {
    return res.json({ success: true, authenticated: false });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await sessionCache.getUser(payload.sub);
    const authenticated = Boolean(
      user
      && user.status === "active"
      && Number(payload.sv || 0) === Number(user.sessionVersion || 0)
      && String(payload.tenantId) === String(user.tenantId)
    );
    return res.json({ success: true, authenticated });
  } catch (error) {
    return res.json({ success: true, authenticated: false });
  }
});

module.exports = {
  signup,
  login,
  logout,
  me,
  session,
  verifyEmail,
  resendVerification
};
