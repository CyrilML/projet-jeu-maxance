// 🐢 LE TRANSPORT BLINDÉ « TORTUE » EN 3D (demande 115, édition « Guerre froide »)
//
// En Guerre froide, le camion qui amène 6 soldats au front devient un TRANSPORT BLINDÉ À CHENILLES (inventé, inspiré de
// ceux des années 70) : une grande BOÎTE d'aluminium aux flancs droits, le nez en pente avec la planche anti-vagues (il
// flotte !), les 5 grands galets de chaque côté, la coupole du chef avec sa grosse mitrailleuse et son bouclier, la
// RAMPE arrière, les sacs et les jerricans accrochés dehors, l'emblème du camp. Il répond comme le camion
// (affichage/vehicules3d.js) : les soldats assis sur le toit se voient quand il en transporte (comme en vrai : dedans,
// il fait trop chaud !).

window.Tanks = window.Tanks || {};

(function () {
  const O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, CT = Tanks.Chars3D.C;
  const couleurs = (equipe) => { const E = Tanks.CONFIG.equipes[String(equipe).split("~")[0]] || Tanks.CONFIG.equipes.bleus; return { base: new THREE.Color(E.camouflage[3]), clair: new THREE.Color(E.camouflage[1]), sombre: new THREE.Color(E.camouflage[2]), marque: E.marque }; }; // (la caisse : la couleur la plus claire du camouflage, l'aluminium peint)
  function tortue(equipe, sorte, simple) {
    const T = Tanks.Chars3D.materiaux().teinte, K = couleurs(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // les 2 chenilles : la boucle (l'image des patins) le long de tout le flanc, et les 5 grands galets
    const pat = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.outils.texturePatins(), roughness: 0.85, metalness: 0.4 });
    const contour = [[2.3, 0.75], [2.45, 0.45], [2.0, 0.03], [-2.0, 0.03], [-2.4, 0.4], [-2.3, 0.75]];
    for (const s of [-1, 1]) {
      caisse.add(Tanks.Chars1916.plaque(contour, 0.38, pat, s * 1.15, Tanks.Chars1916.retrecir(contour, 0.1)));
      if (!simple) for (let k = 0; k < 5; k++) caisse.add(couche(cylindre(0.31, 0.31, 0.2, T, 14, K.sombre), "z", -1.75 + k * 0.88, 0.36, s * 1.15));
      if (!simple) caisse.add(couche(cylindre(0.26, 0.26, 0.22, T, 12, CT.noir), "z", 2.15, 0.62, s * 1.15)); // le barbotin
    }
    // la caisse : une grande boîte, le nez en pente, la planche anti-vagues
    caisse.add(boite(4.1, 1.45, 2.5, T, -0.3, 1.43, 0, K.base));
    const nez = boite(1.15, 0.1, 2.5, T, 2.0, 1.55, 0, K.base);
    nez.rotation.z = -0.9;
    caisse.add(nez);
    caisse.add(boite(0.5, 0.6, 2.5, T, 1.95, 0.85, 0, K.base));
    const vague = boite(0.06, 0.5, 2.3, T, 2.48, 1.25, 0, K.clair); // la planche anti-vagues, rabattue sur le nez
    vague.rotation.z = -0.6;
    caisse.add(vague);
    caisse.add(boite(0.08, 1.3, 1.5, T, -2.37, 1.3, 0, K.clair)); // la rampe arrière (fermée)
    for (const s of [-1, 1]) caisse.add(couche(cylindre(0.36, 0.36, 0.03, T, 18, K.marque), "z", -0.4, 1.5, s * 1.27)); // l'emblème
    caisse.add(boite(0.5, 0.12, 0.55, T, 1.2, 2.2, 0.75, K.sombre)); // la trappe du pilote
    if (!simple) {
      // la coupole du chef, sa grosse mitrailleuse et son bouclier
      caisse.add(cylindre(0.42, 0.45, 0.25, T, 14, K.sombre).translateX(0.4).translateY(2.27).translateZ(-0.3));
      caisse.add(couche(cylindre(0.04, 0.04, 1.4, T, 8, CT.noir), "x", 1.2, 2.62, -0.3)); // le canon
      caisse.add(boite(0.4, 0.22, 0.2, T, 0.45, 2.58, -0.3, CT.noir)); // le boîtier
      caisse.add(boite(0.06, 0.55, 0.9, T, 0.85, 2.6, -0.3, K.base)); // le bouclier
      // les jerricans et les sacs accrochés dehors, l'antenne
      for (const z of [-0.6, 0.6]) caisse.add(boite(0.18, 0.42, 0.32, T, -2.45, 1.75, z, 0x4e5634));
      for (let k = 0; k < 3; k++) caisse.add(boite(0.6, 0.3, 0.42, T, -1.4 + k * 0.65, 2.3, 0.85, k % 2 ? 0x6e6648 : 0x5c5a3e)); // les sacs sur le toit
      caisse.add(O.tube([-1.9, 2.15, -1.0], [-1.9, 4.6, -1.0], 0.015, T, 4, CT.noir));
    }
    // (un char à chenilles ne braque pas ses roues : le groupe « braquage » est vide)
    const braque = new THREE.Group();
    braque.name = "braquage";
    g.add(braque);
    for (const m of souder(caisse, true)) caisse.add(m);
    // les soldats assis sur le toit (visibles quand il en transporte) : de simples silhouettes, casque et épaules
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    if (!simple) for (let k = 0; k < 6; k++) {
      const x = -0.4 - Math.floor(k / 2) * 0.75, z = (k % 2 ? 1 : -1) * 0.75;
      passagers.add(O.piece(new THREE.SphereGeometry(0.14, 8, 6), T, x, 2.85, z, CT.casque), boite(0.3, 0.45, 0.42, T, x, 2.5, z, K.clair));
    }
    for (const m of souder(passagers, true)) passagers.add(m);
    g.add(passagers);
    return { g };
  }
  function simple(equipe, sorte) {
    const { g } = tortue(equipe, sorte, true), tout = new THREE.Group();
    g.updateMatrixWorld(true);
    g.traverse((m) => {
      if (!m.isMesh) return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      p.userData.teinte = m.userData.teinte || (m.material.vertexColors ? undefined : new THREE.Color(0x26241f));
      tout.add(p);
    });
    return souder(tout, false)[0].geometry;
  }
  Tanks.Vehicules3D.ajouterModele("tortue", (equipe, sorte) => tortue(equipe, sorte, false), simple);
})();
