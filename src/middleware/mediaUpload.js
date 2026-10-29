const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const HttpError = require("../utils/httpError");
const privateUploads = require("../utils/privateUploads");

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      fs.mkdtemp(path.join(os.tmpdir(), "intercon-private-"), (error, directory) => {
        if (directory) { req.privateUploadDirectory = directory; privateUploads.track(directory); }
        callback(error, directory);
      });
    },
    filename(req, file, callback) { callback(null, crypto.randomUUID()); }
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024 },
  fileFilter(req, file, callback) {
    callback(/^(image|video)\//.test(file.mimetype) || file.mimetype === "application/pdf"
      ? null : new HttpError(400, "Only photo, video, and PDF files are supported"), true);
  }
});

module.exports = function uploadSingle(req, res, next) {
  const cleanup = async () => {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
    if (req.privateUploadDirectory) {
      await fs.promises.rmdir(req.privateUploadDirectory).catch(() => {});
      privateUploads.release(req.privateUploadDirectory);
    }
  };
  res.once("finish", cleanup); res.once("close", cleanup);
  upload.single("file")(req, res, async error => {
    if (!error) return next();
    await cleanup();
    next(error instanceof multer.MulterError ? new HttpError(400, error.code === "LIMIT_FILE_SIZE"
      ? "Media must be 50 MB or smaller" : "Choose one file and valid delivery fields") : error);
  });
};
