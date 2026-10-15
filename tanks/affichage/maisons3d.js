// 🏘️ LES MAISONS EN 3D : le décorateur de cinéma… et l'équipe des cascades (étape 75)
//
// ✍️ « Si tu tires dessus, cela se détruit, et je veux que ce soit un peu réaliste. » Les maisons sont ENTIÈRES au
// début, et jolies : des murs crépis (de couleur crème, ocre, rose, blanc…) avec des coins en pierre, un socle en pierre,
// des bandeaux entre les étages, des FENÊTRES avec leur cadre, leurs carreaux, leur appui en pierre et leurs VOLETS
// ouverts, une PORTE en bois avec sa marche, un TOIT de tuiles à deux pentes (avec son faîtage, ses rives et son
// dessous en bois) et une CHEMINÉE. Les granges ont un bas en pierre, un haut en planches et une grande porte ; les
// murets sont en pierres sèches ; les haies, des buissons.
// Comment on les casse :
//   - chaque MORCEAU de mur (logique/structures.js) est dessiné comme une vraie boîte : quand son voisin tombe, on voit
//     l'épaisseur du mur (les briques de la tranche) — c'est ça qui fait un VRAI trou ;
//   - tous les morceaux d'un quartier (140 m) et d'une même matière sont recollés en UN seul objet (comme avant, c'est
//     rapide). Chaque sommet porte un petit nombre, son « état » : 1 = neuf, 0,3 = très abîmé, −1 = tombé. Le
//     programme de la carte graphique (le « shader ») lit ce nombre : un morceau tombé est écrasé en un point (invisible,
//     sans ombre), un morceau abîmé est plus sombre et poussiéreux, et sous la moitié de sa vie, ses vitres se brisent.
//     Pour casser un morceau, on ne change donc que ce petit nombre (la carte graphique ne recopie que ce petit bout) ;
//   - une balle laisse un petit TROU (une « décalcomanie » : une petite image collée sur le mur) et un nuage de poussière ;
//     une explosion laisse une trace NOIRE ;
//   - un morceau qui tombe se casse en DÉBRIS qui volent (vitesse, gravité, rebonds, puis ils s'arrêtent et restent par
//     terre : les gravats), avec un nuage de poussière ;
//   - quand la maison S'EFFONDRE, son toit tombe d'un bloc (il s'enfonce et penche) dans un grand nuage de poussière.
// Les débris en vol, les gravats, les trous et les traces sont des « instances » (une seule forme, dessinée à des
// centaines d'endroits) avec un nombre maximum (config.js : structures.debris) : au-delà, on réutilise les plus vieux.
// Comme tout l'affichage, ce fichier LIT le monde (les morceaux tombés, leur vie) et ne le change jamais.

window.Tanks = window.Tanks || {};

