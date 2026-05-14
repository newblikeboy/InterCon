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

  app.use(helmet({
    contentSecurityPolicy: false
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

  app.use(rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  }));
}

module.exports = securityMiddleware;
