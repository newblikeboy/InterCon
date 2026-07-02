const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const templateController = require("../controllers/template.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", templateController.listTemplates);
router.post("/", authorize("owner", "admin"), templateController.submitTemplateForMetaReview);
router.post("/drafts", authorize("owner", "admin"), templateController.createTemplateDraft);
router.get("/approved", templateController.listApprovedTemplates);
router.delete("/:templateId", authorize("owner", "admin"), templateController.deleteTemplate);

module.exports = router;
