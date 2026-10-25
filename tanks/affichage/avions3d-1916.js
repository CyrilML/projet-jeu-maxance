// 🛩️ LES BIPLANS DE 1916 EN 3D : l'atelier de toile et de bois (demande 115, édition « Première Guerre mondiale »)
//
// ✍️ « Biplans. » Deux avions INVENTÉS, inspirés de ceux de 1916 :
//   - le BIPLAN DE CHASSE (« Hirondelle » pour l'Entente, « Aigle noir » pour Kressia) : un fuselage en toile tendue qui
//     s'affine vers la queue, DEUX AILES l'une au-dessus de l'autre, tenues par des mâts et des câbles en croix, le moteur
//     rotatif rond devant (son capot), l'HÉLICE en bois qui tourne, la mitrailleuse sur le capot, le train fixe à deux
//     roues et la béquille de queue, le pilote avec son casque de cuir, et les cocardes INVENTÉES de chaque camp ;
//   - le gros BOMBARDIER (« Gotha-Rex ») : 20 m d'envergure, deux moteurs dans leurs nacelles avec leurs hélices, le poste
//     du mitrailleur à l'avant, la double dérive, et le train à roues jumelées.
// Les pièces sont soudées par matière (affichage/outils3d.js) ; de LOIN, une version simple (1 seule pièce colorée) sert à
// tous les avions de la même sorte. Comme tout l'affichage, il ne fait que dessiner.

window.Tanks = window.Tanks || {};

