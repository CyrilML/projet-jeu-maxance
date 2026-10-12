// 🖌️ LE PAYSAGE : le peintre des collines et de la rivière
//
// Étape 68. Il dessine ce que le sculpteur (moteur/campagne.js) a fabriqué :
//   - le SOL : une grande grille dont chaque point est monté à la hauteur des collines (ou creusé pour la rivière).
//     Chaque point a sa couleur : vert clair dans les prés, vert foncé en haut des collines, terre et sable au bord
//     de l'eau (des « couleurs de sommets », mélangées à la texture d'herbe) ;
//   - la RIVIÈRE : un long ruban d'eau qui suit le tracé, posé à la hauteur de l'eau. Ses bords passent sous les
//     berges : on ne voit que l'eau du milieu ;
//   - les FORÊTS : des bosquets serrés, surtout sur les collines, et des arbres isolés dans les prés ;
//   - les GARDE-FOUS des ponts, là où une route passe au-dessus de l'eau.
//
// Comme tout l'affichage, il lit le terrain et ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.Paysage = (function () {
  const lisse = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

  // Le sol. options : { saut (on prend 1 point de la grille sur `saut`), bord (m d'herbe plate en plus, autour),
  //                    texture (l'herbe par défaut),
  //                    hauteur: (x, z) → m (si la carte creuse encore autre chose), terre: (x, z) → vrai (de la terre nue) }
  function sol(campagne, options) {
    const o = options || {};
    const T = Circuit.Textures;
    const saut = o.saut || 2;
    const cotes = Math.floor((campagne.n - 1) / saut);
    const taille = cotes * saut * campagne.pas;
    const forme = new THREE.PlaneGeometry(taille, taille, cotes, cotes);
    forme.rotateX(-Math.PI / 2);
    const p = forme.attributes.position, couleurs = [];
    const R = campagne.riviere;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const h = o.hauteur ? o.hauteur(x, z) : campagne.hauteur(x, z);
      p.setY(i, h);
      // La couleur : des taches (comme la pelouse du circuit), plus foncé en montant, sable près de l'eau.
      const tache = 0.9 + 0.1 * Math.sin(x * 0.021 + 1.7) * Math.sin(z * 0.017 + 0.3) + 0.05 * Math.sin(x * 0.11 - z * 0.07);
      let r = tache, v = tache, b = tache;
      const haut = lisse(h / 25);
      r -= haut * 0.22;
      v -= haut * 0.1;
      b -= haut * 0.2;
      if (R) {
        const d = campagne.distanceRiviere(x, z), demi = R.largeur / 2;
        const sable = 1 - lisse((d - demi) / (R.berge + 6));
        r = r * (1 - sable) + 1.45 * sable;
        v = v * (1 - sable) + 1.15 * sable;
        b = b * (1 - sable) + 0.7 * sable;
      }
      if (o.terre && o.terre(x, z)) { r = 1.05; v = 0.8; b = 0.55; }
      couleurs.push(r, v, b);
    }
    forme.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
    forme.computeVertexNormals();
    const tex = (o.texture || T.herbe()).clone();
    tex.needsUpdate = true;
    tex.repeat.set(taille / 12, taille / 12);
    const m = new THREE.Mesh(forme, new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.95 }));
    m.receiveShadow = true;
    m.name = "sol-campagne";
    const g = new THREE.Group();
    g.add(m);
    // Tout autour : une bordure d'herbe plate (jusqu'à l'horizon).
    if (o.bord) {
      const B = o.bord, L = taille / 2;
      for (const [cx, cz, lx, lz] of [[0, -L - B / 2, taille + 2 * B, B], [0, L + B / 2, taille + 2 * B, B], [-L - B / 2, 0, B, taille], [L + B / 2, 0, B, taille]]) {
        const t2 = T.herbe().clone();
        t2.needsUpdate = true;
        t2.repeat.set(lx / 12, lz / 12);
        const bord = new THREE.Mesh(new THREE.PlaneGeometry(lx, lz), new THREE.MeshStandardMaterial({ map: t2, color: 0xe4ead8, roughness: 1 }));
        bord.rotation.x = -Math.PI / 2;
        bord.position.set(cx, -0.05, cz);
        bord.receiveShadow = true;
        g.add(bord);
      }
    }
    return g;
  }

  // La rivière : un ruban d'eau le long du tracé.
  function riviere(campagne) {
    const R = campagne.riviere;
    if (!R) return null;
    const pts = R.points, demi = R.largeur / 2 + R.berge * 0.65;
    const positions = [], uvs = [], indices = [];
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l;
      if (i > 0) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      for (const [c, v] of [[-1, 0], [1, 1]]) {
        positions.push(pts[i][0] + nx * demi * c, R.niveau, pts[i][1] + nz * demi * c);
        uvs.push(s / 40, v);
      }
      if (i < pts.length - 1) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, Circuit.Eau.materiau({ couleur: 0x3f7d8c, repetition: 1, vitesse: 2 }));
    m.material.side = THREE.DoubleSide;
    m.receiveShadow = true;
    m.name = "riviere";
    return m;
  }

  // Les arbres : des bosquets (forêts serrées, surtout sur les collines) et des arbres isolés.
  // libre(x, z) → vrai si on peut planter là (pas sur la route…). Renvoie [[x, z, taille, y], …].
  function arbres(campagne, nombre, bosquets, libre, graine) {
    let etat = graine >>> 0;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const demi = campagne.taille / 2 - 8;
    const R = campagne.riviere;
    const ok = (x, z) => Math.abs(x) < demi && Math.abs(z) < demi && (!R || campagne.distanceRiviere(x, z) > R.largeur / 2 + R.berge + 3) && libre(x, z);
    const liste = [];
    const planter = (x, z, t) => liste.push([x, z, t, campagne.hauteur(x, z) - 0.2]);
    // Les centres des bosquets : de préférence en haut des collines.
    const centres = campagne.collines.slice().sort((a, b) => b.hauteur - a.hauteur).slice(0, bosquets).map((c) => [c.x, c.z, c.rayon * 0.8]);
    while (centres.length < bosquets) centres.push([(alea() * 2 - 1) * demi, (alea() * 2 - 1) * demi, 40 + alea() * 60]);
    const dansBois = Math.round(nombre * 0.7);
    let essais = 0;
    while (liste.length < dansBois && essais++ < dansBois * 8) {
      const c = centres[Math.floor(alea() * centres.length)];
      const a = alea() * Math.PI * 2, r = Math.sqrt(alea()) * c[2];
      const x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r;
      if (ok(x, z)) planter(x, z, 0.8 + alea() * 0.9);
    }
    essais = 0;
    while (liste.length < nombre && essais++ < nombre * 8) {
      const x = (alea() * 2 - 1) * demi, z = (alea() * 2 - 1) * demi;
      if (ok(x, z)) planter(x, z, 0.7 + alea() * 0.8);
    }
    return liste;
  }

  // Les garde-fous d'un pont : deux rangées de petits poteaux et une lisse, de chaque côté.
  // morceaux : [{ ax, az, bx, bz, y, demiLargeur }, …] (des bouts de route au-dessus de l'eau).
  function gardeFous(morceaux) {
    const g = new THREE.Group();
    if (!morceaux.length) return g;
    const n = morceaux.length * 2;
    const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.6, roughness: 0.35 });
    const lisses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.18, 0.18), metal, n);
    const poteaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 1, 0.16), metal, n);
    const flancs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1.4, 0.5), new THREE.MeshStandardMaterial({ map: Circuit.Textures.beton(), roughness: 0.9 }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), haut = new THREE.Vector3(0, 1, 0);
    let k = 0;
    for (const t of morceaux) {
      const l = Math.hypot(t.bx - t.ax, t.bz - t.az) || 1, ux = (t.bx - t.ax) / l, uz = (t.bz - t.az) / l;
      q.setFromAxisAngle(haut, -Math.atan2(uz, ux));
      for (const c of [-1, 1]) {
        const x = (t.ax + t.bx) / 2 - uz * c * (t.demiLargeur + 0.3), z = (t.az + t.bz) / 2 + ux * c * (t.demiLargeur + 0.3);
        lisses.setMatrixAt(k, m.compose(new THREE.Vector3(x, t.y + 1, z), q, new THREE.Vector3(l + 0.1, 1, 1)));
        poteaux.setMatrixAt(k, m.compose(new THREE.Vector3(x, t.y + 0.5, z), q, new THREE.Vector3(1, 1, 1)));
        flancs.setMatrixAt(k, m.compose(new THREE.Vector3(x, t.y - 0.6, z), q, new THREE.Vector3(l + 0.1, 1, 1)));
        k++;
      }
    }
    for (const im of [lisses, poteaux, flancs]) {
      im.castShadow = im.receiveShadow = true;
      g.add(im);
    }
    g.name = "garde-fous";
    return g;
  }

  return { sol, riviere, arbres, gardeFous };
})();
