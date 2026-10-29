const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises"), path = require("node:path"), os = require("node:os");
const uploads = require("../src/utils/privateUploads");

test("stale-upload cleanup removes only old private files and preserves active, fresh and unrelated data", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "intercon-cleanup-test-"));
  const old = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const names = ["intercon-private-stale", "intercon-private-active", "intercon-private-fresh", "unrelated"];
  for (const name of names) {
    const directory = path.join(root, name); await fs.mkdir(directory); await fs.writeFile(path.join(directory, "upload"), "synthetic data");
    if (name !== "intercon-private-fresh") { await fs.utimes(path.join(directory, "upload"), old, old); await fs.utimes(directory, old, old); }
  }
  uploads.track(path.join(root, names[1]));
  t.after(async () => {
    uploads.release(path.join(root, names[1]));
    for (const name of names) { await fs.unlink(path.join(root, name, "upload")).catch(() => {}); await fs.rmdir(path.join(root, name)).catch(() => {}); }
    await fs.rmdir(root);
  });
  assert.equal((await uploads.cleanupStale({ root })).removed, 1);
  await assert.rejects(fs.stat(path.join(root, names[0])), { code: "ENOENT" });
  for (const name of names.slice(1)) assert.equal(await fs.readFile(path.join(root, name, "upload"), "utf8"), "synthetic data");
});
