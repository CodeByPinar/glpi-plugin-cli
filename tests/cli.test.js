import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const BIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "create-glpi-plugin.js");

function run(args, options = {}) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8", env: { ...process.env, LANG: "C", LC_ALL: "C" }, ...options });
}

test("--version and --help", () => {
  const version = run(["--version"]);
  assert.equal(version.status, 0);
  assert.match(version.stdout.trim(), /^\d+\.\d+\.\d+/);

  const help = run(["--help"]);
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--features <list>/);

  const tr = run(["--help", "--tr"]);
  assert.match(tr.stdout, /Kullanım/);
});

test("--yes without a key fails with a hint", () => {
  const result = run(["--yes"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /create-glpi-plugin <key> --yes/);
});

test("invalid option values are rejected before anything is written", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cgp-cli-"));
  for (const args of [["demo", "--glpi", "10"], ["demo", "--features", "menu,wat"], ["demo", "--agent", "copilot"], ["demo", "--sector", "nowhere"], ["Demo"]]) {
    const result = run([...args, "--yes", "--no-git", "--dir", path.join(dir, "out")]);
    assert.notEqual(result.status, 0, args.join(" "));
  }
  assert.deepEqual(await fs.readdir(dir), []);
  await fs.rm(dir, { recursive: true, force: true });
});

test("non-interactive scaffold, then refuses a non-empty folder unless --force", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cgp-cli-"));
  const out = path.join(dir, "demo");
  const first = run(["demo", "--display", "Demo Plugin", "--features", "menu,config,itemtype", "--glpi", "both", "--agent", "none", "--yes", "--no-git", "--dir", out]);
  assert.equal(first.status, 0, first.stdout + first.stderr);
  assert.match(first.stdout, /files written/);
  assert.match(first.stdout, /glpi:plugin:install demo/);
  const setup = await fs.readFile(path.join(out, "setup.php"), "utf8");
  assert.match(setup, /'name'\s+=> 'Demo Plugin'/);
  assert.ok(!(await fs.stat(path.join(out, "CLAUDE.md")).catch(() => null)), "no CLAUDE.md with --agent none");

  const second = run(["demo", "--yes", "--no-git", "--dir", out]);
  assert.notEqual(second.status, 0);
  assert.match(second.stdout + second.stderr, /not empty/);

  const forced = run(["demo", "--yes", "--no-git", "--force", "--dir", out]);
  assert.equal(forced.status, 0, forced.stdout + forced.stderr);
  await fs.rm(dir, { recursive: true, force: true });
});

test("git init + first commit when git is available", async () => {
  const hasGit = spawnSync("git", ["--version"]).status === 0;
  if (!hasGit) return;
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cgp-cli-"));
  const out = path.join(dir, "demo");
  const env = {
    ...process.env,
    LANG: "C",
    GIT_AUTHOR_NAME: "Test",
    GIT_AUTHOR_EMAIL: "test@example.com",
    GIT_COMMITTER_NAME: "Test",
    GIT_COMMITTER_EMAIL: "test@example.com",
  };
  const result = run(["demo", "--yes", "--dir", out], { env });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const log = spawnSync("git", ["-C", out, "log", "--oneline"], { encoding: "utf8" });
  assert.match(log.stdout, /scaffold demo with create-glpi-plugin/);
  const status = spawnSync("git", ["-C", out, "status", "--porcelain"], { encoding: "utf8" });
  assert.equal(status.stdout.trim(), "", "working tree is clean after the first commit");
  await fs.rm(dir, { recursive: true, force: true });
});
