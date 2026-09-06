const AutomationFlow = require("../models/AutomationFlow");
const Conversation = require("../models/Conversation");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");
const { requirePlatformAccess } = require("./platformAccess.service");
const inboxService = require("./inbox.service");

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

function normalizeText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function nodeMap(flow) {
  return new Map((flow.nodes || []).map((node) => [node.id, node]));
}

function outgoingEdges(flow, nodeId) {
  return (flow.edges || []).filter((edge) => edge.from === nodeId);
}

function findFirstReplyNode(flow) {
  const trigger = (flow.nodes || []).find((node) => node.type === "trigger");
  const nodes = nodeMap(flow);
  const firstEdge = trigger ? outgoingEdges(flow, trigger.id)[0] : null;
  if (firstEdge && nodes.has(firstEdge.to)) return nodes.get(firstEdge.to);
  return (flow.nodes || []).find((node) => ["message", "menu", "handoff"].includes(node.type) && node.message);
}

function formatNodeMessage(node) {
  const message = String(node?.message || "").trim();
  if (node?.type !== "menu") return message;

  const options = (node.options || []).filter((option) => option.label);
  if (!options.length) return message;

  const normalizedMessage = normalizeText(message);
  const labelsAlreadyShown = options.every((option) => normalizedMessage.includes(normalizeText(option.label)));
  if (labelsAlreadyShown) return message;

  return [
    message,
    options.map((option, index) => `${index + 1}. ${option.label}`).join("\n")
  ].filter(Boolean).join("\n\n");
}

function validateLiveFlow(flow) {
  const nodes = flow.nodes || [];
  const trigger = nodes.find((node) => node.type === "trigger");
  if (!trigger) throw new HttpError(400, "A live chatbot needs a trigger block");

  const firstNode = findFirstReplyNode(flow);
  if (!firstNode) throw new HttpError(400, "A live chatbot needs a reply, menu, or handoff block connected after the trigger");

  for (const node of nodes) {
    if (["message", "menu", "handoff"].includes(node.type) && !String(node.message || "").trim()) {
      throw new HttpError(400, `Block "${node.title || node.id}" needs reply text before launch`);
    }
    if (node.type === "menu") {
      const options = (node.options || []).filter((option) => option.label);
      if (!options.length) throw new HttpError(400, `Menu "${node.title || node.id}" needs at least one option`);
      const missingTarget = options.find((option) => !option.nextNodeId || !nodes.some((candidate) => candidate.id === option.nextNodeId));
      if (missingTarget) throw new HttpError(400, `Menu option "${missingTarget.label}" needs a next block before launch`);
    }
  }
}

async function clearAutomationConversations(tenantId, flowIds) {
  const ids = (Array.isArray(flowIds) ? flowIds : [flowIds]).filter(Boolean);
  if (!ids.length) return;
  await Conversation.updateMany(
    { tenantId, "automation.flowId": { $in: ids } },
    { $set: {
      "automation.currentNodeId": "",
      "automation.status": "idle",
      "automation.routeTo": "",
      "automation.updatedAt": new Date()
    } }
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
  if (!["draft", "active", "paused"].includes(status)) {
    throw new HttpError(400, "Invalid automation status");
  }

  if (status === "active") return activateAutomationFlow(tenantId, flowId);

  const flow = await AutomationFlow.findOneAndUpdate(
    { _id: flowId, tenantId },
    { $set: { status } },
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
    Tenant.findById(tenantId).select("+meta.accessToken status billing meta.phoneNumberId"),
    AutomationFlow.findOne({ _id: flowId, tenantId })
  ]);

  if (!tenant) throw new HttpError(404, "Tenant not found");
  if (!flow) throw new HttpError(404, "Automation flow not found");
  await requirePlatformAccess(tenantId);
  if (!tenant.meta?.phoneNumberId || !tenant.getMetaAccessToken()) {
    throw new HttpError(409, "Connect WhatsApp before launching a chatbot");
  }

  validateLiveFlow(flow);

  const otherActiveFlows = await AutomationFlow.find({ tenantId, _id: { $ne: flow._id }, status: "active" }).select("_id").lean();
  await AutomationFlow.updateMany(
    { tenantId, _id: { $ne: flow._id }, status: "active" },
    { $set: { status: "paused" } }
  );
  await clearAutomationConversations(tenantId, otherActiveFlows.map((activeFlow) => activeFlow._id));

  flow.status = "active";
  await flow.save();
  return flow;
}

function findMatchingActiveFlow(flows, text) {
  const incoming = normalizeText(text);
  if (!incoming) return null;
  return flows.find((flow) => {
    if (flow.triggerType !== "keyword") return false;
    const trigger = (flow.nodes || []).find((node) => node.type === "trigger");
    const keywords = [flow.triggerValue, trigger?.keyword].map(normalizeText).filter(Boolean);
    return keywords.some((keyword) => keyword === incoming);
  }) || null;
}

function findMenuTarget(flow, currentNode, text) {
  const incoming = normalizeText(text);
  const selectedIndex = /^\d+$/.test(incoming) ? Number.parseInt(incoming, 10) : 0;
  const options = (currentNode.options || []).filter((option) => option.label);
  const option = options.find((candidate, index) => (
    normalizeText(candidate.label) === incoming || selectedIndex === index + 1
  ));
  if (!option?.nextNodeId) return null;
  return nodeMap(flow).get(option.nextNodeId) || null;
}

async function sendAutomationNode({ tenantId, conversation, flow, node }) {
  const message = formatNodeMessage(node);
  if (message) await inboxService.sendReply(tenantId, conversation._id, { text: message, automationSend: true });

  const update = {
    "automation.flowId": flow._id,
    "automation.currentNodeId": node.type === "menu" ? node.id : "",
    "automation.status": node.type === "menu" ? "active" : node.type === "handoff" ? "handoff" : "idle",
    "automation.routeTo": node.type === "handoff" ? node.routeTo : "",
    "automation.updatedAt": new Date()
  };

  await Conversation.updateOne({ _id: conversation._id, tenantId }, { $set: update });
}

async function runAutomationForInboundMessage({ tenantId, conversationId, text }) {
  const conversation = await Conversation.findOne({ _id: conversationId, tenantId });
  if (!conversation) return { action: "skipped" };

  const flows = await AutomationFlow.find({ tenantId, status: "active" }).sort({ updatedAt: -1 }).limit(10);
  if (!flows.length) return { action: "skipped" };

  let flow = null;
  let targetNode = null;

  if (conversation.automation?.status === "active" && conversation.automation?.flowId) {
    flow = flows.find((candidate) => String(candidate._id) === String(conversation.automation.flowId));
    const currentNode = flow ? nodeMap(flow).get(conversation.automation.currentNodeId) : null;
    if (currentNode?.type === "menu") targetNode = findMenuTarget(flow, currentNode, text);
    if (!targetNode) return { action: "waiting_for_menu_option" };
  } else {
    flow = findMatchingActiveFlow(flows, text);
    targetNode = flow ? findFirstReplyNode(flow) : null;
    if (!targetNode) return { action: "skipped" };
  }

  await sendAutomationNode({ tenantId, conversation, flow, node: targetNode });
  return { action: "sent", flowId: String(flow._id), nodeId: targetNode.id };
}

module.exports = {
  listAutomationFlows,
  createAutomationFlow,
  updateAutomationFlow,
  updateAutomationStatus,
  activateAutomationFlow,
  runAutomationForInboundMessage
};
