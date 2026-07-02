const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    provider: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
      required: true
    },
    providerOrderId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    providerPaymentId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    signatureHash: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64
    },
    plan: {
      type: String,
      enum: ["monthly", "quarterly", "yearly"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      maxlength: 8
    },
    status: {
      type: String,
      enum: ["captured", "refunded", "disputed"],
      default: "captured",
      index: true
    },
    capturedAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

paymentSchema.index({ provider: 1, providerPaymentId: 1 }, { unique: true });
paymentSchema.index({ provider: 1, providerOrderId: 1 }, { unique: true });
paymentSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
