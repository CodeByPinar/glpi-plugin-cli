# {{name}} — notes for coding agents

{{description}} A GLPI plugin ({{glpiLabel}}, PHP {{minPhp}}+), key `{{key}}`, namespace `GlpiPlugin\{{Key}}`.

**Read `docs/glpi-rules.md` before changing any PHP.** It lists the GLPI 11 / 12 rules and the traps that produce
white screens, 403s and silent data loss. Everything below is the short version.

## Layout

- `setup.php` version constant `PLUGIN_{{KEY}}_VERSION`, requirements, hooks. Runs on every request: no DB work.
- `hook.php` install / update / uninstall. **Additive only**: add missing tables, columns, settings, rights; never
  rewrite existing rows. One-time migrations are gated on `$previous` (the version that ran install before).
- `src/` PSR-4 classes `GlpiPlugin\{{Key}}\*`, one class per file, autoloaded by GLPI. No `inc/` folder.
- `front/*.php` pages. Start with `include('../../../inc/includes.php');`, check rights with `Ui::need()`,
  render with `Ui::header()` … `Ui::footer()`.
- `public/` the only folder GLPI serves static files from. `/plugins/{{key}}/css/x.css` maps to `public/css/x.css`.
- `locales/` gettext; text domain is `'{{key}}'`: `__('Text', '{{key}}')`. Keep `locales/en_GB.mo`.
- `tests/lint.sh` syntax + class load check. `tools/package.py` release archives. `tools/i18n.sh` translations.

## Rules that are easy to break

1. Form `action` is `Ui::url('page')`, never `$_SERVER['PHP_SELF']` (GLPI's router sends that POST elsewhere).
2. Never call `Session::checkCSRF()` in a page. Put `Ui::csrf()` in the form; GLPI 11 validates it, GLPI 12 has none.
3. `Html::redirect()` throws. Do not wrap it in a `catch (\Throwable)` that swallows the redirect.
4. Overrides keep GLPI's exact signature: `canView(): bool`, `canCreate(): bool`, `getTabNameForItem(CommonGLPI $item,
   $withtemplate = 0)`, `showForm($ID, array $options = [])`. No added parameter types, no dropped return types.
5. Do not redeclare core properties that GLPI 12 typed and GLPI 11 did not (`public static $rightname`,
   `public $dohistory`): route rights through `Profile::has()` and set `$this->dohistory` in the constructor, as
   `src/Item.php` does. `tests/loadcheck.php` catches the fatal this would cause.
6. Multi-select dropdowns take the selected ids in `'value'` (array), not `'values'`.
7. Checkboxes: a hidden `<input name="x" value="0">` before the box, so an unticked box arrives as `0`.
8. Raising the version deactivates the plugin in GLPI until *Update* is clicked: bump it on every delivery, once.
9. SQL through `$DB->request([...])`, `$DB->insert/update/delete`, `$DB->doQuery()`; never `$DB->query()` (gone in 12).
10. Tables are `glpi_plugin_{{key}}_<plural>`, settings live in `glpi_configs` context `plugin:{{key}}`, rights are
    `plugin_{{key}}`, cron tasks are registered on a `GlpiPlugin\{{Key}}\…` class.

## Commands

```bash
bash tests/lint.sh                      # php -l
bash tests/lint.sh /path/to/glpi        # + class load check (catches signature fatals without a browser)
php bin/console {{consolePrefix}}plugin:install {{key}} -u glpi && php bin/console {{consolePrefix}}plugin:activate {{key}}   # in the GLPI folder
cd docker && docker compose up -d       # throw-away GLPI at http://localhost:8080 (glpi / glpi)
python tools/package.py                 # dist/{{key}}-<version>.{tgz,zip,sha256}
```

## Definition of done

- `bash tests/lint.sh <glpi>` passes on {{glpiLabel}}.
- Every page was opened once in a browser (or rendered through a logged-in CLI harness, see docs/glpi-rules.md).
- New strings use `__('…', '{{key}}')`; new settings have a default in `Config::DEFAULTS`; new tables and columns are
  created in `hook.php` with `tableExists` / `fieldExists` guards.
- `PLUGIN_{{KEY}}_VERSION` raised and `CHANGELOG.md` updated when the change ships.
