// 🩻 LES RAYONS X : voir ce que le jeu calcule en cachette
//
// Avec X, on voit :
//   - la GRILLE : chaque case est un losange, avec sa colonne et sa ligne ;
//   - les 2 flèches qui montrent dans quel sens on compte les colonnes et les lignes ;
//   - le numéro du terrain de chaque case près de la souris (le vrai contenu de la mémoire) ;
//   - le chemin des rivières (elles descendent toujours vers la case voisine la plus basse) ;
//   - la place du village (le cercle où il y a toujours de l'herbe) ;
//   - le calcul qui trouve la case sous la souris ;
//   - (étape 2) la zone de travail de chaque ouvrier (jusqu'où va la « tache d'encre »), son chemin,
//     son état (sa case dans la machine à états), et les cases réservées (croix rouges) ;
//   - (étape 3) les routes : un point vert si elle est reliée à l'entrepôt, rouge sinon ;
//     et le chemin de chaque porteur, en violet ;
//   - (étape 4) le gibier et son état (rouge = visé par un chasseur), la faim de chaque ouvrier ;
//   - (étape 8) la recette de chaque atelier et ses réserves, et les places de chaque logement.

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

    // Étape 2 : les ouvriers
    ctx.font = "bold " + 11 / Math.min(z, 1.4) + "px 'Trebuchet MS', sans-serif";
    for (const bat of monde.batiments) {
      const r = C.batiments[bat.type] && C.batiments[bat.type].rayon;
      if (r && (!monde.selection || monde.selection === bat)) {
        // La zone de travail : toutes les cases à moins de r pas. En pas (pas en diagonale),
        // c'est un losange dans la grille… qui devient un carré une fois vu de biais !
        const c = bat.colonne + 0.5, l = bat.ligne + 0.5;
        ctx.strokeStyle = "rgba(255, 200, 80, .8)"; ctx.lineWidth = 2 / z; ctx.setLineDash([5 / z, 4 / z]);
        ctx.beginPath();
        [[c + r + 0.5, l], [c, l + r + 0.5], [c - r - 0.5, l], [c, l - r - 0.5]].forEach(([pc, pl], n) => {
          const p = point(pc, pl); n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        });
        ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      }
      const o = bat.ouvrier;
      if (!o) continue;
      if (o.chemin && (o.etat === "aller" || o.etat === "revenir" || o.etat === "travailler")) {
        ctx.strokeStyle = "rgba(255, 255, 255, .85)"; ctx.lineWidth = 2 / z;
        ctx.beginPath();
        o.chemin.forEach((k, n) => { const p = point(k.x, k.y); n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
        ctx.stroke();
      }
      const p = point(o.x, o.y);
      ctx.fillStyle = "#ffe27a";
      ctx.textAlign = "center";
      ctx.fillText(o.etat + (o.minuteur > 0 && (o.etat === "travailler" || o.etat === "repos" || o.etat === "attendre") ? " " + virgule(o.minuteur, 1) + " s" : ""), p.x, p.y - 34 / Math.min(z, 1.4));
      ctx.textAlign = "left";
    }
    // Étape 3 : les routes du réseau (vert = reliée à l'entrepôt, rouge = pas reliée), et le chemin des porteurs
    for (let i = 0; i < monde.route.length; i++) {
      if (!monde.route[i]) continue;
      const c = i % carte.colonnes, l = Math.floor(i / carte.colonnes);
      if (c < b.cMin || c > b.cMax || l < b.lMin || l > b.lMax) continue;
      const p = point(c + 0.5, l + 0.5);
      ctx.fillStyle = monde.reseau.has(i) ? "rgba(80, 255, 120, .9)" : "rgba(255, 80, 60, .9)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 4 / Math.min(z, 1.5), 0, Math.PI * 2); ctx.fill();
    }
    for (const porteur of monde.porteurs) {
      if (!porteur.chemin) continue;
      ctx.strokeStyle = "rgba(160, 140, 255, .9)"; ctx.lineWidth = 2.5 / z;
      ctx.beginPath();
      porteur.chemin.forEach((k, n) => { const p = point(k.x, k.y); n ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      const p = point(porteur.x, porteur.y);
      ctx.fillStyle = "#c9b8ff"; ctx.textAlign = "center";
      ctx.fillText("porteur " + porteur.numero + " · " + porteur.etat, p.x, p.y - 36 / Math.min(z, 1.4));
      ctx.textAlign = "left";
    }
    // Étape 4 : le gibier (cercle rouge = visé par un chasseur) et la faim de chaque ouvrier
    for (const a of monde.animaux) {
      const p = point(a.x, a.y);
      ctx.strokeStyle = a.vise ? "#ff4b3e" : "rgba(255, 255, 255, .7)"; ctx.lineWidth = 1.5 / z;
      ctx.beginPath(); ctx.arc(p.x, p.y - 6, 10, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.fillText(a.etat + (a.vise ? " (visé)" : ""), p.x, p.y - 20); ctx.textAlign = "left";
    }
    for (const bat of monde.batiments) {
      if (!bat.ouvrier || bat.etat !== "pret") continue;
      const p = point(bat.colonne + 0.5, bat.ligne + 0.5);
      ctx.fillStyle = bat.ouvrier.affame ? "#ff6b5b" : "#ffd98a"; ctx.textAlign = "center";
      ctx.fillText("faim " + Math.floor(bat.ouvrier.faim || 0) + " / " + C.repas.intervalle + " s", p.x, p.y + 18 / Math.min(z, 1.4));
      ctx.textAlign = "left";
    }
    // Étape 8 : les ateliers (recette et réserves) et les logements (places)
    const EMO = (r) => C.ressources[r].emoji;
    for (const bat of monde.batiments) {
      if (bat.etat !== "pret") continue;
      const p = point(bat.colonne + 0.5, bat.ligne + 0.5), R = C.ateliers[bat.type];
      let t = null;
      if (R) t = Object.entries(R.entrees).map(([r, n]) => (bat.entrees[r] || 0) + "/" + n + EMO(r)).join(" + ") + " → " + Object.values(R.sorties)[0] + EMO(bat.sortieQuoi);
      else if (C.logement[bat.type] && bat.type !== "entrepot") t = "🛏️ +" + C.logement[bat.type] + " places";
      else if (bat.type === "entrepot") t = "🛏️ " + Village.Logement.habitants(monde) + " / " + Village.Logement.capacite(monde) + " places · 📦 " + Village.Reserve.capacite(monde);
      if (bat.usure > 0) t = (t ? t + " · " : "") + "🔧 " + Math.round(bat.usure * 100) + " %"; // étape 11
      if (!t) continue;
      ctx.fillStyle = "#9ff0ff"; ctx.textAlign = "center";
      ctx.fillText(t, p.x, p.y + 30 / Math.min(z, 1.4));
      ctx.textAlign = "left";
    }
    for (const i of monde.reservees) {
      const p = point((i % carte.colonnes) + 0.5, Math.floor(i / carte.colonnes) + 0.5), r = 7;
      ctx.strokeStyle = "#ff4b3e"; ctx.lineWidth = 2.5 / z;
      ctx.beginPath(); ctx.moveTo(p.x - r, p.y - r / 2); ctx.lineTo(p.x + r, p.y + r / 2); ctx.moveTo(p.x + r, p.y - r / 2); ctx.lineTo(p.x - r, p.y + r / 2); ctx.stroke();
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
    const l = Math.min(340, Village.Ecran.largeur - 20), h = 14 + lignes.length * 18;
    const x0 = 10, y0 = Math.max(80, Village.Ecran.hauteur - h - 130); // en bas à gauche, au-dessus des boutons
    ctx.fillStyle = "rgba(8, 14, 30, .85)";
    ctx.strokeStyle = "#7bff9e";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, l, h, 10); else ctx.rect(x0, y0, l, h);
    ctx.fill(); ctx.stroke();
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "middle";
    lignes.forEach((t, n) => {
      ctx.fillStyle = n >= 3 && n <= 4 ? "#ffe27a" : "#b9f5c9";
      ctx.fillText(t, x0 + 12, y0 + 13 + n * 18);
    });
  }

  return { dessinerDansLeMonde, dessinerSurLEcran };
})();
