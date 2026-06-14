const express = require("express");
const authenticate = require("../middleware/authenticate");
const templateController = require("../controllers/template.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", templateController.listTemplates);
router.post("/", templateController.submitTemplateForMetaReview);
router.post("/drafts", templateController.createTemplateDraft);
router.get("/approved", templateController.listApprovedTemplates);

module.exports = router;
