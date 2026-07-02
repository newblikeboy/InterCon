const { createClient } = require("redis");
const env = require("./env");

let client = null;
let connectPromise = null;

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
    connectPromise = redis.connect()
      .then(() => {
        console.log("Redis connected");
        return redis;
      })
      .finally(() => {
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
