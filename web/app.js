'use strict';
const input = document.querySelector('#rom');
const start = document.querySelector('#start');
const status = document.querySelector('#status');
const log = document.querySelector('#log');
const canvas = document.querySelector('#canvas');
const onlineMenu = document.querySelector('#online-menu');
const onlinePanel = document.querySelector('#online-panel');
const onlineStatus = document.querySelector('#online-status');
const publicRoom = document.querySelector('#public-room');
const inviteRoom = document.querySelector('#invite-room');
const soloRoom = document.querySelector('#solo-room');
const inviteLabel = document.querySelector('#invite-label');
const inviteLink = document.querySelector('#invite-link');
let roomRetry;
let changingRoom = false;

function reportOnline(text) {
  onlineStatus.textContent = text;
  onlineMenu.setAttribute('aria-label', 'Online. ' + text);
  if (text.includes('Reconectando')) onlineMenu.textContent = 'Reconectando…';
  else if (text.startsWith('Sala llena')) onlineMenu.textContent = 'En espera';
  else onlineMenu.textContent = 'Online';
  if (/perdió la conexión|anfitrión salió/.test(text)) {
    onlinePanel.hidden = false;
    onlineMenu.setAttribute('aria-expanded', 'true');
  }
}

function roomStatus(room) {
  return room === 'public' ? 'Sala pública' : 'Sala de amigos';
}

function waitForRoom(room) {
  roomRetry = setTimeout(() => void changeRoom(room, true), 5000);
  reportOnline('Sala llena · Jugando solo mientras se libera un lugar');
}

async function changeRoom(room, waiting = false) {
  clearTimeout(roomRetry);
  if (changingRoom) return;
  changingRoom = true;
  const previous = runtime.coopTransport;
  if (room && previous?.room === room && previous.connected) {
    changingRoom = false;
    reportOnline(roomStatus(room));
    return;
  }
  let transport;
  const buttons = [publicRoom, inviteRoom, soloRoom];
  for (const button of buttons) button.disabled = true;
  inviteLabel.hidden = true;
  try {
    if (room) {
      if (!waiting) reportOnline('Conectando…');
      transport = await connectCoop(room, reportOnline);
    }
    runtime._web_leave_session();
    previous?.close();
    runtime.coopTransport = transport;
    runtime._web_change_session(transport?.id || 0);
    const url = new URL(location.href);
    if (room && room !== 'public') url.searchParams.set('room', room);
    else url.searchParams.delete('room');
    history.replaceState(null, '', url);
    reportOnline(room ? roomStatus(room) : 'Jugando solo');
    if (room && room !== 'public') {
      inviteLink.value = url.href;
      inviteLabel.hidden = false;
      await navigator.clipboard?.writeText(url.href).catch(() => {});
    }
  } catch (error) {
    if (error.message === 'Sala llena' && !previous?.connected) waitForRoom(room);
    else reportOnline(error.message);
  } finally {
    changingRoom = false;
    for (const button of buttons) button.disabled = false;
  }
}

onlineMenu.addEventListener('click', () => {
  onlinePanel.hidden = !onlinePanel.hidden;
  onlineMenu.setAttribute('aria-expanded', String(!onlinePanel.hidden));
});
onlinePanel.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  event.stopPropagation();
  onlinePanel.hidden = true;
  onlineMenu.setAttribute('aria-expanded', 'false');
  onlineMenu.focus();
});
publicRoom.addEventListener('click', () => void changeRoom('public'));
inviteRoom.addEventListener('click', () => {
  const current = runtime.coopTransport?.room;
  if (runtime.coopTransport?.connected && current !== 'public') {
    inviteLink.value = location.href;
    inviteLabel.hidden = false;
    void navigator.clipboard?.writeText(inviteLink.value).catch(() => {});
    return;
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const room = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  void changeRoom(room);
});
soloRoom.addEventListener('click', () => void changeRoom());
window.addEventListener('pagehide', event => {
  if (!event.persisted) runtime?.coopTransport?.close();
});

let active = false;
let runtime;
let gameStorage;
let localRom = false;
const romBytes = 8 * 1024 * 1024;
const configuredRom = document.querySelector('meta[name="rom-download-url"]').content.trim();
let downloadUrl;
if (configuredRom) {
  try {
    const url = new URL(configuredRom);
    if (url.protocol !== 'https:' || url.username || url.password) throw Error();
    downloadUrl = url;
    start.disabled = false;
    document.querySelector('#source-note').textContent = 'Puedes descargar la ROM al jugar o elegir tu archivo.';
    status.textContent = 'Listo para jugar';
  } catch {
    status.textContent = 'El enlace de descarga debe ser una URL HTTPS válida.';
  }
}

if (!downloadUrl) fetch('local-rom.z64', {method: 'HEAD', cache: 'no-store'}).then(response => {
  if (!response.ok || response.headers.get('content-type') !== 'application/octet-stream') return;
  localRom = true;
  if (active || input.files.length) return;
  input.hidden = true;
  document.querySelector('#rom-label').hidden = true;
  document.querySelector('#source-note').textContent = 'Juego disponible en este equipo.';
  status.textContent = 'Listo para jugar';
  start.disabled = false;
}).catch(() => {});
let audioContext;
const enableAudio = document.querySelector('#enable-audio');

function updateAudioControl() {
  enableAudio.hidden = !active || !audioContext || audioContext.state === 'running';
}

function resumeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    if (!audioContext) {
      audioContext = new AudioContextClass();
      audioContext.addEventListener('statechange', updateAudioControl);
    }
    audioContext.resume().then(updateAudioControl, error => {
      message(error.message);
      updateAudioControl();
    });
  } catch (error) {
    message(error.message);
  }
}
enableAudio.addEventListener('click', resumeAudio);
const saveStatus = document.querySelector('#save-status');
const saveNow = document.querySelector('#save-now');

