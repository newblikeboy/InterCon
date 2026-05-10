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
    tags: [{
      type: String,
      trim: true,
      maxlength: 40
    }],
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

module.exports = mongoose.model("Contact", contactSchema);
