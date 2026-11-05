<?php

/**
 * -------------------------------------------------------------------------
 * {{name}} — plugin for GLPI
 * -------------------------------------------------------------------------
 * {{description}}
 *
 * @copyright {{year}} {{author}}
 * @license   {{license}} {{licenseUrl}}
 * @link      {{repo}}
 * -------------------------------------------------------------------------
 */

use Glpi\Plugin\Hooks;
{{#if menu}}
use GlpiPlugin\{{Key}}\Menu;
{{/if}}
use GlpiPlugin\{{Key}}\Profile;
{{#if tickettab}}
use GlpiPlugin\{{Key}}\TicketTab;
{{/if}}

define('PLUGIN_{{KEY}}_VERSION', '0.1.0');
define('PLUGIN_{{KEY}}_MIN_GLPI', '{{minGlpi}}');
define('PLUGIN_{{KEY}}_MAX_GLPI', '{{maxGlpi}}');

/**
 * Runs on every request, for every user, before the session is fully known. Keep it cheap: register hooks and
 * classes here, do no database work.
 */
function plugin_init_{{key}}(): void
{
    /** @var array $PLUGIN_HOOKS */
    global $PLUGIN_HOOKS;

{{#if glpi11}}
    // GLPI 11 validates CSRF tokens itself for compliant plugins; GLPI 12 removed the tokens and the constant.
    if (defined(Hooks::class . '::CSRF_COMPLIANT')) {
        $PLUGIN_HOOKS[Hooks::CSRF_COMPLIANT]['{{key}}'] = true;
    }
{{/if}}
    if (!(new Plugin())->isActivated('{{key}}')) {
        return;
    }

    // rights tab on Administration → Profiles, and a rights row for every profile created later
    Plugin::registerClass(Profile::class, ['addtabon' => 'Profile']);
    $PLUGIN_HOOKS[Hooks::ITEM_ADD]['{{key}}'] = ['Profile' => [Profile::class, 'onProfileAdd']];
{{#if tickettab}}
    Plugin::registerClass(TicketTab::class, ['addtabon' => 'Ticket']);
{{/if}}
{{#if menu}}

    if (Session::getLoginUserID() !== false && Profile::canRead()) {
        $PLUGIN_HOOKS[Hooks::MENU_TOADD]['{{key}}'] = ['{{sector}}' => Menu::class];
    }
    // served from public/css/{{key}}.css (GLPI only serves plugin assets from the public/ folder)
    $PLUGIN_HOOKS[Hooks::ADD_CSS]['{{key}}'] = 'css/{{key}}.css';
{{/if}}
{{#if config}}

    if (Profile::has(Profile::CONFIG)) {
        $PLUGIN_HOOKS[Hooks::CONFIG_PAGE]['{{key}}'] = 'front/config.php';
    }
{{/if}}
}

function plugin_version_{{key}}(): array
{
    return [
        'name'         => '{{php_name}}',
        'version'      => PLUGIN_{{KEY}}_VERSION,
        'author'       => '{{php_author}}',
        'license'      => '{{licenseShort}}',
        'homepage'     => '{{repo}}',
        'requirements' => [
            'glpi' => ['min' => PLUGIN_{{KEY}}_MIN_GLPI, 'max' => PLUGIN_{{KEY}}_MAX_GLPI],
            'php'  => ['min' => '{{minPhp}}'],
        ],
    ];
}

function plugin_{{key}}_check_prerequisites(): bool
{
    return true;
}

function plugin_{{key}}_check_config($verbose = false): bool
{
    return true;
}
