<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use CommonGLPI;
use DbUtils;
use Html;
use ProfileRight;
use Session;

/**
 * Profile — the plugin's rights (Administration → Profiles → {{name}} tab).
 *
 * GLPI's standard bits are reused so the labels match the rest of GLPI:
 *   READ    see the plugin's pages
 *   UPDATE  make changes
{{#if itemtype}}
 *   CREATE / DELETE / PURGE  items
{{/if}}
{{#if config}}
 *   CONFIG  the settings page (plugin-specific bit)
{{/if}}
 *
 * Fresh install: profiles that may change GLPI's configuration get everything, other central profiles get READ,
 * self-service profiles get nothing. Updates only add missing rows; existing rights are never changed.
 */
class Profile extends CommonGLPI
{
    public const RIGHT = 'plugin_{{key}}';
{{#if config}}
    public const CONFIG = 1024;
{{/if}}
    public const ALL = READ | UPDATE{{#if itemtype}} | CREATE | DELETE | PURGE{{/if}}{{#if config}} | self::CONFIG{{/if}};

    public static function getTypeName($nb = 0)
    {
        return '{{php_name}}';
    }

    public static function has(int $bit): bool
    {
        return (bool) Session::haveRight(self::RIGHT, $bit);
    }

    /** Any right at all is enough to see the plugin's pages. */
    public static function canRead(): bool
    {
        return (bool) Session::haveRightsOr(self::RIGHT, [READ, UPDATE{{#if itemtype}}, CREATE, DELETE, PURGE{{/if}}{{#if config}}, self::CONFIG{{/if}}]);
    }

    /** @return list<array{rights:array<int,string>,label:string,field:string}> */
    public static function getAllRights(): array
    {
        $rights = [
            READ   => __('Read'),
            UPDATE => __('Update'),
{{#if itemtype}}
            CREATE => __('Create'),
            DELETE => __('Delete'),
            PURGE  => __('Delete permanently'),
{{/if}}
{{#if config}}
            self::CONFIG => __('Settings', '{{key}}'),
{{/if}}
        ];
        return [['rights' => $rights, 'label' => '{{php_name}}', 'field' => self::RIGHT]];
    }

    public function getTabNameForItem(CommonGLPI $item, $withtemplate = 0)
    {
        if ($item instanceof \Profile && (int) $item->getID() > 0) {
            return self::createTabEntry('{{php_name}}', 0, null, '{{icon}}');
        }
        return '';
    }

    public static function displayTabContentForItem(CommonGLPI $item, $tabnum = 1, $withtemplate = 0)
    {
        if (!$item instanceof \Profile) {
            return false;
        }
        $canedit = Session::haveRightsOr('profile', [CREATE, UPDATE, PURGE]);
        echo "<div class='firstbloc'>";
        if ($canedit) {
            echo "<form method='post' action='" . \Profile::getFormURL() . "'>";
        }
        $item->displayRightsChoiceMatrix(self::getAllRights(), [
            'canedit'       => $canedit,
            'default_class' => 'tab_bg_2',
            'title'         => '{{php_name}}',
        ]);
        if ($canedit) {
            echo "<div class='center'>" . Html::hidden('id', ['value' => $item->getID()])
                . Html::submit(_sx('button', 'Save'), ['name' => 'update']) . "</div>";
            Html::closeForm();
        }
        echo "</div>";
        return true;
    }

    /** Adds the right row when missing. Never changes an existing one. */
    public static function ensure(int $profilesId, int $value): void
    {
        $count = (new DbUtils())->countElementsInTable('glpi_profilerights', ['profiles_id' => $profilesId, 'name' => self::RIGHT]);
        if ($count > 0) {
            return;
        }
        (new ProfileRight())->add(['profiles_id' => $profilesId, 'name' => self::RIGHT, 'rights' => $value]);
        if ((int) ($_SESSION['glpiactiveprofile']['id'] ?? 0) === $profilesId) {
            $_SESSION['glpiactiveprofile'][self::RIGHT] = $value; // the installing user sees the plugin at once
        }
    }

    public static function onProfileAdd(\Profile $profile): void
    {
        self::ensure((int) $profile->getID(), 0);
    }

    public static function install(): void
    {
        /** @var \DBmysql $DB */
        global $DB;

        $admins = [];
        $rows = $DB->request(['SELECT' => ['profiles_id', 'rights'], 'FROM' => 'glpi_profilerights', 'WHERE' => ['name' => 'config']]);
        foreach ($rows as $row) {
            if (((int) $row['rights'] & UPDATE) === UPDATE) {
                $admins[(int) $row['profiles_id']] = true;
            }
        }
        foreach ($DB->request(['SELECT' => ['id', 'interface'], 'FROM' => 'glpi_profiles']) as $profile) {
            $id = (int) $profile['id'];
            $value = isset($admins[$id]) ? self::ALL : ($profile['interface'] === 'central' ? READ : 0);
            self::ensure($id, $value);
        }
    }

    public static function uninstall(): void
    {
        (new ProfileRight())->deleteByCriteria(['name' => self::RIGHT]);
    }
}
