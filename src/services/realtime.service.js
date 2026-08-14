const { WebSocket, WebSocketServer } = require("ws");
const env = require("../config/env");
const { verifyAuthToken } = require("./authToken.service");
const sessionCache = require("./sessionCache.service");

const tenants = new Map();
let wss = null;
let heartbeatTimer = null;

function parseCookies(header = "") {
  function decodeCookiePart(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separator = part.indexOf("=");
      if (separator === -1) return cookies;
      const key = decodeCookiePart(part.slice(0, separator).trim());
      const value = decodeCookiePart(part.slice(separator + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host = request.headers.host || "";
    if (originUrl.host === host) return true;
    if (env.clientOrigin && origin === env.clientOrigin) return true;
  } catch (error) {
    return false;
  }

  return false;
}

async function authenticateUpgrade(request) {
  if (!isAllowedOrigin(request)) return null;

  const cookies = parseCookies(request.headers.cookie || "");
  const token = cookies[env.authCookieName];
  if (!token) return null;

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch (error) {
    return null;
  }

  const user = await sessionCache.getUser(payload.sub);
  if (
    !user
    || user.status !== "active"
    || Number(payload.sv || 0) !== Number(user.sessionVersion || 0)
    || String(payload.tenantId) !== String(user.tenantId)
  ) {
    return null;
  }

  return user;
}

function addClient(ws, user) {
  const tenantId = String(user.tenantId);
  ws.tenantId = tenantId;
  ws.isAlive = true;

  if (!tenants.has(tenantId)) tenants.set(tenantId, new Set());
  tenants.get(tenantId).add(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => {
    const clients = tenants.get(tenantId);
    if (!clients) return;
    clients.delete(ws);
    if (!clients.size) tenants.delete(tenantId);
  });

  ws.send(JSON.stringify({
    type: "connected",
    at: new Date().toISOString()
  }));
}

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const clients of tenants.values()) {
      for (const ws of clients) {
        if (!ws.isAlive) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }
  }, 30000);
  heartbeatTimer.unref();
}

function initRealtime(server) {
  if (wss) return wss;

  wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", async (request, socket, head) => {
    let pathname = "";
    try {
      pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
    } catch (error) {
      socket.destroy();
      return;
    }

    if (pathname !== "/ws") return;

    let user = null;
    try {
      user = await authenticateUpgrade(request);
    } catch (error) {
      user = null;
    }
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      addClient(ws, user);
      wss.emit("connection", ws, request);
    });
  });

  startHeartbeat();
  return wss;
}

function publishTenantEvent(tenantId, event) {
  const clients = tenants.get(String(tenantId));
  if (!clients?.size) return;

  const payload = JSON.stringify({
    ...event,
    at: new Date().toISOString()
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

function publishInboxUpdated(tenantId, details = {}) {
  publishTenantEvent(tenantId, {
    type: "inbox:updated",
    ...details
  });
}

function closeRealtime() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (wss) {
    wss.close();
    wss = null;
  }
  tenants.clear();
}

module.exports = {
  closeRealtime,
  initRealtime,
  publishInboxUpdated
};
