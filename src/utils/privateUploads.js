const fs = require("fs");
const os = require("os");
const path = require("path");
const active = new Set();
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function cleanupStale({ root = os.tmpdir(), now = Date.now() } = {}) {
  const base = await fs.promises.realpath(root);
  const cutoff = now - MAX_AGE_MS;
  let removed = 0;
  for (const entry of await fs.promises.readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || !/^intercon-private-[a-zA-Z0-9]+$/.test(entry.name)) continue;
    const directory = path.resolve(base, entry.name);
    if (path.dirname(directory) !== base || active.has(directory)) continue;
    const stat = await fs.promises.lstat(directory).catch(() => null);
    if (!stat || stat.isSymbolicLink() || stat.mtimeMs > cutoff) continue;
    for (const file of await fs.promises.readdir(directory, { withFileTypes: true })) {
      if (!file.isFile() || file.isSymbolicLink()) continue;
      const target = path.resolve(directory, file.name);
      if (path.dirname(target) !== directory) continue;
      const fileStat = await fs.promises.lstat(target).catch(() => null);
      if (fileStat && !fileStat.isSymbolicLink() && fileStat.mtimeMs <= cutoff) await fs.promises.unlink(target).catch(() => {});
    }
    // Nonrecursive: unknown nested entries and fresh/active files are never removed.
    try { await fs.promises.rmdir(directory); removed++; } catch {}
  }
  return { removed };
}

function startCleanup() {
  const run = () => cleanupStale().catch(() => console.warn("Temporary upload cleanup could not complete"));
  void run();
  const timer = setInterval(run, 60 * 60 * 1000); timer.unref();
  return () => clearInterval(timer);
}

module.exports = { cleanupStale, startCleanup, track: directory => active.add(path.resolve(directory)), release: directory => active.delete(path.resolve(directory)) };
