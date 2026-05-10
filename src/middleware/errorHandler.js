const env = require("../config/env");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message
  };

  if (error.details) {
    response.details = error.details;
  }

  if (env.nodeEnv !== "production") {
    response.stack = error.stack;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
