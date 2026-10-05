// 🩻 LES RAYONS X : voir ce que le jeu calcule en cachette
//
// Avec X, on voit :
//   - la GRILLE : chaque case est un losange, avec sa colonne et sa ligne ;
//   - les 2 flèches qui montrent dans quel sens on compte les colonnes et les lignes ;
//   - le numéro du terrain de chaque case près de la souris (le vrai contenu de la mémoire) ;
//   - le chemin des rivières (elles descendent toujours vers la case voisine la plus basse) ;
//   - la place du village (le cercle où il y a toujours de l'herbe) ;
//   - le calcul qui trouve la case sous la souris.

window.Village = window.Village || {};

Village.RayonsX = (function () {
  const C = Village.CONFIG;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const virgule = (n, k) => n.toFixed(k).replace(".", ",");
  // Un point de la grille (avec virgules) → px du monde.
  const point = (c, l) => Village.Iso.versMonde(c, l, L, Hc);

  function dessinerDansLeMonde(ctx, monde, b) {
    const z = monde.camera.zoom, carte = monde.carte;

    // La grille : une ligne par colonne et une ligne par ligne (bien moins cher que tous les losanges).
    ctx.lineWidth = 1 / z;
    ctx.strokeStyle = "rgba(120, 255, 160, .35)";
    ctx.beginPath();
    for (let c = b.cMin; c <= b.cMax + 1; c++) {
      const a = point(c, b.lMin), e = point(c, b.lMax + 1);
      ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y);
    }
    for (let l = b.lMin; l <= b.lMax + 1; l++) {
      const a = point(b.cMin, l), e = point(b.cMax + 1, l);
      ctx.moveTo(a.x, a.y); ctx.lineTo(e.x, e.y);
    }
    ctx.stroke();

    // Les flèches des colonnes et des lignes, depuis la case (0, 0)
    const o = point(0, 0);
    fleche(ctx, o, point(6, 0), "#ffcf4d", "colonne →", z);
    fleche(ctx, o, point(0, 6), "#7fd0ff", "ligne →", z);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold " + 13 / z + "px ui-monospace, monospace";
    ctx.fillText("(0, 0)", o.x - 18 / z, o.y - 8 / z);

    // Les rivières
    ctx.strokeStyle = "rgba(0, 255, 255, .9)";
    ctx.lineWidth = 2.5 / z;
    for (const riviere of carte.rivieres) {
      ctx.beginPath();
      riviere.forEach((k, n) => {
        const p = point(k.colonne + 0.5, k.ligne + 0.5);
        n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      });
      ctx.stroke();
      const debut = point(riviere[0].colonne + 0.5, riviere[0].ligne + 0.5);
      ctx.fillStyle = "#00ffff";
      ctx.fillText("source", debut.x + 6 / z, debut.y);
    }

    // La place du village : le cercle de l'herbe obligatoire
    const v = carte.village, R = C.generation.rayonDuVillage + 0.5;
    ctx.strokeStyle = "rgba(255, 120, 200, .9)";
    ctx.setLineDash([6 / z, 5 / z]);
    ctx.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = (k / 48) * Math.PI * 2, p = point(v.colonne + 0.5 + Math.cos(a) * R, v.ligne + 0.5 + Math.sin(a) * R);
      k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Près de la souris : la colonne, la ligne et le numéro du terrain de chaque case
    if (monde.survol && z > 0.5) {
      ctx.font = 10 / Math.min(z, 1.4) + "px ui-monospace, monospace";
      ctx.textAlign = "center";
      for (let dl = -2; dl <= 2; dl++) for (let dc = -2; dc <= 2; dc++) {
        const k = Village.Carte.lireCase(carte, monde.survol.colonne + dc, monde.survol.ligne + dl);
        if (!k) continue;
        const p = point(k.colonne + 0.5, k.ligne + 0.5);
        ctx.fillStyle = dc === 0 && dl === 0 ? "#fff36b" : "rgba(255,255,255,.85)";
        ctx.fillText(k.colonne + "," + k.ligne, p.x, p.y - 4 / Math.min(z, 1.4));
        ctx.fillStyle = "#7bff9e";
        ctx.fillText("t" + k.terrain + (k.objet ? " o" + k.objet : ""), p.x, p.y + 7 / Math.min(z, 1.4));
      }
      ctx.textAlign = "left";
    }

    // La position exacte de la souris dans le monde : un petit point rouge
    if (monde.souris) {
      ctx.fillStyle = "#ff4b3e";
      ctx.beginPath(); ctx.arc(monde.souris.mondeX, monde.souris.mondeY, 3 / z, 0, Math.PI * 2); ctx.fill();
    }
  }

  function fleche(ctx, a, b, couleur, texte, z) {
    ctx.strokeStyle = couleur; ctx.fillStyle = couleur; ctx.lineWidth = 3 / z;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const ang = Math.atan2(b.y - a.y, b.x - a.x), r = 12 / z;
    ctx.beginPath(); ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - Math.cos(ang - 0.4) * r, b.y - Math.sin(ang - 0.4) * r);
    ctx.lineTo(b.x - Math.cos(ang + 0.4) * r, b.y - Math.sin(ang + 0.4) * r);
    ctx.closePath(); ctx.fill();
    ctx.font = "bold " + 13 / z + "px 'Trebuchet MS', sans-serif";
    ctx.fillText(texte, b.x + 8 / z, b.y + 4 / z);
  }

  // Le calcul de la case sous la souris, écrit en clair en haut à droite.
  function dessinerSurLEcran(ctx, monde) {
    const W = C.ecran.largeur;
    const s = monde.souris;
    const lignes = s
      ? [
          "🖱️ Souris sur l'écran : (" + Math.round(s.ecranX) + " ; " + Math.round(s.ecranY) + ") px",
          "🌍 Dans le monde : X = " + Math.round(s.mondeX) + ", Y = " + Math.round(s.mondeY),
          "   (on enlève la caméra et le zoom)",
          "colonne = (X ÷ 32 + Y ÷ 16) ÷ 2 = " + virgule(s.colonne, 2) + " → " + Math.floor(s.colonne),
          "ligne   = (Y ÷ 16 − X ÷ 32) ÷ 2 = " + virgule(s.ligne, 2) + " → " + Math.floor(s.ligne),
          monde.survol ? "📦 Case n° " + monde.survol.numero + " = ligne × 64 + colonne" : "❌ Hors de la carte",
        ]
      : ["🖱️ Mets la souris sur la carte", "pour voir le calcul de la case."];
    const l = 340, h = 14 + lignes.length * 18;
    ctx.fillStyle = "rgba(8, 14, 30, .85)";
    ctx.strokeStyle = "#7bff9e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - l - 12, 12, l, h, 10); else ctx.rect(W - l - 12, 12, l, h);
    ctx.fill(); ctx.stroke();
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
    lignes.forEach((t, n) => {
      ctx.fillStyle = n >= 3 && n <= 4 ? "#ffe27a" : "#b9f5c9";
      ctx.fillText(t, W - l, 25 + n * 18);
    });
  }

  return { dessinerDansLeMonde, dessinerSurLEcran };
})();
