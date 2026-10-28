const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const concurrencyLimit = require("../middleware/concurrencyLimit");
const mediaController = require("../controllers/media.controller");
const uploadSingle = require("../middleware/mediaUpload");

const router = express.Router();
router.use(authenticate);
router.use(require("../middleware/privacyAudit")("media"));
router.get("/", mediaController.listMedia);
router.get("/:mediaId/content", require("../utils/asyncHandler")(require("../services/media.service").streamMedia));
router.post(
  "/",
  authorize("owner", "admin"),
  concurrencyLimit({ namespace: "media", max: 2, ttlMs: 2 * 60 * 1000 }),
  uploadSingle,
  mediaController.createMedia
);
router.delete("/:mediaId", authorize("owner", "admin"), mediaController.deleteMedia);

module.exports = router;
