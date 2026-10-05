// 🌈 LA MÉTÉO EN 3D : le peintre du ciel
//
// Étape 47. Il dessine ce que la météo (logique/meteo.js) a décidé :
//   - LE CIEL : un dégradé (bleu en haut, clair à l'horizon) et de VRAIS NUAGES qui avancent avec le vent.
//     Les nuages sont calculés par la carte graphique, pixel par pixel, avec du « bruit » : on additionne des
//     vagues de hasard de plus en plus petites (le « bruit fractal »), ça ressemble à des nuages !
//     Plus il y a de nuages, plus le ciel est gris et moins le soleil brille ;
//   - LA PLUIE : 5 000 petits traits qui tombent autour de la caméra (et penchent avec le vent) ;
//   - LA NEIGE : 6 000 flocons qui tombent doucement en tourbillonnant (et volent presque à l'horizontale
//     dans le blizzard) ;
//   - LES ÉCLAIRS : un zigzag blanc dans le ciel, et toute la scène qui s'illumine un instant ;
//   - LE BROUILLARD : on voit moins loin (la « distance de visibilité ») ;
//   - LE SOL : mouillé, la route BRILLE (elle reflète le ciel) ; sous la neige, elle BLANCHIT petit à petit.

window.Circuit = window.Circuit || {};

