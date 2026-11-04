#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
if [[ ! -f .tools/emsdk/emsdk_env.sh ]]; then
  echo 'Run python3 scripts/bootstrap.py first.' >&2
  exit 1
fi
source .tools/emsdk/emsdk_env.sh >/dev/null 2>&1
mkdir -p build/probes
emcc --version
# Compile actual engine math, using upstream headers, with dead-code removal at link.
emcc -O2 -sUSE_SDL=2 -DAVOID_UB -DNON_MATCHING -Ivendor/sm64coopdx/include -Ivendor/sm64coopdx/src \
  -Ivendor/sm64coopdx/src/pc -Ivendor/sm64coopdx -Ivendor/sm64coopdx/lib/lua/include -fno-strict-aliasing \
  vendor/sm64coopdx/src/engine/math_util.c probes/math.c -lm \
  -sENVIRONMENT=node -o build/probes/math.cjs
node build/probes/math.cjs
LUA="$ROOT/.tools/lua-5.3.6/src"
SOURCES=()
for file in "$LUA"/*.c; do
  case "$file" in */lua.c|*/luac.c) ;; *) SOURCES+=("$file");; esac
done
emcc -O2 -I"$LUA" probes/lua.c "${SOURCES[@]}" -lm \
  -sENVIRONMENT=node -o build/probes/lua.cjs
node build/probes/lua.cjs
