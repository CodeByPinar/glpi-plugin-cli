import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildContext, isEmptyTarget, isValidKey, phpString, planFiles, scaffold } from "../src/scaffold.js";

const PHP = spawnSync("php", ["-v"], { encoding: "utf8" }).status === 0;

async function tmp() {
  return fs.mkdtemp(path.join(os.tmpdir(), "cgp-test-"));
}

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return out.sort();
}

/** Every text file: no template syntax left (GitHub's `${{ … }}` is allowed in workflows). */
async function assertNoLeftovers(dir) {
  for (const file of await walk(dir)) {
    if (file.endsWith(".mo")) continue;
    const text = await fs.readFile(path.join(dir, file), "utf8");
    const stripped = file.startsWith(".github/") ? text.replace(/\$\{\{[^}]*\}\}/g, "") : text;
    assert.ok(!stripped.includes("{{"), `${file} still contains {{`);
    assert.ok(!/\{\{[#/]|\{\{else\}\}/.test(text), `${file} still contains a block tag`);
  }
}

function phpLint(dir, files) {
  if (!PHP) return;
  for (const file of files.filter((name) => name.endsWith(".php"))) {
    const result = spawnSync("php", ["-l", path.join(dir, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `php -l ${file}: ${result.stdout}${result.stderr}`);
  }
}

test("key validation", () => {
  assert.ok(isValidKey("myplugin"));
  assert.ok(isValidKey("a1"));
  assert.ok(!isValidKey("MyPlugin"));
  assert.ok(!isValidKey("my-plugin"));
  assert.ok(!isValidKey("my_plugin"));
  assert.ok(!isValidKey("1abc"));
  assert.ok(!isValidKey("a"));
  assert.ok(!isValidKey("glpi"));
  assert.ok(!isValidKey("x".repeat(31)));
});

test("php strings are escaped", () => {
  assert.equal(phpString("O'Neil \\ Co"), "O\\'Neil \\\\ Co");
});

test("context: derived names, itemtype forces menu, GLPI targets", () => {
  const ctx = buildContext({ key: "demo", name: "Demo!", author: "A", glpi: "both", features: ["itemtype"], agents: [], license: "MIT" });
  assert.equal(ctx.Key, "Demo");
  assert.equal(ctx.KEY, "DEMO");
  assert.equal(ctx.menu, true);
  assert.equal(ctx.itemtype, true);
  assert.equal(ctx.config, false);
  assert.equal(ctx.both, true);
  assert.equal(ctx.consolePrefix, "glpi:");
  assert.equal(ctx.minPhp, "8.2");
  assert.equal(ctx.licenseShort, "MIT");
  assert.equal(ctx.featureList, "menu, itemtype");

  const v12 = buildContext({ key: "demo", glpi: "12", features: [], agents: ["cursor"], license: "GPL-3.0-or-later" });
  assert.equal(v12.glpi11, false);
  assert.equal(v12.consolePrefix, "");
  assert.equal(v12.minPhp, "8.3");
  assert.equal(v12.name, "Demo");
  assert.equal(v12.cursor, true);
  assert.equal(v12.claude, false);

  assert.throws(() => buildContext({ key: "Bad", glpi: "both", features: [], agents: [], license: "MIT" }), /invalid plugin key/);
  assert.throws(() => buildContext({ key: "ok", glpi: "9", features: [], agents: [], license: "MIT" }), /unknown GLPI target/);
  assert.throws(() => buildContext({ key: "ok", glpi: "11", features: ["x"], agents: [], license: "MIT" }), /unknown feature/);
});

test("planFiles follows the feature and agent selection", async () => {
  const none = (await planFiles(buildContext({ key: "demo", glpi: "11", features: [], agents: [], license: "MIT" }))).map((f) => f.output);
  assert.ok(none.includes("setup.php"));
  assert.ok(none.includes("src/Profile.php"));
  assert.ok(none.includes("AGENTS.md"));
  assert.ok(none.includes("docs/glpi-rules.md"));
  assert.ok(none.includes(".gitignore"));
  assert.ok(none.includes("locales/demo.pot"));
  assert.ok(!none.includes("src/Menu.php"));
  assert.ok(!none.includes("CLAUDE.md"));
  assert.ok(!none.includes(".cursor/rules/glpi-plugin.mdc"));

  const all = (await planFiles(buildContext({ key: "demo", glpi: "both", features: ["menu", "config", "itemtype", "cron", "tickettab"], agents: ["claude", "cursor"], license: "MIT" }))).map((f) => f.output);
  for (const file of ["src/Menu.php", "front/index.php", "public/css/demo.css", "src/Config.php", "front/config.php", "src/Item.php", "front/item.php", "front/item.form.php", "src/Cron.php", "src/TicketTab.php", "CLAUDE.md", ".claude/skills/glpi-plugin/SKILL.md", ".cursor/rules/glpi-plugin.mdc"]) {
    assert.ok(all.includes(file), `${file} expected`);
  }
});

test("scaffold writes a complete plugin for every feature combination", async () => {
  const combos = [
    { glpi: "both", features: ["menu", "config", "itemtype", "cron", "tickettab"], agents: ["claude", "cursor"], license: "GPL-3.0-or-later" },
    { glpi: "12", features: [], agents: [], license: "MIT" },
    { glpi: "11", features: ["config"], agents: ["cursor"], license: "GPL-3.0-or-later" },
    { glpi: "both", features: ["cron", "tickettab"], agents: ["claude"], license: "MIT" },
    { glpi: "11", features: ["itemtype"], agents: [], license: "MIT" },
  ];
  for (const combo of combos) {
    const dir = await tmp();
    const ctx = buildContext({ key: "demo", name: "Demo's \"Plugin\"", author: "Ada O'Hara", ...combo });
    const written = await scaffold(dir, ctx);
    const onDisk = await walk(dir);
    assert.deepEqual(onDisk, written, `written list matches disk for ${JSON.stringify(combo)}`);
    assert.ok(written.includes("LICENSE"));
    assert.ok(written.includes("locales/en_GB.mo"));
    await assertNoLeftovers(dir);
    phpLint(dir, written);

    const setup = await fs.readFile(path.join(dir, "setup.php"), "utf8");
    assert.match(setup, /define\('PLUGIN_DEMO_VERSION', '0\.1\.0'\)/);
    assert.match(setup, /'name'\s+=> 'Demo\\'s "Plugin"'/);
    assert.match(setup, /'author'\s+=> 'Ada O\\'Hara'/);
    const license = await fs.readFile(path.join(dir, "LICENSE"), "utf8");
    assert.match(license, combo.license === "MIT" ? /MIT License[\s\S]*Ada O'Hara/ : /GNU GENERAL PUBLIC LICENSE/);
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test("isEmptyTarget: missing, empty, .git-only, non-empty", async () => {
  const dir = await tmp();
  assert.equal(await isEmptyTarget(path.join(dir, "missing")), true);
  assert.equal(await isEmptyTarget(dir), true);
  await fs.mkdir(path.join(dir, ".git"));
  assert.equal(await isEmptyTarget(dir), true);
  await fs.writeFile(path.join(dir, "x.txt"), "");
  assert.equal(await isEmptyTarget(dir), false);
  await fs.rm(dir, { recursive: true, force: true });
});
