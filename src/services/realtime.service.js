const { WebSocket, WebSocketServer } = require("ws");
const env = require("../config/env");
const User = require("../models/User");
const Tenant = require("../models/Tenant");
const { verifyAuthToken } = require("./authToken.service");
const { getRedisClient } = require("../config/redis");
const instanceId = require("crypto").randomUUID();
const channel = "intercon:realtime:inbox";
const MAX_CONNECTIONS = 10000;
const MAX_USER_CONNECTIONS = 10;
const MAX_PENDING_UPGRADES = 64;
const MAX_BUFFERED_BYTES = 64 * 1024;
const actions = new Set(["message_received", "message_sent", "message_updated", "status_updated", "automation_updated"]);
const statuses = new Set(["sent", "delivered", "read", "failed"]);
const isId = value => /^[a-f0-9]{24}$/i.test(String(value || ""));
const tenants = new Map();
let wss = null, subscriber = null, heartbeatTimer = null, heartbeatRunning = false;
let pendingUpgrades = 0, upgradeServer = null, upgradeHandler = null;

function isAllowedOrigin(request) {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || !origin || origin === "null") return false;
  const allowed = new Set();
  if (env.clientOrigin) allowed.add(env.clientOrigin.replace(/\/$/, ""));
  if (env.nodeEnv !== "production") {
    allowed.add("http://localhost:" + env.port);
    allowed.add("http://127.0.0.1:" + env.port);
  }
  // Never infer trust from the request Host or forwarded headers.
  return allowed.has(origin);
}

function readAuthCookie(header) {
  const parts = String(header || "").split(";").map(part => part.trim());
  const matches = parts.filter(part => part.startsWith(env.authCookieName + "="));
  if (matches.length !== 1) return null;
  try { return decodeURIComponent(matches[0].slice(env.authCookieName.length + 1)); }
  catch { return null; }
}

function matchesSession(user, auth) {
  return user && user.status === "active" && user.isVerified === true
    && String(user.tenantId) === auth.tenantId
    && Number(user.sessionVersion || 0) === auth.sessionVersion
    && auth.expiresAt > Date.now();
}

async function authenticateUpgrade(request) {
  const token = readAuthCookie(request.headers.cookie);
  if (!token) return null;
  let payload;
  try { payload = verifyAuthToken(token); } catch { return null; }
  if (!isId(payload.sub) || !isId(payload.tenantId) || !Number.isFinite(payload.exp)) return null;
  const auth = { userId: String(payload.sub), tenantId: String(payload.tenantId), sessionVersion: Number(payload.sv || 0), expiresAt: payload.exp * 1000 };
  const [user, tenant] = await Promise.all([
    User.findById(auth.userId).select("tenantId status isVerified +sessionVersion").maxTimeMS(3000).lean(),
    Tenant.exists({ _id: auth.tenantId, status: "active" }).maxTimeMS(3000)
  ]);
  return tenant && matchesSession(user, auth) ? auth : null;
}

function closeClient(ws, code = 1008, reason = "Session ended") {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.close(code, reason);
  // A peer that ignores the close handshake cannot retain a slot indefinitely.
  ws.closeTimer = setTimeout(() => ws.terminate(), 1000);
  ws.closeTimer.unref();
}

function addClient(ws, auth) {
  ws.auth = auth;
  ws.isAlive = true;
  if (!tenants.has(auth.tenantId)) tenants.set(auth.tenantId, new Set());
  tenants.get(auth.tenantId).add(ws);
  ws.expiryTimer = setTimeout(() => closeClient(ws), Math.min(2147483647, Math.max(1, auth.expiresAt - Date.now())));
  ws.expiryTimer.unref();
  ws.on("pong", () => { ws.isAlive = true; });
  // This socket only carries server notifications. Mutations stay behind the
  // existing authenticated, origin-checked HTTP routes; clients cannot subscribe
  // to another tenant or publish a message by sending a socket frame.
  ws.on("message", () => closeClient(ws, 1008, "Client messages are not supported"));
  ws.on("error", () => ws.terminate());
  ws.on("close", () => {
    clearTimeout(ws.expiryTimer); clearTimeout(ws.closeTimer);
    const clients = tenants.get(auth.tenantId);
    clients?.delete(ws);
    if (clients && !clients.size) tenants.delete(auth.tenantId);
  });
  ws.send(JSON.stringify({ type: "connected", at: new Date().toISOString() }));
}

async function authorizedClients(tenantId) {
  const clients = [...(tenants.get(tenantId) || [])].filter(ws => ws.readyState === WebSocket.OPEN);
  if (!clients.length) return [];
  try {
    // Read current authorization before delivery. A cached login must not keep
    // receiving events after suspension, logout, or a password reset.
    const [users, tenant] = await Promise.all([
      User.find({ _id: { $in: [...new Set(clients.map(ws => ws.auth.userId))] } })
        .select("tenantId status isVerified +sessionVersion").maxTimeMS(3000).lean(),
      Tenant.exists({ _id: tenantId, status: "active" }).maxTimeMS(3000)
    ]);
    const byId = new Map(users.map(user => [String(user._id), user]));
    return clients.filter(ws => {
      if (tenant && matchesSession(byId.get(ws.auth.userId), ws.auth) && ws.readyState === WebSocket.OPEN) return true;
      closeClient(ws); return false;
    });
  } catch {
    for (const ws of clients) closeClient(ws, 1011, "Session verification unavailable");
    return [];
  }
}

