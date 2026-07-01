const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const MediaAsset = require("../models/MediaAsset");
const Message = require("../models/Message");
const Template = require("../models/Template");
const env = require("../config/env");
const HttpError = require("../utils/httpError");

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
    url: asset.secureUrl,
    createdAt: asset.createdAt
  };
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

async function listMedia(tenantId, query = {}) {
  const filter = { tenantId };
  if (["image", "video"].includes(query.type)) filter.mediaType = query.type;

  const assets = await MediaAsset.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return assets.map(publicMedia);
}

async function createMedia(tenantId, file, body = {}) {
  assertCloudinaryConfigured();
  if (!file?.buffer) throw new HttpError(400, "Choose a photo or video to upload");

  const mediaType = file.mimetype.startsWith("video/") ? "video" : "image";
  const title = String(body.title || path.parse(file.originalname).name || "Untitled media").trim();
  const description = String(body.description || "").trim();
  if (!title) throw new HttpError(400, "Media title is required");

  const draft = new MediaAsset({
    tenantId,
    title,
    description,
    mediaType,
    originalName: file.originalname,
    mimeType: file.mimetype,
    cloudinaryPublicId: "pending",
    secureUrl: "pending"
  });
  const folder = `${env.cloudinaryFolder.replace(/\/+$/, "")}/${tenantId}`;
  let uploaded;

  try {
    uploaded = await uploadBuffer(file.buffer, {
      resource_type: mediaType,
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
        resource_type: mediaType,
        invalidate: true
      }).catch(() => null);
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, error.message || "Cloudinary upload failed");
  }

  return publicMedia(draft);
}

async function deleteMedia(tenantId, mediaId) {
  assertCloudinaryConfigured();
  const asset = await MediaAsset.findOne({ tenantId, mediaId });
  if (!asset) throw new HttpError(404, "Media not found");

  const pendingMessage = await Message.exists({
    tenantId,
    mediaId,
    status: { $in: ["queued", "scheduled", "processing"] }
  });
  if (pendingMessage) {
    throw new HttpError(409, "This media is attached to a queued WhatsApp message. Wait for it to finish before deleting the asset.");
  }

  const result = await cloudinary.uploader.destroy(asset.cloudinaryPublicId, {
    resource_type: asset.mediaType,
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
  listMedia,
  createMedia,
  deleteMedia
};
