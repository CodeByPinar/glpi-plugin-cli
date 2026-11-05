"""{{name}} — release archives: dist/{{key}}-<version>.tgz, .zip and .sha256 (plugin files only: no tests, docs, tools).

Usage:
    python tools/package.py            build the archives into dist/
    python tools/package.py --notes    print the CHANGELOG section of the current version (used as release notes)
"""
import hashlib
import os
import re
import sys
import tarfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = '{{key}}'
INCLUDE = ['setup.php', 'hook.php', 'plugin.xml', 'LICENSE', 'README.md', 'CHANGELOG.md',
           'src', 'front', 'ajax', 'public', 'locales', 'templates']

with open(os.path.join(ROOT, 'setup.php'), encoding='utf-8') as fh:
    version = re.search(r"PLUGIN_{{KEY}}_VERSION',\s*'([^']+)'", fh.read()).group(1)

if '--notes' in sys.argv:
    with open(os.path.join(ROOT, 'CHANGELOG.md'), encoding='utf-8') as fh:
        log = fh.read()
    match = re.search(r'^## \[' + re.escape(version) + r'\][^\n]*\n(.*?)(?=^## \[|\Z)', log, re.S | re.M)
    print((match.group(1).strip() if match else '') + f"""

### Install
Extract `{KEY}-{version}.tgz` into `glpi/plugins/` and enable it in *Setup → Plugins*
(console: `{{consolePrefix}}plugin:install {KEY} -u glpi`, then `{{consolePrefix}}plugin:activate {KEY}`).""")
    sys.exit(0)

files = []
for item in INCLUDE:
    path = os.path.join(ROOT, item)
    if os.path.isfile(path):
        files.append(path)
    for base, _dirs, names in os.walk(path):
        files += [os.path.join(base, name) for name in names]
files = sorted(set(files))

dist = os.path.join(ROOT, 'dist')
os.makedirs(dist, exist_ok=True)
name = f'{KEY}-{version}'


def arcname(path):
    return KEY + '/' + os.path.relpath(path, ROOT).replace(os.sep, '/')


with tarfile.open(os.path.join(dist, name + '.tgz'), 'w:gz') as tar:
    for path in files:
        info = tar.gettarinfo(path, arcname(path))
        info.uid = info.gid = 0
        info.uname = info.gname = 'root'
        info.mode = 0o644
        with open(path, 'rb') as fh:
            tar.addfile(info, fh)

with zipfile.ZipFile(os.path.join(dist, name + '.zip'), 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        archive.write(path, arcname(path))

with open(os.path.join(dist, name + '.sha256'), 'w', newline='\n') as fh:
    for ext in ('.tgz', '.zip'):
        with open(os.path.join(dist, name + ext), 'rb') as built:
            fh.write(hashlib.sha256(built.read()).hexdigest() + f'  {name}{ext}\n')

print(name, len(files), 'files ->', dist)
