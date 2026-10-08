// 🪧 L'INTERFACE : les panneaux et les boutons dessinés dans l'écran du jeu
//
// Sur un téléphone, il n'y a ni clavier ni souris : tout doit se faire au doigt, DANS l'écran.
// Ce fichier dessine :
//   - en haut à gauche : le nom du village et le STOCK de l'entrepôt (🪵 troncs, 🟫 planches, 🪨 pierres) ;
//   - en haut à droite : le bouton plein écran ⛶ et la mini-carte ;
//   - en bas : les gros BOUTONS de construction (assez gros pour un doigt : au moins 56 points) ;
//   - le panneau du bâtiment touché, et les messages d'aide ;
//   - (étape 8) le marché 🏪 et les statistiques 📊 ;
//   - (étape 25) l'inventaire 🎒 en pleine page.
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
  Village.Evenements.ecouter("rien-a-faire", (d) => /maçon/.test(d.nom) || /vétérinaire/.test(d.nom) || afficher("😴 " + d.nom + " : pas de " + d.quoi.replace(/^(une?|des) /, "") + (d.partout ? " sur toute la carte" : " à moins de " + d.rayon + " pas")));
  Village.Evenements.ecouter("route-impossible", (d) => afficher("🚫 Route : " + d.raison));
  Village.Evenements.ecouter("demolition-impossible", (d) => afficher("🚫 " + d.raison));
  // (Étape 22 : ✍️ plus de message « relié à l'entrepôt » : c'est normal, ça ne sert à rien de le dire. On prévient seulement quand c'est coupé.)
  Village.Evenements.ecouter("batiment-pose", (d) => { if (!d.relie) afficher("Pense à relier " + d.nom + " à l'entrepôt avec une route !"); });
  Village.Evenements.ecouter("saison", (d) => afficher(d.emoji + " C'est " + (d.nom === "été" ? "l'été" : d.nom === "automne" ? "l'automne" : d.nom === "hiver" ? "l'hiver : les lacs gèlent !" : "le printemps") + (d.nom === "printemps" ? " · année " + d.annee : "")));
  Village.Evenements.ecouter("habitant-part", (d) => afficher("😢 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " a quitté le village : il avait faim depuis un an !"));
  Village.Evenements.ecouter("habitant-arrive", (d) => afficher("🙋 " + d.qui.charAt(0).toUpperCase() + d.qui.slice(1) + " arrive au village !"));
  // Étape 7
  Village.Evenements.ecouter("recherche-finie", (d) => afficher("🎓 Recherche finie : " + d.emoji + " " + d.nom + " ! " + d.texte));
  Village.Evenements.ecouter("recherche-impossible", (d) => afficher("🚫 " + d.nom + " : " + d.raison));
  Village.Evenements.ecouter("mission-proposee", (d) => afficher("📜 " + d.emoji + " " + d.qui + " a besoin de toi ! Touche 📜"));
  Village.Evenements.ecouter("mission-reussie", (d) => { afficher("🎉 Mission réussie ! Merci de la part de " + d.qui + " " + d.emoji); gagner("🎉 Mission réussie !", Object.entries(d.recompense)); }); // étape 17 : ✍️ on VOIT ce qu'on gagne
  Village.Evenements.ecouter("pub-regardee", (d) => { if (d.sorte === "ressource") gagner("📺 Merci !", [[d.quoi, d.quantite]]); else if (d.sorte === "gemmes") gagner("📺 Merci !", [["gemmes", d.quantite]]); });
  Village.Evenements.ecouter("nouvel-age", (d) => gagner(d.emoji + " " + d.nom + " !", [["gemmes", d.gemmes]]));
  Village.Evenements.ecouter("logement-evolue", (d) => afficher("⬆️ " + d.avant + " n° " + d.numero + " devient « " + d.apres + " » : des " + d.emoji + " " + d.classe.toLowerCase() + " s'installent !")); // étape 18
  Village.Evenements.ecouter("impots", (d) => afficher("🪙 Impôts : +" + d.total + " pièces (artisans et bourgeois)"));
  Village.Evenements.ecouter("batiments-ranges", (d) => afficher("🧹 " + d.nombre + " bâtiment(s) déplacé(s) pour la place de leurs champs et enclos")); // étape 23
  Village.Evenements.ecouter("routes-pavees", (d) => afficher("🧱 Routes pavées : tes " + d.cases + " cases de chemin sont maintenant pavées (× 1,6 plus vite) !")); // étape 17
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

  // Étape 17 : ✍️ ce qu'on GAGNE (mission réussie, pub, nouvel âge) apparaît au milieu de l'écran, puis
  // chaque récompense s'envole vers la barre du stock. Une file d'attente : une récompense après l'autre.
  const gains = [];
  function gagner(titre, objets) { if (objets.length) gains.push({ titre, objets, debut: null }); }
  function dessinerGains(ctx, W, He) {
    const g = gains[0];
    if (!g) return;
    const maintenant = performance.now();
    if (g.debut === null) g.debut = maintenant;
    const t = (maintenant - g.debut) / 1000, DUREE = 3.2;
    if (t > DUREE) { gains.shift(); return; }
    const cx = W / 2, cy = He * 0.38, apparait = Math.min(1, t / 0.35), part = Math.max(0, (t - 1.6) / 1.4); // part : de 0 à 1 pendant l'envol
    const pasX = 70, x0 = cx - ((g.objets.length - 1) * pasX) / 2;
    if (part < 1) {
      ctx.save(); ctx.globalAlpha = 1 - part;
      const l = Math.max(220, g.objets.length * pasX + 40), h = 104, s = 0.6 + 0.4 * apparait + Math.sin(Math.min(1, t / 0.5) * Math.PI) * 0.06;
      ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
      bulle(ctx, cx - l / 2, cy - h / 2, l, h, "rgba(255, 250, 235, .96)");
      texte(ctx, g.titre, cx, cy - 30, 16, "#3b2614", true, "center");
      ctx.restore();
    }
    g.objets.forEach(([r, q], k) => {
      // Chaque objet s'envole (un peu après l'autre) vers le coin du stock, en rapetissant
      const p = Math.min(1, Math.max(0, part * 1.2 - k * 0.08)), x = x0 + k * pasX + (34 - (x0 + k * pasX)) * p * p, y = cy + 12 + (26 - cy - 12) * p * p - Math.sin(p * Math.PI) * 40;
      const taille = 28 * (1 - p * 0.5) * (0.6 + 0.4 * apparait);
      ctx.save(); ctx.globalAlpha = p < 0.85 ? 1 : (1 - p) / 0.15;
      if (C.ressources[r]) Village.Batisses.icone(ctx, r, x - 10, y, taille); else texte(ctx, r === "pieces" ? "🪙" : "💎", x - 10, y, taille * 0.8, null, false, "center");
      texte(ctx, "+" + q, x + taille * 0.35, y, 15 * (1 - p * 0.4), "#2e8a3a", true, "left");
      ctx.restore();
    });
  }

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
          cout: B.offert(monde, type) ? "🎁 offert" : B.coutPour(monde, type), // étape 12 : le coup de pouce ; étape 17 : un prix dessiné
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
      else if (el.cout && typeof el.cout === "object") { if (Object.keys(el.cout).length > 2) dessinerCout(ctx, Object.fromEntries(Object.entries(el.cout).slice(0, 2)), x + lc / 2, y0 + hc * 0.8, petit ? 11 : 12, el.possible ? "#7a5a30" : "#c0392b"), dessinerCout(ctx, Object.fromEntries(Object.entries(el.cout).slice(2)), x + lc / 2, y0 + hc * 0.93, petit ? 11 : 12, el.possible ? "#7a5a30" : "#c0392b"); else dessinerCout(ctx, el.cout, x + lc / 2, y0 + hc * 0.84, petit ? 11 : 12, el.possible ? "#7a5a30" : "#c0392b"); }
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
  function info(t) { afficher(t); } // étape 17 : toucher un bouton grisé dit pourquoi
  function basculerPanneau(nom) { panneau = panneau === nom ? null : nom; objectifsOuverts = false; }
  function fermerPanneau() { panneau = null; }

  // 🎒 Étape 25 : ✍️ « une touche inventaire où il s'ouvre en pleine page, et quand on clique sur une icône, ça nous
  // dit ce que c'est ». Les ressources sont rangées par familles (config.js : « inventaire »). Toucher une case la
  // choisit : en bas, sa fiche (ce que c'est, qui la fabrique, à quoi elle sert). Les ressources d'un âge pas encore
  // atteint sont grisées, avec un cadenas : on voit ce qui nous attend.
  let choixInventaire = null;
  function choisirInventaire(r) { choixInventaire = choixInventaire === r ? null : r; }
  function ficheRessource(monde, r) { // les lignes de la fiche, calculées à partir des règles du jeu (config.js)
    const B = Village.Batiments, nom = (t) => B.TYPES[t].emoji + " " + B.TYPES[t].court, lignes = [];
    const par = Object.entries(B.SORTIES).filter(([, q]) => q === r).map(([t]) => nom(t));
    if (par.length) lignes.push("🏭 Fabriqué par : " + par.join(", "));
    const ateliers = Object.entries(C.ateliers).filter(([, a]) => a.entrees[r]).map(([t]) => nom(t));
    if (ateliers.length) lignes.push("🔧 Sert à : " + ateliers.join(", "));
    const chantiers = Object.keys(C.batiments).filter((t) => B.TYPES[t] && (C.batiments[t].cout || {})[r]);
    if (chantiers.length) lignes.push("🏗️ Pour construire " + chantiers.length + " bâtiment(s) : " + chantiers.slice(0, 5).map(nom).join(", ") + (chantiers.length > 5 ? "…" : ""));
    const plus = [];
    if (Village.Repas.NOURRITURE.includes(r)) plus.push("🍽️ se mange aux repas");
    if (C.douceurs.includes(r)) plus.push("😊 un goût de plus pour le bonheur");
    if (r === "vetements") plus.push("👕 les habitants s'en habillent (bonheur)");
    if (C.marche.prix[r]) plus.push("🏪 se vend " + C.marche.prix[r] + " 🪙 environ au marché");
    if (plus.length) lignes.push(plus.join(" · "));
    return lignes;
  }
  function panneauInventaire(ctx, monde, W, He, petit) {
    const x = 10, y = 10, l = W - 20, h = He - 20;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .985)");
    zone(x, y, l, h, "rien");
    texte(ctx, "🎒 Inventaire", x + 14, y + 22, petit ? 16 : 19, "#3b2614", true);
    texte(ctx, "🪙 " + monde.pieces + "   💎 " + monde.gemmes, x + l - 46, y + 22, petit ? 12 : 14, "#3b2614", true, "right");
    croix(ctx, x, y, l, "fermerPanneau");
    texte(ctx, l < 600 ? "Touche une icône : ce que c'est." : "Touche une icône pour savoir ce que c'est.  ·  Le chiffre : ce qui est libre (pas encore promis à un chantier).  ·  Touche I pour fermer.", x + 14, y + 42, petit ? 10 : 11, "#7a5a30");
    // Les cases : aussi grandes que possible. Sur un grand écran, le nom de la famille est à gauche de sa rangée ;
    // sur un téléphone, il est au-dessus.
    const familles = C.inventaire.familles, ec = 6, aGauche = l >= 640, lNom = aGauche ? 150 : 0, l0 = l - 28 - lNom, place = h - 56 - 10;
    let lc = 96, parRangee = 1;
    const hauteur = (c) => { parRangee = Math.max(1, Math.floor((l0 + ec) / (c + ec))); return familles.reduce((tot, f) => tot + (aGauche ? 0 : 20) + Math.ceil(f.ressources.length / parRangee) * (c * 0.9 + ec) + 6, 0); };
    while (lc > 38 && hauteur(lc) > place) lc -= 2;
    hauteur(lc);
    const hc = lc * 0.9;
    let cy = y + 56, caseChoisie = null;
    for (const f of familles) {
      if (aGauche) texteLong(ctx, f.nom, x + 14, cy + hc / 2 - 8, lNom - 14, 13, "#5a4220", 16);
      else { texte(ctx, f.nom, x + 14, cy + 8, petit ? 11 : 13, "#5a4220", true); cy += 20; }
      f.ressources.forEach((r, n) => {
        const cx = x + 14 + lNom + (n % parRangee) * (lc + ec), ry = cy + Math.floor(n / parRangee) * (hc + ec);
        const vu = visible(monde, r), choisi = choixInventaire === r;
        if (choisi) caseChoisie = ry + hc / 2;
        ctx.fillStyle = choisi ? "#ffe27a" : vu ? "#fffaf0" : "#e9e1d2"; ctx.strokeStyle = choisi ? "#ff8a1f" : "#c9b48f"; ctx.lineWidth = choisi ? 3 : 1.5;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(cx, ry, lc, hc, 10); else ctx.rect(cx, ry, lc, hc); ctx.fill(); ctx.stroke();
        const avecNom = true; // étape 28 : ✍️ le nom est toujours écrit sous l'icône
        if (vu) {
          Village.Batisses.icone(ctx, r, cx + lc / 2, ry + hc * (avecNom ? 0.3 : 0.36), lc * 0.36);
          const libre = Math.max(0, Village.Porteurs.disponible(monde, r));
          texte(ctx, String(libre), cx + lc / 2, ry + hc * (avecNom ? 0.64 : 0.76), Math.max(11, lc * 0.17), libre > 0 ? "#3b2614" : "#a08a6a", true, "center");
          if (avecNom) { const nom = C.ressources[r].nom.replace("minerai de ", "").replace(/^(seaux|bottes|bidons|mottes|pots|pelotes|rouleaux) d(e |')/, ""); let tn = Math.max(8, Math.min(11, lc * 0.15)); ctx.font = tn + "px " + POLICE; while (tn > 7 && ctx.measureText(nom).width > lc - 4) { tn -= 0.5; ctx.font = tn + "px " + POLICE; } texte(ctx, nom, cx + lc / 2, ry + hc * 0.87, tn, "#7a5a30", false, "center"); }
        } else {
          const age = C.ages[C.ressources[r].age || 0];
          texte(ctx, "🔒", cx + lc / 2, ry + hc * 0.38, lc * 0.24, null, false, "center");
          texte(ctx, age.emoji, cx + lc / 2, ry + hc * 0.74, lc * 0.17, null, false, "center");
        }
        zone(cx, ry, lc, hc, "inventaire", r);
      });
      cy += Math.ceil(f.ressources.length / parRangee) * (hc + ec) + 6;
    }
    // La fiche de la ressource choisie : par-dessus les cases, en bas (ou en haut si la case choisie est en bas)
    const r = choixInventaire;
    if (!r) return;
    const R = C.ressources[r], lf = Math.min(l - 20, 620), hFiche = petit ? 150 : 130, xf = x + (l - lf) / 2;
    const yFiche = caseChoisie !== null && caseChoisie > y + h * 0.55 ? y + 50 : y + h - hFiche - 10;
    bulle(ctx, xf, yFiche, lf, hFiche, "rgba(255, 246, 222, .99)");
    zone(xf, yFiche, lf, hFiche, "inventaire", r); // toucher la fiche la ferme
    texte(ctx, "✖", xf + lf - 16, yFiche + 16, 13, "#a08a6a", true, "center");
    const tx = xf + 58, lt = lf - 76;
    Village.Batisses.icone(ctx, r, xf + 30, yFiche + 30, 34);
    if (!visible(monde, r)) {
      const age = C.ages[R.age || 0];
      texte(ctx, R.nom.charAt(0).toUpperCase() + R.nom.slice(1) + " · 🔒 " + age.emoji + " " + age.nom, tx, yFiche + 18, petit ? 13 : 15, "#3b2614", true);
      texteLong(ctx, (R.info || "") + " Tu la découvriras plus tard.", tx, yFiche + 40, lt, petit ? 11 : 12, "#5a4220", petit ? 14 : 16);
      return;
    }
    const libre = Math.max(0, Village.Porteurs.disponible(monde, r)), promis = Math.max(0, monde.stock[r] - libre);
    texte(ctx, R.nom.charAt(0).toUpperCase() + R.nom.slice(1) + " · tu en as " + monde.stock[r] + (promis ? " (" + promis + " promis)" : ""), tx, yFiche + 18, petit ? 13 : 15, "#3b2614", true);
    let yy = yFiche + 38;
    yy += texteLong(ctx, R.info || "", tx, yy, lt, petit ? 11 : 12, "#5a4220", petit ? 14 : 16) * (petit ? 14 : 16) + 2;
    for (const ligne of ficheRessource(monde, r)) {
      if (yy > yFiche + hFiche - 8) break;
      yy += texteLong(ctx, ligne, tx, yy, lt, petit ? 10 : 11, "#7a5a30", petit ? 13 : 15) * (petit ? 13 : 15);
    }
  }


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

  // Étape 17 : ✍️ un PRIX dessiné avec les vraies icônes (« 8 [planches] 6 [pierres] »), centré en cx.
  //   avant : un texte devant (« ⬆️ Améliorer · ») ; le prix peut contenir des 🪙 (pieces).
  function dessinerCout(ctx, cout, cx, cy, taille, couleur, avant) {
    const t = taille || 14, morceaux = Object.entries(cout);
    ctx.font = "bold " + (t - 2) + "px " + POLICE;
    const largeurs = morceaux.map(([r, n]) => ctx.measureText(String(n)).width + 2 + t + 6);
    const lAvant = avant ? ctx.measureText(avant + " ").width : 0;
    let x = cx - (lAvant + largeurs.reduce((a, b) => a + b, 0) - 6) / 2;
    if (avant) { texte(ctx, avant, x, cy, t - 2, couleur, true); x += lAvant; }
    morceaux.forEach(([r, n], k) => {
      texte(ctx, String(n), x, cy, t - 2, couleur, true);
      const xi = x + ctx.measureText(String(n)).width + 2;
      if (C.ressources[r]) { ctx.save(); ctx.fillStyle = "rgba(255, 250, 235, .9)"; ctx.beginPath(); ctx.arc(xi + t / 2, cy, t / 2 + 1, 0, Math.PI * 2); ctx.fill(); ctx.restore(); Village.Batisses.icone(ctx, r, xi + t / 2, cy, t); }
      else texte(ctx, r === "pieces" ? "🪙" : r === "gemmes" ? "💎" : r, xi, cy, t - 3, null, false);
      x += largeurs[k];
    });
  }

  // Un bouton dessiné dans un panneau (il ne répond que s'il est actif)
  // Étape 17 : le texte peut être un prix ({ cout, avant }) : il est alors dessiné avec les vraies icônes.
  function bouton(ctx, x, y, l, h, t, action, valeur, actif, couleur) {
    ctx.fillStyle = !actif ? "#e4dccd" : couleur || "#4fc25a"; ctx.strokeStyle = !actif ? "#c9b48f" : "#5a4220"; ctx.lineWidth = 2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, l, h, 10); else ctx.rect(x, y, l, h);
    ctx.fill(); ctx.stroke();
    if (t && typeof t === "object") dessinerCout(ctx, t.cout, x + l / 2, y + h / 2 + 1, 15, actif ? "#ffffff" : "#8a7a60", t.avant);
    else texte(ctx, t, x + l / 2, y + h / 2 + 1, 12, actif ? "#ffffff" : "#8a7a60", true, "center");
    if (actif) zone(x, y, l, h, action, valeur);
  }

  const coutTexte = (c) => Object.entries(c).map(([r, n]) => n + " " + EMO(r)).join("  ");
  const visible = (monde, r) => (monde.age || 0) >= (C.ressources[r].age || 0) || monde.stock[r] > 0; // étape 11
  const nomRessource = (r) => (r === "pieces" ? "🪙 pièces" : r === "gemmes" ? "💎" : Village.Batiments.NOMS_RESSOURCES[r]);
  const minutes = (s) => Math.floor(s / 60) + " min " + String(Math.floor(s % 60)).padStart(2, "0");
  const croix = (ctx, x, y, l, action) => { texte(ctx, "✖", x + l - 16, y + 17, 14, "#a08a6a", true, "center"); zone(x + l - 38, y, 38, 34, action); };

  // 🎓 Le panneau de l'université : les recherches de notre âge (et celles de l'âge suivant, 🔒)
  // Étape 21 : ✍️ la liste ne tenait pas dans l'écran. Les recherches faites sont cachées (on les compte), et si
  // la liste est encore trop longue, elle est rangée en PAGES (◀ ▶ en haut du panneau).
  let pageUniversite = 0;
  function changerPage(d) { pageUniversite = Math.max(0, pageUniversite + d); }
  function panneauUniversite(ctx, monde, W, He, petit) {
    const R = Village.Recherches, toutes = C.recherches.filter((r) => r.age <= (monde.age || 0) + 1 && !R.faite(monde, r.id));
    const l = Math.min(W - 20, 470), hl = petit ? 38 : 40, x = (W - l) / 2, y = basDuStock + 4;
    let parPage = Math.max(3, Math.floor((He - y - (petit ? 96 : 104) - 54) / hl));
    if (toutes.length > parPage) parPage = Math.max(3, Math.floor((He - y - (petit ? 96 : 104) - 54 - 44) / hl)); // la place des boutons ◀ ▶
    const pages = Math.max(1, Math.ceil(toutes.length / parPage));
    pageUniversite = Math.min(pageUniversite, pages - 1);
    const liste = toutes.slice(pageUniversite * parPage, (pageUniversite + 1) * parPage);
    const h = 46 + Math.max(1, liste.length) * hl + 8 + (pages > 1 ? 44 : 0);
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    const e = monde.recherches.enCours, u = monde.selection;
    let tete = "🎓 Université · " + monde.recherches.faites.length + " recherche(s) faite(s)";
    if (!u.relie) tete = "🎓 Université · ❌ pas de route : les recherches attendent";
    else if (!u.ouvrier) tete = "🎓 Université · 😢 le savant est parti";
    texte(ctx, tete, x + 12, y + 18, petit ? 12 : 14, "#3b2614", true);
    texte(ctx, pages > 1 ? "Page " + (pageUniversite + 1) + " / " + pages + " · ✅ " + monde.recherches.faites.length + " faite(s), cachées" : "Paie avec ton stock, puis le savant cherche. ✅ " + monde.recherches.faites.length + " faite(s), cachées.", x + 12, y + 35, petit ? 9 : 10, "#7a5a30");
    if (pages > 1) { // en bas du panneau
      bouton(ctx, x + l / 2 - 96, y + h - 42, 88, 34, "◀ avant", "pageUniversite", -1, pageUniversite > 0, "#8a5ab0");
      bouton(ctx, x + l / 2 + 8, y + h - 42, 88, 34, "après ▶", "pageUniversite", 1, pageUniversite < pages - 1, "#8a5ab0");
    }
    if (!toutes.length) texte(ctx, "🎉 Toutes les recherches de ton âge sont faites !", x + 12, y + 44 + hl / 2, petit ? 11 : 12, "#2e8a3a", true);
    croix(ctx, x, y, l, "fermer");
    liste.forEach((r, n) => {
      const ry = y + 44 + n * hl, fait = R.faite(monde, r.id), enCours = e && e.id === r.id, pourquoi = R.raison(monde, r.id);
      if (n % 2) { ctx.fillStyle = "rgba(90, 66, 32, .06)"; ctx.fillRect(x + 6, ry, l - 12, hl); }
      const lb = petit ? 108 : 128, bx = x + l - lb - 10, by = ry + 5, bh = hl - 10;
      texte(ctx, r.emoji + " " + r.nom, x + 12, ry + hl * 0.32, petit ? 11 : 13, "#3b2614", true);
      ctx.save(); ctx.beginPath(); ctx.rect(x + 8, ry, bx - x - 12, hl); ctx.clip(); // le texte ne déborde pas sur le bouton
      // Étape 17 : ✍️ ce qui MANQUE, en rouge, avec les vraies icônes (à la place de la description)
      const manque = !fait && !enCours && r.age <= (monde.age || 0) ? R.manques(monde, r.cout) : [];
      if (manque.length) { texte(ctx, "il manque", x + 12, ry + hl * 0.74, petit ? 9 : 10, "#c0392b", true); ctx.font = "bold " + (petit ? 9 : 10) + "px " + POLICE; const lm = ctx.measureText("il manque").width; dessinerCout(ctx, Object.fromEntries(manque), x + 12 + lm + 6 + 60, ry + hl * 0.74, petit ? 12 : 13, "#c0392b"); }
      else texte(ctx, r.texte, x + 12, ry + hl * 0.74, petit ? 9 : 10, "#7a5a30");
      ctx.restore();
      if (fait) texte(ctx, "✅ faite", bx + lb / 2, ry + hl / 2, 12, "#2e8a3a", true, "center");
      else if (enCours) {
        const p = 1 - e.reste / r.duree;
        ctx.fillStyle = "rgba(90, 66, 32, .15)"; ctx.fillRect(bx, by + bh / 2 - 5, lb, 10);
        ctx.fillStyle = "#4fc25a"; ctx.fillRect(bx, by + bh / 2 - 5, lb * p, 10);
        texte(ctx, Math.round(p * 100) + " %", bx + lb / 2, by - 1, 9, "#2e8a3a", true, "center");
      } else if (r.age > (monde.age || 0)) texte(ctx, "🔒 " + C.ages[r.age].emoji + " " + C.ages[r.age].nom.replace(/^(Le|La) /, ""), bx + lb / 2, ry + hl / 2, 11, "#8a7a60", true, "center");
      else { bouton(ctx, bx, by, lb, bh, { cout: r.cout }, "recherche", r.id, !pourquoi); if (pourquoi) zone(bx, by, lb, bh, "info", "🎓 " + r.nom + " : " + pourquoi); } // étape 17 : toucher dit pourquoi
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

  // 😊 Étape 15 : le panneau du bonheur. Chaque partie de la note, avec sa barre, et ce que ça change.
  function panneauBonheur(ctx, monde, W, He, petit) {
    const Bh = Village.Bonheur, note = Bh.calculer(monde), H = C.bonheur, v = monde.bonheur.valeur || 0;
    const hl = petit ? 30 : 34, l = Math.min(W - 20, 460), x = (W - l) / 2, y = basDuStock + 4;
    const h = 92 + note.parts.length * hl + 62;
    bulle(ctx, x, y, l, h, "rgba(255, 250, 235, .98)");
    zone(x, y, l, h, "rien");
    texte(ctx, Bh.emoji(monde) + " Le bonheur des habitants : " + Math.round(v) + " % (" + Bh.humeur(monde) + ")", x + 14, y + 20, petit ? 13 : 15, "#3b2614", true);
    croix(ctx, x, y, l, "fermerPanneau");
    // La grande jauge, avec ses 3 seuils
    const jx = x + 14, jl = l - 28, jy = y + 36;
    ctx.fillStyle = "#eadfc6"; ctx.fillRect(jx, jy, jl, 12);
    ctx.fillStyle = v >= H.content ? "#2e8a3a" : v < H.triste ? "#c0392b" : "#e0a81e"; ctx.fillRect(jx, jy, jl * v / 100, 12);
    ctx.fillStyle = "rgba(59, 38, 20, .6)"; ctx.fillRect(jx + jl * note.total / 100 - 1, jy - 3, 2, 18); // la note : la jauge y va doucement
    for (const [s, e] of [[H.triste, "😢"], [H.content, "😊"], [H.ravi, "😄"]]) { ctx.fillStyle = "#3b2614"; ctx.fillRect(jx + jl * s / 100, jy + 12, 1, 4); texte(ctx, e + s, jx + jl * s / 100, jy + 24, 9, "#7a5a30", false, "center"); }
    texte(ctx, "La jauge va doucement vers la note (" + Math.round(note.total) + " %) : le trait foncé.", x + 14, y + 76, petit ? 9 : 10, "#7a5a30");
    note.parts.forEach((p, k) => {
      const ry = y + 90 + k * hl;
      texte(ctx, p.nom, x + 14, ry + 8, petit ? 10 : 11, "#3b2614", true);
      if (p.max > 0) { ctx.fillStyle = "#eadfc6"; ctx.fillRect(x + 14, ry + 17, l - 90, 6); ctx.fillStyle = "#e0a81e"; ctx.fillRect(x + 14, ry + 17, (l - 90) * Math.max(0, p.points) / p.max, 6); }
      texte(ctx, (p.points >= 0 ? "+" : "−") + Math.round(Math.abs(p.points)) + (p.max ? " / " + p.max : ""), x + l - 14, ry + 14, 12, p.points >= 0 ? "#2e8a3a" : "#c0392b", true, "right");
    });
    const yb = y + 90 + note.parts.length * hl + 8;
    texte(ctx, "Effet : travail × " + String(Bh.vitesse(monde)).replace(".", ",") + " · arrivée des villageois × " + String(Bh.arrivee(monde)).replace(".", ","), x + 14, yb, petit ? 10 : 11, "#5a4220", true);
    const manque = C.douceurs.concat(Village.Repas.NOURRITURE).filter((a) => !note.gouts.includes(a) && (monde.age || 0) >= (C.ressources[a].age || 0));
    texte(ctx, manque.length ? "💡 Pour plus de goûts : " + manque.map((a) => C.ressources[a].emoji).join(" ") : "💡 Tous les goûts sont là : bravo !", x + 14, yb + 20, petit ? 10 : 11, "#5a4220");
    texte(ctx, "🏠 Des maisons (pas des huttes) donnent du confort.", x + 14, yb + 38, petit ? 10 : 11, "#5a4220");
  }

  // 🏪 Étape 8 : le panneau du marché. Une ligne par ressource : le stock, le prix (et s'il monte ou baisse),
  // et deux boutons : vendre 5, acheter 5.
  function panneauMarche(ctx, monde, W, He, petit) {
    const M = Village.Marche, liste = Object.keys(C.marche.prix).filter((r) => visible(monde, r)), lot = C.marche.lot;
    const hl = Math.max(22, Math.min(petit ? 30 : 34, Math.floor((He - basDuStock - 100) / liste.length))); // étape 14 : tient dans l'écran
    const l = Math.min(W - 20, 500), x = (W - l) / 2, y = basDuStock + 4;
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
      Village.Batisses.icone(ctx, r, x + 21, ry + hl / 2, 18); // étape 14 : l'icône dessinée
      if (!petit) texte(ctx, C.ressources[r].nom.replace("minerai de ", ""), x + 34, ry + hl / 2, 12, "#3b2614", true);
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
    const x0 = basDuStock + 4, hl = Math.max(16, Math.min(petit ? 24 : 26, Math.floor((He - x0 - 150) / liste.length))); // étape 14 : la liste tient toujours dans l'écran
    const l = Math.min(W - 20, 520), x = (W - l) / 2, y = x0;
    const h = 74 + liste.length * hl + 62; // étape 19 : + la ligne de la nourriture
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
      Village.Batisses.icone(ctx, r, x + 21, ry + hl / 2, 16); // étape 14 : l'icône dessinée
      if (!petit) texte(ctx, C.ressources[r].nom.replace("minerai de ", ""), x + 34, ry + hl / 2, 12, "#3b2614", true);
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
    // Étape 19 : ✍️ le bilan de la nourriture : ce que le village produit et ce qu'il mange, par minute
    const St19 = Village.Statistiques, NOUR = ["poissons", "viande", "pain"].concat(C.douceurs);
    let prod = 0, mange = 0; for (const r of NOUR) { const m = St19.parMinute(monde, r, true); prod += m.entrees; mange += m.sorties; }
    texte(ctx, (petit ? "🍽️ +" + chiffre(prod) + " / −" + chiffre(mange) + " par min " : "🍽️ Nourriture : +" + chiffre(prod) + " produite · −" + chiffre(mange) + " mangée par minute ") + (prod >= mange ? "✅" : "⚠️") + " · 👥 " + monde.villageois.length + " sans travail", x + 12, yb + 36, petit ? 10 : 11, prod >= mange ? "#2e8a3a" : "#c0392b", true);
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
    // Étape 14 : ✍️ chaque ressource a son icône DESSINÉE (de vraies planches, de vraies pépites)
    // Étape 17 : ✍️ la barre prenait trop de place. Elle est plus petite, presque transparente, et ne montre
    // que les ressources de base et celles qu'on a (le marché et les statistiques montrent tout).
    // Étape 25 : ✍️ « trop large pour tout afficher en permanence ». La barre ne montre plus QUE les ressources de base ;
    // tout le reste est dans l'inventaire 🎒 (le dernier bouton de la barre, ou la touche I).
    const BASE = C.inventaire.barre;
    // Étape 20 : ✍️ on montre ce qui est DISPONIBLE : ce qui est déjà promis à un chantier ou à un atelier n'est plus compté
    // (avant, on voyait le stock, et on ne comprenait pas pourquoi on ne pouvait pas construire).
    const ressources = BASE.map((r) => [r, Math.max(0, Village.Porteurs.disponible(monde, r))]);
    if (monde.age >= 2 || monde.pieces > 0) ressources.push(["pieces", monde.pieces]);
    ressources.push(["inventaire", null]); // étape 25 : le bouton 🎒
    // Étape 8 : s'il y a trop de ressources pour la largeur, la bulle passe sur 2 lignes.
    const pas = petit ? 38 : 50, haut = petit ? 17 : 20, parLigne = Math.max(3, Math.min(ressources.length, Math.floor((W - (W >= 520 ? 290 : 70) - 20) / pas))) // étape 18 : sans passer sous la mini-carte;
    const nLignes = Math.ceil(ressources.length / parLigne), hStock = (petit ? 40 : 46) + (nLignes - 1) * haut;
    // Étape 6 : l'âge du village et, à côté, où on en est des objectifs pour passer au suivant.
    // (La barre de la saison a été enlevée : ✍️ elle ne servait à rien.) Toucher : voir les objectifs.
    const age = Village.Ages.actuel(monde), prochain = Village.Ages.suivant(monde), obj = Village.Ages.objectifs(monde);
    let titre = age.emoji + " " + age.nom;
    if (obj && prochain) titre += " · " + prochain.emoji + " " + obj.filter((x) => x.fait).length + "/" + obj.length + " 🎯";
    if (monde.moment) titre += "  " + monde.moment.emoji; // étape 9 : le moment de la journée
    // Étape 13 : ✍️ les habitants et les lits, toujours visibles (⚠️ quand il n'y a plus de lit)
    const Lg = Village.Logement, hab = Lg.habitants(monde), lits = Lg.capacite(monde);
    titre += "  👥 " + hab + "/" + lits + (hab >= lits ? " ⚠️" : "");
    if (monde.bonheur.valeur !== null && !petit) titre += "  " + Village.Bonheur.emoji(monde) + " " + Math.round(monde.bonheur.valeur) + " %"; // étape 15
    ctx.font = "bold " + (petit ? 10 : 12) + "px " + POLICE;
    const lb = Math.min(W - (W >= 520 ? 290 : 70), Math.max(20 + Math.min(ressources.length, parLigne) * pas, ctx.measureText(titre).width + 24));
    basDuStock = 10 + hStock;
    ctx.fillStyle = "rgba(255, 250, 235, .55)"; ctx.strokeStyle = "rgba(90, 66, 32, .35)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(10, 10, lb, hStock, 10); else ctx.rect(10, 10, lb, hStock); ctx.fill(); ctx.stroke();
    texte(ctx, titre, 20, petit ? 21 : 23, petit ? 10 : 12, "#5a4220", true);
    let sac = null;
    const noms = []; // étape 28 : les zones des icônes (pour dire leur nom)
    ressources.forEach(([r, n], k) => {
      const rx = 20 + (k % parLigne) * pas, ry = (petit ? 38 : 42) + Math.floor(k / parLigne) * haut, ti = petit ? 13 : 16;
      if (r === "inventaire") { // étape 25 : le bouton de l'inventaire, avec le nombre de sortes de ressources qu'on a
        sac = [rx - 4, ry - ti / 2 - 3, pas - 4, ti + 6];
        ctx.fillStyle = panneau === "inventaire" ? "#ffe27a" : "rgba(255, 226, 122, .8)"; ctx.strokeStyle = "#5a4220"; ctx.lineWidth = 1.2;
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(sac[0], sac[1], sac[2], sac[3], 6); else ctx.rect(sac[0], sac[1], sac[2], sac[3]); ctx.fill(); ctx.stroke();
        texte(ctx, "🎒", rx, ry, petit ? 11 : 13, null, false);
        texte(ctx, String(Object.keys(C.ressources).filter((q) => s[q] > 0).length), rx + ti + 2, ry, petit ? 10 : 12, "#3b2614", true);
        return;
      }
      if (r === "pieces") texte(ctx, "🪙", rx, ry, petit ? 11 : 13, null, false); else Village.Batisses.icone(ctx, r, rx + ti / 2, ry, ti);
      // Étape 28 : ✍️ toucher une icône dit son nom
      noms.push([rx - 3, ry - ti / 2 - 3, pas - 4, ti + 6, r === "pieces" ? "🪙 Pièces : " + monde.pieces + " (pour le marché et les améliorations)" : C.ressources[r].emoji + " " + C.ressources[r].nom.charAt(0).toUpperCase() + C.ressources[r].nom.slice(1) + " : " + n + " libres (" + monde.stock[r] + " dans l'entrepôt)"]);
      texte(ctx, String(n), rx + ti + 2, ry, petit ? 11 : 13, n <= 0 && (r === "poissons" || r === "viande") ? "#c0392b" : "#3b2614", true);
    });
    zone(10, 10, lb, hStock, "objectifs");
    for (const [zx, zy, zl, zh, t] of noms) zone(zx, zy, zl, zh, "info", t); // étape 28 : toucher une icône = son nom
    if (sac) zone(sac[0] - 5, sac[1] - 6, sac[2] + 10, sac[3] + 12, "panneau", "inventaire"); // (après la barre : il est au-dessus ; un peu plus grand pour le doigt)
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
    // Étape 15 : 😊 le bonheur des habitants (la jauge se remplit dans le bouton)
    const yb15 = Village.Marche.leMarche(monde) ? 240 : 194, v15 = monde.bonheur.valeur || 0;
    bulle(ctx, W - tp - 10, yb15, tp, tp, panneau === "bonheur" ? "rgba(255, 226, 122, .98)" : null);
    ctx.fillStyle = v15 >= C.bonheur.content ? "rgba(46, 138, 58, .35)" : v15 < C.bonheur.triste ? "rgba(192, 57, 43, .35)" : "rgba(242, 194, 48, .4)";
    ctx.fillRect(W - tp - 6, yb15 + tp - 4 - (tp - 8) * v15 / 100, tp - 8, (tp - 8) * v15 / 100);
    texte(ctx, Village.Bonheur.emoji(monde), W - 10 - tp / 2, yb15 + 15, 17, null, false, "center");
    texte(ctx, Math.round(v15) + "%", W - 10 - tp / 2, yb15 + 32, 10, "#3b2614", true, "center");
    zone(W - tp - 10, yb15, tp, tp, "panneau", "bonheur");
    if (W >= 520) dessinerMini(ctx, monde, mini, W - 10 - tp - 10, 10, petit ? 1 : 1.5);

    // ---- En bas : le MENU (étape 5). ✍️ Moins de boutons toujours affichés, regroupés par ressource :
    //   🪵 Bois · 🪨 Pierre · 🍖 Nourriture · la Route · 🔧 Outils.
    // Toucher un groupe ouvre un tiroir, juste au-dessus, avec ses bâtiments.
    const tousLesGroupes = [
      { id: "bois", emoji: "🪵", nom: "Bois", batiments: ["bucheron", "forestier", "scierie"] },
      { id: "pierre", emoji: "⛏️", nom: "Mines", batiments: ["carriere", "geologue", "mineCharbon", "mineFer", "mineOr"] },
      { id: "nourriture", emoji: "🍖", nom: "Nourriture", batiments: ["pecheur", "chasseur", "ferme", "moulin", "boulangerie", "laiterie", "fromagerie", "cremerie", "charcuterie"] }, // étape 15 et 16 : les produits de l'élevage // étape 11 : le pain
      { id: "elevage", emoji: "🐄", nom: "Élevage", batiments: ["puits", "faneur", "etable", "poulailler", "bergerie", "porcherie", "veterinaire"] }, // étape 15 et 16
      // Étape 8 : les logements, et les artisans (fonderie, forge, marché, université)
      { id: "maisons", emoji: "🛖", nom: "Maisons", batiments: ["hutte", "maison", "macon"] }, // étape 12 : le maçon-couvreur
      { id: "artisans", emoji: "⚒️", nom: "Artisans", batiments: ["fonderie", "forge", "orfevre", "tisserand", "tailleur", "marche", "universite"] }, // étape 16 : la laine et les habits
      // Étape 7 : le chemin de terre, et la route en pierre (débloquée par la recherche « Routes pavées »)
      // Étape 19 : ✍️ l'entrepôt secondaire est rangé avec les routes (le transport), dès le hameau
      { id: "route", nom: "Routes", batiments: ["depot"], outils: [
        // Étape 17 : ✍️ une seule route. Après « Routes pavées », elle est pavée (et les anciennes aussi, d'un coup).
        Village.Recherches.a(monde, "routePierre") ? { id: "route", icone: "pierre", nom: "Route pavée", touche: "R", cout: C.routes.coutPierre.pierres + "🪨/case" } : { id: "route", icone: "terre", nom: "Chemin", touche: "R", cout: "gratuit" },
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
      // Le texte doit tenir dans l'écran (avec la place du ✖) : sinon, on l'écrit un peu plus petit.
      // Étape 20 : ✍️ les messages dépassaient du cadre. S'il est encore trop long : sur 2 lignes, puis coupé avec « … ».
      const place = Math.min(W - 20, 640) - (monde.construction || monde.outil ? 38 : 0);
      let taille = petit ? 12 : 14;
      const mini = petit ? 10 : 11, largeur = (t) => { ctx.font = "bold " + taille + "px " + POLICE; return ctx.measureText(t).width + 24; };
      while (taille > mini && largeur(aide) > place) taille -= 0.5;
      let lignes = [aide];
      if (largeur(aide) > place) {
        const mots = aide.split(" "); lignes = [""];
        for (const mot of mots) { const essai = lignes[lignes.length - 1] ? lignes[lignes.length - 1] + " " + mot : mot; if (largeur(essai) > place && lignes[lignes.length - 1]) lignes.push(mot); else lignes[lignes.length - 1] = essai; }
        if (lignes.length > 2) { lignes = lignes.slice(0, 2); while (lignes[1].length > 1 && largeur(lignes[1] + " …") > place) lignes[1] = lignes[1].slice(0, -1); lignes[1] += " …"; }
      }
      const hb = (petit ? 28 : 32) + (lignes.length - 1) * (taille + 4), l = Math.min(place, Math.max(...lignes.map(largeur))), y = y0 - (petit ? 36 : 42) - (lignes.length - 1) * (taille + 4);
      bulle(ctx, (W - l) / 2 - (monde.construction || monde.outil ? 19 : 0), y, l, hb);
      lignes.forEach((li, k) => texte(ctx, li, W / 2 - (monde.construction || monde.outil ? 19 : 0), y + (petit ? 14 : 16) + k * (taille + 4), taille, "#3b2614", true, "center"));
      if ((monde.construction || monde.outil) && !(message && maintenant < message.jusqua)) {
        // Le petit ✖ pour annuler
        const ax = (W + l) / 2 - 19 + 6;
        if (ax + 30 < W) { bulle(ctx, ax, y, 30, petit ? 28 : 32); texte(ctx, "✖", ax + 15, y + (petit ? 14 : 16), 14, "#c0392b", true, "center"); zone(ax, y, 30, petit ? 28 : 32, "annuler"); }
      }
    }

    // Étape 12 : ✅ et ❌ à côté de l'aperçu (un bâtiment, ou la route tracée)
    validerAnnuler(ctx, monde, W, He, petit);

    // Étape 22 : ✍️ les ALERTES de tout le village (plus rien à manger, le froid, le pain) : une seule fois, en petites
    // étiquettes sous le stock, au lieu d'une bulle au-dessus de chaque bâtiment (c'était illisible).
    const alertes = [], sansPain = monde.batiments.filter((x) => x.ouvrier && x.ouvrier.mecontent).length + monde.porteurs.filter((q) => q.mecontent).length;
    if (Village.Repas.nourritureEnStock(monde) <= 0) alertes.push(["🍽️ Plus rien à manger !", "#c0392b"]);
    if (monde.froid) alertes.push(["🥶 Froid : il faut des 🪵", "#2f569c"]);
    if (sansPain) alertes.push(["🍞 " + sansPain + " sans pain (−20 %)", "#a0601e"]);
    let ax = 10, ay = basDuStock + 6;
    for (const [txt, couleur] of alertes) {
      ctx.font = "bold " + (petit ? 10 : 11) + "px " + POLICE;
      const lw = ctx.measureText(txt).width + 18;
      if (ax + lw > W - 60) { ax = 10; ay += 26; }
      bulle(ctx, ax, ay, lw, 22, "rgba(255, 250, 235, .92)");
      texte(ctx, txt, ax + lw / 2, ay + 11, petit ? 10 : 11, couleur, true, "center");
      ax += lw + 6;
    }

    // ---- Le panneau du bâtiment touché
    // Étape 7 : l'université a son grand panneau (la liste des recherches) ; les missions et la boutique aussi.
    if (monde.selection && monde.selection.type === "universite" && monde.selection.etat === "pret" && !panneau) panneauUniversite(ctx, monde, W, He, petit);
    else if (monde.selection && monde.selection.type === "marche" && monde.selection.etat === "pret" && !panneau) panneauMarche(ctx, monde, W, He, petit); // étape 8
    else if (monde.selection && !objectifsOuverts && !panneau) panneauBatiment(ctx, monde, monde.selection, 10, basDuStock + 8, petit ? Math.min(W - 70, 290) : 320); // étape 22 : un peu plus large
    if (panneau === "mission") panneauMission(ctx, monde, W, He, petit);
    else if (panneau === "boutique") panneauBoutique(ctx, monde, W, He, petit);
    else if (panneau === "stats") panneauStats(ctx, monde, W, He, petit); // étape 8
    else if (panneau === "marche") panneauMarche(ctx, monde, W, He, petit);
    else if (panneau === "bonheur") panneauBonheur(ctx, monde, W, He, petit); // étape 15
    if (panneau === "inventaire") panneauInventaire(ctx, monde, W, He, petit); // étape 25 : en pleine page, par-dessus le reste
    dessinerGains(ctx, W, He); // étape 17
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

  // Étape 22 : ✍️ « il faut structurer les informations : là, on en donne trop, qui ne servent à rien ». Le panneau a
  // maintenant 3 parties, et seulement ce qui sert :
  //   1. ⚠️ les PROBLÈMES (en rouge), seulement s'il y en a (pas de route, personne, faim, usé, malade…) ;
  //   2. ce que le bâtiment FAIT (sa recette en icônes, ce qu'il fait en ce moment, une barre de progression) ;
  //   3. son NIVEAU et ses améliorations (les boutons).
  // Une ligne : { t (texte), c (couleur), g (gras) } ; ou { titre } ; ou { barre (0 à 1), t } ; ou { recette, hiver }.
  function panneauBatiment(ctx, monde, b, x, y, l) {
    const B = Village.Batiments, type = B.TYPES[b.type], petit = Ec.petit;
    const lignes = [], pb = (t) => lignes.push({ t, c: "#c0392b", g: true }), info = (t, c) => lignes.push({ t, c: c || "#5a4220" }), titre = (t) => lignes.push({ titre: t });
    const o = b.ouvrier, pret = b.etat === "pret";
    // ---- 1. Les problèmes
    const problemes = [];
    if (b.type !== "entrepot" && !b.relie) problemes.push("❌ Pas de route jusqu'à un entrepôt : rien n'arrive, rien ne part !");
    if (pret && type.metier && !o) problemes.push(Village.Villageois.versLeTravail(monde, b) ? "🚶 Un villageois arrive pour travailler ici." : !Village.Logement.placeLibre(monde) ? "🛏️ Personne ne travaille ici : il faut des lits (🛖 hutte) !" : "👥 Personne ne travaille ici pour l'instant.");
    if (o && o.affame) problemes.push("🍽️ L'ouvrier a faim : 2 fois moins vite !");
    if (b.malade) problemes.push("🤒 " + C.elevage.troupeaux[b.type].noms.replace(/^l/, "L") + " sont malades : " + (monde.batiments.some((x) => x.type === "veterinaire" && x.ouvrier) ? "le vétérinaire 🩺 arrive." : "construis un vétérinaire 🩺 !"));
    if (b.usure >= C.bourg.reparer && pret) problemes.push("🔧 Usé à " + Math.round(b.usure * 100) + " % : " + (monde.batiments.some((x) => x.type === "macon" && x.etat === "pret") ? "le maçon-couvreur 🪜 va venir." : "il faut un maçon-couvreur 🪜 !"));
    if (b.epuise) problemes.push("⛏️ Le filon est épuisé : le géologue 🔍 doit en trouver un autre.");
    if (pret && b.sortieQuoi && b.sortie >= C.sortieMax) problemes.push("📦 Devant la porte, c'est plein : il faut plus de porteurs.");
    for (const p of problemes) pb(p);
    // ---- 2. Ce qu'il fait
    if (b.etat === "chantier") {
      const m = B.materiaux(b);
      titre("🏗️ Le chantier");
      lignes.push({ barre: b.progres, t: Math.round(b.progres * 100) + " % · matériaux arrivés " + m.arrives + " / " + m.total });
    } else if (b.type === "entrepot") {
      const actifs = Village.Porteurs.actifs(monde), dehors = actifs.filter((p) => p.etat !== "attend").length, Re = Village.Reserve, mn = Re.minutesAvantPlein(monde);
      titre("🏠 Le cœur du village");
      info("🚚 " + actifs.length + " / " + Village.Ameliorations.placesPorteurs(monde) + " porteurs · " + dehors + " au travail");
      info("📋 " + monde.file.length + " livraison(s) en attente", monde.file.length > 40 ? "#c0392b" : null);
      // Étape 24 : ✍️ le conseil dépend de ce que tu as déjà (avant : « construis un entrepôt 2 », même quand tu l'avais !)
      const nDepots = monde.batiments.filter((x) => x.type === "depot").length;
      if (monde.file.length > 40) pb("⚠️ Il manque des porteurs : " + (Village.Ages.debloque(monde, "depot") && nDepots < C.depot.max ? "construis un 🏬 entrepôt de plus (tu en as " + nDepots + " / " + C.depot.max + ")" : "agrandis l'entrepôt") + ", et des huttes pour les loger.");
      if (Village.Ameliorations.placesEnPlus(monde, b)) info("➕ " + Village.Ameliorations.placesEnPlus(monde, b) + " place(s) en plus : 1 pour " + C.depot.parBatiments + " bâtiments livrés");
      info("📦 Réserve : " + Re.capacite(monde) + " places" + (mn === Infinity ? "" : " · pleine en ≈ " + (mn >= 60 ? Math.floor(mn / 60) + " h " + String(Math.round(mn % 60)).padStart(2, "0") : Math.round(mn) + " min") + " si tu pars"));
      boutonsReserve = true;
    } else if (b.type === "depot") {
      const ici = monde.porteurs.filter((p) => !p.parti && Village.Porteurs.maisonDe(monde, p) === b);
      titre("🏬 Un 2e point de départ pour les porteurs");
      info("🚚 " + ici.length + " / " + Village.Ameliorations.placesDe(monde, b) + " porteurs habitent ici" + (Village.Ameliorations.placesEnPlus(monde, b) ? " (dont " + Village.Ameliorations.placesEnPlus(monde, b) + " grâce aux bâtiments livrés)" : ""));
      info("📍 Il livre " + monde.batiments.filter((x) => x !== b && x.entrepotProche === b).length + " bâtiment(s) autour de lui");
    } else if (C.logement[b.type]) {
      const Cl = Village.Classes, cl = Cl.fiche(Cl.classeDe(b.type)), ev = C.classes.evolution[b.type];
      titre(cl.emoji + " " + C.logement[b.type] + " " + cl.nom.toLowerCase() + " habitent ici" + (cl.impot ? " · " + cl.impot + " 🪙/min chacun" : ""));
      if (ev) {
        const suivante = Cl.fiche(Cl.classeDe(ev.vers));
        titre("⬆️ Pour devenir « " + B.TYPES[ev.vers].nom + " » (" + suivante.emoji + ")");
        if ((monde.age || 0) < ev.age) info("🔒 À partir de : " + C.ages[ev.age].emoji + " " + C.ages[ev.age].nom.toLowerCase());
        else {
          for (const x of Cl.besoins(monde, suivante.id)) info((x.ok ? "✅ " : "⬜ ") + x.nom, x.ok ? "#2e8a3a" : null);
          if (!Cl.raison(monde, b)) lignes.push({ barre: Math.min(1, b.evolution / C.classes.delai), t: b.attendMateriaux ? "il manque les matériaux" : "évolution " + Math.min(100, Math.round((b.evolution / C.classes.delai) * 100)) + " %" });
          lignes.push({ cout: ev.cout, avant: "il faudra" });
        }
      } else info("🏆 Le plus beau logement du village !", "#2e8a3a");
    } else if (C.ateliers[b.type]) {
      const R = C.ateliers[b.type];
      titre("📜 Ce qu'il fabrique");
      lignes.push({ recette: R });
      if (o) lignes.push(b.travail ? { barre: 1 - b.travail.reste / Math.max(0.1, b.travail.duree || 1), t: "⚙️ fabrique…" } : { t: b.attend ? "😴 " + b.attend.charAt(0).toUpperCase() + b.attend.slice(1) : "⏳ prêt", c: "#7a5a30" });
    } else if (C.mines[b.type]) {
      const sorte = C.mines[b.type].filon, k = monde.carte;
      const reste = B.filonsVoisins(k, b.colonne, b.ligne, Village.Carte.FILON[sorte]).reduce((a, i) => a + k.reste[i], 0);
      titre("⛏️ Ce qu'elle extrait");
      lignes.push({ cout: { [sorte]: 1 }, avant: "→" });
      if (b.travail) { // étape 26 : il marche jusqu'au filon, creuse, puis revient
        const w = b.travail, passe = (w.duree || 1) - w.reste, demi = (w.marche || 0) / 2;
        lignes.push({ barre: passe / Math.max(0.1, w.duree || 1), t: passe < demi ? "🚶 va au filon…" : passe > (w.duree || 1) - demi ? "🚶 rapporte son morceau…" : "⛏️ creuse…" });
        if (w.distance > 1) info("🚶 Le filon est à " + w.distance + " cases : " + Math.round(w.marche) + " s de marche (aller-retour)");
      }
      info("Encore " + reste + " dans les filons (jusqu'à " + C.rayonMine + " cases)");
    } else if (b.type === "marche") {
      titre("🏪 Touche le marché pour vendre et acheter");
    } else if (b.type === "macon") {
      titre("🪜 Il répare les bâtiments usés");
      info(monde.batiments.filter((x) => x.usure >= C.bourg.reparer).length + " bâtiment(s) à réparer · " + (b.entrees.outils || 0) + " 🔨 en réserve");
      if (o && o.tournee) info("🧭 En tournée : travail n° " + o.tournee + " · " + (o.outils || 0) + " 🔨 sur lui"); // étape 27
    } else if (b.type === "veterinaire") {
      titre("🩺 Il soigne les troupeaux malades");
      info(monde.batiments.filter((x) => x.malade).length + " troupeau(x) malade(s) au village");
      if (o && o.tournee) info("🧭 En tournée : soin n° " + o.tournee + ", partout sur la carte"); // étape 27
    } else if (o) {
      titre("👷 Ce qu'il rapporte");
      if (b.sortieQuoi) lignes.push({ cout: { [b.sortieQuoi]: 1 }, avant: "→" });
      else if (b.type === "forestier") info("🌱 Il plante des arbres");
      else if (b.type === "geologue") info("🔍 Il cherche des pierres et des filons, partout sur la carte" + (o.tournee ? " · 🧭 tournée : n° " + o.tournee : "")); // étape 27
      info("Le " + type.metier + " " + Village.Ouvriers.NOMS_ETATS[o.etat], "#7a5a30");
      if (o.etat === "travailler") lignes.push({ barre: 1 - o.minuteur / Math.max(0.1, o.dureeTravail || o.minuteur + 0.01), t: "au travail" });
    }
    if (pret && b.sortieQuoi && b.sortie > 0 && b.sortie < C.sortieMax) info("Devant la porte : " + b.sortie + " / " + C.sortieMax, "#7a5a30");
    // ---- 3. Le niveau et les améliorations
    const Am = Village.Ameliorations, prochaine = pret ? Am.suivante(b) : null, faites = b.ameliorations || 0, total = Am.liste(b).length;
    if (total && pret) {
      titre("⭐ Niveau " + (faites + 1) + " / " + (total + 1) + "  " + "★".repeat(faites) + "☆".repeat(total - faites));
      if (prochaine) { const e = prochaine.effet, gain = typeof e === "number" ? "−" + Math.round((1 - e) * 100) + " % de temps" : "porteurs +" + Math.round((e.porteurs - 1) * 100) + " %"; info("Prochaine : " + prochaine.emoji + " " + prochaine.nom + " (" + gain + ")"); }
      else info("Toutes les améliorations sont faites !", "#2e8a3a");
    }
    if (b.type === "entrepot" && pret) titre("🏗️ Niveau " + Am.niveau(monde) + " / " + C.entrepot.niveauMax + " (+" + C.entrepot.parNiveau + " porteurs par niveau)");
    // Une ligne de texte trop longue passe à la ligne (elle ne dépasse plus du cadre)
    const taille = petit ? 11 : 13, interligne = petit ? 17 : 19;
    const finales = [];
    for (const li of lignes) {
      if (li.t === undefined || li.barre !== undefined) { finales.push(li); continue; }
      ctx.font = (li.g ? "bold " : "") + taille + "px " + POLICE;
      let ligne = "";
      for (const mot of li.t.split(" ")) { const essai = ligne ? ligne + " " + mot : mot; if (ctx.measureText(essai).width > l - 24 && ligne) { finales.push(Object.assign({}, li, { t: ligne })); ligne = "   " + mot; } else ligne = essai; }
      finales.push(Object.assign({}, li, { t: ligne }));
    }
    const hauteur = (li) => (li.titre ? interligne + 4 : li.recette || li.cout ? interligne + 6 : interligne);
    const rangees = [];
    if (boutonsReserve) rangees.push("reserve");
    if (b.type === "entrepot" && pret && Am.niveau(monde) < C.entrepot.niveauMax) rangees.push("agrandir");
    if (prochaine) rangees.push("ameliorer");
    const hb = rangees.length * 40;
    const h = 36 + finales.reduce((a, li) => a + hauteur(li), 0) + 8 + hb;
    bulle(ctx, x, y, l, h);
    zone(x, y, l, h, "rien"); // (avant les boutons, pour qu'ils restent au-dessus)
    texte(ctx, type.emoji + " " + type.nom + (faites ? "  " + "★".repeat(faites) : ""), x + 12, y + 18, petit ? 13 : 15, "#3b2614", true);
    let yy = y + 38;
    for (const li of finales) {
      if (li.titre) { texte(ctx, li.titre, x + 12, yy + 3, taille, "#3b2614", true); ctx.fillStyle = "rgba(90, 66, 32, .18)"; ctx.fillRect(x + 12, yy + interligne / 2 + 3, l - 24, 1); }
      else if (li.barre !== undefined) {
        ctx.fillStyle = "#eadfc6"; ctx.fillRect(x + 12, yy - 5, l - 24, 10);
        ctx.fillStyle = "#4fc25a"; ctx.fillRect(x + 12, yy - 5, (l - 24) * Math.max(0, Math.min(1, li.barre)), 10);
        texte(ctx, li.t, x + l / 2, yy, petit ? 9 : 10, "#3b2614", true, "center");
      } else if (li.recette) {
        // La recette en VRAIES icônes : « 1 [tronc] → 2 [planches] » (+ ce qu'il faut en plus l'hiver)
        const R = li.recette, e = Object.keys(R.entrees).length ? R.entrees : null;
        ctx.font = "bold " + taille + "px " + POLICE;
        if (e) dessinerCout(ctx, e, x + l * 0.3, yy + 3, petit ? 15 : 17, "#3b2614");
        texte(ctx, e ? "→" : "rien →", e ? x + l * 0.5 : x + l * 0.35, yy + 3, taille + 2, "#3b2614", true, "center");
        dessinerCout(ctx, R.sorties, x + l * 0.68, yy + 3, petit ? 15 : 17, "#3b2614");
        if (R.hiver) dessinerCout(ctx, R.hiver, x + l * 0.88, yy + 3, petit ? 12 : 14, "#3e7bff", "❄️+");
      } else if (li.cout) dessinerCout(ctx, li.cout, x + l / 2, yy + 3, petit ? 14 : 16, "#5a4220", li.avant);
      else texte(ctx, li.t, x + 12, yy, taille, li.c || "#5a4220", !!li.g);
      yy += hauteur(li);
    }
    rangees.forEach((sorte, n) => {
      const by = y + h - hb + n * 40;
      if (sorte === "agrandir") { const p = Am.prixAgrandir(monde); bouton(ctx, x + 10, by, l - 20, 32, { avant: "🏗️ Agrandir ·", cout: Object.assign({}, p.ressources, p.pieces ? { pieces: p.pieces } : {}) }, "agrandirEntrepot", true, !Am.raisonAgrandir(monde), "#d98a1f"); }
      if (sorte === "ameliorer") { const bloque = (monde.age || 0) < prochaine.age; bouton(ctx, x + 10, by, l - 20, 32, bloque ? "🔒 " + C.ages[prochaine.age].emoji + " " + C.ages[prochaine.age].nom : { avant: "⬆️ " + prochaine.nom + " ·", cout: prochaine.cout }, "ameliorer", b.numero, !Am.raison(monde, b), "#8a5ab0"); }
    });
    if (boutonsReserve) {
      // Étape 11 : agrandir la réserve, avec des ressources (très cher) ou des 💎
      const Re = Village.Reserve, p = Re.prix(monde), by = y + h - hb, lb2 = (l - 30) / 2;
      bouton(ctx, x + 10, by, lb2 + 14, 32, { avant: "📦", cout: Object.assign({}, p.ressources, p.pieces ? { pieces: p.pieces } : {}) }, "reserve", "ressources", !Re.raison(monde, "ressources"), "#d98a1f");
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

  return { dessiner, zoneSous, info, changerPage, basculerMenu, fermerMenu, basculerObjectifs, basculerPanneau, fermerPanneau, choisirInventaire, ficheRessource, get menuOuvert() { return menuOuvert; }, get panneauOuvert() { return panneau; } };
})();
