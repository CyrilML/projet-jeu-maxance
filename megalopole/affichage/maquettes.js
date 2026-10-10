// 🏗️ LES MAQUETTES : le dessinateur des bâtiments
//
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
  const vue = { nuit: 0, detail: true, t: 0 }; // réglé par le peintre à chaque image

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
  function boite(ctx, x, y, a, b, h, couleur, toit) {
    const G = [x - a, y], B = [x, y + a / 2], D = [x + b, y + a / 2 - b / 2], H = [x - a + b, y - b / 2];
    // (avec a = b, c'est un losange tout simple : G = (x − a, y), B = (x, y + a/2), D = (x + a, y), H = (x, y − a/2))
    const up = (P) => [P[0], P[1] - h];
    forme(ctx, [G, B, up(B), up(G)], nuance(couleur, 0.86));
    forme(ctx, [B, D, up(D), up(B)], nuance(couleur, 0.7));
    forme(ctx, [up(G), up(B), up(D), up(H)], toit || nuance(couleur, 1.08));
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
    }
  }
  // Un toit à 2 pentes au-dessus d'une boîte
  function toitPointu(ctx, c, haut, couleur) {
    const m1 = entre(c.hG, c.hH, 0.5), m2 = entre(c.hB, c.hD, 0.5), s1 = [m1[0], m1[1] - haut], s2 = [m2[0], m2[1] - haut];
    forme(ctx, [c.hG, c.hB, s2, s1], nuance(couleur, 0.95));
    forme(ctx, [c.hB, c.hD, c.hD, s2], nuance(couleur, 0.75));
    forme(ctx, [c.hD, c.hH, s1, s2], nuance(couleur, 0.85));
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
  function arbre(ctx, x, y, graine, taille) {
    const s = taille || 1, h = (10 + (graine % 5)) * s;
    ctx.fillStyle = "rgba(20, 40, 10, .22)"; ctx.beginPath(); ctx.ellipse(x + 3, y + 1, 8 * s, 3.5 * s, 0, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#6b4a2a"; ctx.fillRect(x - 1 * s, y - h * 0.4, 2 * s, h * 0.45);
    if (graine % 3) { rond(ctx, x, y - h * 0.75, 6.5 * s, graine % 2 ? "#3f8a42" : "#4f9a46"); rond(ctx, x - 2 * s, y - h * 0.85, 3.5 * s, "#62ad55"); }
    else forme(ctx, [[x - 6 * s, y - h * 0.3], [x + 6 * s, y - h * 0.3], [x, y - h * 1.3]], "#2f6e3a", false);
  }

  // ---------------------------------------------------------------- les bâtiments des zones (un par case)
  const BRIQUES = ["#c87a5a", "#d8b48a", "#e8dcc8", "#a8a4a0", "#c8a07a"], TOITS = ["#b8503a", "#8a4a3a", "#4a5a7a", "#6a5a4a"];
  const VERRES = ["#6f9ac0", "#5f86b0", "#7fa8c8", "#4f7898"];
  function lot(ctx, zone, niveau, x, y, g) {
    const v = g % 4, t = vue.t;
    if (zone === "R") {
      if (niveau === 1) { const c = boite(ctx, x, y + 2, 13, 13, 9, ["#efe4cc", "#f2ead8", "#e8d8b8", "#f4f0e4"][v]); toitPointu(ctx, c, 8, TOITS[v]); return c.hH; }
      if (niveau === 2) { const c1 = boite(ctx, x - 7, y - 1, 9, 9, 9, "#efe4cc"); toitPointu(ctx, c1, 7, TOITS[v]); const c2 = boite(ctx, x + 8, y + 4, 9, 9, 10, "#e8d8c0"); toitPointu(ctx, c2, 7, TOITS[(v + 1) % 4]); return [x, y - 18]; }
      const H = [0, 0, 0, 26, 46, 82, 132][niveau] + (g % 5) * (niveau >= 5 ? 6 : 2), f = niveau >= 6 ? 17 : niveau >= 5 ? 19 : 22;
      const col = niveau >= 6 ? VERRES[v] : BRIQUES[v], c = boite(ctx, x, y + 2, f, f, H, col, niveau >= 5 ? "#8a8e94" : null);
      fenetres(ctx, c, H, Math.round(H / 9), niveau >= 5 ? 4 : 3, g, niveau >= 6 ? "rgba(200, 225, 240, .7)" : null);
      if (niveau >= 6) { ctx.strokeStyle = "#3a3e44"; ctx.lineWidth = 1.2; ctx.beginPath(); const s = entre(c.hG, c.hD, 0.5); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0], s[1] - 16); ctx.stroke(); if (Math.floor(t * 1.5 + g) % 2) rond(ctx, s[0], s[1] - 17, 1.6, "#ff4a3a"); return [s[0], s[1] - 18]; }
      return c.hH;
    }
    if (zone === "C") {
      if (niveau <= 2) {
        const c = boite(ctx, x, y + 2, niveau === 1 ? 13 : 20, niveau === 1 ? 13 : 20, niveau === 1 ? 11 : 13, ["#e8e4dc", "#f0e8d0", "#dce4ec", "#ece0e0"][v]);
        // les auvents de couleur (sur la face de gauche)
        const couleurs = [["#d9553b", "#f2ece0"], ["#3f6fc4", "#f2ece0"], ["#3f8a4a", "#f2ece0"], ["#e8b830", "#f2ece0"]][v], nb = niveau === 1 ? 3 : 5;
        for (let k = 0; k < nb; k++) { const A = entre(c.G, c.B, k / nb), Bq = entre(c.G, c.B, (k + 1) / nb), hA = (niveau === 1 ? 11 : 13) * 0.7; forme(ctx, [[A[0], A[1] - hA], [Bq[0], Bq[1] - hA], [Bq[0] - 3, Bq[1] - hA + 5], [A[0] - 3, A[1] - hA + 5]], couleurs[k % 2], false); }
        return c.hH;
      }
      const H = [0, 0, 0, 16, 34, 92, 150][niveau] + (g % 5) * (niveau >= 5 ? 7 : 2), f = niveau === 3 ? 26 : niveau === 4 ? 25 : niveau === 5 ? 19 : 17;
      const c = boite(ctx, x, y + 2, f, f, H, niveau >= 4 ? VERRES[v] : "#e8e4dc", niveau >= 5 ? "#5a6068" : null);
      if (niveau === 3) { forme(ctx, [entre(c.hG, c.hB, 0.15), entre(c.hG, c.hB, 0.85), [entre(c.hG, c.hB, 0.85)[0], entre(c.hG, c.hB, 0.85)[1] - 6], [entre(c.hG, c.hB, 0.15)[0], entre(c.hG, c.hB, 0.15)[1] - 6]], ["#d9553b", "#3f6fc4", "#3f8a4a", "#e8b830"][v]); fenetres(ctx, c, H, 1, 4, g); }
      else fenetres(ctx, c, H, Math.round(H / 8), 4, g, "rgba(210, 230, 245, .75)");
      if (niveau >= 6) { const s = entre(c.hG, c.hD, 0.5); forme(ctx, [[s[0] - 8, s[1] + 4], [s[0] + 8, s[1] + 4], [s[0], s[1] - 18]], "#c8d0d8"); return [s[0], s[1] - 18]; }
      return c.hH;
    }
    if (zone === "I") {
      const H = [0, 12, 15, 20, 24, 26, 26][niveau], f = [0, 18, 22, 25, 26, 25, 25][niveau];
      const c = boite(ctx, x, y + 2, f, f, H, niveau >= 5 ? "#e8ecf0" : ["#9a9ea4", "#a8a29a", "#8a9098", "#b0a898"][v], niveau >= 5 ? "#c8d0d8" : "#6a7078");
      if (niveau <= 4 && vue.detail) { // le toit en dents de scie
        for (let k = 0; k < 3; k++) { const A = entre(c.hG, c.hH, k / 3 + 0.05), Bq = entre(c.hB, c.hD, k / 3 + 0.05), A2 = entre(c.hG, c.hH, k / 3 + 0.3), B2 = entre(c.hB, c.hD, k / 3 + 0.3); forme(ctx, [A, Bq, [B2[0], B2[1] - 6], [A2[0], A2[1] - 6]], "#7a8088"); }
      }
      if (niveau >= 2 && niveau <= 4) { for (let k = 0; k < niveau - 1; k++) { const s = cylindre(ctx, x - 6 + k * 9, y - H + 2 - k * 4, 2.6, 16 + k * 4, "#b8705a", "#7a4434", "#3a2a20"); if (vue.detail) fumee(ctx, s[0], s[1] - 2, t + g + k, true); } }
      if (niveau >= 4) cylindre(ctx, x + 14, y + 4, 5, 10, "#e8ecf0", "#a8b0b8"); // une cuve
      if (niveau >= 5) fenetres(ctx, c, H, 2, 4, g, "rgba(120, 200, 230, .8)");
      return [x, y - H - 20];
    }
    // 🌾 l'agriculture
    if (niveau <= 3) {
      // le champ : des sillons de couleur sur toute la case
      const couleurs = [["#d8b84a", "#c8a43a"], ["#6aa84a", "#5a9840"], ["#c8a060", "#a8844a"], ["#9ac84a", "#88b840"]][v];
      for (let k = 0; k < 6; k++) { const A = [x - 30 + k * 5, y - k * 2.5], Bq = [x + k * 5, y + 15 - k * 2.5]; ctx.strokeStyle = couleurs[k % 2]; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(A[0] + 2, A[1]); ctx.lineTo(Bq[0] - 2, Bq[1] - 1); ctx.stroke(); }
      if (niveau >= 2) { const c = boite(ctx, x + 12, y - 4, 8, 8, 9, "#b8443a"); toitPointu(ctx, c, 6, "#8a3a2e"); }
      if (niveau >= 3) cylindre(ctx, x - 12, y - 4, 4.5, 20, "#d8dce2", "#9aa0a8", "#c8443a");
      return [x, y - 24];
    }
    if (niveau === 4) { for (const [dx, dy] of [[-9, -3], [9, 3]]) { const c = boite(ctx, x + dx, y + dy, 9, 9, 8, "#cfe8e0", "#e8f6f2"); if (vue.detail) { ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(c.hG[0], c.hG[1]); ctx.lineTo(c.hD[0], c.hD[1]); ctx.stroke(); } } return [x, y - 14]; }
    const c = boite(ctx, x, y + 2, 18, 18, 72, "#5aa070", "#4a8a5a"); fenetres(ctx, c, 72, 9, 3, g, "rgba(140, 220, 140, .85)"); return c.hH;
  }

  // ---------------------------------------------------------------- les gros bâtiments
  // (x, y) : le milieu de leur emprise au sol ; a : leur demi-largeur en px (t cases × 32 × une marge)
  function gros(ctx, type, x, y, t, b, marche) {
    const a = t * 32 * 0.82, ti = vue.t, s = t * 0.5 + 0.5;
    switch (type) {
      case "centrale": { const c = boite(ctx, x + 6, y + 6, a * 0.7, a * 0.7, 22, "#9a5a44", "#4a4c50"); fenetres(ctx, c, 22, 2, 5, 3); for (const dx of [-24, -6]) { const p = cylindre(ctx, x + dx, y - 10, 6, 54, "#b8705a", "#7a4434", "#3a2a20"); if (marche) fumee(ctx, p[0], p[1] - 3, ti + dx, true); } return [x, y - 70]; }
      case "eolienne": { const p = cylindre(ctx, x, y + 4, 2, 58, "#f4f6f8", "#b8bec6"); const an = ti * (1 + 3 * Megalopole.Reseaux.vent(Megalopole.monde)); ctx.save(); ctx.translate(p[0], p[1]); for (let k = 0; k < 3; k++) { ctx.save(); ctx.rotate(an + (k * TOUR) / 3); forme(ctx, [[-1.3, 0], [1.3, 0], [0.6, -26], [-0.4, -27]], "#fbfcfd"); ctx.restore(); } ctx.restore(); rond(ctx, p[0], p[1], 2, "#c8ccd2"); return [p[0], p[1] - 30]; }
      case "solaire": { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const cx = x - 26 + k * 13 + r * 8, cy = y - 10 + r * 9 - k * 6.5; forme(ctx, [[cx - 7, cy + 3], [cx + 4, cy - 2], [cx + 8, cy - 8], [cx - 3, cy - 3]], "#2a4a7a"); } return [x, y - 26]; }
      case "nucleaire": { for (const [dx, dy] of [[-32, -10], [-6, -22]]) { const p = cylindre(ctx, x + dx, y + dy, 18, 60, "#e8e8e4", "#a8a8a2", "#8a8a84"); if (marche) fumee(ctx, p[0], p[1] - 2, ti + dx); } const c = boite(ctx, x + 22, y + 12, 22, 22, 18, "#e8e4dc"); cylindre(ctx, x + 26, y - 2, 13, 14, "#f0f0ec", "#b8b8b2", "#e8e8e4"); return [x - 6, y - 90]; }
      case "pompe": { const c = boite(ctx, x, y + 4, a * 0.6, a * 0.6, 16, "#a8604a", "#4a5058"); fenetres(ctx, c, 16, 1, 3, 5); cylindre(ctx, x + 18, y - 6, 9, 22, "#9ab4c4", "#5a7484", "#7a8e9a"); return [x, y - 40]; }
      case "chateauEau": { cylindre(ctx, x, y + 2, 2.5, 34, "#8a8e94", "#5c6066"); cylindre(ctx, x, y - 32, 11, 12, "#9ab4c4", "#5a7484", "#7a8e9a"); return [x, y - 52]; }
      case "usineEau": { for (const [dx, dy] of [[-22, -6], [16, 8]]) { ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 22, 11, 0, 0, TOUR); ctx.fillStyle = "#b8b2a4"; ctx.fill(); ctx.beginPath(); ctx.ellipse(x + dx, y + dy - 1, 19, 9.5, 0, 0, TOUR); ctx.fillStyle = "#4f8ab8"; ctx.fill(); } boite(ctx, x + 26, y - 20, 16, 16, 18, "#c8c2b4"); return [x, y - 40]; }
      case "ecole": case "lycee": { const c = boite(ctx, x, y + 4, a * 0.72, a * 0.72, type === "lycee" ? 26 : 18, "#c87a5a"); toitPointu(ctx, c, 8, "#8a3a2e"); fenetres(ctx, c, type === "lycee" ? 26 : 18, type === "lycee" ? 3 : 2, 4, 2); const p = entre(c.hG, c.hD, 0.5); forme(ctx, [[p[0] - 3, p[1] - 6], [p[0] + 3, p[1] - 6], [p[0] + 3, p[1] - 16], [p[0] - 3, p[1] - 16]], "#e8dcc8"); rond(ctx, p[0], p[1] - 12, 1.8, "#c9a040"); return [p[0], p[1] - 20]; }
      case "police": { const c = boite(ctx, x, y + 4, a * 0.7, a * 0.7, 18, "#c8ccd4", "#3a4a6a"); fenetres(ctx, c, 18, 2, 4, 4); forme(ctx, [entre(c.hB, c.hD, 0.05), entre(c.hB, c.hD, 0.95), [entre(c.hB, c.hD, 0.95)[0], entre(c.hB, c.hD, 0.95)[1] + 4], [entre(c.hB, c.hD, 0.05)[0], entre(c.hB, c.hD, 0.05)[1] + 4]], "#2f5aa8"); if (Math.floor(ti * 2) % 2) rond(ctx, c.hH[0], c.hH[1] + 4, 2.4, "#3a8aff"); return [x, y - 30]; }
      case "pompiers": { const c = boite(ctx, x, y + 4, a * 0.7, a * 0.7, 18, "#b8584a", "#4a4c50"); for (let k = 0; k < 2; k++) { const A = entre(c.G, c.B, 0.15 + k * 0.42), Bq = entre(c.G, c.B, 0.45 + k * 0.42); forme(ctx, [A, Bq, [Bq[0], Bq[1] - 12], [A[0], A[1] - 12]], "#e8e4dc"); } const T = boite(ctx, c.D[0] - 8, c.D[1] - 2, 5, 5, 36, "#b8584a"); return [x, y - 40]; }
      case "clinique": case "hopital": { const H = type === "hopital" ? 34 : 18, c = boite(ctx, x, y + 4, a * 0.72, a * 0.72, H, "#f4f2ec", "#c8ccd2"); fenetres(ctx, c, H, type === "hopital" ? 4 : 2, 5, 6); const m = entre(c.B, c.D, 0.5); ctx.fillStyle = "#d0302a"; ctx.fillRect(m[0] - 2, m[1] - H * 0.75, 4, 12); ctx.fillRect(m[0] - 6, m[1] - H * 0.75 + 4, 12, 4); if (type === "hopital") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(c.hH[0], c.hH[1] + H * 0 + 12, 9, 4.5, 0, 0, TOUR); ctx.stroke(); } return [x, y - H - 8]; }
      case "parc": { forme(ctx, losangeDe(x, y, 0.95), "#5aa84a", false); arbre(ctx, x - 8, y, 7); arbre(ctx, x + 9, y + 2, 4); rond(ctx, x, y + 4, 2, "#8a6a4a"); return [x, y - 20]; }
      case "grandParc": { forme(ctx, losangeDe(x, y, 0.95 * t), "#5aa84a", false); ctx.beginPath(); ctx.ellipse(x - 10, y + 6, 22, 11, 0, 0, TOUR); ctx.fillStyle = "#5a9ac8"; ctx.fill(); for (let k = 0; k < 7; k++) arbre(ctx, x - 40 + ((k * 23) % 80), y - 18 + ((k * 13) % 34), k + 2); cylindre(ctx, x + 22, y + 10, 6, 4, "#c9c4ba", "#a8a296", "#7aa8d0"); if (vue.detail) { ctx.strokeStyle = "rgba(220,240,255,.85)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 22, y + 6); ctx.quadraticCurveTo(x + 22, y - 6 - Math.sin(ti * 5) * 2, x + 28, y + 6); ctx.stroke(); } return [x, y - 30]; }
      case "stade": { const R = a * 0.85, r = R / 2, H = 22; ctx.beginPath(); ctx.moveTo(x - R, y); ctx.lineTo(x - R, y - H); ctx.ellipse(x, y - H, R, r, 0, Math.PI, 0, true); ctx.lineTo(x + R, y); ctx.ellipse(x, y, R, r, 0, 0, Math.PI); ctx.closePath(); ctx.fillStyle = "#d8dce2"; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.stroke(); for (const [f, c] of [[1, "#c8443a"], [0.85, "#3f6fc4"], [0.7, "#e8b830"]]) { ctx.beginPath(); ctx.ellipse(x, y - H, R * f, r * f, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); } ctx.beginPath(); ctx.ellipse(x, y - H + 1, R * 0.55, r * 0.55, 0, 0, TOUR); ctx.fillStyle = "#4a9a42"; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.moveTo(x, y - H + 1 - r * 0.5); ctx.lineTo(x, y - H + 1 + r * 0.5); ctx.stroke(); return [x, y - H - 20]; }
      case "attractions": { forme(ctx, losangeDe(x, y, 0.95 * t), "#a8c87a", false); // la grande roue, les montagnes russes et un manège
        const rx = x - 30, ry = y - 70, R = 46, an = ti * 0.3;
        ctx.strokeStyle = "#5a6068"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx - 20, y - 10); ctx.lineTo(rx, ry); ctx.lineTo(rx + 20, y - 10); ctx.stroke();
        ctx.strokeStyle = "#d8dce2"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(rx, ry, R, 0, TOUR); ctx.stroke();
        for (let k = 0; k < 10; k++) { const q = an + (k * TOUR) / 10, px = rx + Math.cos(q) * R, py = ry + Math.sin(q) * R; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(px, py); ctx.stroke(); rond(ctx, px, py + 3, 3.4, ["#c8443a", "#3f6fc4", "#e8b830", "#3f8a4a"][k % 4]); }
        ctx.strokeStyle = "#e8b830"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + 4, y + 20); for (let k = 0; k <= 20; k++) { const u = k / 20; ctx.lineTo(x + 4 + u * 70, y + 20 - u * 35 - Math.abs(Math.sin(u * 9)) * 40); } ctx.stroke();
        cylindre(ctx, x + 30, y + 26, 14, 8, "#c8443a", "#8a2a24", "#f2ece0"); return [rx, ry - R - 6]; }
      case "bus": { forme(ctx, [[x - 14, y + 2], [x + 6, y - 8], [x + 6, y - 18], [x - 14, y - 8]], "rgba(150, 200, 230, .6)"); ctx.strokeStyle = "#3a3e44"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.lineTo(x - 14, y - 10); ctx.moveTo(x + 6, y - 8); ctx.lineTo(x + 6, y - 20); ctx.stroke(); forme(ctx, [[x - 16, y - 9], [x + 8, y - 21], [x + 12, y - 19], [x - 12, y - 7]], "#e8b830"); return [x, y - 26]; }
      case "metro": { const c = boite(ctx, x, y + 6, a * 0.55, a * 0.55, 10, "#d8dce2", "#3f6fc4"); const p = c.hH; rond(ctx, p[0], p[1] - 10, 7, "#d0302a"); ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("M", p[0], p[1] - 7); ctx.textAlign = "left"; return [p[0], p[1] - 18]; }
      case "mairie": { const c = boite(ctx, x, y + 4, a * 0.72, a * 0.72, 20, "#f2ede2", "#d4ccbc"); fenetres(ctx, c, 20, 2, 4, 8); const p = cylindre(ctx, c.hH[0] + 4, c.hH[1] + 18, 10, 6, "#f2ede2", "#c4bcac"); ctx.beginPath(); ctx.arc(p[0], p[1], 10, Math.PI, 0); ctx.fillStyle = "#3f6fc4"; ctx.fill(); ctx.strokeStyle = CONTOUR; ctx.stroke(); ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 10); ctx.lineTo(p[0], p[1] - 24); ctx.stroke(); forme(ctx, [[p[0], p[1] - 24], [p[0] + 9, p[1] - 21 + Math.sin(ti * 4)], [p[0], p[1] - 18]], "#d0302a", false); return [p[0], p[1] - 26]; }
    }
    const c = boite(ctx, x, y + 4, a * 0.7, a * 0.7, 20, "#c8c4bc"); return c.hH;
  }
  const losangeDe = (x, y, f) => [[x - 32 * f, y], [x, y - 16 * f], [x + 32 * f, y], [x, y + 16 * f]];

  return { vue, nuance, forme, boite, fenetres, rond, arbre, lot, gros, losangeDe, fumee };
})();
