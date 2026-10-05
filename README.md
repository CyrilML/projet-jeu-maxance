# 🧱 Le projet de jeu de Maxance

Un jeu en 2D que Maxance dirige et que Claude code, étape par étape : on commence par courir,
sauter et esquiver des obstacles, et on va vers un monde de blocs façon Minecraft.
À chaque étape, Maxance découvre comment le jeu fonctionne à l'intérieur : architecture,
boucle de jeu, physique, événements, base de données…

Projet **totalement indépendant** de ScorAsin et de Mission Liberté 2.0 : pas de compte,
pas de serveur, pas d'installation.

## Pour commencer

- **`index.html`** : le carnet de bord. Il explique qui fait quoi, contient la fiche pour
  passer commande à Claude, les explications de chaque étape et la feuille de route.
- **`jeu/index.html`** : le jeu. S'ouvre d'un double-clic dans le navigateur.
- **`circuit/index.html`** : le deuxième jeu (étapes 32 à 45), un jeu de voiture en 3D (Three.js) avec 5 cartes : un circuit ovale
  (course contre une voiture bleue), un parcours (tremplins, loopings, tunnels), une ville géante (circulation, feux, personnage
  qui descend de la voiture avec E, ponts, aéroports, motos, magasins, petits boulots, avions, hélicos, avion de chasse et police aux 5 étoiles) et un grand parcours façon Carrera (ponts, grande rampe, plateforme à trous, nitros,
  saut du creux) et des méga-rampes dans le ciel (chrono, drapeaux, dégâts). Un garage par carte, avec des voitures à acheter avec des pièces.
  ↑ accélérer, ↓ freiner, ← → tourner, C caméra, X rayons X. Même architecture que le premier jeu,
  avec un petit moteur 3D fait maison (`circuit/moteur/projecteur.js`), sans aucune dépendance.

- **`village/index.html`** : le troisième jeu (à partir de l'étape 46), un jeu de gestion façon The Settlers, sans combat,
  en vue de biais et en style dessin animé, jouable au doigt sur téléphone (pincer pour zoomer, plein écran ⛶).
  Une carte inventée au hasard (forêts, rivières, rochers, montagnes avec des filons de charbon, de fer et d'or),
  et la première chaîne de production : bûcheron, forestier, scierie, carrière (touches 1 à 4 ou boutons en bas),
  reliés à l'entrepôt par des routes (R) où marchent les porteurs. Pêcheur (5) et chasseur (6) nourrissent les habitants,
  et les 4 saisons passent en 10 minutes (lacs gelés et neige en hiver).
  G = nouvelle carte, H = retour au village, X = rayons X, Suppr = démolir, Échap = annuler.

Dans le jeu : ← → (ou Q D) pour bouger, Espace / ↑ / Z pour sauter.
Outils : `X` rayons X, `Échap` pause, `N` avancer d'un pas, `L` ralenti. `P` (en sautant) : poser un bloc. `T` : épée, `H` : potion, `F` : pioche, `R` : réparer, `K` : cuire, `M` : manger.

## Organisation

```
├── index.html          le carnet de bord
├── CLAUDE.md           les consignes pour Claude (rôles, architecture, façon de travailler)
├── demandes/           les demandes de Maxance, une par étape
├── circuit/            le jeu de course en 3D (mêmes familles : moteur, logique, donnees, affichage)
├── village/            le jeu de gestion du village (mêmes familles)
└── jeu/
    ├── index.html      la page du jeu
    ├── config.js       tous les réglages chiffrés
    ├── main.js         la boucle de jeu
    ├── moteur/         outils génériques : entrées, physique, événements, caméra, hasard à graine
    ├── logique/        règles du jeu : terrain (la carte), joueur, obstacles, monde
    ├── donnees/        sauvegarde (la base de données)
    └── affichage/      rendu et panneau « sous le capot »
```

## Passer à l'étape suivante

1. Maxance remplit la fiche de demande dans le carnet (rubrique « Passer commande »).
2. Cyril copie le message préparé et le donne à Claude, dans une session claude.ai/code ouverte sur ce dépôt.
3. Claude code, met à jour le carnet et publie sur `main`.
4. Environ une minute plus tard, Maxance recharge la page du jeu et teste.
