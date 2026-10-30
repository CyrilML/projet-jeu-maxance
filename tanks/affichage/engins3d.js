// 🛠️ LES SOLDATS ET LES ENGINS EN 3D : l'atelier (étape 61)
//
//   - le SOLDAT : un treillis de camouflage, un gilet, un casque, un sac à dos, une arme ; des jambes et des bras qui
//     se balancent quand il marche ; un brassard de la couleur de son équipe ; et pour toi, un PARACHUTE ;
//   - le 4x4 À MITRAILLEUSE (comme un véhicule militaire léger) : une caisse carrée, un arceau, une mitrailleuse sur
//     tourelle, 4 grosses roues ;
//   - l'HÉLICOPTÈRE TIGRE : un fuselage fin, deux places l'une derrière l'autre, des petites ailes avec les bombes,
//     le grand rotor (4 pales) et le petit rotor de queue ;
//   - l'AVION DE CHASSE RAFALE : une aile en triangle (« delta »), des petits plans devant (les « canards »), une dérive,
//     un cockpit en bulle, les missiles sous les ailes ;
//   - le DRONE : une croix à 4 hélices ;
//   - (étape 62) le BATEAU DE GUERRE : une coque pointue à l'avant (une forme dessinée vue de dessus, puis « tirée » vers
//     le haut), un pont, une cabine avec ses vitres, un mât avec un radar, et un canon sur tourelle à l'avant ;
//   - (étape 62) le PORTAIL : un grand anneau lumineux posé sur un socle de pierre, avec un tourbillon dedans.
// Étape 70 : « plus réalistes ». Le 4x4 devient un vrai véhicule blindé léger (avec l'INTÉRIEUR qu'on voit par les
// vitres : sièges, tableau de bord, volant, pilote) ; l'hélico, l'avion, le bateau, le sous-marin, l'avion de
// transport et la DCA ont leurs vraies formes et beaucoup plus de détails. Les pièces sont fabriquées avec la boîte à
// outils (outils3d.js) et SOUDÉES par matière : plus de détails, mais moins d'objets à dessiner.
// Étape 74 : le SOLDAT est refait (« chair et os », un vrai équipement, un visage, les mains sur la corde pendant la
// descente) et il sert aussi de FIGURINE (immobile) pour les pilotes, les mitrailleurs et les passagers des engins.
// Étape 76 : le Tigre, le Rafale, le drone, les chasseurs ennemis et l'avion de transport sont refaits « le plus beau
// possible » dans leur propre atelier, affichage/avions3d.js (ce fichier lui prête ses outils : le pilote, la figurine…).
// Demande 88 : le soldat ne tient plus « le » fusil de tout le monde, mais SA vraie arme, fabriquée par l'armurier
// (affichage/armes3d.js) : la tienne avec ses pièces, et pour l'ordinateur une arme tirée au sort selon son camp. Ses
// mains vont sur la poignée et le garde-main de CETTE arme, et le haut de son corps tourne un peu (épaule gauche en avant).
// ✍️ Demande 114 (« fais des maquettes pour les personnages ») : chaque CLASSE se reconnaît à son équipement (l'Assaut et
// son gilet lourd, l'Ingénieur et sa ceinture à outils, l'Éclaireur et son chapeau de brousse, le Médecin et ses brassards
// à croix rouge), les visages changent (5 barbes), les doigts se replient sur l'arme ; et les gestes sont plus naturels :
// les hanches roulent à chaque pas, l'arme se balance en courant, la position de tir (genoux un peu pliés, la joue sur la
// crosse), le bras libre qui se balance avec un pistolet. Toujours 2 dessins par soldat ; la vitrine des personnages
// (affichage/personnages.js) montre les mêmes maquettes.
// ✍️ Demande 126 (« fais des maquettes de soldats, je veux qu'ils ressemblent à des humains ») : le corps n'est plus un
// assemblage de blocs, mais une PEAU sculptée d'un seul morceau par membre (le sculpteur, affichage/corps3d.js) : le
// tronc, les bras, les jambes, le cou, des mains à 5 doigts, des bottes, un visage sculpté (nez, lèvres, paupières,
// sourcils). Les points des genoux, des coudes, des épaules, de la taille et du cou sont accrochés à DEUX os à la fois :
// ils plient en douceur. Toujours 2 dessins par soldat, et la carte graphique a 3 à 4 fois moins de points à déplacer
// (les points partagés entre deux triangles ne sont plus recopiés).
// ✍️ Demande 128 (« les personnages ressemblent à des jouets ») : chaque classe a son SKIN, d'après les images d'Iron Wolf Studio
// (refaites en 3D, pas copiées) : l'Assaut en gris urbain et cagoule noire, le Médecin tout sable avec son foulard et son
// écusson blanc à croix rouge, l'Éclaireur en multicam, l'Ingénieur en noir avec son MASQUE À GAZ et sa roquette dans le
// dos ; l'ennemi a les mêmes formes à ses couleurs. Et contre l'effet « jouet » : l'OMBRE DANS LES CREUX, mesurée une fois
// quand la forme est fabriquée. En 1916, la CAPOTE à pans du poilu, le havresac, la gamelle et le bidon rond.
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Engins3D = (function () {
  const M = {};
  function mats() {
    if (M.noir) return M;
    M.noir = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.6, metalness: 0.3 });
    M.metal = new THREE.MeshStandardMaterial({ color: 0x5b6066, roughness: 0.45, metalness: 0.7 });
    M.pneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.95 });
    M.verre = new THREE.MeshPhysicalMaterial({ color: 0x1e3446, roughness: 0.05, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.75 });
    M.peau = new THREE.MeshStandardMaterial({ color: 0xc99a74, roughness: 0.7 });
    M.gris = new THREE.MeshStandardMaterial({ color: 0x7c848b, roughness: 0.5, metalness: 0.4 });
    M.toile = new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.95, side: THREE.DoubleSide });
    M.brule = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1 });
    M.phare = new THREE.MeshStandardMaterial({ color: 0xeef2f2, metalness: 0.4, roughness: 0.1, emissive: 0xc8d0d2, emissiveIntensity: 0.4 });
    return M;
  }
  const boite = (lx, ly, lz, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), m);
    b.position.set(x, y, z);
    b.castShadow = true;
    return b;
  };
  const cyl = (r1, r2, l, m, n) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, l, n || 12), m);
    c.castShadow = true;
    return c;
  };

  // ------------------------------------------------------------------ le soldat (refait à l'étape 63, puis à l'étape 74)
  // Un vrai petit squelette, comme dans les jeux : chaque morceau du corps est accroché à une ARTICULATION (un « os »
  // qui peut tourner) : les hanches et les genoux, les épaules et les coudes, le dos, le cou. Pour marcher, on fait
  // tourner les hanches et plier les genoux ; pour tenir le fusil, on calcule où mettre les coudes pour que les mains
  // tombent pile sur l'arme (c'est la « cinématique inverse » : on part de la main et on remonte jusqu'à l'épaule).
  // ✍️ Étape 74 (« plus beau ») : un vrai équipement de soldat moderne, avec des formes ARRONDIES (des « galets » : des
  // boîtes aux coins ronds, des membres qui s'affinent vers le poignet et la cheville) :
  //   - le CASQUE avec sa housse camouflée, son bandeau de la couleur de l'équipe, les lunettes de protection relevées,
  //     le support de jumelles de nuit, les rails, le casque radio sur les oreilles ;
  //   - un VISAGE : la peau (4 teintes), la mâchoire, le nez, les yeux (le blanc et la pupille), les sourcils ;
  //   - le GILET porte-plaques (plaques devant et derrière, ceinture large, bretelles) avec ses POCHES à chargeurs, la
  //     poche radio, la poche de carte ; le SAC À DOS avec son rabat, ses poches, le duvet roulé et l'antenne radio ;
  //   - les GENOUILLÈRES, les coudières, les BOTTES (avec semelle), les GANTS (et le pouce), le brassard de l'équipe
  //     autour du bras ;
  //   - le FUSIL (crosse, poignée, chargeur courbe, garde-main à rails, canon, cache-flamme, viseur).
  // Et pour que ce soit rapide malgré tous ces détails : la peau du soldat est « CHAIR ET OS » (un « skinning », comme
  // dans les vrais jeux) : TOUTES les pièces sont soudées en UNE forme, et chaque point de la forme sait à quel os il est
  // accroché ; c'est la carte graphique qui les déplace avec les os. Résultat : 2 dessins par soldat (le tissu camouflé et
  // le reste), au lieu d'une vingtaine. Et cette forme est fabriquée une seule fois, partagée par tous les soldats.
  // Deux versions : en DÉTAIL quand il est près de la caméra, et en SIMPLE quand il est loin.
  const OT = Tanks.Outils3D;
  const matsEquipe = {};
  const PEAUX = [0xc8956c, 0xe2b896, 0x9c6b48, 0x6b4630]; // (4 couleurs de peau)
  const MQ = () => Tanks.CONFIG.realisme.soldats.maquettes; // (demande 114 : les maquettes des classes)
  function matsSoldat(equipe) {
    if (matsEquipe[equipe]) return matsEquipe[equipe];
    const E = Tanks.CONFIG.equipes[equipe], U = Tanks.CONFIG.realisme.soldats.uniformes, UE = U[equipe] || U.bleus;
    const coul = (h) => new THREE.Color(h).getHex();
    matsEquipe[equipe] = {
      // (demande 92) le tissu camouflé est peint par le tailleur (affichage/uniformes.js) : woodland ou désert, ripstop,
      // plis, coutures, filet du casque, boue
      tenue: Tanks.Uniformes.habiller(new THREE.MeshStandardMaterial({ roughness: 0.93 }), "tenue", equipe),
      // (étape 74) tout le reste dans UNE matière : chaque pièce garde sa couleur dans ses sommets
      // (demande 92 : et sa MATIÈRE : la peau, le nylon à sangles, le cuir… le tailleur s'en sert)
      teinte: Tanks.Uniformes.habiller(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.03 }), "teinte", equipe),
      arme: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.55 }),
      couleurs: {
        gilet: coul(UE.equipement), sac: new THREE.Color(UE.equipement).multiplyScalar(0.9).getHex(), rabat: new THREE.Color(UE.equipement).multiplyScalar(0.84).getHex(),
        sangle: 0x35342a, bottes: /^bleus/.test(equipe) ? 0x3e3226 : 0x8a6e4c, semelle: 0x1d1a17, gants: 0x2b2b27, protege: 0x2e3029, lacets: 0x2a241c,
        arme: 0x232528, polymere: 0x2d2c28, verre: 0x0d1418, blanc: 0xe6e1d8, pupille: 0x1c140f, sourcils: 0x3a2a1c, noir: 0x1b1c1c, radio: 0x2c2f2b,
        metal: 0x6c6c66, levres: 0x8d5a4a, olive: 0x4a5532,
        // (demande 114) l'équipement des classes : la croix rouge et le brassard blanc du médecin, les outils de l'ingénieur
        croix: new THREE.Color(MQ().croix).getHex(), soin: new THREE.Color(MQ().brassardSoin).getHex(), outils: new THREE.Color(MQ().outils).getHex(),
        cuir: 0x5a3f28, bois: 0x7a5534, genie: new THREE.Color(Tanks.CONFIG.classes.ingenieur.couleur).getHex(),
        marque: new THREE.Color(E.marque).getHex(), marqueToi: new THREE.Color(E.marque).multiplyScalar(1.35).getHex(),
        casqueBord: new THREE.Color(E.camouflage[2]).getHex(), tenue: coul(UE.fond),
        // ✍️ (demande 115) le CASQUE de l'édition (« adrian » à cimier, « kressien » à couvre-nuque… ou le moderne) et sa couleur
        casqueStyle: ((Tanks.CONFIG.edition.modeles.casques || {})[String(equipe).split("~")[0]]) || "moderne",
        casqueAcier: UE.casque ? coul(UE.casque) : /^bleus/.test(equipe) ? 0x6c7c90 : 0x5a5e54, // (demande 115 : la couleur du casque de l'édition, sinon l'acier de 1916)
        molletieres: new THREE.Color(UE.fond).multiplyScalar(0.82).getHex(), // (demande 126 : elle était restée dans le commentaire)
        // ✍️ (demande 128) les couleurs du SKIN de sa classe (les gants, les protections, les bottes, le casque, la cagoule…)
        ...(UE.skin ? skinCouleurs(UE.skin, coul, E) : {}),
      },
      skin: UE.skin || null,
    };
    envoyerTissu(matsEquipe[equipe]);
    return matsEquipe[equipe];
  }
  // (demande 128) envoyer TOUT DE SUITE le tissu d'un nouveau camp de dessin à la carte graphique (pendant la préparation,
  // avant la bataille) : sinon c'est la 1re image où l'on voit ce skin qui paie l'envoi (un à-coup en plein combat)
  function envoyerTissu(M) {
    const R = Tanks.Scene && Tanks.Scene.rendu;
    if (!R || !R.initTexture) return;
    for (const m of [M.tenue, M.teinte]) for (const t of [m.userData.tissuTex, m.userData.equipTex]) if (t && !t.userData.envoye) (R.initTexture(t), (t.userData.envoye = true));
  }
  function skinCouleurs(S, coul, E) {
    const eq = new THREE.Color(S.equipement);
    return { gants: coul(S.gants), protege: coul(S.gants2 || S.gants), genouillere: coul(S.protections), bottes: coul(S.bottes), sangle: coul(S.sangles),
      sac: eq.clone().multiplyScalar(0.88).getHex(), rabat: eq.clone().multiplyScalar(0.8).getHex(), casqueSkin: coul(S.casqueCouleur), visage: coul(S.visageCouleur),
      etui: coul(S.etuiCuisse || "#1f2022"), caoutchouc: 0x17181a, filtre: 0x3a3d38, roquette: 0x4f5a36, ogive: 0x5b6440, hublot: 0x2c3a42,
      // (les marques de l'équipe un peu moins vives : toujours lisibles, mais moins « jouet »)
      marque: new THREE.Color(E.marque).lerp(new THREE.Color(0x6a6a66), 0.3).multiplyScalar(0.8).getHex(), marqueToi: new THREE.Color(E.marque).lerp(new THREE.Color(0x6a6a66), 0.1).getHex() };
  }
  // ✍️ (demande 128) LE SKIN d'un soldat : dans les éditions de « realisme.soldats.skins », un soldat des Bleus ou des Rouges
  // qui a une classe porte la tenue de sa classe : son « camp de dessin » devient « bleus#assaut »… (une tenue de la
  // boutique, « bleus~ghillie », garde le dessus : elle n'est pas touchée).
  function habit(equipe, classe) {
    const SK = Tanks.CONFIG.realisme.soldats.skins;
    if (!SK || !classe || !SK.editions.includes(Tanks.CONFIG.edition.id) || !SK.camps[equipe]) return equipe;
    return Tanks.CONFIG.realisme.soldats.uniformes[equipe + "#" + classe] ? equipe + "#" + classe : equipe;
  }
  // Un GALET : une boîte aux coins arrondis (une sphère « gonflée » vers les coins). rond : 0,15 = presque une boîte,
  // 1 = une boule.
  function galet(lx, ly, lz, rond, seg) {
    const g = new THREE.SphereGeometry(1, seg || 12, Math.max(6, Math.round((seg || 12) * 0.7))), p = g.attributes.position, e = rond === undefined ? 0.35 : rond;
    for (let i = 0; i < p.count; i++) {
      const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
      p.setXYZ(i, (f(p.getX(i)) * lx) / 2, (f(p.getY(i)) * ly) / 2, (f(p.getZ(i)) * lz) / 2);
    }
    g.computeVertexNormals();
    return g;
  }
  // Un MEMBRE : un tube aux bouts arrondis, plus gros en haut (r1) qu'en bas (r2), de y = 0 vers le bas (longueur l).
  function membre(r1, r2, l, seg) {
    const pts = [];
    for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.sin(a) * r2, -l + r2 - Math.cos(a) * r2)); }
    for (let k = 0; k <= 4; k++) { const a = Math.PI / 2 + (k / 4) * (Math.PI / 2); pts.push(new THREE.Vector2(Math.sin(a) * r1, -r1 * 0.6 - Math.cos(a) * r1)); }
    return new THREE.LatheGeometry(pts, seg || 12);
  }

  // Les longueurs (en m) : un soldat de 1,80 m.
  const OS = { hanche: 0.92, cuisse: 0.44, tibia: 0.44, bras: 0.29, avantBras: 0.27, ecartHanches: 0.1, ecartEpaules: 0.2, dos: 0.98, epaules: 0.44 };

  // Les OS : un arbre d'articulations (le corps → les hanches → les genoux ; le corps → le dos → le cou, les épaules →
  // les coudes). Ils sont tous dans la position « au garde-à-vous ».
  function os() {
    const corps = new THREE.Bone(), dos = new THREE.Bone(), cou = new THREE.Bone();
    dos.position.y = OS.dos;
    cou.position.y = 0.5;
    corps.add(dos);
    dos.add(cou);
    const jambes = [], genoux = [], epaules = [], coudes = [];
    for (const z of [-OS.ecartHanches, OS.ecartHanches]) {
      const h = new THREE.Bone(), g = new THREE.Bone();
      h.position.set(0, OS.hanche, z);
      g.position.y = -OS.cuisse;
      h.add(g);
      corps.add(h);
      jambes.push(h);
      genoux.push(g);
    }
    for (const z of [OS.ecartEpaules, -OS.ecartEpaules]) { // (la droite d'abord : z > 0)
      const e = new THREE.Bone(), c = new THREE.Bone();
      e.position.set(0, OS.epaules, z);
      c.position.y = -OS.bras;
      e.add(c);
      dos.add(e);
      epaules.push(e);
      coudes.push(c);
    }
    const liste = [corps, dos, cou, jambes[0], genoux[0], jambes[1], genoux[1], epaules[0], coudes[0], epaules[1], coudes[1]];
    return { corps, dos, cou, jambes, genoux, epaules, coudes, liste };
  }

  // Les PIÈCES du corps, accrochées à chaque os. Chaque pièce : [os, forme, x, y, z, couleur | "tenue", (rotation)].
  // detail = true : la belle version ; false : la version simple (moins de pièces, moins de points).
  // ✍️ (demande 92, « réalisme total ») plus de vrais détails : la poche de cuisse avec son rabat, le holster sur la
  // cuisse droite, les genouillères avec leur sangle, le bas du pantalon replié sur la botte, les LACETS et la languette
  // des bottes, le bout renforcé ; le gilet porte-plaques avec ses porte-chargeurs à rabat, la poche administrative, le
  // garrot sur la bretelle, la RADIO dans sa poche avec son antenne, la poche à grenade (et sa grenade), la trousse de
  // secours, la poche de vidage ; le col de la veste ; le casque avec son contrepoids, le micro du casque radio ; les
  // lèvres, les coques des gants. Et le VISAGE est peint : les yeux un peu creusés, les joues plus roses, la barbe de 3 jours.
  // Chaque pièce dit aussi sa MATIÈRE (la peau, le nylon, le cuir…) : le tailleur (affichage/uniformes.js) s'en sert.
  // ✍️ (demande 114) classe : "assaut", "ingenieur", "eclaireur" ou "medecin" (son équipement à lui, voir plus bas,
  // « l'équipement de sa classe ») ; rien : le soldat de base (les pilotes, les passagers, les silhouettes).
  // ✍️ (demande 115) l'équipement d'AUTREFOIS (édition 1916) : pas de gilet porte-plaques, de radio, de gants ni de
  // genouillères ; un ceinturon de cuir et ses cartouchières, les bandes molletières autour des mollets
  const ANCIEN = () => Tanks.CONFIG.edition.modeles.equipementModerne === false;
  function pieces(equipe, detail, peau, joueur, classe, barbe) {
    const MS = matsSoldat(equipe), K = MS.couleurs, L = [], s = detail ? 12 : 7, ancien = ANCIEN();
    const S = ancien ? null : MS.skin; // ✍️ (demande 128) le skin de sa classe (ou rien : l'uniforme de son camp)
    const KP = S ? K.genouillere : K.protege, gros = S ? S.grosses || 1 : 1; // (les genouillères et coudières du skin, et leur taille)
    const p = (osNom, geo, x, y, z, couleur, rx, ry, rz) => L.push({ os: osNom, geo, x, y, z, couleur, rx: rx || 0, ry: ry || 0, rz: rz || 0 });
    const mat = (n) => (dernier().mat = n); // (demande 128 : la MATIÈRE d'une pièce, quand sa couleur ne suffit pas à la dire)
    const pc = (osNom, geo, x, y, z, couleur, rx, ry, rz) => p(osNom, geo, x, y, z, couleur, rx, ry, rz);
    const dernier = () => L[L.length - 1];
    const peint = (f) => (dernier().peint = f); // (des nuances peintes sur la pièce, selon la place de chaque point)
    // les matières (1 = la peau, 2 = le gilet à sangles MOLLE, 3 = le cuir et le caoutchouc, 4 = le nylon uni)
    L.matieres = new Map([[peau, 1], [K.sac, 4], [K.rabat, 4], [K.sangle, 4], [K.radio, 4], [K.gilet, S && S.giletMotif === "numerique" ? 5 : 2], [K.bottes, 3], [K.semelle, 3], [K.gants, 3], [K.protege, 3], [K.lacets, 3], [K.soin, 4], [K.croix, 4], [K.cuir, 3], [K.verre, 7]]);
    if (S) for (const [c, m] of [[K.genouillere, 9], [K.casqueSkin, 9], [K.visage, 6], [K.etui, 9], [K.caoutchouc, 8], [K.roquette, 9], [K.ogive, 9]]) if (!L.matieres.has(c)) L.matieres.set(c, m);
    const anneau = (r, e, n) => new THREE.TorusGeometry(r, e, 4, n || (detail ? 14 : 8));
    // ✍️ (demande 126, « qu'ils ressemblent à des humains ») le CORPS est sculpté d'un seul morceau par membre (le sculpteur,
    // affichage/corps3d.js) : chaque point dit à quels os il est accroché (« poids ») pour que les genoux, les coudes,
    // les épaules, la taille et le cou plient EN DOUCEUR, comme une vraie peau.
    const C3 = Tanks.Corps3D;
    const poids = (f) => (dernier().poids = f);
    // les jambes (0 : gauche, z < 0 ; 1 : droite)
    for (const k of [0, 1]) {
      const cote = k ? 1 : -1, h = "jambe" + k, g = "genou" + k;
      // la jambe du pantalon : de la hanche (dans le bassin) jusqu'en haut de la botte (1916 : jusqu'aux bandes molletières)
      const basses = S && S.basses; // (demande 128 : des chaussures de randonnée BASSES : le pantalon descend plus bas)
      pc(h, C3.jambe(cote, detail, ancien ? -0.58 : basses ? -0.79 : -0.69), 0, 0, 0, "tenue");
      poids(C3.deuxJoints("corps", h, g, 0.085, -0.06, -0.38, -0.5, 0.35));
      if (detail && !ancien) {
        pc(h, galet(0.075, 0.13, 0.04, 0.4, 8), 0.0, -0.21, cote * 0.084, "tenue"); // la poche de cuisse
        pc(h, galet(0.082, 0.032, 0.048, 0.35, 8), 0.0, -0.14, cote * 0.087, "tenue"); // son rabat
        if (k === 1) { // le HOLSTER sur la cuisse droite, avec ses 2 sangles autour de la cuisse
          pc(h, galet(0.075, 0.17, 0.045, 0.3, 8), 0.025, -0.15, 0.108, K.polymere);
          for (const y of [-0.09, -0.22]) pc(h, anneau(0.093 - y * 0.06, 0.011), 0, y, 0, K.sangle, Math.PI / 2);
        }
        if (k === 0 && S && S.etuiCuisse) { // ✍️ (demande 128) l'éclaireur : le porte-chargeurs NOIR sur la cuisse gauche, et ses sangles
          pc(h, galet(0.085, 0.16, 0.05, 0.3, 8), 0.02, -0.17, -0.105, K.etui);
          for (const x of [-0.01, 0.04]) pc(h, galet(0.034, 0.06, 0.022, 0.3, 6), x, -0.105, -0.128, K.etui); // (les rabats des 2 chargeurs)
          for (const y of [-0.1, -0.24]) pc(h, anneau(0.093 - y * 0.06, 0.012), 0, y, 0, K.etui, Math.PI / 2);
          pc(h, galet(0.02, 0.2, 0.03, 0.3, 4), 0.0, 0.0, -0.1, K.etui); // (la sangle qui monte à la ceinture)
        }
      }
      if (ancien) { // (demande 115) les bandes molletières : enroulées en spirale (peintes en biais), jusqu'à la chaussure
        pc(g, C3.loft([{ y: -0.1, xf: 0.06, xb: 0.066, z: 0.06 }, { y: -0.16, xf: 0.057, xb: 0.07, z: 0.059 }, { y: -0.26, xf: 0.052, xb: 0.06, z: 0.053 }, { y: -0.35, xf: 0.047, xb: 0.05, z: 0.047 }], detail ? 14 : 7, detail ? 2 : 1), 0, 0, 0, K.molletieres);
        if (detail) peint((x, y, z) => 0.86 + 0.14 * Math.abs(Math.sin((y * 3 + Math.atan2(z, x) * 0.03) * 38)));
      } else if (S) { // ✍️ (demande 128) la GENOUILLÈRE épaisse : le coussin, et la coque de plastique dur par-dessus
        pc(g, galet(0.075 * gros, 0.16 * gros, 0.13 * Math.min(1.2, gros), 0.42, detail ? 10 : 6), 0.06 + 0.012 * (gros - 1), -0.03, 0, KP);
        pc(g, galet(0.04 * gros, 0.115 * gros, 0.1 * Math.min(1.2, gros), 0.5, detail ? 10 : 6), 0.088 + 0.03 * (gros - 1), -0.03, 0, KP);
        peint(() => 0.82);
      } else pc(g, galet(0.07, 0.14, 0.12, 0.42, detail ? 10 : 6), 0.065, -0.03, 0, K.protege); // la genouillère
      if (detail && !ancien) pc(g, anneau(0.064 + (gros - 1) * 0.02, 0.01), 0, -0.1, 0, K.sangle, Math.PI / 2); // sa sangle
      const bas = ancien || basses; // (1916 : la chaussure montante ; demande 128 : la chaussure de randonnée basse)
      pc(g, C3.tigeBotte(detail, ancien ? -0.33 : basses ? -0.34 : -0.22), 0, 0, 0, K.bottes); // la tige de la botte
      if (detail) {
        if (!ancien) pc(g, anneau(0.064, 0.016), 0.0, basses ? -0.345 : -0.228, 0, "tenue", Math.PI / 2); // le bas du pantalon, replié sur la botte
        pc(g, galet(0.022, bas ? 0.06 : 0.12, 0.05, 0.4, 6), 0.055, bas ? -0.37 : -0.32, 0, K.bottes); // la languette
        for (let n = 0; n < (bas ? 2 : 4); n++) pc(g, galet(0.012, 0.008, 0.06, 0.3, 4), 0.06 + n * 0.002, -0.27 - n * 0.032 - (bas ? 0.07 : 0), 0, K.lacets, 0, 0, 0.12); // les LACETS
        if (basses) pc(g, galet(0.25, 0.04, 0.112, 0.3, 8), 0.1, -0.44, 0, K.semelle); // (la semelle crantée qui remonte sur les côtés)
      }
      pc(g, C3.pied(detail), 0.03, -0.43, 0, K.bottes); // le pied (le talon, le cou-de-pied, le bout arrondi)
      if (detail) peint((x, y) => (y > 0.02 ? 0.88 : 1)); // (le dessus, frotté, plus sombre)
      pc(g, galet(0.29, 0.03, 0.108, 0.25, detail ? 10 : 6), 0.1, -0.468, 0, K.semelle); // la semelle
      if (detail) pc(g, galet(0.07, 0.016, 0.11, 0.3, 6), -0.015, -0.452, 0, K.semelle); // le talon
    }
    // le bassin, le buste, le gilet porte-plaques, le sac
    // (demande 126) le TRONC d'un seul morceau : le bassin et les fesses suivent les hanches (l'os du corps), la poitrine
    // suit le dos ; entre les deux, la taille se tord et se penche en douceur
    pc("dos", C3.tronc(detail), 0, 0, 0, "tenue");
    poids(C3.melange("corps", "dos", -0.02, 0.16));
    pc("dos", galet(0.285, 0.07, 0.385, 0.3, s), 0, 0.0, 0, ancien ? K.cuir : K.gilet); // le ceinturon de combat (demande 115 : en cuir, en 1916)
    if (ancien) { // (demande 115) 1916 : les 3 cartouchières de cuir sur le ventre, les brelages, le havresac et sa couverture roulée
      for (const z of [-0.1, 0, 0.1]) pc("dos", galet(0.06, 0.08, 0.085, 0.3, 6), 0.165, 0.03, z, K.cuir);
      for (const z of [-0.1, 0.1]) pc("dos", galet(0.27, 0.04, 0.05, 0.3, 6), 0, 0.445, z, K.cuir);
      pc("dos", galet(0.19, 0.3, 0.3, 0.3, s), -0.24, 0.27, 0, K.sac);
      pc("dos", new THREE.TorusGeometry(0.15, 0.04, 6, 12, Math.PI), -0.3, 0.3, 0, K.molletieres, 0, Math.PI / 2, 0); // la couverture roulée en fer à cheval
      pc("dos", galet(0.05, 0.11, 0.08, 0.4, 6), -0.12, 0.02, -0.19, K.metal); // le bidon
      if (detail) pc("dos", galet(0.07, 0.1, 0.06, 0.4, 6), -0.05, 0.03, 0.2, K.sac); // la musette
      // ✍️ (demande 129, l'édition 1944) au ceinturon, dans les deux camps : le COUTEAU DE COMBAT dans son fourreau de cuir
      // (sur la hanche droite, le manche qui dépasse) et la PELLE-BÊCHE pliante dans sa housse de toile (derrière, à gauche,
      // le manche vers le haut). Accrochés au bassin (l'os du corps) : ils suivent les hanches. Quelques pièces seulement,
      // soudées avec le reste du soldat (aucun dessin en plus).
      if (Tanks.CONFIG.edition.id === "1944") {
        pc("corps", galet(0.032, 0.19, 0.04, 0.35, detail ? 6 : 4), -0.035, 0.87, 0.212, K.cuir, 0.12); // le fourreau
        if (detail) {
          pc("corps", new THREE.CylinderGeometry(0.013, 0.015, 0.085, 6), -0.035, 1.005, 0.205, K.bois, 0.12); // le manche du couteau
          pc("corps", galet(0.05, 0.012, 0.03, 0.3, 4), -0.035, 0.962, 0.207, K.metal); // sa garde
        }
        pc("corps", galet(0.03, 0.2, 0.16, 0.35, detail ? 6 : 4), -0.2, 0.84, -0.085, K.sac, 0, 0, 0.1); // la housse de la pelle (la lame)
        pc("corps", new THREE.CylinderGeometry(0.016, 0.016, detail ? 0.2 : 0.16, detail ? 6 : 4), -0.215, 1.03, -0.085, K.bois, 0, 0, 0.1); // son manche
        if (detail) pc("corps", galet(0.035, 0.025, 0.05, 0.3, 4), -0.226, 1.13, -0.085, K.bois); // le bout du manche
      }
      const CP = Tanks.CONFIG.edition.modeles.capote;
      if (CP) capote(pc, dernier, K, detail, equipe, CP, poids, peint);
    } else {
    // (demande 128 : avec un skin, le gilet est plus ÉPAIS et plus massif, et le sac est un petit sac d'assaut)
    const ep = S ? 0.095 : 0.075, xp = S ? 0.138 : 0.13;
    pc("dos", galet(ep, 0.33, 0.3, 0.22, s), xp, 0.27, 0, K.gilet); // la plaque de devant
    pc("dos", galet(ep, 0.33, 0.3, 0.22, s), -xp, 0.27, 0, K.gilet); // la plaque de derrière
    pc("dos", galet(S ? 0.29 : 0.27, 0.16, S ? 0.41 : 0.395, 0.3, s), 0, 0.16, 0, K.gilet); // la large ceinture du gilet
    for (const z of [-0.1, 0.1]) pc("dos", galet(S ? 0.3 : 0.27, 0.055, 0.075, 0.3, 6), 0, 0.445, z, K.gilet); // les bretelles
    if (S) pc("dos", galet(0.075, 0.31, 0.25, 0.3, s), -0.218, 0.25, 0, K.sac); // (demande 128 : pas de gros sac, comme sur les images : la poche à eau plate, sur la plaque de dos)
    else pc("dos", galet(0.21, 0.36, 0.3, 0.3, s), -0.25, 0.27, 0, K.sac); // le sac à dos
    }
    if (detail && !ancien) {
      pc("dos", anneau(0.068, 0.022), 0.0, 0.49, 0, "tenue", Math.PI / 2); // le col de la veste
      for (const z of [-0.095, 0, 0.095]) {
        pc("dos", galet(0.06, 0.12, 0.086, 0.3, 8), 0.188, 0.165, z, K.gilet); // 3 porte-chargeurs
        pc("dos", galet(0.066, 0.032, 0.09, 0.3, 6), 0.19, 0.232, z, K.rabat); // et leurs rabats
      }
      pc("dos", galet(0.045, 0.085, 0.16, 0.3, 8), 0.175, 0.33, 0, K.rabat); // la poche administrative
      pc("dos", galet(0.012, 0.045, 0.06, 0.3, 6), 0.2, 0.34, 0.05, joueur ? K.marqueToi : K.marque); // l'écusson de l'équipe
      pc("dos", new THREE.CylinderGeometry(0.019, 0.019, 0.1, 8), 0.135, 0.39, -0.1, K.noir, 0.15, 0, 0); // le garrot, sur la bretelle
      // la RADIO, dans sa poche sur le côté gauche, avec son antenne souple
      pc("dos", galet(0.07, 0.13, 0.065, 0.3, 8), -0.04, 0.22, -0.212, K.gilet);
      pc("dos", galet(0.055, 0.06, 0.05, 0.25, 6), -0.04, 0.31, -0.212, K.radio);
      pc("dos", new THREE.CylinderGeometry(0.005, 0.007, S ? 0.26 : 0.42, 4), -0.06, S ? 0.45 : 0.53, -0.225, K.noir, -0.12, 0, 0.18);
      // la poche à grenade (côté droit), avec le haut de la grenade qui dépasse
      pc("dos", galet(0.065, 0.085, 0.065, 0.35, 8), 0.06, 0.07, 0.215, K.gilet);
      pc("dos", new THREE.SphereGeometry(0.03, 8, 6), 0.06, 0.12, 0.215, K.olive);
      pc("dos", galet(0.08, 0.1, 0.12, 0.35, 8), -0.14, 0.02, 0.13, K.rabat); // la trousse de secours (dans le dos, à droite)
      pc("dos", galet(0.09, 0.12, 0.08, 0.5, 8), -0.08, -0.03, -0.19, K.sac); // la poche de vidage (à gauche)
      pc("dos", galet(0.05, 0.03, 0.06, 0.3, 6), 0.15, 0.0, 0.0, K.metal); // la boucle du ceinturon
      if (S) { // (demande 128) la poche à eau : ses 2 sangles, son tuyau qui passe sur l'épaule, 2 poches de dos
        for (const z of [-0.08, 0.08]) pc("dos", galet(0.012, 0.28, 0.024, 0.3, 4), -0.257, 0.25, z, K.sangle);
        pc("dos", new THREE.CylinderGeometry(0.007, 0.007, 0.3, 5), -0.05, 0.42, 0.12, K.noir, 0, 0, 1.25);
        for (const z of [-0.075, 0.075]) pc("dos", galet(0.05, 0.1, 0.07, 0.35, 6), -0.25, 0.11, z, K.rabat);
      } else {
      pc("dos", galet(0.22, 0.07, 0.31, 0.3, 8), -0.25, 0.465, 0, K.rabat); // le rabat du sac
      for (const z of [-0.17, 0.17]) pc("dos", galet(0.11, 0.16, 0.06, 0.35, 8), -0.26, 0.2, z, K.gilet); // les poches du sac
      pc("dos", new THREE.CylinderGeometry(0.058, 0.058, 0.36, 10), -0.24, 0.53, 0, 0x3e4631, Math.PI / 2); // le duvet roulé
      }
      if (!S) pc("dos", new THREE.CylinderGeometry(0.006, 0.008, 0.55, 4), -0.33, 0.7, -0.1, K.sangle, 0, 0, 0.15); // l'antenne radio
      pc("dos", galet(0.05, 0.1, 0.07, 0.4, 6), -0.15, 0.04, -0.07, K.sac); // la gourde
    }
    // la tête (demande 93 : une TÊTE SCULPTÉE, voir « tete » plus bas)
    tete(pc, peint, dernier, K, peau, detail, joueur, classe, barbe, S);
    // les bras (0 : droit, z > 0 ; 1 : gauche)
    for (const k of [0, 1]) {
      const cote = k ? -1 : 1, e = "epaule" + k, c = "coude" + k;
      // (demande 126) le bras d'un seul morceau : le haut de l'épaule suit un peu le dos, le coude plie en douceur
      pc(e, C3.bras(cote, detail), 0, 0, 0, "tenue");
      poids(C3.deuxJoints("dos", e, c, 0.085, -0.04, -0.24, -0.335, 0.4));
      pc(e, new THREE.CylinderGeometry(0.066, 0.064, 0.07, s, 1, true), 0, -0.1, 0, k === 0 && joueur ? K.marqueToi : K.marque); // ✍️ le brassard
      if (detail && classe !== "medecin") pc(e, galet(0.06, 0.07, 0.022, 0.35, 6), 0.0, -0.19, cote * 0.056, "tenue"); // la poche de manche
      const gant = ancien ? peau : K.gants; // (demande 115 : en 1916, pas de gants : les mains nues)
      if (S && S.coudieres) { // ✍️ (demande 128) la COUDIÈRE épaisse (le coussin et sa coque), même de loin
        pc(c, galet(0.065 * gros, 0.09 * gros, 0.095, 0.45, detail ? 8 : 5), -0.04 - 0.01 * (gros - 1), -0.01, 0, KP);
        if (detail) (pc(c, galet(0.03 * gros, 0.065 * gros, 0.07, 0.5, 8), -0.068 - 0.018 * (gros - 1), -0.01, 0, KP), peint(() => 0.8), pc(c, anneau(0.05, 0.008), 0, -0.065, 0, K.sangle, Math.PI / 2));
      } else if (detail && !ancien && !S) pc(c, galet(0.06, 0.075, 0.085, 0.45, 8), -0.035, -0.01, 0, K.protege); // la coudière
      if (!ancien) pc(c, anneau(0.034, 0.011), 0, -OS.avantBras + 0.03, 0, K.gants, Math.PI / 2); // le haut du gant
      else if (detail) pc(c, anneau(0.032, 0.008), 0, -OS.avantBras + 0.025, 0, "tenue", Math.PI / 2); // le bout de la manche
      // (demande 126) la MAIN : le poignet, la paume, le pouce et 4 doigts repliés sur l'arme (corps3d.js)
      pc(c, new THREE.CapsuleGeometry(0.026, 0.035, 2, detail ? 8 : 5), 0, -0.25, 0, gant); // le poignet
      for (const m of C3.main(cote, detail)) pc(c, m.geo, m.x, m.y, m.z, gant, m.rx, m.ry, m.rz);
      if (detail && !ancien) pc(c, galet(0.048, 0.032, 0.012, 0.4, 6), 0.004, -0.335, cote * 0.02, K.protege); // la coque des articulations
    }
    L.detail = detail;
    if (classe) equipementClasse(pc, K, detail, classe, s, anneau, S);
    if (S) equipementSkin(pc, K, detail, S, s, anneau, peint, mat);
    return L;
  }

  // ------------------------------------------------------------------ ✍️ (demande 114) L'ÉQUIPEMENT DE SA CLASSE
  // « Fais des maquettes pour les personnages » : on doit RECONNAÎTRE chaque classe de loin, rien qu'à sa silhouette :
  //   - l'ASSAUT, le plus lourd : des épaulières, des plaques sur les côtés, 2 porte-chargeurs de plus, le col protège-cou
  //     et la protection du bas-ventre ;
  //   - l'INGÉNIEUR : une ceinture de cuir avec ses OUTILS (la clé à molette, le marteau, la pochette de la pince), le
  //     rouleau d'outils sous le sac, le câble enroulé et l'écusson jaune et noir du génie ;
  //   - l'ÉCLAIREUR (le tireur d'élite) : son chapeau de brousse (dans « tete »), les JUMELLES sur la poitrine, et des
  //     lanières de camouflage sur les épaules et le sac (pour casser sa silhouette dans l'herbe) ;
  //   - le MÉDECIN : un BRASSARD BLANC à CROIX ROUGE sur chaque bras, une grande croix sur le sac et les poches de soins.
  // Les pièces les plus fines seulement en détail (de près) : la version simple garde ce qui se voit de loin.
  function equipementClasse(pc, K, detail, classe, s, anneau, S) {
    const B = (lx, ly, lz) => new THREE.BoxGeometry(lx, ly, lz);
    if (classe === "assaut" && ANCIEN()) {
      if (detail) pc("dos", galet(0.04, 0.3, 0.03, 0.3, 4), -0.02, -0.2, 0.2, K.cuir, 0, 0, 0.25); // (demande 115) le fourreau de la baïonnette
    } else if (classe === "assaut") {
      if (!S) for (const k of [0, 1]) pc("epaule" + k, galet(0.15, 0.12, 0.075, 0.45, detail ? 10 : 6), 0, -0.04, (k ? -1 : 1) * 0.045, K.gilet, (k ? -1 : 1) * 0.35, 0, 0); // les épaulières (demande 128 : pas avec son skin)
      for (const z of [-0.19, 0.19]) pc("dos", galet(0.16, 0.19, 0.04, 0.25, s), -0.01, 0.2, z, K.gilet); // les plaques de côté
      for (const z of [-0.16, 0.16]) pc("dos", galet(0.07, 0.12, 0.07, 0.3, detail ? 8 : 5), 0.15, 0.15, z, K.gilet); // 2 porte-chargeurs de plus
      pc("dos", galet(0.05, 0.15, 0.17, 0.35, detail ? 8 : 5), 0.135, -0.13, 0, K.gilet); // la protection du bas-ventre
      if (detail) {
        pc("dos", anneau(0.085, 0.028), 0.0, 0.47, 0, K.gilet, Math.PI / 2); // le col protège-cou
        for (const z of [-0.16, 0.16]) pc("dos", galet(0.076, 0.03, 0.076, 0.3, 5), 0.152, 0.22, z, K.rabat); // leurs rabats
      }
    } else if (classe === "ingenieur") {
      const cuir = S ? K.sangle : K.cuir; // (demande 128 : avec son skin, la ceinture et le rouleau sont en nylon sombre)
      pc("dos", galet(0.29, 0.055, 0.4, 0.3, s), 0, -0.075, 0, cuir); // la ceinture à outils
      pc("dos", B(0.02, 0.17, 0.01), 0.03, -0.17, 0.215, K.outils); // la clé à molette (le manche)…
      pc("dos", new THREE.TorusGeometry(0.022, 0.009, 4, detail ? 10 : 6), 0.03, -0.075, 0.218, K.outils); // … et sa tête
      pc("dos", new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), 0.05, -0.16, -0.222, S ? K.noir : K.bois); // le marteau (le manche)…
      pc("dos", B(0.1, 0.032, 0.032), 0.05, -0.06, -0.222, K.outils); // … et sa tête
      pc("dos", galet(0.055, 0.1, 0.065, 0.35, 6), 0.14, -0.08, 0.1, cuir); // la pochette de la pince
      if (detail) {
        const xd = S ? -0.258 : -0.358; // (demande 128 : sur la poche à eau, plus de gros sac)
        if (!S) pc("dos", new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), -0.26, 0.06, 0, K.cuir, Math.PI / 2); // le rouleau d'outils
        if (!S) pc("dos", new THREE.TorusGeometry(0.075, 0.013, 5, 14), -0.365, 0.3, 0, K.noir, 0, Math.PI / 2, 0); // le câble enroulé
        pc("dos", galet(0.012, 0.06, 0.1, 0.3, 4), xd, S ? 0.36 : 0.42, 0, K.genie); // l'écusson du génie (jaune…)
        pc("dos", B(0.008, 0.016, 0.1), xd - 0.006, S ? 0.36 : 0.42, 0, K.noir, 0.5); // (… avec sa bande noire)
        pc("dos", galet(0.02, 0.05, 0.03, 0.4, 4), 0.06, 0.35, -0.12, K.genie); // la lampe frontale, sur la bretelle
      }
    } else if (classe === "eclaireur") {
      pc("dos", galet(0.07, 0.085, 0.15, 0.35, detail ? 8 : 5), 0.2, 0.36, 0, K.sac); // les jumelles, dans leur poche sur la poitrine
      if (detail && S) for (const z of [-0.045, 0.045]) pc("dos", new THREE.CylinderGeometry(0.022, 0.022, 0.04, 8), 0.24, 0.37, z, K.noir, 0, 0, Math.PI / 2); // (demande 128 : sans les lanières)
      else if (detail) {
        for (const z of [-0.045, 0.045]) pc("dos", new THREE.CylinderGeometry(0.022, 0.022, 0.04, 8), 0.24, 0.37, z, K.noir, 0, 0, Math.PI / 2); // (leurs 2 objectifs)
        // les lanières de camouflage (le tissu camouflé), sur les épaules et le haut du sac, chacune un peu de travers
        const L = [[-0.12, 0.47, -0.16, 0.4], [-0.16, 0.47, 0.14, -0.5], [-0.3, 0.47, -0.08, 0.3], [-0.3, 0.46, 0.1, -0.2], [-0.36, 0.38, -0.12, 0.15], [-0.36, 0.36, 0.13, -0.25], [-0.05, 0.46, 0.2, -0.6], [-0.05, 0.46, -0.2, 0.6]];
        for (const [x, y, z, r] of L) pc("dos", galet(0.03, 0.17, 0.06, 0.3, 4), x, y - 0.06, z, "tenue", r, 0, 0.4);
      }
    } else if (classe === "medecin") {
      if (!S) for (const k of [0, 1]) { // le BRASSARD BLANC À CROIX ROUGE (sur chaque bras ; demande 128 : avec son skin, l'écusson)
        const e = "epaule" + k, cote = k ? -1 : 1;
        pc(e, new THREE.CylinderGeometry(0.06, 0.058, 0.065, s, 1, true), 0, -0.17, 0, K.soin);
        pc(e, B(0.042, 0.013, 0.008), 0, -0.17, cote * 0.061, K.croix);
        pc(e, B(0.013, 0.042, 0.008), 0, -0.17, cote * 0.061, K.croix);
        if (detail) (pc(e, B(0.008, 0.013, 0.042), 0.062, -0.17, 0, K.croix), pc(e, B(0.008, 0.042, 0.013), 0.062, -0.17, 0, K.croix)); // (et devant)
      }
      const xs = S ? -0.258 : -0.357; // (demande 128 : sur la poche à eau)
      pc("dos", galet(0.012, 0.15, 0.15, 0.3, detail ? 6 : 4), xs, 0.28, 0, K.soin); // la croix sur le sac (le carré blanc…)
      pc("dos", B(0.008, 0.11, 0.034), xs - 0.007, 0.28, 0, K.croix); // (… et la croix rouge)
      pc("dos", B(0.008, 0.034, 0.11), xs - 0.007, 0.28, 0, K.croix);
      pc("dos", galet(0.075, 0.1, 0.1, 0.4, detail ? 8 : 5), 0.08, -0.03, -0.205, S ? K.sac : K.croix); // la grosse poche de soins (rouge ; demande 128 : sable)
      if (detail) {
        pc("dos", galet(0.06, 0.08, 0.07, 0.4, 6), 0.06, 0.06, 0.22, S ? K.sac : K.croix); // la poche du garrot (rouge ; demande 128 : sable)
        pc("dos", B(0.006, 0.03, 0.01), 0.093, 0.06, 0.22, K.soin); // (sa petite croix blanche)
        pc("dos", B(0.006, 0.01, 0.03), 0.093, 0.06, 0.22, K.soin);
      }
    }
  }

  // ------------------------------------------------------------------ (demande 93) LA TÊTE SCULPTÉE
  // ✍️ « Fais un peu plus réaliste » : la tête n'est plus une boule + une boîte (la mâchoire carrée), mais UNE boule
  // qu'on SCULPTE point par point, comme de la pâte à modeler : le bas se resserre en mâchoire puis en menton, la nuque
  // rentre, le front avance (l'arcade des sourcils), les yeux sont CREUSÉS dans leurs orbites, les pommettes et la bouche
  // ressortent un peu. Puis on la PEINT : la peau n'est jamais d'une seule couleur (des petites nuances au hasard), les
  // joues et le nez plus roses, le tour des yeux plus sombre, et la BARBE DE 3 JOURS (grise-bleue) sur le bas du visage.
  // Les yeux (le blanc, l'iris), les paupières, les sourcils, les oreilles, les lèvres sont des petites pièces posées SUR
  // la tête sculptée (on cherche le point de la peau le plus proche pour les y coller).
  // Les LUNETTES changent d'un soldat à l'autre (config.js, « realisme.soldats.visage.lunettes ») : relevées sur le
  // casque, des lunettes de SOLEIL, ou le MASQUE de protection sur les yeux.
  // Tout est cuit dans les mêmes formes que le reste du soldat : pas un dessin de plus.
  function bruitVisage(x, y, z) { // (un petit bruit doux, pour les nuances de la peau)
    const h = (i, j, k) => { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k;
    const l = (a, b, t) => a + (b - a) * t * t * (3 - 2 * t);
    return l(l(l(h(i, j, k), h(i + 1, j, k), fx), l(h(i, j + 1, k), h(i + 1, j + 1, k), fx), fy), l(l(h(i, j, k + 1), h(i + 1, j, k + 1), fx), l(h(i, j + 1, k + 1), h(i + 1, j + 1, k + 1), fx), fy), fz);
  }
  const gauss = (d, r) => Math.exp(-(d * d) / (r * r));
  const formesTete = {};
  function teteSculptee(detail) {
    if (formesTete[detail]) return formesTete[detail];
    // (demande 126 : le sculpteur la reprend, avec l'arête du nez, des orbites plus creuses, les joues, le crâne plus rond)
    return (formesTete[detail] = Tanks.Corps3D.crane(detail ? MQ().tete[0] : 12, detail ? MQ().tete[1] : 9));
  }
  // Le point de la peau tout devant, à la hauteur y et au côté z (pour y coller les yeux, le nez, la bouche).
  function devant(geo, y, z) {
    const p = geo.attributes.position;
    let mieux = 1e9, x = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.getX(i) <= 0) continue;
      const d = (p.getY(i) - y) ** 2 + (p.getZ(i) - z) ** 2;
      if (d < mieux) (mieux = d), (x = p.getX(i));
    }
    return x;
  }
  function tete(pc, peint, dernier, K, peau, detail, joueur, classe, barbe, S) {
    const V = Tanks.CONFIG.realisme.soldats.visage, variante = joueur ? 0 : Math.max(0, PEAUX.indexOf(peau));
    const chapeau = !S && classe === "eclaireur" && Tanks.CONFIG.edition.modeles.chapeauEclaireur !== false; // (demande 114 : l'éclaireur porte son chapeau de brousse, pas de casque ; demande 115 : en 1916, son casque ; demande 128 : avec son skin, son casque)
    let lunettes = S ? S.lunettes : V.lunettes[variante % V.lunettes.length]; // (demande 128 : les lunettes de son skin)
    if (chapeau && lunettes === "casque") lunettes = "aucune"; // (pas de casque où les relever)
    const ecouteurs = !S && lunettes !== "soleil" && !ANCIEN(); // (demande 115 : pas de casque radio en 1916 ; demande 128 : le skin a ses coquilles anti-bruit)
    // ✍️ (demande 128) LE VISAGE COUVERT : la cagoule (on ne voit que les yeux), le foulard (sur le nez et la bouche), le masque à gaz
    const couvert = S && S.visage, gaz = couvert === "masqueGaz", cagoule = couvert === "cagoule" || gaz;
    // ✍️ (demande 114) SA BARBE (une sur « barbes », selon sa peau et sa classe : pas tous la même tête)
    const BB = V.barbes[barbe !== undefined ? barbe % V.barbes.length : (variante * 2 + MQ().classes.indexOf(classe) + 1) % V.barbes.length]; // (la vitrine peut la choisir)
    const H = teteSculptee(detail), cx = 0.012, cy = 0.135; // (le centre de la tête, dans le repère du cou)
    const av = (y, z) => cx + devant(H, y, z); // (le devant de la peau, dans le repère du cou)
    pc("cou", Tanks.Corps3D.cou(detail), 0, 0, 0, cagoule ? K.visage : peau); // le cou (demande 126 : sa base suit le dos, le haut suit la tête ; demande 128 : sous la cagoule)
    dernier().poids = Tanks.Corps3D.melange("dos", "cou", -0.045, 0.035);
    // (demande 128 : sous une cagoule ou un masque, on ne garde de la tête que le tour des yeux : le reste est caché)
    pc("cou", cagoule ? teteCachee(H, detail) : H, cx, cy, 0, peau);
    // la peinture de la peau (x, y, z : le point sur la tête, autour de son centre)
    const B = V.barbe * BB.force;
    peint((x, y, z) => {
      const az = Math.abs(z), face = Math.max(0, Math.min(1, x / 0.06));
      let r = 1, v = 1, b = 1;
      const n = 1 + (bruitVisage(x * 90, y * 90, z * 90) - 0.5) * V.grain * 2 + (bruitVisage(x * 300, y * 300, z * 300) - 0.5) * V.grain * 0.6;
      r *= n; v *= n; b *= n;
      const rose = (gauss(y + 0.022, 0.022) * gauss(az - 0.05, 0.022) + gauss(y + 0.005, 0.02) * gauss(az, 0.012) * 0.6) * face * V.rougeur;
      r *= 1 + rose; v *= 1 - rose * 0.7; b *= 1 - rose * 0.6;
      const yeux = gauss(y - 0.011, 0.014) * gauss(az - 0.032, 0.02) * face * 0.2; // le tour des yeux, plus sombre
      r *= 1 - yeux; v *= 1 - yeux * 1.1; b *= 1 - yeux * 0.9;
      const barbe = barbeIci(x, y, z) * B;
      return [r * (1 - barbe * 0.9), v * (1 - barbe * 0.88), b * (1 - barbe * 0.78)];
    });
    // la BARBE DE 3 JOURS : où elle pousse (0 à 1) ; le tailleur y sème aussi des petits poils (la « matière » 1 à 1,4)
    function barbeIci(x, y, z) {
      const az = Math.abs(z);
      if (x < -0.02) return 0;
      let joues = Math.max(0, Math.min(1, (-BB.haut - y) / 0.03)) * (az > 0.02 || y < -0.068 ? 1 : 0); // le bas des joues, le menton
      const moustache = gauss(y + 0.047, 0.008) * gauss(az, 0.024) * (x > 0.06 ? 1 : 0);
      const bouc = BB.bouc ? gauss(y + 0.088, 0.022) * gauss(az, 0.024) * (x > 0.03 ? 1 : 0) : 0; // (demande 114 : le bouc, au menton)
      if (BB.moustache || BB.bouc) joues *= 0.12; // (seulement la moustache, ou le bouc : les joues restent rasées)
      return Math.min(1, joues + moustache + bouc) * (y < -0.115 ? 0.5 : 1);
    }
    dernier().matiere = (x, y, z) => 1 + barbeIci(x, y, z) * 0.4;
    if (!detail) {
      if (!couvert) pc("cou", galet(0.03, 0.04, 0.024, 0.5, 6), av(-0.02, 0) + 0.008, cy - 0.022, 0, peau); // le nez
      if (!gaz) for (const z of [-0.033, 0.033]) pc("cou", new THREE.SphereGeometry(0.012, 6, 4), av(0.011, z) + 0.004, cy + 0.011, z, K.blanc);
    } else {
      // (demande 126) le NEZ sculpté (la racine, l'arête, le bout, les ailes ; les narines dessous, plus sombres)
      const xn = av(-0.012, 0), C3 = Tanks.Corps3D;
      if (!couvert) {
      pc("cou", C3.nez(true), xn - 0.006, cy + 0.0, 0, peau);
      peint((x, y) => (y < -0.04 ? [0.55, 0.42, 0.4] : y < -0.025 ? [1.06, 0.94, 0.9] : 1));
      }
      // les YEUX dans leurs orbites : le blanc, l'iris (sa couleur change d'un soldat à l'autre), la pupille, les
      // paupières (des coquilles de peau posées sur l'œil), les sourcils
      const iris = [0x3b2a1a, 0x4a6a7a, 0x2c1e12, 0x5a6a3a][variante % 4], rO = 0.0112;
      if (!gaz) for (const z of [-0.031, 0.031]) {
        const xo = av(0.012, z) - 0.0068, yo = cy + 0.011;
        pc("cou", new THREE.SphereGeometry(rO, 12, 8), xo, yo, z, K.blanc); // le blanc de l'œil
        peint((x) => (x > 0.004 ? 1 : 0.75)); // (dans l'ombre sur les côtés)
        pc("cou", new THREE.SphereGeometry(0.0052, 10, 6), xo + rO - 0.0035, yo - 0.0006, z * 0.985, iris); // l'iris
        pc("cou", new THREE.SphereGeometry(0.0026, 6, 4), xo + rO - 0.0012, yo - 0.0006, z * 0.985, K.pupille); // la pupille
        pc("cou", C3.paupiere(true, rO), xo, yo, z, peau); // la paupière du haut
        peint((x, y) => (y < -0.002 ? [0.8, 0.68, 0.66] : [0.95, 0.88, 0.86]));
        pc("cou", C3.paupiere(false, rO), xo, yo, z, peau); // la paupière du bas
        peint(() => [0.93, 0.85, 0.84]);
        pc("cou", C3.sourcil(), av(0.03, z) - 0.001, cy + 0.03, z * 1.06, K.sourcils, 0, z > 0 ? -0.2 : 0.2, 0); // le sourcil
      }
      // la BOUCHE : la lèvre du haut (fine), la lèvre du bas (plus pleine)
      const xb = av(-0.056, 0), levres = new THREE.Color(peau).lerp(new THREE.Color(K.levres), 0.6).getHex();
      if (!couvert) {
      pc("cou", C3.levre(true), xb - 0.004, cy - 0.0525, 0, levres);
      peint((x, y) => (y > 0.002 ? 0.92 : 0.82));
      pc("cou", C3.levre(false), xb - 0.0055, cy - 0.0605, 0, levres);
      peint((x, y) => (y > 0.002 ? 0.8 : 1.04));
      // ✍️ (demande 114) une VRAIE barbe en volume (barbe pleine), ou la moustache bien fournie
      if (BB.pleine) {
        pc("cou", galet(0.07, 0.06, 0.118, 0.65, 10), av(-0.088, 0) - 0.026, cy - 0.09, 0, K.sourcils);
        peint((x, y) => 0.8 + (bruitVisage(x * 400, y * 400, 3) - 0.5) * 0.4);
        dernier().matiere = () => 1.4;
        for (const z of [-1, 1]) (pc("cou", galet(0.05, 0.075, 0.03, 0.6, 8), av(-0.06, z * 0.055) - 0.03, cy - 0.06, z * 0.06, K.sourcils, 0, z * 0.5, 0), (dernier().matiere = () => 1.4)); // (les côtés)
      }
      if (BB.moustache || BB.pleine) (pc("cou", galet(0.012, 0.011, 0.05, 0.6, 8), xb + 0.002, cy - 0.047, 0, K.sourcils), (dernier().matiere = () => 1.4));
      if (BB.grosse) for (const z of [-1, 1]) { // ✍️ (demande 128, 1916) la GROSSE MOUSTACHE du poilu : 2 touffes qui tombent sur les coins de la bouche
        pc("cou", galet(0.016, 0.013, 0.042, 0.6, 8), xb + 0.003, cy - 0.051, z * 0.021, K.sourcils, z * 0.45, z * -0.3, 0);
        peint((x, y) => 0.75 + (bruitVisage(x * 500, y * 500, z) - 0.5) * 0.5);
        dernier().matiere = () => 1.4;
      }
      }
      // les OREILLES (cachées sous le casque radio quand il en a un ; demande 128 : sous la cagoule ou les coquilles)
      if (!ecouteurs && !S) for (const z of [-1, 1]) {
        pc("cou", galet(0.034, 0.058, 0.013, 0.55, 10), cx - 0.012, cy + 0.0, z * 0.081, peau, 0, z * 0.35, 0.12);
        peint((x, y) => [1.06, 0.94, 0.92]); // (la lumière traverse l'oreille : plus rose)
        pc("cou", galet(0.016, 0.03, 0.008, 0.5, 6), cx - 0.008, cy - 0.002, z * 0.088, peau, 0, z * 0.35, 0.12);
        peint(() => 0.7); // (le creux de l'oreille)
      }
      if (ecouteurs) {
        for (const z of [-0.1, 0.1]) pc("cou", galet(0.065, 0.075, 0.04, 0.45, 8), -0.005, 0.135, z, K.sangle); // le casque radio
        pc("cou", galet(0.018, 0.018, 0.018, 0.6, 6), xb + 0.012, cy - 0.055, -0.04, K.noir); // son micro, devant la bouche
        pc("cou", new THREE.CylinderGeometry(0.004, 0.004, 0.11, 4), 0.05, 0.088, -0.085, K.noir, 0, -0.6, Math.PI / 2 - 0.25); // sa tige
      }
      // les LUNETTES
      if (lunettes === "soleil" && S) { // (demande 128) des lunettes balistiques ENVELOPPANTES : un seul écran sombre courbé, et les branches
        pc("cou", new THREE.CylinderGeometry(0.097, 0.097, 0.036, 16, 1, true, -0.62, 1.24), cx + 0.004, cy + 0.0125, 0, K.verre, 0, Math.PI / 2, 0);
        pc("cou", galet(0.008, 0.008, 0.02, 0.5, 4), av(0.016, 0) + 0.009, cy + 0.026, 0, K.noir);
        for (const z of [-1, 1]) pc("cou", galet(0.09, 0.006, 0.004, 0.5, 4), cx + 0.03, cy + 0.016, z * 0.083, K.noir);
      } else if (lunettes === "soleil") { // des lunettes de soleil enveloppantes : 2 verres sombres, le pont, les branches
        for (const z of [-0.032, 0.032]) pc("cou", galet(0.007, 0.024, 0.036, 0.7, 10), av(0.011, z) + 0.011, cy + 0.012, z, K.verre, 0, z > 0 ? -0.2 : 0.2, 0);
        pc("cou", galet(0.006, 0.006, 0.02, 0.5, 4), av(0.014, 0) + 0.008, cy + 0.02, 0, K.noir);
        for (const z of [-1, 1]) pc("cou", galet(0.09, 0.006, 0.004, 0.5, 4), cx + 0.035, cy + 0.016, z * 0.08, K.noir);
      } else if (lunettes === "masque") { // le masque de protection sur les yeux, et sa sangle autour du casque
        pc("cou", galet(0.022, 0.034, 0.105, 0.35, 12), av(0.012, 0) + 0.014, cy + 0.013, 0, K.verre);
        pc("cou", galet(0.026, 0.04, 0.11, 0.3, 10), av(0.012, 0) + 0.006, cy + 0.013, 0, K.noir);
        if (S) dernier().echelle = [1.15, 1.3, 1.08]; // (demande 128 : de grandes lunettes sombres ; la sangle passe sous le casque)
        else (pc("cou", new THREE.TorusGeometry(0.103, 0.008, 4, 20), cx - 0.005, cy + 0.014, 0, K.sangle, Math.PI / 2), (dernier().echelle = [1.15, 1, 1]));
      } else if (lunettes === "casque") pc("cou", galet(0.035, 0.05, 0.17, 0.35, 8), 0.125, 0.245, 0, K.verre, 0, 0, 0.1); // relevées sur le casque
      else if (lunettes === "masqueGaz") { // ✍️ (demande 115) le MASQUE À GAZ de 1916 : la toile sur le visage, 2 gros yeux ronds, la cartouche filtrante
        pc("cou", galet(0.07, 0.12, 0.13, 0.5, 10), av(-0.02, 0) - 0.005, cy - 0.02, 0, 0x5a5a48);
        for (const z of [-0.035, 0.035]) (pc("cou", new THREE.CylinderGeometry(0.024, 0.024, 0.016, 12), av(0.012, z) + 0.014, cy + 0.012, z, K.verre, 0, 0, Math.PI / 2), pc("cou", new THREE.TorusGeometry(0.025, 0.005, 4, 12), av(0.012, z) + 0.018, cy + 0.012, z, K.metal, 0, Math.PI / 2, 0));
        pc("cou", new THREE.CylinderGeometry(0.028, 0.032, 0.07, 10), av(-0.06, 0) + 0.04, cy - 0.075, 0, 0x3c3e36, 0, 0, Math.PI / 2 - 0.5);
      }
    }
    if (couvert) visageCouvert(pc, dernier, peint, K, detail, couvert, cx, cy, av);
    // le CASQUE : posé un peu en arrière (le bord juste au-dessus des sourcils, plus bas sur la nuque)
    const pente = V.casque.pente, yc = V.casque.hauteur;
    if (S && S.casque === "tactique") return casqueTactique(pc, dernier, peint, K, detail, joueur, classe, S, pente, yc);
    if (S && S.casque === "capuche") return; // (la capuche du masque à gaz : déjà posée avec le masque)
    if (chapeau) return chapeauDeBrousse(pc, dernier, K, detail, joueur, pente, yc);
    if (K.casqueStyle !== "moderne") return casqueAncien(pc, dernier, K, detail, joueur, classe, pente, yc); // (demande 115)
    const casque = new THREE.SphereGeometry(0.13, detail ? 22 : 12, detail ? 10 : 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
    pc("cou", casque, -0.008, yc, 0, "tenue", 0, 0, pente); // le casque (avec sa housse camouflée et son filet)
    dernier().echelle = [1.06, 0.98, 1.04];
    pc("cou", new THREE.TorusGeometry(0.13, 0.011, 5, detail ? 24 : 12), -0.008, yc, 0, K.casqueBord, Math.PI / 2, 0, 0); // le bord du casque
    dernier().echelle = [1.06, 1.04, 1];
    dernier().rz2 = pente;
    pc("cou", new THREE.TorusGeometry(0.125, 0.013, 5, detail ? 24 : 12), -0.008 - Math.sin(pente) * 0.04, yc + 0.04, 0, joueur ? K.marqueToi : K.marque, Math.PI / 2); // ✍️ le bandeau de l'équipe
    dernier().echelle = [1.06, 1.04, 1];
    dernier().rz2 = pente;
    if (detail) {
      pc("cou", galet(0.03, 0.055, 0.05, 0.3, 6), 0.145, yc + 0.035, 0, K.sangle, 0, 0, pente); // le support des jumelles de nuit
      pc("cou", galet(0.06, 0.05, 0.09, 0.4, 6), -0.158, yc + 0.025, 0, K.sac); // le contrepoids, à l'arrière du casque
      for (const z of [-0.138, 0.138]) pc("cou", galet(0.1, 0.018, 0.012, 0.3, 6), -0.008, yc + 0.03, z, K.sangle, 0, 0, pente); // les rails
      for (const z of [-0.088, 0.088]) pc("cou", galet(0.012, 0.11, 0.008, 0.5, 4), 0.032, 0.1, z * 0.96, K.sangle, 0.0, 0, -0.2); // la jugulaire
      // (demande 114) la balise infrarouge sur le dessus (pour que les amis le voient la nuit), le carré à scratch derrière
      pc("cou", galet(0.035, 0.022, 0.03, 0.4, 6), -0.06, yc + 0.125, 0, K.noir, 0, 0, pente);
      pc("cou", galet(0.03, 0.045, 0.065, 0.3, 4), -0.128, yc + 0.075, 0, K.sangle, 0, 0, pente + 0.7);
      if (classe === "medecin") for (const z of [-1, 1]) { // (et la croix rouge du médecin, sur les côtés du casque)
        pc("cou", galet(0.05, 0.05, 0.01, 0.3, 4), -0.01, yc + 0.07, z * 0.128, K.soin, z * -0.45, 0, 0);
        pc("cou", new THREE.BoxGeometry(0.036, 0.011, 0.006), -0.01, yc + 0.07, z * 0.133, K.croix, z * -0.45, 0, 0);
        pc("cou", new THREE.BoxGeometry(0.011, 0.036, 0.006), -0.01, yc + 0.07, z * 0.133, K.croix, z * -0.45, 0, 0);
      }
    }
  }
  // ✍️ (demande 115) LES CASQUES D'AUTREFOIS (inventés, inspirés de 1916) : tournés comme sur un tour de potier.
  //   - « adrian » (l'Entente de Valmont) : la bombe ronde, la CRÊTE (le cimier) sur le dessus, la visière devant et le
  //     couvre-nuque derrière, l'insigne sur le front ;
  //   - « kressien » (l'Empire de Kressia) : la bombe profonde qui descend sur les oreilles et s'évase en couvre-nuque, et
  //     les deux petits tétons d'aération sur les côtés.
  function casqueAncien(pc, dernier, K, detail, joueur, classe, pente, yc) {
    const n = detail ? 22 : 12, acier = K.casqueAcier;
    if (K.casqueStyle === "adrian") {
      pc("cou", new THREE.SphereGeometry(0.128, n, detail ? 9 : 5, 0, Math.PI * 2, 0, Math.PI * 0.5), -0.008, yc, 0, acier, 0, 0, pente);
      dernier().echelle = [1.1, 0.95, 1.0];
      const bord = [[0.12, 0.004], [0.2, -0.012], [0.205, -0.018], [0.12, -0.006]].map(([r, y]) => new THREE.Vector2(r, y));
      pc("cou", new THREE.LatheGeometry(bord, n), -0.008, yc, 0, acier, 0, 0, pente); // la visière et le couvre-nuque
      dernier().echelle = [1.05, 1, 0.72];
      pc("cou", galet(0.2, 0.05, 0.016, 0.3, 6), -0.012, yc + 0.11, 0, acier, 0, 0, pente); // la crête (le cimier)
      if (detail) pc("cou", galet(0.008, 0.035, 0.03, 0.3, 4), 0.13, yc + 0.06, 0, joueur ? K.marqueToi : K.marque, 0, 0, pente - 0.4); // l'insigne
    } else if (K.casqueStyle === "rond") { // (1944, l'Union d'Aldermont) le casque ROND : la bombe profonde, un petit bord tout autour, le filet
      pc("cou", new THREE.SphereGeometry(0.135, n, detail ? 9 : 5, 0, Math.PI * 2, 0, Math.PI * 0.56), -0.01, yc - 0.012, 0, acier, 0, 0, pente);
      dernier().echelle = [1.08, 1.02, 1.0];
      pc("cou", new THREE.TorusGeometry(0.142, 0.012, 4, n), -0.01, yc - 0.03, 0, acier, Math.PI / 2, 0, 0);
      dernier().echelle = [1.08, 1.0, 1];
      dernier().rz2 = pente;
      if (detail) pc("cou", galet(0.26, 0.11, 0.26, 0.6, 8), -0.01, yc + 0.04, 0, K.sangle, 0, 0, pente); // le filet de camouflage
    } else if (K.casqueStyle === "pot") { // ✍️ (demande 115, Guerre froide, Ostrel) le casque « POT » : la grande bombe ronde et profonde, couverte
      // de TOILE camouflée, l'élastique tout autour (on y glisse des choses), un petit bord qui descend sur la nuque
      pc("cou", new THREE.SphereGeometry(0.145, n, detail ? 10 : 5, 0, Math.PI * 2, 0, Math.PI * 0.58), -0.012, yc - 0.018, 0, acier, 0, 0, pente);
      dernier().echelle = [1.1, 1.0, 1.02];
      const bord = [[0.14, 0.002], [0.158, -0.012], [0.162, -0.02], [0.14, -0.008]].map(([r, y]) => new THREE.Vector2(r, y));
      pc("cou", new THREE.LatheGeometry(bord, n), -0.012, yc - 0.03, 0, acier, 0, 0, pente);
      dernier().echelle = [1.1, 1, 1.02];
      pc("cou", new THREE.TorusGeometry(0.15, 0.009, 4, n), -0.012, yc + 0.02, 0, K.sangle, Math.PI / 2, 0, 0); // l'élastique
      dernier().echelle = [1.08, 1.0, 1];
      dernier().rz2 = pente;
      if (detail) pc("cou", galet(0.05, 0.02, 0.03, 0.3, 4), -0.02, yc + 0.05, 0.145, 0xd8d0b0, 0.5, 0, 0); // (un paquet glissé sous l'élastique)
    } else if (K.casqueStyle === "xyl") { // ✍️ (demande 115, Aliens, les Xyl'tharr) le CASQUE-CARAPACE : il enferme toute la tête, s'allonge
      // vers l'arrière en une crête, et deux grands YEUX brillent devant (la couleur du camp)
      pc("cou", new THREE.SphereGeometry(0.15, n, detail ? 10 : 6), 0.0, yc - 0.04, 0, acier, 0, 0, pente);
      dernier().echelle = [1.22, 1.12, 0.95];
      pc("cou", galet(0.3, 0.09, 0.07, 0.5, 8), -0.13, yc + 0.07, 0, acier, 0, 0, 0.55); // la crête
      pc("cou", galet(0.07, 0.12, 0.2, 0.5, 8), 0.12, yc - 0.13, 0, K.sangle); // la mâchoire (une plaque sombre)
      for (const z of [-0.05, 0.05]) pc("cou", galet(0.03, 0.026, 0.05, 0.6, 8), 0.172, yc - 0.03, z, joueur ? K.marqueToi : K.marque, 0, z > 0 ? 0.35 : -0.35, 0); // les yeux
      return;
    } else if (K.casqueStyle === "milice") { // ✍️ (demande 115, Guerre civile, le Front des Oliviers) pas de casque : une CASQUETTE (la
      // calotte en tissu, la visière devant) et le FOULARD de la couleur du camp noué autour du cou
      pc("cou", new THREE.SphereGeometry(0.122, n, detail ? 8 : 5, 0, Math.PI * 2, 0, Math.PI * 0.42), -0.01, yc - 0.035, 0, acier, 0, 0, pente);
      dernier().echelle = [1.08, 0.9, 1.0];
      pc("cou", galet(0.11, 0.014, 0.17, 0.5, 6), 0.13, yc - 0.03, 0, acier, 0, 0, pente - 0.12); // la visière
      pc("cou", new THREE.TorusGeometry(0.075, 0.03, 5, n), 0.0, 0.05, 0, joueur ? K.marqueToi : K.marque, Math.PI / 2, 0, 0); // le foulard autour du cou
      dernier().echelle = [1.1, 1.0, 1];
      if (detail) pc("cou", galet(0.05, 0.09, 0.06, 0.5, 6), -0.08, 0.0, 0.0, joueur ? K.marqueToi : K.marque, 0, 0, 0.5); // le nœud, dans le dos
      return;
    } else if (K.casqueStyle === "colonial") { // ✍️ (demande 115, Guerre froide, Khavar) le CASQUE COLONIAL en liège : la bombe allongée, le large
      // bord qui descend tout autour (contre le soleil), le petit bouton d'aération sur le dessus, l'insigne devant
      pc("cou", new THREE.SphereGeometry(0.13, n, detail ? 9 : 5, 0, Math.PI * 2, 0, Math.PI * 0.5), -0.012, yc - 0.01, 0, acier, 0, 0, pente);
      dernier().echelle = [1.22, 1.1, 1.05];
      const bord = [[0.13, 0.004], [0.19, -0.022], [0.215, -0.04], [0.21, -0.046], [0.18, -0.03], [0.13, -0.004]].map(([r, y]) => new THREE.Vector2(r, y));
      pc("cou", new THREE.LatheGeometry(bord, n), -0.012, yc - 0.012, 0, acier, 0, 0, pente);
      dernier().echelle = [1.18, 1, 1.02];
      pc("cou", new THREE.CylinderGeometry(0.016, 0.02, 0.016, 8), -0.02, yc + 0.142, 0, acier, 0, 0, pente);
      if (detail) pc("cou", new THREE.CylinderGeometry(0.018, 0.018, 0.006, 10), 0.152, yc + 0.06, 0, joueur ? K.marqueToi : K.marque, 0, 0, Math.PI / 2 + pente - 0.25); // l'insigne
    } else {
      const prof = [[0.0, 0.125], [0.07, 0.118], [0.112, 0.085], [0.132, 0.03], [0.136, -0.025], [0.15, -0.06], [0.168, -0.08], [0.172, -0.088], [0.13, -0.03], [0.124, 0.03], [0.1, 0.09], [0.0, 0.11]].map(([r, y]) => new THREE.Vector2(r, y));
      pc("cou", new THREE.LatheGeometry(prof, n), -0.012, yc - 0.008, 0, acier, 0, 0, pente);
      dernier().echelle = [1.08, 1, 1.0];
      for (const z of [-1, 1]) pc("cou", new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6), -0.03, yc + 0.03, z * 0.135, acier, Math.PI / 2, 0, 0); // les tétons
    }
    for (const z of [-0.088, 0.088]) pc("cou", galet(0.012, 0.11, 0.008, 0.5, 4), 0.045, 0.105, z * 1.04, K.cuir, 0.0, 0, -0.35); // la jugulaire de cuir
    if (classe === "medecin" && detail) for (const z of [-1, 1]) pc("cou", B3(0.04, 0.012, 0.006), -0.01, yc + 0.06, z * 0.133, K.croix, z * -0.45, 0, 0);
  }
  const B3 = (lx, ly, lz) => new THREE.BoxGeometry(lx, ly, lz);
  // ✍️ (demande 114) LE CHAPEAU DE BROUSSE (« boonie ») de l'éclaireur : le haut en tissu camouflé, le large bord tombant
  // (un profil qu'on fait tourner, comme sur un tour de potier), le bandeau de l'équipe, et de près des lanières de
  // camouflage qui pendent du bord.
  function chapeauDeBrousse(pc, dernier, K, detail, joueur, pente, yc) {
    const n = detail ? 20 : 10, yb = yc - 0.012;
    pc("cou", new THREE.CylinderGeometry(0.1, 0.118, 0.095, n), -0.008, yb + 0.05, 0, "tenue", 0, 0, pente); // le haut
    dernier().echelle = [1.08, 1, 1.02];
    pc("cou", galet(0.215, 0.04, 0.2, 0.7, n), -0.008, yb + 0.096, 0, "tenue", 0, 0, pente); // le dessus, un peu bombé
    const bord = [[0.112, 0.004], [0.16, -0.008], [0.205, -0.03], [0.212, -0.04], [0.2, -0.036], [0.155, -0.016], [0.112, -0.006], [0.112, 0.004]].map(([r, y]) => new THREE.Vector2(r, y));
    pc("cou", new THREE.LatheGeometry(bord, detail ? 22 : 12), -0.008, yb, 0, "tenue", 0, 0, pente); // le bord tombant
    dernier().echelle = [1.06, 1, 1];
    pc("cou", new THREE.TorusGeometry(0.118, 0.012, 4, n), -0.008, yb + 0.018, 0, joueur ? K.marqueToi : K.marque, Math.PI / 2); // ✍️ le bandeau de l'équipe
    dernier().echelle = [1.07, 1.03, 1];
    dernier().rz2 = pente;
    if (detail) {
      for (let k = 0; k < 7; k++) { // les lanières qui pendent du bord
        const a = 0.6 + k * 0.72, x = Math.cos(a) * 0.19, z = Math.sin(a) * 0.19;
        pc("cou", galet(0.03, 0.075, 0.012, 0.3, 4), x - 0.008, yb - 0.065, z, "tenue", Math.sin(a) * 0.5, -a, Math.cos(a) * 0.3);
      }
      for (const z of [-0.088, 0.088]) pc("cou", new THREE.CylinderGeometry(0.003, 0.003, 0.15, 4), 0.03, 0.09, z * 1.1, K.sangle, 0, 0, -0.3); // la cordelette sous le menton
    }
  }

  // ------------------------------------------------------------------ ✍️ (demande 128) LES SKINS DES 4 CLASSES
  // « Les personnages ressemblent à des jouets » : Iron Wolf Studio a envoyé une image par classe. On ne copie pas ces images : on
  // refait leur STYLE, pièce par pièce (les couleurs et les choix sont dans config.js, « realisme.soldats.skins ») :
  //   - le VISAGE COUVERT : la CAGOULE (une coque de tricot posée sur la tête sculptée, avec la fente des yeux), le FOULARD
  //     (sur le nez et la bouche, noué autour du cou), le MASQUE À GAZ (la capuche, la pièce de caoutchouc qui épouse le
  //     visage, les 2 grands hublots ronds, la cartouche filtrante sur le côté, la membrane pour parler) ;
  //   - le CASQUE TACTIQUE coupé haut sur les oreilles (la coque de plastique dur), ses rails, les grosses COQUILLES
  //     anti-bruit, le support de jumelles de nuit, les lunettes de protection posées dessus ;
  //   - l'ÉQUIPEMENT du skin : le harnais en H de l'Assaut, l'écusson BLANC À CROIX ROUGE du médecin sur les deux bras, les
  //     poches de hanche, la sangle en travers et la ROQUETTE dans le dos de l'ingénieur.
  const formesFines = {};
  function teteFine(detail) { // (une tête plus finement découpée pour les coques : la fente des yeux a des bords plus nets)
    const k = detail ? "d" : "s";
    return formesFines[k] || (formesFines[k] = Tanks.Corps3D.crane(detail ? 32 : 14, detail ? 24 : 10));
  }
  function teteCachee(H, detail) {
    const k = "c" + detail;
    return formesFines[k] || (formesFines[k] = Tanks.Corps3D.coque(H, 0, (x, y, z) => x > -0.01 && Math.abs(Math.atan2(z, x)) < 0.9 && y > -0.03 && y < 0.05));
  }
  function visageCouvert(pc, dernier, peint, K, detail, couvert, cx, cy, av) {
    const C3 = Tanks.Corps3D, H = teteFine(detail), mat = (n) => (dernier().mat = n);
    if (couvert === "cagoule") { // la CAGOULE : tout couvert, sauf la fente des yeux
      pc("cou", C3.coque(H, 0.0055, (x, y, z) => !(x > 0 && Math.abs(Math.atan2(z, x)) < 0.52 && y > -0.002 && y < 0.025), 0.012), cx, cy, 0, K.visage);
      mat(6);
      peint((x, y) => (x > 0.06 && y > -0.012 && y < 0.034 ? 0.82 : 1)); // (le bord de la fente, dans l'ombre)
    } else if (couvert === "foulard") { // le FOULARD : sur le nez et la bouche, puis enroulé autour du cou
      pc("cou", C3.coque(H, 0.01, (x, y) => y < -0.008, 0.012), cx, cy, 0, K.visage);
      mat(6);
      peint((x, y, z) => 0.86 + 0.14 * Math.abs(Math.sin(y * 140 + z * 25))); // (ses plis)
      pc("cou", new THREE.TorusGeometry(0.068, 0.03, detail ? 6 : 4, detail ? 16 : 8), 0.004, 0.03, 0, K.visage, Math.PI / 2, 0, 0); // (enroulé autour du cou)
      dernier().echelle = [1.12, 1.0, 1.25];
      mat(6);
      peint((x, y, z) => 0.82 + 0.18 * Math.abs(Math.sin(Math.atan2(z, x) * 7)));
      if (detail) (pc("cou", galet(0.05, 0.11, 0.1, 0.5, 8), 0.07, -0.03, 0.0, K.visage, 0, 0, 0.25), mat(6)); // (le pan qui tombe devant)
    } else if (couvert === "masqueGaz") { // le MASQUE À GAZ
      pc("cou", C3.coque(H, 0.0065, null, 0), cx, cy, 0, K.visage); // la capuche (le tissu caoutchouté, noir)
      mat(6);
      pc("cou", C3.coque(H, 0.018, (x, y, z) => x > 0 && Math.abs(Math.atan2(z, x)) < 0.95 && y < 0.05 && y > -0.135, 0.006), cx, cy, 0, K.caoutchouc); // la pièce faciale en caoutchouc
      mat(8);
      for (const z of [-0.034, 0.034]) { // les 2 grands HUBLOTS ronds, et leur bague
        const x = av(0.012, z) + 0.022;
        pc("cou", new THREE.CylinderGeometry(0.027, 0.027, 0.016, detail ? 16 : 8), x, cy + 0.012, z, K.hublot, 0, z > 0 ? -0.25 : 0.25, Math.PI / 2);
        dernier().mat = 7;
        if (detail) pc("cou", new THREE.TorusGeometry(0.028, 0.006, 5, 16), x + 0.006, cy + 0.012, z, K.caoutchouc, 0, Math.PI / 2 + (z > 0 ? -0.25 : 0.25), 0);
      }
      pc("cou", new THREE.CylinderGeometry(0.024, 0.02, 0.03, detail ? 12 : 6), av(-0.06, 0) + 0.03, cy - 0.06, 0, K.caoutchouc, 0, 0, Math.PI / 2); // la membrane (pour parler)
      if (detail) pc("cou", new THREE.CylinderGeometry(0.016, 0.016, 0.006, 10), av(-0.06, 0) + 0.047, cy - 0.06, 0, K.filtre, 0, 0, Math.PI / 2); // (sa grille)
      // la CARTOUCHE FILTRANTE, vissée sur le côté gauche de la joue
      pc("cou", new THREE.CylinderGeometry(0.038, 0.038, 0.042, detail ? 16 : 8), av(-0.06, -0.06) + 0.012, cy - 0.065, -0.082, K.filtre, Math.PI / 2 - 0.5, 0.0, 0.0);
      dernier().ry = -0.6;
      if (detail) (pc("cou", new THREE.CylinderGeometry(0.03, 0.03, 0.004, 14), av(-0.06, -0.06) + 0.024, cy - 0.065, -0.1, K.caoutchouc, Math.PI / 2 - 0.5, -0.6, 0), peint(() => 0.6));
    }
  }
  function casqueTactique(pc, dernier, peint, K, detail, joueur, classe, S, pente, yc) {
    const n = detail ? 24 : 12, r = 0.132, mat = (m) => (dernier().mat = m);
    const coupe = (x, z) => 0.05 * Math.exp(-((x / (r * 0.5)) ** 2)) * Math.min(1, (Math.abs(z) / r) ** 2 * 1.3); // (la découpe au-dessus des oreilles)
    const g = new THREE.SphereGeometry(r, n, detail ? 11 : 6, 0, Math.PI * 2, 0, Math.PI * 0.5), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, Math.max(p.getY(i), coupe(p.getX(i), p.getZ(i))));
    g.computeVertexNormals();
    pc("cou", g, -0.008, yc, 0, K.casqueSkin, 0, 0, pente); // la coque (plastique dur)
    dernier().echelle = [1.06, 0.98, 1.05];
    mat(9);
    peint((x, y, z) => 0.92 + 0.08 * Math.sin(x * 90 + z * 70) * Math.sin(y * 60)); // (les éraflures)
    const bord = new THREE.TorusGeometry(r, 0.008, 4, n).rotateX(Math.PI / 2), pb = bord.attributes.position;
    for (let i = 0; i < pb.count; i++) pb.setY(i, pb.getY(i) + coupe(pb.getX(i), pb.getZ(i)));
    bord.computeVertexNormals();
    pc("cou", bord, -0.008, yc, 0, K.casqueSkin, 0, 0, pente); // le bord (le joint de caoutchouc)
    dernier().echelle = [1.06, 1.0, 1.05];
    peint(() => 0.55);
    pc("cou", new THREE.TorusGeometry(0.121, 0.009, 4, n), -0.008 - Math.sin(pente) * 0.06, yc + 0.06, 0, joueur ? K.marqueToi : K.marque, Math.PI / 2); // ✍️ le bandeau de l'équipe
    dernier().echelle = [1.06, 1.04, 1];
    dernier().rz2 = pente;
    if (S.oreilles) for (const z of [-1, 1]) { // les grosses COQUILLES anti-bruit (et le coussin contre la tête)
      pc("cou", new THREE.CylinderGeometry(0.046, 0.05, 0.04, detail ? 14 : 7), -0.004, 0.132, z * 0.1, K.genouillere, Math.PI / 2);
      mat(9);
      if (detail) {
        pc("cou", new THREE.TorusGeometry(0.044, 0.01, 5, 14), -0.004, 0.132, z * 0.08, K.caoutchouc);
        pc("cou", galet(0.03, 0.06, 0.016, 0.3, 4), -0.006, 0.19, z * 0.12, K.genouillere, z * 0.2, 0, 0); // (l'attache sur le rail)
      }
    }
    if (detail) {
      for (const z of [-0.133, 0.133]) pc("cou", galet(0.11, 0.018, 0.012, 0.3, 6), -0.008, yc + 0.055, z, K.sangle, 0, 0, pente); // les rails
      for (const z of [-0.088, 0.088]) pc("cou", galet(0.012, 0.1, 0.008, 0.5, 4), 0.04, 0.09, z * 0.96, K.sangle, 0.0, 0, -0.25); // la jugulaire
      pc("cou", galet(0.035, 0.022, 0.03, 0.4, 6), -0.06, yc + 0.125, 0, K.noir, 0, 0, pente); // la balise infrarouge
      pc("cou", galet(0.03, 0.05, 0.075, 0.3, 4), -0.13, yc + 0.07, 0, K.sangle, 0, 0, pente + 0.7); // le carré à scratch
      if (classe === "medecin") for (const z of [-1, 1]) { // (une petite croix rouge sur les côtés)
        pc("cou", galet(0.04, 0.04, 0.008, 0.3, 4), -0.02, yc + 0.08, z * 0.122, K.soin, z * -0.5, 0, 0);
        pc("cou", new THREE.BoxGeometry(0.028, 0.009, 0.005), -0.02, yc + 0.08, z * 0.127, K.croix, z * -0.5, 0, 0);
        pc("cou", new THREE.BoxGeometry(0.009, 0.028, 0.005), -0.02, yc + 0.08, z * 0.127, K.croix, z * -0.5, 0, 0);
      }
    }
    if (S.nvg) { // le support des jumelles de nuit (la plaque devant, le bras replié)
      pc("cou", galet(0.03, 0.05, 0.06, 0.3, 6), 0.143, yc + 0.035, 0, K.noir, 0, 0, pente - 0.15);
      if (detail) pc("cou", galet(0.035, 0.03, 0.04, 0.4, 6), 0.165, yc + 0.0, 0, K.noir, 0, 0, pente);
      pc("cou", galet(0.06, 0.05, 0.09, 0.4, 6), -0.152, yc + 0.03, 0, K.sac); // le contrepoids, à l'arrière
    }
    if (S.casqueLunettes) { // les LUNETTES de protection posées sur le casque, et leur sangle autour
      pc("cou", galet(0.04, 0.05, 0.18, 0.35, detail ? 10 : 6), 0.118, yc + 0.07, 0, K.noir, 0, 0, pente - 0.55);
      if (detail) {
        pc("cou", galet(0.022, 0.04, 0.16, 0.4, 10), 0.135, yc + 0.08, 0, K.verre, 0, 0, pente - 0.55);
        pc("cou", new THREE.TorusGeometry(0.113, 0.008, 4, n), -0.008 - Math.sin(pente) * 0.07, yc + 0.07, 0, K.sangle, Math.PI / 2);
        dernier().echelle = [1.06, 1.0, 1.05];
        dernier().rz2 = pente - 0.12;
      }
    }
  }
  // ✍️ (demande 128, 1916) LA CAPOTE DU POILU (et celle de Kressia, en gris de campagne) : on refait le STYLE d'une affiche
  // de musée (sans la copier) :
  //   - les PANS du long manteau, du ceinturon jusqu'au-dessus du genou, fendus derrière : chaque moitié suit un peu SA
  //     jambe quand il marche (des poids mélangés « corps → cuisse ») ;
  //   - le devant croisé à 2 RANGÉES DE BOUTONS, le col droit, les pattes des poches ;
  //   - les BRETELLES DE CUIR en Y (2 devant qui se rejoignent derrière), le GROS HAVRESAC avec la couverture roulée
  //     dessus, la GAMELLE et le quart accrochés, la musette et le BIDON ROND sur la hanche.
  function capote(pc, dernier, K, detail, equipe, CP, poids, peint) {
    const C3 = Tanks.Corps3D, bas = CP.bas, ev = CP.evase, n = detail ? 20 : 9;
    const bouton = new THREE.Color((CP.boutons || {})[String(equipe).split(/[~#]/)[0]] || "#8a7a50").getHex(), gamelle = new THREE.Color(CP.gamelle || "#8a8c86").getHex();
    // les pans : un loft du ceinturon (0,98 m) jusqu'en bas, qui s'évase ; posé sur le CORPS (y = la hauteur au repos)
    const T = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5, y = 0.99 - (0.99 - bas) * t;
      T.push({ y, xf: 0.122 + 0.02 * t + ev * t * t, xb: 0.132 + 0.03 * t + ev * t * t, z: 0.176 + 0.03 * t + ev * 0.8 * t * t, e: 2.3 });
    }
    // (les pans s'ouvrent devant, en V renversé, sur le pantalon : on enlève les triangles du devant, de plus en plus larges vers le bas)
    pc("corps", C3.coque(C3.loft(T, n, detail ? 2 : 1, false), 0, (x, y, z) => !(x > 0.05 && Math.abs(z) < 0.075 * Math.max(0, Math.min(1, (0.8 - y) / (0.8 - bas))))), 0, 0, 0, "tenue");
    // chaque côté suit sa cuisse, de plus en plus vers le bas (jusqu'à 70 %)
    poids((x, y, z) => ["corps", z < 0 ? "jambe0" : "jambe1", 0.7 * Math.max(0, Math.min(1, (0.9 - y) / (0.9 - bas)))]);
    // le BAS des pans, un ourlet un peu plus épais
    pc("corps", new THREE.TorusGeometry(0.17, 0.011, 4, n, Math.PI * 2 - 0.8).rotateZ(0.4), 0, bas + 0.006, 0, "tenue", Math.PI / 2); // (ouvert devant)
    dernier().echelle = [(0.152 + 0.025 + ev) / 0.17, (0.206 + ev * 0.8) / 0.17, 1];
    poids((x, y) => ["corps", y > 0 ? "jambe1" : "jambe0", 0.7]); // (le tore est couché : son « y » devient z)
    // le devant croisé : 2 rangées de boutons, de la poitrine au ceinturon
    for (let r = 0; r < (detail ? 5 : 3); r++) for (const z of [-0.055, 0.055]) {
      const y = 0.4 - r * (detail ? 0.075 : 0.13);
      pc("dos", new THREE.SphereGeometry(0.009, 6, 4), 0.122 + 0.006 * (r < 2 ? 1 : 0.4) - 0.01 * (r / 4), y, z * (1 - r * 0.05), bouton);
    }
    if (detail) {
      pc("dos", new THREE.TorusGeometry(0.066, 0.02, 5, 14), 0.005, 0.5, 0, "tenue", Math.PI / 2); // le col droit
      for (const z of [-0.09, 0.09]) pc("dos", galet(0.018, 0.035, 0.09, 0.3, 4), 0.11, 0.1, z * 1.1, "tenue", 0, 0, 0.1); // les pattes des poches
      for (let r = 0; r < 2; r++) pc("dos", new THREE.SphereGeometry(0.008, 6, 4), -0.13, 0.03, (r ? -1 : 1) * 0.05, bouton); // (la martingale, derrière)
    }
    // les BRETELLES DE CUIR en Y : 2 devant (de l'épaule au ceinturon), qui se rejoignent derrière
    for (const z of [-1, 1]) pc("dos", galet(0.014, 0.42, 0.038, 0.3, 4), 0.124, 0.24, z * 0.085, K.cuir, z * -0.12, 0, -0.06);
    pc("dos", galet(0.014, 0.3, 0.04, 0.3, 4), -0.13, 0.17, 0, K.cuir);
    // le GROS HAVRESAC : la couverture roulée sur le dessus, la gamelle et le quart, la poêle derrière
    pc("dos", new THREE.CylinderGeometry(0.055, 0.055, 0.42, detail ? 10 : 6), -0.25, 0.47, 0, K.molletieres, Math.PI / 2);
    if (detail) peint((x, y, z) => 0.85 + 0.15 * Math.abs(Math.sin(Math.atan2(x, y) * 3 + z * 30)));
    pc("dos", new THREE.CylinderGeometry(0.065, 0.06, 0.12, detail ? 12 : 6), -0.27, 0.58, 0.07, gamelle); // la gamelle, debout
    if (detail) {
      pc("dos", new THREE.CylinderGeometry(0.066, 0.066, 0.012, 12), -0.27, 0.645, 0.07, gamelle); // (son couvercle)
      pc("dos", new THREE.CylinderGeometry(0.08, 0.08, 0.025, 12), -0.345, 0.25, 0, gamelle, 0, 0, Math.PI / 2); // la poêle, sanglée derrière
      pc("dos", new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), -0.35, 0.12, 0, K.noir); // (son manche)
      pc("dos", new THREE.CylinderGeometry(0.03, 0.026, 0.06, 8), -0.12, -0.02, 0.2, gamelle); // le quart, au ceinturon
      for (const y of [0.18, 0.36]) pc("dos", galet(0.2, 0.014, 0.31, 0.3, 4), -0.245, y, 0, K.cuir); // les courroies du havresac
    }
    // le BIDON ROND (couvert de drap) sur la hanche gauche, et la MUSETTE à droite (plus grosse qu'avant)
    pc("dos", new THREE.SphereGeometry(0.075, detail ? 12 : 6, detail ? 8 : 5), -0.06, -0.06, -0.215, 0x5e5040);
    dernier().echelle = [1, 1.1, 0.5];
    pc("dos", galet(0.12, 0.13, 0.06, 0.4, detail ? 8 : 5), 0.0, -0.08, 0.215, K.sac);
  }
  function equipementSkin(pc, K, detail, S, s, anneau, peint, mat) {
    const B = (lx, ly, lz) => new THREE.BoxGeometry(lx, ly, lz);
    if (S.ecussonSoin) for (const k of [0, 1]) { // ✍️ « une petite croix rouge avec un carré blanc sur son bras » (les deux bras)
      const e = "epaule" + k, cote = k ? -1 : 1;
      pc(e, galet(0.07, 0.07, 0.016, 0.25, detail ? 6 : 4), 0.004, -0.165, cote * 0.05, K.soin, cote * -0.08, 0, 0);
      pc(e, B(0.048, 0.014, 0.008), 0.004, -0.165, cote * 0.058, K.croix, cote * -0.08, 0, 0);
      pc(e, B(0.014, 0.048, 0.008), 0.004, -0.165, cote * 0.058, K.croix, cote * -0.08, 0, 0);
    }
    if (S.ecussonSoin) for (const z of [-1, 1]) pc("dos", galet(0.07, 0.09, 0.05, 0.35, detail ? 8 : 5), 0.1, -0.02, z * 0.205, K.sac); // les poches de hanche, sur la ceinture
    if (S.harnais) { // les bretelles en H, sur le devant du gilet lourd, et la sangle de poitrine
      for (const z of [-0.085, 0.085]) pc("dos", galet(0.016, 0.24, 0.04, 0.3, 4), 0.232, 0.36, z, K.sangle, 0, 0, -0.08);
      if (detail) pc("dos", galet(0.014, 0.03, 0.2, 0.3, 4), 0.236, 0.41, 0, K.sangle);
      pc("dos", galet(0.07, 0.1, 0.13, 0.35, detail ? 8 : 5), 0.215, 0.37, 0, K.rabat); // la poche radio sur la poitrine
    }
    if (S.bandouliere) { // la SANGLE en travers de la poitrine (de l'épaule gauche à la hanche droite), et dans le dos
      pc("dos", galet(0.018, 0.6, 0.05, 0.3, 4), 0.235, 0.22, 0.02, K.sangle, -0.62, 0, 0);
      pc("dos", galet(0.018, 0.6, 0.05, 0.3, 4), -0.33, 0.22, 0.02, K.sangle, 0.62, 0, 0);
      for (const z of [-0.105, 0.105]) pc("dos", new THREE.CylinderGeometry(0.026, 0.026, 0.085, detail ? 10 : 6), 0.205, 0.37, z, K.gilet); // 2 poches à grenade en haut du gilet
    }
    if (S.roquette) { // ✍️ la ROQUETTE dans le dos (de décor) : la queue et ses ailettes, le corps, l'ogive pointue
      const R = (geo, y, c) => pc("dos", geo, -0.3 + y * -0.12, 0.42 + y, 0.13 + y * 0.12, c, 0.12, 0, 0.12);
      R(new THREE.CylinderGeometry(0.02, 0.02, 0.36, detail ? 10 : 6), 0.08, K.roquette);
      R(new THREE.CylinderGeometry(0.044, 0.03, 0.08, detail ? 14 : 7), 0.3, K.ogive);
      R(new THREE.CylinderGeometry(0.044, 0.044, 0.1, detail ? 14 : 7), 0.39, K.ogive);
      R(new THREE.CylinderGeometry(0.012, 0.044, 0.2, detail ? 14 : 7), 0.54, K.ogive);
      if (detail) {
        R(new THREE.CylinderGeometry(0.004, 0.012, 0.04, 8), 0.66, K.metal);
        for (let a = 0; a < 2; a++) pc("dos", B(0.004, 0.07, 0.07), -0.293, 0.35, 0.122, K.roquette, 0.12, (a * Math.PI) / 2, 0.12); // (les ailettes, en croix)
      }
    }
  }

  // Fabriquer la forme d'un soldat dans une pose (les os déjà tournés) : chaque pièce est placée là où son os la met.
  // pourChair = true : on écrit aussi, pour chaque point, le numéro de son os (le « skinning ») et on reste « au repos ».
  // ✍️ (demande 126) une pièce peut dire, point par point, qu'elle est accrochée à DEUX os (« poids » : le genou à moitié à
  // la cuisse, à moitié au tibia). Pour la chair et os, c'est la carte graphique qui mélange ; pour une figurine immobile
  // (le pilote assis), on fait le mélange ici, une fois pour toutes. Et les points partagés entre deux triangles ne
  // sont plus recopiés (des « index ») : 3 à 4 fois moins de points à déplacer pour la carte graphique.
  const TEMP = new THREE.Object3D();
  const nomsOs = (q) => ({ corps: q.corps, dos: q.dos, cou: q.cou, jambe0: q.jambes[0], genou0: q.genoux[0], jambe1: q.jambes[1], genou1: q.genoux[1], epaule0: q.epaules[0], coude0: q.coudes[0], epaule1: q.epaules[1], coude1: q.coudes[1] });
  let repos = null; // (un squelette au garde-à-vous, pour savoir où est chaque os « au repos »)
  const _p = new THREE.Vector3(), _pa = new THREE.Vector3(), _n = new THREE.Vector3(), _na = new THREE.Vector3(), _mz = new THREE.Matrix4(), _mt = new THREE.Matrix4();
  function cuire(liste, squel, M, pourChair) {
    const parMat = { tenue: [], teinte: [] }, index = new Map(squel.liste.map((b, i) => [b, i]));
    const noms = nomsOs(squel);
    if (!repos) (repos = os()), repos.corps.updateMatrixWorld(true);
    const nomsR = nomsOs(repos);
    squel.corps.updateMatrixWorld(true);
    const racine = new THREE.Matrix4().copy(squel.corps.parent ? squel.corps.parent.matrixWorld : new THREE.Matrix4()).invert();
    // (pour une figurine) ce que chaque os a bougé depuis le repos, et la même chose pour les normales
    const D = {}, DN = {};
    if (!pourChair) for (const k in noms) (D[k] = new THREE.Matrix4().multiplyMatrices(racine, noms[k].matrixWorld).multiply(new THREE.Matrix4().copy(nomsR[k].matrixWorld).invert())), (DN[k] = new THREE.Matrix3().getNormalMatrix(D[k]));
    const c = new THREE.Color();
    let melanges = 0, sommets = 0;
    for (const pc of liste) {
      TEMP.position.set(pc.x, pc.y, pc.z);
      TEMP.rotation.set(pc.rx, pc.ry, pc.rz);
      TEMP.scale.set(...(pc.echelle || [1, 1, 1]));
      TEMP.updateMatrix();
      const m = new THREE.Matrix4().copy(nomsR[pc.os].matrixWorld);
      if (pc.rz2) m.multiply(_mt.makeTranslation(pc.x, pc.y, pc.z)).multiply(_mz.makeRotationZ(pc.rz2)).multiply(_mt.makeTranslation(-pc.x, -pc.y, -pc.z)); // (demande 93 : un anneau penché avec le casque)
      m.multiply(TEMP.matrix);
      const g = pc.geo.clone(), n = g.attributes.position.count, loc = g.attributes.position;
      if (!g.index) { const ix = new (n > 65535 ? Uint32Array : Uint16Array)(n); for (let i = 0; i < n; i++) ix[i] = i; g.setIndex(new THREE.BufferAttribute(ix, 1)); }
      for (const a in g.attributes) if (!["position", "normal", "uv"].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
      if (pc.couleur !== "tenue") {
        c.set(pc.couleur);
        const t = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          // (demande 92) des nuances peintes selon la place du point dans sa pièce (le visage, le bout des bottes…)
          const f = pc.peint ? pc.peint(loc.getX(i), loc.getY(i), loc.getZ(i)) : 1, fr = f[0] || f, fg = f[1] || f, fb = f[2] || f;
          (t[i * 3] = c.r * fr), (t[i * 3 + 1] = c.g * fg), (t[i * 3 + 2] = c.b * fb);
        }
        g.setAttribute("color", new THREE.BufferAttribute(t, 3));
        const mat0 = pc.mat !== undefined ? pc.mat : (liste.matieres && liste.matieres.get(pc.couleur)) || 0, mats = new Float32Array(n).fill(mat0); // (demande 128 : ou la matière dite par la pièce)
        if (pc.matiere) for (let i = 0; i < n; i++) mats[i] = pc.matiere(loc.getX(i), loc.getY(i), loc.getZ(i)); // (demande 93 : la barbe de 3 jours)
        g.setAttribute("matiere", new THREE.BufferAttribute(mats, 1)); // (demande 92 : la peau, le nylon, le cuir…)
      }
      // (demande 126) les poids de chaque point : [l'os a, l'os b, la part de b], lus AVANT de placer la pièce
      let P = null;
      if (pc.poids) {
        P = new Array(n);
        for (let i = 0; i < n; i++) {
          const q = pc.poids(loc.getX(i), loc.getY(i), loc.getZ(i));
          P[i] = q;
          if (q[2] > 0.02 && q[2] < 0.98) melanges++;
        }
      }
      sommets += n;
      g.applyMatrix4(m); // (au repos)
      if (pourChair) {
        const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), k = index.get(noms[pc.os]);
        for (let i = 0; i < n; i++) {
          if (P) (si[i * 4] = index.get(noms[P[i][0]])), (si[i * 4 + 1] = index.get(noms[P[i][1]])), (sw[i * 4] = 1 - P[i][2]), (sw[i * 4 + 1] = P[i][2]);
          else (si[i * 4] = k), (sw[i * 4] = 1);
        }
        g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
        g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
      } else if (!P) g.applyMatrix4(D[pc.os]);
      else { // (une figurine : on mélange ici les deux os, point par point)
        const pos = g.attributes.position, nor = g.attributes.normal;
        for (let i = 0; i < n; i++) {
          const [a, b, w] = P[i];
          _p.fromBufferAttribute(pos, i);
          _pa.copy(_p).applyMatrix4(D[a]).multiplyScalar(1 - w).add(_p.applyMatrix4(D[b]).multiplyScalar(w));
          pos.setXYZ(i, _pa.x, _pa.y, _pa.z);
          _n.fromBufferAttribute(nor, i);
          _na.copy(_n).applyMatrix3(DN[a]).multiplyScalar(1 - w).add(_n.applyMatrix3(DN[b]).multiplyScalar(w)).normalize();
          nor.setXYZ(i, _na.x, _na.y, _na.z);
        }
      }
      parMat[pc.couleur === "tenue" ? "tenue" : "teinte"].push(g);
    }
    const res = {};
    for (const nom in parMat) {
      const geos = parMat[nom];
      if (!geos.length) continue;
      const attrs = ["position", "normal", "uv"].concat(nom === "teinte" ? ["color", "matiere"] : [], pourChair ? ["skinIndex", "skinWeight"] : []);
      const geo = new THREE.BufferGeometry();
      for (const a of attrs) {
        const taille = geos[0].attributes[a].itemSize, Type = a === "skinIndex" ? Uint16Array : Float32Array;
        const tab = new Type(geos.reduce((t, g) => t + g.attributes[a].count * taille, 0));
        let k = 0;
        for (const g of geos) (tab.set(g.attributes[a].array.subarray(0, g.attributes[a].count * taille), k), (k += g.attributes[a].count * taille));
        geo.setAttribute(a, new THREE.BufferAttribute(tab, taille));
      }
      // les index (les triangles), décalés pour chaque pièce
      const total = geos.reduce((t, g) => t + g.index.count, 0), nb = geo.attributes.position.count;
      const ix = new (nb > 65535 ? Uint32Array : Uint16Array)(total);
      let k = 0, base = 0;
      for (const g of geos) {
        const src = g.index.array;
        for (let i = 0; i < g.index.count; i++) ix[k++] = src[i] + base;
        base += g.attributes.position.count;
      }
      geo.setIndex(new THREE.BufferAttribute(ix, 1));
      geo.computeBoundingSphere();
      res[nom] = geo;
    }
    // (l'ombre des creux : pour les soldats, fabriqués d'avance, et les silhouettes ; pas pour les figurines assises dans les
    // engins, fabriquées quand l'engin arrive : ce serait un à-coup, pour un soldat qu'on voit à peine)
    if (pourChair || liste.ombrer) {
      const tOmbre = performance.now();
      ombrer(res, liste.detail !== false);
      bilanOmbres.ms += performance.now() - tOmbre;
      bilanOmbres.formes++;
    }
    Object.defineProperty(res, "bilan", { value: { melanges, sommets }, enumerable: false }); // (pas une forme : le compte)
    return res;
  }
  // ✍️ (demande 128, « moins jouet ») L'OMBRE DANS LES CREUX : un vrai objet est plus sombre là où la lumière du ciel
  // n'arrive pas bien (sous le gilet, entre les poches, aux aisselles, entre les jambes, sous le bord du casque). On la
  // mesure UNE fois, quand la forme est fabriquée : on range toute la surface du soldat dans une grille de petites cases
  // (comme des briques de Lego), puis, depuis chaque point, on lance quelques « rayons » vers l'extérieur : plus ils
  // tombent vite sur une case pleine, plus le point est dans un creux. Le tissu camouflé garde cette ombre dans « ombre »
  // (le peintre de la carte graphique s'en sert) ; le reste l'a directement dans ses couleurs. Rien à calculer en jouant.
  const bilanOmbres = { formes: 0, ms: 0, moyenne: 0 };
  const RAYONS = [];
  function ombrer(res, detail) {
    const R = Tanks.CONFIG.realisme.soldats.skins && Tanks.CONFIG.realisme.soldats.skins.ombres;
    if (!R || !(R.force > 0)) return;
    const geos = ["tenue", "teinte"].map((k) => res[k]).filter(Boolean), c = R.cellule[detail ? 0 : 1];
    if (!RAYONS.length) { // (les directions, autour de la normale : 1 droit devant, puis en couronne à 50°)
      RAYONS.push([0, 0, 1]);
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; RAYONS.push([Math.cos(a) * 0.77, Math.sin(a) * 0.77, 0.64]); }
    }
    const nR = Math.min(RAYONS.length, R.rayons || 7);
    // 1. la grille : la boîte autour du soldat, en cases de « c » m
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (const g of geos) { const p = g.attributes.position.array; for (let i = 0; i < p.length; i += 3) (x0 = Math.min(x0, p[i])), (x1 = Math.max(x1, p[i])), (y0 = Math.min(y0, p[i + 1])), (y1 = Math.max(y1, p[i + 1])), (z0 = Math.min(z0, p[i + 2])), (z1 = Math.max(z1, p[i + 2])); }
    const nx = Math.ceil((x1 - x0) / c) + 2, ny = Math.ceil((y1 - y0) / c) + 2, nz = Math.ceil((z1 - z0) / c) + 2, plein = new Uint8Array(nx * ny * nz);
    const cle = (x, y, z) => { const i = Math.floor((x - x0) / c), j = Math.floor((y - y0) / c), k = Math.floor((z - z0) / c); return i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz ? -1 : (j * nz + k) * nx + i; };
    for (const g of geos) { // (on pose des points sur chaque triangle, assez serrés pour ne pas laisser de trou)
      const p = g.attributes.position.array, ix = g.index.array;
      for (let t = 0; t < ix.length; t += 3) {
        const a = ix[t] * 3, b = ix[t + 1] * 3, d = ix[t + 2] * 3;
        const l = Math.max(Math.abs(p[a] - p[b]) + Math.abs(p[a + 1] - p[b + 1]) + Math.abs(p[a + 2] - p[b + 2]), Math.abs(p[a] - p[d]) + Math.abs(p[a + 1] - p[d + 1]) + Math.abs(p[a + 2] - p[d + 2]));
        const m = Math.min(8, Math.ceil(l / c));
        for (let u = 0; u <= m; u++) for (let v = 0; v <= m - u; v++) {
          const fu = u / m || 0, fv = v / m || 0, fw = 1 - fu - fv, k = cle(p[a] * fw + p[b] * fu + p[d] * fv, p[a + 1] * fw + p[b + 1] * fu + p[d + 1] * fv, p[a + 2] * fw + p[b + 2] * fu + p[d + 2] * fv);
          if (k >= 0) plein[k] = 1;
        }
      }
    }
    // 2. depuis chaque point : des rayons à 2, 3,5 et 5,5 cases (pas plus près : on toucherait sa propre surface)
    const PAS = [2.1, 3.5, 5.5], POIDS = [1, 0.7, 0.45];
    let somme = 0, total = 0;
    for (const g of geos) {
      const p = g.attributes.position.array, nn = g.attributes.normal.array, n = p.length / 3, o = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const px = p[i * 3], py = p[i * 3 + 1], pz = p[i * 3 + 2], ax = nn[i * 3], ay = nn[i * 3 + 1], az = nn[i * 3 + 2];
        // (deux directions perpendiculaires à la normale)
        let tx = ay, ty = -ax, tz = 0;
        if (Math.abs(az) > 0.9) (tx = 0), (ty = az), (tz = -ay);
        const lt = Math.hypot(tx, ty, tz) || 1;
        tx /= lt; ty /= lt; tz /= lt;
        const bx = ay * tz - az * ty, by = az * tx - ax * tz, bz = ax * ty - ay * tx;
        let occ = 0;
        for (let r = 0; r < nR; r++) {
          const [u, v, w] = RAYONS[r], dx = tx * u + bx * v + ax * w, dy = ty * u + by * v + ay * w, dz = tz * u + bz * v + az * w;
          for (let q = 0; q < PAS.length; q++) {
            const k = cle(px + dx * PAS[q] * c, py + dy * PAS[q] * c, pz + dz * PAS[q] * c);
            if (k >= 0 && plein[k]) { occ += POIDS[q]; break; }
          }
        }
        o[i] = Math.min(1, occ / nR) * R.force;
        somme += o[i]; total++;
      }
      if (g.attributes.color) { const col = g.attributes.color.array; for (let i = 0; i < n; i++) { const f = 1 - o[i]; col[i * 3] *= f; col[i * 3 + 1] *= f; col[i * 3 + 2] *= f; } }
      else g.setAttribute("ombre", new THREE.BufferAttribute(o, 1));
    }
    bilanOmbres.moyenne = total ? somme / total : 0;
  }

  // Les armes, dans les mains (dans le repère du dos : x devant, y en haut, z à droite). Fabriquées une fois.
  const geoArmes = {};
  function formesArmes(detail) {
    const cle = detail ? "d" : "s";
    if (geoArmes[cle]) return geoArmes[cle];
    const K = matsSoldat("bleus").couleurs, mat = matsSoldat("bleus").arme;
    const fab = (remplir) => {
      const g = new THREE.Group();
      remplir((geo, x, y, z, couleur, rx, ry, rz) => {
        const m = OT.piece(geo, mat, x, y, z, couleur);
        m.rotation.set(rx || 0, ry || 0, rz || 0);
        g.add(m);
        return m;
      }, g);
      const [piece] = OT.souder(g);
      return piece.geometry;
    };
    // le FUSIL (comme un M4) : de la crosse (x = −0,1) au cache-flamme (x = 0,78)
    const fusil = fab((p, g) => {
      p(galet(0.17, 0.075, 0.045, 0.3, 8), -0.02, -0.005, 0, K.polymere); // la crosse
      p(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 8), 0.08, 0.02, 0, K.arme, 0, 0, Math.PI / 2); // le tube de crosse
      g.add(OT.profil([[0.12, -0.025], [0.12, 0.035], [0.43, 0.035], [0.43, -0.02], [0.33, -0.03], [0.3, -0.045], [0.2, -0.045], [0.16, -0.025]], 0.048, mat, 0.008, K.arme)); // le boîtier
      g.add(OT.profil([[0.17, -0.035], [0.215, -0.035], [0.2, -0.135], [0.155, -0.125]], 0.034, mat, 0.006, K.polymere)); // la poignée
      if (detail) {
        g.add(OT.profil([[0.33, -0.04], [0.28, -0.04], [0.25, -0.21], [0.305, -0.225]], 0.03, mat, 0.005, K.arme)); // le chargeur courbe
        p(galet(0.24, 0.062, 0.062, 0.25, 8), 0.55, 0.005, 0, K.polymere); // le garde-main
        p(new THREE.BoxGeometry(0.5, 0.012, 0.024), 0.42, 0.042, 0, K.arme); // le rail du dessus
        for (const z of [-0.033, 0.033]) p(new THREE.BoxGeometry(0.22, 0.012, 0.008), 0.55, 0.005, z, K.arme); // les rails de côté
        p(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), 0.3, 0.085, 0, K.arme, 0, 0, Math.PI / 2); // le viseur
        p(new THREE.CylinderGeometry(0.019, 0.019, 0.004, 12), 0.351, 0.085, 0, K.verre, 0, 0, Math.PI / 2); // sa lentille
        p(new THREE.BoxGeometry(0.03, 0.035, 0.02), 0.3, 0.058, 0, K.arme); // son support
        p(new THREE.BoxGeometry(0.012, 0.045, 0.012), 0.66, 0.06, 0, K.arme); // le guidon
        p(galet(0.04, 0.05, 0.03, 0.4, 6), 0.47, -0.05, 0, K.polymere); // la poignée avant
      } else {
        g.add(OT.profil([[0.33, -0.04], [0.28, -0.04], [0.26, -0.2], [0.31, -0.21]], 0.03, mat, 0, K.arme));
        p(new THREE.BoxGeometry(0.24, 0.06, 0.06), 0.55, 0.005, 0, K.polymere);
      }
      p(new THREE.CylinderGeometry(0.012, 0.012, 0.12, 8), 0.72, 0.005, 0, K.arme, 0, 0, Math.PI / 2); // le canon
      p(new THREE.CylinderGeometry(0.017, 0.017, 0.05, 8), 0.785, 0.005, 0, K.arme, 0, 0, Math.PI / 2); // le cache-flamme
    });
    const pistolet = fab((p, g) => {
      g.add(OT.profil([[-0.05, 0.0], [-0.05, 0.035], [0.13, 0.035], [0.13, 0.0]], 0.03, mat, 0.005, K.arme));
      g.add(OT.profil([[-0.045, 0.0], [0.0, 0.0], [-0.02, -0.1], [-0.06, -0.095]], 0.03, mat, 0.005, K.polymere));
    });
    const roquettes = fab((p) => {
      p(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 14), 0, 0, 0, 0x4b5a34, 0, 0, Math.PI / 2); // le tube
      p(new THREE.CylinderGeometry(0.085, 0.07, 0.12, 14), 0.52, 0, 0, 0x3c4a2a, 0, 0, Math.PI / 2); // l'embout
      p(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), -0.48, 0, 0, 0x3c4a2a, 0, 0, Math.PI / 2);
      p(galet(0.06, 0.12, 0.04, 0.4, 6), 0.1, -0.1, 0, K.polymere); // la poignée
      p(galet(0.08, 0.06, 0.05, 0.3, 6), 0.05, 0.09, 0.05, K.arme); // le viseur
    });
    return (geoArmes[cle] = { fusil, pistolet, roquettes, mat });
  }
  const PLACE_ARMES = { fusil: [0.2, 0.28, 0.1], pistolet: [0.48, 0.3, 0.03], roquettes: [0.15, 0.5, 0.15] };
  // Où vont les mains pour chaque arme (dans le repère du dos).
  const MAINS = {
    fusil: { droite: [0.38, 0.21, 0.1], gauche: [0.66, 0.24, 0.07] },
    pistolet: { droite: [0.44, 0.27, 0.05], gauche: [0.43, 0.25, -0.01] },
    roquettes: { droite: [0.3, 0.41, 0.15], gauche: [0.55, 0.42, 0.12] },
    // (étape 74) à la corde : les deux mains au-dessus de la tête, l'une au-dessus de l'autre, sur la corde (devant lui)
    corde: { droite: [0.16, 0.9, 0.01], gauche: [0.16, 0.7, -0.01] },
  };

  // La forme « chair et os » (une par équipe, par version et par couleur de peau), partagée par tous les soldats.
  const formes = {};
  // (demande 114 : et par CLASSE ; fabriquée la 1re fois qu'on en a besoin, comptée sous le capot)
  const maquettes = { formes: 0, ms: 0, triangles: { detail: 0, simple: 0 }, parClasse: {} };
  function formeSoldat(equipe, detail, peau, joueur, classe, barbe) {
    const cle = [equipe, detail, peau, joueur, classe, barbe].join(":");
    if (formes[cle]) return formes[cle];
    const squel = os(), t0 = performance.now();
    const f = (formes[cle] = cuire(pieces(equipe, detail, PEAUX[peau], joueur, classe, barbe), squel, matsSoldat(equipe), true));
    maquettes.formes++;
    maquettes.ms += performance.now() - t0;
    maquettes.triangles[detail ? "detail" : "simple"] = Math.round((f.tenue.index.count + f.teinte.index.count) / 3);
    if (detail) Object.assign(Tanks.Corps3D.bilan, { sommets: f.bilan.sommets, melanges: f.bilan.melanges }); // (demande 126, sous le capot)
    return f;
  }
  // ✍️ (demande 127, « plus jamais de lag ») FABRIQUER D'AVANCE : chaque forme (camp, classe, peau, détail) prend du temps à
  // fabriquer ; avant, la 1re fois qu'un soldat d'une nouvelle classe ou d'une nouvelle peau arrivait EN PLEIN COMBAT, l'image
  // ramait. Maintenant la scène les fabrique pendant le menu (une par image, dans la tirelire de temps) et finit au début de la
  // bataille (le moment du chargement). « preparerUneForme » en fabrique une ; faux quand tout est prêt.
  let aPreparer = null;
  const PARA = {}; // (demande 127 : la forme du parachute, partagée)
  function preparerUneForme() {
    if (!aPreparer) {
      aPreparer = [];
      for (const equipe of ["bleus", "rouges"]) for (const classe of Object.keys(Tanks.CONFIG.classes)) for (let peau = 0; peau < PEAUX.length; peau++) for (const detail of [true, false]) aPreparer.push([equipe, detail, peau, false, classe, undefined]);
      // (demande 128) et TON soldat (ta peau, chaque classe) : sinon ses 2 formes étaient fabriquées au début de la bataille
      for (const classe of Object.keys(Tanks.CONFIG.classes)) for (const detail of [true, false]) aPreparer.unshift(["bleus", detail, 0, true, classe, undefined]);
    }
    const x = aPreparer.shift();
    if (!x) return false;
    x[0] = habit(x[0], x[4]); // (demande 128 : la forme du skin de sa classe)
    formeSoldat(...x);
    return aPreparer.length > 0;
  }
  // ✍️ (demande 114) LA CLASSE qu'on dessine pour ce soldat : toi, ta classe ; l'ordinateur, celle qui va avec son rôle
  // (voir config.js, « realisme.soldats.maquettes »). L'affichage lit seulement le soldat, il ne change rien.
  function classeDe(s) {
    if (s.joueur || (s.figurant && Tanks.CONFIG.classes[s.classe])) return Tanks.CONFIG.classes[s.classe] ? s.classe : "assaut"; // (demande 130 : un figurant de film a sa classe)
    if (s.medecin || s.role === "infirmier") return "medecin";
    if (s.roquettesIA || s.arme === "roquettes" || s.role === "mecanicien") return "ingenieur";
    if (s.tireurElite) return "eclaireur";
    return "assaut";
  }
  // Un squelette tout neuf (ses os), habillé de la forme partagée.
  let numeroSoldat = 0;
  function squelette(equipe, joueur, detail, peau, classe, barbe) {
    const M = matsSoldat(equipe), formesCorps = formeSoldat(equipe, detail, peau, !!joueur, classe, barbe), r = os();
    const porteur = new THREE.Group(), squel = new THREE.Skeleton(r.liste);
    // (demande 96) un squelette « gelé » n'est pas recalculé ni renvoyé à la carte graphique à cette image (la scène gèle
    // les soldats assez loin une image sur deux : ils bougent à 30 images par seconde au lieu de 60, on ne le voit pas)
    squel.gele = false;
    squel.update = function () { if (!this.gele) THREE.Skeleton.prototype.update.call(this); };
    for (const nom of ["tenue", "teinte"]) {
      const m = new THREE.SkinnedMesh(formesCorps[nom], M[nom]);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // (il bouge : sa bulle de départ ne suffit pas)
      porteur.add(m);
      if (nom === "tenue") m.add(r.corps);
      m.bind(squel);
    }
    // (demande 88) le PORTE-ARME : l'arme de CE soldat (fabriquée par l'armurier, affichage/armes3d.js) y est accrochée
    const porteArme = new THREE.Group();
    r.dos.add(porteArme);
    const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    flamme.scale.set(1.6, 0.8, 0.8);
    porteArme.add(flamme);
    return { porteur, squel, corps: r.corps, dos: r.dos, cou: r.cou, jambes: r.jambes, genoux: r.genoux, epaules: r.epaules, coudes: r.coudes, porteArme, objetArme: null, cleArme: null, torsion: 0, flamme, pose: null };
  }

  // La « cinématique inverse » à 2 os : l'épaule S, la main voulue M ; on cherche le coude.
  // (Le triangle épaule-coude-main a deux côtés connus, le bras et l'avant-bras, et le troisième côté, c'est la
  // distance de l'épaule à la main : la loi des cosinus donne l'angle à l'épaule.)
  // (demande 129 : avec des vecteurs RÉUTILISÉS : avant, chaque bras de chaque soldat fabriquait 7 vecteurs neufs à chaque image)
  const BAS = new THREE.Vector3(0, -1, 0), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
  const _ikV = new THREE.Vector3(), _ikP = new THREE.Vector3(), _ikC = new THREE.Vector3(), _ikM = new THREE.Vector3(), _ikT = new THREE.Vector3();
  function poserBras(epaule, coude, cible, pole) {
    const S = epaule.position, a = OS.bras, b = OS.avantBras + 0.01;
    const vers = _ikV.fromArray(cible).sub(S), d = Math.min(a + b - 0.001, Math.max(0.05, vers.length()));
    vers.normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const p = _ikP.copy(pole).sub(_ikT.copy(vers).multiplyScalar(pole.dot(vers))).normalize();
    const coudeEn = _ikC.copy(vers).multiplyScalar(a * cosA).add(p.multiplyScalar(a * sinA));
    const main = _ikM.copy(vers).multiplyScalar(d);
    q1.setFromUnitVectors(BAS, _ikT.copy(coudeEn).normalize());
    epaule.quaternion.copy(q1);
    q2.setFromUnitVectors(BAS, main.sub(coudeEn).normalize());
    coude.quaternion.copy(q3.copy(q1).invert().multiply(q2));
  }
  const POLES = [new THREE.Vector3(-0.3, -1, 0.8), new THREE.Vector3(-0.3, -1, -0.8)]; // (les coudes vont en bas et vers l'extérieur)
  const POLES_CORDE = [new THREE.Vector3(0.4, -0.2, 1), new THREE.Vector3(0.4, -0.2, -1)]; // (à la corde : coudes écartés, vers l'avant)
  function tenir(r, arme) {
    if (r.pose === arme) return;
    r.pose = arme;
    const m = MAINS[arme], poles = arme === "corde" ? POLES_CORDE : POLES;
    poserBras(r.epaules[0], r.coudes[0], m.droite, poles[0]);
    poserBras(r.epaules[1], r.coudes[1], m.gauche, poles[1]);
  }

  // (demande 114) visage : { peau, barbe } pour la vitrine des personnages (sinon : à tour de rôle)
  function soldat(equipe, joueur, classe, visage) {
    equipe = habit(equipe, classe); // ✍️ (demande 128) le skin de sa classe
    const V = visage || {}, g = new THREE.Group(), peau = V.peau !== undefined ? V.peau % PEAUX.length : joueur ? 0 : numeroSoldat++ % PEAUX.length;
    if (classe) maquettes.parClasse[classe] = (maquettes.parClasse[classe] || 0) + 1;
    const detail = squelette(equipe, joueur, true, peau, classe, V.barbe), simple = V.seulDetail ? null : squelette(equipe, joueur, false, peau, classe, V.barbe);
    g.add(detail.porteur);
    if (simple) (g.add(simple.porteur), (simple.porteur.visible = false));
    // le parachute (pour toi, quand tu t'éjectes de l'avion ; et, étape 64, pour les parachutistes)
    let parachute = null;
    {
      const m = mats();
      parachute = new THREE.Group();
      // (demande 127) la voile et les fils sont PARTAGÉS par tous les soldats (avant : fabriqués pour chaque nouveau soldat,
      // même en plein combat, et le navigateur devait ensuite les jeter)
      if (!PARA.voile) (PARA.voile = new THREE.SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35)), (PARA.tissu = new THREE.MeshStandardMaterial({ color: 0x8a9a5a, roughness: 0.9, side: THREE.DoubleSide })), (PARA.fil = new THREE.CylinderGeometry(0.01, 0.01, 4.5, 4));
      const voile = new THREE.Mesh(PARA.voile, PARA.tissu);
      voile.position.y = 2.2;
      parachute.add(voile);
      for (const [x, z] of [[1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]]) {
        const fil = new THREE.Mesh(PARA.fil, m.noir);
        fil.castShadow = true;
        fil.position.set(x / 2, 3.6, z / 2);
        fil.lookAt(new THREE.Vector3(0, 1.4, 0));
        fil.rotateX(Math.PI / 2);
        parachute.add(fil);
      }
      parachute.position.y = 1.5;
      parachute.visible = false;
      g.add(parachute);
    }
    return { g, detail, simple, parachute, classe, peau };
  }

  // (demande 88) ACCROCHER LA VRAIE ARME dans les mains (ou dans le dos, à la corde). Chaque famille se tient à sa façon :
  //   place : où va le haut de la poignée (devant le dos, en m : x devant, y en haut, z à droite) ;
  //   torsion : de combien le haut du corps tourne (rad) pour que la main gauche atteigne le garde-main.
  // Les mains vont ensuite sur la POIGNÉE et sur le GARDE-MAIN de CETTE arme (la cinématique inverse plie les coudes).
  const TENUES = {
    fusil: { place: [0.33, 0.36, 0.13], torsion: -0.55 },
    pistolet: { place: [0.45, 0.33, 0.04], torsion: -0.2 },
    roquettes: { place: [0.3, 0.44, 0.17], torsion: -0.6 },
  };
  const _v = new THREE.Vector3(), _axeY = new THREE.Vector3(0, 1, 0);
  function porterArme(r, modele, famille, corde) {
    const cle = modele.cle + ":" + famille + (corde ? ":dos" : "");
    if (r.cleArme === cle) return r.poseArme;
    r.cleArme = cle;
    if (r.objetArme) r.porteArme.remove(r.objetArme);
    r.objetArme = Tanks.Armes3D.exemplaire(modele);
    r.porteArme.add(r.objetArme);
    r.flamme.position.copy(modele.bouche).add(new THREE.Vector3(0.06, 0, 0));
    // (demande 92) les points de CETTE arme que les mains attrapent (la poignée, le garde-main, le chargeur)
    r.mainD = modele.poignee.centre;
    r.mainG = modele.garde.centre;
    r.chargeurArme = modele.chargeur ? new THREE.Vector3(modele.chargeur.x, modele.chargeur.y - 0.05, 0) : null;
    // ✍️ (demande 129) le LEVIER d'armement (ou la boule du verrou) que la main gauche tire à la fin du rechargement, et le
    // CHARGEUR de cette arme : une copie (les mêmes formes) va dans la main pendant qu'on le change
    r.levierArme = modele.levier ? new THREE.Vector3(modele.levier.x, modele.levier.y, modele.levier.z || 0) : new THREE.Vector3(r.mainD.x + 0.08, (modele.by || 0) + 0.035, -0.045);
    r.groupeChargeur = r.objetArme.getObjectByName("chargeur") || null;
    if (r.chargeurMain) r.dos.remove(r.chargeurMain);
    r.chargeurMain = null;
    if (r.chargeurArme && famille !== "roquettes") {
      r.chargeurMain = new THREE.Group();
      // (l'arme d'un soldat de l'ordinateur est soudée d'un seul morceau : son chargeur ne s'enlève pas ; alors la main
      // prend un chargeur tout simple, le même pour tous : une seule forme, une seule matière)
      if (r.groupeChargeur) r.chargeurMain.add(r.groupeChargeur.clone());
      else {
        if (!CHARGEUR_SIMPLE.geo) (CHARGEUR_SIMPLE.geo = new THREE.BoxGeometry(0.055, famille === "pistolet" ? 0.11 : 0.18, 0.024)), (CHARGEUR_SIMPLE.mat = new THREE.MeshStandardMaterial({ color: 0x26272a, roughness: 0.6, metalness: 0.4 }));
        const m = new THREE.Mesh(CHARGEUR_SIMPLE.geo, CHARGEUR_SIMPLE.mat);
        m.position.set(r.chargeurArme.x, r.chargeurArme.y - 0.04, 0);
        m.rotation.z = 0.2;
        m.castShadow = true;
        r.chargeurMain.add(m);
      }
      r.chargeurMain.visible = false;
      r.chargeurMain.userData.cle = cle;
      r.dos.add(r.chargeurMain);
    }
    r.chargeurTenu = 0; // (0 : rien en main ; 1 : le vide ; 2 : le neuf)
    if (corde) {
      r.torsion = 0;
      r.porteArme.position.copy(DANS_LE_DOS.position);
      r.porteArme.rotation.copy(DANS_LE_DOS.rotation);
      return (r.poseArme = "corde");
    }
    const T = TENUES[famille] || TENUES.fusil;
    r.torsion = T.torsion;
    r.tenue = T;
    r.porteArme.position.fromArray(T.place).applyAxisAngle(_axeY, -T.torsion);
    r.porteArme.rotation.set(0, -T.torsion, 0);
    // les mains : sur la poignée et sur le garde-main (ou la poignée avant) de cette arme, vues depuis le dos
    const versDos = (p) => _v.copy(p).applyAxisAngle(_axeY, -T.torsion).add(r.porteArme.position).toArray();
    const pose = "arme:" + modele.cle + ":" + famille;
    if (!MAINS[pose]) MAINS[pose] = { droite: versDos(modele.poignee.centre), gauche: versDos(modele.garde.centre) };
    r.pose = null; // (on repose les bras)
    return (r.poseArme = pose);
  }

  // L'animation : marcher, courir, tourner sur place, nager, tomber, (étape 74) glisser à la corde. t = l'horloge (s).
  const DANS_LE_DOS = { position: new THREE.Vector3(-0.27, 0.3, -0.05), rotation: new THREE.Euler(0.15, 0, -1.0) }; // (le fusil, à la corde)
  function animer(o, s, t, tourne, pres) {
    if (!o.simple) pres = true; // (demande 114 : la vitrine n'a que la version détaillée)
    const r = pres ? o.detail : o.simple;
    o.detail.porteur.visible = pres;
    if (o.simple) o.simple.porteur.visible = !pres;
    // (demande 88) LA VRAIE ARME de ce soldat : la tienne (avec ses pièces), ou celle tirée au sort pour lui (armes3d.js)
    const corde = !!s.corde && !s.mort;
    const modele = Tanks.Armes3D.pourSoldat(s, pres);
    const famille = modele.famille === "pistolet" ? "pistolet" : modele.famille === "roquettes" ? "roquettes" : "fusil";
    const arme = porterArme(r, modele, famille, corde); // (la « pose » des bras pour cette arme)
    r.porteArme.visible = !s.nage && !s.mort;
    if (s.joueur) Tanks.Armes3D.noterArmeDuJoueur(r.objetArme, modele);
    if ((s.joueur || r.objets) && (s.mort || corde || s.nage)) Tanks.Objets3D.troisieme(r, s, r.porteArme, _mD, _mG); // (livre n° 16 : à terre, à la corde, dans l'eau : rien en main)
    r.flamme.visible = s.tir > 0 && famille !== "roquettes" && !s.mort && !corde;
    const c = r.corps;
    if (s.mort) {
      // il tombe sur le dos en une demi-seconde, les bras ouverts
      // (étape 85) en avant ou en arrière selon sa chute (logique/soldat.js), à la vitesse de sa chute, un peu de travers
      // (étape 85, les vraies poses) chaque GENRE de chute a sa façon de bouger les os ; k va de 0 (touché) à 1 (couché)
      const ch = s.chute;
      let k = Math.min(1, ch ? Math.max(0, s.depuisMort - ch.debut) / ch.duree : s.depuisMort * 2);
      const doux = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x)); // (lent, puis vite, puis lent : plus naturel)
      const tombe = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x); // (une chute accélère, comme tout ce qui tombe)
      const de = (a, b) => Math.max(0, Math.min(1, (k - a) / (b - a))); // (une partie de la chute, entre a et b)
      // ✍️ (demande 129) TRAÎNÉ par un ami (logique/troupes.js : « s.aidePar » le traîne, « .traine ») : il est sur le dos,
      // la tête et les épaules vers celui qui le tire (un peu relevées : il le tient par le gilet), et il glisse avec lui
      const tireur = s.aidePar && !s.aidePar.mort && s.aidePar.traine && (s.aidePar.traine === s || Object.getPrototypeOf(s) === s.aidePar.traine) ? s.aidePar : null; // (la scène dessine une « vue » du soldat, faite à partir de lui)
      const genre = tireur ? "face" : ch ? ch.genre : "face", travers = ch && !tireur ? ch.travers : 0, Q = Math.PI / 2;
      if (tireur) k = 1;
      r.pose = null;
      r.dos.scale.y = 1;
      for (const e of r.epaules) e.quaternion.identity();
      for (const e of r.coudes) e.quaternion.identity();
      let pivot = 0, haut = 0, dos = 0, cou = 0, hanches = 0, genoux = 0, bras = 0.6, coude = 0.3, ecrase = 1, recul = 0;
      if (genre === "tete") {
        // 🎯 balle dans la tête : les jambes lâchent d'un coup (il s'affaisse), puis le corps bascule en avant
        const a = doux(de(0, 0.45)), b = tombe(de(0.35, 1));
        genoux = -1.7 * a * (1 - b * 0.6); hanches = 1.1 * a * (1 - b * 0.5); haut = -0.55 * a * (1 - b) + 0.12 * b;
        dos = 0.5 * a; cou = 0.7 * a; pivot = -Q * b; bras = 0.15 + 0.2 * b; coude = 0.1;
      } else if (genre === "dos" || genre === "ecrase") {
        // 🔙 touché dans le dos : il est poussé en avant, les bras partent devant pour se rattraper
        const b = tombe(k);
        pivot = -Q * b; haut = 0.12 * b; dos = 0.25 * Math.sin(Math.PI * k); cou = -0.3 * b; hanches = 0.2 * b; genoux = -0.25 * b;
        bras = 0.6 + 1.6 * doux(de(0, 0.6)); coude = 0.2;
        if (genre === "ecrase") ecrase = 1 - 0.7 * doux(de(0.5, 1)); // 🚜 écrasé : aplati
      } else if (genre === "genoux") {
        // 🧎 il tombe d'abord à genoux, reste un moment, puis bascule en avant
        const a = doux(de(0, 0.3)), b = tombe(de(0.57, 1));
        genoux = -2.0 * a * (1 - b * 0.7); hanches = 0.15 * a; haut = -0.5 * a * (1 - b) + 0.12 * b;
        dos = 0.25 * a + 0.3 * b; cou = 0.4 * a; pivot = -Q * b; bras = 0.3 + 1.2 * b; coude = 0.4;
      } else if (genre === "explosion") {
        // 💥 une explosion : il est projeté en arc, fait un tour en l'air et retombe sur le dos
        const v = doux(k);
        haut = Math.sin(Math.PI * Math.min(1, k * 1.15)) * 1.4 + 0.12 * v; recul = -2.4 * v;
        pivot = (Q + 2 * Math.PI) * v; bras = 1.8 * Math.sin(Math.PI * k) + 0.8; coude = 0.5; genoux = -0.8 * Math.sin(Math.PI * k);
        hanches = 0.6 * Math.sin(Math.PI * k);
      } else {
        // 🔜 touché de face : il part en arrière, les bras s'ouvrent en l'air
        const b = tombe(k);
        pivot = Q * b; haut = 0.12 * b; dos = -0.3 * Math.sin(Math.PI * k); cou = 0.35 * b; genoux = -0.45 * Math.sin(Math.PI * Math.min(1, k * 1.3));
        bras = 0.6 + 1.5 * Math.sin(Math.PI * Math.min(1, k * 1.4)); coude = 0.3;
      }
      // (étape 86, plus réaliste) 1. le CHOC : au moment où la balle touche, le corps sursaute (un petit coup en arrière
      // ou en avant, très rapide) ; 2. le REBOND : en touchant le sol, le corps rebondit un tout petit peu puis s'immobilise ;
      // 3. le corps n'est jamais SYMÉTRIQUE : chaque soldat a ses propres angles (tirés de son numéro), un bras plus
      // ouvert que l'autre, une jambe plus pliée ; 4. à la fin, la TÊTE roule sur le côté.
      const R = Tanks.CONFIG.soldats.realisme, apres = ch ? s.depuisMort - ch.debut - ch.duree : 0;
      const choc = R.choc * Math.exp(-s.depuisMort * 18) * Math.sin(s.depuisMort * 40) * (genre === "dos" ? -1 : 1);
      const rebond = apres > 0 && genre !== "ecrase" ? R.rebond * Math.exp(-apres * 7) * Math.abs(Math.sin(apres * 14)) : 0;
      const graine = ch ? ch.travers * 917.3 + ch.sens * 3.1 : 0, hasard = (n) => Math.sin(graine + n * 78.233) * 0.5; // (de -0,5 à 0,5 : tiré au hasard à sa chute, puis toujours le même)
      c.rotation.set(travers * k + hasard(1) * R.asymetrie * k, hasard(2) * R.asymetrie * 0.5 * k, pivot + choc);
      c.position.set(recul, haut + rebond, 0);
      c.scale.set(1, ecrase, 1);
      r.dos.rotation.set(hasard(3) * R.asymetrie * 0.4 * k, 0, -dos);
      r.cou.rotation.set(hasard(4) > 0 ? R.tete * doux(de(0.8, 1)) : -R.tete * doux(de(0.8, 1)), 0, -cou);
      r.epaules.forEach((e, i) => e.rotation.set(hasard(5 + i) * R.asymetrie * k, 0, bras * (1 + hasard(7 + i) * R.asymetrie)));
      r.coudes.forEach((e, i) => e.rotation.set(0, 0, coude + Math.abs(hasard(9 + i)) * R.asymetrie * k));
      r.genoux.forEach((g, i) => g.rotation.set(0, 0, genoux - Math.abs(hasard(11 + i)) * R.asymetrie * 0.8 * k));
      // ✍️ (livre n° 18) À TERRE, il LÈVE LA MAIN vers le ciel et l'agite (« Médic ! ») : logique/secours.js le dit (« appelSoin »)
      if (s.appelSoin && k >= 1) {
        const ciel = (pivot % (2 * Math.PI)) > 0 ? 1 : -1, agite = Math.sin(t * 5 + graine) * 0.28;
        r.epaules[0].rotation.set(0.25, 0, ciel * (1.45 + agite));
        r.coudes[0].rotation.set(0, 0, 0.15 + Math.abs(agite) * 0.6);
        r.cou.rotation.set(0, 0, -0.35 * ciel);
      }
      r.jambes.forEach((j, i) => j.rotation.set(hasard(13 + i) * R.asymetrie * 0.5 * k, 0, hanches + hasard(15 + i) * R.asymetrie * 0.6 * k));
      if (tireur) {
        o.g.rotation.y = -Math.atan2(s.z - tireur.z, s.x - tireur.x); // (sa tête, vers −x quand il est sur le dos, pointe vers le tireur)
        r.dos.rotation.set(0, 0, -0.45); // (le buste relevé : il est tiré par le gilet)
        r.cou.rotation.set(0, 0, 0.35); // (la tête qui pend en arrière)
        for (const e of r.epaules) e.rotation.set(0, 0, 0.35);
        compter("traines", pres, true);
      }
      return;
    }
    c.scale.set(1, 1, 1); // (étape 85 : un soldat relevé par le médecin n'est plus aplati)
    const G = etatGeste(o, s, t);
    if (corde) {
      // ✍️ (étape 74) à la corde : les deux mains serrent la corde au-dessus de la tête, les jambes pliées serrent la
      // corde (une jambe plus pliée que l'autre), le corps un peu penché en arrière ; il se balance un tout petit peu.
      compter("corde", pres);
      c.rotation.set(0, 0, 0);
      c.position.set(-0.16, 0, 0); // (la corde passe juste devant lui : ses mains sont dessus)
      tenir(r, "corde");
      r.dos.rotation.set(0, 0, -0.08 + Math.sin(t * 2.3 + s.x) * 0.03);
      r.cou.rotation.set(0, 0, -0.25); // (il regarde en bas : où il va poser les pieds)
      r.jambes[0].rotation.set(-0.12, 0, 0.75);
      r.jambes[1].rotation.set(0.12, 0, 0.35);
      r.genoux[0].rotation.set(0, 0, -1.2);
      r.genoux[1].rotation.set(0, 0, -0.55);
      r.dos.scale.y = 1;
      return;
    }
    for (const j of r.jambes) j.rotation.x = 0;
    if (s.nage) {
      // à plat ventre dans l'eau, la tête dehors ; les bras font la brasse et les jambes battent
      compter("nagent", pres);
      c.rotation.set(0, 0, -1.35);
      c.position.set(-0.2, 1.12, 0);
      r.dos.rotation.set(0, 0, 0);
      r.cou.rotation.set(0, 0, 0);
      r.pose = null;
      const brasse = t * 3;
      for (let i = 0; i < 2; i++) {
        r.epaules[i].quaternion.identity();
        r.epaules[i].rotation.set((i ? -1 : 1) * (0.4 + Math.sin(brasse) * 0.6), 0, 2.6 + Math.cos(brasse) * 0.5);
        r.coudes[i].quaternion.identity();
        r.coudes[i].rotation.z = 0.4;
        r.jambes[i].rotation.z = Math.sin(t * 7 + i * Math.PI) * 0.25;
        r.genoux[i].rotation.z = -0.3;
      }
      return;
    }
    // ✍️ (demande 92) LES GESTES NATURELS. Tout est un MÉLANGE de poses, dosé par l'état lissé du soldat (G) :
    //   - la COURSE : les jambes (la hanche avance, le genou plie quand la jambe revient), le corps qui monte et descend
    //     2 fois par foulée, qui se penche en avant et tourne un peu à chaque pas (les épaules à l'opposé des hanches) ;
    //     de CÔTÉ (pas chassés) les jambes s'écartent sur le côté ; en ARRIÈRE, la foulée s'inverse ;
    //   - ACCROUPI : arrêté, un genou à terre (le droit) et l'autre jambe devant ; en marchant, les jambes pliées ;
    //   - l'ARME : en joue quand il tire ou vise, canon vers le bas quand il court ; elle RECULE à chaque tir ;
    //   - RECHARGER : il penche l'arme, la main gauche enlève le chargeur, va en chercher un neuf dans le gilet et le met ;
    //   - LANCER une grenade : le bras droit part en arrière, lance, puis revient sur l'arme ;
    //   - au REPOS : il respire, change d'appui, tourne la tête pour regarder autour.
    //   - ✍️ (demande 129) LES GESTES HUMAINS que l'ordinateur décide (logique/troupes.js, « s.geste ») : À PLAT VENTRE (il
    //     rampe), PENCHÉ au coin d'un mur, le SPRINT (l'arme en travers de la poitrine, les bras qui pompent, de grands pas),
    //     le SURSAUT, le SIGNE DE LA MAIN, le REGARD (la tête tourne seule, puis le buste aide), À COUVERT (l'arme basse,
    //     prête), la FUITE devant une grenade (le bras sur le casque) et TRAÎNER un blessé (à reculons, les mains sur son gilet).
    // Les mains vont toujours sur l'arme là où elle est (cinématique inverse, comme avant), donc elles la suivent.
    const RG = Tanks.CONFIG.realisme.soldats.gestes, GH = RG.humains, v = Math.hypot(G.avant, G.cote);
    const kc = G.coucheK, debout = 1 - kc; // (0 = debout, 1 = à plat ventre)
    const sp = G.sprint * debout, pk = G.penche * debout, cv = G.couvert * debout, fu = G.fuite * debout, tr = G.traine * debout, sg = G.signe * debout;
    const allure = Math.min(1, v / 4.2), bouge = Math.max(Math.min(1, v / 1.4), tourne ? 0.35 : 0);
    const fAvant = v > 0.25 ? G.avant / v : 1, fCote = v > 0.25 ? G.cote / v : 0;
    const phase = G.phase + (tourne && v < 0.5 ? t * 7 : 0);
    const acc = G.accroupi * (1 - tr), aGenou = acc * (1 - bouge), aMarche = acc * bouge; // (accroupi arrêté : un genou à terre ; en marchant : jambes pliées)
    const pas = 1 - 0.35 * aMarche; // (accroupi, les pas sont plus petits)
    const grand = 1 + 0.28 * sp; // (en sprint, de plus grands pas, les genoux plus hauts)
    const hanches = _hanches, genoux = _genoux, cotes = _cotes;
    for (let i = 0; i < 2; i++) {
      const p = phase + i * Math.PI;
      hanches[i] = (Math.sin(p) * (0.3 + 0.32 * allure) * fAvant * grand + 0.08 * allure) * bouge * pas;
      cotes[i] = (-Math.sin(p) * 0.3 * fCote + (i ? -0.05 : 0.05) * Math.abs(fCote)) * bouge * pas;
      genoux[i] = -(Math.max(0, Math.sin(p + (fAvant < 0 ? -1.3 : 1.3))) * (0.5 + 0.95 * allure) * (1 + 0.4 * sp) + 0.08 + 0.12 * allure) * bouge;
    }
    // le genou à terre (la jambe droite, i = 1) et la jambe gauche devant ; accroupi en marchant : tout plié
    const GEN = { hanches: [1.35, 0.12], genoux: [-1.4, -1.68] };
    // ✍️ (demande 114) LA POSITION DE TIR : arrêté et en joue, debout, il plie un peu les genoux (plus stable)
    const enJoue = G.vise * (1 - bouge) * (1 - acc);
    // (demande 129) le SURSAUT : un coup sec (le buste rejeté en arrière, les genoux qui lâchent un peu), puis il se reprend
    const DS = GH.sursaut.duree, jolt = G.sursautT < DS ? Math.sin((Math.PI * G.sursautT) / DS) * (1 - G.sursautT / DS) * 1.6 * GH.sursaut.force : 0;
    const crawl = kc * Math.min(1, v / 0.25), phC = G.phaseRampe; // (il RAMPE : couché et il avance)
    const PH = GH.penche, pied = (i) => (i ? 1 : -1) * pk > 0 ? -0.16 * pk : 0; // (la jambe du côté où il se penche fait un petit pas de côté)
    for (let i = 0; i < 2; i++) {
      const lever = Math.max(0, Math.sin(phC + i * Math.PI)) * crawl, cote = i ? -1 : 1; // (à plat ventre : un genou remonte sur le côté)
      const hx = cotes[i] * (1 - aGenou) + PH.glisse * 1.15 * pk + pied(i), hz = hanches[i] + (GEN.hanches[i] - hanches[i]) * aGenou + 0.62 * aMarche + RG.flechi * 0.5 * enJoue + 0.45 * tr + 0.2 * jolt;
      const gz = genoux[i] + (GEN.genoux[i] - genoux[i]) * aGenou - 1.0 * aMarche - RG.flechi * enJoue - 0.75 * tr - 0.35 * jolt;
      r.jambes[i].rotation.set(hx + (cote * (0.16 + 0.55 * lever) - hx) * kc, (cote * 0.25 + cote * 1.1 * lever) * kc, hz + (-0.04 + 0.5 * lever - hz) * kc);
      r.genoux[i].rotation.z = gz + (-0.12 - 1.45 * lever - gz) * kc;
    }
    // le corps : il monte et descend 2 fois par foulée, se penche en avant en courant, se baisse accroupi
    // (au REPOS : il respire, et son poids passe doucement d'une jambe à l'autre)
    const souffle = Math.sin(t * 2.1 + G.graine), calme = (1 - bouge) * (1 - acc) * debout, appui = Math.sin(t * 0.37 + G.graine);
    const rebond = -Math.abs(Math.cos(phase)) * (0.02 + 0.045 * allure * grand) * bouge * (1 - acc);
    const CH = GH.couche;
    c.position.set(-0.04 * aGenou - 0.05 * jolt, rebond - 0.39 * aGenou - 0.24 * aMarche - 0.012 * enJoue - 0.2 * tr, appui * 0.022 * calme + PH.glisse * pk);
    c.position.x += (CH.recul - c.position.x) * kc;
    c.position.y += (CH.haut - c.position.y) * kc;
    c.position.z *= 1 - kc;
    // (demande 114) les hanches roulent un peu à chaque pas (le poids passe d'une jambe à l'autre)
    const roulis = -fCote * 0.07 * bouge + appui * 0.018 * calme + Math.sin(phase) * RG.roulis * bouge * (1 - acc) + PH.hanches * pk;
    c.rotation.set(roulis * debout + Math.sin(phC) * 0.07 * crawl, -Math.sin(phase) * 0.11 * allure * bouge * debout, (-0.07 * sp * bouge) * debout + (-Math.PI / 2 + 0.04) * kc);
    const penche = (0.04 + 0.2 * allure) * bouge * Math.max(0, fAvant) - 0.05 * bouge * Math.max(0, -fAvant) + 0.12 * aGenou + 0.26 * aMarche + RG.penche * G.vise * (1 - 0.5 * bouge)
      + GH.sprint.penche * sp * bouge + 0.18 * fu + 0.5 * tr + 0.1 * cv - 0.28 * jolt;
    const tir = G.recul * (r.tenue === TENUES.roquettes ? 1.8 : 1);
    // les gestes en cours : recharger (0 → 1) et lancer (0 → 1) ; -1 = rien
    const rp = G.rechargeK, lp = G.lancerK, ch = G.charge, jet = G.jet;
    const torsionLancer = jet * courbe(LANCER_TORSION, lp < 0 ? 1 : lp);
    const tors = r.torsion * (1 - 0.85 * kc) * (1 - 0.6 * sp) * (1 - tr); // (à plat ventre, en sprint, en traînant : le buste face à l'avant)
    // (demande 129) LE REGARD : la tête tourne seule jusqu'à ±80° ; au-delà, le buste tourne aussi pour aider
    const RGd = GH.regard, tete = Math.max(-RGd.tete, Math.min(RGd.tete, G.regard)), surplus = Math.max(-RGd.buste, Math.min(RGd.buste, G.regard - tete)) * debout;
    r.dos.rotation.set((PH.buste * pk + 0.12 * jolt * G.cote1) * debout, tors + Math.sin(phase) * 0.1 * allure * bouge * (1 - G.vise * 0.6) * debout + torsionLancer - surplus,
      -penche * debout + tir * 0.04 + souffle * 0.012 * calme + (CH.buste + souffle * 0.015) * kc);
    r.dos.scale.y = 1 + souffle * 0.008 * calme;
    // la tête : elle regarde devant (elle compense la torsion et la course), et au repos elle regarde autour (toi) ou là où
    // il regarde (l'ordinateur, « s.regard »)
    const autour = G.regardIA ? 0 : Math.sin(t * 0.23 + G.graine * 3) * RG.regardAutour * calme * (1 - G.vise);
    // (demande 114) en visant, la joue vient se poser sur la crosse : la tête penche vers l'épaule droite et baisse un peu
    r.cou.rotation.set(RG.joue * G.vise * (r.tenue === TENUES.pistolet ? 0.3 : 1) * debout + PH.tete * pk, -tors * 0.9 - torsionLancer * 0.7 + autour - tete * (1 - 0.6 * kc),
      (penche * 0.7 - 0.03 * aGenou - 0.05 * G.vise) * debout - 0.5 * fu - 0.35 * tr - 0.12 * cv + 0.45 * jolt + CH.tete * kc);
    // L'ARME (dans le repère du dos) : en joue, ou canon vers le bas ; le recul ; penchée pour recharger ; baissée pour lancer
    const T = r.tenue || TENUES.fusil, A = r.porteArme, bas = 1 - G.vise;
    A.position.fromArray(T.place).applyAxisAngle(_axeY, -tors);
    A.position.x += -tir * RG.reculArriere - 0.04 * ch - 0.02 * bas;
    // ✍️ (demande 114) en COURANT l'arme basse, elle se balance d'un côté à l'autre à chaque pas (et les bras avec elle)
    const balance = Math.sin(phase) * allure * bouge * bas * (1 - sp);
    A.position.y += Math.sin(phase * 2) * 0.012 * allure * bouge - 0.05 * bas - 0.03 * ch - 0.1 * jet + Math.abs(balance) * RG.balancement * 0.4;
    A.position.z += -0.1 * jet + balance * RG.balancement;
    let ax = 0.45 * ch * cloche(rp) + 0.2 * jet + balance * 0.18, ay = -tors + Math.sin(phase) * 0.05 * allure * bouge + balance * 0.1, az = -0.5 * bas + tir * RG.reculHaut + 0.15 * ch * cloche(rp) - 0.8 * jet + 0.35 * jolt;
    // (demande 129) en SPRINT : l'arme en travers de la poitrine (le canon vers le haut à gauche), elle monte et descend avec
    // les bras qui pompent ; en fuyant une grenade aussi
    const port = Math.max(sp, fu) * (1 - ch) * (1 - jet), pompe = Math.sin(phase) * GH.sprint.pompe * bouge;
    if (port > 0.01 && famille !== "roquettes") {
      A.position.x += (0.25 + Math.cos(phase) * 0.02 * bouge - A.position.x) * port;
      A.position.y += (0.16 + pompe - A.position.y) * port;
      A.position.z += (0.03 - A.position.z) * port;
      (ax += (0.35 + pompe * 2 - ax) * port), (ay += (0.95 - ay) * port), (az += (0.7 - az) * port);
    }
    // (demande 129) À PLAT VENTRE : l'arme devant le visage, à l'horizontale ; en rampant, elle avance par petits coups
    if (kc > 0.01) {
      const coup = Math.sin(phC) * 0.06 * crawl;
      A.position.x += (0.05 + coup - A.position.x) * kc;
      A.position.y += (0.5 + Math.abs(coup) * 0.5 - A.position.y) * kc;
      A.position.z += (0.13 - A.position.z) * kc;
      (ax += (0.2 * ch * cloche(rp) - ax) * kc), (ay += (-0.1 - ay) * kc), (az += (1.28 - 0.25 * crawl + tir * RG.reculHaut - az) * kc);
    }
    A.rotation.set(ax, ay, az, "YXZ");
    // (demande 129) en TRAÎNANT un blessé : le fusil passe dans le dos (à la bretelle), les deux mains sont prises
    if (tr > 0.5) (A.position.copy(DANS_LE_DOS.position), A.rotation.copy(DANS_LE_DOS.rotation));
    A.updateMatrix();
    // les mains : la droite sur la poignée, la gauche sur le garde-main… sauf pendant un geste
    const mainD = _mD.copy(r.mainD).applyMatrix4(A.matrix), mainG = _mG.copy(r.mainG).applyMatrix4(A.matrix);
    // ✍️ (livre n° 14, 15, 16) TOI, avec une grenade, un explosif, un gadget ou une plaque en main : le fusil passe dans ton
    // dos (à la bretelle) et l'accessoiriste (affichage/objets3d.js) met l'objet dans tes mains
    // (livre n° 17) un MÉDECIN de l'ordinateur qui soigne ou relève : la trousse ou le défibrillateur dans les mains
    const tenu = s.joueur || s.soinEnCours || s.chocSecours > 0 || r.objets ? Tanks.Objets3D.troisieme(r, s, A, mainD, mainG) : null;
    if (ch > 0.01 && rp >= 0) { // RECHARGER : la main gauche fait le trajet du chargeur (et, demande 129, tire le levier d'armement)
      const mag = _mC.copy(r.chargeurArme || _mC.set(r.mainD.x + 0.1, r.mainD.y - 0.06, 0)).applyMatrix4(A.matrix);
      const dessous = _mT.copy(mag).add(_bas18), levier = _mL.copy(r.levierArme).applyMatrix4(A.matrix);
      _chemin[0] = mainG; _chemin[1] = mag; _chemin[2] = dessous; _chemin[3] = POCHE; _chemin[4] = dessous; _chemin[5] = mag; _chemin[6] = levier; _chemin[7] = mainG;
      chemin(_chemin, RECHARGE_TEMPS, rp, _mP);
      mainG.lerp(_mP, ch);
    }
    if (jet > 0.01 && lp >= 0) { // LANCER : la main droite part en arrière, lance, revient
      chemin([mainD, LANCER_POINTS[0], LANCER_POINTS[1], LANCER_POINTS[2], mainD], LANCER_TEMPS, lp, _mP);
      mainD.lerp(_mP, jet);
    }
    // ✍️ (demande 114) avec un PISTOLET, en courant sans viser, la main gauche lâche l'arme et le bras se balance librement
    const libre = r.tenue === TENUES.pistolet && !tenu && rp < 0 && lp < 0 ? bas * allure * bouge : 0;
    if (libre > 0.01) mainG.lerp(_mP.set(-Math.sin(phase) * RG.brasLibre * Math.max(0, fAvant), -0.07 + Math.abs(Math.cos(phase)) * 0.03, -0.25), Math.min(1, libre * 1.4));
    if (!tenu) {
      // (demande 129) la FUITE devant une grenade : le bras gauche sur le casque
      if (fu > 0.01) mainG.lerp(_mP.set(0.22, 0.72, -0.03), fu);
      // (demande 129) le SIGNE DE LA MAIN : « contact » (le bras tendu montre l'ennemi), « en avant ! » (le bras s'agite vers l'avant)
      if (sg > 0.01) {
        const rel = Math.max(-1.5, Math.min(1.0, G.signeRel)), a = rel + tors; // (vers où, dans le repère du dos)
        const dx = Math.cos(a), dz = Math.sin(a);
        if (G.signeSorte === "contact") _mP.set(dx * 0.56, 0.5, -0.2 + dz * 0.56);
        else {
          const w = 0.5 + 0.5 * Math.sin(t * GH.signe.vague * 2 * Math.PI);
          _mP.set(0.08 + dx * 0.45 * w, 0.98 - 0.42 * w, -0.24 + dz * 0.45 * w);
        }
        mainG.lerp(_mP, sg);
      }
      // (demande 129) TRAÎNER un blessé : les deux mains tiennent son gilet, devant, en bas
      if (tr > 0.01) (mainD.lerp(_mP.set(0.6, -0.12, 0.13), tr), mainG.lerp(_mP.set(0.6, -0.12, -0.13), tr));
    }
    if (tenu) Tanks.Objets3D.troisiemeMains(r, s, mainD, mainG);
    r.pose = null;
    poserBras(r.epaules[0], r.coudes[0], mainD.toArray(_tabD), POLES[0]);
    poserBras(r.epaules[1], r.coudes[1], mainG.toArray(_tabG), POLES[1]);
    if (pres) chargeurs(r, s, rp, A, mainG, t); // (demande 129 : le chargeur dans la main, et le vide qui tombe par terre)
    // (pour « sous le capot » : ce que fait ce soldat)
    compter(rp >= 0 ? "rechargent" : lp >= 0 ? "lancent" : kc > 0.5 ? "couches" : tr > 0.5 ? "trainent" : fu > 0.5 ? "fuient" : sg > 0.5 ? "signes" : Math.abs(pk) > 0.5 ? "penches" : sp > 0.5 && v > 2 ? "sprintent" : acc > 0.5 ? "accroupis" : v > 3 ? "courent" : v > 0.4 ? "marchent" : G.vise > 0.5 ? "visent" : "repos", pres);
    if (jolt > 0.01) compter("sursautent", false, true);
  }

  // (demande 92) L'ÉTAT DES GESTES d'un soldat dessiné : il glisse doucement vers ce que fait le soldat (« souplesse » s).
  // La vitesse vient du vrai déplacement depuis l'image d'avant (vers l'avant et sur le côté, dans le repère du soldat).
  function etatGeste(o, s, t) {
    let G = o.geste;
    if (!G) G = o.geste = { t, x: s.x, z: s.z, avant: 0, cote: 0, accroupi: s.accroupi ? 1 : 0, vise: 0, recul: 0, tirAvant: 0, depuisTir: 9, charge: 0, jet: 0, rechargeK: -1, lancerK: -1, graine: (numeroGeste++ * 2.39) % 6.28,
      // (demande 129) les gestes humains, lissés : à plat ventre (de 0 à 1), sprint, penché (−1 à 1), à couvert, fuite,
      // traîner, signe ; le regard (rad, par rapport au corps) ; le sursaut (s depuis le dernier) ; les foulées (la phase des pas)
      phase: ((s.pas || 0) * Math.PI * 2) / Tanks.CONFIG.realisme.soldats.gestes.foulee, phaseRampe: 0, pasAvant: s.pas || 0, coucheLin: s.couche ? 1 : 0, coucheK: s.couche ? 1 : 0,
      sprint: 0, penche: 0, couvert: 0, fuite: 0, traine: 0, signe: 0, signeRel: 0, signeSorte: null, regard: 0, regardIA: false, sursautT: 9, sursautAvant: 0, cote1: numeroGeste % 2 ? 1 : -1 };
    const dt = Math.max(0, Math.min(0.1, t - G.t)), RG = Tanks.CONFIG.realisme.soldats.gestes;
    G.t = t;
    if (s.joueur) gesteJoueur = G;
    if (dt > 0) {
      let vx = (s.x - G.x) / dt, vz = (s.z - G.z) / dt;
      if (vx * vx + vz * vz > 15 * 15) vx = vz = 0; // (un portail, une téléportation : pas une vitesse)
      const ca = Math.cos(s.angle), sa = Math.sin(s.angle), kv = 1 - Math.exp(-dt * 10);
      G.avant += (vx * ca + vz * sa - G.avant) * kv;
      G.cote += (-vx * sa + vz * ca - G.cote) * kv;
    }
    G.x = s.x;
    G.z = s.z;
    // un nouveau tir ? (le compteur « tir » vient de remonter) : le recul repart
    if (s.tir > G.tirAvant + 1e-4) (G.recul = 1), (G.depuisTir = 0);
    G.tirAvant = s.tir;
    G.depuisTir += dt;
    G.recul *= Math.exp(-dt * 13);
    // recharger : où en est-il (de 0 à 1) ? Toi : ton arme ; l'ordinateur : son chargeur (logique/soldat.js)
    const duree = s.rechargementTotal || (s.rechargementDe && s.rechargementDe.stats ? s.rechargementDe.stats.rechargement : s.rechargementDuree || 2.5); // (livre n° 26)
    G.rechargeK = s.rechargement > 0 ? Math.max(0, Math.min(1, 1 - s.rechargement / duree)) : -1;
    G.lancerK = s.lancer > 0 ? 1 - s.lancer / 0.5 : -1;
    // ✍️ (demande 129) LES GESTES HUMAINS de l'ordinateur (logique/troupes.js : « s.geste », « s.allure », « s.couche »…)
    // (pendant un film de la campagne, logique/cinematique.js mène les acteurs : on ne lit pas ces gestes, ils seraient d'avant ;
    // ✍️ demande 130 : sauf ceux que le scénario vient de lui donner, « gesteFilm »)
    const film = !!(Tanks.monde && Tanks.monde.cinematique) && !s.gesteFilm, GH = RG.humains, geste = film ? null : s.geste || null, k = 1 - Math.exp(-dt / RG.souplesse);
    const couche = !film && !!s.couche;
    const sprint = !s.mort && ((!film && s.allure === "sprint") || geste === "sprint" || geste === "fuite-grenade"), fuite = geste === "fuite-grenade", traine = geste === "traine" && !!s.traine;
    const couvert = geste === "couvert" && G.depuisTir > 0.8 && !(s.visee > 0.1);
    const vise = !sprint && !traine && !couvert && (s.visee > 0.1 || G.depuisTir < 2 || !!(s.ia && s.ia.cible && !s.ia.cible.mort && !s.ia.cible.detruit) || s.accroupi);
    // à plat ventre : il descend (ou se relève) en « transition » s, en douceur (lent, puis vite, puis lent)
    G.coucheLin = Math.max(0, Math.min(1, G.coucheLin + ((couche ? 1 : -1) * dt) / GH.couche.transition));
    G.coucheK = G.coucheLin * G.coucheLin * (3 - 2 * G.coucheLin);
    // les foulées : la phase avance avec la distance parcourue (les pieds ne glissent pas), et les pas s'allongent avec la vitesse
    const dPas = Math.max(0, Math.min(3, (s.pas || 0) - G.pasAvant)), vit = Math.min(1.5, Math.hypot(G.avant, G.cote) / 4.2);
    G.pasAvant = s.pas || 0;
    G.phase = (G.phase + (dPas * Math.PI * 2) / (RG.foulee * (GH.sprint.foulee[0] + GH.sprint.foulee[1] * vit))) % 1e4;
    G.phaseRampe = (G.phaseRampe + (dPas * Math.PI * 2) / GH.couche.rampe) % 1e4;
    G.sprint += ((sprint ? 1 : 0) - G.sprint) * k;
    G.fuite += ((fuite ? 1 : 0) - G.fuite) * Math.min(1, k * 1.5);
    G.traine += ((traine ? 1 : 0) - G.traine) * k;
    G.couvert += ((couvert ? 1 : 0) - G.couvert) * k;
    G.penche += ((film ? 0 : s.penche || 0) - G.penche) * k;
    if (s.signe && geste === "signe") (G.signeSorte = s.signe), (G.signeRel = Math.atan2(Math.sin(s.signeAngle - s.angle), Math.cos(s.signeAngle - s.angle)));
    G.signe += ((s.signe && geste === "signe" ? 1 : 0) - G.signe) * Math.min(1, k * 1.5);
    // le regard (l'ordinateur) : la tête rattrape doucement l'endroit où il regarde
    G.regardIA = !film && !s.joueur && !!s.ia && s.regard !== undefined && s.regard !== null;
    const rel = G.regardIA ? Math.atan2(Math.sin(s.regard - s.angle), Math.cos(s.regard - s.angle)) : 0;
    G.regard += (rel - G.regard) * Math.min(1, dt * GH.regard.vitesse);
    // le sursaut : il repart chaque fois que « s.sursaut » remonte
    if ((s.sursaut || 0) > G.sursautAvant + 0.01) (G.sursautT = 0), (G.cote1 = -G.cote1);
    G.sursautAvant = s.sursaut || 0;
    G.sursautT += dt;
    G.accroupi += ((s.accroupi ? 1 : 0) - G.accroupi) * k;
    G.vise += ((vise ? 1 : 0) - G.vise) * k;
    G.charge += ((G.rechargeK >= 0 ? 1 : 0) - G.charge) * Math.min(1, k * 1.6);
    G.jet += ((G.lancerK >= 0 ? 1 : 0) - G.jet) * Math.min(1, k * 2.5);
    return G;
  }
  let numeroGeste = 0;
  // un chemin de points (des Vector3) à des moments (de 0 à 1) : on glisse en douceur de l'un à l'autre
  function chemin(points, temps, u, sortie) {
    let i = 0;
    while (i < temps.length - 2 && u > temps[i + 1]) i++;
    const a = temps[i], b = temps[i + 1], x = Math.max(0, Math.min(1, (u - a) / (b - a || 1)));
    return sortie.copy(points[i]).lerp(points[i + 1], x * x * (3 - 2 * x));
  }
  const courbe = (pts, u) => { // (des nombres à des moments : [[moment, valeur], …])
    let i = 0;
    while (i < pts.length - 2 && u > pts[i + 1][0]) i++;
    const [a, va] = pts[i], [b, vb] = pts[i + 1], x = Math.max(0, Math.min(1, (u - a) / (b - a || 1)));
    return va + (vb - va) * x * x * (3 - 2 * x);
  };
  const cloche = (u) => (u < 0 ? 0 : Math.sin(Math.min(1, u) * Math.PI) ** 0.5); // (0 au début et à la fin d'un geste, 1 au milieu)
  const _mD = new THREE.Vector3(), _mG = new THREE.Vector3(), _mC = new THREE.Vector3(), _mT = new THREE.Vector3(), _mP = new THREE.Vector3(), _bas18 = new THREE.Vector3(0, -0.18, 0.02);
  const _tabD = [0, 0, 0], _tabG = [0, 0, 0];
  const POCHE = new THREE.Vector3(0.24, 0.19, -0.05); // (le porte-chargeurs du gilet, devant)
  // (demande 129) le trajet de la main gauche : le chargeur vide (0,12 → 0,3, puis il le lâche), la poche, le neuf (0,48 →
  // 0,78, enfoncé), le LEVIER d'armement (0,88), et elle revient sur le garde-main
  const RECHARGE_TEMPS = [0, 0.12, 0.3, 0.48, 0.64, 0.78, 0.88, 0.97];
  const _chemin = [null, null, null, null, null, null, null, null], _mL = new THREE.Vector3(), _hanches = [0, 0], _genoux = [0, 0], _cotes = [0, 0];
  const LANCER_POINTS = [new THREE.Vector3(-0.14, 0.66, 0.3), new THREE.Vector3(0.52, 0.62, 0.12), new THREE.Vector3(0.32, 0.12, -0.1)];
  const LANCER_TEMPS = [0, 0.12, 0.3, 0.55, 1];
  const LANCER_TORSION = [[0, 0], [0.12, 0.4], [0.3, -0.35], [0.55, -0.45], [1, 0]];
  // ✍️ (demande 129) LE CHARGEUR pendant un rechargement (seulement les soldats proches, dessinés en détail) : le chargeur
  // de l'arme disparaît quand la main gauche l'enlève ; elle le tient (le vide), le LÂCHE (il tombe par terre, y reste
  // « reste » s puis s'enfonce et disparaît), va chercher le neuf dans la poche du gilet et l'enfonce dans l'arme.
  // Les chargeurs qui tombent viennent d'une petite réserve (« max ») fabriquée une fois : rien de neuf à chaque image.
  const CHARGEUR_SIMPLE = {};
  const chutes = [], bilanChargeurs = { tombes: 0, auSol: 0 }, _cM = new THREE.Vector3(), _cQ = new THREE.Quaternion(), _cS = new THREE.Vector3();
  let tChutes = -1;
  function chargeurs(r, s, rp, A, mainG, t) {
    const CM = r.chargeurMain;
    if (CM) {
      const tenu = rp >= 0.12 && rp < 0.3 ? 1 : rp >= 0.48 && rp < 0.78 ? 2 : 0;
      if (r.chargeurTenu === 1 && tenu !== 1 && rp >= 0.3) lacherChargeur(r, s, CM);
      r.chargeurTenu = tenu;
      CM.visible = tenu > 0 && !s.mort;
      if (r.groupeChargeur) r.groupeChargeur.visible = !(rp >= 0.12 && rp < 0.78);
      if (CM.visible) {
        // la copie suit la main : même orientation que l'arme, son point d'attache (le haut du chargeur) dans la main gauche
        CM.quaternion.copy(A.quaternion);
        CM.position.copy(r.chargeurArme).applyMatrix4(A.matrix);
        CM.position.subVectors(mainG, CM.position).add(A.position);
      }
    } else if (r.groupeChargeur && !r.groupeChargeur.visible) r.groupeChargeur.visible = true;
    // (une fois par image) les chargeurs tombés : ils tombent, se posent, puis s'enfoncent et disparaissent
    if (t === tChutes) return; // (une seule fois par image : tous les soldats d'une image ont la même horloge)
    const dt = Math.max(0, Math.min(0.1, t - tChutes)), RESTE = Tanks.CONFIG.realisme.soldats.gestes.humains.chargeurs.reste;
    tChutes = t;
    let n = 0;
    for (const c of chutes) {
      if (!c.g.visible) continue;
      c.age += dt;
      if (!c.pose) {
        c.vy -= 9.8 * dt;
        c.g.position.y += c.vy * dt;
        c.g.position.x += c.vx * dt;
        c.g.position.z += c.vz * dt;
        c.g.rotation.x += c.tourne * dt;
        if (c.g.position.y <= c.sol) (c.g.position.y = c.sol), (c.pose = true), (c.age = 0);
      } else if (c.age > RESTE) {
        const f = Math.max(0, 1 - (c.age - RESTE));
        c.g.scale.setScalar(f);
        c.g.position.y = c.sol - (1 - f) * 0.05;
        if (f <= 0) c.g.visible = false;
      }
      n++;
    }
    bilanChargeurs.auSol = n;
  }
  function lacherChargeur(r, s, CM) {
    const parent = r.porteur.parent && r.porteur.parent.parent; // (la scène : le soldat → son groupe → la scène)
    if (!parent) return;
    const MAX = Tanks.CONFIG.realisme.soldats.gestes.humains.chargeurs.max;
    let c = chutes.find((x) => !x.g.visible);
    if (!c && chutes.length < MAX) chutes.push((c = { g: new THREE.Group(), cle: null, vy: 0, vx: 0, vz: 0, tourne: 0, sol: 0, age: 0, pose: false }));
    if (!c) c = chutes.reduce((a, b) => (a.age > b.age ? a : b)); // (toutes prises : on reprend la plus vieille)
    if (c.g.parent !== parent) parent.add(c.g);
    if (c.cle !== CM.userData.cle) { // (une autre arme : on change la copie du chargeur ; pas à chaque fois)
      while (c.g.children.length) c.g.remove(c.g.children[0]);
      c.g.add(CM.children[0].clone());
      c.cle = CM.userData.cle;
    }
    CM.updateWorldMatrix(true, false);
    CM.matrixWorld.decompose(_cM, _cQ, _cS);
    c.g.position.copy(_cM);
    c.g.quaternion.copy(_cQ);
    c.g.scale.setScalar(1);
    c.g.visible = true;
    (c.vy = -0.3), (c.vx = (Math.random() - 0.5) * 0.4), (c.vz = (Math.random() - 0.5) * 0.4), (c.tourne = (Math.random() - 0.5) * 6);
    (c.sol = (s.y || 0) + 0.03), (c.age = 0), (c.pose = false);
    bilanChargeurs.tombes++;
  }
  // (demande 92) Pour « sous le capot » : combien de soldats dessinés courent, marchent, sont accroupis, rechargent…
  // (on recommence à compter à chaque nouvelle image)
  const gestes = { image: -1, courent: 0, marchent: 0, accroupis: 0, rechargent: 0, lancent: 0, visent: 0, repos: 0, nagent: 0, corde: 0, detail: 0,
    couches: 0, penches: 0, sprintent: 0, signes: 0, fuient: 0, trainent: 0, traines: 0, sursautent: 0 }; // (demande 129)
  function compter(etat, pres, enPlus) {
    const image = Tanks.Scene.infos.frame;
    if (image !== gestes.image) {
      for (const k in gestes) gestes[k] = 0;
      gestes.image = image;
    }
    gestes[etat]++;
    if (pres && !enPlus) gestes.detail++;
  }
  // (demande 92) De combien la tête de ce soldat est baissée (m) : accroupi. Pour la caméra à la 1re personne.
  let gesteJoueur = null;
  const baisse = () => (gesteJoueur ? gesteJoueur.accroupi * 0.62 : 0);

  // ------------------------------------------------------------------ (étape 74) une FIGURINE : un soldat immobile
  // Pour les pilotes, les mitrailleurs et les soldats assis dans les hélicos : le même soldat, mais posé une fois pour
  // toutes (assis, debout à la mitrailleuse…) et « cuit » en formes immobiles. pose(r) tourne les os ; renvoie un
  // groupe de pièces (le tissu camouflé et le reste) à souder avec l'engin.
  function figurine(equipe, pose, detail, peau) {
    const r = os(), M = matsSoldat(equipe);
    const porteur = new THREE.Group();
    porteur.add(r.corps);
    if (pose) pose(r, poserBras);
    const geos = cuire(pieces(equipe, detail !== false, PEAUX[peau || 0], false), r, M, false);
    const g = new THREE.Group();
    for (const nom in geos) {
      const m = new THREE.Mesh(geos[nom], M[nom]);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }
    return g;
  }

  // ------------------------------------------------------------------ étape 72 : la SILHOUETTE (le soldat vu de loin)
  // ✍️ « Ça rame. » Loin de la caméra, chaque soldat devient une SILHOUETTE : une seule pièce, déjà dans la pose « fusil en
  // main », avec ses couleurs écrites dans les sommets. Toutes les silhouettes d'une équipe sont des « instances » : la
  // même forme recopiée à 100 endroits, en UN dessin. (Étape 74 : c'est maintenant le soldat simple lui-même, cuit dans
  // la pose « fusil en main » : même casque, même gilet, même sac que de près.)
  function silhouettes(equipe0, max) {
    const equipe = habit(equipe0, "assaut"), M = matsSoldat(equipe), r = os(); // (demande 128 : de loin, le skin de l'Assaut, le plus nombreux)
    new THREE.Group().add(r.corps);
    poserBras(r.epaules[0], r.coudes[0], MAINS.fusil.droite, POLES[0]);
    poserBras(r.epaules[1], r.coudes[1], MAINS.fusil.gauche, POLES[1]);
    const liste = pieces(equipe, false, PEAUX[0], false);
    liste.ombrer = true;
    const geos = cuire(liste, r, M, false);
    // le tissu camouflé prend la couleur de fond du camouflage (une instance n'a qu'une matière : celle à couleurs)
    const tenue = geos.tenue, n = tenue.attributes.position.count, t = new Float32Array(n * 3), c = new THREE.Color(M.couleurs.tenue);
    const om = tenue.attributes.ombre ? tenue.attributes.ombre.array : null; // (demande 128 : avec son ombre dans les creux)
    for (let i = 0; i < n; i++) { const f = om ? 1 - om[i] : 1; (t[i * 3] = c.r * f), (t[i * 3 + 1] = c.g * f), (t[i * 3 + 2] = c.b * f); }
    tenue.setAttribute("color", new THREE.BufferAttribute(t, 3));
    const g = new THREE.Group();
    g.add(new THREE.Mesh(tenue, M.teinte), new THREE.Mesh(geos.teinte, M.teinte));
    const fusil = new THREE.Mesh(formesArmes(false).fusil, M.teinte);
    fusil.position.set(PLACE_ARMES.fusil[0], PLACE_ARMES.fusil[1] + OS.dos, PLACE_ARMES.fusil[2]);
    g.add(fusil);
    const [piece] = OT.souder(g, false);
    const tous = new THREE.InstancedMesh(piece.geometry, M.teinte, max);
    tous.count = 0;
    tous.frustumCulled = false; // (ils sont partout sur la carte : on les envoie tous, c'est un seul dessin)
    tous.castShadow = false;
    tous.receiveShadow = true;
    return tous;
  }

    // ------------------------------------------------------------------ les engins
  // (étape 70) Les outils de l'atelier (outils3d.js) et les couleurs des petites pièces (les mêmes que pour les tanks).
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const MT = () => Tanks.Chars3D.materiaux(); // (teinte : la matière à couleurs de sommets, partagée avec les tanks)
  const peintureCamo = {};
  function peintureSoudee(equipe) { // (la peinture camouflage, posée « au pistolet » quand on soude les pièces)
    if (peintureCamo[equipe]) return peintureCamo[equipe];
    const p = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.camouflage(Tanks.CONFIG.equipes[equipe].camouflage), roughness: 0.8, metalness: 0.15 });
    p.userData.camo = true;
    return (peintureCamo[equipe] = p);
  }
  function vitreClaire() { // (une vitre qu'on voit à travers : on aperçoit l'intérieur)
    return M.vitreClaire || (M.vitreClaire = new THREE.MeshPhysicalMaterial({ color: 0x8aa4b4, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.3, depthWrite: false }));
  }

  // Un soldat ASSIS (le pilote) : le bassin sur le siège, le buste, la tête et son casque, les bras vers le volant,
  // les cuisses vers l'avant et les jambes vers les pédales. (x, y, z) = le haut de l'assise ; v = le volant.
  // (Étape 74 : c'est une vraie FIGURINE de soldat — le même équipement que les soldats à pied —, posée assise, les
  // mains sur le volant ; elle est cuite avec l'engin.)
  function pilote(groupe, m, x, y, z, v, equipe) {
    const hanches = y + 0.1, dos = [x, hanches - OS.hanche + OS.dos, z]; // (le dos, quand il est droit)
    const mains = v ? [v[0] - 0.04 - dos[0], v[1] + 0.02 - dos[1], v[2] - dos[2]] : [0.42, -0.1, 0];
    figurineDans(groupe, figurine(equipe || "bleus", (r, bras) => {
      for (const j of r.jambes) j.rotation.z = 1.4;
      for (const g of r.genoux) g.rotation.z = -1.25;
      r.dos.rotation.z = -0.1;
      bras(r.epaules[0], r.coudes[0], [mains[0], mains[1], mains[2] + 0.15], new THREE.Vector3(-0.2, -1, 0.7));
      bras(r.epaules[1], r.coudes[1], [mains[0], mains[1], mains[2] - 0.15], new THREE.Vector3(-0.2, -1, -0.7));
    }, true, 0), x, hanches - OS.hanche, z, 0);
  }
  // Poser une figurine (cuite) dans un groupe d'engin, tournée de « angle » autour de y.
  function figurineDans(groupe, fig, x, y, z, angle) {
    fig.position.set(x, y, z);
    fig.rotation.y = angle || 0;
    fig.updateMatrix();
    for (const m of fig.children) groupe.add(O.piece(m.geometry.clone().applyMatrix4(fig.matrix), m.material));
  }
  // Un siège : l'assise, le dossier penché, l'appui-tête.
  function siege(groupe, m, x, y, z, couleur) {
    groupe.add(O.boite(0.48, 0.1, 0.5, m.teinte, x, y - 0.05, z, couleur));
    groupe.add(O.boite(0.4, y - 0.62, 0.42, m.teinte, x, (y + 0.62) / 2 - 0.05, z, CT.noir)); // le pied
    const dossier = O.boite(0.1, 0.62, 0.5, m.teinte, x - 0.27, y + 0.3, z, couleur);
    dossier.rotation.z = 0.18;
    groupe.add(dossier);
    groupe.add(O.boite(0.08, 0.16, 0.26, m.teinte, x - 0.33, y + 0.68, z, couleur));
  }

  // Une roue de 4x4 tout-terrain (fabriquée une fois par côté, puis réutilisée) : le pneu à crampons, la jante à
  // « beadlock » (l'anneau boulonné qui tient le pneu même crevé) et le gros moyeu des réducteurs.
  const rouesJeep = {};
  function geoRoueJeep(cote, couleurJante) {
    const cle = cote + ":" + couleurJante;
    if (rouesJeep[cle]) return rouesJeep[cle];
    const m = MT(), o = cote, p = [];
    const profilPneu = [[0.28, -0.155], [0.39, -0.165], [0.44, -0.148], [0.462, -0.115], [0.465, 0], [0.462, 0.115], [0.44, 0.148], [0.39, 0.165], [0.28, 0.155]];
    p.push(O.tour(profilPneu, m.teinte, 24, CT.caoutchouc));
    for (let k = 0; k < 24; k++) { // les crampons, en chevrons
      const a = (k / 24) * Math.PI * 2;
      for (const s of [-1, 1]) {
        const c = O.boite(0.05, 0.11, 0.035, m.teinte, Math.cos(a) * 0.468, s * 0.07 + (k % 2 ? 0.02 : -0.02), Math.sin(a) * 0.468, CT.caoutchouc);
        c.rotation.y = -a;
        c.rotateX(s * 0.5);
        p.push(c);
      }
    }
    p.push(O.cylindre(0.285, 0.285, 0.29, m.teinte, 18, couleurJante)); // la jante
    const anneau = O.cylindre(0.3, 0.3, 0.03, m.teinte, 20, couleurJante);
    anneau.position.y = o * 0.15;
    p.push(anneau);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      p.push(O.boite(0.025, 0.025, 0.025, m.teinte, Math.cos(a) * 0.27, o * 0.168, Math.sin(a) * 0.27, CT.acier));
    }
    const creux = O.cylindre(o > 0 ? 0.17 : 0.24, o > 0 ? 0.24 : 0.17, 0.04, m.teinte, 16, new THREE.Color(couleurJante).multiplyScalar(0.7));
    creux.position.y = o * 0.155;
    p.push(creux);
    const moyeu = O.cylindre(o > 0 ? 0.09 : 0.13, o > 0 ? 0.13 : 0.09, 0.14, m.teinte, 12, CT.noir);
    moyeu.position.y = o * 0.2;
    p.push(moyeu);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      p.push(O.boite(0.03, 0.03, 0.03, m.teinte, Math.cos(a) * 0.105, o * 0.19, Math.sin(a) * 0.105, CT.acier));
    }
    return (rouesJeep[cle] = O.geometrieTeintee(p, m.teinte));
  }

  // (étape 70) LE 4x4 À MITRAILLEUSE, refait comme un vrai véhicule militaire léger (un « Humvee » blindé) :
  // une caisse très large et basse, un long capot plat avec sa calandre à fentes, les phares ronds, un gros pare-chocs
  // avec son treuil, 4 portières avec de petites vitres blindées, un pare-brise en deux morceaux, et sur le toit,
  // la tourelle du tireur avec son bouclier (et sa vitre) et la mitrailleuse lourde de 12,7 mm.
  // Par les vitres, on voit l'INTÉRIEUR : les 4 sièges, le tableau de bord, le volant, la radio, le pilote, et le
  // tireur debout dans la tourelle. Mesures : 4,6 m de long, 2,2 m de large, 1,9 m jusqu'au toit, roues de 93 cm.
  function jeep(equipe) {
    mats();
    const m = MT(), P = peintureSoudee(equipe), E = Tanks.CONFIG.equipes[equipe], V = vitreClaire();
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const vert = new THREE.Color(E.camouflage[0]), fonce = vert.clone().multiplyScalar(0.55);
    const xR = 1.65, zR = 0.93, rR = 0.465, Rarc = 0.6, yBas = 0.55, yCeinture = 1.24, yToit = 1.9, demi = 1.09;
    // 1. Les flancs (ils montent jusqu'à la ceinture), avec les passages de roues.
    const flanc = [[-2.3, 0.78], [-2.24, yBas]];
    for (const c of [-xR, xR]) {
      const dx = Math.sqrt(Rarc * Rarc - (yBas - rR) * (yBas - rR));
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI - (k / 10) * Math.PI, xx = c + Math.cos(a) * dx * 1.0, yy = rR + Math.sqrt(Math.max(0, Rarc * Rarc - (xx - c) * (xx - c)));
        flanc.push([xx, Math.max(yBas, yy)]);
      }
    }
    flanc.push([2.26, yBas], [2.34, 0.7], [2.34, 1.1], [0.72, yCeinture], [-2.3, yCeinture]);
    for (const s of [-1, 1]) {
      const f = O.profil(flanc, 0.1, P, 0.02);
      f.position.z = s * (demi - 0.05);
      caisse.add(f);
      // l'élargisseur d'aile (en caoutchouc noir) autour de chaque passage de roue
      for (const c of [-xR, xR]) {
        const pts = [];
        for (let k = 0; k <= 12; k++) {
          const a = Math.PI - (k / 12) * Math.PI;
          pts.push([c + Math.cos(a) * (Rarc + 0.02), rR + Math.sin(a) * (Rarc + 0.02), s * (demi + 0.01)]);
        }
        caisse.add(O.cable(pts, 0.035, m.teinte, CT.noir, 24));
      }
      // les murs intérieurs des passages de roues (pour ne pas voir dans la caisse)
      for (const c of [-xR, xR]) caisse.add(O.boite(1.25, yCeinture - yBas, 0.04, m.teinte, c, (yBas + yCeinture) / 2, s * (zR - 0.2), fonce));
      // les portières : les joints, les charnières, les poignées ; le marchepied
      for (const xp of [0.68, -0.22, -1.12]) caisse.add(O.boite(0.018, yCeinture - yBas - 0.06, 0.012, m.teinte, xp, (yBas + yCeinture) / 2, s * (demi + 0.002), CT.noir));
      for (const xp of [0.6, -0.3]) caisse.add(O.boite(0.1, 0.035, 0.03, m.teinte, xp - 0.62, 1.1, s * (demi + 0.01), CT.noir));
      for (const xp of [0.6, -0.3]) for (const yh of [0.75, 1.1]) caisse.add(O.boite(0.06, 0.08, 0.03, m.teinte, xp + 0.05, yh, s * (demi + 0.01), CT.acier));
      caisse.add(O.boite(1.6, 0.05, 0.16, m.teinte, -0.25, yBas - 0.02, s * (demi - 0.04), CT.noir));
      // les vitres des portières (petites et épaisses : du verre blindé) avec leur cadre
      for (const [xa, xb] of [[-0.12, 0.52], [-1.04, -0.32]]) {
        caisse.add(O.boite(xb - xa, 0.46, 0.02, V, (xa + xb) / 2, 1.56, s * (demi - 0.03)));
        caisse.add(O.boite(xb - xa + 0.1, 0.06, 0.08, m.teinte, (xa + xb) / 2, 1.82, s * (demi - 0.03), fonce));
        caisse.add(O.boite(xb - xa + 0.1, 0.06, 0.08, m.teinte, (xa + xb) / 2, 1.3, s * (demi - 0.03), fonce));
      }
      for (const [xp, l] of [[0.6, 0.12], [-0.22, 0.16], [-1.11, 0.14]]) caisse.add(O.boite(l, yToit - yCeinture, 0.1, P, xp, (yToit + yCeinture) / 2, s * (demi - 0.05))); // les montants
      // le rétroviseur, sur son bras
      caisse.add(O.tube([0.62, 1.42, s * demi], [0.75, 1.55, s * (demi + 0.22)], 0.018, m.teinte, 5, CT.noir));
      caisse.add(O.boite(0.06, 0.26, 0.16, m.teinte, 0.75, 1.62, s * (demi + 0.25), CT.noir));
      // les phares ronds (dans leur boîtier), les clignotants, les feux arrière
      caisse.add(O.boite(0.1, 0.3, 0.32, m.teinte, 2.3, 0.95, s * 0.76, CT.noir));
      caisse.add(O.couche(O.cylindre(0.1, 0.1, 0.04, M.phare, 14), "x", 2.36, 0.95, s * 0.76));
      caisse.add(O.boite(0.04, 0.06, 0.1, m.teinte, 2.36, 0.76, s * 0.76, CT.orange));
      caisse.add(O.boite(0.04, 0.16, 0.12, m.teinte, -2.31, 1.0, s * 0.85, CT.rouge));
      caisse.add(O.boite(0.04, 0.06, 0.12, m.teinte, -2.31, 0.86, s * 0.85, CT.orange));
    }
    // 2. Le capot (long et plat, avec sa bosse au milieu), la calandre, le pare-chocs avec le treuil.
    caisse.add(O.profil([[0.72, yCeinture], [2.34, 1.1], [2.34, 1.05], [0.72, yCeinture - 0.06]], 2 * demi, P, 0.03));
    caisse.add(O.profil([[0.85, yCeinture + 0.05], [2.15, 1.15], [2.15, 1.1], [0.85, yCeinture - 0.02]], 1.0, P, 0.04));
    caisse.add(O.boite(0.5, 0.012, 0.6, m.teinte, 1.6, 1.21, 0, CT.noir)); // la grille d'aération du capot
    caisse.add(O.boite(0.06, 0.45, 1.05, m.teinte, 2.33, 0.85, 0, CT.noir)); // la calandre…
    for (let k = 0; k < 9; k++) caisse.add(O.boite(0.04, 0.42, 0.05, P, 2.36, 0.85, -0.44 + k * 0.11)); // … et ses lames
    caisse.add(O.boite(0.22, 0.24, 2.0, m.teinte, 2.47, 0.6, 0, CT.olive)); // le pare-chocs
    caisse.add(O.couche(O.cylindre(0.1, 0.1, 0.5, m.teinte, 10, CT.noir), "z", 2.5, 0.62, 0)); // le treuil
    caisse.add(O.boite(0.08, 0.06, 0.12, m.teinte, 2.62, 0.62, 0, CT.acier));
    for (const s of [-1, 1]) caisse.add(O.cable([[2.56, 0.62, s * 0.62], [2.66, 0.66, s * 0.62], [2.56, 0.7, s * 0.62]], 0.025, m.teinte, CT.rouge, 6)); // les manilles
    caisse.add(O.boite(1.8, 0.05, 1.4, m.teinte, 1.6, 0.45, 0, CT.noir)); // le blindage sous le moteur
    caisse.add(O.boite(4.0, 0.25, 1.1, m.teinte, 0, 0.55, 0, CT.noir)); // le châssis
    // 3. L'arrière : le coffre, le hayon, les jerricans, l'antenne.
    caisse.add(O.boite(1.12, 0.06, 2 * demi - 0.1, P, -1.74, yCeinture - 0.03, 0));
    caisse.add(O.boite(0.08, yCeinture - yBas, 2 * demi - 0.1, P, -2.27, (yCeinture + yBas) / 2, 0));
    caisse.add(O.boite(0.2, 0.18, 2.0, m.teinte, -2.38, 0.6, 0, CT.olive)); // le pare-chocs arrière
    for (const z of [-0.35, 0.35]) {
      caisse.add(O.boite(0.16, 0.46, 0.32, m.teinte, -2.38, 1.0, z, CT.fut)); // un jerrican
      caisse.add(O.boite(0.17, 0.05, 0.1, m.teinte, -2.38, 1.25, z, CT.noir));
    }
    caisse.add(O.cylindre(0.05, 0.06, 0.12, m.teinte, 8, CT.noir).translateX(-2.1).translateY(1.3).translateZ(-0.9));
    caisse.add(O.cylindre(0.006, 0.014, 2.8, m.teinte, 4, CT.noir).translateX(-2.1).translateY(2.7).translateZ(-0.9));
    // 4. La cabine : le pare-brise en deux morceaux, le toit, le mur arrière.
    for (const s of [-1, 1]) {
      const vitre = O.boite(0.02, 0.56, 0.86, V, 0.67, 1.56, s * 0.48);
      vitre.rotation.z = 0.14;
      caisse.add(vitre);
    }
    for (const z of [-1.0, 0, 1.0]) { // les montants du pare-brise
      const montant = O.boite(0.08, 0.68, z ? 0.1 : 0.08, P, 0.66, 1.57, z);
      montant.rotation.z = 0.14;
      caisse.add(montant);
    }
    caisse.add(O.boite(0.12, 0.08, 2 * demi - 0.1, P, 0.6, 1.87, 0)); // le haut du cadre
    caisse.add(O.boite(0.14, 0.06, 2 * demi - 0.1, m.teinte, 0.72, yCeinture + 0.02, 0, fonce)); // le bas du cadre
    for (const s of [-1, 1]) caisse.add(O.boite(0.03, 0.03, 0.5, m.teinte, 0.74, yCeinture + 0.06, s * 0.45, CT.noir).rotateY(s * 0.3)); // les essuie-glaces
    caisse.add(O.boite(1.86, 0.07, 2 * demi - 0.04, P, -0.27, yToit, 0)); // le toit
    caisse.add(O.boite(0.06, yToit - yCeinture, 2 * demi - 0.1, P, -1.16, (yToit + yCeinture) / 2, 0)); // le mur arrière de la cabine
    // 5. L'intérieur : le plancher, le tunnel, le tableau de bord, le volant, les sièges, la radio, le pilote.
    caisse.add(O.boite(1.9, 0.04, 2 * demi - 0.12, m.teinte, -0.22, 0.64, 0, CT.noir));
    caisse.add(O.boite(0.06, yCeinture - 0.64, 2 * demi - 0.12, m.teinte, 0.72, (yCeinture + 0.64) / 2, 0, fonce)); // la cloison du moteur
    caisse.add(O.boite(1.7, 0.36, 0.5, m.teinte, -0.25, 0.82, 0, CT.olive)); // le gros tunnel (la boîte de vitesses)
    caisse.add(O.boite(0.28, 0.26, 2 * demi - 0.14, m.teinte, 0.56, 1.25, 0, CT.olive)); // le tableau de bord
    caisse.add(O.boite(0.02, 0.14, 0.5, m.teinte, 0.415, 1.28, -0.5, CT.noir)); // les compteurs
    for (const dz of [-0.14, 0, 0.14]) caisse.add(O.couche(O.cylindre(0.04, 0.04, 0.01, m.teinte, 10, 0xd8d0b0), "x", 0.405, 1.29, -0.5 + dz));
    caisse.add(O.boite(0.2, 0.3, 0.3, m.teinte, 0.1, 1.1, 0, CT.noir)); // la radio
    caisse.add(O.boite(0.01, 0.06, 0.2, m.teinte, -0.005, 1.18, 0, 0x2a7a3a));
    const volant = new THREE.Group();
    volant.add(O.piece(new THREE.TorusGeometry(0.19, 0.02, 6, 20), m.teinte, 0, 0, 0, CT.noir));
    for (const a of [0, 2.1, 4.2]) volant.add(O.boite(0.19, 0.025, 0.015, m.teinte, Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0, CT.noir).rotateZ(a));
    volant.rotation.set(0, Math.PI / 2, 0.45, "YXZ");
    volant.position.set(0.32, 1.42, -0.5);
    volant.updateMatrix();
    for (const t of [...volant.children]) (t.applyMatrix4(volant.matrix), caisse.add(t));
    caisse.add(O.tube([0.34, 1.41, -0.5], [0.5, 1.22, -0.5], 0.03, m.teinte, 6, CT.noir)); // la colonne de direction
    for (const [x, z] of [[-0.02, -0.5], [-0.02, 0.5], [-0.8, -0.5], [-0.8, 0.5]]) siege(caisse, m, x, 1.0, z, CT.toile);
    pilote(caisse, m, -0.02, 1.0, -0.5, [0.32, 1.42, -0.5], equipe);
    // 6. La tourelle du tireur (elle tourne) : l'anneau, le bouclier blindé avec sa vitre, la mitrailleuse, le tireur.
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.45, yToit + 0.035, 0);
    caisse.add(tourelle);
    tourelle.add(O.cylindre(0.6, 0.62, 0.1, m.teinte, 20, CT.noir).translateY(0.05));
    const plaque = (l, h, x, z, angle) => {
      const b = O.boite(0.05, h, l, P, x, 0.1 + h / 2, z);
      b.rotation.y = angle;
      tourelle.add(b);
    };
    plaque(0.8, 0.62, 0.62, 0, 0); // le bouclier de devant…
    for (const s of [-1, 1]) (plaque(0.55, 0.62, 0.45, s * 0.6, -s * 0.75), plaque(0.7, 0.5, 0.0, s * 0.72, Math.PI / 2)); // … ses côtés, penchés, et les flancs
    tourelle.add(O.boite(0.03, 0.22, 0.5, V, 0.64, 0.6, 0)); // la vitre blindée du bouclier
    tourelle.add(O.boite(0.06, 0.3, 0.12, m.teinte, 0.66, 0.28, 0, CT.noir)); // la fente du canon
    // la mitrailleuse lourde de 12,7 mm : le support, le boîtier, le canon avec son cache-flamme, les munitions
    tourelle.add(O.tube([0.15, 0.1, 0], [0.2, 0.32, 0], 0.035, m.teinte, 6, CT.acier));
    tourelle.add(O.boite(0.62, 0.16, 0.14, m.teinte, 0.18, 0.4, 0, CT.noir));
    tourelle.add(O.couche(O.cylindre(0.03, 0.03, 1.05, m.teinte, 8, CT.noir), "x", 1.0, 0.42, 0));
    tourelle.add(O.couche(O.cylindre(0.05, 0.05, 0.4, m.teinte, 8, CT.noir), "x", 0.65, 0.42, 0));
    tourelle.add(O.couche(O.cylindre(0.045, 0.04, 0.1, m.teinte, 8, CT.noir), "x", 1.55, 0.42, 0));
    tourelle.add(O.boite(0.26, 0.2, 0.14, m.teinte, 0.15, 0.36, -0.17, CT.olive));
    for (const s of [-1, 1]) tourelle.add(O.boite(0.04, 0.12, 0.03, m.teinte, -0.15, 0.4, s * 0.05, CT.noir)); // les poignées
    // le tireur, debout dans la tourelle (on voit ses jambes par les vitres)
    const buste = O.piece(new THREE.CapsuleGeometry(0.18, 0.3, 3, 10), m.teinte, -0.22, 0.25, 0, CT.tissu);
    buste.scale.set(0.85, 1, 1.15);
    tourelle.add(buste, O.boite(0.3, 0.36, 0.4, m.teinte, -0.22, 0.28, 0, 0x5f6a4a));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, -0.2, 0.66, 0, CT.peau));
    const casque = O.piece(new THREE.SphereGeometry(0.128, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, -0.21, 0.69, 0, CT.casque);
    casque.scale.set(1.08, 0.95, 1.05);
    tourelle.add(casque);
    for (const s of [-1, 1]) tourelle.add(O.tube([-0.2, 0.45, s * 0.2], [-0.05, 0.32, s * 0.2], 0.045, m.teinte, 6, CT.tissu), O.tube([-0.05, 0.32, s * 0.2], [-0.15, 0.4, s * 0.06], 0.04, m.teinte, 6, CT.tissu));
    for (const s of [-1, 1]) tourelle.add(O.tube([-0.22, -0.05, s * 0.1], [-0.22, -1.2, s * 0.11], 0.075, m.teinte, 6, CT.tissu)); // les jambes, dans la cabine
    // la marque de l'équipe : un panneau de couleur à l'arrière de la tourelle, et sur les portières
    const marque = new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3 });
    for (const s of [-1, 1]) {
      const b = O.boite(0.45, 0.22, 0.02, marque, 0.0, 0.42, s * 0.75);
      b.castShadow = false;
      tourelle.add(b);
      const d = O.boite(0.5, 0.22, 0.02, marque, 0.2, 0.95, s * (demi + 0.012));
      d.castShadow = false;
      caisse.add(d);
    }
    O.souder(tourelle);
    O.souder(caisse);
    // 7. Les roues (elles tournent) : tout-terrain, avec leurs crampons.
    const roues = [];
    for (const [x, z] of [[xR, zR], [xR, -zR], [-xR, zR], [-xR, -zR]]) {
      const r = new THREE.Mesh(geoRoueJeep(Math.sign(z), "#" + vert.getHexString()), m.teinte);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, rR, z);
      r.castShadow = true;
      g.add(r);
      roues.push(r);
    }
    return { g, caisse, tourelle, roues };
  }

  // Un membre d'équipage vu par la verrière : les épaules, la tête, le casque de pilote avec sa visière.
  function equipage(groupe, m, x, y, z, couleurCasque) {
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.2, 3, 8), m.teinte, x - 0.05, y - 0.3, z, CT.tissu);
    buste.scale.set(0.8, 1, 1.15);
    groupe.add(buste);
    groupe.add(O.boite(0.1, 0.55, 0.42, m.teinte, x - 0.28, y - 0.2, z, CT.noir)); // le dossier du siège
    groupe.add(O.piece(new THREE.SphereGeometry(0.13, 10, 8), m.teinte, x, y, z, couleurCasque || 0x3d4434));
    groupe.add(O.boite(0.06, 0.08, 0.2, m.teinte, x + 0.11, y - 0.02, z, 0x14181c)); // la visière
  }

  // (étape 70) LE BATEAU DE GUERRE (une vedette de combat), refait : une coque dont les flancs s'évasent vers le haut
  // (l'étrave, à l'avant, est penchée vers l'avant pour fendre les vagues), une bande noire à la ligne de flottaison,
  // un pont antidérapant, la passerelle avec un bandeau de vitres tout autour (on voit le barreur dedans), le mât
  // avec son radar qui tourne, ses antennes et ses feux, le canon dans sa tourelle « furtive » à l'avant, une
  // mitrailleuse de chaque côté, les radeaux de survie, le canot pneumatique à l'arrière, l'ancre et les bittes
  // d'amarrage. Construit « nez vers x+ », la ligne de flottaison en y = 0.
  function bateau(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe], V = vitreClaire();
    const coqueCouleur = new THREE.MeshStandardMaterial({ color: /^bleus/.test(equipe) ? 0x5d6870 : 0x7a7466, roughness: 0.55, metalness: 0.35 });
    const clair = /^bleus/.test(equipe) ? 0x6b7680 : 0x8a8476, pontCouleur = 0x3e4245;
    g.add(caisse);
    // la coque : le contour du pont (en haut, large) et celui du fond (en bas, plus petit et plus court devant)
    const haut = [[5.0, 0], [4.3, 0.62], [2.6, 1.42], [0.6, 1.7], [-5.0, 1.7], [-5.0, 0]];
    const bas = [[3.3, 0], [2.8, 0.4], [1.6, 0.95], [0.2, 1.2], [-4.92, 1.22], [-4.92, 0]];
    const entre = (t) => haut.map((p, i) => [bas[i][0] + (p[0] - bas[i][0]) * t, bas[i][1] + (p[1] - bas[i][1]) * t]);
    const y0 = -0.6, y1 = 1.0, tF = (0 - y0) / (y1 - y0); // (t à la ligne de flottaison)
    caisse.add(O.lisse(O.contourComplet(bas), O.contourComplet(entre(tF)), y0, 0, coqueCouleur));
    caisse.add(O.lisse(O.contourComplet(entre(tF)), O.contourComplet(haut), 0, y1, coqueCouleur));
    const plus = (c, d) => c.map(([x, z]) => [x + (x > 0 ? d : -d * 0.2), z + (z > 0 ? d : 0)]);
    caisse.add(O.lisse(O.contourComplet(plus(entre(tF - 0.02), 0.025)), O.contourComplet(plus(entre(tF + 0.1), 0.025)), -0.03, 0.16, m.teinte, 0x16181a)); // la bande de flottaison
    caisse.add(O.lisse(O.contourComplet(plus(entre(0.66), 0.02)), O.contourComplet(plus(entre(0.76), 0.02)), 0.45, 0.6, m.teinte, new THREE.Color(E.marque).getHex())); // la bande de l'équipe
    const pont = haut.map(([x, z]) => [x - (x > 0 ? 0.12 : -0.06), Math.max(0, z - 0.1)]);
    caisse.add(O.lisse(O.contourComplet(pont), O.contourComplet(pont), y1, y1 + 0.03, m.teinte, pontCouleur)); // le pont antidérapant
    // le pavois (le petit mur tout autour de l'avant) et le garde-corps, avec ses montants
    for (const s of [-1, 1]) {
      caisse.add(O.cable([[4.9, y1 + 0.3, 0], [4.25, y1 + 0.3, s * 0.6], [2.6, y1 + 0.28, s * 1.38], [0.6, y1 + 0.25, s * 1.64], [-4.9, y1 + 0.25, s * 1.64]], 0.03, m.teinte, 0xa0a6aa, 40));
      caisse.add(O.cable([[4.9, y1 + 0.75, 0], [4.25, y1 + 0.75, s * 0.6], [2.6, y1 + 0.72, s * 1.38], [0.6, y1 + 0.7, s * 1.64], [-4.9, y1 + 0.7, s * 1.64]], 0.025, m.teinte, 0xa0a6aa, 40));
      for (let k = 0; k < 9; k++) {
        const x = -4.8 + k * 1.15, z = x > 0.6 ? 1.64 - (x - 0.6) * 0.12 : 1.64;
        caisse.add(O.tube([x, y1, s * z], [x, y1 + 0.75, s * z], 0.022, m.teinte, 5, 0xa0a6aa));
      }
      for (const x of [3.6, -4.3]) { // les bittes d'amarrage
        caisse.add(O.cylindre(0.09, 0.09, 0.3, m.teinte, 8, CT.noir).translateX(x).translateY(y1 + 0.15).translateZ(s * 1.1));
        caisse.add(O.cylindre(0.09, 0.09, 0.3, m.teinte, 8, CT.noir).translateX(x + 0.3).translateY(y1 + 0.15).translateZ(s * 1.1));
      }
      // l'ancre, dans son écubier, et le numéro de coque
      caisse.add(O.boite(0.35, 0.4, 0.06, m.teinte, 3.7, 0.75, s * 0.8, CT.noir).rotateY(-s * 0.45));
      const numero = O.boite(0.9, 0.3, 0.02, m.teinte, 1.6, 0.68, s * 1.46, 0xe8e8e8);
      numero.rotation.set(s * 0.36, -s * 0.12, 0, "YXZ");
      caisse.add(numero);
    }
    // la passerelle : le bas plein, le bandeau de vitres tout autour (penché), le toit ; le barreur et sa console
    const pB = [[0.55, 0], [0.45, 1.05], [-2.6, 1.1], [-2.7, 0]], pV = [[0.25, 0], [0.18, 0.98], [-2.55, 1.03], [-2.62, 0]], pT = [[0.1, 0], [0.05, 0.95], [-2.5, 1.0], [-2.58, 0]];
    caisse.add(O.lisse(O.contourComplet(pB), O.contourComplet(pB.map(([x, z]) => [x - 0.2, z && z - 0.04])), y1, 2.1, coqueCouleur));
    caisse.add(O.lisse(O.contourComplet(pB.map(([x, z]) => [x - 0.2, z && z - 0.04])), O.contourComplet(pV), 2.1, 2.65, V));
    caisse.add(O.lisse(O.contourComplet(pV.map(([x, z]) => [x + 0.08, z && z + 0.06])), O.contourComplet(pT), 2.65, 2.8, coqueCouleur));
    for (const z of [-0.6, 0, 0.6]) caisse.add(O.tube([0.28, 2.1, z], [0.2, 2.65, z * 0.95], 0.035, m.teinte, 5, clair)); // les montants des vitres
    caisse.add(O.boite(0.5, 0.35, 1.8, m.teinte, -0.2, 2.25, 0, CT.noir)); // la console
    equipage(caisse, m, -0.85, 2.45, -0.35, 0x2c3a5a);
    equipage(caisse, m, -0.85, 2.45, 0.45, 0x2c3a5a);
    // le mât : le pied, la vergue, les antennes, les feux ; le radar (il tourne) au sommet
    caisse.add(O.lisse(O.contourComplet([[-0.8, 0], [-0.8, 0.35], [-2.2, 0.4], [-2.2, 0]]), O.contourComplet([[-1.3, 0], [-1.3, 0.2], [-2.0, 0.22], [-2.0, 0]]), 2.8, 4.3, coqueCouleur));
    caisse.add(O.boite(0.1, 0.1, 2.2, m.teinte, -1.6, 4.0, 0, clair)); // la vergue
    for (const s of [-1, 1]) {
      caisse.add(O.cylindre(0.02, 0.03, 1.6, m.teinte, 5, CT.noir).translateX(-1.6).translateY(4.8).translateZ(s * 1.0));
      caisse.add(O.boite(0.1, 0.1, 0.08, m.teinte, -1.6, 4.1, s * 1.08, s > 0 ? 0x1aa040 : 0xc02020)); // les feux de position (vert à tribord, rouge à bâbord)
    }
    caisse.add(O.cylindre(0.05, 0.06, 0.6, m.teinte, 6, clair).translateX(-1.6).translateY(4.6));
    caisse.add(O.piece(new THREE.SphereGeometry(0.22, 10, 8), m.teinte, -2.0, 4.5, 0, 0xe8e8e8)); // le dôme du satellite
    caisse.add(O.boite(0.4, 0.04, 0.3, m.teinte, -1.95, 4.32, 0, clair));
    // le canon dans sa tourelle furtive à l'avant (elle tourne), deux mitrailleuses sur les côtés
    const tourelle = new THREE.Group();
    tourelle.position.set(2.4, y1 + 0.03, 0);
    caisse.add(tourelle);
    tourelle.add(O.cylindre(0.75, 0.85, 0.35, coqueCouleur, 16).translateY(0.17));
    tourelle.add(O.lisse(O.contourComplet([[0.8, 0], [0.55, 0.6], [-0.75, 0.62], [-0.8, 0]]), O.contourComplet([[0.35, 0], [0.2, 0.42], [-0.7, 0.44], [-0.75, 0]]), 0.35, 1.05, coqueCouleur));
    tourelle.add(O.couche(O.cylindre(0.2, 0.2, 0.3, coqueCouleur, 12), "x", 0.75, 0.72, 0));
    tourelle.add(O.couche(O.cylindre(0.08, 0.11, 2.3, m.teinte, 10, CT.noir), "x", 2.0, 0.72, 0));
    tourelle.add(O.couche(O.cylindre(0.11, 0.11, 0.25, m.teinte, 10, CT.noir), "x", 3.15, 0.72, 0)); // le frein de bouche
    tourelle.add(O.boite(0.25, 0.2, 0.2, m.teinte, -0.1, 1.15, 0.25, CT.noir), O.boite(0.03, 0.12, 0.14, M.verre, 0.03, 1.16, 0.25)); // le viseur
    O.souder(tourelle);
    for (const s of [-1, 1]) {
      caisse.add(O.cylindre(0.05, 0.08, 0.8, m.teinte, 6, CT.noir).translateX(-3.2).translateY(y1 + 0.4).translateZ(s * 1.35));
      caisse.add(O.boite(0.5, 0.12, 0.1, m.teinte, -3.1, y1 + 0.85, s * 1.35, CT.noir));
      caisse.add(O.couche(O.cylindre(0.025, 0.025, 0.9, m.teinte, 6, CT.noir), "x", -2.5, y1 + 0.87, s * 1.35));
      caisse.add(O.boite(0.06, 0.4, 0.5, m.teinte, -2.85, y1 + 0.95, s * 1.35, clair)); // le bouclier
      // les radeaux de survie (des tonneaux blancs), sur le toit de la passerelle
      caisse.add(O.couche(O.cylindre(0.25, 0.25, 0.8, m.teinte, 10, 0xeeeeee), "x", -1.6, 2.15, s * 1.25));
    }
    // l'arrière : le moteur, les échappements, le canot pneumatique sur son support
    caisse.add(O.boite(1.4, 0.5, 2.0, m.teinte, -4.0, y1 + 0.25, 0, 0x4a4d50));
    for (const s of [-1, 1]) caisse.add(O.cylindre(0.12, 0.12, 0.6, m.teinte, 8, CT.noir).translateX(-4.3).translateY(y1 + 0.75).translateZ(s * 0.55));
    for (const s of [-1, 1]) caisse.add(O.couche(O.piece(new THREE.CapsuleGeometry(0.2, 2.0, 3, 8), m.teinte, 0, 0, 0, 0x2b2b2b), "x", -3.9, y1 + 0.75, s * 0.48));
    caisse.add(O.boite(2.2, 0.08, 0.8, m.teinte, -3.9, y1 + 0.6, 0, 0x3a3a3a));
    caisse.add(O.boite(0.3, 0.3, 0.3, m.teinte, -4.85, y1 + 0.75, 0, CT.noir)); // son moteur
    // le pavillon, à l'arrière
    caisse.add(O.cylindre(0.025, 0.025, 1.4, m.teinte, 5, clair).translateX(-4.9).translateY(y1 + 0.7));
    const pav = O.boite(0.55, 0.36, 0.01, new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3, side: THREE.DoubleSide }), -5.2, y1 + 1.2, 0);
    pav.userData.garder = true;
    caisse.add(pav);
    O.souder(caisse);
    const radar = new THREE.Group();
    radar.position.set(-1.6, 4.95, 0);
    caisse.add(radar);
    radar.add(O.cylindre(0.12, 0.15, 0.25, m.teinte, 10, clair));
    radar.add(O.boite(0.18, 0.2, 1.5, m.teinte, 0.05, 0.2, 0, 0xd8dadc));
    O.souder(radar);
    return { g, caisse, tourelle, radar };
  }

  // (étape 63, refait à l'étape 70) Le SOUS-MARIN : une coque en forme de goutte d'eau (le nez rond, le long corps, la
  // queue qui s'effile), le pont plat avec ses trous (pour que l'eau s'écoule), le kiosque profilé avec ses vitres et
  // ses barres de plongée, les mâts (deux périscopes, le tuba, l'antenne radar), les gouvernails en X à l'arrière et
  // l'hélice à 7 pales recourbées. Construit « nez vers x+ », avec le bas de la coque en y = 0.
  function sousmarin(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const coque = new THREE.MeshStandardMaterial({ color: /^bleus/.test(equipe) ? 0x2b3136 : 0x3a3530, roughness: 0.5, metalness: 0.45 });
    const fonce = /^bleus/.test(equipe) ? 0x1d2226 : 0x2a2622;
    g.add(caisse);
    caisse.add(O.fuseau([
      { x: -7.3, y: 1.3, w: 0.12, h: 0.12 }, { x: -6.4, y: 1.3, w: 0.55, h: 0.55 }, { x: -5.0, y: 1.3, w: 1.05, h: 1.05 },
      { x: -3.4, y: 1.3, w: 1.25, h: 1.25 }, { x: 4.6, y: 1.3, w: 1.25, h: 1.25 }, { x: 5.9, y: 1.3, w: 1.12, h: 1.12 },
      { x: 6.7, y: 1.3, w: 0.8, h: 0.8 }, { x: 7.1, y: 1.3, w: 0.38, h: 0.38 }, { x: 7.22, y: 1.3, w: 0.05, h: 0.05 },
    ], coque, 22));
    // le pont, et ses trous d'écoulement ; l'écoutille ; les taquets
    caisse.add(O.boite(8.6, 0.12, 1.1, coque, 0.6, 2.52, 0));
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) caisse.add(O.boite(0.22, 0.06, 0.02, m.teinte, -3.4 + k * 0.6, 2.36, s * 0.92, 0x050607));
    caisse.add(O.cylindre(0.3, 0.32, 0.08, m.teinte, 14, fonce).translateX(-2.2).translateY(2.6));
    for (const x of [4.0, -3.4]) caisse.add(O.boite(0.3, 0.1, 0.08, m.teinte, x, 2.62, 0, fonce));
    // le kiosque, profilé comme une aile vue de dessus, avec la passerelle et ses vitres
    const kB = [[2.5, 0], [2.15, 0.36], [1.1, 0.42], [0.1, 0.3], [-0.25, 0]], kH = [[2.35, 0], [2.05, 0.32], [1.1, 0.38], [0.15, 0.27], [-0.15, 0]];
    caisse.add(O.lisse(O.contourComplet(kB), O.contourComplet(kH), 2.4, 4.0, coque));
    for (const s of [-1, 1]) {
      caisse.add(O.boite(0.5, 0.12, 0.02, M.verre, 1.85, 3.85, s * 0.35).rotateY(s * 0.35));
      caisse.add(O.boite(1.2, 0.25, 0.02, new THREE.MeshStandardMaterial({ color: E.marque, roughness: 0.6 }), 1.1, 3.3, s * 0.41)); // la bande de l'équipe
      const barre = O.profil([[0, -0.04], [0.55, -0.05], [0.75, 0], [0.55, 0.05], [0, 0.04]], 0.9, coque, 0.02); // les barres de plongée
      barre.position.set(1.25, 3.35, s * 0.85);
      caisse.add(barre);
    }
    // les mâts : deux périscopes, le tuba, l'antenne radar
    for (const [x, z, h, r, tete] of [[1.75, 0.08, 1.6, 0.06, 0.13], [1.35, -0.08, 1.3, 0.07, 0.11], [0.9, 0.1, 1.0, 0.09, 0.14], [0.45, -0.05, 1.2, 0.05, 0.2]]) {
      caisse.add(O.cylindre(r, r, h, m.teinte, 8, 0x5b6066).translateX(x).translateY(4.0 + h / 2).translateZ(z));
      caisse.add(O.boite(tete, 0.16, 0.12, m.teinte, x + 0.02, 4.0 + h + 0.08, z, 0x5b6066));
    }
    caisse.add(O.boite(0.06, 0.08, 0.1, M.verre, 1.81, 5.68, 0.08));
    // les gouvernails en X, à l'arrière
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const ail = O.profil([[-5.4, 0], [-6.9, 1.6], [-7.3, 1.55], [-7.0, 0]], 0.1, coque, 0.02);
      ail.rotation.x = a;
      ail.position.y = 1.3;
      caisse.add(ail);
    }
    O.souder(caisse);
    // l'hélice : 7 pales recourbées et le cône du moyeu
    const helice = new THREE.Group();
    helice.position.set(-7.35, 1.3, 0);
    helice.add(O.couche(O.cylindre(0.05, 0.22, 0.45, m.teinte, 12, 0x8a6a3a), "x", 0, 0, 0).rotateZ(Math.PI));
    for (let k = 0; k < 7; k++) {
      const a = (k * Math.PI * 2) / 7;
      const pale = O.profil([[0.12, -0.12], [0.75, -0.02], [0.8, 0.12], [0.5, 0.2], [0.12, 0.12]], 0.035, m.teinte, 0.01, 0x8a6a3a);
      pale.rotation.set(a, 0, 0, "XYZ");
      pale.rotateY(Math.PI / 2);
      pale.rotateX(0.5);
      helice.add(pale);
    }
    O.souder(helice);
    caisse.add(helice);
    return { g, caisse, helice };
  }

  // (étape 64, refait à l'étape 70) LA DCA : une tourelle qui tourne avec le siège du tireur (et le tireur), son viseur, le
  // bouclier avec sa vitre, et 2 longs canons (avec leurs chargeurs et leurs freins de bouche) qui se lèvent.
  // ✍️ (demande 113) Elle n'est plus posée sur un socle : c'est le CAMION ANTIAÉRIEN. Le châssis est celui du camion de
  // transport (affichage/vehicules3d.js, sans bâche, avec ses béquilles), et la tourelle est posée sur son plateau.
  // Le tireur est une pièce à part (on le cache quand il est tombé).
  // ✍️ (demande 115) une ÉDITION peut inscrire sa propre arme sur le plateau (Guerre civile : la mitrailleuse lourde du
  // pick-up armé, affichage/vehicules3d-civile.js) : config « edition.modeles.dca »
  const DCA = {};
  const ajouterDCA = (id, f) => (DCA[id] = f);
  function dca(equipe) {
    const idDCA = (Tanks.CONFIG.edition.modeles || {}).dca;
    if (idDCA && DCA[idDCA]) return (mats(), DCA[idDCA](equipe));
    mats();
    const R = Tanks.CONFIG.engins.dca, base = Tanks.Vehicules3D.fabriquer("camionAA", equipe);
    const m = MT(), p = peintureSoudee(equipe), g = base.g, V = vitreClaire();
    const tourelle = new THREE.Group();
    tourelle.position.set(R.canon.x, 1.5, 0);
    g.add(tourelle);
    tourelle.add(O.cylindre(1.05, 1.1, 0.22, m.teinte, 18, CT.noir).translateY(0.11)); // la couronne (elle tourne dessus)
    tourelle.add(O.cylindre(0.95, 1.05, 0.5, p, 18).translateY(0.45));
    tourelle.add(O.boite(0.5, 0.12, 0.5, m.teinte, -0.65, 0.95, 0, CT.noir), O.boite(0.1, 0.55, 0.5, m.teinte, -0.92, 1.22, 0, CT.noir)); // le siège
    tourelle.add(O.tube([-0.3, 0.6, 0], [-0.65, 0.9, 0], 0.06, m.teinte, 6, CT.acier));
    // le bouclier, avec sa vitre et le viseur
    tourelle.add(O.boite(0.12, 0.7, 2.0, p, 0.5, 1.45, 0));
    tourelle.add(O.boite(0.12, 0.32, 0.9, p, 0.5, 1.97, 0));
    tourelle.add(O.boite(0.04, 0.3, 0.5, V, 0.5, 1.95, 0));
    tourelle.add(O.boite(0.25, 0.2, 0.15, m.teinte, 0.2, 2.0, 0, CT.noir), O.boite(0.02, 0.14, 0.12, M.verre, 0.33, 2.02, 0));
    for (const z of [-0.55, 0.55]) tourelle.add(O.boite(0.45, 0.4, 0.3, m.teinte, -0.2, 0.9, z * 1.45, CT.olive)); // les caisses d'obus des chargeurs
    O.souder(tourelle);
    // le tireur (assis, les mains sur les poignées)
    const tireur = new THREE.Group();
    tireur.name = "tireur";
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.25, 3, 8), m.teinte, -0.62, 1.38, 0, CT.tissu);
    buste.scale.set(0.8, 1, 1.15);
    tireur.add(buste, O.boite(0.26, 0.32, 0.36, m.teinte, -0.6, 1.38, 0, 0x5f6a4a));
    tireur.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, -0.58, 1.76, 0, CT.peau));
    tireur.add(O.piece(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, -0.6, 1.8, 0, CT.casque));
    tireur.add(O.boite(0.2, 0.05, 0.27, m.teinte, -0.6, 1.83, 0, Tanks.CONFIG.equipes[equipe].marque)); // le bandeau de son équipe
    for (const s of [-1, 1]) {
      tireur.add(O.tube([-0.6, 1.1, s * 0.12], [-0.2, 1.05, s * 0.14], 0.07, m.teinte, 6, CT.tissu), O.tube([-0.2, 1.05, s * 0.14], [-0.15, 0.62, s * 0.14], 0.06, m.teinte, 6, CT.tissu));
      tireur.add(O.tube([-0.6, 1.55, s * 0.18], [-0.3, 1.45, s * 0.25], 0.045, m.teinte, 6, CT.tissu), O.tube([-0.3, 1.45, s * 0.25], [-0.05, 1.5, s * 0.2], 0.04, m.teinte, 6, CT.tissu));
      tireur.add(O.boite(0.06, 0.18, 0.06, m.teinte, -0.03, 1.5, s * 0.2, CT.noir)); // les poignées
    }
    O.souder(tireur);
    tourelle.add(tireur);
    const canons = new THREE.Group();
    canons.position.set(0.3, 1.6, 0);
    tourelle.add(canons);
    for (const z of [-0.45, 0.45]) {
      canons.add(O.boite(1.1, 0.38, 0.3, m.teinte, 0.25, 0, z, 0x3a3d40)); // le boîtier
      canons.add(O.boite(0.5, 0.42, 0.22, m.teinte, 0.1, 0.32, z, CT.olive)); // le chargeur
      canons.add(O.couche(O.cylindre(0.11, 0.11, 1.0, m.teinte, 10, 0x3a3d40), "x", 1.1, 0, z)); // le manchon
      canons.add(O.couche(O.cylindre(0.06, 0.075, 2.3, m.teinte, 10, CT.noir), "x", 2.4, 0, z)); // le tube
      canons.add(O.couche(O.cylindre(0.11, 0.11, 0.32, m.teinte, 10, CT.noir), "x", 3.45, 0, z)); // le frein de bouche
      for (const dx of [-0.08, 0.08]) canons.add(O.boite(0.06, 0.24, 0.24, m.teinte, 3.45 + dx, 0, z, 0x0d0d0d));
    }
    O.souder(canons);
    const flammes = [];
    for (const z of [-0.45, 0.45]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
      f.position.set(3.75, 0, z);
      f.visible = false;
      canons.add(f);
      flammes.push(f);
    }
    return Object.assign(base, { tourelle, canons, flammes, tireur });
  }

  // (demande 96) l'image de la lueur des portails : un rond blanc qui s'efface vers le bord (faite une seule fois)
  let lueurPortail = null;
  function imageLueur() {
    if (lueurPortail) return lueurPortail;
    const toile = document.createElement("canvas");
    toile.width = toile.height = 64;
    const ctx = toile.getContext("2d"), d = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    d.addColorStop(0, "rgba(255,255,255,1)");
    d.addColorStop(0.35, "rgba(255,255,255,0.45)");
    d.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = d;
    ctx.fillRect(0, 0, 64, 64);
    return (lueurPortail = new THREE.CanvasTexture(toile));
  }

  // Le portail : un anneau qui brille, un tourbillon (un disque avec une spirale dessinée, qui tourne) et un socle.
  function portail(couleur, rayon) {
    const g = new THREE.Group(), c = new THREE.Color(couleur);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(rayon, 0.38, 14, 48), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.4 }));
    anneau.position.y = rayon + 0.3;
    g.add(anneau);
    const toile = document.createElement("canvas");
    toile.width = toile.height = 256;
    const ctx = toile.getContext("2d");
    const fond = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
    fond.addColorStop(0, "rgba(255,255,255,0.95)");
    fond.addColorStop(0.4, couleur);
    fond.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 6;
    for (let bras = 0; bras < 4; bras++) { // la spirale (4 bras)
      ctx.beginPath();
      for (let k = 0; k < 60; k++) {
        const a = bras * (Math.PI / 2) + k * 0.09, r = k * 2.1;
        ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    const tourbillon = new THREE.Mesh(new THREE.CircleGeometry(rayon - 0.2, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    tourbillon.rotation.y = Math.PI / 2; // (le disque face à x+ : on passe à travers en allant le long de x)
    tourbillon.position.y = rayon + 0.3;
    g.add(tourbillon);
    anneau.rotation.y = Math.PI / 2;
    const pierre = new THREE.MeshStandardMaterial({ color: 0x8a8578, roughness: 0.95 });
    for (const z of [-rayon - 0.3, rayon + 0.3]) g.add(boite(1.4, 1.2, 1.4, pierre, 0, 0.3, z));
    // (demande 96, « ça rame ») plus de VRAIE lumière dans le portail : chaque vraie lumière oblige la carte graphique à
    // refaire un calcul pour CHAQUE point de l'écran (même très loin du portail !). À la place, une LUEUR peinte : un disque
    // posé au sol, qui ajoute sa couleur, plus forte au centre (presque le même effet, 1 seul petit dessin).
    const lueur = new THREE.Mesh(new THREE.CircleGeometry(rayon * 2.4, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: imageLueur(), color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: true }));
    lueur.position.y = 0.25;
    lueur.renderOrder = 3;
    lueur.name = "lueur du portail";
    g.add(lueur);
    return { g, tourbillon, anneau };
  }

  function fabriquer(sorte, equipe, modele) {
    if (Tanks.Vehicules3D && Tanks.Vehicules3D.sait(sorte)) return Tanks.Vehicules3D.fabriquer(sorte, equipe); // (étape 71)
    if (Tanks.Helicos3D && Tanks.Helicos3D.sait(sorte)) return Tanks.Helicos3D.fabriquer(sorte, equipe); // (étape 73)
    if (Tanks.Avions3D && Tanks.Avions3D.sait(sorte)) return Tanks.Avions3D.fabriquer(sorte, equipe, modele); // (étape 76 : les avions, le drone et le Tigre ; demande 115 : ou le modèle de l'édition)
    if (sorte === "mitrailleuse") return Tanks.Tranchees3D.mitrailleuse(equipe); // (demande 115 : la mitrailleuse lourde des tranchées)
    return { jeep, bateau, sousmarin, dca }[sorte](equipe);
  }
  function bruler(o) {
    const m = mats();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
  }

  // (étape 71) la moto, le quad et le camion sont fabriqués dans affichage/vehicules3d.js (qui réutilise ces outils)
  // (étape 73) le Chinook et le Black Hawk, dans affichage/helicos3d.js
  // (étape 76) le Rafale, les chasseurs ennemis, l'avion de transport, le drone et le Tigre, dans affichage/avions3d.js
  const outils = { pilote, siege, peintureSoudee, vitreClaire, mats, figurine, figurineDans, poserBras, MAINS, galet, membre, formesArmes };
  return { soldat, animer, fabriquer, bruler, portail, silhouettes, outils, gestes, bilanChargeurs, baisse, classeDe, maquettes, PEAUX, ajouterDCA, preparerUneForme, habit, bilanOmbres, get formesAPreparer() { return aPreparer ? aPreparer.length : -1; } };
})();
