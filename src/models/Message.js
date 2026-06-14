const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact"
    },
    to: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    type: {
      type: String,
      enum: ["template"],
      default: "template"
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    language: {
      type: String,
      default: "en",
      trim: true,
      maxlength: 20
    },
    variables: [{
      type: String,
      trim: true,
      maxlength: 300
    }],
    metaMessageId: {
      type: String,
      trim: true,
      maxlength: 160
    },
    status: {
      type: String,
      enum: ["queued", "accepted", "sent", "delivered", "read", "failed"],
      default: "queued",
      index: true
    },
    error: {
      type: String,
      maxlength: 500
    }
  },
  {
    timestamps: true
  }
);

messageSchema.index({ tenantId: 1, createdAt: -1 });
messageSchema.index({ tenantId: 1, to: 1 });

module.exports = mongoose.model("Message", messageSchema);
