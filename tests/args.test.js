import assert from "node:assert/strict";
import { test } from "node:test";

import { getFlag, getListFlag, hasFlag, parseArgs } from "../src/args.js";

const argv = (...args) => ["node", "cli", ...args];

test("positionals, --flag value, --flag=value, short flags", () => {
  const { positionals, flags } = parseArgs(argv("demo", "--glpi", "12", "--features=menu,cron", "-y", "--tr"));
  assert.deepEqual(positionals, ["demo"]);
  assert.equal(getFlag(flags, "glpi"), "12");
  assert.deepEqual(getListFlag(flags, "features"), ["menu", "cron"]);
  assert.ok(hasFlag(flags, "yes", "y"));
  assert.ok(hasFlag(flags, "tr"));
});

test("boolean flags do not swallow the next positional", () => {
  const { positionals, flags } = parseArgs(argv("--yes", "demo", "--no-git", "--force"));
  assert.deepEqual(positionals, ["demo"]);
  assert.equal(flags.yes, true);
  assert.equal(flags["no-git"], true);
  assert.equal(flags.force, true);
});

test("list flag: none → empty list, spaces trimmed, undefined when absent", () => {
  assert.deepEqual(getListFlag(parseArgs(argv("--agent", "none")).flags, "agent"), []);
  assert.deepEqual(getListFlag(parseArgs(argv("--agent", "claude, cursor")).flags, "agent"), ["claude", "cursor"]);
  assert.equal(getListFlag(parseArgs(argv()).flags, "agent"), undefined);
});

test("-- ends option parsing", () => {
  const { positionals } = parseArgs(argv("--", "--not-a-flag"));
  assert.deepEqual(positionals, ["--not-a-flag"]);
});
