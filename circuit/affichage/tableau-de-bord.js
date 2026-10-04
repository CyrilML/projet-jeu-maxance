// 🧭 LE TABLEAU DE BORD : les écritures par-dessus la 3D
//
// Par-dessus l'image 3D, on pose une deuxième toile, transparente, en 2D (comme une vitre).
// On y écrit ce que le pilote doit savoir : le tour, le chrono, le compteur de vitesse,
// la mini-carte, le feu de départ, et les messages (« Dans l'herbe ! », « Arrivée ! »).
//
// Aux rayons X, on y écrit aussi des étiquettes « accrochées » à des points du monde 3D :
// pour savoir où les placer, on demande aux maths 3D « où tombe ce point sur l'écran ? ».
//
// Ce fichier LIT le monde, il ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.TableauDeBord = (function () {
  const C = Circuit.CONFIG;
  const W = C.ecran.largeur, H = C.ecran.hauteur;
  let ctx = null;

  function initialiser(canvas) {
    ctx = canvas.getContext("2d");
  }

  // 83,456 s → « 1:23,45 »
  function chrono(secondes) {
    if (secondes === null || secondes === undefined) return "—";
    const min = Math.floor(secondes / 60);
    const s = secondes - min * 60;
    return min + ":" + s.toFixed(2).padStart(5, "0").replace(".", ",");
  }

  // sansContour : pour un texte foncé sur un fond clair (le contour noir le rendrait flou).
  function texte(t, x, y, taille, couleur, alignement, sansContour) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', system-ui, sans-serif";
    ctx.textAlign = alignement || "left";
    ctx.lineWidth = Math.max(3, taille / 6);
    ctx.strokeStyle = "rgba(0,0,0,.65)";
    if (!sansContour) ctx.strokeText(t, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(t, x, y);
  }

  function panneau(x, y, l, h) {
    ctx.fillStyle = "rgba(10,14,30,.6)";
    ctx.beginPath();
    ctx.roundRect(x, y, l, h, 10);
    ctx.fill();
  }

  function dessiner(monde, options, sauvegarde) {
    ctx.clearRect(0, 0, W, H);
    const v = monde.voiture;
    if (monde.phase === "cartes") {
      dessinerCartes(monde);
      return;
    }
    if (monde.phase === "garage") {
      dessinerGarage(monde, sauvegarde);
      if (options.rayonsX && monde.carte === "course") dessinerEtiquettesRayonsX(monde);
      return;
    }
    if (monde.phase === "balade") {
      dessinerBalade(monde, options, sauvegarde);
      return;
    }

    // En haut à gauche : tour et chronos
    panneau(12, 12, 230, 160);
    texte("Tour " + Math.min(monde.tour, C.course.tours) + " / " + C.course.tours, 24, 42, 26, "#ffe27a");
    texte("⏱ " + chrono(monde.chronoTour), 24, 70, 20);
    const dernier = monde.tempsDesTours[monde.tempsDesTours.length - 1];
    texte("Dernier tour : " + chrono(dernier), 24, 94, 15, "#cfd6ff");
    texte("Record du tour : " + chrono(sauvegarde.meilleurTour), 24, 114, 15, "#cfd6ff");
    // Étape 34 : la position et l'adversaire
    const adv = monde.adversaire;
    texte(monde.position === 1 ? "🥇 1er / 2" : "🥈 2e / 2", 24, 142, 22, monde.position === 1 ? "#7dffa0" : "#ffb37a");
    texte("🔵 Adversaire : tour " + Math.min(adv.tour, C.course.tours) + " / " + C.course.tours, 24, 164, 15, "#9cc4ff");

    // En bas à droite : le compteur de vitesse
    const kmh = Math.round(Math.abs(v.vitesse) * 3.6);
    panneau(W - 190, H - 92, 178, 80);
    texte(kmh + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");
    // une barre qui se remplit avec la vitesse
    const part = Math.min(1, Math.abs(v.vitesse) / v.vitesseMax);
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(W - 176, H - 26, 150, 6);
    ctx.fillStyle = v.vitesse < 0 ? "#7fb2ff" : part > 0.85 ? "#ff6b4a" : "#ffe27a";
    ctx.fillRect(W - 176, H - 26, 150 * part, 6);
    if (v.vitesse < -0.1) texte("marche arrière", W - 101, H - 70, 13, "#7fb2ff", "center");

    dessinerMiniCarte(monde);

    // Étape 36 : les pièces, sous la mini-carte.
    panneau(W - 160, 106, 148, 52);
    texte("🪙 " + monde.piecesCourse + " / " + C.pieces.nombre, W - 148, 130, 20, "#ffd34d");
    texte("porte-monnaie : " + sauvegarde.pieces, W - 148, 150, 13, "#cfd6ff");

    // Les messages au milieu
    if (monde.phase === "decompte") {
      dessinerFeux(Math.ceil(monde.decompte));
    } else if (monde.phase === "course") {
      if (monde.chronoCourse < 1.2) texte("GO !", W / 2, H / 2 - 40, 72, "#7dffa0", "center");
      if (monde.enContact) texte("💥 BOUM !", W / 2, H / 2 + 70, 30, "#ff6b4a", "center");
      if (monde.sol === "herbe") texte("🌱 Dans l'herbe : ça freine !", W / 2, 70, 24, "#ffb37a", "center");
      if (monde.tempsDesTours.length && monde.chronoTour < 2.5) {
        texte("Tour " + monde.tempsDesTours.length + " : " + chrono(dernier), W / 2, H / 2 - 60, 30, "#ffe27a", "center");
      }
    } else if (monde.phase === "arrivee") {
      panneau(W / 2 - 230, H / 2 - 135, 460, 260);
      texte("🏁 Gagné ! Tu es 1er !", W / 2, H / 2 - 93, 38, "#ffe27a", "center");
      texte("Temps total : " + chrono(monde.chronoCourse), W / 2, H / 2 - 54, 24, "#fff", "center");
      if (monde.resultat) texte("La voiture bleue était à " + monde.resultat.avance.toLocaleString("fr-FR") + " m derrière toi", W / 2, H / 2 - 26, 17, "#9cc4ff", "center");
      monde.tempsDesTours.forEach((t, i) => texte("Tour " + (i + 1) + " : " + chrono(t), W / 2, H / 2 + 2 + i * 22, 17, "#cfd6ff", "center"));
      if (Circuit.Sauvegarde.recordDerniereCourse) texte("🏆 Nouveau record !", W / 2, H / 2 + 80, 22, "#7dffa0", "center");
      texte("🪙 +" + monde.piecesCourse + " pièces · Entrée : retour au garage", W / 2, H / 2 + 108, 18, "#ffd34d", "center");
    } else if (monde.phase === "perdu") {
      panneau(W / 2 - 230, H / 2 - 110, 460, 200);
      texte("😢 Perdu !", W / 2, H / 2 - 64, 42, "#ff8a7a", "center");
      texte("La voiture bleue a fini ses " + C.course.tours + " tours avant toi", W / 2, H / 2 - 24, 20, "#fff", "center");
      texte("(en " + chrono(monde.chronoCourse) + ")", W / 2, H / 2 + 2, 17, "#9cc4ff", "center");
      if (monde.resultat) texte("Il te restait " + monde.resultat.retard.toLocaleString("fr-FR") + " m à faire", W / 2, H / 2 + 30, 18, "#cfd6ff", "center");
      texte("🪙 +" + monde.piecesCourse + " pièces gardées quand même !", W / 2, H / 2 + 58, 18, "#ffd34d", "center");
      texte("Entrée : retour au garage, puis la revanche !", W / 2, H / 2 + 82, 18, "#7dffa0", "center");
    }

    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.ralenti) texte("🐢 Ralenti", 260, 40, 18, "#cfd6ff");
    if (options.rayonsX) dessinerEtiquettesRayonsX(monde);
  }

  // Étape 36 : l'écran du garage. La voiture tourne en 3D derrière (voir affichage/scene3d.js).
  function dessinerGarage(monde, sauvegarde) {
    const g = monde.garage;
    const liste = Circuit.Garage.liste(); // étape 37 : le garage de la carte choisie
    const voiture = liste[g.index];
    const statut = Circuit.Garage.statut(g.index);
    const max = {
      vitesseMax: Math.max(...liste.map((v) => v.vitesseMax)),
      acceleration: Math.max(...liste.map((v) => v.acceleration)),
    };

    panneau(W / 2 - 240, 12, 480, 50);
    const nomCarte = (C.cartes.find((c) => c.id === monde.carte) || {}).nom || "";
    texte("🏠 Garage · " + nomCarte, W / 2 - 225, 46, 24, "#ffe27a");
    texte("🪙 " + sauvegarde.pieces, W / 2 + 225, 46, 24, "#ffd34d", "right");

    // Les 5 places du garage, en petit : ✅ à toi, 🔒 pas encore.
    liste.forEach((v, i) => {
      const x = W / 2 + (i - (liste.length - 1) / 2) * 64;
      const ici = i === g.index;
      ctx.fillStyle = ici ? "rgba(255,226,122,.9)" : "rgba(10,14,30,.6)";
      ctx.beginPath();
      ctx.roundRect(x - 26, 72, 52, 34, 8);
      ctx.fill();
      texte((Circuit.Garage.possede(v.id) ? "✅" : "🔒") + (i + 1), x, 96, 16, ici ? "#1a1a1a" : "#fff", "center", ici);
    });

    // La fiche de la voiture, en bas.
    panneau(W / 2 - 300, H - 178, 600, 166);
    texte("◀", W / 2 - 280, H - 140, 26, "#cfd6ff");
    texte("▶", W / 2 + 280, H - 140, 26, "#cfd6ff", "right");
    texte(voiture.nom, W / 2, H - 140, 28, "#fff", "center");
    // Les barres de qualités (comparées à la Formule 1, la plus forte).
    const barre = (y, nom, valeur, total, texteValeur) => {
      texte(nom, W / 2 - 250, y, 15, "#cfd6ff");
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(W / 2 - 110, y - 11, 260, 10);
      ctx.fillStyle = "#ffe27a";
      ctx.fillRect(W / 2 - 110, y - 11, (260 * valeur) / total, 10);
      texte(texteValeur, W / 2 + 250, y, 15, "#fff", "right");
    };
    barre(H - 108, "Vitesse max", voiture.vitesseMax, max.vitesseMax, Math.round(voiture.vitesseMax * 3.6) + " km/h");
    barre(H - 84, "Accélération", voiture.acceleration, max.acceleration, voiture.acceleration + " m/s²");

    let action, couleur;
    if (statut === "a-toi") {
      action = "✅ À toi · Entrée : rouler avec elle";
      couleur = "#7dffa0";
    } else if (statut === "achetable") {
      action = "🪙 " + voiture.prix + " pièces · Entrée : l'acheter";
      couleur = "#ffd34d";
    } else {
      action = "🔒 " + voiture.prix + " pièces · il t'en manque " + (voiture.prix - sauvegarde.pieces);
      couleur = "#ffb37a";
    }
    texte(g.message || action, W / 2, H - 50, 20, g.message ? "#7dffa0" : couleur, "center");
    texte("← → changer de voiture · ⌫ changer de carte · ramasse les pièces 🪙 pour en acheter", W / 2, H - 24, 14, "#cfd6ff", "center");
  }

  // Étape 37 : l'écran « Choisis ta carte ».
  function dessinerCartes(monde) {
    panneau(W / 2 - 230, 30, 460, 56);
    texte("🗺️ Choisis ta carte", W / 2, 70, 32, "#ffe27a", "center");
    const n = C.cartes.length, largeur = 270, ecart = 20;
    const gauche = W / 2 - (n * largeur + (n - 1) * ecart) / 2;
    C.cartes.forEach((carte, i) => {
      const x = gauche + i * (largeur + ecart), y = 130;
      const ici = i === monde.choixCarte;
      const prete = carte.id !== "ville";
      ctx.fillStyle = ici ? "rgba(255,226,122,.92)" : "rgba(10,14,30,.72)";
      ctx.beginPath();
      ctx.roundRect(x, y, largeur, 230, 14);
      ctx.fill();
      const couleur = ici ? "#1a1a1a" : "#fff";
      texte(carte.icone, x + largeur / 2, y + 80, 60, couleur, "center", ici);
      texte((i + 1) + ". " + carte.nom, x + largeur / 2, y + 135, 26, couleur, "center", ici);
      texte(carte.texte, x + largeur / 2, y + 170, 13, ici ? "#333" : "#cfd6ff", "center", ici);
      if (!prete) texte("🚧 en construction", x + largeur / 2, y + 205, 16, ici ? "#7a3b00" : "#ffb37a", "center", ici);
    });
    if (monde.messageCarte) texte(monde.messageCarte, W / 2, 400, 20, "#ffb37a", "center");
    panneau(W / 2 - 250, H - 80, 500, 50);
    texte("← → ou 1 2 3 pour choisir · Entrée pour aller au garage", W / 2, H - 48, 18, "#cfd6ff", "center");
  }

  // Étape 37 : pendant la balade sur le parcours.
  function dessinerBalade(monde, options, sauvegarde) {
    const v = monde.voiture;
    panneau(12, 12, 250, 112);
    texte("🎢 Le parcours", 24, 42, 24, "#ffe27a");
    texte("🪙 " + monde.piecesCourse + " / " + monde.pieces.length + " pièces trouvées", 24, 68, 17, "#ffd34d");
    texte("porte-monnaie : " + sauvegarde.pieces, 24, 90, 14, "#cfd6ff");
    texte("📦 cartons défoncés : " + monde.cartonsCasses, 24, 112, 14, "#cfd6ff");

    // Le compteur de vitesse et la hauteur.
    panneau(W - 190, H - 92, 178, 80);
    texte(Math.round(Math.abs(v.vitesse) * 3.6) + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");
    if (v.y > 0.3) texte("↕ " + v.y.toFixed(1).replace(".", ",") + " m de haut", W - 101, H - 104, 18, "#7dffa0", "center");

    dessinerMiniCarteParcours(monde);

    if (monde.message && monde.temps < monde.message.jusqua) texte(monde.message.texte, W / 2, H / 2 - 70, 36, "#ffe27a", "center");
    if (monde.boucle) texte("🎢 " + Math.round((monde.boucle.theta * 180) / Math.PI) + "°", W / 2, 120, 26, "#fff", "center");
    texte("R : retour au départ · ⌫ : changer de carte", 24, H - 22, 14, "#cfd6ff");
    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.ralenti) texte("🐢 Ralenti", 280, 40, 18, "#cfd6ff");
    if (options.rayonsX) dessinerEtiquettesParcours(monde);
  }

  // La mini-carte du parcours : les formes, les loopings, les pièces et la voiture, vus d'en haut.
  function dessinerMiniCarteParcours(monde) {
    const taille = 136;
    const echelle = taille / C.parcours.taille;
    const cx = W - 12 - taille / 2, cz = 12 + taille / 2;
    panneau(W - 12 - taille - 6, 6, taille + 12, taille + 12);
    for (const f of Circuit.Parcours.formes) {
      ctx.fillStyle = f.nom === "mur de tunnel" ? "#9aa0a8" : f.type === "pente" ? "#f0a040" : "#c9a676";
      ctx.save();
      ctx.translate(cx + f.x * echelle, cz + f.z * echelle);
      ctx.rotate(f.angle);
      ctx.fillRect(-f.demiLongueur * echelle, -f.demiLargeur * echelle, Math.max(2, 2 * f.demiLongueur * echelle), Math.max(2, 2 * f.demiLargeur * echelle));
      ctx.restore();
    }
    ctx.strokeStyle = "#ff5a4a";
    ctx.lineWidth = 2;
    for (const l of Circuit.Parcours.loopings) {
      ctx.beginPath();
      ctx.arc(cx + l.x * echelle, cz + l.z * echelle, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffd34d";
    for (const p of monde.pieces) if (!p.prise) ctx.fillRect(cx + p.x * echelle - 1, cz + p.z * echelle - 1, 2, 2);
    const v = monde.voiture;
    ctx.save();
    ctx.translate(cx + v.x * echelle, cz + v.z * echelle);
    ctx.rotate(v.angle);
    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Aux rayons X sur le parcours : la hauteur des formes et la vitesse qu'il faut pour les loopings.
  function dessinerEtiquettesParcours(monde) {
    const vp = Circuit.Scene3D.vueProjection;
    for (const f of Circuit.Parcours.formes) {
      if (f.nom === "mur de tunnel" || f.nom === "descente") continue;
      const e = Circuit.Maths3D.versEcran(vp, f.x, f.hauteur + 1.5, f.z, W, H);
      if (e && e.x > -50 && e.x < W + 50 && e.y > 0) texte(f.nom + " · " + String(f.hauteur).replace(".", ",") + " m", e.x, e.y, 14, "#7fe0ff", "center");
    }
    for (const l of Circuit.Parcours.loopings) {
      const e = Circuit.Maths3D.versEcran(vp, l.x, 5, l.z, W, H);
      if (e && e.y > 0) texte("entrée du looping · ≥ " + Math.round(C.parcours.vitesseLooping * 3.6) + " km/h", e.x, e.y, 14, "#7dffa0", "center");
    }
    const v = monde.voiture;
    const e = Circuit.Maths3D.versEcran(vp, v.x, (v.y || 0) + 2.8, v.z, W, H);
    if (e) texte("y = " + (v.y || 0).toFixed(1).replace(".", ",") + " m · vy = " + (v.vy || 0).toFixed(1).replace(".", ",") + " m/s", e.x, e.y, 14, "#ffb37a", "center");
  }

  // Les 3 feux rouges du départ : un s'éteint chaque seconde.
  function dessinerFeux(reste) {
    const n = C.course.decompte;
    panneau(W / 2 - n * 40 - 10, 60, n * 80 + 20, 100);
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(W / 2 - (n - 1) * 40 + i * 80, 110, 30, 0, Math.PI * 2);
      ctx.fillStyle = i < reste ? "#ff3b30" : "#3a1110";
      ctx.fill();
    }
    texte(String(reste), W / 2, H / 2 + 40, 80, "#fff", "center");
  }

  // La mini-carte : le circuit vu d'en haut, avec un point pour la voiture.
  function dessinerMiniCarte(monde) {
    // L'échelle est calculée pour que le circuit entier tienne dans 130 pixels de large.
    const P = C.piste;
    const echelle = 130 / (P.longueurDroite + 2 * P.rayon + P.largeur); // ≈ 0,21 : 1 m = 0,21 pixel
    const cx = W - 86, cz = 56;
    panneau(W - 160, 12, 148, 88);
    ctx.lineWidth = Math.max(4, P.largeur * echelle);
    ctx.strokeStyle = "#5b5e66";
    ctx.beginPath();
    for (let s = 0; s <= Circuit.Piste.longueurTour; s += 6) {
      const p = Circuit.Piste.pointA(s);
      ctx.lineTo(cx + p.x * echelle, cz + p.z * echelle);
    }
    ctx.closePath();
    ctx.stroke();
    // la ligne d'arrivée
    const d = Circuit.Piste.pointA(0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + d.x * echelle - 1, cz + d.z * echelle - 5, 2, 10);
    // les pièces pas encore prises : de petits points dorés
    ctx.fillStyle = "#ffd34d";
    for (const p of monde.pieces) if (!p.prise) ctx.fillRect(cx + p.x * echelle - 1, cz + p.z * echelle - 1, 2, 2);
    // les voitures : l'adversaire en bleu, toi en rouge (dessinée en dernier, par-dessus)
    for (const [v, couleur] of [[monde.adversaire.voiture, "#2f6bff"], [monde.voiture, "#ff3b30"]]) {
      ctx.beginPath();
      const px = Math.max(-70, Math.min(70, v.x * echelle)), pz = Math.max(-40, Math.min(40, v.z * echelle));
      ctx.arc(cx + px, cz + pz, 4, 0, Math.PI * 2);
      ctx.fillStyle = couleur;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Aux rayons X : les noms des portes et l'écart au milieu de la route, accrochés dans la 3D.
  function dessinerEtiquettesRayonsX(monde) {
    const vp = Circuit.Scene3D.vueProjection;
    Circuit.Piste.portes.forEach((s, i) => {
      const p = Circuit.Piste.pointA(s);
      const e = Circuit.Maths3D.versEcran(vp, p.x, 5.6, p.z, W, H);
      if (!e || e.x < -50 || e.x > W + 50) return;
      const prochaine = i === monde.prochainePorte;
      texte((i === 0 ? "ligne (porte 0)" : "porte " + i) + " · " + Math.round(s) + " m", e.x, e.y, 15, prochaine ? "#7dffa0" : "#d9a6ff", "center");
    });
    const v = monde.voiture;
    const e = Circuit.Maths3D.versEcran(vp, v.x, 2.6, v.z, W, H);
    if (e) {
      texte(
        "écart " + monde.reperage.ecart.toFixed(1).replace(".", ",") + " m · " + Math.round(monde.reperage.s) + " m du départ",
        e.x, e.y, 14, "#ffb37a", "center"
      );
    }
    // Étape 34 : ce que pense le pilote adverse.
    const adv = monde.adversaire;
    const ea = Circuit.Maths3D.versEcran(vp, adv.voiture.x, 2.6, adv.voiture.z, W, H);
    if (ea) {
      const degres = Math.round((adv.difference * 180) / Math.PI);
      const decision = Math.abs(adv.difference) <= 0.02 ? "tout droit" : adv.difference < 0 ? "à gauche" : "à droite";
      texte("🤖 cible à " + degres + "° → " + decision + " · voie " + (adv.voie > 0 ? "extérieure" : "intérieure"), ea.x, ea.y, 14, "#9cc4ff", "center");
    }
  }

  return { initialiser, dessiner, chrono };
})();
