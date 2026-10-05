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
  Village.Evenements.ecouter("route-impossible", (d) => afficher("🚫 Route : " + d.raison));
  Village.Evenements.ecouter("demolition-impossible", (d) => afficher("🚫 " + d.raison));
  Village.Evenements.ecouter("batiment-relie", (d) => afficher("✅ " + d.nom + " est relié à l'entrepôt !"));
  Village.Evenements.ecouter("batiment-pose", (d) => { if (!d.relie) afficher("Pense à relier " + d.nom + " à l'entrepôt avec une route !"); });
  Village.Evenements.ecouter("saison", (d) => afficher(d.emoji + " C'est " + (d.nom === "été" ? "l'été" : d.nom === "automne" ? "l'automne" : d.nom === "hiver" ? "l'hiver : les lacs gèlent !" : "le printemps") + (d.nom === "printemps" ? " · année " + d.annee : "")));
  Village.Evenements.ecouter("habitant-part", (d) => afficher("😢 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " a quitté le village : il avait trop faim !"));
  Village.Evenements.ecouter("habitant-arrive", (d) => afficher("🙋 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " arrive au village !"));
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
    const s = monde.stock;
    const ressources = [["🪵", s.troncs], ["🟫", s.planches], ["🪨", s.pierres], ["🐟", s.poissons], ["🍖", s.viande]];
    const pas = petit ? 50 : 62, lb = 24 + ressources.length * pas;
    bulle(ctx, 10, 10, lb, petit ? 54 : 62);
    texte(ctx, "🏘️ Ton village · 🪨 Âge de pierre", 22, petit ? 25 : 28, petit ? 11 : 13, "#7a5a30", true);
    ressources.forEach(([emoji, n], k) => texte(ctx, emoji + " " + n, 22 + k * pas, petit ? 47 : 51, petit ? 14 : 17, n <= 0 && k >= 3 ? "#c0392b" : "#3b2614", true));
    // Étape 49 : la saison, avec une petite barre qui montre où on en est dans la saison
    const sa = monde.saison, ys = petit ? 70 : 78;
    if (sa) {
      const ls = petit ? 150 : 180;
      bulle(ctx, 10, ys, ls, petit ? 28 : 32);
      texte(ctx, sa.emoji + " " + sa.nom.charAt(0).toUpperCase() + sa.nom.slice(1) + " · année " + sa.annee, 20, ys + (petit ? 11 : 12), petit ? 11 : 13, "#3b2614", true);
      ctx.fillStyle = "rgba(90, 66, 32, .2)"; ctx.fillRect(20, ys + (petit ? 19 : 22), ls - 20, 4);
      ctx.fillStyle = ["#ff8fc0", "#ffc62e", "#e8862e", "#8fd0ff"][sa.numero]; ctx.fillRect(20, ys + (petit ? 19 : 22), (ls - 20) * sa.avancement, 4);
    }

    // ---- En haut à droite : plein écran, puis la mini-carte
    const tp = 40;
    bulle(ctx, W - tp - 10, 10, tp, tp);
    texte(ctx, document.body.classList.contains("plein-ecran") ? "✖" : "⛶", W - 10 - tp / 2, 10 + tp / 2 + 1, 22, "#3b2614", true, "center");
    zone(W - tp - 10, 10, tp, tp, "pleinEcran");
    if (W >= 520) dessinerMini(ctx, monde, mini, W - 10 - tp - 10, 10, petit ? 1 : 1.5);

    // ---- En bas : les boutons de construction, puis les outils 🛤️ route et 🧹 démolir
    const boutons = B.A_CONSTRUIRE.map((type) => ({
      action: "construire", valeur: type, emoji: B.TYPES[type].emoji, nom: B.TYPES[type].court, touche: String(B.A_CONSTRUIRE.indexOf(type) + 1),
      cout: Object.entries(B.cout(type)).map(([r, n]) => n + ({ planches: "🟫", pierres: "🪨", troncs: "🪵" }[r])).join(" "),
      choisi: monde.construction === type, possible: B.assezPour(monde, type),
    }));
    boutons.push({ action: "outil", valeur: "route", emoji: null, nom: "Route", touche: "R", cout: C.routes.cout.pierres + "🪨/case", choisi: monde.outil === "route", possible: Village.Porteurs.disponible(monde, "pierres") >= C.routes.cout.pierres });
    boutons.push({ action: "outil", valeur: "demolir", emoji: "🧹", nom: "Démolir", touche: "Suppr", cout: "", choisi: monde.outil === "demolir", possible: true });
    // Un bouton doit faire au moins 56 points de large (un doigt). S'ils ne tiennent pas sur une ligne,
    // on en fait deux.
    const ecart = petit ? 5 : 8, n = boutons.length, minimum = 56;
    const parLigne = Math.min(n, Math.max(1, Math.floor((W - 16 + ecart) / (minimum + ecart))));
    const lignesBt = Math.ceil(n / parLigne);
    const lbt = Math.min(74, Math.floor((W - 16 - (parLigne - 1) * ecart) / parLigne)), hbt = petit ? 58 : 66;
    const y0 = He - 10 - lignesBt * hbt - (lignesBt - 1) * 6; // le haut de la première ligne
    const etroit = lbt < 62; // très petit écran : textes plus petits
    boutons.forEach((bt, k) => {
      const ligne = Math.floor(k / parLigne), dansLaLigne = Math.min(parLigne, n - ligne * parLigne);
      const total = dansLaLigne * lbt + (dansLaLigne - 1) * ecart;
      const x = (W - total) / 2 + (k % parLigne) * (lbt + ecart), yb = y0 + ligne * (hbt + 6);
      bulle(ctx, x, yb, lbt, hbt, bt.choisi ? "rgba(255, 226, 122, .98)" : bt.possible ? "rgba(255, 250, 235, .94)" : "rgba(215, 205, 190, .9)");
      if (bt.choisi) { ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 3.5; ctx.stroke(); }
      if (bt.emoji) texte(ctx, bt.emoji, x + lbt / 2, yb + (petit ? 16 : 18), petit ? 19 : 24, null, false, "center");
      else Village.Batisses.iconeRoute(ctx, x + lbt / 2, yb + (petit ? 16 : 18), petit ? 0.7 : 0.85);
      texte(ctx, bt.nom, x + lbt / 2, yb + (petit ? 34 : 39), etroit ? 9 : petit ? 10 : 12, "#3b2614", true, "center");
      if (bt.cout) texte(ctx, bt.cout, x + lbt / 2, yb + (petit ? 48 : 55), etroit ? 9 : petit ? 10 : 11, bt.possible ? "#7a5a30" : "#c0392b", true, "center");
      if (!petit) texte(ctx, bt.touche, x + 6, yb + 11, 10, "#a08a6a", true, "left");
      zone(x, yb, lbt, hbt, bt.action, bt.valeur);
    });

    // ---- Juste au-dessus des boutons : l'aide pour construire, un message, ou la case sous la souris
    let aide = null;
    const maintenant = performance.now();
    if (message && maintenant < message.jusqua) aide = message.texte;
    else if (monde.construction) {
      aide = (Village.Entrees.toucheRecente() ? "Touche" : "Clique sur") + " une case pour poser : " + B.TYPES[monde.construction].nom;
    } else if (monde.outil === "route") {
      aide = monde.routeDepart ? "Maintenant, touche l'arrivée de la route" : "Touche le départ de la route (" + C.routes.cout.pierres + " 🪨 par nouvelle case)";
    } else if (monde.outil === "demolir") {
      aide = "Touche une route ou un bâtiment à démolir";
    } else if (monde.survol) {
      const k = monde.survol, O = Village.Carte.OBJET;
      aide = "Case (" + k.colonne + ", " + k.ligne + ") · " + k.nomTerrain;
      const bat = monde.occupees.get(k.numero);
      if (bat) aide += " · " + B.TYPES[bat.type].nom + (bat.relie ? "" : " (pas de route !)");
      else if (monde.route[k.numero]) aide += " · route" + (monde.reseau.has(k.numero) ? "" : " (pas reliée à l'entrepôt)");
      else if (k.objet && k.objet !== O.montagne) aide += " · " + k.nomObjet + (k.objet === O.rocher ? " (" + k.reste + " pierres)" : "");
      if (k.filon) aide += " · filon de " + k.nomFilon;
    }
    if (aide) {
      // Le texte doit tenir dans l'écran (avec la place du ✖) : sinon, on l'écrit plus petit.
      const place = W - 20 - (monde.construction || monde.outil ? 38 : 0);
      let taille = petit ? 12 : 14;
      ctx.font = "bold " + taille + "px " + POLICE;
      while (taille > 8 && ctx.measureText(aide).width + 24 > place) { taille -= 0.5; ctx.font = "bold " + taille + "px " + POLICE; }
      const l = Math.min(place, ctx.measureText(aide).width + 24), y = y0 - (petit ? 36 : 42);
      bulle(ctx, (W - l) / 2 - (monde.construction || monde.outil ? 19 : 0), y, l, petit ? 28 : 32);
      texte(ctx, aide, W / 2 - (monde.construction || monde.outil ? 19 : 0), y + (petit ? 14 : 16), taille, "#3b2614", true, "center");
      if ((monde.construction || monde.outil) && !(message && maintenant < message.jusqua)) {
        // Le petit ✖ pour annuler
        const ax = (W + l) / 2 - 19 + 6;
        if (ax + 30 < W) { bulle(ctx, ax, y, 30, petit ? 28 : 32); texte(ctx, "✖", ax + 15, y + (petit ? 14 : 16), 14, "#c0392b", true, "center"); zone(ax, y, 30, petit ? 28 : 32, "annuler"); }
      }
    }

    // Étape 49 : il n'y a plus rien à manger !
    if (Village.Repas.nourritureEnStock(monde) <= 0 && !(message && maintenant < message.jusqua) && Math.sin(maintenant / 300) > -0.3) {
      const txt = "🍽️ Plus rien à manger ! Construis un pêcheur ou un chasseur";
      ctx.font = "bold " + (petit ? 11 : 13) + "px " + POLICE;
      // En haut au milieu sur un grand écran ; sous la saison sur un téléphone.
      const l = Math.min(W - 20, ctx.measureText(txt).width + 24), y = W > 760 ? 60 : petit ? 104 : 118;
      bulle(ctx, (W - l) / 2, y, l, 28, "rgba(255, 225, 220, .95)");
      texte(ctx, txt, W / 2, y + 14, petit ? 11 : 13, "#c0392b", true, "center");
    }

    // ---- Le panneau du bâtiment touché
    if (monde.selection) panneauBatiment(ctx, monde, monde.selection, 10, petit ? 104 : 118, petit ? 230 : 270);

    if (options.pause) {
      bulle(ctx, W / 2 - 70, 12, 140, 36);
      texte(ctx, "⏸ PAUSE", W / 2, 30, 17, "#3b2614", true, "center");
    }
  }

  function panneauBatiment(ctx, monde, b, x, y, l) {
    const B = Village.Batiments, type = B.TYPES[b.type], petit = Ec.petit;
    const lignes = [];
    if (b.type !== "entrepot") lignes.push(b.relie ? "✅ Relié à l'entrepôt par une route" : "❌ Pas de route jusqu'à l'entrepôt !");
    if (b.etat === "chantier") {
      const m = B.materiaux(b);
      lignes.push("🏗️ Chantier : " + Math.round(b.progres * 100) + " %");
      lignes.push("Matériaux arrivés : " + m.arrives + " / " + m.total);
    } else if (b.type === "entrepot") {
      const P = Village.Porteurs, d = (r) => P.disponible(monde, r);
      lignes.push("🪵 " + monde.stock.troncs + "   🟫 " + monde.stock.planches + "   🪨 " + monde.stock.pierres);
      lignes.push("libres : 🪵 " + d("troncs") + "   🟫 " + d("planches") + "   🪨 " + d("pierres"));
      lignes.push("🐟 " + monde.stock.poissons + "   🍖 " + monde.stock.viande + "   (libres : " + d("poissons") + " · " + d("viande") + ")");
      const actifs = Village.Porteurs.actifs(monde), dehors = actifs.filter((p) => p.etat !== "attend").length;
      lignes.push("🚚 " + actifs.length + " porteurs : " + dehors + " au travail" + (actifs.some((p) => p.affame) ? " · 🍽️ certains ont faim !" : ""));
      if (monde.partis) lignes.push("😢 " + monde.partis + " habitant(s) parti(s) (trop faim)");
      lignes.push("📋 File d'attente : " + monde.file.length + " livraison(s)");
    } else if (b.type === "scierie") {
      lignes.push(b.travail ? "🪚 Scie un tronc… " + Math.ceil(b.travail.reste) + " s" : b.entree ? "Prête à scier" : "😴 Attend des troncs");
      lignes.push("Réserve : " + b.entree + " 🪵 · devant la porte : " + b.sortie + " 🟫");
      lignes.push("A fait " + b.produits + " planches");
    } else if (!b.ouvrier) {
      lignes.push("😢 L'habitant est parti : il avait trop faim.");
      lignes.push(Village.Repas.nourritureEnStock(monde) >= 2 ? "Un nouvel habitant arrive dans " + Math.ceil(C.repas.retour - (b.attenteHabitant || 0)) + " s" : "Il faut de la nourriture dans l'entrepôt.");
    } else {
      const o = b.ouvrier;
      lignes.push("👷 Le " + type.metier + " " + Village.Ouvriers.NOMS_ETATS[o.etat]);
      if (o.etat === "travailler") lignes.push("encore " + Math.ceil(o.minuteur) + " s");
      if (b.sortieQuoi) lignes.push("Devant la porte : " + b.sortie + " / " + C.sortieMax + " " + ({ troncs: "🪵", pierres: "🪨", poissons: "🐟", viande: "🍖" }[b.sortieQuoi]));
      lignes.push((b.type === "forestier" ? "A planté " : "A rapporté ") + b.produits + ({ bucheron: " troncs", forestier: " pousses", carriere: " pierres", pecheur: " poissons", chasseur: " gibiers" }[b.type]));
    }
    // Étape 49 : le repas de l'ouvrier
    const o = b.ouvrier;
    if (o && b.etat === "pret") {
      const ventre = o.affame ? "🍽️ A FAIM depuis " + Math.floor(o.ventreVide) + " s (part à " + C.repas.tropFaim + " s)" : "😋 Prochain repas dans " + Math.max(0, Math.ceil(C.repas.intervalle - o.faim)) + " s";
      lignes.push(ventre);
      lignes.push("Repas dans la cabane : 🐟 " + b.repas.poissons + " · 🍖 " + b.repas.viande);
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
