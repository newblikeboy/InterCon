const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { v2: cloudinary } = require("cloudinary");
const MediaAsset = require("../models/MediaAsset");
const Message = require("../models/Message");
const Template = require("../models/Template");
const env = require("../config/env");
const HttpError = require("../utils/httpError");
const { cursorFilter, pageSize } = require("../utils/pagination");
const { fetchWithPolicy } = require("../utils/httpClient");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

function downloadUrl(asset) {
  assertCloudinaryConfigured();
  return cloudinary.utils.private_download_url(asset.cloudinaryPublicId, asset.format || undefined, {
    resource_type: asset.mediaType === "document" ? "raw" : asset.mediaType,
    type: asset.deliveryType || "upload", expires_at: Math.floor(Date.now() / 1000) + 300, attachment: false
  });
}

function isRecipientMedia(asset) { return asset?.deliveryScope === "recipient" || asset?.purpose === "patient_report" || Boolean(asset?.recipientContactId); }
function recipientHash(tenantId, phone) { return require("../utils/privateData").lookup(String(phone), `MediaAsset.recipient:${tenantId}`); }
function assertReportRecipient(asset, contact, template) {
  if (asset.disabledAt || asset.accessExpiresAt && new Date(asset.accessExpiresAt) <= new Date()) throw new HttpError(410, "This media is no longer available");
  if (isRecipientMedia(asset)) {
    if (asset.deliveryType !== "authenticated") throw new HttpError(409, "Recipient-specific media requires private storage");
    if (!contact || String(asset.recipientContactId) !== String(contact._id)) throw new HttpError(403, "This media belongs to a different recipient");
    if (asset.recipientHash && asset.recipientHash !== recipientHash(asset.tenantId, contact.phone)) throw new HttpError(403, "The recipient number changed after this media was uploaded");
  }
  if (asset.purpose !== "patient_report") return;
  if (asset.deliveryType !== "authenticated") throw new HttpError(409, "Patient reports require private storage");
  if (!contact || String(asset.recipientContactId) !== String(contact._id)) throw new HttpError(403, "This report belongs to a different recipient");
  if (!asset.recipientVerifiedAt || !asset.consentReference) throw new HttpError(409, "Record patient permission and verify the recipient before sending this report");
  if (template?.category !== "utility") throw new HttpError(400, "Patient reports can only use a utility template");
}

async function streamMedia(req, res) {
  const asset = await MediaAsset.findOne({ tenantId: req.tenantId, mediaId: req.params.mediaId }).select("+recipientHash").lean();
  if (!asset) throw new HttpError(404, "Media not found");
  if (isRecipientMedia(asset) && !["owner", "admin"].includes(req.user.role)) throw new HttpError(403, "Only workspace owners and admins may download recipient-specific media");
  const recipient = isRecipientMedia(asset) ? await require("../models/Contact").findOne({ _id: asset.recipientContactId, tenantId: req.tenantId }).select("phone").lean() : null;
  if (isRecipientMedia(asset) && !recipient) throw new HttpError(410, "The media recipient is no longer available");
  assertReportRecipient(asset, recipient, { category: "utility" });
  await require("../models/SecurityAudit").create({ tenantId: req.tenantId, actorId: req.user._id,
    action: "media.read", resourceId: asset.mediaId, requestId: req.id });
  await MediaAsset.updateOne({ _id: asset._id }, { $max: { lastProcessedAt: new Date() } });
  const upstream = await fetchWithPolicy(downloadUrl(asset), { headers: req.headers.range ? { Range: req.headers.range } : {} });
  if (![200, 206].includes(upstream.status) || !upstream.body) throw new HttpError(502, "Unable to retrieve media");
  res.status(upstream.status);
  res.set({ "Cache-Control": "no-store, private", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
    "Content-Type": asset.mimeType || "application/octet-stream",
    "Content-Disposition": asset.mediaType === "document" ? 'attachment; filename="document.pdf"' : "inline" });
  for (const header of ["content-length", "content-range", "accept-ranges"]) if (upstream.headers.get(header)) res.set(header, upstream.headers.get(header));
  await pipeline(Readable.fromWeb(upstream.body), res);
}

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true
});

function assertCloudinaryConfigured() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new HttpError(503, "Cloudinary is not configured");
  }
}

