// 🔧 LES BELLES ARMES : l'armurier (étape 140)
//
// ✍️ Iron Wolf Studio : « Fais de belles armes, comme tu m'as fait pour le jeu de tank. »
// Avant, chaque arme en main était 3 ou 4 boîtes. L'armurier fabrique maintenant chaque arme PIÈCE PAR PIÈCE, à sa vraie
// taille (en mètres), comme un vrai armurier : le canon, la culasse, la poignée, le pontet (l'anneau qui protège la
// détente), la détente, le chargeur, la crosse, le guidon et la hausse (pour viser), la lunette (avec son verre bleu)
// pour les fusils de précision, les 6 canons qui TOURNENT du minigun, le tube et la roquette du RPG, l'arc et sa corde
// qui se TEND, la garde et la poignée tressée du katana…
// Une « recette » par FORME (config.js : forme), avec des variantes selon l'arme (l'AK-47 a son bois et son chargeur
// courbe, le M4 son viseur point rouge, la Thompson son chargeur camembert…). La couleur et la taille viennent de la
// fiche de l'arme (config.js).
// Le point 0 de chaque arme, c'est LA MAIN DROITE (le creux de la poignée) ; x = vers l'avant, y = en haut, z = à droite.
// L'arme dit aussi où va L'AUTRE MAIN (« garde »), où sort la balle (« bouche ») et comment on la tient (« tenue »).
// Seule l'arme EN MAIN est fabriquée (la première fois qu'on la prend) : la ville reste fluide.

window.Circuit = window.Circuit || {};

