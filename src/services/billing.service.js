const crypto = require("crypto");
const env = require("../config/env");
const Tenant = require("../models/Tenant");
const HttpError = require("../utils/httpError");

const plans = [
  {
    id: "monthly",
    name: "Monthly",
    amount: 3000,
    currency: "INR",
    interval: "month",
    months: 1
  },
  {
    id: "quarterly",
    name: "Quarterly",
    amount: 7500,
    currency: "INR",
    interval: "quarter",
    months: 3
  },
  {
    id: "yearly",
    name: "Yearly",
    amount: 24000,
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
  const tenant = await Tenant.findById(tenantId).select("billing");
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

  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
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

  const receipt = `ic_${String(tenantId).slice(-10)}_${Date.now()}`;
  const order = await razorpayRequest("orders", {
    method: "POST",
    body: JSON.stringify({
      amount: plan.amount * 100,
      currency: plan.currency,
      receipt,
      notes: {
        tenantId: String(tenantId),
        businessEmail: existingTenant.businessEmail,
        plan: plan.id
      }
    })
  });

  const tenant = await Tenant.findByIdAndUpdate(
    tenantId,
    {
      $set: {
        "billing.plan": plan.id,
        "billing.status": "pending_payment",
        "billing.amount": plan.amount,
        "billing.currency": plan.currency,
        "billing.selectedAt": new Date(),
        "billing.razorpayOrderId": order.id,
        "billing.razorpayPaymentId": "",
        "billing.razorpaySignature": "",
        "billing.receipt": receipt
      }
    },
    { returnDocument: "after" }
  );

  return {
    billing: publicBilling(tenant),
    plan,
    checkout: buildCheckoutPayload({ order, plan, tenant: existingTenant })
  };
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
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
        "billing.currentPeriodEnd": addMonths(activatedAt, plan.months),
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

async function verifyPayment(tenantId, body = {}) {
  const razorpayOrderId = String(body.razorpay_order_id || body.razorpayOrderId || "").trim();
  const razorpayPaymentId = String(body.razorpay_payment_id || body.razorpayPaymentId || "").trim();
  const razorpaySignature = String(body.razorpay_signature || body.razorpaySignature || "").trim();

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new HttpError(400, "Razorpay payment id, order id, and signature are required");
  }

  const tenant = await Tenant.findById(tenantId).select("billing");
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  if (tenant.billing?.razorpayOrderId !== razorpayOrderId) {
    throw new HttpError(400, "Razorpay order does not match the selected InterCon plan");
  }

  const signatureValid = verifyRazorpaySignature({
    orderId: tenant.billing.razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!signatureValid) {
    throw new HttpError(400, "Razorpay payment signature verification failed");
  }

  let payment = await razorpayRequest(`payments/${encodeURIComponent(razorpayPaymentId)}`);
  if (payment.order_id !== razorpayOrderId) {
    throw new HttpError(400, "Razorpay payment does not belong to the selected order");
  }

  if (payment.currency !== tenant.billing.currency || Number(payment.amount) !== Number(tenant.billing.amount) * 100) {
    throw new HttpError(400, "Razorpay payment amount does not match the selected plan");
  }

  if (payment.status === "authorized") {
    payment = await razorpayRequest(`payments/${encodeURIComponent(razorpayPaymentId)}/capture`, {
      method: "POST",
      body: JSON.stringify({
        amount: Number(tenant.billing.amount) * 100,
        currency: tenant.billing.currency
      })
    });
  }

  if (payment.status !== "captured") {
    throw new HttpError(409, `Razorpay payment is ${payment.status}. The plan will activate after payment capture.`, {
      code: "RAZORPAY_PAYMENT_NOT_CAPTURED",
      paymentStatus: payment.status
    });
  }

  return activatePlan(tenantId, tenant.billing.plan, {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
}

async function requireActivePaidPlan(tenantId) {
  const tenant = await Tenant.findById(tenantId).select("billing");
  if (!tenant) {
    throw new HttpError(404, "Tenant not found");
  }

  if (!hasActivePaidPlan(tenant)) {
    throw new HttpError(402, "Choose and activate an InterCon paid plan before submitting templates or sending WhatsApp messages.", {
      code: "INTERCON_PLAN_REQUIRED",
      billing: publicBilling(tenant),
      plans
    });
  }

  return publicBilling(tenant);
}

module.exports = {
  getPlans,
  getBillingStatus,
  selectPlan,
  activatePlan,
  verifyPayment,
  requireActivePaidPlan,
  hasActivePaidPlan,
  publicBilling
};
