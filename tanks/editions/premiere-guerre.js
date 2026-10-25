// 🪖 L'ÉDITION 1916 : la Première Guerre mondiale (demande 115, édition n° 1)
//
// ✍️ « Première Guerre mondiale (1916) : tranchées, barbelés, boue, fusils à verrou, mitrailleuses lourdes, tanks
// losanges, biplans. » ✍️ (Cyril) « Fais du faux, évidemment. » Alors c'est une guerre INVENTÉE, inspirée de 1916 :
//   - 🔵 l'ENTENTE DE VALMONT (capote bleu horizon, casque à cimier, le drapeau bleu et or à la fleur) contre
//   - 🔴 l'EMPIRE DE KRESSIA (vareuse gris de campagne, casque à couvre-nuque, le drapeau noir et rouge à l'aigle) ;
//   - le front de la MARNE-VIVE : deux lignes de tranchées en zigzag, le no man's land plein de cratères et de boue, les
//     barbelés, les arbres déchiquetés, le village en ruines et son église. Les chefs, les pays, les drapeaux : inventés.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus
// config.js. Les nombres : m, s, m/s, rad (comme config.js).
// Pour écrire l'édition suivante : copier ce fichier, changer « remplace », « regles », « modeles » et « textes ».

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  // (pas d'atelier sur les armes de 1916 : ni lunettes modernes, ni lampes, ni lasers. Juste l'assistance à la visée.)
  const SANS_ATELIER = ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser", "peinture"];
  Tanks.EDITIONS.ajouter("1916", {
    // ---------------------------------------------------------------- les interrupteurs de l'édition
    regles: {
      campagne: false, // (la campagne de Valdrie se joue en Moderne)
      boutique: false, // (les skins et les armes de la boutique sont modernes)
      film: false, // (la bande-annonce montre l'édition Moderne)
      tranchees: true, // les tranchées, les barbelés, les mitrailleuses lourdes (logique/tranchees.js)
      barrage: true, // le barrage d'artillerie sur le no man's land
      vagues: true, // les coups de sifflet : les vagues d'assaut qui sortent de la tranchée
      voixRadio: false, // (pas de radio en 1916 : les voix sont coupées au départ, N pour les remettre ; les messages restent écrits)
      base3d: false, // (pas d'aérodrome en béton : un pré bien plat)
      departAPied: true, // tu commences À PIED, sur la banquette de ta tranchée (ton tank attend derrière, au camp)
      gramophone: true, // la musique passe par un vieux gramophone (affichage/musique.js)
    },
    // ---------------------------------------------------------------- les modèles 3D à prendre
    modeles: {
      casques: { bleus: "adrian", rouges: "kressien" }, // (affichage/engins3d.js : le casque à cimier, le casque à couvre-nuque)
      chapeauEclaireur: false, // (l'éclaireur garde son casque)
      equipementModerne: false, // (pas de support de lunettes de nuit, de balise, de rails sur les casques)
      avions: { avion: "biplan", chasseur: "biplan", transport: "bombardier" }, // (affichage/avions3d-1916.js)
      projectiles: { missile: "balles" }, // (les « missiles » des biplans sont des rafales de mitrailleuse : on dessine des traceurs)
    },
    // ---------------------------------------------------------------- les textes de l'écran
    textes: {
      surTitre: "⚔️ 1916 · Tranchées · Barbelés · Tanks losanges · Biplans",
      bataille: "le front de la Marne-Vive",
      drapeaux: { bleus: { fond: ["#2d4f9e", "#e9d38a"], embleme: "fleur" }, rouges: { fond: ["#1b1b1b", "#b3261e"], embleme: "aigle" } },
    },
    // ---------------------------------------------------------------- ce qui change dans config.js
    remplace: {
      equipes: {
        bleus: { nom: "l'Entente de Valmont", marque: "#7fa8e0", camouflage: ["#6e6a4c", "#8b815c", "#4b4a37", "#9b916c"] },
        rouges: { nom: "l'Empire de Kressia", marque: "#d24a3a", camouflage: ["#5c5f55", "#76776b", "#44463e", "#8b8676"] },
      },
      // ✍️ LES TANKS de 1916 (inventés) : le gros LOSANGE (les chenilles font tout le tour de la caisse, un canon dans
      // chaque casemate sur les flancs, et une petite tourelle d'observation sur le toit) et le petit char léger, la
      // « Fourmi » (une tourelle qui tourne, le moteur derrière, une queue pour franchir les tranchées). Lents !
      chars: [
        { id: "losange", nom: "Losange R-16 « Taureau »", pays: "Valmont", drapeau: "⚜️", modele3d: "losange", longueur: 8.1, largeur: 4.1, hauteur: 2.5, canon: 1.1,
          vitesseMax: 3.4, acceleration: 0.9, rotation: 0.24, tourelle: 0.5, recharge: 3.6, texte: "Le gros losange : il franchit les tranchées et écrase les barbelés. Très lent (12 km/h)." },
        { id: "fourmi", nom: "Char léger L-17 « Fourmi »", pays: "Valmont", drapeau: "⚜️", modele3d: "fourmi", longueur: 5.0, largeur: 1.8, hauteur: 2.15, canon: 0.9,
          vitesseMax: 5.2, acceleration: 1.4, rotation: 0.5, tourelle: 0.9, recharge: 2.6, texte: "Le petit char à tourelle : 2 hommes, plus vif (19 km/h), mais moins blindé." },
      ],
      char: { vie: 3, vieJoueur: 12, hausseMax: 0.25 },
      // la peinture des tanks de 1916 : de grandes taches ocre, brunes et vertes (Valmont), grises et vert-de-gris (Kressia)
      peinture: { bleus: { taches: ["#7a6a46", "#5b4a32", "#2f2c24", "#8d8460"] }, rouges: { taches: ["#5d6154", "#6f705f", "#3d3f37", "#86826e"] } },
      obus: { vitesse: 420 },
      // les soldats de 1916 : moins de lance-roquettes (aucun !), un fusil plus lent mais qui fait plus mal
      soldats: { parEquipe: 18, lanceRoquettes: 0, vitesse: 3.8 },
      armes: {
        soldat: { cadence: 1.35, precision: 0.38, portee: 220, degats: 1.6 }, // (le fusil à verrou des soldats de l'ordinateur)
        elite: { cadence: 2.6, precision: 0.7, portee: 360, degats: 3 },
        mitrailleuse: { nom: "Mitrailleuse lourde", cadence: 0.1, precision: 0.5, portee: 320, degats: 1.4 },
        grenades: { nom: "Grenades à manche" },
      },
      // les engins de ton camp : seulement le biplan de chasse (ni 4x4, ni hélico, ni drone, ni camion antiaérien, ni bateau)
      parc: { engins: ["avion"], bateau: false, sousmarin: false, dcaEnnemi: false },
      engins: {
        avion: { nom: "Biplan de chasse « Hirondelle »", icone: "🛩️", vitesse: 52, virage: 1.05, tangage: 0.9, hauteurMin: 18, hauteurMax: 320, munitions: 40, recharge: 0.35, arme: "mitrailleuse", projectile: "rafale", cadence: 0.16, vie: 3 },
      },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 0 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { toutesLes: 1e9, premier: 1e9 },
      avionsEnnemis: { nombre: 2, nom: "Biplan de Kressia", vitesse: 50, virage: 0.75, altitude: 120, vie: 3, bombes: 2, premierPassage: 30, duel: 700,
        missile: { portee: 380, recharge: 0.45, cone: 0.28 }, projectile: "rafale", modeles: ["biplan", "bombardier"], noms: ["Chasseur « Aigle noir »", "Bombardier « Gotha-Rex »"], erreurBombe: 10 },
      projectiles: {
        rafale: { vitesse: 360, gravite: 1.5, degatsChar: 0.25, souffle: 0, guide: 0.9, vieMax: 2, aerien: true }, // (une rafale de mitrailleuse d'avion)
        barrage: { vitesse: 190, gravite: 9.8, degatsChar: 1, souffle: 9, vieMax: 8 }, // (un obus du barrage d'artillerie, qui tombe du ciel)
        obus: { souffle: 6 },
      },
      // (pas d'aérodrome moderne : la piste reste un pré bien plat, sans hangars ni béton)
      baseAerienne: { hangars: { places: [] }, rangesHangars: [], dalles: [] },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : le front de la Marne-Vive
      monde: { camp: 330, arbres: 900, forets: 3, bosquets: 30, haies: 20, granges: 8, pasHauteurs: 2,
        village: { nom: "le village en ruines de Saint-Aubrac", ruines: 60 },
        hameaux: [{ nom: "la ferme brûlée de Vaulx", x: -560, z: 60, rayon: 50, maisons: 6, murets: 10 }] },
      cartes: [
        { id: "bataille", nom: "Le front de la Marne-Vive", icone: "🪖", texte: "Deux lignes de tranchées, le no man's land plein de cratères et de barbelés, le village en ruines et son église.", infanterie: false,
          variante: { arbres: 1, collines: 0.35, herbe: false, matiereSol: "terre", village: true, tranchees: true, eglise: { x: 18, z: 34 }, ruinesVillage: 0.65,
            sol: { herbe: [92, 84, 62], herbeSombre: [70, 62, 46], herbeSeche: [112, 100, 76], herbeJaune: [98, 88, 64], terre: [84, 70, 52], terreBattue: [96, 82, 62], sousBois: [70, 60, 46], chemin: [102, 88, 66] } } },
      ],
      perchoirs: { parCarte: { bataille: { mirador: 3, colline: 3 } } },
      // ✍️ LE RÉSEAU DE TRANCHÉES (logique/tranchees.js). m, s.
      //   x : de x à x (la longueur du front) ; feu : |z| de la tranchée de tir de chaque camp (les Bleus au sud, z > 0) ;
      //   soutien : |z| de la tranchée de soutien ; boyaux : les x des couloirs qui relient tout, jusqu'à |z| = arriere ;
      //   zigzag… : [amplitude, période] des dents de scie ; profil : profondeur (le fond), banquette (la marche de tir, côté
      //   ennemi, moins profonde), fond et bord (m de chaque côté de la ligne : le fond plat, puis le haut de la paroi),
      //   marche : [début, fin] de la banquette (m côté ennemi) ;
      //   crateres : nombre, rayon et profondeur [min, max], zone : |z| où ils tombent, partDerriere : la part derrière les
      //   lignes (jusqu'à « derriere » m), eau : la part qui a de l'eau boueuse au fond ;
      //   barbeles : rangs (m devant la tranchée de tir), segment (m par tronçon), largeur (m), frein (× la vitesse d'un
      //   soldat accroché) ; mitrailleuses : x (3 par camp), cadence (toi / l'ordinateur), portee, cone (± rad de son
      //   secteur), rotation et levee (rad/s), rafale (balles), pause [min, max], erreur (rad), prise (m : un ennemi plus
      //   près fait taire le servant), retour (s), chauffe (par balle : à 1, elle s'ENRAYE « enrayage » s), refroidit (par s),
      //   enfonce (m : son trépied est enfoncé dans le parapet) ;
      //   vagues : premier (s), toutesLes (s), decalage (s : les Rouges plus tard), part (des soldats qui montent à l'assaut),
      //   renforts (par vague), front : [x, x] où sont leurs postes, toi : x de ton poste au départ ;
      //   barrage : premier, toutesLes, duree (s), obus, zone (|z|), hauteur (m d'où il tombe), vise (part des obus sur
      //   un soldat), ecart (m), rayonCoupe (m : il déchire les barbelés) ; couvert : × la chance d'être touché, à l'abri.
      tranchees: {
        x: [-940, 390], feu: 160, soutien: 212, arriere: 300, boyaux: [-780, -470, -180, 90, 330],
        zigzag: [4.5, 24], zigzagSoutien: [3, 32], zigzagBoyau: [1.5, 14],
        profil: { profondeur: 1.85, banquette: 1.15, fond: 0.7, bord: 1.2, marche: [0.32, 0.92] },
        crateres: { nombre: 380, rayon: [2.4, 7], profondeur: [0.5, 1.7], zone: 138, partDerriere: 0.18, derriere: 110, eau: 0.35 },
        barbeles: { rangs: [24, 30], segment: 8, largeur: 3.2, frein: 0.28 },
        mitrailleuses: { x: [-430, -110, 200], cadence: 0.085, cadenceIA: 0.13, portee: 330, cone: 1.05, rotation: 0.9, levee: 0.5, rafale: 14, pause: [0.9, 2.1], erreur: 0.035, pense: 0.3, prise: 6, retour: 25, chauffe: 0.012, refroidit: 0.25, enrayage: 3, enfonce: 0.3 },
        vagues: { premier: 30, toutesLes: 55, decalage: 22, part: 0.5, renforts: 8, front: [-560, 300], toi: 4 },
        barrage: { premier: 45, toutesLes: 50, duree: 10, obus: 16, zone: 135, hauteur: 260, vise: 0.55, ecart: 14, rayonCoupe: 5 },
        couvert: 0.4,
      },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES de 1916
      classes: {
        assaut: { nom: "Fantassin", icone: "🪖", texte: "En première ligne : le fusil à verrou et sa baïonnette, ou le fusil-mitrailleur. Et des grenades.",
          armes: ["fusil86", "kress98", "chaumard"], gadgets: ["sacMunitions"], explosifs: ["grenades", "fumigene"] },
        ingenieur: { nom: "Sapeur", icone: "✂️", texte: "Il COUPE les barbelés (cisailles), répare les tanks, et fait sauter les blindés avec le pétard de mélinite.",
          armes: ["mousqueton92", "fusil86"], gadgets: ["cisailles", "reparation"], explosifs: ["c4", "grenades"], armesBonus: ["fusilTranchee"] },
        eclaireur: { nom: "Tireur d'élite", icone: "🎯", texte: "Le fusil à lunette, posé sur le parapet. Et des jumelles pour repérer.",
          armes: ["fusil86lunette", "kress98lunette"], gadgets: ["jumelles"], explosifs: ["grenades"] },
        medecin: { nom: "Brancardier", icone: "⛑️", texte: "Il soigne avec ses pansements et relève les blessés. Le mousqueton pour se défendre.",
          armes: ["mousqueton92"], gadgets: ["trousse"], explosifs: ["grenades", "fumigene"], plaques: false },
      },
      armesPrincipales: {
        // 🪖 FANTASSIN — tous à VERROU (verrou : on réarme à la main après chaque tir : la culasse recule puis revient)
        fusil86: { nom: "Fusil Valmont 86", type: "Fusil à verrou (8 mm) et baïonnette", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER, baionnette: true,
          texte: "Le long fusil de l'Entente : 8 balles dans le tube sous le canon, une baïonnette au bout. 1 à 2 balles par soldat.",
          degats: 2.4, cadence: 1.25, portee: 280, porteeEfficace: 150, degatsLoin: 0.75, chargeur: 8, reserve: 64, rechargement: 4.6,
          dispersion: 0.024, dispersionVisee: 0.0035, recul: 0.022, visee: 0.34, mobilite: 0.96, bruit: 1.3, zoom: 1.35, vitesseBalle: 700 },
        kress98: { nom: "Fusil Kress 98", type: "Fusil à verrou (7,9 mm)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 2, verrou: true, coupParCoup: true, exclus: SANS_ATELIER, baionnette: true,
          texte: "Le fusil de Kressia, pris à l'ennemi : 5 balles avec une lame-chargeur (vite rechargé), très précis.",
          degats: 2.4, cadence: 1.1, portee: 300, porteeEfficace: 160, degatsLoin: 0.78, chargeur: 5, reserve: 60, rechargement: 2.8,
          dispersion: 0.022, dispersionVisee: 0.003, recul: 0.022, visee: 0.33, mobilite: 0.97, bruit: 1.3, zoom: 1.35, vitesseBalle: 760 },
        chaumard: { nom: "Fusil-mitrailleur Chaumard", type: "Fusil-mitrailleur (chargeur en demi-lune)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 4, exclus: SANS_ATELIER,
          texte: "Il tire en RAFALE (300 coups par minute), avec son chargeur en demi-lune de 20 balles. Lourd, et il bouge beaucoup !",
          degats: 1.3, cadence: 0.2, portee: 200, porteeEfficace: 90, degatsLoin: 0.6, chargeur: 20, reserve: 120, rechargement: 3.6,
          dispersion: 0.05, dispersionVisee: 0.012, recul: 0.016, visee: 0.38, mobilite: 0.88, bruit: 1.35, zoom: 1.25 },
        // ✂️ SAPEUR
        mousqueton92: { nom: "Mousqueton Valmont 92", type: "Carabine à verrou", icone: "🔫", classe: "ingenieur", famille: "fusil", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil court des sapeurs, des artilleurs et des brancardiers : léger et maniable, 5 balles.",
          degats: 2, cadence: 1, portee: 200, porteeEfficace: 100, degatsLoin: 0.7, chargeur: 5, reserve: 50, rechargement: 2.9,
          dispersion: 0.026, dispersionVisee: 0.005, recul: 0.024, visee: 0.26, mobilite: 1.02, bruit: 1.2, zoom: 1.3, vitesseBalle: 620 },
        fusilTranchee: { nom: "Fusil de tranchée Wardell", type: "Fusil à pompe de tranchée", icone: "💥", classe: "ingenieur", famille: "pompe", niveau: 0, pompe: true, coupParCoup: true, plombs: 9, gerbe: 0.06, exclus: SANS_ATELIER,
          texte: "Pour nettoyer une tranchée : 9 plombs par coup, terrible de près. On pompe après chaque tir.",
          degats: 0.55, cadence: 0.8, portee: 40, porteeEfficace: 14, degatsLoin: 0.25, chargeur: 5, reserve: 30, rechargement: 0.55,
          dispersion: 0.03, dispersionVisee: 0.015, recul: 0.03, visee: 0.24, mobilite: 1, bruit: 1.3, zoom: 1.15 },
        // 🎯 TIREUR D'ÉLITE (famille « precision » : la vraie lunette du tableau de bord quand tu épaules)
        fusil86lunette: { nom: "Valmont 86 à lunette", type: "Fusil à verrou, lunette ×3", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil de l'Entente avec une petite lunette sur le côté : on vise un casque à 300 m.",
          degats: 3, cadence: 1.3, portee: 380, porteeEfficace: 260, degatsLoin: 0.85, chargeur: 8, reserve: 48, rechargement: 4.8,
          dispersion: 0.07, dispersionVisee: 0.0012, recul: 0.026, visee: 0.42, mobilite: 0.95, bruit: 1.3, zoom: 3, vitesseBalle: 700 },
        kress98lunette: { nom: "Kress 98 de tireur d'élite", type: "Fusil à verrou, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 3, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Pris à l'ennemi : sa lunette grossit 4 fois, et il est très précis. 5 balles.",
          degats: 3.2, cadence: 1.2, portee: 420, porteeEfficace: 290, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 3,
          dispersion: 0.07, dispersionVisee: 0.0009, recul: 0.026, visee: 0.44, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 760 },
      },
      pistolets: R({
        revolver92: { nom: "Revolver d'ordonnance 92", type: "Revolver (8 mm)", icone: "🔫", famille: "pistolet", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le revolver des officiers et des tankistes : 6 balles, et le barillet se recharge lentement.",
          degats: 1.2, cadence: 0.5, portee: 60, porteeEfficace: 22, degatsLoin: 0.5, chargeur: 6, reserve: Infinity, rechargement: 3.4,
          dispersion: 0.034, dispersionVisee: 0.013, recul: 0.03, visee: 0.16, mobilite: 1.05, bruit: 0.9, zoom: 1.15 },
        pistolet08: { nom: "Pistolet Kress 08", type: "Pistolet à genouillère (9 mm)", icone: "🔫", famille: "pistolet", niveau: 2, exclus: SANS_ATELIER,
          texte: "Le pistolet de Kressia, avec sa culasse à genouillère qui se plie comme un genou à chaque tir. 8 balles.",
          degats: 1, cadence: 0.3, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 8, reserve: Infinity, rechargement: 1.7,
          dispersion: 0.03, dispersionVisee: 0.012, recul: 0.022, visee: 0.15, mobilite: 1.05, bruit: 0.85, zoom: 1.2 },
      }),
      gadgets: {
        // ✍️ LES CISAILLES du sapeur : Espace tout près d'un barbelé = on le coupe (logique/tranchees.js)
        cisailles: { nom: "Cisailles", niveau: 0, icone: "✂️", texte: "Tiens Espace devant un réseau de barbelés : tu le coupes (un passage de 8 m). Les tanks, eux, l'écrasent.", distance: 3, duree: 1.4 },
        trousse: { nom: "Musette de pansements", texte: "Espace : tu poses tes pansements. Toi et tes amis tout près, vous êtes soignés." },
        jumelles: { nom: "Jumelles de campagne" },
        reparation: { nom: "Clé de mécanicien", texte: "Tiens Espace près d'un tank ami abîmé : il se répare." },
        sacMunitions: { nom: "Musette de cartouches", texte: "Recharge tes balles et 1 grenade, et celles de tes amis tout près." },
      },
      explosifs: {
        grenades: { nom: "Grenades à manche", texte: "La grenade à manche : lancée en cloche, elle explose après 3 s." },
        c4: { nom: "Pétard de mélinite", icone: "🧨", texte: "Colle-le sur un tank ennemi (ou par terre), éloigne-toi, puis R : BOUM !" },
        fumigene: { nom: "Pot fumigène" },
      },
      armes3d: {
        ia: {
          bleus: [["fusil86", 6], ["chaumard", 1.2], ["mousqueton92", 1.5]],
          rouges: [["kress98", 7], ["mousqueton92", 1], ["chaumard", 0.8]],
          roquettes: [["mousqueton92", 1]],
          elite: { bleus: [["fusil86lunette", 1]], rouges: [["kress98lunette", 1]], viseur: [["mire", 1]] },
          viseur: [["mire", 1]], canon: [["standard", 1]], bouche: [["aucune", 1]], chargeur: [["standard", 1]], poignee: [["aucun", 1]],
        },
      },
      // ---------------------------------------------------------------- 🧵 LES UNIFORMES ET LES VISAGES
      realisme: {
        soldats: {
          uniformes: {
            bleus: { nom: "bleu horizon", fond: "#7b8ca4", taches: ["#7b8ca4", "#7d8ea6", "#798aa2"], equipement: "#6a5638" },
            rouges: { nom: "gris de campagne", fond: "#6b6e62", taches: ["#6b6e62", "#6d7064", "#696c60"], equipement: "#574632" },
            motif: 0.7, ripstop: 0.006, plis: 1.2, boue: 0.95, relief: 1.6,
          },
          visage: { lunettes: ["aucune", "aucune", "masqueGaz", "aucune", "aucune", "masqueGaz", "aucune"], barbe: 0.4 },
        },
        // 🌫️ un ciel COUVERT et bas, une lumière grise, la brume qui commence tout près
        lumiere: { bataille: { direction: [0.45, 0.5, 0.4], couleur: "#e6dcc8", force: 1.9, ciel: "#a7a9a4", sol: "#4c4234", ambiance: 1.0, exposition: 1.0,
          zenith: "#5f6466", horizon: "#9d9c94", brume: "#98978f", halo: 0.25, nuages: 0.96, fumees: 7, filtre: { saturation: 0.55, contraste: 1.12 } } },
        atmosphere: { debut: 0.3 },
        explosions: { tailles: { rafale: 0.12, barrage: 1.7 } }, // (la rafale du biplan : un petit nuage de poussière ; l'obus du barrage : une grosse gerbe)
      },
      ambiance: { saturation: 0.6, teinte: 0.22, vignette: 0.7, grain: 0.1 },
      // la vitrine des personnages (affichage/personnages.js) : ce qu'on voit sur chaque maquette de 1916
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["Casque d'acier (à cimier pour l'Entente, à couvre-nuque pour Kressia)", "Ceinturon de cuir et ses 3 cartouchières, fourreau de baïonnette", "Havresac et couverture roulée en fer à cheval, bidon", "Bandes molletières, mains nues, quelques masques à gaz"] },
        ingenieur: { equipement: ["Ceinture à OUTILS, clé, marteau, pinces", "Les CISAILLES pour couper les barbelés", "Le pétard de mélinite pour les blindés", "Casque d'acier, havresac, bandes molletières"] },
        eclaireur: { equipement: ["Casque d'acier (pas de chapeau de brousse en 1916)", "Jumelles de campagne sur la poitrine", "Lanières de toile sur les épaules", "Fusil à lunette décalée sur le côté"] },
        medecin: { equipement: ["BRASSARD BLANC à CROIX ROUGE sur chaque bras", "Croix rouge sur le casque et sur le sac", "Musette de pansements", "Pas de gilet : en 1916, on n'a que la capote"] },
      } },
      // ---------------------------------------------------------------- 🎵 LA MUSIQUE : une marche lente au gramophone
      musique: {
        tempo: 92, volume: 0.42, nappe: 0.03, violoncelles: 0.07, cuivres: 0.05, pulsation: 0.05, tambours: 0.7, choeur: 0.03, cymbales: 0.04,
        accords: [
          { nom: "mi mineur", notes: ["E2", "B2", "E3", "G3"] }, { nom: "do", notes: ["C2", "G2", "C3", "E3"] },
          { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] }, { nom: "si", notes: ["B1", "F#2", "B2", "D#3"] },
          { nom: "mi mineur", notes: ["E2", "B2", "E3", "G3"] }, { nom: "sol", notes: ["G1", "D2", "G2", "B2"] },
          { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] }, { nom: "si", notes: ["B1", "F#2", "B2", "D#3"] },
        ],
        melodie: [
          [[0, "B4", 3], [3, "E5", 3]], [[0, "D5", 2], [2, "C5", 1], [3, "B4", 3]], [[0, "A4", 2], [2, "B4", 1], [3, "C5", 3]], [[0, "B4", 6]],
          [[0, "G4", 1], [1, "A4", 1], [2, "B4", 1], [3, "E5", 2], [5, "F#5", 1]], [[0, "G5", 3], [3, "F#5", 2], [5, "D5", 1]], [[0, "E5", 2], [2, "C5", 1], [3, "A4", 2], [5, "C5", 1]], [[0, "B4", 6]],
        ],
      },
    },
  });
})();
