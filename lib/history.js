// Historique du nombre de joueurs : un fichier CSV "t,players,map"
// (t en ms ; players et map vides si le serveur était hors ligne).
// Les anciennes lignes "t,players" (sans map) restent valides.
'use strict';

const fs = require('node:fs');

const HEADER = 't,players,map';

function appendPoint(file, status) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${HEADER}\n`);
  } else {
    // Ancien format sans map : on met juste l'en-tête à jour
    const content = fs.readFileSync(file, 'utf8');
    if (content.startsWith('t,players\n')) fs.writeFileSync(file, HEADER + content.slice('t,players'.length));
  }
  const map = status.online && status.map ? status.map.replace(/[,\r\n]/g, '') : '';
  fs.appendFileSync(file, `${status.updatedAt},${status.online ? status.players : ''},${map}\n`);
}

module.exports = { appendPoint };
