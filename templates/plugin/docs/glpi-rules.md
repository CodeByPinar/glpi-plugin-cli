# GLPI 11 / 12 plugin rules

Field notes from shipping plugins on GLPI 11.0.x and 12.0.x. Each rule names the symptom, because most of these
fail silently or only in production. `{{key}}` is this plugin's key; the rules apply to any plugin.

## 1. Structure and naming

| Thing | Convention | Why |
| :--- | :--- | :--- |
| Folder and key | `plugins/{{key}}`, lowercase letters and digits | the key is used in hooks, URLs and table names |
| Classes | `GlpiPlugin\{{Key}}\Name` in `src/Name.php` | GLPI autoloads exactly this PSR-4 mapping; no `inc/`, no `PluginKeyName` classes |
| Tables | `glpi_plugin_{{key}}_<plural>` | GLPI derives the table from the class name (`…\Item` → `glpi_plugin_{{key}}_items`) and back |
| Rights | one right `plugin_{{key}}` with bits (`READ`, `UPDATE`, `CREATE`, `DELETE`, `PURGE`, own bits ≥ 1024) | one row per profile in `glpi_profilerights` |
| Settings | `glpi_configs`, context `plugin:{{key}}` via `Config::getConfigurationValues()` / `setConfigurationValues()` | no own table, survives updates, strings only |
| Cron | `CronTask::register(Cron::class, 'name', …)` and `cronName(CronTask $task)` on a `CommonGLPI` subclass | `CronTask::unregister('{{key}}')` finds tasks by the namespace |
| Static files | under `public/`; referenced as `/plugins/{{key}}/css/x.css` (no `public/` segment) | GLPI serves nothing else; a file at the plugin root is a 404 and the page renders without it |
| Translations | `__('Text', '{{key}}')`, `_n('One', 'Many', $n, '{{key}}')`; files `locales/<lang>.mo` | GLPI's own strings are one-argument `__('Name')` |
| Version | `PLUGIN_{{KEY}}_VERSION` in `setup.php`, SemVer, `CHANGELOG.md` | GLPI compares it with `glpi_plugins.version` on every page |

## 2. GLPI 11 versus GLPI 12 (one code base)

| Topic | GLPI 11 | GLPI 12 | Portable code |
| :--- | :--- | :--- | :--- |
| CSRF | `_glpi_csrf_token` in every POST form; `Hooks::CSRF_COMPLIANT` | tokens and the constant removed | `Ui::csrf()` (checks `method_exists(Session::class, 'getNewCSRFToken')`); guard the hook with `defined()` |
| `CommonGLPI::$rightname` | `public static $rightname` | `public static string $rightname` | do not redeclare it; override `canView()`… and use `Profile::has()` |
| `CommonDBTM::$dohistory` | `public $dohistory` | `public bool $dohistory` | do not redeclare it; set `$this->dohistory = true` in the constructor (same for any other core property that gained a type) |
| Access denied | `Html::displayRightError()` (deprecated) | removed | `throw new \Glpi\Exception\Http\AccessDeniedHttpException()` |
| Raw SQL | `$DB->query()` deprecated, `doQuery()` | `query()`, `queryOrDie()`, `insertOrDie()` removed | `$DB->doQuery()`; prefer `$DB->request([...])`, `insert()`, `update()`, `delete()` |
| `countElementsInTable()` | loose | strict types (`string $table, array $condition`) | pass a string and an array |
| `Html::entities_deep()` | present | removed | `htmlescape()` or your own `Ui::e()` |
| `$DB->buildInsert()` | returns SQL string | returns a query object | do not concatenate it (`INSERT IGNORE` / `ON DUPLICATE KEY` need their own query) |
| Guzzle, league/csv, `Toolbox::sendFile()` | bundled | removed | bring your own or use `fopen`, `BinaryFileResponse` |
| Console | `php bin/console glpi:plugin:install key -u glpi` | `plugin:install key -u glpi` (no `glpi:` prefix) | document both |
| PHP | ≥ 8.2 | ≥ 8.3 | `match`, readonly, enums are fine on both |
| Kernel boot in a CLI harness | `(new \Glpi\Kernel\Kernel('production'))->boot()` | same, but needs `global $kernel` and no `$_SERVER['REQUEST_URI']` during boot | unset it before boot, restore after |

Method signatures of `CommonGLPI` / `CommonDBTM` that plugins override are identical in 11.0.8 and 12.0.0:
`getTypeName($nb = 0)`, `getIcon()`, `getMenuName()`, `getMenuContent()`, `canView(): bool`, `canCreate(): bool`,
`canUpdate(): bool`, `canDelete(): bool`, `canPurge(): bool`, `getTabNameForItem(CommonGLPI $item, $withtemplate = 0)`,
`static displayTabContentForItem(CommonGLPI $item, $tabnum = 1, $withtemplate = 0)`, `rawSearchOptions()`,
`showForm($ID, array $options = [])`, `prepareInputForAdd($input)`, `prepareInputForUpdate($input)`, `post_addItem()`,
`cleanDBonPurge()`, `getForbiddenStandardMassiveAction()`. A missing `: bool` on the `can*()` overrides is a fatal
`Declaration … must be compatible` error, and it fires only when the class is loaded, which for a `Menu` class means
when GLPI draws the menu, never on the console. `tests/loadcheck.php` loads every class to catch it.

