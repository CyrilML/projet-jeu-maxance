// ✈️ LES AVIONS DE 1944 EN 3D : le hangar des avions à hélice (demande 115, édition « Seconde Guerre mondiale »)
//
// ✍️ « Des avions à hélice, des parachutistes. » Trois avions INVENTÉS, inspirés de ceux de 1944 :
//   - le CHASSEUR (« Faucon pèlerin » pour l'Union, « Corbeau » pour la Ligue) : le long nez du moteur, l'hélice à
//     3 pales, l'aile basse aux bouts arrondis, la verrière en bulle, la radiale sous le ventre, le train sorti au sol ;
//   - le BOMBARDIER EN PIQUÉ (« Hurleur ») : les ailes en mouette (cassées vers le bas), le train fixe dans ses carénages
//     (les « pantalons »), la longue verrière à 2 places, la bombe sous le ventre ;
//   - le TRANSPORT BIMOTEUR (« Dakar ») : le gros fuselage rond, les 2 moteurs et leurs hélices, la porte de saut sur le
//     côté : c'est de lui que sautent les PARACHUTISTES.
// Les insignes sont INVENTÉS (un anneau vert et blanc pour l'Union, un losange bleu nuit et or pour la Ligue). Les pièces
// sont soudées par matière ; de loin, une version simple (1 seule pièce colorée).

window.Tanks = window.Tanks || {};

