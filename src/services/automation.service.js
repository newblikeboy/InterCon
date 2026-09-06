const AutomationFlow = require("../models/AutomationFlow");
const HttpError = require("../utils/httpError");

const TRIGGER_TYPES = ["keyword", "ad_click", "qr_scan", "after_hours", "unknown_reply"];
const ROUTES = ["sales", "support", "billing", "human_agent"];
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
  return nodes.find((node) => ["message", "menu"].includes(node.type) && node.message)?.message || "";
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

  const flow = await AutomationFlow.findOneAndUpdate(
    { _id: flowId, tenantId },
    { $set: payload },
    { returnDocument: "after", runValidators: true }
  );

  if (!flow) {
    throw new HttpError(404, "Automation flow not found");
  }

  return flow;
}

async function updateAutomationStatus(tenantId, flowId, status) {
  if (status === "active") throw new HttpError(501, "Automatic replies are not available yet. This flow remains a draft or paused.");
  if (!["draft", "active", "paused"].includes(status)) {
    throw new HttpError(400, "Invalid automation status");
  }

  const flow = await AutomationFlow.findOneAndUpdate(
    { _id: flowId, tenantId },
    { $set: { status } },
    { returnDocument: "after" }
  );

  if (!flow) {
    throw new HttpError(404, "Automation flow not found");
  }

  return flow;
}

module.exports = {
  listAutomationFlows,
  createAutomationFlow,
  updateAutomationFlow,
  updateAutomationStatus
};
