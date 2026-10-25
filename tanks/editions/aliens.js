// 👽 L'ÉDITION « BATAILLE CONTRE DES ALIENS » : l'invasion (demande 115, édition n° 7)
//
// ✍️ « Bataille contre des aliens : envahisseurs extraterrestres, armes à plasma, vaisseaux, mur de bouclier. »
// ✍️ (Cyril) « Fais du faux, évidemment. » Tout est INVENTÉ (et sans sang : un alien vaincu se DISSOUT en une poussière
// de lumière) :
//   - 🔵 LA LIGUE TERRIENNE (toi) : toute l'humanité dans le même camp, en 2061. Les armes d'aujourd'hui, plus deux armes
//     nouvelles : le FUSIL À RAILS (« railgun », l'éclaireur) et le FUSIL À PLASMA repris aux aliens (l'assaut) ;
//   - 👽 LES XYL'THARR : des envahisseurs venus d'une étoile lointaine. Des SOLDATS grands et maigres à la carapace
//     violette, au casque allongé et aux yeux qui brillent, protégés par un BOUCLIER D'ÉNERGIE (il arrête les balles
//     jusqu'à ce qu'il soit surchargé, puis il se recharge) ; des RAMPANTS (de petits drones à pattes, rapides, qui
//     foncent sur les soldats et explosent) ; des TRIPODES (leurs « chars » : 3 longues jambes, un rayon, un cœur qui
//     brille sous le ventre — touche-le en haut, ça fait 2 fois plus mal) ; des SOUCOUPES (leurs avions) ;
//   - LE VAISSEAU-MÈRE flotte très haut au-dessus de leur base. 3 PYLÔNES de cristal entretiennent son BOUCLIER : détruis
//     les 3 pylônes (des explosions : obus, roquettes, grenades…), le bouclier tombe, et le CŒUR du vaisseau, au pied de
//     son rayon, peut être détruit → VICTOIRE (logique/aliens.js) ;
//   - la carte : la banlieue en ruines de Néo-Lyriane (une ville du futur), et la ZONE TERRAFORMÉE qui s'étend depuis
//     leur base : des cristaux violets, de la biomasse qui brille, d'étranges flèches ; un ciel d'aurores vertes et
//     violettes, de la brume ; une musique de synthés et de chœurs étranges.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.
// Les nombres : m, s, m/s, rad (comme config.js).

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  const SANS_ATELIER = ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser", "peinture"];
  // ✍️ LA BASE DES XYL'THARR (au nord, z < 0) : le pied du rayon du vaisseau-mère, et la zone terraformée autour
  const BASE = { x: 0, z: -400 };
  Tanks.EDITIONS.ajouter("aliens", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: false, barrage: false, vagues: false,
      voixRadio: true,
      base3d: true,
      aliens: true, // ✍️ les pylônes, le vaisseau-mère, les rampants, les boucliers (logique/aliens.js)
    },
    modeles: {
      casques: { rouges: "xyl" }, // (affichage/engins3d.js : le casque-carapace allongé et les yeux qui brillent des Xyl'tharr)
      avions: { chasseur: "soucoupe" }, // (affichage/aliens3d.js : les soucoupes)
    },
    textes: {
      surTitre: "👽 2061 · L'invasion · Tripodes · Soucoupes · Boucliers d'énergie · Vaisseau-mère",
      bataille: "la banlieue de Néo-Lyriane",
      drapeaux: { bleus: { fond: ["#1e3c6e", "#e8eef6"], embleme: "globe" }, rouges: { fond: ["#2a1240", "#7dffb8"], embleme: "oeil" },
        chefs: "inventés : la commandante Ines Arkady (Ligue Terrienne) · l'Essaim-Mère (les Xyl'tharr)" },
    },
    remplace: {
      equipes: {
        bleus: { nom: "la Ligue Terrienne", marque: "#5ab8ff", camouflage: ["#5a6470", "#6e7884", "#3c434c", "#8a949e"] },
        rouges: { nom: "les Xyl'tharr", marque: "#7dffb8", camouflage: ["#3a2a4e", "#4e3a66", "#22182e", "#6a4e8a"], noms: ["Tripode Ka", "Tripode Vex", "Tripode Zoth", "Tripode Myr", "Tripode Qel"] },
        allies: 3, ennemis: 4,
      },
      // ✍️ LES CHARS : ceux de la Ligue (les chars d'aujourd'hui) ; et les TRIPODES des Xyl'tharr (« charsEnnemis » :
      // les Rouges ne prennent que ceux-là). coeurFaible : × les dégâts d'un coup dans le haut (le ventre et son cœur).
      charsEnnemis: [
        { id: "tripode", nom: "Tripode xyl'tharr", pays: "Xyl'tharr", drapeau: "👽", modele3d: "tripode", longueur: 6, largeur: 5.2, hauteur: 9, canon: 2.2,
          vitesseMax: 7, acceleration: 2, rotation: 0.5, tourelle: 0.9, recharge: 2.6, coeurFaible: 2,
          texte: "Trois longues jambes, une tête qui tourne, un rayon. Sous le ventre, son cœur brille : vise haut !" },
      ],
      char: { vie: 4, vieJoueur: 14 },
      soldats: { parEquipe: 16, lanceRoquettes: 2 },
      armes: { soldat: { cadence: 0.24, precision: 0.38, portee: 170, degats: 1 } },
      // les engins de la Ligue : le 4x4, l'hélico, l'avion, le drone, la moto, le quad, le camion (pas de camion
      // antiaérien ennemi, pas de bateau ennemi : les aliens ont leurs soucoupes)
      parc: { engins: ["jeep", "helico", "avion", "drone", "moto", "quad", "camion"], bateau: false, sousmarin: false, dcaEnnemi: false },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 0 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { toutesLes: 1e9, premier: 1e9 },
      radio: { bavardage: { interceptePortee: 0 } }, // (les Xyl'tharr ne parlent pas notre langue : pas de radio ennemie interceptée)
      // ✍️ LES SOUCOUPES : elles passent bas et lâchent des boules de plasma
      avionsEnnemis: { nombre: 2, nom: "Soucoupe xyl'tharr", noms: ["Soucoupe « Œil-Vert »", "Soucoupe « Ombre-Lente »"], modeles: ["soucoupe", "soucoupe"], vitesse: 70, virage: 0.8, altitude: 70, vie: 3, bombes: 3, premierPassage: 50 },
      // ✍️ L'INVASION (logique/aliens.js). m, s, m/s.
      //   pylones : [x, z, nom] ; vie (points), souffle (m : une explosion plus près les abîme), degats : par sorte
      //   d'explosion ; vaisseau : [x, z] du pied de son rayon, hauteur (m), bouclier (rayon du dôme autour du cœur), coeur
      //   (vie, rayon où une explosion le touche) ;
      //   bouclier (des soldats) : points qu'il arrête, attente (s sans être touché avant qu'il remonte), recharge (points
      //   par s) ;
      //   rampants : enLAir (au plus), toutesLes (s entre deux sorties), vitesse, vue (m), explose (m de la cible),
      //   degats (sur un soldat), souffle (m : une explosion les détruit), pense (s entre deux coups d'œil) ;
      //   dissous : s avant qu'un alien vaincu ait disparu en poussière de lumière.
      aliens: {
        pylones: [[-280, -250, "le pylône de l'Ouest"], [10, -300, "le pylône du Centre"], [290, -240, "le pylône de l'Est"]],
        vie: 8, souffle: 10, degats: { obus: 1.5, roquette: 1.5, at4: 1.5, javelin: 2.5, missile: 2.5, bombe: 3, grenade: 1, lg40: 0.6, c4: 4, mine: 2 },
        vaisseau: { x: BASE.x, z: BASE.z, hauteur: 175, bouclier: 16, coeur: { vie: 12, rayon: 10 } },
        bouclier: { points: 3, attente: 3, recharge: 1 },
        rampants: { enLAir: 9, toutesLes: 7, premier: 20, vitesse: 9, vue: 260, explose: 1.6, degats: 3, souffle: 6, pense: 0.25 },
        dissous: 1.3,
        zone: { x: BASE.x, z: BASE.z + 80, rayon: 330 },
      },
      projectiles: { bombe: { degatsChar: 1.5, souffle: 9 } },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : Néo-Lyriane et la zone terraformée
      monde: { camp: 470, arbres: 500, bosquets: 14, forets: 2, partForets: 0.3, partBosquets: 0.5, haies: 20, granges: 4,
        collines: { hauteur: 10, taille: 260 },
        village: { nom: "la banlieue de Néo-Lyriane", rayon: 75, maisons: 0, murets: 0, ruines: 0 },
        hameaux: [{ nom: "la station de recherche", x: -560, z: 240, rayon: 45, maisons: 5, murets: 6 }] },
      ville: { immeubles: 0.55, etages: [4, 5], boutiques: 0.3, balcons: 0.2, clims: 0.1, affiches: 0.25, vitresCassees: 0.7, objets: 8, papiers: 40 },
      cartes: [
        { id: "bataille", nom: "La banlieue de Néo-Lyriane", icone: "👽", texte: "La ville du futur en ruines, la zone terraformée par les aliens (cristaux, biomasse, flèches), les 3 pylônes et le vaisseau-mère.", infanterie: false,
          variante: { arbres: 1, collines: 1, herbe: false, village: false,
            quartier: { x: 0, z: 150, rayon: 115, ilot: 38, rue: 10, maisons: 2, ruinesDepart: 0.35 }, rues: "#4a4a50", ville: "ruines", toitPlat: true,
            crepis: ["#c8ccd2", "#b4bac2", "#d8dce0", "#9aa2ac", "#e4e6ea"],
            sol: { herbe: [92, 100, 84], herbeSombre: [70, 78, 66], herbeSeche: [112, 112, 96], herbeJaune: [104, 106, 88], terre: [86, 80, 76], terreBattue: [100, 96, 92],
              sousBois: [64, 68, 60], chemin: [112, 110, 108] },
            soleil: { couleur: 0xc8d4ff, force: 2.0, ciel: 0x6a5a8a, sol: 0x3a3048 }, brume: 0x4a3e5e } },
      ],
      perchoirs: { parCarte: { bataille: { mirador: 3, chateau: 1, colline: 2 } } },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES (2061)
      classes: {
        assaut: { texte: "Le fusil d'assaut, ou le FUSIL À PLASMA repris aux Xyl'tharr (des boules de plasma qui traversent leur bouclier plus vite).",
          armes: ["ar4", "g36", "scarh", "plasma"] },
        eclaireur: { texte: "Le fusil de précision, ou le FUSIL À RAILS : un projectile accéléré par des aimants, très fort, qui surcharge un bouclier d'un coup.",
          armes: ["m110", "m24", "railgun"] },
      },
      armesPrincipales: {
        plasma: { nom: "Fusil à plasma xyl'tharr (repris)", type: "Fusil à plasma (24 charges)", icone: "🟢", classe: "assaut", famille: "fusil", niveau: 0, exclus: SANS_ATELIER, plasma: true,
          texte: "Repris sur un alien vaincu : il crache des boules de plasma vert, lentes mais très fortes. Il chauffe : 24 charges.",
          degats: 1.7, cadence: 0.16, portee: 190, porteeEfficace: 110, degatsLoin: 0.7, chargeur: 24, reserve: 144, rechargement: 2.6,
          dispersion: 0.035, dispersionVisee: 0.008, recul: 0.008, visee: 0.28, mobilite: 0.97, bruit: 0.8, zoom: 1.3 },
        railgun: { nom: "Fusil à rails RX-9", type: "Fusil à rails (aimants), lunette", icone: "⚡", classe: "eclaireur", famille: "precision", niveau: 0, coupParCoup: true, exclus: SANS_ATELIER, plasma: true,
          texte: "Des aimants lancent un petit projectile à une vitesse folle : un coup suffit à surcharger un bouclier. Il lui faut 1,5 s pour se recharger.",
          degats: 4.5, cadence: 1.5, portee: 520, porteeEfficace: 420, degatsLoin: 0.95, chargeur: 6, reserve: 30, rechargement: 3.2,
          dispersion: 0.05, dispersionVisee: 0.0006, recul: 0.03, visee: 0.45, mobilite: 0.92, bruit: 1.2, zoom: 1.4, vitesseBalle: 3000 },
      },
      armes3d: {
        ia: {
          // (les Xyl'tharr portent tous le fusil à plasma ; la Ligue, les fusils d'aujourd'hui)
          bleus: [["ar4", 5], ["g36", 2], ["scarh", 1], ["m110", 0.6]],
          rouges: [["plasma", 1]],
          roquettes: [["at4", 2], ["javelin", 1]],
          peinture: [["urbain", 2], ["aucune", 1]],
        },
      },
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["Casque de la Ligue et la bande bleue", "Le fusil à plasma repris aux aliens (lueur verte)", "Gilet pare-balles", "Grenades"] },
        eclaireur: { equipement: ["Le FUSIL À RAILS RX-9 (les bobines bleues qui brillent)", "Les jumelles", "La cape grise"] },
      } },
      // ---------------------------------------------------------------- 🧵 LES UNIFORMES, LE CIEL ÉTRANGE, LA BRUME
      realisme: {
        explosions: { tailles: { bombe: 1.2 } },
        soldats: {
          uniformes: {
            bleus: { nom: "gris urbain (bande bleue)", fond: "#6a7480", taches: ["#555e68", "#848e98", "#3e454c"], equipement: "#2e343a", casque: "#4e5862" },
            // les Xyl'tharr : la carapace violette, les plaques sombres
            rouges: { nom: "carapace xyl'tharr", fond: "#3e2c56", taches: ["#54406e", "#2a1e3a", "#6a5088"], equipement: "#1e1828", casque: "#4a3866" },
            motif: 0.75, ripstop: 0.004, plis: 0.6, boue: 0.2, relief: 1.8,
          },
          visage: { barbe: 0.3 },
        },
        // 🌌 un ciel d'aurores (vert et violet), une lumière froide et basse, de la brume
        lumiere: { bataille: { direction: [0.3, 0.45, 0.6], couleur: "#c8d4ff", force: 2.0, ciel: "#6a5a8a", sol: "#3a3048", ambiance: 1.15, exposition: 1.05,
          zenith: "#1e2440", horizon: "#7a5a9a", brume: "#4a3e5e", halo: 0.6, nuages: 0.6, fumees: 5, filtre: { saturation: 0.95, contraste: 1.1 } } },
        atmosphere: { debut: 0.25 },
      },
      ambiance: { saturation: 0.95, teinte: 0.2, vignette: 0.6, grain: 0.05 },
      // ---------------------------------------------------------------- 🎶 LA MUSIQUE : synthés et chœur étranges
      // theremine : la force d'une voix sans paroles qui glisse d'une note à l'autre en tremblant (affichage/musique.js)
      musique: {
        tempo: 72, volume: 0.42, nappe: 0.08, violoncelles: 0.03, cuivres: 0, pulsation: 0.09, tambours: 0.3, choeur: 0.07, cymbales: 0.03,
        theremine: 0.09, braam: { fort: 0.16, duree: 5 },
        accords: [
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "ré bémol", notes: ["Db2", "Ab2", "Db3", "F3"] },
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "si diminué", notes: ["B1", "F2", "B2", "D3"] },
          { nom: "la bémol", notes: ["Ab1", "Eb2", "Ab2", "C3"] }, { nom: "fa dièse diminué", notes: ["F#1", "C2", "F#2", "A2"] },
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "sol", notes: ["G1", "D2", "G2", "B2"] },
        ],
        melodie: [
          [[0, "G4", 6]], [[0, "Ab4", 3], [3, "G4", 3]], [[0, "Eb5", 6]], [[0, "D5", 4], [4, "B4", 2]],
          [[0, "C5", 6]], [[0, "F#4", 3], [3, "A4", 3]], [[0, "G4", 4], [4, "Eb4", 2]], [[0, "D4", 6]],
        ],
      },
    },
  });
})();
