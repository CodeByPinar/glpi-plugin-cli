<?php

/**
 * {{name}} — plugin for GLPI
 * @copyright {{year}} {{author}}
 * @license   {{license}}
 */

namespace GlpiPlugin\{{Key}};

use CommonGLPI;
use CronTask;

/**
 * Cron — the plugin's automatic action (Setup → Automatic actions → "{{name}}").
 *
 * GLPI calls cron<Task>() with the CronTask row; the method returns 1 when it did something, 0 when there was
 * nothing to do and -1 on error. The frequency, the mode (GLPI / CLI) and the parameter are editable in GLPI.
 */
final class Cron extends CommonGLPI
{
    /** Task name: GLPI calls cronTidy(). Unique within this class only. */
    public const TASK = 'tidy';

    public static function getTypeName($nb = 0)
    {
        return '{{php_name}}';
    }

    /** @return array{description?:string,parameter?:string} */
    public static function cronInfo($name)
    {
        return match ($name) {
            self::TASK => [
                'description' => __('Example automatic action of {{php_name}}', '{{key}}'),
                'parameter'   => __('Days to keep (example parameter)', '{{key}}'),
            ],
            default => [],
        };
    }

    public static function cronTidy(CronTask $task): int
    {
        $days = (int) ($task->fields['param'] ?? 0) ?: 30;
        $done = 0;

        // TODO: the real work goes here.{{#if itemtype}} Example: archive items untouched for $days days.{{/if}}

        $task->addVolume($done);
        $task->log(sprintf(__('%1$d item(s) processed (keeping %2$d days)', '{{key}}'), $done, $days));
        return $done > 0 ? 1 : 0;
    }

    /** Registers the task once; a second call returns false and changes nothing. */
    public static function install(): void
    {
        CronTask::register(self::class, self::TASK, DAY_TIMESTAMP, [
            'mode'    => CronTask::MODE_EXTERNAL,
            'state'   => CronTask::STATE_WAITING,
            'param'   => 30,
            'comment' => '{{php_name}}',
        ]);
    }

    public static function uninstall(): void
    {
        CronTask::unregister('{{key}}');
    }
}
