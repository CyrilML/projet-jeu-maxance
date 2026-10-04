// 🎛️ LES RÉGLAGES DU CIRCUIT
//
// Tous les nombres qui changent la « sensation » de la course sont rangés ici, et nulle part ailleurs.
// « La voiture va trop vite », « les virages sont trop serrés » : c'est ce fichier qu'on modifie.
//
// Unités : on est en 3D, donc on compte en MÈTRES (m), en secondes (s),
// et les vitesses en mètres par seconde (m/s). 1 m/s = 3,6 km/h.
//
// Les 3 directions du monde 3D :
//   x = de gauche à droite, y = de bas en haut (la hauteur), z = d'avant en arrière.
//   Le sol est à y = 0.

window.Circuit = window.Circuit || {};

Circuit.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  version: 1,

  ecran: { largeur: 960, hauteur: 540 },

  // Le circuit le plus simple possible : un ovale, comme un stade.
  // Deux lignes droites, reliées par deux demi-cercles.
  piste: {
    longueurDroite: 120, // longueur de chaque ligne droite (m)
    rayon: 40, // rayon des virages, mesuré au milieu de la route (m)
    largeur: 14, // largeur de la route (m)
    largeurBordure: 1.2, // les bandes rouges et blanches sur les côtés (m)
    tailleHerbe: 400, // le carré d'herbe autour du circuit (m de côté)
  },

  // La voiture
  voiture: {
    longueur: 4.2, // m
    largeur: 2, // m
    acceleration: 14, // m/s² : combien de vitesse on gagne chaque seconde avec ↑
    freinage: 28, // m/s² : combien de vitesse on perd chaque seconde avec ↓
    vitesseMax: 42, // m/s (≈ 150 km/h) sur la route
    vitesseMarcheArriere: 8, // m/s
    ralentissement: 5, // m/s² : la voiture ralentit toute seule si on lâche ↑
    vitesseMaxHerbe: 14, // m/s (≈ 50 km/h) : dans l'herbe, on ne peut pas aller plus vite
    freinHerbe: 30, // m/s² : l'herbe freine fort quand on y entre trop vite
    vitesseVirage: 1.9, // radians par seconde : la vitesse à laquelle la voiture tourne
    angleRoues: 0.45, // radians : jusqu'où les roues avant tournent (pour le dessin)
  },

  course: {
    tours: 3, // nombre de tours pour finir la course
    decompte: 3, // secondes de feu rouge avant le départ
    portes: 4, // le circuit est coupé en 4 « portes » à passer dans l'ordre (anti-triche)
  },

  camera: {
    distance: 11, // m derrière la voiture
    hauteur: 4.5, // m au-dessus du sol
    regardDevant: 6, // la caméra vise un point 6 m devant la voiture
    souplesse: 6, // plus c'est grand, plus la caméra rattrape vite la voiture
    champDeVision: 60, // degrés : l'angle d'ouverture de « l'œil »
  },

  // Le décor
  decor: {
    arbres: 70, // nombre d'arbres autour du circuit
    graine: 7, // le « hasard » des arbres est toujours le même avec la même graine
  },

  pasFixe: 1 / 120, // la boucle de jeu avance par petits pas de 1/120 s
};