(function () {
  const A3 = Tanks.Avions3D, O = Tanks.Outils3D, { boite, cylindre, couche, tube, souder } = O;
  const COULEURS = {
    bleus: { toile: 0xc9b78c, aile: 0xbfae84, bois: 0x7a5530, metal: 0x8c9096, marque: [0x2d4f9e, 0xe9d38a, 0x2d4f9e] },
    rouges: { toile: 0x6c7258, aile: 0x7a7a5c, bois: 0x6a4a2a, metal: 0x707478, marque: [0x161616, 0xb3261e, 0xe8e2d0] },
  };
  const coul = (equipe) => COULEURS[String(equipe).split("~")[0]] || COULEURS.bleus;
  // une COCARDE inventée : 3 disques l'un sur l'autre (pas de vrai drapeau)
  function cocarde(g, T, K, x, y, z, r, axe, s) {
    for (let k = 0; k < 3; k++) {
      const d = cylindre(r * (1 - k * 0.32), r * (1 - k * 0.32), 0.012, T, 16, K.marque[k]);
      if (axe === "z") couche(d, "z", x, y, z + s * k * 0.004);
      else d.position.set(x, y + k * 0.004, z);
      g.add(d);
    }
  }
  // une HÉLICE en bois (2 pales), nommée « helice » : elle tourne autour de x
  function helice(K, T, x, y, z, r) {
    const h = new THREE.Group();
    h.name = "helice";
    h.position.set(x, y, z);
    for (const s of [-1, 1]) {
      const p = boite(0.06, r, 0.16, T, 0, (s * r) / 2, 0, K.bois);
      p.rotation.x = s * 0.25;
      h.add(p);
    }
    h.add(couche(cylindre(0.09, 0.09, 0.14, T, 10, K.metal), "x", 0, 0, 0));
    for (const m of souder(h, true)) h.add(m);
    return h;
  }
  // les mâts et les câbles entre les deux ailes, à « z » du milieu
  function mats(g, T, K, x, yb, yh, z) {
    for (const s of [-1, 1]) {
      g.add(tube([x + 0.4, yb, s * z], [x + 0.45, yh, s * z], 0.035, T, 6, K.bois));
      g.add(tube([x - 0.45, yb, s * z], [x - 0.4, yh, s * z], 0.035, T, 6, K.bois));
      g.add(tube([x + 0.4, yb, s * z], [x - 0.4, yh, s * z], 0.008, T, 4, 0x2a2a2a));
      g.add(tube([x - 0.45, yb, s * z], [x + 0.45, yh, s * z], 0.008, T, 4, 0x2a2a2a));
      g.add(tube([x, yh, s * z], [x + 0.2, yb + 0.2, s * 0.3], 0.007, T, 4, 0x2a2a2a));
    }
  }

  // ------------------------------------------------------------------ LE BIPLAN DE CHASSE (nez vers x+, roues au sol y = 0)
  function chasse(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 1.3;
    const fus = cylindre(0.14, 0.5, 5.0, T, simple ? 6 : 10, K.toile);
    fus.rotation.z = Math.PI / 2;
    fus.position.set(-0.55, yF, 0);
    fus.scale.set(1.15, 1, 0.9);
    caisse.add(fus);
    caisse.add(couche(cylindre(0.55, 0.55, 0.6, T, simple ? 8 : 16, K.metal), "x", 2.15, yF, 0)); // le capot du moteur rotatif
    caisse.add(boite(1.4, 0.07, 8.0, T, 0.55, 2.1, 0, K.aile)); // l'aile du haut
    caisse.add(boite(1.25, 0.07, 7.2, T, 0.35, 0.92, 0, K.aile)); // l'aile du bas
    caisse.add(boite(0.85, 0.04, 2.7, T, -2.85, yF + 0.05, 0, K.aile)); // le stabilisateur
    const derive = boite(0.9, 0.85, 0.04, T, -3.0, yF + 0.45, 0, K.aile);
    derive.rotation.z = 0.15;
    caisse.add(derive);
    if (!simple) {
      mats(caisse, T, K, 0.5, 0.95, 2.07, 2.9);
      for (const s of [-1, 1]) caisse.add(tube([0.9, yF + 0.35, s * 0.3], [0.8, 2.07, s * 0.6], 0.03, T, 6, K.bois), tube([0.1, yF + 0.35, s * 0.3], [0.25, 2.07, s * 0.6], 0.03, T, 6, K.bois)); // la cabane
      // le train : les jambes en V, l'essieu, les roues, la béquille de queue
      for (const s of [-1, 1]) {
        caisse.add(tube([1.5, yF - 0.35, s * 0.35], [1.25, 0.35, s * 0.85], 0.03, T, 6, K.metal), tube([0.7, yF - 0.35, s * 0.35], [1.25, 0.35, s * 0.85], 0.03, T, 6, K.metal));
        caisse.add(couche(cylindre(0.35, 0.35, 0.12, T, 14, 0x2a2a28), "z", 1.25, 0.35, s * 0.9));
        caisse.add(couche(cylindre(0.2, 0.2, 0.13, T, 10, K.aile), "z", 1.25, 0.35, s * 0.9));
      }
      caisse.add(tube([1.25, 0.35, -0.85], [1.25, 0.35, 0.85], 0.025, T, 6, K.metal));
      caisse.add(tube([-2.7, yF - 0.2, 0], [-3.0, 0.08, 0], 0.03, T, 6, K.bois));
      caisse.add(boite(0.9, 0.12, 0.12, T, 1.2, yF + 0.55, 0.12, 0x2a2b2e)); // la mitrailleuse sur le capot
      caisse.add(couche(cylindre(0.33, 0.33, 0.05, T, 14, 0x1a1a1a), "y", -0.25, yF + 0.45, 0)); // le bord du poste de pilotage
      caisse.add(boite(0.05, 0.12, 0.35, T, 0.15, yF + 0.6, 0, 0x8aa0aa)); // le petit pare-brise
      for (const s of [-1, 1]) cocarde(caisse, T, K, 0.55, 2.14, s * 2.9, 0.5, "y", 1);
      for (const s of [-1, 1]) cocarde(caisse, T, K, -1.6, yF, s * 0.36, 0.3, "z", s);
      // le pilote : la tête, son casque de cuir et ses lunettes
      const pil = new THREE.Group();
      pil.name = "pilote";
      pil.add(O.piece(new THREE.SphereGeometry(0.15, 10, 8), T, -0.3, yF + 0.62, 0, 0x5a3a22));
      pil.add(boite(0.06, 0.05, 0.22, T, -0.17, yF + 0.64, 0, 0x2a2a2a));
      pil.add(boite(0.3, 0.3, 0.4, T, -0.35, yF + 0.4, 0, 0x4a3a2a));
      for (const m of souder(pil, true)) pil.add(m);
      g.add(pil);
    }
    g.add(helice(K, T, 2.5, yF, 0, 2.5));
    return g;
  }
  // ------------------------------------------------------------------ LE BOMBARDIER BIPLAN
  function bombardier(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 1.9;
    caisse.add(boite(9.0, 1.0, 1.1, T, -1.0, yF, 0, K.toile)); // le fuselage (une longue poutre de toile)
    const nez = cylindre(0.45, 0.62, 1.6, T, simple ? 6 : 10, K.toile);
    nez.rotation.z = -Math.PI / 2;
    nez.position.set(4.2, yF, 0);
    caisse.add(nez);
    caisse.add(boite(2.4, 0.09, 20, T, 0.5, 3.5, 0, K.aile), boite(2.2, 0.09, 18.5, T, 0.3, 1.25, 0, K.aile));
    caisse.add(boite(1.5, 0.05, 5.0, T, -5.2, yF + 0.2, 0, K.aile));
    for (const s of [-1, 1]) caisse.add(boite(1.2, 1.3, 0.05, T, -5.4, yF + 0.8, s * 1.4, K.aile)); // les 2 dérives
    for (const s of [-1, 1]) {
      caisse.add(couche(cylindre(0.45, 0.35, 2.4, T, simple ? 6 : 12, K.metal), "x", 1.2, 1.9, s * 2.8)); // les nacelles des moteurs
      g.add(helice(K, T, 2.55, 1.9, s * 2.8, 3.1));
    }
    if (!simple) {
      for (const z of [2.8, 6.2, 9.0]) mats(caisse, T, K, 0.4, 1.3, 3.45, z);
      for (const s of [-1, 1]) for (const dz of [-0.3, 0.3]) caisse.add(couche(cylindre(0.45, 0.45, 0.14, T, 14, 0x2a2a28), "z", 1.3, 0.45, s * 2.8 + dz));
      for (const s of [-1, 1]) caisse.add(tube([1.3, 0.45, s * 2.8], [1.3, 1.6, s * 2.8], 0.05, T, 6, K.metal));
      caisse.add(tube([-5.0, yF - 0.5, 0], [-5.2, 0.1, 0], 0.04, T, 6, K.bois));
      caisse.add(couche(cylindre(0.42, 0.42, 0.06, T, 14, 0x1a1a1a), "y", 4.4, yF + 0.6, 0)); // le poste du mitrailleur
      caisse.add(boite(0.8, 0.1, 0.1, T, 4.8, yF + 0.85, 0, 0x2a2b2e));
      for (const s of [-1, 1]) cocarde(caisse, T, K, 0.5, 3.56, s * 7.5, 0.9, "y", 1);
      for (const s of [-1, 1]) cocarde(caisse, T, K, -3.0, yF, s * 0.56, 0.45, "z", s);
      const pil = new THREE.Group();
      pil.name = "pilote";
      pil.add(O.piece(new THREE.SphereGeometry(0.16, 10, 8), T, 2.6, yF + 0.65, 0, 0x5a3a22));
      for (const m of souder(pil, true)) pil.add(m);
      g.add(pil);
    }
    return g;
  }
  // La version simple (de loin) : la même forme, sans détails, soudée en une seule pièce colorée
  function simple(fabrique) {
    return (equipe) => {
      const g = fabrique(equipe, true);
      g.traverse((m) => m.isMesh && m.updateMatrixWorld());
      const tout = new THREE.Group();
      g.updateMatrixWorld(true);
      g.traverse((m) => {
        if (!m.isMesh) return;
        const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
        if (m.userData.teinte) p.userData.teinte = m.userData.teinte;
        tout.add(p);
      });
      const [piece] = souder(tout, false);
      return piece.geometry;
    };
  }
  const fabriquer = (f) => (equipe) => {
    const g = f(equipe, false), racine = new THREE.Group();
    for (const grp of g.children.filter((x) => x.isGroup && x.name !== "helice" && x.name !== "pilote")) for (const m of souder(grp, true)) grp.add(m);
    racine.add(g); // (les noms « helice » et « pilote » restent trouvables)
    g.traverse((m) => m.isMesh && (m.castShadow = true));
    return racine;
  };
  A3.ajouterModele("biplan", fabriquer(chasse), simple(chasse));
  A3.ajouterModele("bombardier", fabriquer(bombardier), simple(bombardier));
})();
