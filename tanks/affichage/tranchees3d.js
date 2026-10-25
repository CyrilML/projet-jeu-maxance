// 🪵 LES TRANCHÉES EN 3D : le terrassier du front de 1916 (demande 115)
//
// ✍️ « Première Guerre mondiale (1916) : tranchées, barbelés, boue… » Le géomètre (logique/terrain.js) et le chef des
// tranchées (logique/tranchees.js) savent OÙ le sol est creusé ; le terrassier, lui, le DESSINE :
//   - le sol 3D a un point tous les 5 m : bien trop gros pour une tranchée de 2,4 m ! Alors le peintre du sol
//     (affichage/decor.js) TROUE le sol au-dessus des tranchées (son programme de carte graphique calcule, pour chaque
//     petit point de l'écran, la distance aux lignes en zigzag, comme logique/tranchees.js, et ne dessine rien dedans) ;
//   - à la place, le terrassier pose la tranchée elle-même, comme un BALAYAGE : un « profil » (la coupe de la tranchée :
//     le parados, la paroi arrière en planches, le fond de boue, la marche, la banquette de tir, la paroi avant, le
//     PARAPET de sacs de sable) qu'on fait glisser tout le long de la ligne en zigzag, tous les 2,5 m ;
//   - sur le fond : les CAILLEBOTIS (des planches en échelle pour ne pas marcher dans la boue) ; dans la paroi arrière :
//     l'entrée sombre des ABRIS (les « cagnas »), avec leur cadre de poutres ;
//   - les BARBELÉS : des piquets, 3 fils qui pendent un peu entre eux, des fils en croix, et un rouleau en spirale ; un
//     tronçon coupé (cisailles, tank, obus) disparaît (ses fils sont « écrasés » en un point : on ne les voit plus) ;
//   - les ARBRES DÉCHIQUETÉS (des troncs cassés, noircis, sans feuilles) et la peinture du sol : la boue, la terre
//     rejetée au bord des tranchées, les cratères et leur eau boueuse ;
//   - la MITRAILLEUSE LOURDE (pour affichage/engins3d.js) : le trépied, le manchon de refroidissement à eau, le bouclier,
//     la caisse de bandes, le tuyau, et le muret de sacs de sable autour.
// Une seule IMAGE (un « atlas » de 4 cases : planches, boue, caillebotis, sacs de sable) pour toute la tranchée : 1 seul
// dessin par morceau de 140 m. Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Tranchees3D = (function () {
  const C = Tanks.CONFIG, TR = Tanks.Tranchees, T = Tanks.Terrain, O = Tanks.Outils3D;
  const bilan = { morceaux: 0, triangles: 0, fils: 0, piquets: 0, arbres: 0, abris: 0, version: -1, coupes: 0 };
  let graine = 4242;
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ------------------------------------------------------------------ l'ATLAS (4 cases de 256 × 256)
  // case 0 (haut gauche) : les planches de la paroi ; 1 (haut droite) : la boue ; 2 (bas gauche) : le caillebotis ;
  // 3 (bas droite) : les sacs de sable. Chaque case se répète toute seule (« fract » dans le programme de la carte graphique).
  let atlas = null, matiere = null;
  function peindreAtlas() {
    const c = document.createElement("canvas"), N = 256;
    c.width = c.height = N * 2;
    const x = c.getContext("2d");
    const bruit = (x0, y0, n, a, b) => { for (let i = 0; i < n; i++) (x.fillStyle = "rgba(" + a + "," + (hasard() * b).toFixed(3) + ")"), x.fillRect(x0 + hasard() * N, y0 + hasard() * N, 1 + hasard() * 3, 1 + hasard() * 3); };
    // 0. les planches (horizontales), leurs fentes, et les piquets qui les tiennent
    x.fillStyle = "#7a5f3e", x.fillRect(0, 0, N, N);
    for (let k = 0; k < 8; k++) {
      const v = 90 + hasard() * 40;
      x.fillStyle = "rgb(" + v + "," + (v * 0.78) + "," + (v * 0.52) + ")", x.fillRect(0, k * 32 + 1, N, 30);
      for (let g = 0; g < 14; g++) (x.fillStyle = "rgba(40,28,16,0.25)"), x.fillRect(0, k * 32 + 4 + hasard() * 24, N, 1); // le fil du bois
      x.fillStyle = "rgba(20,14,8,0.85)", x.fillRect(0, k * 32, N, 2); // la fente entre deux planches
      x.fillStyle = "rgba(60,46,30,0.5)", x.fillRect(hasard() * N, k * 32, 2, 32); // un bout de planche
    }
    for (const px of [10, 138]) (x.fillStyle = "#4a3926", x.fillRect(px, 0, 18, N), x.fillStyle = "rgba(0,0,0,0.35)", x.fillRect(px + 14, 0, 4, N)); // les piquets
    x.fillStyle = "rgba(70,58,40,0.6)", x.fillRect(0, N * 0.82, N, N * 0.18); // la boue en bas
    bruit(0, 0, 900, "30,22,14", 0.4);
    // 1. la boue : brun sombre, des flaques qui brillent un peu, des traces de pas
    x.fillStyle = "#4f3f2c", x.fillRect(N, 0, N, N);
    for (let i = 0; i < 70; i++) { const r = 6 + hasard() * 26; x.fillStyle = hasard() < 0.5 ? "rgba(36,28,18,0.45)" : "rgba(98,82,60,0.35)"; x.beginPath(), x.ellipse(N + hasard() * N, hasard() * N, r, r * 0.6, hasard() * 3, 0, Math.PI * 2), x.fill(); }
    for (let i = 0; i < 10; i++) { const r = 8 + hasard() * 16; x.fillStyle = "rgba(120,118,104,0.35)"; x.beginPath(), x.ellipse(N + hasard() * N, hasard() * N, r, r * 0.45, 0, 0, Math.PI * 2), x.fill(); }
    bruit(N, 0, 1500, "20,16,10", 0.5);
    // 2. le caillebotis : 2 longerons, et des traverses tous les 25 cm, sur la boue
    x.fillStyle = "#3a2e20", x.fillRect(0, N, N, N);
    for (let k = 0; k < 8; k++) { const v = 105 + hasard() * 35; x.fillStyle = "rgb(" + v + "," + (v * 0.8) + "," + (v * 0.55) + ")"; x.fillRect(k * 32 + 3, N, 22, N); x.fillStyle = "rgba(30,20,10,0.4)"; x.fillRect(k * 32 + 3, N + hasard() * N, 22, 3); }
    for (const py of [40, 216]) (x.fillStyle = "#5a4630", x.fillRect(0, N + py, N, 16));
    bruit(0, N, 700, "30,22,12", 0.45);
    // 3. les sacs de sable : des « coussins » en quinconce, toile beige sale, avec leur couture
    x.fillStyle = "#5b5040", x.fillRect(N, N, N, N);
    for (let r = 0; r < 6; r++) for (let k = -1; k < 4; k++) {
      const sx = N + k * 72 + (r % 2) * 36, sy = N + r * 43, v = 140 + hasard() * 40;
      const g = x.createRadialGradient(sx + 34, sy + 18, 4, sx + 34, sy + 20, 42);
      g.addColorStop(0, "rgb(" + v + "," + (v * 0.9) + "," + (v * 0.7) + ")"), g.addColorStop(1, "rgb(" + v * 0.55 + "," + v * 0.48 + "," + v * 0.36 + ")");
      x.fillStyle = g, x.beginPath(), x.ellipse(sx + 34, sy + 20, 34, 19, 0, 0, Math.PI * 2), x.fill();
      x.strokeStyle = "rgba(60,50,36,0.6)", x.beginPath(), x.moveTo(sx + 8, sy + 12), x.lineTo(sx + 62, sy + 12), x.stroke();
    }
    bruit(N, N, 1200, "40,32,20", 0.4);
    atlas = new THREE.CanvasTexture(c);
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.anisotropy = 4;
    return atlas;
  }
  const CASES = [[0, 0.5], [0.5, 0.5], [0, 0], [0.5, 0]]; // (le coin bas-gauche de chaque case, dans l'image)
  const TAILLE = [2, 2.5, 1.6, 0.75]; // m d'une répétition de chaque case (planches, boue, caillebotis, sacs)
  function matiereTranchee() {
    if (matiere) return matiere;
    matiere = new THREE.MeshStandardMaterial({ map: atlas || peindreAtlas(), vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    matiere.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec2 atlasCase;\nvarying vec2 vCase;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\nvCase = atlasCase;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vCase;")
        .replace("#include <map_fragment>", "#ifdef USE_MAP\n  vec4 sampledDiffuseColor = textureGrad(map, vCase + fract(vMapUv) * 0.5, dFdx(vMapUv) * 0.5, dFdy(vMapUv) * 0.5);\n  diffuseColor *= sampledDiffuseColor;\n#endif");
    };
    return matiere;
  }

  // ------------------------------------------------------------------ le MAÇON : des quadrilatères dans une liste
  function macon() {
    const pos = [], uv = [], cas = [], col = [];
    const q = { pos, uv, cas, col, n: 0 };
    // un quad (a, b, c, d dans l'ordre du tour), sa case, ses uv (m), sa couleur (1 = l'image telle quelle)
    q.quad = (a, b, c2, d, k, ua, va, ub, vb, coul) => {
      const t = TAILLE[k], cc = coul === undefined ? 1 : coul, [cx, cy] = CASES[k];
      const P = [a, b, c2, a, c2, d], U = [[ua, va], [ub, va], [ub, vb], [ua, va], [ub, vb], [ua, vb]];
      for (let i = 0; i < 6; i++) {
        pos.push(P[i][0], P[i][1], P[i][2]);
        uv.push(U[i][0] / t, U[i][1] / t);
        cas.push(cx, cy);
        if (Array.isArray(cc)) col.push(cc[0], cc[1], cc[2]);
        else col.push(cc, cc, cc);
      }
      q.n += 2;
    };
    // une boîte (pour les piquets, les poutres) : centre, tailles, angle autour de y, penchée de « pente » autour de z
    q.boite = (cx, cy, cz, sx, sy, sz, angle, k, coul, pente) => {
      const ca = Math.cos(angle), sa = Math.sin(angle), cp = Math.cos(pente || 0), sp = Math.sin(pente || 0);
      const pt = (dx, dy, dz) => { const x1 = dx * cp - dy * sp, y1 = dx * sp + dy * cp; return [cx + x1 * ca - dz * sa, cy + y1, cz + x1 * sa + dz * ca]; };
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const s = [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz], [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]].map((p) => pt(...p));
      for (const [a, b, c2, d] of [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]]) q.quad(s[a], s[b], s[c2], s[d], k, 0, 0, Math.max(sx, sz), sy, coul);
    };
    q.geo = () => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute("atlasCase", new THREE.Float32BufferAttribute(cas, 2));
      g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      return g;
    };
    return q;
  }

  // ------------------------------------------------------------------ 1. LES TRANCHÉES : le balayage du profil
  // Les points d'une ligne, tous les « pas » m (le long de x, ou de z pour un boyau), avec ses coins de zigzag.
  function pointsDe(l, pas) {
    const out = [], coins = [];
    for (let n = Math.ceil(((l.de + l.phase * l.P) / l.P) * 2); ; n++) {
      const le = (n * l.P) / 2 - l.phase * l.P;
      if (le >= l.a) break;
      if (le > l.de) coins.push(le);
    }
    const cles = [l.de].concat(coins, [l.a]);
    for (let i = 0; i < cles.length - 1; i++) {
      const a = cles[i], b = cles[i + 1], n = Math.max(1, Math.ceil(Math.abs(b - a) / pas));
      for (let k = 0; k < n; k++) out.push(a + ((b - a) * k) / n);
    }
    out.push(l.a);
    return out.map((le) => {
      const tr = l.c + l.A * TR.tri((le + l.phase * l.P) / l.P);
      return l.sorte === "x" ? { x: le, z: tr, le } : { x: tr, z: le, le };
    });
  }
  // LE PROFIL (la coupe) : [écart vers l'ennemi en m, hauteur par rapport au sol naturel en m, case de l'atlas, couleur]
  function profil(l) {
    const P = TR.P, b = P.bord, f = P.fond, prof = -P.profondeur, cote = l.role === "boyau" ? 0.12 : 0.3, haut = l.avant ? C.tranchees.parapet || 0.35 : cote;
    if (l.avant) return [
      [-2.3, 0, 3, 0.9], [-1.65, cote, 3, 0.95], [-b, 0.04, 0, 1], // le parados (sacs)
      [-f, prof, 1, 0.8], // la paroi arrière (planches)
      [P.marche[0], prof, 0, 0.9], // le fond (boue)
      [P.marche[0], -P.banquette, 0, 1], // la contremarche (planches)
      [P.marche[1], -P.banquette, 0, 1], // la banquette de tir (planches)
      [b, 0.04, 3, 1], // la paroi avant (planches)
      [b + 0.3, haut, 3, 1], [b + 0.95, haut * 0.85, 3, 0.95], [b + 1.6, 0, 3, 0.85], // le parapet (sacs de sable)
    ];
    return [[-2.0, 0, 3, 0.9], [-1.5, cote, 3, 0.95], [-b, 0.04, 0, 1], [-f, prof, 1, 0.8], [f, prof, 0, 1], [b, 0.04, 3, 1], [1.5, cote, 3, 0.95], [2.0, 0, 3, 0.9]];
  }
  // (un bout de tranchée qui en croise une autre : on n'y met ni paroi ni fond, sinon elles se couperaient)
  function croise(l, x, z) {
    for (const o of TR.lignes) {
      if (o === l || (l.role !== "boyau" && o.role !== "boyau")) continue;
      const u = TR.ecart(o, x, z);
      if (u !== null && Math.abs(u) < TR.P.bord + 0.4) return o;
    }
    return null;
  }
  function construireTranchees(groupe, ajouter) {
    const mat = matiereTranchee(), PAS = 2.5, LONG = 140;
    for (const l of TR.lignes) {
      const pts = pointsDe(l, PAS), pr = profil(l), sens = l.avant || 1;
      // la normale de chaque point (moyenne des deux segments : les coins du zigzag sont « en onglet »)
      const N = pts.map((p, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1;
        let nx = -dz / d, nz = dx / d;
        if (l.sorte === "z") (nx = -nx), (nz = -nz); // (pour un boyau, la normale regarde vers +x)
        // l'onglet : au coin, on allonge un peu pour que les parois se rejoignent
        const a2 = pts[Math.max(0, i - 1)], s1 = Math.atan2(p.z - a2.z, p.x - a2.x), s2 = Math.atan2(b.z - p.z, b.x - p.x), demi = Math.abs(Math.atan2(Math.sin(s2 - s1), Math.cos(s2 - s1))) / 2;
        const k = i > 0 && i < pts.length - 1 ? 1 / Math.max(0.6, Math.cos(demi)) : 1;
        return [nx * k * sens, nz * k * sens];
      });
      // les points du profil à chaque point de la ligne (x, y, z), et le bout de tranchée qui croise
      const sommets = pts.map((p, i) => pr.map(([v, h]) => {
        const x = p.x + N[i][0] * v, z = p.z + N[i][1] * v, bout = Math.min(1, Math.max(0, Math.min(p.le - l.de, l.a - p.le) / 3 + 0.4));
        return [x, T.hauteurExacte(x, z) + (h < 0 ? h * bout : h), z];
      }));
      let q = macon(), long = 0, lg = 0;
      const vider = () => {
        if (!q.n) return;
        const m = new THREE.Mesh(q.geo(), mat);
        m.receiveShadow = true;
        m.castShadow = false;
        ajouter(groupe, m);
        bilan.morceaux++;
        bilan.triangles += q.n;
        q = macon();
      };
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dl = Math.hypot(b.x - a.x, b.z - a.z), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
        const croisee = croise(l, mx, mz);
        for (let j = 0; j < pr.length - 1; j++) {
          // au croisement d'un boyau : pas de paroi (ni de parapet) du côté où arrive le boyau ; dans le boyau : rien
          if (croisee && l.role === "boyau") continue;
          // (la paroi et les sacs du côté du boyau s'ouvrent : derrière pour la tranchée de tir, des deux côtés pour le soutien)
          if (croisee && (pr[j][1] >= 0.03 || pr[j + 1][1] >= 0.03) && (l.avant ? pr[j][0] < 0 : true)) continue;
          const A = sommets[i][j], B = sommets[i + 1][j], C2 = sommets[i + 1][j + 1], D = sommets[i][j + 1];
          const larg = Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2]);
          q.quad(A, B, C2, D, pr[j][2], lg, 0, lg + dl, larg, pr[j][3]);
        }
        // le CAILLEBOTIS au fond (pas dans les boyaux croisés)
        if (!croisee || l.role !== "boyau") {
          const yA = T.hauteurExacte(a.x, a.z) - TR.P.profondeur * Math.min(1, Math.max(0, Math.min(a.le - l.de, l.a - a.le) / 3 + 0.4)) + 0.07;
          const yB = T.hauteurExacte(b.x, b.z) - TR.P.profondeur * Math.min(1, Math.max(0, Math.min(b.le - l.de, l.a - b.le) / 3 + 0.4)) + 0.07;
          const w0 = l.avant ? -0.48 : -0.32, w1 = l.avant ? 0.12 : 0.32;
          q.quad([a.x + N[i][0] * w0, yA, a.z + N[i][1] * w0], [b.x + N[i + 1][0] * w0, yB, b.z + N[i + 1][1] * w0], [b.x + N[i + 1][0] * w1, yB, b.z + N[i + 1][1] * w1], [a.x + N[i][0] * w1, yA, a.z + N[i][1] * w1], 2, lg, 0, lg + dl, w1 - w0, 0.9);
        }
        // les ABRIS (les « cagnas ») : une entrée sombre dans la paroi arrière de la tranchée de tir, tous les ~70 m
        if (l.avant && !croisee && i % 28 === 13) {
          const v = -TR.P.fond - 0.02, px = mx + ((N[i][0] + N[i + 1][0]) / 2) * v, pz = mz + ((N[i][1] + N[i + 1][1]) / 2) * v, y0 = T.hauteurExacte(mx, mz) - TR.P.profondeur;
          const ang = Math.atan2(b.z - a.z, b.x - a.x), ca = Math.cos(ang), sa = Math.sin(ang), nx = (N[i][0] + N[i + 1][0]) / 2, nz = (N[i][1] + N[i + 1][1]) / 2;
          const p = (du, dy, dn) => [px + ca * du + nx * dn, y0 + dy, pz + sa * du + nz * dn];
          q.quad(p(-0.55, 0, 0.06), p(0.55, 0, 0.06), p(0.55, 1.35, 0.06), p(-0.55, 1.35, 0.06), 1, 0, 0, 1.1, 1.35, [0.05, 0.04, 0.03]); // le trou noir
          for (const du of [-0.62, 0.62]) q.boite(px + ca * du + nx * 0.1, y0 + 0.75, pz + sa * du + nz * 0.1, 0.14, 1.5, 0.14, ang, 0, 0.55);
          q.boite(px + nx * 0.1, y0 + 1.47, pz + nz * 0.1, 1.5, 0.16, 0.18, ang, 0, 0.5);
          bilan.abris++;
        }
        lg += dl;
        long += dl;
        if (long > LONG) (vider(), (long = 0));
      }
      vider();
    }
  }

  // ------------------------------------------------------------------ 2. LES BARBELÉS (les piquets, les fils, la spirale)
  const fils = []; // { lignes (LineSegments), plages: [{ seg, debut, fin }] }
  function construireBarbeles(groupe, ajouter) {
    const matFil = new THREE.LineBasicMaterial({ color: 0x2a2724 });
    for (const b of TR.barbeles) {
      const pos = [], plages = [], piquets = macon();
      const sol = (x, z) => T.hauteurExacte(x, z);
      const avant = TR.barbeles.indexOf(b) % 2 === 0; // (le 1er rang a aussi la spirale)
      for (const g of b.segments) {
        const debut = pos.length / 3, L = g.x1 - g.x0, n = Math.max(2, Math.round(L / 2.7));
        let prec = null;
        for (let k = 0; k <= n; k++) {
          const x = g.x0 + (L * k) / n, z = g.z + Math.sin(x * 0.37) * 0.3, y = sol(x, z), penche = (hasard() - 0.5) * 0.25;
          piquets.boite(x, y + 0.62, z, 0.06, 1.3, 0.06, 0, 0, 0.32, penche);
          bilan.piquets++;
          if (prec) {
            // 3 fils qui pendent un peu, et 2 fils en croix
            for (const hf of [0.32, 0.72, 1.1]) {
              const mxp = (prec.x + x) / 2, mzp = (prec.z + z) / 2, my = (prec.y + y) / 2 + hf - 0.07;
              pos.push(prec.x, prec.y + hf, prec.z, mxp, my, mzp, mxp, my, mzp, x, y + hf, z);
            }
            pos.push(prec.x, prec.y + 0.2, prec.z, x, y + 1.15, z, prec.x, prec.y + 1.15, prec.z, x, y + 0.2, z);
            // la spirale (le « concertina ») entre deux piquets : une hélice de 45 cm de rayon
            if (avant) {
              const tours = Math.round(Math.hypot(x - prec.x, z - prec.z) / 0.55), m = 7;
              let av = null;
              for (let t = 0; t <= tours * m; t++) {
                const u = t / (tours * m), a = (t / m) * Math.PI * 2, px = prec.x + (x - prec.x) * u, pz = prec.z + (z - prec.z) * u + 1.3 * Math.cos(a) * 0.45;
                const py = prec.y + (y - prec.y) * u + 0.48 + Math.sin(a) * 0.45;
                if (av) pos.push(av[0], av[1], av[2], px, py, pz);
                av = [px, py, pz];
              }
            }
          }
          prec = { x, y, z };
        }
        plages.push({ seg: g, debut, fin: pos.length / 3 });
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.computeBoundingSphere();
      const lignes = new THREE.LineSegments(geo, matFil);
      lignes.userData.original = Float32Array.from(pos);
      groupe.add(lignes);
      fils.push({ lignes, plages });
      bilan.fils += pos.length / 6;
      const m = new THREE.Mesh(piquets.geo(), matiereTranchee());
      m.castShadow = true;
      m.receiveShadow = true;
      ajouter(groupe, m);
    }
  }
  // (un tronçon coupé : ses fils sont tous ramenés en un point, au pied d'un piquet — on ne les voit plus)
  function majBarbeles() {
    if (bilan.version === TR.versionBarbeles) return;
    bilan.version = TR.versionBarbeles;
    bilan.coupes = 0;
    for (const f of fils) {
      const p = f.lignes.geometry.attributes.position, a = p.array, o = f.lignes.userData.original;
      for (const pl of f.plages) {
        if (pl.seg.coupe) {
          bilan.coupes++;
          for (let i = pl.debut; i < pl.fin; i++) (a[i * 3] = o[pl.debut * 3]), (a[i * 3 + 1] = o[pl.debut * 3 + 1] - 0.2), (a[i * 3 + 2] = o[pl.debut * 3 + 2]);
        } else for (let i = pl.debut * 3; i < pl.fin * 3; i++) a[i] = o[i];
      }
      p.needsUpdate = true;
    }
  }

  // ------------------------------------------------------------------ 3. LES ARBRES DÉCHIQUETÉS
  function construireArbres(groupe) {
    const g = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    const R = TR.R, n = C.tranchees.arbresBrises || 120;
    const tronc = new THREE.CylinderGeometry(0.16, 0.3, 1, 7, 3, true);
    const p = tronc.attributes.position;
    for (let i = 0; i < p.count; i++) if (p.getY(i) > 0.45) p.setY(i, 0.5 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.25); // (le haut cassé, en dents)
    tronc.computeVertexNormals();
    const liste = [];
    for (let k = 0; k < n * 4 && liste.length < n; k++) {
      const x = R.x[0] + hasard() * (R.x[1] - R.x[0]), z = (hasard() * 2 - 1) * (R.arriere + 20);
      if (TR.creux(x, z) > 0 || Math.hypot(x, z) < 70 || Math.abs(Math.abs(z) - (R.feu - R.barbeles.rangs[0])) < 6) continue;
      liste.push({ x, z, h: 2 + hasard() * 6, a: hasard() * 6.28, penche: (hasard() - 0.5) * 0.3 });
    }
    for (const a of liste) {
      const t = O.piece(tronc.clone(), mat, a.x, T.hauteurExacte(a.x, a.z) + a.h / 2 - 0.1, a.z, hasard() < 0.5 ? 0x2c2620 : 0x3e342a);
      t.scale.set(1 + a.h * 0.05, a.h, 1 + a.h * 0.05);
      t.rotation.set(a.penche, a.a, a.penche * 0.5);
      g.add(t);
      if (hasard() < 0.6) { // une branche cassée
        const b = O.piece(new THREE.CylinderGeometry(0.04, 0.08, 1.4, 5), mat, a.x + 0.35, T.hauteurExacte(a.x, a.z) + a.h * 0.7, a.z, 0x2a241e);
        b.rotation.set(0, a.a, 1);
        g.add(b);
      }
    }
    bilan.arbres = liste.length;
    for (const m of O.souder(g, true)) (m.receiveShadow = true), groupe.add(m);
  }

  // ------------------------------------------------------------------ 4. LA PEINTURE DU SOL (dans la grande image du décor)
  function peindreSol(ctx, X, k, h) {
    if (!TR.reseau) return;
    const R = TR.R;
    // une grande nappe de boue sur tout le front (plus sombre au milieu du no man's land)
    for (let i = 0, n = R.boue === undefined ? 1600 : R.boue; i < n; i++) { // (demande 115, Europe de l'Est : « boue » : moins de boue, la neige reste)
      const x = R.x[0] + h() * (R.x[1] - R.x[0]), z = (h() * 2 - 1) * (R.arriere + 40), r = (6 + h() * 22) * k;
      const g = ctx.createRadialGradient(X(x), X(z), 0, X(x), X(z), r);
      g.addColorStop(0, "rgba(" + (52 + h() * 20) + "," + (42 + h() * 14) + ",30," + (0.25 + h() * 0.3) + ")");
      g.addColorStop(1, "rgba(60,48,34,0)");
      ctx.fillStyle = g;
      ctx.fillRect(X(x) - r, X(z) - r, r * 2, r * 2);
    }
    // la terre rejetée de chaque côté des tranchées (plus claire, jaunâtre : la craie et l'argile)
    for (const l of TR.lignes) {
      const pts = pointsDe(l, 4);
      ctx.lineCap = ctx.lineJoin = "round";
      for (const [larg, coul] of [[9, "rgba(120,104,78,0.45)"], [5, "rgba(104,90,66,0.6)"]]) {
        ctx.strokeStyle = coul;
        ctx.lineWidth = larg * k;
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), X(p.z)) : ctx.moveTo(X(p.x), X(p.z))));
        ctx.stroke();
      }
    }
    // les CRATÈRES : un fond sombre (de l'eau boueuse dans certains), un bord de terre retournée plus claire
    for (const c of TR.crateres) {
      const x = X(c.x), y = X(c.z), r = c.r * k;
      let g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.45);
      g.addColorStop(0, "rgba(118,100,74,0.55)"), g.addColorStop(1, "rgba(118,100,74,0)");
      ctx.fillStyle = g, ctx.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);
      g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c.eau ? "rgba(88,92,86,0.95)" : "rgba(34,26,18,0.85)"), g.addColorStop(c.eau ? 0.5 : 0.7, c.eau ? "rgba(60,56,46,0.9)" : "rgba(50,40,28,0.6)"), g.addColorStop(1, "rgba(70,56,40,0)");
      ctx.fillStyle = g, ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // ------------------------------------------------------------------ 5. LE TROU DANS LE SOL (le programme du sol)
  function trouerSol(sh) {
    if (!TR.reseau) return;
    const L = TR.lignes.slice(0, 24), A = [], B = [];
    for (const l of L) A.push(new THREE.Vector4(l.sorte === "x" ? 0 : 1, l.c, l.A, l.P)), B.push(new THREE.Vector4(l.phase * l.P, l.k, l.de, l.a));
    while (A.length < 24) A.push(new THREE.Vector4(0, 0, 0, 1)), B.push(new THREE.Vector4(0, 1, 1, 0));
    sh.uniforms.trA = { value: A };
    sh.uniforms.trB = { value: B };
    sh.uniforms.trBord = { value: TR.P.bord - 0.12 };
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec4 trA[24];\nuniform vec4 trB[24];\nuniform float trBord;\nfloat trTri(float t) { return 4.0 * abs(t - floor(t + 0.5)) - 1.0; }")
      .replace("void main() {", "void main() {\n  {\n    vec2 tp = vSolMonde.xz;\n    for (int i = 0; i < 24; i++) {\n      vec4 a = trA[i]; vec4 b = trB[i];\n      float le = a.x < 0.5 ? tp.x : tp.y; float tr = a.x < 0.5 ? tp.y : tp.x;\n      if (le < b.z || le > b.w) continue;\n      float d = (tr - (a.y + a.z * trTri((le + b.x) / a.w))) * b.y;\n      if (abs(d) < trBord) discard;\n    }\n  }");
  }

  // ------------------------------------------------------------------ 6. LA MITRAILLEUSE LOURDE (pour affichage/engins3d.js)
  // Nez vers x+, posée sur le parapet (y = 0 : le sol où est son trépied). « tourelle » : ce qui tourne (le canon, le bouclier) ;
  // « canon » : ce qui se lève. « feu » : l'éclair au bout.
  function mitrailleuse(equipe) {
    const M = Tanks.Chars3D.materiaux(), g = new THREE.Group(), fixe = new THREE.Group(), tourelle = new THREE.Group(), canon = new THREE.Group();
    const acier = 0x34363a, bronze = 0x6b5a3a, bois = 0x5a4026, sac = 0x8a7a5a, olive = equipe === "bleus" ? 0x4c5a4a : 0x4e5048;
    // les sacs de sable en arc devant (le « nid »)
    for (let k = -3; k <= 3; k++) for (let r = 0; r < 2; r++) {
      const a = k * 0.33, s = O.piece(new THREE.SphereGeometry(0.3, 8, 5), M.teinte, Math.cos(a) * (1.35 + r * 0.05), 0.12 + r * 0.24, Math.sin(a) * 1.35, sac - r * 0x080808);
      s.scale.set(0.55, 0.45, 1.05);
      s.rotation.y = -a;
      fixe.add(s);
    }
    // le trépied
    for (const [dx, dz] of [[0.75, 0], [-0.55, 0.5], [-0.55, -0.5]]) {
      const p = O.tube([0, 0.62, 0], [dx, 0.02, dz], 0.025, M.teinte, 6, acier);
      fixe.add(p);
    }
    fixe.add(O.boite(0.18, 0.12, 0.18, M.teinte, 0, 0.62, 0, acier));
    // ce qui tourne : le berceau, la carcasse, le manchon à eau (avec ses cannelures), le bouclier, la caisse de bande
    tourelle.position.set(0, 0.7, 0);
    canon.position.set(0, 0, 0);
    canon.add(O.boite(0.42, 0.16, 0.14, M.teinte, -0.05, 0.08, 0, acier)); // la carcasse
    const manchon = O.cylindre(0.055, 0.055, 0.82, M.teinte, 14, bronze);
    manchon.rotation.z = Math.PI / 2, manchon.position.set(0.55, 0.1, 0);
    canon.add(manchon);
    for (let k = 0; k < 6; k++) { const a = O.cylindre(0.06, 0.06, 0.02, M.teinte, 14, 0x4a3e28); a.rotation.z = Math.PI / 2; a.position.set(0.22 + k * 0.13, 0.1, 0); canon.add(a); }
    const bout = O.cylindre(0.022, 0.03, 0.12, M.teinte, 8, acier);
    bout.rotation.z = Math.PI / 2, bout.position.set(1.02, 0.1, 0);
    canon.add(bout);
    canon.add(O.boite(0.08, 0.16, 0.04, M.teinte, -0.3, 0.06, 0.08, bois), O.boite(0.08, 0.16, 0.04, M.teinte, -0.3, 0.06, -0.08, bois)); // les poignées
    canon.add(O.boite(0.03, 0.08, 0.02, M.teinte, 0.05, 0.2, 0, acier), O.boite(0.03, 0.06, 0.02, M.teinte, 0.9, 0.19, 0, acier)); // la hausse, le guidon
    canon.add(O.tube([0.3, 0.02, 0.06], [0.1, -0.5, 0.35], 0.02, M.teinte, 6, 0x2a2a28)); // le tuyau de refroidissement
    const bouclier = O.boite(0.03, 0.62, 0.66, M.teinte, 0.18, 0.12, 0, olive);
    canon.add(bouclier);
    canon.add(O.boite(0.24, 0.18, 0.12, M.teinte, -0.08, -0.06, 0.24, olive)); // la caisse de bandes
    canon.add(O.boite(0.22, 0.03, 0.06, M.teinte, -0.02, 0.07, 0.15, 0xb08a40)); // la bande de cartouches
    const feu = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false }));
    feu.position.set(1.12, 0.1, 0);
    feu.scale.set(2.2, 1, 1);
    feu.userData.garder = true;
    canon.add(feu);
    for (const m of O.souder(canon, true)) canon.add(m);
    tourelle.add(canon);
    // le servant (une figurine accroupie derrière, les mains sur les poignées)
    if (Tanks.Engins3D && Tanks.Engins3D.outils) {
      const fig = Tanks.Engins3D.outils.figurine(equipe, (r, bras) => {
        for (const j of r.jambes) j.rotation.z = 1.1;
        for (const k2 of r.genoux) k2.rotation.z = -1.5;
        r.dos.rotation.z = 0.25;
        bras(r.epaules[0], r.coudes[0], [0.42, -0.05, 0.08], new THREE.Vector3(-0.2, -1, 0.7));
        bras(r.epaules[1], r.coudes[1], [0.42, -0.05, -0.08], new THREE.Vector3(-0.2, -1, -0.7));
      }, false, 0);
      fig.position.set(-0.78, -0.55, 0);
      fig.name = "servant";
      tourelle.add(fig);
    }
    for (const m of O.souder(fixe, true)) fixe.add(m);
    g.add(fixe, tourelle);
    return { g, tourelle, canon, feu, servant: tourelle.getObjectByName("servant") };
  }

  // ------------------------------------------------------------------ la construction et chaque image
  function construire(groupe, ajouter) {
    if (!TR.reseau) return; // (1944 : pas de tranchées, seulement des nids de mitrailleuse)
    const t0 = performance.now();
    construireTranchees(groupe, ajouter);
    construireBarbeles(groupe, ajouter);
    construireArbres(groupe);
    bilan.ms = Math.round(performance.now() - t0);
  }
  function maj() {
    if (!TR.reseau) return;
    majBarbeles();
  }

  return { construire, maj, trouerSol, peindreSol, mitrailleuse, bilan };
})();
