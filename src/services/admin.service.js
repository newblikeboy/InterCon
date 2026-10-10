const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Tenant = require("../models/Tenant");
const User = require("../models/User");
const Payment = require("../models/Payment");
const Message = require("../models/Message");
const WebhookEvent = require("../models/WebhookEvent");
const Template = require("../models/Template");
const Contact = require("../models/Contact");
const BillingOrder = require("../models/BillingOrder");
const PlatformAudit = require("../models/PlatformAudit");
const HttpError = require("../utils/httpError");
const { cursorFilter, pageSize } = require("../utils/pagination");
const sessionCache = require("./sessionCache.service");
const billing = require("./billing.service");
const { getAccessTenant, publicTrial, FREE_MESSAGE_LIMIT } = require("./platformAccess.service");
const { getRedisClient } = require("../config/redis");
const env = require("../config/env");

const customerFilter = { kind: { $ne: "platform" }, status: { $ne: "deleted" } };
const trialUsedExpression = () => ({ $size: { $cond: [
  { $ne: [{ $ifNull: ["$trial.messagesInitializedAt", null] }, null] },
  { $ifNull: ["$trial.sentMessages", []] }, { $ifNull: ["$trial.recipients", []] }
] } });
const definitions = {
  tenants: { model: Tenant, fields: "businessName businessEmail status subscription billing.plan billing.currentPeriodEnd trialUsed meta.phoneNumberId createdAt", select: "businessName businessEmail contactPerson whatsappNumber kind status onboardingStatus billing.plan billing.status billing.amount billing.currency billing.currentPeriodEnd billing.accessSource meta.phoneNumberId meta.wabaId meta.qualityRating meta.connectedAt createdAt updatedAt", search: ["businessName", "businessEmail", "contactPerson", "whatsappNumber"] },
  users: { model: User, fields: "name email workspace role status isVerified lastLoginAt createdAt", select: "name email phone role status isVerified lastLoginAt createdAt tenantId", search: ["name", "email", "phone"] },
  payments: { model: Payment, fields: "workspace plan amount currency status providerPaymentId capturedAt", select: "tenantId providerOrderId providerPaymentId plan amount currency status capturedAt createdAt", search: ["providerOrderId", "providerPaymentId"] },
  orders: { model: BillingOrder, fields: "workspace plan amount currency status providerOrderId createdAt", select: "tenantId plan amount currency status providerOrderId createdAt checkedAt", search: ["providerOrderId"] },
  messages: { model: Message, fields: "workspace to templateName status attempts error createdAt", select: "tenantId to templateName status attempts metaMessageId metaErrorCode error createdAt", search: ["to", "templateName"] },
  templates: { model: Template, fields: "workspace name language category status updatedAt", select: "tenantId name language category status updatedAt", search: ["name"] },
  webhooks: { model: WebhookEvent, fields: "workspace eventType status attempts error createdAt", select: "tenantId eventType status attempts error createdAt nextAttemptAt", search: ["eventType"] },
  audit: { model: PlatformAudit, fields: "actorEmail action workspace targetType reason createdAt", select: "actorId actorEmail action targetType targetId tenantId reason before after createdAt", search: ["actorEmail", "action", "reason"] }
};

