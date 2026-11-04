# Implementation Plan: SM64CoopDX Web
**Branch**: `codex/001-sm64coopdx-web` | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

## Summary
Port incremental del código C/C++ de SM64CoopDX a WebAssembly mediante Emscripten. Primero una prueba jugable individual; después persistencia, launcher y cooperativo entre navegadores. No requiere recompilar x86 como la referencia NFS: ya existe código fuente del motor.

## Technical Context
**Language/Version**: C/C++ del upstream, Lua 5.3, TypeScript; fijar versión exacta de emsdk y commit upstream en el primer spike reproducible.
**Primary Dependencies**: Emscripten, SDL2 compilado para wasm, WebGL2, Web Audio, Lua compilado desde fuentes; Vite para launcher; Node.js LTS para relay propuesto.
**Storage**: filesystem virtual para ejecución, IDBFS/IndexedDB para saves y preferencias. Assets privados separados del bundle público.
**Testing**: smoke de build wasm, pruebas de contratos y validación de importaciones, Playwright para launcher y dos contextos de red; sesiones manuales de juego y mandos.
**Target Platform**: navegador desktop con WebAssembly y WebGL2; HTTPS en despliegue, localhost en desarrollo.
**Project Type**: port de videojuego + launcher web + relay opcional.
**Performance Goals**: preservar paso temporal original; >=30 fps/720p en hardware declarado; cooperativo 20 min sin divergencia visible de eventos en prueba de aceptación.
**Constraints**: no sockets UDP directos del navegador; ninguna librería nativa precompilada puede enlazarse al wasm; sin distribución pública de assets; sin promesas de paridad nativa.
**Scale/Scope**: 1 jugador en M1, salas privadas 2–4 jugadores en M4; móvil después.

## Constitution Check
La constitución `.specify/memory/constitution.md` contiene solo placeholders. Resultado: no hay principios ratificados que evaluar; no se declara conformidad constitucional ficticia ni se modifica esa plantilla. Para este diseño los requisitos verificables son FR01–FR09 de spec.md y las instrucciones de interfaz del usuario.
Preinvestigación: PASS de alcance y preservación: repositorio sin código de producto, cambios solo documentales. Postdiseño: PASS de FR01–FR09 a nivel de diseño, pendiente evidencia de implementación. La ratificación de una constitución queda pendiente como gobernanza, no bloquea esta investigación. Cualquier incompatibilidad real del spike bloquea el siguiente hito y obliga a revisar el plan.

## Fases de implementación propuestas
- M0 — fijar upstream y toolchain, auditar licencias por componente, obtener input privado compatible, verificar extracción y compilar herramientas host separadas del target wasm. Resultado: matriz de dependencias y build log. No iniciar UI extensa antes de probar motor.
- M1 — compilar Lua/SDL2 y motor, sustituir bucle bloqueante, desactivar integraciones de escritorio, portar gráficos/audio/input. Salida exigida: nivel real jugable con movimiento, cámara y sonido. Si fracasa, registrar causa y revisar arquitectura.
- M2 — montar almacenamiento antes de arrancar; sincronizar guardados al confirmar cambios, recuperar tras recarga y probar export/import y cuota. Nunca depender exclusivamente de beforeunload.
- M3 — launcher accesible con carga privada, diagnóstico de capacidades, configuración, pausa, fullscreen, teclado/mando. Adaptación móvil visual; aceptación táctil independiente.
- M4 — transporte web en la abstracción existente: prototipo de relay WSS orientado a paquetes, con semántica de fiabilidad/orden explícita. Medir head-of-line; evaluar WebRTC DataChannel si WSS no cumple. No asumir que reemplazar UDP por WebSocket basta.
- M5 — validar dos clientes, desconexión y sincronización; empaquetar sin assets, verificar HTTPS/MIME/cache y ejecutar revisión de licencias antes de publicar.

## Project Structure
Documentación actual:
```text
specs/001-sm64coopdx-web/
  spec.md
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/runtime.md
  contracts/network.md
  contracts/ui.md
```
Estructura propuesta, todavía no creada:
```text
engine/                 # upstream fijado y adaptaciones web
web/src/                # launcher TypeScript y puente al motor
web/public/runtime/     # js/wasm públicos sin assets privados
server/                 # relay WSS, incorporado en M4
scripts/                # build reproducible y servidor local
private/                # entrada y outputs derivados excluidos de git
tests/                 # contratos, persistencia y escenarios browser
```
**Structure Decision**: preservar motor y red existentes; puente pequeño de plataforma. Sin motor paralelo Three.js, sin migración a Metal/WebGPU en el MVP.

## Dirección visual
Lienzo de juego protagonista, fondo marfil, texto azul tinta, acentos rojo y azul, amarillo solo decorativo; formas redondeadas inspiradas en consola 3D de los 90. Tipografía de sistema para lectura; guiños retro solo en títulos. Launcher compacto con Jugar, Partidas, Controles y Ajustes, sin dashboard administrativo. La búsqueda ui-ux-pro-max sugirió estilo pixel; se adapta al contexto 3D de SM64 evitando tipografía pixel para cuerpo. Véase contracts/ui.md.

## Complexity Tracking
Sin violaciones de principios ratificados. Relay justificado por ausencia de UDP web; queda fuera del primer port jugable. Pthreads, WebGPU y cuentas se evitan hasta que evidencia los haga necesarios.
