const env = require("../config/env");

const SECRET_KEY_PATTERN = /token|secret|password|authorization|cookie|signature|credential|key/i;

function sanitizeDetails(value, depth = 0) {
  if (depth > 4) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.slice(0, 1000);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 25).map((item) => sanitizeDetails(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, 50)
      .map(([key, item]) => [
        key,
        SECRET_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeDetails(item, depth + 1)
      ])
  );
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  if (error.name === "ValidationError" || error.name === "CastError") statusCode = 400;
  if (error.code === 11000) statusCode = 409;

  const response = {
    success: false,
    message: statusCode >= 500 ? "Internal server error" : error.message,
    requestId: req.id
  };

  if (error.details && statusCode < 500) {
    response.details = sanitizeDetails(error.details);
  }
  if (env.nodeEnv !== "production") response.stack = error.stack;

  if (statusCode >= 500) {
    console.error(`[${req.id || "no-request-id"}]`, error);
  }
  res.status(statusCode).json(response);
}

module.exports = errorHandler;
