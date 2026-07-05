const crypto = require("crypto");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const env = require("../config/env");
const { getRedisClient, connectRedis } = require("../config/redis");
const HttpError = require("../utils/httpError");

function getAllowedOrigins() {
  const origins = new Set();
  if (env.clientOrigin) origins.add(env.clientOrigin.replace(/\/$/, ""));
  if (env.nodeEnv !== "production") {
    origins.add(`http://localhost:${env.port}`);
    origins.add(`http://127.0.0.1:${env.port}`);
  }
  return origins;
}

function hashKey(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function requestIdentity(req) {
  const apiKey = req.headers["x-api-key"]
    || (req.originalUrl.startsWith("/api/v1") && req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : "");
  if (apiKey) return `api:${hashKey(apiKey)}`;

  const cookie = String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${env.authCookieName}=`));
  if (cookie) return `session:${hashKey(cookie)}`;
  return `ip:${ipKeyGenerator(req.ip)}`;
}

function createStore(prefix) {
  const redis = getRedisClient();
  if (!redis) return undefined;
  return new RedisStore({
    prefix: `intercon:rate:${prefix}:`,
    // The store is constructed at require time, before server.js has awaited
    // connectRedis(), and node-redis rejects commands on a closed client.
    sendCommand: async (...args) => {
      if (!redis.isReady) await connectRedis();
      return redis.sendCommand(args);
    }
  });
}

function limiter(prefix, options) {
  return rateLimit({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later."
    },
    keyGenerator: requestIdentity,
    store: createStore(prefix),
    ...options
  });
}

function requireTrustedOrigin(allowedOrigins) {
  return function verifyMutationOrigin(req, res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    if (/^\/api\/webhooks(?:\/|$)/.test(req.path)) return next();
    if (/^\/api\/v1(?:\/|$)/.test(req.path)) return next();

    const origin = String(req.headers.origin || "").replace(/\/$/, "");
    if (!origin || !allowedOrigins.has(origin)) {
      return next(new HttpError(403, "Request origin is not allowed"));
    }
    return next();
  };
}

function securityMiddleware(app) {
  const allowedOrigins = getAllowedOrigins();

  if (env.trustProxy !== false && env.trustProxy !== "") {
    app.set("trust proxy", env.trustProxy);
  }
  app.disable("x-powered-by");

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'", "https://www.facebook.com", "https://*.facebook.com", "https://*.razorpay.com"],
        fontSrc: ["'self'", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        frameSrc: ["'self'", "https://www.facebook.com", "https://*.facebook.com", "https://*.razorpay.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.fbcdn.net", "https://*.razorpay.com"],
        mediaSrc: ["'self'", "blob:", "https://res.cloudinary.com"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "https://connect.facebook.net", "https://checkout.razorpay.com"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        upgradeInsecureRequests: env.nodeEnv === "production" ? [] : null
      }
    },
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups"
    }
  }));

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin.replace(/\/$/, ""))) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, "Request origin is not allowed"));
    },
    credentials: true
  }));

  app.use(requireTrustedOrigin(allowedOrigins));

  app.use("/api/auth/login", limiter("auth-login", {
    windowMs: 15 * 60 * 1000,
    max: env.authLoginRateLimitMax
  }));
  app.use("/api/auth/signup", limiter("auth-signup", {
    windowMs: 60 * 60 * 1000,
    max: env.authSignupRateLimitMax
  }));
  app.use("/api/v1", limiter("public-api", {
    windowMs: env.rateLimitWindowMs,
    max: env.publicApiRateLimitMax
  }));
  app.use("/api/webhooks", limiter("webhooks", {
    windowMs: env.rateLimitWindowMs,
    max: 60000
  }));
  app.use("/api/media", limiter("media-upload", {
    windowMs: env.rateLimitWindowMs,
    max: env.mediaUploadRateLimitMax,
    skip: (req) => req.method !== "POST"
  }));
  app.use("/api/inbox", limiter("inbox-read", {
    windowMs: env.rateLimitWindowMs,
    max: env.inboxReadRateLimitMax,
    skip: (req) => req.method !== "GET"
  }));
  app.use("/api", limiter("general", {
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    skip: (req) => (
      /^\/api\/webhooks(?:\/|$)/.test(req.originalUrl.split("?")[0])
      || /^\/api\/health(?:\/|$)/.test(req.originalUrl.split("?")[0])
      || /^\/api\/v1(?:\/|$)/.test(req.originalUrl.split("?")[0])
      || /^\/api\/auth\/(?:login|signup)(?:\/|$)/.test(req.originalUrl.split("?")[0])
      || (
        req.method === "GET"
        && /^\/api\/inbox(?:\/|$)/.test(req.originalUrl.split("?")[0])
      )
    )
  }));
}

module.exports = securityMiddleware;
