const http = require("http");
const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/database");
const { connectRedis, closeRedis } = require("./config/redis");
const { assertProductionEnvironment } = require("./config/validate");
const mongoose = require("mongoose");

async function startServer() {
  assertProductionEnvironment();
  await Promise.all([connectDatabase(), connectRedis()]);

  const server = http.createServer(app);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 15000;
  server.requestTimeout = 120000;
  server.maxRequestsPerSocket = 1000;

  server.listen(env.port, () => {
    console.log(`InterCon is running on http://localhost:${env.port}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received. Closing HTTP server.`);
    const forceTimer = setTimeout(() => process.exit(1), 15000);
    forceTimer.unref();
    server.close(async () => {
      await Promise.allSettled([mongoose.disconnect(), closeRedis()]);
      clearTimeout(forceTimer);
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start InterCon API:", error);
  process.exit(1);
});
