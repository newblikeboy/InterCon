const mongoose = require("mongoose");

const inboxMessageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    // "in"  = customer -> business (reply received via webhook)
    // "out" = business -> customer (free-form reply sent from the inbox)
    direction: {
      type: String,
      enum: ["in", "out"],
      required: true,
      index: true
    },
    type: {
      type: String,
      trim: true,
      maxlength: 40,
      default: "text"
    },
    text: {
      type: String,
      maxlength: 4096,
      default: ""
    },
    // For non-text inbound messages we keep a short human label (e.g. "[image]").
    mediaCaption: {
      type: String,
      maxlength: 1024,
      default: ""
    },
    metaMessageId: {
      type: String,
      trim: true,
      maxlength: 160,
      index: true
    },
    status: {
      type: String,
      enum: ["received", "queued", "sent", "delivered", "read", "failed"],
      default: "received"
    },
    error: {
      type: String,
      maxlength: 1000,
      default: ""
    },
    // Provider timestamp (inbound) or send time (outbound).
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

inboxMessageSchema.index({ conversationId: 1, createdAt: 1 });
inboxMessageSchema.index(
  { tenantId: 1, metaMessageId: 1 },
  { unique: true, partialFilterExpression: { metaMessageId: { $type: "string" } } }
);

module.exports = mongoose.model("InboxMessage", inboxMessageSchema);
