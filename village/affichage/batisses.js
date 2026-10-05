// 🏡 LES BÂTISSES : le dessinateur des maisons et des petits bonshommes
//
// Ce fichier sait dessiner chaque bâtiment (entrepôt, cabane du bûcheron, scierie…), les chantiers,
// les ouvriers et les jeunes pousses. Il est appelé par le peintre, au bon moment (du fond vers l'avant).
//
// Une maison en vue de biais, c'est une BOÎTE : un losange au sol, deux murs qu'on voit (gauche et
// droite), et un toit. Tous les bâtiments utilisent la même boîte, avec d'autres couleurs et d'autres
// décorations : c'est plus simple, et ils vont bien ensemble.

window.Village = window.Village || {};

Village.Batisses = (function () {
  const TOUR = Math.PI * 2;
  const CONTOUR = "#3b2614";

  // Les couleurs et la taille de chaque bâtiment.
  //   a : demi-largeur du losange au sol (px) ; h : hauteur des murs ; toit : hauteur du toit.
  const MODELES = {
    entrepot: { a: 27, h: 20, toit: 18, murG: "#d39a5e", murD: "#b07740", toitA: "#d9553b", toitB: "#b8432c" },
    bucheron: { a: 19, h: 14, toit: 14, murG: "#a87443", murD: "#865a31", toitA: "#7a9a3a", toitB: "#5f7d2b", rondins: true },
    forestier: { a: 19, h: 14, toit: 15, murG: "#efdcb4", murD: "#cfb68a", toitA: "#4fb556", toitB: "#3a8e3e" },
    scierie: { a: 22, h: 16, toit: 15, murG: "#c48f5d", murD: "#a2703f", toitA: "#6f86b3", toitB: "#556b94" },
    carriere: { a: 19, h: 13, toit: 13, murG: "#b5b5b0", murD: "#90908b", toitA: "#9a6a3c", toitB: "#7c522b", blocs: true },
  };

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

  // La boîte : (x, y) est le milieu du losange au sol. `murs` de 0 à 1 (pour un chantier qui monte).
  function boite(ctx, x, y, m, murs, avecToit) {
    const a = m.a, b = a / 2, h = m.h * murs;
    const G = [x - a, y], B = [x, y + b], D = [x + a, y], H = [x, y - b];
    const up = ([px, py], dh) => [px, py - dh];
    // Les 2 murs qu'on voit
    forme(ctx, [G, B, up(B, h), up(G, h)], m.murG);
    forme(ctx, [B, D, up(D, h), up(B, h)], m.murD);
    // Des rondins ou des blocs de pierre dessinés sur les murs
    if (m.rondins || m.blocs) {
      ctx.strokeStyle = "rgba(40, 25, 10, .35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const dh = (h * k) / 4;
        ctx.moveTo(G[0], G[1] - dh); ctx.lineTo(B[0], B[1] - dh); ctx.lineTo(D[0], D[1] - dh);
      }
      if (m.blocs) for (let k = 1; k < 4; k++) {
        const px = G[0] + (B[0] - G[0]) * (k / 4), py = G[1] + (B[1] - G[1]) * (k / 4);
        ctx.moveTo(px, py - (k % 2 ? 0 : h / 4)); ctx.lineTo(px, py - h / 4 - (k % 2 ? 0 : h / 4));
      }
      ctx.stroke();
    }
    if (!avecToit) {
      // Pas de toit (chantier) : on voit le haut des murs.
      forme(ctx, [up(G, h), up(B, h), up(D, h), up(H, h)], "rgba(120, 85, 50, .6)");
      return;
    }
    // Le toit à deux pentes : le faîte (la ligne du haut) va du milieu du mur gauche-haut au milieu du mur bas-droite.
    const deb = 3; // le toit dépasse un peu des murs
    const Gt = [G[0] - deb, G[1] - h + 1], Bt = [B[0], B[1] - h + deb], Dt = [D[0] + deb, D[1] - h + 1], Ht = [H[0], H[1] - h - deb];
    const F1 = [(Gt[0] + Ht[0]) / 2, (Gt[1] + Ht[1]) / 2 - m.toit];
    const F2 = [(Bt[0] + Dt[0]) / 2, (Bt[1] + Dt[1]) / 2 - m.toit];
    // Le pignon (le triangle de mur sous le toit, côté droit)
    forme(ctx, [up(B, h), up(D, h), [F2[0], F2[1] + 3]], m.murD);
    forme(ctx, [Ht, Dt, F2, F1], m.toitB); // la pente du fond
    forme(ctx, [Gt, F1, F2, Bt], m.toitA); // la pente de devant
    // Un trait clair sur le faîte
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(F1[0] + 2, F1[1] + 2); ctx.lineTo(F2[0] - 2, F2[1] + 2); ctx.stroke();
  }

  // La porte, sur le mur de gauche
  function porte(ctx, x, y, m, couleur) {
    const a = m.a, b = a / 2;
    const px = x - a * 0.45, py = y + b * 0.55;
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 2); ctx.lineTo(px + 4, py + 2); ctx.lineTo(px + 4, py - 10); ctx.lineTo(px - 4, py - 14); ctx.closePath();
    ctx.fillStyle = couleur || "#5a3818"; ctx.fill(); contour(ctx, 1.5);
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
      if (sorte === "rondin") { rond(ctx, px, py, 3, "#c78b4a"); ctx.fillStyle = "#8a5a2b"; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, TOUR); ctx.fill(); }
      else if (sorte === "planche") forme(ctx, [[px - 5, py], [px + 3, py - 3], [px + 6, py - 2], [px - 2, py + 1]], "#d9a866");
      else rond(ctx, px, py, 3.2, "#a3a8ad");
    }
  }

  // ---------------------------------------------------------------- un bâtiment
  function dessinerBatiment(ctx, b, x, y, t) {
    const m = MODELES[b.type];
    ombre(ctx, x, y, m.a);
    if (b.etat === "chantier") return chantier(ctx, b, x, y, m, t);
    boite(ctx, x, y, m, 1, true);
    porte(ctx, x, y, m);
    const travaille = b.ouvrier && b.ouvrier.etat === "travailler";
    switch (b.type) {
      case "entrepot":
        // Des caisses devant l'entrepôt
        for (const [dx, dy] of [[12, 12], [20, 8]]) {
          forme(ctx, [[x + dx - 5, y + dy], [x + dx, y + dy + 3], [x + dx + 5, y + dy], [x + dx + 5, y + dy - 6], [x + dx, y + dy - 3], [x + dx - 5, y + dy - 6]], "#c98b4f");
          ctx.beginPath(); ctx.moveTo(x + dx, y + dy + 3); ctx.lineTo(x + dx, y + dy - 3); contour(ctx, 1.2);
        }
        // Le drapeau du village sur le toit
        drapeau(ctx, x - 6, y - 50, t, "#3e7bff");
        break;
      case "bucheron":
        pile(ctx, x + 14, y + 8, "rondin", 5);
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
        pile(ctx, x + 16, y + 10, "planche", b.produits > 0 ? 4 : 1);
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
        pile(ctx, x + 14, y + 9, "pierre", 4);
        // Une pioche posée contre le mur
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 20, y + 9); ctx.lineTo(x - 16, y - 6); ctx.stroke();
        ctx.strokeStyle = "#7a7f88"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x - 22, y - 4); ctx.quadraticCurveTo(x - 16, y - 9, x - 10, y - 5); ctx.stroke();
        break;
    }
    // Un petit panneau avec l'emoji du métier, au-dessus de la porte
    if (b.type !== "entrepot") enseigne(ctx, x - m.a * 0.45, y - 8 - m.h * 0.2, Village.Batiments.TYPES[b.type].emoji);
    if (travaille && b.type === "carriere") poussiere(ctx, x, y, t);
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
    pile(ctx, x + a * 0.7, y + 10, "planche", 3);
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
  };

  function dessinerOuvrier(ctx, type, o, x, y, t) {
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
    // L'outil, qui frappe quand il travaille
    const angle = travaille ? -1.2 + Math.abs(Math.sin(t * 6)) * 1.8 : 0.5;
    ctx.save(); ctx.translate(3, -11); ctx.rotate(angle);
    ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -11); ctx.stroke();
    ctx.fillStyle = "#c9ccd1"; ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1;
    ctx.beginPath();
    if (tenue.outil === "hache") { ctx.moveTo(0, -11); ctx.lineTo(4.5, -12); ctx.lineTo(4.5, -7); ctx.lineTo(0, -8); }
    else if (tenue.outil === "pelle") { ctx.moveTo(-2.5, -11); ctx.lineTo(2.5, -11); ctx.lineTo(1.5, -16); ctx.lineTo(-1.5, -16); }
    else { ctx.moveTo(-5, -10); ctx.quadraticCurveTo(0, -14, 5, -10); ctx.lineTo(0, -12); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // Ce qu'il rapporte, sur l'épaule
    if (o.porte === "troncs") {
      ctx.fillStyle = "#b07a40"; ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-9, -18, 16, 4.5, 2); else ctx.rect(-9, -18, 16, 4.5);
      ctx.fill(); contour(ctx, 1.2);
      rond(ctx, 7, -15.7, 2.3, "#d9a866");
    } else if (o.porte === "pierres") {
      rond(ctx, -1, -24.5, 3.6, "#a3a8ad");
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

  return { dessinerBatiment, dessinerOuvrier, dessinerPousse, dessinerFantome };
})();
