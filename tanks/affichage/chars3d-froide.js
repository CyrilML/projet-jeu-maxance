// 🏭 LES CHARS DE LA GUERRE FROIDE EN 3D : l'usine d'Ostrel et de Khavar (demande 115, édition « Guerre froide »)
//
// ✍️ « Chars des années 70 » → deux chars INVENTÉS, inspirés de ceux des années 1970 :
//   - le « GRIZZLY » (Ostrel) : une caisse haute au nez en pointe, la grande tourelle COULÉE en ogive (longue devant), la
//     grosse COUPOLE du chef avec sa mitrailleuse, le PROJECTEUR rond au-dessus du canon, 6 galets et les rouleaux
//     porteurs, le panier à l'arrière de la tourelle, l'emblème d'Ostrel (le triangle) ;
//   - le « SANGLIER » (Khavar) : très BAS, la tourelle en DÔME comme une demi-orange, le long canon lisse avec son
//     manchon au milieu, 5 grandes roues espacées, les 2 FÛTS d'essence à l'arrière, la roue dentée de Khavar.
// Mêmes réponses que les autres tanks (affichage/chars3d.js) ; les chenilles viennent de l'usine de 1916.

window.Tanks = window.Tanks || {};

(function () {
  const C3 = Tanks.Chars3D, O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, U = Tanks.Chars1916, C = C3.C;
  function canon(fiche, T, rayon, options) {
    const c = new THREE.Group(), t = cylindre(rayon * 0.9, rayon, fiche.canon, T, 12, C.acier);
    couche(t, "x", fiche.canon / 2 + 0.2, 0, 0);
    c.add(t);
    if (options.manchon) c.add(couche(cylindre(rayon * 1.7, rayon * 1.7, 0.7, T, 12, C.acier), "x", options.manchon, 0, 0)); // l'évacuateur de fumée
    if (options.bouche) c.add(couche(cylindre(rayon * 1.3, rayon * 1.1, 0.25, T, 12, C.acier), "x", fiche.canon + 0.1, 0, 0));
    const bout = new THREE.Object3D();
    bout.position.set(fiche.canon + 0.3, 0, 0);
    c.add(bout);
    return { canon: c, bout };
  }

  // ------------------------------------------------------------------ LE CHAR M-68 « GRIZZLY »
  C3.ajouterModele("grizzly", (fiche, equipe) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, T = C3.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur, zc = 1.42;
    const contour = [[L / 2 - 0.2, 1.0], [L / 2 + 0.05, 0.62], [L / 2 - 0.45, 0.08], [-L / 2 + 0.45, 0.08], [-L / 2 + 0.05, 0.55], [-L / 2 + 0.25, 1.0]];
    const ch = U.chenilles(g, contour, 0.62, zc, 0.12);
    for (let k = 0; k < 6; k++) for (const s of [-1, 1]) caisse.add(couche(cylindre(0.36, 0.36, 0.2, T, 14, E.vertFonce), "z", -L / 2 + 0.95 + k * 0.98, 0.4, s * (zc + 0.08))); // les galets
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) caisse.add(couche(cylindre(0.12, 0.12, 0.2, T, 8, C.noir), "z", -L / 2 + 1.6 + k * 1.6, 1.0, s * (zc + 0.08))); // les rouleaux porteurs
    caisse.add(boite(L - 1.2, 0.85, 3.3, P, -0.25, 1.45, 0)); // la caisse
    const glacis = boite(1.6, 0.14, 3.3, P, L / 2 - 1.15, 1.6, 0);
    glacis.rotation.z = -0.32;
    caisse.add(glacis);
    const bas = boite(0.9, 0.14, 3.3, P, L / 2 - 0.55, 1.05, 0);
    bas.rotation.z = 0.85;
    caisse.add(bas);
    for (const s of [-1, 1]) caisse.add(boite(L - 0.4, 0.06, 0.62, P, 0, 1.9, s * 1.6)); // les garde-boue
    for (const s of [-1, 1]) U.embleme(caisse, E, -0.7, 1.45, s * 1.66, 0.3, s);
    caisse.add(boite(1.1, 0.25, 2.6, T, -L / 2 + 0.85, 1.98, 0, E.vertFonce)); // la plage arrière (le moteur)
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.3, 1.88, 0);
    // la tourelle coulée en ogive : une demi-sphère étirée vers l'avant
    const coque = O.piece(new THREE.SphereGeometry(1.2, 18, 9, 0, Math.PI * 2, 0, Math.PI * 0.5), P, 0.15, 0, 0);
    coque.scale.set(1.55, 0.72, 1.05);
    tourelle.add(coque);
    tourelle.add(boite(0.9, 0.5, 1.9, P, -1.85, 0.32, 0)); // le panier arrière
    tourelle.add(boite(0.45, 0.62, 1.0, P, 1.75, 0.34, 0)); // le masque du canon
    tourelle.add(cylindre(0.45, 0.48, 0.42, T, 14, E.vertFonce).translateX(-0.35).translateY(0.98).translateZ(0.45)); // la grosse coupole du chef
    tourelle.add(couche(cylindre(0.04, 0.04, 1.0, T, 6, C.noir), "x", 0.25, 1.15, 0.45)); // sa mitrailleuse
    tourelle.add(couche(cylindre(0.3, 0.26, 0.38, T, 14, C.noir), "x", 1.7, 0.95, 0)); // le PROJECTEUR au-dessus du canon
    tourelle.add(couche(cylindre(0.26, 0.26, 0.02, T, 14, 0xd8dcc8), "x", 1.9, 0.95, 0)); // sa vitre
    tourelle.add(boite(0.4, 0.12, 0.4, T, 0.4, 0.88, -0.6, E.vertFonce)); // la trappe du chargeur
    const { canon: cn, bout } = canon(fiche, T, 0.085, { manchon: fiche.canon * 0.55, bouche: true });
    cn.position.set(1.95, 0.35, 0);
    tourelle.add(cn);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, cn]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon: cn, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.5 };
  });

  // ------------------------------------------------------------------ LE CHAR T-66 « SANGLIER »
  C3.ajouterModele("sanglier", (fiche, equipe) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, T = C3.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur, zc = 1.32;
    const contour = [[L / 2 - 0.15, 0.85], [L / 2 + 0.05, 0.55], [L / 2 - 0.5, 0.08], [-L / 2 + 0.5, 0.08], [-L / 2 + 0.02, 0.5], [-L / 2 + 0.2, 0.85]];
    const ch = U.chenilles(g, contour, 0.56, zc, 0.12);
    for (let k = 0; k < 5; k++) for (const s of [-1, 1]) caisse.add(couche(cylindre(0.42, 0.42, 0.2, T, 16, E.vertFonce), "z", -L / 2 + 1.05 + k * 1.12, 0.45, s * (zc + 0.08))); // les 5 grandes roues espacées
    caisse.add(boite(L - 1.0, 0.65, 3.1, P, -0.25, 1.28, 0)); // la caisse, très basse
    const glacis = boite(1.7, 0.12, 3.1, P, L / 2 - 1.1, 1.34, 0);
    glacis.rotation.z = -0.24;
    caisse.add(glacis);
    for (const s of [-1, 1]) caisse.add(boite(L - 0.3, 0.05, 0.55, P, 0, 1.62, s * 1.5)); // les garde-boue
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) caisse.add(boite(0.7, 0.32, 0.4, T, -0.9 + k * 0.85, 1.82, s * 1.45, E.vert)); // les réservoirs sur les garde-boue
    for (const s of [-1, 1]) U.embleme(caisse, E, -1.2, 1.3, s * 1.56, 0.26, s);
    for (const s of [-1, 1]) caisse.add(couche(cylindre(0.3, 0.3, 0.95, T, 12, 0x4a4c3c), "z", -L / 2 + 0.1, 1.55, s * 0.6)); // les 2 FÛTS d'essence à l'arrière
    const tourelle = new THREE.Group();
    tourelle.position.set(0.2, 1.6, 0);
    const dome = O.piece(new THREE.SphereGeometry(1.25, 18, 9, 0, Math.PI * 2, 0, Math.PI * 0.5), P, 0, 0, 0); // la tourelle en dôme
    dome.scale.set(1.05, 0.62, 1.0);
    tourelle.add(dome);
    tourelle.add(boite(0.35, 0.45, 0.75, P, 1.25, 0.28, 0)); // le masque
    tourelle.add(cylindre(0.3, 0.32, 0.18, T, 12, E.vertFonce).translateX(-0.3).translateY(0.82).translateZ(-0.4)); // la trappe du chef
    tourelle.add(couche(cylindre(0.05, 0.05, 0.9, T, 6, C.noir), "x", 0.0, 0.92, 0.42)); // la mitrailleuse antiaérienne
    tourelle.add(couche(cylindre(0.13, 0.13, 0.3, T, 10, C.noir), "x", 1.0, 0.7, 0.55)); // le petit projecteur
    const { canon: cn, bout } = canon(fiche, T, 0.075, { manchon: fiche.canon * 0.5 });
    cn.position.set(1.4, 0.3, 0);
    tourelle.add(cn);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, cn]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon: cn, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.5 };
  });
})();
