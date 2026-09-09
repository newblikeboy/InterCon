const mongoose = require("mongoose");

const automationFlowSchema = new mongoose.Schema(
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
    triggerType: {
      type: String,
      enum: ["keyword", "ad_click", "qr_scan", "after_hours", "unknown_reply"],
      required: true
    },
    triggerValue: {
      type: String,
      trim: true,
      maxlength: 120
    },
    firstReply: {
      type: String,
      required: true,
      trim: true,
      maxlength: 900
    },
    nodes: [{
      nextNodeId: { type: String, trim: true, maxlength: 80, default: "" },
      id: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
      },
      type: {
        type: String,
        enum: ["trigger", "message", "menu", "handoff"],
        required: true
      },
      title: {
        type: String,
        trim: true,
        maxlength: 140
      },
      keyword: {
        type: String,
        trim: true,
        maxlength: 120
      },
      message: {
        type: String,
        trim: true,
        maxlength: 900
      },
      routeTo: {
        type: String,
        enum: ["sales", "support", "billing", "human_agent"],
        default: "human_agent"
      },
      options: [{
        label: {
          type: String,
          trim: true,
          maxlength: 80
        },
        nextNodeId: {
          type: String,
          trim: true,
          maxlength: 80
        }
      }],
      position: {
        x: {
          type: Number,
          default: 0,
          min: 0,
          max: 5000
        },
        y: {
          type: Number,
          default: 0,
          min: 0,
          max: 5000
        }
      }
    }],
    edges: [{
      from: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
      },
      to: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
      },
      label: {
        type: String,
        trim: true,
        maxlength: 80
      }
    }],
    routeTo: {
      type: String,
      enum: ["sales", "support", "billing", "human_agent"],
      default: "human_agent"
    },
    controls: {
      stopOnAgentJoin: {
        type: Boolean,
        default: true
      },
      respectServiceWindow: {
        type: Boolean,
        default: true
      },
      requireOptInForTemplate: {
        type: Boolean,
        default: true
      },
      fallbackForUnknownReply: {
        type: Boolean,
        default: true
      }
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

automationFlowSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model("AutomationFlow", automationFlowSchema);
