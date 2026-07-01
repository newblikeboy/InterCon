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
      enum: ["image", "video"],
      required: true,
      index: true
    },
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

module.exports = mongoose.model("MediaAsset", mediaAssetSchema);
