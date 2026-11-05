import { createRequire } from "node:module";

import { getFlag, getListFlag, hasFlag, parseArgs } from "./args.js";
import { detectLocale, setLocale, t } from "./i18n.js";
import { runInit } from "./init.js";
import { AGENTS, FEATURES, GLPI_TARGETS, SECTORS } from "./scaffold.js";

const require = createRequire(import.meta.url);

export function getCliVersion() {
  return require("../package.json").version;
}

function invalid(flag, value, allowed) {
  console.error(t("error.invalidOption", { flag, value, allowed: allowed.join(", ") }));
  process.exit(1);
}

/** One of `allowed`, or undefined when the flag is absent. Exits on anything else. */
function choice(flags, flag, allowed) {
  const value = getFlag(flags, flag);
  if (value === undefined) return undefined;
  if (!allowed.includes(value)) invalid(flag, value, allowed);
  return value;
}

function list(flags, flag, allowed) {
  const values = getListFlag(flags, flag);
  if (values === undefined) return undefined;
  for (const value of values) {
    if (!allowed.includes(value)) invalid(flag, value, [...allowed, "none"]);
  }
  return values;
}

export async function main(argv = process.argv) {
  const { positionals, flags } = parseArgs(argv);
  setLocale(hasFlag(flags, "tr") ? "tr" : detectLocale());

  if (hasFlag(flags, "v", "version")) {
    console.log(getCliVersion());
    return;
  }
  if (hasFlag(flags, "h", "help")) {
    console.log(t("help"));
    return;
  }

  await runInit({
    key: positionals[0] ?? getFlag(flags, "key"),
    name: getFlag(flags, "display") ?? getFlag(flags, "name"),
    description: getFlag(flags, "description"),
    author: getFlag(flags, "author"),
    glpi: choice(flags, "glpi", Object.keys(GLPI_TARGETS)),
    features: list(flags, "features", FEATURES),
    agents: list(flags, "agent", AGENTS),
    sector: choice(flags, "sector", SECTORS),
    license: getFlag(flags, "license"),
    repo: getFlag(flags, "repo"),
    icon: getFlag(flags, "icon"),
    dir: getFlag(flags, "dir"),
    yes: hasFlag(flags, "yes", "y"),
    git: !hasFlag(flags, "no-git"),
    force: hasFlag(flags, "force"),
  });
}
