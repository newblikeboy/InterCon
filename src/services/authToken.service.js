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
      role: user.role,
      sv: Number(user.sessionVersion || 0)
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      algorithm: "HS256",
      issuer: "intercon-api",
      audience: "intercon-portal"
    }
  );
}

function setAuthCookie(res, token) {
  const secureCookie = env.nodeEnv === "production" || env.clientOrigin.startsWith("https://");

  res.cookie(env.authCookieName, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge: env.authCookieMaxAgeMs,
    path: "/"
  });
}

function clearAuthCookie(res) {
  const secureCookie = env.nodeEnv === "production" || env.clientOrigin.startsWith("https://");

  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    path: "/"
  });
}

function verifyAuthToken(token) {
  ensureJwtSecret();
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ["HS256"],
    issuer: "intercon-api",
    audience: "intercon-portal"
  });
}

module.exports = {
  signAuthToken,
  setAuthCookie,
  clearAuthCookie,
  verifyAuthToken
};
