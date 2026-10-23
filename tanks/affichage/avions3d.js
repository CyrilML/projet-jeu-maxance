// ✈️ LES AVIONS ET LE TIGRE EN 3D : le hangar de l'aérodrome (étape 76)
//
// ✍️ « Refais aussi les avions et le Tigre. » Comme les hélicos de transport (étape 74) et les tanks (étape 75), ils sont
// refaits « le plus beau possible », avec les outils du POTIER (affichage/outils3d.js) : des coques LISSES faites de
// tranches qui glissent en douceur, de vraies AILES au profil arrondi devant et effilé derrière, des verrières en bulle.
//   - le RAFALE (ton avion de chasse) : l'aile en triangle (« delta ») avec ses gouvernes, les petites ailes avant (les
//     « canards »), les 2 entrées d'air sous le cockpit, la dérive, les 2 moteurs et leurs tuyères (et la flamme de la
//     POSTCOMBUSTION quand il va vite), la verrière dorée en bulle avec le pilote sur son SIÈGE ÉJECTABLE, le train
//     d'atterrissage qui RENTRE après le décollage, 6 missiles (ils disparaissent un par un quand tu tires), 2 bidons
//     d'essence, la nacelle de visée, la perche de ravitaillement et les COCARDES ;
//   - le CHASSEUR ENNEMI (comme un MiG-29) : un long nez, 2 dérives penchées, 2 moteurs bien écartés sous l'aile avec
//     leurs entrées d'air carrées, une bosse derrière le cockpit, ses missiles et ses bombes, les ÉTOILES rouges ;
//   - l'AVION DE TRANSPORT (comme un A400M) : l'aile haute, 4 moteurs à hélices à 8 pales en forme de sabre qui
//     TOURNENT (2 dans un sens, 2 dans l'autre), la queue en T, et la RAMPE arrière qui s'OUVRE avant le largage des
//     parachutistes (on voit la soute et ses sièges rouges) ;
//   - le DRONE : un vrai quadricoptère militaire (4 bras, 4 moteurs, 4 hélices qui tournent, la boule de la CAMÉRA sous
//     le nez, les patins, et ses 6 grenades accrochées dessous, qui disparaissent quand il en lâche) ;
//   - le TIGRE : le fuselage fin et « taillé », les 2 places l'une derrière l'autre (le pilote devant, le tireur
//     derrière et plus haut) sous des verrières en marches, le canon de 30 mm dans sa tourelle sous le nez, les petites
//     ailes avec les paniers de roquettes, les missiles et les missiles air-air, le viseur en boule au-dessus du rotor,
//     le rotor à 4 pales, le rotor de queue, et le train fixe avec la roulette de queue.
// La PEINTURE : un camouflage à taches (vert et gris pour les Bleus, sable et brun pour les Rouges), calculé en 3D par
// la carte graphique (comme une peinture au pistolet sur l'avion assemblé : les taches passent d'une pièce à l'autre),
// des lignes de tôle et des rivets, un ventre plus clair, de la suie derrière les moteurs. Les inscriptions (cocardes,
// étoiles, numéros, « ARMÉE DE L'AIR ») sont des DÉCALCOMANIES : une seule image pour toutes, collée sur la tôle.
// Comme les autres engins : un modèle par sorte et par équipe, puis des COPIES ; les pièces sont SOUDÉES par matière ; et
// de LOIN une version SIMPLE en instances (1 dessin pour tous ceux d'une sorte et d'une équipe).
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Avions3D = (function () {
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const K = () => Tanks.CONFIG.avions3d;
  const OU = () => Tanks.Engins3D.outils;
  const SORTES = ["avion", "chasseur", "transport", "drone", "helico"];
  const sait = (sorte) => SORTES.includes(sorte);
  const SCHEMA = { avion: "chasse", chasseur: "chasse", transport: "transport", drone: "drone", helico: "helico" };
  const NOMS = { avion: "Rafale", chasseur: "chasseur ennemi", transport: "avion de transport", drone: "drone", helico: "Tigre" };
  const bruit = Tanks.Bruit.creer(76);
  const M = {}; // les matières partagées (fabriquées une fois)
  const bilan = {}; // (pour « sous le capot » : les triangles et les dessins de chaque modèle)
  const COUL = { sombre: 0x161718, interieur: 0x2b2e2a, pneu: 0x161616, jante: 0x7d8288, metal: 0x55595e, chrome: 0xc4c9cc, tuyere: 0x3e3d3b, chaud: 0x4a4038, noir: 0x1b1c1e, carbone: 0x232527, siege: 0x3a3e37, banc: 0x7a2e22 };

  // ------------------------------------------------------------------ les matières
  // La TÔLE : une image grise (elle multiplie la couleur) avec les lignes des panneaux, les rivets, les trappes de
  // visite et de légères taches. Les coques et les ailes sont mesurées en mètres : une image = 4 m de tôle.
  function tole() {
    if (M.tole) return M.tole;
    const c = document.createElement("canvas"), T = 512;
    c.width = c.height = T;
    const ctx = c.getContext("2d");
    let etat = 7601;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    ctx.fillStyle = "#dcdcdc";
    ctx.fillRect(0, 0, T, T);
    for (let i = 0; i < 220; i++) { // de grandes taches très douces (la peinture n'est pas partout pareille)
      const x = h() * T, y = h() * T, r = 20 + h() * 70, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const v = h() < 0.5 ? "255,255,255," : "0,0,0,";
      g.addColorStop(0, "rgba(" + v + (0.025 + h() * 0.035) + ")");
      g.addColorStop(1, "rgba(" + v + "0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // les panneaux : des rangées de 0,5 m (64 points), chacune coupée en panneaux de longueurs différentes
    ctx.lineWidth = 1.3;
    for (let y = 0; y < T; y += 64) {
      ctx.strokeStyle = "rgba(25,25,25,0.3)";
      ctx.beginPath(), ctx.moveTo(0, y + 0.5), ctx.lineTo(T, y + 0.5), ctx.stroke();
      ctx.fillStyle = "rgba(30,30,30,0.22)";
      for (let x = 2; x < T; x += 7) ctx.fillRect(x, y + 3, 1.3, 1.3); // les rivets le long de la ligne
      let x = Math.floor(h() * 90);
      while (x < T) {
        ctx.strokeStyle = "rgba(25,25,25,0.3)";
        ctx.beginPath(), ctx.moveTo(x + 0.5, y), ctx.lineTo(x + 0.5, y + 64), ctx.stroke();
        ctx.fillStyle = "rgba(30,30,30,0.22)";
        for (let yy = y + 4; yy < y + 62; yy += 7) ctx.fillRect(x + 3, yy, 1.3, 1.3);
        x += 80 + Math.floor(h() * 110);
      }
    }
    for (let i = 0; i < 30; i++) { // les trappes de visite (avec leurs 4 vis)
      const x = 6 + h() * (T - 40), y = Math.floor(h() * 8) * 64 + 10, w = 10 + h() * 26, hh = 8 + h() * 26;
      ctx.strokeStyle = "rgba(20,20,20,0.2)";
      ctx.strokeRect(x + 0.5, y + 0.5, w, Math.min(hh, 46));
      ctx.fillStyle = "rgba(20,20,20,0.25)";
      for (const [dx, dy] of [[2, 2], [w - 3, 2], [2, Math.min(hh, 46) - 3], [w - 3, Math.min(hh, 46) - 3]]) ctx.fillRect(x + dx, y + dy, 1.5, 1.5);
    }
    for (let i = 0; i < 60; i++) { // des coulures de saleté
      const x = h() * T, y = h() * T, l = 20 + h() * 90, g = ctx.createLinearGradient(x, y, x + l, y);
      g.addColorStop(0, "rgba(40,35,25,0.08)");
      g.addColorStop(1, "rgba(40,35,25,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, l, 1.5 + h() * 3);
    }
    for (let i = 0; i < 9000; i++) { // le grain de la peinture mate
      ctx.fillStyle = "rgba(" + (h() < 0.5 ? "0,0,0," : "255,255,255,") + h() * 0.045 + ")";
      ctx.fillRect(h() * T, h() * T, 1, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(0.25, 0.25);
    return (M.tole = t);
  }

  // Le CAMOUFLAGE « au pistolet », calculé par la carte graphique : pour chaque point de l'avion (dans son propre repère),
  // 3 « bruits » en 3D (des nuages de nombres qui varient en douceur) disent si on est dans une tache, et de quelle
  // couleur. Comme c'est en 3D, les taches continuent d'une pièce à l'autre sans couture. Le ventre (les faces tournées
  // vers le bas) est plus clair, avec un bord ondulé comme une vraie peinture.
  const GLSL_CAMO = [
    "uniform vec3 cFond; uniform vec3 cT1; uniform vec3 cT2; uniform vec3 cT3; uniform vec3 cVentre;",
    "uniform float forceVentre; uniform float echelleCamo; uniform vec3 decalCamo;",
    "varying vec3 vPosA; varying vec3 vNorA;",
    "float hA(vec3 p) { p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }",
    "float bA(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(mix(hA(i), hA(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hA(i + vec3(0.0, 1.0, 0.0)), hA(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),",
    "             mix(mix(hA(i + vec3(0.0, 0.0, 1.0)), hA(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hA(i + vec3(0.0, 1.0, 1.0)), hA(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }",
    "float fA(vec3 p) { return 0.6 * bA(p) + 0.28 * bA(p * 2.07 + 3.1) + 0.12 * bA(p * 4.3 + 7.7); }",
    "vec3 camoAvion(vec3 p, vec3 n) {",
    "  vec3 q = (p + decalCamo) * echelleCamo * vec3(0.55, 1.0, 1.0);", // (des taches allongées dans le sens de l'avion)
    "  float b = 0.018;",
    "  vec3 c = cFond;",
    "  c = mix(c, cT1, smoothstep(0.53 - b, 0.53 + b, fA(q)));",
    "  c = mix(c, cT2, smoothstep(0.57 - b, 0.57 + b, fA(q * 1.13 + 11.3)));",
    "  c = mix(c, cT3, smoothstep(0.6 - b, 0.6 + b, fA(q * 0.92 + 23.7)));",
    "  float v = smoothstep(-0.1, -0.38, n.y + (bA(p * 1.7) - 0.5) * 0.16) * forceVentre;",
    "  return mix(c, cVentre, v);",
    "}",
  ].join("\n");
  function peinture(equipe, schema) {
    const cle = "peinture:" + schema + ":" + equipe;
    if (M[cle]) return M[cle];
    const P = K().peinture[schema][equipe];
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: tole(), roughness: schema === "chasse" ? 0.58 : 0.7, metalness: 0.15 });
    const U = {
      cFond: { value: new THREE.Color(P.fond) }, cT1: { value: new THREE.Color(P.taches[0]) }, cT2: { value: new THREE.Color(P.taches[1]) },
      cT3: { value: new THREE.Color(P.taches[2]) }, cVentre: { value: new THREE.Color(P.ventre || P.fond) }, forceVentre: { value: P.ventre ? 1 : 0 },
      echelleCamo: { value: 1 / P.taille }, decalCamo: { value: new THREE.Vector3(/^bleus/.test(equipe) ? 3.7 : 17.3, 5.1, 9.9) },
    };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vPosA;\nvarying vec3 vNorA;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosA = position;\nvNorA = normal;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\n" + GLSL_CAMO)
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= camoAvion(vPosA, normalize(vNorA));");
    };
    mat.customProgramCacheKey = () => "avion-camo";
    return (M[cle] = mat);
  }
  const teinte = () => Tanks.Chars3D.materiaux().teinte; // (les petites pièces : chacune sa couleur, dans ses sommets)
  // Les pièces BRILLANTES (la visière des pilotes, l'objectif de la caméra, les feux, le viseur tête haute) : à couleurs.
  const brillant = () => M.brillant || (M.brillant = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.1, metalness: 0.75 }));
  // Les VITRES : sombres, lisses, elles reflètent le ciel ; on voit un peu à travers (les pilotes). La verrière du Rafale
  // est DORÉE (une fine couche d'or la protège du soleil et des radars).
  function verre(sorte) {
    const cle = sorte === "avion" ? "verreOr" : "verre";
    if (M[cle]) return M[cle];
    const or = sorte === "avion";
    return (M[cle] = new THREE.MeshPhysicalMaterial({ color: or ? 0x8a7a4c : 0x2a3a44, roughness: 0.03, metalness: or ? 0.35 : 0.15, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: or ? 0.4 : 0.5, depthWrite: false, envMapIntensity: 1.8 }));
  }
  // Les FLAMMES (la postcombustion, les tuyères qui rougeoient) : elles « ajoutent » de la lumière (elles brillent).
  const matFlamme = () => M.flamme || (M.flamme = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  // Le DISQUE FLOU d'un rotor ou d'une hélice qui tourne vite (comme sur une photo).
  function matFlou() {
    if (M.flou) return M.flou;
    const c = document.createElement("canvas"), T = 256;
    c.width = c.height = T;
    const ctx = c.getContext("2d"), gr = ctx.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
    gr.addColorStop(0, "rgba(40,42,44,0.0)");
    gr.addColorStop(0.14, "rgba(40,42,44,0.32)");
    gr.addColorStop(0.9, "rgba(40,42,44,0.2)");
    gr.addColorStop(0.955, "rgba(216,176,32,0.3)");
    gr.addColorStop(0.985, "rgba(40,42,44,0.12)");
    gr.addColorStop(1, "rgba(40,42,44,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, T, T);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return (M.flou = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.45 }));
  }

  // ------------------------------------------------------------------ les DÉCALCOMANIES
  // Une seule image (1024 × 512) avec toutes les inscriptions : chacune est une petite case. Une décalcomanie est un
  // morceau de cette image, collé sur la tôle (un tout petit peu au-dessus, pour ne pas « clignoter » avec elle).
  const CASES = {
    cocarde: [0, 0, 128, 128], etoile: [128, 0, 128, 128], triangle: [256, 0, 128, 128],
    "4-GI": [512, 0, 256, 128], BHA: [768, 0, 256, 128], "118": [0, 128, 256, 128], "07": [256, 128, 256, 128],
    "0012": [512, 128, 256, 128], "21": [768, 128, 256, 128], air: [0, 256, 1024, 128], terre: [0, 384, 1024, 128],
  };
  function decalcos() {
    if (M.decalcos) return M.decalcos;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const ctx = c.getContext("2d");
    const rond = (x, y, r, coul) => ((ctx.fillStyle = coul), ctx.beginPath(), ctx.arc(x, y, r, 0, Math.PI * 2), ctx.fill());
    // la cocarde bleu-blanc-rouge
    rond(64, 64, 60, "#24418f"), rond(64, 64, 41, "#f1f0ea"), rond(64, 64, 21, "#c8261f");
    // l'étoile rouge (bordée de blanc, puis d'un fin trait rouge)
    const etoile = (cx, cy, R, coul) => {
      ctx.fillStyle = coul;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? R * 0.42 : R;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      ctx.fill();
    };
    etoile(192, 68, 62, "#b8231d"), etoile(192, 68, 54, "#f1f0ea"), etoile(192, 68, 44, "#c8261f");
    // le triangle « siège éjectable » (rouge, bordé de blanc)
    ctx.fillStyle = "#f1f0ea";
    ctx.beginPath(), ctx.moveTo(320, 10), ctx.lineTo(376, 112), ctx.lineTo(264, 112), ctx.fill();
    ctx.fillStyle = "#c8261f";
    ctx.beginPath(), ctx.moveTo(320, 24), ctx.lineTo(364, 104), ctx.lineTo(276, 104), ctx.fill();
    ctx.fillStyle = "#111";
    ctx.fillRect(316, 50, 8, 30), ctx.fillRect(316, 86, 8, 8);
    // les textes : au pochoir, gris très foncé ; les numéros rouges bordés de blanc (comme sur les avions russes)
    const texte = (t, x, y, w, coul, bord, taille) => {
      ctx.font = "bold " + (taille || 96) + "px 'Arial Narrow', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (bord) (ctx.lineWidth = 10), (ctx.strokeStyle = bord), ctx.strokeText(t, x + w / 2, y + 66, w - 10);
      ctx.fillStyle = coul;
      ctx.fillText(t, x + w / 2, y + 66, w - 10);
    };
    texte("4-GI", 512, 0, 256, "#1e201d"), texte("BHA", 768, 0, 256, "#1e201d"), texte("118", 0, 128, 256, "#1e201d");
    texte("07", 256, 128, 256, "#c8261f", "#f1f0ea", 110), texte("0012", 512, 128, 256, "#1e201d"), texte("21", 768, 128, 256, "#c8261f", "#f1f0ea", 110);
    texte("ARMÉE DE L'AIR", 0, 256, 1024, "#1e201d", null, 100), texte("ARMÉE DE TERRE", 0, 384, 1024, "#1e201d", null, 100);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return (M.decalcos = new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.5, roughness: 0.65, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  }
  const uvCase = (nom, u, v) => {
    const [x0, y0, w, h] = CASES[nom];
    return [(x0 + u * w) / 1024, 1 - (y0 + (1 - v) * h) / 512];
  };
  // Une décalcomanie PLATE (sur une aile, une dérive) : au point p, tournée vers n ; « haut » dit où est le haut de l'image.
  function decalco(g, nom, p, n, haut, larg, hauteur, couleur) {
    const geo = new THREE.PlaneGeometry(larg, hauteur), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, ...uvCase(nom, uv.getX(i), uv.getY(i)));
    const zA = n.clone().normalize(), xA = new THREE.Vector3().crossVectors(haut, zA).normalize(), yA = new THREE.Vector3().crossVectors(zA, xA);
    geo.applyMatrix4(new THREE.Matrix4().makeBasis(xA, yA, zA).setPosition(p.clone().addScaledVector(zA, 0.006)));
    const m = O.piece(geo, decalcos());
    if (couleur !== undefined) m.userData.couleur = couleur;
    g.add(m);
  }
  // Une décalcomanie COURBE sur une coque : une petite grille qui épouse la tôle (x : le long de la coque ; a : l'angle
  // autour ; cote 1 : à droite, −1 : à gauche — le texte se lit toujours dans le bon sens).
  function decalcoCoque(g, coque, nom, x, a, larg, hauteur, cote) {
    const N = 6, pos = [], uv = [], idx = [];
    const aa = (v) => (cote > 0 ? v : Math.PI - v);
    const e = 0.01, dA = coque.point(x, aa(a + e)).p.distanceTo(coque.point(x, aa(a - e)).p) / (2 * e), da = hauteur / dA;
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const u = i / N, v = j / N;
      const { p } = coque.point(x + cote * (u - 0.5) * larg, aa(a + (v - 0.5) * da), 0.008);
      pos.push(p.x, p.y, p.z);
      uv.push(...uvCase(nom, u, v));
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const a1 = i * (N + 1) + j, b1 = a1 + 1, c1 = a1 + N + 1, d1 = c1 + 1;
      idx.push(a1, c1, b1, b1, c1, d1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // (la grille doit regarder vers l'extérieur de la coque)
    const n0 = coque.point(x, aa(a)).n, nn = geo.attributes.normal;
    if (nn.getX(Math.floor(nn.count / 2)) * n0.x + nn.getY(Math.floor(nn.count / 2)) * n0.y + nn.getZ(Math.floor(nn.count / 2)) * n0.z < 0) {
      for (let j = 0; j < idx.length; j += 3) [idx[j + 1], idx[j + 2]] = [idx[j + 2], idx[j + 1]];
      geo.setIndex(idx);
      geo.computeVertexNormals();
    }
    g.add(O.piece(geo, decalcos()));
  }
  // Une décalcomanie sur une aile (c : en part de la corde ; u : en part de l'envergure ; cote 1 : dessus, −1 : dessous).
  function decalcoAile(g, aile, nom, c, u, cote, larg, hauteur, haut) {
    const { p, n } = aile.userData.point(c, u, cote);
    decalco(g, nom, p, n, haut || new THREE.Vector3(1, 0, 0), larg, hauteur);
  }

  // ------------------------------------------------------------------ des petits outils de ce hangar
  const pt = (geo, x, y, z, couleur) => O.piece(geo, teinte(), x, y, z, couleur); // une petite pièce teintée
  const galet = (lx, ly, lz, rond, seg) => OU().galet(lx, ly, lz, rond, seg);
  function repeindre(geo, couleur) {
    const c = new THREE.Color(couleur), a = geo.attributes.color;
    for (let i = 0; i < a.count; i++) a.setXYZ(i, c.r, c.g, c.b);
  }
  // Poser les morceaux d'une coque : la peinture, les vitres, et les zones sombres (dans la matière à teintes).
  function poser(g, res, P, couleurs, sorte) {
    for (const nom in res.geos) {
      const geo = res.geos[nom];
      if (nom === "verre") g.add(O.piece(geo, verre(sorte)));
      else if (nom === "peinture" || nom === "coque") g.add(O.piece(geo, P));
      else {
        repeindre(geo, couleurs && couleurs[nom] !== undefined ? couleurs[nom] : COUL.sombre);
        g.add(O.piece(geo, teinte()));
      }
    }
    return res;
  }
  // « Cuire » un groupe de pièces dans un autre : chaque pièce garde sa forme, mais déplacée (x, y, z), tournée (rz : le
  // nez qui monte ; ry : autour de la verticale ; rx : autour de l'axe de l'avion).
  function cuire(cible, source, x, y, z, rz, ry, rx) {
    const t = new THREE.Object3D();
    t.position.set(x || 0, y || 0, z || 0);
    t.rotation.set(rx || 0, ry || 0, rz || 0, "YZX");
    t.updateMatrix();
    for (const m of [...source.children]) {
      m.updateMatrix();
      m.geometry = m.geometry.clone().applyMatrix4(m.matrix).applyMatrix4(t.matrix);
      m.position.set(0, 0, 0);
      m.rotation.set(0, 0, 0);
      m.scale.set(1, 1, 1);
      m.quaternion.identity();
      cible.add(m);
    }
  }
  // Un groupe qui tourne autour d'une CHARNIÈRE (une verrière, une rampe, une jambe de train) : ses pièces, construites à
  // leur vraie place, sont décalées pour que la charnière soit le point (0, 0, 0) du groupe.
  function charniere(groupe, x, y, z) {
    for (const m of groupe.children) {
      m.updateMatrix();
      m.geometry = m.geometry.clone().applyMatrix4(m.matrix).translate(-x, -y, -z);
      m.position.set(0, 0, 0);
      m.rotation.set(0, 0, 0);
      m.scale.set(1, 1, 1);
      m.quaternion.identity();
    }
    groupe.position.set(x, y, z);
    return groupe;
  }
  // Une ROUE d'avion : le pneu tout rond, la jante, le moyeu. Couchée sur l'axe z, centrée en (x, y, z).
  function roue(g, x, y, z, r, larg) {
    const w = larg / 2, ri = r * 0.6;
    g.add(O.couche(O.tour([[ri, -w * 0.8], [r * 0.86, -w], [r * 0.97, -w * 0.8], [r, -w * 0.35], [r, w * 0.35], [r * 0.97, w * 0.8], [r * 0.86, w], [ri, w * 0.8]], teinte(), 22, COUL.pneu), "z", x, y, z));
    g.add(O.couche(O.tour([[0.001, -w * 0.84], [ri * 1.02, -w * 0.84], [ri * 1.02, w * 0.84], [0.001, w * 0.84]], teinte(), 16, COUL.jante), "z", x, y, z));
    g.add(O.couche(O.cylindre(r * 0.2, r * 0.2, larg + 0.03, teinte(), 10, CT.acier), "z", x, y, z));
  }
  // Une pièce « tournée » (axe y) couchée pour pointer vers l'avant (x+), posée en (x, y, z).
  function versAvant(m, x, y, z) {
    m.rotation.z = -Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  }
  // Une forme vue dans un MIROIR (z → −z), ses triangles remis à l'endroit (pour les hélices qui tournent à l'envers).
  function miroir(geo) {
    const g = geo.clone().scale(1, 1, -1), t = g.index.array;
    for (let j = 0; j < t.length; j += 3) [t[j + 1], t[j + 2]] = [t[j + 2], t[j + 1]];
    g.computeVertexNormals();
    return g;
  }
  // La MARQUE de l'équipe (un rond de sa couleur), posée sur la tôle au point p, tournée vers n.
  function marque(g, p, n, r, couleur) {
    g.add(O.surLaSurface(pt(new THREE.CircleGeometry(r, 22).rotateX(-Math.PI / 2), 0, 0, 0, couleur), p.clone().addScaledVector(n, 0.01), n));
  }
  // Une ANTENNE en lame posée sur la tôle.
  function lame(g, p, n, haut, long) {
    const a = pt(galet(long, haut * 2, 0.025, 0.35, 8), 0, 0, 0, 0x2c2e2b);
    O.surLaSurface(a, p, n);
    g.add(a);
  }
  // Un FEU (de position, d'atterrissage) : une petite bulle brillante.
  const feu = (g, x, y, z, couleur, r) => g.add(O.piece(new THREE.SphereGeometry(r || 0.05, 10, 8), brillant(), x, y, z, couleur));

  // Un PILOTE assis sur son SIÈGE ÉJECTABLE (x, y, z : le haut de l'assise ; incl : le dossier penché en arrière, en rad).
  // Le siège : l'assise, le haut dossier, la « boîte à parachute » en haut, les rails, la poignée d'éjection jaune et noire
  // entre les jambes. Le pilote : sa combinaison de vol, son gilet et ses sangles, son casque avec la visière sombre et le
  // masque à oxygène (et son tuyau), les mains sur le manche (sur le côté droit dans le Rafale) et sur la manette des gaz.
  // o : { casque, combinaison, manche: "cote" | "centre", siege (false : pas de siège éjectable) }
  function pilote(cible, x, y, z, incl, o) {
    const g = new THREE.Group(), comb = o.combinaison || 0x56603f, casque = o.casque || 0xb9bdb5, sombre = 0x2a2c27;
    if (o.siege !== false) {
      g.add(pt(galet(0.52, 0.12, 0.5, 0.3, 10), 0.04, -0.07, 0, COUL.siege));
      g.add(pt(galet(0.15, 0.86, 0.52, 0.3, 10), -0.28, 0.36, 0, COUL.siege));
      g.add(pt(galet(0.22, 0.26, 0.42, 0.3, 10), -0.26, 0.84, 0, 0x454a40)); // la boîte à parachute
      for (const s of [-1, 1]) {
        g.add(O.tube([-0.37, -0.12, s * 0.22], [-0.37, 0.95, s * 0.22], 0.025, teinte(), 6, COUL.metal)); // les rails
        g.add(pt(new THREE.BoxGeometry(0.06, 0.1, 0.02), -0.22, 0.86, s * 0.215, 0xe0b020)); // les marques jaunes
      }
      g.add(O.cable([[0.29, -0.06, -0.07], [0.35, 0.03, -0.06], [0.35, 0.03, 0.06], [0.29, -0.06, 0.07]], 0.016, teinte(), 0xe0b020, 12)); // la poignée
      for (const zz of [-0.03, 0.03]) g.add(pt(new THREE.BoxGeometry(0.02, 0.03, 0.035), 0.352, 0.03, zz, 0x111111));
    }
    // les jambes (les cuisses vers l'avant, les tibias vers les pédales) et les bottes
    for (const s of [-1, 1]) {
      g.add(O.tube([0.0, 0.07, s * 0.11], [0.44, 0.13, s * 0.12], 0.075, teinte(), 10, comb));
      g.add(pt(new THREE.SphereGeometry(0.07, 10, 8), 0.44, 0.13, s * 0.12, comb));
      g.add(O.tube([0.44, 0.13, s * 0.12], [0.56, -0.3, s * 0.13], 0.06, teinte(), 10, comb));
      g.add(pt(galet(0.24, 0.1, 0.1, 0.4, 8), 0.62, -0.36, s * 0.13, sombre));
    }
    // le buste, le gilet de survie, les sangles
    const buste = pt(new THREE.CapsuleGeometry(0.16, 0.26, 4, 12), -0.07, 0.42, 0, comb);
    buste.scale.set(0.82, 1, 1.18);
    g.add(buste);
    g.add(pt(galet(0.3, 0.3, 0.4, 0.35, 10), -0.04, 0.44, 0, 0x454b37));
    for (const s of [-1, 1]) g.add(O.tube([0.06, 0.62, s * 0.11], [0.11, 0.14, s * 0.07], 0.016, teinte(), 6, 0x1f201c));
    g.add(O.tube([0.1, 0.16, -0.17], [0.1, 0.16, 0.17], 0.02, teinte(), 6, 0x1f201c));
    g.add(pt(new THREE.CylinderGeometry(0.06, 0.065, 0.12, 10), -0.05, 0.67, 0, 0xc49a76)); // le cou
    // le casque, sa visière, le masque à oxygène et son tuyau
    const tete = pt(new THREE.SphereGeometry(0.135, 16, 12), -0.04, 0.8, 0, casque);
    tete.scale.set(1.1, 1, 0.95);
    g.add(tete);
    const visiere = O.piece(new THREE.SphereGeometry(0.142, 18, 10, Math.PI - 1.15, 2.3, 0.82, 0.72), brillant(), -0.04, 0.8, 0, 0x2b2618);
    visiere.scale.set(1.1, 1, 0.97);
    g.add(visiere);
    g.add(versAvant(O.tour([[0.0, 0.0], [0.07, 0.0], [0.06, 0.07], [0.03, 0.1], [0.0, 0.1]], teinte(), 12, 0x4a4d47), 0.07, 0.73, 0));
    g.add(O.cable([[0.15, 0.71, 0], [0.13, 0.6, 0.06], [0.06, 0.48, 0.1], [0.0, 0.38, 0.1]], 0.018, teinte(), 0x2d2f2a, 10));
    // les bras : la main droite sur le manche, la gauche sur la manette des gaz
    const mains = o.manche === "cote" ? [[0.3, 0.25, 0.3], [0.2, 0.3, -0.31]] : [[0.34, 0.2, 0.05], [0.14, 0.28, -0.3]];
    [1, -1].forEach((s, k) => {
      const ep = [-0.05, 0.6, s * 0.21], m = mains[k], co = [(ep[0] + m[0]) / 2 - 0.1, (ep[1] + m[1]) / 2 - 0.1, (ep[2] + m[2]) / 2 + s * 0.06];
      g.add(pt(new THREE.SphereGeometry(0.068, 10, 8), ...ep, comb));
      g.add(O.tube(ep, co, 0.058, teinte(), 8, comb), O.tube(co, m, 0.048, teinte(), 8, comb));
      g.add(pt(new THREE.SphereGeometry(0.052, 8, 6), ...m, sombre));
    });
    // le manche
    if (o.manche === "cote") g.add(O.tube([0.3, 0.1, 0.3], [0.3, 0.24, 0.3], 0.025, teinte(), 6, 0x111111));
    else g.add(O.tube([0.38, -0.2, 0.05], [0.35, 0.18, 0.05], 0.022, teinte(), 6, 0x111111));
    cuire(cible, g, x, y, z, incl || 0);
  }

  // Un MISSILE (ou une bombe, un bidon d'essence), construit le long de x, centré en 0. sorte : mica, meteor, r73, r27,
  // fab (bombe), hellfire, bidon.
  function missile(sorte, peint) {
    const g = new THREE.Group(), blanc = 0xd9dbd6;
    const corps = (L, r, coul, nez) => {
      g.add(O.couche(O.cylindre(r, r, L * 0.82, teinte(), 14, coul), "x", -L * 0.09, 0, 0));
      g.add(O.tourX([[L * 0.32, r], [L * 0.38, r * 0.92], [L * 0.44, r * 0.6], [L * 0.48, r * 0.2], [L * 0.5, 0.001]], teinte(), 14, nez || coul));
      g.add(O.couche(O.cylindre(r * 0.9, r * 0.7, 0.04, teinte(), 12, 0x2a2a2a), "x", -L * 0.5 - 0.02, 0, 0));
    };
    // des ailettes en croix (en « X ») : x1 → x2 au pied, de corde c1 au pied et c2 au bout, de hauteur h
    const ailettes = (x, c1, c2, h, r, coul, plus) => {
      for (let k = 0; k < 4; k++) {
        const f = O.profil([[x, 0], [x - c1, 0], [x - c1 + (c1 - c2) * 0.2, h], [x - (c1 - c2) * 0.8, h]], 0.012, teinte(), 0.003, coul);
        f.rotation.x = (k * Math.PI) / 2 + (plus ? 0 : Math.PI / 4);
        f.position.y = 0;
        f.geometry.translate(0, r * 0.9, 0);
        g.add(f);
      }
    };
    if (sorte === "mica") {
      corps(3.1, 0.08, blanc, 0x30343a);
      g.add(O.couche(O.cylindre(0.081, 0.081, 0.06, teinte(), 14, 0xd8b020), "x", 1.05, 0, 0)); // la bande jaune
      ailettes(0.7, 1.9, 1.7, 0.06, 0.08, blanc), ailettes(-1.28, 0.26, 0.12, 0.13, 0.08, blanc);
    } else if (sorte === "meteor") {
      corps(3.65, 0.09, blanc, 0x9a9c98);
      for (const s of [-1, 1]) g.add(pt(galet(1.2, 0.1, 0.12, 0.4, 8), -0.7, -0.07, s * 0.07, blanc)); // les entrées d'air du statoréacteur
      ailettes(-1.5, 0.3, 0.14, 0.13, 0.09, blanc);
    } else if (sorte === "r73") {
      corps(2.9, 0.085, blanc, 0x4a4e52);
      ailettes(1.05, 0.12, 0.06, 0.07, 0.085, blanc, true), ailettes(-1.15, 0.32, 0.18, 0.17, 0.085, blanc, true);
    } else if (sorte === "r27") {
      corps(4.0, 0.115, blanc, 0x8a8c88);
      ailettes(0.2, 0.75, 0.2, 0.3, 0.115, blanc), ailettes(-1.65, 0.36, 0.2, 0.2, 0.115, blanc);
    } else if (sorte === "fab") {
      g.add(O.tourX([[-1.0, 0.001], [-1.0, 0.1], [-0.6, 0.2], [0.4, 0.21], [0.75, 0.16], [0.95, 0.07], [1.0, 0.001]], teinte(), 16, 0x3e4532));
      for (let k = 0; k < 4; k++) g.add(pt(new THREE.BoxGeometry(0.45, 0.01, 0.22), -0.85, 0, 0, 0x3e4532).rotateX((k * Math.PI) / 2 + Math.PI / 4).translateZ(0.19));
      g.add(O.couche(O.cylindre(0.212, 0.212, 0.05, teinte(), 16, 0xd8b020), "x", 0.55, 0, 0));
    } else if (sorte === "hellfire") {
      corps(1.63, 0.09, 0x56603e, 0x2b2e2a);
      ailettes(0.2, 0.32, 0.2, 0.1, 0.09, 0x56603e, true), ailettes(-0.62, 0.18, 0.12, 0.1, 0.09, 0x56603e, true);
    } else if (sorte === "bidon") { // un bidon d'essence (peint comme l'avion, avec ses petites ailettes)
      const b = O.tourX([[-2.6, 0.001], [-2.55, 0.08], [-2.1, 0.28], [-1.2, 0.36], [1.0, 0.36], [1.9, 0.3], [2.4, 0.16], [2.6, 0.001]], peint, 20);
      g.add(b);
      for (let k = 0; k < 3; k++) g.add(pt(new THREE.BoxGeometry(0.5, 0.18, 0.012), -2.15, 0, 0, 0x6a6e66).rotateX((k * Math.PI * 2) / 3).translateY(0.24));
    }
    return g;
  }
  // Un PYLÔNE (l'attache sous l'aile) : un petit profil effilé, de la tôle jusqu'au missile.
  function pylone(g, x, yHaut, yBas, z, long, P) {
    g.add(O.profil([[x + long / 2, yHaut], [x - long / 2, yHaut], [x - long / 2 + 0.2, yBas], [x + long / 2 - 0.35, yBas]], 0.07, P || teinte(), 0.02, P ? undefined : 0x5a5f58).translateZ(z));
  }
  // Une TUYÈRE de réacteur (le long de x, la bouche en x2) : l'enveloppe (plus foncée et dorée par la chaleur au bout),
  // l'intérieur sombre, et la « lueur » (le fond qui rougeoie quand le moteur tourne).
  function tuyere(g, lueurs, x1, x2, y, z, r) {
    // (un profil qui avance vers x+ donne une surface tournée vers l'extérieur ; vers x−, vers l'intérieur)
    g.add(O.tourX([[x2, r * 0.9], [x2 + 0.05, r * 0.96], [x1 + (x2 - x1) * 0.35, r * 1.05], [x1, r * 1.04]], teinte(), 22, COUL.tuyere).translateY(y).translateZ(z));
    g.add(O.tourX([[x2 + 0.3, r * 0.8], [x2 + 0.1, r * 0.84], [x2, r * 0.9]], teinte(), 22, COUL.chaud).translateY(y).translateZ(z));
    g.add(O.couche(O.cylindre(r * 0.84, r * 0.84, 0.02, teinte(), 22, 0x0c0c0c), "x", x2 + 0.32, y, z));
    for (let k = 0; k < 12; k++) { // les « plumes » de la tuyère (les volets qui s'ouvrent et se ferment)
      const a = (k / 12) * Math.PI * 2;
      g.add(O.tube([x1 + (x2 - x1) * 0.45, y + Math.sin(a) * r * 1.03, z + Math.cos(a) * r * 1.03], [x2 + 0.03, y + Math.sin(a) * r * 0.93, z + Math.cos(a) * r * 0.93], 0.012, teinte(), 4, 0x2e2c2a));
    }
    lueurs.push([x2 + 0.31, y, z, r * 0.8]);
  }
  // Les FLAMMES de la postcombustion, en une seule pièce (une par tuyère : le cône orange, le cœur blanc-jaune, les
  // « diamants » de choc). Le groupe est posé à la bouche des tuyères : on l'allonge (x) selon la puissance.
  function flammes(caisse, lueurs, x0) {
    const geos = [];
    const colorer = (geo, c1, c2, L) => {
      const p = geo.attributes.position, col = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) {
        const t = Math.min(1, Math.max(0, -p.getX(i) / L));
        for (let k = 0; k < 3; k++) col[i * 3 + k] = c1[k] + (c2[k] - c1[k]) * t;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      return geo;
    };
    for (const [, y, z, r] of lueurs) {
      const cone = (rr, L, c1, c2) => geos.push(colorer(new THREE.ConeGeometry(rr, L, 18, 1, true).rotateZ(Math.PI / 2).translate(-L / 2, y, z).toNonIndexed(), c1, c2, L));
      cone(r * 0.95, 3.4, [0.75, 0.36, 0.12], [0.15, 0.04, 0.02]);
      cone(r * 0.6, 1.6, [0.85, 0.66, 0.42], [0.45, 0.18, 0.06]);
      for (let k = 0; k < 4; k++) {
        const d = new THREE.SphereGeometry(r * (0.42 - k * 0.06), 10, 6).scale(1.8, 1, 1).translate(-0.45 - k * 0.55, y, z).toNonIndexed();
        const cd = [0.6, 0.45, 0.32].map((v) => v * (1 - k * 0.2));
        geos.push(colorer(d, cd, cd, 1));
      }
    }
    const geo = new THREE.BufferGeometry();
    for (const nom of ["position", "color"]) {
      const tab = new Float32Array(geos.reduce((t, x) => t + x.attributes[nom].array.length, 0));
      let k = 0;
      for (const x of geos) (tab.set(x.attributes[nom].array, k), (k += x.attributes[nom].array.length));
      geo.setAttribute(nom, new THREE.BufferAttribute(tab, 3));
    }
    const flamme = new THREE.Mesh(geo, matFlamme());
    flamme.name = "flamme";
    flamme.position.set(x0, 0, 0);
    flamme.castShadow = false;
    flamme.userData.garder = true;
    caisse.add(flamme);
    // la lueur au fond des tuyères (un disque qui « ajoute » de la lumière orange)
    const ls = lueurs.map(([x, y, z, r]) => colorer(new THREE.CircleGeometry(r * 0.98, 20).rotateY(-Math.PI / 2).translate(x - 0.01, y, z).toNonIndexed(), [1, 0.42, 0.12], [1, 0.42, 0.12], 1));
    const gl = new THREE.BufferGeometry();
    for (const nom of ["position", "color"]) {
      const tab = new Float32Array(ls.reduce((t, x) => t + x.attributes[nom].array.length, 0));
      let k = 0;
      for (const x of ls) (tab.set(x.attributes[nom].array, k), (k += x.attributes[nom].array.length));
      gl.setAttribute(nom, new THREE.BufferAttribute(tab, 3));
    }
    const lueur = new THREE.Mesh(gl, matFlamme());
    lueur.name = "lueur";
    lueur.castShadow = false;
    lueur.userData.garder = true;
    caisse.add(lueur);
  }
  // Une PALE de rotor : un vrai profil d'aile, qui PLIE un peu sous son poids, le bout en flèche (comme sur le Tigre) et
  // peint en jaune. Couchée le long de x, de r0 à r.
  function geoPale(r0, r, corde, ep, fleche, nu) {
    const geo = O.surface(nu || 26, 14, (u, v) => {
      const x = r0 + (r - r0) * u, th = v * Math.PI * 2, xc = 0.5 * (1 + Math.cos(th));
      const t = 5 * ep * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1036 * xc ** 4);
      const bout = u > 0.92 ? (u - 0.92) / 0.08 : 0, c = corde * (1 - 0.55 * bout * bout);
      const y = Math.sign(Math.sin(th)) * t * c * (u > 0.995 ? 0.3 : 1) - fleche * u * u;
      return [x, y, (xc - 0.3) * c - corde * 0.35 * bout * bout];
    }, true);
    const n = geo.attributes.position.count, col = new Float32Array(n * 3), a = new THREE.Color(0x2a2d30), b = new THREE.Color(0xd8b020);
    for (let i = 0; i < n; i++) {
      const u = (geo.attributes.position.getX(i) - r0) / (r - r0), c = u > 0.9 && u < 0.94 ? b : a;
      (col[i * 3] = c.r), (col[i * 3 + 1] = c.g), (col[i * 3 + 2] = c.b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }
  // Une PALE D'HÉLICE (en forme de sabre, comme sur l'A400M) : le long de y (du moyeu vers le bout), qui tourne autour
  // de x. Plus large au milieu, tordue (le « pas » diminue vers le bout), et recourbée vers l'arrière.
  function geoPaleHelice(r0, r1, corde, pas0, pas1, fleche, couleur, bout) {
    const geo = O.surface(16, 12, (u, v) => {
      const y = r0 + (r1 - r0) * u, th = v * Math.PI * 2, xc = 0.5 * (1 + Math.cos(th));
      const c = corde * (0.7 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.2))) * (u > 0.88 ? 1 - ((u - 0.88) / 0.12) * 0.6 : 1);
      const e = 0.5 * c * 5 * 0.09 * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc ** 3 - 0.1036 * xc ** 4) * Math.sign(Math.sin(th));
      const xi = (xc - 0.3) * c, beta = pas0 + (pas1 - pas0) * u, s = -fleche * u * u;
      return [xi * Math.sin(beta) + e * Math.cos(beta), y, xi * Math.cos(beta) - e * Math.sin(beta) + s];
    }, true);
    O.orienter(geo);
    const n = geo.attributes.position.count, col = new Float32Array(n * 3), a = new THREE.Color(couleur), b = new THREE.Color(bout || couleur);
    for (let i = 0; i < n; i++) {
      const u = (geo.attributes.position.getY(i) - r0) / (r1 - r0), c = u > 0.93 ? b : a;
      (col[i * 3] = c.r), (col[i * 3 + 1] = c.g), (col[i * 3 + 2] = c.b);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }
  // La SALETÉ : la peinture un peu plus claire ou plus foncée par endroits, et la suie derrière les moteurs (xSuie).
  const salissure = (xSuie, longSuie) => (p) => {
    let v = 1 + 0.05 * bruit(p.x * 0.7 + 1, p.y * 0.9 + p.z * 0.7) + 0.025 * bruit(p.x * 2.3, p.z * 2.1 + p.y);
    if (xSuie !== undefined && p.x < xSuie) v *= 1 - 0.4 * Math.min(1, (xSuie - p.x) / longSuie);
    return [v, v, v];
  };
  // Un CADRE de verrière : un fin tube qui suit la coque de la verrière à l'abscisse x, d'un côté à l'autre.
  function cadre(g, res, x, a0, r, couleur) {
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const { p } = res.point(x, a0 + ((Math.PI - 2 * a0) * k) / 12, 0.012);
      pts.push([p.x, p.y, p.z]);
    }
    g.add(O.cable(pts, r || 0.022, teinte(), couleur || 0x2b2d2a, 36));
  }

  // ------------------------------------------------------------------ le RAFALE
  // Mesures : 15,3 m de long, 10,9 m d'envergure, 5,3 m de haut. Le fuselage a son axe à 2 m du sol.
  function rafale(equipe) {
    const P = peinture(equipe, "chasse"), E = Tanks.CONFIG.equipes[equipe];
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const sale = salissure(-5.9, 1.4);
    // 1. Le FUSELAGE : large et plat derrière (les 2 moteurs), il s'affine vers le long nez rond (le radar). Sous la
    // verrière, on découpe le trou du cockpit ; devant le pare-brise, le panneau « anti-reflet » sombre.
    const cles = [
      { x: -7.05, y: 2.0, w: 0.98, h: 0.46, b: 0.42, n: 2.6 }, { x: -6.4, y: 2.02, w: 1.04, h: 0.52, b: 0.46, n: 3.0 },
      { x: -4.0, y: 2.04, w: 1.1, h: 0.6, b: 0.52, n: 3.4 }, { x: -1.0, y: 2.06, w: 1.06, h: 0.64, b: 0.56, n: 3.4 },
      { x: 1.0, y: 2.1, w: 0.86, h: 0.66, b: 0.56, n: 3.0 }, { x: 2.6, y: 2.14, w: 0.62, h: 0.62, b: 0.52, n: 2.6 },
      { x: 4.4, y: 2.16, w: 0.52, h: 0.52, b: 0.46, n: 2.3 }, { x: 5.6, y: 2.13, w: 0.43, h: 0.42, b: 0.4, n: 2.1 },
      { x: 6.7, y: 2.09, w: 0.27, h: 0.26, b: 0.26, n: 2 }, { x: 7.4, y: 2.05, w: 0.1, h: 0.1, b: 0.1, n: 2 },
      { x: 7.62, y: 2.04, w: 0.02, h: 0.02, b: 0.02, n: 2 },
    ];
    const fus = O.coque(cles, {
      tours: 52, pas: 0.12, uv: 1, couleur: sale, coupes: [2.78, 4.72, 4.86, 5.5, 6.95],
      zone: (c, n, z) => {
        if (z.x > 2.78 && z.x < 4.72 && z.a > 0.95) return null; // le trou du cockpit
        if (z.x > 4.86 && z.x < 5.5 && z.a > 0.9) return "antireflet";
        if (z.x > 6.95) return "radome";
        return "peinture";
      },
    });
    poser(caisse, fus, P, { antireflet: 0x2d302a, radome: 0x5a5f55 });
    // la « baignoire » du cockpit (vue de l'intérieur), la planche de bord, le viseur tête haute
    poser(caisse, O.coque([
      { x: 2.6, y: 2.42, w: 0.2, h: 0.2, b: 0.2 }, { x: 2.85, y: 2.4, w: 0.38, h: 0.42, b: 0.36 },
      { x: 4.55, y: 2.4, w: 0.36, h: 0.4, b: 0.34 }, { x: 4.85, y: 2.42, w: 0.2, h: 0.2, b: 0.2 },
    ], { tours: 24, pas: 0.4, retourner: true, couleur: () => [1, 1, 1], zone: () => "interieur" }), P, { interieur: 0x2a2c2a });
    caisse.add(pt(galet(0.32, 0.22, 0.62, 0.3, 10), 4.5, 2.72, 0, 0x1d1e1d)); // la planche de bord (sous sa casquette)
    caisse.add(pt(new THREE.BoxGeometry(0.02, 0.16, 0.5), 4.36, 2.72, 0, 0x101820)); // les écrans
    caisse.add(O.piece(new THREE.BoxGeometry(0.01, 0.14, 0.16), brillant(), 4.47, 2.9, 0, 0x5a7a62).rotateZ(0.35)); // le viseur tête haute
    for (const s of [-1, 1]) caisse.add(pt(galet(0.9, 0.08, 0.14, 0.3, 8), 3.4, 2.5, s * 0.33, 0x262826)); // les consoles
    // 2. Le DOS (derrière la verrière, jusqu'à la dérive).
    poser(caisse, O.coque([
      { x: -5.9, y: 2.5, w: 0.12, h: 0.05, b: 0.1, n: 2.5 }, { x: -3.5, y: 2.5, w: 0.4, h: 0.22, b: 0.1, n: 2.8 },
      { x: 0.5, y: 2.55, w: 0.45, h: 0.38, b: 0.1, n: 2.8 }, { x: 2.0, y: 2.58, w: 0.42, h: 0.45, b: 0.1, n: 2.6 },
      { x: 2.5, y: 2.6, w: 0.32, h: 0.34, b: 0.1, n: 2.4 }, { x: 2.72, y: 2.6, w: 0.05, h: 0.05, b: 0.05 },
    ], { tours: 36, pas: 0.15, uv: 1, couleur: sale }), P);
    // 3. Les 2 ENTRÉES D'AIR, sous le cockpit (la lèvre du bas plus en avant), leur intérieur sombre, la plaque de séparation.
    const entrees = [];
    for (const s of [-1, 1]) {
      const ce = [
        { x: -1.8, y: 1.78, w: 0.2, h: 0.25, b: 0.22, n: 2.6, z: s * 0.66 }, { x: 0.0, y: 1.66, w: 0.4, h: 0.42, b: 0.42, n: 2.8, z: s * 0.8 },
        { x: 2.0, y: 1.64, w: 0.4, h: 0.42, b: 0.44, n: 2.8, z: s * 0.82 }, { x: 3.05, y: 1.64, w: 0.39, h: 0.41, b: 0.43, n: 2.8, z: s * 0.82 },
      ];
      const biseau = (p) => {
        p.x += (1.64 - p.y) * 0.45 * Math.max(0, Math.min(1, (p.x - 2.4) / 0.65)); // (en douceur : la tôle ne se replie pas)
      };
      entrees.push(poser(caisse, O.coque(ce, { tours: 36, pas: 0.15, uv: 1, couleur: sale, fermer: [true, false], deformer: biseau }), P));
      poser(caisse, O.coque(ce.map((k) => Object.assign({}, k, { w: k.w - 0.05, h: k.h - 0.05, b: k.b - 0.05, x: k.x + 0.01 })), { tours: 24, pas: 0.4, retourner: true, fermer: [true, false], deformer: biseau, couleur: () => [1, 1, 1], zone: () => "sombre" }), P, { sombre: 0x121212 });
      caisse.add(pt(new THREE.BoxGeometry(1.2, 0.7, 0.03), 2.55, 1.66, s * 0.42, 0x4f5449)); // la plaque de séparation
    }
    // 4. Les CANARDS, l'AILE DELTA (avec ses gouvernes et les becs du bord d'attaque), la DÉRIVE (et sa gouverne).
    const ailes = [];
    for (const s of [-1, 1]) {
      caisse.add(O.aile({ x: 3.3, y: 2.27, z: s * 0.55, corde: 1.75, ep: 0.05 }, { x: 1.95, y: 2.38, z: s * 2.45, corde: 0.55, ep: 0.04 }, P, { nu: 4, nv: 10, uv: 1, fentes: [{ c: 0.7, de: 0.1, a: 0.95 }] }));
      const a = O.aile({ x: 0.9, y: 1.78, z: s * 0.7, corde: 7.1, ep: 0.05 }, { x: -4.35, y: 1.8, z: s * 5.25, corde: 1.75, ep: 0.035 }, P, {
        nu: 10, nv: 14, uv: 1, fentes: [{ c: 0.85, de: 0.06, a: 0.97 }, { u: 0.5, c0: 0.85 }, { u: 0.06, c0: 0.85 }, { c: 0.1, de: 0.25, a: 0.95 }],
      });
      caisse.add(a);
      ailes.push(a);
    }
    const derive = O.aile({ x: -3.5, y: 2.55, z: 0, corde: 3.3, ep: 0.07 }, { x: -6.35, y: 5.3, z: 0, corde: 1.2, ep: 0.05 }, P, { nu: 8, nv: 12, uv: 1, fentes: [{ c: 0.72, de: 0.1, a: 0.92 }, { u: 0.1, c0: 0.72 }] });
    caisse.add(derive);
    poser(caisse, O.coque([{ x: -7.6, y: 5.28, w: 0.04, h: 0.03, b: 0.03 }, { x: -7.3, y: 5.3, w: 0.09, h: 0.09, b: 0.07 }, { x: -6.2, y: 5.3, w: 0.09, h: 0.1, b: 0.07 }, { x: -5.9, y: 5.3, w: 0.02, h: 0.02, b: 0.02 }], { tours: 16, pas: 0.25, couleur: () => [1, 1, 1], zone: () => "pointe" }), P, { pointe: 0x34382f }); // l'antenne en haut de la dérive
    caisse.add(pt(galet(0.6, 0.22, 0.26, 0.4, 10), -3.3, 2.7, 0, 0x2b2d2a)); // la petite entrée d'air au pied de la dérive
    caisse.add(pt(new THREE.BoxGeometry(0.02, 0.16, 0.2), -3.02, 2.7, 0, 0x0c0c0c));
    // 5. Les 2 TUYÈRES (et la lueur au fond, et les flammes).
    const lueurs = [];
    for (const s of [-1, 1]) tuyere(caisse, lueurs, -6.9, -7.45, 2.0, s * 0.5, 0.43);
    flammes(caisse, lueurs, -7.45);
    // 6. Les ARMES et les BIDONS : 2 bidons d'essence sous l'aile (et leurs pylônes), la nacelle de visée sous l'entrée
    // d'air droite, la perche de ravitaillement, le canon.
    for (const s of [-1, 1]) {
      cuire(caisse, missile("bidon", P), -1.4, 1.17, s * 2.3);
      pylone(caisse, -1.2, 1.74, 1.45, s * 2.3, 2.2, P);
      pylone(caisse, -2.6, 1.72, 1.5, s * 3.55, 1.6, P); // (les pylônes des missiles sous l'aile)
      caisse.add(pt(new THREE.BoxGeometry(2.2, 0.06, 0.06), -4.8, 1.74, s * 5.32, 0x5a5f58)); // les rails au bout des ailes
    }
    poser(caisse, O.coque([{ x: -0.1, y: 1.04, w: 0.04, h: 0.04 }, { x: 0.3, y: 1.04, w: 0.17, h: 0.17 }, { x: 2.0, y: 1.04, w: 0.17, h: 0.17 }, { x: 2.35, y: 1.04, w: 0.12, h: 0.12 }, { x: 2.45, y: 1.04, w: 0.02, h: 0.02 }].map((k) => Object.assign(k, { z: 0.85 })), {
      tours: 20, pas: 0.3, couleur: () => [1, 1, 1], zone: (c) => (c.x > 2.3 ? "verre" : "nacelle"),
    }), P, { nacelle: 0x6b7068 });
    caisse.add(pt(new THREE.BoxGeometry(1.2, 0.12, 0.06), 1.2, 1.18, 0.85, 0x5a5f58));
    caisse.add(O.tube([4.9, 2.6, 0.36], [6.1, 2.66, 0.3], 0.035, teinte(), 10, 0x4f5449)); // la perche de ravitaillement
    caisse.add(versAvant(O.tour([[0.0, 0.0], [0.055, 0.0], [0.04, 0.12], [0.0, 0.14]], teinte(), 10, 0x2a2a2a), 6.1, 2.66, 0.3));
    caisse.add(O.tube([7.6, 2.04, 0], [8.15, 2.04, 0], 0.018, teinte(), 6, CT.acier)); // la sonde (le tube de Pitot)
    caisse.add(pt(galet(0.42, 0.1, 0.12, 0.4, 8), 2.4, 2.05, 0.58, 0x1c1c1c)); // la bouche du canon
    // 7. Les antennes, les feux, les sièges d'éjection marqués, les marches.
    lame(caisse, new THREE.Vector3(-1.2, 2.93, 0), new THREE.Vector3(0, 1, 0), 0.15, 0.3);
    lame(caisse, new THREE.Vector3(1.5, 1.52, 0), new THREE.Vector3(0, -1, 0), 0.12, 0.26);
    feu(caisse, -4.55, 1.83, 5.42, 0x30ff60), feu(caisse, -4.55, 1.83, -5.42, 0xff2a20);
    feu(caisse, -7.62, 5.3, 0, 0xffffff, 0.04);
    for (const s of [-1, 1]) caisse.add(pt(new THREE.BoxGeometry(0.5, 0.025, 0.02), 0.2, 2.35, s * 0.86, 0xb6d48a)); // les bandes de formation
    // 8. Les DÉCALCOMANIES : les cocardes (sur les entrées d'air et sur les ailes), le code sur la dérive, le numéro sur le
    // nez, le triangle « siège éjectable ».
    for (const [k, s] of [[0, -1], [1, 1]]) {
      decalcoCoque(caisse, entrees[k], "cocarde", 0.4, 0.12, 0.66, 0.66, s);
      decalcoAile(caisse, ailes[k], "cocarde", 0.42, 0.66, 1, 0.9, 0.9);
      decalcoAile(caisse, ailes[k], "cocarde", 0.42, 0.66, -1, 0.9, 0.9);
      decalcoCoque(caisse, fus, "118", 5.9, 0.15, 0.6, 0.3, s);
      decalcoCoque(caisse, fus, "triangle", 3.7, 0.55, 0.22, 0.22, s);
      const { p, n } = derive.userData.point(0.4, 0.42, s);
      decalco(caisse, "4-GI", p, n, new THREE.Vector3(0, 1, 0), 1.0, 0.5);
      const f = derive.userData.point(0.45, 0.84, s);
      marque(caisse, f.p, f.n, 0.17, E.marque);
    }
    // 9. Le SIÈGE du pilote (le pilote lui-même est à part : il n'est là que quand tu pilotes).
    const pil = new THREE.Group();
    pil.name = "pilote";
    const tmp = new THREE.Group();
    pilote(tmp, 3.35, 2.27, 0, 0.42, { manche: "cote", casque: 0xb9bdb5 });
    // (on range le siège dans la caisse, et le pilote dans son groupe : le siège est ce qui est foncé et derrière)
    const siegeCouleurs = [COUL.siege, 0x454a40, COUL.metal, 0xe0b020, 0x111111];
    for (const m of [...tmp.children]) {
      const c = m.userData.teinte;
      const estSiege = c && siegeCouleurs.some((x) => new THREE.Color(x).equals(c)) && m.material === teinte();
      (estSiege ? caisse : pil).add(m);
    }
    // 10. La VERRIÈRE (elle s'ouvre en se levant autour de sa charnière, derrière) et le pare-brise (fixe).
    const canopee = O.coque([
      { x: 2.25, y: 2.62, w: 0.06, h: 0.04, b: 0.02 }, { x: 2.7, y: 2.62, w: 0.36, h: 0.36, b: 0.04, n: 2.2 },
      { x: 3.5, y: 2.6, w: 0.43, h: 0.56, b: 0.04, n: 2.2 }, { x: 4.3, y: 2.6, w: 0.42, h: 0.46, b: 0.04, n: 2.2 },
      { x: 4.95, y: 2.6, w: 0.36, h: 0.18, b: 0.04, n: 2.2 }, { x: 5.3, y: 2.6, w: 0.12, h: 0.03, b: 0.03 },
    ], { tours: 40, pas: 0.08, coupes: [4.42], zone: (c, n, z) => (z.a < 0.04 ? null : z.x > 4.42 ? "pare" : "verre") });
    caisse.add(O.piece(canopee.geos.pare, verre("avion"))); // le pare-brise (fixe)
    O.souder(caisse);
    O.souder(pil);
    caisse.add(pil);
    const verriere = new THREE.Group();
    verriere.name = "verriere";
    verriere.add(O.piece(canopee.geos.verre, verre("avion")));
    cadre(verriere, canopee, 4.4, 0.05, 0.026);
    cadre(verriere, canopee, 2.62, 0.05, 0.03, 0x34372f);
    for (const s of [-1, 1]) { // les bords de la verrière
      const pts = [];
      for (let x = 2.5; x <= 4.4; x += 0.2) {
        const { p } = canopee.point(x, s > 0 ? 0.06 : Math.PI - 0.06, 0.01);
        pts.push([p.x, p.y, p.z]);
      }
      verriere.add(O.cable(pts, 0.025, teinte(), 0x34372f, 20));
    }
    verriere.add(pt(galet(0.12, 0.08, 0.1, 0.4, 8), 3.0, 3.12, 0, 0x2b2d2a)); // le rétroviseur
    charniere(verriere, 2.35, 2.66, 0);
    O.souder(verriere, false);
    caisse.add(verriere);
    // 11. Les 6 MISSILES (chacun à part : il disparaît quand tu le tires) : 2 Meteor sous le ventre, 2 MICA sous les
    // ailes, 2 MICA au bout des ailes.
    const missiles = [];
    for (const [sorte, x, y, z] of [["meteor", -1.9, 1.36, -0.55], ["meteor", -1.9, 1.36, 0.55], ["mica", -2.6, 1.4, -3.55], ["mica", -2.6, 1.4, 3.55], ["mica", -4.8, 1.82, -5.4], ["mica", -4.8, 1.82, 5.4]]) {
      const m = new THREE.Group();
      cuire(m, missile(sorte), x, y, z);
      O.souder(m);
      caisse.add(m);
      missiles.push(m);
    }
    // 12. Le TRAIN D'ATTERRISSAGE : chaque jambe tourne autour de sa charnière pour rentrer (les roues principales vers
    // l'avant, celle du nez vers l'arrière).
    const jambes = [];
    for (const s of [-1, 1]) {
      const j = new THREE.Group();
      j.name = "jambe";
      const hx = -1.6, hy = 1.52, hz = s * 1.22;
      j.add(O.tube([hx, hy, hz], [hx - 0.22, hy - 0.8, hz], 0.075, teinte(), 10, COUL.metal));
      j.add(O.tube([hx - 0.2, hy - 0.72, hz], [hx - 0.28, hy - 1.14, hz], 0.055, teinte(), 10, COUL.chrome));
      j.add(O.tube([hx - 0.15, hy - 0.5, hz], [hx + 0.55, hy - 0.05, hz - s * 0.12], 0.035, teinte(), 8, COUL.metal));
      j.add(O.tube([hx - 0.28, hy - 1.16, hz], [hx - 0.28, hy - 1.16, hz + s * 0.14], 0.04, teinte(), 8, COUL.metal));
      roue(j, hx - 0.28, hy - 1.18, hz + s * 0.16, 0.34, 0.22);
      j.add(pt(galet(1.05, 0.7, 0.035, 0.2, 10), hx - 0.12, hy - 0.3, hz + s * 0.12, K().peinture.chasse[equipe].ventre)); // la trappe
      charniere(j, hx, hy, hz);
      O.souder(j);
      j.userData.sens = 1;
      jambes.push(j);
    }
    {
      const j = new THREE.Group();
      j.name = "jambe";
      const hx = 4.85, hy = 1.62;
      j.add(O.tube([hx, hy, 0], [hx + 0.06, hy - 0.85, 0], 0.07, teinte(), 10, COUL.metal));
      j.add(O.tube([hx + 0.05, hy - 0.8, 0], [hx + 0.12, hy - 1.36, 0], 0.05, teinte(), 10, COUL.chrome));
      j.add(O.tube([hx + 0.12, hy - 1.36, -0.16], [hx + 0.12, hy - 1.36, 0.16], 0.035, teinte(), 8, COUL.metal));
      for (const s of [-1, 1]) roue(j, hx + 0.12, hy - 1.38, s * 0.15, 0.24, 0.13);
      j.add(O.tube([hx - 0.05, hy - 0.45, 0], [hx - 0.75, hy - 0.05, 0], 0.035, teinte(), 8, COUL.metal));
      j.add(O.couche(O.cylindre(0.06, 0.07, 0.08, brillant(), 12, 0xfff6d8), "x", hx + 0.12, hy - 0.62, 0)); // le phare
      for (const s of [-1, 1]) j.add(pt(galet(1.25, 0.5, 0.03, 0.2, 10), hx - 0.4, hy - 0.22, s * 0.22, K().peinture.chasse[equipe].fond));
      charniere(j, hx, hy, 0);
      O.souder(j);
      j.userData.sens = -1;
      jambes.push(j);
    }
    const train = new THREE.Group();
    train.name = "train";
    for (const j of jambes) train.add(j);
    caisse.add(train);
    return g;
  }

  // ------------------------------------------------------------------ le CHASSEUR ENNEMI (comme un MiG-29)
  // Mesures : 17,3 m de long, 11,4 m d'envergure, 4,7 m de haut.
  function chasseur(equipe) {
    const P = peinture(equipe, "chasse"), E = Tanks.CONFIG.equipes[equipe];
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const sale = salissure(-6.6, 1.3);
    // 1. Le FUSELAGE du milieu : le long nez qui penche un peu, le cockpit, la bosse sur le dos, puis le « pont » plat
    // entre les 2 moteurs, et le cône de queue (l'aérofrein) entre les tuyères.
    const cles = [
      { x: -7.6, y: 2.12, w: 0.18, h: 0.14, b: 0.14 }, { x: -6.6, y: 2.1, w: 0.5, h: 0.26, b: 0.22, n: 3 },
      { x: -3.0, y: 2.1, w: 0.82, h: 0.4, b: 0.26, n: 3.6 }, { x: 0.0, y: 2.14, w: 0.78, h: 0.52, b: 0.32, n: 3.2 },
      { x: 2.6, y: 2.2, w: 0.66, h: 0.62, b: 0.42, n: 2.8 }, { x: 4.5, y: 2.22, w: 0.6, h: 0.58, b: 0.5, n: 2.5 },
      { x: 6.0, y: 2.15, w: 0.5, h: 0.48, b: 0.48, n: 2.2 }, { x: 7.5, y: 2.04, w: 0.33, h: 0.33, b: 0.33, n: 2 },
      { x: 8.5, y: 1.97, w: 0.1, h: 0.1, b: 0.1 }, { x: 8.75, y: 1.96, w: 0.02, h: 0.02, b: 0.02 },
    ];
    const fus = O.coque(cles, {
      tours: 52, pas: 0.12, uv: 1, couleur: sale, coupes: [3.72, 5.62, 5.75, 6.3, 7.2],
      zone: (c, n, z) => {
        if (z.x > 3.72 && z.x < 5.62 && z.a > 0.95) return null;
        if (z.x > 5.75 && z.x < 6.3 && z.a > 0.9) return "antireflet";
        if (z.x > 7.2) return "radome";
        return "peinture";
      },
    });
    poser(caisse, fus, P, { antireflet: 0x2d302a, radome: 0x8f9a8c });
    poser(caisse, O.coque([
      { x: 3.6, y: 2.48, w: 0.2, h: 0.2, b: 0.2 }, { x: 3.85, y: 2.46, w: 0.38, h: 0.42, b: 0.36 },
      { x: 5.45, y: 2.46, w: 0.36, h: 0.4, b: 0.34 }, { x: 5.75, y: 2.48, w: 0.2, h: 0.2, b: 0.2 },
    ], { tours: 24, pas: 0.4, retourner: true, couleur: () => [1, 1, 1], zone: () => "interieur" }), P, { interieur: 0x2f3a3a });
    caisse.add(pt(galet(0.3, 0.22, 0.62, 0.3, 10), 5.45, 2.78, 0, 0x1d1e1d));
    caisse.add(pt(new THREE.BoxGeometry(0.02, 0.16, 0.5), 5.31, 2.78, 0, 0x6a8a84)); // la planche de bord (bleu-vert, comme les vrais)
    // la BOSSE sur le dos
    poser(caisse, O.coque([
      { x: -5.0, y: 2.42, w: 0.15, h: 0.04, b: 0.1 }, { x: -1.0, y: 2.55, w: 0.42, h: 0.2, b: 0.1, n: 2.8 },
      { x: 2.2, y: 2.62, w: 0.46, h: 0.44, b: 0.1, n: 2.6 }, { x: 3.4, y: 2.7, w: 0.38, h: 0.4, b: 0.1 },
      { x: 3.72, y: 2.72, w: 0.06, h: 0.06, b: 0.05 },
    ], { tours: 36, pas: 0.15, uv: 1, couleur: sale }), P);
    // 2. Les 2 NACELLES des moteurs (bien écartées), avec leurs entrées d'air carrées penchées, et l'intérieur sombre.
    const nacelles = [];
    for (const s of [-1, 1]) {
      const cn = [
        { x: -7.25, y: 1.82, w: 0.46, h: 0.46, b: 0.46, n: 2.2, z: s * 1.05 }, { x: -5.5, y: 1.82, w: 0.52, h: 0.52, b: 0.52, n: 2.4, z: s * 1.05 },
        { x: -1.0, y: 1.8, w: 0.55, h: 0.56, b: 0.58, n: 3, z: s * 1.05 }, { x: 1.8, y: 1.72, w: 0.5, h: 0.5, b: 0.56, n: 3.8, z: s * 1.02 },
        { x: 3.0, y: 1.7, w: 0.47, h: 0.47, b: 0.52, n: 4.2, z: s * 1.0 },
      ];
      const biseau = (p) => {
        p.x += (p.y - 1.7) * 0.55 * Math.max(0, Math.min(1, (p.x - 2.3) / 0.7));
      };
      nacelles.push(poser(caisse, O.coque(cn, { tours: 40, pas: 0.15, uv: 1, couleur: sale, fermer: [true, false], deformer: biseau }), P));
      poser(caisse, O.coque(cn.map((k) => Object.assign({}, k, { w: k.w - 0.06, h: k.h - 0.06, b: k.b - 0.06, x: k.x + 0.01 })), { tours: 24, pas: 0.4, retourner: true, fermer: [true, false], deformer: biseau, couleur: () => [1, 1, 1], zone: () => "sombre" }), P, { sombre: 0x121212 });
      tuyere(caisse, [], -7.2, -7.85, 1.82, s * 1.05, 0.44);
    }
    const lueurs = [[-7.54, 1.82, -1.05, 0.35], [-7.54, 1.82, 1.05, 0.35]];
    flammes(caisse, lueurs, -7.85);
    // 3. Les AILES (avec les grandes « extensions » du bord d'attaque, les LERX), les plans de queue, les 2 DÉRIVES penchées.
    const ailes = [], derives = [];
    for (const s of [-1, 1]) {
      caisse.add(O.aile({ x: 4.6, y: 2.18, z: s * 0.5, corde: 4.6, ep: 0.03 }, { x: 0.3, y: 2.08, z: s * 1.95, corde: 0.9, ep: 0.03 }, P, { nu: 4, nv: 10, uv: 1 }));
      const a = O.aile({ x: -0.1, y: 2.04, z: s * 1.4, corde: 5.0, ep: 0.05 }, { x: -4.3, y: 1.92, z: s * 5.75, corde: 1.25, ep: 0.035 }, P, {
        nu: 10, nv: 14, uv: 1, fentes: [{ c: 0.78, de: 0.05, a: 0.95 }, { u: 0.55, c0: 0.78 }, { c: 0.08, de: 0.1, a: 0.95 }],
      });
      caisse.add(a);
      ailes.push(a);
      caisse.add(O.aile({ x: -5.15, y: 1.86, z: s * 1.4, corde: 2.5, ep: 0.04 }, { x: -7.1, y: 1.8, z: s * 3.85, corde: 0.85, ep: 0.03 }, P, { nu: 5, nv: 10, uv: 1 }));
      const d = O.aile({ x: -3.9, y: 2.3, z: s * 1.15, corde: 3.0, ep: 0.05 }, { x: -6.55, y: 4.75, z: s * 1.5, corde: 1.0, ep: 0.04 }, P, { nu: 8, nv: 12, uv: 1, fentes: [{ c: 0.7, de: 0.12, a: 0.9 }, { u: 0.12, c0: 0.7 }] });
      caisse.add(d);
      derives.push(d);
      caisse.add(pt(galet(0.9, 0.1, 0.1, 0.4, 8), -7.0, 4.76, s * 1.5, 0x34382f)); // l'antenne en haut de la dérive
      // les armes : un R-73 dehors, un R-27 au milieu, une bombe dedans (et leurs pylônes)
      for (const [sorte, x, y, z, long] of [["r73", -3.0, 1.62, 4.75, 1.4], ["r27", -1.9, 1.56, 3.55, 1.8], ["fab", -1.3, 1.46, 2.35, 1.4]]) {
        const yAile = 2.04 - 0.12 * ((z - 1.4) / 4.35);
        cuire(caisse, missile(sorte), x, y, s * z);
        pylone(caisse, x + 0.15, yAile - 0.02, y + (sorte === "fab" ? 0.2 : 0.12), s * z, long, P);
      }
    }
    // le bidon d'essence entre les moteurs
    cuire(caisse, missile("bidon", P), -1.0, 1.2, 0);
    pylone(caisse, -0.8, 1.84, 1.52, 0, 1.6, P);
    // 4. La sonde, la boule du viseur infrarouge devant le pare-brise, le canon (dans l'extension gauche), les antennes, les feux.
    caisse.add(O.tube([8.7, 1.96, 0], [9.4, 1.96, 0], 0.02, teinte(), 6, CT.acier));
    caisse.add(O.piece(new THREE.SphereGeometry(0.13, 14, 10), brillant(), 6.35, 2.66, 0.14, 0x1a2a30));
    caisse.add(pt(galet(0.4, 0.1, 0.12, 0.4, 8), 3.3, 2.12, -0.85, 0x1c1c1c));
    lame(caisse, new THREE.Vector3(-0.5, 3.06, 0), new THREE.Vector3(0, 1, 0), 0.15, 0.3);
    feu(caisse, -4.6, 1.95, 5.85, 0x30ff60), feu(caisse, -4.6, 1.95, -5.85, 0xff2a20);
    // 5. Le PILOTE (casque blanc), son siège, la verrière en bulle (et son cadre).
    pilote(caisse, 4.6, 2.27, 0, 0.3, { manche: "centre", casque: 0xe3e1d8, combinaison: 0x6a6e5a });
    const canopee = O.coque([
      { x: 3.5, y: 2.73, w: 0.08, h: 0.04, b: 0.02 }, { x: 3.9, y: 2.73, w: 0.4, h: 0.4, b: 0.04 },
      { x: 4.5, y: 2.73, w: 0.44, h: 0.56, b: 0.04 }, { x: 5.3, y: 2.73, w: 0.4, h: 0.38, b: 0.04 },
      { x: 5.8, y: 2.72, w: 0.26, h: 0.1, b: 0.04 }, { x: 6.0, y: 2.7, w: 0.06, h: 0.02, b: 0.02 },
    ], { tours: 40, pas: 0.08, zone: (c, n, z) => (z.a < 0.04 ? null : "verre") });
    caisse.add(O.piece(canopee.geos.verre, verre("chasseur")));
    cadre(caisse, canopee, 5.35, 0.05, 0.03);
    cadre(caisse, canopee, 3.75, 0.05, 0.03);
    // 6. Les DÉCALCOMANIES : les étoiles rouges (sur les dérives et les ailes), le numéro rouge sur le nez.
    for (const [k, s] of [[0, -1], [1, 1]]) {
      for (const c of [1, -1]) {
        const { p, n } = derives[k].userData.point(0.45, 0.5, c);
        decalco(caisse, "etoile", p, n, new THREE.Vector3(0, 1, 0), 0.95, 0.95);
        decalcoAile(caisse, ailes[k], "etoile", 0.45, 0.72, c, 1.0, 1.0);
      }
      decalcoCoque(caisse, fus, "07", 6.9, 0.05, 0.62, 0.36, s);
      decalcoCoque(caisse, fus, "triangle", 4.6, 0.6, 0.2, 0.2, s);
      const f = nacelles[k].point(-4.8, s > 0 ? 0.3 : Math.PI - 0.3);
      marque(caisse, f.p, f.n, 0.16, E.marque);
    }
    O.souder(caisse);
    return g;
  }

  // ------------------------------------------------------------------ l'AVION DE TRANSPORT (comme un A400M)
  // Mesures : 26 m de long, 31 m d'envergure. La RAMPE : sa charnière au bout du plancher (x = −6,4, y = 1) ; fermée,
  // elle remonte vers la queue (0,62 rad) ; la porte du haut se range dans la queue.
  const PENTE = 0.62, CHARN = [-6.4, 1.0], L_RAMPE = 3.6, L_PORTE = 2.4;
  const ligneSoute = (x) => CHARN[1] + (CHARN[0] - x) * Math.tan(PENTE);
  function transport(equipe) {
    const P = peinture(equipe, "transport"), E = Tanks.CONFIG.equipes[equipe], bleu = /^bleus/.test(equipe);
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const sale = salissure();
    // 1. Le FUSELAGE : rond, le nez bombé avec les vitres du poste de pilotage, la queue qui remonte ; le bas de la queue
    // est coupé en biais (c'est là que se range la rampe).
    const cles = [
      { x: -12.9, y: 5.2, w: 0.16, h: 0.16, b: 0.16 }, { x: -12.2, y: 5.0, w: 0.55, h: 0.5, b: 0.5 },
      { x: -10.5, y: 4.15, w: 1.35, h: 1.25, b: 1.2, n: 2.4 }, { x: -8.0, y: 3.35, w: 1.95, h: 1.9, b: 1.85, n: 2.6 },
      { x: -6.0, y: 3.05, w: 2.1, h: 2.1, b: 2.05, n: 2.7 }, { x: 6.0, y: 3.05, w: 2.1, h: 2.1, b: 2.05, n: 2.7 },
      { x: 8.6, y: 3.0, w: 1.95, h: 1.9, b: 2.05, n: 2.5 }, { x: 10.3, y: 2.85, w: 1.55, h: 1.45, b: 1.95, n: 2.3 },
      { x: 11.5, y: 2.55, w: 0.95, h: 0.85, b: 1.55, n: 2.2 }, { x: 12.2, y: 2.3, w: 0.35, h: 0.35, b: 0.85 },
      { x: 12.42, y: 2.2, w: 0.04, h: 0.04, b: 0.1 },
    ];
    const coupe = (p) => {
      if (p.x < CHARN[0] + 0.001 && p.y < ligneSoute(p.x)) p.y = ligneSoute(p.x);
    };
    const finOuverture = CHARN[0] - (L_RAMPE + L_PORTE) * Math.cos(PENTE);
    const fus = O.coque(cles, {
      tours: 64, pas: 0.25, uv: 1, couleur: sale, deformer: coupe, coupes: [9.55, 10.15, 10.3, 10.62, 10.68, 11.05, -5.2, -4.0],
      zone: (c, n, z) => {
        const { x, a } = z, dans = (x1, x2, a1, a2) => x > x1 && x < x2 && a > a1 && a < a2;
        if (c.x < CHARN[0] && c.y < ligneSoute(c.x) + 0.03 && n.y < -0.2 && Math.abs(n.z) < 0.7) return c.x < finOuverture - 0.05 ? "peinture" : null;
        if (dans(10.68, 11.05, 0.55, 1.42) || dans(10.3, 10.62, 0.42, 1.0)) return "verre"; // le pare-brise, les vitres de côté
        if (dans(9.55, 10.15, 0.32, 0.72)) return "verre";
        if (dans(-5.2, -4.0, -0.05, 0.75)) return "porte"; // la porte des parachutistes (sur les côtés)
        return "peinture";
      },
    });
    poser(caisse, fus, P, { porte: new THREE.Color(K().peinture.transport[equipe].fond).multiplyScalar(0.85).getHex() });
    // l'intérieur de la SOUTE (on le voit quand la rampe est ouverte) : les parois, le plancher, les sièges rouges
    poser(caisse, O.coque(cles.slice(0, 6).map((k) => Object.assign({}, k, { w: k.w - 0.12, h: k.h - 0.12, b: k.b - 0.1 })), {
      tours: 32, pas: 0.6, retourner: true, fermer: [false, true], deformer: coupe, couleur: () => [1, 1, 1],
      zone: (c, n) => (c.x < CHARN[0] && c.y < ligneSoute(c.x) + 0.06 && n.y > 0.2 ? null : "interieur"),
    }), P, { interieur: 0x3a3e34 });
    caisse.add(pt(new THREE.BoxGeometry(12.4, 0.08, 3.4), -0.2, 1.1, 0, 0x30322e)); // le plancher
    for (const z of [-0.9, 0.9]) caisse.add(pt(new THREE.BoxGeometry(12.4, 0.05, 0.1), -0.2, 1.16, z, 0x55585a)); // les rails à rouleaux
    for (const s of [-1, 1]) {
      caisse.add(pt(new THREE.BoxGeometry(11.0, 0.08, 0.42), 0.0, 1.62, s * 1.3, COUL.banc));
      caisse.add(pt(new THREE.BoxGeometry(11.0, 0.6, 0.05), 0.0, 2.02, s * 1.55, COUL.banc));
      caisse.add(O.tube([-6.2, 3.6, s * 0.7], [6.0, 3.6, s * 0.7], 0.025, teinte(), 6, 0x8a8c88)); // les câbles d'ouverture des parachutes
    }
    caisse.add(pt(new THREE.BoxGeometry(0.1, 0.4, 0.1), -6.0, 3.6, 0, 0xc83020)); // le feu rouge/vert du largage
    feu(caisse, -6.0, 3.85, 0.2, 0x30ff60, 0.06);
    // 2. L'AILE (haute, sur le dos), avec ses volets et ses ailerons, les carénages des rails de volets, le carénage
    // du dos ; les 4 MOTEURS (nacelles, entrée d'air sous l'hélice, échappement), les HÉLICES à 8 pales en sabre.
    const ailes = [], helicesPos = [];
    for (const s of [-1, 1]) {
      const a = O.aile({ x: 3.2, y: 5.25, z: s * 0.9, corde: 4.7, ep: 0.15 }, { x: 0.9, y: 4.92, z: s * 15.6, corde: 1.65, ep: 0.12 }, P, {
        nu: 16, nv: 14, uv: 1, fentes: [{ c: 0.72, de: 0.03, a: 0.96 }, { u: 0.68, c0: 0.72 }, { u: 0.36, c0: 0.72 }, { u: 0.03, c0: 0.72 }],
      });
      caisse.add(a);
      ailes.push(a);
      for (const z of [3.2, 8.1, 13.0]) { // les carénages des rails de volets
        const u = (z - 0.9) / 14.7, xTE = 3.2 - 2.3 * u - (4.7 - 3.05 * u), y = 5.25 - 0.33 * u - 0.12;
        poser(caisse, O.coque([{ x: xTE + 2.0, y, w: 0.04, h: 0.04, b: 0.04 }, { x: xTE + 1.2, y: y - 0.05, w: 0.14, h: 0.08, b: 0.18 }, { x: xTE - 0.2, y: y - 0.08, w: 0.12, h: 0.06, b: 0.18 }, { x: xTE - 0.7, y: y - 0.05, w: 0.02, h: 0.02, b: 0.02 }].map((k) => Object.assign(k, { z: s * z })), { tours: 14, pas: 0.4, couleur: sale }), P);
      }
      for (const z of [5.4, 10.4]) {
        const zz = s * z;
        helicesPos.push([zz, K().sensHelices[helicesPos.length]]);
        poser(caisse, O.coque([
          { x: -1.9, y: 4.86, w: 0.08, h: 0.06, b: 0.06, z: zz }, { x: -0.6, y: 4.8, w: 0.5, h: 0.48, b: 0.48, n: 2.4, z: zz },
          { x: 1.2, y: 4.68, w: 0.64, h: 0.68, b: 0.74, n: 2.4, z: zz }, { x: 3.4, y: 4.62, w: 0.64, h: 0.64, b: 0.82, n: 2.4, z: zz },
          { x: 4.8, y: 4.62, w: 0.54, h: 0.54, b: 0.66, z: zz }, { x: 5.3, y: 4.62, w: 0.44, h: 0.44, b: 0.46, z: zz },
        ], { tours: 32, pas: 0.25, uv: 1, couleur: salissure(-0.5, 2.5) }), P);
        caisse.add(pt(galet(0.62, 0.3, 0.5, 0.35, 10), 4.95, 3.98, zz, 0x101010)); // l'entrée d'air (sous l'hélice)
        caisse.add(O.tube([0.6, 4.95, zz + s * 0.55], [-0.4, 5.05, zz + s * 0.78], 0.17, teinte(), 12, 0x3a3532)); // l'échappement
        caisse.add(O.tube([-0.36, 5.05, zz + s * 0.77], [-0.42, 5.055, zz + s * 0.79], 0.14, teinte(), 12, 0x0c0c0c));
      }
    }
    poser(caisse, O.coque([{ x: -2.6, y: 5.1, w: 0.4, h: 0.15, b: 0.2 }, { x: -1.0, y: 5.35, w: 1.5, h: 0.5, b: 0.3, n: 2.6 }, { x: 3.0, y: 5.32, w: 1.5, h: 0.5, b: 0.3, n: 2.6 }, { x: 4.6, y: 5.2, w: 0.6, h: 0.25, b: 0.2 }, { x: 5.0, y: 5.15, w: 0.05, h: 0.05, b: 0.05 }], { tours: 32, pas: 0.3, uv: 1, couleur: sale }), P);
    // les carénages du train (sur les côtés, en bas)
    for (const s of [-1, 1]) poser(caisse, O.coque([{ x: -4.2, y: 1.45, w: 0.05, h: 0.05, b: 0.05 }, { x: -3.0, y: 1.35, w: 0.55, h: 0.62, b: 0.55, n: 2.6 }, { x: 3.2, y: 1.35, w: 0.55, h: 0.62, b: 0.55, n: 2.6 }, { x: 4.6, y: 1.5, w: 0.05, h: 0.05, b: 0.05 }].map((k) => Object.assign(k, { z: s * 1.9 })), { tours: 28, pas: 0.4, uv: 1, couleur: sale }), P);
    // 3. La QUEUE en T : la grande dérive (et sa gouverne), le plan horizontal tout en haut (et ses gouvernes).
    const derive = O.aile({ x: -8.0, y: 4.9, z: 0, corde: 5.2, ep: 0.12 }, { x: -12.3, y: 11.0, z: 0, corde: 2.5, ep: 0.1 }, P, { nu: 10, nv: 12, uv: 1, fentes: [{ c: 0.68, de: 0.06, a: 0.96 }] });
    caisse.add(derive);
    for (const s of [-1, 1]) caisse.add(O.aile({ x: -11.8, y: 10.85, z: s * 0.2, corde: 2.7, ep: 0.1 }, { x: -13.7, y: 11.0, z: s * 6.4, corde: 1.25, ep: 0.08 }, P, { nu: 6, nv: 10, uv: 1, fentes: [{ c: 0.7, de: 0.05, a: 0.96 }] }));
    poser(caisse, O.coque([{ x: -14.6, y: 10.95, w: 0.04, h: 0.04 }, { x: -14.2, y: 10.95, w: 0.28, h: 0.28 }, { x: -11.6, y: 10.95, w: 0.32, h: 0.3 }, { x: -11.0, y: 10.95, w: 0.04, h: 0.04 }], { tours: 18, pas: 0.4, uv: 1, couleur: sale }), P); // le « bulbe » en haut de la dérive
    // 4. Le poste de pilotage : la planche de bord et les 2 PILOTES (visibles derrière les vitres) ; la perche de
    // ravitaillement sur le nez, les antennes, les feux.
    caisse.add(pt(galet(0.5, 0.4, 2.0, 0.3, 10), 10.65, 3.55, 0, 0x1c1d1c));
    for (const s of [-1, 1]) pilote(caisse, 9.8, 3.15, s * 0.6, 0.15, { manche: "centre", siege: false, casque: 0x4b5340, combinaison: 0x5b6046 });
    caisse.add(O.tube([9.6, 4.85, 0.3], [12.6, 4.4, 0.3], 0.06, teinte(), 10, 0x4f5449));
    caisse.add(versAvant(O.tour([[0.0, 0.0], [0.1, 0.0], [0.07, 0.2], [0.0, 0.22]], teinte(), 10, 0x2a2a2a), 12.6, 4.4, 0.3));
    lame(caisse, new THREE.Vector3(2.0, 5.85, 0), new THREE.Vector3(0, 1, 0), 0.2, 0.36);
    lame(caisse, new THREE.Vector3(6.5, 5.12, 0), new THREE.Vector3(0, 1, 0), 0.16, 0.3);
    lame(caisse, new THREE.Vector3(0.0, 1.02, 0), new THREE.Vector3(0, -1, 0), 0.16, 0.3);
    feu(caisse, 1.0, 4.95, 15.65, 0x30ff60, 0.08), feu(caisse, 1.0, 4.95, -15.65, 0xff2a20, 0.08);
    feu(caisse, -1.0, 5.62, 0, 0xff3020, 0.07);
    for (const s of [-1, 1]) caisse.add(pt(new THREE.BoxGeometry(1.8, 0.04, 0.02), 4.0, 3.9, s * 2.14, 0xb6d48a)); // les bandes de formation
    // les hublots (sur les côtés)
    for (const s of [-1, 1]) for (const x of [-2.6, 0.0, 2.6, 5.2]) {
      const { p, n } = fus.point(x, s > 0 ? 0.25 : Math.PI - 0.25);
      caisse.add(O.surLaSurface(O.piece(new THREE.CircleGeometry(0.17, 18).rotateX(-Math.PI / 2), brillant(), 0, 0, 0, 0x1a2228), p.clone().addScaledVector(n, 0.012), n));
    }
    // 5. Les DÉCALCOMANIES : la cocarde (ou l'étoile) sur l'arrière du fuselage et sous les ailes, « ARMÉE DE L'AIR », le
    // numéro sur la dérive, la marque de l'équipe.
    const signe = bleu ? "cocarde" : "etoile";
    for (const [k, s] of [[0, -1], [1, 1]]) {
      decalcoCoque(caisse, fus, signe, -3.0, 0.3, 1.3, 1.3, s);
      if (bleu) decalcoCoque(caisse, fus, "air", 5.5, 0.55, 4.4, 0.55, s);
      decalcoAile(caisse, ailes[k], signe, 0.45, 0.78, 1, 1.6, 1.6);
      decalcoAile(caisse, ailes[k], signe, 0.45, 0.78, -1, 1.6, 1.6);
      const { p, n } = derive.userData.point(0.35, 0.35, s);
      decalco(caisse, bleu ? "0012" : "21", p, n, new THREE.Vector3(0, 1, 0), 1.6, 0.8);
      const f = derive.userData.point(0.5, 0.72, s);
      marque(caisse, f.p, f.n, 0.35, E.marque);
    }
    O.souder(caisse);
    // 6. La RAMPE (elle tourne autour de sa charnière) et la PORTE du haut (elle se range dans la queue).
    const rampe = new THREE.Group();
    rampe.name = "rampe";
    rampe.add(O.piece(galet(L_RAMPE, 0.14, 3.0, 0.15, 14), P, CHARN[0] - L_RAMPE / 2, CHARN[1] - 0.07, 0));
    rampe.add(pt(new THREE.BoxGeometry(L_RAMPE - 0.15, 0.02, 2.7), CHARN[0] - L_RAMPE / 2, CHARN[1] + 0.005, 0, 0x30322e));
    for (let k = 0; k < 12; k++) rampe.add(pt(new THREE.BoxGeometry(0.05, 0.035, 2.6), CHARN[0] - 0.25 - k * 0.28, CHARN[1] + 0.02, 0, 0x45474a));
    for (const z of [-1.45, 1.45]) rampe.add(O.piece(new THREE.BoxGeometry(L_RAMPE, 0.24, 0.08), P, CHARN[0] - L_RAMPE / 2, CHARN[1] + 0.08, z));
    for (const z of [-1.0, 0, 1.0]) rampe.add(O.couche(O.cylindre(0.08, 0.08, 0.3, teinte(), 10, CT.acier), "z", CHARN[0], CHARN[1], z));
    charniere(rampe, CHARN[0], CHARN[1], 0);
    O.souder(rampe);
    rampe.rotation.z = -PENTE;
    g.add(rampe);
    const hx = CHARN[0] - (L_RAMPE + L_PORTE) * Math.cos(PENTE), hy = CHARN[1] + (L_RAMPE + L_PORTE) * Math.sin(PENTE);
    const porte = new THREE.Group();
    porte.name = "porteSoute";
    porte.add(O.piece(galet(L_PORTE, 0.12, 2.6, 0.15, 12), P, hx + L_PORTE / 2, hy - 0.06, 0));
    porte.add(pt(new THREE.BoxGeometry(L_PORTE - 0.2, 0.02, 2.3), hx + L_PORTE / 2, hy + 0.005, 0, 0x3a3e34));
    charniere(porte, hx, hy, 0);
    O.souder(porte);
    porte.rotation.z = -PENTE;
    g.add(porte);
    // 7. Les 4 HÉLICES : le cône (la « casserole »), 8 pales en sabre ; et les 4 disques flous, en une seule pièce fixe.
    const helices = [], flous = [];
    for (const [z, sens] of helicesPos) {
      const h = new THREE.Group();
      h.position.set(5.55, 4.62, z);
      h.add(O.tourX([[-0.25, 0.46], [0.2, 0.44], [0.6, 0.32], [0.9, 0.14], [1.0, 0.001]], teinte(), 20, new THREE.Color(K().peinture.transport[equipe].fond).getHex()));
      const geo = geoPaleHelice(0.32, 2.35, 0.36, 1.0, 0.42, 0.42, 0x26272a, 0x8a8a84), geoM = miroir(geo);
      for (let k = 0; k < 8; k++) {
        const p = O.piece(sens > 0 ? geo : geoM, teinte());
        p.rotation.x = (k * Math.PI) / 4;
        h.add(p);
      }
      O.souder(h);
      h.userData.sens = sens;
      caisse.add(h);
      helices.push(h);
      flous.push(new THREE.CircleGeometry(2.35, 40).rotateY(Math.PI / 2).translate(5.5, 4.62, z));
    }
    const flou = new THREE.Mesh(fusionner(flous), matFlou());
    flou.name = "flous";
    flou.castShadow = false;
    g.add(flou);
    return g;
  }
  // (assembler plusieurs formes en une seule)
  function fusionner(geos) {
    const liste = geos.map((x) => (x.index ? x.toNonIndexed() : x)), g = new THREE.BufferGeometry();
    for (const nom of ["position", "normal", "uv"]) {
      if (!liste[0].attributes[nom]) continue;
      const t = liste[0].attributes[nom].itemSize, tab = new Float32Array(liste.reduce((a, x) => a + x.attributes[nom].array.length, 0));
      let k = 0;
      for (const x of liste) (tab.set(x.attributes[nom].array, k), (k += x.attributes[nom].array.length));
      g.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    return g;
  }

  // ------------------------------------------------------------------ le DRONE (un quadricoptère militaire)
  // Mesures : 2,7 m d'un bout d'hélice à l'autre. Le corps à 0,62 m du sol, sur ses patins.
  function drone(equipe) {
    const P = peinture(equipe, "drone"), E = Tanks.CONFIG.equipes[equipe];
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // 1. Le CORPS (une coque lisse), la batterie dessous, le « champignon » du GPS et les 2 antennes sur le dos.
    poser(caisse, O.coque([
      { x: -0.5, y: 0.66, w: 0.08, h: 0.05, b: 0.05 }, { x: -0.4, y: 0.66, w: 0.24, h: 0.12, b: 0.08, n: 3 },
      { x: 0.25, y: 0.67, w: 0.27, h: 0.15, b: 0.1, n: 3.2 }, { x: 0.48, y: 0.66, w: 0.2, h: 0.1, b: 0.09, n: 2.8 },
      { x: 0.58, y: 0.65, w: 0.04, h: 0.03, b: 0.03 },
    ], { tours: 36, pas: 0.05, uv: 0.25, couleur: () => [1, 1, 1] }), P);
    caisse.add(pt(galet(0.5, 0.1, 0.3, 0.3, 10), -0.02, 0.55, 0, 0x2a2c29)); // la batterie
    caisse.add(O.piece(galet(0.14, 0.05, 0.14, 0.8, 12), brillant(), -0.15, 0.82, 0, 0xd8dad2)); // le GPS
    for (const s of [-1, 1]) caisse.add(O.tube([-0.35, 0.76, s * 0.1], [-0.42, 1.02, s * 0.14], 0.008, teinte(), 4, 0x1a1a1a));
    // 2. Les 4 BRAS (en carbone), les MOTEURS, les feux (vert à droite, rouge à gauche, blanc derrière).
    const moteurs = [[0.68, 0.68], [0.68, -0.68], [-0.68, 0.68], [-0.68, -0.68]];
    for (const [x, z] of moteurs) {
      caisse.add(O.tube([x * 0.25, 0.67, z * 0.25], [x, 0.7, z], 0.028, teinte(), 10, COUL.carbone));
      caisse.add(O.couche(O.cylindre(0.065, 0.06, 0.06, teinte(), 14, 0x3a3c3e), "y", x, 0.72, z).rotateZ(0)); // le support
      caisse.add(O.tour([[0.001, 0.0], [0.07, 0.0], [0.072, 0.07], [0.05, 0.1], [0.001, 0.1]], teinte(), 16, 0x1d1e20).translateX(x).translateY(0.74).translateZ(z)); // la cloche du moteur
      caisse.add(O.tube([x, 0.7, z], [x * 1.04, 0.42, z * 1.04], 0.012, teinte(), 6, COUL.carbone)); // la petite jambe
      feu(caisse, x * 1.06, 0.69, z * 1.06, x > 0 ? (z > 0 ? 0x30ff60 : 0xff2a20) : 0xffffff, 0.022);
      caisse.add(pt(new THREE.BoxGeometry(0.1, 0.03, 0.06), x * 0.62, 0.69, z * 0.62, x > 0 ? E.marque : 0x2a2c29).rotateY(-Math.atan2(z, x)));
    }
    // 3. Les PATINS (deux arceaux recourbés, avec leurs pieds en caoutchouc).
    for (const s of [-1, 1]) {
      caisse.add(O.cable([[0.05, 0.56, s * 0.12], [0.1, 0.3, s * 0.3], [0.12, 0.06, s * 0.36]], 0.016, teinte(), COUL.carbone, 12));
      caisse.add(O.cable([[-0.15, 0.56, s * 0.12], [-0.2, 0.3, s * 0.3], [-0.22, 0.06, s * 0.36]], 0.016, teinte(), COUL.carbone, 12));
      caisse.add(O.cable([[-0.42, 0.06, s * 0.36], [-0.4, 0.03, s * 0.36], [0.35, 0.03, s * 0.36], [0.4, 0.06, s * 0.36]], 0.02, teinte(), 0x1a1a1a, 16));
    }
    // 4. La CAMÉRA sous le nez : la fourche (elle tourne), la boule, l'objectif et le télémètre.
    caisse.add(O.tube([0.38, 0.6, 0], [0.38, 0.52, 0], 0.02, teinte(), 8, 0x2a2a2a));
    caisse.add(O.cable([[0.38, 0.52, -0.12], [0.38, 0.47, -0.12], [0.38, 0.45, -0.1]], 0.016, teinte(), 0x2a2a2a, 6));
    caisse.add(O.cable([[0.38, 0.52, 0.12], [0.38, 0.47, 0.12], [0.38, 0.45, 0.1]], 0.016, teinte(), 0x2a2a2a, 6));
    caisse.add(pt(new THREE.BoxGeometry(0.02, 0.02, 0.26), 0.38, 0.53, 0, 0x2a2a2a));
    caisse.add(pt(new THREE.SphereGeometry(0.1, 18, 14), 0.38, 0.43, 0, new THREE.Color(K().peinture.drone[equipe].fond).getHex()));
    caisse.add(O.piece(new THREE.SphereGeometry(0.06, 14, 10, -Math.PI / 2 - 0.0, Math.PI, 0, Math.PI).rotateZ(-Math.PI / 2), brillant(), 0.44, 0.43, -0.025, 0x0d1830)); // l'objectif
    caisse.add(O.piece(new THREE.CircleGeometry(0.025, 12).rotateY(Math.PI / 2), brillant(), 0.481, 0.45, 0.05, 0x501010)); // le télémètre
    // 5. La cocarde (ou l'étoile) sur le dos.
    decalco(caisse, /^bleus/.test(equipe) ? "cocarde" : "etoile", new THREE.Vector3(0.12, 0.818, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), 0.2, 0.2);
    O.souder(caisse);
    // 6. Les 4 HÉLICES (2 pales chacune ; elles tournent) et les 4 disques flous en une seule pièce fixe.
    const helices = [], flous = [];
    const geo = geoPaleHelice(0.03, 0.4, 0.07, 0.35, 0.15, 0.02, 0x1d1e20), geoM = miroir(geo);
    moteurs.forEach(([x, z], k) => {
      const h = new THREE.Group();
      h.position.set(x, 0.85, z);
      h.add(pt(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 10), 0, 0, 0, 0x8a8c88));
      for (let j = 0; j < 2; j++) {
        const p = O.piece(k % 2 ? geoM : geo, teinte());
        p.rotation.set(0, 0, -Math.PI / 2, "XYZ");
        p.rotation.y = j * Math.PI;
        h.add(p);
      }
      O.souder(h);
      caisse.add(h);
      helices.push(h);
      flous.push(new THREE.CircleGeometry(0.4, 28).rotateX(-Math.PI / 2).translate(x, 0.852, z));
    });
    const flou = new THREE.Mesh(fusionner(flous), matFlou());
    flou.name = "flous";
    flou.castShadow = false;
    g.add(flou);
    // 7. Les 6 GRENADES accrochées sous le corps (chacune à part : elle disparaît quand le drone la lâche).
    const grenades = [];
    for (let k = 0; k < 6; k++) {
      const m = new THREE.Group(), x = -0.18 + (k % 3) * 0.14, z = k < 3 ? -0.08 : 0.08;
      m.add(pt(galet(0.07, 0.1, 0.07, 0.6, 10), x, 0.44, z, 0x3f4630));
      m.add(pt(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 8), x, 0.505, z, 0x6a6e66));
      m.add(pt(new THREE.BoxGeometry(0.03, 0.03, 0.03), x, 0.53, z, 0x2a2a2a));
      O.souder(m);
      caisse.add(m);
      grenades.push(m);
    }
    return g;
  }

  // ------------------------------------------------------------------ le TIGRE
  // Mesures : 14 m de long rotor compris, fuselage de 1 m de large, rotor de 13 m, rotor de queue de 2,7 m.
  function tigre(equipe) {
    const P = peinture(equipe, "helico"), E = Tanks.CONFIG.equipes[equipe];
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const sale = salissure();
    // 1. Le FUSELAGE : fin et « taillé » (presque des facettes, pour être difficile à voir au radar), la poutre de queue,
    // le nez pointu. On découpe les 2 trous des cockpits, sous les verrières.
    const cles = [
      { x: -7.9, y: 2.56, w: 0.05, h: 0.07, b: 0.07 }, { x: -7.5, y: 2.52, w: 0.13, h: 0.17, b: 0.15, n: 2.8 },
      { x: -5.0, y: 2.36, w: 0.2, h: 0.24, b: 0.24, n: 3 }, { x: -3.0, y: 2.2, w: 0.32, h: 0.38, b: 0.42, n: 3.2 },
      { x: -2.0, y: 2.05, w: 0.47, h: 0.6, b: 0.64, n: 3.6 }, { x: -0.8, y: 1.95, w: 0.52, h: 0.72, b: 0.74, n: 3.8 },
      { x: 0.4, y: 1.85, w: 0.5, h: 0.62, b: 0.7, n: 3.6 }, { x: 1.6, y: 1.72, w: 0.46, h: 0.48, b: 0.6, n: 3.3 },
      { x: 2.5, y: 1.56, w: 0.33, h: 0.3, b: 0.44, n: 3 }, { x: 3.1, y: 1.44, w: 0.17, h: 0.14, b: 0.22, n: 2.6 },
      { x: 3.5, y: 1.38, w: 0.06, h: 0.05, b: 0.07, n: 2.2 }, { x: 3.6, y: 1.37, w: 0.02, h: 0.02, b: 0.02 },
    ];
    const fus = O.coque(cles, {
      tours: 52, pas: 0.12, uv: 1, couleur: sale, coupes: [-0.42, 1.0, 1.12, 2.48],
      zone: (c, n, z) => {
        if ((z.x > 1.12 && z.x < 2.48 && z.a > 0.86) || (z.x > -0.42 && z.x < 1.0 && z.a > 0.86)) return null;
        return "peinture";
      },
    });
    poser(caisse, fus, P);
    for (const [x1, x2, y] of [[1.0, 2.6, 1.8], [-0.55, 1.1, 2.2]]) // les « baignoires » des 2 cockpits
      poser(caisse, O.coque([{ x: x1, y, w: 0.2, h: 0.2, b: 0.2 }, { x: x1 + 0.2, y, w: 0.36, h: 0.42, b: 0.3 }, { x: x2 - 0.2, y, w: 0.34, h: 0.38, b: 0.3 }, { x: x2, y, w: 0.2, h: 0.2, b: 0.2 }], { tours: 20, pas: 0.4, retourner: true, couleur: () => [1, 1, 1], zone: () => "interieur" }), P, { interieur: 0x2a2c2a });
    caisse.add(pt(galet(0.3, 0.2, 0.62, 0.3, 10), 2.3, 2.02, 0, 0x1d1e1d)); // les planches de bord
    caisse.add(pt(galet(0.3, 0.2, 0.62, 0.3, 10), 0.85, 2.44, 0, 0x1d1e1d));
    // 2. Les 2 MOTEURS (de chaque côté du mât), leurs entrées d'air à grille, leurs échappements tournés vers le haut et
    // l'extérieur ; le capot entre eux ; le carénage du mât.
    for (const s of [-1, 1]) {
      const z = s * 0.4;
      poser(caisse, O.coque([
        { x: -2.75, y: 2.66, w: 0.08, h: 0.08, b: 0.08, z }, { x: -2.3, y: 2.68, w: 0.26, h: 0.25, b: 0.22, n: 3, z },
        { x: -0.5, y: 2.7, w: 0.27, h: 0.27, b: 0.22, n: 3, z }, { x: -0.2, y: 2.68, w: 0.2, h: 0.2, b: 0.18, n: 2.6, z },
      ], { tours: 28, pas: 0.15, uv: 1, couleur: sale, fermer: [true, false] }), P);
      caisse.add(O.couche(O.cylindre(0.19, 0.19, 0.03, teinte(), 18, 0x121212), "x", -0.22, 2.68, z));
      for (let k = 0; k < 4; k++) caisse.add(pt(new THREE.BoxGeometry(0.02, 0.36, 0.015), -0.2, 2.68, z - 0.12 + k * 0.08, 0x3a3c3a)); // la grille
      caisse.add(O.cable([[-2.3, 2.75, s * 0.5], [-2.65, 2.82, s * 0.66], [-2.9, 2.98, s * 0.82]], 0.14, teinte(), 0x3a3532, 12)); // l'échappement
      caisse.add(O.couche(O.cylindre(0.12, 0.12, 0.02, teinte(), 14, 0x0c0c0c), "x", -2.93, 3.0, s * 0.84));
    }
    poser(caisse, O.coque([
      { x: -2.6, y: 2.72, w: 0.12, h: 0.06, b: 0.1 }, { x: -2.2, y: 2.78, w: 0.36, h: 0.2, b: 0.1, n: 3 },
      { x: -0.3, y: 2.82, w: 0.36, h: 0.24, b: 0.1, n: 3 }, { x: 0.0, y: 2.76, w: 0.08, h: 0.06, b: 0.1 },
    ], { tours: 32, pas: 0.15, uv: 1, couleur: sale }), P);
    poser(caisse, O.coque([{ x: -1.35, y: 3.0, w: 0.05, h: 0.05, b: 0.05 }, { x: -1.15, y: 3.02, w: 0.24, h: 0.18, b: 0.1 }, { x: -0.65, y: 3.02, w: 0.24, h: 0.18, b: 0.1 }, { x: -0.45, y: 3.0, w: 0.05, h: 0.05, b: 0.05 }], { tours: 24, pas: 0.1, uv: 1, couleur: sale }), P);
    caisse.add(pt(new THREE.CylinderGeometry(0.11, 0.15, 0.3, 14), -0.9, 3.2, 0, 0x2a2c2a)); // le mât
    // 3. Le VISEUR en boule au-dessus du rotor (sur son axe fixe), avec ses 2 fenêtres.
    caisse.add(O.tube([-0.9, 3.35, 0], [-0.9, 3.7, 0], 0.045, teinte(), 8, 0x2a2c2a));
    caisse.add(O.piece(galet(0.5, 0.42, 0.5, 0.75, 16), P, -0.9, 3.92, 0));
    for (const zz of [-0.09, 0.09]) caisse.add(O.piece(new THREE.BoxGeometry(0.02, 0.15, 0.13), brillant(), -0.655, 3.94, zz, 0x10202a));
    // 4. Le CANON de 30 mm dans sa tourelle sous le nez (le berceau, le canon, le frein de bouche, la goulotte des obus).
    caisse.add(O.tour([[0.001, 0.0], [0.24, 0.0], [0.24, 0.1], [0.18, 0.18], [0.001, 0.2]], teinte(), 18, 0x3a3e33).translateX(2.05).translateY(1.08).rotateX(Math.PI));
    caisse.add(pt(galet(0.42, 0.24, 0.3, 0.35, 10), 2.12, 0.86, 0, 0x3a3e33));
    caisse.add(O.couche(O.cylindre(0.045, 0.055, 1.3, teinte(), 10, 0x26282a), "x", 2.85, 0.84, 0));
    caisse.add(O.couche(O.cylindre(0.07, 0.07, 0.16, teinte(), 10, 0x1d1e20), "x", 3.48, 0.84, 0));
    caisse.add(O.cable([[1.95, 0.9, -0.12], [1.85, 1.0, -0.2], [1.7, 1.15, -0.22]], 0.04, teinte(), 0x2a2c2a, 10));
    // le viseur du pilote sur le nez
    caisse.add(O.piece(new THREE.SphereGeometry(0.1, 14, 10), brillant(), 3.0, 1.62, 0, 0x1a2a30));
    // 5. Les petites AILES : le panier de roquettes (dedans), 4 missiles (dehors), 2 missiles air-air au bout.
    const ailes = [];
    for (const s of [-1, 1]) {
      const a = O.aile({ x: 0.0, y: 1.92, z: s * 0.42, corde: 1.05, ep: 0.13 }, { x: -0.15, y: 1.8, z: s * 2.0, corde: 0.85, ep: 0.11 }, P, { nu: 5, nv: 10, uv: 1 });
      caisse.add(a);
      ailes.push(a);
      pylone(caisse, -0.35, 1.84, 1.58, s * 1.05, 0.7);
      pylone(caisse, -0.35, 1.82, 1.6, s * 1.68, 0.7);
      // le panier de roquettes (22 tubes) : l'enveloppe, et les bouches des tubes devant
      caisse.add(O.tourX([[-1.2, 0.12], [-1.12, 0.22], [0.3, 0.22], [0.38, 0.17]], teinte(), 20, 0x4a5236).translateY(1.33).translateZ(s * 1.05));
      caisse.add(O.couche(O.cylindre(0.18, 0.18, 0.02, teinte(), 18, 0x1a1a1a), "x", 0.385, 1.33, s * 1.05));
      for (let k = 0; k < 7; k++) {
        const ang = (k / 7) * Math.PI * 2, rr = k ? 0.11 : 0;
        for (const r2 of k ? [rr] : [0]) caisse.add(O.couche(O.cylindre(0.03, 0.03, 0.02, teinte(), 8, 0x3a3a38), "x", 0.39, 1.33 + Math.sin(ang) * r2, s * 1.05 + Math.cos(ang) * r2));
      }
      // les 4 missiles (sur leur lanceur)
      caisse.add(pt(new THREE.BoxGeometry(1.1, 0.06, 0.3), -0.45, 1.56, s * 1.68, 0x3f4630));
      for (const [dy, dz] of [[0, -0.12], [0, 0.12], [-0.24, -0.12], [-0.24, 0.12]]) cuire(caisse, missile("hellfire"), -0.35, 1.42 + dy, s * 1.68 + dz);
      // les 2 missiles air-air au bout de l'aile (dans leurs tubes)
      for (const dy of [0.08, -0.08]) caisse.add(O.couche(O.cylindre(0.055, 0.055, 1.5, teinte(), 12, 0x5a6046), "x", -0.4, 1.8 + dy, s * 2.1));
      caisse.add(pt(new THREE.BoxGeometry(0.5, 0.3, 0.05), -0.4, 1.8, s * 2.03, 0x3f4630));
      // 6. Le TRAIN fixe : la roue, la jambe à amortisseur, le bras.
      roue(caisse, 0.55, 0.3, s * 1.0, 0.3, 0.17);
      caisse.add(O.tube([0.55, 0.3, s * 0.92], [0.85, 1.25, s * 0.48], 0.05, teinte(), 8, COUL.metal), O.tube([0.55, 0.3, s * 0.92], [0.1, 1.2, s * 0.48], 0.05, teinte(), 8, COUL.metal));
      caisse.add(O.tube([0.7, 0.78, s * 0.7], [0.82, 1.15, s * 0.52], 0.07, teinte(), 8, COUL.chrome));
      // les marches, les rétroviseurs
      caisse.add(pt(new THREE.BoxGeometry(0.3, 0.03, 0.16), 1.6, 1.15, s * 0.5, CT.acier));
    }
    // 7. La QUEUE : le plan horizontal et ses 2 petites dérives, la grande dérive, la roulette, la boîte du rotor de queue.
    const plan = O.aile({ x: -5.85, y: 2.4, z: -1.2, corde: 0.75, ep: 0.1 }, { x: -5.85, y: 2.4, z: 1.2, corde: 0.75, ep: 0.1 }, P, { nu: 6, nv: 8, uv: 1 });
    caisse.add(plan);
    for (const s of [-1, 1]) caisse.add(O.aile({ x: -5.95, y: 2.12, z: s * 1.2, corde: 0.75, ep: 0.08 }, { x: -6.3, y: 2.78, z: s * 1.22, corde: 0.5, ep: 0.07 }, P, { nu: 3, nv: 8, uv: 1 }));
    const derive = O.aile({ x: -6.95, y: 2.4, z: 0, corde: 0.95, ep: 0.12 }, { x: -7.75, y: 3.85, z: 0, corde: 0.55, ep: 0.1 }, P, { nu: 6, nv: 10, uv: 1 });
    caisse.add(derive);
    caisse.add(O.tube([-6.9, 2.3, 0], [-7.15, 0.32, 0], 0.05, teinte(), 8, COUL.metal), O.tube([-7.3, 2.4, 0], [-7.15, 0.4, 0], 0.03, teinte(), 6, COUL.metal));
    roue(caisse, -7.15, 0.18, 0, 0.18, 0.1);
    caisse.add(O.piece(galet(0.36, 0.36, 0.2, 0.5, 12), P, -7.45, 3.0, 0.12));
    // les antennes, les feux, le brouilleur infrarouge
    lame(caisse, new THREE.Vector3(-3.8, 2.62, 0), new THREE.Vector3(0, 1, 0), 0.14, 0.26);
    lame(caisse, new THREE.Vector3(0.0, 1.17, 0), new THREE.Vector3(0, -1, 0), 0.12, 0.24);
    feu(caisse, -0.15, 1.8, 2.02, 0x30ff60, 0.04), feu(caisse, -0.15, 1.8, -2.02, 0xff2a20, 0.04), feu(caisse, -7.9, 2.58, 0, 0xffffff, 0.04);
    caisse.add(pt(new THREE.CylinderGeometry(0.08, 0.1, 0.18, 12), -1.8, 3.0, 0, 0x2a2c2a));
    // 8. L'ÉQUIPAGE : le pilote devant (plus bas), le tireur derrière (plus haut), sur leurs sièges blindés.
    pilote(caisse, 1.55, 1.55, 0, 0.12, { manche: "centre", casque: 0x3d4434, combinaison: 0x56603f });
    pilote(caisse, 0.05, 1.93, 0, 0.12, { manche: "centre", casque: 0x3d4434, combinaison: 0x56603f });
    // 9. Les VERRIÈRES en marches (des panneaux presque plats, avec leurs cadres).
    const avant = O.coque([
      { x: 1.0, y: 2.05, w: 0.3, h: 0.3, b: 0.1, n: 3 }, { x: 1.2, y: 2.06, w: 0.44, h: 0.45, b: 0.1, n: 3.4 },
      { x: 1.85, y: 2.0, w: 0.44, h: 0.42, b: 0.1, n: 3.4 }, { x: 2.35, y: 1.88, w: 0.37, h: 0.3, b: 0.1, n: 3 },
      { x: 2.62, y: 1.8, w: 0.22, h: 0.1, b: 0.08 },
    ], { tours: 40, pas: 0.08, zone: (c, n, z) => (z.a < 0.05 ? null : "verre") });
    const arriere = O.coque([
      { x: -0.6, y: 2.42, w: 0.26, h: 0.2, b: 0.1, n: 3 }, { x: -0.4, y: 2.43, w: 0.46, h: 0.42, b: 0.1, n: 3.4 },
      { x: 0.55, y: 2.39, w: 0.48, h: 0.46, b: 0.1, n: 3.4 }, { x: 0.98, y: 2.32, w: 0.42, h: 0.36, b: 0.1, n: 3 },
      { x: 1.18, y: 2.27, w: 0.2, h: 0.12, b: 0.08 },
    ], { tours: 40, pas: 0.08, zone: (c, n, z) => (z.a < 0.05 ? null : "verre") });
    for (const v of [avant, arriere]) caisse.add(O.piece(v.geos.verre, verre("helico")));
    cadre(caisse, avant, 1.25, 0.06, 0.025), cadre(caisse, avant, 2.3, 0.06, 0.025), cadre(caisse, arriere, -0.35, 0.06, 0.025), cadre(caisse, arriere, 0.95, 0.06, 0.025);
    for (const [v, x1, x2] of [[avant, 1.1, 2.5], [arriere, -0.5, 1.05]]) for (const a of [0.06, Math.PI - 0.06, Math.PI / 2]) {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const { p } = v.point(x1 + ((x2 - x1) * k) / 8, a, 0.01);
        pts.push([p.x, p.y, p.z]);
      }
      caisse.add(O.cable(pts, 0.022, teinte(), 0x2b2d2a, 16));
    }
    // 10. Les DÉCALCOMANIES : la cocarde sur la poutre de queue, « ARMÉE DE TERRE », le code sur la dérive.
    for (const s of [-1, 1]) {
      decalcoCoque(caisse, fus, /^bleus/.test(equipe) ? "cocarde" : "etoile", -4.4, 0.1, 0.42, 0.42, s);
      if (/^bleus/.test(equipe)) decalcoCoque(caisse, fus, "terre", -2.5, 0.02, 1.6, 0.2, s);
      const { p, n } = derive.userData.point(0.4, 0.4, s);
      decalco(caisse, "BHA", p, n, new THREE.Vector3(0, 1, 0), 0.5, 0.25);
      const f = fus.point(-1.5, s > 0 ? 0.35 : Math.PI - 0.35);
      marque(caisse, f.p, f.n, 0.14, E.marque);
    }
    O.souder(caisse);
    // 11. Le GRAND ROTOR (4 pales en matériaux composites, au bout en flèche, et la tête « sans articulations »), le
    // ROTOR DE QUEUE (3 pales), et les 2 disques flous en une seule pièce fixe.
    const rotor = new THREE.Group();
    rotor.position.set(-0.9, 3.35, 0);
    rotor.add(O.tour([[0.0, -0.1], [0.3, -0.1], [0.34, 0.0], [0.28, 0.1], [0.0, 0.12]], teinte(), 18, 0x2a2c2a));
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, c = Math.cos(a), s = -Math.sin(a);
      const p = O.piece(geoPale(0.45, 6.5, 0.42, 0.11, 0.22, 30), teinte());
      p.rotation.y = a;
      rotor.add(p);
      const bras = O.piece(galet(0.75, 0.12, 0.3, 0.3, 10), teinte(), c * 0.5, 0.0, s * 0.5, 0x3a3c3a);
      bras.rotation.y = a;
      rotor.add(bras);
    }
    O.souder(rotor);
    caisse.add(rotor);
    const rotorQueue = new THREE.Group();
    rotorQueue.position.set(-7.45, 3.0, 0.28);
    rotorQueue.add(O.couche(O.tour([[0.0, -0.08], [0.1, -0.08], [0.12, 0.02], [0.06, 0.1], [0.0, 0.11]], teinte(), 14, 0x2a2c2a), "z", 0, 0, 0));
    for (let k = 0; k < 3; k++) {
      const p = O.piece(geoPale(0.1, 1.35, 0.2, 0.12, 0, 12), teinte());
      p.rotation.set(Math.PI / 2, 0, (k * Math.PI * 2) / 3, "XYZ");
      rotorQueue.add(p);
    }
    O.souder(rotorQueue);
    caisse.add(rotorQueue);
    const flou = new THREE.Mesh(fusionner([new THREE.CircleGeometry(6.5, 48).rotateX(-Math.PI / 2).translate(-0.9, 3.3, 0), new THREE.CircleGeometry(1.35, 28).translate(-7.45, 3.0, 0.3)]), matFlou());
    flou.name = "flous";
    flou.castShadow = false;
    caisse.add(flou);
    return g;
  }

  // ------------------------------------------------------------------ les modèles (une fois), et leurs copies
  const FABRIQUES = { avion: rafale, chasseur, transport, drone, helico: tigre };
  const modeles = {};
  // (on compte les triangles et les dessins d'un modèle, pour « sous le capot »)
  function compter(g) {
    let triangles = 0, objets = 0;
    g.traverse((m) => {
      if (!m.isMesh) return;
      objets++;
      triangles += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3;
    });
    return { triangles: Math.round(triangles), objets };
  }
  function fabriquer(sorte, equipe) {
    const cle = sorte + ":" + equipe;
    if (!modeles[cle]) {
      const g = FABRIQUES[sorte](equipe);
      // (les décalcomanies ne font pas d'ombre)
      g.traverse((m) => {
        if (m.isMesh && m.material === M.decalcos) m.castShadow = false;
      });
      modeles[cle] = g;
      bilan[sorte] = Object.assign(bilan[sorte] || {}, compter(g), { nom: NOMS[sorte] });
    }
    const g = modeles[cle].clone(true); // (une copie : les formes et les matières sont partagées)
    const nom = (n) => g.getObjectByName(n) || null;
    const tous = (n) => {
      const t = [];
      g.traverse((x) => x.name === n && t.push(x));
      return t;
    };
    const o = { g, caisse: g.children[0], sorte, avion3d: true };
    if (sorte === "avion" || sorte === "chasseur") {
      Object.assign(o, { flamme: nom("flamme"), lueur: nom("lueur"), train: nom("train"), jambes: tous("jambe"), verriere: nom("verriere"), pilote: nom("pilote"), sortie: 1, ouverture: 1 });
      if (sorte === "avion") o.missiles = o.caisse.children.filter((x) => x.isGroup && x.name === "" && x !== o.train && x !== o.verriere && x !== o.pilote);
    } else if (sorte === "helico") {
      const c = o.caisse.children.filter((x) => x.isGroup);
      Object.assign(o, { rotor: c[0], rotorQueue: c[1], flous: nom("flous") });
    } else if (sorte === "drone") {
      const c = o.caisse.children.filter((x) => x.isGroup);
      Object.assign(o, { helices: c.slice(0, 4), grenades: c.slice(4), flous: nom("flous") });
    } else if (sorte === "transport") {
      Object.assign(o, { helices: o.caisse.children.filter((x) => x.isGroup), rampe: nom("rampe"), porteSoute: nom("porteSoute"), flous: nom("flous"), ouverture: 0 });
    }
    return o;
  }

  // ------------------------------------------------------------------ la version SIMPLE, pour de loin (des instances)
  // La même forme, avec beaucoup moins de points, les couleurs dans les sommets (le fond du camouflage, le ventre plus
  // clair, la verrière sombre), et les hélices ou le rotor en disques fins : 1 seule pièce, 1 dessin pour toutes les copies.
  function formeSimple(sorte, equipe) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true });
    const g = new THREE.Group(), PE = K().peinture[SCHEMA[sorte]][equipe];
    const fond = new THREE.Color(PE.fond), ventre = new THREE.Color(PE.ventre || PE.fond), sombre = new THREE.Color(0x1a1e22);
    const couleur = (p, n) => (n.y < -0.3 ? [ventre.r, ventre.g, ventre.b] : [fond.r, fond.g, fond.b]);
    const coque = (cles, verreSi) => {
      const r = O.coque(cles, { tours: 12, pas: 0.9, couleur, zone: (c, n) => (verreSi && verreSi(c, n) ? "verre" : "peinture") });
      for (const nom in r.geos) {
        if (nom === "verre") repeindre(r.geos[nom], sombre);
        g.add(O.piece(r.geos[nom], mat));
      }
    };
    const aile = (r, b) => {
      const a = O.aile(r, b, mat, { nu: 1, nv: 3 });
      const p = a.geometry.attributes.position, nn = a.geometry.attributes.normal, c = a.geometry.attributes.color;
      for (let i = 0; i < p.count; i++) {
        const k = nn.getY(i) < -0.3 ? ventre : fond;
        c.setXYZ(i, k.r, k.g, k.b);
      }
      g.add(a);
    };
    const b = (lx, ly, lz, x, y, z, coul) => g.add(O.boite(lx, ly, lz, mat, x, y, z, coul));
    const disque = (x, y, z, r, axe) => {
      const d = O.piece(new THREE.CylinderGeometry(r, r, 0.04, 20), mat, x, y, z, 0x3a3d40);
      if (axe === "x") d.rotation.z = Math.PI / 2;
      g.add(d);
    };
    if (sorte === "avion" || sorte === "chasseur") {
      const mig = sorte === "chasseur";
      coque(mig
        ? [{ x: -7.6, y: 2.12, w: 0.2, h: 0.15 }, { x: -3.0, y: 2.1, w: 0.82, h: 0.4, b: 0.26, n: 3 }, { x: 2.6, y: 2.2, w: 0.66, h: 0.62, b: 0.42, n: 2.8 }, { x: 4.6, y: 2.4, w: 0.6, h: 0.7, b: 0.6 }, { x: 7.5, y: 2.04, w: 0.33, h: 0.33 }, { x: 8.75, y: 1.96, w: 0.03, h: 0.03 }]
        : [{ x: -7.6, y: 2.0, w: 0.9, h: 0.4 }, { x: -4.0, y: 2.04, w: 1.1, h: 0.6, b: 0.52, n: 3 }, { x: 1.0, y: 2.1, w: 0.86, h: 0.66, b: 0.56, n: 3 }, { x: 3.6, y: 2.3, w: 0.56, h: 0.85, b: 0.5 }, { x: 6.7, y: 2.09, w: 0.27, h: 0.26 }, { x: 7.62, y: 2.04, w: 0.03, h: 0.03 }],
        (c, n) => c.x > (mig ? 3.8 : 2.8) && c.x < (mig ? 5.8 : 4.9) && n.y > 0.45);
      if (mig) for (const s of [-1, 1]) coque([{ x: -7.9, y: 1.82, w: 0.42, h: 0.42, z: s * 1.05 }, { x: -1.0, y: 1.8, w: 0.55, h: 0.56, n: 3, z: s * 1.05 }, { x: 3.0, y: 1.7, w: 0.47, h: 0.5, n: 3, z: s * 1.0 }]);
      for (const s of [-1, 1]) {
        if (mig) {
          aile({ x: 4.6, y: 2.18, z: s * 0.5, corde: 4.6, ep: 0.03 }, { x: 0.3, y: 2.08, z: s * 1.95, corde: 0.9, ep: 0.03 });
          aile({ x: -0.1, y: 2.04, z: s * 1.4, corde: 5.0, ep: 0.05 }, { x: -4.3, y: 1.92, z: s * 5.75, corde: 1.25, ep: 0.035 });
          aile({ x: -5.15, y: 1.86, z: s * 1.4, corde: 2.5, ep: 0.04 }, { x: -7.1, y: 1.8, z: s * 3.85, corde: 0.85, ep: 0.03 });
          aile({ x: -3.9, y: 2.3, z: s * 1.15, corde: 3.0, ep: 0.05 }, { x: -6.55, y: 4.75, z: s * 1.5, corde: 1.0, ep: 0.04 });
        } else {
          aile({ x: 3.3, y: 2.27, z: s * 0.55, corde: 1.75, ep: 0.05 }, { x: 1.95, y: 2.38, z: s * 2.45, corde: 0.55, ep: 0.04 });
          aile({ x: 0.9, y: 1.78, z: s * 0.7, corde: 7.1, ep: 0.05 }, { x: -4.35, y: 1.8, z: s * 5.25, corde: 1.75, ep: 0.035 });
        }
      }
      if (!mig) aile({ x: -3.5, y: 2.55, z: 0, corde: 3.3, ep: 0.07 }, { x: -6.35, y: 5.3, z: 0, corde: 1.2, ep: 0.05 });
    } else if (sorte === "transport") {
      coque([{ x: -12.9, y: 5.2, w: 0.16, h: 0.16 }, { x: -10.5, y: 4.15, w: 1.35, h: 1.25, b: 1.2 }, { x: -6.0, y: 3.05, w: 2.1, h: 2.1, b: 2.05, n: 2.6 }, { x: 6.0, y: 3.05, w: 2.1, h: 2.1, b: 2.05, n: 2.6 }, { x: 10.3, y: 2.85, w: 1.55, h: 1.45, b: 1.95 }, { x: 12.42, y: 2.2, w: 0.05, h: 0.05, b: 0.1 }], (c, n) => c.x > 10.2 && c.y > 3.0 && n.x > 0.2);
      for (const s of [-1, 1]) {
        aile({ x: 3.2, y: 5.25, z: s * 0.9, corde: 4.7, ep: 0.15 }, { x: 0.9, y: 4.92, z: s * 15.6, corde: 1.65, ep: 0.12 });
        aile({ x: -11.8, y: 10.85, z: s * 0.2, corde: 2.7, ep: 0.1 }, { x: -13.7, y: 11.0, z: s * 6.4, corde: 1.25, ep: 0.08 });
        for (const z of [5.4, 10.4]) {
          coque([{ x: -1.9, y: 4.86, w: 0.1, h: 0.08, z: s * z }, { x: 1.2, y: 4.68, w: 0.64, h: 0.7, z: s * z }, { x: 6.0, y: 4.62, w: 0.1, h: 0.1, z: s * z }]);
          disque(5.55, 4.62, s * z, 2.2, "x");
        }
      }
      aile({ x: -8.0, y: 4.9, z: 0, corde: 5.2, ep: 0.12 }, { x: -12.3, y: 11.0, z: 0, corde: 2.5, ep: 0.1 });
    } else if (sorte === "helico") {
      coque([{ x: -7.9, y: 2.56, w: 0.06, h: 0.07 }, { x: -5.0, y: 2.36, w: 0.2, h: 0.24 }, { x: -2.0, y: 2.05, w: 0.47, h: 0.6, b: 0.64, n: 3 }, { x: 0.4, y: 2.0, w: 0.5, h: 0.8, b: 0.7, n: 3 }, { x: 2.5, y: 1.58, w: 0.35, h: 0.32, b: 0.46 }, { x: 3.3, y: 1.48, w: 0.04, h: 0.04 }], (c, n) => c.x > -0.4 && c.x < 2.5 && n.y > 0.4);
      for (const s of [-1, 1]) aile({ x: 0.0, y: 1.92, z: s * 0.42, corde: 1.05, ep: 0.13 }, { x: -0.15, y: 1.8, z: s * 2.0, corde: 0.85, ep: 0.11 });
      aile({ x: -6.95, y: 2.4, z: 0, corde: 0.95, ep: 0.12 }, { x: -7.75, y: 3.85, z: 0, corde: 0.55, ep: 0.1 });
      b(0.75, 0.06, 2.4, -6.2, 2.4, 0, fond);
      disque(-0.9, 3.35, 0, 6.5);
    } else if (sorte === "drone") {
      coque([{ x: -0.5, y: 0.66, w: 0.08, h: 0.05 }, { x: 0.25, y: 0.67, w: 0.27, h: 0.15, b: 0.1, n: 3 }, { x: 0.58, y: 0.65, w: 0.04, h: 0.03 }]);
      for (const [x, z] of [[0.68, 0.68], [0.68, -0.68], [-0.68, 0.68], [-0.68, -0.68]]) {
        const bras = O.boite(0.96, 0.05, 0.05, mat, x / 2, 0.68, z / 2, 0x232527);
        bras.rotation.y = -Math.atan2(z, x);
        g.add(bras);
        disque(x, 0.85, z, 0.4);
      }
    }
    const [piece] = O.souder(g, false);
    return piece.geometry;
  }
  function lotSimple(sorte, equipe, max) {
    const geo = formeSimple(sorte, equipe);
    bilan[sorte] = Object.assign(bilan[sorte] || {}, { simple: Math.round(geo.attributes.position.count / 3) });
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.15 });
    const lot = new THREE.InstancedMesh(geo, mat, max);
    lot.count = 0;
    lot.frustumCulled = false;
    lot.castShadow = false;
    lot.receiveShadow = true;
    lot.setColorAt(0, new THREE.Color(1, 1, 1));
    return lot;
  }

  return { sait, fabriquer, lotSimple, SORTES, NOMS, bilan, PENTE };
})();
