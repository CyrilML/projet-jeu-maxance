// 🪵 LE DÉCOR DES MÉGA-RAMPES : le charpentier du ciel
//
// Étape 41. Il fabrique avec Three.js la piste dans le ciel :
//   - la PISTE en bois clair : pour chaque tronçon (moteur/ruban.js), on « tire » une coupe de la piste
//     (comme un profil de toboggan : le plat au milieu, et les deux BORDS RELEVÉS en arrondi) d'un échantillon
//     au suivant. Dessous, une poutre en bois foncé ;
//   - de longs PILIERS qui descendent se perdre dans les nuages ;
//   - la MER DE NUAGES tout en bas, et des nuages en 3D (des boules blanches aplaties, en « instances ») ;
//   - les plaques de NITRO (elles clignotent), les DRAPEAUX (rouges, puis verts quand tu les as passés),
//     les portiques DÉPART et ARRIVÉE.
//
// Il lit le terrain de logique/mega-rampes.js : ce qu'on voit est exactement ce sur quoi on roule.

window.Circuit = window.Circuit || {};

Circuit.DecorRampes = (function () {
  const M = Circuit.CONFIG.rampes;

  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }

  function geometrie(liste) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(liste.p, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(liste.uv, 2));
    geo.computeVertexNormals();
    return geo;
  }
  // Un quadrilatère a, b, c, d (dans l'ordre du tour), avec ses coordonnées de texture [u1, v1, u2, v2].
  function quad(liste, a, b, c, d, uv) {
    liste.p.push(...a, ...b, ...c, ...a, ...c, ...d);
    liste.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[1], uv[2], uv[3], uv[0], uv[3]);
  }

  // La coupe de la piste : [w (en travers), hauteur au-dessus de la piste]. Le plat, puis les bords en arrondi.
  function profil() {
    const W = M.largeur / 2, B = M.bord;
    const bord = [];
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2); // un quart de cercle, comme un skatepark
      bord.push([W + Math.sin(a) * 1.6, (1 - Math.cos(a)) * B]);
    }
    return bord.slice().reverse().map(([w, h]) => [-w, h]).concat(bord);
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const MR = Circuit.MegaRampes;
    const mat = D.mat;
    const g = new THREE.Group();
    const tr = MR.troncons, ech = MR.echantillons;
    const coupe = profil();
    const largeurTotale = coupe[coupe.length - 1][0];

    // 1. La piste. Chaque échantillon a une direction : la moyenne des deux tronçons qui le touchent.
    const point = (k, w, dy) => {
      const avant = tr[Math.max(0, k - 1)], apres = tr[Math.min(tr.length - 1, k)];
      let ux = avant.ux + apres.ux, uz = avant.uz + apres.uz;
      const l = Math.hypot(ux, uz);
      ux /= l;
      uz /= l;
      const e = ech[k];
      return [e.x - uz * w, e.y + dy, e.z + ux * w];
    };
    const dessus = { p: [], uv: [] }, tremplin = { p: [], uv: [] }, dessous = { p: [], uv: [] };
    let longueurCoupe = 0;
    const vCoupe = coupe.map((c, i) => (i ? (longueurCoupe += Math.hypot(c[0] - coupe[i - 1][0], c[1] - coupe[i - 1][1])) : 0));
    const EPAIS = 0.8;
    for (const t of MR.routes) {
      const k = t.numero, k2 = k + 1;
      const s1 = ech[k].s / 6, s2 = ech[k2].s / 6;
      for (let i = 0; i < coupe.length - 1; i++) {
        const plat = i === (coupe.length / 2) - 1; // le morceau plat du milieu
        const liste = plat && t.sorte === "tremplin" ? tremplin : dessus;
        const [w1, h1] = coupe[i], [w2, h2] = coupe[i + 1];
        quad(liste, point(k, w1, h1), point(k, w2, h2), point(k2, w2, h2), point(k2, w1, h1),
          plat && t.sorte === "tremplin" ? [0, s1, 1, s2] : [vCoupe[i] / 3, s1, vCoupe[i + 1] / 3, s2]);
      }
      // Les côtés extérieurs et le dessous (la poutre).
      for (const [w1, w2, h1, h2] of [[-largeurTotale, -largeurTotale, M.bord, -EPAIS], [largeurTotale, largeurTotale, -EPAIS, M.bord], [-largeurTotale, largeurTotale, -EPAIS, -EPAIS]]) {
        quad(dessous, point(k, w1, h1), point(k, w2, h2), point(k2, w2, h2), point(k2, w1, h1), [0, s1, 1, s2]);
      }
      // Le bout de la piste (devant un saut, ou tout au bout) : un mur plein.
      for (const [bout, kb] of [[!t.avantRoute, k], [!t.apresRoute, k2]]) {
        if (!bout) continue;
        quad(dessous, point(kb, -largeurTotale, -EPAIS), point(kb, largeurTotale, -EPAIS), point(kb, largeurTotale, M.bord), point(kb, -largeurTotale, M.bord), [0, 0, 2, 1]);
      }
    }
    const deuxFaces = { side: THREE.DoubleSide };
    const piste = new THREE.Mesh(geometrie(dessus), mat(Object.assign({ map: repeter(T.bois(), 1, 1), roughness: 0.75 }, deuxFaces)));
    const rampe = new THREE.Mesh(geometrie(tremplin), mat(Object.assign({ map: repeter(T.tremplin(), 1, 1), roughness: 0.7 }, deuxFaces)));
    const poutre = new THREE.Mesh(geometrie(dessous), mat(Object.assign({ map: repeter(T.planches(), 1, 1), color: 0x8a6a4a, roughness: 0.9 }, deuxFaces)));
    for (const m of [piste, rampe, poutre]) {
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    }

    // 2. Les piliers : ils descendent jusque dans les nuages.
    const piliers = [];
    MR.routes.forEach((t, i) => {
      if (i % 10 !== 0) return;
      for (const cote of [-1, 1]) {
        const p = point(t.numero, cote * (M.largeur / 2 - 1), 0);
        piliers.push([p[0], p[1] - EPAIS, p[2]]);
      }
    });
    const bas = M.nuages - 15;
    const geoPilier = new THREE.CylinderGeometry(0.45, 0.6, 1, 10);
    const instances = new THREE.InstancedMesh(geoPilier, mat({ map: repeter(T.planches(), 1, 6), color: 0x9a7a55 }), piliers.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    piliers.forEach(([x, y, z], i) => instances.setMatrixAt(i, m4.compose(new THREE.Vector3(x, (y + bas) / 2, z), q, new THREE.Vector3(1, y - bas, 1))));
    instances.castShadow = true;
    g.add(instances);

    // 3. La mer de nuages, et des nuages en 3D (chaque nuage = 5 boules blanches aplaties).
    const mer = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000), new THREE.MeshStandardMaterial({ map: repeter(T.nuages(), 60, 60), color: 0xffffff, emissive: 0xc8d4e6, emissiveIntensity: 0.35, roughness: 1 }));
    mer.rotation.x = -Math.PI / 2;
    mer.position.y = M.nuages;
    mer.receiveShadow = true;
    g.add(mer);
    let etat = 41;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const boules = [];
    for (let n = 0; n < 160; n++) {
      // Un nuage près d'un point de la piste (pas trop près), ou loin vers l'horizon.
      const e = ech[Math.floor(alea() * ech.length)];
      const angle = alea() * Math.PI * 2, distance = 40 + alea() * 500;
      const cx = e.x + Math.cos(angle) * distance, cz = e.z + Math.sin(angle) * distance;
      const cy = M.nuages + 2 + alea() * (n % 4 === 0 ? 70 : 18);
      const taille = 6 + alea() * 14;
      for (let b = 0; b < 5; b++) boules.push([cx + (alea() - 0.5) * taille * 2.2, cy + alea() * taille * 0.3, cz + (alea() - 0.5) * taille * 1.4, taille * (0.6 + alea() * 0.5)]);
    }
    const nuages = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdde6f2, emissiveIntensity: 0.45, roughness: 1 }), boules.length);
    boules.forEach(([x, y, z, r], i) => nuages.setMatrixAt(i, m4.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(r, r * 0.55, r))));
    g.add(nuages);

    // 4. Les plaques de nitro (elles clignotent).
    const lumiereNitro = new THREE.MeshStandardMaterial({ map: T.nitro(), emissiveMap: T.nitro(), emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 });
    for (const p of MR.nitros) {
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(M.longueurNitro, M.largeurNitro), lumiereNitro);
      plaque.rotation.set(-Math.PI / 2, 0, -p.angle);
      plaque.position.set(p.x, p.y + 0.05, p.z);
      plaque.receiveShadow = true;
      g.add(plaque);
    }

    // 5. Les drapeaux : un mât et un drapeau, à gauche de la piste. Rouge = pas encore passé, vert = passé.
    const drapeaux = MR.drapeaux.map((d) => {
      const x = d.x + d.sin * (largeurTotale + 0.8), z = d.z - d.cos * (largeurTotale + 0.8);
      const mat2 = new THREE.MeshStandardMaterial({ color: 0xe02424, emissive: 0x500000, side: THREE.DoubleSide, roughness: 0.6 });
      const mat3 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 8), mat({ color: 0xdddddd, metalness: 0.6 }));
      mat3.position.set(x, d.y + 3, z);
      g.add(mat3);
      const tissu = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), mat2);
      tissu.position.set(x - d.cos * 1.1, d.y + 5.2, z - d.sin * 1.1);
      tissu.rotation.y = -d.angle;
      g.add(tissu);
      return mat2;
    });

    // 6. Les portiques du départ et de l'arrivée (l'arrivée avec un damier).
    const depart = MR.drapeaux[0];
    g.add(portique("DÉPART", MR.pointAuMetre(8, 0), largeurTotale, mat));
    g.add(portique("ARRIVÉE", MR.arrivee, largeurTotale, mat));
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(2.5, M.largeur), mat({ map: repeter(T.damier(), 1, 5) }));
    ligne.rotation.set(-Math.PI / 2, 0, -MR.arrivee.angle);
    ligne.position.set(MR.arrivee.x, MR.arrivee.y + 0.06, MR.arrivee.z);
    g.add(ligne);
    void depart;

    // Chaque image : les nitros clignotent, les drapeaux passés deviennent verts.
    function maj(temps, monde) {
      lumiereNitro.emissiveIntensity = 0.9 + 0.7 * Math.sin(temps * 7);
      const passe = monde && monde.drapeau !== undefined && (monde.phase === "rampes" || monde.phase === "rampes-fin") ? monde.drapeau : -1;
      drapeaux.forEach((m, i) => {
        m.color.setHex(i <= passe ? 0x22c55e : 0xe02424);
        m.emissive.setHex(i <= passe ? 0x0a4020 : 0x500000);
      });
    }
    return { groupe: g, maj };
  }

  // Un portique au-dessus de la piste : deux poteaux et une banderole écrite.
  function portique(texte, p, largeurTotale, mat) {
    const groupe = new THREE.Group();
    const rouge = mat({ color: 0xc81e1e, roughness: 0.5 });
    for (const w of [-largeurTotale - 0.4, largeurTotale + 0.4]) {
      const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 0.5), rouge);
      poteau.position.set(-Math.sin(p.angle) * w, 3.5, Math.cos(p.angle) * w);
      poteau.castShadow = true;
      groupe.add(poteau);
    }
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 96;
    const ctx = toile.getContext("2d");
    for (let i = 0; i < 32; i++) for (let j = 0; j < 6; j++) {
      ctx.fillStyle = (i + j) % 2 ? "#111" : "#f2f2f2";
      ctx.fillRect(i * 16, j * 16, 16, 16);
    }
    ctx.fillStyle = "rgba(20,32,58,.85)";
    ctx.fillRect(96, 12, 320, 72);
    ctx.fillStyle = "#ffe27a";
    ctx.font = "bold 54px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 256, 50);
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    const banderole = new THREE.Mesh(new THREE.PlaneGeometry(2 * largeurTotale + 1.5, 2.6), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.3, side: THREE.DoubleSide }));
    banderole.position.y = 7.2;
    banderole.rotation.y = -p.angle + Math.PI / 2;
    groupe.add(banderole);
    groupe.position.set(p.x, p.y, p.z);
    return groupe;
  }

  // Les rayons X : les bords de la piste (bleu), les nitros (bleu clair), les sauts (jaune),
  // les drapeaux (vert) et la ligne d'arrivée (violet).
  function rayonsX(couleurs) {
    const c = Circuit.Constructeur();
    const MR = Circuit.MegaRampes;
    const W = M.largeur / 2;
    for (const t of MR.routes) {
      const bx = t.ax + t.ux * t.longueur, bz = t.az + t.uz * t.longueur;
      for (const w of [-W, W]) c.ligne([t.ax - t.uz * w, t.ya + 0.15, t.az + t.ux * w], [bx - t.uz * w, t.yb + 0.15, bz + t.ux * w], couleurs.bords);
    }
    for (const p of MR.nitros) {
      const coin = (u, w) => [p.x + p.cos * u - p.sin * w, p.y + 0.2, p.z + p.sin * u + p.cos * w];
      const L = M.longueurNitro / 2, Wn = M.largeurNitro / 2;
      const coins = [coin(-L, -Wn), coin(L, -Wn), coin(L, Wn), coin(-L, Wn)];
      for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], couleurs.nitro);
    }
    for (const s of MR.sauts) {
      c.ligne([s.depart.x, s.depart.y, s.depart.z], [s.arrivee.x, s.arrivee.y, s.arrivee.z], couleurs.saut);
      for (const b of [s.depart, s.arrivee]) c.ligne([b.x, b.y, b.z], [b.x, b.y + 6, b.z], couleurs.saut);
    }
    for (const d of MR.drapeaux) {
      c.ligne([d.x + d.sin * W, d.y, d.z - d.cos * W], [d.x + d.sin * W, d.y + 7, d.z - d.cos * W], couleurs.drapeau);
      c.ligne([d.x - d.sin * W, d.y + 0.3, d.z + d.cos * W], [d.x + d.sin * W, d.y + 0.3, d.z - d.cos * W], couleurs.drapeau);
    }
    const a = MR.arrivee;
    c.ligne([a.x - Math.sin(a.angle) * W, a.y + 0.3, a.z + Math.cos(a.angle) * W], [a.x + Math.sin(a.angle) * W, a.y + 0.3, a.z - Math.cos(a.angle) * W], couleurs.arrivee);
    return c.fin();
  }

  return { construire, rayonsX };
})();
