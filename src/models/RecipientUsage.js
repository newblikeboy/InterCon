const mongoose = require("mongoose");

const recipientUsageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true
    },
    phoneNumberId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    lastAcceptedAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

recipientUsageSchema.index(
  { tenantId: 1, phoneNumberId: 1, recipient: 1 },
  { unique: true }
);
recipientUsageSchema.index({ tenantId: 1, phoneNumberId: 1, lastAcceptedAt: 1 });
recipientUsageSchema.index({ lastAcceptedAt: 1 }, { expireAfterSeconds: 2 * 24 * 60 * 60 });

module.exports = mongoose.model("RecipientUsage", recipientUsageSchema);
