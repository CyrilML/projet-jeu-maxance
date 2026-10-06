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
  version: 13,

  // La taille de l'écran du jeu n'est plus fixe depuis l'étape 2 : elle suit la fenêtre
  // (ordinateur, tablette, téléphone). Voir moteur/ecran.js.

  // La boucle de jeu avance par petits pas fixes de 1/120 s, comme dans les autres jeux.
  pasFixe: 1 / 120,

  carte: {
    colonnes: 64,
    lignes: 64,
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
    tailleDesCollines: 14, // en cases : plus c'est grand, plus les zones (lacs, forêts) sont grandes
    tailleDesForets: 9, // en cases
    eauProfonde: 0.18, // part des cases (les plus basses) en eau profonde
    eau: 0.3, // jusqu'à cette part : eau
    sable: 0.35, // jusqu'à cette part : plage de sable
    rochers: 0.91, // au-dessus de cette part : rochers (future carrière de pierre)
    montagne: 0.95, // au-dessus : montagne (futures mines) : les 5 % de cases les plus hautes
    foret: 0.56, // humidité au-dessus : forêt (sur l'herbe seulement)
    prairie: 0.3, // humidité en dessous : prairie fleurie
    densiteArbres: 0.75, // dans une forêt, chance qu'une case ait un arbre
    arbresIsoles: 0.03, // dans l'herbe, chance d'un arbre tout seul
    // Les filons des montagnes : chance qu'une case de montagne en ait un.
    filons: { charbon: 0.16, fer: 0.1, or: 0.04 },
    rayonDuVillage: 4, // en cases : autour de la place du village, toujours de l'herbe
    rivieres: 2, // nombre de rivières qui descendent des montagnes
  },

  camera: {
    vitesse: 700, // px/s quand on tient une flèche (au zoom 100 %)
    zoomMin: 0.35,
    zoomMax: 2,
    zoomDepart: 1,
    pasDeZoom: 1.15, // un cran de molette multiplie (ou divise) le zoom par 1,15
  },

  // Étape 2 : ✍️ le stock de départ, rangé dans l'entrepôt.
  // Étape 5 : ✍️ plus de stock au départ, pour ne pas frustrer le joueur (avant : 0, 20, 10, 6, 4).
  depart: { troncs: 5, planches: 30, pierres: 30, poissons: 12, viande: 8, charbon: 0, fer: 0, lingots: 0, outils: 0, ble: 0, farine: 0, pain: 0, or: 0, bijoux: 0 }, // étape 7 : le charbon ; étape 8 : le fer, les lingots, les outils

  // Étape 8 : la fiche de chaque ressource (son emoji et son nom). Tous les panneaux la lisent ici.
  ressources: {
    troncs: { emoji: "🪵", nom: "troncs" },
    planches: { emoji: "🟫", nom: "planches" },
    pierres: { emoji: "🪨", nom: "pierres" },
    poissons: { emoji: "🐟", nom: "poissons" },
    viande: { emoji: "🍖", nom: "viande" },
    charbon: { emoji: "⚫", nom: "charbon", age: 1 }, // age : l'âge où cette ressource apparaît (étape 11)
    fer: { emoji: "🟤", nom: "minerai de fer", age: 2 },
    lingots: { emoji: "🔩", nom: "lingots", age: 2 },
    outils: { emoji: "🔨", nom: "outils", age: 2 },
    // Étape 11 : le bourg
    ble: { emoji: "🌾", nom: "blé", age: 3 },
    farine: { emoji: "⚪", nom: "farine", age: 3 },
    pain: { emoji: "🍞", nom: "pain", age: 3 },
    or: { emoji: "🟡", nom: "pépites d'or", age: 3 },
    bijoux: { emoji: "💍", nom: "bijoux", age: 3 },
  },

  // Étape 2 : les bâtiments. Depuis l'étape 3, le coût est RÉSERVÉ quand on pose le chantier,
  // puis les porteurs apportent les matériaux un par un.
  //   construction : durée du chantier (s) ; rayon : jusqu'où l'ouvrier va travailler (en cases).
  batiments: {
    bucheron: { cout: { planches: 3 }, construction: 8, rayon: 6 },
    forestier: { cout: { planches: 3 }, construction: 8, rayon: 5 },
    scierie: { cout: { planches: 4, pierres: 2 }, construction: 12 },
    carriere: { cout: { planches: 3 }, construction: 8, rayon: 6 },
    pecheur: { cout: { planches: 3 }, construction: 8, rayon: 6 }, // étape 4
    chasseur: { cout: { planches: 3 }, construction: 8, rayon: 8 }, // étape 4
    geologue: { cout: { planches: 3, pierres: 1 }, construction: 8, rayon: 8 }, // étape 5
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
  },

  // Étape 8 : les ATELIERS transforment ce que les porteurs leur apportent (les RECETTES).
  //   entrees : ce qu'il faut pour UNE fabrication ; sorties : ce qui sort ; duree : en s ;
  //   bonus : la clé des recherches qui accélèrent cet atelier.
  ateliers: {
    scierie: { entrees: { troncs: 1 }, sorties: { planches: 2 }, duree: 6, bonus: "scier" },
    fonderie: { entrees: { fer: 1, charbon: 1 }, sorties: { lingots: 1 }, duree: 10, bonus: "fondre" }, // ✍️ 1A : simple
    forge: { entrees: { lingots: 1, planches: 1 }, sorties: { outils: 1 }, duree: 12, bonus: "forger" },
    // Étape 11 : le pain et l'or. La ferme n'a besoin de rien… sauf qu'il ne fasse pas l'hiver !
    ferme: { entrees: {}, sorties: { ble: 2 }, duree: 14, bonus: "cultiver", pasEnHiver: true },
    moulin: { entrees: { ble: 2 }, sorties: { farine: 1 }, duree: 8, bonus: "moudre" },
    boulangerie: { entrees: { farine: 1, troncs: 1 }, sorties: { pain: 2 }, duree: 10, bonus: "cuire" }, // le tronc chauffe le four
    orfevre: { entrees: { or: 2, charbon: 1 }, sorties: { bijoux: 1 }, duree: 20, bonus: "orfevrerie" },
  },
  // Étape 8 : les MINES. Chacune creuse le filon de sa sorte, juste à côté d'elle.
  mines: {
    mineCharbon: { filon: "charbon" },
    mineFer: { filon: "fer" },
    mineOr: { filon: "or" }, // étape 11
  },

  // Étape 8 : ✍️ 2B, chaque ouvrier a besoin d'une PLACE pour dormir. Le campement (les tentes autour de
  // l'entrepôt) loge 6 ouvriers ; chaque hutte en loge 3 de plus, chaque maison 6.
  // (Les porteurs, eux, dorment à l'entrepôt : ils ne comptent pas.)
  logement: { entrepot: 6, hutte: 3, maison: 6 },

  // Étape 8 : 🏪 le MARCHÉ. Chaque ressource a un prix de base en pièces 🪙 (pour 1 objet). Le prix BOUGE :
  //   quand tu vends beaucoup, le prix baisse (les acheteurs en ont assez) ;
  //   quand tu achètes beaucoup, il monte ; puis il revient tout doucement vers le prix de base.
  marche: {
    prix: { troncs: 1, planches: 2, pierres: 2, poissons: 2, viande: 2, charbon: 3, fer: 4, lingots: 10, outils: 22, ble: 1, farine: 3, pain: 4, or: 12, bijoux: 70 },
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
  },
  // Étape 6 : la vitesse de marche selon le sol (× la vitesse normale)
  sols: {
    horsRoute: 0.85, // à travers champs
    terre: 1, // sur un chemin de terre
    pierre: 1.6, // sur une route en pierre (plus tard)
  },
  porteurs: {
    nombre: 3, // les porteurs qui habitent l'entrepôt
    vitesse: 2.2, // cases par seconde
  },
  sortieMax: 4, // objets qui peuvent attendre devant un bâtiment (au-delà, l'ouvrier attend)
  entreeMax: 2, // de chaque ingrédient en réserve dans un atelier (scierie, fonderie, forge)

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
    intervalle: 150, // s entre deux repas (2 min 30 ; 120 s à l'étape 4)
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
    depart: 40, // au début de la partie (24 avant l'étape 5)
    maximum: 70, // (40 avant l'étape 5)
    naissance: 12, // s entre deux naissances (pas en hiver) (20 avant l'étape 5)
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
    { id: "hameau", nom: "Le hameau", emoji: "🛖", debloque: ["geologue", "universite", "mineCharbon"],
      objectifs: { batiments: 10, recherches: 3, stock: { planches: 80, charbon: 20 }, nourriture: 60 } },
    // La suite (prévue, pas encore construite) : ce que chaque âge débloquera.
    // Étape 8 : le village débloque le fer, la fonderie, la forge, les maisons et le marché.
    //   pieces : 🪙 qu'il faut avoir ; habitants : ouvriers logés.
    { id: "village", nom: "Le village", emoji: "🏡", debloque: ["mineFer", "fonderie", "forge", "maison", "marche"],
      objectifs: { batiments: 18, habitants: 16, recherches: 7, stock: { lingots: 10, outils: 10 }, pieces: 150 } },
    // Étape 11 : ✍️ le bourg, et c'est de plus en plus dur ! (chaque âge demande environ 2 fois plus)
    //   Le bourg ajoute 3 nouvelles choses à penser : le PAIN (les habitants en veulent), l'ENTRETIEN
    //   (les bâtiments s'usent) et des HIVERS plus durs (il faut du bois de chauffage).
    { id: "bourg", nom: "Le bourg", emoji: "🏰", debloque: ["ferme", "moulin", "boulangerie", "mineOr", "orfevre", "macon"],
      objectifs: { batiments: 32, habitants: 34, recherches: 13, stock: { pain: 60, bijoux: 8, outils: 25 }, pieces: 600 } },
    { id: "ville", nom: "La ville", emoji: "🏙️", debloque: [], objectifs: null,
      aVenir: "⛏️ mines d'argent, 🏛️ grands monuments, 🎭 fêtes, 🚢 port" },
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
    { id: "brouettes", nom: "Brouettes", emoji: "🛒", age: 1, cout: { planches: 30, pierres: 10 }, duree: 90, effet: { porteurs: 1.3, brouette: true }, texte: "Les porteurs vont 30 % plus vite (et poussent une brouette pour le lourd)" },
    { id: "paves", nom: "Routes pavées", emoji: "🧱", age: 1, cout: { pierres: 30, charbon: 5 }, duree: 90, effet: { routePierre: true }, texte: "Débloque la route en pierre (× 1,6 plus rapide)" },
    { id: "fumoir", nom: "Le fumoir", emoji: "🔥", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { repas: 1.5 }, texte: "La nourriture dure plus longtemps : un repas toutes les 3 min 45" },
    { id: "prospection", nom: "Prospection", emoji: "🔍", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { filons: true }, texte: "Le géologue peut aussi trouver des filons de charbon" },
    // Étape 8 : les recherches du village
    { id: "soufflets", nom: "Soufflets", emoji: "🌬️", age: 2, cout: { planches: 30, charbon: 20 }, duree: 90, effet: { fondre: 0.7 }, texte: "La fonderie va 30 % plus vite" },
    { id: "enclumes", nom: "Enclumes", emoji: "⚒️", age: 2, cout: { lingots: 8, pierres: 20 }, duree: 120, effet: { forger: 0.7 }, texte: "La forge va 30 % plus vite" },
    { id: "scies", nom: "Scies en fer", emoji: "🪚", age: 2, cout: { outils: 4, planches: 20 }, duree: 120, effet: { scier: 0.6 }, texte: "La scierie scie 40 % plus vite" },
    { id: "outilsFer", nom: "Outils en fer", emoji: "🔨", age: 2, cout: { outils: 8 }, duree: 150, effet: { couper: 0.8, tailler: 0.8, planter: 0.8, miner: 0.8 }, texte: "Bûcheron, forestier, carrier et mineurs : 20 % plus vite" },
    { id: "commerce", nom: "Commerce", emoji: "⚖️", age: 2, cout: { planches: 30, lingots: 5 }, duree: 120, effet: { vente: 1.2 }, texte: "Le marché te paie 20 % plus cher" },
    { id: "charrettes", nom: "Ânes et charrettes", emoji: "🫏", age: 2, cout: { planches: 40, lingots: 4, outils: 4 }, duree: 150, effet: { chargement: 3 }, texte: "Chaque porteur part avec un âne et sa charrette : 3 objets par voyage" }, // étape 9
    // Étape 11 : les recherches du bourg
    { id: "meules", nom: "Meules en granit", emoji: "🪨", age: 3, cout: { pierres: 60, outils: 6 }, duree: 150, effet: { moudre: 0.7 }, texte: "Le moulin va 30 % plus vite" },
    { id: "fours", nom: "Fours en briques", emoji: "🧱", age: 3, cout: { pierres: 50, charbon: 30, outils: 4 }, duree: 150, effet: { cuire: 0.7 }, texte: "La boulangerie va 30 % plus vite" },
    { id: "charrues", nom: "Charrues", emoji: "🚜", age: 3, cout: { lingots: 10, planches: 40 }, duree: 180, effet: { cultiver: 0.7 }, texte: "La ferme va 30 % plus vite" },
    { id: "entretien", nom: "Bon entretien", emoji: "🧰", age: 3, cout: { outils: 12, planches: 40 }, duree: 180, effet: { usure: 0.6 }, texte: "Les bâtiments s'usent 40 % moins vite" },
    { id: "poeles", nom: "Poêles en fonte", emoji: "🔥", age: 3, cout: { lingots: 12, pierres: 40 }, duree: 180, effet: { chauffage: 0.6 }, texte: "L'hiver, on brûle 40 % de bois en moins" },
    { id: "orfevrerie", nom: "Orfèvrerie fine", emoji: "💍", age: 3, cout: { or: 10, outils: 6 }, duree: 200, effet: { orfevrerie: 0.7 }, texte: "L'orfèvre va 30 % plus vite" },
    { id: "filonsOr", nom: "Filons d'or", emoji: "🧭", age: 3, cout: { outils: 8, pain: 20 }, duree: 200, effet: { filonsOr: true }, texte: "Le géologue peut aussi trouver des filons d'or" },
    { id: "filonsFer", nom: "Filons de fer", emoji: "🧭", age: 2, cout: { charbon: 20, outils: 3 }, duree: 120, effet: { filonsFer: true }, texte: "Le géologue peut aussi trouver des filons de fer" },
  ],

  // Étape 7 : 📜 les MISSIONS. Un personnage raconte une petite histoire et demande des ressources
  // avant la fin du temps. Réussie : une récompense et des 💎. Ratée : rien de grave, une autre viendra.
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
      { id: "halle", age: 2, qui: "Les maçons", emoji: "👷‍♂️", histoire: "On veut bâtir une grande halle couverte pour le marché. Il nous faut du bois, de la pierre et de bons outils.", demande: { planches: 60, pierres: 60, outils: 4 }, duree: 900, recompense: { pieces: 120, gemmes: 4 } },
    ],
  },

  // Étape 7 : 💎 la BOUTIQUE. Les gemmes se gagnent seulement en jouant (missions, nouveaux âges) :
  // aucun vrai argent. Elles achètent des améliorations ou des décorations.
  boutique: [
    { id: "porteur", nom: "Un porteur de plus", emoji: "🚚", prix: 4, texte: "+1 porteur à l'entrepôt (8 maximum)" },
    { id: "express", nom: "Chantier express", emoji: "⏩", prix: 1, texte: "Termine tout de suite le chantier choisi" },
    { id: "coffre", nom: "Coffre de matériaux", emoji: "🧰", prix: 2, texte: "+20 🟫 et +10 🪨" },
    { id: "festin", nom: "Panier de nourriture", emoji: "🧺", prix: 2, texte: "+15 🐟 et +10 🍖" },
    { id: "bourse", nom: "Bourse de pièces", emoji: "🪙", prix: 2, texte: "+40 🪙 pour le marché (à partir du village)" }, // étape 8
    { id: "drapeau", nom: "Nouvelle couleur de drapeau", emoji: "🚩", prix: 1, texte: "Change la couleur du drapeau du village" },
  ],
  porteursMax: 8,

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