function objectId(value) {
  if (typeof value !== "string" || !/^[a-f\d]{24}$/i.test(value)) throw new HttpError(400, "Invalid record ID");
  return new mongoose.Types.ObjectId(value);
}
function queryText(value, max = 120) {
  if (value == null || value === "") return "";
  if (typeof value !== "string" || value.length > max) throw new HttpError(400, "Invalid filter");
  return value.trim();
}
function regexText(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function paidFilter(prefix = "", now = new Date()) {
  return { [`${prefix}status`]: "active", [`${prefix}billing.plan`]: { $in: ["monthly", "quarterly", "yearly"] }, [`${prefix}billing.status`]: "active", [`${prefix}billing.currentPeriodEnd`]: { $gt: now } };
}
function paidExpression() {
  return { $and: [{ $eq: ["$status", "active"] }, { $eq: ["$billing.status", "active"] }, { $in: ["$billing.plan", ["monthly", "quarterly", "yearly"]] }, { $gt: ["$billing.currentPeriodEnd", new Date()] }] };
}
function period(query = {}) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const defaultFrom = new Date(Date.now() - 89 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const from = queryText(query.from) || defaultFrom, to = queryText(query.to) || today;
  const date = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, "Use YYYY-MM-DD dates");
    const parsed = new Date(value + "T00:00:00+05:30");
    if (!Number.isFinite(parsed.getTime()) || parsed.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) !== value) throw new HttpError(400, "Invalid calendar date");
    return parsed;
  };
  const start = date(from), end = new Date(date(to).getTime() + 86400000);
  if (start >= end || end - start > 5 * 366 * 86400000) throw new HttpError(400, "Select a date range of up to five years");
  return { from, to, start, end, timezone: "Asia/Kolkata" };
}
function groupStatuses(model, filter = {}) {
  return model.aggregate([{ $match: filter }, { $group: { _id: "$status", count: { $sum: 1 } } }]);
}
const statusMap = rows => Object.fromEntries(rows.map(row => [row._id, row.count]));
const sumCounts = rows => rows.reduce((sum, row) => sum + row.count, 0);

