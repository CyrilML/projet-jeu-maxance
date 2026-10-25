// 🛻 LE SEMI-CHENILLÉ DE 1944 EN 3D (demande 115, édition « Seconde Guerre mondiale »)
//
// En 1944, le camion qui amène 6 soldats au front devient un SEMI-CHENILLÉ (inventé) : deux roues devant (elles
// tournent pour braquer), des CHENILLES derrière, une caisse blindée ouverte sur le dessus avec ses deux bancs, le
// pare-chocs à treuil, la mitrailleuse sur son arceau et l'emblème du camp. Il répond comme le camion
// (affichage/vehicules3d.js) : ses roues tournent, le groupe « braquage » braque, les soldats assis se voient à bord.

window.Tanks = window.Tanks || {};

(function () {
  const O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, CT = Tanks.Chars3D.C;
  const couleurs = (equipe) => { const E = Tanks.CONFIG.equipes[String(equipe).split("~")[0]] || Tanks.CONFIG.equipes.bleus; return { base: new THREE.Color(E.camouflage[0]), clair: new THREE.Color(E.camouflage[1]), marque: E.marque }; };
  function semichenille(equipe, sorte, simple) {
    const T = Tanks.Chars3D.materiaux().teinte, K = couleurs(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // la chenille arrière : une boucle (l'image des patins), et ses galets
    const pat = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.outils.texturePatins(), roughness: 0.85, metalness: 0.4 });
    for (const s of [-1, 1]) {
      const ch = Tanks.Chars1916.plaque([[0.3, 0.75], [0.45, 0.35], [0.1, 0.02], [-2.6, 0.02], [-2.95, 0.35], [-2.8, 0.75]], 0.32, pat, s * 0.92, Tanks.Chars1916.retrecir([[0.3, 0.75], [0.45, 0.35], [0.1, 0.02], [-2.6, 0.02], [-2.95, 0.35], [-2.8, 0.75]], 0.1));
      caisse.add(ch);
      if (!simple) for (const x of [-0.4, -1.1, -1.8, -2.4]) caisse.add(couche(cylindre(0.3, 0.3, 0.3, T, 12, CT.noir), "z", x, 0.36, s * 0.92));
    }
    // la caisse blindée, ouverte dessus ; le capot ; le pare-chocs à treuil
    caisse.add(boite(3.4, 1.15, 2.1, T, -1.25, 1.35, 0, K.base));
    caisse.add(boite(1.8, 0.85, 1.6, T, 1.3, 1.2, 0, K.base)); // le capot du moteur
    caisse.add(boite(0.6, 0.6, 1.9, T, 0.25, 1.75, 0, K.clair)); // le poste de conduite (le pare-brise blindé)
    caisse.add(boite(0.12, 0.25, 2.2, T, 2.3, 0.75, 0, CT.noir));
    caisse.add(couche(cylindre(0.15, 0.15, 0.5, T, 10, CT.acier), "z", 2.36, 0.95, 0)); // le treuil
    caisse.add(boite(0.05, 0.4, 0.1, T, 0.56, 1.75, 0.5, 0x1e2a30));
    for (const s of [-1, 1]) caisse.add(couche(cylindre(0.32, 0.32, 0.03, T, 18, K.marque), "z", -1.4, 1.4, s * 1.06)); // l'emblème
    if (!simple) {
      caisse.add(O.tube([-0.2, 1.95, -0.9], [-0.2, 2.5, 0], 0.04, T, 6, CT.acier), O.tube([-0.2, 1.95, 0.9], [-0.2, 2.5, 0], 0.04, T, 6, CT.acier)); // l'arceau
      caisse.add(couche(cylindre(0.035, 0.035, 1.1, T, 6, CT.noir), "x", 0.25, 2.55, 0)); // la mitrailleuse
      for (const s of [-1, 1]) caisse.add(boite(2.4, 0.12, 0.35, T, -1.5, 1.5, s * 0.75, CT.bois)); // les bancs
    }
    // les roues avant (qui braquent)
    const braque = new THREE.Group();
    braque.name = "braquage";
    braque.position.set(1.5, 0, 0);
    for (const s of [-1, 1]) {
      const r = O.piece(new THREE.CylinderGeometry(0.48, 0.48, 0.32, 16), T, 0, 0.48, s * 0.95, CT.caoutchouc);
      r.rotation.x = Math.PI / 2;
      r.userData.roue = true;
      r.userData.rayon = 0.48;
      braque.add(r);
    }
    g.add(braque);
    for (const m of souder(caisse, true)) caisse.add(m);
    // les soldats assis (visibles quand il en transporte) : de simples silhouettes
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    if (!simple) for (let k = 0; k < 6; k++) passagers.add(O.piece(new THREE.SphereGeometry(0.14, 8, 6), T, -0.6 - Math.floor(k / 2) * 0.8, 2.15, (k % 2 ? 1 : -1) * 0.6, CT.casque));
    for (const m of souder(passagers, true)) passagers.add(m);
    g.add(passagers);
    return { g };
  }
  function simple(equipe, sorte) {
    const { g } = semichenille(equipe, sorte, true), tout = new THREE.Group();
    g.updateMatrixWorld(true);
    g.traverse((m) => {
      if (!m.isMesh) return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      p.userData.teinte = m.userData.teinte || (m.material.vertexColors ? undefined : new THREE.Color(0x26241f)); // (la chenille : gris foncé)
      tout.add(p);
    });
    return souder(tout, false)[0].geometry;
  }
  Tanks.Vehicules3D.ajouterModele("semichenille", (equipe, sorte) => semichenille(equipe, sorte, false), simple);
})();
