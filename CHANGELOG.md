# Changelog

## [0.1.0] - 2026-11-05

First release.

- `npx create-glpi-plugin [key]`: interactive prompts (English, Turkish with `--tr` or a `tr` locale) or flags with
  `--yes`.
- Targets: GLPI 11, GLPI 12, or both from one code base (CSRF, `$rightname`, access exceptions, console prefix
  handled).
- Parts: menu entry with overview page, settings page, item type (table, search engine list, form, history),
  automatic action, tab on tickets. Rights, `Ui` helpers, `public/` assets, `locales/` with an empty `en_GB.mo`
  always included.
- Additive `hook.php` with `schema_version`-gated migrations.
- AI rules: `AGENTS.md`, `docs/glpi-rules.md` (GLPI 11 / 12 field notes), `CLAUDE.md` + `glpi-plugin` skill for
  Claude Code, `.cursor/rules` for Cursor.
- Tooling in the generated plugin: `tests/lint.sh`, `tests/loadcheck.php`, `tools/package.py`, `tools/i18n.sh`,
  Docker compose, CI workflow (lint + real install on the official GLPI images), release workflow.
- First git commit after scaffolding.
