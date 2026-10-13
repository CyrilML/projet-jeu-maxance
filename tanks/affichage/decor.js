// 🎨 LE DÉCOR : le peintre du champ de bataille (étape 60)
//
// Il fabrique (une seule fois) ce qu'on voit :
//   - LE SOL : une grande grille de 700 m posée sur les collines (logique/terrain.js), avec des couleurs qui changent
//     doucement (herbe claire, herbe sombre, terre près du village) et une image de grains d'herbe répétée dessus ;
//   - LE VILLAGE EN RUINES : chaque maison a 4 murs en pierre, cassés en haut (des hauteurs différentes), des trous
//     de fenêtres, parfois un morceau de toit, et des tas de gravats autour ;
//   - LES MURETS et les haies, LES ARBRES (feuillus et sapins). Un arbre écrasé par un tank se couche par terre.
// Pour que ce soit rapide, tout ce qui a la même matière est « recollé » en une seule forme (une maison = des
// dizaines de pierres, mais un seul dessin pour tout le village), et les arbres sont des « instances ».
// Étape 72 (« ça rame ») : le décor est découpé en MORCEAUX de 140 m (comme un puzzle) : le sol en tuiles, le village
// et les murets par morceau. La carte graphique ne dessine que les morceaux devant la caméra, et le régulateur de
// qualité (affichage/qualite.js) cache ceux qui sont trop loin. Les arbres trop loin ne sont pas dessinés non plus.
// Comme tout l'affichage, il ne change jamais le monde : il le lit.

window.Tanks = window.Tanks || {};

