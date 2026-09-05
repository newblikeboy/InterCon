const express = require("express");
const authenticate = require("../middleware/authenticate");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", require("../middleware/security").accountLimiter, authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);
router.get("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

const { passwordLimiter } = require("../middleware/security");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
router.post("/forgot-password", passwordLimiter, asyncHandler(async (req, res) => {
  res.json({ success: true, ...await authService.requestPasswordReset(req.body.email) });
}));
router.post("/reset-password", passwordLimiter, asyncHandler(async (req, res) => {
  res.json({ success: true, ...await authService.resetPassword(req.body) });
}));
module.exports = router;
