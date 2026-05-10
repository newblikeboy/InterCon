const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true
    },
    provider: {
      type: String,
      enum: ["meta"],
      default: "meta",
      index: true
    },
    object: {
      type: String,
      trim: true,
      maxlength: 80
    },
    eventType: {
      type: String,
      trim: true,
      maxlength: 120,
      index: true
    },
    wabaId: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true
    },
    phoneNumberId: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ["received", "processed", "failed"],
      default: "received",
      index: true
    },
    error: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

webhookEventSchema.index({ createdAt: -1 });

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
