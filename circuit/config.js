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
  version: 19,

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
    // Étape 49 : ✍️ les voitures « style » sont remplacées par de VRAIES voitures : la Porsche 911, la Lamborghini
    // Aventador et la Bugatti Chiron (choix de Maxance). Elles prennent la place (et le prix) des anciennes.
    { id: "porsche911", nom: "La Porsche 911", modele: "porsche911", prix: 50, vitesseMax: 44.4, acceleration: 15,
      couleurs: [[0.78, 0.8, 0.84], [0.12, 0.12, 0.14]], son: { ralenti: 62, max: 175 } }, // 6 cylindres à plat : un son rauque et aigu
    { id: "aventador", nom: "La Lamborghini Aventador", modele: "aventador", prix: 100, vitesseMax: 47.2, acceleration: 16,
      couleurs: [[0.95, 0.42, 0.04], [0.1, 0.1, 0.11]], son: { ralenti: 58, max: 190 } }, // un V12 qui hurle
    { id: "chiron", nom: "La Bugatti Chiron", modele: "chiron", prix: 200, vitesseMax: 50, acceleration: 17,
      couleurs: [[0.1, 0.24, 0.6], [0.03, 0.06, 0.16]], son: { ralenti: 32, max: 88 } }, // le W16 : très grave
    { id: "f1", nom: "La Formule 1", modele: "f1", prix: 400, vitesseMax: 52.8, acceleration: 19,
      couleurs: [[0.05, 0.6, 0.38], [0.95, 0.95, 0.95]], son: { ralenti: 170, max: 560 } }, // ✍️ son aigu
    // Étape 40 : ✍️ la voiture de rallye (aileron et autocollants). Elle est aussi au garage du grand parcours.
    { id: "rallye", nom: "La voiture de rallye", modele: "rallye", prix: 300, vitesseMax: 48.6, acceleration: 18, virage: 2.2, saut: 1.1,
      couleurs: [[0.1, 0.3, 0.85], [1, 0.8, 0.1]], son: { ralenti: 75, max: 230 } },
  ],

  // Étape 37 : LES CARTES. ✍️ On choisit la carte avant le garage, et chaque carte a son garage.
  cartes: [
    { id: "course", nom: "Le circuit", icone: "🏁", texte: "3 tours contre la voiture bleue" },
    { id: "parcours", nom: "Le parcours", icone: "🎢", texte: "Tremplins, loopings, tunnels" },
    { id: "ville", nom: "La ville", icone: "🏙️", texte: "Rues, voitures, personnage" },
    { id: "grand", nom: "Le grand parcours", icone: "🛣️", texte: "Rampes, nitros, plateformes" }, // étape 40
    { id: "ciel", nom: "Les méga-rampes", icone: "☁️", texte: "Une piste dans le ciel" }, // étape 41
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
    // Étape 49 : ✍️ un vieux pick-up des années 80 (chromes, phares ronds, gros rétroviseurs) sur des RESSORTS.
    { id: "monster", nom: "Le monster truck", modele: "monster", prix: 200, vitesseMax: 33.3, acceleration: 14, virage: 1.5, saut: 1.5, ecrase: true, ressorts: true,
      couleurs: [[0.15, 0.35, 0.9], [1, 0.45, 0.05]], son: { ralenti: 30, max: 80 } },
    // Étape 40 : ✍️ le quad, léger : il saute très haut et tourne vite.
    { id: "quad", nom: "Le quad", modele: "quad", prix: 150, vitesseMax: 38.9, acceleration: 16, virage: 2.5, saut: 1.4,
      couleurs: [[0.95, 0.45, 0.05], [0.12, 0.12, 0.13]], son: { ralenti: 110, max: 330 } },
  ],

  // Étape 39 : le garage de la ville. ✍️ Petite citadine, SUV, voiture basse, camionnette et camion.
  vehiculesVille: [
    // Étape 49 : ✍️ des voitures plus réalistes (la citadine, le SUV genre 508, la Honda NSX, la camionnette genre Vito).
    { id: "citadine", nom: "La citadine", modele: "citadine", prix: 0, vitesseMax: 33.3, acceleration: 11, virage: 2.1, saut: 1,
      couleurs: [[0.3, 0.75, 0.85], [0.95, 0.95, 0.95]], son: { ralenti: 55, max: 140 } },
    { id: "suv", nom: "Le SUV (genre Peugeot 508)", modele: "suv", prix: 50, vitesseMax: 38.9, acceleration: 12, virage: 1.9, saut: 1,
      couleurs: [[0.08, 0.22, 0.45], [0.75, 0.75, 0.78]], son: { ralenti: 40, max: 105 } },
    { id: "basse", nom: "La Honda NSX (la voiture basse)", modele: "basse", prix: 100, vitesseMax: 47.2, acceleration: 17, virage: 2.1, saut: 1,
      couleurs: [[0.8, 0.06, 0.06], [0.08, 0.08, 0.09]], son: { ralenti: 65, max: 190 } },
    { id: "camionnette", nom: "La camionnette (genre Mercedes Vito)", modele: "camionnette", prix: 200, vitesseMax: 33.3, acceleration: 9, virage: 1.7, saut: 1,
      couleurs: [[0.95, 0.95, 0.95], [0.1, 0.1, 0.11]], son: { ralenti: 45, max: 110 } },
    { id: "camion", nom: "Le camion", modele: "camion", prix: 300, vitesseMax: 27.8, acceleration: 7, virage: 1.4, saut: 1, ecrase: true,
      couleurs: [[0.85, 0.12, 0.1], [0.92, 0.92, 0.92]], son: { ralenti: 28, max: 70 } },
    // Étape 42 : ✍️ la moto (rapide et très maniable).
    { id: "moto", nom: "La moto (genre Kawasaki Ninja)", modele: "moto", prix: 100, vitesseMax: 45.8, acceleration: 19, virage: 2.7, saut: 1.1,
      couleurs: [[0.35, 0.75, 0.08], [0.08, 0.08, 0.09]], son: { ralenti: 90, max: 300 } },
    // Étape 40 : ✍️ le taxi et la voiture de police (gyrophare et sirène : touche H).
    { id: "taxi", nom: "Le taxi", modele: "taxi", prix: 150, vitesseMax: 38.9, acceleration: 12, virage: 2.0, saut: 1,
      couleurs: [[1, 0.78, 0.05], [0.1, 0.1, 0.11]], son: { ralenti: 48, max: 125 } },
    { id: "police", nom: "La voiture de police", modele: "police", prix: 400, vitesseMax: 47.2, acceleration: 16, virage: 2.1, saut: 1, sirene: true,
      couleurs: [[0.95, 0.95, 0.97], [0.08, 0.15, 0.4]], son: { ralenti: 50, max: 150 } },
  ],

  // Étape 40 : le garage du GRAND PARCOURS. ✍️ Le kart (offert), puis des véhicules qui sont aussi dans
  // d'autres garages : on les écrit par leur nom (« buggy »…), le garage va chercher leur fiche.
  vehiculesGrandParcours: [
    { id: "kart", nom: "Le kart", modele: "kart", prix: 0, vitesseMax: 38.9, acceleration: 18, virage: 2.6, saut: 1,
      couleurs: [[0.9, 0.1, 0.45], [0.1, 0.1, 0.11]], son: { ralenti: 140, max: 420 } },
    "buggy",
    "quad",
    "rallye",
  ],

  // Étape 41 : le garage des MÉGA-RAMPES : les voitures de course (la piste est faite pour aller vite !).
  vehiculesCiel: ["classique", "porsche911", "aventador", "chiron", "f1", "rallye"],

  // Étape 40 : LES NITROS. ✍️ Des plaques au sol : dès que tu passes dessus, ça te propulse.
  nitro: {
    duree: 2.5, // s : le temps que dure la poussée
    facteur: 1.5, // la vitesse max est multipliée par 1,5 pendant la poussée…
    bonusMax: 16, // … mais elle ne gagne jamais plus de 16 m/s (58 km/h) : étape 41, sinon la Formule 1 s'envolait trop loin
    poussee: 26, // m/s² : la poussée s'ajoute à l'accélération, même sans appuyer sur ↑
    ralentissement: 9, // m/s² : après la poussée, la voiture revient doucement à sa vitesse max
  },

  // Étape 40 : le GRAND PARCOURS (comme un circuit Carrera). Une route qui monte, descend et passe sur des ponts.
  // points = le milieu de la route : [x, z, hauteur, ce qu'il y a jusqu'au point suivant]
  //   "route" (par défaut), "tremplin" (le bout qui relève pour sauter), "plateforme" (pas de route : on roule
  //   sur une plateforme), "vide" (pas de route du tout : il faut sauter par-dessus !).
  // Le dernier point est relié au premier : la route fait une boucle.
  grandParcours: {
    taille: 800, // m : la map fait 800 m × 800 m
    largeur: 14, // m : la largeur de la route
    epaisseur: 1, // m : l'épaisseur du tablier des ponts (on passe dessous s'il est assez haut)
    hauteurVoiture: 1.6, // m : une voiture se cogne sous un pont plus bas que ça
    points: [
      [0, 0, 0], [90, 0, 0], [150, 20, 4], [180, 70, 9], [175, 130, 10], [130, 170, 7], [70, 175, 3], [20, 150, 0],
      [-10, 100, 3], [5, 50, 9], [30, -45, 10], [10, -110, 6], [-50, -140, 0],
      [-100, -140, 0], // ✍️ la GRANDE RAMPE : de 0 à 14 m de haut
      [-160, -140, 14, "plateforme"], [-225, -125, 14, "plateforme"], // la plateforme à trous et à bosses
      [-225, -115, 14], [-225, -60, 14, "plateforme"], // un pont, puis la plateforme plate
      [-225, -20, 14], // ✍️ la longue ligne droite, qui monte doucement (avec des nitros)
      [-225, 150, 20, "tremplin"], [-225, 165, 21.5, "vide"], // le tremplin… et le CREUX à sauter (50 m)
      [-225, 215, 16], [-225, 280, 11], [-200, 322, 6], [-140, 338, 2], [-80, 305, 0], [-60, 230, 0], // l'arrivée du saut : une longue descente
      [-75, 110, 0], [-70, 40, 0], [-40, 5, 0],
    ],
    // Les plateformes : x, z = le centre ; longueur (le long de x) et largeur (le long de z) ; y = la hauteur.
    plateformes: [
      { nom: "plateforme à trous", x: -200, z: -140, longueur: 80, largeur: 50, y: 14,
        // ✍️ des trous (si tu tombes dedans… tu tombes en bas !) et des bosses
        trous: [{ x: -180, z: -140, longueur: 16, largeur: 24 }, { x: -202, z: -125, longueur: 14, largeur: 20 }, { x: -227, z: -150, longueur: 12, largeur: 30 }],
        bosses: [{ x: -166, z: -158 }, { x: -166, z: -122 }, { x: -180, z: -121 }, { x: -180, z: -160 }, { x: -202, z: -150 }, { x: -215, z: -140 }, { x: -238, z: -125 }] },
      { nom: "plateforme plate", x: -225, z: -40, longueur: 40, largeur: 40, y: 14, trous: [], bosses: [] },
    ],
    bosse: { rayon: 3.5, hauteur: 0.8 }, // m
    // Le creux sous le saut : un grand trou dans le sol, en pente douce sur les bords (pour en ressortir).
    creux: { x: -225, z: 190, longueur: 120, largeur: 50, profondeur: 8, pente: 12 },
    // ✍️ Les plaques de nitro : [numéro du morceau de route, où sur ce morceau (0 = au début, 1 = à la fin)]
    nitros: [[0, 0.6], [1, 0.5], [4, 0.4], [6, 0.6], [10, 0.4], [12, 0.5], [13, 0.15], [16, 0.5], [17, 0.5],
      [18, 0.3], [18, 0.6], [18, 0.9], [23, 0.5], [25, 0.5], [27, 0.5], [28, 0.4]],
    longueurNitro: 6, largeurNitro: 5, // m
    ecartPieces: 36, // m : une pièce tous les 36 m le long de la route
    graine: 40,
  },

  // Étape 39 : la VILLE. Une grille de rues (comme un damier) : entre les rues, des pâtés de maisons.
  ville: {
    blocs: 5, // 5 × 5 pâtés de maisons
    tailleBloc: 72, // m : la taille d'un pâté (avec ses trottoirs)
    largeurRue: 16, // m : 2 voies de 4 m, plus de la place
    voie: 4, // m : on roule à 4 m à droite du milieu de la rue
    trottoir: 3, // m
    ruelle: 6, // m : la petite rue qui coupe chaque pâté en 4 (on peut y passer, à pied ou en voiture)
    hauteurMin: 10, // m : les immeubles font entre 10 et 70 m de haut
    hauteurMax: 70,
    parcs: [[1, 1], [3, 3]], // ✍️ les pâtés qui sont des parcs (numéro de colonne, numéro de ligne)
    circulation: 16, // ✍️ le nombre de voitures qui circulent toutes seules
    vitesseCirculation: 11, // m/s (40 km/h, on est en ville !)
    feuVert: 8, // s : chaque feu reste vert 8 s, puis orange 2 s, puis rouge pendant que l'autre rue passe
    feuOrange: 2,
    garees: 14, // voitures garées le long des trottoirs (on peut les prendre !)
    pieces: 50, // ✍️ des pièces cachées un peu partout
    graine: 23,
    // Étape 50 : le nom des rues (on le voit sur les plaques aux carrefours, et en haut à gauche de l'écran).
    nomsRues: {
      estOuest: ["avenue Maxance", "rue des Pilotes", "boulevard du Turbo", "rue des Nitros", "avenue des Champions", "rue du Klaxon"],
      nordSud: ["rue Cyril", "boulevard de la Police", "rue des Pizzas", "avenue des Avions", "rue du Garage", "boulevard de la Mer"],
    },
    limiteVitesse: 50, // km/h : ce qui est écrit sur les panneaux (ce n'est qu'un panneau : la police ne flashe pas !)
    fenetresAllumees: { minimum: 0.05, force: 1.3 }, // la lumière des fenêtres = minimum + force × (1 − lumière du soleil)
    mobilier: { bouchesIncendie: 30, plaquesEgout: 70, bancs: 28, poubelles: 36 }, // combien de chaque sur les trottoirs et les rues
  },

  // Étape 42 : LA MAP ÉNORME. ✍️ La ville est sur une île au milieu de la mer. De grands ponts mènent à
  // d'autres îles, chacune avec un AÉROPORT. x, z en mètres ; angle = la direction de la piste d'atterrissage.
  archipel: {
    ileVille: 250, // m : l'île de la ville va de −250 à +250 (la ville fait 456 m)
    mer: -1.5, // m : la hauteur de l'eau
    ponts: [
      // ✍️ « Fais un pont qui relie à l'aéroport » : le pont de l'Est part de la rue n° 3, vers l'aéroport n° 1.
      { nom: "le pont de l'Est", de: [250, 44], a: [750, 44], largeur: 18, hauteur: 16 },
      { nom: "le pont du Nord", de: [-44, -250], a: [-44, -750], largeur: 18, hauteur: 16 },
    ],
    // Les îles avec un aéroport : leur centre, la direction de la piste, et si un pont y mène.
    aeroports: [
      { nom: "l'aéroport de l'Est", numero: 1, x: 1200, z: 50, angle: 0 },
      { nom: "l'aéroport du Nord", numero: 2, x: -38, z: -1200, angle: -Math.PI / 2 },
      { nom: "l'aéroport de l'île lointaine", numero: 3, x: -1500, z: 1400, angle: Math.PI / 2 }, // pas de pont : en avion (étape 44) !
    ],
    // La forme d'une île-aéroport (en mètres, u = le long de la piste, w = en travers). Toutes les îles sont pareilles.
    ile: { u: [-450, 450], w: [-350, 400] },
    parking: 12, // ✍️ des véhicules de tous les garages, garés devant chaque aérogare
    piecesParPont: 8,
    piecesParIle: 12,
  },

  // Étape 42 : LES MAGASINS. ✍️ Le personnage entre (E devant la porte) et achète des choses avec ses pièces.
  //   unique = on ne l'achète qu'une fois ; sinon on peut en acheter autant qu'on veut.
  magasins: {
    distancePorte: 4, // m : il faut être à moins de 4 m de la porte pour entrer
    noms: ["le magasin de sport", "le bazar de Maxance", "la boutique du coin", "le garage peinture"],
    articles: [
      { id: "baskets", nom: "Les baskets de course", icone: "👟", prix: 30, unique: true, texte: "Ton personnage court 2 fois plus vite" },
      { id: "casquette", nom: "La casquette dorée", icone: "🧢", prix: 15, unique: true, texte: "Une casquette qui brille comme de l'or" },
      { id: "lunettes", nom: "Les lunettes de soleil", icone: "🕶️", prix: 20, unique: true, texte: "Trop la classe" },
      { id: "klaxon", nom: "Le klaxon", icone: "📯", prix: 10, unique: true, texte: "Touche K en voiture : tut-tuuut !" },
      { id: "peinture", nom: "La peinture dorée", icone: "🎨", prix: 40, unique: false, texte: "Pour la voiture que tu as laissée dehors" },
      { id: "glace", nom: "Une glace", icone: "🍦", prix: 2, unique: false, texte: "Miam ! Elle ne sert à rien, mais elle est bonne" },
    ],
    couleurOr: [[1, 0.76, 0.18], [0.55, 0.38, 0.05]], // la peinture dorée (couleur 1 et couleur 2)
  },

  // Étape 44 : CE QUI VOLE. Ces véhicules attendent dans les aéroports (on monte avec E, comme dans une voiture).
  //   vol : "avion" ou "helico" ; vitesseMax (m/s) ; decollage = la vitesse qu'il faut pour voler (m/s) ;
  //   montee = la vitesse pour monter ou descendre (m/s) ; virage (rad/s) ; rayonMonter = on peut monter dedans
  //   à cette distance de son centre (un avion de ligne fait 34 m de long !).
  vehiculesAir: [
    { id: "petitAvion", nom: "Le petit avion", modele: "petitAvion", vol: "avion", vitesseMax: 55, acceleration: 9, decollage: 24, montee: 9, virage: 0.9,
      rayonMonter: 4, couleurs: [[0.9, 0.2, 0.2], [0.95, 0.95, 0.95]], son: { ralenti: 70, max: 160 } },
    { id: "avionDeLigne", nom: "L'avion de ligne", modele: "avionDeLigne", vol: "avion", vitesseMax: 95, acceleration: 6, decollage: 50, montee: 7, virage: 0.45,
      rayonMonter: 16, ligne: true, couleurs: [[0.1, 0.3, 0.75], [0.85, 0.15, 0.15]], son: { ralenti: 50, max: 120 } },
    { id: "avionChasse", nom: "L'avion de chasse", modele: "avionChasse", vol: "avion", vitesseMax: 160, acceleration: 22, decollage: 45, montee: 22, virage: 1.4,
      rayonMonter: 6, armes: true, couleurs: [[0.45, 0.5, 0.55], [0.2, 0.22, 0.25]], son: { ralenti: 90, max: 260 } },
    { id: "helico", nom: "L'hélicoptère", modele: "helico", vol: "helico", vitesseMax: 40, acceleration: 8, decollage: 0, montee: 9, virage: 1.5,
      rayonMonter: 5, couleurs: [[0.95, 0.55, 0.05], [0.15, 0.15, 0.18]], son: { ralenti: 35, max: 70 } },
  ],
  vol: {
    gravite: 12, // m/s² : ce qui fait tomber un avion trop lent (le « décrochage »)
    altitudeMax: 450, // m
    atterrissageDoux: 7, // m/s : toucher le sol plus vite que ça vers le bas = crash !
    paieVolDeLigne: 60, // ✍️ pièces gagnées en posant l'avion de ligne sur la piste d'un AUTRE aéroport
  },
  // Étape 44 : LES ARMES de l'avion de chasse. ✍️ Une mitrailleuse (F, tenue) et des petits missiles (G).
  armes: {
    balle: { vitesse: 450, vie: 1.6, cadence: 12, degats: 1 }, // m/s, s, balles par seconde
    missile: { vitesse: 140, vie: 6, recharge: 0.8, virage: 2.2, cone: 0.6, rayonExplosion: 10 }, // il suit sa cible (virage en rad/s)
    // ✍️ Les cibles d'entraînement, autour de l'île lointaine : des ballons dans le ciel et des cibles au sol.
    ballons: 16, ciblesAuSol: 6, paieBallon: 3, paieCibleSol: 5, retour: 30, // retour = les cibles reviennent après 30 s
  },

  // Étape 47 : LA MÉTÉO. ✍️ Elle change toute seule, toutes les 2 minutes, et elle change la conduite.
  //   adherence : 1 = la route accroche ; 0,3 = ça glisse beaucoup (la voiture continue tout droit en tournant).
  //   vent : la force du vent (m/s) ; visibilite : jusqu'où on voit (m) ; nuages : 0 = ciel bleu, 1 = tout couvert ;
  //   pluie, neige : combien de gouttes ou de flocons ; lumiere : la force du soleil (1 = plein soleil) ;
  //   eclairs : un éclair toutes les… secondes (0 = jamais).
  meteo: {
    duree: 120, // ✍️ s : chaque météo dure 2 minutes…
    transition: 12, // s : … et on passe doucement à la suivante en 12 secondes
    ordre: ["soleil", "vent", "brouillard", "pluie", "orage", "neige", "blizzard"],
    temps: {
      soleil: { nom: "Soleil", icone: "☀️", adherence: 1, vent: 0, visibilite: 1100, nuages: 0.15, pluie: 0, neige: 0, lumiere: 1, eclairs: 0 },
      vent: { nom: "Vent", icone: "🌬️", adherence: 1, vent: 9, visibilite: 1000, nuages: 0.45, pluie: 0, neige: 0, lumiere: 0.85, eclairs: 0 },
      brouillard: { nom: "Brouillard", icone: "🌫️", adherence: 0.9, vent: 1, visibilite: 90, nuages: 0.9, pluie: 0, neige: 0, lumiere: 0.45, eclairs: 0 },
      pluie: { nom: "Pluie", icone: "🌧️", adherence: 0.7, vent: 3, visibilite: 450, nuages: 0.85, pluie: 1, neige: 0, lumiere: 0.45, eclairs: 0 },
      orage: { nom: "Orage", icone: "⛈️", adherence: 0.6, vent: 7, visibilite: 320, nuages: 1, pluie: 1.6, neige: 0, lumiere: 0.25, eclairs: 6 },
      neige: { nom: "Neige", icone: "🌨️", adherence: 0.4, vent: 2, visibilite: 380, nuages: 0.9, pluie: 0, neige: 1, lumiere: 0.6, eclairs: 0 },
      blizzard: { nom: "Blizzard", icone: "❄️", adherence: 0.3, vent: 13, visibilite: 110, nuages: 1, pluie: 0, neige: 2.2, lumiere: 0.4, eclairs: 0 },
    },
    effetVent: 0.12, // une voiture est poussée par 12 % de la force du vent (un avion : 60 %)
    effetVentAvion: 0.6,
  },

  // Étape 45 : LA POLICE. ✍️ Emboutir une voiture fait venir la police, avec 1 à 5 étoiles selon la force du choc.
  police: {
    // ✍️ La force du choc (la vitesse à laquelle on fonce dans l'autre voiture, en m/s) → le nombre d'étoiles :
    // moins de 4 m/s (15 km/h) = 1 étoile ; moins de 8 = 2 ; moins de 13 = 3 ; moins de 20 = 4 ; plus = 5 (« à fond »).
    seuils: [4, 8, 13, 20],
    etoilesExplosion: 2, // une voiture qu'on fait exploser : +2 étoiles
    voituresParEtoile: 1, // 1 voiture de police par étoile (5 à 5 étoiles)
    vitesse: 30, // m/s : la vitesse des voitures de police (+ 2 m/s par étoile)
    vitesseParEtoile: 2,
    apparition: [140, 260], // m : les voitures de police arrivent entre 140 et 260 m de toi
    vue: 150, // ✍️ m : un policier te voit à moins de 150 m, si aucun immeuble ne cache la vue
    vueHelico: 260, // m : l'hélico, d'en haut, voit plus loin (et par-dessus les immeubles)
    avantDeClignoter: 6, // s : caché pendant 6 s → les étoiles clignotent…
    parEtoile: 5, // s : … puis une étoile s'éteint toutes les 5 s
    arret: { distance: 6, vitesse: 3, temps: 2 }, // ✍️ attrapé : un policier à moins de 6 m, et toi presque arrêté pendant 2 s
    helico: { hauteur: 45, vitesse: 34, retour: 20 }, // l'hélico (5 étoiles) ; abattu, un autre revient 20 s après
    commissariat: 40, // le numéro de l'immeuble du commissariat
  },

  // Étape 43 : LES PETITS BOULOTS. ✍️ Livreur de pizzas, chauffeur de taxi, vendeur au magasin, ramasser les poubelles.
  // On commence un boulot en allant dans son rond lumineux et en appuyant sur J (et J pour l'arrêter).
  // Le vendeur, lui, se fait dans n'importe quel magasin : J une fois entré.
  boulots: {
    rayonRond: 6, // m : la taille des ronds lumineux (départ d'un boulot, endroit où aller)
    pizzas: { immeuble: 15, livraisons: 3, temps: 50, paie: 10, bonus: 5 }, // temps (s) pour CHAQUE pizza ; bonus si on va 2 fois plus vite
    taxi: { clients: 3, paieParMetre: 0.04, paieMin: 8, vitesseArret: 2, tempsParMetre: 0.12, tempsMin: 30, doublePaieEnTaxi: true },
    vendeur: { clients: 8, temps: 6, paie: 3 }, // temps (s) pour servir chaque client
    poubelles: { nombre: 8, temps: 150, paie: 3, bonus: 15, rayon: 5, vitesseMax: 9, vehicules: ["camion", "camionnette"] },
  },

  // Étape 39 : le PERSONNAGE. ✍️ Il descend de la voiture pour en prendre une autre (touche E).
  pieton: {
    vitesse: 5, // m/s : il court
    recul: 2.5, // m/s : il recule plus lentement
    virage: 3, // rad/s : il tourne vite sur lui-même
    distanceMonter: 4, // m : il peut monter dans une voiture à moins de 4 m
    vitesseMaxPourDescendre: 3, // m/s : on ne descend pas d'une voiture qui roule vite !
  },

  // Étape 41 : les MÉGA-RAMPES. ✍️ Une piste en bois, toute seule dans le ciel, au-dessus des nuages,
  // avec des bords relevés (comme un toboggan), des nitros, de grands sauts, des véhicules à doubler,
  // une barre de dégâts, des drapeaux et une arrivée avec un chrono.
  // points = le milieu de la piste : [x, z, hauteur, ce qu'il y a jusqu'au point suivant] ("vide" = un saut !)
  rampes: {
    largeur: 12, // m : la largeur de la piste (entre les bords)
    bord: 1.6, // m : la hauteur des bords relevés
    nuages: -35, // m : la hauteur de la mer de nuages
    points: [
      [0, 0, 20], [90, 0, 20], [170, 0, 40], [230, 0, 40], [290, 0, 30], [330, 0, 30, "tremplin"], [345, 0, 32, "vide"], // saut n° 1 (25 m)
      [370, 0, 29], [430, 0, 29], [480, 30, 29], [500, 90, 35], [500, 160, 45], [480, 220, 45], [430, 260, 45], [370, 270, 45],
      [310, 270, 30], [250, 270, 25, "tremplin"], [235, 270, 27, "vide"], // saut n° 2 (40 m)
      [195, 270, 22], [140, 270, 22], [90, 250, 22], [40, 230, 30], [-40, 230, 55], [-100, 230, 55], // la MÉGA-RAMPE : 55 m de haut
      [-200, 230, 25], [-260, 230, 22, "tremplin"], [-275, 230, 25, "vide"], // saut n° 3 (60 m) : il faut les nitros !
      [-335, 230, 16], [-480, 230, 16], [-680, 230, 16], // après le grand saut : tout droit jusqu'à l'arrivée
    ],
    // ✍️ Les drapeaux : si tu tombes dans les nuages, tu repars du dernier drapeau passé (numéros des points).
    drapeaux: [0, 8, 14, 19, 23, 28],
    arrivee: 80, // m avant le bout de la piste : la ligne d'arrivée (après, il faut de la place pour freiner)
    nitros: [[1, 0.5], [4, 0.4], [10, 0.5], [15, 0.3], [15, 0.7], [19, 0.5], [24, 0.25], [24, 0.55], [24, 0.85], [28, 0.5]],
    longueurNitro: 6, largeurNitro: 5, // m
    // ✍️ Des véhicules qui roulent sur la piste : il faut les doubler sans les toucher.
    // Chacun fait des allers entre deux points (de, a), sur sa voie (m à gauche − ou à droite +), à sa vitesse (m/s).
    trafic: [
      { modele: "moto", nom: "la moto", de: 1, a: 4, voie: -2.5, vitesse: 14, depart: 0.3, couleurs: [[0.85, 0.1, 0.1], [0.1, 0.1, 0.11]] },
      { modele: "moto", nom: "la moto verte", de: 7, a: 15, voie: 2.5, vitesse: 19, depart: 0.2, couleurs: [[0.1, 0.7, 0.2], [0.1, 0.1, 0.11]] },
      { modele: "classique", nom: "la voiture rouge", de: 7, a: 15, voie: -2.5, vitesse: 16, depart: 0.55 },
      { modele: "moto", nom: "la moto bleue", de: 18, a: 24, voie: -2.5, vitesse: 20, depart: 0.15, couleurs: [[0.1, 0.35, 0.9], [0.95, 0.95, 0.95]] },
      { modele: "classique", nom: "la voiture rouge n° 2", de: 18, a: 24, voie: 2.5, vitesse: 15, depart: 0.5 },
    ],
    // ✍️ La barre de dégâts : chaque choc l'abîme ; à 100 %, la voiture est cassée (retour au drapeau, réparée).
    degatsParChoc: 3, // % de dégâts par m/s de choc (un seul choc compté par demi-seconde)
    chocMin: 2, // m/s : un frottement plus doux que ça n'abîme pas la voiture
    chuteMax: 45, // m sous le dernier drapeau : là, on est perdu dans les nuages
    ecartPieces: 30, // m : une pièce tous les 30 m
  },

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

  // Étape 48 : la nature (affichage/nature.js) et l'eau (affichage/eau.js).
  nature: {
    herbes: 14000, // touffes d'herbe par carte (en petits groupes de quelques touffes)
    fleurs: 2200, // bouquets de fleurs des champs par carte
    rochers: 160, // rochers par carte
    parTouffe: 7, // une « touffe » = jusqu'à 7 brins groupés…
    rayonTouffe: 2.5, // m : … dans un rond de 2,5 m
    tailleHerbe: [0.35, 0.8], // m : la hauteur d'une touffe (entre les deux)
    tailleRocher: [0.3, 1.6], // m
    parcelle: 80, // m : l'herbe est rangée par carrés de 80 m…
    distanceAffichage: 230, // m : … et on ne dessine que les carrés à moins de 230 m de la caméra
    flexion: 0.03, // m par m/s de vent : de combien le haut d'une touffe plie au vent
    especes: { feuillu: 0.45, sapin: 0.3, bouleau: 0.25 }, // la part de chaque espèce d'arbre
  },
  eau: {
    vitesseVagues: 0.012, // tours de texture par seconde (sans vent)
    effetVent: 0.0025, // + ça par m/s de vent
    vaguesCalmes: 0.45, // la force du relief des vagues sans vent…
    vaguesParVent: 0.06, // … plus ça par m/s de vent (tempête = grosses vagues)
  },

  // Étape 49 : les RESSORTS du monster truck. Quand les roues sont poussées vers le haut (une bosse, un atterrissage),
  // la caisse, elle, continue un peu vers le bas : le ressort s'écrase, puis la repousse… et elle rebondit.
  ressorts: {
    raideur: 110, // ✍️ (1/s²) plus c'est grand, plus le ressort est dur (il rebondit vite et peu)
    amortissement: 4.5, // (1/s) l'amortisseur freine le rebond : à 0, la caisse rebondirait pour toujours !
    transmission: 0.55, // la part du choc des roues qui passe dans la caisse
    course: 0.45, // m : le ressort ne peut pas s'écraser (ou s'étirer) de plus de 45 cm
    gros: 2.5, // m/s : à partir de ce choc, on l'écrit dans le journal
  },

  pasFixe: 1 / 120, // la boucle de jeu avance par petits pas de 1/120 s
};
