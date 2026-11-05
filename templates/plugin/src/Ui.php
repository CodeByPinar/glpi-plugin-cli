<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use Html;
use Session;

/** Ui — page chrome and small helpers shared by the front pages. */
final class Ui
{
    /** HTML-escapes a value for output. */
    public static function e($value): string
    {
        return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    /**
     * Absolute URL of a front page, e.g. Ui::url('config') or Ui::url('item.form', ['id' => 3]).
     * Always use this for form actions: $_SERVER['PHP_SELF'] resolves to /index.php under GLPI's router.
     * @param array<string,scalar|null> $query
     */
    public static function url(string $page, array $query = []): string
    {
        /** @var array $CFG_GLPI */
        global $CFG_GLPI;

        $url = ($CFG_GLPI['root_doc'] ?? '') . '/plugins/{{key}}/front/' . $page . '.php';
        $query = array_filter($query, static fn($value) => $value !== '' && $value !== null);
        return $query ? $url . '?' . http_build_query($query) : $url;
    }

    /** Hidden CSRF field for a POST form. GLPI 11 checks it itself; GLPI 12 has no tokens, so this is empty there. */
    public static function csrf(): string
    {
        return method_exists(Session::class, 'getNewCSRFToken')
            ? Html::hidden('_glpi_csrf_token', ['value' => Session::getNewCSRFToken()])
            : '';
    }

    /**
     * Stops the page with 403 unless the user holds one of the given rights (any plugin right when none is given).
     * Throwing the exception works on GLPI 11 and 12 (Html::displayRightError() is gone in 12).
     */
    public static function need(int ...$bits): void
    {
        if ($bits === [] ? Profile::canRead() : Session::haveRightsOr(Profile::RIGHT, $bits)) {
            return;
        }
        throw new \Glpi\Exception\Http\AccessDeniedHttpException();
    }

    /** Page header: GLPI chrome, plugin title and the pill navigation between the plugin's pages. */
    public static function header(string $active, string $title): void
    {
{{#if menu}}
        Html::header('{{php_name}} — ' . $title, $_SERVER['PHP_SELF'] ?? '', '{{sector}}', Menu::class);
{{else}}
        Html::header('{{php_name}} — ' . $title, $_SERVER['PHP_SELF'] ?? '', 'config', 'plugins');
{{/if}}

        $tabs = [];
{{#if menu}}
        $tabs['index'] = [__('Overview', '{{key}}'), 'ti ti-home'];
{{/if}}
{{#if itemtype}}
        $tabs['item'] = [Item::getTypeName(2), Item::getIcon()];
{{/if}}
{{#if config}}
        if (Profile::has(Profile::CONFIG)) {
            $tabs['config'] = [__('Settings', '{{key}}'), 'ti ti-adjustments'];
        }
{{/if}}

        echo "<div class='{{key}} container-fluid px-0'>";
        echo "<div class='d-flex flex-wrap align-items-baseline gap-2 mb-2'><h2 class='mb-0'><i class='{{icon}} me-1'></i>"
            . self::e('{{php_name}}') . "</h2><span class='text-muted'>" . self::e('{{php_description}}') . "</span></div>";
        if (count($tabs) > 1) {
            echo "<ul class='nav nav-pills {{key}}-nav mb-3'>";
            foreach ($tabs as $page => [$label, $icon]) {
                echo "<li class='nav-item'><a class='nav-link" . ($page === $active ? ' active' : '') . "' href='"
                    . self::e(self::url($page)) . "'><i class='{$icon} me-1'></i>" . self::e($label) . "</a></li>";
            }
            echo "</ul>";
        }
    }

    public static function footer(): void
    {
        echo "</div>";
        Html::footer();
    }

    /** Date-time in the user's format, empty for null. */
    public static function dt($value): string
    {
        return $value ? (string) Html::convDateTime((string) $value) : '';
    }
}
