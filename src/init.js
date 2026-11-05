import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";

import { gitUserEmail, gitUserName, initialCommit } from "./git.js";
import { t } from "./i18n.js";
import {
  AGENTS,
  FEATURES,
  GLPI_TARGETS,
  LICENSES,
  SECTORS,
  buildContext,
  isEmptyTarget,
  isValidKey,
  scaffold,
} from "./scaffold.js";

const DEFAULTS = {
  glpi: "both",
  features: ["menu", "config"],
  agents: ["claude", "cursor"],
  sector: "plugins",
  license: "GPL-3.0-or-later",
  git: true,
};

/** Exits quietly when the user presses Ctrl-C in a prompt. */
function answer(value) {
  if (p.isCancel(value)) {
    p.cancel(t("cancelled"));
    process.exit(0);
  }
  return value;
}

function capitalise(key) {
  return key[0].toUpperCase() + key.slice(1);
}

/**
 * @param {{ key?: string, name?: string, description?: string, author?: string, glpi?: string, features?: string[],
 *   agents?: string[], sector?: string, license?: string, repo?: string, icon?: string, dir?: string,
 *   yes?: boolean, git?: boolean, force?: boolean }} options from the command line; prompts fill what is missing
 */
export async function runInit(options) {
  console.log();
  p.intro(pc.bgCyan(pc.black(t("intro"))));

  const yes = options.yes === true;

  let key = options.key;
  if (key !== undefined && !isValidKey(key)) {
    p.log.error(t("key.invalid"));
    process.exit(1);
  }
  if (key === undefined) {
    if (yes) {
      p.log.error(t("key.missing"));
      process.exit(1);
    }
    key = answer(
      await p.text({
        message: t("key.prompt"),
        placeholder: t("key.placeholder"),
        validate: (value) => (isValidKey(String(value ?? "").trim()) ? undefined : t("key.invalid")),
      }),
    ).trim();
  }

  const name =
    options.name ??
    (yes ? capitalise(key) : answer(await p.text({ message: t("name.prompt"), initialValue: capitalise(key) })).trim());

  const description =
    options.description ??
    (yes ? "" : answer(await p.text({ message: t("description.prompt"), placeholder: `${name} plugin for GLPI` })));

  const author =
    options.author ??
    (yes
      ? gitUserName()
      : answer(await p.text({ message: t("author.prompt"), initialValue: gitUserName() })).trim());

  const glpi =
    options.glpi ??
    (yes
      ? DEFAULTS.glpi
      : answer(
          await p.select({
            message: t("glpi.prompt"),
            options: Object.keys(GLPI_TARGETS).map((value) => ({ value, label: t(`glpi.${value}`) })),
            initialValue: DEFAULTS.glpi,
          }),
        ));

  const features =
    options.features ??
    (yes
      ? DEFAULTS.features
      : answer(
          await p.multiselect({
            message: t("features.prompt"),
            options: FEATURES.map((value) => ({ value, label: t(`features.${value}`) })),
            initialValues: DEFAULTS.features,
            required: false,
          }),
        ));

  const needsMenu = features.includes("menu") || features.includes("itemtype");
  const sector =
    options.sector ??
    (yes || !needsMenu
      ? DEFAULTS.sector
      : answer(
          await p.select({
            message: t("sector.prompt"),
            options: SECTORS.map((value) => ({ value, label: t(`sector.${value}`) })),
            initialValue: DEFAULTS.sector,
          }),
        ));

  const agents =
    options.agents ??
    (yes
      ? DEFAULTS.agents
      : answer(
          await p.multiselect({
            message: t("agents.prompt"),
            options: AGENTS.map((value) => ({ value, label: t(`agents.${value}`) })),
            initialValues: DEFAULTS.agents,
            required: false,
          }),
        ));

  const license =
    options.license ??
    (yes
      ? DEFAULTS.license
      : answer(
          await p.select({
            message: t("license.prompt"),
            options: [
              { value: "GPL-3.0-or-later", label: t("license.gpl") },
              { value: "MIT", label: t("license.mit") },
            ],
            initialValue: DEFAULTS.license,
          }),
        ));
  if (!(license in LICENSES)) {
    p.log.error(t("error.invalidOption", { flag: "license", value: license, allowed: Object.keys(LICENSES).join(", ") }));
    process.exit(1);
  }

  const wantGit =
    options.git === false ? false : yes ? DEFAULTS.git : answer(await p.confirm({ message: t("git.prompt"), initialValue: true }));

  const ctx = buildContext({
    key,
    name,
    description,
    author,
    email: gitUserEmail(),
    glpi,
    features,
    agents,
    sector,
    license,
    repo: options.repo,
    icon: options.icon,
  });

  const targetDir = path.resolve(options.dir ?? key);
  if (!options.force && !(await isEmptyTarget(targetDir))) {
    p.log.error(t("dir.exists", { dir: targetDir }));
    process.exit(1);
  }

  const spinner = p.spinner();
  spinner.start(t("spinner.start", { key }));
  const written = await scaffold(targetDir, ctx);
  spinner.stop(t("spinner.done", { count: written.length, dir: targetDir }));

  if (wantGit) {
    const result = initialCommit(targetDir, `chore: scaffold ${key} with create-glpi-plugin`);
    if (result.ok) {
      p.log.success(t("git.done"));
    } else {
      const reason = result.reason === "missing" ? t("git.missing") : result.reason === "identity" ? t("git.identity") : result.reason;
      p.log.warn(t("git.skipped", { reason }));
    }
  }

  const page = ctx.menu ? "index" : ctx.config ? "config" : "item";
  const raw = t("next.steps", { key, prefix: ctx.consolePrefix, page });
  const steps = raw.map((step, index) =>
    step.startsWith("   ") ? pc.dim(step) : `${index + 1 - countIndented(raw, index)}. ${step}`,
  );
  p.note(steps.join("\n"), t("next.title"));
  p.outro(t("outro"));
  return { targetDir, written, ctx };
}

/** Number of continuation lines (indented) before `index`, so numbering skips them. */
function countIndented(steps, index) {
  return steps.slice(0, index).filter((step) => step.startsWith("   ")).length;
}
