// 🏭 LES TANKS DE 1916 EN 3D : l'usine des premiers blindés (demande 115, édition « Première Guerre mondiale »)
//
// ✍️ « Tanks losanges. » Deux tanks INVENTÉS, inspirés des premiers chars de l'histoire :
//   - le LOSANGE R-16 « Taureau » : de profil, il a la forme d'un LOSANGE (d'un parallélogramme) : la chenille fait tout le
//     tour de chaque flanc, très haut devant, pour grimper les talus et franchir les tranchées. Sur chaque flanc, une
//     CASEMATE (un « sponson ») avec un canon court ; devant, la cabine du pilote avec ses fentes de vision ; sur le toit,
//     la petite tourelle d'observation (✍️ inventée : c'est elle qui tourne, avec son canon), la poutre de déblocage en
//     bois sur ses rails, le tuyau d'échappement, et l'emblème du camp peint sur le flanc ;
//   - le CHAR LÉGER L-17 « Fourmi » : la caisse étroite, la grande roue folle devant, la tourelle ronde qui tourne (avec
//     son petit canon et sa coupole en champignon), le moteur derrière et la QUEUE pour franchir les tranchées.
// Ils répondent comme les tanks modernes (affichage/chars3d.js) : la caisse, la tourelle qui tourne, le canon qui se
// lève, les deux chenilles dont l'image défile, et la bouche du canon. Comme tout l'affichage, ils ne font que dessiner.

window.Tanks = window.Tanks || {};

