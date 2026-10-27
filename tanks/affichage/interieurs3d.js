// 🛋️ LES INTÉRIEURS EN 3D : le décorateur d'intérieur (livre de demandes n° 8)
//
// ✍️ « Pouvoir entrer dans les maisons. » Ce peintre lit le PLAN de chaque maison (logique/interieurs.js) et le meuble :
// le parquet, le plafond, l'escalier (des marches), le garde-corps, la cloison, la table et ses chaises, l'étagère et ses
// livres, le canapé, le buffet, le frigo, le lit, l'armoire, le bureau, les tapis, les lampes…
// Pour que le jeu ne rame pas (✍️ Maxance déteste le lag) :
//   - TOUT l'intérieur d'une maison est recollé en UN seul objet, dessiné en UN coup (chaque sommet dit s'il a le grain
//     du bois et s'il « brille », comme les abat-jour) ;
//   - un intérieur n'est FABRIQUÉ que si la caméra est à moins de « interieurs » m (le niveau de qualité : 15 à 60 m),
//     au plus 2 maisons par image (pas d'à-coup), et il est JETÉ quand la caméra s'éloigne ;
//   - AUCUNE vraie lampe (ça coûte cher pour chaque point de l'écran) : la pénombre est PEINTE dans les couleurs
//     (« sombre » : × 0,62), et les abat-jour sont dessinés sans ombre ni lumière, comme s'ils brillaient ;
//   - les PORTES de toutes les maisons sont UNE seule forme dessinée à des dizaines d'endroits (des « instances ») :
//     1 dessin pour toutes, tournées selon leur ouverture.
// Comme tout l'affichage, ce fichier LIT le monde et ne le change jamais.

window.Tanks = window.Tanks || {};

