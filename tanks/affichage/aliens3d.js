// 👽 L'INVASION EN 3D : le décorateur des Xyl'tharr (demande 115, édition « Bataille contre des aliens »)
//
// Le cerveau de l'invasion (logique/aliens.js) sait où sont les pylônes, le vaisseau-mère et son cœur, les rampants ;
// ce décorateur les dessine, avec tout ce qui rend la carte étrange :
//   - la ZONE TERRAFORMÉE : des grappes de CRISTAUX violets, de grandes FLÈCHES tordues dont la pointe brille, et (sur la
//     grande image du sol) la BIOMASSE violette qui s'étale depuis leur base ;
//   - les 3 PYLÔNES de cristal (un rayon vert monte de chacun vers le vaisseau) : détruits, il ne reste qu'un moignon noir ;
//   - le VAISSEAU-MÈRE, immense, très haut : sa coque sombre, l'anneau de lumières qui tourne, le RAYON qui descend jusqu'au
//     CŒUR (une boule qui palpite), et le DÔME d'énergie autour du cœur tant qu'un pylône est debout ;
//   - les AURORES vertes et violettes dans le ciel ;
//   - les RAMPANTS (de petits drones à 6 pattes) : tous en 1 seul dessin (« instances ») ;
//   - l'ÉCLAIR BLEU d'un bouclier qui arrête une balle, et la POUSSIÈRE DE LUMIÈRE d'un alien vaincu (pas de sang) ;
//   - les modèles : le TRIPODE (Tanks.Chars3D), la SOUCOUPE (Tanks.Avions3D), le FUSIL À PLASMA et le FUSIL À RAILS
//     (Tanks.Armes3D).
// Pour que le jeu ne rame pas (✍️ Iron Wolf Studio déteste le lag) : pas une seule vraie lumière (seulement des matières qui
// « brillent » toutes seules) ; les cristaux soudés par carré de 200 m (dessinés seulement près de toi) ; les rampants,
// les éclairs et la poussière : 3 dessins en tout, avec un nombre maximum.
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Aliens3D = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, O = Tanks.Outils3D, AL = Tanks.Aliens;
  const actif = !!AL && AL.actif;
  const A = C.aliens || {};
  const bilan = { cristaux: 0, fleches: 0, dessins: 0, triangles: 0, rampantsVus: 0, eclairs: 0, poussieres: 0, ms: 0 };
  let etat = 2061;
  const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const VERT = 0x7dffb8, VIOLET = 0x9a5aff;
  let vaisseau = null, pyl = [], rampants3d = null, eclairs = [], poussiere = null;
  const grains = []; // { x, y, z, vx, vy, vz, vie }

  // ------------------------------------------------------------------ les MODÈLES (inscrits tout de suite)
  // LE TRIPODE : 3 longues jambes à 3 articulations (la hanche, le genou, la cheville), la tête en carapace qui tourne (la
  // « tourelle »), l'émetteur du rayon (le « canon »), et le CŒUR qui brille sous le ventre
  if (Tanks.Chars3D) Tanks.Chars3D.ajouterModele("tripode", (fiche, equipe) => {
    const T3 = Tanks.Chars3D.materiaux().teinte, g = new THREE.Group(), caisse = new THREE.Group(), E = C.equipes[String(equipe).split("~")[0]] || C.equipes.rouges;
    const peau = new THREE.Color(E.camouflage[0]), sombre = new THREE.Color(E.camouflage[2]), clair = new THREE.Color(E.camouflage[3]);
    const lumiere = new THREE.MeshBasicMaterial({ color: VERT });
    g.add(caisse);
    const yH = 6.4; // la hauteur des hanches
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6, ca = Math.cos(a), sa = Math.sin(a);
      const pts = [[ca * 1.2, yH, sa * 1.2], [ca * 3.0, yH + 1.2, sa * 3.0], [ca * 3.8, 3.2, sa * 3.8], [ca * 3.3, 0.15, sa * 3.3]]; // hanche → genou → cheville → pied
      for (let i = 0; i < 3; i++) caisse.add(O.tube(pts[i], pts[i + 1], 0.22 - i * 0.04, T3, 6, i === 1 ? peau : sombre));
      for (let i = 1; i < 3; i++) caisse.add(O.piece(new THREE.SphereGeometry(0.32, 8, 6), T3, pts[i][0], pts[i][1], pts[i][2], clair)); // les articulations
      caisse.add(O.piece(new THREE.CylinderGeometry(0.2, 0.55, 0.3, 6), T3, pts[3][0], 0.15, pts[3][2], sombre)); // le pied
    }
    caisse.add(O.piece(new THREE.CylinderGeometry(1.4, 1.0, 1.1, 10), T3, 0, yH - 0.2, 0, sombre)); // le bassin
    caisse.add(O.piece(new THREE.SphereGeometry(0.8, 12, 8), lumiere, 0, yH - 0.85, 0)); // ✍️ le CŒUR sous le ventre (il brille)
    for (const m of O.souder(caisse, true)) caisse.add(m);
    // la TÊTE (la tourelle) : une carapace aplatie, des plaques, 3 yeux
    const tourelle = new THREE.Group();
    tourelle.position.set(0, yH + 0.6, 0);
    const tete = O.piece(new THREE.SphereGeometry(2.4, 14, 8), T3, 0, 0.5, 0, peau);
    tete.scale.set(1.3, 0.55, 1);
    tourelle.add(tete);
    tourelle.add(O.piece(new THREE.SphereGeometry(1.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), T3, -0.6, 1.0, 0, clair)); // le dôme du dos
    for (const z of [-0.7, 0, 0.7]) tourelle.add(O.piece(new THREE.SphereGeometry(0.22, 8, 6), lumiere, 2.85, 0.55, z)); // les yeux
    const canon = new THREE.Group();
    canon.position.set(2.6, -0.1, 0);
    canon.add(O.couche(O.cylindre(0.2, 0.35, 1.6, T3, 8, sombre), "x", 0.8, 0, 0));
    canon.add(O.couche(O.cylindre(0.18, 0.18, 0.1, lumiere, 8), "x", 1.62, 0, 0));
    const bout = new THREE.Object3D();
    bout.position.set(1.8, 0, 0);
    canon.add(bout);
    tourelle.add(canon);
    g.add(tourelle);
    for (const grp of [tourelle, canon]) for (const m of O.souder(grp, true)) grp.add(m);
    const faux = { map: { offset: { x: 0 } } }; // (un tripode n'a pas de chenilles : la scène peut quand même les « faire défiler »)
    return { g, caisse, tourelle, canon, roues: [], rouesFixes: null, chenilles: [faux, { map: { offset: { x: 0 } } }], chenillesImages: [], maillons: null, bouche: bout, peinture: T3, pasChenille: 0.5 };
  });
  // LA SOUCOUPE : un disque, la coupole, l'anneau de hublots verts qui brillent, le canon à plasma dessous
  function soucoupe(equipe, simple) {
    const T3 = Tanks.Chars3D.materiaux().teinte, racine = new THREE.Group(), caisse = new THREE.Group();
    racine.add(caisse);
    const coque = O.piece(new THREE.SphereGeometry(7, simple ? 12 : 24, simple ? 6 : 10), T3, 0, 0, 0, 0x4a4458);
    coque.scale.set(1, 0.22, 1);
    caisse.add(coque);
    caisse.add(O.piece(new THREE.SphereGeometry(2.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), T3, 0, 1.0, 0, 0x6a5a88)); // la coupole
    if (!simple) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; caisse.add(O.piece(new THREE.SphereGeometry(0.35, 6, 4), T3, Math.cos(a) * 6.2, 0, Math.sin(a) * 6.2, 0x9dffc8)); } // les hublots
    caisse.add(O.piece(new THREE.CylinderGeometry(1.2, 0.6, 0.8, 10), T3, 0, -1.4, 0, 0x2a2436)); // le canon dessous
    for (const m of O.souder(caisse, true)) caisse.add(m);
    return racine;
  }
  if (Tanks.Avions3D) Tanks.Avions3D.ajouterModele("soucoupe", (equipe) => soucoupe(equipe, false), (equipe) => {
    const r = soucoupe(equipe, true), tout = new THREE.Group();
    r.updateMatrixWorld(true);
    r.traverse((m) => { if (m.isMesh) { const p = O.piece(m.geometry.clone().applyMatrix4(m.matrixWorld), Tanks.Chars3D.materiaux().teinte); p.userData.teinte = m.userData.teinte; tout.add(p); } });
    return O.souder(tout, false)[0].geometry;
  });
  // LE FUSIL À PLASMA (repris aux aliens) et LE FUSIL À RAILS : des formes inventées, avec leurs parties qui brillent
  if (Tanks.Armes3D) {
    const AR = Tanks.Armes3D, { V3, poignee, pontet } = AR.outils;
    const VIOL = 0x3a2c52, NOIR = 0x1c1c22, LUEUR = 0x7dffb8, BLEU = 0x5ad8ff;
    AR.ajouterFabrique("plasma", (e) => {
      const by = 0.05, tip = 0.5;
      e.cote([[-0.08, -0.02], [-0.08, 0.08], [0.2, 0.09], [0.32, 0.05], [0.32, 0.0], [0.05, -0.03]], 0.05, "poly", VIOL, 0, 0.012, null, 2); // la carapace bombée
      e.cote([[-0.08, 0.06], [-0.08, -0.0], [-0.28, -0.06], [-0.3, 0.04]], 0.04, "poly", VIOL, 0, 0.01, null, 2); // la crosse (comme un os)
      e.tube(0.32, tip, 0.022, 0.03, by, 0, "poly", NOIR, 10); // l'émetteur
      if (!e.leger) for (let k = 0; k < 3; k++) e.tube(0.12 + k * 0.06, 0.14 + k * 0.06, 0.036, 0.036, by + 0.01, 0, "poly", LUEUR, 10); // les anneaux qui brillent
      e.boite(0.1, 0.03, 0.03, 0.15, by + 0.06, 0, "poly", LUEUR); // la réserve de plasma (verte)
      poignee(e, "ar", NOIR);
      pontet(e, 0.008, 0.07, 0.0, NOIR);
      e.dans("chargeur", () => e.boite(0.05, 0.08, 0.03, 0.06, -0.07, 0, "poly", LUEUR));
      return { by, tip, ch: { x: 0.06, y: -0.03 }, rail: null, dessous: { x: 0.22, y: by - 0.03 }, garde: { centre: V3(0.22, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, 0.05, 0.02),
        mireNative: { ligne: 0.11, arriere: -0.04, z: 0, nom: "œilleton xyl'tharr" }, crosse: -0.3, grip: { centre: V3(-0.03, -0.05), axe: V3(0.4, 0.92, 0).normalize() } };
    });
    AR.ajouterFabrique("railgun", (e) => {
      const by = 0.045, tip = 0.95;
      e.cote([[-0.1, -0.01], [-0.1, 0.07], [0.25, 0.07], [0.25, -0.01]], 0.05, "metal", NOIR, 0, 0.006); // le boîtier
      e.cote([[-0.1, 0.06], [-0.1, 0.0], [-0.38, -0.05], [-0.4, 0.07]], 0.04, "poly", 0x2a2e36, 0, 0.008, null, 2); // la crosse
      e.boite(0.7, 0.012, 0.05, 0.6, by + 0.03, 0, "metal", 0x4a4e58); e.boite(0.7, 0.012, 0.05, 0.6, by - 0.03, 0, "metal", 0x4a4e58); // les 2 RAILS
      if (!e.leger) for (let k = 0; k < 6; k++) e.tube(0.3 + k * 0.1, 0.33 + k * 0.1, 0.034, 0.034, by, 0, "poly", BLEU, 10); // les bobines (aimants) bleues
      e.tube(0.25, tip, 0.008, 0.008, by, 0, "metal", 0x8a8e98, 8);
      e.boite(0.14, 0.05, 0.04, 0.05, by + 0.07, 0, "metal", NOIR); // la lunette
      poignee(e, "ar", NOIR);
      pontet(e, 0.008, 0.07, 0.0, NOIR);
      e.dans("chargeur", () => e.boite(0.06, 0.07, 0.03, 0.08, -0.06, 0, "poly", BLEU));
      return { by, tip, ch: { x: 0.08, y: -0.03 }, rail: null, dessous: { x: 0.3, y: by - 0.03 }, garde: { centre: V3(0.3, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, 0.05, 0.02),
        mireNative: { ligne: 0.12, arriere: 0.0, z: 0, nom: "lunette du fusil à rails" }, crosse: -0.4, grip: { centre: V3(-0.03, -0.05), axe: V3(0.4, 0.92, 0).normalize() } };
    });
  }

  // ------------------------------------------------------------------ construire le décor (une fois)
  function imageAurore() {
    const c = document.createElement("canvas");
    c.width = 256, c.height = 64;
    const x = c.getContext("2d");
    for (let i = 0; i < 256; i++) {
      const v = 0.5 + 0.5 * Math.sin(i * 0.07) * Math.sin(i * 0.023 + 1), haut = 20 + 30 * v;
      const d = x.createLinearGradient(0, 64, 0, 64 - haut);
      d.addColorStop(0, "rgba(120,255,180,0)"), d.addColorStop(0.3, "rgba(120,255,180," + (0.35 * v + 0.1) + ")"), d.addColorStop(1, "rgba(160,90,255,0)");
      x.fillStyle = d, x.fillRect(i, 0, 1, 64);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function construire(groupe, ajouter) {
    if (!actif) return;
    const t0 = performance.now(), Z = A.zone;
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.2, emissive: 0x2a1048, emissiveIntensity: 1 });
    const brille = new THREE.MeshBasicMaterial({ color: VERT });
    const carres = new Map(), carre = (x, z) => { const k = Math.floor(x / 200) + ":" + Math.floor(z / 200); if (!carres.has(k)) carres.set(k, new THREE.Group()); return carres.get(k); };
    const libre = (x, z) => !Tanks.Base.dans(x, z) && AL.pylones.every((p) => Math.hypot(p.x - x, p.z - z) > 14) && Math.hypot(AL.vaisseau.x - x, AL.vaisseau.z - z) > 22;
    // 1. les grappes de CRISTAUX
    const cristal = new THREE.OctahedronGeometry(1, 0);
    for (let n = 0; n < 60; n++) {
      const a = h() * Math.PI * 2, r = Math.sqrt(h()) * Z.rayon, cx = Z.x + Math.cos(a) * r, cz = Z.z + Math.sin(a) * r;
      if (!libre(cx, cz)) continue;
      const g = carre(cx, cz), nb = 3 + Math.floor(h() * 6);
      for (let k = 0; k < nb; k++) {
        const x = cx + (h() - 0.5) * 6, z = cz + (h() - 0.5) * 6, haut = 1 + h() * 3.5, m = O.piece(cristal.clone(), mat, x, T.hauteur(x, z) + haut * 0.6, z, new THREE.Color().setHSL(0.72 + h() * 0.1, 0.7, 0.45 + h() * 0.2));
        m.scale.set(0.35 + h() * 0.4, haut, 0.35 + h() * 0.4);
        m.rotation.set((h() - 0.5) * 0.6, h() * 3, (h() - 0.5) * 0.6);
        g.add(m);
        bilan.cristaux++;
      }
    }
    // 2. les grandes FLÈCHES tordues (la pointe brille)
    for (let n = 0; n < 12; n++) {
      const a = h() * Math.PI * 2, r = 60 + Math.sqrt(h()) * (Z.rayon - 60), x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r;
      if (!libre(x, z)) continue;
      const g = carre(x, z), H = 18 + h() * 18, y = T.hauteur(x, z);
      const f = O.piece(new THREE.ConeGeometry(2.2, H, 7, 6), mat, x, y + H / 2, z, 0x3a2a52);
      const p = f.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const t = (p.getY(i) + H / 2) / H, ang = t * 1.8; const px = p.getX(i), pz = p.getZ(i); p.setXYZ(i, px * Math.cos(ang) - pz * Math.sin(ang) + Math.sin(t * 3) * 1.2, p.getY(i), px * Math.sin(ang) + pz * Math.cos(ang)); }
      f.geometry.computeVertexNormals();
      g.add(f);
      g.add(O.piece(new THREE.OctahedronGeometry(1.1, 0), brille, x + Math.sin(3) * 1.2, y + H + 0.2, z));
      bilan.fleches++;
    }
    for (const [, g] of carres) for (const m of O.souder(g, true)) (bilan.triangles += m.geometry.attributes.position.count / 3), ajouter(groupe, m), bilan.dessins++;
    // 3. les PYLÔNES (chacun à part : on le remplace par son moignon quand il est détruit) et leur rayon vers le vaisseau
    const V = AL.vaisseau, yV = V.y + A.vaisseau.hauteur;
    const rayonMat = new THREE.MeshBasicMaterial({ color: VERT, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const p of AL.pylones) {
      const debout = new THREE.Group(), moignon = new THREE.Group();
      debout.add(O.piece(new THREE.CylinderGeometry(0.6, 2.4, 15, 6), mat, p.x, p.y + 7.5, p.z, 0x5a3a8a));
      debout.add(O.piece(new THREE.OctahedronGeometry(1.6, 0), brille, p.x, p.y + 16.5, p.z));
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; debout.add(O.piece(new THREE.OctahedronGeometry(1, 0), mat, p.x + Math.cos(a) * 3, p.y + 2, p.z + Math.sin(a) * 3, 0x7a4aba)); }
      const s1 = O.souder(debout, true);
      moignon.add(O.piece(new THREE.CylinderGeometry(1.6, 2.6, 3, 6), mat, p.x, p.y + 1.5, p.z, 0x1a1420));
      O.souder(moignon, true);
      moignon.visible = false;
      const dx = V.x - p.x, dz = V.z - p.z, dy = yV - 30 - (p.y + 17), L = Math.hypot(dx, dy, dz);
      const rayon = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, L, 6, 1, true), rayonMat);
      rayon.position.set((p.x + V.x) / 2, (p.y + 17 + yV - 30) / 2, (p.z + V.z) / 2);
      rayon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
      groupe.add(debout, moignon, rayon);
      pyl.push({ p, debout, moignon, rayon });
      bilan.dessins += s1.length + 2;
    }
    // 4. LE VAISSEAU-MÈRE (toujours dessiné : on le voit de partout), son anneau, son rayon, le cœur et le dôme
    const vg = new THREE.Group(), coque = new THREE.Group();
    const c1 = O.piece(new THREE.SphereGeometry(85, 32, 12), mat, 0, 0, 0, 0x2a2436);
    c1.scale.set(1, 0.16, 1);
    coque.add(c1, O.piece(new THREE.SphereGeometry(30, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, 0, 6, 0, 0x3a2e50));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; coque.add(O.boite(40, 4, 6, mat, Math.cos(a) * 55, -3, Math.sin(a) * 55, 0x1e1a28).rotateY(-a)); } // les nervures
    O.souder(coque, false);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(70, 1.6, 6, 48), brille);
    anneau.rotation.x = Math.PI / 2;
    anneau.position.y = -6;
    const dessous = new THREE.Mesh(new THREE.CircleGeometry(14, 24), new THREE.MeshBasicMaterial({ color: VERT, side: THREE.DoubleSide }));
    dessous.rotation.x = Math.PI / 2;
    dessous.position.y = -13.8;
    vg.add(coque, anneau, dessous);
    vg.position.set(V.x, yV, V.z);
    const haut = yV - V.y - 14;
    const faisceau = new THREE.Mesh(new THREE.CylinderGeometry(5, 7, haut, 16, 1, true), new THREE.MeshBasicMaterial({ color: VERT, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    faisceau.position.set(V.x, V.y + haut / 2, V.z);
    const coeur = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 1), new THREE.MeshBasicMaterial({ color: 0xb8ffd8 }));
    coeur.position.set(V.x, V.y + 5, V.z);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(A.vaisseau.bouclier, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    dome.position.set(V.x, V.y, V.z);
    const socle = new THREE.Group();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; socle.add(O.piece(new THREE.OctahedronGeometry(1.6, 0), mat, V.x + Math.cos(a) * 7, V.y + 1.5, V.z + Math.sin(a) * 7, 0x6a3aaa)); }
    O.souder(socle, true);
    groupe.add(vg, faisceau, coeur, dome, socle);
    vaisseau = { vg, anneau, faisceau, coeur, dome };
    bilan.dessins += 9;
    // 5. les AURORES (de grands rubans dans le ciel, loin au nord)
    const matAurore = new THREE.MeshBasicMaterial({ map: imageAurore(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    for (let k = 0; k < 3; k++) {
      const geo = new THREE.PlaneGeometry(900, 180, 24, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / 150 + k) * 80);
      const m = new THREE.Mesh(geo, matAurore);
      m.position.set((k - 1) * 500, 330 + k * 40, -1000 - k * 120);
      m.rotation.y = (k - 1) * 0.3;
      groupe.add(m);
      bilan.dessins++;
    }
    // 6. les RAMPANTS : un seul dessin pour tous (un corps, 6 pattes, 2 yeux)
    const pr = new THREE.Group(), T3 = Tanks.Chars3D.materiaux().teinte;
    const corps = O.piece(new THREE.SphereGeometry(0.45, 10, 6), T3, 0, 0.45, 0, 0x3a2c52);
    corps.scale.set(1.3, 0.6, 1);
    pr.add(corps);
    for (let k = 0; k < 6; k++) { const s = k < 3 ? 1 : -1, x = ((k % 3) - 1) * 0.35; pr.add(O.tube([x, 0.45, s * 0.3], [x * 1.4, 0.55, s * 0.75], 0.04, T3, 4, 0x221a30), O.tube([x * 1.4, 0.55, s * 0.75], [x * 1.6, 0, s * 0.95], 0.035, T3, 4, 0x221a30)); }
    for (const z of [-0.14, 0.14]) pr.add(O.piece(new THREE.SphereGeometry(0.08, 6, 4), T3, 0.55, 0.52, z, 0xcfffe4));
    const [mr] = O.souder(pr, true);
    rampants3d = new THREE.InstancedMesh(mr.geometry, T3, 16);
    rampants3d.count = 0;
    rampants3d.frustumCulled = false;
    groupe.add(rampants3d);
    // 7. les ÉCLAIRS des boucliers (8 bulles qui s'effacent) et la POUSSIÈRE DE LUMIÈRE (200 grains, 1 dessin)
    for (let k = 0; k < 8; k++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: 0x5ad8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.visible = false;
      groupe.add(m);
      eclairs.push({ m, vie: 0 });
    }
    poussiere = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.09, 0), new THREE.MeshBasicMaterial({ color: VERT, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }), 200);
    poussiere.count = 0;
    poussiere.frustumCulled = false;
    groupe.add(poussiere);
    ecouter();
    bilan.ms = Math.round(performance.now() - t0);
  }
  function eclair(x, y, z, fort) {
    const e = eclairs.find((q) => q.vie <= 0) || eclairs[0];
    e.vie = 0.25;
    e.fort = fort;
    e.m.position.set(x, y, z);
    e.m.visible = true;
    bilan.eclairs++;
  }
  function eparpiller(x, y, z, n) {
    for (let k = 0; k < n && grains.length < 200; k++) grains.push({ x: x + (h() - 0.5) * 0.6, y: y + h() * 1.6, z: z + (h() - 0.5) * 0.6, vx: (h() - 0.5) * 1.2, vy: 0.8 + h() * 1.8, vz: (h() - 0.5) * 1.2, vie: 1 + h() * 0.8 });
    bilan.poussieres++;
  }
  let branche = false;
  function ecouter() {
    if (branche) return;
    branche = true;
    const R = Tanks.Evenements;
    R.ecouter("bouclier-alien", (d) => eclair(d.x, d.y, d.z, d.surcharge ? 1.6 : 1));
    R.ecouter("soldat-mort", (d) => d.equipeCible === "rouges" && eparpiller(d.x, d.y, d.z, 26));
    R.ecouter("rampant-abattu", (d) => eparpiller(d.x, d.y - 0.3, d.z, 10));
    R.ecouter("rampant-explose", (d) => eparpiller(d.x, d.y - 0.3, d.z, 14));
    R.ecouter("pylone-detruit", (d) => eparpiller(d.x, T.hauteur(d.x, d.z) + 8, d.z, 40));
  }

  // ------------------------------------------------------------------ chaque image
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), un = new THREE.Vector3(1, 1, 1), axeY = new THREE.Vector3(0, 1, 0);
  let horloge = 0;
  function maj(scene, monde, dt, cam) {
    if (!actif || !vaisseau) return;
    dt = dt || 0;
    horloge += dt;
    // les pylônes debout ou en moignon ; le dôme et le rayon ; le cœur qui palpite
    for (const P of pyl) (P.debout.visible = !P.p.detruit), (P.moignon.visible = P.p.detruit), (P.rayon.visible = !P.p.detruit);
    const V = AL.vaisseau;
    vaisseau.anneau.rotation.z += dt * 0.15;
    vaisseau.dome.visible = V.bouclier && !V.coeur.detruit;
    vaisseau.dome.material.opacity = 0.14 + 0.06 * Math.sin(horloge * 3);
    vaisseau.coeur.visible = vaisseau.faisceau.visible = !V.coeur.detruit;
    vaisseau.coeur.scale.setScalar(1 + 0.12 * Math.sin(horloge * 5) + (V.bouclier ? 0 : 0.2 * Math.sin(horloge * 13)));
    vaisseau.coeur.rotation.y += dt;
    vaisseau.faisceau.material.opacity = 0.16 + 0.08 * Math.sin(horloge * 2);
    // les rampants (vivants, et près de la caméra)
    let n = 0;
    for (const r of AL.rampants) {
      if (r.mort || n >= 16) continue;
      if (cam && Math.abs(r.x - cam.position.x) + Math.abs(r.z - cam.position.z) > 400) continue;
      q.setFromAxisAngle(axeY, -r.angle);
      rampants3d.setMatrixAt(n++, m4.compose(v.set(r.x, r.y + Math.abs(Math.sin(r.pas * 3)) * 0.08, r.z), q, un));
    }
    rampants3d.count = n;
    rampants3d.instanceMatrix.needsUpdate = true;
    bilan.rampantsVus = n;
    // les éclairs des boucliers
    for (const e of eclairs) if (e.vie > 0) {
      e.vie -= dt;
      e.m.scale.setScalar((1.1 + (0.25 - e.vie) * 2) * e.fort);
      e.m.material.opacity = Math.max(0, e.vie / 0.25) * 0.45;
      if (e.vie <= 0) e.m.visible = false;
    }
    // la poussière de lumière : elle monte, ralentit et s'éteint
    let k = 0;
    for (let i = grains.length - 1; i >= 0; i--) {
      const g = grains[i];
      g.vie -= dt;
      if (g.vie <= 0) { grains.splice(i, 1); continue; }
      g.x += g.vx * dt, g.y += g.vy * dt, g.z += g.vz * dt;
      g.vy *= 1 - dt * 0.6;
      const s = Math.min(1, g.vie) * 1.4;
      poussiere.setMatrixAt(k++, m4.compose(v.set(g.x, g.y, g.z), q.identity(), un.set(s, s, s)));
      un.set(1, 1, 1);
    }
    poussiere.count = k;
    poussiere.instanceMatrix.needsUpdate = true;
  }

  // ------------------------------------------------------------------ la grande image du sol : la biomasse
  function peindreSol(ctx, X, k, hz) {
    if (!actif) return;
    const Z = A.zone;
    for (let i = 0; i < 420; i++) {
      const a = hz() * Math.PI * 2, r = Math.pow(hz(), 0.7) * Z.rayon * 1.05, x = Z.x + Math.cos(a) * r, z = Z.z + Math.sin(a) * r, rr = (6 + hz() * 22) * k * (1.2 - r / Z.rayon * 0.6);
      const g = ctx.createRadialGradient(X(x), X(z), 0, X(x), X(z), rr);
      g.addColorStop(0, hz() < 0.3 ? "rgba(90,255,170,0.35)" : "rgba(110,50,150,0.55)");
      g.addColorStop(1, "rgba(60,20,90,0)");
      ctx.fillStyle = g;
      ctx.fillRect(X(x) - rr, X(z) - rr, rr * 2, rr * 2);
    }
    // des veines qui brillent, depuis le pied du rayon
    ctx.lineCap = "round";
    for (let n = 0; n < 40; n++) {
      let x = AL.vaisseau.x, z = AL.vaisseau.z, a = hz() * Math.PI * 2;
      ctx.strokeStyle = "rgba(120,255,190," + (0.25 + hz() * 0.25) + ")";
      ctx.lineWidth = Math.max(1, 0.6 * k);
      ctx.beginPath(), ctx.moveTo(X(x), X(z));
      for (let i = 0; i < 30; i++) (a += (hz() - 0.5) * 0.6), (x += Math.cos(a) * 9), (z += Math.sin(a) * 9), ctx.lineTo(X(x), X(z));
      ctx.stroke();
    }
  }
  return { actif, construire, maj, peindreSol, bilan };
})();
