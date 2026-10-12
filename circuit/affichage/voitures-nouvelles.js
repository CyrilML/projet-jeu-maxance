// 🏭 LES NOUVELLES VOITURES : l'usine aux gabarits (étape 68)
//
// ✍️ Maxance veut de nouvelles voitures : des ALLEMANDES (Audi R8, Mercedes Classe G, BMW M3, Porsche Taycan), des
// SUPERCARS (Ferrari SF90, McLaren 720S, Bugatti Bolide), des FRANÇAISES (Alpine A110, Renault 5, Citroën 2CV), des
// TOUT-TERRAIN (Land Rover Defender, Jeep Wrangler, Ford Raptor) et des VOITURES DE RÊVE (Tesla Cybertruck,
// Batmobile, DeLorean).
//
// Seize voitures, c'est beaucoup ! Alors on utilise des GABARITS, comme un pâtissier qui a quelques moules :
//   - le moule « SPORTIVE » (une voiture basse, le moteur derrière le pilote) : on lui donne la longueur, la largeur,
//     la hauteur des ailes, du nez et du toit, où commence la cabine… et il fabrique la coque ;
//   - le moule « BERLINE » (qui existait déjà : la 208, la Clio, le taxi, la police) ;
//   - le moule « TOUT-TERRAIN » (une grosse boîte, haute sur roues, avec un pare-brise tout droit).
// Puis chaque voiture ajoute ce qui la fait reconnaître : ses phares, ses feux, sa calandre, son nom.
// Trois voitures sont trop bizarres pour un moule, et sont construites à la main : la 2CV, le Cybertruck et la Batmobile.
//
// Comme toutes les autres : « nez vers x+ », posées sur y = 0, centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.VoituresNouvelles = (function () {
  const O = Circuit.Modeles.outils, B = Circuit.VoituresMarques.outils;
  const { M, peinture, boite, cylindre } = O;
  const { coque, regleVitres, arches, quatreRoues, surLeDessus, surLeFlanc, plat, auBout, retros, portiere, echappement, patchFlanc, ligneFlanc, optique, optiqueAuBout, grille, lettres, phareRond, plaque, voiture, berline } = B;
  const nidAbeille = () => new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 });
  const inox = () => new THREE.MeshStandardMaterial({ color: 0xb9bec4, metalness: 0.88, roughness: 0.33 }); // (l'acier brossé)
  const fonce = (k, f) => k.map((q) => q * (f || 0.8));

  // ---------------------------------------------------------------- le moule « SPORTIVE »
  // o = { L, W, xAv, xAr, rAv, rAr, hAile (la hauteur des ailes), hNez, hCul, H (le toit), cab: [ar, toitAr, toitAv, av],
  //       wCab (la demi-largeur de la cabine), n (la « carrure » : 3 rond, 5 carré), matiere, matiereToit, style (jantes) }
  function sportive(o, k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L2 = o.L / 2, W2 = o.W / 2, n = o.n || 4, A = o.hAile, N = o.hNez, Q = o.hCul;
    const R = [{ x: o.xAv, r: o.rAv, l: 0.26, j: o.rAv * 0.74 }, { x: o.xAr, r: o.rAr, l: 0.32, j: o.rAr * 0.74 }];
    const mat = o.matiere || peinture(k1);
    const cle = (x, yb, yc, yt, w) => ({ x, yb, yc, yt, w, wl: w - 0.07, n });
    const c = coque(caisse, {
      cles: [
        cle(-L2, 0.3, Q - 0.15, Q - 0.13, W2 - 0.17),
        cle(-L2 + 0.14, 0.2, Q, Q + 0.02, W2 - 0.05),
        cle(o.xAr, 0.12, A + 0.05, A + 0.03, W2),
        cle((o.xAv + o.xAr) / 2 - 0.3, 0.11, A - 0.02, A - 0.01, W2 - 0.03),
        cle(o.xAv - 0.4, 0.11, A - 0.05, A - 0.1, W2 - 0.02),
        cle(o.xAv, 0.12, A, A - 0.18, W2),
        cle(o.xAv + (L2 - o.xAv) * 0.5, 0.13, (A + N) / 2 + 0.05, (A + N) / 2 - 0.04, W2 - 0.05),
        cle(L2 - 0.14, 0.15, N + 0.08, N + 0.06, W2 - 0.15),
        cle(L2, 0.2, N, N, W2 - 0.3),
      ],
      arches: arches(R, W2 - 0.15),
    }, mat);
    const [ar, toitAr, toitAv, av] = o.cab, wc = o.wCab || W2 - 0.32;
    const bas = (x) => c.tranche(x).yt - 0.005;
    coque(caisse, {
      cles: [
        { x: ar, yb: bas(ar) - 0.02, yc: bas(ar), yt: bas(ar) + 0.02, w: wc - 0.1, wt: wc - 0.2, rt: 0.05 },
        { x: toitAr - 0.4, yb: bas(toitAr - 0.4) - 0.02, yc: bas(toitAr - 0.4), yt: o.H - 0.1, w: wc - 0.03, wt: wc - 0.18, rt: 0.08 },
        { x: toitAr, yb: bas(toitAr) - 0.02, yc: bas(toitAr), yt: o.H, w: wc, wt: wc - 0.18, rt: 0.1 },
        { x: toitAv, yb: bas(toitAv) - 0.02, yc: bas(toitAv), yt: o.H - 0.02, w: wc, wt: wc - 0.17, rt: 0.1 },
        { x: av - (av - toitAv) * 0.45, yb: bas(av - (av - toitAv) * 0.45) - 0.02, yc: bas(av - (av - toitAv) * 0.45), yt: (o.H + A) / 2, w: wc + 0.01, wt: wc - 0.12, rt: 0.08 },
        { x: av, yb: bas(av) - 0.02, yc: bas(av), yt: bas(av) + 0.02, w: wc - 0.02, wt: wc - 0.06, rt: 0.03 },
      ],
      vitre: regleVitres({ pareBrise: [toitAv + 0.05, av + 0.1], av: av - 0.15, ar: toitAr - 0.25, montants: [], lunette: o.lunette ? [ar + 0.1, toitAr - 0.05] : null }),
    }, o.matiereToit || mat);
    for (const cote of [-1, 1]) ligneFlanc(caisse, c, [[L2 - 0.4, 0.2], [o.xAv - 0.4, 0.17], [o.xAr + 0.4, 0.17], [-L2 + 0.4, 0.22]], 0.018, M.plastique, cote); // le bas de caisse
    retros(caisse, av - 0.1, bas(av) + 0.05, wc - 0.02, W2 - 0.04, o.matiereToit || mat, 0.85);
    portiere(caisse, c, av - 0.05, toitAr - 0.1, 0.28, A - 0.06, false);
    return { g, caisse, c, R, L2, W2 };
  }

  // ---------------------------------------------------------------- le moule « TOUT-TERRAIN »
  // o = { L, W, xAv, xAr, r, hCeinture, hCapot, H, cab: [ar, av] (où commence et finit la cabine), benne (pour un pick-up),
  //       roueSecours, carre (true : tout en angles droits) }
  function toutTerrain(o, k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L2 = o.L / 2, W2 = o.W / 2, hC = o.hCeinture, n = o.carre ? 9 : 6;
    const R = [{ x: o.xAv, r: o.r, l: 0.3, j: o.r * 0.6 }, { x: o.xAr, r: o.r, l: 0.3, j: o.r * 0.6 }];
    const mat = peinture(k1);
    const cle = (x, yb, yc, yt, w) => ({ x, yb, yc, yt, w, wl: w - 0.03, n });
    const c = coque(caisse, {
      cles: [
        cle(-L2, 0.5, hC - 0.04, hC - 0.02, W2 - 0.05),
        cle(-L2 + 0.08, 0.42, hC, hC, W2),
        cle(o.xAr, 0.42, hC, hC, W2),
        cle(0, 0.4, hC, hC, W2),
        cle(o.xAv, 0.42, o.hCapot + 0.02, o.hCapot, W2),
        cle(L2 - 0.12, 0.45, o.hCapot, o.hCapot - 0.03, W2 - 0.02),
        cle(L2, 0.5, o.hCapot - 0.08, o.hCapot - 0.1, W2 - 0.08),
      ],
      arches: arches(R, W2 - 0.1),
      ailes: 0.07,
    }, mat);
    const [ar, av] = o.cab, wc = W2 - 0.05, bas = (x) => c.tranche(x).yt - 0.005;
    coque(caisse, {
      cles: [
        { x: ar, yb: bas(ar) - 0.02, yc: bas(ar), yt: o.H - 0.03, w: wc, wt: wc - 0.08, rt: 0.06 },
        { x: ar + 0.1, yb: bas(ar + 0.1) - 0.02, yc: bas(ar + 0.1), yt: o.H, w: wc, wt: wc - 0.08, rt: 0.06 },
        { x: av - 0.3, yb: bas(av - 0.3) - 0.02, yc: bas(av - 0.3), yt: o.H, w: wc, wt: wc - 0.08, rt: 0.06 },
        { x: av, yb: bas(av) - 0.02, yc: bas(av), yt: bas(av) + 0.08, w: wc - 0.02, wt: wc - 0.1, rt: 0.05 },
      ],
      vitre: regleVitres({ pareBrise: [av - 0.32, av + 0.05], av: av - 0.3, ar: ar + 0.12, montants: [(ar + av) / 2], lunette: o.benne ? [ar - 0.05, ar + 0.08] : [ar - 0.05, ar + 0.08], pilier: 0.07 }),
    }, o.toit ? peinture(k2) : mat);
    if (o.benne) {
      // la benne d'un pick-up : un fond noir et deux rebords
      const xB = (ar + -L2) / 2, lB = ar - -L2 - 0.1;
      caisse.add(boite(lB, 0.04, o.W - 0.2, M.plastique, xB, hC - 0.02, 0));
      for (const z of [-1, 1]) caisse.add(boite(lB, 0.12, 0.06, mat, xB, hC + 0.05, z * (W2 - 0.05)));
      caisse.add(boite(0.06, 0.14, o.W - 0.1, mat, -L2 + 0.05, hC + 0.05, 0));
    }
    // les gros pare-chocs noirs, les marchepieds, les élargisseurs d'ailes
    auBout(caisse, c, true, 0.55, 0, 0.18, o.W + 0.04, M.plastique, 0.12);
    auBout(caisse, c, false, 0.58, 0, 0.16, o.W, M.plastique, 0.1);
    for (const cote of [-1, 1]) {
      caisse.add(boite(o.xAv - o.xAr - 2 * o.r - 0.1, 0.05, 0.16, M.plastique, (o.xAv + o.xAr) / 2, 0.42, cote * (W2 + 0.03)));
      for (const x of [o.xAv, o.xAr]) ligneFlanc(caisse, c, [[x + o.r + 0.12, 0.5], [x + o.r * 0.6, o.r + 0.32], [x, o.r * 1.32 + 0.1], [x - o.r * 0.6, o.r + 0.32], [x - o.r - 0.12, 0.5]], 0.05, M.plastique, cote);
    }
    if (o.roueSecours) {
      const rs = new THREE.Mesh(new THREE.CylinderGeometry(o.r, o.r, 0.28, 24), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 }));
      rs.rotation.z = Math.PI / 2;
      rs.position.set(-L2 - 0.16, hC - 0.2, 0);
      caisse.add(rs);
      const cache = cylindre(o.r * 0.7, 0.3, o.roueSecours === "peinte" ? mat : M.jante, 24);
      cache.rotation.z = Math.PI / 2;
      cache.position.set(-L2 - 0.17, hC - 0.2, 0);
      caisse.add(cache);
    }
    retros(caisse, av - 0.25, bas(av) + 0.08, wc, W2 + 0.02, M.noir, 1.15);
    portiere(caisse, c, av - 0.2, (ar + av) / 2 - 0.05, 0.5, hC - 0.06);
    if (!o.benne) portiere(caisse, c, (ar + av) / 2 - 0.08, ar + 0.3, 0.5, hC - 0.06);
    const roues = quatreRoues(g, R, W2 - 0.1, { style: o.jantes || "acier", pneu: "crampons", metal: o.metalJantes || M.jante });
    return { g, caisse, c, roues, L2, W2, hC };
  }

  // Des phares fins posés sur la pente du nez, les feux, la calandre basse et le nom : ce qui est pareil sur les sportives.
  function details(s, o) {
    const { caisse, c, L2, W2 } = s;
    for (const cote of [-1, 1]) {
      if (o.phares !== false) {
        const bloc = surLeDessus(optique(o.phareL || 0.42, o.phareH || 0.16, o.leds || [[0, -0.04, 0.36, 0.02], [0.06, 0.03, 0.08, 0.06]]), c, L2 - (o.phareX || 0.4), cote * (W2 - (o.phareZ || 0.32)), 0.004);
        bloc.rotateY(cote * (o.phareAngle === undefined ? 0.3 : o.phareAngle));
        caisse.add(bloc);
      }
      if (o.prise) patchFlanc(caisse, c, o.prise[0], o.prise[1], o.prise[2], o.prise[3], nidAbeille(), cote, 0.008, (u, v) => v * 0.2);
    }
    if (o.grille !== false) grille(caisse, c, true, o.grilleY || 0.24, 0, o.grilleH || 0.1, o.grilleL || W2 * 1.1, o.grilleCadre);
    if (o.feux === "barre") optiqueAuBout(caisse, c, false, o.feuxY || 0.72, 0, 0.045, 2 * W2 - 0.35, [[0, 0, 0.016, 2 * W2 - 0.4]], "feu");
    if (o.feux === "ronds") for (const cote of [-1, 1]) for (const dz of [0.2, 0.45]) {
      const f = cylindre(0.07, 0.03, M.feuLed, 20);
      f.rotation.z = Math.PI / 2;
      f.position.set(c.xMin - 0.01, o.feuxY || 0.72, cote * (W2 - dz - 0.1));
      caisse.add(f);
    }
    if (o.feux === "deux") for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, o.feuxY || 0.72, cote * (W2 - 0.35), 0.08, 0.36, [[0, 0, 0.03, 0.32]], "feu");
    grille(caisse, c, false, 0.36, 0, 0.14, W2 * 1.1, M.plastique);
    if (o.nom) lettres(caisse, c, false, (o.feuxY || 0.72) - 0.12, 0, o.nom, o.nomL || 0.5, 0.06);
    for (const z of o.echappements || [-0.25, 0.25]) echappement(caisse, c.xMin - 0.04, 0.32, z, 0.05);
    if (o.aileron) {
      caisse.add(boite(0.34, 0.035, 2 * W2 - 0.2, o.matiereAileron || M.noir, -L2 + 0.2, o.aileron, 0));
      for (const z of [-0.45, 0.45]) caisse.add(boite(0.12, o.aileron - (o.hCul || 0.9) + 0.05, 0.035, M.noir, -L2 + 0.22, (o.aileron + (o.hCul || 0.9)) / 2, z));
    }
  }
  const finir = (s, o, yCapot) => voiture(s.g, s.caisse, quatreRoues(s.g, s.R, s.W2 - 0.15, { style: o.jantes || "doubles", etrier: o.etrier || false, metal: o.metalJantes || M.jante }), yCapot);

  // ================================================================ 🇩🇪 LES ALLEMANDES
  // Audi R8 (4,43 m × 1,94 m × 1,24 m) : le moteur derrière, les grandes « lames » sur les flancs, la calandre
  // hexagonale, les phares à LED en ligne.
  function audiR8(k1, k2) {
    const o = { L: 4.43, W: 1.94, xAv: 1.33, xAr: -1.32, rAv: 0.34, rAr: 0.35, hAile: 0.82, hNez: 0.38, hCul: 0.95, H: 1.24, cab: [-1.6, -0.6, 0.1, 0.95], wCab: 0.7, n: 4 };
    const s = sportive(o, k1, k2);
    for (const cote of [-1, 1]) patchFlanc(s.caisse, s.c, -1.0, -0.35, 0.3, 0.72, peinture(k2), cote, 0.006, (u, v) => (1 - v) * 0.15); // la lame
    details(s, { nom: "AUDI", feux: "barre", grilleY: 0.33, grilleH: 0.24, grilleL: 0.7, grilleCadre: M.chrome, leds: [[0, -0.05, 0.36, 0.015], [0.04, 0.03, 0.2, 0.04]], echappements: [-0.55, 0.55], jantes: "y", etrier: [0.75, 0.08, 0.08] });
    return finir(s, { jantes: "y", etrier: [0.75, 0.08, 0.08] }, 1.05);
  }
  // Mercedes-AMG Classe G (4,87 m × 1,98 m × 1,97 m) : une vraie boîte, les phares ronds, la roue de secours derrière.
  function mercedesG(k1, k2) {
    const s = toutTerrain({ L: 4.87, W: 1.98, xAv: 1.45, xAr: -1.45, r: 0.42, hCeinture: 1.18, hCapot: 1.12, H: 1.97, cab: [-2.3, 0.7], roueSecours: "peinte", carre: true, jantes: "doubles" }, k1, k2);
    const { caisse, c, L2, W2 } = s;
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.12);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.01, 0.92, cote * (W2 - 0.28));
      caisse.add(ph);
      caisse.add(boite(0.05, 0.05, 0.14, M.feuLed, c.xMax - 0.1, 1.15, cote * (W2 - 0.12))); // les clignotants sur les ailes
      optiqueAuBout(caisse, c, false, 0.95, cote * (W2 - 0.12), 0.32, 0.12, [[0, 0, 0.28, 0.08]], "feu");
    }
    grille(caisse, c, true, 0.9, 0, 0.3, 0.8, M.chrome);
    for (let i = -3; i <= 3; i++) caisse.add(boite(0.02, 0.28, 0.02, M.chrome, c.xMax + 0.01, 0.9, i * 0.11)); // les barres verticales
    const etoile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 24), M.chrome);
    etoile.rotation.y = Math.PI / 2;
    etoile.position.set(c.xMax + 0.03, 0.9, 0);
    caisse.add(etoile);
    lettres(caisse, c, false, 0.72, 0.5, "G 63", 0.3, 0.06);
    for (const cote of [-1, 1]) echappement(caisse, -0.2, 0.45, cote * (W2 + 0.05), 0.04); // les sorties sur les côtés
    plaque(caisse, c, true, 0.6, "AMG-G-63");
    return voiture(s.g, s.caisse, s.roues, 1.8);
  }
  // BMW M3 (4,79 m × 1,90 m × 1,43 m) : une berline à coffre, l'énorme « double haricot » de la calandre.
  function bmwM3(k1, k2) {
    const b = berline({ L: 4.79, W: 1.9, xAv: 1.45, xAr: -1.41, r: 0.34, hCapot: 0.84, hCeinture: 0.94, hToit: 1.43, hNez: 0.66, arriere: "coffre", plaque: "M3-COMP-01", style: "y" }, k1, k2);
    const { caisse, c } = b;
    for (const cote of [-1, 1]) {
      const bloc = surLeDessus(optique(0.4, 0.2, [[0.05, -0.02, 0.1, 0.1], [-0.08, -0.02, 0.1, 0.1], [0, 0.07, 0.34, 0.016]]), c, 2.15, cote * 0.58, 0.004);
      bloc.rotateY(-cote * 0.3);
      caisse.add(bloc);
      optiqueAuBout(caisse, c, false, 0.84, cote * 0.58, 0.12, 0.34, [[0, 0, 0.03, 0.3], [0.04, 0, 0.012, 0.3]], "feu");
      // le double haricot : deux grandes grilles hautes, cerclées de chrome
      grille(caisse, c, true, 0.46, cote * 0.12, 0.34, 0.2, M.chrome);
    }
    grille(caisse, c, true, 0.26, 0, 0.1, 1.2, M.plastique);
    lettres(caisse, c, false, 0.72, -0.4, "M3", 0.2, 0.06, "#3a7bd5");
    for (const z of [-0.5, -0.38, 0.38, 0.5]) echappement(caisse, c.xMin - 0.04, 0.3, z, 0.045);
    caisse.add(boite(0.2, 0.03, 1.2, peinture(k1), c.xMin + 0.15, 0.97, 0)); // le petit becquet sur le coffre
    return voiture(b.g, caisse, b.roues, b.yCapot);
  }
  // Porsche Taycan (4,96 m × 1,97 m × 1,38 m) : électrique (pas d'échappement !), les phares à 4 points, la barre de feux.
  function taycan(k1, k2) {
    const o = { L: 4.96, W: 1.97, xAv: 1.5, xAr: -1.4, rAv: 0.35, rAr: 0.36, hAile: 0.82, hNez: 0.5, hCul: 0.92, H: 1.36, cab: [-2.2, -0.8, 0.3, 1.1], wCab: 0.74, n: 3.4, lunette: true };
    const s = sportive(o, k1, k2);
    details(s, { nom: "PORSCHE", feux: "barre", feuxY: 0.82, leds: [[0.04, -0.04, 0.07, 0.07], [-0.04, -0.04, 0.07, 0.07], [0.04, 0.04, 0.07, 0.07], [-0.04, 0.04, 0.07, 0.07]], phareL: 0.22, phareH: 0.22, phareX: 0.35, echappements: [], grilleY: 0.25, grilleL: 1.1 });
    portiere(s.caisse, s.c, -0.85, -1.4, 0.28, 0.76, false); // 4 portes
    return finir(s, { jantes: "turbine", etrier: [0.95, 0.75, 0.1] }, 1.15);
  }

  // ================================================================ 🏎️ LES SUPERCARS
  // 🇮🇹 Ferrari SF90 Stradale (4,71 m × 1,97 m × 1,19 m) : hybride, très basse, les phares en fente, 2 feux ronds de chaque côté.
  function ferrariSF90(k1, k2) {
    const o = { L: 4.71, W: 1.97, xAv: 1.37, xAr: -1.28, rAv: 0.34, rAr: 0.36, hAile: 0.8, hNez: 0.32, hCul: 0.95, H: 1.19, cab: [-1.6, -0.55, 0.15, 1.0], wCab: 0.66, n: 3.6, matiereToit: null };
    const s = sportive(o, k1, k2);
    details(s, { nom: "FERRARI", feux: "ronds", feuxY: 0.78, leds: [[0, 0, 0.36, 0.03]], phareH: 0.1, prise: [-1.05, -0.5, 0.35, 0.68], grilleY: 0.22, grilleL: 1.2, echappements: [-0.22, 0.22], aileron: 0, hCul: 0.95 });
    return finir(s, { jantes: "etoile", etrier: [0.95, 0.75, 0.1] }, 1.0);
  }
  // 🇬🇧 McLaren 720S (4,54 m × 1,93 m × 1,20 m) : la cabine-bulle, les « orbites » noires autour des phares.
  function mcLaren720S(k1, k2) {
    const o = { L: 4.54, W: 1.93, xAv: 1.34, xAr: -1.33, rAv: 0.33, rAr: 0.35, hAile: 0.78, hNez: 0.35, hCul: 0.92, H: 1.2, cab: [-1.7, -0.5, 0.2, 1.0], wCab: 0.64, n: 3.2, lunette: true };
    const s = sportive(o, k1, k2);
    for (const cote of [-1, 1]) {
      const orbite = surLeDessus(plat(0.5, 0.26, M.noir, 0.01), s.c, s.L2 - 0.42, cote * (s.W2 - 0.34), 0.002);
      orbite.rotateY(cote * 0.3);
      s.caisse.add(orbite);
    }
    details(s, { nom: "McLAREN", feux: "deux", feuxY: 0.75, prise: [-1.1, -0.55, 0.3, 0.7], leds: [[0.05, 0, 0.12, 0.04], [-0.06, 0, 0.12, 0.04]], aileron: 1.0, hCul: 0.92, matiereAileron: peinture(k1), echappements: [0] });
    return finir(s, { jantes: "y", etrier: [0.95, 0.4, 0.05] }, 1.0);
  }
  // 🇫🇷 Bugatti Bolide (4,76 m × 2,0 m × 1,0 m) : une voiture de course, sans rétroviseurs normaux, avec la prise d'air
  // en forme de « X » sur le toit, l'aileron géant et le fer à cheval.
  function bolide(k1, k2) {
    const o = { L: 4.76, W: 2.0, xAv: 1.4, xAr: -1.35, rAv: 0.34, rAr: 0.36, hAile: 0.72, hNez: 0.26, hCul: 0.8, H: 1.0, cab: [-1.5, -0.6, 0.1, 0.85], wCab: 0.52, n: 4.4, matiereToit: peinture([0.08, 0.08, 0.09]) };
    const s = sportive(o, k1, [0.08, 0.08, 0.09]);
    const { caisse, c } = s;
    const ecope = boite(1.0, 0.18, 0.16, peinture([0.08, 0.08, 0.09]), -1.1, 1.05, 0); // la prise d'air sur le toit
    caisse.add(ecope);
    caisse.add(boite(0.08, 0.36, 0.5, peinture([0.08, 0.08, 0.09]), -2.1, 0.92, 0)); // la dérive
    const fer = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 24, Math.PI * 1.5), M.chrome);
    fer.rotation.set(0, Math.PI / 2, Math.PI * 1.25);
    fer.position.set(c.xMax + 0.01, 0.28, 0);
    caisse.add(fer);
    details(s, { nom: "BUGATTI", feux: "barre", feuxY: 0.66, leds: [[0.12, 0, 0.06, 0.06], [0.04, 0, 0.06, 0.06], [-0.04, 0, 0.06, 0.06], [-0.12, 0, 0.06, 0.06]], phareH: 0.1, prise: [-1.2, -0.5, 0.2, 0.6], aileron: 1.2, hCul: 0.8, echappements: [-0.08, 0.08] });
    return finir(s, { jantes: "turbine", etrier: [0.1, 0.35, 0.85] }, 0.9);
  }

  // ================================================================ 🇫🇷 LES FRANÇAISES
  // Alpine A110 (4,18 m × 1,80 m × 1,25 m) : petite et ronde, les 4 phares ronds, la croix sur la lunette arrière.
  function alpineA110(k1, k2) {
    const o = { L: 4.18, W: 1.8, xAv: 1.25, xAr: -1.17, rAv: 0.32, rAr: 0.32, hAile: 0.8, hNez: 0.5, hCul: 0.88, H: 1.25, cab: [-1.85, -0.6, 0.2, 1.0], wCab: 0.66, n: 3, lunette: true };
    const s = sportive(o, k1, k2);
    for (const cote of [-1, 1]) for (const dz of [0.25, 0.5]) {
      const ph = phareRond(0.07);
      ph.rotation.z = -Math.PI / 2 + 0.25;
      ph.position.set(s.c.xMax - 0.12, 0.6, cote * (s.W2 - dz));
      s.caisse.add(ph);
    }
    details(s, { nom: "ALPINE", phares: false, feux: "deux", feuxY: 0.75, grilleY: 0.3, grilleL: 0.8, echappements: [0] });
    return finir(s, { jantes: "fins" }, 1.05);
  }
  // Renault 5 E-Tech (3,92 m × 1,77 m × 1,50 m) : la nouvelle « R5 » électrique, carrée, avec ses phares rectangulaires
  // et la prise de recharge sur le capot.
  function renault5(k1, k2) {
    const b = berline({ L: 3.92, W: 1.77, xAv: 1.25, xAr: -1.29, r: 0.33, hCapot: 0.86, hCeinture: 0.97, hToit: 1.5, hNez: 0.74, arriere: "hayon", plaque: "R5-ETECH", couleur2Toit: true, deuxPortes: false, style: "etoile" }, k1, k2);
    const { caisse, c } = b;
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 0.68, cote * 0.55, 0.12, 0.28, [[0, 0, 0.08, 0.24], [0.05, 0, 0.012, 0.26]]);
      optiqueAuBout(caisse, c, false, 0.86, cote * 0.6, 0.2, 0.08, [[0, 0, 0.16, 0.05]], "feu");
    }
    caisse.add(surLeDessus(plat(0.14, 0.05, M.led, 0.01), c, 1.5, 0.3, 0.004)); // le témoin de recharge
    lettres(caisse, c, true, 0.5, 0, "5", 0.12, 0.12);
    lettres(caisse, c, false, 0.72, 0, "R5", 0.2, 0.06);
    return voiture(b.g, caisse, b.roues, b.yCapot);
  }
  // Citroën 2CV (3,83 m × 1,48 m × 1,60 m) : construite à la main ! Une petite voiture haute et ronde, ses ailes
  // séparées, ses phares ronds posés sur le capot, son toit en toile, son capot ondulé.
  function citroen2CV(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.2, r: 0.33, l: 0.14, j: 0.2 }, { x: -1.18, r: 0.33, l: 0.14, j: 0.2 }];
    const mat = peinture(k1);
    const c = coque(caisse, {
      cles: [
        { x: -1.92, yb: 0.42, yc: 0.62, yt: 0.66, w: 0.58, wl: 0.55, n: 2.2 },
        { x: -1.75, yb: 0.32, yc: 0.85, yt: 1.05, w: 0.66, wl: 0.62, n: 2.2 },
        { x: -1.2, yb: 0.3, yc: 0.9, yt: 1.2, w: 0.68, wl: 0.64, n: 2.2 },
        { x: 0.0, yb: 0.3, yc: 0.9, yt: 1.2, w: 0.68, wl: 0.64, n: 2.2 },
        { x: 0.75, yb: 0.32, yc: 0.86, yt: 1.0, w: 0.66, wl: 0.62, n: 2.2 },
        { x: 1.35, yb: 0.36, yc: 0.78, yt: 0.86, w: 0.52, wl: 0.48, n: 2.2 },
        { x: 1.88, yb: 0.42, yc: 0.62, yt: 0.66, w: 0.4, wl: 0.38, n: 2 },
      ],
    }, mat);
    // la cabine ronde, avec son toit en toile
    coque(caisse, {
      cles: [
        { x: -1.55, yb: 1.05, yc: 1.07, yt: 1.12, w: 0.6, n: 2.4 },
        { x: -1.25, yb: 1.08, yc: 1.1, yt: 1.48, w: 0.64, wt: 0.5, rt: 0.2 },
        { x: -0.2, yb: 1.08, yc: 1.1, yt: 1.6, w: 0.66, wt: 0.52, rt: 0.2 },
        { x: 0.45, yb: 1.06, yc: 1.08, yt: 1.55, w: 0.65, wt: 0.5, rt: 0.18 },
        { x: 0.72, yb: 1.0, yc: 1.02, yt: 1.04, w: 0.62, wt: 0.55, rt: 0.06 },
      ],
      vitre: regleVitres({ pareBrise: [0.45, 0.8], av: 0.45, ar: -1.1, montants: [-0.35], lunette: [-1.5, -1.2], pilier: 0.06 }),
    }, mat);
    caisse.add(boite(1.1, 0.02, 0.9, new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.95 }), -0.5, 1.605, 0)); // la capote en toile
    // les ailes rondes, séparées de la caisse, au-dessus de chaque roue
    for (const r of R) for (const cote of [-1, 1]) {
      const aile = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      aile.scale.set(1.25, 0.95, 0.5);
      aile.position.set(r.x, 0.48, cote * 0.68);
      aile.castShadow = true;
      caisse.add(aile);
    }
    // le capot ondulé, les phares ronds sur leur pied, la petite calandre
    for (let i = -2; i <= 2; i++) caisse.add(surLeDessus(plat(0.6, 0.02, M.chrome, 0.012), c, 1.25, i * 0.09, 0.004));
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.1);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(1.62, 0.92, cote * 0.45);
      caisse.add(ph);
      caisse.add(boite(0.08, 0.12, 0.04, mat, 1.55, 0.83, cote * 0.45));
      const feu = cylindre(0.05, 0.03, M.feuLed, 16);
      feu.rotation.z = Math.PI / 2;
      feu.position.set(c.xMin - 0.01, 0.8, cote * 0.45);
      caisse.add(feu);
    }
    grille(caisse, c, true, 0.6, 0, 0.16, 0.36, M.chrome);
    auBout(caisse, c, true, 0.42, 0, 0.06, 1.3, M.chrome, 0.06);
    auBout(caisse, c, false, 0.45, 0, 0.06, 1.3, M.chrome, 0.06);
    lettres(caisse, c, false, 0.62, 0, "2CV", 0.22, 0.06);
    retros(caisse, 0.6, 1.1, 0.64, 0.7, M.chrome, 0.8);
    const roues = quatreRoues(g, R, 0.62, { style: "acier", metal: M.jante });
    return voiture(g, caisse, roues, 1.5);
  }

  // ================================================================ 🚙 LES TOUT-TERRAIN
  // Land Rover Defender (4,76 m × 2,0 m × 1,97 m) : carré, les petits phares ronds, la roue de secours sur le hayon.
  function defender(k1, k2) {
    const s = toutTerrain({ L: 4.76, W: 2.0, xAv: 1.5, xAr: -1.5, r: 0.41, hCeinture: 1.12, hCapot: 1.06, H: 1.97, cab: [-2.25, 0.75], roueSecours: true, toit: true, carre: true }, k1, k2);
    const { caisse, c, W2 } = s;
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.1);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.01, 0.92, cote * (W2 - 0.3));
      caisse.add(ph);
      optiqueAuBout(caisse, c, false, 0.95, cote * (W2 - 0.15), 0.1, 0.1, [[0, 0, 0.07, 0.07]], "feu");
    }
    grille(caisse, c, true, 0.9, 0, 0.18, 0.9, M.plastique);
    lettres(caisse, c, true, 1.04, 0, "DEFENDER", 0.6, 0.06);
    return voiture(s.g, s.caisse, s.roues, 1.8);
  }
  // Jeep Wrangler (4,33 m × 1,89 m × 1,84 m) : la calandre à 7 fentes, les gros phares ronds, les ailes à l'air.
  function wrangler(k1, k2) {
    const s = toutTerrain({ L: 4.33, W: 1.89, xAv: 1.37, xAr: -1.36, r: 0.42, hCeinture: 1.05, hCapot: 1.02, H: 1.84, cab: [-2.05, 0.65], roueSecours: true, carre: true, jantes: "etoile" }, k1, k2);
    const { caisse, c, W2 } = s;
    for (let i = -3; i <= 3; i++) caisse.add(boite(0.02, 0.3, 0.06, M.noir, c.xMax + 0.005, 0.86, i * 0.11)); // les 7 fentes
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.12);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.015, 0.86, cote * 0.56);
      caisse.add(ph);
      optiqueAuBout(caisse, c, false, 0.8, cote * (W2 - 0.1), 0.24, 0.1, [[0, 0, 0.2, 0.07]], "feu");
    }
    lettres(caisse, c, false, 1.0, 0.5, "JEEP", 0.3, 0.07);
    return voiture(s.g, s.caisse, s.roues, 1.7);
  }
  // Ford F-150 Raptor (5,9 m × 2,2 m × 2,0 m) : un énorme pick-up, la calandre FORD en grandes lettres, la benne.
  function raptor(k1, k2) {
    const s = toutTerrain({ L: 5.9, W: 2.2, xAv: 1.95, xAr: -1.85, r: 0.45, hCeinture: 1.25, hCapot: 1.25, H: 2.0, cab: [-0.6, 1.25], benne: true, jantes: "doubles" }, k1, k2);
    const { caisse, c, W2 } = s;
    grille(caisse, c, true, 1.0, 0, 0.36, 1.5, M.plastique);
    lettres(caisse, c, true, 1.0, 0, "FORD", 1.0, 0.2, "#e6e8ec", "bold 54px 'Arial Black', sans-serif");
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 1.08, cote * (W2 - 0.22), 0.16, 0.34, [[0, 0, 0.1, 0.3], [0.06, 0, 0.012, 0.3]]);
      optiqueAuBout(caisse, c, false, 1.0, cote * (W2 - 0.08), 0.42, 0.1, [[0, 0, 0.38, 0.07]], "feu");
    }
    for (const z of [-0.3, -0.1, 0.1, 0.3]) caisse.add(boite(0.06, 0.04, 0.12, M.feuLed, 0.6, 2.02, z)); // les feux orange sur le toit
    return voiture(s.g, s.caisse, s.roues, 1.9);
  }

  // ================================================================ ✨ LES VOITURES DE RÊVE
  // Tesla Cybertruck (5,7 m × 2,2 m × 1,9 m) : construit à la main, en ACIER, tout en angles : son profil est un
  // triangle (le nez monte tout droit jusqu'au sommet du toit, puis le toit redescend jusqu'à l'arrière).
  function cybertruck(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const acier = inox(), L2 = 2.85, W2 = 1.06;
    const profil = new THREE.Shape([new THREE.Vector2(-L2, 0.5), new THREE.Vector2(L2, 0.5), new THREE.Vector2(L2, 1.02), new THREE.Vector2(0.15, 1.9), new THREE.Vector2(-L2, 1.28)]);
    const corps = new THREE.Mesh(new THREE.ExtrudeGeometry(profil, { depth: 2 * W2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }), acier);
    corps.position.z = -W2;
    corps.castShadow = true;
    caisse.add(corps);
    // les vitres : le pare-brise (sur la pente du nez) et les fenêtres de côté, en verre sombre
    const verre = new THREE.MeshStandardMaterial({ color: 0x0c1218, roughness: 0.08, metalness: 0.6 });
    const pente = Math.atan2(1.9 - 1.02, 0.15 - L2), lPB = Math.hypot(L2 - 0.15, 0.88) * 0.55;
    const pb = boite(lPB, 0.01, 2 * W2 - 0.25, verre, 0, 0, 0);
    pb.rotation.z = pente + Math.PI;
    pb.position.set(0.15 + (L2 - 0.15) * 0.28, 1.9 - 0.88 * 0.28 + 0.01, 0);
    caisse.add(pb);
    for (const cote of [-1, 1]) {
      const f = new THREE.Shape([new THREE.Vector2(-1.4, 1.3), new THREE.Vector2(1.1, 1.3), new THREE.Vector2(0.2, 1.78), new THREE.Vector2(-1.4, 1.5)]);
      const fen = new THREE.Mesh(new THREE.ShapeGeometry(f), verre);
      fen.position.z = cote * (W2 + 0.025);
      if (cote < 0) fen.rotation.y = Math.PI, fen.scale.x = -1;
      caisse.add(fen);
      // les passages de roues, en plastique noir et en angles
      for (const x of [1.85, -1.85]) {
        const arche = new THREE.Shape([new THREE.Vector2(x - 0.65, 0.5), new THREE.Vector2(x - 0.45, 0.95), new THREE.Vector2(x + 0.45, 0.95), new THREE.Vector2(x + 0.65, 0.5)]);
        const a = new THREE.Mesh(new THREE.ShapeGeometry(arche), M.plastique);
        a.position.z = cote * (W2 + 0.03);
        if (cote < 0) a.rotation.y = Math.PI, a.scale.x = -1;
        caisse.add(a);
      }
    }
    // la barre de lumière sur toute la largeur, devant et derrière
    caisse.add(boite(0.02, 0.03, 2 * W2, M.led, L2 + 0.02, 1.0, 0));
    caisse.add(boite(0.02, 0.04, 2 * W2, M.feuLed, -L2 - 0.02, 1.25, 0));
    caisse.add(boite(0.04, 0.4, 2 * W2 - 0.1, M.plastique, -L2 - 0.01, 0.75, 0));
    const c = { xMax: L2, xMin: -L2 };
    lettres(caisse, c, false, 1.05, 0, "CYBERTRUCK", 1.2, 0.08, "#2b2d30");
    const R = [{ x: 1.85, r: 0.44, l: 0.32, j: 0.32 }, { x: -1.85, r: 0.44, l: 0.32, j: 0.32 }];
    const roues = quatreRoues(g, R, W2 - 0.08, { style: "turbine", metal: new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.5, roughness: 0.4 }) });
    return voiture(g, caisse, roues, 1.75);
  }
  // La Batmobile : très longue, très basse et toute noire, avec la petite bulle du cockpit, deux grands ailerons en forme
  // d'ailes de chauve-souris, et un RÉACTEUR à l'arrière qui brille.
  function batmobile(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const noir = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0d, metalness: 0.5, roughness: 0.25, clearcoat: 1 });
    const R = [{ x: 1.9, r: 0.38, l: 0.32, j: 0.27 }, { x: -1.6, r: 0.4, l: 0.4, j: 0.28 }];
    const c = coque(caisse, {
      cles: [
        { x: -3.0, yb: 0.3, yc: 0.62, yt: 0.66, w: 0.62, wl: 0.6, n: 3 },
        { x: -2.6, yb: 0.2, yc: 0.82, yt: 0.86, w: 0.98, wl: 0.92, n: 3.5 },
        { x: -1.6, yb: 0.13, yc: 0.88, yt: 0.86, w: 1.05, wl: 0.95, n: 3.5 },
        { x: -0.4, yb: 0.12, yc: 0.8, yt: 0.82, w: 0.98, wl: 0.9, n: 3.2 },
        { x: 0.8, yb: 0.12, yc: 0.76, yt: 0.72, w: 0.95, wl: 0.88, n: 3 },
        { x: 1.9, yb: 0.13, yc: 0.78, yt: 0.62, w: 0.98, wl: 0.9, n: 3.2 },
        { x: 2.7, yb: 0.15, yc: 0.5, yt: 0.44, w: 0.8, wl: 0.74, n: 2.8 },
        { x: 3.1, yb: 0.22, yc: 0.32, yt: 0.32, w: 0.45, wl: 0.42, n: 2.2 },
      ],
      arches: arches(R, 0.85),
    }, noir);
    coque(caisse, {
      cles: [
        { x: -1.1, yb: 0.8, yc: 0.82, yt: 0.86, w: 0.32, n: 2.2 },
        { x: -0.6, yb: 0.79, yc: 0.81, yt: 1.12, w: 0.48, wt: 0.3, rt: 0.12 },
        { x: 0.0, yb: 0.78, yc: 0.8, yt: 1.16, w: 0.5, wt: 0.3, rt: 0.12 },
        { x: 0.5, yb: 0.76, yc: 0.78, yt: 0.95, w: 0.46, wt: 0.3, rt: 0.08 },
        { x: 0.95, yb: 0.73, yc: 0.75, yt: 0.76, w: 0.38, wt: 0.3, rt: 0.04 },
      ],
      vitre: regleVitres({ pareBrise: [-0.1, 1.0], av: 0.9, ar: -1.0, montants: [], lunette: [-1.0, -0.3], pilier: 0.04 }),
    }, noir);
    // les deux ailerons « ailes de chauve-souris »
    for (const cote of [-1, 1]) {
      const aile = new THREE.Shape([new THREE.Vector2(-1.2, 0), new THREE.Vector2(-3.05, 0), new THREE.Vector2(-3.25, 0.75), new THREE.Vector2(-2.85, 0.55), new THREE.Vector2(-2.55, 0.7), new THREE.Vector2(-2.3, 0.45)]);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(aile, { depth: 0.04, bevelEnabled: false }), noir);
      m.position.set(0, 0.78, cote * 0.82 - 0.02);
      m.castShadow = true;
      caisse.add(m);
    }
    // le réacteur, avec sa flamme orange qui brille
    const tuyere = cylindre(0.24, 0.4, M.noir, 24);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(-3.05, 0.5, 0);
    caisse.add(tuyere);
    const flamme = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 2 }));
    flamme.rotation.y = -Math.PI / 2;
    flamme.position.set(-3.26, 0.5, 0);
    caisse.add(flamme);
    // les phares en fente, et la chauve-souris sur le nez
    for (const cote of [-1, 1]) caisse.add(surLeDessus(optique(0.5, 0.06, [[0, 0, 0.46, 0.03]]), c, 2.75, cote * 0.42, 0.003));
    lettres(caisse, c, true, 0.3, 0, "🦇", 0.3, 0.3, "#f5c518");
    const roues = quatreRoues(g, R, 0.85, { style: "turbine", metal: new THREE.MeshStandardMaterial({ color: 0x18181a, metalness: 0.6, roughness: 0.35 }) });
    return voiture(g, caisse, roues, 1.0);
  }
  // DeLorean DMC-12 (4,27 m × 1,99 m × 1,14 m) : la voiture à remonter le temps ! En acier brossé, toute en coin, avec
  // les lamelles noires sur la lunette arrière et les portes en « ailes de mouette ».
  function delorean(k1, k2) {
    const o = { L: 4.27, W: 1.99, xAv: 1.26, xAr: -1.15, rAv: 0.33, rAr: 0.36, hAile: 0.78, hNez: 0.55, hCul: 0.86, H: 1.14, cab: [-1.6, -0.5, 0.15, 0.95], wCab: 0.72, n: 6, matiere: inox(), matiereToit: inox() };
    const s = sportive(o, k1, k2);
    const { caisse, c } = s;
    for (let i = 0; i < 7; i++) caisse.add(surLeDessus(plat(0.05, 1.2, M.noir, 0.02), c, -1.25 + i * 0.1, 0, 0.03)); // les lamelles
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 0.5, cote * 0.6, 0.12, 0.3, [[0, 0.06, 0.08, 0.08], [0, -0.06, 0.08, 0.08]]);
      optiqueAuBout(caisse, c, false, 0.72, cote * 0.6, 0.18, 0.4, [[0, 0, 0.14, 0.36]], "feu");
      ligneFlanc(caisse, c, [[1.9, 0.46], [0, 0.44], [-2.0, 0.46]], 0.02, M.noir, cote); // la bande noire du bas
    }
    grille(caisse, c, true, 0.48, 0, 0.12, 0.7, M.plastique);
    lettres(caisse, c, false, 0.55, 0, "DMC", 0.32, 0.07);
    return finir(s, { jantes: "turbine" }, 1.0);
  }

  Circuit.Modeles.ajouter({ audiR8, mercedesG, bmwM3, taycan, ferrariSF90, mcLaren720S, bolide, alpineA110, renault5, citroen2CV, defender, wrangler, raptor, cybertruck, batmobile, delorean });
  return { sportive, toutTerrain };
})();
