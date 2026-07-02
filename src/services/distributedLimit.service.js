const { getRedisClient } = require("../config/redis");

const localSlots = new Map();
const localLeases = new Map();

const SLOT_SCRIPT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local now = tonumber(ARGV[1])
local interval = tonumber(ARGV[2])
if current > now then
  return current - now
end
redis.call("SET", KEYS[1], now + interval, "PX", math.max(interval * 10, 60000))
return 0
`;

const DAILY_SCRIPT = `
local cutoff = tonumber(ARGV[1])
local now = tonumber(ARGV[2])
local recipient = ARGV[3]
local limit = tonumber(ARGV[4])
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", cutoff)
if redis.call("ZSCORE", KEYS[1], recipient) then
  redis.call("ZADD", KEYS[1], now, recipient)
  redis.call("EXPIRE", KEYS[1], 172800)
  return 1
end
if redis.call("ZCARD", KEYS[1]) >= limit then
  return 0
end
redis.call("ZADD", KEYS[1], now, recipient)
redis.call("EXPIRE", KEYS[1], 172800)
return 2
`;

const LEASE_SCRIPT = `
local now = tonumber(ARGV[1])
local expires = tonumber(ARGV[2])
local leaseId = ARGV[3]
local limit = tonumber(ARGV[4])
redis.call("ZREMRANGEBYSCORE", KEYS[1], "-inf", now)
if redis.call("ZCARD", KEYS[1]) >= limit then
  return 0
end
redis.call("ZADD", KEYS[1], expires, leaseId)
redis.call("PEXPIRE", KEYS[1], math.max(expires - now, 1000))
return 1
`;

async function acquireSlot(key, intervalMs) {
  const redis = getRedisClient();
  const now = Date.now();
  if (redis?.isReady) {
    return Number(await redis.eval(SLOT_SCRIPT, {
      keys: [`intercon:slot:${key}`],
      arguments: [String(now), String(Math.max(1, intervalMs))]
    }));
  }

  const current = localSlots.get(key) || 0;
  if (current > now) return current - now;
  localSlots.set(key, now + intervalMs);
  return 0;
}

async function reserveDailyRecipient(key, recipient, limit) {
  const redis = getRedisClient();
  if (!redis?.isReady) return null;
  const now = Date.now();
  const result = Number(await redis.eval(DAILY_SCRIPT, {
    keys: [`intercon:daily:${key}`],
    arguments: [
      String(now - 24 * 60 * 60 * 1000),
      String(now),
      String(recipient),
      String(limit)
    ]
  }));
  return {
    allowed: result > 0,
    newlyReserved: result === 2
  };
}

async function releaseDailyRecipient(key, recipient) {
  const redis = getRedisClient();
  if (redis?.isReady) {
    await redis.zRem(`intercon:daily:${key}`, String(recipient));
  }
}

async function acquireLease(key, leaseId, limit, ttlMs) {
  const redis = getRedisClient();
  const now = Date.now();
  if (redis?.isReady) {
    const result = await redis.eval(LEASE_SCRIPT, {
      keys: [`intercon:lease:${key}`],
      arguments: [String(now), String(now + ttlMs), String(leaseId), String(limit)]
    });
    return Number(result) === 1;
  }

  const leases = localLeases.get(key) || new Map();
  for (const [id, expiresAt] of leases) {
    if (expiresAt <= now) leases.delete(id);
  }
  if (leases.size >= limit) return false;
  leases.set(leaseId, now + ttlMs);
  localLeases.set(key, leases);
  return true;
}

async function releaseLease(key, leaseId) {
  const redis = getRedisClient();
  if (redis?.isReady) {
    await redis.zRem(`intercon:lease:${key}`, String(leaseId));
    return;
  }
  const leases = localLeases.get(key);
  leases?.delete(leaseId);
  if (leases && !leases.size) localLeases.delete(key);
}

module.exports = {
  acquireLease,
  acquireSlot,
  releaseDailyRecipient,
  releaseLease,
  reserveDailyRecipient
};
