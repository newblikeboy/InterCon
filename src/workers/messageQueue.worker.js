const os = require("os");
const { connectDatabase } = require("../config/database");
const env = require("../config/env");
const messageService = require("../services/message.service");

const workerId = `message-worker-${os.hostname()}-${process.pid}`;
const phoneSendSchedule = new Map();
let stopping = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSafeMps() {
  const configured = Number(env.whatsappDefaultMps || 1);
  return Math.max(0.1, configured);
}

async function waitForPhoneSlot(result) {
  if (!result?.phoneNumberId) return;

  const minIntervalMs = Math.ceil(1000 / getSafeMps());
  const nextAllowedAt = phoneSendSchedule.get(result.phoneNumberId) || 0;
  const waitMs = Math.max(nextAllowedAt - Date.now(), 0);

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  phoneSendSchedule.set(result.phoneNumberId, Date.now() + minIntervalMs);
}

async function runWorker() {
  await connectDatabase();
  console.log(`${workerId} started. Poll=${env.messageWorkerPollMs}ms, MPS=${getSafeMps()}, dailyUniqueLimit=${env.whatsappDailyUniqueLimit}`);

  while (!stopping) {
    try {
      const result = await messageService.processNextQueuedMessage(workerId);

      if (!result) {
        await sleep(env.messageWorkerPollMs);
        continue;
      }

      await waitForPhoneSlot(result);

      if (result.action !== "scheduled") {
        console.log(`${workerId} ${result.action} message ${result.messageId}`);
      }
    } catch (error) {
      console.error(`${workerId} loop error:`, error);
      await sleep(Math.max(env.messageWorkerPollMs, 1000));
    }
  }
}

function shutdown(signal) {
  console.log(`${signal} received. Stopping ${workerId}.`);
  stopping = true;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

runWorker().catch((error) => {
  console.error("Failed to start message queue worker:", error);
  process.exit(1);
});
