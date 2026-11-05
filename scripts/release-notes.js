// Prints the CHANGELOG.md section of one version (default: package.json's) as GitHub release notes.
//   node scripts/release-notes.js 0.1.0 > release-notes.md
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2] ?? JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version;
const changelog = readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const match = new RegExp(`^## \\[${escaped}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|(?![\\s\\S]))`, "m").exec(changelog);
const body = match ? match[1].trim() : `Release ${version}.`;

process.stdout.write(`${body}

### Install

\`\`\`bash
npx create-glpi-plugin@${version}
\`\`\`

Full changelog: [CHANGELOG.md](https://github.com/CodeByPinar/glpi-plugin-cli/blob/main/CHANGELOG.md) · npm: [create-glpi-plugin](https://www.npmjs.com/package/create-glpi-plugin/v/${version})
`);