Tanks.Decor = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let arbresTroncs = null, arbresFeuilles = null, sapins = null;
  const etatArbre = []; // pour chaque arbre : couché ou pas (on refait sa place seulement quand ça change)
  // (étape 72) les morceaux du décor : { objet, x, z, rayon } ; et ce qu'on a dessiné à la dernière image
  const morceaux = [];
  const bilan = { morceaux: 0, morceauxVus: 0, arbres: 0, arbresVus: 0 };
  const M = C.decor.morceau, nM = Math.ceil(C.monde.taille / M);
  const numeroMorceau = (x, z) => {
    const i = Math.max(0, Math.min(nM - 1, Math.floor((x + C.monde.taille / 2) / M))), j = Math.max(0, Math.min(nM - 1, Math.floor((z + C.monde.taille / 2) / M)));
    return j * nM + i;
  };
  function ajouterMorceau(groupe, objet) {
    const b = objet.geometry.boundingSphere || (objet.geometry.computeBoundingSphere(), objet.geometry.boundingSphere);
    morceaux.push({ objet, x: b.center.x, z: b.center.z, rayon: b.radius });
    groupe.add(objet);
  }

  function image(taille, peindre) {
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  let etat = 61;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Recolle une liste de formes déjà placées (geo + matrice) en une seule.
  function recoller(liste) {
    const pos = [], nor = [], uv = [];
    for (const { geo, m4 } of liste) {
      const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(m4);
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
      if (g.attributes.uv) uv.push(...g.attributes.uv.array);
      else for (let i = 0; i < g.attributes.position.count; i++) uv.push(0, 0);
    }
    const r = new THREE.BufferGeometry();
    r.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    r.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    r.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    return r;
  }

  function sol(groupe) {
    const taille = C.monde.taille, n = 175, geo = new THREE.PlaneGeometry(taille, taille, n, n);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, couleurs = [], uv = geo.attributes.uv;
    const bruit = Tanks.Bruit.creer(77);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, T.hauteur(x, z));
      const b = Tanks.Bruit.fractal(bruit, x / 60, z / 60, 3), village = Math.max(0, 1 - Math.hypot(x, z) / (C.monde.village.rayon * 1.3));
      let r = 0.36 + b * 0.06, g = 0.47 + b * 0.08, bl = 0.24 + b * 0.04; // l'herbe
      r += village * 0.18; g += village * 0.02; bl += village * 0.08; // la terre battue du village
      let rive = Math.max(0, 1 - Math.abs(T.distLac(x, z) - 1) / 0.1); // (étape 62) le sable de la rive
      for (const i of T.iles) rive = Math.max(rive, 1 - Math.abs(Math.hypot(x - i.x, z - i.z) - i.rayon) / 6); // (étape 63) et des îles
      r += rive * 0.2; g += rive * 0.1; bl += rive * 0.05;
      couleurs.push(r, g, bl);
      uv.setXY(i, x / 6, z / 6);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(couleurs, 3));
    geo.computeVertexNormals();
    const grain = image(256, (ctx, t) => {
      ctx.fillStyle = "#b8b8b8";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 9000; i++) {
        ctx.fillStyle = hasard() < 0.5 ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.2)";
        ctx.fillRect(hasard() * t, hasard() * t, 1 + hasard() * 2, 1 + hasard() * 3);
      }
    });
    // (étape 72) Le sol en TUILES : toutes les tuiles partagent les mêmes sommets (aucune couture), mais chacune a sa
    // liste de triangles : la carte graphique peut sauter les tuiles derrière la caméra, ou trop loin.
    const matiere = new THREE.MeshStandardMaterial({ vertexColors: true, map: grain, roughness: 0.97 });
    const idx = geo.index.array, parTuile = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const k = numeroMorceau((p.getX(a) + p.getX(b) + p.getX(c)) / 3, (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3);
      (parTuile[k] = parTuile[k] || []).push(a, b, c);
    }
    for (const liste of parTuile) {
      if (!liste) continue;
      const g = new THREE.BufferGeometry();
      for (const nom of ["position", "normal", "uv", "color"]) g.setAttribute(nom, geo.attributes[nom]);
      g.setIndex(liste);
      const boite = new THREE.Box3(), v = new THREE.Vector3();
      for (const i of liste) boite.expandByPoint(v.fromBufferAttribute(p, i));
      g.boundingBox = boite;
      g.boundingSphere = boite.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(g, matiere);
      m.receiveShadow = true;
      ajouterMorceau(groupe, m);
    }
  }

  function village(groupe) {
    const pierre = image(256, (ctx, t) => {
      ctx.fillStyle = "#a59b88";
      ctx.fillRect(0, 0, t, t);
      for (let y = 0; y < t; y += 16) {
        for (let x = (y / 16) % 2 ? 0 : 12; x < t; x += 24) {
          const v = 140 + Math.floor(hasard() * 50);
          ctx.fillStyle = "rgb(" + v + "," + (v - 8) + "," + (v - 22) + ")";
          ctx.fillRect(x + 1, y + 1, 22, 14);
        }
      }
      for (let i = 0; i < 2500; i++) {
        ctx.fillStyle = "rgba(0,0,0," + hasard() * 0.15 + ")";
        ctx.fillRect(hasard() * t, hasard() * t, 2, 2);
      }
    });
    const parMorceau = []; // (étape 72) pour chaque morceau de 140 m : { pierre, bois, tuiles, gravats }
    let lot = null;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
    const poser = (liste, geo, x, y, z, angle, sx, sy, sz, inclinaison) => {
      q.setFromAxisAngle(haut, -angle);
      if (inclinaison) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), inclinaison));
      liste.push({ geo, m4: m4.clone().compose(new THREE.Vector3(x, y, z), q, e.set(sx, sy, sz)) });
    };
    const cube = new THREE.BoxGeometry(1, 1, 1);
    for (const b of T.boites) {
      const k = numeroMorceau(b.x, b.z);
      lot = parMorceau[k] = parMorceau[k] || { pierre: [], bois: [], tuiles: [], gravats: [] };
      const y0 = T.hauteur(b.x, b.z) - 0.4, c = Math.cos(b.angle), s = Math.sin(b.angle);
      const ici = (u, v) => [b.x + u * c - v * s, b.z + u * s + v * c];
      if (b.sorte === "muret") {
        const [x, z] = ici(0, 0);
        poser(lot.pierre, cube, x, y0 + b.h / 2 + 0.2, z, b.angle, b.demiL * 2, b.h + 0.4, b.demiP * 2);
        continue;
      }
      // Une maison en ruines : 4 murs, chacun coupé en lot de 1,5 m de hauteurs différentes (le haut est cassé).
      let graine = b.graine || 1;
      const h2 = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
      const ep = 0.45;
      for (const [u0, v0, long, angleMur] of [[0, b.demiP, b.demiL, 0], [0, -b.demiP, b.demiL, 0], [b.demiL, 0, b.demiP, Math.PI / 2], [-b.demiL, 0, b.demiP, Math.PI / 2]]) {
        const n = Math.max(2, Math.round((long * 2) / 1.5)), pas = (long * 2) / n;
        for (let k = 0; k < n; k++) {
          const d = -long + (k + 0.5) * pas;
          const u = u0 + (angleMur ? 0 : d), v = v0 + (angleMur ? d : 0);
          const fenetre = k % 3 === 1 && h2() < 0.7; // un trou de fenêtre : le bas et le haut du mur, rien au milieu
          const hauteur = b.h * (0.35 + h2() * 0.65);
          const [x, z] = ici(u, v);
          if (fenetre && hauteur > 2.6) {
            poser(lot.pierre, cube, x, y0 + 0.65, z, b.angle + angleMur, pas + 0.02, 1.3, ep);
            poser(lot.pierre, cube, x, y0 + 2.3 + (hauteur - 2.3) / 2, z, b.angle + angleMur, pas + 0.02, hauteur - 2.3, ep);
            poser(lot.bois, cube, x, y0 + 2.25, z, b.angle + angleMur, pas + 0.1, 0.12, ep + 0.06); // le linteau en bois
          } else poser(lot.pierre, cube, x, y0 + hauteur / 2, z, b.angle + angleMur, pas + 0.02, hauteur, ep);
        }
      }
      // parfois un morceau de toit qui tient encore (penché), et des poutres
      if (h2() < 0.45) {
        const [x, z] = ici(-b.demiL * 0.3, b.demiP * 0.45);
        poser(lot.tuiles, cube, x, y0 + b.h * 0.95, z, b.angle, b.demiL * 1.2, 0.18, b.demiP * 1.2, 0.5);
      }
      for (let k = 0; k < 3; k++) {
        const [x, z] = ici((h2() - 0.5) * b.demiL, (h2() - 0.5) * b.demiP);
        poser(lot.bois, cube, x, y0 + 0.8 + h2() * 2, z, h2() * 3, 0.2, 0.2, b.demiP * 1.6, 0.6 + h2());
      }
      // les gravats autour
      for (let k = 0; k < 10; k++) {
        const a = h2() * Math.PI * 2, r = Math.max(b.demiL, b.demiP) * (0.6 + h2() * 0.7);
        const [x, z] = ici(Math.cos(a) * r, Math.sin(a) * r);
        const t = 0.3 + h2() * 0.8;
        poser(lot.gravats, cube, x, T.hauteur(x, z) + t * 0.2, z, h2() * 6, t * 1.4, t * 0.6, t, h2());
      }
    }
    const matieres = {
      pierre: new THREE.MeshStandardMaterial({ map: pierre, roughness: 0.95 }),
      gravats: new THREE.MeshStandardMaterial({ map: pierre, color: 0x9a8f7e, roughness: 1 }),
      bois: new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 0.9 }),
      tuiles: new THREE.MeshStandardMaterial({ color: 0x8a4630, roughness: 0.85 }),
    };
    for (const morceau of parMorceau) {
      if (!morceau) continue;
      for (const [nom, liste] of Object.entries(morceau)) {
        if (!liste.length) continue;
        const m = new THREE.Mesh(recoller(liste), matieres[nom]);
        m.castShadow = m.receiveShadow = true;
        ajouterMorceau(groupe, m);
      }
    }
  }

  function arbres(groupe) {
    const n = T.arbres.length;
    const geoTronc = new THREE.CylinderGeometry(0.18, 0.3, 4, 7);
    geoTronc.translate(0, 2, 0);
    const geoFeuilles = new THREE.IcosahedronGeometry(2.6, 1);
    {
      const p = geoFeuilles.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const k = 0.8 + 0.35 * Math.abs(Math.sin(p.getX(i) * 3 + p.getY(i) * 2 + p.getZ(i)));
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85 + 5.4, p.getZ(i) * k);
      }
      geoFeuilles.computeVertexNormals();
    }
    const geoSapin = new THREE.ConeGeometry(2, 7.5, 8);
    geoSapin.translate(0, 5.2, 0);
    arbresTroncs = new THREE.InstancedMesh(geoTronc, new THREE.MeshStandardMaterial({ color: 0x4d3a28, roughness: 1 }), n);
    arbresFeuilles = new THREE.InstancedMesh(geoFeuilles, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), n);
    sapins = new THREE.InstancedMesh(geoSapin, new THREE.MeshStandardMaterial({ color: 0x2d4a2a, roughness: 0.9, flatShading: true }), n);
    T.arbres.forEach((a, i) => {
      couleursArbres[i] = new THREE.Color().setRGB(0.25 + hasard() * 0.12, 0.38 + hasard() * 0.14, 0.16 + hasard() * 0.06);
      matricesArbres[i] = new THREE.Matrix4();
      etatArbre[i] = null;
    });
    arbresFeuilles.setColorAt(0, couleursArbres[0] || new THREE.Color());
    for (const m of [arbresTroncs, arbresFeuilles, sapins]) {
      m.castShadow = true;
      m.receiveShadow = true;
      groupe.add(m);
    }
    majArbres(true);
  }

  // Les arbres debout ou couchés (on ne refait que ceux qui ont changé).
  const matricesArbres = [], couleursArbres = [];
  let arbresARanger = true;
  const q = new THREE.Quaternion(), qc = new THREE.Quaternion(), v3 = new THREE.Vector3(), un = new THREE.Vector3(), axeY = new THREE.Vector3(0, 1, 0), axeChute = new THREE.Vector3();
  function majArbres(tout) {
    const arbres = T.arbres;
    for (let i = 0; i < arbres.length; i++) {
      const a = arbres[i];
      if (!tout && etatArbre[i] === a.ecrase) continue;
      etatArbre[i] = a.ecrase;
      arbresARanger = true;
      q.setFromAxisAngle(axeY, i * 1.7);
      if (a.ecrase) {
        // couché dans le sens où le tank l'a poussé
        qc.setFromAxisAngle(axeChute.set(-Math.sin(a.angleChute), 0, Math.cos(a.angleChute)), -Math.PI / 2 + 0.08);
        q.premultiply(qc);
      }
      v3.set(a.x, T.hauteur(a.x, a.z) - 0.1, a.z);
      un.setScalar(a.taille);
      matricesArbres[i].compose(v3, q, un);
    }
  }

  // (étape 72) Ce qu'on dessine selon la place de la caméra : les morceaux du décor à moins de « distance » (et devant
  // la caméra : ça, la carte graphique le vérifie toute seule), et les arbres à moins de « distance ».
  // Les arbres sont des « instances » : on remplit la liste avec seulement les arbres proches (on la refait quand la
  // caméra a bougé de plus de 10 m, ou qu'un arbre a été écrasé).
  let dernierX = 1e9, dernierZ = 1e9, derniereDistance = -1;
  function majDistance(position, distance) {
    let vus = 0;
    for (const m of morceaux) {
      const d = Math.hypot(m.x - position.x, m.z - position.z) - m.rayon;
      m.objet.visible = d < distance;
      if (m.objet.visible) vus++;
    }
    bilan.morceaux = morceaux.length;
    bilan.morceauxVus = vus;
    if (!arbresTroncs) return;
    if (!arbresARanger && distance === derniereDistance && Math.hypot(position.x - dernierX, position.z - dernierZ) < 10) return;
    arbresARanger = false;
    (dernierX = position.x), (dernierZ = position.z), (derniereDistance = distance);
    const arbres = T.arbres, d2 = (distance + 10) * (distance + 10);
    let nf = 0, ns = 0;
    for (let i = 0; i < arbres.length; i++) {
      const a = arbres[i], dx = a.x - position.x, dz = a.z - position.z;
      if (dx * dx + dz * dz > d2) continue;
      if (a.sorte === "feuillu") {
        arbresTroncs.setMatrixAt(nf, matricesArbres[i]);
        arbresFeuilles.setMatrixAt(nf, matricesArbres[i]);
        arbresFeuilles.setColorAt(nf, couleursArbres[i]);
        nf++;
      } else sapins.setMatrixAt(ns++, matricesArbres[i]);
    }
    arbresTroncs.count = arbresFeuilles.count = nf;
    sapins.count = ns;
    for (const m of [arbresTroncs, arbresFeuilles, sapins]) {
      m.instanceMatrix.needsUpdate = true;
      m.boundingSphere = null; // (la carte graphique recalculera la bulle qui entoure ces arbres)
    }
    arbresFeuilles.instanceColor.needsUpdate = true;
    bilan.arbres = arbres.length;
    bilan.arbresVus = nf + ns;
  }

  // (étape 62) L'eau du lac : une ellipse plate et lisse, un peu transparente, qui reflète le ciel. On lui donne de
  // petites vagues avec une « carte de bosses » (normalMap) qu'on fait glisser doucement (voir majEau).
  let vagues = null;
  function lac(groupe) {
    const L = C.lac, n = 128;
    const bosses = document.createElement("canvas");
    bosses.width = bosses.height = n;
    const ctx = bosses.getContext("2d"), img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const a = Math.sin((x / n) * Math.PI * 8 + Math.sin((y / n) * Math.PI * 4) * 1.5), b = Math.sin((y / n) * Math.PI * 10 + Math.cos((x / n) * Math.PI * 6));
      const i = (y * n + x) * 4;
      img.data[i] = 128 + a * 40;
      img.data[i + 1] = 128 + b * 40;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    vagues = new THREE.CanvasTexture(bosses);
    vagues.wrapS = vagues.wrapT = THREE.RepeatWrapping;
    vagues.repeat.set(18, 40);
    const eau = new THREE.Mesh(new THREE.CircleGeometry(1, 72), new THREE.MeshStandardMaterial({ color: 0x2b5763, roughness: 0.2, metalness: 0.25, transparent: true, opacity: 0.88, normalMap: vagues, normalScale: new THREE.Vector2(0.35, 0.35) }));
    eau.rotation.x = -Math.PI / 2;
    eau.scale.set(L.rayonX * 1.02, L.rayonZ * 1.02, 1);
    eau.position.set(L.x, L.niveau, L.z);
    eau.receiveShadow = true;
    groupe.add(eau);
  }
  function majEau(dt) {
    if (vagues) vagues.offset.x += dt * 0.02;
  }

  function construire() {
    const g = new THREE.Group();
    sol(g);
    lac(g);
    village(g);
    arbres(g);
    return g;
  }

  return { construire, majArbres, majEau, majDistance, bilan };
})();
