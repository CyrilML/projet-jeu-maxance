// 🧺 LES COURS : le décorateur, qui range devant chaque bâtiment les objets de son métier
//
// Étape 37 : ✍️ « Tu les as juste agrandis : ils font une taille qui ne va plus avec le paysage, mais ils sont toujours
// les mêmes. Je veux qu'ils soient reconnaissables de loin, avec de vraies spécificités. Un entrepôt doit avoir des
// piles de cartons ou de matériaux dehors, sur des étagères… Pareil pour les autres. »
// Choix de Maxance : le bâtiment redevient de taille normale, posé au FOND de sa place ; le reste devient une COUR
// remplie des objets typiques de son métier (des étagères pleines de caisses pour l'entrepôt, des grumes et des piles de
// planches pour la scierie, des étals colorés pour le marché…). Et une petite ENSEIGNE au-dessus de la porte.
//
// Comme pour un décor de théâtre, on dessine en 3 fois :
//   1. « sol »     : le sol de la cour (terre battue, gravier, pavés, pelouse) et la clôture du fond ;
//   2. « arriere » : les objets derrière le bâtiment (dessinés avant lui, pour qu'il les cache) ;
//   3. « avant »   : les objets devant, la clôture de devant et l'enseigne (dessinés après lui).
// Le décorateur ne change jamais le monde : il le regarde (le stock de l'entrepôt, le travail en cours) et il dessine.
//
// Les positions sont en CASES, à partir du milieu de la place : p va vers le bas à droite de l'écran, q vers le haut à
// droite. Le bâtiment est au fond (p petit, q grand) ; les 3 coins libres sont G (gauche), D (devant) et Dr (droite).

window.Village = window.Village || {};

