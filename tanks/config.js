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
  version: 57,
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
    elite: { cadence: 2.4, precision: 0.72, portee: 360, degats: 2 }, // ✍️ (livre n° 12) le fusil de précision des tireurs d'élite de l'ordinateur
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
    helico: { nom: "Hélicoptère Tigre", icone: "🚁", vitesseMax: 45, acceleration: 9, virage: 1, montee: 9, hauteurMax: 150, munitions: 8, recharge: 5, arme: "bombe", vie: 3 }, // (demande 113 : 3 obus du camion antiaérien ennemi l'abattent)
    avion: { nom: "Avion de chasse Rafale", icone: "✈️", vitesse: 95, virage: 0.9, tangage: 0.8, hauteurMin: 25, hauteurMax: 400, munitions: 6, recharge: 2.5, arme: "missile", ejection: true, vie: 3 }, // (étape 64 : 3 missiles ennemis l'abattent)
    // (étape 64) La DCA (« défense contre les avions ») était un canon double anti-aérien posé sur un socle.
    // ✍️ (demande 113) « Le canon antiaérien, il est mauvais. Je ne connais pas ça. Je veux que tu fasses un camion. Toi,
    // tu pilotes le camion, et quelqu'un d'autre tire avec le canon antiaérien. » C'est maintenant LE CAMION ANTIAÉRIEN
    // (son nom de code reste « dca », pour la sauvegarde et la campagne) : un camion militaire 6 roues avec le canon
    // double sur son plateau. TOI, tu conduis (comme le camion de transport : mêmes réglages de roues) ; le TIREUR (un
    // soldat de ton camp, l'ordinateur) vise et tire tout seul. F : changer de siège (tu prends le canon : ← → tourner,
    // ↑ ↓ lever, Espace tirer ; le camion s'arrête). L'ennemi a le même camion, qui patrouille près de sa base.
    // Ses obus (le « flak ») explosent tout seuls près d'un avion. Unités : m, m/s, rad, rad/s, s.
    dca: { nom: "Camion antiaérien", icone: "🚚", modele: "6x6, canon double de 35 mm", longueur: 7.4, largeur: 2.5, hauteur: 3.6, rayon: 2.6,
      vitesseMax: 20, acceleration: 3.6, freinage: 8, ralentissement: 2, marcheArriere: 5, braquage: 0.55, empattement: 4.6, virage: 0.72,
      penche: 0.04, vie: 4, lourd: true, son: [30, 76],
      rotation: 1.2, levee: 0.8, cadence: 0.12, // le canon à la main : rad/s pour tourner, rad/s pour se lever, s entre 2 obus
      hausse: [0.05, 1.4], // rad : le canon se lève de 3° à 80°
      canon: { x: -1.7, y: 3.15 }, // m : la bouche des canons, sur le plateau (derrière le milieu du camion, en haut)
      retour: 45, // s : détruit, un camion tout neuf revient au parking de sa base
      // LE TIREUR (l'ordinateur) : il regarde le ciel « pense » fois par seconde, choisit l'avion ou l'hélico ennemi le plus
      // proche à moins de « portee » m, tourne le canon (« rotation », « levee » : moins vite qu'à la main, c'est lourd !),
      // vise DEVANT lui (là où il sera quand l'obus arrivera) ; quand le canon est à moins de « vise » rad de ce point, il
      // tire des RAFALES de « rafale » obus, puis attend « pause » s. « erreur » : il tremble un peu (rad), l'ennemi plus.
      // « vie » : les balles qu'il encaisse (il n'est protégé que par le petit bouclier) ; tombé, le canon se tait jusqu'à
      // ce que le camion revienne à sa base : un nouveau tireur monte au bout de « remplace » s.
      tireur: { indicatif: "Tireur DCA", vie: 4, pense: 0.25, portee: 950, hauteurMin: 8, rotation: 0.9, levee: 0.6, vise: 0.06, rafale: 8, pause: 1.3,
        erreur: { bleus: 0.012, rouges: 0.05 }, remplace: 12, parole: 4, // s entre 2 « Touché ! »
        phrases: {
          engage: ["{quoi} à {heures}, {distance} mètres, j'engage !", "Contact ciel ! {quoi} à {heures}. J'ouvre le feu !", "{quoi} en vue, {heures} ! Je le prends !"],
          touche: ["Touché !", "Je le touche !", "Coup au but, il fume !"],
          abattu: ["{quoi} abattu ! Il tombe !", "Cible détruite, il s'écrase ! Ciel dégagé.", "Je l'ai eu ! {quoi} au tapis !"],
          blesse: ["Je suis touché ! Je tiens le canon…", "Aïe ! On nous tire dessus, sur le plateau !"],
          tombe: ["Tireur à terre ! Le canon ne tire plus !"],
          nouveau: ["Nouveau tireur au canon. Prêt !"],
        },
      },
      // L'ENNEMI : son camion patrouille entre ces points [x, z] (écrits pour les Bleus ; chez les Rouges, z change de
      // signe), et s'arrête pour tirer quand son tireur a une cible.
      patrouille: [[160, 470], [-120, 430], [-330, 520], [-40, 560]],
    },
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
      penche: 0.04, vie: 3, places: 6, son: [32, 80], lourd: true }, // (lourd : il écrase les arbres en roulant vite)
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
  // ------------------------------------------------------------------ demande 99 : LA BASE AÉRIENNE de chaque camp
  // ✍️ « À part dans le souterrain, une base aérienne avec une piste, des hangars et des zones pour faire décoller les
  // avions de chasse, les hélicoptères et les tanks. Range les tanks, les 4x4, les motos, les camions, les hélicos. »
  // ✍️ « Tu pourras détruire leurs pistes pour empêcher les avions de chasse et les avions de transport de décoller. »
  // Toutes les places sont écrites pour les BLEUS : [x, dz] où dz = les mètres DERRIÈRE la ligne de départ des tanks
  // (vers le bord de la carte). Pour les Rouges, c'est le même plan vu dans un miroir (z changé de signe) : la piste est
  // aussi à l'ouest. Unités : m, s.
  baseAerienne: {
    nom: { bleus: "la base aérienne bleue", rouges: "la base aérienne rouge" },
    // le terrain est mis bien à plat sur toute la base (x de … à …, dz de … à …), avec une pente douce de « bord » m autour ;
    // ni arbre, ni haie, ni grange à moins de « vide » m de la base
    zone: { x: [-505, 195], dz: [-30, 235], bord: 70, vide: 20 },
    // LA PISTE : en béton, de x0 à x1, centrée sur dz, large de « largeur » ; découpée en « troncons » tronçons égaux
    piste: { x: [-480, -40], dz: 150, largeur: 30, troncons: 8, balises: 22 }, // (balises : m entre deux lampes du bord)
    // les DALLES de béton : [x0, x1, dz0, dz1, nom]
    dalles: [
      [-430, -140, 165, 200, "le tarmac des hangars"],
      [-62, -40, 40, 135, "la bretelle (de la piste aux hélicos)"],
      [-252, -24, 30, 62, "l'aire des hélicoptères"],
      [-46, 46, -20, 20, "la zone de départ des tanks"],
      [56, 176, 18, 70, "le parking des véhicules"],
      [130, 170, -16, 16, "la plateforme de la DCA"],
    ],
    // LES HANGARS : [x, dz] du centre ; ouverts du côté de la piste ; largeur (le long de x) × profondeur × hauteur
    hangars: { places: [[-180, 216], [-250, 216], [-320, 216]], largeur: 34, profondeur: 28, hauteur: 11, mur: 0.6 },
    // les avions de chasse rangés dans les hangars (le décor) et l'avion de transport garé sur le tarmac : [x, dz]
    rangesHangars: [[-250, 214], [-320, 214]],
    transportGare: [-395, 184],
    // LES AIRES « H » pour les hélicos (de « aire » m de côté) ; et les places de chacun : [x, dz, angle] (angle : 0 = vers
    // l'ennemi). Les « ia… » sont ceux de l'ordinateur. Le Rafale attend au BOUT EST de la piste, le nez vers l'ouest.
    aire: 24, petiteAire: 10,
    aires: [[-70, 46], [-110, 46], [-150, 46], [-190, 46], [-230, 46]],
    places: {
      helico: [-70, 46], blackhawk: [-110, 46], chinook: [-150, 46], iaBlackhawk: [-190, 46], iaChinook: [-230, 46], drone: [-38, 46],
      avion: [-60, 150, "ouest"],
      jeep: [66, 32], moto: [78, 32], quad: [88, 32], camion: [104, 32], dca: [126, 32], // (demande 113 : le camion antiaérien au parking)
    },
    // le parking de l'ordinateur (2e rangée) : la place n° k (moto 1, moto 2, quad 1, quad 2, camion 1) = [x0 + k × pas, dz]
    parkingIA: { x0: 66, pas: 12, dz: 58 },
    // ✍️ LES PISTES QU'ON DÉTRUIT. Une explosion à moins de « hauteur » m au-dessus de la piste abîme son tronçon :
    // degats = [points, rayon du cratère en m] selon ce qui explose. Un tronçon qui a « seuil » points est TROUÉ ;
    // « fermeture » tronçons troués → la piste est FERMÉE (aucun avion de chasse ni de transport de ce camp ne décolle).
    // L'ennemi rebouche UN cratère toutes les « ennemi » s ; toi, l'ingénieur rebouche un cratère de TA piste en tenant
    // Espace avec l'outil de réparation pendant « outil » s (à moins de « distance » m du bord du cratère).
    // Au plus « parTroncon » cratères dessinés par tronçon (au-delà, le plus petit grandit).
    destruction: {
      hauteur: 4, seuil: 2, fermeture: 3, parTroncon: 6,
      degats: { bombe: [2, 4.5], missile: [2, 3.6], c4: [2, 4], javelin: [1.5, 3], obus: [1, 2.6], roquette: [1, 2.2], at4: [1, 2.2],
        mine: [1, 2.4], lg40: [0.5, 1.4], grenade: [0.5, 1.4] }, // (la claymore souffle vers l'avant, la torpille reste dans l'eau : rien)
      reparation: { ennemi: 14, outil: 4, distance: 5 },
      messageFermee: 3, // s entre deux messages « piste fermée » quand tu essaies de décoller
    },
    // ✍️ LE DÉCOLLAGE des chasseurs ennemis : ils roulent sur leur piste (accélération en m/s²), quittent le sol à
    // « envol » × leur vitesse, puis montent (au plus « pente » rad).
    decollage: { acceleration: 16, envol: 0.62, pente: 0.22 },
  },
  // ✍️ Les PARACHUTISTES : pour CHAQUE équipe, un avion de transport passe toutes les 60 s et lâche 6 soldats au-dessus
  // de la zone de combat de son camp. L'avion de transport ennemi peut être abattu (avant le largage : pas de renforts !).
  parachutistes: {
    nombre: 6, toutesLes: 60, premier: 25, // s
    altitude: 110, descente: 5.5, // m, m/s (toi : 4 m/s)
    largage: { bleus: [0, 330], rouges: [0, -330] }, // (étape 71 : 3 fois plus loin du village) // [x, z] : au-dessus de quoi on saute
    maxParEquipe: 60, // ✍️ (étape 74 : 60 au lieu de 30) pas plus de 60 soldats debout par équipe : sinon le jeu ralentit
    // (livre n° 21, contre le lag) et pas plus de « maxEnJeu » soldats debout EN TOUT (les deux camps) : les soldats de
    // l'ordinateur réfléchissent plus (abris, contournements, secours) ; un soldat relevé compte comme un renfort
    maxEnJeu: 74,
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
      village: [0, 0], lac: [395, 30], camp: [0, 645], base: [0, 645], aerodrome: [-150, 700], // (demande 99 : l'aire des hélicos de la base aérienne)
      ennemi: [0, -630], ennemis: [0, -630],
      nord: [0, -450], sud: [0, 450], est: [330, 0], ouest: [-500, 0], centre: [0, 0], dca: [150, 625], hameau: [-560, 200], ferme: [300, -590],
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

  camera: { distance: 15, hauteur: 6.5, regardDevant: 22, souplesse: 6, champ: 60,
    // ✍️ (livre de demandes n° 13) « Améliorer la vue et le viseur. » À PIED, la caméra se met PAR-DESSUS TON ÉPAULE
    // (comme dans les jeux de tir à la 3e personne) : un peu à droite de ta tête (« cote » m), assez près (« distance » et
    // « hauteur » : × 15 m et × 6,5 m, comme les autres caméras). En visant (V ou clic droit), elle se rapproche encore de
    // l'épaule (« visee… ») et le champ de vision se resserre (le zoom de ton viseur). Y : changer d'épaule (gauche ↔ droite).
    // lisse : s pour glisser d'une place à l'autre (l'épaule, le zoom, le champ de vision : jamais de saut).
    epaule: { distance: 0.2, hauteur: 0.26, cote: 0.85, devant: 0.6, regardY: 1.55,
      viseeDistance: 0.13, viseeHauteur: 0.235, viseeCote: 0.62, viseeRegardY: 1.5, lisse: 0.14, lisseChamp: 0.12 } },
  // ✍️ (livre n° 13) LE VISEUR DYNAMIQUE (la croix au centre de l'écran) : ses 4 branches s'écartent selon la VRAIE
  // dispersion de ton arme (logique/armes.js : à la hanche, en bougeant, après chaque tir) et se resserrent quand tu vises.
  //   ecart : [px au moins, px au plus] entre le centre et les branches ; branche : px ; lisse : s pour suivre la dispersion.
  // Les MARQUEURS DE TOUCHE : une petite croix blanche quand ta balle touche, ROUGE quand l'ennemi tombe (« duree » s ;
  // « taille » px). Les FLÈCHES DE DÉGÂTS : un arc rouge autour du centre, du côté d'où vient le coup (« duree » s, « rayon » px).
  viseur: { ecart: [4, 70], branche: 9, lisse: 0.06, couleur: "rgba(255,255,255,.92)",
    marqueur: { duree: 0.28, taille: 11, rouge: 0.55 }, degats: { duree: 1.8, rayon: 118, largeur: 0.42 } },
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
        // (demande 99 : les 2 chemins vers les anciens aérodromes sont enlevés : la base aérienne a ses routes en béton)
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
  // ✍️ (livre de demandes n° 8) « Pouvoir entrer dans les maisons. » Chaque MAISON (pas les granges ni les tours) a un
  // INTÉRIEUR (logique/interieurs.js) : un plancher, une cloison avec un passage (2 pièces si la maison est assez longue),
  // et si la maison a 2 rangées de fenêtres, un ÉTAGE avec un ESCALIER (une pente : ta hauteur suit la marche).
  //   porte : la porte d'entrée (« largeur » m de passage) s'OUVRE toute seule quand un soldat à pied arrive à moins de
  //     « ouvre » m (elle met 1 ÷ « vitesse » s à s'ouvrir), et se referme « attente » s après que plus personne n'est là.
  //     Un tank ou un engin ne passe jamais (la porte fait 1,2 m, un tank 3,5 m !).
  //   marche : on monte sur ce qui est moins haut que « marche » m au-dessus de tes pieds (une marche, la pente de
  //     l'escalier) ; plus haut, c'est un obstacle. « chute » m/s : quand le sol est plus bas (un trou, l'escalier vu
  //     d'en haut, une fenêtre de l'étage), tu descends à cette vitesse au lieu de te téléporter.
  //   escalier : « pente » m de montée par mètre (0,68 ≈ 34°), « largeur » m ; plancher : « epaisseur » m ;
  //   cloison : épaisseur, « passage » m de large ; elle n'existe que s'il reste « salleMin » m pour la 2e pièce.
  //   meubles : [largeur, profondeur, hauteur] en m. Les petits (chaises, tapis, lampes) ne gênent pas ; les gros, si.
  //   sombre : la lumière dans la maison (× la couleur des meubles, du sol, des murs du dedans : on n'ajoute AUCUNE vraie
  //     lampe, ça coûterait trop cher) ; lampe : la petite lumière peinte de l'abat-jour.
  //   ia : un soldat de l'ordinateur TOUCHÉ (depuis moins de « touche » s) qui voit une porte à moins de « distance » m
  //     court SE METTRE À L'ABRI derrière une fenêtre de la maison (« chance » des fois où il réfléchit), et y reste
  //     « duree » s. Un soldat qui n'a rien à faire dedans ressort par la porte (il ne reste pas coincé).
  //   camera : dedans, la caméra se rapproche de ton épaule (au lieu de 5 m derrière toi, « distance » × 15 m), en
  //     « lisse » s, pour ne pas rentrer dans les murs ni le plafond.
  //   ecrase : quand la maison s'effondre, les soldats dedans sont blessés (structures.ecrasesSousLeToit) ET poussés
  //     dehors, à « ecrase » m devant le mur le plus proche.
  interieurs: {
    porte: { largeur: 1.2, ouvre: 2.6, vitesse: 3, attente: 1.6 },
    marche: 0.7, chute: 7,
    escalier: { pente: 0.68, largeur: 1.05 },
    plancher: { epaisseur: 0.18 },
    cloison: { epaisseur: 0.12, passage: 1.1, salleMin: 2.6 },
    meubles: { table: [1.4, 0.85, 0.76], chaise: [0.45, 0.45, 0.95], etagere: [1.1, 0.36, 1.85], canape: [1.9, 0.85, 0.85], lampe: [0.34, 0.34, 1.6], tapis: [2.2, 1.5, 0.02],
      buffet: [1.6, 0.6, 0.92], armoire: [1.2, 0.6, 2.0], frigo: [0.7, 0.68, 1.85], lit: [1.5, 2.05, 0.55], chevet: [0.45, 0.4, 0.55], bureau: [1.2, 0.6, 0.76] },
    sombre: 0.62, lampe: 0xffd9a0,
    ia: { distance: 14, touche: 1.5, chance: 0.5, duree: 14 },
    camera: { distance: 0.17, hauteur: 0.27, cote: 0.55, regardY: 1.5, devant: 0.5, lisse: 0.35 },
    ecrase: 1.2,
    // un soldat de l'ordinateur qui veut avancer mais a bougé de moins de « distance » m en « bloque » s fait un pas de
    // côté pendant « decale » s (une fois à gauche, une fois à droite) : il ne reste pas coincé contre un meuble, un mur…
    // et s'il n'arrive pas à sortir par la porte en « abandon » s, il l'oublie pendant « oubli » s (il sort par un trou).
    debloquer: { distance: 0.4, bloque: 1.5, decale: 1.0, abandon: 12, oubli: 25 },
  },
  // ✍️ (livre de demandes n° 12) « Faire des points en hauteur pour les snipers. » Des PERCHOIRS sur les cartes du
  // dehors (jamais dans le souterrain), inventés par logique/perchoirs.js (toujours pareil, grâce à la graine) et dessinés
  // par affichage/perchoirs3d.js :
  //   sortes : MIRADOR (une tour de guet en bois), CHÂTEAU D'EAU (en béton, très haut), ÉCHAFAUDAGE (contre la façade d'un
  //     immeuble, jusqu'au toit) et NID sur une COLLINE (des sacs de sable sur une bosse du terrain, sans échelle).
  //     hauteur : m de la plateforme au-dessus du sol ; demi : la moitié de la largeur de la plateforme (m) ; pied : la
  //     moitié de la largeur du pied (m : la partie solide au sol, on ne passe pas au travers) ; vie : points (un obus de
  //     tank enlève « degats.obus » points) ; sacs : true = un muret de SACS DE SABLE tout autour de la plateforme.
  //   parCarte : combien de chaque sorte, selon la carte du jour (« bataille » pour la grande campagne).
  //   placement : à plus de « loinMaisons » m des maisons, à moins de « front » m du milieu (entre les 2 camps), à plus de
  //     « ecart » m l'un de l'autre ; un sol pas trop en pente (« pente » m de différence sous le pied, au plus) ;
  //     colline : une bosse au moins « bosse » m plus haute que le sol à « anneau » m autour d'elle.
  //   echelle : on commence à grimper à moins de « distance » m du pied de l'échelle (↑ en avançant dedans, ou E) ;
  //     « vitesse » m/s en montant ou en descendant ; en haut, E près de l'échelle (à moins de « haut » m) pour redescendre.
  //   vue : la HAUTEUR fait voir plus loin : + « parMetre » m de vue par mètre au-dessus du sol d'alentour, au plus « max » m.
  //   couvert : accroupi (X) derrière les sacs de sable, une balle tirée d'EN BAS a « touche » × moins de chances de te toucher.
  //   degats : points enlevés à un perchoir par une explosion (au centre ; rien au bord de « rayon » m) ; « choc » : un tank
  //     plus rapide que « ecrase » m/s qui fonce dans le pied enlève ces points. À 0 : le perchoir S'EFFONDRE (il bascule et
  //     tombe, sans blessé grave : ceux qui étaient dessus perdent « chute » points de vie et se retrouvent au sol).
  //   ia : les TIREURS D'ÉLITE de l'ordinateur (« parEquipe » par camp, les n° de « numeros ») ont un fusil de précision
  //     (armes.elite). Ils cherchent un perchoir LIBRE à moins de « cherche » m, y montent, s'accroupissent et tirent de là ;
  //     ils voient à « vue » m (+ la hauteur). Un ennemi à moins de « defense » m : ils se défendent d'abord.
  //   reflet : le REFLET de leur lunette (un petit éclair) se voit de « min » à « max » m, environ « parSeconde » fois par s.
  //   carte : la couleur des perchoirs sur la petite carte (un petit triangle).
  perchoirs: {
    sortes: {
      mirador: { nom: "mirador", pluriel: "miradors", icone: "🗼", hauteur: 7, demi: 1.7, pied: 1.5, vie: 3, sacs: true },
      chateau: { nom: "château d'eau", pluriel: "châteaux d'eau", icone: "🏛️", hauteur: 13, demi: 2.9, pied: 1.6, vie: 6, sacs: true },
      echafaudage: { nom: "échafaudage", pluriel: "échafaudages", icone: "🏗️", hauteur: 0, demi: 1.0, long: 2.6, pied: 1.0, vie: 2, sacs: true }, // (hauteur : celle de l'immeuble)
      colline: { nom: "nid de tireur", pluriel: "nids de tireur", icone: "⛰️", hauteur: 0, demi: 2.3, pied: 0, vie: 0, sacs: true }, // (vie 0 : on ne détruit pas une colline !)
    },
    parCarte: {
      bataille: { mirador: 7, chateau: 2, colline: 5 },
      ville: { echafaudage: 6, chateau: 2, mirador: 2, colline: 1 },
      ruines: { echafaudage: 3, chateau: 1, mirador: 3, colline: 2 },
      desert: { mirador: 5, chateau: 1, colline: 6 },
      "village-desert": { mirador: 4, chateau: 1, colline: 4, echafaudage: 2 },
    },
    graine: 4242,
    placement: { loinMaisons: 16, front: 460, ecart: 70, pente: 1.6, bosse: 3, anneau: 70, campX: 240, campZ: 130 },
    echelle: { distance: 1.5, distanceIA: 3.5, vitesse: 1.9, haut: 1.4 }, // (distanceIA : un soldat de l'ordinateur attrape l'échelle d'un peu plus loin)
    vue: { parMetre: 7, max: 170 },
    couvert: { touche: 0.35 },
    degats: { obus: 1.5, roquette: 1, at4: 1.2, javelin: 2, bombe: 6, missile: 3, grenade: 0.3, lg40: 0.5, mine: 2, c4: 4, claymore: 0.2, rayon: 5, choc: 1, ecrase: 6 },
    chute: 1,
    ia: { parEquipe: 2, numeros: [4, 9], cherche: 420, vue: 230, defense: 45 },
    reflet: { min: 40, max: 700, parSeconde: 0.8, taille: 0.55 },
    carte: { couleur: "#ffd27a" },
  },
  // ✍️ (livre de demandes n° 9 et 11) « Faire une map en ville très réaliste. » « Faire comme si la map avait été
  // abandonnée rapidement : laisser les affiches, les publicités, les véhicules et parfois même des objets du quotidien
  // (téléphone, table, sac à dos). » Seulement sur les cartes qui ont « ville » dans leur variante (la ville, la ville en
  // ruines). Tout est inventé par logique/ville.js (toujours pareil, grâce à la graine) et dessiné par affichage/ville3d.js.
  //   rue : la chaussée fait « chaussee » m de large (2 voies) ; le reste de la rue est le TROTTOIR (« bordure » m de haut).
  //   tous les « lampadaire » m un lampadaire (de chaque côté, en quinconce), tous les « arbre » m un arbre dans son bac ;
  //   « voiture » : en moyenne une voiture tous les N m de trottoir (garée, ou abandonnée de travers au milieu) ;
  //   parts (de 0 à 1) : portes ouvertes, voitures brûlées, accidentées (encastrées de travers), abandonnées au milieu ;
  //   immeubles : part des maisons de la ville qui deviennent des IMMEUBLES de 4 ou 5 étages (« etages ») ;
  //   boutiques : part des façades sur rue qui ont une BOUTIQUE (store, enseigne) ; balcons, clims, affiches : pareil ;
  //   vitresCassees : part des fenêtres déjà cassées au début (à moitié abîmées : les vitres sont tombées) ;
  //   objets : combien d'objets du quotidien par îlot ; papiers : combien de papiers par îlot ;
  //   voitureVie : points d'une voiture (un obus enlève ses points d'explosion, voir structures.explosions + « souffle » m
  //     de rayon en plus) ; balle : points par balle ; feu : s que brûle une voiture détruite ;
  //   ecraser : un tank ou un engin plus rapide que « ecraser » m/s écrase les petits objets (bancs, poubelles, tables,
  //     barrières, objets) ; pousser : la part du choc qui pousse la VOITURE (le reste arrête le tank) ;
  //   distances : les petits objets sont dessinés à moins de « objets » m (selon la qualité, voir qualite.niveaux).
  ville: {
    rue: { chaussee: 7, bordure: 0.15 },
    lampadaire: 24, arbre: 23, voiture: 11, banc: 0.35, poubelle: 0.45, abribus: 0.12, kiosque: 0.1, panneau: 0.35,
    parts: { portesOuvertes: 0.35, brulees: 0.12, accidentees: 0.1, milieu: 0.18 },
    immeubles: 0.22, etages: [4, 5], boutiques: 0.55, balcons: 0.35, clims: 0.1, affiches: 0.5, vitresCassees: 0.18,
    objets: 14, papiers: 40, terrasses: 0.5,
    voitureVie: 70, balle: 0.5, souffle: 1.5, feu: 25, busVie: 160,
    ecraser: 2.5, pousser: 0.7,
    // (la ville en ruines : plus de voitures brûlées, moins de vitres, plus de débris)
    ruines: { brulees: 0.45, accidentees: 0.2, vitresCassees: 0.6, papiers: 70 },
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
    // (livre de demandes n° 8) interieurs (m : les INTÉRIEURS des maisons — sol, escalier, meubles — ne sont fabriqués et
    // dessinés qu'à moins de cette distance de la caméra ; plus loin, on ne les voit pas par les fenêtres).
    // (livre n° 9 et 11) objetsVille (m : les petits objets de la ville — sacs, téléphones, papiers, chaises — plus près).
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
      { nom: "très léger", pixels: 0.6, ombres: 0, douces: false, vue: 380, decor: 300, soldatDetail: 12, soldatSimple: 30, soldatSilhouette: 150, roues: 35, effets: 120, herbe: 0, arbresDetail: 50, maisons: 60, interieurs: 15, objetsVille: 45,
        reflets: false, ombresChaque: 1, anisotropie: 2, solFin: false, animLoin: 3, filtre: false },
      { nom: "léger", pixels: 0.75, ombres: 1024, douces: false, vue: 520, decor: 380, soldatDetail: 18, soldatSimple: 40, soldatSilhouette: 200, roues: 60, effets: 180, herbe: 18, arbresDetail: 70, maisons: 90, interieurs: 25, objetsVille: 70,
        reflets: false, ombresChaque: 2, anisotropie: 4, solFin: false, animLoin: 2, filtre: true },
      { nom: "normal", pixels: 1, ombres: 2048, douces: false, vue: 800, decor: 540, soldatDetail: 35, soldatSimple: 70, soldatSilhouette: 250, roues: 100, effets: 280, herbe: 38, arbresDetail: 130, maisons: 160, interieurs: 40, objetsVille: 110,
        reflets: true, ombresChaque: 1, anisotropie: 8, solFin: true, animLoin: 2, filtre: true },
      { nom: "beau", pixels: 1.25, selonEcran: true, ombres: 2048, douces: true, vue: 1300, decor: 850, soldatDetail: 50, soldatSimple: 110, soldatSilhouette: 300, roues: 160, effets: 400, herbe: 60, arbresDetail: 220, maisons: 240, interieurs: 60, objetsVille: 160,
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
  // (livre de demandes n° 6) L'Ingénieur a en plus une ARME BONUS (touche 5) : « armesBonus ».
  // (demande 98) Le 1er gadget et le 1er explosif de chaque liste sont libres dès le début ; le 2e a un cadenas (son « niveau »).
  // vie : × la vie de ton soldat (l'Assaut : 25 % de plus). Seul TON soldat a une classe.
  classes: {
    assaut: { nom: "Assaut", icone: "🪖", couleur: "#ff8a3d", vie: 1.25,
      texte: "En première ligne : fusil d'assaut, lance-grenades sous le canon, et 25 % de vie en plus.",
      armes: ["ar4", "famas", "ak12", "g36", "scarh", "m870", "m870dragon"], gadgets: ["lanceGrenades", "sacMunitions"], explosifs: ["grenades", "fumigene"] },
    ingenieur: { nom: "Ingénieur", icone: "🔧", couleur: "#ffd23d", vie: 1,
      texte: "Le chasseur de tanks : lance-roquettes PLUS une arme bonus contre les soldats, et il RÉPARE les tanks et les engins de son camp.",
      armes: ["rpg7", "at4", "javelin", "carlgustaf"], gadgets: ["reparation", "droneReparation"], explosifs: ["mineAT", "c4"],
      // (livre de demandes n° 6) ✍️ « Faire en sorte que l'ingénieur ait le droit à une arme bonus en plus de son
      // lance-roquettes. » L'ARME BONUS (touche 5) : une petite arme contre les soldats, EN PLUS du lance-roquettes (2)
      // et du pistolet (1). Tu en choisis une dans cette liste (la 1re est libre dès le début ; les autres : leur « niveau »).
      armesBonus: ["ump45", "mp5", "m870", "m4courte"] },
    eclaireur: { nom: "Éclaireur", icone: "🔭", couleur: "#7dff8a", vie: 1,
      texte: "Tireur de loin : fusil de précision avec lunette, et des JUMELLES qui marquent les ennemis.",
      armes: ["m110", "svd", "m24", "mk14", "lapua", "barrett"], gadgets: ["jumelles", "capteur"], explosifs: ["grenades", "claymore"] },
    medecin: { nom: "Médecin de guerre", icone: "⛑️", couleur: "#ff5a6a", vie: 1,
      texte: "Il SOIGNE ses amis avec sa trousse et RELÈVE les soldats tombés avec son défibrillateur.",
      armes: ["mp5", "vector", "mp7", "p90", "bizon", "m870", "m870dragon"], gadgets: ["trousse", "defibrillateur"], explosifs: ["grenades", "fumigene"],
      // ✍️ (livre de demandes n° 14) « Avoir les grenades et les plaquettes quand tu es médecin. »
      //   grenadesEnPlus : il garde TOUJOURS ses grenades à main, même s'il a choisi les fumigènes (touche 4 encore une
      //     fois : on passe de l'un à l'autre) ;
      //   plaques : il porte un GILET PARE-BALLES à plaques (voir « plaques » plus bas : touche 6 pour en glisser une).
      grenadesEnPlus: true, plaques: true },
  },
  // ✍️ (livre de demandes n° 17, 18 et 19) LES SECOURS : le brancardier (logique/secours.js).
  //   saignement : s pendant lesquels un soldat à terre peut encore être RELEVÉ (après : il est perdu) ; c'est aussi le
  //     délai du défibrillateur ;
  //   medecins : les numéros des soldats rouges qui sont médecins (chez les Bleus : les infirmiers de la radio) ;
  //   portee : m où un médecin va de lui-même chercher un blessé ou un homme à terre ; appel : m quand on l'APPELLE
  //     (« Médic ! ») ; sinon le plus proche des amis y va (n'importe qui peut relever, plus lentement : « lentAmi ») : pour
  //     un soldat de l'ordinateur, un ami à moins de « porteeAmi » m, et pas plus de « amisMax » amis à la fois par camp ;
  //   perdus : les chutes après lesquelles un soldat de l'ordinateur ne se relève pas (une balle dans la tête, une explosion) ;
  //   blesse : un ami dont la vie est sous cette part (de 0 à 1) a besoin de soins ; pense : s entre deux tours du brancardier
  //     (un camp, puis l'autre) ; regarde : s entre deux coups d'œil sur les soldats à terre (la main levée, « Médic ! ») ;
  //   relever : s à genoux à côté de lui avant le « Dégagez ! » ; soin : s par point de vie rendu (toi ; un soldat de
  //     l'ordinateur : « soinIA ») ; distance : m pour soigner ou relever ;
  //   repli : un soldat de l'ordinateur dont la vie passe sous cette part se REPLIE vers un médecin ;
  //   joueur : TOI, à terre au lieu de perdre tout de suite (E : appeler un médecin ; R : abandonner) ; vieRelevé : la part
  //     de vie quand on te relève ; appelRadio : s entre deux « Médic ! » d'un même soldat à terre.
  secours: { saignement: 25, medecins: [3, 8], portee: 45, appel: 140, porteeAmi: 22, amisMax: 1, perdus: ["tete", "explosion"], lentAmi: 1.6, blesse: 0.6, pense: 0.5, relever: 1.4,
    soin: 0.5, soinIA: 1.6, distance: 1.8, regarde: 0.25, repli: 0.35, joueur: true, vieReleve: 0.5, appelRadio: 9,
    radio: {
      medic: ["Médic ! {nom} à terre {lieu} !", "Médic, médic ! Je suis touché {lieu} !", "J'ai besoin d'un médecin {lieu} ! Vite !", "Ici {nom}, je suis à terre {lieu}, quelqu'un !"],
      jArrive: ["Tiens bon {patient}, j'arrive !", "Médecin en route vers {patient} !", "J'arrive {patient}, reste avec moi !"],
      degagez: ["Dégagez ! … Choc !", "Chargé… Dégagez !", "Allez, reviens ! Dégagez !"],
      releve: ["{patient} est de nouveau debout !", "C'est bon, il respire. On repart !", "{patient} est relevé, on continue !"],
      toiATerre: ["{nom} est à terre ! Tenez bon, j'arrive !", "Le chef est touché ! Médecin, vite !"],
    } },
  // ✍️ (livre de demandes n° 21) « Faire une amélioration pour les robots. » LES TACTIQUES des soldats de l'ordinateur
  // (logique/troupes.js). Chacun a son TALENT (de « talent[0] » à « talent[1] » : il vise mieux et réagit plus vite) ;
  //   abri : m où il cherche un mur, une voiture ou une maison pour se cacher de l'ennemi qu'il combat ; abriTemps : s
  //     qu'il y reste ; abriChance : la chance (à chaque réflexion) qu'il parte s'abriter s'il est à découvert ;
  //   contourne : [m au moins, m au plus] de l'ennemi pour CONTOURNER (sur le côté, à « contourneEcart » m de la ligne
  //     droite) ; contourneChance : la chance qu'un soldat de l'escouade soit choisi pour le faire ;
  //   suppression : s pendant lesquelles il tire encore là où il a vu l'ennemi disparaître (pour le clouer au sol) ;
  //   entend : m où il ENTEND un tir ennemi (il se tourne et va voir) ; escouade : soldats par escouade (ils suivent le
  //     premier, leur chef, à « ecartEscouade » m les uns des autres) ; canon : rad devant le canon d'un tank ennemi (à
  //     moins de « canonPortee » m) où il ne reste pas ; angles : s entre deux coups d'œil sur les côtés près des maisons ;
  //   cibles : combien d'ennemis vus il compare au plus (le plus menaçant, le plus à découvert) : moins = plus rapide.
  tactiques: { talent: [0.65, 1.3], abri: 16, abriTemps: 7, abriChance: 0.55, contourne: [25, 110], contourneEcart: 28, contourneChance: 0.35,
    suppression: 3.5, entend: 110, escouade: 4, ecartEscouade: 6, canon: 0.3, canonPortee: 70, angles: 2.5, cibles: 2,
    // (contre le lag) à chaque petit pas (1/120 s) : au plus « penseesParPas » soldats réfléchissent (les autres attendent,
    // au plus « attenteMax » s de plus), « vuesParPas » lignes de vue et « abrisParPas » recherches d'abri ; en tir de
    // suppression, il ne tire qu'une fois sur « 1 ÷ suppressionTir » (des rafales espacées : moins de balles à calculer)
    penseesParPas: 2, attenteMax: 0.4, vuesParPas: 8, abrisParPas: 1, suppressionTir: 0.12 },
  // ✍️ (livre de demandes n° 14) LES PLAQUETTES (les plaques de blindage du gilet, comme dans Warzone). Seulement pour les
  // classes qui ont « plaques: true » (le Médecin, décidé par Maxance).
  //   gilet : combien de plaques le gilet porte ; solidite : la vie d'une plaque (une balle d'ennemi = 1, ta vie = 20) :
  //   un coup abîme d'abord la plaque du dessus, le reste passe à la suivante, puis à ta vie (une plaque cassée ne protège
  //   plus) ; explosion : × les dégâts d'une explosion que les plaques arrêtent (le souffle passe en partie à côté) ;
  //   reserve : les plaques de rechange dans ton sac (au plus « reserveMax ») ; pose : s pour en glisser une (touche 6 :
  //   ton arme est baissée pendant ce temps ; tirer ou changer d'arme l'annule) ; regain : s pour en regagner une ; ton
  //   camp (à moins de « grenades.camp » m) remplit tout ; un sac de munitions aussi (« sac » plaques).
  plaques: { gilet: 3, solidite: 3, explosion: 0.35, reserve: 4, reserveMax: 5, pose: 1.5, regain: 40, sac: 2 },

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
    // (demande 97) l'arme de défense de l'ingénieur ; (livre n° 6) c'est maintenant son ARME BONUS (touche 5), libre dès le début
    ump45: { nom: "UMP45", type: "Pistolet-mitrailleur (.45)", icone: "🔫", classe: "ingenieur", famille: "pm", niveau: 0,
      texte: "Pour se défendre contre les soldats : de grosses balles lentes. Ton lance-roquettes reste sur ton dos (touche 2) !",
      degats: 1, cadence: 0.09, portee: 95, porteeEfficace: 35, degatsLoin: 0.5, chargeur: 25, reserve: 175, rechargement: 2.1,
      dispersion: 0.03, dispersionVisee: 0.011, recul: 0.006, visee: 0.2, mobilite: 1.06, bruit: 0.9, zoom: 1.2 },
    // (livre n° 6) la carabine COURTE de l'ingénieur (arme bonus) : un AR-4 au canon raccourci et à la crosse rentrée
    m4courte: { nom: "M4 courte", type: "Carabine compacte", icone: "🔫", classe: "ingenieur", famille: "fusil", niveau: 7,
      texte: "Un AR-4 tout court : il tire plus loin qu'un pistolet-mitrailleur et fait plus mal, mais il recule plus et on court un peu moins vite.",
      degats: 1, cadence: 0.085, portee: 130, porteeEfficace: 50, degatsLoin: 0.55, chargeur: 30, reserve: 120, rechargement: 2.1,
      dispersion: 0.03, dispersionVisee: 0.008, recul: 0.0075, visee: 0.21, mobilite: 1.03, bruit: 1.1, zoom: 1.25 },
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
    // ---------- 💥 LES FUSILS À POMPE (pour l'Assaut ET le Médecin)
    // ✍️ « Je veux que tu fasses les fusils à pompe, normaux et incendiaires… qu'ils soient assez beaux et réalistes. »
    // Famille « pompe » : chaque coup lance « plombs » petites billes (la « gerbe ») ; chaque bille est une balle à elle
    // seule (degats = les dégâts d'UNE bille) qui s'écarte en plus de « gerbe » rad. De près, presque toutes touchent ; de
    // loin, la gerbe s'ouvre et peu touchent (et elles font moins mal). Après chaque coup, on « pompe » (cadence lente).
    // coupParCoup : on recharge cartouche par cartouche (« rechargement » s par cartouche ; tirer arrête de recharger).
    // incendiaire (« Dragon's breath ») : un soldat touché BRÛLE « duree » s et perd « degats » de vie en tout (par petits
    // coups toutes les « intervalle » s). Il n'y a pas de sang : juste des flammes.
    m870: { nom: "M870", type: "Fusil à pompe", icone: "💥", classe: "assaut", famille: "pompe", niveau: 4, pompe: true, coupParCoup: true, plombs: 8, gerbe: 0.055,
      exclus: ["chargeur:rapide", "chargeur:tambour"],
      texte: "Le fusil à pompe classique : 8 plombs par coup. Terrible de près (1 coup = 1 soldat), presque inutile au-delà de 30 m. On pompe après chaque tir !",
      degats: 0.55, cadence: 0.85, portee: 45, porteeEfficace: 15, degatsLoin: 0.25, chargeur: 7, reserve: 35, rechargement: 0.5,
      dispersion: 0.03, dispersionVisee: 0.014, recul: 0.03, visee: 0.26, mobilite: 0.98, bruit: 1.3, zoom: 1.2 },
    m870dragon: { nom: "M870 Dragon", type: "Fusil à pompe incendiaire", icone: "🔥", classe: "assaut", famille: "pompe", niveau: 8, pompe: true, coupParCoup: true, plombs: 8, gerbe: 0.07,
      incendiaire: { duree: 3, degats: 1.2, intervalle: 0.5 }, exclus: ["chargeur:rapide", "chargeur:tambour", "munitions"],
      texte: "Cartouches « souffle du dragon » : une gerbe de FEU. Un peu moins fort que le M870, mais un soldat touché BRÛLE pendant 3 s. Portée encore plus courte.",
      degats: 0.42, cadence: 0.9, portee: 35, porteeEfficace: 12, degatsLoin: 0.2, chargeur: 6, reserve: 30, rechargement: 0.55,
      dispersion: 0.034, dispersionVisee: 0.018, recul: 0.03, visee: 0.26, mobilite: 0.98, bruit: 1.4, zoom: 1.2 },
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
      distance: 3, attente: 1.5, delai: 25, choc: 0.7 }, // (delai : s depuis sa chute) (livre n° 15 : choc : s, le « Dégagez ! » des palettes)
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
    viseur: { nom: "Viseur", icone: "🎯", pour: ["fusil", "pm", "precision", "pistolet", "roquettes", "pompe"], pieces: [
      { id: "mire", nom: "Mire métallique", niveau: 0, texte: "Le guidon et le cran de mire : simple et rapide.", effets: {} },
      { id: "pointRouge", nom: "Point rouge", niveau: 1, texte: "Un petit point rouge : on vise mieux.", effets: { zoom: 1.6, dispersionVisee: 0.85, visee: 0.03 } },
      { id: "lunette2", nom: "Viseur ×2 compact", niveau: 2, pour: ["fusil", "pm", "precision", "roquettes"], texte: "Un petit prisme qui grossit 2 fois : bien pour les combats moyens.", effets: { zoom: 2.2, dispersionVisee: 0.78, visee: 0.05, mobilite: -0.005 } },
      { id: "holo", nom: "Holographique", niveau: 3, pour: ["fusil", "pm", "precision", "roquettes", "pompe"], texte: "Une grande fenêtre avec un cercle : précis et clair.", effets: { zoom: 1.9, dispersionVisee: 0.75, visee: 0.06, mobilite: -0.01 } },
      // (demande 88) une lunette compacte entre le point rouge et la grosse lunette
      { id: "lunette4", nom: "Lunette ×4", niveau: 5, pour: ["fusil", "pm", "precision", "roquettes"], texte: "Une lunette courte et solide : on tire loin, sans être trop lent.", effets: { zoom: 4, dispersionVisee: 0.6, portee: 1.08, visee: 0.1, mobilite: -0.015 } },
      { id: "lunette", nom: "Lunette ×6", niveau: 7, pour: ["fusil", "pm", "precision"], texte: "Pour tirer TRÈS loin. Lente à épauler, et on voit moins autour.", effets: { zoom: 6, dispersionVisee: 0.5, portee: 1.15, visee: 0.18, mobilite: -0.03, dispersion: 1.1 } },
      { id: "lunette8", nom: "Lunette ×8", niveau: 8, pour: ["fusil", "precision"], texte: "La plus grosse lunette : on voit un soldat à 500 m ! Très lente, très lourde.", effets: { zoom: 8, dispersionVisee: 0.42, portee: 1.2, visee: 0.24, mobilite: -0.04, dispersion: 1.15 } },
      { id: "thermique", nom: "Lunette thermique", niveau: 10, pour: ["fusil", "pm", "precision", "roquettes"], texte: "×4 qui voit la CHALEUR : les soldats et les moteurs brillent en blanc, même dans la fumée. Lourde, et l'écran éclaire ton visage.", effets: { zoom: 4, thermique: true, dispersionVisee: 0.65, visee: 0.14, mobilite: -0.025, visibilite: 8 } },
    ] },
    canon: { nom: "Canon", icone: "📏", pour: ["fusil", "pm", "precision", "pompe"], pieces: [
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
    chargeur: { nom: "Chargeur", icone: "🧱", pour: ["fusil", "pm", "precision", "pistolet", "pompe"], pieces: [
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
    crosse: { nom: "Crosse", icone: "🪵", pour: ["fusil", "pm", "precision", "pompe"], pieces: [
      { id: "standard", nom: "Crosse d'origine", niveau: 0, texte: "La crosse livrée avec l'arme.", effets: {} },
      { id: "legere", nom: "Crosse légère", niveau: 2, texte: "Un simple squelette : on court et on épaule plus vite. L'arme recule plus.", effets: { mobilite: 0.04, visee: -0.04, recul: 1.15 } },
      { id: "repliable", nom: "Crosse repliée", niveau: 4, texte: "Repliée sur le côté : l'arme est toute courte et rapide… mais elle saute dans les mains.", effets: { mobilite: 0.06, visee: -0.06, recul: 1.3, dispersionVisee: 1.15 } },
      { id: "lourde", nom: "Crosse lourde", niveau: 6, texte: "Elle ne bouge presque plus… mais elle pèse lourd.", effets: { recul: 0.55, dispersion: 0.85, mobilite: -0.06, visee: 0.06 } },
    ] },
    munitions: { nom: "Munitions", icone: "🔸", pour: ["fusil", "pm", "precision", "pistolet", "pompe"], pieces: [
      { id: "standard", nom: "Balles normales", niveau: 0, texte: "Les balles d'origine.", effets: {} },
      { id: "pointeCreuse", nom: "Pointe creuse", niveau: 3, texte: "Elles s'ouvrent en touchant : 20 % de dégâts en plus… mais elles portent moins loin, et rien contre les engins.", effets: { degats: 1.2, portee: 0.85, degatsLoin: 0.85, vsVehicule: 0.5 } },
      { id: "perforantes", nom: "Perforantes", niveau: 6, texte: "Une pointe d'acier : 2,5 fois plus de dégâts sur les motos, quads et leurs pilotes. Un peu moins sur les soldats.", effets: { vsVehicule: 2.5, degats: 0.95, recul: 1.05 } },
      { id: "subsoniques", nom: "Subsoniques", niveau: 8, texte: "Plus lentes que le son : beaucoup plus discrètes. Mais elles tombent plus vite et vont moins loin.", effets: { bruit: 0.6, vitesseBalle: 0.7, degatsLoin: 0.85, portee: 0.9 } },
    ] },
    lampe: { nom: "Lampe", icone: "🔦", pour: ["fusil", "pm", "precision", "roquettes", "pompe"], pieces: [
      { id: "aucune", nom: "Aucune", niveau: 0, texte: "Pas de lampe.", effets: {} },
      { id: "lampe", nom: "Lampe", niveau: 2, texte: "Éclaire devant toi (touche L). Mais on te voit de plus loin.", effets: { lampe: { portee: 30, angle: 0.32, force: 40, aveugle: 0 }, visibilite: 25 } },
      { id: "puissante", nom: "Lampe puissante", niveau: 6, texte: "Éclaire loin et ÉBLOUIT les ennemis devant elle (ils visent mal). Mais on te voit de TRÈS loin.", effets: { lampe: { portee: 55, angle: 0.26, force: 110, aveugle: 22 }, visibilite: 60, mobilite: -0.01 } },
    ] },
    laser: { nom: "Laser", icone: "🔴", pour: ["fusil", "pm", "precision", "roquettes", "pompe"], pieces: [
      { id: "aucun", nom: "Aucun", niveau: 0, texte: "Pas de laser.", effets: {} },
      { id: "rouge", nom: "Laser rouge", niveau: 1, texte: "Un point rouge là où tu vises : plus précis sans viser. Il se voit un peu.", effets: { laser: "#ff2a1a", dispersion: 0.75, visibilite: 15 } },
      { id: "vert", nom: "Laser vert", niveau: 5, texte: "Plus brillant : encore plus précis, épaule plus vite… mais il se voit de loin.", effets: { laser: "#3dff4a", dispersion: 0.62, visee: -0.03, visibilite: 35 } },
    ] },
    assistance: { nom: "Assistance à la visée", court: "Assistance", icone: "🧲", pour: ["fusil", "pm", "precision", "pistolet", "roquettes", "pompe"], pieces: [
      { id: "aucune", nom: "Aucune", niveau: 0, texte: "C'est toi qui vises.", effets: { cone: 0.04, aimant: 0 } },
      { id: "legere", nom: "Légère", niveau: 1, texte: "Ton arme glisse un peu vers l'ennemi. Un peu moins de dégâts.", effets: { cone: 0.09, aimant: 0.6, degats: 0.95 } },
      { id: "moyenne", nom: "Moyenne", niveau: 2, texte: "Elle t'aide bien. Moins de dégâts, et un peu plus lourde.", effets: { cone: 0.14, aimant: 1.2, degats: 0.9, mobilite: -0.01 } },
      { id: "forte", nom: "Forte", niveau: 4, texte: "Elle « colle » à l'ennemi ! Mais tes balles font beaucoup moins mal.", effets: { cone: 0.2, aimant: 2.2, degats: 0.8, mobilite: -0.02 } },
    ] },
    // ✍️ LES PEINTURES (des camouflages, peints par l'ordinateur au démarrage : aucune image à télécharger). motif : la
    // façon de peindre (des « taches » en couches, des « pixels », des « rayures » de tigre, la trame du « carbone », l'« or »
    // gravé) ; couleurs : le fond puis chaque couche ; brillant : 0 (mat) à 1 (métal qui brille).
    // Le camouflage aide un peu à se cacher (on te remarque 5 m moins loin) ; l'or se voit de loin… mais c'est de l'OR !
    peinture: { nom: "Peinture", icone: "🎨", pour: ["fusil", "pm", "precision", "pistolet", "roquettes", "pompe"], pieces: [
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
  // ✍️ (demande 102) « Tout se débloque trop rapidement. Je veux que ça se débloque plus lentement. » Les points sont
  // environ 3 fois plus petits et les niveaux plus longs : il faut environ 3 à 4 fois plus de batailles pour le joueur,
  // et environ 5 fois plus d'ennemis abattus avec une arme pour ses pièces. (avant : joueur 800 + 150, arme 300 + 100,
  // un ennemi 100 XP.) « ancien » : les anciennes courbes, pour convertir une sauvegarde sans faire baisser ton niveau.
  progression: {
    joueur: { base: 1000, pas: 200, max: 30 },
    arme: { base: 500, pas: 150, max: 10 },
    ancien: { joueur: { base: 800, pas: 150 }, arme: { base: 300, pas: 100 } },
    points: {
      ennemi: { xp: 30, arme: 30, nom: "Ennemis abattus", icone: "💀" },
      tete: { xp: 15, arme: 15, nom: "Tirs à la tête", icone: "🎯" },
      tank: { xp: 100, arme: 70, nom: "Tanks détruits", icone: "💥" },
      vehicule: { xp: 50, arme: 35, nom: "Engins détruits", icone: "🚙" },
      soin: { xp: 12, nom: "Soins", icone: "🩹" },
      releve: { xp: 40, nom: "Soldats relevés", icone: "⚡" },
      reparation: { xp: 5, nom: "Réparations", icone: "🔧" },
      marque: { xp: 6, nom: "Ennemis marqués", icone: "🔭" },
      objectif: { xp: 80, nom: "Objectifs", icone: "🚩" },
      baieQG: { xp: 60, nom: "Baies de QG détruites", icone: "🗄️" }, // (livre n° 25 : une baie du QG du Front, dans le souterrain)
      victoire: { xp: 300, nom: "Victoire", icone: "🏆" },
      participation: { xp: 50, nom: "Participation", icone: "🎖️" },
      etoile: { xp: 60, nom: "Étoiles de campagne", icone: "⭐" },
      mvp: { xp: 150, nom: "Meilleur joueur (MVP)", icone: "🥇" },
      boutique: { xp: 1, nom: "Promotion (boutique)", icone: "🛒" }, // (livre n° 28 : l'avancement « +1 niveau », jamais doublé)
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
      // ✍️ (livre n° 12) les TIREURS D'ÉLITE de l'ordinateur (sur les perchoirs) : un vrai fusil de précision, avec une lunette
      elite: { bleus: [["m110", 2], ["m24", 1], ["lapua", 1]], rouges: [["svd", 3], ["barrett", 1], ["mk14", 1]], viseur: [["lunette", 2], ["lunette8", 1]] },
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
      hanche: { pompe: [0.135, -0.175, -0.43], fusil: [0.135, -0.175, -0.43], pm: [0.13, -0.17, -0.4], precision: [0.145, -0.18, -0.45], pistolet: [0.085, -0.11, -0.47], roquettes: [0.2, -0.16, -0.24] },
      hancheLacet: { pompe: 0.2, fusil: 0.2, pm: 0.2, precision: 0.17, pistolet: 0.06, roquettes: 0.02 }, // rad : à la hanche, l'arme est un peu tournée vers le centre…
      hancheRoulis: { pompe: -0.12, fusil: -0.12, pm: -0.14, precision: -0.1, pistolet: -0.05, roquettes: 0 }, // rad : … et un peu penchée
      oeil: { pompe: 0.26, fusil: 0.24, pm: 0.22, precision: 0.18, pistolet: 0.42, roquettes: 0.16 }, // m : de l'œil à l'arrière du viseur, épaulé
      respiration: [0.0035, 0.32], // [m, battements par s] : l'arme respire au repos
      pas: 0.014, // m : l'arme monte et descend à chaque pas
      retard: 0.035, // rad par rad/s : l'arme traîne un peu derrière quand tu tournes
      recul: { pompe: [0.07, 0.11], fusil: [0.035, 0.05], pm: [0.025, 0.035], precision: [0.08, 0.14], pistolet: [0.04, 0.16], roquettes: [0.1, 0.07], mitrailleuse: [0.04, 0.05] }, // [m en arrière, rad vers le haut] par tir
      ressort: 260, amorti: 26, // le ressort qui ramène l'arme après le recul (raideur, frottement)
      // pendant le rechargement : [m vers la droite, m vers le haut, m vers toi, rad de roulis, rad vers le haut]
      rechargePose: { pompe: [-0.05, 0.04, 0.04, 0.85, 0.18], fusil: [-0.07, 0.05, 0.05, 0.62, 0.22], pm: [-0.06, 0.05, 0.05, 0.6, 0.2], precision: [-0.07, 0.05, 0.05, 0.5, 0.2], pistolet: [-0.04, 0.04, 0.03, 0.5, 0.3], roquettes: [-0.04, -0.03, 0.02, 0.12, -0.08] },
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
      // (fusils à pompe) un gros « BOUM » grave et rond, puis le « clac-clac » de la pompe « pompeApres » s après le tir
      pompe: { crac: 850, duree: 0.13, boum: 1, grave: 75, echo: 0.6, pompeApres: 0.3 },
    },
    // (fusils à pompe) la POMPE à la 1re personne : le garde-main recule de « course » m puis revient, de « debut » à
    // « fin » s après le tir.
    pompe: { course: 0.075, debut: 0.18, fin: 0.62 },
  },
  // ✍️ (livre de demandes n° 15 et 16) « Je veux que tu puisses voir le défibrillateur » ; « quand tu as les grenades et les
  // C4, je veux que tu les voies. » L'ACCESSOIRISTE (affichage/objets3d.js) fabrique ce que tu tiens EN MAIN quand ce
  // n'est pas une arme : grenade, fumigène, C4 et sa télécommande, mine, claymore, défibrillateur (2 palettes, leurs câbles
  // et le boîtier), trousse de soins, plaque du gilet, outil de réparation, jumelles, capteur, sac de munitions, tablette
  // du drone. À la 1re personne (positions en m devant l'œil : x à droite, y en haut, z vers toi) :
  //   droite / gauche : où sont tenus l'objet de la main droite et celui de la main gauche ; leve : s pour lever l'objet
  //   (après avoir baissé ton arme) ; pas, respiration : comme l'arme. À la 3e personne : « echelle » (× la vraie taille,
  //   pour qu'on les voie de loin) et « devant » (m devant ta poitrine, dans tes mains).
  //   choc : le « Dégagez ! » du défibrillateur (m vers l'avant, éclair en m, force de la lumière).
  objets3d: {
    vue: { droite: [0.15, -0.14, -0.4], gauche: [-0.14, -0.15, -0.41], deuxMains: [0.0, -0.15, -0.38], leve: 0.22, pas: 0.012, respiration: [0.003, 0.3] },
    troisieme: { echelle: 1.6, droite: [0.36, 0.22, 0.17], gauche: [0.34, 0.22, -0.12], hanche: [0.1, -0.02, 0.21] },
    choc: { avance: 0.09, eclair: 0.07, lumiere: 4 },
    trousse: { anneau: 0.35 }, // l'opacité de l'anneau vert de la trousse posée (on voit où elle soigne)
  },
  // Les barres du menu : la valeur qui remplit la barre (le menu montre « avant → après »).
  // (demande 97) L'ARMURERIE : la valeur qui remplit chaque barre (plus la barre est longue, mieux c'est) ; « vue » : la
  // caméra qui tourne autour de l'arme (rad/s quand on n'y touche plus, s avant de reprendre, zoom le plus près / le plus
  // loin ; l'arme se balance de « balancement » rad autour de sa vue de côté).
  menu: {
    barres: { degats: 4.2, portee: 520, precision: 0.014, recul: 0.05, cadence: 1300, chargeur: 64, rechargement: 6, visee: 0.8, mobilite: [0.8, 1.2], bruit: 2, visibilite: 80 },
    vue: { vitesse: 0.35, reprise: 4, zoomMin: 0.55, zoomMax: 1.8, balancement: 0.55, depart: 0.3, hauteur: 0.14 },
    // ✍️ (livre de demandes n° 4 : « refaire le menu dans le moindre détail ») LES APERÇUS des cartes du menu, dessinés par
    // le menu lui-même (pas d'image à télécharger) : pour chaque carte, le ciel (haut, bas), les collines (loin, près),
    // le sol, et ce qu'on y voit (« decor » : arbres, maisons, immeubles, ruines, dunes, village, tunnel) ;
    // pour chaque tank, sa couleur de camouflage (la forme vient de ses vraies mesures : longueur, hauteur, canon).
    apercus: {
      cartes: {
        bataille: { ciel: ["#6d8fb0", "#d9d2b8"], collines: ["#5f7458", "#4a5e3c"], sol: "#56693a", decor: "arbres" },
        souterrain: { ciel: ["#151719", "#2a2c2e"], collines: ["#202224", "#1a1b1c"], sol: "#3a3936", decor: "tunnel" },
        ville: { ciel: ["#7f9bb5", "#d8d6cc"], collines: ["#77808a", "#5d646c"], sol: "#5a5c60", decor: "immeubles" },
        ruines: { ciel: ["#8a8c90", "#c9c4b8"], collines: ["#6c6a66", "#56544f"], sol: "#5e5b55", decor: "ruines" },
        desert: { ciel: ["#e9b878", "#f6e2b8"], collines: ["#d7ac70", "#c9975a"], sol: "#d6b47c", decor: "dunes" },
        "village-desert": { ciel: ["#e2b47a", "#f4e0bc"], collines: ["#d4a96e", "#c49458"], sol: "#cfac78", decor: "village" },
      },
      chars: { leclerc: "#5d6448", abrams: "#a08c62", leopard: "#4f5a44" },
    },
  },
  // ✍️ (livre de demandes, n° 1) « Retirer toutes les infos inutiles. » L'ÉCRAN DE LA BATAILLE, épuré façon Battlefield :
  // on garde l'essentiel (vie, munitions, armes, carte, score, viseur, objectif) ; le reste reste SOUS LE CAPOT.
  //   aide : la ligne des touches n'apparaît que les « debut » premières secondes d'une bataille (puis s'efface en
  //     « fondu » s), ou quand tu appuies sur H (H encore : elle se cache) ;
  //   noms : au-dessus des alliés, le nom seulement à moins de « allies » m (ou s'il suit un de tes ordres : ton
  //     escouade) ; plus loin, juste un petit ▼. Les ennemis : le nom à moins de « ennemis » m, sinon ◆ et la distance.
  //     Les motos, quads, camions : le nom à moins de « engins » m ; les hélicos de transport : à moins de « helicos » m ;
  //     « taille » : px, la taille des lettres ;
  //   invite : « E : monter » en petit (taille px) ; qualiteAEcran : écrire « qualité 2/3 · 58 i/s » sous la carte
  //     (false : seulement sous le capot) ; vitesseAPied : la vitesse en km/h quand tu marches (false : cachée).
  interface: {
    aide: { debut: 10, fondu: 1.5 },
    noms: { allies: 60, ennemis: 150, engins: 60, helicos: 250, taille: 11 },
    invite: { taille: 15 },
    qualiteAEcran: false,
    vitesseAPied: false,
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
    //   rues : la couleur des rues ; ville : « abandonnee » ou « ruines » = la ville réaliste (voir « ville » plus haut) ; soleil : remplace des réglages de beaute.soleil ; brume : la couleur de la brume.
    { id: "ville", nom: "La ville", icone: "🏙️", texte: "En pleine ville : des rues en damier et des dizaines de maisons entières où se cacher.", infanterie: false,
      variante: { arbres: 0.25, village: false, quartier: { x: 0, z: 0, rayon: 190, ilot: 38, rue: 10, maisons: 3, ruinesDepart: 0 }, rues: "#5a5c60", ville: "abandonnee" } },
    { id: "ruines", nom: "La ville en ruines", icone: "🏚️", texte: "La même ville, mais après les combats : presque tout est écroulé, gravats et sol gris.", infanterie: false,
      variante: { arbres: 0.15, village: false, quartier: { x: 0, z: 0, rayon: 190, ilot: 38, rue: 10, maisons: 3, ruinesDepart: 0.8 }, rues: "#4a4b4e", trous: 4, ville: "ruines",
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
    // ✍️ (livre de demandes n° 25) « Dans les souterrains, un QG à détruire à chacun. » Chaque camp a son QG (son poste de
    // commandement) dans une salle derrière le mur du bout de SA station : les Bleus à l'est, côté sud (z > 0), les Rouges
    // à l'ouest, côté nord (z < 0). Dedans : des bureaux, des cartes, des radios, des écrans, un groupe électrogène, des
    // sacs de sable… et 3 BAIES (des armoires de serveurs et de radios) : c'est le CŒUR du QG.
    //   salle : elle va de |x| = L (le mur du bout) à |x| = L + profondeur, et de |z| = z[0] à z[1] ; plafond : m ;
    //   porte : le passage dans le mur du bout (|z| de porte[0] à porte[1], « hauteur » m) ;
    //   baies : les 3 armoires (|z| de chacune, contre le mur du fond), « vie » points chacune ;
    //   degats : les points qu'enlève à une baie une balle (× les dégâts de l'arme) ou une explosion (au centre ; moins
    //     loin, plus rien au-delà de son rayon, celui de « structures.explosions ») ;
    //   alerte : s, la radio dit « le QG est attaqué » au plus une fois toutes les « alerte » s (pour chaque camp) ;
    //   ia : les soldats reçoivent leur RÔLE à tour de rôle (« roles », d'après leur numéro : le n° 1 le 1er rôle, le n° 2
    //     le 2e…) : « garde » reste GARDER son QG, « sapeur » part DÉTRUIRE le QG ennemi, « patrouille » fait comme avant
    //     (il patrouille et se bat dans la station). Arrivé à moins de « portee » m
    //     d'une baie ennemie qu'il voit, sans ennemi en vue, il tire dessus, et lance une grenade s'il est entre
    //     grenade[0] et grenade[1] m (« chance » des fois où il regarde, toutes les « pense » s). En route, le sapeur tire
    //     EN MARCHANT (il ne s'arrête que si un ennemi est à moins de « arret » m).
    // Détruire les 3 baies ennemies = VICTOIRE (en plus de l'ancienne règle : le dernier camp debout gagne). Perdre les
    // 3 tiennes = DÉFAITE. (Pas dans la campagne : là, ce sont les objectifs du chapitre qui comptent.)
    qg: {
      actif: true,
      profondeur: 18, z: [5, 15], plafond: 4.4,
      porte: [8.6, 11.6], hauteurPorte: 2.7,
      cote: { bleus: { x: 1, z: 1 }, rouges: { x: -1, z: -1 } },
      noms: { bleus: "le QG Rempart", rouges: "le QG du Front" },
      baies: [7, 10, 13], vieBaie: 100,
      degats: { balle: 0.6, grenade: 70, roquette: 85, at4: 95, javelin: 120, lg40: 55, c4: 260, mine: 160, claymore: 25, obus: 110, missile: 150, bombe: 260 },
      alerte: 12,
      ia: { roles: ["garde", "sapeur", "patrouille", "sapeur", "patrouille"], portee: 15, grenade: [7, 20], chance: 0.35, pense: 0.5, arret: 8 },
      // (l'affichage) la fumée et le feu d'une baie détruite : flammes et bouffées par seconde ; elles durent « feu » s
      feu: { flammes: 10, fumee: 3, duree: 90 },
    },
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
    // ✍️ (demande 101) LES BATTLE COINS gagnés à chaque mission RÉUSSIE, selon la difficulté (gardés dans la sauvegarde ;
    // la boutique pour les dépenser viendra plus tard). Une mission ratée ne rapporte rien.
    battleCoins: { "tres-facile": 100, facile: 200, normal: 500, difficile: 1000, "tres-difficile": 2000 },
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
        films: { ouverture: "ouverture-oasis", reussite: "fin-oasis-reussite", echec: "fin-oasis-echec" }, // ✍️ (demande 101) les cinématiques d'ouverture et de fin (cinematiques.films, tout en bas)
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
        films: { reussite: "fin-route-reussite", echec: "fin-route-echec" }, // ✍️ (demande 101) les cinématiques de fin
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
        films: { reussite: "fin-enclume-reussite", echec: "fin-enclume-echec" }, // ✍️ (demande 101) les cinématiques de fin
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
        films: { reussite: "fin-valcourt-reussite", echec: "fin-valcourt-echec" }, // ✍️ (demande 101) les cinématiques de fin
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
        films: { reussite: "fin-fantome-reussite", echec: "fin-fantome-echec" }, // ✍️ (demande 101) les cinématiques de fin
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
        films: { reussite: "fin-terminus-reussite", echec: "fin-terminus-echec" }, // ✍️ (demande 101) les cinématiques de fin
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
    parGenre: { touche: 7, toucheChar: 8, aTerre: 6, recharge: 10, grenade: 5, charEnVue: 8, abattu: 7, charDetruit: 3, joliTir: 3, renforts: 14, soin: 8, soinFini: 2, repare: 8, repareFini: 2, allieDetruit: 2, vehiculeDetruit: 8, interceptee: 14, pisteEnnemieFermee: 2, pisteEnnemieRouverte: 2, notrePisteFermee: 2, notrePisteRouverte: 2 }, // (demande 99 : les pistes)
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
    qualite: [["natural", 100], ["naturel", 100], ["neural", 90], ["wavenet", 90], ["online", 60], ["premium", 70], ["enhanced", 60], ["améliorée", 60], ["google", 40], ["siri", 50],
      // ✍️ (livre de demandes n° 3 : « des voix plus réalistes et plus humaines ») des POINTS EN MOINS pour les voix très
      // robotiques : eSpeak (la voix de Linux), les voix « compactes », et les voix rigolotes d'Apple (« Eloquence »)
      ["espeak", -120], ["compact", -40], ["eloquence", -80], ["grandma (", -80], ["grandpa (", -80], ["eddy (", -60], ["flo (", -60], ["reed (", -60], ["rocko (", -60], ["sandy (", -60], ["shelley (", -60]],
    langueBonus: 15, // (livre n° 3) points en plus pour le français de France (avant le français du Canada, de Belgique…)
    garder: 6,
    auMoins: 3, // (étape 96) au moins 3 voix différentes si l'ordinateur en a (même un peu moins belles)
    hasard: { hauteur: 0.04, vitesse: 0.06, urgent: 1.08 }, // (étape 96) ± 4 % de hauteur, ± 6 % de vitesse à chaque phrase ; × 1,08 si c'est urgent
    couleurs: { bleus: "#5aa8ff", rouges: "#ff5a4a", radio: "#ffd27a" },
    // ✍️ (livre de demandes n° 3) DES VOIX PLUS HUMAINES. La voix de l'ordinateur ne sait pas jouer la comédie ; alors on
    // lui écrit les phrases comme on PARLE (pas comme on écrit), et on change son rythme selon l'émotion :
    //   negation : la part des phrases où l'on « mange » le « ne » (« je ne bouge plus » → « je bouge plus ») ;
    //   hesitation : la part des phrases (bavardage / réponse) qui commencent par un petit mot (« euh… », « bon, ») ;
    //   debuts : ces petits mots ; morceaux : true = on coupe la phrase à chaque « . ! ? » et la voix respire entre deux ;
    //   emotions : × la vitesse et × la hauteur selon ce qui se passe (urgent = plus vite et un peu plus haut ; bavardage =
    //   calme, plus lent ; ennemi = plus grave et posé) ; bornes : jamais plus lent / plus vite, plus grave / plus aigu que ça
    //   (au-delà, une voix devient un dessin animé).
    humain: {
      negation: 0.75,
      hesitation: { bavardage: 0.22, reponse: 0.08, urgent: 0 },
      debuts: { bavardage: ["Euh… ", "Bon, ", "Alors, ", "Ouais, "], reponse: ["Ok, ", "Reçu, ", "Ouais, "] },
      morceaux: true,
      emotions: { urgent: { vitesse: 1.12, hauteur: 1.04 }, reponse: { vitesse: 1.03, hauteur: 1 }, bavardage: { vitesse: 0.95, hauteur: 0.99 }, ennemi: { vitesse: 0.94, hauteur: 0.97 } },
      bornes: { vitesse: [0.85, 1.3], hauteur: [0.88, 1.12] },
    },
    // (livre n° 3) LE TALKIE-WALKIE autour de la voix (affichage/sons.js) : fond = le volume du souffle pendant qu'il
    // parle ; crepitements = petits « crr » par seconde dans ce souffle ; bipFin = le petit « bip » quand on relâche le
    // bouton (comme les vraies radios militaires).
    effets: { fond: 0.022, crepitements: 2.5, bipFin: true },
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
    // ✍️ (livre n° 10) une liste peut être par CARACTÈRE : chacun garde ses mots (sinon « tous »)
    touche: { veteran: ["Touché. Je tiens.", "Je suis touché, ça va.", "Impact. Je reste en position."], recrue: ["Aïe ! Je suis touché ! Je suis touché !", "Ils m'ont eu ! Aïe !", "Touché ! Ça fait mal !"], blagueur: ["Aïe ! Ça, c'était pas prévu au programme !", "Touché ! Mon gilet a pris pour moi.", "Ouch ! Je suis touché, mais je reste beau."] },
    toucheChar: ["On est touchés !", "Impact sur le blindage !", "Ils nous allument !", "Coup au but sur nous !"],
    aTerre: ["Homme à terre !", "{victime} est tombé !", "On a perdu {victime} !", "Homme à terre, homme à terre !"],
    recharge: { veteran: ["Rechargement.", "Je recharge. Couvrez.", "Chargeur."], recrue: ["Je recharge, je recharge ! Couvrez-moi !", "Vide ! Je suis vide ! Je recharge !"], blagueur: ["Pause chargeur, deux secondes !", "Je recharge, ne bougez pas, vous êtes parfaits."] },
    grenade: ["Grenade !", "Grenade lancée !", "Attention, grenade !", "Je lance une grenade !"],
    charEnVue: ["Char ennemi en vue, à {distance} mètres {dir} !", "Contact ! Un char {dir}, {distance} mètres !", "Attention, char ennemi {dir}, à {distance} mètres !"],
    abattu: { veteran: ["Cible neutralisée.", "Un de moins.", "Ennemi au sol."], recrue: ["Je l'ai eu ! Je l'ai eu !", "Il est tombé ! C'est moi qui l'ai eu !"], blagueur: ["Et hop, au tapis !", "Un de moins. Qui veut le suivant ?"] },
    charDetruit: ["Char ennemi détruit !", "{cible} est en flammes !", "On a eu {cible} !"],
    joliTir: ["Joli tir, chef !", "Bien joué, chef ! {cible} est détruit !", "En plein dans le mille !"],
    renforts: ["J'ai besoin de renforts !", "Ils sont trop nombreux, envoyez des renforts !", "Je suis seul ici, besoin d'aide !"],
    soin: ["Je te soigne, tiens bon !", "Bouge pas, je te soigne.", "Ça va aller, je m'occupe de toi."],
    soinFini: ["Voilà, tu es comme neuf !", "C'est bon, tu peux y retourner !"],
    repare: ["Je répare ton blindage !", "Je m'occupe du moteur, couvrez-moi !", "Réparation en cours !"],
    repareFini: ["Réparation terminée !", "Ton char est comme neuf !"],
    allieDetruit: ["On a perdu {victime} !", "{victime} est détruit !", "{victime} ne répond plus, il est en flammes !"],
    vehiculeDetruit: ["Véhicule détruit !", "On a perdu un véhicule !"],
    // (demande 99) la tour de contrôle annonce l'état des pistes
    pisteEnnemieFermee: ["Leur piste est hors service ! Plus aucun avion ne décolle !", "Piste ennemie fermée, beau travail !", "Leur piste est criblée de cratères !"],
    pisteEnnemieRouverte: ["Attention, ils ont rebouché leur piste !", "La piste ennemie est rouverte, leurs avions vont redécoller !"],
    notrePisteFermee: ["Notre piste est touchée, plus aucun décollage !", "Piste fermée ! Il faut un ingénieur pour la réparer !"],
    notrePisteRouverte: ["Notre piste est réparée, décollage autorisé !", "Piste rouverte, les avions peuvent partir !"],
  },
  // La radio ennemie interceptée (en français aussi, mais avec la voix grave du Front).
  interceptee: {
    touche: ["Je suis touché ! Où sont les secours ?", "Ils m'ont eu ! Je suis touché !"],
    aTerre: ["Homme à terre ! Ils nous massacrent !", "On a perdu un homme !"],
    grenade: ["Grenade ! À couvert !"],
    renforts: ["Il nous faut des renforts, vite !", "Repliez-vous, ils sont partout !"],
  },
  // ------------------------------------------------------------------ ✍️ (livre de demandes n° 10) DES DISCUSSIONS PLUS RÉALISTES
  // Avant, chaque soldat lançait sa petite phrase tout seul. Maintenant, les soldats SE PARLENT, comme sur une vraie
  // fréquence militaire : un ÉCHANGE, c'est 2 ou 3 soldats qui se répondent (l'appel → la réponse → la confirmation),
  // avec la PROCÉDURE RADIO (« Fox, ici Écho », « Reçu », « Bien copié », « Négatif », « Je répète », « Terminé ») mélangée
  // à des mots de tous les jours. Les mots entre accolades sont remplacés par la VRAIE situation :
  //   {A} {B} {C} : les indicatifs de ceux qui parlent (A appelle, B répond, C ajoute un mot) ; {moi} : toi (« Lion 1 ») ;
  //   {ennemi} / {Ennemi} : « un char », « un sniper », « un hélico », « un blindé », « des fantassins »… ;
  //   {dir} : la direction depuis toi ; {distance} : en mètres ; {grille} : le carré de la carte (« carré Delta 6 ») ;
  //   {lieu} : un repère (« près du mirador n° 2 », « au carrefour de la rue des Tilleuls et de l'avenue Foch ») ;
  //   {nombre} : combien on en voit ; {victime} : le soldat à terre ; {cible} : le char détruit ; {reste} : les chars qui restent.
  // Chaque soldat a un CARACTÈRE (toujours le même) et parle avec SES mots : le VÉTÉRAN calme (procédure parfaite, phrases
  // courtes), la JEUNE RECRUE nerveuse (elle répète, elle hésite), le BLAGUEUR (de l'humour gentil). Une phrase peut être
  // une liste pour tous, ou un objet { veteran: […], recrue: […], blagueur: […] } (sinon « tous »).
  // La MÉMOIRE : les « memoire » dernières phrases ne sont pas redites tout de suite.
  // Les INTERRUPTIONS : un échange URGENT (contact, homme à terre) coupe un bavardage en cours (« coupure » d'abord).
  // Le CALME : après « silence » s sans rien à la radio et sans ennemi en vue, deux soldats parlent de la maison, de la
  // nourriture, du temps qu'il fait… Jamais de gros mots, jamais rien d'horrible.
  echanges: {
    joueur: "Lion 1",
    memoire: 14, // phrases retenues (pas redites tant qu'elles sont dans la mémoire)
    pause: 0.55, // s de blanc entre deux répliques d'un échange (en plus du temps de lecture)
    silence: 38, // s sans phrase et sans ennemi proche avant une petite discussion
    pauseEchange: 7, // s au moins entre deux échanges (sauf urgence)
    parScenario: { contact: 16, hommeATerre: 5, charDetruit: 6, blesse: 12, munitions: 25, sniper: 20, calme: 60, ennemiContact: 22, ennemiPerte: 18, ennemiCalme: 70, perchoirTombe: 8, tireurEnPlace: 30 }, // s entre deux fois le même genre
    chances: { munitions: 0.3, ennemiContact: 0.5, ennemiPerte: 0.6 },
    urgents: ["contact", "hommeATerre", "sniper", "blesse", "perchoirTombe"],
    portee: 260, // m : les soldats qui se parlent sont à moins de 260 m de toi (la nouvelle elle-même peut venir de plus loin)
    coupure: { veteran: ["Silence radio ! Priorité !", "Coupez, coupez !"], recrue: ["Attendez, attendez !", "Stop, stop !"], blagueur: ["On reparlera de ça plus tard !", "Pause café terminée !"] },
    // LES CARACTÈRES (affichage/radio-voix.js règle un peu la voix : le vétéran parle plus lentement et plus grave)
    personnalites: {
      veteran: { nom: "vétéran calme", icone: "🎖️", voix: { vitesse: 0.94, hauteur: 0.97 } },
      recrue: { nom: "jeune recrue nerveuse", icone: "😰", voix: { vitesse: 1.1, hauteur: 1.04 } },
      blagueur: { nom: "blagueur", icone: "😄", voix: { vitesse: 1.02, hauteur: 1.0 } },
    },
    ordre: ["veteran", "recrue", "blagueur", "veteran", "blagueur", "recrue"], // les caractères, à tour de rôle (Écho, Fox, Golf…)
    chars: { Bravo: "veteran", Charlie: "blagueur", Delta: "recrue" },
    ennemis: { indicatifs: ["Vipère 1", "Vipère 2", "Vipère 3", "Corbeau 6", "Faucheur 2"] },
    // les mots pour dire l'ennemi
    menaces: { char: "un char", blinde: "un blindé", helico: "un hélico", avion: "un avion", sniper: "un sniper", roquettes: "un lance-roquettes", fantassin: "un fantassin" },
    pluriels: { char: "chars", blinde: "blindés", helico: "hélicos", avion: "avions", sniper: "snipers", roquettes: "lance-roquettes", fantassin: "fantassins" },
    grille: { taille: 210, lettres: ["Alpha", "Bravo", "Charlie", "Delta", "Écho", "Foxtrot", "Golf", "Hôtel", "India", "Juliette"] },
    rues: { nord: ["rue des Tilleuls", "rue Victor-Hugo", "rue de la Gare", "rue Pasteur", "rue des Écoles", "rue du Marché", "rue Jean-Jaurès", "rue des Lilas", "rue de la Poste", "rue du Moulin", "rue des Remparts", "rue Saint-Michel"],
      est: ["avenue Foch", "boulevard de la Liberté", "avenue de la République", "boulevard Gambetta", "avenue des Peupliers", "avenue du Parc", "boulevard Carnot", "avenue de Verdun", "avenue des Acacias", "boulevard du Lac", "avenue Molière", "avenue des Arts"] },
    // LES SCÉNARIOS : des suites de répliques [qui, phrase] (plusieurs versions : une est tirée au sort)
    scenarios: {
      contact: [[["A", "contactAppel"], ["B", "contactRecu"], ["A", "terminer"]], [["A", "contactAppel"], ["B", "repete"], ["A", "contactRepete"], ["B", "bienCopie"]], [["A", "contactAppel"], ["B", "contactRecu"], ["C", "contactConseil"]]],
      sniper: [[["A", "sniperAppel"], ["B", "sniperRecu"], ["A", "terminer"]], [["A", "sniperAppel"], ["C", "sniperConseil"], ["B", "bienCopie"]]],
      hommeATerre: [[["A", "aTerreAppel"], ["B", "aTerreCouvre"], ["A", "bienCopie"]], [["A", "aTerreAppel"], ["B", "aTerreCouvre"], ["C", "aTerreMedecin"]]],
      charDetruit: [[["A", "detruitAnnonce"], ["B", "detruitBravo"], ["C", "detruitReste"]], [["A", "detruitAnnonce"], ["B", "detruitBravo"]]],
      blesse: [[["A", "blesseAppel"], ["B", "blesseRepond"], ["A", "recu"]]],
      munitions: [[["A", "munitionsAppel"], ["B", "munitionsRepond"], ["A", "merci"]]],
      perchoirTombe: [[["A", "perchoirTombe"], ["B", "perchoirTombeRepond"]]],
      tireurEnPlace: [[["A", "tireurEnPlace"], ["B", "tireurEnPlaceRepond"]]],
      calme: [[["A", "calmeMaison"], ["B", "calmeMaisonRepond"], ["A", "calmeFin"]], [["A", "calmeManger"], ["B", "calmeMangerRepond"], ["C", "calmeFin"]], [["A", "calmeMeteo"], ["B", "calmeMeteoRepond"]], [["A", "calmeBlague"], ["B", "calmeBlagueRepond"], ["C", "calmeSilence"]]],
      ennemiContact: [[["A", "eContact"], ["B", "eRecu"]], [["A", "eContact"], ["B", "eRecu"], ["A", "eFin"]]],
      ennemiPerte: [[["A", "ePerte"], ["B", "ePerteRepond"]]],
      ennemiCalme: [[["A", "eCalme"], ["B", "eCalmeRepond"]]],
    },
    phrases: {
      // la procédure
      terminer: { veteran: ["Affirmatif. Terminé.", "Exact. {A}, terminé."], recrue: ["Oui ! Euh… affirmatif. Terminé.", "C'est ça, c'est ça ! Terminé."], blagueur: ["Tout juste. Terminé, et bon appétit à lui.", "Affirmatif. Je lui garde une place au chaud."] },
      repete: { veteran: ["{A}, ici {B}, je n'ai pas copié la distance. Répétez.", "{A}, message coupé. Répétez, à vous."], recrue: ["Quoi ? {A}, répète, je t'entends mal !", "Euh… {A}, tu peux répéter ? Ça grésille !"], blagueur: ["{A}, ici {B}. J'ai entendu « contact » et puis plus rien. Répète, à vous.", "Répète, {A}, ma radio fait des bruits de friteuse."] },
      contactRepete: { tous: ["Je répète : {ennemi}, {grille}, {distance} mètres {dir}.", "Je répète : {ennemi}, {dir}, {distance} mètres{lieu}."] },
      bienCopie: { veteran: ["Bien copié.", "Bien copié, {A}."], recrue: ["Bien copié ! Bien copié !", "Copié… copié, oui."], blagueur: ["Bien copié, cinq sur cinq.", "Copié, je note tout."] },
      recu: { veteran: ["Reçu.", "Reçu, {B}."], recrue: ["Reçu, reçu !", "Reçu… merci."], blagueur: ["Reçu, chef de rang.", "Reçu, merci du service."] },
      merci: { veteran: ["Reçu, merci.", "Merci, {B}. Terminé."], recrue: ["Merci, merci beaucoup !", "Ouf, merci {B} !"], blagueur: ["Merci, je te revaudrai ça en barres de céréales.", "T'es un frère, {B}."] },
      // un ennemi en vue
      contactAppel: {
        veteran: ["{B}, ici {A}. Contact : {ennemi}, {grille}, {distance} mètres {dir}{lieu}. À vous.", "{B} de {A}. {Ennemi} {dir}, environ {distance} mètres{lieu}. Parlez.", "Ici {A}. {Nombre} {dir}, {distance} mètres. J'observe."],
        recrue: ["{B} ! {B}, ici {A} ! {Ennemi} {dir}, à {distance} mètres ! Il est là !", "{A} à {B}… euh, contact ! {Ennemi}{lieu}, {distance} mètres {dir} !", "Il y a {ennemi} {dir} ! {distance} mètres ! Vous le voyez ?"],
        blagueur: ["{B}, ici {A}. On a de la visite : {ennemi}, {dir}, {distance} mètres. Personne ne l'a invité.", "{B} de {A}. {Ennemi} {dir}{lieu}, {distance} mètres. Il n'a pas l'air de vendre des croissants."],
      },
      contactRecu: {
        veteran: ["{A}, ici {B}. Reçu, {ennemi} {dir}. On le garde à l'œil.", "Bien copié, {A}. Restez à couvert, on s'en occupe.", "Reçu {A}. Je préviens {moi}."],
        recrue: ["Reçu ! Reçu ! Je le vois pas encore… ah si, je le vois !", "Copié… {dir}, c'est bien ça ? D'accord, d'accord !"],
        blagueur: ["Reçu, {A}. Je lui prépare un comité d'accueil.", "Bien copié. On va lui expliquer qu'il s'est trompé d'adresse."],
      },
      contactConseil: { veteran: ["Ici {C}. Pas de précipitation. On attend qu'il se découvre.", "{C} à tous : couvrez-vous, et pas de tir inutile."], recrue: ["Ici {C}… on fait quoi, on fait quoi ?", "{C} ici. Je… je me mets à couvert !"], blagueur: ["Ici {C}. Moi je dis, on lui envoie {moi}, il adore ça.", "{C} ici. Quelqu'un a pensé au pique-nique ?"] },
      sniperAppel: {
        veteran: ["{B}, ici {A}. Tireur d'élite ennemi{lieu}, {grille}. Reflet de lunette {dir}. Restez bas.", "Ici {A}. Sniper {dir}, {distance} mètres{lieu}. Ne restez pas à découvert."],
        recrue: ["Sniper ! Sniper ! {dir}{lieu} ! J'ai vu sa lunette briller !", "{B}, ici {A}, il y a un sniper{lieu}… il nous regarde !"],
        blagueur: ["{B} de {A}. Un sniper s'est installé{lieu}. Belle vue, mauvaise idée.", "Ici {A}. Ça brille {dir}{lieu} : soit un sniper, soit quelqu'un qui fait des selfies."],
      },
      sniperRecu: { veteran: ["Reçu, {A}. Tout le monde à couvert. On le contourne.", "Bien copié. Personne ne traverse à découvert."], recrue: ["Reçu ! Je garde la tête baissée, promis !", "Copié… je bouge plus, je bouge plus."], blagueur: ["Reçu. Je vais marcher accroupi, comme un canard.", "Copié. Il faut lui casser son perchoir."] },
      sniperConseil: { veteran: ["Ici {C}. Un obus de char dans son perchoir, et c'est réglé.", "{C} à tous : fumigène, et on avance par bonds."], recrue: ["{C} ici… quelqu'un peut demander un char ?", "Ici {C}. J'ose plus lever la tête !"], blagueur: ["Ici {C}. Un char qui passe par là pourrait lui faire visiter le sol.", "{C} ici : je propose qu'on lui fasse coucou… de loin."] },
      // homme à terre
      aTerreAppel: { veteran: ["Homme à terre ! {victime} est tombé{lieu} ! Je vais le chercher.", "Ici {A}, homme à terre, {victime}. Je m'en occupe, couvrez-moi."], recrue: ["Homme à terre ! {victime} ! {victime} ne bouge plus ! J'y vais !", "{victime} est tombé ! Je vais le chercher, je vais le chercher !"], blagueur: ["Homme à terre ! {victime}, accroche-toi, j'arrive. Pas de blague cette fois.", "{victime} est tombé ! Je vais le chercher, couvrez-moi !"] },
      aTerreCouvre: { veteran: ["Reçu, {A}. Je te couvre. Vas-y !", "Bien copié. Feu de couverture, maintenant !"], recrue: ["Je te couvre ! Je te couvre ! Vas-y !", "Reçu ! Je tire, vas-y, vite !"], blagueur: ["Vas-y, {A}, je te couvre. Fais vite.", "Je te couvre ! Personne ne lève la tête !"] },
      aTerreMedecin: { tous: ["Ici {C}, j'arrive avec la trousse. Tenez bon.", "{C} en route. On le ramène à l'arrière."] },
      // un char ennemi détruit
      detruitAnnonce: { veteran: ["Cible détruite. {cible} est hors de combat.", "Ici {A}. {cible} neutralisé. Beau travail."], recrue: ["Il est détruit ! {cible} est détruit ! On l'a eu !", "Ouais ! {cible} est en flammes !"], blagueur: ["{cible} est hors service. Je crois qu'il a besoin d'un garagiste.", "Et un char à la casse ! {cible} ne roulera plus."] },
      detruitBravo: { veteran: ["Bien joué. Restez concentrés.", "Bien copié. Beau tir."], recrue: ["Ouais ! Bien joué, bien joué !", "Trop fort ! On les a eus !"], blagueur: ["Bravo ! Qui c'est le patron ? C'est nous !", "Joli tir ! Je l'aurais encadré."] },
      detruitReste: { tous: ["Ici {C}. Il en reste {reste}. On ne relâche pas.", "{C} à tous : encore {reste}, ouvrez l'œil."] },
      // blessé
      blesseAppel: { veteran: ["{B}, ici {A}. Je suis touché. Je peux encore tenir.", "Ici {A}, je suis touché. Rien de grave, je ralentis."], recrue: ["{B} ! Je suis touché ! Je suis touché !", "Ici {A}… aïe ! Je suis touché, venez m'aider !"], blagueur: ["Ici {A}. Touché. Ça pique, mais j'ai connu pire au dentiste.", "{B}, {A} est touché. Prévenez ma mère que je vais bien."] },
      blesseRepond: { veteran: ["Reçu, {A}. Garde la tête basse, on arrive.", "Bien copié. Reste à couvert, le médecin arrive."], recrue: ["J'arrive ! Bouge pas, bouge pas !", "Reçu ! Tiens bon, {A} !"], blagueur: ["Reçu. Reste là, on t'apporte le thé.", "Tiens bon, {A}. Le médecin arrive, il a même des pansements."] },
      // les munitions
      munitionsAppel: { veteran: ["{B}, ici {A}. Munitions basses. Il me reste deux chargeurs.", "Ici {A}. Je suis presque à sec. Une recharge ?"], recrue: ["{B} ! J'ai presque plus de balles ! Plus que deux chargeurs !", "Je suis à court, je suis à court !"], blagueur: ["{B}, ici {A}. Mon fusil a faim, il veut des chargeurs.", "Ici {A}. Plus que deux chargeurs, après je lance des cailloux."] },
      munitionsRepond: { veteran: ["Reçu. Je t'en lance un. Attrape.", "Bien copié, chargeur en route."], recrue: ["J'en ai ! Tiens, attrape ! Oups, pardon !", "Je… oui, je t'en donne un !"], blagueur: ["Livraison express ! Signe ici.", "Attrape ! Et je veux le récupérer, hein."] },
      // un perchoir qui tombe, un tireur d'élite ami installé
      perchoirTombe: { veteran: ["{lieuNom} vient de tomber. Le sniper ne gêne plus.", "Ici {A}. {lieuNom} est à terre."], recrue: ["Whoa ! {lieuNom} s'est écroulé ! Vous avez vu ça ?", "Il est tombé ! {lieuNom} est tombé !"], blagueur: ["{lieuNom} vient de faire une sieste. À l'horizontale.", "Timber ! {lieuNom} est par terre."] },
      perchoirTombeRepond: { tous: ["Bien copié. On avance.", "Reçu. Voie libre."] },
      tireurEnPlace: { veteran: ["Ici {A}. En position sur {lieuNom}. Je couvre le secteur.", "{A} en place, {lieuNom}. Belle vue."], recrue: ["Ici {A}… je suis en haut ! C'est haut, quand même !", "{A} en position sur {lieuNom}. Je vois tout d'ici !"], blagueur: ["Ici {A}. Installé sur {lieuNom}. Vue imprenable, service en chambre pas compris.", "{A} en position. Si quelqu'un a des jumelles, on fait la visite."] },
      tireurEnPlaceRepond: { tous: ["Reçu, {A}. Ouvre l'œil.", "Bien copié. Tu nous couvres."] },
      // le calme (pas d'ennemi en vue depuis un moment)
      calmeMaison: { veteran: ["{B}, tu sais ce qui me manque ? Le bruit de la mer, chez moi.", "Quand tout ça sera fini, je retourne à mon jardin. Mes tomates m'attendent."], recrue: ["{B}… tu crois qu'on sera rentrés pour Noël ?", "Ma sœur m'a écrit. Elle a eu son permis. Elle a raté le créneau trois fois."], blagueur: ["{B}, si on rentre, je t'invite chez ma grand-mère. Elle fait la meilleure tarte du pays.", "Mon chien doit se demander où je suis. Il doit dormir sur mon lit, ce traître."] },
      calmeMaisonRepond: { veteran: ["On rentrera, {A}. Un jour à la fois.", "Garde ça en tête. Ça aide à tenir."], recrue: ["Moi aussi, ça me manque… beaucoup.", "J'espère… j'espère vraiment."], blagueur: ["Une tarte ? Je signe tout de suite.", "Ton chien a bien raison. Moi aussi, je dormirais sur ton lit."] },
      calmeManger: { veteran: ["Encore des rations ce soir. Haricots ou haricots.", "{B}, il reste du café dans ta gourde ?"], recrue: ["J'ai trop faim… quelqu'un a un biscuit ?", "Vous croyez qu'il y aura du chaud ce soir ?"], blagueur: ["Le chef a dit « surprise » pour le dîner. J'ai peur.", "Si je vois encore un haricot, je lui donne un grade."] },
      calmeMangerRepond: { veteran: ["Mange quand tu peux, dors quand tu peux.", "Il reste une barre. Tiens."], recrue: ["Moi j'ai que du chewing-gum…", "Arrête, tu me donnes faim !"], blagueur: ["La surprise, c'est qu'il n'y a pas de surprise.", "Haricots au menu, haricots en dessert."] },
      calmeMeteo: { veteran: ["Le vent tourne. Il va pleuvoir avant ce soir.", "Belle lumière. Mauvais pour se cacher."], recrue: ["Il fait froid, non ? Ou c'est juste moi ?", "Il va pleuvoir… on va être trempés."], blagueur: ["Météo du jour : quelques nuages, et des obus en fin d'après-midi.", "Il fait beau. C'est presque des vacances. Presque."] },
      calmeMeteoRepond: { veteran: ["Reçu. Gardez vos affaires au sec.", "Profitez du calme."], recrue: ["Ouais… j'aime pas la pluie.", "Moi j'ai froid aux pieds."], blagueur: ["Je réserve une chaise longue.", "Je mets de la crème solaire, alors."] },
      calmeBlague: { blagueur: ["{B}, tu sais pourquoi les chars n'ont pas peur ? Parce qu'ils ont du blindage… au cœur.", "Quelle est la différence entre un char et un escargot ? L'escargot, il a sa maison, mais pas de canon."], veteran: ["{B}, tu te souviens du sergent qui avait perdu son casque… sur sa tête ?", "On m'a dit que tu ronflais comme un moteur de char, {B}."], recrue: ["{B}, c'est vrai que tu as pris le mauvais camion le premier jour ?", "Quelqu'un connaît une blague ? Je m'ennuie un peu…"] },
      calmeBlagueRepond: { veteran: ["Très drôle. Reste concentré quand même.", "Ha. Bon. Silence radio, maintenant."], recrue: ["Ha ha ! Elle est nulle… mais j'ai ri !", "Hi hi ! Encore une !"], blagueur: ["Ha ! Celle-là, je la garde.", "Elle est bonne, celle-là !"] },
      calmeFin: { tous: ["Allez. On garde l'œil ouvert.", "Bon. Silence radio, on reste vigilants."] },
      calmeSilence: { tous: ["Ici {C}. Fin de la récréation, on surveille le secteur.", "{C} à tous : on se tait et on écoute."] },
      // la radio ENNEMIE (interceptée)
      eContact: { tous: ["{B}, ici {A}. {Ennemi} de Valdrie en vue, {distance} mètres. Je l'engage.", "Ici {A}. Contact ! {Ennemi} à {distance} mètres. Où sont les renforts ?", "{A} à {B}. Ils avancent vers nous. Ouvrez le feu !"] },
      eRecu: { tous: ["Reçu, {A}. Tenez la position, on arrive.", "Négatif, {A}, pas de renfort. Tenez bon.", "Reçu. Repliez-vous sur les maisons."] },
      eFin: { tous: ["Compris. Terminé.", "Reçu. On tient."] },
      ePerte: { tous: ["{B}, ici {A}. On a un homme à terre ! Ils sont trop nombreux !", "Ici {A}… on a perdu un homme. Demande instructions."] },
      ePerteRepond: { tous: ["Reçu, {A}. Repliez-vous, je répète, repliez-vous.", "Tenez la ligne, {A}. Le Maréchal ne veut pas de recul."] },
      eCalme: { tous: ["{B}, ici {A}. Rien à signaler sur mon secteur.", "Ici {A}. Le café est froid et les ordres ne viennent pas."] },
      eCalmeRepond: { tous: ["Reçu. Restez en alerte.", "Silence sur la fréquence, {A}. Ils écoutent peut-être."] },
    },
  },
  // Les mots de la boussole (0 = nord, puis dans le sens des aiguilles d'une montre). Le nord, c'est vers le camp ennemi.
  boussole: ["au nord", "au nord-est", "à l'est", "au sud-est", "au sud", "au sud-ouest", "à l'ouest", "au nord-ouest"],
  nombres: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf", "vingt"],
};

// ✍️ (demande 101) LES CINÉMATIQUES : des films joués DANS le jeu (le vrai décor 3D, les vrais soldats), comme au cinéma :
// bandes noires, titres, sous-titres, voix de la radio, musique. Entrée ou Échap : passer.
// Un film se lance par son nom (par exemple un chapitre de la campagne : « films: { ouverture: "ouverture-oasis" } »).
// Pour écrire un NOUVEAU film, il suffit d'ajouter ses données dans « films » (pas besoin de toucher au code) :
//   titre, musique (le volume de la musique, de 0 à 1, × celui du menu), passable (false : on ne peut pas passer),
//   decor : { feux: [[x, z, force], …] } (des feux et des colonnes de fumée allumés pendant le film seulement),
//   acteurs : les GROUPES de soldats (de vrais soldats du monde, empruntés pendant le film) :
//     { id, prendre: "allies" | "ennemis" | "toi", nombre (0 = tous), proches: [x, z] (on prend les plus proches de ce
//       point), avecToi: rang (ton soldat marche dans ce groupe, à ce rang), chef: "volk" (le 1er du groupe est ce
//       personnage : il parle, on le filme avec « groupe.chef »), chemin: [[x, z], …], vitesse (m/s), depart (s),
//       formation: "colonne" | "ligne" | "coin", ecart (m entre deux rangs), largeur (m entre les 2 files),
//       arme: "levee" | "basse", garde (rad : à l'arrêt, chacun surveille son côté),
//       tactique: { balaye, retourne, accroupi } (la chance de chaque geste, à chaque fois qu'un soldat en fait un) }
//   actions : [{ a (s), acteur: "escouade" | "escouade.chef" | "escouade.3" | "toi", faire: "marche" | "halte" |
//     "seTourne" (vers: [x, z] ou un acteur) | "balaye" | "retourne" | "accroupi" | "debout" | "signe" | "arme" (levee) , duree }]
//   repliques : [{ a (s), qui (un personnage de campagne.personnages), texte, duree (s, sinon selon la longueur),
//     radio: true (à la radio, de loin ; sinon il parle en face) }]
//   plans : les morceaux du film, l'un après l'autre. Chacun : { nom, duree (s), camera, titre, fondu, musique,
//     actions, repliques (leur « a » compte depuis le début de CE plan) }.
//     camera : { type: "travelling" (de: { oeil, cible } → a: { oeil, cible } ; un point = [x, hauteur au-dessus du sol, z]) ·
//                "suivre" (acteur, de: [en arrière, hauteur, sur le côté] → a: […], repere: "chemin" | "regard",
//                  regard: un acteur ou [x, h, z], regardHauteur) ·
//                "orbite" (acteur, rayon, hauteur, de → a : angles en rad autour de lui, regardHauteur) ·
//                "rejoindre" (la caméra glisse jusque derrière ton soldat : la main est rendue sans coupure) ·
//                courbe: "doux" | "lineaire", tremble (m : la caméra à l'épaule) }
//     titre : { etiquette, grand, petit, de (s), a (s) } · fondu : { entree (s), sortie (s) } (au noir).
Tanks.CONFIG.cinematiques = {
  regles: {
    bandes: 0.11, // la hauteur de chaque bande noire (part de l'écran)
    bandesEntree: 1.2, // s : les bandes arrivent au début du film
    replique: { base: 2.4, parLettre: 0.055, max: 9 }, // s : la durée d'une réplique sans « duree » = base + parLettre × lettres
    tourne: 2.6, // rad/s : un acteur tourne au plus à cette vitesse
    rattrape: 1.6, // × la vitesse du groupe : un soldat en retard rattrape sa place
    entreGestes: [2.5, 6], // s : le temps entre deux gestes d'un même soldat (au hasard entre les deux)
    signe: 0.5, // s : le geste « on avance ! » (le bras en arrière puis en avant)
    tourneChar: 0.9, // rad/s : un char du film tourne au plus à cette vitesse (morceau 2)
    fete: { toutesLes: 1.1, saut: 0.28 }, // (morceau 2) « celebre » : un bras levé et un saut de 0,28 m toutes les 1,1 s environ
    gestes: {
      balaye: { duree: 2.4, angle: 0.75, allers: 1.5, tourne: 7.5, ralenti: 0.45 }, // ± 0,75 rad (43°), 1,5 aller-retour, 7,5 rad/s
      retourne: { duree: 2.6, tourne: 4.5 }, // il s'arrête, se retourne (4,5 rad/s) et surveille derrière
      accroupi: { duree: 2.2 }, // il s'accroupit en visant un instant
    },
    passer: "Entrée · Échap : passer",
  },
  films: {
    // ✍️ LA CINÉMATIQUE D'OUVERTURE DE LA CAMPAGNE (chapitre 1, l'oasis de Tamerin), environ 85 s.
    "ouverture-oasis": {
      titre: "Ouverture · Le réveil du lion",
      musique: 0.75,
      decor: { feux: [[-23, 12, 1.6], [25, 40, 1.4], [-45, -22, 1.8], [12, 90, 1.2], [-12, 55, 1.3], [44, -12, 1.6], [62, 24, 1.2], [-58, -56, 1.5], [6, 150, 1.0], [-30, 100, 1.1]] },
      acteurs: [
        { id: "escouade", prendre: "allies", nombre: 0, avecToi: 2, chef: "volk", chemin: [[0, 268], [0, 198]], vitesse: 0.85, depart: 0,
          formation: "colonne", ecart: 2.6, largeur: 1.5, arme: "levee", garde: 1.0, tactique: { balaye: 0.4, retourne: 0.25, accroupi: 0.2 } },
        { id: "patrouille", prendre: "ennemis", nombre: 3, proches: [-25, 60], chemin: [[-34, 98], [-34, 60], [-34, 20]], vitesse: 1.0, depart: 0,
          formation: "colonne", ecart: 3.2, largeur: 1.2, arme: "levee", tactique: { balaye: 0.55, retourne: 0.3 } },
        { id: "garnison", prendre: "ennemis", nombre: 3, proches: [0, 0], chemin: [[0, 30], [0, -10]], vitesse: 0.6, depart: 0,
          formation: "ligne", ecart: 3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.3 } },
      ],
      plans: [
        { nom: "la ville dévastée", duree: 10, fondu: { entree: 2.2 },
          camera: { type: "travelling", de: { oeil: [150, 62, 235], cible: [0, 4, 30] }, a: { oeil: [72, 30, 150], cible: [-12, 3, 25] } },
          titre: { etiquette: "Chapitre 1 / 6 · Les Lions de Valdrie", grand: "LE RÉVEIL DU LION", petit: "Oasis de Tamerin · province de Sahrane · 14 mars 2041 · 05 h 42", de: 1.8, a: 9.2 },
          repliques: [{ a: 4.5, qui: "hargrave", texte: "Ici Rempart. Trois jours sans radio, sans radar, sans satellites. Le désert est devenu muet.", duree: 5.2, radio: true }] },
        { nom: "la patrouille ennemie", duree: 9,
          camera: { type: "suivre", acteur: "patrouille", de: [-13, 1.7, 4.5], a: [-8.5, 1.5, 3], regardHauteur: 1.3, tremble: 0.07 },
          repliques: [{ a: 1, qui: "varrok", texte: "Patrouille trois, rien dans les ruelles. L'oasis et son relais sont au Front. Que personne ne passe.", duree: 6.5, radio: true }] },
        { nom: "l'escouade avance", duree: 10,
          camera: { type: "suivre", acteur: "escouade", de: [-17, 1.4, 6], a: [-11, 1.6, 3.5], regardHauteur: 1.2, tremble: 0.06 },
          repliques: [{ a: 2.5, qui: "volk", texte: "Doucement, les Lions. Restez groupés. Les yeux partout.", duree: 4.5 }] },
        { nom: "il balaie la rue", duree: 6,
          camera: { type: "suivre", acteur: "escouade.3", de: [-2.9, 1.55, 1.3], a: [-2.2, 1.5, 0.9], regardHauteur: 1.45, tremble: 0.04 },
          actions: [{ a: 0, acteur: "escouade.3", faire: "balaye", duree: 5.5 }] },
        { nom: "il surveille derrière", duree: 6,
          camera: { type: "orbite", acteur: "escouade.7", rayon: 4.6, hauteur: 1.7, de: 2.5, a: 1.5, regardHauteur: 1.3 },
          actions: [{ a: 0.2, acteur: "escouade.7", faire: "retourne", duree: 5 }, { a: 1, acteur: "escouade.6", faire: "accroupi" }, { a: 4, acteur: "escouade.6", faire: "debout" }] },
        { nom: "vers la ville", duree: 7,
          camera: { type: "suivre", acteur: "escouade", de: [9, 2.2, -2.2], a: [11, 2.8, -3], regard: [0, 6, 70], tremble: 0.1 },
          actions: [{ a: 3.5, acteur: "escouade.chef", faire: "signe" }] },
        { nom: "halte", duree: 5,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [7.5, 1.9, 2.6], a: [5, 1.75, 1.6], regardHauteur: 1.5 },
          actions: [{ a: 0, acteur: "escouade", faire: "halte" }, { a: 0.7, acteur: "escouade.chef", faire: "seTourne", vers: "toi" }, { a: 0.7, acteur: "escouade.chef", faire: "arme", levee: false }, { a: 2.2, acteur: "toi", faire: "seTourne", vers: "escouade.chef" }, { a: 1.2, acteur: "escouade.4", faire: "accroupi" }, { a: 1.6, acteur: "escouade.5", faire: "accroupi" }],
          repliques: [{ a: 1.4, qui: "volk", texte: "Halte. Tout le monde à couvert. Lion 1, approche.", duree: 3.4 }] },
        { nom: "le commandant explique", duree: 14,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [4.2, 1.75, -1.3], a: [2.8, 1.66, -0.85], regardHauteur: 1.58 },
          repliques: [
            { a: 0.4, qui: "volk", texte: "Écoute-moi bien. Il y a trois jours, toutes les radios de Valdrie se sont tues. Plus de radar, plus de satellites.", duree: 6.6 },
            { a: 7.2, qui: "volk", texte: "Cette nuit, le Front de Varrok a pris l'oasis de Tamerin et son relais radio : le dernier du désert.", duree: 6.4 },
          ] },
        { nom: "ton escouade écoute", duree: 7.5,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [-1.9, 1.78, 0.75], a: [-1.6, 1.74, 0.6], regard: "toi", regardHauteur: 1.45, tremble: 0.02 },
          repliques: [{ a: 0.2, qui: "volk", texte: "On entre par le sud, on nettoie les ruelles, et on tient la place du puits pendant qu'on répare le relais.", duree: 7 }] },
        { nom: "en avant", duree: 6.5,
          camera: { type: "suivre", acteur: "escouade.chef", repere: "chemin", de: [2.5, 1.68, -0.95], a: [2.0, 1.62, -0.7], regardHauteur: 1.58 },
          actions: [{ a: 3.8, acteur: "escouade.chef", faire: "signe" }, { a: 4.6, acteur: "toi", faire: "seTourne", vers: [0, 128] }, { a: 5, acteur: "escouade.chef", faire: "seTourne", vers: [0, 128] }, { a: 5, acteur: "escouade", faire: "debout" }],
          repliques: [{ a: 0.2, qui: "volk", texte: "Sans ce relais, l'Alliance est sourde et aveugle. Lion 1, tu restes avec moi. En avant !", duree: 6 }] },
        { nom: "derrière toi", duree: 4.5, musique: 0.25,
          camera: { type: "rejoindre" } },
      ],
    },
  },
};

// ✍️ (demande 101, morceau 2) LES 12 CINÉMATIQUES DE FIN DE MISSION : « À chaque fin de mission, une cinématique plus courte
// que la première, de 50 à 90 secondes. Elle expliquera les conséquences de ta mission : si tu l'as échouée, ce qui se
// passe, et si tu l'as réussie, ce qui se passe. » Une réussite et un échec pour chacun des 6 chapitres (campagne :
// chapitres[…].films). Elles passent juste avant l'écran de fin. Les acteurs sont des FIGURANTS (prendre: "figurants"
// ou "chars", camp: "bleus" ou "rouges") : engagés rien que pour le film, ils marchent même si ton soldat est à terre.
// « places » : [[x, z, angle], …] = des places fixes (une épave, un groupe qui attend) au lieu d'un chemin ;
// « epave: true » : des chars détruits qui brûlent ; action « celebre » (duree) : ils sautent de joie, le bras levé.
// Un titre peut avoir « couleur », « taille » et « haut » (une ligne au-dessus de l'étiquette).
(function () {
  const OK = "#ffcf5a", RATE = "#ff5a4a";
  const accompli = (n, titre, extra) => Object.assign({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ACCOMPLIE", couleur: OK, de: 1, a: 8.5 }, extra || {});
  const echoue = (n, titre, extra) => Object.assign({ etiquette: "Chapitre " + n + " · " + titre, grand: "MISSION ÉCHOUÉE", couleur: RATE, de: 1, a: 8.5 }, extra || {});
  const suite = (n, titre, petit) => ({ etiquette: "La suite · chapitre " + n, grand: titre, petit, de: 3.5, a: 10.5 });
  Object.assign(Tanks.CONFIG.cinematiques.films, {
    // ---------------------------------------------------------------- chapitre 1 : l'oasis de Tamerin
    "fin-oasis-reussite": {
      titre: "Chapitre 1 · réussite", musique: 0.6,
      decor: { feux: [[0, -40, 1.6], [-23, 12, 1], [44, -12, 1], [25, 40, 0.8]] },
      acteurs: [
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 150], [0, 118]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.4, retourne: 0.2 } },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[0, -60], [0, -230]], vitesse: 2.7, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "char", prendre: "chars", camp: "bleus", nombre: 1, nom: "Lion", chemin: [[16, 262], [6, 175]], vitesse: 4, depart: 30 },
        { id: "epave", prendre: "chars", camp: "rouges", nombre: 1, nom: "Scorpion", epave: true, places: [[0, -40, 1.57]] },
      ],
      plans: [
        { nom: "l'oasis libérée", duree: 10, fondu: { entree: 1.5 }, titre: accompli(1, "Le réveil du lion"),
          camera: { type: "travelling", de: { oeil: [120, 55, 200], cible: [0, 4, 0] }, a: { oeil: [60, 35, 150], cible: [0, 2, 20] } },
          repliques: [{ a: 3, qui: "hargrave", radio: true, duree: 6.5, texte: "Ici Rempart. Le relais de Tamerin émet de nouveau. Pour la première fois depuis trois jours… on vous entend, Lions." }] },
        { nom: "le Front s'enfuit", duree: 8, camera: { type: "suivre", acteur: "front", de: [-11, 1.8, 3], a: [-7, 1.6, 2], regardHauteur: 1.3, tremble: 0.08 },
          repliques: [{ a: 1, qui: "varrok", radio: true, duree: 6, texte: "Tamerin est perdue. Unités du désert, repliez-vous vers le nord. Sauvez les camions !" }] },
        { nom: "les Lions entrent dans l'oasis", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-10, 1.6, 3], a: [-6, 1.5, 2], regardHauteur: 1.3 },
          actions: [{ a: 3, acteur: "lions", faire: "halte" }, { a: 3.3, acteur: "lions", faire: "celebre", duree: 16 }],
          repliques: [{ a: 3.5, qui: "volk", duree: 5, texte: "L'oasis est à nous ! Les Lions, vous avez été magnifiques." }] },
        { nom: "la joie", duree: 8, camera: { type: "orbite", acteur: "lions", rayon: 8, hauteur: 2.2, de: 0.8, a: 2.2, regardHauteur: 1.2 } },
        { nom: "ton char arrive", duree: 8, camera: { type: "suivre", acteur: "char", de: [-15, 3, 6], a: [-11, 2.5, 4], regardHauteur: 2 },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "Le relais a déjà capté un message du Front : un convoi de ravitaillement traverse le désert de Sahrane." }] },
        { nom: "la route du désert", duree: 12, fondu: { sortie: 2 }, titre: suite(2, "LA ROUTE DE CENDRE", "En char : intercepte le convoi et fais taire la batterie antiaérienne."),
          camera: { type: "travelling", de: { oeil: [0, 8, 140], cible: [0, 3, 40] }, a: { oeil: [0, 45, 190], cible: [0, 0, -300] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 7, texte: "Ce convoi nourrit l'avant-garde de Varrok. Reposez-vous cette nuit, Lions : demain, on coupe cette route." }] },
      ],
    },
    "fin-oasis-echec": {
      titre: "Chapitre 1 · échec", musique: 0.4,
      decor: { feux: [[0, 0, 1.8], [12, 90, 1.2], [-23, 12, 1.5], [6, 150, 1], [44, -12, 1]] },
      acteurs: [
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 140], [0, 290]], vitesse: 1.6, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 8, chemin: [[0, -20], [0, 125]], vitesse: 1.0, formation: "colonne", ecart: 2.8, arme: "levee", tactique: { balaye: 0.5, retourne: 0.2 } },
        { id: "chars", prendre: "chars", camp: "rouges", nombre: 1, nom: "Scorpion", chemin: [[0, -330], [0, -90]], vitesse: 4 },
      ],
      plans: [
        { nom: "l'oasis tombée", duree: 9, fondu: { entree: 1.5 }, titre: echoue(1, "Le réveil du lion"),
          camera: { type: "travelling", de: { oeil: [120, 55, 200], cible: [0, 4, 0] }, a: { oeil: [70, 38, 160], cible: [0, 2, 10] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 5.8, texte: "Ici le Maréchal Varrok. Tamerin est à moi, et son relais aussi. Valdrie restera sourde." }] },
        { nom: "le Front avance", duree: 8, camera: { type: "suivre", acteur: "front", de: [-11, 1.7, 3], a: [-7, 1.5, 2], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "les Lions se replient", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-12, 1.8, -3], a: [-8, 1.6, -2], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "volk", duree: 5, texte: "On ne peut pas tenir ! Repliez-vous dans les dunes, je couvre !" }] },
        { nom: "un char dans l'oasis", duree: 8, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 6], a: [-12, 2.6, 4], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "hargrave", radio: true, duree: 6, texte: "Un char du Front dans l'oasis… Lions, décrochez. Ne perdez pas un seul homme." }] },
        { nom: "dans les dunes", duree: 8, camera: { type: "orbite", acteur: "lions", rayon: 10, hauteur: 3, de: 2, a: 3, regardHauteur: 1.2 },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "Sans le relais, nous sommes aveugles. Le Front va ravitailler ses troupes sans être vu." }] },
        { nom: "Tamerin brûle", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: { grand: "L'OASIS EST TOMBÉE", couleur: RATE, petit: "Le relais reste muet. Mais les Lions ne renoncent jamais : réessaie la mission pour libérer Tamerin.", de: 3, a: 11 },
          camera: { type: "travelling", de: { oeil: [-40, 6, 230], cible: [0, 4, 0] }, a: { oeil: [-60, 40, 300], cible: [0, 2, 0] } },
          repliques: [{ a: 0.5, qui: "volk", duree: 3.5, texte: "On reviendra, Lion 1. On reviendra." }] },
      ],
    },
    // ---------------------------------------------------------------- chapitre 2 : la route de cendre (désert)
    "fin-route-reussite": {
      titre: "Chapitre 2 · réussite", musique: 0.6,
      decor: { feux: [[-300, -170, 1.6], [-330, -165, 1.4], [-270, -178, 1.4], [-112, -495, 1.2], [-82, -515, 1.2], [-128, -528, 1.2]] },
      acteurs: [
        { id: "epaves", prendre: "chars", camp: "rouges", epave: true, nom: "Convoi", places: [[-300, -170, 0.1], [-330, -165, 0.05], [-270, -178, 0.2]] },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-262, -140], [-262, -150]], vitesse: 0.6, formation: "ligne", ecart: 2.2, arme: "levee" },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 7, chemin: [[-120, -470], [-170, -720]], vitesse: 2.8, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "marteau", prendre: "chars", camp: "bleus", nombre: 3, nom: "Marteau", chemin: [[-250, -60], [-250, -300], [-200, -560]], vitesse: 5, depart: 25, formation: "colonne", ecart: 16, largeur: 0 },
      ],
      plans: [
        { nom: "le convoi brûle", duree: 10, fondu: { entree: 1.5 }, titre: accompli(2, "La route de cendre"),
          camera: { type: "travelling", de: { oeil: [-200, 45, -60], cible: [-300, 2, -170] }, a: { oeil: [-360, 30, -90], cible: [-300, 2, -175] } },
          repliques: [{ a: 3.5, qui: "dorn", radio: true, duree: 5.5, texte: "Le convoi brûle encore. Pas une goutte d'essence n'arrivera à Varrok." }] },
        { nom: "les Lions fêtent", duree: 9, camera: { type: "orbite", acteur: "lions", rayon: 8, hauteur: 2, de: 1, a: 2.4, regardHauteur: 1.2 },
          actions: [{ a: 0, acteur: "lions", faire: "celebre", duree: 16 }],
          repliques: [{ a: 2, qui: "tonnerre", radio: true, duree: 6, texte: "Ici Tonnerre. La batterie Épine s'est tue : le ciel du désert est à nous !" }] },
        { nom: "le Front s'enfuit", duree: 8, camera: { type: "suivre", acteur: "front", de: [-12, 1.8, 4], a: [-8, 1.6, 3], regardHauteur: 1.3, tremble: 0.08 },
          repliques: [{ a: 1, qui: "varrok", radio: true, duree: 6.5, texte: "Unités du désert, repliez-vous vers la vallée de Morvane. Tous mes chars, rassemblement !" }] },
        { nom: "Marteau roule vers le nord", duree: 10, camera: { type: "suivre", acteur: "marteau", de: [26, 6, 10], a: [18, 4, 8], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "dorn", radio: true, duree: 4.5, texte: "Marteau, en colonne derrière moi. Direction le nord !" }] },
        { nom: "le chef de char", duree: 8, camera: { type: "suivre", acteur: "marteau.0", de: [-16, 2.6, 5], a: [-11, 2.1, 3], regardHauteur: 2 },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "Varrok rassemble ses blindés dans la vallée de Morvane, sur la route de la capitale." }] },
        { nom: "vers la vallée", duree: 12, fondu: { sortie: 2 }, titre: suite(3, "L'ENCLUME", "La grande bataille : brise la ligne de chars, prends le village, abats le Mammouth."),
          camera: { type: "travelling", de: { oeil: [-250, 30, -350], cible: [-150, 5, -800] }, a: { oeil: [-250, 70, -420], cible: [0, 0, -1000] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 8, texte: "Toute la 7e Brigade se prépare : ce sera l'opération Enclume. Et toi, Lion 1, tu seras la pointe de l'attaque." }] },
      ],
    },
    "fin-route-echec": {
      titre: "Chapitre 2 · échec", musique: 0.4,
      decor: { feux: [[-200, -120, 1.6], [-112, -470, 0.8]] },
      acteurs: [
        { id: "convoi", prendre: "chars", camp: "rouges", nombre: 4, nom: "Convoi", chemin: [[-620, -140], [-320, -170], [0, -230], [240, -330]], vitesse: 6, formation: "colonne", ecart: 18, largeur: 0 },
        { id: "fete", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[-100, -470], [-100, -476]], vitesse: 0.5, formation: "ligne", ecart: 2.2, arme: "levee" },
        { id: "marteau", prendre: "chars", camp: "bleus", nombre: 2, nom: "Marteau", chemin: [[-250, 150], [-250, 330]], vitesse: 4, formation: "colonne", ecart: 16, largeur: 0 },
        { id: "epave", prendre: "chars", camp: "bleus", epave: true, nom: "Marteau 2", places: [[-200, -120, 2]] },
      ],
      plans: [
        { nom: "le convoi passe", duree: 9, fondu: { entree: 1.5 }, titre: echoue(2, "La route de cendre"),
          camera: { type: "travelling", de: { oeil: [-450, 40, -40], cible: [-560, 2, -150] }, a: { oeil: [-380, 30, -60], cible: [-470, 2, -160] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 6, texte: "Le convoi passe. Mon avant-garde aura son essence, et vos avions resteront au sol." }] },
        { nom: "la colonne du Front", duree: 8, camera: { type: "suivre", acteur: "convoi", de: [-30, 5, 12], a: [-22, 3.5, 9], regardHauteur: 2 } },
        { nom: "la batterie fête", duree: 8, camera: { type: "orbite", acteur: "fete", rayon: 9, hauteur: 2.5, de: 0.5, a: 1.6, regardHauteur: 1.2 },
          actions: [{ a: 0, acteur: "fete", faire: "celebre", duree: 10 }],
          repliques: [{ a: 1, qui: "tonnerre", radio: true, duree: 6, texte: "Ici Tonnerre. La batterie tire toujours : impossible de passer. On fait demi-tour." }] },
        { nom: "Marteau décroche", duree: 9, camera: { type: "suivre", acteur: "marteau", de: [-20, 3.5, 6], a: [-15, 3, 5], regardHauteur: 2 },
          repliques: [{ a: 0.5, qui: "dorn", radio: true, duree: 7.5, texte: "Marteau, on décroche ! On a perdu Marteau 2… l'équipage est sorti à temps, on les a récupérés." }] },
        { nom: "l'épave", duree: 8, camera: { type: "orbite", acteur: "epave", rayon: 14, hauteur: 4, de: 0, a: 1, regardHauteur: 1.5 },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "Avec cette essence, les chars de Varrok vont rouler jusqu'à la vallée de Morvane." }] },
        { nom: "la route est ouverte", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: { grand: "LA ROUTE EST OUVERTE", couleur: RATE, petit: "Le Front se ravitaille… Réessaie la mission pour couper la route du désert.", de: 3, a: 11 },
          camera: { type: "travelling", de: { oeil: [-150, 20, -120], cible: [0, 2, -230] }, a: { oeil: [-200, 60, -60], cible: [100, 0, -300] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6, texte: "Rentre à la base, Lion 1. On recommencera, et cette fois, on les arrêtera." }] },
      ],
    },
    // ---------------------------------------------------------------- chapitre 3 : l'enclume (la grande bataille)
    "fin-enclume-reussite": {
      titre: "Chapitre 3 · réussite", musique: 0.65,
      decor: { feux: [[300, -560, 2], [90, -170, 1.4], [-90, -170, 1.4], [-210, -90, 1.2], [0, -40, 1]] },
      acteurs: [
        { id: "epaves", prendre: "chars", camp: "rouges", epave: true, nom: "Épave", places: [[300, -560, 1.2], [90, -170, 2], [-90, -170, 1]] },
        { id: "front", prendre: "chars", camp: "rouges", nombre: 3, nom: "Front", chemin: [[0, -260], [0, -760]], vitesse: 6, formation: "colonne", ecart: 18, largeur: 0 },
        { id: "fuyards", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[20, -220], [20, -520]], vitesse: 2.8, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "marteau", prendre: "chars", camp: "bleus", nombre: 3, nom: "Marteau", chemin: [[0, 280], [0, 70]], vitesse: 5, depart: 12, formation: "colonne", ecart: 16, largeur: 0 },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 9, chemin: [[0, 50], [0, 20]], vitesse: 1, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.3 } },
      ],
      plans: [
        { nom: "le Mammouth en feu", duree: 10, fondu: { entree: 1.5 }, titre: accompli(3, "L'enclume"),
          camera: { type: "travelling", de: { oeil: [150, 70, -300], cible: [300, 3, -560] }, a: { oeil: [220, 40, -430], cible: [300, 3, -560] } },
          repliques: [{ a: 3, qui: "dorn", radio: true, duree: 6, texte: "Le Mammouth est en feu ! Leur chef a perdu son char de commandement !" }] },
        { nom: "le Front recule", duree: 8, camera: { type: "suivre", acteur: "front", de: [24, 5, 8], a: [32, 8, 10], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "varrok", radio: true, duree: 5, texte: "… Repliez-vous… Tout le monde, repliez-vous sur Valcourt !" }] },
        { nom: "Marteau entre dans la vallée", duree: 9, camera: { type: "suivre", acteur: "marteau", de: [-22, 3, 6], a: [-16, 2.5, 4], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "hargrave", radio: true, duree: 7, texte: "À toutes les unités : la vallée de Morvane est libre. L'opération Enclume est un succès !" }] },
        { nom: "le village est à nous", duree: 9, camera: { type: "orbite", acteur: "lions", rayon: 8, hauteur: 2.2, de: 0.5, a: 2, regardHauteur: 1.2 },
          actions: [{ a: 0, acteur: "lions", faire: "halte" }, { a: 0.2, acteur: "lions", faire: "celebre", duree: 14 }],
          repliques: [{ a: 1, qui: "volk", duree: 4.5, texte: "On a tenu le village ! Bravo, les Lions !" }] },
        { nom: "les fuyards", duree: 8, camera: { type: "suivre", acteur: "fuyards", de: [-11, 1.8, 3], a: [-7, 1.6, 2], regardHauteur: 1.3, tremble: 0.08 } },
        { nom: "vers Valcourt", duree: 12, fondu: { sortie: 2 }, titre: suite(4, "LES RUES DE VALCOURT", "Escorte le camion de vivres jusqu'à la mairie, à travers les rues."),
          camera: { type: "travelling", de: { oeil: [0, 10, 120], cible: [0, 4, 0] }, a: { oeil: [0, 60, 250], cible: [0, 0, -600] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 8, texte: "Le Front recule vers Valcourt, notre capitale. Des milliers d'habitants y attendent de l'aide depuis des semaines." }] },
      ],
    },
    "fin-enclume-echec": {
      titre: "Chapitre 3 · échec", musique: 0.4,
      decor: { feux: [[-40, 180, 1.6], [50, 220, 1.6], [0, 0, 1.2], [-20, 60, 1], [30, -30, 1]] },
      acteurs: [
        { id: "front", prendre: "chars", camp: "rouges", nombre: 4, nom: "Front", chemin: [[0, -420], [0, 0], [0, 320]], vitesse: 6, formation: "colonne", ecart: 18, largeur: 0 },
        { id: "epaves", prendre: "chars", camp: "bleus", epave: true, nom: "Marteau", places: [[-40, 180, 1], [50, 220, 2]] },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 330], [0, 530]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
        { id: "fete", prendre: "figurants", camp: "rouges", nombre: 7, chemin: [[0, 30], [0, 12]], vitesse: 1, formation: "colonne", ecart: 2.4, arme: "levee" },
      ],
      plans: [
        { nom: "la vallée perdue", duree: 9, fondu: { entree: 1.5 }, titre: echoue(3, "L'enclume"),
          camera: { type: "travelling", de: { oeil: [140, 60, 200], cible: [0, 4, 0] }, a: { oeil: [90, 40, 140], cible: [0, 2, 0] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 5.5, texte: "La vallée de Morvane est à moi. Et maintenant… Valcourt." }] },
        { nom: "les chars du Front", duree: 9, camera: { type: "suivre", acteur: "front", de: [-30, 4, 10], a: [-22, 3, 8], regardHauteur: 2 } },
        { nom: "le Front au village", duree: 8, camera: { type: "orbite", acteur: "fete", rayon: 8, hauteur: 2.4, de: 0.5, a: 1.8, regardHauteur: 1.2 },
          actions: [{ a: 0, acteur: "fete", faire: "celebre", duree: 10 }] },
        { nom: "les Lions se replient", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-12, 1.9, -4], a: [-9, 1.7, -3], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "volk", duree: 5.5, texte: "Repliez-vous ! Emmenez les blessés, personne ne reste derrière !" }] },
        { nom: "les épaves de Marteau", duree: 8, camera: { type: "orbite", acteur: "epaves.0", rayon: 15, hauteur: 4, de: 0, a: 1, regardHauteur: 1.5 },
          repliques: [{ a: 0.5, qui: "dorn", radio: true, duree: 7, texte: "Marteau a perdu deux chars. Les équipages sont sortis à temps… mais la ligne est brisée." }] },
        { nom: "la route de Valcourt", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: { grand: "LA VALLÉE EST PERDUE", couleur: RATE, petit: "Le Front marche sur Valcourt. Réessaie l'opération Enclume pour l'arrêter.", de: 3, a: 11 },
          camera: { type: "travelling", de: { oeil: [0, 12, 380], cible: [0, 3, 200] }, a: { oeil: [0, 55, 520], cible: [0, 0, 0] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 7, texte: "La route de Valcourt est ouverte au Front. Il faudra reprendre la vallée, coûte que coûte." }] },
      ],
    },
    // ---------------------------------------------------------------- chapitre 4 : les rues de Valcourt (la ville)
    "fin-valcourt-reussite": {
      titre: "Chapitre 4 · réussite", musique: 0.6,
      decor: { feux: [[0, -150, 1.5], [38, -76, 1.2], [-76, 38, 1.2], [-40, 100, 0.8]] },
      acteurs: [
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[0, 4], [0, -22]], vitesse: 0.9, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.3 } },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 6, chemin: [[0, -120], [0, -320]], vitesse: 2.8, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "marteau", prendre: "chars", camp: "bleus", nombre: 1, nom: "Marteau", chemin: [[0, 150], [0, 50]], vitesse: 3.5, depart: 24 },
        { id: "epave", prendre: "chars", camp: "rouges", epave: true, nom: "Sanglier", places: [[0, -150, 1.57]] },
      ],
      plans: [
        { nom: "la mairie", duree: 10, fondu: { entree: 1.5 }, titre: accompli(4, "Les rues de Valcourt"),
          camera: { type: "travelling", de: { oeil: [120, 70, 150], cible: [0, 3, -30] }, a: { oeil: [60, 45, 80], cible: [0, 2, -30] } },
          repliques: [{ a: 3, qui: "arnaud", radio: true, duree: 6.5, texte: "Le camion est arrivé ! Il y a du pain, de l'eau, des médicaments… Merci, les Lions." }] },
        { nom: "les Lions à la mairie", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-10, 1.8, 2], a: [-6.5, 1.6, 1.5], regardHauteur: 1.3 },
          actions: [{ a: 2, acteur: "lions", faire: "halte" }, { a: 2.2, acteur: "lions", faire: "celebre", duree: 12 }],
          repliques: [{ a: 1, qui: "volk", duree: 5.5, texte: "Valcourt-Centre est libre ! Regardez, les habitants sortent de la mairie !" }] },
        { nom: "le Front quitte le centre", duree: 8, camera: { type: "suivre", acteur: "front", de: [-10, 1.8, 2], a: [-7, 1.6, 1.5], regardHauteur: 1.3, tremble: 0.08 },
          repliques: [{ a: 1, qui: "varrok", radio: true, duree: 6, texte: "Valcourt-Centre est perdu… Gardez l'ouest. Les ruines doivent tenir, quoi qu'il arrive." }] },
        { nom: "Marteau dans la grande rue", duree: 8, camera: { type: "suivre", acteur: "marteau", de: [-16, 3, 2], a: [-12, 2.6, 1.5], regardHauteur: 2 },
          repliques: [{ a: 1, qui: "dorn", radio: true, duree: 5, texte: "Plus un char du Front dans le quartier. La grande rue est à nous." }] },
        { nom: "un appel de l'ouest", duree: 9, camera: { type: "travelling", de: { oeil: [0, 30, -60], cible: [-200, 5, -60] }, a: { oeil: [20, 45, -40], cible: [-300, 0, -80] } },
          repliques: [{ a: 0.5, qui: "faucon", radio: true, duree: 7, texte: "Mayday, mayday ! Ici Faucon 2-1, on est touchés ! On se pose en urgence dans les ruines de l'ouest !" }] },
        { nom: "vers les ruines", duree: 11, fondu: { sortie: 2 }, titre: suite(5, "LA VILLE FANTÔME", "À pied dans les ruines : sauve Faucon 2-1 et détruis trois canons antiaériens."),
          camera: { type: "travelling", de: { oeil: [20, 45, -40], cible: [-300, 0, -80] }, a: { oeil: [60, 80, 20], cible: [-400, 0, -100] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 7, texte: "Faucon est au sol dans Valcourt-Ouest. Lion 1, prépare-toi : on part le chercher à l'aube." }] },
      ],
    },
    "fin-valcourt-echec": {
      titre: "Chapitre 4 · échec", musique: 0.4,
      decor: { feux: [[0, 120, 1.8], [38, -76, 1], [-76, 38, 1], [0, -38, 0.8]] },
      acteurs: [
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 9, chemin: [[0, -200], [0, -50]], vitesse: 1.2, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.5, retourne: 0.2 } },
        { id: "chars", prendre: "chars", camp: "rouges", nombre: 1, nom: "Sanglier", chemin: [[0, -430], [0, -110]], vitesse: 4 },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[0, 60], [0, 270]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
      ],
      plans: [
        { nom: "la ville encerclée", duree: 9, fondu: { entree: 1.5 }, titre: echoue(4, "Les rues de Valcourt"),
          camera: { type: "travelling", de: { oeil: [120, 70, 200], cible: [0, 3, 0] }, a: { oeil: [70, 48, 140], cible: [0, 2, 0] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 6, texte: "Le camion n'arrivera jamais. Valcourt a faim… et Valcourt se rendra." }] },
        { nom: "le Front marche sur la mairie", duree: 9, camera: { type: "suivre", acteur: "front", de: [-10, 1.8, 2], a: [-7, 1.6, 1.5], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "le char du Front", duree: 8, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 2], a: [-12, 2.6, 1.5], regardHauteur: 2 } },
        { nom: "les Lions reculent", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-10, 1.8, -2], a: [-8, 1.6, -1.5], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "volk", duree: 4.5, texte: "On recule jusqu'au pont ! Je répète, on recule !" }] },
        { nom: "le camion brûle", duree: 8, camera: { type: "travelling", de: { oeil: [15, 8, 150], cible: [0, 1, 120] }, a: { oeil: [10, 6, 142], cible: [0, 1, 120] } },
          repliques: [{ a: 0.5, qui: "arnaud", radio: true, duree: 7, texte: "Mairie à Rempart… Nous n'avons presque plus rien. Nous tiendrons encore un peu… venez vite." }] },
        { nom: "Valcourt a faim", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: { grand: "VALCOURT A FAIM", couleur: RATE, petit: "Les habitants attendent toujours. Réessaie la mission pour apporter les vivres à la mairie.", de: 3, a: 11 },
          camera: { type: "travelling", de: { oeil: [0, 15, 200], cible: [0, 3, 0] }, a: { oeil: [0, 70, 300], cible: [0, 0, -100] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 5.5, texte: "Les habitants comptent sur nous, Lion 1. On ne les abandonnera pas." }] },
      ],
    },
    // ---------------------------------------------------------------- chapitre 5 : la ville fantôme (les ruines)
    "fin-fantome-reussite": {
      titre: "Chapitre 5 · réussite", musique: 0.6,
      decor: { feux: [[38, -38, 1.4], [76, -114, 1.4], [-38, -152, 1.4], [0, -120, 1.2]] },
      acteurs: [
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 7, chemin: [[-100, 0], [-150, 0]], vitesse: 1.2, formation: "colonne", ecart: 2.4, arme: "levee", tactique: { balaye: 0.4, retourne: 0.2 } },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 5, chemin: [[38, -60], [38, -260]], vitesse: 2.6, formation: "colonne", ecart: 3, arme: "basse", tactique: { retourne: 0.3 } },
        { id: "epave", prendre: "chars", camp: "rouges", epave: true, nom: "Chacal", places: [[-38, -76, 1]] },
      ],
      plans: [
        { nom: "Faucon s'envole", duree: 10, fondu: { entree: 1.5 }, titre: accompli(5, "La ville fantôme"),
          camera: { type: "travelling", de: { oeil: [-250, 60, 150], cible: [-76, 3, 0] }, a: { oeil: [-200, 40, 90], cible: [-76, 3, 0] } },
          repliques: [{ a: 3, qui: "faucon", radio: true, duree: 6, texte: "Ici Faucon 2-1, en vol ! Tout l'équipage est sain et sauf. Merci, Lion 1." }] },
        { nom: "vers l'extraction", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-10, 1.8, 2], a: [-7, 1.6, 1.5], regardHauteur: 1.3, tremble: 0.05 },
          repliques: [{ a: 1, qui: "moreau", radio: true, duree: 5, texte: "Je descends des toits. Plus un ennemi en vue dans les ruines." }] },
        { nom: "le Front quitte les ruines", duree: 8, camera: { type: "suivre", acteur: "front", de: [-10, 1.8, 2], a: [-7, 1.6, 1.5], regardHauteur: 1.3, tremble: 0.08 },
          repliques: [{ a: 1, qui: "varrok", radio: true, duree: 6, texte: "Laissez les ruines ! Tout le monde au Terminus. Protégez la machine, à tout prix !" }] },
        { nom: "extraction réussie", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-8, 2, 2], a: [-6, 1.8, 1.5], regardHauteur: 1.2 },
          actions: [{ a: 0, acteur: "lions", faire: "halte" }, { a: 0.3, acteur: "lions", faire: "celebre", duree: 12 }],
          repliques: [{ a: 1, qui: "volk", duree: 5, texte: "Extraction réussie ! Le camion arrive, on rentre à la base." }] },
        { nom: "sous la ville", duree: 9, camera: { type: "travelling", de: { oeil: [-150, 25, 40], cible: [0, 0, 0] }, a: { oeil: [-120, 55, 60], cible: [60, -20, 0] } },
          repliques: [{ a: 0.5, qui: "faucon", radio: true, duree: 8, texte: "Rempart, en volant au-dessus de la ville, nos instruments ont trouvé la source du brouillard. Elle est sous Valcourt… dans le métro." }] },
        { nom: "Terminus", duree: 11, fondu: { sortie: 2 }, titre: suite(6, "TERMINUS", "Le final, à pied dans le métro : arrête le Brouilleur et le Maréchal Varrok."),
          camera: { type: "travelling", de: { oeil: [-120, 55, 60], cible: [60, -20, 0] }, a: { oeil: [-60, 90, 120], cible: [60, -40, -40] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "Le Brouilleur… et sûrement Varrok avec lui. Lions, cette nuit, on descend dans le métro." }] },
      ],
    },
    "fin-fantome-echec": {
      titre: "Chapitre 5 · échec", musique: 0.4,
      decor: { feux: [[38, -38, 1], [-76, 76, 1.2], [0, 0, 1], [76, -114, 1]] },
      acteurs: [
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 9, chemin: [[60, 76], [-50, 76]], vitesse: 1.1, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { balaye: 0.5, retourne: 0.2 } },
        { id: "chars", prendre: "chars", camp: "rouges", nombre: 1, nom: "Chacal", chemin: [[220, 76], [-10, 76]], vitesse: 3.5, depart: 8 },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-114, 120], [-114, 290]], vitesse: 1.8, formation: "colonne", ecart: 2.6, arme: "levee", tactique: { retourne: 0.6 } },
      ],
      plans: [
        { nom: "les ruines", duree: 9, fondu: { entree: 1.5 }, titre: echoue(5, "La ville fantôme"),
          camera: { type: "travelling", de: { oeil: [-250, 60, 150], cible: [-76, 3, 76] }, a: { oeil: [-200, 42, 120], cible: [-76, 3, 76] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 5.5, texte: "Vos pilotes sont mes prisonniers. Votre hélicoptère est à moi." }] },
        { nom: "le Front encercle l'hélico", duree: 9, camera: { type: "suivre", acteur: "front", de: [-10, 1.8, 2], a: [-7, 1.6, 1.5], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "un char dans les ruines", duree: 8, camera: { type: "suivre", acteur: "chars", de: [-16, 3, 2], a: [-12, 2.6, 1.5], regardHauteur: 2 } },
        { nom: "les Lions décrochent", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-10, 1.8, -2], a: [-8, 1.6, -1.5], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "moreau", radio: true, duree: 4.5, texte: "Je n'ai plus d'angle de tir ! On décroche, Lion 1 !" }] },
        { nom: "le dernier appel", duree: 8, camera: { type: "travelling", de: { oeil: [-110, 22, 140], cible: [-76, 2, 76] }, a: { oeil: [-125, 32, 170], cible: [-76, 2, 76] } },
          repliques: [{ a: 0.5, qui: "faucon", radio: true, duree: 6.5, texte: "… Ici Faucon 2-1… ils sont partout… on se rend. Prévenez Rempart…" }] },
        { nom: "le brouillard reste", duree: 12, fondu: { sortie: 2.5 }, musique: 0.3,
          titre: { grand: "FAUCON EST PRISONNIER", couleur: RATE, petit: "Le brouillard couvre toujours Valdrie. Réessaie la mission pour sauver l'équipage.", de: 3, a: 11 },
          camera: { type: "travelling", de: { oeil: [-125, 32, 170], cible: [-76, 2, 76] }, a: { oeil: [-160, 75, 260], cible: [0, 0, 0] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6, texte: "Ils sont vivants. On les ramènera, Lion 1. Je te le promets." }] },
      ],
    },
    // ---------------------------------------------------------------- chapitre 6 : Terminus (le métro, le final)
    "fin-terminus-reussite": {
      titre: "Chapitre 6 · la fin de la guerre", musique: 0.8,
      acteurs: [
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[-66, 7], [-54, 7]], vitesse: 0.8, formation: "colonne", ecart: 2.2, largeur: 1.3, arme: "levee" },
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 6, arme: "basse", places: [[-58, -8, 1.57], [-54, -8, 1.57], [-50, -8, 1.57], [-46, -8, 1.57], [-42, -8, 1.57], [-38, -8, 1.57]] },
        { id: "sortie", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-22, 7], [27, 7]], vitesse: 1.1, depart: 22, formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "basse" },
      ],
      plans: [
        { nom: "le Brouilleur coupé", duree: 9, fondu: { entree: 1.5 }, titre: accompli(6, "Terminus", { grand: "BROUILLEUR COUPÉ" }),
          camera: { type: "travelling", de: { oeil: [-20, 3, 10], cible: [-62, 1.5, 6] }, a: { oeil: [-34, 2.6, 10], cible: [-62, 1.5, 6] } },
          repliques: [{ a: 3, qui: "volk", duree: 5, texte: "Le Brouilleur est coupé ! Les radios… les radios se rallument !" }] },
        { nom: "la joie des Lions", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-6, 1.8, 1], a: [-4.5, 1.7, 0.8], regardHauteur: 1.3 },
          actions: [{ a: 0, acteur: "lions", faire: "halte" }, { a: 0.2, acteur: "lions", faire: "celebre", duree: 16 }],
          repliques: [{ a: 1, qui: "hargrave", radio: true, duree: 6, texte: "Ici Rempart. Je vous entends ! Je vous entends fort et clair, Lions !" }] },
        { nom: "Varrok se rend", duree: 9, camera: { type: "travelling", de: { oeil: [-48, 2.2, 2], cible: [-48, 1.2, -8] }, a: { oeil: [-44, 2, 1], cible: [-48, 1.2, -8] } },
          repliques: [{ a: 1, qui: "varrok", duree: 6, texte: "… C'est fini. Je me rends. Que mes soldats déposent les armes." }] },
        { nom: "on rentre à la maison", duree: 9, camera: { type: "suivre", acteur: "sortie", de: [5, 1.9, 1], a: [6, 2.1, 1.2], regard: [29, 2, 7] },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 6.5, texte: "À toutes les unités de Valdrie : la guerre est finie. Rentrez à la maison, Lions." }] },
        { nom: "épilogue", duree: 10, camera: { type: "travelling", de: { oeil: [60, 4, -10], cible: [-20, 1.5, 5] }, a: { oeil: [66, 4.6, -7], cible: [-20, 1.5, 5] } },
          titre: { etiquette: "Épilogue", grand: "LA PAIX", couleur: OK, petit: "Le Maréchal Varrok s'est rendu à 4 h 02. Le Front Écarlate a déposé les armes, et une à une, les radios de Valdrie se sont rallumées.", de: 1, a: 9.5 },
          repliques: [{ a: 0.5, qui: "arnaud", radio: true, duree: 7, texte: "Ici Valcourt… les cloches sonnent dans toute la ville. Merci, les Lions. Merci pour tout." }] },
        { nom: "fin", duree: 10, fondu: { sortie: 3 }, musique: 0.9,
          camera: { type: "travelling", de: { oeil: [66, 4.6, -7], cible: [-20, 1.5, 5] }, a: { oeil: [72, 5, -4], cible: [-20, 2, 5] } },
          titre: { etiquette: "The Last Battlefield", grand: "FIN", taille: 110, couleur: OK, petit: "un jeu de Maxance", de: 0.5, a: 9.8 } },
      ],
    },
    "fin-terminus-echec": {
      titre: "Chapitre 6 · échec", musique: 0.35,
      acteurs: [
        { id: "front", prendre: "figurants", camp: "rouges", nombre: 10, chemin: [[-60, -7], [30, -7]], vitesse: 1.0, formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", tactique: { balaye: 0.5, retourne: 0.2 } },
        { id: "lions", prendre: "figurants", camp: "bleus", nombre: 6, chemin: [[-10, 7], [27, 7]], vitesse: 1.6, formation: "colonne", ecart: 2.4, largeur: 1.3, arme: "levee", tactique: { retourne: 0.6 } },
      ],
      plans: [
        { nom: "le Brouilleur tourne", duree: 9, fondu: { entree: 1.5 }, titre: echoue(6, "Terminus"),
          camera: { type: "travelling", de: { oeil: [-20, 3, 0], cible: [-80, 2, 0] }, a: { oeil: [-30, 2.6, 0], cible: [-80, 2, 0] } },
          repliques: [{ a: 3, qui: "varrok", radio: true, duree: 5.5, texte: "Le Brouilleur tourne toujours. Valdrie restera dans le silence… pour toujours." }] },
        { nom: "la garde avance", duree: 9, camera: { type: "suivre", acteur: "front", de: [-9, 1.8, 1], a: [-6.5, 1.6, 0.8], regardHauteur: 1.3, tremble: 0.06 } },
        { nom: "les Lions remontent", duree: 9, camera: { type: "suivre", acteur: "lions", de: [-8, 1.8, -0.6], a: [-6, 1.6, -0.5], regardHauteur: 1.3, tremble: 0.1 },
          repliques: [{ a: 1, qui: "volk", duree: 5, texte: "On ne passera pas ! Remontez à la surface, tout de suite !" }] },
        { nom: "plus rien", duree: 9, camera: { type: "travelling", de: { oeil: [60, 4, -10], cible: [-20, 1.5, 5] }, a: { oeil: [56, 3.6, -8], cible: [-20, 1.5, 5] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 7, texte: "Lion 1, ici Rempart… Lion 1, tu m'entends ?… Plus rien. Le brouillard est revenu." }] },
        { nom: "Varrok s'enfuit", duree: 9, camera: { type: "travelling", de: { oeil: [-50, 3, -10], cible: [-100, 2, -2] }, a: { oeil: [-60, 2.6, -8], cible: [-110, 2, 0] } },
          repliques: [{ a: 0.5, qui: "hargrave", radio: true, duree: 7, texte: "Varrok s'est enfui par les tunnels. Il faut retourner au Terminus avant qu'il ne recommence." }] },
        { nom: "dans le noir", duree: 11, fondu: { sortie: 4 }, musique: 0.25,
          titre: { grand: "VALDRIE RESTE DANS LE NOIR", couleur: RATE, taille: 54, petit: "Mais les Lions ne renoncent jamais. Réessaie le chapitre pour couper le Brouilleur.", de: 1, a: 10 },
          camera: { type: "travelling", de: { oeil: [-60, 2.6, -8], cible: [-110, 2, 0] }, a: { oeil: [-66, 2.4, -7], cible: [-110, 2, 0] } } },
      ],
    },
  });
})();