Circuit.Meteo3D = (function () {
  const PLUIE = 5000, NEIGE = 6000, BOITE = 70; // la boîte de 140 m autour de la caméra où tombent gouttes et flocons
  let ciel, soleil, hemi, rendu, scene;
  let pluie, neige, eclair;
  let mouille = 0, enneige = 0, dernierSol = { mouille: -1, enneige: -1 };
  const solsConnus = new Map(); // matériau → sa couleur et sa rugosité d'origine
  const SOLS = ["herbe", "goudron", "terre", "trottoir", "beton", "sable", "planches", "bois", "damier", "bordure"];

  // Le shader du ciel : le dégradé, le soleil, et les nuages en bruit fractal.
  const vertexShader = "varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }";
  const fragmentShader = [
    "uniform vec3 soleil; uniform float nuages; uniform float temps; uniform float eclair; uniform vec2 vent; uniform float lumiere;",
    "varying vec3 vDir;",
    "float hasard(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
    "float bruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hasard(i), hasard(i + vec2(1.0, 0.0)), f.x), mix(hasard(i + vec2(0.0, 1.0)), hasard(i + vec2(1.0, 1.0)), f.x), f.y); }",
    "float fractal(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 6; k++) { s += a * bruit(p); p *= 2.03; a *= 0.5; } return s; }",
    "void main(){",
    "  vec3 d = normalize(vDir); float h = max(d.y, 0.0);",
    "  vec3 bleu = mix(vec3(0.80,0.88,0.97), vec3(0.22,0.47,0.88), pow(h, 0.55));",
    "  vec3 gris = mix(vec3(0.62,0.65,0.70), vec3(0.42,0.45,0.50), pow(h, 0.6));",
    "  vec3 c = mix(bleu, gris, nuages * 0.85) * (0.45 + 0.55 * lumiere);",
    "  float s = max(dot(d, soleil), 0.0);",
    "  c += vec3(1.0,0.92,0.75) * (pow(s, 900.0) * 5.0 + pow(s, 14.0) * 0.3) * (1.0 - nuages * 0.9);",
    "  if (d.y > 0.0) {",
    // les nuages : on projette la direction sur un « plafond » de nuages, et on y lit le bruit fractal
    "    vec2 p = d.xz / (d.y + 0.08) * 1.6 + vent * temps * 0.004;",
    "    float n = fractal(p);",
    "    float couverture = smoothstep(1.0 - nuages * 0.95 - 0.12, 1.05 - nuages * 0.6, n + nuages * 0.25);",
    "    vec3 blanc = mix(vec3(1.0), vec3(0.55,0.57,0.62), nuages) * (0.55 + 0.45 * lumiere);",
    "    float ombre = fractal(p * 1.7 + 3.0);",
    "    vec3 nuage = blanc * (0.8 + 0.25 * ombre) + vec3(1.0,0.9,0.7) * pow(s, 6.0) * 0.4 * (1.0 - nuages);",
    "    c = mix(c, nuage, couverture * smoothstep(0.0, 0.12, d.y));",
    "  } else c = mix(vec3(0.55,0.6,0.55), vec3(0.4,0.42,0.45), nuages) * (0.5 + 0.5 * lumiere);",
    "  c += vec3(0.8,0.85,1.0) * eclair;",
    "  gl_FragColor = vec4(c, 1.0);",
    "}",
  ].join("\n");

  function materiauCiel(soleilDir) {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { soleil: { value: soleilDir }, nuages: { value: 0.15 }, temps: { value: 0 }, eclair: { value: 0 }, vent: { value: new THREE.Vector2(1, 0) }, lumiere: { value: 1 } },
      vertexShader, fragmentShader,
    });
  }

  // Une petite image ronde et floue pour les flocons.
  function texFlocon() {
    const t = document.createElement("canvas");
    t.width = t.height = 32;
    const ctx = t.getContext("2d");
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(t);
  }

  function initialiser(reglages) {
    ({ ciel, soleil, hemi, rendu, scene } = reglages);
    // Les gouttes de pluie : des petits traits (2 points chacun).
    const pos = new Float32Array(PLUIE * 6);
    for (let i = 0; i < PLUIE; i++) {
      const x = (Math.random() * 2 - 1) * BOITE, y = Math.random() * BOITE, z = (Math.random() * 2 - 1) * BOITE;
      pos.set([x, y, z, x, y - 1.2, z], i * 6);
    }
    const geoPluie = new THREE.BufferGeometry();
    geoPluie.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pluie = new THREE.LineSegments(geoPluie, new THREE.LineBasicMaterial({ color: 0xaab8c8, transparent: true, opacity: 0.45, depthWrite: false }));
    pluie.frustumCulled = false;
    pluie.visible = false;
    scene.add(pluie);
    // Les flocons : des points.
    const posN = new Float32Array(NEIGE * 3);
    for (let i = 0; i < NEIGE; i++) posN.set([(Math.random() * 2 - 1) * BOITE, Math.random() * BOITE, (Math.random() * 2 - 1) * BOITE], i * 3);
    const geoNeige = new THREE.BufferGeometry();
    geoNeige.setAttribute("position", new THREE.BufferAttribute(posN, 3));
    neige = new THREE.Points(geoNeige, new THREE.PointsMaterial({ map: texFlocon(), size: 0.6, transparent: true, opacity: 0.95, depthWrite: false }));
    neige.frustumCulled = false;
    neige.visible = false;
    scene.add(neige);
    // L'éclair : un zigzag (refait à chaque éclair).
    eclair = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xf2f4ff, fog: false }));
    eclair.frustumCulled = false;
    eclair.visible = false;
    scene.add(eclair);
    Circuit.Evenements.ecouter("eclair", () => nouvelEclair());
  }

  let centre = { x: 0, y: 0, z: 0 }; // où est la caméra (les gouttes tombent autour d'elle)
  function nouvelEclair() {
    const a = Math.random() * Math.PI * 2, d = 300 + Math.random() * 500;
    let x = centre.x + Math.cos(a) * d, y = 260, z = centre.z + Math.sin(a) * d;
    const pts = [];
    while (y > centre.y - 5) {
      const nx = x + (Math.random() - 0.5) * 30, ny = y - 15 - Math.random() * 20, nz = z + (Math.random() - 0.5) * 30;
      pts.push(x, y, z, nx, ny, nz);
      if (Math.random() < 0.2) pts.push(nx, ny, nz, nx + (Math.random() - 0.5) * 60, ny - 30, nz + (Math.random() - 0.5) * 60); // une branche
      x = nx;
      y = ny;
      z = nz;
    }
    eclair.geometry.dispose();
    eclair.geometry = new THREE.BufferGeometry();
    eclair.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  }

  // Le sol mouillé ou enneigé : on change la rugosité (lisse = ça brille) et la couleur (vers le blanc)
  // de tous les matériaux de sol (reconnus au nom de leur texture : « goudron », « herbe »…).
  function majSols() {
    if (Math.abs(mouille - dernierSol.mouille) < 0.03 && Math.abs(enneige - dernierSol.enneige) < 0.03) return;
    dernierSol = { mouille, enneige };
    scene.traverse((o) => {
      const liste = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of liste) {
        if (!m.map || !SOLS.includes(m.map.name)) continue;
        if (!solsConnus.has(m)) solsConnus.set(m, { roughness: m.roughness, color: m.color.clone(), emissive: m.emissive.clone() });
        const origine = solsConnus.get(m);
        m.roughness = origine.roughness * (1 - 0.7 * mouille);
        // La neige : la couleur de la texture s'efface (on la « dilue »), et le sol renvoie une lumière blanche
        // (« emissive ») : il devient blanc, même à l'ombre.
        const n = enneige * (m.map.name === "goudron" ? 0.7 : 1); // (sur la route, les voitures tassent la neige : un peu moins blanc)
        m.color.copy(origine.color).multiplyScalar(1 - 0.55 * n);
        m.emissive.copy(origine.emissive).lerp(new THREE.Color(0.62, 0.64, 0.68), n * 0.95);
      }
    });
  }

  let dernierNuages = -1;
  function maj(dt, cam, carte, finBrouillard) {
    const M = Circuit.Meteo, e = M.etat, v = e.valeurs, vent = M.vent();
    centre = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
    // Le ciel.
    const u = ciel.material.uniforms;
    u.nuages.value = carte === "ciel" ? Math.min(v.nuages, 0.5) : v.nuages; // (au-dessus des nuages, le ciel reste plus clair)
    u.temps.value += dt;
    u.vent.value.set(vent.x + 0.5, vent.z);
    u.lumiere.value = v.lumiere;
    const flash = e.eclair > 0 ? (e.eclair > 0.25 || e.eclair < 0.1 ? 1 : 0.3) : 0;
    u.eclair.value = flash * 0.6;
    // La lumière : le soleil faiblit sous les nuages ; l'éclair illumine tout.
    soleil.intensity = 2.4 * v.lumiere * (1 - 0.6 * v.nuages) + 0.2;
    hemi.intensity = 0.7 * (0.6 + 0.4 * v.lumiere) + flash * 2.5;
    rendu.toneMappingExposure = 0.75 + 0.25 * v.lumiere + flash * 0.6;
    // Le brouillard : on voit au plus jusqu'à la visibilité de la météo.
    const loin = Math.min(finBrouillard, v.visibilite);
    scene.fog.far = loin;
    scene.fog.near = Math.min(loin * 0.35, loin - 20);
    const gris = new THREE.Color(0xc6dcf2).lerp(new THREE.Color(v.neige > 0.3 ? 0xe4e8ee : 0x8e959e), Math.min(1, v.nuages * 0.9));
    scene.fog.color.copy(gris).multiplyScalar(0.55 + 0.45 * v.lumiere);
    // Le reflet du ciel sur les voitures : on le refait quand le ciel a beaucoup changé.
    if (Math.abs(u.nuages.value - dernierNuages) > 0.15) {
      dernierNuages = u.nuages.value;
      const pmrem = new THREE.PMREMGenerator(rendu);
      const sceneCiel = new THREE.Scene();
      sceneCiel.add(new THREE.Mesh(ciel.geometry, ciel.material));
      if (scene.environment) scene.environment.dispose();
      scene.environment = pmrem.fromScene(sceneCiel, 0.02).texture;
      pmrem.dispose();
    }
    // La pluie.
    pluie.visible = v.pluie > 0.02;
    if (pluie.visible) {
      const n = Math.min(PLUIE, Math.round(PLUIE * Math.min(1, v.pluie * 0.65)));
      pluie.geometry.setDrawRange(0, n * 2);
      const p = pluie.geometry.attributes.position.array;
      const vx = vent.x * 0.8, vz = vent.z * 0.8, vy = -22;
      for (let i = 0; i < n; i++) {
        let x = p[i * 6] + vx * dt, y = p[i * 6 + 1] + vy * dt, z = p[i * 6 + 2] + vz * dt;
        if (y < cam.position.y - 25) y += BOITE;
        x = enBoite(x, cam.position.x);
        z = enBoite(z, cam.position.z);
        if (y < cam.position.y - 25 || y > cam.position.y + BOITE) y = cam.position.y - 25 + Math.random() * BOITE;
        p.set([x, y, z, x - vx * 0.05, y + 1.1, z - vz * 0.05], i * 6);
      }
      pluie.geometry.attributes.position.needsUpdate = true;
      pluie.material.opacity = 0.3 + 0.2 * Math.min(1, v.pluie);
    }
    // La neige.
    neige.visible = v.neige > 0.02;
    if (neige.visible) {
      const n = Math.min(NEIGE, Math.round(NEIGE * Math.min(1, v.neige * 0.5)));
      neige.geometry.setDrawRange(0, n);
      const p = neige.geometry.attributes.position.array;
      const t = u.temps.value;
      for (let i = 0; i < n; i++) {
        let x = p[i * 3] + (vent.x * 1.1 + Math.sin(t * 1.3 + i) * 0.6) * dt;
        let y = p[i * 3 + 1] - (1.6 + (i % 7) * 0.15) * dt;
        let z = p[i * 3 + 2] + (vent.z * 1.1 + Math.cos(t * 1.1 + i * 0.7) * 0.6) * dt;
        x = enBoite(x, cam.position.x);
        z = enBoite(z, cam.position.z);
        if (y < cam.position.y - 25 || y > cam.position.y + BOITE) y = cam.position.y - 25 + Math.random() * BOITE;
        p[i * 3] = x;
        p[i * 3 + 1] = y;
        p[i * 3 + 2] = z;
      }
      neige.geometry.attributes.position.needsUpdate = true;
      neige.material.size = v.neige > 1.5 ? 0.8 : 0.6;
    }
    // L'éclair.
    eclair.visible = e.eclair > 0.12;
    // Le sol mouillé (il sèche lentement) et enneigé (la neige fond lentement).
    const vise = (cible, valeur, vitesse) => valeur + Math.max(-vitesse * dt, Math.min(vitesse * dt, cible - valeur));
    mouille = vise(v.pluie > 0.1 ? 1 : 0, mouille, 1 / 8);
    enneige = vise(v.neige > 0.1 ? Math.min(1, v.neige) : 0, enneige, 1 / 10);
    majSols();
  }

  // Une goutte sortie de la boîte autour de la caméra revient de l'autre côté.
  function enBoite(a, c) {
    const d = a - c + BOITE, l = 2 * BOITE;
    return c - BOITE + (((d % l) + l) % l);
  }

  return { materiauCiel, initialiser, maj, get mouille() { return mouille; }, get enneige() { return enneige; } };
})();
