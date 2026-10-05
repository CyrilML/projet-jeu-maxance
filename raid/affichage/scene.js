// 🎥 LA SCÈNE : le caméraman du rallye (étape 54)
//
// Il met tout en place pour la photo, 60 fois par seconde :
//   - LE CIEL : un dégradé (bleu en haut, poudré de sable à l'horizon, comme sur l'image du Dakar) et le soleil ;
//   - LA LUMIÈRE : un soleil chaud qui fait des ombres, et la lumière du ciel ; une BRUME de poussière au loin ;
//   - LES VÉHICULES : chacun est posé sur le sol et PENCHE comme le sol (dans une dune, il pique du nez ; en dévers,
//     il penche sur le côté). Une moto, elle, se COUCHE dans les virages. En l'air, le véhicule pique du nez doucement ;
//   - LA CAMÉRA : derrière toi, elle suit la direction où tu vas, sans jamais passer sous le sable.
// Comme tout l'affichage, ce fichier lit le monde et ne le modifie jamais.

window.Raid = window.Raid || {};

Raid.Scene = (function () {
  const C = Raid.CONFIG, T = Raid.Terrain;
  let rendu, scene, cam, soleil, decor;
  const objets = new Map(); // véhicule du monde → son dessin
  const camera = { angle: 0, pret: false, mode: 0 };

  function ciel() {
    const geo = new THREE.SphereGeometry(4000, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { soleil: { value: new THREE.Vector3(0.55, 0.42, 0.3).normalize() } },
      vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: [
        "uniform vec3 soleil; varying vec3 vDir;",
        "void main() {",
        "  float h = clamp(vDir.y, -0.1, 1.0);",
        "  vec3 haut = vec3(0.28, 0.48, 0.78), horizon = vec3(0.86, 0.78, 0.64);", // l'horizon poudré de sable
        "  vec3 c = mix(horizon, haut, pow(max(h, 0.0), 0.55));",
        "  float s = max(dot(normalize(vDir), soleil), 0.0);",
        "  c += vec3(1.0, 0.85, 0.6) * pow(s, 400.0) * 3.0 + vec3(1.0, 0.8, 0.55) * pow(s, 8.0) * 0.25;", // le soleil et son halo
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
    });
    return new THREE.Mesh(geo, mat);
  }

  function initialiser(toile) {
    rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true });
    rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping;
    rendu.toneMappingExposure = 1.05;
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd8c8a8, 120, 1100); // la brume de poussière
    const leCiel = ciel();
    scene.add(leCiel);
    // Les reflets (la carrosserie reflète le ciel) : on « photographie » le ciel une fois.
    const pm = new THREE.PMREMGenerator(rendu), env = new THREE.Scene();
    env.add(ciel());
    scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x9a7a52, 0.75));
    soleil = new THREE.DirectionalLight(0xfff0d6, 2.6);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(2048, 2048);
    const o = soleil.shadow.camera;
    o.left = o.bottom = -40;
    o.right = o.top = 40;
    o.near = 1;
    o.far = 300;
    soleil.shadow.bias = -0.0005;
    scene.add(soleil, soleil.target);
    cam = new THREE.PerspectiveCamera(C.camera.champ, toile.width / toile.height, 0.1, 5000);
    decor = Raid.Decor.construire();
    scene.add(decor);
    Raid.Poussiere.initialiser(scene);
    return scene;
  }

  // Le dessin d'un véhicule (fabriqué la première fois qu'on en a besoin).
  function objetDe(v) {
    let o = objets.get(v);
    if (!o || o.fiche !== v.fiche) {
      if (o) scene.remove(o.g);
      o = Raid.Vehicules.fabriquer(v.fiche);
      o.fiche = v.fiche;
      o.normale = new THREE.Vector3(0, 1, 0);
      o.penche = 0;
      o.couche = 0;
      scene.add(o.g);
      objets.set(v, o);
    }
    return o;
  }

  const haut = new THREE.Vector3(0, 1, 0), qLacet = new THREE.Quaternion(), qPente = new THREE.Quaternion(), qPique = new THREE.Quaternion(), qCouche = new THREE.Quaternion();
  const axeX = new THREE.Vector3(1, 0, 0), axeZ = new THREE.Vector3(0, 0, 1);
  // Poser un véhicule : sa place, son cap, la pente du sol (en douceur), et pour une moto, l'inclinaison dans le virage.
  function placer(o, v, dt) {
    const n = T.normale(v.x, v.z);
    const vise = v.enLAir ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(n.x, n.y, n.z);
    o.normale.lerp(vise, Math.min(1, dt * (v.enLAir ? 2 : 10))).normalize();
    o.g.position.set(v.x, v.y, v.z);
    qLacet.setFromAxisAngle(haut, -v.angle);
    qPente.setFromUnitVectors(haut, o.normale);
    // En l'air, le véhicule pique doucement du nez selon sa vitesse verticale.
    const pique = v.enLAir ? Math.max(-0.5, Math.min(0.4, Math.atan2(v.vy, Math.max(5, Math.abs(v.vitesse))))) : 0;
    o.penche += (pique - o.penche) * Math.min(1, dt * 4);
    qPique.setFromAxisAngle(axeZ, o.penche);
    // Une moto se couche dans les virages (plus elle va vite, plus elle se couche).
    const couche = o.famille === "moto" ? -v.volant * Math.min(0.55, Math.abs(v.vitesse) / 40) : 0;
    o.couche += (couche - o.couche) * Math.min(1, dt * 6);
    qCouche.setFromAxisAngle(axeX, o.couche);
    o.g.quaternion.copy(qPente).multiply(qLacet).multiply(qPique).multiply(qCouche);
    // La caisse tressaute un peu sur les cailloux, et les roues tournent et braquent.
    const secousses = (C.terrains[v.terrain] || {}).secousses || 0;
    o.caisse.position.y = v.enLAir ? 0 : Math.sin(v.distance * 9) * secousses * Math.min(1, Math.abs(v.vitesse) / 15) * 0.4;
    for (const r of o.roues) {
      r.roue.rotation.z = -v.rotationRoues * (r.sens || 1);
      r.pivot.rotation.y = r.avant ? -v.volant * 0.45 : 0;
    }
  }

  function dessiner(monde, dt) {
    const v = monde.voiture;
    // Au garage : le véhicule choisi, qui tourne sur lui-même au soleil, tout seul.
    const auGarage = monde.phase === "garage";
    const joueur = objetDe(v);
    placer(joueur, v, dt);
    for (const p of monde.pilotes) {
      const o = objetDe(p.v);
      o.g.visible = !auGarage && Math.hypot(p.v.x - v.x, p.v.z - v.z) < 900;
      if (o.g.visible) placer(o, p.v, dt);
    }
    // Les dessins des véhicules qui n'existent plus (au garage, chaque nouveau choix est un nouveau véhicule) : on les enlève.
    if (objets.size > monde.pilotes.length + 1) {
      const vivants = new Set([v].concat(monde.pilotes.map((p) => p.v)));
      for (const [cle, o] of objets) if (!vivants.has(cle)) { scene.remove(o.g); objets.delete(cle); }
    }
    // La caméra.
    const R = C.camera;
    let oeil, cible;
    if (auGarage) {
      const a = monde.temps * 0.4, d = joueur.famille === "camion" ? 14 : 9;
      oeil = new THREE.Vector3(v.x + Math.cos(a) * d, v.y + 3, v.z + Math.sin(a) * d);
      cible = new THREE.Vector3(v.x, v.y + 1, v.z);
      camera.angle = v.angle;
    } else {
      let diff = v.deplacement - camera.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      camera.angle += diff * (camera.pret ? 1 - Math.exp(-R.souplesse * dt) : 1);
      camera.pret = true;
      const recul = (joueur.famille === "camion" ? 1.5 : joueur.famille === "moto" ? 0.8 : 1) * (camera.mode === 1 ? 1.8 : 1);
      const cx = Math.cos(camera.angle), cz = Math.sin(camera.angle);
      oeil = new THREE.Vector3(v.x - cx * R.distance * recul, v.y + R.hauteur * recul, v.z - cz * R.distance * recul);
      oeil.y = Math.max(oeil.y, T.hauteur(oeil.x, oeil.z) + 1.5); // jamais sous le sable
      cible = new THREE.Vector3(v.x + cx * R.regardDevant, v.y + 1.2, v.z + cz * R.regardDevant);
    }
    cam.position.lerp(oeil, auGarage ? 1 : Math.min(1, dt * 12));
    cam.lookAt(cible);
    // Le soleil suit la caméra (pour que les ombres soient nettes autour de toi).
    soleil.position.set(v.x + 120, v.y + 160, v.z + 90);
    soleil.target.position.set(v.x, v.y, v.z);
    Raid.Decor.maj(dt, cam);
    Raid.Poussiere.maj(dt, [{ v, objet: joueur, joueur: true }].concat(auGarage ? [] : monde.pilotes.map((p) => ({ v: p.v, objet: objets.get(p.v) }))), cam);
    rendu.render(scene, cam);
  }

  function changerCamera() {
    camera.mode = (camera.mode + 1) % 2;
  }

  return { initialiser, dessiner, changerCamera, get infos() { return rendu ? rendu.info.render : {}; } };
})();
