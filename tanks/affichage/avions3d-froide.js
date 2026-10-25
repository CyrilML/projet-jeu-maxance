// ✈️ LES AVIONS DE LA GUERRE FROIDE EN 3D : le hangar des années 70 (demande 115, édition « Guerre froide »)
//
// ✍️ « Des chasseurs à réaction, et l'hélico de combat. » Trois engins volants INVENTÉS, inspirés de ceux des années 70 :
//   - le CHASSEUR-BOMBARDIER F-7 « ORAGE » (Ostrel, le tien) : gros et lourd, le long nez pointu, la verrière à 2 places,
//     les 2 grosses entrées d'air sur les flancs, les bouts d'ailes relevés et le stabilisateur penché vers le bas, les
//     2 tuyères (et leur flamme quand il va vite), les bombes et le bidon sous le ventre ;
//   - l'intercepteur « FLÈCHE » (Khavar) : fin comme un crayon, l'entrée d'air dans le NEZ avec son cône, l'aile en
//     TRIANGLE, une grande dérive, une seule tuyère ;
//   - l'hélico de combat « VIPÈRE » (Ostrel, il remplace le Tigre) : le fuselage très ÉTROIT (1 m !), les 2 places l'une
//     derrière l'autre sous la verrière, la tourelle de mitrailleuse sous le nez, les petites ailes avec 2 paniers de
//     roquettes, le rotor à 2 PALES (« flap-flap-flap »), le rotor de queue, les patins.
// Les insignes sont INVENTÉS (le triangle blanc d'Ostrel dans son disque bleu, la roue dentée dorée de Khavar). Les pièces
// sont soudées par matière ; de loin, une version simple (1 seule pièce colorée).

window.Tanks = window.Tanks || {};

