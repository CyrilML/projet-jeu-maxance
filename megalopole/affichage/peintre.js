// 🎨 LE PEINTRE : il dessine la ville à chaque image (60 fois par seconde)
//
// Comme un vrai peintre, il commence par le FOND et finit par le DEVANT :
//   1. le sol : l'herbe, l'eau, le sable, les zones peintes (en couleur claire), les routes ;
//      pour aller vite, il range les losanges par couleur et remplit chaque couleur d'un seul coup ;
//   2. les CALQUES (🗺️), s'il y en a un : chaque case prend la couleur de sa valeur (le courant, la pollution…) ;
//   3. les objets, diagonale par diagonale (de la plus loin à la plus proche) : les arbres, les bâtiments, les voitures ;
//   4. ce que le maire est en train de faire : le tracé d'une route, le rectangle d'une zone, le bâtiment à poser ;
//   5. la nuit : un voile bleu, et les fenêtres s'allument.
// Il ne dessine que ce qui est à l'écran : c'est ce qui permet d'avoir une grande carte.

window.Megalopole = window.Megalopole || {};

Megalopole.Peintre = (function () {
  const C = Megalopole.CONFIG, K = Megalopole.Carte, Mq = Megalopole.Maquettes, H = Megalopole.Hasard;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase, TOUR = Math.PI * 2;
  let ctx = null, toile = null;
  const stats = { cases: 0, objets: 0, voitures: 0, ms: 0 };

  const milieu = (c, l) => ({ x: (c - l) * (L / 2), y: (c + l + 1) * (Hc / 2) });
  function initialiser(t) { toile = t; ctx = t.getContext("2d"); }

  const COULEURS_ZONE = { 1: "#a8dc98", 2: "#a8c8f0", 3: "#ecd88a", 4: "#d8b880" };
  const SOL_BATI = { 1: "#c8c0b0", 2: "#b8b8b8", 3: "#a8a29a", 4: "#b89a60" };
  // Les couleurs des calques : de bleu (bas) à rouge (haut), ou vert → rouge
  const degrade = (v, a, b) => { v = Math.max(0, Math.min(1, v)); const ca = a.map((x, k) => Math.round(x + (b[k] - x) * v)); return "rgb(" + ca.join(",") + ")"; };
  const CALQUES = {
    courant: { nom: "⚡ Électricité", couleur: (m, i) => (m.zone[i] && m.niveau[i] ? (m.courant[i] ? "#f2d040" : "#d0302a") : m.route[i] && m.reseaux.courant.atteint && m.reseaux.courant.atteint[i] >= 0 ? "#e8b830" : null) },
    eau: { nom: "💧 Eau", couleur: (m, i) => (m.zone[i] && m.niveau[i] ? (m.eau[i] ? "#3f8ae0" : "#d0302a") : m.route[i] && m.reseaux.eau.atteint && m.reseaux.eau.atteint[i] >= 0 ? "#6aaaf0" : null) },
    valeur: { nom: "💎 Valeur du terrain", couleur: (m, i) => degrade(m.valeur[i], [200, 60, 50], [60, 200, 90]) },
    pollution: { nom: "🌫️ Pollution", couleur: (m, i) => (m.pollution[i] > 0.02 ? degrade(m.pollution[i], [220, 220, 160], [110, 70, 40]) : null) },
    trafic: { nom: "🚗 Trafic", couleur: (m, i) => (m.route[i] ? degrade(m.trafic[i] / 1.2, [60, 200, 90], [220, 40, 40]) : null) },
    education: { nom: "🎓 Éducation", couleur: (m, i) => (m.couverture.education[i] ? "#7a9ae0" : null) },
    sante: { nom: "🏥 Santé", couleur: (m, i) => (m.couverture.sante[i] ? "#e07a8a" : null) },
    securite: { nom: "🚓 Sécurité", couleur: (m, i) => (m.couverture.securite[i] ? "#5a7ac8" : null) },
    feu: { nom: "🚒 Pompiers", couleur: (m, i) => (m.couverture.feu[i] ? "#e0704a" : null) },
    loisirs: { nom: "🎡 Loisirs", couleur: (m, i) => (m.couverture.loisirs[i] ? "#7ac85a" : null) },
    transport: { nom: "🚌 Transports", couleur: (m, i) => (m.couverture.transport[i] ? "#c8a040" : null) },
  };

  function dessiner(monde, options) {
    const debut = performance.now();
    stats.voitures = 0;
    const E = Megalopole.Ecran, d = E.densite, cam = monde.camera, z = cam.zoom, k = monde.carte, n = k.colonnes, t = performance.now() / 1000;
    const nuit = 1 - Megalopole.Reseaux.soleil(monde);
    Mq.vue.nuit = nuit; Mq.vue.detail = z >= 0.55; Mq.vue.t = t;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = "#2a5a3a"; ctx.fillRect(0, 0, E.largeur, E.hauteur);
    ctx.setTransform(d * z, 0, 0, d * z, d * (E.largeur / 2 - cam.x * z), d * (E.hauteur / 2 - cam.y * z));
    // Ce qu'on voit (en px du monde), et les cases correspondantes (un peu plus bas : les grands immeubles dépassent)
    const x0 = cam.x - E.largeur / 2 / z - L, x1 = cam.x + E.largeur / 2 / z + L, y0 = cam.y - E.hauteur / 2 / z - Hc, y1 = cam.y + E.hauteur / 2 / z + 320;
    const coins = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => Megalopole.Iso.versGrille(x, y, L, Hc));
    const cMin = Math.max(0, Math.floor(Math.min(...coins.map((g) => g.colonne)))), cMax = Math.min(n - 1, Math.ceil(Math.max(...coins.map((g) => g.colonne))));
    const lMin = Math.max(0, Math.floor(Math.min(...coins.map((g) => g.ligne)))), lMax = Math.min(n - 1, Math.ceil(Math.max(...coins.map((g) => g.ligne))));
    const visible = (p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;

    // 1. Le sol, rangé par couleur
    const parCouleur = new Map();
    const ajouter = (couleur, x, y) => { let l = parCouleur.get(couleur); if (!l) parCouleur.set(couleur, (l = [])); l.push(x, y); };
    const calque = options.calque ? CALQUES[options.calque] : null;
    let nCases = 0;
    for (let l = lMin; l <= lMax; l++) for (let c = cMin; c <= cMax; c++) {
      const p = milieu(c, l);
      if (!visible(p)) continue;
      const i = l * n + c, ter = k.terrain[i];
      nCases++;
      let couleur;
      if (monde.route[i]) couleur = ter === K.TERRAIN.eau ? "#7a7068" : "#5a5d62"; // (sur l'eau : un pont)
      else if (ter === K.TERRAIN.eau) couleur = (c * 7 + l * 3) % 5 ? "#3f7fb8" : "#4a8ac0";
      else if (monde.zone[i]) couleur = monde.niveau[i] ? SOL_BATI[monde.zone[i]] : COULEURS_ZONE[monde.zone[i]];
      else if (ter === K.TERRAIN.sable) couleur = "#d8c690";
      else couleur = (c * 13 + l * 7) % 3 ? "#7cb35a" : "#76ab55";
      if (calque && ter !== K.TERRAIN.eau) { const cc = calque.couleur(monde, i); couleur = cc || "#5a6a5a"; }
      ajouter(couleur, p.x, p.y);
    }
    for (const [couleur, l] of parCouleur) {
      ctx.beginPath();
      for (let j = 0; j < l.length; j += 2) { const x = l[j], y = l[j + 1]; ctx.moveTo(x - L / 2 - 0.5, y); ctx.lineTo(x, y - Hc / 2 - 0.5); ctx.lineTo(x + L / 2 + 0.5, y); ctx.lineTo(x, y + Hc / 2 + 0.5); }
      ctx.fillStyle = couleur; ctx.fill();
    }
    // les bords des zones (un trait léger), et les marquages des routes
    if (z >= 0.45 && !calque) {
      ctx.strokeStyle = "rgba(255, 255, 255, .25)"; ctx.lineWidth = 0.8; ctx.beginPath();
      for (let l = lMin; l <= lMax; l++) for (let c = cMin; c <= cMax; c++) { const i = l * n + c; if (!monde.zone[i] || monde.niveau[i]) continue; const p = milieu(c, l); if (!visible(p)) continue; ctx.moveTo(p.x - L / 2 + 3, p.y); ctx.lineTo(p.x, p.y - Hc / 2 + 1.5); ctx.lineTo(p.x + L / 2 - 3, p.y); ctx.lineTo(p.x, p.y + Hc / 2 - 1.5); ctx.closePath(); }
      ctx.stroke();
      routes(monde, cMin, cMax, lMin, lMax, visible, z);
    }

    // 3. Les objets, diagonale par diagonale
    let nObjets = 0;
    const grosParDiag = new Map();
    for (const b of monde.batiments) { const dg = b.colonne + b.ligne + 2 * (b.taille - 1); (grosParDiag.get(dg) || grosParDiag.set(dg, []).get(dg)).push(b); }
    const montrerBatiments = !calque || options.calqueBatiments;
    ctx.globalAlpha = calque ? 0.35 : 1;
    for (let dg = cMin + lMin; dg <= cMax + lMax; dg++) {
      for (let c = Math.max(cMin, dg - lMax); c <= Math.min(cMax, dg - lMin); c++) {
        const l = dg - c, i = l * n + c, p = milieu(c, l);
        if (!visible(p)) continue;
        if (monde.route[i]) { if (z >= 0.4 && !calque) nObjets += voitures(monde, i, c, l, p, t); continue; }
        if (monde.occupe[i]) continue;
        const nv = monde.niveau[i];
        if (nv && monde.zone[i] && montrerBatiments) { Mq.lot(ctx, Megalopole.Zones.LETTRE[monde.zone[i]], nv, p.x, p.y, (H.pourCase(k.graine, c, l) * 1000) | 0); nObjets++; }
        else if (k.arbre[i] && !calque) { Mq.arbre(ctx, p.x, p.y, (c * 7 + l * 13) % 11); nObjets++; }
      }
      for (const b of grosParDiag.get(dg) || []) {
        if (!montrerBatiments) continue;
        const m = milieu(b.colonne + (b.taille - 1) / 2, b.ligne + (b.taille - 1) / 2);
        if (m.x < x0 - 200 || m.x > x1 + 200 || m.y < y0 - 50 || m.y > y1 + 50) continue;
        Mq.gros(ctx, b.type, m.x, m.y, b.taille, b, b.type in { centrale: 1, nucleaire: 1 } ? (b.production || 0) > 0 : true);
        if (C.batiments[b.type].rayon && b.marche === false && C.batiments[b.type].service !== "loisirs" && z >= 0.4) bulle(m.x, m.y - 30 * b.taille, "⚡");
        nObjets++;
      }
    }
    ctx.globalAlpha = 1;

    // 4. Ce que fait le maire
    apercu(monde);
    if (monde.selection) { const p = milieu(monde.selection.colonne, monde.selection.ligne); contour(p.x, p.y, 1, "#ffffff", 2.4); }

    // 5. La nuit
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (nuit > 0.05 && !calque) { ctx.fillStyle = "rgba(10, 20, 60, " + (nuit * 0.42) + ")"; ctx.fillRect(0, 0, E.largeur, E.hauteur); }
    stats.cases = nCases; stats.objets = nObjets; stats.ms = performance.now() - debut;
  }

  // Les routes : des pointillés blancs au milieu, le long des routes voisines ; une avenue a un terre-plein vert
  function routes(monde, cMin, cMax, lMin, lMax, visible, z) {
    const n = monde.carte.colonnes, R = monde.route;
    ctx.lineCap = "round";
    const traits = { pointilles: [], terrePlein: [] };
    for (let l = lMin; l <= lMax; l++) for (let c = cMin; c <= cMax; c++) {
      const i = l * n + c;
      if (!R[i]) continue;
      const p = milieu(c, l);
      if (!visible(p)) continue;
      for (const [dc, dl] of [[1, 0], [0, 1]]) {
        const cc = c + dc, ll = l + dl;
        if (cc >= n || ll >= n || !R[ll * n + cc]) continue;
        const q = milieu(cc, ll);
        (R[i] === 2 && R[ll * n + cc] === 2 ? traits.terrePlein : traits.pointilles).push(p.x, p.y, q.x, q.y);
      }
    }
    if (traits.terrePlein.length) { ctx.strokeStyle = "#5a9a4a"; ctx.lineWidth = 4; ctx.beginPath(); for (let j = 0; j < traits.terrePlein.length; j += 4) { ctx.moveTo(traits.terrePlein[j], traits.terrePlein[j + 1]); ctx.lineTo(traits.terrePlein[j + 2], traits.terrePlein[j + 3]); } ctx.stroke(); }
    if (z >= 0.6) { ctx.strokeStyle = "rgba(245, 242, 230, .8)"; ctx.lineWidth = 1.2; ctx.setLineDash([6, 7]); ctx.beginPath(); for (let j = 0; j < traits.pointilles.length; j += 4) { ctx.moveTo(traits.pointilles[j], traits.pointilles[j + 1]); ctx.lineTo(traits.pointilles[j + 2], traits.pointilles[j + 3]); } ctx.stroke(); ctx.setLineDash([]); }
    ctx.lineCap = "butt";
  }

  // 🚗 Des voitures sur les routes : plus il y a de trafic, plus il y en a (et elles vont moins vite dans un bouchon)
  const COULEURS_AUTO = ["#c8443a", "#3f6fc4", "#e8b830", "#f2f2ee", "#3f8a4a", "#2a2c30"];
  function voitures(monde, i, c, l, p, t) {
    const tr = monde.trafic[i];
    if (tr < 0.12) return 0;
    const n = monde.carte.colonnes, R = monde.route;
    const axeC = (c > 0 && R[i - 1]) || (c < n - 1 && R[i + 1]); // la route va le long des colonnes ?
    const nb = Math.min(3, Math.ceil(tr * 2.5)), lent = tr > 1 ? 0.15 : 0.5;
    for (let k = 0; k < nb; k++) {
      const g = (c * 31 + l * 17 + k * 7) % 97, sens = k % 2 ? 1 : -1, u = ((t * lent * sens + g / 97) % 1 + 1) % 1 - 0.5;
      const dx = axeC ? L / 2 : -L / 2, dy = Hc / 2, cote = sens * 4;
      const x = p.x + dx * u + (axeC ? -cote * 0.5 : cote * 0.5), y = p.y + dy * u + cote * 0.5;
      ctx.fillStyle = COULEURS_AUTO[g % COULEURS_AUTO.length];
      ctx.beginPath(); ctx.ellipse(x, y - 2, 4.5, 2.6, axeC ? 0.46 : -0.46, 0, TOUR); ctx.fill();
      ctx.fillStyle = "rgba(200, 225, 240, .9)"; ctx.beginPath(); ctx.ellipse(x, y - 3.5, 2.2, 1.3, axeC ? 0.46 : -0.46, 0, TOUR); ctx.fill();
      if (Mq.vue.nuit > 0.4) { ctx.fillStyle = "rgba(255, 230, 150, .9)"; ctx.fillRect(x - 1, y - 2, 2, 2); }
    }
    stats.voitures += nb;
    return nb;
  }

  // Le contour d'un losange (ou d'un carré de cases)
  function contour(x, y, taille, couleur, epaisseur) {
    ctx.strokeStyle = couleur; ctx.lineWidth = epaisseur || 1.5; ctx.beginPath();
    ctx.moveTo(x - (L / 2) * taille, y); ctx.lineTo(x, y - (Hc / 2) * taille); ctx.lineTo(x + (L / 2) * taille, y); ctx.lineTo(x, y + (Hc / 2) * taille); ctx.closePath(); ctx.stroke();
  }
  function bulle(x, y, texte) {
    ctx.fillStyle = "rgba(255, 255, 255, .92)"; ctx.beginPath(); ctx.arc(x, y, 9, 0, TOUR); ctx.fill(); ctx.strokeStyle = "rgba(60, 50, 40, .5)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText(texte, x, y + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }

  // 4. L'aperçu de l'outil : les cases du tracé (vert = possible, rouge = impossible), et le bâtiment à poser
  function apercu(monde) {
    const o = monde.outil;
    if (!o) return;
    const Co = Megalopole.Construction;
    if (o.sorte === "batiment" && monde.survol) {
      const t = C.batiments[o.valeur].taille, c = monde.survol.colonne - (t >> 1), l = monde.survol.ligne - (t >> 1);
      const ok = !Co.raisonBatiment(monde, o.valeur, c, l), m = milieu(c + (t - 1) / 2, l + (t - 1) / 2);
      ctx.globalAlpha = 0.35; ctx.fillStyle = ok ? "#5ad05a" : "#e04a3a"; ctx.beginPath(); ctx.moveTo(m.x - (L / 2) * t, m.y); ctx.lineTo(m.x, m.y - (Hc / 2) * t); ctx.lineTo(m.x + (L / 2) * t, m.y); ctx.lineTo(m.x, m.y + (Hc / 2) * t); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.6; Mq.gros(ctx, o.valeur, m.x, m.y, t, null, true); ctx.globalAlpha = 1;
      const B = C.batiments[o.valeur];
      if (B.rayon) { ctx.strokeStyle = "rgba(255, 255, 255, .6)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(m.x, m.y, B.rayon * L / 2 * 1.41, B.rayon * Hc / 2 * 1.41, 0, 0, TOUR); ctx.stroke(); ctx.setLineDash([]); }
      return;
    }
    const trace = monde.trace || (monde.survol && { depart: monde.survol, arrivee: monde.survol });
    if (!trace) return;
    const cases = Megalopole.Monde.casesDuTrace(o, trace), couleur = o.sorte === "demolir" ? "#e04a3a" : o.sorte === "dezoner" ? "#e0e0e0" : o.sorte === "zone" ? C.zones[o.valeur].couleur : "#e8e8e8";
    ctx.globalAlpha = 0.45; ctx.fillStyle = couleur; ctx.beginPath();
    for (const q of cases) { const p = milieu(q.colonne, q.ligne); ctx.moveTo(p.x - L / 2, p.y); ctx.lineTo(p.x, p.y - Hc / 2); ctx.lineTo(p.x + L / 2, p.y); ctx.lineTo(p.x, p.y + Hc / 2); }
    ctx.fill(); ctx.globalAlpha = 1;
    if (monde.trace) { // le prix, au bout du tracé
      const e = o.sorte === "route" ? Co.evaluerRoute(monde, cases, o.valeur) : o.sorte === "zone" ? Co.evaluerZone(monde, cases, o.valeur) : null, p = milieu(trace.arrivee.colonne, trace.arrivee.ligne);
      if (e) { const texte = (e.prix || 0) + " 🪙" + (e.impossibles ? " · " + e.impossibles + " ❌" : ""); ctx.font = "bold 13px sans-serif"; const w = ctx.measureText(texte).width + 12; ctx.fillStyle = e.prix > monde.argent ? "rgba(200, 50, 40, .9)" : "rgba(30, 30, 30, .8)"; ctx.fillRect(p.x - w / 2, p.y - 40, w, 20); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.fillText(texte, p.x, p.y - 26); ctx.textAlign = "left"; }
    }
  }

  return { initialiser, dessiner, stats, CALQUES, milieu };
})();
