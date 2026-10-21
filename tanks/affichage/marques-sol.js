// 🐾 LES MARQUES SUR LE SOL : le tampon encreur du champ de bataille (demande 92, « le réalisme total »)
//
// ✍️ Maxance : « Le sol… les traces de chenilles derrière les tanks ; les cratères qui restent après les explosions. »
// Comme un tampon qu'on appuie sur une feuille :
//   - LES TRACES : tous les 0,9 m, chaque tank (et chaque camion, quad, moto, 4x4) « tamponne » derrière lui un petit
//     morceau de trace pour chacune de ses chenilles (ou de ses roues), avec les crampons dessinés dedans. Les morceaux
//     s'effacent doucement (en 2 minutes environ). Ils sont rangés dans une liste en ANNEAU : quand elle est pleine, on
//     réutilise le plus vieux morceau (comme les chaises musicales). Tous les morceaux = 1 seul dessin (des « instances »).
//   - LES CRATÈRES : quand un obus, une roquette, une grenade, une bombe… explose AU SOL (l'événement « impact » des
//     règles), un cratère brûlé reste : le centre noir, les traînées de terre projetée, et un petit bord de terre
//     relevé. La lumière fait croire qu'il est creusé (on « ment » sur la pente du sol : c'est une astuce des jeux).
//   - Une nouvelle bataille efface tout. Sous terre, il n'y a ni traces ni cratères (le décor du dehors est caché).
// Le nombre de traces et de cratères gardés dépend du niveau de qualité (config.js, realisme.sol.parNiveau).
// Comme tout l'affichage, il ne touche jamais au monde : il le lit, et il écoute la radio.

window.Tanks = window.Tanks || {};

