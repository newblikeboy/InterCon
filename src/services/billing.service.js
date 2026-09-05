const crypto = require("crypto");
const mongoose = require("mongoose");
const env = require("../config/env");
const Tenant = require("../models/Tenant");
const Payment = require("../models/Payment");
const BillingOrder = require("../models/BillingOrder");
const HttpError = require("../utils/httpError");
const { fetchWithPolicy } = require("../utils/httpClient");

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    amount: 1000,
    currency: "INR",
    interval: "month",
    months: 1
  },
  {
    id: "quarterly",
    name: "Quarterly",
    amount: 2500,
    currency: "INR",
    interval: "quarter",
    months: 3
  },
  {
    id: "yearly",
    name: "Yearly",
    amount: 9000,
    currency: "INR",
    interval: "year",
    months: 12
  }
];

function getPlans() {
  return plans;
}

function getPlan(planId) {
  return plans.find((plan) => plan.id === planId);
}

function publicBilling(tenant) {
  return {
    plan: tenant.billing?.plan || "none",
    status: tenant.billing?.status || "not_started",
    amount: tenant.billing?.amount || 0,
    currency: tenant.billing?.currency || "INR",
    selectedAt: tenant.billing?.selectedAt,
    activatedAt: tenant.billing?.activatedAt,
    currentPeriodEnd: tenant.billing?.currentPeriodEnd,
    razorpayOrderId: tenant.billing?.razorpayOrderId,
    receipt: tenant.billing?.receipt,
    active: hasActivePaidPlan(tenant)
  };
}

function hasActivePaidPlan(tenant) {
  if (!tenant?.billing) return false;
  if (!["monthly", "quarterly", "yearly"].includes(tenant.billing.plan)) return false;
  if (tenant.billing.status !== "active") return false;
  if (!tenant.billing.currentPeriodEnd) return true;

  return new Date(tenant.billing.currentPeriodEnd).getTime() > Date.now();
}

async function getBillingStatus(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("billing status");
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  return publicBilling(tenant);
}

function requireRazorpayConfig() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new HttpError(500, "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.");
  }
}

