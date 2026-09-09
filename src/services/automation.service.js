const AutomationFlow = require("../models/AutomationFlow");
const Conversation = require("../models/Conversation");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");
const { requirePlatformAccess } = require("./platformAccess.service");

const TRIGGER_TYPES = ["keyword", "ad_click", "qr_scan", "after_hours", "unknown_reply"];
const ROUTES = ["sales", "support", "billing", "human_agent"];
const { validateLiveFlow, buildPlan } = require("./automationEngine");
const { runAutomationForInboundMessage } = require("./automationQueue.service");
const NODE_TYPES = ["trigger", "message", "menu", "handoff"];

function normalizeBooleanFlag(value) {
  return value !== false && value !== "false" && value !== "off";
}

function normalizeNodeId(value, fallback) {
  return String(value || fallback || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function normalizeNodes(nodes = []) {
  if (!Array.isArray(nodes)) return [];
  if (nodes.length > 40) throw new HttpError(400, "A chatbot flow can have up to 40 nodes");

  const ids = new Set();
  const normalized = nodes.map((node, index) => {
    const type = String(node?.type || "").trim();
    if (!NODE_TYPES.includes(type)) throw new HttpError(400, "Invalid chatbot node type");

    const id = normalizeNodeId(node?.id, `node_${index + 1}`);
    if (!id) throw new HttpError(400, "Each chatbot node needs an id");
    if (ids.has(id)) throw new HttpError(400, "Each chatbot node id must be unique");
    ids.add(id);

    const routeTo = String(node?.routeTo || node?.route_to || "human_agent").trim();
    if (!ROUTES.includes(routeTo)) throw new HttpError(400, "Invalid handoff route");

    if (Array.isArray(node?.options) && node.options.length > 8) throw new HttpError(400, "A menu can have up to 8 options");
    const options = Array.isArray(node?.options)
      ? node.options.slice(0, 8).map((option) => ({
          label: String(option?.label || "").trim().slice(0, 80),
          nextNodeId: normalizeNodeId(option?.nextNodeId || option?.next_node_id || "")
        })).filter((option) => option.label)
      : [];

    return {
      id,
      type,
      title: String(node?.title || "").trim().slice(0, 140),
      nextNodeId: normalizeNodeId(node?.nextNodeId || node?.next_node_id || ""),
      keyword: String(node?.keyword || "").trim().slice(0, 120),
      message: String(node?.message || "").trim().slice(0, 900),
      routeTo,
      options,
      position: {
        x: Math.max(0, Math.min(5000, Number(node?.position?.x || 0))),
        y: Math.max(0, Math.min(5000, Number(node?.position?.y || 0)))
      }
    };
  });

  if (normalized.length && !normalized.some((node) => node.type === "trigger")) {
    throw new HttpError(400, "A chatbot flow needs a trigger node");
  }

  return normalized;
}

function normalizeEdges(edges = [], nodes = []) {
  if (!Array.isArray(edges)) return [];
  if (edges.length > 80) throw new HttpError(400, "A chatbot flow can have up to 80 connections");

  const nodeIds = new Set(nodes.map((node) => node.id));
  const pairs = new Set();
  return edges.map((edge) => {
    const from = normalizeNodeId(edge?.from);
    const to = normalizeNodeId(edge?.to);
    if (!from || !to || !nodeIds.has(from) || !nodeIds.has(to)) {
      throw new HttpError(400, "Every chatbot connection must point to an existing node");
    }
    const pair = `${from}:${to}:${String(edge?.label || "").trim()}`;
    if (pairs.has(pair)) return null;
    pairs.add(pair);
    return {
      from,
      to,
      label: String(edge?.label || "").trim().slice(0, 80)
    };
  }).filter(Boolean);
}

function deriveFirstReply(body, nodes) {
  const explicit = String(body.firstReply || body.first_reply || "").trim();
  if (explicit) return explicit;
  return nodes.find((node) => ["message", "menu", "handoff"].includes(node.type) && node.message)?.message || "";
}

function normalizeAutomation(body = {}) {
  const nodes = normalizeNodes(body.nodes);
  const edges = normalizeEdges(body.edges, nodes);
  const routeTo = String(body.routeTo || body.route_to || "human_agent").trim();

  return {
    name: String(body.name || "").trim(),
    triggerType: String(body.triggerType || body.trigger_type || "").trim(),
    triggerValue: String(body.triggerValue || body.trigger_value || "").trim(),
    firstReply: deriveFirstReply(body, nodes),
    nodes,
    edges,
    routeTo,
    controls: {
      stopOnAgentJoin: normalizeBooleanFlag(body.stopOnAgentJoin),
      respectServiceWindow: normalizeBooleanFlag(body.respectServiceWindow),
      requireOptInForTemplate: normalizeBooleanFlag(body.requireOptInForTemplate),
      fallbackForUnknownReply: normalizeBooleanFlag(body.fallbackForUnknownReply)
    }
  };
}

async function clearAutomationConversations(tenantId, flowIds, session) {
  const ids = (Array.isArray(flowIds) ? flowIds : [flowIds]).filter(Boolean);
  if (!ids.length) return;
  await Conversation.updateMany(
    { tenantId, "automation.flowId": { $in: ids }, "automationControl.held": { $ne: true }, "automation.status": { $ne: "handoff" } },
    { $set: {
      "automation.snapshot": null,
      "automation.currentNodeId": "",
      "automation.status": "idle",
      "automation.routeTo": "",
      "automation.updatedAt": new Date()
    } }, { session }
  );
}

async function listAutomationFlows(tenantId) {
  return AutomationFlow.find({ tenantId }).sort({ createdAt: -1 }).limit(100);
}

async function createAutomationFlow(tenantId, body) {
  const payload = normalizeAutomation(body);

  if (!payload.name || !payload.triggerType || !payload.firstReply) {
    throw new HttpError(400, "Flow name, trigger type, and first reply are required");
  }

  if (!TRIGGER_TYPES.includes(payload.triggerType)) {
    throw new HttpError(400, "Invalid automation trigger");
  }

  if (!ROUTES.includes(payload.routeTo)) {
    throw new HttpError(400, "Invalid handoff route");
  }

  return AutomationFlow.create({
    tenantId,
    ...payload
  });
}

async function updateAutomationFlow(tenantId, flowId, body) {
  const payload = normalizeAutomation(body);

  if (!payload.name || !payload.triggerType || !payload.firstReply) {
    throw new HttpError(400, "Flow name, trigger type, and first reply are required");
  }

  if (!TRIGGER_TYPES.includes(payload.triggerType)) {
    throw new HttpError(400, "Invalid automation trigger");
  }

  if (!ROUTES.includes(payload.routeTo)) {
    throw new HttpError(400, "Invalid handoff route");
  }

  const existing = await AutomationFlow.findOne({ _id: flowId, tenantId });
  if (!existing) throw new HttpError(404, "Automation flow not found");
  if (existing.status === "active") validateLiveFlow(payload);

  const flow = await AutomationFlow.findOneAndUpdate(
    { _id: flowId, tenantId, __v: existing.__v, status: existing.status },
    { $set: payload, $inc: { __v: 1 } },
    { returnDocument: "after", runValidators: true }
  );

  if (!flow) {
    throw new HttpError(409, "Flow changed while saving. Reload it and try again.");
  }

  return flow;
}

async function updateAutomationStatus(tenantId, flowId, status) {
  if (!["draft", "active", "paused"].includes(status)) {
    throw new HttpError(400, "Invalid automation status");
  }

  if (status === "active") return activateAutomationFlow(tenantId, flowId);

  const flow = await AutomationFlow.findOneAndUpdate(
    { _id: flowId, tenantId },
    { $set: { status }, $inc: { __v: 1 } },
    { returnDocument: "after" }
  );

  if (!flow) {
    throw new HttpError(404, "Automation flow not found");
  }

  await clearAutomationConversations(tenantId, flow._id);
  return flow;
}

async function activateAutomationFlow(tenantId, flowId) {
  const [tenant, flow] = await Promise.all([
    Tenant.findById(tenantId).select("+meta.accessToken status billing trial meta.phoneNumberId"),
    AutomationFlow.findOne({ _id: flowId, tenantId })
  ]);

  if (!tenant) throw new HttpError(404, "Tenant not found");
  if (!flow) throw new HttpError(404, "Automation flow not found");
  await requirePlatformAccess(tenantId, { tenant });
  if (!tenant.meta?.phoneNumberId || !tenant.getMetaAccessToken()) {
    throw new HttpError(409, "Connect WhatsApp before launching a chatbot");
  }

  const session = await AutomationFlow.startSession();
  let activated;
  try {
    await session.withTransaction(async () => {
      // A tenant write serializes simultaneous launches, including two draft flows.
      await Tenant.updateOne({ _id: tenantId }, { $inc: { __v: 1 } }, { session });
      const current = await AutomationFlow.findOne({ _id: flowId, tenantId }).session(session);
      if (!current) throw new HttpError(404, "Automation flow not found");
      validateLiveFlow(current);
      const others = await AutomationFlow.find({ tenantId, _id: { $ne: current._id }, status: "active" }).select("_id").session(session).lean();
      await AutomationFlow.updateMany({ tenantId, _id: { $ne: current._id }, status: "active" }, { $set: { status: "paused" }, $inc: { __v: 1 } }, { session });
      await clearAutomationConversations(tenantId, others.map(item => item._id), session);
      activated = await AutomationFlow.findOneAndUpdate({ _id: current._id, tenantId }, { $set: { status: "active" }, $inc: { __v: 1 } }, { session, returnDocument: "after" });
    });
  } finally { await session.endSession(); }
  return activated;
}

async function simulateAutomation(tenantId, body = {}) {
  let flow;
  if (body.flow) flow = normalizeAutomation(body.flow);
  else flow = await AutomationFlow.findOne({ _id: body.flowId, tenantId }).lean();
  if (!flow) throw new HttpError(404, "Automation flow not found");
  flow._id = flow._id || "simulation";
  validateLiveFlow(flow);
  if (!Array.isArray(body.messages) || body.messages.length > 50 || body.messages.some(text => typeof text !== "string" || text.length > 4096)) {
    throw new HttpError(400, "Provide up to 50 customer messages to simulate");
  }
  let state = {};
  const turns = body.messages.map(text => {
    const plan = buildPlan({ flows: [flow], state, text });
    if (plan.state) state = plan.state;
    return { input: text, action: plan.action, replies: plan.messages.map(step => step.text), nodeId: plan.nodeId, status: state.status || "idle" };
  });
  return { turns };
}

async function listExecutions(tenantId, query = {}) {
  const filter = { tenantId };
  const mongoose = require("mongoose");
  for (const key of ["flowId", "conversationId"]) {
    if (query[key]) {
      if (!mongoose.Types.ObjectId.isValid(query[key])) throw new HttpError(400, "Invalid diagnostic filter");
      filter[key] = query[key];
    }
  }
  const records = await require("../models/AutomationExecution").find(filter).sort({ createdAt: -1 }).limit(100)
    .select("conversationId flowId text status action attempts error createdAt completedAt nextAttemptAt").lean();
  const replies = await require("../models/InboxMessage").find({ tenantId, automationExecutionId: { $in: records.map(record => record._id) } })
    .select("automationExecutionId status error").lean();
  return records.map(record => {
    const sent = replies.filter(reply => String(reply.automationExecutionId) === String(record._id));
    const failed = sent.find(reply => reply.status === "failed");
    return { ...record,
      deliveryStatus: failed ? "failed" : sent.length ? sent.every(reply => reply.status === "read") ? "read" : sent.every(reply => ["read", "delivered"].includes(reply.status)) ? "delivered" : "sent" : "",
      deliveryError: failed?.error || ""
    };
  });
}

module.exports = {
  simulateAutomation,
  listExecutions,
  listAutomationFlows,
  createAutomationFlow,
  updateAutomationFlow,
  updateAutomationStatus,
  activateAutomationFlow,
  runAutomationForInboundMessage
};
