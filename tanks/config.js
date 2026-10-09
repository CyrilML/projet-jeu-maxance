// ⚙️ LES RÉGLAGES : tous les nombres du jeu de tanks (étape 60)
//
// ✍️ Maxance a choisi : un nouveau jeu à part, une BATAILLE D'ÉQUIPES (toi + 3 alliés bleus contre 4 ennemis rouges),
// dans une campagne avec un village en ruines, avec de vrais tanks modernes (Leclerc, Abrams, Leopard 2), et
// 4 obus pour détruire un tank. Unités : m, s, m/s, radians.

window.Tanks = window.Tanks || {};

Tanks.CONFIG = {
  // Numéro de version. Il doit être le même que le « ?v=… » des fichiers dans tanks/index.html.
  version: 8,
  pasFixe: 1 / 120,

  monde: {
    taille: 700, // m de côté
    graine: 1944,
    collines: { hauteur: 10, taille: 180 }, // des collines douces de 10 m, larges de 180 m environ
    village: { x: 0, z: 0, rayon: 75, maisons: 16, murets: 26, ruines: 40 },
    arbres: 320, bosquets: 14, haies: 18,
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
  },
  // ✍️ Les armes à pied : le pistolet, la mitrailleuse et le lance-roquettes (touches 1, 2, 3).
  // Une balle va tout de suite où on vise (pas de vol) : la chance de toucher baisse avec la distance.
  armes: {
    pistolet: { nom: "Pistolet", icone: "🔫", cadence: 0.35, precision: 0.9, portee: 70, degats: 1 },
    mitrailleuse: { nom: "Mitrailleuse", icone: "🔫🔫", cadence: 0.09, precision: 0.6, portee: 140, degats: 1 },
    roquettes: { nom: "Lance-roquettes", icone: "🚀", cadence: 3, roquette: true }, // ✍️ 1 roquette = 1 obus pour un tank
    soldat: { cadence: 0.6, precision: 0.35, portee: 140, degats: 1 }, // le fusil des soldats de l'ordinateur
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
    distanceMonter: 6, // m : on peut monter dans un engin à moins de 6 m
    parachute: 4, // m/s : la vitesse de descente en parachute (on s'éjecte de l'avion avec E)
  },

  // ------------------------------------------------------------------ étape 62 : le lac, les bateaux et les portails
  // ✍️ Un LAC à l'est du champ de bataille (une ellipse : un cercle étiré). Ton bateau de guerre est amarré au bord, de
  // ton côté ; 2 patrouilleurs ennemis tournent sur le lac et tirent sur tout ce qui est bleu près de l'eau.
  lac: { x: 215, z: 0, rayonX: 80, rayonZ: 185, niveau: -1, profondeur: 8, // m ; niveau = la hauteur de l'eau
    // (étape 63) 3 ÎLES : des collines rondes qui sortent de l'eau (rayon = là où la terre touche l'eau). On n'y va
    // qu'en bateau… ou par le portail jaune !
    iles: [
      { nom: "la grande île", x: 222, z: -15, rayon: 30, hauteur: 5 },
      { nom: "l'île aux pins", x: 185, z: 95, rayon: 15, hauteur: 3.5 },
      { nom: "l'île du rocher", x: 178, z: -130, rayon: 16, hauteur: 4 },
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
      { nom: "bleu ↔ orange", couleurs: ["#3b9cff", "#ff9a2e"], a: [-200, 245], b: [-110, 35] }, // ton camp ↔ à l'ouest du village
      { nom: "violet ↔ vert", couleurs: ["#b45cff", "#3dff8a"], a: [60, -255], b: [95, 70] }, // le camp ennemi ↔ entre le village et le lac
      { nom: "jaune ↔ rose", couleurs: ["#ffe14a", "#ff6fc8"], a: [105, 215], b: [214, -10] }, // (étape 63) près du lac ↔ la grande île
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
    largage: { bleus: [0, 110], rouges: [0, -110] }, // [x, z] : au-dessus de quoi on saute
    maxParEquipe: 30, // (pas plus de 30 soldats debout par équipe : sinon le jeu ralentit)
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
      village: [0, 0], lac: [118, 10], camp: [0, 285], base: [0, 285], aerodrome: [-90, 300], ennemi: [0, -250], ennemis: [0, -250],
      nord: [0, -180], sud: [0, 180], est: [110, 0], ouest: [-220, 0], centre: [0, 0], dca: [80, 270],
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
  effets: { particules: 300, debris: 60 },
  decor: { distanceArbres: 380 },
};
