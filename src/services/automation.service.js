const AutomationFlow = require("../models/AutomationFlow");
const HttpError = require("../utils/httpError");

function normalizeAutomation(body) {
  return {
    name: String(body.name || "").trim(),
    triggerType: String(body.triggerType || body.trigger_type || "").trim(),
    triggerValue: String(body.triggerValue || body.trigger_value || "").trim(),
    firstReply: String(body.firstReply || body.first_reply || "").trim(),
    routeTo: String(body.routeTo || body.route_to || "human_agent").trim(),
    controls: {
      stopOnAgentJoin: body.stopOnAgentJoin !== "off",
      respectServiceWindow: body.respectServiceWindow !== "off",
      requireOptInForTemplate: body.requireOptInForTemplate !== "off",
      fallbackForUnknownReply: body.fallbackForUnknownReply !== "off"
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

  if (!["keyword", "ad_click", "qr_scan", "after_hours", "unknown_reply"].includes(payload.triggerType)) {
    throw new HttpError(400, "Invalid automation trigger");
  }

  if (!["sales", "support", "billing", "human_agent"].includes(payload.routeTo)) {
    throw new HttpError(400, "Invalid handoff route");
  }

  return AutomationFlow.create({
    tenantId,
    ...payload
  });
}

async function updateAutomationStatus(tenantId, flowId, status) {
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
  updateAutomationStatus
};
