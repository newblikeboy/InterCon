const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, index: true }, actorId: mongoose.Schema.Types.ObjectId,
  apiKeyId: mongoose.Schema.Types.ObjectId,
  action: { type: String, required: true, maxlength: 100 }, resourceId: { type: String, maxlength: 100 },
  requestId: { type: String, maxlength: 100 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 400 * 86400000) }
}, { timestamps: { createdAt: true, updatedAt: false } });
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("SecurityAudit", schema);
