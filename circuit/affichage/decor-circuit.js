// 🏟️ LE DÉCOR DU CIRCUIT : le jardinier et le maçon (étape 38, version réaliste)
//
// Il fabrique le décor de l'ovale avec Three.js : la pelouse, la route en goudron (un long RUBAN qui suit
// le milieu de la route), les bordures rouges et blanches, la ligne d'arrivée, le portique, la tribune
// et ses spectateurs, la clôture et les arbres.
//
// Les arbres et les spectateurs sont très nombreux : on utilise des « INSTANCES ». On envoie la forme
// d'UN arbre à la carte graphique, puis seulement la position de chacun. C'est beaucoup plus rapide.

window.Circuit = window.Circuit || {};

Circuit.DecorCircuit = (function () {
  const C = Circuit.CONFIG;
  const Piste = Circuit.Piste;

  function mat(options) {
    return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9 }, options));
  }

  // Un ruban qui suit la route, entre deux écarts (de gauche à droite), à la hauteur y.
  // La texture est répétée tous les `pasTexture` mètres le long de la route.
  function ruban(ecart1, ecart2, y, materiau, pasTexture, sDebut, sFin) {
    const debut = sDebut || 0, fin = sFin === undefined ? Piste.longueurTour : sFin;
    const n = Math.max(2, Math.round((fin - debut) / 2));
    const positions = [], uvs = [], indices = [];
    for (let i = 0; i <= n; i++) {
      const s = debut + ((fin - debut) * i) / n;
      const p = Piste.pointA(s);
      for (const [e, v] of [[ecart1, 0], [ecart2, 1]]) {
        positions.push(p.x + p.dz * e, y, p.z - p.dx * e);
        uvs.push(s / pasTexture, v);
      }
      if (i < n) {
        const a = i * 2;
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, materiau);
    m.receiveShadow = true;
    return m;
  }

  // Des arbres en « instances ». Depuis l'étape 48, c'est le jardinier (affichage/nature.js) qui les plante :
  // des feuillus, des sapins et des bouleaux. positions : [[x, z, taille, y?], …] ; carte : pour le bilan sous le capot.
  function foret(positions, carte) {
    return Circuit.Nature.foret(positions, carte);
  }

  // La clôture rouge et blanche tout autour d'un carré de `demi` mètres.
  function cloture(demi) {
    const n = Math.floor((demi * 2) / 8) * 4;
    const geo = new THREE.BoxGeometry(8, 1.2, 0.3);
    const rouge = new THREE.InstancedMesh(geo, mat({ color: 0xc81e1e }), n), blanc = new THREE.InstancedMesh(geo, mat({ color: 0xeeeeee }), n);
    let iR = 0, iB = 0;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1);
    let k = 0;
    for (let x = -demi; x < demi; x += 8, k++) {
      for (const [px, pz, tourne] of [[x + 4, -demi, 0], [x + 4, demi, 0], [-demi, x + 4, 1], [demi, x + 4, 1]]) {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), tourne * Math.PI / 2);
        m.compose(new THREE.Vector3(px, 0.6, pz), q, un);
        if (k % 2) blanc.setMatrixAt(iB++, m);
        else rouge.setMatrixAt(iR++, m);
      }
    }
    rouge.count = iR;
    blanc.count = iB;
    return [rouge, blanc];
  }

  // Le sol : une grande pelouse texturée.
  // Étape 48 : le sol n'a plus partout la même couleur. Une texture répétée tous les 12 m, ça se voit de loin
  // (un « carrelage ») : on ajoute de grandes taches plus claires, plus foncées ou plus jaunes (des « couleurs
  // de sommets » : chaque coin de la grille du sol a sa couleur, et la carte graphique fait le dégradé entre eux).
  function pelouse(taille, texture, repetition) {
    const tex = texture.clone();
    tex.needsUpdate = true;
    tex.repeat.set(repetition, repetition);
    const forme = new THREE.PlaneGeometry(taille, taille, 96, 96);
    const p = forme.attributes.position, couleurs = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      const grand = Math.sin(x * 0.021 + 1.7) * Math.sin(y * 0.017 + 0.3) + 0.5 * Math.sin(x * 0.053 + y * 0.041 + 2);
      const petit = 0.5 * Math.sin(x * 0.11 - y * 0.07) * Math.sin(y * 0.13 + 1);
      const clair = 0.88 + 0.12 * grand + 0.06 * petit;
      const jaune = Math.max(0, Math.sin(x * 0.013 - 0.8) * Math.sin(y * 0.019 + 2.1)) * 0.18;
      couleurs.push(clair + jaune, clair + jaune * 0.6, clair - jaune * 0.4);
    }
    forme.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
    const sol = new THREE.Mesh(forme, mat({ map: tex, vertexColors: true }));
    sol.rotation.x = -Math.PI / 2;
    sol.receiveShadow = true;
    return sol;
  }

  function construire() {
    const g = new THREE.Group();
    const T = Circuit.Textures;
    const demi = C.piste.tailleHerbe / 2;
    g.add(pelouse(C.piste.tailleHerbe + 800, T.herbe(), (C.piste.tailleHerbe + 800) / 12));

    // La route, les bordures, la ligne blanche du milieu.
    const L = C.piste.largeur / 2, ext = L + C.piste.largeurBordure;
    g.add(ruban(-L, L, 0.02, mat({ map: T.goudron(), roughness: 0.85 }), 10));
    const bordure = mat({ map: T.bordure(), roughness: 0.6 });
    g.add(ruban(L, ext, 0.04, bordure, 4));
    g.add(ruban(-ext, -L, 0.04, bordure, 4));
    const blanc = mat({ color: 0xf0f0f0, roughness: 0.6 });
    for (let s = 0; s < Piste.longueurTour; s += 9) g.add(ruban(-0.15, 0.15, 0.03, blanc, 3, s, s + 3));
    // La ligne d'arrivée en damier.
    const damier = T.damier().clone();
    damier.needsUpdate = true;
    damier.repeat.set(1, L / 2);
    g.add(ruban(-L, L, 0.05, mat({ map: damier, roughness: 0.6 }), 2, -1, 1));

    // Le portique au-dessus de la ligne.
    const gris = mat({ color: 0x8c9096, metalness: 0.6, roughness: 0.4 });
    const depart = Piste.pointA(0);
    for (const e of [-(ext + 1), ext + 1]) {
      const poteau = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 6.4, 12), gris);
      poteau.position.set(depart.x, 3.2, depart.z - e);
      poteau.castShadow = true;
      g.add(poteau);
    }
    const banniere = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 2 * ext + 3), [mat({ color: 0xc81e1e }), mat({ color: 0xc81e1e }), mat({ color: 0xc81e1e }), mat({ color: 0xc81e1e }), mat({ map: T.damier() }), mat({ map: T.damier() })]);
    banniere.material[0] = mat({ map: damierBanniere() });
    banniere.material[1] = banniere.material[0];
    banniere.position.set(depart.x, 6.6, depart.z);
    banniere.castShadow = true;
    g.add(banniere);

    // La tribune : des gradins en béton, un toit, et des spectateurs (des instances de couleurs différentes).
    const zTribune = C.piste.rayon + ext + 6;
    const beton = mat({ map: T.beton() });
    for (let marche = 0; marche < 5; marche++) {
      const h = 0.9 + marche * 1.1;
      const gradin = new THREE.Mesh(new THREE.BoxGeometry(70, h, 1.6), beton);
      gradin.position.set(0, h / 2, zTribune + 1.2 + marche * 1.6);
      gradin.castShadow = gradin.receiveShadow = true;
      g.add(gradin);
    }
    const corps = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.25, 0.5, 4, 8), mat({ roughness: 0.7 }), 260);
    const tetes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 10, 8), mat({ color: 0xe0b48f, roughness: 0.6 }), 260);
    let n = 0, etat = 3;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const m4 = new THREE.Matrix4();
    for (let marche = 0; marche < 5; marche++) {
      for (let x = -33; x <= 33 && n < 260; x += 1.3) {
        if (alea() < 0.3) continue;
        const y = 0.9 + marche * 1.1, z = zTribune + 1.2 + marche * 1.6;
        const px = x + alea() * 0.4;
        m4.makeTranslation(px, y + 0.5, z);
        corps.setMatrixAt(n, m4);
        corps.setColorAt(n, new THREE.Color().setHSL(alea(), 0.6, 0.5));
        m4.makeTranslation(px, y + 1.05, z);
        tetes.setMatrixAt(n, m4);
        n++;
      }
    }
    corps.count = tetes.count = n;
    corps.castShadow = true;
    g.add(corps, tetes);
    const toit = new THREE.Mesh(new THREE.BoxGeometry(74, 0.3, 6), mat({ color: 0xb01818, roughness: 0.5 }));
    toit.position.set(0, 8.2, zTribune + 4.6);
    toit.rotation.x = -0.12;
    toit.castShadow = true;
    g.add(toit);
    for (const x of [-36, 36, 0]) {
      const pilier = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8.5, 10), gris);
      pilier.position.set(x, 4.2, zTribune + 7);
      g.add(pilier);
    }

    // La clôture et les arbres (loin de la route, et pas sur la tribune).
    for (const c of cloture(demi - 2)) g.add(c);
    const arbres = [];
    let essais = 0;
    while (arbres.length < C.decor.arbres && essais < 6000) {
      essais++;
      const x = (alea() * 2 - 1) * (demi - 10), z = (alea() * 2 - 1) * (demi - 10);
      if (Math.abs(Piste.reperer(x, z).ecart) < ext + 9) continue;
      if (Math.abs(x) < 42 && z > zTribune - 3 && z < zTribune + 14) continue;
      arbres.push([x, z, 0.8 + alea() * 0.6]);
    }
    g.add(foret(arbres, "course"));

    // Étape 48 : l'herbe en touffes, les fleurs et les rochers. La moitié est semée près de la route
    // (c'est là que la caméra passe), le reste partout. Jamais sur la route, la bordure ou la tribune.
    g.add(Circuit.Nature.tapis({
      carte: "course",
      graine: C.decor.graine,
      candidat: (a) => {
        if (a() < 0.5) return { x: (a() * 2 - 1) * (demi - 4), z: (a() * 2 - 1) * (demi - 4) };
        const p = Piste.pointA(a() * Piste.longueurTour), e = (a() < 0.5 ? -1 : 1) * (ext + 3 + a() * 35);
        return { x: p.x + p.dz * e, z: p.z - p.dx * e };
      },
      libre: (x, z) => Math.abs(x) < demi - 3 && Math.abs(z) < demi - 3 && Math.abs(Piste.reperer(x, z).ecart) > ext + 3
        && !(Math.abs(x) < 45 && z > zTribune - 5 && z < zTribune + 16),
    }));
    return g;
  }

  // La banderole du portique : « ARRIVÉE » sur un damier.
  function damierBanniere() {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 64;
    const ctx = toile.getContext("2d");
    for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#111" : "#eee";
      ctx.fillRect(i * 16, j * 16, 16, 16);
    }
    ctx.fillStyle = "#c81e1e";
    ctx.fillRect(150, 6, 212, 52);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ARRIVÉE", 256, 47);
    const t = new THREE.CanvasTexture(toile);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  return { construire, foret, cloture, pelouse, mat };
})();
