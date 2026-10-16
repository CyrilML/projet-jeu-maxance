// ⚙️ LES RÉGLAGES : tous les nombres du jeu de tanks (étape 60)
//
// (étape 75) ✍️ « Refais aussi les tanks et les maisons » : des tanks plus beaux (voir « peinture »), des MAISONS qu'on
// peut détruire (voir « structures ») et des GRENADES (voir « grenades » et « armes »).
//
// (étape 74) ✍️ « Augmente la limite à 60 soldats et refais les images : le plus beau possible. » Voir « parachutistes »
// (maxParEquipe : 60), « beaute » (le sol, l'herbe, les arbres, l'eau, la lumière) et « qualite » (herbe, arbres en détail).
//
// (étape 73) ✍️ « Des hélicos de transport : un Chinook et un Black Hawk, pour les deux camps, 10 soldats à bord qui
// descendent à la corde. » Voir « engins » (chinook, blackhawk), « armes » (porte) et « helicosTransport ».
//
// (étape 71) ✍️ « Une carte 3 fois plus grande, une moto cross, un quad et un camion qui transporte 6 soldats. »
// Voir « monde » (2 100 m), « engins » (moto, quad, camion) et « vehicules » (ceux que conduit l'ordinateur).
//
// ✍️ Maxance a choisi : un nouveau jeu à part, une BATAILLE D'ÉQUIPES (toi + 3 alliés bleus contre 4 ennemis rouges),
// dans une campagne avec un village en ruines, avec de vrais tanks modernes (Leclerc, Abrams, Leopard 2), et
// 4 obus pour détruire un tank. Unités : m, s, m/s, radians.

window.Tanks = window.Tanks || {};