Tanks.MarquesSol = (function () {
  const C = Tanks.CONFIG, RS = () => C.realisme.sol, T = Tanks.Terrain;
  const bilan = { traces: 0, tracesMax: 0, tracesFaites: 0, crateres: 0, crateresMax: 0, crateresFaits: 0, dureeTraces: 0 };
  let traces = null, crateres = null, horloge = 0;
  const temps = { value: 0 }, duree = { value: 120 };
  const derniers = new WeakMap(); // engin → là où il a tamponné sa dernière trace

  function canvas(taille, peindre) {
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  let etat = 92;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // L'image d'une trace : en haut, une chenille (des barres de crampons) ; en bas, un pneu (des chevrons). Le motif se
  // répète dans la longueur (x), les bords sont doux.
  function imageTrace() {
    const t = canvas(256, (ctx, n) => {
      ctx.clearRect(0, 0, n, n);
      const bande = (y0, h, crampons) => {
        for (let x = 0; x < n; x++) for (let y = 0; y < h; y++) {
          const v = y / h, bord = Math.min(1, Math.min(v, 1 - v) * 6);
          const a = bord * (crampons(x / n, v) ? 0.95 : 0.45) * (0.8 + hasard() * 0.3);
          ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")";
          ctx.fillRect(x, y0 + y, 1, 1);
        }
      };
      bande(0, 128, (u, v) => (u * 8) % 1 < 0.42 && v > 0.08 && v < 0.92); // la chenille : 8 crampons par image
      bande(128, 128, (u, v) => ((u * 6 + Math.abs(v - 0.5) * 1.2) % 1) < 0.4); // le pneu : des chevrons
    });
    t.wrapS = THREE.RepeatWrapping;
    return t;
  }
  // L'image d'un cratère (vu d'en haut) : le centre noir brûlé, la terre retournée, les traînées qui partent du centre.
  function imageCratere() {
    return canvas(256, (ctx, n) => {
      const c = n / 2;
      ctx.clearRect(0, 0, n, n);
      let g = ctx.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, "rgba(18,15,12,0.98)");
      g.addColorStop(0.35, "rgba(32,26,20,0.95)");
      g.addColorStop(0.62, "rgba(70,56,40,0.9)");
      g.addColorStop(0.8, "rgba(92,74,52,0.7)");
      g.addColorStop(1, "rgba(80,66,48,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, n, n);
      for (let i = 0; i < 70; i++) { // les traînées noires de l'explosion
        const a = hasard() * Math.PI * 2, l = c * (0.55 + hasard() * 0.45), w = 1 + hasard() * 4;
        ctx.strokeStyle = "rgba(15,12,10," + (0.15 + hasard() * 0.35) + ")";
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * c * 0.2, c + Math.sin(a) * c * 0.2);
        ctx.lineTo(c + Math.cos(a) * l, c + Math.sin(a) * l);
        ctx.stroke();
      }
      for (let i = 0; i < 260; i++) { // les mottes de terre projetées
        const a = hasard() * Math.PI * 2, d = c * (0.3 + Math.pow(hasard(), 0.6) * 0.65), r = 1 + hasard() * 3.5, v = 40 + hasard() * 60;
        ctx.fillStyle = "rgba(" + (v + 18) + "," + (v + 6) + "," + v + "," + (0.5 + hasard() * 0.5) + ")";
        ctx.beginPath();
        ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
  // La forme d'un cratère : un disque, avec un petit bord relevé (vers 78 % du rayon). Les « normales » (la pente que voit
  // la lumière) font croire à un creux au centre.
  function formeCratere() {
    const anneaux = [0, 0.2, 0.4, 0.55, 0.68, 0.78, 0.88, 1], n = 24, pos = [], nor = [], uv = [], idx = [];
    const haut = (r) => 0.13 * Math.exp(-Math.pow((r - 0.78) / 0.11, 2));
    const pente = (r) => { // la pente « vue par la lumière » : le creux (faux) + le bord (vrai)
      const e = 0.01, f = (x) => haut(x) - 0.4 * Math.max(0, 1 - Math.pow(x / 0.72, 2));
      return (f(r + e) - f(r - e)) / (2 * e);
    };
    for (const r of anneaux) for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), d = pente(r);
      pos.push(ca * r, haut(r), sa * r);
      const nn = new THREE.Vector3(-ca * d, 1, -sa * d).normalize();
      nor.push(nn.x, nn.y, nn.z);
      uv.push(0.5 + ca * r * 0.5, 0.5 + sa * r * 0.5);
    }
    for (let i = 0; i < anneaux.length - 1; i++) for (let k = 0; k < n; k++) {
      const a = i * (n + 1) + k, b = a + n + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  function construire(groupe) {
    const R = RS(), maxT = R.traces.max, maxC = R.crateres.max;
    // les traces : un carré à plat (1 m de long en x, 1 m de large en z), étiré pour chaque morceau
    const plan = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const nais = new THREE.InstancedBufferAttribute(new Float32Array(maxT).fill(-1e6), 1), info = new THREE.InstancedBufferAttribute(new Float32Array(maxT * 2), 2);
    plan.setAttribute("naissance", nais);
    plan.setAttribute("infoTrace", info); // (x : la longueur en m, pour répéter les crampons ; y : 0 = chenille, 1 = pneu)
    const mt = new THREE.MeshStandardMaterial({ color: new THREE.Color(R.traces.couleur), map: imageTrace(), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    mt.onBeforeCompile = (sh) => {
      sh.uniforms.maintenant = temps;
      sh.uniforms.dureeTrace = duree;
      sh.uniforms.forceTrace = { value: R.traces.force };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float naissance; attribute vec2 infoTrace; uniform float maintenant; uniform float dureeTrace; uniform float forceTrace; varying float vEfface;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\nvMapUv = vec2(vMapUv.x * infoTrace.x * 1.6, vMapUv.y * 0.5 + infoTrace.y * 0.5);\nfloat age = maintenant - naissance;\nvEfface = forceTrace * (1.0 - smoothstep(dureeTrace * 0.55, dureeTrace, age)) * step(0.0, age);");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vEfface;")
        .replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor = vec4(diffuse, diffuseColor.a * vEfface);");
    };
    traces = new THREE.InstancedMesh(plan, mt, maxT);
    traces.count = 0;
    traces.frustumCulled = false;
    traces.receiveShadow = true;
    traces.renderOrder = 1;
    traces.userData.prochain = 0;
    const mc = new THREE.MeshStandardMaterial({ map: imageCratere(), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
    crateres = new THREE.InstancedMesh(formeCratere(), mc, maxC);
    crateres.count = 0;
    crateres.frustumCulled = false;
    crateres.receiveShadow = true;
    crateres.renderOrder = 1;
    crateres.userData.prochain = 0;
    groupe.add(traces, crateres);
    bilan.tracesMax = maxT;
    bilan.crateresMax = maxC;
    // les cratères : on écoute les explosions au sol ; une nouvelle bataille efface tout
    Tanks.Evenements.ecouter("impact", (d) => {
      if (d.sur !== "sol" || T.souterrain || T.dansLEau(d.x, d.z)) return;
      const rayon = R.crateres.rayons[d.sorte] || (d.grenade ? R.crateres.rayons.grenade : 0);
      if (rayon) cratere(d.x, d.z, rayon * (0.85 + hasard() * 0.3));
    });
    Tanks.Evenements.ecouter("bataille", effacer);
  }
  function effacer() {
    if (!traces) return;
    traces.count = crateres.count = traces.userData.prochain = crateres.userData.prochain = 0;
    traces.geometry.attributes.naissance.array.fill(-1e6);
    traces.geometry.attributes.naissance.needsUpdate = true;
    bilan.traces = bilan.crateres = 0;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qL = new THREE.Quaternion(), p3 = new THREE.Vector3(), e3 = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0), n3 = new THREE.Vector3();
  let limiteCrateres = 0, limiteTraces = 0;
  function poser(im, limite, x, z, angle, lx, lz, y) { // (le prochain morceau de l'anneau : on remplace le plus vieux)
    const i = im.userData.prochain % Math.max(1, limite);
    im.userData.prochain = i + 1;
    im.count = Math.min(limite, Math.max(im.count, i + 1));
    const n = T.normale(x, z);
    q.setFromUnitVectors(haut, n3.set(n.x, n.y, n.z)).multiply(qL.setFromAxisAngle(haut, -angle));
    im.setMatrixAt(i, m4.compose(p3.set(x, T.hauteur(x, z) + (y || 0.04), z), q, e3.set(lx, (lx + lz) / 2, lz)));
    im.instanceMatrix.needsUpdate = true;
    return i;
  }
  function cratere(x, z, r) {
    if (!crateres || !limiteCrateres) return;
    poser(crateres, limiteCrateres, x, z, hasard() * Math.PI * 2, r, r, 0.03);
    bilan.crateres = crateres.count;
    bilan.crateresFaits++;
  }
  function trace(x, z, angle, longueur, largeur, pneu) {
    const i = poser(traces, limiteTraces, x, z, angle, longueur, largeur, 0.04);
    const g = traces.geometry.attributes;
    g.naissance.array[i] = horloge;
    g.infoTrace.array[i * 2] = longueur;
    g.infoTrace.array[i * 2 + 1] = pneu ? 1 : 0;
    g.naissance.needsUpdate = g.infoTrace.needsUpdate = true;
    bilan.tracesFaites++;
  }

  // À chaque image : qui a roulé assez pour laisser un nouveau morceau de trace ?
  function maj(dt, monde, camera) {
    if (!traces) return;
    horloge += dt;
    temps.value = horloge;
    const R = RS(), P = R.parNiveau, n = Tanks.Qualite.niveau;
    limiteCrateres = Math.min(R.crateres.max, P.crateres[n]);
    limiteTraces = Math.min(R.traces.max, P.traces[n]);
    duree.value = P.tracesDuree[n] || 1;
    bilan.dureeTraces = P.tracesDuree[n];
    crateres.count = Math.min(crateres.count, limiteCrateres);
    traces.visible = limiteTraces > 0;
    traces.count = Math.min(traces.count, limiteTraces);
    bilan.traces = traces.count;
    bilan.crateres = crateres.count;
    if (!limiteTraces || T.souterrain || !monde) return;
    const loin = P.tracesLoin[n], E = R.traces.engins;
    const roule = (v, sorte, largeurCaisse) => {
      if (v.detruit || v.enVol) return;
      const d = Math.hypot(v.x - camera.x, v.z - camera.z);
      const avant = derniers.get(v);
      if (!avant || d > loin || Math.abs(v.y - T.hauteur(v.x, v.z)) > 0.6 || T.dansLEau(v.x, v.z)) return void derniers.set(v, { x: v.x, z: v.z });
      const l = Math.hypot(v.x - avant.x, v.z - avant.z);
      if (l < R.traces.pas) return;
      if (l > 6) return void derniers.set(v, { x: v.x, z: v.z }); // (un saut : un portail…)
      const [largeur, ecart0] = E[sorte], ecart = ecart0 === null ? largeurCaisse - largeur * 1.2 : ecart0;
      const angle = Math.atan2(v.z - avant.z, v.x - avant.x), mx = (v.x + avant.x) / 2, mz = (v.z + avant.z) / 2;
      const cx = -Math.sin(angle) * ecart / 2, cz = Math.cos(angle) * ecart / 2;
      for (const sens of ecart > 0 ? [-1, 1] : [0]) trace(mx + cx * sens, mz + cz * sens, angle, l + 0.08, largeur, sorte !== "char");
      derniers.set(v, { x: v.x, z: v.z });
    };
    for (const c of monde.chars) roule(c, "char", c.fiche.largeur);
    for (const v of monde.vehicules || []) if (E[v.sorte]) roule(v, v.sorte);
    for (const e of monde.engins) if (e.sorte === "jeep") roule(e, "jeep");
  }

  return { construire, maj, effacer, bilan };
})();
