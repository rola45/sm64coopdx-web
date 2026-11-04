'use strict';

const roomPattern = /^[a-f0-9]{32}$/;
const requestedRoom = new URLSearchParams(location.search).get('room');
const defaultRoom = roomPattern.test(requestedRoom) ? requestedRoom : 'public';
const relaySetting = document.querySelector('meta[name="coop-relay"]').content.trim();
const loopback = ['localhost', '127.0.0.1'].includes(location.hostname);
let relayEndpoint;
try {
  const url = new URL(relaySetting || (loopback ? 'ws://' + location.hostname + ':8767/coop' : ''));
  if (url.protocol === 'wss:' || (loopback && url.protocol === 'ws:' && url.hostname === location.hostname)) {
    if (!url.username && !url.password) relayEndpoint = url;
  }
} catch {
  // Static builds can omit the relay URL.
}

async function connectCoop(room, report) {
  if (!relayEndpoint) throw Error('Online sin configurar');
  let socket;
  let id = 0;
  let token;
  let stopped = false;
  let deadline;
  const queue = [];

  function open() {
    return new Promise((resolve, reject) => {
      const url = new URL(relayEndpoint);
      url.searchParams.set('room', room);
      if (token) url.searchParams.set('resume', token);
      const connection = new WebSocket(url);
      socket = connection;
      connection.binaryType = 'arraybuffer';
      let ready = false;
      const timeout = setTimeout(() => connection.close(), 3000);
      connection.onmessage = ({data}) => {
        if (typeof data === 'string' && !ready) {
          let session;
          try { session = JSON.parse(data); } catch { connection.close(); return; }
          if (!Number.isInteger(session?.id) || session.id < 1 || session.id > 255 ||
              typeof session.token !== 'string' || (id && session.id !== id)) {
            connection.close();
            return;
          }
          id = session.id;
          token = session.token;
          ready = true;
          deadline = undefined;
          clearTimeout(timeout);
          resolve();
        } else if (ready && data instanceof ArrayBuffer && data.byteLength >= 2 && data.byteLength <= 3001) {
          if (queue.length < 512) queue.push(new Uint8Array(data));
        }
      };
      connection.onclose = ({code}) => {
        clearTimeout(timeout);
        if (!ready) {
          reject(Error(code === 4001 ? 'Sala llena' : code === 4002 ? 'La partida terminó' : 'Servidor online no disponible'));
        } else if (!stopped) {
          queue.length = 0;
          if (code === 4002) report('El anfitrión salió. Puedes volver a entrar.');
          else void reconnect();
        }
      };
    });
  }

  async function reconnect() {
    deadline ||= Date.now() + 10000;
    report('Reconectando…');
    while (!stopped && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 750));
      if (stopped) return;
      try {
        await open();
        if (!stopped) report(room === 'public' ? 'Sala pública' : 'Sala de amigos');
        return;
      } catch (error) {
        if (error.message === 'La partida terminó') break;
      }
    }
    if (!stopped) report('Se perdió la conexión. Puedes volver a entrar.');
  }

  await open();
  return {
    id, room,
    get connected() { return socket.readyState === WebSocket.OPEN; },
    receive: () => queue.shift(),
    send(peer, bytes) {
      if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount > 256 * 1024 ||
          peer < 1 || peer > 255 || bytes.length > 3000) return false;
      const packet = new Uint8Array(bytes.length + 1);
      packet[0] = peer;
      packet.set(bytes, 1);
      socket.send(packet);
      return true;
    },
    close() {
      stopped = true;
      socket.close(1000);
      queue.length = 0;
    },
  };
}
