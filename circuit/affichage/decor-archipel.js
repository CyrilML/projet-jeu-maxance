// 🌊 LE DÉCOR DE L'ARCHIPEL : le bâtisseur de ponts et d'aéroports
//
// Étape 42. Il fabrique avec Three.js tout ce qui entoure la ville :
//   - la MER (une immense surface bleue dont les vaguelettes glissent doucement) et les ÎLES (avec une plage) ;
//   - les PONTS : la route monte en arc (la même formule que logique/archipel.js), avec des barrières,
//     des piles dans l'eau, deux grands pylônes et des câbles, comme un pont suspendu ;
//   - les AÉROPORTS : la piste et ses marques blanches, le tarmac, l'aérogare vitrée, la tour de contrôle,
//     les hangars, l'héliport et le parking. Chaque aéroport est construit UNE fois
//     dans son repère local (u, w), puis tourné et posé à sa place, comme dans logique/archipel.js ;
//   - les devantures des MAGASINS en ville (un auvent coloré, une enseigne, un tapis vert devant la porte).

window.Circuit = window.Circuit || {};

Circuit.DecorArchipel = (function () {
  const C = Circuit.CONFIG;
  const A = C.archipel;

  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }
  function plat(l, p, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, p), materiau);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  }
  function boite(l, h, p, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), materiau);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  // Une enseigne : un texte blanc sur fond coloré, peint sur une toile.
  function enseigne(texte, fond, largeur, hauteur) {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 96;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 256, 50, 490);
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.35, side: THREE.DoubleSide }));
  }

  // Une île : une grande boîte d'herbe (le dessus à y = 0) entourée d'une plage de sable.
  function ile(l, p, mat) {
    const g = new THREE.Group();
    const T = Circuit.Textures;
    g.add(boite(l + 24, 6, p + 24, mat({ map: repeter(T.sable(), (l + 24) / 10, (p + 24) / 10) }), 0, -3.05, 0));
    const herbe = boite(l, 6, p, mat({ map: repeter(T.herbe(), l / 12, p / 12) }), 0, -2.99, 0);
    g.add(herbe);
    return g;
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const AR = Circuit.Archipel;
    const mat = D.mat;
    const g = new THREE.Group();

    // 1. La mer.
    // Étape 48 : une mer qui bouge (des vagues dessinées par une « carte des pentes » qui glisse, affichage/eau.js).
    const mer = plat(16000, 16000, Circuit.Eau.materiau({ couleur: 0x1d5878, carte: repeter(T.mer(), 400, 400), repetition: 330, vitesse: 1 }), 0, A.mer, 0);
    g.add(mer);

    // 2. L'île de la ville (la ville est posée dessus), et les bouts de route jusqu'aux ponts.
    const iv = ile(2 * A.ileVille, 2 * A.ileVille, mat);
    iv.position.y = -0.05;
    g.add(iv);
    const goudron = mat({ map: repeter(T.goudron(), 4, 2), roughness: 0.85 });
    for (const p of AR.ponts) {
      const L = 30, cx = p.de[0] - p.ux * L / 2, cz = p.de[1] - p.uz * L / 2;
      const route = plat(L + 2, p.largeur - 2, goudron, cx, 0.025, cz);
      route.rotation.z = -p.angle;
      g.add(route);
    }

    // 3. Les ponts.
    for (const p of AR.ponts) g.add(pont(p, mat, T));

    // 4. Les aéroports.
    for (const ap of AR.aeroports) g.add(aeroport(ap, mat, T, AR));

    // 5. Les devantures des magasins de la ville.
    const couleurs = [0xd8332a, 0x2a7bd8, 0x2ab56a, 0xe08a1a];
    for (const m of AR.magasins) {
      if (m.aeroport) continue;
      const devanture = new THREE.Group();
      devanture.add(boite(1.6, 0.25, 9, mat({ color: couleurs[m.numero % 4] }), -0.3, 4.2, 0)); // l'auvent
      const nom = enseigne(m.nom.charAt(0).toUpperCase() + m.nom.slice(1), "#" + couleurs[m.numero % 4].toString(16).padStart(6, "0"), 9, 1.6);
      nom.position.set(-1.0, 5.6, 0);
      nom.rotation.y = Math.PI / 2;
      devanture.add(nom);
      devanture.add(boite(0.15, 3, 2.4, mat({ color: 0x3a2a1a }), -1.45, 1.5, 0)); // la porte
      devanture.add(plat(2.4, 3, mat({ color: 0x2ecc71, emissive: 0x0a4020 }), 0.6, 0.15, 0)); // le tapis : « entre ici ! »
      devanture.position.set(m.x, 0, m.z);
      devanture.rotation.y = -m.angle;
      g.add(devanture);
    }

    // Étape 45 : le commissariat (une enseigne POLICE bleue, et un gyrophare au-dessus de la porte).
    if (Circuit.Police) {
      const cp = Circuit.Police.commissariat;
      const devanture = new THREE.Group();
      devanture.add(boite(1.6, 0.25, 12, mat({ color: 0x1b3a8b }), -0.3, 4.2, 0));
      const nom = enseigne("🚓 POLICE", "#1b3a8b", 11, 2);
      nom.position.set(-1.0, 5.8, 0);
      nom.rotation.y = Math.PI / 2;
      devanture.add(nom);
      devanture.add(boite(0.15, 3, 2.4, mat({ color: 0x2a2a2a }), -1.45, 1.5, 0));
      devanture.add(boite(0.6, 0.4, 0.6, mat({ color: 0x1a5cff, emissive: 0x1a5cff, emissiveIntensity: 1.5 }), -0.8, 7.1, 0));
      devanture.position.set(cp.x, 0, cp.z);
      devanture.rotation.y = -cp.angle;
      g.add(devanture);
    }

    function maj() {
      // (étape 48 : les vagues de la mer bougent maintenant dans affichage/eau.js)
    }
    return { groupe: g, maj };
  }

  // ---------------------------------------------------------------- un pont suspendu
  function pont(p, mat, T) {
    const g = new THREE.Group();
    const AR = Circuit.Archipel;
    const n = 60, W = p.largeur / 2;
    const point = (u, w, dy) => [p.de[0] + p.ux * u - p.uz * w, AR.hauteurPont(p, u) + dy, p.de[1] + p.uz * u + p.ux * w];
    const dessus = { p: [], uv: [] }, cotes = { p: [], uv: [] };
    const quad = (liste, a, b, c, d, uv) => {
      liste.p.push(...a, ...b, ...c, ...a, ...c, ...d);
      liste.uv.push(uv[0], uv[1], uv[2], uv[1], uv[2], uv[3], uv[0], uv[1], uv[2], uv[3], uv[0], uv[3]);
    };
    for (let i = 0; i < n; i++) {
      const u1 = (i / n) * p.longueur, u2 = ((i + 1) / n) * p.longueur;
      quad(dessus, point(u1, -W, 0.03), point(u2, -W, 0.03), point(u2, W, 0.03), point(u1, W, 0.03), [u1 / 8, 0, u2 / 8, (2 * W) / 8]);
      for (const [w1, w2, h1, h2] of [[-W, -W, 0, -1.5], [W, W, -1.5, 0], [-W, W, -1.5, -1.5]]) quad(cotes, point(u1, w1, h1), point(u2, w1, h1), point(u2, w2, h2), point(u1, w2, h2), [u1 / 6, 0, u2 / 6, 1]);
    }
    const geo = (liste) => {
      const b = new THREE.BufferGeometry();
      b.setAttribute("position", new THREE.Float32BufferAttribute(liste.p, 3));
      b.setAttribute("uv", new THREE.Float32BufferAttribute(liste.uv, 2));
      b.computeVertexNormals();
      return b;
    };
    const route = new THREE.Mesh(geo(dessus), mat({ map: repeter(T.goudron(), 1, 1), roughness: 0.85, side: THREE.DoubleSide }));
    const beton = new THREE.Mesh(geo(cotes), mat({ map: repeter(T.beton(), 1, 1), side: THREE.DoubleSide }));
    route.receiveShadow = true;
    beton.castShadow = beton.receiveShadow = true;
    g.add(route, beton);

    // La ligne blanche du milieu, en tirets ; les barrières (des poteaux et une main courante).
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3();
    const tirets = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 0.04, 0.25), mat({ color: 0xf2f2f2 }), Math.floor(p.longueur / 8));
    const poteaux = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 1.1, 0.15), mat({ color: 0xc8c8c8, metalness: 0.6, roughness: 0.4 }), Math.floor(p.longueur / 4) * 2);
    let it = 0, ip = 0;
    const versAngle = (u) => Math.atan2(AR.hauteurPont(p, u + 1) - AR.hauteurPont(p, u - 1), 2);
    for (let u = 4; u < p.longueur; u += 8) {
      const [x, y, z] = point(u, 0, 0.06);
      q.setFromEuler(new THREE.Euler(0, -p.angle, versAngle(u), "YZX"));
      tirets.setMatrixAt(it++, m4.compose(new THREE.Vector3(x, y, z), q, e.set(1, 1, 1)));
    }
    for (let u = 2; u < p.longueur && ip < poteaux.count - 1; u += 4) {
      for (const w of [-W + 0.3, W - 0.3]) {
        const [x, y, z] = point(u, w, 0.55);
        poteaux.setMatrixAt(ip++, m4.compose(new THREE.Vector3(x, y, z), q.identity(), e.set(1, 1, 1)));
      }
    }
    tirets.count = it;
    poteaux.count = ip;
    g.add(tirets, poteaux);
    const rambarde = { p: [], uv: [] };
    for (let i = 0; i < n; i++) {
      const u1 = (i / n) * p.longueur, u2 = ((i + 1) / n) * p.longueur;
      for (const w of [-W + 0.3, W - 0.3]) quad(rambarde, point(u1, w, 1.0), point(u2, w, 1.0), point(u2, w, 1.15), point(u1, w, 1.15), [0, 0, 1, 1]);
    }
    g.add(new THREE.Mesh(geo(rambarde), mat({ color: 0xd04020, side: THREE.DoubleSide })));

    // Les piles dans l'eau, les 2 grands pylônes et les câbles.
    for (let u = 50; u < p.longueur - 20; u += 50) {
      const [x, y, z] = point(u, 0, -1.5);
      const pile = boite(5, y - A.mer, 4, mat({ map: repeter(T.beton(), 1, 2) }), x, (y + A.mer) / 2, z);
      pile.rotation.y = -p.angle;
      g.add(pile);
    }
    const rouge = mat({ color: 0xc0392b, roughness: 0.5 });
    const cables = [];
    for (const f of [0.25, 0.75]) {
      const u = f * p.longueur;
      for (const w of [-W - 0.8, W + 0.8]) {
        const [x, , z] = point(u, w, 0);
        const haut = AR.hauteurPont(p, u) + 34;
        g.add(boite(1.6, haut - A.mer, 1.6, rouge, x, (haut + A.mer) / 2, z));
      }
      const [x1, , z1] = point(u, -W - 0.8, 0), [x2, , z2] = point(u, W + 0.8, 0);
      const traverse = boite(1.2, 1.2, 2 * W + 2.8, rouge, (x1 + x2) / 2, AR.hauteurPont(p, u) + 30, (z1 + z2) / 2);
      traverse.rotation.y = -p.angle;
      g.add(traverse);
    }
    // Les câbles : du haut des pylônes jusqu'au tablier, en éventail.
    for (const w of [-W - 0.8, W + 0.8]) {
      for (const f of [0.25, 0.75]) {
        const u0 = f * p.longueur, haut = point(u0, w, 33);
        for (let k = -6; k <= 6; k++) {
          if (!k) continue;
          const u = u0 + k * 10;
          if (u < 2 || u > p.longueur - 2) continue;
          cables.push(haut, point(u, w, 1.2));
        }
      }
    }
    const lignes = new THREE.BufferGeometry();
    lignes.setAttribute("position", new THREE.Float32BufferAttribute(cables.flat(), 3));
    g.add(new THREE.LineSegments(lignes, new THREE.LineBasicMaterial({ color: 0xeeeeee })));
    return g;
  }

  // ---------------------------------------------------------------- un aéroport (dans son repère local u, w)
  function aeroport(ap, mat, T, AR) {
    const g = new THREE.Group();
    const P = AR.plan;
    const I = A.ile;
    const sol = ile(I.u[1] - I.u[0], I.w[1] - I.w[0], mat);
    sol.position.set((I.u[0] + I.u[1]) / 2, 0, (I.w[0] + I.w[1]) / 2);
    g.add(sol);
    // La route, le tarmac, la piste et ses marques.
    g.add(plat(P.route.longueur, P.route.largeur, mat({ map: repeter(T.goudron(), 15, 2), roughness: 0.85 }), P.route.u, 0.03, P.route.w));
    g.add(plat(P.tarmac.longueur, P.tarmac.largeur, mat({ map: repeter(T.beton(), 30, 12) }), P.tarmac.u, 0.02, P.tarmac.w));
    g.add(plat(P.piste.longueur, P.piste.largeur, mat({ map: repeter(T.goudron(), 70, 5), roughness: 0.8 }), P.piste.u, 0.03, P.piste.w));
    const blanc = mat({ color: 0xf4f4f4 });
    const marques = [];
    for (let u = -P.piste.longueur / 2 + 40; u < P.piste.longueur / 2 - 40; u += 30) marques.push([u, P.piste.w, 15, 1]);
    for (const bout of [-1, 1]) for (let k = -4; k <= 4; k++) marques.push([bout * (P.piste.longueur / 2 - 15), P.piste.w + k * 4.5, 20, 2]);
    const m4 = new THREE.Matrix4();
    const geoMarque = new THREE.PlaneGeometry(1, 1);
    geoMarque.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(geoMarque, blanc, marques.length);
    marques.forEach(([u, w, l, p], i) => im.setMatrixAt(i, m4.makeScale(l, 1, p).setPosition(u, 0.05, w)));
    g.add(im);
    // Le parking : des lignes blanches.
    for (let k = 0; k <= A.parking; k++) g.add(plat(0.25, 9, blanc, P.parking.u - P.parking.pas / 2 + k * P.parking.pas, 0.04, P.parking.w));
    // L'héliport : un rond avec un H.
    const toile = document.createElement("canvas");
    toile.width = toile.height = 128;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = "#3b3f46";
    ctx.beginPath();
    ctx.arc(64, 64, 63, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f2c81a";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 70px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("H", 64, 68);
    const texH = new THREE.CanvasTexture(toile);
    texH.colorSpace = THREE.SRGBColorSpace;
    const helipad = new THREE.Mesh(new THREE.CircleGeometry(P.heliport.rayon, 40), new THREE.MeshStandardMaterial({ map: texH, transparent: true }));
    helipad.rotation.x = -Math.PI / 2;
    helipad.position.set(P.heliport.u, 0.05, P.heliport.w);
    g.add(helipad);

    // Les bâtiments.
    for (const b of P.batiments) {
      if (b.sorte === "aerogare") {
        const verre = mat({ map: repeter(T.facade(3), b.l / 4, b.h / 3.5), metalness: 0.5, roughness: 0.3 });
        const toit = mat({ color: 0xdfe3e8 });
        g.add(boite(b.l, b.h, b.p, [verre, verre, toit, toit, verre, verre], b.u, b.h / 2, b.w));
        g.add(boite(b.l + 6, 1.2, b.p + 10, toit, b.u, b.h + 0.6, b.w - 3)); // l'avancée du toit
        const nom = enseigne("✈ AÉROPORT " + ap.numero, "#1b3a6b", 40, 6);
        nom.position.set(b.u, b.h - 4, b.w - b.p / 2 - 0.3);
        nom.rotation.y = Math.PI;
        g.add(nom);
        const boutique = enseigne("BOUTIQUE", "#d8332a", 12, 2.2);
        boutique.position.set(P.porte.u, 5, b.w - b.p / 2 - 0.4);
        boutique.rotation.y = Math.PI;
        g.add(boutique);
        g.add(plat(4, 4, mat({ color: 0x2ecc71, emissive: 0x0a4020 }), P.porte.u, 0.06, P.porte.w));
      } else if (b.sorte === "tour") {
        g.add(boite(6, b.h - 6, 6, mat({ map: repeter(T.beton(), 1, 4) }), b.u, (b.h - 6) / 2, b.w));
        g.add(boite(11, 5, 11, mat({ color: 0x223344, metalness: 0.6, roughness: 0.15 }), b.u, b.h - 3.5, b.w)); // la cabine vitrée
        g.add(boite(12, 0.8, 12, mat({ color: 0xdddddd }), b.u, b.h - 0.6, b.w));
      } else {
        // Un hangar : un demi-tube couché (l'axe du tube le long de u, la moitié du tube au-dessus du sol).
        const geo = new THREE.CylinderGeometry(b.p / 2, b.p / 2, b.l, 24, 1, false, 0, Math.PI);
        geo.rotateZ(Math.PI / 2);
        const hangar = new THREE.Mesh(geo, mat({ color: 0x9aa3ad, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide }));
        hangar.scale.set(1, b.h / (b.p / 2), 1);
        hangar.position.set(b.u, 0, b.w);
        hangar.castShadow = hangar.receiveShadow = true;
        g.add(hangar);
      }
    }
    // (Étape 44 : les avions et l'hélico garés sont maintenant de vrais véhicules : affichage/scene3d.js les dessine.)
    // Quelques arbres au bord de l'île.
    let etat = 7 + ap.numero;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const arbres = [];
    while (arbres.length < 60) {
      const u = I.u[0] + 15 + alea() * (I.u[1] - I.u[0] - 30), w = I.w[1] - 15 - alea() * 70;
      if (w < 270 && u > -330 && u < 330) continue;
      arbres.push([u, w, 0.8 + alea() * 0.6]);
    }
    g.add(Circuit.DecorCircuit.foret(arbres, "ville"));

    g.position.set(ap.x, 0, ap.z);
    g.rotation.y = -ap.angle;
    return g;
  }

  return { construire };
})();
