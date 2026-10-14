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
// Étape 70 : « plus réalistes ». Le 4x4 devient un vrai véhicule blindé léger (avec l'INTÉRIEUR qu'on voit par les
// vitres : sièges, tableau de bord, volant, pilote) ; l'hélico, l'avion, le bateau, le sous-marin, l'avion de
// transport et la DCA ont leurs vraies formes et beaucoup plus de détails. Les pièces sont fabriquées avec la boîte à
// outils (outils3d.js) et SOUDÉES par matière : plus de détails, mais moins d'objets à dessiner.
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
    M.phare = new THREE.MeshStandardMaterial({ color: 0xeef2f2, metalness: 0.4, roughness: 0.1, emissive: 0xc8d0d2, emissiveIntensity: 0.4 });
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

  // ------------------------------------------------------------------ étape 72 : la SILHOUETTE (le soldat vu de loin)
  // ✍️ « Ça rame. » Un soldat en détail, c'est une vingtaine de pièces qui bougent (hanches, genoux, coudes…) : autant de
  // dessins pour la carte graphique. De loin, on ne voit pas ses genoux ! Alors, loin de la caméra, chaque soldat devient
  // une SILHOUETTE : une seule pièce, déjà dans la pose « fusil en main », avec ses couleurs écrites dans les sommets.
  // Et toutes les silhouettes d'une équipe sont des « instances » : la même forme recopiée à 100 endroits, en UN dessin.
  function silhouettes(equipe, max) {
    const E = Tanks.CONFIG.equipes[equipe], mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const tenue = E.camouflage[0], gilet = equipe === "bleus" ? 0x5f6a4a : 0x8a7a56, peau = 0xc8956c, bottes = 0x3a2c20, arme = 0x23252a;
    const g = new THREE.Group();
    const poser = (geo, x, y, z, teinte, rz) => {
      const m = O.piece(geo, mat, x, y, z, teinte);
      if (rz) m.rotation.z = rz;
      g.add(m);
    };
    for (const z of [-OS.ecartHanches, OS.ecartHanches]) {
      poser(new THREE.CapsuleGeometry(0.075, 0.72, 2, 6), 0, 0.5, z, tenue); // la jambe
      poser(new THREE.BoxGeometry(0.26, 0.12, 0.12), 0.05, 0.06, z, bottes); // la botte
    }
    poser(new THREE.BoxGeometry(0.24, 0.2, 0.32), 0, 0.96, 0, tenue); // le bassin
    poser(new THREE.BoxGeometry(0.3, 0.5, 0.4), 0.01, 1.24, 0, gilet); // le torse et son gilet
    poser(new THREE.BoxGeometry(0.2, 0.34, 0.28), -0.21, 1.24, 0, gilet); // le sac à dos
    poser(new THREE.SphereGeometry(0.11, 8, 6), 0.01, 1.62, 0, peau); // la tête
    poser(new THREE.SphereGeometry(0.14, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), -0.005, 1.66, 0, tenue); // le casque
    for (const z of [-OS.ecartEpaules, OS.ecartEpaules]) {
      poser(new THREE.CapsuleGeometry(0.055, 0.42, 2, 6), 0.22, 1.33, z * 0.8, tenue, 1.17); // le bras, tendu vers le fusil
      poser(new THREE.BoxGeometry(0.12, 0.08, 0.13), 0.03, 1.36, z * 1.1, E.marque); // le brassard de l'équipe
    }
    poser(new THREE.BoxGeometry(0.85, 0.08, 0.05), 0.42, 1.27, 0.08, arme); // le fusil
    const [piece] = O.souder(g, false);
    const tous = new THREE.InstancedMesh(piece.geometry, mat, max);
    tous.count = 0;
    tous.frustumCulled = false; // (ils sont partout sur la carte : on les envoie tous, c'est un seul dessin)
    tous.castShadow = false;
    tous.receiveShadow = true;
    return tous;
  }

    // ------------------------------------------------------------------ les engins
  // (étape 70) Les outils de l'atelier (outils3d.js) et les couleurs des petites pièces (les mêmes que pour les tanks).
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const MT = () => Tanks.Chars3D.materiaux(); // (teinte : la matière à couleurs de sommets, partagée avec les tanks)
  const peintureCamo = {};
  function peintureSoudee(equipe) { // (la peinture camouflage, posée « au pistolet » quand on soude les pièces)
    if (peintureCamo[equipe]) return peintureCamo[equipe];
    const p = new THREE.MeshStandardMaterial({ map: Tanks.Chars3D.camouflage(Tanks.CONFIG.equipes[equipe].camouflage), roughness: 0.8, metalness: 0.15 });
    p.userData.camo = true;
    return (peintureCamo[equipe] = p);
  }
  function vitreClaire() { // (une vitre qu'on voit à travers : on aperçoit l'intérieur)
    return M.vitreClaire || (M.vitreClaire = new THREE.MeshPhysicalMaterial({ color: 0x8aa4b4, roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.3, depthWrite: false }));
  }

  // Un soldat ASSIS (le pilote) : le bassin sur le siège, le buste, la tête et son casque, les bras vers le volant,
  // les cuisses vers l'avant et les jambes vers les pédales. (x, y, z) = le haut de l'assise ; v = le volant.
  function pilote(groupe, m, x, y, z, v) {
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.28, 3, 10), m.teinte, x - 0.06, y + 0.36, z, CT.tissu);
    buste.rotation.z = 0.15;
    buste.scale.set(0.8, 1, 1.1);
    groupe.add(buste);
    groupe.add(O.boite(0.28, 0.34, 0.36, m.teinte, x - 0.02, y + 0.38, z, 0x5f6a4a)); // le gilet pare-balles
    groupe.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, x - 0.04, y + 0.78, z, CT.peau));
    const casque = O.piece(new THREE.SphereGeometry(0.128, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, x - 0.05, y + 0.81, z, CT.casque);
    casque.scale.set(1.08, 0.95, 1.05);
    groupe.add(casque);
    for (const s of [-1, 1]) {
      const epaule = [x - 0.05, y + 0.55, z + s * 0.2], coude = [x + 0.2, y + 0.32, z + s * 0.22], main = v ? [v[0] - 0.02, v[1] + 0.02, v[2] + s * 0.15] : [x + 0.42, y + 0.25, z + s * 0.14];
      groupe.add(O.tube(epaule, coude, 0.045, m.teinte, 6, CT.tissu), O.tube(coude, main, 0.04, m.teinte, 6, CT.tissu));
      groupe.add(O.piece(new THREE.SphereGeometry(0.04, 6, 5), m.teinte, main[0], main[1], main[2], 0x1e1e1c)); // le gant
      groupe.add(O.tube([x - 0.05, y + 0.06, z + s * 0.1], [x + 0.4, y + 0.1, z + s * 0.11], 0.075, m.teinte, 6, CT.tissu)); // la cuisse
      groupe.add(O.tube([x + 0.4, y + 0.1, z + s * 0.11], [x + 0.55, y - 0.38, z + s * 0.11], 0.06, m.teinte, 6, CT.tissu)); // la jambe
      groupe.add(O.boite(0.26, 0.1, 0.11, m.teinte, x + 0.62, y - 0.42, z + s * 0.11, 0x3a2c20)); // la botte
    }
  }
  // Un siège : l'assise, le dossier penché, l'appui-tête.
  function siege(groupe, m, x, y, z, couleur) {
    groupe.add(O.boite(0.48, 0.1, 0.5, m.teinte, x, y - 0.05, z, couleur));
    groupe.add(O.boite(0.4, y - 0.62, 0.42, m.teinte, x, (y + 0.62) / 2 - 0.05, z, CT.noir)); // le pied
    const dossier = O.boite(0.1, 0.62, 0.5, m.teinte, x - 0.27, y + 0.3, z, couleur);
    dossier.rotation.z = 0.18;
    groupe.add(dossier);
    groupe.add(O.boite(0.08, 0.16, 0.26, m.teinte, x - 0.33, y + 0.68, z, couleur));
  }

  // Une roue de 4x4 tout-terrain (fabriquée une fois par côté, puis réutilisée) : le pneu à crampons, la jante à
  // « beadlock » (l'anneau boulonné qui tient le pneu même crevé) et le gros moyeu des réducteurs.
  const rouesJeep = {};
  function geoRoueJeep(cote, couleurJante) {
    const cle = cote + ":" + couleurJante;
    if (rouesJeep[cle]) return rouesJeep[cle];
    const m = MT(), o = cote, p = [];
    const profilPneu = [[0.28, -0.155], [0.39, -0.165], [0.44, -0.148], [0.462, -0.115], [0.465, 0], [0.462, 0.115], [0.44, 0.148], [0.39, 0.165], [0.28, 0.155]];
    p.push(O.tour(profilPneu, m.teinte, 24, CT.caoutchouc));
    for (let k = 0; k < 24; k++) { // les crampons, en chevrons
      const a = (k / 24) * Math.PI * 2;
      for (const s of [-1, 1]) {
        const c = O.boite(0.05, 0.11, 0.035, m.teinte, Math.cos(a) * 0.468, s * 0.07 + (k % 2 ? 0.02 : -0.02), Math.sin(a) * 0.468, CT.caoutchouc);
        c.rotation.y = -a;
        c.rotateX(s * 0.5);
        p.push(c);
      }
    }
    p.push(O.cylindre(0.285, 0.285, 0.29, m.teinte, 18, couleurJante)); // la jante
    const anneau = O.cylindre(0.3, 0.3, 0.03, m.teinte, 20, couleurJante);
    anneau.position.y = o * 0.15;
    p.push(anneau);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      p.push(O.boite(0.025, 0.025, 0.025, m.teinte, Math.cos(a) * 0.27, o * 0.168, Math.sin(a) * 0.27, CT.acier));
    }
    const creux = O.cylindre(o > 0 ? 0.17 : 0.24, o > 0 ? 0.24 : 0.17, 0.04, m.teinte, 16, new THREE.Color(couleurJante).multiplyScalar(0.7));
    creux.position.y = o * 0.155;
    p.push(creux);
    const moyeu = O.cylindre(o > 0 ? 0.09 : 0.13, o > 0 ? 0.13 : 0.09, 0.14, m.teinte, 12, CT.noir);
    moyeu.position.y = o * 0.2;
    p.push(moyeu);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      p.push(O.boite(0.03, 0.03, 0.03, m.teinte, Math.cos(a) * 0.105, o * 0.19, Math.sin(a) * 0.105, CT.acier));
    }
    return (rouesJeep[cle] = O.geometrieTeintee(p, m.teinte));
  }

  // (étape 70) LE 4x4 À MITRAILLEUSE, refait comme un vrai véhicule militaire léger (un « Humvee » blindé) :
  // une caisse très large et basse, un long capot plat avec sa calandre à fentes, les phares ronds, un gros pare-chocs
  // avec son treuil, 4 portières avec de petites vitres blindées, un pare-brise en deux morceaux, et sur le toit,
  // la tourelle du tireur avec son bouclier (et sa vitre) et la mitrailleuse lourde de 12,7 mm.
  // Par les vitres, on voit l'INTÉRIEUR : les 4 sièges, le tableau de bord, le volant, la radio, le pilote, et le
  // tireur debout dans la tourelle. Mesures : 4,6 m de long, 2,2 m de large, 1,9 m jusqu'au toit, roues de 93 cm.
  function jeep(equipe) {
    mats();
    const m = MT(), P = peintureSoudee(equipe), E = Tanks.CONFIG.equipes[equipe], V = vitreClaire();
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const vert = new THREE.Color(E.camouflage[0]), fonce = vert.clone().multiplyScalar(0.55);
    const xR = 1.65, zR = 0.93, rR = 0.465, Rarc = 0.6, yBas = 0.55, yCeinture = 1.24, yToit = 1.9, demi = 1.09;
    // 1. Les flancs (ils montent jusqu'à la ceinture), avec les passages de roues.
    const flanc = [[-2.3, 0.78], [-2.24, yBas]];
    for (const c of [-xR, xR]) {
      const dx = Math.sqrt(Rarc * Rarc - (yBas - rR) * (yBas - rR));
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI - (k / 10) * Math.PI, xx = c + Math.cos(a) * dx * 1.0, yy = rR + Math.sqrt(Math.max(0, Rarc * Rarc - (xx - c) * (xx - c)));
        flanc.push([xx, Math.max(yBas, yy)]);
      }
    }
    flanc.push([2.26, yBas], [2.34, 0.7], [2.34, 1.1], [0.72, yCeinture], [-2.3, yCeinture]);
    for (const s of [-1, 1]) {
      const f = O.profil(flanc, 0.1, P, 0.02);
      f.position.z = s * (demi - 0.05);
      caisse.add(f);
      // l'élargisseur d'aile (en caoutchouc noir) autour de chaque passage de roue
      for (const c of [-xR, xR]) {
        const pts = [];
        for (let k = 0; k <= 12; k++) {
          const a = Math.PI - (k / 12) * Math.PI;
          pts.push([c + Math.cos(a) * (Rarc + 0.02), rR + Math.sin(a) * (Rarc + 0.02), s * (demi + 0.01)]);
        }
        caisse.add(O.cable(pts, 0.035, m.teinte, CT.noir, 24));
      }
      // les murs intérieurs des passages de roues (pour ne pas voir dans la caisse)
      for (const c of [-xR, xR]) caisse.add(O.boite(1.25, yCeinture - yBas, 0.04, m.teinte, c, (yBas + yCeinture) / 2, s * (zR - 0.2), fonce));
      // les portières : les joints, les charnières, les poignées ; le marchepied
      for (const xp of [0.68, -0.22, -1.12]) caisse.add(O.boite(0.018, yCeinture - yBas - 0.06, 0.012, m.teinte, xp, (yBas + yCeinture) / 2, s * (demi + 0.002), CT.noir));
      for (const xp of [0.6, -0.3]) caisse.add(O.boite(0.1, 0.035, 0.03, m.teinte, xp - 0.62, 1.1, s * (demi + 0.01), CT.noir));
      for (const xp of [0.6, -0.3]) for (const yh of [0.75, 1.1]) caisse.add(O.boite(0.06, 0.08, 0.03, m.teinte, xp + 0.05, yh, s * (demi + 0.01), CT.acier));
      caisse.add(O.boite(1.6, 0.05, 0.16, m.teinte, -0.25, yBas - 0.02, s * (demi - 0.04), CT.noir));
      // les vitres des portières (petites et épaisses : du verre blindé) avec leur cadre
      for (const [xa, xb] of [[-0.12, 0.52], [-1.04, -0.32]]) {
        caisse.add(O.boite(xb - xa, 0.46, 0.02, V, (xa + xb) / 2, 1.56, s * (demi - 0.03)));
        caisse.add(O.boite(xb - xa + 0.1, 0.06, 0.08, m.teinte, (xa + xb) / 2, 1.82, s * (demi - 0.03), fonce));
        caisse.add(O.boite(xb - xa + 0.1, 0.06, 0.08, m.teinte, (xa + xb) / 2, 1.3, s * (demi - 0.03), fonce));
      }
      for (const [xp, l] of [[0.6, 0.12], [-0.22, 0.16], [-1.11, 0.14]]) caisse.add(O.boite(l, yToit - yCeinture, 0.1, P, xp, (yToit + yCeinture) / 2, s * (demi - 0.05))); // les montants
      // le rétroviseur, sur son bras
      caisse.add(O.tube([0.62, 1.42, s * demi], [0.75, 1.55, s * (demi + 0.22)], 0.018, m.teinte, 5, CT.noir));
      caisse.add(O.boite(0.06, 0.26, 0.16, m.teinte, 0.75, 1.62, s * (demi + 0.25), CT.noir));
      // les phares ronds (dans leur boîtier), les clignotants, les feux arrière
      caisse.add(O.boite(0.1, 0.3, 0.32, m.teinte, 2.3, 0.95, s * 0.76, CT.noir));
      caisse.add(O.couche(O.cylindre(0.1, 0.1, 0.04, M.phare, 14), "x", 2.36, 0.95, s * 0.76));
      caisse.add(O.boite(0.04, 0.06, 0.1, m.teinte, 2.36, 0.76, s * 0.76, CT.orange));
      caisse.add(O.boite(0.04, 0.16, 0.12, m.teinte, -2.31, 1.0, s * 0.85, CT.rouge));
      caisse.add(O.boite(0.04, 0.06, 0.12, m.teinte, -2.31, 0.86, s * 0.85, CT.orange));
    }
    // 2. Le capot (long et plat, avec sa bosse au milieu), la calandre, le pare-chocs avec le treuil.
    caisse.add(O.profil([[0.72, yCeinture], [2.34, 1.1], [2.34, 1.05], [0.72, yCeinture - 0.06]], 2 * demi, P, 0.03));
    caisse.add(O.profil([[0.85, yCeinture + 0.05], [2.15, 1.15], [2.15, 1.1], [0.85, yCeinture - 0.02]], 1.0, P, 0.04));
    caisse.add(O.boite(0.5, 0.012, 0.6, m.teinte, 1.6, 1.21, 0, CT.noir)); // la grille d'aération du capot
    caisse.add(O.boite(0.06, 0.45, 1.05, m.teinte, 2.33, 0.85, 0, CT.noir)); // la calandre…
    for (let k = 0; k < 9; k++) caisse.add(O.boite(0.04, 0.42, 0.05, P, 2.36, 0.85, -0.44 + k * 0.11)); // … et ses lames
    caisse.add(O.boite(0.22, 0.24, 2.0, m.teinte, 2.47, 0.6, 0, CT.olive)); // le pare-chocs
    caisse.add(O.couche(O.cylindre(0.1, 0.1, 0.5, m.teinte, 10, CT.noir), "z", 2.5, 0.62, 0)); // le treuil
    caisse.add(O.boite(0.08, 0.06, 0.12, m.teinte, 2.62, 0.62, 0, CT.acier));
    for (const s of [-1, 1]) caisse.add(O.cable([[2.56, 0.62, s * 0.62], [2.66, 0.66, s * 0.62], [2.56, 0.7, s * 0.62]], 0.025, m.teinte, CT.rouge, 6)); // les manilles
    caisse.add(O.boite(1.8, 0.05, 1.4, m.teinte, 1.6, 0.45, 0, CT.noir)); // le blindage sous le moteur
    caisse.add(O.boite(4.0, 0.25, 1.1, m.teinte, 0, 0.55, 0, CT.noir)); // le châssis
    // 3. L'arrière : le coffre, le hayon, les jerricans, l'antenne.
    caisse.add(O.boite(1.12, 0.06, 2 * demi - 0.1, P, -1.74, yCeinture - 0.03, 0));
    caisse.add(O.boite(0.08, yCeinture - yBas, 2 * demi - 0.1, P, -2.27, (yCeinture + yBas) / 2, 0));
    caisse.add(O.boite(0.2, 0.18, 2.0, m.teinte, -2.38, 0.6, 0, CT.olive)); // le pare-chocs arrière
    for (const z of [-0.35, 0.35]) {
      caisse.add(O.boite(0.16, 0.46, 0.32, m.teinte, -2.38, 1.0, z, CT.fut)); // un jerrican
      caisse.add(O.boite(0.17, 0.05, 0.1, m.teinte, -2.38, 1.25, z, CT.noir));
    }
    caisse.add(O.cylindre(0.05, 0.06, 0.12, m.teinte, 8, CT.noir).translateX(-2.1).translateY(1.3).translateZ(-0.9));
    caisse.add(O.cylindre(0.006, 0.014, 2.8, m.teinte, 4, CT.noir).translateX(-2.1).translateY(2.7).translateZ(-0.9));
    // 4. La cabine : le pare-brise en deux morceaux, le toit, le mur arrière.
    for (const s of [-1, 1]) {
      const vitre = O.boite(0.02, 0.56, 0.86, V, 0.67, 1.56, s * 0.48);
      vitre.rotation.z = 0.14;
      caisse.add(vitre);
    }
    for (const z of [-1.0, 0, 1.0]) { // les montants du pare-brise
      const montant = O.boite(0.08, 0.68, z ? 0.1 : 0.08, P, 0.66, 1.57, z);
      montant.rotation.z = 0.14;
      caisse.add(montant);
    }
    caisse.add(O.boite(0.12, 0.08, 2 * demi - 0.1, P, 0.6, 1.87, 0)); // le haut du cadre
    caisse.add(O.boite(0.14, 0.06, 2 * demi - 0.1, m.teinte, 0.72, yCeinture + 0.02, 0, fonce)); // le bas du cadre
    for (const s of [-1, 1]) caisse.add(O.boite(0.03, 0.03, 0.5, m.teinte, 0.74, yCeinture + 0.06, s * 0.45, CT.noir).rotateY(s * 0.3)); // les essuie-glaces
    caisse.add(O.boite(1.86, 0.07, 2 * demi - 0.04, P, -0.27, yToit, 0)); // le toit
    caisse.add(O.boite(0.06, yToit - yCeinture, 2 * demi - 0.1, P, -1.16, (yToit + yCeinture) / 2, 0)); // le mur arrière de la cabine
    // 5. L'intérieur : le plancher, le tunnel, le tableau de bord, le volant, les sièges, la radio, le pilote.
    caisse.add(O.boite(1.9, 0.04, 2 * demi - 0.12, m.teinte, -0.22, 0.64, 0, CT.noir));
    caisse.add(O.boite(0.06, yCeinture - 0.64, 2 * demi - 0.12, m.teinte, 0.72, (yCeinture + 0.64) / 2, 0, fonce)); // la cloison du moteur
    caisse.add(O.boite(1.7, 0.36, 0.5, m.teinte, -0.25, 0.82, 0, CT.olive)); // le gros tunnel (la boîte de vitesses)
    caisse.add(O.boite(0.28, 0.26, 2 * demi - 0.14, m.teinte, 0.56, 1.25, 0, CT.olive)); // le tableau de bord
    caisse.add(O.boite(0.02, 0.14, 0.5, m.teinte, 0.415, 1.28, -0.5, CT.noir)); // les compteurs
    for (const dz of [-0.14, 0, 0.14]) caisse.add(O.couche(O.cylindre(0.04, 0.04, 0.01, m.teinte, 10, 0xd8d0b0), "x", 0.405, 1.29, -0.5 + dz));
    caisse.add(O.boite(0.2, 0.3, 0.3, m.teinte, 0.1, 1.1, 0, CT.noir)); // la radio
    caisse.add(O.boite(0.01, 0.06, 0.2, m.teinte, -0.005, 1.18, 0, 0x2a7a3a));
    const volant = new THREE.Group();
    volant.add(O.piece(new THREE.TorusGeometry(0.19, 0.02, 6, 20), m.teinte, 0, 0, 0, CT.noir));
    for (const a of [0, 2.1, 4.2]) volant.add(O.boite(0.19, 0.025, 0.015, m.teinte, Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0, CT.noir).rotateZ(a));
    volant.rotation.set(0, Math.PI / 2, 0.45, "YXZ");
    volant.position.set(0.32, 1.42, -0.5);
    volant.updateMatrix();
    for (const t of [...volant.children]) (t.applyMatrix4(volant.matrix), caisse.add(t));
    caisse.add(O.tube([0.34, 1.41, -0.5], [0.5, 1.22, -0.5], 0.03, m.teinte, 6, CT.noir)); // la colonne de direction
    for (const [x, z] of [[-0.02, -0.5], [-0.02, 0.5], [-0.8, -0.5], [-0.8, 0.5]]) siege(caisse, m, x, 1.0, z, CT.toile);
    pilote(caisse, m, -0.02, 1.0, -0.5, [0.32, 1.42, -0.5]);
    // 6. La tourelle du tireur (elle tourne) : l'anneau, le bouclier blindé avec sa vitre, la mitrailleuse, le tireur.
    const tourelle = new THREE.Group();
    tourelle.position.set(-0.45, yToit + 0.035, 0);
    caisse.add(tourelle);
    tourelle.add(O.cylindre(0.6, 0.62, 0.1, m.teinte, 20, CT.noir).translateY(0.05));
    const plaque = (l, h, x, z, angle) => {
      const b = O.boite(0.05, h, l, P, x, 0.1 + h / 2, z);
      b.rotation.y = angle;
      tourelle.add(b);
    };
    plaque(0.8, 0.62, 0.62, 0, 0); // le bouclier de devant…
    for (const s of [-1, 1]) (plaque(0.55, 0.62, 0.45, s * 0.6, -s * 0.75), plaque(0.7, 0.5, 0.0, s * 0.72, Math.PI / 2)); // … ses côtés, penchés, et les flancs
    tourelle.add(O.boite(0.03, 0.22, 0.5, V, 0.64, 0.6, 0)); // la vitre blindée du bouclier
    tourelle.add(O.boite(0.06, 0.3, 0.12, m.teinte, 0.66, 0.28, 0, CT.noir)); // la fente du canon
    // la mitrailleuse lourde de 12,7 mm : le support, le boîtier, le canon avec son cache-flamme, les munitions
    tourelle.add(O.tube([0.15, 0.1, 0], [0.2, 0.32, 0], 0.035, m.teinte, 6, CT.acier));
    tourelle.add(O.boite(0.62, 0.16, 0.14, m.teinte, 0.18, 0.4, 0, CT.noir));
    tourelle.add(O.couche(O.cylindre(0.03, 0.03, 1.05, m.teinte, 8, CT.noir), "x", 1.0, 0.42, 0));
    tourelle.add(O.couche(O.cylindre(0.05, 0.05, 0.4, m.teinte, 8, CT.noir), "x", 0.65, 0.42, 0));
    tourelle.add(O.couche(O.cylindre(0.045, 0.04, 0.1, m.teinte, 8, CT.noir), "x", 1.55, 0.42, 0));
    tourelle.add(O.boite(0.26, 0.2, 0.14, m.teinte, 0.15, 0.36, -0.17, CT.olive));
    for (const s of [-1, 1]) tourelle.add(O.boite(0.04, 0.12, 0.03, m.teinte, -0.15, 0.4, s * 0.05, CT.noir)); // les poignées
    // le tireur, debout dans la tourelle (on voit ses jambes par les vitres)
    const buste = O.piece(new THREE.CapsuleGeometry(0.18, 0.3, 3, 10), m.teinte, -0.22, 0.25, 0, CT.tissu);
    buste.scale.set(0.85, 1, 1.15);
    tourelle.add(buste, O.boite(0.3, 0.36, 0.4, m.teinte, -0.22, 0.28, 0, 0x5f6a4a));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, -0.2, 0.66, 0, CT.peau));
    const casque = O.piece(new THREE.SphereGeometry(0.128, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, -0.21, 0.69, 0, CT.casque);
    casque.scale.set(1.08, 0.95, 1.05);
    tourelle.add(casque);
    for (const s of [-1, 1]) tourelle.add(O.tube([-0.2, 0.45, s * 0.2], [-0.05, 0.32, s * 0.2], 0.045, m.teinte, 6, CT.tissu), O.tube([-0.05, 0.32, s * 0.2], [-0.15, 0.4, s * 0.06], 0.04, m.teinte, 6, CT.tissu));
    for (const s of [-1, 1]) tourelle.add(O.tube([-0.22, -0.05, s * 0.1], [-0.22, -1.2, s * 0.11], 0.075, m.teinte, 6, CT.tissu)); // les jambes, dans la cabine
    // la marque de l'équipe : un panneau de couleur à l'arrière de la tourelle, et sur les portières
    const marque = new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3 });
    for (const s of [-1, 1]) {
      const b = O.boite(0.45, 0.22, 0.02, marque, 0.0, 0.42, s * 0.75);
      b.castShadow = false;
      tourelle.add(b);
      const d = O.boite(0.5, 0.22, 0.02, marque, 0.2, 0.95, s * (demi + 0.012));
      d.castShadow = false;
      caisse.add(d);
    }
    O.souder(tourelle);
    O.souder(caisse);
    // 7. Les roues (elles tournent) : tout-terrain, avec leurs crampons.
    const roues = [];
    for (const [x, z] of [[xR, zR], [xR, -zR], [-xR, zR], [-xR, -zR]]) {
      const r = new THREE.Mesh(geoRoueJeep(Math.sign(z), "#" + vert.getHexString()), m.teinte);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, rR, z);
      r.castShadow = true;
      g.add(r);
      roues.push(r);
    }
    return { g, caisse, tourelle, roues };
  }

  // Un membre d'équipage vu par la verrière : les épaules, la tête, le casque de pilote avec sa visière.
  function equipage(groupe, m, x, y, z, couleurCasque) {
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.2, 3, 8), m.teinte, x - 0.05, y - 0.3, z, CT.tissu);
    buste.scale.set(0.8, 1, 1.15);
    groupe.add(buste);
    groupe.add(O.boite(0.1, 0.55, 0.42, m.teinte, x - 0.28, y - 0.2, z, CT.noir)); // le dossier du siège
    groupe.add(O.piece(new THREE.SphereGeometry(0.13, 10, 8), m.teinte, x, y, z, couleurCasque || 0x3d4434));
    groupe.add(O.boite(0.06, 0.08, 0.2, m.teinte, x + 0.11, y - 0.02, z, 0x14181c)); // la visière
  }

  // (étape 70) L'HÉLICOPTÈRE TIGRE, refait : un fuselage fin et « taillé » (pour être difficile à toucher), deux
  // places l'une derrière l'autre sous deux verrières en marches d'escalier (le pilote devant, le tireur derrière et
  // plus haut), les deux moteurs de chaque côté du mât, le viseur en boule au-dessus du rotor, le canon de 30 mm sous
  // le nez, les petites ailes avec les paniers de roquettes et les missiles, un train à roues, et l'empennage avec ses
  // deux petites dérives. Le grand rotor (4 pales) et le petit rotor de queue (3 pales) tournent.
  function helico(equipe) {
    mats();
    const m = MT(), P = peintureSoudee(equipe), E = Tanks.CONFIG.equipes[equipe], V = vitreClaire();
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    caisse.add(O.fuseau([
      { x: -7.7, y: 2.52, w: 0.07, h: 0.09 },
      { x: -7.1, y: 2.46, w: 0.13, h: 0.16 },
      { x: -5.0, y: 2.32, w: 0.22, h: 0.26 },
      { x: -2.9, y: 2.15, w: 0.36, h: 0.42, n: 2.6 },
      { x: -2.0, y: 2.0, w: 0.58, h: 0.72, n: 3.2, b: 0.62 },
      { x: -0.7, y: 1.93, w: 0.66, h: 0.8, n: 3.4, b: 0.7 },
      { x: 0.6, y: 1.84, w: 0.64, h: 0.7, n: 3.4, b: 0.68 },
      { x: 1.6, y: 1.72, w: 0.56, h: 0.52, n: 3, b: 0.58 },
      { x: 2.4, y: 1.62, w: 0.4, h: 0.35, n: 2.6, b: 0.45 },
      { x: 2.9, y: 1.55, w: 0.14, h: 0.14 },
    ], P, 20));
    // les deux verrières, en marches (la deuxième plus haute), et l'équipage
    caisse.add(O.fuseau([{ x: 0.95, y: 2.2, w: 0.3, h: 0.28 }, { x: 1.15, y: 2.18, w: 0.48, h: 0.42 }, { x: 1.7, y: 2.1, w: 0.5, h: 0.42 }, { x: 2.15, y: 2.0, w: 0.42, h: 0.3 }, { x: 2.45, y: 1.92, w: 0.15, h: 0.1 }], V, 16));
    caisse.add(O.fuseau([{ x: -0.85, y: 2.55, w: 0.25, h: 0.22 }, { x: -0.55, y: 2.55, w: 0.48, h: 0.45 }, { x: 0.3, y: 2.48, w: 0.52, h: 0.5 }, { x: 0.85, y: 2.36, w: 0.45, h: 0.4 }, { x: 1.05, y: 2.3, w: 0.2, h: 0.18 }], V, 16));
    for (const [x, y] of [[1.5, 2.25], [0.0, 2.7]]) {
      equipage(caisse, m, x, y, 0, CT.casque);
      caisse.add(O.boite(0.2, 0.18, 0.7, m.teinte, x + 0.5, y - 0.25, 0, CT.noir)); // le tableau de bord
    }
    for (const x of [1.05, -0.85]) caisse.add(O.boite(0.06, 0.08, 1.0, m.teinte, x, x > 0 ? 2.42 : 2.78, 0, CT.noir)); // les arceaux des verrières
    // les moteurs, de chaque côté du mât, avec leurs entrées d'air et leurs tuyères tournées vers l'extérieur
    for (const s of [-1, 1]) {
      const moteur = O.fuseau([{ x: -2.4, y: 2.66, w: 0.16, h: 0.18 }, { x: -2.0, y: 2.7, w: 0.3, h: 0.3, n: 2.6 }, { x: -0.3, y: 2.72, w: 0.3, h: 0.3, n: 2.6 }, { x: 0.0, y: 2.68, w: 0.2, h: 0.2 }], P, 12);
      moteur.position.z = s * 0.45;
      caisse.add(moteur);
      caisse.add(O.couche(O.cylindre(0.17, 0.17, 0.04, m.teinte, 12, CT.noir), "x", 0.0, 2.68, s * 0.45));
      caisse.add(O.tube([-2.0, 2.72, s * 0.6], [-2.5, 2.85, s * 0.95], 0.13, m.teinte, 10, CT.noir));
    }
    caisse.add(O.boite(1.4, 0.4, 0.5, P, -1.0, 2.75, 0)); // le capot entre les moteurs
    caisse.add(O.cylindre(0.16, 0.24, 0.55, m.teinte, 10, CT.noir).translateX(-0.9).translateY(3.05)); // le mât
    caisse.add(O.cylindre(0.04, 0.04, 0.5, m.teinte, 6, CT.noir).translateX(-0.9).translateY(3.6));
    caisse.add(O.piece(new THREE.SphereGeometry(0.28, 12, 8), m.teinte, -0.9, 3.95, 0, CT.olive)); // le viseur au-dessus du rotor
    caisse.add(O.boite(0.04, 0.16, 0.3, M.verre, -0.64, 3.97, 0));
    // le canon de 30 mm, dans sa tourelle sous le nez
    caisse.add(O.piece(new THREE.SphereGeometry(0.26, 10, 8), m.teinte, 2.0, 1.12, 0, CT.olive));
    caisse.add(O.couche(O.cylindre(0.045, 0.06, 1.3, m.teinte, 8, CT.noir), "x", 2.75, 1.1, 0));
    // les petites ailes : le panier de roquettes (dedans) et les 4 missiles (dehors), et un missile air-air au bout
    for (const s of [-1, 1]) {
      const aile = O.boite(1.0, 0.1, 1.75, P, -0.55, 1.85, s * 1.35);
      aile.rotation.x = s * 0.08;
      caisse.add(aile);
      caisse.add(O.boite(0.5, 0.25, 0.08, m.teinte, -0.5, 1.68, s * 1.1, CT.noir), O.boite(0.5, 0.25, 0.08, m.teinte, -0.5, 1.66, s * 1.8, CT.noir)); // les pylônes
      caisse.add(O.couche(O.cylindre(0.22, 0.22, 1.5, m.teinte, 12, CT.olive), "x", -0.45, 1.38, s * 1.1)); // le panier de roquettes
      caisse.add(O.couche(O.cylindre(0.2, 0.2, 0.02, m.teinte, 12, CT.noir), "x", 0.31, 1.38, s * 1.1));
      for (const [dy, dz] of [[0, -0.12], [0, 0.12], [-0.24, -0.12], [-0.24, 0.12]]) {
        caisse.add(O.couche(O.cylindre(0.08, 0.08, 1.4, m.teinte, 8, 0xc9c6b8), "x", -0.45, 1.42 + dy, s * 1.8 + dz)); // les missiles
        caisse.add(O.couche(O.cylindre(0.001, 0.08, 0.18, m.teinte, 8, 0xc9c6b8), "x", 0.34, 1.42 + dy, s * 1.8 + dz).rotateZ(Math.PI));
      }
      caisse.add(O.couche(O.cylindre(0.05, 0.05, 1.2, m.teinte, 8, 0xd8d8d0), "x", -0.5, 1.98, s * 2.25)); // le missile air-air
      // le train : la roue, le pneu, les jambes
      caisse.add(O.couche(O.cylindre(0.3, 0.3, 0.18, m.teinte, 14, CT.caoutchouc), "z", 0.6, 0.3, s * 1.0));
      caisse.add(O.couche(O.cylindre(0.15, 0.15, 0.2, m.teinte, 10, CT.acier), "z", 0.6, 0.3, s * 1.0));
      caisse.add(O.tube([0.6, 0.3, s * 0.9], [0.95, 1.3, s * 0.5], 0.05, m.teinte, 6, CT.acier), O.tube([0.6, 0.3, s * 0.9], [0.1, 1.25, s * 0.5], 0.05, m.teinte, 6, CT.acier));
    }
    // la queue : la roue de queue, le plan horizontal avec ses deux petites dérives, la grande dérive
    caisse.add(O.tube([-6.1, 2.2, 0], [-6.5, 0.32, 0], 0.06, m.teinte, 6, CT.acier), O.tube([-6.8, 2.38, 0], [-6.5, 0.4, 0], 0.035, m.teinte, 6, CT.acier));
    caisse.add(O.couche(O.cylindre(0.18, 0.18, 0.12, m.teinte, 10, CT.caoutchouc), "z", -6.5, 0.2, 0));
    caisse.add(O.boite(0.75, 0.07, 2.3, P, -6.3, 2.38, 0));
    for (const s of [-1, 1]) caisse.add(O.profil([[-6.0, 2.1], [-6.7, 2.1], [-6.85, 2.75], [-6.35, 2.7]], 0.06, P, 0.01).translateZ(s * 1.15));
    caisse.add(O.profil([[-6.9, 2.4], [-7.75, 2.45], [-8.05, 3.75], [-7.6, 3.8]], 0.12, P, 0.03));
    caisse.add(O.boite(0.3, 0.3, 0.12, m.teinte, -7.45, 3.0, 0.12, CT.noir)); // la boîte du rotor de queue
    // la marque de l'équipe, sur les flancs de la queue
    const marque = new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3 });
    for (const s of [-1, 1]) {
      const b = O.boite(1.0, 0.24, 0.02, marque, -3.6, 2.25, s * 0.33);
      b.rotation.x = s * 0.1;
      caisse.add(b);
    }
    O.souder(caisse);
    // le grand rotor (4 pales effilées, et leurs attaches) et le petit rotor de queue
    const rotor = new THREE.Group();
    rotor.position.set(-0.9, 3.35, 0);
    caisse.add(rotor);
    rotor.add(O.cylindre(0.38, 0.32, 0.22, m.teinte, 14, CT.noir));
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, c = Math.cos(a), s = -Math.sin(a);
      const pale = O.profil([[0, -0.2], [6.3, -0.2], [6.55, -0.08], [6.55, 0.12], [0, 0.22]], 0.05, m.teinte, 0.01, 0x2a2d30);
      pale.rotation.set(-Math.PI / 2, a, 0, "YXZ");
      pale.position.set(c * 0.35, 0.02, s * 0.35);
      rotor.add(pale);
      rotor.add(O.boite(0.5, 0.12, 0.18, m.teinte, c * 0.45, 0, s * 0.45, CT.acier).rotateY(a));
      rotor.add(O.boite(0.25, 0.051, 0.36, m.teinte, c * 6.4, 0.025, s * 6.4, 0xd8b020).rotateY(a)); // le bout peint en jaune
    }
    O.souder(rotor);
    const rotorQueue = new THREE.Group();
    rotorQueue.position.set(-7.45, 3.0, 0.3);
    caisse.add(rotorQueue);
    rotorQueue.add(O.couche(O.cylindre(0.1, 0.1, 0.12, m.teinte, 8, CT.noir), "z", 0, 0, 0));
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI * 2) / 3;
      const pale = O.boite(0.14, 1.25, 0.03, m.teinte, -Math.sin(a) * 0.68, Math.cos(a) * 0.68, 0, 0x2a2d30);
      pale.rotation.z = a;
      rotorQueue.add(pale);
    }
    O.souder(rotorQueue);
    return { g, caisse, rotor, rotorQueue };
  }

  // (étape 70) L'AVION DE CHASSE RAFALE, refait : un fuselage fin qui s'élargit vers les entrées d'air (sous les
  // ailes), un long nez pointu (le radar), la verrière en bulle avec le pilote, la perche de ravitaillement, l'aile en
  // triangle (« delta ») avec ses gouvernes, les canards, la dérive, DEUX moteurs (deux tuyères, deux flammes), des
  // missiles sous les ailes et au bout des ailes, et le train d'atterrissage (rentré en vol).
  function avion(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), V = vitreClaire();
    // (étape 64 : le chasseur ENNEMI est le même avion, mais gris-vert foncé, avec des cocardes rouges)
    const gris = new THREE.MeshStandardMaterial({ color: equipe === "rouges" ? 0x5c6352 : 0x8c949c, roughness: 0.45, metalness: 0.5 });
    const grisFonce = equipe === "rouges" ? 0x474d40 : 0x6d747b;
    g.add(caisse);
    caisse.add(O.fuseau([
      { x: -6.9, y: 2.0, w: 0.98, h: 0.5, n: 2.6 },
      { x: -5.6, y: 2.02, w: 1.05, h: 0.6, n: 3 },
      { x: -2.5, y: 2.06, w: 1.12, h: 0.66, n: 3.2 },
      { x: 0.5, y: 2.1, w: 1.0, h: 0.72, n: 3, b: 0.68 },
      { x: 2.6, y: 2.16, w: 0.62, h: 0.62, n: 2.6, b: 0.5 },
      { x: 4.4, y: 2.18, w: 0.5, h: 0.52, n: 2.3, b: 0.42 },
      { x: 6.0, y: 2.1, w: 0.36, h: 0.36 },
      { x: 7.3, y: 2.04, w: 0.16, h: 0.16 },
      { x: 7.9, y: 2.02, w: 0.02, h: 0.02 },
    ], gris, 20));
    // la verrière et le pilote, la perche de ravitaillement
    caisse.add(O.fuseau([{ x: 1.9, y: 2.66, w: 0.12, h: 0.06 }, { x: 2.5, y: 2.7, w: 0.38, h: 0.3 }, { x: 3.6, y: 2.74, w: 0.44, h: 0.42 }, { x: 4.7, y: 2.66, w: 0.38, h: 0.3 }, { x: 5.4, y: 2.56, w: 0.12, h: 0.06 }], V, 16));
    equipage(caisse, m, 3.75, 2.9, 0, 0x5a6066);
    caisse.add(O.boite(0.3, 0.2, 0.55, m.teinte, 4.35, 2.66, 0, CT.noir));
    caisse.add(O.boite(0.08, 0.1, 0.84, m.teinte, 3.1, 3.05, 0, CT.noir)); // l'arceau de la verrière
    caisse.add(O.tube([4.4, 2.55, 0.42], [6.6, 2.6, 0.38], 0.04, m.teinte, 6, grisFonce));
    // les entrées d'air (sous les ailes, de chaque côté), avec leur bouche sombre
    for (const s of [-1, 1]) {
      const entree = O.lisse(O.contourComplet([[2.4, 0], [2.4, 0.3], [-1.2, 0.32], [-1.2, 0]]), O.contourComplet([[2.0, 0], [2.0, 0.24], [-1.2, 0.26], [-1.2, 0]]), 1.45, 2.05, gris);
      entree.position.z = s * 0.95;
      caisse.add(entree);
      caisse.add(O.boite(0.04, 0.42, 0.42, m.teinte, 2.42, 1.7, s * 0.95, 0x0a0a0a));
    }
    // l'aile delta (un triangle épais), ses gouvernes et ses cocardes
    const forme = new THREE.Shape([new THREE.Vector2(1.5, 0), new THREE.Vector2(-4.8, 5.5), new THREE.Vector2(-5.6, 5.4), new THREE.Vector2(-5.2, 0), new THREE.Vector2(-5.6, -5.4), new THREE.Vector2(-4.8, -5.5)]);
    const aile = O.piece(new THREE.ExtrudeGeometry(forme, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1 }), gris, 0, 1.92, 0);
    aile.rotation.x = Math.PI / 2;
    caisse.add(aile);
    for (const s of [-1, 1]) for (const [za, zb] of [[1.3, 3.0], [3.1, 5.2]]) caisse.add(O.boite(0.55, 0.03, zb - za, m.teinte, -5.25, 1.88, (s * (za + zb)) / 2, grisFonce)); // les gouvernes
    const canard = new THREE.Shape([new THREE.Vector2(0.5, 0), new THREE.Vector2(-0.8, 1.8), new THREE.Vector2(-1.2, 1.7), new THREE.Vector2(-1, 0), new THREE.Vector2(-1.2, -1.7), new THREE.Vector2(-0.8, -1.8)]);
    const canards = O.piece(new THREE.ExtrudeGeometry(canard, { depth: 0.07, bevelEnabled: false }), gris, 2.2, 2.42, 0);
    canards.rotation.x = Math.PI / 2;
    caisse.add(canards);
    caisse.add(O.profil([[-2.6, 0], [-5.6, 3.2], [-6.35, 3.2], [-6.15, 0]], 0.14, gris, 0.03).translateY(2.45));
    caisse.add(O.boite(0.7, 0.9, 0.16, m.teinte, -6.0, 3.6, 0, grisFonce)); // la gouverne de direction
    caisse.add(O.boite(0.7, 0.18, 0.18, m.teinte, -6.0, 5.6, 0, 0x2a2d30)); // les antennes en haut de la dérive
    // les deux tuyères
    for (const s of [-1, 1]) {
      caisse.add(O.couche(O.cylindre(0.4, 0.44, 0.9, m.teinte, 14, 0x3a3836), "x", -7.15, 2.0, s * 0.48));
      caisse.add(O.couche(O.cylindre(0.33, 0.33, 0.04, m.teinte, 14, 0x0a0a0a), "x", -7.61, 2.0, s * 0.48));
    }
    // les missiles : 4 sous les ailes, 2 au bout des ailes
    const blanc = 0xe8e8e8;
    for (const [x, y, z] of [[-2.5, 1.55, -3.4], [-2.5, 1.55, -2.2], [-2.5, 1.55, 2.2], [-2.5, 1.55, 3.4], [-4.4, 1.92, -5.6], [-4.4, 1.92, 5.6]]) {
      caisse.add(O.couche(O.cylindre(0.1, 0.1, 2.4, m.teinte, 8, blanc), "x", x, y, z));
      caisse.add(O.couche(O.cylindre(0.001, 0.1, 0.35, m.teinte, 8, blanc), "x", x + 1.37, y, z).rotateZ(Math.PI));
      for (const a of [0, Math.PI / 2]) caisse.add(O.boite(0.35, 0.36, 0.02, m.teinte, x - 1.0, y, z, blanc).rotateX(a + Math.PI / 4));
      if (Math.abs(z) < 5) caisse.add(O.boite(1.2, 0.2, 0.08, m.teinte, x, y + 0.2, z, grisFonce)); // le pylône
    }
    // les cocardes bleu-blanc-rouge sur les ailes
    const couleurs = equipe === "rouges" ? [[0.7, 0xd21f1f], [0.47, 0xffffff], [0.24, 0xd21f1f]] : [[0.7, 0x1d3f9a], [0.47, 0xffffff], [0.24, 0xd21f1f]];
    for (const z of [-3.8, 3.8]) {
      for (const [r, c] of couleurs) {
        const rond = O.piece(new THREE.CircleGeometry(r, 20), m.teinte, -3.2, 2.035 + (0.7 - r) * 0.01, z, c);
        rond.rotation.x = -Math.PI / 2;
        rond.castShadow = false;
        caisse.add(rond);
      }
    }
    O.souder(caisse);
    // les deux flammes (une seule forme : on l'allonge et on la raccourcit très vite)
    const geoFlamme = new THREE.ConeGeometry(0.34, 2.4, 10);
    const deux = [geoFlamme.clone().translate(0, 0, -0.48), geoFlamme.clone().translate(0, 0, 0.48)].map((x) => x.toNonIndexed());
    const geoF = new THREE.BufferGeometry();
    for (const nom of ["position", "normal", "uv"]) {
      const t = nom === "uv" ? 2 : 3, tab = new Float32Array(deux.reduce((a, x) => a + x.attributes[nom].array.length, 0));
      tab.set(deux[0].attributes[nom].array, 0);
      tab.set(deux[1].attributes[nom].array, deux[0].attributes[nom].array.length);
      geoF.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    const flamme = new THREE.Mesh(geoF, new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.8 }));
    flamme.rotation.z = Math.PI / 2;
    flamme.position.set(-8.8, 2.0, 0);
    caisse.add(flamme);
    // le train d'atterrissage (rentré en vol) : les jambes, les roues, les trappes
    const train = new THREE.Group();
    caisse.add(train);
    for (const [x, z, r] of [[4.6, 0, 0.24], [-1.5, 1.4, 0.32], [-1.5, -1.4, 0.32]]) {
      train.add(O.couche(O.cylindre(r, r, 0.2, m.teinte, 12, CT.caoutchouc), "z", x, r, z));
      train.add(O.couche(O.cylindre(r * 0.5, r * 0.5, 0.21, m.teinte, 8, 0x9a9da0), "z", x, r, z));
      train.add(O.tube([x, r, z], [x + 0.25, 1.75, z * 0.8], 0.06, m.teinte, 6, 0xb8bcc0));
      train.add(O.tube([x - 0.05, r + 0.1, z], [x - 0.6, 1.7, z * 0.75], 0.035, m.teinte, 6, 0x9a9da0));
      train.add(O.boite(1.0, 0.03, 0.4, m.teinte, x + 0.2, 1.55, z * 0.8 + (z ? Math.sign(z) * 0.25 : 0.25), grisFonce).rotateX(z ? Math.sign(z) * 1.2 : 1.3)); // la trappe ouverte
    }
    O.souder(train);
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

  // (étape 70) LE BATEAU DE GUERRE (une vedette de combat), refait : une coque dont les flancs s'évasent vers le haut
  // (l'étrave, à l'avant, est penchée vers l'avant pour fendre les vagues), une bande noire à la ligne de flottaison,
  // un pont antidérapant, la passerelle avec un bandeau de vitres tout autour (on voit le barreur dedans), le mât
  // avec son radar qui tourne, ses antennes et ses feux, le canon dans sa tourelle « furtive » à l'avant, une
  // mitrailleuse de chaque côté, les radeaux de survie, le canot pneumatique à l'arrière, l'ancre et les bittes
  // d'amarrage. Construit « nez vers x+ », la ligne de flottaison en y = 0.
  function bateau(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe], V = vitreClaire();
    const coqueCouleur = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x5d6870 : 0x7a7466, roughness: 0.55, metalness: 0.35 });
    const clair = equipe === "bleus" ? 0x6b7680 : 0x8a8476, pontCouleur = 0x3e4245;
    g.add(caisse);
    // la coque : le contour du pont (en haut, large) et celui du fond (en bas, plus petit et plus court devant)
    const haut = [[5.0, 0], [4.3, 0.62], [2.6, 1.42], [0.6, 1.7], [-5.0, 1.7], [-5.0, 0]];
    const bas = [[3.3, 0], [2.8, 0.4], [1.6, 0.95], [0.2, 1.2], [-4.92, 1.22], [-4.92, 0]];
    const entre = (t) => haut.map((p, i) => [bas[i][0] + (p[0] - bas[i][0]) * t, bas[i][1] + (p[1] - bas[i][1]) * t]);
    const y0 = -0.6, y1 = 1.0, tF = (0 - y0) / (y1 - y0); // (t à la ligne de flottaison)
    caisse.add(O.lisse(O.contourComplet(bas), O.contourComplet(entre(tF)), y0, 0, coqueCouleur));
    caisse.add(O.lisse(O.contourComplet(entre(tF)), O.contourComplet(haut), 0, y1, coqueCouleur));
    const plus = (c, d) => c.map(([x, z]) => [x + (x > 0 ? d : -d * 0.2), z + (z > 0 ? d : 0)]);
    caisse.add(O.lisse(O.contourComplet(plus(entre(tF - 0.02), 0.025)), O.contourComplet(plus(entre(tF + 0.1), 0.025)), -0.03, 0.16, m.teinte, 0x16181a)); // la bande de flottaison
    caisse.add(O.lisse(O.contourComplet(plus(entre(0.66), 0.02)), O.contourComplet(plus(entre(0.76), 0.02)), 0.45, 0.6, m.teinte, new THREE.Color(E.marque).getHex())); // la bande de l'équipe
    const pont = haut.map(([x, z]) => [x - (x > 0 ? 0.12 : -0.06), Math.max(0, z - 0.1)]);
    caisse.add(O.lisse(O.contourComplet(pont), O.contourComplet(pont), y1, y1 + 0.03, m.teinte, pontCouleur)); // le pont antidérapant
    // le pavois (le petit mur tout autour de l'avant) et le garde-corps, avec ses montants
    for (const s of [-1, 1]) {
      caisse.add(O.cable([[4.9, y1 + 0.3, 0], [4.25, y1 + 0.3, s * 0.6], [2.6, y1 + 0.28, s * 1.38], [0.6, y1 + 0.25, s * 1.64], [-4.9, y1 + 0.25, s * 1.64]], 0.03, m.teinte, 0xa0a6aa, 40));
      caisse.add(O.cable([[4.9, y1 + 0.75, 0], [4.25, y1 + 0.75, s * 0.6], [2.6, y1 + 0.72, s * 1.38], [0.6, y1 + 0.7, s * 1.64], [-4.9, y1 + 0.7, s * 1.64]], 0.025, m.teinte, 0xa0a6aa, 40));
      for (let k = 0; k < 9; k++) {
        const x = -4.8 + k * 1.15, z = x > 0.6 ? 1.64 - (x - 0.6) * 0.12 : 1.64;
        caisse.add(O.tube([x, y1, s * z], [x, y1 + 0.75, s * z], 0.022, m.teinte, 5, 0xa0a6aa));
      }
      for (const x of [3.6, -4.3]) { // les bittes d'amarrage
        caisse.add(O.cylindre(0.09, 0.09, 0.3, m.teinte, 8, CT.noir).translateX(x).translateY(y1 + 0.15).translateZ(s * 1.1));
        caisse.add(O.cylindre(0.09, 0.09, 0.3, m.teinte, 8, CT.noir).translateX(x + 0.3).translateY(y1 + 0.15).translateZ(s * 1.1));
      }
      // l'ancre, dans son écubier, et le numéro de coque
      caisse.add(O.boite(0.35, 0.4, 0.06, m.teinte, 3.7, 0.75, s * 0.8, CT.noir).rotateY(-s * 0.45));
      const numero = O.boite(0.9, 0.3, 0.02, m.teinte, 1.6, 0.68, s * 1.46, 0xe8e8e8);
      numero.rotation.set(s * 0.36, -s * 0.12, 0, "YXZ");
      caisse.add(numero);
    }
    // la passerelle : le bas plein, le bandeau de vitres tout autour (penché), le toit ; le barreur et sa console
    const pB = [[0.55, 0], [0.45, 1.05], [-2.6, 1.1], [-2.7, 0]], pV = [[0.25, 0], [0.18, 0.98], [-2.55, 1.03], [-2.62, 0]], pT = [[0.1, 0], [0.05, 0.95], [-2.5, 1.0], [-2.58, 0]];
    caisse.add(O.lisse(O.contourComplet(pB), O.contourComplet(pB.map(([x, z]) => [x - 0.2, z && z - 0.04])), y1, 2.1, coqueCouleur));
    caisse.add(O.lisse(O.contourComplet(pB.map(([x, z]) => [x - 0.2, z && z - 0.04])), O.contourComplet(pV), 2.1, 2.65, V));
    caisse.add(O.lisse(O.contourComplet(pV.map(([x, z]) => [x + 0.08, z && z + 0.06])), O.contourComplet(pT), 2.65, 2.8, coqueCouleur));
    for (const z of [-0.6, 0, 0.6]) caisse.add(O.tube([0.28, 2.1, z], [0.2, 2.65, z * 0.95], 0.035, m.teinte, 5, clair)); // les montants des vitres
    caisse.add(O.boite(0.5, 0.35, 1.8, m.teinte, -0.2, 2.25, 0, CT.noir)); // la console
    equipage(caisse, m, -0.85, 2.45, -0.35, 0x2c3a5a);
    equipage(caisse, m, -0.85, 2.45, 0.45, 0x2c3a5a);
    // le mât : le pied, la vergue, les antennes, les feux ; le radar (il tourne) au sommet
    caisse.add(O.lisse(O.contourComplet([[-0.8, 0], [-0.8, 0.35], [-2.2, 0.4], [-2.2, 0]]), O.contourComplet([[-1.3, 0], [-1.3, 0.2], [-2.0, 0.22], [-2.0, 0]]), 2.8, 4.3, coqueCouleur));
    caisse.add(O.boite(0.1, 0.1, 2.2, m.teinte, -1.6, 4.0, 0, clair)); // la vergue
    for (const s of [-1, 1]) {
      caisse.add(O.cylindre(0.02, 0.03, 1.6, m.teinte, 5, CT.noir).translateX(-1.6).translateY(4.8).translateZ(s * 1.0));
      caisse.add(O.boite(0.1, 0.1, 0.08, m.teinte, -1.6, 4.1, s * 1.08, s > 0 ? 0x1aa040 : 0xc02020)); // les feux de position (vert à tribord, rouge à bâbord)
    }
    caisse.add(O.cylindre(0.05, 0.06, 0.6, m.teinte, 6, clair).translateX(-1.6).translateY(4.6));
    caisse.add(O.piece(new THREE.SphereGeometry(0.22, 10, 8), m.teinte, -2.0, 4.5, 0, 0xe8e8e8)); // le dôme du satellite
    caisse.add(O.boite(0.4, 0.04, 0.3, m.teinte, -1.95, 4.32, 0, clair));
    // le canon dans sa tourelle furtive à l'avant (elle tourne), deux mitrailleuses sur les côtés
    const tourelle = new THREE.Group();
    tourelle.position.set(2.4, y1 + 0.03, 0);
    caisse.add(tourelle);
    tourelle.add(O.cylindre(0.75, 0.85, 0.35, coqueCouleur, 16).translateY(0.17));
    tourelle.add(O.lisse(O.contourComplet([[0.8, 0], [0.55, 0.6], [-0.75, 0.62], [-0.8, 0]]), O.contourComplet([[0.35, 0], [0.2, 0.42], [-0.7, 0.44], [-0.75, 0]]), 0.35, 1.05, coqueCouleur));
    tourelle.add(O.couche(O.cylindre(0.2, 0.2, 0.3, coqueCouleur, 12), "x", 0.75, 0.72, 0));
    tourelle.add(O.couche(O.cylindre(0.08, 0.11, 2.3, m.teinte, 10, CT.noir), "x", 2.0, 0.72, 0));
    tourelle.add(O.couche(O.cylindre(0.11, 0.11, 0.25, m.teinte, 10, CT.noir), "x", 3.15, 0.72, 0)); // le frein de bouche
    tourelle.add(O.boite(0.25, 0.2, 0.2, m.teinte, -0.1, 1.15, 0.25, CT.noir), O.boite(0.03, 0.12, 0.14, M.verre, 0.03, 1.16, 0.25)); // le viseur
    O.souder(tourelle);
    for (const s of [-1, 1]) {
      caisse.add(O.cylindre(0.05, 0.08, 0.8, m.teinte, 6, CT.noir).translateX(-3.2).translateY(y1 + 0.4).translateZ(s * 1.35));
      caisse.add(O.boite(0.5, 0.12, 0.1, m.teinte, -3.1, y1 + 0.85, s * 1.35, CT.noir));
      caisse.add(O.couche(O.cylindre(0.025, 0.025, 0.9, m.teinte, 6, CT.noir), "x", -2.5, y1 + 0.87, s * 1.35));
      caisse.add(O.boite(0.06, 0.4, 0.5, m.teinte, -2.85, y1 + 0.95, s * 1.35, clair)); // le bouclier
      // les radeaux de survie (des tonneaux blancs), sur le toit de la passerelle
      caisse.add(O.couche(O.cylindre(0.25, 0.25, 0.8, m.teinte, 10, 0xeeeeee), "x", -1.6, 2.15, s * 1.25));
    }
    // l'arrière : le moteur, les échappements, le canot pneumatique sur son support
    caisse.add(O.boite(1.4, 0.5, 2.0, m.teinte, -4.0, y1 + 0.25, 0, 0x4a4d50));
    for (const s of [-1, 1]) caisse.add(O.cylindre(0.12, 0.12, 0.6, m.teinte, 8, CT.noir).translateX(-4.3).translateY(y1 + 0.75).translateZ(s * 0.55));
    for (const s of [-1, 1]) caisse.add(O.couche(O.piece(new THREE.CapsuleGeometry(0.2, 2.0, 3, 8), m.teinte, 0, 0, 0, 0x2b2b2b), "x", -3.9, y1 + 0.75, s * 0.48));
    caisse.add(O.boite(2.2, 0.08, 0.8, m.teinte, -3.9, y1 + 0.6, 0, 0x3a3a3a));
    caisse.add(O.boite(0.3, 0.3, 0.3, m.teinte, -4.85, y1 + 0.75, 0, CT.noir)); // son moteur
    // le pavillon, à l'arrière
    caisse.add(O.cylindre(0.025, 0.025, 1.4, m.teinte, 5, clair).translateX(-4.9).translateY(y1 + 0.7));
    const pav = O.boite(0.55, 0.36, 0.01, new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3, side: THREE.DoubleSide }), -5.2, y1 + 1.2, 0);
    pav.userData.garder = true;
    caisse.add(pav);
    O.souder(caisse);
    const radar = new THREE.Group();
    radar.position.set(-1.6, 4.95, 0);
    caisse.add(radar);
    radar.add(O.cylindre(0.12, 0.15, 0.25, m.teinte, 10, clair));
    radar.add(O.boite(0.18, 0.2, 1.5, m.teinte, 0.05, 0.2, 0, 0xd8dadc));
    O.souder(radar);
    return { g, caisse, tourelle, radar };
  }

  // (étape 63, refait à l'étape 70) Le SOUS-MARIN : une coque en forme de goutte d'eau (le nez rond, le long corps, la
  // queue qui s'effile), le pont plat avec ses trous (pour que l'eau s'écoule), le kiosque profilé avec ses vitres et
  // ses barres de plongée, les mâts (deux périscopes, le tuba, l'antenne radar), les gouvernails en X à l'arrière et
  // l'hélice à 7 pales recourbées. Construit « nez vers x+ », avec le bas de la coque en y = 0.
  function sousmarin(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const coque = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x2b3136 : 0x3a3530, roughness: 0.5, metalness: 0.45 });
    const fonce = equipe === "bleus" ? 0x1d2226 : 0x2a2622;
    g.add(caisse);
    caisse.add(O.fuseau([
      { x: -7.3, y: 1.3, w: 0.12, h: 0.12 }, { x: -6.4, y: 1.3, w: 0.55, h: 0.55 }, { x: -5.0, y: 1.3, w: 1.05, h: 1.05 },
      { x: -3.4, y: 1.3, w: 1.25, h: 1.25 }, { x: 4.6, y: 1.3, w: 1.25, h: 1.25 }, { x: 5.9, y: 1.3, w: 1.12, h: 1.12 },
      { x: 6.7, y: 1.3, w: 0.8, h: 0.8 }, { x: 7.1, y: 1.3, w: 0.38, h: 0.38 }, { x: 7.22, y: 1.3, w: 0.05, h: 0.05 },
    ], coque, 22));
    // le pont, et ses trous d'écoulement ; l'écoutille ; les taquets
    caisse.add(O.boite(8.6, 0.12, 1.1, coque, 0.6, 2.52, 0));
    for (const s of [-1, 1]) for (let k = 0; k < 14; k++) caisse.add(O.boite(0.22, 0.06, 0.02, m.teinte, -3.4 + k * 0.6, 2.36, s * 0.92, 0x050607));
    caisse.add(O.cylindre(0.3, 0.32, 0.08, m.teinte, 14, fonce).translateX(-2.2).translateY(2.6));
    for (const x of [4.0, -3.4]) caisse.add(O.boite(0.3, 0.1, 0.08, m.teinte, x, 2.62, 0, fonce));
    // le kiosque, profilé comme une aile vue de dessus, avec la passerelle et ses vitres
    const kB = [[2.5, 0], [2.15, 0.36], [1.1, 0.42], [0.1, 0.3], [-0.25, 0]], kH = [[2.35, 0], [2.05, 0.32], [1.1, 0.38], [0.15, 0.27], [-0.15, 0]];
    caisse.add(O.lisse(O.contourComplet(kB), O.contourComplet(kH), 2.4, 4.0, coque));
    for (const s of [-1, 1]) {
      caisse.add(O.boite(0.5, 0.12, 0.02, M.verre, 1.85, 3.85, s * 0.35).rotateY(s * 0.35));
      caisse.add(O.boite(1.2, 0.25, 0.02, new THREE.MeshStandardMaterial({ color: E.marque, roughness: 0.6 }), 1.1, 3.3, s * 0.41)); // la bande de l'équipe
      const barre = O.profil([[0, -0.04], [0.55, -0.05], [0.75, 0], [0.55, 0.05], [0, 0.04]], 0.9, coque, 0.02); // les barres de plongée
      barre.position.set(1.25, 3.35, s * 0.85);
      caisse.add(barre);
    }
    // les mâts : deux périscopes, le tuba, l'antenne radar
    for (const [x, z, h, r, tete] of [[1.75, 0.08, 1.6, 0.06, 0.13], [1.35, -0.08, 1.3, 0.07, 0.11], [0.9, 0.1, 1.0, 0.09, 0.14], [0.45, -0.05, 1.2, 0.05, 0.2]]) {
      caisse.add(O.cylindre(r, r, h, m.teinte, 8, 0x5b6066).translateX(x).translateY(4.0 + h / 2).translateZ(z));
      caisse.add(O.boite(tete, 0.16, 0.12, m.teinte, x + 0.02, 4.0 + h + 0.08, z, 0x5b6066));
    }
    caisse.add(O.boite(0.06, 0.08, 0.1, M.verre, 1.81, 5.68, 0.08));
    // les gouvernails en X, à l'arrière
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const ail = O.profil([[-5.4, 0], [-6.9, 1.6], [-7.3, 1.55], [-7.0, 0]], 0.1, coque, 0.02);
      ail.rotation.x = a;
      ail.position.y = 1.3;
      caisse.add(ail);
    }
    O.souder(caisse);
    // l'hélice : 7 pales recourbées et le cône du moyeu
    const helice = new THREE.Group();
    helice.position.set(-7.35, 1.3, 0);
    helice.add(O.couche(O.cylindre(0.05, 0.22, 0.45, m.teinte, 12, 0x8a6a3a), "x", 0, 0, 0).rotateZ(Math.PI));
    for (let k = 0; k < 7; k++) {
      const a = (k * Math.PI * 2) / 7;
      const pale = O.profil([[0.12, -0.12], [0.75, -0.02], [0.8, 0.12], [0.5, 0.2], [0.12, 0.12]], 0.035, m.teinte, 0.01, 0x8a6a3a);
      pale.rotation.set(a, 0, 0, "XYZ");
      pale.rotateY(Math.PI / 2);
      pale.rotateX(0.5);
      helice.add(pale);
    }
    O.souder(helice);
    caisse.add(helice);
    return { g, caisse, helice };
  }

  // (étape 64, refait à l'étape 70) L'AVION DE TRANSPORT (comme un A400M) : un gros fuselage rond dont l'arrière
  // remonte (la porte-rampe d'où sautent les parachutistes), le nez avec les vitres du poste de pilotage, l'aile en
  // haut (elle penche un peu vers le bas), 4 moteurs avec leurs hélices à 8 pales recourbées, la queue en T, les
  // carénages du train sur les côtés.
  function transport(equipe) {
    mats();
    const m = MT(), g = new THREE.Group(), caisse = new THREE.Group(), E = Tanks.CONFIG.equipes[equipe];
    const peau = new THREE.MeshStandardMaterial({ color: equipe === "bleus" ? 0x6b7461 : 0x7a6f5a, roughness: 0.6, metalness: 0.3 });
    const fonce = equipe === "bleus" ? 0x535a4b : 0x5e5646;
    g.add(caisse);
    caisse.add(O.fuseau([
      { x: -12.5, y: 5.0, w: 0.35, h: 0.3 }, { x: -11, y: 4.4, w: 0.9, h: 0.8, b: 0.6 }, { x: -8.5, y: 3.7, w: 1.6, h: 1.6, b: 1.1 },
      { x: -6, y: 3.15, w: 2.05, h: 2.0, b: 1.7 }, { x: -3, y: 3.0, w: 2.1, h: 2.1 }, { x: 6.5, y: 3.0, w: 2.1, h: 2.1 },
      { x: 8.8, y: 3.05, w: 1.95, h: 1.9, b: 2.05 }, { x: 10.5, y: 3.0, w: 1.55, h: 1.45, b: 1.95 }, { x: 11.6, y: 2.7, w: 0.9, h: 0.8, b: 1.4 },
      { x: 12.1, y: 2.5, w: 0.25, h: 0.25, b: 0.4 },
    ], peau, 24));
    // les vitres du poste de pilotage
    for (const s of [-1, 1]) {
      const v = O.boite(0.05, 0.42, 0.85, M.verre, 10.62, 4.12, s * 0.55);
      v.rotation.set(0, s * 0.45, 0.75, "YXZ");
      caisse.add(v);
      caisse.add(O.boite(0.7, 0.36, 0.05, M.verre, 9.9, 4.05, s * 1.58).rotateX(s * 0.35));
    }
    // les carénages du train, la porte-rampe, la porte latérale des parachutistes, la bande de l'équipe
    for (const s of [-1, 1]) {
      const car = O.fuseau([{ x: -3.5, y: 1.25, w: 0.3, h: 0.3 }, { x: -2.5, y: 1.2, w: 0.6, h: 0.62 }, { x: 3.0, y: 1.2, w: 0.6, h: 0.62 }, { x: 4.0, y: 1.3, w: 0.25, h: 0.3 }], peau, 12);
      car.position.z = s * 1.75;
      caisse.add(car);
      for (const x of [-1.5, 0.4, 2.2]) caisse.add(O.couche(O.cylindre(0.55, 0.55, 0.35, m.teinte, 14, CT.caoutchouc), "z", x, 0.55, s * 1.8));
      caisse.add(O.boite(1.2, 2.0, 0.03, m.teinte, -6.4, 3.0, s * 2.03, fonce).rotateY(s * 0.12));
      caisse.add(O.boite(3.0, 0.6, 0.05, new THREE.MeshStandardMaterial({ color: E.marque }), -2.5, 3.5, s * 2.1));
    }
    caisse.add(O.couche(O.cylindre(0.4, 0.4, 0.3, m.teinte, 12, CT.caoutchouc), "z", 9.4, 0.4, 0));
    caisse.add(O.tube([9.4, 0.4, 0], [9.2, 1.4, 0], 0.08, m.teinte, 6, 0x9a9da0));
    // l'aile (en haut, un peu penchée vers le bas), avec ses gouvernes
    for (const s of [-1, 1]) {
      const forme = new THREE.Shape([new THREE.Vector2(3.0, 0), new THREE.Vector2(1.6, 15), new THREE.Vector2(0.2, 15.2), new THREE.Vector2(-1.4, 0)]);
      const aile = O.piece(new THREE.ExtrudeGeometry(forme, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 1 }), peau);
      aile.rotation.x = s > 0 ? Math.PI / 2 - 0.05 : Math.PI / 2 + 0.05;
      if (s < 0) aile.scale.y = -1;
      aile.position.set(0, 5.15, 0);
      caisse.add(aile);
    }
    caisse.add(O.fuseau([{ x: -4, y: 5.2, w: 0.4, h: 0.2 }, { x: -1.5, y: 5.35, w: 1.4, h: 0.6 }, { x: 3, y: 5.3, w: 1.4, h: 0.6 }, { x: 4.5, y: 5.2, w: 0.6, h: 0.3 }], peau, 12)); // le carénage de l'aile sur le dos
    // la queue en T : la grande dérive et le plan horizontal tout en haut
    caisse.add(O.profil([[-8.5, 4.5], [-12.4, 5.0], [-13.6, 10.6], [-11.4, 10.6]], 0.35, peau, 0.08));
    const plan = new THREE.Shape([new THREE.Vector2(-11.2, 0), new THREE.Vector2(-12.4, 6.2), new THREE.Vector2(-13.4, 6.2), new THREE.Vector2(-13.8, 0), new THREE.Vector2(-13.4, -6.2), new THREE.Vector2(-12.4, -6.2)]);
    const planG = O.piece(new THREE.ExtrudeGeometry(plan, { depth: 0.25, bevelEnabled: false }), peau, 0, 10.5, 0);
    planG.rotation.x = Math.PI / 2;
    caisse.add(planG);
    // les 4 moteurs (sous l'aile), avec leurs entrées d'air et leurs tuyères
    const zM = [-10.5, -5.5, 5.5, 10.5];
    for (const z of zM) {
      const moteur = O.fuseau([{ x: -1.5, y: 4.6, w: 0.35, h: 0.4 }, { x: 0.0, y: 4.5, w: 0.65, h: 0.75 }, { x: 3.8, y: 4.5, w: 0.7, h: 0.75 }, { x: 4.6, y: 4.55, w: 0.5, h: 0.5 }], peau, 14);
      moteur.position.z = z;
      caisse.add(moteur);
      caisse.add(O.boite(0.5, 0.25, 0.35, m.teinte, 4.0, 3.85, z, CT.noir)); // l'entrée d'air, dessous
      caisse.add(O.tube([0.5, 4.8, z + 0.45], [-0.3, 4.95, z + 0.75], 0.15, m.teinte, 8, CT.noir)); // la tuyère
    }
    O.souder(caisse);
    const helices = [];
    for (const z of zM) {
      const h = new THREE.Group();
      h.position.set(4.95, 4.55, z);
      h.add(O.couche(O.cylindre(0.05, 0.45, 0.8, m.teinte, 12, 0x2a2d30), "x", 0.2, 0, 0).rotateZ(Math.PI)); // le cône
      for (let k = 0; k < 8; k++) {
        const pale = O.profil([[0.2, -0.16], [2.1, -0.06], [2.25, 0.15], [1.4, 0.2], [0.2, 0.14]], 0.04, m.teinte, 0.01, 0x1c1d1f);
        pale.rotation.set((k * Math.PI) / 4, 0, 0, "XYZ");
        pale.rotateZ(Math.PI / 2);
        pale.rotateY(0.35);
        h.add(pale);
      }
      O.souder(h);
      caisse.add(h);
      helices.push(h);
    }
    return { g, caisse, helices };
  }

  // (étape 64, refait à l'étape 70) LA DCA : un socle posé sur 4 bras avec leurs vérins, une tourelle qui tourne avec
  // le siège du tireur (et le tireur), son viseur, le bouclier avec sa vitre, et 2 longs canons (avec leurs chargeurs et
  // leurs freins de bouche) qui se lèvent.
  function dca(equipe) {
    mats();
    const m = MT(), p = peintureSoudee(equipe), g = new THREE.Group(), caisse = new THREE.Group(), V = vitreClaire();
    g.add(caisse);
    caisse.add(O.cylindre(1.6, 1.9, 0.45, p, 20).translateY(0.25)); // le socle
    for (let k = 0; k < 4; k++) { // les 4 bras et leurs vérins
      const a = (k * Math.PI) / 2 + Math.PI / 4, c = Math.cos(a), s = -Math.sin(a);
      caisse.add(O.boite(2.4, 0.22, 0.32, p, c * 1.6, 0.18, s * 1.6).rotateY(a));
      caisse.add(O.cylindre(0.06, 0.06, 0.5, m.teinte, 8, CT.acier).translateX(c * 2.6).translateY(0.3).translateZ(s * 2.6));
      caisse.add(O.cylindre(0.25, 0.28, 0.06, m.teinte, 12, CT.noir).translateX(c * 2.6).translateY(0.03).translateZ(s * 2.6)); // le patin
    }
    caisse.add(O.boite(0.6, 0.35, 0.45, m.teinte, -1.0, 0.65, 1.0, CT.olive)); // les caisses de munitions
    caisse.add(O.boite(0.6, 0.35, 0.45, m.teinte, -1.1, 0.65, 0.45, CT.olive));
    O.souder(caisse);
    const tourelle = new THREE.Group();
    tourelle.position.y = 0.6;
    caisse.add(tourelle);
    tourelle.add(O.cylindre(1.0, 1.1, 0.6, p, 18).translateY(0.3));
    tourelle.add(O.boite(0.5, 0.12, 0.5, m.teinte, -0.65, 0.95, 0, CT.noir), O.boite(0.1, 0.55, 0.5, m.teinte, -0.92, 1.22, 0, CT.noir)); // le siège
    tourelle.add(O.tube([-0.3, 0.6, 0], [-0.65, 0.9, 0], 0.06, m.teinte, 6, CT.acier));
    // le tireur
    const buste = O.piece(new THREE.CapsuleGeometry(0.17, 0.25, 3, 8), m.teinte, -0.62, 1.38, 0, CT.tissu);
    buste.scale.set(0.8, 1, 1.15);
    tourelle.add(buste, O.boite(0.26, 0.32, 0.36, m.teinte, -0.6, 1.38, 0, 0x5f6a4a));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.1, 10, 8), m.teinte, -0.58, 1.76, 0, CT.peau));
    tourelle.add(O.piece(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, -0.6, 1.8, 0, CT.casque));
    for (const s of [-1, 1]) {
      tourelle.add(O.tube([-0.6, 1.1, s * 0.12], [-0.2, 1.05, s * 0.14], 0.07, m.teinte, 6, CT.tissu), O.tube([-0.2, 1.05, s * 0.14], [-0.15, 0.62, s * 0.14], 0.06, m.teinte, 6, CT.tissu));
      tourelle.add(O.tube([-0.6, 1.55, s * 0.18], [-0.3, 1.45, s * 0.25], 0.045, m.teinte, 6, CT.tissu), O.tube([-0.3, 1.45, s * 0.25], [-0.05, 1.5, s * 0.2], 0.04, m.teinte, 6, CT.tissu));
      tourelle.add(O.boite(0.06, 0.18, 0.06, m.teinte, -0.03, 1.5, s * 0.2, CT.noir)); // les poignées
    }
    // le bouclier, avec sa vitre et le viseur
    tourelle.add(O.boite(0.12, 0.7, 2.0, p, 0.5, 1.45, 0));
    tourelle.add(O.boite(0.12, 0.32, 0.9, p, 0.5, 1.97, 0));
    tourelle.add(O.boite(0.04, 0.3, 0.5, V, 0.5, 1.95, 0));
    tourelle.add(O.boite(0.25, 0.2, 0.15, m.teinte, 0.2, 2.0, 0, CT.noir), O.boite(0.02, 0.14, 0.12, M.verre, 0.33, 2.02, 0));
    O.souder(tourelle);
    const canons = new THREE.Group();
    canons.position.set(0.3, 1.6, 0);
    tourelle.add(canons);
    for (const z of [-0.45, 0.45]) {
      canons.add(O.boite(1.1, 0.38, 0.3, m.teinte, 0.25, 0, z, 0x3a3d40)); // le boîtier
      canons.add(O.boite(0.5, 0.42, 0.22, m.teinte, 0.1, 0.32, z, CT.olive)); // le chargeur
      canons.add(O.couche(O.cylindre(0.11, 0.11, 1.0, m.teinte, 10, 0x3a3d40), "x", 1.1, 0, z)); // le manchon
      canons.add(O.couche(O.cylindre(0.06, 0.075, 2.3, m.teinte, 10, CT.noir), "x", 2.4, 0, z)); // le tube
      canons.add(O.couche(O.cylindre(0.11, 0.11, 0.32, m.teinte, 10, CT.noir), "x", 3.45, 0, z)); // le frein de bouche
      for (const dx of [-0.08, 0.08]) canons.add(O.boite(0.06, 0.24, 0.24, m.teinte, 3.45 + dx, 0, z, 0x0d0d0d));
    }
    O.souder(canons);
    const flammes = [];
    for (const z of [-0.45, 0.45]) {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }));
      f.position.set(3.75, 0, z);
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
    if (Tanks.Vehicules3D && Tanks.Vehicules3D.sait(sorte)) return Tanks.Vehicules3D.fabriquer(sorte, equipe); // (étape 71)
    return { jeep, helico, avion, drone, bateau, sousmarin, dca, transport, chasseur: avion }[sorte](equipe);
  }
  function bruler(o) {
    const m = mats();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
  }

  // (étape 71) la moto, le quad et le camion sont fabriqués dans affichage/vehicules3d.js (qui réutilise ces outils)
  const outils = { pilote, siege, peintureSoudee, vitreClaire, mats };
  return { soldat, animer, fabriquer, bruler, portail, silhouettes, outils };
})();
