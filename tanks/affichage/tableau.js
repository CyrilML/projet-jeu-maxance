// 📟 LE TABLEAU DE BORD : ce qu'on écrit par-dessus l'image 3D (étape 60)
//
// En bataille : ta VIE (4 cases : une par obus que tu peux encore encaisser), la RECHARGE du canon (une barre qui se
// remplit), le VISEUR (là où va ton obus ; il devient rouge quand la visée assistée a trouvé un ennemi), le nombre de
// tanks vivants dans chaque équipe, une petite CARTE du champ de bataille, et au-dessus de chaque tank son nom et sa
// vie (bleu = ton équipe, rouge = les ennemis). Au garage : le tank choisi, son drapeau et ses qualités.
// Étape 61 : l'écran change selon où tu es. À PIED : ta vie de soldat (5 cases), tes 3 armes (1, 2, 3) ; dans un
// ENGIN : sa vie ou ses bombes et missiles, sa hauteur ; en hélico, une croix au sol montre où tombera la bombe ; en
// avion, un carré rouge montre l'ennemi que le missile va suivre. « E : monter » apparaît quand un engin est tout près.
// Sur la carte : les soldats (petits points) et les engins de ton camp.
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
    // étape 61
    radio.ecouter("impossible", (d) => dire("✋ " + d.raison, "#ffb37a"));
    radio.ecouter("monter", (d) => dire("🪜 Tu montes dans " + d.dans, "#9cc4ff"));
    radio.ecouter("sortir", () => dire("🪖 À pied ! (1 pistolet · 2 mitrailleuse · 3 lance-roquettes)", "#9cc4ff", 2500));
    radio.ecouter("ejection", () => dire("🪂 ÉJECTION !", "#ffe27a"));
    radio.ecouter("soldat-mort", (d) => {
      if (d.parToi) dire("✖ " + d.cible + " à terre", "#7dffa0");
      else if (d.surToi) dire("💀 Tu es à terre…", "#ff7a6a", 2500);
    });
    radio.ecouter("soldat-touche", (d) => {
      if (d.surToi && d.vie > 0) dire("🩹 Tu es touché ! (" + d.vie + "/" + C.soldats.vieJoueur + ")", "#ff7a6a");
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

  // Un petit viseur rond.
  function viseur(v, rouge, taille) {
    ctx.strokeStyle = rouge ? "#ff4a3d" : "rgba(255,255,255,.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(v.x, v.y, taille, 0, Math.PI * 2);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      ctx.moveTo(v.x + dx * taille * 0.55, v.y + dy * taille * 0.55);
      ctx.lineTo(v.x + dx * taille * 1.6, v.y + dy * taille * 1.6);
    }
    ctx.stroke();
  }
  function cases(x, y, n, plein, couleur) {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k < plein ? (plein <= 1 ? "#ff5a4a" : couleur || "#7dffa0") : "rgba(255,255,255,.12)";
      ctx.fillRect(x + k * 30, y, 26, 14);
    }
  }
  function barre(x, y, l, part, pret, texteBarre) {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x, y, l, 10);
    ctx.fillStyle = pret ? "#ffcf5a" : "#9a8a5a";
    ctx.fillRect(x, y, l * Math.max(0, Math.min(1, part)), 10);
    if (texteBarre) texte(texteBarre, x + l + 8, y + 10, 13, pret ? "#ffcf5a" : "#ccc");
  }

  // Étape 61 : ce que tu vois quand tu n'es pas dans ton tank (à pied, ou dans un engin).
  function horsDuTank(monde) {
    const t = monde.toi, s = t.soldat, e = t.engin;
    if (t.mode === "pied") {
      // le viseur : 40 m devant toi, à hauteur d'homme
      const v = Tanks.Scene.versEcran(s.x + Math.cos(s.angle) * 40, s.y + 1.4, s.z + Math.sin(s.angle) * 40, L, H);
      if (v && !s.parachute) viseur(v, false, 10);
      panneau(12, H - 118, 330, 106);
      texte(s.parachute ? "🪂 En parachute…" : "🪖 À pied", 24, H - 92, 17, "#ffe27a");
      cases(24, H - 80, C.soldats.vieJoueur, s.vie);
      texte("vie", 24 + C.soldats.vieJoueur * 30 + 4, H - 68, 13, "#ccc");
      ["pistolet", "mitrailleuse", "roquettes"].forEach((a, i) => {
        const x = 24 + i * 104, choisi = s.arme === a;
        ctx.fillStyle = choisi ? "rgba(255,207,90,.3)" : "rgba(255,255,255,.08)";
        ctx.fillRect(x, H - 58, 98, 24);
        texte(i + 1 + " " + C.armes[a].icone + " " + C.armes[a].nom.replace("Lance-roquettes", "Roquettes"), x + 49, H - 41, 12, choisi ? "#ffe27a" : "#ccc", "center");
      });
      barre(24, H - 28, 200, 1 - s.recharge / C.armes[s.arme].cadence, s.recharge === 0, s.recharge === 0 ? "🔥 Espace : tirer" : "recharge…");
      // E : monter ? (le plus proche, à moins de 6 m)
      if (!s.parachute) {
        let proche = null, dmin = C.engins.distanceMonter;
        const voir = (x, nom, rayon) => {
          if (x.detruit) return;
          const d = Math.hypot(x.x - s.x, x.z - s.z) - rayon;
          if (d < dmin) (dmin = d), (proche = nom);
        };
        voir(monde.joueur, "ton tank", C.char.rayon);
        for (const x of monde.engins) voir(x, C.engins[x.sorte].icone + " " + x.nom, 2);
        if (proche) texte("E : monter dans " + proche, L / 2, H - 120, 22, "#ffe27a", "center");
      }
      return;
    }
    const R = C.engins[e.sorte], haut = e.y - T.hauteur(e.x, e.z);
    if (e.sorte === "jeep") {
      const a = e.angle + e.tourelle;
      const v = Tanks.Scene.versEcran(e.x + Math.cos(a) * 60, e.y + 2, e.z + Math.sin(a) * 60, L, H);
      if (v) viseur(v, false, 12);
    } else if (e.sorte === "helico" || e.sorte === "drone") {
      // la bombe garde la vitesse de l'engin : elle tombe en √(2h ÷ g) secondes, et avance pendant ce temps
      const g = C.projectiles[R.arme].gravite, chute = Math.sqrt((2 * Math.max(0, haut)) / g), d = e.vitesse * chute;
      const px = e.x + Math.cos(e.angle) * d, pz = e.z + Math.sin(e.angle) * d;
      const v = Tanks.Scene.versEcran(px, T.hauteur(px, pz), pz, L, H);
      if (v && e.enVol) {
        ctx.strokeStyle = "#ff4a3d";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(v.x - 12, v.y - 12);
        ctx.lineTo(v.x + 12, v.y + 12);
        ctx.moveTo(v.x + 12, v.y - 12);
        ctx.lineTo(v.x - 12, v.y + 12);
        ctx.stroke();
        texte("💣 tombera ici (" + virgule(chute) + " s)", v.x, v.y + 30, 13, "#ff9a8a", "center");
      }
    } else if (e.sorte === "avion") {
      // la cible du missile : le tank ennemi le plus en face (dans un cône de 25°), comme dans logique/engins.js
      let cible = null, meilleur = 0.45;
      for (const c of monde.chars) {
        if (c.detruit || c.equipe === e.equipe) continue;
        const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(c.z - e.z, c.x - e.x) - e.angle), Math.cos(Math.atan2(c.z - e.z, c.x - e.x) - e.angle)));
        if (ecart < meilleur && Math.hypot(c.x - e.x, c.z - e.z) < 700) (meilleur = ecart), (cible = c);
      }
      if (cible) {
        const v = Tanks.Scene.versEcran(cible.x, cible.y + 1.5, cible.z, L, H);
        if (v) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);
          texte("🚀 " + cible.nom + " · " + Math.round(Math.hypot(cible.x - e.x, cible.z - e.z)) + " m", v.x, v.y + 34, 13, "#ff7a6a", "center");
        }
      }
    }
    panneau(12, H - 98, 330, 86);
    texte(R.icone + " " + R.nom, 24, H - 72, 17, "#ffe27a");
    if (e.sorte === "jeep") {
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / C.armes.mitrailleuse.cadence, e.recharge === 0, "Espace : mitrailleuse");
    } else {
      cases(24, H - 60, R.munitions, e.munitions, "#ffcf5a");
      texte(e.munitions + " " + (R.arme === "missile" ? "missiles" : R.arme === "bombe" ? "bombes" : "grenades"), 24 + R.munitions * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, e.munitions < R.munitions ? e.rechargeMunition / R.recharge : 1, e.munitions > 0, e.munitions < R.munitions ? "+1 dans " + virgule(R.recharge - e.rechargeMunition) + " s" : "plein");
    }
    // la hauteur (pour ceux qui volent)
    if (e.sorte !== "jeep") {
      panneau(L - 150, H - 134, 138, 58);
      texte(Math.round(haut) + "", L - 60, H - 90, 30, haut < 6 && e.enVol ? "#ff7a6a" : "#fff", "right");
      texte("m haut", L - 16, H - 90, 13, "#ccc", "right");
    }
  }
  const virgule = (n) => (n || 0).toFixed(1).replace(".", ",");

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
    const t = monde.toi || { mode: "char" }, dansLeTank = t.mode === "char";
    const ici = dansLeTank ? j : t.engin || t.soldat; // (là où tu es)
    // Au-dessus de chaque tank : son nom et sa vie (et ton tank aussi, quand tu n'es pas dedans).
    for (const c of monde.chars) {
      if (c === j && dansLeTank) continue;
      const e = Tanks.Scene.versEcran(c.x, c.y + 4.6, c.z, L, H);
      if (!e || e.x < -40 || e.x > L + 40) continue;
      const d = Math.hypot(c.x - ici.x, c.z - ici.z);
      const couleur = c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c.detruit) {
        if (d < 200) texte("✖", e.x, e.y, 14, "#999", "center");
        continue;
      }
      texte((c.equipe === "bleus" ? "▼ " : "◆ ") + (c === j ? "ton tank" : c.nom) + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y - 8, 13, couleur, "center");
      for (let k = 0; k < C.char.vie; k++) {
        ctx.fillStyle = k < c.vie ? couleur : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - 22 + k * 11, e.y - 2, 9, 4);
      }
    }
    // Les soldats ennemis tout près (moins de 120 m) : un petit losange rouge au-dessus de leur tête.
    for (const o of monde.soldats) {
      if (o.mort || o.equipe !== "rouges" || Math.hypot(o.x - ici.x, o.z - ici.z) > 120) continue;
      const e = Tanks.Scene.versEcran(o.x, o.y + 2.3, o.z, L, H);
      if (e) texte("◆", e.x, e.y, 10, E.rouges.marque, "center");
    }
    // Le viseur : là où ton canon pointe (à la distance de la cible, ou à 150 m).
    const a = j.angle + j.tourelle, dv = j.cible ? Math.hypot(j.cible.x - j.x, j.cible.z - j.z) : C.char.porteeReticule;
    const yv = j.cible ? j.cible.y + 1.4 : T.hauteur(j.x + Math.cos(a) * dv, j.z + Math.sin(a) * dv) + 1;
    const v = Tanks.Scene.versEcran(j.x + Math.cos(a) * dv, yv, j.z + Math.sin(a) * dv, L, H);
    if (!dansLeTank) horsDuTank(monde);
    if (v && monde.phase === "bataille" && dansLeTank) {
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
    const sb = Tanks.Monde.soldatsVivants(monde, "bleus"), sr = Tanks.Monde.soldatsVivants(monde, "rouges");
    texte("🪖 " + sb + " / " + C.soldats.parEquipe + "   soldats   " + sr + " / " + C.soldats.parEquipe + " 🪖", L / 2, 68, 14, "#e8e4d6", "center");
    // En bas à gauche : ta vie et la recharge
    if (dansLeTank) {
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
    }
    // En bas à droite : la vitesse
    panneau(L - 150, H - 70, 138, 58);
    texte(Math.round(Math.abs(ici.vitesse || 0) * 3.6) + "", L - 60, H - 26, 34, "#fff", "right");
    texte("km/h", L - 22, H - 26, 13, "#ccc", "right");
    // La petite carte
    const tc = 160, x0 = L - tc - 12, y0 = 12, k = tc / C.monde.taille;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(carte, x0, y0, tc, tc);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.strokeRect(x0, y0, tc, tc);
    for (const o of monde.soldats) { // (étape 61) les soldats : des petits points
      if (o.mort || o.joueur) continue;
      ctx.fillStyle = o.equipe === "bleus" ? "#9cc4ff" : "#ff9a8a";
      ctx.fillRect(x0 + tc / 2 + o.x * k - 1, y0 + tc / 2 + o.z * k - 1, 2, 2);
    }
    for (const e of monde.engins) { // les engins de ton camp : un petit carré blanc
      if (e === t.engin) continue;
      ctx.fillStyle = e.detruit ? "#555" : "#fff";
      ctx.fillRect(x0 + tc / 2 + e.x * k - 2, y0 + tc / 2 + e.z * k - 2, 4, 4);
    }
    for (const c of monde.chars.concat(dansLeTank ? [] : [Object.assign({}, ici, { toi: true })])) {
      const px = x0 + tc / 2 + c.x * k, pz = y0 + tc / 2 + c.z * k;
      ctx.fillStyle = c.detruit ? "#555" : c.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      if (c.toi || (c === j && dansLeTank)) {
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
        if (c === j) {
          ctx.strokeStyle = "#ffe27a";
          ctx.beginPath();
          ctx.moveTo(px, pz);
          ctx.lineTo(px + Math.cos(a) * 14, pz + Math.sin(a) * 14); // (la direction du canon)
          ctx.stroke();
        }
      } else ctx.fillRect(px - 2.5, pz - 2.5, 5, 5);
    }
    // Les messages (touché, détruit…)
    if (message && performance.now() < message.jusqua && message.texte) texte(message.texte, L / 2, 110, 26, message.couleur, "center");
    // La fin de la bataille
    if (monde.phase === "victoire" || monde.phase === "defaite") {
      const gagne = monde.phase === "victoire";
      panneau(L / 2 - 240, H / 2 - 90, 480, 170);
      const perdu = t.soldat && t.soldat.mort ? "💀 Ton soldat est à terre…" : t.mode === "jeep" ? "💥 Ton 4x4 est détruit…" : "💥 Ton tank est détruit…";
      texte(gagne ? "🏆 VICTOIRE !" : perdu, L / 2, H / 2 - 40, 38, gagne ? "#7dffa0" : "#ff7a6a", "center");
      texte(gagne ? "Tous les tanks rouges sont détruits" : "Les Rouges ont gagné cette fois", L / 2, H / 2 - 6, 18, "#fff", "center");
      const S = Tanks.Sauvegarde.donnees;
      texte("Victoires : " + S.victoires + " · défaites : " + S.defaites + " · tanks détruits : " + S.detruits, L / 2, H / 2 + 24, 15, "#e8e4d6", "center");
      texte("Entrée : garage · R : rejouer", L / 2, H / 2 + 56, 17, "#ffe27a", "center");
    } else {
      const aide = {
        char: "↑ ↓ ← → rouler · Q / D tourelle · Espace tirer · E sortir · C caméra · R recommencer",
        pied: "↑ ↓ marcher · ← → tourner · Espace tirer · 1 2 3 armes · E monter",
        jeep: "↑ ↓ ← → rouler · Q / D mitrailleuse · Espace tirer · E descendre (arrêté)",
        helico: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace bombe · E descendre (posé)",
        drone: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace grenade · E descendre (posé)",
        avion: "↑ piquer · ↓ cabrer · ← → virer · Espace missile · E s'éjecter",
      }[t.mode];
      texte(aide, L / 2, H - 14, 13, "rgba(255,255,255,.85)", "center");
    }
  }

  return { initialiser, dessiner };
})();