function publicMedia(asset) {
  return {
    id: String(asset._id),
    mediaId: asset.mediaId,
    title: asset.title,
    description: asset.description || "",
    mediaType: asset.mediaType,
    originalName: asset.originalName || "",
    mimeType: asset.mimeType || "",
    format: asset.format || "",
    bytes: asset.bytes || 0,
    width: asset.width || null,
    height: asset.height || null,
    duration: asset.duration || null,
    url: `/api/media/${encodeURIComponent(asset.mediaId)}/content`,
    purpose: asset.purpose || "general", deliveryScope: isRecipientMedia(asset) ? "recipient" : "shared", recipientContactId: asset.recipientContactId, accessExpiresAt: asset.accessExpiresAt,
    createdAt: asset.createdAt
  };
}

async function detectMediaType(filePath) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(32);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const head = buffer.subarray(0, bytesRead);
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
      return { mediaType: "image", mimeType: "image/jpeg" };
    }
    if (head.subarray(0, 5).toString("ascii") === "%PDF-") {
      return { mediaType: "document", mimeType: "application/pdf" };
    }
    if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { mediaType: "image", mimeType: "image/png" };
    }
    if (head.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/)) {
      return { mediaType: "image", mimeType: "image/gif" };
    }
    if (head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP") {
      return { mediaType: "image", mimeType: "image/webp" };
    }
    if (head.length >= 12 && head.subarray(4, 8).toString("ascii") === "ftyp") {
      const brand = head.subarray(8, 12).toString("ascii").toLowerCase();
      const mimeType = brand.startsWith("3g") ? "video/3gpp"
        : brand.includes("qt") ? "video/quicktime"
          : "video/mp4";
      return { mediaType: "video", mimeType };
    }
    if (head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
      return { mediaType: "video", mimeType: "video/webm" };
    }
    return null;
  } finally {
    await handle.close();
  }
}

async function listMedia(tenantId, query = {}) {
  const filter = { tenantId, ...cursorFilter(query.after) };
  if (["image", "video", "document"].includes(query.type)) filter.mediaType = query.type;

  const assets = await MediaAsset.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize(query.limit, 200))
    .lean();

  return assets.map(publicMedia);
}

