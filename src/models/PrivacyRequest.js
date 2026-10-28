const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true }, requesterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  subject: { type: String, enum: ["account", "customer"], required: true }, contactId: mongoose.Schema.Types.ObjectId,
  kind: { type: String, enum: ["access", "correction", "erasure", "withdrawal", "nomination", "grievance"], required: true },
  status: { type: String, enum: ["submitted", "verified", "in_review", "fulfilled", "rejected"], default: "submitted" },
  notes: { type: String, maxlength: 2000 }, response: { type: String, maxlength: 2000 },
  verifiedAt: Date, verifiedBy: mongoose.Schema.Types.ObjectId, resolvedAt: Date,
  processingRetentionEvaluatedAt: Date,
  dueAt: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) }, legalHoldUntil: Date
}, { timestamps: true });
schema.index({ tenantId: 1, requesterId: 1, createdAt: -1 });
schema.index({ status: 1, dueAt: 1 });
schema.plugin(require("./plugins/privateFields"), { namespace: "PrivacyRequest", fields: { notes: { max: 2000 }, response: { max: 2000 } } });
module.exports = mongoose.model("PrivacyRequest", schema);
