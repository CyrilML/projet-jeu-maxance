// ☢️ L'ÉDITION GUERRE FROIDE : les années 1970-1980 (demande 115, édition n° 3)
//
// ✍️ « Guerre froide : hélicoptères à rotor bipale, chars des années 70, jungle. » ✍️ (Cyril) « Fais du faux,
// évidemment. » Alors c'est une guerre INVENTÉE, inspirée des années 70, sans AUCUN vrai symbole, vrai drapeau ni vrai chef :
//   - 🔵 la CONFÉDÉRATION D'OSTREL (treillis vert olive, casque « pot » recouvert de toile, chapeau de brousse pour
//     l'éclaireur, le drapeau bleu ciel et blanc au triangle) contre
//   - 🔴 le DIRECTOIRE DE KHAVAR (tenue kaki-vert, casque colonial en liège, le drapeau brun-rouge et or à la roue dentée) ;
//   - la VALLÉE DE TERNOVIE : une jungle épaisse (des feuillus géants et des palmiers), des RIZIÈRES en terrasses pleines
//     d'eau, une rivière boueuse et ses ponts, le VILLAGE SUR PILOTIS de Ban-Tarak, et la BASE DE FEU « Rocher » sur sa
//     colline (des sacs de sable, des nids de mitrailleuse, une plateforme pour les hélicos) ; une lumière tropicale, de
//     la brume.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.
// Les nombres : m, s, m/s, rad (comme config.js).

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  const SANS_ATELIER = ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser", "peinture"];
  // ✍️ LE VILLAGE SUR PILOTIS : [x, z, angle] de chaque hutte (autour de la place de Ban-Tarak, au centre de la carte)
  const HUTTES = [[-34, -18, 0.2], [-30, 22, -0.3], [-8, 40, 1.4], [26, 34, 0.9], [40, 2, 1.6], [30, -32, 2.4], [2, -44, 3.0], [-48, 4, 0.1], [56, -30, 2.0], [-56, -40, 0.6]];
  // ✍️ LA BASE DE FEU « Rocher » : sur sa colline, côté Ostrel (les Bleus sont au sud, z > 0)
  const BASE = { x: -260, z: 300 };
  const NIDS = [0, 1, 2, 3, 4, 5].map((k) => { const a = (k / 6) * Math.PI * 2 + 0.3; return ["colline", BASE.x + Math.cos(a) * 30, BASE.z + Math.sin(a) * 30, a]; });
  Tanks.EDITIONS.ajouter("froide", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: true, // (le module des tranchées sert seulement pour les NIDS DE MITRAILLEUSE : « reseau: false »)
      barrage: false, vagues: false,
      voixRadio: true, // (la radio parle)
      base3d: true, // (la base aérienne en béton : les hélicos et le chasseur-bombardier y sont garés)
    },
    modeles: {
      casques: { bleus: "pot", rouges: "colonial" }, // (affichage/engins3d.js : le casque « pot » en toile, le casque colonial en liège)
      equipementModerne: false, // (pas de lunettes de nuit, de balise, de rails sur les casques)
      arbres: "jungle", // (affichage/decor.js : les « sapins » deviennent des PALMIERS, les feuillus sont plus sombres)
      avions: { avion: "orage", chasseur: "fleche", helico: "vipere" }, // (affichage/avions3d-froide.js)
      helicos: { blackhawk: { bleus: "colibri", rouges: "bourdon" } }, // (affichage/helicos3d-froide.js)
      vehicules: { camion: "tortue" }, // (affichage/vehicules3d-froide.js : le camion devient un transport blindé à chenilles)
    },
    textes: {
      surTitre: "☢️ 1970 · Jungle · Rizières · Hélicos · Chars · Chasseurs à réaction",
      bataille: "la vallée de Ternovie",
      drapeaux: { bleus: { fond: ["#5e8fc4", "#eef2f4"], embleme: "triangle" }, rouges: { fond: ["#6e2f26", "#d7b04a"], embleme: "roue" } },
    },
    remplace: {
      equipes: {
        bleus: { nom: "la Confédération d'Ostrel", marque: "#7fb8ff", camouflage: ["#4a5434", "#58623c", "#353d26", "#6a6e48"] },
        rouges: { nom: "le Directoire de Khavar", marque: "#e8b04a", camouflage: ["#6a6a48", "#7a7650", "#4c4e36", "#8a845c"] },
      },
      // ✍️ LES CHARS (inventés) : le « Grizzly » (Ostrel : la grande tourelle coulée en ogive, la coupole du chef qui
      // dépasse, le projecteur sur le masque) et le « Sanglier » (Khavar : la tourelle basse en dôme, le long canon lisse,
      // les 5 grandes roues, les fûts d'essence à l'arrière)
      chars: [
        { id: "grizzly", nom: "Char M-68 « Grizzly »", pays: "Ostrel", drapeau: "🔺", modele3d: "grizzly", longueur: 6.9, largeur: 3.6, hauteur: 3.2, canon: 3.6,
          vitesseMax: 13, acceleration: 2.6, rotation: 0.55, tourelle: 0.6, recharge: 2.2, texte: "Le char de bataille d'Ostrel : haut, bien blindé, son projecteur et sa grosse coupole." },
        { id: "sanglier", nom: "Char T-66 « Sanglier »", pays: "Khavar", drapeau: "⚙️", modele3d: "sanglier", longueur: 6.6, largeur: 3.3, hauteur: 2.4, canon: 4.6,
          vitesseMax: 13.5, acceleration: 2.4, rotation: 0.5, tourelle: 0.5, recharge: 2.6, texte: "Le char de Khavar : très bas (dur à toucher), un long canon lisse, mais serré à l'intérieur." },
      ],
      char: { vie: 4, vieJoueur: 14 },
      peinture: { bleus: { taches: ["#4a5434", "#58623c", "#2f3522", "#6a6e48"] }, rouges: { taches: ["#7a7650", "#5c6440", "#8a845c", "#4c4e36"] } },
      soldats: { parEquipe: 16, lanceRoquettes: 3 },
      armes: { soldat: { cadence: 0.2, precision: 0.36, portee: 170, degats: 1 }, mitrailleuse: { nom: "Mitrailleuse M-61", cadence: 0.08, precision: 0.5, portee: 300, degats: 1.1 }, grenades: { nom: "Grenades" } },
      // les engins de ton camp : la jeep, l'hélico de combat, le chasseur-bombardier, le transport blindé, l'hélico de
      // transport, et la vedette fluviale (pas de drone, de moto, de quad, de sous-marin ni de camion antiaérien)
      parc: { engins: ["jeep", "helico", "avion", "camion", "blackhawk"], bateau: true, sousmarin: false, dcaEnnemi: false },
      engins: {
        jeep: { nom: "Jeep de liaison « Ranger »", icone: "🚙" },
        helico: { nom: "Hélico de combat « Vipère »", icone: "🚁" },
        avion: { nom: "Chasseur-bombardier F-7 « Orage »", icone: "✈️", vitesse: 100 },
        camion: { nom: "Transport blindé « Tortue »", icone: "🛻", vitesseMax: 17, vie: 4 },
        blackhawk: { nom: "Hélico de transport « Colibri »", modele: "rotor à 2 pales, portes ouvertes" },
      },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 1 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 1 },
        // (les hélicos de l'ordinateur : le « Colibri » d'Ostrel, et l'hélico d'assaut « Bourdon » de Khavar, gros et blindé)
        noms: { blackhawk: { bleus: "Hélico « Colibri »", rouges: "Hélico d'assaut « Bourdon »" } } },
      bateaux: { joueur: { nom: "Vedette fluviale « Libellule »", icone: "🚤" }, ennemis: { nombre: 2, nom: "Sampan armé" } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { transport: { nom: "Avion de transport « Pélican »" } },
      avionsEnnemis: { nombre: 2, nom: "Intercepteur de Khavar", noms: ["Intercepteur « Flèche »", "Intercepteur « Flèche »"], modeles: ["fleche", "fleche"] },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : la vallée de Ternovie
      monde: { arbres: 9500, bosquets: 150, forets: 26, partForets: 0.66, partBosquets: 0.26, haies: 0, granges: 6,
        collines: { hauteur: 20, taille: 260 },
        village: { nom: "le village de Ban-Tarak", rayon: 70, maisons: 0, murets: 0, ruines: 0 },
        hameaux: [] },
      cartes: [
        { id: "bataille", nom: "La vallée de Ternovie", icone: "🌴", texte: "La jungle épaisse, les rizières en terrasses, la rivière, le village sur pilotis et la base de feu sur sa colline.", infanterie: false,
          // palmiers : la part des arbres qui sont des palmiers ; rizieres : [x, z, colonnes, rangées, case (m)] (des
          // terrasses qui descendent vers le nord, pleines d'eau, avec leurs diguettes) ; baseDeFeu : la colline au
          // sommet aplati (rayon du plateau, rayon du pied, hauteur) ; riviere : comme en 1944
          variante: { arbres: 1, collines: 1, tranchees: true, palmiers: 0.32, herbe: true,
            rizieres: [[120, 140, 6, 4, 26], [-610, 60, 5, 5, 24], [300, -430, 6, 3, 26], [-380, -420, 4, 4, 26]],
            baseDeFeu: { nom: "la base de feu « Rocher »", x: BASE.x, z: BASE.z, plateau: 40, pied: 95, hauteur: 15, helipad: [BASE.x + 8, BASE.z - 4] },
            riviere: { x: [-1040, 470], z0: -150, amplitude: 40, periode: 160, largeur: 18, talus: 4, profondeur: 1.4, ponts: [-200, 170], pont: 8 },
            sol: { herbe: [70, 104, 46], herbeSombre: [48, 78, 36], herbeSeche: [96, 112, 58], herbeJaune: [84, 106, 52], terre: [118, 84, 56], terreBattue: [132, 96, 64], sousBois: [52, 62, 34], chemin: [138, 98, 64] },
            soleil: { couleur: 0xfff0c8, force: 3, ciel: 0xc2d6c0, sol: 0x4e6a38 }, brume: 0xc6d2c2 } },
      ],
      // ✍️ LES PERCHOIRS de la jungle : des miradors en bambou, les HUTTES SUR PILOTIS du village (on y monte par
      // l'échelle, on tire par la fenêtre) et les nids de sacs de sable de la base de feu
      perchoirs: {
        sortes: { hutte: { nom: "hutte sur pilotis", feminin: true, pluriel: "huttes sur pilotis", icone: "🛖", hauteur: 2.6, demi: 2.8, pied: 2.4, vie: 2, sacs: true } },
        parCarte: { bataille: { mirador: 6, chateau: 0, colline: 0 } },
        places: HUTTES.map(([x, z, a]) => ["hutte", x, z, a]).concat(NIDS),
      },
      // ✍️ LES NIDS DE MITRAILLEUSE (le système des mitrailleuses lourdes, sans tranchées) : 2 sur la base de feu, 3 dans
      // les bunkers de Khavar au bord de la jungle. places : [x, z, angle (vers l'ennemi), camp]
      tranchees: {
        reseau: false,
        mitrailleuses: { nom: "Mitrailleuse M-61", places: [[BASE.x - 20, BASE.z - 26, -Math.PI / 2, "bleus"], [BASE.x + 24, BASE.z - 22, -Math.PI / 2, "bleus"], [-120, -330, Math.PI / 2, "rouges"], [220, -350, Math.PI / 2, "rouges"], [-520, -330, Math.PI / 2, "rouges"]],
          cadence: 0.07, cadenceIA: 0.1, portee: 300, cone: 1.1, rotation: 1.0, levee: 0.5, rafale: 16, pause: [0.8, 1.8], erreur: 0.035, pense: 0.3, prise: 6, retour: 25, chauffe: 0.012, refroidit: 0.25, enrayage: 3, enfonce: -0.2 },
        couvert: 1,
      },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES des années 70
      classes: {
        assaut: { nom: "Fusilier", icone: "🪖", texte: "Le fusil d'assaut (Carlton noir et léger, ou Drovnik en bois et increvable) ou la mitrailleuse M-61. Et des grenades.",
          armes: ["carlton", "drovnik", "garrow", "m14", "sks"], gadgets: ["sacMunitions", "lanceGrenades"], explosifs: ["grenades", "fumigene"] },
        ingenieur: { nom: "Sapeur", icone: "🚀", texte: "Le lance-roquettes contre les chars, ou le lance-grenades « Becker » contre les soldats. Il répare aussi les engins.",
          armes: ["rpg7", "becker40"], gadgets: ["reparation"], explosifs: ["mineAT", "c4"], armesBonus: ["carlton", "drovnik", "sks"] },
        eclaireur: { nom: "Éclaireur", icone: "🎯", texte: "Le fusil de précision à lunette, les jumelles, et les mines directionnelles.",
          armes: ["dv63", "rennick03", "m21", "m40"], gadgets: ["jumelles"], explosifs: ["claymore", "grenades"] },
        medecin: { nom: "Infirmier", icone: "⛑️", texte: "Il soigne et relève les blessés. Un fusil d'assaut pour se défendre.",
          armes: ["carlton", "drovnik", "sks"], gadgets: ["trousse"], explosifs: ["grenades", "fumigene"], plaques: false },
      },
      armesPrincipales: {
        carlton: { nom: "Fusil d'assaut Carlton M-17", type: "Fusil d'assaut (5,56 mm, 20 coups)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le fusil noir d'Ostrel, en plastique et en alu : léger, précis, il tire vite. La poignée de transport sur le dessus.",
          degats: 1, cadence: 0.075, portee: 220, porteeEfficace: 100, degatsLoin: 0.6, chargeur: 20, reserve: 180, rechargement: 2.2,
          dispersion: 0.03, dispersionVisee: 0.006, recul: 0.009, visee: 0.25, mobilite: 1.0, bruit: 1, zoom: 1.3, vitesseBalle: 950 },
        drovnik: { nom: "Fusil d'assaut Drovnik DK-47", type: "Fusil d'assaut (7,62 mm, 30 coups)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le fusil de Khavar : la crosse en bois, le chargeur courbe en « banane ». Il fait plus mal, mais il saute plus.",
          degats: 1.25, cadence: 0.1, portee: 210, porteeEfficace: 90, degatsLoin: 0.6, chargeur: 30, reserve: 180, rechargement: 2.5,
          dispersion: 0.036, dispersionVisee: 0.008, recul: 0.014, visee: 0.27, mobilite: 0.98, bruit: 1.15, zoom: 1.3, vitesseBalle: 715 },
        garrow: { nom: "Mitrailleuse M-61 « Garrow »", type: "Mitrailleuse (bande de 100)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 2, exclus: SANS_ATELIER,
          texte: "Lourde, longue, sur son bipied : une BANDE de 100 cartouches. Elle arrose tout, mais tu bouges lentement.",
          degats: 1.3, cadence: 0.1, portee: 260, porteeEfficace: 120, degatsLoin: 0.65, chargeur: 100, reserve: 300, rechargement: 5.5,
          dispersion: 0.05, dispersionVisee: 0.012, recul: 0.012, visee: 0.45, mobilite: 0.82, bruit: 1.5, zoom: 1.3 },
        // ✍️ (demande 128) « Et cela pour les éditions. » (un râtelier de musée) : le fusil de combat en bois, sa version de tireur
        // d'élite à lunette, la carabine de Khavar à baïonnette repliable, et le fusil à verrou « de chasse ». (Le fusil noir à
        // lance-grenades : c'est le Carlton avec le gadget « lance-grenades sous le canon » du Fusilier.)
        m14: { nom: "Fusil de combat Ostrel M-14", type: "Fusil de combat (7,62 mm, 20 coups)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 3, exclus: SANS_ATELIER,
          texte: "Le long fusil en bois d'avant le Carlton : une grosse balle qui va loin et fait mal, 20 coups. Lourd, et il saute en rafale.",
          degats: 1.55, cadence: 0.11, portee: 260, porteeEfficace: 120, degatsLoin: 0.7, chargeur: 20, reserve: 140, rechargement: 2.6,
          dispersion: 0.034, dispersionVisee: 0.0055, recul: 0.016, visee: 0.32, mobilite: 0.95, bruit: 1.25, zoom: 1.35, vitesseBalle: 850 },
        sks: { nom: "Carabine Khavar SK-45", type: "Carabine semi-automatique (10 coups)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 1, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "La carabine en bois de Khavar : 10 balles, remplie par le haut avec une lame-chargeur, et sa baïonnette repliée sous le canon.",
          degats: 1.3, cadence: 0.22, portee: 220, porteeEfficace: 100, degatsLoin: 0.65, chargeur: 10, reserve: 100, rechargement: 2.6,
          dispersion: 0.03, dispersionVisee: 0.006, recul: 0.014, visee: 0.27, mobilite: 0.99, bruit: 1.15, zoom: 1.3, vitesseBalle: 735 },
        m21: { nom: "Ostrel M-21 à lunette", type: "Fusil de tireur d'élite semi-auto, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 4, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le M-14 choisi pour sa précision, avec une lunette : 20 balles semi-automatiques, très loin.",
          degats: 2.3, cadence: 0.4, portee: 400, porteeEfficace: 250, degatsLoin: 0.8, chargeur: 20, reserve: 60, rechargement: 2.8,
          dispersion: 0.07, dispersionVisee: 0.0011, recul: 0.022, visee: 0.4, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 850 },
        m40: { nom: "Fusil à verrou M-40 « de chasse »", type: "Fusil à verrou, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 6, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "La crosse de chasse en noyer, le gros canon, la longue lunette : 5 balles, le plus précis de tous.",
          degats: 3.2, cadence: 1.2, portee: 460, porteeEfficace: 320, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 3,
          dispersion: 0.07, dispersionVisee: 0.0008, recul: 0.026, visee: 0.43, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 820 },
        rpg7: { nom: "Lance-roquettes RK-7", type: "Lance-roquettes", exclus: SANS_ATELIER, texte: "Le tube et sa roquette en ogive : 1 roquette = 1 obus sur un char." },
        becker40: { nom: "Lance-grenades Becker 40", type: "Lance-grenades (40 mm, coup par coup)", icone: "💥", classe: "ingenieur", famille: "roquettes", projectile: "lg40", niveau: 0, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le gros fusil à canon court, cassé comme un fusil de chasse : une grenade de 40 mm qui explose en touchant. « Bloup ! »",
          degats: 0.3, cadence: 0.4, portee: 180, porteeEfficace: 180, degatsLoin: 1, chargeur: 1, reserve: 24, rechargement: 1.8,
          dispersion: 0.03, dispersionVisee: 0.01, recul: 0.03, visee: 0.3, mobilite: 0.98, bruit: 0.6, zoom: 1.3 },
        dv63: { nom: "Fusil de précision DV-63", type: "Fusil semi-automatique, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 0, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le long fusil de Khavar, la crosse évidée, la lunette sur le côté : 10 balles, semi-automatique. Sa balle est plus lente : vise un peu plus haut de loin !",
          degats: 2.2, cadence: 0.55, portee: 380, porteeEfficace: 240, degatsLoin: 0.8, chargeur: 10, reserve: 40, rechargement: 2.8,
          dispersion: 0.07, dispersionVisee: 0.0012, recul: 0.025, visee: 0.4, mobilite: 0.98, bruit: 1.3, zoom: 4, vitesseBalle: 700 },
        rennick03: { nom: "Fusil à verrou M-40 « Rennick »", type: "Fusil à verrou, lunette ×4", icone: "🎯", classe: "eclaireur", famille: "precision", niveau: 2, verrou: true, coupParCoup: true, exclus: SANS_ATELIER,
          texte: "Le fusil à verrou d'Ostrel et sa longue lunette : 5 balles, très précis.",
          degats: 3, cadence: 1.2, portee: 440, porteeEfficace: 300, degatsLoin: 0.85, chargeur: 5, reserve: 40, rechargement: 3,
          dispersion: 0.07, dispersionVisee: 0.001, recul: 0.026, visee: 0.42, mobilite: 0.95, bruit: 1.3, zoom: 4, vitesseBalle: 820 },
      },
      pistolets: R({
        colton45: { nom: "Pistolet Colton 1911", type: "Pistolet (.45)", icone: "🔫", famille: "pistolet", niveau: 0, exclus: SANS_ATELIER,
          texte: "Le vieux gros pistolet d'Ostrel : 7 balles qui font mal.",
          degats: 1.3, cadence: 0.32, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 7, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.032, dispersionVisee: 0.012, recul: 0.03, visee: 0.15, mobilite: 1.05, bruit: 0.9, zoom: 1.2 },
        varnP38: { nom: "Pistolet Tokar T-33", type: "Pistolet (7,62 mm)", icone: "🔫", famille: "pistolet", niveau: 2, exclus: SANS_ATELIER,
          texte: "Le pistolet plat de Khavar : 8 balles rapides.",
          degats: 1, cadence: 0.27, portee: 65, porteeEfficace: 25, degatsLoin: 0.5, chargeur: 8, reserve: Infinity, rechargement: 1.6,
          dispersion: 0.03, dispersionVisee: 0.011, recul: 0.024, visee: 0.15, mobilite: 1.05, bruit: 0.9, zoom: 1.2 },
      }),
      gadgets: { trousse: { nom: "Trousse d'infirmier" }, jumelles: { nom: "Jumelles" }, reparation: { nom: "Caisse à outils" }, sacMunitions: { nom: "Musette de munitions" }, lanceGrenades: { nom: "Lance-grenades LG-20 sous le canon" } }, // (demande 128 : le fusil noir et son lance-grenades)
      explosifs: { c4: { nom: "Charge de démolition", icone: "🧨" }, mineAT: { nom: "Mine antichar" }, claymore: { nom: "Mine directionnelle" } },
      armes3d: {
        ia: {
          bleus: [["carlton", 7], ["garrow", 1], ["m14", 2]],
          rouges: [["drovnik", 7], ["garrow", 1], ["sks", 2]],
          roquettes: [["rpg7", 1]],
          elite: { bleus: [["rennick03", 1]], rouges: [["dv63", 1]], viseur: [["mire", 1]] },
          viseur: [["mire", 1]], canon: [["standard", 1]], bouche: [["aucune", 1]], chargeur: [["standard", 1]], poignee: [["aucun", 1]],
        },
      },
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["Casque « pot » recouvert de toile (Ostrel) ou casque colonial (Khavar)", "Treillis de jungle, manches retroussées", "Ceinturon, bidons et pochettes à chargeurs", "Pas de gilet pare-balles : ça n'existe pas encore"] },
        ingenieur: { equipement: ["Le lance-roquettes, ou le lance-grenades « Becker »", "Caisse à outils", "Mines antichars et charges de démolition", "Casque, musette"] },
        eclaireur: { equipement: ["Le CHAPEAU DE BROUSSE (pas de casque)", "Le fusil de précision à lunette", "Jumelles sur la poitrine", "Mines directionnelles"] },
        medecin: { equipement: ["Croix rouge sur le casque et sur le sac", "Trousse d'infirmier, pansements", "Le fusil d'assaut pour se défendre"] },
      } },
      // ---------------------------------------------------------------- 🧵 LES UNIFORMES, LA LUMIÈRE TROPICALE, LA BRUME
      realisme: {
        soldats: {
          uniformes: {
            bleus: { nom: "vert olive", fond: "#55583a", taches: ["#55583a", "#5a5d3e", "#505337"], equipement: "#5b5c3c", casque: "#4f5434" },
            rouges: { nom: "kaki-vert", fond: "#7a7452", taches: ["#7a7452", "#6e6c4a", "#827c58"], equipement: "#5c5a3c", casque: "#b9ab80" },
            motif: 0.7, ripstop: 0.006, plis: 1.1, boue: 0.6, relief: 1.6,
          },
          visage: { lunettes: ["aucune", "soleil", "aucune", "aucune"] },
        },
        lumiere: { bataille: { direction: [0.4, 0.78, 0.3], couleur: "#fff2cf", force: 3.0, ciel: "#bfd4bc", sol: "#4c6634", ambiance: 0.95, exposition: 0.95,
          zenith: "#5c8cb8", horizon: "#d2dccb", brume: "#c6d2c2", halo: 0.75, nuages: 0.55, fumees: 3, filtre: { saturation: 0.95, contraste: 1.06 } } },
        atmosphere: { debut: 0.28 }, // (la BRUME de la jungle commence tout près)
      },
      ambiance: { saturation: 0.9, teinte: 0.25, vignette: 0.5, grain: 0.07 },
      // ---------------------------------------------------------------- 🎸 LA MUSIQUE : un riff de guitare électrique des années 70
      // guitare : la force de la guitare saturée (0 = pas de guitare) ; riff : sur les 6 croches de chaque mesure, la
      // force de l'accord « en puissance » (0 = rien) ; batterie : la caisse claire et la grosse caisse
      musique: {
        tempo: 128, volume: 0.45, nappe: 0.015, violoncelles: 0, cuivres: 0, pulsation: 0.04, tambours: 0.6, choeur: 0, cymbales: 0.07,
        guitare: 0.07, riff: [1, 0, 0.6, 1, 0.6, 0.8], batterie: 0.5,
        accords: [
          { nom: "mi", notes: ["E2", "B2", "E3", "G3"] }, { nom: "mi", notes: ["E2", "B2", "E3", "G3"] },
          { nom: "sol", notes: ["G2", "D3", "G3", "B3"] }, { nom: "la", notes: ["A2", "E3", "A3", "C4"] },
          { nom: "mi", notes: ["E2", "B2", "E3", "G3"] }, { nom: "ré", notes: ["D2", "A2", "D3", "F#3"] },
          { nom: "do", notes: ["C2", "G2", "C3", "E3"] }, { nom: "si", notes: ["B1", "F#2", "B2", "D#3"] },
        ],
        melodie: [
          [[0, "E4", 2], [2, "G4", 1], [3, "A4", 2], [5, "B4", 1]], [[0, "B4", 3], [3, "A4", 1], [4, "G4", 2]], [[0, "D5", 2], [2, "B4", 1], [3, "G4", 3]], [[0, "A4", 6]],
          [[0, "E5", 2], [2, "D5", 1], [3, "B4", 2], [5, "A4", 1]], [[0, "F#4", 3], [3, "A4", 3]], [[0, "G4", 2], [2, "E4", 1], [3, "G4", 2], [5, "B4", 1]], [[0, "B4", 3], [3, "D#5", 3]],
        ],
      },
    },
  });
})();
