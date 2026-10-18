'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { queryInfo } = require('./lib/a2s');

// Configuration (variables d'environnement)
const GMOD_HOST = process.env.GMOD_HOST || '83.143.117.26';
const GMOD_PORT = Number(process.env.GMOD_PORT || 27025);
const PORT = Number(process.env.PORT || 3000);
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || 5) * 1000;

const page = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
let status = { online: false, players: 0 };

async function poll() {
  try {
    const info = await queryInfo(GMOD_HOST, GMOD_PORT);
    status = { online: true, players: info.players, maxPlayers: info.maxPlayers };
  } catch (err) {
    status = { online: false, players: 0, error: err.message };
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/status.json')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(status));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
}).listen(PORT, () => {
  console.log(`Site disponible sur http://localhost:${PORT}`);
  console.log(`Serveur Garry's Mod surveillé : ${GMOD_HOST}:${GMOD_PORT}`);
});

poll();
setInterval(poll, POLL_INTERVAL);