Circuit.ArmesDetail3D = (function () {
  const bilan = { fabriquees: 0, pieces: 0, derniere: "—", piecesDerniere: 0 };
  // ---------------------------------------------------------------- les matières
  const cacheMat = {};
  function matiere(couleur, sorte) {
    const cle = couleur + ":" + sorte;
    if (cacheMat[cle]) return cacheMat[cle];
    const R = { metal: [0.6, 0.42], chrome: [0.7, 0.28], or: [0.75, 0.32], bois: [0, 0.62], plastique: [0.05, 0.55], caoutchouc: [0, 0.9], tissu: [0, 0.95], peint: [0.35, 0.45] }[sorte] || [0.2, 0.5];
    let m;
    if (sorte === "verre") m = new THREE.MeshPhysicalMaterial({ color: couleur, metalness: 0.2, roughness: 0.05, clearcoat: 1, emissive: couleur, emissiveIntensity: 0.25 });
    else if (sorte === "lumiere") m = new THREE.MeshBasicMaterial({ color: couleur });
    else m = new THREE.MeshStandardMaterial({ color: couleur, metalness: R[0], roughness: R[1] });
    return (cacheMat[cle] = m);
  }
  // (pas trop « miroir » : la ville n'a pas de reflets à montrer, un métal parfait paraîtrait noir)
  // les couleurs communes
  const NOIR = 0x1b1c1f, GRIS = 0x3a3d42, ACIER = 0xb8bec8, LAITON = 0xc9a03a, BOIS = 0x7a4420, BOIS_FONCE = 0x4a2812, CUIR = 0x3d2414, VERT = 0x4a5a34;

  // ---------------------------------------------------------------- les outils de l'armurier
  let G = null, compte = 0; // le groupe en cours de fabrication
  function ajoute(geo, m, x, y, z, rx, ry, rz) {
    const o = new THREE.Mesh(geo, m);
    o.position.set(x || 0, y || 0, z || 0);
    o.rotation.set(rx || 0, ry || 0, rz || 0);
    o.castShadow = true;
    G.add(o);
    compte++;
    return o;
  }
  const B = (lx, ly, lz, m, x, y, z, rx, ry, rz) => ajoute(new THREE.BoxGeometry(lx, ly, lz), m, x, y, z, rx, ry, rz);
  // un cylindre COUCHÉ le long de x (r1 = le rayon vers l'avant, r2 = vers l'arrière)
  const Cx = (r1, r2, l, m, x, y, z, seg) => ajoute(new THREE.CylinderGeometry(r1, r2, l, seg || 14), m, x, y, z, 0, 0, -Math.PI / 2);
  const Cy = (r1, r2, l, m, x, y, z, seg) => ajoute(new THREE.CylinderGeometry(r1, r2, l, seg || 12), m, x, y, z);
  const Cz = (r, l, m, x, y, z, seg) => ajoute(new THREE.CylinderGeometry(r, r, l, seg || 12), m, x, y, z, Math.PI / 2, 0, 0);
  const Bo = (r, m, x, y, z) => ajoute(new THREE.SphereGeometry(r, 12, 9), m, x, y, z);
  function galet(lx, ly, lz, m, x, y, z, rond, rx, ry, rz) {
    const g = new THREE.SphereGeometry(1, 12, 9), p = g.attributes.position, e = rond === undefined ? 0.35 : rond;
    const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
    for (let i = 0; i < p.count; i++) p.setXYZ(i, (f(p.getX(i)) * lx) / 2, (f(p.getY(i)) * ly) / 2, (f(p.getZ(i)) * lz) / 2);
    g.computeVertexNormals();
    return ajoute(g, m, x, y, z, rx, ry, rz);
  }
  // un PROFIL : un dessin à plat (x, y) qu'on « extrude » sur une épaisseur (comme un emporte-pièce dans la pâte),
  // avec des bords arrondis (le « biseau »)
  function profil(points, ep, m, biseau, x, y, z) {
    const f = new THREE.Shape(points.map(([a, b]) => new THREE.Vector2(a, b)));
    const bz = biseau === undefined ? Math.min(0.004, ep * 0.25) : biseau;
    const g = new THREE.ExtrudeGeometry(f, { depth: Math.max(0.001, ep - 2 * bz), bevelEnabled: bz > 0, bevelThickness: bz, bevelSize: bz, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, 0, -(ep - 2 * bz) / 2);
    g.computeVertexNormals();
    return ajoute(g, m, x, y, z);
  }
  // un TUYAU courbe (le tuyau du lance-flammes, la bande de balles)
  function tuyau(points, r, m, seg) {
    const courbe = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return ajoute(new THREE.TubeGeometry(courbe, seg || 24, r, 8, false), m);
  }
  // un ANNEAU autour de l'axe x (les bagues du mousquet, la poignée tressée)
  const Ax = (r, e, m, x, y, z) => ajoute(new THREE.TorusGeometry(r, e, 6, 16), m, x, y, z, 0, Math.PI / 2, 0);
  // une POIGNÉE de pistolet, penchée vers l'arrière (le centre de la main est au point 0)
  function poignee(m, haut, bas, epaisseur, pente) {
    const h = haut, b = bas, e = pente === undefined ? 0.022 : pente;
    return profil([[-0.018 + e, h], [0.022 + e, h], [0.018 - e, b], [-0.026 - e, b + 0.004]], epaisseur || 0.03, m, 0.005);
  }
  // le PONTET (l'anneau qui protège la détente) et la DÉTENTE
  function pontet(m, x, y, r) {
    const rr = r || 0.022;
    ajoute(new THREE.TorusGeometry(rr, 0.0035, 6, 14, Math.PI), m, x, y, 0, Math.PI, 0, 0);
    B(0.004, 0.018, 0.006, m, x - 0.004, y - 0.006, 0, 0, 0, 0.3);
  }
  // le GUIDON (devant) et la HAUSSE (derrière) : pour viser
  function mires(m, xa, xb, y) {
    B(0.005, 0.012, 0.005, m, xa, y + 0.006, 0);
    B(0.008, 0.01, 0.016, m, xb, y + 0.005, 0);
  }
  // une LUNETTE de visée : le tube, les deux cloches, les tourelles de réglage, le verre bleu, les colliers
  function lunette(x, y, longueur, r, m) {
    Cx(r, r, longueur, m, x, y, 0, 16);
    Cx(r * 1.45, r, longueur * 0.22, m, x + longueur * 0.5, y, 0, 16);
    Cx(r * 1.15, r * 1.35, longueur * 0.16, m, x - longueur * 0.5, y, 0, 16);
    Cx(r * 1.3, r * 1.3, 0.003, matiere(0x4a90ff, "verre"), x + longueur * 0.61, y, 0, 16);
    Cx(r * 1.05, r * 1.05, 0.003, matiere(0x4a90ff, "verre"), x - longueur * 0.585, y, 0, 16);
    Cy(r * 0.55, r * 0.55, r * 1.2, m, x + 0.01, y + r * 1.4, 0, 10);
    Cz(r * 0.55, r * 1.2, m, x + 0.01, y, r * 1.4, 10);
    for (const dx of [-longueur * 0.25, longueur * 0.25]) (B(0.02, r * 1.4, r * 1.6, m, x + dx, y - r * 0.9, 0), Ax(r * 1.08, 0.003, m, x + dx, y, 0));
  }
  // un CHARGEUR courbe (l'AK-47) : des morceaux qui tournent un peu chacun
  function chargeurCourbe(m, x, y, n, courbe, l, ep) {
    let a = 0, px = x, py = y;
    for (let i = 0; i < n; i++) {
      const o = B(0.036 + (ep || 0), l / n + 0.002, 0.024, m, px, py, 0, 0, 0, a);
      o.name = "chargeur";
      py -= Math.cos(a) * (l / n);
      px += Math.sin(a) * (l / n);
      a += courbe;
    }
  }
  // un BIPIED (2 pattes repliées sous le canon)
  function bipied(m, x, y) {
    for (const z of [-0.012, 0.012]) B(0.18, 0.008, 0.008, m, x - 0.08, y - 0.012, z, 0, 0, 0.05);
    B(0.02, 0.02, 0.03, m, x, y, 0);
  }

  // ---------------------------------------------------------------- les RECETTES (une par forme)
  // Chacune remplit le groupe G et renvoie { tenue, garde, bouche, … } (en mètres, la main droite au point 0).
  const v3 = (x, y, z) => new THREE.Vector3(x, y, z || 0);
  const RECETTES = {
    pistolet(f, c) {
      const m = matiere(f.couleur, f.id === "deagle" ? "or" : f.id === "starter" ? "peint" : "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal");
      const L = f.id === "deagle" ? 0.25 : 0.19, X0 = -0.045;
      // la culasse (avec ses stries pour l'attraper) et la carcasse
      profil([[X0, 0.03], [X0 + L - 0.01, 0.03], [X0 + L, 0.022], [X0 + L, 0.0], [X0, 0.0]], 0.028, m, 0.003, 0, 0.012, 0);
      for (let i = 0; i < 6; i++) B(0.003, 0.022, 0.03, acier, X0 + 0.012 + i * 0.007, 0.028, 0);
      B(L * 0.85, 0.016, 0.024, f.id === "deagle" ? m : noir, X0 + L * 0.47, 0.004, 0);
      B(0.04, 0.008, 0.03, noir, X0 + L * 0.7, -0.003, 0); // le rail sous le canon
      Cx(0.007, 0.007, 0.01, acier, X0 + L + 0.003, 0.03, 0); // la bouche du canon
      B(0.03, 0.012, 0.03, acier, X0 + L * 0.52, 0.031, 0.006); // la fenêtre d'éjection
      mires(noir, X0 + L - 0.012, X0 + 0.008, 0.042);
      poignee(f.id === "starter" ? m : noir, 0.01, -0.085, 0.031);
      for (const z of [-0.0165, 0.0165]) galet(0.035, 0.06, 0.004, matiere(f.id === "deagle" ? BOIS : 0x26272a, f.id === "deagle" ? "bois" : "caoutchouc"), -0.004, -0.035, z, 0.4);
      pontet(noir, 0.03, -0.006);
      B(0.012, 0.012, 0.012, acier, X0 - 0.003, 0.03, 0); // le chien (derrière)
      const ch = B(0.036, f.id === "auto" ? 0.05 : 0.014, 0.026, noir, -0.012, f.id === "auto" ? -0.1 : -0.087, 0); // le bas du chargeur (long sur l'automatique)
      ch.name = "chargeur";
      return { tenue: "pistolet", garde: v3(-0.005, -0.02, -0.035), bouche: v3(X0 + L + 0.01, 0.03, 0) };
    },
    revolver(f) {
      const m = matiere(f.couleur, "chrome"), noir = matiere(NOIR, "metal");
      Cx(0.009, 0.009, 0.17, m, 0.12, 0.028, 0); // le canon
      B(0.17, 0.008, 0.008, m, 0.12, 0.04, 0); // la bande de visée sur le canon
      B(0.15, 0.012, 0.012, m, 0.115, 0.014, 0); // le logement de la baguette d'éjection
      profil([[-0.04, 0.045], [0.05, 0.045], [0.05, -0.005], [0.01, -0.012], [-0.04, 0.0]], 0.024, m, 0.003); // la carcasse
      Cx(0.022, 0.022, 0.042, m, 0.018, 0.02, 0, 18); // le BARILLET (6 coups)
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; Cx(0.004, 0.004, 0.044, noir, 0.018, 0.02 + Math.cos(a) * 0.022, Math.sin(a) * 0.022, 6); }
      profil([[-0.035, 0.0], [-0.015, 0.0], [-0.005, -0.09], [-0.045, -0.095], [-0.05, -0.05]], 0.03, matiere(BOIS, "bois"), 0.006); // la crosse en bois
      B(0.016, 0.02, 0.01, m, -0.045, 0.05, 0, 0, 0, -0.6); // le chien (on l'arme avec le pouce)
      pontet(m, 0.012, -0.01);
      mires(m, 0.2, -0.035, 0.044);
      return { tenue: "pistolet", garde: v3(-0.01, -0.03, -0.035), bouche: v3(0.21, 0.028, 0), eclair: 1.3 };
    },
    silex(f) {
      const bois = matiere(f.couleur, "bois"), fer = matiere(GRIS, "metal"), laiton = matiere(LAITON, "or");
      Cx(0.011, 0.012, 0.26, fer, 0.12, 0.03, 0, 8); // le long canon à 8 pans
      Ax(0.013, 0.003, laiton, 0.245, 0.03, 0);
      profil([[0.2, 0.024], [0.2, 0.012], [0.0, 0.0], [-0.02, -0.05], [-0.035, -0.095], [-0.075, -0.085], [-0.06, -0.03], [-0.04, 0.024]], 0.032, bois, 0.006); // le fût et la crosse (« tête d'oiseau »)
      Bo(0.022, laiton, -0.06, -0.09, 0); // le pommeau en laiton
      B(0.06, 0.025, 0.006, fer, -0.01, 0.02, 0.018); // la platine
      profil([[0, 0], [0.006, 0.03], [0.02, 0.035], [0.012, 0.022], [0.012, 0.0]], 0.006, fer, 0.0015, -0.04, 0.03, 0.02); // le chien (avec sa pierre à silex)
      B(0.008, 0.008, 0.008, matiere(0x8a8070, "plastique"), -0.026, 0.067, 0.02);
      B(0.006, 0.03, 0.01, fer, 0.0, 0.05, 0.02, 0, 0, 0.2); // la batterie
      Cx(0.003, 0.003, 0.2, matiere(BOIS_FONCE, "bois"), 0.11, 0.008, 0, 6); // la baguette (pour bourrer la poudre)
      pontet(laiton, 0.0, -0.012);
      return { tenue: "pistolet", garde: v3(-0.02, -0.03, -0.035), bouche: v3(0.25, 0.03, 0), eclair: 1.5 };
    },
    mitraillette(f) {
      const m = matiere(f.couleur, f.id === "thompson" ? "bois" : "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal");
      if (f.id === "p90") { // la P90 : un corps tout arrondi, le chargeur transparent couché sur le dessus
        galet(0.42, 0.09, 0.05, m, 0.06, 0.0, 0, 0.45);
        galet(0.3, 0.025, 0.046, matiere(0x8aa0a8, "verre"), 0.08, 0.052, 0, 0.3);
        Cx(0.009, 0.009, 0.05, acier, 0.29, 0.012, 0);
        profil([[0.06, -0.03], [0.1, -0.03], [0.1, -0.08], [0.06, -0.08]], 0.03, noir, 0.008); // la boucle du pouce devant
        galet(0.05, 0.03, 0.03, noir, 0.15, 0.075, 0, 0.4); // le viseur
        poignee(noir, 0.0, -0.08, 0.03);
        return { tenue: "fusil", garde: v3(0.09, -0.05, -0.02), bouche: v3(0.32, 0.012, 0) };
      }
      profil([[-0.06, 0.03], [0.2, 0.03], [0.2, -0.015], [-0.06, -0.015]], 0.04, f.id === "thompson" ? acier : m, 0.004, 0, 0.01, 0); // le boîtier
      Cx(0.01, 0.01, f.id === "thompson" ? 0.2 : 0.12, acier, f.id === "thompson" ? 0.3 : 0.26, 0.022, 0); // le canon
      poignee(f.id === "thompson" ? matiere(BOIS, "bois") : noir, 0.0, -0.09, 0.032);
      pontet(noir, 0.035, -0.01);
      mires(acier, 0.19, -0.05, 0.04);
      B(0.02, 0.012, 0.012, acier, 0.1, 0.044, -0.02); // le levier d'armement
      if (f.id === "thompson") { // la Thompson de 1920 : le chargeur camembert, les ailettes du canon, la crosse et la poignée en bois
        Cz(0.06, 0.03, noir, 0.1, -0.06, 0, 20);
        Cz(0.015, 0.033, acier, 0.1, -0.06, 0, 8);
        for (let i = 0; i < 6; i++) Ax(0.014, 0.003, acier, 0.24 + i * 0.012, 0.022, 0);
        profil([[-0.06, 0.02], [-0.32, 0.0], [-0.33, -0.07], [-0.08, -0.03]], 0.035, m, 0.006);
        profil([[0.17, -0.015], [0.2, -0.015], [0.205, -0.08], [0.175, -0.08]], 0.03, m, 0.008);
        Cx(0.018, 0.018, 0.02, acier, 0.4, 0.022, 0); // le compensateur
        return { tenue: "fusil", garde: v3(0.19, -0.05, -0.02), bouche: v3(0.41, 0.022, 0), eclair: 1.2 };
      }
      if (f.id === "uzi") { // l'Uzi : tout carré, le chargeur DANS la poignée, la crosse pliée
        B(0.012, 0.15, 0.024, noir, -0.002, -0.085, 0).name = "chargeur";
        B(0.18, 0.012, 0.012, acier, -0.1, 0.0, 0.026);
        return { tenue: "pistolet", garde: v3(0.05, -0.03, -0.03), bouche: v3(0.32, 0.022, 0) };
      }
      // le MP5 : le chargeur courbe devant la poignée, le garde-main, la crosse rétractable
      chargeurCourbe(noir, 0.085, -0.03, 5, 0.06, 0.14);
      galet(0.12, 0.05, 0.05, noir, 0.24, 0.012, 0, 0.3);
      for (const z of [-0.014, 0.014]) B(0.16, 0.01, 0.006, acier, -0.14, 0.012, z);
      B(0.012, 0.06, 0.04, noir, -0.22, -0.005, 0);
      return { tenue: "fusil", garde: v3(0.22, -0.02, -0.02), bouche: v3(0.33, 0.022, 0) };
    },
    fusil(f) {
      const m = matiere(f.couleur, f.id === "ak47" ? "bois" : "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal");
      const bullpup = f.id === "famas";
      if (bullpup) { // le FAMAS (« le clairon ») : le chargeur derrière la poignée, la grande poignée de transport dessus
        galet(0.62, 0.075, 0.05, m, 0.0, 0.01, 0, 0.3);
        profil([[-0.1, 0.05], [-0.06, 0.12], [0.24, 0.12], [0.28, 0.05], [0.25, 0.05], [0.22, 0.1], [-0.05, 0.1], [-0.07, 0.05]], 0.016, m, 0.003); // la poignée de transport
        B(0.035, 0.12, 0.022, noir, -0.12, -0.08, 0).name = "chargeur";
        Cx(0.009, 0.009, 0.16, acier, 0.38, 0.015, 0);
        for (const z of [-0.03, 0.03]) B(0.12, 0.012, 0.004, noir, 0.37, 0.015, z, 0, z * 3, 0); // le bipied replié
        poignee(noir, 0.0, -0.08, 0.03);
        pontet(noir, 0.035, -0.02, 0.026);
        B(0.04, 0.05, 0.004, noir, -0.3, 0.0, 0.024); // la plaque de joue
        return { tenue: "fusil", garde: v3(0.17, -0.02, -0.02), bouche: v3(0.46, 0.015, 0) };
      }
      // le boîtier (la culasse), la poignée, le pontet
      profil([[-0.08, 0.035], [0.25, 0.035], [0.25, -0.02], [0.15, -0.03], [0.1, -0.03], [-0.08, -0.01]], 0.045, f.id === "ak47" ? acier : m, 0.005);
      poignee(f.id === "ak47" ? matiere(BOIS_FONCE, "bois") : noir, -0.01, -0.1, 0.032);
      pontet(acier, 0.05, -0.03);
      if (f.id === "ak47") { // l'AK-47 : la crosse et le garde-main en BOIS, le tube des gaz, le chargeur COURBE
        profil([[-0.08, 0.03], [-0.38, -0.01], [-0.4, -0.1], [-0.36, -0.1], [-0.08, -0.02]], 0.04, m, 0.008);
        galet(0.2, 0.05, 0.05, m, 0.36, 0.005, 0, 0.3);
        Cx(0.012, 0.012, 0.22, m, 0.37, 0.05, 0); // le tube des gaz (en haut)
        Cx(0.008, 0.008, 0.26, acier, 0.52, 0.005, 0); // le canon
        Cx(0.012, 0.012, 0.035, acier, 0.66, 0.005, 0); // le frein de bouche
        B(0.008, 0.04, 0.008, acier, 0.6, 0.03, 0); // le guidon
        B(0.06, 0.012, 0.03, acier, 0.18, 0.045, 0); // la hausse
        B(0.05, 0.012, 0.01, acier, 0.12, 0.04, 0.025); // le levier d'armement (à droite)
        chargeurCourbe(matiere(0x8a3a10, "peint"), 0.12, -0.04, 6, 0.09, 0.2, 0.004);
        return { tenue: "fusil", garde: v3(0.32, -0.02, -0.02), bouche: v3(0.68, 0.005, 0) };
      }
      // le M4 / le SCAR / le G36 : la crosse réglable, le garde-main à rails, le viseur point rouge, la poignée avant
      Cx(0.016, 0.016, 0.16, noir, -0.15, 0.015, 0); // le tube de crosse
      profil([[-0.17, 0.035], [-0.33, 0.035], [-0.34, -0.06], [-0.3, -0.07], [-0.17, -0.01]], 0.04, f.id === "scar" ? m : noir, 0.006);
      galet(0.26, 0.06, 0.06, f.id === "scar" ? m : noir, 0.38, 0.008, 0, 0.3); // le garde-main
      B(0.58, 0.012, 0.024, noir, 0.2, 0.045, 0); // le rail du dessus
      for (const z of [-0.032, 0.032]) B(0.24, 0.012, 0.008, noir, 0.38, 0.008, z);
      Cx(0.009, 0.009, 0.14, acier, 0.56, 0.008, 0); // le canon
      Cx(0.014, 0.014, 0.05, noir, 0.64, 0.008, 0); // le cache-flamme
      B(0.012, 0.045, 0.012, noir, 0.48, 0.065, 0); // le guidon
      if (f.id === "g36") { // le G36 : la poignée de transport avec sa petite lunette
        profil([[-0.02, 0.05], [0.0, 0.11], [0.24, 0.11], [0.26, 0.05]], 0.03, m, 0.004);
        Cx(0.016, 0.016, 0.1, noir, 0.12, 0.09, 0);
      } else if (f.id === "scar") lunette(0.12, 0.085, 0.16, 0.017, matiere(NOIR, "metal"));
      else { // le viseur point rouge
        Cx(0.022, 0.022, 0.09, noir, 0.12, 0.085, 0, 16);
        Cx(0.019, 0.019, 0.004, matiere(0xff4040, "verre"), 0.166, 0.085, 0, 16);
        B(0.03, 0.03, 0.02, noir, 0.12, 0.06, 0);
      }
      const ch = B(0.036, 0.16, 0.024, noir, 0.13, -0.1, 0, 0, 0, 0.12); // le chargeur (presque droit)
      ch.name = "chargeur";
      galet(0.04, 0.07, 0.03, noir, 0.34, -0.05, 0, 0.4); // la poignée avant
      return { tenue: "fusil", garde: v3(0.34, -0.06, 0), bouche: v3(0.67, 0.008, 0) };
    },
    pompe(f) {
      const m = matiere(f.couleur, f.id === "doubleCanon" ? "bois" : "metal"), acier = matiere(GRIS, "metal"), bois = matiere(BOIS, "bois"), noir = matiere(NOIR, "plastique");
      if (f.id === "doubleCanon") { // le fusil à double canon : 2 canons côte à côte, tout en bois et en acier, 2 chiens
        for (const z of [-0.012, 0.012]) Cx(0.012, 0.012, 0.6, acier, 0.38, 0.03, z);
        profil([[0.05, 0.02], [0.4, 0.02], [0.4, -0.005], [0.05, -0.01]], 0.045, m, 0.006);
        profil([[-0.03, 0.04], [0.08, 0.04], [0.08, 0.0], [-0.03, -0.01]], 0.045, acier, 0.004);
        profil([[-0.03, 0.03], [-0.38, 0.0], [-0.4, -0.11], [-0.36, -0.11], [-0.03, -0.04]], 0.042, m, 0.008);
        for (const z of [-0.012, 0.012]) B(0.014, 0.02, 0.008, acier, -0.02, 0.05, z, 0, 0, -0.5);
        pontet(acier, 0.03, -0.012);
        return { tenue: "fusil", garde: v3(0.24, -0.02, -0.02), bouche: v3(0.68, 0.03, 0), eclair: 1.5 };
      }
      Cx(0.012, 0.012, 0.52, acier, 0.33, 0.03, 0); // le canon
      Cx(0.011, 0.011, 0.42, acier, 0.28, 0.005, 0); // le tube magasin (dessous)
      const pompe = galet(0.15, 0.04, 0.045, f.id === "aa12" ? noir : bois, 0.3, 0.005, 0, 0.35); // la POMPE (on la tire pour recharger)
      pompe.name = "pompe";
      for (let i = 0; i < 6; i++) Ax(0.021, 0.003, f.id === "aa12" ? noir : matiere(BOIS_FONCE, "bois"), 0.24 + i * 0.022, 0.005, 0);
      profil([[-0.06, 0.045], [0.08, 0.045], [0.08, -0.01], [-0.06, -0.02]], 0.045, m, 0.005); // le boîtier
      B(0.05, 0.015, 0.004, acier, 0.02, 0.025, 0.024); // la fenêtre d'éjection
      Bo(0.007, matiere(0xff7020, "peint"), 0.58, 0.046, 0); // le guidon (une perle)
      if (f.id === "aa12") { // le fusil automatique : le gros tambour sous le boîtier
        Cz(0.065, 0.06, noir, 0.04, -0.07, 0, 20);
        profil([[-0.06, 0.035], [-0.3, 0.03], [-0.3, -0.06], [-0.06, -0.01]], 0.04, noir, 0.006);
        poignee(noir, -0.0, -0.09, 0.032);
        return { tenue: "fusil", garde: v3(0.3, -0.03, -0.02), bouche: v3(0.6, 0.03, 0), eclair: 1.4 };
      }
      profil([[-0.06, 0.03], [-0.38, -0.01], [-0.4, -0.11], [-0.36, -0.11], [-0.06, -0.03]], 0.042, bois, 0.008); // la crosse
      B(0.012, 0.11, 0.045, matiere(0x202020, "caoutchouc"), -0.4, -0.06, 0, 0, 0, 0.15); // la plaque de couche en caoutchouc
      pontet(acier, 0.03, -0.022);
      return { tenue: "fusil", garde: v3(0.3, -0.03, -0.02), bouche: v3(0.6, 0.03, 0), eclair: 1.4 };
    },
    precision(f) {
      const m = matiere(f.couleur, f.id === "chasse" || f.id === "dragunov" ? "bois" : "metal"), noir = matiere(NOIR, "metal"), acier = matiere(GRIS, "metal");
      const long = f.id === "barrett" ? 0.62 : 0.55;
      profil([[-0.08, 0.035], [0.2, 0.035], [0.2, -0.015], [-0.08, -0.015]], 0.04, f.id === "chasse" ? acier : f.id === "barrett" ? m : noir, 0.004); // le boîtier
      Cx(f.id === "barrett" ? 0.014 : 0.01, 0.012, long, acier, 0.2 + long / 2, 0.02, 0); // le long canon
      if (f.id === "barrett") { // le Barrett .50 : l'énorme frein de bouche, le gros chargeur, le bipied
        B(0.07, 0.04, 0.05, noir, 0.2 + long + 0.03, 0.02, 0);
        for (const z of [-0.026, 0.026]) B(0.016, 0.026, 0.004, acier, 0.2 + long + 0.03, 0.02, z);
        B(0.05, 0.1, 0.03, noir, 0.1, -0.06, 0).name = "chargeur";
        galet(0.32, 0.07, 0.05, m, 0.32, 0.01, 0, 0.3);
        profil([[-0.08, 0.03], [-0.36, 0.03], [-0.38, -0.08], [-0.33, -0.09], [-0.08, -0.02]], 0.04, m, 0.006);
      } else if (f.id === "dragunov") { // le Dragunov : la crosse squelette (avec le trou du pouce), le garde-main en bois
        profil([[-0.08, 0.03], [-0.36, 0.02], [-0.38, -0.09], [-0.33, -0.1], [-0.2, -0.04], [-0.12, -0.06], [-0.08, -0.02]], 0.035, m, 0.006);
        galet(0.26, 0.05, 0.05, m, 0.32, 0.015, 0, 0.3);
        chargeurCourbe(noir, 0.1, -0.02, 4, 0.05, 0.1);
        Cx(0.014, 0.014, 0.05, acier, 0.2 + long + 0.02, 0.02, 0);
      } else { // la carabine de chasse / le L115 : la crosse avec l'appui-joue, le levier de culasse à boule
        profil([[-0.08, 0.03], [0.32, 0.025], [0.32, -0.02], [0.1, -0.04], [0.02, -0.03], [-0.38, -0.02], [-0.4, -0.1], [-0.36, -0.1], [-0.1, -0.05]], 0.042, m, 0.008);
        galet(0.16, 0.03, 0.035, m, -0.26, 0.04, 0, 0.4); // l'appui-joue
        B(0.032, 0.05, 0.026, noir, 0.08, -0.05, 0).name = "chargeur";
        if (f.id === "l115") Cx(0.02, 0.02, 0.1, noir, 0.2 + long, 0.02, 0, 14); // le silencieux
      }
      // le levier de la culasse, avec sa boule
      B(0.008, 0.008, 0.045, acier, -0.03, 0.03, 0.03);
      Bo(0.01, acier, -0.03, 0.03, 0.055);
      poignee(f.id === "chasse" ? m : noir, 0.0, -0.08, 0.032);
      pontet(acier, 0.035, -0.012);
      lunette(0.06, 0.085, f.id === "barrett" ? 0.3 : 0.26, f.id === "barrett" ? 0.02 : 0.017, noir);
      bipied(noir, 0.2 + long * 0.55, 0.0);
      return { tenue: "fusil", garde: v3(0.28, -0.03, -0.02), bouche: v3(0.2 + long + 0.05, 0.02, 0), eclair: 1.4 };
    },
    mitrailleuse(f) {
      const m = matiere(f.couleur, "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal"), laiton = matiere(LAITON, "or");
      profil([[-0.1, 0.05], [0.28, 0.05], [0.28, -0.025], [-0.1, -0.025]], 0.06, m, 0.005); // le boîtier
      B(0.25, 0.018, 0.064, m, 0.1, 0.06, 0); // le couvercle (on y met la bande)
      Cx(0.012, 0.012, 0.42, acier, 0.48, 0.02, 0); // le canon
      galet(0.22, 0.05, 0.05, noir, 0.38, 0.02, 0, 0.3); // le garde-main
      for (let i = 0; i < 8; i++) Cz(0.006, 0.054, matiere(NOIR, "metal"), 0.31 + i * 0.019, 0.02, 0, 6); // les trous de refroidissement
      Cx(0.018, 0.018, 0.04, acier, 0.71, 0.02, 0); // le cache-flamme
      profil([[0.05, 0.075], [0.08, 0.13], [0.2, 0.13], [0.22, 0.075], [0.2, 0.075], [0.19, 0.115], [0.09, 0.115], [0.07, 0.075]], 0.015, acier, 0.003); // la poignée de transport
      profil([[-0.1, 0.04], [-0.38, 0.03], [-0.4, -0.08], [-0.35, -0.09], [-0.1, -0.01]], 0.045, f.id === "m60" ? matiere(0x4a4a30, "plastique") : noir, 0.006);
      poignee(noir, 0.0, -0.09, 0.032);
      pontet(acier, 0.035, -0.022);
      // la boîte de balles (à gauche) et la BANDE : des cartouches en laiton qui entrent dans la mitrailleuse
      galet(0.12, 0.12, 0.08, matiere(f.id === "m60" ? VERT : 0x5a5a48, "tissu"), 0.12, -0.08, -0.07, 0.3);
      for (let i = 0; i < 9; i++) { const a = i / 8; const o = Cy(0.004, 0.004, 0.035, laiton, 0.13 + Math.sin(a * 2) * 0.02, -0.02 + a * 0.06, -0.075 + a * 0.06, 6); o.rotation.x = Math.PI / 2; }
      bipied(acier, 0.55, 0.0);
      mires(acier, 0.66, -0.06, 0.05);
      return { tenue: "fusil", garde: v3(0.36, -0.03, -0.02), bouche: v3(0.73, 0.02, 0), eclair: 1.4 };
    },
    minigun(f) {
      const m = matiere(f.couleur, "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(ACIER, "chrome");
      // le bloc des 6 CANONS, qui TOURNE (un groupe à part, pour pouvoir le faire tourner)
      const garde = G, tourne = new THREE.Group();
      tourne.position.set(0.12, 0.06, 0);
      G.add(tourne);
      G = tourne;
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; Cx(0.009, 0.009, 0.62, acier, 0.32, Math.cos(a) * 0.028, Math.sin(a) * 0.028, 8); }
      for (const x of [0.15, 0.45, 0.62]) Cx(0.042, 0.042, 0.018, noir, x, 0, 0, 16); // les colliers qui tiennent les canons
      Cx(0.012, 0.012, 0.64, noir, 0.32, 0, 0, 8); // l'axe
      G = garde;
      Cx(0.055, 0.055, 0.16, m, 0.04, 0.06, 0, 16); // le moteur électrique
      galet(0.12, 0.12, 0.1, m, -0.08, 0.05, 0, 0.3); // le boîtier
      profil([[-0.17, 0.12], [-0.17, 0.16], [0.05, 0.16], [0.05, 0.12], [0.03, 0.12], [0.03, 0.145], [-0.15, 0.145], [-0.15, 0.12]], 0.02, noir, 0.004); // la poignée du dessus
      poignee(noir, 0.0, -0.08, 0.034, 0.005); // la poignée arrière (avec la détente)
      // la goulotte : les balles arrivent de la boîte, à gauche, par un tuyau souple
      tuyau([[-0.05, 0.02, -0.06], [-0.05, -0.08, -0.12], [-0.12, -0.22, -0.18]], 0.022, matiere(0x2a2a20, "tissu"), 16);
      galet(0.18, 0.14, 0.1, matiere(VERT, "peint"), -0.15, -0.28, -0.2, 0.3); // la boîte de balles (à la ceinture)
      return { tenue: "hanche", garde: v3(-0.06, 0.15, 0), bouche: v3(0.66, 0.06, 0), tourne, eclair: 1.6 };
    },
    lanceFlammes(f) {
      const m = matiere(f.couleur, "peint"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal"), laiton = matiere(LAITON, "or");
      Cx(0.018, 0.022, 0.5, acier, 0.26, 0.04, 0); // la lance
      Cx(0.03, 0.022, 0.06, noir, 0.53, 0.04, 0); // la buse
      Cy(0.006, 0.006, 0.03, laiton, 0.52, 0.065, 0); // la veilleuse (la petite flamme toujours allumée)
      Bo(0.01, matiere(0x60a0ff, "lumiere"), 0.52, 0.085, 0);
      galet(0.06, 0.06, 0.05, m, 0.32, -0.005, 0, 0.4); // la poignée avant
      profil([[0.27, 0.0], [0.31, 0.0], [0.31, -0.08], [0.27, -0.08]], 0.03, noir, 0.008); // (le manche avant)
      poignee(noir, 0.04, -0.08, 0.032);
      pontet(acier, 0.035, 0.0);
      // le TUYAU vers les 2 bouteilles dans le dos
      tuyau([[0.02, 0.0, 0.0], [-0.1, -0.12, -0.04], [-0.25, -0.1, -0.12], [-0.36, 0.05, -0.18]], 0.012, matiere(0x202020, "caoutchouc"), 24);
      return { tenue: "hanche", garde: v3(0.29, -0.04, 0), bouche: v3(0.57, 0.04, 0), sac: "bouteilles", couleurSac: f.couleur };
    },
    tube(f) {
      const m = matiere(f.couleur, f.id === "rpg" ? "bois" : "peint"), noir = matiere(NOIR, "metal"), vert = matiere(VERT, "peint");
      if (f.id === "rpg") { // le RPG-7 : le tube, le pare-chaleur en bois, la ROQUETTE qui dépasse devant, l'évasement arrière
        Cx(0.025, 0.025, 0.95, matiere(GRIS, "metal"), 0.12, 0.1, 0);
        Cx(0.032, 0.032, 0.26, m, 0.08, 0.1, 0);
        Cx(0.05, 0.026, 0.15, matiere(GRIS, "metal"), -0.42, 0.1, 0); // l'évasement
        const roq = new THREE.Group(); // la roquette (cachée juste après le tir, le temps de recharger)
        const garde = G;
        G.add(roq);
        G = roq;
        Cx(0.012, 0.045, 0.14, vert, 0.72, 0.1, 0, 16);
        Cx(0.045, 0.045, 0.06, vert, 0.62, 0.1, 0, 16);
        Cx(0.03, 0.025, 0.04, vert, 0.575, 0.1, 0, 16);
        Cx(0.006, 0.012, 0.03, matiere(LAITON, "or"), 0.805, 0.1, 0, 8);
        G = garde;
        poignee(noir, 0.05, -0.04, 0.03);
        profil([[0.18, 0.08], [0.21, 0.08], [0.21, 0.0], [0.18, 0.0]], 0.026, noir, 0.006); // la 2e poignée
        B(0.05, 0.04, 0.02, noir, 0.15, 0.15, -0.035); // la lunette (sur le côté)
        Cx(0.012, 0.012, 0.06, noir, 0.15, 0.16, -0.035);
        return { tenue: "epaule", garde: v3(0.2, 0.02, 0), bouche: v3(0.83, 0.1, 0), roquette: roq, eclair: 2 };
      }
      // le BAZOOKA : un long tube, l'anneau devant, l'évasement derrière, l'épaulière, les 2 poignées, le viseur
      Cx(0.045, 0.045, 1.25, m, 0.12, 0.1, 0, 18);
      Cx(0.055, 0.055, 0.05, vert, 0.72, 0.1, 0, 18);
      Cx(0.048, 0.06, 0.1, vert, -0.5, 0.1, 0, 18);
      for (const x of [-0.25, 0.3]) Ax(0.047, 0.004, noir, x, 0.1, 0);
      galet(0.12, 0.05, 0.03, matiere(BOIS, "bois"), -0.12, 0.05, 0, 0.4); // l'épaulière
      poignee(noir, 0.055, -0.04, 0.03);
      profil([[0.2, 0.055], [0.23, 0.055], [0.23, -0.02], [0.2, -0.02]], 0.026, noir, 0.006);
      B(0.04, 0.05, 0.004, noir, 0.15, 0.16, -0.05); // le viseur (sur le côté)
      B(0.006, 0.03, 0.006, noir, 0.6, 0.16, -0.05);
      return { tenue: "epaule", garde: v3(0.215, 0.0, 0), bouche: v3(0.75, 0.1, 0), eclair: 2 };
    },
    lanceGrenades(f) {
      const m = matiere(f.couleur, f.id === "m79" ? "bois" : "metal"), noir = matiere(NOIR, "plastique"), acier = matiere(GRIS, "metal");
      if (f.id === "lanceMulti") { // le lance-grenades à barillet : un gros barillet à 6 coups, la crosse pliante
        Cx(0.07, 0.07, 0.16, m, 0.1, 0.0, 0, 18);
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; Cx(0.02, 0.02, 0.165, noir, 0.1, Math.cos(a) * 0.045, Math.sin(a) * 0.045, 10); }
        Cx(0.024, 0.024, 0.22, acier, 0.28, 0.035, 0, 14);
        B(0.4, 0.015, 0.02, noir, 0.12, 0.09, 0);
        profil([[-0.02, 0.05], [-0.3, 0.04], [-0.3, -0.04], [-0.02, -0.02]], 0.03, noir, 0.005);
        poignee(noir, -0.0, -0.08, 0.032);
        galet(0.04, 0.08, 0.03, noir, 0.26, -0.04, 0, 0.4);
        return { tenue: "fusil", garde: v3(0.26, -0.06, 0), bouche: v3(0.39, 0.035, 0), eclair: 1.5 };
      }
      // le M79 : le canon court et gros (il « casse » en deux pour recharger), la hausse à lamelle, la crosse en bois
      Cx(0.024, 0.026, 0.34, acier, 0.22, 0.03, 0, 16);
      Cx(0.028, 0.028, 0.004, matiere(0x111111, "plastique"), 0.39, 0.03, 0, 16);
      profil([[0.05, 0.02], [0.3, 0.012], [0.3, -0.01], [0.05, -0.015]], 0.045, m, 0.006);
      profil([[-0.03, 0.03], [0.06, 0.03], [0.06, -0.015], [-0.03, -0.015]], 0.04, acier, 0.004);
      B(0.012, 0.05, 0.03, acier, 0.03, 0.07, 0); // la hausse
      profil([[-0.03, 0.025], [-0.35, 0.0], [-0.37, -0.1], [-0.33, -0.1], [-0.03, -0.03]], 0.042, m, 0.008);
      B(0.012, 0.11, 0.045, matiere(0x202020, "caoutchouc"), -0.36, -0.05, 0);
      pontet(acier, 0.02, -0.018);
      return { tenue: "fusil", garde: v3(0.2, -0.03, -0.02), bouche: v3(0.4, 0.03, 0), eclair: 1.5 };
    },
    arc(f) {
      const poulies = f.id === "arcPoulies", long = f.id === "arcLong";
      const m = matiere(f.couleur, poulies ? "metal" : "bois"), corde = matiere(0xeeeeee, "tissu");
      const H = long ? 0.85 : 0.62, prof = long ? -0.1 : -0.13; // (les branches se courbent vers l'archer : la corde est DERRIÈRE la poignée)
      // les 2 BRANCHES (courbes) et la poignée au milieu (là où tient la main gauche)
      for (const s of [1, -1]) {
        const pts = long ? [[0, 0.06 * s, 0], [prof * 0.6, H * 0.5 * s, 0], [prof * 0.25, H * s, 0]] : [[0, 0.06 * s, 0], [prof, H * 0.45 * s, 0], [prof * 0.4, H * 0.85 * s, 0], [prof * 0.65, H * s, 0]];
        tuyau(pts, poulies ? 0.012 : 0.01, m, 20);
        if (poulies) Cz(0.03, 0.012, matiere(NOIR, "metal"), pts[pts.length - 1][0], pts[pts.length - 1][1], 0, 16); // les poulies
      }
      galet(0.035, 0.13, 0.03, matiere(CUIR, "tissu"), 0, 0, 0, 0.5); // la poignée gainée de cuir
      if (poulies) { // le viseur à broches et le stabilisateur
        B(0.06, 0.05, 0.006, matiere(NOIR, "metal"), 0.05, 0.1, -0.02);
        for (let i = 0; i < 3; i++) Bo(0.004, matiere([0xff3030, 0x30ff30, 0xffff30][i], "lumiere"), 0.075, 0.085 + i * 0.012, -0.02);
        Cx(0.01, 0.01, 0.25, matiere(NOIR, "metal"), 0.14, -0.04, 0);
      }
      // LA CORDE : 2 morceaux (du haut au point d'encoche, du point d'encoche au bas) ; elle se TEND quand on tire
      const haut = v3(long ? prof * 0.25 : prof * 0.65, H - 0.01), bas = v3(haut.x, -haut.y);
      const brins = [Cy(0.0018, 0.0018, 1, corde, 0, 0, 0, 4), Cy(0.0018, 0.0018, 1, corde, 0, 0, 0, 4)];
      // la FLÈCHE encochée sur la corde
      const fleche = new THREE.Group(), garde = G;
      G.add(fleche);
      G = fleche;
      Cx(0.004, 0.004, 0.7, matiere(BOIS, "bois"), 0.35, 0, 0, 6);
      ajoute(new THREE.ConeGeometry(0.009, 0.04, 6), matiere(ACIER, "chrome"), 0.72, 0, 0, 0, 0, -Math.PI / 2);
      for (const a of [0, 2.1, 4.2]) B(0.07, 0.016, 0.002, matiere(0xff3030, "tissu"), 0.04, Math.cos(a) * 0.01, Math.sin(a) * 0.01, a, 0, 0);
      G = garde;
      const allonge = long ? 0.6 : 0.5, repos = haut.x;
      const _a = new THREE.Vector3(), _b = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
      function tendre(t) { // t = 0 (corde au repos) → 1 (tirée jusqu'à la joue)
        const n = v3(repos - allonge * t * 0.92, 0);
        for (const [brin, bout] of [[brins[0], haut], [brins[1], bas]]) {
          _a.copy(bout).sub(n);
          brin.scale.set(1, _a.length(), 1);
          brin.position.copy(_b.copy(bout).add(n).multiplyScalar(0.5));
          brin.quaternion.setFromUnitVectors(Y, _a.normalize());
        }
        fleche.position.x = n.x;
        fleche.visible = t > 0.05;
      }
      tendre(0);
      return { tenue: "arc", garde: v3(repos, 0), allonge, corde: tendre, bouche: v3(0.75, 0) };
    },
    arbalete(f) {
      const m = matiere(f.couleur, f.id === "arbalete" ? "bois" : "metal"), acier = matiere(GRIS, "metal"), corde = matiere(0xdddddd, "tissu");
      profil([[-0.38, 0.02], [0.4, 0.02], [0.4, -0.01], [0.05, -0.02], [0.02, -0.04], [-0.33, -0.08], [-0.38, -0.08]], 0.04, m, 0.006); // le fût (la crosse)
      B(0.4, 0.008, 0.012, acier, 0.18, 0.026, 0); // le rail où glisse le carreau
      // l'ARC couché devant (en acier), et la corde tendue jusqu'à la noix
      for (const s of [1, -1]) tuyau([[0.4, 0.02, 0], [0.37, 0.02, 0.15 * s], [0.3, 0.02, 0.3 * s]], 0.008, acier, 12);
      for (const s of [1, -1]) { const o = Cz(0.0015, 0.32, corde, 0.165, 0.028, 0.15 * s, 4); o.rotation.set(Math.PI / 2, 0.55 * s, 0); }
      B(0.02, 0.016, 0.02, acier, 0.03, 0.03, 0); // la noix (elle retient la corde)
      ajoute(new THREE.TorusGeometry(0.035, 0.005, 6, 12), acier, 0.43, -0.0, 0, 0, Math.PI / 2, 0); // l'étrier (on met le pied dedans pour tendre)
      Cx(0.004, 0.004, 0.36, matiere(0x3a2a1a, "bois"), 0.21, 0.036, 0, 6); // le carreau
      ajoute(new THREE.ConeGeometry(0.008, 0.035, 6), matiere(ACIER, "chrome"), 0.4, 0.036, 0, 0, 0, -Math.PI / 2);
      if (f.id === "arbaleteLourde") lunette(0.0, 0.07, 0.18, 0.015, matiere(NOIR, "metal"));
      B(0.006, 0.03, 0.008, acier, 0.0, -0.035, 0, 0, 0, 0.3); // la détente
      return { tenue: "fusil", garde: v3(0.22, -0.02, -0.02), bouche: v3(0.42, 0.036, 0) };
    },
    mousquet(f) {
      const bois = matiere(f.couleur, "bois"), fer = matiere(GRIS, "metal"), laiton = matiere(LAITON, "or");
      Cx(0.011, 0.013, 1.0, fer, 0.42, 0.03, 0, 10); // le très long canon
      profil([[0.85, 0.028], [0.85, 0.01], [0.05, -0.0], [0.0, -0.02], [-0.36, -0.04], [-0.42, -0.13], [-0.38, -0.14], [-0.05, -0.05], [-0.05, 0.02]], 0.04, bois, 0.008); // le fût, jusqu'au bout du canon
      for (const x of [0.25, 0.5, 0.75]) Ax(0.02, 0.004, laiton, x, 0.02, 0); // les bagues en laiton
      B(0.012, 0.11, 0.045, laiton, -0.42, -0.085, 0, 0, 0, 0.3); // la plaque de couche
      B(0.1, 0.03, 0.006, fer, 0.0, 0.02, 0.022); // la platine
      if (f.id === "arquebuse") B(0.06, 0.006, 0.006, matiere(0x8a6a40, "tissu"), -0.02, 0.07, 0.026, 0, 0, 0.6); // la mèche (le « serpentin »)
      else profil([[0, 0], [0.008, 0.035], [0.024, 0.04], [0.015, 0.025], [0.015, 0]], 0.007, fer, 0.0015, -0.04, 0.03, 0.024); // le chien à silex
      Cx(0.003, 0.003, 0.8, matiere(BOIS_FONCE, "bois"), 0.42, 0.005, 0, 6); // la baguette
      pontet(laiton, 0.0, -0.01);
      B(0.005, 0.012, 0.005, laiton, 0.9, 0.048, 0); // le guidon
      return { tenue: "fusil", garde: v3(0.32, -0.02, -0.02), bouche: v3(0.92, 0.03, 0), eclair: 1.8 };
    },
    tromblon(f) {
      const laiton = matiere(f.couleur, "or"), bois = matiere(BOIS, "bois"), fer = matiere(GRIS, "metal");
      Cx(0.045, 0.014, 0.5, laiton, 0.3, 0.035, 0, 18); // le canon EN TROMPETTE (il s'évase vers l'avant)
      Ax(0.045, 0.006, laiton, 0.55, 0.035, 0);
      profil([[0.25, 0.025], [0.25, 0.005], [0.0, -0.01], [-0.32, -0.04], [-0.36, -0.13], [-0.32, -0.14], [-0.05, -0.05], [-0.05, 0.02]], 0.04, bois, 0.008);
      B(0.09, 0.028, 0.006, fer, 0.0, 0.02, 0.022);
      profil([[0, 0], [0.008, 0.035], [0.024, 0.04], [0.015, 0.025], [0.015, 0]], 0.007, fer, 0.0015, -0.04, 0.03, 0.024);
      pontet(laiton, 0.0, -0.01);
      return { tenue: "fusil", garde: v3(0.2, -0.02, -0.02), bouche: v3(0.56, 0.035, 0), eclair: 2.2 };
    },
    lame(f) {
      const id = f.id, long = Math.max(0.2, (f.taille || 1) * 0.78), acier = matiere(f.couleur, "chrome"), or = matiere(LAITON, "or"), noir = matiere(NOIR, "plastique");
      const katana = id === "katana", couteau = id === "couteau", machette = id === "machette";
      const manche = katana ? 0.27 : couteau ? 0.11 : 0.15, depart = 0.05;
      // LA LAME : un profil pointu (plus large au talon), fine sur les bords (le biseau) ; le katana est un peu courbé
      const larg = machette ? 0.05 : katana ? 0.03 : couteau ? 0.025 : 0.04;
      const pts = katana
        ? [[0, -larg / 2], [long * 0.92, -larg / 2 + 0.03], [long, 0.035], [long * 0.93, larg / 2 + 0.03], [0, larg / 2]]
        : machette ? [[0, -larg / 2], [long * 0.8, -larg / 2 - 0.01], [long, larg * 0.1], [long * 0.9, larg / 2 + 0.004], [0, larg / 2]]
          : [[0, -larg / 2], [long * 0.85, -larg / 2 + 0.004], [long, 0], [long * 0.85, larg / 2 - 0.004], [0, larg / 2]];
      profil(pts.map(([a, b]) => [a + depart, b]), 0.006, acier, 0.0025);
      if (!katana && !couteau && !machette) B(long * 0.75, 0.006, 0.007, matiere(0x9aa0aa, "chrome"), depart + long * 0.4, 0, 0); // la gorge au milieu de la lame
      // LA GARDE : une croix dorée (l'épée), une « tsuba » ronde (le katana), un petit arrêt (le couteau)
      if (katana) (Cx(0.04, 0.04, 0.008, matiere(0x2a2a2a, "metal"), depart - 0.004, 0, 0, 20), Cx(0.016, 0.016, 0.03, or, depart + 0.012, 0, 0, 8));
      else if (couteau || machette) B(0.012, 0.045, 0.024, noir, depart - 0.004, 0, 0);
      else (B(0.022, 0.22, 0.026, or, depart - 0.006, 0, 0), Bo(0.016, or, depart - 0.006, 0.11, 0), Bo(0.016, or, depart - 0.006, -0.11, 0));
      // LA POIGNÉE : tressée (des anneaux de couleur alternée) et son pommeau
      const cuir = matiere(katana ? 0x15151a : couteau || machette ? 0x222222 : CUIR, "tissu");
      Cx(0.016, 0.016, manche, katana ? matiere(0xeeeeee, "tissu") : cuir, depart - 0.01 - manche / 2, 0, 0, 10);
      const n = Math.round(manche / 0.022);
      for (let i = 0; i < n; i++) ajoute(new THREE.TorusGeometry(0.017, 0.005, 4, 10), cuir, depart - 0.02 - i * (manche / n), 0, 0, 0, Math.PI / 2, katana ? (i % 2 ? 0.5 : -0.5) : 0);
      if (katana) Cx(0.019, 0.019, 0.02, matiere(0x2a2a2a, "metal"), depart - 0.01 - manche, 0, 0, 10);
      else Bo(couteau || machette ? 0.018 : 0.026, couteau || machette ? noir : or, depart - 0.015 - manche, 0, 0);
      // (le point 0 = la main : au milieu de la poignée, près de la garde)
      return { tenue: "melee", decale: -(depart - 0.01 - manche * 0.3) };
    },
    hache(f) {
      const m = matiere(f.couleur, "metal"), bois = matiere(BOIS, "bois"), fil = matiere(0xe8ecf0, "chrome");
      Cx(0.017, 0.02, 0.72, bois, 0.28, 0, 0, 10); // le manche
      profil([[0.0, 0.02], [0.06, 0.04], [0.11, 0.13], [0.15, 0.13], [0.14, -0.08], [0.1, -0.08], [0.06, -0.03], [0.0, -0.02]], 0.02, m, 0.005, 0.52, 0.0, 0); // le fer (avec sa « barbe »)
      profil([[0.135, 0.13], [0.152, 0.135], [0.145, -0.085], [0.13, -0.08]], 0.008, fil, 0.002, 0.52, 0.0, 0); // le tranchant (brillant)
      galet(0.06, 0.05, 0.04, m, 0.53, 0.0, 0, 0.35); // l'œil (là où passe le manche)
      for (let i = 0; i < 4; i++) Ax(0.021, 0.004, matiere(CUIR, "tissu"), -0.02 + i * 0.025, 0, 0);
      return { tenue: "melee", decale: 0.04 };
    },
    marteau(f) {
      const m = matiere(f.couleur, "metal"), bois = matiere(BOIS, "bois");
      Cx(0.017, 0.02, 0.7, bois, 0.28, 0, 0, 10);
      galet(0.07, 0.09, 0.08, m, 0.6, 0, 0, 0.25); // la tête
      B(0.06, 0.08, 0.07, m, 0.6, 0.06, 0); // la face qui frappe (en haut)
      ajoute(new THREE.ConeGeometry(0.025, 0.11, 8), m, 0.6, -0.1, 0, Math.PI, 0, 0); // la pointe (en bas)
      for (const z of [-0.021, 0.021]) B(0.16, 0.012, 0.004, m, 0.5, 0, z); // les languettes de fer
      for (let i = 0; i < 4; i++) Ax(0.021, 0.004, matiere(CUIR, "tissu"), -0.02 + i * 0.025, 0, 0);
      return { tenue: "melee", decale: 0.04 };
    },
    lance(f) {
      const m = matiere(f.couleur, "chrome"), bois = matiere(BOIS, "bois");
      Cx(0.016, 0.018, 1.7, bois, 0.55, 0, 0, 10); // la hampe
      profil([[0, -0.012], [0.12, -0.04], [0.26, 0], [0.12, 0.04], [0, 0.012]], 0.012, m, 0.004, 1.4, 0, 0); // la pointe en feuille
      Cx(0.022, 0.018, 0.08, matiere(GRIS, "metal"), 1.38, 0, 0, 10); // la douille
      ajoute(new THREE.ConeGeometry(0.035, 0.1, 10), matiere(0xc02020, "tissu"), 1.32, -0.04, 0, Math.PI, 0, 0); // le pompon rouge
      Cx(0.02, 0.02, 0.04, matiere(GRIS, "metal"), -0.3, 0, 0, 10); // le talon
      return { tenue: "melee", decale: 0.2, estoc: true };
    },
    masse(f) {
      const m = matiere(f.couleur, "metal"), acier = matiere(ACIER, "chrome");
      Cx(0.018, 0.02, 0.6, matiere(GRIS, "metal"), 0.25, 0, 0, 10);
      Bo(0.075, m, 0.6, 0, 0);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ajoute(new THREE.ConeGeometry(0.022, 0.07, 6), acier, 0.6 + Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0, 0, 0, a - Math.PI / 2); }
      for (const z of [-1, 1]) ajoute(new THREE.ConeGeometry(0.022, 0.07, 6), acier, 0.6, 0, z * 0.08, z * Math.PI / 2, 0, 0);
      ajoute(new THREE.ConeGeometry(0.02, 0.08, 6), acier, 0.7, 0, 0, 0, 0, -Math.PI / 2);
      for (let i = 0; i < 5; i++) Ax(0.022, 0.005, matiere(CUIR, "tissu"), -0.02 + i * 0.024, 0, 0);
      Bo(0.028, m, -0.07, 0, 0);
      return { tenue: "melee", decale: 0.04 };
    },
    batte(f) {
      const pts = [[0.0, 0.0], [0.03, 0.0], [0.032, 0.012], [0.02, 0.025], [0.016, 0.3], [0.025, 0.45], [0.034, 0.62], [0.035, 0.8], [0.025, 0.83], [0.0, 0.835]];
      const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 16);
      ajoute(g, matiere(f.couleur, "bois"), -0.06, 0, 0, 0, 0, -Math.PI / 2); // tournée sur un tour à bois
      for (let i = 0; i < 6; i++) Ax(0.018, 0.003, matiere(0x202020, "caoutchouc"), -0.03 + i * 0.022, 0, 0); // le grip
      return { tenue: "melee", decale: 0.02 };
    },
    nunchaku(f) {
      const m = matiere(f.couleur, "bois"), acier = matiere(ACIER, "chrome");
      Cx(0.016, 0.016, 0.3, m, 0.1, 0, 0, 8);
      for (let i = 0; i < 5; i++) ajoute(new THREE.TorusGeometry(0.008, 0.0025, 4, 8), acier, 0.26 + i * 0.014, 0, 0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2, 0);
      const tourne = new THREE.Group(), garde = G;
      tourne.position.set(0.33, 0, 0);
      G.add(tourne);
      G = tourne;
      Cy(0.016, 0.016, 0.3, m, 0, -0.15, 0, 8); // le 2e bâton (il pend)
      G = garde;
      return { tenue: "melee", tourne, decale: 0.06 };
    },
    grenade(f) {
      const m = matiere(f.couleur, "peint"), acier = matiere(GRIS, "metal"), anneau = matiere(ACIER, "chrome");
      if (f.effet === "explosion") { // la grenade « ananas » : un corps à carreaux, le bouchon, la cuillère, la goupille
        const corps = new THREE.SphereGeometry(0.032, 16, 12), p = corps.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(z, x); const k = 1 + 0.08 * Math.max(Math.abs(Math.sin(a * 4)), Math.abs(Math.sin(y * 110))) ** 6; p.setXYZ(i, x * k, y * k * 1.15, z * k); }
        corps.computeVertexNormals();
        ajoute(corps, m, 0.0, 0, 0);
      } else (Cy(0.025, 0.025, 0.1, m, 0, 0, 0, 16), Cy(0.026, 0.026, 0.02, matiere(f.effet === "flash" ? 0x303030 : 0x20a040, "peint"), 0, 0.02, 0, 16)); // fumigène / flash : une boîte en métal (bande de couleur)
      Cy(0.012, 0.014, 0.025, acier, 0, 0.048, 0, 10);
      B(0.008, 0.065, 0.016, acier, -0.022, 0.025, 0, 0, 0, 0.12); // la cuillère
      ajoute(new THREE.TorusGeometry(0.012, 0.0022, 6, 14), anneau, 0.016, 0.055, 0.012, 0, 0.6, 0); // l'anneau de la goupille
      return { tenue: "lancer" };
    },
    dynamite(f) {
      const m = matiere(f.couleur, "peint"), noir = matiere(NOIR, "tissu");
      for (const [y, z] of [[0, -0.022], [0, 0.022], [0.036, 0]]) Cx(0.02, 0.02, 0.2, m, 0.02, y, z, 12); // 3 bâtons
      for (const x of [-0.04, 0.08]) B(0.016, 0.07, 0.09, noir, x, 0.016, 0); // le ruban adhésif
      tuyau([[0.12, 0.036, 0], [0.16, 0.06, 0.02], [0.18, 0.09, -0.01], [0.21, 0.1, 0.0]], 0.0025, matiere(0x302010, "tissu"), 12); // la mèche
      return { tenue: "poser" };
    },
    c4(f) {
      const m = matiere(f.couleur, "plastique"), noir = matiere(NOIR, "plastique");
      galet(0.16, 0.05, 0.1, m, 0.04, 0, 0, 0.2); // le pain d'explosif
      for (const x of [-0.01, 0.09]) B(0.012, 0.054, 0.104, matiere(0x404040, "tissu"), x, 0, 0);
      B(0.05, 0.022, 0.035, noir, 0.04, 0.035, 0); // le détonateur
      Bo(0.006, matiere(0x22ff66, "lumiere"), 0.055, 0.05, 0.008); // sa diode verte
      for (const [c, z] of [[0xff2020, -0.01], [0x2050ff, 0.01]]) tuyau([[0.02, 0.04, z], [-0.02, 0.06, z], [-0.04, 0.03, z * 2]], 0.002, matiere(c, "plastique"), 8);
      return { tenue: "poser" };
    },
    mine(f) {
      const m = matiere(f.couleur, "peint"), noir = matiere(NOIR, "plastique");
      Cy(0.11, 0.12, 0.05, m, 0.08, 0, 0, 24);
      Cy(0.05, 0.05, 0.012, noir, 0.08, 0.03, 0, 18); // la plaque qui s'enfonce
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; B(0.008, 0.04, 0.03, m, 0.08 + Math.cos(a) * 0.115, 0, Math.sin(a) * 0.115, 0, -a, 0); } // les nervures
      Bo(0.01, matiere(0xff2020, "lumiere"), 0.08, 0.04, 0);
      return { tenue: "poser" };
    },
    boomerang(f) {
      const forme = [[0, 0], [0.12, 0.2], [0.17, 0.2], [0.07, 0.0], [0.17, -0.2], [0.12, -0.2]];
      const o = profil(forme, 0.012, matiere(f.couleur, "bois"), 0.004);
      o.rotation.x = Math.PI / 2; // couché à plat
      for (const s of [1, -1]) { const b = B(0.05, 0.004, 0.015, matiere(0xffffff, "peint"), 0.12, 0.009, -0.14 * s * 0.0, 0, 0, 0); b.position.set(0.13, 0.008, 0.14 * s); b.rotation.y = 1.05 * s; }
      return { tenue: "lancer", decale: -0.1 };
    },
  };
  // (les sacs dans le dos : les 2 bouteilles du lance-flammes)
  function sac(sorte, couleur) {
    const g = new THREE.Group(), garde = G;
    G = g;
    for (const z of [-0.07, 0.07]) (Cy(0.07, 0.07, 0.42, matiere(couleur, "peint"), 0, 0, z, 16), Bo(0.07, matiere(couleur, "peint"), 0, 0.21, z), Cy(0.015, 0.015, 0.05, matiere(LAITON, "or"), 0, 0.3, z, 8));
    B(0.03, 0.3, 0.3, matiere(NOIR, "metal"), 0.07, 0, 0); // le cadre
    G = garde;
    return g;
  }

  // Fabrique la belle arme d'une fiche (une seule fois par arme).
  function fabriquer(f) {
    const objet = new THREE.Group();
    G = new THREE.Group();
    compte = 0;
    objet.add(G);
    const recette = RECETTES[f.forme] || RECETTES.pistolet;
    const infos = recette(f) || {};
    G = objet.children[0];
    if (infos.decale) G.position.x = infos.decale; // (la main au bon endroit sur le manche)
    if (infos.garde && infos.decale) infos.garde.x += infos.decale;
    if (infos.bouche && infos.decale) infos.bouche.x += infos.decale;
    objet.userData = Object.assign(infos, { echelle: f.forme === "lame" ? 1 : f.taille || 1, id: f.id, pieces: compte });
    if (infos.sac) objet.userData.sacObjet = sac(infos.sac, infos.couleurSac);
    bilan.fabriquees++;
    bilan.pieces += compte;
    bilan.derniere = f.nom;
    bilan.piecesDerniere = compte;
    return objet;
  }

  // L'arme dans la main du personnage (fabriquée la 1re fois) ; les autres sont cachées.
  function enMain(P3, f) {
    if (!P3.armes[f.id]) P3.armes[f.id] = fabriquer(f);
    const objet = P3.armes[f.id];
    for (const [id, o] of Object.entries(P3.armes)) o.visible = id === f.id;
    // le sac dans le dos (les bouteilles du lance-flammes), accroché à l'os du dos
    const s = objet.userData.sacObjet || null;
    if (P3.sac !== s) {
      if (P3.sac) P3.sac.visible = false;
      if (s && s.parent !== P3.r.dos) (P3.r.dos.add(s), s.position.set(-0.25, 0.25, 0));
      if (s) s.visible = true;
      P3.sac = s;
    }
    // la roquette du RPG disparaît pendant 1 s après le tir (le temps d'en remettre une)
    if (objet.userData.roquette) objet.userData.roquette.visible = Circuit.monde ? Circuit.monde.temps - (Circuit.monde.coup || -9) > 1 : true;
    return objet;
  }
  function rangerTout(P3) {
    for (const o of Object.values(P3.armes)) o.visible = false;
    if (P3.sac) (P3.sac.visible = false), (P3.sac = null);
  }

  return { fabriquer, enMain, rangerTout, bilan, RECETTES };
})();
