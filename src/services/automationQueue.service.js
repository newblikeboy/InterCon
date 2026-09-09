const crypto = require("crypto");
const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const AutomationFlow = require("../models/AutomationFlow");
const Execution = require("../models/AutomationExecution");
const InboxMessage = require("../models/InboxMessage");
const inbox = require("./inbox.service");
const { buildPlan } = require("./automationEngine");
const { publishInboxUpdated } = require("./realtime.service");

const PENDING = ["queued", "processing", "retry"];
const LEASE_MS = 120000;
async function enqueueInbound({ tenantId, conversationId, inboundMessageId, text, receivedAt, sequence }, session) {
  const id = inboundMessageId || new mongoose.Types.ObjectId();
  if (sequence === undefined) {
    if (await Execution.exists({ tenantId, inboundMessageId: id })) return id;
    const conversation = await Conversation.findOneAndUpdate({ _id: conversationId, tenantId }, { $inc: { automationSequence: 1 } }, { returnDocument: "after" });
    if (!conversation) return id;
    sequence = conversation.automationSequence;
  }
  await Execution.updateOne({ tenantId, inboundMessageId: id }, { $setOnInsert: {
    tenantId, conversationId, inboundMessageId: id, sequence, text: String(text || "").slice(0, 4096), receivedAt: receivedAt || new Date()
  } }, { upsert: true, session });
  return id;
}
async function finish(job, status, action, error = "") {
  await Execution.updateOne({ _id: job._id }, { $set: { status, action, error: String(error).slice(0, 1000), completedAt: new Date() } });
}
async function processConversation(tenantId, conversationId) {
  const token = crypto.randomUUID();
  const ownership = { _id: conversationId, tenantId, "automationLock.token": token };
  const acquired = await Conversation.findOneAndUpdate({ _id: conversationId, tenantId, $or: [
    { "automationLock.expiresAt": { $exists: false } }, { "automationLock.expiresAt": { $lte: new Date() } }
  ] }, { $set: { automationLock: { token, expiresAt: new Date(Date.now() + LEASE_MS) } } });
  if (!acquired) return { action: "queued" };
  let lost = false;
  const heartbeat = setInterval(() => {
    Conversation.updateOne(ownership, { $set: { "automationLock.expiresAt": new Date(Date.now() + LEASE_MS) } })
      .then(result => { if (!result.matchedCount) lost = true; }).catch(() => { lost = true; });
  }, LEASE_MS / 3);
  heartbeat.unref();
  let result = { action: "idle" };
  try {
    for (let count = 0; count < 20 && !lost; count++) {
      const job = await Execution.findOne({ tenantId, conversationId, status: { $in: PENDING } }).sort({ sequence: 1 });
      if (!job) break;
      // A delayed first turn blocks later turns in this conversation, never other customers.
      if (job.nextAttemptAt > new Date()) break;
      let conversation = await Conversation.findOne(ownership).lean();
      if (!conversation || lost) break;
      const control = conversation.automationControl || {};
      if (control.held || job.sequence <= (control.throughSequence ?? -1)) {
        await finish(job, "completed", "human_handoff"); result = { action: "human_handoff" }; continue;
      }
      if (conversation.automation?.lastProcessedAt && job.receivedAt < conversation.automation.lastProcessedAt) {
        await finish(job, "completed", "stale_message"); continue;
      }
      try {
        if (!job.plan) {
          const flows = await AutomationFlow.find({ tenantId, status: "active" }).sort({ updatedAt: -1 }).limit(10).lean();
          try {
            job.plan = buildPlan({ flows, state: conversation.automation, text: job.text, held: control.held });
          } catch (error) {
            if (error.statusCode !== 400 || !flows.length) throw error;
            job.error = String(error.message).slice(0, 1000);
            job.plan = { action: "invalid_flow_handoff", flowId: flows[0]._id, nodeId: "recovery",
              messages: [{ nodeId: "recovery", text: "I'm unable to open the menu right now. This conversation will need help from our team.", status: "pending" }],
              state: { flowId: flows[0]._id, currentNodeId: "", status: "handoff", routeTo: "human_agent", updatedAt: new Date(), snapshot: null }
            };
          }
          job.flowId = job.plan.flowId;
          job.markModified("plan"); await job.save();
        }
        const plan = job.plan;
        job.status = "processing"; job.attempts++; await job.save();
        let cancelled = false;
        for (let index = 0; index < plan.messages.length; index++) {
          const step = plan.messages[index];
          if (step.status === "sent") continue;
          // Durable acceptance evidence prevents a resend after local bookkeeping fails.
          const accepted = await InboxMessage.findOne({ tenantId, automationExecutionId: job._id, automationStep: index }).lean();
          if (accepted) {
            step.status = "sent"; job.markModified("plan"); await job.save(); continue;
          }
          if (step.status === "sending") {
            await finish(job, "uncertain", "delivery_uncertain", "Worker stopped during delivery. Automatic retry suppressed to avoid duplicate replies.");
            await Conversation.updateOne({ ...ownership, "automationControl.held": { $ne: true } }, { $set: { "automation.needsRecovery": true } });
            cancelled = true; break;
          }
          conversation = await Conversation.findOne(ownership).lean();
          if (!conversation || lost) return { action: "lock_lost" };
          if (conversation.automationControl?.held || job.sequence <= (conversation.automationControl?.throughSequence ?? -1)) {
            await finish(job, "completed", "human_handoff"); cancelled = true; break;
          }
          if (!await AutomationFlow.exists({ _id: plan.flowId, tenantId, status: "active" })) {
            await finish(job, "completed", "flow_paused"); cancelled = true; break;
          }
          step.status = "sending"; job.markModified("plan"); await job.save();
          try {
            await inbox.sendReply(tenantId, conversationId, {
              text: step.text, automationSend: true, automationExecutionId: job._id, automationStep: index
            });
          } catch (error) {
            if (error.details?.code === "AUTOMATION_HELD") {
              await finish(job, "completed", "human_handoff"); cancelled = true; break;
            }
            const evidence = await InboxMessage.exists({ tenantId, automationExecutionId: job._id, automationStep: index });
            if (!evidence) {
              const rejected = error.deliveryOutcome === "rejected";
              const preflight = error.statusCode >= 400 && error.statusCode < 500;
              const safeRetry = (rejected && (error.statusCode === 429 || error.statusCode >= 500 || error.details?.is_transient)) || error.details?.code === "UPSTREAM_CIRCUIT_OPEN";
              step.status = rejected || preflight || safeRetry ? "pending" : "sending";
              job.markModified("plan");
              job.error = String(error.message).slice(0, 1000);
              if (safeRetry && job.attempts < 5) {
                job.status = "retry"; job.action = "retry_scheduled";
                job.nextAttemptAt = new Date(Date.now() + Math.min(60000, 1000 * 2 ** job.attempts));
                await job.save(); return { action: "retry_scheduled" };
              }
              job.status = step.status === "sending" ? "uncertain" : "failed";
              job.action = job.status === "uncertain" ? "delivery_uncertain" : "send_failed";
              job.completedAt = new Date(); await job.save();
              await Conversation.updateOne({ ...ownership, "automationControl.held": { $ne: true } }, { $set: { "automation.needsRecovery": true } });
              cancelled = true; break;
            }
          }
          step.status = "sent"; job.markModified("plan"); await job.save();
        }
        if (cancelled) { result = { action: job.action }; continue; }
        // Do not let a bot completion overwrite a concurrent agent takeover/release.
        const filter = { ...ownership, "automationControl.held": { $ne: true }, $or: [
          { "automationControl.throughSequence": { $exists: false } }, { "automationControl.throughSequence": { $lt: job.sequence } }
        ] };
        const state = plan.state ? { ...plan.state, lastProcessedAt: job.receivedAt } : null;
        const changed = await Conversation.updateOne(filter, { $set: {
          ...(state ? { automation: state } : { "automation.lastProcessedAt": job.receivedAt }),
          ...(state?.status === "handoff" ? { "automationControl.held": true } : {})
        } });
        await finish(job, "completed", changed.matchedCount ? plan.action : "human_handoff", plan.action === "invalid_flow_handoff" ? job.error : "");
        result = { action: changed.matchedCount ? plan.action : "human_handoff", flowId: String(plan.flowId || ""), nodeId: plan.nodeId };
      } catch (error) {
        // Invalid legacy graphs are visible in diagnostics and recover after repair.
        if (error.statusCode === 400) {
          await finish(job, "failed", "invalid_flow", error.message);
          await Conversation.updateOne({ ...ownership, "automationControl.held": { $ne: true } }, { $set: { "automation.needsRecovery": true } });
          result = { action: "invalid_flow" }; continue;
        }
        throw error; // Durable queued/processing job remains recoverable by the worker.
      }
    }
    return result;
  } finally {
    clearInterval(heartbeat);
    await Conversation.updateOne(ownership, { $unset: { automationLock: 1 } });
    await publishInboxUpdated(tenantId, { action: "automation_updated", conversationId: String(conversationId) });
  }
}
async function processNextAutomationJob() {
  const candidates = await Execution.aggregate([
    { $match: { status: { $in: PENDING } } },
    { $sort: { sequence: 1 } },
    { $group: { _id: "$conversationId", job: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$job" } },
    { $match: { nextAttemptAt: { $lte: new Date() } } },
    { $sort: { nextAttemptAt: 1 } }, { $limit: 50 }
  ]);
  const visited = new Set();
  for (const job of candidates) {
    const key = String(job.conversationId);
    if (visited.has(key)) continue; visited.add(key);
    if (!await Conversation.exists({ _id: job.conversationId, tenantId: job.tenantId })) { await finish(job, "completed", "conversation_deleted"); continue; }
    const result = await processConversation(job.tenantId, job.conversationId);
    if (!["queued", "idle"].includes(result.action)) return result;
  }
  return null;
}
async function runAutomationForInboundMessage(args) {
  await enqueueInbound(args);
  return processConversation(args.tenantId, args.conversationId);
}
module.exports = { enqueueInbound, processConversation, processNextAutomationJob, runAutomationForInboundMessage };
