const HttpError = require("../utils/httpError");

const SESSION_MS = 24 * 60 * 60 * 1000;
const normalizeText = value => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
const commandText = value => normalizeText(value).replace(/[.!?]+$/, "").trim();
const isRestart = text => ["hi", "restart", "menu", "main menu"].includes(commandText(text));
const nodeMap = flow => new Map((flow.nodes || []).map(node => [node.id, node]));
const outgoing = (flow, id) => (flow.edges || []).filter(edge => edge.from === id);
function nextId(flow, node) {
  return node.nextNodeId || outgoing(flow, node.id)[0]?.to || "";
}
function firstNode(flow) {
  const trigger = flow.nodes.find(node => node.type === "trigger");
  return nodeMap(flow).get(trigger && nextId(flow, trigger));
}
function matches(flow, text) {
  const keyword = flow.nodes?.find(node => node.type === "trigger")?.keyword;
  return flow.triggerType === "keyword" && [flow.triggerValue, keyword].filter(Boolean)
    .some(value => commandText(value) === commandText(text));
}
function formatNodeMessage(node) {
  const text = String(node.message || "").trim();
  if (node.type !== "menu") return text;
  const options = (node.options || []).map((option, i) => `${i + 1}. ${option.label}`);
  // Only suppress a list when the complete numbered list is already present.
  if (options.every(option => text.split(/\r?\n/).some(line => normalizeText(line) === normalizeText(option)))) return text;
  return [text, options.join("\n")].filter(Boolean).join("\n\n");
}
function validateLiveFlow(flow) {
  if (flow.triggerType !== "keyword") throw new HttpError(400, "Only keyword triggers are supported for live chatbots");
  const nodes = flow.nodes || [];
  const map = nodeMap(flow);
  const triggers = nodes.filter(node => node.type === "trigger");
  if (triggers.length !== 1) throw new HttpError(400, "A live chatbot needs exactly one trigger block");
  if (!commandText(flow.triggerValue || triggers[0].keyword)) throw new HttpError(400, "A live chatbot needs a keyword");
  for (const edge of flow.edges || []) {
    if (!map.has(edge.from) || !map.has(edge.to) || map.get(edge.to).type === "trigger") throw new HttpError(400, "Connections must point to existing reply blocks, never the trigger");
  }
  for (const node of nodes) {
    const links = outgoing(flow, node.id);
    if (node.type !== "trigger" && !String(node.message || "").trim()) throw new HttpError(400, `Block "${node.title || node.id}" needs reply text before launch`);
    if (["trigger", "message"].includes(node.type)) {
      if (links.length > 1 || (node.nextNodeId && links.some(edge => edge.to !== node.nextNodeId))) throw new HttpError(400, `Block "${node.title || node.id}" must have only one next block`);
      const target = nextId(flow, node);
      if ((node.type === "trigger" && !target) || (target && (!map.has(target) || map.get(target).type === "trigger"))) throw new HttpError(400, `Block "${node.title || node.id}" needs a valid next reply block`);
    }
    if (node.type === "handoff" && (links.length || node.nextNodeId)) throw new HttpError(400, "Handoff blocks cannot continue automatically");
    if (node.type === "menu") {
      if (!node.options?.length) throw new HttpError(400, `Menu "${node.title || node.id}" needs at least one option`);
      const labels = new Set();
      for (const [index, option] of node.options.entries()) {
        if (matches(flow, String(index + 1))) throw new HttpError(400, "Trigger keywords cannot conflict with menu option numbers");
        const label = normalizeText(option.label);
        if (!label || labels.has(label) || isRestart(label) || matches(flow, label) || (/^\d+$/.test(label) && Number(label) !== index + 1)) throw new HttpError(400, "Menu labels must be unique and cannot conflict with trigger keywords, restart commands or option numbers");
        labels.add(label);
        if (!map.has(option.nextNodeId) || map.get(option.nextNodeId).type === "trigger") throw new HttpError(400, `Menu option "${option.label}" needs a next reply block before launch`);
      }
      if (links.some(edge => !node.options.some(option => option.nextNodeId === edge.to && (!edge.label || edge.label === option.label)))) throw new HttpError(400, "Menu connections must match their option destinations");
    }
  }
  const reached = new Set();
  function visit(id, automaticPath = new Set()) {
    if (automaticPath.has(id)) throw new HttpError(400, "Automatic message connections contain a loop");
    if (reached.has(id)) return;
    reached.add(id);
    const node = map.get(id);
    if (node.type === "menu") {
      for (const option of node.options) visit(option.nextNodeId, new Set());
    } else if (["trigger", "message"].includes(node.type) && nextId(flow, node)) {
      visit(nextId(flow, node), new Set([...automaticPath, id]));
    }
  }
  visit(triggers[0].id);
  // Check each automatic chain, including ones entered from a returning menu.
  for (const node of nodes.filter(node => node.type === "message")) {
    const seen = new Set(); let current = node;
    while (current?.type === "message") {
      if (seen.has(current.id)) throw new HttpError(400, "Automatic message connections contain a loop");
      seen.add(current.id); current = map.get(nextId(flow, current));
    }
  }
  if (reached.size !== nodes.length) throw new HttpError(400, "Every block must be reachable from the trigger; connect or remove unused blocks");
}
function buildPlan({ flows, state = {}, text, now = new Date(), held = false }) {
  if (held || state.status === "handoff") return { action: "human_handoff", messages: [] };
  if (!flows.length) return { action: "no_active_flow", messages: [] };
  const activeFlow = flows.find(flow => String(flow._id) === String(state.flowId));
  const expired = !state.updatedAt || +now - +new Date(state.updatedAt) >= SESSION_MS;
  const matching = flows.find(flow => matches(flow, text));
  let flow, target, action = "sent", prefix = "";
  if (isRestart(text) || matching) {
    flow = matching || activeFlow || flows[0]; target = firstNode(flow); action = "restarted";
  } else if (state.status === "active") {
    flow = activeFlow && !expired && state.snapshot ? state.snapshot : activeFlow;
    const current = flow && nodeMap(flow).get(state.currentNodeId);
    if (expired || !current || current.type !== "menu" || state.needsRecovery) {
      flow = activeFlow || flows[0]; target = firstNode(flow); action = "recovered";
      prefix = "Let's start again from the main menu.\n\n";
    } else {
      const incoming = normalizeText(text);
      const index = /^\d+$/.test(incoming) ? Number(incoming) - 1 : -1;
      const option = current.options.find((item, i) => i === index || normalizeText(item.label) === incoming);
      target = option && nodeMap(flow).get(option.nextNodeId);
      if (!target) {
        target = current; action = "fallback";
        prefix = "Please choose an option number or name below, or type Hi to restart.\n\n";
      }
    }
  } else {
    flow = flows[0]; target = firstNode(flow); action = "fallback";
    prefix = "Please choose from the options below, or type Hi to restart.\n\n";
  }
  validateLiveFlow(flow);
  const messages = [], seen = new Set(); let last;
  while (target) {
    if (seen.has(target.id) || messages.length >= 40) throw new HttpError(400, "Chatbot contains an automatic loop");
    seen.add(target.id); last = target;
    messages.push({ nodeId: target.id, text: (messages.length ? "" : prefix) + formatNodeMessage(target), status: "pending" });
    if (target.type !== "message") break;
    target = nodeMap(flow).get(nextId(flow, target));
  }
  if (!last) throw new HttpError(400, "Chatbot has no reachable first reply");
  return { action, flowId: flow._id, nodeId: last.id, messages, state: {
    flowId: flow._id, currentNodeId: last.type === "menu" ? last.id : "",
    status: last.type === "menu" ? "active" : last.type === "handoff" ? "handoff" : "idle",
    routeTo: last.type === "handoff" ? last.routeTo : "", updatedAt: now,
    snapshot: last.type === "menu" ? JSON.parse(JSON.stringify(flow)) : null, needsRecovery: false
  } };
}
module.exports = { buildPlan, validateLiveFlow, normalizeText, isRestart, formatNodeMessage };