async function flushSaves(manual = false) {
  try {
    if (await gameStorage.flush()) saveStatus.textContent = 'Cambios guardados en este navegador.';
    else if (manual) saveStatus.textContent = 'No hay cambios nuevos para guardar.';
  } catch (error) {
    saveStatus.textContent = 'No se pudieron guardar los cambios. Reintenta antes de cerrar.';
    message(error.message);
  }
}
saveNow.addEventListener('click', () => flushSaves(true));
function message(text) {
  log.textContent = (log.textContent + '\n' + text).slice(-16000);
}
input.addEventListener('change', () => {
  start.disabled = active || (!localRom && !downloadUrl && !input.files.length);
});
start.addEventListener('click', async () => {
  if (active) return;
  start.disabled = true;
  const file = input.files[0];
  const remote = !file && downloadUrl;
  try {
    if (!file && !localRom && !remote) throw Error('Selecciona una ROM USA en formato .z64.');
    if (file && file.size !== romBytes) throw Error('La ROM USA original debe tener 8 MiB.');
    resumeAudio();
    if (matchMedia('(any-pointer: coarse)').matches && !document.fullscreenElement) {
      void enterFullscreen();
    }

    let data;
    if (file) {
      data = new Uint8Array(await file.arrayBuffer());
    } else {
      status.textContent = remote ? 'Descargando ROM…' : 'Leyendo ROM local…';
      const proxy = remote && await fetch('download-rom.z64', {method: 'HEAD', cache: 'no-store'})
        .then(result => result.ok && result.headers.get('content-type') === 'application/octet-stream')
        .catch(() => false);
      const response = await fetch(proxy ? 'download-rom.z64' : remote || 'local-rom.z64', {
        cache: 'no-store',
        ...(remote ? {credentials: 'omit', referrerPolicy: 'no-referrer'} : {}),
      }).catch(() => {
        throw Error(remote ? 'No se pudo acceder al enlace. Comprueba que permita descargas desde esta página.' : 'No se pudo leer la ROM local.');
      });
      if (!response.ok) throw Error(`No se pudo descargar la ROM (HTTP ${response.status}).`);
      const reader = response.body.getReader();
      data = new Uint8Array(romBytes);
      let offset = 0;
      let finished = false;
      try {
        while (true) {
          const {done, value} = await reader.read();
          if (done) {
            finished = true;
            break;
          }
          if (value.length > romBytes - offset) throw Error('La ROM USA original debe tener 8 MiB.');
          data.set(value, offset);
          offset += value.length;
        }
      } finally {
        if (!finished) await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (offset !== romBytes) throw Error('La descarga está incompleta. La ROM USA debe tener 8 MiB.');
    }
    if (data.slice(0, 4).join(',') !== '128,55,18,64') throw Error('El archivo debe estar en formato big-endian .z64.');
    if (typeof createSM64 !== 'function') throw Error('No se encontró el motor compilado. Revisa el build local.');
    status.textContent = 'Preparando WebAssembly…';
    active = true;
    const game = runtime ||= await createSM64({
      canvas,
      SDL2: audioContext ? {audioContext} : undefined,
      print: message,
      printErr: message,
      onGameExit: async () => {
        clearTimeout(roomRetry);
        runtime?.coopTransport?.close();
        document.querySelector('#placeholder').hidden = false;
        document.querySelector('#game-controls').hidden = true;
        document.querySelector('#touch-controls').hidden = true;
        status.textContent = 'Cerrando el juego…';
        if (gameStorage) {
          // Let any periodic write finish, then flush the final configuration.
          await flushSaves();
          await flushSaves();
        }
        window.location.reload();
      },
      onAbort: reason => {
        clearTimeout(roomRetry);
        runtime?.coopTransport?.close();
        document.querySelector('#placeholder').hidden = false;
        document.querySelector('#game-controls').hidden = true;
        document.querySelector('#touch-controls').hidden = true;
        status.textContent = 'El motor se detuvo. Consulta el registro y recarga para reintentar.';
        message(String(reason));
      },
    });
    game.FS.mkdirTree('/user');
    game.FS.writeFile('/user/baserom.us.z64', data);
    if (!game._web_validate_rom()) {
      active = false;
      throw Error('El hash no coincide con la ROM USA original. Selecciona otro archivo.');
    }
    try {
      gameStorage = await openGameStorage(game.FS);
    } catch (error) {
      saveStatus.textContent = 'Almacenamiento no disponible. Esta sesión será temporal.';
      message(error.message);
    }
    status.textContent = 'Arrancando el motor…';
    const args = ['--savepath', '/user', '--width', '960', '--height', '540', '--playercount', '16', '--disable-mods'];
    if (relayEndpoint) {
      status.textContent = 'Entrando a la partida…';
      try {
        game.coopTransport = await connectCoop(defaultRoom, reportOnline);
        reportOnline(roomStatus(defaultRoom));
      } catch (error) {
        if (error.message === 'Sala llena') waitForRoom(defaultRoom);
        else reportOnline(error.message + ' · Jugando solo');
      }
    } else {
      reportOnline('Jugando solo · Online sin configurar');
    }
    const peer = game.coopTransport?.id || 0;
    if (peer > 1) args.push('--client', 'relay', '1');
    else args.push('--server', '1', '--skip-intro');
    game.callMain(args);
    if (game._web_phase() !== 7) throw Error('El motor no completó la inicialización. Consulta el registro y recarga para reintentar.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (game._web_frame_count() < 1) throw Error('El motor no produjo ningún fotograma. Consulta el registro.');
    status.textContent = 'Motor en ejecución · prueba experimental';
    document.querySelector('#placeholder').hidden = true;
    document.querySelector('#game-controls').hidden = false;
    document.querySelector('#touch-controls').hidden = false;
    canvas.focus();
    updateAudioControl();
    if (gameStorage) {
      saveNow.hidden = false;
      await flushSaves();
      setInterval(flushSaves, 3000);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) void flushSaves();
      });
    }
  } catch (error) {
    runtime?.coopTransport?.close();
    status.textContent = error.message;
    message(error.stack || String(error));
  } finally {
    start.disabled = active || (!localRom && !downloadUrl && !input.files.length);
  }
});
const touch = document.querySelector('#touch-controls');
const touches = new Map();
function updateTouch() {
  let mask = 0;
  for (const button of touches.values()) mask |= Number(button.dataset.input);
  runtime?._web_set_touch_buttons?.(mask);
}
touch.addEventListener('pointerdown', event => {
  const button = event.target.closest('[data-input]');
  if (!button) return;
  event.preventDefault();
  button.setPointerCapture(event.pointerId);
  touches.set(event.pointerId, button);
  button.classList.add('held');
  updateTouch();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  touch.addEventListener(type, event => {
    const button = touches.get(event.pointerId);
    touches.delete(event.pointerId);
    if (button && ![...touches.values()].includes(button)) button.classList.remove('held');
    updateTouch();
  });
}
window.addEventListener('blur', () => {
  for (const button of touches.values()) button.classList.remove('held');
  touches.clear();
  updateTouch();
});

const fullscreen = document.querySelector('#fullscreen');
const displayStatus = document.querySelector('#display-status');
const stage = document.querySelector('main');
document.addEventListener('fullscreenchange', () => {
  fullscreen.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
  if (!document.fullscreenElement) screen.orientation?.unlock?.();
  displayStatus.hidden = true;
});
fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await enterFullscreen();
});

async function enterFullscreen() {
  try {
    await stage.requestFullscreen();
  } catch {
    displayStatus.textContent = 'Pantalla completa no disponible. Puedes girar el teléfono para jugar en horizontal.';
    displayStatus.hidden = false;
    return;
  }
  if (matchMedia('(any-pointer: coarse)').matches) {
    try {
      if (!screen.orientation?.lock) throw Error();
      await screen.orientation.lock('landscape');
    } catch {
      displayStatus.textContent = 'Gira el teléfono para jugar en horizontal.';
      displayStatus.hidden = false;
    }
  }
}
