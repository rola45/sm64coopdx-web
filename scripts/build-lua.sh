#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
source .tools/emsdk/emsdk_env.sh >/dev/null 2>&1
mkdir -p build/lua
for source in .tools/lua-5.3.6/src/*.c; do
  case "$source" in */lua.c|*/luac.c) continue;; esac
  object="build/lua/$(basename "${source%.c}").o"
  if [[ ! -f "$object" || "$source" -nt "$object" ]]; then
    emcc -O2 -c "$source" -o "$object"
  fi
done
emar rcs build/lua/liblua53.a build/lua/*.o
