// 🎥 LA SCÈNE : le caméraman du rallye (étape 54)
//
// Il met tout en place pour la photo, 60 fois par seconde :
//   - LE CIEL : un dégradé (bleu en haut, poudré de sable à l'horizon, comme sur l'image du Dakar) et le soleil ;
//   - LA LUMIÈRE : un soleil chaud qui fait des ombres, et la lumière du ciel ; une BRUME de poussière au loin ;
//   - LES VÉHICULES : chacun est posé sur le sol et PENCHE comme le sol (dans une dune, il pique du nez ; en dévers,
//     il penche sur le côté). Une moto, elle, se COUCHE dans les virages. En l'air, le véhicule pique du nez doucement ;
//   - LA CAMÉRA : derrière toi, elle suit la direction où tu vas, sans jamais passer sous le sable.
// Étape 72 (« ça rame ») : il suit le niveau de qualité (affichage/qualite.js) : la finesse de l'image, les ombres, la
// distance de vue. Et les autres pilotes LOIN de toi sont dessinés en « maquette » (une boîte de leur couleur et 4 roues :
// 1 dessin au lieu d'une soixantaine) ; encore plus loin, on ne les dessine plus du tout.
// Comme tout l'affichage, ce fichier lit le monde et ne le modifie jamais.

window.Raid = window.Raid || {};

