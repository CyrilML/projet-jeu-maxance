// 🎥 LA SCÈNE : le caméraman de la bataille (étape 60)
//
// Il met tout en place pour la photo, 60 fois par seconde :
//   - le CIEL (un dégradé bleu avec quelques nuages), le SOLEIL qui fait des ombres, une légère BRUME au loin ;
//   - chaque TANK : posé sur la colline et penché comme elle (en montée, il lève le nez), la tourelle tournée, le canon
//     levé, les galets qui tournent, les chenilles qui défilent ; un tank détruit devient une épave noire ;
//   - la CAMÉRA : derrière la TOURELLE (pas derrière la caisse) : tu regardes là où vise ton canon.
//     Touche C : caméra plus loin, plus haute.
// Étape 61 : les 24 SOLDATS (les jambes se balancent quand ils marchent, ils tombent quand ils sont touchés), les ENGINS
// de ton camp (les roues du 4x4, les rotors de l'hélico et du drone, la flamme de l'avion), les ROQUETTES, BOMBES et
// MISSILES en vol, et une caméra pour chaque façon de jouer : derrière ton épaule à pied, derrière l'engin en l'air.
// Étape 62 : les BATEAUX (ils se balancent sur les vagues : un petit roulis et un petit tangage qui suivent des
// « sinus »), les PORTAILS (le tourbillon tourne), et la caméra qui SAUTE d'un coup quand tu passes un portail.
// Étape 64 : les AVIONS ennemis et de transport (ils penchent dans les virages ; abattus, ils tombent en fumant), la DCA
// (sa tourelle tourne, ses canons se lèvent), et la caméra de la DCA qui regarde vers le ciel, là où visent les canons.
// Étape 63 : chaque objet est dessiné ENTRE sa position d'avant et celle de maintenant (« interpolation ») : le jeu
// calcule 120 pas par seconde, mais l'écran n'affiche pas toujours ses images pile entre deux pas ; sans ça, ton
// personnage faisait de tout petits sauts. Et la caméra ne passe plus à travers les murs : elle s'avance devant.
// Étape 72 (« ça rame ») : le RÉGULATEUR DE QUALITÉ (affichage/qualite.js) choisit un niveau, et la scène l'applique :
// la finesse de l'image (pixels), les ombres, la distance de vue (le brouillard), et les « niveaux de détail » : un
// soldat proche est dessiné en détail, plus loin en simple, encore plus loin en SILHOUETTE (une seule pièce, toutes les
// silhouettes d'une équipe en un seul dessin), et au-delà il n'est pas dessiné ; un tank loin a ses roues soudées en
// une pièce. Le ciel suit la caméra (c'est une grande boule autour d'elle, plus petite quand la vue est courte).
// Étape 71 : les MOTOS, QUADS et CAMIONS (affichage/vehicules3d.js). Près de la caméra : en détail (les roues tournent,
// la fourche et les roues avant braquent, la moto PENCHE dans les virages, le pilote et les 6 soldats du camion sont là
// ou pas) ; plus loin : la version simple, toutes les copies d'une sorte et d'une équipe en UN seul dessin (instances).
// Étape 73 : les HÉLICOS DE TRANSPORT (affichage/helicos3d.js) : les rotors tournent (les 2 du Chinook en sens inverse), la
// rampe du Chinook se baisse au sol, se met à plat pour la corde et se relève en vol ; les soldats assis aux portes du
// Black Hawk disparaissent quand ils sont descendus ; les 2 CORDES pendent jusqu'au sol pendant la descente ; une petite
// flamme quand une mitrailleuse de porte tire. De loin : la version simple en instances (1 dessin par sorte et par équipe).
// Étape 74 (« le plus beau possible ») : un soleil un peu plus bas et plus chaud, la lumière du ciel et du sol, une
// exposition réglable (tout dans config.js, « beaute.soleil »), un ciel avec de vrais nuages éclairés ; le disque flou
// des rotors qui tournent vite ; la rampe du Chinook fermée suit la pente du bas de la coque ; et le décor reçoit, à
// chaque image, la distance des beaux arbres et le rayon des touffes d'herbe (selon le niveau de qualité).
// Étape 75 : les MAISONS qu'on détruit (affichage/maisons3d.js, mis à jour à chaque image), les GRENADES qui volent et
// rebondissent, et la caméra qui reste devant le premier mur (même quand tu es dans une maison).
// Étape 76 : les AVIONS, le DRONE et le TIGRE (affichage/avions3d.js) : le train d'atterrissage du Rafale RENTRE après le
// décollage (chaque jambe tourne autour de sa charnière) et ressort au sol, sa verrière se ferme quand tu montes, la
// flamme de la POSTCOMBUSTION s'allonge quand il va vite, ses missiles disparaissent un par un quand tu tires (et les
// grenades du drone) ; les hélices de l'avion de transport tournent (2 dans chaque sens) et sa RAMPE s'ouvre avant le
// largage ; le disque flou des rotors et des hélices qui tournent vite. De loin : la version simple en instances.
// Étape 80 : ✍️ LE SOUTERRAIN. Quand la bataille est sous terre (logique/terrain.js le dit), la scène CACHE tout le
// dehors (le sol, les arbres, les maisons, le lac, le ciel, le soleil et ses ombres : rien de tout ça n'est dessiné ni
// calculé) et MONTRE la station (affichage/station3d.js, construite la première fois qu'on descend). La lumière change :
// un brouillard sombre et proche, une lumière d'ambiance froide, les feux orange et les néons de la station.
// Comme tout l'affichage, ce fichier lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Scene = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let rendu, scene, cam, soleil, leDecor, ambiance, reflets, sousTerre = false; // (étape 80 : le dehors, l'ambiance, les reflets du ciel, où on est)
  const objets = new Map(); // tank du monde → son dessin
  const dessinsSoldats = new Map(), dessinsEngins = new Map(); // (étape 61) soldat → dessin, engin → dessin
  const dessinsPortails = new Map(); // (étape 62)
  let horloge = 0, dernierSuivi = null, alpha = 1;
  let cinema = null, plan = null; // (étape 88 : la caméra de cinéma de la campagne : une fonction qui donne { oeil, cible })
  // (étape 72) le niveau de qualité en cours (réglé par affichage/qualite.js), le ciel, les silhouettes des soldats
  let Q = C.qualite.niveaux[C.qualite.depart], leCiel = null;
  const silhouettes = {};
  const lod = { soldatsDetail: 0, soldatsSimples: 0, silhouettes: 0, soldatsCaches: 0, tanksRouesSoudees: 0, enginsCaches: 0, vehiculesDetail: 0, vehiculesSimples: 0, vehiculesCaches: 0, helicosDetail: 0, helicosSimples: 0, helicosCaches: 0, maillons: 0, avionsDetail: 0, avionsSimples: 0, avionsCaches: 0 };
  const lotsSimples = {}; // (étape 71) « moto:bleus » → les instances de la version simple
  // La « vue » d'un objet : le même objet, mais avec x, y, z, angle (et tourelle) pris entre l'avant et maintenant.
  const melange = (a, b) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * alpha;
  function vue(o) {
    const a = o.av;
    if (!a || Math.abs(o.x - a.x) + Math.abs(o.z - a.z) > 20) return o; // (un portail : pas d'entre-deux)
    const v = Object.create(o);
    v.x = a.x + (o.x - a.x) * alpha;
    v.y = a.y + (o.y - a.y) * alpha;
    v.z = a.z + (o.z - a.z) * alpha;
    v.angle = melange(a.angle, o.angle);
    if (o.tourelle !== undefined) v.tourelle = melange(a.tourelle, o.tourelle);
    return v;
  }
  const camera = { angle: 0, pret: false, mode: 0 };
  const L = Object.assign({}, C.beaute.soleil, (Tanks.CarteDuJour.variante || {}).soleil), /* (étape 81 : le soleil du désert…) */ SOLEIL = new THREE.Vector3(...L.direction).normalize(); // (étape 74 : un soleil un peu plus bas et plus chaud)

  function ciel() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { soleil: { value: SOLEIL } },
      vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      // (étape 74) un ciel plus beau : un bleu plus profond en haut, une brume dorée à l'horizon du côté du soleil, des
      // nuages en 5 couches de bruit, éclairés par le soleil (plus clairs du côté du soleil, plus gris dessous), qui
      // s'effacent doucement vers l'horizon (avant : des traînées blanches verticales).
      fragmentShader: [
        "uniform vec3 soleil; varying vec3 vDir;",
        "float h21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }",
        "float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
        "  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }",
        "float fbm(vec2 p) { float t = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { t += bruit(p) * a; p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return t; }",
        "void main() {",
        "  vec3 d = normalize(vDir);",
        "  float h = clamp(d.y, -0.1, 1.0);",
        "  float s = max(dot(d, soleil), 0.0);",
        "  vec3 horizon = mix(vec3(0.80, 0.85, 0.88), vec3(0.95, 0.88, 0.76), pow(s, 6.0) * 0.6);",
        "  vec3 c = mix(horizon, vec3(0.22, 0.42, 0.74), pow(max(h, 0.0), 0.55));",
        "  vec2 p = d.xz / max(0.08, d.y) * 1.2;", // (les nuages, plaqués sur un plafond)
        "  float n = fbm(p * 0.9 + vec2(3.0, 1.0));",
        "  float nuage = smoothstep(0.5, 0.78, n) * smoothstep(0.04, 0.32, h);",
        "  float eclaire = clamp(0.55 + (fbm(p * 0.9 + vec2(3.0, 1.0) + soleil.xz * 0.12) - n) * -3.0, 0.0, 1.0);",
        "  vec3 couleurNuage = mix(vec3(0.62, 0.66, 0.72), vec3(1.0, 0.98, 0.94), eclaire);",
        "  c = mix(c, couleurNuage, nuage * 0.92);",
        "  c += vec3(1.0, 0.9, 0.7) * pow(s, 600.0) * 4.0 + vec3(1.0, 0.85, 0.6) * pow(s, 12.0) * 0.25;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
    });
    return new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), mat);
  }
  const RAYON_CIEL = 3000;

  function initialiser(toile) {
    rendu = new THREE.WebGLRenderer({ canvas: toile, antialias: true });
    rendu.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    rendu.outputColorSpace = THREE.SRGBColorSpace;
    rendu.toneMapping = THREE.ACESFilmicToneMapping;
    rendu.toneMappingExposure = L.exposition;
    rendu.shadowMap.enabled = true;
    rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(Tanks.CarteDuJour.variante.brume || 0xc4cfd6, 200, 1100);
    leCiel = ciel();
    leCiel.renderOrder = -1;
    leCiel.frustumCulled = false;
    scene.add(leCiel);
    const pm = new THREE.PMREMGenerator(rendu), env = new THREE.Scene();
    env.add(ciel());
    const solReflet = new THREE.Mesh(new THREE.CircleGeometry(2000, 32), new THREE.MeshBasicMaterial({ color: 0x4d5a3a }));
    solReflet.rotation.x = -Math.PI / 2;
    solReflet.position.y = -3;
    env.add(solReflet);
    scene.environment = reflets = pm.fromScene(env, 0.04).texture;
    scene.add((ambiance = new THREE.HemisphereLight(L.ciel, L.sol, L.ambiance)));
    soleil = new THREE.DirectionalLight(L.couleur, L.force);
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
    scene.add((leDecor = Tanks.Decor.construire()));
    Tanks.Effets.initialiser(scene);
    for (const equipe of ["bleus", "rouges"]) scene.add((silhouettes[equipe] = Tanks.Engins3D.silhouettes(equipe, 160)));
    for (const sorte of Tanks.Vehicules3D.SORTES) for (const equipe of ["bleus", "rouges"]) scene.add((lotsSimples[sorte + ":" + equipe] = Tanks.Vehicules3D.lotSimple(sorte, equipe, 12)));
    for (const sorte of Tanks.Helicos3D.SORTES) for (const equipe of ["bleus", "rouges"]) scene.add((lotsSimples[sorte + ":" + equipe] = Tanks.Helicos3D.lotSimple(sorte, equipe, 6))); // (étape 73)
    // (étape 76) les avions, le drone et le Tigre : les chasseurs ennemis sont rouges ; le Rafale, le drone et le Tigre, bleus
    for (const [sorte, equipes] of [["avion", ["bleus"]], ["chasseur", ["rouges"]], ["transport", ["bleus", "rouges"]], ["drone", ["bleus"]], ["helico", ["bleus"]]]) for (const equipe of equipes) scene.add((lotsSimples[sorte + ":" + equipe] = Tanks.Avions3D.lotSimple(sorte, equipe, 6)));
  }

  // (étape 72) Appliquer un niveau de qualité (appelé par le régulateur, affichage/qualite.js).
  function appliquerQualite(n) {
    if (!rendu) return;
    Q = n;
    rendu.setPixelRatio(n.selonEcran ? Math.min(n.pixels, window.devicePixelRatio || 1) : n.pixels);
    // les ombres : on ne touche à la carte graphique que si ça change (changer les ombres oblige à refaire les
    // « programmes » de dessin de toutes les matières : c'est un petit à-coup, une seule fois)
    const ombres = n.ombres > 0, sorte = n.douces ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap, taille = n.ombres || 512;
    if (ombres !== rendu.shadowMap.enabled || (ombres && (sorte !== rendu.shadowMap.type || taille !== soleil.shadow.mapSize.x))) {
      rendu.shadowMap.enabled = ombres;
      rendu.shadowMap.type = sorte;
      soleil.castShadow = ombres;
      if (soleil.shadow.map) (soleil.shadow.map.dispose(), (soleil.shadow.map = null));
      soleil.shadow.mapSize.set(taille, taille);
      scene.traverse((o) => {
        if (!o.material) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true;
      });
    }
    // la distance de vue : le brouillard devient complet à « vue » mètres, et la caméra ne dessine rien plus loin
    scene.fog.near = Math.min(C.qualite.brouillard, n.vue * 0.4);
    scene.fog.far = n.vue;
    cam.far = n.vue * 1.05;
    cam.updateProjectionMatrix();
    leCiel.scale.setScalar((n.vue * 0.95) / RAYON_CIEL);
    if (sousTerre) (scene.fog.near = C.souterrain.brouillard[0]), (scene.fog.far = C.souterrain.brouillard[1]);
  }

  // (étape 80) Descendre dans le souterrain, ou remonter dehors : on cache l'un, on montre l'autre, on change la lumière.
  const BRUME = { dehors: new THREE.Color(Tanks.CarteDuJour.variante.brume || 0xc4cfd6), dessous: new THREE.Color(0x111316) };
  function changerMonde(dessous) {
    sousTerre = dessous;
    if (dessous && !Tanks.Station3D.construite) Tanks.Station3D.construire(scene);
    Tanks.Station3D.montrer(dessous);
    leDecor.visible = leCiel.visible = soleil.visible = !dessous;
    scene.environment = dessous ? null : reflets;
    scene.background = dessous ? BRUME.dessous : null;
    scene.fog.color.copy(dessous ? BRUME.dessous : BRUME.dehors);
    ambiance.color.set(dessous ? 0xc8d2dc : L.ciel);
    ambiance.groundColor.set(dessous ? 0x8a8078 : L.sol);
    ambiance.intensity = dessous ? 1.25 : L.ambiance;
    appliquerQualite(Q);
    Tanks.Evenements.emettre("monde-3d", { dessous, dessins: Tanks.Station3D.bilan.dessins, ms: Tanks.Station3D.bilan.ms });
  }

  function objetDe(c) {
    let o = objets.get(c);
    if (!o || o.fiche !== c.fiche) {
      if (o) scene.remove(o.g);
      // (étape 75) le numéro peint sur la tourelle : 1x pour les Bleus, 3x pour les Rouges (selon le nom du tank)
      const numero = (c.equipe === "bleus" ? 1 : 3) + "" + (1 + ([...c.nom].reduce((t, l) => t + l.charCodeAt(0), 0) % 9));
      o = Tanks.Chars3D.fabriquer(c.fiche, c.equipe, c.nom === "toi" ? "10" : numero);
      o.fiche = c.fiche;
      o.normale = new THREE.Vector3(0, 1, 0);
      o.brule = false;
      scene.add(o.g);
      objets.set(c, o);
    }
    return o;
  }

  const haut = new THREE.Vector3(0, 1, 0), qLacet = new THREE.Quaternion(), qPente = new THREE.Quaternion(), vn = new THREE.Vector3();
  function placer(o, c, dt) {
    // (étape 72) plus loin que la vue (dans le brouillard) : on ne le dessine pas
    const d = Math.hypot(c.x - cam.position.x, c.z - cam.position.z);
    o.g.visible = d < Q.vue + 20;
    if (!o.g.visible) return;
    const n = T.normale(c.x, c.z);
    o.normale.lerp(vn.set(n.x, n.y, n.z), Math.min(1, dt * 8)).normalize();
    o.g.position.set(c.x, c.y, c.z);
    qLacet.setFromAxisAngle(haut, -c.angle);
    qPente.setFromUnitVectors(haut, o.normale);
    o.g.quaternion.copy(qPente).multiply(qLacet);
    // (étape 72) loin de la caméra (ou détruit : ses roues ne tournent plus), les 18 roues sont remplacées par la pièce
    // soudée, qui ne tourne pas
    const loin = d > Q.roues || c.detruit;
    if (o.rouesFixes && o.loin !== loin) {
      o.loin = loin;
      o.rouesFixes.visible = loin;
      for (const r of o.roues) r.visible = !loin;
    }
    // (étape 75) de près, les vrais maillons de la chenille ; plus loin, la chenille « image »
    const maillons = !c.detruit && d < Q.roues * C.peinture.maillons;
    if (o.maillons && o.maillons.mesh.visible !== maillons) {
      o.maillons.mesh.visible = maillons;
      for (const ch of o.chenillesImages) ch.visible = !maillons;
    }
    if (maillons) {
      o.maillons.maj(c.chenilles.gauche, c.chenilles.droite);
      lod.maillons += o.maillons.nombre;
    }
    if (loin) lod.tanksRouesSoudees++;
    if (c.detruit) {
      if (!o.brule) {
        Tanks.Chars3D.bruler(o);
        o.brule = true;
      }
      return;
    }
    o.tourelle.rotation.y = -c.tourelle;
    o.canon.rotation.z = c.hausse;
    o.chenilles[0].map.offset.x = c.chenilles.gauche * (o.pasChenille || -0.2);
    o.chenilles[1].map.offset.x = c.chenilles.droite * (o.pasChenille || -0.2);
    if (loin) return;
    // les galets tournent, les chenilles défilent (chacune à sa vitesse quand le tank tourne)
    // (étape 70 : chaque roue tourne selon SA taille : le barbotin et la roue folle sont plus petits que les galets ;
    // les patins défilent tout autour de la boucle de la chenille, d'autant de « toiles » que de mètres parcourus)
    for (let i = 0; i < o.roues.length; i++) o.roues[i].rotation.y = -(i < o.roues.length / 2 ? c.chenilles.gauche : c.chenilles.droite) / (o.roues[i].userData.rayon || 0.38);
  }

  // ------------------------------------------------------------------ étape 61 : les soldats et les engins
  function soldat3d(s) {
    let o = dessinsSoldats.get(s);
    if (!o) {
      o = Tanks.Engins3D.soldat(s.equipe, s.joueur);
      scene.add(o.g);
      dessinsSoldats.set(s, o);
    }
    return o;
  }
  // (étape 72) Une silhouette (soldat loin) : on écrit sa place dans la liste des instances de son équipe.
  const m4 = new THREE.Matrix4(), qS = new THREE.Quaternion(), eS = new THREE.Euler(0, 0, 0, "YZX"), pS = new THREE.Vector3(), un = new THREE.Vector3(1, 1, 1);
  function poserSilhouette(s) {
    const tous = silhouettes[s.equipe];
    if (!tous || tous.count >= tous.instanceMatrix.count) return false;
    const k = s.mort ? Math.min(1, s.depuisMort * 2) : 0; // (à terre : couché sur le dos, comme le soldat détaillé)
    eS.set(0, -s.angle, k * (Math.PI / 2), "YZX");
    tous.setMatrixAt(tous.count++, m4.compose(pS.set(s.x, s.y + 0.12 * k, s.z), qS.setFromEuler(eS), un));
    return true;
  }
  function placerSoldat(o, s, cam, dt) {
    // (étape 72) loin de la caméra (plus loin que les silhouettes), on ne le dessine pas : il serait plus petit qu'un point
    const d = Math.hypot(s.x - cam.position.x, s.z - cam.position.z);
    const cache = s.dansUnEngin || d > Q.soldatSilhouette || (s.mort && s.depuisMort > 20);
    // assez loin (et pas toi, pas en parachute, pas à la nage) : une silhouette au lieu du squelette
    const silhouette = !cache && !s.joueur && !s.parachute && !s.nage && d > Q.soldatSimple && poserSilhouette(s);
    o.g.visible = !cache && !silhouette;
    if (s.joueur && Tanks.Armes3D.vue.actif) o.g.visible = false; // (demande 88 : à la première personne, tu vois tes mains et ton arme à part)
    if (cache) lod.soldatsCaches++;
    if (silhouette) lod.silhouettes++;
    if (!o.g.visible) {
      o.angleAvant = s.angle;
      return;
    }
    o.g.position.set(s.x, s.y, s.z);
    o.g.rotation.set(0, -s.angle, 0);
    // tourne-t-il sur place ? (alors ses pieds bougent un peu : avant, il glissait sur le sol en pivotant)
    const tourne = o.angleAvant !== undefined && dt > 0 && Math.abs(Math.atan2(Math.sin(s.angle - o.angleAvant), Math.cos(s.angle - o.angleAvant))) / dt > 0.6;
    o.angleAvant = s.angle;
    const pres = s.joueur || d < Q.soldatDetail;
    if (pres) lod.soldatsDetail++;
    else lod.soldatsSimples++;
    Tanks.Engins3D.animer(o, s, horloge, tourne, pres);
    if (o.parachute) o.parachute.visible = !!s.parachute;
  }
  function engin3d(e) {
    let o = dessinsEngins.get(e);
    if (!o) {
      o = Tanks.Engins3D.fabriquer(e.sorte, e.equipe);
      o.brule = false;
      scene.add(o.g);
      dessinsEngins.set(e, o);
    }
    return o;
  }
  // (étape 71) Une moto, un quad, un camion : posé sur la pente, tourné, PENCHÉ (roulis) et le nez levé (tangage).
  const qLocal = new THREE.Quaternion(), eLocal = new THREE.Euler(0, 0, 0, "XZY"), blanc = new THREE.Color(1, 1, 1), sombre = new THREE.Color(0.13, 0.12, 0.11);
  function placerVehicule(o, e, dt, original) {
    const d = Math.hypot(e.x - cam.position.x, e.z - cam.position.z);
    const n = T.normale(e.x, e.z);
    qLacet.setFromAxisAngle(haut, -e.angle);
    qPente.setFromUnitVectors(haut, vn.set(n.x, n.y, n.z));
    qLocal.setFromEuler(eLocal.set(e.roulis || 0, 0, e.tangage || 0, "XZY"));
    o.g.quaternion.copy(qPente).multiply(qLacet).multiply(qLocal);
    o.g.position.set(e.x, e.y, e.z);
    if (d > Q.vue + 20) {
      o.g.visible = false;
      lod.vehiculesCaches++;
      return;
    }
    // loin : la version simple (une instance de plus dans le lot de sa sorte et de son équipe)
    const lot = lotsSimples[e.sorte + ":" + e.equipe];
    if (d > Q.roues * C.vehicules.loin[e.sorte] && lot && lot.count < lot.instanceMatrix.count) {
      o.g.visible = false;
      lot.setMatrixAt(lot.count, m4.compose(o.g.position, o.g.quaternion, un));
      lot.setColorAt(lot.count++, e.detruit && !e.tombe ? sombre : blanc);
      lod.vehiculesSimples++;
      return;
    }
    o.g.visible = true;
    lod.vehiculesDetail++;
    if (e.detruit && !e.tombe) {
      if (!o.brule) (Tanks.Engins3D.bruler(o), (o.brule = true));
      if (o.pilote) o.pilote.visible = false;
      return;
    }
    if (o.brule) { // (un engin revenu au camp, tout neuf : on refait son dessin)
      scene.remove(o.g);
      dessinsEngins.delete(original || e);
      return;
    }
    // les roues tournent (chacune selon sa taille), les roues avant (et la fourche, le guidon) braquent
    o.dist += e.vitesse * dt;
    for (const r of o.roues) r.rotation.y = -o.dist / r.userData.rayon;
    if (o.braquage) o.braquage.rotation.y = -(e.braquage || 0);
    for (const p of o.pivots) p.rotation.y = -(e.braquage || 0);
    if (o.pilote) o.pilote.visible = !!(e.pilote || e.ia) && !e.tombe;
    if (o.passagers) o.passagers.visible = e.passagers > 0;
  }

  // (étape 73) Un hélico de transport : en vol, tourné et penché ; posé, comme la colline. Loin : la version simple.
  function placerHelico(o, e, dt, original) {
    const d = Math.hypot(e.x - cam.position.x, e.y - cam.position.y, e.z - cam.position.z);
    o.g.position.set(e.x, e.y, e.z);
    if (e.enVol || (e.detruit && e.chute && !e.chute.auSol)) o.g.rotation.set(e.roulis || 0, -e.angle, e.tangage || 0, "YXZ");
    else {
      const n = T.normale(e.x, e.z);
      qLacet.setFromAxisAngle(haut, -e.angle);
      qPente.setFromUnitVectors(haut, vn.set(n.x, n.y, n.z));
      o.g.quaternion.copy(qPente).multiply(qLacet);
    }
    if (d > Q.vue + 50) {
      o.g.visible = false;
      lod.helicosCaches++;
      return;
    }
    const lot = lotsSimples[e.sorte + ":" + e.equipe];
    if (d > Q.roues * C.helicosTransport.loin && lot && lot.count < lot.instanceMatrix.count) {
      o.g.visible = false;
      o.g.updateMatrix();
      lot.setMatrixAt(lot.count, o.g.matrix);
      lot.setColorAt(lot.count++, e.detruit ? sombre : blanc);
      lod.helicosSimples++;
      return;
    }
    o.g.visible = true;
    lod.helicosDetail++;
    if (e.detruit) {
      if (!o.brule) (Tanks.Engins3D.bruler(o), (o.brule = true));
      for (const c of o.cordes) c.visible = false;
      for (const f of o.flammes) f.visible = false;
      return;
    }
    if (o.brule) { // (un nouvel hélico est revenu au camp : on refait son dessin)
      scene.remove(o.g);
      dessinsEngins.delete(original || e);
      return;
    }
    // les rotors : les 2 du Chinook en sens inverse ; le rotor de queue du Black Hawk, beaucoup plus vite
    o.rotors.forEach((r, i) => (r.rotation.y = i ? -e.rotor : e.rotor));
    if (o.rotorQueue) o.rotorQueue.rotation.z = e.rotor * 4.5;
    // (étape 74) le rotor tourne vite (plus de 2 tours par seconde) ? un léger disque flou, comme sur une photo
    if (dt > 0) {
      o.toursRotor = Math.abs(e.rotor - (o.rotorAvant === undefined ? e.rotor : o.rotorAvant)) / dt / (Math.PI * 2);
      o.rotorAvant = e.rotor;
    }
    for (const f of o.flous) f.visible = (o.toursRotor || 0) > 2;
    // la rampe du Chinook : baissée au sol (on monte), à plat pour la corde, relevée en vol (étape 74 : fermée, elle
    // suit la pente du bas de la coque)
    if (o.rampe) {
      const voulu = e.cordesSorties ? 0 : !e.enVol ? 0.42 : -Tanks.Helicos3D.PENTE_RAMPE;
      o.angleRampe += (voulu - o.angleRampe) * Math.min(1, dt * 1.5);
      o.rampe.rotation.z = o.angleRampe;
    }
    if (o.passagers) o.passagers.visible = e.passagers > 0;
    // les 2 cordes, du point d'accroche jusqu'au sol
    const sol = T.hauteur(e.x, e.z), points = C.helicosTransport.cordes[e.sorte];
    o.cordes.forEach((c, k) => {
      c.visible = !!e.cordesSorties;
      if (c.visible) c.scale.y = Math.max(0.5, e.y + points[k][1] - sol);
    });
    o.flammes.forEach((f, k) => (f.visible = !!(e.portes && e.portes[k].tir > 0)));
  }

  // (étape 76) Un avion, le drone ou le Tigre : en vol, tourné et penché ; posé, comme la colline. Loin : la version simple.
  // Puis ce qui bouge : le train d'atterrissage, la verrière, la flamme, les missiles, les rotors, les hélices, la rampe.
  const vers = (a, b, pas) => (a < b ? Math.min(b, a + pas) : Math.max(b, a - pas)); // (aller doucement de a vers b)
  function placerAvion(o, e, dt, original) {
    const A = C.avions3d;
    o.g.visible = e.etat !== "attend" && e.etat !== "parti";
    o.g.position.set(e.x, e.y, e.z);
    if (e.enVol) o.g.rotation.set(e.roulis || 0, -e.angle, e.tangage || 0, "YXZ");
    else { // (au sol, il se penche comme la colline)
      const n = T.normale(e.x, e.z);
      qLacet.setFromAxisAngle(haut, -e.angle);
      qPente.setFromUnitVectors(haut, vn.set(n.x, n.y, n.z));
      o.g.quaternion.copy(qPente).multiply(qLacet);
    }
    if (!o.g.visible) return;
    const d = Math.hypot(e.x - cam.position.x, e.y - cam.position.y, e.z - cam.position.z);
    if (d > Q.vue + 50) {
      o.g.visible = false;
      lod.avionsCaches++;
      return;
    }
    const lot = lotsSimples[e.sorte + ":" + e.equipe];
    if (d > Q.roues * A.loin[e.sorte] && lot && lot.count < lot.instanceMatrix.count) {
      o.g.visible = false;
      o.g.updateMatrix();
      lot.setMatrixAt(lot.count, o.g.matrix);
      lot.setColorAt(lot.count++, e.detruit ? sombre : blanc);
      lod.avionsSimples++;
      return;
    }
    lod.avionsDetail++;
    if (e.detruit) {
      if (!o.brule) {
        Tanks.Engins3D.bruler(o);
        o.brule = true;
        for (const x of [o.flamme, o.lueur, o.flous]) if (x) x.visible = false;
      }
      return;
    }
    if (o.brule) { // (un engin remis à neuf : on refait son dessin)
      scene.remove(o.g);
      dessinsEngins.delete(original || e);
      return;
    }
    // les rotors et les hélices (et le disque flou quand ils tournent vite)
    if (dt > 0 && e.rotor !== undefined) {
      o.tours = Math.abs(e.rotor - (o.rotorAvant === undefined ? e.rotor : o.rotorAvant)) / dt / (Math.PI * 2);
      o.rotorAvant = e.rotor;
    }
    if (e.sorte === "helico") {
      o.rotor.rotation.y = e.rotor;
      o.rotorQueue.rotation.z = e.rotor * 1.7;
      o.flous.visible = (o.tours || 0) > A.flou;
    } else if (e.sorte === "drone") {
      o.helices.forEach((h, i) => (h.rotation.y = e.rotor * (i % 2 ? 2 : -2)));
      o.flous.visible = (o.tours || 0) * 2 > A.flou;
      o.grenades.forEach((g, i) => (g.visible = i < e.munitions)); // (les grenades qui restent)
    } else if (e.sorte === "transport") {
      o.helices.forEach((h) => (h.rotation.x += dt * 30 * h.userData.sens));
      // la rampe s'ouvre avant la zone de largage (tant qu'il reste des parachutistes, et un peu après le dernier)
      const dx = Math.abs(e.x - e.largage.x), ouvert = dx < A.rampe.distance && (e.restent > 0 || dx < 120);
      o.ouverture = vers(o.ouverture, ouvert ? 1 : 0, dt / A.rampe.duree);
      o.rampe.rotation.z = -Tanks.Avions3D.PENTE * (1 - o.ouverture);
      o.porteSoute.rotation.z = -Tanks.Avions3D.PENTE + 0.95 * o.ouverture;
    } else if (e.sorte === "avion" || e.sorte === "chasseur") {
      // le train : il rentre en vol (chaque jambe tourne autour de sa charnière), il sort au sol
      if (o.jambes.length) {
        o.sortie = !e.pilote ? 1 : vers(o.sortie, e.enVol ? 0 : 1, dt / A.train);
        for (const j of o.jambes) j.rotation.z = (1 - o.sortie) * (Math.PI / 2) * j.userData.sens;
        o.train.visible = o.sortie > 0.02;
      }
      // la verrière : ouverte quand l'avion est garé, vide ; elle se ferme quand tu montes
      if (o.verriere) {
        o.ouverture = vers(o.ouverture, e.pilote ? 0 : 1, dt / A.verriere);
        o.verriere.rotation.z = o.ouverture * 0.6;
      }
      if (o.pilote) o.pilote.visible = !!e.pilote;
      if (o.missiles) o.missiles.forEach((m, i) => (m.visible = i < e.munitions)); // (les missiles qui restent sous les ailes)
      // la flamme : plus longue quand il va vite (la postcombustion), elle tremble un peu
      const vMax = e.sorte === "avion" ? C.engins.avion.vitesse : 1;
      const p = e.sorte === "avion" ? Math.max(0, Math.min(1, (e.vitesse / vMax - A.postCombustion[0]) / (A.postCombustion[1] - A.postCombustion[0]))) : A.flammeChasseur;
      o.flamme.visible = !!e.pilote && p > 0.02;
      o.flamme.scale.set(p * (0.85 + Math.random() * 0.3), 0.9 + Math.random() * 0.15, 0.9 + Math.random() * 0.15);
      o.lueur.visible = !!e.pilote;
    }
  }

  function placerEngin(o, e, dt, original) {
    if (Tanks.Vehicules3D.sait(e.sorte)) return placerVehicule(o, e, dt, original); // (étape 71)
    if (Tanks.Helicos3D.sait(e.sorte)) return placerHelico(o, e, dt, original); // (étape 73)
    if (Tanks.Avions3D.sait(e.sorte)) return placerAvion(o, e, dt, original); // (étape 76)
    o.g.visible = e.etat !== "attend" && e.etat !== "parti";
    // (étape 72) plus loin que la vue (dans le brouillard) : pas dessiné
    if (o.g.visible && Math.hypot(e.x - cam.position.x, e.y - cam.position.y, e.z - cam.position.z) > Q.vue + 50) (o.g.visible = false), lod.enginsCaches++;
    o.g.position.set(e.x, e.y, e.z);
    o.g.rotation.set(e.roulis || 0, -e.angle, e.tangage || 0, "YXZ");
    if (e.sorte === "sousmarin") {
      // à la surface, il se balance un peu ; sous l'eau, il est calme (et penche le nez quand il plonge)
      const p = e.x * 0.1 + e.z * 0.07, surface = Math.max(0, 1 - e.profondeur / 1.5);
      o.g.rotation.set(Math.sin(horloge * 1.1 + p) * 0.02 * surface, -e.angle, (e.plongeVers || 0) * 0.06, "YXZ");
      o.g.position.y = e.y + Math.sin(horloge * 1.5 + p) * 0.06 * surface;
      o.helice.rotation.x += e.vitesse * dt * 2;
    } else if (e.sorte === "bateau") {
      // il se balance sur les vagues (et il penche en arrière quand il accélère : il « lève le nez »)
      const p = e.x * 0.1 + e.z * 0.07;
      o.g.rotation.set(Math.sin(horloge * 1.3 + p) * 0.035, -e.angle, Math.sin(horloge * 0.9 + p) * 0.025 + Math.min(1, Math.abs(e.vitesse) / 15) * 0.05, "YXZ");
      o.g.position.y = e.y + Math.sin(horloge * 1.7 + p) * 0.08;
      o.radar.rotation.y = horloge * 3;
    } else if (e.sorte === "jeep" || !e.enVol) { // (au sol, il se penche comme la colline, comme un tank)
      const n = T.normale(e.x, e.z);
      qLacet.setFromAxisAngle(haut, -e.angle);
      qPente.setFromUnitVectors(haut, vn.set(n.x, n.y, n.z));
      o.g.quaternion.copy(qPente).multiply(qLacet);
    }
    if (e.detruit) {
      if (!o.brule) (Tanks.Engins3D.bruler(o), (o.brule = true));
      return;
    }
    if (o.brule) { // (un engin remis à neuf : on refait son dessin)
      scene.remove(o.g);
      dessinsEngins.delete(original || e);
      return;
    }
    if (e.sorte === "bateau") o.tourelle.rotation.y = -e.tourelle;
    else if (e.sorte === "jeep") {
      o.tourelle.rotation.y = -e.tourelle;
      o.tour = (o.tour || 0) + (e.vitesse * dt) / 0.5;
      for (const r of o.roues) r.rotation.y = -o.tour;
    } else if (e.sorte === "dca") {
      o.tourelle.rotation.y = -e.tourelle;
      o.canons.rotation.z = e.hausse;
      o.flammes.forEach((f, i) => (f.visible = e.recharge > C.engins.dca.cadence * 0.5 && e.canon === i));
    }
  }
  // Les projectiles qui volent (sauf l'obus, qui a déjà son traceur dans les effets) : roquette, bombe, missile, grenade.
  const projectiles3d = [];
  function projectile3d(i) {
    if (!projectiles3d[i]) {
      const g = new THREE.Group(), corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.9, 4, 8), new THREE.MeshStandardMaterial({ color: 0x55605a, roughness: 0.5, metalness: 0.5 }));
      corps.rotation.z = Math.PI / 2;
      const feu = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb050 }));
      feu.position.x = -0.7;
      g.add(corps, feu);
      g.feu = feu;
      g.corps = corps;
      scene.add(g);
      projectiles3d[i] = g;
    }
    return projectiles3d[i];
  }
  const TAILLES = { roquette: 1, bombe: 1.6, missile: 1.5, grenade: 0.5, torpille: 1.8, flak: 0.35 };
  // (étape 75) La GRENADE À MAIN : un œuf vert olive (le corps quadrillé), la cuillère (le levier) et le bouchon. On la
  // dessine 2 fois plus grosse que la vraie (6 cm), sinon on ne la verrait pas voler. Elle tourne sur elle-même en l'air.
  const grenades3d = [];
  function grenade3d(i) {
    if (!grenades3d[i]) {
      const g = new THREE.Group(), olive = new THREE.MeshStandardMaterial({ color: 0x4a5532, roughness: 0.7, metalness: 0.2 }), metal = new THREE.MeshStandardMaterial({ color: 0x8a8c86, roughness: 0.35, metalness: 0.8 });
      const corps = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 9), olive);
      corps.scale.set(1, 1.12, 1);
      const bouchon = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.045, 8), metal);
      bouchon.position.y = 0.08;
      const cuillere = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.03), metal);
      cuillere.position.set(0.05, 0.035, 0);
      cuillere.rotation.z = -0.3;
      for (const m of [corps, bouchon, cuillere]) (m.castShadow = true), g.add(m);
      g.scale.setScalar(2);
      scene.add(g);
      grenades3d[i] = g;
    }
    return grenades3d[i];
  }
  function placerProjectiles(monde) {
    let n = 0, ng = 0;
    for (const p of monde.obus) {
      if (p.sorte === "obus") continue;
      if (p.main) { // (étape 75)
        const g = grenade3d(ng++);
        g.visible = true;
        g.position.set(p.x, p.y + 0.08, p.z);
        if (!p.auRepos) g.rotation.set(p.age * 11, p.age * 3, p.age * 7);
        continue;
      }
      const g = projectile3d(n++);
      g.visible = true;
      g.position.set(p.x, p.y, p.z);
      g.rotation.set(0, -Math.atan2(p.vz, p.vx), Math.atan2(p.vy, Math.hypot(p.vx, p.vz)), "YZX");
      g.scale.setScalar(TAILLES[p.sorte] || 1);
      g.feu.visible = p.sorte === "roquette" || p.sorte === "missile" || p.sorte === "flak"; // (les bombes tombent sans moteur ; la torpille fait des bulles)
    }
    for (let i = n; i < projectiles3d.length; i++) projectiles3d[i].visible = false;
    for (let i = ng; i < grenades3d.length; i++) grenades3d[i].visible = false;
  }

  // La caméra suit… ce que tu conduis (ou toi à pied).
  function suivi(monde) {
    const t = monde.toi;
    if (!t || t.mode === "char") {
      const j = vue(monde.joueur);
      return { x: j.x, y: j.y, z: j.z, angle: j.angle + j.tourelle, distance: 1, hauteur: 1, devant: 1, regardY: 2.5 };
    }
    if (t.mode === "pied") {
      const s = vue(t.soldat);
      if (s.nage) return { x: s.x, y: s.y, z: s.z, angle: s.angle, distance: 0.4, hauteur: 0.35, devant: 0.6, regardY: 1.3, cote: 0.6 };
      return { x: s.x, y: s.y, z: s.z, angle: s.angle, distance: 0.33, hauteur: 0.38, devant: 0.6, regardY: 1.6, cote: 0.9 };
    }
    const e = vue(t.engin);
    if (e.sorte === "dca") return { x: e.x, y: e.y, z: e.z, angle: e.angle + e.tourelle, distance: 0.5, hauteur: 0.4, devant: 1, regardY: 1.5 + Math.tan(Math.min(1.2, e.hausse)) * C.camera.regardDevant * 0.7 };
    if (e.sorte === "sousmarin") return { x: e.x, y: Math.max(e.y, C.lac.niveau - 1.3), z: e.z, angle: e.angle, distance: 1.5, hauteur: 0.75, devant: 1, regardY: 1.5 };
    if (e.sorte === "jeep") return { x: e.x, y: e.y, z: e.z, angle: e.angle + e.tourelle * 0.7, distance: 0.75, hauteur: 0.7, devant: 1, regardY: 2 };
    if (e.sorte === "moto") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 0.42, hauteur: 0.42, devant: 0.8, regardY: 1.4 }; // (étape 71)
    if (e.sorte === "quad") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 0.48, hauteur: 0.45, devant: 0.8, regardY: 1.3 };
    if (e.sorte === "camion") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.05, hauteur: 0.85, devant: 1, regardY: 2.6 };
    if (e.sorte === "bateau") return { x: e.x, y: e.y, z: e.z, angle: e.angle + e.tourelle, distance: 1.1, hauteur: 0.8, devant: 1, regardY: 2 };
    if (e.sorte === "avion") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.9, hauteur: 0.9, devant: 2, regardY: 2, sansSol: true, tangage: e.tangage };
    if (e.sorte === "drone") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 0.6, hauteur: 0.9, devant: 0.6, regardY: -2 };
    if (e.sorte === "chinook") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 2.4, hauteur: 1.5, devant: 1.2, regardY: -1 }; // (étape 73 : il est long !)
    if (e.sorte === "blackhawk") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.9, hauteur: 1.3, devant: 1.2, regardY: -1 };
    return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.4, hauteur: 1.1, devant: 1.2, regardY: -1 };
  }

  // (étape 63) La caméra ne doit pas passer derrière un mur : on regarde le long de la ligne entre toi et elle ; si
  // elle rentre dans une maison ou un muret, on l'avance jusque devant.
  // (Et pas non plus dans un tank ou un engin : quand tu sortais de ton tank, la caméra se retrouvait DANS le blindage.)
  function devantLesMurs(depart, oeil, monde, moi) {
    // (étape 75) les murs, les toits et les gravats : on demande à logique/structures.js ce que la ligne touche en premier
    // (une maison n'est plus un bloc plein : quand tu es DEDANS, la caméra reste dans la pièce, devant le mur)
    const m = Tanks.Structures.premier(depart.x, depart.y, depart.z, oeil.x, oeil.y, oeil.z);
    const tMur = m ? Math.max(0.08, m.t - 0.5 / Math.max(1, depart.distanceTo(oeil))) : 1;
    const vehicules = monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep" || e.sorte === "helico" || !e.enVol)).filter((c) => c !== moi && c.fiche && Math.hypot(c.x - oeil.x, c.z - oeil.z) < 25);
    for (let k = 1; vehicules.length && k <= 16 && k / 16 < tMur; k++) {
      const t = k / 16, x = depart.x + (oeil.x - depart.x) * t, y = depart.y + (oeil.y - depart.y) * t, z = depart.z + (oeil.z - depart.z) * t;
      if (vehicules.some((c) => Tanks.Obus.dansLeChar(c, x, y - 0.4, z) || Tanks.Obus.dansLeChar(c, x, y + 0.4, z))) return depart.clone().lerp(oeil, Math.max(0.08, (k - 1.5) / 16));
    }
    return tMur < 1 ? depart.clone().lerp(oeil, tMur) : oeil;
  }

  function dessiner(monde, dt, entreDeuxPas) {
    if (T.souterrain !== sousTerre) changerMonde(T.souterrain); // (étape 80)
    alpha = entreDeuxPas === undefined ? 1 : entreDeuxPas;
    for (const k in lod) lod[k] = 0; // (étape 72 : on recompte les niveaux de détail à chaque image)
    // on enlève les dessins des tanks qui n'existent plus (nouvelle bataille)
    const vivants = new Set(monde.chars);
    for (const [c, o] of objets) if (!vivants.has(c)) (scene.remove(o.g), objets.delete(c));
    if (monde.phase === "garage" && objets.size === 1) Tanks.Effets.effacer();
    for (const c of monde.chars) placer(objetDe(c), vue(c), dt);
    // étape 61 : les soldats, les engins, les projectiles (on enlève les dessins de ceux qui n'existent plus)
    const presents = new Set(monde.soldats.concat(monde.engins, monde.vehicules, monde.helicos || [], monde.bateaux, monde.sousMarins, monde.avions));
    for (const [x, o] of dessinsSoldats) if (!presents.has(x)) (scene.remove(o.g), dessinsSoldats.delete(x));
    for (const [x, o] of dessinsEngins) if (!presents.has(x)) (scene.remove(o.g), dessinsEngins.delete(x));
    horloge += dt;
    for (const k in lotsSimples) lotsSimples[k].count = 0; // (étape 71 : les versions simples, recomptées à chaque image)
    for (const e of monde.engins.concat(monde.vehicules, monde.helicos || [], monde.bateaux, monde.sousMarins, monde.avions)) placerEngin(engin3d(e), vue(e), dt, e);
    for (const k in lotsSimples) {
      const lot = lotsSimples[k];
      lot.visible = lot.count > 0 || !lot.userData.pret; // (première image : montré vide, pour préparer son programme de dessin)
      lot.userData.pret = true;
      if (lot.count) (lot.instanceMatrix.needsUpdate = true), (lot.instanceColor.needsUpdate = true);
    }
    // (étape 62) les portails : le tourbillon tourne, l'anneau brille plus fort quand quelqu'un vient de passer
    for (const p of monde.portails) {
      let o = dessinsPortails.get(p);
      if (!o) {
        o = Tanks.Engins3D.portail(p.couleur, C.portails.rayon);
        o.g.position.set(p.x, p.y - 0.2, p.z);
        o.g.rotation.y = -p.angle;
        scene.add(o.g);
        dessinsPortails.set(p, o);
        o.passages = p.passages;
        o.eclat = 0;
      }
      o.tourbillon.rotation.x = horloge * 2.5;
      if (p.passages !== o.passages) (o.passages = p.passages), (o.eclat = 1);
      o.eclat = Math.max(0, o.eclat - dt);
      o.anneau.material.emissiveIntensity = 1.4 + Math.sin(horloge * 4) * 0.3 + o.eclat * 4;
    }
    for (const equipe in silhouettes) silhouettes[equipe].count = 0;
    for (const s of monde.soldats) placerSoldat(soldat3d(s), vue(s), cam, dt);
    for (const equipe in silhouettes) {
      const tous = silhouettes[equipe];
      tous.visible = tous.count > 0 || !tous.userData.pret; // (première image : montré vide, pour préparer son programme de dessin)
      tous.userData.pret = true;
      if (tous.count) tous.instanceMatrix.needsUpdate = true;
    }
    placerProjectiles(monde);
    // la caméra
    const j = monde.joueur, R = C.camera;
    let oeil, cible;
    if (monde.phase === "garage") {
      const a = monde.temps * 0.35;
      oeil = new THREE.Vector3(j.x + Math.cos(a) * 15, j.y + 5, j.z + Math.sin(a) * 15);
      cible = new THREE.Vector3(j.x, j.y + 1.6, j.z);
      camera.pret = false;
    } else {
      const v = suivi(monde);
      // (étape 62) un portail t'a fait sauter très loin d'un coup ? la caméra saute aussi (sinon elle traverserait la carte)
      if (dernierSuivi && Math.hypot(v.x - dernierSuivi.x, v.z - dernierSuivi.z) > 30) (camera.pret = false), (camera.saut = true);
      dernierSuivi = { x: v.x, z: v.z };
      const voulu = v.angle;
      let diff = Math.atan2(Math.sin(voulu - camera.angle), Math.cos(voulu - camera.angle));
      camera.angle += diff * (camera.pret ? 1 - Math.exp(-R.souplesse * dt) : 1);
      camera.pret = true;
      const k = camera.mode === 1 ? 1.8 : 1, cx = Math.cos(camera.angle), cz = Math.sin(camera.angle);
      const cote = v.cote || 0; // (à pied, la caméra est un peu à droite : on voit par-dessus ton épaule)
      oeil = new THREE.Vector3(v.x - cx * R.distance * v.distance * k - cz * cote, v.y + R.hauteur * v.hauteur * k + (v.tangage ? -Math.sin(v.tangage) * 20 : 0), v.z - cz * R.distance * v.distance * k + cx * cote);
      const solOeil = T.hauteur(oeil.x, oeil.z); // (étape 80 : sous terre, un mur n'est pas un sol : la caméra reste sous le plafond)
      oeil.y = Math.max(oeil.y, sousTerre && solOeil > C.souterrain.plafond - 1 ? -1e9 : solOeil + (v.distance < 0.5 ? 1 : 2), T.distLac(oeil.x, oeil.z) < 1.1 ? C.lac.niveau + 1 : -1e9); // (jamais sous l'eau)
      const moi = !monde.toi || monde.toi.mode === "char" ? monde.joueur : monde.toi.engin;
      oeil = devantLesMurs(new THREE.Vector3(v.x, v.y + 1.6, v.z), oeil, monde, moi);
      cible = new THREE.Vector3(v.x + cx * R.regardDevant * v.devant, v.y + v.regardY + (v.tangage ? Math.sin(v.tangage) * 40 : 0), v.z + cz * R.regardDevant * v.devant);
    }
    // (étape 77) épaulé (V ou clic droit) : la caméra ZOOME selon le viseur de ton arme (une lunette ×6 : 6 fois plus près)
    const toiPied = monde.phase !== "garage" && monde.toi && monde.toi.mode === "pied" && monde.toi.soldat.armes ? monde.toi.soldat : null;
    const zoom = !toiPied ? 1 : 1 + ((toiPied.arme === "gadget" && toiPied.gadget.id === "jumelles" ? toiPied.gadget.fiche.zoom : toiPied.arme === "pistolet" || toiPied.arme === "principale" ? toiPied.armes[toiPied.arme].stats.zoom : 1) - 1) * (toiPied.visee || 0);
    if (Math.abs(cam.fov - C.camera.champ / zoom) > 0.01) (cam.fov = C.camera.champ / zoom), cam.updateProjectionMatrix();
    // (étape 79) dans la lunette, la caméra suit ta RESPIRATION (le « 8 » de logique/armes.js) : on la lit, sans rien changer
    const bal = (zoom > 2.5 && toiPied.balancement) || { x: 0, y: 0 }, aV = toiPied ? toiPied.angle + bal.x : 0;
    if (zoom > 2.5) oeil = new THREE.Vector3(toiPied.x, toiPied.y + 1.65, toiPied.z), (cible = new THREE.Vector3(toiPied.x + Math.cos(aV) * 50, toiPied.y + 1.55 + bal.y * 50, toiPied.z + Math.sin(aV) * 50)), (camera.saut = true);
    // (étape 78) la vue à la PREMIÈRE PERSONNE (touche C, à pied) : l'œil est dans la tête du soldat, un peu en avant ;
    // son corps est derrière et sous la caméra, on ne le voit pas, mais ses mains et son arme sont devant : on les voit.
    const P = C.premiere, enPremiere = camera.premiere && toiPied && zoom <= 2.5;
    if (enPremiere) {
      const ca = Math.cos(toiPied.angle), sa = Math.sin(toiPied.angle);
      oeil = new THREE.Vector3(toiPied.x + ca * P.avance, toiPied.y + P.oeil, toiPied.z + sa * P.avance);
      cible = new THREE.Vector3(oeil.x + ca * 10, oeil.y - P.baisse * 10, oeil.z + sa * 10);
      camera.saut = true;
    }
    // (étape 88) LA CAMÉRA DE CINÉMA de la campagne (le survol du début, le briefing, la fin) : elle passe avant tout
    plan = cinema ? cinema(monde, dt) : null;
    if (plan) (oeil = new THREE.Vector3(plan.oeil.x, plan.oeil.y, plan.oeil.z)), (cible = new THREE.Vector3(plan.cible.x, plan.cible.y, plan.cible.z)), (camera.saut = true);
    const proche = enPremiere || zoom > 2.5 ? P.proche : 0.3;
    if (cam.near !== proche) (cam.near = proche), cam.updateProjectionMatrix();
    cam.position.lerp(oeil, monde.phase === "garage" || camera.saut ? 1 : Math.min(1, dt * 14));
    camera.saut = false;
    cam.lookAt(cible);
    cam.updateMatrixWorld();
    const centre = plan ? plan.cible : monde.phase === "garage" ? j : suivi(monde); // (les ombres sont nettes autour de toi) (étape 88 : ou de ce que filme la caméra de cinéma)
    soleil.position.set(centre.x + SOLEIL.x * 200, centre.y + SOLEIL.y * 200, centre.z + SOLEIL.z * 200);
    soleil.target.position.set(centre.x, centre.y, centre.z);
    leCiel.position.copy(cam.position); // (étape 72 : le ciel suit la caméra)
    if (sousTerre) Tanks.Station3D.maj(dt, cam); // (étape 80 : les feux, la fumée, les néons qui clignotent ; le dehors n'est pas calculé)
    else {
    Tanks.Decor.majArbres(false);
    Tanks.Decor.majDistance(cam.position, Math.min(Q.decor, Q.vue), Q.arbresDetail); // (étape 72 : les morceaux et les arbres trop loin sont cachés ; étape 74 : les beaux arbres de près)
    Tanks.Decor.majHerbe(cam.position, Q.herbe || 0); // (étape 74 : les touffes d'herbe autour de la caméra)
    Tanks.Decor.majEau(dt);
    Tanks.Maisons3D.maj(dt, cam.position, Q.maisons); // (étape 75 : les morceaux de mur tombés, les débris qui volent, les toits qui s'effondrent ; la belle version de près)
    }
    Tanks.Effets.maj(dt, monde, cam, Q.effets);
    // (demande 88) l'arme vue à la première personne, la lampe qui éclaire, le laser (affichage/armes3d.js)
    Tanks.Armes3D.maj(monde, dt, cam, scene, !!(camera.premiere && toiPied));
    rendu.render(scene, cam);
    Tanks.Armes3D.dessinerVue(rendu); // (dessinée PAR-DESSUS le monde : elle ne rentre jamais dans un mur)
  }

  // Où tombe un point du monde sur l'écran ? (pour le tableau de bord : les noms et la vie au-dessus des tanks)
  const v = new THREE.Vector3();
  function versEcran(x, y, z, L, H) {
    v.set(x, y, z).project(cam);
    if (v.z > 1) return null;
    return { x: (v.x * 0.5 + 0.5) * L, y: (-v.y * 0.5 + 0.5) * H };
  }

  return { initialiser, dessiner, versEcran, appliquerQualite, lod, cinema: (f) => (cinema = f || null), get filme() { return !!plan; }, changerCamera: (aPied) => {
      // (étape 78) à pied, C passe de la vue de derrière à la vue dans les yeux ; dans un engin, C éloigne la caméra
      if (aPied) camera.premiere = !camera.premiere;
      else camera.mode = (camera.mode + 1) % 2;
      Tanks.Evenements.emettre("vue", { premiere: !!camera.premiere, aPied: !!aPied });
    },
    get vue() { return { premiere: !!camera.premiere, mode: camera.mode }; }, get infos() { return rendu ? rendu.info.render : {}; }, get sousTerre() { return sousTerre; }, get rendu() { return rendu; }, entreDeuxPas: () => alpha, dessins: () => ({ soldats: dessinsSoldats.size, engins: dessinsEngins.size, portails: dessinsPortails.size }) };
})();