(function () {
  const A3 = Tanks.Avions3D, O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O;
  const COULEURS = {
    bleus: { peau: 0x5b6142, ventre: 0x8e9a9a, metal: 0x6c7075, insigne: "anneau", i: [0x2f5a2a, 0xeeeee6, 0x2f5a2a] },
    rouges: { peau: 0x6a6f60, ventre: 0x8fa3b0, metal: 0x6c7075, insigne: "losange", i: [0x1e2638, 0xc9a43a, 0x1e2638] },
  };
  const coul = (equipe) => COULEURS[String(equipe).split("~")[0]] || COULEURS.bleus;
  // l'INSIGNE inventé : 3 anneaux (l'Union) ou 3 losanges (la Ligue), posé sur l'aile (« y ») ou le flanc (« z »)
  function insigne(g, T, K, x, y, z, r, axe, s) {
    for (let k = 0; k < 3; k++) {
      const f = 1 - k * 0.32, ep = 0.012 + k * 0.004;
      const d = K.insigne === "anneau" ? cylindre(r * f, r * f, ep, T, 16, K.i[k]) : boite(r * f * 1.4, ep, r * f * 1.4, T, 0, 0, 0, K.i[k]);
      if (axe === "z") { d.rotation.x = Math.PI / 2; if (K.insigne !== "anneau") d.rotation.y = Math.PI / 4; d.position.set(x, y, z + s * k * 0.004); }
      else { if (K.insigne !== "anneau") d.rotation.y = Math.PI / 4; d.position.set(x, y + k * 0.004, z); }
      g.add(d);
    }
  }
  function helice(T, K, x, y, z, r, pales) {
    const h = new THREE.Group();
    h.name = "helice";
    h.position.set(x, y, z);
    for (let k = 0; k < pales; k++) {
      const p = boite(0.05, r, 0.18, T, 0, r / 2, 0, 0x1c1c1c);
      const pivot = new THREE.Group();
      pivot.rotation.x = (k / pales) * Math.PI * 2;
      p.rotation.y = 0.35;
      pivot.add(p);
      h.add(pivot);
    }
    const cone = cylindre(0.02, 0.16, 0.35, T, 12, K.insigne === "anneau" ? 0xd8d4c4 : 0xc9a43a);
    cone.rotation.z = -Math.PI / 2;
    cone.position.x = 0.12;
    h.add(cone);
    return h;
  }
  function souderTout(h) {
    const tout = new THREE.Group();
    h.updateMatrixWorld(true);
    h.traverse((m) => {
      if (!m.isMesh) return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      if (m.userData.teinte) p.userData.teinte = m.userData.teinte;
      tout.add(p);
    });
    return tout;
  }

  // ------------------------------------------------------------------ LE CHASSEUR (nez vers x+, roues au sol)
  function chasseur(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 1.75;
    const fus = cylindre(0.2, 0.62, 7.6, T, simple ? 8 : 14, K.peau);
    fus.rotation.z = Math.PI / 2;
    fus.position.set(-0.6, yF, 0);
    fus.scale.set(1.1, 1, 0.85);
    caisse.add(fus);
    caisse.add(couche(cylindre(0.55, 0.62, 1.4, T, simple ? 8 : 14, K.peau), "x", 3.6, yF, 0)); // le long nez du moteur
    const aile = boite(2.0, 0.12, 11.2, T, 0.9, yF - 0.45, 0, K.peau); // l'aile basse
    caisse.add(aile);
    for (const s of [-1, 1]) caisse.add(couche(cylindre(1.0, 1.0, 0.12, T, 14, K.peau), "y", 0.9, yF - 0.45, s * 5.6)); // les bouts arrondis
    caisse.add(boite(1.0, 0.06, 3.6, T, -4.1, yF + 0.05, 0, K.peau)); // le stabilisateur
    const derive = boite(1.2, 1.3, 0.06, T, -4.2, yF + 0.6, 0, K.peau);
    derive.rotation.z = 0.2;
    caisse.add(derive);
    caisse.add(boite(1.2, 0.35, 0.55, T, 0.2, yF - 0.62, 0, K.peau)); // la radiale sous le ventre
    if (!simple) {
      const bulle = O.piece(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), T, 0.3, yF + 0.38, 0, 0x1e2a32);
      bulle.scale.set(1.9, 0.9, 0.9);
      caisse.add(bulle);
      for (const s of [-1, 1]) { // le train sorti
        caisse.add(O.tube([1.4, yF - 0.5, s * 1.4], [1.5, 0.35, s * 1.55], 0.06, T, 6, K.metal));
        caisse.add(couche(cylindre(0.35, 0.35, 0.16, T, 14, 0x1c1c1c), "z", 1.5, 0.35, s * 1.6));
        for (const dz of [2.2, 2.6]) caisse.add(couche(cylindre(0.02, 0.02, 0.8, T, 6, 0x222222), "x", 2.0, yF - 0.42, s * dz)); // les canons dans l'aile
        insigne(caisse, T, K, 0.9, yF - 0.38, s * 4.2, 0.55, "y");
      }
      insigne(caisse, T, K, -2.2, yF, 0.5, 0.42, "z", 1);
      insigne(caisse, T, K, -2.2, yF, -0.5, 0.42, "z", -1);
      const pil = new THREE.Group();
      pil.name = "pilote";
      pil.add(O.piece(new THREE.SphereGeometry(0.15, 10, 8), T, 0.25, yF + 0.45, 0, 0x4a3a2a));
      g.add(pil);
    }
    g.add(helice(T, K, 4.35, yF, 0, 1.6, 3));
    return g;
  }
  // ------------------------------------------------------------------ LE BOMBARDIER EN PIQUÉ
  function piqueur(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 2.0;
    caisse.add(boite(8.5, 1.0, 1.0, T, -0.6, yF, 0, K.peau));
    caisse.add(couche(cylindre(0.55, 0.6, 1.4, T, 12, K.peau), "x", 4.2, yF, 0));
    for (const s of [-1, 1]) { // les ailes en MOUETTE : cassées vers le bas, puis remontant
      const a1 = boite(2.3, 0.14, 2.6, T, 0.8, yF - 0.55, s * 1.6, K.peau);
      a1.rotation.x = s * 0.35;
      const a2 = boite(2.0, 0.12, 4.6, T, 0.8, yF - 0.6, s * 5.0, K.peau);
      a2.rotation.x = -s * 0.1;
      caisse.add(a1, a2);
      caisse.add(boite(0.8, 1.1, 0.4, T, 1.0, 0.75, s * 2.2, K.peau)); // le « pantalon » du train
      caisse.add(couche(cylindre(0.38, 0.38, 0.14, T, 14, 0x1c1c1c), "z", 1.0, 0.38, s * 2.2));
      if (!simple) insigne(caisse, T, K, 0.8, yF - 0.5, s * 5.2, 0.6, "y");
    }
    caisse.add(boite(1.4, 0.06, 4.0, T, -4.6, yF + 0.1, 0, K.peau));
    caisse.add(boite(1.2, 1.5, 0.06, T, -4.7, yF + 0.75, 0, K.peau));
    if (!simple) {
      caisse.add(boite(2.6, 0.5, 0.8, T, 0.6, yF + 0.6, 0, 0x22303a)); // la longue verrière
      caisse.add(couche(cylindre(0.2, 0.2, 1.4, T, 10, 0x2c2c2a), "x", 0.4, yF - 0.75, 0)); // la bombe sous le ventre
      insigne(caisse, T, K, -2.6, yF, 0.52, 0.45, "z", 1);
      insigne(caisse, T, K, -2.6, yF, -0.52, 0.45, "z", -1);
      const pil = new THREE.Group();
      pil.name = "pilote";
      pil.add(O.piece(new THREE.SphereGeometry(0.15, 10, 8), T, 1.0, yF + 0.6, 0, 0x4a3a2a));
      g.add(pil);
    }
    g.add(helice(T, K, 5.0, yF, 0, 1.7, 3));
    return g;
  }
  // ------------------------------------------------------------------ LE TRANSPORT BIMOTEUR
  function dakota(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 2.6;
    const fus = cylindre(0.5, 1.25, 18, T, simple ? 8 : 16, K.peau);
    fus.rotation.z = Math.PI / 2;
    fus.position.set(-1.5, yF, 0);
    caisse.add(fus);
    caisse.add(couche(cylindre(1.25, 0.9, 2.4, T, simple ? 8 : 16, K.peau), "x", 8.6, yF - 0.1, 0)); // le nez
    caisse.add(boite(3.6, 0.22, 29, T, 1.6, yF - 0.6, 0, K.peau)); // l'aile basse
    caisse.add(boite(2.2, 0.1, 9, T, -9.5, yF + 0.4, 0, K.peau));
    caisse.add(boite(2.4, 3.0, 0.1, T, -9.8, yF + 1.7, 0, K.peau));
    for (const s of [-1, 1]) {
      caisse.add(couche(cylindre(0.75, 0.6, 3.4, T, 12, K.metal), "x", 3.0, yF - 0.45, s * 4.0)); // les moteurs
      g.add(helice(T, K, 4.8, yF - 0.45, s * 4.0, 2.0, 3));
      caisse.add(couche(cylindre(0.55, 0.55, 0.3, T, 14, 0x1c1c1c), "z", 3.2, 0.55, s * 4.0)); // le train
      if (!simple) insigne(caisse, T, K, 1.6, yF - 0.48, s * 9.5, 1.0, "y");
    }
    if (!simple) {
      caisse.add(boite(1.2, 1.7, 0.04, T, -5.5, yF - 0.05, -1.05, 0x111111)); // la porte de saut ouverte
      for (let k = 0; k < 7; k++) for (const s of [-1, 1]) caisse.add(boite(0.4, 0.3, 0.02, T, 5 - k * 1.6, yF + 0.35, s * 1.16, 0x1e2a32)); // les hublots
      insigne(caisse, T, K, -4, yF, 1.12, 0.8, "z", 1);
      insigne(caisse, T, K, -4, yF, -1.12, 0.8, "z", -1);
      const pil = new THREE.Group();
      pil.name = "pilote";
      pil.add(O.piece(new THREE.SphereGeometry(0.16, 10, 8), T, 8.4, yF + 0.6, 0.4, 0x4a3a2a));
      g.add(pil);
    }
    return g;
  }
  const fabriquer = (f) => (equipe) => {
    const g = f(equipe, false), racine = new THREE.Group();
    for (const grp of [g.children[0]]) for (const m of souder(grp, true)) grp.add(m);
    for (const h of g.children.filter((x) => x.name === "helice")) { // (l'hélice : soudée à part, autour de son moyeu, pour qu'elle tourne)
      const ici = h.position.clone();
      h.position.set(0, 0, 0);
      const t = souderTout(h);
      h.clear();
      for (const m of souder(t, true)) h.add(m);
      h.position.copy(ici);
    }
    racine.add(g);
    g.traverse((m) => m.isMesh && (m.castShadow = true));
    return racine;
  };
  const simple = (f) => (equipe) => souder(souderTout(f(equipe, true)), false)[0].geometry;
  A3.ajouterModele("monoplan", fabriquer(chasseur), simple(chasseur));
  A3.ajouterModele("piqueur", fabriquer(piqueur), simple(piqueur));
  A3.ajouterModele("dakota", fabriquer(dakota), simple(dakota));
})();
