# Progreso técnico

## Evidencia confirmada
- Upstream fijado: `8cd6e5977d9f920d51ca71f2c61801d019ed79c6`.
- Emscripten 4.0.23 instalado solo en `.tools/`.
- Herramientas host completas compiladas en macOS ARM64.
- ROM del usuario validada en lectura: USA, 8 MiB, hash compatible con `rom_checker.cpp`.
- Tres pruebas negativas del validador y dos pruebas de formato de audio aprobadas.
- Matemáticas reales de `src/engine/math_util.c` ejecutadas como WASM.
- Lua 5.3.6 compilado y ejecutado como WASM; aritmética correcta y bibliotecas IO no abiertas en el probe.
- Primer enlace del motor completo completado: 548 objetos y WASM generado. Empaquetado modular JS/WASM validado en Chromium.

- Render real del castillo, Mario y menús confirmado en Chromium. Corregidos los shaders de escritorio y las conversiones entero/flotante de fragmentos.
- Datos de audio regenerados para punteros de 32 bits; el motor superó la carga inicial de bancos.
- Menú web Play solo visible; transporte local usa la simulación original sin abrir UDP.
- Launcher revisado a 1440 px y 375 px sin desbordamiento horizontal en móvil.

- En Play solo, Chromium mostró la introducción y el exterior jugable con HUD. La entrada W movió a Mario y la cámara siguió el movimiento. Evidencia: solo-smoke.png y solo-input.png.
- IndexedDB guarda únicamente la configuración y el archivo de partida cuando existen. La prueba en Chromium confirmó que la configuración producida por el motor se restaura tras recargar y que la ROM no figura entre las claves persistidas.

## Todavía no aceptado
Sesión larga, salto y colisiones bajo prueba específica, audio audible, persistencia de una estrella obtenida, exportación/restauración de partidas, mando físico, móvil real y cooperativo. Un build exitoso no certifica estos puntos.

Los logs detallados de esta máquina están en `reports/*.log` y se excluyen de git. No hay despliegue público.
