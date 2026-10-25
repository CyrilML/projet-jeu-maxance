// 🏭 LES CHARS DE 1944 EN 3D : l'usine de l'Union et de la Ligue (demande 115, édition « Seconde Guerre mondiale »)
//
// ✍️ « Chars Sherman / Tiger » → deux chars INVENTÉS, inspirés de ceux de 1944 :
//   - le CHAR MOYEN « BISON » (Aldermont) : une caisse haute aux flancs droits, le grand glacis arrondi devant, la
//     tourelle COULÉE toute ronde avec son masque de canon, les galets groupés par paires sur leurs bogies, l'étoile
//     inventée de l'Union (un anneau vert et blanc) sur les flancs ;
//   - le CHAR LOURD « MAMMOUTH » (Varnhold) : tout en grandes plaques carrées soudées, les grandes roues entrelacées,
//     l'énorme tourelle en boîte, le très long canon et son frein de bouche à deux chambres, le losange de la Ligue.
// Mêmes réponses que les autres tanks (affichage/chars3d.js) ; les chenilles et les plaques viennent de l'usine de 1916.

window.Tanks = window.Tanks || {};

(function () {
  const C3 = Tanks.Chars3D, O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, U = Tanks.Chars1916, C = C3.C;
  function canonLong(fiche, T, rayon, frein) {
    const canon = new THREE.Group(), t = cylindre(rayon * 0.85, rayon, fiche.canon, T, 12, C.acier);
    couche(t, "x", fiche.canon / 2 + 0.2, 0, 0);
    canon.add(t);
    if (frein) for (const dx of [0, 0.18]) canon.add(couche(cylindre(rayon * 1.9, rayon * 1.9, 0.12, T, 12, C.acier), "x", fiche.canon + 0.12 + dx, 0, 0));
    const bout = new THREE.Object3D();
    bout.position.set(fiche.canon + (frein ? 0.42 : 0.25), 0, 0);
    canon.add(bout);
    return { canon, bout };
  }
  function galets(caisse, T, xs, y, r, z, coul) {
    for (const s of [-1, 1]) for (const x of xs) caisse.add(couche(cylindre(r, r, 0.22, T, 14, coul), "z", x, y, s * z));
  }

  // ------------------------------------------------------------------ LE CHAR MOYEN M-44 « BISON »
  C3.ajouterModele("bison", (fiche, equipe) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, T = C3.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur, H = fiche.hauteur, zc = 1.08;
    const contour = [[L / 2 - 0.1, 0.95], [L / 2 + 0.05, 0.62], [L / 2 - 0.3, 0.12], [-L / 2 + 0.4, 0.06], [-L / 2 + 0.05, 0.4], [-L / 2 + 0.2, 0.86]];
    const ch = U.chenilles(g, contour, 0.42, zc, 0.12);
    for (const x of [-1.95, -1.55, -0.3, 0.1, 1.35, 1.75]) for (const s of [-1, 1]) caisse.add(couche(cylindre(0.3, 0.3, 0.12, T, 12, E.vertFonce), "z", x, 0.36, s * (zc + 0.24)));
    for (const x of [-1.75, 0.0 - 0.1, 1.55]) for (const s of [-1, 1]) caisse.add(boite(0.55, 0.28, 0.14, T, x, 0.55, s * (zc + 0.2), E.vert)); // les bogies
    caisse.add(boite(L - 0.6, 1.0, 2.3, P, -0.3, 1.45, 0)); // la caisse
    const glacis = boite(1.5, 0.12, 2.3, P, L / 2 - 0.9, 1.55, 0);
    glacis.rotation.z = -0.95;
    caisse.add(glacis);
    caisse.add(couche(cylindre(0.55, 0.55, 2.3, P, 12), "z", L / 2 - 0.55, 0.85, 0)); // le nez arrondi (la boîte de transmission)
    for (const s of [-1, 1]) U.embleme(caisse, E, -0.5, 1.45, s * 1.16, 0.28, s);
    caisse.add(boite(0.9, 0.1, 1.6, T, -L / 2 + 0.7, 1.98, 0, E.vertFonce)); // la plage arrière
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.1, 1.95, 0);
    const coque = O.piece(new THREE.SphereGeometry(0.95, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), P, 0, 0.05, 0);
    coque.scale.set(1.15, 0.72, 0.95);
    tourelle.add(coque, cylindre(0.95, 0.98, 0.12, P, 14).translateY(0.04), boite(0.35, 0.45, 0.8, P, 1.0, 0.35, 0)); // la coupole, le masque
    tourelle.add(cylindre(0.28, 0.3, 0.2, T, 10, E.vertFonce).translateX(-0.3).translateY(0.74).translateZ(0.3)); // la tourelle du chef
    tourelle.add(couche(cylindre(0.03, 0.03, 0.8, T, 6, C.noir), "x", -0.1, 0.95, 0.3)); // la mitrailleuse de toit
    const { canon, bout } = canonLong(fiche, T, 0.07, false);
    canon.position.set(1.0, 0.35, 0);
    tourelle.add(canon);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, canon]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.5 };
  });

  // ------------------------------------------------------------------ LE CHAR LOURD VK-6 « MAMMOUTH »
  C3.ajouterModele("mammouth", (fiche, equipe) => {
    const E = C3.outils.matsEquipe(equipe), P = E.peinture, T = C3.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L = fiche.longueur, zc = 1.45;
    const contour = [[L / 2 - 0.05, 1.05], [L / 2 + 0.1, 0.7], [L / 2 - 0.35, 0.1], [-L / 2 + 0.4, 0.08], [-L / 2 + 0.05, 0.5], [-L / 2 + 0.25, 0.95]];
    const ch = U.chenilles(g, contour, 0.62, zc, 0.12);
    for (let k = 0; k < 8; k++) for (const s of [-1, 1]) caisse.add(couche(cylindre(0.4, 0.4, 0.1, T, 14, E.vertFonce), "z", -L / 2 + 0.75 + k * 0.62, 0.48, s * (zc + 0.32 - (k % 2) * 0.1))); // les grandes roues entrelacées
    caisse.add(boite(L - 0.3, 0.95, 3.55, P, 0, 1.55, 0)); // la caisse, toute en plaques
    const devant = boite(0.35, 0.9, 3.5, P, L / 2 - 0.2, 1.5, 0);
    devant.rotation.z = -0.15;
    caisse.add(devant);
    for (const s of [-1, 1]) U.embleme(caisse, E, 0.3, 1.5, s * 1.79, 0.3, s);
    for (const s of [-1, 1]) caisse.add(boite(0.03, 0.06, 0.25, T, L / 2 + 0.14, 1.75, s * 0.7, C.noir)); // les fentes du pilote et du radio
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.2, 2.03, 0);
    tourelle.add(boite(2.9, 0.95, 2.6, P, 0, 0.47, 0)); // la tourelle en boîte
    tourelle.add(boite(0.5, 0.75, 1.0, P, 1.55, 0.42, 0)); // le masque
    tourelle.add(cylindre(0.38, 0.4, 0.28, T, 12, E.vertFonce).translateX(-0.75).translateY(1.05).translateZ(0.55)); // la coupole du chef
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) tourelle.add(couche(cylindre(0.05, 0.05, 0.25, T, 6, C.noir), "x", 0.7 + k * 0.08 - 0.08, 0.7, s * 1.33)); // les lance-fumigènes
    const { canon, bout } = canonLong(fiche, T, 0.09, true);
    canon.position.set(1.7, 0.45, 0);
    tourelle.add(canon);
    g.add(tourelle);
    for (const grp of [caisse, tourelle, canon]) for (const x of souder(grp, true)) grp.add(x);
    return { g, caisse, tourelle, canon, roues: [], rouesFixes: null, chenilles: ch.mats, chenillesImages: [], maillons: null, bouche: bout, peinture: P, pasChenille: 0.5 };
  });
})();
