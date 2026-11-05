import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildEmptyMo } from "./mo.js";
import { renderString } from "./render.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const TEMPLATE_DIR = path.join(ROOT, "templates", "plugin");
export const LICENSE_DIR = path.join(ROOT, "templates", "licenses");

/** Order matters: it is the order of the prompt and of the generated overview page. */
export const FEATURES = ["menu", "config", "itemtype", "cron", "tickettab"];
export const AGENTS = ["claude", "cursor"];
export const SECTORS = ["plugins", "tools", "admin", "management", "assets", "helpdesk", "config"];
export const GLPI_TARGETS = {
  both: { min: "11.0.0", max: "12.99.99", php: "8.2", label: "GLPI 11 and 12", dockerTag: "11.0" },
  11: { min: "11.0.0", max: "11.99.99", php: "8.2", label: "GLPI 11", dockerTag: "11.0" },
  12: { min: "12.0.0", max: "12.99.99", php: "8.3", label: "GLPI 12", dockerTag: "12.0" },
};
export const LICENSES = {
  "GPL-3.0-or-later": { short: "GPLv3+", file: "GPL-3.0.txt", url: "https://www.gnu.org/licenses/gpl-3.0.html" },
  MIT: { short: "MIT", file: "MIT.txt", url: "https://opensource.org/licenses/MIT" },
};

/** Template files written only when the named feature / agent is selected (paths as in templates/plugin). */
export const CONDITIONAL_FILES = {
  "src/Menu.php": "menu",
  "front/index.php": "menu",
  "public/css/__key__.css": "menu",
  "src/Config.php": "config",
  "front/config.php": "config",
  "src/Item.php": "itemtype",
  "front/item.php": "itemtype",
  "front/item.form.php": "itemtype",
  "src/Cron.php": "cron",
  "src/TicketTab.php": "tickettab",
  "CLAUDE.md": "claude",
  ".claude/skills/glpi-plugin/SKILL.md": "claude",
  ".cursor/rules/glpi-plugin.mdc": "cursor",
};

const RESERVED_KEYS = new Set(["glpi", "plugin", "plugins", "core", "test", "tests", "src", "front", "ajax"]);

/** GLPI plugin key: the folder name, the PSR-4 namespace (ucfirst) and the table prefix. */
export function isValidKey(key) {
  return typeof key === "string" && /^[a-z][a-z0-9]{1,29}$/.test(key) && !RESERVED_KEYS.has(key);
}

