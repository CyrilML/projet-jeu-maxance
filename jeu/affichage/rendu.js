// 🎨 LE RENDU : le peintre du jeu
//
// Ce fichier LIT le monde et le DESSINE. Il ne modifie jamais rien : si on supprimait
// le rendu, le jeu continuerait de tourner… mais on ne verrait rien !
// Séparer « les règles » (logique/) et « le dessin » (affichage/) est une des idées
// les plus importantes de l'architecture d'un jeu.
//
// Le peintre repeint TOUT l'écran à chaque image, du fond vers l'avant :
// ciel → collines → sol → obstacles → joueur → textes → rayons X.

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

  // --- Décor ---

  function ciel() {
    const degrade = ctx.createLinearGradient(0, 0, 0, C.solY);
    degrade.addColorStop(0, "#6fb7ff");
    degrade.addColorStop(1, "#bfe3ff");
    ctx.fillStyle = degrade;
    ctx.fillRect(0, 0, L, H);
  }

  function nuages(distance) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 5; i++) {
      const x = ((i * 260 - distance * 0.1) % (L + 200) + L + 200) % (L + 200) - 100;
      const y = 50 + ((i * 53) % 90);
      ctx.fillRect(x, y, 80, 20);
      ctx.fillRect(x + 20, y - 14, 50, 14);
    }
  }

  function collines(distance) {
    ctx.fillStyle = "#7cc47a";
    ctx.beginPath();
    ctx.moveTo(0, C.solY);
    for (let x = 0; x <= L; x += 8) {
      const u = (x + distance * 0.3) / 140;
      ctx.lineTo(x, C.solY - 70 - 30 * Math.sin(u) - 15 * Math.sin(u * 2.3));
    }
    ctx.lineTo(L, C.solY);
    ctx.fill();
  }

  function sol(distance) {
    const decalage = distance % B;
    const premiereColonne = Math.floor(distance / B);
    for (let i = 0; i <= L / B + 1; i++) {
      const x = i * B - decalage;
      const colonne = premiereColonne + i;
      for (let y = C.solY, ligne = 0; y < H; y += B, ligne++) {
        bloc(x, y, ligne === 0 ? "herbe" : "terre", colonne * 7 + ligne * 13);
      }
    }
  }

  // Dessine un bloc de 40 × 40. `graine` sert à varier les petits détails sans hasard,
  // pour qu'un même bloc soit toujours dessiné pareil d'une image à l'autre.
  function bloc(x, y, matiere, graine) {
    const couleurs = {
      terre: ["#8b5a2b", "#74481f"],
      herbe: ["#8b5a2b", "#74481f"],
      bois: ["#b5793a", "#8c5a28"],
      pierre: ["#8e939b", "#6f747c"],
    }[matiere];
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(x, y, B, B);
    ctx.fillStyle = couleurs[1];
    if (matiere === "bois") {
      ctx.fillRect(x, y + 12, B, 3);
      ctx.fillRect(x, y + 26, B, 3);
      ctx.fillRect(x + 2, y + 2, B - 4, 2);
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
    const courir = phase === "jeu" && j.etat === "au-sol";
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
    texte("Score " + monde.score, 20, 38, 26);
    texte("Record " + Jeu.Sauvegarde.donnees.record, 20, 66, 18, "#ffe27a");
    texte("X : rayons X   P : pause", L - 20, 32, 15, "#fff", "right");
    if (options.ralenti) texte("🐢 RALENTI (×0,25)", L / 2, 32, 18, "#ffe27a", "center");
  }

  function voile() {
    ctx.fillStyle = "rgba(10, 15, 35, 0.6)";
    ctx.fillRect(0, 0, L, H);
  }

  function ecranAccueil() {
    voile();
    texte("PROJET MAXANCE", L / 2, 170, 56, "#ffe27a", "center");
    texte("Étape 1 : courir, sauter, esquiver", L / 2, 215, 24, "#fff", "center");
    texte("Espace pour jouer", L / 2, 300, 30, "#fff", "center");
    texte("← → (ou Q D) : se déplacer     Espace / ↑ / Z : sauter", L / 2, 350, 18, "#cfe0ff", "center");
    texte("Garde la touche enfoncée pour sauter plus haut", L / 2, 378, 18, "#cfe0ff", "center");
  }

  function ecranPerdu(monde) {
    voile();
    texte("Aïe !", L / 2, 170, 60, "#ff7b7b", "center");
    texte("Score : " + monde.score + "   ·   " + monde.temps.toFixed(1) + " s", L / 2, 225, 28, "#fff", "center");
    if (monde.nouveauRecord) texte("🏆 Nouveau record !", L / 2, 270, 28, "#ffe27a", "center");
    if (monde.tempsPhase > 0.4) texte("Espace pour rejouer", L / 2, 330, 26, "#fff", "center");
  }

  // --- Rayons X : on dessine ce qui est normalement invisible ---

  function rayonsX(monde) {
    ctx.save();
    ctx.font = "12px ui-monospace, Menlo, Consolas, monospace";
    ctx.textAlign = "left";

    // La grille de blocs et les coordonnées
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= L; x += B) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= H; y += B) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(L, y + 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    for (let x = 0; x < L; x += 200) ctx.fillText("x=" + x, x + 3, 96);
    ctx.fillText("(0,0) ↖ origine", 3, 110);

    // Le sol
    ctx.strokeStyle = "#ffe27a";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, C.solY);
    ctx.lineTo(L, C.solY);
    ctx.stroke();
    ctx.fillStyle = "#ffe27a";
    ctx.fillText("sol : y = " + C.solY, L - 110, C.solY - 6);

    // Naissance et mort des obstacles
    ctx.strokeStyle = "#7bff9e";
    ctx.beginPath();
    ctx.moveTo(L - 1, 120);
    ctx.lineTo(L - 1, C.solY);
    ctx.stroke();
    ctx.strokeStyle = "#ff7b7b";
    ctx.beginPath();
    ctx.moveTo(1, 120);
    ctx.lineTo(1, C.solY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#7bff9e";
    ctx.textAlign = "right";
    ctx.fillText("naissance des obstacles →", L - 6, 134);
    if (monde.phase === "jeu") ctx.fillText("prochain dans " + monde.tempsAvantProchain.toFixed(2) + " s", L - 6, 150);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ff7b7b";
    ctx.fillText("← suppression", 6, 134);

    // Obstacles : zone de collision + identité
    for (const o of monde.obstacles) {
      ctx.strokeStyle = "#ff4d4d";
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x, o.y, o.l, o.h);
      ctx.fillStyle = "#fff";
      ctx.fillText("#" + o.id + " " + o.type, o.x, o.y - 18);
      ctx.fillText("x=" + Math.round(o.x), o.x, o.y - 5);
    }

    // Joueur : dessin, zone de collision, vitesse, état
    const j = monde.joueur;
    const zone = Jeu.Joueur.hitbox(j);
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.strokeRect(j.x, j.y, j.l, j.h);
    ctx.setLineDash([]);
    ctx.strokeStyle = "#ff4d4d";
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x, zone.y, zone.l, zone.h);

    const cx = j.x + j.l / 2;
    const cy = j.y + j.h / 2;
    fleche(cx, cy, cx + j.vx * 0.15, cy + j.vy * 0.15, "#7bff9e");

    ctx.fillStyle = "#fff";
    const lignes = [
      "état : " + j.etat,
      "x=" + Math.round(j.x) + "  y=" + Math.round(j.y),
      "vx=" + Math.round(j.vx) + "  vy=" + Math.round(j.vy),
    ];
    if (j.tamponSaut > 0) lignes.push("saut en mémoire : " + Math.round(j.tamponSaut * 1000) + " ms");
    const haut = Math.min(j.y - 12 - lignes.length * 15, C.solY - 140);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(j.x - 6, haut - 12, 190, lignes.length * 15 + 8);
    ctx.fillStyle = "#fff";
    lignes.forEach((l, i) => ctx.fillText(l, j.x, haut + i * 15));

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
    ciel();
    nuages(monde.distance);
    collines(monde.distance);
    sol(monde.distance);
    obstacles(monde.obstacles);
    joueur(monde.joueur, monde.phase);
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
