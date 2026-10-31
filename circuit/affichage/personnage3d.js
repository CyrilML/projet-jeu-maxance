// 🧍 LE PERSONNAGE EN 3D : le tailleur et le marionnettiste (étape 140)
//
// ✍️ Iron Wolf Studio : « Fais de beaux personnages et de belles armes, comme tu m'as fait pour le jeu de tank. »
// Avant, le personnage de la ville était fait de « galets » (des gélules) : un pull rouge, un jean bleu, une casquette.
// Maintenant, il a un VRAI corps humain, comme les soldats du jeu de tanks :
//   - LE TAILLEUR prend les formes du sculpteur (affichage/corps3d.js : le tronc, les bras, les jambes, les mains à
//     5 doigts, la tête sculptée avec son nez, ses yeux, ses lèvres, ses oreilles) et les HABILLE : un sweat à capuche
//     rouge (avec sa poche « kangourou », ses cordons, ses poignets côtelés), un jean bleu (plus clair aux genoux), des
//     baskets blanches à semelle, des cheveux courts et la casquette jaune. Chaque point reçoit sa couleur.
//   - Puis il « CUIT » tout en UNE seule forme (un seul dessin pour la carte graphique), accrochée à 11 OS (les hanches,
//     les genoux, le dos, le cou, les épaules, les coudes). C'est un « squelette » : on ne bouge que les os, et la peau
//     suit, en pliant en douceur aux genoux et aux coudes.
//   - LE MARIONNETTISTE tire les ficelles à chaque image : il fait MARCHER ou COURIR (les jambes, les bras qui
//     balancent, le corps qui se penche), RESPIRER à l'arrêt, VISER avec une arme (les deux mains vont sur l'arme
//     grâce à la « cinématique inverse » : on dit où la main doit aller, il calcule l'angle de l'épaule et du coude),
//     FRAPPER avec une épée, LANCER une grenade, POSER une dynamite, TIRER à l'arc.
//   - L'arme (affichage/armes-detail3d.js) est accrochée à l'OS DE LA MAIN : quand la main bouge, l'arme suit.
// Ce qu'on a acheté au magasin se voit toujours : la casquette dorée, les lunettes de soleil, et les baskets de course
// (✍️ nouveau : elles deviennent orange fluo).
// Il lit le monde, il ne le change jamais. Les nombres sont dans config.js (« personnage »).

window.Circuit = window.Circuit || {};

