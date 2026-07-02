const counters = new Map();
const timings = new Map();

function increment(name, amount = 1) {
  counters.set(name, (counters.get(name) || 0) + amount);
}

function observe(name, milliseconds) {
  const current = timings.get(name) || { count: 0, totalMs: 0, maxMs: 0 };
  current.count += 1;
  current.totalMs += milliseconds;
  current.maxMs = Math.max(current.maxMs, milliseconds);
  timings.set(name, current);
}

function routeKey(req) {
  const path = req.path
    .split("/")
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => (
      /^[a-f0-9]{24}$/i.test(part) || /^[0-9a-f-]{30,}$/i.test(part) || /^\d{6,}$/.test(part)
        ? ":id"
        : part
    ))
    .join(".");
  return `${req.method}.${path || "root"}`;
}

function middleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.once("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    const key = routeKey(req);
    increment(`http.${key}.${Math.floor(res.statusCode / 100)}xx`);
    observe(`http.${key}`, elapsedMs);
  });
  next();
}

function snapshot() {
  return {
    counters: Object.fromEntries(counters),
    timings: Object.fromEntries(
      [...timings.entries()].map(([key, value]) => [
        key,
        {
          count: value.count,
          averageMs: value.count ? Number((value.totalMs / value.count).toFixed(2)) : 0,
          maxMs: Number(value.maxMs.toFixed(2))
        }
      ])
    ),
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      memory: process.memoryUsage()
    }
  };
}

module.exports = {
  increment,
  middleware,
  observe,
  snapshot
};