export function phpString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function xmlString(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * @param {{ key: string, name: string, description?: string, author: string, email?: string, glpi: 'both'|'11'|'12',
 *   features: string[], agents: string[], sector?: string, license: string, repo?: string, icon?: string }} options
 */
export function buildContext(options) {
  const { key } = options;
  if (!isValidKey(key)) throw new Error(`invalid plugin key: ${key}`);
  if (!(options.glpi in GLPI_TARGETS)) throw new Error(`unknown GLPI target: ${options.glpi}`);
  if (!(options.license in LICENSES)) throw new Error(`unknown license: ${options.license}`);

  const Key = key[0].toUpperCase() + key.slice(1);
  const glpi = GLPI_TARGETS[options.glpi];
  const license = LICENSES[options.license];
  const features = new Set(options.features ?? []);
  for (const feature of features) {
    if (!FEATURES.includes(feature)) throw new Error(`unknown feature: ${feature}`);
  }
  if (features.has("itemtype")) features.add("menu"); // the item pages need a menu entry to be reachable
  const agents = new Set(options.agents ?? []);
  for (const agent of agents) {
    if (!AGENTS.includes(agent)) throw new Error(`unknown agent: ${agent}`);
  }
  const sector = options.sector ?? "plugins";
  if (!SECTORS.includes(sector)) throw new Error(`unknown menu sector: ${sector}`);

  const name = String(options.name ?? Key).trim() || Key;
  const description = String(options.description ?? "").trim() || `${name} plugin for GLPI`;
  const author = String(options.author ?? "").trim() || "Your Name";
  const now = new Date();
  const glpi11 = options.glpi !== "12";
  const glpi12 = options.glpi !== "11";

  return {
    key,
    Key,
    KEY: key.toUpperCase(),
    name,
    php_name: phpString(name),
    xml_name: xmlString(name),
    description,
    php_description: phpString(description),
    xml_description: xmlString(description),
    author,
    php_author: phpString(author),
    xml_author: xmlString(author),
    email: String(options.email ?? "").trim(),
    year: String(now.getFullYear()),
    date: now.toISOString().slice(0, 10),
    license: options.license,
    licenseShort: license.short,
    licenseUrl: license.url,
    minGlpi: glpi.min,
    maxGlpi: glpi.max,
    minPhp: glpi.php,
    glpiLabel: glpi.label,
    dockerTag: glpi.dockerTag,
    glpi11,
    glpi12,
    both: glpi11 && glpi12,
    // console commands differ: GLPI 11 prefixes plugin commands with `glpi:`
    consolePrefix: glpi11 ? "glpi:" : "",
    sector,
    icon: String(options.icon ?? "").trim() || "ti ti-puzzle",
    repo: String(options.repo ?? "").trim() || `https://github.com/your-account/glpi-${key}`,
    ...Object.fromEntries(FEATURES.map((feature) => [feature, features.has(feature)])),
    ...Object.fromEntries(AGENTS.map((agent) => [agent, agents.has(agent)])),
    anyAgent: agents.size > 0,
    featureList: FEATURES.filter((feature) => features.has(feature)).join(", ") || "none",
  };
}

/** Template files, as `/`-separated paths relative to templates/plugin. */
export async function listTemplateFiles(dir = TEMPLATE_DIR, base = TEMPLATE_DIR) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTemplateFiles(full, base)));
    } else {
      files.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

/** Output path of a template file: `__key__` → the key, `_gitignore` → `.gitignore` (npm drops dotfiles). */
export function outputPath(templatePath, ctx) {
  return templatePath.replace(/__key__/g, ctx.key).replace(/(^|\/)_gitignore$/, "$1.gitignore");
}

/** Which template files the context selects, with their output paths. */
export async function planFiles(ctx) {
  const files = await listTemplateFiles();
  return files
    .filter((file) => {
      const condition = CONDITIONAL_FILES[file];
      return !condition || Boolean(ctx[condition]);
    })
    .map((file) => ({ template: file, output: outputPath(file, ctx) }));
}

/**
 * Writes the plugin into targetDir (created when missing).
 * @returns {Promise<string[]>} the written paths, relative to targetDir
 */
export async function scaffold(targetDir, ctx) {
  const written = [];
  for (const { template, output } of await planFiles(ctx)) {
    const source = await fs.readFile(path.join(TEMPLATE_DIR, template), "utf8");
    const body = renderString(source, ctx, template);
    const destination = path.join(targetDir, ...output.split("/"));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, body);
    written.push(output);
  }

  const license = LICENSES[ctx.license];
  const licenseText = await fs.readFile(path.join(LICENSE_DIR, license.file), "utf8");
  await fs.writeFile(path.join(targetDir, "LICENSE"), renderString(licenseText, ctx, license.file));
  written.push("LICENSE");

  await fs.mkdir(path.join(targetDir, "locales"), { recursive: true });
  await fs.writeFile(path.join(targetDir, "locales", "en_GB.mo"), buildEmptyMo());
  written.push("locales/en_GB.mo");

  return written.sort();
}

/** True when the folder does not exist or holds nothing but a `.git` folder. */
export async function isEmptyTarget(targetDir) {
  try {
    const entries = await fs.readdir(targetDir);
    return entries.every((entry) => entry === ".git");
  } catch (error) {
    if (error.code === "ENOENT") return true;
    throw error;
  }
}
