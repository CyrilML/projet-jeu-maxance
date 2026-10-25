// 📡 LA FERME SOLAIRE ET LE RÉSEAU EN 3D : le décorateur de 2040 (demande 115, édition « Bataille de drones »)
//
// Le réseau (logique/relais.js) sait où sont les antennes, les postes et les canons ; ta flotte (logique/flotte.js) sait
// où roule ton robot. Ce décorateur pose ce qu'on voit :
//   - les CHAMPS DE PANNEAUX SOLAIRES : des milliers de panneaux bleu nuit penchés vers le soleil, sur leurs pieds (TOUS
//     en une seule « instance » : 1 dessin pour des milliers de panneaux) ;
//   - les BORNES DE RECHARGE des drones : une dalle hexagonale et son anneau qui brille ;
//   - les ANTENNES RELAIS : un pylône en treillis de 26 m, ses paraboles, sa lumière qui clignote ; détruite, elle se
//     couche par terre, noircie ;
//   - la PORTÉE DU SIGNAL : un grand cercle au sol autour de chaque antenne (bleu glacier : ton camp ; magenta : l'ennemi),
//     et un petit cercle en pointillés pour son BROUILLEUR ;
//   - les POSTES DE COMMANDEMENT : le bunker de béton, son filet anti-drones tendu au-dessus, la camionnette d'antennes ;
//   - les CANONS ANTI-DRONES : le socle, et la tête à deux canons qui TOURNE vers sa cible (toutes les têtes : 1 dessin) ;
//   - ton ROBOT TERRESTRE « Mule » quand tu le pilotes.
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Relais3D = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, O = Tanks.Outils3D, RL = Tanks.Relais;
  const VAR = T.variante || {};
  const actif = !!RL && RL.actif;
  const bilan = { panneaux: 0, bornes: 0, antennes: 0, cercles: 0, dessins: 0, canons: 0 };
  const couleurCamp = (equipe) => new THREE.Color(C.equipes[equipe].marque);
  let mat = null, groupesAntennes = [], groupesPostes = {}, tetes = null, robot = null, scene3d = null, lumieres = [];
  const objet = new THREE.Object3D();

  // ------------------------------------------------------------------ construire (une fois, avec le décor)
  function construire(groupe, ajouter) {
    if (!actif) return;
    mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.25 });
    const poser = (g) => { for (const m of O.souder(g, true)) ajouter(groupe, m), bilan.dessins++; };
    // 1. LES PANNEAUX SOLAIRES (une instance)
    const pg = new THREE.Group();
    const panneau = O.boite(4, 0.08, 2.2, mat, 0, 1.6, 0, 0x1a2a4a);
    panneau.rotation.z = 0; panneau.rotation.x = 0; pg.add(panneau);
    pg.add(O.boite(4.05, 0.03, 0.06, mat, 0, 1.66, -1.08, 0xb8c4d0), O.boite(4.05, 0.03, 0.06, mat, 0, 1.66, 1.08, 0xb8c4d0)); // le cadre d'alu
    for (const x of [-1.6, 1.6]) pg.add(O.boite(0.08, 1.6, 0.08, mat, x, 0.8, 0, 0x8a949e));
    const [mp] = O.souder(pg, false);
    mp.geometry.rotateX(-0.45); // (penché vers le soleil, au sud)
    const places = [];
    for (const [x0, z0, x1, z1] of VAR.solaire || []) for (let z = z0; z <= z1; z += 9) for (let x = x0; x <= x1; x += 4.4) {
      if (T.boitesAutour(x, z, 3, []).length) continue;
      places.push([x, T.hauteurExacte(x, z), z]);
    }
    if (places.length) {
      const inst = new THREE.InstancedMesh(mp.geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.6 }), places.length);
      places.forEach(([x, y, z], i) => (objet.position.set(x, y, z), objet.rotation.set(0, 0, 0), objet.updateMatrix(), inst.setMatrixAt(i, objet.matrix)));
      inst.receiveShadow = true;
      inst.computeBoundingSphere();
      groupe.add(inst);
      bilan.panneaux = places.length;
      bilan.dessins++;
    }
    // 2. LES BORNES DE RECHARGE
    const bg = new THREE.Group();
    for (const [x, z] of VAR.bornes || []) {
      const y = T.hauteurExacte(x, z);
      bg.add(O.piece(new THREE.CylinderGeometry(2.6, 2.8, 0.25, 6), mat, x, y + 0.12, z, 0x8a929a));
      bg.add(O.piece(new THREE.TorusGeometry(2.1, 0.07, 4, 18), mat, x, y + 0.27, z, 0x5ad8ff).rotateX(Math.PI / 2));
      bg.add(O.boite(0.5, 1.4, 0.4, mat, x + 3.2, y + 0.7, z, 0xd8dde2)); // la borne
      bilan.bornes++;
    }
    poser(bg);
    // 3. LES ANTENNES (un groupe chacune : elle se couche quand elle est détruite)
    for (const a of RL.antennes) {
      const g = new THREE.Group(), H = 26, coul = couleurCamp(a.equipe).getHex();
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(O.tube([sx * 1.6, 0, sz * 1.6], [sx * 0.4, H, sz * 0.4], 0.07, mat, 4, 0x9aa4ae));
      for (let k = 0; k < 8; k++) { const y = (k + 0.5) * (H / 8), r = 1.6 - (1.2 * y) / H; for (const [a1, a2] of [[[-r, -r], [r, -r]], [[r, -r], [r, r]], [[r, r], [-r, r]], [[-r, r], [-r, -r]]]) g.add(O.tube([a1[0], y, a1[1]], [a2[0], y + H / 8, a2[1]], 0.03, mat, 3, 0x8a949e)); }
      for (const [y, rot] of [[19, 0.3], [16, 2.4], [22, 4.2]]) { const p = O.piece(new THREE.CylinderGeometry(0.9, 0.5, 0.25, 12), mat, Math.cos(rot) * 0.9, y, Math.sin(rot) * 0.9, 0xe8ecef); p.rotation.set(0, -rot, Math.PI / 2); g.add(p); } // les paraboles
      g.add(O.boite(1.8, 2.2, 1.6, mat, 2.4, 1.1, 0, 0xc8ced4), O.boite(1.82, 0.3, 1.62, mat, 2.4, 1.6, 0, coul)); // l'armoire électrique, à la couleur du camp
      g.add(O.piece(new THREE.SphereGeometry(0.25, 8, 6), mat, 0, H + 0.3, 0, 0xff3030)); // la lampe
      const tout = new THREE.Group();
      for (const m of O.souder(g, true)) tout.add(m);
      tout.position.set(a.x, a.y, a.z);
      groupe.add(tout);
      groupesAntennes.push({ a, g: tout });
      bilan.antennes++;
      bilan.dessins++;
    }
    // 4. LES CERCLES DE PORTÉE (le signal) et des BROUILLEURS, posés sur le sol (un trait qui suit les collines)
    const cercle = (x, z, r, coul, pointille) => {
      const pts = [], n = Math.max(48, Math.round(r / 6));
      for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; pts.push(new THREE.Vector3(px, T.hauteurExacte(px, pz) + 0.4, pz)); }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const l = new THREE.Line(geo, pointille ? new THREE.LineDashedMaterial({ color: coul, dashSize: 4, gapSize: 3, transparent: true, opacity: 0.85 }) : new THREE.LineBasicMaterial({ color: coul, transparent: true, opacity: 0.55 }));
      if (pointille) l.computeLineDistances();
      groupe.add(l);
      bilan.cercles++;
      return l;
    };
    for (const ga of groupesAntennes) (ga.cercle = cercle(ga.a.x, ga.a.z, ga.a.rayon, couleurCamp(ga.a.equipe), false)), (ga.brouilleur = cercle(ga.a.x, ga.a.z, C.relais.brouillage, couleurCamp(ga.a.equipe), true));
    // 5. LES POSTES DE COMMANDEMENT
    const imgFilet = (() => { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); x.strokeStyle = "rgba(30,34,38,0.95)"; x.lineWidth = 2; for (let k = 0; k <= 64; k += 8) (x.beginPath(), x.moveTo(k, 0), x.lineTo(k, 64), x.stroke(), x.beginPath(), x.moveTo(0, k), x.lineTo(64, k), x.stroke()); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); return t; })();
    const matFilet = new THREE.MeshStandardMaterial({ map: imgFilet, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    for (const equipe of ["bleus", "rouges"]) {
      const p = RL.postes[equipe], g = new THREE.Group(), coul = couleurCamp(equipe).getHex();
      g.add(O.boite(10, 3.2, 7, mat, 0, 1.4, 0, 0x8c9096)); // le bunker
      g.add(O.boite(10.6, 0.5, 7.6, mat, 0, 3.2, 0, 0x7a7e84));
      g.add(O.boite(2, 2.2, 0.2, mat, 0, 1.1, 3.55, 0x2e3236)); // la porte
      g.add(O.boite(10.1, 0.25, 7.1, mat, 0, 2.6, 0, coul)); // la bande de couleur du camp
      for (const sx of [-1, 1]) g.add(O.boite(5.5, 2.4, 2.2, mat, sx * 8.5, 1.3, 5, 0xdfe3e6), O.boite(1.6, 1.6, 2.1, mat, sx * 8.5 + 3.3, 1.0, 5, 0xc8ccd0)); // les camionnettes d'antennes
      for (const sx of [-1, 1]) g.add(O.tube([sx * 8.5, 2.5, 5], [sx * 8.5, 9, 5], 0.05, mat, 4, 0x6a7078));
      for (const [sx, sz] of [[-7, -5.5], [7, -5.5], [7, 5.5], [-7, 5.5]]) g.add(O.tube([sx, 0, sz], [sx, 6.2, sz], 0.08, mat, 4, 0x5a5e62)); // les poteaux du filet
      const tout = new THREE.Group();
      for (const m of O.souder(g, true)) tout.add(m);
      const filet = new THREE.Mesh(new THREE.PlaneGeometry(14.5, 11.5).rotateX(-Math.PI / 2).translate(0, 6.1, 0), matFilet);
      tout.add(filet);
      tout.position.set(p.x, p.y, p.z);
      tout.rotation.y = -(p.angle || 0);
      groupe.add(tout);
      groupesPostes[equipe] = { p, g: tout };
      cercle(p.x, p.z, p.rayon, couleurCamp(equipe), false);
      bilan.dessins += 3;
    }
    // 6. LES SOCLES DES CANONS (fixes, soudés) ; les têtes : une instance qui tourne
    const sg = new THREE.Group();
    for (const c of RL.canons) sg.add(O.piece(new THREE.CylinderGeometry(0.9, 1.1, 1.4, 10), mat, c.x, c.y + 0.7, c.z, 0x6a7078));
    poser(sg);
    const tg = new THREE.Group();
    tg.add(O.boite(1.2, 0.8, 1.0, mat, 0, 0, 0, 0x4a5058), O.boite(0.5, 0.6, 0.6, mat, -0.2, 0.55, 0, 0x2e3236)); // la tête, le radar
    for (const z of [-0.25, 0.25]) tg.add(O.tube([0.4, 0.1, z], [2.2, 0.25, z], 0.06, mat, 6, 0x22262a)); // les 2 canons
    const [mt] = O.souder(tg, false);
    tetes = new THREE.InstancedMesh(mt.geometry, mat, RL.canons.length);
    tetes.frustumCulled = false;
    groupe.add(tetes);
    bilan.canons = RL.canons.length;
  }

  // ------------------------------------------------------------------ chaque image (scene.js appelle ceci)
  let horloge = 0;
  function maj(scene, monde, dt) {
    if (!actif || !tetes) return;
    horloge += dt || 0;
    // les têtes des canons (elles tournent vers leur cible ; celles d'une antenne détruite penchent, éteintes)
    RL.canons.forEach((c, i) => {
      objet.position.set(c.x, c.y + 1.8, c.z);
      objet.rotation.set(c.garde.detruit ? 0.5 : 0, -c.angle, c.cible && !c.garde.detruit ? 0.35 : 0.05);
      objet.updateMatrix();
      tetes.setMatrixAt(i, objet.matrix);
    });
    tetes.instanceMatrix.needsUpdate = true;
    // les antennes détruites se couchent ; leurs cercles disparaissent
    for (const ga of groupesAntennes) {
      const d = ga.a.detruit;
      ga.g.rotation.z += ((d ? 1.45 : 0) - ga.g.rotation.z) * Math.min(1, (dt || 0) * 2);
      ga.cercle.visible = ga.brouilleur.visible = !d;
    }
    for (const eq of ["bleus", "rouges"]) { const gp = groupesPostes[eq]; if (gp && gp.p.detruit && gp.g.scale.y > 0.35) gp.g.scale.y = Math.max(0.35, gp.g.scale.y - (dt || 0)); }
    // ton robot terrestre
    const t = monde.toi, e = t && t.engin;
    const montrer = !!(e && e.sorte === "drone" && e.typeDrone && Tanks.Flotte.fiche(e).vol === "sol" && e.vol > 0 && e.pilote);
    if (montrer && !robot) {
      const g = new THREE.Group();
      g.add(O.boite(1.6, 0.5, 1.1, mat, 0, 0.55, 0, 0x5c6670), O.boite(0.7, 0.35, 0.6, mat, 0.1, 0.98, 0, 0x3a4148));
      for (const sz of [-0.62, 0.62]) for (const x of [-0.55, 0, 0.55]) g.add(O.piece(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 10), mat, x, 0.25, sz, 0x1e2226).rotateX(Math.PI / 2));
      g.add(O.tube([0.3, 1.0, 0], [1.2, 1.05, 0], 0.04, mat, 6, 0x22262a), O.tube([-0.5, 1.0, 0.3], [-0.5, 1.9, 0.3], 0.012, mat, 3, 0x22262a));
      g.add(O.boite(0.1, 0.12, 0.3, mat, 0.86, 0.6, 0, 0x5ad8ff)); // ses yeux
      robot = new THREE.Group();
      for (const m of O.souder(g, true)) robot.add(m);
      scene.add(robot);
    }
    if (robot) {
      robot.visible = montrer;
      if (montrer) (robot.position.set(e.x, e.y, e.z), (robot.rotation.y = -e.angle));
    }
  }
  // la grande image du sol : le gravier clair sous les panneaux solaires, et les allées
  function peindreSol(ctx, X, k) {
    if (!actif) return;
    for (const [x0, z0, x1, z1] of VAR.solaire || []) {
      ctx.fillStyle = "rgba(150,156,160,0.55)";
      ctx.fillRect(X(x0 - 4), X(z0 - 4), (x1 - x0 + 8) * k, (z1 - z0 + 8) * k);
      ctx.fillStyle = "rgba(110,116,120,0.6)";
      for (let z = z0 + 4.5; z < z1; z += 9) ctx.fillRect(X(x0 - 4), X(z), (x1 - x0 + 8) * k, Math.max(1, 1.2 * k));
    }
  }
  return { actif, construire, maj, peindreSol, bilan };
})();
