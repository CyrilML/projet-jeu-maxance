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
  version: 4,

  ecran: { largeur: 960, hauteur: 540 },

  // Le circuit le plus simple possible : un ovale, comme un stade.
  // Deux lignes droites, reliées par deux demi-cercles.
  piste: {
    // Étape 33 : le circuit est 3 fois plus grand (avant : 120 m et 40 m). Un tour ≈ 1 474 m.
    longueurDroite: 360, // longueur de chaque ligne droite (m)
    rayon: 120, // rayon des virages, mesuré au milieu de la route (m)
    largeur: 14, // largeur de la route (m)
    largeurBordure: 1.2, // les bandes rouges et blanches sur les côtés (m)
    tailleHerbe: 800, // le carré d'herbe autour du circuit (m de côté) ; 400 avant l'étape 33
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

  // Étape 34 : la voiture adverse, conduite par l'ordinateur.
  adversaire: {
    vitesseMax: 38.9, // m/s = 140 km/h (✍️ choix de Maxance : « moyen ») ; toi, tu vas jusqu'à 150 km/h
    acceleration: 12, // m/s² : elle démarre un peu moins vite que toi
    voie: 3.5, // m : elle roule à 3,5 m du milieu de la route (côté intérieur au départ)
    regardDevant: 18, // m : le pilote vise un point 18 m devant lui sur sa voie
    distanceDepassement: 22, // m : si tu es devant elle, sur sa voie, à moins de 22 m, elle change de voie
  },

  // Étape 34 : les chocs entre les voitures. Chaque voiture est vue comme 2 cercles (l'avant et l'arrière).
  chocs: {
    rayon: 1.05, // m : rayon de chaque cercle (la voiture fait 2 m de large)
    rebond: 0.3, // 0 = les voitures se collent, 1 = elles rebondissent comme des balles
  },

  // Étape 35 : les sons (fabriqués par le synthétiseur, aucun fichier). Fréquences en hertz (Hz).
  sons: {
    volumeGeneral: 0.5,
    // ✍️ Choix de Maxance : un gros moteur grave. Plus on va vite, plus le son monte.
    moteur: { frequenceRalenti: 38, frequenceMax: 90, volumeAccelere: 0.55, volumeLache: 0.3 },
    // ✍️ On entend la voiture bleue selon la distance : fort tout près, plus rien à 70 m.
    adversaire: { volume: 0.45, distanceMax: 70 },
    herbe: { volume: 0.35, frequenceFiltre: 900 }, // le « chhhh » dans l'herbe
    bips: { frequenceFeu: 440, frequenceGo: 880, volume: 0.2 }, // 440 Hz = la note La
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
    arbres: 260, // nombre d'arbres autour du circuit (70 avant l'étape 33 : le terrain est 4 fois plus grand)
    graine: 7, // le « hasard » des arbres est toujours le même avec la même graine
  },

  pasFixe: 1 / 120, // la boucle de jeu avance par petits pas de 1/120 s
};
