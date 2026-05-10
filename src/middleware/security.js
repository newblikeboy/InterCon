const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("../config/env");

function securityMiddleware(app) {
  app.use(helmet({
    contentSecurityPolicy: false
  }));

  app.use(cors({
    origin(origin, callback) {
      if (!origin || !env.clientOrigin || origin === env.clientOrigin) {
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
