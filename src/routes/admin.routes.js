const router = require("express").Router();
const asyncHandler = require("../utils/asyncHandler");
const admin = require("../services/admin.service");
router.use(require("../middleware/authenticate"), require("../middleware/platformAdmin"));
router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
router.get("/me", (req, res) => res.json({ success: true, user: { id: req.adminActor._id, name: req.adminActor.name, email: req.adminActor.email, platformRole: "admin" } }));
router.get("/overview", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.overview(req.query) })));
router.get("/records/:kind", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.records(req.params.kind, req.query) })));
router.get("/tenants/:id", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.tenantDetails(req.params.id) })));
router.post("/tenants/:id/actions", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.tenantAction(req.adminActor, req.params.id, req.body) })));
router.post("/users/:id/actions", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.userAction(req.adminActor, req.params.id, req.body) })));
router.post("/messages/:id/actions", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.operationAction(req.adminActor, "message", req.params.id, req.body) })));
router.post("/webhooks/:id/actions", asyncHandler(async (req, res) => res.json({ success: true, ...await admin.operationAction(req.adminActor, "webhook", req.params.id, req.body) })));
router.get("/export/:kind", asyncHandler(async (req, res) => {
  const definition = admin.recordDefinition(req.params.kind);
  const cursor = admin.exportCursor(req.params.kind, req.query);
  res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="intercon-${req.params.kind}.csv"` });
  const fields = definition.fields.split(" ");
  const valueAt = (row, field) => field.split(".").reduce((value, key) => value?.[key], row);
  try {
    res.write("\uFEFF" + fields.map(admin.csvCell).join(",") + "\r\n");
    for await (const row of cursor) {
      if (res.destroyed) break;
      if (!res.write(fields.map(field => admin.csvCell(valueAt(row, field))).join(",") + "\r\n")) {
        await new Promise(resolve => {
          const done = () => { res.off("drain", done); res.off("close", done); resolve(); };
          res.once("drain", done); res.once("close", done);
        });
      }
    }
    if (!res.destroyed) res.end();
  } catch (error) {
    if (!res.headersSent) throw error;
    res.destroy(error);
  } finally { await cursor.close(); }
}));
module.exports = router;
