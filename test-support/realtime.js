const { WebSocket } = require("ws");
const http = require("http");
const { once } = require("events");
const env = require("../src/config/env");
const realtime = require("../src/services/realtime.service");

async function startRealtime(t) {
  const server = http.createServer();
  const clients = [];
  await realtime.initRealtime(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = "ws://127.0.0.1:" + server.address().port + "/ws";
  t.after(async () => {
    for (const ws of clients) ws.terminate();
    await realtime.closeRealtime();
    await new Promise(resolve => server.close(resolve));
  });
  return {
    async connect(token, options = {}) {
      const ws = new WebSocket(url + (options.query || ""), {
        headers: { Origin: env.clientOrigin, Cookie: env.authCookieName + "=" + token, ...options.headers }
      });
      clients.push(ws);
      const [message] = await once(ws, "message", { signal: AbortSignal.timeout(5000) });
      if (JSON.parse(message).type !== "connected") throw new Error("Missing connection acknowledgement");
      return ws;
    },
    async rejected(token, options = {}) {
      const headers = { Cookie: env.authCookieName + "=" + token, ...options.headers };
      const ws = new WebSocket(url + (options.query || ""), { headers });
      clients.push(ws);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Handshake did not complete")), 5000);
        ws.once("unexpected-response", (req, res) => {
          clearTimeout(timer); res.resume(); ws.terminate(); resolve(res.statusCode);
        });
        ws.once("open", () => { clearTimeout(timer); reject(new Error("Forbidden socket unexpectedly opened")); });
        ws.on("error", () => {});
      });
    }
  };
}
module.exports = { startRealtime };