Village.Cours = (function () {
  const TOUR = Math.PI * 2;
  const O = () => Village.Batisses.outils; // les pinceaux du peintre des bâtiments
  const iso = (x, y, p, q) => [x + (p + q) * 32, y + (p - q) * 16];

  // ---------------------------------------------------------------- les couleurs
  function nuance(hex, f) { // f > 1 : plus clair ; f < 1 : plus foncé
    const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
    return "rgb(" + c.join(",") + ")";
  }
  const TRAIT = "rgba(38, 30, 24, .72)";
  function face(ctx, pts, couleur) {
    ctx.beginPath(); pts.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    ctx.fillStyle = couleur; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke();
  }

  // ---------------------------------------------------------------- les objets de base
  // Une boîte posée au sol : lp, lq en cases, h en px. Renvoie le dessus (4 points).
  function boite(ctx, x, y, lp, lq, h, couleur) {
    const A = iso(x, y, -lp / 2, -lq / 2), B = iso(x, y, lp / 2, -lq / 2), D = iso(x, y, lp / 2, lq / 2), H = iso(x, y, -lp / 2, lq / 2);
    const up = (P) => [P[0], P[1] - h];
    face(ctx, [A, B, up(B), up(A)], nuance(couleur, 0.82));
    face(ctx, [B, D, up(D), up(B)], nuance(couleur, 0.66));
    face(ctx, [up(A), up(B), up(D), up(H)], couleur);
    return [up(A), up(B), up(D), up(H)];
  }
  function ombreSol(ctx, x, y, r) { ctx.fillStyle = "rgba(20, 30, 10, .18)"; ctx.beginPath(); ctx.ellipse(x + 2, y + 1, r, r * 0.5, 0, 0, TOUR); ctx.fill(); }
  // Un tonneau (debout)
  function tonneau(ctx, x, y, k, couleur) {
    const r = 4.2 * k, h = 9 * k, c = couleur || "#8a5a32";
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r, y - h); ctx.ellipse(x, y - h, r, r * 0.5, 0, Math.PI, 0); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI); ctx.closePath();
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, nuance(c, 1.25)); g.addColorStop(1, nuance(c, 0.7)); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - h, r, r * 0.5, 0, 0, TOUR); ctx.fillStyle = nuance(c, 0.85); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(40, 40, 46, .7)"; ctx.lineWidth = 1; ctx.beginPath(); for (const v of [0.25, 0.75]) ctx.ellipse(x, y - h * v, r, r * 0.5, 0, 0, Math.PI); ctx.stroke();
  }
  // Un sac (de farine, de grain, de charbon…)
  function sac(ctx, x, y, k, couleur) {
    const c = couleur || "#e8dcc0";
    ctx.beginPath(); ctx.moveTo(x - 4.5 * k, y); ctx.quadraticCurveTo(x - 5.5 * k, y - 6 * k, x - 2 * k, y - 8 * k); ctx.lineTo(x + 2 * k, y - 8 * k); ctx.quadraticCurveTo(x + 5.5 * k, y - 6 * k, x + 4.5 * k, y); ctx.quadraticCurveTo(x, y + 2 * k, x - 4.5 * k, y);
    ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 2 * k, y - 8 * k); ctx.lineTo(x, y - 9.5 * k); ctx.lineTo(x + 2 * k, y - 8 * k); ctx.stroke();
  }
  function sacs(ctx, x, y, k, n, couleur) { // une pyramide de sacs
    const rangs = [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1], [0, 2]];
    for (let i = 0; i < Math.min(n, rangs.length); i++) sac(ctx, x + rangs[i][0] * 8 * k, y - rangs[i][1] * 6.5 * k + (rangs[i][1] ? 0 : 0), k, couleur);
  }
  // Un tas en cône (charbon, minerai, gravier, sciure…)
  function tas(ctx, x, y, r, h, couleur, grains) {
    ombreSol(ctx, x, y, r * 1.05);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r * 0.4, y - h * 1.1, x, y - h); ctx.quadraticCurveTo(x + r * 0.4, y - h * 1.1, x + r, y); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI);
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, nuance(couleur, 1.3)); g.addColorStop(0.5, couleur); g.addColorStop(1, nuance(couleur, 0.6));
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.9; ctx.stroke();
    if (grains && Village.Batisses.vue.fin) { ctx.fillStyle = grains; for (let i = 0; i < 9; i++) { const a = (i * 2.4) % 1, b = (i * 0.37) % 1; ctx.fillRect(x - r * 0.7 + a * r * 1.4, y - h * 0.15 - b * h * 0.7 * (1 - Math.abs(a - 0.5)), 1.5, 1.5); } }
  }
  // Des grumes (de longs troncs) empilées en pyramide, couchées le long de q
  function grumes(ctx, x, y, k, long) {
    const L = long || 1.1, rangs = [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1], [1, 2]], r = 3.4 * k;
    for (const [i, j] of rangs) {
      const [ax, ay] = iso(x, y, (i - 1) * 0.12 * k, -L / 2), [bx, by] = iso(x, y, (i - 1) * 0.12 * k, L / 2), dy = -j * r * 1.7 - r;
      ctx.lineCap = "butt"; ctx.strokeStyle = TRAIT; ctx.lineWidth = r * 2 + 1.4; ctx.beginPath(); ctx.moveTo(ax, ay + dy); ctx.lineTo(bx, by + dy); ctx.stroke();
      ctx.strokeStyle = "#8a5a32"; ctx.lineWidth = r * 2; ctx.stroke();
      ctx.strokeStyle = "#a8743f"; ctx.lineWidth = r * 0.8; ctx.beginPath(); ctx.moveTo(ax, ay + dy - r * 0.5); ctx.lineTo(bx, by + dy - r * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ax, ay + dy, r * 0.9, r, 0, 0, TOUR); ctx.fillStyle = "#e3c08a"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(ax, ay + dy, r * 0.4, r * 0.45, 0, 0, TOUR); ctx.strokeStyle = "rgba(120, 80, 40, .6)"; ctx.stroke();
    }
  }
  // Une pile de planches bien rangées (avec des cales entre les couches)
  function pilePlanches(ctx, x, y, k, couches) {
    for (let i = 0; i < couches; i++) {
      boite(ctx, x, y - i * 4.2 * k, 0.32 * k, 1.0 * k, 2.6 * k, i % 2 ? "#e2bf86" : "#d9b47a");
      if (i < couches - 1) boite(ctx, x, y - i * 4.2 * k - 2.6 * k, 0.34 * k, 0.08, 1.6 * k, "#8a6440");
    }
  }
  // Des blocs de pierre taillée
  function blocsPierre(ctx, x, y, k) {
    for (const [p, q, j] of [[-0.2, -0.2, 0], [0.2, -0.2, 0], [-0.2, 0.2, 0], [0.2, 0.2, 0], [0, 0, 1]]) boite(ctx, ...iso(x, y - j * 9 * k, p * k, q * k), 0.36 * k, 0.36 * k, 9 * k, j ? "#c9c4ba" : "#b4afa4");
  }
  // Une grue en bois (un portique avec sa corde et son crochet)
  function grue(ctx, x, y, k, charge) {
    const h = 34 * k, P = iso(x, y, 0, -0.35 * k), Q = iso(x, y, 0, 0.35 * k);
    for (const B of [P, Q]) { O().poutre(ctx, [B[0] - 5 * k, B[1]], [B[0], B[1] - h], 1.6 * k, "#8a5a2b"); O().poutre(ctx, [B[0] + 5 * k, B[1]], [B[0], B[1] - h], 1.6 * k, "#8a5a2b"); }
    O().poutre(ctx, [P[0], P[1] - h], [Q[0], Q[1] - h], 2 * k, "#6b4423");
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2 - h;
    ctx.strokeStyle = "#3a3028"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my + h * 0.55); ctx.stroke();
    if (charge) boite(ctx, mx, my + h * 0.55 + 7 * k, 0.22 * k, 0.22 * k, 7 * k, charge);
  }
  // Une meule de foin (ronde, dorée)
  function meule(ctx, x, y, k) {
    const r = 9 * k, hiver = Village.Batisses.vue.hiver;
    ombreSol(ctx, x, y, r);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.bezierCurveTo(x - r, y - r * 2, x + r, y - r * 2, x + r, y); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI);
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, "#e8c464"); g.addColorStop(1, "#b8902e"); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.9; ctx.stroke();
    if (hiver) { ctx.beginPath(); ctx.ellipse(x, y - r * 1.3, r * 0.7, r * 0.3, 0, 0, TOUR); ctx.fillStyle = "#f4f8ff"; ctx.fill(); }
    O().poteau(ctx, [x, y - r * 1.4], 6 * k, 1);
  }
  // Des balles (foin, laine, coton) rectangulaires empilées
  function balles(ctx, x, y, k, n, couleur, liens) {
    const pos = [[-0.2, -0.2, 0], [0.2, -0.2, 0], [-0.2, 0.2, 0], [0.2, 0.2, 0], [0, -0.2, 1], [0, 0.2, 1]];
    for (let i = 0; i < Math.min(n, pos.length); i++) {
      const [p, q, j] = pos[i], [bx, by] = iso(x, y - j * 7 * k, p * k, q * k), d = boite(ctx, bx, by, 0.36 * k, 0.36 * k, 7 * k, couleur);
      if (liens && Village.Batisses.vue.fin) { ctx.strokeStyle = liens; ctx.lineWidth = 0.8; ctx.beginPath(); for (const u of [0.33, 0.66]) { const a = [d[0][0] + (d[1][0] - d[0][0]) * u, d[0][1] + (d[1][1] - d[0][1]) * u], b = [d[3][0] + (d[2][0] - d[3][0]) * u, d[3][1] + (d[2][1] - d[3][1]) * u]; ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } ctx.stroke(); }
    }
  }
  // Une caisse (avec son contenu qui dépasse)
  function caisse(ctx, x, y, k, couleur, contenu) {
    const d = boite(ctx, x, y, 0.3 * k, 0.3 * k, 7 * k, couleur || "#b8834a");
    if (contenu) { const cx = (d[0][0] + d[2][0]) / 2, cy = (d[0][1] + d[2][1]) / 2; ctx.fillStyle = contenu; for (const [dx, dy] of [[-2, 0], [2, 0.5], [0, -1.5], [0.5, 1.5]]) { ctx.beginPath(); ctx.arc(cx + dx * k, cy + dy * k, 1.8 * k, 0, TOUR); ctx.fill(); } }
    else if (Village.Batisses.vue.fin) { ctx.strokeStyle = "rgba(60, 36, 16, .45)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo((d[0][0] + d[1][0]) / 2, (d[0][1] + d[1][1]) / 2); ctx.lineTo((d[0][0] + d[1][0]) / 2, (d[0][1] + d[1][1]) / 2 + 7 * k); ctx.stroke(); }
  }
  // Une palette chargée de cartons
  function palette(ctx, x, y, k, couleurs) {
    boite(ctx, x, y, 0.5 * k, 0.5 * k, 2 * k, "#a8885a");
    const c = couleurs || ["#c8a06a", "#b88e58", "#d2ae78"];
    for (const [p, q, j] of [[-0.11, -0.11, 0], [0.11, -0.11, 0], [-0.11, 0.11, 0], [0.11, 0.11, 0], [-0.11, 0.11, 1], [0.11, 0.11, 1], [0.11, -0.11, 1]]) boite(ctx, ...iso(x, y - 2 * k - j * 6 * k, p * k, q * k), 0.21 * k, 0.21 * k, 6 * k, c[(Math.abs(p * 100 + q * 37 + j) | 0) % c.length]);
  }
  // Une étagère de stockage en plein air (montants, 3 plateaux, des caisses et des sacs dessus), le long de q
  function etagere(ctx, x, y, k, long, contenus) {
    const L = long * k, h = 30 * k, niveaux = [0, 10 * k, 20 * k];
    const montants = [-L / 2, 0, L / 2].map((q) => [iso(x, y, -0.13 * k, q), iso(x, y, 0.13 * k, q)]);
    for (const [der] of montants) { ctx.strokeStyle = "#4a5058"; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(der[0], der[1]); ctx.lineTo(der[0], der[1] - h); ctx.stroke(); }
    niveaux.forEach((hz, j) => {
      const [a, b] = [iso(x, y - hz, -0.13 * k, -L / 2), iso(x, y - hz, 0.13 * k, -L / 2)], [c, d] = [iso(x, y - hz, 0.13 * k, L / 2), iso(x, y - hz, -0.13 * k, L / 2)];
      face(ctx, [a, b, c, d], "#9a8a6a");
      // ce qui est posé dessus
      const n = Math.max(2, Math.round(long * 3.2));
      for (let i = 0; i < n; i++) {
        const q = -L / 2 + (i + 0.5) * (L / n), sorte = contenus[(i + j * 2) % contenus.length];
        const [px, py] = iso(x, y - hz - 1, 0, q);
        if (sorte === "sac") sac(ctx, px, py, 0.8 * k, "#e8dcc0");
        else if (sorte === "tonneau") tonneau(ctx, px, py, 0.75 * k, "#7a4a2a");
        else if (sorte) boite(ctx, px, py, 0.2 * k, L / n * 0.8, 7.5 * k, sorte);
      }
    });
    for (const [, devant] of montants) { ctx.strokeStyle = "#5a6068"; ctx.lineWidth = 1.8 * k; ctx.beginPath(); ctx.moveTo(devant[0], devant[1]); ctx.lineTo(devant[0], devant[1] - h); ctx.stroke(); }
  }
  // Un étal de marché : une table, 4 poteaux, une toile rayée, et des marchandises colorées
  function etal(ctx, x, y, k, c1, c2, marchandises) {
    const d = boite(ctx, x, y, 0.42 * k, 0.6 * k, 7 * k, "#a87a4a");
    const cx = (d[0][0] + d[2][0]) / 2, cy = (d[0][1] + d[2][1]) / 2;
    ctx.fillStyle = marchandises || "#d9553b";
    for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(cx - 8 * k + (i % 4) * 5 * k, cy - 1.5 * k + Math.floor(i / 4) * 3 * k - (i % 4) * 1.2 * k, 1.9 * k, 0, TOUR); ctx.fill(); }
    const coins = [iso(x, y, -0.26 * k, -0.36 * k), iso(x, y, 0.26 * k, -0.36 * k), iso(x, y, 0.26 * k, 0.36 * k), iso(x, y, -0.26 * k, 0.36 * k)], h = 20 * k;
    for (const P of coins) { ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0], P[1] - h); ctx.stroke(); }
    const toile = coins.map((P) => [P[0], P[1] - h]), sommet = [(toile[0][0] + toile[2][0]) / 2, (toile[0][1] + toile[2][1]) / 2 - 6 * k];
    for (let i = 0; i < 4; i++) face(ctx, [toile[i], toile[(i + 1) % 4], sommet], i % 2 ? c1 : c2);
  }
  // Un séchoir : 2 poteaux, une corde, et des choses qui pendent (des draps colorés, des poissons, des jambons)
  function sechoir(ctx, x, y, k, long, sorte, couleurs, t) {
    const P = iso(x, y, 0, -long * k / 2), Q = iso(x, y, 0, long * k / 2), h = 20 * k;
    O().poteau(ctx, P, h, 1.6 * k); O().poteau(ctx, Q, h, 1.6 * k);
    ctx.strokeStyle = "#5a4a3a"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(P[0], P[1] - h); ctx.quadraticCurveTo((P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2 - h + 3, Q[0], Q[1] - h); ctx.stroke();
    const n = Math.max(2, Math.round(long * 3));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, ax = P[0] + (Q[0] - P[0]) * u, ay = P[1] + (Q[1] - P[1]) * u - h + Math.sin(u * Math.PI) * 3 + 1, o = Math.sin((t || 0) * 2 + i) * 0.8;
      if (sorte === "drap") { const w = ((Q[0] - P[0]) / n) * 0.42, dw = ((Q[1] - P[1]) / n) * 0.42; face(ctx, [[ax - w, ay - dw], [ax + w, ay + dw], [ax + w + o, ay + dw + 12 * k], [ax - w + o, ay - dw + 12 * k]], couleurs[i % couleurs.length]); }
      else if (sorte === "poisson") { ctx.save(); ctx.translate(ax, ay + 4 * k); ctx.rotate(Math.PI / 2); ctx.scale(k, k); O().poisson(ctx, 0, 0); ctx.restore(); }
      else if (sorte === "jambon") { ctx.save(); ctx.translate(ax, ay + 5 * k); ctx.scale(k, k); O().jambon(ctx, 0, 0); ctx.restore(); }
    }
  }
  // Une cible de tir à l'arc, sur son chevalet
  function cible(ctx, x, y, k) {
    O().poutre(ctx, [x - 5 * k, y], [x, y - 14 * k], 1.4 * k, "#8a5a2b"); O().poutre(ctx, [x + 5 * k, y], [x, y - 14 * k], 1.4 * k, "#8a5a2b");
    for (const [r, c] of [[7, "#f2ece0"], [5.4, "#c8443a"], [3.6, "#f2ece0"], [1.8, "#c8443a"]]) { ctx.beginPath(); ctx.ellipse(x - 1 * k, y - 12 * k, r * 0.75 * k, r * k, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y - 12 * k); ctx.lineTo(x + 5 * k, y - 15 * k); ctx.stroke();
  }
  // Une peau tendue sur un cadre (le chasseur)
  function cadrePeau(ctx, x, y, k) {
    const P = [x - 7 * k, y], Q = [x + 7 * k, y - 3.5 * k], h = 18 * k;
    O().poteau(ctx, P, h, 1.4 * k); O().poteau(ctx, Q, h, 1.4 * k);
    O().poutre(ctx, [P[0], P[1] - h], [Q[0], Q[1] - h], 1.2 * k, "#8a5a2b"); O().poutre(ctx, [P[0], P[1] - 3 * k], [Q[0], Q[1] - 3 * k], 1.2 * k, "#8a5a2b");
    face(ctx, [[P[0] + 2 * k, P[1] - h + 2 * k], [Q[0] - 2 * k, Q[1] - h + 2.5 * k], [Q[0] - 1 * k, Q[1] - 5 * k], [x, y - 2 * k - 2 * k], [P[0] + 1 * k, P[1] - 4.5 * k]], "#b88a5a");
  }
  // Des bois de cerf sur un poteau (le trophée du chasseur)
  function trophee(ctx, x, y, k) {
    O().poteau(ctx, [x, y], 16 * k, 1.6 * k);
    ctx.strokeStyle = "#efe3c8"; ctx.lineWidth = 1.3 * k; ctx.lineCap = "round"; ctx.beginPath();
    for (const s of [-1, 1]) { ctx.moveTo(x, y - 17 * k); ctx.quadraticCurveTo(x + s * 6 * k, y - 20 * k, x + s * 7 * k, y - 27 * k); ctx.moveTo(x + s * 4 * k, y - 20 * k); ctx.lineTo(x + s * 2 * k, y - 25 * k); ctx.moveTo(x + s * 6 * k, y - 23 * k); ctx.lineTo(x + s * 9.5 * k, y - 25 * k); }
    ctx.stroke(); ctx.lineCap = "butt";
  }
  // L'enclume sur son billot
  function enclume(ctx, x, y, k) {
    O().rond(ctx, x, y - 1, 4.5 * k, "#8a5a32"); boite(ctx, x, y, 0.16 * k, 0.16 * k, 6 * k, "#7a5032");
    face(ctx, [[x - 8 * k, y - 8 * k], [x + 6 * k, y - 9 * k], [x + 8 * k, y - 11 * k], [x + 3 * k, y - 12.5 * k], [x - 5 * k, y - 12 * k]], "#4a4e56");
  }
  // Une roue à aiguiser
  function meuleAiguiser(ctx, x, y, k, t, tourne) {
    boite(ctx, x, y, 0.3 * k, 0.14 * k, 6 * k, "#8a5a32");
    O().roue(ctx, x, y - 12 * k, 7 * k, tourne ? t * 4 : 0, "#9a9a9e", 0, false);
  }
  // Un râtelier d'outils (pelles, haches, marteaux)
  function ratelier(ctx, x, y, k) {
    const P = iso(x, y, 0, -0.35 * k), Q = iso(x, y, 0, 0.35 * k);
    O().poteau(ctx, P, 16 * k, 1.4 * k); O().poteau(ctx, Q, 16 * k, 1.4 * k); O().poutre(ctx, [P[0], P[1] - 15 * k], [Q[0], Q[1] - 15 * k], 1.4 * k, "#6b4423");
    for (let i = 1; i < 6; i++) { const u = i / 6, ax = P[0] + (Q[0] - P[0]) * u, ay = P[1] + (Q[1] - P[1]) * u - 15 * k; ctx.strokeStyle = "#7a5030"; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 1.5 * k, ay + 13 * k); ctx.stroke(); forme(ctx, i % 2 ? [[ax - 2 * k, ay + 1 * k], [ax + 2.5 * k, ay - 0.5 * k], [ax + 2 * k, ay + 3 * k]] : [[ax - 1.5 * k, ay + 11 * k], [ax + 3.5 * k, ay + 12 * k], [ax + 3 * k, ay + 15 * k], [ax - 1 * k, ay + 14.5 * k]], "#b8bcc4"); }
  }
  const forme = (ctx, pts, c) => face(ctx, pts, c);
  // Le four à pain, en briques, avec sa bouche qui rougeoie
  function four(ctx, x, y, k, chaud) {
    const r = 10 * k;
    ombreSol(ctx, x, y, r);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.bezierCurveTo(x - r, y - r * 1.6, x + r, y - r * 1.6, x + r, y); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI);
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, "#c4785a"); g.addColorStop(1, "#7a3e2a"); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 3 * k, y - 2 * k, 3.4 * k, 4 * k, 0, Math.PI, 0); ctx.lineTo(x + 0.4 * k, y); ctx.lineTo(x - 6.4 * k, y); ctx.fillStyle = chaud ? "#ffb040" : "#2a1a12"; ctx.fill();
    if (chaud) O().lumiere(x - 3 * k, y - 3 * k, 18 * k, "orange", 0.8);
    O().tourRonde(ctx, x + 4 * k, y - r * 1.05, { r: 1.8 * k, h: 7 * k, clair: "#a86a50", fonce: "#6a3a2a", dessus: "#2a1a12" });
  }
  // Une barque retournée, sur 2 tréteaux
  function barque(ctx, x, y, k) {
    for (const s of [-1, 1]) { const P = iso(x, y, 0, s * 0.3 * k); O().poutre(ctx, [P[0] - 3 * k, P[1]], [P[0], P[1] - 6 * k], 1 * k, "#8a5a2b"); O().poutre(ctx, [P[0] + 3 * k, P[1]], [P[0], P[1] - 6 * k], 1 * k, "#8a5a2b"); }
    const A = iso(x, y - 6 * k, 0, -0.55 * k), B = iso(x, y - 6 * k, 0, 0.55 * k);
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + B[0]) / 2 - 2 * k, (A[1] + B[1]) / 2 + 6 * k, B[0], B[1]); ctx.quadraticCurveTo((A[0] + B[0]) / 2 + 2 * k, (A[1] + B[1]) / 2 - 9 * k, A[0], A[1]);
    ctx.fillStyle = "#3f6a8a"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = "#e8e0d0"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo((A[0] + B[0]) / 2 - 2 * k, (A[1] + B[1]) / 2 + 6 * k, B[0], B[1]); ctx.stroke();
  }
  // Un filet de pêche étendu sur 3 perches
  function filet(ctx, x, y, k) {
    const pts = [-0.45, 0, 0.45].map((q) => iso(x, y, 0, q * k)), h = 17 * k;
    for (const P of pts) O().poteau(ctx, P, h, 1.2 * k);
    ctx.strokeStyle = "rgba(60, 50, 40, .75)"; ctx.lineWidth = 0.6; ctx.beginPath();
    for (let j = 0; j < 5; j++) { ctx.moveTo(pts[0][0], pts[0][1] - h + j * 3 * k); ctx.lineTo(pts[2][0], pts[2][1] - h + j * 3 * k + 1); }
    for (let i = 0; i <= 8; i++) { const u = i / 8, ax = pts[0][0] + (pts[2][0] - pts[0][0]) * u, ay = pts[0][1] + (pts[2][1] - pts[0][1]) * u - h; ctx.moveTo(ax, ay); ctx.lineTo(ax + 0.5, ay + 12 * k); }
    ctx.stroke();
    ctx.fillStyle = "#d9553b"; for (let i = 0; i < 4; i++) { const u = (i + 0.5) / 4; ctx.beginPath(); ctx.arc(pts[0][0] + (pts[2][0] - pts[0][0]) * u, pts[0][1] + (pts[2][1] - pts[0][1]) * u - h, 1.3 * k, 0, TOUR); ctx.fill(); } // les flotteurs
  }
  // Une pépinière : des rangs de jeunes arbres dans des bacs
  function pepiniere(ctx, x, y, k, t) {
    for (let i = 0; i < 3; i++) {
      const [bx, by] = iso(x, y, (i - 1) * 0.28 * k, 0);
      boite(ctx, bx, by, 0.2 * k, 0.9 * k, 3 * k, "#7a5032");
      for (let j = 0; j < 4; j++) { const [sx, sy] = iso(bx, by - 3 * k, 0, (j - 1.5) * 0.2 * k); const hh = (6 + ((i + j) % 3) * 2) * k; face(ctx, [[sx - 3 * k, sy], [sx, sy - hh], [sx + 3 * k, sy]], (i + j) % 2 ? "#3f8a4a" : "#56a85a"); }
    }
  }
  // Une charrette chargée (de blé, de sacs, de tonneaux…)
  function charrette(ctx, x, y, k, charge, couleurCharge) {
    O().roue(ctx, ...iso(x, y - 4 * k, 0.2 * k, -0.25 * k), 5 * k, 0, "#7a5030", 6, false);
    const d = boite(ctx, x, y - 5 * k, 0.4 * k, 0.75 * k, 4 * k, "#a87a4a");
    O().roue(ctx, ...iso(x, y - 4 * k, 0.2 * k, 0.25 * k), 5 * k, 0, "#7a5030", 6, false);
    const cx = (d[0][0] + d[2][0]) / 2, cy = (d[0][1] + d[2][1]) / 2;
    if (charge === "meule") { ctx.beginPath(); ctx.ellipse(cx, cy - 3 * k, 11 * k, 6 * k, -0.45, 0, TOUR); ctx.fillStyle = couleurCharge || "#d9b44a"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke(); }
    else if (charge === "sacs") { sac(ctx, cx - 4 * k, cy + 1 * k, 0.8 * k, couleurCharge); sac(ctx, cx + 3 * k, cy - 1 * k, 0.8 * k, couleurCharge); }
    else if (charge === "tonneaux") { tonneau(ctx, cx - 3 * k, cy + 2 * k, 0.7 * k); tonneau(ctx, cx + 4 * k, cy - 1 * k, 0.7 * k); }
    const [tx, ty] = iso(x, y - 3 * k, 0, -0.62 * k); O().poutre(ctx, [tx, ty], [tx - 9 * k, ty + 4.5 * k], 1 * k, "#7a5030"); // le timon
  }
  // Un épouvantail
  function epouvantail(ctx, x, y, k, t) {
    O().poteau(ctx, [x, y], 18 * k, 1.4 * k); O().poutre(ctx, [x - 7 * k, y - 13 * k], [x + 7 * k, y - 14 * k], 1.2 * k, "#8a5a2b");
    face(ctx, [[x - 5 * k, y - 15 * k], [x + 5 * k, y - 15.5 * k], [x + 4 * k + Math.sin(t) * 0.5, y - 6 * k], [x - 4 * k, y - 5.5 * k]], "#4a6a9a");
    O().rond(ctx, x, y - 18 * k, 2.6 * k, "#e8d0a0"); face(ctx, [[x - 4.5 * k, y - 19.5 * k], [x + 4.5 * k, y - 20 * k], [x, y - 24 * k]], "#c9a040");
  }
  // Un mannequin de couturier, avec un habit
  function mannequin(ctx, x, y, k, couleur) {
    O().poteau(ctx, [x, y], 7 * k, 1 * k);
    face(ctx, [[x - 4 * k, y - 7 * k], [x + 4 * k, y - 7 * k], [x + 5 * k, y - 17 * k], [x + 2 * k, y - 19 * k], [x - 2 * k, y - 19 * k], [x - 5 * k, y - 17 * k]], couleur);
    O().rond(ctx, x, y - 20.5 * k, 1.8 * k, "#d8c8b0");
  }
  // Un portant : une barre et des vêtements colorés
  function portant(ctx, x, y, k, couleurs) {
    const P = iso(x, y, 0, -0.4 * k), Q = iso(x, y, 0, 0.4 * k), h = 18 * k;
    O().poteau(ctx, P, h, 1.1 * k); O().poteau(ctx, Q, h, 1.1 * k); O().poutre(ctx, [P[0], P[1] - h], [Q[0], Q[1] - h], 1 * k, "#5a5a5e");
    for (let i = 0; i < 5; i++) { const u = (i + 0.5) / 5, ax = P[0] + (Q[0] - P[0]) * u, ay = P[1] + (Q[1] - P[1]) * u - h + 1; face(ctx, [[ax - 3 * k, ay], [ax + 3 * k, ay], [ax + 3.5 * k, ay + 11 * k], [ax - 3.5 * k, ay + 11 * k]], couleurs[i % couleurs.length]); }
  }
  // Un fumoir : une petite cabane de planches qui fume, avec des jambons pendus
  function fumoir(ctx, x, y, k, t) {
    const d = boite(ctx, x, y, 0.4 * k, 0.4 * k, 14 * k, "#5a4030");
    const s = [(d[0][0] + d[2][0]) / 2, (d[0][1] + d[2][1]) / 2]; face(ctx, [d[0], d[1], [s[0], s[1] - 8 * k]], "#3a2a20"); face(ctx, [d[1], d[2], [s[0], s[1] - 8 * k]], "#2a1e16");
    O().fumee(ctx, s[0], s[1] - 10 * k, t + 7);
  }
  // Des tuiles empilées et une échelle (le maçon-couvreur)
  function tuilesEmpilees(ctx, x, y, k) {
    for (let j = 0; j < 4; j++) for (const p of [-0.12, 0.12]) boite(ctx, ...iso(x, y - j * 3 * k, p * k, 0), 0.22 * k, 0.5 * k, 3 * k, j % 2 ? "#b8503a" : "#a8432e");
  }
  function echelle(ctx, x, y, k) {
    const h = 30 * k; ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.4 * k; ctx.beginPath();
    ctx.moveTo(x - 3 * k, y); ctx.lineTo(x + 3 * k, y - h); ctx.moveTo(x + 3 * k, y); ctx.lineTo(x + 9 * k, y - h);
    for (let i = 1; i < 7; i++) { const u = i / 7; ctx.moveTo(x - 3 * k + 6 * k * u, y - h * u); ctx.lineTo(x + 3 * k + 6 * k * u, y - h * u); } ctx.stroke();
  }
  function auge(ctx, x, y, k, contenu) {
    const d = boite(ctx, x, y, 0.22 * k, 0.6 * k, 4 * k, "#7a5032");
    face(ctx, [entre(d[0], d[2], 0.12), entre(d[1], d[3], 0.12), entre(d[2], d[0], 0.12), entre(d[3], d[1], 0.12)], contenu);
  }
  const entre = (P, Q, u) => [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u];
  // Des bidons de lait alignés
  function bidons(ctx, x, y, k, n) { for (let i = 0; i < n; i++) { const [bx, by] = iso(x, y, (i % 2) * 0.15 * k, (Math.floor(i / 2) - 1) * 0.18 * k); ctx.save(); ctx.translate(bx, by); ctx.scale(1.3 * k, 1.3 * k); O().bidon(ctx, 0, 0); ctx.restore(); } }
  // Une étagère à fromages (des meules jaunes sur des planches)
  function etagereFromages(ctx, x, y, k) {
    for (let j = 0; j < 3; j++) {
      boite(ctx, x, y - j * 8 * k, 0.24 * k, 0.9 * k, 1.5 * k, "#8a6440");
      for (let i = 0; i < 4; i++) { const [cx, cy] = iso(x, y - j * 8 * k - 1.5 * k, 0, (i - 1.5) * 0.21 * k); ctx.beginPath(); ctx.ellipse(cx, cy - 2.5 * k, 4 * k, 2 * k, 0, 0, TOUR); ctx.fillStyle = "#e8c050"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.6; ctx.stroke(); ctx.fillStyle = "#c89a30"; ctx.fillRect(cx - 4 * k, cy - 2.5 * k, 8 * k, 2.4 * k); ctx.beginPath(); ctx.ellipse(cx, cy - 4.5 * k, 4 * k, 2 * k, 0, 0, TOUR); ctx.fillStyle = "#f2d070"; ctx.fill(); ctx.stroke(); }
    }
    for (const q of [-0.5, 0.5]) O().poteau(ctx, iso(x, y, 0.12 * k, q * k), 22 * k, 1.2 * k);
  }
  // Des rails et un wagonnet plein de minerai
  function wagonnet(ctx, x, y, k, couleur) {
    const A = iso(x, y, 0, -0.75 * k), B = iso(x, y, 0, 0.75 * k);
    ctx.strokeStyle = "#6a5a4a"; ctx.lineWidth = 1.3; for (let i = 0; i <= 6; i++) { const u = i / 6, cx = A[0] + (B[0] - A[0]) * u, cy = A[1] + (B[1] - A[1]) * u; ctx.beginPath(); ctx.moveTo(cx - 4 * k, cy - 2 * k); ctx.lineTo(cx + 4 * k, cy + 2 * k); ctx.stroke(); }
    ctx.strokeStyle = "#5a5e66"; ctx.lineWidth = 1.2; for (const s of [-2.5, 2.5]) { ctx.beginPath(); ctx.moveTo(A[0] + s * k, A[1] + s * 0.5 * k); ctx.lineTo(B[0] + s * k, B[1] + s * 0.5 * k); ctx.stroke(); }
    const d = boite(ctx, x, y - 3 * k, 0.32 * k, 0.4 * k, 7 * k, "#5a5e66");
    const cx = (d[0][0] + d[2][0]) / 2, cy = (d[0][1] + d[2][1]) / 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 8 * k, 4 * k, 0, Math.PI, 0); ctx.fillStyle = couleur; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke();
  }
  // Des poutrelles d'acier empilées
  function poutrelles(ctx, x, y, k) {
    for (let j = 0; j < 4; j++) for (const p of [-0.16, 0, 0.16]) { const d = boite(ctx, ...iso(x, y - j * 3.2 * k, p * k, 0), 0.12 * k, 1.1 * k, 3.2 * k, j % 2 ? "#7a8290" : "#6a7280"); }
  }
  // Des tuyaux (de gros cylindres gris) empilés
  function tuyaux(ctx, x, y, k, couleur) {
    const c = couleur || "#8a9098";
    for (const [i, j] of [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1]]) {
      const r = 3.6 * k, A = iso(x, y, (i - 1) * 0.13 * k, -0.5 * k), B = iso(x, y, (i - 1) * 0.13 * k, 0.5 * k), dy = -r - j * r * 1.75;
      ctx.lineCap = "butt"; ctx.strokeStyle = TRAIT; ctx.lineWidth = r * 2 + 1.2; ctx.beginPath(); ctx.moveTo(A[0], A[1] + dy); ctx.lineTo(B[0], B[1] + dy); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = r * 2; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(A[0], A[1] + dy, r * 0.9, r, 0, 0, TOUR); ctx.fillStyle = nuance(c.length === 7 ? c : "#8a9098", 0.55); ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.7; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(A[0], A[1] + dy, r * 0.55, r * 0.6, 0, 0, TOUR); ctx.fillStyle = "#2a2a2e"; ctx.fill();
    }
  }
  // Un tapis roulant qui monte le charbon
  function tapis(ctx, x, y, k, t, marche) {
    const A = [x - 14 * k, y + 4 * k], B = [x + 10 * k, y - 22 * k];
    for (const u of [0.15, 0.5, 0.85]) { const P = entre(A, B, u); O().poutre(ctx, [P[0], P[1] + (1 - u) * 22 * k * 0 + 2], [P[0], P[1] + 26 * k * (1 - u) * 0.9 + 2], 1.2 * k, "#5a6068"); }
    ctx.strokeStyle = TRAIT; ctx.lineWidth = 5 * k + 1.2; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke(); ctx.strokeStyle = "#3a3c40"; ctx.lineWidth = 5 * k; ctx.stroke();
    ctx.fillStyle = "#18181c"; for (let i = 0; i < 5; i++) { const u = ((i / 5) + (marche ? t * 0.3 : 0)) % 1, P = entre(A, B, u); ctx.beginPath(); ctx.arc(P[0], P[1] - 2.5 * k, 1.6 * k, 0, TOUR); ctx.fill(); }
  }
  // Un poste électrique : un transformateur et un pylône, dans un grillage
  function postElectrique(ctx, x, y, k, t, marche) {
    boite(ctx, x - 6 * k, y + 2 * k, 0.22 * k, 0.22 * k, 9 * k, "#8a9098");
    const P = [x + 6 * k, y - 2 * k], h = 34 * k;
    for (const s of [-1, 1]) O().poutre(ctx, [P[0] + s * 5 * k, P[1]], [P[0] + s * 1.5 * k, P[1] - h], 1 * k, "#6a7078");
    for (let i = 1; i < 4; i++) O().poutre(ctx, [P[0] - 5 * k + i * 1.1 * k, P[1] - i * h / 4], [P[0] + 5 * k - i * 1.1 * k, P[1] - i * h / 4], 0.8 * k, "#6a7078");
    O().poutre(ctx, [P[0] - 8 * k, P[1] - h + 4 * k], [P[0] + 8 * k, P[1] - h + 4 * k], 1.2 * k, "#6a7078");
    if (marche && Math.sin(t * 6) > 0.9) O().lumiere(P[0], P[1] - h + 4 * k, 12 * k, "jaune", 0.7);
  }
  // Une fontaine : un bassin rond, et un jet d'eau
  function fontaine(ctx, x, y, k, t) {
    const r = 11 * k;
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, TOUR); ctx.fillStyle = "#c9c4ba"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 1, r * 0.82, r * 0.4, 0, 0, TOUR); ctx.fillStyle = Village.Batisses.vue.hiver ? "#dfe8f0" : "#6a9ac0"; ctx.fill();
    O().poteau(ctx, [x, y - 1], 8 * k, 1.6 * k);
    if (!Village.Batisses.vue.hiver) { ctx.strokeStyle = "rgba(220, 240, 255, .85)"; ctx.lineWidth = 1; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(x, y - 9 * k); ctx.quadraticCurveTo(x + s * 5 * k, y - 15 * k - Math.sin(t * 5) * k, x + s * 8 * k, y - 2 * k); } ctx.stroke(); }
  }
  function haie(ctx, x, y, k, long) {
    for (let i = 0; i < Math.round(long * 4); i++) { const [hx, hy] = iso(x, y, 0, (i / (long * 4) - 0.5) * long * k); O().rond(ctx, hx, hy - 3 * k, 3.6 * k, Village.Batisses.vue.hiver ? "#e8eef5" : i % 2 ? "#3f7a3a" : "#4a8a42"); }
  }
  function massif(ctx, x, y, k) {
    ctx.beginPath(); ctx.ellipse(x, y, 9 * k, 4.5 * k, 0, 0, TOUR); ctx.fillStyle = "#6a4a2a"; ctx.fill();
    if (Village.Batisses.vue.hiver) return;
    const c = ["#d9553b", "#e8b830", "#b06ab8", "#f2ece0"];
    for (let i = 0; i < 10; i++) { const a = i * 2.39, r = (i % 4) * 2 * k; ctx.fillStyle = i % 3 ? "#4a8a42" : c[i % 4]; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 1.6, y - 1 + Math.sin(a) * r * 0.6, 1.8 * k, 0, TOUR); ctx.fill(); }
  }
  function banc(ctx, x, y, k) { boite(ctx, x, y, 0.12 * k, 0.4 * k, 4 * k, "#8a5a32"); boite(ctx, ...iso(x, y, -0.07 * k, 0), 0.04 * k, 0.4 * k, 8 * k, "#7a4a2a"); }
  function lampadaire(ctx, x, y, k) { ctx.strokeStyle = "#2a2e34"; ctx.lineWidth = 1.4 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22 * k); ctx.stroke(); O().rond(ctx, x, y - 23 * k, 2.2 * k, Village.Batisses.vue.noirceur > 0.15 ? "#ffe08a" : "#e8e0c8"); if (Village.Batisses.vue.noirceur > 0.15) O().lumiere(x, y - 23 * k, 22 * k, "jaune", 0.8); }
  function arbreBoule(ctx, x, y, k) { O().poteau(ctx, [x, y], 8 * k, 1.4 * k); O().rond(ctx, x, y - 12 * k, 7 * k, Village.Batisses.vue.hiver ? "#e8eef5" : "#4a8a42"); }
  function statue(ctx, x, y, k) { boite(ctx, x, y, 0.22 * k, 0.22 * k, 6 * k, "#c9c4ba"); ctx.beginPath(); ctx.ellipse(x, y - 12 * k, 2.6 * k, 6 * k, 0, 0, TOUR); ctx.fillStyle = "#8a9a8a"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke(); O().rond(ctx, x, y - 19.5 * k, 2.2 * k, "#8a9a8a"); }
  // Un coffre fort (l'orfèvre)
  function coffre(ctx, x, y, k) { const d = boite(ctx, x, y, 0.3 * k, 0.4 * k, 8 * k, "#5a4a3a"); ctx.strokeStyle = "#e0b840"; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(d[0][0], d[0][1] + 3 * k); ctx.lineTo(d[1][0], d[1][1] + 3 * k); ctx.lineTo(d[2][0], d[2][1] + 3 * k); ctx.stroke(); O().rond(ctx, (d[0][0] + d[1][0]) / 2, (d[0][1] + d[1][1]) / 2 + 5 * k, 1.2 * k, "#e0b840"); }
  // Un drapeau à croix verte (le vétérinaire)
  function drapeauCroix(ctx, x, y, k, t) {
    O().poteau(ctx, [x, y], 26 * k, 1.2 * k);
    const o = Math.sin(t * 2) * k; face(ctx, [[x, y - 26 * k], [x + 12 * k, y - 25 * k + o], [x + 12 * k, y - 17 * k + o], [x, y - 18 * k]], "#f2ece0");
    ctx.fillStyle = "#3f8a4a"; ctx.fillRect(x + 4.6 * k, y - 24 * k + o * 0.5, 2.8 * k, 6.5 * k); ctx.fillRect(x + 2.6 * k, y - 22.2 * k + o * 0.5, 6.8 * k, 2.8 * k);
  }
  // Une tente de toile (le campement du géologue)
  function tente(ctx, x, y, k) {
    const A = iso(x, y, 0.3 * k, -0.35 * k), B = iso(x, y, 0.3 * k, 0.35 * k), C = iso(x, y, -0.3 * k, 0.35 * k), D = iso(x, y, -0.3 * k, -0.35 * k), h = 15 * k;
    const S1 = [(A[0] + D[0]) / 2, (A[1] + D[1]) / 2 - h], S2 = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2 - h];
    face(ctx, [D, S1, S2, C], "#b8a888"); face(ctx, [A, B, S2, S1], "#d8c8a0"); face(ctx, [A, S1, D], "#a89878");
    face(ctx, [entre(A, D, 0.3), S1, entre(A, D, 0.7)], "#4a3a2a");
  }
  // Un trépied d'arpenteur (le géologue)
  function trepied(ctx, x, y, k) { for (const s of [-1, 0, 1]) O().poutre(ctx, [x + s * 5 * k, y + (s ? 0 : 2 * k)], [x, y - 14 * k], 0.9 * k, "#8a6a3a"); boite(ctx, x, y - 14 * k, 0.12 * k, 0.18 * k, 4 * k, "#c9a636"); }
  // Une poubelle et un vélo (la cour de l'immeuble)
  function poubelles(ctx, x, y, k) { for (const [q, c] of [[-0.12, "#3f6a4a"], [0.12, "#4a5a6a"]]) { const [px, py] = iso(x, y, 0, q * k); boite(ctx, px, py, 0.2 * k, 0.2 * k, 9 * k, c); } }
  // Étape 48 : 🌆 les objets des services publics
  // Un véhicule à moteur (l'ambulance, le camion de pompiers, la voiture de police), posé le long de q.
  //   o.long : sa longueur (cases) ; o.haut : sa hauteur (px) ; o.signe : "croix", "echelle" ou "gyro" ; t : pour le gyrophare
  function vehicule(ctx, x, y, k, couleur, o, t) {
    const L = (o.long || 0.7) * k, H = (o.haut || 9) * k;
    ombreSol(ctx, x, y, 13 * k);
    for (const q of [-L * 0.32, L * 0.32]) O().rond(ctx, ...iso(x, y - 2.2 * k, -0.17 * k, q), 2.6 * k, "#26282c"); // les roues de derrière (en partie cachées)
    const d = boite(ctx, x, y - 2.2 * k, 0.3 * k, L, H, couleur);
    // les vitres (de côté) et le pare-brise
    const V = (u, v) => [d[1][0] + (d[2][0] - d[1][0]) * u, d[1][1] + (d[2][1] - d[1][1]) * u + H * v]; // un point du côté droit : u le long, v vers le bas
    face(ctx, [V(0.62, 0.18), V(0.9, 0.18), V(0.9, 0.5), V(0.62, 0.5)], "#9ac0d8");
    face(ctx, [V(0.12, 0.2), V(0.5, 0.2), V(0.5, 0.48), V(0.12, 0.48)], o.signe === "croix" ? "#f2f2ee" : "#9ac0d8");
    if (o.bande) { ctx.strokeStyle = o.bande; ctx.lineWidth = 1.6 * k; ctx.beginPath(); ctx.moveTo(...V(0.02, 0.7)); ctx.lineTo(...V(0.98, 0.7)); ctx.stroke(); }
    const c = [(d[0][0] + d[2][0]) / 2, (d[0][1] + d[2][1]) / 2];
    if (o.signe === "croix") { ctx.fillStyle = "#d0302a"; const m = V(0.3, 0.34); ctx.fillRect(m[0] - 1 * k, m[1] - 3 * k, 2 * k, 6 * k); ctx.fillRect(m[0] - 3 * k, m[1] - 1 * k, 6 * k, 2 * k); }
    if (o.signe === "echelle") { // la grande échelle couchée sur le toit
      ctx.strokeStyle = "#d8dce2"; ctx.lineWidth = 1 * k; ctx.beginPath(); const A = entre(d[0], d[3], 0.1), B = entre(d[1], d[2], 0.95);
      for (const dx of [-1.6, 1.6]) { ctx.moveTo(A[0] + dx * k, A[1] - 2 * k); ctx.lineTo(B[0] + dx * k, B[1] - 2 * k); }
      for (let i = 1; i < 8; i++) { const P = entre(A, B, i / 8); ctx.moveTo(P[0] - 1.6 * k, P[1] - 2 * k); ctx.lineTo(P[0] + 1.6 * k, P[1] - 2 * k); } ctx.stroke();
    }
    // le gyrophare (bleu ; il clignote de près)
    const allume = o.gyro && (t === undefined || Math.floor(t * 3) % 2 === 0);
    if (o.gyro) { O().rond(ctx, c[0] + 4 * k, c[1] - 1.5 * k, 1.8 * k, allume ? o.gyro : "#5a6a7a"); if (allume && t !== undefined) O().lumiere(c[0] + 4 * k, c[1] - 1.5 * k, 12 * k, "bleu", 0.7); }
    for (const q of [-L * 0.32, L * 0.32]) O().rond(ctx, ...iso(x, y + 0.5 * k, 0.15 * k, q), 2.6 * k, "#26282c"); // les roues de devant
  }
  // Une balançoire (la cour de l'école)
  function balancoire(ctx, x, y, k, t) {
    const P = iso(x, y, 0, -0.4 * k), Q = iso(x, y, 0, 0.4 * k), h = 20 * k;
    for (const B of [P, Q]) { O().poutre(ctx, [B[0] - 4 * k, B[1]], [B[0], B[1] - h], 1.2 * k, "#c8443a"); O().poutre(ctx, [B[0] + 4 * k, B[1]], [B[0], B[1] - h], 1.2 * k, "#c8443a"); }
    O().poutre(ctx, [P[0], P[1] - h], [Q[0], Q[1] - h], 1.4 * k, "#3f6fc4");
    const a = Math.sin((t || 0) * 2.2) * 0.35;
    for (const u of [0.33, 0.66]) { const A = entre([P[0], P[1] - h], [Q[0], Q[1] - h], u), B = [A[0] + Math.sin(a) * 13 * k, A[1] + Math.cos(a) * 13 * k]; ctx.strokeStyle = "#3a3028"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(A[0] - 2 * k, A[1]); ctx.lineTo(B[0] - 2 * k, B[1]); ctx.moveTo(A[0] + 2 * k, A[1]); ctx.lineTo(B[0] + 2 * k, B[1]); ctx.stroke(); face(ctx, [[B[0] - 3 * k, B[1]], [B[0] + 3 * k, B[1]], [B[0] + 3 * k, B[1] + 1.4 * k], [B[0] - 3 * k, B[1] + 1.4 * k]], "#e8b830"); }
  }
  // Une marelle dessinée à la craie sur le sol
  function marelle(ctx, x, y, k) {
    ctx.strokeStyle = "rgba(250, 250, 245, .85)"; ctx.lineWidth = 0.9; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const pts = [iso(x, y, -0.09 * k, (i - 2.5) * 0.17 * k), iso(x, y, 0.09 * k, (i - 2.5) * 0.17 * k), iso(x, y, 0.09 * k, (i - 1.5) * 0.17 * k), iso(x, y, -0.09 * k, (i - 1.5) * 0.17 * k)]; ctx.moveTo(...pts[0]); for (const P of pts.slice(1)) ctx.lineTo(...P); ctx.closePath(); }
    ctx.stroke();
  }
  // Une bouche d'incendie rouge
  function boucheIncendie(ctx, x, y, k) { O().tourRonde(ctx, x, y, { r: 2.2 * k, h: 7 * k, ht: 2 * k, clair: "#e0483a", fonce: "#9a2a22", toit: "dome", toitA: "#e0483a", toitB: "#9a2a22" }); O().rond(ctx, x - 2.4 * k, y - 4 * k, 1.1 * k, "#c8b040"); }
  // Des tuyaux d'incendie enroulés (des disques rouges)
  function tuyauxEnroules(ctx, x, y, k) { for (const [p, q, j] of [[0, -0.15, 0], [0, 0.15, 0], [0, 0, 1]]) { const [cx, cy] = iso(x, y - j * 4 * k, p * k, q * k); ctx.beginPath(); ctx.ellipse(cx, cy - 2 * k, 5.5 * k, 2.8 * k, 0, 0, TOUR); ctx.fillStyle = "#b8302a"; ctx.fill(); ctx.strokeStyle = TRAIT; ctx.lineWidth = 0.8; ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy - 2.3 * k, 1.8 * k, 0.9 * k, 0, 0, TOUR); ctx.fillStyle = "#5a1a14"; ctx.fill(); } }
  // Des barrières de police, rayées bleu et blanc
  function barrieres(ctx, x, y, k) {
    for (const q of [-0.3, 0.1]) {
      const A = iso(x, y, 0, q * k), B = iso(x, y, 0, (q + 0.3) * k);
      O().poteau(ctx, A, 7 * k, 0.9 * k); O().poteau(ctx, B, 7 * k, 0.9 * k);
      for (let i = 0; i < 4; i++) { const P = entre([A[0], A[1] - 6 * k], [B[0], B[1] - 6 * k], i / 4), Q = entre([A[0], A[1] - 6 * k], [B[0], B[1] - 6 * k], (i + 1) / 4); face(ctx, [P, Q, [Q[0], Q[1] + 2.4 * k], [P[0], P[1] + 2.4 * k]], i % 2 ? "#f2f2ee" : "#2f5aa8"); }
    }
  }
  // Une hélisurface (un grand H dans un cercle)
  function heliport(ctx, x, y, k) {
    ctx.beginPath(); ctx.ellipse(x, y, 14 * k, 7 * k, 0, 0, TOUR); ctx.fillStyle = "#6a6e74"; ctx.fill(); ctx.strokeStyle = "rgba(250, 250, 245, .9)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(...iso(x, y, s * 0.1 * k, -0.12 * k)); ctx.lineTo(...iso(x, y, s * 0.1 * k, 0.12 * k)); } ctx.moveTo(...iso(x, y, -0.1 * k, 0)); ctx.lineTo(...iso(x, y, 0.1 * k, 0)); ctx.lineWidth = 1.6 * k; ctx.stroke();
  }

  // Étape 52 : 🛍️ un parking (des places tracées en blanc et des voitures garées)
  function parking(ctx, x, y, k, n) {
    ctx.strokeStyle = "rgba(245, 242, 230, .8)"; ctx.lineWidth = 0.9; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const A = iso(x, y, -0.3 * k, (i - n / 2) * 0.3 * k), B = iso(x, y, 0.3 * k, (i - n / 2) * 0.3 * k); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
    ctx.stroke();
    const couleurs = ["#c8443a", "#3f6fc4", "#f2f2ee", "#e8b830", "#3f8a4a", "#2a2c30"];
    for (let i = 0; i < n; i++) if ((i * 7 + 3) % 5 !== 0) { const [px, py] = iso(x, y, 0, (i - n / 2 + 0.5) * 0.3 * k); O().vehiculeIso(ctx, px, py, 1, 0, { long: 0.42 * k, large: 0.22 * k, caisse: [5 * k, couleurs[i % couleurs.length]], cabine: [9 * k, couleurs[i % couleurs.length]], part: 0.6 }); }
  }
  // Un chariot de supermarché
  function caddie(ctx, x, y, k) { ctx.strokeStyle = "#8a9098"; ctx.lineWidth = 1 * k; for (let i = 0; i < 3; i++) { const [cx, cy] = iso(x, y, 0, (i - 1) * 0.12 * k); ctx.beginPath(); ctx.moveTo(cx - 4 * k, cy - 8 * k); ctx.lineTo(cx + 3 * k, cy - 8 * k); ctx.lineTo(cx + 2 * k, cy - 3 * k); ctx.lineTo(cx - 3 * k, cy - 3 * k); ctx.closePath(); ctx.moveTo(cx - 4 * k, cy - 8 * k); ctx.lineTo(cx - 6 * k, cy - 10 * k); ctx.stroke(); O().rond(ctx, cx - 2 * k, cy - 1 * k, 0.9 * k, "#2a2c30"); O().rond(ctx, cx + 2 * k, cy - 1 * k, 0.9 * k, "#2a2c30"); } }
  // ✈️ Un avion de ligne, garé (ou en vol : il s'élève et s'éloigne), le nez vers q
  function avion(ctx, x, y, k, couleur, hauteur) {
    const z = hauteur || 0, P = (p, q, h) => { const [a, b] = iso(x, y, p * k, q * k); return [a, b - (h || 0) * k - z]; };
    if (!z) ombreSol(ctx, x, y, 30 * k); else { ctx.fillStyle = "rgba(20, 30, 10, .15)"; ctx.beginPath(); ctx.ellipse(x, y, 30 * k, 12 * k, 0, 0, TOUR); ctx.fill(); }
    face(ctx, [P(-0.9, 0.05, 6), P(0.9, 0.05, 6), P(0.9, -0.15, 6), P(-0.9, -0.15, 6)], "#c8ccd2"); // les ailes
    ctx.lineCap = "round"; const A = P(0, -0.85, 8), B = P(0, 0.9, 8);
    ctx.strokeStyle = TRAIT; ctx.lineWidth = 9 * k + 1.4; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
    ctx.strokeStyle = "#f4f6f8"; ctx.lineWidth = 9 * k; ctx.stroke();
    ctx.strokeStyle = couleur; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(A[0], A[1] + 2 * k); ctx.lineTo(B[0], B[1] + 2 * k); ctx.stroke(); ctx.lineCap = "butt";
    ctx.fillStyle = "#3a4a5a"; for (let i = 0; i < 9; i++) { const W = P(0, -0.6 + i * 0.15, 9.5); ctx.fillRect(W[0] - 0.8, W[1] - 0.8, 1.6, 1.6); } // les hublots
    const T0 = P(0, -0.8, 9), T1 = P(0, -0.6, 9); face(ctx, [T0, T1, [T1[0], T1[1] - 4 * k], [T0[0], T0[1] - 13 * k]], couleur); // la dérive (la queue)
    face(ctx, [P(-0.3, -0.75, 9), P(0.3, -0.75, 9), P(0.3, -0.85, 9), P(-0.3, -0.85, 9)], "#c8ccd2"); // les petites ailes de la queue
  }
  // Une manche à air (rayée rouge et blanc)
  function mancheAir(ctx, x, y, k, t) { O().poteau(ctx, [x, y], 20 * k, 1 * k); const v = Math.sin(t * 1.3) * 0.15; for (let i = 0; i < 4; i++) face(ctx, [[x + i * 3 * k, y - 20 * k + i * v * 3 * k], [x + (i + 1) * 3 * k, y - 20 * k + (i + 1) * v * 3 * k], [x + (i + 1) * 3 * k, y - 16.5 * k + (i + 1) * (v * 3 + 0.4) * k], [x + i * 3 * k, y - 16 * k + i * (v * 3 + 0.4) * k]], i % 2 ? "#f2f2ee" : "#d9553b"); }
  // La piste : une bande d'asphalte foncé, avec des pointillés blancs au milieu
  function piste(ctx, x, y, k) {
    const L = 2 * k, W = 0.35 * k;
    face(ctx, [iso(x, y, -W, -L), iso(x, y, W, -L), iso(x, y, W, L), iso(x, y, -W, L)], "#3a3c40");
    ctx.strokeStyle = "rgba(250, 250, 245, .9)"; ctx.lineWidth = 1.4; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(...iso(x, y, 0, -L + 0.2)); ctx.lineTo(...iso(x, y, 0, L - 0.2)); ctx.stroke(); ctx.setLineDash([]);
  }

  // ---------------------------------------------------------------- les sols et les clôtures
  const SOLS = { asphalte: ["#5a5d62", "#4c4f54"], terre: ["#b49a72", "#9a8260"], gravier: ["#aaa69c", "#8e8a80"], paves: ["#a8a29a", "#8a847c"], pelouse: ["#7aa25a", "#6a9050"], scierie: ["#c4a878", "#a88c5e"], charbon: ["#5a5650", "#4a4640"], sable: ["#cdb88a", "#b8a074"] };
  const CLOTURES = { bois: "#8a6440", fer: "#3a3e44", pierre: "#a8a296", haie: "#4a8a42", aucune: null };

  // Le décor de chaque bâtiment. sol, cloture, puis la liste des objets : [où, dessin(ctx, x, y, k, b, t)]
  //   où : "G" (coin gauche), "D" (coin de devant), "Dr" (coin droit), "DDr" (entre devant et droite), "GD" (entre gauche
  //   et devant), "F" (à côté du bâtiment, au fond à gauche)
  const vue = () => Village.Batisses.vue;
  const stockDe = (r) => (Village.monde && Village.monde.stock && Village.monde.stock[r]) || 0;
  const DECORS = {
    entrepot: { sol: "terre", cloture: "bois", objets: [
      ["G", (c, x, y, k) => etagere(c, x, y, k, 1.2, ["#c8a06a", "sac", "#b88e58", "#7a8aa0", "#d2ae78", "tonneau"])],
      ["Dr", (c, x, y, k) => etagere(c, x, y, k, 1.2, ["#b88e58", "#c8a06a", "#8a6a4a", "sac", "#d2ae78"])],
      ["D", (c, x, y, k, b) => { O().cour(c, x, y - 4, Village.monde ? Village.monde.stock : {}); palette(c, ...iso(x, y, 0.35, -0.35), k * 0.9); }], // (b : il change avec le stock)
    ] },
    depot: { sol: "terre", cloture: "bois", objets: [
      ["G", (c, x, y, k) => etagere(c, x, y, k, 1.1, ["#c8a06a", "#b88e58", "sac", "#d2ae78"])],
      ["D", (c, x, y, k) => { palette(c, x - 8 * k, y, k); palette(c, x + 10 * k, y + 2 * k, k, ["#9aa8b8", "#c8a06a"]); }],
      ["Dr", (c, x, y, k) => charrette(c, x, y, k, "tonneaux")],
    ] },
    bucheron: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => grumes(c, x, y, k, 0.9)],
      ["G", (c, x, y, k, b, t) => { O().rond(c, x, y, 4.5 * k, "#c78b4a"); c.strokeStyle = "#5a3818"; c.lineWidth = 1.6 * k; c.beginPath(); c.moveTo(x, y - 3 * k); c.lineTo(x + 3 * k, y - 13 * k); c.stroke(); face(c, [[x - 1, y - 2 * k], [x + 4 * k, y - 4 * k], [x + 2 * k, y + 1]], "#c9ccd1"); }],
    ] },
    forestier: { sol: "terre", cloture: "haie", objets: [
      ["D", (c, x, y, k, b, t) => pepiniere(c, x, y, k, t)],
      ["G", (c, x, y, k) => { O().seau(c, x, y); sacs(c, x + 8 * k, y + 2, k * 0.8, 2, "#8a6a4a"); }],
    ] },
    scierie: { sol: "scierie", cloture: "bois", objets: [
      ["G", (c, x, y, k) => grumes(c, x, y, k, 1.2)],
      ["D", (c, x, y, k) => { pilePlanches(c, x - 7 * k, y, k, 5); pilePlanches(c, x + 9 * k, y + 3 * k, k, 3); }],
      ["Dr", (c, x, y, k) => tas(c, x, y, 9 * k, 7 * k, "#e8cf98", "#c8a868")],
    ] },
    carriere: { sol: "gravier", cloture: "pierre", objets: [
      ["D", (c, x, y, k) => blocsPierre(c, x, y, k)],
      ["G", (c, x, y, k) => grue(c, x, y, k, "#b4afa4")],
      ["Dr", (c, x, y, k) => tas(c, x, y, 10 * k, 8 * k, "#9a968c", "#6a665c")],
    ] },
    pecheur: { sol: "sable", cloture: "bois", objets: [
      ["G", (c, x, y, k, b, t) => sechoir(c, x, y, k, 0.8, "poisson", null, t)],
      ["D", (c, x, y, k) => barque(c, x, y, k)],
      ["Dr", (c, x, y, k) => filet(c, x, y, k * 0.8)],
    ] },
    chasseur: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => cadrePeau(c, x, y, k)],
      ["G", (c, x, y, k) => trophee(c, x, y, k)],
      ["Dr", (c, x, y, k) => cible(c, x, y, k)],
    ] },
    geologue: { sol: "gravier", cloture: "aucune", objets: [
      ["D", (c, x, y, k) => tente(c, x, y, k)],
      ["G", (c, x, y, k) => trepied(c, x, y, k)],
      ["Dr", (c, x, y, k) => { caisse(c, x - 5 * k, y, k, "#8a6a4a", "#7ab0d8"); caisse(c, x + 5 * k, y + 2 * k, k, "#8a6a4a", "#c87ab0"); }],
    ] },
    universite: { sol: "pelouse", cloture: "fer", objets: [
      ["D", (c, x, y, k, b, t) => fontaine(c, x, y, k, t)],
      ["G", (c, x, y, k) => { statue(c, x, y, k); banc(c, ...iso(x, y, 0.4, 0.1), k); }],
      ["Dr", (c, x, y, k) => { massif(c, x, y, k); arbreBoule(c, ...iso(x, y, -0.3, 0.3), k); }],
    ] },
    mineCharbon: { sol: "charbon", cloture: "bois", objets: [
      ["D", (c, x, y, k) => wagonnet(c, x, y, k, "#1e1e22")],
      ["Dr", (c, x, y, k) => tas(c, x, y, 10 * k, 8 * k, "#2a2a2e", "#5a5f6e")],
      ["G", (c, x, y, k) => grumes(c, x, y, k * 0.7, 0.7)],
    ] },
    mineFer: { sol: "gravier", cloture: "bois", objets: [
      ["D", (c, x, y, k) => wagonnet(c, x, y, k, "#8e5a3c")],
      ["Dr", (c, x, y, k) => tas(c, x, y, 10 * k, 8 * k, "#9a5e40", "#c8865a")],
      ["G", (c, x, y, k) => grumes(c, x, y, k * 0.7, 0.7)],
    ] },
    mineOr: { sol: "sable", cloture: "bois", objets: [
      ["D", (c, x, y, k) => wagonnet(c, x, y, k, "#e0b840")],
      ["Dr", (c, x, y, k) => { tas(c, x, y, 8 * k, 6 * k, "#8a7a5a", "#f2c230"); coffre(c, ...iso(x, y, 0.3, -0.3), k * 0.8); }],
      ["G", (c, x, y, k) => grumes(c, x, y, k * 0.7, 0.7)],
    ] },
    fonderie: { sol: "charbon", cloture: "pierre", objets: [
      ["G", (c, x, y, k) => tas(c, x, y, 11 * k, 9 * k, "#2a2a2e", "#5a5f6e")],
      ["D", (c, x, y, k) => tas(c, x, y, 10 * k, 8 * k, "#9a5e40", "#c8865a")],
      ["Dr", (c, x, y, k) => { for (let j = 0; j < 3; j++) for (const q of [-0.15, 0.15]) boite(c, ...iso(x, y - j * 3 * k, 0, q * k), 0.5 * k, 0.12 * k, 3 * k, j % 2 ? "#a8acb4" : "#8a8e96"); }],
    ] },
    forge: { sol: "terre", cloture: "pierre", objets: [
      ["D", (c, x, y, k) => { enclume(c, x, y, k); tonneau(c, ...iso(x, y, 0.3, -0.4), k * 0.9, "#5a5e66"); }],
      ["G", (c, x, y, k) => ratelier(c, x, y, k)],
      ["Dr", (c, x, y, k, b, t) => meuleAiguiser(c, x, y, k, t, b && b.travail)],
    ] },
    marche: { sol: "paves", cloture: "aucune", objets: [
      ["G", (c, x, y, k) => etal(c, x, y, k, "#c8443a", "#f2ece0", "#e8b830")],
      ["D", (c, x, y, k) => etal(c, x, y, k, "#3f6fc4", "#f2ece0", "#d9553b")],
      ["Dr", (c, x, y, k) => etal(c, x, y, k, "#3f8a4a", "#f2ece0", "#b06ab8")],
      ["DDr", (c, x, y, k) => { tonneau(c, x, y, k); tonneau(c, x + 8 * k, y + 2 * k, k); }],
    ] },
    ferme: { sol: "terre", cloture: "bois", objets: [
      ["G", (c, x, y, k) => meule(c, x, y, k)],
      ["D", (c, x, y, k) => charrette(c, x, y, k, "meule")],
      ["Dr", (c, x, y, k, b, t) => epouvantail(c, x, y, k, t)],
    ] },
    moulin: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => sacs(c, x, y, k, 6, "#f2ece0")],
      ["G", (c, x, y, k) => { c.beginPath(); c.ellipse(x, y - 8 * k, 4 * k, 8 * k, 0, 0, TOUR); c.fillStyle = "#a8a296"; c.fill(); c.strokeStyle = TRAIT; c.lineWidth = 1; c.stroke(); O().rond(c, x, y - 8 * k, 1.6 * k, "#5a5650"); }],
      ["Dr", (c, x, y, k) => charrette(c, x, y, k, "sacs", "#f2ece0")],
    ] },
    boulangerie: { sol: "paves", cloture: "aucune", objets: [
      ["D", (c, x, y, k, b) => four(c, x, y, k, b && b.travail)],
      ["G", (c, x, y, k) => O().tasDeBuches(c, x, y, 6)],
      ["Dr", (c, x, y, k) => { const d = boite(c, x, y, 0.35 * k, 0.6 * k, 7 * k, "#a87a4a"); for (let i = 0; i < 4; i++) { c.save(); c.translate((d[0][0] + d[2][0]) / 2 - 6 * k + i * 4 * k, (d[0][1] + d[2][1]) / 2 + 1 - i * 1.6 * k); c.scale(1.2 * k, 1.2 * k); O().miche(c, 0, 0); c.restore(); } }],
    ] },
    orfevre: { sol: "paves", cloture: "fer", objets: [
      ["D", (c, x, y, k) => { coffre(c, x - 5 * k, y, k); coffre(c, x + 6 * k, y + 2 * k, k * 0.8); }],
      ["G", (c, x, y, k, b) => lampadaire(c, x, y, k)], // (b : il s'allume la nuit)
      ["Dr", (c, x, y, k) => massif(c, x, y, k * 0.8)],
    ] },
    macon: { sol: "gravier", cloture: "bois", objets: [
      ["D", (c, x, y, k) => tuilesEmpilees(c, x, y, k)],
      ["G", (c, x, y, k) => echelle(c, x, y, k)],
      ["Dr", (c, x, y, k) => { auge(c, x, y, k, "#d8d0c0"); blocsPierre(c, ...iso(x, y, 0.2, 0.35), k * 0.6); }],
    ] },
    faneur: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => meule(c, x, y, k * 1.1)],
      ["G", (c, x, y, k) => meule(c, x, y, k * 0.9)],
      ["Dr", (c, x, y, k) => balles(c, x, y, k, 6, "#d9b44a", "#8a6a2a")],
    ] },
    etable: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => auge(c, x, y, k, "#6a9ac0")],
      ["G", (c, x, y, k) => balles(c, x, y, k, 4, "#d9b44a", "#8a6a2a")],
      ["Dr", (c, x, y, k) => bidons(c, x, y, k, 3)],
    ] },
    laiterie: { sol: "paves", cloture: "bois", objets: [
      ["D", (c, x, y, k) => bidons(c, x, y, k, 6)],
      ["G", (c, x, y, k) => { tonneau(c, x, y, k * 1.1, "#c8b8a0"); O().poteau(c, [x, y - 10 * k], 7 * k, 1 * k); }],
      ["Dr", (c, x, y, k) => charrette(c, x, y, k, "tonneaux")],
    ] },
    veterinaire: { sol: "terre", cloture: "bois", objets: [
      ["G", (c, x, y, k, b, t) => drapeauCroix(c, x, y, k, t)],
      ["D", (c, x, y, k) => { caisse(c, x - 4 * k, y, k, "#f2ece0"); c.fillStyle = "#c8443a"; c.fillRect(x - 5.5 * k, y - 5 * k, 3 * k, 1.2 * k); c.fillRect(x - 4.6 * k, y - 6 * k, 1.2 * k, 3 * k); auge(c, ...iso(x, y, 0.2, 0.4), k, "#6a9ac0"); }],
      ["Dr", (c, x, y, k) => balles(c, x, y, k, 3, "#d9b44a", "#8a6a2a")],
    ] },
    fromagerie: { sol: "paves", cloture: "pierre", objets: [
      ["D", (c, x, y, k) => etagereFromages(c, x, y, k)],
      ["G", (c, x, y, k) => tonneau(c, x, y, k)],
      ["Dr", (c, x, y, k) => bidons(c, x, y, k, 3)],
    ] },
    cremerie: { sol: "paves", cloture: "aucune", objets: [
      ["D", (c, x, y, k) => { for (let i = 0; i < 3; i++) caisse(c, ...iso(x, y - (i === 2 ? 7 * k : 0), (i % 2) * 0.3 - 0.15, i === 2 ? 0 : 0), k, "#d8d0c4", "#f2ece0"); }],
      ["G", (c, x, y, k) => bidons(c, x, y, k, 2)],
      ["Dr", (c, x, y, k) => etal(c, x, y, k * 0.8, "#d96aa0", "#fbf6ee", "#f2ece0")],
    ] },
    poulailler: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => sacs(c, x, y, k * 0.8, 3, "#c8b07a")],
      ["G", (c, x, y, k) => auge(c, x, y, k * 0.8, "#c8a050")],
    ] },
    bergerie: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => balles(c, x, y, k, 6, "#f2ece0", "#a89878")],
      ["G", (c, x, y, k) => boite(c, x, y, 0.3 * k, 0.6 * k, 7 * k, "#8a5a32")],
      ["Dr", (c, x, y, k) => auge(c, x, y, k, "#6a9ac0")],
    ] },
    porcherie: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k) => { c.beginPath(); c.ellipse(x, y, 13 * k, 6 * k, 0, 0, TOUR); c.fillStyle = "#6a4a30"; c.fill(); c.beginPath(); c.ellipse(x - 2 * k, y - 0.5, 8 * k, 3.5 * k, 0, 0, TOUR); c.fillStyle = "rgba(140, 110, 80, .7)"; c.fill(); }],
      ["G", (c, x, y, k) => auge(c, x, y, k, "#a8884a")],
      ["Dr", (c, x, y, k) => balles(c, x, y, k, 3, "#d9b44a", "#8a6a2a")],
    ] },
    tisserand: { sol: "terre", cloture: "bois", objets: [
      ["D", (c, x, y, k, b, t) => sechoir(c, x, y, k, 1.1, "drap", ["#c8443a", "#3f6fc4", "#e8b830", "#3f8a4a"], t)],
      ["G", (c, x, y, k) => balles(c, x, y, k, 3, "#f2ece0", "#a89878")],
      ["Dr", (c, x, y, k, b, t) => sechoir(c, x, y, k, 0.8, "drap", ["#b06ab8", "#f2ece0", "#d9553b"], t + 1)],
    ] },
    tailleur: { sol: "paves", cloture: "aucune", objets: [
      ["D", (c, x, y, k) => portant(c, x, y, k, ["#3f6fc4", "#c8443a", "#3f8a4a", "#e8b830", "#5a4a6a"])],
      ["G", (c, x, y, k) => mannequin(c, x, y, k, "#3f5a8a")],
      ["Dr", (c, x, y, k) => mannequin(c, x, y, k, "#a8432e")],
    ] },
    charcuterie: { sol: "paves", cloture: "pierre", objets: [
      ["D", (c, x, y, k, b, t) => fumoir(c, x, y, k, t)],
      ["G", (c, x, y, k, b, t) => sechoir(c, x, y, k, 0.7, "jambon", null, t)],
      ["Dr", (c, x, y, k) => O().tasDeBuches(c, x, y, 5)],
    ] },
    centrale: { sol: "charbon", cloture: "fer", objets: [
      ["G", (c, x, y, k) => tas(c, x, y, 14 * k, 12 * k, "#2a2a2e", "#5a5f6e")],
      ["D", (c, x, y, k, b, t) => tapis(c, x, y, k, t, b && b.travail)],
      ["Dr", (c, x, y, k, b, t) => postElectrique(c, x, y, k, t, b && b.travail)],
    ] },
    acierie: { sol: "charbon", cloture: "fer", objets: [
      ["D", (c, x, y, k) => poutrelles(c, x, y, k)],
      ["G", (c, x, y, k) => tas(c, x, y, 11 * k, 7 * k, "#6a5a50", "#8a7a6a")],
      ["Dr", (c, x, y, k) => wagonnet(c, x, y, k, "#ff8a3a")],
    ] },
    filature: { sol: "paves", cloture: "fer", objets: [
      ["D", (c, x, y, k) => balles(c, x, y, k, 6, "#f2ece0", "#a89878")],
      ["G", (c, x, y, k) => { for (let i = 0; i < 4; i++) { const [bx, by] = iso(x, y, (i % 2) * 0.25, Math.floor(i / 2) * 0.3 - 0.15); tonneau(c, bx, by, k * 0.75, ["#c8443a", "#3f6fc4", "#e8b830", "#3f8a4a"][i]); } }],
      ["Dr", (c, x, y, k) => charrette(c, x, y, k, "sacs", "#f2ece0")],
    ] },
    pompage: { sol: "gravier", cloture: "fer", objets: [
      ["D", (c, x, y, k) => tuyaux(c, x, y, k, "#4f7fa8")],
      ["G", (c, x, y, k) => { boite(c, x, y, 0.2 * k, 0.2 * k, 8 * k, "#5a6068"); O().roue(c, x, y - 12 * k, 4.5 * k, 0, "#b8443a", 4, false); }],
    ] },
    epuration: { sol: "gravier", cloture: "fer", objets: [
      ["G", (c, x, y, k) => tuyaux(c, x, y, k * 0.8, "#6a6e74")],
    ] },
    manoir: { sol: "pelouse", cloture: "haie", objets: [
      ["D", (c, x, y, k, b, t) => fontaine(c, x, y, k * 0.8, t)],
      ["G", (c, x, y, k) => massif(c, x, y, k)],
      ["Dr", (c, x, y, k) => arbreBoule(c, x, y, k)],
    ] },
    immeuble: { sol: "paves", cloture: "fer", objets: [
      ["D", (c, x, y, k, b) => { banc(c, x, y, k); lampadaire(c, ...iso(x, y, 0.3, -0.3), k); }],
      ["G", (c, x, y, k) => poubelles(c, x, y, k)],
      ["Dr", (c, x, y, k) => arbreBoule(c, x, y, k)],
    ] },
    // Étape 48 : 🌆 les services publics
    ecole: { sol: "pelouse", cloture: "fer", objets: [
      ["D", (c, x, y, k) => { marelle(c, ...iso(x, y, 0.15, 0.2), k); banc(c, ...iso(x, y, -0.25, -0.3), k); }],
      ["G", (c, x, y, k, b, t) => balancoire(c, x, y, k, t)],
      ["Dr", (c, x, y, k) => arbreBoule(c, x, y, k)],
    ] },
    hopital: { sol: "paves", cloture: "haie", objets: [
      ["D", (c, x, y, k) => vehicule(c, x, y, k, "#f2f2ee", { long: 0.75, haut: 10, signe: "croix", bande: "#d0302a" })],
      ["G", (c, x, y, k) => heliport(c, x, y, k)],
      ["Dr", (c, x, y, k) => { arbreBoule(c, x, y, k); banc(c, ...iso(x, y, 0.3, 0), k); }],
    ] },
    pompiers: { sol: "paves", cloture: "aucune", objets: [
      ["D", (c, x, y, k) => vehicule(c, x, y, k, "#c8302a", { long: 1.0, haut: 10, signe: "echelle", bande: "#e8d040" })],
      ["G", (c, x, y, k) => tuyauxEnroules(c, x, y, k)],
      ["Dr", (c, x, y, k) => boucheIncendie(c, x, y, k)],
    ] },
    police: { sol: "paves", cloture: "fer", objets: [
      ["D", (c, x, y, k, b, t) => vehicule(c, x, y, k, "#f2f2ee", { long: 0.65, haut: 7, bande: "#2f5aa8", gyro: "#3a8aff" }, t)],
      ["G", (c, x, y, k) => barrieres(c, x, y, k)],
      ["Dr", (c, x, y, k) => lampadaire(c, x, y, k)],
    ] },
    // Étape 52 : 🛍️ le parking du centre commercial ; ✈️ la piste et les avions de l'aéroport
    commerce: { sol: "asphalte", cloture: "aucune", objets: [
      ["D", (c, x, y, k) => parking(c, x, y, k, 6)],
      ["G", (c, x, y, k) => caddie(c, x, y, k)],
      ["Dr", (c, x, y, k) => lampadaire(c, x, y, k)],
    ] },
    aeroport: { sol: "asphalte", cloture: "fer", objets: [
      ["D", (c, x, y, k, b, t) => { piste(c, x, y, k); const ph = ((t || 0) / 22 + ((b && b.numero) || 0) * 0.37) % 1, vol = b && b.ouvert && ph > 0.55; if (!vol) avion(c, ...iso(x, y, 0, -0.6 * k), k * 0.9, "#3f6fc4"); else { const u = (ph - 0.55) / 0.45; avion(c, ...iso(x, y, 0, (-0.6 + u * 3.5) * k), k * 0.9, "#3f6fc4", u * u * 140 * k); } }],
      ["G", (c, x, y, k) => avion(c, x, y, k * 0.7, "#c8443a")],
      ["Dr", (c, x, y, k, b, t) => mancheAir(c, x, y, k, t || 0)],
    ] },
  };
  const aUneCour = (type, n) => n >= 2 && !!DECORS[type];

  // ---------------------------------------------------------------- la mise en place
  // Où poser le bâtiment dans sa place, et les coins libres (en cases)
  function plan(type, n, s, m) {
    const a = m.a * s / 32, a2 = (m.a2 || m.a) * s / 32, marge = 0.12;
    // l'empreinte du bâtiment, autour de son point d'ancrage : p dans [−a/2, a/2], q dans [−a/2, a2 − a/2]
    const pA = -n / 2 + a / 2 + marge, qA = n / 2 - (a2 - a / 2) - marge;
    const libreP = n / 2 - (pA + a / 2), libreQ = (qA - a / 2) + n / 2; // la largeur libre devant, et à gauche
    const w = Math.max(0.4, Math.min(libreP, libreQ));
    return {
      pA, qA, w,
      coins: {
        G: [-n / 2 + libreQ / 2, -n / 2 + libreQ / 2],
        D: [n / 2 - libreP / 2, -n / 2 + libreQ / 2],
        Dr: [n / 2 - libreP / 2, n / 2 - Math.min(libreP, 1.4) / 2],
        DDr: [n / 2 - libreP / 2, (qA + n / 2) / 2 - 0.2],
        GD: [(pA - n / 2) / 2 + n / 4, -n / 2 + libreQ / 2],
      },
    };
  }
  // La taille des objets : selon la place libre (une place de 1 case de large : taille 1)
  const echelleObjets = (w) => Math.max(0.8, Math.min(1.8, w * 1.3));

  // Dessiner la cour. couche : "sol", "arriere" ou "avant". (x, y) : le milieu de la place ; ancre : le point du bâtiment.
  // Étape 46 : ✍️ « le jeu est beaucoup moins fluide ». Une cour, c'est 30 à 60 formes : les redessiner 60 fois par seconde,
  // pour chaque bâtiment, coûtait presque la moitié du temps de dessin ! Maintenant, les objets qui ne bougent pas sont
  // dessinés UNE fois dans une image à part (un « autocollant », on dit un sprite), qu'on recolle ensuite à chaque image.
  // Les objets qui bougent ou qui changent (la fumée, la fontaine, le linge, le stock de l'entrepôt, les lampadaires la
  // nuit) restent dessinés en direct : on les reconnaît à leur dessin qui reçoit le bâtiment (b) ou l'heure (t).
  const anime = (f) => f.length >= 5;
  function objets(ctx, d, x, y, n, pl, couche, b, t, quels) {
    const k = echelleObjets(pl.w), ancre = iso(x, y, pl.pA, pl.qA);
    for (const [ou, f] of d.objets) {
      // (de loin, quand les détails sont cachés, même les objets qui bougent vont dans l'autocollant : on ne voit pas qu'ils bougent)
      const c = pl.coins[ou]; if (!c || (anime(f) && vue().fin) !== (quels === "animes")) continue;
      const [ox, oy] = iso(x, y, c[0], c[1]), derriere = oy < ancre[1] - 4;
      if ((couche === "arriere") === derriere) f(ctx, ox, oy, k, b, t);
    }
  }
  const sprites = new Map(), stats = { crees: 0, colles: 0 };
  // Coller (ou fabriquer puis coller) l'autocollant d'une couche. dessin(c, X, Y) dessine la couche autour de (X, Y).
  function autocollant(ctx, cle, x, y, n, dessin) {
    const T = ctx.getTransform(), echelle = Math.hypot(T.a, T.b);
    const q = Math.pow(1.15, Math.round(Math.log(Math.max(0.05, echelle)) / Math.log(1.15))); // par paliers (pas une image à chaque cran de zoom)
    const mx = n * 32 + 30, my = n * 16 + 100, l = 2 * mx, h = my + n * 16 + 16; // la boîte autour de la place (en px du monde)
    if (l * q * h * q > 2.5e6) return dessin(ctx, x, y); // trop gros (très près) : on dessine en direct
    const k = cle + "|" + q.toFixed(3) + "|" + (Village.Batisses.vue.hiver ? 1 : 0) + (Village.Batisses.vue.fin ? 1 : 0);
    let s = sprites.get(k);
    if (!s) {
      if (sprites.size > 160) sprites.clear();
      const toile = document.createElement("canvas"); toile.width = Math.ceil(l * q); toile.height = Math.ceil(h * q);
      const c = toile.getContext("2d"); c.setTransform(q, 0, 0, q, 0, 0);
      dessin(c, mx, my);
      // On découpe l'autocollant au plus près du dessin : coller du vide coûte aussi du temps
      const W = toile.width, H = toile.height, px = c.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (px[(j * W + i) * 4 + 3] > 4) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; }
      if (x1 < 0) s = { vide: true };
      else {
        const t = document.createElement("canvas"); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1;
        t.getContext("2d").drawImage(toile, -x0, -y0);
        s = { image: t, dx: x0 / q - mx, dy: y0 / q - my, l: t.width / q, h: t.height / q };
      }
      sprites.set(k, s); stats.crees++;
    }
    if (!s.vide) { ctx.drawImage(s.image, x + s.dx, y + s.dy, s.l, s.h); stats.colles++; }
  }
  function dessiner(ctx, b, couche, x, y, n, pl, t) {
    const d = DECORS[b.type];
    if (!d) return;
    const pret = b.etat === "pret", cle = b.type + "|" + n + "|" + (pret ? "p" : "c");
    if (couche === "sol") return autocollant(ctx, cle + "|sol", x, y, n, (c, X, Y) => { sol(c, d, X, Y, n, b, false); if (pret) objets(c, d, X, Y, n, pl, "arriere", b, t, "fixes"); });
    if (couche === "arriere") { if (pret) objets(ctx, d, x, y, n, pl, "arriere", b, t, "animes"); return; }
    autocollant(ctx, cle + "|avant", x, y, n, (c, X, Y) => { if (pret) objets(c, d, X, Y, n, pl, "avant", b, t, "fixes"); sol(c, d, X, Y, n, b, true); });
    if (pret) objets(ctx, d, x, y, n, pl, "avant", b, t, "animes");
  }
  // Le sol de la cour (et la clôture : le fond d'abord, le devant à la fin)
  function sol(ctx, d, x, y, n, b, devant) {
    const r = n / 2 - 0.06, G = iso(x, y, -r, -r), Bd = iso(x, y, r, -r), D = iso(x, y, r, r), H = iso(x, y, -r, r);
    if (!devant) {
      const [c1, c2] = SOLS[d.sol] || SOLS.terre;
      ctx.beginPath(); ctx.moveTo(G[0], G[1]); ctx.lineTo(Bd[0], Bd[1]); ctx.lineTo(D[0], D[1]); ctx.lineTo(H[0], H[1]); ctx.closePath();
      ctx.fillStyle = Village.Batisses.vue.hiver ? "rgba(236, 240, 246, .8)" : c1; ctx.globalAlpha = 0.82; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = c2; ctx.lineWidth = 1.2; ctx.stroke();
      if (d.sol === "paves" && vue().fin) { ctx.strokeStyle = "rgba(80, 70, 60, .18)"; ctx.lineWidth = 0.7; ctx.beginPath(); for (let i = 1; i < n * 2; i++) { const u = -r + (i / (n * 2)) * 2 * r; const A = iso(x, y, u, -r), B = iso(x, y, u, r), C = iso(x, y, -r, u), E = iso(x, y, r, u); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.moveTo(C[0], C[1]); ctx.lineTo(E[0], E[1]); } ctx.stroke(); }
      cloture(ctx, d.cloture, [G, H, D]); // les 2 côtés du fond
    } else {
      // devant : de G vers Bd (avec une ouverture pour la route, au début), puis de Bd vers D
      cloture(ctx, d.cloture, [entre(G, Bd, Math.min(0.75, 1.15 / n)), Bd, D]);
    }
  }
  function cloture(ctx, sorte, pts) {
    const c = CLOTURES[sorte];
    if (!c) return;
    for (let i = 0; i + 1 < pts.length; i++) {
      const P = pts[i], Q = pts[i + 1], long = Math.hypot(Q[0] - P[0], Q[1] - P[1]), nb = Math.max(1, Math.round(long / 14));
      if (sorte === "haie") { for (let j = 0; j <= nb * 2; j++) O().rond(ctx, P[0] + (Q[0] - P[0]) * (j / (nb * 2)), P[1] + (Q[1] - P[1]) * (j / (nb * 2)) - 2.5, 3, Village.Batisses.vue.hiver ? "#e8eef5" : j % 2 ? "#3f7a3a" : "#4a8a42"); continue; }
      if (sorte === "pierre") { ctx.strokeStyle = TRAIT; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(P[0], P[1] - 1.5); ctx.lineTo(Q[0], Q[1] - 1.5); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 3.2; ctx.stroke(); continue; }
      const h = sorte === "fer" ? 7 : 5.5;
      ctx.strokeStyle = c; ctx.lineWidth = sorte === "fer" ? 0.9 : 1.3;
      ctx.beginPath();
      for (let j = 0; j <= nb * (sorte === "fer" ? 3 : 1); j++) { const u = j / (nb * (sorte === "fer" ? 3 : 1)), X = P[0] + (Q[0] - P[0]) * u, Y = P[1] + (Q[1] - P[1]) * u; ctx.moveTo(X, Y); ctx.lineTo(X, Y - h); }
      ctx.moveTo(P[0], P[1] - h * 0.8); ctx.lineTo(Q[0], Q[1] - h * 0.8);
      if (sorte !== "fer") { ctx.moveTo(P[0], P[1] - h * 0.35); ctx.lineTo(Q[0], Q[1] - h * 0.35); }
      ctx.stroke();
    }
  }

  // L'enseigne : un panneau de bois suspendu à une potence, devant la porte, avec le dessin du métier
  function enseigne(ctx, b, x, y) {
    if (!vue().fin) return;
    // Étape 46 : l'enseigne (un emoji, lent à écrire) est dessinée une fois par sorte de bâtiment, puis recollée
    const T = ctx.getTransform(), q = Math.pow(1.15, Math.round(Math.log(Math.max(0.05, Math.hypot(T.a, T.b))) / Math.log(1.15)));
    const k = "enseigne|" + b.type + "|" + q.toFixed(3);
    let s = sprites.get(k);
    if (!s) {
      const t = document.createElement("canvas"); t.width = Math.ceil(20 * q); t.height = Math.ceil(30 * q);
      const c = t.getContext("2d"); c.setTransform(q, 0, 0, q, 0, 0); dessinEnseigne(c, b.type, 2, 28); s = { image: t }; sprites.set(k, s);
    }
    ctx.drawImage(s.image, x - 2, y - 28, 20, 30);
  }
  // L'enseigne : un panneau de bois suspendu à une potence, devant la porte, avec le dessin du métier
  function dessinEnseigne(ctx, type, x, y) {
    const T = Village.Batiments.TYPES[type];
    ctx.strokeStyle = TRAIT; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26); ctx.lineTo(x + 11, y - 26); ctx.stroke();
    ctx.strokeStyle = "#5a3a1e"; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.strokeStyle = "#3a2a1a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + 4, y - 26); ctx.lineTo(x + 4, y - 23); ctx.moveTo(x + 11, y - 26); ctx.lineTo(x + 11, y - 23); ctx.stroke();
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x + 1, y - 23, 13, 11, 2); else ctx.rect(x + 1, y - 23, 13, 11);
    ctx.fillStyle = "#3a2a1e"; ctx.fill(); ctx.strokeStyle = "#c9a060"; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.font = "8px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(T.emoji, x + 7.5, y - 17.2); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  return { dessiner, enseigne, plan, aUneCour, DECORS, stats, sprites };
})();
