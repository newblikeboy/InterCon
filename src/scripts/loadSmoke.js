const http = require("http");
const https = require("https");

const target = new URL(process.argv[2] || process.env.LOAD_TEST_URL || "http://localhost:5000/api/health");
const total = Math.max(1, Number(process.env.LOAD_TEST_REQUESTS || 1000));
const concurrency = Math.max(1, Number(process.env.LOAD_TEST_CONCURRENCY || 50));
const transport = target.protocol === "https:" ? https : http;
const agent = new transport.Agent({
  keepAlive: true,
  maxSockets: concurrency,
  maxFreeSockets: concurrency
});
const latencies = [];
let nextRequest = 0;
let errors = 0;

function runOne() {
  return new Promise((resolve) => {
    const start = performance.now();
    const request = transport.request(target, {
      agent,
      method: "GET",
      headers: { Connection: "keep-alive" },
      timeout: 5000
    }, (response) => {
      response.resume();
      response.once("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 400) errors += 1;
        latencies.push(performance.now() - start);
        resolve();
      });
    });
    request.once("timeout", () => request.destroy(new Error("timeout")));
    request.once("error", () => {
      errors += 1;
      latencies.push(performance.now() - start);
      resolve();
    });
    request.end();
  });
}

async function worker() {
  while (true) {
    const index = nextRequest;
    nextRequest += 1;
    if (index >= total) return;
    await runOne();
  }
}

Promise.all(Array.from({ length: Math.min(concurrency, total) }, () => worker()))
  .then(() => {
    agent.destroy();
    latencies.sort((a, b) => a - b);
    const percentile = (value) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] || 0;
    console.log(JSON.stringify({
      target: target.toString(),
      requests: latencies.length,
      errors,
      p50Ms: Number(percentile(0.5).toFixed(2)),
      p95Ms: Number(percentile(0.95).toFixed(2)),
      p99Ms: Number(percentile(0.99).toFixed(2))
    }, null, 2));
    process.exit(errors ? 1 : 0);
  })
  .catch((error) => {
    agent.destroy();
    console.error(error);
    process.exit(1);
  });
