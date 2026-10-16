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
  function matsSoldat(equipe) {
    if (matsEquipe[equipe]) return matsEquipe[equipe];
    const E = Tanks.CONFIG.equipes[equipe], camo = Tanks.Chars3D.camouflage(E.camouflage).clone();
    camo.needsUpdate = true;
    camo.repeat.set(2.2, 2.2); // (des taches plus petites que sur un tank)
    return (matsEquipe[equipe] = {
      tenue: new THREE.MeshStandardMaterial({ map: camo, roughness: 0.93 }),
      // (étape 74) tout le reste dans UNE matière : chaque pièce garde sa couleur dans ses sommets
      teinte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.05 }),
      arme: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.55 }),
      couleurs: {
        gilet: equipe === "bleus" ? 0x4f5739 : 0x8a7652, sac: equipe === "bleus" ? 0x48502f : 0x7c6a48, sangle: 0x35342a,
        bottes: equipe === "bleus" ? 0x4a3d2c : 0x7a6244, semelle: 0x1d1a17, gants: 0x2b2b27, protege: 0x2e3029,
        arme: 0x232528, polymere: 0x2d2c28, verre: 0x0d1418, blanc: 0xe6e1d8, pupille: 0x1c140f, sourcils: 0x3a2a1c,
        marque: new THREE.Color(E.marque).getHex(), marqueToi: new THREE.Color(E.marque).multiplyScalar(1.35).getHex(),
        casqueBord: new THREE.Color(E.camouflage[2]).getHex(), tenue: new THREE.Color(E.camouflage[0]).getHex(),
      },
    });
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
  function pieces(equipe, detail, peau, joueur) {
    const K = matsSoldat(equipe).couleurs, L = [], s = detail ? 12 : 7;
    const p = (osNom, geo, x, y, z, couleur, rx, ry, rz) => L.push({ os: osNom, geo, x, y, z, couleur, rx: rx || 0, ry: ry || 0, rz: rz || 0 });
    const pc = (osNom, geo, x, y, z, couleur, rx, ry, rz) => p(osNom, geo, x, y, z, couleur, rx, ry, rz);
    // les jambes (0 : gauche, z < 0 ; 1 : droite)
    for (const k of [0, 1]) {
      const cote = k ? 1 : -1, h = "jambe" + k, g = "genou" + k;
      pc(h, membre(0.09, 0.068, OS.cuisse + 0.03, s), 0, 0.02, 0, "tenue");
      if (detail) pc(h, galet(0.075, 0.13, 0.05, 0.4, 8), 0.0, -0.21, cote * 0.075, "tenue"); // la poche de cuisse
      pc(g, membre(0.068, 0.05, OS.tibia - 0.02, s), 0, 0, 0, "tenue");
      pc(g, galet(0.065, 0.13, 0.115, 0.45, detail ? 10 : 6), 0.06, -0.03, 0, K.protege); // la genouillère
      pc(g, membre(0.06, 0.058, 0.17, s), 0, -0.27, 0, K.bottes); // la tige de la botte
      pc(g, galet(0.27, 0.11, 0.115, 0.3, detail ? 12 : 7), 0.05, -0.41, 0, K.bottes); // le pied
      pc(g, galet(0.285, 0.035, 0.122, 0.2, detail ? 10 : 6), 0.05, -0.465, 0, K.semelle); // la semelle
    }
    // le bassin, le buste, le gilet porte-plaques, le sac
    pc("dos", galet(0.25, 0.22, 0.35, 0.5, s), 0, -0.05, 0, "tenue"); // le bassin
    pc("dos", galet(0.25, 0.46, 0.37, 0.55, s), 0, 0.24, 0, "tenue"); // le buste
    pc("dos", galet(0.275, 0.065, 0.375, 0.3, s), 0, 0.0, 0, K.sangle); // la ceinture
    pc("dos", galet(0.07, 0.34, 0.31, 0.3, s), 0.12, 0.27, 0, K.gilet); // la plaque de devant
    pc("dos", galet(0.07, 0.34, 0.31, 0.3, s), -0.12, 0.27, 0, K.gilet); // la plaque de derrière
    pc("dos", galet(0.265, 0.15, 0.39, 0.3, s), 0, 0.15, 0, K.gilet); // la large ceinture du gilet
    for (const z of [-0.1, 0.1]) pc("dos", galet(0.27, 0.05, 0.065, 0.3, 6), 0, 0.445, z, K.gilet); // les bretelles
    pc("dos", galet(0.21, 0.36, 0.3, 0.3, s), -0.25, 0.27, 0, K.sac); // le sac à dos
    if (detail) {
      for (const z of [-0.09, 0, 0.09]) pc("dos", galet(0.055, 0.11, 0.08, 0.3, 8), 0.175, 0.16, z, K.gilet); // 3 poches à chargeurs
      pc("dos", galet(0.045, 0.085, 0.15, 0.3, 8), 0.17, 0.33, 0, K.sac); // la poche de carte
      pc("dos", galet(0.06, 0.11, 0.06, 0.3, 8), 0.02, 0.2, -0.205, K.sac); // la poche radio
      pc("dos", galet(0.05, 0.05, 0.04, 0.3, 6), 0.165, 0.37, 0.1, joueur ? K.marqueToi : K.marque); // l'écusson de l'équipe
      pc("dos", galet(0.22, 0.07, 0.31, 0.3, 8), -0.25, 0.465, 0, K.gilet); // le rabat du sac
      for (const z of [-0.17, 0.17]) pc("dos", galet(0.11, 0.16, 0.06, 0.35, 8), -0.26, 0.2, z, K.gilet); // les poches du sac
      pc("dos", new THREE.CylinderGeometry(0.058, 0.058, 0.36, 10), -0.24, 0.53, 0, 0x3e4631, Math.PI / 2); // le duvet roulé
      pc("dos", new THREE.CylinderGeometry(0.006, 0.008, 0.55, 4), -0.33, 0.7, -0.1, K.sangle, 0, 0, 0.15); // l'antenne radio
      pc("dos", galet(0.04, 0.05, 0.045, 0.4, 6), 0.03, 0.02, 0.19, K.sac); // la gourde
    }
    // la tête
    pc("cou", membre(0.05, 0.056, 0.13, 8), 0, 0.1, 0, peau); // le cou
    pc("cou", new THREE.SphereGeometry(0.105, s + 2, s), 0.012, 0.13, 0, peau, 0, 0, 0); // le crâne
    L[L.length - 1].echelle = [1.0, 1.15, 0.92];
    pc("cou", galet(0.12, 0.075, 0.13, 0.6, detail ? 10 : 6), 0.035, 0.07, 0, peau); // la mâchoire
    const casque = new THREE.SphereGeometry(0.14, detail ? 22 : 12, detail ? 10 : 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
    pc("cou", casque, -0.005, 0.165, 0, "tenue"); // le casque (avec sa housse camouflée)
    L[L.length - 1].echelle = [1.1, 0.95, 1.04];
    pc("cou", new THREE.TorusGeometry(0.14, 0.012, 5, detail ? 24 : 12), -0.005, 0.165, 0, K.casqueBord, Math.PI / 2); // le bord du casque
    L[L.length - 1].echelle = [1.1, 1.04, 1];
    pc("cou", new THREE.TorusGeometry(0.133, 0.014, 5, detail ? 24 : 12), -0.005, 0.205, 0, joueur ? K.marqueToi : K.marque, Math.PI / 2); // ✍️ le bandeau de l'équipe
    L[L.length - 1].echelle = [1.1, 1.04, 1];
    if (detail) {
      pc("cou", galet(0.03, 0.045, 0.028, 0.5, 8), 0.112, 0.125, 0, peau); // le nez
      for (const z of [-0.036, 0.036]) {
        pc("cou", new THREE.SphereGeometry(0.0135, 8, 6), 0.094, 0.152, z, K.blanc); // le blanc de l'œil
        pc("cou", new THREE.SphereGeometry(0.0085, 6, 5), 0.105, 0.152, z, K.pupille); // la pupille
        pc("cou", galet(0.02, 0.011, 0.042, 0.4, 6), 0.1, 0.172, z * 1.05, K.sourcils); // le sourcil
      }
      pc("cou", galet(0.008, 0.007, 0.04, 0.5, 6), 0.106, 0.086, 0, 0x6b4334); // la bouche
      for (const z of [-0.112, 0.112]) pc("cou", galet(0.065, 0.075, 0.04, 0.45, 8), -0.005, 0.135, z, K.sangle); // le casque radio
      pc("cou", galet(0.035, 0.05, 0.17, 0.35, 8), 0.125, 0.235, 0, K.verre); // les lunettes de protection, relevées
      pc("cou", galet(0.03, 0.055, 0.05, 0.3, 6), 0.148, 0.2, 0, K.sangle); // le support des jumelles de nuit
      for (const z of [-0.147, 0.147]) pc("cou", galet(0.1, 0.018, 0.012, 0.3, 6), -0.005, 0.195, z, K.sangle); // les rails
      for (const z of [-0.09, 0.09]) pc("cou", galet(0.012, 0.11, 0.008, 0.5, 4), 0.05, 0.1, z * 1.05, K.sangle, 0.0, 0, -0.35); // la jugulaire
    }
    // les bras (0 : droit, z > 0 ; 1 : gauche)
    for (const k of [0, 1]) {
      const cote = k ? -1 : 1, e = "epaule" + k, c = "coude" + k;
      pc(e, galet(0.13, 0.12, 0.13, 0.7, s), 0, -0.02, 0, "tenue"); // l'épaule
      pc(e, membre(0.064, 0.054, OS.bras + 0.02, s), 0, 0, 0, "tenue");
      pc(e, new THREE.CylinderGeometry(0.068, 0.066, 0.07, s), 0, -0.1, 0, k === 0 && joueur ? K.marqueToi : K.marque); // ✍️ le brassard
      pc(c, membre(0.054, 0.042, OS.avantBras, s), 0, 0, 0, "tenue");
      if (detail) pc(c, galet(0.065, 0.075, 0.085, 0.45, 8), -0.03, -0.01, 0, K.protege); // la coudière
      pc(c, galet(0.055, 0.1, 0.085, 0.45, detail ? 10 : 6), 0, -OS.avantBras - 0.03, 0, K.gants); // la main gantée
      if (detail) pc(c, galet(0.028, 0.055, 0.028, 0.5, 6), 0.03, -OS.avantBras - 0.01, -cote * 0.03, K.gants, 0, 0, 0.4); // le pouce
    }
    return L;
  }

  // Fabriquer la forme d'un soldat dans une pose (les os déjà tournés) : chaque pièce est placée là où son os la met.
  // pourChair = true : on écrit aussi, pour chaque point, le numéro de son os (le « skinning ») et on reste « au repos ».
  const TEMP = new THREE.Object3D();
  function cuire(liste, squel, M, pourChair) {
    const parMat = { tenue: [], teinte: [] }, index = new Map(squel.liste.map((b, i) => [b, i]));
    const noms = { dos: squel.dos, cou: squel.cou, jambe0: squel.jambes[0], genou0: squel.genoux[0], jambe1: squel.jambes[1], genou1: squel.genoux[1], epaule0: squel.epaules[0], coude0: squel.coudes[0], epaule1: squel.epaules[1], coude1: squel.coudes[1] };
    squel.corps.updateMatrixWorld(true);
    const racine = new THREE.Matrix4().copy(squel.corps.parent ? squel.corps.parent.matrixWorld : new THREE.Matrix4()).invert();
    const c = new THREE.Color();
    for (const pc of liste) {
      const b = noms[pc.os];
      TEMP.position.set(pc.x, pc.y, pc.z);
      TEMP.rotation.set(pc.rx, pc.ry, pc.rz);
      TEMP.scale.set(...(pc.echelle || [1, 1, 1]));
      TEMP.updateMatrix();
      const m = new THREE.Matrix4().multiplyMatrices(racine, b.matrixWorld).multiply(TEMP.matrix);
      const g = (pc.geo.index ? pc.geo.toNonIndexed() : pc.geo.clone()).applyMatrix4(m), n = g.attributes.position.count;
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
      if (pc.couleur !== "tenue") {
        c.set(pc.couleur);
        const t = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) (t[i * 3] = c.r), (t[i * 3 + 1] = c.g), (t[i * 3 + 2] = c.b);
        g.setAttribute("color", new THREE.BufferAttribute(t, 3));
      }
      if (pourChair) {
        const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), k = index.get(b);
        for (let i = 0; i < n; i++) (si[i * 4] = k), (sw[i * 4] = 1);
        g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
        g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
      }
      parMat[pc.couleur === "tenue" ? "tenue" : "teinte"].push(g);
    }
    const res = {};
    for (const nom in parMat) {
      const geos = parMat[nom];
      if (!geos.length) continue;
      const attrs = ["position", "normal", "uv"].concat(nom === "teinte" ? ["color"] : [], pourChair ? ["skinIndex", "skinWeight"] : []);
      const geo = new THREE.BufferGeometry();
      for (const a of attrs) {
        const taille = geos[0].attributes[a].itemSize, Type = a === "skinIndex" ? Uint16Array : Float32Array;
        const tab = new Type(geos.reduce((t, g) => t + g.attributes[a].count * taille, 0));
        let k = 0;
        for (const g of geos) (tab.set(g.attributes[a].array.subarray(0, g.attributes[a].count * taille), k), (k += g.attributes[a].count * taille));
        geo.setAttribute(a, new THREE.BufferAttribute(tab, taille));
      }
      geo.computeBoundingSphere();
      res[nom] = geo;
    }
    return res;
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
  function armes(detail) {
    const F = formesArmes(detail), r = {};
    for (const nom of ["fusil", "pistolet", "roquettes"]) {
      const m = new THREE.Mesh(F[nom], F.mat);
      m.position.set(...PLACE_ARMES[nom]);
      m.castShadow = true;
      r[nom] = m;
    }
    return r;
  }
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
  function formeSoldat(equipe, detail, peau, joueur) {
    const cle = [equipe, detail, peau, joueur].join(":");
    if (formes[cle]) return formes[cle];
    const squel = os();
    return (formes[cle] = cuire(pieces(equipe, detail, PEAUX[peau], joueur), squel, matsSoldat(equipe), true));
  }
  // Un squelette tout neuf (ses os), habillé de la forme partagée.
  let numeroSoldat = 0;
  function squelette(equipe, joueur, detail, peau) {
    const M = matsSoldat(equipe), formesCorps = formeSoldat(equipe, detail, peau, !!joueur), r = os();
    const porteur = new THREE.Group(), squel = new THREE.Skeleton(r.liste);
    for (const nom of ["tenue", "teinte"]) {
      const m = new THREE.SkinnedMesh(formesCorps[nom], M[nom]);
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false; // (il bouge : sa bulle de départ ne suffit pas)
      porteur.add(m);
      if (nom === "tenue") m.add(r.corps);
      m.bind(squel);
    }
    const canons = armes(detail);
    for (const c of Object.values(canons)) r.dos.add(c);
    const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    flamme.position.set(0.98, 0.29, 0.1);
    r.dos.add(flamme);
    return { porteur, corps: r.corps, dos: r.dos, cou: r.cou, jambes: r.jambes, genoux: r.genoux, epaules: r.epaules, coudes: r.coudes, canons, flamme, pose: null };
  }

  // La « cinématique inverse » à 2 os : l'épaule S, la main voulue M ; on cherche le coude.
  // (Le triangle épaule-coude-main a deux côtés connus, le bras et l'avant-bras, et le troisième côté, c'est la
  // distance de l'épaule à la main : la loi des cosinus donne l'angle à l'épaule.)
  const BAS = new THREE.Vector3(0, -1, 0), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  function poserBras(epaule, coude, cible, pole) {
    const S = epaule.position, a = OS.bras, b = OS.avantBras + 0.01;
    const vers = new THREE.Vector3().fromArray(cible).sub(S), d = Math.min(a + b - 0.001, Math.max(0.05, vers.length()));
    vers.normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const p = pole.clone().sub(vers.clone().multiplyScalar(pole.dot(vers))).normalize();
    const coudeEn = vers.clone().multiplyScalar(a * cosA).add(p.multiplyScalar(a * sinA));
    const main = vers.clone().multiplyScalar(d);
    q1.setFromUnitVectors(BAS, coudeEn.clone().normalize());
    epaule.quaternion.copy(q1);
    q2.setFromUnitVectors(BAS, main.sub(coudeEn).normalize());
    coude.quaternion.copy(q1.clone().invert().multiply(q2));
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

  function soldat(equipe, joueur) {
    const g = new THREE.Group(), peau = joueur ? 0 : numeroSoldat++ % PEAUX.length;
    const detail = squelette(equipe, joueur, true, peau), simple = squelette(equipe, joueur, false, peau);
    g.add(detail.porteur, simple.porteur);
    simple.porteur.visible = false;
    // le parachute (pour toi, quand tu t'éjectes de l'avion ; et, étape 64, pour les parachutistes)
    let parachute = null;
    {
      const m = mats();
      parachute = new THREE.Group();
      const voile = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35), new THREE.MeshStandardMaterial({ color: 0x8a9a5a, roughness: 0.9, side: THREE.DoubleSide }));
      voile.position.y = 2.2;
      parachute.add(voile);
      for (const [x, z] of [[1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]]) {
        const fil = cyl(0.01, 0.01, 4.5, m.noir, 4);
        fil.position.set(x / 2, 3.6, z / 2);
        fil.lookAt(new THREE.Vector3(0, 1.4, 0));
        fil.rotateX(Math.PI / 2);
        parachute.add(fil);
      }
      parachute.position.y = 1.5;
      parachute.visible = false;
      g.add(parachute);
    }
    return { g, detail, simple, parachute };
  }

  // L'animation : marcher, courir, tourner sur place, nager, tomber, (étape 74) glisser à la corde. t = l'horloge (s).
  const DANS_LE_DOS = { position: new THREE.Vector3(-0.27, 0.3, -0.05), rotation: new THREE.Euler(0.15, 0, -1.0) }; // (le fusil, à la corde)
  function animer(o, s, t, tourne, pres) {
    const r = pres ? o.detail : o.simple;
    o.detail.porteur.visible = pres;
    o.simple.porteur.visible = !pres;
    const arme = s.arme === "pistolet" ? "pistolet" : s.arme === "roquettes" || s.roquettesIA ? "roquettes" : "fusil";
    const corde = !!s.corde && !s.mort;
    for (const n in r.canons) r.canons[n].visible = (n === arme || (corde && n === "fusil")) && !s.nage && !s.mort;
    // (à la corde, le fusil passe dans le dos ; sinon il revient dans les mains)
    const f = r.canons.fusil;
    if (corde !== !!r.fusilDansLeDos) {
      r.fusilDansLeDos = corde;
      if (corde) (f.position.copy(DANS_LE_DOS.position), f.rotation.copy(DANS_LE_DOS.rotation));
      else (f.position.set(...PLACE_ARMES.fusil), f.rotation.set(0, 0, 0));
    }
    r.flamme.visible = s.tir > 0 && arme !== "roquettes" && !s.mort && !corde;
    if (r.flamme.visible) r.flamme.position.x = arme === "pistolet" ? 0.62 : 0.98;
    const c = r.corps;
    if (s.mort) {
      // il tombe sur le dos en une demi-seconde, les bras ouverts
      const k = Math.min(1, s.depuisMort * 2);
      c.rotation.set(0, 0, k * (Math.PI / 2));
      c.position.set(0, 0.12 * k, 0);
      r.pose = null;
      for (const e of r.epaules) e.quaternion.identity(), e.rotation.set(0, 0, 0.6 * k);
      for (const g of r.genoux) g.rotation.set(0, 0, -0.3 * k);
      for (const j of r.jambes) j.rotation.set(0, 0, 0);
      return;
    }
    if (corde) {
      // ✍️ (étape 74) à la corde : les deux mains serrent la corde au-dessus de la tête, les jambes pliées serrent la
      // corde (une jambe plus pliée que l'autre), le corps un peu penché en arrière ; il se balance un tout petit peu.
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
      c.rotation.set(0, 0, -1.35);
      c.position.set(-0.2, 1.12, 0);
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
    c.rotation.set(0, 0, 0);
    tenir(r, arme);
    // les jambes : la hanche se balance, le genou plie quand la jambe revient vers l'arrière
    const v = Math.abs(s.vitesse), ampleur = Math.max(Math.min(1, v / 3.5), tourne ? 0.35 : 0);
    const phase = s.pas * 2.6 + (tourne && v < 0.5 ? t * 7 : 0);
    for (let i = 0; i < 2; i++) {
      const p = phase + i * Math.PI, sens = s.vitesse < -0.1 ? -1 : 1;
      r.jambes[i].rotation.z = Math.sin(p) * 0.55 * ampleur * sens;
      r.genoux[i].rotation.z = -Math.max(0, Math.sin(p + 1.3)) * 0.95 * ampleur;
    }
    // le corps monte et descend un peu à chaque pas, et se penche en avant quand il court ; il respire au repos
    c.position.set(0, -Math.abs(Math.cos(phase)) * 0.045 * ampleur, 0);
    r.dos.rotation.set(0, 0, -0.13 * Math.min(1, v / 4) + (s.tir > 0 && arme !== "roquettes" ? 0.025 : 0)); // (le recul du tir)
    r.dos.scale.y = 1 + Math.sin(t * 2.2) * 0.008 * (1 - ampleur);
    r.cou.rotation.set(0, 0, 0.08 * Math.min(1, v / 4)); // (il garde la tête droite en courant)
  }

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
  function silhouettes(equipe, max) {
    const M = matsSoldat(equipe), r = os();
    new THREE.Group().add(r.corps);
    poserBras(r.epaules[0], r.coudes[0], MAINS.fusil.droite, POLES[0]);
    poserBras(r.epaules[1], r.coudes[1], MAINS.fusil.gauche, POLES[1]);
    const geos = cuire(pieces(equipe, false, PEAUX[0], false), r, M, false);
    // le tissu camouflé prend la couleur de fond du camouflage (une instance n'a qu'une matière : celle à couleurs)
    const tenue = geos.tenue, n = tenue.attributes.position.count, t = new Float32Array(n * 3), c = new THREE.Color(M.couleurs.tenue);
    for (let i = 0; i < n; i++) (t[i * 3] = c.r), (t[i * 3 + 1] = c.g), (t[i * 3 + 2] = c.b);
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
    const coqueCouleur = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x5d6870 : 0x7a7466, roughness: 0.55, metalness: 0.35 });
    const clair = equipe === "bleus" ? 0x6b7680 : 0x8a8476, pontCouleur = 0x3e4245;
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
    const coque = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x2b3136 : 0x3a3530, roughness: 0.5, metalness: 0.45 });
    const fonce = equipe === "bleus" ? 0x1d2226 : 0x2a2622;
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

  // (étape 64, refait à l'étape 70) LA DCA : un socle posé sur 4 bras avec leurs vérins, une tourelle qui tourne avec
  // le siège du tireur (et le tireur), son viseur, le bouclier avec sa vitre, et 2 longs canons (avec leurs chargeurs et
  // leurs freins de bouche) qui se lèvent.
  function dca(equipe) {
    mats();
    const m = MT(), p = peintureSoudee(equipe), g = new THREE.Group(), caisse = new THREE.Group(), V = vitreClaire();
    g.add(caisse);
    caisse.add(O.cylindre(1.6, 1.9, 0.45, p, 20).translateY(0.25)); // le socle
    for (let k = 0; k < 4; k++) { // les 4 bras et leurs vérins
      const a = (k * Math.PI) / 2 + Math.PI / 4, c = Math.cos(a), s = -Math.sin(a);
      caisse.add(O.boite(2.4, 0.22, 0.32, p, c * 1.6, 0.18, s * 1.6).rotateY(a));
      caisse.add(O.cylindre(0.06, 0.06, 0.5, m.teinte, 8, CT.acier).translateX(c * 2.6).translateY(0.3).translateZ(s * 2.6));
      caisse.add(O.cylindre(0.25, 0.28, 0.06, m.teinte, 12, CT.noir).translateX(c * 2.6).translateY(0.03).translateZ(s * 2.6)); // le patin
    }
    caisse.add(O.boite(0.6, 0.35, 0.45, m.teinte, -1.0, 0.65, 1.0, CT.olive)); // les caisses de munitions
    caisse.add(O.boite(0.6, 0.35, 0.45, m.teinte, -1.1, 0.65, 0.45, CT.olive));
    O.souder(caisse);
    const tourelle = new THREE.Group();
    tourelle.position.y = 0.6;
    caisse.add(tourelle);
    tourelle.add(O.cylindre(1.0, 1.1, 0.6, p, 18).translateY(0.3));
    tourelle.add(O.boite(0.5, 0.12, 0.5, m.teinte, -0.65, 0.95, 0, CT.noir), O.boite(0.1, 0.55, 0.5, m.teinte, -0.92, 1.22, 0, CT.noir)); // le siège
    tourelle.add(O.tube([-0.3, 0.6, 0], [-0.65, 0.9, 0], 0.06, m.teinte, 6, CT.acier));
    // le tireur
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.25, 3, 8), m.teinte, -0.62, 1.38, 0, CT.tissu);
    buste.scale.set(0.8, 1, 1.15);
    tourelle.add(buste, O.boite(0.26, 0.32, 0.36, m.teinte, -0.6, 1.38, 0, 0x5f6a4a));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, -0.58, 1.76, 0, CT.peau));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, -0.6, 1.8, 0, CT.casque));
    for (const s of [-1, 1]) {
      tourelle.add(O.tube([-0.6, 1.1, s * 0.12], [-0.2, 1.05, s * 0.14], 0.07, m.teinte, 6, CT.tissu), O.tube([-0.2, 1.05, s * 0.14], [-0.15, 0.62, s * 0.14], 0.06, m.teinte, 6, CT.tissu));
      tourelle.add(O.tube([-0.6, 1.55, s * 0.18], [-0.3, 1.45, s * 0.25], 0.045, m.teinte, 6, CT.tissu), O.tube([-0.3, 1.45, s * 0.25], [-0.05, 1.5, s * 0.2], 0.04, m.teinte, 6, CT.tissu));
      tourelle.add(O.boite(0.06, 0.18, 0.06, m.teinte, -0.03, 1.5, s * 0.2, CT.noir)); // les poignées
    }
    // le bouclier, avec sa vitre et le viseur
    tourelle.add(O.boite(0.12, 0.7, 2.0, p, 0.5, 1.45, 0));
    tourelle.add(O.boite(0.12, 0.32, 0.9, p, 0.5, 1.97, 0));
    tourelle.add(O.boite(0.04, 0.3, 0.5, V, 0.5, 1.95, 0));
    tourelle.add(O.boite(0.25, 0.2, 0.15, m.teinte, 0.2, 2.0, 0, CT.noir), O.boite(0.02, 0.14, 0.12, M.verre, 0.33, 2.02, 0));
    O.souder(tourelle);
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
    return { g, caisse, tourelle, canons, flammes };
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
    const lumiere = new THREE.PointLight(c, 6, 18, 2);
    lumiere.position.y = rayon + 0.3;
    g.add(lumiere);
    return { g, tourbillon, anneau };
  }

  function fabriquer(sorte, equipe) {
    if (Tanks.Vehicules3D && Tanks.Vehicules3D.sait(sorte)) return Tanks.Vehicules3D.fabriquer(sorte, equipe); // (étape 71)
    if (Tanks.Helicos3D && Tanks.Helicos3D.sait(sorte)) return Tanks.Helicos3D.fabriquer(sorte, equipe); // (étape 73)
    if (Tanks.Avions3D && Tanks.Avions3D.sait(sorte)) return Tanks.Avions3D.fabriquer(sorte, equipe); // (étape 76 : les avions, le drone et le Tigre)
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
  return { soldat, animer, fabriquer, bruler, portail, silhouettes, outils };
})();
