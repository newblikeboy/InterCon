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
    unreadCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ tenantId: 1, lastMessageAt: -1 });
conversationSchema.index({ tenantId: 1, customerPhone: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
