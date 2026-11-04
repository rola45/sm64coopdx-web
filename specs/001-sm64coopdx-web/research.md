# Investigación y decisiones — 2026-11-03
## Método y alcance
Referencia nfsu2.xyz inspeccionada mediante HTML público y README oficial de th0mk/nfsu2-web. Código SM64CoopDX inspeccionado en checkout temporal `/tmp/sm64coopdx-web-research`, commit `8cd6e5977d9f920d51ca71f2c61801d019ed79c6`. Investigación delegada según speckit-plan. No se compiló ni ejecutó el juego. REA no fue necesario: el código fuente permite examinar directamente las fronteras del port; no se afirma observación dinámica del sitio.

## 1. Motor y referencia
**Decision:** portar motor C/C++ existente a Emscripten/WebAssembly.
**Rationale:** la referencia usa recompilación x86 a C, WebAssembly y capa de APIs; SM64CoopDX ya proporciona fuentes. Copiar la experiencia de arranque/guardado es razonable; copiar su runtime Windows no aporta valor aquí.
**Alternatives considered:** emulación N64 (no conserva las extensiones de CoopDX), recreación Three.js (no es el mismo juego), streaming remoto (requiere instancia de juego por usuario).
Fuentes: https://nfsu2.xyz/ y https://github.com/th0mk/nfsu2-web/blob/main/README.md

## 2. Dependencias, bucles y gráficos
**Decision:** spike con SDL2/WebGL2, Lua 5.3 desde fuentes; desactivar Discord, actualizador, Mumble y CoopNet nativo inicialmente. Separar herramientas host del compilador wasm.
**Rationale:** Makefile no ofrece target Emscripten. Lua enlaza librerías nativas. pc_main.c y loading.c contienen bucles bloqueantes; convertir a estados/callback del navegador. thread.c usa pthreads y pthread_cancel; auditar eliminación de hilos de carga antes de optar por SharedArrayBuffer. gfx_opengl.c ofrece USE_GLES, candidato para adaptación, no compatibilidad web probada. Mantener simulación a 30 Hz e interpolación independiente.
**Alternatives considered:** WebGPU implica rehacer más renderer; pthreads desde inicio aumenta requisitos de despliegue. Elegir versión exacta de emsdk con primer build exitoso y registrarla; esta selección experimental es parte de M0.
Fuente base inmutable: https://github.com/coop-deluxe/sm64coopdx/tree/8cd6e5977d9f920d51ca71f2c61801d019ed79c6
Archivos: Makefile; src/pc/pc_main.c; src/pc/loading.c; src/pc/thread.c; src/pc/gfx/gfx_opengl.c.
Guía: https://emscripten.org/docs/porting/emscripten-runtime-environment.html

## 3. Assets y persistencia
**Decision:** selección local de ROM compatible y procesamiento local; filesystem virtual e IDBFS para guardados; exportación/importación con validación.
**Rationale:** pc_main.c/rom_checker.cpp requieren ROM vanilla US válida y el flujo bloquea mientras no se proporciona. Adaptar ese flujo a estado asíncrono de selección. No hay assets del usuario en este proyecto. La hidratación de FS precede al inicio; syncfs confirma persistencia. No confundir sm64.us.sha1 del resultado reconstruido con checksum del input.
**Alternatives considered:** ROM pública embebida, subida al servidor y precargar assets privados en bundle descartados. Extracción en navegador frente a preparación local: preferencia navegador; si herramientas de extracción no portan, usar preparación local privada como fallback explícito y documentar la limitación.
Fuentes: src/pc/rom_checker.cpp, src/pc/pc_main.c en commit fijado; https://emscripten.org/docs/api_reference/Filesystem-API.html

## 4. Cooperativo
**Decision:** fase separada con adaptador de transporte y relay WSS experimental; medir semántica y latencia antes de aceptarlo.
**Rationale:** src/pc/network/socket/socket.c usa SOCK_DGRAM/sendto/recvfrom y CoopNet depende de SDK nativo libjuice. Navegador no abre esos sockets directamente. El relay propuesto transporta paquetes del motor; no reemplaza simulación por posiciones visuales.
**Alternatives considered:** WebRTC DataChannel para canales no ordenados si WSS falla; proxy UDP para clientes nativos solo como fase posterior con investigación propia. No afirmar interoperabilidad con servidores actuales.
Fuente: src/pc/network/socket/socket.c en commit fijado; https://emscripten.org/docs/porting/networking.html

## 5. UX y orden de entrega
**Decision:** consola 3D de los 90, canvas dominante y configuración compacta, desktop primero.
**Rationale:** ui-ux-pro-max consultada con retro platformer game launcher playful accessible; se adapta su sugerencia retro al origen 3D del producto. Prioridad teclado, contraste, progreso real y foco. Móvil requiere prueba física después del spike desktop.
**Alternatives considered:** dashboard oscuro genérico y pixel art integral no corresponden al juego solicitado.

## 6. Estado de decisiones y gates
No quedan decisiones arquitectónicas sin alternativa definida. Sí quedan incertidumbres experimentales explícitas: build, extracción, dependencia de threads, rendimiento y semántica de red. Resolverlas requiere M0/M1/M4, no afirmar viabilidad demostrada. No hay constitución ratificada; la plantilla existente se conserva. El plan termina en diseño Phase 1, sin tareas de implementación generadas ni código de producto.
