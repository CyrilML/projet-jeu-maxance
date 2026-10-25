// 🛡️ L'ÉDITION « BATAILLE EN EUROPE DE L'EST » : une guerre d'aujourd'hui, dans une plaine enneigée (demande 115, édition n° 4)
//
// ✍️ « Bataille en Ukraine. » ⚠️ C'est une vraie guerre, qui fait de vraies victimes aujourd'hui. ✍️ (Cyril) « Fais du
// faux, évidemment. » Alors TOUT est INVENTÉ, et traité avec respect (pas de sang, jamais de civils visés, aucun vrai
// lieu, aucun vrai symbole, aucun vrai drapeau, aucun vrai chef) :
//   - 🟢 la RÉPUBLIQUE DE SARMATIE (drapeau vert sapin et argent au chevron ; la présidente Ilsa Merovan ; le ruban
//     VERT sur les bras et le casque) contre
//   - 🟠 la FÉDÉRATION DE KORVAST (drapeau bordeaux et gris à la tour ; le maréchal Radek Volkar ; le ruban ORANGE) ;
//   - la PLAINE DE VELMORA en hiver : la neige, la terre noire qui ressort en boue, les champs de tournesols coupés (les
//     tiges sèches en rangs), les RIDEAUX D'ARBRES (les haies d'arbres contre le vent), la petite ville de Velmora et ses
//     immeubles de 5 étages, la zone industrielle et son grand SILO À GRAIN, la rivière GELÉE ; les tranchées modernes
//     (bois, sacs de sable, filets de camouflage), les DENTS DE DRAGON en béton (contre les chars), les panneaux « MINES ».
//   - la grande nouveauté : les DRONES FPV (de petits drones à 4 hélices, pilotés avec des lunettes vidéo, qui portent une
//     charge et plongent sur leur cible) : les deux camps en envoient (logique/drones-fpv.js), TOI aussi tu peux en piloter
//     un, les chars ont une CAGE anti-drones sur la tourelle, et l'ingénieur a un BROUILLEUR qui les fait tomber.
// Ce fichier ne contient que des DONNÉES (comme config.js). Le tailleur (editions/appliquer.js) les coud par-dessus.
// Les nombres : m, s, m/s, rad (comme config.js).

window.Tanks = window.Tanks || {};

