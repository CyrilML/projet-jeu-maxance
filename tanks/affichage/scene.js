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
// Étape 63 : chaque objet est dessiné ENTRE sa position d'avant et celle de maintenant (« interpolation ») : le jeu
// calcule 120 pas par seconde, mais l'écran n'affiche pas toujours ses images pile entre deux pas ; sans ça, ton
// personnage faisait de tout petits sauts. Et la caméra ne passe plus à travers les murs : elle s'avance devant.
// Comme tout l'affichage, ce fichier lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Scene = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let rendu, scene, cam, soleil;
  const objets = new Map(); // tank du monde → son dessin
  const dessinsSoldats = new Map(), dessinsEngins = new Map(); // (étape 61) soldat → dessin, engin → dessin
  const dessinsPortails = new Map(); // (étape 62)
  let horloge = 0, dernierSuivi = null, alpha = 1;
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
  function placerSoldat(o, s, cam, dt) {
    // loin de la caméra (plus de 250 m), on ne le dessine pas : il serait plus petit qu'un point
    const d = Math.hypot(s.x - cam.position.x, s.z - cam.position.z);
    o.g.visible = !s.dansUnEngin && d < 250 && !(s.mort && s.depuisMort > 20);
    if (!o.g.visible) return;
    o.g.position.set(s.x, s.y, s.z);
    o.g.rotation.set(0, -s.angle, 0);
    // tourne-t-il sur place ? (alors ses pieds bougent un peu : avant, il glissait sur le sol en pivotant)
    const tourne = o.angleAvant !== undefined && dt > 0 && Math.abs(Math.atan2(Math.sin(s.angle - o.angleAvant), Math.cos(s.angle - o.angleAvant))) / dt > 0.6;
    o.angleAvant = s.angle;
    Tanks.Engins3D.animer(o, s, horloge, tourne, s.joueur || d < C.soldats.detail);
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
  function placerEngin(o, e, dt, original) {
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
      qPente.setFromUnitVectors(haut, new THREE.Vector3(n.x, n.y, n.z));
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
    } else if (e.sorte === "helico") {
      o.rotor.rotation.y = e.rotor;
      o.rotorQueue.rotation.z = e.rotor * 1.7;
    } else if (e.sorte === "drone") {
      o.helices.forEach((h, i) => (h.rotation.y = e.rotor * (i % 2 ? 2 : -2)));
    } else if (e.sorte === "avion") {
      o.flamme.visible = e.pilote;
      o.flamme.scale.set(1, 0.8 + Math.random() * 0.4, 1);
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
  const TAILLES = { roquette: 1, bombe: 1.6, missile: 1.5, grenade: 0.5, torpille: 1.8 };
  function placerProjectiles(monde) {
    let n = 0;
    for (const p of monde.obus) {
      if (p.sorte === "obus") continue;
      const g = projectile3d(n++);
      g.visible = true;
      g.position.set(p.x, p.y, p.z);
      g.rotation.set(0, -Math.atan2(p.vz, p.vx), Math.atan2(p.vy, Math.hypot(p.vx, p.vz)), "YZX");
      g.scale.setScalar(TAILLES[p.sorte] || 1);
      g.feu.visible = p.sorte === "roquette" || p.sorte === "missile"; // (les bombes tombent sans moteur ; la torpille fait des bulles)
    }
    for (let i = n; i < projectiles3d.length; i++) projectiles3d[i].visible = false;
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
    if (e.sorte === "sousmarin") return { x: e.x, y: Math.max(e.y, C.lac.niveau - 1.3), z: e.z, angle: e.angle, distance: 1.5, hauteur: 0.75, devant: 1, regardY: 1.5 };
    if (e.sorte === "jeep") return { x: e.x, y: e.y, z: e.z, angle: e.angle + e.tourelle * 0.7, distance: 0.75, hauteur: 0.7, devant: 1, regardY: 2 };
    if (e.sorte === "bateau") return { x: e.x, y: e.y, z: e.z, angle: e.angle + e.tourelle, distance: 1.1, hauteur: 0.8, devant: 1, regardY: 2 };
    if (e.sorte === "avion") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.9, hauteur: 0.9, devant: 2, regardY: 2, sansSol: true, tangage: e.tangage };
    if (e.sorte === "drone") return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 0.6, hauteur: 0.9, devant: 0.6, regardY: -2 };
    return { x: e.x, y: e.y, z: e.z, angle: e.angle, distance: 1.4, hauteur: 1.1, devant: 1.2, regardY: -1 };
  }

  // (étape 63) La caméra ne doit pas passer derrière un mur : on regarde le long de la ligne entre toi et elle ; si
  // elle rentre dans une maison ou un muret, on l'avance jusque devant.
  // (Et pas non plus dans un tank ou un engin : quand tu sortais de ton tank, la caméra se retrouvait DANS le blindage.)
  function devantLesMurs(depart, oeil, monde, moi) {
    const proches = T.boites.filter((b) => Math.abs(b.x - oeil.x) < b.rayon + 20 && Math.abs(b.z - oeil.z) < b.rayon + 20);
    const vehicules = monde.chars.concat(monde.engins.filter((e) => e.sorte === "jeep" || e.sorte === "helico" || !e.enVol)).filter((c) => c !== moi && c.fiche && Math.hypot(c.x - oeil.x, c.z - oeil.z) < 25);
    if (!proches.length && !vehicules.length) return oeil;
    for (let k = 1; k <= 16; k++) {
      const t = k / 16, x = depart.x + (oeil.x - depart.x) * t, y = depart.y + (oeil.y - depart.y) * t, z = depart.z + (oeil.z - depart.z) * t;
      const mur = proches.some((b) => y < b.sol + b.h + 0.3 && T.dansBoite(b, x, z, 0.4));
      const blinde = vehicules.some((c) => Tanks.Obus.dansLeChar(c, x, y - 0.4, z) || Tanks.Obus.dansLeChar(c, x, y + 0.4, z));
      if (mur || blinde) return depart.clone().lerp(oeil, Math.max(0.08, (k - 1.5) / 16));
    }
    return oeil;
  }

  function dessiner(monde, dt, entreDeuxPas) {
    alpha = entreDeuxPas === undefined ? 1 : entreDeuxPas;
    // on enlève les dessins des tanks qui n'existent plus (nouvelle bataille)
    const vivants = new Set(monde.chars);
    for (const [c, o] of objets) if (!vivants.has(c)) (scene.remove(o.g), objets.delete(c));
    if (monde.phase === "garage" && objets.size === 1) Tanks.Effets.effacer();
    for (const c of monde.chars) placer(objetDe(c), vue(c), dt);
    // étape 61 : les soldats, les engins, les projectiles (on enlève les dessins de ceux qui n'existent plus)
    const presents = new Set(monde.soldats.concat(monde.engins, monde.bateaux, monde.sousMarins));
    for (const [x, o] of dessinsSoldats) if (!presents.has(x)) (scene.remove(o.g), dessinsSoldats.delete(x));
    for (const [x, o] of dessinsEngins) if (!presents.has(x)) (scene.remove(o.g), dessinsEngins.delete(x));
    horloge += dt;
    for (const e of monde.engins.concat(monde.bateaux, monde.sousMarins)) placerEngin(engin3d(e), vue(e), dt, e);
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
    for (const s of monde.soldats) placerSoldat(soldat3d(s), vue(s), cam, dt);
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
      oeil.y = Math.max(oeil.y, T.hauteur(oeil.x, oeil.z) + (v.distance < 0.5 ? 1 : 2), T.distLac(oeil.x, oeil.z) < 1.1 ? C.lac.niveau + 1 : -1e9); // (jamais sous l'eau)
      const moi = !monde.toi || monde.toi.mode === "char" ? monde.joueur : monde.toi.engin;
      oeil = devantLesMurs(new THREE.Vector3(v.x, v.y + 1.6, v.z), oeil, monde, moi);
      cible = new THREE.Vector3(v.x + cx * R.regardDevant * v.devant, v.y + v.regardY + (v.tangage ? Math.sin(v.tangage) * 40 : 0), v.z + cz * R.regardDevant * v.devant);
    }
    cam.position.lerp(oeil, monde.phase === "garage" || camera.saut ? 1 : Math.min(1, dt * 14));
    camera.saut = false;
    cam.lookAt(cible);
    cam.updateMatrixWorld();
    const centre = monde.phase === "garage" ? j : suivi(monde); // (les ombres sont nettes autour de toi)
    soleil.position.set(centre.x + SOLEIL.x * 200, centre.y + SOLEIL.y * 200, centre.z + SOLEIL.z * 200);
    soleil.target.position.set(centre.x, centre.y, centre.z);
    Tanks.Decor.majArbres(false);
    Tanks.Decor.majEau(dt);
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

  return { initialiser, dessiner, versEcran, changerCamera: () => (camera.mode = (camera.mode + 1) % 2), get infos() { return rendu ? rendu.info.render : {}; }, entreDeuxPas: () => alpha, dessins: () => ({ soldats: dessinsSoldats.size, engins: dessinsEngins.size, portails: dessinsPortails.size }) };
})();
