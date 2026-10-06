// 🎥 LA SCÈNE : le caméraman de la bataille (étape 60)
//
// Il met tout en place pour la photo, 60 fois par seconde :
//   - le CIEL (un dégradé bleu avec quelques nuages), le SOLEIL qui fait des ombres, une légère BRUME au loin ;
//   - chaque TANK : posé sur la colline et penché comme elle (en montée, il lève le nez), la tourelle tournée, le canon
//     levé, les galets qui tournent, les chenilles qui défilent ; un tank détruit devient une épave noire ;
//   - la CAMÉRA : derrière la TOURELLE (pas derrière la caisse) : tu regardes là où vise ton canon.
//     Touche C : caméra plus loin, plus haute.
// Comme tout l'affichage, ce fichier lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Scene = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let rendu, scene, cam, soleil;
  const objets = new Map(); // tank du monde → son dessin
  const camera = { angle: 0, pret: false, mode: 0 };
  const SOLEIL = new THREE.Vector3(0.5, 0.75, 0.35).normalize();

  function ciel() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { soleil: { value: SOLEIL } },
      vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform vec3 soleil; varying vec3 vDir;",
        "float h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
        "float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
        "  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }",
        "void main() {",
        "  float h = clamp(vDir.y, -0.1, 1.0);",
        "  vec3 c = mix(vec3(0.78, 0.84, 0.88), vec3(0.32, 0.52, 0.8), pow(max(h, 0.0), 0.5));",
        "  vec2 p = vDir.xz / max(0.12, vDir.y) * 1.6;", // les nuages, plaqués sur un plafond
        "  float n = bruit(p) * 0.5 + bruit(p * 2.1) * 0.3 + bruit(p * 4.3) * 0.2;",
        "  c = mix(c, vec3(0.96), smoothstep(0.55, 0.8, n) * smoothstep(0.02, 0.2, h) * 0.85);",
        "  float s = max(dot(normalize(vDir), soleil), 0.0);",
        "  c += vec3(1.0, 0.9, 0.7) * pow(s, 500.0) * 3.0 + vec3(1.0, 0.85, 0.6) * pow(s, 10.0) * 0.2;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
    });
    return new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), mat);
  }

  function initialiser(toile) {
    rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true });
    rendu.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping;
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc4cfd6, 200, 1100);
    scene.add(ciel());
    const pm = new THREE.PMREMGenerator(rendu), env = new THREE.Scene();
    env.add(ciel());
    const solReflet = new THREE.Mesh(new THREE.CircleGeometry(2000, 32), new THREE.MeshBasicMaterial({ color: 0x4d5a3a }));
    solReflet.rotation.x = -Math.PI / 2;
    solReflet.position.y = -3;
    env.add(solReflet);
    scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xd8e6ff, 0x5a6a40, 0.8));
    soleil = new THREE.DirectionalLight(0xfff1dc, 2.5);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(2048, 2048);
    const o = soleil.shadow.camera;
    o.left = o.bottom = -70;
    o.right = o.top = 70;
    o.near = 1;
    o.far = 400;
    soleil.shadow.bias = -0.0005;
    soleil.shadow.normalBias = 0.04;
    scene.add(soleil, soleil.target);
    cam = new THREE.PerspectiveCamera(C.camera.champ, toile.width / toile.height, 0.3, 4000);
    scene.add(Tanks.Decor.construire());
    Tanks.Effets.initialiser(scene);
  }

  function objetDe(c) {
    let o = objets.get(c);
    if (!o || o.fiche !== c.fiche) {
      if (o) scene.remove(o.g);
      o = Tanks.Chars3D.fabriquer(c.fiche, c.equipe);
      o.fiche = c.fiche;
      o.normale = new THREE.Vector3(0, 1, 0);
      o.brule = false;
      scene.add(o.g);
      objets.set(c, o);
    }
    return o;
  }

  const haut = new THREE.Vector3(0, 1, 0), qLacet = new THREE.Quaternion(), qPente = new THREE.Quaternion();
  function placer(o, c, dt) {
    const n = T.normale(c.x, c.z);
    o.normale.lerp(new THREE.Vector3(n.x, n.y, n.z), Math.min(1, dt * 8)).normalize();
    o.g.position.set(c.x, c.y, c.z);
    qLacet.setFromAxisAngle(haut, -c.angle);
    qPente.setFromUnitVectors(haut, o.normale);
    o.g.quaternion.copy(qPente).multiply(qLacet);
    if (c.detruit) {
      if (!o.brule) {
        Tanks.Chars3D.bruler(o);
        o.brule = true;
      }
      return;
    }
    o.tourelle.rotation.y = -c.tourelle;
    o.canon.rotation.z = c.hausse;
    // les galets tournent, les chenilles défilent (chacune à sa vitesse quand le tank tourne)
    for (let i = 0; i < o.roues.length; i++) o.roues[i].rotation.y = -(i < o.roues.length / 2 ? c.chenilles.gauche : c.chenilles.droite) / 0.38;
    o.chenilles[0].map.offset.x = -c.chenilles.gauche * 0.2;
    o.chenilles[1].map.offset.x = -c.chenilles.droite * 0.2;
  }

  function dessiner(monde, dt) {
    // on enlève les dessins des tanks qui n'existent plus (nouvelle bataille)
    const vivants = new Set(monde.chars);
    for (const [c, o] of objets) if (!vivants.has(c)) (scene.remove(o.g), objets.delete(c));
    if (monde.phase === "garage" && objets.size === 1) Tanks.Effets.effacer();
    for (const c of monde.chars) placer(objetDe(c), c, dt);
    // la caméra
    const j = monde.joueur, R = C.camera;
    let oeil, cible;
    if (monde.phase === "garage") {
      const a = monde.temps * 0.35;
      oeil = new THREE.Vector3(j.x + Math.cos(a) * 15, j.y + 5, j.z + Math.sin(a) * 15);
      cible = new THREE.Vector3(j.x, j.y + 1.6, j.z);
      camera.pret = false;
    } else {
      const voulu = j.angle + j.tourelle;
      let diff = Math.atan2(Math.sin(voulu - camera.angle), Math.cos(voulu - camera.angle));
      camera.angle += diff * (camera.pret ? 1 - Math.exp(-R.souplesse * dt) : 1);
      camera.pret = true;
      const k = camera.mode === 1 ? 1.8 : 1, cx = Math.cos(camera.angle), cz = Math.sin(camera.angle);
      oeil = new THREE.Vector3(j.x - cx * R.distance * k, j.y + R.hauteur * k, j.z - cz * R.distance * k);
      oeil.y = Math.max(oeil.y, T.hauteur(oeil.x, oeil.z) + 2);
      cible = new THREE.Vector3(j.x + cx * R.regardDevant, j.y + 2.5, j.z + cz * R.regardDevant);
    }
    cam.position.lerp(oeil, monde.phase === "garage" ? 1 : Math.min(1, dt * 14));
    cam.lookAt(cible);
    cam.updateMatrixWorld();
    soleil.position.set(j.x + SOLEIL.x * 200, j.y + SOLEIL.y * 200, j.z + SOLEIL.z * 200);
    soleil.target.position.set(j.x, j.y, j.z);
    Tanks.Decor.majArbres(false);
    Tanks.Effets.maj(dt, monde, cam);
    rendu.render(scene, cam);
  }

  // Où tombe un point du monde sur l'écran ? (pour le tableau de bord : les noms et la vie au-dessus des tanks)
  const v = new THREE.Vector3();
  function versEcran(x, y, z, L, H) {
    v.set(x, y, z).project(cam);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * L, y: (-v.y * 0.5 + 0.5) * H };
  }

  return { initialiser, dessiner, versEcran, changerCamera: () => (camera.mode = (camera.mode + 1) % 2), get infos() { return rendu ? rendu.info.render : {}; } };
})();
