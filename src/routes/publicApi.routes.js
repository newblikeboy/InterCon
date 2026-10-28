const express = require("express");
const authenticateApiKey = require("../middleware/authenticateApiKey");
const publicApiController = require("../controllers/publicApi.controller");

const router = express.Router();

router.use(authenticateApiKey);
router.post("/messages/send-media", require("../middleware/privacyAudit")("media-delivery"),
  require("../middleware/concurrencyLimit")({ namespace: "media", max: 2, ttlMs: 10 * 60 * 1000 }),
  require("../middleware/mediaUpload"), require("../controllers/mediaDelivery.controller").sendMedia);

router.post("/contacts", publicApiController.createContact);
router.post("/messages/send-template", publicApiController.sendTemplateMessage);
router.get("/messages/:messageId", publicApiController.getMessage);
router.get("/reports", publicApiController.listReports);

module.exports = router;
