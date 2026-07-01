const express = require("express");
const authenticate = require("../middleware/authenticate");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", contactController.listContacts);
router.post("/", contactController.createContact);
router.post("/import", contactController.importContacts);
router.get("/opt-outs", contactController.listOptOuts);
router.put("/:contactId/group", contactController.setContactGroup);
router.get("/segments", contactController.listSegments);
router.post("/segments", contactController.createSegment);
router.get("/segments/:segmentId/members", contactController.getSegmentMembers);
router.post("/segments/:segmentId/members", contactController.assignSegmentMember);
router.delete("/segments/:segmentId/members/:contactId", contactController.removeSegmentMember);
router.delete("/segments/:segmentId", contactController.deleteSegment);

module.exports = router;
