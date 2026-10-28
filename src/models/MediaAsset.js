const crypto = require("crypto");
const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    mediaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => `MED-${crypto.randomUUID()}`
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "document"],
      required: true,
      index: true
    },
    purpose: { type: String, enum: ["general", "patient_report"], default: "general" },
    deliveryScope: { type: String, enum: ["shared", "recipient"], default: "shared" },
    recipientContactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", index: true },
    recipientHash: { type: String, select: false },
    recipientVerifiedAt: Date,
    recipientVerifiedBy: mongoose.Schema.Types.ObjectId,
    recipientVerifiedByApiKey: mongoose.Schema.Types.ObjectId,
    consentReference: { type: String, maxlength: 240 },
    deliveryType: { type: String, enum: ["upload", "authenticated"], default: "upload" },
    accessExpiresAt: Date,
    lastProcessedAt: { type: Date, default: Date.now },
    legalHoldUntil: Date,
    disabledAt: Date,
    originalName: {
      type: String,
      trim: true,
      maxlength: 255
    },
    mimeType: {
      type: String,
      trim: true,
      maxlength: 120
    },
    format: {
      type: String,
      trim: true,
      maxlength: 32
    },
    bytes: {
      type: Number,
      min: 0,
      default: 0
    },
    width: Number,
    height: Number,
    duration: Number,
    cloudinaryPublicId: {
      type: String,
      required: true,
      unique: true
    },
    cloudinaryAssetId: {
      type: String,
      trim: true
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

mediaAssetSchema.index({ tenantId: 1, createdAt: -1 });
mediaAssetSchema.plugin(require("./plugins/privateFields"), {
  namespace: "MediaAsset", fields: {
    title: { max: 140 }, description: { max: 500 }, originalName: { max: 255 }, consentReference: { max: 240 }
  }
});

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
