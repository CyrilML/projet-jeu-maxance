// 🛸 LES DRONES FPV EN 3D : le maquettiste, le bourdon et les lunettes (demande 115, édition « Europe de l'Est »)
//
// Le pilote des drones (logique/drones-fpv.js) sait où vole chaque drone FPV ; ce fichier les MONTRE et les fait ENTENDRE :
//   - la MAQUETTE : un petit drone de course (le cadre en X en carbone, les 4 moteurs et leurs hélices, la caméra devant,
//     et la charge accrochée dessous). Tous les drones en l'air sont UNE seule « instance » (1 seul dessin pour tous) ;
//   - le BOURDONNEMENT : le « bzzzz » aigu des 4 moteurs, plus fort quand un drone est près de toi, et qui MONTE quand il
//     plonge (il va plus vite) ;
//   - les LUNETTES DE TON DRONE FPV : l'image vue par la caméra du drone, avec la NEIGE (les parasites) qui grandit quand
//     le signal faiblit, et les chiffres incrustés : batterie, hauteur, vitesse, signal ;
//   - l'ALERTE : « 🛸 DRONE FPV SUR TOI ! » quand un drone ennemi a choisi ton tank ou ton soldat, et un petit crochet
//     rouge autour des drones ennemis proches (ils sont tout petits !).
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.DronesFPV3D = (function () {
  const C = Tanks.CONFIG, DF = Tanks.DronesFPV, O = Tanks.Outils3D;
  const MAX = 24;
  const bilan = { dessines: 0, son: 0, bruit: 0 };
  let lot = null, lotAile = null;
  const objet = new THREE.Object3D();

  // ------------------------------------------------------------------ la maquette (fabriquée une fois)
  function maquette() {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.3 }), g = new THREE.Group();
    const CARBONE = 0x1c1d1f, MOTEUR = 0x3a3b3e, HELICE = 0x55585c, CHARGE = 0x4c5640;
    g.add(O.boite(0.16, 0.05, 0.1, mat, 0, 0, 0, CARBONE)); // le corps
    for (const [x, z] of [[0.17, 0.17], [0.17, -0.17], [-0.17, 0.17], [-0.17, -0.17]]) {
      g.add(O.tube([0, 0, 0], [x, 0, z], 0.015, mat, 4, CARBONE)); // le bras
      g.add(O.piece(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8), mat, x, 0.025, z, MOTEUR)); // le moteur
      g.add(O.piece(new THREE.CylinderGeometry(0.11, 0.11, 0.005, 12), mat, x, 0.05, z, HELICE)); // le disque de l'hélice qui tourne
    }
    g.add(O.boite(0.04, 0.035, 0.035, mat, 0.1, 0.02, 0, 0x101010)); // la caméra
    g.add(O.boite(0.008, 0.008, 0.008, mat, 0.123, 0.02, 0, 0xff2a20)); // sa petite lumière rouge
    const charge = O.piece(new THREE.CylinderGeometry(0.035, 0.03, 0.28, 8), mat, 0.04, -0.06, 0, CHARGE); // la charge (une ogive) sous le drone
    charge.rotation.z = Math.PI / 2;
    g.add(charge);
    g.add(O.tube([0, 0.03, 0.04], [-0.1, 0.18, 0.06], 0.004, mat, 3, 0x222222)); // l'antenne
    const [m] = O.souder(g, false);
    m.geometry.scale(1.4, 1.4, 1.4); // (un peu plus grand que le vrai : sinon on ne le voit pas du tout)
    return new THREE.InstancedMesh(m.geometry, mat, MAX);
  }
  // ✍️ (Bataille de drones) la MUNITION RÔDEUSE : une petite aile volante (le fuselage, les ailes en X, l'hélice derrière)
  function maquetteAile() {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.3 }), g = new THREE.Group();
    g.add(O.piece(new THREE.CylinderGeometry(0.07, 0.06, 1.2, 8).rotateZ(Math.PI / 2), mat, 0, 0, 0, 0x3a3f46)); // le fuselage
    g.add(O.piece(new THREE.ConeGeometry(0.07, 0.2, 8).rotateZ(-Math.PI / 2), mat, 0.7, 0, 0, 0x22262a)); // le nez (la charge)
    for (const [x, r] of [[0.25, 0.4], [-0.4, -0.4]]) { const a = O.boite(0.18, 0.015, 1.3, mat, x, 0, 0, 0x5c6670); a.rotation.x = r; g.add(a); } // les ailes en X
    g.add(O.piece(new THREE.CylinderGeometry(0.16, 0.16, 0.01, 10).rotateZ(Math.PI / 2), mat, -0.62, 0, 0, 0x55585c)); // l'hélice
    const [m] = O.souder(g, false);
    m.geometry.scale(1.3, 1.3, 1.3);
    return new THREE.InstancedMesh(m.geometry, mat, MAX);
  }
  // Chaque image : placer les drones (scene.js appelle ceci)
  function maj(scene, monde) {
    if (!DF || !DF.actif) return;
    if (!lot) {
      lot = maquette();
      lot.frustumCulled = false;
      lot.castShadow = false;
      scene.add(lot);
      lotAile = maquetteAile();
      lotAile.frustumCulled = false;
      scene.add(lotAile);
    }
    let n = 0, na = 0;
    if (monde.phase === "bataille" || monde.phase === "victoire" || monde.phase === "defaite") for (const d of DF.liste) {
      if (n >= MAX || na >= MAX) break;
      objet.position.set(d.x, d.y, d.z);
      const h = Math.hypot(d.vx, d.vz);
      objet.rotation.set(DF.tombe(d) ? d.angle * 0.7 : 0, -d.angle, Math.atan2(d.vy, Math.max(0.1, h)) * (d.forme === "aile" ? 1 : 0.8), "YZX");
      objet.updateMatrix();
      if (d.forme === "aile") lotAile.setMatrixAt(na++, objet.matrix);
      else lot.setMatrixAt(n++, objet.matrix);
    }
    lot.count = n;
    lot.instanceMatrix.needsUpdate = true;
    lot.visible = n > 0;
    lotAile.count = na;
    lotAile.instanceMatrix.needsUpdate = true;
    lotAile.visible = na > 0;
    bilan.dessines = n + na;
  }

  // ------------------------------------------------------------------ le bourdonnement (sons.js appelle ceci à chaque image)
  let son = null;
  function bourdonner(ctx, sortie, monde) {
    if (!DF || !DF.actif || !ctx) return;
    if (!son) {
      const a = ctx.createOscillator(), b = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      a.type = "sawtooth", b.type = "square", a.frequency.value = 190, b.frequency.value = 247;
      f.type = "bandpass", f.frequency.value = 1400, f.Q.value = 0.8;
      g.gain.value = 0;
      lfo.frequency.value = 23, lg.gain.value = 9; // (le petit tremblement des 4 moteurs qui ne tournent pas tout à fait pareil)
      lfo.connect(lg), lg.connect(a.frequency), lg.connect(b.frequency);
      a.connect(f), b.connect(f), f.connect(g), g.connect(sortie);
      a.start(), b.start(), lfo.start();
      son = { a, b, f, g };
    }
    const t = monde.toi || {}, moi = t.engin || t.soldat || monde.joueur;
    let fort = 0, aigu = 0;
    if (moi && monde.phase === "bataille") {
      for (const d of DF.liste) {
        const dist = Math.hypot(d.x - moi.x, d.y - (moi.y || 0), d.z - moi.z);
        if (dist > 160) continue;
        const f2 = Math.pow(1 - dist / 160, 2);
        if (f2 > fort) (fort = f2), (aigu = Math.hypot(d.vx, d.vy, d.vz) / 30);
      }
      const e = t.engin;
      if (e && e.sorte === "drone" && C.engins.drone.fpv && e.pilote) (fort = Math.max(fort, 0.55)), (aigu = Math.max(aigu, e.vitesse / C.engins.drone.vitesseMax));
    }
    const now = ctx.currentTime;
    son.g.gain.setTargetAtTime(fort * 0.09, now, 0.08);
    son.a.frequency.setTargetAtTime(170 + aigu * 120, now, 0.1);
    son.b.frequency.setTargetAtTime(222 + aigu * 160, now, 0.1);
    bilan.son = Math.round(fort * 100);
  }

  // ------------------------------------------------------------------ les lunettes de TON drone FPV (tableau.js appelle ceci)
  function lunettes(ctx, L, H, e, monde) {
    const R = Tanks.Flotte && Tanks.Flotte.actif ? Tanks.Flotte.fiche(e) : C.engins.drone, sig = e.signal === undefined ? 1 : e.signal, batt = e.batterie === undefined ? R.batterie : e.batterie;
    const bruit = Math.min(1, 0.1 + Math.pow(1 - sig, 1.5) * 1.1 + (batt < 12 ? 0.25 : 0));
    bilan.bruit = Math.round(bruit * 100);
    // la neige (les parasites) : des petits points gris, et des bandes qui sautent
    const n = Math.round(260 + bruit * 1800);
    for (let i = 0; i < n; i++) {
      const v = Math.random() < 0.5 ? 255 : 30;
      ctx.fillStyle = "rgba(" + v + "," + v + "," + v + "," + (0.15 + Math.random() * 0.35 * (0.4 + bruit)) + ")";
      ctx.fillRect(Math.random() * L, Math.random() * H, 2 + Math.random() * 3, 1 + Math.random() * 2);
    }
    for (let i = 0; i < 2 + bruit * 10; i++) {
      ctx.fillStyle = "rgba(220,220,220," + (0.03 + Math.random() * 0.1 * bruit) + ")";
      ctx.fillRect(0, Math.random() * H, L, 2 + Math.random() * 12 * bruit);
    }
    // le bord rond des lunettes
    const v = ctx.createRadialGradient(L / 2, H / 2, H * 0.42, L / 2, H / 2, L * 0.62);
    v.addColorStop(0, "rgba(0,0,0,0)"), v.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = v, ctx.fillRect(0, 0, L, H);
    // les chiffres incrustés (police d'écran, blanche avec une ombre)
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    const ecrire = (s, x, y, coul) => { ctx.fillStyle = "rgba(0,0,0,.7)"; ctx.fillText(s, x + 1, y + 1); ctx.fillStyle = coul || "#f4f4f4"; ctx.fillText(s, x, y); };
    const haut = e.y - Tanks.Terrain.hauteur(e.x, e.z), pc = Math.round((batt / R.batterie) * 100);
    ecrire("🔋 " + pc + " %", 40, 60, pc < 20 ? "#ff5a4a" : null);
    ecrire("SIGNAL " + "▮".repeat(Math.ceil(sig * 5)) + "▯".repeat(5 - Math.ceil(sig * 5)), 40, 84, sig < 0.3 ? "#ff5a4a" : null);
    ecrire("ALT " + Math.round(haut) + " m", 40, 108);
    ecrire(Math.round(e.vitesse * 3.6) + " km/h", 40, 132);
    if (Math.floor(performance.now() / 400) % 2) ecrire("● ARMÉ", L / 2 - 36, 128, "#ff4a3d");
    ctx.textAlign = "center";
    const FL = Tanks.Flotte && Tanks.Flotte.actif ? Tanks.Flotte : null;
    if (FL) {
      // ✍️ (Bataille de drones) TA FLOTTE : les 5 drones, celui que tu pilotes, ceux qui se préparent
      const ids = Object.keys(FL.fiches), K = FL.fiche(e);
      ids.forEach((id, i) => {
        const f = FL.fiches[id], att = (e.attentes || {})[id] || 0, x = L / 2 + (i - (ids.length - 1) / 2) * 120;
        ctx.fillStyle = id === e.typeDrone ? "rgba(90,216,255,.35)" : "rgba(0,0,0,.45)";
        ctx.fillRect(x - 56, H - 128, 112, 40);
        ecrire(f.touche + " " + f.icone + (att > 0 ? " " + Math.ceil(att) + " s" : ""), x, H - 112, att > 0 ? "#ff9a8a" : id === e.typeDrone ? "#7fe8ff" : null);
        ctx.font = "11px sans-serif";
        ecrire(f.nom.replace(/ «.*/, ""), x, H - 96, "#ccd");
        ctx.font = "bold 16px monospace";
      });
      ecrire(K.icone + " " + K.nom + (e.attenteFlotte ? " · se prépare : " + Math.ceil(e.attentes[e.typeDrone]) + " s (choisis-en un autre !)" : ""), L / 2, H - 140, e.attenteFlotte ? "#ff9a8a" : "#7fe8ff");
      ecrire(K.aide, L / 2, H - 70, "#ffe27a");
      if (e.vieDrone !== undefined && e.vol > 0) ecrire("❤ " + Math.max(0, e.vieDrone) + " / " + K.vie + (e.munitionsDrone ? " · 🎯 " + e.munitionsDrone : "") + (e.brouille ? " · 📡 BROUILLÉ !" : ""), L / 2, 160, e.brouille ? "#ff5a4a" : null);
      if (e.plongee) { const p = Tanks.Scene.versEcran(e.plongee.x, e.plongee.y + 1.5, e.plongee.z, L, H); if (p) (ctx.strokeStyle = "#ff3a3a", ctx.lineWidth = 3, ctx.strokeRect(p.x - 18, p.y - 18, 36, 36)); }
    } else ecrire("Espace : FAIRE EXPLOSER · E : retirer les lunettes", L / 2, H - 70, "#ffe27a");
    ctx.textAlign = "left";
    // la croix au milieu, et les véhicules ennemis devant (un carré blanc)
    ctx.strokeStyle = "rgba(255,255,255,.85)", ctx.lineWidth = 1.5;
    ctx.beginPath(), ctx.moveTo(L / 2 - 14, H / 2), ctx.lineTo(L / 2 - 4, H / 2), ctx.moveTo(L / 2 + 4, H / 2), ctx.lineTo(L / 2 + 14, H / 2), ctx.moveTo(L / 2, H / 2 - 10), ctx.lineTo(L / 2, H / 2 - 3), ctx.stroke();
    for (const c of monde.chars.concat(monde.vehicules)) {
      if (c.detruit || c.equipe === e.equipe || Math.hypot(c.x - e.x, c.z - e.z) > 450) continue;
      const p = Tanks.Scene.versEcran(c.x, c.y + 1.5, c.z, L, H);
      if (p) ctx.strokeRect(p.x - 12, p.y - 12, 24, 24);
    }
  }

  // ------------------------------------------------------------------ l'alerte (tableau.js appelle ceci pendant la bataille)
  function alerte(ctx, L, H, monde) {
    if (!DF || !DF.actif || monde.phase !== "bataille") return;
    const t = monde.toi || {}, moi = t.mode === "char" ? monde.joueur : t.engin || t.soldat;
    if (!moi) return;
    let surToi = null;
    ctx.strokeStyle = "#ff4a3d", ctx.lineWidth = 2;
    for (const d of DF.liste) {
      if (d.equipe === "bleus") continue;
      const dist = Math.hypot(d.x - moi.x, d.z - moi.z);
      if ((d.cible === monde.joueur || (d.cible && d.cible.joueur)) && d.etat !== "brouille" && d.etat !== "tombe" && (!surToi || dist < surToi.dist)) surToi = { d, dist };
      if (dist > 180) continue;
      const p = Tanks.Scene.versEcran(d.x, d.y, d.z, L, H);
      if (!p) continue;
      ctx.beginPath(); // un crochet rouge autour du drone (il est tout petit)
      ctx.moveTo(p.x - 10, p.y - 4), ctx.lineTo(p.x - 10, p.y - 10), ctx.lineTo(p.x - 4, p.y - 10);
      ctx.moveTo(p.x + 10, p.y + 4), ctx.lineTo(p.x + 10, p.y + 10), ctx.lineTo(p.x + 4, p.y + 10);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.font = "bold 20px sans-serif";
    if (surToi && surToi.dist < 400 && Math.floor(performance.now() / 350) % 2) {
      ctx.fillStyle = "rgba(0,0,0,.55)", ctx.fillRect(L / 2 - 250, 150, 500, 32);
      ctx.fillStyle = "#ff6a5a", ctx.fillText("🛸 DRONE FPV SUR TOI ! (" + Math.round(surToi.dist) + " m) · bouge, ou brouille-le !", L / 2, 173);
    }
    const g = t.soldat && t.soldat.gadget;
    if (g && g.id === "brouilleur" && g.actif > 0) {
      ctx.fillStyle = "rgba(0,0,0,.55)", ctx.fillRect(L / 2 - 170, 186, 340, 28);
      ctx.fillStyle = "#7dffa0", ctx.font = "bold 16px sans-serif", ctx.fillText("📡 BROUILLEUR ALLUMÉ · " + Math.ceil(g.actif) + " s · " + g.fiche.rayon + " m", L / 2, 206);
    }
    ctx.textAlign = "left";
  }
  return { maj, bourdonner, lunettes, alerte, bilan };
})();
