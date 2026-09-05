const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const contactController = require("../controllers/contact.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", contactController.listContacts);
router.post("/", authorize("owner", "admin"), contactController.createContact);
router.post("/suppress", authorize("owner", "admin"), require("../utils/asyncHandler")(async (req, res) => {
  const contact = await require("../services/contact.service").suppressContact(req.tenantId, req.body, req.user._id);
  res.json({ success: true, contact });
}));
router.post("/import", authorize("owner", "admin"), contactController.importContacts);
router.get("/opt-outs", contactController.listOptOuts);
router.put("/:contactId", authorize("owner", "admin"), contactController.updateContact);
router.put("/:contactId/group", authorize("owner", "admin"), contactController.setContactGroup);
router.get("/segments", contactController.listSegments);
router.post("/segments", authorize("owner", "admin"), contactController.createSegment);
router.get("/segments/:segmentId/members", contactController.getSegmentMembers);
router.post("/segments/:segmentId/members", authorize("owner", "admin"), contactController.assignSegmentMember);
router.delete("/segments/:segmentId/members/:contactId", authorize("owner", "admin"), contactController.removeSegmentMember);
router.delete("/segments/:segmentId", authorize("owner", "admin"), contactController.deleteSegment);

module.exports = router;
