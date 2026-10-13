// 💨 LA POUSSIÈRE : le nuage derrière les roues (étape 54)
//
// Au Dakar, chaque véhicule soulève un grand nuage. Ici aussi : derrière chaque véhicule qui roule (le tien et ceux
// des autres pilotes), des nuages naissent, de la COULEUR du terrain (doré dans le sable, brun sur la terre, gris sur
// les cailloux) ; dans la BOUE, ce sont des giclées sombres ; dans l'EAU, des éclaboussures blanches.
// Ce sont des « particules » : chacune a un âge, monte, grossit, s'efface et meurt (puis renaît ailleurs).
// Tes roues laissent aussi des TRACES dans le sable et la terre (au plus 1 500 : la plus vieille est réutilisée).
//
// Étape 72 (« ça rame ») : avant, chaque nuage était un dessin à part (260 nuages = jusqu'à 260 dessins par image !).
// Maintenant, TOUS les nuages sont dessinés d'un seul coup : une seule « planche » de 260 cases (une RÉSERVE : un nuage
// mort laisse sa case libre au suivant). Le niveau de qualité dit combien de cases on a le droit d'utiliser.
//
// Ce fichier lit le monde et dessine. Ses nombres sont dans config.js (poussiere, traces).

window.Raid = window.Raid || {};

