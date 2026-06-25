const express = require("express");
const authenticate = require("../middleware/authenticate");
const metaController = require("../controllers/meta.controller");

const router = express.Router();

router.get("/embedded-signup-url", metaController.getEmbeddedSignupUrl);
router.get("/facebook-sdk-config", metaController.getFacebookSdkConfig);
router.get("/onboarding", authenticate, metaController.getOnboardingStatus);
router.delete("/onboarding", authenticate, metaController.deleteConnectedWaba);
router.get("/diagnostics", authenticate, metaController.getMetaDiagnostics);
router.post("/embedded-signup/complete", authenticate, metaController.completeEmbeddedSignup);
router.get("/phone/status", authenticate, metaController.getPhoneNumberStatus);
router.post("/phone/request-code", authenticate, metaController.requestPhoneVerificationCode);
router.post("/phone/verify-code", authenticate, metaController.verifyPhoneCode);
router.post("/phone/register", authenticate, metaController.registerPhoneNumber);
router.post("/phone/deregister", authenticate, metaController.deregisterPhoneNumber);
router.get("/oauth/callback", authenticate, metaController.handleOAuthCallback);
router.post("/oauth/exchange-token", authenticate, metaController.exchangeOAuthCode);

module.exports = router;
