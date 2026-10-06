// 🛠️ LES SOLDATS ET LES ENGINS EN 3D : l'atelier (étape 61)
//
//   - le SOLDAT : un treillis de camouflage, un gilet, un casque, un sac à dos, une arme ; des jambes et des bras qui
//     se balancent quand il marche ; un brassard de la couleur de son équipe ; et pour toi, un PARACHUTE ;
//   - le 4x4 À MITRAILLEUSE (comme un véhicule militaire léger) : une caisse carrée, un arceau, une mitrailleuse sur
//     tourelle, 4 grosses roues ;
//   - l'HÉLICOPTÈRE TIGRE : un fuselage fin, deux places l'une derrière l'autre, des petites ailes avec les bombes,
//     le grand rotor (4 pales) et le petit rotor de queue ;
//   - l'AVION DE CHASSE RAFALE : une aile en triangle (« delta »), des petits plans devant (les « canards »), une dérive,
//     un cockpit en bulle, les missiles sous les ailes ;
//   - le DRONE : une croix à 4 hélices ;
//   - (étape 62) le BATEAU DE GUERRE : une coque pointue à l'avant (une forme dessinée vue de dessus, puis « tirée » vers
//     le haut), un pont, une cabine avec ses vitres, un mât avec un radar, et un canon sur tourelle à l'avant ;
//   - (étape 62) le PORTAIL : un grand anneau lumineux posé sur un socle de pierre, avec un tourbillon dedans.
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Engins3D = (function () {
  const M = {};
  function mats() {
    if (M.noir) return M;
    M.noir = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.6, metalness: 0.3 });
    M.metal = new THREE.MeshStandardMaterial({ color: 0x5b6066, roughness: 0.45, metalness: 0.7 });
    M.pneu = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: 0.95 });
    M.verre = new THREE.MeshPhysicalMaterial({ color: 0x1e3446, roughness: 0.05, metalness: 0.2, clearcoat: 1, transparent: true, opacity: 0.75 });
    M.peau = new THREE.MeshStandardMaterial({ color: 0xc99a74, roughness: 0.7 });
    M.gris = new THREE.MeshStandardMaterial({ color: 0x7c848b, roughness: 0.5, metalness: 0.4 });
    M.toile = new THREE.MeshStandardMaterial({ color: 0x5a6a3a, roughness: 0.95, side: THREE.DoubleSide });
    M.brule = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1 });
    return M;
  }
  const boite = (lx, ly, lz, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), m);
    b.position.set(x, y, z);
    b.castShadow = true;
    return b;
  };
  const cyl = (r1, r2, l, m, n) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, l, n || 12), m);
    c.castShadow = true;
    return c;
  };
  const peinture = (equipe) => new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.camouflage(Tanks.CONFIG.equipes[equipe].camouflage), roughness: 0.85, metalness: 0.1 });

  // ------------------------------------------------------------------ le soldat
  function soldat(equipe, joueur) {
    const m = mats(), E = Tanks.CONFIG.equipes[equipe];
    const tenue = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.camouflage(E.camouflage), roughness: 0.9 });
    const brassard = new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: joueur ? 0.6 : 0.3 });
    const g = new THREE.Group(), corps = new THREE.Group();
    g.add(corps);
    // les jambes (elles pivotent à la hanche)
    const jambes = [];
    for (const z of [-0.12, 0.12]) {
      const j = new THREE.Group();
      j.position.set(0, 0.9, z);
      const cuisse = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.62, 4, 8), tenue);
      cuisse.position.y = -0.42;
      cuisse.castShadow = true;
      j.add(cuisse, boite(0.24, 0.12, 0.13, m.noir, 0.05, -0.85, 0)); // et la chaussure
      corps.add(j);
      jambes.push(j);
    }
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.38, 4, 10), tenue);
    buste.position.y = 1.2;
    buste.castShadow = true;
    corps.add(buste);
    corps.add(boite(0.3, 0.42, 0.42, new THREE.MeshStandardMaterial({ color: 0x3d4430, roughness: 0.9 }), 0.02, 1.22, 0)); // le gilet
    corps.add(boite(0.22, 0.38, 0.32, new THREE.MeshStandardMaterial({ color: 0x3a4128, roughness: 0.95 }), -0.22, 1.25, 0)); // le sac à dos
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), m.peau);
    tete.position.y = 1.6;
    corps.add(tete);
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), tenue);
    casque.position.y = 1.62;
    casque.castShadow = true;
    corps.add(casque);
    for (const z of [-0.24, 0.24]) {
      const b = boite(0.12, 0.1, 0.05, brassard, 0, 1.32, z);
      corps.add(b);
    }
    // les bras tendus vers l'arme
    for (const z of [-0.2, 0.2]) {
      const bras = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), tenue);
      bras.position.set(0.22, 1.28, z * 0.6);
      bras.rotation.z = Math.PI / 2 - 0.25;
      corps.add(bras);
    }
    const arme = new THREE.Group();
    arme.position.set(0.45, 1.3, 0.05);
    corps.add(arme);
    const canons = {
      fusil: boite(0.85, 0.09, 0.06, m.noir, 0.1, 0, 0),
      pistolet: boite(0.25, 0.12, 0.05, m.noir, -0.05, 0, 0),
      roquettes: cyl(0.08, 0.08, 1.1, new THREE.MeshStandardMaterial({ color: 0x4b5a34, roughness: 0.8 }), 12),
    };
    canons.roquettes.rotation.z = Math.PI / 2;
    canons.roquettes.position.set(0, 0.08, 0);
    for (const c of Object.values(canons)) arme.add(c);
    const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    flamme.position.x = 0.6;
    arme.add(flamme);
    // le parachute (pour toi, quand tu t'éjectes de l'avion)
    let parachute = null;
    if (joueur) {
      parachute = new THREE.Group();
      const voile = new THREE.Mesh(new THREE.SphereGeometry(3.2, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.35), new THREE.MeshStandardMaterial({ color: 0x8a9a5a, roughness: 0.9, side: THREE.DoubleSide }));
      voile.position.y = 2.2;
      parachute.add(voile);
      for (const [x, z] of [[1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]]) {
        const fil = cyl(0.01, 0.01, 4.5, m.noir, 4);
        fil.position.set(x / 2, 3.6, z / 2);
        fil.lookAt(new THREE.Vector3(0, 1.4, 0));
        fil.rotateX(Math.PI / 2);
        parachute.add(fil);
      }
      parachute.position.y = 1.5;
      parachute.visible = false;
      g.add(parachute);
    }
    return { g, corps, jambes, arme, canons, flamme, parachute };
  }

  // ------------------------------------------------------------------ les engins
  function jeep(equipe) {
    const m = mats(), p = peinture(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    caisse.add(boite(4.6, 0.8, 2.1, p, 0, 1.0, 0)); // la caisse
    caisse.add(boite(1.4, 0.35, 2.0, p, 1.6, 1.5, 0)); // le capot
    const pareBrise = boite(0.06, 0.6, 1.9, m.verre, 0.85, 1.75, 0);
    pareBrise.rotation.z = 0.3;
    caisse.add(pareBrise);
    for (const [x, z] of [[0.7, 0.95], [0.7, -0.95], [-1.9, 0.95], [-1.9, -0.95]]) { // l'arceau
      const t = cyl(0.05, 0.05, 1.2, m.noir, 6);
      t.position.set(x, 2.0, z);
      caisse.add(t);
    }
    caisse.add(boite(2.7, 0.08, 2.0, m.noir, -0.6, 2.6, 0));
    caisse.add(boite(0.15, 0.4, 1.6, m.noir, 2.35, 0.9, 0)); // le pare-chocs
    for (const z of [-0.7, 0.7]) caisse.add(boite(0.05, 0.14, 0.22, m.verre, 2.32, 1.2, z)); // les phares
    // la mitrailleuse sur sa tourelle (sur l'arceau)
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.6, 2.65, 0);
    caisse.add(tourelle);
    tourelle.add(cyl(0.3, 0.35, 0.25, m.noir, 12));
    const mg = cyl(0.06, 0.06, 1.4, m.noir, 8);
    mg.rotation.z = Math.PI / 2;
    mg.position.set(0.7, 0.3, 0);
    tourelle.add(mg, boite(0.5, 0.25, 0.25, m.noir, 0.05, 0.3, 0), boite(0.05, 0.45, 0.6, p, 0.35, 0.4, 0));
    const roues = [];
    for (const [x, z] of [[1.5, 1.05], [1.5, -1.05], [-1.5, 1.05], [-1.5, -1.05]]) {
      const r = cyl(0.5, 0.5, 0.42, m.pneu, 18);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.5, z);
      g.add(r);
      roues.push(r);
    }
    return { g, caisse, tourelle, roues };
  }

  function helico(equipe) {
    const m = mats(), p = peinture(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 4.2, 6, 12), p);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.y = 1.9;
    fuselage.castShadow = true;
    caisse.add(fuselage);
    const queue = cyl(0.18, 0.45, 5.5, p, 10);
    queue.rotation.z = Math.PI / 2;
    queue.position.set(-5, 2.2, 0);
    caisse.add(queue);
    caisse.add(boite(0.8, 1.4, 0.08, p, -7.4, 2.8, 0)); // la dérive
    caisse.add(boite(0.7, 0.06, 1.8, p, -7.0, 2.2, 0)); // le petit plan horizontal
    for (const [x, h] of [[1.2, 2.55], [-0.3, 2.75]]) { // les deux places, l'une derrière l'autre, sous leurs bulles
      const bulle = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m.verre);
      bulle.scale.set(1.3, 0.9, 0.95);
      bulle.position.set(x, h - 0.3, 0);
      caisse.add(bulle);
    }
    caisse.add(boite(1.2, 0.08, 4.0, p, -0.2, 1.7, 0)); // les petites ailes
    for (const z of [-1.7, -1.1, 1.1, 1.7]) { // les bombes sous les ailes
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.7, 4, 8), m.gris);
      b.rotation.z = Math.PI / 2;
      b.position.set(-0.2, 1.4, z);
      caisse.add(b);
    }
    for (const z of [-0.6, 0.6]) caisse.add(boite(2.4, 0.08, 0.08, m.noir, 0.2, 0.15, z), boite(0.08, 0.9, 0.08, m.noir, 0.8, 0.6, z), boite(0.08, 0.9, 0.08, m.noir, -0.6, 0.6, z)); // les patins
    caisse.add(cyl(0.25, 0.3, 0.6, m.noir, 10).translateY(2.9));
    const rotor = new THREE.Group();
    rotor.position.y = 3.25;
    caisse.add(rotor);
    for (let k = 0; k < 4; k++) {
      const pale = boite(6.5, 0.04, 0.32, m.noir, 3.25, 0, 0);
      const bras = new THREE.Group();
      bras.rotation.y = (k * Math.PI) / 2;
      bras.add(pale);
      rotor.add(bras);
    }
    const rotorQueue = new THREE.Group();
    rotorQueue.position.set(-7.5, 2.8, 0.3);
    caisse.add(rotorQueue);
    for (let k = 0; k < 3; k++) {
      const pale = boite(0.1, 1.3, 0.04, m.noir, 0, 0.65, 0);
      const bras = new THREE.Group();
      bras.rotation.z = (k * Math.PI * 2) / 3;
      bras.add(pale);
      rotorQueue.add(bras);
    }
    return { g, caisse, rotor, rotorQueue };
  }

  function avion(equipe) {
    const m = mats(), g = new THREE.Group(), caisse = new THREE.Group();
    const gris = new THREE.MeshStandardMaterial({ color: 0x8c949c, roughness: 0.45, metalness: 0.5 });
    g.add(caisse);
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.75, 11, 6, 14), gris);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.y = 2.0;
    fuselage.castShadow = true;
    caisse.add(fuselage);
    const nez = cyl(0.01, 0.6, 2.2, gris, 12);
    nez.rotation.z = -Math.PI / 2;
    nez.position.set(6.8, 2.0, 0);
    caisse.add(nez);
    // l'aile delta (un triangle épais)
    const forme = new THREE.Shape([new THREE.Vector2(1.5, 0), new THREE.Vector2(-4.8, 5.5), new THREE.Vector2(-5.6, 5.4), new THREE.Vector2(-5.2, 0), new THREE.Vector2(-5.6, -5.4), new THREE.Vector2(-4.8, -5.5)]);
    const aile = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 }), gris);
    aile.rotation.x = Math.PI / 2;
    aile.position.y = 1.85;
    aile.castShadow = true;
    caisse.add(aile);
    // les canards (petits plans à l'avant), la dérive, le cockpit, les entrées d'air, la tuyère
    const canard = new THREE.Shape([new THREE.Vector2(0.5, 0), new THREE.Vector2(-0.8, 1.8), new THREE.Vector2(-1.2, 1.7), new THREE.Vector2(-1, 0), new THREE.Vector2(-1.2, -1.7), new THREE.Vector2(-0.8, -1.8)]);
    const canards = new THREE.Mesh(new THREE.ExtrudeGeometry(canard, { depth: 0.08, bevelEnabled: false }), gris);
    canards.rotation.x = Math.PI / 2;
    canards.position.set(3.2, 2.35, 0);
    caisse.add(canards);
    const derive = new THREE.Shape([new THREE.Vector2(-2.6, 0), new THREE.Vector2(-5.6, 3.2), new THREE.Vector2(-6.3, 3.2), new THREE.Vector2(-6, 0)]);
    const d = new THREE.Mesh(new THREE.ExtrudeGeometry(derive, { depth: 0.12, bevelEnabled: false }), gris);
    d.position.set(0, 2.5, -0.06);
    caisse.add(d);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.62, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m.verre);
    cockpit.scale.set(2.6, 0.9, 0.95);
    cockpit.position.set(3.4, 2.5, 0);
    caisse.add(cockpit);
    for (const z of [-0.85, 0.85]) caisse.add(boite(2.4, 0.7, 0.5, gris, 1.2, 1.7, z));
    const tuyere = cyl(0.5, 0.42, 0.9, m.noir, 14);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(-6.5, 2.0, 0);
    caisse.add(tuyere);
    const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 10), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.8 }));
    flamme.rotation.z = Math.PI / 2;
    flamme.position.set(-8.1, 2.0, 0);
    caisse.add(flamme);
    for (const z of [-3.4, -2.2, 2.2, 3.4]) { // les missiles sous les ailes
      const mi = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 2.2, 4, 8), new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.5 }));
      mi.rotation.z = Math.PI / 2;
      mi.position.set(-2.5, 1.55, z);
      caisse.add(mi);
    }
    // le train d'atterrissage, et la cocarde bleu-blanc-rouge sur les ailes
    for (const [x, z] of [[4, 0], [-1.5, 1.4], [-1.5, -1.4]]) caisse.add(boite(0.1, 1.3, 0.1, m.noir, x, 0.9, z), cyl(0.28, 0.28, 0.18, m.pneu, 10).rotateX(Math.PI / 2).translateY(0).translateX(0));
    for (const z of [-3.8, 3.8]) {
      for (const [r, c] of [[0.7, 0x1d3f9a], [0.47, 0xffffff], [0.24, 0xd21f1f]]) {
        const rond = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
        rond.rotation.x = -Math.PI / 2;
        rond.position.set(-3.2, 2.06 + (0.7 - r) * 0.01, z);
        caisse.add(rond);
      }
    }
    return { g, caisse, flamme };
  }

  function drone(equipe) {
    const m = mats(), p = peinture(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    caisse.add(boite(0.9, 0.35, 0.9, p, 0, 0.6, 0));
    caisse.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), m.verre).translateX(0.45).translateY(0.5)); // la caméra
    const helices = [];
    for (const [x, z] of [[0.9, 0.9], [0.9, -0.9], [-0.9, 0.9], [-0.9, -0.9]]) {
      const bras = boite(Math.hypot(x, z), 0.08, 0.08, m.noir, x / 2, 0.65, z / 2);
      bras.rotation.y = -Math.atan2(z, x);
      caisse.add(bras, cyl(0.08, 0.08, 0.2, m.noir, 8).translateX(x).translateY(0.75).translateZ(z));
      const h = boite(0.9, 0.02, 0.08, m.noir, x, 0.86, z);
      caisse.add(h);
      helices.push(h);
    }
    for (const z of [-0.3, 0.3]) caisse.add(boite(1, 0.05, 0.05, m.noir, 0, 0.15, z), boite(0.05, 0.4, 0.05, m.noir, 0, 0.35, z));
    return { g, caisse, helices };
  }

  function bateau(equipe) {
    const m = mats(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const coqueCouleur = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x5d6870 : 0x7a7466, roughness: 0.55, metalness: 0.35 });
    const pont = new THREE.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.8 });
    g.add(caisse);
    // la coque : vue de dessus, une forme pointue à l'avant (x+), carrée à l'arrière
    const L = 10, l = 3.4;
    const forme = new THREE.Shape();
    forme.moveTo(-L / 2, -l / 2);
    forme.lineTo(L * 0.1, -l / 2);
    forme.quadraticCurveTo(L * 0.4, -l / 2, L / 2, 0);
    forme.quadraticCurveTo(L * 0.4, l / 2, L * 0.1, l / 2);
    forme.lineTo(-L / 2, l / 2);
    forme.closePath();
    const coque = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 1.6, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2 }), coqueCouleur);
    coque.rotation.x = -Math.PI / 2; // (la forme est dessinée « à plat », on la couche sur l'eau)
    coque.position.y = -0.6;
    coque.castShadow = true;
    caisse.add(coque);
    const dessus = new THREE.Mesh(new THREE.ShapeGeometry(forme), pont);
    dessus.rotation.x = -Math.PI / 2;
    dessus.position.y = 1.03;
    caisse.add(dessus);
    // une bande de la couleur de l'équipe, et le numéro de coque
    caisse.add(boite(L * 0.55, 0.18, l + 0.26, new THREE.MeshStandardMaterial({ color: E.marque, roughness: 0.6 }), -L * 0.2, 0.75, 0));
    // la cabine, ses vitres, le mât et le radar
    caisse.add(boite(3.2, 1.6, 2.4, coqueCouleur, -1.2, 1.85, 0));
    caisse.add(boite(0.06, 0.55, 2.0, m.verre, 0.42, 2.2, 0));
    for (const z of [-1.21, 1.21]) caisse.add(boite(2.4, 0.5, 0.06, m.verre, -1.1, 2.2, z));
    const mat = cyl(0.07, 0.09, 2.6, m.metal, 6);
    mat.position.set(-1.8, 3.9, 0);
    caisse.add(mat, boite(0.15, 0.15, 1.4, m.noir, -1.8, 4.6, 0));
    const radar = boite(0.08, 0.35, 1.3, m.gris, -1.8, 5.0, 0);
    caisse.add(radar);
    caisse.add(boite(1.2, 0.5, 2.2, pont, -4.2, 1.3, 0)); // (le moteur, à l'arrière)
    for (const z of [-1.55, 1.55]) caisse.add(boite(6, 0.05, 0.05, m.metal, -1, 1.6, z)); // le garde-corps
    // le canon sur sa tourelle, à l'avant
    const tourelle = new THREE.Group();
    tourelle.position.set(2.4, 1.05, 0);
    caisse.add(tourelle);
    tourelle.add(cyl(0.7, 0.8, 0.5, coqueCouleur, 14).translateY(0.25));
    tourelle.add(boite(1.2, 0.7, 1.1, coqueCouleur, 0, 0.8, 0));
    const canon = cyl(0.1, 0.12, 2.2, m.noir, 10);
    canon.rotation.z = Math.PI / 2;
    canon.position.set(1.6, 0.85, 0);
    tourelle.add(canon);
    return { g, caisse, tourelle, radar };
  }

  // Le portail : un anneau qui brille, un tourbillon (un disque avec une spirale dessinée, qui tourne) et un socle.
  function portail(couleur, rayon) {
    const g = new THREE.Group(), c = new THREE.Color(couleur);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(rayon, 0.38, 14, 48), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.4 }));
    anneau.position.y = rayon + 0.3;
    g.add(anneau);
    const toile = document.createElement("canvas");
    toile.width = toile.height = 256;
    const ctx = toile.getContext("2d");
    const fond = ctx.createRadialGradient(128, 128, 5, 128, 128, 128);
    fond.addColorStop(0, "rgba(255,255,255,0.95)");
    fond.addColorStop(0.4, couleur);
    fond.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 6;
    for (let bras = 0; bras < 4; bras++) { // la spirale (4 bras)
      ctx.beginPath();
      for (let k = 0; k < 60; k++) {
        const a = bras * (Math.PI / 2) + k * 0.09, r = k * 2.1;
        ctx.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    const tourbillon = new THREE.Mesh(new THREE.CircleGeometry(rayon - 0.2, 40), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    tourbillon.rotation.y = Math.PI / 2; // (le disque face à x+ : on passe à travers en allant le long de x)
    tourbillon.position.y = rayon + 0.3;
    g.add(tourbillon);
    anneau.rotation.y = Math.PI / 2;
    const pierre = new THREE.MeshStandardMaterial({ color: 0x8a8578, roughness: 0.95 });
    for (const z of [-rayon - 0.3, rayon + 0.3]) g.add(boite(1.4, 1.2, 1.4, pierre, 0, 0.3, z));
    const lumiere = new THREE.PointLight(c, 6, 18, 2);
    lumiere.position.y = rayon + 0.3;
    g.add(lumiere);
    return { g, tourbillon, anneau };
  }

  function fabriquer(sorte, equipe) {
    return { jeep, helico, avion, drone, bateau }[sorte](equipe);
  }
  function bruler(o) {
    const m = mats();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
  }

  return { soldat, fabriquer, bruler, portail };
})();
