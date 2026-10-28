const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true }, actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  recipientHash: { type: String, required: true }, reference: { type: String, required: true, maxlength: 240 },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 400 * 86400000) }
}, { timestamps: true });
schema.index({ tenantId: 1, recipientHash: 1 }); schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.plugin(require("./plugins/privateFields"), { namespace: "ConsentEvidence", fields: { reference: { max: 240 } } });
module.exports = mongoose.model("ConsentEvidence", schema);
