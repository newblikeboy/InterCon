const router = require("express").Router();
const wrap = require("../utils/asyncHandler");
const service = require("../services/privacy.service");
router.use(require("../middleware/authenticate"), require("../middleware/privacyAudit")("privacy"));
router.get("/terms", wrap(async (req, res) => {
  const tenant = await require("../models/Tenant").findById(req.tenantId).select("processingTerms").lean();
  res.json({ version: "2026-10-29", acceptance: tenant?.processingTerms });
}));
router.post("/terms", require("../middleware/authorize")("owner"), wrap(async (req, res) => {
  if (req.body.accepted !== true) throw new (require("../utils/httpError"))(400, "Confirm that you are authorised to accept the Data Processing Terms");
  const acceptance = { version: "2026-10-29", acceptedAt: new Date(), acceptedBy: req.user._id };
  await require("../models/Tenant").updateOne({ _id: req.tenantId }, { $set: { processingTerms: acceptance } });
  await require("../models/SecurityAudit").create({ tenantId: req.tenantId, actorId: req.user._id, action: "privacy.terms.accepted" });
  res.json({ acceptance });
}));
router.get("/requests", wrap(async (req, res) => res.json({ requests: await service.listRequests(req.user, req.query) })));
router.post("/requests", wrap(async (req, res) => res.status(201).json({ request: await service.createRequest(req.user, req.body) })));
router.patch("/requests/:id", wrap(async (req, res) => res.json({ request: await service.reviewRequest(req.user, req.params.id, req.body) })));
router.post("/requests/:id/erase", wrap(async (req, res) => res.json(await service.eraseContact(req.user, req.params.id, req.body))));
router.get("/contacts/:id/export", wrap(async (req, res) => {
  if (req.query.format === "ndjson") return service.streamContactExport(req.user, req.params.id, res);
  res.json(await service.contactExport(req.user, req.params.id));
}));
router.post("/suppressions/restore", wrap(async (req, res) => res.json(await service.restoreSuppression(req.user, req.body))));
module.exports = router;
