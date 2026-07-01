const express = require("express");
const multer = require("multer");
const authenticate = require("../middleware/authenticate");
const mediaController = require("../controllers/media.controller");
const HttpError = require("../utils/httpError");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
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
    if (!error) return next();
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
router.post("/", uploadSingle, mediaController.createMedia);
router.delete("/:mediaId", mediaController.deleteMedia);

module.exports = router;
