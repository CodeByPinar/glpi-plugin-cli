<?php

/**
 * {{name}} — loads every plugin class against GLPI's core classes WITHOUT booting GLPI (no database, no session).
 *
 * A method whose signature does not match GLPI's (a missing `: bool` on canView(), a parameter type GLPI does not
 * declare) is a compile-time fatal error. GLPI's console never loads most plugin classes, so the error surfaces only
 * when a page renders: a white screen in production. This script declares each class, which runs that check.
 *
 *   php tests/loadcheck.php /var/www/glpi
 *   GLPI_ROOT=/var/www/glpi php tests/loadcheck.php
 */

$root = rtrim((string) ($argv[1] ?? getenv('GLPI_ROOT') ?: ''), '/\\');
if ($root === '' || !is_file($root . '/vendor/autoload.php')) {
    fwrite(STDERR, "usage: php tests/loadcheck.php <glpi root>  (a GLPI checkout with vendor/ installed)\n");
    exit(2);
}

require $root . '/vendor/autoload.php';
if (is_file($root . '/inc/define.php')) {
    require_once $root . '/inc/define.php'; // READ, UPDATE, DAY_TIMESTAMP, GLPI_VERSION, …
}
// in case define.php moved: the constants the classes use in constant expressions
foreach (['READ' => 1, 'UPDATE' => 2, 'CREATE' => 4, 'DELETE' => 8, 'PURGE' => 16, 'INFO' => 0, 'WARNING' => 1, 'ERROR' => 2,
          'MINUTE_TIMESTAMP' => 60, 'HOUR_TIMESTAMP' => 3600, 'DAY_TIMESTAMP' => 86400] as $name => $value) {
    if (!defined($name)) {
        define($name, $value);
    }
}

$prefix = 'GlpiPlugin\\{{Key}}\\';
$src = dirname(__DIR__) . '/src';
spl_autoload_register(static function (string $class) use ($prefix, $src): void {
    if (str_starts_with($class, $prefix)) {
        $file = $src . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
        if (is_file($file)) {
            require_once $file;
        }
    }
});

$bad = 0;
foreach (glob($src . '/*.php') ?: [] as $file) {
    $class = $prefix . basename($file, '.php');
    try {
        if (class_exists($class)) {
            echo "  ok  {$class}\n";
        } else {
            echo "FAIL  {$class} is not declared in " . basename($file) . "\n";
            $bad++;
        }
    } catch (\Throwable $e) {
        echo "FAIL  {$class}: " . $e->getMessage() . "\n";
        $bad++;
    }
}
echo $bad === 0 ? "load check: ok\n" : "load check: {$bad} problem(s)\n";
exit($bad === 0 ? 0 : 1);
