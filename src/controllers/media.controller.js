const mediaService = require("../services/media.service");
const asyncHandler = require("../utils/asyncHandler");

const listMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.listMedia(req.tenantId, req.query);
  res.json({ success: true, media });
});

const createMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.createMedia(req.tenantId, req.file, req.body);
  res.status(201).json({ success: true, message: "Media uploaded", media });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const data = await mediaService.deleteMedia(req.tenantId, req.params.mediaId);
  res.json({ success: true, message: "Media deleted", ...data });
});

module.exports = { listMedia, createMedia, deleteMedia };
