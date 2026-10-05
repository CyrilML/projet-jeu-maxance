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
  let flamme = null; // étape 40 : les flammes du nitro, derrière la voiture
  let boulots3d = null; // étape 43 : les ronds des petits boulots, la colonne de lumière, les poubelles, le client
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

    // Étape 40 : les flammes du nitro. Deux cônes (orange dehors, jaune dedans) qui « s'additionnent »
    // à la lumière de l'image (blending additif) : ça brille comme du feu.
    flamme = new THREE.Group();
    for (const [rayon, longueur, couleur] of [[0.32, 1.8, 0xff6a1a], [0.18, 1.2, 0xfff2a0]]) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(rayon, longueur, 12), new THREE.MeshBasicMaterial({ color: couleur, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      cone.rotation.z = Math.PI / 2; // la pointe vers l'arrière
      cone.position.x = -longueur / 2;
      flamme.add(cone);
    }
    flamme.visible = false;
    scene.add(flamme);

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
      else if (carte === "grand") ({ groupe, maj } = Circuit.DecorGrandParcours.construire()); // étape 40
      else if (carte === "ciel") ({ groupe, maj } = Circuit.DecorRampes.construire()); // étape 41
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
    // Étape 42 : la map de la ville est énorme : le brouillard commence plus loin, pour voir les îles.
    scene.fog.near = carte === "ville" ? 450 : 280;
    scene.fog.far = carte === "ville" ? 2400 : 1100;
  }

  // Un exemplaire de chaque modèle de voiture (fabriqué la première fois).
  // Étape 42 : une voiture repeinte au magasin (peinture dorée) est un exemplaire à part : « citadine/or ».
  function vehicule(modele) {
    const peinture = (Circuit.Sauvegarde.donnees.peintures || {})[modele];
    const cle = peinture ? modele + "/" + peinture : modele;
    if (!vehicules[cle]) {
      const fiche = Circuit.Garage.ficheDe(modele);
      const couleurs = peinture === "or" ? C.magasins.couleurOr : fiche.couleurs;
      vehicules[cle] = Circuit.Modeles.fabriquer(modele, couleurs[0], couleurs[1]);
      vehicules[cle].cle = cle;
      // Étape 40 : où est l'arrière de la voiture (pour y accrocher les flammes du nitro) ?
      vehicules[cle].arriere = new THREE.Box3().setFromObject(vehicules[cle].g).min.x;
      scene.add(vehicules[cle].g);
    }
    return vehicules[cle];
  }

  // Étape 43 : les petits boulots en 3D.
  //   - un ROND lumineux (et sa colonne de lumière) à chaque endroit où l'on commence un boulot ;
  //   - une grande COLONNE DE LUMIÈRE jaune là où il faut aller (comme dans les jeux de mission) ;
  //   - les POUBELLES vertes à vider, et le CLIENT du taxi qui attend sur le trottoir.
  function dessinerBoulots(monde) {
    if (!boulots3d) {
      const g = new THREE.Group();
      const couleurs = { pizzas: 0xff8a1a, taxi: 0xffd21a, poubelles: 0x2ecc71 };
      const ronds = [];
      for (const d of Circuit.Boulots.departs) {
        const c = couleurs[d.sorte];
        const rond = new THREE.Mesh(new THREE.TorusGeometry(C.boulots.rayonRond - 0.5, 0.25, 8, 40), new THREE.MeshBasicMaterial({ color: c }));
        rond.rotation.x = Math.PI / 2;
        rond.position.set(d.x, 0.3, d.z);
        const colonne = new THREE.Mesh(new THREE.CylinderGeometry(C.boulots.rayonRond - 1, C.boulots.rayonRond - 1, 10, 24, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
        colonne.position.set(d.x, 5, d.z);
        g.add(rond, colonne);
        ronds.push(rond, colonne);
      }
      const cible = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 120, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, fog: false }));
      const rondCible = new THREE.Mesh(new THREE.TorusGeometry(C.boulots.rayonRond - 0.5, 0.3, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffe14d }));
      rondCible.rotation.x = Math.PI / 2;
      g.add(cible, rondCible);
      const poubelles = [];
      const vert = new THREE.MeshStandardMaterial({ color: 0x1f8f4a, roughness: 0.6 });
      for (let i = 0; i < C.boulots.poubelles.nombre; i++) {
        const p = new THREE.Group();
        const corps = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 1.1), vert);
        corps.position.y = 0.65;
        const couvercle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.2), new THREE.MeshStandardMaterial({ color: 0x14532d }));
        couvercle.position.y = 1.35;
        const halo = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.12, 6, 24), new THREE.MeshBasicMaterial({ color: 0x7dffa0 }));
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.1;
        p.add(corps, couvercle, halo);
        p.traverse((o) => (o.castShadow = true));
        g.add(p);
        poubelles.push(p);
      }
      const client = Circuit.Modeles.personnage();
      client.g.traverse((o) => {
        if (o.material && o.material.color && o.material.color.getHex() === 0xd33b2f) o.material = new THREE.MeshStandardMaterial({ color: 0x3b6fd3, roughness: 0.8 }); // un pull bleu
      });
      g.add(client.g);
      scene.add(g);
      boulots3d = { g, ronds, cible, rondCible, poubelles, client };
    }
    const b3 = boulots3d;
    b3.g.visible = monde.carte === "ville" && (monde.phase === "ville");
    if (!b3.g.visible) return;
    const b = monde.boulot;
    for (const r of b3.ronds) r.visible = !b; // les ronds de départ, seulement quand on ne travaille pas
    b3.cible.visible = b3.rondCible.visible = !!(b && b.cible);
    if (b && b.cible) {
      const pulse = 1 + 0.08 * Math.sin(monde.temps * 5);
      b3.cible.position.set(b.cible.x, 60, b.cible.z);
      b3.cible.scale.set(pulse, 1, pulse);
      b3.rondCible.position.set(b.cible.x, 0.35, b.cible.z);
    }
    b3.poubelles.forEach((p, i) => {
      const q = b && b.poubelles && b.poubelles[i];
      p.visible = !!(q && !q.prise);
      if (p.visible) p.position.set(q.x, 0, q.z);
    });
    b3.client.g.visible = !!(b && b.client);
    if (b && b.client) {
      b3.client.g.position.set(b.client.x, 0.12, b.client.z);
      b3.client.g.rotation.y = -b.client.angle;
      const bras = Math.sin(monde.temps * 6) * 0.8 - 2.2; // il lève le bras : « Taxi ! »
      b3.client.bras[1].rotation.x = bras;
    }
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
      // Étape 40 : sur le grand parcours, les routes sont très hautes (jusqu'à 22 m) : la caméra suit toute la hauteur,
      // sinon elle passerait sous la route !
      const suivi = monde.carte === "grand" || monde.carte === "ciel" || monde.carte === "ville" ? 1 : 0.75; // (la ville : les ponts, étape 42)
      oeil = [v.x - cos * R.distance * recul, R.hauteur * recul + y * suivi, v.z - sin * R.distance * recul];
      cible = [v.x + cos * R.regardDevant, 1 + y * Math.min(1, suivi + 0.1), v.z + sin * R.regardDevant];
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
    for (const objet of Object.values(vehicules)) objet.g.visible = objet === joueur;
    joueur.g.visible = camera.mode !== "capot" || monde.phase === "garage" || monde.phase === "cartes" || !!monde.pieton;
    placerVoiture(joueur, v);
    adversaire.g.visible = !!monde.adversaire;
    if (monde.adversaire) placerVoiture(adversaire, monde.adversaire.voiture);

    // Étape 40 : les flammes du nitro (elles tremblent un peu), et le gyrophare de la police.
    flamme.visible = v.nitro > 0 && !monde.pieton && joueur.g.visible;
    if (flamme.visible) {
      flamme.position.copy(joueur.g.position);
      flamme.rotation.copy(joueur.g.rotation);
      flamme.children.forEach((cone, i) => {
        cone.position.set(joueur.arriere + 0.1 - (i ? 0.6 : 0.9) * (0.85 + 0.3 * Math.random()), 0.55, 0);
        cone.scale.set(1, 0.85 + 0.3 * Math.random(), 1);
      });
    }
    if (joueur.gyro) {
      const allume = monde.sirene && !monde.pieton;
      const tic = Math.floor(monde.temps * 4) % 2;
      joueur.gyro.rouge.emissiveIntensity = allume && tic ? 5 : 0.05;
      joueur.gyro.bleu.emissiveIntensity = allume && !tic ? 5 : 0.05;
    }

    // Étape 39 : les voitures garées et celles de la circulation, et le personnage.
    const compte = {};
    const suivi0 = monde.pieton || v;
    const montrer = (voiture) => {
      // Étape 42 : la map est énorme. On ne dessine que les véhicules à moins de 400 m (les autres sont cachés).
      if (Math.abs(voiture.x - suivi0.x) > 400 || Math.abs(voiture.z - suivi0.z) > 400) return;
      // Une réserve par modèle ET par couleur (les motos des méga-rampes ont chacune leur couleur).
      const cleFlotte = voiture.couleurs ? voiture.modele + JSON.stringify(voiture.couleurs) : voiture.modele;
      const k = (compte[cleFlotte] = (compte[cleFlotte] || 0) + 1) - 1;
      const reserve = (flotte[cleFlotte] = flotte[cleFlotte] || []);
      if (!reserve[k]) {
        // Étape 41 : un véhicule qui n'est dans aucun garage (la moto) apporte ses propres couleurs.
        const fiche = Circuit.Garage.ficheDe(voiture.modele) || { couleurs: voiture.couleurs || [[0.8, 0.1, 0.1], [0.1, 0.1, 0.11]] };
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
      bonhomme.g.position.set(p.x, (p.y || 0) + 0.12, p.z);
      // Étape 42 : ce qu'il a acheté au magasin (la casquette dorée, les lunettes).
      const objets = Circuit.Sauvegarde.donnees.objets || {};
      bonhomme.lunettes.visible = !!objets.lunettes;
      if (objets.casquette && !bonhomme.dore) {
        bonhomme.dore = new THREE.MeshStandardMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.25 });
        bonhomme.casquette.material = bonhomme.visiere.material = bonhomme.dore;
      }
      // Dans un magasin, on ne le voit plus (il est à l'intérieur !).
      bonhomme.g.visible = camera.mode !== "capot" && !monde.magasin;
      bonhomme.g.rotation.set(0, -p.angle, 0);
      // Les jambes et les bras se balancent quand il marche (comme un pendule).
      const balance = Math.sin(p.pas * 2.4) * Math.min(1, Math.abs(p.vitesse)) * 0.7;
      bonhomme.jambes[0].rotation.z = balance;
      bonhomme.jambes[1].rotation.z = -balance;
      bonhomme.bras[0].rotation.z = -balance;
      bonhomme.bras[1].rotation.z = balance;
    } else if (bonhomme) bonhomme.g.visible = false;

    dessinerBoulots(monde); // étape 43

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
    const hautSuivi = suivi.y || 0; // étape 41 : sur les méga-rampes, la voiture est très haut dans le ciel
    soleil.position.set(suivi.x + SOLEIL.x * 150, hautSuivi + SOLEIL.y * 150, suivi.z + SOLEIL.z * 150);
    soleil.target.position.set(suivi.x, hautSuivi, suivi.z);
    if (decors[carteDessinee].maj) decors[carteDessinee].maj(monde.temps, monde); // étape 39 : les feux de la ville
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