async function overview(query) {
  const range = period(query), now = new Date();
  const paid = { ...customerFilter, ...paidFilter(), "billing.accessSource": { $ne: "manual" } };
  const [tenants, users, paidUsers, paidTenants, manualTenants, expiring, messages, hooks, orders, allRevenue, selectedRevenue, trend, mrr, recentTenants, recentPayments, oldestQueued] = await Promise.all([
    groupStatuses(Tenant, customerFilter),
    User.aggregate([{ $lookup: { from: Tenant.collection.name, localField: "tenantId", foreignField: "_id", as: "tenant" } }, { $unwind: "$tenant" }, { $match: { "tenant.kind": { $ne: "platform" }, "tenant.status": { $ne: "deleted" } } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([{ $match: { status: "active" } }, { $lookup: { from: Tenant.collection.name, localField: "tenantId", foreignField: "_id", as: "tenant" } }, { $unwind: "$tenant" }, { $match: { "tenant.kind": { $ne: "platform" }, ...paidFilter("tenant."), "tenant.billing.accessSource": { $ne: "manual" } } }, { $count: "count" }]),
    Tenant.countDocuments(paid),
    Tenant.countDocuments({ ...customerFilter, ...paidFilter(), "billing.accessSource": "manual" }),
    Tenant.countDocuments({ ...paid, "billing.currentPeriodEnd": { $gt: now, $lte: new Date(Date.now() + 7 * 86400000) } }),
    groupStatuses(Message), groupStatuses(WebhookEvent), groupStatuses(BillingOrder),
    Payment.aggregate([{ $group: { _id: { currency: "$currency", status: "$status" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { capturedAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: { currency: "$currency", status: "$status" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { status: "captured", capturedAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: { currency: "$currency", month: { $dateToString: { format: "%Y-%m", date: "$capturedAt", timezone: range.timezone } } }, amount: { $sum: "$amount" }, count: { $sum: 1 } } }, { $sort: { "_id.month": 1 } }]),
    Tenant.aggregate([{ $match: paid }, { $group: { _id: "$billing.currency", amount: { $sum: { $divide: [{ $multiply: ["$billing.amount", 100] }, { $switch: { branches: [{ case: { $eq: ["$billing.plan", "quarterly"] }, then: 3 }, { case: { $eq: ["$billing.plan", "yearly"] }, then: 12 }], default: 1 } }] } } } }]),
    Tenant.find(customerFilter).select("businessName businessEmail billing.plan status createdAt").sort({ _id: -1 }).limit(5).lean(),
    Payment.find().select("tenantId amount currency plan status capturedAt").populate("tenantId", "businessName").sort({ capturedAt: -1 }).limit(5).lean(),
    Message.findOne({ status: { $in: ["queued", "scheduled"] } }).select("createdAt").sort({ createdAt: 1 }).lean()
  ]);
  const moneyRows = rows => rows.map(row => ({ currency: row._id.currency, status: row._id.status, amount: row.amount, count: row.count }));
  const currencies = [...new Set([...allRevenue.map(row => row._id.currency), ...mrr.map(row => row._id)])].sort();
  return {
    counts: { tenants: sumCounts(tenants), users: sumCounts(users), activeUsers: statusMap(users).active || 0, paidUsers: paidUsers[0]?.count || 0, paidTenants, manualTenants, suspendedTenants: statusMap(tenants).suspended || 0, expiring, queued: messages.filter(row => ["queued", "scheduled", "processing"].includes(row._id)).reduce((sum, row) => sum + row.count, 0), uncertain: statusMap(messages).uncertain || 0, failedWebhooks: statusMap(hooks).dead || 0, payments: allRevenue.filter(row => row._id.status === "captured").reduce((sum, row) => sum + row.count, 0) },
    period: { from: range.from, to: range.to, timezone: range.timezone },
    revenue: { currencies: currencies.length ? currencies : ["INR"], lifetime: moneyRows(allRevenue), period: moneyRows(selectedRevenue), trend: trend.map(row => ({ currency: row._id.currency, month: row._id.month, amount: row.amount, count: row.count })), mrr: mrr.map(row => ({ currency: row._id || "INR", amount: Math.round(row.amount) })), unit: "minor", note: "Captured revenue excludes payments currently marked refunded or disputed. MRR is an estimate from active paid plans; manual access grants do not create revenue. Fees, tax and partial refunds are not recorded in this ledger." },
    operations: { messages: statusMap(messages), webhooks: statusMap(hooks), orders: statusMap(orders), oldestQueuedAt: oldestQueued?.createdAt || null },
    health: { database: mongoose.connection.readyState === 1 ? "connected" : "unavailable", redis: !env.redisUrl ? "not_configured" : getRedisClient()?.isReady ? "connected" : "unavailable", uptimeSeconds: Math.floor(process.uptime()), memoryMB: Math.round(process.memoryUsage().rss / 1048576) },
    plans: billing.getPlans(), recentTenants, recentPayments, generatedAt: new Date()
  };
}

function recordDefinition(kind) {
  if (!Object.hasOwn(definitions, kind)) throw new HttpError(404, "Unknown record type");
  return definitions[kind];
}
function recordsPipeline(kind, query = {}, paginate = true) {
  const definition = recordDefinition(kind), filter = {};
  const q = queryText(query.q), status = queryText(query.status), plan = queryText(query.plan), segment = queryText(query.segment);
  if (q) filter.$or = definition.search.map(field => ({ [field]: { $regex: regexText(q), $options: "i" } }));
  if (status) {
    const values = definition.model.schema.path("status")?.enumValues;
    if (!values?.includes(status)) throw new HttpError(400, "Invalid status filter");
    filter.status = status;
  }
  if (plan) {
    if (!["none", "monthly", "quarterly", "yearly"].includes(plan)) throw new HttpError(400, "Invalid plan filter");
    filter[kind === "tenants" ? "billing.plan" : "plan"] = plan;
  }
  if (query.tenantId) filter[kind === "tenants" ? "_id" : "tenantId"] = objectId(query.tenantId);
  if (paginate && query.after) Object.assign(filter, cursorFilter(queryText(query.after)));
  if (["payments", "orders"].includes(kind) && (query.from || query.to)) {
    const range = period(query);
    filter[kind === "payments" ? "capturedAt" : "createdAt"] = { $gte: range.start, $lt: range.end };
  }
  const stages = [];
  if (kind === "tenants") {
    stages.push({ $match: { ...customerFilter, ...filter } });
    if (segment) {
      if (!["paid", "expiring", "trial", "expired", "suspended", "manual", "connected"].includes(segment)) throw new HttpError(400, "Invalid customer segment");
      const paid = paidFilter();
      const segments = {
        paid: { ...paid, "billing.accessSource": { $ne: "manual" } },
        expiring: { ...paid, "billing.accessSource": { $ne: "manual" }, "billing.currentPeriodEnd": { $gt: new Date(), $lte: new Date(Date.now() + 7 * 86400000) } },
        manual: { ...paid, "billing.accessSource": "manual" },
        trial: { $nor: [paid], $expr: { $lt: [trialUsedExpression(), FREE_MESSAGE_LIMIT] } },
        expired: { "billing.plan": { $in: ["monthly", "quarterly", "yearly"] }, "billing.currentPeriodEnd": { $lte: new Date() } },
        suspended: { status: "suspended" }, connected: { "meta.phoneNumberId": { $type: "string", $ne: "" } }
      };
      stages.push({ $match: segments[segment] });
    }
    stages.push({ $addFields: { trialUsed: trialUsedExpression(), subscription: { $cond: [paidExpression(), { $cond: [{ $eq: ["$billing.accessSource", "manual"] }, "manual", "paid"] }, { $cond: [{ $and: [{ $in: ["$billing.plan", ["monthly", "quarterly", "yearly"]] }, { $lte: ["$billing.currentPeriodEnd", new Date()] }] }, "expired", "trial"] }] } } });
  } else {
    stages.push({ $match: filter });
    if (segment && kind !== "users") throw new HttpError(400, "This record type has no customer segments");
    stages.push({ $lookup: { from: Tenant.collection.name, localField: "tenantId", foreignField: "_id", as: "workspaceTenant", pipeline: [{ $project: { businessName: 1, kind: 1, status: 1, billing: { plan: "$billing.plan", status: "$billing.status", currentPeriodEnd: "$billing.currentPeriodEnd", accessSource: "$billing.accessSource" } } }] } }, { $unwind: { path: "$workspaceTenant", preserveNullAndEmptyArrays: true } });
    if (kind === "users") {
      stages.push({ $match: { "workspaceTenant.kind": { $ne: "platform" }, "workspaceTenant.status": { $ne: "deleted" } } });
      if (segment) {
        if (segment !== "paid") throw new HttpError(400, "Invalid user segment");
        stages.push({ $match: { ...paidFilter("workspaceTenant."), "workspaceTenant.billing.accessSource": { $ne: "manual" } } });
      }
    }
    stages.push({ $addFields: { workspace: { $ifNull: ["$workspaceTenant.businessName", "Unknown workspace"] } } });
  }
  stages.push({ $sort: { _id: -1 } });
  if (paginate) stages.push({ $limit: pageSize(query.limit, 50, 100) + 1 });
  const project = Object.fromEntries(definition.select.split(" ").map(field => [field, 1]));
  if (kind === "tenants") Object.assign(project, { trialUsed: 1, subscription: 1 });
  else project.workspace = 1;
  stages.push({ $project: project });
  return stages;
}
async function records(kind, query) {
  const definition = recordDefinition(kind), limit = pageSize(query.limit, 50, 100);
  const rows = await definition.model.aggregate(recordsPipeline(kind, query));
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();
  return { records: rows, fields: definition.fields.split(" "), nextCursor: hasMore ? String(rows.at(-1)._id) : null };
}
function exportCursor(kind, query) {
  return recordDefinition(kind).model.aggregate(recordsPipeline(kind, query, false)).cursor({ batchSize: 200 });
}
function csvCell(value) {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[\s]*[=+@-]/.test(text) || /^\d{11,15}$/.test(text)) text = "'" + text;
  return `"${text.replace(/"/g, '""')}"`;
}

async function tenantDetails(id) {
  const tenantId = objectId(id);
  const tenant = await Tenant.findOne({ _id: tenantId, kind: { $ne: "platform" } }).select(definitions.tenants.select).lean();
  if (!tenant) throw new HttpError(404, "Workspace not found");
  const [users, payments, messages, contacts, templates, audits, trial] = await Promise.all([
    User.find({ tenantId }).select(definitions.users.select).sort({ createdAt: 1 }).limit(100).lean(),
    Payment.find({ tenantId }).select(definitions.payments.select).sort({ capturedAt: -1 }).limit(10).lean(),
    groupStatuses(Message, { tenantId }), groupStatuses(Contact, { tenantId }), groupStatuses(Template, { tenantId }),
    PlatformAudit.find({ tenantId }).select(definitions.audit.select).sort({ createdAt: -1 }).limit(10).lean(),
    getAccessTenant(tenantId)
  ]);
  return { tenant, users, payments, messages: statusMap(messages), contacts: statusMap(contacts), templates: statusMap(templates), audits, trial: publicTrial(trial) };
}

function reasonText(body) {
  const reason = queryText(body.reason, 1000);
  if (reason.length < 5) throw new HttpError(400, "Enter an action reason of at least 5 characters");
  return reason;
}
async function auditedChange(actor, kind, id, action, body, change) {
  const targetId = objectId(id), reason = reasonText(body), session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      result = await change(session, targetId, reason);
      await PlatformAudit.create([{ actorId: actor._id, actorEmail: actor.email, targetType: kind, targetId, tenantId: result.tenantId, action, reason, before: result.before, after: result.after }], { session });
    });
  } finally { await session.endSession(); }
  for (const userId of result.revoke || []) await sessionCache.invalidateUser(String(userId));
  return { message: result.message || "Change saved.", record: result.after };
}
async function tenantAction(actor, id, body) {
  const action = queryText(body.action);
  if (!["suspend", "reactivate", "grant-plan", "cancel-plan"].includes(action)) throw new HttpError(400, "Unknown workspace action");
  return auditedChange(actor, "tenant", id, "workspace." + action, body, async (session, targetId) => {
    const tenant = await Tenant.findById(targetId).select("kind status billing.plan billing.status billing.amount billing.currency billing.currentPeriodEnd billing.accessSource").session(session).lean();
    if (!tenant) throw new HttpError(404, "Workspace not found");
    if (tenant.kind === "platform" || String(targetId) === String(actor.tenantId)) throw new HttpError(409, "You cannot change your own administrative workspace");
    if (tenant.status === "deleted") throw new HttpError(409, "This workspace has been deleted");
    const update = {};
    if (action === "suspend" || action === "reactivate") update.status = action === "suspend" ? "suspended" : "active";
    if (action === "grant-plan") {
      const plan = billing.getPlans().find(item => item.id === body.plan);
      if (!plan) throw new HttpError(400, "Select a valid plan");
      const endDate = queryText(body.endDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new HttpError(400, "Choose an access expiry date");
      const end = new Date(period({ from: endDate, to: endDate }).end.getTime() - 1);
      if (!Number.isFinite(end.getTime()) || end <= new Date() || end > new Date(Date.now() + 5 * 366 * 86400000)) throw new HttpError(400, "Choose a future expiry within five years");
      Object.assign(update, { "billing.plan": plan.id, "billing.status": "active", "billing.amount": plan.amount, "billing.currency": plan.currency, "billing.currentPeriodEnd": end, "billing.activatedAt": new Date(), "billing.accessSource": "manual" });
    }
    if (action === "cancel-plan") Object.assign(update, { "billing.status": "cancelled", "billing.currentPeriodEnd": new Date() });
    await Tenant.updateOne({ _id: targetId }, { $set: update }, { session, runValidators: true });
    const after = await Tenant.findById(targetId).select("status billing.plan billing.status billing.amount billing.currency billing.currentPeriodEnd billing.accessSource").session(session).lean();
    const revoke = action === "suspend" ? await User.find({ tenantId: targetId }).select("_id").session(session).lean() : [];
    if (revoke.length) await User.updateMany({ tenantId: targetId }, { $inc: { sessionVersion: 1 } }, { session });
    return { tenantId: targetId, before: { status: tenant.status, billing: tenant.billing }, after, revoke: revoke.map(user => user._id), message: action === "grant-plan" ? "Manual plan access granted. No payment or revenue was recorded." : "Workspace updated." };
  });
}
async function userAction(actor, id, body) {
  const action = queryText(body.action);
  if (!["disable", "reactivate", "revoke-sessions"].includes(action)) throw new HttpError(400, "Unknown user action");
  return auditedChange(actor, "user", id, "user." + action, body, async (session, targetId) => {
    const user = await User.findById(targetId).select("status tenantId +platformRole").session(session).lean();
    if (!user) throw new HttpError(404, "User not found");
    if (String(targetId) === String(actor._id) || user.platformRole === "admin") throw new HttpError(409, "Platform administrator accounts are protected from these actions");
    await User.updateOne({ _id: targetId }, { $inc: { sessionVersion: 1 }, ...(action !== "revoke-sessions" ? { $set: { status: action === "disable" ? "disabled" : "active" } } : {}) }, { session });
    return { tenantId: user.tenantId, before: { status: user.status }, after: { status: action === "disable" ? "disabled" : action === "reactivate" ? "active" : user.status, sessionsRevoked: true }, revoke: [targetId] };
  });
}
async function operationAction(actor, kind, id, body) {
  const model = kind === "message" ? Message : WebhookEvent;
  const action = kind === "message" ? "cancel" : "retry";
  if (body.action !== action) throw new HttpError(400, "Unknown operation action");
  return auditedChange(actor, kind, id, kind + "." + action, body, async (session, targetId, reason) => {
    const record = await model.findById(targetId).select("status tenantId attempts").session(session).lean();
    if (!record) throw new HttpError(404, "Record not found");
    const allowed = kind === "message" ? ["queued", "scheduled"] : ["dead", "retry"];
    if (!allowed.includes(record.status)) throw new HttpError(409, kind === "message" ? "Only messages that have not started delivery can be cancelled" : "Only failed or retrying webhooks can be retried");
    const update = kind === "message" ? { status: "cancelled", error: ("Cancelled by platform administrator: " + reason).slice(0, 500) } : { status: "queued", attempts: 0, nextAttemptAt: new Date(), error: "" };
    const changed = await model.updateOne({ _id: targetId, status: record.status }, { $set: update, $unset: { lockedAt: "", lockedBy: "" } }, { session, runValidators: true });
    if (!changed.matchedCount) throw new HttpError(409, "The record changed. Refresh and try again.");
    return { tenantId: record.tenantId, before: { status: record.status, attempts: record.attempts }, after: { status: update.status }, message: kind === "message" ? "Pending message cancelled." : "Webhook queued for the webhook worker." };
  });
}

async function provisionAdmin(email, password) {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) throw new HttpError(400, "Enter a valid email");
  if (typeof password !== "string" || password.length < 8 || password.length > 128 || !/[a-z]/i.test(password) || !/\d/.test(password)) throw new HttpError(400, "Use an 8–128 character password with letters and numbers");
  const normalized = email.trim().toLowerCase(), hash = await bcrypt.hash(password, 12), session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      const existing = await User.findOne({ email: normalized }).select("tenantId status").session(session).lean();
      let tenantId = existing?.tenantId;
      if (!tenantId) {
        const [tenant] = await Tenant.create([{ kind: "platform", businessName: "InterCon administration", contactPerson: "Platform administrator", businessEmail: normalized, whatsappNumber: "not-configured" }], { session });
        tenantId = tenant._id;
      }
      user = await User.findOneAndUpdate({ email: normalized }, { $set: { tenantId, name: existing ? undefined : "InterCon administrator", passwordHash: hash, status: "active", isVerified: true, platformRole: "admin" }, $inc: { sessionVersion: 1 }, $unset: { passwordResetHash: "", passwordResetExpires: "", emailVerificationTokenHash: "", emailVerificationExpires: "" } }, { upsert: true, returnDocument: "after", session, runValidators: true }).select("name email tenantId status");
      await PlatformAudit.create([{ actorId: user._id, actorEmail: normalized, action: "admin.provision", targetType: "user", targetId: user._id, tenantId, reason: "Administrator account provisioned by the workspace operator", before: { existed: Boolean(existing) }, after: { platformRole: "admin", status: "active" } }], { session });
    });
  } finally { await session.endSession(); }
  await sessionCache.invalidateUser(String(user._id));
  return { email: user.email, status: user.status, platformRole: "admin" };
}

module.exports = { overview, records, recordDefinition, exportCursor, csvCell, tenantDetails, tenantAction, userAction, operationAction, provisionAdmin, period };
