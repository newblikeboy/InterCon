const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  inboundMessageId: { type: mongoose.Schema.Types.ObjectId, required: true },
  flowId: mongoose.Schema.Types.ObjectId,
  text: { type: String, maxlength: 4096, default: "" },
  receivedAt: { type: Date, default: Date.now },
  sequence: { type: Number, required: true },
  status: { type: String, enum: ["queued", "processing", "retry", "completed", "failed", "uncertain"], default: "queued" },
  action: { type: String, default: "queued" },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, default: Date.now },
  plan: mongoose.Schema.Types.Mixed,
  error: { type: String, maxlength: 1000, default: "" },
  completedAt: Date
}, { timestamps: true });
schema.index({ tenantId: 1, inboundMessageId: 1 }, { unique: true });
schema.index({ tenantId: 1, conversationId: 1, status: 1, sequence: 1 });
schema.index({ status: 1, nextAttemptAt: 1 });
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ completedAt: 1 }, { expireAfterSeconds: 30 * 86400 });
module.exports = mongoose.model("AutomationExecution", schema);
