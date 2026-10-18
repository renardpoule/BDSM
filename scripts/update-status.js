// Interroge le serveur GMod et écrit public/status.json (utilisé par GitHub Actions)
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { queryInfo, queryPlayers } = require('../lib/a2s');

const GMOD_HOST = process.env.GMOD_HOST || '83.143.117.26';
const GMOD_PORT = Number(process.env.GMOD_PORT || 27025);

// Pseudos non vides, triés par temps de jeu (secondes arrondies)
function cleanPlayers(list) {
  return list
    .filter((p) => p.name)
    .map((p) => ({ name: p.name, duration: Math.round(p.duration) }))
    .sort((a, b) => b.duration - a.duration);
}

(async () => {
  let status;
  try {
    const info = await queryInfo(GMOD_HOST, GMOD_PORT, 5000);
    const playerList = await queryPlayers(GMOD_HOST, GMOD_PORT).then(cleanPlayers).catch(() => []);
    status = { online: true, players: info.players, maxPlayers: info.maxPlayers, playerList, updatedAt: Date.now() };
  } catch (err) {
    status = { online: false, players: 0, error: err.message, updatedAt: Date.now() };
  }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'status.json'), JSON.stringify(status));
  console.log(status);
})();
