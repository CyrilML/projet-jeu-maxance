// 🗿 LE SCULPTEUR : le CORPS HUMAIN des soldats (demande 126)
//
// ✍️ Maxance : « Fais des maquettes de soldats. Je veux qu'ils ressemblent à des humains. »
// Avant, le soldat était un assemblage de « galets » et de tubes posés bout à bout (des blocs). Le sculpteur, lui,
// fabrique le corps comme un vrai sculpteur fait une statue en fil de fer : on dessine des TRANCHES (des anneaux, comme
// les tranches d'un saucisson), de la cheville jusqu'à la hanche, du poignet jusqu'à l'épaule, du bassin jusqu'au cou,
// chaque tranche avec sa largeur (la cuisse est large en haut, fine au genou, le mollet regonfle derrière…) ; puis on
// tend une PEAU d'une tranche à l'autre (le « loft »). Résultat : des formes arrondies, sans coins ni trous.
// Et surtout, chaque point de cette peau dit À QUELS OS il est accroché, et COMBIEN (les « poids ») : au genou, un point
// est à moitié à la cuisse et à moitié au tibia. Quand la jambe plie, la peau du genou se plie EN DOUCEUR, comme un vrai
// genou (avant : deux tubes qui se croisaient). C'est le « skinning à poids mélangés » des vrais jeux.
// Le sculpteur fabrique aussi les MAINS (la paume, le pouce, 4 doigts en 2 phalanges qui se replient sur l'arme), les
// BOTTES (la tige, le pied, le talon, le bout) et le COU.
// Il ne fait que des FORMES : l'atelier (engins3d.js) les habille, les colore et les accroche aux os.
// Toutes les mesures sont en mètres, pour un soldat de 1,80 m (7,5 têtes de haut) ; les os sont ceux de l'atelier.

window.Tanks = window.Tanks || {};

