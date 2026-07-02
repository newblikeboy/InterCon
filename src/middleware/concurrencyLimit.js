const { acquireLease, releaseLease } = require("../services/distributedLimit.service");
const HttpError = require("../utils/httpError");

function concurrencyLimit({ namespace, max, ttlMs, methods = ["POST"] }) {
  const allowedMethods = new Set(methods);
  return async function limitConcurrentRequests(req, res, next) {
    if (!allowedMethods.has(req.method)) return next();

    const owner = req.tenantId ? String(req.tenantId) : req.ip;
    const key = `${namespace}:${owner}`;
    const leaseId = req.id;
    try {
      const acquired = await acquireLease(key, leaseId, max, ttlMs);
      if (!acquired) {
        return next(new HttpError(429, "Too many concurrent operations. Wait for the current operation to finish."));
      }
    } catch (error) {
      return next(error);
    }

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      releaseLease(key, leaseId).catch(() => {});
    };
    res.once("finish", release);
    res.once("close", release);
    return next();
  };
}

module.exports = concurrencyLimit;
