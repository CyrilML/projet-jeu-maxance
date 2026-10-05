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
  // Ce que toutes les voitures renvoient : le groupe, la caisse (sur les ressorts), les roues et la hauteur de l'œil.
  function voiture(g, caisse, roues, yCapot) {
    return { g, caisse, roues, yCapot, ressorts: [] };
  }

  // ---------------------------------------------------------------- 🇫🇷 Bugatti Chiron (4,54 m × 2,04 m × 1,21 m)
  function chiron(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.32, r: 0.345, l: 0.29, j: 0.255 }, { x: -1.39, r: 0.355, l: 0.34, j: 0.265 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.27, yb: 0.3, yc: 0.62, yt: 0.7, w: 0.8, n: 3 },
        { x: -2.15, yb: 0.2, yc: 0.8, yt: 0.86, w: 0.96, n: 3 },
        { x: -1.4, yb: 0.13, yc: 0.93, yt: 0.86, w: 1.02, n: 3.5 },
        { x: -0.8, yb: 0.12, yc: 0.89, yt: 0.86, w: 1.0, n: 3 },
        { x: -0.2, yb: 0.12, yc: 0.85, yt: 0.84, w: 0.98, n: 3 },
        { x: 0.5, yb: 0.12, yc: 0.82, yt: 0.8, w: 0.98, n: 3 },
        { x: 1.0, yb: 0.12, yc: 0.83, yt: 0.73, w: 1.0, n: 3.2 },
        { x: 1.32, yb: 0.13, yc: 0.85, yt: 0.69, w: 1.0, n: 3.5 },
        { x: 1.8, yb: 0.14, yc: 0.7, yt: 0.6, w: 0.95, n: 3 },
        { x: 2.12, yb: 0.16, yc: 0.55, yt: 0.52, w: 0.84, n: 2.6 },
        { x: 2.27, yb: 0.24, yc: 0.42, yt: 0.44, w: 0.6, n: 2.2 },
      ],
      arches: arches(R, 0.85),
    }, peinture(k1));
    // La cabine (le toit est de la couleur 2, comme les Chiron « deux tons »).
    coque(caisse, {
      cles: [
        { x: -1.7, yb: 0.84, yc: 0.86, yt: 0.86, w: 0.5, n: 2.4 },
        { x: -1.5, yb: 0.84, yc: 0.86, yt: 0.92, w: 0.55, n: 2.4 },
        { x: -1.0, yb: 0.83, yc: 0.85, yt: 1.05, w: 0.62, n: 2.4 },
        { x: -0.6, yb: 0.82, yc: 0.84, yt: 1.17, w: 0.66, n: 2.4 },
        { x: -0.2, yb: 0.81, yc: 0.83, yt: 1.21, w: 0.68, n: 2.4 },
        { x: 0.2, yb: 0.8, yc: 0.82, yt: 1.17, w: 0.7, n: 2.4 },
        { x: 0.55, yb: 0.78, yc: 0.8, yt: 1.02, w: 0.72, n: 2.4 },
        { x: 0.85, yb: 0.76, yc: 0.78, yt: 0.79, w: 0.72, n: 2.4 },
      ],
      vitre: regleVitres({ pareBrise: [0.25, 0.9], av: 0.62, ar: -0.75, montants: [] }),
    }, peinture(k2));
    // La calandre en FER À CHEVAL, chromée, avec sa grille noire.
    const fond = cylindre(0.19, 0.03, M.noir, 24);
    fond.rotation.z = Math.PI / 2;
    fond.position.set(c.xMax + 0.01, 0.34, 0);
    caisse.add(fond);
    const fer = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 28, Math.PI * 1.65), M.chrome);
    fer.position.set(c.xMax + 0.025, 0.34, 0);
    fer.rotation.set(0, Math.PI / 2, -Math.PI * 0.32);
    caisse.add(fer);
    // Les phares : 4 lampes carrées de chaque côté, sur la pente du nez.
    for (const cote of [-1, 1]) {
      for (const [dx, dz] of [[0, 0], [-0.1, 0.12], [-0.06, -0.08], [-0.16, 0.04]]) {
        caisse.add(surLeDessus(plat(0.09, 0.09, M.phare, 0.025), c, 2.08 + dx, cote * (0.62 + dz), 0.005));
      }
      caisse.add(surLeDessus(plat(0.42, 0.3, M.noir, 0.012), c, 2.0, cote * 0.64, 0.002)); // le boîtier noir des phares
      auBout(caisse, c, true, 0.3, cote * 0.42, 0.14, 0.3, M.plastique); // les entrées d'air du bouclier
    }
    // La grande ligne en « C » sur chaque flanc, et dedans la partie sombre (couleur 2) avec l'entrée d'air.
    for (const cote of [-1, 1]) {
      const z = cote * (c.tranche(-0.2).w + 0.006);
      const ligne = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.018, 6, 30, Math.PI * 1.3), M.chrome);
      ligne.position.set(-0.2, 0.52, z);
      ligne.rotation.z = Math.PI * 0.35;
      ligne.scale.set(1.15, 0.85, 0.3);
      caisse.add(ligne);
      const creux = new THREE.Mesh(new THREE.CircleGeometry(0.44, 30), peinture(k2));
      creux.position.set(-0.34, 0.52, z);
      creux.scale.set(1.08, 0.82, 1);
      if (cote < 0) creux.rotation.y = Math.PI;
      caisse.add(creux);
      surLeFlanc(caisse, c, -0.5, 0.42, cote, 0.4, 0.18, M.noir, 0.02);
    }
    // L'arête sur le toit, les prises d'air, la barre de feux, le diffuseur, 4 échappements, l'aileron.
    caisse.add(boite(1.4, 0.05, 0.03, peinture(k1), -1.2, 0.98, 0));
    for (const cote of [-1, 1]) caisse.add(surLeDessus(plat(0.5, 0.25, M.noir, 0.05), c, -1.25, cote * 0.5, 0.01));
    auBout(caisse, c, false, 0.6, 0, 0.035, 1.3, M.feu);
    auBout(caisse, c, false, 0.36, 0, 0.16, 1.3, M.plastique, 0.03);
    for (const z of [-0.18, -0.06, 0.06, 0.18]) echappement(caisse, c.xMin - 0.04, 0.42, z, 0.05);
    caisse.add(surLeDessus(plat(0.42, 1.55, peinture(k2), 0.03), c, -2.0, 0, 0.03));
    retros(caisse, 0.62, 0.88, 0.7, 0.98, peinture(k2), 0.9);
    portiere(caisse, c, 0.72, -0.35, 0.3, 0.8, false);
    const roues = quatreRoues(g, R, 0.85, { style: "turbine", etrier: [0.12, 0.28, 0.85], metal: M.jante });
    return voiture(g, caisse, roues, 1.1);
  }

  // ---------------------------------------------------------------- 🇩🇪 Porsche 911 (4,52 m × 1,85 m × 1,30 m)
  function porsche911(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.3, r: 0.34, l: 0.25, j: 0.255 }, { x: -1.15, r: 0.35, l: 0.3, j: 0.265 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.26, yb: 0.32, yc: 0.64, yt: 0.7, w: 0.78, n: 2.5 },
        { x: -2.1, yb: 0.22, yc: 0.8, yt: 0.86, w: 0.9, n: 2.6 },
        { x: -1.6, yb: 0.15, yc: 0.86, yt: 0.9, w: 0.93, n: 3 },
        { x: -1.15, yb: 0.15, yc: 0.87, yt: 0.89, w: 0.93, n: 3.2 },
        { x: -0.6, yb: 0.14, yc: 0.84, yt: 0.88, w: 0.89, n: 3 },
        { x: 0.0, yb: 0.14, yc: 0.82, yt: 0.86, w: 0.88, n: 3 },
        { x: 0.6, yb: 0.14, yc: 0.8, yt: 0.82, w: 0.9, n: 3 },
        { x: 1.0, yb: 0.14, yc: 0.78, yt: 0.7, w: 0.91, n: 3.2 },
        { x: 1.3, yb: 0.15, yc: 0.81, yt: 0.66, w: 0.91, n: 3.4 },
        { x: 1.8, yb: 0.16, yc: 0.7, yt: 0.58, w: 0.88, n: 3 },
        { x: 2.1, yb: 0.18, yc: 0.55, yt: 0.5, w: 0.8, n: 2.5 },
        { x: 2.26, yb: 0.24, yc: 0.42, yt: 0.44, w: 0.6, n: 2.2 },
      ],
      arches: arches(R, 0.79),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.0, yb: 0.84, yc: 0.86, yt: 0.87, w: 0.5, n: 2.3 },
        { x: -1.8, yb: 0.85, yc: 0.87, yt: 0.93, w: 0.55, n: 2.3 },
        { x: -1.3, yb: 0.86, yc: 0.88, yt: 1.06, w: 0.58, n: 2.3 },
        { x: -0.8, yb: 0.86, yc: 0.88, yt: 1.2, w: 0.6, n: 2.3 },
        { x: -0.3, yb: 0.85, yc: 0.87, yt: 1.3, w: 0.62, n: 2.3 },
        { x: 0.1, yb: 0.83, yc: 0.85, yt: 1.26, w: 0.64, n: 2.3 },
        { x: 0.45, yb: 0.81, yc: 0.83, yt: 1.08, w: 0.66, n: 2.3 },
        { x: 0.75, yb: 0.79, yc: 0.81, yt: 0.82, w: 0.66, n: 2.3 },
      ],
      vitre: regleVitres({ pareBrise: [0.22, 0.8], av: 0.62, ar: -1.05, montants: [-0.5], lunette: [-1.6, -0.75] }),
    }, peinture(k1));
    // Les phares RONDS sur le haut des ailes (un anneau, la lampe, et les 4 points de lumière du jour).
    for (const cote of [-1, 1]) {
      const z = cote * 0.6;
      const lampe = new THREE.Group();
      const verre = cylindre(0.13, 0.04, M.phare, 28);
      lampe.add(verre);
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.016, 8, 28), M.noir);
      anneau.rotation.x = Math.PI / 2;
      lampe.add(anneau);
      lampe.scale.setScalar(0.9);
      caisse.add(surLeDessus(lampe, c, 1.98, z, 0.01));
      lampe.rotateZ(-0.35); // (un peu redressé vers l'avant, comme sur la vraie)
      auBout(caisse, c, true, 0.3, cote * 0.36, 0.12, 0.34, M.plastique); // les entrées d'air
      auBout(caisse, c, true, 0.4, cote * 0.5, 0.03, 0.14, M.orange); // le clignotant
    }
    auBout(caisse, c, true, 0.3, 0, 0.1, 0.3, M.plastique);
    // L'arrière : la grille du moteur (lamelles), le becquet, la barre de feux, 2 sorties.
    for (let i = 0; i < 7; i++) caisse.add(surLeDessus(plat(0.025, 0.7, M.noir, 0.01), c, -1.85 - i * 0.045, 0, 0.004));
    caisse.add(surLeDessus(plat(0.22, 1.3, peinture(k1), 0.03), c, -2.08, 0, 0.03));
    auBout(caisse, c, false, 0.58, 0, 0.04, 1.2, M.feu);
    auBout(caisse, c, false, 0.53, 0, 0.012, 1.1, M.feu);
    auBout(caisse, c, false, 0.33, 0, 0.12, 1.15, M.plastique, 0.03);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.3, cote * 0.28, 0.055);
    retros(caisse, 0.62, 0.9, 0.64, 0.9, peinture(k1), 0.9);
    portiere(caisse, c, 0.7, -0.5, 0.28, 0.8);
    const roues = quatreRoues(g, R, 0.79, { style: "fins", etrier: [0.85, 0.1, 0.1] });
    return voiture(g, caisse, roues, 1.2);
  }

  // ---------------------------------------------------------------- 🇮🇹 Lamborghini Aventador (4,78 m × 2,03 m × 1,14 m)
  function aventador(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.4, r: 0.35, l: 0.27, j: 0.255 }, { x: -1.3, r: 0.37, l: 0.36, j: 0.27 }];
    const c = coque(caisse, {
      cles: [
        { x: -2.39, yb: 0.3, yc: 0.66, yt: 0.7, w: 0.82, n: 4 },
        { x: -2.25, yb: 0.2, yc: 0.86, yt: 0.88, w: 0.98, n: 4 },
        { x: -1.3, yb: 0.12, yc: 0.93, yt: 0.9, w: 1.01, n: 4.5 },
        { x: -0.6, yb: 0.11, yc: 0.86, yt: 0.86, w: 0.99, n: 4 },
        { x: 0.2, yb: 0.11, yc: 0.8, yt: 0.8, w: 0.97, n: 4 },
        { x: 0.95, yb: 0.11, yc: 0.8, yt: 0.74, w: 0.99, n: 4 },
        { x: 1.4, yb: 0.12, yc: 0.82, yt: 0.64, w: 1.0, n: 4.5 },
        { x: 1.9, yb: 0.13, yc: 0.56, yt: 0.48, w: 0.95, n: 4 },
        { x: 2.25, yb: 0.15, yc: 0.36, yt: 0.34, w: 0.85, n: 3.5 },
        { x: 2.39, yb: 0.2, yc: 0.27, yt: 0.27, w: 0.7, n: 3 },
      ],
      arches: arches(R, 0.85),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.0, yb: 0.85, yc: 0.87, yt: 0.88, w: 0.4, n: 3 },
        { x: -1.8, yb: 0.85, yc: 0.87, yt: 0.92, w: 0.45, n: 3 },
        { x: -1.2, yb: 0.83, yc: 0.85, yt: 0.98, w: 0.5, n: 3 },
        { x: -0.7, yb: 0.81, yc: 0.83, yt: 1.1, w: 0.56, n: 3 },
        { x: -0.3, yb: 0.8, yc: 0.82, yt: 1.14, w: 0.6, n: 3 },
        { x: 0.1, yb: 0.78, yc: 0.8, yt: 1.11, w: 0.62, n: 3 },
        { x: 0.6, yb: 0.76, yc: 0.78, yt: 0.94, w: 0.64, n: 3 },
        { x: 1.05, yb: 0.73, yc: 0.75, yt: 0.76, w: 0.62, n: 3 },
      ],
      vitre: regleVitres({ pareBrise: [0.15, 1.1], av: 0.85, ar: -0.75, montants: [], lunette: [-1.05, -0.65] }),
    }, peinture(k1));
    // Les phares en « Y » (deux traits de lumière qui se rejoignent), dans un boîtier sombre, sur la pente du capot.
    for (const cote of [-1, 1]) {
      caisse.add(surLeDessus(plat(0.42, 0.26, M.noir, 0.012), c, 2.0, cote * 0.7, 0.002));
      const y1 = surLeDessus(plat(0.38, 0.04, M.phare, 0.02), c, 2.02, cote * 0.72, 0.008);
      y1.rotateY(cote * 0.45);
      caisse.add(y1);
      const y2 = surLeDessus(plat(0.24, 0.04, M.phare, 0.02), c, 2.07, cote * 0.64, 0.008);
      y2.rotateY(-cote * 0.35);
      caisse.add(y2);
      auBout(caisse, c, true, 0.23, cote * 0.42, 0.06, 0.28, M.plastique);
      // les énormes prises d'air sur les flancs, derrière les portières
      const prise = surLeFlanc(caisse, c, -0.75, 0.58, cote, 0.8, 0.26, M.noir, 0.02);
      prise.rotation.z = 0.25;
    }
    for (let i = 0; i < 5; i++) caisse.add(surLeDessus(plat(0.04, 0.8, M.noir, 0.012), c, -1.45 - i * 0.16, 0, 0.004)); // les lamelles du capot moteur
    for (const cote of [-1, 1]) {
      auBout(caisse, c, false, 0.6, cote * 0.55, 0.03, 0.3, M.feu);
      auBout(caisse, c, false, 0.52, cote * 0.62, 0.14, 0.03, M.feu);
    }
    auBout(caisse, c, false, 0.45, 0, 0.25, 1.0, M.noir, 0.03);
    echappement(caisse, c.xMin - 0.04, 0.42, 0, 0.12, 6);
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
        { x: -2.24, yb: 0.3, yc: 0.66, yt: 0.72, w: 0.8, n: 3 },
        { x: -2.1, yb: 0.2, yc: 0.86, yt: 0.94, w: 0.93, n: 3 },
        { x: -1.32, yb: 0.13, yc: 0.9, yt: 0.9, w: 0.97, n: 3.2 },
        { x: -0.6, yb: 0.12, yc: 0.86, yt: 0.86, w: 0.96, n: 3 },
        { x: 0.2, yb: 0.12, yc: 0.82, yt: 0.82, w: 0.95, n: 3 },
        { x: 0.9, yb: 0.12, yc: 0.77, yt: 0.72, w: 0.96, n: 3.2 },
        { x: 1.31, yb: 0.14, yc: 0.79, yt: 0.66, w: 0.96, n: 3.2 },
        { x: 1.8, yb: 0.15, yc: 0.62, yt: 0.55, w: 0.92, n: 3 },
        { x: 2.12, yb: 0.17, yc: 0.48, yt: 0.46, w: 0.82, n: 2.6 },
        { x: 2.24, yb: 0.24, yc: 0.38, yt: 0.38, w: 0.6, n: 2.2 },
      ],
      arches: arches(R, 0.82),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -1.75, yb: 0.85, yc: 0.87, yt: 0.9, w: 0.48, n: 2.4 },
        { x: -1.3, yb: 0.84, yc: 0.86, yt: 0.99, w: 0.55, n: 2.4 },
        { x: -0.8, yb: 0.83, yc: 0.85, yt: 1.13, w: 0.6, n: 2.4 },
        { x: -0.3, yb: 0.82, yc: 0.84, yt: 1.21, w: 0.64, n: 2.4 },
        { x: 0.1, yb: 0.81, yc: 0.83, yt: 1.18, w: 0.66, n: 2.4 },
        { x: 0.5, yb: 0.79, yc: 0.81, yt: 1.03, w: 0.68, n: 2.4 },
        { x: 0.9, yb: 0.76, yc: 0.78, yt: 0.79, w: 0.68, n: 2.4 },
      ],
      vitre: regleVitres({ pareBrise: [0.2, 0.95], av: 0.72, ar: -0.6, montants: [], lunette: [-1.55, -0.95] }),
    }, peinture(k2)); // ✍️ le toit noir de la NSX
    // Les phares « bijoux » : 4 petites lampes en ligne, et un trait de lumière au-dessus ; la barre noire du nez.
    for (const cote of [-1, 1]) {
      for (let i = 0; i < 4; i++) caisse.add(surLeDessus(plat(0.07, 0.07, M.phare, 0.02), c, 2.02 - i * 0.07, cote * (0.5 + i * 0.07), 0.006));
      const trait = surLeDessus(plat(0.34, 0.025, M.phare, 0.015), c, 1.9, cote * 0.68, 0.006);
      trait.rotateY(cote * 0.4);
      caisse.add(trait);
      auBout(caisse, c, true, 0.26, cote * 0.38, 0.16, 0.3, M.plastique);
      surLeFlanc(caisse, c, -0.62, 0.46, cote, 0.55, 0.24, M.noir, 0.02); // la grande prise d'air (moteur au milieu)
    }
    auBout(caisse, c, true, 0.34, 0, 0.05, 0.6, peinture(k2));
    auBout(caisse, c, false, 0.62, 0, 0.03, 1.15, M.feu);
    auBout(caisse, c, false, 0.38, 0, 0.16, 1.1, M.plastique, 0.03);
    for (const z of [-0.16, -0.05, 0.05, 0.16]) echappement(caisse, c.xMin - 0.04, 0.36, z, 0.04);
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
        { x: -2.37, yb: 0.32, yc: 0.8, yt: 0.86, w: 0.82, n: 3 },
        { x: -2.25, yb: 0.25, yc: 0.95, yt: 1.01, w: 0.9, n: 3 },
        { x: -1.8, yb: 0.18, yc: 0.98, yt: 1.0, w: 0.92, n: 3 },
        { x: -1.35, yb: 0.17, yc: 0.97, yt: 0.98, w: 0.93, n: 3 },
        { x: -0.5, yb: 0.16, yc: 0.95, yt: 0.96, w: 0.93, n: 3 },
        { x: 0.4, yb: 0.16, yc: 0.93, yt: 0.94, w: 0.93, n: 3 },
        { x: 0.95, yb: 0.16, yc: 0.91, yt: 0.9, w: 0.93, n: 3 },
        { x: 1.45, yb: 0.17, yc: 0.87, yt: 0.84, w: 0.93, n: 3.2 },
        { x: 1.95, yb: 0.18, yc: 0.8, yt: 0.76, w: 0.9, n: 3 },
        { x: 2.25, yb: 0.2, yc: 0.68, yt: 0.66, w: 0.84, n: 2.8 },
        { x: 2.37, yb: 0.26, yc: 0.52, yt: 0.52, w: 0.7, n: 2.4 },
      ],
      arches: arches(R, 0.8),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.05, yb: 0.95, yc: 0.97, yt: 0.99, w: 0.55, n: 2.5 },
        { x: -1.8, yb: 0.95, yc: 0.97, yt: 1.06, w: 0.6, n: 2.5 },
        { x: -1.3, yb: 0.94, yc: 0.96, yt: 1.22, w: 0.66, n: 2.5 },
        { x: -0.8, yb: 0.93, yc: 0.95, yt: 1.36, w: 0.7, n: 2.5 },
        { x: -0.3, yb: 0.92, yc: 0.94, yt: 1.4, w: 0.72, n: 2.5 },
        { x: 0.2, yb: 0.91, yc: 0.93, yt: 1.36, w: 0.74, n: 2.5 },
        { x: 0.6, yb: 0.9, yc: 0.92, yt: 1.18, w: 0.76, n: 2.5 },
        { x: 1.0, yb: 0.88, yc: 0.9, yt: 0.91, w: 0.78, n: 2.5 },
      ],
      vitre: regleVitres({ pareBrise: [0.35, 1.05], av: 0.82, ar: -1.45, montants: [-0.28], lunette: [-1.95, -1.0] }),
    }, peinture(k1));
    // Les phares fins, et les « CROCS » : les deux lampes verticales qui descendent sous les phares (la signature de la 508).
    for (const cote of [-1, 1]) {
      const phare = surLeDessus(plat(0.36, 0.2, M.noir, 0.015), c, 2.2, cote * 0.64, 0.003);
      phare.rotateY(cote * 0.25);
      caisse.add(phare);
      const led = surLeDessus(plat(0.34, 0.035, M.phare, 0.02), c, 2.24, cote * 0.66, 0.008); // le trait de lumière du jour
      led.rotateY(cote * 0.25);
      caisse.add(led);
      caisse.add(surLeDessus(plat(0.1, 0.1, M.phare, 0.02), c, 2.18, cote * 0.6, 0.008)); // le phare (une lampe ronde)
      auBout(caisse, c, true, 0.43, cote * 0.58, 0.22, 0.04, M.phare, 0.025);
      // les feux arrière en 3 « griffes », et la bande noire entre eux
      for (let i = 0; i < 3; i++) {
        const griffe = auBout(caisse, c, false, 0.74 - i * 0.06, cote * 0.5, 0.025, 0.24, M.feu, 0.02);
        griffe.rotation.x = cote * 0.3;
      }
    }
    auBout(caisse, c, false, 0.68, 0, 0.12, 0.7, M.noir, 0.015);
    auBout(caisse, c, true, 0.38, 0, 0.22, 0.8, M.plastique, 0.02); // la calandre sans cadre
    for (let i = 0; i < 4; i++) auBout(caisse, c, true, 0.3 + i * 0.05, 0, 0.01, 0.75, M.chrome, 0.03);
    auBout(caisse, c, true, 0.3, 0, 0.1, 1.1, M.plastique, 0.03);
    auBout(caisse, c, false, 0.33, 0, 0.1, 1.2, M.plastique, 0.03);
    for (const cote of [-1, 1]) {
      surLeFlanc(caisse, c, 0, 0.24, cote, 2.2, 0.07, M.plastique, 0.02); // le bas de caisse
      surLeFlanc(caisse, c, -0.3, 0.955, cote, 2.3, 0.02, M.chrome, 0.012); // le jonc chromé sous les vitres
    }
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
        { x: -2.57, yb: 0.32, yc: 1.08, yt: 1.1, w: 0.92, n: 6 },
        { x: -2.5, yb: 0.27, yc: 1.12, yt: 1.12, w: 0.96, n: 6 },
        { x: 1.3, yb: 0.27, yc: 1.12, yt: 1.12, w: 0.965, n: 6 },
        { x: 1.65, yb: 0.27, yc: 1.1, yt: 1.08, w: 0.955, n: 5 },
        { x: 2.0, yb: 0.28, yc: 1.0, yt: 0.98, w: 0.93, n: 4 },
        { x: 2.35, yb: 0.3, yc: 0.88, yt: 0.86, w: 0.88, n: 3.5 },
        { x: 2.52, yb: 0.34, yc: 0.72, yt: 0.7, w: 0.8, n: 3 },
        { x: 2.57, yb: 0.4, yc: 0.6, yt: 0.6, w: 0.7, n: 2.6 },
      ],
      arches: arches(R, 0.82),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -2.57, yb: 1.08, yc: 1.1, yt: 1.82, w: 0.9, n: 6 },
        { x: -2.45, yb: 1.08, yc: 1.1, yt: 1.9, w: 0.93, n: 6 },
        { x: 0.6, yb: 1.08, yc: 1.1, yt: 1.91, w: 0.93, n: 6 },
        { x: 0.95, yb: 1.08, yc: 1.1, yt: 1.86, w: 0.93, n: 6 },
        { x: 1.3, yb: 1.08, yc: 1.1, yt: 1.5, w: 0.93, n: 5 },
        { x: 1.62, yb: 1.08, yc: 1.1, yt: 1.12, w: 0.92, n: 5 },
      ],
      vitre: regleVitres({ pareBrise: [0.9, 1.7], av: 1.5, ar: -2.4, montants: [0.72, -0.5, -1.55], pilier: 0.12 }),
    }, peinture(k1));
    // La vitre arrière (sur le hayon) et les grands feux verticaux de chaque côté.
    caisse.add(boite(0.02, 0.5, 1.4, M.vitre, -2.585, 1.5, 0));
    for (const cote of [-1, 1]) {
      caisse.add(boite(0.04, 0.55, 0.12, M.feu, -2.58, 1.25, cote * 0.8));
      const phare = surLeDessus(plat(0.34, 0.34, M.phare, 0.02), c, 2.35, cote * 0.6, 0.003);
      phare.rotateY(cote * 0.15);
      caisse.add(phare);
      surLeFlanc(caisse, c, -0.95, 1.06, cote, 1.25, 0.02, M.noir, 0.012); // le rail de la porte coulissante
    }
    // La calandre : 3 lamelles chromées et l'emblème rond au milieu.
    const calandre = surLeDessus(plat(0.3, 0.85, M.noir, 0.015), c, 2.46, 0, 0.002);
    caisse.add(calandre);
    for (let i = 0; i < 3; i++) caisse.add(surLeDessus(plat(0.025, 0.82, M.chrome, 0.015), c, 2.4 + i * 0.07, 0, 0.012));
    const embleme = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.013, 8, 22), M.chrome);
    surLeDessus(embleme, c, 2.47, 0, 0.03);
    embleme.rotateX(Math.PI / 2);
    caisse.add(embleme);
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

  Circuit.Modeles.ajouter({ chiron, porsche911, aventador, basse, suv, camionnette, moto });
  return {};
})();
