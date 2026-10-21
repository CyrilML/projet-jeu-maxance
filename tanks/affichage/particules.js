// ✨ LES PARTICULES : l'imprimerie à autocollants (demande 92)
//
// ✍️ « Refais un réalisme total : les tirs, les balles, tout ce que tu veux. » La fumée, le feu, les étincelles, les
// balles traçantes, la terre qui gicle… sont des AUTOCOLLANTS : des petits carrés tournés vers la caméra, sur lesquels
// on colle une image (une bouffée de fumée, une flamme, un trait de lumière…). Cette imprimerie :
//   1. PEINT une seule fois, au chargement, une PLANCHE de 16 images (4 × 4) avec du « bruit » (comme les nuages du
//      ciel) : 3 fumées, de la poussière, 4 flammes (on les fait défiler : le feu bouge !), un trait, une étoile (le
//      départ du coup), un anneau, une motte de terre, des gouttes, une lueur, un éclat de bois, une flamme de canon ;
//   2. range TOUS les autocollants dans 2 objets seulement (des « instances ») : ceux qui cachent (la fumée, la terre) et
//      ceux qui BRILLENT (le feu, les étincelles, les traceuses : leur lumière s'AJOUTE à l'image). 2 dessins pour
//      tous, même s'il y en a 2 000 ;
//   3. les fait vivre : ils naissent, volent (la gravité, l'air qui freine, la fumée chaude qui monte, le vent),
//      grandissent, changent de couleur (le feu passe du blanc au jaune, à l'orange, au rouge sombre) et s'effacent ;
//   4. éclaire la fumée avec le soleil : le côté tourné vers le soleil est plus clair (une fausse boule, calculée dans
//      la carte graphique) : c'est ce qui la rend « en volume » ;
//   5. prête quelques VRAIES LUMIÈRES (3, toujours les mêmes : en ajouter ou en enlever obligerait la carte graphique
//      à tout recalculer) aux éclairs les plus proches de la caméra ;
//   6. lance des CAILLOUX en 3D (une seule forme recopiée : 1 dessin) qui retombent et rebondissent.
// Combien d'autocollants, de cailloux et de lumières : selon le niveau de qualité (config.js, « realisme.tirs »).
// Comme tout l'affichage, il ne touche jamais au monde.

window.Tanks = window.Tanks || {};

