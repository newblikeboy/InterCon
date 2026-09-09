const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
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
    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    customerName: {
      type: String,
      trim: true,
      maxlength: 140,
      default: ""
    },
    wabaId: {
      type: String,
      trim: true,
      maxlength: 80
    },
    phoneNumberId: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true
    },
    lastMessageText: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lastDirection: {
      type: String,
      enum: ["in", "out"],
      default: "in"
    },
    // Timestamp of the most recent INBOUND message. Drives Meta's 24-hour
    // customer-service window, inside which free-form replies are allowed.
    lastInboundAt: {
      type: Date
    },
    lastStoredMessageId: { type: mongoose.Schema.Types.ObjectId },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0
    },
    automationLock: { token: String, expiresAt: Date },
    automationSequence: { type: Number, default: 0 },
    automationControl: { held: { type: Boolean, default: false }, changedAt: Date, throughSequence: Number },
    automation: {
      snapshot: mongoose.Schema.Types.Mixed,
      needsRecovery: { type: Boolean, default: false },
      lastProcessedAt: Date,
      flowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AutomationFlow"
      },
      currentNodeId: {
        type: String,
        trim: true,
        maxlength: 80,
        default: ""
      },
      status: {
        type: String,
        enum: ["idle", "active", "handoff"],
        default: "idle"
      },
      routeTo: {
        type: String,
        enum: ["sales", "support", "billing", "human_agent", ""],
        default: ""
      },
      updatedAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ tenantId: 1, lastMessageAt: -1 });
conversationSchema.index({ tenantId: 1, customerPhone: 1 }, { unique: true });
conversationSchema.index({ tenantId: 1, "automation.flowId": 1, "automation.status": 1 });
conversationSchema.index({ "automationLock.expiresAt": 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
