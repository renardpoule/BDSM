# Nombre de joueurs GMod

Page noire qui affiche en temps réel le nombre de joueurs d'un serveur Garry's Mod.

Aucune dépendance, il faut juste Node.js 18+.

```bash
npm start
```

Puis ouvrir http://localhost:3000

Variables :
- `GMOD_HOST` : IP du serveur GMod (83.143.117.26 par défaut, ARKADIA SCP RP)
- `GMOD_PORT` : port du serveur (27025 par défaut)
- `PORT` : port du site (3000 par défaut)

## Hébergement GitHub Pages (24h/24)

Le workflow `.github/workflows/pages.yml` interroge le serveur toutes les 5 minutes
et republie la page avec un `status.json` à jour.

Une seule fois : **Settings → Pages → Source : GitHub Actions**.
Le workflow planifié ne tourne que sur la branche par défaut du dépôt.

## Statistiques

À chaque passage, le nombre de joueurs est ajouté à `history.csv` (colonnes `t` en millisecondes
et `players`, vide si le serveur était hors ligne). Sur GitHub, ce fichier est gardé dans la
branche `data`, qui ne contient qu'un seul commit réécrit à chaque mise à jour.

La page affiche des graphiques par jour, semaine et mois, avec la moyenne, le pic et le creux,
et des flèches pour revenir aux périodes précédentes.
