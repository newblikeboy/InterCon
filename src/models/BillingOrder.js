const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
  providerOrderId: { type: String },
  plan: { type: String, enum: ["monthly", "quarterly", "yearly"], required: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, required: true },
  receipt: { type: String, required: true },
  status: { type: String, enum: ["creating", "pending", "paid"], default: "creating" },
  checkedAt: { type: Date },
  paymentId: { type: String }
}, { timestamps: true });
schema.index({ providerOrderId: 1 }, { unique: true, partialFilterExpression: { providerOrderId: { $type: "string" } } });
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ status: 1, checkedAt: 1 });
module.exports = mongoose.model("BillingOrder", schema);