async function razorpayRequest(path, options = {}) {
  requireRazorpayConfig();

  const response = await fetchWithPolicy(`https://api.razorpay.com/v1/${path}`, {
    ...options,
    headers: {
      "Authorization": `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.error) {
    throw new HttpError(response.status || 400, data.error?.description || data.error?.reason || "Razorpay request failed", data.error || data);
  }

  return data;
}

function buildCheckoutPayload({ order, plan, tenant }) {
  return {
    key: env.razorpayKeyId,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: "InterCon",
    description: `${plan.name} plan`,
    prefill: {
      name: tenant.contactPerson || "",
      email: tenant.businessEmail || "",
      contact: tenant.whatsappNumber || ""
    }
  };
}

async function selectPlan(tenantId, planId) {
  const plan = getPlan(planId);
  if (!plan) {
    throw new HttpError(400, "Select a valid InterCon plan");
  }

  requireRazorpayConfig();

  const existingTenant = await Tenant.findById(tenantId).select("businessName businessEmail contactPerson whatsappNumber billing");
  if (!existingTenant) {
    throw new HttpError(404, "Tenant not found");
  }

  const receipt = `ic_${crypto.randomUUID().replaceAll("-", "")}`;
  const checkout = await BillingOrder.create({ tenantId, plan: plan.id, amount: plan.amount * 100, currency: plan.currency, receipt });
  const order = await razorpayRequest("orders", {
    method: "POST",
    body: JSON.stringify({
      amount: plan.amount * 100,
      currency: plan.currency,
      receipt,
      notes: {
        tenantId: String(tenantId),
        checkoutId: String(checkout._id),
        businessEmail: existingTenant.businessEmail,
        plan: plan.id
      }
    })
  });

  if (!order.id || order.amount !== checkout.amount || order.currency !== checkout.currency) throw new HttpError(502, "Payment provider returned an incomplete or mismatched order");
  await BillingOrder.updateOne({ _id: checkout._id }, { $set: { providerOrderId: order.id, status: "pending" } });
  return { billing: publicBilling(existingTenant), plan, checkout: buildCheckoutPayload({ order, plan, tenant: existingTenant }) };
}

function addMonths(date, months) {
  const next = new Date(date);
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

function periodEnd(billing, months, now = new Date()) {
  const paidThrough = new Date(billing?.currentPeriodEnd || 0);
  return addMonths(billing?.status === "active" && paidThrough > now ? paidThrough : now, months);
}

async function activatePlan(tenantId, planId = "", payment = {}) {
  const currentTenant = await Tenant.findById(tenantId).select("billing");
  if (!currentTenant) {
    throw new HttpError(404, "Tenant not found");
  }

  const resolvedPlanId = planId || currentTenant.billing?.plan;
  const plan = getPlan(resolvedPlanId);
  if (!plan) {
    throw new HttpError(400, "Select a valid InterCon plan before activation");
  }

  const activatedAt = new Date();
  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        "billing.plan": plan.id,
        "billing.status": "active",
        "billing.amount": plan.amount,
        "billing.currency": plan.currency,
        "billing.selectedAt": currentTenant.billing?.selectedAt || activatedAt,
        "billing.activatedAt": activatedAt,
        "billing.currentPeriodEnd": periodEnd(currentTenant.billing, plan.months, activatedAt),
        ...(payment.razorpayOrderId ? { "billing.razorpayOrderId": payment.razorpayOrderId } : {}),
        ...(payment.razorpayPaymentId ? { "billing.razorpayPaymentId": payment.razorpayPaymentId } : {}),
        ...(payment.razorpaySignature ? { "billing.razorpaySignature": payment.razorpaySignature } : {})
      }
    },
    { returnDocument: "after" }
  );

  return {
    billing: publicBilling(tenant),
    plan
  };
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  requireRazorpayConfig();

  const expectedSignature = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(String(signature || ""));
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function findOrder(tenantId, providerOrderId) {
  let order = await BillingOrder.findOne({ tenantId, providerOrderId });
  if (order) return order;
  // Upgrade path for checkouts created before the order ledger was introduced.
  const tenant = await Tenant.findById(tenantId).select("billing");
  if (tenant?.billing?.razorpayOrderId !== providerOrderId) throw new HttpError(404, "Payment order not found");
  const plan = getPlan(tenant.billing.plan);
  if (!plan) throw new HttpError(400, "Payment plan is invalid");
  return BillingOrder.findOneAndUpdate({ tenantId, providerOrderId }, { $setOnInsert: {
    tenantId, providerOrderId, plan: plan.id, amount: tenant.billing.amount * 100,
    currency: tenant.billing.currency, receipt: tenant.billing.receipt || providerOrderId, status: "pending"
  } }, { upsert: true, returnDocument: "after" });
}

async function settlePayment(order, providerPaymentId, signature = "") {
  let payment = await razorpayRequest(`payments/${encodeURIComponent(providerPaymentId)}`);
  if (payment.order_id !== order.providerOrderId || payment.currency !== order.currency || Number(payment.amount) !== order.amount) {
    throw new HttpError(400, "Payment does not match this order");
  }
  if (payment.status === "authorized") {
    payment = await razorpayRequest(`payments/${encodeURIComponent(providerPaymentId)}/capture`, {
      method: "POST", body: JSON.stringify({ amount: order.amount, currency: order.currency })
    });
  }
  if (payment.status !== "captured" || Number(payment.amount) !== order.amount || payment.currency !== order.currency || payment.order_id !== order.providerOrderId) {
    throw new HttpError(409, "Payment is not captured yet. We will check it again automatically.");
  }
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const existing = await Payment.findOne({ provider: "razorpay", providerOrderId: order.providerOrderId }).session(session);
      const tenant = await Tenant.findById(order.tenantId).select("billing").session(session);
      if (!tenant) throw new HttpError(404, "Workspace not found");
      const plan = getPlan(order.plan);
      if (existing) {
        if (String(existing.tenantId) !== String(order.tenantId)) throw new HttpError(409, "Payment belongs to another workspace");
        result = { billing: publicBilling(tenant), plan, idempotent: true };
        return;
      }
      const now = new Date();
      await Payment.create([{
        tenantId: order.tenantId, provider: "razorpay", providerOrderId: order.providerOrderId,
        providerPaymentId, signatureHash: crypto.createHash("sha256").update(signature || providerPaymentId).digest("hex"),
        plan: plan.id, amount: order.amount, currency: order.currency, status: "captured", capturedAt: now
      }], { session });
      const updated = await Tenant.findByIdAndUpdate(order.tenantId, { $set: {
        "billing.plan": plan.id, "billing.status": "active", "billing.amount": order.amount / 100,
        "billing.currency": order.currency, "billing.selectedAt": order.createdAt,
        "billing.activatedAt": now, "billing.currentPeriodEnd": periodEnd(tenant.billing, plan.months, now),
        "billing.razorpayOrderId": order.providerOrderId, "billing.razorpayPaymentId": providerPaymentId,
        "billing.razorpaySignature": "", "billing.receipt": order.receipt
      } }, { returnDocument: "after", session });
      await BillingOrder.updateOne({ _id: order._id }, { $set: { status: "paid", paymentId: providerPaymentId } }, { session });
      result = { billing: publicBilling(updated), plan, idempotent: false };
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Payment.findOne({ provider: "razorpay", providerOrderId: order.providerOrderId, tenantId: order.tenantId }).lean();
    if (!existing) throw error;
    result = { billing: await getBillingStatus(order.tenantId), plan: getPlan(existing.plan), idempotent: true };
  } finally { await session.endSession(); }
  return result;
}

async function verifyPayment(tenantId, body = {}) {
  const orderId = String(body.razorpay_order_id || body.razorpayOrderId || "").trim();
  const paymentId = String(body.razorpay_payment_id || body.razorpayPaymentId || "").trim();
  const signature = String(body.razorpay_signature || body.razorpaySignature || "").trim();
  if (!orderId || !paymentId || !verifyRazorpaySignature({ orderId, paymentId, signature })) {
    throw new HttpError(400, "Payment signature verification failed");
  }
  return settlePayment(await findOrder(tenantId, orderId), paymentId, signature);
}

async function reconcileOrder(order) {
  const data = await razorpayRequest(`orders/${encodeURIComponent(order.providerOrderId)}/payments`);
  const payment = (data.items || []).find(item => ["authorized", "captured"].includes(item.status));
  if (payment) return settlePayment(order, payment.id);
  return null;
}

async function reconcilePendingOrders() {
  const orders = await BillingOrder.find({ status: "pending", $or: [{ checkedAt: { $exists: false } }, { checkedAt: { $lt: new Date(Date.now() - 60000) } }] })
    .sort({ checkedAt: 1, createdAt: 1 }).limit(25);
  for (const order of orders) {
    await BillingOrder.updateOne({ _id: order._id }, { $set: { checkedAt: new Date() } });
    try { await reconcileOrder(order); } catch (error) { console.error("Payment reconciliation failed", String(order._id), error.message); }
  }
}

async function handlePaymentWebhook(req) {
  const secret = env.razorpayWebhookSecret;
  const signature = String(req.headers["x-razorpay-signature"] || "");
  if (!secret) throw new HttpError(503, "Payment notifications are not configured");
  const expected = crypto.createHmac("sha256", secret).update(req.rawBody || Buffer.alloc(0)).digest("hex");
  if (!req.rawBody || !/^[a-f0-9]{64}$/.test(signature) || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    throw new HttpError(403, "Invalid payment notification signature");
  }
  if (!["payment.captured", "order.paid"].includes(req.body.event)) return;
  const payment = req.body.payload?.payment?.entity;
  if (!payment?.order_id || !payment.id) throw new HttpError(400, "Payment notification is incomplete");
  let order = await BillingOrder.findOne({ providerOrderId: payment.order_id });
  if (!order) {
    const tenant = await Tenant.findOne({ "billing.razorpayOrderId": payment.order_id }).select("_id");
    if (tenant) order = await findOrder(tenant._id, payment.order_id);
  }
  if (!order) throw new HttpError(409, "Payment order is not available yet");
  await settlePayment(order, payment.id, signature);
}

async function listPaymentHistory(tenantId) {
  return Payment.find({ tenantId }).select("providerOrderId providerPaymentId plan amount currency status capturedAt").sort({ capturedAt: -1 }).limit(100).lean();
}

async function requireActivePaidPlan(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("billing status");
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  if (tenant.status !== "active" || !hasActivePaidPlan(tenant)) {
    throw new HttpError(402, "Choose and activate an InterCon paid plan before submitting templates or sending WhatsApp messages.", {
      code: "INTERCON_PLAN_REQUIRED",
      billing: publicBilling(tenant),
      plans
    });
  }

  return publicBilling(tenant);
}

module.exports = {
  addMonths,
  periodEnd,
  settlePayment,
  handlePaymentWebhook,
  reconcilePendingOrders,
  listPaymentHistory,
  getPlans,
  getBillingStatus,
  selectPlan,
  activatePlan,
  verifyPayment,
  requireActivePaidPlan,
  hasActivePaidPlan,
  publicBilling
};
