const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const metaController = require("../controllers/meta.controller");

const router = express.Router();

router.use(authenticate);
router.use(authorize("owner", "admin"));
router.get("/embedded-signup-url", metaController.getEmbeddedSignupUrl);
router.get("/facebook-sdk-config", metaController.getFacebookSdkConfig);
router.get("/onboarding", metaController.getOnboardingStatus);
router.post("/onboarding-session", metaController.createOnboardingSession);
router.delete("/onboarding", authorize("owner"), metaController.deleteConnectedWaba);
router.get("/diagnostics", metaController.getMetaDiagnostics);
router.post("/embedded-signup/complete", metaController.completeEmbeddedSignup);
router.get("/phone/status", metaController.getPhoneNumberStatus);
router.post("/phone/request-code", metaController.requestPhoneVerificationCode);
router.post("/phone/verify-code", metaController.verifyPhoneCode);
router.post("/phone/register", metaController.registerPhoneNumber);
router.post("/phone/deregister", authorize("owner"), metaController.deregisterPhoneNumber);

module.exports = router;
