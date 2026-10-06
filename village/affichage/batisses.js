// 🏡 LES BÂTISSES : le dessinateur des maisons et des petits bonshommes
//
// Ce fichier sait dessiner chaque bâtiment (entrepôt, cabane du bûcheron, scierie…), les chantiers,
// les ouvriers, les porteurs (étape 3) et les jeunes pousses. Il est appelé par le peintre, au bon moment (du fond vers l'avant).
//
// Une maison en vue de biais, c'est une BOÎTE : un losange au sol, deux murs qu'on voit (gauche et
// droite), et un toit. Tous les bâtiments utilisent la même boîte, avec d'autres couleurs et d'autres
// décorations : c'est plus simple, et ils vont bien ensemble.

window.Village = window.Village || {};

Village.Batisses = (function () {
  const TOUR = Math.PI * 2;
  const CONTOUR = "#3b2614";
  const C_ = Village.CONFIG;

  // Les couleurs et la taille de chaque bâtiment.
  //   a : demi-largeur du losange au sol (px) ; h : hauteur des murs ; toit : hauteur du toit.
  // Étape 9 : chaque bâtiment a aussi sa MATIÈRE (mur : rondins, planches, pierre, enduit, colombage),
  // son toit (bardeaux, tuiles, paille, ardoise), ses fenêtres, sa cheminée et sa lanterne.
  const MODELES = {
    entrepot: { a: 27, h: 20, toit: 18, murG: "#d39a5e", murD: "#b07740", toitA: "#d9553b", toitB: "#b8432c", mur: "planches", toitSorte: "tuiles", fenetres: 2, cheminee: 0.3, lanterne: true },
    bucheron: { a: 19, h: 14, toit: 14, murG: "#a87443", murD: "#865a31", toitA: "#7a9a3a", toitB: "#5f7d2b", mur: "rondins", toitSorte: "bardeaux", fenetres: 1, cheminee: 0.7 },
    forestier: { a: 19, h: 14, toit: 15, murG: "#efdcb4", murD: "#cfb68a", toitA: "#4fb556", toitB: "#3a8e3e", mur: "colombage", toitSorte: "bardeaux", fenetres: 1, volets: "#3a8e3e", jardiniere: true },
    scierie: { a: 22, h: 16, toit: 15, murG: "#c48f5d", murD: "#a2703f", toitA: "#6f86b3", toitB: "#556b94", mur: "planches", toitSorte: "ardoise", fenetres: 1 },
    carriere: { a: 19, h: 13, toit: 13, murG: "#b5b5b0", murD: "#90908b", toitA: "#9a6a3c", toitB: "#7c522b", mur: "pierre", toitSorte: "bardeaux", fenetres: 1 },
    pecheur: { a: 18, h: 13, toit: 14, murG: "#e3c896", murD: "#c2a46f", toitA: "#3fa7b5", toitB: "#2d8592", mur: "planches", toitSorte: "bardeaux", fenetres: 1, lanterne: true }, // étape 4
    chasseur: { a: 18, h: 13, toit: 14, murG: "#8e6038", murD: "#6f4826", toitA: "#6f8a3a", toitB: "#56702c", mur: "rondins", toitSorte: "bardeaux", fenetres: 1, cheminee: 0.65 },
    geologue: { a: 18, h: 13, toit: 14, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#8a5ab0", toitB: "#6c428c", mur: "pierre", toitSorte: "ardoise", fenetres: 1 }, // étape 5
    universite: { a: 25, h: 22, toit: 16, murG: "#e8e2d4", murD: "#c7bfae", toitA: "#3f6fc4", toitB: "#2f569c", mur: "pierre", toitSorte: "ardoise", fenetres: 2, lanterne: true }, // étape 7
    mineCharbon: { a: 18, h: 12, toit: 10, murG: "#8a6a48", murD: "#6c5036", toitA: "#555a60", toitB: "#43474c", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, lanterne: true }, // étape 7
    // Étape 8
    hutte: { a: 15, h: 9, toit: 15, murG: "#b98a55", murD: "#97693b", toitA: "#d8b65a", toitB: "#b8963f", mur: "rondins", toitSorte: "paille", fenetres: 0, linge: true }, // un toit de paille
    maison: { a: 20, h: 16, toit: 15, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#c8503a", toitB: "#a43e2b", mur: "colombage", toitSorte: "tuiles", fenetres: 2, volets: "#3f7a4a", cheminee: 0.25, jardiniere: true, lanterne: true, linge: true },
    mineFer: { a: 18, h: 12, toit: 10, murG: "#8a6a48", murD: "#6c5036", toitA: "#9a5a3a", toitB: "#7c472c", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, lanterne: true },
    fonderie: { a: 22, h: 16, toit: 12, murG: "#a9a39a", murD: "#878177", toitA: "#5d4a3e", toitB: "#4a3a30", mur: "pierre", toitSorte: "ardoise", fenetres: 1, feu: true },
    forge: { a: 20, h: 14, toit: 13, murG: "#8b8f96", murD: "#6d7178", toitA: "#3f4a5a", toitB: "#2f3846", mur: "pierre", toitSorte: "ardoise", fenetres: 1, feu: true, cheminee: 0.7 },
    marche: { a: 24, h: 10, toit: 12, murG: "#d9b07a", murD: "#b88e5a", toitA: "#e8c64a", toitB: "#c9a636", mur: "planches", toitSorte: "bardeaux", fenetres: 0, lanterne: true },
  };

  // Étape 9 : ce que le peintre nous dit au début de chaque image.
  //   fin : on est assez près pour dessiner les petits détails ; noirceur : 0 le jour, 1 à minuit ;
  //   lumieres : les points lumineux de l'image (fenêtres, lanternes…), que le peintre allume la nuit.
  const vue = { fin: true, noirceur: 0, hiver: false, t: 0 };
  let lumieres = [];
  function debutImage(monde, t) {
    vue.fin = monde.camera.zoom >= C_.detail.zoomFin;
    vue.noirceur = monde.moment ? monde.moment.noirceur : 0;
    vue.hiver = !!(monde.saison && monde.saison.hiver);
    vue.t = t;
    lumieres = [];
  }
  // Allumer une lumière (r : son rayon en px du monde ; force : de 0 à 1)
  function lumiere(x, y, r, couleur, force) { if (vue.noirceur > 0.05) lumieres.push({ x, y, r, couleur, force: force === undefined ? 1 : force }); }

  // Un point sur un mur : u va de 0 (début du mur) à 1 (fin), v de 0 (le sol) à 1 (le haut du mur).
  const surMur = (P, Q, h, u, v) => [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u - v * h];
  const entre = (P, Q, k) => [P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k];

  // La matière d'un mur (de P à Q au sol, de hauteur h), dessinée par-dessus sa couleur.
  function matiere(ctx, P, Q, h, sorte, coin) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] - h); ctx.lineTo(P[0], P[1] - h); ctx.closePath(); ctx.clip();
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(40, 25, 10, .32)";
    ctx.beginPath();
    if (sorte === "rondins") {
      for (let k = 1; k < 5; k++) { const A = surMur(P, Q, h, 0, k / 5), B = surMur(P, Q, h, 1, k / 5); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      // Le bout rond des rondins, au coin de la maison
      for (let k = 0; k < 5; k++) { const A = surMur(P, Q, h, coin, (k + 0.5) / 5); ctx.beginPath(); ctx.ellipse(A[0], A[1], 1.6, h / 11, 0, 0, TOUR); ctx.fillStyle = "#e0b47a"; ctx.fill(); ctx.strokeStyle = "rgba(60,35,10,.6)"; ctx.stroke(); }
    } else if (sorte === "planches") {
      for (let k = 1; k < 7; k++) { const A = surMur(P, Q, h, k / 7, 0), B = surMur(P, Q, h, k / 7, 1); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      ctx.fillStyle = "rgba(40,25,10,.4)"; // les clous
      for (let k = 0; k < 7; k++) for (const v of [0.15, 0.85]) { const A = surMur(P, Q, h, (k + 0.5) / 7, v); ctx.fillRect(A[0] - 0.4, A[1] - 0.4, 0.8, 0.8); }
    } else if (sorte === "pierre") {
      const rangs = 4;
      for (let k = 1; k < rangs; k++) { const A = surMur(P, Q, h, 0, k / rangs), B = surMur(P, Q, h, 1, k / rangs); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      for (let r = 0; r < rangs; r++) for (let k = 0; k < 5; k++) { const u = (k + (r % 2 ? 0.5 : 0)) / 5, A = surMur(P, Q, h, u, r / rangs), B = surMur(P, Q, h, u, (r + 1) / rangs); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.14)"; // quelques pierres plus claires
      for (let r = 0; r < rangs; r++) for (let k = (r * 3) % 4; k < 5; k += 3) { const A = surMur(P, Q, h, (k + 0.15 + (r % 2 ? 0.5 : 0)) / 5, (r + 0.25) / rangs), B = surMur(P, Q, h, (k + 0.85 + (r % 2 ? 0.5 : 0)) / 5, (r + 0.75) / rangs); ctx.fillRect(Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); }
    } else if (sorte === "colombage") {
      // Les poutres en bois d'une maison à colombages
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6;
      const ligne = (u1, v1, u2, v2) => { const A = surMur(P, Q, h, u1, v1), B = surMur(P, Q, h, u2, v2); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); };
      ligne(0, 0.06, 1, 0.06); ligne(0, 0.94, 1, 0.94); ligne(0, 0.5, 1, 0.5);
      for (const u of [0.04, 0.5, 0.96]) ligne(u, 0, u, 1);
      ligne(0.04, 0.5, 0.25, 0.94); ligne(0.96, 0.5, 0.75, 0.94);
      ctx.stroke();
    }
    // L'ombre au pied du mur (la lumière vient d'en haut)
    const A = surMur(P, Q, h, 0, 0.28), B = surMur(P, Q, h, 1, 0.28);
    ctx.fillStyle = "rgba(30, 20, 10, .13)";
    ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(A[0], A[1]); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Les rangées de tuiles (ou de bardeaux, d'ardoises, de paille) sur un pan de toit.
  // Le pan va du bas (A → B, le bord du toit) au haut (A2 → B2, le faîte).
  function tuiles(ctx, A, B, A2, B2, sorte) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(A2[0], A2[1]); ctx.closePath(); ctx.clip();
    const rangs = sorte === "paille" ? 6 : 5;
    ctx.strokeStyle = sorte === "paille" ? "rgba(120, 90, 30, .5)" : "rgba(40, 20, 10, .3)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < rangs; k++) {
      const P = entre(A, A2, k / rangs), Q = entre(B, B2, k / rangs);
      if (sorte === "paille") { // de la paille : des lignes qui ondulent
        for (let n = 0; n <= 8; n++) { const R = entre(P, Q, n / 8); n ? ctx.lineTo(R[0], R[1] + (n % 2 ? 1 : -0.5)) : ctx.moveTo(R[0], R[1]); }
      } else { ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); }
      // Les petits traits entre les tuiles, décalés d'un rang à l'autre
      if (sorte !== "paille") {
        const P0 = entre(A, A2, (k - 1) / rangs), Q0 = entre(B, B2, (k - 1) / rangs);
        const n = sorte === "tuiles" ? 7 : 6;
        for (let j = 0; j < n; j++) { const u = (j + (k % 2 ? 0.5 : 0)) / n, R1 = entre(P0, Q0, u), R2 = entre(P, Q, u); ctx.moveTo(R1[0], R1[1]); ctx.lineTo(R2[0], R2[1]); }
      }
    }
    ctx.stroke();
    if (sorte === "tuiles") { // des tuiles rondes : un reflet clair sur chaque rang
      ctx.strokeStyle = "rgba(255, 220, 190, .25)"; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k < rangs; k++) { const P = entre(A, A2, (k + 0.6) / rangs), Q = entre(B, B2, (k + 0.6) / rangs); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Une fenêtre sur un mur. La nuit, elle s'allume (une lumière jaune, et un halo).
  function fenetre(ctx, P, Q, h, u, volets) {
    const du = 0.085, v0 = 0.36, v1 = 0.78;
    const pts = [surMur(P, Q, h, u - du, v0), surMur(P, Q, h, u + du, v0), surMur(P, Q, h, u + du, v1), surMur(P, Q, h, u - du, v1)];
    if (volets) for (const s of [-1, 1]) {
      const a = u + s * du, b = u + s * (du + 0.07);
      forme(ctx, [surMur(P, Q, h, a, v0), surMur(P, Q, h, b, v0), surMur(P, Q, h, b, v1), surMur(P, Q, h, a, v1)], volets);
    }
    const nuit = vue.noirceur;
    forme(ctx, pts, nuit > 0.15 ? "#ffd866" : "#9fd3f0");
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1;
    const m1 = surMur(P, Q, h, u, v0), m2 = surMur(P, Q, h, u, v1), m3 = surMur(P, Q, h, u - du, (v0 + v1) / 2), m4 = surMur(P, Q, h, u + du, (v0 + v1) / 2);
    ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.moveTo(m3[0], m3[1]); ctx.lineTo(m4[0], m4[1]); ctx.stroke();
    if (nuit <= 0.15) { // un reflet du ciel
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); const r1 = surMur(P, Q, h, u - du * 0.6, v1 - 0.08), r2 = surMur(P, Q, h, u - du * 0.1, v1 - 0.2); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.stroke();
    }
    const c = surMur(P, Q, h, u, (v0 + v1) / 2);
    lumiere(c[0], c[1], 13, "jaune", 0.9);
  }

  // La boîte : (x, y) est le milieu du losange au sol. `murs` de 0 à 1 (pour un chantier qui monte).
  function boite(ctx, x, y, m, murs, avecToit) {
    const a = m.a, b = a / 2, h = m.h * murs;
    const G = [x - a, y], B = [x, y + b], D = [x + a, y], H = [x, y - b];
    const up = ([px, py], dh) => [px, py - dh];
    const fin = vue.fin;
    // Les 2 murs qu'on voit
    forme(ctx, [G, B, up(B, h), up(G, h)], m.murG);
    forme(ctx, [B, D, up(D, h), up(B, h)], m.murD);
    if (fin && m.mur) {
      // Étape 9 : la matière des murs, de près
      matiere(ctx, G, B, h, m.mur, 0);
      matiere(ctx, B, D, h, m.mur, 1);
      ctx.beginPath(); ctx.moveTo(G[0], G[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(D[0], D[1]); ctx.lineTo(D[0], D[1] - h); ctx.lineTo(B[0], B[1] - h); ctx.lineTo(G[0], G[1] - h); ctx.closePath(); contour(ctx, 2);
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0], B[1] - h); contour(ctx, 1.5);
    } else if (m.mur === "rondins" || m.mur === "pierre") {
      // De loin : quelques traits suffisent
      ctx.strokeStyle = "rgba(40, 25, 10, .35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const dh = (h * k) / 4;
        ctx.moveTo(G[0], G[1] - dh); ctx.lineTo(B[0], B[1] - dh); ctx.lineTo(D[0], D[1] - dh);
      }
      ctx.stroke();
    }
    if (!avecToit) {
      // Pas de toit (chantier) : on voit le haut des murs.
      forme(ctx, [up(G, h), up(B, h), up(D, h), up(H, h)], "rgba(120, 85, 50, .6)");
      return;
    }
    // Les fenêtres, sur le mur de droite
    if (murs >= 1 && m.fenetres) {
      const places = m.fenetres === 1 ? [0.55] : [0.3, 0.72];
      if (fin) for (const u of places) fenetre(ctx, B, D, h, u, m.volets);
      else for (const u of places) { const c = surMur(B, D, h, u, 0.57); ctx.fillStyle = vue.noirceur > 0.15 ? "#ffd866" : "#7fb3d0"; ctx.fillRect(c[0] - 2.5, c[1] - 3, 5, 6); lumiere(c[0], c[1], 11, "jaune", 0.8); }
      if (fin && m.jardiniere) { // une jardinière de fleurs sous la première fenêtre
        const u = places[0], p1 = surMur(B, D, h, u - 0.1, 0.3), p2 = surMur(B, D, h, u + 0.1, 0.3);
        forme(ctx, [p1, p2, [p2[0], p2[1] + 2.5], [p1[0], p1[1] + 2.5]], "#9a6a3c");
        if (!vue.hiver) for (let k = 0; k < 4; k++) { const f = entre(p1, p2, (k + 0.5) / 4); ctx.fillStyle = ["#e8402e", "#ffcf2e", "#ff7ab6", "#ffffff"][k]; ctx.beginPath(); ctx.arc(f[0], f[1] - 1, 1.3, 0, TOUR); ctx.fill(); }
      }
    }
    // Le toit à deux pentes : le faîte (la ligne du haut) va du milieu du mur gauche-haut au milieu du mur bas-droite.
    const deb = 3; // le toit dépasse un peu des murs
    const Gt = [G[0] - deb, G[1] - h + 1], Bt = [B[0], B[1] - h + deb], Dt = [D[0] + deb, D[1] - h + 1], Ht = [H[0], H[1] - h - deb];
    const F1 = [(Gt[0] + Ht[0]) / 2, (Gt[1] + Ht[1]) / 2 - m.toit];
    const F2 = [(Bt[0] + Dt[0]) / 2, (Bt[1] + Dt[1]) / 2 - m.toit];
    // Le pignon (le triangle de mur sous le toit, côté droit)
    forme(ctx, [up(B, h), up(D, h), [F2[0], F2[1] + 3]], m.murD);
    forme(ctx, [Ht, Dt, F2, F1], m.toitB); // la pente du fond
    // Étape 9 : la cheminée sort de la pente du fond (elle est dessinée avant la pente de devant)
    if (m.cheminee) {
      const pied = entre(F1, F2, m.cheminee), base = [pied[0] + 4, pied[1] + 1];
      forme(ctx, [[base[0] - 3, base[1]], [base[0] + 3, base[1] + 1.5], [base[0] + 3, base[1] - 12], [base[0] - 3, base[1] - 13.5]], "#9a5a3c");
      forme(ctx, [[base[0] - 4, base[1] - 13], [base[0] + 4, base[1] - 11], [base[0] + 4, base[1] - 13.5], [base[0] - 4, base[1] - 15.5]], "#7a4a30");
      m.fumeeX = base[0] - x; m.fumeeY = base[1] - 17 - y; // pour la fumée (dessinée plus tard)
    }
    forme(ctx, [Gt, F1, F2, Bt], m.toitA); // la pente de devant
    if (fin && m.toitSorte) { tuiles(ctx, Gt, Bt, F1, F2, m.toitSorte); tuiles(ctx, Dt, Ht, F2, F1, m.toitSorte); }
    // ❄️ En hiver, de la neige sur le toit
    if (vue.hiver) {
      forme(ctx, [F1, F2, entre(F2, Bt, 0.45), entre(F1, Gt, 0.45)], "#f4f8ff");
      ctx.fillStyle = "#f4f8ff"; for (let k = 0; k < 4; k++) { const p = entre(entre(F1, Gt, 0.45), entre(F2, Bt, 0.45), (k + 0.5) / 4); ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, TOUR); ctx.fill(); }
    }
    // Un trait clair sur le faîte
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(F1[0] + 2, F1[1] + 2); ctx.lineTo(F2[0] - 2, F2[1] + 2); ctx.stroke();
  }

  // Étape 5 : un beau rondin, avec son écorce et les cernes du bois au bout, un peu penché.
  function rondin(ctx, x, y, penche) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-penche);
    ctx.beginPath(); ctx.moveTo(-9, -2.8); ctx.lineTo(8, -2.8); ctx.lineTo(8, 2.8); ctx.lineTo(-9, 2.8); ctx.closePath();
    ctx.fillStyle = "#8f5e2e"; ctx.fill(); contour(ctx, 1.2);
    ctx.strokeStyle = "rgba(50, 30, 10, .45)"; ctx.lineWidth = 0.8; // l'écorce
    ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(-1, -1.2); ctx.moveTo(1, 1); ctx.lineTo(6, 0.8); ctx.moveTo(-5, 1.4); ctx.lineTo(-2, 1.5); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-9, 0, 1.4, 2.8, 0, 0, TOUR); ctx.fillStyle = "#c9955a"; ctx.fill(); contour(ctx, 1);
    ctx.beginPath(); ctx.ellipse(8, 0, 1.6, 2.8, 0, 0, TOUR); ctx.fillStyle = "#e6be85"; ctx.fill(); contour(ctx, 1.1);
    ctx.strokeStyle = "rgba(140, 90, 40, .8)"; ctx.lineWidth = 0.6; // les cernes
    ctx.beginPath(); ctx.ellipse(8, 0, 0.8, 1.6, 0, 0, TOUR); ctx.stroke();
    ctx.restore();
  }

  // Étape 6 : ✍️ une vraie planche : longue, fine et plate, posée en biais sur le sol (comme les cases),
  // avec le dessus clair, la tranche plus foncée, et les lignes du bois.
  function planche(ctx, x, y, longueur) {
    const L2 = (longueur || 26) / 2, e = 1.6, l = 3; // demi-longueur, épaisseur, demi-largeur
    const ax = x - L2 * 0.9, ay = y - L2 * 0.45, bx = x + L2 * 0.9, by = y + L2 * 0.45;
    const dessus = [[ax - l * 0.9, ay + l * 0.45], [ax + l * 0.9, ay - l * 0.45], [bx + l * 0.9, by - l * 0.45], [bx - l * 0.9, by + l * 0.45]];
    // Un trait fin et brun (pas noir) : sinon, une pile de planches ressemble à un bloc sombre.
    const face = (points, couleur) => {
      ctx.beginPath(); points.forEach(([px, py], n) => (n ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
      ctx.fillStyle = couleur; ctx.fill(); ctx.strokeStyle = "#7a4e22"; ctx.lineWidth = 0.8; ctx.lineJoin = "round"; ctx.stroke();
    };
    face([dessus[3], dessus[2], [dessus[2][0], dessus[2][1] + e], [dessus[3][0], dessus[3][1] + e]], "#c9965a"); // la tranche longue
    face([dessus[0], dessus[3], [dessus[3][0], dessus[3][1] + e], [dessus[0][0], dessus[0][1] + e]], "#d9a866"); // le bout
    face(dessus, "#f0cf98"); // le dessus, clair
    // Les veines du bois, dans le sens de la longueur
    ctx.strokeStyle = "rgba(170, 115, 60, .6)"; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ax + 1, ay - 0.6); ctx.quadraticCurveTo(x, y - 0.2, bx - 2, by - 1.2);
    ctx.moveTo(ax + 3, ay + 0.8); ctx.quadraticCurveTo(x + 1, y + 1.3, bx - 4, by + 0.4);
    ctx.stroke();
    // Un petit nœud du bois
    ctx.beginPath(); ctx.ellipse(x - 2, y - 0.6, 1, 0.5, 0.45, 0, TOUR); ctx.stroke();
  }

  // Étape 7 : un morceau de charbon, noir et brillant
  function charbon(ctx, x, y) {
    forme(ctx, [[x - 3.5, y + 1], [x - 2, y - 2.5], [x + 1.5, y - 3], [x + 3.5, y - 0.5], [x + 2, y + 2], [x - 1.5, y + 2.2]], "#2b2b30");
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(x - 1.5, y - 2); ctx.lineTo(x + 1, y - 2.4); ctx.lineTo(x - 0.5, y - 0.8); ctx.closePath(); ctx.fill();
  }

  // Étape 8 : un caillou de minerai de fer (brun-rouge, avec des points de rouille)
  function minerai(ctx, x, y) {
    forme(ctx, [[x - 3.5, y + 1.5], [x - 2.5, y - 2.5], [x + 1, y - 3.2], [x + 3.8, y - 0.8], [x + 2.6, y + 2.4], [x - 1, y + 2.8]], "#8e5a3c");
    ctx.fillStyle = "#c98a5a"; ctx.beginPath(); ctx.arc(x - 1, y - 1, 0.9, 0, TOUR); ctx.arc(x + 1.6, y + 0.6, 0.7, 0, TOUR); ctx.fill();
  }
  // Étape 8 : un lingot (une barre de fer en trapèze, brillante)
  function lingot(ctx, x, y) {
    forme(ctx, [[x - 6, y + 2], [x + 4, y + 2], [x + 6, y - 1], [x - 4, y - 1]], "#9aa3ad");
    forme(ctx, [[x - 4, y - 1], [x + 6, y - 1], [x + 4.5, y - 3.5], [x - 2.5, y - 3.5]], "#c9d1da");
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 1.5, y - 2.4); ctx.lineTo(x + 3, y - 2.4); ctx.stroke();
  }
  // Étape 8 : un outil (un marteau : un manche en bois et une tête en fer)
  function outil(ctx, x, y) {
    ctx.strokeStyle = "#7a4e22"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + 2, y - 2); ctx.stroke();
    forme(ctx, [[x - 0.5, y - 5], [x + 2.5, y - 6.5], [x + 6, y - 1.5], [x + 3, y]], "#8b9099");
  }

  // Un poisson ou un morceau de viande (pour les piles et pour ce qu'on porte)
  function poisson(ctx, x, y) {
    ctx.beginPath(); ctx.ellipse(x, y, 4.5, 2.4, 0, 0, TOUR); ctx.fillStyle = "#7fb8e0"; ctx.fill(); contour(ctx, 1);
    forme(ctx, [[x + 4, y], [x + 7.5, y - 2.5], [x + 7.5, y + 2.5]], "#5a9cc8");
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(x - 2.5, y - 0.5, 0.7, 0, TOUR); ctx.fill();
  }
  function viande(ctx, x, y) {
    ctx.strokeStyle = "#f3ead8"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x + 6.5, y - 2.5); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - 1, y + 0.5, 4, 3, -0.4, 0, TOUR); ctx.fillStyle = "#b4512e"; ctx.fill(); contour(ctx, 1);
  }

  function contour(ctx, largeur) {
    ctx.strokeStyle = CONTOUR;
    ctx.lineWidth = largeur || 2;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function forme(ctx, points, couleur) {
    ctx.beginPath();
    points.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = couleur;
    ctx.fill();
    contour(ctx);
  }

  // La porte, sur le mur de gauche
  function porte(ctx, x, y, m, couleur) {
    const a = m.a, b = a / 2;
    const px = x - a * 0.45, py = y + b * 0.55;
    if (vue.fin) { // Étape 9 : une marche en pierre devant la porte, et un cadre plus clair
      forme(ctx, [[px - 6, py - 1], [px + 1, py + 4.5], [px + 6, py + 2], [px - 1, py - 3.5]], "#b9b2a6");
      forme(ctx, [[px - 5, py - 2.5], [px + 5, py + 2.5], [px + 5, py - 11.5], [px - 5, py - 16.5]], "#e6cfa2");
    }
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 2); ctx.lineTo(px + 4, py + 2); ctx.lineTo(px + 4, py - 10); ctx.lineTo(px - 4, py - 14); ctx.closePath();
    ctx.fillStyle = couleur || "#5a3818"; ctx.fill(); contour(ctx, 1.5);
    if (vue.fin) {
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 12); ctx.stroke(); // les planches de la porte
      ctx.fillStyle = "#e8c64a"; ctx.beginPath(); ctx.arc(px + 2.3, py - 5, 0.9, 0, TOUR); ctx.fill(); // la poignée
    }
    if (m.lanterne) { // Étape 9 : une lanterne accrochée à côté de la porte, allumée la nuit
      const lx = px + 7, ly = py - 12;
      ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx - 2, ly - 3); ctx.lineTo(lx + 1, ly - 3); ctx.lineTo(lx + 1, ly - 1); ctx.stroke();
      forme(ctx, [[lx - 1.5, ly - 1], [lx + 3.5, ly - 1], [lx + 3, ly + 5], [lx - 1, ly + 5]], vue.noirceur > 0.15 ? "#ffd04a" : "#6b6050");
      lumiere(lx + 1, ly + 2, 22, "orange", 1);
    }
  }

  // Étape 9 : une caisse en bois (pour la cour de l'entrepôt), avec ce qu'elle contient sur le dessus
  function caisse(ctx, x, y, contenu) {
    forme(ctx, [[x - 6, y], [x, y + 3], [x + 6, y], [x + 6, y - 6], [x, y - 3], [x - 6, y - 6]], "#c98b4f");
    forme(ctx, [[x - 6, y - 6], [x, y - 3], [x + 6, y - 6], [x, y - 9]], "#ddaa6a");
    ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x, y - 3); contour(ctx, 1);
    if (contenu === "poissons") { poisson(ctx, x - 2, y - 7); poisson(ctx, x + 1.5, y - 6); }
    else if (contenu === "viande") { viande(ctx, x - 1, y - 7); viande(ctx, x + 2, y - 6); }
    else if (contenu === "charbon") { charbon(ctx, x - 2, y - 7); charbon(ctx, x + 2, y - 6.5); }
    else if (contenu === "fer") { minerai(ctx, x - 2, y - 7); minerai(ctx, x + 2, y - 6.5); }
    else if (contenu === "outils") { outil(ctx, x, y - 7); }
    else if (contenu === "lingots") { lingot(ctx, x, y - 6.5); lingot(ctx, x + 1, y - 8.5); }
  }
  // Étape 9 : la cour de l'entrepôt montre le stock (plus il y en a, plus les piles sont hautes)
  function cour(ctx, x, y, stock) {
    const n = (r) => Math.min(9, Math.ceil(Math.sqrt(Math.max(0, stock[r] || 0))));
    pile(ctx, x - 30, y + 2, "rondin", n("troncs"));
    pile(ctx, x - 20, y + 13, "pierre", Math.min(6, n("pierres")));
    pile(ctx, x + 24, y + 4, "planche", Math.min(7, n("planches")));
    const caisses = ["poissons", "viande", "charbon", "fer", "lingots", "outils"].filter((r) => stock[r] > 0).slice(0, 3);
    caisses.forEach((r, k) => caisse(ctx, x + 6 + k * 9, y + 15 - k * 3.5, r));
  }

  // Étape 9 : du linge qui sèche sur une corde, et qui bouge dans le vent
  function linge(ctx, x, y, t) {
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16, y - 6); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.quadraticCurveTo(x + 8, y - 6, x + 16, y - 5); ctx.stroke();
    ["#e8402e", "#ffffff", "#3e7bff"].forEach((c, k) => {
      const cx = x + 3 + k * 4.5, cy = y - 11.5 + k * 2.6, vent = Math.sin(t * 2.4 + k) * 1.2;
      forme(ctx, [[cx - 1.6, cy], [cx + 1.6, cy + 0.8], [cx + 1.6 + vent, cy + 5.8], [cx - 1.6 + vent, cy + 5]], c);
    });
  }

  // Étape 9 : un âne (de profil, tourné vers la droite). Il broute quand il attend.
  function ane(ctx, x, y, t, marche) {
    const pas = marche ? Math.sin(t * 12) : 0, poil = "#8b7a6b", clair = "#d8cfc4", fonce = "#5e5148";
    ctx.strokeStyle = fonce; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); for (const [dx, s] of [[-6, 1], [-3.5, -1], [4.5, -1], [7, 1]]) { ctx.moveTo(x + dx, y - 7); ctx.lineTo(x + dx + pas * 1.8 * s, y); } ctx.stroke();
    ctx.fillStyle = "#2b2420"; for (const [dx, s] of [[-6, 1], [-3.5, -1], [4.5, -1], [7, 1]]) ctx.fillRect(x + dx + pas * 1.8 * s - 1.2, y - 1, 2.4, 1.4); // les sabots
    ctx.beginPath(); ctx.ellipse(x, y - 10, 9, 4.8, 0, 0, TOUR); ctx.fillStyle = poil; ctx.fill(); contour(ctx, 1.3);
    ctx.beginPath(); ctx.ellipse(x + 0.5, y - 8, 5.5, 2, 0, 0, TOUR); ctx.fillStyle = clair; ctx.fill(); // le ventre clair
    const tete = marche ? Math.sin(t * 12) * 0.6 : Math.max(0, Math.sin(t * 1.5)) * 6; // il baisse la tête pour brouter
    // Le cou, puis la tête allongée avec son museau clair
    forme(ctx, [[x + 6, y - 13], [x + 10, y - 19 + tete], [x + 13, y - 17 + tete], [x + 9, y - 9]], poil);
    ctx.beginPath(); ctx.ellipse(x + 13.5, y - 17 + tete, 4.6, 2.6, 0.45, 0, TOUR); ctx.fillStyle = poil; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(x + 16.5, y - 15.2 + tete, 2, 1.7, 0.45, 0, TOUR); ctx.fillStyle = clair; ctx.fill(); contour(ctx, 1);
    forme(ctx, [[x + 10.5, y - 19 + tete], [x + 8.5, y - 27 + tete], [x + 12.3, y - 19.5 + tete]], poil); // les grandes oreilles
    forme(ctx, [[x + 12.5, y - 19.5 + tete], [x + 13.5, y - 27.5 + tete], [x + 14.3, y - 18.8 + tete]], poil);
    ctx.strokeStyle = fonce; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 6.5, y - 14); ctx.lineTo(x + 10.5, y - 20 + tete); ctx.stroke(); // la crinière
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(x + 13.5, y - 18 + tete, 0.8, 0, TOUR); ctx.fill(); // l'œil
    ctx.strokeStyle = fonce; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 11); ctx.quadraticCurveTo(x - 12, y - 8 + Math.sin(t * 3), x - 11, y - 4); ctx.stroke(); // la queue
  }
  // Étape 9 : une charrette à 2 roues (de profil), avec son chargement
  function charrette(ctx, x, y, t, quoi, nombre, marche) {
    const tour = marche ? t * 6 : 0;
    forme(ctx, [[x - 9, y - 9], [x + 7, y - 9], [x + 6, y - 4], [x - 8, y - 4]], "#a8743f");
    ctx.strokeStyle = "rgba(40,25,10,.4)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 6.5); ctx.lineTo(x + 6.5, y - 6.5); ctx.stroke();
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 6, y - 7); ctx.lineTo(x + 15, y - 9); ctx.stroke(); // le timon
    for (let k = 0; k < (quoi ? nombre : 0); k++) objetPorte(ctx, quoi, x - 5 + k * 5, y - 11 - (k % 2) * 1.5);
    ctx.beginPath(); ctx.arc(x - 1, y - 3, 3.6, 0, TOUR); ctx.fillStyle = "#7a5230"; ctx.fill(); contour(ctx, 1.2);
    ctx.strokeStyle = "#e0b47a"; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const an = tour + (k * Math.PI) / 3; ctx.moveTo(x - 1 - Math.cos(an) * 3, y - 3 - Math.sin(an) * 3); ctx.lineTo(x - 1 + Math.cos(an) * 3, y - 3 + Math.sin(an) * 3); }
    ctx.stroke();
  }
  // Étape 9 : une brouette (de profil, la roue devant)
  function brouette(ctx, x, y, t, quoi, marche) {
    const tour = marche ? t * 9 : 0;
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 4, y - 4); ctx.stroke(); // les bras
    forme(ctx, [[x - 4, y - 10], [x + 7, y - 10], [x + 5, y - 5], [x - 2, y - 5]], "#8b9099");
    if (quoi) { objetPorte(ctx, quoi, x, y - 11); objetPorte(ctx, quoi, x + 3, y - 12); }
    ctx.beginPath(); ctx.arc(x + 6, y - 3, 3, 0, TOUR); ctx.fillStyle = "#5a3818"; ctx.fill(); contour(ctx, 1);
    ctx.strokeStyle = "#c9a06a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + 6 - Math.cos(tour) * 2.4, y - 3 - Math.sin(tour) * 2.4); ctx.lineTo(x + 6 + Math.cos(tour) * 2.4, y - 3 + Math.sin(tour) * 2.4); ctx.stroke();
  }

  function ombre(ctx, x, y, a) {
    ctx.fillStyle = "rgba(20, 40, 10, .22)";
    ctx.beginPath(); ctx.ellipse(x + 6, y + 3, a * 1.15, a * 0.55, 0, 0, TOUR); ctx.fill();
  }

  function rond(ctx, x, y, r, couleur) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TOUR); ctx.fillStyle = couleur; ctx.fill(); contour(ctx, 1.5);
  }

  // Une pile de rondins ou de planches à côté du bâtiment
  function pile(ctx, x, y, sorte, nombre) {
    for (let k = 0; k < nombre; k++) {
      const px = x + (k % 3) * 6 - (Math.floor(k / 3) % 2) * 3, py = y - Math.floor(k / 3) * 5;
      if (sorte === "rondin") {
        // Le bout d'un rondin : le bois clair, les cernes, et l'écorce autour
        rond(ctx, px, py, 3.2, "#8f5e2e");
        ctx.beginPath(); ctx.arc(px, py, 2.3, 0, TOUR); ctx.fillStyle = "#e6be85"; ctx.fill();
        ctx.strokeStyle = "rgba(140, 90, 40, .8)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, TOUR); ctx.stroke();
      }
      else if (sorte === "poisson") poisson(ctx, px, py);
      else if (sorte === "viande") viande(ctx, px, py);
      else if (sorte === "charbon") charbon(ctx, px, py);
      else if (sorte === "fer") minerai(ctx, px, py); // étape 8
      else if (sorte === "lingots") lingot(ctx, px + 1, py + 1);
      else if (sorte === "outils") outil(ctx, px, py);
      else if (sorte === "planche") planche(ctx, x + (k % 2 ? 2.5 : -1), y - k * 2.6, 24); // étape 6 : une pile de longues planches, un peu décalées
      else caillou(ctx, px, py, k); // étape 9 : de vraies pierres taillées
    }
  }

  // ---------------------------------------------------------------- un bâtiment
  function dessinerBatiment(ctx, b, x, y, t) {
    const m = MODELES[b.type];
    ombre(ctx, x, y, m.a);
    if (b.etat === "chantier") return chantier(ctx, b, x, y, m, t);
    if (b.type === "entrepot") cour(ctx, x, y, (Village.monde && Village.monde.stock) || {}); // étape 9 : la cour, derrière
    if (m.linge && vue.fin && !vue.hiver) linge(ctx, x - m.a - 12, y - 2, t); // étape 9
    boite(ctx, x, y, m, 1, true);
    porte(ctx, x, y, m);
    const travaille = b.ouvrier && b.ouvrier.etat === "travailler";
    // Étape 9 : la cheminée fume quand quelqu'un habite là (ou travaille)
    const habite = b.type === "entrepot" || b.type === "maison" || b.type === "hutte" || !!b.ouvrier;
    if (m.cheminee && habite && m.fumeeX !== undefined) fumee(ctx, x + m.fumeeX, y + m.fumeeY, t + b.numero);
    if (m.feu && b.travail) lumiere(x + 7, y - 2, 30, "orange", 1); // la lueur du four
    switch (b.type) {
      case "entrepot":
        // Étape 9 : les ânes qui attendent à côté de l'entrepôt (avec la recherche « Ânes et charrettes »)
        if (Village.monde && Village.Recherches.bonus(Village.monde, "chargement") > 1) {
          const auRepos = Village.monde.porteurs.filter((p) => p.etat === "attend" && !p.parti).length;
          for (let k = 0; k < Math.min(2, auRepos); k++) ane(ctx, x + 28 + k * 8, y - 8 + k * 7, t + k * 2, false);
        }
        // Le drapeau du village sur le toit
        drapeau(ctx, x - 6, y - 50, t, Village.Boutique.COULEURS_DRAPEAU[(Village.monde && Village.monde.drapeau) || 0]); // étape 7 : la couleur achetée
        break;
      case "bucheron":
        pile(ctx, x + 14, y + 8, "rondin", b.sortie); // les troncs qui attendent un porteur
        // Une hache plantée dans une souche
        rond(ctx, x - 22, y + 10, 4, "#c78b4a");
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 22, y + 7); ctx.lineTo(x - 18, y - 3); ctx.stroke();
        forme(ctx, [[x - 23, y + 7], [x - 19, y + 5], [x - 20, y + 10]], "#c9ccd1");
        break;
      case "forestier":
        // Un petit sapin dans un pot, devant la porte
        forme(ctx, [[x + 14, y + 12], [x + 20, y + 12], [x + 19, y + 6], [x + 15, y + 6]], "#c4622f");
        forme(ctx, [[x + 11, y + 6], [x + 17, y - 6], [x + 23, y + 6]], "#3a9d55");
        break;
      case "scierie": {
        pile(ctx, x + 16, y + 10, "planche", b.sortie);
        pile(ctx, x - 20, y + 12, "rondin", b.entrees.troncs || 0); // les troncs en réserve
        // La grande lame de scie, qui tourne quand on scie
        const angle = b.travail ? t * 12 : 0, cx = x + 12, cy = y - 8;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
        ctx.beginPath();
        for (let k = 0; k < 16; k++) {
          const r = k % 2 ? 7 : 9, a = (k / 16) * TOUR;
          k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fillStyle = "#d8dce2"; ctx.fill(); contour(ctx, 1.4);
        ctx.restore();
        rond(ctx, cx, cy, 2, "#7a7f88");
        if (b.travail) sciure(ctx, cx, cy, t);
        break;
      }
      case "carriere":
        pile(ctx, x + 14, y + 9, "pierre", b.sortie);
        // Une pioche posée contre le mur
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 20, y + 9); ctx.lineTo(x - 16, y - 6); ctx.stroke();
        ctx.strokeStyle = "#7a7f88"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x - 22, y - 4); ctx.quadraticCurveTo(x - 16, y - 9, x - 10, y - 5); ctx.stroke();
        break;
    }
    if (b.type === "pecheur") {
      pile(ctx, x + 14, y + 9, "poisson", b.sortie);
      // Un filet de pêche accroché au mur
      ctx.strokeStyle = "rgba(60, 40, 20, .7)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { ctx.moveTo(x + 4 + k * 3, y - 3 + k * 1.5); ctx.lineTo(x + 4 + k * 3, y - 11 + k * 1.5); }
      for (let k = 0; k < 3; k++) { ctx.moveTo(x + 4, y - 4 - k * 3); ctx.lineTo(x + 13, y + 0.5 - k * 3); }
      ctx.stroke();
    } else if (b.type === "universite") {
      // Étape 7 : une petite tour avec une coupole, et un télescope pour regarder les étoiles
      forme(ctx, [[x + 8, y - 22], [x + 18, y - 17], [x + 18, y - 42], [x + 8, y - 47]], "#ddd6c6");
      ctx.beginPath(); ctx.arc(x + 13, y - 45, 6, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#3f6fc4"; ctx.fill(); contour(ctx, 1.5);
      ctx.strokeStyle = "#7a5a30"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 13, y - 50); ctx.lineTo(x + 22, y - 57); ctx.stroke();
      const etudie = Village.monde && Village.monde.recherches.enCours;
      if (etudie && Math.sin(t * 4) > 0) { ctx.fillStyle = "#fff36b"; ctx.beginPath(); ctx.arc(x + 25, y - 60, 2, 0, TOUR); ctx.fill(); } // une étoile : il cherche !
      if (etudie) bulleDePensee(ctx, x - 10, y - m.h - m.toit - 20, t, Village.Recherches.trouver(etudie.id).emoji);
    } else if (b.type === "hutte") {
      // Étape 8 : une hutte ronde en paille, avec un petit feu devant
      ctx.strokeStyle = "rgba(120, 90, 30, .5)"; ctx.lineWidth = 1;
      ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x - 10 + k * 5, y - 18 - k); ctx.lineTo(x - 13 + k * 5, y - 10 - k); } ctx.stroke();
      fumee(ctx, x + 14, y - 26, t);
    } else if (b.type === "maison") {
      // Étape 9 : les fenêtres, les volets et la cheminée sont maintenant dessinés pour tous (voir boite)
    } else if (b.type === "fonderie") {
      // Étape 8 : la grande cheminée, la bouche du four qui rougeoie, et la fonte qui coule
      forme(ctx, [[x + 8, y - 24], [x + 15, y - 27], [x + 15, y - 50], [x + 8, y - 47]], "#7d736a");
      if (b.travail) fumee(ctx, x + 11, y - 54, t);
      const lueur = b.travail ? 0.6 + 0.4 * Math.sin(t * 9) : 0.25;
      forme(ctx, [[x + 2, y + 6], [x + 12, y + 1], [x + 12, y - 6], [x + 2, y - 1]], "rgba(255, " + Math.round(110 + 60 * lueur) + ", 40, " + (0.4 + lueur * 0.6) + ")");
      pile(ctx, x - 22, y + 12, "fer", b.entrees.fer || 0);
      pile(ctx, x - 16, y + 16, "charbon", b.entrees.charbon || 0);
      pile(ctx, x + 16, y + 10, "lingots", b.sortie);
    } else if (b.type === "forge") {
      // Étape 8 : l'enclume devant la porte. Quand le forgeron travaille, le marteau tape et des étincelles sautent.
      forme(ctx, [[x + 10, y + 12], [x + 20, y + 12], [x + 18, y + 8], [x + 22, y + 6], [x + 8, y + 6], [x + 12, y + 8]], "#4a4f57");
      if (b.travail) {
        const coup = Math.sin(t * 10) > 0;
        ctx.strokeStyle = "#7a4e22"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 22, y - 2); ctx.lineTo(x + 15, coup ? y + 3 : y - 6); ctx.stroke();
        if (coup) { ctx.fillStyle = "#ffcf2e"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 15 + Math.cos(t * 30 + k * 2) * 5, y + 3 - Math.abs(Math.sin(t * 30 + k)) * 6, 1, 0, TOUR); ctx.fill(); } }
      }
      fumee(ctx, x - 6, y - 40, t);
      pile(ctx, x - 22, y + 12, "lingots", b.entrees.lingots || 0);
      pile(ctx, x - 14, y + 16, "planche", b.entrees.planches || 0);
      pile(ctx, x + 2, y + 16, "outils", b.sortie);
    } else if (b.type === "marche") {
      // Étape 8 : un auvent rayé et des étals avec des fruits, des tonneaux, une balance
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.5;
      ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x - 20 + k * 7, y - 22 + k * 3.5); ctx.lineTo(x - 13 + k * 7, y - 33 + k * 3.5); } ctx.stroke();
      ronds(ctx, [[x + 8, y + 9, 2.4, "#e8402e"], [x + 12, y + 8, 2.4, "#ffcf2e"], [x + 16, y + 10, 2.4, "#4fc25a"]]);
      forme(ctx, [[x - 20, y + 12], [x - 14, y + 15], [x - 14, y + 7], [x - 20, y + 4]], "#9a6a3c");
      // La balance du marchand, qui se balance doucement
      const p = Math.sin(t * 1.5) * 2;
      ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + 2, y - 12); ctx.lineTo(x + 2, y - 2); ctx.moveTo(x - 4, y - 12 + p); ctx.lineTo(x + 8, y - 12 - p); ctx.stroke();
      ctx.fillStyle = "#ffcf2e"; ctx.beginPath(); ctx.arc(x - 4, y - 10 + p, 2, 0, Math.PI); ctx.arc(x + 8, y - 10 - p, 2, 0, Math.PI); ctx.fill();
    } else if (b.type === "mineCharbon" || b.type === "mineFer") {
      // Étape 7 : l'entrée de la mine (des poutres), des rails et un wagonnet de charbon
      forme(ctx, [[x - 14, y - 2], [x - 4, y + 3], [x - 4, y - 9], [x - 14, y - 14]], "#1c1814");
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - 15, y - 1); ctx.lineTo(x - 15, y - 15); ctx.lineTo(x - 3, y - 9); ctx.lineTo(x - 3, y + 4); ctx.stroke();
      ctx.strokeStyle = "#7d8187"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 14, y + 16); ctx.moveTo(x - 9, y + 8); ctx.lineTo(x + 11, y + 18); ctx.stroke();
      forme(ctx, [[x + 2, y + 6], [x + 10, y + 10], [x + 10, y + 5], [x + 2, y + 1]], "#6c5036");
      if (b.type === "mineFer") minerai(ctx, x + 6, y + 3); else charbon(ctx, x + 6, y + 3);
      pile(ctx, x + 14, y + 4, b.type === "mineFer" ? "fer" : "charbon", b.sortie);
      if (b.travail && Math.sin(t * 10) > 0.7) { ctx.fillStyle = "#ffcf2e"; ctx.beginPath(); ctx.arc(x - 9, y - 6, 1.5, 0, TOUR); ctx.fill(); } // la lampe du mineur
    } else if (b.type === "geologue") {
      // Une loupe géante accrochée au mur, et un caillou brillant
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.lineTo(x + 14, y + 4); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 8, y - 5, 4, 0, TOUR); ctx.fillStyle = "rgba(180, 230, 255, .8)"; ctx.fill(); contour(ctx, 1.6);
      rond(ctx, x - 20, y + 10, 3, "#a3a8ad");
      if (Math.sin(t * 3) > 0.6) { ctx.strokeStyle = "#fff6b0"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 23, y + 7); ctx.lineTo(x - 17, y + 7); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x - 20, y + 10); ctx.stroke(); }
    } else if (b.type === "chasseur") {
      pile(ctx, x + 14, y + 9, "viande", b.sortie);
      // Des bois de cerf au-dessus de la porte
      ctx.strokeStyle = "#e9dcc0"; ctx.lineWidth = 1.8; ctx.lineCap = "round";
      const bx = x + 4, by = y - m.h - 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 6, by - 7); ctx.moveTo(bx - 3, by - 3.5); ctx.lineTo(bx - 7, by - 2); ctx.moveTo(bx, by); ctx.lineTo(bx + 6, by - 7); ctx.moveTo(bx + 3, by - 3.5); ctx.lineTo(bx + 7, by - 2); ctx.stroke();
    }
    // Un petit panneau avec l'emoji du métier, au-dessus de la porte
    if (b.type !== "entrepot") enseigne(ctx, x - m.a * 0.45, y - 8 - m.h * 0.2, Village.Batiments.TYPES[b.type].emoji);
    if (travaille && b.type === "carriere") poussiere(ctx, x, y, t);
    if (!b.relie) panneauSansRoute(ctx, x, y - m.h - m.toit - 16, t);
    // Étape 4 : l'ouvrier a trop faim, ou il est parti (la cabane est vide)
    else if (b.ouvrier && b.ouvrier.affame) bulleDePensee(ctx, x, y - m.h - m.toit - 18, t, "🍽️");
    else if (!b.ouvrier && Village.Batiments.TYPES[b.type].metier) bulleDePensee(ctx, x, y - m.h - m.toit - 18, t, Village.monde && !Village.Logement.placeLibre(Village.monde) ? "🛏️" : "vide"); // étape 8 : 🛏️ pas de logement
    // Étape 5 : le bâtiment qu'on est en train de déplacer clignote
    if (Village.monde && Village.monde.aDeplacer === b) {
      ctx.strokeStyle = "rgba(255, 226, 122," + (0.5 + 0.5 * Math.sin(t * 8)) + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - m.a - 4, y); ctx.lineTo(x, y + m.a / 2 + 2); ctx.lineTo(x + m.a + 4, y); ctx.lineTo(x, y - m.a / 2 - 2); ctx.closePath(); ctx.stroke();
    }
  }

  // Une bulle de pensée, comme dans les bandes dessinées
  function bulleDePensee(ctx, x, y, t, contenu) {
    const s = Math.sin(t * 2) * 1.5;
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#5a4220"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - 5, y + 13, 2, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 2, y + 8, 3, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 2, y - 3 + s, contenu === "vide" ? 16 : 11, 9, 0, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.font = (contenu === "vide" ? "bold 9px 'Trebuchet MS', sans-serif" : "11px sans-serif");
    ctx.fillStyle = "#c0392b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(contenu, x + 2, y - 2.5 + s);
    ctx.textAlign = "left";
  }

  // ✍️ Pas de route jusqu'à l'entrepôt : un panneau qui saute, au-dessus du toit (un chemin barré).
  function panneauSansRoute(ctx, x, y, t) {
    const saut = Math.abs(Math.sin(t * 3)) * 4;
    ctx.fillStyle = "#fff4f0";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 14, y - 14 - saut, 28, 22, 6); else ctx.rect(x - 14, y - 14 - saut, 28, 22);
    ctx.fill(); ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 2; ctx.stroke();
    iconeRoute(ctx, x, y - 3 - saut, 0.55);
    ctx.strokeStyle = "#e0301e"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 7, y - 10 - saut); ctx.lineTo(x + 7, y + 4 - saut); ctx.moveTo(x + 7, y - 10 - saut); ctx.lineTo(x - 7, y + 4 - saut); ctx.stroke();
  }

  // Une petite icône de chemin de terre qui serpente (il n'existe pas d'emoji « chemin »).
  function iconeRoute(ctx, x, y, e, pierre) {
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
    ctx.lineCap = "round";
    const chemin = () => { ctx.beginPath(); ctx.moveTo(-12, 14); ctx.bezierCurveTo(-14, 2, 12, 4, 6, -6); ctx.bezierCurveTo(2, -12, 8, -14, 10, -16); };
    chemin(); ctx.strokeStyle = pierre ? "#5e6268" : "#9b7440"; ctx.lineWidth = 10; ctx.stroke();
    chemin(); ctx.strokeStyle = pierre ? "#b9bdc2" : "#e2c38c"; ctx.lineWidth = 6.5; ctx.stroke();
    if (pierre) { chemin(); ctx.setLineDash([3, 3]); ctx.strokeStyle = "#7d8187"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); } // les pavés
    ctx.restore();
  }

  function enseigne(ctx, x, y, emoji) {
    ctx.fillStyle = "#f6e7c4";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 7, y - 14, 14, 12, 3); else ctx.rect(x - 7, y - 14, 14, 12);
    ctx.fill(); contour(ctx, 1.2);
    ctx.font = "9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, x, y - 7.5);
    ctx.textAlign = "left";
  }

  function drapeau(ctx, x, y, t, couleur) {
    ctx.strokeStyle = CONTOUR; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k <= 4; k++) ctx.lineTo(x + k * 4, y + Math.sin(t * 6 + k) * 1.5);
    for (let k = 4; k >= 0; k--) ctx.lineTo(x + k * 4, y + 8 + Math.sin(t * 6 + k) * 1.5);
    ctx.closePath(); ctx.fillStyle = couleur; ctx.fill(); contour(ctx, 1.2);
  }

  function sciure(ctx, x, y, t) {
    for (let k = 0; k < 5; k++) {
      const p = (t * 1.5 + k / 5) % 1;
      ctx.fillStyle = "rgba(230, 190, 120," + (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x + 4 + p * 14, y + 4 + p * 10 - Math.sin(p * 3) * 8, 1.6, 0, TOUR); ctx.fill();
    }
  }

  // Étape 8 : de la fumée qui monte d'une cheminée (des ronds gris qui grossissent et s'effacent)
  function fumee(ctx, x, y, t) {
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.5 + k / 4) % 1;
      ctx.fillStyle = "rgba(225, 225, 230," + 0.55 * (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x + Math.sin(p * 4 + k) * 3 + p * 6, y - p * 22, 2.5 + p * 4, 0, TOUR); ctx.fill();
    }
  }
  // Plusieurs petits ronds d'un coup : [x, y, rayon, couleur]
  function ronds(ctx, liste) { for (const [rx, ry, r, c] of liste) rond(ctx, rx, ry, r, c); }

  function poussiere(ctx, x, y, t) {
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.8 + k / 4) % 1;
      ctx.fillStyle = "rgba(200, 200, 195," + 0.5 * (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x - 26 - p * 6, y - 4 - p * 20, 3 + p * 5, 0, TOUR); ctx.fill();
    }
  }

  // Un chantier : les murs montent petit à petit, avec des poteaux et une barre de progression.
  function chantier(ctx, b, x, y, m, t) {
    const a = m.a, bb = a / 2;
    forme(ctx, [[x - a, y], [x, y + bb], [x + a, y], [x, y - bb]], "#cdbb94"); // la dalle
    if (b.progres > 0.05) boite(ctx, x, y, m, b.progres, false);
    // Les 4 poteaux de l'échafaudage
    ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const [px, py] of [[x - a, y], [x, y + bb], [x + a, y], [x, y - bb]]) { ctx.moveTo(px, py); ctx.lineTo(px, py - m.h - 6); }
    ctx.stroke();
    if (vue.fin) {
      // Étape 9 : un vrai échafaudage : des croix pour le tenir, une plateforme qui monte avec les murs, une échelle
      ctx.strokeStyle = "rgba(138, 90, 43, .8)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x, y + bb - m.h - 6); ctx.moveTo(x, y + bb); ctx.lineTo(x - a, y - m.h - 6);
      ctx.moveTo(x, y + bb); ctx.lineTo(x + a, y - m.h - 6); ctx.moveTo(x + a, y); ctx.lineTo(x, y + bb - m.h - 6); ctx.stroke();
      const hp = Math.max(4, m.h * b.progres);
      forme(ctx, [[x - a - 2, y - hp], [x, y + bb - hp + 2], [x, y + bb - hp - 1], [x - a - 2, y - hp - 3]], "#d9a866");
      forme(ctx, [[x, y + bb - hp + 2], [x + a + 2, y - hp], [x + a + 2, y - hp - 3], [x, y + bb - hp - 1]], "#c9965a");
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.2; ctx.beginPath(); // l'échelle
      ctx.moveTo(x - a * 0.6, y + 8); ctx.lineTo(x - a * 0.7, y - hp); ctx.moveTo(x - a * 0.6 + 4, y + 10); ctx.lineTo(x - a * 0.7 + 4, y - hp + 2);
      for (let k = 1; k * 4 < hp + 8; k++) { const yy = y + 8 - k * 4; ctx.moveTo(x - a * 0.6 - k * 0.3, yy); ctx.lineTo(x - a * 0.6 + 4 - k * 0.3, yy + 2); }
      ctx.stroke();
      // Un peu de poussière qui s'envole quand ça avance
      if (b.relie && b.progres < 1 && b.progres > 0.02) for (let k = 0; k < 3; k++) { const p = (t * 0.7 + k / 3) % 1; ctx.fillStyle = "rgba(220, 205, 175," + 0.5 * (1 - p) + ")"; ctx.beginPath(); ctx.arc(x + 8 - p * 10 + k * 5, y + 4 - p * 14, 2 + p * 3, 0, TOUR); ctx.fill(); }
    }
    // Les matériaux arrivés (apportés par les porteurs)
    pile(ctx, x + a * 0.7, y + 10, "planche", b.livre.planches || 0);
    pile(ctx, x - a * 0.8, y + 8, "pierre", b.livre.pierres || 0);
    if (!b.relie) panneauSansRoute(ctx, x, y - m.h - 34, t);
    // La barre de progression
    const l = 36, bx = x - l / 2, by = y - m.h - 22;
    ctx.fillStyle = "rgba(255,250,235,.95)";
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - 2, by - 2, l + 4, 9, 4); else ctx.rect(bx - 2, by - 2, l + 4, 9);
    ctx.fill(); contour(ctx, 1.5);
    ctx.fillStyle = "#4fc25a";
    ctx.fillRect(bx, by, l * b.progres, 5);
    // Un marteau qui tape
    const coup = Math.abs(Math.sin(t * 8));
    ctx.save(); ctx.translate(x - 4, y - m.h * b.progres - 2); ctx.rotate(-0.8 + coup * 0.9);
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
    ctx.fillStyle = "#7a7f88"; ctx.fillRect(-3, -12, 6, 4);
    ctx.restore();
  }

  // ---------------------------------------------------------------- un ouvrier
  const TENUES = {
    bucheron: { habit: "#d8433a", chapeau: "#b52f27", outil: "hache" },
    forestier: { habit: "#4f9e3e", chapeau: "#3a7a2c", outil: "pelle" },
    carriere: { habit: "#5a7bb5", chapeau: "#f2c230", outil: "pioche" },
    pecheur: { habit: "#f2c230", chapeau: "#e0a81e", outil: "canne" }, // le ciré jaune du pêcheur
    chasseur: { habit: "#7a5a2e", chapeau: "#4f6b2a", outil: "arc" },
    geologue: { habit: "#8a5ab0", chapeau: "#e0a81e", outil: "marteau" }, // étape 5 : le petit marteau du géologue
  };

  function dessinerOuvrier(ctx, type, o, x, y, t, hiver) {
    const tenue = TENUES[type];
    const marche = o.etat === "aller" || o.etat === "revenir";
    const travaille = o.etat === "travailler";
    const pas = marche ? Math.sin(t * 14) : 0;
    const saut = marche ? Math.abs(Math.sin(t * 14)) * 1.5 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.direction, 1); // il regarde à gauche ou à droite
    // L'ombre
    ctx.fillStyle = "rgba(20, 40, 10, .25)";
    ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.5, 0, 0, TOUR); ctx.fill();
    ctx.translate(0, -saut);
    // Les jambes
    ctx.strokeStyle = "#3b3f5a"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2 + pas * 2.5, 0); ctx.moveTo(2, -6); ctx.lineTo(2 - pas * 2.5, 0); ctx.stroke();
    // Le corps (un œuf) et la tête
    ctx.beginPath(); ctx.ellipse(0, -10, 4.8, 6, 0, 0, TOUR); ctx.fillStyle = tenue.habit; ctx.fill(); contour(ctx, 1.5);
    rond(ctx, 0, -19, 4.3, "#f2c79b");
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(1.8, -19.5, 0.8, 0, TOUR); ctx.fill(); // l'œil
    // Le chapeau (un casque jaune pour le carrier)
    ctx.beginPath(); ctx.ellipse(0, -21.5, 4.8, 2.6, 0, Math.PI, TOUR); ctx.fillStyle = tenue.chapeau; ctx.fill(); contour(ctx, 1.2);
    // ❄️ En hiver, une écharpe rouge
    if (hiver) { ctx.fillStyle = "#e8402e"; ctx.fillRect(-4, -15.5, 8, 2.5); ctx.fillRect(-4, -15, 2.5, 6); }
    if (tenue.outil === "canne" || tenue.outil === "arc") {
      // La canne à pêche (tendue vers l'eau quand il pêche) ou l'arc
      ctx.save(); ctx.translate(3, -12);
      if (tenue.outil === "canne") {
        ctx.rotate(travaille ? 0.9 : 0.3);
        ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.stroke();
      } else {
        // Étape 5 : il tend l'arc pendant 3 s (la corde recule), puis il lâche la flèche.
        const m = o.minuteur, tir = travaille && m > 1 ? Math.min(1, (C_.ouvriers.chasser - m) / 2.5) : 0;
        const vibre = travaille && m <= 1 && m > 0.7 ? Math.sin(t * 60) * 0.8 : 0; // la corde vibre après le tir
        ctx.rotate(travaille ? -0.15 : 0.4);
        ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(4, -3, 7.5, -1.25 - tir * 0.15, 1.25 + tir * 0.15); ctx.stroke(); // le bois de l'arc (il se plie)
        const hx = 4 + Math.cos(-1.25) * 7.5, hy = -3 + Math.sin(-1.25) * 7.5, bx = 4 + Math.cos(1.25) * 7.5, by = -3 + Math.sin(1.25) * 7.5;
        const cx = (hx + bx) / 2 - tir * 6 + vibre;
        ctx.strokeStyle = "#f3ead8"; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(cx, -3); ctx.lineTo(bx, by); ctx.stroke(); // la corde
        if (travaille && m > 1) {
          // La flèche encochée, prête à partir
          ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(cx, -3); ctx.lineTo(cx + 15, -3); ctx.stroke();
          ctx.fillStyle = "#c9ccd1"; ctx.beginPath(); ctx.moveTo(cx + 17, -3); ctx.lineTo(cx + 14, -4.6); ctx.lineTo(cx + 14, -1.4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.moveTo(cx, -3); ctx.lineTo(cx - 2, -5); ctx.lineTo(cx + 2, -3); ctx.lineTo(cx - 2, -1); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    } else {
    // L'outil, qui frappe quand il travaille
    const angle = travaille ? -1.2 + Math.abs(Math.sin(t * 6)) * 1.8 : 0.5;
    ctx.save(); ctx.translate(3, -11); ctx.rotate(angle);
    ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -11); ctx.stroke();
    ctx.fillStyle = "#c9ccd1"; ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1;
    ctx.beginPath();
    if (tenue.outil === "hache") { ctx.moveTo(0, -11); ctx.lineTo(4.5, -12); ctx.lineTo(4.5, -7); ctx.lineTo(0, -8); }
    else if (tenue.outil === "marteau") { ctx.moveTo(-3, -11); ctx.lineTo(3, -11); ctx.lineTo(3, -14); ctx.lineTo(-3, -14); }
    else if (tenue.outil === "pelle") { ctx.moveTo(-2.5, -11); ctx.lineTo(2.5, -11); ctx.lineTo(1.5, -16); ctx.lineTo(-1.5, -16); }
    else { ctx.moveTo(-5, -10); ctx.quadraticCurveTo(0, -14, 5, -10); ctx.lineTo(0, -12); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    }
    // Ce qu'il rapporte, sur l'épaule
    if (o.porte === "troncs") rondin(ctx, -1, -17, 0.35); else if (o.porte === "pierres") {
      rond(ctx, -1, -24.5, 3.6, "#a3a8ad");
    } else if (o.porte === "poissons") poisson(ctx, -4, -12);
    else if (o.porte === "viande") viande(ctx, -4, -12);
    ctx.restore();
  }

  // ---------------------------------------------------------------- un animal (étapes 4 et 5)
  // Étape 5 : redessinés pour être plus jolis. Le cerf a un ventre clair, des taches de faon pour
  // les plus jeunes, des bois ramifiés pour les mâles. Le lapin a de grandes oreilles roses et une queue
  // en pompon, et il s'écrase un peu quand il retombe d'un bond. En hiver, le lapin devient blanc.
  // `chute` (de 0 à 1) : l'animal touché par une flèche bascule sur le côté.
  function dessinerAnimal(ctx, a, x, y, t, hiver, chute) {
    const marche = a.etat === "promener" && !chute;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(a.direction || 1, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .22)";
    const grand = a.sorte === "cerf" || a.sorte === "sanglier" || a.sorte === "bouquetin";
    ctx.beginPath(); ctx.ellipse(0, 1, grand ? 10 : 5.5, 3, 0, 0, TOUR); ctx.fill();
    if (chute) { ctx.translate(0, -2); ctx.rotate(chute * 1.45); ctx.translate(0, 2); }
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (a.sorte === "cerf") cerf(ctx, a, t, marche);
    else if (a.sorte === "sanglier") sanglier(ctx, a, t, marche);
    else if (a.sorte === "canard") canard(ctx, a, t, marche);
    else if (a.sorte === "bouquetin") bouquetin(ctx, a, t, marche, hiver);
    else lapin(ctx, a, t, marche, hiver);
    // La flèche plantée
    if (chute) {
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.3;
      const h = grand ? -12 : -6;
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(-7, h - 6); ctx.stroke();
      ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.arc(-7, h - 6, 1.6, 0, TOUR); ctx.fill();
    }
    ctx.restore();
  }

  function cerf(ctx, a, t, marche) {
    const male = a.numero % 3 !== 0, faon = a.numero % 5 === 0;
    const e = faon ? 0.75 : 1;
    ctx.scale(e, e);
    const pas = marche ? Math.sin(t * 9 + a.numero) : 0;
    // Les pattes (fines, avec un sabot foncé), qui avancent par paires
    const patte = (px, decal) => {
      ctx.strokeStyle = "#7a4f28"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, -9); ctx.quadraticCurveTo(px + decal * 1.5, -4, px + decal * 2.5, 0); ctx.stroke();
      ctx.fillStyle = "#3b2614"; ctx.beginPath(); ctx.arc(px + decal * 2.5, 0, 1.1, 0, TOUR); ctx.fill();
    };
    patte(-6, pas); patte(-3.5, -pas); patte(5, -pas); patte(7.5, pas);
    // Le corps : une forme de haricot, plus clair en dessous
    ctx.beginPath();
    ctx.moveTo(-9, -11); ctx.bezierCurveTo(-9, -17, 6, -18, 9, -13); ctx.bezierCurveTo(11, -9, 7, -7, 0, -7.5); ctx.bezierCurveTo(-6, -7.5, -9.5, -8, -9, -11);
    ctx.closePath(); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.4);
    ctx.beginPath(); ctx.ellipse(0, -8.8, 6.5, 1.8, 0, 0, Math.PI); ctx.fillStyle = "#ecd4b0"; ctx.fill(); // le ventre
    if (faon) { ctx.fillStyle = "#f6ead4"; for (const [sx, sy] of [[-4, -13], [0, -14], [3, -12], [-1, -11], [5, -14]]) { ctx.beginPath(); ctx.arc(sx, sy, 0.9, 0, TOUR); ctx.fill(); } }
    // La queue blanche
    ctx.fillStyle = "#f6ead4"; ctx.beginPath(); ctx.ellipse(-9.5, -12.5, 1.6, 2.2, 0.4, 0, TOUR); ctx.fill(); contour(ctx, 1);
    // Le cou et la tête (la tête se baisse quand il broute)
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.3 + a.numero)) * 7;
    ctx.save(); ctx.translate(7, -14); ctx.rotate(baisse * 0.09);
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(1.5, -6); ctx.lineTo(4.5, -6); ctx.lineTo(3.5, 3); ctx.closePath(); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(5, -7.5, 4, 2.6, 0.35, 0, TOUR); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.2); // la tête
    ctx.fillStyle = "#3b2614"; ctx.beginPath(); ctx.arc(8.6, -6.2, 0.9, 0, TOUR); ctx.fill(); // la truffe
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(4.6, -8.4, 0.9, 0, TOUR); ctx.fill(); // l'œil
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(4.9, -8.7, 0.35, 0, TOUR); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.8, -10, 1.3, 2.6, -0.6, 0, TOUR); ctx.fillStyle = "#a8743f"; ctx.fill(); contour(ctx, 1); // l'oreille
    if (male && !faon) {
      // Les bois ramifiés
      ctx.strokeStyle = "#e9dcc0"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3.5, -10); ctx.quadraticCurveTo(2, -15, 4, -19); ctx.moveTo(2.6, -14); ctx.lineTo(0, -16); ctx.moveTo(3.3, -17); ctx.lineTo(6, -19);
      ctx.moveTo(5, -10); ctx.quadraticCurveTo(7, -14, 6.5, -17); ctx.moveTo(6.4, -13.5); ctx.lineTo(9, -15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 🐗 Le sanglier : trapu, poilu, brun foncé, avec son groin rose et ses petites défenses blanches.
  function sanglier(ctx, a, t, marche) {
    const pas = marche ? Math.sin(t * 11 + a.numero) : 0;
    const marcassin = a.numero % 4 === 0;
    if (marcassin) ctx.scale(0.65, 0.65);
    ctx.strokeStyle = "#3b2a1c"; ctx.lineWidth = 2.4;
    for (const [px, d] of [[-5, pas], [-2, -pas], [4, -pas], [6.5, pas]]) { ctx.beginPath(); ctx.moveTo(px, -6); ctx.lineTo(px + d * 1.5, 0); ctx.stroke(); }
    // Le corps, plus haut devant (le garrot)
    ctx.beginPath();
    ctx.moveTo(-9, -7); ctx.bezierCurveTo(-10, -14, 0, -17, 6, -15); ctx.bezierCurveTo(10, -13, 10, -7, 6, -5); ctx.lineTo(-6, -5); ctx.closePath();
    ctx.fillStyle = marcassin ? "#9a6a3e" : "#5a4030"; ctx.fill(); contour(ctx, 1.4);
    if (marcassin) { ctx.strokeStyle = "#e9c99a"; ctx.lineWidth = 1; for (const yy of [-12, -9.5]) { ctx.beginPath(); ctx.moveTo(-7, yy); ctx.lineTo(5, yy - 1); ctx.stroke(); } } // les rayures du marcassin
    // La crinière hérissée sur le dos
    ctx.strokeStyle = "#2e2016"; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const bx = -5 + k * 2; ctx.moveTo(bx, -15.5 + Math.abs(k - 3) * 0.4); ctx.lineTo(bx - 0.6, -18 + Math.abs(k - 3) * 0.5); } ctx.stroke();
    // La tête, le groin, l'oreille, l'œil, la défense
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.5 + a.numero)) * 3;
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(13, -9 + baisse); ctx.lineTo(13, -6 + baisse); ctx.lineTo(6, -6); ctx.closePath(); ctx.fillStyle = marcassin ? "#9a6a3e" : "#5a4030"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(13.3, -7.5 + baisse, 1.2, 1.8, 0, 0, TOUR); ctx.fillStyle = "#e3a3a0"; ctx.fill(); contour(ctx, 0.8);
    ctx.beginPath(); ctx.moveTo(7, -14); ctx.lineTo(6, -17.5); ctx.lineTo(9, -14.5); ctx.closePath(); ctx.fillStyle = "#3b2a1c"; ctx.fill();
    ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.arc(9.5, -11 + baisse * 0.6, 0.8, 0, TOUR); ctx.fill();
    if (!marcassin) { ctx.strokeStyle = "#f6f0e2"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -6 + baisse); ctx.quadraticCurveTo(13.5, -5 + baisse, 13, -8 + baisse); ctx.stroke(); }
    // La petite queue en tire-bouchon
    ctx.strokeStyle = "#3b2a1c"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-10, -10, 1.5, 0, Math.PI * 1.5); ctx.stroke();
  }

  // 🦆 Le canard : un colvert, tête verte, collier blanc, bec jaune ; il se dandine en marchant.
  function canard(ctx, a, t, marche) {
    const dandine = marche ? Math.sin(t * 10 + a.numero) * 0.12 : 0;
    const femelle = a.numero % 2 === 0;
    ctx.rotate(dandine);
    ctx.strokeStyle = "#e88a1f"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-1, -2); ctx.lineTo(-1, 0); ctx.moveTo(1.5, -2); ctx.lineTo(1.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -5, 5.5, 3.6, -0.1, 0, TOUR); ctx.fillStyle = femelle ? "#a8835a" : "#b9b2a6"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(-0.5, -5.5, 3, 1.8, -0.2, 0, TOUR); ctx.fillStyle = femelle ? "#8c6a46" : "#7d6a58"; ctx.fill(); // l'aile
    ctx.fillStyle = "#3e6fd1"; ctx.fillRect(-2, -5.6, 2.4, 1); // la petite tache bleue de l'aile
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-7.5, -7); ctx.lineTo(-5.5, -4); ctx.closePath(); ctx.fillStyle = "#3b2614"; ctx.fill(); // la queue
    ctx.beginPath(); ctx.arc(4.2, -9.5, 2.4, 0, TOUR); ctx.fillStyle = femelle ? "#a8835a" : "#2f8a4a"; ctx.fill(); contour(ctx, 1); // la tête
    if (!femelle) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(4, -8.3, 2.2, 0.3, 2.6); ctx.stroke(); } // le collier
    ctx.beginPath(); ctx.moveTo(6.2, -10); ctx.lineTo(8.8, -9.3); ctx.lineTo(6.3, -8.6); ctx.closePath(); ctx.fillStyle = "#f2c230"; ctx.fill(); contour(ctx, 0.7);
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(5, -10.2, 0.6, 0, TOUR); ctx.fill();
  }

  // 🐐 Le bouquetin : pelage gris-brun, ventre clair, petite barbe, et de grandes cornes recourbées.
  function bouquetin(ctx, a, t, marche, hiver) {
    const pas = marche ? Math.sin(t * 10 + a.numero) * 2 : 0;
    const pelage = hiver ? "#cfc6b8" : "#9c8a72";
    ctx.strokeStyle = "#5e5040"; ctx.lineWidth = 1.8;
    for (const [px, d] of [[-5, pas], [-2.5, -pas], [3.5, -pas], [6, pas]]) { ctx.beginPath(); ctx.moveTo(px, -8); ctx.lineTo(px + d, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -10.5, 7.5, 4, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.3);
    ctx.beginPath(); ctx.ellipse(0, -8, 5, 1.5, 0, 0, Math.PI); ctx.fillStyle = "#e9dfcc"; ctx.fill();
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.4 + a.numero)) * 4;
    ctx.save(); ctx.translate(6, -13); ctx.rotate(baisse * 0.08);
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(1, -4); ctx.lineTo(4, -4); ctx.lineTo(3, 2); ctx.closePath(); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.1);
    ctx.beginPath(); ctx.ellipse(4.2, -5, 3, 2.1, 0.4, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.1);
    ctx.strokeStyle = "#e9dfcc"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5.5, -3.4); ctx.lineTo(5.2, -1.2); ctx.stroke(); // la barbiche
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(4.2, -5.8, 0.7, 0, TOUR); ctx.fill();
    // Les grandes cornes en arc, avec leurs anneaux
    ctx.strokeStyle = "#6e5e48"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(2.5, -6.5); ctx.bezierCurveTo(0, -12, -6, -12, -6, -6); ctx.stroke();
    ctx.strokeStyle = "rgba(240, 230, 210, .6)"; ctx.lineWidth = 0.6;
    ctx.beginPath(); for (const q of [0.25, 0.45, 0.65]) { const bx = 2.5 - q * 9, by = -6.5 - Math.sin(q * Math.PI) * 5; ctx.moveTo(bx - 1, by - 0.5); ctx.lineTo(bx + 1, by + 0.5); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#5e5040"; ctx.beginPath(); ctx.ellipse(-7.5, -12, 1.2, 1.6, 0.4, 0, TOUR); ctx.fill(); // la queue
  }

  function lapin(ctx, a, t, marche, hiver) {
    const phase = (t * 2.2 + a.numero * 0.37) % 1;
    const saut = marche ? Math.sin(phase * Math.PI) * 5 : 0;
    const ecrase = marche && phase > 0.9 ? 0.85 : 1; // il s'écrase un peu en retombant
    const pelage = hiver ? "#f4f6fa" : "#a8998a", ombre2 = hiver ? "#dfe4ec" : "#8c7e70";
    ctx.translate(0, -saut);
    ctx.scale(1 / ecrase, ecrase);
    // Le corps tout rond
    ctx.beginPath(); ctx.ellipse(0, -4.5, 5, 4, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(-1, -2, 3, 1.4, 0, 0, Math.PI); ctx.fillStyle = ombre2; ctx.fill(); // la patte arrière
    // La tête et les grandes oreilles
    ctx.beginPath(); ctx.arc(4.5, -8, 3, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.2);
    const oreille = marche ? -0.35 : Math.sin(t * 3 + a.numero) * 0.12;
    for (const [ox, rot] of [[3.6, -0.25 + oreille], [5.4, 0.15 + oreille]]) {
      ctx.save(); ctx.translate(ox, -10.5); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, -3.5, 1.3, 3.8, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1);
      ctx.beginPath(); ctx.ellipse(0, -3.4, 0.6, 2.7, 0, 0, TOUR); ctx.fillStyle = "#f2a6b8"; ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(5.6, -8.5, 0.75, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#f2a6b8"; ctx.beginPath(); ctx.arc(7.4, -7.6, 0.7, 0, TOUR); ctx.fill(); // le nez
    // La queue en pompon
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-5, -5.5, 2, 0, TOUR); ctx.fill(); contour(ctx, 0.8);
  }

  // ---------------------------------------------------------------- un porteur
  // Étape 9 : un objet tout seul (dans une charrette, une brouette, ou dans les bras)
  function objetPorte(ctx, quoi, x, y) {
    if (quoi === "poissons") poisson(ctx, x, y);
    else if (quoi === "viande") viande(ctx, x, y);
    else if (quoi === "troncs") { ctx.save(); ctx.translate(x, y); ctx.scale(0.6, 0.8); rondin(ctx, 0, 0, 0); ctx.restore(); }
    else if (quoi === "planches") planche(ctx, x, y, 14);
    else if (quoi === "charbon") charbon(ctx, x, y);
    else if (quoi === "fer") minerai(ctx, x, y);
    else if (quoi === "lingots") lingot(ctx, x, y);
    else if (quoi === "outils") outil(ctx, x, y);
    else caillou(ctx, x, y);
  }
  // Étape 9 : une pierre taillée, grise avec un reflet
  function caillou(ctx, x, y, v) {
    const d = ((v || 0) % 3) * 0.4;
    forme(ctx, [[x - 3.6, y + 1.5], [x - 3, y - 2], [x + 0.5, y - 3.3 + d], [x + 3.6, y - 1.2], [x + 3.2, y + 2], [x, y + 2.8]], ["#a3a8ad", "#9a9c9f", "#b0b3b6"][(v || 0) % 3]);
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.moveTo(x - 2.4, y - 1.4); ctx.lineTo(x + 0.4, y - 2.5); ctx.lineTo(x - 0.6, y - 0.5); ctx.closePath(); ctx.fill();
  }

  // Les choses lourdes vont dans la brouette (étape 9, avec la recherche « Brouettes »)
  const LOURD = { pierres: true, charbon: true, fer: true, lingots: true };
  // Comment on porte chaque chose sans brouette ni charrette : sur l'épaule, dans une hotte sur le dos, ou dans les bras
  const FACON = { troncs: "epaule", planches: "epaule", outils: "epaule", poissons: "hotte", viande: "hotte", pierres: "hotte", charbon: "sac", fer: "sac", lingots: "bras" };

  // Un petit bonhomme en tunique bleue : le porteur.
  // Étape 9 : ✍️ il porte mieux ! Les longues choses sur l'épaule, le reste dans une hotte ou un sac sur
  // le dos ; avec la recherche « Brouettes », il pousse une brouette pour ce qui est lourd ; avec
  // « Ânes et charrettes », il mène un âne qui tire une charrette (jusqu'à 3 objets). La nuit : une lanterne.
  function dessinerPorteur(ctx, p, x, y, t) {
    const monde = Village.monde, R = Village.Recherches;
    const avecAne = monde && R.bonus(monde, "chargement") > 1;
    const avecBrouette = !avecAne && monde && R.a(monde, "brouette") && p.porte && LOURD[p.porte];
    const pas = Math.sin(t * 15 + p.numero), saut = Math.abs(pas) * 1.5;
    const dir = p.direction;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    // L'âne et la charrette marchent derrière le porteur
    if (avecAne) {
      ctx.fillStyle = "rgba(20, 40, 10, .22)"; ctx.beginPath(); ctx.ellipse(-26, 1, 22, 3.2, 0, 0, TOUR); ctx.fill();
      charrette(ctx, -44, 0, t, p.porte, p.porte ? Math.min(3, p.nombre || 1) : 0, true);
      ane(ctx, -24, 0, t, true);
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-8, -16); ctx.quadraticCurveTo(-3, -9, 5, -13); ctx.stroke(); // la longe, de la tête de l'âne à la main
    }
    ctx.fillStyle = "rgba(20, 40, 10, .25)";
    ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.5, 0, 0, TOUR); ctx.fill();
    if (avecBrouette) brouette(ctx, 9, 0, t, p.porte, true);
    ctx.translate(0, -saut);
    const facon = avecAne || avecBrouette || !p.porte ? null : FACON[p.porte] || "hotte";
    // La hotte (ou le sac) se voit derrière le dos
    if (facon === "hotte") {
      forme(ctx, [[-8, -20], [-2, -20], [-3, -9], [-7, -9]], "#b98a55");
      ctx.strokeStyle = "rgba(60,35,10,.5)"; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(-7.7 + k * 0.1, -20 + k * 2.8); ctx.lineTo(-2.3 - k * 0.2, -20 + k * 2.8); } ctx.stroke();
      objetPorte(ctx, p.porte, -6, -23); objetPorte(ctx, p.porte, -4.5, -21.5);
    } else if (facon === "sac") {
      ctx.beginPath(); ctx.ellipse(-5, -15, 4.2, 5.5, -0.2, 0, TOUR); ctx.fillStyle = "#c9b58a"; ctx.fill(); contour(ctx, 1.2);
      ctx.strokeStyle = "#7a5a30"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6.5, -20); ctx.lineTo(-3, -20.5); ctx.stroke();
    }
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2 + pas * 2.5, 0); ctx.moveTo(2, -6); ctx.lineTo(2 - pas * 2.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -10, 4.8, 6, 0, 0, TOUR); ctx.fillStyle = "#4a90d9"; ctx.fill(); contour(ctx, 1.5);
    ctx.fillStyle = "#c98b4f"; ctx.fillRect(-4.5, -9, 9, 2); // la ceinture
    if (vue.fin) { ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.ellipse(-1.5, -12, 1.6, 3, 0, 0, TOUR); ctx.fill(); } // un reflet sur la tunique
    rond(ctx, 0, -19, 4.3, "#f2c79b");
    // Un bonnet
    ctx.beginPath(); ctx.arc(0, -20, 4.4, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "#2f6db5"; ctx.fill(); contour(ctx, 1.2);
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(1.8, -19, 0.8, 0, TOUR); ctx.fill();
    // Les bras
    ctx.strokeStyle = "#f2c79b"; ctx.lineWidth = 2;
    ctx.beginPath();
    if (facon === "epaule") { ctx.moveTo(3, -13); ctx.lineTo(4, -21); ctx.moveTo(-3, -13); ctx.lineTo(-4 - pas, -7); }
    else if (facon === "bras") { ctx.moveTo(-3, -13); ctx.lineTo(4, -11); ctx.moveTo(3, -13); ctx.lineTo(6, -11); }
    else if (avecBrouette) { ctx.moveTo(-1, -13); ctx.lineTo(4, -9); ctx.moveTo(2, -13); ctx.lineTo(5, -9); }
    else if (facon === "hotte" || facon === "sac") { ctx.moveTo(-3, -13); ctx.lineTo(-3.5, -17); ctx.moveTo(3, -13); ctx.lineTo(4 + pas, -7); } // une main tient la sangle
    else { ctx.moveTo(-4, -12); ctx.lineTo(-5 - pas, -6); ctx.moveTo(4, -12); ctx.lineTo(avecAne ? 6 : 5 + pas, avecAne ? -14 : -6); }
    ctx.stroke();
    if (facon === "epaule") { // une longue chose posée en travers de l'épaule
      if (p.porte === "planches") { ctx.save(); ctx.translate(2, -23); ctx.rotate(-0.35); planche(ctx, 0, 0, 24); planche(ctx, 1, -2, 24); ctx.restore(); }
      else if (p.porte === "troncs") { ctx.save(); ctx.translate(1, -23); ctx.rotate(-0.3); rondin(ctx, 0, 0, 0); ctx.restore(); }
      else { ctx.save(); ctx.translate(3, -22); ctx.rotate(-0.6); outil(ctx, 0, 0); ctx.restore(); }
    } else if (facon === "bras") { lingot(ctx, 5, -12); lingot(ctx, 5, -14); }
    // La nuit : une lanterne au bout du bras
    if (vue.noirceur > 0.25 && !avecBrouette) {
      const lx = facon === "epaule" ? -5 : 6, ly = facon === "epaule" ? -5 : -6;
      forme(ctx, [[lx - 1.8, ly], [lx + 1.8, ly], [lx + 1.5, ly + 4.5], [lx - 1.5, ly + 4.5]], "#ffd04a");
      lumiere(x + lx * dir, y - saut + ly + 2, 26, "orange", 0.9);
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- une jeune pousse
  // p : de 0 (on vient de la planter) à 1 (elle va devenir un arbre)
  function dessinerPousse(ctx, x, y, p, t) {
    const e = 0.35 + p * 0.65;
    const vent = Math.sin(t * 2.5 + x * 0.1) * 0.08;
    ctx.save(); ctx.translate(x, y + 2); ctx.rotate(vent); ctx.scale(e, e);
    ctx.fillStyle = "rgba(20, 40, 10, .2)"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#7a5a2b"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2, 0, 0, TOUR); ctx.fill(); // la terre retournée
    ctx.strokeStyle = "#4b7a28"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();
    ctx.lineWidth = 1.2;
    for (const [dx, dy, s] of [[-6, -8, -1], [6, -11, 1], [0, -16, 0]]) {
      ctx.beginPath(); ctx.ellipse(dx * 0.7, dy, 4.5, 2.6, s * 0.5, 0, TOUR);
      ctx.fillStyle = "#6cc94a"; ctx.fill(); ctx.strokeStyle = "#24521c"; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- le fantôme
  // Pendant qu'on choisit où construire : le bâtiment transparent, sur un losange vert (oui) ou rouge (non).
  function dessinerFantome(ctx, type, x, y, possible, t, L, Hc) {
    ctx.beginPath();
    ctx.moveTo(x, y - Hc / 2); ctx.lineTo(x + L / 2, y); ctx.lineTo(x, y + Hc / 2); ctx.lineTo(x - L / 2, y); ctx.closePath();
    ctx.fillStyle = possible ? "rgba(80, 230, 100, .45)" : "rgba(255, 70, 60, .45)";
    ctx.fill();
    ctx.strokeStyle = possible ? "#c6ffd0" : "#ffd0cc"; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 0.55 + 0.15 * Math.sin(t * 5);
    boite(ctx, x, y, MODELES[type], 1, true);
    ctx.globalAlpha = 1;
  }

  return { dessinerBatiment, dessinerOuvrier, dessinerPorteur, dessinerAnimal, dessinerPousse, dessinerFantome, iconeRoute, debutImage, lumiere, get lumieres() { return lumieres; }, vue }; // étape 9 : la vue et les lumières
})();
