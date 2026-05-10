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
  limit: "1mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

if (env.nodeEnv !== "test") {
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
}

app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.get("/customer", (req, res) => {
  res.sendFile(path.join(publicPath, "customer-portal.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(publicPath, "admin-portal.html"));
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
