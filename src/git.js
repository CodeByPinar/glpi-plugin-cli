import { spawnSync } from "node:child_process";

function git(args, cwd) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return { ok: result.status === 0, error: result.error, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

export function gitAvailable() {
  const result = git(["--version"]);
  return result.ok && !result.error;
}

/** The author name from git config, when any. */
export function gitUserName() {
  const result = git(["config", "--get", "user.name"]);
  return result.ok ? result.stdout.trim() : "";
}

export function gitUserEmail() {
  const result = git(["config", "--get", "user.email"]);
  return result.ok ? result.stdout.trim() : "";
}

/**
 * `git init` + first commit. Returns a reason when it could not commit (no git, no identity, …).
 * @returns {{ ok: true } | { ok: false, reason: 'missing' | 'identity' | string }}
 */
export function initialCommit(cwd, message) {
  if (!gitAvailable()) return { ok: false, reason: "missing" };
  const init = git(["init", "-q"], cwd);
  if (!init.ok) return { ok: false, reason: init.stderr.trim() || "git init failed" };
  const add = git(["add", "-A"], cwd);
  if (!add.ok) return { ok: false, reason: add.stderr.trim() || "git add failed" };
  const commit = git(["commit", "-q", "-m", message], cwd);
  if (commit.ok) return { ok: true };
  if (/user\.(name|email)|identity|tell me who you are/i.test(commit.stderr)) return { ok: false, reason: "identity" };
  return { ok: false, reason: commit.stderr.trim() || "git commit failed" };
}
