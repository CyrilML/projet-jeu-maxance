// 🎆 LES EFFETS : l'artificier du cinéma (étape 60)
//
// Tout ce qui explose, fume et brille, sans changer les règles du jeu :
//   - le DÉPART DU COUP : une boule de feu au bout du canon, et un nuage de fumée et de poussière autour du tank ;
//   - les OBUS en vol : un trait lumineux orange (un « traceur »), pour qu'on les voie voler et retomber ;
//   - l'IMPACT : de la terre qui gicle (sur le sol), des étincelles (sur un tank), de la poussière de pierre (un mur) ;
//   - l'EXPLOSION d'un tank détruit : une grosse boule de feu, des débris qui volent, puis une fumée noire qui monte
//     longtemps de l'épave ;
//   - la POUSSIÈRE derrière les chenilles quand un tank roule vite ;
//   - (étape 61) les BALLES : un trait jaune très court entre l'arme et là où elle arrive ; un petit nuage rouge
//     quand un soldat est touché ; les explosions des BOMBES et des MISSILES, bien plus grosses que celle d'un obus ;
//     la fumée de la ROQUETTE et du MISSILE en vol ;
//   - (étape 62) la GERBE D'EAU quand un obus tombe dans le lac, l'écume du SILLAGE derrière les bateaux, et un ÉCLAIR
//     de la couleur du portail à l'entrée et à la sortie quand quelqu'un passe un portail ;
//   - (étape 63) les BULLES d'un sous-marin qui avance sous l'eau (c'est comme ça qu'on le repère !), la traînée de
//     bulles d'une torpille, et la grosse vague quand un sous-marin remonte à la surface ;
//   - (étape 64) les petits nuages NOIRS des obus de DCA qui éclatent dans le ciel, la boule de feu d'un avion abattu, sa
//     traînée de fumée pendant qu'il tombe, et le grand « boum » quand il s'écrase.
// Ce sont des « particules » : des petites images toujours tournées vers la caméra (des sprites), qui naissent,
// grossissent, montent, s'effacent et meurent. On en a 300, qu'on réutilise sans arrêt.
// Étape 72 (« ça rame ») : avant, chaque particule était un objet à part : 300 particules = 300 dessins demandés à la
// carte graphique ! Maintenant elles sont toutes dans UN SEUL objet (des « instances » : la même petite image carrée
// recopiée à 300 endroits), plus un deuxième pour celles qui brillent (le feu). Et on ne fait pas de fumée trop loin
// de la caméra (on ne la verrait presque pas) : la distance est réglée par le régulateur de qualité.
// (étape 71) la poussière derrière les motos, les quads et les camions ; une explosion plus petite pour une moto ou un
// quad (« petit »), et un petit nuage quand un camion fait descendre ses soldats.
// (étape 73) la poussière soulevée par le souffle des rotors d'un hélico de transport qui vole bas, et la fumée d'un
// hélico abattu qui tombe.
// (étape 75) l'explosion d'une GRENADE (de la terre qui gicle, un éclair, un anneau de poussière), et la poussière des
// murs touchés (affichage/maisons3d.js s'en sert aussi : « particule »).
// Il écoute la radio (tir, impact, touche, detruit) pour savoir quand faire des effets.

window.Tanks = window.Tanks || {};

