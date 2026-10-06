// 📟 LE TABLEAU DE BORD : ce qu'on écrit par-dessus l'image 3D (étape 60)
//
// En bataille : ta VIE (4 cases : une par obus que tu peux encore encaisser), la RECHARGE du canon (une barre qui se
// remplit), le VISEUR (là où va ton obus ; il devient rouge quand la visée assistée a trouvé un ennemi), le nombre de
// tanks vivants dans chaque équipe, une petite CARTE du champ de bataille, et au-dessus de chaque tank son nom et sa
// vie (bleu = ton équipe, rouge = les ennemis). Au garage : le tank choisi, son drapeau et ses qualités.
// Il lit le monde, il ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Tableau = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, E = C.equipes;
  let ctx, L, H, carte = null, message = null;

  function initialiser(toile) {
    ctx = toile.getContext("2d");
    L = toile.width;
    H = toile.height;
    // la petite carte (dessinée une fois) : l'herbe, le village, les maisons, les bois
    const n = 160;
    carte = document.createElement("canvas");
    carte.width = carte.height = n;
    const c = carte.getContext("2d"), k = n / C.monde.taille;
    c.fillStyle = "#5d6e3f";
    c.fillRect(0, 0, n, n);
    c.fillStyle = "rgba(160,140,100,.6)";
    c.beginPath();
    c.arc(n / 2, n / 2, C.monde.village.rayon * k * 1.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#2f4a28";
    for (const a of T.arbres) c.fillRect(n / 2 + a.x * k - 1, n / 2 + a.z * k - 1, 2, 2);
    for (const b of T.boites) {
      c.save();
      c.translate(n / 2 + b.x * k, n / 2 + b.z * k);
      c.rotate(b.angle);
      c.fillStyle = b.sorte === "maison" ? "#d8cdb8" : "#a89c86";
      c.fillRect(-b.demiL * k, -Math.max(0.6, b.demiP * k), b.demiL * 2 * k, Math.max(1.2, b.demiP * 2 * k));
      c.restore();
    }
    const radio = Tanks.Evenements;
    const dire = (texte, couleur, duree) => (message = { texte, couleur, jusqua: performance.now() + (duree || 1800) });
    radio.ecouter("touche", (d) => {
      if (d.parToi) dire(d.vie > 0 ? "🎯 Touché ! " + d.cible + " (" + d.vie + "/" + C.char.vie + ")" : "", "#ffe27a");
      else if (d.surToi) dire("💥 Tu es touché ! (" + d.vie + "/" + C.char.vie + ")", "#ff7a6a");
    });
    radio.ecouter("detruit", (d) => {
      if (d.parToi) dire("💥 " + d.cible + " DÉTRUIT !", "#7dffa0", 2500);
      else if (d.equipeCible === "bleus" && !d.surToi) dire("⚠️ " + d.cible + " (allié) est détruit", "#ffb37a");
      else if (d.equipeCible === "rouges") dire("✅ " + d.tireur + " a détruit " + d.cible, "#9cc4ff");
    });
    radio.ecouter("tir-ami", (d) => {
      if (d.tireur === "toi") dire("⛔ Attention, c'est un allié !", "#ffb37a");
    });
  }

  function texte(t, x, y, taille, couleur, align) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', sans-serif";
    ctx.textAlign = align || "left";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(t, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(t, x, y);
  }
  function panneau(x, y, l, h) {
    ctx.fillStyle = "rgba(14,18,12,0.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, 10);
    ctx.fill();
  }

  function dessiner(monde) {
    ctx.clearRect(0, 0, L, H);
    const j = monde.joueur, f = j.fiche;
    if (monde.phase === "garage") {
      panneau(L / 2 - 260, H - 190, 520, 170);
      texte(f.drapeau + " " + f.nom, L / 2, H - 150, 32, "#ffe27a", "center");
      texte(f.pays + " · " + f.texte, L / 2, H - 122, 15, "#e8e4d6", "center");
      const barres = [["Vitesse", f.vitesseMax / 21, Math.round(f.vitesseMax * 3.6) + " km/h"], ["Recharge", 1.2 / f.recharge, f.recharge.toString().replace(".", ",") + " s"], ["Tourelle", f.tourelle / 1, Math.round((f.tourelle * 180) / Math.PI) + " °/s"]];
      barres.forEach(([nom, part, valeur], i) => {
        const y = H - 96 + i * 22;
        texte(nom, L / 2 - 240, y + 5, 14, "#e8e4d6");
        ctx.fillStyle = "rgba(255,255,255,.15)";
        ctx.fillRect(L / 2 - 80, y - 6, 220, 10);
        ctx.fillStyle = "#ffcf5a";
        ctx.fillRect(L / 2 - 80, y - 6, 220 * Math.min(1, part), 10);
        texte(valeur, L / 2 + 240, y + 5, 14, "#fff", "right");
      });
      texte("← → pour choisir ton tank · Entrée pour partir au combat", L / 2, 40, 20, "#fff", "center");
      texte("Toi + " + E.allies + " alliés 🔵  contre  " + E.ennemis + " ennemis 🔴", L / 2, 68, 17, "#e8e4d6", "center");
      return;
    }
    // Au-dessus de chaque tank : son nom et sa vie.
    for (const c of monde.chars) {
      if (c === j) continue;
      const e = Tanks.Scene.versEcran(c.x, c.y + 4.6, c.z, L, H);
      if (!e || e.x < -40 || e.x > L + 40) continue;
      const d = Math.hypot(c.x - j.x, c.z - j.z);
      const couleur = c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c.detruit) {
        if (d < 200) texte("✖", e.x, e.y, 14, "#999", "center");
        continue;
      }
      texte((c.equipe === "bleus" ? "▼ " : "◆ ") + c.nom + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y - 8, 13, couleur, "center");
      for (let k = 0; k < C.char.vie; k++) {
        ctx.fillStyle = k < c.vie ? couleur : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - 22 + k * 11, e.y - 2, 9, 4);
      }
    }
    // Le viseur : là où ton canon pointe (à la distance de la cible, ou à 150 m).
    const a = j.angle + j.tourelle, dv = j.cible ? Math.hypot(j.cible.x - j.x, j.cible.z - j.z) : C.char.porteeReticule;
    const yv = j.cible ? j.cible.y + 1.4 : T.hauteur(j.x + Math.cos(a) * dv, j.z + Math.sin(a) * dv) + 1;
    const v = Tanks.Scene.versEcran(j.x + Math.cos(a) * dv, yv, j.z + Math.sin(a) * dv, L, H);
    if (v && monde.phase === "bataille") {
      const rouge = !!j.cible;
      ctx.strokeStyle = rouge ? "#ff4a3d" : "rgba(255,255,255,.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 14, 0, Math.PI * 2);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        ctx.moveTo(v.x + dx * 8, v.y + dy * 8);
        ctx.lineTo(v.x + dx * 22, v.y + dy * 22);
      }
      ctx.stroke();
      if (rouge) texte("🎯 " + j.cible.nom + " · " + Math.round(dv) + " m", v.x, v.y + 40, 14, "#ff7a6a", "center");
    }
    // En haut : les équipes
    const bleus = Tanks.Monde.vivants(monde, "bleus"), rouges = Tanks.Monde.vivants(monde, "rouges");
    panneau(L / 2 - 150, 10, 300, 40);
    texte("🔵 " + bleus + " / " + (E.allies + 1), L / 2 - 34, 37, 20, E.bleus.marque, "right");
    texte("contre", L / 2, 36, 13, "#ccc", "center");
    texte(rouges + " / " + E.ennemis + " 🔴", L / 2 + 34, 37, 20, E.rouges.marque);
    // En bas à gauche : ta vie et la recharge
    panneau(12, H - 98, 280, 86);
    texte(f.drapeau + " " + f.nom, 24, H - 72, 17, "#ffe27a");
    for (let k = 0; k < C.char.vie; k++) {
      ctx.fillStyle = k < j.vie ? (j.vie <= 1 ? "#ff5a4a" : "#7dffa0") : "rgba(255,255,255,.12)";
      ctx.fillRect(24 + k * 34, H - 60, 30, 14);
    }
    texte("vie", 24 + C.char.vie * 34 + 4, H - 48, 13, "#ccc");
    const pret = j.recharge === 0;
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(24, H - 36, 200, 10);
    ctx.fillStyle = pret ? "#ffcf5a" : "#9a8a5a";
    ctx.fillRect(24, H - 36, 200 * (1 - j.recharge / f.recharge), 10);
    texte(pret ? "🔥 PRÊT (Espace)" : "recharge…", 232, H - 26, 13, pret ? "#ffcf5a" : "#ccc");
    // En bas à droite : la vitesse
    panneau(L - 150, H - 70, 138, 58);
    texte(Math.round(Math.abs(j.vitesse) * 3.6) + "", L - 60, H - 26, 34, "#fff", "right");
    texte("km/h", L - 22, H - 26, 13, "#ccc", "right");
    // La petite carte
    const tc = 160, x0 = L - tc - 12, y0 = 12, k = tc / C.monde.taille;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(carte, x0, y0, tc, tc);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.strokeRect(x0, y0, tc, tc);
    for (const c of monde.chars) {
      const px = x0 + tc / 2 + c.x * k, pz = y0 + tc / 2 + c.z * k;
      ctx.fillStyle = c.detruit ? "#555" : c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c === j) {
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(c.angle);
        ctx.fillStyle = "#ffe27a";
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-5, 5);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#ffe27a";
        ctx.beginPath();
        ctx.moveTo(px, pz);
        ctx.lineTo(px + Math.cos(a) * 14, pz + Math.sin(a) * 14); // (la direction du canon)
        ctx.stroke();
      } else ctx.fillRect(px - 2.5, pz - 2.5, 5, 5);
    }
    // Les messages (touché, détruit…)
    if (message && performance.now() < message.jusqua && message.texte) texte(message.texte, L / 2, 110, 26, message.couleur, "center");
    // La fin de la bataille
    if (monde.phase === "victoire" || monde.phase === "defaite") {
      const gagne = monde.phase === "victoire";
      panneau(L / 2 - 240, H / 2 - 90, 480, 170);
      texte(gagne ? "🏆 VICTOIRE !" : "💥 Ton tank est détruit…", L / 2, H / 2 - 40, 38, gagne ? "#7dffa0" : "#ff7a6a", "center");
      texte(gagne ? "Tous les tanks rouges sont détruits" : "Les Rouges ont gagné cette fois", L / 2, H / 2 - 6, 18, "#fff", "center");
      const S = Tanks.Sauvegarde.donnees;
      texte("Victoires : " + S.victoires + " · défaites : " + S.defaites + " · tanks détruits : " + S.detruits, L / 2, H / 2 + 24, 15, "#e8e4d6", "center");
      texte("Entrée : garage · R : rejouer", L / 2, H / 2 + 56, 17, "#ffe27a", "center");
    } else texte("↑ ↓ ← → rouler · Q / D tourelle · Espace tirer · C caméra · R recommencer", L / 2, H - 14, 13, "rgba(255,255,255,.85)", "center");
  }

  return { initialiser, dessiner };
})();
