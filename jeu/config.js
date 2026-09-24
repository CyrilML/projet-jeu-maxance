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
  ecran: { largeur: 960, hauteur: 540 },

  // Taille d'un bloc. Tout le monde est pensé en blocs de 40 px :
  // c'est la future grille façon Minecraft.
  tailleBloc: 40,

  // Hauteur (y) du dessus du sol. Rappel : y = 0 en haut de l'écran, y grandit vers le bas.
  solY: 440,

  // Force qui tire tout vers le bas, en px/s². Plus c'est grand, plus on retombe vite.
  gravite: 2400,
  vitesseChuteMax: 1400,

  joueur: {
    largeur: 30,
    hauteur: 46,
    departX: 160,
    vitesse: 320, // vitesse de marche gauche/droite
    forceSaut: 860, // vitesse vers le haut au moment du saut → saut de ~154 px (≈ 3,8 blocs) en ~0,72 s
    coupureSaut: 0.45, // si on relâche la touche pendant la montée, la vitesse est multipliée par ce nombre
    memoireSaut: 0.12, // un saut demandé juste avant d'atterrir est gardé en mémoire pendant ce temps
    margeHitbox: 4, // la zone de collision est un peu plus petite que le dessin : le jeu est « gentil »
  },

  obstacles: {
    vitesseDepart: 280, // vitesse de défilement au début d'une partie
    vitesseMax: 700,
    accelerationParSeconde: 10, // la vitesse augmente de 10 px/s chaque seconde
    premierObstacle: 1.5, // secondes avant le tout premier obstacle
    ecartMin: 0.95, // temps minimum entre deux obstacles (s)
    ecartMax: 2.0, // temps maximum entre deux obstacles (s)
  },

  // Le monde est mis à jour 120 fois par seconde, quel que soit l'ordinateur.
  pasDeTemps: 1 / 120,
};
