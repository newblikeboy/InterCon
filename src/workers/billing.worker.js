const mongoose = require("mongoose");
const { connectDatabase } = require("../config/database");
const { connectRedis, closeRedis } = require("../config/redis");
const { assertProductionEnvironment } = require("../config/validate");
const { reconcilePendingOrders } = require("../services/billing.service");
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopping = true; });
async function run() {
  assertProductionEnvironment();
  await Promise.all([connectDatabase(), connectRedis()]);
  while (!stopping) {
    try { await reconcilePendingOrders(); } catch (error) { console.error("Billing worker:", error.message); }
    for (let i = 0; i < 60 && !stopping; i++) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  await Promise.allSettled([mongoose.disconnect(), closeRedis()]);
}
run().catch(error => { console.error(error.message); process.exit(1); });
