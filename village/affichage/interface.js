// 🪧 L'INTERFACE : les panneaux et les boutons dessinés dans l'écran du jeu
//
// Sur un téléphone, il n'y a ni clavier ni souris : tout doit se faire au doigt, DANS l'écran.
// Ce fichier dessine :
//   - en haut à gauche : le nom du village et le STOCK de l'entrepôt (🪵 troncs, 🟫 planches, 🪨 pierres) ;
//   - en haut à droite : le bouton plein écran ⛶ et la mini-carte ;
//   - en bas : les gros BOUTONS de construction (assez gros pour un doigt : au moins 56 points) ;
//   - le panneau du bâtiment touché, et les messages d'aide.
//
// Il se souvient de l'endroit où il a dessiné chaque bouton (les ZONES). Quand on touche l'écran,
// main.js lui demande « y a-t-il un bouton ici ? » avant de donner le clic à la carte.

window.Village = window.Village || {};

Village.Interface = (function () {
  const C = Village.CONFIG;
  const Ec = Village.Ecran;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const POLICE = "'Trebuchet MS', sans-serif";
  let zones = [];
  let message = null; // { texte, jusqua } : un message qui s'affiche quelques secondes

  // Les messages importants de la radio s'affichent aussi dans le jeu (sur téléphone, on ne voit pas le journal).
  Village.Evenements.ecouter("construction-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("chantier-fini", (d) => afficher("🎉 " + d.nom + " est construit" + (d.metier ? " : le " + d.metier + " se met au travail !" : " !")));
  Village.Evenements.ecouter("rien-a-faire", (d) => afficher("😴 " + d.nom + " : pas de " + d.quoi.replace(/^une? /, "") + " à moins de " + d.rayon + " pas"));
  function afficher(texte) { message = { texte, jusqua: performance.now() + 3500 }; }

  function bulle(ctx, x, y, l, h, couleur) {
    ctx.fillStyle = couleur || "rgba(255, 250, 235, .94)";
    ctx.strokeStyle = "#5a4220";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, l, h, 12); else ctx.rect(x, y, l, h);
    ctx.fill(); ctx.stroke();
  }

  function texte(ctx, t, x, y, taille, couleur, gras, alignement) {
    ctx.font = (gras ? "bold " : "") + taille + "px " + POLICE;
    ctx.fillStyle = couleur || "#3b2614";
    ctx.textAlign = alignement || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(t, x, y);
    ctx.textAlign = "left";
  }

  function zone(x, y, l, h, action, valeur) { zones.push({ x, y, l, h, action, valeur }); }

  // Y a-t-il un bouton à cet endroit ? (le dernier dessiné est au-dessus)
  function zoneSous(x, y) {
    for (let k = zones.length - 1; k >= 0; k--) {
      const z = zones[k];
      if (x >= z.x && x <= z.x + z.l && y >= z.y && y <= z.y + z.h) return z;
    }
    return null;
  }

  function dessiner(ctx, monde, options, mini) {
    zones = [];
    const W = Ec.largeur, He = Ec.hauteur, petit = Ec.petit;
    const B = Village.Batiments;

    // ---- En haut à gauche : le village et le stock
    const lb = petit ? 200 : 250;
    bulle(ctx, 10, 10, lb, petit ? 54 : 62);
    texte(ctx, "🏘️ Ton village · 🪨 Âge de pierre", 22, petit ? 25 : 28, petit ? 11 : 13, "#7a5a30", true);
    const s = monde.stock;
    const ressources = [["🪵", s.troncs], ["🟫", s.planches], ["🪨", s.pierres]];
    ressources.forEach(([emoji, n], k) => texte(ctx, emoji + " " + n, 22 + k * (petit ? 60 : 76), petit ? 47 : 51, petit ? 16 : 19, "#3b2614", true));

    // ---- En haut à droite : plein écran, puis la mini-carte
    const tp = 40;
    bulle(ctx, W - tp - 10, 10, tp, tp);
    texte(ctx, document.body.classList.contains("plein-ecran") ? "✖" : "⛶", W - 10 - tp / 2, 10 + tp / 2 + 1, 22, "#3b2614", true, "center");
    zone(W - tp - 10, 10, tp, tp, "pleinEcran");
    if (W >= 520) dessinerMini(ctx, monde, mini, W - 10 - tp - 10, 10, petit ? 1 : 1.5);

    // ---- En bas : les boutons de construction
    const lbt = petit ? 62 : 74, hbt = petit ? 58 : 66, ecart = 8;
    const total = B.A_CONSTRUIRE.length * lbt + (B.A_CONSTRUIRE.length - 1) * ecart;
    const x0 = (W - total) / 2, y0 = He - hbt - 10;
    B.A_CONSTRUIRE.forEach((type, k) => {
      const x = x0 + k * (lbt + ecart), choisi = monde.construction === type, possible = B.assezPour(s, type);
      bulle(ctx, x, y0, lbt, hbt, choisi ? "rgba(255, 226, 122, .98)" : possible ? "rgba(255, 250, 235, .94)" : "rgba(215, 205, 190, .9)");
      if (choisi) { ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 3.5; ctx.stroke(); }
      texte(ctx, B.TYPES[type].emoji, x + lbt / 2, y0 + (petit ? 16 : 18), petit ? 20 : 24, null, false, "center");
      texte(ctx, B.TYPES[type].court, x + lbt / 2, y0 + (petit ? 34 : 39), petit ? 10 : 12, "#3b2614", true, "center");
      const cout = Object.entries(B.cout(type)).map(([r, n]) => n + ({ planches: "🟫", pierres: "🪨", troncs: "🪵" }[r])).join(" ");
      texte(ctx, cout, x + lbt / 2, y0 + (petit ? 48 : 55), petit ? 10 : 11, possible ? "#7a5a30" : "#c0392b", true, "center");
      if (!petit) texte(ctx, String(k + 1), x + 9, y0 + 11, 10, "#a08a6a", true, "center"); // la touche du clavier
      zone(x, y0, lbt, hbt, "construire", type);
    });

    // ---- Juste au-dessus des boutons : l'aide pour construire, un message, ou la case sous la souris
    let aide = null;
    const maintenant = performance.now();
    if (message && maintenant < message.jusqua) aide = message.texte;
    else if (monde.construction) {
      aide = (Village.Entrees.toucheRecente() ? "Touche" : "Clique sur") + " une case pour poser : " + B.TYPES[monde.construction].nom;
    } else if (monde.survol) {
      const k = monde.survol, O = Village.Carte.OBJET;
      aide = "Case (" + k.colonne + ", " + k.ligne + ") · " + k.nomTerrain;
      const bat = monde.occupees.get(k.numero);
      if (bat) aide += " · " + B.TYPES[bat.type].nom;
      else if (k.objet && k.objet !== O.montagne) aide += " · " + k.nomObjet + (k.objet === O.rocher ? " (" + k.reste + " pierres)" : "");
      if (k.filon) aide += " · filon de " + k.nomFilon;
    }
    if (aide) {
      ctx.font = "bold " + (petit ? 12 : 14) + "px " + POLICE;
      const l = Math.min(W - 20, ctx.measureText(aide).width + 28), y = y0 - (petit ? 36 : 42);
      bulle(ctx, (W - l) / 2, y, l, petit ? 28 : 32);
      texte(ctx, aide, W / 2, y + (petit ? 14 : 16), petit ? 12 : 14, "#3b2614", true, "center");
      if (monde.construction && !(message && maintenant < message.jusqua)) {
        // Le petit ✖ pour annuler
        const ax = (W + l) / 2 + 6;
        if (ax + 30 < W) { bulle(ctx, ax, y, 30, petit ? 28 : 32); texte(ctx, "✖", ax + 15, y + (petit ? 14 : 16), 14, "#c0392b", true, "center"); zone(ax, y, 30, petit ? 28 : 32, "annuler"); }
      }
    }

    // ---- Le panneau du bâtiment touché
    if (monde.selection) panneauBatiment(ctx, monde, monde.selection, 10, petit ? 72 : 82, petit ? 210 : 250);

    if (options.pause) {
      bulle(ctx, W / 2 - 70, 12, 140, 36);
      texte(ctx, "⏸ PAUSE", W / 2, 30, 17, "#3b2614", true, "center");
    }
  }

  function panneauBatiment(ctx, monde, b, x, y, l) {
    const B = Village.Batiments, type = B.TYPES[b.type], petit = Ec.petit;
    const lignes = [];
    if (b.etat === "chantier") {
      lignes.push("🏗️ Chantier : " + Math.round(b.progres * 100) + " %");
      lignes.push("encore " + Math.ceil((1 - b.progres) * C.batiments[b.type].construction) + " s");
    } else if (b.type === "entrepot") {
      lignes.push("Tout le stock du village est rangé ici.");
      lignes.push("🪵 " + monde.stock.troncs + "   🟫 " + monde.stock.planches + "   🪨 " + monde.stock.pierres);
    } else if (b.type === "scierie") {
      lignes.push(b.travail ? "🪚 Scie un tronc… " + Math.ceil(b.travail.reste) + " s" : monde.stock.troncs ? "Prend un tronc…" : "😴 Attend des troncs");
      lignes.push("1 🪵 → " + C.ouvriers.planchesParTronc + " 🟫 en " + C.ouvriers.scier + " s");
      lignes.push("A fait " + b.produits + " planches");
    } else {
      const o = b.ouvrier;
      lignes.push("👷 Le " + type.metier + " " + Village.Ouvriers.NOMS_ETATS[o.etat]);
      if (o.etat === "travailler") lignes.push("encore " + Math.ceil(o.minuteur) + " s");
      lignes.push((b.type === "forestier" ? "A planté " : "A rapporté ") + b.produits + (b.type === "bucheron" ? " troncs" : b.type === "forestier" ? " pousses" : " pierres"));
      lignes.push("Travaille jusqu'à " + C.batiments[b.type].rayon + " pas de sa maison");
    }
    const h = 34 + lignes.length * (petit ? 17 : 19) + 8;
    bulle(ctx, x, y, l, h);
    texte(ctx, type.emoji + " " + type.nom, x + 12, y + 18, petit ? 13 : 15, "#3b2614", true);
    lignes.forEach((t, n) => texte(ctx, t, x + 12, y + 38 + n * (petit ? 17 : 19), petit ? 11 : 13, "#5a4220"));
    // Le ✖ pour fermer
    texte(ctx, "✖", x + l - 16, y + 17, 14, "#a08a6a", true, "center");
    zone(x + l - 34, y, 34, 34, "fermer");
    zone(x, y, l, h, "rien"); // toucher le panneau ne doit pas toucher la carte en dessous
  }

  // La mini-carte, avec un cadre qui montre ce que l'écran regarde. Toucher la mini-carte = y aller.
  function dessinerMini(ctx, monde, mini, droite, haut, echelle) {
    const mw = mini.width * echelle, mh = mini.height * echelle;
    const mx = droite - mw - 8, my = haut + 8;
    bulle(ctx, mx - 8, my - 8, mw + 16, mh + 16);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mini, mx, my, mw, mh);
    ctx.imageSmoothingEnabled = true;
    const cam = monde.camera, carte = monde.carte;
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    [[0, 0], [Ec.largeur, 0], [Ec.largeur, Ec.hauteur], [0, Ec.hauteur]].forEach(([ex, ey], n) => {
      const m = Village.Monde.ecranVersMonde(cam, ex, ey);
      const px = mx + (m.x / (L / 2) + carte.lignes) * echelle, py = my + (m.y / Hc) * echelle;
      n ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.closePath(); ctx.stroke();
    texte(ctx, "🔍 " + Math.round(cam.zoom * 100) + " %", droite - 8, my + mh + 20, 12, "#ffffff", true, "right");
    // Pour aller ailleurs : on donne le point du monde qui correspond à l'endroit touché.
    zones.push({ x: mx, y: my, l: mw, h: mh, action: "miniCarte", versMonde: (x, y) => ({ x: ((x - mx) / echelle - carte.lignes) * (L / 2), y: ((y - my) / echelle) * Hc }) });
  }

  return { dessiner, zoneSous };
})();
