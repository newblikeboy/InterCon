const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
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
      maxlength: 120
    },
    category: {
      type: String,
      enum: ["utility", "marketing", "authentication"],
      required: true
    },
    language: {
      type: String,
      default: "en",
      trim: true,
      maxlength: 20
    },
    body: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    parameterCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    headerType: {
      type: String,
      enum: ["none", "image", "video"],
      default: "none"
    },
    headerMediaId: {
      type: String,
      trim: true,
      maxlength: 80
    },
    status: {
      type: String,
      enum: ["draft", "in_review", "approved", "rejected", "paused", "disabled"],
      default: "draft",
      index: true
    },
    qualityRating: {
      type: String,
      enum: ["unknown", "high", "medium", "low"],
      default: "unknown"
    },
    metaTemplateId: {
      type: String,
      trim: true,
      maxlength: 120
    },
    rejectedReason: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

templateSchema.index({ tenantId: 1, name: 1, language: 1 }, { unique: true });

module.exports = mongoose.model("Template", templateSchema);
