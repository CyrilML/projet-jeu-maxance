// 🛠️ LES MODÈLES : le carrossier (étape 38 : version réaliste, avec Three.js)
//
// Comment dessiner une voiture ronde et réaliste ? Comme un vrai designer automobile :
//   1. on dessine son PROFIL, vu de côté (le nez, le capot, le pare-brise, le toit, le coffre,
//      les passages de roues en demi-cercle…), avec des coins ARRONDIS ;
//   2. on « EXTRUDE » ce profil sur toute la largeur de la voiture, comme un emporte-pièce dans de la pâte :
//      le dessin plat devient un volume. Les bords sont arrondis (un « chanfrein ») ;
//   3. on ajoute les vitres, les roues (pneu + jante chromée + rayons), les phares qui brillent…
//
// Les MATÉRIAUX disent comment chaque surface renvoie la lumière : la peinture est brillante et vernie
// (elle reflète le ciel), le pneu est mat, la jante est en métal, le phare émet sa propre lumière.
//
// Toutes les voitures sont construites « nez vers x+ », posées au sol (y = 0), centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.Modeles = (function () {
  const M = {}; // les matériaux, fabriqués une fois

  function materiaux() {
    if (M.pneu) return M;
    M.vitre = new THREE.MeshPhysicalMaterial({ color: 0x0f1a26, metalness: 0.1, roughness: 0.05, clearcoat: 1, envMapIntensity: 0.9 });
    M.noir = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.2 });
    M.pneu = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.95 });
    M.chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.18 });
    M.jante = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.9, roughness: 0.3 });
    M.phare = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1.6, roughness: 0.2 });
    M.feu = new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff1010, emissiveIntensity: 1.2, roughness: 0.3 });
    M.casque = new THREE.MeshPhysicalMaterial({ color: 0xffd21a, roughness: 0.25, clearcoat: 1 });
    M.siege = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8 });
    // Étape 49 : le plastique noir (pare-chocs, bas de caisse), le disque de frein, le rouge-orangé des clignotants.
    M.plastique = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.75, metalness: 0.05 });
    M.disque = new THREE.MeshStandardMaterial({ color: 0x8a8d92, metalness: 0.8, roughness: 0.35 });
    M.orange = new THREE.MeshStandardMaterial({ color: 0xaa5500, emissive: 0xff8a10, emissiveIntensity: 0.6, roughness: 0.3 });
    // Étape 55 : les blocs optiques (un boîtier chromé foncé, des LED qui brillent, une lentille de verre par-dessus).
    M.boitier = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.85, roughness: 0.32 });
    M.lentille = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.02, clearcoat: 1, transparent: true, opacity: 0.22, depthWrite: false });
    M.led = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, emissive: 0xe8f0ff, emissiveIntensity: 1.4, roughness: 0.15, metalness: 0.3 });
    M.feuLed = new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff1208, emissiveIntensity: 2.4, roughness: 0.3 });
    M.feuVerre = new THREE.MeshPhysicalMaterial({ color: 0x6a0606, metalness: 0.1, roughness: 0.05, clearcoat: 1, emissive: 0x400000, emissiveIntensity: 0.6 });
    M.vitreFumee = new THREE.MeshPhysicalMaterial({ color: 0x202830, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.7, clearcoat: 1 });
    return M;
  }

  // La peinture de carrosserie : une couleur brillante, avec un vernis (clearcoat) qui reflète le ciel.
  const peintures = {};
  function peinture(rgb) {
    const cle = rgb.join(",");
    if (!peintures[cle]) {
      peintures[cle] = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(rgb[0], rgb[1], rgb[2]).convertSRGBToLinear(),
        metalness: 0.55, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08,
      });
    }
    return peintures[cle];
  }

  // Un profil (une liste de points [x, y, arrondi]) → une forme plate aux coins arrondis.
  function forme(points) {
    const s = new THREE.Shape();
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const [x, y, r] = points[i];
      const avant = points[(i - 1 + n) % n], apres = points[(i + 1) % n];
      if (!r) {
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
        continue;
      }
      // Coin arrondi : on s'arrête un peu avant le coin, et on tourne en courbe jusqu'un peu après.
      const d1 = Math.hypot(avant[0] - x, avant[1] - y), d2 = Math.hypot(apres[0] - x, apres[1] - y);
      const r1 = Math.min(r, d1 / 2), r2 = Math.min(r, d2 / 2);
      const a = [x + ((avant[0] - x) * r1) / d1, y + ((avant[1] - y) * r1) / d1];
      const b = [x + ((apres[0] - x) * r2) / d2, y + ((apres[1] - y) * r2) / d2];
      if (i === 0) s.moveTo(a[0], a[1]);
      else s.lineTo(a[0], a[1]);
      s.quadraticCurveTo(x, y, b[0], b[1]);
    }
    s.closePath();
    return s;
  }

  // Extrude un profil sur une largeur, centré en z = 0, avec des bords arrondis.
  function extruder(points, largeur, materiau, chanfrein) {
    const c = chanfrein === undefined ? 0.1 : chanfrein;
    const geo = new THREE.ExtrudeGeometry(forme(points), {
      depth: Math.max(0.01, largeur - 2 * c), bevelEnabled: c > 0, bevelThickness: c, bevelSize: c, bevelSegments: 4, curveSegments: 10,
    });
    geo.translate(0, 0, -(largeur - 2 * c) / 2);
    const m = new THREE.Mesh(geo, materiau);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // Un demi-cercle de points au-dessus d'une roue (le passage de roue), de gauche à droite.
  function passage(x, rayon, centreY) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI - (i / 10) * Math.PI;
      pts.push([x + Math.cos(a) * rayon, centreY + Math.sin(a) * rayon, 0]);
    }
    return pts;
  }

  function boite(lx, ly, lz, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), materiau);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }

  function cylindre(rayon, longueur, materiau, segments) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, longueur, segments || 20), materiau);
    m.castShadow = true;
    return m;
  }

  // Un tube entre deux points (pour l'arceau du buggy).
  function tube(a, b, rayon, materiau) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = cylindre(rayon, va.distanceTo(vb), materiau, 8);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return m;
  }

  // Une roue : le pneu, la jante et ses rayons (pour la voir tourner).
  // Le « pivot » tourne pour braquer, la « roue » tourne sur elle-même pour rouler.
  // Étape 49 : le pneu a des flancs arrondis (une forme « tournée », comme un vase sur un tour de potier),
  // la jante est creuse avec de fins rayons, et derrière on voit le DISQUE DE FREIN et son ÉTRIER (qui ne tourne pas).
  // options : { rayons (combien, 5 par défaut), etrier (la couleur de l'étrier), crampons (des pavés sur le pneu) }
  const formesPneu = {};
  function formePneu(rayon, epaisseur) {
    const cle = rayon + "/" + epaisseur;
    if (formesPneu[cle]) return formesPneu[cle];
    const e = epaisseur / 2, j = rayon * 0.66, pts = [];
    // le profil du pneu, vu en coupe : de la jante (côté gauche) au sommet arrondi, puis à la jante (côté droit)
    pts.push(new THREE.Vector2(j, -e * 0.92));
    for (let i = 0; i <= 12; i++) {
      const a = -Math.PI / 2 + (i / 12) * Math.PI;
      pts.push(new THREE.Vector2(rayon - e * 0.35 + Math.cos(a) * e * 0.35, Math.sin(a) * e));
    }
    pts.push(new THREE.Vector2(j, e * 0.92));
    const geo = new THREE.LatheGeometry(pts, 32);
    geo.rotateX(Math.PI / 2); // l'axe de la roue est z
    return (formesPneu[cle] = geo);
  }
  function roue(rayon, epaisseur, jante, options) {
    const o = options || {};
    const pivot = new THREE.Group();
    const r = new THREE.Group();
    const pneu = new THREE.Mesh(formePneu(rayon, epaisseur), M.pneu);
    pneu.castShadow = true;
    r.add(pneu);
    const metal = jante || M.jante;
    const nombre = o.rayons || 5;
    for (const cote of [-1, 1]) {
      const z = (cote * epaisseur) / 2;
      // le fond de la jante (sombre, en retrait), puis le bord de la jante (un anneau de métal)
      const fond = cylindre(rayon * 0.64, 0.03, M.noir, 24);
      fond.rotation.x = Math.PI / 2;
      fond.position.z = z * 0.4;
      r.add(fond);
      const levre = new THREE.Mesh(new THREE.TorusGeometry(rayon * 0.64, rayon * 0.035, 6, 28), metal);
      levre.position.z = z * 0.92;
      r.add(levre);
      for (let k = 0; k < nombre; k++) {
        const rayonJante = boite(rayon * 0.6, rayon * 0.1, 0.035, metal, 0, 0, z * 0.85);
        rayonJante.geometry.translate(rayon * 0.3, 0, 0);
        rayonJante.rotation.z = (k * Math.PI * 2) / nombre;
        r.add(rayonJante);
      }
      const moyeu = cylindre(rayon * 0.16, 0.06, metal, 12);
      moyeu.rotation.x = Math.PI / 2;
      moyeu.position.z = z * 0.9;
      r.add(moyeu);
    }
    // des crampons (pour le quad et le monster truck) : des petits pavés tout autour du pneu
    if (o.crampons) {
      const n = Math.round(rayon * 22);
      const pave = new THREE.BoxGeometry(rayon * 0.16, rayon * 0.07, epaisseur * 0.42);
      const im = new THREE.InstancedMesh(pave, M.pneu, n * 2);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), axe = new THREE.Vector3(0, 0, 1);
      for (let k = 0; k < n * 2; k++) {
        const a = ((k >> 1) / n) * Math.PI * 2 + (k % 2) * (Math.PI / n), dz = (k % 2 ? 1 : -1) * epaisseur * 0.22;
        q.setFromAxisAngle(axe, a + (k % 2 ? 0.35 : -0.35));
        m4.compose(new THREE.Vector3(Math.cos(a) * rayon * 0.99, Math.sin(a) * rayon * 0.99, dz), q, new THREE.Vector3(1, 1, 1));
        im.setMatrixAt(k, m4);
      }
      im.castShadow = true;
      r.add(im);
    }
    pivot.add(r);
    // le disque de frein et l'étrier : accrochés au pivot (ils braquent avec la roue, mais ne tournent pas)
    if (o.etrier !== false) {
      for (const cote of [-1, 1]) {
        const disque = cylindre(rayon * 0.48, 0.025, M.disque, 20);
        disque.rotation.x = Math.PI / 2;
        disque.position.z = (cote * epaisseur) / 2 * 0.2;
        pivot.add(disque);
        const etrier = boite(rayon * 0.26, rayon * 0.2, 0.09, o.etrier ? peinture(o.etrier) : M.noir, rayon * 0.32, rayon * 0.2, (cote * epaisseur) / 2 * 0.3);
        etrier.rotation.z = 0.6;
        pivot.add(etrier);
      }
    }
    return { pivot, roue: r };
  }

  // Une voiture « classique » à partir de quelques nombres :
  //   L = longueur, W = largeur, r = rayon des roues, xAv / xAr = position des roues, g = hauteur du bas de caisse,
  //   hNez, hCapot, hCeinture (le haut des portières), hCoffre, hToit, xPareBrise (bas du pare-brise),
  //   xToitAv / xToitAr (le toit), xLunette (bas de la vitre arrière), Wtoit = largeur du toit.
  function carrosserie(p, k1, k2) {
    const g = new THREE.Group();
    const ra = p.r + 0.07; // le passage de roue est un peu plus grand que la roue
    // Le profil, de l'arrière-bas vers l'avant (en passant au-dessus des roues), puis le haut vers l'arrière.
    let profil = [[-p.L / 2, p.g + 0.08, 0.15]];
    if (p.passages !== false) {
      profil = profil.concat([[p.xAr - ra, p.g, 0]], passage(p.xAr, ra, p.r), [[p.xAr + ra, p.g, 0], [p.xAv - ra, p.g, 0]], passage(p.xAv, ra, p.r), [[p.xAv + ra, p.g, 0]]);
    }
    // (Étape 49 : une vraie voiture peut donner son propre dessus, p.dessus, du bas du nez au bas de l'arrière.)
    profil = profil.concat(p.dessus || [
      [p.L / 2, p.g + 0.05, 0.12],
      [p.L / 2 + 0.03, p.hNez, p.rondNez || 0.25],
      [p.L / 2 - 0.55, p.hCapot, 0.4],
      [p.xPareBrise, p.hCeinture, 0.1],
      [p.xLunette, p.hCeinture, 0.1],
      [-p.L / 2 + 0.25, p.hCoffre, 0.25],
      [-p.L / 2, p.hCoffre - 0.2, 0.15],
    ]);
    const corps = extruder(profil, p.W, peinture(k1), p.chanfrein === undefined ? 0.12 : p.chanfrein);
    if (p.galbe) galber(corps.geometry, p);
    g.add(corps);
    g.corps = corps;
    // La cabine vitrée, puis le toit peint par-dessus.
    const cabine = p.cabine || [
      [p.xPareBrise, p.hCeinture - 0.02, 0.05],
      [p.xToitAv, p.hToit, 0.25],
      [p.xToitAr, p.hToit, 0.3],
      [p.xLunette, p.hCeinture - 0.02, 0.05],
    ];
    const couleurToit = peinture(p.toitCouleur2 ? k2 : k1);
    if (p.galbe) {
      // Étape 49 : les vraies voitures. La cabine est PEINTE (le toit et les montants), et on y pose de vraies
      // vitres : le pare-brise, les vitres des côtés et la lunette arrière.
      const habitacle = extruder(cabine, p.Wtoit, couleurToit, 0.08);
      galber(habitacle.geometry, p, true);
      g.add(habitacle);
      poserVitres(g, p, cabine);
    } else {
      const vitres = extruder(cabine, p.Wtoit, M.vitre, 0.08);
      g.add(vitres);
      const toit = [
        [p.xToitAv + 0.12, p.hToit - 0.04, 0.05],
        [p.xToitAv + 0.06, p.hToit + 0.03, 0.05],
        [p.xToitAr - 0.06, p.hToit + 0.03, 0.05],
        [p.xToitAr - 0.12, p.hToit - 0.04, 0.05],
      ];
      g.add(extruder(toit, p.Wtoit + 0.02, couleurToit, 0.03));
      // Le montant entre les vitres (couleur de la carrosserie).
      const milieu = (p.xToitAv + p.xToitAr) / 2;
      g.add(boite(0.1, p.hToit - p.hCeinture, p.Wtoit + 0.02, couleurToit, milieu, (p.hToit + p.hCeinture) / 2, 0));
    }
    if (p.details === false) return g; // (étape 49 : les vraies voitures dessinent leurs propres phares)
    // Phares, feux, calandre, rétroviseurs.
    for (const z of [-1, 1]) {
      const phare = boite(0.08, 0.1, 0.38, M.phare, p.L / 2 - 0.02, p.hNez + 0.02, z * (p.W / 2 - 0.32));
      phare.rotation.z = -0.4;
      g.add(phare);
      g.add(boite(0.06, 0.1, 0.42, M.feu, -p.L / 2 - 0.01, p.hCoffre - 0.15, z * (p.W / 2 - 0.3)));
      g.add(boite(0.18, 0.1, 0.12, peinture(k1), p.xPareBrise - 0.1, p.hCeinture + 0.08, z * (p.W / 2 + 0.05)));
    }
    g.add(boite(0.05, 0.12, p.W * 0.45, M.noir, p.L / 2 + 0.02, p.g + 0.2, 0)); // la calandre
    return g;
  }

  // Étape 49 : les vitres d'une cabine peinte. La cabine a 4 coins : A (bas du pare-brise), B (haut du pare-brise),
  // C (haut de la lunette arrière), D (bas de la lunette arrière).
  function poserVitres(g, p, cabine) {
    if (!M.vitre.side || M.vitre.side !== THREE.DoubleSide) M.vitre.side = THREE.DoubleSide;
    const [A, B, C, D] = cabine;
    const largeur = (x, y) => (p.Wtoit / 2) * largeurIci(p, x, y, true);
    // Un point sur le segment de P à Q, à `d` mètres de P.
    const vers = (P, Q, d) => {
      const l = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
      return [P[0] + ((Q[0] - P[0]) * d) / l, P[1] + ((Q[1] - P[1]) * d) / l];
    };
    // Une vitre posée sur une pente (le pare-brise, la lunette) : un quadrilatère un peu au-dessus de la cabine.
    function pente(P, Q, rP, rQ) {
      const a = vers(P, Q, (rP || 0.05) + 0.04), b = vers(Q, P, (rQ || 0.25) + 0.03);
      let nx = -(b[1] - a[1]), ny = b[0] - a[0];
      const l = Math.hypot(nx, ny);
      nx /= l;
      ny /= l;
      if (ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      const e = 0.092; // juste au-dessus de la peinture (la cabine arrondie déborde de 8 cm de son dessin)
      const coin = (q, cote) => [q[0] + nx * e, q[1] + ny * e, cote * (largeur(q[0], q[1]) - 0.1)];
      const pts = [coin(a, -1), coin(a, 1), coin(b, 1), coin(b, -1)];
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
      geo.setIndex([0, 1, 2, 0, 2, 3]);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, M.vitre));
    }
    pente(A, B, A[2], B[2]);
    pente(D, C, D[2], C[2]);
    // Les vitres des côtés : le contour de la cabine, rétréci de 7 cm (il reste les montants peints autour).
    // Rétrécir un contour : on pousse chaque côté de 7 cm vers l'intérieur, et on prend les croisements des côtés.
    const pts = [A, B, C, D].map((q) => [q[0], q[1]]);
    let aire = 0;
    for (let i = 0; i < 4; i++) aire += pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1];
    const sensInterieur = aire > 0 ? 1 : -1;
    const lignes = pts.map((q, i) => {
      const r = pts[(i + 1) % 4], dx = r[0] - q[0], dy = r[1] - q[1], l = Math.hypot(dx, dy);
      const nx = (-dy / l) * sensInterieur, ny = (dx / l) * sensInterieur;
      return { x: q[0] + nx * 0.07, y: q[1] + ny * 0.07, dx, dy };
    });
    const croisement = (l1, l2) => {
      const det = l1.dx * l2.dy - l1.dy * l2.dx;
      const t = ((l2.x - l1.x) * l2.dy - (l2.y - l1.y) * l2.dx) / det;
      return [l1.x + l1.dx * t, l1.y + l1.dy * t];
    };
    const cote = lignes.map((l, i) => croisement(lignes[(i + 3) % 4], l));
    const contour = forme(cote.map((q, i) => [q[0], q[1], i === 1 || i === 2 ? 0.14 : 0.04]));
    for (const sens of [-1, 1]) {
      const geo = new THREE.ShapeGeometry(contour, 8);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, sens * (largeur(pos.getX(i), pos.getY(i)) + 0.006));
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, M.vitre));
      // le montant du milieu (peint), entre la vitre de devant et celle de derrière
      if (p.montantX !== undefined) {
        const y = (p.hCeinture + p.hToit) / 2;
        const m = boite(0.08, p.hToit - p.hCeinture - 0.08, 0.01, M.noir, p.montantX, y, sens * (largeur(p.montantX, y) + 0.012));
        g.add(m);
      }
    }
  }

  // Étape 49 : GALBER une carrosserie. Une vraie voiture n'est pas une boîte : vue de dessus, elle est plus étroite
  // au nez et à l'arrière (le « pincement ») ; vue de face, ses flancs rentrent vers le haut (le « galbe »).
  // On déplace chaque point de la forme : z (la largeur) est multiplié par un nombre un peu plus petit que 1.
  // p.galbe = { nez, arriere (le pincement, ex. 0.15 = 15 % plus étroit tout au bout), haut (le galbe) }
  function largeurIci(p, x, y, vitre) {
    const G = p.galbe, xn = x / (p.L / 2);
    // Les coins arrondis vus de dessus : à partir de 45 % de la demi-longueur, la largeur suit un quart de cercle
    // (elle diminue de plus en plus vite jusqu'au bout). Au bout, elle a perdu `nez` (ou `arriere`).
    const u = Math.min(1, Math.max(0, (Math.abs(xn) - 0.4) / 0.63));
    const pince = 1 - (xn > 0 ? G.nez : G.arriere) * (1 - Math.sqrt(1 - u * u));
    const bas = (p.g + p.hCeinture) / 2;
    const t = Math.max(0, Math.min(1, (y - bas) / Math.max(0.1, p.hToit - bas)));
    return pince * (1 - G.haut * t * t * (vitre ? 0.6 : 1));
  }
  function galber(geo, p, vitre) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) * largeurIci(p, pos.getX(i), pos.getY(i), vitre));
    geo.computeVertexNormals();
  }
  // La demi-largeur de la carrosserie à l'endroit (x, y) : pour coller les phares et les poignées sur ses flancs.
  const bord = (p, x, y) => (p.W / 2) * (p.galbe ? largeurIci(p, x, y) : 1);
  // Où est l'avant (ou l'arrière) de la carrosserie à la hauteur y ? On cherche dans le dessus du profil le morceau
  // qui passe à cette hauteur. (+ le chanfrein : l'extrusion arrondie déborde un peu du dessin.)
  function bout(p, y, avant) {
    const d = p.dessus, c = p.chanfrein === undefined ? 0.12 : p.chanfrein;
    let meilleur = null;
    for (let i = 0; i < d.length - 1; i++) {
      const [x1, y1] = d[i], [x2, y2] = d[i + 1];
      if ((y - y1) * (y - y2) > 0 || y1 === y2) continue;
      const x = x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
      if (meilleur === null || (avant ? x > meilleur : x < meilleur)) meilleur = x;
    }
    return meilleur === null ? (avant ? p.L / 2 : -p.L / 2) : meilleur + (avant ? c : -c);
  }

  // Les roues d'un modèle (positions et taille), ajoutées au groupe.
  function ajouterRoues(g, xs, z, rayon, epaisseur, jante, options) {
    const roues = [];
    for (const [x, avant] of xs) {
      for (const cote of [-1, 1]) {
        const r = roue(rayon, epaisseur, jante, options);
        r.pivot.position.set(x, rayon, cote * z);
        g.add(r.pivot);
        roues.push(Object.assign(r, { avant }));
      }
    }
    return roues;
  }

  // ---------------------------------------------------------------- les 5 voitures du circuit

  function classique(k1, k2) {
    const p = { L: 4.4, W: 1.86, r: 0.34, xAv: 1.32, xAr: -1.33, g: 0.2, hNez: 0.62, hCapot: 0.85, hCeinture: 0.95, hCoffre: 0.97,
      hToit: 1.38, xPareBrise: 0.75, xToitAv: 0.1, xToitAr: -0.85, xLunette: -1.45, Wtoit: 1.5 };
    const g = carrosserie(p, k1, k2);
    // l'aileron et la bande de course
    g.add(boite(0.35, 0.05, 1.8, M.noir, -2.05, 1.25, 0));
    for (const z of [-0.65, 0.65]) g.add(boite(0.08, 0.28, 0.06, M.noir, -2.05, 1.1, z));
    g.add(boite(1.4, 0.01, 0.35, peinture([0.95, 0.95, 0.95]), 1.3, 0.9, 0));
    return { g, roues: ajouterRoues(g, [[1.32, true], [-1.33, false]], 0.88, 0.34, 0.26), yCapot: 1.2 };
  }

  function f1(k1, k2) {
    const g = new THREE.Group();
    // Le corps : très fin, avec le nez pointu et la prise d'air au-dessus du pilote.
    g.add(extruder([[2.7, 0.22, 0.05], [2.7, 0.34, 0.1], [1.0, 0.62, 0.3], [0.55, 0.66, 0.05], [-0.1, 0.66, 0.05], [-0.2, 1.05, 0.15], [-0.6, 1.0, 0.3], [-2.1, 0.55, 0.2], [-2.1, 0.2, 0.05]], 0.62, peinture(k1), 0.08));
    g.add(extruder([[0.5, 0.18, 0.1], [0.4, 0.55, 0.25], [-1.6, 0.48, 0.25], [-1.7, 0.18, 0.1]], 1.45, peinture(k1), 0.1)); // les pontons
    g.add(boite(0.65, 0.05, 0.5, M.noir, 0.25, 0.67, 0)); // le trou du cockpit
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), M.casque);
    casque.position.set(0.15, 0.82, 0);
    g.add(casque);
    g.add(boite(0.06, 0.06, 0.28, M.noir, 0.3, 0.84, 0)); // la visière
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.03, 8, 16, Math.PI), M.noir);
    halo.position.set(0.2, 0.82, 0);
    halo.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    g.add(halo);
    // Les ailerons.
    g.add(boite(0.45, 0.04, 2.0, peinture(k2), 2.5, 0.12, 0));
    g.add(boite(0.3, 0.03, 1.8, peinture(k1), 2.4, 0.2, 0));
    for (const z of [-1, 1]) g.add(boite(0.5, 0.22, 0.03, peinture(k2), 2.5, 0.2, z * 1.0));
    g.add(boite(0.45, 0.05, 1.45, peinture(k2), -2.15, 1.0, 0));
    g.add(boite(0.35, 0.04, 1.45, peinture(k1), -2.15, 1.1, 0));
    for (const z of [-1, 1]) g.add(boite(0.5, 0.5, 0.03, peinture(k2), -2.15, 0.85, z * 0.73));
    g.add(boite(0.06, 0.08, 0.12, M.feu, -2.12, 0.4, 0));
    return { g, roues: ajouterRoues(g, [[1.75, true], [-1.6, false]], 0.95, 0.45, 0.42), yCapot: 1.1 };
  }

  // ---------------------------------------------------------------- les 4 véhicules du parcours

  function quatre(k1, k2) {
    const p = { L: 4.5, W: 1.95, r: 0.48, xAv: 1.45, xAr: -1.45, g: 0.5, hNez: 1.05, rondNez: 0.12, hCapot: 1.2, hCeinture: 1.28, hCoffre: 1.28,
      hToit: 2.0, xPareBrise: 0.95, xToitAv: 0.7, xToitAr: -2.0, xLunette: -2.12, Wtoit: 1.84 };
    const g = carrosserie(p, k1, k2);
    // La roue de secours derrière, les barres de toit, le pare-buffle.
    const secours = cylindre(0.4, 0.22, M.pneu, 20);
    secours.rotation.z = Math.PI / 2;
    secours.position.set(-2.38, 1.15, 0);
    g.add(secours);
    for (const x of [-1.6, -0.6, 0.3]) g.add(boite(0.06, 0.06, 1.9, M.noir, x, 2.08, 0));
    g.add(boite(0.08, 0.5, 1.6, M.noir, 2.3, 0.85, 0));
    for (const z of [-1, 1]) g.add(boite(3.0, 0.08, 0.15, M.noir, 0, 0.55, z * 1.02)); // les marchepieds
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.45, false]], 0.98, 0.48, 0.36), yCapot: 1.8 };
  }

  function pickup(k1, k2) {
    const p = { L: 5.1, W: 2.0, r: 0.46, xAv: 1.7, xAr: -1.6, g: 0.45, hNez: 1.0, hCapot: 1.18, hCeinture: 1.25, hCoffre: 1.3,
      hToit: 1.95, xPareBrise: 1.15, xToitAv: 0.75, xToitAr: -0.35, xLunette: -0.45, Wtoit: 1.85 };
    const g = carrosserie(p, k1, k2);
    // La benne : un fond sombre et des parois.
    g.add(boite(2.0, 0.02, 1.75, M.noir, -1.5, 1.27, 0));
    for (const z of [-1, 1]) g.add(boite(2.1, 0.32, 0.08, peinture(k1), -1.5, 1.44, z * 0.93));
    g.add(boite(0.08, 0.32, 1.9, peinture(k1), -2.52, 1.44, 0));
    g.add(boite(0.08, 0.32, 1.9, peinture(k2), -0.48, 1.44, 0));
    return { g, roues: ajouterRoues(g, [[1.7, true], [-1.6, false]], 1.0, 0.46, 0.34), yCapot: 1.75 };
  }

  function buggy(k1, k2) {
    const g = new THREE.Group();
    g.add(extruder([[1.9, 0.3, 0.1], [1.8, 0.55, 0.15], [0.6, 0.6, 0.1], [-1.5, 0.75, 0.15], [-1.6, 0.3, 0.1]], 1.2, peinture(k1), 0.1)); // la coque
    g.add(boite(0.55, 0.6, 0.55, M.siege, -0.2, 0.95, 0));
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), M.casque);
    casque.position.set(-0.1, 1.42, 0);
    g.add(casque);
    // L'arceau : des tubes qui forment une cage.
    const t = (a, b) => g.add(tube(a, b, 0.04, M.noir));
    for (const z of [-0.55, 0.55]) {
      t([0.55, 0.55, z], [0.25, 1.75, z * 0.85]);
      t([-0.95, 0.65, z], [-0.85, 1.75, z * 0.85]);
      t([0.25, 1.75, z * 0.85], [-0.85, 1.75, z * 0.85]);
      t([0.55, 0.55, z], [1.8, 0.55, z * 0.6]);
    }
    t([0.25, 1.75, -0.47], [0.25, 1.75, 0.47]);
    t([-0.85, 1.75, -0.47], [-0.85, 1.75, 0.47]);
    g.add(boite(0.55, 0.5, 0.9, M.noir, -1.4, 0.95, 0)); // le moteur, derrière
    g.add(boite(0.2, 0.05, 1.3, peinture(k2), -1.75, 1.32, 0)); // le petit aileron
    for (const z of [-0.35, 0.35]) g.add(boite(0.06, 0.14, 0.18, M.phare, 1.92, 0.5, z));
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.3, false]], 1.05, 0.46, 0.4), yCapot: 1.5 };
  }

  // ---------------------------------------------------------------- étape 39 : le garage de la ville

  // Le camion : une cabine haute, un grand caisson, et 6 roues.
  function camion(k1, k2) {
    const g = new THREE.Group();
    // La cabine (à l'avant).
    g.add(extruder([[3.6, 0.7, 0.1], [3.65, 1.7, 0.3], [3.4, 3.0, 0.3], [1.9, 3.05, 0.2], [1.9, 0.7, 0.05]], 2.3, peinture(k1), 0.1));
    g.add(extruder([[3.62, 1.95, 0.05], [3.42, 2.85, 0.1], [3.3, 2.85, 0.05], [3.5, 1.95, 0.05]], 2.0, M.vitre, 0.04)); // le pare-brise
    for (const z of [-1, 1]) {
      g.add(boite(0.9, 0.7, 0.03, M.vitre, 2.9, 2.35, z * 1.15)); // les vitres de côté
      g.add(boite(0.08, 0.14, 0.4, M.phare, 3.68, 1.0, z * 0.85));
      g.add(boite(0.06, 0.3, 0.15, M.noir, 3.3, 2.4, z * 1.3)); // les rétroviseurs
    }
    g.add(boite(0.06, 0.4, 1.4, M.chrome, 3.7, 1.25, 0)); // la calandre
    // Le grand caisson (couleur 2), et le châssis.
    g.add(extruder([[1.75, 0.85, 0.05], [1.75, 3.6, 0.1], [-4.2, 3.6, 0.1], [-4.2, 0.85, 0.05]], 2.45, peinture(k2), 0.05));
    g.add(boite(7.6, 0.3, 1.2, M.noir, -0.3, 0.65, 0));
    for (const z of [-1, 1]) g.add(boite(0.06, 0.15, 0.5, M.feu, -4.22, 1.1, z * 0.9));
    return { g, roues: ajouterRoues(g, [[2.7, true], [-2.0, false], [-3.2, false]], 1.05, 0.5, 0.4), yCapot: 3.2 };
  }

  // ---------------------------------------------------------------- étape 40 : les nouveaux véhicules

  // Une petite toile avec un texte (pour le panneau TAXI et les autocollants du rallye).
  function etiquette(texte, fond, encre, largeur, hauteur) {
    const toile = document.createElement("canvas");
    toile.width = 256;
    toile.height = 96;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = encre;
    ctx.font = "bold 64px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 128, 52, 240);
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  }

  // La voiture de rallye : une petite compacte, un grand aileron, des autocollants et des phares sur le capot.
  function rallye(k1, k2) {
    const p = { L: 4.2, W: 1.9, r: 0.36, xAv: 1.3, xAr: -1.3, g: 0.24, hNez: 0.66, rondNez: 0.25, hCapot: 0.88, hCeinture: 0.98, hCoffre: 1.05,
      hToit: 1.45, xPareBrise: 0.75, xToitAv: 0.15, xToitAr: -1.6, xLunette: -1.85, Wtoit: 1.6 };
    const g = carrosserie(p, k1, k2);
    g.add(boite(0.45, 0.06, 1.85, peinture(k2), -2.0, 1.55, 0)); // le grand aileron
    for (const z of [-0.7, 0.7]) g.add(boite(0.25, 0.4, 0.06, peinture(k2), -1.95, 1.33, z));
    for (const z of [-1, 1]) {
      // Une large bande et un numéro sur chaque portière.
      g.add(boite(3.6, 0.22, 0.02, peinture(k2), 0, 0.62, z * 0.97));
      const numero = etiquette("7", "#ffffff", "#111111", 0.55, 0.42);
      numero.position.set(-0.1, 0.8, z * 0.99);
      if (z < 0) numero.rotation.y = Math.PI;
      g.add(numero);
    }
    g.add(boite(1.2, 0.01, 0.4, peinture(k2), 1.45, 0.89, 0)); // la bande sur le capot
    for (const z of [-0.4, -0.13, 0.13, 0.4]) {
      // La rampe de phares de nuit, sur le capot.
      const phare = cylindre(0.11, 0.08, M.phare, 16);
      phare.rotation.z = Math.PI / 2;
      phare.position.set(1.8, 0.98, z);
      g.add(phare);
    }
    return { g, roues: ajouterRoues(g, [[1.3, true], [-1.3, false]], 0.9, 0.36, 0.28), yCapot: 1.3 };
  }

  // Le taxi : une berline jaune avec son panneau « TAXI » sur le toit et un damier sur les côtés.
  function taxi(k1, k2) {
    const p = { L: 4.6, W: 1.85, r: 0.34, xAv: 1.4, xAr: -1.4, g: 0.2, hNez: 0.66, rondNez: 0.3, hCapot: 0.88, hCeinture: 0.98, hCoffre: 1.0,
      hToit: 1.47, xPareBrise: 0.8, xToitAv: 0.25, xToitAr: -1.05, xLunette: -1.6, Wtoit: 1.52 };
    const g = carrosserie(p, k1, k2);
    const enseigne = new THREE.Group();
    enseigne.add(boite(0.4, 0.28, 0.9, M.phare, 0, 0, 0));
    for (const z of [-1, 1]) {
      const mot = etiquette("TAXI", "#ffe14d", "#111111", 0.8, 0.24);
      mot.position.z = z * 0.46;
      mot.rotation.y = z > 0 ? 0 : Math.PI;
      enseigne.add(mot);
    }
    enseigne.position.set(-0.4, 1.66, 0);
    enseigne.rotation.y = Math.PI / 2;
    g.add(enseigne);
    // Le damier noir et blanc sur les portières.
    for (const z of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        g.add(boite(0.25, 0.12, 0.02, i % 2 ? M.noir : peinture([0.95, 0.95, 0.95]), -1.4 + i * 0.25, 0.72, z * 0.94));
        g.add(boite(0.25, 0.12, 0.02, i % 2 ? peinture([0.95, 0.95, 0.95]) : M.noir, -1.4 + i * 0.25, 0.6, z * 0.94));
      }
    }
    return { g, roues: ajouterRoues(g, [[1.4, true], [-1.4, false]], 0.87, 0.34, 0.26), yCapot: 1.3 };
  }

  // La voiture de police : blanche et bleue, avec POLICE écrit dessus et un GYROPHARE (rouge et bleu).
  // Les deux lampes du gyrophare ont leur propre matériau : affichage/scene3d.js les fait clignoter.
  function police(k1, k2) {
    const p = { L: 4.7, W: 1.88, r: 0.35, xAv: 1.45, xAr: -1.42, g: 0.2, hNez: 0.64, rondNez: 0.3, hCapot: 0.86, hCeinture: 0.97, hCoffre: 1.0,
      hToit: 1.45, xPareBrise: 0.85, xToitAv: 0.25, xToitAr: -1.0, xLunette: -1.65, Wtoit: 1.52 };
    const g = carrosserie(p, k1, k2);
    for (const z of [-1, 1]) {
      g.add(boite(4.0, 0.3, 0.02, peinture(k2), 0, 0.62, z * 0.95)); // la grande bande bleue
      const mot = etiquette("POLICE", "#0d2a66", "#ffffff", 1.4, 0.28);
      mot.position.set(-0.1, 0.62, z * 0.97);
      if (z < 0) mot.rotation.y = Math.PI;
      g.add(mot);
    }
    g.add(boite(0.08, 0.35, 1.7, M.noir, 2.38, 0.45, 0)); // le pare-chocs renforcé
    const gyro = {
      rouge: new THREE.MeshStandardMaterial({ color: 0x661010, emissive: 0xff1a1a, emissiveIntensity: 0.05, roughness: 0.3 }),
      bleu: new THREE.MeshStandardMaterial({ color: 0x101a66, emissive: 0x1a5cff, emissiveIntensity: 0.05, roughness: 0.3 }),
    };
    g.add(boite(0.32, 0.08, 1.2, M.noir, -0.4, 1.5, 0));
    g.add(boite(0.28, 0.16, 0.5, gyro.rouge, -0.4, 1.6, -0.3));
    g.add(boite(0.28, 0.16, 0.5, gyro.bleu, -0.4, 1.6, 0.3));
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.42, false]], 0.88, 0.35, 0.27), yCapot: 1.3, gyro };
  }

  // Le kart : tout petit et tout plat, un pilote casqué, un volant, un moteur à l'arrière.
  function kart(k1, k2) {
    const g = new THREE.Group();
    g.add(boite(2.0, 0.06, 0.9, M.noir, 0, 0.2, 0)); // le châssis
    g.add(extruder([[1.25, 0.15, 0.05], [1.2, 0.42, 0.1], [0.6, 0.45, 0.1], [0.55, 0.15, 0.05]], 1.0, peinture(k1), 0.06)); // le carénage avant
    for (const z of [-1, 1]) g.add(extruder([[0.45, 0.15, 0.05], [0.35, 0.38, 0.1], [-0.55, 0.38, 0.1], [-0.6, 0.15, 0.05]], 0.22, peinture(k1), 0.04).translateZ(z * 0.62)); // les pontons
    g.add(boite(0.3, 0.06, 1.25, peinture(k2), -1.08, 0.38, 0)); // le pare-chocs arrière
    g.add(boite(0.45, 0.5, 0.5, M.siege, -0.35, 0.45, 0)); // le siège
    g.add(boite(0.35, 0.3, 0.3, M.chrome, -0.85, 0.42, 0.3)); // le moteur
    g.add(tube([0.55, 0.45, 0], [0.25, 0.75, 0], 0.03, M.noir));
    const volant = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 8, 20), M.noir);
    volant.position.set(0.22, 0.78, 0);
    volant.rotation.y = Math.PI / 2;
    g.add(volant);
    // Le pilote : son corps (pull) et son casque.
    const pull = peinture(k2);
    const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 4, 10), pull);
    corps.position.set(-0.3, 0.85, 0);
    corps.rotation.z = 0.3;
    g.add(corps);
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), M.casque);
    casque.position.set(-0.18, 1.3, 0);
    g.add(casque);
    g.add(boite(0.06, 0.08, 0.3, M.noir, 0.0, 1.32, 0)); // la visière
    for (const z of [-1, 1]) g.add(tube([-0.2, 1.0, z * 0.2], [0.18, 0.8, z * 0.14], 0.05, pull)); // les bras
    return { g, roues: ajouterRoues(g, [[0.75, true], [-0.8, false]], 0.62, 0.22, 0.24), yCapot: 1.1 };
  }

  // ---------------------------------------------------------------- étape 41 : la moto (sur les méga-rampes)

  // ---------------------------------------------------------------- étape 42 : ce qui vole (garé à l'aéroport)
  // On les voit à l'aéroport dès l'étape 42 ; on les pilotera à l'étape 44. Tous construits « nez vers x+ ».

  // Un fuselage : un long tube arrondi, plus fin vers la queue (un « tour » : on fait tourner un profil).
  function fuselage(longueur, rayon, materiau) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24; // de la queue (0) au nez (1)
      const r = t < 0.15 ? rayon * (0.35 + (t / 0.15) * 0.65) : t > 0.88 ? rayon * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.88) / 0.12, 2))) : rayon;
      pts.push(new THREE.Vector2(Math.max(0.001, r), (t - 0.5) * longueur));
    }
    const geo = new THREE.LatheGeometry(pts, 24);
    geo.rotateZ(-Math.PI / 2); // l'axe du tour (y) devient l'axe de l'avion (x)
    const m = new THREE.Mesh(geo, materiau);
    m.castShadow = true;
    return m;
  }

  // Une aile plate en trapèze (vue de dessus), d'épaisseur e.
  function aile(racine, bout, envergure, fleche, e, materiau) {
    const forme = new THREE.Shape();
    forme.moveTo(racine / 2, 0);
    forme.lineTo(racine / 2 - fleche, envergure);
    forme.lineTo(racine / 2 - fleche - bout, envergure);
    forme.lineTo(-racine / 2, 0);
    forme.closePath();
    const geo = new THREE.ExtrudeGeometry(forme, { depth: e, bevelEnabled: false });
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, materiau);
    m.castShadow = true;
    return m;
  }

  // L'avion de ligne : 34 m de long, deux réacteurs, des hublots, un empennage coloré.
  function avionDeLigne(k1, k2) {
    const g = new THREE.Group();
    const blanc = peinture([0.95, 0.95, 0.97]);
    const corps = fuselage(34, 2, blanc);
    corps.position.y = 3.6;
    g.add(corps);
    g.add(boite(28, 0.5, 0.05, peinture(k1), -1, 3.4, 2.0)); // la bande de couleur
    g.add(boite(28, 0.5, 0.05, peinture(k1), -1, 3.4, -2.0));
    for (let i = 0; i < 26; i++) for (const z of [-1.98, 1.98]) g.add(boite(0.35, 0.4, 0.04, M.vitre, -11 + i * 0.95, 4.2, z)); // les hublots
    g.add(boite(1.2, 0.7, 2.6, M.vitre, 15.4, 4.4, 0)); // le cockpit
    for (const cote of [-1, 1]) {
      const a = aile(6, 1.6, 15, 5, 0.35, blanc);
      if (cote < 0) a.rotation.x = Math.PI; // l'autre aile : retournée (un miroir mettrait les faces à l'envers)
      a.position.set(1, 2.8, 0);
      g.add(a);
      const reacteur = cylindre(0.9, 3.4, M.chrome, 20);
      reacteur.rotation.z = Math.PI / 2;
      reacteur.position.set(2.2, 1.8, cote * 5.5);
      g.add(reacteur);
      g.add(boite(3, 0.2, 0.3, blanc, 2.4, 2.6, cote * 5.5));
      const stab = aile(3, 1, 5.5, 2.2, 0.2, blanc);
      if (cote < 0) stab.rotation.x = Math.PI;
      stab.position.set(-15, 4.2, 0);
      g.add(stab);
    }
    const derive = aile(5, 1.8, 6.5, 4, 0.3, peinture(k2));
    derive.rotation.x = -Math.PI / 2;
    derive.position.set(-14.5, 5.2, 0.15);
    g.add(derive);
    // Le train d'atterrissage.
    for (const [x, z] of [[12, 0], [1, -2.4], [1, 2.4]]) {
      g.add(boite(0.2, 2.2, 0.2, M.noir, x, 1.1, z));
      const r = cylindre(0.5, 0.4, M.pneu, 16);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.5, z);
      g.add(r);
    }
    return { g, roues: [], yCapot: 5 };
  }

  // Le petit avion à hélice (comme un avion de tourisme) : ailes en haut, une hélice devant.
  function petitAvion(k1, k2) {
    const g = new THREE.Group();
    const corps = fuselage(8, 0.75, peinture(k1));
    corps.position.y = 1.5;
    g.add(corps);
    g.add(boite(1.4, 0.6, 1.3, M.vitre, 1.2, 2.1, 0)); // la cabine
    for (const cote of [-1, 1]) {
      const a = aile(1.6, 1.2, 5.5, 0.2, 0.15, peinture(k2));
      if (cote < 0) a.rotation.x = Math.PI; // l'autre aile : retournée (un miroir mettrait les faces à l'envers)
      a.position.set(0.9, 2.45, 0);
      g.add(a);
      const s = aile(1, 0.6, 1.8, 0.3, 0.1, peinture(k1));
      if (cote < 0) s.rotation.x = Math.PI;
      s.position.set(-3.4, 1.6, 0);
      g.add(s);
    }
    const derive = aile(1.3, 0.6, 1.5, 0.7, 0.1, peinture(k2));
    derive.rotation.x = -Math.PI / 2;
    derive.position.set(-3.3, 1.7, 0.05);
    g.add(derive);
    const helice = new THREE.Group();
    helice.add(boite(0.08, 2.0, 0.18, M.noir, 0, 0, 0));
    helice.position.set(4.05, 1.5, 0);
    g.add(helice);
    for (const [x, z] of [[2.5, 0], [0.4, -1.2], [0.4, 1.2]]) {
      g.add(boite(0.08, 1, 0.08, M.noir, x, 0.6, z));
      const r = cylindre(0.3, 0.2, M.pneu, 14);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.3, z);
      g.add(r);
    }
    return { g, roues: [], yCapot: 2.3, helice };
  }

  // Étape 44 : l'avion de chasse : un fuselage pointu, des ailes en triangle (« delta »), deux dérives,
  // une verrière, une tuyère… et des missiles sous les ailes.
  function avionChasse(k1, k2) {
    const g = new THREE.Group();
    const gris = peinture(k1), fonce = peinture(k2);
    const corps = fuselage(15, 1.1, gris);
    corps.position.y = 2.2;
    g.add(corps);
    const verriere = new THREE.Mesh(new THREE.SphereGeometry(0.75, 18, 12), M.vitre);
    verriere.scale.set(2.6, 0.8, 0.9);
    verriere.position.set(3.4, 3.05, 0);
    g.add(verriere);
    for (const cote of [-1, 1]) {
      const a = aile(7, 0.8, 5.2, 5.8, 0.18, gris);
      if (cote < 0) a.rotation.x = Math.PI;
      a.position.set(-1.2, 2.0, 0);
      g.add(a);
      const derive = aile(2.6, 0.8, 2.6, 1.8, 0.12, fonce);
      derive.rotation.x = -Math.PI / 2;
      derive.rotation.y = cote * 0.25;
      derive.position.set(-5.6, 2.8, cote * 0.8);
      g.add(derive);
      const stab = aile(2, 0.6, 2.2, 1.2, 0.1, gris);
      if (cote < 0) stab.rotation.x = Math.PI;
      stab.position.set(-6.2, 2.1, 0);
      g.add(stab);
      // Deux missiles sous chaque aile.
      for (const z of [2.2, 3.6]) {
        const m = cylindre(0.12, 2.4, peinture([0.92, 0.92, 0.92]), 10);
        m.rotation.z = Math.PI / 2;
        m.position.set(-1.2, 1.7, cote * z);
        g.add(m);
        const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 10), M.feu);
        pointe.rotation.z = -Math.PI / 2;
        pointe.position.set(0.2, 1.7, cote * z);
        g.add(pointe);
      }
      // Les entrées d'air sur les côtés.
      g.add(boite(2.2, 0.7, 0.4, fonce, 1.4, 2.0, cote * 1.05));
    }
    const tuyere = cylindre(0.75, 1.2, M.chrome, 18);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(-7.8, 2.2, 0);
    g.add(tuyere);
    g.add(boite(0.4, 0.3, 0.3, M.noir, 7.6, 2.0, 0.6)); // le canon de la mitrailleuse
    for (const [x, z] of [[4.5, 0], [-1.5, -1.3], [-1.5, 1.3]]) {
      g.add(boite(0.12, 1.4, 0.12, M.noir, x, 0.9, z));
      const r = cylindre(0.35, 0.25, M.pneu, 14);
      r.rotation.x = Math.PI / 2;
      r.position.set(x, 0.35, z);
      g.add(r);
    }
    return { g, roues: [], yCapot: 3.2 };
  }

  // L'hélicoptère : une cabine ronde vitrée, une longue queue, un grand rotor et des patins.
  function helico(k1, k2) {
    const g = new THREE.Group();
    const cabine = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), peinture(k1));
    cabine.scale.set(1.5, 1, 1);
    cabine.position.set(0.3, 1.9, 0);
    cabine.castShadow = true;
    g.add(cabine);
    const bulle = new THREE.Mesh(new THREE.SphereGeometry(1.25, 20, 14, 0, Math.PI, 0, Math.PI / 1.6), M.vitre);
    bulle.scale.set(1.4, 1, 1);
    bulle.rotation.y = -Math.PI / 2;
    bulle.position.set(0.7, 2.0, 0);
    g.add(bulle);
    g.add(tube([-1.4, 2.1, 0], [-6.5, 2.6, 0], 0.28, peinture(k1))); // la queue
    g.add(boite(0.8, 1.2, 0.1, peinture(k2), -6.4, 3.1, 0)); // la dérive
    const rotorArriere = new THREE.Group();
    rotorArriere.add(boite(0.1, 1.6, 0.06, M.noir, 0, 0, 0));
    rotorArriere.position.set(-6.5, 2.7, 0.25);
    g.add(rotorArriere);
    g.add(cylindre(0.15, 0.6, M.noir, 10).translateY(3.2));
    const rotor = new THREE.Group();
    for (const a of [0, Math.PI / 2]) {
      const pale = boite(10, 0.06, 0.32, M.noir, 0, 0, 0);
      pale.rotation.y = a;
      rotor.add(pale);
    }
    rotor.position.set(0, 3.5, 0);
    g.add(rotor);
    for (const z of [-1, 1]) {
      g.add(boite(4, 0.12, 0.12, M.noir, 0.2, 0.2, z * 1.1)); // les patins
      for (const x of [-0.8, 1.2]) g.add(tube([x, 0.2, z * 1.1], [x, 1.1, z * 0.7], 0.05, M.noir));
    }
    return { g, roues: [], yCapot: 2.6, rotor, rotorArriere };
  }

  // ---------------------------------------------------------------- étape 39 : le personnage
  // Un petit bonhomme : jambes, corps, bras, tête et casquette. Les jambes et les bras ont un « pivot »
  // à la hanche et à l'épaule : en les faisant tourner d'avant en arrière, il marche.
  function personnage() {
    materiaux();
    const g = new THREE.Group();
    const peau = new THREE.MeshStandardMaterial({ color: 0xe0b48f, roughness: 0.6 });
    const pull = new THREE.MeshStandardMaterial({ color: 0xd33b2f, roughness: 0.8 });
    const jean = new THREE.MeshStandardMaterial({ color: 0x2b4a7a, roughness: 0.85 });
    const membre = (rayon, longueur, materiau, x, y, z) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, y, z);
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(rayon, longueur, 4, 8), materiau);
      m.position.y = -longueur / 2 - rayon * 0.5;
      m.castShadow = true;
      pivot.add(m);
      g.add(pivot);
      return pivot;
    };
    const jambes = [membre(0.11, 0.7, jean, 0, 0.95, -0.13), membre(0.11, 0.7, jean, 0, 0.95, 0.13)];
    const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.5, 4, 10), pull);
    corps.position.y = 1.3;
    corps.castShadow = true;
    g.add(corps);
    const bras = [membre(0.08, 0.55, pull, 0, 1.6, -0.33), membre(0.08, 0.55, pull, 0, 1.6, 0.33)];
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), peau);
    tete.position.y = 1.92;
    tete.castShadow = true;
    g.add(tete);
    const casquette = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16), M.casque);
    casquette.position.y = 2.06;
    g.add(casquette);
    const visiere = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.3), M.casque);
    visiere.position.set(0.2, 2.03, 0);
    g.add(visiere);
    // Étape 42 : les lunettes de soleil (cachées tant qu'on ne les a pas achetées).
    const lunettes = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.3), M.noir);
    lunettes.position.set(0.18, 1.95, 0);
    lunettes.visible = false;
    g.add(lunettes);
    return { g, jambes, bras, casquette, visiere, lunettes };
  }

  const FABRIQUES = { classique, f1, quatre, pickup, buggy, camion, rallye, taxi, police, kart, avionDeLigne, petitAvion, helico, avionChasse };
  // Étape 49 : les vraies voitures sont dans affichage/voitures-reelles.js : elles s'ajoutent ici.
  function ajouter(fabriques) {
    Object.assign(FABRIQUES, fabriques);
  }

  // Fabrique une voiture. Renvoie { g (le groupe Three.js), roues (pour les faire tourner), yCapot (pour la caméra),
  // et pour la police : gyro (les 2 lampes du gyrophare) }.
  function fabriquer(modele, couleur1, couleur2) {
    materiaux();
    // Étape 52 : s'il existe une vraie maquette 3D de ce modèle et qu'elle est prête, on la prend. Sinon, on demande
    // à la charger, et en attendant on fabrique la voiture en code (marquée « provisoire » : elle sera échangée).
    const MQ = Circuit.Maquettes;
    if (MQ && MQ.existe(modele)) {
      const vraie = MQ.fabriquer(modele, couleur1, couleur2);
      if (vraie) return vraie;
      MQ.charger(modele);
      return Object.assign(ombrer(FABRIQUES[modele](couleur1, couleur2), modele), { provisoire: true });
    }
    const objet = ombrer(FABRIQUES[modele](couleur1, couleur2), modele);
    recoller(objet);
    return objet;
  }

  // Étape 55 : une voiture a maintenant plus de 150 petites pièces. Pour la carte graphique, chaque pièce est un
  // « dessin » à faire, et 30 voitures × 150 dessins, c'est beaucoup ! Alors, une fois la voiture finie, on RECOLLE
  // ensemble toutes les pièces de la caisse qui ont la même matière (tout le chrome en une seule pièce, toutes les
  // LED en une autre…) : la voiture a exactement la même allure, mais elle se dessine en une vingtaine de fois.
  function fusionner(caisse, bougent) {
    caisse.updateMatrixWorld(true);
    const inverse = caisse.matrixWorld.clone().invert(), paquets = new Map();
    const pieces = [];
    (function parcourir(o) {
      for (const enfant of o.children) {
        if (bougent && bougent.has(enfant)) continue; // (une pièce qui bouge : elle sera recollée de son côté)
        pieces.push(enfant);
        parcourir(enfant);
      }
    })(caisse);
    pieces.forEach((m) => {
      if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || !m.geometry.attributes.normal || !m.visible) return;
      const avecUV = !!m.geometry.attributes.uv, cle = m.material.uuid + (avecUV ? "+uv" : "");
      if (!paquets.has(cle)) paquets.set(cle, { materiau: m.material, avecUV, pieces: [] });
      paquets.get(cle).pieces.push(m);
    });
    const matrice = new THREE.Matrix4();
    for (const { materiau, avecUV, pieces } of paquets.values()) {
      if (pieces.length < 2) continue;
      const pos = [], nor = [], uv = [];
      for (const m of pieces) {
        const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
        matrice.multiplyMatrices(inverse, m.matrixWorld);
        geo.applyMatrix4(matrice);
        pos.push(geo.attributes.position.array);
        nor.push(geo.attributes.normal.array);
        if (avecUV) uv.push(geo.attributes.uv.array);
        geo.dispose();
        m.parent.remove(m);
      }
      const colle = (listes) => {
        const tout = new Float32Array(listes.reduce((n, a) => n + a.length, 0));
        let k = 0;
        for (const a of listes) { tout.set(a, k); k += a.length; }
        return tout;
      };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(colle(pos), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(colle(nor), 3));
      if (avecUV) geo.setAttribute("uv", new THREE.BufferAttribute(colle(uv), 2));
      const piece = new THREE.Mesh(geo, materiau);
      piece.castShadow = !materiau.transparent;
      piece.receiveShadow = true;
      caisse.add(piece);
    }
  }

  // Étape 56 : on recolle TOUS les véhicules (pas seulement les voitures de marque) : les voitures garées, la
  // circulation, les avions… Mais attention aux pièces qui BOUGENT toutes seules (les roues, la caisse sur ses
  // ressorts, le rotor de l'hélico, l'hélice…) : chacune est recollée de son côté, jamais avec le reste.
  function recoller(objet) {
    const bougent = new Set();
    const noter = (x) => { if (x && x.isObject3D) bougent.add(x); };
    for (const valeur of Object.values(objet)) {
      if (Array.isArray(valeur)) for (const e of valeur) { noter(e); if (e && !e.isObject3D) Object.values(e).forEach(noter); }
      else noter(valeur);
    }
    bougent.delete(objet.g);
    // Chaque « racine » (le véhicule, ou une pièce qui bouge) recolle ses pièces, sans entrer dans les autres racines.
    for (const racine of [objet.g].concat([...bougent])) fusionner(racine, bougent);
  }

  // Étape 55 : l'OMBRE DOUCE sous la voiture. Là où la voiture touche presque le sol, la lumière du ciel n'arrive
  // pas : c'est tout sombre juste dessous, et ça s'éclaircit vers les bords. (Les peintres l'appellent « l'ombre
  // de contact » : sans elle, une voiture a l'air de flotter.) C'est une image floue posée au sol, sous la voiture.
  let imageOmbre = null;
  const VOLANTS = ["avionDeLigne", "petitAvion", "helico", "avionChasse"];
  function ombrer(objet, modele) {
    if (VOLANTS.includes(modele)) return objet;
    if (!imageOmbre) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d");
      const d = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
      d.addColorStop(0, "rgba(0,0,0,0.75)");
      d.addColorStop(0.55, "rgba(0,0,0,0.45)");
      d.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = d;
      ctx.fillRect(0, 0, 128, 128);
      imageOmbre = new THREE.CanvasTexture(c);
    }
    const boite = new THREE.Box3().setFromObject(objet.g), taille = new THREE.Vector3();
    boite.getSize(taille);
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(taille.x * 1.12, taille.z * 1.35), new THREE.MeshBasicMaterial({ map: imageOmbre, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    plan.rotation.x = -Math.PI / 2;
    plan.position.set((boite.min.x + boite.max.x) / 2, 0.02, 0);
    plan.renderOrder = 2;
    objet.g.add(plan);
    objet.ombreSol = plan;
    return objet;
  }

  // Les outils du carrossier, prêtés à affichage/voitures-reelles.js (étape 49).
  const outils = { M, fusionner, materiaux, peinture, forme, extruder, passage, boite, cylindre, tube, roue, carrosserie, ajouterRoues, etiquette, personnage, galber, bord, bout, largeurIci };
  return { fabriquer, materiaux, personnage, ajouter, outils };
})();
