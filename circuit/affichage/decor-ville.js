// 🏗️ LE DÉCOR DE LA VILLE : l'architecte
//
// Étape 39. Il fabrique la ville avec Three.js (et depuis l'étape 42, il appelle affichage/decor-archipel.js
// pour la mer, les îles, les ponts et les aéroports) : le goudron des rues, les lignes blanches et les passages
// piétons, les trottoirs, les immeubles (une boîte avec une façade à fenêtres collée dessus, et un toit),
// les parcs (herbe, étang, arbres, allées), les feux tricolores à chaque carrefour et les lampadaires.
//
// Les FEUX changent de couleur pendant le jeu : chaque lampe a un matériau qu'on « allume » (il brille)
// ou qu'on « éteint ». La couleur vient de logique/circulation.js : ce que tu vois, c'est ce que les
// voitures de la circulation respectent.
//
// Étape 55 : les immeubles ne sont plus des boîtes lisses. Une vraie façade a du RELIEF, qui fait des ombres :
// un socle en pierre, un bandeau à chaque étage, une corniche et un muret (l'« acrotère ») tout en haut, des
// magasins au rez-de-chaussée avec leurs stores, des balcons en fer forgé, des montants sur les tours de verre,
// et sur les toits des machines, des cages d'escalier, des réservoirs d'eau et des antennes.
// Tous ces morceaux sont des « instances » d'une seule boîte (plus de 10 000 morceaux, en quelques dessins).

window.Circuit = window.Circuit || {};

