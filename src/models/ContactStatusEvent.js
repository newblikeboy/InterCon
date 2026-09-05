const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId },
  previousStatus: String,
  status: { type: String, enum: ["active", "blocked", "opted_out"], required: true },
  reason: { type: String, required: true, maxlength: 1000 }
}, { timestamps: true });
schema.index({ tenantId: 1, contactId: 1, createdAt: -1 });
module.exports = mongoose.model("ContactStatusEvent", schema);
