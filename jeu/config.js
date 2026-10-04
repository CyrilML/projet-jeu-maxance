// 🎛️ LES RÉGLAGES DU JEU
//
// Tous les nombres qui changent la « sensation » du jeu sont rangés ici, et nulle part ailleurs.
// Quand Maxance demande « le saut doit être plus haut » ou « les obstacles arrivent trop vite »,
// c'est ce fichier qu'on modifie : pas besoin de fouiller dans tout le code.
//
// Unités : les distances sont en pixels (px), les durées en secondes (s),
// les vitesses en pixels par seconde (px/s).

window.Jeu = window.Jeu || {};

Jeu.CONFIG = {
  // Numéro de la version du jeu. Il doit être le même que le « ?v=… » des fichiers dans index.html.
  // Affiché en haut de la page : si les deux ne correspondent pas, le navigateur a mélangé des versions.
  version: 29,

  ecran: { largeur: 960, hauteur: 540 },

  // Taille d'un bloc (une case de la grille). Tout le monde est pensé en blocs de 40 px.
  tailleBloc: 40,

  // Hauteur (y) du dessus du sol. Rappel : y = 0 en haut de l'écran, y grandit vers le bas.
  solY: 440,

  // Force qui tire tout vers le bas, en px/s². Plus c'est grand, plus on retombe vite.
  gravite: 2400,
  vitesseChuteMax: 1400,

  // Étape 24 : le héros mesure 2 blocs de haut (80 px), et il est plus large (52 px) : un trou d'un
  // seul bloc est trop étroit pour qu'il tombe dedans. Il saute plus haut, et il peut se BAISSER (S).
  joueur: {
    largeur: 52, // 30 px avant l'étape 24, × 1,74
    hauteur: 80, // 2 blocs (46 px avant l'étape 24)
    hauteurAccroupi: 38, // accroupi (touche S ou ↓) : il passe sous un seul bloc
    vitesseAccroupi: 150, // il avance moins vite quand il est baissé
    tailleDuDessin: 46, // le dessin du héros a été fait pour 46 px de haut : on l'agrandit pour 80
    vitesse: 320, // vitesse de marche gauche/droite
    forceSaut: 930, // vitesse vers le haut au moment du saut → saut de ~180 px (≈ 4,5 blocs) en ~0,78 s
    coupureSaut: 0.45, // si on relâche la touche pendant la montée, la vitesse est multipliée par ce nombre
    memoireSaut: 0.12, // un saut demandé juste avant d'atterrir est gardé en mémoire pendant ce temps
    margeHitbox: 4, // la zone de collision avec les obstacles est un peu plus petite que le dessin : le jeu est « gentil »
  },

  // La carte du monde : une grille de cases de 40 px. Les colonnes sont numérotées de gauche à droite
  // (0, 1, 2… sans fin), les lignes de haut en bas (0 à 13).
  carte: {
    lignes: 24, // 24 lignes × 40 px = 960 px : plus haut que l'écran, pour avoir de la place sous terre (étape 13)
    ligneSol: 11, // la ligne de l'herbe (11 × 40 = 440 = solY)
    longueurTroncon: 30, // le monde est fabriqué par morceaux de 30 colonnes, avec un drapeau au début de chacun
    colonneDrapeau: 2, // le drapeau est dans la 3ᵉ colonne de chaque tronçon (0, 1, 2…)
    zoneSure: 5, // les 5 premières colonnes d'un tronçon : ni trou ni obstacle autour du drapeau
    zoneSureDepart: 10, // au tout début du monde, on laisse plus de place pour s'échauffer
    avance: 12, // on fabrique le monde au moins 12 colonnes plus loin que le bord droit de l'écran
  },

  trous: {
    ecartMin: 6, // entre deux trous : 6 à 9 blocs de sol (+ la largeur du trou) → « un trou tous les 10 blocs environ »
    ecartMax: 9,
    // Étape 27 : le héros fait 52 px de large : un trou d'un bloc ne sert à rien, il marche par-dessus.
    largeurMin: 2,
    largeurMax: 3, // le saut franchit bien plus de 3 blocs : toujours possible
    chute: 980, // si les pieds du héros descendent plus bas que ce y (sous le monde), il est tombé dans le trou
  },

  plateformes: {
    parTronconMin: 1,
    parTronconMax: 2,
    largeurMin: 3,
    largeurMax: 5,
    // Étape 27 : le héros fait 2 blocs de haut. Les plateformes sont à 3 ou 4 blocs au-dessus du sol :
    // il passe dessous debout (2 ou 3 blocs de place), et il saute dessus (il saute de 4,4 blocs).
    hauteurs: [3, 4], // en blocs au-dessus du sol
  },

  // Une grande fosse de lave au milieu de chaque tronçon : donc une tous les 30 blocs (étape 4).
  fosses: {
    largeur: 3, // en blocs (les petites mares au hasard font 1 ou 2 blocs)
    position: 16, // n° de la colonne dans le tronçon (0 à 29) où commence la fosse
    marge: 2, // blocs d'herbe gardés de chaque côté (pas de trou ni de plateforme) pour prendre son élan
  },

  // L'arrivée : au bloc 1 000 (étape 12 ; avant, c'était 300). Le monde s'arrête juste après.
  arrivee: { bloc: 1000 },

  // Le classement (étape 6).
  classement: {
    taille: 10, // on garde les 10 meilleurs joueurs
    pseudoMax: 12, // longueur maximum d'un pseudo, en lettres
  },

  // Tomber dans la lave (étape 7) : le héros brûle sur place, avec des flammes, puis réapparaît.
  brulure: {
    duree: 1, // le héros brûle pendant 1 s avant de réapparaître au dernier drapeau
    flammes: 30, // nombre de flammes qui s'allument pendant qu'il brûle
    vieFlamme: 2, // chaque flamme met 2 s à s'éteindre (elle continue après le départ du héros)
    vitesseMontee: 70, // les flammes montent à environ 70 px/s
    tremblement: 40, // et ondulent de gauche à droite (px/s)
  },

  // Toucher un muret (étape 8) : le héros devient un petit squelette qui danse, puis réapparaît.
  squelette: {
    duree: 3, // le squelette danse pendant 3 s avant le retour au dernier drapeau (5 s au début, trop long pour Maxance)
    pasDeDanse: 6, // nombre de mouvements de danse par seconde
  },

  // Les lacs de lave (étape 10) : trop larges pour être sautés, avec une plateforme trop haute pour
  // être atteinte d'un saut. Il faut poser des blocs de l'inventaire pour monter dessus.
  lacs: {
    premier: 75, // le premier lac est vers le bloc 75…
    ecart: 100, // … puis un tous les 100 blocs (175, 275…)
    dernier: 875, // … jusqu'au bloc 875 (après, la place est prise par le dernier monstre)
    largeur: 8, // en blocs
    hauteurLave: 3, // la lave remplit 3 cases : la ligne du sol + 2 au-dessus (elle monte 2 blocs plus haut que le sol)
    hauteurPlateforme: 5, // le dessus de la plateforme est 5 blocs au-dessus du sol (un saut monte d'environ 3,8 blocs)
    marge: 4, // blocs d'herbe gardés de chaque côté (pas de trou)
    sansObstacle: 7, // pas de tour ni d'autre obstacle à moins de 7 blocs : sinon on pourrait sauter de là jusqu'à la plateforme
  },

  // L'inventaire (étape 10) : des blocs à poser sous ses pieds pendant un saut (touche Entrée depuis l'étape 29).
  // Étape 14 : 100 blocs, et le sac se remplit à chaque nouveau drapeau.
  inventaire: {
    blocs: 100, // au départ, et à chaque nouveau drapeau le sac revient à 100
  },

  // Les constructions à la souris (étape 14) : un clic sur une case vide pose une brique.
  construction: {
    portee: 4, // on ne peut poser (ou reprendre) une brique qu'à 4 blocs au plus du héros
    distanceMonstre: 6, // interdit de construire à moins de 6 blocs d'un monstre vivant
  },

  // Le combat (étape 11).
  combat: {
    pvJoueur: 20, // les points de vie du héros (à 0 : un cœur en moins et retour au drapeau, avec 20 PV)
    porteeEpee: 40, // l'épée touche jusqu'à 1 bloc devant le héros (px)
    dureeCoup: 0.2, // durée de l'animation du coup d'épée (s)
    bouclier: 3, // le bouclier arrête 3 coups, puis il casse
    potions: 1, // une potion par partie (touche H)
    soinPotion: 10, // elle rend 10 PV
  },

  // Les armes (étape 15). On les a toutes dès le départ ; les touches 1 à 9 choisissent l'objet en main,
  // et T l'utilise. Les armes de corps à corps s'usent (coups sur un monstre ou une caisse) ;
  // les pistolets ont des balles INFINIES, mais il faut attendre entre deux tirs.
  //   degats : PV enlevés   usure : coups avant de casser   attente : secondes entre deux coups/tirs
  armes: {
    epee: { nom: "épée", degats: 5, usure: 20, attente: 0 }, // l'épée de départ (étapes 11 et 12)
    epeeDoree: { nom: "épée dorée", degats: 7, usure: 40, attente: 0 }, // plus stylée, et elle s'use 2 fois moins vite
    hache: { nom: "petite hache", degats: 8, usure: 30, attente: 0.8, casseLesCaisses: true }, // forte mais lente
    // Les armes à feu. Balles INFINIES, sans chargeur (étape 23 : demandé par Maxance).
    // `recharge` : pour les armes lentes, une petite animation de rechargement (en s) qui se joue PENDANT
    // l'attente entre deux tirs, juste pour le style : elle ne ralentit jamais le tir.
    // `eclair` : la couleur de la flamme du tir ; `douille` : la couleur des douilles (null = pas de douille).
    pistolet: { nom: "pistolet moyen", degats: 4, attente: 0.6, eclair: "#ffe27a", douille: "#c9a227" },
    grosPistolet: { nom: "gros pistolet", degats: 8, attente: 1.2, recharge: 1, eclair: "#ffb03a", douille: "#c9a227" }, // lent, mais fort
    // La mitrailleuse (étape 17) : tant qu'on tient T, 10 balles par seconde. Balles infinies depuis l'étape 21.
    mitrailleuse: { nom: "mitrailleuse", degats: 1, attente: 0.1, eclair: "#fff2a8", douille: "#c9a227", rafale: true },
    // Le Magnum (étape 19) : très fort mais lent. Il RECULE à chaque tir (recul en px) et l'écran tremble.
    // Un vrai revolver : pas de douille au tir, mais les 6 douilles tombent quand on recharge le barillet.
    magnum: { nom: "Magnum", degats: 15, attente: 1, recul: 8, dureeRecul: 0.35, recharge: 0.9, eclair: "#ffffff", douille: null },
    // Le bazooka (étape 19) : une roquette qui explose. Roquettes illimitées depuis l'étape 24.
    // Étape 21 : après chaque tir, le héros prend une roquette dans son dos (pendant l'attente).
    bazooka: { nom: "bazooka", degats: 20, attente: 1.2, recharge: 1.1, eclair: "#ffe27a", douille: null },
    // Étape 22 : 5 nouvelles armes à feu, chacune avec son style.
    fusilPompe: { nom: "fusil à pompe", degats: 3, plombs: 5, dispersion: 0.22, portee: 5, attente: 0.9, recharge: 0.8, eclair: "#ff9f1a", douille: "#d9483b" },
    sniper: { nom: "fusil de sniper", degats: 25, portee: 25, vitesse: 1500, attente: 2, recharge: 1.6, eclair: "#ffffff", douille: "#c9a227" },
    laser: { nom: "pistolet laser", degats: 6, portee: 15, attente: 0.35, eclair: "#4fd1ff", douille: null },
    lanceFlammes: { nom: "lance-flammes", degats: 1, portee: 3, attente: 0.1, eclair: "#ff9f1a", douille: null, rafale: true },
    pistoletEau: { nom: "pistolet à eau", degats: 0, poussee: 14, pousseeMax: 4, vitesse: 450, gravite: 700, portee: 8, attente: 0.15, eclair: "#9fdcff", douille: null },
  },
  // La roquette et son explosion (étape 19).
  roquettes: {
    vitesse: 350, // px/s : plus lente qu'une balle
    portee: 12, // elle explose d'elle-même après 12 blocs
    rayon: 1, // l'explosion casse un carré de 3 × 3 blocs (1 bloc autour de l'impact)
    dureeExplosion: 0.5, // s : le temps que l'explosion reste affichée
  },

  // Les arbres (étape 28) : un arbre tous les 20 blocs environ (étape 29 : tronc de 5 à 8 blocs).
  // Le tronc est solide (il bloque le passage) ; les feuilles ne bloquent pas.
  arbres: {
    ecart: 8, // entre deux arbres, 8 blocs (à 3 près) : il reste environ un arbre tous les 20 blocs, car la lave, les trous et les dragons prennent de la place…
    decalageMax: 3, // … à 3 blocs près (au hasard), et plus loin s'il n'y a pas la place
    hauteurMin: 5, // étape 29 : des arbres plus grands que le héros (tronc de 5 à 8 blocs)
    hauteurMax: 8,
  },
  // Les constructions en bois (étape 28) : 1 bloc de tronc coupé = 1 bois.
  constructions: {
    porte: { nom: "porte", bois: 4 }, // 2 blocs de haut ; elle s'ouvre toute seule pour le héros, pas pour les monstres
    escalier: { nom: "escalier", bois: 2 }, // une marche : le héros monte dessus sans sauter
  },

  // La barre d'inventaire en bas de l'écran (étapes 15 et 20) : taille d'une case, écart, marge du bas (px).
  // Étape 20 : on peut aussi CLIQUER sur une case pour prendre l'objet en main.
  // Étape 22 : 18 cases, un peu plus petites pour tenir dans l'écran.
  barre: { taille: 42, ecart: 5, margeBas: 10 }, // étape 28 : 19 cases

  // Les outils pour casser les blocs au clic de souris (étape 17). Le bon outil casse en 1 clic ;
  // la pioche casse tout ce qui est solide, mais 3 clics pour ce qui n'est pas de la pierre.
  // Le fer et le charbon gardent leurs coups de pioche (3 et 2), car ils donnent un trésor.
  // Un bloc cassé (sauf les minerais) va dans le sac comme une brique.
  outils: {
    pelle: { nom: "pelle", facile: ["herbe", "terre"] },
    hache: { nom: "petite hache", facile: ["bois", "planche", "tronc", "porte", "escalier"] }, // étape 28 : les arbres !
    pioche: { nom: "pioche", facile: ["pierre", "roche", "brique"], casseTout: true },
    clicsDifficiles: 3, // la pioche sur la terre, le bois…
  },
  balles: {
    vitesse: 700, // px/s
    portee: 10, // une balle disparaît après 10 blocs
  },
  // Le son (étape 16) : tout est fabriqué par le synthétiseur (moteur/son.js), aucun fichier.
  sons: {
    volume: 0.6, // volume général (0 = muet, 1 = le plus fort)
    tempo: 132, // vitesse de la musique, en temps par minute
    volumeMusique: 0.5, // la musique est plus douce que les bruits (multiplie les volumes de la partition)
    intervallePas: 0.28, // un bruit de pas toutes les 0,28 s quand le héros court
  },

  // L'armure en fer (étape 15) : on la fabrique avec 5 fers (touche 9, puis T).
  armure: {
    fers: 5, // prix de fabrication
    protection: 2, // chaque coup de monstre enlève 2 PV de moins (3 → 1)
    usure: 20, // elle arrête 20 coups, puis elle casse ; R la répare avec 1 fer
  },
  // Étape 25 : tous les 100 blocs, ce n'est plus un petit monstre mais un BOSS. Il attend, et il
  // s'approche du héros quand celui-ci est à 10 blocs ou moins. Il garde le passage.
  boss: {
    pv: 500,
    nom: "Dragon mutant",
    largeur: 110, // presque 3 blocs de large
    hauteur: 160, // 4 blocs de haut : 2 fois plus grand que le héros
    vue: 10, // il s'approche quand le héros est à 10 blocs ou moins
    vitesse: 160, // lent : la moitié de la vitesse du héros
    laisse: 12, // il ne s'éloigne pas à plus de 12 blocs de sa place
    degats: 8, // un coup de poing enlève 8 PV
    attente: 1.5, // un coup de poing toutes les 1,5 s quand il touche le héros
    premierCoup: 0.8,
    portee: 20, // ses griffes touchent jusqu'à 20 px devant lui
    coffre: { potions: 1, fer: 5 }, // la récompense quand on le bat
  },
  // Étape 25 : les petits monstres sont maintenant dans les grottes, 2 par grotte.
  // Ils s'approchent quand le héros est à 6 blocs ou moins. Les battre tous = la grotte est à toi !
  monstresGrotte: {
    nombre: 2,
    pv: 30,
    vue: 6,
    vitesse: 90,
    laisse: 5, // ils restent dans la salle de la grotte
    largeur: 72, // étape 29 : 2 fois plus grands (avant : 36 × 64 px)
    hauteur: 128,
  },
  monstres: {
    premier: 100, // un boss tous les 100 blocs : 100, 200… jusqu'à l'arrivée (le dernier la garde)
    ecart: 100,
    pv: 30,
    degats: 3, // un coup de monstre enlève 3 PV au héros
    attenteMin: 1, // il frappe toutes les 1 à 2 s (au hasard) quand le héros est à portée
    attenteMax: 2,
    premierCoup: 0.8, // quand le héros arrive près de lui, il attend un peu avant le premier coup
    chanceRiposte: 0.3, // quand on le frappe, 3 chances sur 10 qu'il riposte tout de suite
    riposte: 0.3, // … au bout de 0,3 s
    portee: 44, // il touche le héros jusqu'à 44 px devant lui
    espace: 6, // blocs d'herbe plate gardés devant le boss pour se battre (étape 27 : plus de place)
    espaceDerriere: 2, // … et derrière lui : le dragon fait presque 3 blocs de large (étape 27)
  },

  // Le fer (étape 12) : un bloc de fer tous les 20 blocs, à casser avec la pioche (F) pour réparer (R).
  fer: {
    ecart: 20, // un bloc de fer tous les 20 blocs
    decalageMax: 6, // s'il y a un trou ou autre chose pile à cet endroit, on le décale d'au plus 6 blocs
    coupsPioche: 3, // 3 coups de pioche pour le casser
  },

  // Les grottes (étape 13) : un escalier descend dans une grotte en pierre, qu'on traverse vers la
  // droite avant de remonter par un autre escalier. On y trouve du charbon.
  grottes: {
    premier: 220, // la première grotte est vers le bloc 220…
    ecart: 210, // … puis une tous les 210 blocs environ (430, 640, 850)
    dernier: 900,
    ligneSol: 18, // le sol de la grotte (le dessus de cette ligne est à 18 × 40 = 720 px)
    plafond: 12, // la dernière ligne de terre au-dessus de la grotte (étape 29 : la salle va des lignes 13 à 17, 5 blocs de haut)
    charbons: 3, // blocs de minerai de charbon dans chaque grotte
  },

  // La pioche s'use (étape 13) et le charbon se casse plus vite que le fer.
  pioche: {
    usure: 30, // 30 coups qui touchent un minerai, puis elle est cassée (R la répare avec 1 fer)
    coupsCharbon: 2, // 2 coups de pioche pour casser un minerai de charbon
  },

  // Les cochons (étape 13) : ils se promènent, ne se défendent pas, et donnent de la viande.
  cochons: {
    ecart: 40, // un cochon environ tous les 40 blocs
    pv: 10, // 2 coups d'épée
    vitesse: 30, // ils marchent tranquillement (px/s)
    promenade: 3, // ils restent à moins de 3 blocs de leur point de départ
    largeur: 64, // étape 29 : 2 fois plus gros (avant : 32 × 26 px)
    hauteur: 52,
    danseMort: 1.5, // étape 28 : vaincu, il se lève sur ses pattes arrière et secoue ses pattes avant pendant 1,5 s
  },

  // La cuisine (étape 13) : K cuit (1 charbon + 1 viande crue = 1 viande cuite), M mange.
  cuisine: {
    soinCuite: 8, // la viande cuite rend 8 PV
    soinCrue: 2, // la viande crue seulement 2 PV
  },

  // Les vies (étape 4). Trou ou lave = 1 vie en moins. À 0 vie : « Aïe ! » et tout recommence à zéro.
  vies: 5,

  obstacles: {
    ecartMin: 8, // en blocs, entre deux obstacles (au moins : s'il n'y a pas la place à cause d'un trou, on pose plus loin)
    ecartMax: 14,
    margeTrou: 2, // blocs de sol obligatoires avant et après un obstacle (pour prendre son élan et atterrir)
    // À partir de quelle colonne chaque obstacle peut apparaître (caisses et lave : dès le début).
    debloque: { caisse: 0, lave: 0, tour: 60 },
    // Les murets à pics ne sont plus tirés au hasard (étape 9) : il y en a un tous les 50 blocs environ.
    murets: {
      premier: 50, // le premier muret est vers le bloc 50
      ecart: 50, // puis un tous les 50 blocs : 100, 150, 200, 250, 300
      decalageMax: 5, // « environ » : s'il y a un trou ou de la lave pile à cet endroit, on le décale d'au plus 5 blocs
    },
    // Largeur d'une mare de lave, en blocs (tirée au hasard entre les deux).
    // Étape 27 : 2 ou 3 blocs (une mare d'un bloc, le héros la survole sans la toucher).
    laveLargeurMin: 2,
    laveLargeurMax: 3,
    // Étape 29 : le monde à la taille du héros (2 blocs de haut). Hauteurs en blocs.
    // Le muret de 2 blocs se saute (le héros saute 4,5 blocs), ou se casse à la pioche (3 coups par pic).
    hauteurs: { caisse: 2, tour: 4, muret: 2 },
  },

  camera: {
    piedsAuPlusBas: 440, // sous terre, la caméra descend pour garder les pieds du héros au plus à 440 px du haut de l'écran
    teteAuPlusHaut: 250, // étape 26 : quand il grimpe, la caméra monte pour garder sa tête au moins à 250 px du haut (sous les compteurs)
    plusHaut: -1000000, // étape 28 : pas de limite, la caméra monte aussi haut que le héros construit
    positionJoueur: 320, // la caméra essaie de garder le héros à 320 px du bord gauche de l'écran
    tempsDeReaction: 0.07, // plus c'est petit, plus elle suit vite. 0,07 s → après 0,5 s, il reste moins de 0,1 % de l'écart
    zooms: [1, 1.5, 2], // étape 29 : la touche V change le zoom (×1 → ×1,5 → ×2 → ×1…)
  },

  // Le ralenti (touche L) : le temps du monde avance 4 fois moins vite. Étape 29 : la musique, les sons
  // et les bruits aussi (ils deviennent plus lents… et plus graves, comme un disque qu'on freine).
  ralenti: 0.25,

  // Le monde est mis à jour 120 fois par seconde, quel que soit l'ordinateur.
  pasDeTemps: 1 / 120,
};