Circuit.DecorVille = (function () {
  const V = Circuit.CONFIG.ville;

  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }

  function plat(largeur, profondeur, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, profondeur), materiau);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const mat = D.mat;
    const Ville = Circuit.Ville;
    const g = new THREE.Group();
    const taille = Ville.taille;

    // Autour de la ville : l'archipel (la mer, les îles, les ponts, les aéroports, étape 42).
    // Dans la ville : le goudron des rues (les pâtés sont posés dessus).
    const archipel = Circuit.DecorArchipel.construire();
    g.add(archipel.groupe);
    g.add(plat(taille, taille, mat({ map: repeter(T.goudron(), taille / 10, taille / 10), roughness: 0.85 }), 0, 0.02, 0));

    // Les lignes blanches au milieu des rues, et les passages piétons aux carrefours. Il y en a plus de
    // 1 500 : on les dessine en « instances » (un seul rectangle blanc, et la place + la taille de chacun).
    const traits = [];
    for (let k = 0; k < Ville.n; k++) {
      for (let l = 0; l < Ville.n - 1; l++) {
        const a = Ville.rue(l) + V.largeurRue / 2 + 6, b = Ville.rue(l + 1) - V.largeurRue / 2 - 6;
        for (let s = a; s < b; s += 6) traits.push([s + 1.5, Ville.rue(k), 3, 0.25], [Ville.rue(k), s + 1.5, 0.25, 3]);
      }
      for (let l = 0; l < Ville.n; l++) {
        const cx = Ville.rue(k), cz = Ville.rue(l);
        for (const cote of [-1, 1]) {
          for (let b = -6; b <= 6; b += 2) traits.push([cx + cote * (V.largeurRue / 2 + 2), cz + b, 3.2, 0.9], [cx + b, cz + cote * (V.largeurRue / 2 + 2), 0.9, 3.2]);
        }
      }
    }
    const geoTrait = new THREE.PlaneGeometry(1, 1);
    geoTrait.rotateX(-Math.PI / 2);
    const peinture = new THREE.InstancedMesh(geoTrait, mat({ color: 0xf2f2f2, roughness: 0.6 }), traits.length);
    const m4 = new THREE.Matrix4();
    traits.forEach(([x, z, lx, lz], i) => peinture.setMatrixAt(i, m4.makeScale(lx, 1, lz).setPosition(x, 0.03, z)));
    peinture.receiveShadow = true;
    g.add(peinture);

    // Les pâtés de maisons : un trottoir tout autour, puis un parc ou 4 immeubles.
    const trottoir = mat({ map: repeter(T.trottoir(), V.tailleBloc / 3, V.tailleBloc / 3), roughness: 0.9 });
    const herbe = mat({ map: repeter(T.herbe(), 5, 5) });
    for (let i = 0; i < V.blocs; i++) {
      for (let j = 0; j < V.blocs; j++) {
        const cx = (Ville.rue(i) + Ville.rue(i + 1)) / 2, cz = (Ville.rue(j) + Ville.rue(j + 1)) / 2;
        const pave = new THREE.Mesh(new THREE.BoxGeometry(V.tailleBloc, 0.12, V.tailleBloc), trottoir);
        pave.position.set(cx, 0.06, cz);
        pave.receiveShadow = true;
        g.add(pave);
        const interieur = V.tailleBloc - 2 * V.trottoir;
        if (Ville.parc(i, j)) {
          g.add(plat(interieur, interieur, herbe, cx, 0.13, cz));
          // Les allées en croix, et l'étang au milieu.
          const allee = mat({ map: repeter(T.terre(), 6, 1) });
          g.add(plat(interieur, 4, allee, cx, 0.14, cz));
          g.add(plat(4, interieur, allee, cx, 0.14, cz));
          const etang = new THREE.Mesh(new THREE.CircleGeometry(9, 40), Circuit.Eau.materiau({ couleur: 0x2c5d6a, repetition: 2, vitesse: 0.6 })); // étape 48 : de l'eau qui ondule
          etang.rotation.x = -Math.PI / 2;
          etang.position.set(cx, 0.15, cz);
          g.add(etang);
          const bord = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.35, 8, 40), mat({ color: 0xa8a49a }));
          bord.rotation.x = Math.PI / 2;
          bord.position.set(cx, 0.18, cz);
          g.add(bord);
        } else {
          // La ruelle en croix, en goudron.
          const goudron = mat({ map: repeter(T.goudron(), 6, 1) });
          g.add(plat(interieur, V.ruelle, goudron, cx, 0.13, cz));
          g.add(plat(V.ruelle, interieur, goudron, cx, 0.131, cz));
        }
      }
    }

    const fenetres = []; // étape 50 : les matériaux des façades (pour allumer les fenêtres quand il fait sombre)
    // Les immeubles : la façade à fenêtres sur les 4 côtés, un toit sombre, et quelques machines sur le toit.
    const toit = mat({ map: repeter(T.toit(), 4, 4) });
    const machine = mat({ color: 0x9a9da2, metalness: 0.5, roughness: 0.5 });
    for (const b of Ville.immeubles) {
      const L = 2 * b.demiLongueur, P = 2 * b.demiLargeur, H = b.hauteur;
      // (Étape 50 : un carreau de façade = 16 m × 14 m, et les fenêtres allumées brillent quand il fait sombre.)
      const face = (largeur) => {
        const m = mat({ map: repeter(T.facade(b.style), largeur / 16, H / 14), roughness: 0.6, metalness: b.style === 3 ? 0.5 : 0.1,
          emissiveMap: repeter(T.facadeLumiere(b.style), largeur / 16, H / 14), emissive: 0xffffff, emissiveIntensity: V.fenetresAllumees.minimum });
        fenetres.push(m);
        return m;
      };
      const faceX = face(P), faceZ = face(L);
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, H, P), [faceX, faceX, toit, toit, faceZ, faceZ]);
      m.position.set(b.x, H / 2 + 0.12, b.z);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      const clim = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 2.5), machine);
      clim.position.set(b.x + L * 0.2, H + 0.87, b.z - P * 0.2);
      clim.castShadow = true;
      g.add(clim);
    }

    // Étape 55 : le RELIEF des immeubles (bandeaux, corniches, magasins, balcons, toits), et l'usure des rues.
    reliefs(g, mat, fenetres);
    usure(g, mat);

    // Les arbres des parcs (ce sont aussi des obstacles solides).
    g.add(D.foret(Ville.arbres.map((a) => [a.x, a.z, a.taille]), "ville"));

    // Étape 48 : l'herbe, les fleurs et les rochers des parcs (pas sur les allées ni dans l'étang),
    // des roseaux tout autour des étangs, et de l'herbe sur le bord de l'île, entre la ville et la plage.
    const AR = Circuit.Archipel, A = Circuit.CONFIG.archipel, NA = Circuit.CONFIG.nature;
    const parcs = [];
    for (let i = 0; i < V.blocs; i++) {
      for (let j = 0; j < V.blocs; j++) {
        if (!Ville.parc(i, j)) continue;
        const interieur = V.tailleBloc - 2 * V.trottoir;
        const x0 = Ville.rue(i) + V.largeurRue / 2 + V.trottoir, z0 = Ville.rue(j) + V.largeurRue / 2 + V.trottoir;
        parcs.push({ x0, z0, l: interieur, cx: x0 + interieur / 2, cz: z0 + interieur / 2 });
      }
    }
    const bordVille = Ville.taille / 2 + 2, bordIle = A.ileVille - 3;
    const surUnPont = (x, z) => AR.ponts.some((p) => {
      // la distance au bout de route qui mène au pont (de 32 m avant son début à 4 m après)
      const dx = x - p.de[0], dz = z - p.de[1], u = Math.max(-32, Math.min(4, dx * p.ux + dz * p.uz));
      return Math.hypot(dx - p.ux * u, dz - p.uz * u) < p.largeur / 2 + 3;
    });
    g.add(Circuit.Nature.tapis({
      carte: "ville", graine: 4848,
      candidat: (a) => {
        if (a() < 0.55 && parcs.length) {
          const p = parcs[Math.floor(a() * parcs.length)];
          return { x: p.x0 + 2 + a() * (p.l - 4), z: p.z0 + 2 + a() * (p.l - 4), y: 0.13 };
        }
        // le bord de l'île : un des 4 côtés
        const cote = Math.floor(a() * 4), le_long = (a() * 2 - 1) * bordIle, loin = bordVille + a() * (bordIle - bordVille);
        return cote === 0 ? { x: loin, z: le_long } : cote === 1 ? { x: -loin, z: le_long } : cote === 2 ? { x: le_long, z: loin } : { x: le_long, z: -loin };
      },
      libre: (x, z) => {
        const p = parcs.find((q) => x > q.x0 && x < q.x0 + q.l && z > q.z0 && z < q.z0 + q.l);
        if (p) return Math.abs(x - p.cx) > 4 && Math.abs(z - p.cz) > 4 && Math.hypot(x - p.cx, z - p.cz) > 12;
        if (Math.max(Math.abs(x), Math.abs(z)) < bordVille || Math.max(Math.abs(x), Math.abs(z)) > bordIle) return false;
        return !surUnPont(x, z);
      },
      herbes: Math.round(NA.herbes * 0.6), fleurs: Math.round(NA.fleurs * 0.6), rochers: Math.round(NA.rochers * 0.3),
    }));
    g.add(Circuit.Nature.tapis({
      carte: "ville", graine: 4949, roseaux: true, fleurs: 0, rochers: 0, herbes: 140 * Ville.etangs.length,
      candidat: (a) => {
        const e = Ville.etangs[Math.floor(a() * Ville.etangs.length)], angle = a() * Math.PI * 2, r = e.rayon + 0.3 + a() * 1.2;
        return { x: e.x + Math.cos(angle) * r, z: e.z + Math.sin(angle) * r, y: 0.13 };
      },
    }));

    // Les feux tricolores : à 2 coins de chaque carrefour, un poteau et 2 boîtiers (un pour chaque rue).
    const feux = construireFeux(g);

    // Les lampadaires, le long des rues.
    const lampadaires = [];
    for (let k = 0; k < Ville.n; k++) {
      for (let l = 0; l < Ville.n - 1; l++) {
        const s = (Ville.rue(l) + Ville.rue(l + 1)) / 2;
        lampadaires.push([s, Ville.rue(k) - V.largeurRue / 2 - 1], [Ville.rue(k) + V.largeurRue / 2 + 1, s]);
      }
    }
    const poteaux = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), mat({ color: 0x3a3d42, metalness: 0.6, roughness: 0.4 }), lampadaires.length);
    const lampes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffe9a8, emissiveIntensity: 0.8 }), lampadaires.length);
    lampadaires.forEach(([x, z], i) => {
      poteaux.setMatrixAt(i, m4.makeTranslation(x, 3.5, z));
      lampes.setMatrixAt(i, m4.makeTranslation(x, 7.1, z));
    });
    poteaux.castShadow = true;
    g.add(poteaux, lampes);


    // Étape 50 : le mobilier de la rue (panneaux, plaques de rue, bancs, poubelles, bouches d'incendie, plaques d'égout, bordures).
    mobilier(g, mat);

    // Chaque image : on allume les bonnes lampes des feux.
    function maj(temps) {
      archipel.maj(temps);
      // Étape 50 : plus le soleil est faible (pluie, orage, brouillard…), plus les fenêtres allumées brillent.
      const F = V.fenetresAllumees;
      lumiereFenetres = F.minimum + F.force * Math.max(0, 1 - Circuit.Meteo.etat.valeurs.lumiere);
      for (const m of fenetres) m.emissiveIntensity = lumiereFenetres;
      for (const groupe of feux) {
        for (const axe of ["x", "z"]) {
          const couleur = Circuit.Circulation.feu(temps, groupe.decalage, 0, axe);
          for (const nom of ["rouge", "orange", "vert"]) groupe[axe][nom].emissiveIntensity = couleur === nom ? 3 : 0.04;
        }
      }
    }
    return { groupe: g, maj };
  }

  let lumiereFenetres = V.fenetresAllumees.minimum;

  // Étape 55 : le relief des façades et des toits. Chaque morceau est une boîte (de 1 m de côté) agrandie et posée :
  // on range tous les morceaux d'une même matière dans une liste, puis on les dessine en « instances ».
  function reliefs(g, mat, fenetres) {
    const Ville = Circuit.Ville, T = Circuit.Textures, R = V.reliefs; // (angle : le côté regarde vers (sin angle, cos angle))
    let etat = V.graine + 55;
    const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const listes = {}; // matière → [[x, y, z, lx, ly, lz, angle, couleur]]
    const ajouter = (matiere, x, y, z, lx, ly, lz, couleur, angle) => (listes[matiere] = listes[matiere] || []).push([x, y, z, lx, ly, lz, angle || 0, couleur]);
    // Un morceau qui fait le tour de l'immeuble (un bandeau, une corniche…) : 4 boîtes, une par côté.
    const ceinture = (matiere, b, y, haut, sortie, couleur) => {
      const L = 2 * b.demiLongueur, P = 2 * b.demiLargeur;
      ajouter(matiere, b.x, y, b.z - b.demiLargeur - sortie / 2, L + 2 * sortie, haut, sortie, couleur);
      ajouter(matiere, b.x, y, b.z + b.demiLargeur + sortie / 2, L + 2 * sortie, haut, sortie, couleur);
      ajouter(matiere, b.x - b.demiLongueur - sortie / 2, y, b.z, sortie, haut, P, couleur);
      ajouter(matiere, b.x + b.demiLongueur + sortie / 2, y, b.z, sortie, haut, P, couleur);
    };
    // Les 4 côtés d'un immeuble : le milieu du côté, sa direction (le long), sa normale (vers la rue) et sa longueur.
    const cotes = (b) => [
      { x: b.x, z: b.z - b.demiLargeur, ux: 1, uz: 0, nx: 0, nz: -1, l: 2 * b.demiLongueur, angle: Math.PI },
      { x: b.x, z: b.z + b.demiLargeur, ux: 1, uz: 0, nx: 0, nz: 1, l: 2 * b.demiLongueur, angle: 0 },
      { x: b.x - b.demiLongueur, z: b.z, ux: 0, uz: 1, nx: -1, nz: 0, l: 2 * b.demiLargeur, angle: -Math.PI / 2 },
      { x: b.x + b.demiLongueur, z: b.z, ux: 0, uz: 1, nx: 1, nz: 0, l: 2 * b.demiLargeur, angle: Math.PI / 2 },
    ];
    const PIERRE = [0xe6dcc6, 0xe2d8c8, 0xb4bac0, 0x23272c]; // la couleur des bandeaux, pour chaque style de façade
    const STORES = [0x8a1f1a, 0x1f4d3a, 0x2a3f6e, 0xb88a2a, 0x5a2a5a, 0x3a6e3a];
    // Les vitrines : 8 formes (2 variantes × 4 boutiques), chacune ne montre qu'un quart de sa bande de magasins.
    const vitrineMat = [0, 1].map((v) => {
      const m = mat({ map: T.vitrines(v), emissiveMap: T.vitrinesLumiere(v), emissive: 0xffffff, emissiveIntensity: V.fenetresAllumees.minimum, roughness: 0.35, metalness: 0.1 });
      fenetres.push(m); // (elles s'allument avec les fenêtres quand il fait sombre)
      return m;
    });
    const formeBoutique = [0, 1, 2, 3].map((k) => {
      const f = new THREE.PlaneGeometry(1, 1);
      const uv = f.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (k + uv.getX(i)) / 4);
      return f;
    });
    const balcons = [];
    let vitrinesPosees = 0;
    Ville.immeubles.forEach((b, n) => {
      const H = b.hauteur, base = 0.12, etages = Math.floor(H / R.etage), verre = b.style === 3;
      const pierre = PIERRE[b.style];
      // le socle (en bas) et, en haut, la corniche puis le muret du toit (l'acrotère) avec sa couvertine
      if (!verre) ceinture("pierre", b, base + 0.45, 0.9, 0.12, 0x8d877c);
      ceinture("pierre", b, base + H - 0.3, 0.6, verre ? 0.08 : 0.3, pierre);
      ceinture("pierre", b, base + H + 0.55, 1.1, 0.25, verre ? 0x30353b : pierre);
      // un bandeau à chaque étage (au niveau du plancher), sauf pour les tours de verre
      if (!verre) for (let f = 1; f < etages; f++) ceinture("pierre", b, base + f * R.etage + 0.28, 0.18, 0.14, pierre);
      for (const c of cotes(b)) {
        // les tours de verre : un montant vertical tous les 4 m (comme les fenêtres)
        if (verre) {
          for (let d = -c.l / 2 + R.fenetre; d < c.l / 2 - 0.5; d += R.fenetre) {
            ajouter("metal", c.x + c.ux * d + c.nx * 0.15, base + H / 2, c.z + c.uz * d + c.nz * 0.15, c.ux ? 0.18 : 0.3, H, c.uz ? 0.18 : 0.3, 0x2c3138);
          }
          continue;
        }
        // le rez-de-chaussée : des boutiques de 8 m environ (posées juste devant la façade), et un store devant une sur deux
        const nb = Math.max(1, Math.round(c.l / R.boutique)), lb = c.l / nb;
        for (let k = 0; k < nb; k++) {
          const d = -c.l / 2 + (k + 0.5) * lb;
          ajouter("vitrine" + (n % 2) + "-" + ((k + n) % 4), c.x + c.ux * d + c.nx * 0.05, base + R.etage / 2 - 0.02, c.z + c.uz * d + c.nz * 0.05, lb - 0.1, R.etage - 0.1, 1, null, c.angle);
          vitrinesPosees++;
          if (hasard() < 0.5) continue;
          ajouter("store", c.x + c.ux * d + c.nx * 0.8, base + 3.05, c.z + c.uz * d + c.nz * 0.8, lb * 0.7, 0.06, 1.5, STORES[Math.floor(hasard() * STORES.length)], c.angle);
        }
        // les balcons (les immeubles en pierre) : aux étages 2 et 5, sur toute la longueur du côté
        if (b.style === 0) {
          for (const f of [2, 5]) {
            if (f >= etages - 1) continue;
            const y = base + f * R.etage + 0.2;
            ajouter("pierre", c.x + c.nx * 0.45, y, c.z + c.nz * 0.45, c.ux ? c.l : 0.9, 0.16, c.uz ? c.l : 0.9, pierre);
            balcons.push({ x: c.x + c.nx * 0.88, y: y + 0.58, z: c.z + c.nz * 0.88, l: c.l, angle: c.angle });
          }
        }
      }
      // le toit : 1 à 3 machines (climatisation), une cage d'escalier, et parfois un réservoir d'eau ou une antenne
      const L = 2 * b.demiLongueur, P = 2 * b.demiLargeur, toit = base + H;
      const nm = 1 + Math.floor(hasard() * 3);
      for (let k = 0; k < nm; k++) {
        ajouter("metal", b.x + (hasard() - 0.5) * L * 0.6, toit + 0.75, b.z + (hasard() - 0.5) * P * 0.6, 2 + hasard() * 1.5, 1.5, 1.6 + hasard(), 0x9a9da2);
      }
      ajouter("pierre", b.x - L * 0.25, toit + 1.5, b.z + P * 0.22, 3.2, 3, 3.6, verre ? 0x30353b : 0xa8a49a);
      if (!verre && hasard() < 0.45) {
        const rx = b.x + L * 0.22, rz = b.z + P * 0.2;
        ajouter("reservoir", rx, toit + 3.6, rz, 2.6, 3, 2.6, 0x8a6a4a);
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ajouter("metal", rx + dx * 0.9, toit + 1, rz + dz * 0.9, 0.15, 2.1, 0.15, 0x3a3d42);
      }
      if (H > 45) ajouter("metal", b.x + L * 0.1, toit + 5, b.z - P * 0.1, 0.18, 9, 0.18, 0x6a6e74);
    });

    // On dessine chaque liste en instances.
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), haut = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), e = new THREE.Vector3(), c = new THREE.Color();
    const matieres = {
      pierre: mat({ color: 0xffffff, roughness: 0.85 }),
      metal: mat({ color: 0xffffff, roughness: 0.45, metalness: 0.6 }),
      store: mat({ color: 0xffffff, roughness: 0.9, side: THREE.DoubleSide }),
      reservoir: mat({ color: 0xffffff, roughness: 0.9 }),
    };
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const cylindre = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
    const penche = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.35); // le store penche vers la rue
    let morceaux = 0;
    for (const [nom, liste] of Object.entries(listes)) {
      const vitrine = nom.startsWith("vitrine"); // (une vitrine est une image plate, tournée vers la rue)
      const forme = vitrine ? formeBoutique[+nom.slice(-1)] : nom === "reservoir" ? cylindre : cube;
      const im = new THREE.InstancedMesh(forme, vitrine ? vitrineMat[+nom.charAt(7)] : matieres[nom], liste.length);
      liste.forEach(([x, y, z, lx, ly, lz, angle, couleur], i) => {
        q.setFromAxisAngle(haut, angle);
        if (nom === "store") q.multiply(penche);
        // (une boîte est posée de travers selon sa liste (lx le long de x) ; une vitrine ou un store, selon son angle)
        im.setMatrixAt(i, m4.compose(v.set(x, y, z), q, e.set(lx, ly, lz)));
        if (!vitrine) im.setColorAt(i, c.setHex(couleur));
      });
      im.castShadow = !vitrine;
      im.receiveShadow = true;
      g.add(im);
      morceaux += liste.length;
    }
    // Les garde-corps des balcons : une image de barreaux en fer forgé (transparente entre les barreaux), posée par
    // morceaux d'environ 4 m (comme ça, tous les morceaux sont des instances d'une seule forme).
    const grille = mat({ map: T.gardeCorps(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
    const morceauxGrille = [];
    for (const bc of balcons) {
      const nb = Math.max(1, Math.round(bc.l / 4)), lm = bc.l / nb, ux = Math.cos(bc.angle), uz = -Math.sin(bc.angle);
      for (let k = 0; k < nb; k++) {
        const d = -bc.l / 2 + (k + 0.5) * lm;
        morceauxGrille.push([bc.x + ux * d, bc.y, bc.z + uz * d, lm, bc.angle]);
      }
    }
    const imGrille = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), grille, morceauxGrille.length);
    morceauxGrille.forEach(([x, y, z, l, angle], i) => imGrille.setMatrixAt(i, m4.compose(v.set(x, y, z), q.setFromAxisAngle(haut, angle), e.set(l, 1, 1))));
    g.add(imGrille);
    Circuit.DecorVille.bilanReliefs = { morceaux, balcons: balcons.length, vitrines: vitrinesPosees };
  }

  // Étape 55 : l'usure des rues (les caniveaux et les traces des roues), posée en transparence sur le goudron.
  function usure(g, mat) {
    const Ville = Circuit.Ville, T = Circuit.Textures;
    for (let k = 0; k < Ville.n; k++) {
      for (const axe of ["x", "z"]) {
        const t = T.usureRue().clone();
        t.repeat.set(1, Ville.taille / 16);
        t.needsUpdate = true;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(V.largeurRue, Ville.taille), mat({ map: t, transparent: true, depthWrite: false, roughness: 0.6 }));
        m.rotation.x = -Math.PI / 2;
        if (axe === "x") m.rotation.z = Math.PI / 2;
        m.position.set(axe === "z" ? Ville.rue(k) : 0, 0.025, axe === "x" ? Ville.rue(k) : 0);
        m.receiveShadow = true;
        m.renderOrder = 1;
        g.add(m);
      }
    }
  }

  // Une image dessinée sur une toile (pour les panneaux et les plaques de rue).
  function toile(largeur, hauteur, peindre) {
    const c = document.createElement("canvas");
    c.width = largeur;
    c.height = hauteur;
    peindre(c.getContext("2d"), largeur, hauteur);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // Étape 50 : le MOBILIER URBAIN. Tout est en « instances » (une forme, et la liste des places).
  function mobilier(g, mat) {
    const Ville = Circuit.Ville;
    const M = V.mobilier, demi = V.largeurRue / 2;
    let etat = V.graine + 50;
    const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), haut = new THREE.Vector3(0, 1, 0);
    // Pose une liste de [x, y, z, angle] en instances.
    function poser(forme, materiau, places, ombre) {
      if (!places.length) return;
      const im = new THREE.InstancedMesh(forme, materiau, places.length);
      places.forEach(([x, y, z, a], i) => im.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(haut, a || 0), un)));
      im.castShadow = ombre !== false;
      im.receiveShadow = true;
      g.add(im);
    }
    const metal = mat({ color: 0x5a5e64, metalness: 0.6, roughness: 0.45 });

    // 1. Les BORDURES de trottoir : une bande de granit clair tout autour de chaque pâté.
    const bordures = [];
    for (let i = 0; i < V.blocs; i++) {
      for (let j = 0; j < V.blocs; j++) {
        const cx = (Ville.rue(i) + Ville.rue(i + 1)) / 2, cz = (Ville.rue(j) + Ville.rue(j + 1)) / 2, d = V.tailleBloc / 2;
        bordures.push([cx, cz - d, 0], [cx, cz + d, 0], [cx - d, cz, Math.PI / 2], [cx + d, cz, Math.PI / 2]);
      }
    }
    poser(new THREE.BoxGeometry(V.tailleBloc + 0.3, 0.16, 0.3), mat({ color: 0xc9c7c0, roughness: 0.8 }), bordures.map(([x, z, a]) => [x, 0.08, z, a]), false);

    // 2. Les PLAQUES D'ÉGOUT sur les rues (des disques de fonte, un peu à côté du milieu).
    const egouts = [];
    while (egouts.length < M.plaquesEgout) {
      const k = Math.floor(hasard() * Ville.n), le_long = Ville.rue(0) + hasard() * (Ville.rue(Ville.n - 1) - Ville.rue(0));
      const w = (hasard() < 0.5 ? -1 : 1) * (1.5 + hasard() * 3);
      egouts.push(hasard() < 0.5 ? [le_long, 0.035, Ville.rue(k) + w, 0] : [Ville.rue(k) + w, 0.035, le_long, 0]);
    }
    const plaque = toile(128, 128, (ctx, t) => {
      ctx.fillStyle = "#2b2c2e";
      ctx.beginPath();
      ctx.arc(t / 2, t / 2, t / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#4a4b4e";
      ctx.lineWidth = 4;
      for (let k = 14; k < t; k += 14) {
        ctx.beginPath();
        ctx.moveTo(k, 8);
        ctx.lineTo(k, t - 8);
        ctx.stroke();
      }
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(t / 2, t / 2, t / 2 - 5, 0, Math.PI * 2);
      ctx.stroke();
    });
    const geoPlaque = new THREE.CircleGeometry(0.4, 24);
    geoPlaque.rotateX(-Math.PI / 2);
    poser(geoPlaque, mat({ map: plaque, metalness: 0.5, roughness: 0.5, transparent: true }), egouts, false);

    // 3. Les LIGNES D'ARRÊT : un trait blanc large avant chaque passage piéton, sur la voie de droite.
    const arrets = [];
    for (let i = 0; i < Ville.n; i++) {
      for (let j = 0; j < Ville.n; j++) {
        const cx = Ville.rue(i), cz = Ville.rue(j), e = demi + 4.2;
        arrets.push([cx - e, 0.034, cz + V.voie, 0], [cx + e, 0.034, cz - V.voie, 0], [cx - V.voie, 0.034, cz - e, Math.PI / 2], [cx + V.voie, 0.034, cz + e, Math.PI / 2]);
      }
    }
    const geoArret = new THREE.PlaneGeometry(0.5, 3.6);
    geoArret.rotateX(-Math.PI / 2);
    poser(geoArret, mat({ color: 0xf2f2f2, roughness: 0.6 }), arrets.filter(([x, , z]) => Math.abs(x) < Ville.taille / 2 && Math.abs(z) < Ville.taille / 2), false);

    // 4. Les PLAQUES DE RUE (bleues, comme à Paris), sur le poteau des feux, à chaque carrefour.
    const parNom = {};
    for (let i = 0; i < Ville.n; i++) {
      for (let j = 0; j < Ville.n; j++) {
        const cx = Ville.rue(i), cz = Ville.rue(j), e = demi + 1;
        for (const [px, pz] of [[cx - e, cz - e], [cx + e, cz + e]]) {
          // le nom de la rue est-ouest (on le lit en regardant vers z), et celui de la rue nord-sud
          (parNom["eo" + j] = parNom["eo" + j] || []).push([px, 3.2, pz, 0]);
          (parNom["ns" + i] = parNom["ns" + i] || []).push([px, 3.65, pz, Math.PI / 2]);
        }
      }
    }
    const geoPlaqueRue = new THREE.BoxGeometry(1.6, 0.4, 0.04);
    for (const [cle, places] of Object.entries(parNom)) {
      const nom = cle.startsWith("eo") ? V.nomsRues.estOuest[+cle.slice(2)] : V.nomsRues.nordSud[+cle.slice(2)];
      const texte = nom.charAt(0).toUpperCase() + nom.slice(1);
      const t = toile(512, 128, (ctx, l, h) => {
        ctx.fillStyle = "#1d3f8a";
        ctx.fillRect(0, 0, l, h);
        ctx.strokeStyle = "#e8eef8";
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, l - 20, h - 20);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 46px 'Trebuchet MS', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texte, l / 2, h / 2 + 2, l - 50);
      });
      poser(geoPlaqueRue, mat({ map: t, roughness: 0.5 }), places);
    }

    // 5. Les PANNEAUX de limite de vitesse, à l'entrée de chaque morceau de rue, sur le trottoir de droite.
    const panneaux = [];
    for (let k = 0; k < Ville.n; k++) {
      for (let l = 0; l < Ville.n - 1; l++) {
        const debut = Ville.rue(l) + demi + 8, fin = Ville.rue(l + 1) - demi - 8, c = Ville.rue(k);
        // rue est-ouest : on roule à droite (z + voie vers x+), le panneau regarde vers x−
        panneaux.push([debut, c + demi + 1.2, -Math.PI / 2], [fin, c - demi - 1.2, Math.PI / 2]);
        // rue nord-sud
        panneaux.push([c - demi - 1.2, debut, Math.PI], [c + demi + 1.2, fin, 0]);
      }
    }
    const rond = toile(128, 128, (ctx, t) => {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(t / 2, t / 2, t / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d21f1f";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(t / 2, t / 2, t / 2 - 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#111";
      ctx.font = "bold 52px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(V.limiteVitesse), t / 2, t / 2 + 3);
    });
    const geoRond = new THREE.CylinderGeometry(0.4, 0.4, 0.04, 28);
    geoRond.rotateX(Math.PI / 2); // le disque est debout : son dessus (avec l'image) regarde vers z
    const matRond = [metal, mat({ map: rond, roughness: 0.5 }), metal];
    const placesPanneaux = panneaux.map(([x, z, a]) => [x, 2.4, z, a]);
    const imRond = new THREE.InstancedMesh(geoRond, matRond, placesPanneaux.length);
    placesPanneaux.forEach(([x, y, z, a], i) => imRond.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(haut, a), un)));
    imRond.castShadow = true;
    g.add(imRond);
    poser(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), metal, panneaux.map(([x, z]) => [x, 1.2, z, 0]));

    // 6. Les BANCS et les POUBELLES le long des trottoirs (et autour des parcs), les BOUCHES D'INCENDIE rouges.
    const surTrottoir = () => {
      const k = Math.floor(hasard() * Ville.n), l = Math.floor(hasard() * V.blocs);
      const le_long = Ville.rue(l) + demi + 10 + hasard() * (V.tailleBloc - 20), cote = hasard() < 0.5 ? -1 : 1;
      const d = demi + V.trottoir - 0.8; // au fond du trottoir, contre le mur
      return hasard() < 0.5
        ? { x: le_long, z: Ville.rue(k) + cote * d, angle: cote > 0 ? Math.PI : 0 }
        : { x: Ville.rue(k) + cote * d, z: le_long, angle: cote > 0 ? -Math.PI / 2 : Math.PI / 2 };
    };
    const loinDuReste = (liste, p, d) => liste.every((q) => Math.hypot(q.x - p.x, q.z - p.z) > d) && Math.abs(p.x) < Ville.taille / 2 && Math.abs(p.z) < Ville.taille / 2;
    const tous = [];
    const tirer = (n, d) => {
      const r = [];
      let essais = 0;
      while (r.length < n && essais++ < n * 30) {
        const p = surTrottoir();
        if (loinDuReste(tous, p, d)) {
          r.push(p);
          tous.push(p);
        }
      }
      return r;
    };
    const bancs = tirer(M.bancs, 6), poubelles = tirer(M.poubelles, 4), bouches = tirer(M.bouchesIncendie, 8);
    // un banc : l'assise (des lattes de bois), le dossier, 2 pieds en métal
    const bois = mat({ color: 0x8a5a32, roughness: 0.8 });
    const assise = bancs.map((b) => [b.x, 0.6, b.z, b.angle]);
    const geoAssise = new THREE.BoxGeometry(1.8, 0.06, 0.45);
    const geoDossier = new THREE.BoxGeometry(1.8, 0.4, 0.05);
    geoDossier.translate(0, 0.3, -0.22);
    poser(geoAssise, bois, assise);
    poser(geoDossier, bois, assise);
    for (const dx of [-0.75, 0.75]) {
      poser(new THREE.BoxGeometry(0.06, 0.6, 0.45), metal, bancs.map((b) => [b.x + Math.cos(b.angle) * dx, 0.3, b.z - Math.sin(b.angle) * dx, b.angle]));
    }
    // une poubelle : un cylindre vert foncé avec un couvercle
    poser(new THREE.CylinderGeometry(0.3, 0.27, 0.9, 14), mat({ color: 0x2f5a36, roughness: 0.6 }), poubelles.map((p) => [p.x, 0.57, p.z, 0]));
    poser(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 14), metal, poubelles.map((p) => [p.x, 1.05, p.z, 0]));
    // une bouche d'incendie : un petit pilier rouge, un chapeau arrondi, 2 bouchons sur les côtés
    const rouge = mat({ color: 0xc8231d, roughness: 0.5, metalness: 0.2 });
    poser(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 12), rouge, bouches.map((p) => [p.x, 0.47, p.z, 0]));
    poser(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), rouge, bouches.map((p) => [p.x, 0.82, p.z, 0]));
    const geoBouchons = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8);
    geoBouchons.rotateZ(Math.PI / 2);
    poser(geoBouchons, metal, bouches.map((p) => [p.x, 0.6, p.z, p.angle]));
    Circuit.DecorVille.bilanMobilier = { bancs: bancs.length, poubelles: poubelles.length, bouchesIncendie: bouches.length, plaquesEgout: egouts.length, panneaux: panneaux.length, plaquesDeRue: Object.values(parNom).reduce((n, l) => n + l.length, 0) };
  }

  // Les feux. Tous les carrefours qui ont le même décalage (i + j) changent de couleur en même temps :
  // ils partagent les mêmes matériaux de lampes. Poteaux, boîtiers et lampes sont des « instances ».
  function construireFeux(g) {
    const Ville = Circuit.Ville;
    const COULEURS = { rouge: 0xff2a1a, orange: 0xffa21a, vert: 0x2aff5a };
    const noir = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.5 });
    const poteaux = [], boitiers = [];
    const lampes = {}; // lampes["3-x-rouge"] = les positions des lampes rouges des feux « axe x » du groupe 3
    for (let i = 0; i < Ville.n; i++) {
      for (let j = 0; j < Ville.n; j++) {
        const cx = Ville.rue(i), cz = Ville.rue(j);
        const e = V.largeurRue / 2 + 1;
        for (const [px, pz, sens] of [[cx - e, cz - e, 1], [cx + e, cz + e, -1]]) {
          poteaux.push([px, 2.1, pz]);
          // Un boîtier tourné vers les voitures de la rue est-ouest (axe x), un autre vers la rue nord-sud (axe z).
          for (const axe of ["x", "z"]) {
            const bx = px + (axe === "z" ? sens * 0.3 : 0), bz = pz + (axe === "x" ? sens * 0.3 : 0);
            boitiers.push([bx, 4.5, bz]);
            ["rouge", "orange", "vert"].forEach((nom, k) => {
              const cle = (i + j) + "-" + axe + "-" + nom;
              (lampes[cle] = lampes[cle] || []).push([bx + (axe === "x" ? -sens * 0.2 : 0), 4.85 - k * 0.35, bz + (axe === "z" ? -sens * 0.2 : 0)]);
            });
          }
        }
      }
    }
    const instances = (geo, materiau, positions) => {
      const im = new THREE.InstancedMesh(geo, materiau, positions.length);
      const m4 = new THREE.Matrix4();
      positions.forEach(([x, y, z], k) => im.setMatrixAt(k, m4.makeTranslation(x, y, z)));
      im.castShadow = true;
      g.add(im);
    };
    instances(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8), noir, poteaux);
    instances(new THREE.BoxGeometry(0.4, 1.15, 0.4), noir, boitiers);
    const geoLampe = new THREE.SphereGeometry(0.15, 10, 8);
    const groupes = [];
    for (const [cle, positions] of Object.entries(lampes)) {
      const [decalage, axe, nom] = cle.split("-");
      const gr = (groupes[decalage] = groupes[decalage] || { decalage: +decalage, x: {}, z: {} });
      gr[axe][nom] = new THREE.MeshStandardMaterial({ color: COULEURS[nom], emissive: COULEURS[nom], emissiveIntensity: 0.04, roughness: 0.3 });
      instances(geoLampe, gr[axe][nom], positions);
    }
    return groupes.filter(Boolean);
  }

  return { construire, get lumiereFenetres() { return lumiereFenetres; }, bilanMobilier: null, bilanReliefs: null };
})();
