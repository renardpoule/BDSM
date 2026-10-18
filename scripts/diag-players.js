// Diagnostic : essaie plusieurs variantes de requête A2S_PLAYER et affiche les réponses brutes.
'use strict';

const dgram = require('node:dgram');

const HOST = process.env.GMOD_HOST || '83.143.117.26';
const PORT = Number(process.env.GMOD_PORT || 27025);
const FF = Buffer.from([0xff, 0xff, 0xff, 0xff]);
const INFO = Buffer.concat([FF, Buffer.from('TSource Engine Query\0', 'binary')]);

function hex(b) { return b.subarray(0, 48).toString('hex').replace(/(..)/g, '$1 ').trim() + (b.length > 48 ? ' …' : ''); }

function send(sock, buf, ms = 4000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { sock.removeListener('message', on); resolve(null); }, ms);
    const on = (m) => { clearTimeout(t); sock.removeListener('message', on); resolve(m); };
    sock.on('message', on);
    sock.send(buf, PORT, HOST);
  });
}

const player = (ch) => Buffer.concat([FF, Buffer.from([0x55]), ch]);

async function variant(name, fn) {
  const sock = dgram.createSocket('udp4');
  await new Promise((r) => sock.bind(0, r));
  const log = (label, m) => console.log(`  ${label}: ${m ? `${m.length} octets  ${hex(m)}` : 'pas de réponse'}`);
  console.log(`\n== ${name}`);
  try { await fn(sock, log); } catch (e) { console.log('  erreur', e.message); }
  sock.close();
}

(async () => {
  await variant('A. A2S_PLAYER classique (FFFFFFFF)', async (s, log) => {
    const r = await send(s, player(FF)); log('réponse 1', r);
    if (r && r[4] === 0x41) log('réponse 2', await send(s, player(r.subarray(5, 9))));
  });
  await variant('B. A2S_INFO puis A2S_PLAYER sur le même port', async (s, log) => {
    let r = await send(s, INFO); log('info', r);
    if (r && r[4] === 0x41) { r = await send(s, Buffer.concat([INFO, r.subarray(5, 9)])); log('info + challenge', r); }
    r = await send(s, player(FF)); log('player 1', r);
    if (r && r[4] === 0x41) log('player 2', await send(s, player(r.subarray(5, 9))));
  });
  await variant('C. A2S_PLAYER avec challenge 00000000', async (s, log) => {
    log('réponse', await send(s, player(Buffer.alloc(4))));
  });
  await variant('D. Ancienne demande de challenge (0x57)', async (s, log) => {
    const r = await send(s, Buffer.concat([FF, Buffer.from([0x57])])); log('challenge', r);
    if (r && r[4] === 0x41) log('player', await send(s, player(r.subarray(5, 9))));
  });
  await variant('E. A2S_PLAYER complété à 1200 octets', async (s, log) => {
    const pad = (b) => Buffer.concat([b, Buffer.alloc(1200 - b.length)]);
    const r = await send(s, pad(player(FF))); log('réponse 1', r);
    if (r && r[4] === 0x41) log('réponse 2', await send(s, pad(player(r.subarray(5, 9)))));
  });
  await variant('F. A2S_RULES (0x56)', async (s, log) => {
    const r = await send(s, Buffer.concat([FF, Buffer.from([0x56]), FF])); log('réponse 1', r);
    if (r && r[4] === 0x41) log('réponse 2', await send(s, Buffer.concat([FF, Buffer.from([0x56]), r.subarray(5, 9)])));
  });
})();
