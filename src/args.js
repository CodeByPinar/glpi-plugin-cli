/** Flags that never take a value, so `--yes myplugin` keeps `myplugin` as the positional. */
const BOOLEAN_FLAGS = new Set([
  "yes",
  "y",
  "tr",
  "h",
  "help",
  "v",
  "version",
  "no-git",
  "force",
]);

/**
 * Minimal argv parser: `--flag`, `--flag value`, `--flag=value`, `-y`, positionals.
 * @param {string[]} argv full process.argv
 * @returns {{ positionals: string[], flags: Record<string, string | true> }}
 */
export function parseArgs(argv) {
  const positionals = [];
  const flags = {};
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") {
      positionals.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq !== -1) {
        flags[arg.slice(2, eq)] = arg.slice(eq + 1);
        continue;
      }
      const name = arg.slice(2);
      const next = args[i + 1];
      if (!BOOLEAN_FLAGS.has(name) && next !== undefined && !next.startsWith("-")) {
        flags[name] = next;
        i += 1;
      } else {
        flags[name] = true;
      }
      continue;
    }
    if (arg.startsWith("-") && arg.length > 1) {
      for (const letter of arg.slice(1)) {
        flags[letter] = true;
      }
      continue;
    }
    positionals.push(arg);
  }
  return { positionals, flags };
}

export function hasFlag(flags, ...names) {
  return names.some((name) => flags[name] !== undefined);
}

/** The flag's string value, or undefined when absent or given without a value. */
export function getFlag(flags, name) {
  const value = flags[name];
  return typeof value === "string" ? value : undefined;
}

/** Comma-separated list flag → array (trimmed, empty entries dropped); `none` → []. */
export function getListFlag(flags, name) {
  const value = getFlag(flags, name);
  if (value === undefined) return undefined;
  if (value.trim().toLowerCase() === "none") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
