# SM64CoopDX Web
Port web experimental del motor real de SM64CoopDX. Se compila y ejecuta localmente; la primera partida individual se verificó en Chromium.

Diseño y alcance: [plan](specs/001-sm64coopdx-web/plan.md).

## Preparación reproducible
```sh
python3 scripts/bootstrap.py
gmake -C vendor/sm64coopdx/tools -j4
bash scripts/probe.sh
python3 -m unittest discover -s tests -v
bash scripts/build-engine.sh --rom '/ruta/a/tu/baserom.us.z64'
bash scripts/package-local.sh
python3 scripts/serve-local.py --rom '/ruta/a/tu/baserom.us.z64'
```

El bootstrap fija fuentes de upstream y Emscripten en `toolchain.lock.json`, instala SDK exclusivamente en `.tools/` y verifica SHA-256 del paquete Lua. No cambia perfiles de shell. Requiere Git, Python >=3.12, herramientas de compilación host, GNU Make >=4 y Node. Las pruebas WASM ejecutan matemática del motor y Lua; **no prueban gráficos, audio, gameplay ni multijugador**.

La ROM USA sin modificar debe aportarla el usuario. Se valida localmente por formato, tamaño y MD5 exacto de `rom_checker.cpp`; no se copia, sube ni rastrea en git. `private/`, herramientas descargadas, vendor y builds están excluidos. No hay assets Nintendo distribuidos por este proyecto.

Abre http://127.0.0.1:8765 y pulsa **Jugar**. El servidor lee la ROM directamente desde la ruta configurada y la entrega al navegador por loopback. En un servidor estático sin esa ruta, el launcher muestra el selector de archivo. El build prepara tablas de audio para punteros de 32 bits y guarda sus archivos derivados localmente. El paquete no incluye el archivo ROM y aún no está preparado para redistribución pública.

Consulta [progreso técnico](reports/progress.md) para distinguir la compilación, el arranque y las pruebas jugables.

El botón **Jugar** arranca una partida. Los controles predeterminados incluyen **WASD** para moverte, **L** para saltar y **Espacio** para Start. La configuración se conserva al recargar; la recuperación de progreso real todavía está pendiente de prueba.

Para repetir la prueba de Chromium con el servidor local activo:

```sh
npm install --prefix .tools/qa playwright@1.64.1
PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" .tools/qa/node_modules/.bin/playwright install chromium
PLAYWRIGHT_BROWSERS_PATH="$PWD/.tools/browsers" node scripts/browser-smoke.cjs '/ruta/a/tu/baserom.us.z64'
```

Para usar una descarga remota, pon la URL HTTPS directa del archivo .z64 en el atributo `content` de `rom-download-url` en `web/index.html` y ejecuta `bash scripts/package-local.sh`. Si el archivo está en otro dominio, ese servidor debe permitir mediante CORS el origen de la página. Al pulsar **Jugar**, el launcher descarga y valida la ROM y arranca el motor.

Si Chromium bloquea la URL remota por CORS, ejecuta el servidor local con `--rom-url` y la misma URL HTTPS configurada en el launcher. El servidor descarga y verifica el archivo al pulsar **Jugar**. Esta ruta funciona en loopback.

## Multijugador local

Instala e inicia el relay en otra terminal mientras el servidor de la página sigue activo.

```sh
npm ci --prefix relay
npm start --prefix relay
```

Abre la página local en dos perfiles de navegador y pulsa **Jugar** en ambos. El primero aloja la partida pública y el segundo se incorpora automáticamente. En el menú **Online**, **Invitar amigos** abre una sala propia y muestra su enlace. **Jugar solo** cancela la espera y arranca una sesión local. Cambiar de sala inicia otra sesión del juego.

Si la sala está llena, el navegador reintenta la entrada cada cinco segundos mientras juegas solo. Una interrupción breve intenta recuperar la misma conexión. Si el anfitrión sale, termina esa partida y puedes volver a entrar desde el menú.

```sh
node --test relay/server.test.cjs
node scripts/browser-online.cjs '/ruta/a/tu/baserom.us.z64'
```

## Probar desde GitHub Pages

Genera `build/pages` y usa su contenido como raíz del sitio. Configura `COOP_RELAY_URL` con el endpoint WSS del relay y, para descarga automática, `COOP_ROM_URL` con una URL HTTPS directa cuyo servidor permita el origen de Pages mediante CORS.

```sh
COOP_RELAY_URL=wss://relay.example/coop COOP_ROM_URL=https://files.example/game.z64 bash scripts/package-local.sh --pages
```

Ejecuta el relay detrás de un proxy HTTPS con soporte para WebSocket en `/coop`. El relay escucha en `127.0.0.1:8767` por defecto. Define `BIND` y `PORT` según el despliegue. Configura `ALLOWED_ORIGINS` con el origen exacto de la página, por ejemplo `https://usuario.github.io`. El origen limita qué páginas web pueden abrir la conexión. Para limitar quién puede acceder, aplica el control de acceso en el despliegue.

Sin URL de ROM configurada, el paquete de Pages muestra el selector de archivo. El proxy Python de desarrollo solo escucha en loopback. Mantén la ROM en el alojamiento privado que corresponda.

En móviles, **Jugar** solicita pantalla completa y orientación horizontal. Si el navegador limita alguna de estas funciones, los controles táctiles siguen disponibles y puedes girar el dispositivo manualmente.
