const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Tenant" },
  key: { type: String, required: true, maxlength: 160 },
  requestHash: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });
schema.index({ tenantId: 1, key: 1 }, { unique: true });
module.exports = mongoose.model("MessageBatch", schema);
