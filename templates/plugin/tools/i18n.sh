#!/usr/bin/env bash
# {{name}} — refreshes locales/{{key}}.pot from the PHP sources and compiles every locales/*.po into .mo.
# Needs gettext (xgettext, msgmerge, msgfmt). Only strings with the '{{key}}' domain are extracted; GLPI's own
# strings (one-argument __('…')) come from GLPI's translations.
set -euo pipefail
cd "$(dirname "$0")/.."

list=$(mktemp)
find setup.php hook.php src front ajax -name '*.php' 2>/dev/null | sort > "$list"
xgettext --from-code=UTF-8 --language=PHP --add-comments=TRANS --sort-by-file \
  --keyword=__:1,2t --keyword=_n:1,2,4t --keyword=_x:1c,2,3t --keyword=_nx:1c,2,3,5t --keyword=_sx:1c,2,3t \
  --package-name='{{name}}' --copyright-holder='{{author}}' --msgid-bugs-address='{{repo}}/issues' \
  -o "locales/{{key}}.pot" -f "$list"
rm -f "$list"

for po in locales/*.po; do
  [ -e "$po" ] || continue
  msgmerge --quiet --update --backup=none "$po" "locales/{{key}}.pot"
  msgfmt -o "${po%.po}.mo" "$po"
  echo "compiled ${po%.po}.mo"
done
echo "locales/{{key}}.pot updated"
