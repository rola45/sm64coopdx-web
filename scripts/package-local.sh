#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

target=build/web
if [[ "${1:-}" == --pages ]]; then
  target=build/pages
elif [[ $# != 0 ]]; then
  echo 'Usage: scripts/package-local.sh [--pages]' >&2
  exit 2
fi

mkdir -p "$target"
cp web/index.html web/style.css web/app.js web/storage.js web/online.js "$target/"
cp vendor/sm64coopdx/build/us_pc/sm64coopdx.js vendor/sm64coopdx/build/us_pc/sm64coopdx.wasm \
  vendor/sm64coopdx/build/us_pc/sm64coopdx.data "$target/"

python3 - "$target" <<'PYTHON'
from html import escape
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

target = Path(sys.argv[1])
page = target / 'index.html'
contents = page.read_text()

def configure(name, value, scheme):
    if value:
        url = urlsplit(value)
        if url.scheme != scheme or not url.hostname or url.username or url.password or url.fragment:
            raise SystemExit(f'{name} requires a valid {scheme} URL')
    return re.sub(
        rf'(name="{name}" content=")[^"]*',
        lambda match: match[1] + escape(value, quote=True),
        contents,
    )

contents = configure('coop-relay', os.environ.get('COOP_RELAY_URL', ''), 'wss')
rom = os.environ.get('COOP_ROM_URL')
if target.name == 'pages' or rom is not None:
    contents = configure('rom-download-url', rom or '', 'https')
page.write_text(contents)
PYTHON

if [[ "$target" == build/pages ]]; then
  touch "$target/.nojekyll"
fi
printf 'Experimental package: %s\n' "$target"
