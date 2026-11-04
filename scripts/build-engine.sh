#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
source .tools/emsdk/emsdk_env.sh >/dev/null 2>&1
# This experimental target is expected to expose remaining platform errors.
# It is not a release build; successful linking is not gameplay acceptance.
MAKE_BIN="${MAKE_BIN:-gmake}"
bash scripts/build-lua.sh
python3 scripts/apply-patches.py
if [[ "${1:-}" == "--rom" ]]; then
  python3 scripts/prepare-audio.py "$2"
  shift 2
fi
if [[ ! -f private/audio32/manifest.json || ! -f vendor/sm64coopdx/build/us_pc/sound/sound_data.ctl.inc.c ]]; then
  echo 'Prepare target-specific audio first: bash scripts/build-engine.sh --rom /path/to/USA.z64' >&2
  exit 1
fi
exec "$MAKE_BIN" -C vendor/sm64coopdx -f "$ROOT/engine/web.mk" -j4 EXE=build/us_pc/sm64coopdx.js WEB_LUA_ARCHIVE="$ROOT/build/lua/liblua53.a" "$@"