function sanitizeEvent(event) {
  if (!event || !actions.has(event.action) || !isId(event.conversationId)) return null;
  const safe = { type: "inbox:updated", action: event.action, conversationId: String(event.conversationId) };
  if (isId(event.messageId)) safe.messageId = String(event.messageId);
  if (event.action === "status_updated") {
    if (!safe.messageId || !statuses.has(event.status)) return null;
    safe.status = event.status;
  }
  return safe;
}

async function deliverTenantEvent(tenantId, event) {
  if (!isId(tenantId)) return;
  const safe = sanitizeEvent(event);
  if (!safe) return;
  const clients = await authorizedClients(String(tenantId));
  const payload = JSON.stringify({ ...safe, at: new Date().toISOString() });
  for (const ws of clients) {
    if (ws.readyState !== WebSocket.OPEN || ws.auth.expiresAt <= Date.now()) continue;
    if (ws.bufferedAmount > MAX_BUFFERED_BYTES) { closeClient(ws, 1013, "Reconnect to refresh inbox"); continue; }
    ws.send(payload, error => { if (error) ws.terminate(); });
  }
}

function closeUserConnections(userId) {
  for (const clients of tenants.values()) {
    for (const ws of clients) if (ws.auth.userId === String(userId)) closeClient(ws);
  }
}

async function publishEnvelope(envelope) {
  const redis = getRedisClient();
  if (redis?.isReady) {
    try { await redis.publish(channel, JSON.stringify({ source: instanceId, ...envelope })); }
    catch { console.error("Realtime Redis publish failed; clients will recover through polling."); }
  }
}

async function revokeUserSessions(userId) {
  if (!isId(userId)) return;
  closeUserConnections(String(userId));
  await publishEnvelope({ type: "session:revoked", userId: String(userId) });
}

async function publishInboxUpdated(tenantId, details = {}) {
  const event = sanitizeEvent(details);
  if (!isId(tenantId) || !event) return;
  await Promise.all([
    deliverTenantEvent(String(tenantId), event),
    publishEnvelope({ type: "inbox:updated", tenantId: String(tenantId), event })
  ]);
}

async function initRealtime(server) {
  if (wss) return wss;
  const redis = getRedisClient();
  if (redis) {
    subscriber = redis.duplicate();
    subscriber.on("error", () => console.error("Realtime Redis subscription unavailable."));
    await subscriber.connect();
    await subscriber.subscribe(channel, raw => {
      if (typeof raw !== "string" || Buffer.byteLength(raw) > 4096) return;
      try {
        const envelope = JSON.parse(raw);
        if (envelope.source === instanceId) return;
        if (envelope.type === "session:revoked" && isId(envelope.userId)) closeUserConnections(envelope.userId);
        else if (envelope.type === "inbox:updated") void deliverTenantEvent(envelope.tenantId, envelope.event);
      } catch { /* Malformed bus events never reach a browser. */ }
    });
  }
  wss = new WebSocketServer({ noServer: true, maxPayload: 1024, maxFragments: 64, maxBufferedChunks: 64, perMessageDeflate: false });
  upgradeServer = server;
  upgradeHandler = async (request, socket, head) => {
    const reject = code => socket.end("HTTP/1.1 " + code + "\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
    // No query credentials, room names, or client-supplied tenant selection.
    if (request.url !== "/ws") return reject("404 Not Found");
    if (!isAllowedOrigin(request)) return reject("403 Forbidden");
    if (!wss || pendingUpgrades >= MAX_PENDING_UPGRADES || wss.clients.size >= MAX_CONNECTIONS) return reject("503 Service Unavailable");
    pendingUpgrades++;
    const deadline = setTimeout(() => socket.destroy(), 5000);
    deadline.unref();
    try {
      const auth = await authenticateUpgrade(request);
      if (socket.destroyed || !wss) return;
      if (!auth) return reject("401 Unauthorized");
      const userConnections = [...(tenants.get(auth.tenantId) || [])].filter(ws => ws.auth.userId === auth.userId).length;
      if (userConnections >= MAX_USER_CONNECTIONS) return reject("429 Too Many Requests");
      if (wss.clients.size >= MAX_CONNECTIONS) return reject("503 Service Unavailable");
      wss.handleUpgrade(request, socket, head, ws => { addClient(ws, auth); wss.emit("connection", ws, request); });
    } catch { if (!socket.destroyed) reject("401 Unauthorized"); }
    finally { pendingUpgrades--; clearTimeout(deadline); }
  };
  server.on("upgrade", upgradeHandler);
  heartbeatTimer = setInterval(async () => {
    if (heartbeatRunning) return;
    heartbeatRunning = true;
    try {
      for (const tenantId of [...tenants.keys()]) {
        for (const ws of await authorizedClients(tenantId)) {
          if (!ws.isAlive) { ws.terminate(); continue; }
          ws.isAlive = false; ws.ping();
        }
      }
    } finally { heartbeatRunning = false; }
  }, 15000);
  heartbeatTimer.unref();
  return wss;
}

async function closeRealtime() {
  clearInterval(heartbeatTimer); heartbeatTimer = null;
  if (upgradeHandler) upgradeServer?.removeListener("upgrade", upgradeHandler);
  upgradeHandler = null; upgradeServer = null;
  if (wss) { for (const ws of wss.clients) ws.terminate(); wss.close(); wss = null; }
  tenants.clear();
  if (subscriber?.isOpen) await subscriber.quit();
  subscriber = null;
}

module.exports = { closeRealtime, initRealtime, publishInboxUpdated, revokeUserSessions };
