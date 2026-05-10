const express = require("express");
const authenticate = require("../middleware/authenticate");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", contactController.listContacts);
router.post("/", contactController.createContact);
router.post("/import", contactController.importContacts);
router.get("/opt-outs", contactController.listOptOuts);
router.get("/segments", contactController.listSegments);
router.post("/segments", contactController.createSegment);

module.exports = router;
