const mongoose = require("mongoose");

const contactSegmentSchema = new mongoose.Schema(
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
      maxlength: 100
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 40
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240
    }
  },
  {
    timestamps: true
  }
);

contactSegmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("ContactSegment", contactSegmentSchema);