Tanks.Interieurs3D = (function () {
  const C = Tanks.CONFIG, I = C.interieurs;
  const IN = () => Tanks.Interieurs;
  const bilan = { construits: 0, visibles: 0, triangles: 0, dessins: 0, fabriques: 0, jetes: 0, msFabrique: 0, msDernier: 0, portes: 0, portesBougees: 0, distance: 0 };
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const fois = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  let groupe = null, mats = null, portesIM = null; // (mats : la matière unique des intérieurs)
  const faits = new Map(); // maison → { mesh, triangles }

  // ------------------------------------------------------------------ les images et les matières
  function planches() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    let g = 97;
    const h = () => ((g = (g * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 8; i++) { // 8 lames de parquet, chacune un peu différente, avec ses veines
      const v = 0.82 + h() * 0.3;
      ctx.fillStyle = "rgb(" + Math.floor(200 * v) + "," + Math.floor(196 * v) + "," + Math.floor(188 * v) + ")";
      ctx.fillRect(0, i * 32, 256, 32);
      for (let k = 0; k < 14; k++) {
        ctx.fillStyle = "rgba(60,45,30," + (0.05 + h() * 0.08) + ")";
        ctx.fillRect(0, i * 32 + h() * 32, 256, 1 + h() * 1.5);
      }
      ctx.fillStyle = "rgba(30,20,10,0.55)";
      ctx.fillRect(0, i * 32, 256, 2);
      ctx.fillRect(Math.floor(h() * 256), i * 32, 2, 32);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function construire(g) {
    groupe = g;
    // UNE seule matière pour tout l'intérieur (1 dessin par maison) : chaque sommet dit s'il a le GRAIN du bois (l'image
    // des planches) et s'il BRILLE (les abat-jour : leur couleur est ajoutée comme une lumière propre, sans vraie lampe)
    const mat = new THREE.MeshStandardMaterial({ map: planches(), vertexColors: true, roughness: 0.8 });
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float grain;\nattribute float lueur;\nvarying float vGrain;\nvarying float vLueur;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGrain = grain;\nvLueur = lueur;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vGrain;\nvarying float vLueur;")
        .replace("#include <map_fragment>", "#ifdef USE_MAP\nvec4 texelGrain = texture2D( map, vMapUv );\ndiffuseColor *= mix( vec4( 1.0 ), texelGrain, vGrain );\n#endif")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * vLueur;");
    };
    mat.customProgramCacheKey = () => "interieur";
    mats = mat;
    // un tout petit modèle caché, pour que le programme de dessin des intérieurs soit préparé AVEC les autres au début de
    // la bataille (demande 96 : sinon, petit à-coup la première fois qu'on s'approche d'une maison)
    const mini = new THREE.BufferGeometry();
    for (const [nom, n] of [["position", 3], ["normal", 3], ["uv", 2], ["color", 3], ["grain", 1], ["lueur", 1]]) mini.setAttribute(nom, new THREE.BufferAttribute(new Float32Array(3 * n).fill(nom === "normal" ? 1 : 0), n));
    const modele = new THREE.Mesh(mini, mats);
    modele.visible = false;
    modele.receiveShadow = true;
    modele.frustumCulled = false;
    groupe.add(modele);
    // les PORTES : une planche (avec ses panneaux en relief et sa poignée) dont la charnière est à x = 0
    const P = I.porte, larg = P.largeur - 0.04, haut = 2.2, geos = [];
    const boiteGeo = (l, h, e, x, y, z) => new THREE.BoxGeometry(l, h, e).translate(x, y, z);
    geos.push(boiteGeo(larg, haut, 0.06, larg / 2, haut / 2, 0));
    for (const [y0, y1] of [[0.22, 1.0], [1.18, haut - 0.18]]) geos.push(boiteGeo(larg - 0.24, y1 - y0, 0.09, larg / 2, (y0 + y1) / 2, 0));
    geos.push(boiteGeo(0.06, 0.06, 0.2, larg - 0.12, 1.02, 0));
    const geo = fusionner(geos);
    portesIM = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.75 }), Math.max(1, IN().maisons.length));
    portesIM.castShadow = true;
    portesIM.receiveShadow = true;
    const COULEURS = ["#5a3d27", "#3f5a3a", "#6e2f25", "#4a3a2c", "#2f4a5e", "#7a5a3c"].map((h) => new THREE.Color(h));
    IN().maisons.forEach((b, i) => portesIM.setColorAt(i, COULEURS[(b.graine || i) % COULEURS.length]));
    portesIM.count = IN().maisons.length;
    groupe.add(portesIM);
    bilan.portes = IN().maisons.length;
    majPortes(true);
  }
  // recoller plusieurs formes simples (position + normale) en une seule
  function fusionner(liste) {
    let n = 0, ni = 0;
    for (const g of liste) (n += g.attributes.position.count), (ni += g.index.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), idx = new Uint16Array(ni);
    let o = 0, oi = 0;
    for (const g of liste) {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + o;
      o += g.attributes.position.count;
      oi += g.index.count;
    }
    const r = new THREE.BufferGeometry();
    r.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    r.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    r.setIndex(new THREE.BufferAttribute(idx, 1));
    return r;
  }

  // ------------------------------------------------------------------ les portes (chaque image)
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), axeY = new THREE.Vector3(0, 1, 0);
  function majPortes(tout) {
    let change = false, bougees = 0;
    IN().maisons.forEach((b, i) => {
      const po = b.porte, tombee = b.morceaux[po.k].tombe, cle = tombee ? -1 : Math.round(po.ouverture * 50);
      if (!tout && po.vue === cle) return;
      po.vue = cle; // (la dernière ouverture dessinée : on ne recalcule que les portes qui bougent)
      const c = Math.cos(b.angle), s = Math.sin(b.angle), u = po.trou.a0 + 0.02, v = b.demiP - b.ep / 2 + 0.06;
      p4.set(b.x + u * c - v * s, b.sol + 0.02, b.z + u * s + v * c);
      q4.setFromAxisAngle(axeY, -b.angle + po.ouverture * 1.65); // (elle s'ouvre vers l'intérieur, de 95°)
      s4.setScalar(tombee ? 0 : 1);
      portesIM.setMatrixAt(i, m4.compose(p4, q4, s4));
      change = true;
      if (po.ouverture > 0) bougees++;
    });
    if (change) (portesIM.instanceMatrix.needsUpdate = true), portesIM.computeBoundingSphere();
    bilan.portesBougees = bougees;
  }

  // ------------------------------------------------------------------ fabriquer l'intérieur d'une maison
  // Les sommets de 3 « lots » (bois, uni, lampe), dans le repère de la maison puis tournés et posés dans le monde.
  function fabriquer(b) {
    const debut = performance.now();
    const P = b.plan, S = I.sombre, cs = Math.cos(b.angle), sn = Math.sin(b.angle);
    const lots = [0, 1, 2, 3].map(() => ({ pos: [], nor: [], uv: [], col: [], idx: [] })); // bois, uni, lampes, plafonds
    const quad = (L, a, b2, c, d, n, uv, col) => {
      const o = L.pos.length / 3, p = [a, b2, c, d];
      for (let i = 0; i < 4; i++) {
        const [u, y, v] = p[i];
        L.pos.push(b.x + u * cs - v * sn, b.sol + y, b.z + u * sn + v * cs);
        L.nor.push(n[0] * cs - n[2] * sn, n[1], n[0] * sn + n[2] * cs);
        L.uv.push(uv[i * 2], uv[i * 2 + 1]);
        L.col.push(col[0], col[1], col[2]);
      }
      const ux = b2[0] - a[0], uy = b2[1] - a[1], uz = b2[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) L.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
      else L.idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
    };
    // une boîte (u, y, v) ; « faces » : quelles faces (par défaut toutes sauf le dessous) ; « lot » 0, 1, 2 ; couleur
    // (l'image des planches est posée à l'échelle : 1 répétition = 2 m)
    const boite = (u0, u1, y0, y1, v0, v1, lot, col, sansDessous, dessusSeul) => {
      const L = lots[lot], c = lot === 2 ? col : fois(col, S), k = 0.5;
      quad(L, [u0, y1, v0], [u1, y1, v0], [u1, y1, v1], [u0, y1, v1], [0, 1, 0], [u0 * k, v0 * k, u1 * k, v0 * k, u1 * k, v1 * k, u0 * k, v1 * k], c);
      if (dessusSeul) return;
      const cc = fois(c, 0.86);
      quad(L, [u0, y0, v1], [u1, y0, v1], [u1, y1, v1], [u0, y1, v1], [0, 0, 1], [u0 * k, y0 * k, u1 * k, y0 * k, u1 * k, y1 * k, u0 * k, y1 * k], cc);
      quad(L, [u0, y0, v0], [u1, y0, v0], [u1, y1, v0], [u0, y1, v0], [0, 0, -1], [u0 * k, y0 * k, u1 * k, y0 * k, u1 * k, y1 * k, u0 * k, y1 * k], cc);
      quad(L, [u1, y0, v0], [u1, y0, v1], [u1, y1, v1], [u1, y1, v0], [1, 0, 0], [v0 * k, y0 * k, v1 * k, y0 * k, v1 * k, y1 * k, v0 * k, y1 * k], cc);
      quad(L, [u0, y0, v0], [u0, y0, v1], [u0, y1, v1], [u0, y1, v0], [-1, 0, 0], [v0 * k, y0 * k, v1 * k, y0 * k, v1 * k, y1 * k, v0 * k, y1 * k], cc);
      if (!sansDessous) quad(L, [u0, y0, v0], [u1, y0, v0], [u1, y0, v1], [u0, y0, v1], [0, -1, 0], [0, 0, 0, 0, 0, 0, 0, 0], fois(c, 0.7));
    };
    let g = (b.graine || 3) * 7 + 5;
    const h2 = () => ((g = (g * 1664525 + 1013904223) >>> 0) / 4294967296);
    const choix = (l) => l[Math.floor(h2() * l.length)];
    const PARQUET = choix([lin("#b08458"), lin("#9a6e48"), lin("#c09a6c"), lin("#8a6a4c")]);
    const BOIS = choix([lin("#7a5232"), lin("#5e4128"), lin("#8c6440"), lin("#6b4a30")]);
    const TISSU = choix([lin("#5d6e8c"), lin("#7d4a3e"), lin("#5a7a5a"), lin("#8c7a5a"), lin("#6a5a7a")]);
    const PLATRE = lin("#e2dccf"), PLAFOND = lin("#efe9de"), BLANC = lin("#eeeeea"), METAL = lin("#3a3a3a"), DRAP = lin("#e8e4dc");
    const TAPIS = choix([lin("#8a3a2e"), lin("#2e4a6e"), lin("#6e5a2e"), lin("#4a2e4a")]);
    const LAMPE = lin("#" + I.lampe.toString(16).padStart(6, "0"));
    const { iu0, iu1, iv0, iv1, p0 } = P;
    // --- le parquet du rez-de-chaussée (et sous la porte)
    boite(iu0, iu1, p0 - 0.12, p0, iv0, iv1, 0, PARQUET, true, true);
    boite(b.porte.trou.a0, b.porte.trou.a1, p0 - 0.12, p0, iv1, b.demiP, 0, fois(PARQUET, 0.85), true, true);
    // --- l'étage : le plancher (dessus en parquet, dessous en plâtre), le garde-corps, les cloisons, les gros meubles
    for (const q of P.boites) {
      if (q.sorte === "plancher") {
        boite(q.u0, q.u1, q.y0, q.y1, q.v0, q.v1, 0, PARQUET, true, true);
        boite(q.u0, q.u1, q.y0, q.y1 - 0.01, q.v0, q.v1, 1, PLAFOND, true, false); // (les bords du trou de l'escalier)
        quad(lots[3], [q.u0, q.y0, q.v0], [q.u1, q.y0, q.v0], [q.u1, q.y0, q.v1], [q.u0, q.y0, q.v1], [0, -1, 0], [0, 0, 0, 0, 0, 0, 0, 0], fois(PLAFOND, 0.6)); // (le plafond du bas : clair, il renvoie la lumière)
      } else if (q.sorte === "cloison") boite(q.u0, q.u1, q.y0, q.y1, q.v0, q.v1, 1, PLATRE, true);
      else if (q.sorte === "rampe") {
        boite(q.u0, q.u1, q.y1 - 0.06, q.y1, q.v0 - 0.02, q.v1 + 0.02, 0, BOIS); // la main courante
        for (let u = q.u0 + 0.05; u <= q.u1; u += 0.55) boite(u, u + 0.05, q.y0, q.y1 - 0.06, q.v0, q.v1, 0, BOIS, true); // les barreaux
      }
    }
    // --- l'escalier : des marches (des blocs posés sur le sol, de plus en plus hauts)
    if (P.esc) {
      const E = P.esc, n = Math.max(4, Math.round((P.haut - p0) / 0.19)), l = (E.u1 - E.u0) / n;
      for (let i = 0; i < n; i++) {
        const y1 = p0 + ((i + 1) * (P.haut - p0)) / n, a = E.sens > 0 ? E.u0 + i * l : E.u1 - (i + 1) * l;
        boite(a, a + l, p0, y1, E.v0, E.v1, 0, fois(BOIS, 1.15 - (i % 2) * 0.08), true);
      }
    }
    // --- le plafond tout en haut (sous le toit), vu d'en dessous
    // (un plafond est tourné vers le bas : ni le soleil ni le ciel ne l'éclairent. On lui donne une petite « lueur » : c'est la
    // lumière qui rebondit sur le sol et les murs, peinte au lieu d'être calculée)
    const plafond = (y, col) => quad(lots[3], [iu0, y, iv0], [iu1, y, iv0], [iu1, y, iv1], [iu0, y, iv1], [0, -1, 0], [0, 0, 0, 0, 0, 0, 0, 0], fois(col, 0.6));
    plafond(b.h - 0.02, PLAFOND);
    // --- les plafonniers : une lampe au milieu de chaque pièce (sous le plafond)
    const plafonds = [[P.cloison ? (P.cloison.u + (P.cloison.u > 0 ? iu0 : iu1)) / 2 : 0, (iv0 + iv1) / 2, P.plafond0]];
    if (P.cloison) plafonds.push([(P.cloison.u + (P.cloison.u > 0 ? iu1 : iu0)) / 2, (iv0 + iv1) / 2, P.plafond0]);
    if (P.haut !== null) plafonds.push([0, P.esc ? (P.esc.v1 + iv1) / 2 : (iv0 + iv1) / 2, b.h - 0.02]);
    for (const [u, v, y] of plafonds) {
      if (P.esc && y < P.haut && u >= P.esc.u0 - 0.3 && u <= P.esc.u1 + 0.3 && v <= P.esc.v1 + 0.3) continue;
      boite(u - 0.01, u + 0.01, y - 0.35, y, v - 0.01, v + 0.01, 1, METAL, true);
      boite(u - 0.17, u + 0.17, y - 0.5, y - 0.35, v - 0.17, v + 0.17, 2, LAMPE);
    }
    // --- les meubles
    for (const m of P.meubles) {
      const { u0, u1, v0, v1, y } = m, h = m.h, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
      // « dos » : le côté collé au mur (l'inverse de la face) ; dir(d) = la boîte d'épaisseur d du côté du dos
      const dos = (d) => ({ "v+": [u0, u1, v0, v0 + d], "v-": [u0, u1, v1 - d, v1], "u+": [u0, u0 + d, v0, v1], "u-": [u1 - d, u1, v0, v1] }[m.face]);
      const avant = (d) => ({ "v+": [u0, u1, v1 - d, v1], "v-": [u0, u1, v0, v0 + d], "u+": [u1 - d, u1, v0, v1], "u-": [u0, u0 + d, v0, v1] }[m.face]);
      const pieds = (hh, e, col) => { for (const [a, c] of [[u0, v0], [u1 - e, v0], [u0, v1 - e], [u1 - e, v1 - e]]) boite(a, a + e, y, y + hh, c, c + e, 0, col, true); };
      switch (m.sorte) {
        case "tapis": boite(u0, u1, y, y + h, v0, v1, 1, TAPIS, true); boite(u0 + 0.12, u1 - 0.12, y + h, y + h + 0.004, v0 + 0.12, v1 - 0.12, 1, fois(TAPIS, 1.35), true, true); break;
        case "table": boite(u0, u1, y + h - 0.05, y + h, v0, v1, 0, BOIS); pieds(h - 0.05, 0.07, fois(BOIS, 0.9)); break;
        case "bureau": {
          boite(u0, u1, y + h - 0.04, y + h, v0, v1, 0, BOIS);
          const [a0, a1, b0, b1] = dos(0.03);
          boite(a0, a1, y + 0.3, y + h - 0.04, b0, b1, 0, fois(BOIS, 0.85), true); // (le panneau du fond)
          pieds(h - 0.04, 0.05, fois(BOIS, 0.8));
          boite(cu - 0.2, cu + 0.2, y + h, y + h + 0.02, cv - 0.15, cv + 0.15, 1, BLANC, true); // (une feuille, une carte ?)
          break;
        }
        case "chaise": {
          boite(u0, u1, y + 0.43, y + 0.48, v0, v1, 0, BOIS);
          pieds(0.43, 0.04, fois(BOIS, 0.85));
          const [a0, a1, b0, b1] = dos(0.04);
          boite(a0, a1, y + 0.48, y + h, b0, b1, 0, BOIS, true);
          break;
        }
        case "etagere": {
          const [a0, a1, b0, b1] = dos(0.03);
          boite(a0, a1, y, y + h, b0, b1, 0, fois(BOIS, 0.8), true);
          const cotes = m.face[0] === "v" ? [[u0, u0 + 0.03, v0, v1], [u1 - 0.03, u1, v0, v1]] : [[u0, u1, v0, v0 + 0.03], [u0, u1, v1 - 0.03, v1]];
          for (const [c0, c1, d0, d1] of cotes) boite(c0, c1, y, y + h, d0, d1, 0, BOIS, true);
          for (let k = 0; k < 5; k++) {
            const yy = y + 0.05 + k * ((h - 0.08) / 4);
            boite(u0, u1, yy - 0.03, yy, v0, v1, 0, BOIS, true);
            if (k === 4) continue;
            // des livres de toutes les couleurs
            const long = m.face[0] === "v", a = long ? u0 + 0.06 : v0 + 0.06, fin = long ? u1 - 0.06 : v1 - 0.06;
            for (let x = a; x < fin - 0.05; ) {
              const e = 0.03 + h2() * 0.05, hh = 0.18 + h2() * 0.14, col = choix([lin("#7a2e2e"), lin("#2e4a7a"), lin("#3e6a3e"), lin("#c9b48a"), lin("#5a3a6a"), lin("#a8642e")]);
              if (h2() < 0.15) { x += e * 2; continue; }
              if (long) boite(x, Math.min(fin, x + e), yy, yy + hh, v0 + 0.06, v1 - 0.06, 1, col, true);
              else boite(u0 + 0.06, u1 - 0.06, yy, yy + hh, x, Math.min(fin, x + e), 1, col, true);
              x += e + 0.004;
            }
          }
          break;
        }
        case "canape": {
          boite(u0, u1, y + 0.08, y + 0.44, v0, v1, 1, TISSU);
          pieds(0.08, 0.06, METAL);
          const [a0, a1, b0, b1] = dos(0.2);
          boite(a0, a1, y + 0.44, y + h, b0, b1, 1, fois(TISSU, 0.92));
          const bras = m.face[0] === "v" ? [[u0, u0 + 0.18, v0, v1], [u1 - 0.18, u1, v0, v1]] : [[u0, u1, v0, v0 + 0.18], [u0, u1, v1 - 0.18, v1]];
          for (const [c0, c1, d0, d1] of bras) boite(c0, c1, y + 0.44, y + 0.62, d0, d1, 1, fois(TISSU, 0.95));
          break;
        }
        case "lampe": {
          boite(cu - 0.13, cu + 0.13, y, y + 0.03, cv - 0.13, cv + 0.13, 1, METAL);
          boite(cu - 0.015, cu + 0.015, y + 0.03, y + h - 0.3, cv - 0.015, cv + 0.015, 1, METAL, true);
          boite(cu - 0.17, cu + 0.17, y + h - 0.32, y + h, cv - 0.17, cv + 0.17, 2, LAMPE);
          break;
        }
        case "buffet": {
          boite(u0, u1, y + 0.08, y + h, v0, v1, 0, BOIS);
          boite(u0, u1, y, y + 0.08, v0, v1, 0, fois(BOIS, 0.6), true);
          const [a0, a1, b0, b1] = avant(0.012);
          boite(a0 + (m.face[0] === "v" ? 0.06 : 0), a1 - (m.face[0] === "v" ? 0.06 : 0), y + 0.16, y + h - 0.1, b0 + (m.face[0] === "u" ? 0.06 : 0), b1 - (m.face[0] === "u" ? 0.06 : 0), 0, fois(BOIS, 1.18), true);
          boite(cu - 0.12, cu + 0.12, y + h, y + h + 0.1, cv - 0.12, cv + 0.12, 1, BLANC); // (une soupière)
          break;
        }
        case "armoire": {
          boite(u0, u1, y, y + h, v0, v1, 0, BOIS);
          const [a0, a1, b0, b1] = avant(0.015);
          if (m.face[0] === "v") boite(cu - 0.008, cu + 0.008, y + 0.1, y + h - 0.1, b0 - 0.005, b1 + 0.005, 0, fois(BOIS, 0.5), true);
          else boite(a0 - 0.005, a1 + 0.005, y + 0.1, y + h - 0.1, cv - 0.008, cv + 0.008, 0, fois(BOIS, 0.5), true);
          break;
        }
        case "frigo": {
          boite(u0, u1, y, y + h, v0, v1, 1, BLANC);
          const [a0, a1, b0, b1] = avant(0.03);
          if (m.face[0] === "v") boite(u0 + 0.05, u0 + 0.08, y + 0.9, y + 1.4, b0 - 0.02, b1, 1, METAL, true);
          else boite(a0 - 0.02, a1, y + 0.9, y + 1.4, v0 + 0.05, v0 + 0.08, 1, METAL, true);
          boite(...avant(0.02).slice(0, 2), y + 1.15, y + 1.17, ...avant(0.02).slice(2), 1, fois(BLANC, 0.6), true);
          break;
        }
        case "lit": {
          boite(u0, u1, y + 0.1, y + 0.3, v0, v1, 0, BOIS); // le cadre
          pieds(0.1, 0.07, fois(BOIS, 0.8));
          boite(u0 + 0.04, u1 - 0.04, y + 0.3, y + h, v0 + 0.04, v1 - 0.04, 1, DRAP); // le matelas
          const [a0, a1, b0, b1] = dos(0.06);
          boite(a0, a1, y, y + 0.95, b0, b1, 0, BOIS, true); // la tête de lit
          const [c0, c1, d0, d1] = dos(0.5); // l'oreiller, contre la tête de lit
          if (m.face[0] === "v") boite(c0 + 0.15, c1 - 0.15, y + h, y + h + 0.12, Math.min(d0, d1) + (m.face === "v+" ? 0.08 : 0.12), Math.max(d0, d1) - (m.face === "v+" ? 0.12 : 0.08), 1, BLANC);
          else boite(Math.min(c0, c1) + (m.face === "u+" ? 0.08 : 0.12), Math.max(c0, c1) - (m.face === "u+" ? 0.12 : 0.08), y + h, y + h + 0.12, d0 + 0.15, d1 - 0.15, 1, BLANC);
          const [e0, e1, f0, f1] = avant(Math.abs((m.face[0] === "v" ? v1 - v0 : u1 - u0)) * 0.62); // la couverture, sur les 2/3
          boite(e0, e1, y + 0.3, y + h + 0.04, f0, f1, 1, TISSU, true);
          break;
        }
        case "chevet": {
          boite(u0, u1, y, y + h, v0, v1, 0, BOIS);
          boite(cu - 0.08, cu + 0.08, y + h, y + h + 0.2, cv - 0.08, cv + 0.08, 1, METAL, true);
          boite(cu - 0.11, cu + 0.11, y + h + 0.2, y + h + 0.38, cv - 0.11, cv + 0.11, 2, LAMPE);
          break;
        }
        default: boite(u0, u1, y, y + h, v0, v1, 1, TISSU);
      }
    }
    // ✍️ (livre de demandes n° 11) LES OBJETS LAISSÉS DANS LA FUITE : sur la table (assiettes, tasse, téléphone), par terre
    // (sac à dos, valise ouverte, nounours, journal, chaussures, vêtements), et une valise à moitié faite sur le lit
    const libreSol = (u, v, etage) => !P.boites.some((q) => q.sorte !== "plancher" && q.sorte !== "rampe" && (etage === 1 ? q.y0 >= P.haut - 0.1 : q.y0 < P.p0 + 0.5) && u > q.u0 - 0.25 && u < q.u1 + 0.25 && v > q.v0 - 0.25 && v < q.v1 + 0.25) && !(P.esc && u > P.esc.u0 - 0.4 && u < P.esc.u1 + 0.4 && v < P.esc.v1 + 0.4);
    const objet = (u, v, y, sorte, col) => {
      const a = h2() * 6.28, c = Math.cos(a), sn = Math.sin(a), b2 = (x0, x1, y0, y1, z0, z1, cc, lot) => {
        // une petite boîte tournée de « a » autour de son centre (u, v)
        const L = lots[lot || 1], cc2 = fois(cc, S), o = L.pos.length / 3, coins = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => [u + x * c - z * sn, v + x * sn + z * c]);
        const pt = (k, yy) => [coins[k][0], yy, coins[k][1]];
        quad(L, pt(0, y + y1), pt(1, y + y1), pt(2, y + y1), pt(3, y + y1), [0, 1, 0], [0, 0, 0, 0, 0, 0, 0, 0], cc2);
        for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4, nx = (coins[k2][1] - coins[k][1]), nz = -(coins[k2][0] - coins[k][0]), l = Math.hypot(nx, nz) || 1; quad(L, pt(k, y + y0), pt(k2, y + y0), pt(k2, y + y1), pt(k, y + y1), [-nx / l, 0, -nz / l], [0, 0, 0, 0, 0, 0, 0, 0], fois(cc2, 0.85)); }
      };
      if (sorte === "sac") (b2(-0.15, 0.15, 0, 0.4, -0.12, 0.12, col), b2(0.15, 0.21, 0.05, 0.25, -0.09, 0.09, fois(col, 0.85)));
      else if (sorte === "valise") (b2(-0.35, 0.35, 0, 0.12, -0.23, 0.23, col), b2(-0.35, 0.35, 0, 0.12, 0.25, 0.71, col), b2(-0.3, 0.25, 0.12, 0.17, -0.2, 0.15, lin("#e0ddd2")));
      else if (sorte === "ours") (b2(-0.12, 0.12, 0, 0.26, -0.12, 0.12, lin("#8a5a2a")), b2(-0.09, 0.09, 0.26, 0.42, -0.09, 0.09, lin("#8a5a2a")));
      else if (sorte === "journal") (b2(-0.2, 0.2, 0, 0.012, -0.15, 0.15, lin("#dcdad0")), b2(-0.5, -0.15, 0, 0.008, 0.1, 0.35, lin("#d0cec4")));
      else if (sorte === "chaussures") (b2(-0.14, 0.14, 0, 0.1, -0.13, -0.03, col), b2(-0.1, 0.18, 0, 0.1, 0.05, 0.15, col));
      else if (sorte === "vetement") (b2(-0.3, 0.3, 0, 0.03, -0.25, 0.25, col), b2(-0.25, 0.05, 0, 0.025, 0.25, 0.6, fois(col, 0.9)));
      else if (sorte === "assiette") b2(-0.12, 0.12, 0, 0.02, -0.12, 0.12, lin("#f0efe8"));
      else if (sorte === "tasse") b2(-0.04, 0.04, 0, 0.09, -0.04, 0.04, lin("#e8e4dc"));
      else if (sorte === "telephone") (b2(-0.08, 0.08, 0, 0.012, -0.04, 0.04, lin("#111111")), b2(-0.07, 0.07, 0.012, 0.014, -0.035, 0.035, lin("#3a6a9a"), 2));
    };
    const COUL_OBJ = [lin("#2b3a55"), lin("#7a2e2e"), lin("#3e5a3e"), lin("#8a6a3a"), lin("#5a3a6a"), lin("#c0a030")];
    const table = P.meubles.find((m) => m.sorte === "table");
    if (table) {
      const tu = (table.u0 + table.u1) / 2, tv = (table.v0 + table.v1) / 2, y = table.y + table.h;
      objet(tu - 0.3, tv - 0.15, y, "assiette"); objet(tu + 0.3, tv + 0.1, y, "assiette"); objet(tu + 0.05, tv - 0.2, y, "tasse");
      if (h2() < 0.6) objet(tu - 0.05, tv + 0.2, y, "telephone");
    }
    const poser = (etage, sortes) => {
      const y = etage === 1 ? P.haut : p0;
      for (const sorte of sortes) for (let essai = 0; essai < 12; essai++) {
        const u = iu0 + 0.4 + h2() * (iu1 - iu0 - 0.8), v = iv0 + 0.4 + h2() * (iv1 - iv0 - 0.8);
        if (!libreSol(u, v, etage)) continue;
        objet(u, v, y, sorte, choix(COUL_OBJ));
        break;
      }
    };
    poser(0, ["sac", "journal", "chaussures"].concat(h2() < 0.5 ? ["valise"] : [], h2() < 0.4 ? ["ours"] : [], h2() < 0.5 ? ["vetement"] : []));
    if (P.esc) {
      poser(1, ["vetement", "chaussures"].concat(h2() < 0.5 ? ["sac"] : []));
      const lit = P.meubles.find((m) => m.sorte === "lit");
      if (lit && h2() < 0.7) objet((lit.u0 + lit.u1) / 2, (lit.v0 + lit.v1) / 2, lit.y + lit.h + 0.04, "valise", choix(COUL_OBJ));
    }
    // --- les 3 lots → UN objet, UN dessin (le grain et la lueur sont rangés dans chaque sommet)
    const geo = new THREE.BufferGeometry(), pos = [], nor = [], uv = [], col = [], idx = [], grain = [], lueur = [];
    let triangles = 0;
    lots.forEach((L, i) => {
      const o = pos.length / 3, n = L.pos.length / 3;
      pos.push(...L.pos); nor.push(...L.nor); uv.push(...L.uv); col.push(...L.col);
      for (let k = 0; k < n; k++) grain.push(i === 0 ? 1 : 0), lueur.push(i === 2 ? 1 : i === 3 ? 0.55 : 0);
      for (const k of L.idx) idx.push(k + o);
      triangles += L.idx.length / 3;
    });
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(nor), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(uv), 2));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(col), 3));
    geo.setAttribute("grain", new THREE.BufferAttribute(new Float32Array(grain), 1));
    geo.setAttribute("lueur", new THREE.BufferAttribute(new Float32Array(lueur), 1));
    geo.setIndex(new THREE.BufferAttribute(pos.length / 3 > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mats);
    mesh.receiveShadow = true; // (le soleil qui entre par les fenêtres fait des taches de lumière ; le reste est à l'ombre)
    mesh.castShadow = false;
    groupe.add(mesh);
    const ms = performance.now() - debut;
    bilan.msDernier = ms;
    bilan.msFabrique += ms;
    bilan.fabriques++;
    return { mesh, triangles, dessins: 1 };
  }
  function jeter(b, f) {
    groupe.remove(f.mesh);
    f.mesh.geometry.dispose();
    faits.delete(b);
    bilan.jetes++;
  }

  // ------------------------------------------------------------------ chaque image
  let attente = 0;
  function maj(dt, cam, distance) {
    if (!mats) return;
    majPortes(false);
    bilan.distance = distance;
    attente -= dt;
    let visibles = 0, triangles = 0, dessins = 0;
    for (const [b, f] of faits) {
      const loin = Math.hypot(b.x - cam.x, b.z - cam.z) - b.rayon > distance * 1.25;
      if (loin || !IN().actif(b)) { jeter(b, f); continue; } // (trop loin, ou la maison s'est effondrée : l'intérieur avec)
      f.mesh.visible = true;
      visibles++;
      triangles += f.triangles;
      dessins += f.dessins;
    }
    // de nouvelles maisons assez près ? (on regarde 4 fois par seconde ; au plus 2 fabriquées par image)
    if (attente <= 0) {
      attente = 0.25;
      let n = 0;
      for (const b of IN().maisons) {
        if (n >= 2) { attente = 0; break; }
        if (faits.has(b) || !IN().actif(b) || Math.hypot(b.x - cam.x, b.z - cam.z) - b.rayon > distance) continue;
        // (demande 127) seulement s'il reste du temps dans la tirelire de cette image (moteur/budget.js) ; sinon, à la suivante
        let f = null;
        if (!Tanks.Budget.tranche("intérieurs de maisons", () => (f = fabriquer(b)))) { attente = 0; break; }
        faits.set(b, f);
        n++;
        visibles++;
        triangles += f.triangles;
        dessins += f.dessins;
      }
    }
    bilan.construits = faits.size;
    bilan.visibles = visibles;
    bilan.triangles = triangles;
    bilan.dessins = dessins + 1; // (+ 1 : toutes les portes)
  }

  return { construire, maj, bilan, get faits() { return faits; } };
})();
