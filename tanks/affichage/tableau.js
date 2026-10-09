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
// Étape 62 : le LAC (en bleu) sur la carte, les BATEAUX, les PORTAILS (des ronds de leur couleur) ; au-dessus des
// patrouilleurs ennemis, leur nom et leur vie ; dans ta vedette, son viseur, sa vie et son canon.
// Étape 67 : ta vie (soldat : 20 balles, tank : 16 obus) est une BARRE avec le nombre écrit ; « ➕ » quand elle remonte.
// Étape 65 : quand tu donnes un ORDRE, la radio te répond (« 📻 Bravo : Bien reçu ! ») et rappelle ce qui a été
// compris ; s'il n'a pas compris, des exemples ; l'ordre en cours reste écrit en haut, et au-dessus de chaque tank allié.
// Étape 64 : les AVIONS (nom, distance, vie au-dessus de chacun ; un petit triangle sur la carte), les alertes
// (« avions ennemis ! », « parachutistes ! ») ; dans la DCA, le viseur, le carré rouge sur l'avion visé et le petit rond
// « tire ici » DEVANT l'avion (là où il sera quand l'obus arrivera).
// Étape 63 : les ÎLES sur la carte ; les sous-marins ennemis (seulement quand ils sont à la surface : sous l'eau, on ne
// les voit pas !) ; dans ton sous-marin, sa PROFONDEUR (une jauge qui descend) et la cible de ta torpille.
// Il lit le monde, il ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Tableau = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, E = C.equipes;
  let ctx, L, H, carte = null, message = null, reponse = null, ordreEnCours = null;

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
    // (étape 62) le lac, et les portails
    const LAC = C.lac;
    c.fillStyle = "#3d6f86";
    c.beginPath();
    c.ellipse(n / 2 + LAC.x * k, n / 2 + LAC.z * k, LAC.rayonX * k, LAC.rayonZ * k, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#6e7d4c"; // (étape 63) les îles
    for (const i of LAC.iles) {
      c.beginPath();
      c.arc(n / 2 + i.x * k, n / 2 + i.z * k, Math.max(1.5, i.rayon * k), 0, Math.PI * 2);
      c.fill();
    }
    for (const paire of C.portails.paires) {
      [paire.a, paire.b].forEach(([x, z], i) => {
        c.strokeStyle = paire.couleurs[i];
        c.lineWidth = 2;
        c.beginPath();
        c.arc(n / 2 + x * k, n / 2 + z * k, 3.5, 0, Math.PI * 2);
        c.stroke();
      });
    }
    const radio = Tanks.Evenements;
    const dire = (texte, couleur, duree) => (message = { texte, couleur, jusqua: performance.now() + (duree || 1800) });
    radio.ecouter("touche", (d) => {
      if (d.parToi) dire(d.vie > 0 ? "🎯 Touché ! " + d.cible + " (" + d.vie + "/" + d.vieMax + ")" : "", "#ffe27a");
      else if (d.surToi) dire("💥 Tu es touché ! (" + d.vie + "/" + d.vieMax + ")", "#ff7a6a");
    });
    radio.ecouter("detruit", (d) => {
      if (d.parToi) dire((d.bateau ? "🌊 " + d.cible + " COULÉ !" : "💥 " + d.cible + " DÉTRUIT !"), "#7dffa0", 2500);
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
    radio.ecouter("portail", (d) => {
      if (d.quiToi) dire("🌀 Portail " + d.de + " → " + d.vers + " !", "#d8b4ff");
    });
    radio.ecouter("echoue", () => dire("⚓ Échoué ! Recule (↓)", "#ffb37a"));
    radio.ecouter("plongee", (d) => dire(d.toi ? "🐋 Plongée ! Les obus ne te touchent plus" : "🫧 " + d.nom + " plonge…", "#8fd3ff"));
    radio.ecouter("surface", (d) => dire(d.toi ? "🐋 Surface !" : "⚠️ " + d.nom + " fait surface : tire-lui dessus !", "#ffe27a"));
    radio.ecouter("torpille", (d) => d.surToi && dire("⚠️ TORPILLE ! Bouge !", "#ff7a6a"));
    radio.ecouter("ordre", (d) => {
      const qui = d.noms.length && !d.soldats ? d.noms.join(", ") : [d.tanks ? d.tanks + " tank" + (d.tanks > 1 ? "s" : "") : "", d.soldats ? d.soldats + " soldat" + (d.soldats > 1 ? "s" : "") : ""].filter(Boolean).join(" + ") || "personne";
      ordreEnCours = { texte: "📢 « " + d.texte + " » → " + qui + (d.quoi ? " : " + d.quoi : ""), jusqua: performance.now() + 30000 };
      dire(d.tanks + d.soldats ? "📢 " + qui + (d.quoi ? " " + d.quoi : "") : "📢 Personne pour obéir (ils sont tous tombés…)", "#ffe27a", 3500);
      const parleur = d.noms[0] || "Radio";
      reponse = { texte: "📻 " + parleur + " : " + d.reponse + (d.devines.length ? "  (j'ai compris " + d.devines.map(([a, b]) => "« " + b + " » pour « " + a + " »").join(", ") + ")" : ""), jusqua: performance.now() + 3500 };
    });
    radio.ecouter("ordre-incompris", (d) => {
      dire("❓ Je n'ai pas compris « " + d.texte + " »", "#ffb37a", 5000);
      reponse = { texte: "Essaie : " + d.exemples.slice(0, 5).join(" · "), jusqua: performance.now() + 5000 };
    });
    radio.ecouter("avion-arrive", () => dire("✈️ Avion ennemi en approche !", "#ff9a8a"));
    radio.ecouter("bombardement", (d) => dire(d.cible === "toi" ? "💣 Un avion ennemi te bombarde ! BOUGE !" : "💣 Bombardement sur " + d.cible + " !", "#ff7a6a"));
    radio.ecouter("duel", () => dire("⚔️ Un chasseur ennemi te prend en chasse !", "#ff7a6a"));
    radio.ecouter("missile-ennemi", () => dire("🚨 MISSILE ENNEMI ! Vire !", "#ff4a3d"));
    radio.ecouter("abattu", (d) => d.parToi && dire("🔥 " + d.cible + " ABATTU !", "#7dffa0", 2500));
    radio.ecouter("parachutistes", (d) => dire("🪂 " + d.nombre + " parachutistes " + (d.equipe === "bleus" ? "bleus (des renforts !)" : "ROUGES en approche !"), d.equipe === "bleus" ? "#9cc4ff" : "#ff9a8a"));
    radio.ecouter("nage", (d) => dire(d.nage ? "🏊 Tu nages (pas de tir dans l'eau)" : "🦶 Pied à terre", "#8fd3ff"));
    radio.ecouter("soldat-touche", (d) => {
      if (d.surToi && d.vie > 0) dire("🩹 Tu es touché ! (" + d.vie + "/" + C.soldats.vieJoueur + ")", "#ff7a6a");
    });
    radio.ecouter("soin-fini", (d) => dire("💚 " + (d.qui === "ton tank" ? "Ton tank est" : "Tu es") + " de nouveau en pleine forme !", "#7dffa0", 2000));
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
  // (étape 67) La barre de vie : verte, orange sous la moitié, rouge sous le quart ; « ➕ soin » quand elle remonte.
  function barreVie(x, y, l, o) {
    const part = Math.max(0, o.vie / o.vieMax);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(x, y, l, 14);
    ctx.fillStyle = part <= 0.25 ? "#ff5a4a" : part <= 0.5 ? "#ffb347" : "#7dffa0";
    ctx.fillRect(x, y, l * part, 14);
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.lineWidth = 1;
    for (let k = 1; k < o.vieMax; k++) { // (un petit trait par balle ou par obus : on peut encore les compter)
      ctx.beginPath();
      ctx.moveTo(x + (l * k) / o.vieMax, y);
      ctx.lineTo(x + (l * k) / o.vieMax, y + 14);
      ctx.stroke();
    }
    texte(o.vie + " / " + o.vieMax + (o.seSoigne ? "  ➕ soin" : ""), x + l + 8, y + 12, 13, o.seSoigne ? "#7dffa0" : "#ccc");
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
      barreVie(24, H - 80, 200, s);
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
        for (const x of monde.engins) voir(x, x.fiche.icone + " " + x.nom, x.sorte === "bateau" ? 7 : x.sorte === "sousmarin" ? 11 : 2);
        if (proche) texte("E : monter dans " + proche, L / 2, H - 120, 22, "#ffe27a", "center");
      }
      return;
    }
    if (e.sorte === "dca") {
      const R = C.engins.dca, a = e.angle + e.tourelle, h = e.hausse;
      const v = Tanks.Scene.versEcran(e.x + Math.cos(a) * Math.cos(h) * 400, e.y + 2.2 + Math.sin(h) * 400, e.z + Math.sin(a) * Math.cos(h) * 400, L, H);
      if (v) viseur(v, !!e.cible, 16);
      if (e.cible) {
        const c = Tanks.Scene.versEcran(e.cible.x, e.cible.y, e.cible.z, L, H);
        if (c) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(c.x - 20, c.y - 20, 40, 40); // (son nom est déjà écrit au-dessus de lui)
        }
        const p = e.avance && Tanks.Scene.versEcran(e.avance.x, e.avance.y, e.avance.z, L, H);
        if (p) {
          ctx.strokeStyle = "#ffe27a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.stroke();
          texte("visée assistée : tire !", p.x, p.y + 22, 12, "#ffe27a", "center");
        }
      }
      panneau(12, H - 98, 330, 86);
      texte(R.icone + " " + R.nom, 24, H - 72, 17, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie · hausse " + Math.round((h * 180) / Math.PI) + "°", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / R.cadence, e.recharge === 0, "Espace : tirer en l'air");
      return;
    }
    if (e.sorte === "sousmarin") {
      const R = C.sousMarins.joueur;
      if (e.cible) {
        const v = Tanks.Scene.versEcran(e.cible.x, C.lac.niveau + 1, e.cible.z, L, H);
        if (v) {
          ctx.strokeStyle = "#ff4a3d";
          ctx.lineWidth = 2;
          ctx.strokeRect(v.x - 18, v.y - 18, 36, 36);
          texte("🐟 torpille → " + e.cible.nom + " · " + Math.round(Math.hypot(e.cible.x - e.x, e.cible.z - e.z)) + " m", v.x, v.y + 34, 13, "#ff7a6a", "center");
        }
      }
      panneau(12, H - 98, 330, 86);
      texte(R.icone + " " + R.nom + (Tanks.SousMarins.sousLEau(e) ? " · sous l'eau 🫧" : " · à la surface"), 24, H - 72, 17, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / R.recharge, e.recharge === 0, e.recharge === 0 ? "🐟 torpille prête" : "recharge…");
      // la jauge de profondeur (à droite)
      panneau(L - 80, H - 250, 68, 170);
      texte("prof.", L - 46, H - 232, 12, "#ccc", "center");
      ctx.fillStyle = "rgba(60,130,170,.35)";
      ctx.fillRect(L - 58, H - 222, 24, 120);
      const k = e.profondeur / R.profondeurMax, kv = (e.voulue || 0) / R.profondeurMax;
      ctx.fillStyle = "#8fd3ff";
      ctx.fillRect(L - 58, H - 222, 24, 120 * k);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(L - 62, H - 222 + 120 * kv - 1, 32, 2);
      texte(e.profondeur.toFixed(1).replace(".", ",") + " m", L - 46, H - 88, 14, "#fff", "center");
      ctx.fillStyle = "#ff7a6a";
      ctx.fillRect(L - 62, H - 222 + 120 * (C.sousMarins.sousLEau / R.profondeurMax), 32, 1);
      return;
    }
    if (e.sorte === "bateau") {
      const R = C.bateaux.joueur, a = e.angle + e.tourelle, dv = e.cible ? Math.hypot(e.cible.x - e.x, e.cible.z - e.z) : 150;
      const v = Tanks.Scene.versEcran(e.x + Math.cos(a) * dv, e.cible ? e.cible.y + 1.4 : e.y + 1, e.z + Math.sin(a) * dv, L, H);
      if (v) {
        viseur(v, !!e.cible, 14);
        if (e.cible) texte("🎯 " + e.cible.nom + " · " + Math.round(dv) + " m", v.x, v.y + 40, 14, "#ff7a6a", "center");
      }
      panneau(12, H - 98, 330, 86);
      texte(R.icone + " " + R.nom, 24, H - 72, 17, "#ffe27a");
      cases(24, H - 60, R.vie, e.vie);
      texte("vie", 24 + R.vie * 30 + 4, H - 48, 13, "#ccc");
      barre(24, H - 36, 200, 1 - e.recharge / R.recharge, e.recharge === 0, e.recharge === 0 ? "🔥 PRÊT (Espace)" : "recharge…");
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
      for (const av of Tanks.Avions.enLAir(monde)) { // (étape 64 : un avion ennemi passe en premier)
        if (av.equipe === e.equipe) continue;
        const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(av.z - e.z, av.x - e.x) - e.angle), Math.cos(Math.atan2(av.z - e.z, av.x - e.x) - e.angle)));
        if (ecart < meilleur && Math.hypot(av.x - e.x, av.z - e.z) < 1200) (meilleur = ecart), (cible = av);
      }
      for (const c of cible ? [] : monde.chars) {
        if (c.detruit || c.equipe === e.equipe) continue;
        const ecart = Math.abs(Math.atan2(Math.sin(Math.atan2(c.z - e.z, c.x - e.x) - e.angle), Math.cos(Math.atan2(c.z - e.z, c.x - e.x) - e.angle)));
        if (ecart < meilleur && Math.hypot(c.x - e.x, c.z - e.z) < 700) (meilleur = ecart), (cible = c);
      }
      if (cible) {
        const v = Tanks.Scene.versEcran(cible.x, cible.y + (cible.genre === "avion" ? 0 : 1.5), cible.z, L, H);
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
      const ordre = c.equipe === "bleus" && c !== j ? Tanks.Ordres.enMots(c) : ""; // (étape 65 : son ordre)
      if (ordre) texte("📢 " + ordre, e.x, e.y - 24, 11, "#ffe27a", "center");
      ctx.fillStyle = "rgba(0,0,0,.45)"; // (sa vie : une petite barre)
      ctx.fillRect(e.x - 22, e.y - 2, 44, 4);
      ctx.fillStyle = couleur;
      ctx.fillRect(e.x - 22, e.y - 2, 44 * Math.max(0, c.vie / (c.vieMax || C.char.vie)), 4);
    }
    // (étape 62) Au-dessus des patrouilleurs ennemis : leur nom et leur vie.
    for (const b of monde.bateaux.concat(monde.sousMarins.filter((m) => !Tanks.SousMarins.sousLEau(m)))) {
      const e = Tanks.Scene.versEcran(b.x, b.y + 6, b.z, L, H), d = Math.hypot(b.x - ici.x, b.z - ici.z);
      if (!e || e.x < -40 || e.x > L + 40 || d > 450) continue;
      if (b.detruit) {
        if (d < 200) texte("✖", e.x, e.y, 14, "#999", "center");
        continue;
      }
      texte((b.genre === "sousmarin" ? "🐋 " : "⚓ ") + b.nom + (d > 120 ? " · " + Math.round(d) + " m" : ""), e.x, e.y - 8, 13, E.rouges.marque, "center");
      for (let k = 0; k < b.fiche.vie; k++) {
        ctx.fillStyle = k < b.vie ? E.rouges.marque : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - 16 + k * 11, e.y - 2, 9, 4);
      }
    }
    // (étape 64) Les avions : nom, distance et vie.
    for (const a of monde.avions) {
      if (a.etat === "attend" || a.etat === "parti" || a.detruit) continue;
      const e = Tanks.Scene.versEcran(a.x, a.y + 5, a.z, L, H), d = Math.hypot(a.x - ici.x, a.y - (ici.y || 0), a.z - ici.z);
      if (!e || e.x < -40 || e.x > L + 40 || d > 2500) continue;
      const couleur = a.equipe === "bleus" ? E.bleus.marque : E.rouges.marque;
      texte("✈️ " + a.nom + " · " + Math.round(d) + " m", e.x, e.y - 8, 13, couleur, "center");
      for (let k = 0; k < a.fiche.vie; k++) {
        ctx.fillStyle = k < a.vie ? couleur : "rgba(0,0,0,.45)";
        ctx.fillRect(e.x - a.fiche.vie * 5.5 + k * 11, e.y - 2, 9, 4);
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
    barreVie(24, H - 60, 170, j);
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
    for (const b of monde.bateaux.concat(monde.sousMarins.filter((m) => !Tanks.SousMarins.sousLEau(m)))) { // (étape 62) les patrouilleurs (et les sous-marins à la surface) : un petit losange rouge
      ctx.fillStyle = b.detruit ? "#555" : E.rouges.marque;
      ctx.beginPath();
      const bx = x0 + tc / 2 + b.x * k, bz = y0 + tc / 2 + b.z * k;
      ctx.moveTo(bx, bz - 4);
      ctx.lineTo(bx + 3, bz);
      ctx.lineTo(bx, bz + 4);
      ctx.lineTo(bx - 3, bz);
      ctx.fill();
    }
    for (const a of monde.avions) { // (étape 64) les avions : un petit triangle dans le sens où ils volent
      if (a.etat === "attend" || a.etat === "parti") continue;
      const ax = x0 + tc / 2 + a.x * k, az = y0 + tc / 2 + a.z * k;
      if (ax < x0 || ax > x0 + tc || az < y0 || az > y0 + tc) continue;
      ctx.save();
      ctx.translate(ax, az);
      ctx.rotate(a.angle);
      ctx.fillStyle = a.detruit ? "#555" : a.equipe === "bleus" ? "#9cc4ff" : "#ff6a5a";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.fill();
      ctx.restore();
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
    // (étape 65) la réponse de la radio, et l'ordre en cours (sous le compteur des soldats)
    if (reponse && performance.now() < reponse.jusqua) texte(reponse.texte, L / 2, 140, 16, "#e8f0ff", "center");
    const grandMessage = message && performance.now() < message.jusqua && message.texte;
    if (ordreEnCours && performance.now() < ordreEnCours.jusqua && !Tanks.BarreOrdres.ouverte && !grandMessage) texte(ordreEnCours.texte, L / 2, 88, 13, "rgba(255,226,122,.9)", "center");
    // La fin de la bataille
    if (monde.phase === "victoire" || monde.phase === "defaite") {
      const gagne = monde.phase === "victoire";
      panneau(L / 2 - 240, H / 2 - 90, 480, 170);
      const perdu = t.soldat && t.soldat.mort ? "💀 Ton soldat est à terre…" : t.mode === "jeep" ? "💥 Ton 4x4 est détruit…" : t.mode === "bateau" ? "🌊 Ta vedette est coulée…" : t.mode === "sousmarin" ? "🌊 Ton sous-marin est coulé…" : t.mode === "dca" ? "💥 Ta DCA est détruite…" : "💥 Ton tank est détruit…";
      texte(gagne ? "🏆 VICTOIRE !" : perdu, L / 2, H / 2 - 40, 38, gagne ? "#7dffa0" : "#ff7a6a", "center");
      texte(gagne ? "Tous les tanks rouges sont détruits" : "Les Rouges ont gagné cette fois", L / 2, H / 2 - 6, 18, "#fff", "center");
      const S = Tanks.Sauvegarde.donnees;
      texte("Victoires : " + S.victoires + " · défaites : " + S.defaites + " · tanks détruits : " + S.detruits, L / 2, H / 2 + 24, 15, "#e8e4d6", "center");
      texte("Entrée : garage · R : rejouer", L / 2, H / 2 + 56, 17, "#ffe27a", "center");
    } else {
      const aide = {
        char: "↑ ↓ ← → rouler · Q / D tourelle · Espace tirer · E sortir · T ordre · C caméra · R recommencer",
        pied: t.soldat && t.soldat.nage ? "↑ ↓ nager · ← → tourner · (pas de tir dans l'eau)" : "↑ ↓ marcher · ← → tourner · Espace tirer · 1 2 3 armes · E monter",
        jeep: "↑ ↓ ← → rouler · Q / D mitrailleuse · Espace tirer · E descendre (arrêté)",
        helico: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace bombe · E descendre (posé)",
        drone: "↑ ↓ avancer · ← → tourner · Q monter · D descendre · Espace grenade · E descendre (posé)",
        avion: "↑ piquer · ↓ cabrer · ← → virer · Espace missile · E s'éjecter",
        bateau: "↑ ↓ ← → naviguer · Q / D canon · Espace tirer · E descendre (près de la rive)",
        dca: "← → tourner les canons · ↑ ↓ les lever / baisser · Espace tirer · E descendre",
        sousmarin: "↑ ↓ ← → naviguer · D plonger · Q remonter · Espace torpille · E descendre (à la surface, près d'une rive)",
      }[t.mode];
      texte(aide, L / 2, H - 14, 13, "rgba(255,255,255,.85)", "center");
    }
  }

  return { initialiser, dessiner };
})();
