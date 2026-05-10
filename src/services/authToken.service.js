const jwt = require("jsonwebtoken");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

function ensureJwtSecret() {
  if (!env.jwtSecret) {
    throw new HttpError(500, "JWT_SECRET or SESSION_SECRET is not configured");
  }
}

function signAuthToken(user) {
  ensureJwtSecret();

  return jwt.sign(
    {
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

function setAuthCookie(res, token) {
  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge: env.authCookieMaxAgeMs,
    path: "/"
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/"
  });
}

function verifyAuthToken(token) {
  ensureJwtSecret();
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  verifyAuthToken
};
