'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { queryInfo, queryPlayers } = require('./lib/a2s');
const { appendPoint } = require('./lib/history');

// Configuration (variables d'environnement)
const GMOD_HOST = process.env.GMOD_HOST || '83.143.117.26';
const GMOD_PORT = Number(process.env.GMOD_PORT || 27025);
const PORT = Number(process.env.PORT || 3000);
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL || 5) * 1000;

const HISTORY_FILE = path.join(__dirname, 'public', 'history.csv');
const HISTORY_INTERVAL = 5 * 60 * 1000; // un point toutes les 5 minutes, comme sur GitHub Pages

const page = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const logo = fs.readFileSync(path.join(__dirname, 'public', 'logo.png'));
let status = { online: false, players: 0 };
let lastHistory = 0;

// Pseudos non vides, triés par temps de jeu (secondes arrondies)
function cleanPlayers(list) {
  return list
    .filter((p) => p.name)
    .map((p) => ({ name: p.name, duration: Math.round(p.duration) }))
    .sort((a, b) => b.duration - a.duration);
}

async function poll() {
  try {
    const info = await queryInfo(GMOD_HOST, GMOD_PORT);
    const playerList = await queryPlayers(GMOD_HOST, GMOD_PORT).then(cleanPlayers).catch(() => []);
    status = { online: true, players: info.players, maxPlayers: info.maxPlayers, playerList, updatedAt: Date.now() };
  } catch (err) {
    status = { online: false, players: 0, error: err.message, updatedAt: Date.now() };
  }
  if (status.updatedAt - lastHistory >= HISTORY_INTERVAL) {
    appendPoint(HISTORY_FILE, status);
    lastHistory = status.updatedAt;
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/history.csv')) {
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(fs.existsSync(HISTORY_FILE) ? fs.readFileSync(HISTORY_FILE) : 't,players\n');
    return;
  }
  if (req.url.startsWith('/logo.png')) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(logo);
    return;
  }
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