// ✍️ (demande 101, morceau 3) LA BANDE-ANNONCE DU JEU : « À la fin, une vidéo qui fait l'introduction du jeu. » Le bouton
// « 🎬 Bande-annonce » de la page d'accueil la lance ; à la fin (ou Entrée / Échap), on revient à l'accueil. Elle est
// tournée sur la carte du moment avec des figurants (des chars, une escouade, un tireur d'élite, les hélicos et l'avion
// de chasse de la base aérienne) : rien ne reste après le film. « nettoyer » : les explosions et la fumée du film
// disparaissent à la fin.
Tanks.CONFIG.cinematiques.bandeAnnonce = "bande-annonce";
(function () {
  const C = Tanks.CONFIG, armes = Object.keys(C.armesPrincipales).length + Object.keys(C.pistolets).length;
  const slogan = (grand, etiquette, petit) => ({ etiquette: etiquette || "", grand, petit, taille: 58, de: 1.5, a: 7 });
  C.cinematiques.films["bande-annonce"] = {
    titre: "Bande-annonce · The Last Battlefield", musique: 1, nettoyer: true, bases: true,
    decor: { feux: [[-60, 250, 1.6], [50, 300, 1.4], [120, 180, 1.2], [-130, 120, 1.2]] },
    acteurs: [
      { id: "blindes", prendre: "chars", camp: "bleus", nombre: 4, nom: "Marteau", chemin: [[0, 560], [0, -300]], vitesse: 7, formation: "colonne", ecart: 18, largeur: 0 },
      { id: "escouade", prendre: "figurants", camp: "bleus", nombre: 8, chemin: [[40, 470], [40, 380]], vitesse: 0.9, formation: "colonne", ecart: 2.5, arme: "levee", tactique: { balaye: 0.45, retourne: 0.25, accroupi: 0.2 } },
      { id: "sniper", prendre: "figurants", camp: "bleus", nombre: 1, armeId: "lapua", places: [[-20, 420, -1.57]] },
      { id: "helicos", prendre: "engins", sortes: ["helico", "blackhawk", "chinook"], chemin: [[-110, 690], [-110, 600], [-60, 200], [0, -400]], vitesse: 28, acceleration: 7, depart: 30,
        formation: "ligne", ecart: 40, hauteurs: [[0, 0], [30, 12], [160, 45], [1500, 60]], rotor: 30 },
      { id: "avion", prendre: "engins", sortes: ["avion"], chemin: [[-60, 790], [-480, 790], [-1000, 700]], vitesse: 80, acceleration: 13, depart: 47,
        hauteurs: [[0, 0], [230, 0], [430, 22], [900, 110]] },
    ],
    plans: [
      { nom: "le champ de bataille", duree: 7, fondu: { entree: 2 },
        camera: { type: "travelling", de: { oeil: [300, 120, 900], cible: [0, 0, 300] }, a: { oeil: [220, 95, 780], cible: [0, 0, 250] } },
        titre: { etiquette: "Un jeu de Maxance", grand: "", petit: "Valdrie, 2041. Toutes les radios se sont tues.", de: 1.5, a: 6.5 } },
      { nom: "les blindés", duree: 8, camera: { type: "suivre", acteur: "blindes", de: [-34, 4, 12], a: [-22, 3, 9], regardHauteur: 2, tremble: 0.05 },
        titre: slogan("BLINDÉS.", "Leclerc · Abrams · Leopard 2") },
      { nom: "l'infanterie", duree: 8, camera: { type: "suivre", acteur: "escouade", de: [-10, 1.7, 3], a: [-7, 1.6, 2], regardHauteur: 1.3, tremble: 0.06 },
        titre: slogan("INFANTERIE.", "4 classes · grenades · explosifs") },
      { nom: "le tireur d'élite", duree: 7, camera: { type: "suivre", acteur: "sniper", repere: "regard", de: [2.4, 1.45, 0.8], a: [1.5, 1.3, 0.55], regard: [-20, 2, 250] },
        actions: [{ a: 0.3, acteur: "sniper", faire: "accroupi" }],
        titre: slogan("DÉBLOQUE " + armes + " ARMES.", "L'armurerie · lunettes · silencieux · peintures") },
      { nom: "les hélicos décollent", duree: 9, camera: { type: "travelling", de: { oeil: [-30, 6, 640], cible: [-110, 6, 686] }, a: { oeil: [-50, 22, 590], cible: [-100, 40, 600] } },
        titre: slogan("HÉLICOS.", "Tigre · Black Hawk · Chinook") },
      { nom: "en vol", duree: 8, camera: { type: "suivre", acteur: "helicos", de: [55, 14, 25], a: [40, 8, 18], regardHauteur: 0, tremble: 0.15 } },
      { nom: "l'avion décolle", duree: 10, camera: { type: "travelling", de: { oeil: [-170, 4, 825], cible: [-60, 3, 790] }, a: { oeil: [-300, 12, 835], cible: [-520, 25, 790] } },
        titre: slogan("AVIONS.", "La base aérienne · la piste · le ciel") },
      { nom: "la bataille", duree: 8, camera: { type: "suivre", acteur: "blindes", de: [-45, 9, 26], a: [-34, 6, 20], regardHauteur: 2, tremble: 0.2 },
        actions: [{ a: 0.6, faire: "explose", ou: [-24, 150], force: 2.2 }, { a: 2.2, faire: "explose", ou: [26, 130], force: 2.6, sorte: "bombe" }, { a: 3.6, faire: "explose", ou: [-14, 112], force: 1.8 }, { a: 5.2, faire: "explose", ou: [30, 100], force: 2.4, sorte: "bombe" }, { a: 6.6, faire: "explose", ou: [-30, 90], force: 2 }],
        titre: { etiquette: "La campagne", grand: C.campagne.chapitres.length + " CHAPITRES.", petit: "Les Lions de Valdrie contre le Front Écarlate.", taille: 58, de: 1.5, a: 7.5 } },
      { nom: "le logo", duree: 12, fondu: { sortie: 1.5 },
        camera: { type: "travelling", de: { oeil: [200, 60, 500], cible: [0, 20, 0] }, a: { oeil: [150, 140, 450], cible: [0, 30, 0] } },
        titre: { etiquette: "Infanterie · Blindés · Hélicos · Avions", grand: "THE LAST BATTLEFIELD", taille: 72, couleur: "#ffcf5a", petit: "Un jeu de Maxance · Appuie sur Entrée", de: 1, a: 11.5 } },
    ],
  };
})();

