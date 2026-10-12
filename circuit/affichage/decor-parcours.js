// 🏗️ LE DÉCOR DU PARCOURS : le constructeur de la fête foraine (étape 38, version réaliste)
//
// Il fabrique la map du parcours avec Three.js : le grand sol en terre et herbe, les montées (pente +
// plateau en planches + pente), les tremplins rayés orange et noir, les tunnels en béton avec leurs
// lampes, les loopings rouges et blancs, la zone de départ en damier et les arbres.
//
// Il lit les formes de logique/parcours.js : ce qu'on voit est exactement ce sur quoi on roule.

window.Circuit = window.Circuit || {};

Circuit.DecorParcours = (function () {
  const P = Circuit.CONFIG.parcours;

  // Un point d'une forme, de (u, w, y) vers le monde.
  function monde(f, u, w, y) {
    return [f.x + f.cos * u - f.sin * w, y, f.z + f.sin * u + f.cos * w];
  }

  // Une pente : un coin, de 0 m à sa hauteur. On donne les 6 coins, Three.js fait les triangles.
  function pente(f, materiauDessus, materiauCotes) {
    const L = f.demiLongueur, W = f.demiLargeur, h = f.hauteur;
    const a = monde(f, -L, -W, 0), b = monde(f, -L, W, 0), c = monde(f, L, W, 0), d = monde(f, L, -W, 0);
    const e = monde(f, L, W, h), k = monde(f, L, -W, h);
    const sommets = [];
    const uvs = [];
    const faces = [];
    const ajouter = (pts, uv, groupe) => {
      const debut = sommets.length / 3;
      pts.forEach((p) => sommets.push(...p));
      uvs.push(...uv);
      faces.push({ debut, n: pts.length, groupe });
    };
    const longueur = Math.hypot(2 * L, h) / 4;
    ajouter([a, k, e, a, e, b], [0, 0, longueur, 0, longueur, (2 * W) / 4, 0, 0, longueur, (2 * W) / 4, 0, (2 * W) / 4], 0); // le dessus en pente
    ajouter([d, c, e, d, e, k], [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], 1); // le dos (vertical)
    ajouter([a, d, k], [0, 0, 1, 0, 1, 1], 1); // les 2 côtés (triangles)
    ajouter([b, e, c], [0, 0, 1, 1, 1, 0], 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(sommets, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    for (const f2 of faces) geo.addGroup(f2.debut, f2.n, f2.groupe);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, [materiauDessus, materiauCotes]);
    m.material.forEach((x) => (x.side = THREE.DoubleSide));
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  // Un bloc (plateau, mur de tunnel) : une boîte tournée.
  function bloc(f, materiaux) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(2 * f.demiLongueur, f.hauteur, 2 * f.demiLargeur), materiaux);
    m.position.set(f.x, f.hauteur / 2, f.z);
    m.rotation.y = -f.angle;
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  // Une texture répétée (on fait une copie pour régler la répétition de chaque objet).
  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const mat = D.mat;
    const g = new THREE.Group();
    const demi = P.taille / 2;

    // Le sol : terre et herbe mélangées. Étape 68 : avec les collines et la rivière (affichage/paysage.js).
    const campagne = Circuit.Parcours.campagne;
    g.add(Circuit.Paysage.sol(campagne, { saut: 2, bord: 1600, texture: T.terre() }));
    g.add(Circuit.Paysage.riviere(campagne));
    // Les 3 ponts : un tablier en planches, posé sur l'eau, avec ses garde-fous.
    for (const p of Circuit.Parcours.ponts) {
      const tablier = new THREE.Mesh(new THREE.BoxGeometry(p.longueur, 0.6, p.largeur), mat({ map: repeter(T.bois(), p.longueur / 4, 2), roughness: 0.8 }));
      tablier.position.set(p.x, p.y - 0.3, p.z);
      tablier.castShadow = tablier.receiveShadow = true;
      g.add(tablier);
    }
    g.add(Circuit.Paysage.gardeFous(Circuit.Parcours.ponts.map((p) => ({ ax: p.x - p.longueur / 2, az: p.z, bx: p.x + p.longueur / 2, bz: p.z, y: p.y, demiLargeur: p.largeur / 2 - 0.6 }))));

    // La zone de départ en damier.
    const depart = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat({ map: repeter(T.damier(), 3, 3), roughness: 0.6 }));
    depart.rotation.x = -Math.PI / 2;
    depart.position.y = 0.03;
    depart.receiveShadow = true;
    g.add(depart);

    // Les blocs et les pentes.
    const cotes = mat({ color: 0x8a6a48 });
    for (const f of Circuit.Parcours.formes) {
      if (f.type === "pente") {
        const dessus = mat({ map: repeter(f.nom === "tremplin" ? T.tremplin() : T.planches(), 1, 1), roughness: 0.7 });
        g.add(pente(f, dessus, f.nom === "tremplin" ? mat({ color: 0x3a3a3e, metalness: 0.5, roughness: 0.5 }) : cotes));
      } else if (f.nom === "mur de tunnel") {
        const beton = mat({ map: repeter(T.beton(), (2 * f.demiLongueur) / 8, f.hauteur / 8) });
        g.add(bloc(f, beton));
      } else {
        // Un plateau : des côtés en béton, un dessus en planches.
        const beton = mat({ map: repeter(T.beton(), (2 * f.demiLongueur) / 8, f.hauteur / 8) });
        const planches = mat({ map: repeter(T.planches(), (2 * f.demiLongueur) / 6, (2 * f.demiLargeur) / 6) });
        g.add(bloc(f, [beton, beton, planches, beton, beton, beton]));
        // un bord rouge et blanc tout autour du dessus
        for (const s of [-1, 1]) {
          const bord = new THREE.Mesh(new THREE.BoxGeometry(2 * f.demiLongueur, 0.25, 0.4), mat({ map: repeter(T.bordure(), f.demiLongueur, 1) }));
          bord.position.set(...monde(f, 0, s * (f.demiLargeur - 0.2), f.hauteur + 0.12));
          bord.rotation.y = -f.angle;
          g.add(bord);
        }
      }
    }

    // Les tunnels : un toit en béton et des lampes qui brillent au plafond.
    const lampe = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xfff0b0, emissiveIntensity: 2 });
    const lampes = []; // (étape 68 : 9 fois plus de tunnels : toutes les lampes en « instances », un seul dessin)
    for (const t of Circuit.Parcours.tunnels) {
      const f = { x: t.x, z: t.z, angle: t.angle, cos: Math.cos(t.angle), sin: Math.sin(t.angle), demiLongueur: t.longueur / 2, demiLargeur: t.largeur / 2 + 1, hauteur: 0.8 };
      const toit = bloc(f, mat({ map: repeter(T.beton(), t.longueur / 8, 2) }));
      toit.position.y = t.hauteur + 0.4;
      g.add(toit);
      for (let u = -t.longueur / 2 + 5; u < t.longueur / 2; u += 10) {
        lampes.push([monde(f, u, 0, t.hauteur - 0.08), -t.angle]);
      }
      const solTunnel = new THREE.Mesh(new THREE.PlaneGeometry(t.longueur, t.largeur + 2), mat({ map: repeter(T.goudron(), t.longueur / 10, 1) }));
      solTunnel.rotation.set(-Math.PI / 2, 0, -t.angle);
      solTunnel.position.set(t.x, 0.025, t.z);
      solTunnel.receiveShadow = true;
      g.add(solTunnel);
    }
    const instLampes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.12, 0.5), lampe, lampes.length);
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), axeY = new THREE.Vector3(0, 1, 0);
    lampes.forEach(([pos, angle], i) => instLampes.setMatrixAt(i, m4.compose(new THREE.Vector3(...pos), q4.setFromAxisAngle(axeY, angle), un)));
    g.add(instLampes);

    // Les loopings : un ruban rouge et blanc qui fait un tour complet, et deux piliers.
    for (const l of Circuit.Parcours.loopings) {
      const n = 96, demiLargeur = 2.6;
      const positions = [], uvs = [], indices = [];
      for (let i = 0; i <= n; i++) {
        const p = Circuit.Parcours.pointLooping(l, (i / n) * Math.PI * 2);
        for (const [cote, v] of [[-1, 0], [1, 1]]) {
          positions.push(p.x + l.lx * cote * demiLargeur, p.y, p.z + l.lz * cote * demiLargeur);
          uvs.push((i / n) * 24, v);
        }
        if (i < n) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      const ruban = new THREE.Mesh(geo, mat({ map: repeter(T.rail(), 1, 1), roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }));
      ruban.castShadow = ruban.receiveShadow = true;
      g.add(ruban);
      for (const theta of [Math.PI / 2, (3 * Math.PI) / 2]) {
        const p = Circuit.Parcours.pointLooping(l, theta);
        const cote = theta < Math.PI ? -1 : 1;
        const pilier = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, p.y, 12), mat({ color: 0x8c9096, metalness: 0.6, roughness: 0.4 }));
        pilier.position.set(p.x + l.lx * cote * 4, p.y / 2, p.z + l.lz * cote * 4);
        pilier.castShadow = true;
        g.add(pilier);
      }
      // Une flèche blanche au sol pour montrer l'entrée.
      const dessin = new THREE.Shape();
      [[-3, -0.6], [0, -0.6], [0, -1.6], [2.5, 0], [0, 1.6], [0, 0.6], [-3, 0.6]].forEach(([x, y], i) => (i ? dessin.lineTo(x, y) : dessin.moveTo(x, y)));
      const fleche = new THREE.Mesh(new THREE.ShapeGeometry(dessin), mat({ color: 0xffffff }));
      fleche.rotation.x = -Math.PI / 2;
      const support = new THREE.Group();
      support.add(fleche);
      support.position.set(l.x - l.dx * 7, 0.05, l.z - l.dz * 7);
      support.rotation.y = -l.angle;
      g.add(support);
    }

    // La clôture et des arbres, loin des formes, des loopings et du départ.
    for (const c of D.cloture(demi - 2)) g.add(c);
    // Étape 68 : des forêts sur les collines et des arbres dans les prés (affichage/paysage.js).
    const AP = Circuit.CONFIG.agrandir.parcours;
    const arbres = Circuit.Paysage.arbres(campagne, AP.arbres, AP.bosquets, (x, z) => Math.hypot(x, z) > 30
      && Circuit.Parcours.formes.every((f) => Math.hypot(x - f.x, z - f.z) > Math.max(f.demiLongueur, f.demiLargeur) + 12)
      && Circuit.Parcours.loopings.every((l) => Math.hypot(x - l.x, z - l.z) > 40)
      && Circuit.Parcours.tunnels.every((t) => Math.hypot(x - t.x, z - t.z) > t.longueur / 2 + 15)
      && Circuit.Parcours.ponts.every((p) => Math.hypot(x - p.x, z - p.z) > 45), 99);
    g.add(D.foret(arbres, "parcours"));

    // Étape 48 : de l'herbe sèche (un peu jaune, c'est un terrain de terre), des fleurs et beaucoup de rochers.
    // Pas sur les formes, ni dans les loopings et les tunnels, ni au départ.
    const loinDesFormes = (x, z) => Math.hypot(x, z) > 20
      && Circuit.Parcours.formes.every((f) => Math.abs(x - f.x) > f.demiLongueur + 4 || Math.abs(z - f.z) > f.demiLargeur + 4)
      && Circuit.Parcours.loopings.every((l) => Math.hypot(x - l.x, z - l.z) > 28)
      && Circuit.Parcours.tunnels.every((t) => Math.hypot(x - t.x, z - t.z) > t.longueur / 2 + 8);
    const fois = Circuit.CONFIG.agrandir.herbes; // étape 68 : la carte est plus grande
    const R = campagne.riviere;
    g.add(Circuit.Nature.tapis({
      carte: "parcours", graine: 48, seche: true,
      candidat: (a) => {
        const x = (a() * 2 - 1) * (demi - 4), z = (a() * 2 - 1) * (demi - 4);
        return { x, z, y: campagne.hauteur(x, z) };
      },
      herbes: Math.round(Circuit.CONFIG.nature.herbes * 0.6 * fois), fleurs: Math.round(Circuit.CONFIG.nature.fleurs * 0.4 * fois),
      rochers: Math.round(Circuit.CONFIG.nature.rochers * 1.5 * fois),
      libre: (x, z) => loinDesFormes(x, z) && campagne.distanceRiviere(x, z) > R.largeur / 2 + R.berge * 0.6,
    }));
    return g;
  }

  // Les rayons X du parcours : le contour du dessus de chaque forme, et le rail des loopings.
  function rayonsX(couleurs) {
    const c = Circuit.Constructeur();
    for (const f of Circuit.Parcours.formes) {
      const L = f.demiLongueur, W = f.demiLargeur;
      const hA = f.hauteur, hR = f.type === "pente" ? 0 : f.hauteur;
      const coins = [monde(f, L, -W, hA + 0.1), monde(f, L, W, hA + 0.1), monde(f, -L, W, hR + 0.1), monde(f, -L, -W, hR + 0.1)];
      for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], couleurs.bords);
    }
    for (const l of Circuit.Parcours.loopings) {
      const e = { x: l.x, z: l.z, cos: l.dx, sin: l.dz };
      c.ligne(monde(e, 0, -2.5, 0), monde(e, 0, -2.5, 4), couleurs.entree);
      c.ligne(monde(e, 0, 2.5, 0), monde(e, 0, 2.5, 4), couleurs.entree);
      c.ligne(monde(e, 0, -2.5, 4), monde(e, 0, 2.5, 4), couleurs.entree);
      for (let i = 0; i < 48; i++) {
        const a = Circuit.Parcours.pointLooping(l, (i / 48) * Math.PI * 2), b = Circuit.Parcours.pointLooping(l, ((i + 1) / 48) * Math.PI * 2);
        c.ligne([a.x, a.y, a.z], [b.x, b.y, b.z], couleurs.rail);
      }
    }
    return c.fin();
  }

  return { construire, rayonsX };
})();
