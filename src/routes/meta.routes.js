const express = require("express");
const metaController = require("../controllers/meta.controller");

const router = express.Router();

router.get("/embedded-signup-url", metaController.getEmbeddedSignupUrl);

module.exports = router;
