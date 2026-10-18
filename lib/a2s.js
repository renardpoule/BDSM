// Client minimal pour le protocole Source "A2S" (UDP), utilisé par Garry's Mod.
// Doc : https://developer.valvesoftware.com/wiki/Server_queries
'use strict';

const dgram = require('node:dgram');

const HEADER_SIMPLE = -1; // FF FF FF FF
const HEADER_SPLIT = -2; // FE FF FF FF

const A2S_INFO = 0x54;
const A2S_PLAYER = 0x55;
const S2C_CHALLENGE = 0x41;
const S2A_INFO = 0x49;
const S2A_PLAYER = 0x44;

class Reader {
  constructor(buf, offset = 0) {
    this.buf = buf;
    this.pos = offset;
  }
  byte() { return this.buf.readUInt8(this.pos++); }
  short() { const v = this.buf.readInt16LE(this.pos); this.pos += 2; return v; }
  long() { const v = this.buf.readInt32LE(this.pos); this.pos += 4; return v; }
  float() { const v = this.buf.readFloatLE(this.pos); this.pos += 4; return v; }
  string() {
    let end = this.buf.indexOf(0, this.pos);
    if (end === -1) end = this.buf.length;
    const s = this.buf.toString('utf8', this.pos, end);
    this.pos = end + 1;
    return s;
  }
  remaining() { return this.buf.length - this.pos; }
}

// Envoie `payload` et attend une réponse complète (gère les paquets fragmentés).
function exchange(socket, host, port, payload, timeoutMs) {
  return new Promise((resolve, reject) => {
    const fragments = new Map();
    let expected = 0;

    const cleanup = () => {
      clearTimeout(timer);
      socket.removeListener('message', onMessage);
      socket.removeListener('error', onError);
    };
    const onError = (err) => { cleanup(); reject(err); };
    const onMessage = (msg) => {
      if (msg.length < 5) return;
      const header = msg.readInt32LE(0);
      if (header === HEADER_SIMPLE) {
        cleanup();
        resolve(msg.subarray(4));
        return;
      }
      if (header !== HEADER_SPLIT || msg.length < 12) return;
      // Format Source : id (4), total (1), numéro (1), taille max (2)
      const id = msg.readInt32LE(4);
      if (id & 0x80000000) {
        cleanup();
        reject(new Error('Réponses compressées non supportées'));
        return;
      }
      expected = msg.readUInt8(8);
      fragments.set(msg.readUInt8(9), msg.subarray(12));
      if (fragments.size === expected) {
        const parts = [];
        for (let i = 0; i < expected; i++) parts.push(fragments.get(i));
        const full = Buffer.concat(parts);
        cleanup();
        resolve(full.subarray(4)); // retire l'en-tête FF FF FF FF
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Pas de réponse de ${host}:${port} (timeout)`));
    }, timeoutMs);

    socket.on('message', onMessage);
    socket.on('error', onError);
    socket.send(payload, port, host);
  });
}

function packet(type, extra) {
  const head = Buffer.alloc(5);
  head.writeInt32LE(HEADER_SIMPLE, 0);
  head.writeUInt8(type, 4);
  return Buffer.concat([head, extra]);
}

// Envoie une requête et répond au "challenge" éventuel du serveur.
async function request(socket, host, port, type, body, challengeAppends, timeoutMs) {
  let res = await exchange(socket, host, port, packet(type, body), timeoutMs);
  for (let i = 0; i < 3 && res[0] === S2C_CHALLENGE; i++) {
    const challenge = res.subarray(1, 5);
    const next = challengeAppends ? Buffer.concat([body, challenge]) : challenge;
    res = await exchange(socket, host, port, packet(type, next), timeoutMs);
  }
  return res;
}

function parseInfo(buf) {
  if (buf[0] !== S2A_INFO) throw new Error(`Réponse A2S_INFO inattendue (0x${buf[0].toString(16)})`);
  const r = new Reader(buf, 1);
  const info = {
    protocol: r.byte(),
    name: r.string(),
    map: r.string(),
    folder: r.string(),
    game: r.string(),
    appId: r.short() & 0xffff,
    players: r.byte(),
    maxPlayers: r.byte(),
    bots: r.byte(),
    serverType: String.fromCharCode(r.byte()),
    environment: String.fromCharCode(r.byte()),
    password: r.byte() === 1,
    vac: r.byte() === 1,
  };
  info.version = r.remaining() > 0 ? r.string() : '';
  return info;
}

function parsePlayers(buf) {
  if (buf[0] !== S2A_PLAYER) throw new Error(`Réponse A2S_PLAYER inattendue (0x${buf[0].toString(16)})`);
  const r = new Reader(buf, 1);
  const count = r.byte();
  const players = [];
  for (let i = 0; i < count && r.remaining() > 0; i++) {
    r.byte(); // index, toujours 0 sur GMod
    const name = r.string();
    const score = r.long();
    const duration = r.float();
    players.push({ name, score, duration });
  }
  return players;
}

async function withSocket(fn) {
  const socket = dgram.createSocket('udp4');
  try {
    return await fn(socket);
  } finally {
    socket.close();
  }
}

function queryInfo(host, port, timeoutMs = 3000) {
  const body = Buffer.from('Source Engine Query\0', 'binary');
  return withSocket(async (s) => parseInfo(await request(s, host, port, A2S_INFO, body, true, timeoutMs)));
}

function queryPlayers(host, port, timeoutMs = 3000) {
  const body = Buffer.from([0xff, 0xff, 0xff, 0xff]);
  return withSocket(async (s) => parsePlayers(await request(s, host, port, A2S_PLAYER, body, false, timeoutMs)));
}

module.exports = { queryInfo, queryPlayers, parseInfo, parsePlayers };
