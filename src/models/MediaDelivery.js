const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  keyHash: { type: String, required: true },
  fingerprint: { type: String, required: true },
  status: { type: String, enum: ["processing", "queued", "failed", "erased"], required: true },
  contactId: mongoose.Schema.Types.ObjectId,
  mediaId: String,
  messageId: mongoose.Schema.Types.ObjectId,
  actorId: mongoose.Schema.Types.ObjectId,
  apiKeyId: mongoose.Schema.Types.ObjectId,
  leaseToken: String,
  leaseUntil: Date
}, { timestamps: true });
schema.index({ tenantId: 1, keyHash: 1 }, { unique: true });
schema.index({ tenantId: 1, contactId: 1 });
// Durable keyed receipts prevent an old request from delivering again after
// operational records are erased. No original phone, filename or body is stored.
module.exports = mongoose.model("MediaDelivery", schema);
