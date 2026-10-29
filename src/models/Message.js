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
    // A single encrypted envelope also protects personalized names/numbers.
    variables: { type: mongoose.Schema.Types.Mixed, default: [] },
    mediaId: {
      type: String,
      trim: true,
      maxlength: 80
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "document"]
    },
    mediaUrl: {
      type: String,
      trim: true
    },
    metaMediaId: String,
    batchId: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true
    },
    metaMessageId: {
      type: String,
      trim: true,
      maxlength: 160
    },
    providerStatusAt: { type: Date },
    status: {
      type: String,
      enum: ["queued", "scheduled", "processing", "accepted", "sent", "delivered", "read", "failed", "uncertain", "cancelled"],
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
    trialReservationToken: { type: String, maxlength: 80 },
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
messageSchema.index({ tenantId: 1, batchId: 1 });
messageSchema.index({ tenantId: 1, to: 1 });
messageSchema.index({ tenantId: 1, to: 1, acceptedAt: -1 });
messageSchema.index({ tenantId: 1, trialReservationToken: 1 }, { partialFilterExpression: { trialReservationToken: { $type: "string" } } });
messageSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
messageSchema.index({ phoneNumberId: 1, status: 1, nextAttemptAt: 1 });
messageSchema.index({ status: 1, lockedAt: 1 });
messageSchema.index(
  { tenantId: 1, metaMessageId: 1 },
  { unique: true, partialFilterExpression: { metaMessageId: { $type: "string", $gt: "" } } }
);
messageSchema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

messageSchema.plugin(require("./plugins/privateFields"), {
  namespace: "Message",
  fields: {
    to: { lookup: true, max: 32, search: true },
    mediaUrl: { max: 4096, trim: false },
    variables: { json: true, normalize(value) {
      const variables = (Array.isArray(value) ? value : [value]).map(item => item == null ? item : String(item).trim());
      if (variables.some(item => typeof item === "string" && item.length > 300)) throw new Error("Message variable exceeds its maximum length");
      return variables;
    } },
    error: { trim: false, max: 1000 }
  }
});

module.exports = mongoose.model("Message", messageSchema);
