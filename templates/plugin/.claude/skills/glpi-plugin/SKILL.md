---
name: glpi-plugin
description: Recipes for changing this GLPI plugin ({{name}}, key {{key}}, {{glpiLabel}}) without breaking GLPI's rules - add a page, a right, a setting, a table column, an item type field, a cron task, a tab on a GLPI object, a translation, or ship a release. Use whenever a change touches setup.php, hook.php, src/, front/ or the version.
---

# {{name}} — change recipes

Read `docs/glpi-rules.md` once; this skill is the short "how" for each kind of change. Every recipe ends the same
way: `bash tests/lint.sh <glpi root>`, render the page once, bump `PLUGIN_{{KEY}}_VERSION` when the change ships.

## New page

1. `front/<page>.php`: copy `front/{{#if menu}}index{{else}}config{{/if}}.php`. Keep the first lines: `use` lines, `include('../../../inc/includes.php');`,
   `Ui::need(<right>)`, then POST handling, then `Ui::header('<page>', $title)` … `Ui::footer()`.
2. POST handling comes *before* `Ui::header()` and ends with `Html::redirect(Ui::url('<page>'))`. Forms:
   `<form method='post' action='" . Ui::e(Ui::url('<page>')) . "'>" . Ui::csrf()`.
3. Add the page to the `$tabs` array in `Ui::header()` so the pill navigation shows it{{#if menu}}, and to
   `Menu::getMenuContent()['links']` when it deserves a menu link{{/if}}.
4. Everything printed goes through `Ui::e()`; strings through `__('…', '{{key}}')`.

## New right

1. `Profile.php`: add a constant (own bits start at 1024 and double: 1024, 2048, …), add it to `ALL`, to
   `canRead()`'s list and to `getAllRights()` with its label.
2. Existing profiles keep their row untouched; a new bit is simply off for them until an administrator ticks it.
   If the bit must be on by default for administrators on update, add a gated migration in `hook.php`
   (`if (!$fresh && version_compare($previous, '<new version>', '<'))`) that ORs the bit into rows that have `ALL`.
3. Use it: `Ui::need(Profile::NEW_BIT)` on pages, `Profile::has(Profile::NEW_BIT)` for buttons.

{{#if config}}
## New setting

1. `Config::DEFAULTS`: one line, string default, comment with the allowed values.
2. `Config::save()`: one `match` arm that validates it (range, allowed list, URL, …).
3. `front/config.php`: one field. Checkboxes need the hidden `0` input before them.
4. Read it with `Config::get()`, `Config::int()`, `Config::flag()`. Secrets: encrypt with `(new \GLPIKey())->encrypt()`
   in `save()` and decrypt on read; an empty submitted value keeps the stored secret.

{{/if}}
{{#if itemtype}}
## New column on Item

1. `hook.php` install: `if (!$DB->fieldExists(Item::TABLE, 'col')) { $DB->doQuery("ALTER TABLE … ADD `col` … DEFAULT …"); }`
   right after the `CREATE TABLE` block (install also runs on update, so this is the migration).
2. `Item::rawSearchOptions()`: a new entry with a *new, never reused* id; `datatype` one of `itemlink`, `string`,
   `text`, `number`, `bool`, `date`, `datetime`, `dropdown` (with `table` of the target), `specific`.
3. `Item::showForm()`: the input; `Item::prepareInputForAdd/Update()`: validation.
4. History picks the column up automatically; massive actions too, unless `'massiveaction' => false`.

## New item type

Copy `src/Item.php` → `src/Thing.php` (class `Thing`, table `glpi_plugin_{{key}}_things`), `front/item.php` and
`front/item.form.php` → `thing.php` / `thing.form.php`, add the `CREATE TABLE` to `hook.php`, the `DROP TABLE` and
the `glpi_logs` / `glpi_displaypreferences` clean-up to uninstall, a tab in `Ui::header()`{{#if menu}} and links in
`Menu::getMenuContent()`{{/if}}. Keep the `can*()` overrides and the constructor: `$rightname` and `$dohistory`
cannot be redeclared in a class that runs on GLPI 11 and 12 (typed in 12 only).

{{/if}}
{{#if cron}}
## New automatic action

1. `Cron.php`: a new `const`, a `cronInfo()` arm, a `cron<Name>(CronTask $task): int` method (1 = did work,
   0 = nothing, -1 = error; `$task->addVolume($n)`, `$task->log($text)`).
2. `Cron::install()`: a second `CronTask::register(self::class, self::NEW, <seconds>, [...])`. Install runs on update,
   and `register()` is idempotent, so existing installs get the task on their next update.
3. Test it: Setup → Automatic actions → the task → *Execute*, or `php front/cron.php` in the GLPI folder (GLPI's
   CLI cron runner; it runs every task that is due).

{{else}}
## Automatic action (cron task)

Create `src/Cron.php` extending `CommonGLPI` with `getTypeName()`, `cronInfo($name)` returning
`['description' => …, 'parameter' => …]`, and `cron<Name>(CronTask $task): int`. Register it in `hook.php` install
with `CronTask::register(Cron::class, '<name>', DAY_TIMESTAMP, ['mode' => CronTask::MODE_EXTERNAL, 'state' =>
CronTask::STATE_WAITING])` and remove it in uninstall with `CronTask::unregister('{{key}}')`. Run it from
Setup → Automatic actions or `php front/cron.php` in the GLPI folder.

{{/if}}
## Tab on a GLPI object

{{#if tickettab}}`src/TicketTab.php` is the pattern.{{else}}Create `src/<Type>Tab.php` extending `CommonGLPI` with
`getTabNameForItem(CommonGLPI $item, $withtemplate = 0)` (return `self::createTabEntry($label, $count, null, $icon)`
or `''`) and `static displayTabContentForItem(CommonGLPI $item, $tabnum = 1, $withtemplate = 0)`.{{/if}}
Register it in `setup.php`: `Plugin::registerClass(<Class>::class, ['addtabon' => 'Computer'])` (one type or an
array). Keep the exact signatures: no parameter types added, no return types removed.

## Hook on GLPI events

`setup.php`, after the activation check: `$PLUGIN_HOOKS[Hooks::ITEM_ADD]['{{key}}']['Ticket'] = [Handler::class,
'onTicketAdd']` (also `ITEM_UPDATE`, `PRE_ITEM_ADD`, `ITEM_PURGE`, …). The handler is `public static function
onTicketAdd(\Ticket $item): void` and reads `$item->fields` (`$item->input` / `$item->oldvalues` on updates).

## Translation

New strings: `__('Text', '{{key}}')`. Then `bash tools/i18n.sh` (needs gettext) refreshes `locales/{{key}}.pot` and
compiles every `locales/*.po`. New language: copy the `.pot` to `locales/<lang>.po`, translate, run the script,
add `<lang>` to `plugin.xml`.

## Release

1. `setup.php`: raise `PLUGIN_{{KEY}}_VERSION` (patch for fixes, minor for features).
2. `CHANGELOG.md`: a `## [x.y.z] - YYYY-MM-DD` section; `plugin.xml`: a `<version>` entry per supported GLPI line.
3. `git tag vx.y.z && git push --tags`. The workflow builds `dist/{{key}}-x.y.z.{tgz,zip,sha256}` and the GitHub release.
4. Tell administrators: the plugin shows "to update" and needs *Update* then *Enable* (or `{{consolePrefix}}plugin:install`
   + `{{consolePrefix}}plugin:activate`).
