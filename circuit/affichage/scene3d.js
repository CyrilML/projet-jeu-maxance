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
  const RECUL_VOL = { avionDeLigne: 3.6, petitAvion: 1.6, avionChasse: 2, helico: 1.8 }; // étape 44 : la caméra recule pour les avions
  const SOLEIL = new THREE.Vector3(0.45, 0.75, 0.35).normalize(); // d'où vient la lumière du soleil

  let rendu, scene, sceneX, cam, soleil, ciel, hemi;
  let brouillardCarte = 1100; // étape 47 : jusqu'où on voit sur cette carte quand il fait beau
  let vueProjection = M.identite();
  const decors = {}; // le décor de chaque carte (fabriqué la première fois)
  let carteDessinee = null;
  let rayonsFixes = null, rayonsMobiles = null;
  const vehicules = {}; // un exemplaire de chaque modèle de voiture
  let adversaire = null;
  const cartonsPool = [];
  let piecesInstances = null; // étape 56 : les pièces (une seule forme, dessinée 100 fois d'un coup)
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
    qualite.pixels = Math.min(window.devicePixelRatio || 1, C.qualite.pixelsMax); // (étape 56)
    rendu.setPixelRatio(qualite.pixels);
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
      Circuit.Meteo3D.materiauCiel(SOLEIL) // étape 47 : le ciel avec de vrais nuages (affichage/meteo3d.js)
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
    hemi = new THREE.HemisphereLight(0xcfe6ff, 0x5a6b3e, 0.7);
    scene.add(hemi);
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

    Circuit.Meteo3D.initialiser({ ciel, soleil, hemi, rendu, scene }); // étape 47 : la pluie, la neige, les éclairs
    Circuit.Fumee.initialiser(scene); // étape 53 : la fumée et les traces des pneus

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
    Circuit.Fumee.effacer(); // (étape 53 : les traces de pneus de l'autre carte disparaissent)
    // Étape 42 : la map de la ville est énorme : le brouillard commence plus loin, pour voir les îles.
    brouillardCarte = carte === "ville" ? 2400 : 1100; // (étape 47 : la météo peut voir moins loin, affichage/meteo3d.js)
  }

  // Étape 52 : quand une vraie maquette 3D est prête, on jette les voitures « provisoires » de ce modèle (dessinées en
  // code) : elles seront refabriquées, avec la maquette, à la prochaine image.
  Circuit.Evenements.ecouter("maquette", (d) => {
    if (d.etat !== "prete") return;
    for (const cle of Object.keys(vehicules)) {
      if (cle.split("/")[0] === d.modele && vehicules[cle].provisoire) {
        scene.remove(vehicules[cle].g);
        delete vehicules[cle];
      }
    }
    for (const cle of Object.keys(flotte)) {
      if (cle === d.modele || cle.startsWith(d.modele + "[")) {
        for (const o of flotte[cle]) scene.remove(o.g);
        delete flotte[cle];
      }
    }
  });

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

  // Étape 45 : le projecteur de l'hélico de la police : un cône de lumière jaune, de l'hélico jusqu'à toi.
  let projecteur = null;
  function dessinerProjecteur(h, cible) {
    if (!projecteur) {
      const geo = new THREE.ConeGeometry(7, 1, 24, 1, true);
      geo.translate(0, -0.5, 0); // la pointe en haut, à l'hélico
      projecteur = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      scene.add(projecteur);
    }
    projecteur.visible = !!h;
    if (!h) return;
    const haut = new THREE.Vector3(h.x, h.y, h.z), bas = new THREE.Vector3(cible.x, cible.y || 0, cible.z);
    const longueur = haut.distanceTo(bas);
    projecteur.position.copy(haut);
    projecteur.scale.set(1, longueur, 1);
    projecteur.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), bas.clone().sub(haut).normalize());
  }

  // Étape 44 : les balles (des traits jaunes), les missiles (un tube blanc et sa flamme), les explosions
  // (une boule de feu qui grandit et s'efface), et les cibles d'entraînement (ballons rouges, cibles au sol).
  let armes3d = null;
  function dessinerArmes(monde) {
    if (!monde.cibles) {
      if (armes3d) armes3d.g.visible = false;
      return; // (les cibles n'existent qu'en ville)
    }
    if (!armes3d) {
      const g = new THREE.Group();
      const balles = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: 0xffe066 }), 200);
      balles.frustumCulled = false;
      const missiles = [], feux = [], boules = [], ballons = [], ciblesSol = [];
      const blanc = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.4 });
      for (let i = 0; i < 20; i++) {
        const m = new THREE.Group();
        const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.2, 8), blanc);
        corps.rotation.z = Math.PI / 2;
        const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.3, 2, 8), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
        flamme.rotation.z = Math.PI / 2;
        flamme.position.x = -2;
        m.add(corps, flamme);
        m.visible = false;
        g.add(m);
        missiles.push(m);
      }
      for (let i = 0; i < 12; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        b.visible = false;
        g.add(b);
        boules.push(b);
      }
      const rouge = new THREE.MeshStandardMaterial({ color: 0xe02020, roughness: 0.4 });
      const geoBallon = new THREE.SphereGeometry(4, 16, 12);
      const toile = document.createElement("canvas");
      toile.width = toile.height = 128;
      const ctx = toile.getContext("2d");
      for (let r = 6; r > 0; r--) {
        ctx.fillStyle = r % 2 ? "#e02020" : "#ffffff";
        ctx.beginPath();
        ctx.arc(64, 64, r * 10.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const texCible = new THREE.CanvasTexture(toile);
      texCible.colorSpace = THREE.SRGBColorSpace;
      for (const c of monde.cibles || []) {
        if (c.sorte === "ballon") {
          const b = new THREE.Mesh(geoBallon, rouge);
          b.position.set(c.x, c.y, c.z);
          g.add(b);
          ballons.push(b);
        } else {
          const cible = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshStandardMaterial({ map: texCible, side: THREE.DoubleSide }));
          cible.position.set(c.x, c.y + 1.5, c.z);
          cible.rotation.y = Math.random() * Math.PI;
          g.add(cible);
          ciblesSol.push(cible);
        }
      }
      g.add(balles);
      scene.add(g);
      armes3d = { g, balles, missiles, boules, ballons, ciblesSol };
    }
    const a3 = armes3d;
    a3.g.visible = monde.carte === "ville" && monde.phase === "ville";
    if (!a3.g.visible) return;
    let nb = 0, nm = 0;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), x = new THREE.Vector3(1, 0, 0);
    for (const t of monde.tirs) {
      const dir = new THREE.Vector3(t.vx, t.vy, t.vz).normalize();
      q.setFromUnitVectors(x, dir);
      if (t.sorte === "balle" && nb < 200) a3.balles.setMatrixAt(nb++, m4.compose(new THREE.Vector3(t.x, t.y, t.z), q, un));
      if (t.sorte === "missile" && nm < a3.missiles.length) {
        const m = a3.missiles[nm++];
        m.visible = true;
        m.position.set(t.x, t.y, t.z);
        m.quaternion.copy(q);
        m.children[1].scale.set(1, 0.7 + Math.random() * 0.6, 1);
      }
    }
    a3.balles.count = nb;
    a3.balles.instanceMatrix.needsUpdate = true;
    for (let i = nm; i < a3.missiles.length; i++) a3.missiles[i].visible = false;
    monde.explosions.forEach((e, i) => {
      if (i >= a3.boules.length) return;
      const b = a3.boules[i];
      b.visible = true;
      b.position.set(e.x, e.y + 1, e.z);
      b.scale.setScalar(e.taille * (0.3 + e.age));
      b.material.opacity = Math.max(0, 1 - e.age / 1.6);
      b.material.color.setHSL(0.08 - e.age * 0.04, 1, 0.55 - e.age * 0.2);
    });
    for (let i = monde.explosions.length; i < a3.boules.length; i++) a3.boules[i].visible = false;
    let ib = 0, is = 0;
    for (const c of monde.cibles) {
      if (c.sorte === "ballon") {
        const b = a3.ballons[ib++];
        if (b) {
          b.visible = !c.touchee;
          b.position.y = c.y + Math.sin(monde.temps + ib) * 1.5; // les ballons flottent
        }
      } else if (a3.ciblesSol[is]) a3.ciblesSol[is++].visible = !c.touchee;
    }
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
    // (Étape 53 : en drift, la caméra suit la direction où la voiture VA, pas son nez : on la voit glisser en biais.)
    const viseAngle = !monde.pieton && v.drift && v.deplacement !== undefined ? v.deplacement : v.angle;
    let difference = viseAngle - camera.angle;
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
      const recul = v.modele === "monster" ? 1.3 : v.modele === "camion" ? 1.6 : monde.pieton ? 0.5 : RECUL_VOL[v.modele] || 1; // étape 44 : les avions sont grands
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

  let objetJoueur = null; // (étape 55 : le dessin de ta voiture, pour compter ses pièces sous le capot)

  // Met une voiture (le groupe Three.js) à la place de la voiture du monde.
  function placerVoiture(objet, v) {
    const y = v.y || 0;
    const cible = v.tangage || (Math.abs(v.vy || 0) > 0.01 ? Math.max(-0.6, Math.min(0.6, Math.atan2(v.vy, Math.abs(v.vitesse) || 1))) : 0);
    // Étape 46 : la voiture penche EN DOUCEUR (elle rattrape un quart de l'écart à chaque image), comme une vraie
    // suspension. Sans ça, le moindre petit changement de pente la faisait trembler. (Pas pendant un looping.)
    const penche = v.tangage ? cible : objet.penche === undefined ? cible : objet.penche + (cible - objet.penche) * 0.25;
    objet.penche = penche;
    objet.g.position.set(v.x, y, v.z);
    objet.g.rotation.set(v.roulis || 0, -v.angle, penche, "YZX"); // d'abord tourner (angle), puis pencher (pente, looping), puis le roulis (étape 44 : un avion qui vire)
    // Étape 44 : le rotor de l'hélico et l'hélice du petit avion tournent (leur angle est rotationRoues).
    if (objet.rotor) objet.rotor.rotation.y = v.rotationRoues || 0;
    if (objet.rotorArriere) objet.rotorArriere.rotation.z = (v.rotationRoues || 0) * 1.7;
    if (objet.helice) objet.helice.rotation.x = (v.rotationRoues || 0) * 3;
    // Étape 49 : les ressorts du monster truck. La caisse monte et descend (logique/ressorts.js), les ressorts s'étirent.
    if (objet.caisse) {
      const s = v.suspension;
      const ecrase = s ? s.ecrase : 0;
      objet.caisse.position.y = ecrase;
      // (étape 51 : la caisse penche aussi : tangage autour de z, roulis autour de x)
      objet.caisse.rotation.set(s ? s.roulis : 0, 0, s ? s.tangage : 0);
      for (const r of objet.ressorts) r.scale.y = Math.max(0.05, r.userData.base + ecrase);
    }
    // Étape 55 : l'ombre douce sous la voiture disparaît quand la voiture saute (elle ne touche plus le sol).
    if (objet.ombreSol) objet.ombreSol.visible = Math.abs(v.vy || 0) < 1 && !v.tangage;
    for (const r of objet.roues) {
      r.roue.rotation.z = -v.rotationRoues * (r.sens || 1); // la roue roule (étape 51 : une roue de gauche retournée roule dans l'autre sens)
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

  // Étape 56 : la QUALITÉ AUTOMATIQUE. On chronomètre chaque image ; toutes les 2 s, on regarde la moyenne :
  // trop lent → on peint moins de pixels (l'image est un tout petit peu moins fine, mais le jeu ne saccade plus) ;
  // très rapide → on en remet. C'est ce que font les vrais jeux vidéo (« résolution dynamique »).
  const qualite = { pixels: 1, moyenne: 0, total: 0, images: 0, debut: 0, avant: 0 };
  function reglerQualite(maintenant) {
    const Q = C.qualite;
    if (qualite.avant) {
      qualite.total += Math.min(0.25, (maintenant - qualite.avant) / 1000);
      qualite.images++;
    }
    qualite.avant = maintenant;
    if (!qualite.debut) qualite.debut = maintenant;
    if (maintenant - qualite.debut < Q.mesure * 1000 || !qualite.images) return;
    qualite.moyenne = qualite.total / qualite.images;
    qualite.total = qualite.images = 0;
    qualite.debut = maintenant;
    const max = Math.min(window.devicePixelRatio || 1, Q.pixelsMax);
    let nouveau = qualite.pixels;
    if (qualite.moyenne > Q.imageLente) nouveau = Math.max(Q.pixelsMin, qualite.pixels - Q.pas);
    else if (qualite.moyenne < Q.imageRapide) nouveau = Math.min(max, qualite.pixels + Q.pas);
    if (Math.abs(nouveau - qualite.pixels) < 0.01) return;
    const plus = nouveau > qualite.pixels;
    qualite.pixels = nouveau;
    rendu.setPixelRatio(nouveau); // (Three.js garde la taille de l'écran et change seulement le nombre de pixels peints)
    Circuit.Evenements.emettre("qualite", { pixels: nouveau, plus, ms: qualite.moyenne * 1000 });
  }

  function dessiner(monde, options, dt) {
    reglerQualite(performance.now());
    if (monde.carte !== carteDessinee) preparerCarte(monde.carte);
    placerCamera(monde, dt);
    const v = monde.voiture;

    // Les voitures : on montre seulement celle du joueur, et la voiture bleue s'il y en a une.
    const joueur = vehicule(v.modele);
    objetJoueur = joueur;
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
      // (Étape 56 : en ville, 170 m suffisent : plus loin, les immeubles les cachent, et ça faisait ramer.)
      const loin = monde.carte === "ville" ? C.qualite.distanceVehiculesVille : C.qualite.distanceVehicules;
      if (Math.abs(voiture.x - suivi0.x) > loin || Math.abs(voiture.z - suivi0.z) > loin) return;
      // Une réserve par modèle ET par couleur (les motos des méga-rampes ont chacune leur couleur).
      const cleFlotte = voiture.couleurs ? voiture.modele + JSON.stringify(voiture.couleurs) : voiture.modele;
      const k = (compte[cleFlotte] = (compte[cleFlotte] || 0) + 1) - 1;
      const reserve = (flotte[cleFlotte] = flotte[cleFlotte] || []);
      if (!reserve[k]) {
        // Étape 41 : un véhicule qui n'est dans aucun garage (la moto) apporte ses propres couleurs.
        const fiche = voiture.couleurs ? { couleurs: voiture.couleurs } : Circuit.Garage.ficheDe(voiture.modele) || { couleurs: [[0.8, 0.1, 0.1], [0.1, 0.1, 0.11]] };
        reserve[k] = Circuit.Modeles.fabriquer(voiture.modele, fiche.couleurs[0], fiche.couleurs[1]);
        scene.add(reserve[k].g);
      }
      reserve[k].g.visible = true;
      placerVoiture(reserve[k], voiture);
      // Étape 45 : les voitures de police en poursuite ont le gyrophare allumé.
      if (reserve[k].gyro) {
        const tic = Math.floor(monde.temps * 4 + k) % 2;
        reserve[k].gyro.rouge.emissiveIntensity = voiture.sirene && tic ? 5 : 0.05;
        reserve[k].gyro.bleu.emissiveIntensity = voiture.sirene && !tic ? 5 : 0.05;
      }
    };
    for (const g of monde.garees || []) montrer(g);
    for (const c of monde.circulation || []) montrer(c.voiture);
    // Étape 45 : la police (ses voitures, et son hélico avec un projecteur).
    const police = monde.carte === "ville" && monde.phase === "ville" ? monde.police : null;
    for (const pv of (police && police.voitures) || []) montrer(pv.voiture);
    if (police && police.helico) montrer(police.helico);
    dessinerProjecteur(police && police.helico, monde.pieton || v);
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
    dessinerArmes(monde); // étape 44

    // Les pièces qui tournent sur elles-mêmes et flottent, et les cartons.
    // (Étape 56 : toutes les pièces sont des « instances » d'une seule forme : un seul dessin pour les 100 pièces.)
    if (!piecesInstances || piecesInstances.instanceMatrix.count < monde.pieces.length) {
      if (piecesInstances) scene.remove(piecesInstances);
      piecesInstances = new THREE.InstancedMesh(geoPiece, materiauPiece, Math.max(16, monde.pieces.length));
      piecesInstances.castShadow = true;
      piecesInstances.frustumCulled = false; // (elles sont partout sur la carte)
      scene.add(piecesInstances);
    }
    let n = 0;
    const qPiece = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), axeY = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), ici = new THREE.Vector3();
    qPiece.setFromAxisAngle(axeY, monde.temps * 3);
    for (const p of monde.pieces) {
      if (p.prise) continue;
      ici.set(p.x, (p.y !== undefined ? p.y : C.pieces.hauteur) + Math.sin(monde.temps * 2.5 + p.numero) * 0.2, p.z);
      piecesInstances.setMatrixAt(n++, m4.compose(ici, qPiece, un));
    }
    piecesInstances.count = n;
    piecesInstances.instanceMatrix.needsUpdate = true;
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
    Circuit.Meteo3D.maj(options.pause ? 0 : dt, cam, monde.carte, brouillardCarte); // étape 47
    Circuit.Nature.maj(options.pause ? 0 : dt, cam); // étape 48 : l'herbe plie au vent, on cache l'herbe trop loin
    Circuit.Fumee.maj(options.pause ? 0 : dt, monde, monde.pieton ? null : vehicule(monde.voiture.modele)); // étape 53
    Circuit.Eau.maj(options.pause ? 0 : dt); // étape 48 : les vagues

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
    qualite,
    get objetJoueur() {
      return objetJoueur;
    },
  };
})();
