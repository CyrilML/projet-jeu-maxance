// ⚙️ LES RÉGLAGES : tous les nombres du jeu de tanks (étape 60)
//
// (étape 80) ✍️ « Des nouvelles cartes… un souterrain avec des trams en feu, des trains, des bancs, des escalators
// détruits, des escaliers. Ce sera que de l'infanterie. » Voir « cartes » et « souterrain » (tout en bas).
//
// (étape 77) ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis
// modifier son arme. » Voir tout en bas : « classes », « armesPrincipales », « gadgets », « explosifs », « atelier »,
// « tir » (le chargeur, le recul, la dispersion), « marques ».
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
  version: 40,
  // ✍️ (étape 87) L'AMBIANCE « BATTLEFIELD » (affichage/ambiance.js) : un filtre de cinéma sur l'image 3D.
  // contraste, saturation (1 = normal ; 0,8 = couleurs un peu éteintes), luminosité, teinte (la force du bleu-vert dans
  // les ombres et de l'orange dans les lumières, de 0 à 1), vignette (les bords sombres, de 0 à 1), grain (de 0 à 1).
  ambiance: { contraste: 1.14, saturation: 0.74, luminosite: 0.97, teinte: 0.32, vignette: 0.55, grain: 0.07, melanges: false }, // (étape 90 : melanges = la teinte et le grain, trop lourds : coupés)
  // ✍️ (étape 82, refaite aux étapes 83 et 84) LA MUSIQUE DE LA PAGE D'ACCUEIL, « un mix Battlefield 6 et Pirates des Caraïbes » (une musique
  // inventée), SEULEMENT au menu : elle se tait pendant la bataille (en « fondu » secondes).
  // tempo : battements par minute (2 croches par battement, 6 croches par mesure) ; volume de chaque instrument ;
  // salle : la réverbération (durée de l'écho en s, part de l'écho) ; accords : une mesure chacun (la basse, la quinte,
  // l'octave, la tierce) ; mélodie : 8 phrases (par mesure : [croche 0 à 5, note, durée en croches]).
  musique: {
    tempo: 128, volume: 0.45, fondu: 1.2,
    nappe: 0.035, violoncelles: 0.06, cuivres: 0.06, pulsation: 0.07, tambours: 1, choeur: 0.05, cymbales: 0.12, // (étape 84 : le chœur et les cymbales)
    braam: { fort: 0.12, duree: 3.4 },
    salle: { duree: 2.8, part: 0.55 },
    accords: [
      { nom: "ré mineur", notes: ["D2", "A2", "D3", "F3"] }, { nom: "ré mineur", notes: ["D2", "A2", "D3", "F3"] },
      { nom: "si bémol", notes: ["Bb1", "F2", "Bb2", "D3"] }, { nom: "la", notes: ["A1", "E2", "A2", "C#3"] },
      { nom: "ré mineur", notes: ["D2", "A2", "D3", "F3"] }, { nom: "fa", notes: ["F2", "C3", "F3", "A3"] },
      { nom: "do", notes: ["C2", "G2", "C3", "E3"] }, { nom: "la", notes: ["A1", "E2", "A2", "C#3"] },
    ],
    melodie: [
      [[0, "A4", 3], [3, "D5", 3]],
      [[0, "C5", 1], [1, "Bb4", 1], [2, "A4", 1], [3, "F4", 3]],
      [[0, "G4", 2], [2, "A4", 1], [3, "Bb4", 3]],
      [[0, "A4", 4], [4, "E4", 2]],
      [[0, "D4", 1], [1, "F4", 1], [2, "A4", 1], [3, "D5", 2], [5, "E5", 1]],
      [[0, "F5", 3], [3, "E5", 2], [5, "C5", 1]],
      [[0, "D5", 2], [2, "C5", 1], [3, "Bb4", 2], [5, "G4", 1]],
      [[0, "A4", 6]],
    ],
  },

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
    // ✍️ (étape 85) LES CHUTES : comment il tombe quand il est à terre (choisi par logique/soldat.js, joué par affichage/engins3d.js)
    chutes: {
      chanceTete: 0.18, // une balle sur 6 environ touche la tête : il s'écroule
      chanceGenoux: 0.3, // sinon, 3 fois sur 10 il tombe d'abord à genoux
      dos: 1.05, // rad : la balle arrive à moins de 60° de son dos → il tombe en avant (de face → en arrière)
      durees: { tete: 0.7, dos: 0.75, face: 0.8, genoux: 1.5, explosion: 0.6, ecrase: 0.25 }, // s : la durée de la chute
      pauseGenoux: 0.4, // s : à genoux, il reste un moment avant de tomber
      hasard: 0.25, // ± 25 % sur la vitesse, et un petit angle de travers
    },
    // (étape 86) ✍️ « réalisme total » : le sursaut quand la balle touche (rad), le petit rebond sur le sol (m), à quel
    // point les deux côtés du corps sont différents (rad), et de combien la tête roule sur le côté à la fin (rad)
    realisme: { choc: 0.18, rebond: 0.06, asymetrie: 0.45, tete: 0.7 },
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
    // (étape 77) la grenade de 40 mm du lance-grenades (elle explose en touchant), la roquette de l'AT4 (plus rapide,
    // plus droite), le missile JAVELIN (guidé vers le tank visé), et les explosifs posés : la mine antichar, le C4, la claymore
    lg40: { vitesse: 62, gravite: 9.8, degatsChar: 0, souffle: 4.5 },
    at4: { vitesse: 120, gravite: 0.3, degatsChar: 1, souffle: 5.5 },
    javelin: { vitesse: 70, gravite: 0, degatsChar: 2, souffle: 6, guide: 2.4, vieMax: 9 },
    // (demande 98) rayonChar : m où l'explosion abîme un véhicule ennemi (de « degatsChar »)
    mine: { vitesse: 0, gravite: 0, degatsChar: 2, souffle: 5, rayonChar: 3.5 },
    c4: { vitesse: 0, gravite: 0, degatsChar: 2, souffle: 7, rayonChar: 4.5 },
    claymore: { vitesse: 0, gravite: 0, degatsChar: 0, souffle: 0 },
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
      attaque: ["attaque", "attaquez", "attaquer", "attaquons", "chargez", "charge", "foncez", "fonce", "assaut", "detruisez", "detruis", "tuez", "tue", "eliminez", "degommez", "allez-y", "go"], // (demande 94 : « go ! » = à l'attaque)
      suis: ["suivez", "suis", "suivre", "suivez-moi", "suis-moi", "venez", "rejoignez", "rejoins", "escorte", "escortez"],
      reste: ["restez", "reste", "rester", "defendez", "defends", "defendre", "defense", "gardez", "garde", "tenez", "tiens", "stop", "arretez", "arrete", "halte", "bougez", "attendez", "attends"],
      recule: ["reculez", "recule", "reculer", "repli", "repliez", "retraite", "fuyez", "fuis", "rentrez", "rentre", "base"],
      va: ["allez", "va", "vas", "aller", "partez", "pars", "direction", "rendez-vous", "avancez", "avance", "bougez-vous"],
      disperse: ["dispersez", "disperse", "ecartez", "ecarte", "eparpillez", "eparpille", "dispersion"],
      ligne: ["ligne", "alignez", "aligne", "formation", "rang", "rangs"],
      // les ordres de TIR
      cessez: ["cessez", "cesse", "cessez-le-feu"],
      feu: ["feu", "tirez", "tire", "volonte", "ouvrez"],
      vise: ["visez", "vise", "ciblez", "cible", "sur"],
      // ✍️ (demande 94) TES PROPRES PHRASES : les mots qui font comprendre une demande (des synonymes, pour écrire comme tu veux)
      couvre: ["couvre", "couvrez", "couvre-moi", "couvrez-moi", "couverture", "protege", "protegez", "protege-moi", "protegez-moi"],
      renforts: ["renfort", "renforts", "aide", "aidez", "aidez-moi", "aide-moi", "secours", "viens", "rapplique", "rappliquez", "help"],
      soigne: ["soigne", "soignez", "soigne-moi", "soignez-moi", "soin", "soins", "medecin", "medic", "infirmier", "infirmiere", "trousse", "blesse", "heal"],
      repare: ["repare", "reparez", "repare-moi", "reparation", "reparer", "mecanicien", "mecano", "depanne", "depannez", "outils"],
      rapport: ["ou", "rapport", "situation", "combien", "position", "positions", "statut", "status", "vois", "voyez", "signalez", "signale", "nouvelles"],
      merci: ["merci", "joue", "super", "genial", "excellent", "parfait", "felicitations", "chapeau", "top", "cool", "bien"],
      insultes: ["idiot", "idiots", "nul", "nuls", "nulle", "debile", "debiles", "imbecile", "cretin", "abruti", "boulet", "naze", "con", "cons", "connard", "merde", "bouffon", "andouille"],
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
    exemples: ["Bravo, couvre-moi", "où sont les ennemis ?", "Écho, soigne-moi", "à l'aide !", "attaquez", "suivez-moi", "les tanks, allez au village", "Bravo, reste ici", "visez les bateaux", "dispersez-vous", "en ligne", "cessez le feu", "allez au portail vert"],
  },

  // ✍️ (étape 67) Ta vie REMONTE toute seule : si tu n'es pas touché pendant 5 s, ton soldat regagne 2 balles par
  // seconde et ton tank 1 obus toutes les 2 s (vie / s), jusqu'à être tout neuf.
  soins: { attente: 5, soldat: 2, tank: 0.5 },

  camera: { distance: 15, hauteur: 6.5, regardDevant: 22, souplesse: 6, champ: 60 },
  // ✍️ (étape 78) À PIED, la touche C passe dans les YEUX du soldat (la vue à la première personne, comme dans
  // Battlefield) : l'œil est à « oeil » m du sol, un peu en avant de la tête (« avance » m, pour ne pas voir l'intérieur
  // du casque) ; on regarde un peu vers le bas (« baisse » : 0,22 = 22 cm de descente par mètre) pour voir ses mains
  // et son arme ; « proche » m : la caméra dessine dès 5 cm (sinon l'arme, tout près, serait coupée).
  premiere: { oeil: 1.58, avance: 0.18, baisse: 0.22, proche: 0.05 },
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
    explosions: { obus: [95, 3.1], roquette: [85, 2.9], grenade: [60, 2.7], bombe: [240, 6.5], missile: [160, 4.6], torpille: [60, 2.5],
      lg40: [70, 2.6], at4: [100, 3], javelin: [150, 4], mine: [120, 3.5], c4: [230, 5.5], claymore: [40, 2] }, // [points au centre, rayon en m] (étape 77 : les nouveaux)
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
    alerte: 0.6, // s (demande 96) : s'il rame déjà au bout de 0,6 s, il descend sans attendre la fin des 2 s
    calme: 1, // s (demande 96) : après un changement de niveau, on ne compte pas les images pendant 1 s
    longue: 50, // ms (demande 96) : une image plus longue, c'est un « à-coup » (compté sous le capot)
    brouillard: 200, // m : le brouillard commence à 200 m au plus (plus près si la vue est courte)
    // Chaque niveau règle : pixels (la finesse de l'image : 0,8 = 80 % des pixels dans chaque sens), ombres (taille de
    // l'image des ombres, 0 = pas d'ombres ; douces = bords flous), vue (m : au-delà, le brouillard cache tout),
    // decor (m : les morceaux de sol, de village et les arbres plus loin ne sont pas dessinés), soldats (m : en
    // détail, en simple, en « silhouette » d'une seule pièce, au-delà : cachés), roues (m : plus loin, les roues des
    // tanks sont soudées en une pièce qui ne tourne plus), effets (m : plus loin, pas de fumée ni d'étincelles).
    // (étape 74) herbe (m : les touffes d'herbe autour de la caméra ; 0 = pas de touffes), arbresDetail (m : plus près,
    // les beaux arbres à grappes de feuillage ; plus loin, des arbres simples). Le niveau « beau » a des ombres plus fines.
    // (étape 75) maisons (m : plus près, les belles maisons avec leurs fenêtres, leurs briques… ; plus loin, la version simple).
    // (demande 96, « le jeu rame souvent ») de nouveaux réglages, mesurés un par un :
    //   reflets : le ciel qui se reflète sur TOUT (le « miroir du ciel ») ; il coûte cher pour chaque point de l'écran ;
    //     sans lui, la lumière du ciel est un peu plus forte (realisme.sansReflets) pour garder la même clarté ;
    //   ombresChaque : l'image des ombres est refaite toutes les N images (1 = à chaque image) ;
    //   anisotropie : la netteté du sol vu de loin, en rasant (1 = flou, 8 = net) ;
    //   solFin : les 2 images de détail en plus sur le sol (les grandes taches, la 2e image tournée) ;
    //   animLoin : un soldat « simple » (assez loin) bouge ses bras et ses jambes toutes les N images seulement ;
    //   filtre : le filtre de cinéma (affichage/ambiance.js) passé sur toute l'image par le navigateur.
    // Les réglages qui obligent la carte graphique à refaire ses PROGRAMMES (un à-coup) changent seulement entre les niveaux
    // 0 et 1 (ombres, lumières) et entre 1 et 2 (reflets) ; « douces » entre 2 et 3.
    niveaux: [
      { nom: "très léger", pixels: 0.6, ombres: 0, douces: false, vue: 380, decor: 300, soldatDetail: 12, soldatSimple: 30, soldatSilhouette: 150, roues: 35, effets: 120, herbe: 0, arbresDetail: 50, maisons: 60,
        reflets: false, ombresChaque: 1, anisotropie: 2, solFin: false, animLoin: 3, filtre: false },
      { nom: "léger", pixels: 0.75, ombres: 1024, douces: false, vue: 520, decor: 380, soldatDetail: 18, soldatSimple: 40, soldatSilhouette: 200, roues: 60, effets: 180, herbe: 18, arbresDetail: 70, maisons: 90,
        reflets: false, ombresChaque: 2, anisotropie: 4, solFin: false, animLoin: 2, filtre: true },
      { nom: "normal", pixels: 1, ombres: 2048, douces: false, vue: 800, decor: 540, soldatDetail: 35, soldatSimple: 70, soldatSilhouette: 250, roues: 100, effets: 280, herbe: 38, arbresDetail: 130, maisons: 160,
        reflets: true, ombresChaque: 1, anisotropie: 8, solFin: true, animLoin: 2, filtre: true },
      { nom: "beau", pixels: 1.25, selonEcran: true, ombres: 2048, douces: true, vue: 1300, decor: 850, soldatDetail: 50, soldatSimple: 110, soldatSilhouette: 300, roues: 160, effets: 400, herbe: 60, arbresDetail: 220, maisons: 240,
        reflets: true, ombresChaque: 1, anisotropie: 8, solFin: true, animLoin: 1, filtre: true },
    ],
    // (demande 96) l'herbe qui repousse autour de toi est recalculée par petits morceaux : au plus « herbeBudget » ms par
    // image (avant : tout d'un coup, jusqu'à 14 ms, une petite saccade tous les 3 m).
    herbeBudget: 1.5,
    // (demande 96) sans les reflets du ciel, la lumière du ciel (et du sol) est multipliée par « sansReflets » : la scène
    // garde à peu près la même clarté.
    sansReflets: 1.25,
  },
  // (étape 72) Le QUADRILLAGE : la carte est découpée en cases de 16 m. Pour savoir quels arbres ou quelles maisons sont
  // près de toi, on ne regarde que ta case et ses voisines (au lieu des 400 arbres et 150 murs à chaque fois).
  grille: { case: 16 },

  // ================================================================== étape 77 : ✍️ LE MENU, LES CLASSES, LES ARMES, L'ATELIER
  // ✍️ « Un menu avant de jouer : choisir son véhicule, sa classe, ses armes, ses gadgets et ses explosifs, puis modifier
  // son arme. » Les 4 CLASSES comme Battlefield. Pour chacune : 5 ou 6 armes principales (demande 97 ; tu en prends 1), 2 gadgets (tu
  // en prends 1 : touche 3) et 2 explosifs (tu en prends 1 : touche 4). Le pistolet reste toujours en arme 1.
  // (demande 98) Le 1er gadget et le 1er explosif de chaque liste sont libres dès le début ; le 2e a un cadenas (son « niveau »).
  // vie : × la vie de ton soldat (l'Assaut : 25 % de plus). Seul TON soldat a une classe.
  classes: {
    assaut: { nom: "Assaut", icone: "🪖", couleur: "#ff8a3d", vie: 1.25,
      texte: "En première ligne : fusil d'assaut, lance-grenades sous le canon, et 25 % de vie en plus.",
      armes: ["ar4", "famas", "ak12", "g36", "scarh"], gadgets: ["lanceGrenades", "sacMunitions"], explosifs: ["grenades", "fumigene"] },
    ingenieur: { nom: "Ingénieur", icone: "🔧", couleur: "#ffd23d", vie: 1,
      texte: "Le chasseur de tanks : lance-roquettes, et il RÉPARE les tanks et les engins de son camp.",
      armes: ["rpg7", "ump45", "at4", "javelin", "carlgustaf"], gadgets: ["reparation", "droneReparation"], explosifs: ["mineAT", "c4"] },
    eclaireur: { nom: "Éclaireur", icone: "🔭", couleur: "#7dff8a", vie: 1,
      texte: "Tireur de loin : fusil de précision avec lunette, et des JUMELLES qui marquent les ennemis.",
      armes: ["m110", "svd", "m24", "mk14", "lapua", "barrett"], gadgets: ["jumelles", "capteur"], explosifs: ["grenades", "claymore"] },
    medecin: { nom: "Médecin de guerre", icone: "⛑️", couleur: "#ff5a6a", vie: 1,
      texte: "Il SOIGNE ses amis avec sa trousse et RELÈVE les soldats tombés avec son défibrillateur.",
      armes: ["mp5", "vector", "mp7", "p90", "bizon"], gadgets: ["trousse", "defibrillateur"], explosifs: ["grenades", "fumigene"] },
  },
  // ✍️ Les ARMES PRINCIPALES. (Demande 97 : ✍️ « lance les déblocages » : chaque arme a un « niveau » : le NIVEAU DE
  // JOUEUR qu'il faut pour la débloquer (0 = disponible dès le début : la 1re arme de chaque classe).)
  //   degats : par balle (un soldat de l'ordinateur a 3 de vie) ; loin de « porteeEfficace » m, ils baissent jusqu'à
  //   « degatsLoin » × à la portée max ; cadence : s entre 2 balles ; chargeur : balles ; reserve : balles en plus ;
  //   rechargement : s ; dispersion : l'écart des balles (rad) en tirant « à la hanche » ; dispersionVisee : en visant
  //   (touche V ou clic droit) ; recul : rad ajoutés à la dispersion à chaque balle (il redescend tout seul) ;
  //   visee : s pour épauler ; mobilite : × ta vitesse ; bruit : × la distance à laquelle les ennemis t'entendent ;
  //   zoom : le zoom sans lunette. Les lance-roquettes : projectile, et pas de balles (degats = sur un tank).
  //   verrou : un fusil à verrou (on réarme à la main après chaque tir) ; exclus : les emplacements (ou « emplacement:pièce »)
  //   qui n'existent pas sur cette arme (un « bullpup » ne peut pas changer de crosse : elle fait partie de l'arme ; il
  //   peut seulement l'alourdir avec une grosse plaque, la « crosse lourde »).
  //   (La forme 3D de chaque arme est dessinée dans affichage/armes3d.js.)
  armesPrincipales: {
    // ---------- 🪖 ASSAUT
    ar4: { nom: "AR-4", type: "Fusil d'assaut", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0,
      texte: "Le fusil d'assaut classique : précis, facile à tenir.",
      degats: 1, cadence: 0.1, portee: 170, porteeEfficace: 70, degatsLoin: 0.6, chargeur: 30, reserve: 150, rechargement: 2.2,
      dispersion: 0.03, dispersionVisee: 0.006, recul: 0.006, visee: 0.25, mobilite: 1, bruit: 1, zoom: 1.25 },
    famas: { nom: "FAMAS", type: "Fusil d'assaut (bullpup)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 3, exclus: ["crosse:legere", "crosse:repliable"],
      texte: "Le « clairon » français : il tire TRÈS vite, mais il bouge plus.",
      degats: 0.9, cadence: 0.065, portee: 150, porteeEfficace: 60, degatsLoin: 0.55, chargeur: 25, reserve: 150, rechargement: 2.6,
      dispersion: 0.034, dispersionVisee: 0.008, recul: 0.009, visee: 0.22, mobilite: 1.04, bruit: 1, zoom: 1.25 },
    ak12: { nom: "AK-12", type: "Fusil d'assaut lourd", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 6,
      texte: "Gros calibre : fait plus mal, va plus loin… mais recule fort.",
      degats: 1.35, cadence: 0.11, portee: 190, porteeEfficace: 85, degatsLoin: 0.65, chargeur: 30, reserve: 120, rechargement: 2.5,
      dispersion: 0.032, dispersionVisee: 0.007, recul: 0.012, visee: 0.3, mobilite: 0.96, bruit: 1.15, zoom: 1.25 },
    // (demande 97) le fusil allemand en plastique, avec sa grande poignée de transport et son chargeur transparent
    g36: { nom: "G36", type: "Fusil d'assaut", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 9,
      texte: "Le fusil allemand tout en plastique : il recule très peu et reste précis en rafale, mais il fait un peu moins mal.",
      degats: 0.95, cadence: 0.09, portee: 175, porteeEfficace: 75, degatsLoin: 0.6, chargeur: 30, reserve: 150, rechargement: 2.4,
      dispersion: 0.028, dispersionVisee: 0.0055, recul: 0.0045, visee: 0.27, mobilite: 1, bruit: 1, zoom: 1.25 },
    // (demande 97) le gros fusil de combat couleur sable : une balle de 7,62 mm
    scarh: { nom: "SCAR-H", type: "Fusil de combat (7,62 mm)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 14,
      texte: "Une grosse balle : 2 balles par soldat, et elle porte loin. Mais 20 balles seulement, et un recul de mule !",
      degats: 1.6, cadence: 0.125, portee: 230, porteeEfficace: 100, degatsLoin: 0.7, chargeur: 20, reserve: 120, rechargement: 2.5,
      dispersion: 0.034, dispersionVisee: 0.0055, recul: 0.015, visee: 0.32, mobilite: 0.95, bruit: 1.2, zoom: 1.25 },
    // ---------- 🔧 INGÉNIEUR
    rpg7: { nom: "RPG-7", type: "Lance-roquettes", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "roquette", niveau: 0,
      texte: "Le lance-roquettes : 1 roquette = 1 obus sur un tank.",
      degats: 1, cadence: 0.5, portee: 260, porteeEfficace: 260, degatsLoin: 1, chargeur: 1, reserve: 6, rechargement: 3,
      dispersion: 0.03, dispersionVisee: 0.008, recul: 0.03, visee: 0.45, mobilite: 0.93, bruit: 1.4, zoom: 1.5 },
    // (demande 97) l'arme de défense de l'ingénieur : contre les soldats (mais plus de roquette contre les tanks !)
    ump45: { nom: "UMP45", type: "Pistolet-mitrailleur (.45)", icone: "🔫", classe: "ingenieur", famille: "pm", niveau: 2,
      texte: "Pour se défendre contre les soldats : de grosses balles lentes. Mais sans lance-roquettes, rien contre les tanks !",
      degats: 1, cadence: 0.09, portee: 95, porteeEfficace: 35, degatsLoin: 0.5, chargeur: 25, reserve: 175, rechargement: 2.1,
      dispersion: 0.03, dispersionVisee: 0.011, recul: 0.006, visee: 0.2, mobilite: 1.06, bruit: 0.9, zoom: 1.2 },
    at4: { nom: "AT4", type: "Lance-roquettes rapide", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "at4", niveau: 5,
      texte: "Sa roquette vole 2 fois plus vite et presque droit : plus facile de toucher de loin.",
      degats: 1, cadence: 0.5, portee: 320, porteeEfficace: 320, degatsLoin: 1, chargeur: 1, reserve: 5, rechargement: 3.6,
      dispersion: 0.025, dispersionVisee: 0.005, recul: 0.03, visee: 0.5, mobilite: 0.92, bruit: 1.4, zoom: 1.6 },
    javelin: { nom: "Javelin", type: "Missile guidé", icone: "🎯", classe: "ingenieur", famille: "roquettes", projectile: "javelin", niveau: 10,
      texte: "Son missile SUIT le véhicule visé et fait 2 dégâts. Mais il recharge lentement.",
      degats: 2, cadence: 0.5, portee: 400, porteeEfficace: 400, degatsLoin: 1, chargeur: 1, reserve: 4, rechargement: 5,
      dispersion: 0.02, dispersionVisee: 0.004, recul: 0.03, visee: 0.7, mobilite: 0.88, bruit: 1.3, zoom: 2 },
    // (demande 97) le canon d'épaule suédois : un obus plus fort qu'une roquette, rechargé par l'arrière
    carlgustaf: { nom: "Carl Gustaf M4", type: "Canon sans recul", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "at4", niveau: 16,
      texte: "Un canon d'épaule : son obus fait 1,5 fois plus mal qu'une roquette, et il en emporte 6. Très lourd et bruyant.",
      degats: 1.5, cadence: 0.5, portee: 340, porteeEfficace: 340, degatsLoin: 1, chargeur: 1, reserve: 6, rechargement: 3.4,
      dispersion: 0.026, dispersionVisee: 0.0045, recul: 0.035, visee: 0.55, mobilite: 0.86, bruit: 1.6, zoom: 1.7 },
    // ---------- 🔭 ÉCLAIREUR
    m110: { nom: "M110", type: "Fusil de tireur d'élite", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0,
      texte: "Semi-automatique : 2 balles mettent un soldat à terre, de très loin.",
      degats: 2, cadence: 0.4, portee: 330, porteeEfficace: 200, degatsLoin: 0.75, chargeur: 10, reserve: 50, rechargement: 2.6,
      dispersion: 0.06, dispersionVisee: 0.0015, recul: 0.02, visee: 0.38, mobilite: 0.97, bruit: 1.2, zoom: 1.4, vitesseBalle: 780 },
    // (étape 79) le fusil russe : semi-automatique, plus léger que le .338, la balle tombe un peu plus vite.
    svd: { nom: "SVD Dragunov", type: "Fusil de tireur d'élite", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 4,
      texte: "Le fusil russe : léger, semi-automatique, 2 balles par soldat. Sa balle est plus lente : vise un peu plus haut de loin !",
      degats: 2.2, cadence: 0.55, portee: 380, porteeEfficace: 240, degatsLoin: 0.8, chargeur: 10, reserve: 40, rechargement: 2.8,
      dispersion: 0.07, dispersionVisee: 0.0012, recul: 0.025, visee: 0.4, mobilite: 0.98, bruit: 1.3, zoom: 1.4, vitesseBalle: 700 },
    // (demande 97) le fusil à verrou classique, avec sa crosse « de chasse » mouchetée : le plus précis de tous
    m24: { nom: "M24", type: "Fusil à verrou", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 6, verrou: true, exclus: ["chargeur:rapide", "chargeur:tambour"],
      texte: "Le plus PRÉCIS de tous, et léger. 1 balle fait presque tomber un soldat. Mais 5 balles, à recharger une par une…",
      degats: 3, cadence: 1.1, portee: 420, porteeEfficace: 280, degatsLoin: 0.85, chargeur: 5, reserve: 35, rechargement: 3.1,
      dispersion: 0.07, dispersionVisee: 0.0007, recul: 0.026, visee: 0.4, mobilite: 0.98, bruit: 1.3, zoom: 1.4, vitesseBalle: 800 },
    // (demande 97) entre le fusil d'assaut et le sniper : le « DMR »
    mk14: { nom: "Mk 14 EBR", type: "Fusil de précision semi-auto", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 9,
      texte: "Entre le fusil d'assaut et le sniper : il tire vite pour un fusil de précision, avec 20 balles.",
      degats: 1.7, cadence: 0.22, portee: 300, porteeEfficace: 160, degatsLoin: 0.75, chargeur: 20, reserve: 80, rechargement: 2.6,
      dispersion: 0.05, dispersionVisee: 0.0018, recul: 0.016, visee: 0.34, mobilite: 0.97, bruit: 1.2, zoom: 1.4, vitesseBalle: 790 },
    lapua: { nom: "Sniper .338", type: "Fusil à verrou", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 13, verrou: true,
      texte: "1 balle = 1 soldat à terre. Mais il faut réarmer après chaque tir.",
      degats: 3.5, cadence: 1.25, portee: 450, porteeEfficace: 300, degatsLoin: 0.85, chargeur: 5, reserve: 30, rechargement: 3.2,
      dispersion: 0.08, dispersionVisee: 0.0008, recul: 0.03, visee: 0.45, mobilite: 0.95, bruit: 1.4, zoom: 1.4, vitesseBalle: 900 },
    barrett: { nom: "Barrett .50", type: "Fusil anti-matériel", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 18, exclus: ["crosse:legere", "crosse:repliable", "chargeur:rapide"],
      texte: "Énorme ! Il abîme aussi les motos, les quads et le 4x4. Très lourd.",
      degats: 4, degatsVehicule: 1, cadence: 0.9, portee: 520, porteeEfficace: 350, degatsLoin: 0.9, chargeur: 10, reserve: 30, rechargement: 3.8,
      dispersion: 0.09, dispersionVisee: 0.001, recul: 0.045, visee: 0.6, mobilite: 0.88, bruit: 1.8, zoom: 1.4, vitesseBalle: 850 },
    // ---------- ⛑️ MÉDECIN
    mp5: { nom: "MP5", type: "Pistolet-mitrailleur", icone: "🔫", classe: "medecin", famille: "pm", niveau: 0,
      texte: "Petit, léger et précis de près : on court plus vite avec.",
      degats: 0.8, cadence: 0.075, portee: 100, porteeEfficace: 35, degatsLoin: 0.5, chargeur: 30, reserve: 180, rechargement: 1.9,
      dispersion: 0.03, dispersionVisee: 0.01, recul: 0.005, visee: 0.18, mobilite: 1.1, bruit: 0.85, zoom: 1.2 },
    vector: { nom: "Vector", type: "Pistolet-mitrailleur rapide", icone: "🔫", classe: "medecin", famille: "pm", niveau: 5,
      texte: "Il crache les balles 2 fois plus vite… et vide son chargeur en un clin d'œil.",
      degats: 0.75, cadence: 0.045, portee: 85, porteeEfficace: 30, degatsLoin: 0.45, chargeur: 25, reserve: 200, rechargement: 2,
      dispersion: 0.034, dispersionVisee: 0.012, recul: 0.004, visee: 0.18, mobilite: 1.1, bruit: 0.9, zoom: 1.2 },
    // (demande 97) tout petit, le chargeur DANS la poignée
    mp7: { nom: "MP7", type: "Pistolet-mitrailleur compact", icone: "🔫", classe: "medecin", famille: "pm", niveau: 8, exclus: ["chargeur:rapide", "chargeur:tambour"],
      texte: "Tout petit et très rapide, avec 40 balles. Son chargeur est rangé DANS la poignée !",
      degats: 0.7, cadence: 0.052, portee: 95, porteeEfficace: 40, degatsLoin: 0.55, chargeur: 40, reserve: 200, rechargement: 2.1,
      dispersion: 0.028, dispersionVisee: 0.01, recul: 0.0042, visee: 0.16, mobilite: 1.12, bruit: 0.85, zoom: 1.2 },
    p90: { nom: "P90", type: "Arme de défense", icone: "🔫", classe: "medecin", famille: "pm", niveau: 11, exclus: ["crosse:legere", "crosse:repliable"],
      texte: "Un chargeur de 50 balles posé sur le dessus : on tire longtemps.",
      degats: 0.8, cadence: 0.06, portee: 110, porteeEfficace: 45, degatsLoin: 0.55, chargeur: 50, reserve: 200, rechargement: 2.8,
      dispersion: 0.03, dispersionVisee: 0.009, recul: 0.0045, visee: 0.2, mobilite: 1.08, bruit: 0.9, zoom: 1.25 },
    // (demande 97) le chargeur en TUBE sous le canon (il sert aussi de poignée)
    bizon: { nom: "PP-19 Bizon", type: "Pistolet-mitrailleur", icone: "🔫", classe: "medecin", famille: "pm", niveau: 15, exclus: ["chargeur:tambour", "chargeur:rapide", "poignee"],
      texte: "Son gros chargeur en tube, SOUS le canon, tient 64 balles ! Mais il est long à recharger.",
      degats: 0.75, cadence: 0.07, portee: 90, porteeEfficace: 32, degatsLoin: 0.5, chargeur: 64, reserve: 192, rechargement: 3.1,
      dispersion: 0.033, dispersionVisee: 0.011, recul: 0.005, visee: 0.21, mobilite: 1.06, bruit: 0.9, zoom: 1.2 },
  },
  // ✍️ Les PISTOLETS (arme 1, pour toutes les classes ; demande 97 : on en choisit un dans l'armurerie). Les mêmes
  // réglages que les armes principales ; « niveau » : le niveau de joueur qu'il faut pour le débloquer.
  pistolets: {
    pistolet: { nom: "M17", type: "Pistolet", icone: "🔫", famille: "pistolet", niveau: 0,
      texte: "Le pistolet de tout le monde : solide et précis, 12 balles, et des munitions sans fin.",
      degats: 1, cadence: 0.3, portee: 70, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 12, reserve: Infinity, rechargement: 1.4,
      dispersion: 0.03, dispersionVisee: 0.012, recul: 0.02, visee: 0.15, mobilite: 1.05, bruit: 0.8, zoom: 1.2 },
    glock17: { nom: "Glock 17", type: "Pistolet", icone: "🔫", famille: "pistolet", niveau: 3,
      texte: "Carré et léger : 17 balles, il tire vite. Un peu moins fort.",
      degats: 0.9, cadence: 0.2, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 17, reserve: Infinity, rechargement: 1.5,
      dispersion: 0.03, dispersionVisee: 0.013, recul: 0.018, visee: 0.14, mobilite: 1.06, bruit: 0.8, zoom: 1.2 },
    mr73: { nom: "MR73", type: "Revolver (.357)", icone: "🔫", famille: "pistolet", niveau: 7,
      texte: "Le revolver des gendarmes français : 2 dégâts par balle et très précis. Mais 6 balles, et le barillet est lent à remplir.",
      degats: 2, cadence: 0.45, portee: 85, porteeEfficace: 35, degatsLoin: 0.55, chargeur: 6, reserve: Infinity, rechargement: 3.2,
      dispersion: 0.026, dispersionVisee: 0.008, recul: 0.04, visee: 0.17, mobilite: 1.04, bruit: 1.1, zoom: 1.25 },
    deagle: { nom: "Desert Eagle", type: "Gros pistolet (.50)", icone: "🔫", famille: "pistolet", niveau: 12,
      texte: "ÉNORME pistolet : 2,2 dégâts par balle ! Mais il saute dans la main, et 7 balles seulement.",
      degats: 2.2, cadence: 0.42, portee: 80, porteeEfficace: 30, degatsLoin: 0.5, chargeur: 7, reserve: Infinity, rechargement: 2,
      dispersion: 0.036, dispersionVisee: 0.011, recul: 0.05, visee: 0.19, mobilite: 1, bruit: 1.35, zoom: 1.25 },
  },
  // ✍️ Les GADGETS (2 par classe, tu en prends 1 : touche 3, puis Espace).
  // (demande 98) niveau : le NIVEAU DE JOUEUR qui le débloque (0 : libre dès le début ; le 1er de chaque classe est toujours libre).
  gadgets: {
    lanceGrenades: { nom: "Lance-grenades", niveau: 0, icone: "💥", texte: "Sous le canon : une grenade de 40 mm qui explose en touchant.",
      munitions: 4, regain: 20, cadence: 1.2, projectile: "lg40" }, // (regain : +1 toutes les 20 s, et tout au camp)
    sacMunitions: { nom: "Sac de munitions", niveau: 4, icone: "🎒", texte: "Recharge tes balles, ton lance-grenades et 1 explosif, et ceux de tes amis tout près.",
      attente: 30, rayon: 8 },
    reparation: { nom: "Outil de réparation", niveau: 0, icone: "🔧", texte: "Tiens Espace près d'un tank ou d'un engin ami abîmé (le tien aussi !) : il se répare.",
      distance: 5.5, vitesse: 0.45, chauffe: 6, refroidit: 2.5 }, // m ; points de vie par s ; s avant de surchauffer ; s pour refroidir
    droneReparation: { nom: "Drone de réparation", niveau: 7, icone: "🛸", texte: "Il s'envole vers le véhicule ami le plus abîmé (moins de 30 m) et le répare tout seul.",
      portee: 30, vitesse: 0.3, duree: 18, attente: 40, hauteur: 3.2 },
    jumelles: { nom: "Jumelles", niveau: 0, icone: "🔭", texte: "V (ou clic droit) : regarder loin. Espace : MARQUER l'ennemi visé, pour toi et tes alliés.",
      zoom: 5, attente: 0.8 },
    capteur: { nom: "Capteur de mouvement", niveau: 5, icone: "📡", texte: "À lancer : il marque tous les ennemis qui bougent autour de lui.",
      rayon: 32, duree: 25, attente: 45, vitesse: 13 },
    trousse: { nom: "Trousse de soins", niveau: 0, icone: "🩹", texte: "Espace : pose une trousse. Toi et tes amis tout près, vous êtes soignés.",
      rayon: 6, vitesse: 2.5, duree: 14, attente: 25 }, // m ; vie par s (pour toi ; ÷ 8 pour un soldat de l'ordinateur, qui a 3 de vie)
    defibrillateur: { nom: "Défibrillateur", niveau: 3, icone: "⚡", texte: "Espace près d'un ami tombé : il se RELÈVE (avec la moitié de sa vie).",
      distance: 3, attente: 1.5, delai: 16 }, // (delai : s depuis sa chute)
  },
  // ✍️ Les EXPLOSIFS (2 par classe, tu en prends 1 : touche 4). nombre : combien tu en as ; regain : s pour en regagner 1
  // (et tous d'un coup à ton camp). (demande 98) niveau : le niveau de joueur qui le débloque ; rayon, duree : le nuage
  // de fumée (m, s) ; declenche : m (un véhicule ennemi pour la mine, un soldat ennemi pour la claymore) ; cone : ± rad
  // devant la claymore ; portee : m où la claymore abat les soldats ; max : combien tu peux en poser à la fois (le plus
  // vieux disparaît). Leur souffle : « projectiles » (mine, c4, claymore) ; les murs : « structures.explosions ».
  explosifs: {
    grenades: { nom: "Grenades", niveau: 0, icone: "💣", texte: "Lancée en cloche, elle rebondit et explose après 3 s.", nombre: 4, regain: 25 },
    fumigene: { nom: "Grenades fumigènes", niveau: 2, icone: "💨", texte: "Un gros nuage : les ennemis ne voient plus au travers. Parfait pour relever un ami !",
      nombre: 3, regain: 25, rayon: 8, duree: 20 },
    mineAT: { nom: "Mine antichar", niveau: 0, icone: "⭕", texte: "Posée par terre : elle explose sous un véhicule ennemi (2 dégâts).", nombre: 3, regain: 40, declenche: 2.6, max: 6 },
    c4: { nom: "C4", niveau: 8, icone: "🧨", texte: "Colle-le (au sol ou sur un véhicule), éloigne-toi, puis R : BOUM ! Très puissant.", nombre: 2, regain: 40, max: 4 },
    claymore: { nom: "Claymore", niveau: 6, icone: "📦", texte: "Une mine posée qui saute quand un soldat ennemi passe DEVANT elle.",
      nombre: 2, regain: 35, declenche: 5, cone: 0.9, portee: 10, max: 4 },
  },
  // (demande 98) ✍️ LES EXPLOSIFS EN BATAILLE (touche 4, puis Espace ; le C4 : R pour le faire sauter).
  //   - poser : la mine, le C4 et la claymore sont posés à « devant » m devant toi ; le C4 se COLLE sur un véhicule à
  //     moins de « colle » m de cet endroit (et le suit quand il roule) ; « attente » s entre deux poses ;
  //   - le fumigène est lancé comme une grenade (« lancer » m/s, à l'angle des grenades) et fume « meche » s après ;
  //   - armement : une mine ou une claymore ne saute pas pendant les « armement » premières secondes (le temps de partir) ;
  //   - le nuage (l'affichage) : « bouffees » bouffées de fumée par seconde selon la qualité (0 très léger … 3 beau),
  //     qui vivent « vie » s ; « hauteur » m : le nuage cache jusqu'à cette hauteur (un hélico au-dessus voit encore).
  posesEnBataille: {
    devant: 1.4, colle: 3, attente: 0.8, lancer: 13, meche: 1.6, armement: 1.5,
    nuage: { bouffees: [2, 3, 4, 6], vie: 7, hauteur: 9 },
  },
  // ✍️ L'ARMURERIE (demande 97, avant : l'atelier de l'étape 77) : 11 emplacements. Chaque pièce a des AVANTAGES ET des
  // DÉFAUTS, se voit sur l'arme en 3D, et se débloque au NIVEAU D'ARME « niveau » (la 1re pièce de chaque liste : dès le
  // début). pour : les familles d'armes qui ont cet emplacement (ou cette pièce) ; « fusil », « pm », « precision »,
  // « pistolet », « roquettes ».
  //   effets : × (ou + pour visee, mobilite, visibilite) sur les réglages de l'arme. Les autres REMPLACENT la valeur :
  //   zoom : le zoom en visant ; aimant / cone : l'assistance à la visée (rad/s qui tirent ton arme vers l'ennemi, et le
  //   cône où elle le cherche) ; lampe : { portee (m), angle (rad), force, aveugle (m : elle éblouit l'ennemi) } ;
  //   laser : sa couleur ; thermique : la lunette montre la CHALEUR (les soldats et les moteurs brillent en blanc) ;
  //   visibilite : m de plus (ou de moins) où l'ennemi te REMARQUE ; flamme : × la taille de l'éclair au bout du canon ;
  //   vsVehicule : × les dégâts sur une moto, un quad ou leur pilote ; vitesseBalle : × la vitesse de la balle (les
  //   fusils de précision : elle tombe moins vite) ; cadence : × le temps entre 2 balles.
  atelier: {
    viseur: { nom: "Viseur", icone: "🎯", pour: ["fusil", "pm", "precision", "pistolet", "roquettes"], pieces: [
      { id: "mire", nom: "Mire métallique", niveau: 0, texte: "Le guidon et le cran de mire : simple et rapide.", effets: {} },
      { id: "pointRouge", nom: "Point rouge", niveau: 1, texte: "Un petit point rouge : on vise mieux.", effets: { zoom: 1.6, dispersionVisee: 0.85, visee: 0.03 } },
      { id: "lunette2", nom: "Viseur ×2 compact", niveau: 2, pour: ["fusil", "pm", "precision", "roquettes"], texte: "Un petit prisme qui grossit 2 fois : bien pour les combats moyens.", effets: { zoom: 2.2, dispersionVisee: 0.78, visee: 0.05, mobilite: -0.005 } },
      { id: "holo", nom: "Holographique", niveau: 3, pour: ["fusil", "pm", "precision", "roquettes"], texte: "Une grande fenêtre avec un cercle : précis et clair.", effets: { zoom: 1.9, dispersionVisee: 0.75, visee: 0.06, mobilite: -0.01 } },
      // (demande 88) une lunette compacte entre le point rouge et la grosse lunette
      { id: "lunette4", nom: "Lunette ×4", niveau: 5, pour: ["fusil", "pm", "precision", "roquettes"], texte: "Une lunette courte et solide : on tire loin, sans être trop lent.", effets: { zoom: 4, dispersionVisee: 0.6, portee: 1.08, visee: 0.1, mobilite: -0.015 } },
      { id: "lunette", nom: "Lunette ×6", niveau: 7, pour: ["fusil", "pm", "precision"], texte: "Pour tirer TRÈS loin. Lente à épauler, et on voit moins autour.", effets: { zoom: 6, dispersionVisee: 0.5, portee: 1.15, visee: 0.18, mobilite: -0.03, dispersion: 1.1 } },
      { id: "lunette8", nom: "Lunette ×8", niveau: 8, pour: ["fusil", "precision"], texte: "La plus grosse lunette : on voit un soldat à 500 m ! Très lente, très lourde.", effets: { zoom: 8, dispersionVisee: 0.42, portee: 1.2, visee: 0.24, mobilite: -0.04, dispersion: 1.15 } },
      { id: "thermique", nom: "Lunette thermique", niveau: 10, pour: ["fusil", "pm", "precision", "roquettes"], texte: "×4 qui voit la CHALEUR : les soldats et les moteurs brillent en blanc, même dans la fumée. Lourde, et l'écran éclaire ton visage.", effets: { zoom: 4, thermique: true, dispersionVisee: 0.65, visee: 0.14, mobilite: -0.025, visibilite: 8 } },
    ] },
    canon: { nom: "Canon", icone: "📏", pour: ["fusil", "pm", "precision"], pieces: [
      { id: "standard", nom: "Canon standard", niveau: 0, texte: "Le canon d'origine.", effets: {} },
      { id: "court", nom: "Canon court", niveau: 2, texte: "Léger et rapide, mais moins loin.", effets: { portee: 0.8, mobilite: 0.04, visee: -0.04, dispersion: 0.9, degatsLoin: 0.9, vitesseBalle: 0.9 } },
      { id: "long", nom: "Canon long", niveau: 4, texte: "Plus loin et plus fort, mais plus lourd.", effets: { portee: 1.25, degatsLoin: 1.15, dispersionVisee: 0.9, visee: 0.05, mobilite: -0.03, vitesseBalle: 1.1 } },
      { id: "lourd", nom: "Canon lourd", niveau: 7, texte: "Un canon épais et cannelé : il ne chauffe pas et ne bouge presque pas. Mais il pèse !", effets: { recul: 0.8, dispersionVisee: 0.85, portee: 1.1, visee: 0.08, mobilite: -0.05 } },
    ] },
    bouche: { nom: "Bouche", icone: "💨", pour: ["fusil", "pm", "precision", "pistolet"], pieces: [
      { id: "aucune", nom: "D'origine", niveau: 0, texte: "Le bout de canon d'origine.", effets: {} },
      { id: "cacheFlamme", nom: "Cache-flamme", niveau: 1, texte: "Presque plus d'éclair : on te remarque moins. Un tout petit peu plus de recul.", effets: { flamme: 0.35, visibilite: -10, recul: 1.05 } },
      { id: "compensateur", nom: "Compensateur", niveau: 3, texte: "Des trous sur le dessus : le canon remonte moins. Plus bruyant, un peu moins précis à la hanche.", effets: { recul: 0.82, dispersion: 1.05, bruit: 1.1 } },
      { id: "frein", nom: "Frein de bouche", niveau: 5, pour: ["fusil", "pm", "precision"], texte: "Le gros frein : BEAUCOUP moins de recul. Mais il soulève la poussière et fait un bruit terrible.", effets: { recul: 0.7, bruit: 1.25, visibilite: 12, flamme: 1.3 } },
      { id: "silencieux", nom: "Silencieux", niveau: 8, texte: "Les ennemis t'entendent 3 fois moins loin. Un peu moins fort, et plus long à épauler.", effets: { bruit: 0.3, degats: 0.92, portee: 0.9, recul: 0.9, flamme: 0.1, visee: 0.02, visibilite: -6 } },
    ] },
    chargeur: { nom: "Chargeur", icone: "🧱", pour: ["fusil", "pm", "precision", "pistolet"], pieces: [
      { id: "standard", nom: "Chargeur standard", niveau: 0, texte: "Le chargeur d'origine.", effets: {} },
      { id: "rapide", nom: "Chargeur rapide", niveau: 2, pour: ["fusil", "pm"], texte: "2 chargeurs scotchés : on recharge très vite, mais un peu moins de balles.", effets: { rechargement: 0.6, chargeur: 0.85 } },
      { id: "grand", nom: "Grand chargeur", niveau: 4, texte: "50 % de balles en plus, mais plus long à changer.", effets: { chargeur: 1.5, rechargement: 1.25, mobilite: -0.02 } },
      { id: "tambour", nom: "Tambour", niveau: 9, pour: ["fusil", "pm"], texte: "2 fois plus de balles ! Très lourd et lent à recharger.", effets: { chargeur: 2, rechargement: 1.6, mobilite: -0.05, visee: 0.05 } },
    ] },
    poignee: { nom: "Poignée", icone: "✊", pour: ["fusil", "pm", "precision"], pieces: [
      { id: "aucun", nom: "Rien", niveau: 0, texte: "La main sur le garde-main.", effets: {} },
      { id: "vertical", nom: "Poignée verticale", niveau: 1, texte: "L'arme recule moins.", effets: { recul: 0.75, visee: 0.02, mobilite: -0.01 } },
      { id: "incline", nom: "Poignée inclinée", niveau: 3, texte: "On épaule plus vite.", effets: { visee: -0.06, recul: 0.9 } },
      { id: "arretoir", nom: "Arrêtoir de main", niveau: 5, texte: "Une petite butée devant la main : précis à la hanche. Le recul revient un peu plus.", effets: { dispersion: 0.8, visee: -0.02, recul: 1.05 } },
      { id: "bipied", nom: "Bipied", niveau: 7, pour: ["fusil", "precision"], texte: "2 pieds dépliés : l'arme ne bouge presque plus quand tu vises… mais elle pèse et elle est lente.", effets: { recul: 0.55, dispersionVisee: 0.8, mobilite: -0.05, visee: 0.08 } },
    ] },
    crosse: { nom: "Crosse", icone: "🪵", pour: ["fusil", "pm", "precision"], pieces: [
      { id: "standard", nom: "Crosse d'origine", niveau: 0, texte: "La crosse livrée avec l'arme.", effets: {} },
      { id: "legere", nom: "Crosse légère", niveau: 2, texte: "Un simple squelette : on court et on épaule plus vite. L'arme recule plus.", effets: { mobilite: 0.04, visee: -0.04, recul: 1.15 } },
      { id: "repliable", nom: "Crosse repliée", niveau: 4, texte: "Repliée sur le côté : l'arme est toute courte et rapide… mais elle saute dans les mains.", effets: { mobilite: 0.06, visee: -0.06, recul: 1.3, dispersionVisee: 1.15 } },
      { id: "lourde", nom: "Crosse lourde", niveau: 6, texte: "Elle ne bouge presque plus… mais elle pèse lourd.", effets: { recul: 0.55, dispersion: 0.85, mobilite: -0.06, visee: 0.06 } },
    ] },
    munitions: { nom: "Munitions", icone: "🔸", pour: ["fusil", "pm", "precision", "pistolet"], pieces: [
      { id: "standard", nom: "Balles normales", niveau: 0, texte: "Les balles d'origine.", effets: {} },
      { id: "pointeCreuse", nom: "Pointe creuse", niveau: 3, texte: "Elles s'ouvrent en touchant : 20 % de dégâts en plus… mais elles portent moins loin, et rien contre les engins.", effets: { degats: 1.2, portee: 0.85, degatsLoin: 0.85, vsVehicule: 0.5 } },
      { id: "perforantes", nom: "Perforantes", niveau: 6, texte: "Une pointe d'acier : 2,5 fois plus de dégâts sur les motos, quads et leurs pilotes. Un peu moins sur les soldats.", effets: { vsVehicule: 2.5, degats: 0.95, recul: 1.05 } },
      { id: "subsoniques", nom: "Subsoniques", niveau: 8, texte: "Plus lentes que le son : beaucoup plus discrètes. Mais elles tombent plus vite et vont moins loin.", effets: { bruit: 0.6, vitesseBalle: 0.7, degatsLoin: 0.85, portee: 0.9 } },
    ] },
    lampe: { nom: "Lampe", icone: "🔦", pour: ["fusil", "pm", "precision", "roquettes"], pieces: [
      { id: "aucune", nom: "Aucune", niveau: 0, texte: "Pas de lampe.", effets: {} },
      { id: "lampe", nom: "Lampe", niveau: 2, texte: "Éclaire devant toi (touche L). Mais on te voit de plus loin.", effets: { lampe: { portee: 30, angle: 0.32, force: 40, aveugle: 0 }, visibilite: 25 } },
      { id: "puissante", nom: "Lampe puissante", niveau: 6, texte: "Éclaire loin et ÉBLOUIT les ennemis devant elle (ils visent mal). Mais on te voit de TRÈS loin.", effets: { lampe: { portee: 55, angle: 0.26, force: 110, aveugle: 22 }, visibilite: 60, mobilite: -0.01 } },
    ] },
    laser: { nom: "Laser", icone: "🔴", pour: ["fusil", "pm", "precision", "roquettes"], pieces: [
      { id: "aucun", nom: "Aucun", niveau: 0, texte: "Pas de laser.", effets: {} },
      { id: "rouge", nom: "Laser rouge", niveau: 1, texte: "Un point rouge là où tu vises : plus précis sans viser. Il se voit un peu.", effets: { laser: "#ff2a1a", dispersion: 0.75, visibilite: 15 } },
      { id: "vert", nom: "Laser vert", niveau: 5, texte: "Plus brillant : encore plus précis, épaule plus vite… mais il se voit de loin.", effets: { laser: "#3dff4a", dispersion: 0.62, visee: -0.03, visibilite: 35 } },
    ] },
    assistance: { nom: "Assistance à la visée", court: "Assistance", icone: "🧲", pour: ["fusil", "pm", "precision", "pistolet", "roquettes"], pieces: [
      { id: "aucune", nom: "Aucune", niveau: 0, texte: "C'est toi qui vises.", effets: { cone: 0.04, aimant: 0 } },
      { id: "legere", nom: "Légère", niveau: 1, texte: "Ton arme glisse un peu vers l'ennemi. Un peu moins de dégâts.", effets: { cone: 0.09, aimant: 0.6, degats: 0.95 } },
      { id: "moyenne", nom: "Moyenne", niveau: 2, texte: "Elle t'aide bien. Moins de dégâts, et un peu plus lourde.", effets: { cone: 0.14, aimant: 1.2, degats: 0.9, mobilite: -0.01 } },
      { id: "forte", nom: "Forte", niveau: 4, texte: "Elle « colle » à l'ennemi ! Mais tes balles font beaucoup moins mal.", effets: { cone: 0.2, aimant: 2.2, degats: 0.8, mobilite: -0.02 } },
    ] },
    // ✍️ LES PEINTURES (des camouflages, peints par l'ordinateur au démarrage : aucune image à télécharger). motif : la
    // façon de peindre (des « taches » en couches, des « pixels », des « rayures » de tigre, la trame du « carbone », l'« or »
    // gravé) ; couleurs : le fond puis chaque couche ; brillant : 0 (mat) à 1 (métal qui brille).
    // Le camouflage aide un peu à se cacher (on te remarque 5 m moins loin) ; l'or se voit de loin… mais c'est de l'OR !
    peinture: { nom: "Peinture", icone: "🎨", pour: ["fusil", "pm", "precision", "pistolet", "roquettes"], pieces: [
      { id: "aucune", nom: "D'usine", niveau: 0, texte: "La couleur d'origine de l'arme.", effets: {} },
      { id: "foret", nom: "Forêt", niveau: 1, texte: "Le camouflage des bois : vert, brun et noir.", motif: "taches", couleurs: ["#5c6440", "#3d4a2a", "#6e5434", "#1f221a"], effets: { visibilite: -5 } },
      { id: "desert", nom: "Désert", niveau: 2, texte: "Sable, ocre et brun clair : pour les dunes.", motif: "taches", couleurs: ["#c9ad7c", "#a88a5c", "#e0cfa4", "#7d6444"], effets: { visibilite: -5 } },
      { id: "urbain", nom: "Urbain", niveau: 3, texte: "Gris, noir et blanc : pour les villes en ruines.", motif: "taches", couleurs: ["#7a7c80", "#4a4c50", "#b8babd", "#202124"], effets: { visibilite: -5 } },
      { id: "neige", nom: "Neige", niveau: 4, texte: "Blanc avec des taches grises : pour l'hiver.", motif: "taches", couleurs: ["#e6eaee", "#b8c0c8", "#f8fafc", "#6e767e"], effets: { visibilite: -5 } },
      { id: "numerique", nom: "Numérique", niveau: 5, texte: "Un camouflage en petits carrés, comme un écran.", motif: "pixels", couleurs: ["#6b7250", "#4a5236", "#8a8a62", "#2e3324"], effets: { visibilite: -5 } },
      { id: "tigre", nom: "Tigre", niveau: 6, texte: "Orange et rayé de noir : le roi de la jungle !", motif: "rayures", couleurs: ["#e07a1c", "#141210", "#f2a54a"], effets: {} },
      { id: "carbone", nom: "Carbone", niveau: 8, texte: "La trame noire des voitures de course : élégant.", motif: "carbone", couleurs: ["#26282c", "#0e0f11", "#3a3d42"], brillant: 0.35, effets: {} },
      { id: "or", nom: "Or", niveau: 10, texte: "En OR gravé ! La récompense des champions… mais ça brille : on te voit de 25 m plus loin.", motif: "or", couleurs: ["#d8a93c", "#a8781e", "#ffe08a"], brillant: 1, effets: { visibilite: 25 } },
    ] },
  },
  // ✍️ (demande 97) LES DÉBLOCAGES ET L'EXPÉRIENCE (logique/progression.js). En jouant, tu gagnes des POINTS D'EXPÉRIENCE
  // (« XP ») ; assez de points = un NIVEAU DE JOUEUR de plus, qui débloque des armes (leur « niveau » plus haut). Chaque arme
  // gagne aussi ses propres points (les ennemis abattus AVEC elle) : son NIVEAU D'ARME débloque ses pièces et peintures.
  //   joueur : il faut « base + pas × (niveau − 1) » XP pour passer du niveau N au N+1, jusqu'au niveau « max » ;
  //   arme : pareil pour une arme ; points : les XP gagnés pour chaque action (« arme » : les XP de ton arme en main) ;
  //   mvp : le meilleur de ton camp (le plus d'ennemis abattus, au moins « minimum ») gagne un bonus à la fin ;
  //   veteran : une ancienne sauvegarde (avant la demande 97) reçoit des XP pour ses victoires passées (au plus « max »).
  progression: {
    joueur: { base: 800, pas: 150, max: 30 },
    arme: { base: 300, pas: 100, max: 10 },
    points: {
      ennemi: { xp: 100, arme: 100, nom: "Ennemis abattus", icone: "💀" },
      tete: { xp: 50, arme: 50, nom: "Tirs à la tête", icone: "🎯" },
      tank: { xp: 300, arme: 200, nom: "Tanks détruits", icone: "💥" },
      vehicule: { xp: 150, arme: 100, nom: "Engins détruits", icone: "🚙" },
      soin: { xp: 40, nom: "Soins", icone: "🩹" },
      releve: { xp: 120, nom: "Soldats relevés", icone: "⚡" },
      reparation: { xp: 15, nom: "Réparations", icone: "🔧" },
      marque: { xp: 20, nom: "Ennemis marqués", icone: "🔭" },
      objectif: { xp: 250, nom: "Objectifs", icone: "🚩" },
      victoire: { xp: 500, nom: "Victoire", icone: "🏆" },
      participation: { xp: 100, nom: "Participation", icone: "🎖️" },
      etoile: { xp: 150, nom: "Étoiles de campagne", icone: "⭐" },
      mvp: { xp: 400, nom: "Meilleur joueur (MVP)", icone: "🥇" },
    },
    mvp: { minimum: 3 },
    veteran: { victoire: 150, tank: 40, etoile: 100, max: 8000 },
    toast: 5, // s : le temps où « NIVEAU SUPÉRIEUR ! » reste affiché
  },
  // ================================================================== demande 88 : ✍️ LES ARMES EN 3D (affichage/armes3d.js)
  // ✍️ « Refais toutes les armes, style Battlefield. » Chaque arme a son VRAI modèle 3D, les pièces de l'atelier se voient
  // dessus, l'arme tourne dans le menu, et à la première personne (C) elle est tenue par deux mains gantées. Unités : m, s, rad.
  armes3d: {
    // ✍️ les armes des soldats de l'ordinateur : tirées au sort (toujours la même pour un même soldat, d'après son nom)
    // dans la liste de son camp. [arme, poids] : un poids 4 sort 4 fois plus souvent qu'un poids 1.
    ia: {
      bleus: [["ar4", 4], ["famas", 3], ["g36", 2], ["scarh", 1], ["mp5", 2], ["mp7", 1], ["p90", 1], ["vector", 1], ["ump45", 1], ["m110", 1.2], ["m24", 0.6], ["mk14", 0.6], ["lapua", 0.6]],
      rouges: [["ak12", 5], ["svd", 1.6], ["bizon", 1.2], ["vector", 1.2], ["mp5", 1], ["ar4", 1], ["scarh", 0.8], ["mk14", 0.6], ["barrett", 0.5]],
      roquettes: [["rpg7", 3], ["at4", 2], ["javelin", 1], ["carlgustaf", 1]], // (les soldats « anti-tank »)
      // (demande 97 : les nouvelles pièces de l'armurerie ; les soldats de l'ordinateur n'ont ni peinture ni munitions spéciales)
      viseur: [["mire", 3], ["pointRouge", 3], ["holo", 2], ["lunette2", 1], ["lunette4", 1]],
      canon: [["standard", 5], ["court", 1], ["long", 1], ["lourd", 0.5]],
      bouche: [["aucune", 4], ["silencieux", 1], ["cacheFlamme", 1], ["compensateur", 1], ["frein", 0.5]],
      chargeur: [["standard", 6], ["grand", 1], ["rapide", 1]],
      poignee: [["aucun", 3], ["vertical", 2], ["incline", 1], ["arretoir", 1]],
    },
    // LA VUE À LA PREMIÈRE PERSONNE (C) : l'arme a sa propre petite caméra, dessinée PAR-DESSUS le monde (elle ne rentre
    // jamais dans un mur). Positions en m devant l'œil : x à droite, y en haut, z vers toi (−0,3 = 30 cm devant).
    vue: {
      champ: 56, // ° : le champ de vision de la caméra de l'arme
      hanche: { fusil: [0.135, -0.175, -0.43], pm: [0.13, -0.17, -0.4], precision: [0.145, -0.18, -0.45], pistolet: [0.085, -0.11, -0.47], roquettes: [0.2, -0.16, -0.24] },
      hancheLacet: { fusil: 0.2, pm: 0.2, precision: 0.17, pistolet: 0.06, roquettes: 0.02 }, // rad : à la hanche, l'arme est un peu tournée vers le centre…
      hancheRoulis: { fusil: -0.12, pm: -0.14, precision: -0.1, pistolet: -0.05, roquettes: 0 }, // rad : … et un peu penchée
      oeil: { fusil: 0.24, pm: 0.22, precision: 0.18, pistolet: 0.42, roquettes: 0.16 }, // m : de l'œil à l'arrière du viseur, épaulé
      respiration: [0.0035, 0.32], // [m, battements par s] : l'arme respire au repos
      pas: 0.014, // m : l'arme monte et descend à chaque pas
      retard: 0.035, // rad par rad/s : l'arme traîne un peu derrière quand tu tournes
      recul: { fusil: [0.035, 0.05], pm: [0.025, 0.035], precision: [0.08, 0.14], pistolet: [0.04, 0.16], roquettes: [0.1, 0.07], mitrailleuse: [0.04, 0.05] }, // [m en arrière, rad vers le haut] par tir
      ressort: 260, amorti: 26, // le ressort qui ramène l'arme après le recul (raideur, frottement)
      // pendant le rechargement : [m vers la droite, m vers le haut, m vers toi, rad de roulis, rad vers le haut]
      rechargePose: { fusil: [-0.07, 0.05, 0.05, 0.62, 0.22], pm: [-0.06, 0.05, 0.05, 0.6, 0.2], precision: [-0.07, 0.05, 0.05, 0.5, 0.2], pistolet: [-0.04, 0.04, 0.03, 0.5, 0.3], roquettes: [-0.04, -0.03, 0.02, 0.12, -0.08] },
      changement: 0.22, // s pour baisser l'arme (puis autant pour lever la nouvelle)
      flamme: 0.045, // s : l'éclair au bout du canon
      douilles: 12, // douilles éjectées en même temps (au plus)
    },
    lampe: { force: 1.1, faisceau: 0.2 }, // × la force de la lampe de l'atelier (la vraie lumière) ; l'opacité du faisceau qu'on voit
    laser: { epaisseur: 0.0035, point: 0.07, opacite: 0.55 }, // m, m, 0 à 1
    apercu: { vitesse: 0.55, hauteur: 210 }, // rad/s : l'arme tourne dans le menu ; px de haut
    // ✍️ LE SON de chaque famille d'arme (affichage/sons.js) : la note du « crac » (Hz), sa durée (s), la force du
    // « boum » grave (0 à 1) et sa note (Hz), et l'écho (s). Le silencieux étouffe tout (un « pfft »).
    sons: {
      pistolet: { crac: 2100, duree: 0.07, boum: 0.25, grave: 220, echo: 0.12 },
      pm: { crac: 2600, duree: 0.055, boum: 0.18, grave: 260, echo: 0.1 },
      fusil: { crac: 1500, duree: 0.09, boum: 0.45, grave: 150, echo: 0.25 },
      ak: { crac: 1150, duree: 0.1, boum: 0.6, grave: 120, echo: 0.3 },
      precision: { crac: 1000, duree: 0.14, boum: 0.85, grave: 90, echo: 0.7 },
      lourd: { crac: 700, duree: 0.2, boum: 1, grave: 60, echo: 1.1 },
      silencieux: { crac: 600, duree: 0.06, boum: 0.05, grave: 300, echo: 0 },
    },
  },
  // Les barres du menu : la valeur qui remplit la barre (le menu montre « avant → après »).
  // (demande 97) L'ARMURERIE : la valeur qui remplit chaque barre (plus la barre est longue, mieux c'est) ; « vue » : la
  // caméra qui tourne autour de l'arme (rad/s quand on n'y touche plus, s avant de reprendre, zoom le plus près / le plus
  // loin ; l'arme se balance de « balancement » rad autour de sa vue de côté).
  menu: {
    barres: { degats: 4.2, portee: 520, precision: 0.014, recul: 0.05, cadence: 1300, chargeur: 64, rechargement: 6, visee: 0.8, mobilite: [0.8, 1.2], bruit: 2, visibilite: 80 },
    vue: { vitesse: 0.35, reprise: 4, zoomMin: 0.55, zoomMax: 1.8, balancement: 0.55, depart: 0.3, hauteur: 0.14 },
  },
  // ✍️ LES MARQUES (les jumelles et le capteur de l'éclaireur) : un ennemi marqué a un ◆ jaune au-dessus de lui et sur
  // la carte pendant « duree » s. cone : rad autour du viseur ; portee : m.
  marques: { duree: 20, cone: 0.07, portee: 500 },
  // ✍️ LE TIR : la mécanique des armes (pour toi).
  //   cible : la « taille » d'un soldat vu de face (demi-largeur, demi-hauteur, m) : une balle touche si son écart (dû à
  //   la dispersion) reste dans ce rectangle ; reculRetour : rad/s (le recul redescend) ; reculMax : rad ;
  //   bruit : m (un tir s'entend jusqu'à 160 m × le bruit de l'arme) ; repere : s pendant lesquels tu es « repéré » ;
  //   viseeLent : × ta vitesse en visant ; pullHorizontal : la part du recul qui fait bouger ton arme de côté.
  tir: { cible: [0.32, 0.85], reculRetour: 0.09, reculMax: 0.08, bruit: 160, repere: 4, viseeLent: 0.6, reculCote: 0.25, vise: 0.05,
    // (étape 79) LA LUNETTE DE SNIPER (les fusils « precision », ou toute arme avec la lunette ×6) :
    //   zoom : le zoom minimum d'un fusil de sniper ; balancement : rad, l'écart de la respiration (un « 8 » en
    //   « periode » s) ; souffle : s où tu retiens ton souffle (Maj) ; reprise : s où tu reprends ton souffle après
    //   l'avoir retenu jusqu'au bout (la visée bouge alors « essouffle » fois plus) ; retenu : × le balancement souffle
    //   retenu ; gravite : m/s², ce qui fait tomber la balle (chute = ½ × g × temps², temps = distance ÷ vitesseBalle) ;
    //   zero : m, la distance où la lunette est réglée (la balle arrive pile sur la croix ; plus loin, en dessous).
    lunette: { zoom: 4, balancement: 0.004, periode: 5, souffle: 4, reprise: 3, essouffle: 2.2, retenu: 0.05, gravite: 9.81, zero: 200 } },
  // ✍️ (étape 80) LES CARTES : on choisit dans le menu (onglet « Carte ») avant la bataille.
  cartes: [
    { id: "bataille", nom: "La grande bataille", icone: "🌄", texte: "La campagne de 2 100 m : tanks, engins, avions, bateaux, hélicos, portails.", infanterie: false },
    { id: "souterrain", nom: "Le souterrain", icone: "🚇", texte: "Une station de métro sous terre : trams en feu, rames, bancs, escalators détruits. À pied seulement !", infanterie: true },
    // ✍️ (étape 81) 4 VARIANTES de la grande bataille : le même terrain, les mêmes règles, mais d'autres RÉGLAGES
    // (« variante »). Le décor est fabriqué au chargement de la page : changer de décor RECHARGE la page (1 s).
    //   arbres : × le nombre d'arbres ; haies : le nombre de haies (sinon monde.haies) ; collines : × la hauteur des collines ; herbe : false = pas de touffes d'herbe ;
    //   village : false = pas les 16 maisons du village (la ville prend la place) ;
    //   quartier : une VILLE en damier autour de (x, z) : « ilot » m entre deux rues, rues de « rue » m de large,
    //     « maisons » par pâté (îlot), jusqu'à « rayon » m du centre ; ruinesDepart : part des maisons de la ville déjà en
    //     ruines (0,8 = 80 %) ; crepis : les couleurs des murs (sinon les couleurs habituelles) ; toitPlat : toits presque plats ;
    //   sol : les couleurs du sol peint (remplacent celles de affichage/decor.js : [rouge, vert, bleu] de 0 à 255) ;
    //   rues : la couleur des rues ; soleil : remplace des réglages de beaute.soleil ; brume : la couleur de la brume.
    { id: "ville", nom: "La ville", icone: "🏙️", texte: "En pleine ville : des rues en damier et des dizaines de maisons entières où se cacher.", infanterie: false,
      variante: { arbres: 0.25, village: false, quartier: { x: 0, z: 0, rayon: 190, ilot: 38, rue: 10, maisons: 3, ruinesDepart: 0 }, rues: "#5a5c60" } },
    { id: "ruines", nom: "La ville en ruines", icone: "🏚️", texte: "La même ville, mais après les combats : presque tout est écroulé, gravats et sol gris.", infanterie: false,
      variante: { arbres: 0.15, village: false, quartier: { x: 0, z: 0, rayon: 190, ilot: 38, rue: 10, maisons: 3, ruinesDepart: 0.8 }, rues: "#4a4b4e", trous: 4,
        sol: { herbe: [92, 94, 80], herbeSombre: [70, 72, 62], herbeSeche: [120, 116, 100], herbeJaune: [96, 98, 82], terre: [96, 90, 82], terreBattue: [110, 106, 100] },
        soleil: { couleur: 0xe8e2d8, force: 2.2, ciel: 0xb8bcc2, sol: 0x55524c }, brume: 0xa8a8aa } },
    { id: "desert", nom: "Le désert", icone: "🏜️", texte: "Des dunes de sable à perte de vue, presque pas d'arbres, un soleil brûlant.", infanterie: false,
      variante: { arbres: 0.02, collines: 1.8, herbe: false, haies: 0,
        sol: { herbe: [214, 178, 120], herbeSombre: [196, 152, 96], herbeSeche: [226, 196, 140], herbeJaune: [220, 170, 100], terre: [190, 150, 104], terreBattue: [200, 166, 120], sousBois: [170, 136, 90], chemin: [186, 150, 106] },
        soleil: { couleur: 0xfff0d0, force: 3.2, ciel: 0xf0e0c0, sol: 0xb08a58 }, brume: 0xe6d6b8 } },
    { id: "village-desert", nom: "Le village du désert", icone: "🕌", texte: "Le désert, avec un village de maisons couleur sable au milieu des dunes.", infanterie: false,
      variante: { arbres: 0.02, collines: 1.8, herbe: false, haies: 0, village: false,
        quartier: { x: 0, z: 0, rayon: 120, ilot: 34, rue: 8, maisons: 2, ruinesDepart: 0.15 }, rues: "#c8a678", toitPlat: true,
        crepis: ["#d8bf92", "#e2cfa6", "#cfae7c", "#e6d6b6", "#c99f6a"],
        sol: { herbe: [214, 178, 120], herbeSombre: [196, 152, 96], herbeSeche: [226, 196, 140], herbeJaune: [220, 170, 100], terre: [190, 150, 104], terreBattue: [200, 166, 120], sousBois: [170, 136, 90], chemin: [186, 150, 106] },
        soleil: { couleur: 0xfff0d0, force: 3.2, ciel: 0xf0e0c0, sol: 0xb08a58 }, brume: 0xe6d6b8 } },
  ],
  // ✍️ (étape 80) LE SOUTERRAIN : une station de métro (m). L'axe x va d'un bout à l'autre de la station (les Bleus à
  // l'est, x > 0 ; les Rouges à l'ouest), l'axe z en travers (le quai nord est à z < 0, le quai sud à z > 0).
  //   longueur : les quais vont de −longueur/2 à +longueur/2 ; tunnel : m de tunnel (bouché) au bout de chaque voie ;
  //   voies : |z| < demi = la tranchée des rails, « profondeur » m plus bas que le quai ; rails : z des 2 voies ;
  //   quai : le quai va de |z| = voies.demi à |z| = fond ; plafond : m au-dessus du quai ;
  //   mezzanine : la galerie du haut (|x| < demiX, |z| de quai.fond à fond), à « hauteur » m au-dessus du quai ;
  //   escaliers / escalators : de |z| = quai.fond (en bas) à |z| = haut (en haut), entre x0 et x1 ;
  //   marche : m, la plus haute marche qu'un soldat peut monter d'un coup (plus haut : c'est un mur) ;
  //   brouillard : m (début, fin) ; regles : soldats au départ par camp, renforts (soldats qui arrivent ensuite, un toutes
  //   les « attente » s quand le camp en a moins que « soldats » debout), vue : m, ce que voit un soldat sous terre.
  souterrain: {
    longueur: 200, tunnel: 14,
    voies: { demi: 4.5, profondeur: 1.1, rails: [-2.25, 2.25], ecartement: 1.435 },
    quai: { fond: 15 },
    plafond: 8.5,
    mezzanine: { demiX: 38, fond: 27, hauteur: 4.5 },
    escaliers: { x0: -34, x1: -27, haut: 23 },
    escalators: { x0: 25, x1: 33, haut: 23 },
    marche: 1.15,
    piliers: { ecart: 12, z: 12.6, cote: 0.9 },
    bancs: { ecart: 24, z: 9.2 },
    lampes: { ecart: 8, clignotent: 0.22 },
    // les rames : { sorte: "metro" | "tram", voie (0 nord, 1 sud), x (milieu), voitures, angle (rad : déraillée), feu, brule }
    rames: [
      { sorte: "metro", voie: 0, x: -38, voitures: 3, angle: 0, feu: false, brule: false },
      { sorte: "metro", voie: 1, x: -74, voitures: 2, angle: 0.05, feu: false, brule: false },
      { sorte: "tram", voie: 1, x: 18, voitures: 1, angle: 0, feu: true, brule: true },
      { sorte: "tram", voie: 1, x: 50, voitures: 1, angle: -0.17, feu: true, brule: true },
      { sorte: "tram", voie: 0, x: 70, voitures: 1, angle: 0.09, feu: true, brule: true },
      { sorte: "metro", voie: 0, x: 26, voitures: 1, angle: 0.22, feu: false, brule: true },
    ],
    // la taille d'une voiture : longueur, largeur, hauteur (m) ; espace entre deux voitures
    voiture: { metro: [17, 2.9, 3.5], tram: [15, 2.6, 3.4], espace: 0.8 },
    feux: { lumieres: 4, force: 80, portee: 36, flammes: 22, fumee: 5 }, // flammes, fumee : particules par seconde et par feu
    brouillard: [14, 120],
    regles: { soldats: 10, renforts: 30, attente: 3, vue: 110 },
  },

  // ------------------------------------------------------------------ étape 88 : LA CAMPAGNE (le mode histoire)
  // ✍️ « Refais l'histoire style Battlefield. Refais les histoires, refais la campagne. » Une guerre INVENTÉE (aucun vrai
  // pays) : la Valdrie, attaquée par le Front Écarlate du Maréchal Varrok. 6 chapitres, chacun sur une carte du jeu.
  // Tout le contenu de l'histoire est rangé ici, comme des données : on peut changer un texte, un nombre, une position
  // sans toucher au code (logique/campagne.js fait jouer ces données ; affichage/campagne-*.js les montrent).
  // Unités : m, s. Positions [x, z] : les Bleus (nous) au SUD (z > 0), le Front au NORD (z < 0), le centre en (0, 0).
  // Un angle (rad) : la direction où l'on regarde (−π/2 ≈ −1,57 = vers le nord).
  campagne: {
    titre: "Les Lions de Valdrie",
    sousTitre: "Campagne · 6 chapitres",
    // Les deux camps (inventés).
    camps: { bleus: "l'Alliance de Valdrie", rouges: "le Front Écarlate" },
    // Les voix de la radio : nom, rôle, icône (le « portrait »), couleur, camp.
    personnages: {
      hargrave: { nom: "Colonel Hargrave", role: "QG Rempart · commandement", icone: "🎖️", couleur: "#ffb547", camp: "bleus" },
      volk: { nom: "Lieutenant Volk", role: "Lion 2 · cheffe d'escouade", icone: "🪖", couleur: "#9cc4ff", camp: "bleus" },
      dorn: { nom: "Sergent Dorn", role: "Marteau 1 · chef de char", icone: "🛡️", couleur: "#8fd3a0", camp: "bleus" },
      faucon: { nom: "Faucon 2-1", role: "pilote d'hélico", icone: "🚁", couleur: "#7fe0d0", camp: "bleus" },
      tonnerre: { nom: "Tonnerre", role: "chasseurs-bombardiers", icone: "✈️", couleur: "#c9d6ff", camp: "bleus" },
      moreau: { nom: "Sergent Moreau", role: "tireur d'élite", icone: "🔭", couleur: "#d6b8ff", camp: "bleus" },
      arnaud: { nom: "Mme Arnaud", role: "maire de Valcourt", icone: "🏛️", couleur: "#ffe08a", camp: "bleus" },
      varrok: { nom: "Maréchal Varrok", role: "radio ennemie interceptée", icone: "📡", couleur: "#ff6a5a", camp: "rouges" },
    },
    // Les mots du tableau de bord pour chaque sorte d'objectif.
    verbes: { atteindre: "ATTEINDRE", tenir: "DÉFENDRE", survivre: "TENIR BON", eliminer: "ÉLIMINER", chars: "DÉTRUIRE", detruire: "DÉTRUIRE", escorter: "ESCORTER" },
    regles: {
      intro: 11, // s : la durée du survol de la carte au début d'un chapitre (Espace ou un clic : passer)
      radio: { base: 2.6, parLettre: 0.05, max: 8.5, pause: 0.5 }, // s : une réplique dure base + parLettre × lettres (au plus max), puis une petite pause
      escorte: { attend: 95, repart: 70 }, // m : le camion escorté s'arrête si tu es à plus de 95 m, et repart sous 70 m
      frappe: { altitude: 85, vitesse: 95, bombes: 6, ecart: 0.08, loin: 950, decalage: 22 }, // la frappe aérienne : m, m/s, bombes par avion, s entre 2 bombes, m (où ils arrivent), m entre les 2 avions
      fin: 3, // s : le temps de voir la fin (explosion, dernier mot à la radio) avant l'écran de fin
      soldatsDebout: 50, // un renfort scripté n'arrive pas s'il y a déjà ce nombre de soldats debout dans ce camp
    },
    // ✍️ (demande 90) « La campagne est beaucoup trop compliquée : très facile, facile, normal, difficile, très difficile. »
    // LES 5 NIVEAUX DE DIFFICULTÉ (choisis sur la liste des chapitres, retenus dans la sauvegarde). Chaque nombre est un
    // MULTIPLICATEUR (× 1 = comme avant la demande 90, c'est le niveau « difficile ») :
    //   vieChar, vieSoldat : la vie de TON tank et de TON soldat · degats : les dégâts des ennemis sur ton camp ·
    //   precision : la chance qu'une balle ennemie touche · erreur : l'erreur de visée des chars ennemis (plus grand = ils
    //   ratent plus) · reaction : le temps que les ennemis mettent à réfléchir et à recharger (plus grand = plus lents) ·
    //   chars, soldats : le nombre de chars et de soldats ennemis (au départ, en renfort, et à éliminer) ·
    //   durees : les secondes à tenir ou à survivre · allies : le nombre de tes soldats alliés · degatsAllies : les dégâts
    //   de tes alliés sur le Front · etoiles : le temps permis pour l'étoile « rapide » ·
    //   soin : ta vie revient toute seule (fraction de ta vie par seconde) si personne ne t'a touché depuis « attente » s.
    difficulteDepart: "facile", // ✍️ le niveau d'un nouveau joueur
    difficultes: [
      { id: "tres-facile", nom: "Très facile", icone: "🧸", couleur: "#7fe08a", texte: "Pour découvrir l'histoire : tu es presque invincible.",
        vieChar: 3, vieSoldat: 3, degats: 0.35, precision: 0.45, erreur: 3, reaction: 2, chars: 0.5, soldats: 0.5, durees: 0.5, allies: 1.5, degatsAllies: 2, etoiles: 2, soin: 0.05, attente: 4 },
      { id: "facile", nom: "Facile", icone: "🙂", couleur: "#b8e070", texte: "Des ennemis moins nombreux et qui visent mal.",
        vieChar: 2, vieSoldat: 2, degats: 0.6, precision: 0.7, erreur: 2, reaction: 1.5, chars: 0.67, soldats: 0.7, durees: 0.7, allies: 1.25, degatsAllies: 1.5, etoiles: 1.5, soin: 0.02, attente: 6 },
      { id: "normal", nom: "Normal", icone: "🎖️", couleur: "#ffb547", texte: "Un vrai combat, mais juste.",
        vieChar: 1.4, vieSoldat: 1.4, degats: 0.8, precision: 0.85, erreur: 1.4, reaction: 1.2, chars: 0.85, soldats: 0.85, durees: 0.85, allies: 1, degatsAllies: 1.2, etoiles: 1.25, soin: 0, attente: 0 },
      { id: "difficile", nom: "Difficile", icone: "💀", couleur: "#ff7a45", texte: "La campagne d'origine (avant la demande 90).",
        vieChar: 1, vieSoldat: 1, degats: 1, precision: 1, erreur: 1, reaction: 1, chars: 1, soldats: 1, durees: 1, allies: 1, degatsAllies: 1, etoiles: 1, soin: 0, attente: 0 },
      { id: "tres-difficile", nom: "Très difficile", icone: "☠️", couleur: "#ff4a4a", texte: "Pour les vétérans : plus d'ennemis, qui tirent fort et juste.",
        vieChar: 0.75, vieSoldat: 0.75, degats: 1.3, precision: 1.2, erreur: 0.7, reaction: 0.8, chars: 1.34, soldats: 1.3, durees: 1.25, allies: 0.8, degatsAllies: 1, etoiles: 0.85, soin: 0, attente: 0 },
    ],
    // ✍️ LES 6 CHAPITRES. Pour chacun :
    //   carte (une des « cartes » plus haut), lieu, date, briefing (les paragraphes), conseil (la classe conseillée),
    //   vol (le survol du début : des points [x, hauteur au-dessus du sol, z, regardX, regardHauteur, regardZ]),
    //   forces (qui est où au départ), cibles (les cibles spéciales : DCA, char de commandement, camions…),
    //   objectifs (dans l'ordre ; chacun : type, texte, ses réglages, « debut » = ce qui arrive quand il commence
    //   (« apres » s plus tard), « fin » = les répliques quand il est accompli), radio (les répliques au début),
    //   etoiles (★ réussi · ★ en moins de « temps » s · ★ au moins « eliminations » ennemis mis hors de combat par toi).
    // Les sortes d'objectifs : atteindre (zone [x, z, rayon]) · tenir (zone, duree : rester dedans) · survivre (duree) ·
    //   eliminer (nombre de soldats ennemis, par toi et tes alliés) · chars (nombre de chars ennemis, ou tous: true) ·
    //   detruire (cibles: [ids] ou groupe) · escorter (cible, zone : elle doit arriver, sans être détruite).
    // Les cibles spéciales (« cibles ») : sorte "dca" (un canon antiaérien du Front), "char" (un char ennemi qui garde sa
    //   place), "camion" (un camion qui suit une « route » : celui qu'on escorte), "helico" (un hélico posé au sol).
    // Les événements (« debut ») : radio [qui, texte] · action: "tanks" (des chars arrivent « de » … « vers » …) ·
    //   "soldats" (une colonne de soldats) · "helico" (un hélico de transport dépose 10 soldats à la corde) · "frappe" (2 avions
    //   bombardent « sur » un point ou sur les chars ennemis) · "convoi" (des camions du Front suivent une « route ») ·
    //   "decollage" (un hélico posé décolle « vers » un point).
    chapitres: [
      {
        id: "oasis", numero: 1, titre: "Le réveil du lion", icone: "🌴", couleur: "#d9a45a",
        carte: "village-desert", lieu: "Oasis de Tamerin · province de Sahrane", date: "14 mars 2041 · 05 h 42",
        resume: "Reprends l'oasis et son relais radio, à pied avec ton escouade.",
        briefing: [
          "Il y a trois jours, toutes les radios de Valdrie se sont tues. Plus de radar, plus de satellites : un brouillard électronique recouvre le pays.",
          "Profitant du silence, le Front Écarlate du Maréchal Varrok a franchi la frontière. Cette nuit, ses soldats ont pris l'oasis de Tamerin et son relais radio, le dernier du désert.",
          "Ton escouade, les Lions, est la plus proche. Entre dans l'oasis, chasse le Front de la place du puits et tiens-la : sans ce relais, l'Alliance est sourde et aveugle.",
          "Ton char est garé juste derrière toi, au sud. Garde-le en tête : on ne sait jamais ce qui peut sortir des dunes.",
        ],
        conseil: { classe: "assaut", texte: "Combat de rue à pied : un fusil d'assaut et des grenades." },
        vol: [[0, 90, 520, 0, 0, 0], [180, 90, 260, 0, 0, 0], [140, 45, -40, 0, 2, 0], [-40, 22, -110, 0, 2, 0], [-60, 14, 40, 0, 3, 0]],
        forces: {
          toi: { mode: "pied", x: -6, z: 250, angle: -1.57, char: [16, 262] },
          alliesChars: [], ennemisChars: [],
          alliesSoldats: { nombre: 8, x: 0, z: 262, rayon: 14 },
          ennemisSoldats: [{ nombre: 6, x: 0, z: 0, rayon: 40 }, { nombre: 4, x: -40, z: 50, rayon: 25 }, { nombre: 4, x: 45, z: -45, rayon: 25 }],
          avions: false, paras: false, helicos: false, vehicules: false, lac: false,
        },
        cibles: [],
        radio: [
          ["hargrave", "Lion 1, ici Rempart. Le relais de Tamerin ne répond plus depuis 3 heures. Le Front est dans l'oasis."],
          ["volk", "Les Lions sont prêts. Reste près de moi, on entre par le sud."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Rejoins l'entrée sud de l'oasis", zone: [0, 128, 16],
            fin: [["volk", "On est à l'entrée. Je vois des sentinelles dans les ruelles !"]] },
          { type: "eliminer", texte: "Nettoie les ruelles : élimine les soldats du Front", nombre: 8,
            debut: [{ apres: 1, radio: ["volk", "Ils sont retranchés dans les maisons. Grenades dans les fenêtres, et avance de mur en mur !"] }],
            fin: [["volk", "Les ruelles sont à nous ! Direction le puits."]] },
          { type: "tenir", texte: "Tiens la place du puits pendant la réparation du relais", zone: [0, 0, 20], duree: 40,
            debut: [
              { apres: 0, radio: ["hargrave", "Bien joué, Lion. Notre technicien répare le relais. Tiens la place du puits !"] },
              { apres: 6, action: "helico", equipe: "rouges", de: [-500, -700], vers: [10, -80] },
              { apres: 7, radio: ["volk", "Hélico ennemi au nord ! Ils déposent des soldats à la corde !"] },
              { apres: 18, action: "soldats", equipe: "rouges", nombre: 6, de: [60, -260], vers: [0, -10] },
              { apres: 20, radio: ["volk", "Encore des fantassins, du nord-est. Restez à couvert !"] },
            ],
            fin: [["hargrave", "Le relais est réparé ! On vous entend fort et clair, Lions."]] },
          { type: "chars", texte: "Un char du Front arrive : détruis-le (ton char t'attend au sud, touche E)", nombre: 1,
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Scorpion"], de: [[0, -520]], vers: [0, -40] },
              { apres: 1, radio: ["volk", "Char ennemi ! Nos fusils ne lui font rien. Lion 1, file à ton char, au sud du village !"] },
              { apres: 14, radio: ["hargrave", "Un obus dans le flanc ou dans le dos, c'est là que le blindage est le plus fin."] },
            ],
            fin: [["volk", "Le Scorpion est en feu ! L'oasis est à nous."], ["hargrave", "Superbe travail, Lions. Grâce à vous, l'Alliance n'est plus sourde."]] },
        ],
        etoiles: { temps: 480, eliminations: 10 },
        reussite: "L'oasis de Tamerin est libérée. Le relais radio fonctionne de nouveau : pour la première fois depuis trois jours, l'Alliance entend ce que prépare le Front…",
      },
      {
        id: "route", numero: 2, titre: "La route de cendre", icone: "🏜️", couleur: "#e0b070",
        carte: "desert", lieu: "Désert de Sahrane · route du nord", date: "15 mars 2041 · 16 h 20",
        resume: "En char : intercepte le convoi et fais taire la batterie antiaérienne.",
        briefing: [
          "Le relais de Tamerin a capté un message du Front : un convoi de ravitaillement traverse le désert pour nourrir l'avant-garde de Varrok.",
          "Plus au nord, une batterie antiaérienne protège la route. Tant que ses canons tirent, nos avions Tonnerre ne peuvent pas t'aider.",
          "Prends ton char avec le peloton Marteau. Coupe la route du convoi, fais taire la batterie, et tiens bon : le Front ne laissera pas passer ça sans réagir.",
        ],
        conseil: { classe: "ingenieur", texte: "Mission en char : l'Ingénieur peut réparer ton tank s'il en sort." },
        vol: [[-900, 80, -60, -500, 0, -150], [-520, 70, 80, -300, 0, -160], [-200, 60, -300, -100, 0, -500], [-60, 30, -420, -100, 2, -510], [-250, 18, 260, -250, 3, 160]],
        forces: {
          toi: { mode: "char", x: -250, z: 290, angle: -1.57 },
          alliesChars: [[-280, 302, "Marteau 2"], [-220, 302, "Marteau 3"]],
          ennemisChars: [[-60, -470, "Cobra"], [-160, -470, "Vipère"]],
          alliesSoldats: { nombre: 6, x: -250, z: 320, rayon: 14 },
          ennemisSoldats: [{ nombre: 8, x: -100, z: -490, rayon: 30 }, { nombre: 4, x: 0, z: 0, rayon: 40 }],
          avions: false, paras: false, helicos: false, vehicules: false, lac: false,
        },
        cibles: [
          { id: "dca1", sorte: "dca", nom: "DCA « Épine » 1", x: -112, z: -495 },
          { id: "dca2", sorte: "dca", nom: "DCA « Épine » 2", x: -82, z: -515 },
          { id: "dca3", sorte: "dca", nom: "DCA « Épine » 3", x: -128, z: -528 },
        ],
        radio: [
          ["dorn", "Marteau en position. Lion 1, on te suit : tu ouvres la route."],
          ["hargrave", "Le convoi vient de l'ouest et file vers la ferme du nord-est. Ne le laisse pas passer."],
        ],
        objectifs: [
          { type: "detruire", texte: "Intercepte le convoi de ravitaillement", groupe: "convoi",
            debut: [
              { apres: 0, action: "convoi", groupe: "convoi", nom: "Camion du convoi", nombre: 3, route: [[-930, -110], [-620, -140], [-320, -170], [0, -230], [240, -330], [300, -600]] },
              { apres: 2, radio: ["dorn", "Je les vois ! Trois camions, plein ouest. Ils roulent vite !"] },
              { apres: 25, radio: ["hargrave", "Vise les camions, pas l'escorte : sans essence, l'avant-garde du Front s'arrête."] },
            ],
            fin: [["dorn", "Plus de convoi ! Ça, ça va leur faire mal."]] },
          { type: "detruire", texte: "Fais taire la batterie antiaérienne", cibles: ["dca1", "dca2", "dca3"],
            debut: [{ apres: 1, radio: ["hargrave", "La batterie Épine est au nord, sur la crête. Trois canons. Détruis-les pour que Tonnerre puisse voler."] }],
            fin: [["tonnerre", "Ici Tonnerre. Le ciel est dégagé, on arrive. Donnez-nous des cibles !"]] },
          { type: "survivre", texte: "Contre-attaque blindée : tiens bon jusqu'à la frappe aérienne", duree: 45,
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Hyène", "Chacal", "Mamba"], de: [[-260, -900], [-120, -930], [20, -900]], vers: "toi" },
              { apres: 1, radio: ["dorn", "Trois chars ennemis au nord ! Ils viennent pour nous !"] },
              { apres: 20, action: "frappe", sur: "tanks" },
              { apres: 20, radio: ["tonnerre", "Tonnerre en approche. Bombes larguées sur les blindés ! Gardez la tête baissée !"] },
            ],
            fin: [["hargrave", "La frappe a fait mouche. Finissez le travail, Marteau et Lion."]] },
          { type: "chars", texte: "Achève les chars ennemis encore debout", tous: true,
            fin: [["dorn", "Le dernier est à terre. La route du nord est coupée !"], ["varrok", "… Unités du désert, repliez-vous. Je répète, repliez-vous vers la vallée."]] },
        ],
        etoiles: { temps: 540, eliminations: 8 },
        reussite: "Le convoi ne livrera jamais son essence, et la batterie Épine s'est tue. Mais la radio du Front a parlé : Varrok rassemble ses chars dans la vallée de Morvane.",
      },
      {
        id: "enclume", numero: 3, titre: "L'enclume", icone: "🌄", couleur: "#8fb070",
        carte: "bataille", lieu: "Vallée de Morvane · le village du centre", date: "19 mars 2041 · 07 h 05",
        resume: "La grande bataille : brise la ligne de chars, prends le village, abats le Mammouth.",
        briefing: [
          "Le Front a rassemblé ses blindés dans la vallée de Morvane, sur la route de la capitale. Si la vallée tombe, plus rien ne l'arrête jusqu'à Valcourt.",
          "Toute la 7e Brigade est engagée : chars, hélicos, parachutistes, avions. Toi et le peloton Marteau, vous êtes la pointe de l'attaque.",
          "Brise leur ligne de chars, prends le village au centre de la vallée, et tiens-le pendant que nos renforts arrivent.",
          "On raconte que Varrok a envoyé son char de commandement, le Mammouth. S'il tombe, son armée perd la tête.",
        ],
        conseil: { classe: "ingenieur", texte: "Bataille de chars : l'Ingénieur répare ton tank et porte un lance-roquettes." },
        vol: [[-60, 70, 430, 0, 0, 0], [300, 80, 260, 0, 0, -100], [260, 70, -320, 0, 0, -120], [-120, 40, -170, 0, 5, 0], [0, 20, 380, 0, 4, 200]],
        forces: {
          toi: { mode: "char", x: 0, z: 400, angle: -1.57 },
          alliesChars: [[-40, 412, "Marteau 2"], [40, 412, "Marteau 3"], [-80, 425, "Marteau 4"]],
          ennemisChars: [[-90, -170, "Faucon noir"], [90, -170, "Loup"], [-210, -90, "Ours"], [210, -110, "Requin"]],
          alliesSoldats: { nombre: 12, x: 0, z: 440, rayon: 30 },
          ennemisSoldats: [{ nombre: 8, x: 0, z: -30, rayon: 55 }, { nombre: 6, x: 0, z: -230, rayon: 60 }],
          avions: true, paras: true, helicos: false, vehicules: true, lac: true,
        },
        cibles: [],
        radio: [
          ["hargrave", "À toutes les unités : l'opération Enclume commence. Que la vallée tremble."],
          ["dorn", "Marteau à Lion 1 : ligne de chars ennemis au nord du village. On fonce avec toi."],
        ],
        objectifs: [
          { type: "chars", texte: "Brise la ligne de chars du Front", nombre: 3,
            debut: [{ apres: 30, radio: ["dorn", "Bouge, Lion 1 ! Un char immobile, c'est une cible."] }],
            fin: [["dorn", "Leur ligne cède ! Au village, maintenant !"]] },
          { type: "atteindre", texte: "Prends le village au centre de la vallée", zone: [0, 0, 34],
            fin: [["volk", "Les Lions sont au village avec toi. On s'installe !"]] },
          { type: "tenir", texte: "Tiens le village pendant l'arrivée des renforts", zone: [0, 0, 45], duree: 50,
            debut: [
              { apres: 2, action: "helico", equipe: "bleus", de: [-300, 900], vers: [-20, 30] },
              { apres: 3, radio: ["faucon", "Faucon 2-1 en approche avec dix soldats. On les pose au village !"] },
              { apres: 12, action: "tanks", equipe: "rouges", noms: ["Taureau", "Bison"], de: [[-320, -720], [320, -720]], vers: [0, -20] },
              { apres: 13, radio: ["volk", "Deux chars du Front, nord-ouest et nord-est !"] },
              { apres: 22, action: "helico", equipe: "rouges", de: [600, -900], vers: [50, -70] },
              { apres: 30, action: "tanks", equipe: "bleus", noms: ["Marteau 5", "Marteau 6"], de: [[-40, 800], [40, 800]], vers: [0, 30] },
              { apres: 31, radio: ["hargrave", "Renforts blindés en route depuis le sud. Encore un effort, Lion !"] },
            ],
            fin: [["hargrave", "Le village est à nous. Mais regardez au nord-est…"]] },
          { type: "detruire", texte: "Détruis le Mammouth, le char de commandement de Varrok", cibles: ["mammouth"],
            debut: [
              { apres: 0, action: "tanks", equipe: "rouges", noms: ["Mammouth", "Garde 1"], de: [[300, -560], [330, -585]], vie: [10, 4], id: ["mammouth"] },
              { apres: 1, radio: ["varrok", "Ici le Maréchal Varrok. Vous avez gagné un village. Moi, je vais vous reprendre la vallée."] },
              { apres: 6, radio: ["hargrave", "C'est son char de commandement, près de la ferme du nord-est. Il est très blindé : vise bien, et ne reste pas en face de lui."] },
            ],
            fin: [["dorn", "LE MAMMOUTH EST EN FEU !"], ["varrok", "… Repliez-vous… Tout le monde, repliez-vous sur Valcourt !"]] },
        ],
        etoiles: { temps: 660, eliminations: 14 },
        reussite: "La vallée de Morvane est libre et le Mammouth n'est plus qu'une épave. Le Front recule vers Valcourt, la capitale… où des milliers d'habitants attendent de l'aide.",
      },
      {
        id: "valcourt", numero: 4, titre: "Les rues de Valcourt", icone: "🏙️", couleur: "#9aa7b8",
        carte: "ville", lieu: "Valcourt · quartier de la mairie", date: "2 avril 2041 · 13 h 30",
        resume: "Escorte le camion de vivres jusqu'à la mairie, à travers les rues.",
        briefing: [
          "La vallée est libre, mais Valcourt, la capitale, est encerclée depuis des semaines. Les habitants réfugiés à la mairie n'ont presque plus rien à manger.",
          "Un camion de vivres doit traverser les rues jusqu'à la mairie. Les rues sont pleines de soldats du Front, et deux chars attendent en embuscade.",
          "Ton char ouvre la route, le camion te suit. S'il est détruit, la mission est un échec : reste devant lui, mais pas trop loin.",
        ],
        conseil: { classe: "ingenieur", texte: "En ville : l'Ingénieur répare ton char et le camion." },
        vol: [[0, 80, 420, 0, 0, 0], [160, 70, 160, 0, 0, -30], [120, 30, -120, 0, 4, -38], [20, 14, -80, 0, 5, -38], [20, 12, 330, 0, 3, 270]],
        forces: {
          toi: { mode: "char", x: 0, z: 262, angle: -1.57 },
          alliesChars: [[-14, 330, "Marteau 2"]],
          ennemisChars: [],
          alliesSoldats: { nombre: 6, x: 0, z: 320, rayon: 12 },
          ennemisSoldats: [{ nombre: 6, x: 0, z: 100, rayon: 50 }, { nombre: 6, x: 0, z: -40, rayon: 50 }, { nombre: 4, x: -76, z: 0, rayon: 30 }],
          avions: false, paras: false, helicos: false, vehicules: false, lac: false,
        },
        cibles: [
          { id: "vivres", sorte: "camion", equipe: "bleus", nom: "Camion de vivres", x: 0, z: 300, angle: -1.57, vie: 8, route: [[0, 230], [0, 150], [0, 76], [0, 0], [0, -30]] },
          { id: "embuscade1", sorte: "char", nom: "Embuscade 1", x: 38, z: -76, angle: 1.57 },
          { id: "embuscade2", sorte: "char", nom: "Embuscade 2", x: -76, z: 38, angle: 0 },
        ],
        radio: [
          ["arnaud", "Ici Mme Arnaud, maire de Valcourt. Nous sommes trois cents à la mairie. Nous comptons sur vous."],
          ["hargrave", "Lion 1, le camion de vivres te suit. Ouvre la route vers le nord, rue par rue."],
        ],
        objectifs: [
          { type: "escorter", texte: "Escorte le camion de vivres jusqu'à la mairie", cible: "vivres", zone: [0, -30, 16],
            debut: [
              { apres: 8, radio: ["volk", "Fantassins dans les fenêtres ! Un lance-roquettes peut abîmer le camion !"] },
              { apres: 40, radio: ["hargrave", "Si le camion s'arrête, c'est qu'il t'attend : ne le laisse pas seul derrière."] },
            ],
            fin: [["arnaud", "Le camion est arrivé ! Merci… merci du fond du cœur."]] },
          { type: "detruire", texte: "Détruis les deux chars embusqués dans les rues", cibles: ["embuscade1", "embuscade2"],
            debut: [{ apres: 1, radio: ["dorn", "Deux chars du Front cachés entre les maisons. Le premier à l'est de la mairie, l'autre à l'ouest."] }],
            fin: [["dorn", "Plus de chars dans le quartier. Joli tir !"]] },
          { type: "eliminer", texte: "Nettoie les rues autour de la mairie", nombre: 10,
            debut: [{ apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [0, -300], vers: [0, -60] }],
            fin: [["volk", "Le quartier est sûr. Mais j'entends des moteurs au nord…"]] },
          { type: "tenir", texte: "Défends la mairie contre la dernière vague", zone: [0, -38, 24], duree: 40,
            debut: [
              { apres: 2, action: "helico", equipe: "rouges", de: [-700, -900], vers: [-30, -90] },
              { apres: 3, radio: ["varrok", "Valcourt est à moi. Reprenez cette mairie !"] },
              { apres: 15, action: "tanks", equipe: "rouges", noms: ["Sanglier"], de: [[0, -600]], vers: [0, -60] },
              { apres: 16, radio: ["dorn", "Un dernier char, droit au nord ! Il remonte la grande rue !"] },
            ],
            fin: [["arnaud", "Ils reculent ! Valcourt-Centre est libre !"], ["hargrave", "Bravo, Lion 1. Mais ce n'est pas fini : il reste les ruines de l'ouest."]] },
        ],
        etoiles: { temps: 600, eliminations: 12 },
        reussite: "Les vivres sont arrivés à la mairie et le centre de Valcourt est libre. Mais à l'ouest, dans les ruines, un de nos hélicos vient de lancer un appel au secours…",
      },
      {
        id: "fantome", numero: 5, titre: "La ville fantôme", icone: "🏚️", couleur: "#a09a90",
        carte: "ruines", lieu: "Valcourt-Ouest · les ruines", date: "3 avril 2041 · 06 h 10",
        resume: "À pied dans les ruines : sauve Faucon 2-1 et détruis trois canons antiaériens.",
        briefing: [
          "Cette nuit, l'hélico de Faucon 2-1 a dû se poser en urgence dans les ruines de Valcourt-Ouest. L'équipage va bien, mais trois canons antiaériens l'empêchent de redécoller.",
          "Les ruines sont trop étroites pour un char. Tu y vas à pied, avec un lance-roquettes : c'est la seule arme qui fera taire ces canons.",
          "Rejoins Faucon, détruis les trois canons, tiens jusqu'à l'arrivée des secours, puis rejoins la zone d'extraction.",
          "Le Sergent Moreau te couvre depuis les toits. Écoute bien la radio.",
        ],
        conseil: { classe: "ingenieur", texte: "Les canons antiaériens ne craignent que les roquettes et les explosifs." },
        vol: [[-260, 75, 330, -76, 0, 76], [-200, 50, 140, -76, 2, 76], [-60, 40, 40, 38, 2, -38], [40, 26, -60, 76, 2, -114], [-140, 14, 250, -114, 2, 160]],
        forces: {
          toi: { mode: "pied", x: -114, z: 232, angle: -1.57, char: null },
          alliesChars: [], ennemisChars: [],
          alliesSoldats: { nombre: 6, x: -114, z: 248, rayon: 10 },
          ennemisSoldats: [{ nombre: 5, x: -76, z: 20, rayon: 30 }, { nombre: 6, x: 40, z: -60, rayon: 50 }, { nombre: 5, x: -38, z: -140, rayon: 30 }],
          avions: false, paras: false, helicos: false, vehicules: false, lac: false,
        },
        cibles: [
          { id: "dcaA", sorte: "dca", nom: "Canon antiaérien A", x: 38, z: -38 },
          { id: "dcaB", sorte: "dca", nom: "Canon antiaérien B", x: 76, z: -114 },
          { id: "dcaC", sorte: "dca", nom: "Canon antiaérien C", x: -38, z: -152 },
          { id: "faucon", sorte: "helico", modele: "blackhawk", equipe: "bleus", nom: "Faucon 2-1", x: -70, z: 64, angle: 0.4 },
        ],
        radio: [
          ["faucon", "Ici Faucon 2-1… On est posés dans les ruines, près d'un carrefour. Ils nous tirent dessus !"],
          ["moreau", "Moreau en position sur les toits. Je te couvre, Lion 1. Avance."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Rejoins l'hélico de Faucon 2-1", zone: [-76, 76, 16],
            debut: [{ apres: 12, radio: ["moreau", "Sentinelles au carrefour devant toi. Reste à l'abri des murs."] }],
            fin: [["faucon", "Lion 1 ! Content de te voir. Ces trois canons nous empêchent de décoller."]] },
          { type: "detruire", texte: "Détruis les trois canons antiaériens (roquettes, explosifs)", cibles: ["dcaA", "dcaB", "dcaC"],
            debut: [
              { apres: 2, radio: ["moreau", "Je les marque sur ta carte. Un au carrefour est, un au sud-est, un au nord."] },
              { apres: 35, action: "soldats", equipe: "rouges", nombre: 6, de: [120, -260], vers: [40, -60] },
            ],
            fin: [["faucon", "Le ciel est libre ! Il faut encore réparer le rotor… tenez-les à distance !"]] },
          { type: "survivre", texte: "Tiens bon pendant la réparation de l'hélico", duree: 60,
            debut: [
              { apres: 0, action: "soldats", equipe: "rouges", nombre: 8, de: [0, -340], vers: [-76, 40] },
              { apres: 3, radio: ["moreau", "Une colonne arrive du nord. Beaucoup de monde !"] },
              { apres: 20, action: "tanks", equipe: "rouges", noms: ["Chacal"], de: [[100, -500]], vers: [-40, 0] },
              { apres: 22, radio: ["volk", "Un char ! Tes roquettes, Lion 1, vise le flanc !"] },
              { apres: 34, action: "frappe", sur: [0, -120] },
              { apres: 34, radio: ["tonnerre", "Tonnerre en approche : frappe sur la colonne du nord. Tête baissée !"] },
              { apres: 44, action: "helico", equipe: "bleus", de: [-900, 700], vers: [-100, 60] },
              { apres: 45, radio: ["hargrave", "Les secours arrivent du sud-ouest. Tiens encore quelques secondes !"] },
            ],
            fin: [["faucon", "Rotor réparé ! On décolle, et on passe au-dessus de la zone d'extraction pour te montrer le chemin."]] },
          { type: "atteindre", texte: "Rejoins la zone d'extraction, à l'ouest", zone: [-152, 0, 16],
            debut: [{ apres: 1, action: "decollage", cible: "faucon", vers: [-152, 6] }],
            fin: [["faucon", "Je te vois à la zone d'extraction, Lion 1. Un camion vient vous chercher. Direction la base !"], ["hargrave", "Mission accomplie, Lion. Et Faucon a vu quelque chose en volant… On en reparle au QG."]] },
        ],
        etoiles: { temps: 660, eliminations: 12 },
        reussite: "Faucon 2-1 et son équipage sont sains et saufs. En décollant, ils ont repéré d'où vient le brouillard électronique : de sous la ville, dans le métro…",
      },
      {
        id: "terminus", numero: 6, titre: "Terminus", icone: "🚇", couleur: "#c86a4a",
        carte: "souterrain", lieu: "Sous Valcourt · station Terminus", date: "4 avril 2041 · 03 h 15",
        resume: "Le final, à pied dans le métro : arrête le Brouilleur et le Maréchal Varrok.",
        briefing: [
          "Faucon a vu d'où venait le brouillard : le Brouilleur Orage est caché sous la ville, dans la station de métro Terminus. Le Maréchal Varrok s'y cache aussi.",
          "Pas de chars, pas d'hélicos : seulement toi, ton escouade et les tunnels. Les trams brûlent encore depuis la dernière attaque.",
          "Avance sur les quais, élimine sa garde, atteins le poste de commandement au bout ouest de la station, et tiens-le jusqu'à l'arrivée des renforts.",
          "Ce soir, on rallume les radios de Valdrie.",
        ],
        conseil: { classe: "assaut", texte: "Combat rapproché sous terre : fusil d'assaut, ou mitraillette du Médecin." },
        vol: [[96, 3, -6, 60, 2, 0], [70, 6, 10, 20, 2, 0], [30, 5, -12, -20, 2, 0], [-20, 6, 8, -70, 2, 0], [-60, 4, -8, -95, 2, 0]],
        forces: {
          renfortsRouges: 28, renfortsBleus: 30,
          avions: false, paras: false, helicos: false, vehicules: false, lac: false,
        },
        cibles: [],
        radio: [
          ["volk", "On est dans la station. Les néons clignotent… restez groupés."],
          ["hargrave", "Lion 1, le Brouilleur est au bout ouest. Varrok aussi. Bonne chance."],
        ],
        objectifs: [
          { type: "atteindre", texte: "Avance jusqu'aux escalators de l'est", zone: [29, 9, 9],
            fin: [["volk", "Escalators en vue ! Ils nous attendent sur les quais."]] },
          { type: "eliminer", texte: "Élimine la garde du Maréchal", nombre: 12,
            debut: [{ apres: 2, radio: ["varrok", "Vous êtes chez moi, ici. Aucun de vous ne verra le bout du quai."] }],
            fin: [["volk", "Leur garde est en miettes ! Fonce vers l'ouest !"]] },
          { type: "atteindre", texte: "Atteins le poste de commandement, au bout ouest", zone: [-62, 9, 11], renfortsRouges: 4,
            debut: [{ apres: 15, radio: ["hargrave", "Le poste est derrière les rames, au bout du quai. Garde la tête basse."] }],
            fin: [["volk", "On y est ! Le Brouilleur est là, une énorme machine… je le coupe !"]] },
          { type: "tenir", texte: "Tiens le poste pendant que Volk coupe le Brouilleur", zone: [-62, 9, 16], duree: 45, renfortsRouges: 8,
            debut: [
              { apres: 2, radio: ["varrok", "Non ! Gardes, à moi ! Défendez la machine !"] },
              { apres: 20, radio: ["volk", "Encore vingt secondes… les câbles sont épais !"] },
              { apres: 38, radio: ["hargrave", "Les radios se rallument au QG… Je vous entends ! Tenez bon !"] },
            ],
            fin: [["volk", "BROUILLEUR COUPÉ !"], ["varrok", "… C'est fini. Je me rends. Que mes soldats déposent les armes."], ["hargrave", "À toutes les unités de Valdrie : la guerre est finie. Rentrez à la maison, Lions."]] },
        ],
        etoiles: { temps: 540, eliminations: 15 },
        reussite: "Le Maréchal Varrok s'est rendu à 4 h 02. Privé de son brouilleur et de son chef, le Front Écarlate a déposé les armes dans la journée. Une à une, les radios de Valdrie se sont rallumées. La guerre est finie : les Lions rentrent à la maison.",
      },
    ],
  },
};

