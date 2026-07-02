const mongoose = require("mongoose");
const env = require("../config/env");
const { getRedisClient } = require("../config/redis");
const metrics = require("../services/metrics.service");

function getHealth(req, res) {
  res.json({
    success: true,
    service: "intercon-api",
    environment: env.nodeEnv,
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "not_connected"
  });
}

function getReadiness(req, res) {
  const databaseReady = mongoose.connection.readyState === 1;
  const redis = getRedisClient();
  const redisReady = !env.redisUrl || Boolean(redis?.isReady);
  const ready = databaseReady && redisReady;
  res.status(ready ? 200 : 503).json({
    success: ready,
    database: databaseReady ? "connected" : "not_connected",
    redis: redisReady ? "connected" : "not_connected"
  });
}

function getMetrics(req, res) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : "";
  if (!env.metricsToken || token !== env.metricsToken) {
    res.status(404).json({ success: false, message: "Not found" });
    return;
  }
  res.json({ success: true, metrics: metrics.snapshot() });
}

module.exports = {
  getHealth,
  getReadiness,
  getMetrics
};