(function () {
  const A3 = Tanks.Avions3D, O = Tanks.Outils3D, { boite, cylindre, couche, souder } = O;
  const COULEURS = {
    bleus: { peau: 0x59603f, ventre: 0x8f9a8c, metal: 0x6c7075, insigne: "triangle", i: [0x5e8fc4, 0xeef2f4] },
    rouges: { peau: 0x8f9a92, ventre: 0xb0bcc0, metal: 0x6c7075, insigne: "roue", i: [0xd7b04a, 0x6e2f26] },
  };
  const coul = (equipe) => COULEURS[String(equipe).split("~")[0]] || COULEURS.bleus;
  let matFlamme = null;
  // l'INSIGNE inventé, posé à plat (« y ») ou sur le flanc (« z »)
  function insigne(g, T, K, x, y, z, r, axe, s) {
    const grp = new THREE.Group();
    grp.add(cylindre(r, r, 0.012, T, 18, K.i[0]));
    if (K.insigne === "triangle") {
      const t = O.piece(new THREE.CylinderGeometry(r * 0.75, r * 0.75, 0.016, 3), T, 0, 0.004, 0, K.i[1]);
      t.rotation.y = Math.PI / 2;
      grp.add(t);
    } else {
      for (let k = 0; k < 8; k++) { const d = boite(r * 0.3, 0.014, r * 0.3, T, Math.cos((k * Math.PI) / 4) * r * 1.05, 0, Math.sin((k * Math.PI) / 4) * r * 1.05, K.i[0]); d.rotation.y = -(k * Math.PI) / 4; grp.add(d); }
      grp.add(O.piece(new THREE.CylinderGeometry(r * 0.4, r * 0.4, 0.016, 14), T, 0, 0.004, 0, K.i[1]));
    }
    if (axe === "z") grp.rotation.x = s * Math.PI / 2;
    grp.position.set(x, y, z);
    grp.updateMatrixWorld(true);
    for (const m of [...grp.children]) { m.applyMatrix4(grp.matrix); g.add(m); }
  }
  function flamme(g, x, y, z, r) {
    matFlamme = matFlamme || new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.75, depthWrite: false });
    const f = new THREE.Mesh(new THREE.ConeGeometry(r, 3.2, 12, 1, true), matFlamme);
    f.geometry.translate(0, 1.6, 0); // (le large bout à la tuyère, la pointe 3,2 m derrière)
    f.rotation.z = Math.PI / 2;
    f.castShadow = false;
    const h = new THREE.Group();
    h.name = "flamme";
    h.position.set(x, y, z);
    h.add(f);
    h.userData.garder = true;
    g.add(h);
  }
  function pilote(g, T, x, y) {
    const pil = new THREE.Group();
    pil.name = "pilote";
    pil.add(O.piece(new THREE.SphereGeometry(0.16, 10, 8), T, x, y, 0, 0xd8d8d0)); // le casque blanc du pilote
    g.add(pil);
  }
  function souderTout(h) {
    const tout = new THREE.Group();
    h.updateMatrixWorld(true);
    h.traverse((m) => {
      if (!m.isMesh || !m.userData.teinte && m.material.type === "MeshBasicMaterial") return;
      const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte);
      if (m.userData.teinte) p.userData.teinte = m.userData.teinte;
      tout.add(p);
    });
    return tout;
  }

  // ------------------------------------------------------------------ LE CHASSEUR-BOMBARDIER « ORAGE » (nez vers x+)
  function orage(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 2.0;
    const fus = cylindre(0.55, 0.85, 11, T, simple ? 8 : 16, K.peau);
    fus.rotation.z = Math.PI / 2;
    fus.position.set(-0.8, yF, 0);
    fus.scale.set(1, 1, 1.25);
    caisse.add(fus);
    caisse.add(couche(cylindre(0.06, 0.55, 3.4, T, simple ? 8 : 16, 0x3a3d3a), "x", 6.4, yF + 0.05, 0)); // le long nez pointu (le radar)
    for (const s of [-1, 1]) {
      caisse.add(boite(3.6, 0.85, 0.5, T, 1.6, yF - 0.05, s * 0.95, K.peau)); // les grosses entrées d'air
      if (!simple) caisse.add(boite(0.05, 0.75, 0.42, T, 3.42, yF - 0.05, s * 0.97, 0x161616));
      const aile = boite(4.2, 0.14, 4.2, T, -0.8, yF - 0.35, s * 3.1, K.peau); // l'aile
      aile.rotation.y = s * 0.45;
      caisse.add(aile);
      const bout = boite(1.8, 0.1, 1.5, T, -1.4, yF - 0.05, s * 5.6, K.peau); // le bout d'aile RELEVÉ
      bout.rotation.x = -s * 0.2;
      caisse.add(bout);
      const stab = boite(2.0, 0.08, 2.4, T, -5.6, yF - 0.05, s * 1.8, K.peau); // le stabilisateur penché vers le BAS
      stab.rotation.x = s * 0.4;
      caisse.add(stab);
      caisse.add(couche(cylindre(0.42, 0.45, 0.6, T, 14, 0x3e3d3b), "x", -6.5, yF - 0.1, s * 0.45)); // les 2 tuyères
      if (!simple) {
        flamme(g, -6.8, yF - 0.1, s * 0.45, 0.36);
        for (const dx of [0.4, -1.4]) caisse.add(couche(cylindre(0.17, 0.17, 1.8, T, 10, 0x4a4c48), "x", dx, yF - 0.75, s * 2.6)); // les bombes sous les ailes
        insigne(caisse, T, K, -1.4, yF - 0.27, s * 3.8, 0.55, "y");
      }
    }
    const derive = boite(2.6, 2.2, 0.1, T, -5.2, yF + 1.3, 0, K.peau);
    derive.rotation.z = 0.5;
    caisse.add(derive);
    caisse.add(couche(cylindre(0.4, 0.4, 3.2, T, 12, 0x6c7068), "x", 0.2, yF - 0.95, 0)); // le bidon sous le ventre
    if (!simple) {
      const bulle = O.piece(new THREE.SphereGeometry(0.5, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), T, 3.0, yF + 0.5, 0, 0x1e2a32); // la verrière à 2 places
      bulle.scale.set(3.0, 0.9, 0.85);
      caisse.add(bulle);
      insigne(caisse, T, K, -2.8, yF + 0.1, 0.9, 0.5, "z", 1);
      insigne(caisse, T, K, -2.8, yF + 0.1, -0.9, 0.5, "z", -1);
      for (const [x, s] of [[4.6, 0], [-1.0, 1], [-1.0, -1]]) { // le train
        caisse.add(O.tube([x, yF - 0.6, s * 1.3], [x, 0.35, s * 1.5], 0.07, T, 6, K.metal));
        caisse.add(couche(cylindre(0.35, 0.35, 0.2, T, 14, 0x1c1c1c), "z", x, 0.35, s * 1.5));
      }
      pilote(g, T, 3.6, yF + 0.6);
    }
    return g;
  }
  // ------------------------------------------------------------------ L'INTERCEPTEUR « FLÈCHE »
  function fleche(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 2.0;
    const fus = cylindre(0.5, 0.58, 10.5, T, simple ? 8 : 16, K.peau); // le fuselage, fin comme un crayon
    fus.rotation.z = Math.PI / 2;
    fus.position.set(-0.4, yF, 0);
    caisse.add(fus);
    caisse.add(couche(cylindre(0.5, 0.5, 0.1, T, 16, 0x161616), "x", 4.85, yF, 0)); // l'entrée d'air dans le nez
    caisse.add(couche(cylindre(0.02, 0.26, 0.9, T, 12, 0x5a5e58), "x", 5.2, yF, 0)); // son cône
    for (const s of [-1, 1]) {
      // l'aile en TRIANGLE (un « delta »)
      const aile = O.piece(new THREE.CylinderGeometry(4.0, 4.0, 0.1, 3, 1), T, -2.0, yF - 0.25, s * 0.2, K.peau);
      aile.rotation.y = Math.PI;
      aile.scale.set(1.25, 1, s * 0.85);
      caisse.add(aile);
      const stab = boite(1.4, 0.08, 1.6, T, -4.6, yF, s * 1.1, K.peau);
      stab.rotation.y = s * 0.5;
      caisse.add(stab);
      if (!simple) {
        caisse.add(couche(cylindre(0.08, 0.08, 2.0, T, 8, 0xd8d8d0), "x", -1.6, yF - 0.55, s * 2.4)); // les missiles sous les ailes
        insigne(caisse, T, K, -2.6, yF - 0.18, s * 2.6, 0.5, "y");
      }
    }
    const derive = boite(2.6, 2.4, 0.1, T, -4.2, yF + 1.4, 0, K.peau);
    derive.rotation.z = 0.6;
    caisse.add(derive);
    caisse.add(couche(cylindre(0.48, 0.5, 0.5, T, 14, 0x3e3d3b), "x", -5.7, yF, 0)); // la tuyère
    if (!simple) {
      flamme(g, -5.95, yF, 0, 0.4);
      const bulle = O.piece(new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), T, 2.4, yF + 0.42, 0, 0x1e2a32);
      bulle.scale.set(2.2, 0.85, 0.9);
      caisse.add(bulle);
      caisse.add(couche(cylindre(0.38, 0.38, 3.0, T, 10, 0x6c7068), "x", 0.2, yF - 0.72, 0)); // le bidon
      insigne(caisse, T, K, -3.2, yF + 0.5, 0.06, 0.6, "z", 1);
      insigne(caisse, T, K, -3.2, yF + 0.5, -0.06, 0.6, "z", -1);
      for (const [x, s] of [[3.2, 0], [-1.5, 1], [-1.5, -1]]) {
        caisse.add(O.tube([x, yF - 0.5, s * 1.2], [x, 0.3, s * 1.3], 0.06, T, 6, K.metal));
        caisse.add(couche(cylindre(0.3, 0.3, 0.18, T, 14, 0x1c1c1c), "z", x, 0.3, s * 1.3));
      }
      pilote(g, T, 2.6, yF + 0.5);
    }
    return g;
  }
  // ------------------------------------------------------------------ L'HÉLICO DE COMBAT « VIPÈRE »
  function vipere(equipe, simple) {
    const K = coul(equipe), T = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const yF = 1.75;
    caisse.add(boite(4.6, 1.4, 0.95, T, 0.4, yF, 0, K.peau)); // le fuselage, très étroit
    caisse.add(couche(cylindre(0.2, 0.7, 1.3, T, 12, K.peau), "x", 3.3, yF - 0.05, 0)); // le nez
    caisse.add(boite(1.6, 0.6, 0.8, T, -1.2, yF + 0.95, 0, K.peau)); // le capot du moteur
    const poutre = cylindre(0.18, 0.45, 6.5, T, 10, K.peau); // la poutre de queue
    poutre.rotation.z = Math.PI / 2;
    poutre.position.set(-4.6, yF + 0.35, 0);
    caisse.add(poutre);
    caisse.add(boite(1.0, 1.6, 0.1, T, -7.6, yF + 1.0, 0, K.peau)); // la dérive
    caisse.add(boite(0.7, 0.06, 2.0, T, -5.6, yF + 0.35, 0, K.peau)); // le stabilisateur
    for (const s of [-1, 1]) {
      caisse.add(boite(1.0, 0.12, 1.4, T, -0.2, yF - 0.1, s * 1.1, K.peau)); // les petites ailes
      caisse.add(couche(cylindre(0.28, 0.28, 1.4, T, 12, 0x3a3e38), "x", -0.2, yF - 0.45, s * 1.5)); // les paniers de roquettes
      caisse.add(O.tube([1.4, 0.1, s * 1.0], [-1.6, 0.1, s * 1.0], 0.06, T, 6, K.metal)); // les patins
      for (const x of [0.9, -1.0]) caisse.add(O.tube([x, 0.1, s * 1.0], [x, yF - 0.65, s * 0.35], 0.05, T, 6, K.metal));
    }
    if (!simple) {
      const verriere = O.piece(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), T, 1.6, yF + 0.65, 0, 0x1e2a32); // les 2 places en tandem
      verriere.scale.set(3.0, 0.85, 0.85);
      caisse.add(verriere);
      caisse.add(O.piece(new THREE.SphereGeometry(0.28, 10, 8), T, 3.0, yF - 0.7, 0, 0x2c2e2c)); // la tourelle sous le nez
      caisse.add(couche(cylindre(0.04, 0.04, 0.9, T, 6, 0x161616), "x", 3.5, yF - 0.75, 0)); // sa mitrailleuse
      insigne(caisse, T, K, -3.6, yF + 0.35, 0.33, 0.35, "z", 1);
      insigne(caisse, T, K, -3.6, yF + 0.35, -0.33, 0.35, "z", -1);
      pilote(g, T, 2.2, yF + 0.75);
    }
    // le rotor à 2 PALES (il tourne autour de y), et le rotor de queue (autour de z)
    const rotor = new THREE.Group();
    rotor.name = "rotor";
    rotor.position.set(-0.6, yF + 1.55, 0);
    rotor.add(boite(13.4, 0.06, 0.55, T, 0, 0.1, 0, 0x262828));
    rotor.add(cylindre(0.22, 0.22, 0.4, T, 10, 0x3a3c3a));
    caisse.add(rotor);
    const queue = new THREE.Group();
    queue.name = "rotorQueue";
    queue.position.set(-7.7, yF + 1.0, 0.25);
    queue.add(boite(0.25, 2.4, 0.05, T, 0, 0, 0, 0x262828));
    caisse.add(queue);
    if (!simple) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x2a2c2e, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
      const flou = new THREE.Mesh(new THREE.CircleGeometry(6.7, 40).rotateX(-Math.PI / 2).translate(-0.6, yF + 1.62, 0), mat);
      flou.name = "flous";
      flou.visible = false;
      flou.castShadow = false;
      flou.userData.garder = true;
      caisse.add(flou);
    }
    return g;
  }
  const fabriquer = (f) => (equipe) => {
    const g = f(equipe, false), racine = new THREE.Group(), caisse = g.children[0];
    for (const m of souder(caisse, true)) caisse.add(m);
    for (const nom of ["rotor", "rotorQueue"]) { // (les rotors : soudés à part, autour de leur moyeu, pour qu'ils tournent)
      const r = caisse.getObjectByName(nom);
      if (!r) continue;
      const ici = r.position.clone();
      r.position.set(0, 0, 0);
      const t = souderTout(r);
      r.clear();
      for (const m of souder(t, true)) r.add(m);
      r.position.copy(ici);
    }
    racine.add(g);
    g.traverse((m) => m.isMesh && m.material.type !== "MeshBasicMaterial" && (m.castShadow = true));
    return racine;
  };
  const simple = (f) => (equipe) => souder(souderTout(f(equipe, true)), false)[0].geometry;
  A3.ajouterModele("orage", fabriquer(orage), simple(orage));
  A3.ajouterModele("fleche", fabriquer(fleche), simple(fleche));
  A3.ajouterModele("vipere", fabriquer(vipere), simple(vipere));
})();
