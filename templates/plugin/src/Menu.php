<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use CommonGLPI;

/**
 * Menu — the "{{name}}" entry (registered in plugin_init_{{key}}() under the "{{sector}}" sector).
 *
 * canView() / canCreate() MUST keep the `: bool` return type: GLPI declares it, and a missing type is a fatal
 * error that only shows up when GLPI renders the menu, never on the command line.
 */
class Menu extends CommonGLPI
{
    public static function getTypeName($nb = 0)
    {
        return '{{php_name}}';
    }

    public static function getMenuName()
    {
        return '{{php_name}}';
    }

    public static function getIcon()
    {
        return '{{icon}}';
    }

    public static function canView(): bool
    {
        return Profile::canRead();
    }

    public static function canCreate(): bool
    {
{{#if itemtype}}
        return Item::canCreate();
{{else}}
        return false;
{{/if}}
    }

    /** @return array<string,mixed>|false */
    public static function getMenuContent()
    {
        if (!Profile::canRead()) {
            return false;
        }
        $menu = [
            'title' => self::getMenuName(),
            'page'  => '/plugins/{{key}}/front/index.php',
            'icon'  => self::getIcon(),
            'links' => [],
        ];
{{#if itemtype}}
        $menu['links']['search'] = '/plugins/{{key}}/front/item.php';
        if (Item::canCreate()) {
            $menu['links']['add'] = '/plugins/{{key}}/front/item.form.php';
        }
{{/if}}
{{#if config}}
        if (Profile::has(Profile::CONFIG)) {
            $menu['links']['config'] = '/plugins/{{key}}/front/config.php';
        }
{{/if}}
        return $menu;
    }
}
