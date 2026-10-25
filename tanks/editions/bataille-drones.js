// 🛸 L'ÉDITION « BATAILLE DE DRONES » : la guerre des années 2040 (demande 115, édition n° 5)
//
// ✍️ « Bataille de drones : chaque joueur pilote des drones (reconnaissance, kamikaze, bombardier), brouilleurs. »
// ✍️ (Cyril) « Fais du faux, évidemment. » Alors c'est une guerre INVENTÉE, dans un futur proche (2040) :
//   - 🔷 la COALITION NORDANE (bleu glacier, l'hexagone) contre
//   - 🔶 le SYNDICAT VEXIS (magenta, l'éclair) ; deux puissances inventées, qui se battent surtout avec des DRONES ;
//   - TOI, tu es un PILOTE DE DRONES : caché dans ton POSTE DE COMMANDEMENT (un bunker, à côté de ton aire de drones), tu
//     choisis ton drone avec les touches 1 à 5 :
//       1 🛰️ le QUADRICOPTÈRE DE RECONNAISSANCE (il vole longtemps, Espace MARQUE les ennemis sous lui pour tes alliés),
//       2 🛸 le DRONE FPV KAMIKAZE (celui de l'Europe de l'Est : il fonce et explose),
//       3 💣 l'HEXACOPTÈRE BOMBARDIER (Espace lâche une grenade, il en porte 4),
//       4 ✈️ la MUNITION RÔDEUSE « Faucon-pèlerin » (une petite aile volante : elle tourne en l'air, Espace la fait PLONGER
//          sur le véhicule ou l'antenne visés),
//       5 🤖 le ROBOT TERRESTRE « Mule » (il roule, sa mitrailleuse tire avec Espace) ;
//   - les ANTENNES RELAIS : un drone n'obéit que s'il est à portée d'une antenne de son camp (ou du poste). Détruis les
//     antennes ennemies : leurs drones ne vont plus aussi loin ! Détruis TOUTES leurs antennes, ou leur POSTE DE
//     COMMANDEMENT, et tu as gagné ;
//   - la défense anti-drones : des BROUILLEURS autour des antennes (l'image se brouille, les drones tombent), des CANONS
//     ANTI-DRONES automatiques, des FILETS au-dessus des postes ; et les soldats peuvent TIRER sur les drones ;
//   - la carte : une grande FERME SOLAIRE (des rangées de panneaux), des BORNES DE RECHARGE, la banlieue en ruines d'une
//     « ville intelligente » ; une lumière froide, bleutée ; de la musique électronique.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.
// Les nombres : m, s, m/s, rad (comme config.js).

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  Tanks.EDITIONS.ajouter("drones", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: false, barrage: false, vagues: false,
      voixRadio: true,
      base3d: true,
      dronesFPV: true, // les essaims de drones de l'ordinateur (logique/drones-fpv.js)
      relais: true, // ✍️ les antennes relais, les postes de commandement, la défense anti-drones (logique/relais.js)
      operateur: true, // ✍️ tu commences dans ton poste de commandement, pilote de drones (touches 1 à 5)
    },
    modeles: {
      arbres: "hiver", // (des arbres sans feuilles : une banlieue grise, un hiver doux)
    },
    textes: {
      surTitre: "🛸 2040 · Pilote de drones · Antennes relais · Brouilleurs · Ferme solaire · Pays inventés",
      bataille: "la ferme solaire d'Aurelia",
      drapeaux: { bleus: { fond: ["#1d3a5c", "#7fd8ff"], embleme: "hexagone" }, rouges: { fond: ["#2a1f33", "#ff4fb8"], embleme: "eclair" },
        chefs: "chefs inventés : l'amirale Sœli Narr (Coalition Nordane) · le directeur Kass Orvane (Syndicat Vexis)" },
    },
    remplace: {
      equipes: {
        bleus: { nom: "la Coalition Nordane", marque: "#5ad8ff", camouflage: ["#5c6670", "#76808a", "#3a4148", "#9aa4ae"] },
        rouges: { nom: "le Syndicat Vexis", marque: "#ff4fb8", camouflage: ["#4e4a56", "#6a6472", "#2e2b34", "#8a8494"] },
        allies: 1, ennemis: 2, // (peu de chars : les drones dominent)
      },
      chars: [
        { id: "golem", nom: "Char robotisé XR-40 « Golem »", pays: "Coalition Nordane", drapeau: "🔷", modele3d: "cage-leclerc", longueur: 6.9, largeur: 3.6, hauteur: 2.5, canon: 6.6,
          vitesseMax: 19, acceleration: 4.6, rotation: 0.85, tourelle: 0.9, recharge: 1.7, cage: 0.45,
          texte: "Un char sans équipage dans la tourelle, piloté de loin : sa cage arrête un drone sur deux." },
        { id: "titan", nom: "Char lourd VX-9 « Titan »", pays: "Syndicat Vexis", drapeau: "🔶", modele3d: "cage-abrams", longueur: 7.9, largeur: 3.7, hauteur: 2.4, canon: 5.6,
          vitesseMax: 18, acceleration: 4.5, rotation: 0.8, tourelle: 0.95, recharge: 2.0, cage: 0.45,
          texte: "Le char du Syndicat : lourd, tourelle rapide, grille anti-drones." },
      ],
      char: { vie: 4, vieJoueur: 14 },
      peinture: { bleus: { taches: ["#5c6670", "#76808a", "#3a4148", "#9aa4ae"], boue: "#4a4a48", poussiere: "#b8bcc0" }, rouges: { taches: ["#4e4a56", "#6a6472", "#2e2b34", "#8a8494"], boue: "#4a4a48", poussiere: "#b8bcc0" } },
      soldats: { parEquipe: 12, lanceRoquettes: 2 },
      // tes engins : le 4x4, le camion… et TES DRONES (l'engin « drone » : 5 sortes, touches 1 à 5)
      parc: { engins: ["jeep", "drone", "camion"], bateau: false, sousmarin: false, dcaEnnemi: false },
      engins: {
        jeep: { nom: "Véhicule de liaison « Lynx »", icone: "🚙" },
        camion: { nom: "Transport blindé « Ruche »", icone: "🛻" },
        // ✍️ TES DRONES (logique/drones-fpv.js : « piloter »). Chaque sorte a ses réglages (vol : quadri = 4 hélices, sur
        // place possible ; aile = une aile volante qui avance toujours ; sol = un robot qui roule). recharge : s avant
        // que la même sorte soit prête de nouveau, après sa perte ; batterie : s de vol ; vie : balles pour l'abattre.
        drone: { nom: "Drone", icone: "🛸", fpv: true, vitesseMax: 32, acceleration: 16, virage: 2.3, montee: 10, hauteurMax: 110,
          munitions: 1, recharge: 20, batterie: 110, portee: 1500, vie: 2, typeDepart: "recon",
          aide: "1 à 5 : changer de drone · ↑ accélérer · ↓ freiner · ← → tourner · Q monter · D descendre · Espace : action · E : quitter le poste",
          types: {
            recon: { touche: 1, nom: "Quadricoptère de reconnaissance « Chouette »", icone: "🛰️", vol: "quadri", action: "marquer", vitesseMax: 22, batterie: 240, recharge: 15, vie: 2, rayonMarque: 70,
              aide: "Espace : MARQUER les ennemis sous toi (70 m) pour tes alliés · il vole 4 minutes" },
            fpv: { touche: 2, nom: "Drone FPV kamikaze « Frelon »", icone: "🛸", vol: "quadri", action: "exploser", vitesseMax: 34, batterie: 110, recharge: 20, vie: 1,
              aide: "Espace : FAIRE EXPLOSER (ou fonce dans la cible)" },
            bombardier: { touche: 3, nom: "Hexacoptère bombardier « Bourdon »", icone: "💣", vol: "quadri", action: "bombe", vitesseMax: 18, batterie: 160, recharge: 25, vie: 3, munitions: 4, cadence: 0.8,
              aide: "Espace : LÂCHER une grenade (4) · elle garde ta vitesse en tombant : lâche-la AVANT d'être au-dessus !" },
            rodeuse: { touche: 4, nom: "Munition rôdeuse « Faucon-pèlerin »", icone: "✈️", vol: "aile", action: "plonger", vitesseMin: 24, vitesseMax: 44, acceleration: 10, virage: 0.9, montee: 9, batterie: 140, recharge: 35, vie: 1, cone: 0.3, porteeVisee: 700,
              aide: "Elle avance toujours · Espace : PLONGER sur le véhicule ou l'antenne au centre (carré rouge)" },
            robot: { touche: 5, nom: "Robot terrestre « Mule »", icone: "🤖", vol: "sol", action: "mitrailleuse", vitesseMax: 9, acceleration: 5, virage: 1.4, batterie: 300, recharge: 30, vie: 6, munitions: 200, cadence: 0.09,
              aide: "↑ ↓ rouler · ← → tourner · Espace : sa MITRAILLEUSE (200 balles)" },
          } },
      },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 1 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { toutesLes: 1e9, premier: 1e9 },
      avionsEnnemis: { nombre: 0 },
      projectiles: {
        fpv: { vitesse: 60, gravite: 0, degatsChar: 1.6, souffle: 6, vieMax: 0.5 },
        fpvCage: { vitesse: 60, gravite: 0, degatsChar: 0.25, souffle: 3, vieMax: 0.5 },
        rodeuse: { vitesse: 70, gravite: 0, degatsChar: 2.5, souffle: 8, vieMax: 0.5 }, // (la charge de la munition rôdeuse : plus grosse)
      },
      structures: { explosions: { fpv: [70, 2.6], fpvCage: [30, 1.8], rodeuse: [140, 3.6] } },
      // ✍️ LES ESSAIMS DE L'ORDINATEUR (logique/drones-fpv.js, comme en Europe de l'Est, en plus nombreux) ; « formes » : la
      // part des drones qui sont des munitions rôdeuses (une aile, plus haute, plus rapide, plus grosse charge) ;
      // « partRelais » : la part envoyée sur une ANTENNE RELAIS ennemie
      fpv: { noms: { bleus: "bleu", rouges: "magenta" }, premier: 15, toutesLes: [9, 15], enLAir: 4, altitude: 24, vitesse: 22, pique: 30, distancePique: 70, rayonCible: 2.4, virage: 2.4,
        partChars: 0.5, partRelais: 0.3, groupe: { rayon: 9, min: 2 }, portee: 1100, batterie: 90, pense: 0.5,
        rodeuse: { part: 0.3, altitude: 55, vitesse: 38, pique: 46, distancePique: 110, sorte: "rodeuse" },
        // les soldats TIRENT sur les drones (portee : m ; chance : par coup d'œil, pour chaque drone bas à portée)
        tir: { portee: 55, hauteur: 40, chance: 0.12 } },
      // ✍️ LES ANTENNES RELAIS, LES POSTES ET LA DÉFENSE ANTI-DRONES (logique/relais.js). m, s.
      //   antennes : [x, z, camp, nom] ; rayon : m de portée de chaque antenne (et du poste : « rayonPoste ») ; vie : points
      //   (une explosion à moins de « souffle » m enlève ses dégâts : voir « degats ») ; brouillage : m autour de chaque
      //   antenne où les drones ENNEMIS sont brouillés (« chanceBrouillage » par coup d'œil pour ceux de l'ordinateur ; pour
      //   toi, l'image se brouille et le signal baisse de « perteSignal ») ;
      //   canons : les canons anti-drones (un par antenne, et 2 au poste) : portee, cadence (s entre deux rafales), chance
      //   (d'abattre le drone visé à chaque rafale), hauteur (m au plus) ;
      //   poste : vie, et « filet » (un filet tendu au-dessus : × les dégâts des drones sur le poste).
      relais: {
        antennes: [[-600, 270, "bleus", "l'antenne Ouest"], [-150, 300, "bleus", "l'antenne Centre"], [260, 260, "bleus", "l'antenne Est"],
          [-560, -270, "rouges", "l'antenne Ouest"], [-120, -300, "rouges", "l'antenne Centre"], [280, -250, "rouges", "l'antenne Est"]],
        rayon: 620, rayonPoste: 650, vie: 6, souffle: 9, degats: { fpv: 1.5, fpvCage: 1.5, rodeuse: 3, grenade: 1, obus: 1.5, roquette: 1.5, missile: 2.5, bombe: 3, c4: 4, mine: 2, lg40: 0.5 },
        brouillage: 80, chanceBrouillage: 0.25, perteSignal: 0.55,
        canons: { portee: 120, cadence: 0.9, chance: 0.18, hauteur: 90 },
        poste: { vie: 14, filet: 0.35, decalage: [14, 18] },
        pense: 0.25,
      },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : la ferme solaire d'Aurelia
      monde: { arbres: 700, bosquets: 25, forets: 2, partForets: 0.35, partBosquets: 0.4, haies: 30, granges: 6,
        collines: { hauteur: 9, taille: 260 },
        village: { nom: "la banlieue de Néo-Varenne", rayon: 75, maisons: 16, murets: 16, ruines: 30 },
        hameaux: [{ nom: "la station de recharge", x: -560, z: 170, rayon: 40, maisons: 3, murets: 4 }] },
      cartes: [
        { id: "bataille", nom: "La ferme solaire d'Aurelia", icone: "🛸", texte: "Les rangées de panneaux solaires, les antennes relais des deux camps, les bornes de recharge, la banlieue en ruines d'une ville intelligente.", infanterie: false,
          variante: { arbres: 1, collines: 1, herbe: true, toitPlat: true, ruinesVillage: 0.4,
            crepis: ["#d8dde2", "#c4cad0", "#e6eaee", "#b4bcc4", "#9aa4ae"],
            // ✍️ LES CHAMPS DE PANNEAUX SOLAIRES : [x0, z0, x1, z1] (des rangées tous les 9 m, des panneaux de 4 m)
            solaire: [[-900, -150, -620, 120], [-420, 60, -200, 200], [140, -170, 380, 60], [-380, -200, -170, -80], [-120, 380, 200, 470], [-120, -470, 200, -380]],
            // ✍️ LES BORNES DE RECHARGE (des plateformes de drones, leur anneau lumineux) : [x, z]
            bornes: [[-560, 150], [-540, 190], [-580, 195], [20, 120], [40, -110], [-300, 0]],
            sol: { herbe: [92, 108, 96], herbeSombre: [72, 88, 80], herbeSeche: [126, 132, 118], herbeJaune: [110, 118, 100], terre: [96, 92, 86], terreBattue: [112, 110, 106],
              sousBois: [70, 76, 72], chemin: [120, 122, 124] },
            soleil: { couleur: 0xe8f0ff, force: 2.6, ciel: 0xb8cce0, sol: 0x5a6660 }, brume: 0xb4c4d4 } },
      ],
      perchoirs: { parCarte: { bataille: { mirador: 2, chateau: 1, colline: 0 } } },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES de 2040
      classes: {
        assaut: { texte: "Le fusil d'assaut, ou le FUSIL À POMPE anti-drones (une gerbe de plombs : parfait contre un petit drone qui arrive).",
          armes: ["g36", "scarh", "m870", "ar4"] },
        ingenieur: { texte: "Le missile antichar, le BROUILLEUR anti-drones, et il répare les engins.", armes: ["javelin", "at4"], gadgets: ["brouilleur", "reparation"] },
      },
      gadgets: {
        brouilleur: { nom: "Fusil brouilleur anti-drones", niveau: 0, icone: "📡", texte: "Espace : il brouille pendant 10 s. Les drones ennemis à moins de 80 m perdent leur pilote et tombent.",
          rayon: 80, duree: 10, attente: 25 },
      },
      armes3d: {
        ia: {
          bleus: [["g36", 4], ["scarh", 2], ["m870", 1], ["ar4", 2]],
          rouges: [["ak12", 4], ["scarh", 2], ["m870", 1], ["vector", 1]],
          roquettes: [["javelin", 2], ["at4", 1]],
          peinture: [["urbain", 2], ["numerique", 1], ["aucune", 1]],
        },
      },
      realisme: {
        explosions: { tailles: { fpv: 0.7, fpvCage: 0.45, rodeuse: 1.1 } },
        soldats: {
          uniformes: {
            bleus: { nom: "gris acier (marques bleu glacier)", fond: "#5e6670", taches: ["#4a525a", "#727c86", "#3c4248"], equipement: "#2e343a", casque: "#4a5058" },
            rouges: { nom: "gris violet (marques magenta)", fond: "#56505e", taches: ["#46404e", "#6c6676", "#38343e"], equipement: "#2c2832", casque: "#48424e" },
            motif: 0.6, ripstop: 0.006, plis: 1, boue: 0.3, relief: 1.6,
          },
        },
        // ❄️ une lumière froide, bleutée, un ciel clair et dur
        lumiere: { bataille: { direction: [0.35, 0.7, 0.4], couleur: "#e8f0ff", force: 2.6, ciel: "#b8cce0", sol: "#5a6660", ambiance: 1.0, exposition: 1.0,
          zenith: "#3e6a9c", horizon: "#c4d4e2", brume: "#b4c4d4", halo: 0.5, nuages: 0.45, fumees: 4, filtre: { saturation: 0.8, contraste: 1.1 } } },
      },
      ambiance: { saturation: 0.85, teinte: 0.1, vignette: 0.45, grain: 0.03 },
      // ---------------------------------------------------------------- 🎹 LA MUSIQUE : électronique (synthés, batterie)
      musique: {
        tempo: 124, volume: 0.42, nappe: 0.05, violoncelles: 0.02, cuivres: 0, pulsation: 0.14, tambours: 0.25, choeur: 0.015, cymbales: 0.06,
        guitare: 0, batterie: 0.55, braam: { fort: 0.1, duree: 2.5 },
        accords: [
          { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] }, { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] },
          { nom: "fa", notes: ["F1", "C2", "F2", "A2"] }, { nom: "sol", notes: ["G1", "D2", "G2", "B2"] },
          { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] }, { nom: "ré mineur", notes: ["D2", "A2", "D3", "F3"] },
          { nom: "fa", notes: ["F1", "C2", "F2", "A2"] }, { nom: "mi", notes: ["E1", "B1", "E2", "G#2"] },
        ],
        melodie: [
          [[0, "A4", 1], [1, "C5", 1], [2, "E5", 1], [3, "A5", 1], [4, "E5", 1], [5, "C5", 1]], [[0, "A4", 1], [1, "C5", 1], [2, "E5", 1], [3, "G5", 3]],
          [[0, "F4", 1], [1, "A4", 1], [2, "C5", 1], [3, "F5", 3]], [[0, "G4", 1], [1, "B4", 1], [2, "D5", 1], [3, "G5", 3]],
          [[0, "A4", 1], [1, "C5", 1], [2, "E5", 1], [3, "A5", 1], [4, "E5", 1], [5, "C5", 1]], [[0, "D5", 2], [2, "F5", 2], [4, "A5", 2]],
          [[0, "C5", 3], [3, "A4", 3]], [[0, "B4", 3], [3, "G#4", 3]],
        ],
      },
    },
  });
})();
