const mongoose = require("mongoose");
const { decryptSecret, encryptSecret } = require("../utils/crypto");

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
      businessId: {
        type: String,
        trim: true,
        maxlength: 80
      },
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
      appId: {
        type: String,
        trim: true,
        maxlength: 80
      },
      tokenType: {
        type: String,
        trim: true,
        maxlength: 40
      },
      tokenExpiresAt: {
        type: Date
      },
      connectedAt: {
        type: Date
      },
      signupSessionId: {
        type: String,
        trim: true,
        maxlength: 120
      },
      lastSignupEvent: {
        type: String,
        trim: true,
        maxlength: 120
      },
      lastSignupError: {
        type: String,
        trim: true,
        maxlength: 500
      },
      accessToken: {
        type: String,
        set: encryptSecret,
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
tenantSchema.index({ "meta.businessId": 1 });
tenantSchema.index({ "meta.wabaId": 1 });
tenantSchema.index({ "meta.phoneNumberId": 1 });

tenantSchema.methods.getMetaAccessToken = function getMetaAccessToken() {
  return decryptSecret(this.meta?.accessToken);
};

module.exports = mongoose.model("Tenant", tenantSchema);
