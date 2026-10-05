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
  version: 8,

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
  depart: { troncs: 5, planches: 30, pierres: 30, poissons: 12, viande: 8, charbon: 0 }, // étape 7 : le charbon

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
  },
  // Étape 5 : ✍️ la cabane du pêcheur doit être au bord de l'eau (de l'eau à 3 cases maximum).
  bordDeLEau: 3,

  ouvriers: {
    vitesse: 1.6, // cases par seconde
    couper: 4, // s pour couper un arbre
    planter: 3, // s pour planter une pousse
    tailler: 5, // s pour tailler une pierre
    repos: 2, // s de pause entre deux voyages
    scier: 6, // s pour scier 1 tronc
    pecher: 6, // s pour pêcher 1 poisson (étape 4 ; 8 s avant l'étape 5)
    chasser: 4, // s pour chasser 1 gibier (étape 4) : 3 s pour tendre l'arc, puis la flèche part
    prospecter: 6, // s pour qu'un géologue cherche un gisement (étape 5)
    miner: 8, // s pour qu'un mineur sorte 1 morceau de charbon (étape 7)
    chanceDeTrouver: 0.5, // étape 5 : 1 chance sur 2 de trouver un gisement à chaque recherche
    lentSiFaim: 2, // étape 5 : ✍️ le ventre vide, on travaille et on marche 2 fois moins vite
    planchesParTronc: 2, // la scierie fait 2 planches avec 1 tronc
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
  entreeMax: 2, // troncs en réserve à la scierie

  // Étape 4 : ✍️ une année dure 10 minutes. 4 saisons de 2 min 30 : printemps, été, automne, hiver.
  saisons: {
    dureeAnnee: 1200, // s : ✍️ étape 6, 20 minutes (5 min par saison). 10 minutes avant.
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
    { id: "campement", nom: "Le campement", emoji: "🏕️", debloque: ["bucheron", "forestier", "scierie", "carriere", "pecheur", "chasseur"],
      objectifs: { batiments: 6, stock: { planches: 40, pierres: 20 }, nourriture: 30 } },
    // Étape 7 : le hameau débloque l'université (les recherches), la mine de charbon et le géologue.
    { id: "hameau", nom: "Le hameau", emoji: "🛖", debloque: ["geologue", "universite", "mineCharbon"],
      objectifs: { batiments: 10, recherches: 3, stock: { planches: 80, charbon: 20 }, nourriture: 60 } },
    // La suite (prévue, pas encore construite) : ce que chaque âge débloquera.
    { id: "village", nom: "Le village", emoji: "🏡", debloque: [], objectifs: null,
      aVenir: "⛏️ mine de fer, 🔥 fonderie (fer + charbon → lingots), ⚒️ forge (outils), 🏠 maisons" },
    { id: "bourg", nom: "Le bourg", emoji: "🏰", debloque: [], objectifs: null,
      aVenir: "⛏️ mines d'or et d'argent, 💍 orfèvre, 🏪 marché (vendre contre des pièces)" },
    { id: "ville", nom: "La ville", emoji: "🏙️", debloque: [], objectifs: null,
      aVenir: "🏛️ grands monuments, 🎭 fêtes, 🚢 port" },
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
    { id: "brouettes", nom: "Brouettes", emoji: "🛒", age: 1, cout: { planches: 30, pierres: 10 }, duree: 90, effet: { porteurs: 1.3 }, texte: "Les porteurs vont 30 % plus vite" },
    { id: "paves", nom: "Routes pavées", emoji: "🧱", age: 1, cout: { pierres: 30, charbon: 5 }, duree: 90, effet: { routePierre: true }, texte: "Débloque la route en pierre (× 1,6 plus rapide)" },
    { id: "fumoir", nom: "Le fumoir", emoji: "🔥", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { repas: 1.5 }, texte: "La nourriture dure plus longtemps : un repas toutes les 3 min 45" },
    { id: "prospection", nom: "Prospection", emoji: "🔍", age: 1, cout: { planches: 20, charbon: 10 }, duree: 90, effet: { filons: true }, texte: "Le géologue peut aussi trouver des filons de charbon" },
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
    ],
  },

  // Étape 7 : 💎 la BOUTIQUE. Les gemmes se gagnent seulement en jouant (missions, nouveaux âges) :
  // aucun vrai argent. Elles achètent des améliorations ou des décorations.
  boutique: [
    { id: "porteur", nom: "Un porteur de plus", emoji: "🚚", prix: 4, texte: "+1 porteur à l'entrepôt (8 maximum)" },
    { id: "express", nom: "Chantier express", emoji: "⏩", prix: 1, texte: "Termine tout de suite le chantier choisi" },
    { id: "coffre", nom: "Coffre de matériaux", emoji: "🧰", prix: 2, texte: "+20 🟫 et +10 🪨" },
    { id: "festin", nom: "Panier de nourriture", emoji: "🧺", prix: 2, texte: "+15 🐟 et +10 🍖" },
    { id: "drapeau", nom: "Nouvelle couleur de drapeau", emoji: "🚩", prix: 1, texte: "Change la couleur du drapeau du village" },
  ],
  porteursMax: 8,

  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  animation: {
    vent: 1.4, // vitesse du balancement des arbres (tours par seconde, à peu près)
    forceDuVent: 0.06, // de combien les arbres penchent (0 = pas du tout)
    vagues: 1.2, // vitesse des vaguelettes
    nuages: 6, // nombre de nuages
    vitesseNuages: 18, // px/s
  },
};
