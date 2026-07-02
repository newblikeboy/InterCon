const crypto = require("crypto");
const path = require("path");
const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const routes = require("./routes");
const securityMiddleware = require("./middleware/security");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const env = require("./config/env");
const metrics = require("./services/metrics.service");

const app = express();
const publicPath = path.resolve(process.cwd(), "Public");

app.use((req, res, next) => {
  const requestId = /^[A-Za-z0-9._-]{8,100}$/.test(String(req.headers["x-request-id"] || ""))
    ? String(req.headers["x-request-id"])
    : crypto.randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});
app.use(metrics.middleware);
securityMiddleware(app);

app.use(compression());
app.use(express.json({
  limit: "5mb",
  verify: (req, res, buf) => {
    if (/^\/api\/webhooks(?:\/|$)/.test(req.originalUrl.split("?")[0])) {
      req.rawBody = Buffer.from(buf);
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: "256kb" }));
app.use(cookieParser());

if (env.nodeEnv !== "test") {
  app.use(pinoHttp({
    level: env.nodeEnv === "production" ? "info" : "debug",
    genReqId: (req) => req.id,
    autoLogging: {
      ignore: (req) => /^\/api\/health(?:\/|$)/.test(req.url.split("?")[0])
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: String(req.url || "").split("?")[0],
          remoteAddress: req.remoteAddress
        };
      }
    }
  }));
}

app.use(express.static(publicPath, {
  maxAge: 0,
  etag: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-cache");
      return;
    }

    const isVersionedAsset = Boolean(res.req?.query?.v);
    if (isVersionedAsset && /\.(?:css|js|ico|png|jpg|jpeg|webp|svg|woff2?)$/i.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      return;
    }

    res.setHeader("Cache-Control", "no-cache");
  }
}));

// Serve the app shells with no-cache so the browser always revalidates the
// HTML and picks up new asset versions (the ?v= query on CSS/JS). Without
// this, res.sendFile lets the browser hold a stale HTML that still links the
// old stylesheet, so UI fixes appear not to take effect.
function sendHtml(res, file) {
  res.set("Cache-Control", "no-cache");
  res.sendFile(path.join(publicPath, file));
}

app.get("/", (req, res) => {
  sendHtml(res, "index.html");
});

app.get("/customer", (req, res) => {
  sendHtml(res, "customer-portal.html");
});

app.get("/admin", (req, res) => {
  sendHtml(res, "admin-portal.html");
});

app.get("/privacy-policy", (req, res) => {
  sendHtml(res, "privacy-policy.html");
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
