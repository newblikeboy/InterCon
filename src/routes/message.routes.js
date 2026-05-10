const express = require("express");
const authenticate = require("../middleware/authenticate");
const messageController = require("../controllers/message.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", messageController.listMessages);
router.post("/send-template", messageController.sendTemplateMessage);

module.exports = router;
