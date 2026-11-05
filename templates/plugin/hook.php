<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 *
 * Install and update only ADD things: missing tables, columns, settings, rights and automatic actions. Data, settings
 * and rights that already exist are never rewritten. One-time migrations are gated on the previously installed version.
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

function plugin_{{key}}_install(): bool
{
    /** @var \DBmysql $DB */
    global $DB;

    // GLPI overwrites glpi_plugins.version before calling install(), so the previous version is kept in the settings.
    $previous = \Config::getConfigurationValues('plugin:{{key}}', ['schema_version'])['schema_version'] ?? null;
    $fresh = $previous === null;

{{#if itemtype}}
    $charset = DBConnection::getDefaultCharset();
    $collation = DBConnection::getDefaultCollation();
    $sign = DBConnection::getDefaultPrimaryKeySignOption();
    if (!$DB->tableExists(Item::TABLE)) {
        $DB->doQuery("CREATE TABLE `" . Item::TABLE . "` (
            `id` INT {$sign} NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(255) NOT NULL DEFAULT '',
            `entities_id` INT {$sign} NOT NULL DEFAULT 0,
            `is_recursive` TINYINT NOT NULL DEFAULT 0,
            `is_active` TINYINT NOT NULL DEFAULT 1,
            `comment` TEXT NULL,
            `date_creation` TIMESTAMP NULL DEFAULT NULL,
            `date_mod` TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `name` (`name`),
            KEY `entities_id` (`entities_id`),
            KEY `is_active` (`is_active`),
            KEY `date_mod` (`date_mod`)
        ) ENGINE=InnoDB DEFAULT CHARSET={$charset} COLLATE={$collation} ROW_FORMAT=DYNAMIC");
    }
    // A later version adds a column like this. The default keeps the old behaviour; existing rows are not rewritten.
    // if (!$DB->fieldExists(Item::TABLE, 'priority')) {
    //     $DB->doQuery("ALTER TABLE `" . Item::TABLE . "` ADD `priority` TINYINT NOT NULL DEFAULT 3");
    // }

{{/if}}
{{#if config}}
    Config::install();
{{/if}}
    Profile::install();
{{#if cron}}
    Cron::install();
{{/if}}

    // One-time migrations run only on updates, gated on the version that ran install() before:
    // if (!$fresh && version_compare($previous, '0.2.0', '<')) { … }

    \Config::setConfigurationValues('plugin:{{key}}', ['schema_version' => PLUGIN_{{KEY}}_VERSION]);
    return true;
}

function plugin_{{key}}_uninstall(): bool
{
    /** @var \DBmysql $DB */
    global $DB;
{{#if itemtype}}

    if ($DB->tableExists(Item::TABLE)) {
        $DB->doQuery("DROP TABLE `" . Item::TABLE . "`");
    }
    $DB->delete('glpi_logs', ['itemtype' => Item::class]);
    $DB->delete('glpi_displaypreferences', ['itemtype' => Item::class]);
{{/if}}
{{#if config}}
    Config::uninstall();
{{/if}}
{{#if cron}}
    Cron::uninstall();
{{/if}}
    Profile::uninstall();
    \Config::deleteConfigurationValues('plugin:{{key}}', ['schema_version']);
    return true;
}
