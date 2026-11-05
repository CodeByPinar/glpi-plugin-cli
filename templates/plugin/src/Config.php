<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

/**
 * Config — the plugin's settings, stored in glpi_configs under the context "plugin:{{key}}".
 *
 * Add a setting: one line in DEFAULTS, one validation line in save(), one field in front/config.php.
 * install() only adds missing keys, so updates never reset what the administrator chose.
 */
final class Config
{
    public const CONTEXT = 'plugin:{{key}}';

    /** @var array<string,string> key → default (strings only: that is how glpi_configs stores them) */
    public const DEFAULTS = [
        'example_text'   => '',   // free text, up to 255 characters
        'example_number' => '10', // 1 … 1000
        'example_flag'   => '0',  // '0' | '1'
    ];

    /** @var array<string,string>|null */
    private static ?array $cache = null;

    public static function get(string $key): string
    {
        if (self::$cache === null) {
            self::$cache = \Config::getConfigurationValues(self::CONTEXT);
        }
        return (string) (self::$cache[$key] ?? (self::DEFAULTS[$key] ?? ''));
    }

    public static function int(string $key): int
    {
        return (int) self::get($key);
    }

    public static function flag(string $key): bool
    {
        return self::get($key) === '1';
    }

    /**
     * Saves the keys present in $input (others are kept) after validation. Unknown keys are ignored.
     * @param array<string,mixed> $input usually $_POST
     */
    public static function save(array $input): void
    {
        $values = [];
        foreach (self::DEFAULTS as $key => $default) {
            if (!array_key_exists($key, $input)) {
                continue;
            }
            $raw = is_array($input[$key]) ? '' : trim((string) $input[$key]);
            $values[$key] = match ($key) {
                'example_number' => (string) max(1, min(1000, (int) $raw ?: (int) $default)),
                'example_flag'   => $raw === '1' ? '1' : '0',
                default          => mb_substr($raw, 0, 255),
            };
        }
        if ($values !== []) {
            \Config::setConfigurationValues(self::CONTEXT, $values);
        }
        self::$cache = null;
    }

    /** Adds missing keys with their defaults. Never overwrites. */
    public static function install(): void
    {
        $existing = \Config::getConfigurationValues(self::CONTEXT);
        $missing = array_diff_key(self::DEFAULTS, $existing);
        if ($missing !== []) {
            \Config::setConfigurationValues(self::CONTEXT, $missing);
        }
        self::$cache = null;
    }

    public static function uninstall(): void
    {
        \Config::deleteConfigurationValues(self::CONTEXT, array_keys(self::DEFAULTS));
        self::$cache = null;
    }
}
