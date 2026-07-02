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
      onboardingType: {
        type: String,
        trim: true,
        enum: ["cloud_api", "coexistence"],
        default: "cloud_api"
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
      displayPhoneNumber: {
        type: String,
        trim: true,
        maxlength: 40
      },
      phoneStatus: {
        type: String,
        trim: true,
        maxlength: 80
      },
      accountMode: {
        type: String,
        trim: true,
        maxlength: 80
      },
      codeVerificationStatus: {
        type: String,
        trim: true,
        maxlength: 80
      },
      verifiedName: {
        type: String,
        trim: true,
        maxlength: 160
      },
      nameStatus: {
        type: String,
        trim: true,
        maxlength: 80
      },
      newNameStatus: {
        type: String,
        trim: true,
        maxlength: 80
      },
      displayNameDecision: {
        type: String,
        trim: true,
        maxlength: 80
      },
      displayNameRejectionReason: {
        type: String,
        trim: true,
        maxlength: 300
      },
      qualityRating: {
        type: String,
        trim: true,
        maxlength: 40
      },
      messagingLimitTier: {
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
      lastPhoneSetupError: {
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
    billing: {
      plan: {
        type: String,
        enum: ["none", "monthly", "quarterly", "yearly"],
        default: "none"
      },
      status: {
        type: String,
        enum: ["not_started", "pending_payment", "active", "past_due", "cancelled"],
        default: "not_started",
        index: true
      },
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: "INR",
        trim: true,
        maxlength: 8
      },
      selectedAt: {
        type: Date
      },
      activatedAt: {
        type: Date
      },
      currentPeriodEnd: {
        type: Date
      },
      razorpayOrderId: {
        type: String,
        trim: true,
        maxlength: 120
      },
      razorpayPaymentId: {
        type: String,
        trim: true,
        maxlength: 120
      },
      razorpaySignature: {
        type: String,
        trim: true,
        maxlength: 180
      },
      receipt: {
        type: String,
        trim: true,
        maxlength: 120
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
tenantSchema.index(
  { "meta.wabaId": 1 },
  { unique: true, partialFilterExpression: { "meta.wabaId": { $type: "string", $gt: "" } } }
);
tenantSchema.index(
  { "meta.phoneNumberId": 1 },
  { unique: true, partialFilterExpression: { "meta.phoneNumberId": { $type: "string", $gt: "" } } }
);
tenantSchema.index({ "billing.status": 1, "billing.plan": 1 });

tenantSchema.methods.getMetaAccessToken = function getMetaAccessToken() {
  return decryptSecret(this.meta?.accessToken);
};

module.exports = mongoose.model("Tenant", tenantSchema);
