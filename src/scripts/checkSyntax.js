const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const roots = ["src", "Public"];
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(fullPath);
  }
}

roots.forEach((root) => walk(path.resolve(process.cwd(), root)));

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