## 3. Front pages

- **Form action**: `Ui::url('page')`, which is `$CFG_GLPI['root_doc'] . '/plugins/{{key}}/front/page.php'`. Never
  `$_SERVER['PHP_SELF']`: GLPI 11's router resolves it to `/index.php`, the POST lands on the inventory agent
  endpoint and returns `<REPLY><ERROR>XML not well formed!</ERROR></REPLY>`.
- **CSRF**: render `Ui::csrf()` inside the form and nothing else. GLPI 11 validates every non-AJAX POST in a kernel
  listener and that validation *consumes* the single-use token, so a second `Session::checkCSRF($_POST)` in the
  page fails with 403. One token per request, shared by all forms on the page. XHR POSTs that send the token in the
  `X-Glpi-Csrf-Token` header (from the `glpi:csrf_token` meta) with `X-Requested-With: XMLHttpRequest` keep it.
- **Redirect**: `Html::redirect()` throws `Glpi\Exception\RedirectException` (11 and 12). A `try { … Html::redirect() }
  catch (\Throwable $e)` swallows the redirect and the page "succeeds" into the wrong place. Catch specific
  exceptions, or rethrow when `$e instanceof \Glpi\Exception\RedirectException`.
- **Access**: `Ui::need(READ)` (any plugin right when called without arguments) throws the 403 exception. Do the check
  before any output and before handling POST.
- **Checkboxes**: an unticked box sends nothing. Put `<input type="hidden" name="x" value="0">` before it.
- **Multiple selects** (`User::dropdown`, `Dropdown::show`, `CommonDBTM::dropdown` with `'multiple' => true`): the
  preselected ids go in **`'value'`** (array), not `'values'`. With `'values'` the internal list stays an empty
  string and `array_combine()` fatals inside `Html::jsAjaxDropdown`. The POST comes back as an array.
- **Uploads**: after `move_uploaded_file()`, clear `$_FILES` before redirecting; GLPI later rebuilds a Symfony
  Request from globals and throws "file does not exist" → 500, and the user's refresh then hits CSRF 403. A POST
  bigger than `post_max_size` arrives with an empty `$_POST`, which GLPI reports as CSRF 403: check sizes client-side.
- **Anonymous endpoints** (served before login, e.g. a logo for the login page): in `plugin_init`, register
  `\Glpi\Http\Firewall::addPluginStrategyForLegacyScripts('{{key}}', '#^/front/asset\.php$#',
  \Glpi\Http\Firewall::STRATEGY_NO_CHECK)`. PHP's session headers (`Cache-Control: no-store`) survive into the
  response; `header_remove()` them before returning a cached file.
- **Output escaping**: escape everything you print (`Ui::e()`). GLPI 11 no longer sanitises input on the way in.
- **TCPDF** (bundled 6.11): HTML attributes must use double quotes; single-quoted `style='…'` / `bgcolor='…'` are
  silently ignored and the PDF comes out unstyled. Always open a generated PDF once.

## 4. Install, update, uninstall

- **Additive only.** Installing a new version must not change what administrators and users already have: tables
  and columns are added with `tableExists()` / `fieldExists()` guards and defaults that keep the old behaviour;
  rights are added only for profiles that have no row yet (`Profile::ensure()`); settings are added only when the
  key is missing (`Config::install()`); seeded content (sample rules, reports) is created on a fresh install or when
  the user presses a button, never rewritten on update.
- **Previous version**: GLPI overwrites `glpi_plugins.version` *before* calling `plugin_{{key}}_install()`, so the
  old version cannot be read there. `hook.php` keeps it in the setting `schema_version` and gates one-time migrations
  on it (`version_compare($previous, '0.2.0', '<')`).
- **Version bump = deactivation.** When the files' version differs from the database, GLPI marks the plugin "to
  update" and deactivates it until someone clicks *Update* then *Enable* (or runs `plugin:install` / `plugin:activate`).
  Raise the version on every delivery so everyone can tell builds apart, and tell the administrator to click.
- **`plugin:install --force`** leaves the plugin deactivated; activate afterwards.
- **Cron**: `CronTask::register()` is idempotent (returns false when the task exists). Register in install, not in
  `plugin_init`.
- **Uninstall** drops the plugin's tables, deletes its `glpi_configs` rows, its `glpi_profilerights` rows, its
  `glpi_crontasks` (via `unregister`), and its rows in `glpi_logs`, `glpi_displaypreferences`, `glpi_savedsearches`
  and `glpi_documents_items` where the `itemtype` is one of its classes.
- **Renaming a plugin key** means a migration: `RENAME TABLE`, rewrite `itemtype` columns (including JSON
  payloads), rights, config context, copy the files folder, delete the old `glpi_plugins` row. Do it once, log it,
  keep the old folder read-only for reference.

## 5. Item types and the search engine