Tanks.Corps3D = (function () {
  // ------------------------------------------------------------------ 1. LE LOFT : une peau tendue sur des tranches
  // Une tranche : { y, xf (le devant, vers x+), xb (le derrière), z (la moitié de la largeur), cx, cz (le centre décalé),
  // e (la forme : 2 = un ovale, 3 = un ovale « carré » comme un torse) }. Les tranches vont du HAUT vers le BAS.
  // n : le nombre de points autour ; lisse : combien de tranches en plus on glisse entre deux (une courbe douce).
  const sgnPow = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
  function catmull(a, b, c, d, t) { // (la courbe douce qui passe par b puis c)
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  }
  const CHAMPS = ["y", "xf", "xb", "z", "cx", "cz", "e"];
  function lisser(tranches, k) {
    if (k <= 1) return tranches;
    const T = tranches.map((s) => ({ y: s.y, xf: s.xf, xb: s.xb === undefined ? s.xf : s.xb, z: s.z === undefined ? s.xf : s.z, cx: s.cx || 0, cz: s.cz || 0, e: s.e || 2 }));
    const res = [];
    for (let i = 0; i < T.length - 1; i++) {
      const a = T[Math.max(0, i - 1)], b = T[i], c = T[i + 1], d = T[Math.min(T.length - 1, i + 2)];
      for (let j = 0; j < k; j++) {
        const t = j / k, s = {};
        for (const f of CHAMPS) s[f] = catmull(a[f], b[f], c[f], d[f], t);
        if (s.xf < 0.002) s.xf = 0.002;
        if (s.xb < 0.002) s.xb = 0.002;
        if (s.z < 0.002) s.z = 0.002;
        res.push(s);
      }
    }
    res.push(T[T.length - 1]);
    return res;
  }
  // La peau : un anneau de n points par tranche, et deux « bouchons » (le haut et le bas fermés par un point au centre).
  // Les points du raccord de l'anneau sont partagés : les normales sont lisses tout autour (pas de couture visible).
  function loft(tranches, n, lisse, fermer) {
    const T = lisser(tranches, lisse || 1), pos = [], idx = [];
    for (const s of T) {
      const xb = s.xb === undefined ? s.xf : s.xb, z = s.z === undefined ? s.xf : s.z, p = 2 / (s.e || 2);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
        pos.push((s.cx || 0) + sgnPow(c, p) * (c >= 0 ? s.xf : xb), s.y, (s.cz || 0) + sgnPow(si, p) * z);
      }
    }
    for (let r = 0; r < T.length - 1; r++) for (let i = 0; i < n; i++) {
      const a = r * n + i, b = r * n + ((i + 1) % n), c = a + n, d = b + n;
      idx.push(a, b, c, b, d, c);
    }
    if (fermer !== false) {
      const haut = pos.length / 3, h = T[0], bas = T[T.length - 1];
      pos.push(h.cx || 0, h.y + 0.004, h.cz || 0);
      for (let i = 0; i < n; i++) idx.push(haut, (i + 1) % n, i);
      const b0 = (T.length - 1) * n, centre = pos.length / 3;
      pos.push(bas.cx || 0, bas.y - 0.004, bas.cz || 0);
      for (let i = 0; i < n; i++) idx.push(centre, b0 + i, b0 + ((i + 1) % n));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // ------------------------------------------------------------------ 2. LES POIDS : à quels os chaque point est accroché
  // Un mélange de l'os a vers l'os b, entre y0 (encore tout à a) et y1 (déjà tout à b), en douceur.
  const doux = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  function melange(a, b, y0, y1, w0) {
    const base = w0 || 0;
    return (x, y) => [a, b, base + (1 - base) * doux((y - y0) / (y1 - y0))];
  }
  // Deux articulations sur le même membre : en haut (a→b, entre y0 et y1), en bas (b→c, entre y2 et y3).
  function deuxJoints(a, b, c, y0, y1, y2, y3, w0) {
    const haut = melange(a, b, y0, y1, w0), bas = melange(b, c, y2, y3);
    const coupe = (y1 + y2) / 2; // (la frontière entre les deux zones)
    return (x, y, z) => (y > coupe ? haut(x, y, z) : bas(x, y, z));
  }

  // ------------------------------------------------------------------ 3. LES MORCEAUX DU CORPS
  // (un soldat de 1,80 m : les hanches à 0,92 m, les genoux à 0,48 m, les épaules à 1,42 m, le cou à 1,48 m)
  // LE TRONC (posé sur l'os du dos, à 0,98 m) : le bassin, les fesses, la taille, la poitrine, le haut des épaules (les
  // trapèzes) qui monte vers le cou. Les hanches suivent le CORPS, la poitrine suit le DOS ; la taille se tord en douceur.
  const TRONC = [
    { y: 0.56, xf: 0.04, xb: 0.045, z: 0.045 },
    { y: 0.535, xf: 0.06, xb: 0.065, z: 0.075 },
    { y: 0.51, xf: 0.07, xb: 0.075, z: 0.13, e: 2.2 },
    { y: 0.47, xf: 0.09, xb: 0.095, z: 0.172, e: 2.5 }, // le haut des épaules (les trapèzes)
    { y: 0.42, xf: 0.112, xb: 0.104, z: 0.182, e: 2.6 }, // sous les épaules (les aisselles)
    { y: 0.34, xf: 0.124, xb: 0.106, z: 0.178, e: 2.6 }, // la poitrine
    { y: 0.25, xf: 0.118, xb: 0.102, z: 0.168, e: 2.5 },
    { y: 0.16, xf: 0.104, xb: 0.098, z: 0.154, e: 2.4 }, // le bas des côtes
    { y: 0.08, xf: 0.098, xb: 0.098, z: 0.15, e: 2.4 }, // la taille
    { y: 0.01, xf: 0.1, xb: 0.11, z: 0.162, e: 2.5 }, // le haut du bassin (la ceinture)
    { y: -0.05, xf: 0.102, xb: 0.122, z: 0.172, e: 2.5 }, // les hanches, les fesses
    { y: -0.11, xf: 0.098, xb: 0.118, z: 0.165, e: 2.4 },
    { y: -0.16, xf: 0.08, xb: 0.09, z: 0.12, e: 2.2 },
    { y: -0.195, xf: 0.045, xb: 0.05, z: 0.05 }, // (l'entrejambe)
  ];
  function tronc(detail) {
    const T = detail ? TRONC : TRONC.filter((s, i) => i % 2 === 1 || i === 0 || i === TRONC.length - 1);
    return loft(T, detail ? 22 : 9, detail ? 2 : 1);
  }
  // LA JAMBE (posée sur l'os de la hanche, y = 0 à la hanche, -0,44 au genou) : la cuisse, le genou (la rotule devant), le
  // mollet qui regonfle derrière, jusqu'en haut de la botte (botte = true) ou jusqu'à la cheville (les bandes molletières).
  function jambe(cote, detail, jusque) {
    const o = cote * 0.012, fin = jusque === undefined ? -0.7 : jusque, T = [
      { y: 0.085, xf: 0.06, xb: 0.07, z: 0.065, cz: o * 0.5 },
      { y: 0.03, xf: 0.088, xb: 0.1, z: 0.092, cz: o },
      { y: -0.06, xf: 0.09, xb: 0.094, z: 0.09, cz: o * 0.8 },
      { y: -0.18, xf: 0.083, xb: 0.08, z: 0.079, cz: o * 0.4 },
      { y: -0.3, xf: 0.072, xb: 0.068, z: 0.069 },
      { y: -0.39, xf: 0.066, xb: 0.06, z: 0.062 },
      { y: -0.45, xf: 0.068, xb: 0.056, z: 0.06 }, // le genou (la rotule devant)
      { y: -0.51, xf: 0.058, xb: 0.062, z: 0.058 },
      { y: -0.58, xf: 0.054, xb: 0.072, z: 0.06 }, // le mollet (derrière)
      { y: -0.65, xf: 0.05, xb: 0.064, z: 0.054 },
      { y: -0.74, xf: 0.044, xb: 0.05, z: 0.046 },
      { y: -0.82, xf: 0.04, xb: 0.042, z: 0.04 },
    ].filter((s) => s.y >= fin - 0.001);
    if (T[T.length - 1].y > fin + 0.01) { const d = T[T.length - 1]; T.push(Object.assign({}, d, { y: fin })); }
    return loft(detail ? T : T.filter((s, i) => i % 2 === 0 || i === T.length - 1), detail ? 16 : 7, detail ? 2 : 1);
  }
  // LE BRAS (posé sur l'os de l'épaule, y = 0 à l'épaule, -0,29 au coude, -0,54 au poignet) : le deltoïde (le haut de
  // l'épaule, arrondi), le biceps devant, le coude, l'avant-bras qui s'affine, le poignet aplati.
  function bras(cote, detail) {
    const T = [
      { y: 0.085, xf: 0.03, z: 0.03, cz: -cote * 0.02 },
      { y: 0.06, xf: 0.052, xb: 0.055, z: 0.058, cz: -cote * 0.008 },
      { y: 0.015, xf: 0.062, xb: 0.064, z: 0.068 }, // le deltoïde
      { y: -0.05, xf: 0.058, xb: 0.06, z: 0.062 },
      { y: -0.12, xf: 0.056, xb: 0.054, z: 0.053 }, // le biceps
      { y: -0.2, xf: 0.052, xb: 0.05, z: 0.048 },
      { y: -0.27, xf: 0.044, xb: 0.048, z: 0.045 }, // le coude
      { y: -0.33, xf: 0.046, xb: 0.045, z: 0.047 }, // le haut de l'avant-bras
      { y: -0.4, xf: 0.042, xb: 0.04, z: 0.042 },
      { y: -0.48, xf: 0.035, xb: 0.033, z: 0.033 },
      { y: -0.535, xf: 0.031, xb: 0.03, z: 0.026 }, // le poignet (plus large de face que de côté)
    ];
    return loft(detail ? T : T.filter((s, i) => i % 2 === 0 || i === T.length - 1), detail ? 14 : 6, detail ? 2 : 1);
  }
  // LE COU (posé sur l'os du cou, y = 0 à sa base) : il part de l'intérieur du tronc et rentre sous la tête.
  function cou(detail) {
    return loft([
      { y: 0.14, xf: 0.042, xb: 0.045, z: 0.042, cx: 0.008 },
      { y: 0.1, xf: 0.047, xb: 0.05, z: 0.05, cx: 0.006 },
      { y: 0.05, xf: 0.05, xb: 0.052, z: 0.054, cx: 0.004 },
      { y: 0.0, xf: 0.055, xb: 0.058, z: 0.062, cx: 0.0 },
      { y: -0.05, xf: 0.062, xb: 0.066, z: 0.078, cx: -0.006 },
    ], detail ? 12 : 6, 1);
  }
  // LA BOTTE (posée sur l'os du genou, y = 0 au genou, la cheville à -0,40, la semelle à -0,48) : la tige jusqu'à la
  // cheville, puis le PIED (un loft couché vers l'avant : le talon, le cou-de-pied, le bout arrondi).
  function tigeBotte(detail, haut) {
    const T = [
      { y: haut, xf: 0.06, xb: 0.064, z: 0.058 },
      { y: -0.3, xf: 0.056, xb: 0.062, z: 0.054 },
      { y: -0.37, xf: 0.05, xb: 0.054, z: 0.049 },
      { y: -0.41, xf: 0.058, xb: 0.06, z: 0.052 },
      { y: -0.44, xf: 0.06, xb: 0.062, z: 0.054 },
    ];
    return loft(T, detail ? 14 : 7, 1);
  }
  // le pied : couché (son « y » devient l'avant) ; xf = vers le bas (la semelle), xb = vers le haut (le dessus du pied)
  function pied(detail) {
    const T = [
      { y: 0.215, xf: 0.018, xb: 0.012, z: 0.026 },
      { y: 0.2, xf: 0.03, xb: 0.022, z: 0.044, e: 2.6 }, // le bout
      { y: 0.15, xf: 0.035, xb: 0.03, z: 0.053, e: 2.8 },
      { y: 0.08, xf: 0.04, xb: 0.045, z: 0.051, e: 2.8 }, // le cou-de-pied
      { y: 0.01, xf: 0.044, xb: 0.058, z: 0.05, e: 2.6 },
      { y: -0.05, xf: 0.042, xb: 0.05, z: 0.047, e: 2.6 }, // le talon
      { y: -0.075, xf: 0.028, xb: 0.03, z: 0.032 },
    ];
    const g = loft(T, detail ? 14 : 7, detail ? 2 : 1);
    g.rotateZ(-Math.PI / 2); // (son « y » devient x : vers l'avant ; son « x » vers le bas)
    return g;
  }

  // ------------------------------------------------------------------ 4. LA MAIN
  // La paume (son creux tourné vers le corps quand le bras pend), le pouce en 2 phalanges, et 4 doigts en 2 morceaux
  // (la 1re phalange, puis les 2 autres ensemble) REPLIÉS sur la poignée de l'arme. cote : 1 = la main droite (z > 0).
  // Renvoie une liste de pièces { geo, x, y, z, rx, ry, rz } dans le repère de l'os du coude.
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _haut = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3();
  function segment(p0, p1, r, detail, r2) { // un « doigt » : une gélule de p0 à p1
    _d.set(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]);
    const l = _d.length();
    _q.setFromUnitVectors(_haut, _d.normalize());
    _e.setFromQuaternion(_q);
    const geo = new THREE.CapsuleGeometry(r, Math.max(0.001, l), detail ? 2 : 1, detail ? 6 : 4);
    if (r2 && r2 !== r) { // (un doigt qui s'affine vers le bout)
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, p.getY(i) / (l + 2 * r) + 0.5)), f = 1 + (r2 / r - 1) * t; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); }
      geo.computeVertexNormals();
    }
    return { geo, x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2, z: (p0[2] + p1[2]) / 2, rx: _e.x, ry: _e.y, rz: _e.z };
  }
  const DOIGTS = [ // [x (devant → derrière), longueur de la 1re phalange, des 2 autres, grosseur] : l'index, le majeur, l'annulaire, l'auriculaire
    [0.026, 0.03, 0.034, 0.0098], [0.008, 0.033, 0.037, 0.0102], [-0.01, 0.031, 0.034, 0.0096], [-0.026, 0.025, 0.027, 0.0086],
  ];
  function main(cote, detail, serre) {
    const L = [], y0 = -0.262, s = serre === undefined ? 1 : serre; // y0 : le poignet
    const paume = new THREE.SphereGeometry(1, detail ? 10 : 6, detail ? 8 : 5), p = paume.attributes.position;
    for (let i = 0; i < p.count; i++) { // la paume : un coussin plat, plus large aux jointures, plus épais côté pouce
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), large = 1 + 0.12 * Math.max(0, -y);
      p.setXYZ(i, x * 0.043 * large, y * 0.048, z * (0.017 + 0.006 * Math.max(0, x)) + (z * cote > 0 ? 0.002 * cote : 0));
    }
    paume.computeVertexNormals();
    L.push({ geo: paume, x: 0.003, y: y0 - 0.045, z: -cote * 0.004, rx: 0, ry: 0, rz: 0, partie: "paume" });
    if (detail) {
      for (const [x, l1, l2, r] of DOIGTS) {
        const a1 = 0.95 * s, a2 = a1 + 1.55 * s, k = [x, y0 - 0.088, -cote * 0.002]; // la jointure, puis 2 angles de repli
        const m = [k[0], k[1] - Math.cos(a1) * l1, k[2] - cote * Math.sin(a1) * l1];
        const b = [m[0], m[1] - Math.cos(a2) * l2, m[2] - cote * Math.sin(a2) * l2];
        L.push(Object.assign(segment(k, m, r, true), { partie: "doigt" }));
        L.push(Object.assign(segment(m, b, r * 0.95, true, r * 0.78), { partie: "doigt" }));
      }
      // le pouce : il part du bas de la paume, côté devant, et se replie devant les doigts
      const a = [0.034, y0 - 0.022, -cote * 0.012], b = [0.052, y0 - 0.05, -cote * 0.03], c = [0.05, y0 - 0.078, -cote * 0.045];
      L.push(Object.assign(segment(a, b, 0.0125, true), { partie: "pouce" }));
      L.push(Object.assign(segment(b, c, 0.0108, true, 0.0088), { partie: "pouce" }));
    } else {
      // de loin : les 4 doigts repliés en un seul bloc arrondi, et le pouce
      const g = new THREE.SphereGeometry(1, 6, 4), q = g.attributes.position;
      for (let i = 0; i < q.count; i++) q.setXYZ(i, q.getX(i) * 0.043, q.getY(i) * 0.022, q.getZ(i) * 0.024);
      g.computeVertexNormals();
      L.push({ geo: g, x: 0.0, y: y0 - 0.098, z: -cote * 0.018, rx: 0, ry: 0, rz: 0, partie: "doigt" });
      L.push(Object.assign(segment([0.034, y0 - 0.022, -cote * 0.012], [0.05, y0 - 0.07, -cote * 0.04], 0.012, false), { partie: "pouce" }));
    }
    return L;
  }

  // ------------------------------------------------------------------ 5. LA TÊTE : le crâne, la mâchoire, les pommettes
  // (la tête sculptée de la demande 93, reprise et affinée : le crâne plus rond derrière, la mâchoire qui descend en
  // angle vers le menton, le nez qui sort de la tête elle-même, les orbites plus creuses, les tempes, la nuque)
  const gauss = (d, r) => Math.exp(-(d * d) / (r * r));
  function crane(seg, tranches) {
    const g = new THREE.SphereGeometry(1, seg, tranches), p = g.attributes.position;
    const pas = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    for (let i = 0; i < p.count; i++) {
      const nx = p.getX(i), ny = p.getY(i), nz = p.getZ(i);
      let x = nx * 0.096, y = ny * 0.117, z = nz * 0.079;
      const b2 = pas(0.15, -0.95, ny); // (0 en haut, 1 sous le menton)
      const devant = pas(-0.2, 0.6, nx); // (0 derrière, 1 sur le visage)
      z *= 1 - 0.2 * b2 - 0.16 * b2 * b2 * b2 * devant; // la mâchoire, puis le menton : plus étroits
      x += 0.016 * b2 * devant; // le bas du visage avance un peu (la bouche, le menton)
      if (nx < 0) (x *= 1 - 0.52 * b2 + 0.07 * Math.max(0, ny) * (1 - b2)), (y *= 1 - 0.32 * b2 * -nx); // la nuque rentre, le crâne s'arrondit derrière
      if (ny < -0.35) y = -0.041 + (y + 0.041) * (1 - 0.25 * (1 - devant)); // (le dessous de la mâchoire, plus plat vers le cou)
      if (nx > 0 && ny > 0.2) x *= 1 - 0.12 * (ny - 0.2); // le front, plus droit
      z *= 1 - 0.07 * gauss(ny - 0.25, 0.22) * devant; // les tempes
      if (nx > 0.2) { // les reliefs du visage (vers l'avant, plus forts au milieu)
        const az = Math.abs(z), f = Math.min(1, (nx - 0.2) * 2);
        let d = 0;
        d += 0.008 * gauss(y - 0.03, 0.011) * gauss(az - 0.03, 0.03); // l'arcade des sourcils
        d -= 0.012 * gauss(y - 0.012, 0.013) * gauss(az - 0.032, 0.016); // les orbites (les yeux creusés)
        d += 0.007 * gauss(y + 0.016, 0.016) * gauss(az - 0.055, 0.016); // les pommettes
        d += 0.004 * gauss(y + 0.058, 0.016) * gauss(az, 0.024); // la bouche
        d -= 0.003 * gauss(y + 0.078, 0.006) * gauss(az, 0.02); // le creux sous la lèvre
        d += 0.004 * gauss(y + 0.098, 0.014) * gauss(az, 0.022); // le menton
        d += 0.006 * gauss(y + 0.0, 0.022) * gauss(az, 0.01) * pas(0.045, 0.0, y); // la racine du nez
        d -= 0.004 * gauss(y + 0.04, 0.02) * gauss(az - 0.048, 0.018); // le creux des joues
        x += d * f;
        if (az > 0.036) z += Math.sign(z) * 0.007 * gauss(y + 0.072, 0.02) * f; // l'angle de la mâchoire
      }
      p.setXYZ(i, x, y, z);
    }
    g.computeVertexNormals();
    return g;
  }
  // LE NEZ : un petit loft (la racine entre les yeux, l'arête, le bout arrondi, les ailes ; le dessous, plus sombre, ce
  // sont les narines). Son dos est enfoncé dans la tête. LES LÈVRES et LES SOURCILS : des lofts couchés (de gauche à
  // droite), un peu courbés. LES PAUPIÈRES : des coquilles posées sur l'œil.
  function nez(detail) {
    return loft([
      { y: 0.024, xf: 0.002, xb: 0.008, z: 0.0055 },
      { y: 0.01, xf: 0.0055, xb: 0.008, z: 0.0065 },
      { y: -0.004, xf: 0.0095, xb: 0.008, z: 0.0072 },
      { y: -0.017, xf: 0.0145, xb: 0.008, z: 0.0085 },
      { y: -0.026, xf: 0.0172, xb: 0.008, z: 0.011 }, // le bout
      { y: -0.032, xf: 0.0145, xb: 0.007, z: 0.0142, e: 2.4 }, // les ailes
      { y: -0.037, xf: 0.006, xb: 0.004, z: 0.011 },
    ], detail ? 10 : 6, detail ? 2 : 1);
  }
  function couche(tranches, n, lisse) { // (un loft de gauche à droite : son « y » devient z, et cz devient la hauteur)
    const g = loft(tranches.map((t) => Object.assign({}, t, { cz: -(t.cz || 0) })), n, lisse);
    g.rotateX(Math.PI / 2);
    return g;
  }
  function levre(haut) { // (de gauche à droite : fine aux coins, pleine au milieu ; la lèvre du haut a son « arc »)
    const e = haut ? 0.0036 : 0.0048, a = haut ? 0.005 : 0.0062, T = [];
    for (let k = 4; k >= -4; k--) { // (de haut en bas pour le loft : ici, de droite à gauche)
      const u = k / 4, plein = Math.pow(Math.cos(u * Math.PI / 2), 0.7) * 0.85 + 0.15;
      T.push({ y: u * 0.021, xf: Math.max(0.0012, a * plein), xb: 0.002, z: Math.max(0.0012, e * plein), cx: -0.006 * u * u, cz: haut ? 0.0008 * Math.abs(u) * (1 - Math.abs(u)) * 4 - 0.0004 : -0.0012 * plein });
    }
    return couche(T, 8, 1);
  }
  function sourcil() {
    return couche([
      { y: 0.022, xf: 0.0015, xb: 0.001, z: 0.0014, cx: -0.007, cz: -0.002 },
      { y: 0.012, xf: 0.0025, xb: 0.0015, z: 0.0028, cx: -0.0025, cz: 0.0004 },
      { y: 0.0, xf: 0.0028, xb: 0.0015, z: 0.0034, cx: 0, cz: 0.0012 },
      { y: -0.012, xf: 0.0025, xb: 0.0015, z: 0.0032, cx: -0.0025, cz: 0.0004 },
      { y: -0.022, xf: 0.0015, xb: 0.001, z: 0.0018, cx: -0.007, cz: -0.0015 },
    ], 6, 2);
  }
  function paupiere(haut, r) { // une coquille un peu plus grande que l'œil (rayon r), sur le haut ou le bas
    const g = haut ? new THREE.SphereGeometry(r * 1.06, 14, 4, 0, Math.PI * 2, 0, Math.PI * 0.33) : new THREE.SphereGeometry(r * 1.05, 14, 2, 0, Math.PI * 2, Math.PI * 0.74, Math.PI * 0.26);
    g.rotateZ(haut ? -0.32 : -0.15); // (penchée vers l'avant : elle couvre le haut de l'œil, devant)
    return g;
  }

  // ✍️ (demande 128) UNE COQUE : une peau posée PAR-DESSUS une forme (la cagoule, la capuche, le foulard sur la tête) :
  // chaque point de la forme est poussé de « ecart » m vers l'extérieur ; « garder(x, y, z) » dit quels triangles on garde
  // (la fente des yeux d'une cagoule est un trou : ses triangles sont enlevés) ; « nez » : la bosse du nez sous le tissu.
  function coque(geo, ecart, garder, nez) {
    const g = geo.clone(), p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) + n.getX(i) * ecart;
      const y = p.getY(i) + n.getY(i) * ecart, z = p.getZ(i) + n.getZ(i) * ecart;
      if (nez && x > 0) x += nez * gauss(y + 0.016, 0.024) * gauss(z, 0.018); // (le tissu tendu sur le nez)
      p.setXYZ(i, x, y, z);
    }
    if (garder) {
      const ix = g.index.array, gardes = [];
      for (let t = 0; t < ix.length; t += 3) {
        // (un triangle est gardé si ses 3 coins le sont : les bords suivent les rangées de la tête, sans dents de scie)
        let ok = true;
        for (let k = 0; k < 3 && ok; k++) ok = garder(p.getX(ix[t + k]), p.getY(ix[t + k]), p.getZ(ix[t + k]));
        if (ok) gardes.push(ix[t], ix[t + 1], ix[t + 2]);
      }
      g.setIndex(gardes);
    }
    g.computeVertexNormals();
    return g;
  }

  // (sous le capot : ce que le sculpteur a fabriqué)
  const bilan = { morceaux: 0, sommets: 0, melanges: 0 };
  return { loft, lisser, melange, deuxJoints, tronc, jambe, bras, cou, tigeBotte, pied, main, segment, crane, nez, levre, sourcil, paupiere, coque, bilan };
})();
