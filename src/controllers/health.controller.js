const mongoose = require("mongoose");
const env = require("../config/env");

function getHealth(req, res) {
  res.json({
    success: true,
    service: "intercon-api",
    environment: env.nodeEnv,
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "not_connected"
  });
}

module.exports = {
  getHealth
};