// ================================================================== demande 92 : ✍️ « LE RÉALISME TOTAL » (les soldats et le sol)
// (Rangé à part, dans « Tanks.CONFIG.realisme », pour ne pas se mélanger avec les tirs, les explosions et la lumière.)
// Les tableaux « parNiveau » ont 4 cases : une par niveau de qualité (0 = très léger … 3 = beau, voir « qualite »).
Tanks.CONFIG.realisme = Object.assign(Tanks.CONFIG.realisme || {}, {
  // ------------------------------------------------------------------ LES SOLDATS
  soldats: {
    // Les UNIFORMES : un camouflage par équipe (✍️ les Bleus en « woodland » des forêts, les Rouges en « désert »),
    // dessiné sur un tissu « ripstop » (un petit quadrillage tous les « ripstop » m), avec des plis, de l'usure et de la boue.
    //   motif : m couverts par l'image du tissu ; plis : la force des plis (0 = tout plat) ; boue : la hauteur (m) sous
    //   laquelle les jambes sont salies ; relief : la force du relief (la lumière accroche les plis et les sangles).
    uniformes: {
      bleus: { nom: "woodland", fond: "#78785a", taches: ["#55613d", "#5f4b33", "#2a2d22"], equipement: "#4c5438" },
      rouges: { nom: "désert", fond: "#c8b38a", taches: ["#a68962", "#8e8466", "#d8c8a2"], equipement: "#8c7752" },
      motif: 0.7, ripstop: 0.006, plis: 1, boue: 0.55, relief: 1.6,
    },
    // S'ACCROUPIR : (touche X pour toi ; les soldats de l'ordinateur s'accroupissent tout seuls quand ils tirent sur place)
    //   vitesse : × la vitesse quand on avance accroupi ; hauteur : m, là où les balles visent un soldat accroupi (debout :
    //   1,2 m) : derrière un muret, il est caché ! ; touche : × la chance d'être touché (il est plus petit)
    accroupi: { vitesse: 0.45, hauteur: 0.8, touche: 0.75 },
    // Les soldats de l'ordinateur ont maintenant un CHARGEUR : après « chargeur » balles, ils rechargent pendant « rechargement » s.
    ia: { chargeur: 20, rechargement: 2.6 },
    // LES GESTES (l'affichage) : en combien de temps on passe d'une position à l'autre (s : plus petit = plus vif) ;
    // le recul de l'arme à chaque tir (m vers l'arrière, rad vers le haut) ; la longueur d'une foulée (m, 2 pas).
    gestes: { souplesse: 0.18, reculArriere: 0.04, reculHaut: 0.07, foulee: 2.4, regardAutour: 0.35 },
    // (demande 93) LE VISAGE (affichage/engins3d.js, la tête sculptée) : grain : les nuances au hasard de la peau (0 = toute
    // d'une couleur) ; rougeur : les joues et le nez plus roses ; barbe : la force de la barbe de 3 jours (0 = rasé de près) ;
    // poils : combien de petits poils le tailleur sème dans la barbe (0 à 1) ; lunettes : une par soldat, à tour de rôle
    // ("casque" = relevées sur le casque, "soleil" = lunettes de soleil, "masque" = le masque de protection sur les yeux) ;
    // casque : sa hauteur (m au-dessus du cou) et sa pente (rad : posé un peu en arrière).
    visage: { grain: 0.07, rougeur: 0.1, barbe: 0.24, poils: 0.32, lunettes: ["casque", "soleil", "masque", "casque"], casque: { hauteur: 0.176, pente: 0.09 } },
  },
  // ------------------------------------------------------------------ LE SOL
  sol: {
    // Les détails du sol : une 2e image de détail, tournée et plus grande (« casse » m), pour qu'on ne voie pas la
    // répétition ; « pente » : à quel point les pentes sont plus sombres (0 = pas du tout).
    detail: { casse: 6.2, pente: 0.9 },
    // Les TRACES DE CHENILLES (et de pneus) : un morceau de trace tous les « pas » m, qui s'efface en « duree » s.
    //   largeur : m (tank, camion, quad, moto, 4x4) ; ecart : m entre les deux traces ; couleur et force (0 à 1).
    traces: { pas: 0.9, max: 4000, couleur: "#2e271d", force: 0.62,
      engins: { char: [0.62, null], camion: [0.38, 1.9], quad: [0.24, 1.1], moto: [0.13, 0], jeep: [0.32, 1.8] } },
    // Les CRATÈRES des explosions (au sol) : leur rayon en m selon ce qui explose ; ils restent (au plus « max »).
    crateres: { max: 220, rayons: { obus: 1.8, roquette: 1.5, grenade: 1.1, bombe: 4.2, missile: 3.2, torpille: 2.4, lg40: 1.2, at4: 1.6, javelin: 2.2, mine: 2.4, c4: 3.2 } },
    // Selon le niveau de qualité (0 … 3) :
    //   traces : morceaux de trace gardés (0 = pas de traces) ; tracesLoin : m, pas de nouvelles traces plus loin de la
    //   caméra ; tracesDuree : s avant qu'une trace soit effacée ; crateres : cratères gardés.
    parNiveau: {
      traces: [0, 900, 2000, 4000], tracesLoin: [0, 120, 200, 300], tracesDuree: [0, 70, 120, 200],
      crateres: [30, 70, 140, 220],
    },
    // (demande 93) L'HERBE plus dense et plus variée : case = m entre deux touffes (par niveau de qualité : plus petit =
    // plus dense) ; hauteur : × la hauteur d'une touffe (la plus petite, la plus grande) ; seche : la part de l'herbe
    // qui est sèche (paille), en grandes plaques (0 à 1).
    herbe: { case: [1.3, 1.1, 0.92, 0.8], hauteur: [0.75, 1.55], seche: 0.4 },
    // Les petits CAILLOUX semés autour de la caméra : rayon m (par niveau, 0 = pas de cailloux), case m, chance d'en avoir
    // un par case (× (1 + surTerre) sur la terre et les chemins), taille m (le plus petit, le plus gros).
    cailloux: { rayon: [0, 12, 18, 26], case: 0.85, chance: 0.14, surTerre: 2, taille: [0.025, 0.11] },
    // Les TACHES du sol : de grandes plaques plus sombres (humides) ou plus jaunes (sèches) : leur taille (m, 2 échelles
    // mélangées) et leur force (0 = pas de taches).
    taches: { echelle: [55, 170], force: 0.32 },
  },
});

