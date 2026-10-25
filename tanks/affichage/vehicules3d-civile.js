// 🛻 LES PICK-UPS ARMÉS EN 3D : le garage de la milice (demande 115, édition « Guerre civile »)
//
// ✍️ « Des pick-ups armés (des “technicals”). » Un pick-up de tous les jours (la cabine à 2 portes, le capot, la benne,
// la roue de secours, le pare-buffle soudé devant), sur lequel on a boulonné une MITRAILLEUSE LOURDE sur un pied, avec un
// petit bouclier, une caisse de bandes de cartouches… et un tireur debout dans la benne. Le foulard du camp flotte sur
// l'antenne (vert : le Front ; rouge : la Garde). Trois modèles :
//   - « pickup » : le pick-up seul (le châssis de TON pick-up armé : la mitrailleuse qui tourne est posée dessus par
//     « technical » ci-dessous, comme le canon du camion antiaérien) ;
//   - « technical » (pour les pick-ups de l'ordinateur) : le pick-up, la mitrailleuse et son tireur, tout en un ;
//   - la MITRAILLEUSE QUI TOURNE de ton pick-up (Tanks.Engins3D.ajouterDCA) : le pied et le tireur tournent (la tourelle),
//     le canon se lève, la flamme au bout du canon quand elle tire.
// Les pièces sont soudées par matière (1 à 3 dessins par pick-up) ; de loin, une version simple (1 seule forme).
// Comme tout l'affichage, il lit le monde et ne le change jamais.

window.Tanks = window.Tanks || {};

