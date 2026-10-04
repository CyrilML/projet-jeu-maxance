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
    M.vitre = new THREE.MeshPhysicalMaterial({ color: 0x0f1a26, metalness: 0.1, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.5 });
    M.noir = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.2 });
    M.pneu = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.95 });
    M.chrome = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 1, roughness: 0.18 });
    M.jante = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.9, roughness: 0.3 });
    M.phare = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff2c0, emissiveIntensity: 1.6, roughness: 0.2 });
    M.feu = new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff1010, emissiveIntensity: 1.2, roughness: 0.3 });
    M.casque = new THREE.MeshPhysicalMaterial({ color: 0xffd21a, roughness: 0.25, clearcoat: 1 });
    M.siege = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8 });
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

  // Une roue : le pneu, la jante chromée et 5 rayons (pour la voir tourner).
  // Le « pivot » tourne pour braquer, la « roue » tourne sur elle-même pour rouler.
  function roue(rayon, epaisseur, jante) {
    const pivot = new THREE.Group();
    const r = new THREE.Group();
    const pneu = cylindre(rayon, epaisseur, M.pneu, 28);
    pneu.rotation.x = Math.PI / 2;
    r.add(pneu);
    for (const cote of [-1, 1]) {
      const disque = cylindre(rayon * 0.62, 0.04, jante || M.jante, 24);
      disque.rotation.x = Math.PI / 2;
      disque.position.z = (cote * epaisseur) / 2;
      r.add(disque);
      for (let k = 0; k < 5; k++) {
        const rayonJante = boite(rayon * 1.05, rayon * 0.12, 0.03, M.noir, 0, 0, cote * (epaisseur / 2 + 0.02));
        rayonJante.rotation.z = (k * Math.PI) / 5;
        r.add(rayonJante);
      }
      const moyeu = cylindre(rayon * 0.15, 0.06, M.chrome, 12);
      moyeu.rotation.x = Math.PI / 2;
      moyeu.position.z = cote * (epaisseur / 2 + 0.03);
      r.add(moyeu);
    }
    pivot.add(r);
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
    profil = profil.concat([
      [p.L / 2, p.g + 0.05, 0.12],
      [p.L / 2 + 0.03, p.hNez, p.rondNez || 0.25],
      [p.L / 2 - 0.55, p.hCapot, 0.4],
      [p.xPareBrise, p.hCeinture, 0.1],
      [p.xLunette, p.hCeinture, 0.1],
      [-p.L / 2 + 0.25, p.hCoffre, 0.25],
      [-p.L / 2, p.hCoffre - 0.2, 0.15],
    ]);
    g.add(extruder(profil, p.W, peinture(k1), 0.12));
    // La cabine vitrée, puis le toit peint par-dessus.
    const cabine = [
      [p.xPareBrise, p.hCeinture - 0.02, 0.05],
      [p.xToitAv, p.hToit, 0.25],
      [p.xToitAr, p.hToit, 0.3],
      [p.xLunette, p.hCeinture - 0.02, 0.05],
    ];
    g.add(extruder(cabine, p.Wtoit, M.vitre, 0.08));
    const couleurToit = peinture(p.toitCouleur2 ? k2 : k1);
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

  // Les roues d'un modèle (positions et taille), ajoutées au groupe.
  function ajouterRoues(g, xs, z, rayon, epaisseur, jante) {
    const roues = [];
    for (const [x, avant] of xs) {
      for (const cote of [-1, 1]) {
        const r = roue(rayon, epaisseur, jante);
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

  function taureau(k1, k2) {
    const p = { L: 4.6, W: 2.0, r: 0.35, xAv: 1.4, xAr: -1.38, g: 0.12, hNez: 0.42, rondNez: 0.15, hCapot: 0.6, hCeinture: 0.8, hCoffre: 0.92,
      hToit: 1.13, xPareBrise: 0.95, xToitAv: -0.1, xToitAr: -0.7, xLunette: -1.95, Wtoit: 1.45 };
    const g = carrosserie(p, k1, k2);
    for (const z of [-1, 1]) g.add(boite(1.1, 0.28, 0.06, M.noir, -0.7, 0.6, z * 1.0)); // les prises d'air
    g.add(boite(0.3, 0.04, 1.7, M.noir, -2.1, 1.02, 0)); // le petit aileron
    return { g, roues: ajouterRoues(g, [[1.4, true], [-1.38, false]], 0.92, 0.35, 0.3), yCapot: 1.0 };
  }

  function fleche(k1, k2) {
    const p = { L: 4.5, W: 1.86, r: 0.34, xAv: 1.25, xAr: -1.2, g: 0.16, hNez: 0.55, rondNez: 0.35, hCapot: 0.74, hCeinture: 0.9, hCoffre: 0.82,
      hToit: 1.3, xPareBrise: 0.7, xToitAv: 0.05, xToitAr: -0.55, xLunette: -2.0, Wtoit: 1.42 };
    const g = carrosserie(p, k1, k2);
    // les phares ronds, « yeux de grenouille »
    for (const z of [-0.62, 0.62]) {
      const oeil = cylindre(0.16, 0.12, M.phare, 20);
      oeil.rotation.z = Math.PI / 2 - 0.3;
      oeil.position.set(2.0, 0.72, z);
      g.add(oeil);
    }
    g.add(boite(0.25, 0.04, 1.2, peinture(k1), -2.05, 0.9, 0)); // le becquet « queue de canard »
    return { g, roues: ajouterRoues(g, [[1.25, true], [-1.2, false]], 0.87, 0.34, 0.27), yCapot: 1.15 };
  }

  function fusee(k1, k2) {
    const p = { L: 4.75, W: 2.03, r: 0.37, xAv: 1.45, xAr: -1.45, g: 0.13, hNez: 0.55, hCapot: 0.8, hCeinture: 0.92, hCoffre: 0.97,
      hToit: 1.22, xPareBrise: 0.85, xToitAv: 0.0, xToitAr: -0.85, xLunette: -1.8, Wtoit: 1.5, toitCouleur2: true };
    const g = carrosserie(p, k1, k2);
    // La grande ligne en « C » chromée sur les côtés, et la calandre en fer à cheval.
    for (const z of [-1, 1]) {
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 24, Math.PI * 1.2), M.chrome);
      c.position.set(0.15, 0.6, z * 1.02);
      c.rotation.z = Math.PI * 0.4;
      g.add(c);
    }
    const fer = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 20, Math.PI * 1.4), M.chrome);
    fer.position.set(2.39, 0.4, 0);
    fer.rotation.set(0, Math.PI / 2, -Math.PI * 0.2);
    g.add(fer);
    g.add(boite(0.05, 0.05, 1.8, M.feu, -2.38, 0.85, 0)); // la barre de feux arrière
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.45, false]], 0.93, 0.37, 0.32), yCapot: 1.1 };
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

  function monster(k1, k2) {
    const h = 1.25; // la caisse commence très haut
    const p = { L: 4.6, W: 2.1, r: 0.95, xAv: 1.6, xAr: -1.6, g: h, hNez: h + 0.5, hCapot: h + 0.68, hCeinture: h + 0.75, hCoffre: h + 0.8,
      hToit: h + 1.35, xPareBrise: 1.05, xToitAv: 0.7, xToitAr: -0.55, xLunette: -0.65, Wtoit: 1.9, passages: false };
    const g = carrosserie(p, k1, k2);
    // Des flammes peintes sur les côtés (couleur 2).
    for (const z of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9 - i * 0.12, 4), peinture(k2));
        flamme.rotation.z = -Math.PI / 2;
        flamme.position.set(1.4 - i * 0.55, h + 0.35 + (i % 2) * 0.12, z * 1.06);
        flamme.scale.z = 0.15;
        g.add(flamme);
      }
    }
    // Le châssis, les essieux et les gros amortisseurs.
    g.add(boite(3.6, 0.25, 0.8, M.noir, 0, 1.05, 0));
    for (const x of [-1.6, 1.6]) {
      const essieu = cylindre(0.1, 2.5, M.noir, 10);
      essieu.rotation.x = Math.PI / 2;
      essieu.position.set(x, 0.95, 0);
      g.add(essieu);
      for (const z of [-0.65, 0.65]) g.add(tube([x, 0.95, z], [x - 0.2, 1.45, z], 0.07, M.chrome));
    }
    return { g, roues: ajouterRoues(g, [[1.6, true], [-1.6, false]], 1.35, 0.95, 0.75), yCapot: 2.9 };
  }

  // ---------------------------------------------------------------- étape 39 : le garage de la ville

  // La petite citadine : courte, haute et toute ronde.
  function citadine(k1, k2) {
    const p = { L: 3.7, W: 1.72, r: 0.32, xAv: 1.18, xAr: -1.18, g: 0.2, hNez: 0.62, rondNez: 0.35, hCapot: 0.8, hCeinture: 0.92, hCoffre: 0.95,
      hToit: 1.5, xPareBrise: 0.95, xToitAv: 0.35, xToitAr: -1.55, xLunette: -1.75, Wtoit: 1.5, toitCouleur2: true };
    const g = carrosserie(p, k1, k2);
    return { g, roues: ajouterRoues(g, [[1.18, true], [-1.18, false]], 0.8, 0.32, 0.24), yCapot: 1.3 };
  }

  // Le SUV : une grosse voiture haute, avec des barres de toit.
  function suv(k1, k2) {
    const p = { L: 4.7, W: 1.95, r: 0.42, xAv: 1.5, xAr: -1.5, g: 0.38, hNez: 0.95, rondNez: 0.3, hCapot: 1.12, hCeinture: 1.2, hCoffre: 1.22,
      hToit: 1.82, xPareBrise: 0.95, xToitAv: 0.45, xToitAr: -1.95, xLunette: -2.2, Wtoit: 1.75 };
    const g = carrosserie(p, k1, k2);
    for (const z of [-0.7, 0.7]) g.add(boite(2.2, 0.05, 0.05, peinture(k2), -0.75, 1.88, z));
    for (const z of [-1, 1]) g.add(boite(3.0, 0.1, 0.06, peinture(k2), 0, 0.5, z * 0.99));
    return { g, roues: ajouterRoues(g, [[1.5, true], [-1.5, false]], 0.95, 0.42, 0.32), yCapot: 1.65 };
  }

  // La voiture basse : toute plate, très près du sol, avec un long capot.
  function basse(k1, k2) {
    const p = { L: 4.6, W: 1.95, r: 0.34, xAv: 1.45, xAr: -1.35, g: 0.1, hNez: 0.4, rondNez: 0.2, hCapot: 0.58, hCeinture: 0.72, hCoffre: 0.8,
      hToit: 1.05, xPareBrise: 0.55, xToitAv: -0.25, xToitAr: -0.9, xLunette: -1.75, Wtoit: 1.35 };
    const g = carrosserie(p, k1, k2);
    g.add(boite(0.3, 0.04, 1.7, peinture(k2), -2.15, 0.95, 0));
    for (const z of [-0.6, 0.6]) g.add(boite(0.06, 0.18, 0.06, peinture(k2), -2.15, 0.85, z));
    for (const z of [-1, 1]) g.add(boite(1.0, 0.2, 0.05, M.noir, -0.6, 0.45, z * 0.98)); // les prises d'air
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.35, false]], 0.9, 0.34, 0.3), yCapot: 0.95 };
  }

  // La camionnette : une cabine devant, une grande caisse fermée derrière.
  function camionnette(k1, k2) {
    const p = { L: 5.0, W: 1.98, r: 0.38, xAv: 1.7, xAr: -1.6, g: 0.3, hNez: 0.9, rondNez: 0.3, hCapot: 1.1, hCeinture: 1.2, hCoffre: 1.2,
      hToit: 2.3, xPareBrise: 1.6, xToitAv: 1.0, xToitAr: -2.45, xLunette: -2.5, Wtoit: 1.9 };
    const g = carrosserie(p, k1, k2);
    // La grande caisse (sans fenêtres) recouvre l'arrière de la cabine vitrée.
    g.add(extruder([[0.55, 1.15, 0.05], [0.55, 2.35, 0.1], [-2.5, 2.35, 0.15], [-2.5, 1.15, 0.05]], 1.96, peinture(k1), 0.06));
    // Une bande de couleur 2 sur les côtés (le logo de la société de livraison !).
    for (const z of [-1, 1]) g.add(boite(2.6, 0.35, 0.02, peinture(k2), -1.0, 1.65, z * 0.99));
    return { g, roues: ajouterRoues(g, [[1.7, true], [-1.6, false]], 0.92, 0.38, 0.3), yCapot: 1.8 };
  }

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
    return { g, jambes, bras };
  }

  const FABRIQUES = { classique, taureau, fleche, fusee, f1, quatre, pickup, buggy, monster, citadine, suv, basse, camionnette, camion };

  // Fabrique une voiture. Renvoie { g (le groupe Three.js), roues (pour les faire tourner), yCapot (pour la caméra) }.
  function fabriquer(modele, couleur1, couleur2) {
    materiaux();
    return FABRIQUES[modele](couleur1, couleur2);
  }

  return { fabriquer, materiaux, personnage };
})();
