const HttpError = require("./httpError");
const metrics = require("../services/metrics.service");

const circuits = new Map();
const DEFAULT_TIMEOUT_MS = 10000;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_MS = 30000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(response, attempt) {
  const retryAfter = response?.headers?.get("retry-after");
  const retryAfterSeconds = Number(retryAfter);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return Math.min(retryAfterSeconds * 1000, 30000);
  }
  const base = Math.min(250 * (2 ** attempt), 5000);
  return base + Math.floor(Math.random() * Math.max(100, base * 0.25));
}

function circuitKeyFor(url, explicitKey) {
  if (explicitKey) return explicitKey;
  try {
    return new URL(url).hostname;
  } catch (error) {
    return "outbound-http";
  }
}

function assertCircuitClosed(key) {
  const circuit = circuits.get(key);
  if (!circuit?.openUntil) return;
  if (circuit.openUntil <= Date.now()) {
    circuits.delete(key);
    return;
  }
  throw new HttpError(503, "Upstream service is temporarily unavailable", {
    code: "UPSTREAM_CIRCUIT_OPEN"
  });
}

function recordSuccess(key) {
  circuits.delete(key);
}

function recordFailure(key) {
  const current = circuits.get(key) || { failures: 0, openUntil: 0 };
  current.failures += 1;
  if (current.failures >= FAILURE_THRESHOLD) {
    current.openUntil = Date.now() + CIRCUIT_OPEN_MS;
  }
  circuits.set(key, current);
}

async function fetchWithPolicy(url, options = {}, policy = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const retries = Number.isInteger(policy.retries)
    ? policy.retries
    : ["GET", "HEAD"].includes(method) ? 2 : 0;
  const timeoutMs = Number(policy.timeoutMs || DEFAULT_TIMEOUT_MS);
  const key = circuitKeyFor(url, policy.circuitKey);
  assertCircuitClosed(key);

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || AbortSignal.timeout(timeoutMs)
      });
      metrics.increment(`outbound.${key}.${Math.floor(response.status / 100)}xx`);

      if (response.status >= 500 || response.status === 429) {
        recordFailure(key);
        if (attempt < retries) {
          await sleep(getRetryDelay(response, attempt));
          continue;
        }
      } else {
        recordSuccess(key);
      }
      return response;
    } catch (error) {
      lastError = error;
      metrics.increment(`outbound.${key}.network_error`);
      recordFailure(key);
      if (attempt < retries) {
        await sleep(getRetryDelay(null, attempt));
        continue;
      }
    }
  }

  throw new HttpError(503, lastError?.name === "TimeoutError"
    ? "Upstream service timed out"
    : "Upstream service could not be reached", {
    code: lastError?.name === "TimeoutError" ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE"
  });
}

module.exports = {
  fetchWithPolicy
};
