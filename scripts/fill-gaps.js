// Comble les trous de public/history.csv (relevés qui n'ont pas tourné, pas des coupures du serveur) :
// un point estimé toutes les 5 minutes, par interpolation linéaire entre les deux relevés en ligne
// qui encadrent le trou. Ces lignes ont une 4e colonne "estime" pour les reconnaître.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const STEP = 5 * 60e3;
const MIN_GAP = 8 * 60e3;

const file = path.join(__dirname, '..', 'public', 'history.csv');
const lines = fs.readFileSync(file, 'utf8').trimEnd().split('\n');
const out = [lines[0]];
let prev = null;
let added = 0;

for (const line of lines.slice(1)) {
  const [t, p = '', m = ''] = line.split(',');
  const cur = { t: Number(t), p, m };
  // Seulement si le serveur répondait avant et après : sinon c'est peut-être une vraie coupure
  if (prev && prev.p !== '' && cur.p !== '' && cur.t - prev.t > MIN_GAP) {
    for (let tk = prev.t + STEP; tk < cur.t - STEP / 2; tk += STEP) {
      const v = Math.round(Number(prev.p) + (Number(cur.p) - Number(prev.p)) * (tk - prev.t) / (cur.t - prev.t));
      out.push(`${tk},${v},${prev.m || cur.m},estime`);
      added++;
    }
  }
  out.push(line);
  prev = cur;
}

fs.writeFileSync(file, out.join('\n') + '\n');
console.log(`${added} point(s) estimé(s) ajouté(s).`);
