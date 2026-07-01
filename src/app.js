const path = require("path");
const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const routes = require("./routes");
const securityMiddleware = require("./middleware/security");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const env = require("./config/env");

const app = express();
const publicPath = path.resolve(process.cwd(), "Public");

securityMiddleware(app);

app.use(compression());
app.use(express.json({
  limit: "5mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
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
