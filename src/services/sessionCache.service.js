const User = require("../models/User");
const { getRedisClient } = require("../config/redis");

const localCache = new Map();
const TTL_SECONDS = 10;

function serializeUser(user) {
  return {
    _id: String(user._id),
    tenantId: String(user.tenantId),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    status: user.status,
    sessionVersion: Number(user.sessionVersion || 0)
  };
}

async function getUser(userId) {
  const key = `intercon:session-user:${userId}`;
  const redis = getRedisClient();
  if (redis?.isReady) {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } else {
    const cached = localCache.get(key);
    if (cached?.expiresAt > Date.now()) return cached.user;
  }

  const user = await User.findById(userId).select("-passwordHash +sessionVersion").lean();
  if (!user) return null;
  const publicUser = serializeUser(user);
  if (redis?.isReady) {
    await redis.set(key, JSON.stringify(publicUser), { EX: TTL_SECONDS });
  } else {
    localCache.set(key, { user: publicUser, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }
  return publicUser;
}

async function invalidateUser(userId) {
  const key = `intercon:session-user:${userId}`;
  localCache.delete(key);
  const redis = getRedisClient();
  if (redis?.isReady) await redis.del(key);
}

module.exports = {
  getUser,
  invalidateUser
};
