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
  const MODELES = {
    entrepot: { a: 27, h: 20, toit: 18, murG: "#d39a5e", murD: "#b07740", toitA: "#d9553b", toitB: "#b8432c" },
    bucheron: { a: 19, h: 14, toit: 14, murG: "#a87443", murD: "#865a31", toitA: "#7a9a3a", toitB: "#5f7d2b", rondins: true },
    forestier: { a: 19, h: 14, toit: 15, murG: "#efdcb4", murD: "#cfb68a", toitA: "#4fb556", toitB: "#3a8e3e" },
    scierie: { a: 22, h: 16, toit: 15, murG: "#c48f5d", murD: "#a2703f", toitA: "#6f86b3", toitB: "#556b94" },
    carriere: { a: 19, h: 13, toit: 13, murG: "#b5b5b0", murD: "#90908b", toitA: "#9a6a3c", toitB: "#7c522b", blocs: true },
    pecheur: { a: 18, h: 13, toit: 14, murG: "#e3c896", murD: "#c2a46f", toitA: "#3fa7b5", toitB: "#2d8592" }, // étape 4
    chasseur: { a: 18, h: 13, toit: 14, murG: "#8e6038", murD: "#6f4826", toitA: "#6f8a3a", toitB: "#56702c", rondins: true },
    geologue: { a: 18, h: 13, toit: 14, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#8a5ab0", toitB: "#6c428c", blocs: true }, // étape 5
  };

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
      if (sorte === "rondin") {
        // Le bout d'un rondin : le bois clair, les cernes, et l'écorce autour
        rond(ctx, px, py, 3.2, "#8f5e2e");
        ctx.beginPath(); ctx.arc(px, py, 2.3, 0, TOUR); ctx.fillStyle = "#e6be85"; ctx.fill();
        ctx.strokeStyle = "rgba(140, 90, 40, .8)"; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, TOUR); ctx.stroke();
      }
      else if (sorte === "poisson") poisson(ctx, px, py);
      else if (sorte === "viande") viande(ctx, px, py);
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
        pile(ctx, x - 20, y + 12, "rondin", b.entree); // les troncs en réserve
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
    else if (!b.ouvrier && Village.Batiments.TYPES[b.type].metier) bulleDePensee(ctx, x, y - m.h - m.toit - 18, t, "vide");
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
  function iconeRoute(ctx, x, y, e) {
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
    ctx.lineCap = "round";
    const chemin = () => { ctx.beginPath(); ctx.moveTo(-12, 14); ctx.bezierCurveTo(-14, 2, 12, 4, 6, -6); ctx.bezierCurveTo(2, -12, 8, -14, 10, -16); };
    chemin(); ctx.strokeStyle = "#9b7440"; ctx.lineWidth = 10; ctx.stroke();
    chemin(); ctx.strokeStyle = "#e2c38c"; ctx.lineWidth = 6.5; ctx.stroke();
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
    ctx.beginPath(); ctx.ellipse(0, 1, a.sorte === "cerf" ? 11 : 5.5, 3, 0, 0, TOUR); ctx.fill();
    if (chute) { ctx.translate(0, -2); ctx.rotate(chute * 1.45); ctx.translate(0, 2); }
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (a.sorte === "cerf") cerf(ctx, a, t, marche);
    else lapin(ctx, a, t, marche, hiver);
    // La flèche plantée
    if (chute) {
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(a.sorte === "cerf" ? -1 : 0, a.sorte === "cerf" ? -13 : -6); ctx.lineTo(a.sorte === "cerf" ? -8 : -6, a.sorte === "cerf" ? -19 : -11); ctx.stroke();
      ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.arc(a.sorte === "cerf" ? -8 : -6, a.sorte === "cerf" ? -19 : -11, 1.6, 0, TOUR); ctx.fill();
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
  // Un petit bonhomme en tunique bleue, qui porte son objet au-dessus de la tête.
  function dessinerPorteur(ctx, p, x, y, t) {
    const pas = Math.sin(t * 15 + p.numero), saut = Math.abs(pas) * 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.direction, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .25)";
    ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.5, 0, 0, TOUR); ctx.fill();
    ctx.translate(0, -saut);
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 2.6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-2, -6); ctx.lineTo(-2 + pas * 2.5, 0); ctx.moveTo(2, -6); ctx.lineTo(2 - pas * 2.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -10, 4.8, 6, 0, 0, TOUR); ctx.fillStyle = "#4a90d9"; ctx.fill(); contour(ctx, 1.5);
    ctx.fillStyle = "#c98b4f"; ctx.fillRect(-4.5, -9, 9, 2); // la ceinture
    rond(ctx, 0, -19, 4.3, "#f2c79b");
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(1.8, -19.5, 0.8, 0, TOUR); ctx.fill();
    // Les bras levés quand il porte quelque chose
    ctx.strokeStyle = "#f2c79b"; ctx.lineWidth = 2;
    ctx.beginPath();
    if (p.porte) { ctx.moveTo(-3, -13); ctx.lineTo(-3, -25); ctx.moveTo(3, -13); ctx.lineTo(3, -25); }
    else { ctx.moveTo(-4, -12); ctx.lineTo(-5 - pas, -6); ctx.moveTo(4, -12); ctx.lineTo(5 + pas, -6); }
    ctx.stroke();
    if (p.porte === "poissons") poisson(ctx, 0, -29);
    else if (p.porte === "viande") viande(ctx, 0, -29);
    else if (p.porte === "troncs") rondin(ctx, 0, -29, 0);
    else if (p.porte === "planches") { forme(ctx, [[-9, -27], [9, -29], [9, -26], [-9, -24]], "#d9a866"); }
    else if (p.porte === "pierres") { rond(ctx, 0, -29, 4, "#a3a8ad"); }
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

  return { dessinerBatiment, dessinerOuvrier, dessinerPorteur, dessinerAnimal, dessinerPousse, dessinerFantome, iconeRoute };
})();
