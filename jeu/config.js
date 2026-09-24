// 🎛️ LES RÉGLAGES DU JEU
//
// Tous les nombres qui changent la « sensation » du jeu sont rangés ici, et nulle part ailleurs.
// Quand Maxance demande « le saut doit être plus haut » ou « les obstacles arrivent trop vite »,
// c'est ce fichier qu'on modifie : pas besoin de fouiller dans tout le code.
//
// Unités : les distances sont en pixels (px), les durées en secondes (s),
// les vitesses en pixels par seconde (px/s).

window.Jeu = window.Jeu || {};

Jeu.CONFIG = {
  // Numéro de la version du jeu. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  // Affiché en haut de la page : si les deux ne correspondent pas, le navigateur a mélangé des versions.
  version: 4,

  ecran: { largeur: 960, hauteur: 540 },

  // Taille d'un bloc (une case de la grille). Tout le monde est pensé en blocs de 40 px.
  tailleBloc: 40,

  // Hauteur (y) du dessus du sol. Rappel : y = 0 en haut de l'écran, y grandit vers le bas.
  solY: 440,

  // Force qui tire tout vers le bas, en px/s². Plus c'est grand, plus on retombe vite.
  gravite: 2400,
  vitesseChuteMax: 1400,

  joueur: {
    largeur: 30,
    hauteur: 46,
    vitesse: 320, // vitesse de marche gauche/droite
    forceSaut: 860, // vitesse vers le haut au moment du saut → saut de ~154 px (≈ 3,8 blocs) en ~0,72 s
    coupureSaut: 0.45, // si on relâche la touche pendant la montée, la vitesse est multipliée par ce nombre
    memoireSaut: 0.12, // un saut demandé juste avant d'atterrir est gardé en mémoire pendant ce temps
    margeHitbox: 4, // la zone de collision avec les obstacles est un peu plus petite que le dessin : le jeu est « gentil »
  },

  // La carte du monde : une grille de cases de 40 px. Les colonnes sont numérotées de gauche à droite
  // (0, 1, 2… sans fin), les lignes de haut en bas (0 à 13).
  carte: {
    lignes: 14, // 14 lignes × 40 px = 560 px : un peu plus que l'écran
    ligneSol: 11, // la ligne de l'herbe (11 × 40 = 440 = solY)
    longueurTroncon: 30, // le monde est fabriqué par morceaux de 30 colonnes, avec un drapeau au début de chacun
    colonneDrapeau: 2, // le drapeau est dans la 3ᵉ colonne de chaque tronçon (0, 1, 2…)
    zoneSure: 5, // les 5 premières colonnes d'un tronçon : ni trou ni obstacle autour du drapeau
    zoneSureDepart: 10, // au tout début du monde, on laisse plus de place pour s'échauffer
    avance: 12, // on fabrique le monde au moins 12 colonnes plus loin que le bord droit de l'écran
  },

  trous: {
    ecartMin: 6, // entre deux trous : 6 à 9 blocs de sol (+ la largeur du trou) → « un trou tous les 10 blocs environ »
    ecartMax: 9,
    largeurMin: 1,
    largeurMax: 3, // le saut franchit environ 5 blocs : un trou de 3 est toujours possible
    chute: 580, // si les pieds du héros descendent plus bas que ce y, il est tombé dans le trou
  },

  plateformes: {
    parTronconMin: 1,
    parTronconMax: 2,
    largeurMin: 3,
    largeurMax: 5,
    hauteurs: [2, 3], // en blocs au-dessus du sol
  },

  // Une grande fosse de lave au milieu de chaque tronçon : donc une tous les 30 blocs (étape 4).
  fosses: {
    largeur: 3, // en blocs (les petites mares au hasard font 1 ou 2 blocs)
    position: 16, // n° de la colonne dans le tronçon (0 à 29) où commence la fosse
    marge: 2, // blocs d'herbe gardés de chaque côté (pas de trou ni de plateforme) pour prendre son élan
  },

  // Les vies (étape 4). Trou ou lave = 1 vie en moins. À 0 vie : « Aïe ! » et tout recommence à zéro.
  vies: 5,

  obstacles: {
    ecartMin: 8, // en blocs, entre deux obstacles (au moins : s'il n'y a pas la place à cause d'un trou, on pose plus loin)
    ecartMax: 14,
    margeTrou: 2, // blocs de sol obligatoires avant et après un obstacle (pour prendre son élan et atterrir)
    // À partir de quelle colonne chaque obstacle peut apparaître (caisses et lave : dès le début).
    debloque: { caisse: 0, lave: 0, tour: 60, muret: 120 },
    // Largeur d'une mare de lave, en blocs (tirée au hasard entre les deux).
    laveLargeurMin: 1,
    laveLargeurMax: 2,
  },

  camera: {
    positionJoueur: 320, // la caméra essaie de garder le héros à 320 px du bord gauche de l'écran
    tempsDeReaction: 0.07, // plus c'est petit, plus elle suit vite. 0,07 s → après 0,5 s, il reste moins de 0,1 % de l'écart
  },

  // Le monde est mis à jour 120 fois par seconde, quel que soit l'ordinateur.
  pasDeTemps: 1 / 120,
};
