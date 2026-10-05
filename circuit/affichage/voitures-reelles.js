// 🏎️ LES VRAIES VOITURES : l'atelier du carrossier (étape 49)
//
// ✍️ Maxance a demandé des voitures qui ressemblent aux vraies : une Bugatti Chiron, une Porsche 911, une
// Lamborghini Aventador, une Honda NSX (la voiture basse), une citadine, un SUV genre Peugeot 508, une
// camionnette genre Mercedes Vito, une moto genre Kawasaki, un quad et un monster truck rétro à ressorts.
//
// Comment on rend une voiture « vraie » ? Un designer regarde ce qui la rend RECONNAISSABLE (sa « signature ») :
//   - la Chiron : la grande ligne en « C » sur le côté et la calandre en fer à cheval ;
//   - la 911 : les phares ronds sur les ailes et le toit qui descend en pente douce jusqu'au moteur, derrière ;
//   - l'Aventador : toute en angles, très basse, avec des phares et des feux en forme de « Y » ;
//   - la NSX : basse, le toit noir, les phares « bijoux » (une rangée de petites lampes) ;
//   - le SUV : les « crocs » (des lampes verticales sous les phares) et les feux en griffes.
// On dessine son profil, on le GALBE (affichage/modeles.js : plus étroit au nez, flancs qui rentrent vers le haut),
// puis on ajoute les détails : phares, feux, rétroviseurs, poignées, jantes et freins.
//
// Toutes les voitures sont construites « nez vers x+ », posées au sol (y = 0), centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.VoituresReelles = (function () {
  const O = Circuit.Modeles.outils;
  const { M, peinture, extruder, boite, cylindre, tube, carrosserie, ajouterRoues, personnage, bord, bout, largeurIci } = O;
  // Le x de l'avant (ou de l'arrière) de la carrosserie à la hauteur y, moins un petit retrait.
  const devant = (p, y, retrait) => bout(p, y, true) - (retrait || 0);
  const derriere = (p, y, retrait) => bout(p, y, false) + (retrait || 0);
  // Le z d'un détail posé à `marge` m du bord de la carrosserie.
  const pres = (p, x, y, marge) => bord(p, x, y) - (marge || 0);

  // ---------------------------------------------------------------- petits outils

  // Un détail collé sur le flanc (côté z = ±1) : une boîte très fine, tournée comme le flanc.
  function surLeFlanc(g, p, x, y, cote, lx, ly, materiau, epaisseur) {
    const b = boite(lx, ly, epaisseur || 0.02, materiau, x, y, cote * (bord(p, x, y) + 0.004));
    g.add(b);
    return b;
  }
  // Les lignes des portières (de fins traits sombres) et les poignées.
  function portieres(g, p, xs, yBas, yHaut, poignees) {
    for (const cote of [-1, 1]) {
      for (const x of xs) surLeFlanc(g, p, x, (yBas + yHaut) / 2, cote, 0.012, yHaut - yBas, M.noir, 0.012);
      surLeFlanc(g, p, (xs[0] + xs[xs.length - 1]) / 2, yBas, cote, xs[0] - xs[xs.length - 1], 0.012, M.noir, 0.012);
      for (const x of poignees || []) surLeFlanc(g, p, x, yHaut - 0.08, cote, 0.2, 0.035, M.chrome, 0.025);
    }
  }
  // Les rétroviseurs : au pied du pare-brise, un petit bras qui part de la portière et une coque (avec le miroir).
  function retroviseurs(g, p, materiau, taille) {
    const t = taille || 1, x = p.xPareBrise - 0.14, y = p.hCeinture + 0.05;
    for (const cote of [-1, 1]) {
      const z0 = cote * (p.Wtoit / 2) * largeurIci(p, x, y, true);
      const z = cote * (bord(p, x, p.hCeinture - 0.1) + 0.04 * t);
      g.add(tube([x, y - 0.04, z0], [x - 0.04, y, z - cote * 0.04], 0.025, materiau));
      const coque = boite(0.13 * t, 0.12 * t, 0.2 * t, materiau, x - 0.06, y + 0.03, z);
      coque.rotation.y = cote * 0.15;
      g.add(coque);
      g.add(boite(0.01, 0.09 * t, 0.16 * t, M.chrome, x - 0.13 * t, y + 0.03, z));
    }
  }
  // Un casque intégral pour le pilote (à la place de la casquette), de la couleur donnée, avec sa visière fumée.
  function casque(pilote, materiau) {
    pilote.casquette.visible = false;
    pilote.visiere.visible = false;
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 14), materiau);
    c.position.y = 1.95;
    c.castShadow = true;
    pilote.g.add(c);
    const v = boite(0.12, 0.1, 0.32, M.vitreFumee, 0.18, 1.94, 0);
    pilote.g.add(v);
  }
  // Une lampe (phare, feu) : une boîte qui brille, avec un petit angle.
  function lampe(g, materiau, x, y, z, lx, ly, lz, rz, ry) {
    const b = boite(lx, ly, lz, materiau, x, y, z);
    b.rotation.z = rz || 0;
    b.rotation.y = ry || 0;
    b.castShadow = false;
    g.add(b);
    return b;
  }
  // Un pot d'échappement (rond ou à 6 côtés), qui sort à l'arrière.
  function echappement(g, x, y, z, rayon, cotes) {
    const e = cylindre(rayon, 0.12, M.chrome, cotes || 16);
    e.rotation.z = Math.PI / 2;
    e.position.set(x, y, z);
    g.add(e);
    const trou = cylindre(rayon * 0.75, 0.13, M.noir, cotes || 16);
    trou.rotation.z = Math.PI / 2;
    trou.position.set(x - 0.005, y, z);
    g.add(trou);
  }
  // Un passage de roue en plastique noir (pour le SUV et le monster truck) : un demi-anneau sur le flanc.
  function passagesNoirs(g, p, xs, rayon, materiau) {
    for (const x of xs) {
      for (const cote of [-1, 1]) {
        const a = new THREE.Mesh(new THREE.TorusGeometry(rayon + 0.08, 0.06, 6, 20, Math.PI), materiau || M.plastique);
        a.scale.z = 0.6;
        a.position.set(x, rayon, cote * (p.W / 2 - 0.02));
        g.add(a);
      }
    }
  }

  // ---------------------------------------------------------------- 🇫🇷 la Bugatti Chiron
  function chiron(k1, k2) {
    const p = { L: 4.54, W: 2.04, r: 0.36, xAv: 1.42, xAr: -1.33, g: 0.12, hCeinture: 0.92, hToit: 1.21,
      xPareBrise: 0.72, xToitAv: -0.05, xToitAr: -0.85, xLunette: -1.5, Wtoit: 1.45, toitCouleur2: true, details: false, montantX: -0.45,
      galbe: { nez: 0.32, arriere: 0.18, haut: 0.26 },
      dessus: [[2.24, 0.2, 0.1], [2.27, 0.48, 0.15], [1.9, 0.68, 0.5], [1.2, 0.84, 0.35], [0.72, 0.92, 0.08], [-1.5, 0.97, 0.08], [-2.1, 0.99, 0.15], [-2.25, 0.86, 0.1], [-2.27, 0.38, 0.1]],
      cabine: [[0.72, 0.9, 0.05], [-0.05, 1.21, 0.3], [-0.85, 1.21, 0.35], [-1.5, 0.95, 0.05]] };
    const g = carrosserie(p, k1, k2);
    // La calandre en FER À CHEVAL (chromée), avec sa grille noire dedans.
    const xG = devant(p, 0.36, 0.03);
    const fond = cylindre(0.19, 0.05, M.noir, 24);
    fond.rotation.z = Math.PI / 2;
    fond.position.set(xG, 0.37, 0);
    g.add(fond);
    const fer = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 24, Math.PI * 1.6), M.chrome);
    fer.position.set(xG + 0.02, 0.37, 0);
    fer.rotation.set(0, Math.PI / 2, -Math.PI * 0.3);
    g.add(fer);
    // Les phares : 4 petites lampes carrées de chaque côté (2 × 2), sur le nez.
    for (const cote of [-1, 1]) {
      for (const [dy, dz] of [[0, 0], [0.05, 0.13], [-0.07, 0.05], [-0.02, 0.18]]) {
        const y = 0.5 + dy, x = devant(p, y, 0.0);
        lampe(g, M.phare, x, y, cote * (pres(p, x, y, 0.2) - dz), 0.12, 0.05, 0.09, -0.6);
      }
      const yP = 0.22, xP = devant(p, yP, 0.02);
      lampe(g, M.plastique, xP, yP, cote * (pres(p, xP, yP, 0.42)), 0.06, 0.16, 0.42); // la grande entrée d'air
    }
    // La ligne en « C » chromée sur chaque flanc, et dedans la partie sombre (la couleur 2) avec l'entrée d'air.
    for (const cote of [-1, 1]) {
      const zC = cote * (bord(p, -0.2, 0.6) + 0.006);
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.02, 6, 30, Math.PI * 1.3), M.chrome);
      c.position.set(-0.2, 0.56, zC);
      c.rotation.z = Math.PI * 0.35;
      c.scale.set(1.1, 0.9, 0.3);
      g.add(c);
      const creux = new THREE.Mesh(new THREE.CircleGeometry(0.44, 28), peinture(k2));
      creux.position.set(-0.32, 0.56, zC);
      creux.scale.set(1.05, 0.88, 1);
      if (cote < 0) creux.rotation.y = Math.PI;
      g.add(creux);
      surLeFlanc(g, p, -0.55, 0.42, cote, 0.42, 0.2, M.noir, 0.03); // l'entrée d'air dans le C
    }
    // L'arête sur le toit (une fine « nageoire »), les deux prises d'air du moteur derrière la cabine.
    g.add(boite(1.5, 0.05, 0.04, peinture(k1), -1.25, 1.06, 0));
    for (const cote of [-1, 1]) g.add(boite(0.5, 0.1, 0.28, M.noir, -1.25, 1.0, cote * 0.45));
    // L'arrière : la longue barre de feux, le diffuseur noir, 4 pots d'échappement, l'aileron.
    const yF = 0.8, xF = derriere(p, yF, 0.01);
    lampe(g, M.feu, xF, yF, 0, 0.04, 0.05, 2 * pres(p, xF, yF, 0.12));
    const yD = 0.3, xD = derriere(p, yD, 0.08);
    g.add(boite(0.2, 0.22, 2 * pres(p, xD, yD, 0.2), M.plastique, xD, yD, 0));
    for (const z of [-0.2, -0.07, 0.07, 0.2]) echappement(g, xD - 0.08, 0.42, z, 0.055);
    g.add(boite(0.45, 0.04, 1.5, peinture(k2), -1.95, 1.04, 0));
    retroviseurs(g, p, peinture(k2), 0.9);
    portieres(g, p, [0.7, -0.3], 0.3, 0.88, []);
    return { g, roues: ajouterRoues(g, [[1.42, true], [-1.33, false]], 0.84, 0.36, 0.3, M.jante, { rayons: 10, etrier: [0.15, 0.3, 0.85] }), yCapot: 1.1 };
  }

  // ---------------------------------------------------------------- 🇩🇪 la Porsche 911
  function porsche911(k1, k2) {
    const p = { L: 4.52, W: 1.85, r: 0.35, xAv: 1.33, xAr: -1.12, g: 0.13, hCeinture: 0.88, hToit: 1.3,
      xPareBrise: 0.72, xToitAv: 0.12, xToitAr: -0.5, xLunette: -1.75, Wtoit: 1.38, details: false, montantX: -0.35,
      galbe: { nez: 0.34, arriere: 0.12, haut: 0.3 },
      dessus: [[2.24, 0.2, 0.1], [2.26, 0.46, 0.2], [1.95, 0.6, 0.35], [1.3, 0.74, 0.4], [0.72, 0.88, 0.08], [-1.75, 0.95, 0.15], [-2.15, 0.85, 0.3], [-2.25, 0.6, 0.15], [-2.24, 0.35, 0.1]],
      cabine: [[0.72, 0.86, 0.05], [0.12, 1.3, 0.35], [-0.5, 1.3, 0.45], [-1.75, 0.93, 0.05]] };
    const g = carrosserie(p, k1, k2);
    // Les célèbres phares RONDS, sur le haut des ailes avant, un peu penchés vers l'arrière.
    for (const cote of [-1, 1]) {
      const y = 0.54, x = devant(p, y, 0.06), z = cote * pres(p, x, y, 0.26);
      const verre = cylindre(0.14, 0.12, M.phare, 24);
      verre.rotation.z = Math.PI / 2 - 0.5;
      verre.position.set(x, y, z);
      g.add(verre);
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.018, 6, 24), peinture(k1));
      anneau.rotation.set(0, Math.PI / 2, 0);
      anneau.rotateX(-0.5);
      anneau.position.set(x + 0.05, y + 0.03, z);
      g.add(anneau);
      const yA = 0.3, xA = devant(p, yA, 0.03);
      lampe(g, M.plastique, xA, yA, cote * pres(p, xA, yA, 0.32), 0.06, 0.12, 0.32); // les entrées d'air du bouclier
      lampe(g, M.orange, xA, yA + 0.12, cote * pres(p, xA, yA + 0.12, 0.2), 0.04, 0.03, 0.2); // le clignotant
    }
    lampe(g, M.plastique, devant(p, 0.28, 0.03), 0.28, 0, 0.06, 0.1, 0.5);
    // L'arrière : la grille du moteur (des lamelles noires), le becquet, la barre de feux, 2 sorties ovales.
    for (let i = 0; i < 6; i++) g.add(boite(0.03, 0.01, 0.8, M.noir, -1.85 - i * 0.05, 0.955 - i * 0.008, 0));
    g.add(boite(0.26, 0.035, 1.25, peinture(k1), -2.05, 0.92, 0)); // le becquet
    const yF = 0.72, xF = derriere(p, yF, 0.01);
    lampe(g, M.feu, xF, yF, 0, 0.04, 0.05, 2 * pres(p, xF, yF, 0.06));
    lampe(g, M.feu, xF, yF - 0.04, 0, 0.04, 0.03, 2 * pres(p, xF, yF, 0.1));
    for (const cote of [-1, 1]) echappement(g, derriere(p, 0.28, 0.02), 0.28, cote * 0.3, 0.06);
    retroviseurs(g, p, peinture(k1), 0.9);
    portieres(g, p, [0.68, -0.55], 0.28, 0.84, [-0.4]);
    return { g, roues: ajouterRoues(g, [[1.33, true], [-1.12, false]], 0.8, 0.35, 0.3, M.jante, { rayons: 10, etrier: [0.85, 0.1, 0.1] }), yCapot: 1.2 };
  }

  // ---------------------------------------------------------------- 🇮🇹 la Lamborghini Aventador
  function aventador(k1, k2) {
    const p = { L: 4.8, W: 2.03, r: 0.36, xAv: 1.45, xAr: -1.42, g: 0.11, hCeinture: 0.84, hToit: 1.16, chanfrein: 0.05,
      xPareBrise: 1.0, xToitAv: -0.05, xToitAr: -0.6, xLunette: -1.3, Wtoit: 1.35, details: false, montantX: -0.4,
      galbe: { nez: 0.3, arriere: 0.08, haut: 0.32 },
      dessus: [[2.38, 0.15, 0.03], [2.42, 0.36, 0.05], [1.75, 0.72, 0.08], [1.0, 0.84, 0.05], [-1.3, 0.94, 0.05], [-2.28, 0.94, 0.04], [-2.4, 0.75, 0.03], [-2.4, 0.3, 0.03]],
      cabine: [[1.0, 0.82, 0.03], [-0.05, 1.16, 0.15], [-0.6, 1.16, 0.15], [-1.3, 0.93, 0.03]] };
    const g = carrosserie(p, k1, k2);
    // Les phares en « Y » : deux traits de lumière qui se rejoignent, sur le capot en pente.
    for (const cote of [-1, 1]) {
      const y = 0.5, x = devant(p, y, 0.02), z = cote * pres(p, x, y, 0.3);
      lampe(g, M.noir, x - 0.03, y + 0.01, z, 0.42, 0.04, 0.22, -0.45);
      lampe(g, M.phare, x, y + 0.04, z, 0.42, 0.05, 0.06, -0.45, cote * 0.45);
      lampe(g, M.phare, x + 0.04, y + 0.02, z - cote * 0.06, 0.3, 0.05, 0.06, -0.45, -cote * 0.35);
      // les grandes bouches d'air de l'avant (des triangles noirs)
      const yB = 0.24, xB = devant(p, yB, 0.03);
      const bouche = boite(0.06, 0.14, 0.45, M.plastique, xB, yB, cote * pres(p, xB, yB, 0.4));
      bouche.rotation.y = cote * 0.35;
      g.add(bouche);
      // les énormes prises d'air sur les flancs, derrière les portières
      const prise = surLeFlanc(g, p, -0.75, 0.58, cote, 0.8, 0.28, M.noir, 0.05);
      prise.rotation.z = 0.25;
    }
    // Le capot moteur : des lamelles noires (on devine le moteur V12 dessous !).
    for (let i = 0; i < 5; i++) g.add(boite(0.05, 0.02, 0.85, M.noir, -1.5 - i * 0.16, 0.935, 0));
    // L'arrière : les feux en « Y », la grille noire, l'échappement central à 6 côtés, l'aileron.
    for (const cote of [-1, 1]) {
      const y = 0.68, x = derriere(p, y, -0.005), z = cote * pres(p, x, y, 0.3);
      lampe(g, M.feu, x, y + 0.06, z, 0.03, 0.03, 0.4);
      lampe(g, M.feu, x, y - 0.03, z + cote * 0.1, 0.03, 0.18, 0.03, 0, 0).rotation.x = cote * 0.5;
      lampe(g, M.feu, x, y - 0.03, z - cote * 0.1, 0.03, 0.18, 0.03, 0, 0).rotation.x = -cote * 0.5;
    }
    const xN = derriere(p, 0.45, 0.02);
    g.add(boite(0.06, 0.3, 1.3, M.noir, xN, 0.45, 0));
    echappement(g, xN - 0.05, 0.4, 0, 0.13, 6);
    g.add(boite(0.4, 0.04, 1.75, peinture(k1), -2.12, 1.13, 0));
    for (const z of [-0.5, 0.5]) g.add(boite(0.15, 0.2, 0.04, M.noir, -2.08, 1.02, z));
    retroviseurs(g, p, peinture(k1), 0.85);
    portieres(g, p, [0.85, -0.45], 0.28, 0.78, []);
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.42, false]], 0.86, 0.36, 0.32, peinture([0.12, 0.12, 0.13]), { rayons: 5, etrier: [0.95, 0.8, 0.1] }), yCapot: 1.05 };
  }

  // ---------------------------------------------------------------- 🇯🇵 la Honda NSX (la voiture basse)
  function basse(k1, k2) {
    const p = { L: 4.49, W: 1.94, r: 0.35, xAv: 1.35, xAr: -1.3, g: 0.12, hCeinture: 0.84, hToit: 1.2,
      xPareBrise: 0.8, xToitAv: 0.0, xToitAr: -0.75, xLunette: -1.6, Wtoit: 1.42, toitCouleur2: true, details: false, montantX: -0.4,
      galbe: { nez: 0.3, arriere: 0.12, haut: 0.28 },
      dessus: [[2.22, 0.17, 0.1], [2.25, 0.43, 0.15], [1.7, 0.68, 0.4], [0.8, 0.84, 0.08], [-1.6, 0.95, 0.1], [-2.1, 0.98, 0.1], [-2.23, 0.74, 0.1], [-2.22, 0.35, 0.1]],
      cabine: [[0.8, 0.82, 0.05], [0.0, 1.2, 0.3], [-0.75, 1.2, 0.35], [-1.6, 0.93, 0.05]] };
    const g = carrosserie(p, k1, k2);
    // Les phares « bijoux » : une rangée de 4 petites lampes, et un trait de lumière au-dessus.
    for (const cote of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const y = 0.47 + i * 0.03, x = devant(p, y, 0.0);
        lampe(g, M.phare, x, y, cote * pres(p, x, y, 0.14 + i * 0.07), 0.08, 0.06, 0.06, -0.4);
      }
      const yL = 0.57, xL = devant(p, yL, 0.0);
      lampe(g, M.phare, xL, yL, cote * pres(p, xL, yL, 0.3), 0.3, 0.015, 0.03, -0.4, cote * 0.4);
      const yA = 0.25, xA = devant(p, yA, 0.03);
      lampe(g, M.plastique, xA, yA, cote * pres(p, xA, yA, 0.32), 0.06, 0.2, 0.4); // les entrées d'air
      // la grande prise d'air derrière la portière (la NSX a son moteur au milieu)
      surLeFlanc(g, p, -0.62, 0.48, cote, 0.55, 0.26, M.noir, 0.05);
    }
    lampe(g, peinture(k2), devant(p, 0.4, 0.02), 0.4, 0, 0.04, 0.06, 0.7); // la barre noire du nez
    // L'arrière : un fin trait de feux sur toute la largeur, 4 pots au milieu.
    const yF = 0.82, xF = derriere(p, yF, 0.01);
    lampe(g, M.feu, xF, yF, 0, 0.03, 0.04, 2 * pres(p, xF, yF, 0.06));
    const xD = derriere(p, 0.28, 0.06);
    g.add(boite(0.12, 0.18, 1.3, M.plastique, xD, 0.28, 0));
    for (const z of [-0.18, -0.06, 0.06, 0.18]) echappement(g, xD - 0.07, 0.32, z, 0.045);
    retroviseurs(g, p, peinture(k2), 0.9);
    portieres(g, p, [0.75, -0.35], 0.28, 0.82, [-0.25]);
    return { g, roues: ajouterRoues(g, [[1.35, true], [-1.3, false]], 0.84, 0.35, 0.3, M.jante, { rayons: 7, etrier: [0.85, 0.1, 0.1] }), yCapot: 1.05 };
  }

  // ---------------------------------------------------------------- la citadine (genre Clio ou 208)
  function citadine(k1, k2) {
    const p = { L: 4.05, W: 1.78, r: 0.33, xAv: 1.3, xAr: -1.25, g: 0.16, hCeinture: 0.94, hToit: 1.44,
      xPareBrise: 0.85, xToitAv: 0.1, xToitAr: -1.45, xLunette: -1.86, Wtoit: 1.46, toitCouleur2: true, details: false, montantX: -0.4,
      galbe: { nez: 0.26, arriere: 0.2, haut: 0.25 },
      dessus: [[2.0, 0.22, 0.1], [2.03, 0.55, 0.2], [1.6, 0.8, 0.35], [0.85, 0.94, 0.08], [-1.86, 1.0, 0.1], [-1.98, 0.96, 0.12], [-2.02, 0.5, 0.1], [-1.98, 0.3, 0.1]],
      cabine: [[0.85, 0.92, 0.05], [0.1, 1.44, 0.3], [-1.45, 1.42, 0.2], [-1.86, 0.98, 0.05]] };
    const g = carrosserie(p, k1, k2);
    for (const cote of [-1, 1]) {
      const y = 0.68, x = devant(p, y, 0.02);
      lampe(g, M.phare, x, y, cote * pres(p, x, y, 0.24), 0.34, 0.08, 0.22, -0.4, cote * 0.35); // les phares étirés vers l'arrière
      const yC = 0.4, xC = devant(p, yC, 0.02);
      lampe(g, M.phare, xC, yC, cote * pres(p, xC, yC, 0.18), 0.04, 0.18, 0.03, 0.4); // le « croc » de lumière de jour
      const yF = 0.8, xF = derriere(p, yF, 0.0);
      lampe(g, M.feu, xF, yF, cote * pres(p, xF, yF, 0.14), 0.05, 0.28, 0.22); // les feux arrière, sur les coins
    }
    lampe(g, M.plastique, devant(p, 0.42, 0.02), 0.42, 0, 0.05, 0.2, 0.85); // la calandre
    g.add(boite(0.1, 0.14, 1.3, M.plastique, devant(p, 0.25, 0.04), 0.25, 0)); // le bas des pare-chocs, en plastique noir
    g.add(boite(0.1, 0.14, 1.4, M.plastique, derriere(p, 0.28, 0.04), 0.28, 0));
    for (const cote of [-1, 1]) surLeFlanc(g, p, 0, 0.24, cote, 1.9, 0.08, M.plastique, 0.03); // les bas de caisse
    g.add(boite(0.18, 0.06, 0.04, M.noir, -1.25, 1.47, 0)); // l'antenne « aileron de requin »
    retroviseurs(g, p, peinture(k2), 0.9);
    portieres(g, p, [0.8, -0.35, -1.3], 0.32, 0.92, [-0.25, -1.15]);
    return { g, roues: ajouterRoues(g, [[1.3, true], [-1.25, false]], 0.78, 0.33, 0.24, M.jante, { rayons: 10 }), yCapot: 1.3 };
  }

  // ---------------------------------------------------------------- le SUV (genre Peugeot 508)
  function suv(k1, k2) {
    const p = { L: 4.75, W: 1.88, r: 0.4, xAv: 1.45, xAr: -1.4, g: 0.32, hCeinture: 1.1, hToit: 1.62,
      xPareBrise: 0.95, xToitAv: 0.2, xToitAr: -1.2, xLunette: -1.95, Wtoit: 1.58, details: false, montantX: -0.35,
      galbe: { nez: 0.24, arriere: 0.15, haut: 0.22 },
      dessus: [[2.35, 0.35, 0.1], [2.38, 0.75, 0.2], [1.85, 0.98, 0.4], [0.95, 1.1, 0.08], [-1.95, 1.18, 0.1], [-2.28, 1.12, 0.12], [-2.36, 0.8, 0.15], [-2.33, 0.45, 0.1]],
      cabine: [[0.95, 1.08, 0.05], [0.2, 1.62, 0.3], [-1.2, 1.58, 0.45], [-1.95, 1.16, 0.05]] };
    const g = carrosserie(p, k1, k2);
    for (const cote of [-1, 1]) {
      const y = 0.88, x = devant(p, y, 0.02);
      lampe(g, M.phare, x, y, cote * pres(p, x, y, 0.22), 0.32, 0.06, 0.3, -0.3, cote * 0.3); // les phares fins
      const yC = 0.62, xC = devant(p, yC, 0.01);
      lampe(g, M.phare, xC, yC, cote * pres(p, xC, yC, 0.18), 0.04, 0.36, 0.04, 0.25); // les « crocs » : les lampes verticales
      // les feux arrière en 3 « griffes »
      for (let i = 0; i < 3; i++) {
        const yF = 0.98 - i * 0.06, xF = derriere(p, yF, -0.005);
        lampe(g, M.feu, xF, yF, cote * pres(p, xF, yF, 0.22 + i * 0.02), 0.03, 0.025, 0.26, 0.3 * cote);
      }
    }
    const yN = 0.92, xN = derriere(p, yN, -0.004);
    lampe(g, M.noir, xN, yN, 0, 0.03, 0.1, 0.95); // la bande noire entre les feux
    const yG = 0.58, xG = devant(p, yG, 0.01);
    lampe(g, M.plastique, xG, yG, 0, 0.04, 0.3, 1.0); // la grande calandre sans cadre
    for (let i = 0; i < 4; i++) g.add(boite(0.02, 0.012, 0.95, M.chrome, xG + 0.02, 0.47 + i * 0.075, 0));
    g.add(boite(0.12, 0.16, 1.4, M.plastique, devant(p, 0.4, 0.05), 0.4, 0));
    g.add(boite(0.12, 0.16, 1.5, M.plastique, derriere(p, 0.45, 0.05), 0.45, 0));
    passagesNoirs(g, p, [1.45, -1.4], 0.4); // les passages de roues en plastique noir (c'est un SUV !)
    for (const cote of [-1, 1]) {
      surLeFlanc(g, p, 0, 0.42, cote, 2.0, 0.14, M.plastique, 0.04);
      g.add(boite(1.6, 0.05, 0.05, peinture(k2), -0.6, 1.7, cote * 0.6)); // les barres de toit
    }
    retroviseurs(g, p, M.plastique, 1);
    portieres(g, p, [0.9, -0.3, -1.45], 0.45, 1.08, [-0.2, -1.3]);
    return { g, roues: ajouterRoues(g, [[1.45, true], [-1.4, false]], 0.84, 0.4, 0.28, peinture([0.2, 0.2, 0.22]), { rayons: 5 }), yCapot: 1.6 };
  }

  // ---------------------------------------------------------------- la camionnette (genre Mercedes Vito)
  function camionnette(k1, k2) {
    const p = { L: 5.14, W: 1.93, r: 0.37, xAv: 1.65, xAr: -1.55, g: 0.3, hCeinture: 1.12, hToit: 1.9,
      xPareBrise: 1.55, xToitAv: 0.95, xToitAr: -2.45, xLunette: -2.52, Wtoit: 1.86, details: false,
      galbe: { nez: 0.18, arriere: 0.06, haut: 0.1 },
      dessus: [[2.55, 0.35, 0.1], [2.58, 0.75, 0.15], [2.2, 1.02, 0.3], [1.55, 1.12, 0.08], [-2.52, 1.12, 0.05], [-2.56, 0.9, 0.1], [-2.55, 0.4, 0.1]],
      cabine: [[1.55, 1.1, 0.05], [0.95, 1.9, 0.25], [-2.45, 1.9, 0.12], [-2.52, 1.1, 0.03]] };
    const g = carrosserie(p, k1, k2);
    // Les montants peints entre les vitres (on voit la porte coulissante).
    for (const x of [0.65, -0.35, -1.45]) {
      for (const cote of [-1, 1]) {
        const y = 1.5;
        g.add(boite(0.12, 0.72, 0.012, peinture(k1), x, y, cote * ((p.Wtoit / 2) * largeurIci(p, x, y, true) + 0.014)));
      }
    }
    for (const cote of [-1, 1]) {
      const yF = 1.3, xF = derriere(p, yF, -0.01);
      lampe(g, M.feu, xF + 0.02, yF, cote * ((p.Wtoit / 2) * largeurIci(p, xF, yF, true) - 0.08), 0.03, 0.5, 0.1); // les grands feux verticaux
      const y = 0.88, x = devant(p, y, 0.0);
      lampe(g, M.phare, x, y, cote * pres(p, x, y, 0.25), 0.28, 0.14, 0.32, -0.45, cote * 0.25); // les grands phares
      surLeFlanc(g, p, -0.9, 1.06, cote, 1.3, 0.025, M.noir, 0.02); // le rail de la porte coulissante
    }
    // La calandre : 3 lamelles chromées et un rond au milieu (l'emblème).
    const yG = 0.72, xG = devant(p, yG, 0.01);
    lampe(g, M.noir, xG, yG, 0, 0.03, 0.3, 0.8);
    for (let i = 0; i < 3; i++) g.add(boite(0.02, 0.03, 0.8, M.chrome, xG + 0.02, 0.62 + i * 0.1, 0));
    const embleme = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 20), M.chrome);
    embleme.rotation.y = Math.PI / 2;
    embleme.position.set(xG + 0.04, 0.72, 0);
    g.add(embleme);
    g.add(boite(0.12, 0.24, 1.7, M.plastique, devant(p, 0.42, 0.05), 0.42, 0));
    g.add(boite(0.12, 0.24, 1.8, M.plastique, derriere(p, 0.45, 0.05), 0.45, 0));
    retroviseurs(g, p, M.plastique, 1.3);
    portieres(g, p, [1.5, 0.65, -0.35], 0.42, 1.1, [0.75, -0.25]);
    return { g, roues: ajouterRoues(g, [[1.65, true], [-1.55, false]], 0.84, 0.37, 0.25, M.jante, { rayons: 5 }), yCapot: 2.1 };
  }

  // ---------------------------------------------------------------- la moto (genre Kawasaki Ninja)
  function moto(k1, k2) {
    const g = new THREE.Group();
    const vert = peinture(k1), noir = peinture(k2);
    // Le carénage avant pointu, avec les 2 phares et la bulle (le petit pare-brise fumé).
    g.add(extruder([[1.16, 0.72, 0.04], [1.02, 0.96, 0.08], [0.66, 1.1, 0.08], [0.45, 1.0, 0.04], [0.55, 0.62, 0.04]], 0.3, vert, 0.05));
    for (const z of [-0.1, 0.1]) lampe(g, M.phare, 1.1, 0.86, z, 0.12, 0.05, 0.1, -0.7, z > 0 ? 0.5 : -0.5);
    const bulle = boite(0.3, 0.015, 0.26, M.vitreFumee, 0.86, 1.1, 0);
    bulle.rotation.z = 0.5;
    g.add(bulle);
    // Les flancs du carénage (avec une bande de la couleur 2, comme les motos de course), et le sabot sous le moteur.
    for (const cote of [-1, 1]) {
      g.add(boite(0.55, 0.06, 0.02, noir, 0.62, 0.8, cote * 0.205));
      g.add(boite(0.35, 0.03, 0.02, peinture([0.95, 0.95, 0.95]), 0.6, 0.88, cote * 0.205));
    }
    g.add(extruder([[0.55, 0.42, 0.05], [0.4, 0.25, 0.05], [-0.2, 0.25, 0.05], [-0.25, 0.45, 0.05]], 0.4, noir, 0.04));
    // Le réservoir, la selle, la coque arrière qui remonte, le feu.
    g.add(extruder([[0.45, 1.0, 0.1], [0.3, 1.12, 0.15], [-0.15, 1.08, 0.1], [-0.2, 0.85, 0.05], [0.4, 0.8, 0.05]], 0.42, vert, 0.06));
    g.add(boite(0.4, 0.07, 0.28, M.siege, -0.38, 1.0, 0));
    g.add(extruder([[-0.2, 0.95, 0.05], [-0.6, 1.02, 0.05], [-0.95, 1.18, 0.05], [-1.0, 1.12, 0.03], [-0.6, 0.9, 0.05]], 0.24, vert, 0.04));
    lampe(g, M.feu, -1.0, 1.12, 0, 0.03, 0.04, 0.14, -0.6);
    // Le moteur et le cadre, l'échappement court sur le côté droit.
    g.add(boite(0.5, 0.35, 0.34, M.noir, 0.05, 0.52, 0));
    g.add(boite(0.3, 0.2, 0.3, M.disque, 0.1, 0.78, 0));
    for (const cote of [-1, 1]) g.add(tube([0.65, 1.0, cote * 0.12], [-0.3, 0.75, cote * 0.12], 0.03, M.noir));
    const pot = cylindre(0.08, 0.5, M.disque, 14);
    pot.rotation.z = Math.PI / 2 - 0.25;
    pot.position.set(-0.45, 0.48, 0.2);
    g.add(pot);
    // La fourche dorée, le bras oscillant, le guidon (bracelets) et les rétroviseurs.
    const or = peinture([0.85, 0.62, 0.12]);
    for (const z of [-0.09, 0.09]) g.add(tube([0.86, 0.31, z], [0.68, 1.02, z], 0.03, or));
    for (const z of [-0.12, 0.12]) g.add(tube([-0.86, 0.31, z], [-0.05, 0.5, z], 0.03, M.disque));
    for (const z of [-0.2, 0.2]) {
      g.add(tube([0.66, 1.02, z * 0.5], [0.62, 1.0, z], 0.02, M.noir));
      g.add(tube([0.75, 1.1, z * 1.2], [0.72, 1.18, z * 1.4], 0.01, M.noir));
      g.add(boite(0.05, 0.05, 0.1, M.noir, 0.71, 1.2, z * 1.5));
    }
    // Le pilote, penché sur le réservoir.
    const pilote = personnage();
    pilote.g.scale.setScalar(0.85);
    pilote.g.position.set(-0.4, 0.05, 0);
    pilote.g.rotation.z = -0.55;
    casque(pilote, vert);
    for (const j of pilote.jambes) j.rotation.z = 1.2;
    for (const b of pilote.bras) b.rotation.z = 1.35;
    g.add(pilote.g);
    // Deux roues (une devant qui braque, une derrière), centrées sur la moto.
    const roues = [];
    for (const [x, avant, epaisseur] of [[0.86, true, 0.12], [-0.86, false, 0.18]]) {
      const r = O.roue(0.31, epaisseur, peinture([0.1, 0.1, 0.11]), { rayons: 3, etrier: avant ? [0.85, 0.62, 0.12] : undefined });
      r.pivot.position.set(x, 0.31, 0);
      g.add(r.pivot);
      roues.push(Object.assign(r, { avant }));
    }
    return { g, roues, yCapot: 1.5 };
  }

  // ---------------------------------------------------------------- le quad (plus réaliste)
  // Un garde-boue : un morceau d'anneau (de l'angle a0 à a1), épais de `e`, large de `largeur`, centré sur la roue.
  function gardeBoue(rayon, e, largeur, a0, a1, materiau) {
    const s = new THREE.Shape();
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      if (i === 0) s.moveTo(Math.cos(a) * rayon, Math.sin(a) * rayon);
      else s.lineTo(Math.cos(a) * rayon, Math.sin(a) * rayon);
    }
    for (let i = n; i >= 0; i--) {
      const a = a0 + ((a1 - a0) * i) / n;
      s.lineTo(Math.cos(a) * (rayon + e), Math.sin(a) * (rayon + e));
    }
    const geo = new THREE.ExtrudeGeometry(s, { depth: largeur, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    geo.translate(0, 0, -largeur / 2);
    const m = new THREE.Mesh(geo, materiau);
    m.castShadow = true;
    return m;
  }
  function quad(k1, k2) {
    const g = new THREE.Group();
    const plastique = peinture(k1);
    // Les grands garde-boue en plastique, devant et derrière (ils couvrent les deux roues).
    for (const [x, a0, a1] of [[0.8, 0.0, 2.4], [-0.75, 0.75, 3.14]]) {
      const gb = gardeBoue(0.38, 0.05, 1.35, a0, a1, plastique);
      gb.position.set(x, 0.32, 0);
      g.add(gb);
    }
    // Le corps entre les deux : réservoir, selle, moteur.
    g.add(extruder([[0.55, 0.72, 0.05], [0.4, 0.92, 0.1], [0.0, 0.92, 0.1], [-0.25, 0.85, 0.05], [-0.25, 0.6, 0.05], [0.5, 0.55, 0.05]], 0.55, plastique, 0.05));
    g.add(extruder([[0.05, 0.92, 0.06], [-0.1, 1.0, 0.06], [-0.85, 0.98, 0.08], [-0.9, 0.86, 0.05], [0.05, 0.86, 0.03]], 0.4, M.siege, 0.05));
    g.add(boite(0.55, 0.38, 0.45, M.noir, -0.05, 0.42, 0));
    g.add(boite(0.3, 0.2, 0.3, M.disque, 0.05, 0.3, 0.12));
    // Les porte-bagages en tubes noirs, au-dessus des garde-boue.
    for (const [x0, x1, y] of [[0.55, 1.05, 0.83], [-0.5, -1.05, 0.88]]) {
      for (const z of [-0.45, 0.45]) g.add(tube([x0, y, z], [x1, y, z], 0.018, M.noir));
      for (let k = 0; k <= 3; k++) {
        const x = x0 + ((x1 - x0) * k) / 3;
        g.add(tube([x, y, -0.45], [x, y, 0.45], 0.015, M.noir));
      }
    }
    // Le pare-buffle devant, les phares dans le garde-boue, les repose-pieds, le guidon et ses protège-mains.
    g.add(tube([1.2, 0.35, -0.3], [1.2, 0.35, 0.3], 0.03, M.noir));
    for (const z of [-0.3, 0.3]) g.add(tube([1.2, 0.35, z], [0.95, 0.55, z * 0.6], 0.03, M.noir));
    for (const z of [-0.2, 0.2]) lampe(g, M.phare, 1.12, 0.68, z, 0.04, 0.08, 0.14, -0.6);
    lampe(g, M.feu, -1.13, 0.7, 0, 0.03, 0.06, 0.25);
    for (const cote of [-1, 1]) g.add(boite(0.55, 0.04, 0.2, M.noir, -0.05, 0.36, cote * 0.45));
    g.add(tube([0.4, 0.9, 0], [0.3, 1.18, 0], 0.035, M.noir));
    g.add(tube([0.3, 1.18, -0.42], [0.3, 1.18, 0.42], 0.022, M.noir)); // le guidon
    for (const cote of [-1, 1]) {
      const pm = boite(0.16, 0.12, 0.05, peinture(k2), 0.36, 1.2, cote * 0.4);
      pm.rotation.y = cote * 0.4;
      g.add(pm);
    }
    // Les suspensions avant (on voit les ressorts).
    for (const z of [-0.42, 0.42]) g.add(tube([0.8, 0.32, z], [0.55, 0.75, z * 0.6], 0.035, peinture(k2)));
    // Le pilote, assis, les mains sur le guidon.
    const pilote = personnage();
    pilote.g.scale.setScalar(0.9);
    pilote.g.position.set(-0.45, 0.15, 0);
    casque(pilote, peinture(k2));
    for (const j of pilote.jambes) j.rotation.z = 1.25;
    for (const b of pilote.bras) b.rotation.z = 1.0;
    g.add(pilote.g);
    const roues = [];
    for (const [x, avant, e] of [[0.8, true, 0.24], [-0.75, false, 0.3]]) {
      for (const cote of [-1, 1]) {
        const r = O.roue(0.32, e, peinture([0.15, 0.15, 0.16]), { rayons: 4, crampons: true, etrier: false });
        r.pivot.position.set(x, 0.32, cote * 0.5);
        g.add(r.pivot);
        roues.push(Object.assign(r, { avant }));
      }
    }
    return { g, roues, yCapot: 1.9 };
  }

  // ---------------------------------------------------------------- le monster truck rétro, à ressorts
  // Un ressort : un fil qui tourne en hélice (un « tire-bouchon »), de hauteur 1 (on l'étire ou l'écrase avec scale.y).
  function ressort(rayon, tours, fil, materiau) {
    const points = [];
    for (let i = 0; i <= tours * 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * rayon, i / (tours * 16), Math.sin(a) * rayon));
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), tours * 16, fil, 6), materiau);
    m.castShadow = true;
    return m;
  }
  function monster(k1, k2) {
    const g = new THREE.Group();
    const caisse = new THREE.Group(); // tout ce qui est posé sur les ressorts (et qui rebondit)
    g.add(caisse);
    const h = 1.55; // le bas de la carrosserie
    // ✍️ Un vieux pick-up des années 80 : tout carré, un long capot plat, la benne derrière.
    const p = { L: 4.9, W: 2.1, r: 0.3, xAv: 0, xAr: 0, g: h, hCeinture: h + 0.9, hToit: h + 1.5, passages: false, chanfrein: 0.04,
      xPareBrise: 0.95, xToitAv: 0.65, xToitAr: -0.35, xLunette: -0.42, Wtoit: 1.9, details: false,
      dessus: [[2.45, h + 0.05, 0.03], [2.47, h + 0.72, 0.05], [2.3, h + 0.85, 0.05], [0.95, h + 0.9, 0.03], [-0.42, h + 0.9, 0.02], [-0.45, h + 0.45, 0.02], [-2.45, h + 0.45, 0.02], [-2.47, h + 0.1, 0.03]] };
    const corps = carrosserie(p, k1, k2);
    caisse.add(corps);
    const peint = peinture(k1);
    // La benne : les parois, le hayon, le fond noir, l'arceau avec 4 phares ronds.
    for (const cote of [-1, 1]) caisse.add(boite(2.0, 0.48, 0.08, peint, -1.45, h + 0.68, cote * 1.01));
    caisse.add(boite(0.08, 0.48, 2.1, peint, -2.43, h + 0.68, 0));
    caisse.add(boite(1.95, 0.02, 1.9, M.noir, -1.45, h + 0.46, 0));
    for (const cote of [-1, 1]) caisse.add(tube([-0.6, h + 0.9, cote * 0.85], [-0.6, h + 1.75, cote * 0.85], 0.05, M.chrome));
    caisse.add(tube([-0.6, h + 1.75, -0.85], [-0.6, h + 1.75, 0.85], 0.05, M.chrome));
    for (const z of [-0.6, -0.2, 0.2, 0.6]) {
      const ph = cylindre(0.11, 0.1, M.phare, 16);
      ph.rotation.z = Math.PI / 2;
      ph.position.set(-0.52, h + 1.85, z);
      caisse.add(ph);
    }
    // ✍️ Les chromes : le gros pare-chocs, la calandre à barreaux et les 4 phares RONDS.
    caisse.add(boite(0.2, 0.25, 2.2, M.chrome, 2.52, h + 0.12, 0));
    caisse.add(boite(0.2, 0.22, 2.2, M.chrome, -2.52, h + 0.12, 0));
    caisse.add(boite(0.04, 0.42, 1.5, M.noir, 2.48, h + 0.48, 0));
    for (let i = 0; i < 4; i++) caisse.add(boite(0.05, 0.03, 1.5, M.chrome, 2.5, h + 0.33 + i * 0.1, 0));
    for (const cote of [-1, 1]) {
      for (const dz of [0, 0.22]) {
        const ph = cylindre(0.09, 0.06, M.phare, 18);
        ph.rotation.z = Math.PI / 2;
        ph.position.set(2.5, h + 0.48, cote * (0.62 + dz));
        caisse.add(ph);
        const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 6, 18), M.chrome);
        anneau.rotation.y = Math.PI / 2;
        anneau.position.set(2.52, h + 0.48, cote * (0.62 + dz));
        caisse.add(anneau);
      }
      lampe(caisse, M.feu, -2.48, h + 0.6, cote * 0.85, 0.03, 0.25, 0.15);
      // ✍️ Les GROS rétroviseurs chromés, au bout d'un long bras.
      caisse.add(tube([0.9, h + 1.0, cote * 1.05], [0.85, h + 1.15, cote * 1.35], 0.025, M.chrome));
      caisse.add(boite(0.08, 0.38, 0.25, M.chrome, 0.85, h + 1.25, cote * 1.38));
      caisse.add(boite(0.01, 0.33, 0.21, M.vitre, 0.81, h + 1.25, cote * 1.38));
      // Les bandes rétro sur les flancs (3 bandes, comme dans les années 80) et la poignée.
      ["#ff8a1a", "#ffd21a", "#e8352e"].forEach((couleur, i) => {
        const c = new THREE.Color(couleur);
        caisse.add(boite(4.6, 0.07, 0.02, i === 0 ? peinture(k2) : peinture([c.r, c.g, c.b]), 0, h + 0.62 - i * 0.1, cote * 1.065));
      });
      caisse.add(boite(0.2, 0.04, 0.03, M.chrome, 0.1, h + 0.8, cote * 1.07));
    }
    // Le châssis (lui aussi sur les ressorts).
    caisse.add(boite(4.0, 0.22, 0.25, M.noir, 0, 1.18, -0.6));
    caisse.add(boite(4.0, 0.22, 0.25, M.noir, 0, 1.18, 0.6));
    // Les essieux (ils restent avec les roues), les RESSORTS et les amortisseurs entre l'essieu et le châssis.
    const ressorts = [];
    const bas = 0.95, haut = 1.08; // le ressort va de l'essieu (bas) au châssis (haut + ce qui rebondit)
    for (const x of [-1.65, 1.65]) {
      const essieu = cylindre(0.11, 2.4, M.noir, 10);
      essieu.rotation.x = Math.PI / 2;
      essieu.position.set(x, bas, 0);
      g.add(essieu);
      g.add(boite(0.4, 0.3, 0.4, M.noir, x, bas, 0)); // le différentiel
      for (const z of [-0.6, 0.6]) {
        for (const dx of [-0.22, 0.22]) {
          const r = ressort(0.11, 6, 0.025, peinture(k2));
          r.position.set(x + dx, bas, z);
          r.userData.base = haut - bas + 0.25; // la longueur du ressort au repos (m)
          r.scale.y = r.userData.base;
          g.add(r);
          ressorts.push(r);
        }
        const amorti = cylindre(0.05, 0.4, M.chrome, 10);
        amorti.position.set(x, bas + 0.25, z);
        g.add(amorti);
      }
    }
    // Les roues géantes, avec des crampons.
    const roues = [];
    for (const [x, avant] of [[1.65, true], [-1.65, false]]) {
      for (const cote of [-1, 1]) {
        const r = O.roue(0.95, 0.75, M.chrome, { rayons: 8, crampons: true, etrier: false });
        r.pivot.position.set(x, 0.95, cote * 1.32);
        g.add(r.pivot);
        roues.push(Object.assign(r, { avant }));
      }
    }
    return { g, roues, yCapot: 3.3, caisse, ressorts };
  }

  Circuit.Modeles.ajouter({ chiron, porsche911, aventador, basse, citadine, suv, camionnette, moto, quad, monster });
  return { ressort };
})();