// ================================================================== livre de demandes n° 7, 22 et 28 : 🛒 LA BOUTIQUE
// ✍️ « Faire un menu avec des achats, par exemple un pack de skins de véhicules avec des avancements de jeu. »
// ✍️ « Développer les battle coins, la monnaie du jeu. » ✍️ « Faire une boutique. »
// ⚠️ PAS DE VRAI ARGENT : les packs en euros sont seulement AFFICHÉS (comme Maxance les a voulus, demande 100). Le bouton
// dit qu'un achat avec de vrais euros demande l'accord et l'aide d'un adulte (Cyril) : il ne donne JAMAIS de Battle Coins.
// Tout s'achète avec les BATTLE COINS (BC) gagnés en jouant (logique/boutique.js : le marchand).
//   gains : les BC gagnés en BATAILLE LIBRE (et dans le souterrain) : par ennemi abattu, par victoire, par niveau de
//     joueur gagné (la campagne, elle, donne ses BC à chaque mission réussie : « campagne.battleCoins ») ;
//   armes : prix d'une arme encore sous cadenas = base + parNiveau × son niveau (elle se débloque tout de suite) ;
//   pieces : prix d'une pièce d'armurerie (pour UNE arme) = base + parNiveau × son niveau d'arme ;
//   peintures : les peintures RARES, vendues seulement ici (une fois achetée : sur TOUTES tes armes). motif : le dessin
//     (affichage/armes3d.js, le peintre) ; couleurs ; brillant (0 mat … 1 miroir) ;
//   tenues : les PERSONNAGES (la tenue de TON soldat : affichage/uniformes.js, le tailleur). fond, taches : le camouflage ;
//     motif : "bois" (taches fines) ou "desert" (grandes taches) ; equipement : la couleur du gilet et du sac ;
//   chars : les peintures de TON tank (taches : 4 couleurs ; boue, poussiere : la saleté) ;
//   packs : les PACKS DE SKINS DE VÉHICULES : 1 achat = un thème pour tous les véhicules de ton camp de la liste
//     « sortes » (camouflage : 4 couleurs ; ventre : le dessous des avions et des hélicos) ;
//   avancements : ✍️ « des avancements de jeu » : xp2 (tes XP × 2 pendant « batailles » batailles), coins2 (les BC des
//     batailles × 2), niveau (+1 niveau de joueur tout de suite) ;
//   euros : les packs en euros (AFFICHÉS SEULEMENT).
Tanks.CONFIG.boutique = {
  gains: { ennemi: 2, victoire: 25, niveau: 50 },
  armes: { base: 300, parNiveau: 150 },
  pieces: { base: 100, parNiveau: 60 },
  rayons: [["armes", "🔫", "Armes"], ["armurerie", "🔧", "Armurerie"], ["peintures", "🎨", "Peintures d'armes"], ["personnages", "🪖", "Personnages"],
    ["tanks", "🛡️", "Tanks"], ["vehicules", "🚙", "Véhicules"], ["avancements", "⚡", "Avancements"], ["coins", "🪙", "Battle Coins"]],
  peintures: [
    { id: "dragon", nom: "Dragon", prix: 1800, texte: "Des écailles rouge sang bordées d'or : l'arme d'un dragon !", motif: "ecailles", couleurs: ["#7a0e0e", "#1a0505", "#e0a030"], brillant: 0.4 },
    { id: "glace", nom: "Glace", prix: 1500, texte: "Bleu glacier, fendu de fissures blanches comme un lac gelé.", motif: "fissures", couleurs: ["#7fc4e8", "#e8f6ff", "#2f6f98"], brillant: 0.55 },
    { id: "lave", nom: "Lave", prix: 2000, texte: "Une roche noire, et la lave orange qui brille dans ses fissures.", motif: "fissures", couleurs: ["#1c1412", "#ff7a14", "#3a2018"], brillant: 0.15 },
    { id: "galaxie", nom: "Galaxie", prix: 2500, texte: "Le ciel de la nuit : nébuleuses violettes et des milliers d'étoiles.", motif: "etoiles", couleurs: ["#120a2a", "#6a2a9a", "#2a6ab8", "#ffffff"], brillant: 0.3 },
    { id: "chrome", nom: "Chrome", prix: 2200, texte: "Un miroir de métal poli… mais ça brille : on te voit de loin !", motif: "chrome", couleurs: ["#d8dde2", "#5a6068", "#ffffff"], brillant: 1, effets: { visibilite: 30 } },
    { id: "arctique", nom: "Camo Arctique", prix: 1200, texte: "Blanc, gris bleuté et glace : le camouflage des patrouilles polaires.", motif: "taches", couleurs: ["#eef3f6", "#a9b8c4", "#d2dde5", "#5d6c78"], effets: { visibilite: -6 } },
  ],
  tenues: [
    { id: "commandoNuit", nom: "Commando de nuit", prix: 1500, icone: "🌙", texte: "Noir et gris sombre : invisible dans le noir.", fond: "#2a2c30", taches: ["#1a1b1e", "#3a3d42", "#101113"], equipement: "#1e2024", motif: "bois" },
    { id: "forcesSpeciales", nom: "Forces spéciales", prix: 2200, icone: "🎖️", texte: "Le « multicam » des unités d'élite : beige, vert et brun.", fond: "#8a7f5e", taches: ["#5e6644", "#6b5236", "#b8a984"], equipement: "#6b6247", motif: "bois" },
    { id: "desertTempete", nom: "Tempête du désert", prix: 1500, icone: "🏜️", texte: "Les 3 couleurs du désert : sable, brun et ocre.", fond: "#cdb68a", taches: ["#9c7b52", "#e2d2aa", "#7a5f3c"], equipement: "#a58c62", motif: "desert" },
    { id: "neige", nom: "Chasseur des neiges", prix: 1800, icone: "❄️", texte: "Blanc et gris : pour se cacher dans la neige.", fond: "#e6eaee", taches: ["#b5bec6", "#f7f9fb", "#7f8a94"], equipement: "#d4dade", motif: "desert" },
    { id: "officier", nom: "Officier", prix: 2600, icone: "⭐", texte: "Vert olive impeccable, gilet brun : la tenue du chef.", fond: "#56603e", taches: ["#4c5537", "#5f6a45", "#475033"], equipement: "#5a4630", motif: "bois" },
    { id: "ghillie", nom: "Ghillie", prix: 3000, icone: "🌿", texte: "La tenue du tireur d'élite : couverte d'herbes et de feuilles.", fond: "#56602f", taches: ["#3c4a22", "#7a7a3c", "#2a3418"], equipement: "#4a5228", motif: "bois" },
  ],
  chars: [
    { id: "charDesert", nom: "Tempête de sable", prix: 2000, icone: "🏜️", texte: "Sable et ocre : comme les tanks de la guerre du Golfe.", taches: ["#c2a56f", "#9e7d4c", "#dcc79a", "#7d6444"], boue: "#7a6648", poussiere: "#d4c29a" },
    { id: "charHiver", nom: "Hiver", prix: 2200, icone: "❄️", texte: "Peint à la chaux blanche, avec des taches grises.", taches: ["#d8dde0", "#9aa3a8", "#f2f4f5", "#5e666b"], boue: "#6b6560", poussiere: "#e8ecee" },
    { id: "charNuit", nom: "Nuit urbaine", prix: 2500, icone: "🌃", texte: "Gris foncé et noir, pour les combats de rue la nuit.", taches: ["#3c4044", "#25282b", "#55595e", "#151719"], boue: "#3a332a", poussiere: "#6a6a66" },
    { id: "charTigre", nom: "Tigre", prix: 3500, icone: "🐯", texte: "Jaune sable et rayures vert foncé, comme les tanks d'autrefois.", taches: ["#c8a04c", "#3e4a26", "#8a6a34", "#2a2a1c"], boue: "#5e503c", poussiere: "#c4b08a" },
  ],
  packs: [
    { id: "packDesert", nom: "Pack Désert", prix: 3000, icone: "🏜️", texte: "Tous tes véhicules couleur sable : jeep, moto, quad, camion, hélicos et Rafale.", camouflage: ["#c2a56f", "#d8c08e", "#8f7449", "#a89060"], ventre: "#d8d0b8" },
    { id: "packArctique", nom: "Pack Arctique", prix: 3200, icone: "❄️", texte: "Blanc et gris glacé : tes véhicules disparaissent dans la neige.", camouflage: ["#dfe5e8", "#f4f6f7", "#9aa6ae", "#c0c9cf"], ventre: "#eef2f4" },
    { id: "packNuit", nom: "Pack Nuit", prix: 3500, icone: "🌙", texte: "Noir mat et gris anthracite : pour les opérations de nuit.", camouflage: ["#2b2e32", "#3c4045", "#16181a", "#4a4e54"], ventre: "#3a3e44" },
    { id: "packTigre", nom: "Pack Tigre", prix: 4000, icone: "🐯", texte: "Orange et noir rayé : le pack le plus voyant du champ de bataille !", camouflage: ["#d8781c", "#f0a040", "#1a1410", "#b05a14"], ventre: "#e8c090" },
  ],
  // (les véhicules de ton camp qui prennent le pack : la jeep, la moto, le quad, le camion, le Tigre, le Black Hawk, le
  // Chinook, le Rafale et le drone)
  sortesPack: ["jeep", "moto", "quad", "camion", "helico", "blackhawk", "chinook", "avion", "drone"],
  avancements: [
    { id: "xp2", nom: "Double XP", prix: 2500, icone: "⚡", texte: "Tes points d'expérience × 2 pendant tes 3 prochaines batailles.", batailles: 3 },
    { id: "coins2", nom: "Double Battle Coins", prix: 2000, icone: "🪙", texte: "Les Battle Coins de tes 3 prochaines batailles libres × 2.", batailles: 3 },
    { id: "niveau", nom: "Promotion", prix: 4000, icone: "🎖️", texte: "+1 NIVEAU DE JOUEUR tout de suite (et tout ce qu'il débloque)." },
  ],
  euros: [{ bc: 100, prix: "0,99 €" }, { bc: 550, prix: "4,99 €" }, { bc: 1200, prix: "9,99 €" }, { bc: 2600, prix: "19,99 €" }],
};
// Les peintures rares sont aussi des pièces de l'armurerie (emplacement « peinture ») : « boutique: true » = sous cadenas
// tant qu'on ne les a pas achetées. Et chaque skin devient un « camp » à part pour le dessin (« bleus~commandoNuit » :
// les Bleus, avec ces couleurs), pour que les tailleurs et les peintres le trouvent comme un vrai camp.
(function () {
  const C = Tanks.CONFIG, B = C.boutique, U = C.realisme.soldats.uniformes, A = C.avions3d.peinture;
  for (const p of B.peintures) C.atelier.peinture.pieces.push({ id: p.id, nom: p.nom, niveau: 0, boutique: true, texte: p.texte, motif: p.motif, couleurs: p.couleurs, brillant: p.brillant || 0, effets: p.effets || {} });
  const camp = (id, camouflage) => (C.equipes["bleus~" + id] = Object.assign({}, C.equipes.bleus, { camouflage }));
  for (const t of B.tenues) {
    camp(t.id, [t.fond].concat(t.taches));
    U["bleus~" + t.id] = { nom: t.nom, fond: t.fond, taches: t.taches, equipement: t.equipement, motif: t.motif };
  }
  for (const c of B.chars) {
    camp(c.id, c.taches);
    C.peinture["bleus~" + c.id] = { taches: c.taches, boue: c.boue, poussiere: c.poussiere };
  }
  for (const p of B.packs) {
    camp(p.id, p.camouflage);
    for (const schema in A) A[schema]["bleus~" + p.id] = Object.assign({}, A[schema].bleus, { fond: p.camouflage[0], taches: p.camouflage.slice(1, 4), ventre: A[schema].bleus.ventre ? p.ventre : null });
  }
})();

