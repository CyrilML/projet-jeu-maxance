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
// Demande 92 (« le réalisme total ») : les TIRS (affichage/tirs.js), les EXPLOSIONS et les ÉPAVES QUI BRÛLENT
// (affichage/explosions.js) ont leur propre artificier, avec une imprimerie à autocollants bien plus riche
// (affichage/particules.js : images de fumée et de feu, fumée éclairée par le soleil, vraies lumières prêtées). Ce fichier
// garde la poussière des roues, l'écume, les bulles, les portails… et fait avancer les trois autres à chaque image.

window.Tanks = window.Tanks || {};

Tanks.Effets = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  let scene, particules = [], prochaine = 0;
  let lotFumee = null, lotFeu = null; // (étape 72) les deux objets qui dessinent toutes les particules
  const camera = { x: 0, y: 0, z: 0, connue: false }, reglage = { distance: Infinity }; // (étape 72) où est la caméra, jusqu'où faire des effets
  const bilan = { vivantes: 0, traceurs: 0, epaves: 0, balles: 0, tropLoin: 0 };

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
    Tanks.Particules.initialiser(s); // (demande 92)
    Tanks.Tirs.initialiser();
    Tanks.Explosions.initialiser();
    lotFumee = lot(C.effets.particules, false);
    lotFeu = lot(C.effets.particules, true);
    for (let i = 0; i < C.effets.particules; i++) {
      particules.push({ vivante: false, x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, age: 0, vie: 1, vx: 0, vy: 0, vz: 0, t0: 1, t1: 2, op: 0.5, gravite: 0, feu: false });
    }
    const radio = Tanks.Evenements;
    // (demande 92 : le coup de canon des bateaux, les avions abattus et les crashs : voir affichage/tirs.js et explosions.js)
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
    // (demande 92 : le départ du coup, les impacts, les balles : affichage/tirs.js ; les explosions : affichage/explosions.js)
    radio.ecouter("soldat-mort", (d) => {
      for (let k = 0; k < 4; k++) particule(d.x, d.y + 0.8, d.z, alea(1), 0.8, alea(1), 1.2, 0.6, 2, 0.4, [0.55, 0.5, 0.42]);
    });
    radio.ecouter("camion-decharge", (d) => {
      for (let k = 0; k < 5; k++) particule(d.x + alea(2), T.hauteur(d.x, d.z) + 0.3, d.z + alea(2), alea(1), 0.5, alea(1), 1.2, 1, 3, 0.3, [0.62, 0.56, 0.44]);
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

  // Un éclair : (demande 92) une des vraies lumières prêtées par l'imprimerie (affichage/particules.js).
  function flash(x, y, z, force) {
    Tanks.Particules.lumiere(x, y, z, 0xffa040, force, 40, 0.12);
  }

  // Chaque image : les particules vieillissent, les obus ont leur traceur, les épaves fument, les tanks soulèvent
  // de la poussière.
  function maj(dt, monde, cam, distance) {
    if (cam) (camera.x = cam.position.x), (camera.y = cam.position.y), (camera.z = cam.position.z), (camera.connue = true);
    if (distance) reglage.distance = distance;
    // (demande 92) les épaves qui brûlent : affichage/explosions.js ; ici, la poussière des chenilles
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
    // les bulles des torpilles (demande 92 : les traceurs des obus et la fumée des roquettes : affichage/tirs.js)
    for (const o of monde.obus) {
      if (o.sorte === "torpille" && Math.random() < dt * 30) particule(o.x + alea(0.4), C.lac.niveau + 0.05, o.z + alea(0.4), alea(0.3), 0.3, alea(0.3), 1.5, 0.4, 1.4, 0.6, [0.9, 0.95, 1]);
    }
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
    // (demande 92) les tirs, les explosions, puis l'imprimerie (qui fait vivre et range tous ses autocollants)
    Tanks.Tirs.maj(dt, monde);
    Tanks.Explosions.maj(dt);
    Tanks.Particules.maj(dt, cam, distance, C.realisme.explosions.vent);
    bilan.balles = Tanks.Particules.bilan.brillent;
    bilan.traceurs = Tanks.Tirs.bilan.obusEnVol;
    bilan.epaves = Tanks.Explosions.bilan.epaves;
  }

  function effacer() {
    for (const p of particules) p.vivante = false;
    Tanks.Particules.effacer(); // (demande 92)
    Tanks.Explosions.effacer();
    Tanks.Tirs.effacer();
  }

  return { initialiser, maj, effacer, bilan, particule, flash }; // (étape 75 : les maisons qui s'écroulent font aussi de la poussière)
})();
