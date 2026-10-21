// 🧵 LES UNIFORMES : le tailleur des soldats (demande 92, « le réalisme total »)
//
// ✍️ Maxance : « Absolument tout doit être très réaliste : le soldat… » Le tailleur fabrique (une seule fois, au
// premier soldat) les TISSUS du soldat, peints point par point avec du « bruit » (comme les nuages : des taches au
// hasard, mais douces) :
//   - le CAMOUFLAGE de chaque équipe : ✍️ les Bleus en « woodland » (les taches vertes, brunes et noires des forêts),
//     les Rouges en « désert » (des taches sable, brunes et claires) ;
//   - le TISSU lui-même : un tissage en biais, un petit quadrillage « ripstop » (le fil plus solide des vrais treillis,
//     qui empêche une déchirure de s'agrandir), des PLIS, de l'usure (plus clair) et des petites taches de saleté ;
//   - l'ÉQUIPEMENT : le nylon épais du gilet avec ses rangées de SANGLES « MOLLE » (pour accrocher les poches), le grain
//     du cuir des bottes et des gants, les pores de la peau.
// Chaque image a aussi une HAUTEUR (les plis, les sangles qui dépassent) : le « peintre » de la carte graphique s'en
// sert pour faire accrocher la lumière (un pli éclairé d'un côté, dans l'ombre de l'autre), comme une vraie bosse.
// L'astuce « triplanaire » : au lieu de coller l'image comme une étiquette (elle serait étirée sur les bras ronds), on la
// projette comme 3 projecteurs de cinéma (de face, de côté, d'en haut) et on mélange : le motif garde partout la même
// taille. Et il est projeté sur le soldat « au garde-à-vous » : quand il bouge, le motif suit le tissu.
// Le peintre ajoute encore : le FILET sur le casque, les COUTURES sur les côtés (avec leurs points), la BOUE sur le bas
// des jambes et les genoux, et une peau un peu plus douce et plus chaude que le tissu.
// Comme tout l'affichage, il ne touche jamais au monde : il habille seulement.

window.Tanks = window.Tanks || {};

