const express = require("express");
const authenticateApiKey = require("../middleware/authenticateApiKey");
const publicApiController = require("../controllers/publicApi.controller");

const router = express.Router();

router.use(authenticateApiKey);

router.post("/contacts", publicApiController.createContact);
router.post("/messages/send-template", publicApiController.sendTemplateMessage);
router.get("/messages/:messageId", publicApiController.getMessage);
router.get("/reports", publicApiController.listReports);

module.exports = router;
