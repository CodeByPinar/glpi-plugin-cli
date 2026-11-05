# {{name}}

{{description}}

Runs on {{glpiLabel}}, PHP {{minPhp}} or newer. Scaffolded with [create-glpi-plugin](https://github.com/CodeByPinar/glpi-plugin-cli).

## Install

1. Download the archive from the [releases]({{repo}}/releases) page and extract it into `glpi/plugins/{{key}}`
   (the folder name must be `{{key}}`).
2. Enable it in **Setup → Plugins**, or from the GLPI folder:

   ```bash
   php bin/console {{consolePrefix}}plugin:install {{key}} -u glpi
   php bin/console {{consolePrefix}}plugin:activate {{key}}
   ```
{{#if both}}

   GLPI 12 drops the `glpi:` prefix: `plugin:install {{key}} -u glpi`.
{{/if}}
3. Give the rights in **Administration → Profiles → {{name}}**. Profiles that may change GLPI's setup get every
   right on install; other central profiles can read.

## Try it without a GLPI

```bash
cd docker && docker compose up -d      # GLPI installs itself on first start (about a minute)
docker compose exec -u www-data glpi php /var/www/glpi/bin/console {{consolePrefix}}plugin:install {{key}} -u glpi
docker compose exec -u www-data glpi php /var/www/glpi/bin/console {{consolePrefix}}plugin:activate {{key}}
```

Open <http://localhost:8080> and sign in with `glpi` / `glpi`. The plugin folder is mounted, so edits show at once.

## Layout

| Path | What it is |
| :--- | :--- |
| `setup.php` | version, requirements, hooks and menu registration |
| `hook.php` | install / update / uninstall. Additive only: it adds what is missing and never rewrites existing data |
| `src/Profile.php` | the plugin's rights |
| `src/Ui.php` | page header, URLs, CSRF field, access checks |
{{#if menu}}
| `src/Menu.php`, `front/index.php` | menu entry and overview page |
{{/if}}
{{#if itemtype}}
| `src/Item.php`, `front/item.php`, `front/item.form.php` | example item type: table, search engine list, form, history |
{{/if}}
{{#if config}}
| `src/Config.php`, `front/config.php` | settings in `glpi_configs` (context `plugin:{{key}}`) and their page |
{{/if}}
{{#if cron}}
| `src/Cron.php` | automatic action |
{{/if}}
{{#if tickettab}}
| `src/TicketTab.php` | tab on tickets |
{{/if}}
| `public/` | the only folder GLPI serves static files from (`/plugins/{{key}}/css/x.css` → `public/css/x.css`) |
| `locales/` | translations; `en_GB.mo` is intentionally empty (it keeps `__()` fast) |
| `docs/glpi-rules.md` | GLPI 11 / 12 rules and traps. Read it before changing code; AI tools read it through `AGENTS.md` |
| `tests/` | `lint.sh` (syntax) and `loadcheck.php` (class signatures against a GLPI checkout) |
| `tools/` | `package.py` (release archives), `i18n.sh` (translation files) |

## Development

```bash
bash tests/lint.sh                      # php -l on every file
bash tests/lint.sh /var/www/glpi        # … plus the class load check against that GLPI
bash tools/i18n.sh                      # refresh locales/{{key}}.pot and compile .po → .mo
```

Translating: copy `locales/{{key}}.pot` to `locales/fr_FR.po`, translate, run `tools/i18n.sh`.

## Release

1. Raise `PLUGIN_{{KEY}}_VERSION` in `setup.php` and add a section to `CHANGELOG.md`. GLPI deactivates a plugin
   whose version changed, so every delivery needs a new version and a click on *Update* / *Enable*.
2. Tag it: `git tag v0.2.0 && git push --tags`. The release workflow builds `dist/{{key}}-0.2.0.tgz`, `.zip` and
   `.sha256` and publishes a GitHub release with the changelog section as notes. Locally: `python tools/package.py`.

## License

{{license}} © {{year}} {{author}}