Tanks.Uniformes = (function () {
  const U = () => Tanks.CONFIG.realisme.soldats.uniformes;
  const bilan = { tissus: 0, pointsTissu: 0, pointsEquipement: 0, ms: 0 };

  // Un « bruit » qui se RÉPÈTE parfaitement (periode cases par image) : le bord droit de l'image recolle au bord gauche.
  function bruitTuile(graine, px, py) {
    py = py || px;
    const h = (i, j) => {
      let k = (((i % px) + px) % px) * 374761393 + (((j % py) + py) % py) * 668265263 + graine * 2147483647;
      k = Math.imul(k ^ (k >>> 13), 1274126177);
      return ((k ^ (k >>> 16)) >>> 0) / 4294967296;
    };
    return (u, v) => { // u, v de 0 à 1
      const x = u * px, y = v * py, i = Math.floor(x), j = Math.floor(y);
      let fx = x - i, fy = y - j;
      fx = fx * fx * (3 - 2 * fx);
      fy = fy * fy * (3 - 2 * fy);
      const a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }
  // Plusieurs bruits de plus en plus fins (« fractal »), toujours répétables.
  function fractal(graine, px, py, octaves) {
    const b = [];
    for (let k = 0; k < octaves; k++) b.push(bruitTuile(graine + k * 31, px << k, (py || px) << k));
    return (u, v) => {
      let t = 0, a = 0.5, s = 0;
      for (let k = 0; k < octaves; k++) (t += b[k](u, v) * a), (s += a), (a *= 0.5);
      return t / s;
    };
  }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  function texture(data, taille, couleur) {
    const t = new THREE.DataTexture(data, taille, taille, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    if (couleur) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  // ------------------------------------------------------------------ LE TISSU CAMOUFLÉ (512 × 512, la hauteur dans « a »)
  const tissus = {};
  function tissu(equipe) {
    if (tissus[equipe]) return tissus[equipe];
    const t0 = performance.now(), P = U()[equipe] || U().bleus, N = 512, B = 256, desert = equipe === "rouges";
    // 1. Les grandes formes, calculées sur une image plus petite (256 × 256) : le motif, les plis, l'usure.
    const deforme = fractal(desert ? 91 : 81, 3, 3, 2), n1 = fractal(desert ? 92 : 82, 4, 4, 3), n2 = fractal(desert ? 93 : 83, 4, 4, 3), n3 = fractal(desert ? 94 : 84, 5, 5, 3), n4 = fractal(85, 3, 3, 2);
    const plis = fractal(86, 3, 12, 3), plis2 = fractal(87, 2, 7, 2), usure = fractal(88, 2, 2, 3);
    const motif = new Uint8Array(B * B), pli = new Float32Array(B * B), use = new Float32Array(B * B);
    for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) {
      const u = i / B, v = j / B, k = j * B + i;
      const du = (deforme(u, v) - 0.5) * 0.09, dv = (deforme(u + 0.37, v + 0.61) - 0.5) * 0.09; // (les bords des taches ondulent)
      let m = 0;
      if (desert) {
        if (n1(u + du, v + dv) > 0.54) m = 1; // les grandes taches brunes
        if (n2(u - dv, v + du) > 0.6) m = 2; // le gris-vert
        if (n3(u + du * 2, v * 1.0 + dv) > 0.62 && n4(u, v) > 0.45) m = 3; // les traînées claires
      } else {
        if (n1(u + du, v + dv) > 0.5) m = 1; // le vert
        if (n2(u - dv, v + du) > 0.57) m = 2; // le brun
        const b = n3(u + du * 1.5, v + dv * 1.5);
        if (Math.abs(b - 0.5) < 0.03 && n4(u, v) > 0.42) m = 3; // les « branches » noires, fines
      }
      motif[k] = m;
      // les plis : des crêtes allongées (de travers sur les manches et les jambes), un peu cassées
      const r = 1 - Math.abs(plis(u + du, v) * 2 - 1), r2 = 1 - Math.abs(plis2(u, v + dv) * 2 - 1);
      pli[k] = Math.pow(r, 4) * 0.75 + Math.pow(r2, 5) * 0.45;
      use[k] = usure(u, v);
    }
    const lit = (tab, x, y) => { // lecture douce (bilinéaire) dans les petites images, en recollant les bords
      const fx = x * B - 0.5, fy = y * B - 0.5, i = Math.floor(fx), j = Math.floor(fy), ax = fx - i, ay = fy - j;
      const g = (a, b) => tab[(((b % B) + B) % B) * B + (((a % B) + B) % B)];
      return (g(i, j) * (1 - ax) + g(i + 1, j) * ax) * (1 - ay) + (g(i, j + 1) * (1 - ax) + g(i + 1, j + 1) * ax) * ay;
    };
    // 2. Chaque point de la grande image : la couleur du motif, le tissage, le ripstop, les plis, l'usure, la saleté.
    const couleurs = [hex(P.fond)].concat(P.taches.map(hex)), data = new Uint8Array(N * N * 4);
    const pasRip = Math.max(3, Math.round((U().ripstop / U().motif) * N)), F = U().plis;
    let etat = desert ? 17 : 7;
    const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, c = couleurs[motif[(Math.floor(v * B) % B) * B + (Math.floor(u * B) % B)]];
      const p = lit(pli, u, v) * F, w = lit(use, u, v);
      const twill = (x + y) % 4 < 2 ? -0.035 : 0.02; // le tissage en biais
      const rip = x % pasRip === 0 || y % pasRip === 0 ? 0.05 : 0; // le quadrillage ripstop (un fil plus épais, plus clair)
      let l = 1 + twill + rip + (hasard() - 0.5) * 0.07;
      l *= 0.8 + 0.42 * (1 - p); // (dans le creux d'un pli, c'est plus sombre ; la crête est éclairée)
      const delave = Math.max(0, w - 0.58) * 1.4; // l'usure : délavé (plus clair, moins coloré)
      let r = c[0] * l, g = c[1] * l, b = c[2] * l;
      const gris = (r + g + b) / 3;
      r += (gris * 1.12 - r) * delave;
      g += (gris * 1.1 - g) * delave;
      b += (gris * 1.05 - b) * delave;
      if (hasard() < 0.0025) (r *= 0.6), (g *= 0.55), (b *= 0.5); // une petite tache de saleté
      const k = (y * N + x) * 4;
      data[k] = Math.min(255, r);
      data[k + 1] = Math.min(255, g);
      data[k + 2] = Math.min(255, b);
      data[k + 3] = Math.max(0, Math.min(255, (0.5 + (0.5 - p) * 0.7 + rip * 2 + twill) * 255)); // la hauteur
    }
    bilan.tissus++;
    bilan.pointsTissu = N;
    bilan.ms += performance.now() - t0;
    return (tissus[equipe] = texture(data, N, true));
  }

  // ------------------------------------------------------------------ L'ÉQUIPEMENT (256 × 256, 0,23 m)
  //   r : la couleur du nylon (128 = ne change rien), avec les sangles MOLLE et leurs coutures ; g : leur hauteur ;
  //   b : le grain du cuir et du caoutchouc ; a : les pores de la peau.
  let equipement = null;
  function texEquipement() {
    if (equipement) return equipement;
    const N = 256, data = new Uint8Array(N * N * 4), grain = fractal(95, 32, 32, 2), pores = fractal(96, 64, 64, 1), cordura = fractal(97, 64, 64, 1);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const u = x / N, v = y / N, k = (y * N + x) * 4;
      // 6 rangées de sangles (25 mm de large, tous les 38 mm), cousues tous les 38 mm (les « bar-tacks »)
      const fv = (v * 6) % 1, fu = (u * 6) % 1, sangle = fv > 0.17 && fv < 0.83;
      const bord = sangle ? Math.min(fv - 0.17, 0.83 - fv) : 0, couture = sangle && Math.abs(fu - 0.5) < 0.025;
      let r = 128 * (0.93 + cordura(u, v) * 0.14);
      if (!sangle) r *= 0.9; // entre les sangles, au fond (dans l'ombre)
      if (sangle && bord < 0.03) r *= 0.88; // le bord de la sangle
      if (couture) r *= 0.9;
      data[k] = r;
      data[k + 1] = (sangle ? 0.5 + Math.min(1, bord * 14) * 0.4 - (couture ? 0.12 : 0) : 0.25) * 255;
      data[k + 2] = (0.35 + grain(u, v) * 0.6) * 255;
      data[k + 3] = (0.3 + pores(u, v) * 0.5) * 255;
    }
    bilan.pointsEquipement = N;
    return (equipement = texture(data, N, false));
  }

  // ------------------------------------------------------------------ LE PEINTRE DE LA CARTE GRAPHIQUE
  // sorte = "tenue" (le tissu camouflé) ou "teinte" (tout le reste : les couleurs sont dans les sommets, et chaque
  // sommet dit sa MATIÈRE : 1 = la peau, 2 = le gilet et ses sangles MOLLE, 3 = le cuir et le caoutchouc, 4 = le nylon
  // uni (le sac, les poches), 0 = le reste).
  const GLSL_COMMUN = [
    "uniform sampler2D tissuTex; uniform sampler2D equipTex; uniform vec4 tissuReglages;",
    "varying vec3 vPosB; varying vec3 vNorB; varying float vMatiere;",
    "float hTissu = 0.5; float peau = 0.0;",
    "vec4 triplan(sampler2D t, vec3 p, vec3 n) {",
    "  vec3 w = pow(abs(n), vec3(4.0)); w /= (w.x + w.y + w.z + 1e-5);",
    "  return texture2D(t, p.zy) * w.x + texture2D(t, p.xz) * w.y + texture2D(t, p.xy) * w.z;",
    "}",
    "float h31(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }",
    "float bruit3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),",
    "             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }",
    "vec3 bosseTissu(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDir) {", // (la même recette que la « bumpMap » de three.js)
    "  vec3 vSigmaX = normalize(dFdx(surf_pos)); vec3 vSigmaY = normalize(dFdy(surf_pos));",
    "  vec3 R1 = cross(vSigmaY, surf_norm); vec3 R2 = cross(surf_norm, vSigmaX);",
    "  float fDet = dot(vSigmaX, R1) * faceDir; vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);",
    "  return normalize(abs(fDet) * surf_norm - vGrad);",
    "}",
  ].join("\n");
  // La boue : en bas des jambes (sous « boue » m) et sur les genoux, en taches.
  const GLSL_BOUE = [
    "  float tache = bruit3(vPosB * 9.0) * 0.65 + bruit3(vPosB * 31.0) * 0.35;",
    "  float boue = (1.0 - smoothstep(0.06, tissuReglages.z, vPosB.y)) * smoothstep(0.35, 0.7, tache + 0.25 * (1.0 - vPosB.y / tissuReglages.z));",
    "  boue = max(boue, smoothstep(0.55, 0.8, tache) * step(0.36, vPosB.y) * step(vPosB.y, 0.56) * smoothstep(0.2, 0.6, vNorB.x) * 0.8);",
    "  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.12, 0.08), boue * 0.7);",
    "  hTissu = mix(hTissu, 0.5 + (tache - 0.5) * 0.6, boue);",
  ].join("\n");

  function habiller(mat, sorte, equipe) {
    const R = U(), tenue = sorte === "tenue";
    const uniformes = {
      tissuTex: { value: tenue ? tissu(equipe) : texEquipement() },
      equipTex: { value: texEquipement() },
      tissuReglages: { value: new THREE.Vector4(1 / R.motif, R.plis, R.boue, R.relief) },
    };
    mat.userData.tailleur = sorte;
    mat.customProgramCacheKey = () => "uniforme-" + sorte;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniformes);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vPosB; varying vec3 vNorB; varying float vMatiere;\n" + (tenue ? "" : "attribute float matiere;"))
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPosB = position; vNorB = normal; vMatiere = " + (tenue ? "0.0" : "matiere") + ";");
      const couleur = tenue ? [
        "{",
        "  vec4 tis = triplan(tissuTex, vPosB * tissuReglages.x, vNorB);",
        "  diffuseColor.rgb = tis.rgb;",
        "  hTissu = tis.a;",
        // le FILET du casque (au-dessus de 1,65 m, il n'y a que le casque) : des mailles en losange
        "  float casque = smoothstep(1.64, 1.67, vPosB.y);",
        "  vec2 q = vec2(vPosB.x + vPosB.z + vPosB.y * 0.6, vPosB.x - vPosB.z + vPosB.y * 0.6) * 48.0;",
        "  float maille = 1.0 - smoothstep(0.04, 0.11, min(abs(fract(q.x) - 0.5), abs(fract(q.y) - 0.5)));",
        "  diffuseColor.rgb *= 1.0 - maille * casque * 0.45;",
        "  hTissu = mix(hTissu, 0.85, maille * casque);",
        // les COUTURES sur les côtés (là où le tissu tourne vers l'arrière), avec leurs points
        "  float cote = (1.0 - smoothstep(0.0, 0.05, abs(vNorB.x))) * (1.0 - smoothstep(0.4, 0.6, abs(vNorB.y))) * (1.0 - casque);",
        "  float points = step(0.45, fract(vPosB.y * 110.0));",
        "  diffuseColor.rgb *= 1.0 - cote * (0.22 + points * 0.12);",
        "  hTissu -= cote * 0.25;",
        GLSL_BOUE,
        "}",
      ] : [
        "{",
        "  vec4 eq = triplan(equipTex, vPosB * 4.4, vNorB);",
        "  float m = vMatiere;",
        "  peau = 1.0 - step(0.5, abs(m - 1.0));",
        "  float molle = 1.0 - step(0.5, abs(m - 2.0)), nylon = 1.0 - step(0.5, abs(m - 4.0)), cuir = 1.0 - step(0.5, abs(m - 3.0));",
        "  diffuseColor.rgb *= mix(1.0, eq.r * 2.0, molle) * mix(1.0, 0.9 + eq.b * 0.2, nylon + cuir) * mix(1.0, 0.95 + eq.a * 0.1, peau);",
        "  hTissu = 0.5 + molle * (eq.g - 0.5) + (cuir + nylon * 0.5) * (eq.b - 0.5) * 0.6 + peau * (eq.a - 0.5) * 0.25;",
        "  if (peau < 0.5) {",
        GLSL_BOUE,
        "  }",
        "}",
      ];
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\n" + GLSL_COMMUN)
        .replace("#include <color_fragment>", "#include <color_fragment>\n" + couleur.join("\n"))
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\nnormal = bosseTissu(-vViewPosition, normal, vec2(dFdx(hTissu), dFdy(hTissu)) * tissuReglages.w, faceDirection);")
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.5, peau);")
        // la PEAU : un peu plus chaude, et la lumière qui la traverse au bord (les oreilles, le nez : rosé)
        .replace("#include <opaque_fragment>", "outgoingLight += peau * diffuseColor.rgb * vec3(0.16, 0.05, 0.03) * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0);\n#include <opaque_fragment>");
    };
    return mat;
  }

  return { habiller, tissu, texEquipement, bilan };
})();
