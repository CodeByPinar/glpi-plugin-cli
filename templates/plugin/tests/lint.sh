#!/usr/bin/env bash
# {{name}} — syntax check of every PHP file, plus (with a GLPI root as argument or in GLPI_ROOT) a load check of
# every class against GLPI's core classes: signature mismatches are fatal errors that only show when GLPI renders
# a page, so catch them here.
#   bash tests/lint.sh
#   bash tests/lint.sh /var/www/glpi
set -uo pipefail
cd "$(dirname "$0")/.."

bad=0
while IFS= read -r file; do
  if ! output=$(php -l "$file" 2>&1); then
    echo "$output"
    bad=1
  fi
done < <(find . -name '*.php' -not -path './vendor/*' -not -path './dist/*' -not -path './node_modules/*')
[ "$bad" -eq 0 ] && echo "php -l: ok"

root="${1:-${GLPI_ROOT:-}}"
if [ -n "$root" ]; then
  php tests/loadcheck.php "$root" || bad=1
fi
exit "$bad"
