const express = require("express");
const authenticate = require("../middleware/authenticate");
const metaController = require("../controllers/meta.controller");

const router = express.Router();

router.get("/embedded-signup-url", metaController.getEmbeddedSignupUrl);
router.get("/facebook-sdk-config", metaController.getFacebookSdkConfig);
router.get("/onboarding", authenticate, metaController.getOnboardingStatus);
router.post("/embedded-signup/complete", authenticate, metaController.completeEmbeddedSignup);
router.get("/oauth/callback", authenticate, metaController.handleOAuthCallback);
router.post("/oauth/exchange-token", authenticate, metaController.exchangeOAuthCode);

module.exports = router;
