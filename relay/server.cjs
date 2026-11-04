const {randomUUID} = require('node:crypto');
const {WebSocketServer, WebSocket} = require('ws');

const port = Number(process.env.PORT || 8767);
const bind = process.env.BIND || '127.0.0.1';
const origins = new Set((process.env.ALLOWED_ORIGINS ||
  'http://127.0.0.1:8765,http://localhost:8765').split(',').map(value => value.trim()));
const rooms = new Map();
const server = new WebSocketServer({
  host: bind, port, maxPayload: 3001, perMessageDeflate: false,
  verifyClient: ({origin}) => origins.has(origin),
});

function remove(room, member) {
  room.delete(member.id);
  room.cooldown.set(member.id, Date.now() + 30000);
  if (member.id === 1) {
    rooms.delete(member.room);
    for (const peer of room.values()) {
      clearTimeout(peer.expiry);
      peer.socket?.close(4002, 'Host left');
    }
    room.clear();
  }
}

server.on('connection', (socket, request) => {
  const url = new URL(request.url, 'http://relay.invalid');
  const name = url.searchParams.get('room') || 'public';
  if (url.pathname !== '/coop' || !/^(public|[a-f0-9]{32})$/.test(name) || server.clients.size > 256) {
    socket.close(1008, 'Invalid room or capacity reached');
    return;
  }
  let room = rooms.get(name);
  const token = url.searchParams.get('resume');
  let member;
  if (token) {
    member = room && [...room.values()].find(peer => peer.token === token && !peer.socket);
    if (!member) {
      socket.close(4002, 'Session ended');
      return;
    }
    clearTimeout(member.expiry);
  } else {
    if (!room) {
      room = new Map();
      room.cooldown = new Map();
      rooms.set(name, room);
    }
    if (room.size >= 16) {
      socket.close(4001, 'Room full');
      return;
    }
    // Give the engine time to discard old state before reusing an address.
    const now = Date.now();
    let id = 1;
    while (room.has(id) || (room.cooldown.get(id) || 0) > now) id++;
    if (id > 255) {
      socket.close(4001, 'Room full');
      return;
    }
    room.cooldown.delete(id);
    member = {id, room: name, token: randomUUID()};
    room.set(id, member);
  }
  member.socket = socket;
  socket.alive = true;
  socket.on('pong', () => { socket.alive = true; });
  socket.send(JSON.stringify({id: member.id, token: member.token}));
  let packets = 0;
  let windowStart = Date.now();
  socket.on('message', (bytes, binary) => {
    if (Date.now() - windowStart >= 1000) {
      windowStart = Date.now();
      packets = 0;
    }
    if (++packets > 3000) {
      socket.close(1008, 'Packet limit');
      return;
    }
    if (!binary || bytes.length < 2 || bytes.length > 3001) return;
    const target = bytes[0];
    if (member.id === 1 ? target < 2 : target !== 1) return;
    const peer = room.get(target)?.socket;
    if (peer?.readyState !== WebSocket.OPEN || peer.bufferedAmount > 256 * 1024) return;
    bytes[0] = member.id;
    peer.send(bytes, {binary: true});
  });
  socket.on('error', () => socket.terminate());
  socket.on('close', code => {
    member.socket = null;
    if (room.get(member.id) !== member) return;
    if (code === 1000) remove(room, member);
    else member.expiry = setTimeout(() => remove(room, member), 12000);
  });
});

const heartbeat = setInterval(() => {
  for (const socket of server.clients) {
    if (!socket.alive) socket.terminate();
    else {
      socket.alive = false;
      socket.ping();
    }
  }
}, 5000);
server.on('close', () => clearInterval(heartbeat));
server.on('listening', () => console.log(`CoopDX relay on ${bind}:${server.address().port}`));
