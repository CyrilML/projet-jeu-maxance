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

  // ------------------------------------------------------------------ le soldat (refait à l'étape 63)
  // Un vrai petit squelette, comme dans les jeux : chaque morceau du corps est accroché à une ARTICULATION (un groupe
  // qui peut tourner) : les hanches et les genoux, les épaules et les coudes, le dos, le cou. Pour marcher, on fait
  // tourner les hanches et plier les genoux ; pour tenir le fusil, on calcule où mettre les coudes pour que les mains
  // tombent pile sur l'arme (c'est la « cinématique inverse » : on part de la main et on remonte jusqu'à l'épaule).
  // Deux versions : en DÉTAIL (visage, gilet à poches, genouillères, gants, fusil avec chargeur et lunette) quand il
  // est près de la caméra, et en SIMPLE quand il est loin (on ne verrait pas la différence, et ça va plus vite).
  const matsEquipe = {};
  function matsSoldat(equipe) {
    if (matsEquipe[equipe]) return matsEquipe[equipe];
    const E = Tanks.CONFIG.equipes[equipe], camo = Tanks.Chars3D.camouflage(E.camouflage).clone();
    camo.needsUpdate = true;
    camo.repeat.set(1.6, 1.6); // (des taches plus petites que sur un tank)
    return (matsEquipe[equipe] = {
      tenue: new THREE.MeshStandardMaterial({ map: camo, roughness: 0.92 }),
      gilet: new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x5f6a4a : 0x8a7a56, roughness: 0.85 }),
      sangle: new THREE.MeshStandardMaterial({ color: 0x3d3a2e, roughness: 0.9 }),
      peau: new THREE.MeshStandardMaterial({ color: 0xc8956c, roughness: 0.65 }),
      bottes: new THREE.MeshStandardMaterial({ color: 0x3a2c20, roughness: 0.8 }),
      gants: new THREE.MeshStandardMaterial({ color: 0x1e1e1c, roughness: 0.8 }),
      arme: new THREE.MeshStandardMaterial({ color: 0x23252a, roughness: 0.45, metalness: 0.6 }),
      lunette: new THREE.MeshStandardMaterial({ color: 0x0c1418, roughness: 0.1, metalness: 0.5 }),
      yeux: new THREE.MeshStandardMaterial({ color: 0x1b1410, roughness: 0.3 }),
      marque: new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.35 }),
      marqueToi: new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.8 }),
      roquettes: new THREE.MeshStandardMaterial({ color: 0x4b5a34, roughness: 0.8 }),
    });
  }
  // « Souder » : tous les morceaux d'une même matière, dans un même groupe, deviennent un seul objet à dessiner
  // (la carte graphique préfère dessiner 1 gros objet que 10 petits).
  function souder(groupe) {
    const parMatiere = new Map();
    for (const enfant of [...groupe.children]) {
      if (!enfant.isMesh || enfant.userData.garder) continue;
      enfant.updateMatrix();
      const g = (enfant.geometry.index ? enfant.geometry.toNonIndexed() : enfant.geometry.clone()).applyMatrix4(enfant.matrix);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!parMatiere.has(enfant.material)) parMatiere.set(enfant.material, []);
      parMatiere.get(enfant.material).push(g);
      groupe.remove(enfant);
    }
    for (const [matiere, geos] of parMatiere) {
      const tout = {};
      for (const nom of ["position", "normal", "uv"]) {
        const n = geos.reduce((t, g) => t + g.attributes[nom].array.length, 0), tab = new Float32Array(n);
        let k = 0;
        for (const g of geos) (tab.set(g.attributes[nom].array, k), (k += g.attributes[nom].array.length));
        tout[nom] = new THREE.BufferAttribute(tab, nom === "uv" ? 2 : 3);
      }
      const geo = new THREE.BufferGeometry();
      for (const nom in tout) geo.setAttribute(nom, tout[nom]);
      const m = new THREE.Mesh(geo, matiere);
      m.castShadow = true;
      groupe.add(m);
    }
  }
  const morceau = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  };
  const capsule = (r, l, mat, x, y, z) => morceau(new THREE.CapsuleGeometry(r, l, 3, 8), mat, x, y, z);
  const cube = (lx, ly, lz, mat, x, y, z) => morceau(new THREE.BoxGeometry(lx, ly, lz), mat, x, y, z);
  const boule = (r, mat, x, y, z) => morceau(new THREE.SphereGeometry(r, 10, 8), mat, x, y, z);
  const tube = (r1, r2, l, mat) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, l, 10), mat);
    c.castShadow = true;
    return c;
  };

  // Les longueurs (en m) : un soldat de 1,80 m.
  const OS = { hanche: 0.92, cuisse: 0.44, tibia: 0.44, bras: 0.29, avantBras: 0.27, ecartHanches: 0.1, ecartEpaules: 0.2, dos: 0.98, epaules: 0.44 };

  // Les armes, dans les mains (dans le repère du dos : x devant, y en haut, z à droite).
  function armes(M, detail) {
    const fusil = new THREE.Group();
    fusil.add(cube(0.24, 0.09, 0.05, M.arme, -0.02, -0.01, 0)); // la crosse
    fusil.add(cube(0.32, 0.1, 0.055, M.arme, 0.26, 0.01, 0)); // le boîtier
    fusil.add(cube(0.22, 0.07, 0.06, M.arme, 0.52, 0.0, 0)); // le garde-main
    const canon = tube(0.014, 0.014, 0.32, M.arme);
    canon.rotation.z = Math.PI / 2;
    canon.position.set(0.78, 0.01, 0);
    fusil.add(canon);
    if (detail) {
      const chargeur = cube(0.06, 0.17, 0.035, M.arme, 0.33, -0.11, 0);
      chargeur.rotation.z = 0.25;
      fusil.add(chargeur);
      fusil.add(cube(0.05, 0.1, 0.035, M.arme, 0.18, -0.08, 0)); // la poignée
      const lunette = tube(0.022, 0.022, 0.16, M.lunette);
      lunette.rotation.z = Math.PI / 2;
      lunette.position.set(0.28, 0.09, 0);
      fusil.add(lunette, cube(0.03, 0.04, 0.03, M.arme, 0.28, 0.06, 0));
    }
    fusil.position.set(0.2, 0.28, 0.1); // (la crosse contre l'épaule droite)
    const pistolet = new THREE.Group();
    pistolet.add(cube(0.17, 0.045, 0.03, M.arme, 0.04, 0.02, 0), cube(0.045, 0.1, 0.03, M.arme, -0.02, -0.04, 0));
    pistolet.position.set(0.48, 0.3, 0.03);
    const roquettes = new THREE.Group();
    const lance = tube(0.07, 0.07, 1.1, M.roquettes);
    lance.rotation.z = Math.PI / 2;
    roquettes.add(lance, cube(0.06, 0.12, 0.04, M.arme, 0.1, -0.1, 0));
    roquettes.position.set(0.15, 0.5, 0.15); // (sur l'épaule)
    for (const g of [fusil, pistolet, roquettes]) souder(g);
    return { fusil, pistolet, roquettes };
  }
  // Où vont les mains pour chaque arme (dans le repère du dos).
  const MAINS = {
    fusil: { droite: [0.36, 0.22, 0.1], gauche: [0.6, 0.26, 0.06] },
    pistolet: { droite: [0.44, 0.27, 0.05], gauche: [0.43, 0.25, -0.01] },
    roquettes: { droite: [0.3, 0.41, 0.15], gauche: [0.55, 0.42, 0.12] },
  };

  // Le squelette avec sa peau. detail = true : la belle version ; false : la version simple.
  function squelette(equipe, joueur, detail) {
    const M = matsSoldat(equipe);
    const corps = new THREE.Group();
    const jambes = [], genoux = [], epaules = [], coudes = [];
    // les jambes
    for (const z of [-OS.ecartHanches, OS.ecartHanches]) {
      const hanche = new THREE.Group();
      hanche.position.set(0, OS.hanche, z);
      hanche.add(capsule(detail ? 0.085 : 0.08, OS.cuisse - 0.12, M.tenue, 0, -OS.cuisse / 2, 0));
      if (detail) hanche.add(cube(0.08, 0.14, 0.05, M.gilet, 0.0, -0.22, z > 0 ? 0.08 : -0.08)); // la poche de jambe
      const genou = new THREE.Group();
      genou.position.y = -OS.cuisse;
      genou.add(capsule(0.065, OS.tibia - 0.1, M.tenue, 0, -OS.tibia / 2, 0));
      genou.add(cube(0.28, 0.12, 0.12, M.bottes, 0.05, -OS.tibia + 0.02, 0)); // la botte
      if (detail) genou.add(cube(0.05, 0.11, 0.1, M.sangle, 0.06, -0.03, 0), cube(0.29, 0.03, 0.13, M.sangle, 0.05, -OS.tibia - 0.03, 0)); // genouillère, semelle
      souder(genou);
      souder(hanche);
      hanche.add(genou);
      corps.add(hanche);
      jambes.push(hanche);
      genoux.push(genou);
    }
    // le dos (tout le haut du corps tourne autour de lui)
    const dos = new THREE.Group();
    dos.position.y = OS.dos;
    corps.add(dos);
    const torse = capsule(0.16, 0.26, M.tenue, 0, 0.23, 0);
    torse.scale.set(0.82, 1, 1.25);
    dos.add(torse);
    dos.add(cube(0.24, 0.16, 0.32, M.tenue, 0, -0.04, 0)); // le bassin
    dos.add(cube(0.27, 0.06, 0.35, M.sangle, 0, 0.0, 0)); // la ceinture
    dos.add(cube(0.3, 0.36, 0.38, M.gilet, 0.01, 0.25, 0)); // le gilet pare-balles
    dos.add(cube(0.2, 0.34, 0.28, M.gilet, -0.21, 0.26, 0)); // le sac à dos
    if (detail) {
      for (const z of [-0.11, 0, 0.11]) dos.add(cube(0.06, 0.1, 0.085, M.gilet, 0.18, 0.15, z)); // les poches à chargeurs
      dos.add(cube(0.05, 0.08, 0.1, M.gilet, 0.17, 0.33, 0.1), cube(0.03, 0.035, 0.035, M.arme, 0.2, 0.33, -0.1)); // poche radio, lampe
      for (const z of [-0.12, 0.12]) dos.add(cube(0.33, 0.4, 0.03, M.sangle, 0.0, 0.26, z)); // les bretelles
      const rouleau = tube(0.06, 0.06, 0.3, M.sangle);
      rouleau.rotation.x = Math.PI / 2;
      rouleau.position.set(-0.2, 0.47, 0);
      dos.add(rouleau); // le duvet roulé sur le sac
      dos.add(cube(0.035, 0.04, 0.04, M.sangle, -0.04, 0.0, 0.17)); // la gourde
    }
    // la tête
    const cou = new THREE.Group();
    cou.position.y = 0.5;
    dos.add(cou);
    cou.add(morceau(new THREE.CylinderGeometry(0.05, 0.055, 0.1, 8), M.peau, 0, 0.02, 0));
    const tete = boule(0.105, M.peau, 0.01, 0.13, 0);
    tete.scale.set(1.0, 1.18, 0.92);
    cou.add(tete);
    const casque = morceau(new THREE.SphereGeometry(0.135, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.52), M.tenue, -0.005, 0.17, 0);
    casque.scale.set(1.08, 0.95, 1.04);
    cou.add(casque);
    if (detail) {
      cou.add(cube(0.035, 0.035, 0.03, M.peau, 0.105, 0.12, 0)); // le nez
      for (const z of [-0.035, 0.035]) cou.add(boule(0.012, M.yeux, 0.092, 0.145, z)); // les yeux
      for (const z of [-0.098, 0.098]) cou.add(cube(0.03, 0.05, 0.02, M.peau, 0.0, 0.13, z)); // les oreilles
      cou.add(cube(0.04, 0.012, 0.09, M.yeux, 0.095, 0.172, 0)); // les sourcils
      cou.add(cube(0.05, 0.05, 0.19, M.lunette, 0.11, 0.24, 0)); // les lunettes de protection, sur le casque
      cou.add(cube(0.02, 0.1, 0.012, M.sangle, 0.04, 0.08, 0.1), cube(0.02, 0.1, 0.012, M.sangle, 0.04, 0.08, -0.1)); // la jugulaire
    }
    souder(cou);
    // les bras (épaule → coude → main)
    for (const z of [OS.ecartEpaules, -OS.ecartEpaules]) {
      const epaule = new THREE.Group();
      epaule.position.set(0, OS.epaules, z);
      epaule.add(capsule(0.06, OS.bras - 0.1, M.tenue, 0, -OS.bras / 2, 0));
      epaule.add(cube(0.12, 0.08, 0.13, z > 0 && joueur ? M.marqueToi : M.marque, 0, -0.09, 0)); // le brassard de l'équipe
      const coude = new THREE.Group();
      coude.position.y = -OS.bras;
      coude.add(capsule(0.05, OS.avantBras - 0.09, M.tenue, 0, -OS.avantBras / 2, 0));
      coude.add(boule(0.045, M.gants, 0, -OS.avantBras - 0.01, 0)); // la main (gantée)
      if (detail) coude.add(cube(0.08, 0.07, 0.11, M.sangle, 0, -0.02, 0)); // la coudière
      souder(coude);
      souder(epaule);
      epaule.add(coude);
      dos.add(epaule);
      epaules.push(epaule);
      coudes.push(coude);
    }
    const canons = armes(M, detail);
    for (const c of Object.values(canons)) dos.add(c);
    const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
    flamme.userData.garder = true;
    flamme.position.set(0.98, 0.29, 0.1);
    dos.add(flamme);
    souder(dos);
    return { corps, dos, cou, jambes, genoux, epaules, coudes, canons, flamme, pose: null };
  }

  // La « cinématique inverse » à 2 os : l'épaule S, la main voulue M ; on cherche le coude.
  // (Le triangle épaule-coude-main a deux côtés connus, le bras et l'avant-bras, et le troisième côté, c'est la
  // distance de l'épaule à la main : la loi des cosinus donne l'angle à l'épaule.)
  const BAS = new THREE.Vector3(0, -1, 0), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
  function poserBras(epaule, coude, cible, pole) {
    const S = epaule.position, a = OS.bras, b = OS.avantBras + 0.01;
    const vers = new THREE.Vector3().fromArray(cible).sub(S), d = Math.min(a + b - 0.001, Math.max(0.05, vers.length()));
    vers.normalize();
    const cosA = (a * a + d * d - b * b) / (2 * a * d), sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const p = pole.clone().sub(vers.clone().multiplyScalar(pole.dot(vers))).normalize();
    const coudeEn = vers.clone().multiplyScalar(a * cosA).add(p.multiplyScalar(a * sinA));
    const main = vers.clone().multiplyScalar(d);
    q1.setFromUnitVectors(BAS, coudeEn.clone().normalize());
    epaule.quaternion.copy(q1);
    q2.setFromUnitVectors(BAS, main.sub(coudeEn).normalize());
    coude.quaternion.copy(q1.clone().invert().multiply(q2));
  }
  const POLES = [new THREE.Vector3(-0.3, -1, 0.8), new THREE.Vector3(-0.3, -1, -0.8)]; // (les coudes vont en bas et vers l'extérieur)
  function tenir(r, arme) {
    if (r.pose === arme) return;
    r.pose = arme;
    const m = MAINS[arme];
    poserBras(r.epaules[0], r.coudes[0], m.droite, POLES[0]);
    poserBras(r.epaules[1], r.coudes[1], m.gauche, POLES[1]);
  }

  function soldat(equipe, joueur) {
    const g = new THREE.Group();
    const detail = squelette(equipe, joueur, true), simple = squelette(equipe, joueur, false);
    g.add(detail.corps, simple.corps);
    simple.corps.visible = false;
    // le parachute (pour toi, quand tu t'éjectes de l'avion ; et, étape 64, pour les parachutistes)
    let parachute = null;
    {
      const m = mats();
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
    return { g, detail, simple, parachute };
  }

  // L'animation : marcher, courir, tourner sur place, nager, tomber. t = l'horloge (s).
  function animer(o, s, t, tourne, pres) {
    const r = pres ? o.detail : o.simple;
    o.detail.corps.visible = pres;
    o.simple.corps.visible = !pres;
    const arme = s.arme === "pistolet" ? "pistolet" : s.arme === "roquettes" || s.roquettesIA ? "roquettes" : "fusil";
    for (const n in r.canons) r.canons[n].visible = n === arme && !s.nage && !s.mort;
    r.flamme.visible = s.tir > 0 && arme !== "roquettes" && !s.mort;
    if (r.flamme.visible) r.flamme.position.x = arme === "pistolet" ? 0.62 : 0.98;
    const c = r.corps;
    if (s.mort) {
      // il tombe sur le dos en une demi-seconde, les bras ouverts
      const k = Math.min(1, s.depuisMort * 2);
      c.rotation.set(0, 0, k * (Math.PI / 2));
      c.position.set(0, 0.12 * k, 0);
      r.pose = null;
      for (const e of r.epaules) e.quaternion.identity(), e.rotation.set(0, 0, 0.6 * k);
      for (const g of r.genoux) g.rotation.z = -0.3 * k;
      return;
    }
    if (s.nage) {
      // à plat ventre dans l'eau, la tête dehors ; les bras font la brasse et les jambes battent
      c.rotation.set(0, 0, -1.35);
      c.position.set(-0.2, 1.12, 0);
      r.pose = null;
      const brasse = t * 3;
      for (let i = 0; i < 2; i++) {
        r.epaules[i].quaternion.identity();
        r.epaules[i].rotation.set((i ? -1 : 1) * (0.4 + Math.sin(brasse) * 0.6), 0, 2.6 + Math.cos(brasse) * 0.5);
        r.coudes[i].quaternion.identity();
        r.coudes[i].rotation.z = 0.4;
        r.jambes[i].rotation.z = Math.sin(t * 7 + i * Math.PI) * 0.25;
        r.genoux[i].rotation.z = -0.3;
      }
      return;
    }
    c.rotation.set(0, 0, 0);
    tenir(r, arme);
    // les jambes : la hanche se balance, le genou plie quand la jambe revient vers l'arrière
    const v = Math.abs(s.vitesse), ampleur = Math.max(Math.min(1, v / 3.5), tourne ? 0.35 : 0);
    const phase = s.pas * 2.6 + (tourne && v < 0.5 ? t * 7 : 0);
    for (let i = 0; i < 2; i++) {
      const p = phase + i * Math.PI, sens = s.vitesse < -0.1 ? -1 : 1;
      r.jambes[i].rotation.z = Math.sin(p) * 0.55 * ampleur * sens;
      r.genoux[i].rotation.z = -Math.max(0, Math.sin(p + 1.3)) * 0.95 * ampleur;
    }
    // le corps monte et descend un peu à chaque pas, et se penche en avant quand il court ; il respire au repos
    c.position.set(0, -Math.abs(Math.cos(phase)) * 0.045 * ampleur, 0);
    r.dos.rotation.z = -0.13 * Math.min(1, v / 4) + (s.tir > 0 && arme !== "roquettes" ? 0.025 : 0); // (le recul du tir)
    r.dos.scale.y = 1 + Math.sin(t * 2.2) * 0.008 * (1 - ampleur);
    r.cou.rotation.z = 0.08 * Math.min(1, v / 4); // (il garde la tête droite en courant)
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
    // (étape 64 : le chasseur ENNEMI est le même avion, mais gris-vert foncé, avec des cocardes rouges)
    const gris = new THREE.MeshStandardMaterial({ color: equipe === "rouges" ? 0x5c6352 : 0x8c949c, roughness: 0.45, metalness: 0.5 });
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
    const train = new THREE.Group(); // (rentré en vol)
    caisse.add(train);
    for (const [x, z] of [[4, 0], [-1.5, 1.4], [-1.5, -1.4]]) {
      const roue = cyl(0.28, 0.28, 0.18, m.pneu, 10);
      roue.rotation.x = Math.PI / 2;
      roue.position.set(x, 0.28, z);
      train.add(boite(0.1, 1.3, 0.1, m.noir, x, 0.9, z), roue);
    }
    const couleurs = equipe === "rouges" ? [[0.7, 0xd21f1f], [0.47, 0xffffff], [0.24, 0xd21f1f]] : [[0.7, 0x1d3f9a], [0.47, 0xffffff], [0.24, 0xd21f1f]];
    for (const z of [-3.8, 3.8]) {
      for (const [r, c] of couleurs) {
        const rond = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
        rond.rotation.x = -Math.PI / 2;
        rond.position.set(-3.2, 2.06 + (0.7 - r) * 0.01, z);
        caisse.add(rond);
      }
    }
    return { g, caisse, flamme, train };
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

  // (étape 63) Le sous-marin : une longue coque ronde (un « cigare »), le kiosque au milieu avec ses ailerons (les
  // « barres de plongée »), le périscope, la croix de gouvernails à l'arrière et l'hélice. Construit « nez vers x+ »,
  // avec le bas de la coque en y = 0.
  function sousmarin(equipe) {
    const m = mats(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const coque = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x2b3136 : 0x3a3530, roughness: 0.5, metalness: 0.45 });
    const marque = new THREE.MeshStandardMaterial({ color: E.marque, roughness: 0.6 });
    g.add(caisse);
    const corps = new THREE.Mesh(new THREE.CapsuleGeometry(1.25, 11.2, 8, 18), coque);
    corps.rotation.z = Math.PI / 2;
    corps.position.y = 1.3;
    corps.scale.set(1, 1, 1);
    corps.castShadow = true;
    caisse.add(corps);
    caisse.add(boite(9, 0.08, 1.1, coque, 0.5, 2.52, 0)); // le pont, sur le dessus
    // le kiosque
    const kiosque = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.6, 4, 12), coque);
    kiosque.rotation.z = Math.PI / 2;
    kiosque.scale.set(1.6, 1, 0.7);
    kiosque.position.set(1.2, 3.1, 0);
    caisse.add(kiosque);
    caisse.add(boite(2.4, 0.9, 0.9, coque, 1.2, 3.0, 0));
    for (const z of [-0.47, 0.47]) caisse.add(boite(1.2, 0.25, 0.02, marque, 1.2, 3.2, z)); // la bande de l'équipe
    for (const z of [-1, 1]) caisse.add(boite(0.7, 0.06, 0.9, coque, 1.4, 3.1, z * 0.85)); // les barres de plongée
    const periscope = cyl(0.06, 0.06, 1.6, m.metal, 8);
    periscope.position.set(1.5, 4.1, 0);
    caisse.add(periscope, boite(0.22, 0.1, 0.1, m.metal, 1.58, 4.9, 0));
    caisse.add(cyl(0.04, 0.04, 1.2, m.noir, 6).translateX(0.9).translateY(3.9)); // l'antenne
    // la croix de gouvernails et l'hélice, à l'arrière
    caisse.add(boite(1.4, 1.9, 0.08, coque, -6.4, 1.3, 0), boite(1.4, 0.08, 2.6, coque, -6.4, 1.3, 0));
    const helice = new THREE.Group();
    helice.position.set(-7.3, 1.3, 0);
    for (let k = 0; k < 5; k++) {
      const pale = boite(0.06, 0.7, 0.18, m.metal, 0, 0.35, 0);
      const bras = new THREE.Group();
      bras.rotation.x = (k * Math.PI * 2) / 5;
      bras.add(pale);
      helice.add(bras);
    }
    caisse.add(helice);
    return { g, caisse, helice };
  }

  // (étape 64) L'AVION DE TRANSPORT (comme un A400M) : un gros fuselage, les ailes en haut, 4 hélices, une queue en T,
  // et une porte à l'arrière d'où sautent les parachutistes.
  function transport(equipe) {
    const m = mats(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const peau = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x6b7461 : 0x7a6f5a, roughness: 0.6, metalness: 0.3 });
    g.add(caisse);
    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(2.1, 18, 6, 16), peau);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.y = 3;
    caisse.add(fuselage);
    const ailes = boite(4, 0.35, 30, peau, 1, 5, 0);
    caisse.add(ailes, boite(3.5, 4, 0.25, peau, -11, 7, 0), boite(2.6, 0.25, 9, peau, -12, 9, 0)); // les ailes, la dérive, le plan en T
    caisse.add(boite(0.6, 0.8, 4.3, new THREE.MeshStandardMaterial({ color: 0x1b2a33, roughness: 0.1 }), 10.2, 3.9, 0)); // le cockpit
    for (const z of [-1, 1]) caisse.add(boite(3, 0.6, 0.05, new THREE.MeshStandardMaterial({ color: E.marque }), -3, 3.5, z * 2.12)); // la bande
    const helices = [];
    for (const z of [-10.5, -5.5, 5.5, 10.5]) {
      const moteur = cyl(0.7, 0.6, 3.2, peau, 12);
      moteur.rotation.z = Math.PI / 2;
      moteur.position.set(2.8, 4.6, z);
      caisse.add(moteur);
      const h = new THREE.Group();
      h.position.set(4.5, 4.6, z);
      for (let k = 0; k < 4; k++) {
        const bras = new THREE.Group();
        bras.rotation.x = (k * Math.PI) / 2;
        bras.add(boite(0.08, 2.2, 0.3, m.noir, 0, 1.1, 0));
        h.add(bras);
      }
      caisse.add(h);
      helices.push(h);
    }
    return { g, caisse, helices };
  }

  // (étape 64) LA DCA : un socle, une tourelle qui tourne, un bouclier, un siège, et 2 longs canons qui se lèvent.
  function dca(equipe) {
    const m = mats(), p = peinture(equipe), g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    caisse.add(cyl(1.7, 1.9, 0.5, p, 18).translateY(0.25)); // le socle
    for (let k = 0; k < 4; k++) { // les 4 pieds
      const pied = boite(2.6, 0.2, 0.35, p, 1.3, 0.12, 0);
      const bras = new THREE.Group();
      bras.rotation.y = (k * Math.PI) / 2 + Math.PI / 4;
      bras.add(pied);
      caisse.add(bras);
    }
    const tourelle = new THREE.Group();
    tourelle.position.y = 0.6;
    caisse.add(tourelle);
    tourelle.add(cyl(1, 1.1, 0.7, p, 14).translateY(0.35), boite(1.2, 0.5, 0.6, m.noir, -0.6, 1.0, 0)); // le corps, le siège
    tourelle.add(boite(0.15, 1.1, 2, p, 0.5, 1.4, 0)); // le bouclier
    const canons = new THREE.Group();
    canons.position.set(0.3, 1.6, 0);
    tourelle.add(canons);
    for (const z of [-0.35, 0.35]) {
      const c = cyl(0.07, 0.09, 3.2, m.noir, 10);
      c.rotation.z = -Math.PI / 2;
      c.position.set(1.6, 0, z);
      const bout = cyl(0.12, 0.12, 0.3, m.noir, 8); // le cache-flamme
      bout.rotation.z = -Math.PI / 2;
      bout.position.set(3.2, 0, z);
      canons.add(c, boite(0.9, 0.35, 0.3, m.metal, 0.2, 0, z), bout);
    }
    const flammes = [];
    for (const z of [-0.35, 0.35]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
      f.position.set(3.4, 0, z);
      f.visible = false;
      canons.add(f);
      flammes.push(f);
    }
    return { g, caisse, tourelle, canons, flammes };
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
    return { jeep, helico, avion, drone, bateau, sousmarin, dca, transport, chasseur: avion }[sorte](equipe);
  }
  function bruler(o) {
    const m = mats();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
  }

  return { soldat, animer, fabriquer, bruler, portail };
})();