Tanks.Particules = (function () {
  const C = Tanks.CONFIG, R = C.realisme.tirs;
  const MAX = Math.max(...R.particules), UNE_FOIS = 400, MAX_DEBRIS = Math.max(...R.debris3d);
  // Les images de la planche (4 × 4)
  const IMG = { fumee: 0, fumee2: 1, fumee3: 2, poussiere: 3, flamme: 4, trait: 8, etoile: 9, anneau: 10, motte: 11, gouttes: 12, lueur: 13, eclat: 14, bouche: 15 };
  // Les façons de poser un autocollant : face à la caméra, en TRAIT (étiré le long d'une direction), À PLAT sur le sol.
  const FACE = 0, TRAIT = 1, PLAT = 2;
  let scene = null, planche = null, lots = null, niveau = 1, distance = 300, camObjet = null;
  const camera = { x: 0, y: 0, z: 0 }, vent = { x: 0, z: 0 };
  // Chaque autocollant vivant : des cases dans de grands tableaux de nombres (plus rapide que 2 000 petits objets).
  const X = new Float32Array(MAX), Y = new Float32Array(MAX), Z = new Float32Array(MAX);
  const VX = new Float32Array(MAX), VY = new Float32Array(MAX), VZ = new Float32Array(MAX);
  const AGE = new Float32Array(MAX), VIE = new Float32Array(MAX), T0 = new Float32Array(MAX), T1 = new Float32Array(MAX);
  const ROUGE = new Float32Array(MAX), VERT = new Float32Array(MAX), BLEU = new Float32Array(MAX), OP = new Float32Array(MAX);
  const ROT = new Float32Array(MAX), VROT = new Float32Array(MAX), SOL = new Float32Array(MAX), DEPART = new Float32Array(MAX);
  const AX = new Float32Array(MAX), AY = new Float32Array(MAX), AZ = new Float32Array(MAX); // (un trait : sa direction et sa longueur)
  const MODELE = new Array(MAX).fill(null);
  const libres = new Int32Array(MAX), actifs = new Int32Array(MAX);
  let nLibres = 0, nActifs = 0;
  const bilan = { vivantes: 0, max: 0, perdues: 0, tropLoin: 0, brillent: 0, cachent: 0, uneFois: 0, cailloux: 0, caillouxMax: 0, lumieres: 0, lumieresMax: 0, lumieresPosees: R.lumieresPosees, demandesLumiere: 0 };

  // ------------------------------------------------------------------ 1. la planche d'images (peinte une fois)
  // Le « bruit » : des valeurs au hasard sur un quadrillage, mélangées en douceur ; plusieurs couches de plus en plus
  // fines (« fbm ») donnent des formes de nuage.
  function hache(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function bruit(x, y, s) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hache(xi, yi, s), b = hache(xi + 1, yi, s), c = hache(xi, yi + 1, s), d = hache(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s, n) {
    let t = 0, a = 0.5, somme = 0;
    for (let k = 0; k < n; k++) (t += bruit(x, y, s + k * 17) * a), (somme += a), (x *= 2.03), (y *= 2.03), (a *= 0.5);
    return t / somme;
  }
  const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  function peindrePlanche() {
    const N = 128, toile = document.createElement("canvas");
    toile.width = toile.height = N * 4;
    const g = toile.getContext("2d"), img = g.createImageData(N * 4, N * 4), d = img.data;
    // une image = une fonction (u, v entre -1 et 1) → [gris, transparence] (le gris sert de « relief »)
    const images = [];
    const fumee = (graine, fin) => (u, v) => {
      const r = Math.hypot(u, v), n = fbm(u * 2.2 + 7, v * 2.2 + 3, graine, 5), r2 = r + (n - 0.5) * 0.75;
      const a = lisse(1, 0.18, r2) * (0.55 + 0.6 * fbm(u * fin, v * fin, graine + 5, 4));
      return [0.78 + 0.3 * n - 0.15 * r, Math.min(1, a * 1.15)];
    };
    images[IMG.fumee] = fumee(11, 4);
    images[IMG.fumee2] = fumee(23, 5);
    images[IMG.fumee3] = fumee(37, 3.5);
    images[IMG.poussiere] = (u, v) => {
      const r = Math.hypot(u, v), n = fbm(u * 3 + 1, v * 3 + 9, 51, 5), grain = fbm(u * 14, v * 14, 53, 2);
      return [0.85 + 0.2 * n, Math.pow(lisse(1, 0, r + (n - 0.5) * 0.6), 1.6) * (0.45 + 0.4 * n + 0.3 * grain)];
    };
    for (let k = 0; k < 4; k++) images[IMG.flamme + k] = (u, v) => {
      // une boule de feu « bouillonnante » : un rond déformé par le bruit, plus chaud au cœur, avec des langues de feu
      const r = Math.hypot(u, v), n = fbm(u * 2.6 + k * 1.7, v * 2.6 - k * 1.1, 70 + k, 5), m = fbm(u * 6 - k, v * 6 + k * 0.5, 90 + k, 3);
      const r2 = r + (n - 0.5) * 0.85 - (v < 0 ? v * 0.15 : 0);
      const coeur = lisse(0.95, 0.05, r2), chaud = coeur * (0.55 + 0.7 * m);
      return [Math.min(1, 0.35 + chaud), Math.min(1, coeur * (0.6 + 0.6 * m) * 1.2)];
    };
    images[IMG.trait] = (u, v) => [1, Math.exp(-(v * v) / 0.06) * lisse(1, 0.55, Math.abs(u)) * (0.75 + 0.25 * Math.exp(-(v * v) / 0.01))];
    images[IMG.etoile] = (u, v) => {
      // le départ du coup vu de face : un cœur blanc et 4 à 5 pointes de flamme irrégulières
      const r = Math.hypot(u, v), a = Math.atan2(v, u), n = fbm(a * 2 + 3, r * 3, 111, 3);
      const pointes = Math.pow(Math.abs(Math.cos(a * 2.5 + 0.4)), 10) * (0.6 + 0.8 * n);
      const forme = Math.exp(-r * r * 14) + pointes * lisse(1, 0.1, r) * 0.9 + lisse(0.6, 0.0, r + (n - 0.5) * 0.5) * 0.5;
      return [Math.min(1, 0.6 + forme), Math.min(1, forme)];
    };
    images[IMG.anneau] = (u, v) => {
      const r = Math.hypot(u, v), n = fbm(Math.atan2(v, u) * 3 + 2, r * 4, 131, 4);
      return [0.9 + 0.1 * n, Math.exp(-Math.pow(r - 0.78 + (n - 0.5) * 0.12, 2) / 0.012) * (0.45 + 0.6 * n) + lisse(0.85, 0, r) * 0.12];
    };
    images[IMG.motte] = (u, v) => {
      // un caillou / une motte : une forme dure et bosselée, éclairée d'en haut à gauche
      const r = Math.hypot(u, v), a = Math.atan2(v, u), n = fbm(Math.cos(a) * 1.5 + 4, Math.sin(a) * 1.5, 151, 3), g2 = fbm(u * 8, v * 8, 157, 3);
      const bord = 0.55 + (n - 0.5) * 0.55;
      return [0.45 + 0.4 * Math.max(0, -u * 0.6 - v * 0.6 + 0.3) + 0.3 * g2, lisse(bord + 0.06, bord - 0.02, r)];
    };
    images[IMG.gouttes] = (u, v) => {
      let a = 0;
      for (let k = 0; k < 14; k++) {
        const cx = (hache(k, 1, 171) - 0.5) * 1.5, cy = (hache(k, 2, 171) - 0.5) * 1.5, rr = 0.05 + hache(k, 3, 171) * 0.13;
        a = Math.max(a, lisse(rr, rr * 0.4, Math.hypot(u - cx, v - cy)));
      }
      return [1, a * 0.95 + lisse(1, 0.1, Math.hypot(u, v)) * 0.12];
    };
    images[IMG.lueur] = (u, v) => { const r2 = u * u + v * v; return [1, Math.exp(-r2 * 5) * 0.9 + Math.exp(-r2 * 30) * 0.4]; };
    images[IMG.eclat] = (u, v) => {
      const n = fbm(u * 5, 2, 191, 3), demi = 0.16 * (1 - Math.abs(u)) * (0.6 + 0.8 * n);
      return [0.5 + 0.5 * (v < 0 ? 1 : 0.6) * (0.7 + 0.4 * fbm(u * 20, v * 3, 193, 2)), lisse(demi + 0.03, demi, Math.abs(v)) * lisse(1, 0.9, Math.abs(u))];
    };
    images[IMG.bouche] = (u, v) => {
      // la flamme vue de côté : elle part du canon (u = -1) et s'effile vers l'avant, déchirée par le bruit
      const t = (u + 1) / 2, n = fbm(u * 3 + 5, v * 4, 211, 4), large = 0.55 * Math.pow(1 - t, 0.55) * (0.5 + 0.9 * n) + 0.04;
      const a = lisse(large, large * 0.3, Math.abs(v)) * lisse(1, 0.75, t) * lisse(-0.02, 0.06, t);
      return [Math.min(1, 0.55 + 0.6 * (1 - t) * n + 0.3 * Math.exp(-(v * v) / 0.02)), a];
    };
    for (let k = 0; k < 16; k++) {
      const f = images[k], ox = (k % 4) * N, oy = Math.floor(k / 4) * N;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const u = ((i + 0.5) / N) * 2 - 1, v = ((j + 0.5) / N) * 2 - 1;
        const [gris, a] = f ? f(u, v) : [1, 0];
        const o = ((oy + j) * N * 4 + ox + i) * 4, bord = i < 2 || j < 2 || i > N - 3 || j > N - 3; // (le bord de chaque case : transparent)
        d[o] = d[o + 1] = d[o + 2] = Math.round(Math.max(0, Math.min(1, gris)) * 255);
        d[o + 3] = bord ? 0 : Math.round(Math.max(0, Math.min(1, a)) * 255);
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(toile);
    t.flipY = false;
    t.colorSpace = THREE.NoColorSpace;
    t.anisotropy = 2;
    return t;
  }

  // ------------------------------------------------------------------ 2. les deux objets qui dessinent tout
  const uniformesCommunes = { soleilVue: { value: new THREE.Vector3(0, 1, 0) }, couleurSoleil: { value: new THREE.Color(0.8, 0.75, 0.65) }, couleurCiel: { value: new THREE.Color(0.5, 0.55, 0.62) } };
  function lot(brille) {
    const n = MAX + UNE_FOIS, carre = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = carre.index;
    geo.setAttribute("position", carre.attributes.position);
    const attribut = (k) => new THREE.InstancedBufferAttribute(new Float32Array(n * k), k).setUsage(THREE.DynamicDrawUsage);
    const centres = attribut(3), axes = attribut(3), teintes = attribut(4), params = attribut(4);
    geo.setAttribute("centre", centres);
    geo.setAttribute("axe", axes);
    geo.setAttribute("teinte", teintes);
    geo.setAttribute("params", params);
    geo.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uniformesCommunes, { planche: { value: planche }, additif: { value: brille ? 1 : 0 } }),
      fog: true, transparent: true, depthWrite: false, blending: brille ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: [
        "attribute vec3 centre; attribute vec3 axe; attribute vec4 teinte; attribute vec4 params;",
        "varying vec4 vTeinte; varying vec2 vUv; varying vec2 vTourne; varying vec2 vCase; varying float vEclaire;",
        "#include <fog_pars_vertex>",
        "void main() {",
        "  float taille = params.x, angle = params.y, image = params.z, mode = params.w;",
        "  vEclaire = step(3.5, mode); mode -= 4.0 * vEclaire;", // (mode + 4 : une fumée éclairée par le soleil)
        "  vec2 c = position.xy; vUv = c + 0.5; vTeinte = teinte;",
        "  float co = cos(angle), si = sin(angle);",
        "  vec2 t = vec2(c.x * co - c.y * si, c.x * si + c.y * co); vTourne = t;",
        "  vec4 mvPosition;",
        "  if (mode > 1.5) {", // À PLAT sur le sol (un anneau, une onde)
        "    mvPosition = modelViewMatrix * vec4(centre + vec3(t.x * taille, 0.0, t.y * taille), 1.0);",
        "  } else if (mode > 0.5) {", // un TRAIT : du centre jusqu'à centre + axe, large de « taille », tourné vers la caméra
        "    vec3 a = (modelViewMatrix * vec4(centre, 1.0)).xyz, b = (modelViewMatrix * vec4(centre + axe, 1.0)).xyz;",
        "    vec3 m = mix(a, b, c.x + 0.5), cote = cross(b - a, m); float l = length(cote);",
        "    cote = l > 1e-6 ? cote / l : vec3(0.0, 1.0, 0.0);",
        "    mvPosition = vec4(m + cote * c.y * taille, 1.0);",
        "  } else {", // FACE à la caméra
        "    mvPosition = modelViewMatrix * vec4(centre, 1.0); mvPosition.xy += t * taille;",
        "  }",
        "  vCase = vec2(mod(image, 4.0), floor(image / 4.0 + 0.01));",
        "  gl_Position = projectionMatrix * mvPosition;",
        "  #include <fog_vertex>",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D planche; uniform vec3 soleilVue; uniform vec3 couleurSoleil; uniform vec3 couleurCiel; uniform float additif;",
        "varying vec4 vTeinte; varying vec2 vUv; varying vec2 vTourne; varying vec2 vCase; varying float vEclaire;",
        "#include <fog_pars_fragment>",
        "void main() {",
        "  vec4 img = texture2D(planche, (vCase + clamp(vUv, 0.012, 0.988)) * 0.25);",
        "  vec3 couleur = vTeinte.rgb * img.rgb; float a = img.a * vTeinte.a;",
        "  if (vEclaire > 0.5) {", // la fausse boule : sa « normale » vient de la place du point sur le carré
        "    vec2 q = vTourne * 1.6; vec3 n = normalize(vec3(q, sqrt(max(0.0, 1.0 - dot(q, q))) + 0.35));",
        "    couleur *= couleurCiel + couleurSoleil * clamp(dot(n, soleilVue) * 0.75 + 0.25, 0.0, 1.0);",
        "  }",
        "  if (a < 0.004) discard;",
        "  gl_FragColor = vec4(couleur, a);",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "  #ifdef USE_FOG",
        "    float f = smoothstep(fogNear, fogFar, vFogDepth);",
        "    if (additif > 0.5) gl_FragColor.a *= 1.0 - f; else gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, f);", // (le feu s'éteint dans la brume)
        "  #endif",
        "}",
      ].join("\n"),
    });
    const objet = new THREE.Mesh(geo, mat);
    objet.frustumCulled = false;
    objet.renderOrder = brille ? 5 : 4;
    objet.name = brille ? "particules qui brillent" : "particules qui cachent";
    scene.add(objet);
    return { objet, geo, centres, axes, teintes, params, n: 0, pret: false };
  }

  // ------------------------------------------------------------------ 5. les vraies lumières (prêtées aux plus proches)
  const lumieres = [];
  // ------------------------------------------------------------------ 6. les cailloux en 3D
  let cailloux = null;
  const CAI = { x: new Float32Array(MAX_DEBRIS), y: new Float32Array(MAX_DEBRIS), z: new Float32Array(MAX_DEBRIS), vx: new Float32Array(MAX_DEBRIS), vy: new Float32Array(MAX_DEBRIS), vz: new Float32Array(MAX_DEBRIS),
    rx: new Float32Array(MAX_DEBRIS), ry: new Float32Array(MAX_DEBRIS), vr: new Float32Array(MAX_DEBRIS), t: new Float32Array(MAX_DEBRIS), age: new Float32Array(MAX_DEBRIS), vie: new Float32Array(MAX_DEBRIS), sol: new Float32Array(MAX_DEBRIS), vivant: new Uint8Array(MAX_DEBRIS) };
  let prochainCaillou = 0;

  function initialiser(s) {
    scene = s;
    planche = peindrePlanche();
    lots = [lot(false), lot(true)];
    for (let i = MAX - 1; i >= 0; i--) libres[nLibres++] = i;
    for (let k = 0; k < R.lumieresPosees; k++) {
      const l = new THREE.PointLight(0xffa050, 0, 30, 2);
      l.castShadow = false;
      scene.add(l);
      lumieres.push({ l, force: 0, duree: 1, age: 1, scintille: false, score: 0, x: 0, y: 0, z: 0 });
    }
    cailloux = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0.05, flatShading: true }), MAX_DEBRIS);
    cailloux.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    cailloux.setColorAt(0, new THREE.Color(1, 1, 1));
    cailloux.count = 0;
    cailloux.frustumCulled = false;
    cailloux.castShadow = false;
    cailloux.name = "cailloux qui volent";
    scene.add(cailloux);
  }

  // Les couleurs de la lumière du jour (la scène les donne) : la fumée en a besoin pour être éclairée comme le reste.
  const soleilMonde = new THREE.Vector3(0, 1, 0);
  function eclairage(direction, soleil, ciel) {
    soleilMonde.copy(direction).normalize();
    uniformesCommunes.couleurSoleil.value.copy(soleil);
    uniformesCommunes.couleurCiel.value.copy(ciel);
  }

  // ------------------------------------------------------------------ 3. faire naître un autocollant
  // M : son MODÈLE (ce qui ne change pas : son image, comment il bouge, brille…) ; (x, y, z) : où ; (vx, vy, vz) : sa
  // vitesse ; k : sa taille (× celle du modèle) ; couleur : [r, v, b] (sinon celle du modèle) ; vie : × sa durée.
  // Le modèle : { image, images (combien d'images qui défilent), mode, brille, eclaire, vie, taille: [début, fin],
  //   tourne, opacite, entree, sortie, gravite, frein, monte, vent, rebond, couleurs: [[r,v,b], …] (au fil de sa vie),
  //   etire (s : un trait le long de sa vitesse), longueur (m : un trait qui grandit jusqu'à « longueur »), portee }
  function emettre(M, x, y, z, vx, vy, vz, k, couleur, vie) {
    const dx = x - camera.x, dy = y - camera.y, dz = z - camera.z, loin = distance * (M.portee || 1);
    if (dx * dx + dy * dy + dz * dz > loin * loin) return void bilan.tropLoin++;
    if (nLibres === 0 || nActifs >= R.particules[niveau]) return void bilan.perdues++;
    const i = libres[--nLibres];
    actifs[nActifs++] = i;
    MODELE[i] = M;
    X[i] = x; Y[i] = y; Z[i] = z; VX[i] = vx; VY[i] = vy; VZ[i] = vz;
    AGE[i] = 0;
    VIE[i] = M.exacte ? vie : M.vie * (vie || 1) * (0.8 + Math.random() * 0.4); // (« exacte » : une traceuse vit pile le temps d'arriver)
    const t = k || 1;
    T0[i] = M.taille[0] * t; T1[i] = M.taille[1] * t;
    const c = couleur || M.couleur || BLANC;
    ROUGE[i] = c[0]; VERT[i] = c[1]; BLEU[i] = c[2];
    OP[i] = 1;
    ROT[i] = Math.random() * Math.PI * 2;
    VROT[i] = (Math.random() * 2 - 1) * (M.tourne || 0);
    SOL[i] = M.rebond !== undefined ? Tanks.Terrain.hauteur(x, z) : -1e9;
    DEPART[i] = Math.floor(Math.random() * (M.images || 1));
    AX[i] = AY[i] = AZ[i] = 0;
    return i;
  }
  const BLANC = [1, 1, 1];
  // Un trait fixe, posé de (x, y, z) dans la direction (ax, ay, az) (sa longueur comprise), pour cette image seulement
  // (le traceur d'un obus qui vole, la flamme d'un canon…).
  const uneFois = [];
  function dessinerUneFois(M, x, y, z, ax, ay, az, taille, couleur, opacite) {
    if (uneFois.length >= UNE_FOIS) return;
    const dx = x - camera.x, dy = y - camera.y, dz = z - camera.z, loin = distance * (M.portee || 1);
    if (dx * dx + dy * dy + dz * dz > loin * loin) return;
    uneFois.push(M, x, y, z, ax, ay, az, taille, couleur, opacite === undefined ? 1 : opacite);
  }
  // Changer la longueur d'un trait qui grandit (× la « longueur » de son modèle).
  function allonger(i, k) {
    if (i !== undefined) AX[i] = k;
  }

  // ------------------------------------------------------------------ 5. une lumière, pour un instant
  // Elle va à l'une des lumières posées : une libre, ou celle qui compte le moins (loin de la caméra, presque éteinte).
  function lumiere(x, y, z, couleur, force, portee, duree, scintille) {
    bilan.demandesLumiere++;
    const max = Math.min(lumieres.length, R.lumieres[niveau]);
    const d2 = (x - camera.x) ** 2 + (y - camera.y) ** 2 + (z - camera.z) ** 2;
    const score = force / (1 + d2 / 400);
    let choix = null;
    for (let k = 0; k < max; k++) {
      const L = lumieres[k], reste = L.age >= L.duree ? 0 : L.score * (1 - L.age / L.duree);
      if (!choix || reste < choix.reste) choix = { L, reste };
    }
    if (!choix || choix.reste > score) return false;
    const L = choix.L;
    L.l.position.set(x, y, z);
    L.l.color.set(couleur);
    L.l.distance = portee;
    Object.assign(L, { force, duree, age: 0, scintille: !!scintille, score, x, y, z });
    return true;
  }

  // ------------------------------------------------------------------ 6. un caillou en 3D
  const couleurCaillou = new THREE.Color();
  function caillou(x, y, z, vx, vy, vz, taille, couleur, vie) {
    const max = R.debris3d[niveau];
    if (!cailloux || max <= 0) return;
    if ((x - camera.x) ** 2 + (z - camera.z) ** 2 > distance * distance) return;
    let i = -1;
    for (let k = 0; k < max; k++) {
      const j = (prochainCaillou + k) % max;
      if (!CAI.vivant[j]) { i = j; break; }
    }
    if (i < 0) i = prochainCaillou % max; // (plus de place : on reprend le plus vieux)
    prochainCaillou = (i + 1) % max;
    CAI.x[i] = x; CAI.y[i] = y; CAI.z[i] = z; CAI.vx[i] = vx; CAI.vy[i] = vy; CAI.vz[i] = vz;
    CAI.rx[i] = Math.random() * 6; CAI.ry[i] = Math.random() * 6; CAI.vr[i] = (Math.random() * 2 - 1) * 14;
    CAI.t[i] = taille; CAI.age[i] = 0; CAI.vie[i] = vie || 5; CAI.sol[i] = Tanks.Terrain.hauteur(x, z); CAI.vivant[i] = 1;
    cailloux.setColorAt(i, couleurCaillou.setRGB(couleur[0], couleur[1], couleur[2]));
    cailloux.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ chaque image
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), soleilVue = new THREE.Vector3();
  function maj(dt, cam, distanceEffets, ventIci) {
    niveau = Tanks.Qualite ? Tanks.Qualite.niveau : 1;
    if (cam) (camera.x = cam.position.x), (camera.y = cam.position.y), (camera.z = cam.position.z), (camObjet = cam);
    if (distanceEffets) distance = distanceEffets;
    if (ventIci) (vent.x = ventIci[0]), (vent.z = ventIci[1]);
    if (cam) uniformesCommunes.soleilVue.value.copy(soleilVue.copy(soleilMonde).transformDirection(cam.matrixWorldInverse));
    // les autocollants vivants : ils vieillissent, bougent, et on les range dans leur lot
    lots[0].n = lots[1].n = 0;
    let n = 0;
    for (let a = 0; a < nActifs; a++) {
      const i = actifs[a], M = MODELE[i];
      AGE[i] += dt;
      if (AGE[i] >= VIE[i]) {
        libres[nLibres++] = i;
        MODELE[i] = null;
        continue;
      }
      actifs[n++] = i;
      const t = AGE[i] / VIE[i];
      // la gravité, la poussée de l'air chaud (qui faiblit), l'air qui freine, le vent
      VY[i] += (-(M.gravite || 0) + (M.monte || 0) * (1 - t)) * dt;
      const frein = Math.exp(-(M.frein || 0) * dt);
      VX[i] *= frein; VY[i] *= M.gravite ? 1 : frein; VZ[i] *= frein;
      if (M.vent) (VX[i] += (vent.x - VX[i]) * M.vent * dt), (VZ[i] += (vent.z - VZ[i]) * M.vent * dt);
      X[i] += VX[i] * dt; Y[i] += VY[i] * dt; Z[i] += VZ[i] * dt;
      if (Y[i] < SOL[i]) { // (un morceau qui retombe : il rebondit un peu, puis s'arrête)
        Y[i] = SOL[i];
        VY[i] = -VY[i] * M.rebond;
        VX[i] *= 0.45; VZ[i] *= 0.45;
        VROT[i] *= 0.5;
      }
      ROT[i] += VROT[i] * dt;
      ranger(lots[M.brille ? 1 : 0], M, i, t);
    }
    nActifs = n;
    // ceux qui ne vivent qu'une image
    bilan.uneFois = uneFois.length / 10;
    for (let k = 0; k < uneFois.length; k += 10) {
      const M = uneFois[k], L = lots[M.brille ? 1 : 0], j = L.n++, c = uneFois[k + 8] || M.couleur || BLANC, f = M.force || 1;
      L.centres.array.set([uneFois[k + 1], uneFois[k + 2], uneFois[k + 3]], j * 3);
      L.axes.array.set([uneFois[k + 4], uneFois[k + 5], uneFois[k + 6]], j * 3);
      L.teintes.array.set([c[0] * f, c[1] * f, c[2] * f, (M.opacite || 1) * uneFois[k + 9]], j * 4);
      L.params.array.set([uneFois[k + 7], 0, M.image, M.mode + (M.eclaire ? 4 : 0)], j * 4);
    }
    uneFois.length = 0;
    for (const L of lots) {
      L.geo.instanceCount = L.n;
      L.objet.visible = L.n > 0 || !L.pret; // (la 1re image : montré vide, pour que la carte graphique prépare son programme)
      L.pret = true;
      if (L.n) L.centres.needsUpdate = L.axes.needsUpdate = L.teintes.needsUpdate = L.params.needsUpdate = true;
    }
    bilan.vivantes = nActifs;
    bilan.max = R.particules[niveau];
    bilan.cachent = lots[0].n;
    bilan.brillent = lots[1].n;
    // les lumières
    let allumees = 0;
    const max = R.lumieres[niveau];
    lumieres.forEach((L, k) => {
      L.age += dt;
      L.l.visible = k < max; // (demande 96 : au-delà du nombre permis, la lumière est ENLEVÉE, pas seulement éteinte : une lumière éteinte coûte autant)
      if (k >= max || L.age >= L.duree) return void (L.l.intensity = 0);
      const f = 1 - L.age / L.duree;
      L.l.intensity = L.force * f * f * (L.scintille ? 0.7 + 0.3 * Math.sin(L.age * 37 + k) * Math.sin(L.age * 23) : 1);
      allumees++;
    });
    bilan.lumieres = allumees;
    bilan.lumieresMax = max;
    // les cailloux
    let nc = 0;
    const maxC = R.debris3d[niveau];
    for (let i = 0; i < MAX_DEBRIS; i++) {
      if (!CAI.vivant[i]) continue;
      if (i >= maxC) { CAI.vivant[i] = 0; continue; }
      CAI.age[i] += dt;
      if (CAI.age[i] > CAI.vie[i]) { CAI.vivant[i] = 0; continue; }
      if (CAI.y[i] > CAI.sol[i] || CAI.vy[i] > 0) {
        CAI.vy[i] -= 9.8 * dt;
        CAI.x[i] += CAI.vx[i] * dt; CAI.y[i] += CAI.vy[i] * dt; CAI.z[i] += CAI.vz[i] * dt;
        CAI.rx[i] += CAI.vr[i] * dt; CAI.ry[i] += CAI.vr[i] * 0.7 * dt;
        if (CAI.y[i] < CAI.sol[i]) {
          CAI.y[i] = CAI.sol[i];
          CAI.vy[i] = Math.abs(CAI.vy[i]) > 2 ? -CAI.vy[i] * 0.3 : 0;
          CAI.vx[i] *= 0.5; CAI.vz[i] *= 0.5; CAI.vr[i] *= 0.5;
        }
      }
      const fin = Math.min(1, (CAI.vie[i] - CAI.age[i]) / 0.8), t = CAI.t[i] * fin; // (il rapetisse à la fin : il « s'enfonce »)
      m4.compose(p.set(CAI.x[i], CAI.y[i] + t * 0.4, CAI.z[i]), q.setFromEuler(e.set(CAI.rx[i], CAI.ry[i], 0)), s.set(t, t * 0.7, t * 0.85));
      cailloux.setMatrixAt(i, m4);
      nc = i + 1;
    }
    // (les cases vides avant « nc » : un caillou de taille 0)
    for (let i = 0; i < nc; i++) if (!CAI.vivant[i]) cailloux.setMatrixAt(i, m4.makeScale(0, 0, 0));
    cailloux.count = nc;
    cailloux.visible = nc > 0;
    if (nc) cailloux.instanceMatrix.needsUpdate = true;
    bilan.cailloux = CAI.vivant.reduce((a, v) => a + v, 0);
    bilan.caillouxMax = maxC;
  }
  // Ranger l'autocollant i dans son lot : centre, direction (un trait), couleur, transparence, taille, image.
  function ranger(L, M, i, t) {
    const j = L.n++;
    let taille = T0[i] + (T1[i] - T0[i]) * (M.lineaire ? t : 1 - (1 - t) * (1 - t));
    // la couleur au fil de la vie (le feu : blanc → jaune → orange → rouge sombre)
    let r = ROUGE[i], g = VERT[i], b = BLEU[i];
    if (M.couleurs) {
      const cs = M.couleurs, u = t * (cs.length - 1), k = Math.min(cs.length - 2, Math.floor(u)), f = u - k;
      r *= cs[k][0] + (cs[k + 1][0] - cs[k][0]) * f;
      g *= cs[k][1] + (cs[k + 1][1] - cs[k][1]) * f;
      b *= cs[k][2] + (cs[k + 1][2] - cs[k][2]) * f;
    }
    const force = M.force || 1;
    const a = (M.opacite || 1) * OP[i] * Math.min(1, t / (M.entree || 0.06)) * Math.pow(1 - t, M.sortie || 1);
    let ax = 0, ay = 0, az = 0;
    if (M.mode === TRAIT) {
      if (M.longueur) { // une traceuse : un trait qui grandit derrière elle jusqu'à « longueur » (sans dépasser le canon)
        const v = Math.hypot(VX[i], VY[i], VZ[i]) || 1, l = Math.min(M.longueur * (AX[i] || 1), AGE[i] * v) / v;
        (ax = -VX[i] * l), (ay = -VY[i] * l), (az = -VZ[i] * l);
      } else (ax = -VX[i] * (M.etire || 0.03)), (ay = -VY[i] * (M.etire || 0.03)), (az = -VZ[i] * (M.etire || 0.03));
    }
    const c = L.centres.array, x3 = j * 3, x4 = j * 4;
    c[x3] = X[i]; c[x3 + 1] = Y[i]; c[x3 + 2] = Z[i];
    const d = L.axes.array;
    d[x3] = ax; d[x3 + 1] = ay; d[x3 + 2] = az;
    const te = L.teintes.array;
    te[x4] = r * force; te[x4 + 1] = g * force; te[x4 + 2] = b * force; te[x4 + 3] = a;
    const pa = L.params.array;
    pa[x4] = taille;
    pa[x4 + 1] = ROT[i];
    pa[x4 + 2] = M.images ? M.image + ((DEPART[i] + Math.floor(t * M.images * (M.defile || 1))) % M.images) : M.image;
    pa[x4 + 3] = M.mode + (M.eclaire ? 4 : 0);
  }

  function effacer() {
    for (let a = 0; a < nActifs; a++) (libres[nLibres++] = actifs[a]), (MODELE[actifs[a]] = null);
    nActifs = 0;
    CAI.vivant.fill(0);
    for (const L of lumieres) L.age = L.duree;
  }

  return { initialiser, eclairage, emettre, allonger, dessinerUneFois, lumiere, caillou, maj, effacer, bilan, IMG, FACE, TRAIT, PLAT, get niveau() { return niveau; }, get camera() { return camera; }, get cam() { return camObjet; } };
})();
