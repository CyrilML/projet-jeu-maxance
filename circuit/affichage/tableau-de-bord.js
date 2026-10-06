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

  function dessinerEcran(monde, options, sauvegarde) {
    ctx.clearRect(0, 0, W, H);
    const v = monde.voiture;
    if (monde.phase === "cartes") {
      dessinerCartes(monde);
      return;
    }
    if (monde.phase === "meteo") {
      dessinerChoixMeteo(monde);
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
    if (monde.phase === "ville") {
      dessinerVille(monde, options, sauvegarde);
      return;
    }
    if (monde.phase === "rampes" || monde.phase === "rampes-fin") {
      dessinerRampes(monde, options, sauvegarde); // étape 41
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
    // (Étape 58 : 12 voitures : ta place sur 12, et qui est en tête.)
    const total = (monde.adversaires || []).length + 1, place = monde.position;
    const medaille = place === 1 ? "🥇" : place === 2 ? "🥈" : place === 3 ? "🥉" : "🏁";
    texte(medaille + " " + place + (place === 1 ? "er" : "e") + " / " + total, 24, 142, 22, place === 1 ? "#7dffa0" : place <= 3 ? "#ffe27a" : "#ffb37a");
    const tete = Circuit.Course.enTete(monde);
    if (tete) texte(place === 1 ? "Derrière toi : " + tete.nom : "En tête : " + tete.nom + " (tour " + Math.min(tete.tour, C.course.tours) + ")", 24, 164, 15, "#9cc4ff");

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
      if (monde.resultat) texte("Le 2e était à " + monde.resultat.avance.toLocaleString("fr-FR") + " m derrière toi", W / 2, H / 2 - 26, 17, "#9cc4ff", "center");
      monde.tempsDesTours.forEach((t, i) => texte("Tour " + (i + 1) + " : " + chrono(t), W / 2, H / 2 + 2 + i * 22, 17, "#cfd6ff", "center"));
      if (Circuit.Sauvegarde.recordDerniereCourse) texte("🏆 Nouveau record !", W / 2, H / 2 + 80, 22, "#7dffa0", "center");
      texte("🪙 +" + monde.piecesCourse + " pièces · Entrée : choisir une carte", W / 2, H / 2 + 108, 18, "#ffd34d", "center");
    } else if (monde.phase === "perdu") {
      panneau(W / 2 - 230, H / 2 - 110, 460, 200);
      texte("😢 Perdu !", W / 2, H / 2 - 64, 42, "#ff8a7a", "center");
      texte((monde.vainqueur || "Un adversaire").replace(/^la/, "La") + " a gagné (en " + chrono(monde.chronoCourse) + ")", W / 2, H / 2 - 24, 20, "#fff", "center");
      texte("Tu étais " + monde.position + "e sur " + ((monde.adversaires || []).length + 1) + " · il faut finir 1er pour gagner", W / 2, H / 2 + 2, 17, "#9cc4ff", "center");
      if (monde.resultat) texte("Il te restait " + monde.resultat.retard.toLocaleString("fr-FR") + " m à faire", W / 2, H / 2 + 30, 18, "#cfd6ff", "center");
      texte("🪙 +" + monde.piecesCourse + " pièces gardées quand même !", W / 2, H / 2 + 58, 18, "#ffd34d", "center");
      texte("Entrée : choisir une carte, puis la revanche !", W / 2, H / 2 + 82, 18, "#7dffa0", "center");
    }

    if (monde.phase === "course" || monde.phase === "decompte") texte("R : recommencer la course · ⌫ : changer de carte", 24, H - 22, 14, "#cfd6ff");
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
    texte("🏠 Garage · " + nomCarte, W / 2 - 225, 46, nomCarte.length > 14 ? 20 : 24, "#ffe27a"); // étape 40 : un nom plus long
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
    const n = C.cartes.length, ecart = 16;
    const largeur = Math.min(270, (W - 60 - (n - 1) * ecart) / n); // étape 40 : 4 cartes doivent tenir
    const gauche = W / 2 - (n * largeur + (n - 1) * ecart) / 2;
    C.cartes.forEach((carte, i) => {
      const x = gauche + i * (largeur + ecart), y = 130;
      const ici = i === monde.choixCarte;
      const prete = true; // étape 41 : toutes les cartes sont prêtes
      ctx.fillStyle = ici ? "rgba(255,226,122,.92)" : "rgba(10,14,30,.72)";
      ctx.beginPath();
      ctx.roundRect(x, y, largeur, 230, 14);
      ctx.fill();
      const couleur = ici ? "#1a1a1a" : "#fff";
      texte(carte.icone, x + largeur / 2, y + 80, 60, couleur, "center", ici);
      texte((i + 1) + ". " + carte.nom, x + largeur / 2, y + 135, n > 4 ? 15 : n > 3 ? 18 : 26, couleur, "center", ici);
      texte(carte.texte, x + largeur / 2, y + 170, n > 4 ? 11 : 13, ici ? "#333" : "#cfd6ff", "center", ici);
      if (!prete) texte("🚧 en construction", x + largeur / 2, y + 205, 16, ici ? "#7a3b00" : "#ffb37a", "center", ici);
    });
    if (monde.messageCarte) texte(monde.messageCarte, W / 2, 400, 20, "#ffb37a", "center");
    panneau(W / 2 - 250, H - 80, 500, 50);
    texte("← → ou 1 à " + n + " pour choisir · Entrée pour aller au garage", W / 2, H - 48, 18, "#cfd6ff", "center");
  }

  // Étape 59 : ✍️ « Choisis ta météo » : 6 cartes, avec ce que ça change pour la conduite (l'adhérence, le vent).
  // Derrière, la 3D montre déjà la météo regardée (la pluie tombe, la neige vole…).
  function dessinerChoixMeteo(monde) {
    panneau(W / 2 - 230, 30, 460, 56);
    texte("🌦️ Choisis ta météo", W / 2, 70, 32, "#ffe27a", "center");
    const liste = C.meteo.choix, n = liste.length, ecart = 12;
    const largeur = (W - 60 - (n - 1) * ecart) / n, gauche = W / 2 - (n * largeur + (n - 1) * ecart) / 2;
    liste.forEach((nom, i) => {
      const t = C.meteo.temps[nom], x = gauche + i * (largeur + ecart), y = 130;
      const ici = i === monde.choixMeteo;
      ctx.fillStyle = ici ? "rgba(255,226,122,.92)" : "rgba(10,14,30,.72)";
      ctx.beginPath();
      ctx.roundRect(x, y, largeur, 230, 14);
      ctx.fill();
      const couleur = ici ? "#1a1a1a" : "#fff", doux = ici ? "#333" : "#cfd6ff";
      texte(t.icone, x + largeur / 2, y + 75, 54, couleur, "center", ici);
      texte((i + 1) + ". " + t.nom, x + largeur / 2, y + 122, 18, couleur, "center", ici);
      texte("adhérence " + Math.round(t.adherence * 100) + " %", x + largeur / 2, y + 152, 12, doux, "center", ici);
      texte("vent " + Math.round(t.vent * 3.6) + " km/h", x + largeur / 2, y + 170, 12, doux, "center", ici);
      texte(C.meteo.textes[nom], x + largeur / 2, y + 200, 11, doux, "center", ici);
    });
    panneau(W / 2 - 280, H - 80, 560, 50);
    texte("← → ou 1 à " + n + " pour choisir · Entrée : au garage · ⌫ : retour aux cartes", W / 2, H - 48, 17, "#cfd6ff", "center");
  }

  // Étape 37 : pendant la balade sur le parcours.
  // Étape 40 : le même écran sert au grand parcours.
  function dessinerBalade(monde, options, sauvegarde) {
    const v = monde.voiture;
    const grand = monde.carte === "grand";
    panneau(12, 12, 270, 112);
    texte(grand ? "🛣️ Le grand parcours" : "🎢 Le parcours", 24, 42, 24, "#ffe27a");
    texte("🪙 " + monde.piecesCourse + " / " + monde.pieces.length + " pièces trouvées", 24, 68, 17, "#ffd34d");
    texte("porte-monnaie : " + sauvegarde.pieces, 24, 90, 14, "#cfd6ff");
    if (grand) texte("🔥 nitros : " + monde.nitrosPris + " · 😵 chutes : " + monde.chutes, 24, 112, 14, "#cfd6ff");
    else texte("📦 cartons défoncés : " + monde.cartonsCasses, 24, 112, 14, "#cfd6ff");

    // Le compteur de vitesse et la hauteur.
    panneau(W - 190, H - 92, 178, 80);
    texte(Math.round(Math.abs(v.vitesse) * 3.6) + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");
    if (v.y > 0.3) texte("↕ " + v.y.toFixed(1).replace(".", ",") + " m de haut", W - 101, H - 104, 18, "#7dffa0", "center");
    jaugeNitro(v);

    if (grand) dessinerMiniCarteGrand(monde);
    else dessinerMiniCarteParcours(monde);

    if (monde.message && monde.temps < monde.message.jusqua) texte(monde.message.texte, W / 2, H / 2 - 70, 36, "#ffe27a", "center");
    if (monde.boucle) texte("🎢 " + Math.round((monde.boucle.theta * 180) / Math.PI) + "°", W / 2, 120, 26, "#fff", "center");
    texte("R : retour au départ · ⌫ : changer de carte", 24, H - 22, 14, "#cfd6ff");
    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.ralenti) texte("🐢 Ralenti", 280, 40, 18, "#cfd6ff");
    if (options.rayonsX) {
      if (grand) dessinerEtiquettesGrand(monde);
      else dessinerEtiquettesParcours(monde);
    }
  }

  // Étape 40 : la jauge du nitro (elle se vide pendant la poussée).
  function jaugeNitro(v) {
    if (!(v.nitro > 0)) return;
    panneau(W / 2 - 110, H - 70, 220, 46);
    texte("🔥 NITRO", W / 2 - 98, H - 40, 20, "#7fe8ff");
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(W / 2 + 2, H - 54, 96, 14);
    ctx.fillStyle = "#33e0ff";
    ctx.fillRect(W / 2 + 2, H - 54, (96 * v.nitro) / C.nitro.duree, 14);
  }

  // Étape 41 : l'écran des méga-rampes : chrono, drapeaux, barre de DÉGÂTS (comme dans les jeux de méga-rampes),
  // la barre de progression jusqu'à l'arrivée, et l'écran d'arrivée.
  function dessinerRampes(monde, options, sauvegarde) {
    const v = monde.voiture;
    const MR = Circuit.MegaRampes;
    panneau(12, 12, 280, 134);
    texte("☁️ Les méga-rampes", 24, 42, 24, "#ffe27a");
    texte("⏱ " + chrono(monde.chrono), 24, 70, 22);
    texte("Record : " + chrono(sauvegarde.recordRampes), 24, 92, 15, "#cfd6ff");
    texte("🚩 drapeau " + monde.drapeau + " / " + (MR.drapeaux.length - 1) + " · 🪙 " + monde.piecesCourse, 24, 114, 16, "#ffd34d");
    texte("☁️ chutes : " + monde.chutesNuages + " · 💥 cassée : " + monde.cassees, 24, 136, 14, "#cfd6ff");

    // En haut à droite : la barre de dégâts (5 cases, du vert au rouge), puis la progression.
    panneau(W - 250, 12, 238, 88);
    texte("Dégâts", W - 238, 36, 16, "#fff");
    texte(Math.round(monde.degats) + " %", W - 24, 36, 16, monde.degats > 70 ? "#ff6b4a" : "#fff", "right");
    const couleurs = ["#3ad65a", "#9be03a", "#f2d21a", "#f29a1a", "#ef3b2c"];
    for (let i = 0; i < 5; i++) {
      const plein = Math.max(0, Math.min(1, monde.degats / 20 - i));
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(W - 238 + i * 43, 44, 39, 12);
      ctx.fillStyle = couleurs[i];
      ctx.fillRect(W - 238 + i * 43, 44, 39 * plein, 12);
    }
    const part = Math.min(1, monde.progression / MR.arrivee.s);
    texte("Arrivée : " + Math.round(part * 100) + " %", W - 238, 80, 14, "#cfd6ff");
    ctx.fillStyle = "rgba(255,255,255,.15)";
    ctx.fillRect(W - 140, 70, 116, 10);
    ctx.fillStyle = "#7fe0ff";
    ctx.fillRect(W - 140, 70, 116 * part, 10);
    for (const d of MR.drapeaux) {
      ctx.fillStyle = d.numero <= monde.drapeau ? "#22c55e" : "#e02424";
      ctx.fillRect(W - 140 + (116 * d.s) / MR.arrivee.s - 1, 66, 2, 18);
    }

    panneau(W - 190, H - 92, 178, 80);
    texte(Math.round(Math.abs(v.vitesse) * 3.6) + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");
    jaugeNitro(v);

    if (monde.phase === "rampes-fin" && monde.resultat) {
      panneau(W / 2 - 230, H / 2 - 120, 460, 220);
      texte("🏁 Arrivée !", W / 2, H / 2 - 76, 40, "#ffe27a", "center");
      texte("Temps : " + chrono(monde.resultat.temps), W / 2, H / 2 - 36, 26, "#fff", "center");
      texte(monde.resultat.record ? "🏆 Nouveau record !" : "Record : " + chrono(monde.resultat.ancienRecord), W / 2, H / 2 - 4, 22, monde.resultat.record ? "#7dffa0" : "#cfd6ff", "center");
      texte("☁️ " + monde.chutesNuages + " chute(s) · 💥 " + monde.cassees + " voiture(s) cassée(s)", W / 2, H / 2 + 26, 17, "#cfd6ff", "center");
      texte("🪙 +" + monde.piecesCourse + " pièces · Entrée : choisir une carte", W / 2, H / 2 + 60, 18, "#ffd34d", "center");
    } else if (monde.message && monde.temps < monde.message.jusqua) {
      texte(monde.message.texte, W / 2, H / 2 - 70, 32, "#ffe27a", "center");
    } else if (!monde.chronoLance) {
      texte("↑ pour partir : le chrono démarre !", W / 2, H / 2 - 70, 28, "#ffe27a", "center");
    }
    texte("R : recommencer · ⌫ : changer de carte", 24, H - 22, 14, "#cfd6ff");
    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.rayonsX) dessinerEtiquettesRampes(monde);
  }

  // Étape 41 : aux rayons X : la longueur des sauts, les drapeaux, et la vitesse des véhicules à doubler.
  function dessinerEtiquettesRampes(monde) {
    const MR = Circuit.MegaRampes;
    const vp = Circuit.Scene3D.vueProjection;
    const ecrire = (t, x, y, z, couleur) => {
      const e = Circuit.Maths3D.versEcran(vp, x, y, z, W, H);
      if (e && e.x > -80 && e.x < W + 80 && e.y > 0) texte(t, e.x, e.y, 14, couleur, "center");
    };
    for (const s of MR.sauts) ecrire("saut n° " + s.numero + " : " + Math.round(s.longueur) + " m", (s.depart.x + s.arrivee.x) / 2, s.depart.y + 6, (s.depart.z + s.arrivee.z) / 2, "#ffe27a");
    for (const d of MR.drapeaux) ecrire("🚩 " + d.numero + " · " + Math.round(d.s) + " m", d.x, d.y + 8, d.z, "#7dffa0");
    for (const c of monde.circulation) ecrire(c.nom + " · " + Math.round(c.vitesse * 3.6) + " km/h", c.voiture.x, c.voiture.y + 3, c.voiture.z, "#9cc4ff");
    const v = monde.voiture;
    ecrire("y = " + (v.y || 0).toFixed(1).replace(".", ",") + " m · " + Math.round(monde.progression) + " m", v.x, (v.y || 0) + 2.8, v.z, "#ffb37a");
  }

  // Étape 40 : la mini-carte du grand parcours : la route (plus claire quand elle est haute), les plateformes,
  // le creux, les nitros, les pièces et la voiture.
  function dessinerMiniCarteGrand(monde) {
    const GP = Circuit.GrandParcours;
    const taille = 136;
    const echelle = taille / 640;
    const cx = W - 12 - taille / 2 + 30 * echelle, cz = 12 + taille / 2 - 80 * echelle; // la route est un peu décalée vers −x et +z
    panneau(W - 12 - taille - 6, 6, taille + 12, taille + 12);
    const K = GP.creux;
    ctx.fillStyle = "#6b5332";
    ctx.fillRect(cx + (K.x - K.longueur / 2) * echelle, cz + (K.z - K.largeur / 2) * echelle, K.longueur * echelle, K.largeur * echelle);
    for (const p of GP.plateformes) {
      ctx.fillStyle = "#b9bcc2";
      ctx.fillRect(cx + (p.x - p.longueur / 2) * echelle, cz + (p.z - p.largeur / 2) * echelle, p.longueur * echelle, p.largeur * echelle);
      ctx.fillStyle = "#1a1d26";
      for (const t of p.trous) ctx.fillRect(cx + (t.x - t.longueur / 2) * echelle, cz + (t.z - t.largeur / 2) * echelle, t.longueur * echelle, t.largeur * echelle);
    }
    ctx.lineWidth = 3;
    for (const t of GP.routes) {
      const c = Math.round(110 + Math.min(1, t.ya / 20) * 120);
      ctx.strokeStyle = "rgb(" + c + "," + c + "," + (c + 10) + ")";
      ctx.beginPath();
      ctx.moveTo(cx + t.ax * echelle, cz + t.az * echelle);
      ctx.lineTo(cx + (t.ax + t.ux * t.longueur) * echelle, cz + (t.az + t.uz * t.longueur) * echelle);
      ctx.stroke();
    }
    ctx.fillStyle = "#33e0ff";
    for (const n of GP.nitros) ctx.fillRect(cx + n.x * echelle - 1.5, cz + n.z * echelle - 1.5, 3, 3);
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

  // Étape 40 : aux rayons X sur le grand parcours : les plateformes, le saut du creux et ce qui est sous la voiture.
  function dessinerEtiquettesGrand(monde) {
    const GP = Circuit.GrandParcours;
    const vp = Circuit.Scene3D.vueProjection;
    const ecrire = (t, x, y, z, couleur) => {
      const e = Circuit.Maths3D.versEcran(vp, x, y, z, W, H);
      if (e && e.x > -80 && e.x < W + 80 && e.y > 0) texte(t, e.x, e.y, 14, couleur, "center");
    };
    for (const p of GP.plateformes) ecrire(p.nom + " · " + p.y + " m de haut", p.x, p.y + 3, p.z, "#7fe0ff");
    const s = GP.saut;
    ecrire("le creux : " + Math.round(s.longueur) + " m à sauter", (s.depart.x + s.arrivee.x) / 2, s.depart.y + 6, (s.depart.z + s.arrivee.z) / 2, "#ffe27a");
    const v = monde.voiture;
    const sous = GP.sous(v.x, v.z, v.y || 0);
    ecrire("sous moi : " + sous.quoi + " · y = " + (v.y || 0).toFixed(1).replace(".", ",") + " m · vy = " + (v.vy || 0).toFixed(1).replace(".", ",") + " m/s", v.x, (v.y || 0) + 2.8, v.z, "#ffb37a");
  }

  // Étape 39 : en ville.
  function dessinerVille(monde, options, sauvegarde) {
    const v = monde.voiture, p = monde.pieton;
    if (monde.magasin) {
      // Étape 42 : dans un magasin, on ne montre que le magasin (et la mini-carte).
      dessinerMiniCarteVille(monde);
      dessinerMagasin(monde, sauvegarde);
      return;
    }
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    panneau(12, 12, 270, 136);
    texte("🏙️ La ville", 24, 42, 24, "#ffe27a");
    texte("🪙 " + monde.piecesCourse + " / " + monde.pieces.length + " pièces trouvées", 24, 68, 17, "#ffd34d");
    texte("porte-monnaie : " + sauvegarde.pieces, 24, 90, 14, "#cfd6ff");
    texte(p ? "🚶 À pied" : "🚗 " + fiche.nom, 24, 112, 14, "#cfd6ff");

    panneau(W - 190, H - 92, 178, 80);
    const vitesse = p ? p.vitesse : v.vitesse;
    texte(Math.round(Math.abs(vitesse) * 3.6) + "", W - 70, H - 36, 46, "#fff", "right");
    texte("km/h", W - 62, H - 36, 18, "#cfd6ff");

    dessinerMiniCarteVille(monde);
    if (monde.message && monde.temps < monde.message.jusqua) texte(monde.message.texte, W / 2, H / 2 - 70, 30, "#ffe27a", "center");
    dessinerBoulot(monde); // étape 43
    if (monde.boulotProche && !monde.boulot) texte("J : commencer le boulot de " + monde.boulotProche, W / 2, H - 92, 22, "#ffb37a", "center");
    if (p && monde.magasinProche && !monde.magasin) texte("E : entrer dans " + monde.magasinProche + " 🛍️", W / 2, H - 60, 22, "#ffd34d", "center");
    else if (p && monde.voitureProche) texte("E : monter dans " + monde.voitureProche, W / 2, H - 60, 22, "#7dffa0", "center");
    texte("📍 " + (monde.lieu || "la ville") + (monde.surLaRue ? " · " + monde.rue : ""), 24, 140, 14, "#9cc4ff");
    const aide = fiche.vol === "helico" ? "Z/Espace : monter · S/Maj : descendre · ↑ ↓ avancer · ← → tourner · E : descendre (posé)"
      : fiche.vol ? "↑ ↓ : gaz · ← → : tourner · Z/Espace : monter · S/Maj : descendre" + (fiche.armes ? " · F : mitrailleuse · G : missile" : "")
      : "E : descendre · R : retour au départ · ⌫ : changer de carte" + (fiche.sirene ? " · H : sirène" : "") + (sauvegarde.objets && sauvegarde.objets.klaxon ? " · K : klaxon" : "");
    texte(p ? "↑ ↓ ← → marcher · E : monter · R : départ · ⌫ : cartes" : aide, 24, H - 22, 14, "#cfd6ff");
    if (fiche.vol && !p) dessinerVol(monde, v, fiche); // étape 44
    dessinerEtoiles(monde); // étape 45
    if (monde.sirene && fiche.sirene && !p) texte("🚨 Sirène", 300, monde.boulot ? 172 : 70, 20, // (étape 58 : plus bas pendant un boulot, sous le panneau)
       Math.floor(monde.temps * 4) % 2 ? "#ff5a4a" : "#5a8aff");
    if (options.pause) texte("⏸ Pause", W / 2, H - 30, 28, "#fff", "center");
    if (options.ralenti) texte("🐢 Ralenti", 300, 40, 18, "#cfd6ff");
  }

  // Étape 45 : les étoiles de la police, sous la mini-carte. Elles clignotent quand tu es caché.
  function dessinerEtoiles(monde) {
    const p = monde.police;
    if (!p || p.etoiles === 0) return;
    const clignote = !p.vu && p.cache > C.police.avantDeClignoter && Math.floor(monde.temps * 4) % 2;
    panneau(W - 160, 162, 148, 52);
    for (let i = 0; i < 5; i++) texte(i < p.etoiles && !clignote ? "★" : "☆", W - 150 + i * 27, 196, 28, i < p.etoiles ? "#ffd21a" : "rgba(255,255,255,.35)");
    texte(p.vu ? "🚨 on te voit !" : "🙈 caché (" + Math.floor(p.cache) + " s)", W - 86, 228, 13, p.vu ? "#ff6b4a" : "#7dffa0", "center");
    if (p.arret > 0.2) texte("🚔 La police t'arrête… (" + (C.police.arret.temps - p.arret).toFixed(1).replace(".", ",") + " s) Fonce !", W / 2, H / 2 + 60, 24, "#ff6b4a", "center");
  }

  // Étape 44 : les instruments de vol : l'altitude, la vitesse verticale, la vitesse de décollage,
  // et pour l'avion de chasse un viseur et le missile prêt ou pas.
  function dessinerVol(monde, v, fiche) {
    panneau(W - 190, H - 196, 178, 98);
    const sol = Circuit.Archipel.lieu(v.x, v.z).h;
    texte("↕ " + Math.round(v.y - sol) + " m", W - 178, H - 166, 22, "#7fe0ff");
    texte((v.vy >= 0 ? "▲ " : "▼ ") + Math.abs(v.vy).toFixed(1).replace(".", ",") + " m/s", W - 178, H - 142, 15, v.vy < -C.vol.atterrissageDoux ? "#ff6b4a" : "#cfd6ff");
    texte(v.enVol ? (v.decroche ? "⚠️ DÉCROCHAGE" : "✈️ en vol") : fiche.vol === "avion" ? "🛫 décollage : " + Math.round(fiche.decollage * 3.6) + " km/h" : "🚁 posé : Z pour monter", W - 178, H - 118, 13, v.decroche ? "#ff6b4a" : "#7dffa0");
    if (fiche.armes) {
      // Le viseur : au milieu de l'écran.
      ctx.strokeStyle = "rgba(125,255,160,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2 - 30, 18, 0, Math.PI * 2);
      ctx.moveTo(W / 2 - 30, H / 2 - 30);
      ctx.lineTo(W / 2 - 10, H / 2 - 30);
      ctx.moveTo(W / 2 + 10, H / 2 - 30);
      ctx.lineTo(W / 2 + 30, H / 2 - 30);
      ctx.stroke();
      const pret = monde.temps >= monde.prochainMissile;
      panneau(12, 156, 200, 52);
      texte("🚀 missile : " + (pret ? "prêt (G)" : "recharge…"), 24, 178, 14, pret ? "#7dffa0" : "#ffb37a");
      texte("🎯 cibles : " + monde.ciblesTouchees + " · 💥 " + monde.voituresExplosees, 24, 198, 14, "#cfd6ff");
    }
  }

  // La mini-carte de la ville. Étape 42 : la map est énorme, alors la mini-carte SUIT le joueur (il est au
  // milieu) et montre 1 400 m autour de lui : la ville, la mer, les ponts, les îles et leurs aéroports.
  function dessinerMiniCarteVille(monde) {
    const Ville = Circuit.Ville, AR = Circuit.Archipel, A = C.archipel;
    const taille = 136;
    const echelle = taille / 1400;
    const qui = monde.pieton || monde.voiture;
    const cx = W - 12 - taille / 2, cz = 12 + taille / 2;
    panneau(W - 12 - taille - 6, 6, taille + 12, taille + 12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(W - 12 - taille, 12, taille, taille);
    ctx.clip();
    ctx.fillStyle = "#2a6d9e"; // la mer
    ctx.fillRect(W - 12 - taille, 12, taille, taille);
    ctx.translate(cx - qui.x * echelle, cz - qui.z * echelle);
    ctx.scale(echelle, echelle);
    ctx.fillStyle = "#5f9a46";
    ctx.fillRect(-A.ileVille, -A.ileVille, 2 * A.ileVille, 2 * A.ileVille);
    ctx.fillStyle = "#8a8d93";
    for (let i = 0; i < C.ville.blocs; i++) for (let j = 0; j < C.ville.blocs; j++) {
      if (Ville.parc(i, j)) continue;
      ctx.fillRect(Ville.rue(i) + C.ville.largeurRue / 2, Ville.rue(j) + C.ville.largeurRue / 2, C.ville.tailleBloc, C.ville.tailleBloc);
    }
    for (const ap of AR.aeroports) {
      ctx.save();
      ctx.translate(ap.x, ap.z);
      ctx.rotate(ap.angle);
      ctx.fillStyle = "#5f9a46";
      ctx.fillRect(A.ile.u[0], A.ile.w[0], A.ile.u[1] - A.ile.u[0], A.ile.w[1] - A.ile.w[0]);
      const P = AR.plan;
      ctx.fillStyle = "#3a3d44";
      ctx.fillRect(P.piste.u - P.piste.longueur / 2, P.piste.w - P.piste.largeur / 2, P.piste.longueur, P.piste.largeur);
      ctx.fillStyle = "#b8bcc2";
      ctx.fillRect(P.tarmac.u - P.tarmac.longueur / 2, P.tarmac.w - P.tarmac.largeur / 2, P.tarmac.longueur, P.tarmac.largeur);
      ctx.restore();
    }
    ctx.strokeStyle = "#d9d9d9";
    ctx.lineWidth = 22;
    for (const p of AR.ponts) {
      ctx.beginPath();
      ctx.moveTo(p.de[0], p.de[1]);
      ctx.lineTo(p.a[0], p.a[1]);
      ctx.stroke();
    }
    ctx.fillStyle = "#c06cff"; // les magasins
    for (const m of AR.magasins) ctx.fillRect(m.x - 14, m.z - 14, 28, 28);
    ctx.fillStyle = "#ffd34d";
    for (const p of monde.pieces) if (!p.prise) ctx.fillRect(p.x - 6, p.z - 6, 12, 12);
    // Étape 45 : la police (rouge et bleu qui clignotent) et le commissariat.
    if (monde.police) {
      const tic = Math.floor(monde.temps * 4) % 2;
      for (const pv of monde.police.voitures) {
        ctx.fillStyle = tic ? "#ff3b30" : "#3b7bff";
        ctx.beginPath();
        ctx.arc(pv.voiture.x, pv.voiture.z, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      if (monde.police.helico) {
        ctx.strokeStyle = "#3b7bff";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(monde.police.helico.x, monde.police.helico.z, 26, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#1b3a8b";
      ctx.fillRect(Circuit.Police.commissariat.x - 16, Circuit.Police.commissariat.z - 16, 32, 32);
    }
    // Étape 43 : les départs des boulots (orange), et la cible du boulot en cours (un gros rond jaune qui clignote).
    if (!monde.boulot) {
      ctx.fillStyle = "#ff8a1a";
      for (const d of Circuit.Boulots.departs) {
        ctx.beginPath();
        ctx.arc(d.x, d.z, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      if (monde.boulot.poubelles) {
        ctx.fillStyle = "#2ecc71";
        for (const q of monde.boulot.poubelles) if (!q.prise) ctx.fillRect(q.x - 10, q.z - 10, 20, 20);
      }
      if (monde.boulot.cible && Math.floor(monde.temps * 3) % 2) {
        ctx.fillStyle = "#ffe14d";
        ctx.beginPath();
        ctx.arc(monde.boulot.cible.x, monde.boulot.cible.z, 34, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    // Toi, au milieu de la mini-carte.
    ctx.save();
    ctx.translate(cx, cz);
    ctx.rotate(qui.angle);
    ctx.fillStyle = monde.pieton ? "#7dffa0" : "#ff3b30";
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Étape 43 : le boulot en cours : un panneau (le chrono, combien c'est fait, les gains) et une FLÈCHE
  // en haut de l'écran qui montre où aller. La flèche tourne selon l'angle entre ta direction et la cible :
  // angle = atan2(cible − toi) − ta direction (comme le pilote de la voiture bleue, étape 34).
  function dessinerBoulot(monde) {
    const b = monde.boulot;
    if (!b) return;
    const qui = monde.pieton || monde.voiture;
    panneau(W / 2 - 170, 12, 340, 96);
    const titres = { pizzas: "🍕 Livreur de pizzas", taxi: "🚕 Chauffeur de taxi", poubelles: "🗑️ Ramassage des poubelles", policier: "👮 Policier" };
    texte(titres[b.sorte], W / 2 - 156, 38, 19, "#ffe27a");
    const avancement = b.sorte === "policier" ? "🚨 " + b.numero + " / " + b.total + " · 👮 " + b.faits : (b.sorte === "taxi" && b.etape === "chercher" ? "client n° " + (b.faits + 1) : "fait : " + b.faits) + " / " + b.total;
    texte(avancement + " · 🪙 " + b.gains, W / 2 - 156, 62, 15, "#ffd34d");
    if (b.chrono > 0) {
      const part = Math.max(0, b.chrono / b.tempsMax);
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(W / 2 + 30, 52, 70, 10);
      ctx.fillStyle = part > 0.5 ? "#7dffa0" : part > 0.25 ? "#ffd34d" : "#ff6b4a";
      ctx.fillRect(W / 2 + 30, 52, 70 * part, 10);
      texte("⏱ " + Math.ceil(b.chrono) + " s", W / 2 + 156, 62, 15, "#fff", "right");
    }
    if (b.cible) {
      const distance = Math.hypot(b.cible.x - qui.x, b.cible.z - qui.z);
      texte("→ " + b.cible.nom + " · " + Math.round(distance) + " m", W / 2 - 156, 92, 15, "#cfd6ff");
      // La flèche.
      const angle = Math.atan2(b.cible.z - qui.z, b.cible.x - qui.x) - qui.angle;
      ctx.save();
      ctx.translate(W / 2, 132);
      ctx.rotate(angle - Math.PI / 2); // 0 = devant toi = la flèche pointe vers le haut de l'écran
      ctx.fillStyle = "#ffe14d";
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -13);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 13);
      ctx.closePath();
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    }
    texte("J : arrêter le boulot", W / 2, H - 92, 14, "#cfd6ff", "center");
  }

  // Étape 42 : l'écran du magasin : les articles, leur prix, et ce que tu as déjà.
  function dessinerMagasin(monde, sauvegarde) {
    const m = monde.magasin;
    const articles = C.magasins.articles;
    panneau(W / 2 - 330, 60, 660, 360);
    texte("🛍️ " + m.nom.charAt(0).toUpperCase() + m.nom.slice(1), W / 2 - 310, 100, 21, "#ffe27a");
    texte("🪙 " + sauvegarde.pieces, W / 2 + 310, 100, 24, "#ffd34d", "right");
    articles.forEach((a, i) => {
      const x = W / 2 - 300 + (i % 3) * 205, y = 125 + Math.floor(i / 3) * 120;
      const ici = i === m.index;
      const deja = a.unique && sauvegarde.objets && sauvegarde.objets[a.id];
      ctx.fillStyle = ici ? "rgba(255,226,122,.92)" : "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.roundRect(x, y, 190, 108, 10);
      ctx.fill();
      const encre = ici ? "#1a1a1a" : "#fff";
      texte(a.icone, x + 24, y + 46, 28, encre, "center", ici);
      texte(a.nom, x + 46, y + 32, 12, encre, "left", ici);
      texte(deja ? "✅ à toi" : "🪙 " + a.prix, x + 46, y + 58, 16, ici ? "#7a3b00" : deja ? "#7dffa0" : "#ffd34d", "left", ici);
      if (a.id === "glace" && sauvegarde.objets && sauvegarde.objets.glace) texte("× " + sauvegarde.objets.glace + " mangée(s)", x + 46, y + 80, 12, ici ? "#333" : "#cfd6ff", "left", ici);
    });
    const a = articles[m.index];
    if (m.vendeur) {
      // Étape 43 : le travail de vendeur. Le client demande un article : trouve-le et donne-le (Entrée) !
      const v = m.vendeur, voulu = articles[v.demande];
      panneau(W / 2 - 330, 428, 660, 70);
      texte("🧑 Client " + (v.faits + 1) + " / " + v.total + " : « Je voudrais " + voulu.icone + " " + voulu.nom.toLowerCase() + " ! »", W / 2 - 310, 456, 17, "#fff");
      texte("🪙 " + v.gains, W / 2 + 310, 456, 17, "#ffd34d", "right");
      const part = Math.max(0, v.chrono / C.boulots.vendeur.temps);
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(W / 2 - 310, 470, 620, 10);
      ctx.fillStyle = part > 0.5 ? "#7dffa0" : part > 0.25 ? "#ffd34d" : "#ff6b4a";
      ctx.fillRect(W / 2 - 310, 470, 620 * part, 10);
      texte(m.message || "Trouve l'article avec ← →, puis Entrée pour le donner", W / 2, 392, 18, m.message ? "#7dffa0" : "#cfd6ff", "center");
      texte("← → choisir · Entrée : donner au client · J : arrêter de travailler", W / 2, 412, 14, "#cfd6ff", "center");
      return;
    }
    texte(m.message || a.texte, W / 2, 392, 18, m.message ? "#7dffa0" : "#cfd6ff", "center");
    texte("← → choisir · Entrée : acheter · J : travailler comme vendeur · E ou ⌫ : sortir", W / 2, 412, 14, "#cfd6ff", "center");
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
    // les voitures : chaque adversaire de sa couleur (petit point), toi plus gros, avec un contour jaune, par-dessus
    const rgb = (k) => "rgb(" + k.map((x) => Math.round(x * 255)).join(",") + ")";
    for (const [v, couleur, gros] of (monde.adversaires || []).map((a) => [a.voiture, rgb(a.couleurs[0]), false]).concat([[monde.voiture, "#ff3b30", true]])) {
      ctx.beginPath();
      const px = Math.max(-70, Math.min(70, v.x * echelle)), pz = Math.max(-40, Math.min(40, v.z * echelle));
      ctx.arc(cx + px, cz + pz, gros ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = couleur;
      ctx.fill();
      ctx.strokeStyle = gros ? "#ffe27a" : "#fff";
      ctx.lineWidth = gros ? 2 : 1;
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
    const adv = Circuit.Course.plusProche(monde); // (étape 58 : le pilote le plus proche de toi)
    const ea = adv && Circuit.Maths3D.versEcran(vp, adv.voiture.x, 2.6, adv.voiture.z, W, H);
    if (ea) {
      const degres = Math.round((adv.difference * 180) / Math.PI);
      const decision = Math.abs(adv.difference) <= 0.02 ? "tout droit" : adv.difference < 0 ? "à gauche" : "à droite";
      texte("🤖 cible à " + degres + "° → " + decision + " · voie " + (adv.voie > 0 ? "extérieure" : adv.voie < 0 ? "intérieure" : "du milieu") + (adv.voiture.vitesse > adv.vitesseSure ? " · ralentit (virage)" : ""), ea.x, ea.y, 14, "#9cc4ff", "center");
    }
  }

  // Étape 47 : la météo, en bas à gauche au-dessus de l'aide, sur toutes les cartes (pas dans les menus).
  function dessiner(monde, options, sauvegarde) {
    dessinerEcran(monde, options, sauvegarde);
    if (monde.phase === "cartes" || monde.phase === "meteo" || monde.phase === "garage" || monde.magasin) return;
    const M = Circuit.Meteo, v = M.etat.valeurs, prochain = C.meteo.temps[M.suivant()];
    const reste = Math.max(0, Math.ceil(C.meteo.duree - M.etat.depuis));
    panneau(12, H - 74, 300, 30);
    texte(v.icone + " " + v.nom + (M.etat.fixe ? " (choisie)" : M.etat.melange > 0 ? " → " + prochain.icone + " " + prochain.nom : " · " + prochain.icone + " dans " + reste + " s"), 22, H - 53, 15, "#e8f0ff");
    if (v.adherence < 0.75 && !monde.pieton) texte("⚠️ Route glissante !", 324, H - 53, 15, "#ffb37a");
    // Étape 53 : DRIFT ! (en gros, avec l'angle de la glissade), et la fumée quand une sportive patine.
    const vo = monde.voiture;
    if (!monde.pieton && vo.drift) {
      const angle = Math.round((Math.abs(vo.derapage || 0) * 180) / Math.PI);
      texte("DRIFT ! " + angle + "°", W / 2, 150, 34, angle > 25 ? "#ffd84a" : "#ffffff", "center");
      texte(vo.drift.duree.toFixed(1).replace(".", ",") + " s", W / 2, 180, 18, "#e8f0ff", "center");
    } else if (!monde.pieton && vo.patine) texte("💨 Les pneus patinent !", W / 2, 150, 24, "#ffffff", "center");
  }

  return { initialiser, dessiner, chrono };
})();