Raid.Scene = (function () {
  const C = Raid.CONFIG, T = Raid.Terrain;
  let rendu, scene, cam, soleil, decor, leCiel;
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
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping;
    rendu.toneMappingExposure = 1.05;
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xd8c8a8, 120, 1100); // la brume de poussière
    leCiel = ciel();
    leCiel.renderOrder = -1; // (le ciel est peint en premier, tout le reste par-dessus)
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
    appliquerQualite(Raid.Qualite.reglage);
    return scene;
  }

  // Étape 72 : régler l'image d'après un niveau de qualité (config.js : qualite.niveaux).
  const bilanQualite = { pixels: 1, ombres: "—", vue: 0, recompilations: 0 };
  let ombresAvant = null;
  function appliquerQualite(R) {
    const pixels = Math.min(window.devicePixelRatio || 1, R.pixels);
    rendu.setPixelRatio(pixels);
    bilanQualite.pixels = pixels;
    // La distance de vue : la caméra s'arrête là, la brume finit là, et le ciel est une boule juste avant.
    cam.far = R.vue + 50;
    cam.updateProjectionMatrix();
    scene.fog.near = R.brume;
    scene.fog.far = R.vue;
    leCiel.scale.setScalar((R.vue + 20) / 4000);
    bilanQualite.vue = R.vue;
    // Les ombres : on ne change la carte des ombres que si elle change vraiment (c'est long : chaque matière se refait).
    const cle = R.ombres ? R.ombres.taille + (R.ombres.douces ? "d" : "") : "aucune";
    if (cle === ombresAvant) return;
    const etaitAllume = rendu.shadowMap.enabled, typeAvant = rendu.shadowMap.type;
    rendu.shadowMap.enabled = !!R.ombres;
    soleil.castShadow = !!R.ombres;
    if (R.ombres) {
      rendu.shadowMap.type = R.ombres.douces ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
      if (soleil.shadow.mapSize.x !== R.ombres.taille) {
        soleil.shadow.mapSize.set(R.ombres.taille, R.ombres.taille);
        if (soleil.shadow.map) {
          soleil.shadow.map.dispose();
          soleil.shadow.map = null;
        }
      }
    }
    if (ombresAvant !== null && (etaitAllume !== rendu.shadowMap.enabled || typeAvant !== rendu.shadowMap.type)) {
      const vues = new Set();
      scene.traverse((o) => {
        if (!o.material) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (!vues.has(m)) { vues.add(m); m.needsUpdate = true; }
      });
      bilanQualite.recompilations++;
    }
    ombresAvant = cle;
    bilanQualite.ombres = R.ombres ? R.ombres.taille + " points" + (R.ombres.douces ? ", bords doux" : "") : "aucune";
  }

  // Le dessin d'un véhicule (fabriqué la première fois qu'on en a besoin).
  function objetDe(v) {
    let o = objets.get(v);
    if (!o || o.fiche !== v.fiche) {
      if (o) scene.remove(o.g, o.maquette);
      o = Raid.Vehicules.fabriquer(v.fiche);
      o.fiche = v.fiche;
      o.maquette = Raid.Vehicules.maquette(o, v.fiche); // (étape 72) le véhicule « en gros », pour quand il est loin
      o.maquette.visible = false;
      scene.add(o.maquette);
      o.normale = new THREE.Vector3(0, 1, 0);
      o.penche = 0;
      o.couche = 0;
      scene.add(o.g);
      objets.set(v, o);
    }
    return o;
  }

  const haut = new THREE.Vector3(0, 1, 0), qLacet = new THREE.Quaternion(), qPente = new THREE.Quaternion(), qPique = new THREE.Quaternion(), qCouche = new THREE.Quaternion();
  const axeX = new THREE.Vector3(1, 0, 0), axeZ = new THREE.Vector3(0, 0, 1), vise = new THREE.Vector3();
  // Poser un véhicule : sa place, son cap, la pente du sol (en douceur), et pour une moto, l'inclinaison dans le virage.
  function placer(o, v, dt) {
    if (v.enLAir) vise.set(0, 1, 0);
    else {
      const n = T.normale(v.x, v.z);
      vise.set(n.x, n.y, n.z);
    }
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

  const oeil = new THREE.Vector3(), cible = new THREE.Vector3(), aPoudrer = [];
  const bilanVehicules = { detailles: 0, maquettes: 0, caches: 0 };
  function dessiner(monde, dt) {
    const v = monde.voiture;
    // Au garage : le véhicule choisi, qui tourne sur lui-même au soleil, tout seul.
    const auGarage = monde.phase === "garage";
    const joueur = objetDe(v);
    placer(joueur, v, dt);
    // Les autres pilotes : en détail s'ils sont proches de la caméra, en maquette plus loin, cachés encore plus loin.
    const R = Raid.Qualite.reglage;
    bilanVehicules.detailles = bilanVehicules.maquettes = bilanVehicules.caches = 0;
    for (const p of monde.pilotes) {
      const o = objetDe(p.v);
      const d = auGarage ? Infinity : Math.hypot(p.v.x - cam.position.x, p.v.z - cam.position.z);
      o.g.visible = d < R.detailles;
      o.maquette.visible = !o.g.visible && d < R.simplifies;
      if (o.g.visible) {
        placer(o, p.v, dt);
        bilanVehicules.detailles++;
      } else if (o.maquette.visible) {
        // (la maquette : juste sa place et son cap, sans regarder la pente : de loin, ça ne se voit pas)
        o.maquette.position.set(p.v.x, p.v.y, p.v.z);
        o.maquette.rotation.y = -p.v.angle;
        bilanVehicules.maquettes++;
      } else bilanVehicules.caches++;
    }
    // Les dessins des véhicules qui n'existent plus (au garage, chaque nouveau choix est un nouveau véhicule) : on les enlève.
    if (objets.size > monde.pilotes.length + 1) {
      const vivants = new Set([v].concat(monde.pilotes.map((p) => p.v)));
      for (const [cle, o] of objets) if (!vivants.has(cle)) { scene.remove(o.g, o.maquette); objets.delete(cle); }
    }
    // La caméra.
    const K = C.camera;
    if (auGarage) {
      const a = monde.temps * 0.4, d = joueur.famille === "camion" ? 14 : 9;
      oeil.set(v.x + Math.cos(a) * d, v.y + 3, v.z + Math.sin(a) * d);
      cible.set(v.x, v.y + 1, v.z);
      camera.angle = v.angle;
    } else {
      let diff = v.deplacement - camera.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      camera.angle += diff * (camera.pret ? 1 - Math.exp(-K.souplesse * dt) : 1);
      camera.pret = true;
      const recul = (joueur.famille === "camion" ? 1.5 : joueur.famille === "moto" ? 0.8 : 1) * (camera.mode === 1 ? 1.8 : 1);
      const cx = Math.cos(camera.angle), cz = Math.sin(camera.angle);
      oeil.set(v.x - cx * K.distance * recul, v.y + K.hauteur * recul, v.z - cz * K.distance * recul);
      oeil.y = Math.max(oeil.y, T.hauteur(oeil.x, oeil.z) + 1.5); // jamais sous le sable
      cible.set(v.x + cx * K.regardDevant, v.y + 1.2, v.z + cz * K.regardDevant);
    }
    cam.position.lerp(oeil, auGarage ? 1 : Math.min(1, dt * 12));
    cam.lookAt(cible);
    leCiel.position.copy(cam.position); // (le ciel suit la caméra : on ne s'en approche jamais)
    // Le soleil suit la caméra (pour que les ombres soient nettes autour de toi).
    soleil.position.set(v.x + 120, v.y + 160, v.z + 90);
    soleil.target.position.set(v.x, v.y, v.z);
    Raid.Decor.maj(dt, cam);
    // (la poussière : seulement derrière les véhicules dessinés en détail)
    aPoudrer.length = 0;
    aPoudrer.push({ v, objet: joueur, joueur: true });
    if (!auGarage) for (const p of monde.pilotes) { const o = objets.get(p.v); if (o && o.g.visible) aPoudrer.push({ v: p.v, objet: o }); }
    Raid.Poussiere.maj(dt, aPoudrer, cam);
    rendu.render(scene, cam);
  }

  function changerCamera() {
    camera.mode = (camera.mode + 1) % 2;
  }

  return { initialiser, dessiner, changerCamera, appliquerQualite, bilanQualite, bilanVehicules, get infos() { return rendu ? rendu.info.render : {}; } };
})();
