// 🏁 LES VOITURES DE MARQUE : le bureau de design (étape 51)
//
// ✍️ Maxance veut des voitures « ultra réalistes », avec leur vrai nom : la Bugatti Chiron, la Porsche 911, la
// Lamborghini Aventador, la Honda NSX, la Peugeot 508, la Mercedes Vito et la Kawasaki Ninja.
//
// Chaque voiture est construite avec SES VRAIES MESURES (longueur, largeur, hauteur, et l'empattement : la distance
// entre les roues avant et arrière). Sa peau est une COQUE (affichage/coque.js) : on donne une dizaine de tranches,
// vues de face, et le constructeur fait les courbes. Ses roues viennent de l'atelier du pneumaticien (affichage/roues.js).
// Pas de logo : on reconnaît chaque voiture à sa forme et à sa « signature » (ses phares, ses feux, ses lignes).
//
// Tout ce qui est posé sur les ressorts (la carrosserie, les vitres, les phares…) est rangé dans la CAISSE : elle
// monte, descend et penche un peu (logique/ressorts.js) ; les roues, elles, restent sur la route.
//
// Toutes les voitures sont construites « nez vers x+ », posées au sol (y = 0), centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.VoituresMarques = (function () {
  const O = Circuit.Modeles.outils;
  const { M, peinture, boite, cylindre, tube, personnage } = O;
  const Coque = Circuit.Coque;

  // ---------------------------------------------------------------- les outils du bureau de design

  // Une coque peinte (avec ses vitres), posée dans la caisse.
  // (Une cabine vitrée est enfoncée de 10 cm dans la carrosserie : sinon on verrait son dessous sous les coins du capot.)
  function coque(caisse, options, materiau) {
    if (options.vitre) options = Object.assign({}, options, { cles: options.cles.map((k) => Object.assign({}, k, { yb: k.yb - 0.1 })) });
    const c = Coque.construire(options);
    const m = new THREE.Mesh(c.geometrie, [materiau, M.vitre]);
    m.castShadow = true;
    m.receiveShadow = true;
    caisse.add(m);
    return c;
  }
  // La règle des vitres d'une cabine : le pare-brise (devant), la lunette (derrière) et les vitres des côtés.
  // f = { pareBrise: [xMin, xMax], lunette: [xMin, xMax] ou null, av, ar (de où à où vont les vitres des côtés),
  //       montants: [x…] (les montants entre les vitres), pilier (la largeur des montants du pare-brise) }
  function regleVitres(f) {
    const pilier = f.pilier || 0.09;
    const dans = (x, r) => r && x > r[0] && x < r[1];
    return (c, n, s) => {
      const [x, y, z] = c;
      if (y < s.yb + 0.135) return false; // (+ 10 cm : la cabine est enfoncée dans la carrosserie)
      const dessus = Math.abs(n[2]) < 0.55; // ce morceau regarde vers le haut, l'avant ou l'arrière (pas le côté)
      if (dessus) {
        if (dans(x, f.pareBrise)) return Math.abs(z) < s.w - pilier;
        if (dans(x, f.lunette)) return Math.abs(z) < s.w - pilier * 1.3;
        return false;
      }
      if (y < s.yt - 0.1 && x < f.av && x > f.ar) return !(f.montants || []).some((m) => Math.abs(x - m) < 0.045);
      return false;
    };
  }
  // Les arches des roues : un arc un peu plus grand que le pneu, qui commence juste à l'intérieur du pneu.
  const arches = (R, voie) => R.map((r) => ({ x: r.x, y: r.r, r: r.r + 0.045, z: voie - r.l / 2 - 0.05 }));
  // Les 4 roues (2 de chaque côté), venues de l'atelier du pneumaticien.
  function quatreRoues(g, liste, voie, options) {
    const roues = [];
    for (const r of liste) {
      for (const cote of [-1, 1]) {
        const w = Circuit.Roues.fabriquer(Object.assign({}, options, { rayon: r.r, largeur: r.l, jante: r.j, cote }));
        fusionner(w.roue); // (étape 55 : les pièces de la roue qui tournent ensemble sont recollées, elles aussi)
        w.pivot.position.set(r.x, r.r, cote * (r.voie || voie));
        g.add(w.pivot);
        roues.push(Object.assign(w, { avant: r.x > 0 }));
      }
    }
    return roues;
  }
  // Poser un détail (un phare, une grille…) À LA SURFACE du dessus de la coque, bien à plat sur la pente.
  function surLeDessus(objet, c, x, z, decale) {
    const y = c.dessus(x, z), d = 0.02;
    const gx = (c.dessus(x + d, z) - c.dessus(x - d, z)) / (2 * d), gz = (c.dessus(x, Math.abs(z) + d) - c.dessus(x, Math.max(0, Math.abs(z) - d))) / (2 * d) * Math.sign(z || 1);
    const n = new THREE.Vector3(-gx, 1, -gz).normalize();
    objet.position.set(x, y + (decale || 0), z);
    objet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    return objet;
  }
  // Un détail collé sur le flanc (z = ±demi-largeur à cet endroit).
  function surLeFlanc(caisse, c, x, y, cote, lx, ly, materiau, epaisseur) {
    const b = boite(lx, ly, epaisseur || 0.01, materiau, x, y, cote * (c.tranche(x).w + (epaisseur || 0.01) / 2));
    caisse.add(b);
    return b;
  }
  // Un plat (un phare, un feu…) : une petite boîte très plate, qu'on pose ensuite avec surLeDessus.
  const plat = (lx, lz, materiau, ep) => boite(lx, ep || 0.02, lz, materiau, 0, 0, 0);
  // Un détail posé sur l'avant ou l'arrière tout plat de la coque (le « bout »).
  function auBout(caisse, c, avant, y, z, ly, lz, materiau, epaisseur) {
    const e = epaisseur || 0.02;
    const x = avant ? c.xMax + e / 2 : c.xMin - e / 2;
    const b = boite(e, ly, lz, materiau, x, y, z);
    caisse.add(b);
    return b;
  }
  // Les rétroviseurs : sur la portière, juste derrière le pare-brise.
  function retros(caisse, x, y, zCabine, zCaisse, materiau, t) {
    const k = t || 1;
    for (const cote of [-1, 1]) {
      caisse.add(tube([x, y - 0.03, cote * zCabine], [x - 0.04, y + 0.01, cote * (zCaisse + 0.02)], 0.02, materiau));
      const coqueR = new THREE.Mesh(new THREE.SphereGeometry(0.1 * k, 14, 10), materiau);
      coqueR.scale.set(0.8, 0.62, 1.15);
      coqueR.position.set(x - 0.05, y + 0.04, cote * (zCaisse + 0.1 * k));
      coqueR.castShadow = true;
      caisse.add(coqueR);
      caisse.add(boite(0.01, 0.1 * k, 0.17 * k, M.chrome, x - 0.13 * k, y + 0.04, cote * (zCaisse + 0.1 * k)));
    }
  }
  // Une ligne de portière (un fin trait sombre, avec la poignée).
  function portiere(caisse, c, xAv, xAr, yBas, yHaut, poignee) {
    for (const cote of [-1, 1]) {
      for (const x of [xAv, xAr]) surLeFlanc(caisse, c, x, (yBas + yHaut) / 2, cote, 0.008, yHaut - yBas, M.noir, 0.004);
      surLeFlanc(caisse, c, (xAv + xAr) / 2, yBas, cote, xAv - xAr, 0.008, M.noir, 0.004);
      if (poignee !== false) surLeFlanc(caisse, c, xAr + 0.25, yHaut - 0.09, cote, 0.2, 0.03, poignee || M.chrome, 0.018);
    }
  }
  function echappement(caisse, x, y, z, rayon, cotes) {
    const e = cylindre(rayon, 0.14, M.chrome, cotes || 18);
    e.rotation.z = Math.PI / 2;
    e.position.set(x, y, z);
    caisse.add(e);
    const trou = cylindre(rayon * 0.78, 0.15, M.noir, cotes || 18);
    trou.rotation.z = Math.PI / 2;
    trou.position.set(x - 0.005, y, z);
    caisse.add(trou);
  }
  // ---------------------------------------------------------------- étape 55 : les outils du détail

  // Où est la peau du flanc, à la longueur x et à la hauteur y ? (le z de la carrosserie, côté z > 0)
  function flancZ(c, x, y) {
    const s = c.tranche(x), wl = s.wl === undefined ? s.w : s.wl;
    const t = Math.max(0, Math.min(1, (y - s.yb) / Math.max(0.05, s.yc - s.yb)));
    return wl + (s.w - wl) * Math.sin((t * Math.PI) / 2);
  }
  // Une pièce COLLÉE sur le flanc (une prise d'air, une bande de couleur…) : une petite grille de points posés
  // sur la peau, un peu décollée (decale), qui suit donc les courbes de la carrosserie.
  function patchFlanc(caisse, c, x0, x1, y0, y1, materiau, cote, decale, forme) {
    const nx = 10, ny = 6, pos = [], idx = [];
    for (let j = 0; j <= ny; j++) {
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, v = j / ny;
        // forme(u, v) : un décalage de x pour faire des bords penchés (par défaut : un rectangle)
        const x = x0 + (x1 - x0) * u + (forme ? forme(u, v) : 0), y = y0 + (y1 - y0) * v;
        pos.push(x, y, cote * (flancZ(c, x, y) + (decale || 0.006)));
      }
    }
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
        if (cote > 0) idx.push(a, b, d, b, e, d);
        else idx.push(a, d, b, b, d, e);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, materiau);
    m.receiveShadow = true;
    caisse.add(m);
    return m;
  }
  // Une LIGNE qui court sur le flanc (un jonc chromé, un pli de carrosserie) : un tube qui passe par les points [x, y].
  function ligneFlanc(caisse, c, points, rayon, materiau, cote) {
    const courbe = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, cote * (flancZ(c, x, y) + rayon * 0.5))));
    const m = new THREE.Mesh(new THREE.TubeGeometry(courbe, points.length * 8, rayon, 6, false), materiau);
    caisse.add(m);
    return m;
  }
  // Un BLOC OPTIQUE, comme sur une vraie voiture : un boîtier (chromé foncé pour un phare, rouge sombre pour un feu),
  // des LED qui brillent dedans, et une lentille de verre transparente par-dessus qui reflète le ciel.
  // Il est construit à plat (sa face regarde vers y+) : l × h, et les LED [dx, dz, lx, lz] sont placées dedans.
  function optique(l, h, leds, sorte) {
    const o = new THREE.Group(), feu = sorte === "feu";
    o.add(plat(l, h, feu ? M.feuVerre : M.boitier, 0.03));
    for (const [dx, dz, lx, lz] of leds) {
      const led = plat(lx, lz, feu ? M.feuLed : M.led, 0.012);
      led.position.set(dx, 0.02, dz);
      o.add(led);
    }
    if (feu) return o; // (un feu : son verre rouge suffit)
    const verre = plat(l, h, M.lentille, 0.006);
    verre.position.y = 0.032;
    o.add(verre);
    return o;
  }
  // Un bloc optique posé sur le bout (l'avant ou l'arrière tout plat) : y = sa hauteur, z = son milieu,
  // haut × large (en m), et les LED [dy, dz, ly, lz].
  function optiqueAuBout(caisse, c, avant, y, z, haut, large, leds, sorte) {
    const o = optique(haut, large, leds, sorte);
    o.rotation.z = avant ? -Math.PI / 2 : Math.PI / 2; // (la face y+ regarde vers l'avant, ou vers l'arrière)
    o.position.set(avant ? c.xMax + 0.002 : c.xMin - 0.002, y, z);
    caisse.add(o);
    return o;
  }
  // Une grille de calandre (un nid d'abeille sombre), posée sur le bout.
  function grille(caisse, c, avant, y, z, haut, large, cadre) {
    const t = Circuit.Textures.nidAbeille();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(large, haut), new THREE.MeshStandardMaterial({ map: t, color: 0x9a9da2, roughness: 0.5, metalness: 0.6 }));
    m.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    m.position.set(avant ? c.xMax + 0.004 : c.xMin - 0.004, y, z);
    caisse.add(m);
    if (cadre) {
      for (const dy of [-1, 1]) caisse.add(boite(0.02, 0.018, large, cadre, avant ? c.xMax + 0.008 : c.xMin - 0.008, y + (dy * haut) / 2, z));
      for (const dz of [-1, 1]) caisse.add(boite(0.02, haut, 0.018, cadre, avant ? c.xMax + 0.008 : c.xMin - 0.008, y, z + (dz * large) / 2));
    }
    return m;
  }

  // Des LETTRES chromées (le nom de la marque, à l'arrière) : une image transparente avec le texte, posée sur le bout.
  function lettres(caisse, c, avant, y, z, texte, large, haut, couleur, police) {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 64;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = couleur || "#e6e8ec";
    ctx.font = police || "bold 46px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // (les lettres sont espacées, comme sur les vraies voitures)
    const ecart = 14, l = [...texte].reduce((n, ch) => n + ctx.measureText(ch).width + ecart, -ecart);
    let x = 256 - l / 2;
    for (const ch of texte) {
      const w = ctx.measureText(ch).width;
      ctx.fillText(ch, x + w / 2, 34);
      x += w + ecart;
    }
    const t = new THREE.CanvasTexture(toile);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(large, haut), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, metalness: 0.9, roughness: 0.25 }));
    m.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    m.position.set(avant ? c.xMax + 0.006 : c.xMin - 0.006, y, z);
    caisse.add(m);
    return m;
  }
  // Un PHARE ROND (la Porsche 911) : la cuvette, un anneau de lumière avec ses 4 points, et la lentille bombée.
  function phareRond(rayon) {
    const o = new THREE.Group();
    const cuvette = cylindre(rayon, 0.04, M.boitier, 32);
    o.add(cuvette);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(rayon * 0.72, rayon * 0.06, 8, 32), M.led);
    anneau.rotation.x = Math.PI / 2;
    anneau.position.y = 0.022;
    o.add(anneau);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, point = plat(rayon * 0.2, rayon * 0.2, M.led, 0.012);
      point.position.set(Math.cos(a) * rayon * 0.45, 0.024, Math.sin(a) * rayon * 0.45);
      o.add(point);
    }
    const verre = new THREE.Mesh(new THREE.SphereGeometry(rayon, 28, 10, 0, Math.PI * 2, 0, 0.5), M.lentille);
    verre.scale.y = 0.6;
    verre.position.y = -rayon * 0.5;
    o.add(verre);
    const bague = new THREE.Mesh(new THREE.TorusGeometry(rayon, rayon * 0.07, 8, 32), M.chrome);
    bague.rotation.x = Math.PI / 2;
    bague.position.y = 0.02;
    o.add(bague);
    return o;
  }

  // Ce que toutes les voitures renvoient : le groupe, la caisse (sur les ressorts), les roues et la hauteur de l'œil.
  function voiture(g, caisse, roues, yCapot) {
    fusionner(caisse);
    return { g, caisse, roues, yCapot, ressorts: [] };
  }
  // Étape 55 : une voiture a maintenant plus de 150 petites pièces. Pour la carte graphique, chaque pièce est un
  // « dessin » à faire, et 30 voitures × 150 dessins, c'est beaucoup ! Alors, une fois la voiture finie, on RECOLLE
  // ensemble toutes les pièces de la caisse qui ont la même matière (tout le chrome en une seule pièce, toutes les
  // LED en une autre…) : la voiture a exactement la même allure, mais elle se dessine en une vingtaine de fois.
  function fusionner(caisse) {
    caisse.updateMatrixWorld(true);
    const inverse = caisse.matrixWorld.clone().invert(), paquets = new Map();
    caisse.traverse((m) => {
      if (!m.isMesh || Array.isArray(m.material) || !m.geometry.attributes.normal) return;
      const avecUV = !!m.geometry.attributes.uv, cle = m.material.uuid + (avecUV ? "+uv" : "");
      if (!paquets.has(cle)) paquets.set(cle, { materiau: m.material, avecUV, pieces: [] });
      paquets.get(cle).pieces.push(m);
    });
    const matrice = new THREE.Matrix4();
    for (const { materiau, avecUV, pieces } of paquets.values()) {
      if (pieces.length < 2) continue;
      const pos = [], nor = [], uv = [];
      for (const m of pieces) {
        const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
        matrice.multiplyMatrices(inverse, m.matrixWorld);
        geo.applyMatrix4(matrice);
        pos.push(geo.attributes.position.array);
        nor.push(geo.attributes.normal.array);
        if (avecUV) uv.push(geo.attributes.uv.array);
        geo.dispose();
        m.parent.remove(m);
      }
      const colle = (listes) => {
        const tout = new Float32Array(listes.reduce((n, a) => n + a.length, 0));
        let k = 0;
        for (const a of listes) { tout.set(a, k); k += a.length; }
        return tout;
      };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(colle(pos), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(colle(nor), 3));
      if (avecUV) geo.setAttribute("uv", new THREE.BufferAttribute(colle(uv), 2));
      const piece = new THREE.Mesh(geo, materiau);
      piece.castShadow = !materiau.transparent;
      piece.receiveShadow = true;
      caisse.add(piece);
    }
  }

  // ---------------------------------------------------------------- 🇫🇷 Bugatti Chiron (4,54 m × 2,04 m × 1,21 m)
  // (Étape 55 : refaite. Le flanc rentre vers le bas, la cabine a un vrai toit et des vitres penchées, la ligne en « C »
  // suit la carrosserie, de vrais blocs de phares à 4 lampes, et la longue barre de feux arrière.)
  function chiron(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.32, r: 0.345, l: 0.29, j: 0.255 }, { x: -1.39, r: 0.355, l: 0.34, j: 0.265 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.27, yb: 0.3, yc: 0.86, yt: 0.9, w: 0.86, wl: 0.8, n: 4 },
        { x: -2.12, yb: 0.2, yc: 0.92, yt: 0.95, w: 0.97, wl: 0.9, n: 4 },
        { x: -1.4, yb: 0.13, yc: 0.92, yt: 0.9, w: 1.02, wl: 0.94, n: 3.6 },
        { x: -0.8, yb: 0.12, yc: 0.87, yt: 0.86, w: 0.99, wl: 0.92, n: 3.2 },
        { x: -0.2, yb: 0.12, yc: 0.84, yt: 0.83, w: 0.97, wl: 0.9, n: 3 },
        { x: 0.5, yb: 0.12, yc: 0.8, yt: 0.79, w: 0.97, wl: 0.9, n: 3 },
        { x: 1.0, yb: 0.12, yc: 0.82, yt: 0.72, w: 1.0, wl: 0.93, n: 3.4 },
        { x: 1.32, yb: 0.13, yc: 0.84, yt: 0.68, w: 1.0, wl: 0.94, n: 3.6 },
        { x: 1.8, yb: 0.14, yc: 0.7, yt: 0.58, w: 0.96, wl: 0.9, n: 3.2 },
        { x: 2.12, yb: 0.16, yc: 0.54, yt: 0.5, w: 0.86, wl: 0.8, n: 2.8 },
        { x: 2.27, yb: 0.22, yc: 0.44, yt: 0.43, w: 0.66, wl: 0.6, n: 2.4 },
      ],
      arches: arches(R, 0.85),
    }, peinture(k1));
    // La cabine : un toit (couleur 2, comme les Chiron « deux tons ») qui retombe en goutte d'eau vers l'arrière.
    coque(caisse, {
      cles: [
        { x: -1.85, yb: 0.86, yc: 0.88, yt: 0.89, w: 0.36, wt: 0.24, rt: 0.08 },
        { x: -1.5, yb: 0.85, yc: 0.88, yt: 0.95, w: 0.48, wt: 0.3, rt: 0.1 },
        { x: -1.0, yb: 0.84, yc: 0.88, yt: 1.07, w: 0.62, wt: 0.4, rt: 0.12 },
        { x: -0.55, yb: 0.83, yc: 0.87, yt: 1.17, w: 0.72, wt: 0.47, rt: 0.13 },
        { x: -0.15, yb: 0.82, yc: 0.85, yt: 1.21, w: 0.76, wt: 0.5, rt: 0.13 },
        { x: 0.25, yb: 0.8, yc: 0.83, yt: 1.16, w: 0.77, wt: 0.5, rt: 0.13 },
        { x: 0.6, yb: 0.78, yc: 0.81, yt: 1.0, w: 0.76, wt: 0.56, rt: 0.12 },
        { x: 0.95, yb: 0.75, yc: 0.77, yt: 0.78, w: 0.72, wt: 0.62, rt: 0.06 },
      ],
      vitre: regleVitres({ pareBrise: [0.3, 1.0], av: 0.7, ar: -0.8, montants: [], pilier: 0.08 }),
    }, peinture(k2));
    // L'arête au milieu du toit, qui file jusqu'au capot moteur (la « dorsale » de la Chiron).
    const dorsale = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.2, 1.215], [-0.5, 1.19], [-1.1, 1.08], [-1.6, 0.97], [-2.05, 0.96]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 30, 0.022, 6), peinture(k1));
    caisse.add(dorsale);
    // La calandre en FER À CHEVAL : un cadre chromé, la grille en nid d'abeille, et la Bugatti « ligne » sur le capot.
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.19, 30), new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 }));
    fond.scale.set(0.85, 1.05, 1);
    fond.rotation.y = Math.PI / 2;
    fond.position.set(c.xMax + 0.012, 0.36, 0);
    caisse.add(fond);
    const forme = new THREE.Shape();
    forme.absarc(0, 0, 0.2, -Math.PI * 0.32, Math.PI * 1.32, false);
    forme.absarc(0, 0, 0.17, Math.PI * 1.32, -Math.PI * 0.32, true);
    const fer = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 32 }), M.chrome);
    fer.scale.set(0.85, 1.05, 1);
    fer.rotation.y = Math.PI / 2;
    fer.position.set(c.xMax - 0.004, 0.36, 0);
    caisse.add(fer);
    caisse.add(surLeDessus(plat(0.9, 0.025, M.chrome, 0.012), c, 1.85, 0, 0.003)); // la ligne chromée au milieu du capot
    // Les phares : un bloc à 4 lampes carrées de chaque côté, sur la pente du nez ; les entrées d'air du bouclier.
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.46, 0.26, [[0.13, 0.05, 0.06, 0.06], [0.04, -0.03, 0.06, 0.06], [-0.05, 0.05, 0.06, 0.06], [-0.14, -0.03, 0.06, 0.06], [0, -0.1, 0.4, 0.014]]), c, 2.0, cote * 0.63, 0.004);
      if (cote < 0) bloc.rotateY(Math.PI);
      caisse.add(bloc);
      grille(caisse, c, true, 0.3, cote * 0.44, 0.15, 0.32, M.chrome);
    }
    grille(caisse, c, true, 0.2, 0, 0.08, 0.5);
    // La ligne en « C » chromée sur chaque flanc (elle passe derrière la portière), et la prise d'air dedans.
    for (const cote of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const t = (k / 16) * (Math.PI * 1.22) + Math.PI * 0.4;
        pts.push([-0.12 + Math.cos(t) * 0.85, 0.52 + Math.sin(t) * 0.31]);
      }
      ligneFlanc(caisse, c, pts, 0.016, M.chrome, cote);
      patchFlanc(caisse, c, -0.9, -0.6, 0.44, 0.74, new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 }), cote, 0.008, (u, v) => (1 - v) * 0.12);
      ligneFlanc(caisse, c, [[1.9, 0.2], [0.5, 0.17], [-0.9, 0.17], [-2.0, 0.22]], 0.02, M.plastique, cote); // le bas de caisse
    }
    // L'arrière : la grille noire, la longue barre de feux, le diffuseur, 4 sorties d'échappement au milieu.
    grille(caisse, c, false, 0.55, 0, 0.42, 1.5);
    optiqueAuBout(caisse, c, false, 0.8, 0, 0.05, 1.62, [[0, 0, 0.02, 1.58]], "feu");
    lettres(caisse, c, false, 0.86, 0, "BUGATTI", 0.5, 0.06);
    for (let i = -3; i <= 3; i++) caisse.add(boite(0.36, 0.14, 0.012, M.plastique, c.xMin + 0.1, 0.24, i * 0.2)); // les ailettes du diffuseur
    caisse.add(boite(0.4, 0.018, 1.5, M.plastique, c.xMin + 0.12, 0.17, 0));
    for (const [y, z] of [[0.42, -0.12], [0.42, 0.12], [0.3, -0.12], [0.3, 0.12]]) echappement(caisse, c.xMin - 0.04, y, z, 0.045);
    caisse.add(surLeDessus(plat(0.36, 1.55, peinture(k2), 0.03), c, -2.0, 0, 0.03)); // l'aileron (rentré)
    retros(caisse, 0.62, 0.86, 0.74, 0.98, peinture(k2), 0.9);
    for (const cote of [-1, 1]) surLeFlanc(caisse, c, 0.7, 0.55, cote, 0.006, 0.5, M.noir, 0.004); // la fente de la portière (le reste est caché par le « C »)
    const roues = quatreRoues(g, R, 0.85, { style: "turbine", etrier: [0.12, 0.28, 0.85], metal: M.jante });
    return voiture(g, caisse, roues, 1.1);
  }

  // ---------------------------------------------------------------- 🇩🇪 Porsche 911 (4,52 m × 1,85 m × 1,30 m)
  // (Étape 55 : refaite. La silhouette « fastback » qui descend jusqu'au moteur, les ailes arrière larges, les phares
  // ronds à 4 points, la barre de feux sur toute la largeur et les lettres PORSCHE.)
  function porsche911(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.3, r: 0.34, l: 0.25, j: 0.255 }, { x: -1.15, r: 0.35, l: 0.3, j: 0.265 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.26, yb: 0.32, yc: 0.78, yt: 0.82, w: 0.8, wl: 0.74, n: 3 },
        { x: -2.1, yb: 0.22, yc: 0.84, yt: 0.88, w: 0.9, wl: 0.83, n: 3 },
        { x: -1.6, yb: 0.15, yc: 0.86, yt: 0.9, w: 0.93, wl: 0.86, n: 3.2 },
        { x: -1.15, yb: 0.15, yc: 0.87, yt: 0.89, w: 0.93, wl: 0.86, n: 3.2 },
        { x: -0.6, yb: 0.14, yc: 0.82, yt: 0.86, w: 0.87, wl: 0.81, n: 3 },
        { x: 0.0, yb: 0.14, yc: 0.8, yt: 0.84, w: 0.86, wl: 0.8, n: 3 },
        { x: 0.6, yb: 0.14, yc: 0.79, yt: 0.8, w: 0.89, wl: 0.83, n: 3 },
        { x: 1.0, yb: 0.14, yc: 0.78, yt: 0.69, w: 0.91, wl: 0.85, n: 3.2 },
        { x: 1.3, yb: 0.15, yc: 0.8, yt: 0.65, w: 0.91, wl: 0.85, n: 3.4 },
        { x: 1.8, yb: 0.16, yc: 0.7, yt: 0.57, w: 0.88, wl: 0.82, n: 3 },
        { x: 2.1, yb: 0.18, yc: 0.55, yt: 0.5, w: 0.8, wl: 0.75, n: 2.6 },
        { x: 2.26, yb: 0.24, yc: 0.42, yt: 0.43, w: 0.6, wl: 0.56, n: 2.2 },
      ],
      arches: arches(R, 0.79),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.05, yb: 0.84, yc: 0.86, yt: 0.87, w: 0.52, wt: 0.42, rt: 0.08 },
        { x: -1.8, yb: 0.85, yc: 0.87, yt: 0.93, w: 0.57, wt: 0.44, rt: 0.1 },
        { x: -1.3, yb: 0.85, yc: 0.87, yt: 1.07, w: 0.62, wt: 0.45, rt: 0.12 },
        { x: -0.8, yb: 0.83, yc: 0.85, yt: 1.21, w: 0.66, wt: 0.47, rt: 0.13 },
        { x: -0.3, yb: 0.82, yc: 0.84, yt: 1.3, w: 0.68, wt: 0.5, rt: 0.13 },
        { x: 0.1, yb: 0.81, yc: 0.83, yt: 1.26, w: 0.69, wt: 0.5, rt: 0.13 },
        { x: 0.45, yb: 0.8, yc: 0.82, yt: 1.08, w: 0.7, wt: 0.55, rt: 0.12 },
        { x: 0.78, yb: 0.77, yc: 0.79, yt: 0.8, w: 0.7, wt: 0.62, rt: 0.06 },
      ],
      vitre: regleVitres({ pareBrise: [0.22, 0.85], av: 0.62, ar: -1.05, montants: [-0.5], lunette: [-1.65, -0.8] }),
    }, peinture(k1));
    // Les phares RONDS sur le haut des ailes, un peu redressés vers l'avant.
    for (const cote of [-1, 1]) {
      const lampe = surLeDessus(phareRond(0.12), c, 1.98, cote * 0.6, 0.012);
      lampe.rotateZ(-0.35);
      caisse.add(lampe);
      grille(caisse, c, true, 0.3, cote * 0.4, 0.13, 0.36, M.plastique); // les entrées d'air
      optiqueAuBout(caisse, c, true, 0.42, cote * 0.48, 0.03, 0.2, [[0, 0, 0.012, 0.18]]); // le feu de jour, fin, au-dessus
    }
    grille(caisse, c, true, 0.3, 0, 0.1, 0.3);
    // L'arrière : la grille du moteur (lamelles), le becquet, la barre de feux sur toute la largeur, les lettres, 2 sorties.
    for (let i = 0; i < 9; i++) caisse.add(surLeDessus(plat(0.022, 0.62, M.noir, 0.01), c, -1.82 - i * 0.04, 0, 0.004));
    caisse.add(surLeDessus(plat(0.22, 1.3, peinture(k1), 0.03), c, -2.08, 0, 0.03));
    optiqueAuBout(caisse, c, false, 0.66, 0, 0.05, 1.58, [[0, 0, 0.018, 1.54], [0, 0.62, 0.03, 0.28], [0, -0.62, 0.03, 0.28]], "feu");
    lettres(caisse, c, false, 0.58, 0, "PORSCHE", 0.62, 0.08);
    grille(caisse, c, false, 0.34, 0, 0.12, 1.2, M.plastique);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.3, cote * 0.3, 0.055);
    for (const cote of [-1, 1]) ligneFlanc(caisse, c, [[1.95, 0.2], [0.5, 0.17], [-0.9, 0.17], [-1.9, 0.22]], 0.018, M.plastique, cote);
    retros(caisse, 0.62, 0.9, 0.64, 0.9, peinture(k1), 0.9);
    portiere(caisse, c, 0.7, -0.5, 0.28, 0.8);
    const roues = quatreRoues(g, R, 0.79, { style: "fins", etrier: [0.85, 0.1, 0.1] });
    return voiture(g, caisse, roues, 1.2);
  }

  // ---------------------------------------------------------------- 🇮🇹 Lamborghini Aventador (4,78 m × 2,03 m × 1,14 m)
  // (Étape 55 : refaite. Toute en angles, la cabine en flèche, les phares et les feux en « Y », les énormes prises
  // d'air en nid d'abeille sur les flancs et l'échappement hexagonal au milieu.)
  function aventador(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.4, r: 0.35, l: 0.27, j: 0.255 }, { x: -1.3, r: 0.37, l: 0.36, j: 0.27 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.39, yb: 0.3, yc: 0.72, yt: 0.74, w: 0.86, wl: 0.8, n: 5 },
        { x: -2.25, yb: 0.2, yc: 0.86, yt: 0.88, w: 0.98, wl: 0.9, n: 5 },
        { x: -1.3, yb: 0.12, yc: 0.92, yt: 0.9, w: 1.01, wl: 0.9, n: 5 },
        { x: -0.6, yb: 0.11, yc: 0.85, yt: 0.86, w: 0.98, wl: 0.86, n: 4.5 },
        { x: 0.2, yb: 0.11, yc: 0.79, yt: 0.8, w: 0.96, wl: 0.86, n: 4.5 },
        { x: 0.95, yb: 0.11, yc: 0.79, yt: 0.74, w: 0.99, wl: 0.9, n: 4.5 },
        { x: 1.4, yb: 0.12, yc: 0.8, yt: 0.64, w: 1.0, wl: 0.92, n: 5 },
        { x: 1.9, yb: 0.13, yc: 0.55, yt: 0.48, w: 0.95, wl: 0.88, n: 4.5 },
        { x: 2.25, yb: 0.15, yc: 0.36, yt: 0.34, w: 0.85, wl: 0.8, n: 4 },
        { x: 2.39, yb: 0.2, yc: 0.27, yt: 0.27, w: 0.7, wl: 0.66, n: 3 },
      ],
      arches: arches(R, 0.85),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.05, yb: 0.85, yc: 0.87, yt: 0.88, w: 0.42, wt: 0.34, rt: 0.04 },
        { x: -1.8, yb: 0.85, yc: 0.87, yt: 0.92, w: 0.47, wt: 0.36, rt: 0.05 },
        { x: -1.2, yb: 0.83, yc: 0.85, yt: 0.99, w: 0.54, wt: 0.38, rt: 0.06 },
        { x: -0.7, yb: 0.81, yc: 0.83, yt: 1.1, w: 0.6, wt: 0.4, rt: 0.07 },
        { x: -0.3, yb: 0.8, yc: 0.82, yt: 1.14, w: 0.64, wt: 0.42, rt: 0.07 },
        { x: 0.1, yb: 0.78, yc: 0.8, yt: 1.11, w: 0.66, wt: 0.44, rt: 0.07 },
        { x: 0.6, yb: 0.76, yc: 0.78, yt: 0.95, w: 0.67, wt: 0.5, rt: 0.06 },
        { x: 1.08, yb: 0.73, yc: 0.75, yt: 0.76, w: 0.64, wt: 0.58, rt: 0.03 },
      ],
      vitre: regleVitres({ pareBrise: [0.12, 1.12], av: 0.85, ar: -0.75, montants: [], lunette: [-1.05, -0.65] }),
    }, peinture(k1));
    // Les phares en « Y » : deux traits de lumière qui se rejoignent, dans un bloc sombre sur la pente du capot.
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.46, 0.24, [[0.04, -0.03, 0.34, 0.026], [-0.12, 0.06, 0.18, 0.026], [0.1, 0.07, 0.07, 0.07]]), c, 2.0, cote * 0.7, 0.004);
      bloc.rotateY(cote * 0.3);
      caisse.add(bloc);
      grille(caisse, c, true, 0.22, cote * 0.5, 0.09, 0.38, M.plastique);
      // les énormes prises d'air sur les flancs, derrière les portières (penchées vers l'avant)
      patchFlanc(caisse, c, -1.0, -0.45, 0.45, 0.76, new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 }), cote, 0.008, (u, v) => v * 0.25);
      ligneFlanc(caisse, c, [[1.9, 0.5], [0.95, 0.62], [-0.2, 0.62], [-0.6, 0.55]], 0.01, peinture(k1.map((q) => q * 0.8)), cote); // le pli sur le flanc
    }
    grille(caisse, c, true, 0.3, 0, 0.05, 0.6);
    for (let i = 0; i < 5; i++) caisse.add(surLeDessus(plat(0.04, 0.8, M.noir, 0.012), c, -1.45 - i * 0.16, 0, 0.004)); // les lamelles du capot moteur
    // Les feux arrière en « Y », la grille noire, l'échappement hexagonal, l'aileron.
    for (const cote of [-1, 1]) {
      const feu = optiqueAuBout(caisse, c, false, 0.6, cote * 0.58, 0.16, 0.34, [[0, -cote * 0.02, 0.02, 0.28], [-0.04, cote * 0.11, 0.1, 0.02], [0.04, cote * 0.11, 0.1, 0.02]], "feu");
      feu.rotation.x = cote * 0.15;
    }
    grille(caisse, c, false, 0.45, 0, 0.28, 0.9, M.plastique);
    echappement(caisse, c.xMin - 0.04, 0.42, 0, 0.12, 6);
    lettres(caisse, c, false, 0.68, 0, "LAMBORGHINI", 0.7, 0.07);
    caisse.add(boite(0.36, 0.035, 1.7, peinture(k1), -2.12, 1.1, 0));
    for (const z of [-0.5, 0.5]) caisse.add(boite(0.14, 0.2, 0.035, M.noir, -2.08, 1.0, z));
    retros(caisse, 0.78, 0.82, 0.62, 0.98, peinture(k1), 0.85);
    portiere(caisse, c, 0.88, -0.45, 0.28, 0.76, false);
    const roues = quatreRoues(g, R, 0.85, { style: "y", etrier: [0.95, 0.8, 0.1], metal: peinture([0.16, 0.16, 0.17]) });
    return voiture(g, caisse, roues, 1.05);
  }

  // ---------------------------------------------------------------- 🇯🇵 Honda NSX (4,49 m × 1,94 m × 1,22 m)
  function basse(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.31, r: 0.335, l: 0.25, j: 0.245 }, { x: -1.32, r: 0.345, l: 0.31, j: 0.255 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.24, yb: 0.3, yc: 0.74, yt: 0.78, w: 0.82, wl: 0.76, n: 3.5 },
        { x: -2.1, yb: 0.2, yc: 0.86, yt: 0.94, w: 0.93, wl: 0.86, n: 3.5 },
        { x: -1.32, yb: 0.13, yc: 0.9, yt: 0.9, w: 0.97, wl: 0.88, n: 3.4 },
        { x: -0.6, yb: 0.12, yc: 0.86, yt: 0.86, w: 0.96, wl: 0.86, n: 3 },
        { x: 0.2, yb: 0.12, yc: 0.82, yt: 0.82, w: 0.95, wl: 0.87, n: 3 },
        { x: 0.9, yb: 0.12, yc: 0.77, yt: 0.72, w: 0.96, wl: 0.89, n: 3.2 },
        { x: 1.31, yb: 0.14, yc: 0.79, yt: 0.66, w: 0.96, wl: 0.9, n: 3.2 },
        { x: 1.8, yb: 0.15, yc: 0.62, yt: 0.55, w: 0.92, wl: 0.86, n: 3 },
        { x: 2.12, yb: 0.17, yc: 0.48, yt: 0.46, w: 0.82, wl: 0.77, n: 2.6 },
        { x: 2.24, yb: 0.24, yc: 0.38, yt: 0.38, w: 0.6, wl: 0.56, n: 2.2 },
      ],
      arches: arches(R, 0.82),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -1.8, yb: 0.85, yc: 0.87, yt: 0.9, w: 0.5, wt: 0.38, rt: 0.08 },
        { x: -1.3, yb: 0.84, yc: 0.86, yt: 0.99, w: 0.57, wt: 0.42, rt: 0.1 },
        { x: -0.8, yb: 0.83, yc: 0.85, yt: 1.13, w: 0.63, wt: 0.46, rt: 0.12 },
        { x: -0.3, yb: 0.82, yc: 0.84, yt: 1.21, w: 0.67, wt: 0.5, rt: 0.12 },
        { x: 0.1, yb: 0.81, yc: 0.83, yt: 1.18, w: 0.69, wt: 0.51, rt: 0.12 },
        { x: 0.5, yb: 0.79, yc: 0.81, yt: 1.03, w: 0.7, wt: 0.56, rt: 0.1 },
        { x: 0.92, yb: 0.76, yc: 0.78, yt: 0.79, w: 0.69, wt: 0.62, rt: 0.05 },
      ],
      vitre: regleVitres({ pareBrise: [0.2, 0.97], av: 0.72, ar: -0.6, montants: [], lunette: [-1.6, -0.95] }),
    }, peinture(k2)); // ✍️ le toit noir de la NSX
    // Les phares « bijoux » : 4 petites lampes en ligne et un trait de lumière, dans un bloc sombre ; le nez noir.
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.4, 0.2, [[0.1, -0.04, 0.06, 0.06], [0.03, -0.01, 0.06, 0.06], [-0.04, 0.02, 0.06, 0.06], [-0.11, 0.05, 0.06, 0.06], [0, -0.08, 0.36, 0.018]]), c, 1.95, cote * 0.6, 0.004);
      bloc.rotateY(cote * 0.35);
      caisse.add(bloc);
      grille(caisse, c, true, 0.25, cote * 0.42, 0.15, 0.3, M.plastique);
      patchFlanc(caisse, c, -0.9, -0.35, 0.36, 0.62, new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 }), cote, 0.008, (u, v) => v * 0.18); // la grande prise d'air (moteur au milieu)
    }
    grille(caisse, c, true, 0.32, 0, 0.12, 0.55, peinture(k2));
    optiqueAuBout(caisse, c, false, 0.66, 0, 0.045, 1.6, [[0, 0, 0.016, 1.56]], "feu"); // la barre de feux sur toute la largeur
    lettres(caisse, c, false, 0.58, 0, "NSX", 0.3, 0.07);
    grille(caisse, c, false, 0.38, 0, 0.16, 1.1, M.plastique);
    for (const z of [-0.16, -0.05, 0.05, 0.16]) echappement(caisse, c.xMin - 0.04, 0.36, z, 0.04);
    for (const cote of [-1, 1]) ligneFlanc(caisse, c, [[1.9, 0.2], [0.5, 0.17], [-0.9, 0.17], [-1.9, 0.22]], 0.018, M.plastique, cote);
    retros(caisse, 0.75, 0.86, 0.66, 0.96, peinture(k2), 0.9);
    portiere(caisse, c, 0.78, -0.4, 0.28, 0.8);
    const roues = quatreRoues(g, R, 0.82, { style: "doubles", etrier: [0.85, 0.1, 0.1] });
    return voiture(g, caisse, roues, 1.05);
  }

  // ---------------------------------------------------------------- 🇫🇷 Peugeot 508 (4,75 m × 1,86 m × 1,40 m)
  function suv(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.445, r: 0.34, l: 0.23, j: 0.24 }, { x: -1.345, r: 0.34, l: 0.23, j: 0.24 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.37, yb: 0.32, yc: 0.88, yt: 0.92, w: 0.84, wl: 0.78, n: 3.5 },
        { x: -2.25, yb: 0.25, yc: 0.95, yt: 1.01, w: 0.9, wl: 0.84, n: 3.5 },
        { x: -1.8, yb: 0.18, yc: 0.98, yt: 1.0, w: 0.92, wl: 0.86, n: 3 },
        { x: -1.35, yb: 0.17, yc: 0.97, yt: 0.98, w: 0.93, wl: 0.87, n: 3 },
        { x: -0.5, yb: 0.16, yc: 0.95, yt: 0.96, w: 0.93, wl: 0.87, n: 3 },
        { x: 0.4, yb: 0.16, yc: 0.93, yt: 0.94, w: 0.93, wl: 0.87, n: 3 },
        { x: 0.95, yb: 0.16, yc: 0.91, yt: 0.9, w: 0.93, wl: 0.87, n: 3 },
        { x: 1.45, yb: 0.17, yc: 0.87, yt: 0.84, w: 0.93, wl: 0.87, n: 3.2 },
        { x: 1.95, yb: 0.18, yc: 0.8, yt: 0.76, w: 0.9, wl: 0.85, n: 3 },
        { x: 2.25, yb: 0.2, yc: 0.68, yt: 0.66, w: 0.84, wl: 0.8, n: 2.8 },
        { x: 2.37, yb: 0.26, yc: 0.55, yt: 0.55, w: 0.72, wl: 0.68, n: 2.4 },
      ],
      arches: arches(R, 0.8),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.1, yb: 0.95, yc: 0.97, yt: 0.99, w: 0.6, wt: 0.48, rt: 0.08 },
        { x: -1.8, yb: 0.95, yc: 0.97, yt: 1.08, w: 0.66, wt: 0.5, rt: 0.1 },
        { x: -1.3, yb: 0.94, yc: 0.96, yt: 1.25, w: 0.72, wt: 0.52, rt: 0.12 },
        { x: -0.8, yb: 0.93, yc: 0.95, yt: 1.37, w: 0.75, wt: 0.55, rt: 0.12 },
        { x: -0.3, yb: 0.92, yc: 0.94, yt: 1.4, w: 0.76, wt: 0.56, rt: 0.12 },
        { x: 0.2, yb: 0.91, yc: 0.93, yt: 1.36, w: 0.77, wt: 0.57, rt: 0.12 },
        { x: 0.6, yb: 0.9, yc: 0.92, yt: 1.18, w: 0.78, wt: 0.6, rt: 0.1 },
        { x: 1.02, yb: 0.88, yc: 0.9, yt: 0.91, w: 0.78, wt: 0.7, rt: 0.05 },
      ],
      vitre: regleVitres({ pareBrise: [0.35, 1.08], av: 0.82, ar: -1.45, montants: [-0.28], lunette: [-2.0, -1.0] }),
    }, peinture(k1));
    // Les phares fins dans leur bloc, et les « CROCS » : les deux traits de lumière verticaux qui descendent (la signature).
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.4, 0.17, [[0, -0.05, 0.36, 0.02], [0.05, 0.03, 0.09, 0.07], [-0.07, 0.03, 0.09, 0.07]]), c, 2.2, cote * 0.64, 0.004);
      bloc.rotateY(cote * 0.25);
      caisse.add(bloc);
      optiqueAuBout(caisse, c, true, 0.4, cote * 0.6, 0.26, 0.035, [[0, 0, 0.24, 0.016]]);
      // les feux arrière en 3 « griffes », dans un bandeau noir brillant
      for (let i = 0; i < 3; i++) {
        const griffe = optiqueAuBout(caisse, c, false, 0.8 - i * 0.055, cote * 0.55, 0.026, 0.24, [[0, 0, 0.012, 0.22]], "feu");
        griffe.rotation.x = cote * 0.3;
      }
      ligneFlanc(caisse, c, [[2.0, 0.24], [0.5, 0.2], [-0.9, 0.2], [-2.1, 0.26]], 0.022, M.plastique, cote); // le bas de caisse
      ligneFlanc(caisse, c, [[1.0, 0.935], [-0.3, 0.945], [-1.4, 0.955]], 0.008, M.chrome, cote); // le jonc chromé sous les vitres
    }
    auBout(caisse, c, false, 0.78, 0, 0.13, 0.6, M.noir, 0.012);
    lettres(caisse, c, false, 0.78, 0, "PEUGEOT", 0.5, 0.06);
    grille(caisse, c, true, 0.4, 0, 0.24, 0.85, M.chrome); // la calandre
    grille(caisse, c, true, 0.24, 0, 0.08, 1.2, M.plastique);
    auBout(caisse, c, false, 0.33, 0, 0.1, 1.2, M.plastique, 0.03);
    retros(caisse, 0.85, 0.98, 0.76, 0.93, M.noir, 1);
    portiere(caisse, c, 0.88, -0.3, 0.28, 0.92);
    portiere(caisse, c, -0.3, -1.4, 0.28, 0.92);
    const roues = quatreRoues(g, R, 0.8, { style: "doubles", metal: peinture([0.22, 0.22, 0.24]) });
    return voiture(g, caisse, roues, 1.4);
  }

  // ---------------------------------------------------------------- 🇩🇪 Mercedes Vito (5,14 m × 1,93 m × 1,91 m)
  function camionnette(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.62, r: 0.34, l: 0.23, j: 0.21 }, { x: -1.58, r: 0.34, l: 0.23, j: 0.21 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.57, yb: 0.32, yc: 1.08, yt: 1.1, w: 0.92, wl: 0.88, n: 6 },
        { x: -2.5, yb: 0.27, yc: 1.12, yt: 1.12, w: 0.96, wl: 0.91, n: 6 },
        { x: 1.3, yb: 0.27, yc: 1.12, yt: 1.12, w: 0.965, wl: 0.92, n: 6 },
        { x: 1.65, yb: 0.27, yc: 1.1, yt: 1.08, w: 0.955, wl: 0.91, n: 5 },
        { x: 2.0, yb: 0.28, yc: 1.0, yt: 0.98, w: 0.93, wl: 0.89, n: 4 },
        { x: 2.35, yb: 0.3, yc: 0.88, yt: 0.86, w: 0.88, wl: 0.85, n: 3.5 },
        { x: 2.52, yb: 0.34, yc: 0.72, yt: 0.7, w: 0.8, wl: 0.77, n: 3 },
        { x: 2.57, yb: 0.4, yc: 0.6, yt: 0.6, w: 0.7, wl: 0.68, n: 2.6 },
      ],
      arches: arches(R, 0.82),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.57, yb: 1.08, yc: 1.1, yt: 1.86, w: 0.92, wt: 0.84, rt: 0.12 },
        { x: -2.45, yb: 1.08, yc: 1.1, yt: 1.9, w: 0.94, wt: 0.85, rt: 0.14 },
        { x: 0.6, yb: 1.08, yc: 1.1, yt: 1.91, w: 0.94, wt: 0.85, rt: 0.14 },
        { x: 0.95, yb: 1.08, yc: 1.1, yt: 1.86, w: 0.94, wt: 0.85, rt: 0.14 },
        { x: 1.3, yb: 1.08, yc: 1.1, yt: 1.5, w: 0.93, wt: 0.84, rt: 0.12 },
        { x: 1.66, yb: 1.08, yc: 1.1, yt: 1.12, w: 0.92, wt: 0.86, rt: 0.06 },
      ],
      vitre: regleVitres({ pareBrise: [0.9, 1.72], av: 1.5, ar: -2.4, montants: [0.72, -0.5, -1.55], pilier: 0.12 }),
    }, peinture(k1));
    // La vitre arrière (sur le hayon) et les grands feux verticaux de chaque côté.
    caisse.add(boite(0.02, 0.5, 1.4, M.vitre, -2.585, 1.5, 0));
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, false, 1.25, cote * 0.8, 0.55, 0.13, [[0.12, 0, 0.14, 0.08], [-0.12, 0, 0.14, 0.08]], "feu");
      const bloc = surLeDessus(optique(0.36, 0.34, [[0.06, 0.04, 0.12, 0.12], [-0.08, 0.04, 0.12, 0.12], [0, -0.13, 0.32, 0.02]]), c, 2.35, cote * 0.6, 0.004);
      bloc.rotateY(cote * 0.15);
      caisse.add(bloc);
      surLeFlanc(caisse, c, -0.95, 1.06, cote, 1.25, 0.02, M.noir, 0.012); // le rail de la porte coulissante
    }
    // La calandre : la grille, 3 lamelles chromées et l'étoile dans son cercle, au milieu.
    const calandre = surLeDessus(plat(0.3, 0.85, M.noir, 0.015), c, 2.46, 0, 0.002);
    caisse.add(calandre);
    for (let i = 0; i < 3; i++) caisse.add(surLeDessus(plat(0.025, 0.82, M.chrome, 0.015), c, 2.4 + i * 0.07, 0, 0.012));
    const etoile = new THREE.Group();
    etoile.add(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 28), M.chrome));
    for (let k = 0; k < 3; k++) {
      const branche = boite(0.014, 0.08, 0.01, M.chrome, 0, 0, 0);
      branche.geometry.translate(0, 0.04, 0);
      branche.rotation.z = (k * Math.PI * 2) / 3;
      etoile.add(branche);
    }
    surLeDessus(etoile, c, 2.47, 0, 0.03);
    etoile.rotateX(Math.PI / 2);
    caisse.add(etoile);
    lettres(caisse, c, false, 1.0, 0.45, "VITO", 0.28, 0.06);
    auBout(caisse, c, true, 0.45, 0, 0.18, 1.3, M.plastique, 0.04);
    auBout(caisse, c, false, 0.45, 0, 0.22, 1.85, M.plastique, 0.05);
    retros(caisse, 1.45, 1.18, 0.9, 0.96, M.plastique, 1.35);
    portiere(caisse, c, 1.5, 0.72, 0.4, 1.06, M.plastique);
    portiere(caisse, c, 0.62, -0.62, 0.4, 1.06, M.plastique);
    const roues = quatreRoues(g, R, 0.82, { style: "fins", metal: M.jante, etrier: [0.25, 0.25, 0.27] });
    return voiture(g, caisse, roues, 2.1);
  }

  // ---------------------------------------------------------------- 🇯🇵 Kawasaki Ninja
  function moto(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const vert = peinture(k1), noir = peinture(k2);
    // Le carénage avant (pointu, avec la bulle fumée), le réservoir, la coque arrière qui remonte : 3 petites coques.
    coque(caisse, {
      cles: [
        { x: 0.3, yb: 0.55, yc: 0.95, yt: 1.02, w: 0.2, wb: 0.12, n: 2.2 },
        { x: 0.6, yb: 0.5, yc: 1.0, yt: 1.12, w: 0.2, wb: 0.12, n: 2.2 },
        { x: 0.9, yb: 0.56, yc: 0.94, yt: 1.02, w: 0.17, wb: 0.1, n: 2.2 },
        { x: 1.12, yb: 0.7, yc: 0.82, yt: 0.86, w: 0.08, wb: 0.05, n: 2 },
      ],
      vitre: (ctr, n) => ctr[1] > 0.97 && n[1] > 0.4 && ctr[0] < 0.95, // la bulle, sur le dessus
    }, vert);
    coque(caisse, {
      cles: [
        { x: -0.2, yb: 0.82, yc: 0.95, yt: 1.02, w: 0.13, n: 2.2 },
        { x: 0.1, yb: 0.8, yc: 1.02, yt: 1.12, w: 0.17, n: 2.2 },
        { x: 0.38, yb: 0.82, yc: 1.0, yt: 1.08, w: 0.15, n: 2.2 },
      ],
    }, vert);
    coque(caisse, {
      cles: [
        { x: -1.0, yb: 1.08, yc: 1.13, yt: 1.15, w: 0.05, n: 2 },
        { x: -0.75, yb: 0.98, yc: 1.06, yt: 1.08, w: 0.1, n: 2.2 },
        { x: -0.45, yb: 0.88, yc: 0.98, yt: 0.99, w: 0.13, n: 2.4 },
        { x: -0.25, yb: 0.85, yc: 0.95, yt: 0.96, w: 0.13, n: 2.4 },
      ],
    }, vert);
    caisse.add(boite(0.42, 0.06, 0.24, M.siege, -0.38, 1.0, 0)); // la selle
    // Les phares (2 yeux en amande), les clignotants, le feu arrière, les bandes noires et blanches.
    for (const cote of [-1, 1]) {
      const oeil = boite(0.14, 0.04, 0.07, M.phare, 1.0, 0.86, cote * 0.08);
      oeil.rotation.set(cote * 0.5, cote * 0.3, -0.5);
      caisse.add(oeil);
      caisse.add(boite(0.5, 0.05, 0.01, noir, 0.62, 0.72, cote * 0.205));
      caisse.add(boite(0.36, 0.025, 0.01, peinture([0.95, 0.95, 0.95]), 0.6, 0.79, cote * 0.205));
    }
    caisse.add(boite(0.03, 0.04, 0.1, M.feu, -1.0, 1.1, 0));
    // Le moteur, le cadre (en aluminium), l'échappement court, la chaîne.
    caisse.add(boite(0.45, 0.32, 0.32, M.noir, 0.05, 0.5, 0));
    caisse.add(boite(0.28, 0.18, 0.28, M.disque, 0.1, 0.72, 0));
    for (const cote of [-1, 1]) caisse.add(tube([0.62, 0.98, cote * 0.12], [-0.25, 0.72, cote * 0.12], 0.035, M.disque));
    const pot = cylindre(0.075, 0.42, peinture([0.2, 0.2, 0.22]), 14);
    pot.rotation.z = Math.PI / 2 - 0.3;
    pot.position.set(-0.45, 0.46, 0.18);
    caisse.add(pot);
    caisse.add(tube([-0.86, 0.31, -0.1], [0.05, 0.38, -0.1], 0.012, M.noir)); // la chaîne
    // La fourche dorée (à l'envers, comme sur les motos de course), le bras oscillant, les bracelets, les rétros.
    const or = peinture([0.85, 0.62, 0.12]);
    for (const z of [-0.08, 0.08]) {
      g.add(tube([0.86, 0.31, z], [0.75, 0.62, z], 0.035, M.chrome));
      caisse.add(tube([0.75, 0.62, z], [0.66, 1.0, z], 0.04, or));
    }
    for (const z of [-0.11, 0.11]) g.add(tube([-0.86, 0.31, z], [-0.05, 0.48, z], 0.03, M.disque));
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.64, 1.0, cote * 0.08], [0.6, 0.98, cote * 0.24], 0.016, M.noir));
      caisse.add(tube([0.86, 1.04, cote * 0.18], [0.84, 1.1, cote * 0.26], 0.008, M.noir));
      caisse.add(boite(0.05, 0.05, 0.09, noir, 0.83, 1.12, cote * 0.28));
    }
    // Le pilote, penché sur le réservoir, avec un casque intégral vert.
    const pilote = personnage();
    pilote.g.scale.setScalar(0.85);
    pilote.g.position.set(-0.42, 0.05, 0);
    pilote.g.rotation.z = -0.55;
    for (const j of pilote.jambes) j.rotation.z = 1.2;
    for (const b of pilote.bras) b.rotation.z = 1.35;
    pilote.casquette.visible = pilote.visiere.visible = false;
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), vert);
    casque.position.y = 1.95;
    pilote.g.add(casque);
    pilote.g.add(boite(0.12, 0.1, 0.32, M.vitreFumee, 0.18, 1.94, 0));
    caisse.add(pilote.g);
    // Les roues de moto : 17 pouces, 3 branches, 2 disques devant.
    const roues = [];
    for (const [x, avant, l] of [[0.86, true, 0.12], [-0.86, false, 0.18]]) {
      const w = Circuit.Roues.fabriquer({ rayon: 0.31, largeur: l, jante: 0.22, style: "moto", metal: noir, etrier: avant ? [0.85, 0.62, 0.12] : [0.2, 0.2, 0.22], cote: 1 });
      w.pivot.position.set(x, 0.31, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant }));
    }
    return voiture(g, caisse, roues, 1.5);
  }

  // ---------------------------------------------------------------- étape 55 : les voitures de tous les jours
  // La Peugeot 208 (la Rouge), la Renault Clio (la citadine), le taxi Toyota Corolla et la voiture de police sont
  // fabriquées par le même « gabarit » : une berline moderne dont on donne les mesures (longueur, largeur, hauteur,
  // empattement…), et la forme de l'arrière (« hayon » : l'arrière tombe presque droit ; « coffre » : 3 volumes).
  // Puis chaque voiture ajoute sa signature (ses phares, ses feux, sa calandre, son nom).

  // Une plaque d'immatriculation française : blanche, avec la bande bleue de l'Europe à gauche.
  function plaque(caisse, c, avant, y, texte) {
    const toile = document.createElement("canvas");
    toile.width = 256;
    toile.height = 56;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = "#f4f4f2";
    ctx.fillRect(0, 0, 256, 56);
    ctx.fillStyle = "#1d3f9a";
    ctx.fillRect(0, 0, 26, 56);
    ctx.fillRect(230, 0, 26, 56);
    ctx.fillStyle = "#ffd21a";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("F", 13, 46);
    ctx.fillStyle = "#111";
    ctx.font = "bold 34px 'Arial Narrow', Arial, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 128, 30, 196);
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, 253, 53);
    const t = new THREE.CanvasTexture(toile);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.11), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }));
    m.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    m.position.set(avant ? c.xMax + 0.012 : c.xMin - 0.012, y, 0);
    caisse.add(m);
    return m;
  }
  // Des lettres sur le flanc (POLICE…), qui se lisent de dehors.
  function lettresFlanc(caisse, c, x, y, cote, texte, large, haut, couleur) {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 96;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = couleur;
    ctx.font = "bold 78px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 256, 52, 500);
    const t = new THREE.CanvasTexture(toile);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(large, haut), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.3, roughness: 0.4 }));
    m.rotation.y = cote > 0 ? 0 : Math.PI;
    m.position.set(x, y, cote * (flancZ(c, x, y) + 0.012));
    caisse.add(m);
    return m;
  }

  // Le gabarit. o = { L, W (largeur), xAv, xAr (les essieux), r (le rayon des roues), hCapot, hCeinture, hToit,
  //                   hNez, arriere: "hayon" ou "coffre", couleur2Toit, plaque, style (des jantes) }
  function berline(o, k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L2 = o.L / 2, W2 = o.W / 2, hC = o.hCeinture, hT = o.hToit, hayon = o.arriere === "hayon";
    const R = [{ x: o.xAv, r: o.r, l: 0.22, j: o.r * 0.72 }, { x: o.xAr, r: o.r, l: 0.22, j: o.r * 0.72 }];
    const cles = [
      { x: -L2, yb: 0.36, yc: hC - 0.1, yt: hC - 0.08, w: W2 - 0.12, wl: W2 - 0.16, n: 3 },
      { x: -L2 + 0.12, yb: 0.24, yc: hC + (hayon ? 0 : 0.04), yt: hC + (hayon ? 0.02 : 0.06), w: W2 - 0.03, wl: W2 - 0.08, n: 3 },
      { x: o.xAr, yb: 0.2, yc: hC, yt: hC + 0.02, w: W2, wl: W2 - 0.05, n: 3 },
      { x: (o.xAv + o.xAr) / 2, yb: 0.19, yc: hC - 0.03, yt: hC, w: W2 - 0.01, wl: W2 - 0.06, n: 3 },
      { x: o.xAv, yb: 0.2, yc: o.hCapot + 0.03, yt: o.hCapot - 0.02, w: W2 - 0.01, wl: W2 - 0.06, n: 3.2 },
      { x: o.xAv + 0.45, yb: 0.22, yc: o.hCapot - 0.08, yt: o.hCapot - 0.1, w: W2 - 0.04, wl: W2 - 0.08, n: 3 },
      { x: L2 - 0.12, yb: 0.26, yc: o.hNez, yt: o.hNez - 0.02, w: W2 - 0.11, wl: W2 - 0.14, n: 2.8 },
      { x: L2, yb: 0.32, yc: o.hNez - 0.14, yt: o.hNez - 0.15, w: W2 - 0.24, wl: W2 - 0.26, n: 2.4 },
    ];
    const c = coque(caisse, { cles, arches: arches(R, W2 - 0.12) }, peinture(k1));
    // La cabine : le pare-brise part du bas du capot, le toit est presque plat, et l'arrière dépend du type.
    const xPB = o.xAv - 0.18, xToitAv = xPB - 0.85, xFin = hayon ? -L2 + 0.14 : o.xAr + 0.05;
    const xToitAr = hayon ? -L2 + 0.42 : o.xAr + 0.75;
    const bas = (x) => c.tranche(x).yt - 0.005;
    const cab = [
      { x: xFin, yb: bas(xFin) - 0.02, yc: bas(xFin), yt: bas(xFin) + (hayon ? 0.08 : 0.02), w: W2 - 0.14, wt: W2 - 0.24, rt: 0.08 },
      { x: xToitAr, yb: hC - 0.02, yc: hC, yt: hT - 0.05, w: W2 - 0.09, wt: W2 - 0.3, rt: 0.12 },
      { x: (xToitAr + xToitAv) / 2, yb: hC - 0.02, yc: hC, yt: hT, w: W2 - 0.07, wt: W2 - 0.27, rt: 0.13 },
      { x: xToitAv, yb: hC - 0.03, yc: hC - 0.01, yt: hT - 0.02, w: W2 - 0.07, wt: W2 - 0.27, rt: 0.13 },
      { x: xPB, yb: bas(xPB) - 0.02, yc: bas(xPB), yt: bas(xPB) + 0.01, w: W2 - 0.1, wt: W2 - 0.18, rt: 0.06 },
    ];
    const lunette = hayon ? [xFin - 0.05, xToitAr - 0.05] : [xFin + 0.15, xToitAr - 0.05];
    coque(caisse, {
      cles: cab,
      vitre: regleVitres({ pareBrise: [xToitAv + 0.06, xPB + 0.1], lunette, av: xPB - 0.12, ar: hayon ? xToitAr - 0.1 : o.xAr + 0.3, montants: [(o.xAv + o.xAr) / 2 - 0.25], pilier: 0.08 }),
    }, o.couleur2Toit ? peinture(k2) : peinture(k1));
    // Les détails communs : bas de caisse, pare-chocs, poignées, rétroviseurs, portières, plaques, antenne.
    for (const cote of [-1, 1]) {
      ligneFlanc(caisse, c, [[L2 - 0.5, 0.22], [o.xAv - 0.4, 0.2], [o.xAr + 0.4, 0.2], [-L2 + 0.4, 0.23]], 0.02, M.plastique, cote);
      ligneFlanc(caisse, c, [[o.xAv + 0.1, o.hCapot - 0.05], [0, hC - 0.08], [o.xAr - 0.25, hC - 0.06]], 0.006, peinture(k1.map((q) => q * 0.82)), cote); // le pli du flanc
    }
    grille(caisse, c, true, 0.27, 0, 0.12, W2 * 1.3, M.plastique); // l'entrée d'air basse
    auBout(caisse, c, false, 0.32, 0, 0.12, o.W - 0.45, M.plastique, 0.025);
    plaque(caisse, c, true, 0.4, o.plaque || "AB-123-CD");
    plaque(caisse, c, false, 0.52, o.plaque || "AB-123-CD");
    retros(caisse, xPB - 0.12, hC + 0.03, W2 - 0.12, W2 - 0.01, peinture(k1), 0.85);
    const milieu = (o.xAv + o.xAr) / 2 - 0.25;
    portiere(caisse, c, xPB, milieu, 0.26, hC - 0.04);
    if (!o.deuxPortes) portiere(caisse, c, milieu - 0.02, o.xAr + 0.35, 0.26, hC - 0.04);
    caisse.add(boite(0.16, 0.05, 0.035, M.noir, xToitAr + 0.15, hT + 0.02, 0)); // l'antenne « aileron de requin »
    const roues = quatreRoues(g, R, W2 - 0.12, { style: o.style || "doubles", metal: o.jantes || M.jante });
    return { g, caisse, c, roues, ressorts: [], yCapot: hT - 0.1, hayon, xPB, L2, W2 };
  }

  // 🇫🇷 Peugeot 208 (4,06 m × 1,75 m × 1,43 m) : la Rouge. Les « crocs » de lumière, les feux en 3 griffes.
  function classique(k1, k2) {
    const b = berline({ L: 4.06, W: 1.75, xAv: 1.3, xAr: -1.24, r: 0.31, hCapot: 0.86, hCeinture: 0.95, hToit: 1.43, hNez: 0.66, arriere: "hayon", plaque: "GT-208-RG", couleur2Toit: true }, k1, [0.08, 0.08, 0.09]);
    const { caisse, c } = b;
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.18, 0.36, [[0.05, 0, 0.018, 0.32], [-0.03, cote * 0.07, 0.08, 0.08], [-0.03, -cote * 0.05, 0.08, 0.08]]), c, 1.84, cote * 0.56, 0.004);
      bloc.rotateY(-cote * 0.35);
      caisse.add(bloc);
      optiqueAuBout(caisse, c, true, 0.36, cote * 0.6, 0.24, 0.03, [[0, 0, 0.22, 0.014]]); // le croc
      for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.86 - i * 0.05, cote * 0.58, 0.022, 0.2, [[0, 0, 0.01, 0.18]], "feu");
    }
    grille(caisse, c, true, 0.5, 0, 0.14, 0.75, M.chrome);
    lettres(caisse, c, false, 0.72, 0, "PEUGEOT", 0.42, 0.05);
    return voiture(b.g, caisse, b.roues, b.yCapot);
  }

  // 🇫🇷 Renault Clio (4,05 m × 1,80 m × 1,44 m) : la citadine. Les phares en « C », la calandre au losange.
  function citadine(k1, k2) {
    const b = berline({ L: 4.05, W: 1.8, xAv: 1.3, xAr: -1.28, r: 0.31, hCapot: 0.84, hCeinture: 0.94, hToit: 1.44, hNez: 0.64, arriere: "hayon", plaque: "CL-150-IO", couleur2Toit: true }, k1, k2);
    const { caisse, c } = b;
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.18, 0.36, [[0, cote * 0.07, 0.09, 0.09], [0, -cote * 0.05, 0.09, 0.09], [0.06, 0, 0.016, 0.32]]), c, 1.84, cote * 0.56, 0.004);
      bloc.rotateY(-cote * 0.35);
      caisse.add(bloc);
      optiqueAuBout(caisse, c, true, 0.36, cote * 0.62, 0.2, 0.06, [[0, -cote * 0.01, 0.18, 0.012], [0.08, 0.012, 0.012, 0.04]]); // le « C » de lumière
      optiqueAuBout(caisse, c, false, 0.84, cote * 0.58, 0.12, 0.22, [[0, 0, 0.1, 0.012], [0.03, 0, 0.012, 0.18]], "feu");
    }
    grille(caisse, c, true, 0.5, 0, 0.12, 0.6, M.plastique);
    const losange = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 4), M.chrome);
    losange.rotation.y = Math.PI / 2;
    losange.scale.set(1, 1.4, 1);
    losange.position.set(c.xMax + 0.02, 0.52, 0);
    caisse.add(losange);
    lettres(caisse, c, false, 0.72, 0, "CLIO", 0.25, 0.05);
    return voiture(b.g, caisse, b.roues, b.yCapot);
  }

  // 🇯🇵 Le taxi : une Toyota Corolla (4,63 m × 1,78 m × 1,44 m), avec son lumineux TAXI PARISIEN sur le toit.
  function taxi(k1, k2) {
    const b = berline({ L: 4.63, W: 1.78, xAv: 1.4, xAr: -1.3, r: 0.32, hCapot: 0.86, hCeinture: 0.96, hToit: 1.44, hNez: 0.66, arriere: "coffre", plaque: "TX-750-PA" }, k1, k2);
    const { caisse, c } = b;
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.18, 0.38, [[0.05, 0, 0.016, 0.34], [-0.03, cote * 0.08, 0.08, 0.08], [-0.03, -cote * 0.05, 0.08, 0.08]]), c, 2.13, cote * 0.56, 0.004);
      bloc.rotateY(-cote * 0.35);
      caisse.add(bloc);
      optiqueAuBout(caisse, c, false, 0.84, cote * 0.55, 0.1, 0.32, [[0, 0, 0.06, 0.28]], "feu");
    }
    grille(caisse, c, true, 0.45, 0, 0.1, 0.7, M.plastique);
    lettres(caisse, c, false, 0.72, 0, "TOYOTA", 0.36, 0.05);
    const enseigne = new THREE.Group();
    enseigne.add(boite(0.24, 0.12, 0.6, M.phare, 0, 0, 0));
    for (const z of [-1, 1]) {
      const mot = Circuit.Modeles.outils.etiquette("TAXI PARISIEN", "#f7f3e2", "#1b1b1b", 0.58, 0.11);
      mot.position.x = z * 0.125;
      mot.rotation.y = z > 0 ? Math.PI / 2 : -Math.PI / 2;
      enseigne.add(mot);
    }
    enseigne.position.set(-0.2, 1.51, 0);
    enseigne.rotation.y = Math.PI / 2;
    caisse.add(enseigne);
    return voiture(b.g, caisse, b.roues, b.yCapot);
  }

  // 🇫🇷 La voiture de police : une Peugeot 308 (4,37 m × 1,85 m × 1,46 m), blanche, avec les bandes bleues et rouges
  // de la Police nationale, POLICE écrit sur les flancs et la rampe de gyrophares sur le toit.
  function police(k1, k2) {
    const b = berline({ L: 4.37, W: 1.85, xAv: 1.38, xAr: -1.3, r: 0.32, hCapot: 0.86, hCeinture: 0.96, hToit: 1.46, hNez: 0.66, arriere: "hayon", plaque: "PN-308-75" }, [0.95, 0.95, 0.95], k2);
    const { caisse, c } = b;
    const bleu = peinture([0.05, 0.15, 0.45]), rouge = peinture([0.75, 0.05, 0.05]);
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.18, 0.38, [[0.05, 0, 0.018, 0.34], [-0.03, cote * 0.08, 0.08, 0.08], [-0.03, -cote * 0.05, 0.08, 0.08]]), c, 2.0, cote * 0.58, 0.004);
      bloc.rotateY(-cote * 0.35);
      caisse.add(bloc);
      for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.86 - i * 0.05, cote * 0.6, 0.022, 0.22, [[0, 0, 0.01, 0.2]], "feu");
      // les bandes : bleu foncé en bas des portières, et un fin trait rouge au-dessus
      patchFlanc(caisse, c, -1.6, 1.7, 0.36, 0.56, bleu, cote, 0.004);
      patchFlanc(caisse, c, -1.6, 1.7, 0.57, 0.6, rouge, cote, 0.004);
      lettresFlanc(caisse, c, 0.0, 0.46, cote, "POLICE", 0.9, 0.17, "#ffffff");
    }
    grille(caisse, c, true, 0.5, 0, 0.12, 0.7, M.chrome);
    lettres(caisse, c, false, 0.72, 0, "POLICE", 0.4, 0.06, "#1d3f9a");
    // La rampe de gyrophares : un socle noir, une lampe bleue et une rouge (affichage/scene3d.js les fait clignoter).
    const gyro = {
      rouge: new THREE.MeshStandardMaterial({ color: 0x661010, emissive: 0xff1a1a, emissiveIntensity: 0.05, roughness: 0.2, transparent: true, opacity: 0.9 }),
      bleu: new THREE.MeshStandardMaterial({ color: 0x101a66, emissive: 0x1a5cff, emissiveIntensity: 0.05, roughness: 0.2, transparent: true, opacity: 0.9 }),
    };
    caisse.add(boite(0.26, 0.05, 1.2, M.noir, -0.2, 1.48, 0));
    caisse.add(boite(0.22, 0.09, 0.5, gyro.bleu, -0.2, 1.55, -0.3));
    caisse.add(boite(0.22, 0.09, 0.5, gyro.rouge, -0.2, 1.55, 0.3));
    return Object.assign(voiture(b.g, caisse, b.roues, b.yCapot), { gyro });
  }

  Circuit.Modeles.ajouter({ chiron, porsche911, aventador, basse, suv, camionnette, moto, classique, citadine, taxi, police });
  return {};
})();
