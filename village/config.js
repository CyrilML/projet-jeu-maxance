// 🎛️ LES RÉGLAGES DU VILLAGE
//
// Tous les nombres qui changent le jeu sont rangés ici, et nulle part ailleurs.
// « La carte est trop petite », « il y a trop d'eau », « la caméra va trop vite » : c'est ce fichier
// qu'on modifie.
//
// Unités : px (pixels), s (secondes), px/s (pixels par seconde).
// Les numéros d'étapes (« étape 2 »…) sont ceux du carnet du village (village/carnet.html).
// La carte est une grille de CASES : chaque case a une colonne et une ligne (comme une bataille navale).
// À l'écran, chaque case est dessinée en LOSANGE : c'est la vue « de biais » (isométrique).

window.Village = window.Village || {};

Village.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  version: 48,

  // La taille de l'écran du jeu n'est plus fixe depuis l'étape 2 : elle suit la fenêtre
  // (ordinateur, tablette, téléphone). Voir moteur/ecran.js.

  // La boucle de jeu avance par petits pas fixes de 1/120 s, comme dans les autres jeux.
  pasFixe: 1 / 120,

  carte: {
    // Étape 24 : ✍️ « quitte à agrandir la map » : 96 × 96 cases pour une nouvelle partie (64 × 64 avant).
    // Une partie déjà commencée garde sa carte (sinon tout son terrain changerait !).
    // Étape 32 : ✍️ « les maps doivent être immenses » : 256 × 256 cases (7 fois plus que 96 × 96).
    colonnes: 256,
    lignes: 256,
    tailleAncienne: 64, // la taille des cartes des parties commencées avant l'étape 24
    // Un losange : 2 fois plus large que haut. C'est ce qui donne l'impression de regarder « de biais ».
    largeurCase: 64, // px (au zoom 100 %)
    hauteurCase: 32, // px
  },

  // L'invention de la carte. Chaque case reçoit une ALTITUDE et une HUMIDITÉ entre 0 et 1,
  // tirées d'un « bruit » (un hasard tout doux, sans sauts brusques). Puis on range les cases
  // de la plus basse à la plus haute, et on découpe en PARTS (0,3 = 30 % des cases) :
  //   les 18 % les plus basses = eau profonde, jusqu'à 30 % = eau, jusqu'à 35 % = sable…
  // Comme ça, chaque carte a toujours à peu près autant d'eau et de montagnes.
  generation: {
    tailleDesCollines: 26, // étape 32 : la carte est immense : des lacs et des collines plus grands (14 avant) // en cases : plus c'est grand, plus les zones (lacs, forêts) sont grandes
    tailleDesForets: 14, // en cases (9 avant l'étape 32)
    eauProfonde: 0.18, // part des cases (les plus basses) en eau profonde
    eau: 0.3, // jusqu'à cette part : eau
    sable: 0.35, // jusqu'à cette part : plage de sable
    rochers: 0.91, // au-dessus de cette part : rochers (future carrière de pierre)
    montagne: 0.95, // au-dessus : montagne (futures mines) : les 5 % de cases les plus hautes
    foret: 0.56, // humidité au-dessus : forêt (sur l'herbe seulement)
    prairie: 0.3, // humidité en dessous : prairie fleurie
    densiteArbres: 0.75, // dans une forêt, chance qu'une case ait un arbre
    arbresIsoles: 0.03, // dans l'herbe, chance d'un arbre tout seul
    rayonDuVillage: 4, // en cases : autour de la place du village, toujours de l'herbe
    massifs: 9, // étape 32 : les zones rocheuses où dorment les filons (2 avant)
    rivieres: 8, // (étape 32 : 8, la carte est immense) // nombre de rivières qui descendent des montagnes (étape 24 : 3, la carte est plus grande)
  },

  camera: {
    vitesse: 700, // px/s quand on tient une flèche (au zoom 100 %)
    zoomMin: 0.35,
    zoomMax: 2,
    zoomDepart: 0.8, // étape 24 : un peu plus loin (les bâtiments sont plus gros)
    pasDeZoom: 1.15, // un cran de molette multiplie (ou divise) le zoom par 1,15
  },

  // Étape 2 : ✍️ le stock de départ, rangé dans l'entrepôt.
  // Étape 5 : ✍️ plus de stock au départ, pour ne pas frustrer le joueur (avant : 0, 20, 10, 6, 4).
  depart: { troncs: 5, planches: 30, pierres: 30, poissons: 12, viande: 8, charbon: 0, fer: 0, lingots: 0, outils: 0, ble: 0, farine: 0, pain: 0, or: 0, bijoux: 0, eau: 0, foin: 0, lait: 0, beurre: 0, fromage: 0, yaourt: 0, oeufs: 0, laine: 0, tissu: 0, vetements: 0, jambon: 0 }, // étape 16 : les poules, les moutons, les cochons ; étape 7 : le charbon ; étape 8 : le fer, les lingots, les outils ; étape 15 : l'élevage

  // Étape 8 : la fiche de chaque ressource (son emoji et son nom). Tous les panneaux la lisent ici.
  ressources: {
    troncs: { emoji: "🪵", nom: "troncs", info: "Du bois brut, coupé dans la forêt. La scierie en fait des planches, et il chauffe les maisons en hiver." },
    planches: { emoji: "🟫", nom: "planches", info: "Le matériau de base : presque tout se construit avec. La scierie les fait avec des troncs." },
    pierres: { emoji: "🪨", nom: "pierres", info: "Des pierres taillées à la carrière, pour les bâtiments solides." },
    poissons: { emoji: "🐟", nom: "poissons", info: "Pêchés au bord de l'eau. Une des nourritures de base des habitants." },
    viande: { emoji: "🍖", nom: "viande", info: "Rapportée par le chasseur ou la porcherie. Une des nourritures de base des habitants." },
    charbon: { emoji: "⚫", nom: "charbon", age: 1, info: "Creusé par une mine posée sur un filon noir (des paillettes noires que le géologue a trouvées). Il fait chauffer les fourneaux." }, // age : l'âge où cette ressource apparaît (étape 11)
    fer: { emoji: "🟤", nom: "minerai de fer", age: 2, info: "Le minerai brut, tel qu'il sort de la mine de fer (sur des paillettes rousses). Il faut le fondre pour s'en servir." },
    lingots: { emoji: "🔩", nom: "lingots", age: 2, info: "Du fer fondu à la fonderie, prêt à être travaillé." },
    outils: { emoji: "🔨", nom: "outils", age: 2, info: "Fabriqués à la forge. Les bâtiments les plus avancés en demandent." },
    // Étape 11 : le bourg
    ble: { emoji: "🌾", nom: "blé", age: 3, info: "Cultivé dans les champs de la ferme (pas en hiver)." },
    farine: { emoji: "⚪", nom: "farine", age: 3, info: "Le blé écrasé par le moulin. La boulangerie en fait du pain." },
    pain: { emoji: "🍞", nom: "pain", age: 3, info: "Cuit à la boulangerie. Au bourg, les habitants en veulent à chaque repas." },
    or: { emoji: "🟡", nom: "pépites d'or", age: 3, info: "Des pépites creusées dans une mine d'or (sur des paillettes dorées). L'orfèvre en fait des bijoux." },
    bijoux: { emoji: "💍", nom: "bijoux", age: 3, info: "Fabriqués par l'orfèvre. Ils valent très cher au marché." },
    // Étape 15 : ✍️ l'élevage et la laiterie. La chaîne s'agrandit à chaque âge (✍️ « au fil des niveaux ») :
    //   🛖 hameau : 💧 eau + 🌿 foin → 🐄 étable → 🥛 lait
    //   🏡 village : 🥛 → 🧈 beurre (la laiterie), et le vétérinaire 🩺 (les vaches peuvent tomber malades)
    //   🏰 bourg : 🥛 → 🧀 fromage (la fromagerie) et 🍶 yaourt (la crèmerie)
    eau: { emoji: "💧", nom: "seaux d'eau", age: 1, info: "Puisée au puits. Les animaux en boivent." },
    foin: { emoji: "🌿", nom: "bottes de foin", age: 1, info: "De l'herbe séchée par le faneur, à faire avant l'hiver. Les animaux le mangent." },
    lait: { emoji: "🥛", nom: "bidons de lait", age: 1, info: "Donné par les vaches de l'étable. La base du beurre, du fromage et du yaourt." },
    beurre: { emoji: "🧈", nom: "mottes de beurre", age: 2, info: "Baratté à la laiterie avec du lait." },
    fromage: { emoji: "🧀", nom: "fromages", age: 3, info: "Affiné à la fromagerie avec du lait." },
    yaourt: { emoji: "🍶", nom: "pots de yaourt", age: 3, info: "Préparé à la crèmerie avec du lait." },
    // Étape 16 : ✍️ la suite de l'élevage (1C, partie B), elle aussi âge par âge :
    //   🛖 hameau : 🐔 poulailler → 🥚 œufs
    //   🏡 village : 🐑 bergerie → 🧶 laine → 🧵 tisserand → tissu ; 🐖 porcherie → 🍖 viande
    //   🏰 bourg : 🧵 tissu → ✂️ tailleur → 👕 vêtements ; 🍖 viande + ⚫ charbon → 🥓 charcuterie → jambon
    oeufs: { emoji: "🥚", nom: "œufs", age: 1, info: "Pondus par les poules du poulailler." },
    laine: { emoji: "🧶", nom: "pelotes de laine", age: 2, info: "Tondue sur les moutons de la bergerie. Le tisserand en fait du tissu." },
    tissu: { emoji: "🧵", nom: "rouleaux de tissu", age: 2, info: "Tissé avec la laine. Le tailleur en fait des vêtements." },
    vetements: { emoji: "👕", nom: "vêtements", age: 3, info: "Cousus par le tailleur. Au bourg, les habitants usent leurs habits et en prennent des neufs." },
    jambon: { emoji: "🥓", nom: "jambons", age: 3, info: "Fumé à la charcuterie, avec de la viande et du charbon." },
  },

  // Étape 25 : ✍️ l'INVENTAIRE en pleine page (touche I, ou 🎒 dans la barre du stock). Les ressources y sont rangées
  // par familles ; toucher une icône dit ce que c'est (son « info », plus haut), qui la fabrique et à quoi elle sert.
  // La barre du haut ne montre plus que les ressources de base (« barre »).
  inventaire: {
    barre: ["troncs", "planches", "pierres", "poissons", "viande"],
    familles: [
      { nom: "🪵 Construction", ressources: ["troncs", "planches", "pierres"] },
      { nom: "🍽️ Nourriture et douceurs", ressources: ["poissons", "viande", "pain", "oeufs", "lait", "beurre", "fromage", "yaourt", "jambon"] },
      { nom: "⛏️ Mines et métal", ressources: ["charbon", "fer", "lingots", "outils", "or", "bijoux"] },
      { nom: "🌾 Champs, élevage et habits", ressources: ["ble", "farine", "eau", "foin", "laine", "tissu", "vetements"] },
    ],
  },

  // Étape 2 : les bâtiments. Depuis l'étape 3, le coût est RÉSERVÉ quand on pose le chantier,
  // puis les porteurs apportent les matériaux un par un.
  //   construction : durée du chantier (s) ; rayon : jusqu'où l'ouvrier va travailler (en cases).
  // Étape 17 : ✍️ Maxance trouvait le périmètre trop petit : les rayons sont doublés (bûcheron 6 → 12…).
  // Étape 26 : ✍️ « ils ne vont pas assez loin » : encore + 50 % pour tous (choix de Maxance).
  batiments: {
    bucheron: { cout: { planches: 3 }, construction: 8, rayon: 18 },
    forestier: { cout: { planches: 3 }, construction: 8, rayon: 14 },
    scierie: { cout: { planches: 4, pierres: 2 }, construction: 12 },
    carriere: { cout: { planches: 3 }, construction: 8, rayon: 18 },
    pecheur: { cout: { planches: 3 }, construction: 8, rayon: 15 }, // étape 4
    chasseur: { cout: { planches: 3 }, construction: 8, rayon: 21 }, // étape 4
    geologue: { cout: { planches: 3, pierres: 1 }, construction: 8, rayon: 21 }, // étape 5
    universite: { cout: { planches: 12, pierres: 10 }, construction: 15 }, // étape 7 : les recherches
    mineCharbon: { cout: { planches: 6, pierres: 3 }, construction: 12 }, // étape 7 : au pied d'un filon de charbon
    // Étape 8
    hutte: { cout: { planches: 4 }, construction: 8 }, // 🛖 un logement (3 places)
    maison: { cout: { planches: 6, pierres: 6 }, construction: 14 }, // 🏠 un logement plus grand (6 places)
    mineFer: { cout: { planches: 6, pierres: 4 }, construction: 12 }, // au pied d'un filon de fer
    fonderie: { cout: { planches: 8, pierres: 12 }, construction: 15 },
    forge: { cout: { planches: 8, pierres: 6, lingots: 2 }, construction: 15 },
    marche: { cout: { planches: 15, pierres: 10 }, construction: 15 },
    // Étape 11 : le bourg
    ferme: { cout: { planches: 10, pierres: 4, outils: 1 }, construction: 14 },
    moulin: { cout: { planches: 16, pierres: 12, outils: 2 }, construction: 20 },
    boulangerie: { cout: { planches: 12, pierres: 14, outils: 2 }, construction: 18 },
    mineOr: { cout: { planches: 10, pierres: 8, outils: 3 }, construction: 16 },
    orfevre: { cout: { planches: 12, pierres: 16, lingots: 4, outils: 2 }, construction: 20 },
    macon: { cout: { planches: 10, pierres: 12 }, construction: 14, rayon: 14 }, // étape 12 : le maçon-couvreur
    // Étape 15 : l'élevage
    puits: { cout: { planches: 3, pierres: 6 }, construction: 10 },
    faneur: { cout: { planches: 6 }, construction: 8 },
    etable: { cout: { planches: 10, pierres: 4 }, construction: 14 },
    laiterie: { cout: { planches: 10, pierres: 8, outils: 1 }, construction: 15 },
    veterinaire: { cout: { planches: 10, pierres: 6, outils: 1 }, construction: 14, rayon: 16 },
    fromagerie: { cout: { planches: 12, pierres: 16, outils: 2 }, construction: 18 },
    cremerie: { cout: { planches: 12, pierres: 10, outils: 2 }, construction: 16 },
    // Étape 16
    poulailler: { cout: { planches: 6 }, construction: 8 },
    bergerie: { cout: { planches: 10, pierres: 4 }, construction: 14 },
    porcherie: { cout: { planches: 8, pierres: 6 }, construction: 12 },
    tisserand: { cout: { planches: 10, pierres: 6, outils: 1 }, construction: 15 },
    tailleur: { cout: { planches: 12, pierres: 10, outils: 2 }, construction: 16 },
    charcuterie: { cout: { planches: 12, pierres: 14, outils: 2 }, construction: 16 },
    // Étape 17 : ✍️ un 2e (et un 3e) ENTREPÔT, très cher : c'est un bâtiment stratégique
    depot: { cout: { planches: 120, pierres: 90, charbon: 20 }, construction: 40 },
    monument: { cout: { planches: 80, pierres: 80, outils: 5 }, construction: 40 }, // étape 31 : ses fondations (puis 4 paliers)
    centrale: { cout: { pierres: 200, lingots: 40, outils: 20 }, construction: 60 }, // étape 34
    acierie: { cout: { planches: 100, pierres: 150, lingots: 30, outils: 15 }, construction: 50 },
    filature: { cout: { planches: 120, pierres: 80, lingots: 20, outils: 10 }, construction: 45 }, // étape 19 : dès le hameau (sans lingots ni outils)
    pompage: { cout: { pierres: 120, lingots: 25, outils: 10 }, construction: 40 }, // étape 35
    epuration: { cout: { pierres: 140, lingots: 20, outils: 10 }, construction: 40 },
    manoir: { cout: { planches: 12, pierres: 16, outils: 2 }, construction: 20 }, // étape 18 : on ne la construit pas, une maison le DEVIENT
  },
  // Étape 18 : ✍️ les CLASSES D'HABITANTS suivent leur logement (voir logique/classes.js).
  //   evolution : ce que devient chaque logement, à partir de quel âge, et avec quels matériaux.
  //   Il faut que les besoins de la classe suivante soient remplis pendant « delai » secondes.
  classes: {
    liste: [
      { id: "paysans", nom: "Paysans", emoji: "👨‍🌾", logements: ["entrepot", "hutte", "depot"], impot: 0 },
      { id: "artisans", nom: "Artisans", emoji: "👷", logements: ["maison"], impot: 1 },
      { id: "bourgeois", nom: "Bourgeois", emoji: "🎩", logements: ["manoir"], impot: 3 },
      { id: "citadins", nom: "Citadins", emoji: "🧑‍💼", logements: ["immeuble"], impot: 4 }, // étape 35
    ],
    evolution: {
      hutte: { vers: "maison", age: 2, cout: { planches: 6, pierres: 6 } },
      maison: { vers: "manoir", age: 3, cout: { planches: 12, pierres: 16, outils: 2 } },
      // Étape 35 : ✍️ « des maisons plus grandes » : avec ⚡ + 🚰 + 🚽, la maison bourgeoise monte en IMMEUBLE (20 lits)
      manoir: { vers: "immeuble", age: 5, cout: { pierres: 30, lingots: 6, planches: 10 }, reseaux: true },
    },
    delai: 60, // s : les besoins doivent être remplis pendant 1 minute
    verification: 5, // s entre deux vérifications
    impots: 60, // s : les impôts tombent toutes les minutes (1 🪙 par artisan, 3 🪙 par bourgeois)
    bonheurBourgeois: 60, // % de bonheur qu'il faut pour des bourgeois
  },
  // Étape 17 : ✍️ les ENTREPÔTS SECONDAIRES. Le village s'étale vite : un 2e entrepôt, loin du premier,
  // a ses propres manutentionnaires (3 places, et 4 lits). Le stock est partagé (c'est le même village),
  // mais chaque livraison est faite par les porteurs de l'entrepôt le plus proche par la route.
  // Si ces porteurs sont tous occupés depuis plus de 15 s, ceux d'un autre entrepôt viennent aider.
  // Étape 24 : ✍️ « même avec un 2e entrepôt, ça ne suffit pas ». La parade : chaque entrepôt gagne 1 place de porteur
  // pour 4 bâtiments qu'il livre (le travail fait venir des porteurs). Et 4 entrepôts secondaires au plus, chacun
  // 1,5 fois plus cher que le précédent.
  depot: { porteurs: 3, max: 4, aide: 15, parBatiments: 4, prixEnPlus: 1.5,
    // Étape 40 : ✍️ chaque entrepôt secondaire a son bouton « Agrandir » : +2 porteurs par niveau, 4 niveaux au plus
    parNiveau: 2, niveauMax: 4, prix: { planches: 40, pierres: 30 }, prixPieces: 40, facteurPrix: 2 },
  // Étape 40 : ✍️ « une seule université peut être construite ; une fois faite, elle est grisée. Idem pour le marché. »
  uniques: ["universite", "marche", "monument"],

  // Étape 8 : les ATELIERS transforment ce que les porteurs leur apportent (les RECETTES).
  //   entrees : ce qu'il faut pour UNE fabrication ; sorties : ce qui sort ; duree : en s ;
  //   bonus : la clé des recherches qui accélèrent cet atelier.
  ateliers: {
    scierie: { entrees: { troncs: 1 }, sorties: { planches: 2 }, duree: 6, bonus: "scier" },
    fonderie: { entrees: { fer: 1, charbon: 1 }, sorties: { lingots: 1 }, duree: 10, bonus: "fondre" }, // ✍️ 1A : simple
    // Étape 34 : l'époque industrielle. La centrale brûle du charbon (elle ne fabrique rien : elle fait de l'électricité).
    // « electrique » : une usine qui ne marche PAS sans électricité.
    centrale: { entrees: { charbon: 1 }, sorties: {}, duree: 15, bonus: "fondre" },
    acierie: { entrees: { fer: 2, charbon: 1 }, sorties: { lingots: 4 }, duree: 12, bonus: "fondre", electrique: true },
    filature: { entrees: { laine: 2 }, sorties: { tissu: 3 }, duree: 10, bonus: "tisser", electrique: true },
    forge: { entrees: { lingots: 1, planches: 1 }, sorties: { outils: 1 }, duree: 12, bonus: "forger" },
    // Étape 11 : le pain et l'or. La ferme n'a besoin de rien… sauf qu'il ne fasse pas l'hiver !
    ferme: { entrees: {}, sorties: { ble: 2 }, duree: 14, bonus: "cultiver", pasEnHiver: true, raisonHiver: "c'est l'hiver, le blé ne pousse pas" },
    moulin: { entrees: { ble: 2 }, sorties: { farine: 1 }, duree: 8, bonus: "moudre" },
    boulangerie: { entrees: { farine: 1, troncs: 1 }, sorties: { pain: 3 }, duree: 10, bonus: "cuire" }, // étape 19 : 3 pains (2 avant) // le tronc chauffe le four
    orfevre: { entrees: { or: 2, charbon: 1 }, sorties: { bijoux: 1 }, duree: 20, bonus: "orfevrerie" },
    // Étape 15 : ✍️ l'élevage. « hiver » : ce qu'il faut EN PLUS en hiver (✍️ 3C : du foin, l'herbe est sous la neige).
    puits: { entrees: {}, sorties: { eau: 2 }, duree: 6, bonus: "puiser" },
    faneur: { entrees: {}, sorties: { foin: 2 }, duree: 10, bonus: "faner", pasEnHiver: true, raisonHiver: "c'est l'hiver, l'herbe ne pousse pas (le foin doit être fait avant !)" },
    etable: { entrees: { eau: 1 }, hiver: { foin: 1 }, sorties: { lait: 2 }, duree: 12, bonus: "traire" },
    laiterie: { entrees: { lait: 2 }, sorties: { beurre: 1 }, duree: 10, bonus: "baratter" },
    fromagerie: { entrees: { lait: 2 }, sorties: { fromage: 1 }, duree: 18, bonus: "affiner" },
    cremerie: { entrees: { lait: 2 }, sorties: { yaourt: 2 }, duree: 12, bonus: "affiner" },
    // Étape 16 : les poules boivent ; les moutons et les cochons boivent, et mangent du foin en hiver
    poulailler: { entrees: { eau: 1 }, sorties: { oeufs: 2 }, duree: 10, bonus: "pondre" },
    bergerie: { entrees: { eau: 1 }, hiver: { foin: 1 }, sorties: { laine: 2 }, duree: 16, bonus: "tondre" },
    porcherie: { entrees: { eau: 1 }, hiver: { foin: 1 }, sorties: { viande: 4 }, duree: 14, bonus: "engraisser" }, // étape 19 : 4 viandes (3 avant)
    tisserand: { entrees: { laine: 2 }, sorties: { tissu: 1 }, duree: 14, bonus: "tisser" },
    tailleur: { entrees: { tissu: 1 }, sorties: { vetements: 1 }, duree: 16, bonus: "coudre" },
    charcuterie: { entrees: { viande: 2, charbon: 1 }, sorties: { jambon: 2 }, duree: 16, bonus: "fumer" }, // le charbon fume le jambon
  },

  // Étape 15 : ✍️ (3C) les vaches peuvent tomber MALADES, à partir du village. Une étable malade ne donne plus
  // de lait, et la maladie peut passer aux étables voisines ! Le VÉTÉRINAIRE 🩺 vient la soigner.
  // Sans vétérinaire, les vaches guérissent toutes seules… mais au bout de 5 minutes.
  elevage: {
    ageMaladies: 2, // à partir de quel âge (2 = le village)
    chance: 0.03, // chance par minute qu'une étable tombe malade
    manque: 3, // × 3 quand les vaches manquent d'eau ou de foin (elles s'affaiblissent)
    contagion: 0.25, // chance par minute d'attraper la maladie d'une étable malade voisine
    rayonContagion: 4, // en cases
    guerirSeule: 300, // s : sans vétérinaire, la maladie passe toute seule au bout de 5 minutes
    vaches: 3, // vaches dessinées dans l'enclos de chaque étable
    // Étape 16 : tous les TROUPEAUX peuvent tomber malades. La maladie ne passe qu'aux animaux de la même sorte.
    troupeaux: {
      etable: { animal: "vache", noms: "les vaches", nombre: 3 },
      poulailler: { animal: "poule", noms: "les poules", nombre: 4 },
      bergerie: { animal: "mouton", noms: "les moutons", nombre: 3 },
      porcherie: { animal: "cochon", noms: "les cochons", nombre: 3 },
    },
  },
  // Étape 16 : ✍️ les VÊTEMENTS 👕, à partir du bourg. Tous les 10 minutes, chaque habitant use ses habits et
  // en prend des neufs à l'entrepôt (s'il y en a). Bien habillés, les habitants sont plus heureux :
  //   bonheur + 10 × la part des habitants qui ont eu des habits neufs.
  habits: { age: 3, intervalle: 600, points: 10 },

  // Étape 15 : ✍️ (2C, partie A) le BONHEUR des habitants, une jauge de 0 à 100 %.
  //   bonheur = base + ventre plein + goûts variés + confort − froid − sans pain
  //   ventre : 30 points × la part des habitants qui ont mangé ;
  //   goûts : 8 points par aliment différent mangé ces 10 dernières minutes (5 au plus = 40 points) ;
  //   confort : 10 points × la part des habitants qui ont un lit dans une MAISON (pas une hutte ni une tente).
  // La jauge ne saute pas d'un coup : elle avance de 0,5 point par seconde vers ce qu'elle devrait valoir.
  //   moins de 45 % : 😢 triste (15 % moins vite, plus personne n'arrive au village) ;
  //   70 % et plus : 😊 content (10 % plus vite, les villageois arrivent 1,5 fois plus souvent) ;
  //   85 % et plus : 😄 ravi (20 % plus vite, ils arrivent 2 fois plus souvent).
  bonheur: {
    base: 15, ventre: 30, parGout: 8, goutsMax: 5, memoire: 600, confort: 10, froid: 15, sansPain: 15,
    classes: 10, // étape 18 : 10 points × la part des habitants dont la classe a tous ses besoins
    lissage: 0.5, // points par seconde
    triste: 45, content: 70, ravi: 85,
    vitesse: { triste: 0.85, normal: 1, content: 1.1, ravi: 1.2 },
    arrivee: { triste: 0, normal: 1, content: 1.5, ravi: 2 },
  },
  // Étape 15 : les DOUCEURS. À chaque repas, en plus du plat, chacun prend une douceur s'il y en a
  // (celle qu'il n'a pas goûtée depuis le plus longtemps) : ça varie les goûts !
  // Étape 16 : + les œufs et le jambon
  douceurs: ["lait", "beurre", "fromage", "yaourt", "oeufs", "jambon"],
  // Étape 8 : les MINES. Chacune creuse le filon de sa sorte, juste à côté d'elle.
  // Étape 22 : ✍️ « la ferme doit être plus grande, avec un champ ; idem pour les animaux ». Ces bâtiments prennent
  // PLUSIEURS cases : en plus de la leur, les cases voisines (en colonnes et lignes de décalage) pour les champs et
  // les enclos. [0, -1] est sous le long bâtiment ; [1, 0] et [1, -1] sont les champs ou les enclos, à sa droite.
  // Étape 24 : ✍️ « les bâtiments doivent être beaucoup plus grands ». Presque tous prennent un BLOC de 2 × 2 cases
  // (leur case, plus [0, −1], [1, 0] et [1, −1]) ; seuls les petits restent sur 1 case. Les champs et les enclos
  // sont EN PLUS, sur la colonne à droite du bloc ([2, 0] et [2, −1]).
  // Étape 28 : ✍️ « encore une fois trop petits… les tailles peuvent varier, même 5 × 5 ». Chaque bâtiment a la taille
  // de son BLOC (en cases de côté) : 3 × 3 par défaut, 4 × 4 pour les grands, 2 × 2 pour les cabanes, 1 × 1 pour les
  // logements et le puits. Les champs et les enclos sont la colonne juste à droite du bloc.
  // (Une partie commencée avant : ses bâtiments sont agrandis sur place, ou déplacés ; s'il n'y a vraiment pas la
  // place, ils gardent la plus grande taille possible.)
  tailles: {
    hutte: 1, maison: 1, puits: 1,
    manoir: 2, bucheron: 2, forestier: 2, pecheur: 2, chasseur: 2, geologue: 2, poulailler: 2, veterinaire: 2,
    entrepot: 4, depot: 4, universite: 4, moulin: 4, marche: 4, fonderie: 4, ferme: 4,
    monument: 5, // étape 31 : ✍️ « même 5 × 5 »
    centrale: 4, acierie: 4, filature: 4, // étape 34 : les usines
    pompage: 3, epuration: 3, immeuble: 2, // étape 35
  },
  tailleParDefaut: 3,
  champs: {
    ferme: [[2, 0], [2, -1]],
    etable: [[2, 0], [2, -1]],
    bergerie: [[2, 0], [2, -1]],
    porcherie: [[2, 0], [2, -1]],
    poulailler: [[2, 0]],
  },
  // Étape 21 : ✍️ « les mines sont trop éloignées » : la cabane du mineur peut être à 4 cases du filon (1 avant).
  // Étape 26 : ✍️ « les mineurs ne voient pas les filons des montagnes un peu plus loin » : 12 cases (choix de Maxance).
  // Mais le mineur MARCHE jusqu'au filon et revient avec son morceau : plus le filon est loin, plus c'est long
  // (aller-retour à la vitesse des ouvriers). Il creuse toujours le filon le plus proche d'abord.
  // Étape 38 : ✍️ les GRANDS GISEMENTS de minerai, visibles dès le début (logique/carte.js). Pour chaque minerai : combien,
  // leur rayon (en cases), et à quelle distance du village est le premier (pour pouvoir commencer).
  gisements: {
    minerais: {
      charbon: { nombre: 7, rayon: 2.4, premier: [12, 26] },
      fer: { nombre: 6, rayon: 2.2, premier: [18, 34] },
      or: { nombre: 3, rayon: 1.8, premier: [28, 48] },
      // Étape 39 : ✍️ « que les carrières de pierre soient comme les filons, juste à certains endroits » (ajoutés en dernier :
      // les autres gisements d'une partie commencée restent à leur place)
      pierres: { nombre: 10, rayon: 2.2, premier: [8, 16], ecart: 12 },
    },
    ecart: 22, // jamais deux gisements à moins de 22 cases
    loinMin: 30, // les autres : à 30 cases du village au moins
  },
  // Étape 38 : ✍️ le placement des bâtiments : l'aimant colle à une route à 2 cases au plus ; la grille fait 9 cases autour,
  // et les lignes guides montrent les voisins alignés jusqu'à 30 cases.
  placement: { aimant: 2, grille: 9, guides: 30 },
  // Étape 38 : quand une mine est épuisée, le géologue vient trouver une nouvelle veine dessous
  recharge: { quantite: 60, duree: 20 }, // 60 morceaux de minerai, 20 s de travail
  rayonMine: 12,
  // Étape 28 : ✍️ « plus de montagnes : des filons que le géologue trouve, et une mine qui creuse dans le sol ».
  // Les filons sont CACHÉS sous le sol rocheux (là où étaient les montagnes). Le géologue les révèle (des paillettes
  // apparaissent) : tous les filons à 3 cases au plus de l'endroit qu'il explore. La mine se pose SUR un filon
  // découvert, ou à 3 cases au plus de son bloc (rayonPoseMine).
  rayonPoseMine: 3,
  rayonRevele: 3,
  mines: {
    mineCharbon: { filon: "charbon" },
    mineFer: { filon: "fer" },
    mineOr: { filon: "or" }, // étape 11
    carriere: { filon: "pierres" }, // étape 39 : la carrière creuse un gisement de pierre, comme une mine
  },

  // Étape 8 : ✍️ 2B, chaque ouvrier a besoin d'une PLACE pour dormir. Le campement (les tentes autour de
  // l'entrepôt) loge 6 ouvriers ; chaque hutte en loge 3 de plus, chaque maison 6.
  // (Les porteurs, eux, dorment à l'entrepôt : ils ne comptent pas.)
  // Étape 13 : ✍️ les porteurs (manutentionnaires) et les villageois sans travail dorment aussi quelque part :
  // le campement passe à 10 places.
  logement: { entrepot: 11, hutte: 3, maison: 6, depot: 4, manoir: 10, immeuble: 20 }, // étape 18 : la maison bourgeoise ; étape 20 : 11 au campement (pour le 4e porteur) // étape 17 : 4 lits dans chaque entrepôt secondaire

  // Étape 13 : ✍️ (1B) les VILLAGEOIS. Ils arrivent au village quand il y a un lit libre et à manger,
  // se promènent près du feu, et vont travailler là où on a besoin d'eux : chaque cabane en prend un,
  // et l'entrepôt en prend comme manutentionnaires (ses places dépendent de son niveau).
  villageois: {
    depart: 3, // villageois sans travail au début d'une partie (en plus des 3 manutentionnaires)
    arrivee: 20, // s entre deux arrivées (s'il y a un lit libre et au moins 2 repas en stock)
    arriveeTravail: 7, // étape 47 : quand des bâtiments attendent un ouvrier, un villageois arrive toutes les 7 s
    vitesse: 1.2, // cases par seconde quand ils vont au travail (0,6 en se promenant)
    promenade: 3, // cases autour du feu de camp
    // Étape 19 : ✍️ Maxance trouvait qu'il fallait une ÉNORME quantité de nourriture. La mesure : sur 46 habitants,
    // 35 n'avaient pas de travail (chaque hutte faisait venir 3 bouches de plus) ! Maintenant, un villageois
    // n'arrive que s'il y a du travail pour lui, ou s'il y a moins de 2 villageois qui attendent déjà.
    attenteMax: 2,
  },

  // Étape 13 : ✍️ (2B) l'ENTREPÔT s'agrandit pour accueillir plus de manutentionnaires (les porteurs).
  //   places = 3 + 2 × (niveau − 1) + celles achetées à la boutique ; niveau 5 au plus.
  //   prix pour passer au niveau suivant = prix × facteurPrix^(niveau − 1)
  // Étape 20 : ✍️ 294 livraisons en retard chez Maxance ! 4 places au départ (3 avant), + 3 par niveau (2 avant).
  entrepot: { porteurs: 4, parNiveau: 3, niveauMax: 5, prix: { planches: 30, pierres: 20 }, prixPieces: 40, facteurPrix: 2 },

  // Étape 13 : ✍️ les AMÉLIORATIONS de chaque bâtiment (2 niveaux au plus), payées tout de suite avec le stock.
  //   effet : le temps de travail de CE bâtiment est multiplié par ce nombre (0,8 = 20 % plus rapide).
  //   Pour l'entrepôt, l'effet « porteurs » multiplie la vitesse des porteurs.
  //   La différence avec l'université : une recherche marche pour TOUT le village ; une amélioration,
  //   seulement pour le bâtiment qu'on améliore (4 bûcherons = 4 améliorations à payer).
  ameliorations: {
    bucheron: [{ nom: "Hache aiguisée", emoji: "🪓", age: 0, cout: { planches: 6, pierres: 4 }, effet: 0.8 }, { nom: "Hache en fer", emoji: "⚒️", age: 2, cout: { planches: 10, outils: 2 }, effet: 0.7 }],
    forestier: [{ nom: "Arrosoir", emoji: "🪣", age: 0, cout: { planches: 6, pierres: 2 }, effet: 0.8 }, { nom: "Pelle en fer", emoji: "⚒️", age: 2, cout: { planches: 8, outils: 2 }, effet: 0.7 }],
    carriere: [{ nom: "Masse et coins", emoji: "🔨", age: 0, cout: { planches: 8 }, effet: 0.8 }, { nom: "Pic en acier", emoji: "⛏️", age: 2, cout: { planches: 6, outils: 3 }, effet: 0.7 }],
    pecheur: [{ nom: "Barque", emoji: "🛶", age: 0, cout: { planches: 10 }, effet: 0.8 }, { nom: "Grand filet", emoji: "🥅", age: 1, cout: { planches: 12, pierres: 4 }, effet: 0.7 }],
    chasseur: [{ nom: "Arc long", emoji: "🏹", age: 0, cout: { planches: 8 }, effet: 0.8 }, { nom: "Chien de chasse", emoji: "🐕", age: 1, cout: { planches: 6, viande: 10 }, effet: 0.7 }],
    geologue: [{ nom: "Loupe", emoji: "🔍", age: 1, cout: { planches: 6, pierres: 6 }, effet: 0.8 }, { nom: "Carte des roches", emoji: "🗺️", age: 2, cout: { planches: 10, outils: 1 }, effet: 0.7 }],
    scierie: [{ nom: "Scie à cadre", emoji: "🪚", age: 0, cout: { planches: 8, pierres: 4 }, effet: 0.8 }, { nom: "Roue à eau", emoji: "💧", age: 2, cout: { planches: 20, pierres: 10, outils: 2 }, effet: 0.65 }],
    mineCharbon: [{ nom: "Wagonnet", emoji: "🛒", age: 1, cout: { planches: 10, pierres: 6 }, effet: 0.8 }, { nom: "Étais solides", emoji: "🪵", age: 2, cout: { planches: 16, outils: 2 }, effet: 0.7 }],
    mineFer: [{ nom: "Wagonnet", emoji: "🛒", age: 2, cout: { planches: 10, pierres: 6 }, effet: 0.8 }, { nom: "Étais solides", emoji: "🪵", age: 2, cout: { planches: 16, outils: 2 }, effet: 0.7 }],
    mineOr: [{ nom: "Wagonnet", emoji: "🛒", age: 3, cout: { planches: 12, pierres: 8 }, effet: 0.8 }, { nom: "Étais solides", emoji: "🪵", age: 3, cout: { planches: 20, outils: 3 }, effet: 0.7 }],
    fonderie: [{ nom: "Grand creuset", emoji: "🫕", age: 2, cout: { pierres: 20, lingots: 2 }, effet: 0.8 }, { nom: "Soufflerie", emoji: "🌬️", age: 3, cout: { lingots: 6, outils: 2 }, effet: 0.7 }],
    forge: [{ nom: "Grande enclume", emoji: "⚒️", age: 2, cout: { pierres: 10, lingots: 4 }, effet: 0.8 }, { nom: "Marteau-pilon", emoji: "🔨", age: 3, cout: { lingots: 8, outils: 4 }, effet: 0.7 }],
    ferme: [{ nom: "Faux", emoji: "🌾", age: 3, cout: { planches: 10, outils: 2 }, effet: 0.8 }, { nom: "Bœufs de labour", emoji: "🐂", age: 3, cout: { planches: 20, pain: 10 }, effet: 0.7 }],
    moulin: [{ nom: "Ailes en toile", emoji: "🌬️", age: 3, cout: { planches: 16 }, effet: 0.8 }, { nom: "Meule double", emoji: "🪨", age: 3, cout: { pierres: 30, outils: 2 }, effet: 0.7 }],
    boulangerie: [{ nom: "Pétrin", emoji: "🥣", age: 3, cout: { planches: 12 }, effet: 0.8 }, { nom: "Grand four", emoji: "🔥", age: 3, cout: { pierres: 30, charbon: 10 }, effet: 0.7 }],
    orfevre: [{ nom: "Loupe d'orfèvre", emoji: "🔍", age: 3, cout: { lingots: 4 }, effet: 0.8 }, { nom: "Établi fin", emoji: "🪑", age: 3, cout: { or: 6, outils: 3 }, effet: 0.7 }],
    macon: [{ nom: "Échafaudage", emoji: "🪜", age: 3, cout: { planches: 20 }, effet: 0.8 }],
    // Étape 15 : l'élevage
    puits: [{ nom: "Poulie", emoji: "🪢", age: 1, cout: { planches: 6, pierres: 4 }, effet: 0.8 }, { nom: "Pompe en fer", emoji: "🚰", age: 2, cout: { lingots: 3, outils: 1 }, effet: 0.7 }],
    faneur: [{ nom: "Râteau", emoji: "🧹", age: 1, cout: { planches: 6 }, effet: 0.8 }, { nom: "Faux en acier", emoji: "🌾", age: 2, cout: { planches: 8, outils: 2 }, effet: 0.7 }],
    etable: [{ nom: "Abreuvoir", emoji: "🪣", age: 1, cout: { planches: 8, pierres: 6 }, effet: 0.8 }, { nom: "Seaux à traire", emoji: "🥛", age: 2, cout: { planches: 10, outils: 2 }, effet: 0.7 }],
    laiterie: [{ nom: "Baratte en chêne", emoji: "🪵", age: 2, cout: { planches: 14 }, effet: 0.8 }, { nom: "Cave fraîche", emoji: "🧊", age: 3, cout: { pierres: 30, outils: 2 }, effet: 0.7 }],
    veterinaire: [{ nom: "Trousse de soins", emoji: "🧰", age: 2, cout: { planches: 6, outils: 2 }, effet: 0.8 }],
    fromagerie: [{ nom: "Presse à fromage", emoji: "🗜️", age: 3, cout: { planches: 16, lingots: 2 }, effet: 0.8 }, { nom: "Cave d'affinage", emoji: "🕳️", age: 3, cout: { pierres: 40, outils: 3 }, effet: 0.7 }],
    cremerie: [{ nom: "Pots en grès", emoji: "🏺", age: 3, cout: { pierres: 20 }, effet: 0.8 }, { nom: "Étuve", emoji: "🔥", age: 3, cout: { pierres: 20, charbon: 15, outils: 2 }, effet: 0.7 }],
    // Étape 16
    poulailler: [{ nom: "Perchoirs", emoji: "🪵", age: 1, cout: { planches: 6 }, effet: 0.8 }, { nom: "Nids de paille", emoji: "🪺", age: 2, cout: { planches: 8, foin: 10 }, effet: 0.7 }],
    bergerie: [{ nom: "Chien de berger", emoji: "🐕", age: 2, cout: { planches: 8, viande: 10 }, effet: 0.8 }, { nom: "Grandes cisailles", emoji: "✂️", age: 3, cout: { outils: 3, lingots: 2 }, effet: 0.7 }],
    porcherie: [{ nom: "Mare de boue", emoji: "🟤", age: 2, cout: { pierres: 10, eau: 10 }, effet: 0.8 }, { nom: "Auges en pierre", emoji: "🪨", age: 3, cout: { pierres: 30, outils: 2 }, effet: 0.7 }],
    tisserand: [{ nom: "Rouet", emoji: "🧶", age: 2, cout: { planches: 12 }, effet: 0.8 }, { nom: "Grand métier", emoji: "🪡", age: 3, cout: { planches: 20, outils: 3 }, effet: 0.7 }],
    tailleur: [{ nom: "Ciseaux fins", emoji: "✂️", age: 3, cout: { lingots: 3 }, effet: 0.8 }, { nom: "Mannequins", emoji: "🧍", age: 3, cout: { planches: 16, tissu: 6 }, effet: 0.7 }],
    charcuterie: [{ nom: "Crochets", emoji: "🪝", age: 3, cout: { lingots: 3 }, effet: 0.8 }, { nom: "Grand fumoir", emoji: "🔥", age: 3, cout: { pierres: 30, charbon: 15 }, effet: 0.7 }],
    entrepot: [{ nom: "Écurie et chevaux", emoji: "🐴", age: 2, cout: { planches: 40, pierres: 20, outils: 4 }, effet: { porteurs: 1.25, charge: 1.5 } }], // étape 44 : + 50 % de charge
  },

  // Étape 8 : 🏪 le MARCHÉ. Chaque ressource a un prix de base en pièces 🪙 (pour 1 objet). Le prix BOUGE :
  //   quand tu vends beaucoup, le prix baisse (les acheteurs en ont assez) ;
  //   quand tu achètes beaucoup, il monte ; puis il revient tout doucement vers le prix de base.
  marche: {
    prix: { troncs: 1, planches: 2, pierres: 2, poissons: 2, viande: 2, charbon: 3, fer: 4, lingots: 10, outils: 22, ble: 1, farine: 3, pain: 4, or: 12, bijoux: 70, eau: 1, foin: 1, lait: 3, beurre: 8, fromage: 14, yaourt: 6, oeufs: 2, laine: 4, tissu: 10, vetements: 26, jambon: 9 }, // étape 15 et 16 : l'élevage
    lot: 5, // on vend et on achète par paquets de 5
    marge: 1.5, // acheter coûte 1,5 fois le prix de vente (le marchand doit gagner sa vie)
    baisse: 0.02, // chaque objet vendu fait baisser le prix de 2 % (un paquet de 5 : 10 %)
    hausse: 0.02, // chaque objet acheté le fait monter de 2 %
    min: 0.4, // le prix ne descend pas sous 40 % du prix de base
    max: 2.5, // ni ne monte au-dessus de 250 %
    retour: 180, // s : en 3 minutes, le prix a fait à peu près les 2/3 du chemin vers le prix de base
  },

  // Étape 8 : 📊 les STATISTIQUES. Le compteur de l'entrepôt range ce qui entre et sort par tranches de 10 s,
  // et garde les 5 dernières minutes.
  statistiques: { tranche: 10, tranches: 30 },
  // Étape 5 : ✍️ la cabane du pêcheur doit être au bord de l'eau (de l'eau à 3 cases maximum).
  bordDeLEau: 3,

  ouvriers: {
    vitesse: 1.6, // cases par seconde
    couper: 4, // s pour couper un arbre
    planter: 3, // s pour planter une pousse
    tailler: 5, // s pour tailler une pierre
    repos: 2, // s de pause entre deux voyages
    pecher: 6, // s pour pêcher 1 poisson (étape 4 ; 8 s avant l'étape 5)
    chasser: 4, // s pour chasser 1 gibier (étape 4) : 3 s pour tendre l'arc, puis la flèche part
    prospecter: 6, // s pour qu'un géologue cherche un gisement (étape 5)
    miner: 8, // s pour qu'un mineur sorte 1 morceau de charbon (étape 7)
    chanceDeTrouver: 0.5, // étape 5 : 1 chance sur 2 de trouver un gisement à chaque recherche
    reparer: 6, // étape 12 : s pour que le maçon-couvreur répare un bâtiment
    soigner: 6, // étape 15 : s pour que le vétérinaire soigne une étable
    lentSiFaim: 2, // étape 5 : ✍️ le ventre vide, on travaille et on marche 2 fois moins vite
    attente: 3, // s avant de chercher à nouveau quand il n'y a rien à faire
  },

  // Étape 3 : les routes et les porteurs
  // Étape 6 : ✍️ au campement, les routes sont des CHEMINS DE TERRE, gratuits. La route en pierre,
  // plus rapide, sera débloquée plus tard (un autre âge ou une recherche).
  routes: {
    cout: {}, // gratuit (étape 3 : 1 pierre par case)
    coutPierre: { pierres: 1 }, // étape 7 : la route en pierre (débloquée par une recherche), par case
    longueurMax: 40, // en cases : on ne trace pas une route plus longue d'un seul coup
    // Étape 36 : ✍️ « il faut qu'une route puisse toujours passer ». La route dégage ce qui la gêne :
    troncsParArbre: 1, // 🪓 un arbre abattu par la route donne 1 tronc (comme pour le bûcheron)
    // ⛏️ un rocher cassé donne ses pierres (8 au plus, voir nature.pierresParRocher)
    pont: { planches: 2 }, // 🌉 une case de route sur l'eau (même profonde) : un pont, 2 planches
    detourMax: 2, // on contourne les obstacles si le détour fait au plus 2 fois le trajet tout droit
  },
  // Étape 6 : la vitesse de marche selon le sol (× la vitesse normale)
  sols: {
    horsRoute: 0.85, // à travers champs
    terre: 1, // sur un chemin de terre
    pierre: 1.6, // sur une route en pierre (plus tard)
  },
  porteurs: {
    nombre: 4, // les porteurs qui habitent l'entrepôt (étape 20 : 4)
    partChantiers: 0.5, // étape 20 : ✍️ la moitié des porteurs au plus livre les chantiers (les autres font tourner les ateliers)
    // Étape 44 : ✍️ « le porteur doit en porter plus, surtout au fil des améliorations » : 4 objets par voyage (3 avant),
    // × 1,5 avec « Brouettes », × 2 avec « Ânes et charrettes », × 1,5 avec l'écurie de l'entrepôt : 4 → 6 → 12 → 18.
    charge: 4,
    vitesse: 2.2, // cases par seconde (étape 21 : ✍️ de nouveau 2,2 : à 2,8, ils couraient beaucoup trop vite)
    vitesseMaxCharrette: 2.6, // étape 22 : ✍️ avec l'âne et la charrette, on va moins vite (× 0,8, et 2,6 au plus)
    vitesseMax: 3.4, // étape 21 : même avec la route pavée, les brouettes et l'écurie, jamais plus de 3,4 cases par seconde
  },
  // Étape 44 : ✍️ « les ateliers doivent pouvoir stocker plus de ressources pour fabriquer, et plus de produits fabriqués ».
  sortieMax: 16, // objets qui peuvent attendre devant un bâtiment (au-delà, l'ouvrier attend) · étape 20 : 8 ; étape 44 : 16
  sortieParAmelioration: 8, // étape 44 : + 8 par amélioration ⭐ du bâtiment (jusqu'à 32)
  entreeMax: 6, // de chaque ingrédient en réserve dans un atelier · étape 44 : 6 (2 avant)
  entreeParAmelioration: 3, // étape 44 : + 3 par amélioration ⭐ de l'atelier (jusqu'à 12)
  // Étape 27 : ✍️ « le géologue et le maçon devraient pouvoir aller partout sur la carte, sans rentrer chez eux à chaque
  // fois ». Ces métiers font une TOURNÉE : ils cherchent sur toute la carte, et après un travail ils cherchent le suivant
  // depuis l'endroit où ils sont. Ils ne rentrent que quand il n'y a plus rien à faire (choix de Maxance), et le maçon
  // aussi quand il n'a plus d'outils : il part avec 3 🔨 au plus (1 par réparation).
  tournee: { metiers: ["geologue", "macon", "veterinaire"], outilsMacon: 3 },

  // Étape 4 : ✍️ une année dure 10 minutes. 4 saisons de 2 min 30 : printemps, été, automne, hiver.
  saisons: {
    dureeAnnee: 1200, // s : ✍️ étape 6, 20 minutes (5 min par saison). 10 minutes avant.
  },
  // Étape 9 : ✍️ le JOUR et la NUIT (seulement pour les yeux : personne ne dort, le travail continue).
  // Une journée dure 6 minutes. Les parts de la journée (de 0 à 1) :
  //   0 → aube (le ciel rosit) → jour → crépuscule (le ciel orange) → nuit → retour à 0.
  jour: {
    duree: 360, // s pour une journée entière
    aube: 0.08, // jusqu'à cette part : l'aube
    crepuscule: 0.62, // à partir de cette part : le crépuscule
    nuit: 0.72, // à partir de cette part : la nuit (jusqu'à 0,96, puis l'aube revient)
    finNuit: 0.96,
    noirceur: 0.6, // à minuit, l'écran prend 60 % de bleu nuit au plus (pour toujours bien voir)
  },
  // Étape 9 : ✍️ les petits détails (fenêtres, tuiles, papillons…) ne se dessinent que de près,
  // pour que le jeu reste fluide sur un téléphone.
  detail: {
    zoomFin: 0.8, // à partir de ce zoom : tous les détails
    zoomFigurants: 0.6, // à partir de ce zoom : les poules, les enfants, les papillons
    zoomAnimations: 0.45, // étape 17 : ✍️ les animations devant les bâtiments se voient aussi de plus loin
    // Étape 14 : ✍️ des bâtiments plus GROS, pour les reconnaître d'un coup d'œil (× la taille de l'étape 13)
    echelleBatiments: 1.8, // les bâtiments sur 1 case (huttes, maisons, puits) · étape 22 : 1,5 ; étape 24 : 1,6 ; étape 28 : 1,8
    // Étape 46 : les bâtiments dont le dessin dépasse de leur place (mesuré) : seuls eux sont « coupés aux ciseaux »
    deborde: ["entrepot", "bucheron", "forestier", "scierie", "pecheur", "geologue", "mineCharbon", "hutte", "maison", "mineFer", "ferme", "mineOr", "puits", "poulailler", "depot", "centrale", "acierie", "pompage", "manoir", "chasseur", "etable", "veterinaire", "fromagerie", "tisserand"],
    echelleParCaseEnPlus: 0.3, // étape 37 : le bâtiment lui-même : 1,8 + 0,3 par case de côté en plus (2 × 2 → 2,1 ; 3 × 3 → 2,4 ; 4 × 4 → 2,7) ; le reste est sa cour
    echelleParCase: 1, // étape 28 : un bloc de N × N cases est dessiné × (N + 0,3) : 2 × 2 → 2,3 ; 3 × 3 → 3,3 ; 4 × 4 → 4,3
    echelleGrands: 2.3, // étape 24 : ✍️ les bâtiments sur 2 × 2 cases sont dessinés × 2,3
    echelleEntrepot: 1.9, // étape 24 : sur 2 × 2 cases (1,15 avant) // l'entrepôt était déjà grand (et il a sa cour et son silo)
  },
  // Étape 9 : les FIGURANTS (ils ne font que décorer : oiseaux, papillons, poules, enfants)
  figurants: {
    poulesParHutte: 2, // et 3 par maison
    habitantsParEnfant: 4, // 1 enfant qui joue près du feu pour 4 habitants (6 au plus)
    enfantsMax: 6,
    volsDOiseaux: 2, // groupes d'oiseaux en même temps dans le ciel (le jour)
    papillons: 0.18, // chance qu'une case de fleurs ait un papillon (printemps et été)
    lucioles: 0.06, // chance qu'une case de forêt ait des lucioles (nuits d'été)
  },

  // Étape 4 : les repas. Chaque ouvrier et chaque porteur mange 1 poisson ou 1 morceau de viande.
  // Étape 5 : ✍️ c'était trop. Maintenant : 1 repas par saison, pris directement à l'entrepôt (la cantine),
  // et le ventre vide ne bloque plus personne : on travaille juste 2 fois moins vite (ouvriers.lentSiFaim).
  repas: {
    intervalle: 200, // s entre deux repas (étape 19 : 3 min 20 ; 2 min 30 avant ; 120 s à l'étape 4)
    tropFaim: 600, // s le ventre vide avant de quitter le village : une année entière (150 s à l'étape 4)
    retour: 30, // s avant qu'un nouvel habitant arrive, quand il y a de nouveau à manger
  },

  // Étape 4 : le gibier (cerfs et lapins) qui se promène dans les forêts.
  // Étape 6 : chaque espèce a son coin préféré (son HABITAT) :
  //   forêt (cerf, sanglier), herbe et prairie (lapin), bord de l'eau (canard), rochers (bouquetin).
  especes: {
    cerf: { part: 0.3, vitesse: 1, habitat: "foret" },
    lapin: { part: 0.25, vitesse: 1.4, habitat: "herbe" },
    sanglier: { part: 0.2, vitesse: 0.9, habitat: "foret" },
    canard: { part: 0.15, vitesse: 0.7, habitat: "berge" },
    bouquetin: { part: 0.1, vitesse: 1.1, habitat: "rochers" },
  },
  animaux: {
    depart: 160, // au début de la partie (24 avant l'étape 5 ; 40 avant l'étape 32)
    maximum: 280, // (40 avant l'étape 5 ; 70 avant l'étape 32)
    naissance: 12, // (avant l'étape 40 : s entre deux naissances)
    // Étape 40 : ✍️ « le chasseur ne devrait jamais être en rupture de gibier ». Choix de Maxance : des naissances PARTOUT,
    // et plus il y a d'animaux, plus il en naît : chaque animal a 20 % de chances par minute d'avoir un petit (6 % en
    // hiver). Une espèce qui n'a presque plus d'animaux (moins de 6) en voit arriver de nouveaux dans son habitat.
    fecondite: 0.2, feconditeHiver: 0.06, minimumEspece: 6,
    // Étape 43 : ✍️ « des chasseurs n'ont rien à faire, j'avais demandé que ça n'arrive pas ». Les naissances partout ne
    // suffisaient pas : le gibier pouvait manquer AUTOUR d'un chasseur. Maintenant, autour de chaque cabane de chasseur
    // (dans son rayon de chasse), il y a toujours au moins 6 animaux libres : il en arrive dès qu'il en manque (toutes les 5 s).
    minimumChasseur: 6, verificationChasseur: 5,
    vitesse: 0.7, // cases par seconde
  },

  // Étape 5 : ✍️ combien de nourriture rapporte chaque prise. Un cerf nourrit plus qu'un lapin,
  // un thon plus qu'une sardine. Le thon ne vit qu'en eau profonde (la mer).
  prises: {
    cerf: 4, lapin: 1, sanglier: 3, canard: 1, bouquetin: 2, // 🍖 (étape 6 : sanglier, canard, bouquetin)
    sardine: 1, truite: 2, thon: 4, // 🐟
    // Les chances de pêcher chaque poisson : au bord (eau peu profonde) et en eau profonde
    peuProfonde: { sardine: 0.6, truite: 0.4, thon: 0 },
    profonde: { sardine: 0.3, truite: 0.4, thon: 0.3 },
  },

  nature: {
    croissance: 60, // s pour qu'une pousse devienne un arbre
    pierresParRocher: 8, // un rocher donne 8 pierres, puis il disparaît (4 avant l'étape 5)
    pierresGisement: 8, // étape 5 : un gisement découvert par le géologue
    reserveFilon: 60, // étape 7 : un filon (charbon, fer, or…) donne 60 morceaux, puis il est épuisé
  },

  // Étape 6 : ✍️ les ÂGES du village (on ne part plus de « l'âge de pierre »). Chaque âge débloque
  // des bâtiments. On passe au suivant quand tous les objectifs sont remplis.
  //   batiments : construits (prêts) en plus de l'entrepôt ; stock : ce qu'il faut dans l'entrepôt ;
  //   nourriture : 🐟 + 🍖 dans l'entrepôt.
  ages: [
    { id: "campement", nom: "Le campement", emoji: "🏕️", debloque: ["bucheron", "forestier", "scierie", "carriere", "pecheur", "chasseur", "hutte"],
      objectifs: { batiments: 6, stock: { planches: 40, pierres: 20 }, nourriture: 30 } },
    // Étape 7 : le hameau débloque l'université (les recherches), la mine de charbon et le géologue.
    // Étape 15 : le hameau débloque aussi le début de l'élevage (le puits, le faneur et l'étable).
    { id: "hameau", nom: "Le hameau", emoji: "🛖", debloque: ["geologue", "universite", "mineCharbon", "puits", "faneur", "etable", "poulailler", "depot"], // étape 19 : ✍️ l'entrepôt secondaire dès le hameau // étape 16 : le poulailler
      objectifs: { batiments: 10, recherches: 3, stock: { planches: 80, charbon: 20 }, nourriture: 60 } },
    // La suite (prévue, pas encore construite) : ce que chaque âge débloquera.
    // Étape 8 : le village débloque le fer, la fonderie, la forge, les maisons et le marché.
    //   pieces : 🪙 qu'il faut avoir ; habitants : ouvriers logés.
    { id: "village", nom: "Le village", emoji: "🏡", debloque: ["mineFer", "fonderie", "forge", "marche", "laiterie", "veterinaire", "bergerie", "porcherie", "tisserand"], // étape 17 : le 2e entrepôt // étape 15 : le beurre et le vétérinaire ; étape 16 : la laine et les cochons
      objectifs: { batiments: 18, habitants: 16, recherches: 7, stock: { lingots: 10, outils: 10 }, pieces: 150 } },
    // Étape 11 : ✍️ le bourg, et c'est de plus en plus dur ! (chaque âge demande environ 2 fois plus)
    //   Le bourg ajoute 3 nouvelles choses à penser : le PAIN (les habitants en veulent), l'ENTRETIEN
    //   (les bâtiments s'usent) et des HIVERS plus durs (il faut du bois de chauffage).
    // Étape 15 : le bourg débloque aussi le fromage et le yaourt ; pour passer à la ville, il faut des habitants HEUREUX.
    { id: "bourg", nom: "Le bourg", emoji: "🏰", debloque: ["ferme", "moulin", "boulangerie", "mineOr", "orfevre", "macon", "fromagerie", "cremerie", "tailleur", "charcuterie"], // étape 16 : les vêtements et le jambon
      objectifs: { batiments: 32, habitants: 34, recherches: 13, stock: { pain: 60, bijoux: 8, outils: 25, fromage: 15 }, pieces: 600, bonheur: 70 } },
    { id: "ville", nom: "La ville", emoji: "🏙️", debloque: ["monument"], // étape 31 : le grand monument
      // Étape 34 : ✍️ (choix de Maxance) pour l'époque industrielle : le Grand Beffroi fini, 80 habitants, 3 000 🪙
      objectifs: { monument: 4, habitants: 80, pieces: 3000 } },
    // Étape 34 : 🏭 l'ÉPOQUE INDUSTRIELLE : l'électricité, et les premières usines
    { id: "industrie", nom: "L'époque industrielle", emoji: "🏭", debloque: ["centrale", "acierie", "filature", "pompage", "epuration"], objectifs: null, // étape 35 : l'eau et les égouts
      aVenir: "🚗 routes goudronnées et voitures, 🚓 police et 🚒 pompiers" },
  ],
  gemmesParAge: 3, // étape 7 : 💎 offertes à chaque nouvel âge

  // Étape 7 : 🎓 les RECHERCHES de l'université. On les paie avec le stock de l'entrepôt, puis le savant
  // y travaille pendant `duree` secondes (une seule à la fois). Chaque recherche fait un EFFET :
  //   un multiplicateur de durée (0,6 = 40 % plus rapide), ou débloque quelque chose.
  recherches: [
    { id: "haches", nom: "Haches affûtées", emoji: "🪓", age: 1, cout: { planches: 15, pierres: 10 }, duree: 60, effet: { couper: 0.6 }, texte: "Le bûcheron coupe 40 % plus vite" },
    { id: "filets", nom: "Filets de pêche", emoji: "🥅", age: 1, cout: { planches: 15, poissons: 10 }, duree: 60, effet: { pecher: 0.6 }, texte: "Le pêcheur pêche 40 % plus vite" },
    { id: "arcs", nom: "Arcs en if", emoji: "🏹", age: 1, cout: { planches: 15, viande: 10 }, duree: 60, effet: { chasser: 0.6 }, texte: "Le chasseur chasse 40 % plus vite" },
    { id: "pics", nom: "Pics de pierre", emoji: "⛏️", age: 1, cout: { planches: 20, pierres: 15 }, duree: 75, effet: { tailler: 0.6, miner: 0.75 }, texte: "Le carrier et le mineur vont plus vite" },
    { id: "brouettes", nom: "Brouettes", emoji: "🛒", age: 1, cout: { planches: 30, pierres: 10 }, duree: 90, effet: { porteurs: 1.3, brouette: true, chargement: 1.5 }, texte: "Les porteurs vont 30 % plus vite et portent 1,5 fois plus (une brouette)" }, // étape 44 : + la charge
    { id: "paves", nom: "Routes pavées", emoji: "🧱", age: 1, cout: { pierres: 30, charbon: 5 }, duree: 90, effet: { routePierre: true }, texte: "Toutes les routes deviennent pavées (× 1,6 plus rapide)" }, // étape 17 : ✍️ automatiquement
    { id: "fumoir", nom: "Le fumoir", emoji: "🔥", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { repas: 1.5 }, texte: "La nourriture dure plus longtemps : un repas toutes les 3 min 45" },
    { id: "prospection", nom: "Prospection", emoji: "🔍", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { filons: true }, texte: "Le géologue trouve des veines 2 fois plus riches (étape 38)" },
    // Étape 8 : les recherches du village
    { id: "soufflets", nom: "Soufflets", emoji: "🌬️", age: 2, cout: { planches: 30, charbon: 20 }, duree: 90, effet: { fondre: 0.7 }, texte: "La fonderie va 30 % plus vite" },
    { id: "enclumes", nom: "Enclumes", emoji: "⚒️", age: 2, cout: { lingots: 8, pierres: 20 }, duree: 120, effet: { forger: 0.7 }, texte: "La forge va 30 % plus vite" },
    { id: "scies", nom: "Scies en fer", emoji: "🪚", age: 2, cout: { outils: 4, planches: 20 }, duree: 120, effet: { scier: 0.6 }, texte: "La scierie scie 40 % plus vite" },
    { id: "outilsFer", nom: "Outils en fer", emoji: "🔨", age: 2, cout: { outils: 8 }, duree: 150, effet: { couper: 0.8, tailler: 0.8, planter: 0.8, miner: 0.8 }, texte: "Bûcheron, forestier, carrier et mineurs : 20 % plus vite" },
    { id: "commerce", nom: "Commerce", emoji: "⚖️", age: 2, cout: { planches: 30, lingots: 5 }, duree: 120, effet: { vente: 1.2 }, texte: "Le marché te paie 20 % plus cher" },
    { id: "charrettes", nom: "Ânes et charrettes", emoji: "🫏", age: 2, cout: { planches: 40, lingots: 4, outils: 4 }, duree: 150, effet: { chargement: 2 }, texte: "Chaque porteur part avec un âne et sa charrette : 2 fois plus d'objets par voyage" }, // étape 9 ; étape 20 : × 2
    // Étape 11 : les recherches du bourg
    { id: "meules", nom: "Meules en granit", emoji: "🪨", age: 3, cout: { pierres: 60, outils: 6 }, duree: 150, effet: { moudre: 0.7 }, texte: "Le moulin va 30 % plus vite" },
    { id: "fours", nom: "Fours en briques", emoji: "🧱", age: 3, cout: { pierres: 50, charbon: 30, outils: 4 }, duree: 150, effet: { cuire: 0.7 }, texte: "La boulangerie va 30 % plus vite" },
    { id: "charrues", nom: "Charrues", emoji: "🚜", age: 3, cout: { lingots: 10, planches: 40 }, duree: 180, effet: { cultiver: 0.7 }, texte: "La ferme va 30 % plus vite" },
    { id: "entretien", nom: "Bon entretien", emoji: "🧰", age: 3, cout: { outils: 12, planches: 40 }, duree: 180, effet: { usure: 0.6 }, texte: "Les bâtiments s'usent 40 % moins vite" },
    { id: "poeles", nom: "Poêles en fonte", emoji: "🔥", age: 3, cout: { lingots: 12, pierres: 40 }, duree: 180, effet: { chauffage: 0.6 }, texte: "L'hiver, on brûle 40 % de bois en moins" },
    { id: "orfevrerie", nom: "Orfèvrerie fine", emoji: "💍", age: 3, cout: { or: 10, outils: 6 }, duree: 200, effet: { orfevrerie: 0.7 }, texte: "L'orfèvre va 30 % plus vite" },
    { id: "filonsOr", nom: "Sondes profondes", emoji: "🧭", age: 3, cout: { outils: 8, pain: 20 }, duree: 200, effet: { prospecter: 0.7 }, texte: "Le géologue recharge les mines 30 % plus vite" }, // étape 38 (avant : les filons d'or)
    // Étape 15 : les recherches de l'élevage
    { id: "races", nom: "Vaches laitières", emoji: "🐄", age: 1, cout: { planches: 20, foin: 10 }, duree: 90, effet: { traire: 0.7 }, texte: "Les étables donnent du lait 30 % plus vite" },
    { id: "barattes", nom: "Barattes", emoji: "🧈", age: 2, cout: { planches: 30, outils: 2 }, duree: 120, effet: { baratter: 0.7 }, texte: "La laiterie fait le beurre 30 % plus vite" },
    { id: "hygiene", nom: "Étables propres", emoji: "🧽", age: 2, cout: { planches: 30, eau: 20 }, duree: 120, effet: { maladie: 0.5 }, texte: "Les vaches tombent 2 fois moins souvent malades" },
    { id: "remedes", nom: "Remèdes", emoji: "💊", age: 2, cout: { lait: 20, outils: 3 }, duree: 120, effet: { soigner: 0.6 }, texte: "Le vétérinaire soigne 40 % plus vite" },
    { id: "affinage", nom: "Caves d'affinage", emoji: "🧀", age: 3, cout: { pierres: 60, outils: 4 }, duree: 180, effet: { affiner: 0.7 }, texte: "La fromagerie et la crèmerie vont 30 % plus vite" },
    // Étape 16
    { id: "pondeuses", nom: "Poules pondeuses", emoji: "🐔", age: 1, cout: { planches: 20, eau: 10 }, duree: 90, effet: { pondre: 0.7 }, texte: "Les poulaillers donnent des œufs 30 % plus vite" },
    { id: "tonte", nom: "Tonte des moutons", emoji: "🐑", age: 2, cout: { outils: 3, planches: 20 }, duree: 120, effet: { tondre: 0.7, engraisser: 0.8 }, texte: "La bergerie va 30 % plus vite (et la porcherie 20 %)" },
    { id: "metiers", nom: "Métiers à tisser", emoji: "🪡", age: 2, cout: { planches: 40, outils: 3 }, duree: 150, effet: { tisser: 0.7 }, texte: "Le tisserand va 30 % plus vite" },
    { id: "aiguilles", nom: "Aiguilles en acier", emoji: "🪡", age: 3, cout: { lingots: 6, tissu: 10 }, duree: 180, effet: { coudre: 0.7 }, texte: "Le tailleur va 30 % plus vite" },
    { id: "fumage", nom: "Fumage", emoji: "🔥", age: 3, cout: { charbon: 30, pierres: 30 }, duree: 180, effet: { fumer: 0.7 }, texte: "La charcuterie va 30 % plus vite" },
    { id: "filonsFer", nom: "Carte des veines", emoji: "🧭", age: 2, cout: { charbon: 20, outils: 3 }, duree: 120, effet: { prospecter: 0.7 }, texte: "Le géologue recharge les mines 30 % plus vite" }, // étape 38 (avant : les filons de fer)
  ],

  // Étape 7 : 📜 les MISSIONS. Un personnage raconte une petite histoire et demande des ressources
  // avant la fin du temps. Réussie : une récompense et des 💎. Ratée : rien de grave, une autre viendra.
  // Étape 30 : ✍️ (idées choisies par Maxance) 📦 les COMMANDES : 3 demandes claires à la fois, avec une récompense.
  // Elles demandent ce que le village sait fabriquer à son âge ; la quantité dépend du prix au marché (une commande vaut
  // environ « valeur × (âge + 1) » pièces), et elle rapporte 1,5 fois ce qu'elle vaut (et parfois 💎).
  commandes: {
    nombre: 3, // commandes en même temps
    duree: 600, // s pour la livrer (10 min) ; après, le client repart (rien de grave)
    attente: 20, // s avant qu'un nouveau client arrive
    valeur: 40, // 🪙 que vaut une commande, × (âge + 1)
    gain: 1.5, // la récompense = 1,5 × ce que vaut la commande
    chanceGemme: 0.2, // 1 chance sur 5 d'avoir aussi 1 💎
    clients: [
      { qui: "La cuisinière", emoji: "👩‍🍳" }, { qui: "Le marchand ambulant", emoji: "🧳" }, { qui: "Le capitaine", emoji: "💂" },
      { qui: "La grand-mère", emoji: "👵" }, { qui: "Le charpentier", emoji: "🧑‍🔧" }, { qui: "Le seigneur", emoji: "🤴" },
      { qui: "La couturière", emoji: "🧵" }, { qui: "Le voyageur", emoji: "🧭" },
    ],
  },
  // Étape 30 : 👣 les OBJECTIFS PAS À PAS. Pour chaque âge, une suite de petites étapes guidées, avec POURQUOI.
  // Une étape est réussie quand : un bâtiment est construit (batiment), une ressource est dans l'entrepôt (stock), assez
  // de recherches (recherches), d'habitants (habitants), de filons découverts (filons), de commandes livrées (commandes),
  // de pièces (pieces) ou de bonheur (bonheur). Chaque étape réussie rapporte quelques 🪙.
  guide: {
    recompense: 10, // 🪙 × (âge + 1) par étape réussie
    ages: [
      [ // 🏕️ le campement
        { texte: "Construis un 🪓 bûcheron", batiment: "bucheron", nombre: 1, pourquoi: "Il coupe les arbres : les troncs sont le début de tout." },
        { texte: "Construis une 🪚 scierie", batiment: "scierie", nombre: 1, pourquoi: "Elle transforme les troncs en planches : presque tout se construit avec." },
        { texte: "Construis un 🎣 pêcheur", batiment: "pecheur", nombre: 1, pourquoi: "Les habitants mangent : sans nourriture, ils partent." },
        { texte: "Construis une 🛖 hutte", batiment: "hutte", nombre: 1, pourquoi: "Chaque ouvrier a besoin d'un lit. Plus de lits = plus d'habitants." },
        { texte: "Construis une ⛏️ carrière", batiment: "carriere", nombre: 1, pourquoi: "Sur un gisement de pierre (des éclats gris clair, tout près du village) : les pierres servent aux bâtiments solides." },
        { texte: "Construis un 🏹 chasseur", batiment: "chasseur", nombre: 1, pourquoi: "Deux sortes de nourriture, c'est plus sûr (et les habitants aiment varier)." },
        { texte: "Aie 40 planches", stock: "planches", nombre: 40, pourquoi: "C'est un des objectifs pour passer au hameau." },
        { texte: "Livre une commande 📦", commandes: 1, pourquoi: "Les commandes rapportent des pièces 🪙 : touche 📦 à droite." },
      ],
      [ // 🛖 le hameau
        { texte: "Construis une 🎓 université", batiment: "universite", nombre: 1, pourquoi: "Les recherches rendent tout le monde plus rapide." },
        { texte: "Fais une recherche", recherches: 1, pourquoi: "Touche l'université et choisis une recherche." },
        { texte: "Construis une ⚫ mine de charbon", batiment: "mineCharbon", nombre: 1, pourquoi: "Pose-la sur un gisement de paillettes noires (on les voit aussi sur la mini-carte)." },
        { texte: "Construis un 🔍 géologue", batiment: "geologue", nombre: 1, pourquoi: "Quand une mine est épuisée, il trouve une nouvelle veine dessous." },
        { texte: "Construis une 🐄 étable", batiment: "etable", nombre: 1, pourquoi: "Le lait est une douceur : les habitants seront plus heureux." },
        { texte: "Aie 20 charbon", stock: "charbon", nombre: 20, pourquoi: "C'est un des objectifs pour passer au village." },
        { texte: "Fais 3 recherches", recherches: 3, pourquoi: "C'est un des objectifs pour passer au village." },
      ],
      [ // 🏡 le village
        { texte: "Construis une 🟤 mine de fer", batiment: "mineFer", nombre: 1, pourquoi: "Sur des paillettes rousses. Le fer, c'est le début des outils." },
        { texte: "Construis une 🔥 fonderie", batiment: "fonderie", nombre: 1, pourquoi: "Fer + charbon → lingots." },
        { texte: "Construis une ⚒️ forge", batiment: "forge", nombre: 1, pourquoi: "Lingots + planches → outils : les bâtiments du bourg en demandent." },
        { texte: "Fais devenir une 🛖 hutte une 🏠 maison", batiment: "maison", nombre: 1, pourquoi: "Une hutte devient une maison toute seule quand les artisans ont ce qu'ils veulent (3 goûts, du lait ou des œufs)." },
        { texte: "Construis un 🏪 marché", batiment: "marche", nombre: 1, pourquoi: "Pour vendre ce que tu as en trop, contre des pièces 🪙." },
        { texte: "Aie 10 outils", stock: "outils", nombre: 10, pourquoi: "C'est un des objectifs pour passer au bourg." },
        { texte: "Aie 16 habitants", habitants: 16, pourquoi: "Des maisons et des huttes." },
        { texte: "Aie 150 🪙", pieces: 150, pourquoi: "Commandes 📦 et marché 🏪." },
      ],
      [ // 🏰 le bourg
        { texte: "Construis une 🌾 ferme", batiment: "ferme", nombre: 1, pourquoi: "Le blé : le début du pain (pas en hiver !)." },
        { texte: "Construis un 🌬️ moulin", batiment: "moulin", nombre: 1, pourquoi: "Blé → farine." },
        { texte: "Construis une 🍞 boulangerie", batiment: "boulangerie", nombre: 1, pourquoi: "Farine + bois → pain. Au bourg, les habitants en veulent." },
        { texte: "Aie 30 pains", stock: "pain", nombre: 30, pourquoi: "Sans pain, les habitants du bourg travaillent moins bien." },
        { texte: "Construis un 🪜 maçon-couvreur", batiment: "macon", nombre: 1, pourquoi: "Au bourg, les bâtiments s'usent : il les répare." },
        { texte: "Construis une 🟡 mine d'or", batiment: "mineOr", nombre: 1, pourquoi: "Sur des paillettes dorées." },
        { texte: "Construis un 💍 orfèvre", batiment: "orfevre", nombre: 1, pourquoi: "Or + charbon → bijoux, qui valent très cher." },
        { texte: "Bonheur à 70 %", bonheur: 70, pourquoi: "Des goûts variés, des maisons, du pain, des habits : touche 😊." },
      ],
      [ // 🏙️ la ville : le grand monument (étape 31) ; étape 34 : puis l'époque industrielle
        { texte: "Construis le 🏛️ Grand Beffroi", batiment: "monument", nombre: 1, pourquoi: "Le grand chantier de la ville (5 × 5 cases) : menu Artisans." },
        { texte: "Finis les fondations sculptées", monument: 1, pourquoi: "Touche le monument et « Donner ce que j'ai » : pierres, planches, outils." },
        { texte: "Monte les grands murs", monument: 2, pourquoi: "Il faut du métal (lingots) et beaucoup de pierres." },
        { texte: "Pose la tour et le dôme doré", monument: 3, pourquoi: "Du tissu pour les bannières, des bijoux pour l'or du dôme." },
        { texte: "Fais la grande fête d'inauguration", monument: 4, pourquoi: "Du pain, du fromage, du jambon et des habits neufs pour tout le monde !" },
        { texte: "Aie 80 habitants", habitants: 80, pourquoi: "Pour passer à l'époque industrielle (avec 3 000 🪙)." },
        { texte: "Aie 3 000 🪙", pieces: 3000, pourquoi: "Pour passer à l'époque industrielle." },
      ],
      [ // 🏭 l'époque industrielle (étape 34)
        { texte: "Construis une ⚡ centrale à charbon", batiment: "centrale", nombre: 1, pourquoi: "Elle fait de l'électricité en brûlant du charbon : il faut des mines de charbon !" },
        { texte: "Alimente 10 bâtiments en électricité", courant: 10, pourquoi: "Le courant suit les routes : relie tes bâtiments à la centrale par la route." },
        { texte: "Construis une 🏭 aciérie", batiment: "acierie", nombre: 1, pourquoi: "Une usine électrique : beaucoup de lingots d'un coup." },
        { texte: "Construis une 🧵 filature", batiment: "filature", nombre: 1, pourquoi: "Une usine électrique : la laine devient du tissu à la machine." },
        { texte: "Alimente toutes les maisons (90 %)", logementsCourant: 90, pourquoi: "L'électricité est un nouveau besoin des habitants (⚡ dans 👥)." },
        // Étape 35 : l'eau courante et les égouts
        { texte: "Construis une 🚰 station de pompage", batiment: "pompage", nombre: 1, pourquoi: "Au bord de l'eau, avec l'électricité : l'eau part dans des tuyaux sous les routes." },
        { texte: "Construis une 🚽 station d'épuration", batiment: "epuration", nombre: 1, pourquoi: "Elle nettoie les eaux usées : les égouts suivent aussi les routes." },
        { texte: "Donne l'eau à 90 % des lits", logementsEau: 90, pourquoi: "L'eau courante est un besoin des habitants (🚰 dans 👥)." },
        { texte: "Fais monter un 🏢 immeuble", batiment: "immeuble", nombre: 1, pourquoi: "Une maison bourgeoise avec ⚡ + 🚰 + 🚽 devient un immeuble de 20 lits." },
      ],
    ],
  },

  // Étape 33 : 📖 l'ENCYCLOPÉDIE : ce que fait chaque bâtiment, en une phrase (le reste est calculé : sa recette, son prix,
  // ce dont il a besoin). ✍️ « À chaque évolution, on explique quel bâtiment fait quoi et quel besoin il a. »
  descriptions: {
    entrepot: "Le cœur du village : tout ce qui est produit y est rangé, les porteurs en partent, les habitants y mangent.",
    bucheron: "Le bûcheron coupe les arbres autour de lui et rapporte des troncs.",
    forestier: "Le forestier replante des arbres, pour que la forêt ne disparaisse pas.",
    scierie: "La scierie découpe les troncs en planches, le matériau de presque tous les bâtiments.",
    carriere: "La carrière se pose sur un gisement de pierre et le taille en blocs. Épuisée, le géologue y trouve une nouvelle veine.",
    pecheur: "Le pêcheur pêche dans l'eau toute proche (même en hiver, dans un trou de la glace).",
    chasseur: "Le chasseur chasse le gibier des environs et rapporte de la viande.",
    geologue: "Le géologue fait le tour des mines : quand l'une est épuisée, il trouve une nouvelle veine sous elle, et elle repart.",
    universite: "Les savants y font des recherches qui rendent tout le village plus efficace.",
    mineCharbon: "La mine creuse un puits dans un filon de charbon découvert.",
    hutte: "Le logement qu'on construit : 3 lits pour des paysans. Au village, il devient tout seul une maison quand les artisans ont ce qu'ils veulent.",
    maison: "Une hutte qui a grandi : 6 lits, et du confort pour les artisans. Elle deviendra une maison bourgeoise.",
    manoir: "La maison bourgeoise : 10 lits pour les bourgeois, qui paient de gros impôts.",
    mineFer: "La mine creuse un puits dans un filon de fer découvert.",
    fonderie: "La fonderie fond le minerai de fer avec du charbon : elle fait des lingots.",
    forge: "Le forgeron transforme les lingots et les planches en outils.",
    marche: "Le marchand vend ce que tu as en trop, et achète ce qui te manque, contre des pièces.",
    ferme: "Le fermier cultive le blé dans ses champs (pas en hiver).",
    moulin: "Le meunier écrase le blé en farine.",
    boulangerie: "Le boulanger cuit le pain avec la farine et du bois.",
    mineOr: "La mine creuse un puits dans un filon d'or découvert.",
    orfevre: "L'orfèvre fait des bijoux avec l'or et le charbon : ils valent très cher.",
    macon: "Le maçon-couvreur fait sa tournée et répare les bâtiments usés, avec des outils.",
    puits: "Le puits donne de l'eau pour les animaux.",
    faneur: "Le faneur fait sécher l'herbe en bottes de foin, à faire avant l'hiver.",
    etable: "Les vaches boivent, mangent du foin, et donnent du lait.",
    laiterie: "Le laitier baratte le lait en beurre.",
    veterinaire: "Le vétérinaire fait sa tournée et soigne les troupeaux malades.",
    fromagerie: "Le fromager affine le lait en fromages.",
    cremerie: "Le crémier prépare des yaourts avec le lait.",
    poulailler: "Les poules pondent des œufs.",
    bergerie: "On tond la laine des moutons.",
    porcherie: "Les cochons donnent de la viande.",
    tisserand: "Le tisserand tisse la laine en tissu.",
    tailleur: "Le tailleur coud le tissu en vêtements.",
    charcuterie: "Le charcutier fume la viande avec du charbon : des jambons.",
    depot: "Un 2e point de départ pour les porteurs, loin de l'entrepôt : les livraisons vont plus vite.",
    monument: "Le grand chantier de la ville, en 4 paliers : la fierté de tous les habitants.",
    centrale: "La centrale brûle du charbon et fait de l'électricité. Le courant suit les routes, jusqu'à " + 40 + " unités par centrale.",
    acierie: "L'aciérie (électrique) fond le fer en grande quantité : 2 fer + 1 charbon → 4 lingots.",
    filature: "La filature (électrique) file la laine à la machine : 2 laines → 3 tissus.",
    pompage: "La station de pompage (au bord de l'eau, électrique) envoie l'eau courante dans des tuyaux sous les routes, jusqu'à " + 40 + " unités.",
    epuration: "La station d'épuration (électrique) nettoie les eaux usées qui arrivent par les égouts, sous les routes, jusqu'à " + 40 + " unités.",
    immeuble: "Un immeuble de 4 étages : 20 lits pour des citadins. Une maison bourgeoise le devient quand elle a l'électricité, l'eau et les égouts.",
  },

  // Étape 34 : ⚡ l'ÉLECTRICITÉ (logique/electricite.js). Une centrale qui brûle du charbon fournit 40 unités ; le courant
  // suit les routes, et sert d'abord les bâtiments les plus proches. Ce que chacun consomme :
  electricite: {
    age: 5, // l'époque industrielle
    parCentrale: 40, // unités par centrale qui tourne
    logement: 1, atelier: 2, usine: 8, // consommation (unités)
    consommation: { entrepot: 3, depot: 2, universite: 4, marche: 2, monument: 4, pompage: 4, epuration: 4, immeuble: 3 },
    vitesse: 1.5, // un atelier alimenté travaille 1,5 fois plus vite
  },

  // Étape 35 : 🚰 l'EAU COURANTE et 🚽 les ÉGOUTS (logique/electricite.js). ✍️ Choix de Maxance : « comme l'électricité ».
  // Une station (qui a l'électricité et son ouvrier) fournit 40 unités ; les tuyaux suivent les routes, les plus proches
  // d'abord. La station de pompage doit être au bord de l'eau (à 3 cases au plus).
  // Ce que ça change : un besoin des habitants, les maisons bourgeoises deviennent des immeubles, et les élevages
  // qui ont l'eau courante n'ont plus besoin de l'eau du puits.
  eau: {
    parStation: 40, // unités par station qui tourne
    logement: 1, // un logement consomme 1 (et un immeuble 3)
    elevage: 2, // un élevage boit 2 (eau seulement)
    usine: 2, // une usine électrique rejette 2 aux égouts
    consommation: { immeuble: 3 },
  },

  // Étape 33 : 👥 la POPULATION et ses BESOINS, façon SimCity. Chaque besoin est noté de 0 à 100 % ; la PROSPÉRITÉ est la
  // moyenne. ✍️ « Plus la ville prospère, plus les habitants se portent bien, plus la ville grandit » : les arrivées de
  // nouveaux habitants vont × (0,5 + prospérité) : 0,5 fois plus vite dans une ville en crise, 1,5 fois dans une ville
  // florissante. Les besoins des époques à venir (électricité, eau courante…) sont déjà montrés, avec un cadenas.
  population: {
    releve: 30, // s entre deux relevés de la population (pour la courbe)
    releves: 40, // relevés gardés (20 min)
    niveaux: [[0, "en crise", "📉"], [40, "fragile", "😐"], [60, "stable", "🙂"], [75, "prospère", "📈"], [90, "florissante", "🌟"]],
    aVenir: [
      { emoji: "🚓", nom: "Sécurité (police)", quand: "époque moderne" },
      { emoji: "🚒", nom: "Protection contre le feu (pompiers)", quand: "époque moderne" },
      { emoji: "🏥", nom: "Santé (hôpital)", quand: "époque moderne" },
      { emoji: "🎓", nom: "Éducation (école)", quand: "époque moderne" },
    ],
  },

  // Étape 31 : 🏛️ le GRAND MONUMENT de la ville, en 4 paliers. Chaque palier demande des ressources de toutes les
  // chaînes ; on les donne quand on veut, petit à petit. Récompense de chaque palier : des 🪙, des 💎, et des points
  // de bonheur gagnés POUR TOUJOURS (bonheur).
  monument: {
    nom: "Le Grand Beffroi",
    paliers: [
      { nom: "Les fondations sculptées", emoji: "🧱", besoins: { pierres: 200, planches: 120, outils: 15 }, pieces: 300, gemmes: 3, bonheur: 4 },
      { nom: "Les grands murs", emoji: "🏛️", besoins: { pierres: 300, lingots: 40, planches: 100, charbon: 60 }, pieces: 500, gemmes: 4, bonheur: 5 },
      { nom: "La tour et le dôme doré", emoji: "🕌", besoins: { tissu: 40, bijoux: 15, outils: 30, lingots: 30 }, pieces: 800, gemmes: 6, bonheur: 6 },
      { nom: "La fête d'inauguration", emoji: "🎉", besoins: { pain: 80, fromage: 30, jambon: 30, vetements: 40, yaourt: 20 }, pieces: 1500, gemmes: 10, bonheur: 10 },
    ],
  },

  missions: {
    attente: 60, // s entre la fin d'une mission et la proposition suivante
    liste: [
      { id: "fete", age: 0, qui: "Marcel, le vieux pêcheur", emoji: "👴", histoire: "C'est bientôt la fête du campement ! Il faut de quoi faire un grand repas autour du feu.", demande: { poissons: 15 }, duree: 300, recompense: { gemmes: 2, planches: 10 } },
      { id: "hiver", age: 0, qui: "Rose, la cheffe du campement", emoji: "👩", histoire: "L'hiver approche, et les tentes ont froid. Rapporte du bois pour faire des réserves !", demande: { troncs: 15 }, duree: 300, recompense: { gemmes: 2, pierres: 10 } },
      { id: "chasse", age: 0, qui: "Bastien, l'apprenti chasseur", emoji: "🧒", histoire: "Je veux prouver à tout le monde que le campement peut se nourrir tout seul. Tu m'aides ?", demande: { viande: 12 }, duree: 360, recompense: { gemmes: 2, poissons: 10 } },
      { id: "muret", age: 0, qui: "Jeanne, la bâtisseuse", emoji: "👷", histoire: "Je veux construire un muret autour du feu pour le protéger du vent.", demande: { pierres: 25, planches: 10 }, duree: 360, recompense: { gemmes: 3 } },
      { id: "forge", age: 1, qui: "Gaspard, le forgeron voyageur", emoji: "🧔", histoire: "J'ai entendu parler de ton hameau ! Si tu me trouves du charbon, je t'apprendrai mes secrets.", demande: { charbon: 15 }, duree: 420, recompense: { gemmes: 3, planches: 20 } },
      { id: "sages", age: 1, qui: "Les sages de l'université", emoji: "🧙", histoire: "Nos livres ont besoin d'étagères, et nos savants de bons repas pour réfléchir.", demande: { planches: 40, poissons: 20 }, duree: 480, recompense: { gemmes: 4 } },
      { id: "marchand", age: 1, qui: "Lina, la marchande", emoji: "👩‍🦰", histoire: "Ma caravane traverse les montagnes. J'achète tes pierres, si tu en as beaucoup !", demande: { pierres: 50 }, duree: 480, recompense: { gemmes: 4, viande: 15 } },
      // Étape 8 : les missions du village. Elles paient aussi en pièces 🪙.
      { id: "pont", age: 2, qui: "Armand, le ferronnier", emoji: "🧑‍🏭", histoire: "Le vieux pont du moulin est tout rouillé. Avec de bons lingots, je le remets à neuf avant les pluies.", demande: { lingots: 10 }, duree: 600, recompense: { pieces: 60, gemmes: 2 } },
      { id: "bucherons", age: 2, qui: "Odile, la cheffe des bûcherons", emoji: "👩‍🌾", histoire: "Nos haches sont émoussées et la forêt avance moins vite que l'hiver. Il nous faut des outils neufs !", demande: { outils: 6 }, duree: 600, recompense: { pieces: 80, gemmes: 3 } },
      { id: "caravane", age: 2, qui: "Le capitaine de la caravane", emoji: "🐪", histoire: "Ma caravane repart vers la capitale. Je paie bien le minerai et le charbon, mais je ne peux pas attendre longtemps.", demande: { fer: 20, charbon: 20 }, duree: 480, recompense: { pieces: 70, gemmes: 2 } },
      { id: "banquet", age: 2, qui: "Le maire du village", emoji: "🎩", histoire: "Le village a grandi : il est temps de fêter ça ! Un grand banquet pour tous les habitants.", demande: { poissons: 30, viande: 30 }, duree: 720, recompense: { pieces: 50, gemmes: 3 } },
      // Étape 11 : les missions du bourg (et les grosses commandes de la capitale)
      { id: "boulanger", age: 3, qui: "Margot, la boulangère", emoji: "👩‍🍳", histoire: "Le bourg a faim de bon pain ! Aide-moi à remplir les étals avant le marché du dimanche.", demande: { pain: 40 }, duree: 900, recompense: { pieces: 150, gemmes: 3 } },
      { id: "couronne", age: 3, qui: "Le seigneur du château", emoji: "🤴", histoire: "Ma fille se marie. Il me faut des bijoux dignes d'une princesse, et vite !", demande: { bijoux: 4 }, duree: 900, recompense: { pieces: 300, gemmes: 5 } },
      { id: "capitale1", age: 3, qui: "Commande de la capitale", emoji: "📦", histoire: "La capitale construit une cathédrale. Elle achète en gros : outils, lingots et planches.", demande: { outils: 20, lingots: 20, planches: 150 }, duree: 1500, recompense: { pieces: 450, gemmes: 6 } },
      { id: "disette", age: 3, qui: "Le village voisin", emoji: "🧑‍🌾", histoire: "Nos récoltes ont gelé. Peux-tu nous envoyer de la farine et du poisson pour passer l'hiver ?", demande: { farine: 30, poissons: 60 }, duree: 1200, recompense: { pieces: 200, gemmes: 4 } },
      // Étape 15 : les missions de l'élevage
      { id: "laitEnfants", age: 1, qui: "Mathilde, la maîtresse d'école", emoji: "👩‍🏫", histoire: "Les enfants du hameau grandissent vite ! Un bon bol de lait chaque matin, ce serait merveilleux.", demande: { lait: 20 }, duree: 480, recompense: { gemmes: 3, planches: 15 } },
      { id: "crepes", age: 2, qui: "Léon, le cuisinier de l'auberge", emoji: "🧑‍🍳", histoire: "C'est la Chandeleur ! Il me faut du beurre et du lait pour faire des crêpes à tout le village.", demande: { beurre: 12, lait: 20 }, duree: 720, recompense: { pieces: 90, gemmes: 3 } },
      { id: "fromages", age: 3, qui: "Le grand concours des fromages", emoji: "🏆", histoire: "Les meilleurs fromagers de la région viennent au bourg. Montre-leur tes fromages et tes yaourts !", demande: { fromage: 12, yaourt: 20 }, duree: 1200, recompense: { pieces: 250, gemmes: 5 } },
      // Étape 16
      { id: "omelette", age: 1, qui: "Paulette, la fermière", emoji: "👵", histoire: "Demain, c'est la fête des moissons. Je veux faire une omelette géante pour tout le hameau !", demande: { oeufs: 30 }, duree: 480, recompense: { gemmes: 3, pierres: 15 } },
      { id: "couvertures", age: 2, qui: "Le berger de la montagne", emoji: "🧑‍🦳", histoire: "L'hiver arrive, et les nuits sont glacées là-haut. Il me faudrait du bon tissu pour des couvertures.", demande: { tissu: 10, laine: 10 }, duree: 720, recompense: { pieces: 110, gemmes: 3 } },
      { id: "noces", age: 3, qui: "Les jeunes mariés du bourg", emoji: "💒", histoire: "On se marie samedi ! Il nous faut de beaux habits pour les invités, et du jambon pour le banquet.", demande: { vetements: 10, jambon: 16 }, duree: 1200, recompense: { pieces: 280, gemmes: 5 } },
      { id: "halle", age: 2, qui: "Les maçons", emoji: "👷‍♂️", histoire: "On veut bâtir une grande halle couverte pour le marché. Il nous faut du bois, de la pierre et de bons outils.", demande: { planches: 60, pierres: 60, outils: 4 }, duree: 900, recompense: { pieces: 120, gemmes: 4 } },
    ],
  },

  // Étape 7 : 💎 la BOUTIQUE. Les gemmes se gagnent seulement en jouant (missions, nouveaux âges) :
  // aucun vrai argent. Elles achètent des améliorations ou des décorations.
  boutique: [
    { id: "porteur", nom: "Une place de manutentionnaire", emoji: "🚚", prix: 4, texte: "+1 place de porteur à l'entrepôt (5 au plus)" }, // étape 13
    { id: "express", nom: "Chantier express", emoji: "⏩", prix: 1, texte: "Termine tout de suite le chantier choisi" },
    { id: "coffre", nom: "Coffre de matériaux", emoji: "🧰", prix: 2, texte: "+20 🟫 et +10 🪨" },
    { id: "festin", nom: "Panier de nourriture", emoji: "🧺", prix: 2, texte: "+15 🐟 et +10 🍖" },
    { id: "bourse", nom: "Bourse de pièces", emoji: "🪙", prix: 2, texte: "+40 🪙 pour le marché (à partir du village)" }, // étape 8
    { id: "drapeau", nom: "Nouvelle couleur de drapeau", emoji: "🚩", prix: 1, texte: "Change la couleur du drapeau du village" },
  ],
  porteursMax: 5, // étape 13 : places de porteur achetées à la boutique, au plus

  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  // Étape 11 : ✍️ la RÉSERVE (le silo de l'entrepôt). Quand tu n'es pas là, le village continue de
  // travailler, et ce qu'il produit est rangé dans la réserve… jusqu'à ce qu'elle soit pleine.
  // Plus elle est grande, plus le village continue longtemps sans toi. L'agrandir coûte TRÈS cher.
  //   capacité au niveau n = capacite × facteurCapacite^(n − 1)   (150, 270, 486, 875… objets)
  //   prix pour passer du niveau n au n + 1 = prix × facteurPrix^(n − 1)   (ou des 💎)
  reserve: {
    capacite: 150, facteurCapacite: 1.8,
    prix: { planches: 40, pierres: 30 }, prixPieces: 60, facteurPrix: 2.2, // les 🪙 seulement à partir du village
    gemmes: 4, gemmesEnPlus: 3, // 💎 au niveau 1, puis + 3 à chaque niveau
    absenceMax: 12 * 3600, // s : au-delà de 12 heures d'absence, on ne compte plus
    rythmeMin: 2, // min : il faut avoir joué au moins 2 minutes pour mesurer le rythme du village
  },

  // Étape 11 : 📺 les PUBS (pour l'instant de FAUSSES pubs : rien n'est encore branché).
  // ✍️ Une proposition apparaît au hasard pendant le jeu. Pour ne pas rendre le jeu trop facile :
  //   - la récompense vaut quelques minutes de production du village (pas plus) ;
  //   - chaque pub regardée le même jour vaut un peu moins que la précédente (× 0,88), jusqu'à 35 % ;
  //   - elle ne dépasse jamais le quart de ce qui manque pour l'âge suivant.
  pub: {
    attenteMin: 240, attenteMax: 540, // s de jeu entre deux propositions (au hasard entre les deux)
    expire: 25, // s : sans réponse, la proposition disparaît
    duree: 5, // s : la fausse pub (une vraie pub dure 15 à 30 s)
    minutes: 4, // la récompense en ressources = 4 minutes de production du village
    minimumValeur: 24, // … mais au moins l'équivalent de 24 🪙 au marché (ex. 12 🟫, ou 1 💍 seulement : un bijou vaut cher !)
    baisse: 0.88, plancher: 0.35, // la valeur baisse à chaque pub du même jour, jusqu'à 35 %
    partObjectif: 0.25, // pas plus du quart de ce qui manque pour l'objectif de l'âge
    accelere: 0.5, // une pub fait gagner la moitié du temps qui reste d'un chantier ou d'une recherche
    chanceGemme: 0.08, // 8 % des propositions offrent 1 💎
  },

  // Étape 11 : les règles plus dures du bourg
  bourg: {
    ageDesRegles: 3, // à partir de quel âge (3 = le bourg)
    usure: 1800, // s pour qu'un bâtiment s'use complètement (30 min de jeu) ; usé = 2 fois moins vite
    reparer: 0.6, // étape 12 : à 60 % d'usure, le maçon-couvreur vient le réparer (avec 1 🔨 outil)
    chauffage: 60, // s : en hiver, toutes les minutes, chaque logement brûle 1 🪵 tronc
    froid: 0.8, // sans bois de chauffage : tout le monde va 20 % moins vite
    sansPain: 0.8, // un habitant du bourg qui n'a pas eu de pain : 20 % moins vite
  },

  animation: {
    vent: 1.4, // vitesse du balancement des arbres (tours par seconde, à peu près)
    forceDuVent: 0.06, // de combien les arbres penchent (0 = pas du tout)
    vagues: 1.2, // vitesse des vaguelettes
    nuages: 6, // nombre de nuages
    vitesseNuages: 18, // px/s
  },
};