async function createMedia(tenantId, file, body = {}, actorId, apiKeyId) {
  assertCloudinaryConfigured();
  if (!file?.path) throw new HttpError(400, "Choose a photo, video, or PDF to upload");

  const detected = await detectMediaType(file.path);
  if (!detected) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(400, "The uploaded file is not a supported photo, video, or PDF");
  }
  const mediaType = detected.mediaType;
  const purpose = String(body.purpose || "general");
  if (mediaType === "document" && !body.purpose) throw new HttpError(400, "Classify this PDF as general business media or a patient report");
  if (!["general", "patient_report"].includes(purpose)) throw new HttpError(400, "Choose a valid media purpose");
  const deliveryScope = purpose === "patient_report" || body.recipientContactId ? "recipient" : String(body.deliveryScope || "shared");
  if (!["shared", "recipient"].includes(deliveryScope)) throw new HttpError(400, "Choose shared or recipient-specific media");
  let recipient;
  if (purpose === "patient_report") {
    if (!await require("../models/Tenant").exists({ _id: tenantId, "processingTerms.version": "2026-10-29" })) throw new HttpError(409, "The workspace owner must accept the Data Processing Terms in the Privacy Center before uploading patient reports");
    if (mediaType !== "document") throw new HttpError(400, "Patient reports must be PDF documents");
  }
  if (deliveryScope === "recipient") {
    if (!mongoose.isValidObjectId(body.recipientContactId)) throw new HttpError(400, "Choose the intended recipient contact");
    recipient = await require("../models/Contact").findOne({ _id: body.recipientContactId, tenantId }).lean();
    if (!recipient || recipient.status !== "active") throw new HttpError(400, "Choose an active recipient in this workspace");
    if (![true, "true", "on"].includes(body.recipientVerified)) throw new HttpError(400, "Confirm the intended recipient and your authority to send this file");
    if (purpose === "patient_report" && !String(body.consentReference || "").trim()) throw new HttpError(400, "Provide the client's permission reference for this report");
  }
  const title = String(body.title || path.parse(file.originalname).name || "Untitled media").trim();
  const description = String(body.description || "").trim();
  if (!title) throw new HttpError(400, "Media title is required");
  if (title.length > 140 || description.length > 500 || String(body.consentReference || "").length > 240) throw new HttpError(400, "Media metadata exceeds its maximum length");

  const [assetCount, storage] = await Promise.all([
    MediaAsset.countDocuments({ tenantId }),
    MediaAsset.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(String(tenantId)) } },
      { $group: { _id: null, bytes: { $sum: "$bytes" } } }
    ])
  ]);
  if (assetCount >= env.mediaMaxAssetsPerTenant) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(409, "Media asset limit reached for this workspace");
  }
  if (Number(storage[0]?.bytes || 0) + Number(file.size || 0) > env.mediaStorageQuotaBytes) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(409, "Media storage quota reached for this workspace");
  }

  const draft = new MediaAsset({
    tenantId,
    purpose, deliveryScope, deliveryType: "authenticated",
    ...(recipient ? { recipientContactId: recipient._id, recipientVerifiedAt: new Date(),
      recipientHash: recipientHash(tenantId, recipient.phone), recipientVerifiedBy: actorId, recipientVerifiedByApiKey: apiKeyId,
      consentReference: String(body.consentReference || "").trim(), accessExpiresAt: new Date(Date.now() + 30 * 86400000) } : {}),
    title,
    description,
    mediaType,
    originalName: file.originalname,
    mimeType: detected.mimeType,
    cloudinaryPublicId: "pending",
    secureUrl: "pending"
  });
  const folder = `${env.cloudinaryFolder.replace(/\/+$/, "")}/${tenantId}`;
  let uploaded;

  try {
    uploaded = await cloudinary.uploader.upload(file.path, {
      type: "authenticated",
      resource_type: mediaType === "document" ? "raw" : mediaType,
      folder,
      public_id: draft.mediaId,
      overwrite: false,
      unique_filename: false,
      use_filename: false
    });

    draft.cloudinaryPublicId = uploaded.public_id;
    draft.cloudinaryAssetId = uploaded.asset_id || "";
    draft.secureUrl = uploaded.secure_url;
    draft.format = uploaded.format || "";
    draft.bytes = uploaded.bytes || file.size || 0;
    draft.width = uploaded.width;
    draft.height = uploaded.height;
    draft.duration = uploaded.duration;
    await draft.save();
  } catch (error) {
    if (uploaded?.public_id) {
      await cloudinary.uploader.destroy(uploaded.public_id, {
        type: "authenticated",
        resource_type: mediaType === "document" ? "raw" : mediaType,
        invalidate: true
      }).catch(() => null);
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, error.message || "Cloudinary upload failed");
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }

  return publicMedia(draft);
}

async function deleteMedia(tenantId, mediaId) {
  assertCloudinaryConfigured();
  const asset = await MediaAsset.findOne({ tenantId, mediaId });
  if (!asset) throw new HttpError(404, "Media not found");
  if (asset.legalHoldUntil && asset.legalHoldUntil > new Date()) throw new HttpError(409, "This media is subject to a legal retention hold");
  const retention = require("../utils/privacyRetention").processingRetentionUntil([asset]);
  if (isRecipientMedia(asset) && retention && retention > new Date()) throw new HttpError(409, "The media's minimum retention period has not ended. Restrict access and record the deferred erasure request");

  const pendingMessage = await Message.exists({
    tenantId,
    mediaId,
    status: { $in: ["queued", "scheduled", "processing"] }
  });
  if (pendingMessage) {
    throw new HttpError(409, "This media is attached to a queued WhatsApp message. Wait for it to finish before deleting the asset.");
  }

  const result = await cloudinary.uploader.destroy(asset.cloudinaryPublicId, {
    type: asset.deliveryType || "upload",
    resource_type: asset.mediaType === "document" ? "raw" : asset.mediaType,
    invalidate: true
  });
  if (!["ok", "not found"].includes(result.result)) {
    throw new HttpError(502, "Cloudinary could not delete this media");
  }

  await Template.updateMany(
    { tenantId, headerMediaId: mediaId },
    { $unset: { headerMediaId: "" } }
  );
  await asset.deleteOne();
  return { mediaId: asset.mediaId };
}

module.exports = {
  isRecipientMedia, recipientHash, detectMediaType,
  downloadUrl, assertReportRecipient, streamMedia,
  listMedia,
  createMedia,
  deleteMedia
};
