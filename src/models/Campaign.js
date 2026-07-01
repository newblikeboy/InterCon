const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    mediaId: {
      type: String,
      trim: true,
      maxlength: 80
    },
    category: {
      type: String,
      enum: ["utility", "marketing", "authentication"],
      required: true
    },
    audienceTag: {
      type: String,
      trim: true,
      maxlength: 40
    },
    scheduledAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "paused", "failed"],
      default: "draft",
      index: true
    },
    stats: {
      recipients: {
        type: Number,
        default: 0
      },
      sent: {
        type: Number,
        default: 0
      },
      delivered: {
        type: Number,
        default: 0
      },
      read: {
        type: Number,
        default: 0
      },
      failed: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true
  }
);

campaignSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("Campaign", campaignSchema);
