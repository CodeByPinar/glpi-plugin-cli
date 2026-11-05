# {{name}}

@AGENTS.md

Before editing PHP, read `docs/glpi-rules.md`. The `glpi-plugin` skill in `.claude/skills/` has the step-by-step
recipes for this code base: a new page, a new right, a new column, a cron task, a tab, a release.

Verify with `bash tests/lint.sh <glpi root>` when a GLPI checkout is available; otherwise `bash tests/lint.sh`.
A web page is only done when it was rendered once, in a browser or through a logged-in CLI harness.
