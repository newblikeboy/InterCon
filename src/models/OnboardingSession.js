const mongoose = require("mongoose");

const onboardingSessionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    stateHash: {
      type: String,
      required: true,
      unique: true,
      maxlength: 64
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    usedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

onboardingSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
onboardingSessionSchema.index({ tenantId: 1, userId: 1, usedAt: 1 });

module.exports = mongoose.model("OnboardingSession", onboardingSessionSchema);
