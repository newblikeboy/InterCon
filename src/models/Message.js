const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    to: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    type: {
      type: String,
      enum: ["template"],
      default: "template"
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    language: {
      type: String,
      default: "en",
      trim: true,
      maxlength: 20
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
    variables: [{
      type: String,
      trim: true,
      maxlength: 300
    }],
    metaMessageId: {
      type: String,
      trim: true,
      maxlength: 160
    },
    status: {
      type: String,
      enum: ["queued", "scheduled", "processing", "accepted", "sent", "delivered", "read", "failed"],
      default: "queued",
      index: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lockedAt: {
      type: Date
    },
    lockedBy: {
      type: String,
      trim: true,
      maxlength: 120
    },
    lastAttemptAt: {
      type: Date
    },
    acceptedAt: {
      type: Date
    },
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 160
    },
    metaErrorCode: {
      type: String,
      trim: true,
      maxlength: 40
    },
    error: {
      type: String,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ tenantId: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, to: 1 });
messageSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
messageSchema.index({ phoneNumberId: 1, status: 1, nextAttemptAt: 1 });
messageSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

module.exports = mongoose.model("Message", messageSchema);
