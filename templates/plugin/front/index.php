<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 *
 * Overview page: what is installed, where the pieces live, what to do next. Replace it with your own first page.
 */

{{#if config}}
use GlpiPlugin\{{Key}}\Config;
{{/if}}
{{#if cron}}
use GlpiPlugin\{{Key}}\Cron;
{{/if}}
{{#if itemtype}}
use GlpiPlugin\{{Key}}\Item;
{{/if}}
use GlpiPlugin\{{Key}}\Profile;
use GlpiPlugin\{{Key}}\Ui;

include('../../../inc/includes.php');

Ui::need();
Ui::header('index', __('Overview', '{{key}}'));

/** @var \DBmysql $DB */
global $DB;

$card = static fn(string $icon, string $title): string => "<div class='col-lg-6'><div class='card h-100'><div class='card-header'>"
    . "<h3 class='card-title'><i class='{$icon} me-1'></i>" . Ui::e($title) . "</h3></div><div class='card-body'>";
$end = "</div></div></div>";

echo "<div class='row g-3'>";

// status
echo $card('ti ti-circle-check', __('Status', '{{key}}'));
echo "<p class='mb-2'>" . sprintf(Ui::e(__('%1$s %2$s is installed and active on GLPI %3$s (PHP %4$s).', '{{key}}')),
    '<strong>' . Ui::e('{{php_name}}') . '</strong>', Ui::e(PLUGIN_{{KEY}}_VERSION), Ui::e(GLPI_VERSION), Ui::e(PHP_VERSION)) . "</p>";
echo "<ul class='mb-0'>";
$rights = [READ => __('Read'), UPDATE => __('Update'){{#if itemtype}}, CREATE => __('Create'), DELETE => __('Delete'), PURGE => __('Delete permanently'){{/if}}{{#if config}}, Profile::CONFIG => __('Settings', '{{key}}'){{/if}}];
$mine = array_filter($rights, static fn(int $bit): bool => Profile::has($bit), ARRAY_FILTER_USE_KEY);
echo "<li>" . Ui::e(__('Your rights:', '{{key}}')) . " " . Ui::e(implode(', ', $mine) ?: __('none', '{{key}}')) . "</li>";
{{#if itemtype}}
$count = (new \DbUtils())->countElementsInTable(Item::TABLE);
echo "<li><a href='" . Ui::e(Ui::url('item')) . "'>" . sprintf(Ui::e(_n('%d item', '%d items', $count, '{{key}}')), $count) . "</a></li>";
{{/if}}
{{#if cron}}
$task = new \CronTask();
if ($task->getFromDBbyName(Cron::class, Cron::TASK)) {
    $state = (int) $task->fields['state'] === \CronTask::STATE_DISABLE ? __('disabled', '{{key}}') : __('scheduled', '{{key}}');
    echo "<li>" . sprintf(Ui::e(__('Automatic action "%1$s": %2$s, last run %3$s', '{{key}}')), Ui::e(Cron::TASK), Ui::e($state),
        Ui::e(Ui::dt($task->fields['lastrun']) ?: __('never', '{{key}}')))
        . " — <a href='" . Ui::e($task->getLinkURL()) . "'>" . Ui::e(__('open', '{{key}}')) . "</a></li>";
}
{{/if}}
{{#if config}}
echo "<li>" . sprintf(Ui::e(__('Example setting "%1$s" = %2$s', '{{key}}')), 'example_text', Ui::e(Config::get('example_text') ?: '—'));
if (Profile::has(Profile::CONFIG)) {
    echo " — <a href='" . Ui::e(Ui::url('config')) . "'>" . Ui::e(__('Settings', '{{key}}')) . "</a>";
}
echo "</li>";
{{/if}}
echo "</ul>" . $end;

// where things live
echo $card('ti ti-folders', __('Where things live', '{{key}}'));
$parts = [
    'setup.php'          => __('version, hooks, menu registration', '{{key}}'),
    'hook.php'           => __('install / update / uninstall (additive only)', '{{key}}'),
    'src/Profile.php'    => __('rights', '{{key}}'),
    'src/Ui.php'         => __('page header, URLs, CSRF field, access checks', '{{key}}'),
{{#if menu}}
    'src/Menu.php'       => __('menu entry', '{{key}}'),
    'front/index.php'    => __('this page', '{{key}}'),
{{/if}}
{{#if itemtype}}
    'src/Item.php'       => __('item type: table, search options, form', '{{key}}'),
    'front/item.php'     => __('item list (GLPI search engine)', '{{key}}'),
{{/if}}
{{#if config}}
    'src/Config.php'     => __('settings (glpi_configs, context plugin:{{key}})', '{{key}}'),
    'front/config.php'   => __('settings page', '{{key}}'),
{{/if}}
{{#if cron}}
    'src/Cron.php'       => __('automatic action', '{{key}}'),
{{/if}}
{{#if tickettab}}
    'src/TicketTab.php'  => __('tab on tickets', '{{key}}'),
{{/if}}
    'docs/glpi-rules.md' => __('GLPI 11 / 12 rules and traps — read before changing code', '{{key}}'),
];
echo "<table class='table table-sm mb-0'>";
foreach ($parts as $file => $what) {
    echo "<tr><td><code>" . Ui::e($file) . "</code></td><td>" . Ui::e($what) . "</td></tr>";
}
echo "</table>" . $end;

echo "</div>";
Ui::footer();
