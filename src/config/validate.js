const env = require("./env");

function assertProductionEnvironment() {
  if (env.nodeEnv !== "production") return;

  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.clientOrigin?.startsWith("https://")) missing.push("CLIENT_ORIGIN (HTTPS)");
  if (!env.jwtSecret || env.jwtSecret.length < 32) missing.push("JWT_SECRET (32+ characters)");
  if (!env.dataEncryptionKey || env.dataEncryptionKey.length < 32) missing.push("DATA_ENCRYPTION_KEY (32+ characters)");
  if (!env.redisUrl) missing.push("REDIS_URL");
  if (!env.metricsToken || env.metricsToken.length < 32) missing.push("METRICS_TOKEN (32+ characters)");
  if (!env.facebookAppSecret && !env.metaAppSecret) missing.push("FB_APP_SECRET or META_APP_SECRET");
  if (!env.metaWebhookVerifyToken) missing.push("META_WEBHOOK_VERIFY_TOKEN");

  if (env.jwtSecret && env.dataEncryptionKey && env.jwtSecret === env.dataEncryptionKey) {
    throw new Error("JWT_SECRET and DATA_ENCRYPTION_KEY must be different in production");
  }
  if (missing.length) {
    throw new Error(`Production configuration is incomplete: ${missing.join(", ")}`);
  }
}

module.exports = {
  assertProductionEnvironment
};
