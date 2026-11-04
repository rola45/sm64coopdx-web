# Dependencias y alcance local
Revisión 2026-11-03.

| Componente | Selección | Estado |
|---|---|---|
| SM64CoopDX | 8cd6e5977d9f920d51ca71f2c61801d019ed79c6 | Fuentes fijadas; port en desarrollo; raíz sin LICENSE general detectada. No inferir permiso de redistribución global. |
| Emscripten | 4.0.23 | Instalación local completada; probes ejecutados. |
| SDL2 | 2.32.8, port Emscripten | Compilación WASM completada, pendiente aceptación de render/audio. |
| Lua | 5.3.6, archivo oficial con SHA-256 fijado | Compilado a WASM; prueba aritmética ejecutada; bibliotecas host inseguras no abiertas. |
| zlib | 1.3.1, port Emscripten | Compilado para WASM. |
| GNU Make | 4.x (`gmake`) | Requerido; el make 3.81 de macOS no ejecuta correctamente las asignaciones `!=` del upstream. |
| Discord / CoopNet / actualizador / Mumble | Desactivados o shim web | No ofrecidos en este hito. |
| ROM USA | Entrada aportada por usuario | Formato/tamaño/hash compatibles confirmados. No se ha modificado el original. |

Los binarios locales pueden contener tablas/datos de upstream. Mantener `vendor/`, `build/`, `private/` y SDK fuera de git y no publicar este paquete experimental. La matriz de licencias debe completarse por componente antes de distribuir, incluidos archivos con avisos internos (SDL, Lua, zlib, miniz, miniaudio, stb, herramientas). Esta nota es un inventario de trabajo, no una autorización legal.
