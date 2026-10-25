// 🦡 LE VÉHICULE DE COMBAT D'INFANTERIE « GLOUTON » EN 3D (demande 115, édition « Europe de l'Est »)
//
// En Europe de l'Est, le camion qui amène 6 soldats au front devient un VÉHICULE DE COMBAT D'INFANTERIE (inventé,
// inspiré de ceux d'aujourd'hui) : une caisse basse à chenilles et au nez en coin, 6 galets de chaque côté, une petite
// TOURELLE avec son canon automatique long et fin, les lance-fumigènes, la porte arrière, des GRILLES anti-roquettes
// sur les flancs, une petite cage anti-drones au-dessus de la tourelle, les bidons et les sacs accrochés, et la peinture
// d'hiver à la chaux. Il répond comme le camion (affichage/vehicules3d.js) : les soldats assis sur le toit se voient
// quand il en transporte.

window.Tanks = window.Tanks || {};

(function () {
  const O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, CT = Tanks.Chars3D.C;
  const couleurs = (equipe) => { const E = Tanks.CONFIG.equipes[String(equipe).split("~")[0]] || Tanks.CONFIG.equipes.bleus; return { base: new THREE.Color(E.camouflage[0]), clair: new THREE.Color(E.camouflage[3]), sombre: new THREE.Color(E.camouflage[2]), gris: new THREE.Color(E.camouflage[1]), marque: E.marque }; };
  function glouton(equipe, sorte, simple) {
    const T = Tanks.Chars3D.materiaux().teinte, K = couleurs(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // les 2 chenilles et les 6 galets
    const pat = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.outils.texturePatins(), roughness: 0.85, metalness: 0.4 });
    const contour = [[2.5, 0.7], [2.65, 0.42], [2.2, 0.03], [-2.2, 0.03], [-2.55, 0.4], [-2.45, 0.7]];
    for (const s of [-1, 1]) {
      caisse.add(Tanks.Chars1916.plaque(contour, 0.4, pat, s * 1.15, Tanks.Chars1916.retrecir(contour, 0.1)));
      if (!simple) for (let k = 0; k < 6; k++) caisse.add(couche(cylindre(0.3, 0.3, 0.2, T, 14, K.sombre), "z", -2.0 + k * 0.8, 0.33, s * 1.15));
    }
    // la caisse basse, le nez en coin, le toit
    caisse.add(boite(4.6, 1.0, 2.7, T, -0.35, 1.2, 0, K.base));
    const nez = boite(1.3, 0.12, 2.7, T, 2.25, 1.38, 0, K.base);
    nez.rotation.z = -0.55;
    caisse.add(nez);
    caisse.add(boite(0.5, 0.55, 2.7, T, 2.3, 0.85, 0, K.gris));
    caisse.add(boite(0.1, 1.0, 1.6, T, -2.65, 1.2, 0, K.gris)); // la porte arrière
    for (const s of [-1, 1]) caisse.add(couche(cylindre(0.3, 0.3, 0.03, T, 16, K.marque), "z", 0.2, 1.3, s * 1.37)); // le rond de la couleur du camp
    // la tourelle et son canon automatique
    caisse.add(boite(1.4, 0.55, 1.5, T, 0.3, 1.98, 0, K.base));
    caisse.add(couche(cylindre(0.045, 0.05, 2.4, T, 10, CT.noir), "x", 2.15, 2.0, 0.15)); // le canon automatique, long et fin
    caisse.add(couche(cylindre(0.08, 0.08, 0.4, T, 10, K.gris), "x", 1.1, 2.0, 0.15)); // son manchon
    if (!simple) {
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) caisse.add(couche(cylindre(0.05, 0.05, 0.25, T, 8, K.sombre), "x", 0.95, 2.05 + k * 0.1, s * 0.72)); // les lance-fumigènes
      caisse.add(boite(0.3, 0.25, 0.35, T, -0.15, 2.35, 0.45, K.gris)); // la visée du tireur
      // les grilles anti-roquettes sur les flancs (des barreaux verticaux)
      for (const s of [-1, 1]) for (let k = 0; k < 14; k++) caisse.add(boite(0.03, 0.7, 0.03, T, -2.4 + k * 0.33, 1.15, s * 1.48, K.sombre));
      for (const s of [-1, 1]) for (const y of [0.85, 1.48]) caisse.add(boite(4.6, 0.04, 0.04, T, -0.25, y, s * 1.48, K.sombre));
      // la petite cage anti-drones au-dessus de la tourelle
      for (const [x, z] of [[-0.4, -0.75], [-0.4, 0.75], [1.0, -0.75], [1.0, 0.75]]) caisse.add(O.tube([x, 2.25, z], [x, 2.95, z], 0.02, T, 4, CT.noir));
      for (let k = 0; k < 5; k++) caisse.add(O.tube([-0.4 + k * 0.35, 2.95, -0.75], [-0.4 + k * 0.35, 2.95, 0.75], 0.014, T, 4, CT.noir));
      // les bidons, les sacs, l'antenne
      for (const z of [-0.8, 0.8]) caisse.add(boite(0.18, 0.42, 0.32, T, -2.8, 1.35, z, 0x5c6450));
      for (let k = 0; k < 3; k++) caisse.add(boite(0.55, 0.28, 0.4, T, -1.6 + k * 0.6, 1.85, -0.9, k % 2 ? 0x8a8c84 : 0xb8bab4)); // les sacs sur le toit
      caisse.add(O.tube([-2.2, 1.7, 1.0], [-2.2, 4.2, 1.0], 0.015, T, 4, CT.noir));
    }
    const braque = new THREE.Group();
    braque.name = "braquage";
    g.add(braque);
    for (const m of souder(caisse, true)) caisse.add(m);
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    if (!simple) for (let k = 0; k < 6; k++) {
      const x = -0.9 - Math.floor(k / 2) * 0.6, z = (k % 2 ? 1 : -1) * 0.65;
      passagers.add(O.piece(new THREE.SphereGeometry(0.14, 8, 6), T, x, 2.15, z, 0xc8ccc9), boite(0.3, 0.45, 0.42, T, x, 1.82, z, K.gris));
    }
    for (const m of souder(passagers, true)) passagers.add(m);
    g.add(passagers);
    return { g };
  }
  function simple(equipe, sorte) {
    const { g } = glouton(equipe, sorte, true), tout = new THREE.Group();
    g.updateMatrixWorld(true);
    g.traverse((m) => {
      if (!m.isMesh) return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      p.userData.teinte = m.userData.teinte || (m.material.vertexColors ? undefined : new THREE.Color(0x26241f));
      tout.add(p);
    });
    return souder(tout, false)[0].geometry;
  }
  Tanks.Vehicules3D.ajouterModele("glouton", (equipe, sorte) => glouton(equipe, sorte, false), simple);
})();
