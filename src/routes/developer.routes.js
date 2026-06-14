const express = require("express");
const authenticate = require("../middleware/authenticate");
const developerController = require("../controllers/developer.controller");

const router = express.Router();

router.use(authenticate);

router.get("/api-keys", developerController.listApiKeys);
router.post("/api-keys", developerController.createApiKey);
router.delete("/api-keys/:apiKeyId", developerController.revokeApiKey);

module.exports = router;
