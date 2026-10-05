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
  let menuOuvert = null;
  let objectifsOuverts = false; // étape 6 : le panneau des objectifs pour passer à l'âge suivant // étape 5 : le groupe du menu ouvert ("bois", "pierre", "nourriture", "outils") ou null
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
  Village.Evenements.ecouter("habitant-part", (d) => afficher("😢 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " a quitté le village : il avait faim depuis un an !"));
  Village.Evenements.ecouter("habitant-arrive", (d) => afficher("🙋 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " arrive au village !"));
  Village.Evenements.ecouter("nouvel-age", (d) => afficher("🎉 " + d.emoji + " Bienvenue au " + d.nom.replace(/^(Le|La) /, "").toLowerCase() + " !" + (d.debloque.length ? " Nouveau : " + d.debloque.join(", ") : "")));
  Village.Evenements.ecouter("deplacement-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("batiment-deplace", (d) => afficher("↔️ " + d.nom + " a déménagé" + (d.relie ? " !" : " : pense à la route !")));
  Village.Evenements.ecouter("gisement-trouve", (d) => afficher("🔍 Le géologue a trouvé un gisement : " + d.pierres + " 🪨 !"));
  Village.Evenements.ecouter("affame", () => afficher("🍽️ Plus rien à manger : on travaille 2 fois moins vite !"));
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

  // Le tiroir : une rangée de cartes au-dessus du menu, une par bâtiment (ou par outil) du groupe.
  function tiroir(ctx, monde, g, bas, W, petit) {
    const B = Village.Batiments;
    const elements = g.batiments
      ? g.batiments.map((type) => ({
          action: "construire", valeur: type, emoji: B.TYPES[type].emoji, nom: B.TYPES[type].court, touche: String(B.A_CONSTRUIRE.indexOf(type) + 1),
          cout: Object.entries(B.cout(type)).map(([r, n]) => n + ({ planches: "🟫", pierres: "🪨", troncs: "🪵" }[r])).join(" "),
          choisi: monde.construction === type, possible: B.assezPour(monde, type) && Village.Ages.debloque(monde, type),
          verrou: Village.Ages.debloque(monde, type) ? null : C.ages[Village.Ages.ageDe(type)], // étape 6 : pas encore débloqué
        }))
      : g.outils.map((o) => ({ action: "outil", valeur: o.id, emoji: o.emoji, nom: o.nom, touche: o.touche, cout: "", choisi: monde.outil === o.id, possible: true }));
    const lc = petit ? 74 : 84, hc = petit ? 74 : 84, ec = 8;
    const total = elements.length * lc + (elements.length - 1) * ec + 16;
    const x0 = Math.max(10, Math.min(W - total - 10, (W - total) / 2)), y0 = bas - hc - 8;
    bulle(ctx, x0, y0 - 8, total, hc + 16, "rgba(255, 250, 235, .97)");
    elements.forEach((el, k) => {
      const x = x0 + 8 + k * (lc + ec);
      ctx.fillStyle = el.choisi ? "#ffe27a" : el.possible ? "#fffaf0" : "#e4dccd"; ctx.strokeStyle = el.choisi ? "#ff8a1f" : "#c9b48f"; ctx.lineWidth = el.choisi ? 3 : 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y0, lc, hc, 12); else ctx.rect(x, y0, lc, hc);
      ctx.fill(); ctx.stroke();
      texte(ctx, el.emoji, x + lc / 2, y0 + hc * 0.3, petit ? 24 : 28, null, false, "center");
      texte(ctx, el.nom, x + lc / 2, y0 + hc * 0.62, petit ? 11 : 12, "#3b2614", true, "center");
      if (el.verrou) texte(ctx, "🔒 " + el.verrou.emoji + " " + el.verrou.nom.replace(/^(Le|La) /, ""), x + lc / 2, y0 + hc * 0.84, petit ? 10 : 11, "#8a7a60", true, "center");
      else if (el.cout) texte(ctx, el.cout, x + lc / 2, y0 + hc * 0.84, petit ? 10 : 11, el.possible ? "#7a5a30" : "#c0392b", true, "center");
      if (!petit) texte(ctx, el.touche, x + 7, y0 + 10, 10, "#a08a6a", true, "left");
      zone(x, y0, lc, hc, el.action, el.valeur);
    });
    zone(x0, y0 - 8, total, hc + 16, "rien"); // toucher entre les cartes ne touche pas la carte du monde
  }

  // Étape 6 : le panneau des objectifs de l'âge
  function panneauObjectifs(ctx, monde, x, y, l) {
    const petit = Ec.petit, age = Village.Ages.actuel(monde), prochain = Village.Ages.suivant(monde), obj = Village.Ages.objectifs(monde);
    const lignes = [];
    if (obj && prochain) {
      lignes.push(["Pour passer au " + prochain.nom.replace(/^(Le|La) /, "").toLowerCase() + " " + prochain.emoji + " :", "#3b2614", true]);
      for (const o of obj) lignes.push([(o.fait ? "✅ " : "⬜ ") + o.texte + " : " + Math.min(o.valeur, o.cible) + " / " + o.cible, o.fait ? "#2e8a3a" : "#5a4220", false]);
      const nouveaux = prochain.debloque.map((t) => Village.Batiments.TYPES[t].emoji + " " + Village.Batiments.TYPES[t].court).join(", ");
      if (nouveaux) lignes.push(["Tu débloqueras : " + nouveaux, "#7a5a30", false]);
    } else lignes.push([age.emoji + " " + age.nom + " : la suite arrive bientôt !", "#3b2614", true]);
    const h = 16 + lignes.length * (petit ? 18 : 20);
    bulle(ctx, x, y, l, h);
    lignes.forEach(([t, c, g], n) => texte(ctx, t, x + 12, y + 16 + n * (petit ? 18 : 20), petit ? 11 : 13, c, g));
    zone(x, y, l, h, "objectifs");
  }
  function basculerObjectifs() { objectifsOuverts = !objectifsOuverts; }

  // Ouvrir ou fermer un groupe du menu (appelé par main.js quand on touche un groupe)
  function basculerMenu(id) { menuOuvert = menuOuvert === id ? null : id; }
  function fermerMenu() { menuOuvert = null; }

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
    // Étape 6 : l'âge du village et, à côté, où on en est des objectifs pour passer au suivant.
    // (La barre de la saison a été enlevée : ✍️ elle ne servait à rien.) Toucher : voir les objectifs.
    const age = Village.Ages.actuel(monde), prochain = Village.Ages.suivant(monde), obj = Village.Ages.objectifs(monde);
    let titre = age.emoji + " " + age.nom;
    if (obj && prochain) titre += " · " + prochain.emoji + " " + obj.filter((x) => x.fait).length + "/" + obj.length + " 🎯";
    texte(ctx, titre, 22, petit ? 25 : 28, petit ? 11 : 13, "#7a5a30", true);
    ressources.forEach(([emoji, n], k) => texte(ctx, emoji + " " + n, 22 + k * pas, petit ? 47 : 51, petit ? 14 : 17, n <= 0 && k >= 3 ? "#c0392b" : "#3b2614", true));
    zone(10, 10, lb, petit ? 54 : 62, "objectifs");
    if (objectifsOuverts) panneauObjectifs(ctx, monde, 10, petit ? 72 : 80, petit ? 250 : 290);

    // ---- En haut à droite : plein écran, puis la mini-carte
    const tp = 40;
    bulle(ctx, W - tp - 10, 10, tp, tp);
    texte(ctx, document.body.classList.contains("plein-ecran") ? "✖" : "⛶", W - 10 - tp / 2, 10 + tp / 2 + 1, 22, "#3b2614", true, "center");
    zone(W - tp - 10, 10, tp, tp, "pleinEcran");
    if (W >= 520) dessinerMini(ctx, monde, mini, W - 10 - tp - 10, 10, petit ? 1 : 1.5);

    // ---- En bas : le MENU (étape 5). ✍️ Moins de boutons toujours affichés, regroupés par ressource :
    //   🪵 Bois · 🪨 Pierre · 🍖 Nourriture · la Route · 🔧 Outils.
    // Toucher un groupe ouvre un tiroir, juste au-dessus, avec ses bâtiments.
    const groupes = [
      { id: "bois", emoji: "🪵", nom: "Bois", batiments: ["bucheron", "forestier", "scierie"] },
      { id: "pierre", emoji: "🪨", nom: "Pierre", batiments: ["carriere", "geologue"] },
      { id: "nourriture", emoji: "🍖", nom: "Nourriture", batiments: ["pecheur", "chasseur"] },
      { id: "route", nom: "Chemin", outil: "route" },
      { id: "outils", emoji: "🔧", nom: "Outils", outils: [{ id: "deplacer", emoji: "↔️", nom: "Déplacer", touche: "M" }, { id: "demolir", emoji: "🧹", nom: "Démolir", touche: "Suppr" }] },
    ];
    // Le groupe du bâtiment ou de l'outil choisi reste allumé
    const actif = (g) => (g.batiments && g.batiments.includes(monde.construction)) || (g.outil && monde.outil === g.outil) || (g.outils && g.outils.some((o) => o.id === monde.outil));
    const lm = petit ? 62 : 70, hb = petit ? 54 : 60, ecart = petit ? 4 : 6;
    const dockL = groupes.length * lm + (groupes.length - 1) * ecart + 16, dockX = (W - dockL) / 2, dockY = He - hb - 18;
    // Le socle du menu : une planche de bois arrondie
    ctx.fillStyle = "rgba(90, 60, 30, .88)"; ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 2.5;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(dockX, dockY - 8, dockL, hb + 16, 18); else ctx.rect(dockX, dockY - 8, dockL, hb + 16);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "rgba(255, 220, 160, .25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dockX + 14, dockY - 3); ctx.lineTo(dockX + dockL - 14, dockY - 3); ctx.stroke();
    groupes.forEach((g, k) => {
      const x = dockX + 8 + k * (lm + ecart), ouvert = menuOuvert === g.id, allume = actif(g) || ouvert;
      ctx.fillStyle = allume ? "#ffe27a" : "#f6ead2"; ctx.strokeStyle = allume ? "#ff8a1f" : "#5a4220"; ctx.lineWidth = allume ? 3 : 2;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, dockY, lm, hb, 13); else ctx.rect(x, dockY, lm, hb);
      ctx.fill(); ctx.stroke();
      if (g.emoji) texte(ctx, g.emoji, x + lm / 2, dockY + hb * 0.38, petit ? 21 : 24, null, false, "center");
      else Village.Batisses.iconeRoute(ctx, x + lm / 2, dockY + hb * 0.38, petit ? 0.75 : 0.85);
      texte(ctx, g.nom, x + lm / 2, dockY + hb * 0.8, petit ? 10 : 11, "#3b2614", true, "center");
      if (g.batiments || g.outils) { // un petit triangle : « ça s'ouvre »
        ctx.fillStyle = "#a08a6a"; ctx.beginPath(); ctx.moveTo(x + lm - 12, dockY + 9); ctx.lineTo(x + lm - 6, dockY + 9); ctx.lineTo(x + lm - 9, dockY + 5); ctx.closePath(); ctx.fill();
      }
      zone(x, dockY, lm, hb, g.outil ? "outil" : "menu", g.outil || g.id);
      // Le tiroir du groupe ouvert
      if (ouvert) tiroir(ctx, monde, g, dockY - 16, W, petit);
    });
    const y0 = (menuOuvert ? dockY - 16 - (petit ? 82 : 92) : dockY - 8); // le haut de ce qui est dessiné en bas

    // ---- Juste au-dessus des boutons : l'aide pour construire, un message, ou la case sous la souris
    let aide = null;
    const maintenant = performance.now();
    if (message && maintenant < message.jusqua) aide = message.texte;
    else if (monde.construction) {
      aide = (Village.Entrees.toucheRecente() ? "Touche" : "Clique sur") + " une case pour poser : " + B.TYPES[monde.construction].nom;
    } else if (monde.outil === "route") {
      aide = monde.routeDepart ? "Maintenant, touche l'arrivée du chemin" : "Touche le départ du chemin de terre (gratuit)";
    } else if (monde.outil === "demolir") {
      aide = "Touche une route ou un bâtiment à démolir";
    } else if (monde.outil === "deplacer") {
      aide = monde.aDeplacer ? "Touche la nouvelle place de : " + B.TYPES[monde.aDeplacer.type].nom : "Touche le bâtiment à déplacer";
    } else if (monde.survol) aide = decrire(monde, monde.survol);
    else if (monde.choisie && !monde.selection) aide = decrire(monde, monde.choisie); // au doigt : la case touchée
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

    // Étape 4 : il n'y a plus rien à manger !
    if (Village.Repas.nourritureEnStock(monde) <= 0 && !(message && maintenant < message.jusqua) && Math.sin(maintenant / 300) > -0.3) {
      const txt = "🍽️ Plus rien à manger : tout le monde travaille 2 fois moins vite ! Pêcheur ou chasseur ?";
      ctx.font = "bold " + (petit ? 11 : 13) + "px " + POLICE;
      // En haut au milieu sur un grand écran ; sous la saison sur un téléphone.
      const l = Math.min(W - 20, ctx.measureText(txt).width + 24), y = W > 760 ? 60 : petit ? 72 : 80;
      bulle(ctx, (W - l) / 2, y, l, 28, "rgba(255, 225, 220, .95)");
      texte(ctx, txt, W / 2, y + 14, petit ? 11 : 13, "#c0392b", true, "center");
    }

    // ---- Le panneau du bâtiment touché
    if (monde.selection && !objectifsOuverts) panneauBatiment(ctx, monde, monde.selection, 10, petit ? 72 : 80, petit ? 230 : 270);

    if (options.pause) {
      bulle(ctx, W / 2 - 70, 12, 140, 36);
      texte(ctx, "⏸ PAUSE", W / 2, 30, 17, "#3b2614", true, "center");
    }
  }

  // Étape 5 : ✍️ ce qu'il y a sous la souris, sans la position (elle reste sous le capot) :
  // juste ce que c'est. Sur un animal : lequel, et combien de nourriture il donne.
  const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  function decrire(monde, k) {
    const B = Village.Batiments, O = Village.Carte.OBJET, T = Village.Carte.TERRAIN, P = C.prises;
    const s = monde.souris;
    if (s) {
      const a = monde.animaux.find((x) => Math.hypot(x.x - s.colonne, x.y - s.ligne) < 0.6);
      if (a) { const n = Village.Animaux.NOMS[a.sorte]; return n.emoji + " " + majuscule(n.nom) + " · donne " + P[a.sorte] + " 🍖 au chasseur"; }
    }
    const bat = monde.occupees.get(k.numero);
    if (bat) return B.TYPES[bat.type].emoji + " " + B.TYPES[bat.type].nom + (bat.relie || bat.type === "entrepot" ? "" : " · pas de route jusqu'à l'entrepôt !");
    if (monde.route[k.numero]) return (monde.route[k.numero] === 2 ? "Route en pierre" : "Chemin de terre") + (monde.reseau.has(k.numero) ? "" : " · pas relié à l'entrepôt");
    let t = majuscule(k.nomTerrain);
    if (k.terrain === T.eau) t = (monde.saison && monde.saison.hiver ? "Glace (le pêcheur la perce)" : "Eau") + " · sardines (" + P.sardine + " 🐟) et truites (" + P.truite + " 🐟)";
    else if (k.terrain === T.eauProfonde) t = "Eau profonde · sardines, truites et thons (" + P.thon + " 🐟)";
    if (k.objet === O.rocher) t += " · rocher : encore " + k.reste + " 🪨";
    else if (k.objet === O.pousse) t += " · jeune pousse (un arbre bientôt)";
    else if (k.objet && k.objet !== O.montagne) t = (k.objet === O.feuDeCamp || k.objet === O.tente ? "" : t + " · ") + (k.objet === O.feuDeCamp || k.objet === O.tente ? majuscule(k.nomObjet) : k.nomObjet);
    if (k.filon) t += " · filon de " + k.nomFilon;
    return t;
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
    // Étape 4 : le repas de l'ouvrier
    const o = b.ouvrier;
    if (o && b.etat === "pret") {
      if (o.affame) {
        lignes.push("🍽️ A FAIM : travaille 2 fois moins vite !");
        lignes.push("Il faut du 🐟 ou de la 🍖 dans l'entrepôt.");
      } else lignes.push("😋 Prochain repas dans " + Math.max(0, Math.ceil(C.repas.intervalle - o.faim)) + " s (à l'entrepôt)");
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

  return { dessiner, zoneSous, basculerMenu, fermerMenu, basculerObjectifs, get menuOuvert() { return menuOuvert; } };
})();
