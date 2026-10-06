// 🪧 L'INTERFACE : les panneaux et les boutons dessinés dans l'écran du jeu
//
// Sur un téléphone, il n'y a ni clavier ni souris : tout doit se faire au doigt, DANS l'écran.
// Ce fichier dessine :
//   - en haut à gauche : le nom du village et le STOCK de l'entrepôt (🪵 troncs, 🟫 planches, 🪨 pierres) ;
//   - en haut à droite : le bouton plein écran ⛶ et la mini-carte ;
//   - en bas : les gros BOUTONS de construction (assez gros pour un doigt : au moins 56 points) ;
//   - le panneau du bâtiment touché, et les messages d'aide ;
//   - (étape 8) le marché 🏪 et les statistiques 📊.
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
  let objectifsOuverts = false;
  let panneau = null; // étape 7 : le grand panneau ouvert au milieu : "mission", "boutique" (étape 8 : "stats", "marche") ou null
  let basDuStock = 64; // étape 8 : le bas de la bulle du stock (elle peut avoir 2 lignes) : les panneaux s'ouvrent dessous
  const EMO = (r) => (C.ressources[r] ? C.ressources[r].emoji : r === "pieces" ? "🪙" : r === "gemmes" ? "💎" : r); // étape 8
  let message = null; // { texte, jusqua } : un message qui s'affiche quelques secondes

  // Les messages importants de la radio s'affichent aussi dans le jeu (sur téléphone, on ne voit pas le journal).
  Village.Evenements.ecouter("construction-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("chantier-fini", (d) => afficher("🎉 " + d.nom + " est construit" + (d.metier ? " : le " + d.metier + " se met au travail !" : " !")));
  Village.Evenements.ecouter("rien-a-faire", (d) => /maçon/.test(d.nom) || afficher("😴 " + d.nom + " : pas de " + d.quoi.replace(/^une? /, "") + " à moins de " + d.rayon + " pas"));
  Village.Evenements.ecouter("route-impossible", (d) => afficher("🚫 Route : " + d.raison));
  Village.Evenements.ecouter("demolition-impossible", (d) => afficher("🚫 " + d.raison));
  Village.Evenements.ecouter("batiment-relie", (d) => afficher("✅ " + d.nom + " est relié à l'entrepôt !"));
  Village.Evenements.ecouter("batiment-pose", (d) => { if (!d.relie) afficher("Pense à relier " + d.nom + " à l'entrepôt avec une route !"); });
  Village.Evenements.ecouter("saison", (d) => afficher(d.emoji + " C'est " + (d.nom === "été" ? "l'été" : d.nom === "automne" ? "l'automne" : d.nom === "hiver" ? "l'hiver : les lacs gèlent !" : "le printemps") + (d.nom === "printemps" ? " · année " + d.annee : "")));
  Village.Evenements.ecouter("habitant-part", (d) => afficher("😢 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " a quitté le village : il avait faim depuis un an !"));
  Village.Evenements.ecouter("habitant-arrive", (d) => afficher("🙋 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " arrive au village !"));
  // Étape 7
  Village.Evenements.ecouter("recherche-finie", (d) => afficher("🎓 Recherche finie : " + d.emoji + " " + d.nom + " ! " + d.texte));
  Village.Evenements.ecouter("recherche-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("mission-proposee", (d) => afficher("📜 " + d.emoji + " " + d.qui + " a besoin de toi ! Touche 📜"));
  Village.Evenements.ecouter("mission-reussie", (d) => afficher("🎉 Mission réussie ! Merci de la part de " + d.qui + " " + d.emoji));
  Village.Evenements.ecouter("mission-ratee", (d) => afficher("⌛ Trop tard pour " + d.qui + "… Une autre mission viendra !"));
  Village.Evenements.ecouter("mission-pas-assez", () => afficher("🚫 Il manque encore des ressources pour livrer"));
  Village.Evenements.ecouter("achat", (d) => afficher(d.emoji + " " + d.nom + " : c'est fait ! (" + d.gemmes + " 💎 restantes)"));
  Village.Evenements.ecouter("achat-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("filon-trouve", (d) => afficher("🔍 Le géologue a trouvé un filon de " + d.nom.replace("minerai de ", "") + " " + d.emoji + " !"));
  Village.Evenements.ecouter("filon-epuise", (d) => afficher("⛏️ " + d.nom + " : le filon est épuisé. Le géologue en trouvera peut-être un autre."));
  // Étape 8
  Village.Evenements.ecouter("pas-de-logement", (d) => afficher("🛏️ " + d.nom + " : pas de place pour loger le " + d.metier + " ! Construis une 🛖 hutte ou une 🏠 maison."));
  Village.Evenements.ecouter("marche-vente", (d) => afficher("🏪 Vendu " + d.quantite + " " + EMO(d.quoi) + " : +" + d.gain + " 🪙 (tu as " + d.pieces + " 🪙)"));
  Village.Evenements.ecouter("marche-achat", (d) => afficher("🏪 Acheté " + d.quantite + " " + EMO(d.quoi) + " : −" + d.depense + " 🪙 (il te reste " + d.pieces + " 🪙)"));
  Village.Evenements.ecouter("marche-impossible", (d) => afficher("🚫 Marché : " + d.raison));
  Village.Evenements.ecouter("nouvel-age", (d) => afficher("🎉 " + d.emoji + " Bienvenue au " + d.nom.replace(/^(Le|La) /, "").toLowerCase() + " !" + (d.debloque.length ? " Nouveau : " + d.debloque.join(", ") : "")));
  Village.Evenements.ecouter("deplacement-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("batiment-deplace", (d) => afficher("↔️ " + d.nom + " a déménagé" + (d.relie ? " !" : " : pense à la route !")));
  Village.Evenements.ecouter("gisement-trouve", (d) => afficher("🔍 Le géologue a trouvé un gisement : " + d.pierres + " 🪨 !"));
  Village.Evenements.ecouter("affame", () => afficher("🍽️ Plus rien à manger : on travaille 2 fois moins vite !"));
  // Étape 11
  Village.Evenements.ecouter("batiment-use", (d) => afficher("🔧 " + d.nom + " est usé : il travaille 2 fois moins vite. Il faut des 🔨 outils !"));
  Village.Evenements.ecouter("coup-de-pouce", (d) => afficher("🎁 Coup de pouce : " + d.nom + " est offert, pour que le village ne reste pas bloqué !")); // étape 12
  // Étape 13
  Village.Evenements.ecouter("cabane-attend", (d) => afficher("👥 " + d.nom + " : personne pour y travailler. " + (Village.monde && !Village.Logement.placeLibre(Village.monde) ? "Il faut des lits (🛖 hutte, 🏠 maison) !" : "Un villageois va arriver.")));
  Village.Evenements.ecouter("amelioration", (d) => afficher("⬆️ " + d.batiment + " : " + d.emoji + " " + d.nom + " ! (" + d.bonus + " % plus rapide)"));
  Village.Evenements.ecouter("amelioration-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("entrepot-agrandi", (d) => afficher("🏗️ Entrepôt agrandi : " + d.places + " places de manutentionnaire !"));
  Village.Evenements.ecouter("froid", () => afficher("🥶 Plus de bois de chauffage : tout le monde a froid (20 % moins vite) !"));
  Village.Evenements.ecouter("reserve-agrandie", (d) => afficher("📦 Réserve agrandie : niveau " + d.niveau + ", " + d.capacite + " places !"));
  Village.Evenements.ecouter("reserve-impossible", (d) => afficher("🚫 Réserve : " + d.raison));
  Village.Evenements.ecouter("pub-regardee", (d) => afficher("🎁 Merci ! " + (d.sorte === "ressource" ? "+" + d.quantite + " " + EMO(d.quoi) : d.sorte === "gemmes" ? "+" + d.quantite + " 💎" : "La recherche « " + d.nom + " » avance d'un coup !")));
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
    const elements = (g.batiments || []).map((type) => ({
          action: "construire", valeur: type, emoji: B.TYPES[type].emoji, nom: B.TYPES[type].court, touche: B.A_CONSTRUIRE.indexOf(type) < 7 ? String(B.A_CONSTRUIRE.indexOf(type) + 1) : "",
          cout: B.offert(monde, type) ? "🎁 offert" : Object.entries(B.coutPour(monde, type)).map(([r, n]) => n + EMO(r)).join(" "), // étape 12 : le coup de pouce
          choisi: monde.construction === type, possible: B.assezPour(monde, type) && Village.Ages.debloque(monde, type),
          verrou: Village.Ages.debloque(monde, type) ? null : "🔒 " + C.ages[Village.Ages.ageDe(type)].emoji + " " + C.ages[Village.Ages.ageDe(type)].nom.replace(/^(Le|La) /, ""), // étape 6
        })).concat((g.outils || []).map((o) => ({ action: "outil", valeur: o.id, emoji: o.emoji, icone: o.icone, nom: o.nom, touche: o.touche, cout: o.cout || "", choisi: monde.outil === o.id, possible: !o.verrou, verrou: o.verrou || null })));
    const lc = petit ? 74 : 84, hc = petit ? 74 : 84, ec = 8;
    // Étape 8 : trop de cartes pour la largeur de l'écran ? On les range sur 2 rangées.
    const parRangee = Math.max(1, Math.min(elements.length, Math.floor((W - 20 - 16 + ec) / (lc + ec)))), rangees = Math.ceil(elements.length / parRangee);
    const total = parRangee * lc + (parRangee - 1) * ec + 16, hauteur = rangees * hc + (rangees - 1) * ec;
    const x0 = Math.max(10, Math.min(W - total - 10, (W - total) / 2)), y0 = bas - hauteur - 8;
    hautDuTiroir = y0 - 8;
    bulle(ctx, x0, y0 - 8, total, hauteur + 16, "rgba(255, 250, 235, .97)");
    zone(x0, y0 - 8, total, hauteur + 16, "rien"); // toucher entre les cartes ne touche pas la carte du monde
    elements.forEach((el, n) => {
      const k = n % parRangee, x = x0 + 8 + k * (lc + ec);
      const y0 = bas - hauteur - 8 + Math.floor(n / parRangee) * (hc + ec);
      ctx.fillStyle = el.choisi ? "#ffe27a" : el.possible ? "#fffaf0" : "#e4dccd"; ctx.strokeStyle = el.choisi ? "#ff8a1f" : "#c9b48f"; ctx.lineWidth = el.choisi ? 3 : 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y0, lc, hc, 12); else ctx.rect(x, y0, lc, hc);
      ctx.fill(); ctx.stroke();
      if (el.icone) Village.Batisses.iconeRoute(ctx, x + lc / 2, y0 + hc * 0.3, petit ? 0.9 : 1, el.icone === "pierre");
      else texte(ctx, el.emoji, x + lc / 2, y0 + hc * 0.3, petit ? 24 : 28, null, false, "center");
      texte(ctx, el.nom, x + lc / 2, y0 + hc * 0.62, petit ? 11 : 12, "#3b2614", true, "center");
      if (el.verrou) texte(ctx, el.verrou, x + lc / 2, y0 + hc * 0.84, petit ? 9 : 10, "#8a7a60", true, "center");
      else if (el.cout) texte(ctx, el.cout, x + lc / 2, y0 + hc * 0.84, petit ? 10 : 11, el.possible ? "#7a5a30" : "#c0392b", true, "center");
      if (!petit) texte(ctx, el.touche, x + 7, y0 + 10, 10, "#a08a6a", true, "left");
      zone(x, y0, lc, hc, el.action, el.valeur);
    });
  }
  let hautDuTiroir = 0;

  // Étape 6 : le panneau des objectifs de l'âge
  function panneauObjectifs(ctx, monde, x, y, l) {
    const petit = Ec.petit, age = Village.Ages.actuel(monde), prochain = Village.Ages.suivant(monde), obj = Village.Ages.objectifs(monde);
    const lignes = [];
    if (obj && prochain) {
      lignes.push(["Pour passer au " + prochain.nom.replace(/^(Le|La) /, "").toLowerCase() + " " + prochain.emoji + " :", "#3b2614", true]);
      for (const o of obj) lignes.push([(o.fait ? "✅ " : "⬜ ") + o.texte + " : " + Math.min(o.valeur, o.cible) + " / " + o.cible, o.fait ? "#2e8a3a" : "#5a4220", false]);
      const nouveaux = prochain.debloque.map((t) => Village.Batiments.TYPES[t].emoji + " " + Village.Batiments.TYPES[t].court).join(", ");
      if (nouveaux) lignes.push(["Tu débloqueras : " + nouveaux, "#7a5a30", false]);
      else if (prochain.aVenir) lignes.push(["Bientôt : " + prochain.aVenir, "#7a5a30", false]);
    } else {
      lignes.push([age.emoji + " " + age.nom + " : la suite arrive bientôt !", "#3b2614", true]);
      if (prochain && prochain.aVenir) lignes.push([prochain.emoji + " " + prochain.nom + " : " + prochain.aVenir, "#7a5a30", false]);
    }
    // Étape 12 : ✍️ un texte trop long passe à la ligne (avant, il dépassait du cadre)
    const taille = petit ? 11 : 13, pas = petit ? 18 : 20, coupees = [];
    for (const [t, c, g] of lignes) {
      ctx.font = (g ? "bold " : "") + taille + "px " + POLICE;
      let ligne = "";
      for (const mot of t.split(" ")) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (ctx.measureText(essai).width > l - 24 && ligne) { coupees.push([ligne, c, g]); ligne = "   " + mot; } else ligne = essai;
      }
      coupees.push([ligne, c, g]);
    }
    const h = 16 + coupees.length * pas;
    bulle(ctx, x, y, l, h);
    coupees.forEach(([t, c, g], n) => texte(ctx, t, x + 12, y + 16 + n * pas, taille, c, g));
    zone(x, y, l, h, "objectifs");
  }
  function basculerObjectifs() { objectifsOuverts = !objectifsOuverts; }
  function basculerPanneau(nom) { panneau = panneau === nom ? null : nom; objectifsOuverts = false; }
  function fermerPanneau() { panneau = null; }

  // Écrire un texte sur plusieurs lignes, sans dépasser la largeur `l`. Renvoie le nombre de lignes.
  function texteLong(ctx, t, x, y, l, taille, couleur, interligne) {
    ctx.font = taille + "px " + POLICE;
    const mots = t.split(" "), lignes = [];
    let ligne = "";
    for (const m of mots) {
      const essai = ligne ? ligne + " " + m : m;
      if (ctx.measureText(essai).width > l && ligne) { lignes.push(ligne); ligne = m; } else ligne = essai;
    }
    if (ligne) lignes.push(ligne);
    lignes.forEach((li, n) => texte(ctx, li, x, y + n * interligne, taille, couleur));
    return lignes.length;
  }

  // Un bouton dessiné dans un panneau (il ne répond que s'il est actif)
  function bouton(ctx, x, y, l, h, t, action, valeur, actif, couleur) {
    ctx.fillStyle = !actif ? "#e4dccd" : couleur || "#4fc25a"; ctx.strokeStyle = !actif ? "#c9b48f" : "#5a4220"; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, l, h, 10); else ctx.rect(x, y, l, h);
    ctx.fill(); ctx.stroke();
    texte(ctx, t, x + l / 2, y + h / 2 + 1, 12, actif ? "#ffffff" : "#8a7a60", true, "center");
    if (actif) zone(x, y, l, h, action, valeur);
  }

  const coutTexte = (c) => Object.entries(c).map(([r, n]) => n + " " + EMO(r)).join("  ");
  const visible = (monde, r) => (monde.age || 0) >= (C.ressources[r].age || 0) || monde.stock[r] > 0; // étape 11
  const nomRessource = (r) => (r === "pieces" ? "🪙 pièces" : r === "gemmes" ? "💎" : Village.Batiments.NOMS_RESSOURCES[r]);
  const minutes = (s) => Math.floor(s / 60) + " min " + String(Math.floor(s % 60)).padStart(2, "0");
  const croix = (ctx, x, y, l, action) => { texte(ctx, "✖", x + l - 16, y + 17, 14, "#a08a6a", true, "center"); zone(x + l - 38, y, 38, 34, action); };

  // 🎓 Le panneau de l'université : les recherches de notre âge (et celles de l'âge suivant, 🔒)
  function panneauUniversite(ctx, monde, W, He, petit) {
    const R = Village.Recherches, liste = C.recherches.filter((r) => r.age <= (monde.age || 0) + 1);
    const l = Math.min(W - 20, 470), hl = petit ? 38 : 40, x = (W - l) / 2, y = basDuStock + 4;
    const h = 46 + liste.length * hl + 8;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    const e = monde.recherches.enCours, u = monde.selection;
    let tete = "🎓 Université · " + monde.recherches.faites.length + " recherche(s) faite(s)";
    if (!u.relie) tete = "🎓 Université · ❌ pas de route : les recherches attendent";
    else if (!u.ouvrier) tete = "🎓 Université · 😢 le savant est parti";
    texte(ctx, tete, x + 12, y + 18, petit ? 12 : 14, "#3b2614", true);
    texte(ctx, "Paie avec ton stock, puis le savant cherche. Une recherche à la fois.", x + 12, y + 35, petit ? 9 : 10, "#7a5a30");
    croix(ctx, x, y, l, "fermer");
    liste.forEach((r, n) => {
      const ry = y + 44 + n * hl, fait = R.faite(monde, r.id), enCours = e && e.id === r.id, pourquoi = R.raison(monde, r.id);
      if (n % 2) { ctx.fillStyle = "rgba(90, 66, 32, .06)"; ctx.fillRect(x + 6, ry, l - 12, hl); }
      const lb = petit ? 108 : 128, bx = x + l - lb - 10, by = ry + 5, bh = hl - 10;
      texte(ctx, r.emoji + " " + r.nom, x + 12, ry + hl * 0.32, petit ? 11 : 13, "#3b2614", true);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 8, ry, bx - x - 12, hl); ctx.clip(); // le texte ne déborde pas sur le bouton
      texte(ctx, r.texte, x + 12, ry + hl * 0.74, petit ? 9 : 10, "#7a5a30");
      ctx.restore();
      if (fait) texte(ctx, "✅ faite", bx + lb / 2, ry + hl / 2, 12, "#2e8a3a", true, "center");
      else if (enCours) {
        const p = 1 - e.reste / r.duree;
        ctx.fillStyle = "rgba(90, 66, 32, .15)"; ctx.fillRect(bx, by + bh / 2 - 5, lb, 10);
        ctx.fillStyle = "#4fc25a"; ctx.fillRect(bx, by + bh / 2 - 5, lb * p, 10);
        texte(ctx, Math.round(p * 100) + " %", bx + lb / 2, by - 1, 9, "#2e8a3a", true, "center");
      } else if (r.age > (monde.age || 0)) texte(ctx, "🔒 " + C.ages[r.age].emoji + " " + C.ages[r.age].nom.replace(/^(Le|La) /, ""), bx + lb / 2, ry + hl / 2, 11, "#8a7a60", true, "center");
      else bouton(ctx, bx, by, lb, bh, coutTexte(r.cout), "recherche", r.id, !pourquoi);
    });
  }

  // 📜 Le panneau de la mission
  function panneauMission(ctx, monde, W, He, petit) {
    const a = monde.missions.actuelle, l = Math.min(W - 20, 420), x = (W - l) / 2, y = basDuStock + 4;
    if (!a) {
      bulle(ctx, x, y, l, 70, "rgba(255, 250, 235, .98)");
      zone(x, y, l, 70, "rien");
      texte(ctx, "📜 Pas de mission pour l'instant", x + 14, y + 22, 14, "#3b2614", true);
      texte(ctx, "Quelqu'un viendra frapper à ta porte dans " + Math.ceil(monde.missions.attente) + " s…", x + 14, y + 46, 12, "#7a5a30");
      croix(ctx, x, y, l, "fermerPanneau");
      return;
    }
    const m = Village.Missions.trouver(a.id);
    ctx.font = "12px " + POLICE;
    // La hauteur dépend du nombre de lignes de l'histoire : on la mesure d'abord (sans dessiner).
    const mots = ("« " + m.histoire + " »").split(" ");
    let nl = 1, ligne = "";
    for (const mot of mots) { const essai = ligne ? ligne + " " + mot : mot; if (ctx.measureText(essai).width > l - 28 && ligne) { nl++; ligne = mot; } else ligne = essai; }
    const h = 44 + nl * 16 + 8 + 18 + Object.keys(m.demande).length * 18 + 26 + 72;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    texte(ctx, m.emoji + " " + m.qui, x + 14, y + 20, petit ? 13 : 15, "#3b2614", true);
    croix(ctx, x, y, l, "fermerPanneau");
    const n = texteLong(ctx, "« " + m.histoire + " »", x + 14, y + 44, l - 28, 12, "#5a4220", 16);
    let yy = y + 44 + n * 16 + 8;
    texte(ctx, "Il me faut :", x + 14, yy, 12, "#3b2614", true); yy += 18;
    for (const [r, q] of Object.entries(m.demande)) {
      const ok = monde.stock[r] >= q;
      texte(ctx, (ok ? "✅ " : "⬜ ") + q + " " + Village.Batiments.NOMS_RESSOURCES[r] + "  (tu en as " + monde.stock[r] + ")", x + 22, yy, 12, ok ? "#2e8a3a" : "#5a4220");
      yy += 18;
    }
    texte(ctx, "🎁 Récompense : " + Object.entries(m.recompense).map(([r, q]) => q + " " + nomRessource(r)).join(", "), x + 14, yy + 2, 12, "#7a5a30", true);
    yy += 24;
    if (a.etat === "proposee") {
      texte(ctx, "⏱️ Tu auras " + minutes(m.duree) + ".", x + 14, yy + 4, 12, "#5a4220");
      bouton(ctx, x + l - 232, yy + 22, 112, 34, "👍 J'accepte", "mission", "accepter", true);
      bouton(ctx, x + l - 112, yy + 22, 98, 34, "Plus tard", "mission", "plusTard", true, "#a08a6a");
    } else {
      texte(ctx, "⏱️ Il reste " + minutes(Math.max(0, a.reste)), x + 14, yy + 4, 13, a.reste < 60 ? "#c0392b" : "#3b2614", true);
      bouton(ctx, x + l - 150, yy + 22, 136, 34, "📦 Livrer", "mission", "livrer", Village.Missions.assez(monde, m));
    }
  }

  // 💎 Le panneau de la boutique
  function panneauBoutique(ctx, monde, W, He, petit) {
    const l = Math.min(W - 20, 420), hl = 42, x = (W - l) / 2, y = basDuStock + 4, h = 64 + C.boutique.length * hl;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    texte(ctx, "💎 La boutique · tu as " + monde.gemmes + " gemme(s)", x + 14, y + 20, petit ? 13 : 15, "#3b2614", true);
    texte(ctx, "Les gemmes se gagnent en jouant : missions réussies et nouveaux âges.", x + 14, y + 40, 10, "#7a5a30");
    croix(ctx, x, y, l, "fermerPanneau");
    C.boutique.forEach((o, n) => {
      const ry = y + 56 + n * hl, pourquoi = Village.Boutique.raison(monde, o.id);
      texte(ctx, o.emoji + " " + o.nom, x + 14, ry + 13, 13, "#3b2614", true);
      texte(ctx, o.texte, x + 14, ry + 29, 10, "#7a5a30");
      bouton(ctx, x + l - 104, ry + 4, 90, 32, o.prix + " 💎", "achat", o.id, !pourquoi, "#3e7bff");
    });
  }

  // 🏪 Étape 8 : le panneau du marché. Une ligne par ressource : le stock, le prix (et s'il monte ou baisse),
  // et deux boutons : vendre 5, acheter 5.
  function panneauMarche(ctx, monde, W, He, petit) {
    const M = Village.Marche, liste = Object.keys(C.marche.prix).filter((r) => visible(monde, r)), lot = C.marche.lot;
    const l = Math.min(W - 20, 500), hl = petit ? 30 : 34, x = (W - l) / 2, y = basDuStock + 4;
    const h = 58 + liste.length * hl + 22;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    const b = M.leMarche(monde);
    let tete = "🏪 Marché · tu as " + monde.pieces + " 🪙";
    if (!b) tete = "🏪 Marché · il faut d'abord construire le marché";
    else if (!b.relie) tete = "🏪 Marché · ❌ pas de route jusqu'à l'entrepôt";
    else if (!b.ouvrier) tete = "🏪 Marché · 🛏️ pas de marchand (il faut un logement)";
    texte(ctx, tete, x + 12, y + 18, petit ? 12 : 14, "#3b2614", true);
    texte(ctx, "Par paquets de " + lot + ". Vendre beaucoup fait baisser le prix ; il remonte avec le temps.", x + 12, y + 36, petit ? 9 : 10, "#7a5a30");
    croix(ctx, x, y, l, panneau === "marche" ? "fermerPanneau" : "fermer");
    const lb = petit ? 84 : 104, xv = x + l - 2 * lb - 18, xa = x + l - lb - 10;
    texte(ctx, "en stock", x + (petit ? 96 : 120), y + 50, 9, "#a08a6a", true, "right");
    liste.forEach((r, n) => {
      const ry = y + 56 + n * hl, f = M.facteur(monde, r);
      if (n % 2) { ctx.fillStyle = "rgba(90, 66, 32, .06)"; ctx.fillRect(x + 6, ry, l - 12, hl); }
      texte(ctx, EMO(r) + " " + (petit ? "" : C.ressources[r].nom.replace("minerai de ", "")), x + 12, ry + hl / 2, petit ? 14 : 12, "#3b2614", true);
      texte(ctx, String(monde.stock[r]), x + (petit ? 96 : 120), ry + hl / 2, 12, "#3b2614", true, "right");
      // La tendance du prix : ▼ moins cher que d'habitude, ▲ plus cher
      const tendance = f < 0.97 ? "▼ " + Math.round(f * 100) + " %" : f > 1.03 ? "▲ " + Math.round(f * 100) + " %" : "";
      if (tendance && xv - (x + (petit ? 100 : 126)) > 40) texte(ctx, tendance, x + (petit ? 102 : 128), ry + hl / 2, 9, f < 1 ? "#c0392b" : "#2e8a3a", true);
      bouton(ctx, xv, ry + 3, lb, hl - 6, "Vendre +" + M.prixVente(monde, r) + "🪙", "marche", { sens: "vendre", quoi: r }, !M.raison(monde, "vendre", r), "#d98a1f");
      bouton(ctx, xa, ry + 3, lb, hl - 6, "Acheter −" + M.prixAchat(monde, r) + "🪙", "marche", { sens: "acheter", quoi: r }, !M.raison(monde, "acheter", r), "#3e7bff");
    });
    texte(ctx, "Depuis le début : vendu pour " + monde.marche.ventes + " 🪙 · acheté pour " + monde.marche.achats + " 🪙", x + 12, y + h - 13, petit ? 9 : 10, "#7a5a30");
  }

  // 📊 Étape 8 : le panneau des statistiques (choix 3A). Pour chaque ressource : le stock, sa petite
  // courbe (les 5 dernières minutes), ce qui entre et ce qui sort par minute, et le bilan.
  function panneauStats(ctx, monde, W, He, petit) {
    const St = Village.Statistiques, liste = Object.keys(C.ressources).filter((r) => visible(monde, r) || St.parMinute(monde, r).entrees > 0);
    const l = Math.min(W - 20, 520), hl = petit ? 24 : 26, x = (W - l) / 2, y = basDuStock + 4;
    const h = 74 + liste.length * hl + 44;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    const duree = St.parMinute(monde, "troncs").minutes;
    const depuis = duree < 4.9 ? Math.max(1, Math.round(duree * 60)) + (petit ? " s" : " dernières secondes") : petit ? "5 min" : "5 dernières minutes";
    texte(ctx, "📊 " + (petit ? "Par minute, sur " : "Statistiques · par minute, sur les ") + depuis, x + 12, y + 18, petit ? 12 : 14, "#3b2614", true);
    texte(ctx, "Le compteur de l'entrepôt note tout ce qui entre et tout ce qui sort.", x + 12, y + 36, petit ? 9 : 10, "#7a5a30");
    croix(ctx, x, y, l, "fermerPanneau");
    // Les colonnes
    const cStock = x + (petit ? 70 : 120), cCourbe = cStock + 8, lCourbe = petit ? 60 : 90, cE = cCourbe + lCourbe + (petit ? 44 : 56), cS = cE + (petit ? 46 : 60), cN = Math.min(x + l - 12, cS + (petit ? 52 : 70));
    const yt = y + 56;
    texte(ctx, "stock", cStock, yt, 9, "#a08a6a", true, "right");
    texte(ctx, "5 min", cCourbe, yt, 9, "#a08a6a", true);
    texte(ctx, "entre", cE, yt, 9, "#a08a6a", true, "right");
    texte(ctx, "sort", cS, yt, 9, "#a08a6a", true, "right");
    texte(ctx, "bilan", cN, yt, 9, "#a08a6a", true, "right");
    const chiffre = (v) => (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10).toString().replace(".", ",");
    liste.forEach((r, n) => {
      const ry = y + 66 + n * hl, m = St.parMinute(monde, r), pts = St.courbe(monde, r);
      if (n % 2) { ctx.fillStyle = "rgba(90, 66, 32, .06)"; ctx.fillRect(x + 6, ry, l - 12, hl); }
      texte(ctx, EMO(r) + (petit ? "" : " " + C.ressources[r].nom.replace("minerai de ", "")), x + 12, ry + hl / 2, petit ? 13 : 12, "#3b2614", true);
      texte(ctx, String(monde.stock[r]), cStock, ry + hl / 2, 12, "#3b2614", true, "right");
      // La petite courbe du stock
      const max = Math.max(1, ...pts), bas = ry + hl - 5, haut = ry + 5;
      ctx.strokeStyle = "rgba(90, 66, 32, .2)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cCourbe, bas); ctx.lineTo(cCourbe + lCourbe, bas); ctx.stroke();
      if (pts.length > 1) {
        ctx.strokeStyle = m.net < -0.05 ? "#c0392b" : "#2e8a3a"; ctx.lineWidth = 1.6; ctx.beginPath();
        pts.forEach((v, k) => { const px = cCourbe + (k / (C.statistiques.tranches)) * lCourbe, py = bas - (v / max) * (bas - haut); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
        ctx.stroke();
      }
      texte(ctx, m.entrees ? "+" + chiffre(m.entrees) : "·", cE, ry + hl / 2, 11, "#2e8a3a", true, "right");
      texte(ctx, m.sorties ? "−" + chiffre(m.sorties) : "·", cS, ry + hl / 2, 11, "#c0392b", true, "right");
      const net = m.net;
      texte(ctx, Math.abs(net) < 0.05 ? "=" : (net > 0 ? "+" : "−") + chiffre(Math.abs(net)), cN, ry + hl / 2, 12, Math.abs(net) < 0.05 ? "#7a5a30" : net > 0 ? "#2e8a3a" : "#c0392b", true, "right");
    });
    // En dessous : les habitants, les porteurs, l'argent
    const Lg = Village.Logement, actifs = Village.Porteurs.actifs(monde), dehors = actifs.filter((p) => p.etat !== "attend").length;
    const yb = y + 66 + liste.length * hl + 14;
    texte(ctx, "🛏️ Habitants " + Lg.habitants(monde) + " / " + Lg.capacite(monde) + " places · 🚚 porteurs au travail " + dehors + " / " + actifs.length + " · 📋 file " + monde.file.length, x + 12, yb, petit ? 10 : 11, "#5a4220", true);
    texte(ctx, "🪙 " + monde.pieces + " pièces · 💎 " + monde.gemmes + " gemmes · " + monde.batiments.filter((b) => b.etat === "pret").length + " bâtiments", x + 12, yb + 18, petit ? 10 : 11, "#5a4220", true);
  }

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
    // Étape 11 : chaque ressource apparaît à son âge (config.js, « ressources » : age), ou dès qu'on en a.
    const ressources = Object.keys(C.ressources).filter((r) => (monde.age || 0) >= (C.ressources[r].age || 0) || s[r] > 0).map((r) => [EMO(r), s[r]]);
    if (monde.age >= 2 || monde.pieces > 0) ressources.push(["🪙", monde.pieces]);
    // Étape 8 : s'il y a trop de ressources pour la largeur, la bulle passe sur 2 lignes.
    const pas = petit ? 46 : 62, parLigne = Math.max(3, Math.min(ressources.length, Math.floor((W - 70 - 24) / pas)));
    const nLignes = Math.ceil(ressources.length / parLigne), hStock = (petit ? 54 : 62) + (nLignes - 1) * (petit ? 20 : 24);
    const lb = 24 + Math.min(ressources.length, parLigne) * pas;
    basDuStock = 10 + hStock;
    bulle(ctx, 10, 10, lb, hStock);
    // Étape 6 : l'âge du village et, à côté, où on en est des objectifs pour passer au suivant.
    // (La barre de la saison a été enlevée : ✍️ elle ne servait à rien.) Toucher : voir les objectifs.
    const age = Village.Ages.actuel(monde), prochain = Village.Ages.suivant(monde), obj = Village.Ages.objectifs(monde);
    let titre = age.emoji + " " + age.nom;
    if (obj && prochain) titre += " · " + prochain.emoji + " " + obj.filter((x) => x.fait).length + "/" + obj.length + " 🎯";
    if (monde.moment) titre += "  " + monde.moment.emoji; // étape 9 : le moment de la journée
    // Étape 13 : ✍️ les habitants et les lits, toujours visibles (⚠️ quand il n'y a plus de lit)
    const Lg = Village.Logement, hab = Lg.habitants(monde), lits = Lg.capacite(monde);
    titre += "  👥 " + hab + "/" + lits + (hab >= lits ? " ⚠️" : "");
    texte(ctx, titre, 22, petit ? 25 : 28, petit ? 11 : 13, "#7a5a30", true);
    ressources.forEach(([emoji, n], k) => texte(ctx, emoji + " " + n, 22 + (k % parLigne) * pas, (petit ? 47 : 51) + Math.floor(k / parLigne) * (petit ? 20 : 24), petit ? 13 : 17, n <= 0 && (k === 3 || k === 4) ? "#c0392b" : "#3b2614", true));
    zone(10, 10, lb, hStock, "objectifs");
    if (objectifsOuverts) panneauObjectifs(ctx, monde, 10, basDuStock + 8, petit ? 250 : 290);

    // ---- En haut à droite : plein écran, puis la mini-carte
    const tp = 40;
    bulle(ctx, W - tp - 10, 10, tp, tp);
    texte(ctx, document.body.classList.contains("plein-ecran") ? "✖" : "⛶", W - 10 - tp / 2, 10 + tp / 2 + 1, 22, "#3b2614", true, "center");
    zone(W - tp - 10, 10, tp, tp, "pleinEcran");
    // Étape 7 : 📜 les missions (un « ! » quand quelqu'un attend) et 💎 la boutique (avec le nombre de gemmes)
    const mi = monde.missions.actuelle;
    bulle(ctx, W - tp - 10, 56, tp, tp, panneau === "mission" ? "rgba(255, 226, 122, .98)" : null);
    texte(ctx, "📜", W - 10 - tp / 2, 56 + tp / 2 + 1, 21, null, false, "center");
    if (mi) { ctx.fillStyle = mi.etat === "proposee" ? "#e8402e" : "#2e8a3a"; ctx.beginPath(); ctx.arc(W - 14, 60, 8, 0, Math.PI * 2); ctx.fill(); texte(ctx, mi.etat === "proposee" ? "!" : "⏳", W - 14, 60.5, 10, "#ffffff", true, "center"); }
    zone(W - tp - 10, 56, tp, tp, "panneau", "mission");
    bulle(ctx, W - tp - 10, 102, tp, tp, panneau === "boutique" ? "rgba(255, 226, 122, .98)" : null);
    texte(ctx, "💎", W - 10 - tp / 2, 102 + 15, 17, null, false, "center");
    texte(ctx, String(monde.gemmes), W - 10 - tp / 2, 102 + 32, 11, "#3b2614", true, "center");
    zone(W - tp - 10, 102, tp, tp, "panneau", "boutique");
    // Étape 8 : 📊 les statistiques, et 🏪 le marché (quand il est construit)
    bulle(ctx, W - tp - 10, 148, tp, tp, panneau === "stats" ? "rgba(255, 226, 122, .98)" : null);
    texte(ctx, "📊", W - 10 - tp / 2, 148 + tp / 2 + 1, 20, null, false, "center");
    zone(W - tp - 10, 148, tp, tp, "panneau", "stats");
    if (Village.Marche.leMarche(monde)) {
      bulle(ctx, W - tp - 10, 194, tp, tp, panneau === "marche" ? "rgba(255, 226, 122, .98)" : null);
      texte(ctx, "🏪", W - 10 - tp / 2, 194 + tp / 2 + 1, 20, null, false, "center");
      zone(W - tp - 10, 194, tp, tp, "panneau", "marche");
    }
    if (W >= 520) dessinerMini(ctx, monde, mini, W - 10 - tp - 10, 10, petit ? 1 : 1.5);

    // ---- En bas : le MENU (étape 5). ✍️ Moins de boutons toujours affichés, regroupés par ressource :
    //   🪵 Bois · 🪨 Pierre · 🍖 Nourriture · la Route · 🔧 Outils.
    // Toucher un groupe ouvre un tiroir, juste au-dessus, avec ses bâtiments.
    const tousLesGroupes = [
      { id: "bois", emoji: "🪵", nom: "Bois", batiments: ["bucheron", "forestier", "scierie"] },
      { id: "pierre", emoji: "⛏️", nom: "Mines", batiments: ["carriere", "geologue", "mineCharbon", "mineFer", "mineOr"] },
      { id: "nourriture", emoji: "🍖", nom: "Nourriture", batiments: ["pecheur", "chasseur", "ferme", "moulin", "boulangerie"] }, // étape 11 : le pain
      // Étape 8 : les logements, et les artisans (fonderie, forge, marché, université)
      { id: "maisons", emoji: "🛖", nom: "Maisons", batiments: ["hutte", "maison", "macon"] }, // étape 12 : le maçon-couvreur
      { id: "artisans", emoji: "⚒️", nom: "Artisans", batiments: ["fonderie", "forge", "orfevre", "marche", "universite"] },
      // Étape 7 : le chemin de terre, et la route en pierre (débloquée par la recherche « Routes pavées »)
      { id: "route", nom: "Routes", outils: [
        { id: "route", icone: "terre", nom: "Chemin", touche: "R", cout: "gratuit" },
        { id: "routePierre", icone: "pierre", nom: "Pavée ×1,6", touche: "T", cout: C.routes.coutPierre.pierres + "🪨/case", verrou: Village.Recherches.a(monde, "routePierre") ? null : "🔒 recherche 🧱" },
        { id: "deplacer", emoji: "↔️", nom: "Déplacer", touche: "M" }, { id: "demolir", emoji: "🧹", nom: "Démolir", touche: "Suppr" },
      ] },
    ];
    // Étape 12 : ✍️ on ne montre que ce qui est débloqué à notre âge (sinon ça fait brouillon).
    // Un groupe qui n'a encore rien de disponible disparaît du menu.
    for (const g of tousLesGroupes) {
      if (g.batiments) g.batiments = g.batiments.filter((t) => Village.Ages.debloque(monde, t));
      if (g.outils) g.outils = g.outils.filter((o) => !o.verrou);
    }
    const groupes = tousLesGroupes.filter((g) => (g.batiments && g.batiments.length) || (g.outils && g.outils.length));
    // Le groupe du bâtiment ou de l'outil choisi reste allumé
    const actif = (g) => (g.batiments && g.batiments.includes(monde.construction)) || (g.outil && monde.outil === g.outil) || (g.outils && g.outils.some((o) => o.id === monde.outil));
    const ecart = petit ? 4 : 6, hb = petit ? 54 : 60;
    const lm = Math.min(70, Math.floor((W - 20 - 16 - (groupes.length - 1) * ecart) / groupes.length)); // étape 8 : 6 groupes, même sur un téléphone
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
      let tn = petit ? 10 : 11; ctx.font = "bold " + tn + "px " + POLICE;
      while (tn > 8 && ctx.measureText(g.nom).width > lm - 4) { tn -= 0.5; ctx.font = "bold " + tn + "px " + POLICE; }
      texte(ctx, g.nom, x + lm / 2, dockY + hb * 0.8, tn, "#3b2614", true, "center");
      if (g.batiments || g.outils) { // un petit triangle : « ça s'ouvre »
        ctx.fillStyle = "#a08a6a"; ctx.beginPath(); ctx.moveTo(x + lm - 12, dockY + 9); ctx.lineTo(x + lm - 6, dockY + 9); ctx.lineTo(x + lm - 9, dockY + 5); ctx.closePath(); ctx.fill();
      }
      zone(x, dockY, lm, hb, g.outil ? "outil" : "menu", g.outil || g.id);
      // Le tiroir du groupe ouvert
      if (ouvert) tiroir(ctx, monde, g, dockY - 16, W, petit);
    });
    const y0 = (menuOuvert ? hautDuTiroir : dockY - 8); // le haut de ce qui est dessiné en bas

    // ---- Juste au-dessus des boutons : l'aide pour construire, un message, ou la case sous la souris
    let aide = null;
    const maintenant = performance.now();
    if (message && maintenant < message.jusqua) aide = message.texte;
    else if (monde.projet) {
      // Étape 12 : l'aperçu
      aide = "Glisse " + (monde.projet.deplacer ? "le bâtiment" : "le " + B.TYPES[monde.projet.type].court.toLowerCase()) + " à sa place (ou touche une case), puis ✅";
    } else if (monde.outil === "route" || monde.outil === "routePierre") {
      const tr = monde.trace;
      aide = tr && tr.pret ? "✅ pour construire la route, ❌ pour l'effacer" : tr && tr.depart ? "Touche l'arrivée : le jeu trouve le chemin" : "Glisse le doigt pour dessiner la route, ou touche le départ puis l'arrivée";
    } else if (monde.outil === "demolir") {
      aide = "Touche une route ou un bâtiment à démolir";
    } else if (monde.outil === "deplacer") {
      aide = "Touche le bâtiment à déplacer (astuce : reste appuyé dessus, sans outil)";
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

    // Étape 12 : ✅ et ❌ à côté de l'aperçu (un bâtiment, ou la route tracée)
    validerAnnuler(ctx, monde, W, He, petit);

    // Étape 11 : le froid de l'hiver au bourg
    if (monde.froid && !(message && maintenant < message.jusqua) && Math.sin(maintenant / 300) > -0.3) {
      const txt = "🥶 Plus de bois de chauffage : tout le monde a froid ! Il faut des 🪵 troncs.";
      ctx.font = "bold " + (petit ? 11 : 13) + "px " + POLICE;
      const l = Math.min(W - 20, ctx.measureText(txt).width + 24), y = basDuStock + 40;
      bulle(ctx, (W - l) / 2, y, l, 28, "rgba(220, 235, 255, .95)");
      texte(ctx, txt, W / 2, y + 14, petit ? 11 : 13, "#2f569c", true, "center");
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
    // Étape 7 : l'université a son grand panneau (la liste des recherches) ; les missions et la boutique aussi.
    if (monde.selection && monde.selection.type === "universite" && monde.selection.etat === "pret" && !panneau) panneauUniversite(ctx, monde, W, He, petit);
    else if (monde.selection && monde.selection.type === "marche" && monde.selection.etat === "pret" && !panneau) panneauMarche(ctx, monde, W, He, petit); // étape 8
    else if (monde.selection && !objectifsOuverts && !panneau) panneauBatiment(ctx, monde, monde.selection, 10, basDuStock + 8, petit ? 230 : 270);
    if (panneau === "mission") panneauMission(ctx, monde, W, He, petit);
    else if (panneau === "boutique") panneauBoutique(ctx, monde, W, He, petit);
    else if (panneau === "stats") panneauStats(ctx, monde, W, He, petit); // étape 8
    else if (panneau === "marche") panneauMarche(ctx, monde, W, He, petit);
    // Étape 11 : le résumé de l'absence, et la pub (par-dessus tout le reste)
    if (monde.absence) panneauAbsence(ctx, monde, W, He, petit);
    else if (monde.pub.offre) panneauPub(ctx, monde, W, He, petit);

    if (options.pause) {
      bulle(ctx, W / 2 - 70, 12, 140, 36);
      texte(ctx, "⏸ PAUSE", W / 2, 30, 17, "#3b2614", true, "center");
    }
  }

  // Étape 12 : les gros boutons ✅ (valider) et ❌ (annuler), juste au-dessus de l'aperçu, avec une bulle :
  // le prix, la route proposée, ou pourquoi c'est impossible.
  function validerAnnuler(ctx, monde, W, He, petit) {
    const cam = monde.camera, z = cam.zoom;
    let c, l, possible, texteBulle;
    if (monde.projet) {
      const p = monde.projet, B = Village.Batiments;
      c = p.colonne; l = p.ligne; possible = p.possible;
      if (!possible) texteBulle = "🚫 " + p.raison;
      else {
        const prix = p.deplacer ? "déménagement gratuit" : B.offert(monde, p.type) ? "🎁 offert (coup de pouce)" : Object.entries(B.coutPour(monde, p.type)).map(([r, n]) => n + " " + EMO(r)).join(" ") || "gratuit";
        texteBulle = (p.deplacer ? "↔️ " : B.TYPES[p.type].emoji + " ") + prix + (p.route === null ? " · ⚠️ pas de chemin possible" : p.route.length ? " · +" + p.route.length + " case(s) de chemin" : "");
        // Étape 13 : ✍️ y aura-t-il quelqu'un pour y travailler ?
        if (!p.deplacer && B.TYPES[p.type].metier && !Village.Villageois.libres(monde).length) texteBulle += Village.Logement.placeLibre(monde) ? " · 👥 pas de villageois libre (il en arrive)" : " · 🛏️ plus de lit : personne pour y travailler !";
      }
    } else if (monde.trace && monde.trace.pret && monde.trace.cases.length) {
      const fin = monde.trace.cases[monde.trace.cases.length - 1], ap = Village.Placement.apercu(monde);
      c = fin.colonne; l = fin.ligne; possible = ap && !ap.mauvaises.length && ap.cout <= Village.Porteurs.disponible(monde, "pierres");
      texteBulle = ap.mauvaises.length ? "🚫 " + ap.mauvaises.length + " case(s) impossible(s)" : ap.nouvelles + " case(s) · " + (ap.cout ? ap.cout + " 🪨" : "gratuit");
    } else return;
    const w = Village.Iso.versMonde(c + 0.5, l + 0.5, L, Hc);
    const sx = (w.x - cam.x) * z + W / 2, sy = (w.y - cam.y) * z + He / 2;
    const r = petit ? 23 : 21, ecart = 30;
    let by = sy - (monde.projet ? 70 : 34) * Math.min(z, 1.4) - r;
    by = Math.max(basDuStock + 40 + r, Math.min(He - 110, by));
    const bx = Math.max(ecart + r + 10, Math.min(W - ecart - r - 10, sx));
    // La bulle d'information
    ctx.font = "bold " + (petit ? 11 : 12) + "px " + POLICE;
    const lt = Math.min(W - 20, ctx.measureText(texteBulle).width + 20), tx = Math.max(10, Math.min(W - 10 - lt, bx - lt / 2)), ty = by - r - 34;
    bulle(ctx, tx, ty, lt, 26, possible ? "rgba(255, 250, 235, .96)" : "rgba(255, 225, 220, .96)");
    texte(ctx, texteBulle, tx + lt / 2, ty + 13, petit ? 11 : 12, possible ? "#3b2614" : "#c0392b", true, "center");
    zone(tx, ty, lt, 26, "rien");
    // Les 2 boutons ronds
    const rondBouton = (x, y, fond, signe, action, actif) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = actif ? fond : "#cfc6b6"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = "#ffffff"; ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#3b2614"; ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, Math.PI * 2); ctx.stroke();
      texte(ctx, signe, x, y + 1, 20, "#ffffff", true, "center");
      if (actif) zone(x - r - 4, y - r - 4, 2 * r + 8, 2 * r + 8, action);
      else zone(x - r - 4, y - r - 4, 2 * r + 8, 2 * r + 8, "rien");
    };
    rondBouton(bx - ecart, by, "#e8402e", "✖", "annulerProjet", true);
    rondBouton(bx + ecart, by, "#2fb34a", "✔", "valider", possible);
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
      lignes.push("🚚 " + actifs.length + " / " + Village.Ameliorations.placesPorteurs(monde) + " manutentionnaires (entrepôt niveau " + Village.Ameliorations.niveau(monde) + ") : " + dehors + " au travail" + (actifs.some((p) => p.affame) ? " · 🍽️ certains ont faim !" : "")); // étape 13
      lignes.push("👥 " + monde.villageois.length + " villageois sans travail · " + Village.Logement.habitants(monde) + " habitants / " + Village.Logement.capacite(monde) + " lits");
      if (monde.partis) lignes.push("😢 " + monde.partis + " habitant(s) parti(s) (trop faim)");
      lignes.push("📋 File d'attente : " + monde.file.length + " livraison(s)");
      lignes.push("🛏️ Logement : " + Village.Logement.habitants(monde) + " habitants / " + Village.Logement.capacite(monde) + " places"); // étape 8
      // Étape 11 : la réserve (le silo)
      const Re = Village.Reserve, mn = Re.minutesAvantPlein(monde);
      lignes.push("📦 Réserve niveau " + Re.niveau(monde) + " : " + Re.capacite(monde) + " places");
      lignes.push(mn === Infinity ? "   (on mesure encore le rythme du village)" : "   ≈ " + (mn >= 60 ? Math.floor(mn / 60) + " h " + String(Math.round(mn % 60)).padStart(2, "0") : Math.round(mn) + " min") + " d'absence avant qu'elle soit pleine");
      boutonsReserve = true;
    } else if (C.logement[b.type]) {
      // Étape 8 : une hutte ou une maison
      const Lg = Village.Logement;
      lignes.push("🛏️ " + C.logement[b.type] + " places pour dormir");
      lignes.push("Tout le village : " + Lg.habitants(monde) + " habitants / " + Lg.capacite(monde) + " places");
    } else if (!b.ouvrier) {
      // Étape 13 : ✍️ un villageois doit venir travailler ici
      if (Village.Villageois.versLeTravail(monde, b)) lignes.push("🚶 Un villageois arrive pour travailler ici !");
      else {
        lignes.push("👥 Personne ne travaille ici : aucun villageois libre.");
        lignes.push(!Village.Logement.placeLibre(monde) ? "🛏️ Plus de lit libre : construis une 🛖 hutte ou une 🏠 maison !" : Village.Repas.nourritureEnStock(monde) < 2 ? "🍽️ Il faut à manger pour qu'un villageois arrive." : "Un villageois arrive toutes les " + C.villageois.arrivee + " s.");
      }
    } else if (C.ateliers[b.type]) {
      // Étape 8 : un atelier (scierie, fonderie, forge) et sa recette
      const R = C.ateliers[b.type], q = (obj) => Object.entries(obj).map(([r, n]) => n + " " + EMO(r)).join(" + ");
      lignes.push("📜 Recette : " + q(R.entrees) + " → " + q(R.sorties));
      lignes.push(b.travail ? "⚙️ Fabrique… " + Math.ceil(b.travail.reste) + " s" : b.attend ? "😴 " + b.attend.charAt(0).toUpperCase() + b.attend.slice(1) : "Prêt à travailler");
      lignes.push("Réserve : " + Object.keys(R.entrees).map((r) => (b.entrees[r] || 0) + " " + EMO(r)).join(" · ") + " · devant : " + b.sortie + " " + EMO(b.sortieQuoi));
      lignes.push("A fabriqué " + b.produits + " " + C.ressources[b.sortieQuoi].nom);
    } else if (b.type === "macon") {
      // Étape 12 : le maçon-couvreur
      const o = b.ouvrier, abimes = monde.batiments.filter((x) => x.usure >= C.bourg.reparer).length;
      lignes.push("👷 Le maçon-couvreur " + Village.Ouvriers.NOMS_ETATS[o.etat] + (o.sansOutil ? " (il attend un 🔨)" : ""));
      lignes.push("Réserve : " + (b.entrees.outils || 0) + " 🔨 · " + abimes + " bâtiment(s) à réparer");
      lignes.push("A réparé " + b.produits + " bâtiment(s)");
    } else if (C.mines[b.type]) {
      // Étape 7 et 8 : une mine
      const sorte = C.mines[b.type].filon, k = monde.carte;
      const reste = B.filonsVoisins(k, b.colonne, b.ligne, Village.Carte.FILON[sorte]).reduce((a, i) => a + k.reste[i], 0);
      lignes.push(b.epuise ? "⛏️ Filon épuisé : il faut en trouver un autre" : b.travail ? "⛏️ Creuse… " + Math.ceil(b.travail.reste) + " s" : b.sortie >= C.sortieMax ? "⏳ Devant la porte, c'est plein" : "⛏️ Au travail");
      lignes.push("Dans le filon : encore " + reste + " " + EMO(sorte));
      lignes.push("Devant la porte : " + b.sortie + " / " + C.sortieMax + " " + EMO(sorte) + " · a extrait " + b.produits);
    } else if (b.type === "marche") {
      lignes.push("🏪 Touche le bâtiment pour vendre et acheter");
    } else {
      const o = b.ouvrier;
      lignes.push("👷 Le " + type.metier + " " + Village.Ouvriers.NOMS_ETATS[o.etat]);
      if (o.etat === "travailler") lignes.push("encore " + Math.ceil(o.minuteur) + " s");
      if (b.sortieQuoi) lignes.push("Devant la porte : " + b.sortie + " / " + C.sortieMax + " " + EMO(b.sortieQuoi));
      lignes.push((b.type === "forestier" ? "A planté " : "A rapporté ") + b.produits + ({ bucheron: " troncs", forestier: " pousses", carriere: " pierres", pecheur: " poissons", chasseur: " gibiers", geologue: " découvertes" }[b.type] || ""));
    }
    // Étape 4 : le repas de l'ouvrier
    const o = b.ouvrier;
    if (o && b.etat === "pret") {
      if (o.affame) {
        lignes.push("🍽️ A FAIM : travaille 2 fois moins vite !");
        lignes.push("Il faut du 🐟 ou de la 🍖 dans l'entrepôt.");
      } else lignes.push("😋 Prochain repas dans " + Math.max(0, Math.ceil(C.repas.intervalle - o.faim)) + " s (à l'entrepôt)");
      // Étape 11 : le bourg
      if (o.mecontent) lignes.push("🍞 Mécontent : pas de pain au dernier repas (−20 %)");
      if (o.froid) lignes.push("🥶 A froid : plus de bois de chauffage (−20 %)");
    }
    if (b.usure > 0 && b.etat === "pret") lignes.push((b.usure >= 1 ? "🔧 USÉ : 2 fois moins vite ! " : "🔧 Usure : " + Math.round(b.usure * 100) + " % · ") + (b.usure < C.bourg.reparer ? "réparé à " + Math.round(C.bourg.reparer * 100) + " %" : monde.batiments.some((x) => x.type === "macon" && x.etat === "pret") ? "le maçon-couvreur va venir 🪜" : "il faut un maçon-couvreur 🪜 !"));
    // Étape 13 : les boutons du bas (agrandir l'entrepôt, améliorer le bâtiment)
    const Am = Village.Ameliorations, prochaine = b.etat === "pret" ? Am.suivante(b) : null, faites = b.ameliorations || 0, total = Am.liste(b).length;
    const prixTexte = (prix, pieces) => Object.entries(prix).map(([r, n]) => n + EMO(r)).join(" ") + (pieces ? " " + pieces + "🪙" : "");
    if (b.type === "entrepot" && b.etat === "pret") lignes.push("🏗️ Agrandir : +" + C.entrepot.parNiveau + " places de manutentionnaire (niveau " + Am.niveau(monde) + " / " + C.entrepot.niveauMax + ")");
    if (total && b.etat === "pret") {
      if (prochaine) { const e = prochaine.effet, gain = typeof e === "number" ? "−" + Math.round((1 - e) * 100) + " % de temps" : "porteurs +" + Math.round((e.porteurs - 1) * 100) + " % plus rapides"; lignes.push("⬆️ " + "★".repeat(faites) + "☆".repeat(total - faites) + " Prochaine : " + prochaine.emoji + " " + prochaine.nom + " (" + gain + ")"); }
      else lignes.push("⬆️ " + "★".repeat(faites) + " Toutes les améliorations sont faites !");
    }
    // Étape 12 : une ligne trop longue passe à la ligne (elle ne dépasse plus du cadre)
    ctx.font = (petit ? 11 : 13) + "px " + POLICE;
    const coupees = [];
    for (const t of lignes) {
      let ligne = "";
      for (const mot of t.split(" ")) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (ctx.measureText(essai).width > l - 24 && ligne) { coupees.push(ligne); ligne = "   " + mot; } else ligne = essai;
      }
      coupees.push(ligne);
    }
    lignes.length = 0; lignes.push(...coupees);
    const rangees = [];
    if (boutonsReserve) rangees.push("reserve");
    if (b.type === "entrepot" && b.etat === "pret" && Am.niveau(monde) < C.entrepot.niveauMax) rangees.push("agrandir");
    if (prochaine) rangees.push("ameliorer");
    const hb = rangees.length * 40;
    const h = 34 + lignes.length * (petit ? 17 : 19) + 8 + hb;
    bulle(ctx, x, y, l, h);
    zone(x, y, l, h, "rien"); // (avant les boutons, pour qu'ils restent au-dessus)
    texte(ctx, type.emoji + " " + type.nom, x + 12, y + 18, petit ? 13 : 15, "#3b2614", true);
    lignes.forEach((t, n) => texte(ctx, t, x + 12, y + 38 + n * (petit ? 17 : 19), petit ? 11 : 13, "#5a4220"));
    rangees.forEach((sorte, n) => {
      const by = y + h - hb + n * 40;
      if (sorte === "agrandir") { const p = Am.prixAgrandir(monde); bouton(ctx, x + 10, by, l - 20, 32, "🏗️ Agrandir · " + prixTexte(p.ressources, p.pieces), "agrandirEntrepot", true, !Am.raisonAgrandir(monde), "#d98a1f"); }
      if (sorte === "ameliorer") { const bloque = (monde.age || 0) < prochaine.age; bouton(ctx, x + 10, by, l - 20, 32, bloque ? "🔒 " + C.ages[prochaine.age].emoji + " " + C.ages[prochaine.age].nom : "⬆️ Améliorer · " + prixTexte(prochaine.cout), "ameliorer", b.numero, !Am.raison(monde, b), "#8a5ab0"); }
    });
    if (boutonsReserve) {
      // Étape 11 : agrandir la réserve, avec des ressources (très cher) ou des 💎
      const Re = Village.Reserve, p = Re.prix(monde), by = y + h - hb, lb2 = (l - 30) / 2;
      bouton(ctx, x + 10, by, lb2 + 14, 32, "📦 " + Object.entries(p.ressources).map(([r, n]) => n + EMO(r)).join(" ") + (p.pieces ? " " + p.pieces + "🪙" : ""), "reserve", "ressources", !Re.raison(monde, "ressources"), "#d98a1f");
      bouton(ctx, x + 30 + lb2, by, lb2 - 10, 32, "📦 " + p.gemmes + " 💎", "reserve", "gemmes", !Re.raison(monde, "gemmes"), "#3e7bff");
      boutonsReserve = false;
    }
    // Le ✖ pour fermer
    texte(ctx, "✖", x + l - 16, y + 17, 14, "#a08a6a", true, "center");
    zone(x + l - 34, y, 34, 34, "fermer");
  }
  let boutonsReserve = false;

  // 🌙 Étape 11 : le résumé de ton absence (« Pendant ton absence… »)
  function panneauAbsence(ctx, monde, W, He, petit) {
    const a = monde.absence, gains = Object.entries(a.gains), pertes = Object.entries(a.pertes);
    const l = Math.min(W - 20, 420), x = (W - l) / 2, y = basDuStock + 8;
    const lignes = Math.ceil(gains.length / 3) + (pertes.length ? 1 + Math.ceil(pertes.length / 3) : 0);
    const h = 70 + lignes * 22 + (a.plein ? 40 : 0) + 50;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    const duree = a.secondes >= 3600 ? Math.floor(a.secondes / 3600) + " h " + String(Math.floor((a.secondes % 3600) / 60)).padStart(2, "0") : Math.max(1, Math.round(a.secondes / 60)) + " min";
    texte(ctx, "🌙 Pendant ton absence (" + duree + ")", x + 14, y + 22, petit ? 13 : 15, "#3b2614", true);
    texte(ctx, "Le village a continué de travailler, et a rangé tout ça dans la réserve :", x + 14, y + 44, petit ? 9 : 11, "#7a5a30");
    let yy = y + 68;
    const grille = (liste, signe, couleur) => liste.forEach(([r, n], k) => { texte(ctx, signe + n + " " + EMO(r), x + 18 + (k % 3) * ((l - 30) / 3), yy + Math.floor(k / 3) * 22, petit ? 13 : 15, couleur, true); });
    grille(gains, "+", "#2e8a3a"); yy += Math.ceil(gains.length / 3) * 22;
    if (pertes.length) { texte(ctx, "Ce qui a été mangé ou brûlé :", x + 14, yy, 11, "#7a5a30"); yy += 22; grille(pertes, "−", "#c0392b"); yy += Math.ceil(pertes.length / 3) * 22; }
    if (a.plein) {
      texte(ctx, "📦 Ta réserve (" + a.capacite + " places) était pleine au bout de " + (a.minutesPlein >= 60 ? Math.floor(a.minutesPlein / 60) + " h " + String(a.minutesPlein % 60).padStart(2, "0") : a.minutesPlein + " min") + " !", x + 14, yy + 4, petit ? 10 : 12, "#c0392b", true);
      texte(ctx, "Agrandis-la à l'entrepôt pour que le village travaille plus longtemps.", x + 14, yy + 22, petit ? 9 : 11, "#7a5a30");
      yy += 40;
    }
    bouton(ctx, x + l - 130, y + h - 46, 116, 34, "👍 Super !", "absenceVue", true, true);
  }

  // 📺 Étape 11 : la proposition de pub (au hasard), puis la (fausse) pub elle-même
  function panneauPub(ctx, monde, W, He, petit) {
    const o = monde.pub.offre;
    if (o.etat === "regarde") {
      // La « pub » : tout l'écran, on ne peut rien toucher pendant ce temps
      ctx.fillStyle = "rgba(10, 14, 30, .88)"; ctx.fillRect(0, 0, W, He);
      zone(0, 0, W, He, "rien");
      texte(ctx, "📺 Publicité", W / 2, He / 2 - 40, 22, "#ffffff", true, "center");
      texte(ctx, "(pour l'instant, une fausse : ici passera une vraie pub de 15 à 30 secondes)", W / 2, He / 2 - 12, petit ? 10 : 12, "#c9d1ff", false, "center");
      const lb = Math.min(260, W - 60), p = 1 - o.reste / C.pub.duree;
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect((W - lb) / 2, He / 2 + 10, lb, 10);
      ctx.fillStyle = "#ffe27a"; ctx.fillRect((W - lb) / 2, He / 2 + 10, lb * p, 10);
      texte(ctx, Math.ceil(o.reste) + " s", W / 2, He / 2 + 38, 14, "#ffffff", true, "center");
      return;
    }
    const l = Math.min(W - 20, 380), x = (W - l) / 2, y = basDuStock + 8, h = 92;
    bulle(ctx, x, y, l, h, "rgba(255, 245, 210, .98)");
    zone(x, y, l, h, "rien");
    const cadeau = o.sorte === "ressource" ? "+" + o.quantite + " " + nomRessource(o.quoi) : o.sorte === "gemmes" ? "+" + o.quantite + " 💎" : "la recherche « " + o.nom + " » avance de moitié";
    texte(ctx, "📺 Un cadeau t'attend !", x + 14, y + 20, petit ? 13 : 15, "#3b2614", true);
    texte(ctx, "Regarde une courte pub et reçois : " + cadeau, x + 14, y + 42, petit ? 10 : 12, "#5a4220", true);
    texte(ctx, "⏱️ " + Math.ceil(o.reste) + " s", x + 14, y + 70, 11, "#a08a6a", true);
    bouton(ctx, x + l - 232, y + 54, 124, 30, "📺 Regarder", "pub", "regarder", true, "#3e7bff");
    bouton(ctx, x + l - 100, y + 54, 86, 30, "Non merci", "pub", "refuser", true, "#a08a6a");
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

  return { dessiner, zoneSous, basculerMenu, fermerMenu, basculerObjectifs, basculerPanneau, fermerPanneau, get menuOuvert() { return menuOuvert; } };
})();
