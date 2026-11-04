# Guía de validación prevista
## Estado actual
El build experimental produce un motor WebAssembly y un launcher local. Sigue los comandos de README.md: bootstrap, build con `--rom`, empaquetado y servidor de loopback. La ROM se selecciona en la página y se valida con el motor. El menú web ofrece Play solo; el cooperativo sigue pendiente.

## Prerrequisitos para M0
Git, Python 3, compilador host y herramientas exigidas por upstream; emsdk fijado; Node.js LTS para launcher posterior; archivos compatibles del juego proporcionados por el usuario y mantenidos fuera de git. Verificar hashes contra los ficheros de la revisión upstream: no inferir el hash de la ROM de un checksum del binario reconstruido.

## Validación al implementar
1. Registrar commit exacto, SDK, navegador, SO y hardware. Construir herramientas para host y dependencias para wasm por separado. Conservar build log sin datos privados.
2. Ejecutar los comandos de build y servidor localhost documentados en README.md. Confirmar respuestas js/wasm correctas y que no se sirve private/.
3. Cargar archivo inválido: error recuperable. Cargar input compatible: ready solo tras FS hidratado. Jugar: nivel real, movimiento, salto, cámara, colisión y sonido tras gesto. Capturar evidencia de gameplay y métricas de 10 min.
4. Obtener progreso real, guardar, esperar persistencia, cerrar/abrir navegador: mismo progreso. Exportar/restaurar y comparar digest. Cuota agotada: error visible sin pérdida de copia anterior.
5. Recorrer menús por teclado; comprobar pausa/foco, fullscreen, pérdida de foco y mando físico. Revisar viewport desktop, móvil y movimiento reducido. Diferenciar simulación de viewport de validación física móvil.
6. En M4 iniciar relay con HTTPS/WSS; dos contextos independientes crean/se unen y juegan 20 min. Validar enemigo y evento compartidos, capacidad, token inválido, versión incompatible, timeout y cierre por host ausente.
7. Antes de despliegue: revisar licencias/créditos y paquetes públicos sin assets; validar cache busting, MIME wasm y aislamiento si hay threads. Comprobar todas las URLs reales tras publicar.

## Evidencia exigida
Build exitoso no demuestra gameplay; conexión WSS no demuestra sincronización; Playwright no demuestra respuesta de mando físico. Registrar cada nivel de evidencia separado, con fallos y limitaciones.