Tanks.Effets = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let scene, particules = [], traceurs = [], lumiere, prochaine = 0;
  let lotFumee = null, lotFeu = null; // (étape 72) les deux objets qui dessinent toutes les particules
  const camera = { x: 0, y: 0, z: 0, connue: false }, reglage = { distance: Infinity }; // (étape 72) où est la caméra, jusqu'où faire des effets
  const balles = []; // (étape 61) les traits des balles : { ligne, reste }
  const epaves = []; // les tanks qui brûlent (la fumée sort de là)
  const bilan = { vivantes: 0, traceurs: 0, epaves: 0, balles: 0, tropLoin: 0 };
  const GROS = { obus: 1, roquette: 1, grenade: 1.2, missile: 2, bombe: 2.8, torpille: 2.2 }; // la taille de l'explosion

  // (étape 72) Un LOT de particules : un petit carré (2 triangles) recopié autant de fois qu'il y a de particules.
  // Pour chaque copie, on donne son centre, sa taille, sa couleur et sa transparence. Le carré est toujours tourné vers
  // la caméra, et on y peint un rond flou (blanc au milieu, transparent au bord) : c'est la boule de fumée.
  function lot(max, brille) {
    const carre = new THREE.PlaneGeometry(1, 1), geo = new THREE.InstancedBufferGeometry();
    geo.index = carre.index;
    geo.setAttribute("position", carre.attributes.position);
    const attribut = (n) => new THREE.InstancedBufferAttribute(new Float32Array(max * n), n).setUsage(THREE.DynamicDrawUsage);
    const centres = attribut(3), teintes = attribut(4), tailles = attribut(1);
    geo.setAttribute("centre", centres);
    geo.setAttribute("teinte", teintes);
    geo.setAttribute("taille", tailles);
    geo.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(THREE.UniformsLib.fog), fog: true,
      transparent: true, depthWrite: false, blending: brille ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: [
        "attribute vec3 centre; attribute vec4 teinte; attribute float taille;",
        "varying vec4 vTeinte; varying vec2 vCoin;",
        "#include <fog_pars_vertex>",
        "void main() {",
        "  vTeinte = teinte; vCoin = position.xy;",
        "  vec4 mvPosition = modelViewMatrix * vec4(centre, 1.0);", // le centre, vu par la caméra…
        "  mvPosition.xy += position.xy * taille;", // …et le coin du carré, écarté de la taille de la particule
        "  gl_Position = projectionMatrix * mvPosition;",
        "  #include <fog_vertex>",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec4 vTeinte; varying vec2 vCoin;",
        "#include <fog_pars_fragment>",
        "void main() {",
        "  float d = length(vCoin) * 2.0;", // 0 au milieu, 1 sur le bord du rond
        "  float a = d < 0.5 ? mix(0.9, 0.35, clamp((d - 0.06) / 0.44, 0.0, 1.0)) : mix(0.35, 0.0, clamp((d - 0.5) / 0.5, 0.0, 1.0));",
        "  gl_FragColor = vec4(vTeinte.rgb, a * vTeinte.a);",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "  #include <fog_fragment>",
        "}",
      ].join("\n"),
    });
    const objet = new THREE.Mesh(geo, mat);
    objet.frustumCulled = false;
    objet.visible = false;
    objet.renderOrder = brille ? 3 : 2;
    scene.add(objet);
    return { objet, geo, centres, teintes, tailles, n: 0 };
  }

  function initialiser(s) {
    scene = s;
    lotFumee = lot(C.effets.particules, false);
    lotFeu = lot(C.effets.particules, true);
    for (let i = 0; i < C.effets.particules; i++) {
      particules.push({ vivante: false, x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, age: 0, vie: 1, vx: 0, vy: 0, vz: 0, t0: 1, t1: 2, op: 0.5, gravite: 0, feu: false });
    }
    // le traceur d'un obus : un petit bâton lumineux
    const geo = new THREE.CylinderGeometry(0.09, 0.09, 3.2, 6);
    geo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffb040 }));
      m.visible = false;
      scene.add(m);
      traceurs.push(m);
    }
    lumiere = new THREE.PointLight(0xffa040, 0, 40, 2);
    scene.add(lumiere);
    const radio = Tanks.Evenements;
    radio.ecouter("tir-bateau", (d) => { // (étape 62) le coup de canon d'un bateau
      for (let k = 0; k < 5; k++) particule(d.x, d.y, d.z, d.dir.x * 5 + alea(2), d.dir.y * 5 + alea(1), d.dir.z * 5 + alea(2), 0.25, 1.2, 3, 0.9, [1, 0.75, 0.35], true);
      for (let k = 0; k < 6; k++) particule(d.x + alea(1), d.y, d.z + alea(1), alea(2), 0.8, alea(2), 1.6, 2, 6, 0.4, [0.8, 0.8, 0.78]);
      flash(d.x, d.y, d.z, 20);
    });
    radio.ecouter("abattu", (d) => {
      for (let k = 0; k < 24; k++) particule(d.x, d.y, d.z, alea(10), alea(8), alea(10), 0.8 + Math.random() * 0.5, 3, 12, 1, [1, 0.6, 0.2], true);
      flash(d.x, d.y, d.z, 120);
    });
    radio.ecouter("crash", (d) => {
      for (let k = 0; k < 30; k++) particule(d.x, d.y + 2, d.z, alea(9), 5 + Math.random() * 10, alea(9), 1 + Math.random() * 0.6, 4, 14, 1, d.dansLEau ? [0.92, 0.96, 1] : [1, 0.6, 0.2], !d.dansLEau, 4);
      for (let k = 0; k < 20; k++) particule(d.x, d.y + 1, d.z, alea(5), 3, alea(5), 3.5, 5, 16, 0.6, [0.15, 0.14, 0.13]);
      flash(d.x, d.y + 3, d.z, 100);
      if (!d.dansLEau) epaves.push({ x: d.x, y: d.y - 1.5, z: d.z, age: 15, reste: 0 }); // (l'épave fume un peu)
    });
    radio.ecouter("surface", (d) => { // (étape 63) un sous-marin crève la surface
      for (let k = 0; k < 30; k++) particule(d.x + alea(6), C.lac.niveau + 0.3, d.z + alea(6), alea(2), 2 + Math.random() * 3, alea(2), 1.4, 1, 4, 0.7, [0.92, 0.96, 1], false, 9.8);
    });
    radio.ecouter("portail", (d) => {
      for (const [p, c] of [[d, d.couleur], [d.sortie, d.couleurSortie]]) {
        const col = new THREE.Color(c);
        for (let k = 0; k < 18; k++) particule(p.x + alea(2), p.y + 1 + Math.random() * 7, p.z + alea(2), alea(4), alea(3), alea(4), 0.7, 0.6, 2.5, 1, [col.r, col.g, col.b], true);
      }
      flash(d.sortie.x, d.sortie.y + 4, d.sortie.z, 40);
    });
    radio.ecouter("tir", (d) => {
      for (let k = 0; k < 6; k++) particule(d.x, d.y, d.z, d.dir.x * 6 + alea(2), d.dir.y * 6 + alea(1), d.dir.z * 6 + alea(2), 0.25, 1.5, 4, 0.9, [1, 0.75, 0.35], true);
      for (let k = 0; k < 10; k++) particule(d.x + alea(2), d.y - 1, d.z + alea(2), alea(3), 1 + Math.random(), alea(3), 1.8, 3, 8, 0.45, [0.75, 0.72, 0.65]);
      flash(d.x, d.y, d.z, 30);
    });
    radio.ecouter("impact", (d) => {
      const terre = d.sur === "sol", pierre = d.sur === "maison" || d.sur === "muret", g = GROS[d.sorte] || 1;
      if (d.sur === "air") { // (étape 64) un obus de DCA éclate : un petit nuage noir, et un éclair
        for (let k = 0; k < 5; k++) particule(d.x + alea(1.5), d.y + alea(1.5), d.z + alea(1.5), alea(1), alea(1), alea(1), 2.5, 2, 6, 0.75, [0.12, 0.12, 0.12]);
        particule(d.x, d.y, d.z, 0, 0, 0, 0.15, 1.5, 4, 1, [1, 0.8, 0.4], true);
        return;
      }
      if (d.sur === "eau") { // (étape 62) une gerbe d'eau : de l'écume blanche qui monte haut et retombe
        for (let k = 0; k < 22 * g; k++) particule(d.x + alea(g), d.y + 0.2, d.z + alea(g), alea(2.5 * g), 6 + Math.random() * 9 * g, alea(2.5 * g), 1.2 + Math.random() * 0.6, 0.8, 3 * g, 0.9, [0.92, 0.96, 1], false, 9.8);
        for (let k = 0; k < 6; k++) particule(d.x, d.y + 0.3, d.z, alea(3), 0.3, alea(3), 2, 2, 7 * g, 0.5, [0.85, 0.9, 0.92]);
        return;
      }
      if (d.sorte === "grenade" && d.grenade) { // (étape 75) une grenade à main : un éclair, de la terre, un anneau de poussière
        for (let k = 0; k < 16; k++) particule(d.x, d.y + 0.2, d.z, alea(5), 3 + Math.random() * 7, alea(5), 1 + Math.random() * 0.6, 0.6, 2.2, 0.9, [0.38, 0.3, 0.2], false, 9.8);
        for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; particule(d.x, d.y + 0.3, d.z, Math.cos(a) * 6, 0.4, Math.sin(a) * 6, 1.6, 1, 4, 0.5, [0.62, 0.58, 0.5]); }
        for (let k = 0; k < 8; k++) particule(d.x, d.y + 0.6, d.z, alea(2.5), 1 + Math.random() * 2, alea(2.5), 0.35 + Math.random() * 0.2, 1.5, 3.2, 1, [1, 0.62, 0.25], true);
        for (let k = 0; k < 5; k++) particule(d.x, d.y + 1, d.z, alea(1), 1.2, alea(1), 3, 2, 6, 0.45, [0.25, 0.23, 0.21]);
        flash(d.x, d.y + 1, d.z, 25);
        return;
      }
      const couleur = terre ? [0.42, 0.33, 0.22] : pierre ? [0.7, 0.66, 0.58] : [1, 0.8, 0.4];
      for (let k = 0; k < 14 * g; k++) particule(d.x, d.y + 0.3, d.z, alea(5 * g), 3 + Math.random() * 6 * g, alea(5 * g), 1.1 + Math.random(), 1, 4.5 * g, 0.85, couleur, !terre && !pierre, terre ? 9.8 : 0);
      for (let k = 0; k < 5 * g; k++) particule(d.x, d.y + 0.5, d.z, alea(g), 1.5, alea(g), 2.2, 2, 6 * g, 0.4, [0.6, 0.58, 0.54]);
      if (g > 1.1) for (let k = 0; k < 8 * g; k++) particule(d.x, d.y + 1, d.z, alea(4 * g), 2 + Math.random() * 4 * g, alea(4 * g), 0.6 + Math.random() * 0.4, 2, 5 * g, 1, [1, 0.6, 0.2], true); // la boule de feu
      flash(d.x, d.y + 1, d.z, 12 * g * g);
    });
    // étape 61 : les balles (un trait jaune), et le sang… non : un petit nuage de poussière rouge, quand un soldat est touché
    const geoBalle = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
    for (let i = 0; i < 40; i++) {
      const l = new THREE.Line(geoBalle.clone(), new THREE.LineBasicMaterial({ color: 0xffe080, transparent: true, opacity: 0.9 }));
      l.visible = false;
      l.frustumCulled = false;
      scene.add(l);
      balles.push({ l, reste: 0 });
    }
    let prochaineBalle = 0;
    radio.ecouter("balle", (d) => {
      const b = balles[prochaineBalle];
      prochaineBalle = (prochaineBalle + 1) % balles.length;
      const pos = b.l.geometry.attributes.position;
      // (on ne montre qu'un bout du trajet : la balle va si vite qu'on ne voit qu'un trait)
      const t0 = Math.random() * 0.3, t1 = t0 + 0.5;
      pos.setXYZ(0, d.de.x + (d.a.x - d.de.x) * t0, d.de.y + (d.a.y - d.de.y) * t0, d.de.z + (d.a.z - d.de.z) * t0);
      pos.setXYZ(1, d.de.x + (d.a.x - d.de.x) * t1, d.de.y + (d.a.y - d.de.y) * t1, d.de.z + (d.a.z - d.de.z) * t1);
      pos.needsUpdate = true;
      b.l.visible = true;
      b.reste = 0.06;
      if (d.ricochet) for (let k = 0; k < 3; k++) particule(d.a.x, d.a.y, d.a.z, alea(4), alea(4), alea(4), 0.15, 0.2, 0.3, 1, [1, 0.85, 0.5], true);
      else if (!d.touche) particule(d.a.x, T.hauteur(d.a.x, d.a.z) + 0.2, d.a.z, alea(0.5), 1, alea(0.5), 0.5, 0.3, 1, 0.5, [0.5, 0.42, 0.3]);
    });
    radio.ecouter("soldat-mort", (d) => {
      for (let k = 0; k < 4; k++) particule(d.x, d.y + 0.8, d.z, alea(1), 0.8, alea(1), 1.2, 0.6, 2, 0.4, [0.55, 0.5, 0.42]);
    });
    radio.ecouter("camion-decharge", (d) => {
      for (let k = 0; k < 5; k++) particule(d.x + alea(2), T.hauteur(d.x, d.z) + 0.3, d.z + alea(2), alea(1), 0.5, alea(1), 1.2, 1, 3, 0.3, [0.62, 0.56, 0.44]);
    });
    radio.ecouter("detruit", (d) => {
      if (d.petit) { // (étape 71 : une moto, un quad : une petite explosion, et l'épave fume moins longtemps)
        for (let k = 0; k < 12; k++) particule(d.x, d.y + 0.8, d.z, alea(4), 3 + Math.random() * 4, alea(4), 0.7 + Math.random() * 0.4, 1.5, 5, 1, [1, 0.6, 0.2], true, 3);
        flash(d.x, d.y + 1, d.z, 40);
        epaves.push({ x: d.x, y: d.y - 1.2, z: d.z, age: 18, reste: 0 });
        return;
      }
      for (let k = 0; k < 26; k++) particule(d.x, d.y + 1.5, d.z, alea(7), 4 + Math.random() * 8, alea(7), 0.9 + Math.random() * 0.6, 3, 10, 1, [1, 0.6, 0.2], true, 3);
      for (let k = 0; k < 20; k++) particule(d.x, d.y + 1, d.z, alea(4), 2 + Math.random() * 3, alea(4), 3, 4, 12, 0.6, [0.15, 0.14, 0.13]);
      flash(d.x, d.y + 2, d.z, 80);
      epaves.push({ x: d.x, y: d.y, z: d.z, age: 0, reste: 0 });
    });
  }
  const alea = (f) => (Math.random() * 2 - 1) * f;

  function particule(x, y, z, vx, vy, vz, vie, t0, t1, op, couleur, feu, gravite) {
    // (étape 72) trop loin de la caméra ? on ne la fait pas (on ne la verrait presque pas)
    if (camera.connue) {
      const dx = x - camera.x, dy = y - camera.y, dz = z - camera.z;
      if (dx * dx + dy * dy + dz * dz > reglage.distance * reglage.distance) {
        bilan.tropLoin++;
        return;
      }
    }
    let p = null;
    for (let k = 0; k < particules.length; k++) {
      const q = particules[(prochaine + k) % particules.length];
      if (!q.vivante) {
        p = q;
        prochaine = (prochaine + k + 1) % particules.length;
        break;
      }
    }
    if (!p) {
      p = particules[prochaine];
      prochaine = (prochaine + 1) % particules.length;
    }
    (p.age = 0), (p.vie = vie), (p.vx = vx), (p.vy = vy), (p.vz = vz), (p.t0 = t0), (p.t1 = t1), (p.op = op), (p.feu = !!feu), (p.gravite = gravite || 0);
    (p.r = couleur[0]), (p.g = couleur[1]), (p.b = couleur[2]);
    (p.x = x), (p.y = y), (p.z = z);
    p.vivante = true;
  }

  let flashReste = 0;
  function flash(x, y, z, force) {
    lumiere.position.set(x, y, z);
    lumiere.intensity = force;
    flashReste = 0.12;
  }

  // Chaque image : les particules vieillissent, les obus ont leur traceur, les épaves fument, les tanks soulèvent
  // de la poussière.
  function maj(dt, monde, cam, distance) {
    if (cam) (camera.x = cam.position.x), (camera.y = cam.position.y), (camera.z = cam.position.z), (camera.connue = true);
    if (distance) reglage.distance = distance;
    if (flashReste > 0) {
      flashReste -= dt;
      if (flashReste <= 0) lumiere.intensity = 0;
    }
    // la fumée noire des épaves (de moins en moins, pendant 60 s), et la poussière des chenilles
    for (const e of epaves) {
      e.age += dt;
      e.reste += dt * Math.max(0.5, 7 - e.age * 0.1);
      while (e.reste > 1) {
        e.reste -= 1;
        const feu = e.age < 25 && Math.random() < 0.35;
        particule(e.x + alea(1), e.y + 2.2, e.z + alea(1), alea(0.6) + 1.2, 2 + Math.random(), alea(0.6) + 0.4, feu ? 0.6 : 4, feu ? 1 : 2, feu ? 2 : 9, feu ? 0.9 : 0.55, feu ? [1, 0.5, 0.15] : [0.12, 0.11, 0.1], feu);
      }
    }
    bilan.epaves = epaves.length;
    for (const c of monde.chars) {
      if (c.detruit || Math.abs(c.vitesse) < 5 || Math.random() > dt * 18) continue;
      const ar = -c.fiche.longueur / 2, ca = Math.cos(c.angle), sa = Math.sin(c.angle);
      particule(c.x + ca * ar + alea(1.5), c.y + 0.4, c.z + sa * ar + alea(1.5), alea(0.8), 0.6, alea(0.8), 1.6, 1.5, 5, 0.35, [0.62, 0.56, 0.44]);
    }
    let vivantes = 0;
    lotFumee.n = lotFeu.n = 0;
    for (const p of particules) {
      if (!p.vivante) continue;
      p.age += dt;
      if (p.age >= p.vie) {
        p.vivante = false;
        continue;
      }
      vivantes++;
      const t = p.age / p.vie;
      p.vy -= p.gravite * dt;
      p.vx *= 1 - dt * 0.8;
      p.vz *= 1 - dt * 0.8;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      // on la range dans son lot (la fumée, ou le feu qui brille) : centre, taille, couleur et transparence
      const L = p.feu ? lotFeu : lotFumee, i = L.n++;
      L.centres.array[i * 3] = p.x;
      L.centres.array[i * 3 + 1] = p.y;
      L.centres.array[i * 3 + 2] = p.z;
      L.tailles.array[i] = p.t0 + (p.t1 - p.t0) * Math.sqrt(t);
      L.teintes.array[i * 4] = p.r;
      L.teintes.array[i * 4 + 1] = p.g;
      L.teintes.array[i * 4 + 2] = p.b;
      L.teintes.array[i * 4 + 3] = p.op * (1 - t) * Math.min(1, t * 10);
    }
    for (const L of [lotFumee, lotFeu]) {
      L.geo.instanceCount = L.n;
      L.objet.visible = L.n > 0 || !L.pret; // (la toute première image, on le montre vide : la carte graphique prépare son
      L.pret = true; //                       « programme » de dessin tout de suite, et pas pendant la première explosion)
      if (L.n) L.centres.needsUpdate = L.tailles.needsUpdate = L.teintes.needsUpdate = true;
    }
    bilan.vivantes = vivantes;
    // les traceurs des obus en vol (les roquettes et les missiles laissent une traînée de fumée)
    let n = 0;
    for (const o of monde.obus) {
      if (o.sorte === "torpille") { // des bulles qui remontent
        if (Math.random() < dt * 30) particule(o.x + alea(0.4), C.lac.niveau + 0.05, o.z + alea(0.4), alea(0.3), 0.3, alea(0.3), 1.5, 0.4, 1.4, 0.6, [0.9, 0.95, 1]);
        continue;
      }
      if (o.sorte === "roquette" || o.sorte === "missile") {
        if (Math.random() < dt * 40) particule(o.x, o.y, o.z, alea(0.3), alea(0.3), alea(0.3), 1.2, 0.4, 2, 0.45, [0.85, 0.85, 0.82]);
        continue;
      }
      if (o.sorte !== "obus" || n >= traceurs.length) continue;
      const m = traceurs[n++];
      m.visible = true;
      m.position.set(o.x, o.y, o.z);
      m.rotation.set(0, -Math.atan2(o.vz, o.vx), Math.atan2(o.vy, Math.hypot(o.vx, o.vz)), "YZX");
    }
    for (let i = n; i < traceurs.length; i++) traceurs[i].visible = false;
    bilan.traceurs = n;
    let b = 0;
    for (const x of balles) {
      if (!x.l.visible) continue;
      x.reste -= dt;
      if (x.reste <= 0) x.l.visible = false;
      else b++;
    }
    bilan.balles = b;
    // la poussière derrière le 4x4, le souffle du rotor de l'hélico près du sol, et l'écume derrière les bateaux
    // (étape 64) un avion abattu laisse une traînée de fumée noire en tombant
    for (const a of monde.avions || []) {
      if (!a.detruit || a.etat === "parti" || Math.random() > dt * 40) continue;
      particule(a.x + alea(1), a.y, a.z + alea(1), alea(1), 1, alea(1), 3, 2, 8, 0.7, Math.random() < 0.3 ? [1, 0.5, 0.15] : [0.13, 0.12, 0.12], false);
    }
    for (const liste of [monde.engins, monde.vehicules || [], monde.helicos || [], monde.bateaux || [], monde.sousMarins || []]) for (const e of liste) {
      // (étape 73) un hélico de transport abattu laisse une traînée de fumée noire en tombant
      if (e.genre === "helico" && e.detruit && e.chute && !e.chute.auSol && Math.random() < dt * 35) particule(e.x + alea(1), e.y + 2, e.z + alea(1), alea(1), 1, alea(1), 3, 2, 8, 0.7, Math.random() < 0.3 ? [1, 0.5, 0.15] : [0.13, 0.12, 0.12], false);
      if (e.detruit) continue;
      // (étape 73) le souffle des rotors soulève la poussière quand un hélico de transport vole bas
      if (e.genre === "helico" && e.enVol && Math.random() < dt * 14) {
        const sol = T.hauteur(e.x, e.z);
        if (e.y - sol < 22) { // (trop loin de la caméra, « particule » ne la fait pas)
          const a = Math.random() * Math.PI * 2, r = e.sorte === "chinook" ? 7 : 5;
          particule(e.x + Math.cos(a) * r, sol + 0.4, e.z + Math.sin(a) * r, Math.cos(a) * 7, 0.5, Math.sin(a) * 7, 1.3, 1.8, 6, 0.3, [0.66, 0.6, 0.48]);
        }
      }
      if (e.sorte === "sousmarin" && Math.abs(e.vitesse) > 1) {
        if (e.profondeur > 1.5 ? Math.random() < dt * 10 : Math.random() < dt * 20) {
          const ar = -6.5, ca = Math.cos(e.angle), sa = Math.sin(e.angle);
          particule(e.x + ca * ar + alea(0.8), C.lac.niveau + 0.1, e.z + sa * ar + alea(0.8), alea(0.4), 0.2, alea(0.4), 2, 0.8, e.profondeur > 1.5 ? 2.5 : 4, 0.5, [0.93, 0.96, 1]);
        }
        continue;
      }
      if (e.sorte === "bateau" && Math.abs(e.vitesse) > 2 && Math.random() < dt * 25) {
        const ar = -4.6, ca = Math.cos(e.angle), sa = Math.sin(e.angle);
        particule(e.x + ca * ar + alea(0.8), e.y + 0.15, e.z + sa * ar + alea(0.8), -ca * 1.5 + alea(0.6), 0.2, -sa * 1.5 + alea(0.6), 2.2, 1, 4.5, 0.55, [0.93, 0.96, 1]);
      }
      if (e.genre === "vehicule" && Math.abs(e.vitesse) > 6 && Math.random() < dt * (e.sorte === "camion" ? 16 : 10)) { // (étape 71)
        const ar = -e.fiche.longueur / 2;
        particule(e.x + Math.cos(e.angle) * ar, e.y + 0.3, e.z + Math.sin(e.angle) * ar, alea(0.6), 0.5, alea(0.6), 1.2, e.sorte === "camion" ? 1.4 : 0.7, e.sorte === "camion" ? 4.5 : 3, 0.3, [0.62, 0.56, 0.44]);
      }
      if (e.sorte === "jeep" && Math.abs(e.vitesse) > 6 && Math.random() < dt * 14) particule(e.x - Math.cos(e.angle) * 2.5, e.y + 0.4, e.z - Math.sin(e.angle) * 2.5, alea(0.6), 0.5, alea(0.6), 1.4, 1, 4, 0.3, [0.62, 0.56, 0.44]);
      if (e.sorte === "helico" && e.pilote && e.y - T.hauteur(e.x, e.z) < 18 && Math.random() < dt * 12) {
        const a = Math.random() * Math.PI * 2, sol = T.hauteur(e.x, e.z);
        particule(e.x + Math.cos(a) * 4, sol + 0.4, e.z + Math.sin(a) * 4, Math.cos(a) * 6, 0.4, Math.sin(a) * 6, 1.2, 1.5, 5, 0.3, [0.66, 0.6, 0.48]);
      }
    }
  }

  function effacer() {
    epaves.length = 0;
    for (const p of particules) p.vivante = false;
    for (const x of balles) x.l.visible = false;
  }

  return { initialiser, maj, effacer, bilan, particule, flash }; // (étape 75 : les maisons qui s'écroulent font aussi de la poussière)
})();
