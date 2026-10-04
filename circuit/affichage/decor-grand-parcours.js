// 🏗️ LE DÉCOR DU GRAND PARCOURS : le poseur de rails Carrera
//
// Étape 40. Il fabrique avec Three.js tout ce qu'on voit sur le grand parcours :
//   - la ROUTE : pour chaque tronçon de 3 m (logique/grand-parcours.js), un rectangle de goudron, avec les
//     bordures rouges et blanches sur les côtés, comme un circuit Carrera. En hauteur, la route est un pont :
//     on dessine ses côtés et son dessous, et des PILIERS qui la tiennent ;
//   - les PLATEFORMES : un rectangle épais percé de trous (une « forme avec des trous » qu'on extrude),
//     avec des bords jaunes et noirs, et les BOSSES (des demi-sphères aplaties) ;
//   - le CREUX : le sol est creusé (une grille de points dont on baisse la hauteur) ;
//   - les plaques de NITRO, qui clignotent ;
//   - le portique du départ, les panneaux, les arbres, la clôture.
//
// Il lit le terrain de logique/grand-parcours.js : ce qu'on voit est exactement ce sur quoi on roule.

window.Circuit = window.Circuit || {};

Circuit.DecorGrandParcours = (function () {
  const G = Circuit.CONFIG.grandParcours;

  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }

  // Une géométrie faite de triangles donnés à la main (positions et coordonnées de texture).
  function geometrie(positions, uvs) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  // Un quadrilatère (a, b, c, d dans l'ordre du tour) ajouté à une liste de triangles.
  function quad(liste, a, b, c, d, uv) {
    liste.p.push(...a, ...b, ...c, ...a, ...c, ...d);
    liste.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[1], uv[2], uv[3], uv[0], uv[3]);
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const GP = Circuit.GrandParcours;
    const mat = D.mat;
    const g = new THREE.Group();
    const W = G.largeur / 2;

    // 1. Le sol : 4 grands morceaux d'herbe autour du creux, et le creux lui-même (une grille creusée).
    const K = GP.creux;
    const x1 = K.x - K.longueur / 2, x2 = K.x + K.longueur / 2, z1 = K.z - K.largeur / 2, z2 = K.z + K.largeur / 2;
    const B = G.taille;
    for (const [ax, bx, az, bz] of [[-B, x1, -B, B], [x2, B, -B, B], [x1, x2, -B, z1], [x1, x2, z2, B]]) {
      const l = bx - ax, p = bz - az;
      const sol = new THREE.Mesh(new THREE.PlaneGeometry(l, p), mat({ map: repeter(T.herbe(), l / 12, p / 12) }));
      sol.rotation.x = -Math.PI / 2;
      sol.position.set((ax + bx) / 2, 0, (az + bz) / 2);
      sol.receiveShadow = true;
      g.add(sol);
    }
    const geoCreux = new THREE.PlaneGeometry(K.longueur, K.largeur, 60, 25);
    geoCreux.rotateX(-Math.PI / 2);
    const pos = geoCreux.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, GP.solDeBase(K.x + pos.getX(i), K.z + pos.getZ(i)));
    geoCreux.computeVertexNormals();
    const creux = new THREE.Mesh(geoCreux, mat({ map: repeter(T.terre(), K.longueur / 10, K.largeur / 10) }));
    creux.position.set(K.x, 0, K.z);
    creux.receiveShadow = true;
    g.add(creux);

    // 2. La route. Pour que les tronçons se raccordent sans fente, chaque échantillon a une direction :
    // la moyenne des deux tronçons qui le touchent.
    const tr = GP.troncons, n = tr.length;
    const bord = (k, w, y) => {
      const a = tr[k], avant = tr[(k - 1 + n) % n];
      let ux = a.ux + avant.ux, uz = a.uz + avant.uz;
      const l = Math.hypot(ux, uz);
      ux /= l;
      uz /= l;
      return [a.ax - uz * w, y, a.az + ux * w];
    };
    const dessous = (h, x, z) => (h - G.epaisseur < G.hauteurVoiture ? GP.solDeBase(x, z) - 0.1 : h - G.epaisseur);
    const goudron = { p: [], uv: [] }, tremplin = { p: [], uv: [] }, bordures = { p: [], uv: [] }, cotes = { p: [], uv: [] };
    const ech = GP.echantillons;
    for (let k = 0; k < n; k++) {
      const t = tr[k];
      if (!t.route) continue;
      const k2 = (k + 1) % n;
      const ya = t.ya + 0.02, yb = t.yb + 0.02;
      const s1 = ech[k].s, s2 = s1 + t.longueur;
      const surface = t.sorte === "tremplin" ? tremplin : goudron;
      quad(surface, bord(k, -W, ya), bord(k2, -W, yb), bord(k2, W, yb), bord(k, W, ya), [s1 / 8, 0, s2 / 8, (2 * W) / 8]);
      // Les bordures rouges et blanches (1 m de large, de chaque côté).
      for (const [w1, w2] of [[-W, -W + 1], [W - 1, W]]) {
        quad(bordures, bord(k, w1, ya + 0.02), bord(k2, w1, yb + 0.02), bord(k2, w2, yb + 0.02), bord(k, w2, ya + 0.02), [s1 / 4, 0, s2 / 4, 1]);
      }
      // Les côtés du pont (et le dessous) : jusqu'au sol si la route est basse.
      for (const w of [-W, W]) {
        const a = bord(k, w, ya), b = bord(k2, w, yb);
        quad(cotes, a, b, [b[0], dessous(t.yb, b[0], b[2]), b[2]], [a[0], dessous(t.ya, a[0], a[2]), a[2]], [s1 / 4, 0, s2 / 4, 1]);
      }
      if (t.ya - G.epaisseur >= G.hauteurVoiture) {
        quad(cotes, bord(k, -W, t.ya - G.epaisseur), bord(k2, -W, t.yb - G.epaisseur), bord(k2, W, t.yb - G.epaisseur), bord(k, W, t.ya - G.epaisseur), [0, 0, 1, 1]);
      }
      // Le bout de la route (devant le creux, ou au bord d'une plateforme) : un mur plein.
      for (const [bout, kb, h] of [[!t.avantRoute, k, t.ya], [!t.apresRoute, k2, t.yb]]) {
        if (!bout) continue;
        const a = bord(kb, -W, h), b = bord(kb, W, h);
        quad(cotes, a, b, [b[0], dessous(h, b[0], b[2]), b[2]], [a[0], dessous(h, a[0], a[2]), a[2]], [0, 0, (2 * W) / 4, 1]);
      }
    }
    const ajouter = (liste, materiau) => {
      const m = new THREE.Mesh(geometrie(liste.p, liste.uv), materiau);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
    };
    const deuxFaces = { side: THREE.DoubleSide };
    ajouter(goudron, mat(Object.assign({ map: repeter(T.goudron(), 1, 1), roughness: 0.85 }, deuxFaces)));
    ajouter(tremplin, mat(Object.assign({ map: repeter(T.tremplin(), 1, 1), roughness: 0.7 }, deuxFaces)));
    ajouter(bordures, mat(Object.assign({ map: repeter(T.bordure(), 1, 1), roughness: 0.6 }, deuxFaces)));
    ajouter(cotes, mat(Object.assign({ map: repeter(T.beton(), 1, 1), roughness: 0.9 }, deuxFaces)));

    // 3. Les plateformes : un rectangle épais (1,5 m) percé de trous, avec des bords jaunes et noirs.
    for (const p of GP.plateformes) {
      const forme = new THREE.Shape();
      const L = p.longueur / 2, P = p.largeur / 2;
      forme.moveTo(-L, -P);
      forme.lineTo(L, -P);
      forme.lineTo(L, P);
      forme.lineTo(-L, P);
      forme.closePath();
      for (const trou of p.trous) {
        const chemin = new THREE.Path();
        const tx = trou.x - p.x, tz = trou.z - p.z, tl = trou.longueur / 2, tw = trou.largeur / 2;
        chemin.moveTo(tx - tl, tz - tw);
        chemin.lineTo(tx - tl, tz + tw);
        chemin.lineTo(tx + tl, tz + tw);
        chemin.lineTo(tx + tl, tz - tw);
        chemin.closePath();
        forme.holes.push(chemin);
      }
      const geo = new THREE.ExtrudeGeometry(forme, { depth: 1.5, bevelEnabled: false });
      geo.rotateX(Math.PI / 2); // la forme dessinée « à plat » : x reste x, le dessin vertical devient z
      const dessus = mat({ map: repeter(T.beton(), 1 / 8, 1 / 8), roughness: 0.8 });
      const cote = mat({ map: repeter(T.danger(), 1 / 3, 1), roughness: 0.6 });
      const m = new THREE.Mesh(geo, [dessus, cote]);
      m.position.set(p.x, p.y, p.z);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      // Les bosses : des demi-sphères aplaties, orange.
      const geoBosse = new THREE.SphereGeometry(G.bosse.rayon, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      geoBosse.scale(1, G.bosse.hauteur / G.bosse.rayon, 1);
      for (const b of p.bosses) {
        const bosse = new THREE.Mesh(geoBosse, mat({ color: 0xe8772a, roughness: 0.6 }));
        bosse.position.set(b.x, p.y, b.z);
        bosse.castShadow = bosse.receiveShadow = true;
        g.add(bosse);
      }
    }

    // 4. Les piliers (en « instances » : une seule forme de cylindre, étirée à la bonne hauteur).
    const piliers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.6, 0.7, 1, 12), mat({ map: repeter(T.beton(), 1, 2) }), GP.piliers.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    GP.piliers.forEach((p, i) => piliers.setMatrixAt(i, m4.compose(new THREE.Vector3(p.x, (p.bas + p.haut) / 2, p.z), q, new THREE.Vector3(1, p.haut - p.bas, 1))));
    piliers.castShadow = piliers.receiveShadow = true;
    g.add(piliers);

    // 5. Les plaques de nitro : elles brillent (emissive) et clignotent.
    const lumiereNitro = new THREE.MeshStandardMaterial({ map: T.nitro(), emissiveMap: T.nitro(), emissive: 0xffffff, emissiveIntensity: 1, roughness: 0.4 });
    for (const p of GP.nitros) {
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(G.longueurNitro, G.largeurNitro), lumiereNitro);
      plaque.rotation.set(-Math.PI / 2, 0, -p.angle);
      plaque.position.set(p.x, p.y + 0.06, p.z);
      plaque.receiveShadow = true;
      g.add(plaque);
    }

    // 6. Le portique du départ, et la ligne en damier.
    const ligne = new THREE.Mesh(new THREE.PlaneGeometry(3, 2 * W), mat({ map: repeter(T.damier(), 1, 4) }));
    ligne.rotation.x = -Math.PI / 2;
    ligne.position.set(4, 0.05, 0);
    g.add(ligne);
    const rouge = mat({ color: 0xc81e1e, roughness: 0.5 });
    for (const z of [-W - 1, W + 1]) {
      const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7, 0.6), rouge);
      poteau.position.set(4, 3.5, z);
      poteau.castShadow = true;
      g.add(poteau);
    }
    g.add(panneau("GRAND PARCOURS", 4, 7.4, 0, -Math.PI / 2, 2 * W + 3, 2.2)); // tourné vers les voitures qui arrivent

    // 7. Des panneaux pour prévenir.
    const iVide = GP.points.findIndex((p) => p[3] === "vide");
    const iRampe = GP.points.findIndex((p, i) => GP.points[(i + 1) % GP.points.length][3] === "plateforme");
    const signes = [
      [GP.pointSurLaRoute(iVide - 2, 0.7), "ACCÉLÈRE… ET SAUTE !"],
      [GP.pointSurLaRoute(iRampe, 0.05), "LA GRANDE RAMPE"],
    ];
    for (const [p, texte] of signes) {
      const x = p.x - p.sin * (W + 4), z = p.z + p.cos * (W + 4);
      g.add(panneau(texte, x, p.y + 4.5, z, Math.atan2(-p.cos, -p.sin), 12, 2.4)); // face aux voitures qui arrivent
      const pied = new THREE.Mesh(new THREE.BoxGeometry(0.3, p.y + 3.3 - GP.solDeBase(x, z), 0.3), mat({ color: 0x555555 }));
      pied.position.set(x, (p.y + 3.3 + GP.solDeBase(x, z)) / 2, z);
      g.add(pied);
    }

    // 8. La clôture et les arbres (loin de la route, des plateformes et du creux).
    for (const c of D.cloture(GP.limite + 2)) g.add(c);
    let etat = G.graine;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const arbres = [];
    let essais = 0;
    while (arbres.length < 220 && essais < 6000) {
      essais++;
      const x = (alea() * 2 - 1) * (GP.limite - 8), z = (alea() * 2 - 1) * (GP.limite - 8);
      if (GP.solDeBase(x, z) < 0 || Math.hypot(x - K.x, z - K.z) < 80) continue;
      if (ech.some((e) => Math.abs(e.x - x) < W + 9 && Math.abs(e.z - z) < W + 9)) continue;
      if (GP.plateformes.some((p) => Math.abs(p.x - x) < p.longueur / 2 + 8 && Math.abs(p.z - z) < p.largeur / 2 + 8)) continue;
      arbres.push([x, z, 0.8 + alea() * 0.8]);
    }
    g.add(D.foret(arbres));

    // Chaque image : les plaques de nitro clignotent.
    function maj(temps) {
      lumiereNitro.emissiveIntensity = 0.9 + 0.7 * Math.sin(temps * 7);
    }
    return { groupe: g, maj };
  }

  // Un panneau avec un texte écrit sur une toile (un canvas), posé à (x, y, z) et tourné de `rotation` (autour de y).
  function panneau(texte, x, y, z, rotation, largeur, hauteur) {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 100;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = "#14203a";
    ctx.fillRect(0, 0, 512, 100);
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 92);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 256, 52, 490);
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.rotation.y = rotation;
    return m;
  }

  // Les rayons X : les bords de la route (bleu), les plateformes (bleu) et leurs trous (rouge),
  // les plaques de nitro (vert) et le saut du creux (jaune).
  function rayonsX(couleurs) {
    const c = Circuit.Constructeur();
    const GP = Circuit.GrandParcours;
    const W = G.largeur / 2;
    for (const t of GP.routes) {
      const bx = t.ax + t.ux * t.longueur, bz = t.az + t.uz * t.longueur;
      for (const w of [-W, W]) c.ligne([t.ax - t.uz * w, t.ya + 0.15, t.az + t.ux * w], [bx - t.uz * w, t.yb + 0.15, bz + t.ux * w], couleurs.bords);
    }
    const rectangle = (x, z, l, w, y, couleur) => {
      const coins = [[x - l / 2, y, z - w / 2], [x + l / 2, y, z - w / 2], [x + l / 2, y, z + w / 2], [x - l / 2, y, z + w / 2]];
      for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], couleur);
    };
    for (const p of GP.plateformes) {
      rectangle(p.x, p.z, p.longueur, p.largeur, p.y + 0.15, couleurs.bords);
      for (const trou of p.trous) rectangle(trou.x, trou.z, trou.longueur, trou.largeur, p.y + 0.15, couleurs.danger);
    }
    for (const p of GP.nitros) {
      const coin = (u, w) => [p.x + p.cos * u - p.sin * w, p.y + 0.2, p.z + p.sin * u + p.cos * w];
      const L = G.longueurNitro / 2, Wn = G.largeurNitro / 2;
      const coins = [coin(-L, -Wn), coin(L, -Wn), coin(L, Wn), coin(-L, Wn)];
      for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], couleurs.nitro);
    }
    const s = GP.saut;
    c.ligne([s.depart.x, s.depart.y, s.depart.z], [s.arrivee.x, s.arrivee.y, s.arrivee.z], couleurs.saut);
    for (const b of [s.depart, s.arrivee]) c.ligne([b.x, b.y, b.z], [b.x, b.y + 6, b.z], couleurs.saut);
    return c.fin();
  }

  return { construire, rayonsX };
})();
