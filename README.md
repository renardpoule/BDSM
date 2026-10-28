# Bureau Des Statistiques Multijoueurs (BDSM)

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

Le dernier relevé (`status.json`) et l'historique sont aussi écrits dans la branche `data`, et la page
les lit directement là (via raw.githubusercontent.com) : le site reste à jour même si GitHub Pages
arrête de republier la page alors que les déploiements apparaissent « réussis ».

Si GitHub ne trouve pas de machine pour un lancement, celui-ci reste « en attente » et bloque
les suivants : chaque lancement annule donc ceux qui attendent une machine depuis plus de 10 minutes.

## Statistiques

À chaque passage, le nombre de joueurs est ajouté à `history.csv` (colonnes `t` en millisecondes,
`players` et `map`, vides si le serveur était hors ligne ; les plus anciennes lignes n'ont pas de map). Les lignes avec une 4e colonne `estime` sont des points inventés pour combler un trou
(relevés qui n'ont pas tourné) : lancer le workflow à la main avec « Combler les trous » coché
ajoute un point toutes les 5 minutes, en ligne droite entre les deux relevés qui encadrent le trou.
Sur GitHub, ce fichier est gardé dans la
branche `data`, qui ne contient qu'un seul commit réécrit à chaque mise à jour.

La page affiche des graphiques par jour, semaine et mois, avec la moyenne, le pic et le creux,
et des flèches pour revenir aux périodes précédentes. Les journées vont de 6 h à 6 h
(le serveur redémarre à 6 h), les semaines et les mois commencent aussi à 6 h.

À droite, les records :
- meilleur / pire jour : le pic de joueurs le plus haut / le plus bas ;
- meilleure / pire semaine et mois : la moyenne des pics de chaque jour la plus haute / la plus basse.

On peut zoomer sur le graphique (molette, pincement ou boutons − / +) et se déplacer en glissant :
l'échelle s'adapte à la zone visible et la courbe repasse aux relevés détaillés.

Sous le graphique :
- la période précédente en pointillés (même jour la semaine d'avant, semaine ou mois précédent)
  et l'évolution en % (pic pour un jour, moyenne des pics pour une semaine ou un mois) ;
- pour aujourd'hui, une prévision du reste de la journée (moyenne des 4 mêmes jours précédents) ;
- la disponibilité du serveur (% des relevés en ligne, nombre de coupures) et le taux de remplissage.

La carte de chaleur « Affluence par jour et par heure » donne le nombre moyen de joueurs sur les
4 dernières semaines pour chaque jour et chaque heure, et le meilleur créneau.

La map est enregistrée avec chaque relevé (depuis le 18 octobre 2026) : elle s'affiche sous le
compteur, les changements de map sont marqués en bleu sur le graphique, et la section « Maps »
donne pour chaque map le temps passé, la moyenne et le pic de joueurs, ainsi que la liste des
derniers changements. L'export Excel contient aussi la map de chaque relevé et une feuille « Maps ».

Autres statistiques :
- « Mis à jour il y a X min » sous le compteur (en orange au-delà de 30 minutes) ;
- **Tendance** : le pic de chaque journée depuis le début, sa moyenne sur 7 jours et l'évolution
  sur les 30 (ou 7) derniers jours ;
- **Crashs et disponibilité** : disponibilité sur 7 et 30 jours, nombre de crashs, durée moyenne
  et plus longue coupure, temps moyen entre deux crashs, et la liste des dernières coupures
  (les coupures vers 6 h sont classées « Redémarrage quotidien » et ne comptent pas comme crashs) ;
  sur les graphiques, chaque coupure apparaît en zone hachurée (rouge : crash, gris : redémarrage) ;
  rien n'est jamais effacé : l'historique complet des coupures reste consultable sur la page
  (rangé par mois, avec les chiffres « depuis le début ») et dans la feuille « Coupures » de l'export Excel ;
- **Vacances et jours fériés** : bandes vertes sur les graphiques et pic moyen selon le calendrier
  scolaire (zones A, B, C, via data.education.gouv.fr) et les jours fériés (via calendrier.api.gouv.fr) ;
- **Partager** : copie un lien qui rouvre exactement la même vue (`?vue=jour&date=2026-10-10&de=…&a=…`).

### Noter un événement

Modifier `public/events.json` directement sur GitHub (icône crayon), par exemple :

```json
[
  { "debut": "2026-10-31 20:00", "fin": "2026-11-01 02:00", "titre": "Event Halloween" },
  { "debut": "2026-11-15 21:00", "titre": "Grosse mise à jour" }
]
```

Heures de Paris ; `fin` est facultatif. Après l'enregistrement, la page se met à jour toute seule :
l'événement apparaît en violet sur les graphiques, et la section « Événements » compare le pic de
cette journée à celui des 4 mêmes jours précédents.

Le bouton « Mode TV » (ou l'adresse `…/?tv`) affiche en plein écran le compteur et la courbe du jour.

En bas de page, la section « Données » génère un fichier Excel avec tous les relevés (date, heure,
jour, journée de jeu, joueurs, statut) et un résumé par jour (pic, heure du pic, moyenne, creux).

Seuls comptent les jours terminés avec des relevés sur au moins 12 heures, et les semaines / mois
terminés dont au moins la moitié des jours comptent. Un clic sur un record l'affiche dans le graphique.
