const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientHash: { type: String, required: true },
  reason: { type: String, enum: ["erasure"], default: "erasure" }
}, { timestamps: true });
schema.index({ tenantId: 1, recipientHash: 1 }, { unique: true });
module.exports = mongoose.model("SuppressionEntry", schema);
