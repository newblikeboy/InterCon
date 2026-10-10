const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorEmail: { type: String, required: true, maxlength: 160 },
  action: { type: String, required: true, maxlength: 100 },
  targetType: { type: String, required: true, enum: ["tenant", "user", "message", "webhook"] },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant" },
  reason: { type: String, required: true, maxlength: 1000 },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });
schema.index({ createdAt: -1 });
schema.index({ tenantId: 1, createdAt: -1 });
module.exports = mongoose.model("PlatformAudit", schema);
