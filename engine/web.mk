# Invoke from vendor/sm64coopdx; upstream stays unmodified.
HOST_OS := Web
OSX_BUILD := 0
DISCORD_SDK := 0
COOPNET := 0
UPDATER := 0
USE_APP := 0
COMPILER := clang
OPT_LEVEL := 2
DEBUG_INFO_LEVEL := 0
BACKEND_CFLAGS := -sUSE_SDL=2 -sUSE_ZLIB=1
include Makefile
CC := emcc
CXX := em++
LD := em++
CC_CHECK := emcc
CPP := emcc -E -x c
AR := emar
EXTRA_CPP_FLAGS += -std=c++17
CFLAGS += -DUSE_GLES=1
CC_CHECK_CFLAGS += -DUSE_GLES=1
# Native libraries are deliberately replaced, never linked into WASM.
LDFLAGS := -O2 -g2 --emit-symbol-map -sASSERTIONS=1 -sUSE_SDL=2 -sUSE_ZLIB=1 -sMIN_WEBGL_VERSION=2 -sMAX_WEBGL_VERSION=2 \
  -sALLOW_MEMORY_GROWTH=1 -sINITIAL_MEMORY=134217728 -sSTACK_SIZE=4194304 \
  -sFORCE_FILESYSTEM=1 -sEXIT_RUNTIME=0 -sMODULARIZE=1 -sEXPORT_NAME=createSM64 \
  -sEXPORTED_RUNTIME_METHODS=FS,callMain -sINVOKE_RUN=0 -lm $(WEB_LUA_ARCHIVE)

LDFLAGS += --preload-file lang@/resources/lang --preload-file palettes@/resources/palettes \
  --preload-file dynos/packs@/resources/dynos/packs
