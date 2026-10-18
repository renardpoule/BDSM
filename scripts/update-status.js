// Interroge le serveur GMod et écrit public/status.json (utilisé par GitHub Actions)
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { queryInfo } = require('../lib/a2s');

const GMOD_HOST = process.env.GMOD_HOST || '83.143.117.26';
const GMOD_PORT = Number(process.env.GMOD_PORT || 27025);

(async () => {
  let status;
  try {
    const info = await queryInfo(GMOD_HOST, GMOD_PORT, 5000);
    status = { online: true, players: info.players, maxPlayers: info.maxPlayers, updatedAt: Date.now() };
  } catch (err) {
    status = { online: false, players: 0, error: err.message, updatedAt: Date.now() };
  }
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'status.json'), JSON.stringify(status));
  console.log(status);
})();
