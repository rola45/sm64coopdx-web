# SM64CoopDX Web — especificación inicial
Fecha: 2026-11-03. Estado: alcance de planificación derivado de la petición; sin implementación ni aceptación jugable.

## Objetivo
Ejecutar el motor real de SM64CoopDX en navegador con experiencia de acceso comparable a nfsu2.xyz: cargar, jugar, configurar controles y conservar partidas. El cooperativo online forma parte del objetivo completo, después de demostrar el port individual.

## Historias y aceptación
1. P1: Como jugador aporto mis archivos compatibles y arranco una partida real. Se valida el formato antes de iniciar; entrada inválida muestra error recuperable. Deben funcionar movimiento, salto, cámara, colisión, un nivel y audio activado mediante gesto del usuario.
2. P1: Guardo, cierro y vuelvo. Una recarga recupera el progreso; exportar y restaurar conserva los mismos bytes. Un fallo de cuota no se anuncia como guardado exitoso.
3. P1: Uso teclado y mando, pauso, cambio volumen y entro/salgo de pantalla completa. Pérdida de foco libera botones y evita movimiento atascado.
4. P2: Creo una sala privada y entro desde otro navegador. Dos jugadores comparten enemigos y eventos durante 20 minutos. Una desconexión muestra estado real y no corrompe el guardado.
5. P2: Desde móvil dispongo de controles táctiles y disposición apaisada; compatibilidad y rendimiento se aceptan solo con pruebas físicas posteriores.

## Requisitos
- FR01: ejecutar código del upstream, conservando créditos y documentando modificaciones; no sustituir por una recreación visual.
- FR02: assets aportados por el usuario. No incluir ROM, texturas, audio ni paquetes derivados en el repositorio público.
- FR03: indicador de carga con fases observables, error y reintento; nunca porcentaje simulado.
- FR04: persistir configuración y guardados localmente; exportar antes de reemplazar y validar importaciones.
- FR05: adaptar gráficos, audio, bucle y filesystem; compilar dependencias nativas al target wasm.
- FR06: transporte de salas web con límites y validación, sin afirmar compatibilidad con clientes nativos hasta comprobarla.
- FR07: controles de interfaz por teclado, foco visible, contraste WCAG AA, movimiento reducido, botones táctiles >=44 px.
- FR08: mods arbitrarios, Discord SDK, actualizador y exploración del filesystem del host fuera del MVP. Mantener Lua necesario para el juego, con bibliotecas inseguras desactivadas.
- FR09: no telemetría ni subida de archivos del juego en el flujo local.

## Medidas y alcance
Desktop primero: Chrome y Firefox actuales en macOS/Windows; Safari y móvil requieren validación independiente. Objetivo inicial de simulación: cadencia original sin acelerar física; presentación >=30 fps a 720p en un equipo de referencia que se registrará en el spike. Es un criterio por medir, no una promesa. Una sala inicial de 2–4 jugadores; sin cuentas, tienda, ranking público ni paridad completa de mods.

## Límites conocidos
No se han suministrado assets ni ejecutado compilaciones. El rendimiento, coste de hosting y compatibilidad del cooperativo son hipótesis a validar. La constitución existente es una plantilla sin ratificar; no impone políticas operativas.
