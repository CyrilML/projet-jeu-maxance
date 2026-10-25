// ❄️ LA PLAINE DE VELMORA EN 3D : le décorateur de l'hiver (demande 115, édition « Bataille en Europe de l'Est »)
//
// Le géomètre (logique/terrain.js) a posé la ville, le grand silo, les hangars et les rideaux d'arbres ; le génie
// (logique/front-est.js) sait où sont les dents de dragon, les silos ronds et les champs de mines. Le décorateur pose ce
// qu'on voit en plus :
//   - les 4 SILOS RONDS de la zone industrielle (béton gris, le toit en cône poudré de neige, le tapis roulant qui monte
//     vers le grand silo) ;
//   - les DENTS DE DRAGON : des pyramides de béton en 2 rangées en quinconce, de la neige sur la pointe ;
//   - les PANNEAUX « MINES » : un piquet et un triangle rouge (une seule image pour tous) ;
//   - les FILETS DE CAMOUFLAGE tendus au-dessus des tranchées de tir (blancs et gris, troués comme un vrai filet) ;
//   - sur la grande image du sol : les CHAMPS DE TOURNESOLS coupés (les rangs de tiges sèches qui sortent de la neige) et
//     les TRACES DE CHENILLES (la terre noire retournée par les chars).
// Pour que le jeu ne rame pas (✍️ Maxance déteste le lag) : chaque sorte d'objet est SOUDÉE en un seul dessin par rangée
// ou par groupe (les dents d'une rangée : 1 dessin ; tous les panneaux : 2 dessins ; tous les filets : 1 dessin).
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Est3D = (function () {
  const T = Tanks.Terrain, O = Tanks.Outils3D, FE = Tanks.FrontEst, TR = Tanks.Tranchees;
  const VAR = T.variante || {};
  const actif = !!FE && FE.actif;
  const bilan = { silos: 0, dents: 0, panneaux: 0, filets: 0, dessins: 0, champs: 0, traces: 0 };
  let etat = 2024;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const filets = []; // (où sont les filets : pour les photos du test et le capot)
  const NEIGE = 0xf2f5f7, BETON = 0xa7a6a0, BETON_SOMBRE = 0x8a8984;

  // ------------------------------------------------------------------ l'image du panneau « MINES » et celle du filet
  function imagePanneau() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.fillStyle = "#e9e4d6", x.fillRect(0, 0, 128, 128);
    x.fillStyle = "#c42318", x.beginPath(), x.moveTo(64, 8), x.lineTo(122, 112), x.lineTo(6, 112), x.closePath(), x.fill();
    x.fillStyle = "#f4efe2", x.beginPath(), x.moveTo(64, 30), x.lineTo(104, 102), x.lineTo(24, 102), x.closePath(), x.fill();
    x.fillStyle = "#1a1a1a", x.font = "bold 22px sans-serif", x.textAlign = "center", x.fillText("MINES", 64, 92);
    x.fillStyle = "#c42318", x.fillRect(58, 48, 12, 22), x.fillRect(58, 74, 12, 6); // le « ! »
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function imageFilet() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    x.clearRect(0, 0, 128, 128);
    // des lambeaux de toile blanche et grise noués sur les mailles (le reste : des trous)
    for (let i = 0; i < 140; i++) {
      const v = 150 + hasard() * 80, px = hasard() * 128, py = hasard() * 128;
      x.fillStyle = "rgba(" + v + "," + (v + 4) + "," + (v + 6) + "," + (0.75 + hasard() * 0.25) + ")";
      x.beginPath(), x.ellipse(px, py, 4 + hasard() * 7, 2 + hasard() * 4, hasard() * 3, 0, Math.PI * 2), x.fill();
      if (hasard() < 0.35) (x.fillStyle = "rgba(96,104,90,0.9)"), x.beginPath(), x.ellipse(px + 3, py + 2, 3, 2, 0, 0, Math.PI * 2), x.fill();
    }
    x.strokeStyle = "rgba(70,72,66,0.95)", x.lineWidth = 1.2; // les mailles
    for (let k = 0; k <= 128; k += 10) (x.beginPath(), x.moveTo(k, 0), x.lineTo(k + 40, 128), x.stroke(), x.beginPath(), x.moveTo(k, 0), x.lineTo(k - 40, 128), x.stroke());
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // ------------------------------------------------------------------ construire (une fois, au chargement)
  function construire(groupe, ajouter) {
    if (!actif) return;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.02 });
    const poser = (g) => { for (const m of O.souder(g, true)) (m.receiveShadow = true), ajouter(groupe, m), bilan.dessins++; };
    // 1. LES SILOS RONDS (et le tapis roulant vers le grand silo)
    if (FE.silos.length) {
      const g = new THREE.Group();
      for (const s of FE.silos) {
        const y = T.hauteurExacte(s.x, s.z) - 0.3;
        g.add(O.piece(new THREE.CylinderGeometry(s.rayon, s.rayon, s.h, 20), mat, s.x, y + s.h / 2, s.z, BETON));
        for (let k = 1; k < 5; k++) g.add(O.piece(new THREE.CylinderGeometry(s.rayon + 0.06, s.rayon + 0.06, 0.18, 20), mat, s.x, y + (k * s.h) / 5, s.z, BETON_SOMBRE)); // les cerclages
        g.add(O.piece(new THREE.ConeGeometry(s.rayon + 0.15, 2.2, 20), mat, s.x, y + s.h + 1.1, s.z, NEIGE)); // le toit en cône, enneigé
        bilan.silos++;
      }
      const a = FE.silos[0], b = VAR.batiments && VAR.batiments[0];
      if (b) g.add(O.tube([a.x, T.hauteurExacte(a.x, a.z) + a.h + 1.5, a.z], [b[0], T.hauteurExacte(b[0], b[1]) + b[5] - 2, b[1]], 0.5, mat, 4, 0x6e6c66)); // le tapis roulant
      poser(g);
    }
    // 2. LES DENTS DE DRAGON (une rangée = 1 dessin)
    const dent = new THREE.ConeGeometry(1, 1.25, 4, 1);
    dent.rotateY(Math.PI / 4);
    for (const r of FE.rangees) {
      const g = new THREE.Group();
      for (const d of r.dents) {
        const t = d.taille * FE.RAYON_DENT, y = T.hauteurExacte(d.x, d.z);
        const m = O.piece(dent.clone().scale(t, d.taille, t), mat, d.x, y + 0.5 * d.taille, d.z, hasard() < 0.5 ? BETON : 0x9c9b95);
        m.rotation.y = hasard() * 0.3;
        g.add(m);
        g.add(O.piece(new THREE.ConeGeometry(0.28 * t, 0.36 * d.taille, 4), mat, d.x, y + 0.98 * d.taille, d.z, NEIGE)); // la neige sur la pointe
        bilan.dents++;
      }
      poser(g);
    }
    // 3. LES PANNEAUX « MINES » (tous les piquets : 1 dessin ; tous les triangles : 1 dessin)
    if (FE.panneaux.length) {
      const piquets = new THREE.Group(), plaques = new THREE.Group();
      const matPlaque = new THREE.MeshStandardMaterial({ map: imagePanneau(), roughness: 0.8, side: THREE.DoubleSide });
      for (const p of FE.panneaux) {
        const y = T.hauteurExacte(p.x, p.z), penche = (hasard() - 0.5) * 0.25;
        const q = O.piece(new THREE.BoxGeometry(0.07, 1.3, 0.07), mat, p.x, y + 0.6, p.z, 0x5a4632);
        q.rotation.z = penche;
        piquets.add(q);
        const pl = O.piece(new THREE.PlaneGeometry(0.5, 0.5), matPlaque, p.x + Math.cos(p.angle) * 0.05, y + 1.1, p.z + Math.sin(p.angle) * 0.05);
        pl.rotation.set(0, -p.angle + Math.PI / 2, penche);
        plaques.add(pl);
        bilan.panneaux++;
      }
      poser(piquets);
      poser(plaques);
    }
    // 4. LES FILETS DE CAMOUFLAGE au-dessus des tranchées de tir (tous les 34 m environ ; 1 seul dessin)
    if (TR && TR.reseau && (Tanks.CONFIG.edition.modeles || {}).tranchees === "moderne") {
      const matFilet = new THREE.MeshStandardMaterial({ map: imageFilet(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.95 });
      const g = new THREE.Group(), poteaux = new THREE.Group();
      for (const l of TR.lignes) {
        if (!l.avant) continue;
        for (let le = l.de + 12 + hasard() * 10; le < l.a - 8; le += 26 + hasard() * 18) {
          const z = l.c + l.A * TR.tri((le + l.phase * l.P) / l.P), y = T.hauteurExacte(le, z) + 1.9, L = 6 + hasard() * 4;
          const geo = new THREE.PlaneGeometry(L, 4.2, 4, 3);
          geo.rotateX(-Math.PI / 2);
          const p = geo.attributes.position, uv = geo.attributes.uv;
          for (let i = 0; i < p.count; i++) {
            p.setY(i, -0.35 * (1 - (p.getX(i) / (L / 2)) ** 2) * (1 - (p.getZ(i) / 2.1) ** 2) + (hasard() - 0.5) * 0.12); // (il pend un peu au milieu)
            uv.setXY(i, uv.getX(i) * (L / 4), uv.getY(i) * 1.05);
          }
          geo.computeVertexNormals();
          const m = O.piece(geo, matFilet, le, y, z);
          m.rotation.y = (hasard() - 0.5) * 0.15;
          g.add(m);
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) poteaux.add(O.tube([le + sx * (L / 2 - 0.3), y - 2.3, z + sz * 1.9], [le + sx * (L / 2 - 0.3), y + 0.05, z + sz * 1.9], 0.05, mat, 4, 0x6a5a44)); // les 4 piquets de bois
          bilan.filets++;
          filets.push({ x: le, z });
        }
      }
      for (const m of O.souder(g, false)) ajouter(groupe, m), bilan.dessins++;
      poser(poteaux);
    }
  }

  // ------------------------------------------------------------------ la grande image du sol (decor.js) : les champs, les traces
  function peindreSol(ctx, X, k, h) {
    if (!actif) return;
    // les champs de tournesols coupés : un fond de tiges sèches, puis les rangs (des petits points sombres)
    for (const [x0, z0, x1, z1] of VAR.tournesols || []) {
      ctx.fillStyle = "rgba(150,138,112,0.22)";
      ctx.fillRect(X(x0), X(z0), (x1 - x0) * k, (z1 - z0) * k);
      ctx.fillStyle = "rgba(70,58,40,0.55)";
      for (let z = z0 + 1; z < z1; z += 1.8) for (let x = x0 + h() * 1.5; x < x1; x += 1.5 + h() * 0.8) ctx.fillRect(X(x), X(z), Math.max(0.6, 0.35 * k), Math.max(0.6, 0.35 * k));
      bilan.champs++;
    }
    // les traces de chenilles : la terre noire retournée, deux bandes à 2,8 m l'une de l'autre, en courbes
    ctx.lineCap = ctx.lineJoin = "round";
    for (let n = 0; n < 46; n++) {
      let x = (h() * 2 - 1) * 900, z = (h() < 0.5 ? -1 : 1) * (150 + h() * 400), a = h() * Math.PI * 2;
      const pts = [];
      for (let i = 0; i < 26; i++) {
        pts.push([x, z]);
        a += (h() - 0.5) * 0.35;
        x += Math.cos(a) * 9, z += Math.sin(a) * 9;
      }
      for (const cote of [-1.4, 1.4]) {
        ctx.strokeStyle = "rgba(58,50,42," + (0.35 + h() * 0.25) + ")";
        ctx.lineWidth = Math.max(0.8, 0.7 * k);
        ctx.beginPath();
        pts.forEach(([px, pz], i) => {
          const b = i ? Math.atan2(pz - pts[i - 1][1], px - pts[i - 1][0]) + Math.PI / 2 : a, qx = px + Math.cos(b) * cote, qz = pz + Math.sin(b) * cote;
          i ? ctx.lineTo(X(qx), X(qz)) : ctx.moveTo(X(qx), X(qz));
        });
        ctx.stroke();
      }
      bilan.traces++;
    }
  }
  return { actif, construire, peindreSol, bilan, filets };
})();
