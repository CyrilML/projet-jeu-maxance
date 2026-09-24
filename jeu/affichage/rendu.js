// 🎨 LE RENDU : le peintre du jeu
//
// Ce fichier LIT le monde et le DESSINE. Il ne modifie jamais rien : si on supprimait
// le rendu, le jeu continuerait de tourner… mais on ne verrait rien !
// Séparer « les règles » (logique/) et « le dessin » (affichage/) est une des idées
// les plus importantes de l'architecture d'un jeu.
//
// Le peintre repeint TOUT l'écran à chaque image, du fond vers l'avant :
// ciel → nuages → collines → blocs du terrain → drapeaux → obstacles → joueur → textes → rayons X.
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
    }[matiere];
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(x, y, B, B);
    ctx.fillStyle = couleurs[1];
    if (matiere === "bois") {
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

  function obstacles(liste) {
    for (const o of liste) {
      for (let bx = 0; bx < o.l; bx += B) {
        for (let by = 0; by < o.h; by += B) bloc(o.x + bx, o.y + by, o.matiere, o.id * 3 + bx + by);
      }
    }
  }

  function joueur(j, phase) {
    const x = Math.round(j.x);
    const y = Math.round(j.y);
    const courir = phase === "jeu" && j.etat === "au-sol" && j.vx !== 0;
    const pas = courir ? Math.floor(j.animation * 10) % 2 : 0;

    // Jambes
    ctx.fillStyle = "#34448a";
    ctx.fillRect(x + 5, y + 34, 9, pas ? 9 : 12);
    ctx.fillRect(x + 16, y + 34, 9, pas ? 12 : 9);
    // Corps
    ctx.fillStyle = j.etat === "touche" ? "#e05555" : "#2fa3d8";
    ctx.fillRect(x + 3, y + 18, 24, 17);
    // Tête
    ctx.fillStyle = "#f1c27d";
    ctx.fillRect(x + 4, y, 22, 19);
    ctx.fillStyle = "#5a3a1e";
    ctx.fillRect(x + 4, y, 22, 5);
    ctx.fillStyle = "#1d1d3a";
    ctx.fillRect(x + 17, y + 8, 3, 4);
    ctx.fillRect(x + 23, y + 8, 3, 4);
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

  function hud(monde, options) {
    texte("Blocs " + monde.score, 20, 38, 26);
    texte("Record " + Jeu.Sauvegarde.donnees.record, 20, 66, 18, "#ffe27a");
    texte("🚩 " + monde.dernierDrapeau + "   Chutes " + monde.chutes, 20, 90, 16, "#fff");
    texte("X : rayons X   P : pause", L - 20, 32, 15, "#fff", "right");
    if (options.ralenti) texte("🐢 RALENTI (×0,25)", L / 2, 32, 18, "#ffe27a", "center");
  }

  function voile() {
    ctx.fillStyle = "rgba(10, 15, 35, 0.6)";
    ctx.fillRect(0, 0, L, H);
  }

  function ecranAccueil() {
    voile();
    texte("PROJET MAXANCE", L / 2, 150, 56, "#ffe27a", "center");
    texte("Étape 2 : un monde en blocs", L / 2, 195, 24, "#fff", "center");
    texte("Espace pour jouer", L / 2, 270, 30, "#fff", "center");
    texte("← → (ou Q D) : se déplacer     Espace / ↑ / Z : sauter", L / 2, 320, 18, "#cfe0ff", "center");
    texte("Va le plus loin possible vers la droite !", L / 2, 348, 18, "#cfe0ff", "center");
    texte("🕳️ Trou : retour au dernier drapeau 🚩     🧱 Obstacle : perdu !", L / 2, 376, 18, "#cfe0ff", "center");
  }

  function ecranPerdu(monde) {
    voile();
    texte("Aïe !", L / 2, 170, 60, "#ff7b7b", "center");
    texte(monde.score + " blocs   ·   " + monde.temps.toFixed(1) + " s   ·   " + monde.chutes + " chute" + (monde.chutes > 1 ? "s" : ""), L / 2, 225, 28, "#fff", "center");
    if (monde.nouveauRecord) texte("🏆 Nouveau record !", L / 2, 270, 28, "#ffe27a", "center");
    if (monde.tempsPhase > 0.4) texte("Espace pour recommencer à zéro", L / 2, 330, 26, "#fff", "center");
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
      note("drapeau n°" + d.numero + " · colonne " + d.colonne, x, C.solY - 118, couleur);
      if (d.numero === monde.dernierDrapeau) note("↻ point de retour", x, C.solY - 134, couleur);
    }

    // 6. Les obstacles : zone de collision + identité
    for (const o of monde.obstacles) {
      const x = o.x - camX;
      if (x + o.l < 0 || x > L) continue;
      ctx.strokeStyle = "#ff4d4d";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, o.y, o.l, o.h);
      note("#" + o.id + " " + o.type, x, o.y - 20, "#fff");
      note("colonne " + o.colonne, x, o.y - 5, "#fff");
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
      "état : " + j.etat,
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
    obstacles(monde.obstacles);
    joueur(monde.joueur, monde.phase);
    ctx.restore();

    if (options.rayonsX) rayonsX(monde);
    if (monde.phase !== "accueil") hud(monde, options);
    if (monde.phase === "accueil") ecranAccueil();
    if (monde.phase === "perdu") ecranPerdu(monde);
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
