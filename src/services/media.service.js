const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
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

async function detectMediaType(filePath) {
  const handle = await fs.promises.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(32);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const head = buffer.subarray(0, bytesRead);
    if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
      return { mediaType: "image", mimeType: "image/jpeg" };
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
  if (!file?.path) throw new HttpError(400, "Choose a photo or video to upload");

  const detected = await detectMediaType(file.path);
  if (!detected) {
    await fs.promises.unlink(file.path).catch(() => {});
    throw new HttpError(400, "The uploaded file is not a supported photo or video");
  }
  const mediaType = detected.mediaType;
  const title = String(body.title || path.parse(file.originalname).name || "Untitled media").trim();
  const description = String(body.description || "").trim();
  if (!title) throw new HttpError(400, "Media title is required");

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
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
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