- A `CommonDBTM` subclass gets list, form, history, massive actions and CSV export for free: `Search::show(Item::class)`
  in `front/item.php`, `$item->display(['id' => $id])` in `front/item.form.php`, buttons posted as `add` / `update` /
  `purge` (and `delete` / `restore` when the table has `is_deleted`).
- `rawSearchOptions()`: id `1` is the name with `'datatype' => 'itemlink'`, `2` the id, `80` the entity, `16` the
  comment, `19` / `121` the dates. Reuse GLPI's conventional ids for the standard columns and any free id for your
  own fields, then keep them stable forever: saved searches and display preferences store them.
- A search option whose `table` is a plugin table with no class of that name (`glpi_plugin_{{key}}_links` without a
  `Link` class) crashes the criteria row (`getItemForItemtype()` returns null). Give it `'itemtype' => SomeClass::class`.
- `addSelect` / `addWhere` hooks on other item types: no aggregates (`COUNT`, `MAX`) in `addSelect`; GLPI only adds
  `GROUP BY` when one of its own options needs it, otherwise the whole result collapses into one row. Use a
  correlated `EXISTS (…)` instead. The main table is not aliased (`glpi_computers`, custom assets `glpi_assets_assets`).
- Entities: a table with `entities_id` (and `is_recursive`) is restricted automatically by the search engine; in
  your own queries add `getEntitiesRestrictCriteria(Item::TABLE)`.
- History (`$dohistory = true`) needs the `Log` tab in `defineTabs()` and nothing else.

## 6. Native GLPI 11 forms (the Form API, when your plugin reads answers)

- An item question's answer is an object `{"itemtype": "Computer", "items_id": "12"}`, not a bare id. `(int)` on it is
  0 without a warning. Selectable questions (radio, checkbox, dropdown) store option UUIDs.
- A `QuestionTypeItem` with a bare integer `default_value` crashes both the editor and the rendered form; defaults are
  JSON (`[]` or `{"items_id": 0}`).
- Validation targets: `CommonITILValidation` uses `itemtype_target` + `items_id_target` (User or Group);
  `users_id_validate` is a deprecated shim that stays 0 in the table.
- Creating a solution or moving a ticket to solved needs a session: in a CLI harness set `$_SESSION['glpiID']`,
  `Session::changeProfile()`, `Session::changeActiveEntities('all')` first, or it silently does nothing.

## 7. Performance

- Ship `locales/en_GB.mo` even without translations. GLPI registers a plugin's text domain only when a `.mo` exists;
  otherwise every `__('…', '{{key}}')` re-runs the loader (≈150 µs each; a page with 2 000 calls loses 0.3 s).
- Cache `Config::getConfigurationValues()` per request (`Config::get()` does), do not query it per call.
- `plugin_init` runs on every request for every user: register hooks, read nothing from the database.

## 8. Testing without a browser

- `bash tests/lint.sh /var/www/glpi`: syntax and class load check (no database needed).
- A logged-in CLI harness: boot the kernel (`require vendor/autoload.php; (new \Glpi\Kernel\Kernel('production'))->boot();`),
  set `$_SESSION['glpiID']`, `Session::changeProfile(4)`, `Session::changeActiveEntities('all')`, then include the page
  with `$_SERVER['REQUEST_METHOD']` / `$_POST` set, catching the `RedirectException`. Run it with `GLPI_VAR_DIR=/tmp/glpivar`
  (and `GLPI_CACHE_DIR`, `GLPI_LOG_DIR`) when the web server owns GLPI's `files/` folders.
- **Never define `PLUGIN_{{KEY}}_VERSION` in a harness** to "test the new version". The kernel loads the installed
  `setup.php`, its `define()` fails silently, GLPI sees files ≠ database and deactivates the plugin for every web user.
  Read the constant after boot instead.
- To test patched files without installing them: `define('GLPI_PLUGINS_DIRECTORIES', ['/tmp/x', '/var/www/glpi/plugins'])`
  before boot with the copy in `/tmp/x/{{key}}` and its `setup.php` version equal to the installed one.
- Console: `php bin/console {{consolePrefix}}plugin:install {{key}} -u glpi`, `…plugin:activate`, `…plugin:deactivate`,
  `…plugin:uninstall`; the `-u` user must exist. On GLPI 10 the console also needs `GLPI_VAR_DIR` with all subfolders
  pre-created.
- Always verify static asset URLs against a real GLPI: a local file server masks the `public/` rule.

## 9. Release checklist

1. `PLUGIN_{{KEY}}_VERSION` raised; `CHANGELOG.md` has a `## [x.y.z] - date` section.
2. `bash tests/lint.sh <glpi 11>` and `<glpi 12>` pass; every page opened once; install → update → uninstall run on a
   copy of a real database.
3. `plugin.xml` lists the new version with its compatibility (`~11.0`, `~12.0`).
4. `git tag vx.y.z && git push --tags`: the release workflow builds `dist/{{key}}-x.y.z.{tgz,zip,sha256}` (plugin
   files only, folder `{{key}}/` at the archive root, files owned by root, mode 644) and publishes the GitHub release.
5. Tell administrators the version changed and the plugin needs *Update* / *Enable*.