Tanks.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans tanks/index.html.
  version: 15,
  pasFixe: 1 / 120,
  // (étape 72) ✍️ « Ça rame trop. » La boucle ne fait jamais plus de 6 petits pas par image : si l'ordinateur est en
  // retard (une image a duré plus de 6 / 120 = 0,05 s), on JETTE le retard au lieu de courir après (sinon, plus il est
  // en retard, plus il a de pas à calculer, et plus il prend de retard : la « spirale de la mort »).
  boucle: { pasMaxParImage: 6 },

  monde: {
    // ✍️ (étape 71) 3 fois plus grande : 2 100 m de côté au lieu de 700 (donc 9 fois plus de terrain : 4,4 km²)
    taille: 2100, // m de côté
    graine: 1944,
    collines: { hauteur: 13, taille: 230 }, // des collines douces de 13 m, larges de 230 m environ
    village: { nom: "le village", x: 0, z: 0, rayon: 75, maisons: 16, murets: 26, ruines: 40 },
    // (étape 71) pour remplir la grande carte : deux autres groupes de maisons en ruines
    hameaux: [
      { nom: "le hameau de l'ouest", x: -560, z: 170, rayon: 60, maisons: 11, murets: 16 },
      { nom: "la ferme du nord-est", x: 300, z: -620, rayon: 48, maisons: 7, murets: 12 },
    ],
    // les arbres : en petits bois (« bosquets »), en grandes FORÊTS (étape 71) et quelques-uns tout seuls
    arbres: 2700, bosquets: 70, forets: 9, partForets: 0.45, partBosquets: 0.4,
    haies: 120, granges: 30,
    camp: 640, // m : (étape 71) chaque camp est à 640 m du centre (avant : 280 m) ; les Bleus au sud, les Rouges au nord
    pasHauteurs: 2, // m : (étape 71) le « cahier des hauteurs » retient la hauteur du sol tous les 2 m (voir logique/terrain.js)
    sol: 5, // m entre deux points du sol 3D (avant : 4 m ; la carte est plus grande, on garde le même nombre de triangles près de toi)
    bord: 20, // m : on ne peut pas sortir du champ de bataille (une clôture invisible à 20 m du bord)
  },

  equipes: {
    bleus: { nom: "les Bleus", marque: "#3b8cff", camouflage: ["#4b5a34", "#6b7547", "#2f3a24", "#8a8a62"] }, // vert OTAN
    rouges: { nom: "les Rouges", marque: "#ff4a3d", camouflage: ["#9a8a62", "#b8a57a", "#6e5f3e", "#5a6040"] }, // sable
    allies: 3, ennemis: 4, // ✍️ toi + 3 alliés contre 4 ennemis
    ecart: 14, // m entre deux tanks au départ
  },

  // ✍️ Trois vrais tanks modernes. Mesures réelles (caisse sans le canon) ; vitesse en m/s ; recharge en s.
  chars: [
    { id: "leclerc", nom: "Leclerc", pays: "France", drapeau: "🇫🇷", longueur: 6.9, largeur: 3.6, hauteur: 2.5, canon: 6.6,
      vitesseMax: 19.7, acceleration: 4.5, rotation: 0.85, tourelle: 0.8, recharge: 1.6,
      texte: "Le plus rapide à recharger (chargeur automatique)" },
    { id: "abrams", nom: "M1 Abrams", pays: "États-Unis", drapeau: "🇺🇸", longueur: 7.9, largeur: 3.7, hauteur: 2.4, canon: 5.6,
      vitesseMax: 18.6, acceleration: 4.8, rotation: 0.8, tourelle: 0.95, recharge: 2.0,
      texte: "Moteur à turbine, tourelle très rapide" },
    { id: "leopard", nom: "Leopard 2A6", pays: "Allemagne", drapeau: "🇩🇪", longueur: 7.7, largeur: 3.75, hauteur: 2.6, canon: 6.6,
      vitesseMax: 19, acceleration: 4.6, rotation: 0.82, tourelle: 0.85, recharge: 1.8,
      texte: "Tourelle en flèche, très précis" },
  ],

  char: {
    vie: 4, // ✍️ 4 obus pour détruire un tank (ceux de l'ordinateur)
    vieJoueur: 16, // ✍️ (étape 67) TON tank : 4 fois plus solide, 16 obus
    freinage: 9, ralentissement: 2.5, marcheArriere: 6, // m/s², m/s², m/s
    rayon: 3.6, // m : un tank est vu comme un cercle de ce rayon pour les chocs
    hausseMax: 0.3, hausseMin: -0.12, // rad : le canon monte de 17° et descend de 7°
    hauteurCanon: 2.2, // m : le canon est à 2,2 m au-dessus du sol
    porteeReticule: 150, // m : sans cible, on vise à 150 m
    ecraserArbre: 2.5, // m/s : à plus de 9 km/h, on écrase les arbres
  },

  obus: {
    vitesse: 160, // m/s (un vrai obus va à 1 700 m/s, mais on ne le verrait pas !)
    gravite: 4.9, // m/s² : il retombe un peu (la moitié de la vraie gravité, pour qu'on voie la courbe)
    vieMax: 4, // s : ensuite il disparaît
    viseeAssistee: 0.07, // rad (4°) : si un ennemi est dans ce cône, le canon se règle tout seul sur lui
    porteeAssistee: 450, // m
    tirAmi: false, // un obus qui touche un allié ne lui fait pas de mal
  },

  ia: {
    distanceCombat: 90, // m : un tank de l'ordinateur s'approche jusqu'à 90 m de sa cible, puis il tire
    contourner: 3, // s : s'il ne voit plus sa cible depuis 3 s, il la contourne
    portee: 380, // m : il tire seulement à moins de 380 m
    recharge: 3.2, // s : ses obus rechargent plus lentement que les tiens
    erreur: 0.012, // rad : il vise un peu de travers (± 0,7°), sinon il ne raterait jamais
    alignement: 0.04, // rad : il tire quand sa tourelle est pointée à moins de 2,3° de la cible
    regardObstacles: 16, // m : il regarde 16 m devant lui pour éviter les maisons
    changeDeCible: 4, // s : il revoit sa cible toutes les 4 s
    esquive: 2.5, // s : touché, il fait un écart pendant 2,5 s
  },

  // ------------------------------------------------------------------ étape 61 : à pied, les soldats, les autres engins
  // ✍️ 12 soldats par équipe, qui avancent avec les tanks et se tirent dessus. Dans chaque équipe, 2 soldats ont un
  // lance-roquettes (ils visent les tanks). ✍️ 3 balles = un soldat à terre.
  soldats: {
    parEquipe: 12, lanceRoquettes: 2,
    vie: 3, vieJoueur: 20, // ✍️ (étape 67) toi, tu tiens 20 balles (avant : 5)
    vitesse: 4.2, recul: 2.2, rotation: 2.6, // m/s, m/s, rad/s
    vue: 140, // m : un soldat voit et tire jusqu'à 140 m
    pense: 0.25, // s : un soldat de l'ordinateur réfléchit 4 fois par seconde (pas plus : ils sont 24 !)
    ecrase: 3, // m/s : un tank ou un 4x4 ennemi qui roule plus vite écrase un soldat
    // (étape 63) un soldat qui tombe à l'eau NAGE (lentement, sans tirer), la tête hors de l'eau
    nage: 1.6, // m/s
    detail: 45, // m : plus près que ça, on dessine le soldat en détail (genoux, coudes, visage…) ; plus loin, en simple
    // (étape 72 : cette distance dépend maintenant du niveau de qualité : voir « qualite.niveaux », soldatDetail)
  },
  // ✍️ Les armes à pied : le pistolet, la mitrailleuse et le lance-roquettes (touches 1, 2, 3).
  // Une balle va tout de suite où on vise (pas de vol) : la chance de toucher baisse avec la distance.
  armes: {
    pistolet: { nom: "Pistolet", icone: "🔫", cadence: 0.35, precision: 0.9, portee: 70, degats: 1 },
    mitrailleuse: { nom: "Mitrailleuse", icone: "🔫🔫", cadence: 0.09, precision: 0.6, portee: 140, degats: 1 },
    roquettes: { nom: "Lance-roquettes", icone: "🚀", cadence: 3, roquette: true }, // ✍️ 1 roquette = 1 obus pour un tank
    grenades: { nom: "Grenades", icone: "💣", cadence: 1.1, grenade: true }, // ✍️ (étape 75) touche 4 : Espace lance une grenade
    soldat: { cadence: 0.6, precision: 0.35, portee: 140, degats: 1 }, // le fusil des soldats de l'ordinateur
    // (étape 71) le pistolet du motard (il tire d'une main en roulant) et la petite mitrailleuse du quad
    motard: { nom: "Pistolet du motard", icone: "🔫", cadence: 0.45, precision: 0.5, portee: 70, degats: 1 },
    quad: { nom: "Mitrailleuse du quad", icone: "🔫🔫", cadence: 0.11, precision: 0.42, portee: 120, degats: 1 },
    // (étape 73) la mitrailleuse de porte des hélicos de transport (un tireur à chaque porte, elle tire toute seule)
    porte: { nom: "Mitrailleuse de porte", icone: "🔫🔫", cadence: 0.13, precision: 0.38, portee: 120, degats: 1 },
  },
  // Les projectiles qui volent (en plus des obus) : vitesse (m/s), gravité, dégâts sur un tank, rayon de l'explosion.
  projectiles: {
    obus: { degatsChar: 1, souffle: 5 }, // (sa vitesse et sa gravité sont plus haut, dans « obus »)
    roquette: { vitesse: 75, gravite: 0.6, degatsChar: 1, souffle: 5 },
    bombe: { vitesse: 0, gravite: 9.8, degatsChar: 2, souffle: 11 },
    missile: { vitesse: 110, gravite: 0, degatsChar: 2, souffle: 7, guide: 1.6, vieMax: 7 }, // (il tourne vers sa cible : 1,6 rad/s)
    grenade: { vitesse: 0, gravite: 9.8, degatsChar: 0, souffle: 7 },
    flak: { vitesse: 300, gravite: 4.9, degatsChar: 0, souffle: 0, vieMax: 3, fusee: 9, degatsAvion: 1 }, // (étape 64) l'obus de la DCA : il éclate à 9 m d'un avion
    torpille: { vitesse: 26, gravite: 0, degatsChar: 2, souffle: 5, guide: 0.5, vieMax: 14 }, // (étape 63) elle file sous l'eau
  },
  // ✍️ Les engins garés dans ton camp (seulement toi les conduis) : le 4x4 à mitrailleuse, l'hélico qui lâche des
  // bombes, l'avion de chasse, et le drone. Touche E : monter ou descendre.
  engins: {
    jeep: { nom: "4x4 à mitrailleuse", icone: "🚙", vitesseMax: 26, acceleration: 7, virage: 1.4, vie: 2, tourelle: 1.6, arme: "mitrailleuse" },
    helico: { nom: "Hélicoptère Tigre", icone: "🚁", vitesseMax: 45, acceleration: 9, virage: 1, montee: 9, hauteurMax: 150, munitions: 8, recharge: 5, arme: "bombe" },
    avion: { nom: "Avion de chasse Rafale", icone: "✈️", vitesse: 95, virage: 0.9, tangage: 0.8, hauteurMin: 25, hauteurMax: 400, munitions: 6, recharge: 2.5, arme: "missile", ejection: true, vie: 3 }, // (étape 64 : 3 missiles ennemis l'abattent)
    // (étape 64) ✍️ La DCA (« défense contre les avions ») : un canon double anti-aérien, dans ton camp.
    // ← → tourner, ↑ ↓ lever / baisser les canons, Espace tirer. Ses obus explosent tout seuls près d'un avion.
    dca: { nom: "DCA (canon anti-aérien)", icone: "🎯", longueur: 3.2, largeur: 3.2, hauteur: 2.4, vie: 3, rotation: 1.2, levee: 0.8, cadence: 0.12 },
    drone: { nom: "Drone", icone: "🛸", vitesseMax: 30, acceleration: 12, virage: 2, montee: 12, hauteurMax: 120, munitions: 6, recharge: 3, arme: "grenade" },
    // ✍️ (étape 71) Trois nouveaux engins qui roulent (pour toi ET pour l'ordinateur, dans les deux camps).
    // Ils tournent comme un vrai vélo : vitesse de rotation = vitesse × tan(braquage) ÷ empattement (l'écart entre les roues),
    // jamais plus vite que « virage » (rad/s). vie = les obus ou roquettes qu'ils encaissent ; balles = celles que le
    // pilote encaisse (sur une moto ou un quad, il n'est pas protégé !) ; ballesJoueur = quand c'est TOI le pilote.
    //  - la MOTO CROSS (rouge, façon Honda CRF450R) : très rapide, elle PENCHE dans les virages (penche = 40° au plus),
    //    son pilote tire au pistolet ;
    //  - le QUAD : plus stable, avec une petite mitrailleuse fixée devant ;
    //  - le CAMION DE TRANSPORT : lent, solide, il emmène 6 soldats au front (F : les faire descendre).
    moto: { nom: "Moto cross", icone: "🏍️", modele: "rouge, façon Honda CRF450R", longueur: 2.2, largeur: 0.85, hauteur: 1.3, rayon: 1,
      vitesseMax: 33, acceleration: 11, freinage: 16, ralentissement: 3, marcheArriere: 3, braquage: 0.55, empattement: 1.48, virage: 1.9,
      penche: 0.7, vie: 1, balles: 3, ballesJoueur: 12, arme: "motard", son: [90, 230] },
    quad: { nom: "Quad", icone: "🛞", longueur: 2.1, largeur: 1.25, hauteur: 1.25, rayon: 1.3,
      vitesseMax: 24, acceleration: 8, freinage: 14, ralentissement: 3, marcheArriere: 5, braquage: 0.6, empattement: 1.3, virage: 1.6,
      penche: 0.06, vie: 1, balles: 4, ballesJoueur: 14, arme: "quad", son: [70, 170] },
    camion: { nom: "Camion de transport", icone: "🚛", longueur: 7.4, largeur: 2.5, hauteur: 3.2, rayon: 2.6,
      vitesseMax: 22, acceleration: 4, freinage: 8, ralentissement: 2, marcheArriere: 5, braquage: 0.55, empattement: 4.6, virage: 0.75,
      penche: 0.04, vie: 3, places: 6, son: [32, 80] },
    // ✍️ (étape 73) Les deux HÉLICOS DE TRANSPORT (pour toi ET pour l'ordinateur, dans les deux camps). Ils volent comme
    // le Tigre (↑ ↓ ← →, Q monter, D descendre), emmènent 10 soldats (F : la descente à la corde) et ont 2 mitrailleuses
    // de porte qui tirent toutes seules. Mesures réelles du fuselage (sans les rotors) ; vie = les obus, roquettes ou
    // missiles qu'ils encaissent ; rayon = la distance pour monter dedans (E).
    //  - le CHINOOK (CH-47) : le gros, à 2 rotors (devant et derrière, qui tournent en sens inverse), une rampe à l'arrière ;
    //    plus lent, plus solide ;
    //  - le BLACK HAWK (UH-60) : 1 grand rotor et 1 petit rotor de queue, de grandes portes sur les côtés ; plus rapide.
    chinook: { nom: "Chinook", icone: "🚁", modele: "CH-47, 2 rotors", longueur: 15.5, largeur: 3.8, hauteur: 4, rayon: 6,
      vitesseMax: 36, acceleration: 6, virage: 0.6, montee: 7, hauteurMax: 150, vie: 5, places: 10 },
    blackhawk: { nom: "Black Hawk", icone: "🚁", modele: "UH-60, portes ouvertes", longueur: 12.6, largeur: 2.4, hauteur: 3.4, rayon: 4.5,
      vitesseMax: 48, acceleration: 9, virage: 0.9, montee: 9, hauteurMax: 150, vie: 3, places: 10 },
    distanceMonter: 6, // m : on peut monter dans un engin à moins de 6 m
    parachute: 4, // m/s : la vitesse de descente en parachute (on s'éjecte de l'avion avec E)
  },

  // ------------------------------------------------------------------ étape 62 : le lac, les bateaux et les portails
  // ✍️ Un LAC à l'est du champ de bataille (une ellipse : un cercle étiré). Ton bateau de guerre est amarré au bord, de
  // ton côté ; 2 patrouilleurs ennemis tournent sur le lac et tirent sur tout ce qui est bleu près de l'eau.
  // (étape 71 : la carte est 3 fois plus grande, le lac aussi : il est 3 fois plus loin et presque 3 fois plus long)
  lac: { x: 640, z: 0, rayonX: 210, rayonZ: 500, niveau: -1, profondeur: 8, // m ; niveau = la hauteur de l'eau
    // (étape 63) 3 ÎLES : des collines rondes qui sortent de l'eau (rayon = là où la terre touche l'eau). On n'y va
    // qu'en bateau… ou par le portail jaune !
    iles: [
      { nom: "la grande île", x: 665, z: -45, rayon: 55, hauteur: 6 },
      { nom: "l'île aux pins", x: 560, z: 285, rayon: 30, hauteur: 4 },
      { nom: "l'île du rocher", x: 540, z: -390, rayon: 32, hauteur: 5 },
    ],
  },
  bateaux: {
    joueur: { nom: "Vedette de combat", icone: "🚤", longueur: 9, largeur: 3.2, hauteur: 2.4, vitesseMax: 15, acceleration: 5,
      virage: 0.8, tourelle: 1.3, recharge: 2, vie: 3 }, // (un canon comme celui d'un tank, mais plus petit : 3 coups pour la couler)
    ennemis: { nombre: 2, nom: "Patrouilleur", vitesse: 8, virage: 0.6, tourelle: 0.9, recharge: 4, vie: 3, portee: 260, erreur: 0.02 },
    margeIles: 6, // m : un bateau ne s'approche pas à moins de 6 m d'une île (le fond remonte)
  },
  // (étape 63) Les SOUS-MARINS : ton sous-marin est amarré à côté de ta vedette ; 2 sous-marins ennemis plongent
  // pendant 20 s, puis remontent à la surface pendant 8 s (pour respirer !). Sous l'eau (à plus de 1,5 m), les obus
  // et les roquettes ne peuvent pas les toucher : seule une TORPILLE le peut.
  sousMarins: {
    joueur: { nom: "Sous-marin", icone: "🐋", longueur: 14, largeur: 2.6, hauteur: 2.8, vitesseMax: 9, acceleration: 2.5,
      virage: 0.5, plongee: 1.2, profondeurMax: 4.5, recharge: 4, vie: 3 }, // plongee en m/s ; Q remonter, D plonger
    ennemis: { nombre: 2, nom: "Sous-marin ennemi", vitesse: 6, virage: 0.45, recharge: 7, vie: 3, portee: 220,
      sousLEau: 20, aLaSurface: 8 }, // s
    sousLEau: 1.5, // m : à partir de cette profondeur, un sous-marin est « sous l'eau » (les obus ne le touchent plus)
  },
  // ✍️ Des PORTAILS par paires : on entre dans l'un, on ressort par l'autre (à l'autre bout de la carte). Tout ce qui
  // roule ou marche peut les prendre (les tanks, les soldats, le 4x4, toi) ; l'hélico et le drone aussi, s'ils volent
  // très bas. Les bateaux et l'avion, non.
  portails: {
    paires: [
      // (étape 71 : places multipliées par 3, comme la carte)
      { nom: "bleu ↔ orange", couleurs: ["#3b9cff", "#ff9a2e"], a: [-260, 600], b: [-330, 105] }, // ton camp ↔ à l'ouest du village
      { nom: "violet ↔ vert", couleurs: ["#b45cff", "#3dff8a"], a: [180, -600], b: [285, 210] }, // le camp ennemi ↔ entre le village et le lac
      { nom: "jaune ↔ rose", couleurs: ["#ffe14a", "#ff6fc8"], a: [380, 420], b: [645, -25] }, // (étape 63) près du lac ↔ la grande île
    ],
    rayon: 4, // m : la taille de l'anneau
    entree: 2.6, // m : il faut passer à moins de 2,6 m du centre pour être aspiré
    attente: 2, // s : après un passage, on ne peut pas repasser tout de suite (sinon on ferait des allers-retours)
    hauteurMax: 7, // m au-dessus du sol (pour l'hélico et le drone)
  },

  // ------------------------------------------------------------------ étape 64 : les avions ennemis et les parachutistes
  // ✍️ Les avions ennemis font « les deux » : ils BOMBARDENT le sol (ils visent un de tes tanks, ou toi, et lâchent 2 bombes
  // un peu avant d'être au-dessus : la bombe garde leur vitesse), et si tu voles avec ton Rafale, ils t'attaquent avec
  // des missiles (un DUEL dans le ciel). ✍️ On les abat avec la DCA (et avec les missiles de ton Rafale).
  avionsEnnemis: {
    nombre: 2, nom: "Chasseur ennemi", vitesse: 105, virage: 0.55, altitude: 95, vie: 3, bombes: 2,
    loin: 450, ecartDepart: 600, // m : (étape 71) ils arrivent de 450 m au-delà du bord de la carte, à ± 600 m du milieu
    premierPassage: 35, // s : ils arrivent 35 s après le début de la bataille
    retour: 45, // s : un avion abattu est remplacé 45 s plus tard
    duel: 900, // m : s'il voit ton Rafale à moins de 900 m, il le prend en chasse
    missile: { portee: 600, recharge: 6, cone: 0.35 },
    erreurBombe: 8, // m : ses bombes tombent à ± 8 m de là où il vise
  },
  // ✍️ Les PARACHUTISTES : pour CHAQUE équipe, un avion de transport passe toutes les 60 s et lâche 6 soldats au-dessus
  // de la zone de combat de son camp. L'avion de transport ennemi peut être abattu (avant le largage : pas de renforts !).
  parachutistes: {
    nombre: 6, toutesLes: 60, premier: 25, // s
    altitude: 110, descente: 5.5, // m, m/s (toi : 4 m/s)
    largage: { bleus: [0, 330], rouges: [0, -330] }, // (étape 71 : 3 fois plus loin du village) // [x, z] : au-dessus de quoi on saute
    maxParEquipe: 60, // ✍️ (étape 74 : 60 au lieu de 30) pas plus de 60 soldats debout par équipe : sinon le jeu ralentit
    transport: { nom: "Avion de transport", vitesse: 70, vie: 4 },
  },

  // ------------------------------------------------------------------ étape 65 : les ORDRES
  // ✍️ Touche T : une barre s'ouvre tout en haut ; tu écris ton ordre toi-même, Entrée l'envoie, Échap annule (le jeu
  // continue pendant ce temps). ✍️ Tout ton camp obéit (tes 3 tanks et tes soldats bleus), ou seulement un groupe
  // (« les tanks… », « les soldats… ») ou un tank par son nom (« Bravo… »).
  // Le jeu ne « lit » pas vraiment : il cherche dans ta phrase des MOTS QU'IL CONNAÎT (ce dictionnaire). ✍️ S'il trouve
  // un mot presque pareil (une faute de frappe), il le devine ; s'il ne trouve vraiment rien, il te le dit.
  // Tu peux ajouter tes propres mots dans les listes !
  ordres: {
    fautes: 1, fautesLongs: 2, // lettres de différence acceptées (2 pour les mots de 7 lettres et plus)
    arrive: 12, // m : un tank est « arrivé » à moins de 12 m de là où on l'envoie (un soldat : 6 m)
    ecartTanks: 16, ecartSoldats: 5, // m entre deux tanks (ou deux soldats) en ligne
    disperse: 45, // m : « dispersez-vous » : chacun part au hasard jusqu'à 45 m
    mots: {
      // les QUI
      tous: ["tous", "tout", "toutes", "monde", "equipe", "everyone", "groupe"],
      tanks: ["tanks", "tank", "chars", "char", "blindes", "blinde"],
      soldats: ["soldats", "soldat", "troupes", "troupe", "infanterie", "fantassins", "paras", "parachutistes", "hommes", "gars"],
      // les ORDRES (le mouvement)
      attaque: ["attaque", "attaquez", "attaquer", "attaquons", "chargez", "charge", "foncez", "fonce", "assaut", "detruisez", "detruis", "tuez", "tue", "eliminez", "degommez", "allez-y"],
      suis: ["suivez", "suis", "suivre", "suivez-moi", "venez", "viens", "rejoignez", "rejoins", "escorte", "escortez", "couvrez", "protegez"],
      reste: ["restez", "reste", "rester", "defendez", "defends", "defense", "gardez", "garde", "tenez", "stop", "arretez", "arrete", "halte", "bougez", "attendez", "attends"],
      recule: ["reculez", "recule", "reculer", "repli", "repliez", "retraite", "fuyez", "fuis", "rentrez", "rentre", "base"],
      va: ["allez", "va", "vas", "aller", "partez", "pars", "direction", "rendez-vous", "avancez", "avance", "go", "bougez-vous"],
      disperse: ["dispersez", "disperse", "ecartez", "ecarte", "eparpillez", "eparpille", "dispersion"],
      ligne: ["ligne", "alignez", "aligne", "formation", "rang", "rangs"],
      // les ordres de TIR
      cessez: ["cessez", "cesse", "cessez-le-feu"],
      feu: ["feu", "tirez", "tire", "volonte", "ouvrez"],
      vise: ["visez", "vise", "ciblez", "cible", "sur"],
    },
    // ✍️ Les ENDROITS où on peut envoyer ses troupes : [x, z] (les portails, on les trouve tout seuls par leur couleur)
    lieux: {
      // (étape 71 : la carte est 3 fois plus grande, les endroits aussi sont plus loin ; et deux nouveaux : le hameau, la ferme)
      village: [0, 0], lac: [395, 30], camp: [0, 645], base: [0, 645], aerodrome: [-90, 680], ennemi: [0, -630], ennemis: [0, -630],
      nord: [0, -450], sud: [0, 450], est: [330, 0], ouest: [-500, 0], centre: [0, 0], dca: [80, 630], hameau: [-560, 200], ferme: [300, -590],
    },
    // les CIBLES qu'on peut viser par catégorie
    cibles: {
      tanks: ["tanks", "tank", "chars", "char", "blindes"], soldats: ["soldats", "soldat", "troupes", "fantassins", "parachutistes", "paras"],
      bateaux: ["bateaux", "bateau", "patrouilleurs", "patrouilleur", "navires"], sousMarins: ["sous-marins", "sous-marin", "submersibles"],
    },
    reponses: ["Bien reçu !", "À vos ordres !", "C'est parti !", "Compris, chef !", "On y va !", "Affirmatif !"],
    exemples: ["attaquez", "suivez-moi", "les tanks, allez au village", "Bravo, reste ici", "visez les bateaux", "dispersez-vous", "en ligne", "cessez le feu", "allez au portail vert"],
  },

  // ✍️ (étape 67) Ta vie REMONTE toute seule : si tu n'es pas touché pendant 5 s, ton soldat regagne 2 balles par
  // seconde et ton tank 1 obus toutes les 2 s (vie / s), jusqu'à être tout neuf.
  soins: { attente: 5, soldat: 2, tank: 0.5 },

  camera: { distance: 15, hauteur: 6.5, regardDevant: 22, souplesse: 6, champ: 60 },
  effets: { particules: 420, debris: 60 }, // (étape 75 : 420 au lieu de 300, pour la poussière des maisons qui s'effondrent)
  decor: { morceau: 140 }, // (étape 72) le décor est découpé en morceaux de 140 m (des « tuiles ») ; (étape 71) 15 × 15 morceaux

  // ------------------------------------------------------------------ étape 74 : ✍️ « LE PLUS BEAU POSSIBLE »
  // Le sol n'est plus d'une seule couleur : une GRANDE IMAGE de toute la carte (2 048 × 2 048 points : 1 point ≈ 1 m)
  // est peinte au démarrage (l'herbe et ses nuances, l'herbe sèche, les taches de terre, la terre battue des villages
  // et des camps, le sol sombre sous les arbres, le sable et la boue au bord du lac, les CHEMINS de terre) ; et, de près,
  // une petite image de DÉTAIL (des brins d'herbe, des cailloux) répétée tous les 3,6 m, pour que le sol ne soit pas flou.
  beaute: {
    sol: { image: 2048, champ: 512, detail: 3.6, detailLoin: 13, fondu: [70, 190] }, // points ; points ; m ; m ; m (le détail s'efface entre 70 et 190 m)
    // ✍️ Les CHEMINS de terre (des lignes de points [x, z], en m), larges de 4 m : la grande route d'un camp à l'autre en
    // passant par le village, et les chemins vers le hameau, la ferme, le lac et les aérodromes.
    chemins: {
      largeur: 4, // m
      lignes: [
        [[0, 700], [10, 560], [24, 420], [-12, 260], [-6, 120], [0, 0], [8, -130], [-14, -260], [12, -420], [-6, -560], [0, -700]],
        [[-60, 8], [-200, 40], [-330, 95], [-450, 150], [-560, 170]],
        [[-560, 170], [-520, 300], [-430, 440], [-300, 560], [-150, 630], [-60, 650]],
        [[50, -40], [140, -200], [210, -360], [260, -500], [300, -620]],
        [[300, -620], [200, -660], [80, -650]],
        [[70, 4], [180, 18], [300, 26], [415, 30]],
        [[-30, 690], [-90, 690], [-200, 690], [-280, 680]],
        [[-30, -690], [-160, -690], [-280, -680]],
      ],
    },
    // L'HERBE en touffes (des petits bouquets de brins, en instances), autour de la caméra seulement (voir qualite.herbe)
    herbe: { case: 1.3, hauteur: 0.7, largeur: 1.1, bouge: 3 }, // m : une touffe par case (au hasard dedans) ; on la refait quand la caméra a bougé de 3 m
    // LA LUMIÈRE : le soleil (direction, couleur, force), le ciel et le reflet du sol (la « lumière d'hémisphère »)
    soleil: { direction: [0.55, 0.62, 0.32], couleur: 0xffeccc, force: 2.8, ciel: 0xd4e4ff, sol: 0x5d6640, ambiance: 0.85, exposition: 1.05 },
  },

  // ------------------------------------------------------------------ étape 75 : ✍️ LES MAISONS QU'ON PEUT DÉTRUIRE
  // Chaque mur est découpé en MORCEAUX (comme un mur de Lego) : des colonnes de « colonne » m de large, et des rangées
  // d'un « etage » de haut. Chaque morceau a sa VIE (des points) : une balle enlève « degatsBalle » point ; une
  // explosion enlève « [dégâts au centre, rayon] » (moins quand on est loin du centre : rien au bord du rayon).
  // Un morceau à 0 tombe (un trou !) : ceux qui étaient posés dessus tombent aussi, et il reste un tas de GRAVATS
  // (« gravats » m de haut par rangée tombée : on peut marcher et rouler dessus, mais ils arrêtent les balles tirées bas).
  // Quand « effondrement » des morceaux d'une maison sont tombés (ou que son toit a reçu « toitVie » coups), le TOIT
  // S'EFFONDRE : la maison devient une ruine. ✍️ Un tank lancé à plus de « ecraserMur » m/s défonce un mur.
  structures: {
    colonne: 1.6, etage: 2.8, // m
    epaisseur: 0.45, // m : l'épaisseur des murs des maisons (les murets ont la leur)
    vie: { brique: 26, pierre: 36, bois: 14, porte: 10, haie: 18 }, // points par morceau (une balle = 1)
    degatsBalle: 1,
    explosions: { obus: [95, 3.1], roquette: [85, 2.9], grenade: [60, 2.7], bombe: [240, 6.5], missile: [160, 4.6], torpille: [60, 2.5] }, // [points au centre, rayon en m]
    toitVie: 3, // coups directs (obus, roquettes, bombes…) sur le toit avant qu'il s'effondre
    effondrement: 0.36, // part des morceaux tombés (36 %) : le toit s'effondre
    tombeAvecLeToit: 0.3, // quand le toit tombe, chaque morceau du bas encore debout a 30 % de chances de tomber aussi
    gravats: 0.55, gravatsDedans: 1.1, // m : la hauteur des gravats (par rangée tombée ; au milieu d'une maison effondrée)
    ruinesDepart: 0.3, // ✍️ (choix de Claude) 30 % des maisons des hameaux sont déjà en ruines au début (les autres sont entières)
    ecraserMur: 6, degatsChoc: 60, // m/s, points
    ecrasesSousLeToit: 2, // un soldat dans une maison qui s'effondre perd 2 vies
    // (l'affichage) les débris qui volent (au plus « vol » à la fois), ceux qui restent par terre (au plus « gravatsMax »),
    // les trous de balles (« trous ») et les traces noires des explosions (« brulures ») : au-delà, on réutilise les plus vieux
    debris: { vol: 240, parMorceau: 7, gravatsMax: 4000, trous: 700, brulures: 140, vitesse: 8 },
  },
  // ✍️ (étape 75) LES GRENADES : à pied, touche 4. Espace lance une grenade en cloche (à « angle » au-dessus de l'horizon) ;
  // elle REBONDIT (elle garde « rebond » de sa vitesse, et « frottement » quand elle glisse) et explose après « meche » s.
  // Si un ennemi est presque devant toi (« coneAide ») à moins de « porteeAide » m, elle est lancée juste assez fort pour
  // tomber sur lui (comme la visée assistée du tank). Tu en as « nombre » ; tu en regagnes 1 toutes les « recharge » s, et
  // toutes d'un coup près de ton camp (à moins de « camp » m). Son souffle : voir « projectiles.grenade » (et les murs :
  // « structures.explosions.grenade »). Elle abîme aussi un engin léger (moto, quad, camion, 4x4) à moins de « vehiculeLeger » m.
  // Les soldats de l'ordinateur en ont « ia.nombre » : ils en lancent sur un GROUPE d'ennemis (« ia.groupe » à moins de
  // « ia.rayonGroupe » m l'un de l'autre), ou sur un ennemi caché derrière un mur ou dans une maison, entre « ia.portee »
  // m ; pas plus d'une toutes les « ia.attente » s, et seulement « ia.chance » des fois où il y pense. Un soldat qui voit
  // un tel ennemi (groupé, dans une maison, ou à moins de « ia.abri » m d'un mur) à moins de « ia.approche » m AVANCE vers
  // lui en tirant, pour arriver à portée de grenade (c'est « l'assaut »).
  grenades: {
    nombre: 4, recharge: 25, camp: 90, // -, s, m
    vitesse: 15, vitesseMin: 5, vitesseMax: 22, angle: 0.62, // m/s, rad (36°)
    meche: 3, rebond: 0.32, frottement: 0.45, roule: 4, // s, -, -, (ralentissement quand elle roule, par s)
    court: 0.8, // on la lance pour qu'elle tombe à 80 % de la distance : ses rebonds l'emmènent jusqu'à la cible
    coneAide: 0.16, porteeAide: 32, // rad, m
    vehiculeLeger: 3.2, // m
    ia: { nombre: 2, attente: 16, chance: 0.35, portee: [8, 38], groupe: 2, rayonGroupe: 6, approche: 120, abri: 4 },
  },
  // ✍️ (étape 75) LA PEINTURE DES TANKS : un camouflage à grandes taches (bois et olive pour les Bleus, désert pour les
  // Rouges), de la boue et de la poussière en bas (jusqu'à « boue » m), des éclats de peinture sur les arêtes, et le
  // numéro de chaque tank sur sa tourelle. De près (moins de « maillons » × la distance des roues), la chenille est faite de
  // vrais MAILLONS en 3D qui défilent ; plus loin, une image. (« maillons » × la distance des roues de la qualité.)
  peinture: {
    bleus: { taches: ["#626f45", "#6e5a3e", "#30332a", "#87915f"], boue: "#5e503c", poussiere: "#9a8f72" },
    rouges: { taches: ["#a08a60", "#7d6646", "#c2ad82", "#5e5440"], boue: "#6b5a40", poussiere: "#c4b08a" },
    boue: 1.0, // m
    maillons: 0.35, // (× la distance des roues : 56 m au niveau « beau », 21 m au niveau « léger »)
  },

  // ------------------------------------------------------------------ étape 71 : les MOTOS, QUADS et CAMIONS de l'ordinateur
  // ✍️ Dans CHAQUE camp (les Bleus et les Rouges), l'ordinateur conduit 2 motos, 2 quads et 1 camion (leurs réglages
  // sont dans « engins » : moto, quad, camion).
  //   - la moto et le quad sont des ÉCLAIREURS : ils foncent vers l'ennemi ; s'ils voient un soldat (ou une moto, un quad)
  //     à moins de « vue » m, ils tournent autour de lui à « distance » m et le pilote tire ; un tank ennemi trop près
  //     (« fuir » m) : ils s'enfuient ;
  //   - le CAMION emmène 6 soldats jusqu'au FRONT (« front » m avant le village, dans son couloir), les fait descendre (un
  //     toutes les « decharge » s : ils deviennent des soldats normaux), rentre au camp, attend « recharge » s qu'on
  //     le remplisse, et repart. Touché, il fait descendre ses soldats tout de suite.
  //   - un engin détruit revient au camp « retour » s plus tard (un nouveau pilote).
  vehicules: {
    parCamp: { moto: 2, quad: 2, camion: 1 },
    vue: 150, distance: { moto: 45, quad: 30 }, fuir: 70, // m
    pense: 0.25, // s : ils cherchent une cible 4 fois par seconde
    regard: 0.05, // s : ils regardent les obstacles autour d'eux 20 fois par seconde (pas 120 : ça coûte cher)
    erreur: 0.05, // rad : le pilote vise un peu de travers
    coneMoto: 1.2, coneQuad: 0.14, // rad : la moto tire d'une main vers le côté (± 69°) ; la mitrailleuse du quad, seulement devant (± 8°)
    front: 230, // m avant le village (côté de son camp) : là où le camion pose ses soldats
    couloir: 320, // m : chacun a son couloir (± 320 m à gauche ou à droite du milieu)
    decharge: 0.4, recharge: 15, retour: 40, // s
    arrive: 15, // m : le camion est « arrivé » à moins de 15 m de son but
    rechargerA: 45, // m : un camion vide se remplit s'il est arrêté à moins de 45 m de son camp (ou de son parking, pour le tien)
    bloque: 2, // s : un engin qui n'avance plus depuis 2 s alors qu'il voudrait, recule en braquant (pour se décoincer)
    loin: { moto: 1, quad: 1, camion: 1.4 }, // × la distance des « roues » (qualité) : plus loin, on dessine la version simple
  },

  // ------------------------------------------------------------------ étape 73 : les HÉLICOS DE TRANSPORT
  // ✍️ « Un Chinook et un Black Hawk, pour les deux camps, 10 soldats à bord, 2 mitrailleuses sur les côtés, et les
  // soldats descendent à la corde. » (Leurs réglages de vol sont dans « engins » : chinook, blackhawk.)
  // L'ORDINATEUR, dans chaque camp : au camp, il attend « recharge » s qu'on le remplisse, décolle, vole à « croisiere » m
  // au-dessus du sol vers le FRONT (« front » m avant le village, dans son couloir), descend à « stationnaire » m, s'arrête
  // en l'air, et ses soldats descendent à la corde ; puis il rentre se poser au camp, et recommence.
  // Abattu, il tombe, ses soldats à bord sont perdus, et un nouveau revient au camp « retour » s plus tard.
  helicosTransport: {
    parCamp: { chinook: 1, blackhawk: 1 },
    premier: 12, // s : le premier décolle 12 s après le début de la bataille (le suivant 14 s plus tard)
    croisiere: 55, stationnaire: 14, // m au-dessus du sol
    front: 230, couloir: 280, // m (comme le camion)
    arrive: 18, // m : il est « arrivé » au-dessus du front à moins de 18 m
    recharge: 18, rechargerA: 40, retour: 60, // s, m, s
    attenteMax: 8, // s : pas de place pour poser les soldats (déjà 60 debout) ? il attend 8 s, puis rentre avec eux
    // ✍️ La DESCENTE À LA CORDE (le « fast-rope ») : il faut être à moins de « hauteurMax » m du sol et presque arrêté
    // (moins de « vitesseMax » m/s). Les soldats glissent à « glisse » m/s, un toutes les « intervalle » s, sur 2 cordes.
    corde: { hauteurMax: 25, vitesseMax: 3, glisse: 6, intervalle: 0.55, chute: 4 }, // (chute : m ; un soldat qui tombe de plus haut est blessé)
    // Où sont accrochées les 2 cordes, et où sont les 2 mitrailleuses (en m, dans le repère de l'hélico : x vers le nez,
    // y vers le haut depuis le bas des roues, z vers la droite) : le Chinook pose ses soldats par sa RAMPE arrière, le
    // Black Hawk par ses 2 PORTES de côté.
    cordes: { chinook: [[-7.85, 1.15, 0.5], [-7.85, 1.15, -0.5]], blackhawk: [[0.1, 2.75, 1.55], [0.1, 2.75, -1.55]] },
    portes: { chinook: [[4.2, 2.2, 1.95], [4.2, 2.2, -1.95]], blackhawk: [[1.55, 1.95, 1.3], [1.55, 1.95, -1.3]] }, // [droite, gauche]
    // ✍️ Les 2 MITRAILLEUSES DE PORTE (gauche et droite) : chaque tireur cherche un ennemi (soldat, moto, quad) de SON côté
    // (dans un « cône » de ± 75° autour du côté), à portée, qu'il voit ; il le cherche « pense » fois par seconde.
    mitrailleuses: { cone: 1.3, pense: 0.3, erreur: 0.05 },
    cibleSol: 35, // m : plus bas que ça, les tanks et les lance-roquettes peuvent le viser (plus haut, seulement la DCA et les missiles)
    loin: 1.6, // × la distance des « roues » (qualité) : plus loin, on le dessine en version simple
  },

  // ------------------------------------------------------------------ étape 76 : les AVIONS et le TIGRE en 3D
  // ✍️ « Refais aussi les avions et le Tigre. » Le Rafale, les chasseurs ennemis, l'avion de transport, le drone et
  // l'hélicoptère Tigre sont redessinés (affichage/avions3d.js). Ici, seulement leur DESSIN : les règles (vitesses, armes,
  // vie) ne changent pas.
  avions3d: {
    // La PEINTURE : un fond, 3 couleurs de taches (calculées en 3D par la carte graphique : elles passent d'une pièce à
    // l'autre sans couture), la taille des taches (m), et un VENTRE plus clair (null : pas de ventre clair).
    // Bleus : vert et gris « européen » ; Rouges : sable et brun du désert, le ventre gris-bleu clair.
    peinture: {
      chasse: {
        bleus: { fond: "#68724f", taches: ["#2f3a2a", "#4e5458", "#808962"], ventre: "#a3aba0", taille: 2.6 },
        rouges: { fond: "#b49b6c", taches: ["#86673f", "#d0bc92", "#9c8561"], ventre: "#aebcc2", taille: 2.6 },
      },
      helico: {
        bleus: { fond: "#56613f", taches: ["#2c3526", "#4b5052", "#6e7650"], ventre: null, taille: 1.3 },
        rouges: { fond: "#a8916a", taches: ["#7f6542", "#c4b088", "#93805c"], ventre: null, taille: 1.3 },
      },
      transport: {
        bleus: { fond: "#5c6450", taches: ["#555d4a", "#626a55", "#596150"], ventre: "#8a9286", taille: 5 },
        rouges: { fond: "#a7926b", taches: ["#9e8963", "#b09b74", "#a38e68"], ventre: "#b5bcb8", taille: 5 },
      },
      drone: {
        bleus: { fond: "#545c48", taches: ["#3c4535", "#4f524f", "#666d52"], ventre: "#8a9184", taille: 0.5 },
        rouges: { fond: "#a8916a", taches: ["#86673f", "#c4b088", "#93805c"], ventre: "#b5bcb8", taille: 0.5 },
      },
    },
    // × la distance des « roues » (qualité) : plus loin, on dessine la version SIMPLE (1 dessin pour tous ceux d'une sorte
    // et d'une équipe). Les avions sont grands et volent haut : on les garde en détail plus loin.
    loin: { avion: 2.2, chasseur: 2.2, transport: 3, helico: 1.6, drone: 0.8 },
    train: 1.6, // s : le train d'atterrissage du Rafale rentre (ou sort) en 1,6 s
    verriere: 1.5, // s : la verrière se ferme quand tu montes (ouverte quand l'avion est garé, vide)
    postCombustion: [0.55, 1], // part de la vitesse max : la flamme de la postcombustion commence à 55 %, pleine à 100 %
    flammeChasseur: 0.55, // la flamme des chasseurs ennemis (ils volent toujours à la même vitesse)
    rampe: { distance: 260, duree: 2.5 }, // m avant la zone de largage : la rampe de l'avion de transport s'ouvre (en 2,5 s)
    flou: 2, // tours par seconde : plus vite, le disque flou des rotors et des hélices apparaît
    sensHelices: [-1, 1, 1, -1], // les 4 hélices de l'avion de transport (dedans à gauche, dehors à gauche, dedans à droite, dehors à droite) : elles tournent en miroir
  },

  // ------------------------------------------------------------------ étape 72 : le RÉGULATEUR DE QUALITÉ
  // ✍️ « Ça rame trop, le jeu a des lags. Arrange ça. » Le régulateur regarde combien de temps dure chaque image
  // (60 images par seconde = 16,7 ms par image). Toutes les 2 s, il fait la moyenne :
  //   - plus de 25 ms (moins de 40 images/s) : ça rame → il descend d'un niveau (moins beau, plus rapide) ;
  //   - moins de 18,5 ms deux fois de suite → il remonte d'un niveau (plus beau). (Pas moins : sur un écran à 60 images/s,
  //     une image dure TOUJOURS au moins 16,7 ms, même si l'ordinateur a fini plus tôt.)
  //   - s'il a dû descendre d'un niveau, il n'y remonte pas avant 60 s (sinon il ferait le yo-yo).
  // Touche G : choisir le niveau soi-même (0, 1, 2, 3), puis revenir en automatique.
  qualite: {
    depart: 1, // ✍️ on commence au niveau 1
    intervalle: 2, // s entre deux décisions
    lent: 25, rapide: 18.5, // ms
    foisRapide: 2, // combien de fois de suite « rapide » avant de remonter
    punition: 60, // s : on ne remonte pas tout de suite au niveau qui ramait
    capot: 0.5, // s entre deux mises à jour du panneau « sous le capot » (il coûte cher à écrire)
    brouillard: 200, // m : le brouillard commence à 200 m au plus (plus près si la vue est courte)
    // Chaque niveau règle : pixels (la finesse de l'image : 0,8 = 80 % des pixels dans chaque sens), ombres (taille de
    // l'image des ombres, 0 = pas d'ombres ; douces = bords flous), vue (m : au-delà, le brouillard cache tout),
    // decor (m : les morceaux de sol, de village et les arbres plus loin ne sont pas dessinés), soldats (m : en
    // détail, en simple, en « silhouette » d'une seule pièce, au-delà : cachés), roues (m : plus loin, les roues des
    // tanks sont soudées en une pièce qui ne tourne plus), effets (m : plus loin, pas de fumée ni d'étincelles).
    // (étape 74) herbe (m : les touffes d'herbe autour de la caméra ; 0 = pas de touffes), arbresDetail (m : plus près,
    // les beaux arbres à grappes de feuillage ; plus loin, des arbres simples). Le niveau « beau » a des ombres plus fines.
    // (étape 75) maisons (m : plus près, les belles maisons avec leurs fenêtres, leurs briques… ; plus loin, la version simple).
    niveaux: [
      { nom: "très léger", pixels: 0.6, ombres: 0, douces: false, vue: 380, decor: 300, soldatDetail: 12, soldatSimple: 30, soldatSilhouette: 170, roues: 35, effets: 140, herbe: 0, arbresDetail: 50, maisons: 60 },
      { nom: "léger", pixels: 0.8, ombres: 1024, douces: false, vue: 520, decor: 380, soldatDetail: 20, soldatSimple: 45, soldatSilhouette: 210, roues: 60, effets: 200, herbe: 22, arbresDetail: 80, maisons: 100 },
      { nom: "normal", pixels: 1, ombres: 2048, douces: false, vue: 800, decor: 540, soldatDetail: 35, soldatSimple: 70, soldatSilhouette: 250, roues: 100, effets: 280, herbe: 38, arbresDetail: 130, maisons: 160 },
      { nom: "beau", pixels: 1.5, selonEcran: true, ombres: 4096, douces: true, vue: 1300, decor: 850, soldatDetail: 50, soldatSimple: 110, soldatSilhouette: 300, roues: 160, effets: 400, herbe: 60, arbresDetail: 220, maisons: 240 },
    ],
  },
  // (étape 72) Le QUADRILLAGE : la carte est découpée en cases de 16 m. Pour savoir quels arbres ou quelles maisons sont
  // près de toi, on ne regarde que ta case et ses voisines (au lieu des 400 arbres et 150 murs à chaque fois).
  grille: { case: 16 },
};