// ================================================================== demande 92 : ✍️ « LE RÉALISME TOTAL » (les tirs, les explosions, la lumière)
// (Rangé à part lui aussi : « realisme.tirs », « realisme.explosions » et « realisme.lumiere ».)
// Les tableaux à 4 cases donnent un réglage par niveau de qualité (0 = très léger … 3 = beau, voir « qualite »).
// Les couleurs des petites images sont [rouge, vert, bleu] : 1 = normal ; plus que 1 = ça BRILLE (le feu, les traceuses).
Tanks.CONFIG.realisme = Object.assign(Tanks.CONFIG.realisme || {}, {
  // ------------------------------------------------------------------ LES TIRS ET LES BALLES (affichage/tirs.js)
  tirs: {
    // La fabrique de petites images (affichage/particules.js) : combien au plus en même temps (fumée, feu, étincelles,
    // traits), combien de cailloux en 3D, combien de VRAIES lumières (sur « lumieresPosees », toujours posées dans la scène :
    // en ajouter ou en enlever obligerait la carte graphique à tout recalculer).
    // (demande 96, « ça rame ») chaque vraie lumière posée coûte un calcul de plus pour CHAQUE point de l'écran, même
    // éteinte : 1 seule (prêtée à l'éclair le plus fort et le plus proche), et aucune au niveau 0 (elle est alors enlevée en
    // même temps que les ombres : la carte graphique ne refait ses programmes qu'une fois). Moins de petites images en bas.
    particules: [350, 700, 1300, 2000], debris3d: [8, 20, 50, 90], lumieres: [0, 1, 1, 1], lumieresPosees: 1,
    // La BALLE TRAÇANTE : 1 balle sur « chaque » brille (comme les vraies : une sur 4 ou 5). Elle vole à « vitesse » m/s
    // (une vraie va à 900 m/s : on la ralentit un peu pour qu'on la voie), c'est un trait de « longueur » m, large de
    // « largeur » m, orange (les deux camps : la même couleur), « force » fois plus lumineux qu'un objet blanc.
    traceur: { chaque: 4, vitesse: 420, longueur: 11, largeur: 0.08, couleur: [1, 0.36, 0.08], force: 3 },
    // Les AUTRES balles : un trait à peine visible (l'air chaud qui tremble), plus court.
    balle: { vitesse: 700, longueur: 3.5, largeur: 0.03, opacite: 0.16 },
    // L'ÉCLAIR au bout du canon (pour tous les tireurs) : taille (m), durée (s), vraie lumière (force, portée m) pour les
    // plus proches seulement, au plus une toutes les « intervalle » s ; pas d'éclair plus loin que « loin » m (par niveau).
    eclair: { taille: 0.55, duree: 0.06, lumiere: 4, portee: 7, intervalle: 0.06, loin: [45, 70, 110, 160] },
    // La petite FUMÉE au bout du canon : 1 tir sur « chance » ; elle vit « vie » s.
    fumee: { chance: 0.45, vie: 1.6, taille: 0.7 },
    // LE COUP DE CANON d'un tank : la boule de feu (m), la vraie lumière, l'anneau de POUSSIÈRE soulevé autour du tank
    // (nombre de bouffées, m de rayon, m/s), la fumée devant le canon.
    canon: { flash: 2, lumiere: 70, portee: 34, poussiere: 22, rayon: 4.5, souffle: 11, fumee: 9, secousse: 0.35 },
    // La TRAÎNÉE de fumée des roquettes et missiles : une bouffée tous les « pas » m, qui vit « vie » s ; l'obus de tank
    // a un petit traceur rouge au culot (« culot » : taille en m).
    trainee: { pas: 0.6, vie: 3.2, taille: [0.7, 2.8], culot: 0.5 },
    // Une balle qui passe PRÈS DE TOI : à moins de « distance » m on l'entend siffler, à moins de « crac » m elle claque
    // (elle va plus vite que le son). Le journal en parle au plus une fois toutes les « journal » s.
    frole: { distance: 6, crac: 2.5, journal: 4, tireurMin: 8 },
    // LES IMPACTS selon la MATIÈRE touchée : couleur de la poussière, des morceaux qui volent, combien.
    //   poussiere : couleur ; morceaux : couleur ; nombre : morceaux par balle ; saute : m/s vers le haut ; etincelles : 0 ou 1
    matieres: {
      terre: { poussiere: [0.42, 0.35, 0.26], morceaux: [0.2, 0.16, 0.11], nombre: 4, saute: 4 },
      sable: { poussiere: [0.86, 0.74, 0.55], morceaux: [0.8, 0.68, 0.48], nombre: 7, saute: 6 },
      pierre: { poussiere: [0.66, 0.64, 0.6], morceaux: [0.5, 0.48, 0.45], nombre: 4, saute: 3.5, etincelles: 1 },
      brique: { poussiere: [0.72, 0.52, 0.42], morceaux: [0.55, 0.3, 0.22], nombre: 4, saute: 3.5, etincelles: 1 },
      bois: { poussiere: [0.6, 0.48, 0.33], morceaux: [0.62, 0.45, 0.26], nombre: 4, saute: 3 },
      feuilles: { poussiere: [0.42, 0.5, 0.3], morceaux: [0.28, 0.42, 0.18], nombre: 5, saute: 2 },
      metal: { poussiere: [0.5, 0.48, 0.45], morceaux: [1.6, 1, 0.45], nombre: 6, saute: 4, etincelles: 1 },
      eau: { poussiere: [0.85, 0.9, 0.95], morceaux: [0.9, 0.95, 1], nombre: 8, saute: 5 },
      beton: { poussiere: [0.62, 0.62, 0.62], morceaux: [0.5, 0.5, 0.5], nombre: 4, saute: 3.5, etincelles: 1 },
    },
  },
  // ------------------------------------------------------------------ LES EXPLOSIONS (affichage/explosions.js)
  explosions: {
    // La TAILLE de chaque explosion (1 = un obus de tank) : tout grandit avec elle (le feu, la fumée, l'onde, les débris).
    tailles: { mine: 1.3, c4: 1.8, claymore: 0.55, obus: 1, roquette: 0.85, grenade: 0.6, flak: 0.35, missile: 1.5, bombe: 2.4, torpille: 1.6, char: 1.7, petit: 0.9, avion: 1.8, crash: 2.2 },
    // L'ÉCLAIR : il dure « duree » s ; la vraie lumière (force, portée m).
    eclair: { duree: 0.14, lumiere: 220, portee: 55 },
    // La BOULE DE FEU : « nombre » flammes, de « taille » m, qui vivent « vie » s et montent à « monte » m/s.
    boule: { nombre: 9, taille: 2.6, vie: 0.85, monte: 3 },
    // L'ONDE DE CHOC : un anneau de poussière qui court sur le sol jusqu'à « rayon » m en « duree » s.
    onde: { rayon: 13, duree: 0.5, opacite: 0.45, bouffees: 16 },
    // La COLONNE DE FUMÉE noire : « nombre » bouffées de « taille » m, pendant « emission » s ; elles vivent « vie » s,
    // montent à « monte » m/s et partent avec le VENT (m/s, vers x et z).
    fumee: { nombre: 16, taille: 6, emission: 2.4, vie: 10, monte: 2.6 }, // (demande 93 : elle sort plus longtemps : une vraie colonne)
    vent: [1.8, 0.7],
    // Les DÉBRIS : « nombre » cailloux en 3D (et des mottes en images) lancés à « vitesse » m/s ; les ÉTINCELLES.
    debris: { nombre: 10, vitesse: 15, taille: 0.22, mottes: 14 },
    etincelles: { nombre: 14, vitesse: 28 },
    // L'ÉCRAN QUI TREMBLE : « angle » rad au plus près, plus rien au-delà de « rayon » m × la taille ; il se calme en « calme » s.
    secousse: { angle: 0.04, rayon: 140, calme: 0.6 },
    // LE SON : il voyage à « vitesse » m/s (on voit l'explosion AVANT de l'entendre) ; de loin il est sourd (« sourd » Hz
    // à « loin » m : les aigus se perdent dans l'air).
    son: { vitesse: 340, sourd: 260, loin: 700, fort: 1 },
    // L'ÉPAVE QUI BRÛLE (un tank détruit) : le feu dure « feu » s, la fumée « fumee » s ; la lueur du feu (force, portée m).
    epave: { feu: 50, fumee: 110, lumiere: 22, portee: 16, flammes: 14, bouffees: 3 },
    // (demande 93) ✍️ « Fais un peu plus réaliste » : de VRAIES explosions, plus des boules blanches.
    //   coeur : le tout petit cœur blanc-jaune du début (taille m, vie s) ; le reste du feu CACHE ce qui est derrière
    //   (il n'est plus « ajouté » à l'image, qui devenait toute blanche) et finit en fumée noire ;
    //   fumeeFeu : les bouffées noires qui sortent DU feu (nombre, taille m, monte m/s) ;
    //   terre : la terre (brune) projetée en l'air (nombre, taille m, vitesse m/s) ;
    //   brume : les NAPPES de fumée qui traînent au ras du sol après les explosions et autour des épaves (nappes par
    //   explosion, une toutes les « epave » s près d'une épave, vie s, taille m, opacite) ; au plus « max » (par niveau).
    coeur: { taille: 2.2, vie: 0.09 },
    fumeeFeu: { nombre: 7, taille: 5, monte: 3.5 },
    terre: { nombre: 10, taille: 3.4, vitesse: 13 },
    brume: { parExplosion: 2, epave: 7, vie: 50, taille: 24, opacite: 0.22, max: [0, 6, 12, 20] },
  },
  // (demande 93) L'AIR DU CHAMP DE BATAILLE : la brume lointaine commence plus près (× « debut ») : les collines au loin
  // deviennent plus pâles, comme dans la vraie vie (l'air n'est jamais tout à fait transparent).
  atmosphere: { debut: 0.55 },
  // ------------------------------------------------------------------ LA LUMIÈRE ET LE CIEL (affichage/scene.js)
  // Une ambiance par décor. direction : vers le soleil [x, y, z] (y petit = soleil bas, plus chaud) ; couleur et force du
  // soleil ; ciel / sol : la lumière qui vient du ciel et celle renvoyée par le sol (« hémisphère ») ; ambiance : sa force ;
  // exposition : l'ouverture de l'appareil photo (ACES) ; zenith / horizon : les couleurs du ciel (en haut, au bord) ;
  // brume : la couleur du brouillard (= l'horizon, sinon les collines lointaines « flotteraient ») ; halo : la lueur
  // autour du soleil ; nuages : 0 = ciel pur, 1 = couvert ; fumees : des colonnes de fumée au loin (la guerre !).
  // filtre : le réglage du filtre de cinéma (affichage/ambiance.js) pour ce décor.
  lumiere: {
    bataille: { direction: [0.62, 0.42, 0.34], couleur: "#ffe0b4", force: 3.1, ciel: "#b7cdea", sol: "#6a6646", ambiance: 0.8, exposition: 0.95,
      zenith: "#3f6fb4", horizon: "#c9d3d8", brume: "#c4cdd0", halo: 0.55, nuages: 0.5, fumees: 2, filtre: { saturation: 0.8, contraste: 1.1 } },
    ville: { direction: [0.5, 0.55, 0.42], couleur: "#f0e6d8", force: 2.5, ciel: "#b4bcc6", sol: "#5c5a56", ambiance: 0.95, exposition: 1,
      zenith: "#6a7c92", horizon: "#b9bdc0", brume: "#b4b8ba", halo: 0.35, nuages: 0.82, fumees: 2, filtre: { saturation: 0.7, contraste: 1.12 } },
    ruines: { direction: [0.55, 0.36, 0.4], couleur: "#f2c890", force: 2.3, ciel: "#b0aaa0", sol: "#57524a", ambiance: 0.9, exposition: 1,
      zenith: "#5d6470", horizon: "#a89c8c", brume: "#a0968a", halo: 0.6, nuages: 0.9, fumees: 6, filtre: { saturation: 0.66, contraste: 1.15 } },
    desert: { direction: [0.3, 0.86, 0.26], couleur: "#fff3dc", force: 3.8, ciel: "#e6dcc4", sol: "#c49c66", ambiance: 0.85, exposition: 0.85,
      zenith: "#3c74c4", horizon: "#e2d6bc", brume: "#ddd0b4", halo: 0.7, nuages: 0.12, fumees: 1, filtre: { saturation: 0.86, contraste: 1.12 } },
    "village-desert": { direction: [0.3, 0.86, 0.26], couleur: "#fff3dc", force: 3.8, ciel: "#e6dcc4", sol: "#c49c66", ambiance: 0.85, exposition: 0.85,
      zenith: "#3c74c4", horizon: "#e2d6bc", brume: "#ddd0b4", halo: 0.7, nuages: 0.12, fumees: 2, filtre: { saturation: 0.86, contraste: 1.12 } },
  },
});

