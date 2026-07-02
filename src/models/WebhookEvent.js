const mongoose = require("mongoose");
const env = require("../config/env");

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
    eventKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64
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
      enum: ["queued", "processing", "retry", "processed", "dead"],
      default: "queued",
      index: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lockedAt: Date,
    lockedBy: {
      type: String,
      trim: true,
      maxlength: 120
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
webhookEventSchema.index(
  { provider: 1, eventKey: 1 },
  { unique: true, partialFilterExpression: { eventKey: { $type: "string", $gt: "" } } }
);
webhookEventSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
webhookEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: Math.max(1, Number(env.webhookRetentionDays || 30)) * 24 * 60 * 60 }
);

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