(function () {
  const R = Tanks.EDITIONS.toutRemplacer;
  // ✍️ LA ZONE INDUSTRIELLE de Velmora (à l'ouest de la ville) : le grand silo à grain (une tour de béton), ses 4 silos
  // ronds, et les hangars. [x, z] du milieu.
  const USINE = { x: -330, z: 40 };
  Tanks.EDITIONS.ajouter("est", {
    regles: {
      campagne: false, boutique: false, film: false,
      tranchees: true, // les tranchées modernes (le même chef de section que 1916 : logique/tranchees.js)
      barrage: true, // les tirs d'artillerie (des obus modernes)
      vagues: true, // de temps en temps, un groupe sort de la tranchée pour avancer
      voixRadio: true, // (la radio parle)
      base3d: true,
      dronesFPV: true, // ✍️ les drones FPV (logique/drones-fpv.js)
    },
    modeles: {
      arbres: "hiver", // (affichage/decor.js : les feuillus sans feuilles, couleur bois sec ; les sapins couverts de neige)
      vehicules: { camion: "glouton" }, // (affichage/vehicules3d-est.js : le camion devient un véhicule de combat d'infanterie)
      tranchees: "moderne", // (affichage/est3d.js : des filets de camouflage au-dessus des tranchées)
    },
    textes: {
      surTitre: "🛡️ Aujourd'hui · Plaine enneigée · Drones FPV · Tranchées · Chars à cage · Pays inventés",
      bataille: "la plaine de Velmora",
      drapeaux: { bleus: { fond: ["#2f5a3c", "#e4e8e2"], embleme: "chevron" }, rouges: { fond: ["#6b2433", "#b9bcc0"], embleme: "tour" },
        chefs: "chefs inventés : la présidente Ilsa Merovan (Sarmatie) · le maréchal Radek Volkar (Korvast)" },
    },
    remplace: {
      equipes: {
        // marque : la couleur du RUBAN (sur les bras, autour du casque) et des repères à l'écran
        bleus: { nom: "la République de Sarmatie", marque: "#5fd65a", camouflage: ["#dfe3e2", "#c5cbc9", "#7d8580", "#eef1f0"] },
        rouges: { nom: "la Fédération de Korvast", marque: "#ff8a1e", camouflage: ["#d8dbd8", "#b9bdb8", "#6f746c", "#e9ebe8"] },
      },
      // ✍️ LES CHARS (inventés, sur la base des chars modernes) : peints à la CHAUX blanche, et une CAGE anti-drones
      // soudée au-dessus de la tourelle (affichage/chars3d-est.js). cage : la chance qu'un drone FPV éclate sur la cage
      // au lieu du blindage (il ne fait presque rien).
      chars: [
        { id: "bastion", nom: "Char SK-30 « Bastion »", pays: "Sarmatie", drapeau: "🟢", modele3d: "cage-leopard", longueur: 7.7, largeur: 3.75, hauteur: 2.6, canon: 6.6,
          vitesseMax: 18, acceleration: 4.4, rotation: 0.8, tourelle: 0.85, recharge: 1.9, cage: 0.4,
          texte: "Le char de Sarmatie : précis, rapide, et sa grande cage anti-drones sur la tourelle." },
        { id: "avalanche", nom: "Char KR-90 « Avalanche »", pays: "Korvast", drapeau: "🟠", modele3d: "cage-abrams", longueur: 7.9, largeur: 3.7, hauteur: 2.4, canon: 5.6,
          vitesseMax: 18.5, acceleration: 4.7, rotation: 0.8, tourelle: 0.95, recharge: 2.0, cage: 0.4,
          texte: "Le char de Korvast : moteur à turbine, tourelle très rapide, cage en grillage sur le toit." },
      ],
      char: { vie: 4, vieJoueur: 14 },
      // la peinture des chars : la chaux blanche, mal passée (le vert et le gris ressortent par plaques)
      peinture: { bleus: { taches: ["#e4e7e6", "#c9cecb", "#6e7a5c", "#f2f4f3"], boue: "#3a332c", poussiere: "#e8ecee" }, rouges: { taches: ["#dcdfdc", "#b8bcb6", "#5f6656", "#eceeeb"], boue: "#3a332c", poussiere: "#e8ecee" } },
      soldats: { parEquipe: 18, lanceRoquettes: 3 },
      armes: { soldat: { cadence: 0.2, precision: 0.38, portee: 190, degats: 1 }, mitrailleuse: { nom: "Mitrailleuse lourde « Grêle »", cadence: 0.08, precision: 0.5, portee: 320, degats: 1.2 } },
      // les engins de ton camp : le blindé MRAP, l'hélico d'attaque (rare), le drone FPV, le véhicule de combat
      // d'infanterie (pas d'avion de chasse, de moto, de quad, de bateau, de sous-marin ni de camion antiaérien ennemi)
      parc: { engins: ["jeep", "helico", "drone", "camion"], bateau: false, sousmarin: false, dcaEnnemi: false },
      engins: {
        jeep: { nom: "Blindé MRAP « Rempart »", icone: "🚙", vie: 3 },
        helico: { nom: "Hélico d'attaque « Gerfaut »", icone: "🚁" },
        camion: { nom: "Véhicule de combat d'infanterie « Glouton »", icone: "🛻", vitesseMax: 16, vie: 4 },
        // ✍️ LE DRONE FPV : piloté à la 1re personne avec des lunettes vidéo. Il fonce (115 km/h), Espace (ou un choc)
        // le fait EXPLOSER ; puis tu retires tes lunettes, à côté de son aire, et un nouveau drone est prêt « recharge » s
        // plus tard. batterie : s de vol ; portee : m au-delà desquels le signal est perdu (l'image se brouille avant).
        drone: { nom: "Drone FPV « Frelon »", icone: "🛸", fpv: true, vitesseMax: 32, acceleration: 16, virage: 2.3, montee: 10, hauteurMax: 110,
          munitions: 1, recharge: 20, batterie: 110, portee: 1500, aide: "↑ accélérer · ↓ freiner · ← → tourner · Q monter · D descendre · Espace : FAIRE EXPLOSER (ou fonce dans la cible)" },
      },
      vehicules: { parCamp: { moto: 0, quad: 0, camion: 1 } },
      helicosTransport: { parCamp: { chinook: 0, blackhawk: 0 } },
      bateaux: { ennemis: { nombre: 0 } },
      sousMarins: { ennemis: { nombre: 0 } },
      portails: { paires: [] },
      parachutistes: { toutesLes: 1e9, premier: 1e9 },
      avionsEnnemis: { nombre: 0 }, // (le ciel appartient aux drones)
      projectiles: {
        // ✍️ la charge du drone FPV : elle part de tout près de la cible (le drone plonge dessus) ; « fpvCage » : la charge
        // qui éclate sur la cage anti-drones, loin du blindage
        fpv: { vitesse: 60, gravite: 0, degatsChar: 1.6, souffle: 6, vieMax: 0.5 },
        fpvCage: { vitesse: 60, gravite: 0, degatsChar: 0.25, souffle: 3, vieMax: 0.5 },
        barrage: { vitesse: 230, gravite: 9.8, degatsChar: 1, souffle: 8, vieMax: 8 }, // (un obus d'artillerie moderne)
      },
      structures: { explosions: { fpv: [70, 2.6], fpvCage: [30, 1.8], barrage: [160, 4.5] } },
      realisme: {
        explosions: { tailles: { fpv: 0.7, fpvCage: 0.45, barrage: 1.6 } },
        // ✍️ LES UNIFORMES : le camouflage d'hiver (blanc, gris, un peu de vert), et le RUBAN de couleur de chaque camp
        soldats: {
          uniformes: {
            bleus: { nom: "hiver (ruban vert)", fond: "#cfd3d1", taches: ["#9aa29c", "#6f7a6c", "#e6e9e7"], equipement: "#6a7262", casque: "#c8ccc9" },
            rouges: { nom: "hiver (ruban orange)", fond: "#c9cbc6", taches: ["#8c918a", "#5e645a", "#e1e3df"], equipement: "#5e6458", casque: "#c0c3be" },
            motif: 0.7, ripstop: 0.006, plis: 1, boue: 0.75, relief: 1.6,
          },
          visage: { barbe: 0.45 },
        },
        // ❄️ un ciel d'hiver couvert, une lumière froide et basse, de la brume
        lumiere: { bataille: { direction: [0.5, 0.42, 0.35], couleur: "#eef2f6", force: 2.3, ciel: "#c6ccd2", sol: "#9aa0a4", ambiance: 1.1, exposition: 1.0,
          zenith: "#7d8a96", horizon: "#d2d7db", brume: "#c9ced2", halo: 0.3, nuages: 0.92, fumees: 6, filtre: { saturation: 0.7, contraste: 1.08 } } },
        atmosphere: { debut: 0.3 },
      },
      ambiance: { saturation: 0.75, teinte: 0.15, vignette: 0.5, grain: 0.06 },
      // ---------------------------------------------------------------- 🗺️ LA CARTE : la plaine de Velmora en hiver
      monde: { camp: 500, arbres: 900, bosquets: 30, forets: 3, partForets: 0.35, partBosquets: 0.4, haies: 0, granges: 10,
        collines: { hauteur: 7, taille: 300 }, // (une plaine : des bosses très douces)
        village: { nom: "la petite ville de Velmora", rayon: 75, maisons: 0, murets: 0, ruines: 0 },
        hameaux: [{ nom: "le hameau de Tarvo", x: -620, z: -60, rayon: 50, maisons: 7, murets: 6 }] },
      // la ville : surtout des IMMEUBLES de 5 étages aux toits plats (les autres maisons restent des maisons)
      ville: { immeubles: 0.7, etages: [5, 5], boutiques: 0.25, balcons: 0.6, clims: 0.02, affiches: 0.15, voiture: 16 },
      cartes: [
        { id: "bataille", nom: "La plaine de Velmora", icone: "❄️", texte: "La plaine enneigée, les champs de tournesols coupés, les rideaux d'arbres, la petite ville et ses immeubles, le silo à grain, la rivière gelée, les tranchées.", infanterie: false,
          variante: { arbres: 1, collines: 1, herbe: false, matiereSol: "terre", tranchees: true, village: false,
            // la ville (le même urbaniste que la carte « La ville », logique/ville.js), à moitié abandonnée
            quartier: { x: 0, z: 0, rayon: 140, ilot: 40, rue: 10, maisons: 2, ruinesDepart: 0.3 }, rues: "#57575a", ville: "abandonnee", toitPlat: true,
            crepis: ["#b9b6ae", "#a9a79f", "#c6c2b8", "#9e9c96", "#cfcac0"],
            // ✍️ LES BÂTIMENTS de la zone industrielle : [x, z, demi-longueur, demi-largeur, angle, hauteur, type, nom]
            batiments: [[USINE.x, USINE.z, 7, 4.5, 0, 27, "tour", "le grand silo à grain"], [USINE.x - 40, USINE.z + 28, 14, 8, 0, 7, "grange", "le hangar à grain"],
              [USINE.x + 34, USINE.z + 34, 12, 7, 0.1, 6.5, "grange", "l'atelier"], [USINE.x - 46, USINE.z - 22, 10, 6, Math.PI / 2, 6, "grange", "le garage des tracteurs"]],
            // ✍️ les 4 SILOS RONDS à côté du grand silo : [x, z, rayon, hauteur] (dessinés par affichage/est3d.js ; on ne
            // passe pas au travers : logique/front-est.js)
            silos: [[USINE.x + 13, USINE.z - 2, 3.6, 18], [USINE.x + 21, USINE.z - 2, 3.6, 18], [USINE.x + 13, USINE.z + 6, 3.6, 18], [USINE.x + 21, USINE.z + 6, 3.6, 18]],
            // ✍️ LES RIDEAUX D'ARBRES (des rangées d'arbres contre le vent, au bord des champs) : [x, z, rangées, colonnes, écart (m), taille]
            vergers: [[-940, 110, 1, 62, 5, 1.05], [-940, 118, 1, 62, 5, 0.95], [180, -120, 1, 40, 5, 1], [-700, -330, 1, 70, 5, 1], [-150, 400, 1, 75, 5, 1],
              [-760, -150, 60, 1, 5, 1], [260, 160, 34, 1, 5, 1], [-480, 300, 1, 50, 5, 1]],
            // ✍️ LES CHAMPS DE TOURNESOLS coupés (les tiges sèches qui sortent de la neige, en rangs) : [x0, z0, x1, z1]
            tournesols: [[-930, 130, -640, 300], [-600, -300, -260, -170], [170, -330, 400, -130], [-560, 320, -200, 450], [-240, -460, 120, -390], [170, 175, 400, 330]],
            // ✍️ LES DENTS DE DRAGON (des pyramides de béton contre les chars) : [x0, x1, z] (2 rangées en quinconce)
            dents: [[-760, -260, 172], [190, 380, 172], [-760, -260, -172], [190, 380, -172]],
            // ✍️ LES CHAMPS DE MINES signalés (des panneaux « MINES » tout autour) : [x, z, rayon]
            mines: [[-520, 120, 40], [280, -110, 35], [-200, -130, 30], [120, 120, 30]],
            // la rivière GELÉE (comme celle de 1944, mais de glace : on la traverse partout ; « glace » : le dessin)
            riviere: { x: [-1040, 410], z0: -362, amplitude: 16, periode: 190, largeur: 16, talus: 4, profondeur: 0.5, ponts: [-260, 120], pont: 8, glace: true },
            // la neige : le sol peint (blanc bleuté, la terre noire, la boue des chemins)
            sol: { herbe: [226, 230, 234], herbeSombre: [204, 210, 216], herbeSeche: [178, 170, 152], herbeJaune: [214, 214, 206], terre: [58, 50, 44], terreBattue: [92, 86, 80],
              sousBois: [184, 190, 194], sable: [196, 198, 196], boue: [64, 56, 48], fond: [70, 76, 82], chemin: [88, 78, 68] },
            soleil: { couleur: 0xeef2f6, force: 2.3, ciel: 0xc6ccd2, sol: 0x9aa0a4 }, brume: 0xc9ced2 } },
      ],
      perchoirs: { parCarte: { bataille: { mirador: 3, chateau: 1, colline: 0 } } },
      // ✍️ LES TRANCHÉES MODERNES (le même chef de section que 1916, logique/tranchees.js ; le terrassier ajoute les
      // filets de camouflage). Les deux lignes passent au nord et au sud de la ville (z = ±210).
      tranchees: {
        x: [-900, 390], feu: 210, soutien: 256, arriere: 320, boyaux: [-720, -440, -170, 160, 340],
        zigzag: [4, 26], zigzagSoutien: [3, 32], zigzagBoyau: [1.5, 14],
        profil: { profondeur: 1.85, banquette: 1.15, fond: 0.7, bord: 1.2, marche: [0.32, 0.92] },
        crateres: { nombre: 140, rayon: [2, 5.5], profondeur: [0.4, 1.3], zone: 175, partDerriere: 0.2, derriere: 90, eau: 0.15 },
        barbeles: { rangs: [24, 30], segment: 8, largeur: 3.2, frein: 0.35 },
        mitrailleuses: { nom: "Mitrailleuse lourde « Grêle »", x: [-430, -110, 230], cadence: 0.075, cadenceIA: 0.12, portee: 340, cone: 1.05, rotation: 0.9, levee: 0.5, rafale: 14, pause: [0.9, 2.1], erreur: 0.035, pense: 0.3, prise: 6, retour: 25, chauffe: 0.012, refroidit: 0.25, enrayage: 3, enfonce: 0.3 },
        vagues: { premier: 45, toutesLes: 70, decalage: 25, part: 0.35, renforts: 6, front: [-560, 330], toi: 4 },
        barrage: { premier: 60, toutesLes: 75, duree: 8, obus: 10, zone: 165, hauteur: 300, vise: 0.5, ecart: 16, rayonCoupe: 5 },
        couvert: 0.4,
        boue: 420, // (les taches de boue peintes sur le front : la neige reste visible entre elles)
      },
      // ✍️ LES DRONES FPV (logique/drones-fpv.js). m, s, m/s.
      //   les opérateurs de l'ordinateur : chaque camp fait décoller un drone toutes les « toutesLes » [min, max] s (le
      //   1er après « premier » s), au plus « enLAir » à la fois ; il part d'un soldat de son camp (le pilote, dans la
      //   tranchée), vole à « altitude » m à « vitesse », puis PLONGE à « pique » quand il est à moins de « distancePique »
      //   m de sa cible, et explose à moins de « rayonCible » m. « partChars » : la part des drones envoyés sur un véhicule
      //   (sinon : sur un GROUPE d'au moins « groupe.min » soldats à moins de « groupe.rayon » m les uns des autres, sinon un
      //   soldat seul) ; « portee » : m au plus entre le pilote et la cible ; « batterie » : s de vol (après, il tombe) ;
      //   « pense » : s entre deux coups d'œil sur sa cible (on ne recalcule pas tout à chaque pas : pas de lag) ;
      //   « virage » : rad/s ; la cage des chars : « chars[].cage ».
      //   brouilleur : le gadget de l'ingénieur (config « gadgets.brouilleur »).
      fpv: { premier: 20, toutesLes: [13, 22], enLAir: 3, altitude: 24, vitesse: 22, pique: 30, distancePique: 70, rayonCible: 2.4, virage: 2.4,
        partChars: 0.6, groupe: { rayon: 9, min: 2 }, portee: 800, batterie: 80, pense: 0.5 },
      // ---------------------------------------------------------------- 🎖️ LES CLASSES ET LES ARMES d'aujourd'hui
      classes: {
        assaut: { texte: "Le fusil d'assaut (peint pour l'hiver dans l'armurerie), ou la mitrailleuse légère. Le lance-grenades sous le canon.",
          armes: ["ar4", "ak12", "g36", "scarh", "pkm"] },
        ingenieur: { texte: "Le chasseur de chars : missile Javelin, lance-roquettes AT4 ou NLAW. Son BROUILLEUR fait tomber les drones FPV ennemis tout autour.",
          armes: ["at4", "javelin", "nlaw", "rpg7"], gadgets: ["brouilleur", "reparation"] },
      },
      armesPrincipales: {
        // la mitrailleuse légère (comme la « Garrow » de la Guerre froide, mais d'aujourd'hui) : une bande de 100
        pkm: { nom: "Mitrailleuse légère MK-7 « Bourrasque »", type: "Mitrailleuse (7,62 mm, bande de 100)", icone: "🔫", classe: "assaut", famille: "fusil", niveau: 2,
          exclus: ["viseur", "canon", "bouche", "chargeur", "poignee", "crosse", "munitions", "lampe", "laser"],
          texte: "Lourde, sur son bipied, avec sa bande de 100 cartouches dans la boîte : elle arrose une tranchée entière. Tu bouges lentement.",
          degats: 1.3, cadence: 0.09, portee: 270, porteeEfficace: 130, degatsLoin: 0.65, chargeur: 100, reserve: 300, rechargement: 5.5,
          dispersion: 0.05, dispersionVisee: 0.012, recul: 0.012, visee: 0.45, mobilite: 0.82, bruit: 1.5, zoom: 1.3 },
        // le lance-missiles léger « NLAW » (même projectile que l'AT4 : on vise et on tire, le missile fait le reste)
        nlaw: { nom: "Lance-missiles léger NL-4 « Pique »", type: "Missile antichar léger (tire et oublie)", icone: "🚀", classe: "ingenieur", famille: "roquettes", projectile: "javelin", niveau: 0,
          texte: "Un tube vert, court et léger : le missile plonge sur le TOIT du char, là où le blindage est fin. 1 coup, puis tu en prends un autre.",
          degats: 1, cadence: 1, portee: 400, porteeEfficace: 400, degatsLoin: 1, chargeur: 1, reserve: 4, rechargement: 3.2,
          dispersion: 0.02, dispersionVisee: 0.006, recul: 0.04, visee: 0.5, mobilite: 0.95, bruit: 1, zoom: 1.6 },
        javelin: { nom: "Missile Javelin" },
        at4: { nom: "Lance-roquettes AT4" },
        rpg7: { nom: "Lance-roquettes RPG (vieux)" },
      },
      gadgets: {
        // ✍️ LE BROUILLEUR anti-drones de l'ingénieur : Espace l'allume « duree » s ; tous les drones FPV ennemis à moins de
        // « rayon » m perdent leur signal et TOMBENT. Puis il refroidit « attente » s.
        brouilleur: { nom: "Brouilleur anti-drones", niveau: 0, icone: "📡", texte: "Espace : il brouille pendant 10 s. Les drones FPV ennemis à moins de 70 m perdent leur pilote et tombent.",
          rayon: 70, duree: 10, attente: 28 },
      },
      armes3d: {
        ia: {
          bleus: [["ar4", 5], ["g36", 2], ["scarh", 1], ["mp5", 0.5], ["m110", 0.8]],
          rouges: [["ak12", 6], ["svd", 1.2], ["bizon", 0.6], ["ar4", 0.5]],
          roquettes: [["at4", 2], ["javelin", 2], ["rpg7", 1]],
          // ✍️ (demande 115, Europe de l'Est) les armes des soldats de l'ordinateur sont PEINTES pour l'hiver
          peinture: [["neige", 3], ["urbain", 1], ["aucune", 1]],
        },
      },
      vitrinePersonnages: { classes: {
        assaut: { equipement: ["Casque moderne recouvert de toile blanche, et le RUBAN de couleur du camp autour", "Tenue de camouflage d'hiver (blanc, gris, un peu de vert)", "Gilet pare-balles et ses chargeurs", "Le ruban de couleur sur les DEUX bras (vert : Sarmatie, orange : Korvast)"] },
        ingenieur: { equipement: ["Le BROUILLEUR anti-drones (ses antennes)", "Le missile antichar (Javelin, AT4 ou NL-4)", "Outils de réparation", "Mines antichars et charges"] },
        eclaireur: { equipement: ["Le fusil de précision à lunette", "Les jumelles", "Une cape blanche pour se cacher dans la neige"] },
        medecin: { equipement: ["La croix rouge sur le casque et le sac", "La trousse de soins, le défibrillateur", "Le ruban du camp"] },
      } },
      // ---------------------------------------------------------------- 🎻 LA MUSIQUE : synthés graves et cordes, tendue
      musique: {
        tempo: 92, volume: 0.42, nappe: 0.055, violoncelles: 0.09, cuivres: 0.015, pulsation: 0.11, tambours: 0.4, choeur: 0.02, cymbales: 0.025,
        braam: { fort: 0.14, duree: 4 },
        accords: [
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] },
          { nom: "la bémol", notes: ["Ab1", "Eb2", "Ab2", "C3"] }, { nom: "mi bémol", notes: ["Eb2", "Bb2", "Eb3", "G3"] },
          { nom: "do mineur", notes: ["C2", "G2", "C3", "Eb3"] }, { nom: "fa mineur", notes: ["F1", "C2", "F2", "Ab2"] },
          { nom: "la bémol", notes: ["Ab1", "Eb2", "Ab2", "C3"] }, { nom: "sol", notes: ["G1", "D2", "G2", "B2"] },
        ],
        melodie: [
          [[0, "G4", 6]], [[0, "Eb4", 3], [3, "F4", 3]], [[0, "C5", 6]], [[0, "Bb4", 4], [4, "G4", 2]],
          [[0, "G4", 3], [3, "Ab4", 3]], [[0, "C5", 4], [4, "Eb5", 2]], [[0, "D5", 6]], [[0, "B4", 6]],
        ],
      },
    },
  });
})();
