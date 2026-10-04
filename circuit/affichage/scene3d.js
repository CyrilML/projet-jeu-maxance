// 🎬 LA SCÈNE 3D : le réalisateur (étape 38 : version réaliste, avec Three.js)
//
// Jusqu'à l'étape 37, on dessinait avec notre propre moteur 3D. Pour un rendu réaliste, on utilise
// maintenant Three.js, un moteur 3D très connu. Il sait faire ce qui serait très long à écrire nous-mêmes :
//   - de VRAIES OMBRES : le soleil « regarde » la scène depuis le ciel ; tout ce qu'il ne voit pas est à l'ombre ;
//   - des MATÉRIAUX réalistes : la peinture brillante reflète le ciel, le pneu est mat, le chrome brille ;
//   - des TEXTURES : des images collées sur les objets (le goudron, l'herbe…) ;
//   - le BROUILLARD au loin et un CIEL en dégradé avec son soleil.
//
// Ce fichier fait comme avant : il place la caméra (derrière la voiture, au-dessus, ou sur le capot),
// il met chaque objet à sa place (voitures, pièces, cartons), puis il demande à Three.js de dessiner.
// Il LIT le monde, il ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.Scene3D = (function () {
  const C = Circuit.CONFIG;
  const M = Circuit.Maths3D;
  const camera = { mode: "poursuite", angle: 0, pret: false };
  const MODES = ["poursuite", "ciel", "capot"];
  const compteur = { triangles: 0, lignes: 0, objets: 0 };
  const SOLEIL = new THREE.Vector3(0.45, 0.75, 0.35).normalize(); // d'où vient la lumière du soleil

  let rendu, scene, sceneX, cam, soleil, ciel;
  let vueProjection = M.identite();
  const decors = {}; // le décor de chaque carte (fabriqué la première fois)
  let carteDessinee = null;
  let rayonsFixes = null, rayonsMobiles = null;
  const vehicules = {}; // un exemplaire de chaque modèle de voiture
  let adversaire = null;
  const piecesPool = [], cartonsPool = [];
  const flotte = {}; // étape 39 : les voitures garées et celles de la circulation (une réserve par modèle)
  let bonhomme = null; // étape 39 : le personnage
  let materiauPiece = null, geoPiece = null, materiauCarton = null, geoCarton = null, fil = null;

  // ------------------------------------------------------------------ démarrage
  function initialiser(canvas) {
    try {
      rendu = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (e) {
      return false; // pas de WebGL sur cet ordinateur
    }
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendu.setSize(canvas.width, canvas.height, false);
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping; // des couleurs « comme au cinéma »
    rendu.toneMappingExposure = 1.0;
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = THREE.PCFSoftShadowMap; // des ombres aux bords doux

    scene = new THREE.Scene();
    sceneX = new THREE.Scene(); // les traits des rayons X, dessinés par-dessus
    cam = new THREE.PerspectiveCamera(C.camera.champDeVision, canvas.width / canvas.height, 0.3, 3000);

    // Le ciel : une immense sphère, bleu foncé en haut, clair à l'horizon, avec le soleil.
    ciel = new THREE.Mesh(
      new THREE.SphereGeometry(2000, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { soleil: { value: SOLEIL } },
        vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "uniform vec3 soleil; varying vec3 vDir;" +
          "void main(){ float h = max(vDir.y, 0.0);" +
          " vec3 c = mix(vec3(0.78,0.88,0.98), vec3(0.25,0.5,0.9), pow(h, 0.6));" +
          " float s = max(dot(normalize(vDir), soleil), 0.0);" +
          " c += vec3(1.0,0.9,0.7) * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.25);" +
          " if (vDir.y < 0.0) c = vec3(0.6,0.68,0.6);" +
          " gl_FragColor = vec4(c, 1.0); }",
      })
    );
    scene.add(ciel);
    scene.fog = new THREE.Fog(0xc6dcf2, 280, 1100);

    // Les reflets : on fabrique une « carte d'environnement » à partir du ciel. La peinture des voitures
    // et les vitres la reflètent, comme une vraie carrosserie reflète le ciel.
    const pmrem = new THREE.PMREMGenerator(rendu);
    const sceneCiel = new THREE.Scene();
    sceneCiel.add(ciel.clone());
    const solReflet = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({ color: 0x4a5a3a }));
    solReflet.rotation.x = -Math.PI / 2;
    solReflet.position.y = -5;
    sceneCiel.add(solReflet);
    scene.environment = pmrem.fromScene(sceneCiel, 0.02).texture;

    // Les lumières : le ciel et le sol (lumière douce de partout), et le soleil (qui fait les ombres).
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x5a6b3e, 0.7));
    soleil = new THREE.DirectionalLight(0xfff1dd, 2.4);
    soleil.castShadow = true;
    soleil.shadow.mapSize.set(2048, 2048);
    const o = soleil.shadow.camera;
    o.left = o.bottom = -70;
    o.right = o.top = 70;
    o.near = 1;
    o.far = 400;
    soleil.shadow.bias = -0.0004;
    soleil.shadow.normalBias = 0.03;
    scene.add(soleil, soleil.target);

    // Les pièces : un disque doré et brillant. Les cartons : une caisse en carton.
    geoPiece = new THREE.CylinderGeometry(0.75, 0.75, 0.16, 28);
    geoPiece.rotateX(Math.PI / 2);
    materiauPiece = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.25, emissive: 0x6b4a00, emissiveIntensity: 0.6 });
    geoCarton = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    materiauCarton = new THREE.MeshStandardMaterial({ map: Circuit.Textures.carton(), roughness: 0.9 });
    fil = new THREE.MeshBasicMaterial({ color: 0x5af29a, wireframe: true, transparent: true, opacity: 0.35, fog: false });

    adversaire = Circuit.Modeles.fabriquer("classique", [0.12, 0.38, 0.92], [0.07, 0.22, 0.6]);
    scene.add(adversaire.g);
    rayonsMobiles = Circuit.RayonsX.mobiles({ voiture: { x: 0, z: 0, angle: 0, vitesse: 0 }, carte: "", pieces: [] });
    sceneX.add(rayonsMobiles);
    return true;
  }

  // Le décor de chaque carte est fabriqué la première fois qu'on la choisit, puis gardé.
  function preparerCarte(carte) {
    if (carteDessinee && decors[carteDessinee]) {
      decors[carteDessinee].groupe.visible = false;
      decors[carteDessinee].rayons.visible = false;
    }
    if (!decors[carte]) {
      let groupe, maj = null;
      if (carte === "parcours") groupe = Circuit.DecorParcours.construire();
      else if (carte === "ville") ({ groupe, maj } = Circuit.DecorVille.construire());
      else groupe = Circuit.DecorCircuit.construire();
      const rayons = Circuit.RayonsX.fixes(carte);
      scene.add(groupe);
      sceneX.add(rayons);
      decors[carte] = { groupe, rayons, maj };
    }
    decors[carte].groupe.visible = true;
    rayonsFixes = decors[carte].rayons;
    carteDessinee = carte;
  }

  // Un exemplaire de chaque modèle de voiture (fabriqué la première fois).
  function vehicule(modele) {
    if (!vehicules[modele]) {
      const fiche = Circuit.Garage.ficheDe(modele);
      vehicules[modele] = Circuit.Modeles.fabriquer(modele, fiche.couleurs[0], fiche.couleurs[1]);
      scene.add(vehicules[modele].g);
    }
    return vehicules[modele];
  }

  function changerCamera() {
    camera.mode = MODES[(MODES.indexOf(camera.mode) + 1) % MODES.length];
    return camera.mode;
  }

  // ------------------------------------------------------------------ chaque image
  function placerCamera(monde, dt) {
    // Étape 39 : à pied, la caméra suit le personnage (plus près, plus bas).
    const v = monde.pieton ? Object.assign({ modele: "pieton" }, monde.pieton) : monde.voiture;
    const R = C.camera;
    // La caméra tourne en douceur pour suivre l'angle de la voiture (par le chemin le plus court).
    let difference = v.angle - camera.angle;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    const douceur = camera.pret ? 1 - Math.exp(-R.souplesse * dt) : 1;
    camera.angle += difference * douceur;
    camera.pret = true;
    const cos = Math.cos(camera.angle), sin = Math.sin(camera.angle);
    const y = v.y || 0;

    let oeil, cible, haut = [0, 1, 0];
    if (monde.boucle && camera.mode !== "capot") {
      // Pendant un looping, la caméra se met sur le côté pour voir le tour en entier.
      const l = monde.boucle.looping;
      const cx = l.x + l.lx * (C.parcours.decalageLooping / 2), cz = l.z + l.lz * (C.parcours.decalageLooping / 2);
      oeil = [cx - l.lx * l.rayon * 3.2, l.rayon * 1.1, cz - l.lz * l.rayon * 3.2];
      cible = [cx, l.rayon, cz];
    } else if (monde.phase === "garage" || monde.phase === "cartes") {
      // Au garage, la caméra tourne lentement autour de la voiture, comme dans une vitrine.
      const a = monde.temps * 0.35;
      const recul = v.modele === "monster" ? 10 : v.modele === "camion" ? 14 : 8;
      oeil = [v.x + Math.cos(a) * recul, 2.6, v.z + Math.sin(a) * recul];
      cible = [v.x, 0.9, v.z];
      camera.angle = v.angle;
    } else if (camera.mode === "ciel") {
      oeil = [v.x, 110, v.z];
      cible = [v.x, 0, v.z];
      haut = [cos, 0, sin];
    } else if (camera.mode === "capot") {
      const h = y + (monde.pieton ? 1.8 : vehicule(v.modele).yCapot || 1.4);
      oeil = [v.x + Math.cos(v.angle) * 0.4, h, v.z + Math.sin(v.angle) * 0.4];
      cible = [v.x + Math.cos(v.angle) * 20, h - 0.3, v.z + Math.sin(v.angle) * 20];
    } else {
      // Derrière la voiture ; la caméra suit aussi la hauteur (un peu moins, pour qu'on voie bien les sauts).
      const recul = v.modele === "monster" ? 1.3 : v.modele === "camion" ? 1.6 : monde.pieton ? 0.5 : 1;
      oeil = [v.x - cos * R.distance * recul, R.hauteur * recul + y * 0.75, v.z - sin * R.distance * recul];
      cible = [v.x + cos * R.regardDevant, 1 + y * 0.85, v.z + sin * R.regardDevant];
    }
    cam.position.set(oeil[0], oeil[1], oeil[2]);
    cam.up.set(haut[0], haut[1], haut[2]);
    cam.lookAt(cible[0], cible[1], cible[2]);
    cam.updateMatrixWorld();
    // La matrice « vue + perspective », pour que le tableau de bord sache où tombe un point sur l'écran.
    vueProjection = new Float32Array(new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse).elements);
  }

  // Met une voiture (le groupe Three.js) à la place de la voiture du monde.
  function placerVoiture(objet, v) {
    const y = v.y || 0;
    const penche = v.tangage || (Math.abs(v.vy || 0) > 0.01 ? Math.max(-0.6, Math.min(0.6, Math.atan2(v.vy, Math.abs(v.vitesse) || 1))) : 0);
    objet.g.position.set(v.x, y, v.z);
    objet.g.rotation.set(0, -v.angle, penche, "YZX"); // d'abord tourner (angle), puis pencher (pente, looping)
    for (const r of objet.roues) {
      r.roue.rotation.z = -v.rotationRoues; // la roue roule
      r.pivot.rotation.y = r.avant ? -v.volant * C.voiture.angleRoues : 0; // les roues avant braquent
    }
  }

  // Prend un objet dans une réserve (pour ne pas en refabriquer à chaque image).
  function depuisReserve(reserve, index, fabriquer) {
    if (!reserve[index]) {
      reserve[index] = fabriquer();
      scene.add(reserve[index]);
    }
    reserve[index].visible = true;
    return reserve[index];
  }

  function dessiner(monde, options, dt) {
    if (monde.carte !== carteDessinee) preparerCarte(monde.carte);
    placerCamera(monde, dt);
    const v = monde.voiture;

    // Les voitures : on montre seulement celle du joueur, et la voiture bleue s'il y en a une.
    const joueur = vehicule(v.modele);
    for (const [modele, objet] of Object.entries(vehicules)) objet.g.visible = modele === v.modele;
    joueur.g.visible = camera.mode !== "capot" || monde.phase === "garage" || monde.phase === "cartes" || !!monde.pieton;
    placerVoiture(joueur, v);
    adversaire.g.visible = !!monde.adversaire;
    if (monde.adversaire) placerVoiture(adversaire, monde.adversaire.voiture);

    // Étape 39 : les voitures garées et celles de la circulation, et le personnage.
    const compte = {};
    const montrer = (voiture) => {
      const k = (compte[voiture.modele] = (compte[voiture.modele] || 0) + 1) - 1;
      const reserve = (flotte[voiture.modele] = flotte[voiture.modele] || []);
      if (!reserve[k]) {
        const fiche = Circuit.Garage.ficheDe(voiture.modele);
        reserve[k] = Circuit.Modeles.fabriquer(voiture.modele, fiche.couleurs[0], fiche.couleurs[1]);
        scene.add(reserve[k].g);
      }
      reserve[k].g.visible = true;
      placerVoiture(reserve[k], voiture);
    };
    for (const g of monde.garees || []) montrer(g);
    for (const c of monde.circulation || []) montrer(c.voiture);
    for (const [modele, reserve] of Object.entries(flotte)) for (let k = compte[modele] || 0; k < reserve.length; k++) reserve[k].g.visible = false;
    if (monde.pieton) {
      if (!bonhomme) {
        bonhomme = Circuit.Modeles.personnage();
        scene.add(bonhomme.g);
      }
      const p = monde.pieton;
      bonhomme.g.visible = camera.mode !== "capot";
      bonhomme.g.position.set(p.x, 0.12, p.z);
      bonhomme.g.rotation.set(0, -p.angle, 0);
      // Les jambes et les bras se balancent quand il marche (comme un pendule).
      const balance = Math.sin(p.pas * 2.4) * Math.min(1, Math.abs(p.vitesse)) * 0.7;
      bonhomme.jambes[0].rotation.z = balance;
      bonhomme.jambes[1].rotation.z = -balance;
      bonhomme.bras[0].rotation.z = -balance;
      bonhomme.bras[1].rotation.z = balance;
    } else if (bonhomme) bonhomme.g.visible = false;

    // Les pièces qui tournent sur elles-mêmes et flottent, et les cartons.
    let n = 0;
    for (const p of monde.pieces) {
      if (p.prise) continue;
      const m = depuisReserve(piecesPool, n++, () => {
        const piece = new THREE.Mesh(geoPiece, materiauPiece);
        piece.castShadow = true;
        return piece;
      });
      m.position.set(p.x, (p.y !== undefined ? p.y : C.pieces.hauteur) + Math.sin(monde.temps * 2.5 + p.numero) * 0.2, p.z);
      m.rotation.y = monde.temps * 3;
    }
    for (let i = n; i < piecesPool.length; i++) piecesPool[i].visible = false;
    const cartons = monde.cartons || [];
    cartons.forEach((c, i) => {
      const m = depuisReserve(cartonsPool, i, () => {
        const carton = new THREE.Mesh(geoCarton, materiauCarton);
        carton.castShadow = carton.receiveShadow = true;
        return carton;
      });
      m.position.set(c.x, c.y, c.z);
      m.rotation.set(0, c.rotation, c.rotation * 0.7);
    });
    for (let i = cartons.length; i < cartonsPool.length; i++) cartonsPool[i].visible = false;

    // Le soleil suit la voiture (ou le personnage), pour que les ombres soient nettes autour d'elle.
    const suivi = monde.pieton || v;
    soleil.position.set(suivi.x + SOLEIL.x * 150, SOLEIL.y * 150, suivi.z + SOLEIL.z * 150);
    soleil.target.position.set(suivi.x, 0, suivi.z);
    if (decors[carteDessinee].maj) decors[carteDessinee].maj(monde.temps); // étape 39 : les feux de la ville
    ciel.position.copy(cam.position);

    // On dessine !
    rendu.autoClear = true;
    rendu.render(scene, cam);
    compteur.triangles = rendu.info.render.triangles;
    compteur.objets = rendu.info.render.calls;
    compteur.lignes = 0;
    if (options.rayonsX) {
      // Aux rayons X : on redessine tout en « fil de fer » par-dessus, puis les traits secrets.
      rendu.autoClear = false;
      scene.overrideMaterial = fil;
      ciel.visible = false;
      rendu.render(scene, cam);
      scene.overrideMaterial = null;
      ciel.visible = true;
      rayonsFixes.visible = true;
      Circuit.RayonsX.mobiles(monde, rayonsMobiles);
      rendu.render(sceneX, cam);
      compteur.lignes = (rayonsFixes.geometry.attributes.position.count + rayonsMobiles.geometry.attributes.position.count) / 2;
      rendu.autoClear = true;
    }
  }

  return {
    initialiser,
    dessiner,
    changerCamera,
    camera,
    compteur,
    get vueProjection() {
      return vueProjection;
    },
  };
})();
