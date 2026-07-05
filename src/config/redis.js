const { createClient } = require("redis");
const env = require("./env");

let client = null;
let connectPromise = null;

const REDIS_CONNECT_TIMEOUT_MS = 10 * 1000;

function getRedisClient() {
  if (!env.redisUrl) return null;
  if (!client) {
    client = createClient({ url: env.redisUrl });
    client.on("error", (error) => {
      console.error("Redis error:", error.message);
    });
  }
  return client;
}

async function connectRedis() {
  const redis = getRedisClient();
  if (!redis) return null;
  if (redis.isReady) return redis;
  if (!connectPromise) {
    connectPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Redis is not reachable (timed out after ${REDIS_CONNECT_TIMEOUT_MS / 1000}s). Start the Redis server behind REDIS_URL, or remove REDIS_URL from .env to run without Redis.`));
      }, REDIS_CONNECT_TIMEOUT_MS);
      timer.unref();
      redis.connect().then(
        () => {
          clearTimeout(timer);
          console.log("Redis connected");
          resolve(redis);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      );
    }).finally(() => {
      connectPromise = null;
    });
  }
  return connectPromise;
}

async function closeRedis() {
  if (client?.isOpen) await client.quit();
}

module.exports = {
  closeRedis,
  connectRedis,
  getRedisClient
};