Raid.Poussiere = (function () {
  const C = Raid.CONFIG, P = C.poussiere, TR = C.traces;
  let particules = [], traces = null, prochaine = 0, nuages = null, libres = [];
  const derniere = new Map();
  const bilan = { vivantes: 0, traces: 0, max: P.particules };

  // Le dessin des nuages : chaque case de la planche a sa place, sa taille, sa couleur et sa transparence. La carte
  // graphique tourne chaque nuage face à la caméra (comme une image collée sur la vitre) et dessine une tache ronde floue.
  const SOMMETS = [
    "attribute vec3 centre; attribute float taille; attribute vec4 teinte; varying vec2 vUv; varying vec4 vTeinte;",
    "#include <fog_pars_vertex>",
    "void main() {",
    "  vUv = position.xy; vTeinte = teinte;",
    "  vec4 mvPosition = viewMatrix * vec4(centre, 1.0);",
    "  mvPosition.xy += position.xy * taille;",
    "  gl_Position = projectionMatrix * mvPosition;",
    "  #include <fog_vertex>",
    "}",
  ].join("\n");
  const PIXELS = [
    "varying vec2 vUv; varying vec4 vTeinte;",
    "#include <fog_pars_fragment>",
    "void main() {",
    "  float r = length(vUv) * 2.0;", // 0 au centre, 1 au bord (la même tache que l'ancienne image)
    "  float a = r < 0.55 ? mix(0.85, 0.35, clamp((r - 0.064) / 0.486, 0.0, 1.0)) : mix(0.35, 0.0, clamp((r - 0.55) / 0.45, 0.0, 1.0));",
    "  gl_FragColor = vec4(vTeinte.rgb, a * vTeinte.a);",
    "  if (gl_FragColor.a < 0.004) discard;",
    "  #include <tonemapping_fragment>",
    "  #include <colorspace_fragment>",
    "  #include <fog_fragment>",
    "}",
  ].join("\n");

  function initialiser(scene) {
    const n = P.particules;
    const forme = new THREE.InstancedBufferGeometry();
    forme.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
    forme.setIndex([0, 1, 2, 0, 2, 3]);
    const centre = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), taille = new THREE.InstancedBufferAttribute(new Float32Array(n), 1), teinte = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    for (const a of [centre, taille, teinte]) a.setUsage(THREE.DynamicDrawUsage);
    forme.setAttribute("centre", centre);
    forme.setAttribute("taille", taille);
    forme.setAttribute("teinte", teinte);
    forme.instanceCount = 0;
    const materiau = new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.clone(THREE.UniformsLib.fog), vertexShader: SOMMETS, fragmentShader: PIXELS, transparent: true, depthWrite: false, fog: true });
    nuages = new THREE.Mesh(forme, materiau);
    nuages.frustumCulled = false; // (les nuages bougent tout le temps : on ne cherche pas leur boîte)
    nuages.renderOrder = 1;
    scene.add(nuages);
    for (let i = 0; i < n; i++) {
      particules.push({ vivante: false, x: 0, y: 0, z: 0, age: 0, vie: 1, vx: 0, vy: 0, vz: 0, taille: 1, opacite: 0.5, couleur: [1, 1, 1] });
      libres.push(n - 1 - i);
    }
    const trace = new THREE.PlaneGeometry(TR.longueur, TR.largeur);
    trace.rotateX(-Math.PI / 2);
    traces = new THREE.InstancedMesh(trace, new THREE.MeshStandardMaterial({ color: 0x3a2c1e, transparent: true, opacity: 0.35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }), TR.nombre);
    traces.count = 0;
    traces.frustumCulled = false;
    scene.add(traces);
  }

  // Un nouveau nuage : on prend une case libre de la réserve (s'il n'y en a plus, tant pis : pas de nuage).
  function nuage(x, y, z, couleur, sorte) {
    if (!libres.length || bilan.vivantes >= bilan.max) return;
    const p = particules[libres.pop()];
    p.age = 0;
    p.vie = P.vie * (sorte === "eau" ? 0.5 : sorte === "boue" ? 0.6 : 0.7 + Math.random() * 0.6);
    p.vx = (Math.random() - 0.5) * 1.5;
    p.vz = (Math.random() - 0.5) * 1.5;
    p.vy = sorte === "eau" || sorte === "boue" ? 3 + Math.random() * 2 : 0.4 + Math.random() * 0.5;
    p.taille = sorte === "eau" ? 0.8 : sorte === "boue" ? 0.6 : 1;
    p.opacite = sorte === "eau" ? 0.8 : sorte === "boue" ? 0.9 : 0.45;
    p.sorte = sorte;
    p.couleur = couleur;
    p.x = x;
    p.y = y + 0.3;
    p.z = z;
    p.vivante = true;
    bilan.vivantes++;
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), un = new THREE.Vector3(1, 1, 1), haut = new THREE.Vector3(0, 1, 0), v3 = new THREE.Vector3();
  const aEmettre = new Map(), arriere = [], places = [new THREE.Vector3(), new THREE.Vector3()];

  // vehicules : [{ v (le véhicule du monde), objet (le dessin, pour savoir où sont ses roues arrière), joueur }]
  function maj(dt, vehicules, cam) {
    bilan.max = Math.min(P.particules, Raid.Qualite.reglage.poussiere);
    for (const { v, objet, joueur } of vehicules) {
      if (!objet || v.enLAir || Math.abs(v.vitesse) < 3) continue;
      if (Math.hypot(v.x - cam.position.x, v.z - cam.position.z) > 250) continue;
      const ter = C.terrains[v.terrain];
      const sorte = v.dansLEau > 0.05 ? "eau" : v.terrain === "boue" ? "boue" : "poussiere";
      const force = Math.min(1, Math.abs(v.vitesse) / 25) * (v.terrain === "piste" ? 0.6 : 1);
      const n = (aEmettre.get(v) || 0) + dt * P.parSeconde * force * (joueur ? 1 : 0.35);
      // (les roues arrière : où sont-elles ? on réutilise toujours les deux mêmes vecteurs, sans en fabriquer de nouveaux)
      arriere.length = 0;
      for (const r of objet.roues) if (!r.avant && arriere.length < places.length) arriere.push(r.pivot.getWorldPosition(places[arriere.length]));
      let reste = n;
      while (reste >= 1 && arriere.length) {
        reste -= 1;
        const r = arriere[Math.floor(Math.random() * arriere.length)];
        nuage(r.x, v.dansLEau > 0.05 ? v.y + v.dansLEau : v.y, r.z, ter.poussiere, sorte);
      }
      aEmettre.set(v, reste);
      // Les traces (seulement pour toi, et pas sur la piste déjà marquée ni dans l'eau).
      if (joueur && v.terrain !== "piste" && v.dansLEau < 0.05) {
        arriere.forEach((r, i) => {
          const d = derniere.get(i);
          if (d && Math.hypot(r.x - d.x, r.z - d.z) < TR.ecart) return;
          q.setFromAxisAngle(haut, -v.deplacement);
          m4.compose(v3.set(r.x, Raid.Terrain.hauteur(r.x, r.z) + 0.04, r.z), q, un);
          traces.setMatrixAt(prochaine, m4);
          prochaine = (prochaine + 1) % TR.nombre;
          traces.count = Math.min(TR.nombre, traces.count + 1);
          traces.instanceMatrix.needsUpdate = true;
          derniere.set(i, { x: r.x, z: r.z });
          bilan.traces++;
        });
      }
    }
    // Les particules vieillissent ; les vivantes sont rangées au début de la planche (les cases 0, 1, 2…).
    const vent = { x: 1.2, z: 0.4 };
    const forme = nuages.geometry, centre = forme.attributes.centre, taille = forme.attributes.taille, teinte = forme.attributes.teinte;
    let vivantes = 0;
    for (let i = 0; i < particules.length; i++) {
      const p = particules[i];
      if (!p.vivante) continue;
      p.age += dt;
      if (p.age >= p.vie) {
        p.vivante = false;
        libres.push(i);
        continue;
      }
      const t = p.age / p.vie;
      if (p.sorte !== "poussiere") p.vy -= 9.8 * dt; // l'eau et la boue retombent (la poussière, elle, flotte)
      p.x += (p.vx + vent.x) * dt;
      p.y += p.vy * dt;
      p.z += (p.vz + vent.z) * dt;
      centre.setXYZ(vivantes, p.x, p.y, p.z);
      taille.setX(vivantes, (P.taille[0] + (P.taille[1] - P.taille[0]) * t) * p.taille);
      teinte.setXYZW(vivantes, p.couleur[0], p.couleur[1], p.couleur[2], p.opacite * (1 - t) * Math.min(1, t * 8));
      vivantes++;
    }
    forme.instanceCount = vivantes;
    if (vivantes) centre.needsUpdate = taille.needsUpdate = teinte.needsUpdate = true;
    bilan.vivantes = vivantes;
  }

  return { initialiser, maj, bilan };
})();
