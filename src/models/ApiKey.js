const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
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
      maxlength: 80
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      maxlength: 18
    },
    lastFour: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
      index: true
    },
    lastUsedAt: {
      type: Date
    },
    revokedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

apiKeySchema.index({ tenantId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
