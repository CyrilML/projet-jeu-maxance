// 🚁 LES HÉLICOS DE TRANSPORT EN 3D : le hangar du pont aérien (étapes 73 et 74)
//
// ✍️ « Un Chinook (le gros, à 2 rotors, rampe à l'arrière) et un Black Hawk (1 rotor, portes sur les côtés). »
// ✍️ Étape 74 : « Elles ne sont pas belles : de vraies formes arrondies, plus de détails. » Alors on les a refaits comme
// un POTIER (affichage/outils3d.js, « coque ») au lieu d'un maçon : le fuselage n'est plus fait de boîtes, mais de
// tranches qui glissent en douceur de l'une à l'autre, avec des normales lissées (la lumière glisse sur la tôle). Les
// VITRES sont découpées dans la coque elle-même (elles suivent sa courbe) et reflètent le ciel. La peinture olive mate a
// de légères variations, des lignes de tôle et des rivets (une image dessinée au démarrage), et le ventre est plus sale.
//   - le CHINOOK (CH-47) : le long fuselage aux coins arrondis, le nez vitré (pare-brise, vitres de côté, du dessus et
//     du bas), les HUBLOTS ronds, les longs réservoirs de côté, la tour avant et la haute tour arrière (le « pylône »)
//     avec ses 2 MOTEURS (entrée d'air, tuyère), le tunnel sur le dos, le train (4 roues devant, 2 derrière, avec leurs
//     jambes), les antennes, et DEUX rotors à 3 pales (qui PLIENT un peu sous leur poids) qui tournent en sens inverse.
//     La RAMPE arrière (avec son plancher antidérapant et ses charnières) s'ouvre sur la soute (on voit l'intérieur, les
//     bancs rouges). Un mitrailleur dans la porte avant droite, un autre à la fenêtre avant gauche, avec leurs M240 ;
//   - le BLACK HAWK (UH-60) : le cockpit « anguleux mais lisse » avec ses grands pare-brise, les coupe-câbles sur le nez,
//     le capot des moteurs sur le dos avec les 2 moteurs et leurs échappements tournés vers l'extérieur, la longue
//     poutre de queue, la dérive avec le rotor de queue PENCHÉ (sur le côté droit), le stabilisateur, le train (2 roues
//     et la roulette de queue), les PORTES coulissantes ouvertes (on voit les soldats assis au bord, les jambes dans le
//     vide), les bras des cordes au-dessus des portes, les 2 mitrailleurs aux fenêtres juste derrière les pilotes.
// Les pilotes, les mitrailleurs et les passagers sont de vrais soldats (affichage/engins3d.js, « figurine ») posés une
// fois pour toutes. Quand le rotor tourne vite, un léger DISQUE flou apparaît (comme sur une photo).
// Pendant la descente à la corde, les 2 CORDES pendent jusqu'au sol ; quand une mitrailleuse tire, une petite flamme.
// Comme les autres engins (étape 70) : les pièces sont SOUDÉES par matière (une poignée de dessins pour tout l'hélico),
// un modèle par sorte et par équipe, puis des COPIES. Et de loin : une version SIMPLE en instances (la même coque, en
// beaucoup moins de points : 1 dessin pour tous ceux d'une sorte et d'une équipe).
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Helicos3D = (function () {
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const MT = () => Tanks.Chars3D.materiaux();
  const OU = () => Tanks.Engins3D.outils;
  const SORTES = ["chinook", "blackhawk"];
  const sait = (sorte) => SORTES.includes(sorte);
  const K = () => Tanks.CONFIG.helicosTransport;
  // les couleurs : vert olive pour les Bleus, sable pour les Rouges (les vrais hélicos ne sont pas camouflés à taches)
  const PEINTURE = { bleus: 0x4c5438, rouges: 0x93805a };
  // (livre n° 28) un pack de véhicules de la boutique (« bleus~packDesert ») : la 1re couleur de son camouflage
  const peintureDe = (e) => (PEINTURE[e] !== undefined ? PEINTURE[e] : new THREE.Color(Tanks.CONFIG.equipes[e] ? Tanks.CONFIG.equipes[e].camouflage[0] : "#4c5438").getHex());
  const COUL = { pale: 0x2a2d30, bout: 0xd8b020, sombre: 0x141516, interieur: 0x2b2d27, pneu: 0x161616, jante: 0x5a5e58, banc: 0x7a2e22, metal: 0x50545a, plancher: 0x30322e };
  let matCorde = null, matFlamme = null, matPeinture = null, matVerre = null, matFlou = null;
  const bruit = Tanks.Bruit.creer(74);

  // ------------------------------------------------------------------ les matières
  // La PEINTURE : une image de tôle (des panneaux, des rivets, de la poussière), grise ; la couleur de l'équipe est dans
  // les sommets (comme ça, une seule matière pour les deux équipes).
  function peinture() {
    if (matPeinture) return matPeinture;
    const c = document.createElement("canvas"), T = 512;
    c.width = c.height = T;
    const ctx = c.getContext("2d");
    let etat = 7401;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    ctx.fillStyle = "#d4d4d4";
    ctx.fillRect(0, 0, T, T);
    for (let i = 0; i < 260; i++) { // de grandes taches très douces (la peinture n'est pas partout pareille)
      const x = h() * T, y = h() * T, r = 20 + h() * 70, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const v = h() < 0.5 ? "255,255,255," : "0,0,0,";
      g.addColorStop(0, "rgba(" + v + (0.03 + h() * 0.04) + ")");
      g.addColorStop(1, "rgba(" + v + "0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 70; i++) { // des coulures de saleté (vers le bas de l'image : v croît vers le haut de la coque)
      const x = h() * T, y = h() * T, l = 30 + h() * 120;
      const g = ctx.createLinearGradient(x, y, x, y + l);
      g.addColorStop(0, "rgba(40,35,25,0.1)");
      g.addColorStop(1, "rgba(40,35,25,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 2 + h() * 5, l);
    }
    // les lignes de tôle : une case = 1 m de long (64 px) et 0,75 m de haut ; les rivets le long des lignes
    ctx.strokeStyle = "rgba(20,20,20,0.42)";
    ctx.lineWidth = 1.4;
    for (let x = 0; x <= T; x += 64) (ctx.beginPath(), ctx.moveTo(x + 0.5, 0), ctx.lineTo(x + 0.5, T), ctx.stroke());
    for (let y = 0; y <= T; y += 48) (ctx.beginPath(), ctx.moveTo(0, y + 0.5), ctx.lineTo(T, y + 0.5), ctx.stroke());
    ctx.fillStyle = "rgba(25,25,25,0.38)";
    for (let x = 0; x < T; x += 64) for (let y = 3; y < T; y += 6) ctx.fillRect(x + 3, y, 1.4, 1.4);
    for (let y = 0; y < T; y += 48) for (let x = 3; x < T; x += 6) ctx.fillRect(x, y + 3, 1.4, 1.4);
    for (let i = 0; i < 26; i++) { // des trappes de visite
      const x = Math.floor(h() * 8) * 64 + 10, y = Math.floor(h() * 10) * 48 + 8, w = 16 + h() * 30, hh = 12 + h() * 20;
      ctx.strokeStyle = "rgba(20,20,20,0.35)";
      ctx.strokeRect(x + 0.5, y + 0.5, w, hh);
    }
    for (let i = 0; i < 9000; i++) { // le grain de la peinture mate
      ctx.fillStyle = "rgba(" + (h() < 0.5 ? "0,0,0," : "255,255,255,") + h() * 0.05 + ")";
      ctx.fillRect(h() * T, h() * T, 1, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(1 / 8, 1 / 8); // (la coque est mesurée en mètres : une image tous les 8 m)
    matPeinture = new THREE.MeshStandardMaterial({ vertexColors: true, map: t, roughness: 0.82, metalness: 0.08 });
    return matPeinture;
  }
  // La VITRE : sombre, lisse, elle reflète le ciel ; on voit un peu à travers (les pilotes).
  function verre() {
    return matVerre || (matVerre = new THREE.MeshPhysicalMaterial({ color: 0x1c2a33, roughness: 0.04, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.62, depthWrite: false, envMapIntensity: 1.6 }));
  }

  // La couleur de la peinture en chaque point : la couleur de l'équipe, un peu plus claire ou plus foncée par endroits,
  // le ventre plus sale.
  function couleurPeinture(P) {
    const base = new THREE.Color(P);
    return (p, n) => {
      const v = 1 + 0.06 * bruit(p.x * 0.45 + 3, p.y * 0.6 + p.z * 0.45) + 0.03 * bruit(p.x * 2.1, p.z * 2.3 + p.y);
      const ventre = n.y < -0.35 ? 0.84 + 0.1 * (1 + n.y) : 1;
      return [base.r * v * ventre, base.g * v * ventre, base.b * v * ventre];
    };
  }
  function repeindre(geo, couleur) {
    const c = new THREE.Color(couleur), a = geo.attributes.color;
    for (let i = 0; i < a.count; i++) a.setXYZ(i, c.r, c.g, c.b);
  }
  // Ajouter les morceaux d'une coque au groupe : la peinture, les vitres, l'intérieur sombre…
  function poserCoque(g, res, options) {
    const o = options || {};
    for (const nom in res.geos) {
      const geo = res.geos[nom];
      if (nom === "verre") {
        g.add(O.piece(geo, verre()));
        continue;
      }
      if (nom !== "peinture" && nom !== "coque") repeindre(geo, o[nom] !== undefined ? o[nom] : nom === "interieur" ? COUL.interieur : COUL.sombre);
      g.add(O.piece(geo, peinture()));
    }
    return res;
  }
  // Une pièce peinte simple (une boîte, un cylindre…), avec la couleur de l'équipe : dans la matière « peinture ».
  const peint = (geo, x, y, z, couleur) => O.piece(geo, peinture(), x, y, z, couleur);

  // ------------------------------------------------------------------ les pièces communes
  // Une ROUE d'avion : le pneu tout rond (un « tour »), la jante, le moyeu. Couchée sur l'axe z.
  function roue(g, x, r, z, larg) {
    const m = MT(), w = larg / 2, ri = r * 0.55;
    const pneu = O.tour([[ri, -w * 0.8], [r * 0.86, -w], [r * 0.97, -w * 0.82], [r, -w * 0.4], [r, w * 0.4], [r * 0.97, w * 0.82], [r * 0.86, w], [ri, w * 0.8]], m.teinte, 24, COUL.pneu);
    g.add(O.couche(pneu, "z", x, r, z));
    g.add(O.couche(O.tour([[0.001, -w * 0.82], [ri * 1.02, -w * 0.82], [ri * 1.02, w * 0.82], [0.001, w * 0.82]], m.teinte, 18, COUL.jante), "z", x, r, z));
    g.add(O.couche(O.cylindre(r * 0.18, r * 0.18, larg + 0.04, m.teinte, 10, CT.acier), "z", x, r, z));
  }
  // Une PALE de rotor : un vrai profil d'aile (épais devant, fin derrière), qui PLIE vers le bas sous son poids
  // (« fleche » m au bout), avec le bout peint en jaune. Couchée le long de x, de r0 à r.
  function pale(r0, r, corde, epaisseur, fleche, nu) {
    const geo = O.surface(nu || 26, 14, (u, v) => {
      const x = r0 + (r - r0) * u, th = v * Math.PI * 2, xc = 0.5 * (1 + Math.cos(th));
      const t = 5 * epaisseur * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1015 * xc ** 4);
      const bout = u > 0.97 ? (1 - u) / 0.03 : 1, c = corde * (u > 0.97 ? 0.6 + 0.4 * bout : 1);
      const y = Math.sign(Math.sin(th)) * t * c * (u > 0.995 ? 0 : 1) - fleche * u * u;
      return [x, y, (xc - 0.3) * c];
    }, true);
    const n = geo.attributes.position.count, col = new Float32Array(n * 3), a = new THREE.Color(COUL.pale), b = new THREE.Color(COUL.bout);
    for (let i = 0; i < n; i++) {
      const u = (geo.attributes.position.getX(i) - r0) / (r - r0), c = u > 0.955 && u < 0.985 ? b : a;
      (col[i * 3] = c.r), (col[i * 3 + 1] = c.g), (col[i * 3 + 2] = c.b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }
  // Un ROTOR : la tête (le moyeu, les plateaux, les biellettes), n pales, et le disque flou (caché à l'arrêt).
  function rotor(nom, x, y, n, r, corde, decalage, fleche) {
    const m = MT(), g = new THREE.Group();
    g.name = nom;
    g.position.set(x, y, 0);
    g.add(O.tour([[0.0, -0.12], [0.36, -0.12], [0.42, 0.0], [0.36, 0.14], [0.2, 0.24], [0.0, 0.26]], m.teinte, 18, CT.noir)); // le moyeu
    g.add(O.cylindre(0.5, 0.5, 0.05, m.teinte, 18, COUL.metal).translateY(-0.25)); // le plateau
    g.add(O.cylindre(0.12, 0.12, 0.3, m.teinte, 10, CT.acier).translateY(0.35));
    for (let k = 0; k < n; k++) {
      const a = (k * Math.PI * 2) / n + (decalage || 0), c = Math.cos(a), s = -Math.sin(a);
      const p = O.piece(pale(0.55, r, corde, 0.12, fleche, 30), m.teinte);
      p.rotation.y = a;
      p.position.y = 0.02;
      g.add(p);
      const attache = O.piece(OU().galet(0.9, 0.2, 0.26, 0.35, 10), m.teinte, c * 0.62, 0.02, s * 0.62, CT.acier); // l'attache de la pale
      attache.rotation.y = a;
      g.add(attache);
      g.add(O.tube([c * 0.45, -0.24, s * 0.45], [c * 0.55, -0.02, s * 0.55], 0.03, m.teinte, 6, CT.acier)); // la biellette
    }
    O.souder(g);
    // le disque flou (comme sur une photo, quand le rotor tourne vite)
    if (!matFlou) {
      const c = document.createElement("canvas"), T = 256;
      c.width = c.height = T;
      const ctx = c.getContext("2d"), gr = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
      gr.addColorStop(0, "rgba(40,42,44,0.0)");
      gr.addColorStop(0.15, "rgba(40,42,44,0.35)");
      gr.addColorStop(0.9, "rgba(40,42,44,0.22)");
      gr.addColorStop(0.955, "rgba(216,176,32,0.35)");
      gr.addColorStop(0.985, "rgba(40,42,44,0.15)");
      gr.addColorStop(1, "rgba(40,42,44,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, T, T);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      matFlou = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.4 });
    }
    const flou = new THREE.Mesh(new THREE.CircleGeometry(r, 48), matFlou);
    flou.name = "flou";
    flou.rotation.x = -Math.PI / 2;
    flou.position.y = -fleche * 0.45;
    flou.visible = false;
    flou.userData.garder = true;
    g.add(flou);
    return g;
  }
  // Les 2 cordes (cachées tant qu'on ne descend pas) et les 2 petites flammes des mitrailleuses.
  function cordesEtFlammes(g, sorte, bouches) {
    matCorde = matCorde || new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.95 });
    matFlamme = matFlamme || new THREE.MeshBasicMaterial({ color: 0xffc860 });
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6).translate(0, -0.5, 0); // (haut à 0 : on l'allonge vers le bas)
    K().cordes[sorte].forEach(([x, y, z], k) => {
      const c = new THREE.Mesh(geo, matCorde);
      c.name = "corde" + k;
      c.position.set(x, y, z);
      c.visible = false;
      c.castShadow = false;
      g.add(c);
    });
    bouches.forEach(([x, y, z], k) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), matFlamme);
      f.scale.set(1, 1, 1.8);
      f.name = "flamme" + k;
      f.position.set(x, y, z);
      f.visible = false;
      g.add(f);
    });
  }
  // Une MITRAILLEUSE DE PORTE (M240) sur son bras, qui pointe vers le côté s (+1 droite, −1 gauche) : le bras pivotant,
  // le boîtier, le couvercle, la crosse et les 2 poignées, la caisse et la bande de munitions, le canon à trous, le
  // cache-flamme. (x, y, z) = le pivot. Renvoie la bouche du canon.
  function mitrailleuse(g, x, y, z, s) {
    const m = MT(), A = 0x26282b, galet = OU().galet;
    g.add(O.tube([x, y - 0.55, z - s * 0.12], [x, y - 0.08, z], 0.04, m.teinte, 8, CT.acier)); // le bras
    g.add(O.piece(galet(0.1, 0.06, 0.1, 0.4, 8), m.teinte, x, y - 0.06, z, CT.acier)); // le pivot
    g.add(O.piece(galet(0.1, 0.13, 0.52, 0.25, 10), m.teinte, x, y, z + s * 0.04, A)); // le boîtier
    g.add(O.piece(galet(0.09, 0.03, 0.3, 0.25, 8), m.teinte, x, y + 0.075, z + s * 0.0, 0x303236)); // le couvercle
    g.add(O.piece(galet(0.08, 0.1, 0.14, 0.4, 8), m.teinte, x, y - 0.01, z - s * 0.28, A)); // la plaque arrière
    for (const d of [-0.045, 0.045]) g.add(O.tube([x + d, y - 0.03, z - s * 0.34], [x + d, y - 0.13, z - s * 0.37], 0.016, m.teinte, 6, 0x1a1a1a)); // les poignées
    g.add(O.piece(galet(0.16, 0.15, 0.13, 0.25, 8), m.teinte, x - 0.15, y - 0.05, z - s * 0.02, CT.olive)); // la caisse de munitions
    g.add(O.cable([[x - 0.08, y + 0.02, z - s * 0.02], [x - 0.04, y + 0.04, z + s * 0.03], [x, y + 0.03, z + s * 0.06]], 0.018, m.teinte, 0xa08040, 6)); // la bande
    g.add(O.couche(O.cylindre(0.032, 0.032, 0.38, m.teinte, 10, 0x2e3033), "z", x, y + 0.01, z + s * 0.48)); // le manchon (à trous)
    for (let k = 0; k < 5; k++) g.add(O.couche(O.cylindre(0.034, 0.034, 0.02, m.teinte, 10, 0x141414), "z", x, y + 0.01, z + s * (0.34 + k * 0.06)));
    g.add(O.couche(O.cylindre(0.017, 0.017, 0.32, m.teinte, 8, A), "z", x, y + 0.01, z + s * 0.8)); // le canon
    g.add(O.couche(O.cylindre(0.03, 0.024, 0.09, m.teinte, 10, 0x141414), "z", x, y + 0.01, z + s * 0.98)); // le cache-flamme
    g.add(O.tube([x, y - 0.05, z + s * 0.62], [x, y - 0.2, z + s * 0.7], 0.008, m.teinte, 4, A)); // le bipied replié
    return [x, y + 0.01, z + s * 1.12];
  }
  // Une ANTENNE en lame (posée sur la surface), et une antenne fouet.
  function lame(g, p, n, haut, long) {
    const m = MT(), a = O.piece(OU().galet(long, haut * 2, 0.03, 0.35, 8), m.teinte, 0, 0, 0, 0x2a2c2a);
    O.surLaSurface(a, p, n);
    g.add(a);
  }
  // Les soldats « figurines » (affichage/engins3d.js) : on les pose dans le groupe, tournés, à leur place.
  function poserFigurine(g, fig, x, y, z, angle) {
    fig.position.set(x, y, z);
    fig.rotation.y = angle || 0;
    fig.updateMatrix();
    for (const m of fig.children) {
      const p = O.piece(m.geometry.clone().applyMatrix4(fig.matrix), m.material);
      g.add(p);
    }
  }
  // Les poses : assis aux commandes, debout derrière une mitrailleuse, assis au bord d'une porte les jambes dans le vide.
  const POSE = {
    pilote: (r, bras) => {
      for (const j of r.jambes) j.rotation.z = 1.45;
      for (const g of r.genoux) g.rotation.z = -1.35;
      r.dos.rotation.z = -0.12;
      bras(r.epaules[0], r.coudes[0], [0.42, 0.06, 0.08], new THREE.Vector3(-0.2, -1, 0.6));
      bras(r.epaules[1], r.coudes[1], [0.36, 0.12, -0.24], new THREE.Vector3(-0.2, -1, -0.6));
    },
    mitrailleur: (h) => (r, bras) => {
      r.jambes[0].rotation.z = 0.25;
      r.jambes[1].rotation.z = -0.1;
      r.genoux[0].rotation.z = -0.3;
      r.dos.rotation.z = -0.1;
      bras(r.epaules[0], r.coudes[0], [0.36, h, 0.06], new THREE.Vector3(-0.3, -1, 0.8));
      bras(r.epaules[1], r.coudes[1], [0.36, h, -0.06], new THREE.Vector3(-0.3, -1, -0.8));
    },
    assis: (r, bras) => {
      r.jambes[0].rotation.set(0.04, 0, 1.5);
      r.jambes[1].rotation.set(-0.04, 0, 1.42);
      r.genoux[0].rotation.z = -1.45;
      r.genoux[1].rotation.z = -1.25;
      r.dos.rotation.z = -0.15;
      r.cou.rotation.z = -0.2;
      bras(r.epaules[0], r.coudes[0], [0.42, 0.0, 0.14], new THREE.Vector3(0, -1, 0.6));
      bras(r.epaules[1], r.coudes[1], [0.44, -0.04, -0.12], new THREE.Vector3(0, -1, -0.6));
    },
  };
  // Un SIÈGE de pilote : l'assise, le dossier blindé, l'appui-tête.
  function siege(g, x, y, z) {
    const m = MT(), galet = OU().galet;
    g.add(O.piece(galet(0.5, 0.1, 0.5, 0.35, 8), m.teinte, x, y, z, 0x3a3c36));
    g.add(O.piece(galet(0.1, 0.75, 0.52, 0.35, 8), m.teinte, x - 0.3, y + 0.38, z, 0x3a3c36).rotateZ(0.12));
  }

  // ------------------------------------------------------------------ le CHINOOK (CH-47)
  // Mesures : fuselage de 15,8 m, 2,56 m de large (3,8 m avec les réservoirs), 2 rotors de 18,3 m écartés de 12 m.
  // La rampe : sa charnière au bout du plancher (x = −5,6, y = 1,15) ; fermée, elle remonte vers l'arrière (0,68 rad).
  const PENTE_RAMPE = 0.68, CHARNIERE = [-5.6, 1.15], LONGUEUR_RAMPE = 2.4;
  const ligneRampe = (x) => CHARNIERE[1] + (CHARNIERE[0] - x) * Math.tan(PENTE_RAMPE);
  function chinook(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], P = peintureDe(equipe), galet = OU().galet;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const couleur = couleurPeinture(P), fonce = new THREE.Color(P).multiplyScalar(0.7).getHex();
    // 1. Le FUSELAGE : presque carré, aux coins arrondis, le nez arrondi qui descend ; derrière, le bas est coupé en
    // biais (c'est là que se range la rampe).
    const cles = [
      { x: -7.95, y: 2.4, w: 1.16, h: 1.17, b: 1.25, n: 4 },
      { x: -5.6, y: 2.36, w: 1.28, h: 1.24, b: 1.21, n: 4.4 },
      { x: 3.6, y: 2.36, w: 1.28, h: 1.24, b: 1.21, n: 4.4 },
      { x: 5.1, y: 2.34, w: 1.27, h: 1.2, b: 1.19, n: 4 },
      { x: 6.25, y: 2.24, w: 1.2, h: 1.06, b: 1.08, n: 3.4 },
      { x: 7.05, y: 2.1, w: 1.02, h: 0.86, b: 0.92, n: 2.9 },
      { x: 7.55, y: 1.92, w: 0.72, h: 0.56, b: 0.66, n: 2.5 },
      { x: 7.82, y: 1.82, w: 0.34, h: 0.26, b: 0.32, n: 2.2 },
      { x: 7.9, y: 1.8, w: 0.04, h: 0.04, b: 0.04, n: 2 },
    ];
    const coupe = (p) => {
      if (p.x < CHARNIERE[0] + 0.001 && p.y < ligneRampe(p.x)) p.y = ligneRampe(p.x);
    };
    const finRampe = CHARNIERE[0] - LONGUEUR_RAMPE * Math.cos(PENTE_RAMPE);
    const coque = O.coque(cles, {
      tours: 64, pas: 0.12, uv: 1, deformer: coupe, couleur, coupes: [3.78, 3.85, 4.55, 4.62, 5.6, 6.05, 6.12, 6.62, 6.75, 7.05],
      // (les vitres et les ouvertures : « de x1 à x2, de l'angle a1 à l'angle a2 » autour de la coque ; l'angle 0 est le
      // milieu du flanc, π/2 le dessus, −π/2 le dessous ; les deux côtés sont pareils)
      zone: (c, n, g) => {
        const { x, a } = g, dans = (x1, x2, a1, a2) => x > x1 && x < x2 && a > a1 && a < a2;
        // le bas coupé en biais : c'est l'ouverture de la soute (fermée par la rampe) ; tout au bout, la porte du haut
        if (c.x < CHARNIERE[0] && c.y < ligneRampe(c.x) + 0.02 && n.y < -0.2 && Math.abs(n.z) < 0.6) return c.x < finRampe - 0.05 ? "peinture" : null;
        // les VITRES du cockpit : le pare-brise (en bas et en haut, avec un montant entre les deux), les vitres de côté,
        // les vitres du bas (pour voir où on se pose)
        if (dans(6.62, 7.42, 0.0, 0.6) || dans(6.62, 7.3, 0.68, Math.PI / 2 - 0.05)) return "verre";
        if (dans(5.62, 6.08, -0.03, 0.47) || dans(6.14, 6.56, -0.03, 0.47)) return "verre";
        if (dans(7.05, 7.6, -1.0, -0.35)) return "verre";
        // la porte avant droite (ouverte) et la fenêtre avant gauche (ouverte) : des trous (on voit dedans)
        if (g.droite && dans(3.78, 4.62, -0.97, 0.17)) return null;
        if (!g.droite && dans(3.85, 4.55, -0.07, 0.08)) return null;
        return "peinture";
      },
    });
    poserCoque(caisse, coque);
    // l'INTÉRIEUR de la soute (on le voit quand la rampe est ouverte) : les parois (tournées vers dedans), le plancher,
    // les bancs rouges le long des parois.
    const dedans = O.coque(cles.map((k) => Object.assign({}, k, { w: Math.max(0.02, k.w - 0.08), h: Math.max(0.02, k.h - 0.08), b: Math.max(0.02, k.b - 0.06) })), {
      tours: 32, pas: 0.3, retourner: true, fermer: [false, true], deformer: coupe, couleur: () => [0.17, 0.18, 0.16],
      zone: (c, n) => (c.x < CHARNIERE[0] && c.y < ligneRampe(c.x) + 0.05 && n.y > 0.2 ? null : "interieur"),
    });
    poserCoque(caisse, dedans, { interieur: 0x2c2e29 });
    caisse.add(peint(new THREE.BoxGeometry(7.6, 0.06, 2.3), -1.85, 1.2, 0, COUL.plancher));
    for (const s of [-1, 1]) {
      caisse.add(peint(new THREE.BoxGeometry(6.5, 0.08, 0.42), -2.2, 1.62, s * 0.92, COUL.banc));
      caisse.add(peint(new THREE.BoxGeometry(6.5, 0.55, 0.05), -2.2, 2.0, s * 1.12, COUL.banc));
    }
    // 2. La TOUR AVANT (sous le rotor avant), le TUNNEL sur le dos, la haute TOUR ARRIÈRE (le pylône).
    poserCoque(caisse, O.coque([
      { x: 2.5, y: 3.5, w: 0.22, h: 0.06, b: 0.15, n: 3 }, { x: 3.6, y: 3.62, w: 0.6, h: 0.42, b: 0.2, n: 3 },
      { x: 5.2, y: 3.62, w: 0.74, h: 0.62, b: 0.2, n: 3 }, { x: 6.35, y: 3.55, w: 0.66, h: 0.55, b: 0.2, n: 3 },
      { x: 6.95, y: 3.4, w: 0.36, h: 0.28, b: 0.15, n: 2.6 }, { x: 7.15, y: 3.3, w: 0.05, h: 0.05, b: 0.05 },
    ], { tours: 36, pas: 0.12, couleur }));
    poserCoque(caisse, O.coque([
      { x: -3.0, y: 3.55, w: 0.2, h: 0.05, b: 0.1, n: 3 }, { x: -2.5, y: 3.58, w: 0.4, h: 0.2, b: 0.1, n: 3 },
      { x: 2.6, y: 3.58, w: 0.4, h: 0.2, b: 0.1, n: 3 }, { x: 3.0, y: 3.56, w: 0.2, h: 0.05, b: 0.1, n: 3 },
    ], { tours: 28, pas: 0.3, couleur }));
    poserCoque(caisse, O.coque([
      { x: -8.05, y: 3.8, w: 0.18, h: 0.3, b: 0.3, n: 2.6 }, { x: -7.95, y: 3.82, w: 0.48, h: 0.75, b: 0.45, n: 3 },
      { x: -7.25, y: 3.95, w: 0.66, h: 1.12, b: 0.5, n: 3.2 }, { x: -6.3, y: 3.98, w: 0.74, h: 1.22, b: 0.5, n: 3.2 },
      { x: -5.0, y: 3.9, w: 0.76, h: 1.0, b: 0.45, n: 3.2 }, { x: -3.6, y: 3.7, w: 0.6, h: 0.5, b: 0.3, n: 3 },
      { x: -2.5, y: 3.55, w: 0.3, h: 0.08, b: 0.15, n: 3 },
    ], { tours: 40, pas: 0.12, couleur }));
    caisse.add(peint(new THREE.CylinderGeometry(0.2, 0.32, 0.6, 16), 5.9, 4.32, 0, fonce)); // les mâts des rotors
    caisse.add(peint(new THREE.CylinderGeometry(0.2, 0.32, 0.5, 16), -6.1, 5.33, 0, fonce));
    for (const s of [-1, 1]) {
      // 3. Les 2 MOTEURS sur les côtés de la tour arrière : la nacelle, l'entrée d'air (sombre), la tuyère, les supports.
      const z = s * 1.26;
      caisse.add(O.tourX([[-7.42, 0.0], [-7.42, 0.2], [-7.3, 0.25], [-6.9, 0.33], [-6.3, 0.38], [-4.4, 0.4], [-3.75, 0.38], [-3.47, 0.34], [-3.42, 0.3], [-3.44, 0.0]], peinture(), 28, P).translateZ(z).translateY(4.08));
      caisse.add(O.couche(O.cylindre(0.29, 0.29, 0.02, m.teinte, 20, COUL.sombre), "x", -3.43, 4.08, z)); // l'entrée d'air
      caisse.add(O.couche(O.cylindre(0.12, 0.2, 0.06, m.teinte, 16, CT.acier), "x", -3.47, 4.08, z)); // le cône d'entrée
      caisse.add(O.couche(O.tour([[0.17, -0.2], [0.2, 0.0], [0.2, 0.0], [0.0, 0.0]], m.teinte, 18, 0x0e0e0e), "x", -7.43, 4.08, z)); // la tuyère
      caisse.add(O.couche(O.cylindre(0.22, 0.26, 0.24, m.teinte, 20, 0x3a3532), "x", -7.48, 4.08, z));
      for (const x of [-6.2, -4.6]) caisse.add(peint(OU().galet(0.35, 0.22, 0.6, 0.4, 10), x, 3.92, s * 0.92, P)); // les supports
      for (let k = 0; k < 4; k++) caisse.add(O.piece(new THREE.BoxGeometry(0.5, 0.02, 0.06), m.teinte, -5.3 + k * 0.2, 4.47, z, COUL.sombre)); // la grille
      // 4. Les longs RÉSERVOIRS de côté.
      poserCoque(caisse, O.coque([
        { x: -4.8, y: 1.42, w: 0.06, h: 0.12, b: 0.1, n: 2, z: s * 1.4 }, { x: -4.55, y: 1.45, w: 0.32, h: 0.4, b: 0.42, n: 2.6, z: s * 1.45 },
        { x: -4.1, y: 1.47, w: 0.42, h: 0.5, b: 0.5, n: 3.2, z: s * 1.46 }, { x: 2.6, y: 1.47, w: 0.42, h: 0.5, b: 0.5, n: 3.2, z: s * 1.46 },
        { x: 3.25, y: 1.46, w: 0.34, h: 0.42, b: 0.42, n: 2.8, z: s * 1.45 }, { x: 3.55, y: 1.44, w: 0.06, h: 0.12, b: 0.1, n: 2, z: s * 1.4 },
      ], { tours: 32, pas: 0.25, couleur }));
      caisse.add(O.piece(new THREE.BoxGeometry(5.5, 0.04, 0.03), m.teinte, -0.7, 1.75, s * 1.885, 0xb6d48a)); // la lampe de formation
      // 5. Le TRAIN : 2 roues côte à côte devant (jambe, bras), 1 roue derrière (sous le réservoir).
      for (const dz of [1.22, 1.62]) roue(caisse, 3.1, 0.44, s * dz, 0.25);
      caisse.add(O.tube([3.1, 0.44, s * 1.42], [3.05, 1.08, s * 1.42], 0.09, m.teinte, 10, CT.acier));
      caisse.add(O.tube([3.05, 0.95, s * 1.42], [3.05, 1.08, s * 1.42], 0.13, m.teinte, 10, P));
      caisse.add(O.tube([3.1, 0.44, s * 1.2], [3.1, 0.44, s * 1.64], 0.05, m.teinte, 8, CT.acier));
      roue(caisse, -4.35, 0.46, s * 1.48, 0.3);
      caisse.add(O.tube([-4.35, 0.46, s * 1.48], [-4.25, 1.05, s * 1.45], 0.09, m.teinte, 10, CT.acier));
      caisse.add(O.piece(galet(0.4, 0.3, 0.12, 0.4, 8), m.teinte, -4.35, 0.82, s * 1.33, CT.acier));
      // 6. Les HUBLOTS ronds (un anneau et une vitre, posés sur la courbe de la coque).
      for (let x = -4.45; x < 3.2; x += 1.1) {
        if (s > 0 && x > 3.6) continue;
        const { p, n } = coque.point(x, s > 0 ? 0.06 : Math.PI - 0.06);
        caisse.add(O.surLaSurface(O.piece(new THREE.TorusGeometry(0.17, 0.028, 6, 22).rotateX(Math.PI / 2), m.teinte, 0, 0, 0, 0x34372e), p.clone().addScaledVector(n, 0.01), n));
        caisse.add(O.surLaSurface(O.piece(new THREE.CircleGeometry(0.16, 22).rotateX(-Math.PI / 2), verre()), p.clone().addScaledVector(n, 0.006), n));
      }
      // la marque de l'équipe : sur la tour arrière et sur la cabine
      caisse.add(O.piece(new THREE.BoxGeometry(1.2, 0.36, 0.02), m.teinte, -6.1, 4.55, s * 0.765, E.marque).rotateX(s * 0.05));
      caisse.add(O.piece(new THREE.CircleGeometry(0.28, 20), m.teinte, -0.8, 3.0, s * 1.29, E.marque).rotateY(s > 0 ? 0 : Math.PI));
      // les marchepieds et les poignées près de la porte et du cockpit
      caisse.add(O.tube([5.4, 1.05, s * 1.32], [5.4, 1.4, s * 1.32], 0.02, m.teinte, 6, CT.acier));
      // le rétroviseur du pilote
      caisse.add(O.tube([7.2, 2.0, s * 0.95], [7.45, 2.1, s * 1.25], 0.02, m.teinte, 6, CT.noir));
    }
    // les antennes (sur le dos et sous le ventre), les tubes de Pitot sur le nez, la perche de ravitaillement
    lame(caisse, new THREE.Vector3(-1.5, 3.77, 0), new THREE.Vector3(0, 1, 0), 0.22, 0.32);
    lame(caisse, new THREE.Vector3(1.4, 3.77, 0), new THREE.Vector3(0, 1, 0), 0.16, 0.28);
    lame(caisse, new THREE.Vector3(-2.5, 1.12, 0.4), new THREE.Vector3(0, -1, 0), 0.14, 0.25);
    caisse.add(O.tube([-7.6, 5.0, 0], [-8.0, 5.8, 0], 0.012, m.teinte, 4, CT.noir)); // l'antenne fouet
    for (const s of [-1, 1]) caisse.add(O.tube([7.6, 2.35, s * 0.42], [8.15, 2.32, s * 0.45], 0.018, m.teinte, 6, CT.acier));
    // 7. Le cockpit : le tableau de bord, les sièges, les 2 PILOTES (des figurines assises).
    caisse.add(O.piece(galet(0.35, 0.3, 1.9, 0.3, 8), m.teinte, 6.95, 2.05, 0, 0x1c1d1c));
    for (const s of [-1, 1]) {
      siege(caisse, 6.1, 1.65, s * 0.5);
      poserFigurine(caisse, OU().figurine(equipe, POSE.pilote, true, s > 0 ? 0 : 1), 6.18, 1.65 + 0.1 - 0.92, s * 0.5, 0);
    }
    // 8. Les MITRAILLEURS : debout dans la porte avant droite et à la fenêtre avant gauche, avec leur M240.
    const bouches = [];
    for (const s of [1, -1]) {
      const yArme = s > 0 ? 2.3 : 2.35;
      bouches.push(mitrailleuse(caisse, 4.2, yArme, s * 1.32, s));
      poserFigurine(caisse, OU().figurine(equipe, POSE.mitrailleur(yArme - 0.08 - 1.2 - 0.98), true, s > 0 ? 2 : 0), 4.2, 1.2, s * 0.62, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
    O.souder(caisse);
    // 9. La RAMPE (elle tourne autour de sa charnière) : la plaque, le plancher antidérapant, les nervures, les bords,
    // les charnières, la lèvre au bout.
    const rampe = new THREE.Group();
    rampe.name = "rampe";
    rampe.position.set(CHARNIERE[0], CHARNIERE[1], 0);
    rampe.add(peint(galet(LONGUEUR_RAMPE, 0.14, 2.32, 0.2, 14), -LONGUEUR_RAMPE / 2, -0.07, 0, P));
    rampe.add(peint(new THREE.BoxGeometry(LONGUEUR_RAMPE - 0.15, 0.02, 2.0), -LONGUEUR_RAMPE / 2, 0.005, 0, COUL.plancher));
    for (let k = 0; k < 9; k++) rampe.add(O.piece(new THREE.BoxGeometry(0.05, 0.035, 1.9), m.teinte, -0.25 - k * 0.24, 0.02, 0, 0x45474a));
    for (const z of [-1.1, 1.1]) rampe.add(peint(new THREE.BoxGeometry(LONGUEUR_RAMPE, 0.18, 0.08), -LONGUEUR_RAMPE / 2, 0.06, z, P));
    for (const z of [-0.8, 0, 0.8]) rampe.add(O.couche(O.cylindre(0.07, 0.07, 0.3, m.teinte, 10, CT.acier), "z", 0, 0, z));
    rampe.add(O.piece(new THREE.BoxGeometry(0.16, 0.05, 2.1), m.teinte, -LONGUEUR_RAMPE - 0.06, -0.04, 0, CT.acier)); // la lèvre
    O.souder(rampe);
    rampe.rotation.z = -PENTE_RAMPE;
    g.add(rampe);
    // 10. Les 2 rotors à 3 pales (celui de derrière est plus haut).
    g.add(rotor("rotor0", 5.9, 4.62, 3, 9.15, 0.81, 0, 0.35), rotor("rotor1", -6.1, 5.62, 3, 9.15, 0.81, Math.PI / 3, 0.35));
    cordesEtFlammes(g, "chinook", bouches);
    return g;
  }

  // ------------------------------------------------------------------ le BLACK HAWK (UH-60)
  // Mesures : 15,3 m de long (sans les rotors), cabine de 2,4 m de large, grand rotor de 16,4 m, rotor de queue de 3,4 m.
  function blackhawk(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], P = peintureDe(equipe), galet = OU().galet;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const couleur = couleurPeinture(P), fonce = new THREE.Color(P).multiplyScalar(0.72).getHex();
    // 1. La CABINE et le NEZ : les côtés presque plats, le cockpit « anguleux mais lisse » qui plonge vers le nez.
    const cles = [
      { x: -2.65, y: 1.98, w: 0.78, h: 0.74, b: 0.9, n: 3 },
      { x: -2.0, y: 1.78, w: 1.12, h: 0.95, b: 1.02, n: 3.6 },
      { x: 2.2, y: 1.75, w: 1.15, h: 0.95, b: 1.0, n: 3.6 },
      { x: 3.0, y: 1.68, w: 1.06, h: 0.88, b: 0.94, n: 3.3 },
      { x: 3.72, y: 1.48, w: 0.84, h: 0.6, b: 0.74, n: 2.9 },
      { x: 4.18, y: 1.3, w: 0.48, h: 0.3, b: 0.48, n: 2.5 },
      { x: 4.38, y: 1.24, w: 0.16, h: 0.1, b: 0.2, n: 2.2 },
      { x: 4.43, y: 1.23, w: 0.03, h: 0.03, b: 0.03, n: 2 },
    ];
    const coque = O.coque(cles, {
      tours: 64, pas: 0.1, uv: 1, couleur, coupes: [-1.3, 0.42, 1.25, 1.85, 2.3, 2.78, 3.25, 3.55],
      zone: (c, n, g) => {
        const { x, a } = g, dans = (x1, x2, a1, a2) => x > x1 && x < x2 && a > a1 && a < a2;
        if (dans(3.28, 3.98, 0.12, Math.PI / 2 - 0.045)) return "verre"; // le pare-brise (le montant au milieu)
        if (dans(2.32, 2.76, 0.02, 0.8) || dans(2.8, 3.24, 0.02, 0.8)) return "verre"; // les portes du cockpit
        if (dans(3.62, 4.12, -1.05, -0.3)) return "verre"; // les vitres du bas
        if (dans(-1.3, 0.42, -0.73, 0.6)) return null; // les grandes portes ouvertes (des trous : on voit dedans)
        if (dans(1.25, 1.85, 0.0, 0.41)) return null; // la fenêtre du mitrailleur (ouverte)
        return "peinture";
      },
    });
    poserCoque(caisse, coque);
    // 2. La POUTRE DE QUEUE, le CAPOT des moteurs sur le dos.
    poserCoque(caisse, O.coque([
      { x: -9.95, y: 2.52, w: 0.05, h: 0.05, b: 0.05 }, { x: -9.75, y: 2.5, w: 0.17, h: 0.2, b: 0.18, n: 2.4 },
      { x: -9.0, y: 2.42, w: 0.2, h: 0.23, b: 0.2, n: 2.4 }, { x: -6.0, y: 2.27, w: 0.3, h: 0.33, b: 0.28, n: 2.4 },
      { x: -3.4, y: 2.1, w: 0.5, h: 0.5, b: 0.45, n: 2.6 }, { x: -2.2, y: 1.98, w: 0.74, h: 0.7, b: 0.8, n: 2.8 },
    ], { tours: 36, pas: 0.2, couleur }));
    poserCoque(caisse, O.coque([
      { x: -2.85, y: 2.72, w: 0.3, h: 0.06, b: 0.1, n: 3 }, { x: -2.25, y: 2.78, w: 0.76, h: 0.32, b: 0.15, n: 3.4 },
      { x: 0.95, y: 2.8, w: 0.78, h: 0.34, b: 0.15, n: 3.4 }, { x: 1.6, y: 2.72, w: 0.5, h: 0.16, b: 0.1, n: 3 },
      { x: 1.85, y: 2.68, w: 0.08, h: 0.04, b: 0.04 },
    ], { tours: 36, pas: 0.15, couleur }));
    caisse.add(peint(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 16), 0.35, 3.38, 0, fonce)); // le mât du rotor
    // l'intérieur de la cabine (vu par les portes ouvertes) : les parois, le plancher, les sièges en toile
    poserCoque(caisse, O.coque(cles.map((k) => Object.assign({}, k, { w: Math.max(0.02, k.w - 0.07), h: Math.max(0.02, k.h - 0.07), b: Math.max(0.02, k.b - 0.07) })), {
      tours: 28, pas: 0.4, retourner: true, couleur: () => [0.17, 0.18, 0.16], zone: () => "interieur",
    }), { interieur: 0x2c2e29 });
    caisse.add(peint(new THREE.BoxGeometry(4.0, 0.05, 2.1), -0.4, 0.86, 0, COUL.plancher));
    caisse.add(peint(new THREE.BoxGeometry(0.4, 0.5, 2.0), -2.1, 1.25, 0, COUL.banc));
    for (const s of [-1, 1]) {
      // 3. Les 2 MOTEURS sur le dos : la nacelle, l'entrée d'air, l'échappement tourné vers l'extérieur.
      const z = s * 0.66;
      caisse.add(O.tourX([[-1.95, 0.0], [-1.95, 0.22], [-1.7, 0.3], [-1.2, 0.34], [0.6, 0.34], [0.9, 0.3], [1.02, 0.26], [1.02, 0.0]], peinture(), 24, P).translateZ(z).translateY(2.98));
      caisse.add(O.couche(O.cylindre(0.22, 0.22, 0.02, m.teinte, 18, COUL.sombre), "x", 1.03, 2.98, z));
      caisse.add(O.tube([-1.85, 2.98, z], [-2.45, 3.08, s * 0.98], 0.21, m.teinte, 14, 0x3a3532)); // l'échappement
      caisse.add(O.tube([-2.43, 3.077, s * 0.968], [-2.47, 3.084, s * 0.99], 0.175, m.teinte, 14, 0x0c0c0c)); // le trou noir de l'échappement
      // 4. Le TRAIN : la roue, la jambe (avec son amortisseur) et le bras.
      roue(caisse, 2.75, 0.38, s * 1.45, 0.24);
      caisse.add(O.tube([2.75, 0.38, s * 1.36], [2.95, 1.2, s * 1.0], 0.07, m.teinte, 8, CT.acier));
      caisse.add(O.tube([2.9, 1.0, s * 1.08], [2.95, 1.2, s * 1.0], 0.1, m.teinte, 8, P));
      caisse.add(O.tube([2.75, 0.38, s * 1.36], [2.0, 0.95, s * 1.02], 0.06, m.teinte, 8, CT.acier));
      // 5. Les PORTES coulissantes, glissées vers l'arrière : la porte (avec sa vitre), le rail du haut ; le bras de la
      // corde au-dessus de la porte.
      const pp = coque.point(-1.5, s > 0 ? 0.05 : Math.PI - 0.05);
      const porte = peint(galet(1.75, 1.42, 0.06, 0.2, 12), -1.55, 1.68, s * (Math.abs(pp.p.z) + 0.05), P);
      caisse.add(porte);
      caisse.add(O.piece(galet(0.7, 0.45, 0.02, 0.3, 10), verre(), -1.3, 1.95, s * (Math.abs(pp.p.z) + 0.085)));
      caisse.add(O.piece(new THREE.BoxGeometry(4.2, 0.05, 0.05), m.teinte, -1.0, 2.46, s * 1.17, CT.noir));
      caisse.add(O.tube([0.1, 2.62, s * 0.92], [0.1, 2.78, s * 1.6], 0.05, m.teinte, 8, CT.noir));
      caisse.add(O.piece(galet(0.1, 0.14, 0.1, 0.4, 6), m.teinte, 0.1, 2.75, s * 1.56, CT.acier));
      // les marches sous les portes, les poignées
      caisse.add(O.piece(new THREE.BoxGeometry(0.5, 0.04, 0.2), m.teinte, -0.5, 0.82, s * 1.15, CT.acier));
      // la marque de l'équipe : sur la poutre de queue et sous la fenêtre du mitrailleur
      caisse.add(O.piece(new THREE.CircleGeometry(0.21, 20), m.teinte, -5.4, 2.28, s * 0.345, E.marque).rotateY(s > 0 ? 0 : Math.PI));
      caisse.add(O.piece(new THREE.BoxGeometry(0.62, 0.16, 0.02), m.teinte, 1.55, 1.5, s * 1.17, E.marque));
      // les rétroviseurs, les marchepieds du cockpit
      caisse.add(O.tube([2.7, 1.0, s * 1.12], [2.7, 1.2, s * 1.12], 0.02, m.teinte, 6, CT.acier));
    }
    // les coupe-câbles (sur le nez, au-dessus du pare-brise et sous le menton), les antennes, les tubes de Pitot
    caisse.add(O.profil([[3.3, 2.5], [4.1, 2.25], [4.15, 2.3], [3.35, 2.6]], 0.04, m.teinte, 0.005, CT.acier));
    caisse.add(O.profil([[3.9, 0.82], [4.45, 0.95], [4.42, 1.0], [3.85, 0.88]], 0.04, m.teinte, 0.005, CT.acier));
    for (const s of [-1, 1]) caisse.add(O.tube([4.1, 1.42, s * 0.42], [4.7, 1.45, s * 0.46], 0.016, m.teinte, 6, CT.acier));
    lame(caisse, new THREE.Vector3(-0.8, 2.72, 0), new THREE.Vector3(0, 1, 0), 0.18, 0.3);
    lame(caisse, new THREE.Vector3(-4.5, 2.6, 0), new THREE.Vector3(0, 1, 0), 0.14, 0.26);
    lame(caisse, new THREE.Vector3(-1.0, 0.76, 0), new THREE.Vector3(0, -1, 0), 0.14, 0.26);
    caisse.add(O.tube([-3.0, 2.5, 0.3], [-3.3, 3.2, 0.42], 0.012, m.teinte, 4, CT.noir));
    // 6. La QUEUE : la dérive (en flèche), le stabilisateur, la roulette, la boîte du rotor de queue.
    caisse.add(peint(O.profil([[-8.65, 2.4], [-9.95, 2.4], [-10.78, 4.45], [-10.22, 4.52], [-9.25, 3.0]], 0.26, peinture(), 0.08).geometry, 0, 0, 0, P));
    const stab = O.piece(pale(0, 4.4, 0.9, 0.14, 0, 16), peinture());
    repeindre(stab.geometry, P);
    stab.geometry.translate(-2.2, 0, 0);
    stab.rotation.y = Math.PI / 2;
    stab.position.set(-9.55, 2.12, 0);
    caisse.add(stab);
    caisse.add(O.tube([-8.3, 2.15, 0], [-8.5, 0.24, 0], 0.06, m.teinte, 8, CT.acier));
    roue(caisse, -8.5, 0.22, 0, 0.14);
    caisse.add(peint(galet(0.42, 0.42, 0.34, 0.45, 10), -10.42, 3.75, 0.1, fonce));
    // 7. Le cockpit : le tableau de bord, les sièges, les 2 PILOTES.
    caisse.add(O.piece(galet(0.3, 0.28, 1.7, 0.3, 8), m.teinte, 3.55, 1.5, 0, 0x1c1d1c));
    for (const s of [-1, 1]) {
      siege(caisse, 2.65, 1.12, s * 0.48);
      poserFigurine(caisse, OU().figurine(equipe, POSE.pilote, true, s > 0 ? 1 : 3), 2.73, 1.12 + 0.1 - 0.92, s * 0.48, 0);
    }
    // 8. Les MITRAILLEURS aux fenêtres, juste derrière les pilotes, avec leur M240.
    const bouches = [];
    for (const s of [1, -1]) {
      bouches.push(mitrailleuse(caisse, 1.55, 1.98, s * 1.2, s));
      poserFigurine(caisse, OU().figurine(equipe, POSE.mitrailleur(1.98 - 0.08 - 0.74 - 0.98), true, s > 0 ? 0 : 2), 1.5, 0.74, s * 0.5, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
    O.souder(caisse);
    // 9. Les soldats ASSIS au bord des portes, les jambes dans le vide (cachés quand ils sont tous descendus).
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    let k = 0;
    for (const s of [-1, 1]) for (const x of [-0.95, -0.15]) {
      poserFigurine(passagers, OU().figurine(equipe, POSE.assis, true, k++ % 4), x, 0.9 + 0.08 - 0.92, s * 0.78, s > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
    O.souder(passagers);
    g.add(passagers);
    // 10. Le grand ROTOR à 4 pales, et le ROTOR DE QUEUE (sur le côté droit, penché de 20° comme le vrai).
    g.add(rotor("rotor0", 0.35, 3.72, 4, 8.18, 0.53, Math.PI / 4, 0.3));
    const queue = new THREE.Group();
    queue.name = "rotorQueue";
    queue.position.set(-10.45, 3.75, 0.36);
    queue.rotation.x = 0.35; // (penché)
    queue.add(O.couche(O.tour([[0.0, -0.1], [0.12, -0.1], [0.14, 0.02], [0.08, 0.12], [0.0, 0.13]], m.teinte, 14, CT.noir), "z", 0, 0, 0));
    for (let j = 0; j < 4; j++) {
      const a = (j * Math.PI) / 2, p = O.piece(pale(0.12, 1.68, 0.24, 0.12, 0, 12), m.teinte);
      p.rotation.set(Math.PI / 2, 0, a + Math.PI / 2, "XYZ");
      queue.add(p);
    }
    O.souder(queue);
    const flouQueue = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), matFlou);
    flouQueue.name = "flou";
    flouQueue.visible = false;
    queue.add(flouQueue);
    g.add(queue);
    cordesEtFlammes(g, "blackhawk", bouches);
    return g;
  }

  // ------------------------------------------------------------------ les modèles (une fois), et leurs copies
  const modeles = {}, FABRIQUES = { chinook, blackhawk };
  function fabriquer(sorte, equipe) {
    const cle = sorte + ":" + equipe;
    if (!modeles[cle]) modeles[cle] = FABRIQUES[sorte](equipe);
    const g = modeles[cle].clone(true); // (une copie : les formes et les matières sont partagées)
    const nom = (n) => g.getObjectByName(n) || null;
    const rotors = [nom("rotor0"), nom("rotor1")].filter(Boolean), queue = nom("rotorQueue");
    const flous = rotors.concat(queue ? [queue] : []).map((r) => r.getObjectByName("flou")).filter(Boolean);
    return {
      g, sorte, helicoTransport: true, rotors, rotorQueue: queue, rampe: nom("rampe"), passagers: nom("passagers"), flous,
      cordes: [nom("corde0"), nom("corde1")], flammes: [nom("flamme0"), nom("flamme1")], angleRampe: -PENTE_RAMPE,
    };
  }

  // ------------------------------------------------------------------ la version SIMPLE, pour de loin (des instances)
  // (étape 74) La même coque arrondie, mais avec beaucoup moins de points, les vitres sombres peintes dans les sommets,
  // et des rotors en disques fins : 1 seule pièce.
  function formeSimple(sorte, equipe) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    const g = new THREE.Group(), P = peintureDe(equipe), E = Tanks.CONFIG.equipes[equipe], c = new THREE.Color(P);
    const peinte = (cles, zone) => {
      const r = O.coque(cles, { tours: 14, pas: 0.9, couleur: () => [c.r, c.g, c.b], zone });
      for (const nom in r.geos) {
        if (nom !== "peinture" && nom !== "coque") repeindre(r.geos[nom], nom === "verre" ? 0x1a2228 : COUL.interieur);
        g.add(O.piece(r.geos[nom], mat));
      }
    };
    const b = (lx, ly, lz, x, y, z, coul, ry) => {
      const p = O.boite(lx, ly, lz, mat, x, y, z, coul);
      if (ry) p.rotation.y = ry;
      g.add(p);
    };
    const disque = (x, y, r) => g.add(O.piece(new THREE.CylinderGeometry(r, r, 0.04, 20), mat, x, y, 0, 0x3a3d40));
    if (sorte === "chinook") {
      peinte([{ x: -7.95, y: 2.8, w: 1.16, h: 0.8, b: 0.8, n: 4 }, { x: -5.6, y: 2.36, w: 1.28, h: 1.24, b: 1.21, n: 4 }, { x: 5.1, y: 2.34, w: 1.27, h: 1.2, b: 1.19, n: 4 }, { x: 7.05, y: 2.1, w: 1.0, h: 0.86, b: 0.92, n: 3 }, { x: 7.9, y: 1.8, w: 0.05, h: 0.05 }], (cc, n) => (cc.x > 6.5 && cc.y > 2.0 && n.x > 0.2 ? "verre" : "peinture"));
      peinte([{ x: -8.05, y: 3.8, w: 0.3, h: 0.4 }, { x: -6.3, y: 3.98, w: 0.74, h: 1.22, b: 0.5, n: 3 }, { x: -3.6, y: 3.7, w: 0.6, h: 0.5, b: 0.3, n: 3 }, { x: -2.5, y: 3.55, w: 0.2, h: 0.05 }]);
      peinte([{ x: 2.5, y: 3.5, w: 0.22, h: 0.06 }, { x: 5.2, y: 3.62, w: 0.74, h: 0.62, b: 0.2, n: 3 }, { x: 7.15, y: 3.3, w: 0.05, h: 0.05 }]);
      for (const s of [-1, 1]) {
        peinte([{ x: -4.8, y: 1.42, w: 0.1, h: 0.12, z: s * 1.42 }, { x: -4.1, y: 1.47, w: 0.42, h: 0.5, n: 3, z: s * 1.46 }, { x: 2.6, y: 1.47, w: 0.42, h: 0.5, n: 3, z: s * 1.46 }, { x: 3.55, y: 1.44, w: 0.1, h: 0.12, z: s * 1.42 }]);
        peinte([{ x: -7.4, y: 4.08, w: 0.22, h: 0.22, z: s * 1.26 }, { x: -6.3, y: 4.08, w: 0.38, h: 0.38, z: s * 1.26 }, { x: -3.45, y: 4.08, w: 0.32, h: 0.32, z: s * 1.26 }]);
        b(1.0, 0.34, 0.04, -0.8, 3.0, s * 1.29, E.marque);
      }
      disque(5.9, 4.62, 9.15);
      disque(-6.1, 5.62, 9.15);
    } else {
      peinte([{ x: -2.65, y: 1.98, w: 0.78, h: 0.74, b: 0.9, n: 3 }, { x: -2.0, y: 1.78, w: 1.12, h: 0.95, b: 1.02, n: 3.4 }, { x: 2.2, y: 1.75, w: 1.15, h: 0.95, b: 1.0, n: 3.4 }, { x: 3.72, y: 1.48, w: 0.84, h: 0.6, b: 0.74, n: 2.8 }, { x: 4.43, y: 1.23, w: 0.05, h: 0.05 }], (cc, n) => (cc.x > 3.2 && cc.y > 1.7 && n.x > 0.2 ? "verre" : cc.x > -1.3 && cc.x < 0.42 && cc.y > 0.95 && cc.y < 2.45 && Math.abs(n.z) > 0.5 ? "interieur" : "peinture"));
      peinte([{ x: -9.95, y: 2.52, w: 0.06, h: 0.06 }, { x: -9.0, y: 2.42, w: 0.2, h: 0.23 }, { x: -3.4, y: 2.1, w: 0.5, h: 0.5 }, { x: -2.2, y: 1.98, w: 0.74, h: 0.7, b: 0.8 }]);
      peinte([{ x: -2.85, y: 2.72, w: 0.3, h: 0.06 }, { x: -2.25, y: 2.78, w: 0.76, h: 0.32, b: 0.15, n: 3 }, { x: 0.95, y: 2.8, w: 0.78, h: 0.34, b: 0.15, n: 3 }, { x: 1.85, y: 2.68, w: 0.08, h: 0.04 }]);
      g.add(O.piece(O.profil([[-8.65, 2.4], [-9.95, 2.4], [-10.78, 4.45], [-10.22, 4.52], [-9.25, 3.0]], 0.26, mat, 0).geometry, mat, 0, 0, 0, P));
      b(0.85, 0.07, 4.3, -9.55, 2.12, 0, P);
      disque(0.35, 3.72, 8.18);
      for (const s of [-1, 1]) b(1.4, 0.3, 0.04, -5.4, 2.3, s * 0.33, E.marque);
    }
    const [piece] = O.souder(g, false);
    return piece.geometry;
  }
  function lotSimple(sorte, equipe, max) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.12 });
    const lot = new THREE.InstancedMesh(formeSimple(sorte, equipe), mat, max);
    lot.count = 0;
    lot.frustumCulled = false;
    lot.castShadow = false;
    lot.receiveShadow = true;
    lot.setColorAt(0, new THREE.Color(1, 1, 1));
    return lot;
  }

  return { sait, fabriquer, lotSimple, SORTES, PENTE_RAMPE };
})();
