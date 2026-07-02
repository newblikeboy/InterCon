const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const env = require("../config/env");
const { verifyAuthToken } = require("../services/authToken.service");
const sessionCache = require("../services/sessionCache.service");

const authenticate = asyncHandler(async (req, res, next) => {
  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.[env.authCookieName] || bearerToken;

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    throw new HttpError(401, "Invalid or expired session");
  }

  const user = await sessionCache.getUser(payload.sub);
  if (
    !user
    || user.status !== "active"
    || Number(payload.sv || 0) !== Number(user.sessionVersion || 0)
    || String(payload.tenantId) !== String(user.tenantId)
  ) {
    throw new HttpError(401, "User account is not active");
  }

  req.user = user;
  req.tenantId = user.tenantId;
  next();
});

module.exports = authenticate;
