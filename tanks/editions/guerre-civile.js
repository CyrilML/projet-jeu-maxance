// ⚔️ L'ÉDITION « GUERRE CIVILE » : un pays INVENTÉ coupé en deux (demande 115, édition n° 6)
//
// ✍️ « Guerre civile : un pays inventé coupé en deux, milices, pick-ups armés (« technicals »), barricades en ville. »
// ✍️ (Cyril) « Fais du faux, évidemment. » Alors TOUT est INVENTÉ (aucun vrai pays, aucun vrai peuple, aucune vraie
// religion, aucun vrai chef, aucun vrai drapeau ; pas de sang ; aucun civil dans la bataille : la ville a été évacuée) :
//   - la RÉPUBLIQUE DE CORVANIE (un pays imaginaire au bord d'une mer chaude) est coupée en deux par la rue du Front ;
//   - 🟢 LE FRONT DES OLIVIERS (toi) : une MILICE de quartier. Des habits mélangés (jeans, vestes, treillis), la
//     casquette et le FOULARD vert ; des PICK-UPS ARMÉS (« technicals » : une mitrailleuse lourde sur le plateau), de
//     vieux chars repris, des mortiers. Son chef inventé : le commandant Teodor Valk. Son drapeau : vert et crème au rameau ;
//   - 🔴 LA GARDE RÉPUBLICAINE : l'armée du gouvernement. L'uniforme couleur sable, le casque rond ; des chars, des
//     transports blindés, UN hélicoptère de combat. Son chef inventé : le général Aurel Castan. Son drapeau : rouge et
//     crème à l'étoile ;
//   - la VILLE DE TESSALINE : des maisons couleur de sable aux toits plats, des rues étroites, le SOUK aux étals couverts
//     de toiles, la TOUR DE L'HORLOGE, la vieille CITADELLE, le dépôt des bus, le moulin à huile et ses OLIVERAIES ; des
//     BARRICADES partout (voitures brûlées, pneus, sacs de sable, conteneurs, bus, blocs de béton), des POSTES DE CONTRÔLE,
//     la « rue des draps » (des draps tendus entre les maisons pour se cacher des tireurs), des graffitis des deux camps ;
//   - la règle : 5 DRAPEAUX DE QUARTIER à prendre (logique/guerre-civile.js). Le camp qui en tient le plus fait baisser
//     les TICKETS de l'autre (ses renforts) ; à 0 ticket, il a perdu. (Tous les chars ennemis détruits : gagné aussi.)
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.
// Les nombres : m, s, m/s, rad (comme config.js).

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  const SANS_ATELIER = ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser", "peinture"];
  // ✍️ LES LIEUX (x, z du milieu). Les Bleus (toi) sont au sud (z > 0), les Rouges au nord (z < 0) ; la rue du Front
  // coupe la ville en deux à z = 0.
  const CITADELLE = { x: -300, z: 0, demi: 25 }, DEPOT = { x: 185, z: 0 }, MOULIN = { x: 360, z: -40 };
  const C0 = CITADELLE, d = C0.demi, porte = 4.5, bout = (d * 2 - porte * 2) / 4; // (la porte : 9 m au milieu des murs nord et sud)
  Tanks.EDITIONS.ajouter("civile", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: false, barrage: false, vagues: false,
      voixRadio: true,
      base3d: true,
      quartiers: true, // ✍️ les drapeaux de quartier, les tickets, les barricades, les mortiers (logique/guerre-civile.js)
    },
    modeles: {
      casques: { bleus: "milice", rouges: "rond" }, // (affichage/engins3d.js : la casquette et le foulard de la milice ; le casque rond de la Garde)
      equipementModerne: false,
      arbres: "mediterranee", // (affichage/decor.js : des oliviers gris-vert, et des palmiers)
      vehicules: { camion: "tortue", quad: "technical", camionAA: "pickup" }, // (le transport blindé ; les pick-ups armés : affichage/vehicules3d-civile.js)
      dca: "technical", // (affichage/vehicules3d-civile.js : la mitrailleuse lourde sur le plateau du pick-up, à la place du canon double)
      avions: { chasseur: "vipere" }, // (l'hélico de combat de la Garde : affichage/avions3d-froide.js)
    },
    textes: {
      surTitre: "⚔️ Un pays inventé coupé en deux · Barricades · Pick-ups armés · Drapeaux de quartier",
      bataille: "la ville de Tessaline",
      drapeaux: { bleus: { fond: ["#2f6b4a", "#e9e2c8"], embleme: "rameau" }, rouges: { fond: ["#7a1f24", "#e6dcc0"], embleme: "etoile" },
        chefs: "chefs inventés : le commandant Teodor Valk (Front des Oliviers) · le général Aurel Castan (Garde républicaine)" },
    },
    remplace: {
      equipes: {
        bleus: { nom: "le Front des Oliviers", marque: "#58d17a", camouflage: ["#a89878", "#8a7c60", "#5e5444", "#c8b898"] },
        rouges: { nom: "la Garde républicaine", marque: "#ff5a4a", camouflage: ["#c2aa7c", "#a88e62", "#7c6848", "#d8c49c"] },
        allies: 2, ennemis: 3,
      },
      // ✍️ LES CHARS (inventés, sur la base des vieux chars des autres éditions, repeints couleur sable) : le vieux char
      // repris par la milice (de la ferraille soudée dessus), et le char de la Garde (bas, long canon)
      chars: [
        { id: "vieuxlion", nom: "Char M-51 « Vieux Lion »", pays: "Front des Oliviers", drapeau: "🟢", modele3d: "bison", longueur: 6.2, largeur: 3.0, hauteur: 2.9, canon: 3.2,
          vitesseMax: 12, acceleration: 2.6, rotation: 0.6, tourelle: 0.6, recharge: 2.4,
          texte: "Un vieux char repris à la Garde, réparé dans un garage : lent, mais il tient encore." },
        { id: "faucon", nom: "Char T-66 « Faucon des sables »", pays: "Garde républicaine", drapeau: "🔴", modele3d: "sanglier", longueur: 6.6, largeur: 3.3, hauteur: 2.4, canon: 4.6,
          vitesseMax: 13.5, acceleration: 2.6, rotation: 0.55, tourelle: 0.55, recharge: 2.4,
          texte: "Le char de la Garde : très bas, long canon, peint couleur sable." },
      ],
      char: { vie: 4, vieJoueur: 14 },
      peinture: { bleus: { taches: ["#a89878", "#8a7c60", "#6e6450", "#c8b898"], boue: "#6e5a40", poussiere: "#d8c8a0" }, rouges: { taches: ["#c2aa7c", "#a88e62", "#8c7650", "#d8c49c"], boue: "#6e5a40", poussiere: "#d8c8a0" } },
      soldats: { parEquipe: 16, lanceRoquettes: 3 },
      armes: {
        soldat: { cadence: 0.2, precision: 0.36, portee: 170, degats: 1 },
        mitrailleuse: { nom: "Mitrailleuse lourde", cadence: 0.09, precision: 0.5, portee: 280, degats: 1.2 },
        // ✍️ la mitrailleuse lourde du PICK-UP ARMÉ (les balles de son tireur, comme celles d'un soldat ; cone : rad où une
        // balle « trouve » sa cible)
        technical: { nom: "Mitrailleuse lourde du pick-up", cadence: 0.11, precision: 0.55, portee: 240, degats: 1.4, cone: 0.1 },
      },
      // les engins de ton camp : le 4x4, TON PICK-UP ARMÉ (E : conduire ; F : prendre la mitrailleuse), la moto, le
      // transport blindé (repris à la Garde). Pas d'avion, pas d'hélico, pas de bateau. L'ennemi a son pick-up armé aussi.
      parc: { engins: ["jeep", "dca", "moto", "camion"], bateau: false, sousmarin: false, dcaEnnemi: true },
      engins: {
        jeep: { nom: "4x4 à mitrailleuse « Chacal »", icone: "🚙" },
        moto: { nom: "Moto tout-terrain", icone: "🏍️" },
        camion: { nom: "Transport blindé « Tortue » (repris)", icone: "🛻", vitesseMax: 16, vie: 4 },
        // ✍️ LE PICK-UP ARMÉ (« technical ») : TOI au volant (E), le TIREUR (l'ordinateur) debout sur le plateau, à la
        // mitrailleuse lourde. F : tu changes de siège (tu prends la mitrailleuse : ← → tourner, Espace tirer). C'est le
        // même système que le camion antiaérien (logique/antiaerien.js), mais « sol » : il vise les soldats et les
        // véhicules ennemis, pas les avions. plateau : la hauteur (m) du plancher où la mitrailleuse est posée.
        dca: { nom: "Pick-up armé « Technical »", nomCourt: "pick-up armé", icone: "🛻", modele: "pick-up, mitrailleuse lourde sur le plateau",
          longueur: 5.3, largeur: 2.0, hauteur: 2.7, rayon: 2.3,
          vitesseMax: 24, acceleration: 6, freinage: 10, ralentissement: 2.5, marcheArriere: 6, braquage: 0.6, empattement: 3.2, virage: 1.1,
          penche: 0.05, vie: 3, lourd: false, son: [60, 150],
          rotation: 1.9, levee: 0.9, cadence: 0.11, hausse: [-0.12, 0.5], canon: { x: -1.25, y: 2.3 }, plateau: 0.95, retour: 35,
          sol: { arme: "technical", portee: 240 },
          tireur: { indicatif: "Mitrailleur du pick-up", vie: 3, pense: 0.25, portee: 240, hauteurMin: 8, rotation: 1.5, levee: 0.8, vise: 0.08, rafale: 9, pause: 1.1,
            erreur: { bleus: 0.03, rouges: 0.05 }, remplace: 8, parole: 4, engage: 8,
            phrases: {
              engage: ["{quoi} à {heures}, {distance} ! J'arrose !", "Contact ! {quoi} à {heures}, je tire !", "{quoi} en vue, {heures} ! Je le prends !"],
              touche: ["Touché !", "Je l'ai touché !"],
              abattu: ["Il ne bouge plus ! Suivant !", "Cible au tapis !"],
              blesse: ["Je suis touché ! Je tiens la mitrailleuse…", "Aïe ! Ils nous tirent dessus, sur le plateau !"],
              tombe: ["Mitrailleur à terre ! La mitrailleuse se tait !"],
              nouveau: ["Nouveau mitrailleur sur le plateau. Prêt !"],
            } },
          // l'ennemi patrouille dans SA moitié de la ville (écrit pour les Bleus ; chez les Rouges, z change de signe)
          patrouille: [[-100, 60], [-20, 62], [100, 60], [60, 140], [-80, 140]] },
        // ✍️ LES PICK-UPS ARMÉS de l'ordinateur (dans les deux camps) : ce sont les « quads » de l'ordinateur, habillés en
        // pick-ups (un pick-up est plus long, plus lourd ; son tireur tourne la mitrailleuse : il tire de tous les côtés)
        quad: { nom: "Pick-up armé", nomCourt: "Pick-up", icone: "🛻", longueur: 5.2, largeur: 1.95, hauteur: 2.5, rayon: 2.3,
          vitesseMax: 21, acceleration: 6, freinage: 10, ralentissement: 2.5, marcheArriere: 5, braquage: 0.6, empattement: 3.2, virage: 1.0,
          penche: 0.05, vie: 2, balles: 6, ballesJoueur: 12, arme: "technical", son: [60, 150] },
      },
      vehicules: { parCamp: { moto: 1, quad: 2, camion: 1 }, coneQuad: 3.2, distance: { moto: 45, quad: 55 }, couloir: 130, front: 120 },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { toutesLes: 1e9, premier: 1e9 },
      // ✍️ L'HÉLICO DE COMBAT de la Garde (un seul) : il passe au-dessus de la ville et lâche ses roquettes
      avionsEnnemis: { nombre: 1, nom: "Hélico de combat de la Garde", noms: ["Hélico de combat « Faucon gris »"], modeles: ["vipere"],
        vitesse: 48, virage: 0.7, altitude: 55, vie: 4, bombes: 2, premierPassage: 70, retour: 80, erreurBombe: 10 },
      projectiles: {
        // ✍️ l'obus de MORTIER (il tombe presque droit du ciel : logique/guerre-civile.js le lance)
        barrage: { vitesse: 120, gravite: 9.8, degatsChar: 0.6, souffle: 7, vieMax: 6 },
      },
      structures: { explosions: { barrage: [110, 3.6] } },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : Tessaline et ses environs
      monde: { camp: 460, arbres: 700, bosquets: 22, forets: 0, partForets: 0, partBosquets: 0.5, haies: 0, granges: 6,
        collines: { hauteur: 9, taille: 260 },
        village: { nom: "la ville de Tessaline", rayon: 75, maisons: 0, murets: 0, ruines: 0 },
        hameaux: [{ nom: "le hameau des Cyprès", x: -560, z: 260, rayon: 45, maisons: 6, murets: 8 }, { nom: "la ferme des Roches", x: 520, z: -300, rayon: 40, maisons: 5, murets: 8 }] },
      // la ville : des maisons basses (2 ou 3 étages) aux toits plats, des boutiques (les stores des étals), du linge aux
      // balcons, des climatiseurs ; beaucoup de voitures brûlées ; « affiches » : les GRAFFITIS sur les murs
      ville: { immeubles: 0.3, etages: [2, 3], boutiques: 0.65, balcons: 0.5, clims: 0.3, affiches: 0.5, vitresCassees: 0.45, voiture: 15,
        objets: 6, papiers: 22, terrasses: 0.25, abribus: 0.05, kiosque: 0.05, panneau: 0.2,
        parts: { portesOuvertes: 0.4, brulees: 0.35, accidentees: 0.15, milieu: 0.2 } },
      cartes: [
        { id: "bataille", nom: "La ville de Tessaline", icone: "⚔️", texte: "La ville couleur de sable coupée en deux par la rue du Front : les barricades, le souk, la tour de l'Horloge, la citadelle, les oliveraies.", infanterie: false,
          variante: { arbres: 1, collines: 1, herbe: false, palmiers: 0.3, village: false,
            // la ville (le même urbaniste que la carte « La ville », logique/ville.js), à moitié abandonnée ; « vides » : les
            // pâtés sans maison (la place de l'Horloge, le souk) [gi, gj]
            quartier: { x: 0, z: 0, rayon: 150, ilot: 40, rue: 9, maisons: 3, ruinesDepart: 0.15, vides: [[-1, 0], [0, -1]] }, rues: "#8e7a5c", ville: "abandonnee", toitPlat: true,
            crepis: ["#d8c39a", "#cdb48a", "#e2d2ae", "#c4a77c", "#d9c8a4", "#bfa078", "#e8dcc0", "#d4b48c"],
            // ✍️ LES BÂTIMENTS posés à la main : [x, z, demi-longueur, demi-largeur, angle, hauteur, type, nom, lieu]
            // (type « rempart » : un mur épais en pierre, sans toit)
            batiments: [
              [-29, 29, 2.7, 2.7, 0, 21, "tour", "la tour de l'Horloge", "la place de l'Horloge"],
              // la CITADELLE : 4 tours d'angle et des remparts (une porte au nord, une au sud)
              [C0.x - d, C0.z - d, 3.6, 3.6, 0, 11, "tour", "la tour nord-ouest", "la citadelle"], [C0.x + d, C0.z - d, 3.6, 3.6, 0, 11, "tour", "la tour nord-est", "la citadelle"],
              [C0.x - d, C0.z + d, 3.6, 3.6, 0, 11, "tour", "la tour sud-ouest", "la citadelle"], [C0.x + d, C0.z + d, 3.6, 3.6, 0, 11, "tour", "la tour sud-est", "la citadelle"],
              [C0.x - d, C0.z, d - 3.6, 1.3, Math.PI / 2, 5.5, "rempart", "le rempart ouest", "la citadelle"], [C0.x + d, C0.z, d - 3.6, 1.3, Math.PI / 2, 5.5, "rempart", "le rempart est", "la citadelle"],
              [C0.x - d + 3.6 + bout, C0.z - d, bout, 1.3, 0, 5.5, "rempart", "le rempart nord", "la citadelle"], [C0.x + d - 3.6 - bout, C0.z - d, bout, 1.3, 0, 5.5, "rempart", "le rempart nord", "la citadelle"],
              [C0.x - d + 3.6 + bout, C0.z + d, bout, 1.3, 0, 5.5, "rempart", "le rempart sud", "la citadelle"], [C0.x + d - 3.6 - bout, C0.z + d, bout, 1.3, 0, 5.5, "rempart", "le rempart sud", "la citadelle"],
              // le moulin à huile, au milieu des oliveraies ; le garage du dépôt des bus
              [MOULIN.x, MOULIN.z, 8, 5, 0.3, 6, "grange", "le moulin à huile", "l'oliveraie"],
              [DEPOT.x + 22, DEPOT.z - 26, 12, 6, 0, 6, "grange", "le garage des bus", "le dépôt des bus"],
            ],
            // ✍️ LES OLIVERAIES (des oliviers en rangées) : [x, z, rangées, colonnes, écart (m), taille]
            vergers: [[-560, 90, 7, 14, 8, 0.5], [-520, -230, 8, 12, 8, 0.5], [230, 150, 7, 12, 8, 0.5], [300, -180, 8, 10, 8, 0.5], [MOULIN.x + 20, MOULIN.z + 20, 6, 8, 8, 0.48], [-120, 260, 5, 14, 8, 0.5], [-160, -280, 5, 14, 8, 0.5]],
            // le sol : la terre sèche couleur de sable, la poussière des chemins
            sol: { herbe: [170, 152, 108], herbeSombre: [148, 132, 92], herbeSeche: [190, 170, 124], herbeJaune: [196, 176, 122], terre: [160, 128, 88], terreBattue: [178, 148, 106],
              sousBois: [142, 126, 92], sable: [210, 188, 142], boue: [120, 96, 70], fond: [150, 130, 96], chemin: [188, 162, 120] },
            soleil: { couleur: 0xffe2b0, force: 3.0, ciel: 0xe8d4b0, sol: 0x9a8058 }, brume: 0xe2cca4 } },
      ],
      perchoirs: { parCarte: { bataille: { mirador: 3, chateau: 1, colline: 2, echafaudage: 3 } } },
      // ✍️ LES QUARTIERS, LES TICKETS, LES BARRICADES, LES MORTIERS (logique/guerre-civile.js). m, s.
      //   points : [x, z, nom, camp au départ (« bleus », « rouges » ou null)] ; rayon : m autour du drapeau ; prise : s pour
      //   prendre un drapeau neutre tout seul (plus vite à plusieurs, jusqu'à × « plusieurs ») ; personne ne prend un
      //   drapeau où les deux camps sont là (il est « disputé ») ;
      //   tickets : les renforts de chaque camp au départ ; toutes les « saigne » s, le camp qui tient le PLUS de drapeaux
      //   enlève (la différence) tickets à l'autre ; chaque soldat tombé coûte 1 ticket, chaque char détruit « char » ;
      //   renforts : toutes les « toutesLes » s, un camp à qui il manque des soldats en fait arriver un (s'il a des tickets),
      //   à l'arrière de la ville (« arriere » m du centre) ;
      //   mortiers : [x, z] écrits pour les Bleus (chez les Rouges, z change de signe) ; toutesLes [min, max] s, « obus » par
      //   salve, « ecart » m de dispersion, « hauteur » m d'où l'obus tombe ;
      //   front : la rue du Front (z) et ses postes de contrôle (x) ; draps : la rue des draps (x de la rue, z de début et
      //   de fin, écart entre deux draps).
      quartiers: {
        points: [[C0.x, C0.z, "la Citadelle", null], [-15, 15, "la place de l'Horloge", "bleus"], [20, -20, "le Souk", "rouges"], [DEPOT.x, DEPOT.z, "le dépôt des bus", null], [MOULIN.x, MOULIN.z + 12, "le moulin à huile", null]],
        rayon: 16, prise: 14, plusieurs: 2.5, pense: 0.25,
        tickets: 220, saigne: 5, char: 6,
        renforts: { toutesLes: 5, arriere: 230 },
        mortiers: { places: [[-70, 210], [80, 220]], toutesLes: [30, 44], obus: 3, cadence: 1.4, ecart: 12, hauteur: 140, premier: 40 },
        front: { z: 0, postes: [-80, 80], x: [-470, 470] },
        draps: { x: -40, z: [12, 118], ecart: 11 },
        conteneurs: ["#9a3a26", "#2e5a8a", "#3e6e3a", "#c8c2b0", "#b8862a", "#6a2e3a"],
      },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES
      classes: {
        assaut: { nom: "Combattant", icone: "🪖", texte: "Le fusil d'assaut DK-47 (la crosse en bois, le chargeur courbe) ou la mitrailleuse « Grêlon ». Et des grenades.",
          armes: ["drovnik", "garrow"], gadgets: ["sacMunitions"], explosifs: ["grenades", "fumigene"] },
        ingenieur: { nom: "Sapeur", icone: "🚀", texte: "Le lance-roquettes contre les chars et les pick-ups. Il répare aussi les engins.",
          armes: ["rpg7", "becker40"], gadgets: ["reparation"], explosifs: ["mineAT", "c4"], armesBonus: ["drovnik"] },
        eclaireur: { nom: "Tireur", icone: "🎯", texte: "Le fusil de tireur désigné (semi-automatique, lunette), ou le VIEUX fusil à verrou de grand-père, avec sa petite lunette.",
          armes: ["dv63", "fusil86lunette"], gadgets: ["jumelles"], explosifs: ["grenades"] },
        medecin: { nom: "Secouriste", icone: "⛑️", texte: "Il soigne et relève les blessés. Un vieux mousqueton pour se défendre.",
          armes: ["drovnik", "mousqueton92"], gadgets: ["trousse"], explosifs: ["grenades", "fumigene"], plaques: false },
      },
      armesPrincipales: {
        drovnik: { nom: "Fusil d'assaut DK-47", type: "Fusil d'assaut (7,62 mm, 30 coups)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le vieux fusil d'assaut qu'on trouve partout : la crosse en bois, le chargeur courbe en « banane ». Il fait mal, mais il saute.",
          degats: 1.25, cadence: 0.1, portee: 210, porteeEfficace: 90, degatsLoin: 0.6, chargeur: 30, reserve: 180, rechargement: 2.5,
          dispersion: 0.036, dispersionVisee: 0.008, recul: 0.014, visee: 0.27, mobilite: 0.98, bruit: 1.15, zoom: 1.3, vitesseBalle: 715 },
        garrow: { nom: "Mitrailleuse PK-9 « Grêlon »", type: "Mitrailleuse (bande de 100)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, exclus: SANS_ATELIER,
          texte: "Lourde, sur son bipied, sa bande de 100 cartouches : elle tient une rue entière. Tu bouges lentement.",
          degats: 1.3, cadence: 0.1, portee: 260, porteeEfficace: 120, degatsLoin: 0.65, chargeur: 100, reserve: 300, rechargement: 5.5,
          dispersion: 0.05, dispersionVisee: 0.012, recul: 0.012, visee: 0.45, mobilite: 0.82, bruit: 1.5, zoom: 1.3 },
        rpg7: { nom: "Lance-roquettes RK-7", type: "Lance-roquettes", exclus: SANS_ATELIER, texte: "Le tube et sa roquette en ogive : 1 roquette = 1 obus sur un char (et un pick-up n'aime pas ça du tout)." },
        becker40: { nom: "Lance-grenades Becker 40", type: "Lance-grenades (40 mm, coup par coup)", icone: "💥", classe: "ingenieur", famille: "roquettes", projectile: "lg40", niveau: 0, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le gros fusil à canon court : une grenade de 40 mm qui explose en touchant. Parfait par-dessus une barricade.",
          degats: 0.3, cadence: 0.4, portee: 180, porteeEfficace: 180, degatsLoin: 1, chargeur: 1, reserve: 24, rechargement: 1.8,
          dispersion: 0.03, dispersionVisee: 0.01, recul: 0.03, visee: 0.3, mobilite: 0.98, bruit: 0.6, zoom: 1.3 },
        dv63: { nom: "Fusil de tireur désigné DV-63", type: "Fusil semi-automatique, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le long fusil à la crosse évidée et sa lunette : 10 balles, semi-automatique. Pour tenir une rue de loin.",
          degats: 2.2, cadence: 0.55, portee: 380, porteeEfficace: 240, degatsLoin: 0.8, chargeur: 10, reserve: 40, rechargement: 2.8,
          dispersion: 0.07, dispersionVisee: 0.0012, recul: 0.025, visee: 0.4, mobilite: 0.98, bruit: 1.3, zoom: 4, vitesseBalle: 700 },
        fusil86lunette: { nom: "Vieux fusil à verrou « Grand-père »", type: "Fusil à verrou, petite lunette ×3", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Un très vieux fusil à verrou sorti d'un grenier, avec une petite lunette : lent, mais une balle suffit.",
          degats: 3, cadence: 1.3, portee: 380, porteeEfficace: 260, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 4.2,
          dispersion: 0.07, dispersionVisee: 0.0012, recul: 0.026, visee: 0.42, mobilite: 0.95, bruit: 1.3, zoom: 3, vitesseBalle: 700 },
        mousqueton92: { nom: "Vieux mousqueton", type: "Carabine à verrou", icone: "🔫", classe: "medecin", famille: "fusil", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Une vieille carabine à verrou, courte et légère : 5 balles.",
          degats: 2, cadence: 1, portee: 200, porteeEfficace: 100, degatsLoin: 0.7, chargeur: 5, reserve: 50, rechargement: 2.9,
          dispersion: 0.026, dispersionVisee: 0.005, recul: 0.024, visee: 0.26, mobilite: 1.02, bruit: 1.2, zoom: 1.3, vitesseBalle: 620 },
      },
      pistolets: R({
        colton45: { nom: "Pistolet Colton", type: "Pistolet (.45)", icone: "🔫", famille: "pistolet", niveau: 0, exclus: SANS_ATELIER,
          texte: "Un gros vieux pistolet : 7 balles qui font mal.",
          degats: 1.3, cadence: 0.32, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 7, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.032, dispersionVisee: 0.012, recul: 0.03, visee: 0.15, mobilite: 1.05, bruit: 0.9, zoom: 1.2 },
        varnP38: { nom: "Pistolet Tokar", type: "Pistolet (7,62 mm)", icone: "🔫", famille: "pistolet", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le pistolet plat de la Garde : 8 balles rapides.",
          degats: 1, cadence: 0.27, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 8, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.03, dispersionVisee: 0.011, recul: 0.024, visee: 0.15, mobilite: 1.05, bruit: 0.9, zoom: 1.2 },
      }),
      gadgets: { trousse: { nom: "Trousse de secours" }, jumelles: { nom: "Jumelles" }, reparation: { nom: "Caisse à outils" }, sacMunitions: { nom: "Sac de munitions" } },
      explosifs: { c4: { nom: "Charge de démolition", icone: "🧨" }, mineAT: { nom: "Mine antichar" } },
      armes3d: {
        ia: {
          bleus: [["drovnik", 7], ["garrow", 1], ["mousqueton92", 1.2]],
          rouges: [["drovnik", 8], ["garrow", 1.2]],
          roquettes: [["rpg7", 1]],
          elite: { bleus: [["fusil86lunette", 1]], rouges: [["dv63", 1]], viseur: [["mire", 1]] },
          viseur: [["mire", 1]], canon: [["standard", 1]], bouche: [["aucune", 1]], chargeur: [["standard", 1]], poignee: [["aucun", 1]],
        },
      },
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["La CASQUETTE et le FOULARD vert du Front (la Garde : le casque rond et l'uniforme sable)", "Des habits mélangés : jean, veste, pantalon de treillis", "Le gilet à poches pour les chargeurs", "Le fusil DK-47 à crosse en bois"] },
        ingenieur: { equipement: ["Le lance-roquettes RK-7 et ses roquettes dans le dos", "La caisse à outils (il répare les pick-ups)", "Mines et charges de démolition"] },
        eclaireur: { equipement: ["Le fusil à lunette (DV-63, ou le vieux fusil de grand-père)", "Les jumelles", "Le foulard remonté sur le nez contre la poussière"] },
        medecin: { equipement: ["Le brassard blanc à croix rouge", "La trousse de secours", "Un vieux mousqueton pour se défendre"] },
      } },
      // ---------------------------------------------------------------- 🧵 LES HABITS, LA LUMIÈRE CHAUDE ET LA POUSSIÈRE
      realisme: {
        explosions: { tailles: { barrage: 1.1 } },
        soldats: {
          uniformes: {
            // la milice : des habits MÉLANGÉS (le « motif » mélange des taches de jean, de veste marron, de treillis)
            bleus: { nom: "habits mélangés (foulard vert)", fond: "#6e6650", taches: ["#3e4c5e", "#7a5a3c", "#5a5e46", "#8a8270"], equipement: "#3e3a2e", casque: "#3a3a34" },
            rouges: { nom: "uniforme sable (Garde)", fond: "#bba67e", taches: ["#a08a62", "#cdb890", "#8e7a56"], equipement: "#7a6a4c", casque: "#a8946a" },
            motif: 0.85, ripstop: 0.006, plis: 1.1, boue: 0.35, relief: 1.6,
          },
          visage: { barbe: 0.55, lunettes: ["aucune", "soleil", "aucune", "soleil"] },
        },
        // ☀️ un soleil chaud de fin d'après-midi, de la poussière dans l'air
        lumiere: { bataille: { direction: [0.6, 0.48, 0.3], couleur: "#ffe0b0", force: 3.0, ciel: "#ead2a8", sol: "#9a7e56", ambiance: 1.0, exposition: 1.0,
          zenith: "#7aa0c4", horizon: "#f0d8ae", brume: "#e6cfa6", halo: 0.8, nuages: 0.25, fumees: 7, filtre: { saturation: 0.95, contraste: 1.06 } } },
        atmosphere: { debut: 0.32 },
      },
      ambiance: { saturation: 0.9, teinte: 0.42, vignette: 0.5, grain: 0.06 },
      // ---------------------------------------------------------------- 🪕 LA MUSIQUE : un luth (oud) et des percussions
      // oud : la force du LUTH pincé (affichage/musique.js) ; darbouka : la force du petit tambour en gobelet ;
      // rythme : sur les 6 croches de chaque mesure, « D » = le coup grave au milieu de la peau, « t » = le coup sec au bord
      musique: {
        tempo: 112, volume: 0.42, nappe: 0.04, violoncelles: 0.05, cuivres: 0, pulsation: 0.05, tambours: 0.35, choeur: 0.012, cymbales: 0.02,
        oud: 0.16, darbouka: 0.5, rythme: ["D", "", "t", "D", "t", "t"],
        braam: { fort: 0.1, duree: 3 },
        accords: [
          { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] }, { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] },
          { nom: "mi bémol", notes: ["Eb2", "Bb2", "Eb3", "G3"] }, { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] },
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "sol mineur", notes: ["G1", "D2", "G2", "Bb2"] },
          { nom: "mi bémol", notes: ["Eb2", "Bb2", "Eb3", "G3"] }, { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] },
        ],
        // la mélodie (le mode de ré « à la seconde augmentée » : ré, mi bémol, fa dièse, sol, la, si bémol, do)
        melodie: [
          [[0, "D4", 1], [1, "Eb4", 1], [2, "F#4", 2], [4, "G4", 1], [5, "F#4", 1]], [[0, "Eb4", 2], [2, "D4", 4]],
          [[0, "G4", 1], [1, "A4", 1], [2, "Bb4", 2], [4, "A4", 1], [5, "G4", 1]], [[0, "F#4", 3], [3, "Eb4", 1], [4, "D4", 2]],
          [[0, "C5", 2], [2, "Bb4", 1], [3, "A4", 1], [4, "G4", 2]], [[0, "Bb4", 1], [1, "A4", 1], [2, "G4", 1], [3, "F#4", 3]],
          [[0, "G4", 1], [1, "F#4", 1], [2, "Eb4", 2], [4, "F#4", 2]], [[0, "D4", 6]],
        ],
      },
    },
  });
})();
