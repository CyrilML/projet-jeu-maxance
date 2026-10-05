// 🏜️ LE DÉCOR : le peintre du désert (étape 54)
//
// Il dessine ce que le géographe (logique/terrain.js) a inventé :
//   - LE SOL : une grande grille (un point tous les 6 m, 90 000 points). Chaque point prend la hauteur du terrain et
//     la COULEUR de son terrain (sable doré, terre brune, herbes sèches, cailloux gris, boue sombre). Une image de
//     « grain » répétée tous les 8 m ajoute les petits détails (les rides du sable, les graviers) ;
//   - LA PISTE : un ruban qui épouse le sol, avec les deux ORNIÈRES creusées par les roues des concurrents ;
//   - LA RIVIÈRE : un ruban d'eau qui ondule (ses vaguelettes bougent) ;
//   - LA VÉGÉTATION et les ROCHERS : des milliers de touffes d'herbe sèche, des buissons, quelques arbres secs, des
//     rochers (en « instances », rangées par parcelles : on ne dessine que les parcelles proches).
// Comme tout l'affichage, il ne change jamais le monde.

window.Raid = window.Raid || {};

Raid.Decor = (function () {
  const C = Raid.CONFIG, W = C.monde, T = Raid.Terrain, D = C.decor;
  const parcelles = [];
  let eauMateriau = null;
  let etat = 7;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ---------------------------------------------------------------- les images
  function toile(taille, peindre) {
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  // Le grain du sol (en gris : la couleur vient de chaque point du sol) : des grains, des cailloux, des rides de sable.
  const grain = () =>
    toile(512, (ctx, t) => {
      ctx.fillStyle = "#e6e6e6";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 60000; i++) {
        const v = 200 + Math.floor((hasard() - 0.5) * 90);
        ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
        ctx.fillRect(hasard() * t, hasard() * t, 1 + hasard() * 2, 1 + hasard() * 2);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; // les rides du vent
      ctx.lineWidth = 3;
      for (let y = 0; y < t; y += 18) {
        ctx.beginPath();
        for (let x = 0; x <= t; x += 16) ctx.lineTo(x, y + Math.sin((x / t) * Math.PI * 4 + y) * 4);
        ctx.stroke();
      }
      for (let i = 0; i < 300; i++) { // de petits cailloux
        const v = 120 + Math.floor(hasard() * 60);
        ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
        ctx.beginPath();
        ctx.arc(hasard() * t, hasard() * t, 1 + hasard() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  // La piste : de la terre tassée, et deux ornières sombres (là où passent les roues), un peu floues sur les bords.
  const ornieres = () =>
    toile(256, (ctx, t) => {
      const d = ctx.createLinearGradient(0, 0, 0, t);
      d.addColorStop(0, "rgba(176,144,104,0)");
      d.addColorStop(0.12, "rgba(176,144,104,0.85)");
      d.addColorStop(0.88, "rgba(176,144,104,0.85)");
      d.addColorStop(1, "rgba(176,144,104,0)");
      ctx.fillStyle = d;
      ctx.fillRect(0, 0, t, t);
      for (const y of [0.3, 0.7]) {
        const o = ctx.createLinearGradient(0, (y - 0.08) * t, 0, (y + 0.08) * t);
        o.addColorStop(0, "rgba(90,66,44,0)");
        o.addColorStop(0.5, "rgba(90,66,44,0.55)");
        o.addColorStop(1, "rgba(90,66,44,0)");
        ctx.fillStyle = o;
        ctx.fillRect(0, (y - 0.08) * t, t, 0.16 * t);
        ctx.strokeStyle = "rgba(60,44,30,0.35)"; // les sculptures des pneus imprimées dans la terre
        ctx.lineWidth = 2;
        for (let x = 0; x < t; x += 7) {
          ctx.beginPath();
          ctx.moveTo(x, (y - 0.05) * t);
          ctx.lineTo(x + 4, (y + 0.05) * t);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = hasard() < 0.5 ? "rgba(255,240,210,0.15)" : "rgba(60,40,20,0.15)";
        ctx.fillRect(hasard() * t, (0.1 + hasard() * 0.8) * t, 2, 2);
      }
    });
  // Une touffe d'herbe sèche (brins jaunes et vert-gris, transparents autour).
  const touffe = () =>
    toile(128, (ctx, t) => {
      ctx.clearRect(0, 0, t, t);
      for (let i = 0; i < 40; i++) {
        const x = t * (0.15 + hasard() * 0.7), haut = t * (0.05 + hasard() * 0.6), penche = (hasard() - 0.5) * t * 0.45;
        const v = hasard();
        ctx.strokeStyle = v < 0.5 ? "rgb(" + (150 + v * 60) + "," + (140 + v * 40) + ",80)" : "rgb(110," + (125 + v * 30) + ",70)";
        ctx.lineWidth = 2 + hasard() * 2;
        ctx.beginPath();
        ctx.moveTo(x, t);
        ctx.quadraticCurveTo(x, (t + haut) / 2, x + penche, haut);
        ctx.stroke();
      }
    });
  // La carte des pentes de l'eau (des vaguelettes), comme pour la mer du circuit.
  function pentesEau() {
    const T2 = 128, c = document.createElement("canvas");
    c.width = c.height = T2;
    const ctx = c.getContext("2d"), img = ctx.createImageData(T2, T2);
    const h = (x, y) => Math.sin(((3 * x + y) / T2) * Math.PI * 2) * 0.5 + Math.sin(((x - 4 * y) / T2) * Math.PI * 2 + 1) * 0.35 + Math.sin(((7 * x + 5 * y) / T2) * Math.PI * 2 + 2) * 0.15;
    for (let y = 0; y < T2; y++) {
      for (let x = 0; x < T2; x++) {
        const px = (h(x + 1, y) - h(x - 1, y)) * 6, py = (h(x, y + 1) - h(x, y - 1)) * 6, l = Math.hypot(px, py, 1), i = (y * T2 + x) * 4;
        img.data[i] = ((-px / l) * 0.5 + 0.5) * 255;
        img.data[i + 1] = ((-py / l) * 0.5 + 0.5) * 255;
        img.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // ---------------------------------------------------------------- les couleurs des terrains
  const COULEURS = {
    piste: [0.74, 0.6, 0.43], terre: [0.64, 0.5, 0.35], herbe: [0.62, 0.56, 0.36], sable: [0.88, 0.73, 0.5],
    cailloux: [0.56, 0.5, 0.45], boue: [0.29, 0.21, 0.14], gue: [0.45, 0.38, 0.28], eau: [0.36, 0.3, 0.22],
  };
  const varier = (rgb, x, z) => {
    const n = Math.sin(x * 0.031 + z * 0.017) * Math.sin(z * 0.023 - x * 0.011) * 0.07 + Math.sin(x * 0.11 + z * 0.13) * 0.03;
    return [rgb[0] + n, rgb[1] + n * 0.9, rgb[2] + n * 0.7];
  };

  // ---------------------------------------------------------------- le sol
  function sol() {
    const pas = W.maille, n = Math.round(W.taille / pas);
    const positions = new Float32Array((n + 1) * (n + 1) * 3), couleurs = new Float32Array((n + 1) * (n + 1) * 3), uvs = new Float32Array((n + 1) * (n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = -T.demi + i * pas, z = -T.demi + j * pas, k = i * (n + 1) + j;
        positions.set([x, T.hauteur(x, z), z], k * 3);
        const ter = T.terrain(x, z);
        // (près de la piste, on mélange avec la couleur de la piste, pour que le bord soit doux)
        let rgb = varier(COULEURS[ter], x, z);
        const dP = T.distancePiste(x, z);
        if (ter !== "piste" && dP < W.largeurPiste) {
          const f = 1 - (dP - W.largeurPiste / 2) / (W.largeurPiste / 2);
          rgb = rgb.map((c, q) => c + (COULEURS.piste[q] - c) * Math.max(0, Math.min(1, f)) * 0.6);
        }
        couleurs.set(rgb.map((c) => Math.pow(Math.max(0, c), 2.2)), k * 3); // (les couleurs « linéaires » de Three.js)
        uvs.set([x / 8, z / 8], k * 2);
      }
    }
    const indices = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const a = i * (n + 1) + j, b = a + n + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const g = grain();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map: g, bumpMap: g, bumpScale: 1.5, roughness: 0.95 }));
    m.receiveShadow = true;
    return m;
  }

  // La piste : un ruban de 11 m qui suit le sol (5 points en travers, pour bien épouser les bosses).
  function piste() {
    const P = T.piste, largeur = W.largeurPiste + 2, positions = [], uvs = [], indices = [];
    const travers = [-1, -0.5, 0, 0.5, 1];
    P.forEach((p, i) => {
      const nx = -Math.sin(p.angle), nz = Math.cos(p.angle);
      for (const t of travers) {
        const x = p.x + nx * t * (largeur / 2), z = p.z + nz * t * (largeur / 2);
        positions.push(x, T.hauteur(x, z) + 0.06, z);
        uvs.push(p.s / 10, (t + 1) / 2);
      }
    });
    const n = P.length, k = travers.length;
    for (let i = 0; i < n; i++) {
      const a = i * k, b = ((i + 1) % n) * k;
      for (let q = 0; q < k - 1; q++) indices.push(a + q, b + q, a + q + 1, a + q + 1, b + q, b + q + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ornieres(), transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.receiveShadow = true;
    return m;
  }

  // La rivière : un ruban d'eau, de sa source jusqu'au bord du monde.
  function riviere() {
    const R = W.riviere, positions = [], uvs = [], indices = [];
    let lignes = 0;
    for (let z = R.source; z <= T.demi; z += 4) {
      const L = T.demiLargeur(z) + 1.5, xc = T.xRiviere(z), y = T.niveauEau(z);
      positions.push(xc - L, y, z, xc + L, y, z);
      uvs.push(0, z / 20, L / 10, z / 20);
      lignes++;
    }
    for (let i = 0; i < lignes - 1; i++) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const pentes = pentesEau();
    pentes.repeat.set(1, 1);
    eauMateriau = new THREE.MeshStandardMaterial({ color: 0x4f6b6a, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.82, normalMap: pentes, normalScale: new THREE.Vector2(0.6, 0.6), side: THREE.DoubleSide });
    return new THREE.Mesh(geo, eauMateriau);
  }

  // ---------------------------------------------------------------- la végétation et les rochers (par parcelles)
  const PARCELLE = 150;
  function planter(groupe, liste, forme, materiau, ombre) {
    const cases = new Map();
    for (const p of liste) {
      const cle = Math.floor(p.x / PARCELLE) + "," + Math.floor(p.z / PARCELLE);
      if (!cases.has(cle)) cases.set(cle, []);
      cases.get(cle).push(p);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), v = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    for (const [cle, l] of cases) {
      const im = new THREE.InstancedMesh(forme, materiau, l.length);
      l.forEach((p, i) => {
        q.setFromAxisAngle(haut, p.a);
        m4.compose(v.set(p.x, p.y, p.z), q, e.set(p.sx, p.sy, p.sz));
        im.setMatrixAt(i, m4);
        im.setColorAt(i, c.setRGB(p.c[0], p.c[1], p.c[2]));
      });
      im.castShadow = !!ombre;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      groupe.add(im);
      const [i, j] = cle.split(",").map(Number);
      parcelles.push({ objet: im, x: (i + 0.5) * PARCELLE, z: (j + 0.5) * PARCELLE, loin: ombre ? 900 : D.distanceTouffes });
    }
  }
  // Un point au hasard, pas sur la piste ni dans l'eau, sur un terrain accepté.
  function auHasard(accepte) {
    for (let k = 0; k < 30; k++) {
      const x = (hasard() * 2 - 1) * (T.demi - 10), z = (hasard() * 2 - 1) * (T.demi - 10);
      const ter = T.terrain(x, z);
      if (!accepte.includes(ter) || T.distancePiste(x, z) < W.largeurPiste / 2 + 2) continue;
      return { x, z, y: T.hauteur(x, z), ter };
    }
    return null;
  }
  function vegetation() {
    const g = new THREE.Group();
    // Les touffes d'herbe sèche : 3 images croisées en étoile (comme l'herbe du circuit).
    const etoile = new THREE.BufferGeometry();
    {
      const pos = [], uv = [], nor = [], idx = [];
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3, cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5, b = pos.length / 3;
        pos.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz);
        uv.push(0, 0, 1, 0, 1, 1, 0, 1);
        for (let q = 0; q < 4; q++) nor.push(0, 1, 0);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3, b, b + 2, b + 1, b, b + 3, b + 2); // les deux faces, normale toujours vers le ciel (sinon le dos est noir)
      }
      etoile.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      etoile.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      etoile.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      etoile.setIndex(idx);
    }
    const herbes = [];
    for (let i = 0; i < D.touffes; i++) {
      const p = auHasard(["herbe", "herbe", "terre", "sable", "cailloux", "boue"]);
      if (!p) continue;
      const s = (p.ter === "herbe" ? 0.8 : 0.5) + hasard() * 0.7;
      const v = 0.85 + hasard() * 0.3;
      herbes.push({ x: p.x, y: p.y - 0.05, z: p.z, a: hasard() * 6.3, sx: s * 1.3, sy: s, sz: s * 1.3, c: [v, v, v * 0.9] });
    }
    const matHerbe = new THREE.MeshStandardMaterial({ map: touffe(), alphaTest: 0.5, roughness: 0.95 });
    planter(g, herbes, etoile, matHerbe, false);
    // Les buissons (des boules cabossées vert-de-gris) et quelques arbres secs (un tronc tordu et une couronne plate).
    const boule = new THREE.IcosahedronGeometry(1, 1);
    {
      const p = boule.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const k = 0.8 + 0.4 * Math.abs(Math.sin(p.getX(i) * 7 + p.getY(i) * 5 + p.getZ(i) * 3));
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k);
      }
      boule.computeVertexNormals();
    }
    const buissons = [];
    for (let i = 0; i < D.buissons; i++) {
      const p = auHasard(["herbe", "terre", "cailloux", "sable"]);
      if (!p) continue;
      const s = 0.5 + hasard() * 1.1, v = hasard();
      buissons.push({ x: p.x, y: p.y + s * 0.3, z: p.z, a: hasard() * 6.3, sx: s, sy: s, sz: s, c: [0.32 + v * 0.15, 0.36 + v * 0.12, 0.2 + v * 0.06] });
    }
    planter(g, buissons, boule, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), true);
    const troncs = [], couronnes = [];
    for (let i = 0; i < 70; i++) {
      const p = auHasard(["herbe", "terre"]);
      if (!p) continue;
      const s = 0.8 + hasard() * 0.6, a = hasard() * 6.3;
      troncs.push({ x: p.x, y: p.y + 1.6 * s, z: p.z, a, sx: s, sy: s, sz: s, c: [0.42, 0.33, 0.24] });
      couronnes.push({ x: p.x, y: p.y + 3.4 * s, z: p.z, a, sx: 3 * s, sy: 0.5 * s, sz: 3 * s, c: [0.36, 0.42, 0.22] });
    }
    planter(g, troncs, new THREE.CylinderGeometry(0.12, 0.22, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), true);
    planter(g, couronnes, boule, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), true);
    // Les rochers : surtout dans les cailloux, gris-beige, à moitié enfoncés.
    const rocher = new THREE.DodecahedronGeometry(1, 0);
    {
      const p = rocher.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const k = 0.75 + 0.5 * Math.abs(Math.sin(p.getX(i) * 9.1 + p.getZ(i) * 4.7));
        p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
      }
      rocher.computeVertexNormals();
    }
    const rochers = [];
    for (let i = 0; i < D.rochers; i++) {
      const p = auHasard(hasard() < 0.7 ? ["cailloux"] : ["terre", "herbe", "sable"]);
      if (!p) continue;
      const s = 0.3 + Math.pow(hasard(), 2) * 2.4, v = 0.5 + hasard() * 0.2;
      rochers.push({ x: p.x, y: p.y - s * 0.3, z: p.z, a: hasard() * 6.3, sx: s * 1.3, sy: s * 0.8, sz: s, c: [v + 0.05, v, v - 0.05] });
    }
    planter(g, rochers, rocher, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, flatShading: true }), true);
    return g;
  }

  function construire() {
    const g = new THREE.Group();
    g.add(sol(), piste(), riviere(), vegetation());
    return g;
  }

  // Chaque image : les vaguelettes glissent, et on cache les parcelles trop loin de la caméra.
  let affichees = 0;
  function maj(dt, cam) {
    if (eauMateriau) eauMateriau.normalMap.offset.y = (eauMateriau.normalMap.offset.y - dt * 0.08) % 1;
    affichees = 0;
    for (const p of parcelles) {
      const dx = p.x - cam.position.x, dz = p.z - cam.position.z;
      p.objet.visible = dx * dx + dz * dz < (p.loin + PARCELLE) ** 2;
      if (p.objet.visible) affichees++;
    }
  }

  return { construire, maj, get parcellesAffichees() { return affichees; }, get parcelles() { return parcelles.length; } };
})();
