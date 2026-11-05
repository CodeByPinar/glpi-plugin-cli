# Contributing

Thanks for helping. Bug reports, GLPI traps you hit, and new parts for the generated plugin are all welcome.

## Reporting a problem

Open an [issue](https://github.com/CodeByPinar/glpi-plugin-cli/issues) with:

- the command you ran (flags included) and the CLI version (`npx create-glpi-plugin --version`),
- the GLPI version the generated plugin was installed on (11.0.x / 12.0.x) and the PHP version,
- what happened and what you expected; for a white page, the line from GLPI's `files/_log/php-errors.log`.

A GLPI rule or trap that is missing from `templates/plugin/docs/glpi-rules.md` is a valuable issue on its own.

## Working on the CLI

```bash
git clone https://github.com/CodeByPinar/glpi-plugin-cli && cd glpi-plugin-cli
npm install
npm run check                                   # node --check + tests (php -l on the output when php is installed)
node bin/create-glpi-plugin.js demo --yes --dir /tmp/demo
```

- The CLI is plain ESM JavaScript, Node 20+, two runtime dependencies. No build step.
- Templates live in `templates/plugin`. Syntax: `{{key}}`, `{{#if menu}} … {{/if}}`, `{{#unless}}`, `{{else}}`;
  a tag alone on its line disappears with the line. A file that belongs to one feature is listed in
  `CONDITIONAL_FILES` in `src/scaffold.js`. `__key__` in a file name becomes the plugin key.
- Generated PHP must run unchanged on GLPI 11 and 12. Before proposing a template change, install the output on
  both (the generated `docker/docker-compose.yml` gives you either with `GLPI_TAG`) and run
  `bash tests/lint.sh <glpi root>` inside it. Never redeclare core properties that GLPI 12 typed (`$rightname`,
  `$dohistory`); never add parameter types to overridden methods.
- Every new prompt or flag needs both languages in `src/i18n.js` and a line in the README option table.
- Tests are `node:test` files under `tests/`. The scaffold suite renders every feature combination; add a case when
  you add a feature or a conditional file.

## Pull requests

- One topic per PR, with a short description of the GLPI behaviour it addresses.
- `npm run check` green. CI also scaffolds a full plugin and builds its archives.
- Add a line to `CHANGELOG.md` under an `Unreleased` heading; the maintainer sets the version at release time.

## Release (maintainer)

1. Bump `version` in `package.json`, turn `Unreleased` into `## [x.y.z] - date` in `CHANGELOG.md`.
2. `git tag vx.y.z && git push --tags`. The release workflow runs the checks, creates the GitHub release with the
   changelog section as notes, and publishes to npm through [trusted publishing](https://docs.npmjs.com/trusted-publishers)
   (this repository and `release.yml` are registered on npmjs.com; no token). A version already on npm is skipped.
