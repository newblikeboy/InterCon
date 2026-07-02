const os = require("os");
const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const { connectRedis, closeRedis } = require("../config/redis");
const { assertProductionEnvironment } = require("../config/validate");
const env = require("../config/env");
const webhookService = require("../services/webhook.service");

const workerId = `webhook-worker-${os.hostname()}-${process.pid}`;
let stopping = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  assertProductionEnvironment();
  await Promise.all([connectDatabase(), connectRedis()]);
  console.log(`${workerId} started`);

  while (!stopping) {
    try {
      const result = await webhookService.processNextWebhookEvent(workerId);
      if (!result) {
        await sleep(env.webhookWorkerPollMs);
      }
    } catch (error) {
      console.error(`${workerId} loop error:`, error.message);
      await sleep(Math.max(env.webhookWorkerPollMs, 1000));
    }
  }
  await Promise.allSettled([mongoose.disconnect(), closeRedis()]);
}

function shutdown(signal) {
  console.log(`${signal} received. Stopping ${workerId}.`);
  stopping = true;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

run().catch((error) => {
  console.error("Webhook worker failed:", error);
  process.exit(1);
});
