// Historique du nombre de joueurs : un fichier CSV "t,players" (t en ms, players vide si hors ligne)
'use strict';

const fs = require('node:fs');

function appendPoint(file, status) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, 't,players\n');
  fs.appendFileSync(file, `${status.updatedAt},${status.online ? status.players : ''}\n`);
}

module.exports = { appendPoint };
