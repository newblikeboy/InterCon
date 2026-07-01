const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");

function getAllowedOrigins() {
  const origins = new Set();

  if (env.clientOrigin) {
    origins.add(env.clientOrigin);
  }

  if (env.nodeEnv !== "production") {
    origins.add(`http://localhost:${env.port}`);
    origins.add(`http://127.0.0.1:${env.port}`);
  }

  return origins;
}

function securityMiddleware(app) {
  const allowedOrigins = getAllowedOrigins();
  const limiterResponse = {
    success: false,
    message: "Too many requests, please try again later."
  };

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups"
    }
  }));

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  }));

  // Inbox GETs poll while the operator is viewing a chat. Give those
  // read-only, authenticated routes their own budget so they cannot exhaust
  // the general API allowance used by replies and other mutations.
  app.use("/api/inbox", rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.inboxReadRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: limiterResponse,
    skip: (req) => req.method !== "GET"
  }));

  // Limit API traffic only. Static assets and page navigation must not consume
  // API capacity. Inbox reads are handled by the dedicated limiter above.
  app.use("/api", rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: limiterResponse,
    skip: (req) => (
      req.method === "GET"
      && /^\/api\/inbox(?:\/|$)/.test(req.originalUrl.split("?")[0])
    )
  }));
}

module.exports = securityMiddleware;
