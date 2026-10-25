// ✈️ L'ÉDITION 1944 : la Seconde Guerre mondiale (demande 115, édition n° 2)
//
// ✍️ « Seconde Guerre mondiale (1944) : villages de Normandie, fusils semi-auto, pistolets-mitrailleurs, chars Sherman /
// Tiger, avions à hélice, parachutistes. » ✍️ (Cyril) « Fais du faux, évidemment. » Alors c'est une guerre INVENTÉE,
// inspirée de 1944, sans AUCUN vrai symbole, vrai drapeau ni vrai chef :
//   - 🔵 l'UNION D'ALDERMONT (uniforme vert olive, casque rond, le drapeau vert et blanc à la feuille de chêne) contre
//   - 🔴 la LIGUE DE VARNHOLD (uniforme gris-vert, casque évasé, le drapeau bleu nuit et or au losange) ;
//   - le BOCAGE D'ALDERMONT : des champs bordés de hautes haies, des fermes de pierre, des vergers de pommiers, le village
//     et son église, la rivière et ses deux ponts de pierre, un étang ; un ciel d'été.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  const SANS_ATELIER = ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser", "peinture"];
  Tanks.EDITIONS.ajouter("1944", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: true, // (le module des tranchées sert ici seulement pour les NIDS DE MITRAILLEUSE : « reseau: false »)
      barrage: false, vagues: false,
      voixRadio: true, // (la radio de campagne parle, avec son grésillement)
      base3d: false, // (un terrain d'aviation en herbe)
    },
    modeles: {
      casques: { bleus: "rond", rouges: "kressien" }, chapeauEclaireur: false, equipementModerne: false,
      avions: { avion: "monoplan", chasseur: "monoplan", transport: "dakota" },
      vehicules: { camion: "semichenille" }, // (le camion qui amène 6 soldats devient un semi-chenillé)
      projectiles: { missile: "balles" },
    },
    textes: {
      surTitre: "✈️ 1944 · Bocage · Parachutistes · Chars · Chasseurs à hélice",
      bataille: "le bocage d'Aldermont",
      drapeaux: { bleus: { fond: ["#3f5a2e", "#e8e4d4"], embleme: "anneau" }, rouges: { fond: ["#1e2638", "#c9a43a"], embleme: "losange" } },
    },
    remplace: {
      equipes: {
        bleus: { nom: "l'Union d'Aldermont", marque: "#8fd17a", camouflage: ["#4f5634", "#5d6640", "#3c4128", "#6c7450"] },
        rouges: { nom: "la Ligue de Varnhold", marque: "#e0b53a", camouflage: ["#6e6a52", "#7d7a5e", "#4e4e3c", "#8f8a68"] },
      },
      // ✍️ LES CHARS (inventés) : le moyen « Bison » (haut, la caisse arrondie devant, la tourelle coulée ronde) et le lourd
      // « Mammouth » (tout en plaques carrées, l'énorme tourelle boîte et le très long canon à frein de bouche)
      chars: [
        { id: "bison", nom: "Char moyen M-44 « Bison »", pays: "Aldermont", drapeau: "🍃", modele3d: "bison", longueur: 5.9, largeur: 2.65, hauteur: 2.75, canon: 2.6,
          vitesseMax: 10.5, acceleration: 2.2, rotation: 0.5, tourelle: 0.6, recharge: 2.4, texte: "Le char moyen : rapide et fiable, mais son blindage est plus mince." },
        { id: "mammouth", nom: "Char lourd VK-6 « Mammouth »", pays: "Varnhold", drapeau: "🔷", modele3d: "mammouth", longueur: 6.3, largeur: 3.55, hauteur: 2.95, canon: 4.6,
          vitesseMax: 8.2, acceleration: 1.5, rotation: 0.36, tourelle: 0.32, recharge: 3.2, texte: "Le char lourd : un canon terrible et un blindage épais, mais lent et gourmand." },
      ],
      char: { vie: 4, vieJoueur: 14 },
      peinture: { bleus: { taches: ["#4f5634", "#5a6240", "#3a3f28", "#646c48"] }, rouges: { taches: ["#8a845f", "#5d6a44", "#6e5236", "#9a936c"] } },
      soldats: { parEquipe: 14, lanceRoquettes: 2 },
      armes: { soldat: { cadence: 0.75, precision: 0.38, portee: 170, degats: 1.2 }, mitrailleuse: { nom: "Mitrailleuse", cadence: 0.07, precision: 0.5, portee: 300, degats: 1.2 }, grenades: { nom: "Grenades" } },
      parc: { engins: ["jeep", "avion", "camion"], bateau: false, sousmarin: false, dcaEnnemi: false },
      engins: {
        jeep: { nom: "Jeep de reconnaissance", icone: "🚙" },
        camion: { nom: "Semi-chenillé de transport", icone: "🛻", vitesseMax: 16 },
        avion: { nom: "Chasseur « Faucon pèlerin »", icone: "✈️", vitesse: 85, virage: 1.0, tangage: 0.85, hauteurMin: 20, hauteurMax: 380, munitions: 50, recharge: 0.3, arme: "mitrailleuse", projectile: "rafale", cadence: 0.12, vie: 3 },
      },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 1 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      // les PARACHUTISTES sautent du transport bimoteur (le système de config.js, tel quel)
      parachutistes: { transport: { nom: "Transport bimoteur « Dakar »", vitesse: 62, vie: 4 } },
      avionsEnnemis: { nombre: 2, nom: "Chasseur de Varnhold", vitesse: 88, virage: 0.6, altitude: 110, vie: 3, bombes: 2, premierPassage: 30, duel: 800,
        missile: { portee: 420, recharge: 0.35, cone: 0.26 }, projectile: "rafale", modeles: ["monoplan", "piqueur"], noms: ["Chasseur « Corbeau »", "Bombardier en piqué « Hurleur »"], erreurBombe: 7 },
      projectiles: { rafale: { vitesse: 520, gravite: 1.5, degatsChar: 0.25, souffle: 0, guide: 0.8, vieMax: 1.6, aerien: true } },
      baseAerienne: { hangars: { places: [] }, rangesHangars: [], dalles: [] },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : le bocage d'Aldermont
      monde: { arbres: 1800, forets: 5, bosquets: 60, granges: 40,
        village: { nom: "le village de Sainte-Mère-des-Prés", ruines: 20 },
        hameaux: [{ nom: "la ferme fortifiée du Moulin", x: -560, z: 170, rayon: 55, maisons: 8, murets: 18 }, { nom: "le hameau des Vergers", x: 300, z: -620, rayon: 48, maisons: 7, murets: 12 }] },
      cartes: [
        { id: "bataille", nom: "Le bocage d'Aldermont", icone: "🌳", texte: "Des champs bordés de hautes haies, des fermes de pierre, des vergers, le village et son église, la rivière et ses ponts.", infanterie: false,
          // bocage : cellule (m : la taille d'un champ), part (des bords qui ont une haie), etendue / etendueZ (m : jusqu'où), hauteur et
          // epaisseur des haies (m) ; vergers : [x, z, rangées, colonnes, écart] ; riviere : x [de, à], z0, amplitude et periode des
          // méandres, largeur, talus, profondeur (m : on la traverse à gué), ponts (x), pont (m : la largeur d'un pont)
          variante: { arbres: 0.75, collines: 0.8, tranchees: true, eglise: { x: 18, z: 34 }, ruinesVillage: 0.12,
            bocage: { cellule: 85, part: 0.55, etendue: 820, etendueZ: 560, hauteur: 2.7, epaisseur: 1.7 },
            vergers: [[-300, 60, 6, 9, 7], [210, 110, 5, 8, 7], [-150, -420, 6, 7, 7], [420, 260, 5, 6, 7]],
            riviere: { x: [-1040, 470], z0: -230, amplitude: 30, periode: 140, largeur: 14, talus: 3, profondeur: 1.1, ponts: [-30, -440], pont: 7 } } },
      ],
      // ✍️ LES NIDS DE MITRAILLEUSE derrière les haies (le système des mitrailleuses lourdes de 1916, sans les tranchées) :
      // places : [x, z, angle (vers l'ennemi), camp]
      tranchees: {
        reseau: false,
        mitrailleuses: { nom: "Mitrailleuse", places: [[-210, -380, Math.PI / 2, "rouges"], [130, -360, Math.PI / 2, "rouges"], [-520, -420, Math.PI / 2, "rouges"], [-120, 380, -Math.PI / 2, "bleus"], [260, 400, -Math.PI / 2, "bleus"]],
          cadence: 0.06, cadenceIA: 0.09, portee: 300, cone: 1.1, rotation: 1.0, levee: 0.5, rafale: 18, pause: [0.8, 1.8], erreur: 0.035, pense: 0.3, prise: 6, retour: 25, chauffe: 0.01, refroidit: 0.25, enrayage: 3, enfonce: -0.2 },
        couvert: 1,
      },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES de 1944
      classes: {
        assaut: { nom: "Fantassin", icone: "🪖", texte: "Le fusil semi-automatique (8 balles, PING !), ou le fusil-mitrailleur. Et des grenades.",
          armes: ["hartley", "varn43", "brennan"], gadgets: ["sacMunitions"], explosifs: ["grenades", "fumigene"] },
        ingenieur: { nom: "Sapeur", icone: "🚀", texte: "Le chasseur de chars : lance-roquettes, mines et charges. Il répare aussi les véhicules.",
          armes: ["bazko", "varn54"], gadgets: ["reparation"], explosifs: ["mineAT", "c4"], armesBonus: ["stellan", "varn40"] },
        eclaireur: { nom: "Tireur d'élite", icone: "🎯", texte: "Le fusil à verrou à lunette, et les jumelles pour repérer.",
          armes: ["rennick03", "varn98lunette"], gadgets: ["jumelles"], explosifs: ["grenades"] },
        medecin: { nom: "Infirmier", icone: "⛑️", texte: "Il soigne et relève les blessés. Un pistolet-mitrailleur pour se défendre.",
          armes: ["thornton", "varn40", "stellan"], gadgets: ["trousse"], explosifs: ["grenades", "fumigene"], plaques: false },
      },
      armesPrincipales: {
        hartley: { nom: "Fusil Hartley M2", type: "Fusil semi-automatique (lame-chargeur de 8)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, coupParCoup: true, ping: true, exclus: SANS_ATELIER,
          texte: "Le fusil semi-automatique d'Aldermont : 8 balles aussi vite que tu appuies. Quand il est vide, la lame-chargeur saute : PING !",
          degats: 1.8, cadence: 0.28, portee: 260, porteeEfficace: 130, degatsLoin: 0.75, chargeur: 8, reserve: 80, rechargement: 2.2,
          dispersion: 0.026, dispersionVisee: 0.004, recul: 0.02, visee: 0.32, mobilite: 0.96, bruit: 1.3, zoom: 1.35, vitesseBalle: 850 },
        varn43: { nom: "Fusil Varn 43", type: "Fusil semi-automatique (chargeur de 10)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 2, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil semi-automatique de Varnhold, pris à l'ennemi : un chargeur de 10, un peu plus lent.",
          degats: 1.8, cadence: 0.32, portee: 260, porteeEfficace: 130, degatsLoin: 0.75, chargeur: 10, reserve: 80, rechargement: 2.6,
          dispersion: 0.028, dispersionVisee: 0.0045, recul: 0.021, visee: 0.33, mobilite: 0.95, bruit: 1.3, zoom: 1.35, vitesseBalle: 820 },
        brennan: { nom: "Fusil-mitrailleur Brennan", type: "Fusil-mitrailleur (chargeur de 20)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 4, exclus: SANS_ATELIER,
          texte: "Lourd, mais il tire en RAFALE de grosses balles : 20 coups, un bipied sous le canon.",
          degats: 1.5, cadence: 0.13, portee: 240, porteeEfficace: 110, degatsLoin: 0.65, chargeur: 20, reserve: 140, rechargement: 3.2,
          dispersion: 0.045, dispersionVisee: 0.01, recul: 0.016, visee: 0.38, mobilite: 0.88, bruit: 1.4, zoom: 1.3 },
        thornton: { nom: "Pistolet-mitrailleur Thornton", type: "Pistolet-mitrailleur (tambour de 50)", icone: "🔫", classe: "medecin", famille: "pm", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le gros PM au tambour de 50 balles, avec sa poignée avant en bois : il crache, de près.",
          degats: 0.9, cadence: 0.075, portee: 110, porteeEfficace: 40, degatsLoin: 0.5, chargeur: 50, reserve: 200, rechargement: 3.4,
          dispersion: 0.04, dispersionVisee: 0.012, recul: 0.008, visee: 0.24, mobilite: 0.98, bruit: 1.1, zoom: 1.2 },
        varn40: { nom: "Pistolet-mitrailleur Varn 40", type: "Pistolet-mitrailleur (chargeur de 32)", icone: "🔫", classe: "medecin", famille: "pm", niveau: 2, exclus: SANS_ATELIER,
          texte: "Tout en métal et bakélite, la crosse repliable : léger et précis, 32 balles.",
          degats: 0.85, cadence: 0.11, portee: 120, porteeEfficace: 45, degatsLoin: 0.5, chargeur: 32, reserve: 192, rechargement: 2.4,
          dispersion: 0.034, dispersionVisee: 0.01, recul: 0.006, visee: 0.2, mobilite: 1.04, bruit: 1, zoom: 1.2 },
        stellan: { nom: "Mitraillette Stellan", type: "Mitraillette (chargeur sur le côté)", icone: "🔫", classe: "medecin", famille: "pm", niveau: 0, exclus: SANS_ATELIER,
          texte: "Un tube, une crosse en fil de fer, le chargeur sur le CÔTÉ : simple et pas chère.",
          degats: 0.8, cadence: 0.1, portee: 100, porteeEfficace: 35, degatsLoin: 0.45, chargeur: 32, reserve: 192, rechargement: 2.6,
          dispersion: 0.042, dispersionVisee: 0.014, recul: 0.007, visee: 0.2, mobilite: 1.05, bruit: 1, zoom: 1.15 },
        bazko: { nom: "Lance-roquettes Bazko M9", type: "Lance-roquettes", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "roquette", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le long tube à épaule : 1 roquette = 1 obus sur un char.",
          degats: 1, cadence: 0.5, portee: 220, porteeEfficace: 220, degatsLoin: 1, chargeur: 1, reserve: 6, rechargement: 3.2,
          dispersion: 0.032, dispersionVisee: 0.009, recul: 0.03, visee: 0.45, mobilite: 0.93, bruit: 1.4, zoom: 1.4 },
        varn54: { nom: "Tube antichar Varn 54", type: "Lance-roquettes à bouclier", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "roquette", niveau: 3, exclus: SANS_ATELIER,
          texte: "Un gros tube avec un bouclier contre le souffle : sa roquette fait plus mal (1,5 obus).",
          degats: 1.5, cadence: 0.5, portee: 200, porteeEfficace: 200, degatsLoin: 1, chargeur: 1, reserve: 5, rechargement: 3.6,
          dispersion: 0.034, dispersionVisee: 0.01, recul: 0.03, visee: 0.48, mobilite: 0.9, bruit: 1.5, zoom: 1.4 },
        rennick03: { nom: "Rennick 03 à lunette", type: "Fusil à verrou, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil à verrou d'Aldermont avec sa longue lunette : 5 balles, très précis.",
          degats: 3, cadence: 1.2, portee: 420, porteeEfficace: 280, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 3,
          dispersion: 0.07, dispersionVisee: 0.001, recul: 0.026, visee: 0.42, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 820 },
        varn98lunette: { nom: "Varn 98 à lunette", type: "Fusil à verrou, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 3, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil à verrou de Varnhold, pris à l'ennemi : un peu plus lent, une balle qui va loin.",
          degats: 3.2, cadence: 1.25, portee: 440, porteeEfficace: 300, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 3,
          dispersion: 0.07, dispersionVisee: 0.0009, recul: 0.026, visee: 0.44, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 760 },
      },
      pistolets: R({
        colton45: { nom: "Pistolet Colton 45", type: "Pistolet (.45)", icone: "🔫", famille: "pistolet", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le gros pistolet des officiers d'Aldermont : 7 balles qui font mal.",
          degats: 1.3, cadence: 0.32, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 7, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.032, dispersionVisee: 0.012, recul: 0.03, visee: 0.15, mobilite: 1.05, bruit: 0.9, zoom: 1.2 },
        varnP38: { nom: "Pistolet Varn 38", type: "Pistolet (9 mm)", icone: "🔫", famille: "pistolet", niveau: 2, exclus: SANS_ATELIER,
          texte: "Le pistolet de Varnhold : 8 balles, doux à tirer.",
          degats: 1, cadence: 0.28, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 8, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.03, dispersionVisee: 0.011, recul: 0.022, visee: 0.15, mobilite: 1.05, bruit: 0.85, zoom: 1.2 },
      }),
      gadgets: { trousse: { nom: "Trousse d'infirmier" }, jumelles: { nom: "Jumelles" }, reparation: { nom: "Clé de mécanicien" }, sacMunitions: { nom: "Musette de munitions" } },
      explosifs: { c4: { nom: "Charge de démolition", icone: "🧨" }, mineAT: { nom: "Mine antichar" } },
      armes3d: {
        ia: {
          bleus: [["hartley", 6], ["thornton", 2], ["brennan", 1], ["stellan", 1]],
          rouges: [["varn43", 3], ["varn40", 3], ["varn98lunette", 1.5]],
          roquettes: [["bazko", 1], ["varn54", 1]],
          elite: { bleus: [["rennick03", 1]], rouges: [["varn98lunette", 1]], viseur: [["mire", 1]] },
          viseur: [["mire", 1]], canon: [["standard", 1]], bouche: [["aucune", 1]], chargeur: [["standard", 1]], poignee: [["aucun", 1]],
        },
      },
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["Casque rond (Aldermont) ou évasé (Varnhold), sa jugulaire", "Ceinturon de toile et ses cartouchières", "Musette, bidon et couverture roulée", "Bandes molletières, mains nues, pas de gilet"] },
        ingenieur: { equipement: ["Le lance-roquettes sur l'épaule", "Ceinture à outils : clé, marteau, pinces", "Mines antichars et charges de démolition", "Casque, musette, bandes molletières"] },
        eclaireur: { equipement: ["Le fusil à verrou à lunette", "Jumelles sur la poitrine", "Lanières de toile sur les épaules (camouflage)", "Casque, musette"] },
        medecin: { equipement: ["BRASSARD BLANC à CROIX ROUGE sur chaque bras", "Croix rouge sur le casque et sur le sac", "Trousse d'infirmier, pansements", "Le pistolet-mitrailleur pour se défendre"] },
      } },
      // ---------------------------------------------------------------- 🧵 LES UNIFORMES, LE CIEL D'ÉTÉ
      realisme: {
        soldats: {
          uniformes: {
            bleus: { nom: "vert olive", fond: "#646345", taches: ["#646345", "#686747", "#605f42"], equipement: "#7a7352", casque: "#585a3c" },
            rouges: { nom: "gris-vert", fond: "#5f6455", taches: ["#5f6455", "#636858", "#5b6052"], equipement: "#4e4a3a", casque: "#5d6256" },
            motif: 0.7, ripstop: 0.006, plis: 1.1, boue: 0.5, relief: 1.6,
          },
          visage: { lunettes: ["aucune", "aucune", "casque", "aucune"] },
        },
        lumiere: { bataille: { direction: [0.55, 0.62, 0.3], couleur: "#fff0d2", force: 3.3, ciel: "#b9d3ee", sol: "#6a7046", ambiance: 0.85, exposition: 0.95,
          zenith: "#3b74c0", horizon: "#cdd9e0", brume: "#c8d4da", halo: 0.6, nuages: 0.35, fumees: 3, filtre: { saturation: 0.85, contraste: 1.08 } } },
        explosions: { tailles: { rafale: 0.12 } },
      },
      ambiance: { saturation: 0.8, teinte: 0.3, vignette: 0.5, grain: 0.06 },
      // ---------------------------------------------------------------- 🎺 LA MUSIQUE : une marche de cuivres
      musique: {
        tempo: 112, volume: 0.45, nappe: 0.03, violoncelles: 0.05, cuivres: 0.1, pulsation: 0.06, tambours: 1.1, choeur: 0.02, cymbales: 0.09,
        accords: [
          { nom: "do", notes: ["C2", "G2", "C3", "E3"] }, { nom: "fa", notes: ["F1", "C2", "F2", "A2"] },
          { nom: "sol", notes: ["G1", "D2", "G2", "B2"] }, { nom: "do", notes: ["C2", "G2", "C3", "E3"] },
          { nom: "la mineur", notes: ["A1", "E2", "A2", "C3"] }, { nom: "fa", notes: ["F1", "C2", "F2", "A2"] },
          { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] }, { nom: "sol", notes: ["G1", "D2", "G2", "B2"] },
        ],
        melodie: [
          [[0, "G4", 2], [2, "C5", 1], [3, "E5", 3]], [[0, "D5", 2], [2, "C5", 1], [3, "A4", 3]], [[0, "B4", 1], [1, "C5", 1], [2, "D5", 1], [3, "G4", 3]], [[0, "C5", 6]],
          [[0, "E5", 2], [2, "D5", 1], [3, "C5", 2], [5, "A4", 1]], [[0, "F5", 3], [3, "E5", 2], [5, "C5", 1]], [[0, "D5", 2], [2, "F#5", 1], [3, "A5", 3]], [[0, "G5", 6]],
        ],
      },
    },
  });
})();