Circuit.Personnage3D = (function () {
  const C3 = () => Circuit.Corps3D;
  const P = () => Circuit.CONFIG.personnage;
  const OS = { hanche: 0.92, cuisse: 0.44, bras: 0.29, avantBras: 0.27, ecartHanches: 0.1, ecartEpaules: 0.2, dos: 0.98, epaules: 0.44, cou: 0.5 };
  // (sous le capot : ce qu'on a fabriqué et ce que fait le personnage)
  const bilan = { os: 11, triangles: 0, sommets: 0, melanges: 0, pose: "—", arme: "mains", tenue: "—" };

  // ---------------------------------------------------------------- les petites formes
  function galet(lx, ly, lz, rond, seg) { // une boîte aux coins arrondis (rond : 0,15 = presque une boîte, 1 = une boule)
    const g = new THREE.SphereGeometry(1, seg || 12, Math.max(6, Math.round((seg || 12) * 0.7))), p = g.attributes.position, e = rond === undefined ? 0.35 : rond;
    const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
    for (let i = 0; i < p.count; i++) p.setXYZ(i, (f(p.getX(i)) * lx) / 2, (f(p.getY(i)) * ly) / 2, (f(p.getZ(i)) * lz) / 2);
    g.computeVertexNormals();
    return g;
  }
  const anneau = (r, e, n) => new THREE.TorusGeometry(r, e, 5, n || 14);
  const gauss = (d, r) => Math.exp(-(d * d) / (r * r));
  function devant(geo, y, z) { // le point de la peau tout devant, à la hauteur y et au côté z
    const p = geo.attributes.position;
    let mieux = 1e9, x = 0;
    for (let i = 0; i < p.count; i++) {
      if (p.getX(i) <= 0) continue;
      const d = (p.getY(i) - y) ** 2 + (p.getZ(i) - z) ** 2;
      if (d < mieux) (mieux = d), (x = p.getX(i));
    }
    return x;
  }
  function bruit(x, y, z) { // un petit bruit doux (les nuances de la peau, du tissu)
    const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return s - Math.floor(s);
  }

  // ---------------------------------------------------------------- 1. LES OS
  function os() {
    const b = () => new THREE.Bone();
    const corps = b(), dos = b(), cou = b();
    dos.position.y = OS.dos;
    cou.position.y = OS.cou;
    corps.add(dos);
    dos.add(cou);
    const jambes = [], genoux = [], epaules = [], coudes = [];
    for (const z of [-OS.ecartHanches, OS.ecartHanches]) { // 0 : gauche (z < 0), 1 : droite (z > 0)
      const h = b(), g = b();
      h.position.set(0, OS.hanche, z);
      g.position.y = -OS.cuisse;
      h.add(g);
      corps.add(h);
      jambes.push(h);
      genoux.push(g);
    }
    for (const z of [-OS.ecartEpaules, OS.ecartEpaules]) {
      const e = b(), c = b();
      e.position.set(0, OS.epaules, z);
      c.position.y = -OS.bras;
      e.add(c);
      dos.add(e);
      epaules.push(e);
      coudes.push(c);
    }
    const noms = { corps, dos, cou, jambe0: jambes[0], genou0: genoux[0], jambe1: jambes[1], genou1: genoux[1], epaule0: epaules[0], coude0: coudes[0], epaule1: epaules[1], coude1: coudes[1] };
    return { corps, dos, cou, jambes, genoux, epaules, coudes, noms, liste: Object.values(noms) };
  }

  // ---------------------------------------------------------------- 2. LE TAILLEUR : les pièces habillées
  // Chaque pièce : { os, geo, x, y, z, rx, ry, rz, couleur, peint (des nuances selon la place du point), poids, groupe }.
  function pieces(H) {
    const K = P().couleurs, L = [], C = C3();
    const p = (osNom, geo, x, y, z, couleur, rx, ry, rz) => (L.push({ os: osNom, geo, x, y, z, couleur, rx: rx || 0, ry: ry || 0, rz: rz || 0, groupe: "corps" }), L[L.length - 1]);
    // LES JAMBES : le jean (plus clair devant les genoux et les cuisses, comme un vrai jean délavé), puis les BASKETS
    for (const k of [0, 1]) {
      const cote = k ? 1 : -1, h = "jambe" + k, g = "genou" + k;
      const j = p(h, C.jambe(cote, true, -0.76), 0, 0, 0, K.jean);
      j.poids = C.deuxJoints("corps", h, g, 0.085, -0.06, -0.38, -0.5, 0.35);
      j.peint = (x, y, z) => 1 + 0.28 * Math.max(0, x / 0.09) * (gauss(y + 0.2, 0.14) + gauss(y + 0.46, 0.06)) + (bruit(x * 40, y * 40, z * 40) - 0.5) * 0.08;
      p(g, anneau(0.054, 0.012), 0, -0.31, 0, K.jean, Math.PI / 2).peint = () => 0.85; // l'ourlet du jean, sur la basket
      const sb = (geo, x, y, z, couleur, rx, ry, rz) => { const q = p(g, geo, x, y, z, couleur, rx, ry, rz); q.groupe = "chaussures"; return q; };
      sb(C.tigeBotte(true, -0.33), 0, 0, 0, K.baskets); // le haut de la basket, autour de la cheville
      sb(C.pied(true), 0.03, -0.43, 0, K.baskets).peint = (x, y) => (y > 0.03 ? 0.93 : 1);
      sb(galet(0.29, 0.036, 0.11, 0.25, 12), 0.1, -0.468, 0, K.semelle); // la semelle
      sb(galet(0.06, 0.03, 0.112, 0.3, 8), 0.235, -0.46, 0, K.semelle); // le bout renforcé
      for (const z of [-0.052, 0.052]) sb(galet(0.13, 0.018, 0.006, 0.4, 6), 0.08, -0.43, z, K.bande, 0, 0, -0.35); // la bande de couleur sur le côté
      for (let n = 0; n < 3; n++) sb(galet(0.012, 0.008, 0.06, 0.3, 4), 0.07 + n * 0.022, -0.39 - n * 0.008, 0, K.lacets, 0, 0, 0.5); // les lacets
      sb(galet(0.03, 0.06, 0.05, 0.4, 6), -0.05, -0.36, 0, K.baskets); // la languette du talon
    }
    // LE SWEAT À CAPUCHE (sur le tronc ; le bas du tronc, ce sont les hanches du jean)
    const t = p("dos", C.tronc(true), 0, 0, 0, K.sweat);
    t.poids = C.melange("corps", "dos", -0.02, 0.16);
    t.teinte = (x, y) => (y < -0.06 ? K.jean : null);
    t.peint = (x, y, z) => (y < -0.06 ? 1 : y < -0.02 ? 0.78 : 1 + (bruit(x * 30, y * 30, z * 30) - 0.5) * 0.05); // (le bas côtelé, plus sombre)
    p("dos", galet(0.018, 0.12, 0.2, 0.3, 10), 0.098, 0.06, 0, K.sweat).peint = (x, y) => (y > 0.045 ? 0.72 : 0.9); // la poche « kangourou » (l'ouverture, en haut, plus sombre)
    p("dos", galet(0.14, 0.11, 0.27, 0.5, 12), -0.075, 0.5, 0, K.sweat).peint = (x) => (x > 0.03 ? 0.6 : 0.92); // la capuche, posée dans le dos
    for (const z of [-0.035, 0.035]) p("dos", new THREE.CylinderGeometry(0.004, 0.004, 0.09, 5), 0.122, 0.41, z, K.cordons); // les cordons
    p("dos", galet(0.006, 0.04, 0.05, 0.5, 8), 0.124, 0.29, 0.0, K.logo); // le logo (une tête de loup blanche… Iron Wolf !)
    for (const z of [-0.018, 0.018]) p("dos", new THREE.ConeGeometry(0.011, 0.025, 4), 0.124, 0.318, z, K.logo); // (ses 2 oreilles pointues)
    p("dos", anneau(0.075, 0.02), 0.0, 0.48, 0, K.sweat, Math.PI / 2).peint = () => 0.85; // le col
    // LE COU et LA TÊTE SCULPTÉE
    p("cou", C.cou(true), 0, 0, 0, K.peau).poids = C.melange("dos", "cou", -0.045, 0.035);
    const cx = 0.012, cy = 0.135, av = (y, z) => cx + devant(H, y, z);
    p("cou", H, cx, cy, 0, K.peau).peint = (x, y, z) => {
      const az = Math.abs(z), face = Math.max(0, Math.min(1, x / 0.06)), n = 1 + (bruit(x * 90, y * 90, z * 90) - 0.5) * 0.05;
      const rose = (gauss(y + 0.022, 0.022) * gauss(az - 0.05, 0.022) + gauss(y + 0.005, 0.02) * gauss(az, 0.012) * 0.6) * face * 0.35;
      const yeux = gauss(y - 0.011, 0.014) * gauss(az - 0.032, 0.02) * face * 0.18;
      return [n * (1 + rose) * (1 - yeux), n * (1 - rose * 0.7) * (1 - yeux * 1.1), n * (1 - rose * 0.6) * (1 - yeux)];
    };
    p("cou", C.nez(true), av(-0.012, 0) - 0.006, cy, 0, K.peau).peint = (x, y) => (y < -0.03 ? [0.6, 0.48, 0.45] : [1.05, 0.95, 0.92]);
    const rO = 0.0112;
    for (const z of [-0.031, 0.031]) {
      const xo = av(0.012, z) - 0.0068, yo = cy + 0.011;
      p("cou", new THREE.SphereGeometry(rO, 12, 8), xo, yo, z, K.blanc).peint = (x) => (x > 0.004 ? 1 : 0.75); // le blanc de l'œil
      p("cou", new THREE.SphereGeometry(0.0055, 10, 6), xo + rO - 0.0035, yo - 0.0006, z * 0.985, K.iris); // l'iris
      p("cou", new THREE.SphereGeometry(0.0027, 6, 4), xo + rO - 0.0012, yo - 0.0006, z * 0.985, 0x050505); // la pupille
      p("cou", C.paupiere(true, rO), xo, yo, z, K.peau).peint = (x, y) => (y < -0.002 ? [0.8, 0.68, 0.66] : [0.95, 0.88, 0.86]);
      p("cou", C.paupiere(false, rO), xo, yo, z, K.peau).peint = () => [0.93, 0.85, 0.84];
      p("cou", C.sourcil(), av(0.03, z) - 0.001, cy + 0.03, z * 1.06, K.cheveux, 0, z > 0 ? -0.2 : 0.2, 0); // le sourcil
    }
    const xb = av(-0.056, 0), levres = new THREE.Color(K.peau).lerp(new THREE.Color(0xa4504a), 0.55).getHex();
    p("cou", C.levre(true), xb - 0.004, cy - 0.0525, 0, levres).peint = (x, y) => (y > 0.002 ? 0.92 : 0.82);
    p("cou", C.levre(false), xb - 0.0055, cy - 0.0605, 0, levres).peint = (x, y) => (y > 0.002 ? 0.8 : 1.04);
    for (const z of [-1, 1]) { // les oreilles
      p("cou", galet(0.034, 0.058, 0.013, 0.55, 10), cx - 0.012, cy, z * 0.081, K.peau, 0, z * 0.35, 0.12).peint = () => [1.06, 0.94, 0.92];
      p("cou", galet(0.016, 0.03, 0.008, 0.5, 6), cx - 0.008, cy - 0.002, z * 0.088, K.peau, 0, z * 0.35, 0.12).peint = () => 0.7;
    }
    // LES CHEVEUX : une coque posée sur le crâne (au-dessus du front, des oreilles et sur la nuque), coupés court
    const cheveux = C.coque(H, 0.007, (x, y, z) => (x > 0.04 ? y > 0.04 : x > -0.025 ? y > -0.012 - 0.03 * Math.max(0, -x) / 0.025 && !(Math.abs(z) > 0.07 && y < 0.03 && x > -0.02) : y > -0.065));
    p("cou", cheveux, cx, cy, 0, K.cheveux).peint = (x, y, z) => 0.85 + bruit(x * 300, y * 300, z * 300) * 0.3;
    // LES BRAS : les manches du sweat (jusqu'au poignet côtelé), puis les MAINS nues (le poignet, la paume, 5 doigts)
    for (const k of [0, 1]) {
      const cote = k ? 1 : -1, e = "epaule" + k, c = "coude" + k;
      const b = p(e, C.bras(cote, true), 0, 0, 0, K.sweat);
      b.poids = C.deuxJoints("dos", e, c, 0.085, -0.04, -0.24, -0.335, 0.4);
      b.peint = (x, y, z) => (y < -0.5 ? 0.78 : 1 + (bruit(x * 30, y * 30, z * 30) - 0.5) * 0.05) * (1 - 0.1 * gauss(y + 0.28, 0.03)); // (le poignet côtelé ; le pli du coude)
      p(c, anneau(0.036, 0.012), 0, -0.235, 0, K.sweat, Math.PI / 2).peint = () => 0.75; // le poignet du sweat
      p(c, new THREE.CapsuleGeometry(0.026, 0.035, 2, 8), 0, -0.25, 0, K.peau); // le poignet
      for (const m of C.main(cote, true, 0.9)) p(c, m.geo, m.x, m.y, m.z, K.peau, m.rx, m.ry, m.rz);
    }
    return L;
  }

  // ---------------------------------------------------------------- 3. CUIRE : toutes les pièces en une seule forme
  // Chaque point de chaque pièce est placé « au repos » (bras le long du corps), reçoit sa couleur, et dit à quels os il
  // est accroché (« skinIndex ») et combien (« skinWeight »). Puis on colle tout ensemble : 1 forme par groupe.
  function cuire(L, r) {
    r.corps.updateMatrixWorld(true);
    const index = new Map(r.liste.map((b, i) => [b, i])), T = new THREE.Object3D(), c = new THREE.Color(), c2 = new THREE.Color();
    const groupes = {};
    for (const pc of L) {
      T.position.set(pc.x, pc.y, pc.z);
      T.rotation.set(pc.rx, pc.ry, pc.rz);
      T.updateMatrix();
      const m = new THREE.Matrix4().copy(r.noms[pc.os].matrixWorld).multiply(T.matrix);
      let g = pc.geo.clone();
      if (!g.index) { const n0 = g.attributes.position.count, ix = []; for (let i = 0; i < n0; i++) ix.push(i); g.setIndex(ix); }
      if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count, loc = g.attributes.position;
      const col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), k = index.get(r.noms[pc.os]);
      c.set(pc.couleur);
      for (let i = 0; i < n; i++) {
        const x = loc.getX(i), y = loc.getY(i), z = loc.getZ(i);
        const autre = pc.teinte ? pc.teinte(x, y, z) : null, base = autre !== null && autre !== undefined ? c2.set(autre) : c;
        const f = pc.peint ? pc.peint(x, y, z) : 1, fr = f[0] || f, fg = f[1] || f, fb = f[2] || f;
        col[i * 3] = base.r * fr; col[i * 3 + 1] = base.g * fg; col[i * 3 + 2] = base.b * fb;
        if (pc.poids) {
          const q = pc.poids(x, y, z);
          si[i * 4] = index.get(r.noms[q[0]]); si[i * 4 + 1] = index.get(r.noms[q[1]]);
          sw[i * 4] = 1 - q[2]; sw[i * 4 + 1] = q[2];
          if (q[2] > 0.02 && q[2] < 0.98) bilan.melanges++;
        } else (si[i * 4] = k), (sw[i * 4] = 1);
      }
      g.applyMatrix4(m);
      (groupes[pc.groupe] = groupes[pc.groupe] || []).push({ g, col, si, sw });
    }
    const formes = {};
    for (const [nom, liste] of Object.entries(groupes)) {
      let nv = 0, ni = 0;
      for (const x of liste) (nv += x.g.attributes.position.count), (ni += x.g.index.count);
      const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), ix = new Uint32Array(ni);
      let ov = 0, oi = 0;
      for (const x of liste) {
        const n = x.g.attributes.position.count;
        pos.set(x.g.attributes.position.array, ov * 3);
        nor.set(x.g.attributes.normal.array, ov * 3);
        col.set(x.col, ov * 3);
        si.set(x.si, ov * 4);
        sw.set(x.sw, ov * 4);
        const src = x.g.index.array;
        for (let i = 0; i < src.length; i++) ix[oi + i] = src[i] + ov;
        ov += n;
        oi += src.length;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
      g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
      g.setIndex(new THREE.BufferAttribute(ix, 1));
      formes[nom] = g;
      bilan.sommets += nv;
      bilan.triangles += ni / 3;
    }
    return formes;
  }

  // ---------------------------------------------------------------- 4. FABRIQUER le personnage
  let formesPartagees = null;
  function fabriquer() {
    const r = os(), H = C3().crane(28, 20);
    if (!formesPartagees) formesPartagees = cuire(pieces(H), r);
    const g = new THREE.Group(), porteur = new THREE.Group();
    porteur.scale.setScalar(P().taille);
    g.add(porteur);
    const squel = new THREE.Skeleton(r.liste);
    const mats = {
      corps: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 }),
      chaussures: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }),
    };
    let premier = null;
    for (const nom of ["corps", "chaussures"]) {
      const m = new THREE.SkinnedMesh(formesPartagees[nom], mats[nom]);
      m.castShadow = true;
      m.frustumCulled = false; // (il bouge : sa bulle de départ ne suffit pas)
      porteur.add(m);
      if (!premier) (premier = m), m.add(r.corps);
      m.bind(squel);
    }
    // LA CASQUETTE (posée sur l'os du cou : elle suit la tête) : le dessus arrondi, le bouton, la visière
    const K = P().couleurs, cx = 0.012, cy = 0.135;
    const jaune = new THREE.MeshPhysicalMaterial({ color: K.casquette, roughness: 0.45, clearcoat: 0.4 });
    const casquette = new THREE.Group();
    const dessus = new THREE.Mesh(new THREE.SphereGeometry(0.104, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), jaune);
    dessus.scale.set(1.04, 0.72, 0.95);
    const bouton = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), jaune);
    bouton.position.y = 0.088;
    const visiere = new THREE.Mesh(galet(0.14, 0.01, 0.18, 0.4, 14), jaune);
    visiere.position.set(0.135, -0.004, 0);
    visiere.rotation.z = -0.16;
    const bandeau = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.106, 0.024, 22, 1, true), jaune);
    bandeau.position.y = 0.0;
    casquette.add(dessus, bouton, visiere, bandeau);
    casquette.position.set(cx - 0.008, cy + 0.052, 0);
    casquette.rotation.z = 0.06;
    casquette.traverse((o) => (o.castShadow = true));
    r.cou.add(casquette);
    // LES LUNETTES DE SOLEIL (cachées tant qu'on ne les a pas achetées) : 2 verres sombres, le pont, les branches
    const verre = new THREE.MeshPhysicalMaterial({ color: 0x101820, metalness: 0.6, roughness: 0.05, clearcoat: 1 });
    const monture = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const lunettes = new THREE.Group();
    const H0 = C3().crane(28, 20), av = (y, z) => cx + devant(H0, y, z);
    for (const z of [-0.032, 0.032]) {
      const v = new THREE.Mesh(galet(0.008, 0.026, 0.038, 0.7, 10), verre);
      v.position.set(av(0.011, z) + 0.012, cy + 0.012, z);
      v.rotation.y = z > 0 ? -0.2 : 0.2;
      lunettes.add(v);
    }
    const pont = new THREE.Mesh(galet(0.006, 0.006, 0.022, 0.5, 4), monture);
    pont.position.set(av(0.014, 0) + 0.009, cy + 0.02, 0);
    lunettes.add(pont);
    for (const z of [-1, 1]) {
      const br = new THREE.Mesh(galet(0.09, 0.006, 0.004, 0.5, 4), monture);
      br.position.set(cx + 0.035, cy + 0.016, z * 0.082);
      lunettes.add(br);
    }
    lunettes.visible = false;
    r.cou.add(lunettes);
    // LES PRISES : là où l'arme s'accroche, dans chaque main (le creux de la paume, au bout de l'avant-bras)
    const prises = [new THREE.Group(), new THREE.Group()];
    prises[0].position.y = prises[1].position.y = -0.31;
    r.coudes[0].add(prises[0]);
    r.coudes[1].add(prises[1]);
    // la flamme de la bouche du canon (un éclair jaune, une fraction de seconde après chaque tir)
    const eclair = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    eclair.scale.set(2.2, 1, 1);
    eclair.visible = false;
    g.add(eclair);
    return { g, porteur, squel, r, mats, casquette, jaune, lunettes, prises, eclair, armes: {}, arme: null, sac: null, dore: null };
  }

  // ---------------------------------------------------------------- 5. LA CINÉMATIQUE INVERSE (2 os)
  // On connaît l'épaule, la longueur du bras et de l'avant-bras, et où la main doit aller : la loi des cosinus donne
  // l'angle de l'épaule ; le « pôle » dit de quel côté le coude part (en bas et vers l'extérieur).
  const BAS = new THREE.Vector3(0, -1, 0), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion();
  const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Vector3(), _m = new THREE.Vector3(), _t = new THREE.Vector3();
  function poserBras(epaule, coude, cible, pole) {
    const S = epaule.position, a = OS.bras, b = 0.31;
    const vers = _v.copy(cible).sub(S), d = Math.min(a + b - 0.002, Math.max(0.08, vers.length()));
    vers.normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const p = _p.copy(pole).sub(_t.copy(vers).multiplyScalar(pole.dot(vers))).normalize();
    const coudeEn = _c.copy(vers).multiplyScalar(a * cosA).add(p.multiplyScalar(a * sinA));
    const main = _m.copy(vers).multiplyScalar(d);
    q1.setFromUnitVectors(BAS, _t.copy(coudeEn).normalize());
    epaule.quaternion.copy(q1);
    q2.setFromUnitVectors(BAS, main.sub(coudeEn).normalize());
    coude.quaternion.copy(q3.copy(q1).invert().multiply(q2));
  }
  const POLES = [new THREE.Vector3(-0.3, -1, -0.9), new THREE.Vector3(-0.3, -1, 0.9)];

  // ---------------------------------------------------------------- 6. LE MARIONNETTISTE
  const doux = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const W = new THREE.Matrix4(), Wm = new THREE.Matrix4(), M1 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), V2 = new THREE.Vector3();
  const VD = new THREE.Vector3(), VG = new THREE.Vector3();
  function remettre(r) {
    for (const o of r.liste) o.quaternion.identity();
    r.corps.position.set(0, 0, 0);
  }
  // La place de l'arme (dans le repère des hanches : x devant, y en haut, z à droite) pour chaque façon de la tenir.
  function animer(P3, monde, dt, Armes) {
    const r = P3.r, p = monde.pieton, A = Circuit.CONFIG.personnage.animation;
    remettre(r);
    const t = monde.temps;
    const vit = Math.abs(p.vitesse || 0), allure = Math.min(1, vit / A.vitesseCourse), recule = (p.vitesse || 0) < 0;
    const phi = (p.pas / A.foulee) * Math.PI * 2 * (recule ? -1 : 1);
    // les jambes (et le petit rebond du corps, et le corps qui se penche quand il court)
    for (const k of [0, 1]) {
      const ph = phi + (k ? Math.PI : 0), s = Math.sin(ph);
      r.jambes[k].rotation.z = s * A.jambes * allure;
      r.genoux[k].rotation.z = -(0.08 + A.genoux * Math.max(0, Math.cos(ph))) * allure;
      r.jambes[k].rotation.x = (k ? -1 : 1) * 0.03;
    }
    r.corps.position.y = allure * (-0.04 + 0.05 * Math.abs(Math.cos(phi)));
    r.dos.rotation.z = -A.penche * allure + Math.sin(t * 1.7) * 0.012 * (1 - allure); // (il respire à l'arrêt)
    r.dos.rotation.y = Math.sin(phi) * 0.12 * allure; // (les épaules tournent un peu à chaque pas)
    const f = monde.arme && monde.arme !== "mains" ? Circuit.Armurerie.fiche(monde.arme) : null;
    const objet = f ? Armes.enMain(P3, f) : null;
    const depuis = t - (monde.coup || -9);
    P3.eclair.visible = false;
    if (!f || !objet) {
      Armes.rangerTout(P3);
      bilan.tenue = "mains vides";
      bilan.pose = vit > 0.1 ? (allure > 0.6 ? "court" : "marche") : "respire";
      for (const k of [0, 1]) { // les bras balancent à l'opposé des jambes
        const s = Math.sin(phi + (k ? Math.PI : 0));
        r.epaules[k].rotation.set((k ? -1 : 1) * 0.1, 0, -s * A.bras * allure);
        r.coudes[k].rotation.z = 0.15 + 1.1 * allure;
      }
      return;
    }
    const U = objet.userData, tenue = U.tenue, T = A.tenues[tenue] || A.tenues.fusil;
    bilan.tenue = tenue;
    r.dos.rotation.y += T.torsion;
    r.dos.rotation.z += T.penche || 0;
    // Les gestes qui ne visent pas : frapper, lancer, poser (l'arme reste dans la main droite).
    if (tenue === "melee" || tenue === "lancer" || tenue === "poser") {
      const ep = r.epaules[1], co = r.coudes[1], g0 = r.epaules[0];
      g0.rotation.set(0.12, 0, 0.25); // (la main gauche reste devant, en garde)
      r.coudes[0].rotation.z = 1.2;
      let lev = T.leve, coude = T.coude, x = -0.2, tord = 0;
      if (tenue === "melee") {
        const u = depuis / A.dureeCoup;
        if (u < 1) {
          bilan.pose = "frappe";
          if (U.estoc) (lev = 1.45), (coude = u < 0.3 ? 1.5 - u * 4.5 : 0.15 + doux((u - 0.3) / 0.7) * 1.35); // (la lance : on pique devant)
          else (lev = u < 0.3 ? 2.7 - u * 1.5 : 2.25 - doux((u - 0.3) / 0.4) * 2.0 + doux((u - 0.7) / 0.3) * (T.leve - 0.25)), (coude = u < 0.3 ? 0.4 : 0.2 + doux((u - 0.7) / 0.3) * (T.coude - 0.2)), (tord = -0.5 * Math.sin(Math.min(1, u * 1.4) * Math.PI)), (x = -0.45 * Math.sin(u * Math.PI));
        } else bilan.pose = "en garde";
      } else if (tenue === "lancer") {
        const u = depuis / A.dureeLancer;
        if (u < 1) (bilan.pose = "lance"), (lev = u < 0.5 ? 2.9 - u * 3.4 : 1.2 + doux((u - 0.5) * 2) * (T.leve - 1.2)), (coude = 0.25 + u * (T.coude - 0.25)), (tord = -0.4 * (1 - u));
        else bilan.pose = "prêt à lancer";
      } else {
        const u = depuis / A.dureePoser;
        if (u < 1) {
          bilan.pose = "pose par terre";
          const b = Math.sin(u * Math.PI);
          r.dos.rotation.z -= 0.7 * b;
          for (const k of [0, 1]) (r.jambes[k].rotation.z += 0.9 * b), (r.genoux[k].rotation.z -= 1.5 * b);
          r.corps.position.y -= 0.32 * b;
          lev = 0.4 + 0.3 * b;
          coude = 0.3;
        } else bilan.pose = "tient l'explosif";
      }
      r.dos.rotation.y += tord;
      ep.rotation.set(x, 0, lev);
      co.rotation.z = coude;
      porterDansLaMain(P3, objet, 1);
      if (U.tourne) U.tourne.rotation.x = tenue === "melee" && depuis < 0.4 ? depuis * 30 : 0; // (le nunchaku tourne)
      return;
    }
    // VISER : l'arme est placée devant (repère des hanches), les mains vont dessus (cinématique inverse).
    const recul = depuis < A.dureeRecul && (f.famille === "tir" || f.famille === "projectile") ? 1 - depuis / A.dureeRecul : 0;
    const echelle = Circuit.CONFIG.armurerie.tailleEnMain * (U.echelle || 1);
    E.set(0, 0, recul * (T.releve || 0.12));
    Q.setFromEuler(E);
    V.set(T.place[0] - recul * (T.recul || 0.04), T.place[1], T.place[2]);
    Wm.compose(V, Q, S3.set(echelle, echelle, echelle));
    P3.g.updateMatrixWorld(true);
    W.multiplyMatrices(r.corps.matrixWorld, Wm); // (l'arme, dans le monde)
    const arc = tenue === "arc";
    // la main qui TIENT l'arme (la droite ; pour l'arc, la gauche) et l'autre main (sur le garde-main, la corde…)
    VD.set(0, 0, 0).applyMatrix4(W);
    VG.copy(U.garde).applyMatrix4(W);
    if (arc) { // la main droite tire la corde (jusqu'à la joue), puis la relâche après le tir
      const tire = depuis < 0.25 ? 0 : Math.min(1, (depuis - 0.25) / 0.6);
      VG.copy(U.garde).setX(U.garde.x - U.allonge * tire).applyMatrix4(W);
      if (U.corde) U.corde(tire);
    }
    const tient = arc ? 0 : 1, aide = 1 - tient;
    r.dos.updateMatrixWorld(true);
    poserBras(r.epaules[tient], r.coudes[tient], r.dos.worldToLocal(V2.copy(VD)), POLES[tient]);
    if (U.garde) poserBras(r.epaules[aide], r.coudes[aide], r.dos.worldToLocal(V2.copy(VG)), POLES[aide]);
    else (r.epaules[aide].rotation.set(aide ? -0.1 : 0.1, 0, 0), (r.coudes[aide].rotation.z = 0.3));
    // l'arme suit la main : sa place dans la main = (la main dans le monde)⁻¹ × (l'arme dans le monde)
    r.epaules[tient].updateMatrixWorld(true);
    const prise = P3.prises[tient];
    if (objet.parent !== prise) prise.add(objet);
    M1.copy(prise.matrixWorld).invert().multiply(W);
    M1.decompose(objet.position, objet.quaternion, objet.scale);
    if (U.tourne) U.tourne.rotation.x += f.famille === "tir" && depuis < 0.3 ? dt * 40 : dt * 4 * Math.max(0, 1 - depuis); // (les 6 canons du minigun tournent)
    bilan.pose = recul > 0 ? "tire (recul)" : arc ? "bande l'arc" : vit > 0.1 ? "vise en marchant" : "vise";
    // l'éclair au bout du canon, juste après le tir
    if (f.famille === "tir" && depuis < 0.05 && U.bouche) {
      P3.eclair.visible = true;
      P3.eclair.position.copy(U.bouche).applyMatrix4(W);
      P3.eclair.quaternion.setFromRotationMatrix(M1.extractRotation(W));
      P3.eclair.scale.set(2.2 + Math.random(), 1, 1).multiplyScalar(U.eclair || 1);
    }
  }
  // L'arme tenue simplement dans la main (une épée, une grenade) : la poignée dans la paume, la lame vers l'avant.
  function porterDansLaMain(P3, objet, k) {
    const prise = P3.prises[k];
    if (objet.parent !== prise) prise.add(objet);
    const e = Circuit.CONFIG.armurerie.tailleEnMain * (objet.userData.echelle || 1);
    objet.position.set(0, 0, 0);
    objet.rotation.set(0, 0, 0); // (dans la main, la poignée suit l'axe des doigts repliés : x)
    objet.scale.setScalar(e);
  }

  // ---------------------------------------------------------------- 7. CHAQUE IMAGE (appelé par la scène)
  function dessiner(P3, monde, dt, visible) {
    const p = monde.pieton;
    P3.g.position.set(p.x, (p.y || 0) + 0.12, p.z);
    P3.g.rotation.set(0, -p.angle, 0);
    P3.g.visible = visible;
    const objets = (Circuit.Sauvegarde.donnees && Circuit.Sauvegarde.donnees.objets) || {};
    P3.lunettes.visible = !!objets.lunettes;
    if (objets.casquette && !P3.dore) {
      P3.dore = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.25 });
      P3.casquette.traverse((o) => o.material && (o.material = P3.dore));
    }
    P3.mats.chaussures.color.setHex(objets.baskets ? P().couleurs.basketsCourse : 0xffffff);
    if (!visible) return;
    animer(P3, monde, dt, Circuit.ArmesDetail3D);
    bilan.arme = monde.arme || "mains";
  }

  return { fabriquer, dessiner, bilan, OS };
})();
