// 🎨 LE RENDU : le peintre du jeu
//
// Ce fichier LIT le monde et le DESSINE. Il ne modifie jamais rien : si on supprimait
// le rendu, le jeu continuerait de tourner… mais on ne verrait rien !
// Séparer « les règles » (logique/) et « le dessin » (affichage/) est une des idées
// les plus importantes de l'architecture d'un jeu.
//
// Le peintre repeint TOUT l'écran à chaque image, du fond vers l'avant :
// ciel → nuages → collines → blocs du terrain (obstacles compris) → drapeaux → joueur → flammes → textes → rayons X.
//
// Le monde est plus grand que l'écran : on dessine à travers la CAMÉRA.
// Pour chaque objet :  x sur l'écran = x dans le monde − camera.x
// Et on ne peint que les colonnes visibles (environ 25) : inutile de dessiner des milliers de blocs cachés.

window.Jeu = window.Jeu || {};

Jeu.Rendu = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;
  const L = C.ecran.largeur;
  const H = C.ecran.hauteur;
  let ctx;

  function initialiser(canvas) {
    ctx = canvas.getContext("2d");
  }

  // Les colonnes de la grille visibles à l'écran.
  function colonnesVisibles(camera) {
    const premiere = Math.floor(camera.x / B);
    return { premiere, derniere: premiere + Math.ceil(L / B) };
  }

  // --- Décor (il bouge moins vite que le monde : ça donne de la profondeur) ---

  function ciel() {
    const degrade = ctx.createLinearGradient(0, 0, 0, C.solY);
    degrade.addColorStop(0, "#6fb7ff");
    degrade.addColorStop(1, "#bfe3ff");
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, L, H);
  }

  function nuages(cameraX) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 260 - cameraX * 0.1) % (L + 200) + L + 200) % (L + 200) - 100;
      const y = 50 + ((i * 53) % 90);
      ctx.fillRect(x, y, 80, 20);
      ctx.fillRect(x + 20, y - 14, 50, 14);
    }
  }

  function collines(cameraX) {
    ctx.fillStyle = "#7cc47a";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= L; x += 8) {
      const u = (x + cameraX * 0.3) / 140;
      ctx.lineTo(x, C.solY - 70 - 30 * Math.sin(u) - 15 * Math.sin(u * 2.3));
    }
    ctx.lineTo(L, H);
    ctx.fill();
  }

  // --- Le monde ---

  // Dessine un bloc de 40 × 40. `graine` sert à varier les petits détails sans hasard,
  // pour qu'un même bloc soit toujours dessiné pareil d'une image à l'autre.
  function bloc(x, y, matiere, graine) {
    const couleurs = {
      terre: ["#8b5a2b", "#74481f"],
      herbe: ["#8b5a2b", "#74481f"],
      bois: ["#b5793a", "#8c5a28"],
      pierre: ["#8e939b", "#6f747c"],
      planche: ["#d9a55b", "#a8773a"],
      lave: ["#ff7a1a", "#ffd23f"],
      pics: ["#8c5a28", "#5e3a18"], // le bois du muret, plus sombre, avec des pics rouges
    }[matiere];
    if (matiere === "lave") {
      // Un liquide : la surface est un peu plus basse que le haut de la case, avec des bulles claires.
      ctx.fillStyle = "#c2410c";
      ctx.fillRect(x, y + 8, B, B - 8);
      ctx.fillStyle = couleurs[0];
      ctx.fillRect(x, y + 8, B, 10);
      ctx.fillStyle = couleurs[1];
      ctx.fillRect(x + ((graine * 7) % 28) + 2, y + 11, 8, 4);
      ctx.fillRect(x + ((graine * 13) % 26) + 4, y + 24, 6, 6);
      return;
    }
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(x, y, B, B);
    ctx.fillStyle = couleurs[1];
    if (matiere === "bois" || matiere === "pics") {
      ctx.fillRect(x, y + 12, B, 3);
      ctx.fillRect(x, y + 26, B, 3);
      ctx.fillRect(x + 2, y + 2, B - 4, 2);
    } else if (matiere === "planche") {
      ctx.fillRect(x, y + 19, B, 2);
      ctx.fillRect(x + ((graine * 7) % 30) + 4, y, 2, 19);
      ctx.fillRect(x + ((graine * 11) % 30) + 4, y + 21, 2, 19);
    } else {
      for (let k = 0; k < 4; k++) {
        const g = (graine * 31 + k * 17) % 97;
        ctx.fillRect(x + (g % 8) * 4 + 2, y + ((g >> 3) % 8) * 4 + 4, 6, 4);
      }
    }
    if (matiere === "pics") {
      // Des pics rouges sur le dessus : attention, ce bois-là est mortel !
      ctx.fillStyle = "#e0303a";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 10, y + 10);
        ctx.lineTo(x + k * 10 + 5, y);
        ctx.lineTo(x + k * 10 + 10, y + 10);
        ctx.fill();
      }
    }
    if (matiere === "herbe") {
      ctx.fillStyle = "#5cb336";
      ctx.fillRect(x, y, B, 9);
      ctx.fillRect(x + ((graine * 5) % 30), y + 9, 6, 4);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.strokeRect(x + 0.5, y + 0.5, B - 1, B - 1);
  }

  function terrain(monde) {
    const { premiere, derniere } = colonnesVisibles(monde.camera);
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      for (let l = 0; l < C.carte.lignes; l++) {
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        if (numero !== Jeu.Terrain.CASES.air) bloc(c * B, l * B, Jeu.Terrain.NOMS[numero], c * 7 + l * 13);
      }
    }
  }

  function drapeaux(monde) {
    for (const d of monde.drapeaux) {
      const x = d.colonne * B + 17;
      if (x < monde.camera.x - B || x > monde.camera.x + L + B) continue;
      ctx.fillStyle = "#e8e8e8";
      ctx.fillRect(x, C.solY - 110, 5, 110);
      if (d.arrivee) {
        // Le drapeau d'arrivée : un damier noir et blanc, comme dans les courses.
        for (let i = 0; i < 6; i++) {
          for (let k = 0; k < 3; k++) {
            ctx.fillStyle = (i + k) % 2 ? "#111" : "#fff";
            ctx.fillRect(x + 5 + i * 8, C.solY - 110 + k * 8, 8, 8);
          }
        }
        ctx.font = "bold 16px 'Trebuchet MS', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffe27a";
        ctx.fillText("ARRIVÉE", x + 28, C.solY - 120);
        continue;
      }
      ctx.fillStyle = d.atteint ? "#3fc27a" : "#e05555";
      ctx.beginPath();
      ctx.moveTo(x + 5, C.solY - 110);
      ctx.lineTo(x + 45, C.solY - 96);
      ctx.lineTo(x + 5, C.solY - 82);
      ctx.fill();
      ctx.font = "bold 12px 'Trebuchet MS', system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.fillText(String(d.numero), x + 12, C.solY - 92);
    }
  }

  // Le héros. On le dessine comme s'il regardait à droite, entre x = −15 et x = +15 autour de son
  // milieu. S'il regarde à gauche, on retourne le dessin comme dans un miroir : ctx.scale(-1, 1).
  function joueur(j, phase) {
    const milieu = Math.round(j.x + j.l / 2);
    const y = Math.round(j.y);
    if (j.etat === "squelette") return squelette(milieu, y, j.animation);
    const courir = phase === "jeu" && j.etat === "au-sol" && j.vx !== 0;
    const pas = courir ? Math.floor(j.animation * 10) % 2 : 0;

    ctx.save();
    ctx.translate(milieu, 0);
    ctx.scale(j.regard || 1, 1); // −1 = miroir : il regarde à gauche
    const x = -15;
    // Bras (derrière le corps) : levés s'il tombe dans un trou, le long du corps sinon
    ctx.fillStyle = "#f1c27d";
    if (j.brasLeves) {
      ctx.fillRect(x - 1, y - 12, 5, 31);
      ctx.fillRect(x + 26, y - 12, 5, 31);
    } else {
      ctx.fillRect(x, y + 19, 4, 13);
      ctx.fillRect(x + 26, y + 19, 4, 13);
    }
    // Jambes
    ctx.fillStyle = "#34448a";
    ctx.fillRect(x + 5, y + 34, 9, pas ? 9 : 12);
    ctx.fillRect(x + 16, y + 34, 9, pas ? 12 : 9);
    // Corps : rouge s'il a perdu, noirci qui clignote s'il brûle, bleu sinon.
    const clignote = Math.floor(j.animation * 20) % 2;
    ctx.fillStyle = j.etat === "touche" ? "#e05555" : j.etat === "brule" ? (clignote ? "#3b2a26" : "#ff7a1a") : "#2fa3d8";
    ctx.fillRect(x + 4, y + 18, 22, 17);
    // Tête et yeux (tournés du côté où il regarde)
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x + 4, y, 22, 19);
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(x + 4, y, 22, 5);
    ctx.fillStyle = "#1d1d3a";
    ctx.fillRect(x + 17, y + 8, 3, 4);
    ctx.fillRect(x + 23, y + 8, 3, 4);
    // Bouche : un petit « o » de surprise quand il tombe dans un trou
    if (j.brasLeves) ctx.fillRect(x + 19, y + 14, 4, 3);
    ctx.restore();
  }

  // Le petit squelette qui danse (étape 8). Toutes les 1/6 s, il change de pas de danse :
  // bras en l'air ou en bas, jambes écartées, petit saut… Il y a 4 pas, qui se répètent.
  function squelette(milieu, y, temps) {
    const pasDeDanse = Math.floor(temps * C.squelette.pasDeDanse) % 4;
    const saut = pasDeDanse === 1 || pasDeDanse === 3 ? -6 : 0; // il sautille
    const penche = pasDeDanse < 2 ? -3 : 3; // il se balance de gauche à droite
    const x = milieu - 15 + penche;
    const h = y + saut;
    const os = "#f4f1e6";
    ctx.fillStyle = os;
    // Crâne
    ctx.fillRect(x + 7, h, 16, 14);
    ctx.fillRect(x + 9, h + 14, 12, 4);
    ctx.fillStyle = "#1d1d3a";
    ctx.fillRect(x + 10, h + 5, 4, 4); // les trous des yeux
    ctx.fillRect(x + 16, h + 5, 4, 4);
    ctx.fillRect(x + 12, h + 15, 2, 3); // les dents
    ctx.fillRect(x + 16, h + 15, 2, 3);
    ctx.fillStyle = os;
    // Colonne et côtes
    ctx.fillRect(x + 14, h + 18, 3, 16);
    for (let k = 0; k < 3; k++) ctx.fillRect(x + 9, h + 20 + k * 4, 13, 2);
    // Bras : en l'air ou en bas, en alternance (c'est la danse !)
    const brasHaut = pasDeDanse % 2 === 0;
    if (brasHaut) {
      ctx.fillRect(x + 4, h + 6, 3, 16);
      ctx.fillRect(x + 24, h + 6, 3, 16);
    } else {
      ctx.fillRect(x + 4, h + 20, 3, 14);
      ctx.fillRect(x + 24, h + 20, 3, 14);
    }
    // Bassin et jambes : écartées ou serrées
    ctx.fillRect(x + 9, h + 34, 13, 3);
    const ecart = pasDeDanse === 2 ? 5 : 0;
    ctx.fillRect(x + 9 - ecart, h + 37, 3, 9 - saut);
    ctx.fillRect(x + 19 + ecart, h + 37, 3, 9 - saut);
  }

  // Les flammes : chaque particule est une petite flamme en pixels. Jeune, elle est grande et jaune ;
  // en vieillissant, elle devient orange, puis rouge, et rapetisse jusqu'à disparaître.
  function flammes(liste) {
    for (const p of liste) {
      const age = 1 - p.vie / p.vieMax; // 0 = vient de naître, 1 = va s'éteindre
      const t = Math.max(2, Math.round(p.taille * (1 - age * 0.8)));
      const x = Math.round(p.x - t / 2);
      const y = Math.round(p.y - t);
      ctx.fillStyle = age < 0.35 ? "#ff9f1a" : age < 0.7 ? "#ff5a1a" : "#b3261e";
      ctx.fillRect(x, y + t * 0.3, t, t * 0.7); // la base, large
      ctx.fillRect(x + t * 0.25, y, t * 0.5, t * 0.4); // la pointe
      if (age < 0.6) {
        ctx.fillStyle = "#ffe066"; // le cœur jaune, seulement chez les jeunes flammes
        ctx.fillRect(x + t * 0.3, y + t * 0.45, t * 0.4, t * 0.45);
      }
    }
  }

  // --- Textes et écrans ---

  function texte(message, x, y, taille, couleur, alignement) {
    ctx.font = "bold " + taille + "px 'Trebuchet MS', system-ui, sans-serif";
    ctx.textAlign = alignement || "left";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(message, x, y);
    ctx.fillStyle = couleur || "#fff";
    ctx.fillText(message, x, y);
  }

  // Un cœur en pixels (plein = vie restante, vide = vie perdue).
  function coeur(x, y, plein) {
    const motif = ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"];
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - 2, y - 2, 28, 22);
    motif.forEach((ligne, i) => {
      for (let k = 0; k < 8; k++) {
        if (ligne[k] === "1") {
          ctx.fillStyle = plein ? "#ff3b5c" : "#4a4f6a";
          ctx.fillRect(x + k * 3, y + i * 3, 3, 3);
        }
      }
    });
  }

  function hud(monde, options) {
    texte("Blocs " + monde.score, 20, 38, 26);
    texte("Record " + Jeu.Sauvegarde.donnees.record, 20, 66, 18, "#ffe27a");
    for (let v = 0; v < C.vies; v++) coeur(20 + v * 30, 80, v < monde.vies);
    texte("🚩 " + monde.dernierDrapeau + "   Chutes " + monde.chutes + "   Lave " + monde.brulures + "   Pièges " + monde.piegesTouches, 20, 124, 16, "#fff");
    texte("X : rayons X   P : pause", L - 20, 32, 15, "#fff", "right");
    texte("👤 " + monde.pseudo, L - 20, 56, 18, "#ffe27a", "right");
    const reste = monde.drapeaux.length ? C.arrivee.drapeau * C.carte.longueurTroncon - monde.score : 0;
    if (reste > 0) texte("🏁 encore " + reste + " blocs", L - 20, 80, 15, "#fff", "right");
    if (options.ralenti) texte("🐢 RALENTI (×0,25)", L / 2, 32, 18, "#ffe27a", "center");
  }

  function voile() {
    ctx.fillStyle = "rgba(10, 15, 35, 0.6)";
    ctx.fillRect(0, 0, L, H);
  }

  // Une durée lisible : « 42,5 s » ou « 1 min 05 s ».
  function duree(secondes) {
    if (secondes < 60) return secondes.toFixed(1).replace(".", ",") + " s";
    const minutes = Math.floor(secondes / 60);
    const reste = Math.floor(secondes % 60);
    return minutes + " min " + String(reste).padStart(2, "0") + " s";
  }

  function ecranAccueil() {
    voile();
    texte("PROJET MAXANCE", L / 2, 78, 52, "#ffe27a", "center");
    texte("Étape 8 : demi-tour, bras levés et squelette", L / 2, 116, 22, "#fff", "center");
    // Au milieu : le formulaire du pseudo (une vraie case de texte HTML, posée par-dessus l'écran).
    texte("← → (ou Q D) : se déplacer     Espace / ↑ / Z : sauter", L / 2, 330, 17, "#cfe0ff", "center");
    texte("🏁 Arrive au drapeau n° " + C.arrivee.drapeau + " (" + C.arrivee.drapeau * C.carte.longueurTroncon + " blocs) le plus vite possible !", L / 2, 358, 17, "#cfe0ff", "center");
    texte("❤️ " + C.vies + " vies · 🕳️ Trou : tu repars devant le trou", L / 2, 386, 17, "#cfe0ff", "center");
    texte("🔥 Lave et 💀 murets à pics rouges : tu repars au drapeau 🚩", L / 2, 414, 17, "#cfe0ff", "center");
    texte("📦 Caisses et 🗼 tours en pierre : sans danger, monte dessus !", L / 2, 442, 17, "#cfe0ff", "center");
    const premier = Jeu.Sauvegarde.donnees.classement[0];
    if (premier) texte("🥇 À battre : " + premier.pseudo + " · " + premier.blocs + " blocs · " + duree(premier.temps), L / 2, 482, 18, "#ffe27a", "center");
    texte("version " + C.version, L - 12, H - 12, 14, "#cfe0ff", "right");
  }

  // Le tableau des 10 meilleurs, dessiné sur l'écran de fin de partie.
  function tableauClassement(monde, haut) {
    const liste = Jeu.Sauvegarde.donnees.classement;
    const colonnes = [
      { titre: "Rang", x: 200, alignement: "left" },
      { titre: "Joueur", x: 290, alignement: "left" },
      { titre: "Blocs", x: 560, alignement: "right" },
      { titre: "Vies", x: 640, alignement: "right" },
      { titre: "Temps", x: 770, alignement: "right" },
    ];
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(180, haut - 24, 600, 34 + Math.max(liste.length, 1) * 25);
    for (const c of colonnes) texte(c.titre, c.x, haut, 15, "#9aa5d6", c.alignement);
    if (!liste.length) texte("Personne pour l'instant", L / 2, haut + 28, 16, "#cfe0ff", "center");
    const medailles = ["🥇", "🥈", "🥉"];
    liste.forEach((p, i) => {
      const y = haut + 27 + i * 25;
      const moi = Jeu.Classement.memeJoueur(p.pseudo, monde.pseudo);
      const couleur = moi ? "#ffe27a" : "#fff";
      if (moi) {
        ctx.fillStyle = "rgba(255,226,122,0.15)";
        ctx.fillRect(184, y - 18, 592, 24);
      }
      const valeurs = [(medailles[i] || "") + " " + Jeu.Classement.nomDuRang(i + 1), p.pseudo + (p.arrivee ? " 🏁" : ""), String(p.blocs), String(p.vies), duree(p.temps)];
      colonnes.forEach((c, k) => texte(valeurs[k], c.x, y, 16, couleur, c.alignement));
    });
  }

  function ecranFin(monde) {
    voile();
    if (monde.gagne) {
      texte("🏁 Bravo " + monde.pseudo + ", tu es arrivé !", L / 2, 58, 40, "#7bff9e", "center");
    } else {
      texte("Aïe ! Plus de vies", L / 2, 58, 44, "#ff7b7b", "center");
      const ou = { lave: "dans la lave 🔥", trou: "dans un trou 🕳️", caisse: "sur une caisse 📦", muret: "sur un muret à pics 💀" };
      texte("Ta dernière vie est tombée " + (ou[monde.cause] || ""), L / 2, 88, 18, "#ffd0d0", "center");
    }
    texte(monde.score + " blocs   ·   " + monde.vies + " vie" + (monde.vies > 1 ? "s" : "") + " restante" + (monde.vies > 1 ? "s" : "") + "   ·   " + duree(monde.temps), L / 2, 122, 24, "#fff", "center");
    const r = Jeu.Sauvegarde.dernierResultat;
    let message = "Pas dans les " + C.classement.taille + " meilleurs cette fois : réessaie !";
    if (r && r.rang && r.ameliore) message = "🏆 Tu es " + Jeu.Classement.nomDuRang(r.rang) + " du classement !";
    else if (r && r.rang) message = "Ta meilleure partie reste " + Jeu.Classement.nomDuRang(r.rang) + " du classement";
    texte(message, L / 2, 154, 20, "#ffe27a", "center");
    tableauClassement(monde, 196);
    if (monde.tempsPhase > 0.4) texte("Espace : rejouer     C : changer de pseudo", L / 2, H - 16, 20, "#fff", "center");
  }

  // --- Rayons X : on dessine ce qui est normalement invisible ---

  function etiquette(lignes, x, y, largeur) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x - 6, y - 12, largeur, lignes.length * 15 + 8);
    ctx.fillStyle = "#fff";
    lignes.forEach((l, i) => ctx.fillText(l, x, y + i * 15));
  }

  // Un petit texte sur fond sombre, lisible sur le ciel comme sur la terre.
  function note(message, x, y, couleur, alignement) {
    ctx.textAlign = alignement || "left";
    const largeur = ctx.measureText(message).width;
    const gauche = alignement === "right" ? x - largeur : x;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(gauche - 3, y - 11, largeur + 6, 15);
    ctx.fillStyle = couleur;
    ctx.fillText(message, x, y);
    ctx.textAlign = "left";
  }

  function rayonsX(monde) {
    const cam = monde.camera;
    const camX = Math.round(cam.x);
    const { premiere, derniere } = colonnesVisibles(cam);
    const j = monde.joueur;
    const ici = Jeu.Joueur.caseDuJoueur(j);

    ctx.save();
    ctx.textAlign = "left";

    // 1. La grille, en coordonnées ÉCRAN (on retire camera.x à chaque x du monde)
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let c = premiere; c <= derniere + 1; c++) {
      const x = c * B - camX + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let l = 0; l <= C.carte.lignes; l++) {
      ctx.beginPath();
      ctx.moveTo(0, l * B + 0.5);
      ctx.lineTo(L, l * B + 0.5);
      ctx.stroke();
    }

    // 2. La case du héros, surlignée
    ctx.fillStyle = "rgba(255,226,122,0.35)";
    ctx.fillRect(ici.colonne * B - camX, ici.ligne * B, B, B);
    ctx.strokeStyle = "#ffe27a";
    ctx.lineWidth = 2;
    ctx.strokeRect(ici.colonne * B - camX + 1, ici.ligne * B + 1, B - 2, B - 2);

    // 3. Le numéro de chaque case (colonne,ligne) et, en jaune, ce qu'elle contient
    ctx.font = "9px ui-monospace, Menlo, Consolas, monospace";
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      for (let l = 0; l < C.carte.lignes; l++) {
        const x = c * B - camX;
        const y = l * B;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText(c + "," + l, x + 2, y + 10);
        const numero = Jeu.Terrain.lireCase(monde.terrain, c, l);
        if (numero !== 0) {
          ctx.fillStyle = "#ffe27a";
          ctx.fillText(String(numero), x + B - 8, y + B - 3);
        }
      }
    }

    // 4. Les trous
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.fillStyle = "#ff7b7b";
    for (let c = Math.max(0, premiere); c <= derniere; c++) {
      const vide = Jeu.Terrain.lireCase(monde.terrain, c, C.carte.ligneSol) === 0;
      const debutDuTrou = Jeu.Terrain.lireCase(monde.terrain, c - 1, C.carte.ligneSol) !== 0;
      if (vide && debutDuTrou) note("trou", c * B - camX + 4, C.solY + 30, "#ff9b9b");
    }
    note("↓ chute si les pieds passent y = " + C.trous.chute + " (sous l'écran)", 10, H - 8, "#ff9b9b");

    // 5. Les drapeaux
    for (const d of monde.drapeaux) {
      const x = d.colonne * B - camX;
      if (x < -120 || x > L) continue;
      const couleur = d.atteint ? "#7bff9e" : "#ff9b9b";
      note((d.arrivee ? "ARRIVÉE : " : "") + "drapeau n°" + d.numero + " · colonne " + d.colonne, x, C.solY - 118, couleur);
      if (d.numero === monde.dernierDrapeau) note("↻ point de retour", x, C.solY - 134, couleur);
    }

    // 6. Les obstacles : sans danger (blanc, on peut marcher dessus) ou mortel (rouge, danger !)
    for (const o of monde.obstacles) {
      const x = o.x - camX;
      if (x + o.l < 0 || x > L) continue;
      ctx.strokeStyle = o.mortel ? "#ff4d4d" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, o.y, o.l, o.h);
      const haut = o.y < C.solY ? o.y : o.y - 30;
      note("#" + o.id + " " + o.type + " · colonne " + o.colonne, x, haut - 20, "#fff");
      const danger = !o.mortel ? "solide : on marche dessus" : o.solide ? "" : o.type === "lave" || o.type === "fosse" ? "liquide : on brûle !" : "piège : ne pas toucher !";
      note(danger, x, haut - 5, o.mortel ? "#ff9b9b" : "#7bff9e");
    }

    // 7. La caméra : l'endroit où elle essaie de garder le héros
    ctx.strokeStyle = "#7bff9e";
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1;
    const xVise = C.camera.positionJoueur;
    ctx.beginPath();
    ctx.moveTo(xVise + 0.5, 110);
    ctx.lineTo(xVise + 0.5, H);
    ctx.stroke();
    ctx.setLineDash([]);
    note("la caméra garde le héros ici", xVise + 4, 124, "#7bff9e");
    note("caméra x = " + Math.round(cam.x) + "   écart à rattraper = " + Math.round(cam.cible - cam.x) + " px", L - 10, H - 24, "#7bff9e", "right");
    note("monde fabriqué jusqu'à la colonne " + (monde.terrain.colonnes.length - 1) + " →", L - 10, H - 8, "#7bff9e", "right");

    // 7 bis. Les flammes : un petit point par particule, et leur nombre
    if (monde.flammes.length) {
      ctx.fillStyle = "#ffe066";
      for (const p of monde.flammes) ctx.fillRect(p.x - camX - 1, p.y - 1, 3, 3);
      const p0 = monde.flammes[0];
      note("🔥 " + monde.flammes.length + " flammes en mémoire", p0.x - camX - 40, C.solY - 60, "#ffe066");
    }
    if (monde.danse) note("💀 danse encore " + Math.max(0, monde.danse.reste).toFixed(2) + " s", monde.joueur.x - camX - 20, C.solY - 76, "#ffffff");
    if (monde.brulure) note("brûle encore " + Math.max(0, monde.brulure.reste).toFixed(2) + " s", monde.joueur.x - camX - 20, C.solY - 76, "#ff9b9b");

    // 8. Le joueur : dessin, zone de collision, vitesse, case
    const jx = j.x - camX;
    const zone = Jeu.Joueur.hitbox(j);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(jx, j.y, j.l, j.h);
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x - camX, zone.y, zone.l, zone.h);
    // Le point qui sert à trouver la case : le milieu des pieds
    ctx.fillStyle = "#ffe27a";
    ctx.fillRect(ici.milieu - camX - 3, ici.pieds - 3, 6, 6);

    const cx = jx + j.l / 2;
    const cy = j.y + j.h / 2;
    fleche(cx, cy, cx + j.vx * 0.15, cy + j.vy * 0.15, "#7bff9e");

    const lignes = [
      "état : " + j.etat + "   regard : " + (j.regard < 0 ? "←" : "→") + (j.brasLeves ? "   🙌" : ""),
      "monde : x=" + Math.round(j.x) + "  y=" + Math.round(j.y),
      "écran : x=" + Math.round(jx),
      "case : colonne " + ici.colonne + ", ligne " + ici.ligne,
      "  " + Math.round(ici.milieu) + " ÷ 40 = " + (ici.milieu / B).toFixed(1).replace(".", ",") + " → " + ici.colonne,
      "  " + Math.round(ici.pieds) + " ÷ 40 = " + (ici.pieds / B).toFixed(1).replace(".", ",") + " → " + ici.ligne,
      "vx=" + Math.round(j.vx) + "  vy=" + Math.round(j.vy),
    ];
    if (j.tamponSaut > 0) lignes.push("saut en mémoire : " + Math.round(j.tamponSaut * 1000) + " ms");
    const haut = Math.max(118, Math.min(j.y - 12 - lignes.length * 15, C.solY - 250));
    etiquette(lignes, Math.min(jx, L - 200), haut, 200);

    ctx.restore();
  }

  function fleche(x1, y1, x2, y2, couleur) {
    const longueur = Math.hypot(x2 - x1, y2 - y1);
    if (longueur < 2) return;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = couleur;
    ctx.fillStyle = couleur;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4));
    ctx.fill();
  }

  // --- Le tableau complet ---

  function dessiner(monde, options) {
    const camX = Math.round(monde.camera.x);
    ciel();
    nuages(camX);
    collines(camX);

    // Tout ce qui est dans le monde est décalé de −camera.x : c'est ça, « regarder à travers la caméra ».
    ctx.save();
    ctx.translate(-camX, 0);
    terrain(monde);
    drapeaux(monde);
    joueur(monde.joueur, monde.phase);
    flammes(monde.flammes);
    ctx.restore();

    if (options.rayonsX) rayonsX(monde);
    if (monde.phase === "jeu") hud(monde, options);
    if (monde.phase === "accueil") ecranAccueil();
    if (monde.phase === "perdu" || monde.phase === "gagne") ecranFin(monde);
    if (options.pause && monde.phase === "jeu") {
      // Pas de voile : en pause, on doit pouvoir observer la scène en détail.
      ctx.fillStyle = "rgba(10, 15, 35, 0.75)";
      ctx.fillRect(L / 2 - 250, 48, 500, 62);
      texte("⏸ PAUSE", L / 2, 76, 24, "#fff", "center");
      texte("P : reprendre     N : avancer d'un pas (1/120 s)", L / 2, 100, 16, "#cfe0ff", "center");
    }
  }

  return { initialiser, dessiner };
})();