// ================================================================== demande 94 : ✍️ « LA RADIO QUI PARLE »
// Tes ordres écrits avec tes propres mots, les réponses de tes soldats à voix haute, et leurs discussions pendant la
// bataille. ✍️ Gratuit : la voix est celle que ton navigateur sait déjà lire (la « synthèse vocale »), pas de serveur.
// Les phrases sont des LISTES : à chaque fois, le jeu en tire une au hasard (jamais deux fois la même de suite).
// Dans les phrases, les mots entre accolades sont remplacés par la vraie situation : {distance} (en mètres), {dir}
// (« au nord-est »…), {nom}, {lieu}, {victime}, {cible}, {aide}, {delai}, {loin} (« Je suis à 230 mètres au sud. »).
Tanks.CONFIG.radio = {
  // ------------------------------------------------------------------ qui parle
  // Les INDICATIFS radio des soldats de ton camp (les tanks gardent leur nom : Bravo, Charlie, Delta). Les soldats
  // arrivés reçoivent ces noms, dans l'ordre ; le nom d'un soldat tombé est redonné à un nouveau (jamais deux vivants
  // avec le même nom). Tu peux les appeler : « Écho, soigne-moi ».
  indicatifs: ["Écho", "Fox", "Golf", "Hôtel", "India", "Juliette", "Kilo", "Lima", "Mike", "Novembre", "Oscar", "Papa", "Roméo", "Sierra", "Tango", "Victor", "Whisky", "Yankee", "Zoulou"],
  infirmiers: ["Écho", "Kilo", "Sierra"], // ⛑️ ils soignent (toi, quand tu le demandes, et les blessés autour d'eux)
  mecaniciens: ["Golf", "Mike", "Victor"], // 🔧 ils réparent (ton char, quand tu le demandes, et les chars abîmés tout près)
  nomEnnemi: "Radio ennemie", // (le nom affiché pour un soldat ennemi dont on intercepte la radio)
  // ------------------------------------------------------------------ obéir
  renforts: { tanks: 1, soldats: 4 }, // « à l'aide ! » à tout le monde : le char et les 4 soldats les plus proches viennent
  cloue: { recent: 3, delai: 5 }, // s : touché il y a moins de 3 s avec un ennemi en vue = « cloué au sol » ; il part 5 s plus tard
  soin: { parPoint: 0.6, autour: 10, parPointAllie: 2.5, portee: 2.5 }, // s par point de vie rendu (toi) ; m : soigne les blessés à moins de 10 m (1 point / 2,5 s) ; m : à moins de 2,5 m de toi
  reparation: { parPoint: 1.2, autour: 12, portee: 3 }, // s par point de blindage ; m autour d'un char ; m du bord de ton char
  // ------------------------------------------------------------------ bavarder (pas trop !)
  bavardage: {
    portee: 220, // m : on n'entend que les soldats à moins de 220 m de toi (sauf les nouvelles importantes)
    pause: 4, pauseUrgente: 2, // s entre deux phrases spontanées (2 s pour une phrase urgente)
    parQui: 9, // s : un même soldat ne reparle pas avant 9 s
    regarde: 0.25, // s : la radio regarde les soldats (recharge, renforts, char en vue) 4 fois par seconde
    charRevu: 45, // s : un char ennemi déjà annoncé n'est réannoncé qu'après 45 s
    charVu: 380, // m : un char ennemi à moins de 380 m de toi est « en vue »
    seul: 45, trop: 2, // m : autour d'un soldat ; « trop nombreux » = au moins 2 ennemis de plus que d'amis
    parGenre: { touche: 7, toucheChar: 8, aTerre: 6, recharge: 10, grenade: 5, charEnVue: 8, abattu: 7, charDetruit: 3, joliTir: 3, renforts: 14, soin: 8, soinFini: 2, repare: 8, repareFini: 2, allieDetruit: 2, vehiculeDetruit: 8, interceptee: 14 },
    chances: { touche: 0.85, abattu: 0.55, recharge: 0.45, grenade: 0.9, interceptee: 0.3 }, // 0 à 1 : la chance qu'il le dise
    importants: ["allieDetruit", "charEnVue", "charDetruit", "joliTir"], // entendus même de loin
    urgents: ["touche", "toucheChar", "aTerre", "grenade", "charEnVue", "renforts", "allieDetruit"],
    interceptePortee: 140, // m : la radio ennemie s'entend quand l'ennemi est à moins de 140 m de toi
  },
  // ------------------------------------------------------------------ la voix et les sous-titres (affichage/radio-voix.js)
  voix: {
    langue: "fr-FR",
    file: 5, // phrases au plus qui attendent leur tour (au-delà, on jette les moins importantes)
    perime: { reponse: 12, urgent: 6, bavardage: 4 }, // s : une phrase qui attend depuis plus longtemps est jetée (trop vieille)
    blanc: 0.35, // s de silence entre deux phrases
    avant: 0.22, // s entre le « clic-grésillement » et le début de la voix
    lettre: 0.062, minimum: 1.1, // s : durée d'une phrase sans voix (ou si la voix ne dit rien) = 1,1 s + 0,062 s par lettre
    restent: 3.2, // s : le sous-titre reste encore à l'écran après la fin de la phrase
    volume: 0.95,
    // Chaque soldat a SA voix : on la choisit d'après son nom (toujours la même pour lui). hauteur = « pitch » (0,5 grave
    // … 2 aigu), vitesse = « rate » (1 = normal).
    // ✍️ (étape 95 : « pas si robotiques ») tordre beaucoup la hauteur d'une voix la rend robotique (une voix d'humain
    // pousse à 0,6 ou 1,3 sonne comme un dessin animé). On ne la change plus que très peu : la VARIÉTÉ vient surtout
    // du choix de VOIX différentes (homme, femme, autres voix de l'ordinateur), et des meilleures voix d'abord.
    timbres: [
      { hauteur: 0.96, vitesse: 1.06 }, { hauteur: 1.0, vitesse: 1.1 }, { hauteur: 1.04, vitesse: 1.04 }, { hauteur: 0.93, vitesse: 1.12 },
      { hauteur: 1.02, vitesse: 1.15 }, { hauteur: 0.98, vitesse: 1.02 }, { hauteur: 1.06, vitesse: 1.08 }, { hauteur: 0.95, vitesse: 1.14 },
    ],
    interceptee: { hauteur: 0.88, vitesse: 1.0 }, // la radio ennemie : un peu plus grave
    // (étape 95) Les MEILLEURES voix d'abord : les voix « naturelles » (Microsoft Edge : « Online (Natural) »), puis
    // les voix « neuronales », « Premium », « Améliorée », celles de Google, puis les autres. Un mot trouvé dans le
    // nom de la voix donne des points ; on garde les « garder » meilleures voix pour les soldats.
    qualite: [["natural", 100], ["naturel", 100], ["neural", 90], ["online", 60], ["premium", 70], ["enhanced", 60], ["améliorée", 60], ["google", 40], ["siri", 50]],
    garder: 6,
    auMoins: 3, // (étape 96) au moins 3 voix différentes si l'ordinateur en a (même un peu moins belles)
    hasard: { hauteur: 0.04, vitesse: 0.06, urgent: 1.08 }, // (étape 96) ± 4 % de hauteur, ± 6 % de vitesse à chaque phrase ; × 1,08 si c'est urgent
    couleurs: { bleus: "#5aa8ff", rouges: "#ff5a4a", radio: "#ffd27a" },
  },
  // ------------------------------------------------------------------ les phrases
  // Les réponses à TES ordres.
  reponses: {
    attaque: ["À l'attaque !", "Bien reçu, on fonce !", "Compris, j'engage l'ennemi !", "On y va, chef !", "Affirmatif, on leur rentre dedans !"],
    suis: ["Je te suis ! {loin}", "Bien reçu, je reste derrière toi. {loin}", "Compris, je te colle aux basques. {loin}", "J'arrive, je te suis. {loin}"],
    couvre: ["Je te couvre ! {loin}", "Compris, je reste près de toi et je tire sur tout ce qui bouge. {loin}", "Bien reçu, je surveille tes arrières. {loin}", "Couverture en place, vas-y ! {loin}"],
    renforts: ["J'arrive en renfort ! {loin}", "Tiens bon, on arrive ! {loin}", "Renforts en route ! {loin}", "Bien reçu, je viens t'aider. {loin}"],
    reste: ["Bien reçu, je tiens la position.", "Je défends ici, personne ne passe !", "Compris, je ne bouge plus.", "Position tenue, chef !"],
    recule: ["Compris, on se replie !", "Repli vers le camp, bien reçu.", "On recule !", "Retraite, bien reçu !"],
    va: ["Bien reçu, en route pour {lieu}.", "Direction {lieu} !", "Compris, je vais à {lieu}.", "En route vers {lieu}, chef !"],
    tir: ["Feu à volonté, bien reçu !", "Compris, on ouvre le feu !"],
    cessez: ["Cessez-le-feu, bien reçu.", "Compris, on ne tire plus."],
    vise: ["Cible reçue : {cible} !", "Compris, je vise {cible}."],
    general: ["Bien reçu !", "À vos ordres !", "Affirmatif !", "Compris, chef !", "C'est parti !"],
    soigne: ["J'arrive avec ma trousse, tiens bon ! {loin}", "Médecin en route ! {loin}", "Bouge pas, j'arrive pour te soigner. {loin}"],
    soigneDansLeChar: ["Tu es dans ton char, je ne peux pas te soigner là-dedans ! Sors d'abord.", "Négatif, sors de ton char et je te soigne."],
    soignePasBesoin: ["Tu n'as rien, chef ! Pas une égratignure.", "Négatif, tu es en pleine forme !"],
    repare: ["Je prends ma caisse à outils, j'arrive ! {loin}", "Mécanicien en route pour ton char ! {loin}", "Bien reçu, je viens réparer ton blindage. {loin}"],
    reparePasBesoin: ["Ton char est en parfait état, chef.", "Négatif, rien à réparer sur ton char."],
    pasDeChar: ["Pas de char ici, chef !", "Négatif, ton char est hors de portée."],
    unChar: ["Négatif, je suis dans un char ! J'envoie {aide}.", "Je ne peux pas, je pilote un char. {aide} arrive !"],
    personne: ["Négatif, il n'y a plus personne pour ça…", "Désolé, chef, personne de disponible."],
    cloue: ["Négatif, je suis cloué au sol ! J'arrive dès que possible.", "Impossible pour l'instant, je suis sous le feu ! Donne-moi {delai} secondes.", "Je suis bloqué, ils me tirent dessus ! J'arrive dès que je peux."],
    blesse: ["Je suis touché, mais je tiens.", "Je suis blessé, fais vite.", "Je suis bien amoché."],
    position: ["Je suis à {distance} mètres {dir} de toi.", "Ma position : {distance} mètres {dir}.", "Je suis {dir}, à {distance} mètres de toi."],
    positionProche: ["Je suis juste à côté de toi, chef !", "Regarde autour de toi, je suis là !"],
    rapport: ["{chars}. {soldats}.", "Rapport : {chars}. {soldats}.", "Situation : {chars}. {soldats}."],
    merci: ["Merci, chef !", "Avec plaisir !", "On forme une sacrée équipe !", "C'est toi le meilleur, chef !", "À ton service !"],
    incompris: ["Je n'ai pas compris, tu peux répéter ?", "Négatif, message pas clair. Répète ?", "Euh… je n'ai rien compris, chef.", "Répète, la radio grésille !"],
    insulte: ["On reste poli à la radio, chef. Je n'ai pas compris l'ordre.", "Hé, on se calme ! Donne-moi un vrai ordre.", "Pas de gros mots sur la fréquence, chef !"],
    silence: ["{nom} ne répond plus…", "Pas de réponse de {nom}…"],
    personneObeit: ["Il n'y a plus personne pour obéir…"],
  },
  // Le rapport : comment on dit les ennemis.
  rapport: {
    chars: "{n} char{s} ennemi{s}, le plus proche {dir} à {distance} mètres",
    aucunChar: "Plus aucun char ennemi",
    soldats: "{n} soldat{s} ennemi{s}, surtout {dir}",
    soldatsProches: "dont {proches} à moins de 100 mètres",
    aucunSoldat: "aucun soldat ennemi en vue",
  },
  // Ce qu'ils disent tout seuls pendant la bataille.
  bavard: {
    touche: ["Je suis touché !", "Aïe ! Je suis touché !", "Je prends des balles !", "Touché ! Je suis touché !"],
    toucheChar: ["On est touchés !", "Impact sur le blindage !", "Ils nous allument !", "Coup au but sur nous !"],
    aTerre: ["Homme à terre !", "{victime} est tombé !", "On a perdu {victime} !", "Homme à terre, homme à terre !"],
    recharge: ["Je recharge, couvrez-moi !", "Rechargement !", "Chargeur vide !", "Je recharge !"],
    grenade: ["Grenade !", "Grenade lancée !", "Attention, grenade !", "Je lance une grenade !"],
    charEnVue: ["Char ennemi en vue, à {distance} mètres {dir} !", "Contact ! Un char {dir}, {distance} mètres !", "Attention, char ennemi {dir}, à {distance} mètres !"],
    abattu: ["Ennemi abattu !", "Je l'ai eu !", "Un de moins !", "Cible au tapis !"],
    charDetruit: ["Char ennemi détruit !", "{cible} est en flammes !", "On a eu {cible} !"],
    joliTir: ["Joli tir, chef !", "Bien joué, chef ! {cible} est détruit !", "En plein dans le mille !"],
    renforts: ["J'ai besoin de renforts !", "Ils sont trop nombreux, envoyez des renforts !", "Je suis seul ici, besoin d'aide !"],
    soin: ["Je te soigne, tiens bon !", "Bouge pas, je te soigne.", "Ça va aller, je m'occupe de toi."],
    soinFini: ["Voilà, tu es comme neuf !", "C'est bon, tu peux y retourner !"],
    repare: ["Je répare ton blindage !", "Je m'occupe du moteur, couvrez-moi !", "Réparation en cours !"],
    repareFini: ["Réparation terminée !", "Ton char est comme neuf !"],
    allieDetruit: ["On a perdu {victime} !", "{victime} est détruit !", "{victime} ne répond plus, il est en flammes !"],
    vehiculeDetruit: ["Véhicule détruit !", "On a perdu un véhicule !"],
  },
  // La radio ennemie interceptée (en français aussi, mais avec la voix grave du Front).
  interceptee: {
    touche: ["Je suis touché ! Où sont les secours ?", "Ils m'ont eu ! Je suis touché !"],
    aTerre: ["Homme à terre ! Ils nous massacrent !", "On a perdu un homme !"],
    grenade: ["Grenade ! À couvert !"],
    renforts: ["Il nous faut des renforts, vite !", "Repliez-vous, ils sont partout !"],
  },
  // Les mots de la boussole (0 = nord, puis dans le sens des aiguilles d'une montre). Le nord, c'est vers le camp ennemi.
  boussole: ["au nord", "au nord-est", "à l'est", "au sud-est", "au sud", "au sud-ouest", "à l'ouest", "au nord-ouest"],
  nombres: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"],
};
