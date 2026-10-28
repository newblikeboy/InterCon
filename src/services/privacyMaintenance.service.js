const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const Media = require("../models/MediaAsset");
const Contact = require("../models/Contact");
require("./media.service"); // Configure the provider, without making requests.

async function media({ apply = false } = {}) {
  const result = { pending: 0, migrated: 0 };
  for await (const raw of Media.collection.find({ deliveryType: { $ne: "authenticated" } })) {
    result.pending++;
    if (!apply) continue;
    const options = { resource_type: raw.mediaType === "document" ? "raw" : raw.mediaType,
      type: raw.deliveryType || "upload", to_type: "authenticated", invalidate: true, overwrite: false };
    let changed;
    try { changed = await cloudinary.uploader.rename(raw.cloudinaryPublicId, raw.cloudinaryPublicId, options); }
    catch (error) {
      // Recover a provider success followed by a failed database write, while
      // refusing to adopt a different asset with the same identifier.
      const current = await cloudinary.api.resource(raw.cloudinaryPublicId, { resource_type: options.resource_type, type: "authenticated" }).catch(() => null);
      if (!current || !raw.cloudinaryAssetId || current.asset_id !== raw.cloudinaryAssetId) throw error;
      changed = current;
    }
    await Media.collection.updateOne({ _id: raw._id }, { $set: { deliveryType: "authenticated", secureUrl: changed.secure_url } });
    result.migrated++;
  }
  return result;
}
async function indexes({ apply = false } = {}) {
  const targets = [
    [require("../models/WebhookEvent"), "createdAt", 366 * 86400],
    [require("../models/RecipientUsage"), "lastAcceptedAt", 2 * 86400],
    [require("../models/OnboardingSession"), "expiresAt", 0]
  ];
  const results = [];
  for (const [model, field, seconds] of targets) {
    const existing = await model.collection.indexes().catch(error => { if (error.code === 26) return []; throw error; });
    const index = existing.find(item => Object.keys(item.key).length === 1 && item.key[field] === 1);
    const pending = !index || index.expireAfterSeconds !== seconds;
    if (apply && pending) {
      if (index) await mongoose.connection.db.command({ collMod: model.collection.name, index: { name: index.name, expireAfterSeconds: seconds } });
      else await model.collection.createIndex({ [field]: 1 }, { expireAfterSeconds: seconds });
    }
    results.push({ model: model.modelName, pending, targetSeconds: seconds, applied: apply && pending });
  }
  return results;
}
async function consent({ apply = false } = {}) {
  const result = { pending: 0, migrated: 0 }; let after;
  for (;;) {
    const contacts = await Contact.find(after ? { _id: { $gt: after } } : {}).sort({ _id: 1 }).limit(200).lean();
    if (!contacts.length) return result;
    for (const contact of contacts) {
      if (contact.source !== "whatsapp_inbound" || contact.optIn?.proof !== "Customer initiated WhatsApp conversation") continue;
      result.pending++;
      if (apply) {
        const written = await Contact.updateOne({ _id: contact._id, updatedAt: contact.updatedAt }, { $set: {
          "optIn.status": false, "optIn.proof": "Inbound enquiry only; no business-initiated opt-in recorded"
        } });
        result.migrated += written.modifiedCount;
      }
    }
    after = contacts.at(-1)._id;
  }
}
async function reports({ apply = false } = {}) {
  const cutoff = new Date(Date.now() - 366 * 86400000);
  const filter = { $or: [{ purpose: "patient_report" }, { deliveryScope: "recipient" }], accessExpiresAt: { $lt: new Date() }, $and: [
    { $or: [{ lastProcessedAt: { $lte: cutoff } }, { lastProcessedAt: { $exists: false }, createdAt: { $lte: cutoff } }] },
    { $or: [{ legalHoldUntil: { $exists: false } }, { legalHoldUntil: { $lte: new Date() } }] }
  ] };
  const result = { eligible: await Media.countDocuments(filter), deleted: 0 };
  if (apply) for (const asset of await Media.find(filter).select("tenantId mediaId").lean()) {
    await require("./media.service").deleteMedia(asset.tenantId, asset.mediaId); result.deleted++;
  }
  return result;
}
async function deliveries({ apply = false } = {}) {
  const Receipt = require("../models/MediaDelivery"), Message = require("../models/Message");
  const result = { stale: 0, reconciled: 0, retryable: 0 };
  for await (const row of Receipt.find({ status: "processing", leaseUntil: { $lt: new Date() } }).lean().cursor()) {
    result.stale++;
    const message = await Message.findOne({ tenantId: row.tenantId, idempotencyKey: `media-delivery:${row._id}` }).select("_id mediaId").lean();
    if (!apply) continue;
    const change = message ? { status: "queued", messageId: message._id, mediaId: message.mediaId } : { status: "failed" };
    const written = await Receipt.updateOne({ _id: row._id, status: "processing", leaseToken: row.leaseToken,
      leaseUntil: { $lt: new Date() } }, { $set: change, $unset: { leaseToken: "", leaseUntil: "" } });
    if (written.modifiedCount) { if (message) result.reconciled++; else result.retryable++; }
  }
  return result;
}
async function review() {
  return { overdueRequests: await require("../models/PrivacyRequest").countDocuments({ status: { $nin: ["fulfilled", "rejected"] }, dueAt: { $lt: new Date() } }),
    publicMedia: await Media.countDocuments({ deliveryType: { $ne: "authenticated" } }),
    stalledMediaDeliveries: await require("../models/MediaDelivery").countDocuments({ status: "processing", leaseUntil: { $lt: new Date() } }),
    failedMediaDeliveries: await require("../models/MediaDelivery").countDocuments({ status: "failed" }),
    expiredRecipientMedia: await Media.countDocuments({ deliveryScope: "recipient", accessExpiresAt: { $lt: new Date() } }),
    expiredReportAccess: await Media.countDocuments({ purpose: "patient_report", accessExpiresAt: { $lt: new Date() } }),
    legacyInboundConsent: (await consent()).pending };
}
module.exports = { media, indexes, consent, reports, deliveries, review };
