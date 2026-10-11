// 🏗️ LES MAQUETTES : le dessinateur des bâtiments
//
// Étape 5 : bien plus de détails (« fais ça mieux »), avec des OMBRES, plusieurs modèles par niveau et des décors.
// Chaque bâtiment est fait de BOÎTES vues de biais (comme des briques de LEGO) : on peint la face de gauche (un peu
// sombre), la face de droite (plus sombre) et le dessus (clair). Puis on ajoute les détails : des fenêtres (qui
// s'allument la nuit), un toit pointu, une cheminée qui fume, une enseigne…
// Plus le niveau est haut, plus la boîte est haute : une maison fait 10 px, un gratte-ciel 150 !
// Pour que deux immeubles voisins ne soient pas identiques, un petit hasard (toujours le même pour une case) change la
// couleur et la hauteur.
// Ce fichier ne change jamais le monde : il le regarde et il dessine.

window.Megalopole = window.Megalopole || {};

Megalopole.Maquettes = (function () {
  const TOUR = Math.PI * 2, CONTOUR = "rgba(30, 28, 26, .55)";
  const vue = { nuit: 0, detail: true, fin: true, t: 0 }; // (detail : de près ; fin : de très près, avec les textures) // réglé par le peintre à chaque image

  // ---------------------------------------------------------------- les outils de dessin
  function nuance(hex, f) {
    const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
  }
  function forme(ctx, pts, couleur, trait) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath(); ctx.fillStyle = couleur; ctx.fill();
    if (trait !== false) { ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.8; ctx.stroke(); }
  }
  // Une boîte posée au sol, au milieu (x, y). a : demi-largeur vers la gauche, b : vers la droite (en px), h : hauteur.
  // Renvoie les coins utiles : G (gauche), B (bas), D (droite), H (haut), et le dessus (haut des murs).
  // Étape 6 (« plus de design et de réalité ») : de près, chaque face reçoit la LUMIÈRE en dégradé (plus claire en haut,
  // plus sombre au pied du mur), une arête éclairée, un trait d'ombre au sol, et la texture de sa MATIÈRE :
  //   « brique » (des joints), « beton » (les dalles de chaque étage), « verre » (un reflet), « bardage » (des côtes)
  function face(ctx, pts, couleur, f, h) {
    if (!vue.detail || h < 4) { forme(ctx, pts, nuance(couleur, f)); return; }
    const ys = pts.map((p) => p[1]), g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
    g.addColorStop(0, nuance(couleur, f * 1.08)); g.addColorStop(1, nuance(couleur, f * 0.84));
    forme(ctx, pts, g);
  }
  function texture(ctx, P, Q, h, matiere) {
    ctx.beginPath();
    if (matiere === "brique") { ctx.strokeStyle = "rgba(60, 30, 20, .16)"; ctx.lineWidth = 0.6; for (let v = 2.6; v < h - 1; v += 2.6) { ctx.moveTo(P[0], P[1] - v); ctx.lineTo(Q[0], Q[1] - v); } }
    else if (matiere === "beton") { ctx.strokeStyle = "rgba(40, 40, 40, .14)"; ctx.lineWidth = 0.7; for (let v = 9; v < h - 2; v += 9) { ctx.moveTo(P[0], P[1] - v); ctx.lineTo(Q[0], Q[1] - v); } }
    else if (matiere === "bardage") { ctx.strokeStyle = "rgba(30, 30, 30, .16)"; ctx.lineWidth = 0.6; const nb = Math.round(Math.hypot(Q[0] - P[0], Q[1] - P[1]) / 3); for (let k = 1; k < nb; k++) { const A = entre(P, Q, k / nb); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], A[1] - h); } }
    ctx.stroke();
    if (matiere === "verre") { // un reflet du ciel en biais
      const A = entre(P, Q, 0.15), Bq = entre(P, Q, 0.42), C2 = entre(P, Q, 0.62);
      forme(ctx, [[A[0], A[1] - h * 0.05], [Bq[0], Bq[1] - h * 0.05], [C2[0], C2[1] - h * 0.95], [entre(P, Q, 0.35)[0], entre(P, Q, 0.35)[1] - h * 0.95]], "rgba(255, 255, 255, " + (0.16 * (1 - vue.nuit)) + ")", false);
    }
  }
  // Une boîte posée au sol, au milieu (x, y). a : demi-largeur vers la gauche, b : vers la droite (en px), h : hauteur.
  // Renvoie les coins utiles : G (gauche), B (bas), D (droite), H (haut), et le dessus (haut des murs).
  function boite(ctx, x, y, a, b, h, couleur, toit, matiere) {
    const G = [x - a, y], B = [x, y + a / 2], D = [x + b, y + a / 2 - b / 2], H = [x - a + b, y - b / 2];
    // (avec a = b, c'est un losange tout simple : G = (x − a, y), B = (x, y + a/2), D = (x + a, y), H = (x, y − a/2))
    const up = (P) => [P[0], P[1] - h];
    face(ctx, [G, B, up(B), up(G)], couleur, 0.86, h);
    face(ctx, [B, D, up(D), up(B)], couleur, 0.7, h);
    forme(ctx, [up(G), up(B), up(D), up(H)], toit || nuance(couleur, 1.08));
    if (vue.detail && h >= 4) {
      if (matiere && vue.fin) { texture(ctx, G, B, h, matiere); texture(ctx, B, D, h, matiere); }
      ctx.strokeStyle = "rgba(255, 255, 255, .22)"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(B[0], B[1] - 0.5); ctx.lineTo(B[0], B[1] - h + 0.5); ctx.stroke(); // l'arête au soleil
      ctx.strokeStyle = "rgba(20, 20, 20, .3)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(G[0], G[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(D[0], D[1]); ctx.stroke(); // le pied du mur
      if (toit) { ctx.strokeStyle = "rgba(255, 255, 255, .3)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(up(G)[0], up(G)[1]); ctx.lineTo(up(B)[0], up(B)[1]); ctx.lineTo(up(D)[0], up(D)[1]); ctx.stroke(); } // le rebord du toit
    }
    return { G, B, D, H, hG: up(G), hB: up(B), hD: up(D), hH: up(H) };
  }
  const entre = (P, Q, u) => [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u];
  // Des rangées de fenêtres sur les 2 faces visibles. etages : combien de rangées ; parFace : fenêtres par rangée.
  function fenetres(ctx, c, h, etages, parFace, graine, couleur) {
    if (!vue.detail) return;
    const allume = vue.nuit > 0.35;
    for (const [P, Q, k0] of [[c.G, c.B, 0], [c.B, c.D, 7]]) for (let e = 0; e < etages; e++) for (let k = 0; k < parFace; k++) {
      const u0 = (k + 0.25) / parFace, u1 = (k + 0.75) / parFace, v0 = (e + 0.3) / etages, v1 = (e + 0.75) / etages;
      const A = entre(P, Q, u0), Bq = entre(P, Q, u1);
      const p = [[A[0], A[1] - h * v0], [Bq[0], Bq[1] - h * v0], [Bq[0], Bq[1] - h * v1], [A[0], A[1] - h * v1]];
      const lumiere = allume && ((graine * 31 + e * 7 + k * 3 + k0) % 5) < 3;
      ctx.fillStyle = lumiere ? "#ffd866" : couleur || "rgba(150, 190, 215, .85)";
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (let j = 1; j < 4; j++) ctx.lineTo(p[j][0], p[j][1]); ctx.closePath(); ctx.fill();
      if (vue.fin) { // de près : le cadre clair, et l'appui de fenêtre (un trait sombre dessous)
        ctx.strokeStyle = "rgba(250, 248, 240, .7)"; ctx.lineWidth = 0.5; ctx.stroke();
        ctx.strokeStyle = "rgba(30, 30, 30, .35)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1] + 0.6); ctx.lineTo(p[1][0], p[1][1] + 0.6); ctx.stroke();
        if (lumiere) { ctx.fillStyle = "rgba(255, 216, 102, .18)"; ctx.beginPath(); ctx.arc((p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2, 3, 0, TOUR); ctx.fill(); } // le halo de la lampe
      }
    }
  }
  // Un toit à 2 pentes au-dessus d'une boîte
  function toitPointu(ctx, c, haut, couleur) {
    const m1 = entre(c.hG, c.hH, 0.5), m2 = entre(c.hB, c.hD, 0.5), s1 = [m1[0], m1[1] - haut], s2 = [m2[0], m2[1] - haut];
    forme(ctx, [c.hG, c.hB, s2, s1], nuance(couleur, 0.95));
    forme(ctx, [c.hB, c.hD, c.hD, s2], nuance(couleur, 0.75));
    forme(ctx, [c.hD, c.hH, s1, s2], nuance(couleur, 0.85));
    if (vue.fin) { // les rangées de tuiles, parallèles au bord du toit
      ctx.strokeStyle = "rgba(40, 20, 15, .22)"; ctx.lineWidth = 0.6; ctx.beginPath();
      for (let u = 0.2; u < 1; u += 0.2) { const A = entre(c.hG, s1, u), Bq = entre(c.hB, s2, u); ctx.moveTo(A[0], A[1]); ctx.lineTo(Bq[0], Bq[1]); }
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 240, 220, .35)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(s1[0], s1[1]); ctx.lineTo(s2[0], s2[1]); ctx.stroke(); // le faîte
    }
  }
  function rond(ctx, x, y, r, couleur) { ctx.beginPath(); ctx.arc(x, y, r, 0, TOUR); ctx.fillStyle = couleur; ctx.fill(); }
  function fumee(ctx, x, y, t, sombre) {
    for (let k = 0; k < 4; k++) { const p = (((t * 0.45 + k / 4) % 1) + 1) % 1; ctx.fillStyle = (sombre ? "rgba(90, 90, 96," : "rgba(230, 230, 236,") + 0.55 * (1 - p) + ")"; ctx.beginPath(); ctx.arc(x + p * 10 + Math.sin(p * 5 + k) * 2, y - p * 26, 2.5 + p * 5, 0, TOUR); ctx.fill(); }
  }
  function cylindre(ctx, x, y, r, h, clair, fonce, dessus) {
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, clair); g.addColorStop(1, fonce);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r, y - h); ctx.ellipse(x, y - h, r, r / 2, 0, Math.PI, 0); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r, r / 2, 0, 0, Math.PI);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - h, r, r / 2, 0, 0, TOUR); ctx.fillStyle = dessus || fonce; ctx.fill(); ctx.stroke();
    return [x, y - h];
  }
  // 🌳 Un arbre (étape 5 : 3 sortes) : 0 chêne (une boule de feuilles), 1 sapin 🌲 (des étages pointus), 2 bouleau (tronc blanc)
  function arbre(ctx, x, y, graine, taille, espece) {
    const s = taille || 1, h = (10 + (graine % 5)) * s;
    ctx.fillStyle = "rgba(20, 40, 10, .22)"; ctx.beginPath(); ctx.ellipse(x + 3 * s, y + 1, 8 * s, 3.5 * s, 0, 0, TOUR); ctx.fill();
    if (espece === undefined) espece = graine % 3 ? 0 : 1;
    if (espece === 1) { // 🌲 le sapin
      ctx.fillStyle = "#5a3e22"; ctx.fillRect(x - 1 * s, y - 4 * s, 2 * s, 5 * s);
      const vert = ["#2f6e3a", "#2a6434", "#33763e"][graine % 3];
      for (let e = 0; e < 3; e++) { const b = y - 3 * s - e * 5.5 * s, l = (7.5 - e * 1.8) * s; forme(ctx, [[x - l, b], [x + l, b], [x, b - 9 * s]], e % 2 ? nuance(vert, 1.08) : vert, false); }
      return;
    }
    if (espece === 2) { // le bouleau : tronc blanc, feuillage clair et léger
      ctx.fillStyle = "#eeeae0"; ctx.fillRect(x - 1 * s, y - h * 0.55, 2 * s, h * 0.6);
      if (vue.detail) { ctx.fillStyle = "#3a3630"; ctx.fillRect(x - 1 * s, y - h * 0.3, 2 * s, 0.8 * s); ctx.fillRect(x - 1 * s, y - h * 0.45, 1.2 * s, 0.8 * s); }
      rond(ctx, x, y - h * 0.8, 5.2 * s, ["#8ab84a", "#9ac452", "#7aae44"][graine % 3]); rond(ctx, x + 2.5 * s, y - h * 0.95, 3.4 * s, "#a8d060"); rond(ctx, x - 2.5 * s, y - h * 0.7, 3 * s, "#86b048");
      return;
    }
    // 🌳 le chêne
    ctx.fillStyle = "#6b4a2a"; ctx.fillRect(x - 1.2 * s, y - h * 0.45, 2.4 * s, h * 0.5);
    const v = ["#3f8a42", "#4f9a46", "#468f40"][graine % 3];
    rond(ctx, x - 2.5 * s, y - h * 0.68, 5 * s, nuance(v, 0.9)); rond(ctx, x + 3 * s, y - h * 0.7, 5 * s, nuance(v, 0.85)); rond(ctx, x, y - h * 0.88, 6 * s, v); rond(ctx, x - 1.5 * s, y - h * 1, 3.2 * s, "#62ad55");
  }
  // 🌼 Une décoration dans l'herbe : un buisson, des fleurs ou un rocher (h : le hasard de la case, de 0 à 0,09)
  function deco(ctx, x, y, h) {
    if (h < 0.035) { rond(ctx, x, y - 2, 3.4, "#4f8f40"); rond(ctx, x + 2.6, y - 1.4, 2.6, "#5a9c48"); rond(ctx, x - 1, y - 3.6, 1.8, "#6aad55"); return; }
    if (h < 0.075) { const coul = ["#f2e14a", "#f2f2f2", "#e86a8a", "#a87ae0"][Math.floor(h * 1000) % 4]; for (let k = 0; k < 5; k++) rond(ctx, x + Math.cos(k * 1.3 + h * 50) * 4, y + Math.sin(k * 1.9) * 1.8, 1.1, coul); return; }
    forme(ctx, [[x - 4, y], [x - 2.5, y - 3.5], [x + 2, y - 4], [x + 4.5, y - 0.5], [x + 1, y + 1.4]], "#a8a49c"); // un rocher
  }

  // ---------------------------------------------------------------- les petits outils de l'architecte (étape 5)
  // L'ombre d'une boîte : la base, poussée vers la droite et le bas (le soleil est en haut à gauche)
  function enveloppe(pts) { // (la plus petite forme qui entoure tous les points : l'« enveloppe convexe »)
    pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), bas = [], haut = [];
    for (const p of pts) { while (bas.length >= 2 && cr(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop(); bas.push(p); }
    for (let k = pts.length - 1; k >= 0; k--) { const p = pts[k]; while (haut.length >= 2 && cr(haut[haut.length - 2], haut[haut.length - 1], p) <= 0) haut.pop(); haut.push(p); }
    return bas.slice(0, -1).concat(haut.slice(0, -1));
  }
  function ombre(ctx, x, y, a, b, h) {
    if (!vue.detail) return;
    const base = [[x - a, y], [x, y + a / 2], [x + b, y + a / 2 - b / 2], [x - a + b, y - b / 2]], o = [Math.min(30, h * 0.5), Math.min(15, h * 0.25)];
    forme(ctx, enveloppe(base.concat(base.map((p) => [p[0] + o[0], p[1] + o[1]]))), "rgba(20, 30, 20, " + (0.2 * (1 - vue.nuit * 0.6)) + ")", false);
  }
  // Un morceau de sol sur la case (un jardin, un parking…) : un losange plus petit que la case
  const sol = (ctx, x, y, f, couleur) => forme(ctx, [[x - 30 * f, y], [x, y - 15 * f], [x + 30 * f, y], [x, y + 15 * f]], couleur, false);
  // Une porte sur la face de gauche (u : où, de 0 à 1)
  function porte(ctx, c, u, haut, couleur) {
    if (!vue.detail) return;
    const A = entre(c.G, c.B, u - 0.07), Bq = entre(c.G, c.B, u + 0.07);
    forme(ctx, [A, Bq, [Bq[0], Bq[1] - haut], [A[0], A[1] - haut]], couleur || "#6a4a32", false);
  }
  // Des balcons : une petite corniche claire à chaque étage, sur les 2 faces
  function balcons(ctx, c, h, etages, couleur) {
    if (!vue.detail) return;
    ctx.strokeStyle = couleur || "rgba(255, 255, 255, .55)"; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let e = 1; e < etages; e++) { const v = h * e / etages; for (const [P, Q] of [[c.G, c.B], [c.B, c.D]]) { ctx.moveTo(P[0] + (Q[0] - P[0]) * 0.08, P[1] + (Q[1] - P[1]) * 0.08 - v); ctx.lineTo(P[0] + (Q[0] - P[0]) * 0.92, P[1] + (Q[1] - P[1]) * 0.92 - v); } }
    ctx.stroke();
  }
  // Des bandes verticales (les poutres d'une tour de verre)
  function poutres(ctx, c, h, nb, couleur) {
    if (!vue.detail) return;
    ctx.strokeStyle = couleur || "rgba(40, 50, 60, .35)"; ctx.lineWidth = 1; ctx.beginPath();
    for (const [P, Q] of [[c.G, c.B], [c.B, c.D]]) for (let k = 1; k < nb; k++) { const A = entre(P, Q, k / nb); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], A[1] - h); }
    ctx.stroke();
  }
  // Une enseigne posée sur le toit (ou au-dessus de la porte)
  function enseigne(ctx, P, Q, haut, couleur) { forme(ctx, [P, Q, [Q[0], Q[1] - haut], [P[0], P[1] - haut]], couleur); if (vue.detail) { ctx.fillStyle = "rgba(255,255,255,.85)"; const m = entre(P, Q, 0.5); ctx.fillRect(m[0] - 3, m[1] - haut * 0.62, 6, 1.5); } }
  // Des petites boîtes sur un toit plat : la climatisation, une cage d'escalier
  function toitPlat(ctx, c, g) {
    if (!vue.detail) return;
    const m = entre(c.hG, c.hD, 0.5);
    boite(ctx, m[0] - 3 + (g % 3) * 2, m[1] + 1, 3.5, 3.5, 4, "#b8bcc2");
    if (g % 2) boite(ctx, m[0] + 6, m[1] - 2, 2.5, 2.5, 3, "#c8ccd2");
  }
  // Une antenne, avec sa lumière rouge qui clignote (pour les avions)
  function antenne(ctx, P, haut, g) { ctx.strokeStyle = "#3a3e44"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0], P[1] - haut); ctx.stroke(); if (Math.floor(vue.t * 1.5 + g) % 2) rond(ctx, P[0], P[1] - haut - 1, 1.6, "#ff4a3a"); return [P[0], P[1] - haut - 2]; }
  // Une piscine, une voiture garée, une haie, un arbre de jardin
  function piscine(ctx, x, y) { forme(ctx, [[x - 8, y], [x, y - 4], [x + 8, y], [x, y + 4]], "#e8e4dc", false); forme(ctx, [[x - 6.5, y], [x, y - 3.2], [x + 6.5, y], [x, y + 3.2]], "#4fb0e0", false); }
  function voiture(ctx, x, y, couleur) { if (!vue.detail) return; forme(ctx, [[x - 4, y], [x, y - 2], [x + 4, y], [x, y + 2]], couleur, false); forme(ctx, [[x - 2, y - 1], [x, y - 2.2], [x + 2, y - 1], [x, y]], "rgba(200,225,240,.9)", false); }
  function haie(ctx, P, Q) { if (!vue.detail) return; ctx.strokeStyle = "#4a8a3e"; ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke(); ctx.lineCap = "butt"; }
  // Une tour en gradins : plusieurs boîtes de plus en plus étroites (renvoie le sommet)
  function gradins(ctx, x, y, f, H, etapes, couleur, toit, fen, g, verre) {
    let base = y + 2, haut = null;
    for (let e = 0; e < etapes; e++) {
      const fe = f * (1 - e * 0.22), he = H * (e === 0 ? 0.62 : 0.38 / (etapes - 1));
      const c = boite(ctx, x, base, fe, fe, he, couleur, toit, verre ? "verre" : "beton");
      if (verre) poutres(ctx, c, he, 4);
      fenetres(ctx, c, he, Math.max(1, Math.round(he / 8)), 4, g + e, fen);
      base = c.hH[1] + fe / 2; haut = c;
    }
    return haut;
  }
  const COULEURS_AUTO = ["#c8443a", "#3f6fc4", "#e8b830", "#f2f2ee", "#3f8a4a", "#2a2c30"];

  // ---------------------------------------------------------------- les bâtiments des zones (un par case)
  // Étape 5 (« fais ça mieux », demande de Maxance) : PLUSIEURS MODÈLES par niveau (le hasard de la case choisit), des
  // ombres, des jardins, des piscines, des balcons, des enseignes, des parkings, des silos… Rien n'est inventé au hasard
  // à chaque image : le même terrain garde toujours le même modèle (sa « graine » g).
  const BRIQUES = ["#c87a5a", "#d8b48a", "#e8dcc8", "#a8a4a0", "#c8a07a", "#b86a50"], TOITS = ["#b8503a", "#8a4a3a", "#4a5a7a", "#6a5a4a", "#3a6a5a"];
  const VERRES = ["#6f9ac0", "#5f86b0", "#7fa8c8", "#4f7898", "#6a8aa8"], ENDUITS = ["#efe4cc", "#f2ead8", "#e8d8b8", "#f4f0e4", "#e8e0f0", "#e0ecdc"];
  const ENSEIGNES = ["#d9553b", "#3f6fc4", "#3f8a4a", "#e8b830", "#a84ab0"];
  function lot(ctx, zone, niveau, x, y, g) {
    const v = g % 4, w = (g >> 2) % 5, t = vue.t;
    if (zone === "R") return habitation(ctx, niveau, x, y, g, v, w, t);
    if (zone === "C") return commerce(ctx, niveau, x, y, g, v, w, t);
    if (zone === "I") return industrie(ctx, niveau, x, y, g, v, w, t);
    return agriculture(ctx, niveau, x, y, g, v, w, t);
  }

  // 🏠 Les habitations
  function maison(ctx, x, y, a, h, enduit, toit, g, cheminee) {
    ombre(ctx, x, y, a, a, h + 8);
    const c = boite(ctx, x, y, a, a, h, enduit, null, "enduit");
    fenetres(ctx, c, h, 1, 2, g, "rgba(120, 160, 190, .9)"); porte(ctx, c, 0.62, h * 0.6);
    toitPointu(ctx, c, a * 0.6, toit);
    if (cheminee && vue.detail) { const p = entre(c.hH, c.hD, 0.35); boite(ctx, p[0], p[1] - 2, 1.6, 1.6, 6, "#8a5a44"); }
    return c;
  }
  function habitation(ctx, niveau, x, y, g, v, w, t) {
    if (niveau === 1) {
      sol(ctx, x, y, 0.9, "#8cc46a");
      if (w === 0) { piscine(ctx, x + 12, y + 5); maison(ctx, x - 5, y - 2, 11, 9, ENDUITS[v], TOITS[v], g, true); return [x, y - 22]; }
      if (w === 1) { maison(ctx, x - 6, y - 1, 10, 8, ENDUITS[v], TOITS[v], g, false); ombre(ctx, x + 10, y + 5, 6, 6, 6); boite(ctx, x + 10, y + 5, 6, 6, 6, "#d8d2c4", "#8a8a84"); voiture(ctx, x + 16, y + 10, COULEURS_AUTO[g % 6]); return [x, y - 20]; }
      if (w === 2) { const c1 = maison(ctx, x - 4, y - 3, 10, 9, ENDUITS[(v + 2) % 6], TOITS[(v + 1) % 5], g, true); boite(ctx, x + 7, y + 3, 7, 7, 7, ENDUITS[(v + 2) % 6], TOITS[(v + 1) % 5]); return [x, y - 22]; }
      maison(ctx, x, y + 1, 12, 9, ENDUITS[v], TOITS[w % 5], g, w > 2); if (vue.detail) { arbre(ctx, x + 18, y + 2, g, 0.6, 0); haie(ctx, [x - 24, y + 2], [x - 6, y + 11]); } return [x, y - 22];
    }
    if (niveau === 2) {
      sol(ctx, x, y, 0.92, "#86be64");
      if (w % 2) { maison(ctx, x - 8, y - 2, 9, 9, ENDUITS[v], TOITS[v], g, true); maison(ctx, x + 9, y + 5, 9, 10, ENDUITS[(v + 1) % 6], TOITS[(v + 2) % 5], g + 1, false); if (vue.detail) piscine(ctx, x + 10, y - 7); }
      else { ombre(ctx, x, y, 17, 10, 14); const c = boite(ctx, x, y + 2, 17, 10, 12, ENDUITS[(v + 3) % 6]); fenetres(ctx, c, 12, 2, 3, g, "rgba(120, 160, 190, .9)"); porte(ctx, c, 0.3, 6); porte(ctx, c, 0.75, 6); toitPointu(ctx, c, 7, TOITS[v]); if (vue.detail) arbre(ctx, x + 18, y - 4, g, 0.55, 2); }
      return [x, y - 24];
    }
    if (niveau <= 4) { // 🏢 petit immeuble (3) et immeuble (4)
      const H = (niveau === 3 ? 26 : 46) + (g % 5) * 2, f = niveau === 3 ? 20 : 21, col = BRIQUES[(v + w) % 6];
      sol(ctx, x, y, 0.95, "#a8b0a0");
      if (vue.detail && niveau === 4) { voiture(ctx, x + 18, y + 6, COULEURS_AUTO[g % 6]); voiture(ctx, x + 24, y + 3, COULEURS_AUTO[(g + 2) % 6]); }
      if (niveau === 4 && w >= 3) { // en L : deux ailes
        ombre(ctx, x - 6, y - 3, 13, 13, H); const c1 = boite(ctx, x - 6, y - 3, 13, 13, H, col, "#8a8e94", "brique"); fenetres(ctx, c1, H, Math.round(H / 9), 2, g); balcons(ctx, c1, H, Math.round(H / 9));
        ombre(ctx, x + 8, y + 6, 11, 11, H * 0.7); const c2 = boite(ctx, x + 8, y + 6, 11, 11, H * 0.7, col, "#8a8e94", "brique"); fenetres(ctx, c2, H * 0.7, Math.round(H * 0.7 / 9), 2, g + 3); toitPlat(ctx, c2, g);
        return c1.hH;
      }
      ombre(ctx, x, y + 2, f, f, H);
      const c = boite(ctx, x, y + 2, f, f, H, col, niveau === 4 ? "#8a8e94" : null, "brique");
      fenetres(ctx, c, H, Math.round(H / 9), 3, g); balcons(ctx, c, H, Math.round(H / 9)); porte(ctx, c, 0.5, 7, "#4a3a2a");
      if (niveau === 3 && w % 2 === 0) toitPointu(ctx, c, 7, TOITS[v]); else toitPlat(ctx, c, g);
      if (vue.detail && niveau === 4 && w === 1) { const p = entre(c.hG, c.hD, 0.5); cylindre(ctx, p[0] + 4, p[1] + 1, 3.5, 6, "#a8743a", "#7a5428", "#6a4a24"); } // un réservoir d'eau sur le toit
      return c.hH;
    }
    if (niveau === 5) { // 🏬 tour d'habitation
      const H = 82 + (g % 5) * 6, col = [BRIQUES[v], "#e8e4dc", "#c8c0b4", VERRES[v], "#d8c8b0"][w];
      sol(ctx, x, y, 0.95, "#9aa898");
      ombre(ctx, x, y + 2, 19, 19, H);
      if (w === 3) { const c = gradins(ctx, x, y, 19, H, 2, col, "#7a8088", "rgba(200, 225, 240, .7)", g, true); return c.hH; }
      const c = boite(ctx, x, y + 2, 19, 19, H, col, "#8a8e94", w === 0 ? "brique" : "beton");
      fenetres(ctx, c, H, Math.round(H / 9), 4, g); balcons(ctx, c, H, Math.round(H / 9), "rgba(255,255,255,.4)");
      if (vue.detail && w === 4) { const p = entre(c.hG, c.hD, 0.5); rond(ctx, p[0] - 4, p[1], 3, "#4f9a46"); rond(ctx, p[0] + 4, p[1] + 1, 2.6, "#5aa84a"); } // un jardin sur le toit
      else toitPlat(ctx, c, g);
      return c.hH;
    }
    // 🌆 gratte-ciel
    const H = 132 + (g % 5) * 8, col = VERRES[(v + w) % 5];
    sol(ctx, x, y, 0.95, "#98a4a8");
    ombre(ctx, x, y + 2, 17, 17, H);
    const c = gradins(ctx, x, y, 17, H, 2 + (w % 2), col, "#5a6068", "rgba(200, 225, 240, .7)", g, true);
    const s = entre(c.hG, c.hD, 0.5);
    if (w === 2 && vue.detail) { forme(ctx, [[s[0] - 6, s[1]], [s[0], s[1] - 3], [s[0] + 6, s[1]], [s[0], s[1] + 3]], "#3a3e44", false); ctx.fillStyle = "#fff"; ctx.font = "bold 5px sans-serif"; ctx.textAlign = "center"; ctx.fillText("H", s[0], s[1] + 2); ctx.textAlign = "left"; return [s[0], s[1] - 6]; } // un héliport
    return antenne(ctx, s, 14 + (g % 3) * 4, g);
  }

  // 🛍️ Les commerces
  function boutique(ctx, x, y, a, b, h, couleur, auvent, g) {
    ombre(ctx, x, y, a, b, h);
    const c = boite(ctx, x, y, a, b, h, couleur);
    if (vue.detail) { // la vitrine et l'auvent à rayures
      forme(ctx, [entre(c.G, c.B, 0.1), entre(c.G, c.B, 0.9), [entre(c.G, c.B, 0.9)[0], entre(c.G, c.B, 0.9)[1] - h * 0.45], [entre(c.G, c.B, 0.1)[0], entre(c.G, c.B, 0.1)[1] - h * 0.45]], "rgba(170, 210, 230, .9)", false);
      const nb = 4; for (let k = 0; k < nb; k++) { const A = entre(c.G, c.B, k / nb), Bq = entre(c.G, c.B, (k + 1) / nb), hA = h * 0.62; forme(ctx, [[A[0], A[1] - hA], [Bq[0], Bq[1] - hA], [Bq[0] - 3, Bq[1] - hA + 5], [A[0] - 3, A[1] - hA + 5]], k % 2 ? "#f2ece0" : auvent, false); }
    }
    enseigne(ctx, entre(c.hG, c.hB, 0.2), entre(c.hG, c.hB, 0.8), 5, auvent);
    return c;
  }
  function commerce(ctx, niveau, x, y, g, v, w, t) {
    if (niveau === 1) { sol(ctx, x, y, 0.9, "#c8c4b8"); boutique(ctx, x - 2, y, 13, 13, 11, ENDUITS[(v + 1) % 6], ENSEIGNES[(v + w) % 5], g); voiture(ctx, x + 17, y + 6, COULEURS_AUTO[g % 6]); return [x, y - 24]; }
    if (niveau === 2) {
      sol(ctx, x, y, 0.92, "#c4c0b4");
      boutique(ctx, x - 9, y - 4, 10, 10, 12 + (g % 3) * 2, ENDUITS[v], ENSEIGNES[v], g);
      boutique(ctx, x + 9, y + 5, 10, 10, 10 + (w % 3) * 3, ENDUITS[(v + 2) % 6], ENSEIGNES[(v + 2) % 5], g + 1);
      return [x, y - 26];
    }
    if (niveau === 3) { // 🛒 supermarché et son parking
      sol(ctx, x, y, 0.97, "#8a8e92");
      if (vue.detail) { ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x + 6 + k * 5, y + 10 - k * 2.5); ctx.lineTo(x + 12 + k * 5, y + 13 - k * 2.5); } ctx.stroke(); for (let k = 0; k < 3; k++) voiture(ctx, x + 9 + k * 6, y + 9 - k * 3, COULEURS_AUTO[(g + k) % 6]); }
      ombre(ctx, x - 6, y - 2, 20, 16, 15);
      const c = boite(ctx, x - 6, y - 2, 20, 16, 15, ["#e8e4dc", "#f0e8d0", "#dce4ec", "#ece0e0"][v], "#a8acb0", "beton");
      forme(ctx, [entre(c.G, c.B, 0.2), entre(c.G, c.B, 0.8), [entre(c.G, c.B, 0.8)[0], entre(c.G, c.B, 0.8)[1] - 7], [entre(c.G, c.B, 0.2)[0], entre(c.G, c.B, 0.2)[1] - 7]], "rgba(170, 210, 230, .9)", false);
      enseigne(ctx, entre(c.hG, c.hB, 0.15), entre(c.hG, c.hB, 0.85), 7, ENSEIGNES[(v + w) % 5]); toitPlat(ctx, c, g);
      return c.hH;
    }
    if (niveau === 4) { // 🏬 galerie marchande : du verre, des puits de lumière sur le toit, une entrée couverte
      sol(ctx, x, y, 0.97, "#a8a49c");
      ombre(ctx, x, y + 2, 25, 25, 34);
      const c = boite(ctx, x, y + 2, 25, 25, 30 + (g % 3) * 3, w % 2 ? VERRES[v] : "#e8e4dc", "#c8ccd2", w % 2 ? "verre" : "beton");
      fenetres(ctx, c, 30, 3, 5, g, "rgba(210, 230, 245, .8)");
      if (vue.detail) { for (let k = 0; k < 3; k++) { const p = entre(c.hG, c.hD, 0.3 + k * 0.2); forme(ctx, [[p[0] - 5, p[1]], [p[0], p[1] - 2.5], [p[0] + 5, p[1]], [p[0], p[1] + 2.5]], "rgba(150, 200, 230, .95)"); } enseigne(ctx, entre(c.G, c.B, 0.35), entre(c.G, c.B, 0.65), 10, ENSEIGNES[w % 5]); }
      return c.hH;
    }
    // 🏙️ tours de bureaux (5) et gratte-ciel de bureaux (6)
    const H = (niveau === 5 ? 92 : 150) + (g % 5) * 7, f = niveau === 5 ? 19 : 17, col = VERRES[(v + w) % 5];
    sol(ctx, x, y, 0.95, "#9aa0a6");
    ombre(ctx, x, y + 2, f, f, H);
    if (niveau === 6 || w >= 3) {
      const c = gradins(ctx, x, y, f, H, niveau === 6 ? 3 : 2, col, "#5a6068", "rgba(210, 230, 245, .75)", g, true);
      const s = entre(c.hG, c.hD, 0.5);
      if (niveau === 6 && w % 2) { forme(ctx, [[s[0] - 7, s[1] + 3], [s[0] + 7, s[1] + 3], [s[0], s[1] - 22]], "#c8d0d8"); return [s[0], s[1] - 22]; } // une flèche
      return antenne(ctx, s, 16, g);
    }
    const c = boite(ctx, x, y + 2, f, f, H, col, "#5a6068", "verre");
    poutres(ctx, c, H, 5); fenetres(ctx, c, H, Math.round(H / 8), 4, g, "rgba(210, 230, 245, .75)");
    if (vue.detail) { const P = entre(c.hG, c.hB, 0.25), Q = entre(c.hG, c.hB, 0.75); enseigne(ctx, [P[0], P[1] + 8], [Q[0], Q[1] + 8], 6, ENSEIGNES[(g >> 3) % 5]); } // le logo de l'entreprise
    toitPlat(ctx, c, g);
    return c.hH;
  }

  // 🏭 Les industries
  function industrie(ctx, niveau, x, y, g, v, w, t) {
    sol(ctx, x, y, 0.97, niveau >= 5 ? "#b8c0b8" : "#9a948a");
    if (niveau >= 5) { // 🤖 usine robotisée : propre, des panneaux solaires sur le toit, pas de fumée
      ombre(ctx, x, y + 2, 25, 25, 26);
      const c = boite(ctx, x, y + 2, 25, 25, 24, "#eef0f2", "#c8d0d8", "bardage");
      if (vue.detail) { forme(ctx, [[c.G[0], c.G[1] - 12], [c.B[0], c.B[1] - 12], [c.B[0], c.B[1] - 17], [c.G[0], c.G[1] - 17]], "rgba(80, 170, 220, .85)", false); forme(ctx, [[c.B[0], c.B[1] - 12], [c.D[0], c.D[1] - 12], [c.D[0], c.D[1] - 17], [c.B[0], c.B[1] - 17]], "rgba(60, 140, 190, .85)", false); for (let k = 0; k < 4; k++) { const p = entre(c.hG, c.hD, 0.2 + k * 0.2); forme(ctx, [[p[0] - 5, p[1] + 1], [p[0] + 1, p[1] - 2], [p[0] + 5, p[1] - 1], [p[0] - 1, p[1] + 2]], "#2a4a7a", false); } }
      return [x, y - 40];
    }
    const H = [0, 12, 15, 18, 22][niveau], f = [0, 17, 21, 20, 18][niveau], col = ["#9a9ea4", "#a8a29a", "#8a9098", "#b0a898", "#a89488"][(v + w) % 5];
    if (niveau >= 3 && vue.detail) { for (let k = 0; k < (niveau === 4 ? 3 : 2); k++) cylindre(ctx, x + 14 + k * 4, y + 6 - k * 7, 5, 12 + k * 2, "#e8ecf0", "#a8b0b8", "#c8ccd2"); } // les cuves
    if (niveau === 4 && vue.detail) { ctx.strokeStyle = "#e8b830"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 22, y + 4); ctx.lineTo(x - 22, y - 30); ctx.lineTo(x - 4, y - 38); ctx.stroke(); } // une grue
    ombre(ctx, x - 3, y, f, f, H);
    const c = boite(ctx, x - 3, y, f, f, H, col, "#6a7078", "bardage");
    if (vue.detail) { // le toit en dents de scie, et la grande porte de chargement
      for (let k = 0; k < 3; k++) { const A = entre(c.hG, c.hH, k / 3 + 0.05), Bq = entre(c.hB, c.hD, k / 3 + 0.05), A2 = entre(c.hG, c.hH, k / 3 + 0.3), B2 = entre(c.hB, c.hD, k / 3 + 0.3); forme(ctx, [A, Bq, [B2[0], B2[1] - 6], [A2[0], A2[1] - 6]], "#7a8088"); forme(ctx, [Bq, [Bq[0], Bq[1] - 0.1], [B2[0], B2[1] - 6], [B2[0], B2[1] - 6]], "rgba(160, 200, 220, .8)", false); }
      porte(ctx, c, 0.5, H * 0.65, "#5a5e64");
      if (niveau === 1) { boite(ctx, x + 16, y + 8, 3, 3, 3, "#a8844a"); boite(ctx, x + 20, y + 6, 3, 3, 3, "#b8945a"); } // des caisses
    }
    if (niveau >= 2) { for (let k = 0; k < niveau - 1; k++) { const s = cylindre(ctx, x - 9 + k * 9, y - H + 2 - k * 4, 2.6, 16 + k * 4, "#b8705a", "#7a4434", "#3a2a20"); if (vue.detail) fumee(ctx, s[0], s[1] - 2, t + g + k, true); } }
    return [x, y - H - 20];
  }

  // 🌾 L'agriculture
  function champ(ctx, x, y, couleurs, motif) {
    for (let k = 0; k < 7; k++) { const A = [x - 30 + k * 4.4, y - k * 2.2], Bq = [x + k * 4.4, y + 15 - k * 2.2]; ctx.strokeStyle = couleurs[k % 2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0] + 2, A[1]); ctx.lineTo(Bq[0] - 2, Bq[1] - 1); ctx.stroke(); }
    if (motif && vue.detail) for (let k = 0; k < 4; k++) rond(ctx, x - 14 + k * 8, y + (k % 2) * 4, 2, "#e8d070"); // des bottes de foin
  }
  function agriculture(ctx, niveau, x, y, g, v, w, t) {
    const COUL = [["#d8b84a", "#c8a43a"], ["#6aa84a", "#5a9840"], ["#c8a060", "#a8844a"], ["#9ac84a", "#88b840"], ["#e8d040", "#d8c030"]];
    if (niveau <= 3) {
      champ(ctx, x, y, COUL[(v + w) % 5], niveau >= 2 && w % 2 === 0);
      if (niveau >= 2) { ombre(ctx, x + 12, y - 4, 8, 8, 12); const c = boite(ctx, x + 12, y - 4, 8, 8, 9, w % 2 ? "#b8443a" : "#c8a070"); toitPointu(ctx, c, 6, w % 2 ? "#8a3a2e" : "#6a5a4a"); porte(ctx, c, 0.5, 6, "#f2ece0"); }
      if (niveau >= 3) { cylindre(ctx, x - 12, y - 4, 4.5, 20, "#d8dce2", "#9aa0a8", "#c8443a"); if (vue.detail) { cylindre(ctx, x - 4, y - 8, 3.5, 15, "#d8dce2", "#9aa0a8", "#3f6fc4"); forme(ctx, [[x + 2, y + 8], [x + 7, y + 5.5], [x + 9, y + 7], [x + 4, y + 9.5]], "#c8443a"); rond(ctx, x + 3, y + 9, 1.5, "#2a2c30"); } } // les silos et le tracteur
      return [x, y - 26];
    }
    if (niveau === 4) { // 🏡 les serres : des rangées de verre
      sol(ctx, x, y, 0.95, "#8a7a5a");
      for (const [dx, dy] of [[-11, -4], [0, 2], [11, 8]]) { ombre(ctx, x + dx, y + dy, 7, 12, 8); const c = boite(ctx, x + dx, y + dy, 7, 12, 7, "#cfe8e0", "rgba(225, 245, 240, .95)"); if (vue.detail) { ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(c.hG[0], c.hG[1]); ctx.lineTo(c.hD[0], c.hD[1]); ctx.stroke(); rond(ctx, c.hB[0] - 2, c.hB[1] + 4, 1.4, "#5aa84a"); } }
      return [x, y - 14];
    }
    // 🌿 la ferme verticale : une tour de verre pleine de plantes
    sol(ctx, x, y, 0.95, "#7aa860");
    ombre(ctx, x, y + 2, 18, 18, 72);
    const c = boite(ctx, x, y + 2, 18, 18, 72, "#5aa070", "#4a8a5a", "verre"); fenetres(ctx, c, 72, 9, 3, g, "rgba(140, 220, 140, .85)"); balcons(ctx, c, 72, 9, "rgba(90, 170, 80, .9)");
    if (vue.detail) { const p = entre(c.hG, c.hD, 0.5); rond(ctx, p[0] - 4, p[1], 3.5, "#4f9a46"); rond(ctx, p[0] + 4, p[1] + 1, 3, "#62ad55"); }
    return c.hH;
  }

  // ---------------------------------------------------------------- les gros bâtiments
  // (x, y) : le milieu de leur emprise au sol ; a : leur demi-largeur en px (t cases × 32 × une marge)
  function gros(ctx, type, x, y, t, b, marche) {
    const a = t * 32 * 0.82, ti = vue.t, s = t * 0.5 + 0.5;
    switch (type) {
      case "centrale": { sol(ctx, x, y, 0.95 * t, "#8a8278"); if (vue.detail) { forme(ctx, [[x + 14, y + 22], [x + 30, y + 12], [x + 40, y + 18], [x + 26, y + 28]], "#2a2622"); forme(ctx, [[x + 18, y + 20], [x + 29, y + 14], [x + 32, y + 9], [x + 22, y + 15]], "#3a3530"); } // le tas de charbon
        ombre(ctx, x + 6, y + 6, a * 0.7, a * 0.7, 30); const c = boite(ctx, x + 6, y + 6, a * 0.7, a * 0.7, 22, "#9a5a44", "#4a4c50", "brique"); fenetres(ctx, c, 22, 2, 5, 3); porte(ctx, c, 0.5, 12, "#4a4c50");
        for (const dx of [-24, -6]) { const p = cylindre(ctx, x + dx, y - 10, 6, 54, "#b8705a", "#7a4434", "#3a2a20"); if (vue.detail) { ctx.fillStyle = "#e8e4dc"; ctx.fillRect(p[0] - 6, p[1] + 6, 12, 3); } if (marche) fumee(ctx, p[0], p[1] - 3, ti + dx, true); } return [x, y - 70]; }
      case "eolienne": { const p = cylindre(ctx, x, y + 4, 2, 58, "#f4f6f8", "#b8bec6"); const an = ti * (1 + 3 * Megalopole.Reseaux.vent(Megalopole.monde)); ctx.save(); ctx.translate(p[0], p[1]); for (let k = 0; k < 3; k++) { ctx.save(); ctx.rotate(an + (k * TOUR) / 3); forme(ctx, [[-1.3, 0], [1.3, 0], [0.6, -26], [-0.4, -27]], "#fbfcfd"); ctx.restore(); } ctx.restore(); rond(ctx, p[0], p[1], 2, "#c8ccd2"); return [p[0], p[1] - 30]; }
      case "solaire": { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const cx = x - 26 + k * 13 + r * 8, cy = y - 10 + r * 9 - k * 6.5; forme(ctx, [[cx - 7, cy + 3], [cx + 4, cy - 2], [cx + 8, cy - 8], [cx - 3, cy - 3]], "#2a4a7a"); } return [x, y - 26]; }
      case "nucleaire": { for (const [dx, dy] of [[-32, -10], [-6, -22]]) { const p = cylindre(ctx, x + dx, y + dy, 18, 60, "#e8e8e4", "#a8a8a2", "#8a8a84"); if (marche) fumee(ctx, p[0], p[1] - 2, ti + dx); } const c = boite(ctx, x + 22, y + 12, 22, 22, 18, "#e8e4dc"); cylindre(ctx, x + 26, y - 2, 13, 14, "#f0f0ec", "#b8b8b2", "#e8e8e4"); return [x - 6, y - 90]; }
      case "pompe": { sol(ctx, x, y, 0.95 * t, "#a8a49a"); ombre(ctx, x, y + 4, a * 0.6, a * 0.6, 20); const c = boite(ctx, x, y + 4, a * 0.6, a * 0.6, 16, "#a8604a", "#4a5058"); fenetres(ctx, c, 16, 1, 3, 5); porte(ctx, c, 0.5, 9); cylindre(ctx, x + 18, y - 6, 9, 22, "#9ab4c4", "#5a7484", "#7a8e9a"); if (vue.detail) { ctx.strokeStyle = "#5a7484"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 20, y + 10); ctx.lineTo(x - 30, y + 16); ctx.stroke(); } return [x, y - 40]; }
      case "chateauEau": { cylindre(ctx, x, y + 2, 2.5, 34, "#8a8e94", "#5c6066"); cylindre(ctx, x, y - 32, 11, 12, "#9ab4c4", "#5a7484", "#7a8e9a"); return [x, y - 52]; }
      case "usineEau": { sol(ctx, x, y, 0.95 * t, "#b8b4a8"); for (const [dx, dy] of [[-22, -6], [16, 8], [-2, 18]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 20, 10, 0, 0, TOUR); ctx.fillStyle = "#b8b2a4"; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.8; ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + dx, y + dy - 1, 17, 8.5, 0, 0, TOUR); ctx.fillStyle = "#4f8ab8"; ctx.fill(); if (vue.detail) { ctx.strokeStyle = "rgba(230,245,255,.9)"; ctx.lineWidth = 1; ctx.beginPath(); const an = ti * 0.8 + dx; ctx.moveTo(x + dx, y + dy - 1); ctx.lineTo(x + dx + Math.cos(an) * 16, y + dy - 1 + Math.sin(an) * 8); ctx.stroke(); } } ombre(ctx, x + 26, y - 20, 16, 16, 18); const c = boite(ctx, x + 26, y - 20, 16, 16, 18, "#c8c2b4", "#7a8088"); fenetres(ctx, c, 18, 2, 3, 9); return [x, y - 40]; }
      case "ecole": case "lycee": { const L2 = type === "lycee", H = L2 ? 26 : 18;
        sol(ctx, x, y, 0.95 * t, "#c8bca0"); // la cour
        if (vue.detail) { forme(ctx, [[x + 2, y + 12], [x + 18, y + 4], [x + 30, y + 10], [x + 14, y + 18]], "#d8743a", false); ctx.strokeStyle = "#fff"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 10, y + 8); ctx.lineTo(x + 22, y + 14); ctx.stroke(); cylindre(ctx, x + 27, y + 9, 0.6, 9, "#5a5e64", "#3a3e44"); forme(ctx, [[x + 25, y - 1], [x + 29, y - 1], [x + 29, y + 2], [x + 25, y + 2]], "#fff"); } // le terrain de sport et le panier
        ombre(ctx, x - 6, y - 2, a * 0.6, a * 0.6, H);
        const c = boite(ctx, x - 6, y - 2, a * 0.6, a * 0.6, H, L2 ? "#d8a07a" : "#c87a5a", null, "brique"); toitPointu(ctx, c, 8, L2 ? "#4a5a7a" : "#8a3a2e"); fenetres(ctx, c, H, L2 ? 3 : 2, 4, 2); porte(ctx, c, 0.5, 8, "#4a3a2a");
        const p = entre(c.hG, c.hD, 0.5); forme(ctx, [[p[0] - 3, p[1] - 6], [p[0] + 3, p[1] - 6], [p[0] + 3, p[1] - 16], [p[0] - 3, p[1] - 16]], "#e8dcc8"); rond(ctx, p[0], p[1] - 12, 1.8, "#c9a040"); // l'horloge
        if (vue.detail) { ctx.strokeStyle = "#3a3e44"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 30, y + 6); ctx.lineTo(x - 30, y - 22); ctx.stroke(); forme(ctx, [[x - 30, y - 22], [x - 21, y - 20 + Math.sin(ti * 4)], [x - 30, y - 17]], ["#3f6fc4", "#f2f2f2", "#d0302a"][Math.floor(ti) % 3], false); } // le drapeau
        return [p[0], p[1] - 20]; }
      case "police": { sol(ctx, x, y, 0.95 * t, "#9a9ea4"); ombre(ctx, x - 4, y, a * 0.62, a * 0.62, 22); const c = boite(ctx, x - 4, y, a * 0.62, a * 0.62, 18, "#c8ccd4", "#3a4a6a", "beton"); fenetres(ctx, c, 18, 2, 4, 4); porte(ctx, c, 0.5, 9, "#2f5aa8");
        forme(ctx, [entre(c.hB, c.hD, 0.05), entre(c.hB, c.hD, 0.95), [entre(c.hB, c.hD, 0.95)[0], entre(c.hB, c.hD, 0.95)[1] + 4], [entre(c.hB, c.hD, 0.05)[0], entre(c.hB, c.hD, 0.05)[1] + 4]], "#2f5aa8");
        for (let k = 0; k < 2; k++) { voiture(ctx, x + 18 + k * 7, y + 10 - k * 3.5, "#f2f2f2"); if (vue.detail && Math.floor(ti * 3 + k) % 2) rond(ctx, x + 18 + k * 7, y + 8 - k * 3.5, 1, "#3a8aff"); }
        if (Math.floor(ti * 2) % 2) rond(ctx, c.hH[0], c.hH[1] + 4, 2.4, "#3a8aff"); return [x, y - 30]; }
      case "pompiers": { sol(ctx, x, y, 0.95 * t, "#9a9ea4"); ombre(ctx, x, y + 4, a * 0.7, a * 0.7, 22); const c = boite(ctx, x, y + 4, a * 0.7, a * 0.7, 18, "#b8584a", "#4a4c50", "brique");
        for (let k = 0; k < 2; k++) { const A = entre(c.G, c.B, 0.15 + k * 0.42), Bq = entre(c.G, c.B, 0.45 + k * 0.42); forme(ctx, [A, Bq, [Bq[0], Bq[1] - 12], [A[0], A[1] - 12]], "#e8e4dc"); if (vue.detail) { ctx.strokeStyle = "rgba(120,110,100,.6)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let r = 1; r < 4; r++) { ctx.moveTo(A[0], A[1] - r * 3); ctx.lineTo(Bq[0], Bq[1] - r * 3); } ctx.stroke(); } }
        if (vue.detail) { const P = entre(c.G, c.B, 0.3); forme(ctx, [[P[0] - 14, P[1] + 6], [P[0] - 2, P[1] + 12], [P[0] - 2, P[1] + 7], [P[0] - 14, P[1] + 1]], "#d0302a"); forme(ctx, [[P[0] - 14, P[1] + 1], [P[0] - 2, P[1] + 7], [P[0] + 1, P[1] + 5.5], [P[0] - 11, P[1] - 0.5]], "#e84a3a"); } // le camion
        boite(ctx, c.D[0] - 8, c.D[1] - 2, 5, 5, 36, "#b8584a"); return [x, y - 40]; }
      case "clinique": case "hopital": { const HO = type === "hopital", H = HO ? 34 : 18;
        sol(ctx, x, y, 0.95 * t, "#c8ccd0");
        ombre(ctx, x, y + 4, a * 0.72, a * 0.72, H); const c = boite(ctx, x, y + 4, a * 0.72, a * 0.72, H, "#f4f2ec", "#c8ccd2", "beton"); fenetres(ctx, c, H, HO ? 4 : 2, 5, 6); porte(ctx, c, 0.5, 9, "rgba(150, 200, 230, .95)");
        const m = entre(c.B, c.D, 0.5); ctx.fillStyle = "#d0302a"; ctx.fillRect(m[0] - 2, m[1] - H * 0.75, 4, 12); ctx.fillRect(m[0] - 6, m[1] - H * 0.75 + 4, 12, 4);
        if (HO && vue.detail) { const s = entre(c.hG, c.hD, 0.5); forme(ctx, [[s[0] - 9, s[1]], [s[0], s[1] - 4.5], [s[0] + 9, s[1]], [s[0], s[1] + 4.5]], "#3a3e44", false); ctx.strokeStyle = "#f2d040"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(s[0], s[1], 7, 3.5, 0, 0, TOUR); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "bold 5px sans-serif"; ctx.textAlign = "center"; ctx.fillText("H", s[0], s[1] + 2); ctx.textAlign = "left"; } // l'héliport
        if (vue.detail) { voiture(ctx, x - 22, y + 12, "#f2f2f2"); if (Math.floor(ti * 3) % 2) rond(ctx, x - 22, y + 10, 1, "#d0302a"); } // l'ambulance
        return [x, y - H - 8]; }
      case "parc": { forme(ctx, losangeDe(x, y, 0.95), "#5aa84a", false); if (vue.detail) { ctx.strokeStyle = "#d8c8a0"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.quadraticCurveTo(x, y - 4, x + 24, y); ctx.stroke(); forme(ctx, [[x - 3, y + 6], [x + 3, y + 3], [x + 3, y + 1.5], [x - 3, y + 4.5]], "#8a5a3a"); for (let k = 0; k < 4; k++) rond(ctx, x - 18 + k * 11, y + 7 - (k % 2) * 12, 1, ["#f2e14a", "#e86a8a", "#f2f2f2", "#a87ae0"][k]); } arbre(ctx, x - 10, y - 2, 7, 1, 0); arbre(ctx, x + 11, y + 2, 4, 0.9, 2); return [x, y - 20]; }
      case "grandParc": { forme(ctx, losangeDe(x, y, 0.95 * t), "#5aa84a", false); if (vue.detail) { ctx.strokeStyle = "#d8c8a0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 80, y); ctx.bezierCurveTo(x - 30, y + 20, x + 20, y - 25, x + 80, y); ctx.stroke(); } ctx.beginPath(); ctx.ellipse(x - 14, y + 8, 24, 12, 0, 0, TOUR); ctx.fillStyle = "#5a9ac8"; ctx.fill(); if (vue.detail) { ctx.beginPath(); ctx.ellipse(x - 14, y + 8, 24, 12, 0, 0, TOUR); ctx.strokeStyle = "#d8c8a0"; ctx.lineWidth = 1.5; ctx.stroke(); forme(ctx, [[x - 20, y + 10], [x - 14, y + 7], [x - 10, y + 9], [x - 16, y + 12]], "#f2f2f2"); } for (let k = 0; k < 9; k++) arbre(ctx, x - 44 + ((k * 23) % 88), y - 20 + ((k * 13) % 38), k + 2, 0.9 + (k % 3) * 0.15, k % 3); cylindre(ctx, x + 24, y + 12, 6, 4, "#c9c4ba", "#a8a296", "#7aa8d0"); if (vue.detail) { ctx.strokeStyle = "rgba(220,240,255,.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 24, y + 8); ctx.quadraticCurveTo(x + 24, y - 4 - Math.sin(ti * 5) * 2, x + 30, y + 8); ctx.stroke(); } return [x, y - 30]; }
      case "stade": { const R = a * 0.85, r = R / 2, H = 22; // étape 6 : des gradins, un toit, la pelouse rayée et 4 projecteurs
        sol(ctx, x, y, 0.95 * t, "#a8a49a");
        ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x - R, y - H); ctx.ellipse(x, y - H, R, r, 0, Math.PI, 0, true); ctx.lineTo(x + R, y); ctx.ellipse(x, y, R, r, 0, 0, Math.PI); ctx.closePath();
        const gm = ctx.createLinearGradient(x - R, 0, x + R, 0); gm.addColorStop(0, "#e4e8ec"); gm.addColorStop(1, "#a8aeb6"); ctx.fillStyle = gm; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.stroke();
        if (vue.detail) { ctx.strokeStyle = "rgba(60, 70, 90, .35)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 5; k++) { ctx.moveTo(x - R, y - k * 4.4); ctx.ellipse(x, y - k * 4.4, R, r, 0, Math.PI, 0, true); } ctx.stroke(); } // les étages
        for (const [f, c] of [[1, "#c8443a"], [0.86, "#3f6fc4"], [0.72, "#c8443a"]]) { ctx.beginPath(); ctx.ellipse(x, y - H, R * f, r * f, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); }
        if (vue.detail) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (const f of [0.95, 0.9, 0.81, 0.77]) ctx.ellipse(x, y - H, R * f, r * f, 0, 0, TOUR); ctx.stroke(); } // les rangées de sièges
        ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - H + 1, R * 0.58, r * 0.58, 0, 0, TOUR); ctx.clip();
        for (let k = -6; k <= 6; k++) { ctx.fillStyle = k % 2 ? "#4a9a42" : "#56a84c"; ctx.fillRect(x + k * R * 0.1 - R * 0.05, y - H - r, R * 0.1, r * 2); } ctx.restore(); // la pelouse rayée
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - H + 1 - r * 0.55); ctx.lineTo(x, y - H + 1 + r * 0.55); ctx.ellipse(x, y - H + 1, R * 0.1, r * 0.1, 0, 0, TOUR); ctx.stroke();
        forme(ctx, [[x - R * 0.9, y - H - r * 0.25], [x - R * 0.5, y - H - r * 0.85], [x + R * 0.5, y - H - r * 0.85], [x + R * 0.9, y - H - r * 0.25], [x + R * 0.8, y - H - r * 0.05], [x - R * 0.8, y - H - r * 0.05]], "rgba(235, 238, 242, .75)"); // le toit de la tribune du fond
        for (const [px, py] of [[-1, -0.3], [1, -0.3], [-0.55, -0.95], [0.55, -0.95]]) { const X = x + px * R * 1.02, Y = y - H + py * r; ctx.strokeStyle = "#5a5e64"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(X, Y + H); ctx.lineTo(X, Y - 26); ctx.stroke(); forme(ctx, [[X - 4, Y - 26], [X + 4, Y - 26], [X + 4, Y - 31], [X - 4, Y - 31]], vue.nuit > 0.35 ? "#fff8d0" : "#d8dce2"); if (vue.nuit > 0.35) { ctx.fillStyle = "rgba(255, 245, 200, .18)"; ctx.beginPath(); ctx.moveTo(X - 4, Y - 28); ctx.lineTo(x - R * 0.3, y - H + r * 0.3); ctx.lineTo(x + R * 0.3, y - H + r * 0.3); ctx.lineTo(X + 4, Y - 28); ctx.fill(); } } // les projecteurs
        return [x, y - H - 34]; }
      case "attractions": { forme(ctx, losangeDe(x, y, 0.95 * t), "#a8c87a", false); // la grande roue, les montagnes russes et un manège
        const rx = x - 30, ry = y - 70, R = 46, an = ti * 0.3;
        ctx.strokeStyle = "#5a6068"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx - 20, y - 10); ctx.lineTo(rx, ry); ctx.lineTo(rx + 20, y - 10); ctx.stroke();
        ctx.strokeStyle = "#d8dce2"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(rx, ry, R, 0, TOUR); ctx.stroke();
        for (let k = 0; k < 10; k++) { const q = an + (k * TOUR) / 10, px = rx + Math.cos(q) * R, py = ry + Math.sin(q) * R; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(px, py); ctx.stroke(); rond(ctx, px, py + 3, 3.4, ["#c8443a", "#3f6fc4", "#e8b830", "#3f8a4a"][k % 4]); }
        ctx.strokeStyle = "#e8b830"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 4, y + 20); for (let k = 0; k <= 20; k++) { const u = k / 20; ctx.lineTo(x + 4 + u * 70, y + 20 - u * 35 - Math.abs(Math.sin(u * 9)) * 40); } ctx.stroke();
        cylindre(ctx, x + 30, y + 26, 14, 8, "#c8443a", "#8a2a24", "#f2ece0"); return [rx, ry - R - 6]; }
      case "bus": { sol(ctx, x, y, 0.9, "#b8b4ac"); if (vue.detail) { forme(ctx, [[x + 2, y + 10], [x + 20, y + 1], [x + 20, y - 5], [x + 2, y + 4]], "#e8b830"); forme(ctx, [[x + 4, y + 5], [x + 18, y - 2], [x + 18, y - 4], [x + 4, y + 3]], "rgba(170, 210, 230, .95)", false); } forme(ctx, [[x - 14, y + 2], [x + 6, y - 8], [x + 6, y - 18], [x - 14, y - 8]], "rgba(150, 200, 230, .6)"); ctx.strokeStyle = "#3a3e44"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x - 14, y - 10); ctx.moveTo(x + 6, y - 8); ctx.lineTo(x + 6, y - 20); ctx.stroke(); forme(ctx, [[x - 16, y - 9], [x + 8, y - 21], [x + 12, y - 19], [x - 12, y - 7]], "#3f6fc4"); return [x, y - 26]; }
      case "metro": { sol(ctx, x, y, 0.95 * t, "#b8b4ac"); ombre(ctx, x, y + 6, a * 0.55, a * 0.55, 12); const c = boite(ctx, x, y + 6, a * 0.55, a * 0.55, 10, "#d8dce2", "#3f6fc4"); if (vue.detail) { forme(ctx, [entre(c.G, c.B, 0.3), entre(c.G, c.B, 0.7), [entre(c.G, c.B, 0.7)[0], entre(c.G, c.B, 0.7)[1] - 7], [entre(c.G, c.B, 0.3)[0], entre(c.G, c.B, 0.3)[1] - 7]], "#2a2c30", false); } const p = c.hH; cylindre(ctx, p[0], p[1] + 4, 0.8, 10, "#5a5e64", "#3a3e44"); rond(ctx, p[0], p[1] - 10, 7, "#d0302a"); ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("M", p[0], p[1] - 7); ctx.textAlign = "left"; return [p[0], p[1] - 18]; }
      case "mairie": { sol(ctx, x, y, 0.95 * t, "#d8d0bc"); if (vue.detail) { forme(ctx, [[x - 30, y + 6], [x - 14, y + 14], [x - 8, y + 11], [x - 24, y + 3]], "#5aa84a", false); rond(ctx, x - 19, y + 8, 3, "#7aa8d0"); }
        ombre(ctx, x, y + 4, a * 0.72, a * 0.72, 24); const c = boite(ctx, x, y + 4, a * 0.72, a * 0.72, 20, "#f2ede2", "#d4ccbc"); fenetres(ctx, c, 20, 2, 4, 8);
        if (vue.detail) { for (let k = 0; k < 5; k++) { const A = entre(c.G, c.B, 0.2 + k * 0.15); ctx.fillStyle = "#fbf8f0"; ctx.fillRect(A[0] - 1.2, A[1] - 15, 2.4, 15); } forme(ctx, [[entre(c.G, c.B, 0.12)[0], entre(c.G, c.B, 0.12)[1] - 15], [entre(c.G, c.B, 0.88)[0], entre(c.G, c.B, 0.88)[1] - 15], [entre(c.G, c.B, 0.5)[0], entre(c.G, c.B, 0.5)[1] - 22]], "#e8e0cc"); } // les colonnes et le fronton
        const p = cylindre(ctx, c.hH[0] + 4, c.hH[1] + 18, 10, 6, "#f2ede2", "#c4bcac"); ctx.beginPath(); ctx.arc(p[0], p[1], 10, Math.PI, 0); ctx.fillStyle = "#3f6fc4"; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.stroke(); ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 10); ctx.lineTo(p[0], p[1] - 24); ctx.stroke(); forme(ctx, [[p[0], p[1] - 24], [p[0] + 9, p[1] - 21 + Math.sin(ti * 4)], [p[0], p[1] - 18]], "#d0302a", false); return [p[0], p[1] - 26]; }
    }
    const c = boite(ctx, x, y + 4, a * 0.7, a * 0.7, 20, "#c8c4bc"); return c.hH;
  }
  const losangeDe = (x, y, f) => [[x - 32 * f, y], [x, y - 16 * f], [x + 32 * f, y], [x, y + 16 * f]];

  return { vue, nuance, forme, boite, fenetres, rond, arbre, deco, lot, gros, losangeDe, fumee };
})();