// ================================================================== livre de demandes n° 25 : les phrases du QG à la radio
// (« QG Rempart » parle pour ton camp ; la radio ennemie interceptée, pour le Front.) {baies} : les baies encore debout.
Object.assign(Tanks.CONFIG.radio.bavard, {
  qgAttaque: ["Ici QG Rempart : on nous attaque ! Des ennemis dans le poste de commandement !", "QG Rempart à toutes les unités : le QG est attaqué, revenez le défendre !", "Contact au QG ! Ils tirent sur nos baies ! Il nous en reste {baies} !"],
  qgBaie: ["Une baie du QG vient de sauter ! Plus que {baies} !", "On a perdu une baie de serveurs ! Il en reste {baies}, tenez bon !"],
  qgEnnemiAttaque: ["Leur QG est touché, continuez !", "On est dans leur poste de commandement ! Feu sur les baies !"],
  qgEnnemiBaie: ["Une baie ennemie a explosé ! Plus que {baies} !", "Boum ! Leur QG perd une baie. Encore {baies} !"],
  qgDetruit: ["LEUR QG EST DÉTRUIT ! Le Front n'a plus de commandement !"],
  qgPerdu: ["Le QG Rempart est tombé… On a perdu le commandement !"],
});

// ================================================================== livre de demandes n° 26 : ✍️ « FAIRE UN RÉALISME ABSURDE »
// (= un réalisme extrême.) Des détails comme dans la vraie vie, qu'on REMARQUE en jouant, mais sans ralentir le jeu
// (✍️ Maxance déteste le lag) : chacun se règle ici, et on peut l'éteindre (actif: false). Déjà là avant (demande 92) :
// le « crac » des balles qui frôlent, le son qui arrive en retard de loin (340 m/s), la fumée au bout du canon, la
// poussière soulevée par le coup de canon d'un tank, le vent qui pousse la fumée.
Tanks.CONFIG.realismeAbsurde = {
  // 1. LA BALLE TRAVERSE les matières minces (une porte en bois, des planches, une haie, des tuiles, la portière d'une
  //    voiture, la tôle d'une rame de métro, un banc) : elle continue, mais elle fait moins mal derrière (× le nombre).
  //    Le béton, la brique et la pierre l'arrêtent. Une seule traversée par balle. « epaisseurs » : m, le plus épais
  //    qu'elle traverse (une voiture : ses deux portières ; une rame de métro : ses deux flancs) ; plus épais, elle reste dedans.
  traverse: { actif: true, matieres: { porte: 0.6, bois: 0.55, haie: 0.85, tuiles: 0.7, objet: 0.5, tole: 0.4, banc: 0.65 },
    epaisseurs: { porte: 0.6, bois: 0.6, haie: 1.2, tuiles: 0.6, objet: 2.4, tole: 3.3, banc: 0.8 } },
  // 2. LE RICOCHET : une balle qui arrive EN RASANT (moins de « angle » degrés avec la surface) sur du béton, de la pierre
  //    ou du métal rebondit (« chance ») : des étincelles, un « piouu », et elle repart (perd « perte » de sa vitesse)
  //    sur « longueur » m (entre les deux nombres).
  ricochet: { actif: true, angle: 22, chance: 0.75, matieres: ["beton", "pierre", "metal", "gravats", "brique"], longueur: [12, 40], ecart: 0.12 },
  // 3. LA SUPPRESSION : des balles ennemies qui passent à moins de « distance » m de ta tête te font PEUR : chacune ajoute
  //    jusqu'à « gain » (de 0 à 1) ; ça redescend de « baisse » par seconde après « attente » s sans balle. Effets : ta
  //    visée tremble (« balancement » rad), s'écarte (« dispersion » rad), les bords de l'écran s'assombrissent
  //    (« vignette ») et l'image devient floue (« flou » px, par niveau de qualité : 0 = pas de flou, c'est plus léger).
  suppression: { actif: true, distance: 5, gain: 0.22, attente: 1.2, baisse: 0.35, balancement: 0.012, dispersion: 0.02, vignette: 0.75, flou: [0, 0, 1.2, 1.8] },
  // 4. LA FATIGUE : courir (avancer à plus de « course » × la vitesse, debout, sans épauler) essouffle (« gain » par
  //    seconde) ; on récupère de « recup » par seconde (× 2 à l'arrêt, × 2,5 accroupi). Essoufflé : la visée bouge (un
  //    « 8 » plus rapide, de « balancement » rad au plus), s'écarte (« dispersion »), et on entend son souffle.
  fatigue: { actif: true, course: 0.8, gain: 0.09, recup: 0.12, balancement: 0.01, dispersion: 0.012, periode: 1.6, souffle: 0.35 },
  // 5. LE VENT (dehors seulement : sous terre, il n'y en a pas) : « force » m/s, qui tourne doucement (« direction » rad
  //    au départ, ± « tourne » rad) avec des RAFALES (± « rafales » × la force, toutes les ~« periode » s). Il pousse la
  //    fumée ET les balles : dérive = vent de côté × temps de vol × « derive » (une balle sans vitesse connue : « vitesse »
  //    m/s). Dans la lunette, l'INDICATEUR DE VENT dit de combien la balle va dériver à la distance visée. La fumée part
  //    avec « fumee » × le vent.
  vent: { actif: true, force: 4.5, direction: 0.4, tourne: 0.5, rafales: 0.45, periode: 9, derive: 0.15, vitesse: 880, fumee: 0.45 },
  // 6. LE RECHARGEMENT RÉALISTE : chargeur VIDE = plus long (× « vide » : il faut aussi réarmer la culasse) ; chargeur
  //    pas vide (rechargement « tactique ») = une balle reste dans la chambre (30 + 1 !), mais l'ancien chargeur tombe
  //    par terre avec ses balles (« perdre » : elles sont perdues, comptées sous le capot). Pas les fusils à pompe.
  rechargement: { actif: true, vide: 1.3, tactique: 1, chambre: true, perdre: true },
  // 7. LES DOUILLES restent par terre : « max » au plus (par niveau de qualité ; les plus vieilles s'en vont), « duree » s,
  //    seulement à moins de « loin » m de la caméra.
  douilles: { actif: true, max: [40, 120, 260, 400], duree: 60, loin: 40 },
  // 8. L'ENRAYAGE : une arme qui s'enraye (« chance » par tir ; ✍️ éteint au départ : c'est plus agaçant qu'amusant).
  //    Enrayée, R la désenraye en « duree » s.
  enrayage: { actif: false, chance: 0.002, duree: 0.9 },
};

// ================================================================== livre de demandes n° 27 : ✍️ « BANNIR TOUTE PUBLICITÉ »
// AUCUNE PUBLICITÉ, AUCUN TRAQUEUR. Le jeu ne charge rien d'Internet (sauf Three.js, rangé dans le dépôt), n'envoie
// rien nulle part, n'a ni pub, ni mouchard, ni statistiques. Les affiches et les panneaux de la ville (affichage/ville3d.js)
// sont du DÉCOR : des marques INVENTÉES (Valdrie, Valcourt…), aucune vraie. La boutique se paie en Battle Coins du jeu.
Tanks.CONFIG.sansPublicite = "Aucune publicité, aucun traqueur";
