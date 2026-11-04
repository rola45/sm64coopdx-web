const assert = require('node:assert/strict');
const {once} = require('node:events');
const {spawn} = require('node:child_process');
const {test} = require('node:test');
const {WebSocket} = require('ws');

test('rooms isolate packets, enforce capacity and resume the same peer', {timeout: 10000}, async t => {
  const server = spawn(process.execPath, ['server.cjs'], {
    cwd: __dirname,
    env: {...process.env, PORT: '0', BIND: '127.0.0.1', ALLOWED_ORIGINS: 'https://game.example'},
  });
  const peers = new Set();
  t.after(() => {
    for (const socket of peers) socket.terminate();
    server.kill();
  });
  const [output] = await once(server.stdout, 'data');
  const endpoint = 'ws://' + output.toString().trim().split(' ').at(-1) + '/coop';

  function socket(room, token, origin = 'https://game.example') {
    const url = new URL(endpoint);
    url.searchParams.set('room', room);
    if (token) url.searchParams.set('resume', token);
    const client = new WebSocket(url, {origin});
    peers.add(client);
    client.on('close', () => peers.delete(client));
    return client;
  }

  async function join(room, token) {
    const client = socket(room, token);
    const [data] = await once(client, 'message');
    return {client, ...JSON.parse(data)};
  }

  const host = await join('public');
  const guest = await join('public');
  const privateHost = await join('a'.repeat(32));
  assert.deepEqual([host.id, guest.id, privateHost.id], [1, 2, 1]);

  const messages = [];
  privateHost.client.on('message', data => messages.push(data));
  const hostPacket = once(host.client, 'message');
  guest.client.send(Buffer.from([1, 21, 22]));
  assert.deepEqual((await hostPacket)[0], Buffer.from([2, 21, 22]));
  const guestPacket = once(guest.client, 'message');
  host.client.send(Buffer.from([2, 31, 32]));
  assert.deepEqual((await guestPacket)[0], Buffer.from([1, 31, 32]));
  assert.deepEqual(messages, []);

  for (let index = 2; index < 16; index++) await join('public');
  assert.equal((await once(socket('public'), 'close'))[0], 4001);

  const disconnected = once(guest.client, 'close');
  guest.client.terminate();
  await disconnected;
  const resumed = await join('public', guest.token);
  assert.equal(resumed.id, guest.id);

  const ended = once(resumed.client, 'close');
  host.client.close(1000);
  assert.equal((await ended)[0], 4002);
  assert.equal((await join('public')).id, 1);
  await assert.rejects(once(socket('public', null, 'https://other.example'), 'open'), /401/);
});
