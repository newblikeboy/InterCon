const express = require("express");
const multer = require("multer");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const concurrencyLimit = require("../middleware/concurrencyLimit");
const mediaController = require("../controllers/media.controller");
const HttpError = require("../utils/httpError");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename(req, file, callback) {
      callback(null, `intercon-${crypto.randomUUID()}${path.extname(file.originalname).slice(0, 12)}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!/^(image|video)\//.test(file.mimetype)) {
      callback(new HttpError(400, "Only photo and video files are supported"));
      return;
    }
    callback(null, true);
  }
});

function uploadSingle(req, res, next) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      if (req.file?.path) {
        const cleanup = () => fs.promises.unlink(req.file.path).catch(() => {});
        res.once("finish", cleanup);
        res.once("close", cleanup);
      }
      return next();
    }
    if (error instanceof multer.MulterError) {
      return next(new HttpError(400, error.code === "LIMIT_FILE_SIZE"
        ? "Media must be 50 MB or smaller"
        : error.message));
    }
    next(error);
  });
}

router.use(authenticate);
router.get("/", mediaController.listMedia);
router.post(
  "/",
  authorize("owner", "admin"),
  concurrencyLimit({ namespace: "media", max: 2, ttlMs: 2 * 60 * 1000 }),
  uploadSingle,
  mediaController.createMedia
);
router.delete("/:mediaId", authorize("owner", "admin"), mediaController.deleteMedia);

module.exports = router;
