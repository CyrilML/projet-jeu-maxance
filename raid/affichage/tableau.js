// 📟 LE TABLEAU DE BORD : ce qu'on écrit par-dessus l'image 3D (étape 54)
//
// Le compteur de vitesse, le terrain sous tes roues, ta distance, ton plus grand saut, une petite CARTE du désert
// (avec la piste, la rivière, toi en jaune et les autres pilotes en blanc), et le garage pour choisir ton véhicule.
// Il lit le monde, il ne le modifie jamais.

window.Raid = window.Raid || {};

Raid.Tableau = (function () {
  const C = Raid.CONFIG, T = Raid.Terrain;
  let ctx, L, H, carte = null, sautAffiche = null;

  function initialiser(toile) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    // La petite carte : on la dessine une seule fois (un point par case de 12 m, de la couleur du terrain).
    const n = 150;
    carte = document.createElement("canvas");
    carte.width = carte.height = n;
    const c = carte.getContext("2d");
    const COUL = { piste: "#c9a679", terre: "#a8875f", herbe: "#9c9165", sable: "#e2c48e", cailloux: "#8f857b", boue: "#5a4330", gue: "#6f93a8", eau: "#3d6f99" };
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        c.fillStyle = COUL[T.terrain(-T.demi + (i + 0.5) * (2 * T.demi / n), -T.demi + (j + 0.5) * (2 * T.demi / n))];
        c.fillRect(i, j, 1, 1);
      }
    }
    Raid.Evenements.ecouter("saut", (d) => (sautAffiche = { d, jusqua: performance.now() + 2500 }));
  }

  function texte(t, x, y, taille, couleur, align) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', sans-serif";
    ctx.textAlign = align || "left";
    ctx.lineWidth = 4;
    ctx.lineJoin = "round"; // sinon le contour du « M » fait des pointes
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(t, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(t, x, y);
  }
  function panneau(x, y, l, h) {
    ctx.fillStyle = "rgba(20,16,10,0.55)";
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, 10);
    ctx.fill();
  }
  const virgule = (n, c) => n.toFixed(c).replace(".", ",");

  function dessiner(monde) {
    ctx.clearRect(0, 0, L, H);
    const v = monde.voiture, f = v.fiche;
    if (monde.phase === "garage") {
      panneau(L / 2 - 250, H - 170, 500, 150);
      texte(f.nom, L / 2, H - 132, 28, "#ffe27a", "center");
      texte({ "4x4": "4x4 de rallye-raid", buggy: "buggy du désert", moto: "moto de rallye", camion: "camion du Dakar" }[f.famille] + " · n° " + f.numero, L / 2, H - 104, 16, "#e8dcc8", "center");
      const barres = [["Vitesse", f.vitesseMax / 50, Math.round(f.vitesseMax * 3.6) + " km/h"], ["Accélération", f.acceleration / 9, virgule(f.acceleration, 1) + " m/s²"], ["Motricité (sable, boue)", (f.motricite - 0.6) / 0.8, virgule(f.motricite, 2)]];
      barres.forEach(([nom, part, valeur], i) => {
        const y = H - 84 + i * 20;
        texte(nom, L / 2 - 230, y + 5, 13, "#e8dcc8");
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillRect(L / 2 - 50, y - 6, 200, 10);
        ctx.fillStyle = "#ffcf5a";
        ctx.fillRect(L / 2 - 50, y - 6, 200 * Math.max(0.05, Math.min(1, part)), 10);
        texte(valeur, L / 2 + 230, y + 5, 13, "#fff", "right");
      });
      texte("← → pour choisir · Entrée pour partir dans le désert", L / 2, 40, 20, "#fff", "center");
      return;
    }
    // En haut à gauche : le véhicule, le terrain, la distance, le record de saut.
    const ter = C.terrains[v.terrain], S = Raid.Sauvegarde.donnees;
    panneau(12, 12, 300, 98);
    texte(f.nom, 24, 38, 18, "#ffe27a");
    texte(ter.icone + " " + ter.nom + (v.dansLEau > 0.05 ? " · 💦 " + Math.round(v.dansLEau * 100) + " cm d'eau" : ""), 24, 62, 15, "#fff");
    texte("📏 " + virgule(S.distance / 1000, 2) + " km parcourus", 24, 84, 13, "#e8dcc8");
    texte("🏆 plus grand saut : " + (S.plusGrandSaut ? virgule(S.plusGrandSaut, 1) + " m" : "—"), 24, 102, 13, "#e8dcc8");
    // Le compteur de vitesse.
    panneau(L - 170, H - 92, 158, 80);
    texte(Math.round(Math.abs(v.vitesse) * 3.6) + "", L - 60, H - 34, 44, "#fff", "right");
    texte("km/h", L - 22, H - 34, 15, "#e8dcc8", "right");
    // La petite carte (le nord en haut), avec la piste, toi et les autres.
    const tc = 150, x0 = L - tc - 14, y0 = 14;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(carte, x0, y0, tc, tc);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.strokeRect(x0, y0, tc, tc);
    const surCarte = (x, z) => [x0 + ((x + T.demi) / (2 * T.demi)) * tc, y0 + ((z + T.demi) / (2 * T.demi)) * tc];
    ctx.fillStyle = "#fff";
    for (const p of monde.pilotes) {
      const [a, b] = surCarte(p.v.x, p.v.z);
      ctx.fillRect(a - 1.5, b - 1.5, 3, 3);
    }
    const [a, b] = surCarte(v.x, v.z);
    ctx.save();
    ctx.translate(a, b);
    ctx.rotate(v.angle);
    ctx.fillStyle = "#ffd21a";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.fill();
    ctx.restore();
    // Un saut ? On l'affiche en grand pendant 2,5 s.
    if (sautAffiche && performance.now() < sautAffiche.jusqua) {
      const d = sautAffiche.d;
      texte("SAUT ! " + virgule(d.longueur, 1) + " m", L / 2, 120, 38, "#ffe27a", "center");
      texte(virgule(d.duree, 2) + " s en l'air · " + virgule(d.hauteur, 1) + " m de haut", L / 2, 148, 17, "#fff", "center");
    }
    if (v.terrain === "eau") texte("💧 Trop profond ! Ressors de l'eau (ou R : retour sur la piste)", L / 2, H - 40, 18, "#bfe3ff", "center");
    else texte("↑ ↓ ← → conduire · R : retour sur la piste · C : caméra · ⌫ : garage", L / 2, H - 16, 13, "rgba(255,255,255,0.8)", "center");
  }

  return { initialiser, dessiner };
})();
