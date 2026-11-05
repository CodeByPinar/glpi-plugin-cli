// `node --check` on every JavaScript file of the CLI (bin, src, tests, scripts). No linter dependency needed.
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [];
for (const dir of ["bin", "src", "tests", "scripts"]) {
  const full = path.join(root, dir);
  for (const name of readdirSync(full)) {
    const file = path.join(full, name);
    if (statSync(file).isFile() && name.endsWith(".js")) files.push(file);
  }
}

let bad = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    bad += 1;
    console.error(result.stderr || result.stdout);
  }
}
console.log(`${files.length} files checked, ${bad} with errors`);
process.exit(bad === 0 ? 0 : 1);
