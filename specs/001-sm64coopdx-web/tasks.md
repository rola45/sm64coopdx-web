# Implementación por hitos
Estado actualizado durante la ejecución; no confundir compilación con aceptación jugable.

## M0 — Preparación
- [x] T001 Fijar upstream y SDK en `toolchain.lock.json`.
- [x] T002 Aislar fuentes, SDK y outputs mediante `.gitignore` y `scripts/bootstrap.py`.
- [x] T003 Compilar herramientas host (`reports/host-tools.log`).
- [x] T004 Validar ROM local USA sin modificar mediante `scripts/rom.py`; casos negativos en `tests/test_rom.py`.
- [x] T005 Compilar/ejecutar código matemático real y Lua en WASM mediante `scripts/probe.sh`.
- [ ] T006 Completar inventario de licencias por componente antes de distribuir.

## M1 — Motor individual
- [x] T007 Crear overlay `engine/web.mk` sin modificar el Makefile original.
- [x] T008 Guardar adaptaciones de plataforma en `engine/patches/0001-web-platform.patch` y aplicación idempotente.
- [x] T009 Enlazar el motor completo en WASM.
- [x] T010 Verificar arranque en navegador con selección local de ROM en `web/`.
- [ ] T011 Validar salto, colisiones y audio; registrar métricas y fallos. Exterior, movimiento y seguimiento de cámara confirmados.
- [ ] T012 Verificar mando físico y liberación de teclas al perder foco.

## M2 — Persistencia
- [x] T013 Hidratar archivos permitidos desde IndexedDB antes del motor; excluir la ROM.
- [ ] T014 Confirmar guardados asíncronos, export/import y errores de cuota.
- [ ] T015 Probar cierre/reapertura y recuperación de progreso real. Restauración de configuración confirmada en Chromium.

## M3 — Launcher
- [ ] T016 Completar estados de carga, pausa y configuración.
- [ ] T017 Verificar desktop/móvil, teclado y movimiento reducido.

## M4/M5 — Cooperativo y entrega
- [ ] T018 Auditar paquetes/canales y definir layout del adaptador web.
- [ ] T019 Implementar relay, validación, límites y salas privadas.
- [ ] T020 Aceptar sincronización con dos navegadores durante 20 minutos y desconexión.
- [ ] T021 Separar outputs redistribuibles de contenido privado, verificar licencias y despliegue.

Dependencias: M0 → M1 → M2/M3 → M4 → M5. El objetivo inmediato es T009–T011; no construir cuentas ni salas simuladas.