(function () {
  const O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O, CT = Tanks.Chars3D.C;
  const OU = () => Tanks.Engins3D.outils;
  // les couleurs : une carrosserie « civile » (blanc cassé pour le Front, beige sable pour la Garde), la marque du camp
  const couleurs = (equipe) => {
    const e = String(equipe).split("~")[0], E = Tanks.CONFIG.equipes[e] || Tanks.CONFIG.equipes.bleus;
    return { caisse: new THREE.Color(e === "rouges" ? 0xc8b088 : 0xd8d2c2), bas: new THREE.Color(e === "rouges" ? 0x8a7656 : 0x8a8476), marque: E.marque, sombre: new THREE.Color(0x2a2824) };
  };
  // une roue (l'axe le long de z ; elle tourne avec « rotation.y », comme celles du camion) ; devant : sur un pivot qui braque
  function roue(g, T, x, z, r) {
    const geo = O.geometrieTeintee([O.cylindre(r, r, 0.3, T, 14, 0x1b1b1b), O.cylindre(r * 0.55, r * 0.55, 0.32, T, 10, 0x8a8a86)], T);
    const m = new THREE.Mesh(geo, T);
    m.rotation.x = Math.PI / 2;
    m.castShadow = true;
    m.userData.roue = true;
    m.userData.rayon = r;
    if (x > 0) {
      const pivot = new THREE.Group();
      pivot.position.set(x, r, z);
      pivot.userData.pivot = true;
      pivot.add(m);
      g.add(pivot);
    } else (m.position.set(x, r, z), g.add(m));
  }
  // ------------------------------------------------------------------ le pick-up (5,3 m de long, 1,9 m de large)
  function pickup(equipe, arme, simple) {
    const T = Tanks.Chars3D.materiaux().teinte, K = couleurs(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // le châssis, le dessous, les pare-chocs, le PARE-BUFFLE soudé devant
    caisse.add(boite(5.0, 0.3, 1.5, T, 0, 0.62, 0, CT.noir));
    caisse.add(boite(0.18, 0.28, 1.9, T, 2.62, 0.78, 0, 0x5a5a56), boite(0.15, 0.24, 1.88, T, -2.62, 0.8, 0, 0x5a5a56));
    if (!simple) for (const z of [-0.55, 0.55]) caisse.add(O.tube([2.75, 0.7, z], [2.85, 1.35, z], 0.04, T, 6, 0x2a2a28));
    if (!simple) caisse.add(O.tube([2.85, 1.35, -0.6], [2.85, 1.35, 0.6], 0.04, T, 6, 0x2a2a28), O.tube([2.82, 1.0, -0.6], [2.82, 1.0, 0.6], 0.035, T, 6, 0x2a2a28));
    // le capot, les ailes, la calandre et les phares
    caisse.add(boite(1.0, 0.42, 1.86, T, 2.15, 1.08, 0, K.caisse));
    caisse.add(boite(0.05, 0.3, 1.2, T, 2.66, 1.06, 0, 0x2a2a28));
    for (const z of [-0.72, 0.72]) caisse.add(couche(cylindre(0.09, 0.09, 0.05, T, 10, 0xeeeeea), "x", 2.67, 1.1, z));
    // la cabine (2 portes), le pare-brise, les vitres sombres, le toit
    caisse.add(boite(1.45, 0.5, 1.88, T, 1.0, 1.12, 0, K.caisse));
    caisse.add(boite(1.2, 0.08, 1.8, T, 0.88, 1.95, 0, K.caisse));
    const pb = boite(0.06, 0.62, 1.72, T, 1.58, 1.62, 0, 0x26343a);
    pb.rotation.z = -0.45;
    caisse.add(pb);
    for (const s of [-1, 1]) caisse.add(boite(1.0, 0.5, 0.04, T, 0.85, 1.63, s * 0.92, 0x26343a), boite(0.07, 0.56, 0.05, T, 0.3, 1.63, s * 0.92, K.caisse));
    caisse.add(boite(0.06, 0.55, 1.8, T, 0.3, 1.63, 0, 0x26343a));
    // la BENNE : le plancher, les ridelles, le hayon ; la roue de secours debout contre la cabine
    caisse.add(boite(2.85, 0.08, 1.86, T, -1.15, 0.95, 0, K.bas));
    for (const s of [-1, 1]) caisse.add(boite(2.85, 0.5, 0.06, T, -1.15, 1.2, s * 0.9, K.caisse));
    caisse.add(boite(0.06, 0.48, 1.86, T, -2.58, 1.19, 0, K.caisse));
    if (!simple) caisse.add(couche(cylindre(0.38, 0.38, 0.24, T, 12, 0x1b1b1b), "x", 0.05, 1.45, 0.45));
    // la marque du camp sur les portières (un rectangle peint à la main)
    for (const s of [-1, 1]) caisse.add(boite(0.55, 0.25, 0.02, T, 0.95, 1.12, s * 0.95, K.marque));
    // l'antenne et son FOULARD de la couleur du camp
    if (!simple) caisse.add(O.tube([0.4, 1.95, 0.85], [0.3, 3.4, 0.85], 0.012, T, 4, CT.noir), boite(0.42, 0.22, 0.02, T, 0.12, 3.25, 0.85, K.marque));
    // LA MITRAILLEUSE sur son pied, le bouclier, la caisse de bandes (pour les pick-ups de l'ordinateur : tout est fixe)
    if (arme) {
      const xm = -1.05, ym = 2.25;
      caisse.add(cylindre(0.07, 0.09, 1.25, T, 8, 0x3a3a38).translateX(xm).translateY(1.6));
      caisse.add(boite(0.75, 0.2, 0.2, T, xm + 0.1, ym, 0, 0x262624)); // le boîtier
      caisse.add(couche(cylindre(0.05, 0.05, 1.5, T, 8, CT.noir), "x", xm + 1.15, ym + 0.02, 0)); // le canon
      caisse.add(couche(cylindre(0.08, 0.08, 0.18, T, 8, CT.noir), "x", xm + 1.9, ym + 0.02, 0)); // le cache-flamme
      caisse.add(boite(0.05, 0.55, 0.75, T, xm + 0.55, ym + 0.05, 0, 0x5a5e50)); // le petit bouclier
      caisse.add(boite(0.3, 0.22, 0.2, T, xm + 0.05, ym - 0.18, 0.22, 0x4e5634)); // la caisse de bandes
    }
    const braque = new THREE.Group();
    braque.name = "braquage";
    g.add(braque);
    for (const m of souder(caisse, true)) caisse.add(m);
    // le chauffeur (et, sur un pick-up armé de l'ordinateur, le tireur debout dans la benne) : cachés quand il n'y a personne
    const pilote = new THREE.Group();
    pilote.name = "pilote";
    if (!simple) {
      OU().pilote(pilote, null, 0.95, 1.0, -0.42, [1.35, 1.45, -0.42], equipe);
      if (arme) tireurDebout(pilote, equipe, -1.65, 0.99, 0);
      souder(pilote, true);
    }
    g.add(pilote);
    for (const s of [-1, 1]) for (const x of [1.62, -1.55]) roue(g, T, x, s * 0.84, 0.4);
    return { g };
  }
  // ✍️ le TIREUR, debout dans la benne, les mains sur les poignées de la mitrailleuse (devant lui)
  function tireurDebout(groupe, equipe, x, y, z) {
    OU().figurineDans(groupe, OU().figurine(equipe, (r, bras) => {
      r.dos.rotation.z = -0.12;
      bras(r.epaules[0], r.coudes[0], [0.5, 0.42, 0.14], new THREE.Vector3(0, -1, 0.6));
      bras(r.epaules[1], r.coudes[1], [0.5, 0.42, -0.14], new THREE.Vector3(0, -1, -0.6));
    }, true, 1), x, y, z, 0);
  }
  // la version SIMPLE (de loin) : une seule forme à couleurs
  const simple = (arme) => (equipe) => {
    const { g } = pickup(equipe, arme, true), tout = new THREE.Group();
    g.updateMatrixWorld(true);
    g.traverse((m) => {
      if (!m.isMesh) return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      p.userData.teinte = m.userData.teinte || (m.material.vertexColors ? undefined : new THREE.Color(0x1b1b1b));
      tout.add(p);
    });
    return souder(tout, false)[0].geometry;
  };
  Tanks.Vehicules3D.ajouterModele("pickup", (equipe) => pickup(equipe, false, false), simple(false));
  Tanks.Vehicules3D.ajouterModele("technical", (equipe) => pickup(equipe, true, false), simple(true));

  // ------------------------------------------------------------------ TON pick-up armé : la mitrailleuse qui tourne
  // (même réponse que le canon double du camion antiaérien : tourelle, canons, flammes, tireur)
  Tanks.Engins3D.ajouterDCA("technical", (equipe) => {
    const R = Tanks.CONFIG.engins.dca, base = Tanks.Vehicules3D.fabriquer("camionAA", equipe), T = Tanks.Chars3D.materiaux().teinte;
    const tourelle = new THREE.Group();
    tourelle.position.set(R.canon.x, R.plateau || 1, 0);
    base.g.add(tourelle);
    const hm = R.canon.y - (R.plateau || 1); // (la hauteur de la mitrailleuse au-dessus du plancher de la benne)
    tourelle.add(cylindre(0.07, 0.09, hm, T, 8, 0x3a3a38).translateY(hm / 2)); // le pied
    tourelle.add(cylindre(0.22, 0.26, 0.08, T, 10, 0x2a2a28).translateY(0.04)); // l'embase boulonnée
    souder(tourelle, true);
    const tireur = new THREE.Group();
    tireur.name = "tireur";
    tireurDebout(tireur, equipe, -0.6, 0.04, 0);
    souder(tireur, true);
    tourelle.add(tireur);
    const canons = new THREE.Group();
    canons.position.set(0, hm, 0);
    tourelle.add(canons);
    canons.add(boite(0.75, 0.2, 0.2, T, 0.1, 0, 0, 0x262624)); // le boîtier
    canons.add(couche(cylindre(0.05, 0.05, 1.5, T, 8, CT.noir), "x", 1.15, 0.02, 0)); // le canon
    canons.add(couche(cylindre(0.08, 0.08, 0.18, T, 8, CT.noir), "x", 1.9, 0.02, 0)); // le cache-flamme
    canons.add(boite(0.05, 0.55, 0.75, T, 0.55, 0.05, 0, 0x5a5e50)); // le petit bouclier
    canons.add(boite(0.3, 0.22, 0.2, T, 0.05, -0.18, 0.22, 0x4e5634)); // la caisse de bandes
    canons.add(boite(0.14, 0.16, 0.05, T, -0.3, -0.05, 0.12, CT.noir), boite(0.14, 0.16, 0.05, T, -0.3, -0.05, -0.12, CT.noir)); // les poignées
    souder(canons, true);
    const flammes = [];
    for (let k = 0; k < 2; k++) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(k ? 0.16 : 0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
      f.position.set(2.05 + k * 0.08, 0.02, 0);
      f.visible = false;
      canons.add(f);
      flammes.push(f);
    }
    return Object.assign(base, { tourelle, canons, flammes, tireur });
  });
})();