Tanks.Maisons3D = (function () {
  const C = Tanks.CONFIG, S = C.structures, D = S.debris, T = Tanks.Terrain;
  const ST = () => Tanks.Structures;
  const bilan = { lots: 0, sommets: 0, trous: 0, brulures: 0, debrisVol: 0, gravats: 0, gravatsFixes: 0, toitsTombes: 0, morceauxCaches: 0, misesAJour: 0 };
  let etat = 7575;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  const fois = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  // ------------------------------------------------------------------ les images (peintes au démarrage)
  function toile(taille, peindre, metres) {
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (metres) t.repeat.set(1 / metres, 1 / metres);
    return t;
  }
  const gris = (v, a) => "rgba(" + v + "," + v + "," + v + "," + a + ")";
  // Des BRIQUES (avec leurs joints) : pour la tranche des murs cassés, les cheminées, les plaques sous le crépi.
  function briques(ctx, x0, y0, l, h, px, k) {
    const bl = 0.22 * px, bh = 0.068 * px;
    for (let y = y0, r = 0; y < y0 + h; y += bh, r++) for (let x = x0 - (r % 2) * bl * 0.5; x < x0 + l; x += bl) {
      const v = 0.75 + hasard() * 0.35;
      ctx.fillStyle = "rgba(" + Math.floor(190 * v * k) + "," + Math.floor(112 * v * k) + "," + Math.floor(84 * v * k) + ",1)";
      ctx.fillRect(x + 1, y + 1, bl - 2, bh - 2);
    }
  }
  function textures() {
    const t = {};
    // le CRÉPI (4 m × 4 m) : blanc cassé (la couleur de la maison est dans les sommets), grain, taches, coulures, et des
    // plaques où le crépi est tombé et où l'on voit les briques
    t.mur = toile(512, (ctx, n) => {
      ctx.fillStyle = "#e9e6de";
      ctx.fillRect(0, 0, n, n);
      for (let i = 0; i < 26000; i++) (ctx.fillStyle = gris(hasard() < 0.5 ? 0 : 255, hasard() * 0.07)), ctx.fillRect(hasard() * n, hasard() * n, 1 + hasard() * 2, 1 + hasard() * 2);
      for (let i = 0; i < 70; i++) {
        const x = hasard() * n, y = hasard() * n, r = 15 + hasard() * 60, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, hasard() < 0.6 ? "rgba(80,70,50,0.07)" : "rgba(255,255,255,0.08)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 22; i++) { // les coulures (sous les fenêtres, sous le toit)
        const x = hasard() * n, y = hasard() * n, l = 40 + hasard() * 140, g = ctx.createLinearGradient(x, y, x, y + l);
        g.addColorStop(0, "rgba(60,55,40,0.09)");
        g.addColorStop(1, "rgba(60,55,40,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, 3 + hasard() * 8, l);
      }
      for (let i = 0; i < 2; i++) { // une ou deux plaques de crépi tombé : on voit les briques (estompées)
        const x = hasard() * n * 0.8, y = hasard() * n * 0.8, l = 26 + hasard() * 40, h = 16 + hasard() * 24;
        ctx.save();
        ctx.beginPath();
        for (let a = 0; a < 14; a++) {
          const an = (a / 14) * Math.PI * 2, rr = 0.65 + hasard() * 0.4;
          ctx.lineTo(x + l / 2 + Math.cos(an) * l * 0.5 * rr, y + h / 2 + Math.sin(an) * h * 0.5 * rr);
        }
        ctx.closePath();
        ctx.fillStyle = "#b0a49a";
        ctx.fill();
        ctx.clip();
        ctx.globalAlpha = 0.55;
        briques(ctx, x, y, l, h, 128, 1.05);
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = "rgba(120,110,100,0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }, 4);
    // les BRIQUES (2 m × 2 m)
    t.brique = toile(512, (ctx, n) => {
      ctx.fillStyle = "#9a9284";
      ctx.fillRect(0, 0, n, n);
      briques(ctx, 0, 0, n, n, 256, 1);
      for (let i = 0; i < 9000; i++) (ctx.fillStyle = gris(hasard() < 0.5 ? 0 : 255, hasard() * 0.1)), ctx.fillRect(hasard() * n, hasard() * n, 2, 2);
    }, 2);
    // les PIERRES (3 m × 3 m) : des moellons de formes et de gris différents, et leurs joints
    t.pierre = toile(512, (ctx, n) => {
      ctx.fillStyle = "#8d877a";
      ctx.fillRect(0, 0, n, n);
      for (let y = 0; y < n; y += 26 + hasard() * 10) {
        const h = 24 + hasard() * 14;
        for (let x = -hasard() * 40; x < n; ) {
          const l = 30 + hasard() * 50, v = 150 + Math.floor(hasard() * 70), w = Math.floor(v * (0.93 + hasard() * 0.08));
          for (const dx of [0, n]) {
            ctx.fillStyle = "rgb(" + v + "," + w + "," + Math.floor(v * 0.86) + ")";
            ctx.beginPath();
            ctx.moveTo(x + dx + 3 + hasard() * 3, y + 2);
            ctx.lineTo(x + dx + l - 2, y + 1 + hasard() * 4);
            ctx.lineTo(x + dx + l - 1 - hasard() * 4, y + h - 2);
            ctx.lineTo(x + dx + 2, y + h - 1 - hasard() * 3);
            ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fillRect(x + dx + 4, y + 3, l - 8, 3);
          }
          x += l;
        }
      }
      for (let i = 0; i < 12000; i++) (ctx.fillStyle = gris(hasard() < 0.5 ? 0 : 255, hasard() * 0.12)), ctx.fillRect(hasard() * n, hasard() * n, 2, 2);
    }, 3);
    // les TUILES (4 m × 4 m) : des rangées de tuiles canal (le long de la pente), un peu de mousse et des taches
    t.toit = toile(512, (ctx, n) => {
      ctx.fillStyle = "#2c2622";
      ctx.fillRect(0, 0, n, n);
      const lt = 34, ht = 44;
      for (let y = 0; y < n; y += ht) for (let x = (y / ht) % 2 ? -lt / 2 : 0; x < n; x += lt) {
        const v = 0.78 + hasard() * 0.3, chaud = hasard() * 18, g = ctx.createLinearGradient(x, 0, x + lt, 0);
        const c = (k) => "rgb(" + Math.min(255, Math.floor((228 + chaud) * v * k)) + "," + Math.floor(218 * v * k) + "," + Math.floor(206 * v * k) + ")";
        g.addColorStop(0, c(0.58));
        g.addColorStop(0.42, c(1.0));
        g.addColorStop(0.6, c(0.95));
        g.addColorStop(1, c(0.55));
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y, lt - 2, ht - 2);
        const o = ctx.createLinearGradient(0, y + ht - 12, 0, y + ht); // l'ombre de la rangée du dessus
        o.addColorStop(0, "rgba(0,0,0,0)");
        o.addColorStop(1, "rgba(0,0,0,0.5)");
        ctx.fillStyle = o;
        ctx.fillRect(x + 1, y + ht - 12, lt - 2, 12);
      }
      for (let i = 0; i < 34; i++) { // la mousse, le lichen et la saleté
        const x = hasard() * n, y = hasard() * n, r = 10 + hasard() * 40, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const k = hasard();
        g.addColorStop(0, k < 0.4 ? "rgba(90,105,55,0.35)" : k < 0.7 ? "rgba(40,35,30,0.3)" : "rgba(235,230,210,0.25)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 9000; i++) (ctx.fillStyle = gris(hasard() < 0.5 ? 0 : 255, hasard() * 0.1)), ctx.fillRect(hasard() * n, hasard() * n, 2, 2);
    }, 4);
    // le BOIS (2 m × 2 m) : des planches verticales avec leurs veines et leurs fentes
    t.bois = toile(256, (ctx, n) => {
      ctx.fillStyle = "#cfc7b8";
      ctx.fillRect(0, 0, n, n);
      const lp = n / 11;
      for (let k = 0; k < 11; k++) {
        const v = 0.85 + hasard() * 0.2;
        ctx.fillStyle = gris(Math.floor(215 * v), 1);
        ctx.fillRect(k * lp + 1, 0, lp - 2, n);
        for (let i = 0; i < 14; i++) {
          ctx.strokeStyle = gris(Math.floor(140 + hasard() * 60), 0.35);
          ctx.beginPath();
          const x = k * lp + 2 + hasard() * (lp - 4);
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + hasard() * 4 - 2, n * 0.3, x + hasard() * 4 - 2, n * 0.7, x, n);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(30,25,20,0.7)";
        ctx.fillRect(k * lp, 0, 1.5, n);
      }
    }, 2);
    // les FEUILLES de la haie (2 m × 2 m)
    t.haie = toile(256, (ctx, n) => {
      ctx.fillStyle = "#8f8f8f";
      ctx.fillRect(0, 0, n, n);
      for (let i = 0; i < 2600; i++) {
        const x = hasard() * n, y = hasard() * n, r = 2 + hasard() * 4, v = Math.floor(120 + hasard() * 135);
        ctx.fillStyle = gris(v, 0.85);
        for (const dx of [-n, 0, n]) for (const dy of [-n, 0, n]) (ctx.beginPath(), ctx.ellipse(x + dx, y + dy, r, r * 0.55, hasard() * 3, 0, Math.PI * 2), ctx.fill());
      }
    }, 2);
    t.grain = toile(128, (ctx, n) => {
      ctx.fillStyle = "#d8d8d8";
      ctx.fillRect(0, 0, n, n);
      for (let i = 0; i < 3000; i++) (ctx.fillStyle = gris(Math.floor(hasard() * 255), 0.3)), ctx.fillRect(hasard() * n, hasard() * n, 2, 2);
    });
    // un TROU de balle : le trou noir au milieu, un cratère d'éclats clairs autour, et des fissures
    t.trou = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 64;
      const ctx = c.getContext("2d");
      ctx.beginPath();
      for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2, r = 17 + hasard() * 10; ctx.lineTo(32 + Math.cos(an) * r, 32 + Math.sin(an) * r); }
      ctx.closePath();
      ctx.fillStyle = "rgba(150,140,125,0.9)";
      ctx.fill();
      ctx.strokeStyle = "rgba(40,35,30,0.6)";
      for (let k = 0; k < 6; k++) { const an = hasard() * 6.3; ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(32 + Math.cos(an) * 30, 32 + Math.sin(an) * 30); ctx.stroke(); }
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 13);
      g.addColorStop(0, "rgba(10,8,6,1)");
      g.addColorStop(0.55, "rgba(40,32,26,0.95)");
      g.addColorStop(1, "rgba(90,80,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tx = new THREE.CanvasTexture(c);
      tx.colorSpace = THREE.SRGBColorSpace;
      return tx;
    })();
    // une trace NOIRE d'explosion (la suie)
    t.brulure = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d");
      for (let i = 0; i < 40; i++) {
        const x = 64 + (hasard() - 0.5) * 50, y = 64 + (hasard() - 0.5) * 50, r = 14 + hasard() * 40, g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(15,12,10,0.22)");
        g.addColorStop(1, "rgba(15,12,10,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
      }
      const tx = new THREE.CanvasTexture(c);
      tx.colorSpace = THREE.SRGBColorSpace;
      return tx;
    })();
    return t;
  }

  // ------------------------------------------------------------------ les « lots » : une matière d'un quartier
  // Pendant la construction, on empile les sommets (position, normale, coordonnées de texture, couleur) dans des
  // listes ; à la fin, chaque lot devient UN objet 3D. On garde une copie des positions et des couleurs de départ (pour
  // faire réapparaître un morceau à la bataille suivante, et pour salir un morceau abîmé).
  let mats = null, tex = null, profondeur = null;
  // (le « shader » des maisons : il lit l'état de chaque sommet. Tombé (< 0) : écrasé en un point, donc invisible et sans
  // ombre ; une vitre disparaît déjà sous 0,5 (brisée) ; abîmé : plus sombre et poussiéreux)
  function avecEtat(mat, verre, ombre) {
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float etat;\nvarying float vEtat;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEtat = etat;\nif (etat < " + (verre ? "0.5" : "0.0") + ") transformed = vec3(0.0);");
      if (ombre) return;
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vEtat;")
        .replace("#include <map_fragment>", "#include <map_fragment>\nfloat usure = 1.0 - clamp(vEtat, 0.0, 1.0);\ndiffuseColor.rgb = diffuseColor.rgb * (1.0 - 0.45 * usure) + vec3(0.07, 0.065, 0.055) * usure;");
    };
    mat.customProgramCacheKey = () => "maison-" + (verre ? "v" : "") + (ombre ? "o" : "");
  }
  const quartiers = new Map(); // numéro du quartier → { lots: { mur, brique, … } }
  const NOMS_LOTS = ["mur", "brique", "pierre", "toit", "bois", "verre", "haie"];
  function lotDe(q, nom) {
    return q.lots[nom] || (q.lots[nom] = { nom, pos: [], nor: [], uv: [], col: [], idx: [], geo: null });
  }
  // La place de la maison qu'on construit : son centre, la hauteur du sol, son angle (cos, sin).
  const M = { x: 0, y: 0, z: 0, c: 1, s: 0 };
  let salir = false; // (vrai pour les murs : le bas est plus sale, plus sombre)
  function sommet(L, u, y, v, nu, ny, nv, tu, tv, col) {
    L.pos.push(M.x + u * M.c - v * M.s, M.y + y, M.z + u * M.s + v * M.c);
    L.nor.push(nu * M.c - nv * M.s, ny, nu * M.s + nv * M.c);
    L.uv.push(tu, tv);
    const k = salir ? 0.74 + 0.26 * Math.min(1, Math.max(0, y) / 1.3) : 1;
    L.col.push(col[0] * k, col[1] * k, col[2] * k);
  }
  // Un quadrilatère (4 coins [u, y, v] dans le repère de la maison), tourné vers « n » ; uv : 4 paires.
  // (4 sommets et 2 triangles qui se les partagent : la liste « idx » dit quels sommets forment chaque triangle)
  function quad(L, a, b, c, d, n, uv, col) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const o = L.pos.length / 3, p = [a, b, c, d];
    for (let i = 0; i < 4; i++) sommet(L, p[i][0], p[i][1], p[i][2], n[0], n[1], n[2], uv[i * 2], uv[i * 2 + 1], col);
    if (cx * n[0] + cy * n[1] + cz * n[2] >= 0) L.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    else L.idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  }
  // Une BOÎTE alignée dans le repère de la maison. « choisir(face, valeur) » donne [lot, couleur] (ou null : pas de face).
  // faces : "+u", "-u", "+y", "-y", "+v", "-v" ; valeur : la coordonnée du plan de la face.
  function pave(u0, u1, y0, y1, v0, v1, choisir) {
    let r;
    if ((r = choisir("+v", v1))) quad(r[0], [u0, y0, v1], [u1, y0, v1], [u1, y1, v1], [u0, y1, v1], [0, 0, 1], [u0, y0, u1, y0, u1, y1, u0, y1], r[1]);
    if ((r = choisir("-v", v0))) quad(r[0], [u0, y0, v0], [u1, y0, v0], [u1, y1, v0], [u0, y1, v0], [0, 0, -1], [-u0, y0, -u1, y0, -u1, y1, -u0, y1], r[1]);
    if ((r = choisir("+u", u1))) quad(r[0], [u1, y0, v0], [u1, y0, v1], [u1, y1, v1], [u1, y1, v0], [1, 0, 0], [-v0, y0, -v1, y0, -v1, y1, -v0, y1], r[1]);
    if ((r = choisir("-u", u0))) quad(r[0], [u0, y0, v0], [u0, y0, v1], [u0, y1, v1], [u0, y1, v0], [-1, 0, 0], [v0, y0, v1, y0, v1, y1, v0, y1], r[1]);
    if ((r = choisir("+y", y1))) quad(r[0], [u0, y1, v0], [u1, y1, v0], [u1, y1, v1], [u0, y1, v1], [0, 1, 0], [u0, v0, u1, v0, u1, v1, u0, v1], r[1]);
    if ((r = choisir("-y", y0))) quad(r[0], [u0, y0, v0], [u1, y0, v0], [u1, y0, v1], [u0, y0, v1], [0, -1, 0], [u0, v0, u1, v0, u1, v1, u0, v1], r[1]);
  }
  const toutes = (L, col) => (f) => (f === "-y" || f === "dessous" ? null : [L, col]);
  // (une pièce posée contre le mur, dehors : sa face collée au mur ne se voit jamais, on ne la fait pas)
  const devant = (L, col) => (f) => (f === "dedans" || f === "dessous" || f === "-y" ? null : [L, col]);
  // Une boîte dans le repère d'un MUR : a le long du mur, y vers le haut, w en travers (w > 0 : vers l'extérieur).
  // « choisir(face, valeur) » reçoit "dehors", "dedans", "bout" (valeur = a), "dessus" ou "dessous" (valeur = y).
  function paveMur(mur, a0, a1, y0, y1, w0, w1, choisir) {
    const p0 = mur.pos + mur.sens * w0, p1 = mur.pos + mur.sens * w1, lo = Math.min(p0, p1), hi = Math.max(p0, p1);
    const traduire = (f, val) => {
      if (f === "+y") return choisir("dessus", val);
      if (f === "-y") return choisir("dessous", val);
      const long = mur.axe === "u" ? f[1] === "u" : f[1] === "v";
      if (long) return choisir("bout", val);
      return choisir((f[0] === "+") === (mur.sens > 0) ? "dehors" : "dedans", val);
    };
    if (mur.axe === "u") pave(a0, a1, y0, y1, lo, hi, traduire);
    else pave(lo, hi, y0, y1, a0, a1, traduire);
  }

  // ------------------------------------------------------------------ le style de chaque maison (couleurs)
  const CREPIS = ["#e9dcbf", "#dcb57e", "#e6c6b4", "#efebe1", "#cfcabd", "#e8d49c", "#d9c2a0"].map(lin);
  const VOLETS = ["#4f6e4a", "#5d7487", "#7a3b2e", "#6d6a3e", "#b9b5a8", "#7a5a3c", "#3f5c6e"].map(lin);
  const PORTES = ["#5a3d27", "#3f5a3a", "#6e2f25", "#4a3a2c"].map(lin);
  const TUILES = ["#c8704a", "#b05e40", "#c98a62", "#9c5a44", "#b9785a", "#a86a52"].map(lin);
  function style(b) {
    let g = (b.graine || 11) * 7 + 3;
    const h2 = () => ((g = (g * 1664525 + 1013904223) >>> 0) / 4294967296);
    const choix = (l) => l[Math.floor(h2() * l.length)];
    const s = { crepi: choix(CREPIS), volet: choix(VOLETS), porte: choix(PORTES), tuile: choix(TUILES), volets: h2() < 0.8, cheminee: h2() < 0.85, coteCheminee: h2() < 0.5 ? -1 : 1 };
    s.dedans = fois([0.86, 0.83, 0.78], 1);
    s.tranche = lin("#efe4da"); // (l'image des briques a déjà leur couleur)
    s.pierre = fois(lin("#c9bfae"), 0.9 + h2() * 0.15);
    s.cadre = h2() < 0.6 ? lin("#e8e4da") : s.volet;
    if (b.type === "grange") (s.crepi = lin("#a8a090")), (s.tuile = fois(lin("#8a6a58"), 0.85)), (s.planches = fois(lin("#8d7a62"), 0.85 + h2() * 0.2)), (s.porte = lin("#6a4b32"));
    if (b.type === "tour") (s.tuile = lin("#6d6a72")), (s.pierre = lin("#b8b0a2"));
    return s;
  }

  // ------------------------------------------------------------------ construire les morceaux d'une maison
  function emettreMorceau(b, mur, m, st, q) {
    const L = (nom) => lotDe(q, nom), ep = b.ep, w0 = -ep / 2, w1 = ep / 2;
    const pierreux = m.matiere === "pierre", boise = m.matiere === "bois" && !m.porte, haie = m.matiere === "haie";
    if (haie) return emettreHaie(b, mur, m, q);
    // les couleurs des faces : dehors (le crépi, les pierres, les planches), dedans, la tranche (les briques)
    const dehors = pierreux ? [L("pierre"), st.pierre] : boise ? [L("bois"), st.planches || st.porte] : [L("mur"), fois(st.crepi, 0.94 + hasard() * 0.1)];
    const dedans = pierreux ? [L("pierre"), fois(st.pierre, 0.8)] : boise ? [L("bois"), fois(st.planches || st.porte, 0.75)] : [L("mur"), st.dedans];
    const tranche = pierreux ? [L("pierre"), fois(st.pierre, 0.85)] : boise ? [L("bois"), fois(st.planches || st.porte, 0.7)] : [L("brique"), st.tranche];
    const o = m.ouverture;
    // les faces qui donnent dans le TROU d'une fenêtre ou d'une porte (le tableau) sont crépies ; les autres bords du
    // morceau sont la tranche du mur (les briques qu'on voit quand le voisin est tombé)
    const bordDuMorceau = (f, val) => (f === "bout" ? Math.abs(val - m.a0) < 1e-4 || Math.abs(val - m.a1) < 1e-4 : Math.abs(val - m.y0) < 1e-4 || Math.abs(val - m.y1) < 1e-4);
    const choisir = (f, val) => {
      if (f === "dehors") return dehors;
      if (f === "dedans") return dedans;
      if (f === "bout" && mur.axe === "u" && b.toit && Math.abs(Math.abs(val) - b.demiL) < 1e-4) return dehors; // (le coin de la maison : crépi)
      if (f === "dessous" && m.rang === 0 && Math.abs(val - m.y0) < 1e-4) return null;
      return bordDuMorceau(f, val) ? tranche : [dehors[0], fois(dehors[1], 0.92)];
    };
    salir = !boise;
    if (m.porte && b.type !== "grange") {
      const oa0 = (m.a0 + m.a1) / 2 - 0.52, oa1 = (m.a0 + m.a1) / 2 + 0.52, oy1 = Math.min(m.y1 - 0.35, 2.25);
      paveMur(mur, m.a0, m.a1, oy1, m.y1, w0, w1, choisir);
      paveMur(mur, m.a0, oa0, 0, oy1, w0, w1, choisir);
      paveMur(mur, oa1, m.a1, 0, oy1, w0, w1, choisir);
      salir = false;
      const bo = L("bois"), pi = L("pierre"), cp = st.porte;
      paveMur(mur, oa0, oa1, 0, oy1, w1 - 0.16, w1 - 0.1, toutes(bo, cp)); // la porte
      for (const [ya, yb] of [[0.22, 1.0], [1.18, oy1 - 0.18]]) paveMur(mur, oa0 + 0.1, oa1 - 0.1, ya, yb, w1 - 0.1, w1 - 0.085, devant(bo, fois(cp, 1.12))); // ses panneaux
      paveMur(mur, oa1 - 0.2, oa1 - 0.12, 1.0, 1.08, w1 - 0.1, w1 - 0.03, devant(bo, lin("#2a2620"))); // la poignée
      paveMur(mur, oa0 - 0.14, oa0, 0, oy1 + 0.16, w1 - 0.02, w1 + 0.035, devant(pi, st.pierre)); // l'encadrement en pierre
      paveMur(mur, oa1, oa1 + 0.14, 0, oy1 + 0.16, w1 - 0.02, w1 + 0.035, devant(pi, st.pierre));
      paveMur(mur, oa0 - 0.14, oa1 + 0.14, oy1, oy1 + 0.16, w1 - 0.02, w1 + 0.04, devant(pi, st.pierre));
      paveMur(mur, oa0 - 0.12, oa1 + 0.12, -0.15, 0.13, w1, w1 + 0.42, devant(pi, fois(st.pierre, 0.92))); // la marche
    } else if (m.porte) { // la grande porte de la grange : deux battants en planches, avec leurs traverses
      const oy1 = m.y1 - 0.25;
      paveMur(mur, m.a0, m.a1, oy1, m.y1, w0, w1, choisir);
      salir = false;
      const bo = L("bois"), c = st.porte;
      paveMur(mur, m.a0 + 0.02, m.a1 - 0.02, 0, oy1, w1 - 0.12, w1 - 0.04, toutes(bo, c));
      for (const y of [0.35, oy1 / 2, oy1 - 0.35]) paveMur(mur, m.a0 + 0.05, m.a1 - 0.05, y - 0.08, y + 0.08, w1 - 0.04, w1 + 0.0, devant(bo, fois(c, 0.8)));
    } else if (o) {
      paveMur(mur, m.a0, m.a1, m.y0, o.y0, w0, w1, choisir);
      paveMur(mur, m.a0, m.a1, o.y1, m.y1, w0, w1, choisir);
      paveMur(mur, m.a0, o.a0, o.y0, o.y1, w0, w1, choisir);
      paveMur(mur, o.a1, m.a1, o.y0, o.y1, w0, w1, choisir);
      salir = false;
      const bo = L("bois"), pi = L("pierre"), ve = L("verre"), cadre = st.cadre;
      const wc = w1 - (b.type === "grange" ? 0.06 : 0.14);
      // le cadre, la croix des carreaux, la vitre
      paveMur(mur, o.a0, o.a1, o.y0, o.y0 + 0.07, wc - 0.07, wc, devant(bo, cadre));
      paveMur(mur, o.a0, o.a1, o.y1 - 0.07, o.y1, wc - 0.07, wc, devant(bo, cadre));
      paveMur(mur, o.a0, o.a0 + 0.07, o.y0, o.y1, wc - 0.07, wc, devant(bo, cadre));
      paveMur(mur, o.a1 - 0.07, o.a1, o.y0, o.y1, wc - 0.07, wc, devant(bo, cadre));
      if (b.type !== "grange") {
        const ac = (o.a0 + o.a1) / 2, yc = o.y0 + (o.y1 - o.y0) * 0.62;
        paveMur(mur, ac - 0.022, ac + 0.022, o.y0, o.y1, wc - 0.06, wc - 0.01, devant(bo, cadre));
        paveMur(mur, o.a0, o.a1, yc - 0.022, yc + 0.022, wc - 0.06, wc - 0.01, devant(bo, cadre));
      }
      paveMur(mur, o.a0 + 0.05, o.a1 - 0.05, o.y0 + 0.05, o.y1 - 0.05, wc - 0.05, wc - 0.035, (f) => (f === "dehors" ? [ve, [1, 1, 1]] : null));
      if (b.type !== "grange" && b.type !== "tour") {
        // l'appui (en pierre, qui dépasse) et le linteau
        paveMur(mur, o.a0 - 0.07, o.a1 + 0.07, o.y0 - 0.07, o.y0 + 0.01, w1 - 0.1, w1 + 0.07, toutes(pi, st.pierre));
        paveMur(mur, o.a0 - 0.12, o.a1 + 0.12, o.y1, o.y1 + 0.17, w1 - 0.01, w1 + 0.02, devant(pi, fois(st.pierre, 0.95)));
        // les VOLETS, ouverts contre le mur, avec leurs deux barres
        if (st.volets) {
          const lv = (o.a1 - o.a0) / 2 + 0.02;
          for (const [va, vb] of [[o.a0 - lv - 0.03, o.a0 - 0.03], [o.a1 + 0.03, o.a1 + lv + 0.03]]) {
            paveMur(mur, va, vb, o.y0 + 0.02, o.y1 - 0.02, w1 + 0.004, w1 + 0.04, devant(bo, st.volet));
            for (const y of [o.y0 + 0.25, o.y1 - 0.25]) paveMur(mur, va + 0.03, vb - 0.03, y - 0.05, y + 0.05, w1 + 0.04, w1 + 0.055, devant(bo, fois(st.volet, 0.82)));
          }
        }
      }
    } else paveMur(mur, m.a0, m.a1, m.y0, m.y1, w0, w1, choisir);
    salir = false;
    if (!b.toit) { // un muret : de grosses pierres plates dessus
      paveMur(mur, m.a0, m.a1, m.y1, m.y1 + 0.12, w0 - 0.05, w1 + 0.05, toutes(L("pierre"), fois(st.pierre, 1.08)));
      return;
    }
    const pi = L("pierre");
    const nCol = mur.colonnes.length, rangs = Math.round(b.h / (m.y1 - m.y0));
    // le SOCLE en pierre (en bas), les BANDEAUX entre les étages, la CORNICHE sous le toit
    if (m.rang === 0 && b.type === "maison") {
      const bas = (a0, a1) => paveMur(mur, a0, a1, -0.15, 0.42, w1 - 0.02, w1 + 0.035, (f, v) => (f === "dessous" ? null : [pi, fois(st.pierre, 0.82)]));
      if (m.porte) (bas(m.a0, (m.a0 + m.a1) / 2 - 0.66), bas((m.a0 + m.a1) / 2 + 0.66, m.a1));
      else bas(m.a0, m.a1);
    }
    if (b.type === "maison" && m.rang < rangs - 1) paveMur(mur, m.a0, m.a1, m.y1 - 0.07, m.y1 + 0.09, w1 - 0.02, w1 + 0.03, devant(L("mur"), fois(st.crepi, 1.06)));
    if (b.type === "maison" && m.rang === rangs - 1) {
      const ext = (mur.axe === "u" && (m.c === 0 || m.c === nCol - 1)) ? 0.09 : 0;
      paveMur(mur, m.c === 0 ? m.a0 - ext : m.a0, m.c === nCol - 1 ? m.a1 + ext : m.a1, m.y1 - 0.2, m.y1, w1 - 0.02, w1 + 0.09, devant(L("mur"), fois(st.crepi, 1.04)));
    }
    // les PIERRES D'ANGLE (une sur deux, longue puis courte) aux coins de la maison, sur les deux faces du coin
    if (b.type !== "grange" && mur.axe === "u" && (m.c === 0 || m.c === nCol - 1)) {
      const su = m.c === 0 ? -1 : 1, sv = mur.sens, U = b.demiL, V = b.demiP;
      const tri = (a, c) => (a < c ? [a, c] : [c, a]);
      for (let y = m.y0 + (m.rang === 0 ? 0.42 : 0), k = 0; y < m.y1 - 0.05; y += 0.34, k++) {
        const y2 = Math.min(m.y1, y + 0.3), l1 = k % 2 ? 0.32 : 0.56, l2 = k % 2 ? 0.56 : 0.32, coul = fois(st.pierre, 0.92 + ((k * 37) % 10) / 60);
        const [ua, ub] = tri(su * (U + 0.025), su * (U - l1)), [va, vb] = tri(sv * (V - 0.01), sv * (V + 0.025));
        pave(ua, ub, y, y2, va, vb, toutes(pi, coul));
        const [ua2, ub2] = tri(su * (U - 0.01), su * (U + 0.025)), [va2, vb2] = tri(sv * V, sv * (V - l2));
        pave(ua2, ub2, y, y2, va2, vb2, toutes(pi, coul));
      }
    }
  }
  // Un morceau de HAIE : une boule de feuillage bosselée (une forme toute prête, étirée et tournée).
  let modeleHaie = null;
  function emettreHaie(b, mur, m, q) {
    if (!modeleHaie) {
      const g = new THREE.SphereGeometry(1, 8, 5), p = g.attributes.position, br = Tanks.Bruit.creer(7575);
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.18 * br(x * 2.1 + z, y * 2.3 - z);
        p.setXYZ(i, x * k, Math.max(-0.55, y) * k, z * k);
      }
      g.computeVertexNormals();
      modeleHaie = g;
    }
    const L = lotDe(q, "haie"), p = modeleHaie.attributes.position, n = modeleHaie.attributes.normal, uvA = modeleHaie.attributes.uv, o = L.pos.length / 3;
    const sa = (m.a1 - m.a0) * 0.68, sy = b.h * 0.62, sw = b.demiP * 1.5, ac = (m.a0 + m.a1) / 2;
    const vert = fois(lin("#5f7a3c"), 0.85 + hasard() * 0.25);
    for (let i = 0; i < p.count; i++) {
      const la = p.getX(i) * sa, ly = (p.getY(i) + 0.55) * sy, lw = p.getZ(i) * sw;
      let nu = n.getX(i) / sa, ny = n.getY(i) / sy, nw = n.getZ(i) / sw;
      const l = Math.hypot(nu, ny, nw) || 1;
      (nu /= l), (ny /= l), (nw /= l);
      const u = mur.axe === "u" ? ac + la : mur.pos + lw, v = mur.axe === "u" ? mur.pos + lw : ac + la;
      const nnu = mur.axe === "u" ? nu : nw, nnv = mur.axe === "u" ? nw : nu;
      const k = 0.55 + 0.45 * Math.min(1, ly / (sy * 1.3));
      sommet(L, u, ly - 0.12, v, nnu, ny, nnv, uvA.getX(i) * 3 + ac * 0.3, uvA.getY(i) * 1.5, fois(vert, k));
    }
    const idx = modeleHaie.index.array, retourne = mur.axe !== "u"; // (on a échangé u et v : les triangles changent de sens)
    for (let t = 0; t < idx.length; t += 3) {
      if (retourne) L.idx.push(o + idx[t], o + idx[t + 2], o + idx[t + 1]);
      else L.idx.push(o + idx[t], o + idx[t + 1], o + idx[t + 2]);
    }
  }
  // Le TOIT : deux pentes de tuiles (avec leur épaisseur, leur dessous en bois, les rives), le faîtage, les deux pignons
  // (les triangles de mur sous le toit), et la cheminée.
  // (cote : +1 ou −1 pour ne faire qu'une des deux pentes — quand le toit s'effondre, chaque pente tombe de son côté)
  function emettreToit(b, st, L, cote) {
    const hT = b.toit.hauteur, ov = b.type === "tour" ? 0.3 : 0.42, og = 0.3, et = 0.16, V = b.demiP, U = b.demiL, h = b.h;
    const pente = hT / V, ve = V + ov, ye = h - ov * pente, uA = -U - og, uB = U + og, yF = h + hT, lp = Math.hypot(ve, yF - ye);
    const ct = Math.cos(Math.atan(pente)), sn = Math.sin(Math.atan(pente)), decal = et / ct;
    const tu = L("toit"), bo = L("bois"), mu = L("mur");
    const dessous = fois(lin("#5a4634"), 0.9), rive = fois(lin("#6b5440"), 0.9);
    for (const s of cote ? [cote] : [1, -1]) {
      quad(tu, [uA, ye, s * ve], [uB, ye, s * ve], [uB, yF + 0.02, 0], [uA, yF + 0.02, 0], [0, ct, s * sn], [uA, 0, uB, 0, uB, lp, uA, lp], st.tuile);
      quad(bo, [uA, ye - decal, s * ve], [uB, ye - decal, s * ve], [uB, yF - decal, 0], [uA, yF - decal, 0], [0, -ct, -s * sn], [uA, 0, uB, 0, uB, lp, uA, lp], dessous);
      quad(bo, [uA, ye - decal, s * ve], [uB, ye - decal, s * ve], [uB, ye, s * ve], [uA, ye, s * ve], [0, 0, s], [uA, 0, uB, 0, uB, et, uA, et], rive);
      for (const [uu, su] of [[uA, -1], [uB, 1]]) quad(bo, [uu, ye - decal, s * ve], [uu, yF - decal, 0], [uu, yF + 0.02, 0], [uu, ye, s * ve], [su, 0, 0], [0, 0, lp, 0, lp, et, 0, et], rive);
    }
    // le faîtage : une rangée de tuiles rondes sur le sommet
    const rf = 0.14, nS = 6;
    for (let k = 0; k < nS && (!cote || cote > 0); k++) {
      const a0 = (k / nS) * Math.PI, a1 = ((k + 1) / nS) * Math.PI;
      const p = (a, u) => [u, yF + Math.sin(a) * rf * 0.9, Math.cos(a) * rf];
      quad(tu, p(a0, uA), p(a0, uB), p(a1, uB), p(a1, uA), [0, Math.sin((a0 + a1) / 2), Math.cos((a0 + a1) / 2)], [uA, 0, uB, 0, uB, 0.1, uA, 0.1], fois(st.tuile, 0.8));
    }
    // les pignons (un triangle de mur, des deux côtés de l'épaisseur)
    salir = false;
    for (const su of cote ? [] : [1, -1]) for (const [uu, sens] of [[su * U, su], [su * (U - b.ep), -su]]) {
      const coul = sens === su ? st.crepi : st.dedans;
      quad(mu, [uu, h - 0.01, -V], [uu, h - 0.01, V], [uu, yF - 0.05, 0.001], [uu, yF - 0.05, -0.001], [sens, 0, 0], [-V, h, V, h, 0, yF, 0, yF], coul);
    }
    // la cheminée (crépie, avec une dalle et un conduit)
    if (st.cheminee && b.type === "maison" && (!cote || cote > 0)) {
      const cu = st.coteCheminee * U * 0.55, cv = V * 0.32, y0 = h + hT * (1 - (cv + 0.3) / V) - 0.1, y1 = yF + 0.85, pi = L("pierre"), br = L("brique");
      pave(cu - 0.38, cu + 0.38, y0, y1, cv - 0.3, cv + 0.3, (f) => (f === "-y" ? null : [mu, fois(st.crepi, 0.95)]));
      pave(cu - 0.45, cu + 0.45, y1, y1 + 0.1, cv - 0.37, cv + 0.37, toutes(pi, st.pierre));
      pave(cu - 0.12, cu + 0.12, y1 + 0.1, y1 + 0.38, cv - 0.12, cv + 0.12, toutes(br, lin("#b0613f")));
    }
  }

  // ------------------------------------------------------------------ construire tout (une seule fois)
  const vues = new Map(); // structure → { morceaux: [{ plages, tombe, vie }], toit: plages, toitVu, changements, generation }
  let gravatsFixes = null, gravats = null, debrisVol = null, trous = null, brulures = null, dents = null, groupe = null;
  function plagesDepuis(q, avant) {
    const r = [];
    for (const nom in q.lots) {
      const L = q.lots[nom], d = avant[nom] || 0, f = L.pos.length / 3;
      if (f > d) r.push([L, d, f]);
    }
    return r;
  }
  const tailles = (q) => { const r = {}; for (const nom in q.lots) r[nom] = q.lots[nom].pos.length / 3; return r; };
  function construire(g, ajouterMorceau, numeroMorceau) {
    groupe = g;
    tex = textures();
    mats = {
      mur: new THREE.MeshStandardMaterial({ map: tex.mur, vertexColors: true, roughness: 0.95 }),
      brique: new THREE.MeshStandardMaterial({ map: tex.brique, vertexColors: true, roughness: 0.92 }),
      pierre: new THREE.MeshStandardMaterial({ map: tex.pierre, vertexColors: true, roughness: 0.93 }),
      toit: new THREE.MeshStandardMaterial({ map: tex.toit, vertexColors: true, roughness: 0.78 }),
      bois: new THREE.MeshStandardMaterial({ map: tex.bois, vertexColors: true, roughness: 0.85 }),
      verre: new THREE.MeshStandardMaterial({ color: 0x5d707c, emissive: 0x0d1418, metalness: 0.35, roughness: 0.06, envMapIntensity: 2.2 }),
      haie: new THREE.MeshStandardMaterial({ map: tex.haie, vertexColors: true, roughness: 0.96 }),
      gravats: new THREE.MeshStandardMaterial({ map: tex.grain, roughness: 0.95 }),
    };
    for (const nom of NOMS_LOTS) avecEtat(mats[nom], nom === "verre");
    profondeur = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    avecEtat(profondeur, false, true);
    for (const b of ST().liste) {
      const k = numeroMorceau(b.x, b.z), q = quartiers.get(k) || (quartiers.set(k, { lots: {} }), quartiers.get(k));
      const st = style(b);
      M.x = b.x; M.y = b.sol; M.z = b.z; M.c = Math.cos(b.angle); M.s = Math.sin(b.angle);
      const vue = { morceaux: [], toit: null, toitVu: true, changements: -1, generation: -1, style: st };
      for (const m of b.morceaux) {
        const avant = tailles(q);
        emettreMorceau(b, b.murs[m.mur], m, st, q);
        const c = centreLocal(b, m);
        vue.morceaux.push({ plages: plagesDepuis(q, avant), tombe: false, vie: m.vieMax, centre: c });
      }
      if (b.toit) {
        const avant = tailles(q);
        emettreToit(b, st, (nom) => lotDe(q, nom));
        vue.toit = plagesDepuis(q, avant);
      }
      vues.set(b, vue);
    }
    // chaque lot devient un objet 3D (avec, pour chaque sommet, son « état » : 1 = neuf)
    for (const [, q] of quartiers) {
      for (const nom of NOMS_LOTS) {
        const L = q.lots[nom];
        if (!L || !L.pos.length) continue;
        const geo = new THREE.BufferGeometry(), n = L.pos.length / 3;
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(L.pos), 3));
        geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(L.nor), 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(L.uv), 2));
        if (nom !== "verre") geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(L.col), 3));
        geo.setAttribute("etat", new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
        geo.setIndex(new THREE.BufferAttribute(n > 65535 ? new Uint32Array(L.idx) : new Uint16Array(L.idx), 1));
        geo.computeBoundingSphere();
        L.geo = geo;
        bilan.sommets += n;
        L.pos = L.nor = L.uv = L.col = L.idx = null;
        const mesh = new THREE.Mesh(geo, mats[nom]);
        mesh.customDepthMaterial = profondeur;
        mesh.castShadow = nom !== "verre";
        mesh.receiveShadow = true;
        ajouterMorceau(g, mesh);
        bilan.lots++;
      }
    }
    // les instances : les gravats (ceux des ruines du début, ceux de la bataille), les débris qui volent, les trous, les traces
    const caillou = geoCaillou();
    gravatsFixes = instances(caillou, mats.gravats, 1600);
    gravats = instances(caillou, mats.gravats, D.gravatsMax);
    debrisVol = instances(caillou, mats.gravats, D.vol);
    const plan = new THREE.PlaneGeometry(1, 1);
    const decal = (map, n) => {
      const m = new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, roughness: 1 });
      const im = instances(plan, m, n);
      im.castShadow = false;
      im.renderOrder = 1;
      return im;
    };
    trous = decal(tex.trou, D.trous);
    brulures = decal(tex.brulure, D.brulures);
    // les « dents » : des briques cassées qui dépassent du bord d'un trou (elles appartiennent au morceau voisin, encore debout)
    dents = instances(caillou, mats.gravats, D.trous);
    for (const im of [gravatsFixes, gravats, debrisVol, trous, brulures, dents]) g.add(im);
    trous.userData.qui = new Array(D.trous).fill(null);
    brulures.userData.qui = new Array(D.brulures).fill(null);
    dents.userData.qui = new Array(D.trous).fill(null);
    ecouter();
  }
  function instances(geo, mat, n) {
    const im = new THREE.InstancedMesh(geo, mat, n);
    im.count = 0;
    im.frustumCulled = false;
    im.castShadow = true;
    im.receiveShadow = true;
    im.setColorAt(0, new THREE.Color(1, 1, 1));
    return im;
  }
  // un morceau de mur cassé : un pavé un peu tordu (ses coins bougés au hasard), aux faces plates
  function geoCaillou() {
    const g = new THREE.BoxGeometry(1, 0.55, 0.75), p = g.attributes.position, coins = new Map();
    for (let i = 0; i < p.count; i++) {
      const cle = [p.getX(i), p.getY(i), p.getZ(i)].map((v) => v.toFixed(2)).join(",");
      if (!coins.has(cle)) coins.set(cle, [(hasard() - 0.5) * 0.3, (hasard() - 0.5) * 0.2, (hasard() - 0.5) * 0.25]);
      const d = coins.get(cle);
      p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
    }
    const r = g.toNonIndexed();
    r.computeVertexNormals();
    return r;
  }
  // le centre d'un morceau, dans le repère de la maison
  function centreLocal(b, m) {
    return [(m.u0 + m.u1) / 2, (m.y0 + m.y1) / 2, (m.v0 + m.v1) / 2];
  }
  const versMonde = (b, u, y, v, sortie) => {
    const c = Math.cos(b.angle), s = Math.sin(b.angle);
    sortie.x = b.x + u * c - v * s;
    sortie.y = b.sol + y;
    sortie.z = b.z + u * s + v * c;
    return sortie;
  };

  // ------------------------------------------------------------------ montrer / cacher / salir un morceau
  // (on écrit l'état de tous les sommets d'un morceau : −1 = tombé ; sinon sa vie, de 0 à 1)
  // (on retient seulement le plus petit et le plus grand sommet touchés de chaque lot : à la fin de l'image, la carte
  // graphique recopie ce seul bout, au lieu de dizaines de petits bouts quand une maison s'effondre)
  const touches = new Map();
  function ecrireEtat(plages, valeur) {
    for (const [L, d, f] of plages) {
      const a = L.geo.attributes.etat;
      a.array.fill(valeur, d, f);
      const t = touches.get(a);
      if (t) (t[0] = Math.min(t[0], d)), (t[1] = Math.max(t[1], f));
      else touches.set(a, [d, f]);
    }
  }
  function envoyerEtats() {
    for (const [a, [d, f]] of touches) {
      a.addUpdateRange(d, f - d);
      a.needsUpdate = true;
    }
    touches.clear();
  }
  const cacher = (plages, oui) => ecrireEtat(plages, oui ? -1 : 1);
  const salirMorceau = (plages, part) => ecrireEtat(plages, Math.max(0.001, part));
  // Remettre le dessin d'une maison d'accord avec son état (le monde) : ce qui est tombé est caché, le reste montré.
  function synchroniser(b, vue) {
    const neuve = vue.generation !== ST().generation;
    if (neuve) {
      vue.generation = ST().generation;
      if (vue.roofTombe) (vue.roofTombe.g.morceaux.forEach((m) => groupe.remove(m.g)), (vue.roofTombe = null));
    }
    b.morceaux.forEach((m, i) => {
      const v = vue.morceaux[i];
      if (neuve && !v.initialise) (v.initialise = true), (v.tombe = false), (v.vie = m.vieMax);
      if (m.tombe !== v.tombe) {
        cacher(v.plages, m.tombe);
        v.tombe = m.tombe;
        bilan.morceauxCaches += m.tombe ? 1 : -1;
        if (!m.tombe) (v.vie = m.vieMax), salirMorceau(v.plages, 1);
      }
      if (!m.tombe && m.vie !== v.vie) {
        v.vie = m.vie;
        salirMorceau(v.plages, Math.max(0, m.vie / m.vieMax));
      }
    });
    if (vue.toit) {
      const voulu = b.toit.intact;
      if (voulu !== vue.toitVu) (cacher(vue.toit, !voulu), (vue.toitVu = voulu));
    }
    vue.changements = b.changements;
    bilan.misesAJour++;
  }

  // ------------------------------------------------------------------ les débris qui volent, les gravats, les trous
  const vol = []; // { x, y, z, vx, vy, vz, rx, ry, rz, wx, wy, wz, taille, couleur, age }
  const COULEURS = { brique: lin("#b77d63"), pierre: lin("#a9a090"), bois: lin("#7a6048"), porte: lin("#6a4b32"), haie: lin("#4f6a32"), tuiles: lin("#a85a40"), gravats: lin("#9a8f80") };
  const couleurMorceau = (b, m, vue) => {
    if (m.matiere === "brique") return hasard() < 0.45 ? fois(vue.style.crepi, 0.72) : fois(COULEURS.brique, 0.85 + hasard() * 0.2);
    return fois(COULEURS[m.matiere] || COULEURS.gravats, 0.8 + hasard() * 0.2);
  };
  let prochainGravat = 0;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), c4 = new THREE.Color();
  function poserGravat(im, i, x, y, z, rx, ry, rz, taille, couleur, plat) {
    q4.setFromEuler(e4.set(rx, ry, rz));
    im.setMatrixAt(i, m4.compose(p4.set(x, y, z), q4, s4.set(taille, taille * (plat || 1), taille)));
    im.setColorAt(i, c4.setRGB(couleur[0], couleur[1], couleur[2]));
  }
  function ajouterGravat(x, z, taille, couleur, fixe) {
    const im = fixe ? gravatsFixes : gravats;
    let i;
    if (fixe) {
      if (im.count >= im.instanceMatrix.count) return;
      i = im.count++;
    } else {
      i = prochainGravat;
      prochainGravat = (prochainGravat + 1) % D.gravatsMax;
      im.count = Math.max(im.count, i + 1);
    }
    poserGravat(im, i, x, T.hauteur(x, z) + taille * 0.12, z, (hasard() - 0.5) * 0.6, hasard() * 6.3, (hasard() - 0.5) * 0.6, taille, couleur, 0.8);
    im.instanceMatrix.needsUpdate = true;
    im.instanceColor.needsUpdate = true;
  }
  function lancerDebris(x, y, z, vx, vy, vz, taille, couleur) {
    if (vol.length >= D.vol) return ajouterGravat(x + vx * 0.3, z + vz * 0.3, taille, couleur, false);
    vol.push({ x, y, z, vx, vy, vz, rx: hasard() * 6, ry: hasard() * 6, rz: hasard() * 6, wx: (hasard() - 0.5) * 14, wy: (hasard() - 0.5) * 10, wz: (hasard() - 0.5) * 14, taille, couleur, age: 0, rebonds: 0 });
  }
  function majDebris(dt) {
    let n = 0;
    for (let i = vol.length - 1; i >= 0; i--) {
      const d = vol[i];
      d.age += dt;
      d.vy -= 9.8 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      d.rx += d.wx * dt;
      d.ry += d.wy * dt;
      d.rz += d.wz * dt;
      const sol = T.hauteur(d.x, d.z) + d.taille * 0.2;
      if (d.y < sol) { // il touche le sol : il rebondit (moins fort à chaque fois), puis il s'arrête
        d.y = sol;
        d.rebonds++;
        if (Math.abs(d.vy) < 1.6 || d.rebonds > 3 || d.age > 6) {
          ajouterGravat(d.x, d.z, d.taille, d.couleur, false);
          vol.splice(i, 1);
          continue;
        }
        d.vy = -d.vy * 0.32;
        d.vx *= 0.5;
        d.vz *= 0.5;
        d.wx *= 0.5;
        d.wy *= 0.5;
        d.wz *= 0.5;
      }
      poserGravat(debrisVol, n++, d.x, d.y, d.z, d.rx, d.ry, d.rz, d.taille, d.couleur, 1);
    }
    debrisVol.count = n;
    if (n) (debrisVol.instanceMatrix.needsUpdate = true), (debrisVol.instanceColor.needsUpdate = true);
    bilan.debrisVol = n;
    bilan.gravats = Math.min(gravats.count, D.gravatsMax);
    bilan.gravatsFixes = gravatsFixes.count;
  }
  // Une petite image collée sur le mur (un trou de balle, une trace noire) : au point (x, y, z), tournée vers n.
  const avantZ = new THREE.Vector3(0, 0, 1), nrm = new THREE.Vector3(), qTourne = new THREE.Quaternion();
  function coller(im, x, y, z, nx, ny, nz, taille, qui, compteur) {
    const i = im.userData.prochain || 0;
    im.userData.prochain = (i + 1) % im.instanceMatrix.count;
    im.count = Math.max(im.count, i + 1);
    nrm.set(nx, ny, nz).normalize();
    q4.setFromUnitVectors(avantZ, nrm);
    qTourne.setFromAxisAngle(avantZ, hasard() * 6.3);
    q4.multiply(qTourne);
    im.setMatrixAt(i, m4.compose(p4.set(x + nx * 0.012, y + ny * 0.012, z + nz * 0.012), q4, s4.set(taille, taille, taille)));
    im.instanceMatrix.needsUpdate = true;
    im.userData.qui[i] = qui;
    bilan[compteur] = im.count;
  }
  // Effacer les trous et les traces collés sur un morceau qui vient de tomber.
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  function decoller(b, k) {
    for (const im of [trous, brulures, dents]) {
      const qui = im.userData.qui;
      let change = false;
      for (let i = 0; i < qui.length; i++) if (qui[i] && qui[i][0] === b && (k < 0 || qui[i][1] === k)) (im.setMatrixAt(i, zero), (qui[i] = null), (change = true));
      if (change) im.instanceMatrix.needsUpdate = true;
    }
  }
  const P = { x: 0, y: 0, z: 0 };
  const poussiere = (x, y, z, n, taille, couleur, vie, vitesse) => {
    for (let k = 0; k < n; k++) Tanks.Effets.particule(x + (hasard() - 0.5) * taille * 0.6, y + (hasard() - 0.5) * taille * 0.4, z + (hasard() - 0.5) * taille * 0.6, (hasard() - 0.5) * vitesse, hasard() * vitesse * 0.4 + 0.2, (hasard() - 0.5) * vitesse, vie * (0.7 + hasard() * 0.6), taille * 0.5, taille * 1.6, 0.55, couleur);
  };
  // Un morceau qui tombe : il éclate en débris (poussés loin de l'explosion), un tas de gravats à son pied, de la poussière.
  function eclater(b, k, ex, ey, ez, force, peu) {
    const vue = vues.get(b), m = b.morceaux[k], c = vue.morceaux[k].centre;
    versMonde(b, c[0], c[1], c[2], P);
    const cx = P.x, cy = P.y, cz = P.z;
    let dx = cx - ex, dy = (cy - ey) * 0.35 + 0.3, dz = cz - ez;
    const l = Math.hypot(dx, dy, dz) || 1;
    (dx /= l), (dy /= l), (dz /= l);
    const haie = m.matiere === "haie", n = peu ? 2 : D.parMorceau, hm = m.y1 - m.y0, am = (m.a1 - m.a0);
    for (let i = 0; i < n; i++) {
      const v = force * (0.4 + hasard() * 0.8);
      const ox = (hasard() - 0.5) * am, oy = (hasard() - 0.5) * hm;
      versMonde(b, c[0] + (m.axe === "u" ? ox : 0), c[1] + oy, c[2] + (m.axe === "v" ? ox : 0), P);
      lancerDebris(P.x, P.y, P.z, dx * v + (hasard() - 0.5) * 3, dy * v + hasard() * 1.5, dz * v + (hasard() - 0.5) * 3, haie ? 0.12 + hasard() * 0.18 : 0.14 + hasard() * 0.32, couleurMorceau(b, m, vue));
    }
    // un gros bloc de mur (quand ce n'est pas une haie)
    if (!haie && !peu) lancerDebris(cx, cy, cz, dx * force * 0.5, dy * force * 0.4 + 1, dz * force * 0.5, 0.45 + hasard() * 0.3, couleurMorceau(b, m, vue));
    // les briques cassées qui dépassent des bords du trou (sur les morceaux voisins encore debout)
    if (!haie) {
      const mur = b.murs[m.mur], voisins = [];
      for (const dc of [-1, 1]) { const col = mur.colonnes[m.c - dc * 0 + dc]; if (col && !col.morceaux[m.rang].tombe) voisins.push([col.morceaux[m.rang], dc < 0 ? m.a0 : m.a1, "a"]); }
      if (m.rang > 0 && !m.colonne.morceaux[m.rang - 1].tombe) voisins.push([m.colonne.morceaux[m.rang - 1], m.y0, "y"]);
      for (const [vm, bord, sens] of voisins) {
        for (let i = 0; i < (peu ? 2 : 3); i++) {
          const a = sens === "a" ? bord : vm.a0 + hasard() * (vm.a1 - vm.a0), y = sens === "y" ? bord : Math.max(vm.y0, m.y0) + hasard() * (Math.min(vm.y1, m.y1) - Math.max(vm.y0, m.y0)), w = (hasard() - 0.5) * b.ep * 0.7;
          const u = mur.axe === "u" ? a : mur.pos + mur.sens * w, v = mur.axe === "u" ? mur.pos + mur.sens * w : a;
          versMonde(b, u, y, v, P);
          coller(dents, P.x, P.y, P.z, 0, 1, 0, 0.13 + hasard() * 0.12, [b, vm.k], "dents");
          dents.setColorAt((dents.userData.prochain + D.trous - 1) % D.trous, c4.setRGB(...couleurMorceau(b, vm, vue)));
          dents.instanceColor.needsUpdate = true;
        }
      }
    }
    // le tas au pied du mur (de gros morceaux, tout de suite)
    if (m.rang === 0) for (let i = 0; i < (peu ? 2 : 4); i++) {
      const ox = (hasard() - 0.5) * am, ow = (hasard() - 0.5) * 1.6;
      versMonde(b, c[0] + (m.axe === "u" ? ox : ow), 0, c[2] + (m.axe === "v" ? ox : ow), P);
      ajouterGravat(P.x, P.z, haie ? 0.35 + hasard() * 0.2 : 0.3 + hasard() * 0.35, couleurMorceau(b, m, vue), false);
    }
    poussiere(cx, cy, cz, peu ? 1 : 3, haie ? 2 : 2.6, haie ? [0.36, 0.42, 0.26] : [0.5, 0.46, 0.4], 3.5, 2.5);
    decoller(b, k);
  }

  // ------------------------------------------------------------------ le toit qui s'effondre
  const enChute = []; // { g, t, fin, penche, b }
  function faireTomberLeToit(b) {
    const vue = vues.get(b);
    if (!vue || !vue.toit) return;
    if (vue.toitVu) (cacher(vue.toit, true), (vue.toitVu = false));
    // chaque PENTE du toit est refaite toute seule ; elle tourne autour de son bord du bas (la gouttière), qui descend
    // avec les murs : le faîtage s'enfonce dans la maison, le toit cassé finit tout aplati sur les gravats
    const hT = b.toit.hauteur, ov = b.type === "tour" ? 0.3 : 0.42, V = b.demiP, pente = hT / V, ve = V + ov, ye = b.h - ov * pente;
    const morceaux = [];
    for (const cote of [1, -1]) {
      const q = { lots: {} };
      M.x = 0; M.y = -ye; M.z = -cote * ve; M.c = 1; M.s = 0; // (le repère de la pente : l'origine sur la gouttière)
      emettreToit(b, vue.style, (nom) => lotDe(q, nom), cote);
      const pivot = new THREE.Group(), g = new THREE.Group();
      for (const nom in q.lots) {
        const L = q.lots[nom], geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(L.pos, 3));
        geo.setAttribute("normal", new THREE.Float32BufferAttribute(L.nor, 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(L.uv, 2));
        geo.setAttribute("color", new THREE.Float32BufferAttribute(L.col, 3));
        geo.setAttribute("etat", new THREE.BufferAttribute(new Float32Array(L.pos.length / 3).fill(1), 1));
        geo.setIndex(L.idx);
        const mesh = new THREE.Mesh(geo, mats[nom]);
        mesh.customDepthMaterial = profondeur;
        mesh.castShadow = mesh.receiveShadow = true;
        pivot.add(mesh);
      }
      g.add(pivot);
      versMonde(b, 0, ye, cote * ve, P);
      g.position.set(P.x, P.y, P.z);
      g.rotation.set(0, -b.angle, 0, "YXZ");
      groupe.add(g);
      // de combien la gouttière descend, et de combien la pente tourne (un peu plus qu'à plat : le « V »)
      const descente = Math.max(0.3, ye - (S.gravatsDedans + 0.3 + hasard() * 0.5)), tour = Math.atan(pente) * (0.55 + hasard() * 0.25);
      morceaux.push({ g, pivot, cote, descente, tour, y0: P.y, roule: (hasard() - 0.5) * 0.08 });
    }
    const chute = { morceaux, t: 0, b, retard: hasard() * 0.15 };
    enChute.push(chute);
    vue.roofTombe = { g: { morceaux } };
    bilan.toitsTombes++;
  }
  function majToits(dt) {
    for (let i = enChute.length - 1; i >= 0; i--) {
      const c = enChute[i];
      c.t += dt;
      let fini = true;
      for (const m of c.morceaux) {
        const t = Math.max(0, c.t - (m.cote > 0 ? 0 : c.retard)), y = Math.min(m.descente, 0.5 * 9.8 * t * t), k = y / m.descente;
        if (k < 1) fini = false;
        m.g.position.y = m.y0 - y;
        // la pente tourne autour de la gouttière (son axe : le long de la maison) : le faîtage plonge vers le milieu
        m.pivot.rotation.set(-m.cote * m.tour * Math.min(1, k * 1.15), 0, m.roule * k);
      }
      if (fini) enChute.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------ la radio
  function ecouter() {
    const radio = Tanks.Evenements;
    const force = { obus: 9, roquette: 8, bombe: 14, missile: 12, grenade: 7, balle: 2.5, char: 4.5, torpille: 6, effondrement: 3 };
    radio.ecouter("mur-abime", (d) => {
      if (d.k < 0) return void poussiere(d.x, d.y, d.z, 1, 0.5, [0.6, 0.56, 0.5], 1, 1);
      const haie = d.matiere === "haie";
      if (!haie) coller(trous, d.x, d.y, d.z, d.nx, d.ny, d.nz, 0.1 + hasard() * 0.08, [d.b, d.k], "trous");
      const col = haie ? [0.4, 0.5, 0.28] : d.matiere === "brique" ? [0.8, 0.74, 0.64] : [0.66, 0.62, 0.55];
      Tanks.Effets.particule(d.x + d.nx * 0.1, d.y, d.z + d.nz * 0.1, d.nx * 1.5 + (hasard() - 0.5), 0.6, d.nz * 1.5 + (hasard() - 0.5), 0.9, 0.25, 1.1, 0.55, col);
      if (hasard() < 0.35) lancerDebris(d.x + d.nx * 0.05, d.y, d.z + d.nz * 0.05, d.nx * 3 + (hasard() - 0.5) * 2, 1 + hasard() * 2, d.nz * 3 + (hasard() - 0.5) * 2, 0.04 + hasard() * 0.04, haie ? COULEURS.haie : col);
    });
    radio.ecouter("mur-troue", (d) => {
      const f = force[d.sorte] || 6;
      for (const k of d.morceaux) eclater(d.b, k, d.x, d.y, d.z, f, d.morceaux.length > 10);
    });
    radio.ecouter("impact", (d) => {
      if (d.sur !== "maison" && d.sur !== "muret") return;
      if (d.nx === undefined) return;
      const g = { obus: 1.8, roquette: 1.6, bombe: 3.2, missile: 2.6, grenade: 1.5 }[d.sorte] || 1.5;
      // les traces noires : sur les morceaux de mur encore debout autour du point d'explosion (au centre, il y a un trou !)
      const tx = -d.nz, tz = d.nx;
      for (const [da, dy] of [[0, 0], [1.1, 0.3], [-1.1, -0.2], [0.3, 1.1], [-0.4, -0.9]]) {
        const x = d.x + tx * da * g * 0.7, y = d.y + dy * g * 0.7, z = d.z + tz * da * g * 0.7;
        const m = Tanks.Structures.premier(x + d.nx * 0.5, y, z + d.nz * 0.5, x - d.nx * 1.0, y, z - d.nz * 1.0);
        if (m && m.morceau) coller(brulures, m.x, m.y, m.z, m.nx, m.ny, m.nz, g * (0.8 + hasard() * 0.5), [m.b, m.morceau.k], "brulures");
      }
    });
    radio.ecouter("maison-effondree", (d) => {
      faireTomberLeToit(d.b);
      for (const k of d.morceaux) eclater(d.b, k, d.b.x, d.b.sol + d.b.h + 2, d.b.z, 3, true);
      decoller(d.b, -1);
      // le grand nuage de poussière, et les tuiles qui glissent du toit
      const b = d.b;
      for (let i = 0; i < 26; i++) {
        versMonde(b, (hasard() - 0.5) * 2 * b.demiL, hasard() * b.h, (hasard() - 0.5) * 2 * b.demiP, P);
        Tanks.Effets.particule(P.x, P.y, P.z, (hasard() - 0.5) * 4, 0.5 + hasard() * 1.5, (hasard() - 0.5) * 4, 5 + hasard() * 3, 3, 9, 0.5, [0.52, 0.48, 0.42]);
      }
      // le tas de gravats au milieu (le toit et l'étage écrasés)
      for (let i = 0; i < 30; i++) {
        versMonde(b, (hasard() - 0.5) * 2 * (b.demiL - 0.6), 0, (hasard() - 0.5) * 2 * (b.demiP - 0.6), P);
        ajouterGravat(P.x, P.z, 0.35 + hasard() * 0.55, hasard() < 0.45 ? COULEURS.tuiles : hasard() < 0.5 ? fois(vues.get(b).style.crepi, 0.7) : COULEURS.brique, false);
      }
      for (let i = 0; i < 40; i++) {
        versMonde(b, (hasard() - 0.5) * 2 * b.demiL, b.h + hasard() * b.toit.hauteur, (hasard() - 0.5) * 2 * b.demiP, P);
        lancerDebris(P.x, P.y, P.z, (hasard() - 0.5) * 4, hasard() * 2, (hasard() - 0.5) * 4, 0.12 + hasard() * 0.2, COULEURS.tuiles);
      }
    });
  }

  // ------------------------------------------------------------------ chaque image
  let generationVue = -1;
  function maj(dt) {
    if (!mats) return;
    // une nouvelle bataille : les gravats, les débris, les trous et les traces disparaissent
    if (generationVue !== ST().generation) {
      generationVue = ST().generation;
      vol.length = 0;
      gravats.count = 0;
      prochainGravat = 0;
      for (const im of [trous, brulures, dents]) (im.count = 0), (im.userData.prochain = 0), im.userData.qui.fill(null);
      for (const c of enChute) for (const m of c.morceaux) groupe.remove(m.g);
      enChute.length = 0;
      bilan.trous = bilan.brulures = 0;
    }
    for (const [b, vue] of vues) if (b.changements !== vue.changements || vue.generation !== ST().generation) {
      synchroniser(b, vue);
      // (au tout début : les gravats des maisons déjà en ruines)
      if (b.ruineDepart && !vue.gravatsPoses) {
        vue.gravatsPoses = true;
        b.morceaux.forEach((m, k) => {
          if (!m.tombe || m.rang > 0) return;
          const c = vue.morceaux[k].centre;
          for (let i = 0; i < 4; i++) {
            const ox = (hasard() - 0.5) * (m.a1 - m.a0), ow = (hasard() - 0.5) * 1.8;
            versMonde(b, c[0] + (m.axe === "u" ? ox : ow), 0, c[2] + (m.axe === "v" ? ox : ow), P);
            ajouterGravat(P.x, P.z, 0.3 + hasard() * 0.4, couleurMorceau(b, m, vue), true);
          }
        });
        for (let i = 0; i < 24; i++) {
          versMonde(b, (hasard() - 0.5) * 2 * (b.demiL - 0.8), 0, (hasard() - 0.5) * 2 * (b.demiP - 0.8), P);
          ajouterGravat(P.x, P.z, 0.35 + hasard() * 0.5, hasard() < 0.4 ? COULEURS.tuiles : fois(vue.style.crepi, 0.85), true);
        }
      }
    }
    envoyerEtats();
    majDebris(dt);
    majToits(dt);
  }

  return { construire, maj, bilan };
})();
