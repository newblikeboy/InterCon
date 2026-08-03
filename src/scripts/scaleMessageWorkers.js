const { execFile } = require("child_process");
const { promisify } = require("util");
const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const Message = require("../models/Message");

const execFileAsync = promisify(execFile);

const processName = process.env.MESSAGE_WORKER_PM2_NAME || "intercon-worker";
const minWorkers = positiveInt(process.env.MESSAGE_AUTOSCALE_MIN_WORKERS, 2);
const maxWorkers = Math.max(minWorkers, positiveInt(process.env.MESSAGE_AUTOSCALE_MAX_WORKERS, 50));
const messagesPerWorker = positiveInt(process.env.MESSAGE_AUTOSCALE_MESSAGES_PER_WORKER, 100);
const workersPerActivePhone = positiveInt(process.env.MESSAGE_AUTOSCALE_WORKERS_PER_ACTIVE_PHONE, 1);
const checkIntervalMs = positiveInt(process.env.MESSAGE_AUTOSCALE_INTERVAL_MS, 60 * 1000);
const scaleDownIdleMs = positiveInt(process.env.MESSAGE_AUTOSCALE_DOWN_IDLE_MS, 5 * 60 * 1000);

let lastBusyAt = Date.now();
let stopping = false;

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

async function getQueueStats() {
  const now = new Date();
  const readyFilter = {
    status: { $in: ["queued", "scheduled"] },
    nextAttemptAt: { $lte: now }
  };
  const processingFilter = { status: "processing" };

  const [readyCount, processingCount, activePhoneIds] = await Promise.all([
    Message.countDocuments(readyFilter),
    Message.countDocuments(processingFilter),
    Message.distinct("phoneNumberId", {
      $or: [readyFilter, processingFilter],
      phoneNumberId: { $type: "string", $gt: "" }
    })
  ]);

  return {
    readyCount,
    processingCount,
    backlogCount: readyCount + processingCount,
    activePhoneCount: activePhoneIds.length
  };
}

function desiredWorkersFor(stats) {
  if (stats.backlogCount <= 0) return minWorkers;

  lastBusyAt = Date.now();
  const byBacklog = Math.ceil(stats.backlogCount / messagesPerWorker);
  const byPhones = Math.max(1, stats.activePhoneCount * workersPerActivePhone);
  return clamp(Math.max(byBacklog, byPhones, minWorkers), minWorkers, maxWorkers);
}

function applyIdleScaleDown(desired) {
  if (desired > minWorkers) return desired;
  if (Date.now() - lastBusyAt < scaleDownIdleMs) return null;
  return minWorkers;
}

async function getCurrentWorkerCount() {
  const { stdout } = await execFileAsync("pm2", ["jlist"], { timeout: 10 * 1000 });
  const processes = JSON.parse(stdout);
  return processes.filter((processInfo) => (
    processInfo.name === processName
    && processInfo.pm2_env?.status !== "stopped"
    && processInfo.pm2_env?.status !== "errored"
  )).length;
}

async function scaleWorkers(target) {
  await execFileAsync("pm2", ["scale", processName, String(target)], { timeout: 30 * 1000 });
}

async function tick() {
  const stats = await getQueueStats();
  const desired = applyIdleScaleDown(desiredWorkersFor(stats));
  if (!desired) {
    console.log(`[autoscale] backlog=${stats.backlogCount} ready=${stats.readyCount} processing=${stats.processingCount} activePhones=${stats.activePhoneCount} holding before scale down`);
    return;
  }

  const current = await getCurrentWorkerCount();
  if (current === desired) {
    console.log(`[autoscale] workers=${current} backlog=${stats.backlogCount} ready=${stats.readyCount} processing=${stats.processingCount} activePhones=${stats.activePhoneCount}`);
    return;
  }

  await scaleWorkers(desired);
  console.log(`[autoscale] scaled ${processName} ${current} -> ${desired}; backlog=${stats.backlogCount} ready=${stats.readyCount} processing=${stats.processingCount} activePhones=${stats.activePhoneCount}`);
}

function shutdown(signal) {
  console.log(`${signal} received. Stopping message worker autoscaler.`);
  stopping = true;
}

async function main() {
  await connectDatabase();
  console.log(`[autoscale] started for ${processName}; min=${minWorkers}, max=${maxWorkers}, messagesPerWorker=${messagesPerWorker}, intervalMs=${checkIntervalMs}`);

  while (!stopping) {
    try {
      await tick();
    } catch (error) {
      console.error("[autoscale] tick failed:", error.message);
    }
    await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main()
  .catch((error) => {
    console.error("Message worker autoscaler failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (stopping) await mongoose.disconnect().catch(() => null);
  });
