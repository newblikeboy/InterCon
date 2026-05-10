const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    businessEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160
    },
    whatsappNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    businessGoal: {
      type: String,
      trim: true,
      maxlength: 160
    },
    onboardingStatus: {
      type: String,
      enum: ["account_created", "meta_pending", "meta_connected", "ready", "blocked"],
      default: "account_created"
    },
    meta: {
      wabaId: {
        type: String,
        trim: true,
        maxlength: 80
      },
      phoneNumberId: {
        type: String,
        trim: true,
        maxlength: 80
      },
      accessToken: {
        type: String,
        select: false
      }
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

tenantSchema.index({ businessEmail: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ "meta.wabaId": 1 });
tenantSchema.index({ "meta.phoneNumberId": 1 });

module.exports = mongoose.model("Tenant", tenantSchema);
