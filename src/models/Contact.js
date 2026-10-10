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
      }
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

module.exports = mongoose.model("Contact", contactSchema);
