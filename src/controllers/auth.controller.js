const asyncHandler = require("../utils/asyncHandler");
const { signAuthToken, setAuthCookie, clearAuthCookie } = require("../services/authToken.service");
const authService = require("../services/auth.service");

const signup = asyncHandler(async (req, res) => {
  const { user, tenant } = await authService.signupCustomer(req.body);
  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: "Signup successful",
    user: authService.publicUser(user, tenant)
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, tenant } = await authService.loginCustomer(req.body);
  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: "Login successful",
    user: authService.publicUser(user, tenant)
  });
});

const facebookLogin = asyncHandler(async (req, res) => {
  const { user, tenant, created } = await authService.loginWithFacebook(req.body);
  const token = signAuthToken(user);
  setAuthCookie(res, token);

  res.status(created ? 201 : 200).json({
    success: true,
    message: created ? "Signup successful" : "Login successful",
    user: authService.publicUser(user, tenant)
  });
});

const logout = asyncHandler(async (req, res) => {
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

module.exports = {
  signup,
  login,
  facebookLogin,
  logout,
  me
};
