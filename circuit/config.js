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
  version: 7,

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

  // Étape 36 : LE GARAGE. 5 voitures, chacune avec sa forme, sa couleur, sa vitesse et son bruit.
  // ✍️ Choix de Maxance : les plus chères vont plus vite ; prix 0, 50, 100, 200, 400 pièces ;
  // la 1re reste telle quelle, puis une « Lamborghini », une « Porsche », une « Bugatti » et une Formule 1 au son aigu.
  // vitesseMax en m/s (× 3,6 = km/h) ; acceleration en m/s² ; son = fréquences du moteur en Hz (ralenti → à fond).
  voitures: [
    { id: "classique", nom: "La Rouge", modele: "classique", prix: 0, vitesseMax: 41.7, acceleration: 14,
      couleurs: [[0.9, 0.15, 0.1], [0.65, 0.08, 0.06]], son: { ralenti: 38, max: 90 } },
    { id: "taureau", nom: "Le Taureau (style Lamborghini)", modele: "taureau", prix: 50, vitesseMax: 44.4, acceleration: 15,
      couleurs: [[0.98, 0.76, 0.05], [0.1, 0.1, 0.11]], son: { ralenti: 55, max: 150 } },
    { id: "fleche", nom: "La Flèche (style Porsche)", modele: "fleche", prix: 100, vitesseMax: 47.2, acceleration: 16,
      couleurs: [[0.78, 0.8, 0.84], [0.12, 0.12, 0.14]], son: { ralenti: 62, max: 175 } },
    { id: "fusee", nom: "La Fusée (style Bugatti)", modele: "fusee", prix: 200, vitesseMax: 50, acceleration: 17,
      couleurs: [[0.55, 0.05, 0.14], [0.08, 0.08, 0.09]], son: { ralenti: 32, max: 88 } },
    { id: "f1", nom: "La Formule 1", modele: "f1", prix: 400, vitesseMax: 52.8, acceleration: 19,
      couleurs: [[0.05, 0.6, 0.38], [0.95, 0.95, 0.95]], son: { ralenti: 170, max: 560 } }, // ✍️ son aigu
  ],

  // Étape 37 : LES CARTES. ✍️ On choisit la carte avant le garage, et chaque carte a son garage.
  cartes: [
    { id: "course", nom: "Le circuit", icone: "🏁", texte: "3 tours contre la voiture bleue" },
    { id: "parcours", nom: "Le parcours", icone: "🎢", texte: "Tremplins, loopings, tunnels" },
    { id: "ville", nom: "La ville", icone: "🏙️", texte: "Rues, livraisons et course" },
  ],

  // Étape 37 : le garage du parcours. ✍️ Monster truck, 4x4, pickup et buggy.
  //   virage = vitesse à laquelle le véhicule tourne (rad/s) ; saut = combien il saute plus haut qu'une voiture normale ;
  //   ecrase = il passe à travers les cartons sans ralentir.
  vehiculesParcours: [
    { id: "4x4", nom: "Le 4x4", modele: "quatre", prix: 0, vitesseMax: 36.1, acceleration: 12, virage: 1.9, saut: 1,
      couleurs: [[0.38, 0.48, 0.26], [0.14, 0.14, 0.15]], son: { ralenti: 45, max: 115 } },
    { id: "pickup", nom: "Le pickup", modele: "pickup", prix: 50, vitesseMax: 38.9, acceleration: 13, virage: 1.9, saut: 1,
      couleurs: [[0.8, 0.14, 0.12], [0.95, 0.95, 0.95]], son: { ralenti: 42, max: 110 } },
    { id: "buggy", nom: "Le buggy", modele: "buggy", prix: 100, vitesseMax: 44.4, acceleration: 17, virage: 2.3, saut: 1.1,
      couleurs: [[1, 0.72, 0.05], [0.1, 0.1, 0.11]], son: { ralenti: 95, max: 270 } },
    { id: "monster", nom: "Le monster truck", modele: "monster", prix: 200, vitesseMax: 33.3, acceleration: 14, virage: 1.5, saut: 1.5, ecrase: true,
      couleurs: [[0.15, 0.35, 0.9], [1, 0.45, 0.05]], son: { ralenti: 30, max: 80 } },
  ],

  // Étape 37 : la map du PARCOURS. ✍️ Plate, en balade libre (pas de chrono), avec des montées, des tremplins,
  // des loopings, des tunnels, des pièces partout et des piles de cartons à défoncer.
  // x, z = le centre (en mètres) ; angle = la direction (radians : 0 = vers x+, π/2 = vers z+).
  parcours: {
    taille: 700, // m : la map fait 700 m × 700 m
    gravite: 20, // m/s² : ce qui fait retomber la voiture après un saut
    marche: 0.7, // m : une marche plus petite que ça, la voiture la monte ; plus grande, c'est un mur
    // Les montées : une pente pour monter, un plateau en haut, une pente pour redescendre.
    montees: [
      { x: -130, z: -150, angle: 0, longueur: 40, largeur: 14, hauteur: 5, pente: 25 },
      { x: 160, z: 170, angle: Math.PI / 2, longueur: 30, largeur: 16, hauteur: 9, pente: 40 },
      { x: -220, z: 190, angle: Math.PI / 4, longueur: 20, largeur: 14, hauteur: 3, pente: 15 },
    ],
    // Les tremplins : une pente qui s'arrête net. Au bout, on s'envole !
    tremplins: [
      { x: 70, z: -40, angle: 0, longueur: 14, largeur: 10, hauteur: 2.5 },
      { x: -60, z: 110, angle: Math.PI, longueur: 16, largeur: 10, hauteur: 3.5 },
      { x: 230, z: -190, angle: -Math.PI / 2, longueur: 18, largeur: 12, hauteur: 5 },
      { x: -280, z: -260, angle: Math.PI / 4, longueur: 14, largeur: 10, hauteur: 3 },
    ],
    // Les loopings : x, z = l'entrée (en bas). Il faut arriver assez vite, dans le bon sens.
    loopings: [
      { x: -260, z: -30, angle: 0, rayon: 9 },
      { x: 60, z: 270, angle: Math.PI, rayon: 12 },
    ],
    vitesseLooping: 15, // m/s (54 km/h) : en dessous, on n'a pas assez d'élan pour faire le tour
    decalageLooping: 5, // m : le looping se décale sur le côté pendant le tour, pour que l'entrée et la sortie ne se croisent pas
    // Les tunnels : on roule dedans, entre deux murs, sous un toit.
    tunnels: [
      { x: 260, z: 60, angle: Math.PI / 2, longueur: 80, largeur: 10, hauteur: 5 },
      { x: -40, z: -280, angle: 0, longueur: 120, largeur: 10, hauteur: 5 },
    ],
    // Les piles de cartons : ✍️ quand on fonce dedans, ils volent ! Certaines cachent une pièce.
    cartons: [
      { x: 30, z: 40, piece: true }, { x: -90, z: -40, piece: false }, { x: 120, z: 60, piece: true },
      { x: -170, z: 60, piece: false }, { x: 200, z: -60, piece: true }, { x: -30, z: 200, piece: false },
      { x: -300, z: 100, piece: true }, { x: 300, z: 280, piece: false }, { x: 100, z: -260, piece: true },
      { x: -200, z: -200, piece: false }, { x: 300, z: -300, piece: false }, { x: -320, z: 300, piece: true },
    ],
    piecesAuSol: 25, // pièces éparpillées au hasard sur le sol (en plus de celles sur les montées, tremplins…)
    graine: 11,
  },

  // Étape 36 : les pièces à ramasser pour acheter les voitures.
  pieces: {
    nombre: 50, // ✍️ 50 pièces posées sur le circuit à chaque course (une pièce prise ne revient pas avant la course suivante)
    voies: [-4.5, 0, 4.5], // m : à gauche, au milieu ou à droite de la route
    rayonRamassage: 2.4, // m : la pièce est prise si le milieu de la voiture passe à moins de 2,4 m
    hauteur: 1.2, // m : les pièces flottent au-dessus de la route
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
