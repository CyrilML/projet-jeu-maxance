// 🏭 LES CHARS EN 3D : l'usine de tanks (étape 60, refaite à l'étape 70)
//
// ✍️ Trois vrais tanks modernes, construits avec leurs vraies mesures (longueur, largeur, hauteur de la caisse,
// longueur du canon) et leur « signature » :
//   - le LECLERC (France) : une tourelle anguleuse et haute, un long coffre à l'arrière (le chargeur automatique),
//     6 galets par côté, les lance-grenades GALIX (9 tubes de chaque côté), deux fûts de carburant à l'arrière ;
//   - le M1 ABRAMS (États-Unis) : une tourelle large et plate aux joues très inclinées, le « panier » à l'arrière de la
//     tourelle, la coupole du chef avec sa grosse mitrailleuse, 7 galets, la grille de la turbine à l'arrière ;
//   - le LEOPARD 2A6 (Allemagne) : la tourelle en FLÈCHE (deux blindages en coin à l'avant), le très long canon L55
//     avec son évacuateur de fumée (le renflement au milieu du tube), le périscope du chef sur un mât, 7 galets.
//
// Étape 70 : « plus réalistes ». Chaque tank est maintenant fait comme un vrai :
//   - la CHENILLE fait le tour des roues comme une vraie (en bas sur les galets, elle remonte vers la roue folle à
//     l'avant et vers le barbotin à l'arrière, puis revient par-dessus en s'appuyant sur les rouleaux) ; ses patins, avec
//     leurs semelles en caoutchouc, défilent tout autour de la boucle ;
//   - les GALETS ont leur pneu, leur flasque, leur moyeu et leurs boulons ; le BARBOTIN a ses dents ;
//   - la CAISSE a deux étages, comme un vrai tank : le bas, étroit, entre les chenilles (avec le glacis du bas), et le
//     haut, large, au-dessus des chenilles (avec le grand glacis incliné) ; dessus : la trappe du pilote et ses
//     périscopes, les phares avec leur grille de protection, les grilles du moteur, les crochets de remorquage ;
//   - les JUPES : de grandes plaques le long des côtés, plus épaisses à l'avant (le blindage) ;
//   - la TOURELLE a des faces inclinées (une forme « lissée » entre le contour du bas et celui, plus petit, du haut) ;
//     dessus : les viseurs avec leurs vitres, les trappes, le CHEF DE CHAR qui sort la tête, la mitrailleuse, les
//     lance-fumigènes, les antennes ;
//   - le CANON s'amincit vers le bout, avec ses manchons thermiques, leurs colliers et le capteur de bouche.
// Toutes les pièces d'une même matière sont SOUDÉES en un seul objet (voir outils3d.js) : il y a beaucoup plus de
// détails, mais la carte graphique a MOINS d'objets à dessiner qu'avant.
// (Étape 72 : et une copie de toutes les roues soudées en une pièce, montrée à la place des 18 roues quand le tank est loin.)
//
// ✍️ Étape 75 : « Refais aussi les tanks : le plus beau possible. »
//   - la PEINTURE : un vrai camouflage à grandes taches arrondies, peint au démarrage avec du « bruit » (bois : olive,
//     brun, noir et vert clair pour les Bleus ; désert : sable, brun et ocre pour les Rouges, comme les hélicos), avec
//     le grain de la peinture mate ;
//   - l'USURE : le « shader » de la peinture ajoute de la BOUE en bas (plus on est près du sol, plus il y en a, avec des
//     bords irréguliers), de la poussière, des coulures et de petits éclats de peinture (on voit l'apprêt dessous) ;
//   - des formes ARRONDIES : la tourelle a des coins arrondis et un chanfrein (une petite pente) tout autour du toit, qui
//     attrape la lumière comme une vraie arête ; les plaques de la caisse ont des bords adoucis ;
//   - les CHENILLES : de près, chaque MAILLON est une vraie pièce en 3D (le patin, la semelle en caoutchouc, les deux
//     connecteurs, le guide au milieu) qui défile autour des roues ; de loin, l'image d'avant ;
//   - le NUMÉRO du tank peint sur la tourelle (avec la marque de son équipe), des maillons de rechange, des jerricans.
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Chars3D = (function () {
  const O = Tanks.Outils3D;
  const { boite, cylindre, couche, tube, cable, profil, contourComplet, lisse, souder, geometrieTeintee } = O;
  const cache = {};
  function camouflage(couleurs) {
    const cle = couleurs.join(",");
    if (cache[cle]) return cache[cle];
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(0, 0, 256, 256);
    let etat = 7;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < 40; k++) {
      ctx.fillStyle = couleurs[1 + (k % 3)];
      const x = h() * 256, y = h() * 256, r = 14 + h() * 30;
      for (const [dx, dy] of [[0, 0], [-256, 0], [256, 0], [0, -256], [0, 256]]) {
        ctx.beginPath();
        for (let a = 0; a < 9; a++) {
          const ang = (a / 9) * Math.PI * 2, rr = r * (0.6 + h() * 0.6);
          ctx.lineTo(x + dx + Math.cos(ang) * rr * 1.6, y + dy + Math.sin(ang) * rr);
        }
        ctx.fill();
      }
    }
    for (let i = 0; i < 4000; i++) { // de la poussière et de l'usure
      ctx.fillStyle = "rgba(" + (h() < 0.5 ? "0,0,0," : "255,240,210,") + h() * 0.08 + ")";
      ctx.fillRect(h() * 256, h() * 256, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(0.25, 0.25);
    return (cache[cle] = t);
  }

  // ------------------------------------------------------------------ (étape 75) la peinture des tanks
  // Un bruit qui se RÉPÈTE parfaitement d'un bord de l'image à l'autre : on mélange 4 copies décalées du bruit, chacune
  // d'autant plus forte qu'on est loin du bord où elle « casse ».
  const bruitRepete = (br, x, y, P, oct) => {
    const fx = x / P, fy = y / P, f = (a, b) => Tanks.Bruit.fractal(br, a, b, oct);
    return f(x, y) * (1 - fx) * (1 - fy) + f(x - P, y) * fx * (1 - fy) + f(x, y - P) * (1 - fx) * fy + f(x - P, y - P) * fx * fy;
  };
  // Le CAMOUFLAGE d'une équipe (une image de 512 points = 4 m de tôle) : des taches arrondies, chacune de sa couleur, qui se
  // chevauchent (bois : de longues taches noires par-dessus ; désert : de grandes plaques brunes et ocre).
  function camoChar(equipe) {
    const cle = "camo:" + equipe;
    if (cache[cle]) return cache[cle];
    const PE = Tanks.CONFIG.peinture[equipe], n = 256, P = 4; // (4 « cases » de bruit sur l'image : des taches d'environ 1 m)
    const cols = PE.taches.map((h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b].map((v) => Math.round(Math.pow(v, 1 / 2.2) * 255)); });
    const b1 = Tanks.Bruit.creer(/^bleus/.test(equipe) ? 751 : 761), b2 = Tanks.Bruit.creer(/^bleus/.test(equipe) ? 752 : 762), b3 = Tanks.Bruit.creer(/^bleus/.test(equipe) ? 753 : 763);
    const petit = document.createElement("canvas");
    petit.width = petit.height = n;
    const pc = petit.getContext("2d"), img = pc.createImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = (i / n) * P, y = (j / n) * P * 0.8 + 0.37;
      const t1 = bruitRepete(b1, x, y, P, 3), t2 = bruitRepete(b2, x * 1.3, y * 1.3, P * 1.3, 3), t3 = bruitRepete(b3, x * 1.7, y * 1.1, P * 1.7, 2);
      let c = cols[0];
      if (/^bleus/.test(equipe)) {
        if (t2 > 0.16) c = cols[3];
        if (t1 > 0.1) c = cols[1];
        if (t3 > 0.27) c = cols[2];
      } else {
        if (t1 > 0.06) c = cols[1];
        if (t2 > 0.2) c = cols[2];
        if (t3 > 0.3) c = cols[3];
      }
      const k = (j * n + i) * 4;
      img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
    }
    pc.putImageData(img, 0, 0);
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(petit, 0, 0, 512, 512);
    let etat = 75;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 16000; i++) (ctx.fillStyle = "rgba(" + (h() < 0.5 ? "0,0,0," : "255,250,235,") + h() * 0.07 + ")"), ctx.fillRect(h() * 512, h() * 512, 1.5, 1.5);
    for (let i = 0; i < 90; i++) { // des retouches de peinture (un peu plus claires ou plus foncées)
      const x = h() * 512, y = h() * 512, r = 10 + h() * 40, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(" + (h() < 0.5 ? "0,0,0," : "255,255,255,") + "0.05)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.repeat.set(0.25, 0.25);
    return (cache[cle] = t);
  }
  // L'image de la SALETÉ (4 m) : rouge = des nuages de saleté, vert = de petits éclats de peinture, bleu = des coulures.
  function texSalete() {
    if (cache.salete) return cache.salete;
    const n = 256, P = 6, br = Tanks.Bruit.creer(7577), img = new ImageData(n, n);
    let etat = 7578;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    const eclats = new Float32Array(n * n), coulures = new Float32Array(n * n);
    for (let k = 0; k < 110; k++) { // les éclats : de petites taches irrégulières
      const x = Math.floor(h() * n), y = Math.floor(h() * n), r = 1 + h() * 2.2;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy < r * r * (0.6 + h() * 0.8)) eclats[((y + dy + n) % n) * n + ((x + dx + n) % n)] = 1;
    }
    for (let k = 0; k < 70; k++) { // les coulures : des traits verticaux qui s'effacent
      const x = Math.floor(h() * n), y = Math.floor(h() * n), l = 10 + h() * 60, f = 0.3 + h() * 0.7;
      for (let d = 0; d < l; d++) coulures[((y + d) % n) * n + x] = Math.max(coulures[((y + d) % n) * n + x], f * (1 - d / l));
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const v = bruitRepete(br, (i / n) * P, (j / n) * P, P, 4) * 0.5 + 0.5, k = (j * n + i) * 4;
      img.data[k] = Math.max(0, Math.min(255, v * 255));
      img.data[k + 1] = eclats[j * n + i] * 255;
      img.data[k + 2] = coulures[j * n + i] * 255;
      img.data[k + 3] = 255;
    }
    const c = document.createElement("canvas");
    c.width = c.height = n;
    c.getContext("2d").putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return (cache.salete = t);
  }
  // Le « shader » de l'USURE : de la boue en bas (selon la hauteur de chaque point, « hauteur », dans le repère du tank),
  // de la poussière, des coulures, et des éclats de peinture. (Les coordonnées de texture sont en mètres : camoAPlat.)
  function usure(mat, equipe) {
    const PE = Tanks.CONFIG.peinture[equipe];
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.texSalete = { value: texSalete() };
      sh.uniforms.couleurBoue = { value: new THREE.Color(PE.boue) };
      sh.uniforms.couleurPoussiere = { value: new THREE.Color(PE.poussiere) };
      sh.uniforms.hauteurBoue = { value: Tanks.CONFIG.peinture.boue };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float hauteur;\nvarying float vHaut;\nvarying vec2 vUvSal;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHaut = hauteur;\nvUvSal = uv;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D texSalete;\nuniform vec3 couleurBoue;\nuniform vec3 couleurPoussiere;\nuniform float hauteurBoue;\nvarying float vHaut;\nvarying vec2 vUvSal;")
        .replace("#include <map_fragment>", [
          "#include <map_fragment>",
          "vec4 sal = texture2D(texSalete, vUvSal * 0.25);",
          "vec4 sal2 = texture2D(texSalete, vUvSal * 0.9 + 0.31);",
          "float boue = smoothstep(hauteurBoue, hauteurBoue * 0.3, vHaut + (sal.r - 0.5) * 0.9 + (sal2.r - 0.5) * 0.25);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, couleurBoue * (0.75 + 0.5 * sal2.r), boue * 0.8);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, couleurPoussiere, (1.0 - boue) * smoothstep(0.45, 0.85, sal.r) * 0.35);",
          "diffuseColor.rgb *= 1.0 - sal2.b * 0.28 * (1.0 - boue);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.155, 0.14), sal.g * (1.0 - boue) * 0.5);",
        ].join("\n"))
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.97, boue);")
        // (les faces tournées vers le bas reçoivent moins de lumière du ciel : un peu plus sombres, comme dans la réalité)
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nvec3 nMonde = normalize((vec4(normal, 0.0) * viewMatrix).xyz);\ndiffuseColor.rgb *= mix(0.6, 1.0, smoothstep(-0.75, 0.25, nMonde.y));");
    };
    mat.customProgramCacheKey = () => "usure-" + equipe;
    return mat;
  }
  // (on écrit, pour chaque point d'un objet soudé, sa hauteur dans le repère du tank : c'est elle qui dit où va la boue)
  function hauteurs(objets, decalage) {
    for (const o of objets) {
      if (!o.material.userData.usure) continue;
      const p = o.geometry.attributes.position, h = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) h[i] = p.getY(i) + decalage;
      o.geometry.setAttribute("hauteur", new THREE.BufferAttribute(h, 1));
    }
  }

  // Les patins de la chenille, dessinés sur une petite toile (4 patins de 16 cm : la toile fait 64 cm de chenille).
  // En bas de la toile : la face qui touche le sol (les semelles en caoutchouc) ; au milieu : la face intérieure (les
  // guides, au centre, qui passent entre les deux moitiés des galets) ; en haut : la tranche (les connecteurs).
  const PAS_TOILE = 0.64;
  function texturePatins() {
    if (cache.patins) return cache.patins;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d");
    const r = (couleur, x, y, l, h) => ((ctx.fillStyle = couleur), ctx.fillRect(x, y, l, h));
    for (let i = 0; i < 4; i++) {
      const x = i * 64;
      // la face qui touche le sol (lignes 64 à 128)
      r("#37352f", x, 64, 64, 64);
      r("#181818", x + 5, 69, 50, 22); // la semelle de gauche
      r("#181818", x + 5, 101, 50, 22); // la semelle de droite
      r("#4f4c45", x, 64, 64, 4); // les connecteurs du bord
      r("#4f4c45", x, 124, 64, 4);
      r("#4f4c45", x + 18, 92, 26, 8); // le connecteur du milieu
      r("#0d0d0d", x + 58, 64, 6, 64); // l'espace entre deux patins
      // la face intérieure (lignes 19 à 64)
      r("#3b3934", x, 19, 64, 45);
      r("#64615a", x + 18, 35, 28, 13); // le guide
      r("#26251f", x + 58, 19, 6, 45);
      // la tranche (lignes 0 à 19)
      r("#1e1d1a", x, 0, 64, 19);
      r("#55524b", x + 6, 3, 50, 13);
      r("#242320", x + 28, 6, 7, 7); // l'écrou
    }
    let etat = 3;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 1500; i++) { // la terre collée et l'usure (le métal brille là où il frotte)
      ctx.fillStyle = h() < 0.7 ? "rgba(105,86,58," + h() * 0.35 + ")" : "rgba(150,150,145," + h() * 0.2 + ")";
      ctx.fillRect(h() * 256, h() * 128, 2 + h() * 3, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return (cache.patins = t);
  }

  const mats = {};
  function materiaux() {
    if (mats.teinte) return mats;
    // (une seule matière pour toutes les petites pièces : chacune garde sa couleur, écrite dans ses sommets)
    mats.teinte = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.35 });
    mats.verre = new THREE.MeshStandardMaterial({ color: 0x1d3a4c, metalness: 0.85, roughness: 0.08, emissive: 0x08141c });
    mats.phare = new THREE.MeshStandardMaterial({ color: 0xe8eef0, metalness: 0.4, roughness: 0.1, emissive: 0xb8c4c8, emissiveIntensity: 0.35 });
    mats.brule = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1, metalness: 0.1 });
    mats.maillon = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.45 }); // (étape 75 : les maillons)
    return mats;
  }
  // Les matières de chaque équipe : la peinture camouflage et la couleur de la marque.
  const parEquipe = {};
  function matsEquipe(equipe) {
    if (parEquipe[equipe]) return parEquipe[equipe];
    const E = Tanks.CONFIG.equipes[equipe];
    // (étape 75) le camouflage à taches arrondies, et l'usure (la boue, la poussière, les éclats)
    const peinture = usure(new THREE.MeshStandardMaterial({ map: camoChar(equipe), roughness: 0.8, metalness: 0.12 }), equipe);
    peinture.userData.camo = peinture.userData.usure = true;
    // (les petites pièces à couleurs de sommets du tank : la même usure, avec la boue sur les roues)
    const teinte = usure(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.35 }), equipe);
    teinte.userData.camo = teinte.userData.usure = true;
    const vert = new THREE.Color(Tanks.CONFIG.peinture[equipe].taches[0]).multiplyScalar(0.85);
    return (parEquipe[equipe] = {
      peinture, teinte,
      marque: new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.25, side: THREE.DoubleSide }),
      vert, // (la couleur de fond, sans taches, pour les roues et les petites pièces peintes)
      vertFonce: vert.clone().multiplyScalar(0.7),
    });
  }

  // Les couleurs des petites pièces.
  const C = {
    acier: 0x45474a, noir: 0x1c1d1f, caoutchouc: 0x151515, olive: 0x3f4630, peau: 0xc8956c, tissu: 0x4d5536,
    casque: 0x3a4229, rouge: 0x7a1010, orange: 0xb06a12, bois: 0x6b4a2b, toile: 0x6d6748, sable: 0x8c7c58, fut: 0x3c4a2e,
  };

  // ------------------------------------------------------------------ les roues (une géométrie, réutilisée)
  // Chaque roue est fabriquée une fois (par taille, par équipe et par côté) puis réutilisée : c'est la même
  // « forme » dessinée plusieurs fois. Elles sont construites l'axe vers le haut (y) : on les couche ensuite.
  const roues = {};
  function geoGalet(r, larg, E, cote, acierNu) {
    const cle = ["galet", r, larg, E.vert.getHex(), cote, acierNu].join(":");
    if (roues[cle]) return roues[cle];
    const m = { teinte: E.teinte }, o = cote; // (o : de quel côté est la face extérieure de la roue) (étape 75 : avec l'usure)
    const p = [];
    p.push(cylindre(r, r, larg * 0.98, m.teinte, 14, acierNu ? C.acier : C.caoutchouc)); // le pneu (ou la jante d'acier)
    p.push(cylindre(r - 0.065, r - 0.065, larg + 0.012, m.teinte, 14, E.vert)); // la flasque
    const coupe = cylindre(o > 0 ? r * 0.42 : r * 0.6, o > 0 ? r * 0.6 : r * 0.42, 0.05, m.teinte, 10, E.vertFonce); // le creux
    coupe.position.y = o * (larg / 2 + 0.03);
    p.push(coupe);
    const moyeu = cylindre(0.1, 0.12, 0.08, m.teinte, 8, C.noir);
    moyeu.position.y = o * (larg / 2 + 0.08);
    p.push(moyeu);
    for (let k = 0; k < 5; k++) { // les boulons
      const a = (k / 5) * Math.PI * 2;
      p.push(boite(0.04, 0.03, 0.04, m.teinte, Math.cos(a) * r * 0.7, o * (larg / 2 + 0.015), Math.sin(a) * r * 0.7, C.acier));
    }
    return (roues[cle] = geometrieTeintee(p, m.teinte));
  }
  function geoBarbotin(r, larg, E, cote) {
    const cle = ["barbotin", r, larg, E.vert.getHex(), cote].join(":");
    if (roues[cle]) return roues[cle];
    const m = { teinte: E.teinte }, o = cote, n = 12, dent = new THREE.Shape();
    for (let k = 0; k < n; k++) { // une roue dentée : 12 dents
      const a = (k / n) * Math.PI * 2, d = Math.PI / n;
      const pt = (rr, aa) => [Math.cos(aa) * rr, Math.sin(aa) * rr];
      const pts = [pt(r - 0.02, a - d * 0.9), pt(r + 0.07, a - d * 0.35), pt(r + 0.07, a + d * 0.35), pt(r - 0.02, a + d * 0.9)];
      pts.forEach(([x, y], i) => (k === 0 && i === 0 ? dent.moveTo(x, y) : dent.lineTo(x, y)));
    }
    const p = [];
    for (const s of [-1, 1]) {
      const g = new THREE.ExtrudeGeometry(dent, { depth: 0.07, bevelEnabled: false });
      g.translate(0, 0, -0.035);
      g.rotateX(-Math.PI / 2);
      const couronne = O.piece(g, m.teinte, 0, s * (larg / 2 - 0.06), 0, C.acier);
      p.push(couronne);
    }
    p.push(cylindre(r - 0.06, r - 0.06, larg - 0.1, m.teinte, 16, E.vert));
    const moyeu = cylindre(o > 0 ? 0.13 : 0.2, o > 0 ? 0.2 : 0.13, 0.12, m.teinte, 12, E.vertFonce);
    moyeu.position.y = o * (larg / 2 + 0.02);
    p.push(moyeu);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      p.push(boite(0.035, 0.03, 0.035, m.teinte, Math.cos(a) * 0.24, o * (larg / 2 - 0.005), Math.sin(a) * 0.24, C.acier));
    }
    return (roues[cle] = geometrieTeintee(p, m.teinte));
  }

  // ------------------------------------------------------------------ la chenille
  // La boucle : on prend les cercles des roues, et on « tend un élastique » autour (l'enveloppe convexe) ;
  // c'est exactement ce que fait une chenille tendue. Puis on lui donne une épaisseur et une largeur.
  function enveloppe(cercles) {
    const pts = [];
    for (const c of cercles) for (let k = 0; k < 36; k++) pts.push([c.x + Math.cos((k / 36) * Math.PI * 2) * c.r, c.y + Math.sin((k / 36) * Math.PI * 2) * c.r]);
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const croix = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const bas = [], haut = [];
    for (const p of pts) {
      while (bas.length >= 2 && croix(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop();
      bas.push(p);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const p = pts[i];
      while (haut.length >= 2 && croix(haut[haut.length - 2], haut[haut.length - 1], p) <= 0) haut.pop();
      haut.push(p);
    }
    return bas.slice(0, -1).concat(haut.slice(0, -1)); // (dans le sens inverse des aiguilles d'une montre : en bas, on va vers l'avant)
  }
  function geoChenille(cercles, ep, larg) {
    const int = enveloppe(cercles), n = int.length;
    const nrm = int.map((p, i) => {
      const a = int[(i - 1 + n) % n], b = int[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [dy / l, -dx / l]; // (vers l'extérieur de la boucle)
    });
    const ext = int.map((p, i) => [p[0] + nrm[i][0] * ep, p[1] + nrm[i][1] * ep]);
    const s = [0];
    for (let i = 1; i <= n; i++) s.push(s[i - 1] + Math.hypot(ext[i % n][0] - ext[i - 1][0], ext[i % n][1] - ext[i - 1][1]));
    const pos = [], nor = [], uv = [], idx = [];
    const bande = (A, B, nA, nB, vA, vB) => { // une bande de quadrilatères tout autour de la boucle
      const d = pos.length / 3;
      for (let i = 0; i <= n; i++) {
        const k = i % n, u = s[i] / PAS_TOILE;
        const a = A(k), b = B(k), na = nA(k), nb = nB(k);
        pos.push(a[0], a[1], a[2], b[0], b[1], b[2]);
        nor.push(na[0], na[1], na[2], nb[0], nb[1], nb[2]);
        uv.push(u, vA, u, vB);
      }
      for (let i = 0; i < n; i++) {
        const a = d + i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    };
    const w = larg / 2;
    bande((k) => [ext[k][0], ext[k][1], -w], (k) => [ext[k][0], ext[k][1], w], (k) => [nrm[k][0], nrm[k][1], 0], (k) => [nrm[k][0], nrm[k][1], 0], 0, 0.5); // dehors
    bande((k) => [int[k][0], int[k][1], w], (k) => [int[k][0], int[k][1], -w], (k) => [-nrm[k][0], -nrm[k][1], 0], (k) => [-nrm[k][0], -nrm[k][1], 0], 0.5, 0.85); // dedans
    bande((k) => [ext[k][0], ext[k][1], w], (k) => [int[k][0], int[k][1], w], () => [0, 0, 1], () => [0, 0, 1], 0.85, 1); // la tranche z+
    bande((k) => [int[k][0], int[k][1], -w], (k) => [ext[k][0], ext[k][1], -w], () => [0, 0, -1], () => [0, 0, -1], 0.85, 1); // la tranche z-
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  // ------------------------------------------------------------------ les fiches de construction
  // (en m ; x vers l'avant, z vers la droite ; la tourelle est décrite autour de son centre de rotation)
  // tourelle.bas / tourelle.haut : la moitié du contour (z ≥ 0), vue de dessus, de l'avant vers l'arrière.
  const TYPES = {
    leclerc: {
      galets: 6, rG: 0.36, rouleaux: 2, hT: 0.85, glacis: 1.5, nez: 1.24, xT: -0.15, pilote: -0.8, echappement: "gauche", futs: true,
      tourelle: {
        bas: [[1.55, 0], [1.55, 0.34], [2.02, 0.4], [1.97, 1.2], [1.62, 1.33], [-1.3, 1.33], [-1.5, 1.1], [-3.0, 1.05], [-3.1, 0.82], [-3.1, 0]],
        haut: [[1.55, 0], [1.55, 0.34], [1.93, 0.4], [1.88, 1.12], [1.56, 1.25], [-1.28, 1.26], [-1.47, 1.04], [-2.94, 0.99], [-3.03, 0.77], [-3.03, 0]],
        pivot: 1.58, yPivot: 0.43,
      },
    },
    abrams: {
      galets: 7, rG: 0.33, rouleaux: 3, hT: 0.78, glacis: 2.0, nez: 1.2, xT: -0.5, pilote: 0, echappement: "arriere",
      tourelle: {
        bas: [[1.78, 0], [1.78, 0.5], [2.6, 0.58], [1.3, 1.72], [-1.6, 1.76], [-1.9, 1.56], [-3.05, 1.5], [-3.1, 0]],
        haut: [[1.78, 0], [1.78, 0.5], [2.18, 0.55], [1.12, 1.56], [-1.6, 1.62], [-1.86, 1.45], [-2.97, 1.4], [-3.02, 0]],
        pivot: 1.8, yPivot: 0.4,
      },
    },
    leopard: {
      galets: 7, rG: 0.35, rouleaux: 4, hT: 0.86, glacis: 1.75, nez: 1.26, xT: -0.3, pilote: 0.8, echappement: "cotes",
      tourelle: {
        bas: [[1.5, 0], [1.5, 0.37], [2.8, 0.42], [1.15, 1.43], [-1.7, 1.46], [-2.0, 1.22], [-2.78, 1.16], [-2.84, 0]],
        haut: [[1.5, 0], [1.5, 0.37], [1.78, 0.41], [0.86, 1.35], [-1.7, 1.38], [-1.95, 1.15], [-2.72, 1.1], [-2.78, 0]],
        pivot: 1.52, yPivot: 0.44,
      },
    },
  };
  // (la largeur de la tourelle à une abscisse x, d'après son contour du bas : pour poser des pièces sur ses flancs)
  function largeurA(moitie, x) {
    for (let i = 0; i < moitie.length - 1; i++) {
      const [x1, z1] = moitie[i], [x2, z2] = moitie[i + 1];
      if ((x <= x1 && x >= x2) || (x >= x1 && x <= x2)) return x1 === x2 ? Math.max(z1, z2) : z1 + ((x - x1) / (x2 - x1)) * (z2 - z1);
    }
    return moitie[0][1];
  }

  // Le chef de char qui sort la tête par sa trappe (avec son casque et ses écouteurs), et le couvercle ouvert.
  function chef(groupe, m, x, y, z) {
    groupe.add(cylindre(0.36, 0.36, 0.1, m.teinte, 16, C.noir).translateX(x).translateY(y + 0.05).translateZ(z)); // l'anneau de la trappe
    const corps = O.piece(new THREE.CapsuleGeometry(0.2, 0.25, 3, 10), m.teinte, x, y + 0.2, z, C.tissu);
    corps.scale.set(0.8, 1, 1.15);
    groupe.add(corps);
    groupe.add(O.piece(new THREE.SphereGeometry(0.11, 10, 8), m.teinte, x + 0.01, y + 0.6, z, C.peau)); // la tête
    const casque = O.piece(new THREE.SphereGeometry(0.135, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, x - 0.01, y + 0.64, z, C.casque);
    casque.scale.set(1.08, 0.95, 1.05);
    groupe.add(casque);
    for (const s of [-1, 1]) groupe.add(boite(0.07, 0.08, 0.04, m.teinte, x, y + 0.6, z + s * 0.12, C.noir)); // les écouteurs
    groupe.add(boite(0.03, 0.04, 0.16, m.teinte, x + 0.11, y + 0.68, z, C.noir)); // les jumelles de vision nocturne, relevées
    for (const s of [-1, 1]) groupe.add(tube([x + 0.02, y + 0.38, z + s * 0.22], [x + 0.25, y + 0.14, z + s * 0.2], 0.05, m.teinte, 6, C.tissu)); // les bras, posés sur le bord
    const couvercle = cylindre(0.36, 0.36, 0.06, m.teinte, 16, C.olive); // le couvercle, ouvert, debout derrière lui
    couvercle.rotation.z = Math.PI / 2 - 0.25;
    couvercle.position.set(x - 0.42, y + 0.36, z);
    groupe.add(couvercle);
  }
  // Une trappe fermée (avec sa charnière et sa poignée).
  function trappe(groupe, mat, m, x, y, z, r) {
    groupe.add(cylindre(r + 0.04, r + 0.06, 0.08, m.teinte, 16, C.noir).translateX(x).translateY(y + 0.04).translateZ(z));
    groupe.add(cylindre(r, r, 0.07, mat, 16).translateX(x).translateY(y + 0.1).translateZ(z));
    groupe.add(boite(0.08, 0.06, r * 1.2, m.teinte, x - r, y + 0.12, z, C.acier)); // la charnière
    groupe.add(boite(0.04, 0.04, 0.2, m.teinte, x + r * 0.5, y + 0.16, z, C.acier)); // la poignée
  }
  // Une mitrailleuse (sur son affût) : le boîtier, le canon, la caisse de munitions.
  function mitrailleuse(groupe, m, x, y, z, longueur, lourde) {
    const e = lourde ? 1.4 : 1;
    groupe.add(tube([x - 0.2, y, z], [x, y + 0.25, z], 0.03, m.teinte, 6, C.acier)); // l'affût
    groupe.add(boite(0.55 * e, 0.12 * e, 0.11 * e, m.teinte, x + 0.05, y + 0.32, z, C.noir));
    groupe.add(couche(cylindre(0.025 * e, 0.025 * e, longueur, m.teinte, 6, C.noir), "x", x + 0.3 + longueur / 2, y + 0.33, z));
    if (lourde) groupe.add(couche(cylindre(0.045, 0.045, 0.45, m.teinte, 8, C.noir), "x", x + 0.55, y + 0.33, z)); // le manchon perforé
    groupe.add(boite(0.2, 0.16, 0.14, m.teinte, x, y + 0.26, z - 0.14 * e, C.olive)); // la caisse de munitions
    groupe.add(boite(0.06, 0.12, 0.12, m.teinte, x - 0.22 * e, y + 0.32, z, C.noir)); // les poignées
  }
  // Un bloc de lance-fumigènes : des tubes, penchés vers l'extérieur et vers le haut.
  function fumigenes(groupe, m, x, y, z, cote, colonnes, rangees, versAvant) {
    const bloc = new THREE.Group();
    for (let i = 0; i < colonnes; i++) {
      for (let j = 0; j < rangees; j++) {
        const t = cylindre(0.055, 0.055, 0.3, m.teinte, 7, C.noir);
        t.position.set(i * 0.13, j * 0.12, 0);
        bloc.add(t);
      }
    }
    bloc.add(boite(colonnes * 0.13 + 0.05, 0.05, 0.14, m.teinte, (colonnes - 1) * 0.065, -0.16, 0, C.olive));
    bloc.rotation.set(cote * -0.9, versAvant ? -0.5 * cote : 0, versAvant ? -0.5 : 0, "YXZ");
    bloc.position.set(x, y, z);
    bloc.updateMatrixWorld(true);
    for (const t of [...bloc.children]) { // (on remet les tubes dans le groupe, à leur place, pour pouvoir les souder)
      t.applyMatrix4(bloc.matrix);
      groupe.add(t);
    }
  }

  // ------------------------------------------------------------------ (étape 75) la tourelle ARRONDIE
  // On « arrondit » chaque coin du contour (vu de dessus) : le coin est remplacé par un petit arc de cercle. Puis on
  // fait 3 anneaux : le bas, le haut (un peu sous le toit) et le haut RENTRÉ de « ch » (le chanfrein : une petite pente
  // tout autour du toit), et on les relie. Les normales (la direction de chaque point de la surface) sont calculées
  // pour que la lumière glisse en douceur sur les arrondis, et que les grandes faces restent bien plates.
  function arrondir(contour, r, nSeg) {
    const n = contour.length, sortie = [];
    for (let i = 0; i < n; i++) {
      const p0 = contour[(i - 1 + n) % n], p1 = contour[i], p2 = contour[(i + 1) % n];
      let e1x = p1[0] - p0[0], e1z = p1[1] - p0[1], e2x = p2[0] - p1[0], e2z = p2[1] - p1[1];
      const l1 = Math.hypot(e1x, e1z) || 1, l2 = Math.hypot(e2x, e2z) || 1;
      (e1x /= l1), (e1z /= l1), (e2x /= l2), (e2z /= l2);
      const cos = Math.max(-1, Math.min(1, -(e1x * e2x + e1z * e2z))), angle = Math.acos(cos); // (l'angle du coin)
      if (angle > Math.PI - 0.05) { sortie.push({ x: p1[0], z: p1[1], tx: e1x + e2x, tz: e1z + e2z }); continue; }
      const d = Math.min(r / Math.tan(angle / 2), l1 * 0.45, l2 * 0.45);
      for (let k = 0; k <= nSeg; k++) {
        const t = k / nSeg, ax = p1[0] - e1x * d, az = p1[1] - e1z * d, bx = p1[0] + e2x * d, bz = p1[1] + e2z * d;
        // (une courbe de Bézier entre le début et la fin de l'arrondi, tirée vers le coin : presque un arc de cercle)
        const u = 1 - t, x = u * u * ax + 2 * u * t * p1[0] + t * t * bx, z = u * u * az + 2 * u * t * p1[1] + t * t * bz;
        sortie.push({ x, z, tx: e1x * u + e2x * t, tz: e1z * u + e2z * t });
      }
    }
    for (const p of sortie) { const l = Math.hypot(p.tx, p.tz) || 1; (p.tx /= l), (p.tz /= l); }
    return sortie;
  }
  function tourelleArrondie(bas, haut, y0, y1, mat, r, ch) {
    const A = arrondir(bas, r, 4), B = arrondir(haut, r * 0.9, 4), n = A.length;
    let aire = 0, cx = 0, cz = 0;
    for (let i = 0; i < n; i++) (aire += A[i].x * A[(i + 1) % n].z - A[(i + 1) % n].x * A[i].z), (cx += A[i].x / n), (cz += A[i].z / n);
    const s = aire > 0 ? -1 : 1; // (de quel côté est l'extérieur)
    const nrm = (p) => [p.tz * s, -p.tx * s]; // (la normale vers l'extérieur, vue de dessus)
    const C2 = B.map((p) => { const [nx, nz] = nrm(p); return { x: p.x - nx * ch, z: p.z - nz * ch }; });
    const pos = [], nor = [];
    const sommet = (x, y, z, n) => (pos.push(x, y, z), nor.push(n[0], n[1], n[2]));
    const normCote = (i) => { // la normale du flanc (penché) au point i
      const [nx, nz] = nrm(A[i]), dx = B[i].x - A[i].x, dz = B[i].z - A[i].z, dy = y1 - ch - y0;
      // (le flanc penche vers l'intérieur : sa normale monte un peu)
      const pente = -(dx * nx + dz * nz) / dy, l = Math.hypot(nx, pente, nz);
      return [nx / l, pente / l, nz / l];
    };
    const normChanfrein = (i) => { const [nx, nz] = nrm(B[i]), l = Math.hypot(nx, 1.1, nz); return [nx / l, 1.1 / l, nz / l]; };
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, ni = normCote(i), nj = normCote(j), ci = normChanfrein(i), cj = normChanfrein(j);
      // le flanc
      sommet(A[i].x, y0, A[i].z, ni); sommet(A[j].x, y0, A[j].z, nj); sommet(B[j].x, y1 - ch, B[j].z, nj);
      sommet(A[i].x, y0, A[i].z, ni); sommet(B[j].x, y1 - ch, B[j].z, nj); sommet(B[i].x, y1 - ch, B[i].z, ni);
      // le chanfrein
      sommet(B[i].x, y1 - ch, B[i].z, ci); sommet(B[j].x, y1 - ch, B[j].z, cj); sommet(C2[j].x, y1, C2[j].z, cj);
      sommet(B[i].x, y1 - ch, B[i].z, ci); sommet(C2[j].x, y1, C2[j].z, cj); sommet(C2[i].x, y1, C2[i].z, ci);
    }
    // le toit (à plat)
    const tris = THREE.ShapeUtils.triangulateShape(C2.map((p) => new THREE.Vector2(p.x, p.z)), []);
    for (const t of tris) {
      const [a, b, c] = t.map((k) => C2[k]), up = (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x) < 0;
      for (const p of up ? [a, b, c] : [a, c, b]) sommet(p.x, y1, p.z, [0, 1, 0]);
    }
    // (le sens des triangles des flancs : leur normale « géométrique » doit aller vers l'extérieur, sinon on les retourne)
    const P0 = new THREE.Vector3(...pos.slice(0, 3)), P1 = new THREE.Vector3(...pos.slice(3, 6)), P2 = new THREE.Vector3(...pos.slice(6, 9));
    const g0 = new THREE.Vector3().subVectors(P1, P0).cross(new THREE.Vector3().subVectors(P2, P0));
    if (g0.dot(new THREE.Vector3(...nor.slice(0, 3))) < 0) {
      const fin = n * 12 * 3;
      for (let t = 0; t < fin; t += 9) for (let k = 0; k < 3; k++) {
        [pos[t + 3 + k], pos[t + 6 + k]] = [pos[t + 6 + k], pos[t + 3 + k]];
        [nor[t + 3 + k], nor[t + 6 + k]] = [nor[t + 6 + k], nor[t + 3 + k]];
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    return O.piece(g, mat);
  }

  // ------------------------------------------------------------------ (étape 75) les MAILLONS de la chenille, en 3D
  // Un maillon (dans son repère : x le long de la chenille, −y vers l'extérieur — le sol —, z en travers) : le patin en
  // acier, les deux semelles en caoutchouc (dehors), les deux connecteurs (des tiges en travers, avec leurs écrous) et le
  // guide au milieu (dedans, il passe entre les deux moitiés des galets).
  const PAS_MAILLON = 0.165;
  function geoMaillon(tw) {
    const cle = "maillon:" + tw;
    if (cache[cle]) return cache[cle];
    const mt = materiaux().maillon, p = [], w = tw / 2;
    p.push(boite(0.13, 0.045, tw * 0.94, mt, 0, -0.012, 0, 0x3b3a35)); // le patin
    for (const s of [-1, 1]) p.push(boite(0.11, 0.028, w * 0.72, mt, 0, -0.048, s * w * 0.5, 0x191918)); // les semelles en caoutchouc
    for (const x of [-PAS_MAILLON / 2 + 0.014, PAS_MAILLON / 2 - 0.014]) p.push(boite(0.03, 0.03, tw * 1.04, mt, x, 0.002, 0, 0x56544e)); // les connecteurs
    p.push(boite(0.07, 0.07, 0.06, mt, 0, 0.045, 0, 0x4b4943)); // le guide
    return (cache[cle] = geometrieTeintee(p, mt));
  }
  // Le chemin du milieu de la chenille tout autour des roues (des points, et la longueur parcourue jusqu'à chacun).
  function cheminChenille(cercles, ep) {
    const int = enveloppe(cercles), n = int.length, pts = [];
    for (let i = 0; i < n; i++) {
      const a = int[(i - 1 + n) % n], b = int[(i + 1) % n], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      pts.push([int[i][0] + (dy / l) * ep * 0.5, int[i][1] - (dx / l) * ep * 0.5]);
    }
    const s = [0];
    for (let i = 1; i <= n; i++) s.push(s[i - 1] + Math.hypot(pts[i % n][0] - pts[i - 1][0], pts[i % n][1] - pts[i - 1][1]));
    return { pts, s, longueur: s[n] };
  }
  // Les maillons des 2 chenilles (une seule « instance » pour tout le tank) ; maj(gauche, droite) les fait défiler.
  function maillons(cercles, ep, tw, zc) {
    const ch = cheminChenille(cercles, ep), nb = Math.round(ch.longueur / PAS_MAILLON), pas = ch.longueur / nb;
    const mesh = new THREE.InstancedMesh(geoMaillon(tw), materiaux().maillon, nb * 2);
    mesh.castShadow = false; // (sous la caisse, leur ombre ne se verrait pas : on ne la calcule pas)
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    const tab = mesh.instanceMatrix.array, n = ch.pts.length;
    function maj(gauche, droite) {
      [gauche, droite].forEach((dist, cote) => {
        const z = (cote ? 1 : -1) * zc;
        let d0 = (-dist) % pas;
        if (d0 < 0) d0 += pas;
        let seg = 0;
        for (let k = 0; k < nb; k++) {
          const voulu = d0 + k * pas;
          while (seg < n - 1 && ch.s[seg + 1] < voulu) seg++;
          const a = ch.pts[seg], b = ch.pts[(seg + 1) % n], l = ch.s[seg + 1] - ch.s[seg] || 1e-6, t = (voulu - ch.s[seg]) / l;
          const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l;
          const i = (cote * nb + k) * 16;
          // la matrice : x du maillon le long du chemin (tx, ty), son y vers l'intérieur de la boucle (−ty, tx)
          tab[i] = tx; tab[i + 1] = ty; tab[i + 2] = 0; tab[i + 3] = 0;
          tab[i + 4] = -ty; tab[i + 5] = tx; tab[i + 6] = 0; tab[i + 7] = 0;
          tab[i + 8] = 0; tab[i + 9] = 0; tab[i + 10] = 1; tab[i + 11] = 0;
          tab[i + 12] = x; tab[i + 13] = y; tab[i + 14] = z; tab[i + 15] = 1;
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    maj(0, 0);
    return { mesh, maj, nombre: nb * 2 };
  }

  // ------------------------------------------------------------------ (étape 75) le NUMÉRO peint sur la tourelle
  // Une petite image : la marque de l'équipe (un chevron pour les Bleus, un triangle pour les Rouges, dans sa couleur),
  // et le numéro du tank en lettres « au pochoir » (avec les petits ponts qui coupent les chiffres), un peu usé.
  function imageNumero(equipe, numero) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d"), E = Tanks.CONFIG.equipes[equipe];
    ctx.fillStyle = E.marque;
    if (/^bleus/.test(equipe)) {
      ctx.beginPath(); ctx.moveTo(14, 96); ctx.lineTo(50, 30); ctx.lineTo(86, 96); ctx.lineTo(70, 96); ctx.lineTo(50, 58); ctx.lineTo(30, 96); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(16, 34); ctx.lineTo(84, 34); ctx.lineTo(50, 96); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(236,232,218,0.95)";
    ctx.font = "bold 78px Impact, 'Arial Black', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(numero, 100, 66);
    ctx.globalCompositeOperation = "destination-out"; // les ponts du pochoir, et l'usure
    ctx.fillStyle = "#000";
    for (let x = 100; x < 250; x += 37) ctx.fillRect(x + 17, 20, 4, 100);
    let etat = numero.charCodeAt(0) * 31 + numero.charCodeAt(1);
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 260; i++) (ctx.globalAlpha = 0.3 + h() * 0.6), ctx.fillRect(h() * 256, h() * 128, 1 + h() * 4, 1 + h() * 3);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // ------------------------------------------------------------------ le tank
  // ✍️ (demande 115) LES TANKS DES ÉDITIONS : une édition d'une autre époque inscrit ses propres modèles (le losange et la
  // « Fourmi » de 1916 : affichage/chars3d-1916.js) ; une fiche de tank avec « modele3d » les prend à la place.
  const MODELES = {};
  const ajouterModele = (id, f) => (MODELES[id] = f);
  function fabriquer(fiche, equipe, numero) {
    if (fiche.modele3d && MODELES[fiche.modele3d]) return MODELES[fiche.modele3d](fiche, equipe, numero, outilsEditions);
    const E = matsEquipe(equipe), P = E.peinture;
    const m = Object.assign(Object.create(materiaux()), { teinte: E.teinte }); // (étape 75 : les petites pièces du tank ont aussi l'usure)
    const T = TYPES[fiche.id] || TYPES.leclerc, F = T.tourelle;
    const L = fiche.longueur, W = fiche.largeur, H = fiche.hauteur, pont = H - T.hT;
    const tw = 0.64, ep = 0.09, zc = W / 2 - tw / 2 - 0.12; // la largeur et l'épaisseur des chenilles, et leur place
    const zJupe = zc + tw / 2 + 0.05, yFlanc = 1.2; // les jupes ; le dessous des flancs de la caisse (au-dessus des chenilles)
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);

    // 1. Le train de roulement : galets, barbotin (à l'arrière), roue folle (à l'avant), rouleaux, et la chenille.
    const xAr = -L / 2 + 0.47, yS = 0.74, rS = 0.32, xAv = L / 2 - 0.42, yI = 0.7, rI = 0.3;
    const rG = T.rG, yG = rG + ep, x0 = xAr + 0.78, x1 = xAv - 0.72;
    const xsGalets = [];
    for (let k = 0; k < T.galets; k++) xsGalets.push(x0 + (k / (T.galets - 1)) * (x1 - x0));
    const xsRouleaux = [];
    for (let k = 0; k < T.rouleaux; k++) xsRouleaux.push(x0 + 0.4 + ((k + 0.5) / T.rouleaux) * (x1 - x0 - 0.8));
    const rR = 0.08, yR = 1.0 - rR;
    const cercles = xsGalets.map((x) => ({ x, y: yG, r: rG })).concat([{ x: xAr, y: yS, r: rS }, { x: xAv, y: yI, r: rI }], xsRouleaux.map((x) => ({ x, y: yR, r: rR })));
    const geoBoucle = geoChenille(cercles, ep, tw);
    const patins = texturePatins();
    const chenilles = [], lesRoues = [], chenillesImages = [];
    for (const cote of [-1, 1]) {
      const mat = new THREE.MeshStandardMaterial({ map: patins.clone(), roughness: 0.82, metalness: 0.45, side: THREE.DoubleSide });
      mat.map.needsUpdate = true;
      const chenille = new THREE.Mesh(geoBoucle, mat);
      chenille.position.z = cote * zc;
      chenille.castShadow = chenille.receiveShadow = true;
      g.add(chenille);
      chenillesImages.push(chenille);
      chenilles.push(mat);
      const ajouterRoue = (geo, x, y, r) => {
        if (!geo.attributes.hauteur) geo.setAttribute("hauteur", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count).fill(y * 0.55), 1)); // (étape 75 : les roues sont boueuses)
        const roue = new THREE.Mesh(geo, m.teinte);
        roue.rotation.x = Math.PI / 2;
        roue.position.set(x, y, cote * zc);
        roue.castShadow = false; // (cachées derrière les jupes : leur ombre ne se verrait pas, on ne la calcule pas)
        roue.receiveShadow = true;
        roue.userData.rayon = r;
        g.add(roue);
        lesRoues.push(roue);
      };
      for (const x of xsGalets) ajouterRoue(geoGalet(rG, tw * 0.82, E, cote), x, yG, rG);
      ajouterRoue(geoBarbotin(rS, tw * 0.9, E, cote), xAr, yS, rS);
      ajouterRoue(geoGalet(rI, tw * 0.78, E, cote, true), xAv, yI, rI);
      for (const x of xsRouleaux) caisse.add(couche(cylindre(rR, rR, tw * 0.5, m.teinte, 10, C.acier), "z", x, yR, cote * zc));
      // les bras de suspension (on les voit sous les jupes) et les garde-boue en caoutchouc à l'avant
      for (const x of xsGalets) caisse.add(tube([x, yG, cote * (zc - tw * 0.45)], [x + 0.35, yG + 0.2, cote * (zc - tw * 0.5 - 0.05)], 0.06, m.teinte, 6, E.vertFonce));
      caisse.add(boite(0.04, 0.5, tw + 0.05, m.teinte, L / 2 + 0.03, yFlanc - 0.18, cote * zc, C.caoutchouc));
    }

    // 2. La caisse : en bas, entre les chenilles (avec le glacis du bas) ; en haut, sur toute la largeur (avec le grand glacis).
    const lBas = 2 * (zc - tw / 2 - 0.03);
    caisse.add(profil([[-L / 2 + 0.05, yFlanc + 0.02], [-L / 2 + 0.05, 0.75], [-L / 2 + 0.38, 0.5], [L / 2 - 1.05, 0.46], [L / 2 - 0.1, yFlanc + 0.02]], lBas, P, 0.05, undefined, 3)); // (étape 75 : des bords arrondis)
    const lHaut = 2 * zJupe - 0.08, xG = L / 2 - T.glacis;
    caisse.add(profil([[-L / 2, yFlanc], [-L / 2, pont - 0.1], [-L / 2 + 0.1, pont], [xG, pont], [L / 2 - 0.08, T.nez], [L / 2, T.nez - 0.1], [L / 2 - 0.04, yFlanc]], lHaut, P, 0.07, undefined, 3));
    const yGlacis = (x) => pont + ((x - xG) / (L / 2 - 0.08 - xG)) * (T.nez - pont); // (la hauteur du glacis à l'abscisse x)
    const penteGlacis = Math.atan2(pont - T.nez, L / 2 - 0.08 - xG);
    // la trappe du pilote (sur le glacis ou juste derrière) et ses 3 périscopes
    const xP = xG + 0.15;
    trappe(caisse, P, m, xP - 0.25, pont, T.pilote, 0.3);
    for (const dz of [-0.22, 0, 0.22]) {
      const peri = boite(0.1, 0.1, 0.17, m.verre, xP + 0.12, yGlacis(xP + 0.12) + 0.05, T.pilote + dz);
      peri.rotation.z = -penteGlacis;
      caisse.add(peri);
      caisse.add(boite(0.14, 0.06, 0.2, m.teinte, xP + 0.12, yGlacis(xP + 0.12) + 0.01, T.pilote + dz, C.noir));
    }
    // les phares (dans leur boîtier, avec une grille de protection) et les feux de position
    for (const cote of [-1, 1]) {
      const z = cote * (zJupe - 0.32), x = L / 2 - 0.42, y = yGlacis(x);
      caisse.add(boite(0.22, 0.2, 0.36, m.teinte, x, y + 0.1, z, C.noir));
      for (const dz of [-0.09, 0.09]) caisse.add(couche(cylindre(0.065, 0.065, 0.03, m.phare, 12), "x", x + 0.12, y + 0.12, z + dz));
      caisse.add(cable([[x - 0.08, y + 0.02, z - 0.22], [x + 0.2, y + 0.25, z - 0.2], [x + 0.2, y + 0.25, z + 0.2], [x - 0.08, y + 0.02, z + 0.22]], 0.015, m.teinte, C.acier, 12)); // la grille
      caisse.add(boite(0.05, 0.06, 0.08, m.teinte, L / 2 - 0.02, T.nez - 0.05, cote * (zJupe - 0.12), C.orange)); // le clignotant
      caisse.add(boite(0.18, 0.12, 0.1, m.teinte, L / 2 - 0.25, 0.92, cote * 0.55, C.acier)); // les crochets de remorquage
      caisse.add(boite(0.2, 0.12, 0.1, m.teinte, -L / 2 - 0.05, 1.0, cote * 0.6, C.acier));
      caisse.add(boite(0.03, 0.1, 0.22, m.teinte, -L / 2 - 0.02, pont - 0.2, cote * (zJupe - 0.2), C.rouge)); // les feux arrière
    }
    // le câble de remorquage, en boucle sur le glacis (Leopard) ou le long de l'arrière
    if (fiche.id === "leopard") {
      const xa = xG + 0.55, xb = L / 2 - 0.35;
      caisse.add(cable([[xa, yGlacis(xa) + 0.04, -1.1], [xb, yGlacis(xb) + 0.04, -0.8], [xb + 0.05, yGlacis(xb + 0.05) + 0.04, 0], [xb, yGlacis(xb) + 0.04, 0.8], [xa, yGlacis(xa) + 0.04, 1.1]], 0.035, m.teinte, C.acier, 30));
    } else {
      for (const cote of [-1, 1]) caisse.add(cable([[-L / 2 + 0.3, pont + 0.04, cote * (zJupe - 0.25)], [-L / 2 + 1.4, pont + 0.04, cote * (zJupe - 0.2)], [-L / 2 + 2.6, pont + 0.04, cote * (zJupe - 0.25)]], 0.035, m.teinte, C.acier, 18));
    }
    // les outils sur les ailes : la pelle, la pioche, la barre à mine
    for (const cote of [-1, 1]) {
      const z = cote * (zJupe - 0.18), xo = 0.4 * cote;
      caisse.add(couche(cylindre(0.025, 0.025, 1.2, m.teinte, 6, C.bois), "x", xo, pont + 0.04, z));
      caisse.add(boite(0.28, 0.025, 0.2, m.teinte, xo + 0.72, pont + 0.03, z, C.acier));
      caisse.add(couche(cylindre(0.02, 0.02, 1.5, m.teinte, 6, C.noir), "x", xo - 0.2, pont + 0.03, z - cote * 0.1));
      for (const dx of [-0.4, 0.4]) caisse.add(boite(0.05, 0.06, 0.16, m.teinte, xo + dx, pont + 0.04, z - cote * 0.05, C.olive)); // les attaches
    }
    // (étape 75) les COFFRES DE RANGEMENT sur les garde-boue (avec leur couvercle, leurs charnières et leurs fermoirs)
    for (const cote of [-1, 1]) {
      const z = cote * (zJupe - 0.32);
      for (const [x, l] of [[-L / 2 + 1.05, 1.25]]) {
        caisse.add(profil([[x - l / 2, pont], [x + l / 2, pont], [x + l / 2, pont + 0.3], [x - l / 2 + 0.04, pont + 0.32]], 0.5, P, 0.02).translateZ(z));
        caisse.add(boite(l + 0.02, 0.03, 0.52, P, x, pont + 0.33, z)); // le couvercle
        for (const dx of [-l / 3, l / 3]) caisse.add(boite(0.06, 0.08, 0.025, m.teinte, x + dx, pont + 0.24, z + cote * 0.26, C.noir)); // les fermoirs
      }
    }
    // les grilles du moteur (à l'arrière du pont) : un fond sombre et des lames
    for (const cote of [-1, 1]) {
      const xg = -L / 2 + 0.95, zg = cote * 0.75;
      caisse.add(boite(1.4, 0.02, 1.0, m.teinte, xg, pont + 0.005, zg, C.noir));
      for (let k = 0; k < 8; k++) caisse.add(boite(0.08, 0.04, 0.96, P, xg - 0.6 + k * 0.172, pont + 0.025, zg));
    }
    caisse.add(boite(0.8, 0.05, 0.6, P, -L / 2 + 2.2, pont + 0.02, 0)); // une trappe de visite du moteur
    for (const [dx, dz] of [[-0.35, -0.25], [-0.35, 0.25], [0.35, -0.25], [0.35, 0.25]]) caisse.add(boite(0.05, 0.03, 0.05, m.teinte, -L / 2 + 2.2 + dx, pont + 0.055, dz, C.acier));
    // la plaque arrière, et les échappements
    caisse.add(boite(0.1, pont - yFlanc - 0.1, lHaut - 0.3, P, -L / 2 - 0.04, (pont + yFlanc) / 2 - 0.05, 0));
    const grilleEchappement = (x, y, z, l, h, larg, axe) => {
      caisse.add(boite(axe === "x" ? 0.06 : larg, h, axe === "x" ? larg : 0.06, m.teinte, x, y, z, C.noir));
      for (let k = 0; k < 6; k++) caisse.add(boite(axe === "x" ? 0.08 : larg - 0.04, 0.025, axe === "x" ? larg - 0.04 : 0.08, m.teinte, x + (axe === "x" ? -0.02 : 0), y - h / 2 + 0.05 + (k * (h - 0.1)) / 5, z + (axe === "x" ? 0 : 0.02 * Math.sign(z)), C.acier));
    };
    if (T.echappement === "arriere") grilleEchappement(-L / 2 - 0.1, pont - 0.3, 0, 0, 0.45, 1.5, "x"); // (la turbine de l'Abrams souffle par l'arrière)
    else if (T.echappement === "gauche") grilleEchappement(-L / 2 - 0.1, pont - 0.32, -0.95, 0, 0.36, 0.7, "x");
    else for (const cote of [-1, 1]) grilleEchappement(-L / 2 - 0.1, pont - 0.32, cote * 1.0, 0, 0.36, 0.55, "x");
    if (T.futs) { // (le Leclerc peut porter deux fûts de carburant en plus, à l'arrière)
      for (const cote of [-1, 1]) {
        caisse.add(couche(cylindre(0.29, 0.29, 0.95, m.teinte, 14, C.fut), "z", -L / 2 - 0.36, pont - 0.15, cote * 0.58));
        for (const dz of [-0.3, 0.3]) caisse.add(couche(cylindre(0.3, 0.3, 0.03, m.teinte, 14, C.noir), "z", -L / 2 - 0.36, pont - 0.15, cote * 0.58 + dz));
      }
      caisse.add(boite(0.12, 0.1, 2.2, m.teinte, -L / 2 - 0.12, pont - 0.42, 0, C.noir)); // leur support
    }
    // 3. Les jupes : des plaques le long des côtés (les deux premières sont un vrai blindage, plus épais).
    const xJ0 = -L / 2 + 0.35, xJ1 = L / 2 - 0.22, nJ = Math.round((xJ1 - xJ0) / 0.95), lJ = (xJ1 - xJ0) / nJ;
    for (const cote of [-1, 1]) {
      for (let k = 0; k < nJ; k++) {
        const avant = k >= nJ - 2, e = avant ? 0.11 : 0.045, xa = xJ0 + k * lJ + 0.015, xb = xJ0 + (k + 1) * lJ - 0.015;
        const bas = avant ? 0.56 : 0.6, hautJ = pont - 0.04;
        const pts = [[xa, bas], [xb, bas], [xb, hautJ], [xa, hautJ]];
        if (k === nJ - 1) pts.splice(1, 1, [xb - 0.25, bas], [xb, bas + 0.32]); // (le nez de la jupe est coupé en biais)
        if (fiche.id === "leopard" && !avant) { // (les jupes du Leopard ont le bas « en vagues »)
          pts.splice(0, 2, [xa, bas]);
          for (let q = 1; q <= 6; q++) pts.splice(q, 0, [xa + ((xb - xa) * q) / 6, bas + (q % 2 ? 0.08 : 0)]);
        }
        const plaque = profil(pts, e, P, 0.012);
        plaque.position.z = cote * (zJupe + e / 2);
        caisse.add(plaque);
        for (const dx of [0.12, lJ / 2, lJ - 0.12]) caisse.add(boite(0.05, 0.05, 0.03, m.teinte, xa + dx, hautJ - 0.08, cote * (zJupe + e + 0.005), C.acier)); // les boulons
        if (!avant && fiche.id !== "leopard") caisse.add(boite(xb - xa, 0.12, 0.02, m.teinte, (xa + xb) / 2, bas - 0.05, cote * (zJupe + e / 2), C.caoutchouc)); // la bavette
      }
    }
    // 4. La tourelle (elle tourne) : sa forme lissée aux faces inclinées, et tout ce qu'il y a dessus.
    const tourelle = new THREE.Group();
    tourelle.position.set(T.xT, 0, 0);
    caisse.add(tourelle);
    const toit = pont + T.hT;
    tourelle.add(cylindre(1.05, 1.1, 0.12, m.teinte, 24, C.noir).translateY(pont + 0.04)); // l'anneau de la tourelle
    tourelle.add(tourelleArrondie(contourComplet(F.bas), contourComplet(F.haut), pont + 0.06, toit, P, 0.14, 0.07)); // (étape 75 : arrondie)
    const zFlanc = (x) => largeurA(F.bas, x), zToit = (x) => largeurA(F.haut, x);
    const avantT = F.haut[2][0]; // (l'avant du toit, à côté du canon)
    if (fiche.id === "leclerc") {
      // le coffre du chargeur automatique fait partie du contour ; dessus : le viseur du tireur, le viseur panoramique du chef
      tourelle.add(boite(0.6, 0.42, 0.5, P, avantT - 0.55, toit + 0.2, -0.72));
      tourelle.add(boite(0.03, 0.26, 0.38, m.verre, avantT - 0.24, toit + 0.24, -0.72));
      tourelle.add(cylindre(0.15, 0.18, 0.4, m.teinte, 12, C.olive).translateX(avantT - 0.9).translateY(toit + 0.2).translateZ(0.8));
      tourelle.add(boite(0.36, 0.3, 0.36, P, avantT - 0.9, toit + 0.52, 0.8));
      tourelle.add(boite(0.03, 0.18, 0.26, m.verre, avantT - 0.71, toit + 0.54, 0.8));
      chef(tourelle, m, -0.45, toit, 0.7);
      trappe(tourelle, P, m, -0.45, toit, -0.7, 0.32);
      mitrailleuse(tourelle, m, -0.1, toit, 0.25, 0.7, false);
      for (const cote of [-1, 1]) fumigenes(tourelle, m, -1.15, toit - 0.02, cote * (zToit(-1.15) - 0.15), cote, 3, 3, false);
      for (const cote of [-1, 1]) tourelle.add(boite(1.2, 0.5, 0.06, P, -2.2, toit - 0.35, cote * (zFlanc(-2.2) + 0.03))); // les coffres sur les flancs
      tourelle.add(couche(cylindre(0.03, 0.03, 0.4, m.teinte, 6, C.noir), "y", -2.6, toit + 0.2, 0.3)); // le capteur de vent
      tourelle.add(boite(0.25, 0.05, 0.05, m.teinte, -2.6, toit + 0.4, 0.3, C.noir));
    } else if (fiche.id === "abrams") {
      // le viseur du tireur (la « niche » à droite), le viseur indépendant du chef, la coupole du chef, la trappe du chargeur
      tourelle.add(boite(0.7, 0.42, 0.55, P, avantT - 0.75, toit + 0.2, 0.75));
      tourelle.add(boite(0.03, 0.26, 0.42, m.verre, avantT - 0.39, toit + 0.22, 0.75));
      for (const s of [-1, 1]) tourelle.add(boite(0.03, 0.3, 0.18, P, avantT - 0.33, toit + 0.22, 0.75 + s * 0.32)); // les volets blindés, ouverts
      tourelle.add(cylindre(0.12, 0.14, 0.4, m.teinte, 10, C.olive).translateX(avantT - 0.95).translateY(toit + 0.2).translateZ(-0.5));
      tourelle.add(boite(0.4, 0.32, 0.36, P, avantT - 0.95, toit + 0.52, -0.5));
      tourelle.add(boite(0.03, 0.18, 0.24, m.verre, avantT - 0.74, toit + 0.54, -0.5));
      tourelle.add(cylindre(0.48, 0.5, 0.22, P, 16).translateX(-0.5).translateY(toit + 0.11).translateZ(0.72)); // la coupole
      for (let k = 0; k < 6; k++) { // ses blocs de vision
        const a = (k / 6) * Math.PI * 2;
        tourelle.add(boite(0.06, 0.08, 0.14, m.verre, -0.5 + Math.cos(a) * 0.49, toit + 0.14, 0.72 + Math.sin(a) * 0.49).rotateY(-a));
      }
      chef(tourelle, m, -0.5, toit + 0.12, 0.72);
      mitrailleuse(tourelle, m, -0.2, toit + 0.15, 0.95, 1.1, true); // la grosse mitrailleuse de 12,7 mm
      trappe(tourelle, P, m, -0.45, toit, -0.75, 0.33);
      mitrailleuse(tourelle, m, -0.1, toit, -1.15, 0.6, false);
      for (const cote of [-1, 1]) fumigenes(tourelle, m, 0.65, toit - 0.12, cote * (zFlanc(0.65) + 0.08), cote, 3, 2, true);
      // le panier à l'arrière de la tourelle, avec les sacs et les caisses de l'équipage
      const xa = -3.08, xb = -3.75, za = 1.35;
      tourelle.add(boite(xa - xb, 0.04, 2 * za, m.teinte, (xa + xb) / 2, toit - 0.5, 0, C.olive));
      tourelle.add(cable([[xa, toit - 0.05, za], [xb, toit - 0.05, za], [xb - 0.02, toit - 0.05, 0], [xb, toit - 0.05, -za], [xa, toit - 0.05, -za]], 0.025, m.teinte, C.olive, 24));
      for (let k = 0; k < 9; k++) {
        const t = k / 8, z = za - t * 2 * za;
        tourelle.add(tube([xb, toit - 0.5, z], [xb, toit - 0.05, z], 0.018, m.teinte, 5, C.olive));
      }
      for (const s of [-1, 1]) tourelle.add(tube([xa, toit - 0.5, s * za], [xb, toit - 0.05, s * za], 0.018, m.teinte, 5, C.olive));
      tourelle.add(boite(0.5, 0.3, 0.7, m.teinte, -3.4, toit - 0.33, 0.5, C.toile));
      tourelle.add(O.piece(new THREE.CapsuleGeometry(0.17, 0.6, 3, 8), m.teinte, -3.4, toit - 0.3, -0.55, C.sable).rotateX(Math.PI / 2));
      tourelle.add(boite(0.4, 0.25, 0.45, m.teinte, -3.4, toit - 0.35, -0.05, C.fut)); // une caisse de munitions
      tourelle.add(couche(cylindre(0.025, 0.025, 0.6, m.teinte, 6, C.noir), "y", -2.7, toit + 0.3, 0)); // le capteur de vent
      tourelle.add(boite(0.05, 0.05, 0.3, m.teinte, -2.7, toit + 0.6, 0, C.noir));
    } else {
      // Leopard 2A6 : le viseur EMES du tireur, le périscope PERI du chef sur son mât, les deux trappes
      tourelle.add(boite(0.75, 0.4, 0.55, P, avantT - 0.75, toit + 0.19, 0.68));
      tourelle.add(boite(0.03, 0.22, 0.4, m.verre, avantT - 0.37, toit + 0.2, 0.68));
      tourelle.add(boite(0.36, 0.06, 0.6, P, avantT - 0.55, toit + 0.42, 0.68)); // le volet du viseur
      tourelle.add(cylindre(0.13, 0.15, 0.5, m.teinte, 12, C.olive).translateX(-0.2).translateY(toit + 0.25).translateZ(0.98));
      tourelle.add(cylindre(0.2, 0.2, 0.28, P, 12).translateX(-0.2).translateY(toit + 0.62).translateZ(0.98));
      tourelle.add(boite(0.03, 0.14, 0.2, m.verre, -0.01, toit + 0.64, 0.98));
      chef(tourelle, m, -0.75, toit, 0.5);
      trappe(tourelle, P, m, -0.75, toit, -0.68, 0.33);
      mitrailleuse(tourelle, m, -0.45, toit, -0.95, 0.6, false);
      for (const cote of [-1, 1]) fumigenes(tourelle, m, -1.25, toit - 0.05, cote * (zToit(-1.25) - 0.1), cote, 4, 2, false);
      for (const cote of [-1, 1]) { // les paniers de rangement à l'arrière des flancs
        const z = cote * (zFlanc(-2.4) + 0.2);
        tourelle.add(boite(0.9, 0.04, 0.38, m.teinte, -2.4, toit - 0.6, z, C.olive));
        tourelle.add(cable([[-1.95, toit - 0.12, cote * (zFlanc(-1.95) + 0.02)], [-1.95, toit - 0.12, z + cote * 0.18], [-2.85, toit - 0.12, z + cote * 0.18], [-2.85, toit - 0.12, cote * (zFlanc(-2.85) + 0.02)]], 0.02, m.teinte, C.olive, 18));
        tourelle.add(boite(0.75, 0.35, 0.3, m.teinte, -2.4, toit - 0.4, z, C.toile));
      }
      tourelle.add(couche(cylindre(0.025, 0.025, 0.5, m.teinte, 6, C.noir), "y", -2.4, toit + 0.25, 0));
      tourelle.add(boite(0.05, 0.05, 0.3, m.teinte, -2.4, toit + 0.5, 0, C.noir));
    }
    // les antennes, et leurs socles
    const xAnt = F.haut[F.haut.length - 2][0] + 0.35;
    for (const cote of [-1, 1]) {
      const za = cote * (zToit(xAnt) - 0.25);
      tourelle.add(cylindre(0.07, 0.09, 0.14, m.teinte, 8, C.noir).translateX(xAnt).translateY(toit + 0.07).translateZ(za));
      tourelle.add(cylindre(0.008, 0.016, 2.4, m.teinte, 4, C.noir).translateX(xAnt).translateY(toit + 1.3).translateZ(za));
    }
    // ✍️ la marque de l'équipe et le NUMÉRO du tank (étape 75) : peints sur chaque flanc de la tourelle (penchés comme lui)
    const xMarque = fiche.id === "abrams" ? -1.0 : -0.75, pente = Math.atan2(zFlanc(xMarque) - zToit(xMarque), T.hT);
    const matNumero = new THREE.MeshStandardMaterial({ map: imageNumero(equipe, numero || "11"), transparent: true, alphaTest: 0.35, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    for (const cote of [-1, 1]) {
      const plaque = O.piece(new THREE.PlaneGeometry(1.3, 0.65), matNumero, xMarque, pont + T.hT * 0.5, cote * ((zFlanc(xMarque) + zToit(xMarque)) / 2 + 0.012));
      plaque.rotation.set(-pente, cote > 0 ? 0 : Math.PI, 0, "YXZ");
      plaque.castShadow = false;
      tourelle.add(plaque);
    }
    // … et une flèche sur le toit (pour les avions… et pour toi, d'en haut)
    const fleche = O.piece(new THREE.CircleGeometry(0.45, 3), E.marque, -1.45, toit + 0.012, 0);
    fleche.rotation.x = -Math.PI / 2;
    fleche.castShadow = false;
    tourelle.add(fleche);

    // 5. Le canon (il monte et descend) : le masque, le tube qui s'amincit, les manchons thermiques, le bout.
    const canon = new THREE.Group();
    canon.position.set(F.pivot, pont + F.yPivot, 0);
    tourelle.add(canon);
    const Lc = fiche.canon;
    if (fiche.id === "abrams") {
      canon.add(boite(0.35, 0.62, 1.05, P, 0.12, 0, 0)); // le masque large et plat
      canon.add(boite(0.06, 0.08, 0.08, m.teinte, 0.31, -0.05, 0.38, C.noir)); // la mitrailleuse coaxiale
    } else if (fiche.id === "leopard") {
      canon.add(profil([[-0.1, -0.3], [0.38, -0.22], [0.42, 0.18], [-0.1, 0.32]], 0.66, P, 0.03));
      canon.add(boite(0.06, 0.08, 0.08, m.teinte, 0.42, -0.08, -0.25, C.noir));
    } else {
      canon.add(boite(0.4, 0.56, 0.62, P, 0.1, 0, 0));
      canon.add(boite(0.06, 0.08, 0.08, m.teinte, 0.31, -0.1, 0.24, C.noir));
    }
    const x0c = 0.3, bout = x0c + Lc;
    canon.add(couche(cylindre(0.085, 0.115, Lc, m.teinte, 22, E.vertFonce), "x", x0c + Lc / 2, 0, 0)); // le tube (plus fin au bout)
    canon.add(couche(cylindre(0.19, 0.19, 0.32, P, 14), "x", x0c + 0.16, 0, 0)); // la bague à la sortie du masque
    const manchons = fiche.id === "leclerc" ? [[0.05, 0.36], [0.4, 0.68], [0.72, 0.94]] : [[0.05, 0.3], [0.58, 0.78], [0.8, 0.95]];
    for (const [a, b] of manchons) {
      const r = 0.135 - a * 0.03;
      canon.add(couche(cylindre(r, r, (b - a) * Lc, P, 22), "x", x0c + ((a + b) / 2) * Lc, 0, 0));
      for (const t of [a, b]) canon.add(couche(cylindre(r + 0.012, r + 0.012, 0.05, m.teinte, 14, C.noir), "x", x0c + t * Lc, 0, 0)); // les colliers
    }
    if (fiche.id !== "leclerc") { // l'évacuateur de fumée : le renflement du tube
      const xe = x0c + 0.44 * Lc;
      canon.add(couche(cylindre(0.17, 0.17, 0.7, P, 22), "x", xe, 0, 0));
      for (const s of [-1, 1]) canon.add(couche(cylindre(0.13, 0.17, 0.12, P, 16), "x", xe + s * 0.41, 0, 0).rotateZ(s > 0 ? Math.PI : 0));
    }
    canon.add(couche(cylindre(0.11, 0.11, 0.18, m.teinte, 14, C.noir), "x", bout - 0.09, 0, 0)); // la bouche
    canon.add(boite(0.14, 0.08, 0.08, m.teinte, bout - 0.2, 0.15, 0, C.noir)); // le capteur de bouche (il mesure si le tube se tord)
    // (étape 75) des MAILLONS DE RECHANGE accrochés (sur le glacis du Leclerc et de l'Abrams, sur les flancs de la tourelle du Leopard)
    const gm = geoMaillon(tw);
    const rechange = (groupe, x, y, z, rz) => { const p = O.piece(gm.clone(), m.maillon, x, y, z); p.rotation.set(0, 0, rz || 0); groupe.add(p); };
    for (const cote of [-1, 1]) for (let k = 0; k < 3; k++) { const x = L / 2 - 0.55 - k * 0.17; rechange(caisse, x, yGlacis(x) + 0.06, cote * (zJupe - 0.62), -penteGlacis); }
    // (étape 75) des jerricans à l'arrière (dans leurs supports)
    for (const cote of fiche.id === "leclerc" ? [] : [-1, 1]) {
      const z = cote * (zJupe - 0.45);
      caisse.add(boite(0.18, 0.45, 0.34, m.teinte, -L / 2 - 0.12, pont - 0.32, z, C.fut));
      caisse.add(boite(0.05, 0.05, 0.12, m.teinte, -L / 2 - 0.12, pont - 0.07, z, C.noir));
      caisse.add(boite(0.21, 0.04, 0.38, m.teinte, -L / 2 - 0.12, pont - 0.56, z, C.noir));
    }
    hauteurs(souder(canon), pont + F.yPivot); // (étape 75 : la hauteur de chaque point, pour la boue)
    hauteurs(souder(tourelle), 0);
    hauteurs(souder(caisse), 0);
    const rouesFixes = rouesSoudees(lesRoues, m.teinte);
    g.add(rouesFixes);
    // (étape 75) les maillons en 3D (de près) : la chenille « image » est montrée de loin seulement
    const lesMaillons = maillons(cercles, ep, tw, zc);
    lesMaillons.mesh.visible = false; // (la scène les montre quand le tank est près de la caméra)
    g.add(lesMaillons.mesh);
    return { g, caisse, tourelle, canon, roues: lesRoues, rouesFixes, chenilles, chenillesImages, maillons: lesMaillons, bouche: bout, peinture: P, pasChenille: 1 / PAS_TOILE };
  }

  // (étape 72) ✍️ « Ça rame. » Chaque roue d'un tank est un objet à part (pour pouvoir la faire tourner) : 18 roues =
  // 18 dessins par tank. De loin, on ne voit pas une roue tourner ! Alors on prépare aussi une copie de TOUTES les roues
  // soudées en UNE pièce (qui ne tourne pas). Loin de la caméra, la scène montre la pièce soudée et cache les 18 roues.
  function rouesSoudees(roues, matiere) {
    const morceaux = roues.map((r) => {
      r.updateMatrix();
      const g = r.geometry.index ? r.geometry.toNonIndexed() : r.geometry.clone();
      return g.applyMatrix4(r.matrix);
    });
    const geo = new THREE.BufferGeometry();
    for (const nom of ["position", "normal", "uv", "color", "hauteur"]) {
      if (!morceaux.every((g) => g.attributes[nom])) continue;
      const taille = morceaux[0].attributes[nom].itemSize, tab = new Float32Array(morceaux.reduce((t, g) => t + g.attributes[nom].count * taille, 0));
      let k = 0;
      for (const g of morceaux) (tab.set(g.attributes[nom].array.subarray(0, g.attributes[nom].count * taille), k), (k += g.attributes[nom].count * taille));
      geo.setAttribute(nom, new THREE.BufferAttribute(tab, taille));
    }
    for (const g of morceaux) g.dispose();
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, matiere);
    m.receiveShadow = true;
    m.visible = false;
    return m;
  }

  // Un tank détruit : tout devient noir et brûlé, la tourelle est soufflée de travers.
  function bruler(o) {
    const m = materiaux();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
    o.tourelle.rotation.z = 0.12;
    o.tourelle.position.y = 0.25;
    o.canon.rotation.z = -0.15;
  }

  const outilsEditions = { matsEquipe, materiaux, texturePatins, camouflage, usure, geoGalet, hauteurs, imageNumero, rouesSoudees }; // (demande 115 : prêtés aux tanks des éditions)
  return { fabriquer, bruler, camouflage, materiaux, C, ajouterModele, outils: outilsEditions };
})();
