const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 160
    },
    city: {
      type: String,
      trim: true,
      maxlength: 80
    },
    source: {
      type: String,
      trim: true,
      maxlength: 120
    },
    tags: {
      type: [{
        type: String,
        trim: true,
        maxlength: 40
      }],
      default: [],
      validate: {
        validator: (tags) => !Array.isArray(tags) || tags.length <= 1,
        message: "A contact can have only one tag"
      }
    },
    optIn: {
      status: {
        type: Boolean,
        default: false
      },
      proof: {
        type: String,
        trim: true,
        maxlength: 240
      },
      capturedAt: {
        type: Date
      },
      recordedBy: mongoose.Schema.Types.ObjectId,
      scope: { type: String, enum: ["business_messages", "service_only"], default: "business_messages" },
      purpose: { type: String, maxlength: 240 },
      noticeVersion: { type: String, maxlength: 80 }
    },
    suppression: {
      type: new mongoose.Schema({
        kind: { type: String, enum: ["manual", "customer_block", "delivery_failure", "opt_out"], required: true },
        reason: { type: String, required: true, maxlength: 1000 },
        recordedAt: { type: Date, required: true },
        errorCode: Number,
        metaMessageId: { type: String, maxlength: 160 }
      }, { _id: false }),
      default: undefined
    },
    suppressionClearedAt: Date,
    status: {
      type: String,
      enum: ["active", "opted_out", "blocked"],
      default: "active",
      index: true
    }
  },
  {
    timestamps: true
  }
);

contactSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
contactSchema.index({ tenantId: 1, tags: 1 });
contactSchema.index({ tenantId: 1, status: 1, tags: 1 });

contactSchema.plugin(require("./plugins/privateFields"), {
  namespace: "Contact",
  fields: {
    name: { max: 140, search: true },
    phone: { lookup: true, max: 32, search: true },
    email: { lowercase: true, max: 160 },
    city: { max: 80 }, source: { max: 120 },
    "optIn.proof": { max: 240 }, "optIn.purpose": { max: 240 }, "suppression.reason": { max: 1000 }
  }
});

module.exports = mongoose.model("Contact", contactSchema);
