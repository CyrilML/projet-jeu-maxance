// 🎛️ LES RÉGLAGES DU VILLAGE
//
// Tous les nombres qui changent le jeu sont rangés ici, et nulle part ailleurs.
// « La carte est trop petite », « il y a trop d'eau », « la caméra va trop vite » : c'est ce fichier
// qu'on modifie.
//
// Unités : px (pixels), s (secondes), px/s (pixels par seconde).
// La carte est une grille de CASES : chaque case a une colonne et une ligne (comme une bataille navale).
// À l'écran, chaque case est dessinée en LOSANGE : c'est la vue « de biais » (isométrique).

window.Village = window.Village || {};

Village.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  version: 2,

  // La taille de l'écran du jeu n'est plus fixe depuis l'étape 47 : elle suit la fenêtre
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

  // Étape 47 : ✍️ le stock de départ, rangé dans l'entrepôt.
  depart: { troncs: 0, planches: 20, pierres: 10 },

  // Étape 47 : les bâtiments. Le coût est pris dans l'entrepôt dès qu'on pose le chantier.
  //   construction : durée du chantier (s) ; rayon : jusqu'où l'ouvrier va travailler (en cases).
  batiments: {
    bucheron: { cout: { planches: 3 }, construction: 8, rayon: 6 },
    forestier: { cout: { planches: 3 }, construction: 8, rayon: 5 },
    scierie: { cout: { planches: 4, pierres: 2 }, construction: 12 },
    carriere: { cout: { planches: 3 }, construction: 8, rayon: 6 },
  },

  ouvriers: {
    vitesse: 1.6, // cases par seconde
    couper: 4, // s pour couper un arbre
    planter: 3, // s pour planter une pousse
    tailler: 5, // s pour tailler une pierre
    repos: 2, // s de pause entre deux voyages
    scier: 6, // s pour scier 1 tronc
    planchesParTronc: 2, // la scierie fait 2 planches avec 1 tronc
    attente: 3, // s avant de chercher à nouveau quand il n'y a rien à faire
  },

  nature: {
    croissance: 60, // s pour qu'une pousse devienne un arbre
    pierresParRocher: 4, // un rocher donne 4 pierres, puis il disparaît
  },

  sauvegardeAuto: 15, // s entre deux sauvegardes automatiques

  animation: {
    vent: 1.4, // vitesse du balancement des arbres (tours par seconde, à peu près)
    forceDuVent: 0.06, // de combien les arbres penchent (0 = pas du tout)
    vagues: 1.2, // vitesse des vaguelettes
    nuages: 6, // nombre de nuages
    vitesseNuages: 18, // px/s
  },
};
