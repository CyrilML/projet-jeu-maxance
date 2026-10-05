// 🏜️ LES VÉHICULES : le carrossier du désert (étape 54)
//
// ✍️ Maxance veut « des véhicules vraiment très réalistes » : des 4x4 de rallye-raid, des buggys, des motos de rallye
// et un camion, comme au Dakar. Chacun est construit avec ses VRAIES mesures (longueur, largeur, hauteur, taille des
// roues). La carrosserie est une COQUE faite de tranches (affichage/coque.js) ; les roues ont de gros pneus à
// crampons (affichage/roues.js). Puis on ajoute ce qui fait un véhicule du Dakar : l'arceau de sécurité, les roues
// de secours, la prise d'air sur le toit, la rampe de phares, les plaques de protection, les numéros de course…
//
// Tout ce qui est posé sur les ressorts (la carrosserie…) est rangé dans la CAISSE ; les roues restent par terre.
// Tous les véhicules sont construits « nez vers x+ », posés au sol (y = 0), centrés en x = 0 et z = 0.

window.Raid = window.Raid || {};

Raid.Vehicules = (function () {
  const { M, peinture, autocollant } = Raid.Materiaux;
  const Coque = Raid.Coque;

  // ---------------------------------------------------------------- les outils de l'atelier
  function boite(lx, ly, lz, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), materiau);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }
  function cylindre(r, l, materiau, segments) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segments || 16), materiau);
    m.castShadow = true;
    return m;
  }
  // Un tube entre deux points (pour les arceaux, les fourches, les guidons…).
  function tube(a, b, r, materiau) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = cylindre(r, va.distanceTo(vb), materiau, 8);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return m;
  }
  // Une suite de tubes reliés (un arceau).
  function arceau(groupe, points, r, materiau) {
    for (let i = 0; i < points.length - 1; i++) groupe.add(tube(points[i], points[i + 1], r, materiau));
  }
  // Une coque (avec ses vitres), posée dans la caisse.
  function coque(caisse, options, materiau) {
    const c = Coque.construire(options);
    const m = new THREE.Mesh(c.geometrie, [materiau, M.vitre]);
    m.castShadow = m.receiveShadow = true;
    caisse.add(m);
    return c;
  }
  // La règle des vitres d'une cabine (pare-brise, vitres des côtés, lunette).
  function vitres(f) {
    const pilier = f.pilier || 0.08;
    const dans = (x, r) => r && x > r[0] && x < r[1];
    return (c, n, s) => {
      const [x, y, z] = c;
      if (y < s.yb + 0.06) return false;
      if (Math.abs(n[2]) < 0.55) {
        if (dans(x, f.pareBrise)) return Math.abs(z) < s.w - pilier;
        if (dans(x, f.lunette)) return Math.abs(z) < s.w - pilier * 1.4;
        return false;
      }
      if (y < s.yt - 0.1 && x < f.av && x > f.ar) return !(f.montants || []).some((m) => Math.abs(x - m) < 0.05);
      return false;
    };
  }
  const arches = (R, voie) => R.map((r) => ({ x: r.x, y: r.r, r: r.r + 0.06, z: voie - r.l / 2 - 0.06 }));
  // Les 4 roues à crampons.
  function quatreRoues(g, R, voie, options) {
    const roues = [];
    for (const r of R) {
      for (const cote of [-1, 1]) {
        const w = Raid.Roues.fabriquer(Object.assign({ pneu: "crampons", style: "fins", metal: M.jante }, options, { rayon: r.r, largeur: r.l, jante: r.j, cote }));
        w.pivot.position.set(r.x, r.r, cote * voie);
        g.add(w.pivot);
        roues.push(Object.assign(w, { avant: r.x > 0 }));
      }
    }
    return roues;
  }
  // Une roue de secours (debout), qu'on pose où on veut.
  function roueDeSecours(r, l, j) {
    const w = Raid.Roues.fabriquer({ rayon: r, largeur: l, jante: j, pneu: "crampons", style: "fins", metal: M.jante, etrier: false, cote: 1 });
    return w.pivot;
  }
  // Le numéro de course (sur les deux portières) et un bandeau de sponsors.
  function numeros(caisse, c, x, y, numero, cote) {
    for (const s of [-1, 1]) {
      const n = autocollant(numero, "#ffffff", "#111111", 0.55, 0.42);
      n.position.set(x, y, s * (c.tranche(x).w + 0.006));
      if (s < 0) n.rotation.y = Math.PI;
      caisse.add(n);
    }
  }
  // Un pilote (pour les motos) : un corps en combinaison et un casque.
  function pilote(couleur, casque) {
    const g = new THREE.Group();
    const combi = peinture(couleur, true), peau = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.8 });
    const membre = (r, l, mat, a, b) => tube(a, b, r, mat);
    g.add(membre(0.11, 0.6, peau, [0, 0.95, -0.14], [0.35, 0.55, -0.2])); // les jambes (bottes)
    g.add(membre(0.11, 0.6, peau, [0, 0.95, 0.14], [0.35, 0.55, 0.2]));
    g.add(membre(0.12, 0.5, combi, [0.0, 0.95, -0.14], [0.25, 0.95, -0.17]));
    g.add(membre(0.12, 0.5, combi, [0.0, 0.95, 0.14], [0.25, 0.95, 0.17]));
    const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.45, 4, 10), combi);
    corps.position.set(0.1, 1.3, 0);
    corps.rotation.z = -0.5;
    corps.castShadow = true;
    g.add(corps);
    g.add(membre(0.07, 0.5, combi, [0.25, 1.5, -0.25], [0.6, 1.25, -0.3])); // les bras
    g.add(membre(0.07, 0.5, combi, [0.25, 1.5, 0.25], [0.6, 1.25, 0.3]));
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), peinture(casque));
    tete.scale.set(1.15, 1, 1);
    tete.position.set(0.38, 1.75, 0);
    tete.castShadow = true;
    g.add(tete);
    g.add(boite(0.1, 0.08, 0.22, M.vitreFumee, 0.55, 1.75, 0)); // la visière
    g.add(boite(0.18, 0.04, 0.24, peinture(casque), 0.48, 1.86, 0)); // la casquette du casque de cross
    return g;
  }
  const fin = (g, caisse, roues, famille, hauteur) => ({ g, caisse, roues, famille, hauteur });

  // ---------------------------------------------------------------- 🇯🇵 Toyota Hilux du Dakar (4,8 m × 2,3 m × 1,9 m)
  function hilux(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.5, r: 0.47, l: 0.32, j: 0.24 }, { x: -1.5, r: 0.47, l: 0.32, j: 0.24 }], voie = 0.97;
    const c = coque(caisse, {
      cles: [
        { x: -2.4, yb: 0.75, yc: 1.05, yt: 1.08, w: 0.95, n: 4 },
        { x: -2.2, yb: 0.6, yc: 1.12, yt: 1.12, w: 1.1, n: 5 },
        { x: -1.5, yb: 0.55, yc: 1.15, yt: 1.12, w: 1.15, n: 5 },
        { x: -0.6, yb: 0.5, yc: 1.18, yt: 1.16, w: 1.12, n: 5 },
        { x: 0.5, yb: 0.5, yc: 1.2, yt: 1.18, w: 1.12, n: 5 },
        { x: 1.0, yb: 0.5, yc: 1.2, yt: 1.15, w: 1.13, n: 5 },
        { x: 1.5, yb: 0.55, yc: 1.19, yt: 1.08, w: 1.15, n: 5 },
        { x: 2.1, yb: 0.6, yc: 1.05, yt: 0.98, w: 1.05, n: 4 },
        { x: 2.4, yb: 0.75, yc: 0.88, yt: 0.86, w: 0.85, n: 3 },
      ],
      arches: arches(R, voie),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -0.6, yb: 1.04, yc: 1.12, yt: 1.82, w: 0.78, n: 5 },
        { x: -0.3, yb: 1.04, yc: 1.12, yt: 1.9, w: 0.8, n: 5 },
        { x: 0.3, yb: 1.04, yc: 1.12, yt: 1.9, w: 0.8, n: 5 },
        { x: 0.6, yb: 1.04, yc: 1.12, yt: 1.74, w: 0.8, n: 5 },
        { x: 0.95, yb: 1.04, yc: 1.12, yt: 1.26, w: 0.8, n: 5 },
        { x: 1.08, yb: 1.04, yc: 1.12, yt: 1.13, w: 0.8, n: 5 },
      ],
      vitre: vitres({ pareBrise: [0.55, 1.08], av: 0.92, ar: -0.45, montants: [0.12] }),
    }, peinture(k1));
    caisse.add(boite(0.02, 0.4, 1.2, M.vitre, -0.61, 1.55, 0)); // la lunette arrière de la cabine
    // Les bandes rouges et noires sur les flancs, et le numéro de course.
    for (const s of [-1, 1]) {
      caisse.add(boite(3.6, 0.16, 0.01, peinture(k2), 0, 0.82, s * 1.135));
      caisse.add(boite(3.6, 0.05, 0.01, peinture(k3), 0, 0.71, s * 1.135));
    }
    numeros(caisse, c, 0.25, 0.98, numero);
    // La face : la calandre noire, les phares, la plaque de protection en aluminium, et la rampe de phares sur le toit.
    caisse.add(boite(0.04, 0.22, 1.1, M.noir, 2.41, 0.75, 0));
    for (const s of [-1, 1]) caisse.add(boite(0.05, 0.12, 0.32, M.phare, 2.36, 0.88, s * 0.6));
    caisse.add(boite(0.5, 0.05, 1.3, M.alu, 2.2, 0.42, 0));
    caisse.add(boite(0.2, 0.1, 1.5, M.noir, 0.45, 1.97, 0));
    for (let i = 0; i < 4; i++) {
      const ph = cylindre(0.09, 0.08, M.phare, 16);
      ph.rotation.z = Math.PI / 2;
      ph.position.set(0.56, 1.97, -0.54 + i * 0.36);
      caisse.add(ph);
    }
    caisse.add(boite(0.7, 0.18, 0.4, peinture(k3), -0.2, 1.98, 0)); // la prise d'air sur le toit
    // Derrière la cabine : l'arceau en X et ✍️ les 3 roues de secours debout (comme sur l'image du Dakar !).
    arceau(caisse, [[-0.7, 1.12, -0.9], [-0.7, 1.95, -0.75], [-0.7, 1.95, 0.75], [-0.7, 1.12, 0.9]], 0.035, M.tube);
    caisse.add(tube([-0.7, 1.15, -0.85], [-0.7, 1.92, 0.75], 0.03, M.tube));
    caisse.add(tube([-0.7, 1.15, 0.85], [-0.7, 1.92, -0.75], 0.03, M.tube));
    for (const z of [-0.55, 0, 0.55]) {
      const s = roueDeSecours(0.47, 0.32, 0.24);
      s.rotation.y = Math.PI / 2;
      s.position.set(-1.6, 1.12 + 0.47, z);
      caisse.add(s);
    }
    for (const s of [-1, 1]) caisse.add(boite(0.04, 0.24, 0.3, M.feu, -2.41, 0.95, s * 0.75));
    // Les bavettes derrière les roues (contre la boue).
    for (const x of [1.0, -2.05]) for (const s of [-1, 1]) caisse.add(boite(0.02, 0.32, 0.34, M.plastique, x, 0.5, s * voie));
    const roues = quatreRoues(g, R, voie, { etrier: [0.82, 0.07, 0.1] });
    return fin(g, caisse, roues, "4x4", 1.95);
  }

  // ---------------------------------------------------------------- 🇫🇷 Peugeot 3008 DKR (4,3 m × 2,4 m × 1,85 m)
  function dkr(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.45, r: 0.45, l: 0.32, j: 0.25 }, { x: -1.45, r: 0.45, l: 0.32, j: 0.25 }], voie = 1.02;
    const c = coque(caisse, {
      cles: [
        { x: -2.15, yb: 0.65, yc: 0.95, yt: 1.0, w: 1.0, n: 3.5 },
        { x: -1.95, yb: 0.5, yc: 1.15, yt: 1.2, w: 1.18, n: 4 },
        { x: -1.45, yb: 0.5, yc: 1.2, yt: 1.15, w: 1.2, n: 4.5 },
        { x: -0.6, yb: 0.45, yc: 1.12, yt: 1.12, w: 1.12, n: 4 },
        { x: 0.4, yb: 0.45, yc: 1.1, yt: 1.1, w: 1.12, n: 4 },
        { x: 1.0, yb: 0.48, yc: 1.12, yt: 1.02, w: 1.15, n: 4 },
        { x: 1.45, yb: 0.5, yc: 1.16, yt: 0.98, w: 1.2, n: 4.5 },
        { x: 1.9, yb: 0.55, yc: 0.98, yt: 0.9, w: 1.1, n: 3.5 },
        { x: 2.15, yb: 0.7, yc: 0.8, yt: 0.78, w: 0.9, n: 3 },
      ],
      arches: arches(R, voie),
    }, peinture(k1));
    coque(caisse, {
      cles: [
        { x: -1.4, yb: 1.0, yc: 1.1, yt: 1.3, w: 0.7, n: 3.5 },
        { x: -1.0, yb: 1.0, yc: 1.1, yt: 1.7, w: 0.76, n: 3.5 },
        { x: -0.4, yb: 1.0, yc: 1.1, yt: 1.85, w: 0.78, n: 3.5 },
        { x: 0.2, yb: 1.0, yc: 1.1, yt: 1.82, w: 0.78, n: 3.5 },
        { x: 0.6, yb: 1.0, yc: 1.1, yt: 1.55, w: 0.78, n: 3.5 },
        { x: 1.0, yb: 1.0, yc: 1.1, yt: 1.12, w: 0.76, n: 3.5 },
      ],
      vitre: vitres({ pareBrise: [0.45, 1.0], av: 0.7, ar: -0.7, montants: [] }),
    }, peinture(k1));
    // La déco bleue et noire, le numéro, la grande prise d'air sur le toit, les « crocs » de lumière Peugeot.
    for (const s of [-1, 1]) {
      caisse.add(boite(2.2, 0.32, 0.01, peinture(k2), -0.3, 0.8, s * 1.125));
      caisse.add(boite(3.4, 0.06, 0.01, peinture(k3), 0, 0.6, s * 1.125));
      caisse.add(boite(0.04, 0.24, 0.05, M.phare, 2.08, 0.66, s * 0.72));
      caisse.add(boite(0.18, 0.05, 0.3, M.phare, 1.95, 0.88, s * 0.62));
    }
    numeros(caisse, c, 0.4, 0.95, numero);
    caisse.add(boite(0.9, 0.24, 0.5, peinture(k3), -0.55, 1.93, 0));
    caisse.add(boite(0.04, 0.18, 0.4, M.noir, -0.1, 1.95, 0));
    caisse.add(boite(0.05, 0.25, 1.0, M.noir, 2.15, 0.6, 0)); // la calandre
    caisse.add(boite(0.45, 0.05, 1.2, M.alu, 2.0, 0.45, 0));
    for (const s of [-1, 1]) caisse.add(boite(0.04, 0.12, 0.5, M.feu, -2.16, 0.95, s * 0.6));
    // Deux roues de secours à plat, à l'arrière.
    for (const x of [-1.6, -1.95]) {
      const r = roueDeSecours(0.45, 0.32, 0.25);
      r.rotation.x = Math.PI / 2;
      r.position.set(x + 0.15, 1.33, 0);
      r.scale.setScalar(0.9);
      caisse.add(r);
    }
    const roues = quatreRoues(g, R, voie, { etrier: [0.1, 0.25, 0.7] });
    return fin(g, caisse, roues, "4x4", 1.95);
  }

  // ---------------------------------------------------------------- 🇬🇧 Mini JCW Buggy (4,4 m × 2,3 m × 1,95 m)
  function buggy(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.55, r: 0.47, l: 0.33, j: 0.25 }, { x: -1.55, r: 0.47, l: 0.33, j: 0.25 }], voie = 1.0;
    const c = coque(caisse, {
      cles: [
        { x: -2.2, yb: 0.7, yc: 1.0, yt: 1.05, w: 0.95, n: 3 },
        { x: -2.0, yb: 0.55, yc: 1.18, yt: 1.2, w: 1.12, n: 3.5 },
        { x: -1.55, yb: 0.55, yc: 1.22, yt: 1.12, w: 1.15, n: 4 },
        { x: -0.6, yb: 0.5, yc: 1.1, yt: 1.12, w: 1.05, n: 3.5 },
        { x: 0.6, yb: 0.5, yc: 1.1, yt: 1.12, w: 1.05, n: 3.5 },
        { x: 1.1, yb: 0.52, yc: 1.16, yt: 1.08, w: 1.1, n: 3.5 },
        { x: 1.55, yb: 0.55, yc: 1.2, yt: 1.02, w: 1.15, n: 4 },
        { x: 2.0, yb: 0.6, yc: 1.02, yt: 0.96, w: 1.05, n: 3 },
        { x: 2.2, yb: 0.72, yc: 0.88, yt: 0.86, w: 0.85, n: 2.6 },
      ],
      arches: arches(R, voie),
    }, peinture(k1));
    // ✍️ Le toit blanc (la signature des Mini), avec sa prise d'air.
    coque(caisse, {
      cles: [
        { x: -1.25, yb: 1.0, yc: 1.1, yt: 1.45, w: 0.72, n: 4 },
        { x: -0.9, yb: 1.0, yc: 1.1, yt: 1.85, w: 0.78, n: 4 },
        { x: 0.1, yb: 1.0, yc: 1.1, yt: 1.9, w: 0.8, n: 4 },
        { x: 0.55, yb: 1.0, yc: 1.1, yt: 1.7, w: 0.8, n: 4 },
        { x: 1.0, yb: 1.0, yc: 1.1, yt: 1.14, w: 0.78, n: 4 },
      ],
      vitre: vitres({ pareBrise: [0.4, 1.0], av: 0.7, ar: -0.8, montants: [-0.2] }),
    }, peinture(k2));
    // La face Mini : les PHARES RONDS et la calandre hexagonale noire.
    for (const s of [-1, 1]) {
      const ph = cylindre(0.15, 0.06, M.phare, 24);
      ph.rotation.z = Math.PI / 2 - 0.3;
      ph.position.set(2.1, 0.95, s * 0.62);
      caisse.add(ph);
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.02, 6, 24), M.chrome);
      anneau.rotation.y = Math.PI / 2;
      anneau.rotation.x = -0.3;
      anneau.position.set(2.12, 0.96, s * 0.62);
      caisse.add(anneau);
      caisse.add(boite(2.6, 0.12, 0.01, peinture(k3), -0.2, 0.75, s * 1.06));
      caisse.add(boite(0.04, 0.12, 0.4, M.feu, -2.21, 0.98, s * 0.6));
    }
    const grille = cylindre(0.3, 0.04, M.noir, 6);
    grille.rotation.z = Math.PI / 2;
    grille.scale.set(1, 1, 0.6);
    grille.position.set(2.2, 0.72, 0);
    caisse.add(grille);
    caisse.add(boite(0.5, 0.18, 0.45, peinture(k2), -0.35, 1.97, 0));
    numeros(caisse, c, 0.0, 0.92, numero);
    caisse.add(boite(0.4, 0.05, 1.2, M.alu, 2.05, 0.48, 0));
    // Les grands amortisseurs (on les voit derrière les roues : le buggy a beaucoup de débattement).
    for (const x of [1.55, -1.55]) for (const s of [-1, 1]) g.add(tube([x, 0.47, s * 0.75], [x - 0.15, 1.1, s * 0.62], 0.05, peinture(k3)));
    const roues = quatreRoues(g, R, voie, { etrier: [0.8, 0.1, 0.12] });
    return fin(g, caisse, roues, "buggy", 2.0);
  }

  // ---------------------------------------------------------------- 🇨🇦 Can-Am Maverick X3, un SSV (3,4 m × 1,9 m × 1,7 m)
  function ssv(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.3, r: 0.41, l: 0.28, j: 0.2 }, { x: -1.25, r: 0.41, l: 0.28, j: 0.2 }], voie = 0.82;
    // Le « bateau » : une coque basse et étroite (le capot devant, le moteur derrière) ; le reste est un ARCEAU de tubes.
    const c = coque(caisse, {
      cles: [
        { x: -1.7, yb: 0.55, yc: 0.95, yt: 1.0, w: 0.6, n: 3 },
        { x: -1.25, yb: 0.45, yc: 1.0, yt: 1.02, w: 0.68, n: 3.5 },
        { x: -0.5, yb: 0.38, yc: 0.75, yt: 0.72, w: 0.72, n: 4 },
        { x: 0.6, yb: 0.38, yc: 0.75, yt: 0.72, w: 0.72, n: 4 },
        { x: 1.0, yb: 0.42, yc: 0.92, yt: 0.95, w: 0.72, n: 3.5 },
        { x: 1.4, yb: 0.45, yc: 0.92, yt: 0.88, w: 0.7, n: 3.5 },
        { x: 1.72, yb: 0.55, yc: 0.72, yt: 0.7, w: 0.55, n: 3 },
      ],
      arches: arches(R, voie),
    }, peinture(k1));
    // L'arceau (la cage qui protège les pilotes) et le toit.
    const t = M.tube;
    for (const s of [-1, 1]) {
      arceau(caisse, [[1.0, 0.9, s * 0.62], [0.55, 1.62, s * 0.55], [-0.75, 1.62, s * 0.55], [-1.05, 1.0, s * 0.62]], 0.03, t);
      caisse.add(tube([-0.1, 0.75, s * 0.7], [-0.1, 1.62, s * 0.55], 0.03, t));
      caisse.add(boite(1.1, 0.1, 0.02, peinture(k2), -0.1, 0.62, s * 0.72)); // le filet de portière
    }
    for (const x of [0.55, -0.75]) caisse.add(tube([x, 1.62, -0.55], [x, 1.62, 0.55], 0.03, t));
    caisse.add(boite(1.35, 0.04, 1.15, peinture(k2), -0.1, 1.66, 0)); // le toit
    // Les deux sièges, les deux pilotes (casques), les phares « yeux méchants », le moteur derrière, le numéro.
    for (const s of [-0.3, 0.3]) {
      caisse.add(boite(0.45, 0.6, 0.42, M.siege, -0.35, 1.0, s));
      const casque = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), peinture(k1));
      casque.position.set(-0.2, 1.38, s);
      caisse.add(casque);
    }
    for (const s of [-1, 1]) {
      const oeil = boite(0.2, 0.05, 0.22, M.phare, 1.62, 0.78, s * 0.36);
      oeil.rotation.y = s * 0.25;
      oeil.rotation.z = -0.3;
      caisse.add(oeil);
    }
    caisse.add(boite(0.6, 0.35, 0.8, M.noir, -1.2, 1.15, 0)); // le moteur et sa grille
    numeros(caisse, c, 1.05, 0.75, numero);
    for (const x of [1.3, -1.25]) for (const s of [-1, 1]) g.add(tube([x, 0.41, s * 0.62], [x - 0.12, 0.95, s * 0.5], 0.045, peinture(k3)));
    const roues = quatreRoues(g, R, voie, { etrier: false, style: "doubles", metal: peinture(k3) });
    return fin(g, caisse, roues, "buggy", 1.75);
  }

  // ---------------------------------------------------------------- 🇦🇹 KTM 450 Rally et 🇯🇵 Honda CRF450 Rally
  function motoDeRallye(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const c1 = peinture(k1), c2 = peinture(k2), c3 = peinture(k3);
    // La « tour de navigation » : le grand carénage avant avec sa bulle (derrière : l'écran du road-book).
    coque(caisse, {
      cles: [
        { x: 0.55, yb: 0.95, yc: 1.25, yt: 1.38, w: 0.2, wb: 0.15, n: 2.2 },
        { x: 0.8, yb: 0.92, yc: 1.3, yt: 1.45, w: 0.22, wb: 0.16, n: 2.2 },
        { x: 1.0, yb: 1.0, yc: 1.22, yt: 1.3, w: 0.15, wb: 0.1, n: 2.2 },
      ],
      vitre: (ct, n) => ct[1] > 1.3 && n[1] > 0.3,
    }, c1);
    // Le gros réservoir (il fait le tour : un rallye, c'est 500 km sans station !), la selle, l'arrière.
    coque(caisse, {
      cles: [
        { x: -0.25, yb: 0.7, yc: 1.02, yt: 1.08, w: 0.2, n: 2.4 },
        { x: 0.1, yb: 0.62, yc: 1.12, yt: 1.2, w: 0.27, n: 2.4 },
        { x: 0.5, yb: 0.7, yc: 1.12, yt: 1.18, w: 0.22, n: 2.4 },
      ],
    }, c2);
    caisse.add(boite(0.75, 0.08, 0.26, M.siege, -0.45, 1.08, 0));
    coque(caisse, {
      cles: [
        { x: -1.05, yb: 1.0, yc: 1.08, yt: 1.1, w: 0.08, n: 2 },
        { x: -0.7, yb: 0.88, yc: 1.02, yt: 1.03, w: 0.14, n: 2.4 },
        { x: -0.4, yb: 0.8, yc: 0.98, yt: 0.99, w: 0.16, n: 2.4 },
      ],
    }, c1);
    // Les bandes de déco, le numéro (sur la plaque avant), le phare double, le feu arrière.
    for (const s of [-1, 1]) caisse.add(boite(0.5, 0.08, 0.01, c3, 0.15, 0.95, s * 0.275));
    const plaque = autocollant(numero, "#ffffff", "#111111", 0.28, 0.22);
    plaque.position.set(1.03, 1.12, 0);
    plaque.rotation.y = Math.PI / 2;
    plaque.rotation.x = 0;
    caisse.add(plaque);
    for (const y of [1.2, 1.05]) caisse.add(boite(0.04, 0.08, 0.12, M.phare, 1.0, y, 0));
    caisse.add(boite(0.03, 0.04, 0.1, M.feu, -1.06, 1.08, 0));
    // Le moteur, le cadre, le pot d'échappement (haut, pour passer dans l'eau), le sabot de protection.
    caisse.add(boite(0.42, 0.36, 0.3, M.noir, 0.05, 0.55, 0));
    caisse.add(boite(0.55, 0.06, 0.3, M.alu, 0.05, 0.36, 0));
    for (const s of [-1, 1]) caisse.add(tube([0.62, 1.05, s * 0.1], [-0.2, 0.7, s * 0.1], 0.025, M.alu));
    const pot = cylindre(0.065, 0.55, M.alu, 14);
    pot.rotation.z = Math.PI / 2 - 0.35;
    pot.position.set(-0.6, 0.85, 0.2);
    caisse.add(pot);
    // La longue fourche (30 cm de débattement !), le bras oscillant, le guidon avec ses protège-mains.
    for (const z of [-0.09, 0.09]) {
      g.add(tube([1.0, 0.37, z], [0.85, 0.8, z], 0.035, M.chrome));
      caisse.add(tube([0.85, 0.8, z], [0.68, 1.25, z], 0.045, peinture([0.95, 0.55, 0.05])));
    }
    for (const z of [-0.1, 0.1]) g.add(tube([-0.9, 0.35, z], [-0.05, 0.55, z], 0.03, M.alu));
    caisse.add(tube([0.68, 1.32, -0.38], [0.68, 1.32, 0.38], 0.018, M.noir));
    for (const s of [-1, 1]) caisse.add(boite(0.14, 0.1, 0.06, c1, 0.74, 1.33, s * 0.38));
    // Le pilote, debout sur les repose-pieds (comme les vrais pilotes de rallye, pour amortir les bosses).
    const p = pilote(k2, k1);
    p.position.set(-0.45, 0.1, 0);
    caisse.add(p);
    // Les roues : 21 pouces devant, 18 pouces derrière, à gros crampons ; rayons métalliques (jantes à rayons).
    const roues = [];
    for (const [x, avant, r, l] of [[1.0, true, 0.37, 0.12], [-0.9, false, 0.35, 0.17]]) {
      const w = Raid.Roues.fabriquer({ rayon: r, largeur: l, jante: r * 0.7, style: "fins", rayons: 16, metal: M.alu, pneu: "crampons", etrier: avant ? [0.85, 0.85, 0.87] : false, cote: 1 });
      w.pivot.position.set(x, r, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant }));
    }
    return fin(g, caisse, roues, "moto", 1.95);
  }

  // ---------------------------------------------------------------- 🇷🇺 Kamaz 43509 (7,2 m × 2,55 m × 3,4 m)
  function kamaz(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 2.0, r: 0.62, l: 0.42, j: 0.32 }, { x: -2.2, r: 0.62, l: 0.42, j: 0.32 }], voie = 1.05;
    // La cabine avancée (le moteur est dessous), à l'avant.
    coque(caisse, {
      cles: [
        { x: 1.55, yb: 1.25, yc: 2.0, yt: 3.15, w: 1.22, n: 6 },
        { x: 2.8, yb: 1.25, yc: 2.0, yt: 3.2, w: 1.24, n: 6 },
        { x: 3.25, yb: 1.25, yc: 2.0, yt: 3.0, w: 1.22, n: 5 },
        { x: 3.55, yb: 1.25, yc: 1.9, yt: 2.0, w: 1.2, n: 5 },
        { x: 3.62, yb: 1.3, yc: 1.6, yt: 1.6, w: 1.15, n: 5 },
      ],
      vitre: (c, n) => (n[0] > 0.25 && c[1] > 2.05 && c[1] < 2.95 && Math.abs(c[2]) < 1.08) || (Math.abs(n[2]) > 0.6 && c[1] > 2.15 && c[1] < 2.95 && c[0] > 2.3 && c[0] < 3.2),
    }, peinture(k1));
    // Le châssis, la caisse arrière (avec les pièces de rechange), les marchepieds, la calandre et ses phares.
    caisse.add(boite(6.4, 0.3, 1.0, M.noir, 0, 1.05, 0));
    coque(caisse, {
      cles: [
        { x: -3.6, yb: 1.25, yc: 2.7, yt: 2.75, w: 1.2, n: 8 },
        { x: -3.5, yb: 1.25, yc: 2.8, yt: 2.85, w: 1.25, n: 8 },
        { x: 1.25, yb: 1.25, yc: 2.8, yt: 2.85, w: 1.25, n: 8 },
        { x: 1.35, yb: 1.25, yc: 2.7, yt: 2.75, w: 1.2, n: 8 },
      ],
    }, peinture(k2));
    for (const s of [-1, 1]) {
      caisse.add(boite(4.6, 0.5, 0.01, peinture(k1), -1.1, 2.3, s * 1.255)); // la grande bande bleue
      caisse.add(boite(4.6, 0.12, 0.01, peinture(k3), -1.1, 1.95, s * 1.255));
      const n = autocollant(numero, "#ffffff", "#111111", 0.9, 0.6);
      n.position.set(2.6, 1.75, s * 1.245);
      if (s < 0) n.rotation.y = Math.PI;
      caisse.add(n);
      caisse.add(boite(0.4, 0.06, 0.45, M.alu, 2.7, 1.05, s * 1.1)); // le marchepied
      caisse.add(boite(0.05, 0.22, 0.4, M.phare, 3.64, 1.5, s * 0.82));
      caisse.add(boite(0.04, 0.2, 0.3, M.feu, -3.62, 1.4, s * 0.9));
      caisse.add(tube([3.3, 2.0, s * 1.24], [3.3, 3.2, s * 1.24], 0.08, M.noir)); // le « tuba » : la prise d'air en hauteur (pour traverser les rivières)
    }
    caisse.add(boite(0.05, 0.5, 1.6, M.noir, 3.63, 1.55, 0)); // la calandre
    for (let i = 0; i < 4; i++) caisse.add(boite(0.04, 0.04, 1.5, M.alu, 3.66, 1.38 + i * 0.12, 0));
    caisse.add(boite(0.35, 0.18, 2.4, M.alu, 3.7, 1.15, 0)); // le pare-chocs
    caisse.add(boite(0.2, 0.12, 2.0, M.noir, 3.1, 3.27, 0)); // la rampe de phares sur le toit
    for (let i = 0; i < 6; i++) {
      const ph = cylindre(0.08, 0.06, M.phare, 14);
      ph.rotation.z = Math.PI / 2;
      ph.position.set(3.22, 3.27, -0.85 + i * 0.34);
      caisse.add(ph);
    }
    // Deux roues de secours sur le côté de la caisse.
    for (const x of [-0.5, -2.0]) {
      const r = roueDeSecours(0.62, 0.42, 0.32);
      r.position.set(x, 2.0, -1.5);
      caisse.add(r);
    }
    const roues = quatreRoues(g, R, voie, { etrier: false, style: "acier", metal: peinture(k3, true) });
    return fin(g, caisse, roues, "camion", 3.4);
  }

  const FABRIQUES = { hilux, dkr, buggy, ssv, ktm: motoDeRallye, honda: motoDeRallye, kamaz };
  // Fabrique un véhicule d'après sa fiche (config.js).
  function fabriquer(fiche) {
    const [k1, k2, k3] = fiche.couleurs;
    const v = FABRIQUES[fiche.modele](k1, k2, k3, fiche.numero);
    v.g.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    return v;
  }
  return { fabriquer };
})();