(function () {
  const C3 = Tanks.Chars3D, O = Tanks.Outils3D, { boite, cylindre, couche, tube, souder } = O;
  const C = C3.C;
  // Un profil (des points [x, y]) tiré sur une épaisseur (en z), centré en z0 ; « trou » : un profil plus petit dedans
  function plaque(points, ep, mat, z0, trou, teinte) {
    const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    if (trou) s.holes.push(new THREE.Path(trou.map(([x, y]) => new THREE.Vector2(x, y))));
    const g = new THREE.ExtrudeGeometry(s, { depth: ep, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1, curveSegments: 6 });
    g.translate(0, 0, z0 - ep / 2);
    return O.piece(g, mat, 0, 0, 0, teinte);
  }
  // Rétrécir un contour vers son centre de « d » m (pour l'intérieur de la chenille)
  function retrecir(points, d) {
    const cx = points.reduce((t, p) => t + p[0], 0) / points.length, cy = points.reduce((t, p) => t + p[1], 0) / points.length;
    return points.map(([x, y]) => { const l = Math.hypot(x - cx, y - cy) || 1; return [x - ((x - cx) / l) * d * 1.25, y - ((y - cy) / l) * d]; });
  }
  // Les 2 chenilles : la boucle (un anneau tiré) avec l'image des patins qui défile
  function chenilles(g, contour, ep, z, rayonInt) {
    const mats = [], images = [];
    for (const cote of [-1, 1]) {
      const mat = new THREE.MeshStandardMaterial({ map: C3.outils.texturePatins().clone(), roughness: 0.85, metalness: 0.45 });
      mat.map.needsUpdate = true;
      mat.map.repeat.set(0.5, 0.5);
      const m = plaque(contour, ep, mat, cote * z, retrecir(contour, rayonInt));
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      mats.push(mat);
      images.push(m);
    }
    return { mats, images };
  }
  // L'emblème inventé du camp (un disque à la couleur de sa marque, avec un anneau sombre), peint sur le flanc
  function embleme(groupe, E, x, y, z, r, cote) {
    const d = cylindre(r, r, 0.02, E.marque, 18);
    couche(d, "z", x, y, z);
    groupe.add(d);
    const a = cylindre(r * 0.55, r * 0.55, 0.025, C3.materiaux().teinte, 16, 0x1c1c1c);
    couche(a, "z", x, y, z + cote * 0.004);
    groupe.add(a);
  }

  Tanks.Chars1916 = { plaque, retrecir, chenilles, embleme }; // (demande 115 : prêtés aux tanks des éditions suivantes)
  // ------------------------------------------------------------------ LE LOSANGE R-16 « Taureau »
  C3.ajouterModele("losange", (fiche, equipe, numero) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, m = C3.materiaux(), T = m.teinte;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur, H = fiche.hauteur;
    // le contour du losange (la chenille), vu de profil, nez vers x+
    const contour = [[L / 2 - 0.25, H - 0.05], [L / 2, H - 0.55], [L / 2 - 0.2, H - 1.15], [L / 2 - 1.15, 0.12], [L / 2 - 1.6, 0.02], [-L / 2 + 0.75, 0.02], [-L / 2 + 0.25, 0.32], [-L / 2, 1.05], [-L / 2 + 0.35, H - 0.32], [-L / 2 + 0.9, H - 0.05]];
    const zc = 1.5, ep = 0.56;
    const ch = chenilles(g, contour, ep, zc, 0.28);
    // la plaque du flanc dans la chenille, avec ses rivets
    for (const s of [-1, 1]) {
      caisse.add(plaque(retrecir(contour, 0.27), ep - 0.06, P, s * zc));
      for (let x = -L / 2 + 0.9; x < L / 2 - 0.9; x += 0.5) for (const y of [0.55, H - 0.55]) caisse.add(boite(0.05, 0.05, 0.03, T, x, y, s * (zc + ep / 2 - 0.01), C.acier));
    }
    // la caisse entre les deux flancs
    caisse.add(boite(L - 2.0, H - 0.9, 2 * zc - ep, P, -0.15, H / 2 + 0.1, 0));
    caisse.add(boite(1.1, 0.75, 1.9, P, L / 2 - 1.15, H - 0.45, 0)); // la cabine du pilote, devant
    for (const dz of [-0.45, 0, 0.45]) caisse.add(boite(0.03, 0.05, 0.25, T, L / 2 - 0.59, H - 0.35, dz, C.noir)); // les fentes de vision
    // les CASEMATES (sponsons) sur les flancs, avec leur canon court et un petit bouclier
    for (const s of [-1, 1]) {
      const sp = boite(1.5, 1.05, 0.5, P, 0.35, 1.25, s * (zc + ep / 2 + 0.24));
      caisse.add(sp);
      const fuyant = boite(0.5, 1.05, 0.42, P, 1.15, 1.25, s * (zc + ep / 2 + 0.18));
      fuyant.rotation.y = s * 0.45;
      caisse.add(fuyant);
      const c = cylindre(0.06, 0.07, 1.0, T, 10, C.acier);
      couche(c, "x", 1.65, 1.3, s * (zc + ep / 2 + 0.3));
      caisse.add(c);
      caisse.add(boite(0.08, 0.36, 0.36, T, 1.2, 1.3, s * (zc + ep / 2 + 0.36), C.olive));
      for (const x of [-0.25, 0.85]) caisse.add(boite(0.03, 0.04, 0.2, T, x, 1.55, s * (zc + ep / 2 + 0.495), C.noir)); // les fentes
      caisse.add(boite(0.55, 0.85, 0.04, P, -1.6, 1.05, s * (zc + ep / 2 + 0.03))); // la porte
      embleme(caisse, E, -2.4, 1.3, s * (zc + ep / 2 + 0.012), 0.32, s);
    }
    // le toit : la poutre de déblocage (en bois) sur ses rails, l'échappement
    for (const s of [-1, 1]) caisse.add(tube([-L / 2 + 0.6, H + 0.02, s * 1.0], [L / 2 - 1.8, H + 0.02, s * 1.0], 0.04, T, 6, C.acier));
    caisse.add(boite(0.32, 0.3, 2.6, T, -L / 2 + 1.1, H + 0.2, 0, C.bois));
    caisse.add(tube([-0.6, H - 0.2, 0.6], [-0.6, H + 0.55, 0.6], 0.08, T, 8, 0x2a2622));
    caisse.add(tube([-0.6, H + 0.55, 0.6], [-1.3, H + 0.62, 0.6], 0.08, T, 8, 0x2a2622));
    // la petite TOURELLE d'observation (✍️ inventée : elle tourne), avec son canon court
    const tourelle = new THREE.Group(), canon = new THREE.Group();
    tourelle.position.set(0.45, H - 0.05, 0);
    tourelle.add(couche(cylindre(0.6, 0.66, 0.55, P, 10), "y", 0, 0.28, 0));
    tourelle.add(cylindre(0.62, 0.6, 0.08, T, 10, C.acier).translateY(0.58));
    tourelle.add(cylindre(0.24, 0.26, 0.2, T, 10, C.olive).translateY(0.7));
    tourelle.add(boite(0.04, 0.05, 0.35, T, 0.6, 0.42, 0, C.noir));
    canon.position.set(0.55, 0.3, 0);
    const tubeCanon = cylindre(0.065, 0.075, fiche.canon, T, 10, C.acier);
    couche(tubeCanon, "x", fiche.canon / 2, 0, 0);
    canon.add(tubeCanon, boite(0.18, 0.24, 0.3, T, 0.05, 0, 0, C.olive));
    const bout = new THREE.Object3D();
    bout.position.set(fiche.canon + 0.05, 0, 0);
    canon.add(bout);
    tourelle.add(canon);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, canon]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.35 };
  });

  // ------------------------------------------------------------------ LE CHAR LÉGER L-17 « Fourmi »
  C3.ajouterModele("fourmi", (fiche, equipe, numero) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, m = C3.materiaux(), T = m.teinte;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur;
    const contour = [[L / 2 - 0.15, 1.2], [L / 2, 0.85], [L / 2 - 0.35, 0.3], [L / 2 - 0.9, 0.02], [-L / 2 + 0.55, 0.02], [-L / 2 + 0.15, 0.2], [-L / 2 + 0.05, 0.62], [-L / 2 + 0.45, 0.95], [L / 2 - 1.3, 1.05]];
    const zc = 0.72, ep = 0.34;
    const ch = chenilles(g, contour, ep, zc, 0.2);
    for (const s of [-1, 1]) {
      caisse.add(plaque(retrecir(contour, 0.2), ep - 0.04, P, s * zc));
      for (let x = -L / 2 + 0.7; x < L / 2 - 0.7; x += 0.45) caisse.add(couche(cylindre(0.13, 0.13, 0.05, T, 10, C.acier), "z", x, 0.22, s * (zc + ep / 2)));
    }
    // la caisse étroite, son nez incliné, le capot du moteur derrière
    caisse.add(boite(L - 1.4, 0.95, 1.12, P, -0.25, 0.95, 0));
    const nez = boite(0.95, 0.12, 1.1, P, L / 2 - 0.85, 1.25, 0);
    nez.rotation.z = -0.55;
    caisse.add(nez);
    caisse.add(boite(0.7, 0.55, 1.1, P, L / 2 - 1.2, 1.0, 0));
    for (const dz of [-0.25, 0.25]) caisse.add(boite(0.03, 0.04, 0.18, T, L / 2 - 0.86, 1.18, dz, C.noir));
    const capot = boite(1.3, 0.2, 1.05, P, -L / 2 + 1.1, 1.38, 0);
    capot.rotation.z = 0.12;
    caisse.add(capot);
    for (let k = 0; k < 4; k++) caisse.add(boite(0.08, 0.03, 0.9, T, -L / 2 + 0.7 + k * 0.25, 1.49, 0, C.noir)); // les grilles
    // la QUEUE pour franchir les tranchées
    for (const s of [-1, 1]) caisse.add(tube([-L / 2 + 0.4, 0.95, s * 0.4], [-L / 2 - 0.55, 0.35, s * 0.4], 0.05, T, 6, E.vertFonce));
    caisse.add(tube([-L / 2 - 0.55, 0.35, -0.42], [-L / 2 - 0.55, 0.35, 0.42], 0.05, T, 6, E.vertFonce));
    for (const s of [-1, 1]) embleme(caisse, E, -0.6, 0.98, s * 0.565, 0.22, s);
    // la tourelle ronde (8 pans), sa coupole en champignon, son petit canon
    const tourelle = new THREE.Group(), canon = new THREE.Group();
    tourelle.position.set(0.35, 1.42, 0);
    tourelle.add(cylindre(0.46, 0.5, 0.7, P, 8).translateY(0.35));
    tourelle.add(cylindre(0.18, 0.2, 0.12, T, 8, C.olive).translateY(0.76));
    tourelle.add(cylindre(0.28, 0.05, 0.12, T, 10, C.olive).translateY(0.86));
    tourelle.add(boite(0.03, 0.04, 0.25, T, 0.46, 0.5, 0, C.noir));
    canon.position.set(0.45, 0.32, 0);
    const tubeCanon = cylindre(0.05, 0.06, fiche.canon, T, 10, C.acier);
    couche(tubeCanon, "x", fiche.canon / 2, 0, 0);
    canon.add(tubeCanon, boite(0.14, 0.2, 0.22, T, 0.02, 0, 0, C.olive));
    const bout = new THREE.Object3D();
    bout.position.set(fiche.canon + 0.04, 0, 0);
    canon.add(bout);
    tourelle.add(canon);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, canon]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.5 };
  });
})();
