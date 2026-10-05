// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE.
// Il affiche en direct les nombres que le jeu garde en mémoire, le journal des événements
// (tout ce qui est annoncé à la « radio ») et le contenu de la base de données.

window.Village = window.Village || {};

Village.SousLeCapot = (function () {
  const virgule = (n, k) => n.toFixed(k).replace(".", ",");
  const nombre = (n) => n.toLocaleString("fr-FR");

  // Le message du journal pour chaque événement de la radio.
  const MESSAGES = {
    lecture: (d) => (d.trouve ? "📂 Base de données lue : on reprend la carte n° " + d.graine + (d.converti ? " (ancienne version " + d.depuis + ", convertie en version " + d.vers + (d.depuis < 3 ? " : construis des routes !" : "") + (d.depuis < 4 ? " : un peu de nourriture est offerte" : "") + ")" : "") : "📂 Base de données vide : première visite sur cet ordinateur"),
    "carte-inventee": (d) =>
      "🗺️ Carte n° " + d.graine + " inventée : " + d.colonnes + " × " + d.lignes + " cases, " + nombre(d.compte.arbres) + " arbres, " +
      d.compte.rochers + " rochers, " + d.compte.montagnes + " montagnes, " + d.rivieres + " rivière(s) · filons : " +
      d.compte.charbon + " charbon, " + d.compte.fer + " fer, " + d.compte.or + " or · le village est en (" + d.village.colonne + ", " + d.village.ligne + ")" +
      (d.reprise ? " · partie reprise : " + d.batiments + " bâtiment(s), " + d.routes + " case(s) de route, " + d.modifs + " case(s) changée(s) rejouée(s)" : " · nouvelle partie : l'entrepôt est posé"),
    "case-choisie": (d) =>
      (d.batiment ? "🏠 " + d.batiment + " choisi(e) · " : "") + "📌 Case (" + d.colonne + ", " + d.ligne + ") choisie : " + d.nomTerrain + (d.objet ? ", " + d.nomObjet : "") + (d.filon ? ", filon de " + d.nomFilon : "") +
      " · altitude " + virgule(d.altitude, 2) + ", humidité " + virgule(d.humidite, 2),
    zoom: (d) => "🔍 Zoom : " + Math.round(d.ancien * 100) + " % → " + Math.round(d.zoom * 100) + " %",
    "retour-village": (d) => "🏠 Retour à la place du village, case (" + d.colonne + ", " + d.ligne + ")",
    sauvegarde: (d) => "💾 Base de données écrite (" + d.raison + ") : " + nombre(d.octets) + " caractères",
    // Étape 2
    "choix-construction": (d) => "🏗️ Construire : " + d.nom + " (coût : " + cout(d.cout) + "). Choisis une case",
    "construction-annulee": (d) => "↩️ Construction annulée (" + d.nom + ")",
    "construction-impossible": (d) => "🚫 Pas de " + d.nom + " en (" + d.colonne + ", " + d.ligne + ") : " + d.raison,
    "batiment-pose": (d) => "🏗️ Chantier n° " + d.numero + " : " + d.nom + " en (" + d.colonne + ", " + d.ligne + "), " + cout(d.cout) + " réservé(s) dans l'entrepôt : les porteurs vont les apporter" + (d.relie ? "" : " (il faut une route !)"),
    "chantier-fini": (d) => "🎉 " + d.nom + " n° " + d.numero + " construit(e)" + (d.metier ? " : le " + d.metier + " arrive" : ""),
    "ouvrier-part": (d) => "🚶 Le " + d.metier + " (n° " + d.numero + ") part vers " + d.quoi + " en (" + d.colonne + ", " + d.ligne + ") : " + d.pas + " pas · la tache d'encre a regardé " + d.visitees + " cases",
    "rien-a-faire": (d) => "😴 " + d.nom + " n° " + d.numero + " : pas de " + d.quoi.replace(/^une? /, "") + " à moins de " + d.rayon + " pas (" + d.visitees + " cases regardées). On réessaie dans " + Village.CONFIG.ouvriers.attente + " s",
    "arbre-coupe": (d) => "🪓 Arbre coupé en (" + d.colonne + ", " + d.ligne + ") · il reste " + nombre(d.arbres) + " arbres sur la carte",
    "pousse-plantee": (d) => "🌱 Pousse plantée en (" + d.colonne + ", " + d.ligne + ") · " + d.pousses + " pousse(s) en train de grandir",
    "arbre-pousse": (d) => "🌳 La pousse en (" + d.colonne + ", " + d.ligne + ") est devenue un " + d.sorte + " · " + nombre(d.arbres) + " arbres sur la carte",
    "pierre-taillee": (d) => "⛏️ Pierre taillée en (" + d.colonne + ", " + d.ligne + ")" + (d.vide ? " · le rocher est vide, il disparaît" : " · il reste " + d.reste + " pierre(s) dans ce rocher"),
    depose: (d) => "📦 " + (d.quantite > 1 ? d.quantite + " " + d.quoi : emo(d.quoi)) + " posé(e)s devant la porte du bâtiment n° " + d.numero + " (" + d.devant + " qui attendent un porteur)",
    "scierie-attend": (d) => "⏳ Scierie n° " + d.numero + " : plus de tronc en réserve, elle attend un porteur",
    "sciage-debut": (d) => "🪚 Scierie n° " + d.numero + " : scie 1 tronc (il en reste " + d.reserve + " en réserve)",
    "planches-sciees": (d) => "🟫 Scierie n° " + d.numero + " : +" + d.planches + " planches devant la porte (" + d.devant + ")",
    // Étape 3
    "choix-outil": (d) => (d.outil === "route" ? "🛤️ Outil route : touche le départ, puis l'arrivée" : d.outil === "demolir" ? "🧹 Outil démolir : touche une route ou un bâtiment" : "↩️ Outil rangé"),
    "route-depart": (d) => "🚩 Départ de la route en (" + d.colonne + ", " + d.ligne + ")",
    "route-construite": (d) => "🛤️ Route construite : " + d.cases + " case(s), dont " + d.nouvelles + " nouvelle(s) → " + d.cout + " 🪨 · " + d.total + " cases de route en tout",
    "route-impossible": (d) => "🚫 Route impossible : " + d.raison,
    "route-demolie": (d) => "🧹 Route démolie en (" + d.colonne + ", " + d.ligne + ") : 1 🪨 rendue",
    "batiment-demoli": (d) => "🧹 " + d.nom + " n° " + d.numero + " démoli(e)",
    "demolition-impossible": (d) => "🚫 " + d.raison,
    "batiment-relie": (d) => "✅ " + d.nom + " n° " + d.numero + " est relié(e) à l'entrepôt",
    "batiment-coupe": (d) => "✂️ " + d.nom + " n° " + d.numero + " n'est plus relié(e) à l'entrepôt",
    "ouvrier-bloque": (d) => "🛤️❌ " + d.nom + " n° " + d.numero + " : pas de route jusqu'à l'entrepôt, l'ouvrier ne travaille pas",
    "livraison-demandee": (d) => "📋 Papier n° " + d.numero + " dans la file : " + (d.sorte === "ramener" ? "ramener " + emo(d.quoi) + " de " : "apporter " + emo(d.quoi) + " à ") + d.nom + " n° " + d.batiment + " (" + d.file + " dans la file)",
    "porteur-part": (d) => "🚚 Porteur " + d.porteur + " prend le papier : " + (d.sorte === "ramener" ? "va chercher " + emo(d.quoi) + " chez " : "apporte " + emo(d.quoi) + " à ") + d.nom + " n° " + d.batiment + " (" + d.pas + " pas de route) · encore " + d.file + " dans la file",
    "porteur-livre": (d) => "🤲 Porteur " + d.porteur + " a livré " + emo(d.quoi) + " à " + d.nom + " n° " + d.batiment,
    "arrivee-entrepot": (d) => "🏠 Porteur " + d.porteur + " range " + (d.quantite > 1 ? d.quantite + " " + d.quoi : emo(d.quoi)) + " dans l'entrepôt → " + d.stock + " en stock",
    // Étape 4
    saison: (d) => d.emoji + " Nouvelle saison : " + d.nom + " (année " + d.annee + ")" + (d.hiver ? " · les lacs gèlent, rien ne pousse, aucun animal ne naît" : ""),
    "poisson-peche": (d) => "🎣 " + ({ sardine: "Une sardine pêchée", truite: "Une truite pêchée", thon: "Un thon pêché" }[d.espece] || "Un poisson pêché") + " en (" + d.colonne + ", " + d.ligne + ") : " + d.quantite + " 🐟" + (d.glace ? " · par un trou dans la glace ❄️" : ""),
    "gibier-chasse": (d) => "🏹 " + (d.sorte === "cerf" ? "Cerf" : "Lapin") + " chassé en (" + d.colonne + ", " + d.ligne + ") : " + Village.CONFIG.prises[d.sorte] + " 🍖" + (d.neige ? " dans la neige ❄️" : "") + " · il reste " + d.animaux + " animaux",
    "animal-ne": (d) => (d.sorte === "cerf" ? "🦌 Un faon" : "🐇 Un lapereau") + " est né en (" + d.colonne + ", " + d.ligne + ") · " + d.total + " animaux",
    repas: (d) => "😋 " + d.qui + " mange " + emo(d.quoi) + " à l'entrepôt (il reste " + d.reste + " repas)",
    affame: (d) => "🍽️ " + d.qui + " a faim et il n'y a rien à manger : il travaille 2 fois moins vite !",
    "plus-faim": (d) => "😊 " + d.qui + " a enfin mangé : il retrouve toute sa vitesse",
    // Étape 5
    "deplacement-choisi": (d) => "↔️ Déplacer : " + d.nom + " n° " + d.numero + ". Choisis sa nouvelle place",
    "deplacement-impossible": (d) => "🚫 Déplacement impossible (" + d.nom + ") : " + d.raison,
    "batiment-deplace": (d) => "↔️ " + d.nom + " n° " + d.numero + " déménage de (" + d.de.colonne + ", " + d.de.ligne + ") à (" + d.vers.colonne + ", " + d.vers.ligne + ")" + (d.relie ? "" : " : il n'est plus relié par une route"),
    "gisement-trouve": (d) => "🔍 Gisement trouvé en (" + d.colonne + ", " + d.ligne + ") : un rocher de " + d.pierres + " 🪨",
    "gisement-rate": (d) => "🔍 Rien trouvé en (" + d.colonne + ", " + d.ligne + ") (1 chance sur 2) : le géologue cherchera ailleurs",
    "habitant-part": (d) => "😢 " + d.qui + " quitte le village : il avait trop faim depuis " + Village.CONFIG.repas.tropFaim + " s",
    "habitant-arrive": (d) => "🙋 " + d.qui + " arrive au village (il y a de nouveau à manger)",
    "plein-ecran": (d) => (d.actif ? "⛶ Plein écran" : "🗗 Fin du plein écran"),
    "base-effacee": () => "🗑️ Base de données effacée",
  };

  const emo = (r) => ({ troncs: "🪵 1 tronc", planches: "🟫 1 planche", pierres: "🪨 1 pierre", poissons: "🐟 1 poisson", viande: "🍖 1 morceau de viande" }[r] || r);
  const cout = (c) => Object.entries(c).map(([r, n]) => n + " " + Village.Batiments.NOMS_RESSOURCES[r]).join(" + ") || "gratuit";

  let monde = null, mesures = null, journal, etat, base, cle;
  const debut = performance.now();
  let derniereMaj = 0;

  function initialiser(m, mes) {
    monde = m; mesures = mes;
    journal = document.getElementById("journal");
    etat = document.getElementById("etat");
    base = document.getElementById("base");
    cle = document.getElementById("cle");
    cle.textContent = Village.Sauvegarde.CLE;
    document.getElementById("vider-journal").addEventListener("click", () => (journal.innerHTML = ""));
    document.getElementById("effacer-base").addEventListener("click", () => Village.Sauvegarde.effacer());
  }

  function changerMonde(m) { monde = m; }

  // Le journal écoute TOUTE la radio.
  const enAttente = [];
  Village.Evenements.ecouter("*", (d, nom) => {
    const texte = MESSAGES[nom] ? MESSAGES[nom](d) : "📻 " + nom;
    const temps = (performance.now() - debut) / 1000;
    if (!journal) { enAttente.push([nom, texte, temps]); return; }
    ajouter(nom, texte, temps);
  });

  function ajouter(nom, texte, temps) {
    const li = document.createElement("li");
    li.dataset.evenement = nom;
    li.innerHTML = '<span class="temps">' + virgule(temps, 1) + " s</span> ";
    li.appendChild(document.createTextNode(texte));
    journal.prepend(li);
    while (journal.children.length > 150) journal.lastChild.remove();
  }

  function ligne(nom, valeur) { return "<tr><td>" + nom + "</td><td>" + valeur + "</td></tr>"; }
  function groupe(nom) { return '<tr class="groupe"><th colspan="2">' + nom + "</th></tr>"; }

  function mettreAJour(maintenant) {
    if (journal && enAttente.length) for (const e of enAttente.splice(0)) ajouter(...e);
    if (maintenant - derniereMaj < 100) return; // 10 fois par seconde, c'est assez pour nos yeux
    derniereMaj = maintenant;
    const k = monde.carte, cam = monde.camera, s = monde.souris, P = Village.Peintre.stats;
    let h = "";
    h += groupe("🗺️ La carte");
    h += ligne("graine", k.graine);
    h += ligne("taille", k.colonnes + " × " + k.lignes + " = " + nombre(k.colonnes * k.lignes) + " cases");
    h += ligne("cases d'eau / de terre", nombre(k.compte.eau) + " / " + nombre(k.compte.terre));
    h += ligne("arbres", nombre(k.compte.arbres));
    h += ligne("rochers · montagnes", k.compte.rochers + " · " + k.compte.montagnes);
    h += ligne("filons ⚫ charbon · 🟠 fer · 🟡 or", k.compte.charbon + " · " + k.compte.fer + " · " + k.compte.or);
    h += ligne("place du village", "(" + k.village.colonne + ", " + k.village.ligne + ")");
    const sa = monde.saison;
    if (sa) {
      h += groupe("🗓️ Les saisons (une année = " + Village.CONFIG.saisons.dureeAnnee + " s)");
      h += ligne("horloge de la partie", virgule(monde.horloge, 0) + " s");
      h += ligne("moment dans l'année = horloge % " + Village.CONFIG.saisons.dureeAnnee, virgule(monde.horloge % Village.CONFIG.saisons.dureeAnnee, 0) + " s");
      h += ligne("saison", sa.emoji + " " + sa.nom + " (n° " + sa.numero + ") · année " + sa.annee);
      h += ligne("prochaine saison dans", Math.ceil(sa.reste) + " s");
    }
    h += groupe("🍽️ La nourriture et les habitants");
    h += ligne("🐟 poissons · 🍖 viande", monde.stock.poissons + " · " + monde.stock.viande);
    let affames = 0, habitants = 0;
    for (const b of monde.batiments) if (b.ouvrier) { habitants++; if (b.ouvrier.affame) affames++; }
    for (const p of monde.porteurs) if (!p.parti) { habitants++; if (p.affame) affames++; }
    h += ligne("habitants · affamés · partis", habitants + " · " + affames + " · " + monde.partis);
    h += ligne("repas mangés par minute (environ)", virgule((habitants * 60) / Village.CONFIG.repas.intervalle, 1));
    h += ligne("🦌 cerfs · 🐇 lapins", monde.animaux.filter((a) => a.sorte === "cerf").length + " · " + monde.animaux.filter((a) => a.sorte === "lapin").length);
    h += groupe("📦 Le stock de l'entrepôt");
    h += ligne("🪵 troncs · 🟫 planches · 🪨 pierres", monde.stock.troncs + " · " + monde.stock.planches + " · " + monde.stock.pierres);
    const Po = Village.Porteurs;
    h += ligne("promis (réservés)", Po.promis(monde, "troncs") + " · " + Po.promis(monde, "planches") + " · " + Po.promis(monde, "pierres"));
    h += ligne("libres = stock − promis", Po.disponible(monde, "troncs") + " · " + Po.disponible(monde, "planches") + " · " + Po.disponible(monde, "pierres"));
    h += groupe("🏠 Les bâtiments et leurs ouvriers");
    for (const b of monde.batiments) {
      const T = Village.Batiments.TYPES[b.type];
      let etatB = b.etat === "chantier" ? "chantier " + Math.round(b.progres * 100) + " %" : b.type === "scierie" ? (b.travail ? "scie (" + virgule(b.travail.reste, 1) + " s)" : "attend un tronc") : b.ouvrier ? b.ouvrier.etat + (b.ouvrier.minuteur > 0 ? " " + virgule(b.ouvrier.minuteur, 1) + " s" : "") : "prêt";
      if (b.ouvrier && b.ouvrier.porte) etatB += " · porte des " + b.ouvrier.porte;
      if (b.etat === "chantier") { const m = Village.Batiments.materiaux(b); etatB += " · " + m.arrives + "/" + m.total + " arrivés"; }
      if (b.sortie) etatB += " · " + b.sortie + " devant";
      if (b.ouvrier && b.etat === "pret") etatB += " · faim " + Math.floor(b.ouvrier.faim || 0) + " s" + (b.ouvrier.affame ? " 🍽️" : "");
      else if (b.etat === "pret" && Village.Batiments.TYPES[b.type].metier) etatB += " · 😢 vide";
      h += ligne(T.emoji + " n° " + b.numero + " (" + b.colonne + ", " + b.ligne + ")" + (b.relie ? "" : " 🛤️❌"), etatB);
    }
    h += groupe("🚚 Les porteurs et la file d'attente");
    h += ligne("cases de route · reliées à l'entrepôt", Village.Routes.compter(monde) + " · " + monde.reseau.size);
    for (const p of monde.porteurs) {
      const t = p.travail;
      if (p.parti) { h += ligne("porteur " + p.numero, "😢 parti (trop faim)"); continue; }
      h += ligne("porteur " + p.numero + " · faim " + Math.floor(p.faim || 0) + " s" + (p.affame ? " 🍽️" : ""), p.etat === "attend" ? (p.affame ? "a trop faim pour travailler" : "attend à l'entrepôt") : (p.etat === "aller" ? "va " : "revient ") + (t.sorte === "ramener" ? "(ramener " : "(apporter ") + t.quoi + ")" + (p.porte ? " · porte des " + p.porte : ""));
    }
    h += ligne("papiers dans la file", monde.file.length);
    monde.file.slice(0, 5).forEach((t, n) => {
      h += ligne((n + 1) + ". papier n° " + t.numero, (t.sorte === "ramener" ? "ramener " : "apporter ") + t.quoi + " · " + Village.Batiments.TYPES[t.batiment.type].emoji + " n° " + t.batiment.numero);
    });
    h += ligne("cases réservées", monde.reservees.size);
    h += ligne("pousses qui grandissent", monde.pousses.size);
    h += ligne("cases changées (sauvegardées)", monde.modifs.size);
    h += ligne("en train de construire", monde.construction ? Village.Batiments.TYPES[monde.construction].nom : "non");
    h += groupe("🎥 La caméra");
    h += ligne("regarde le point du monde", "X " + Math.round(cam.x) + " · Y " + Math.round(cam.y));
    h += ligne("zoom", Math.round(cam.zoom * 100) + " %");
    h += ligne("écran (points × densité)", Village.Ecran.largeur + " × " + Village.Ecran.hauteur + " × " + Village.Ecran.densite);
    h += ligne("cases peintes", nombre(P.casesDessinees));
    h += ligne("objets peints", nombre(P.objetsDessines));
    h += groupe("🖱️ La souris");
    if (s) {
      h += ligne("sur l'écran (px)", Math.round(s.ecranX) + " ; " + Math.round(s.ecranY));
      h += ligne("dans le monde (px)", Math.round(s.mondeX) + " ; " + Math.round(s.mondeY));
      h += ligne("dans la grille", virgule(s.colonne, 2) + " ; " + virgule(s.ligne, 2));
    } else h += ligne("souris", "hors de l'écran");
    const c = monde.survol || monde.choisie;
    h += groupe(monde.survol ? "🔎 La case sous la souris" : "📌 La case choisie");
    if (c) {
      h += ligne("colonne, ligne", c.colonne + ", " + c.ligne);
      h += ligne("numéro dans la mémoire", nombre(c.numero));
      h += ligne("terrain", c.terrain + " = " + c.nomTerrain);
      h += ligne("objet", c.objet + " = " + c.nomObjet);
      h += ligne("filon", c.filon + " = " + c.nomFilon);
      h += ligne("altitude · humidité", virgule(c.altitude, 2) + " · " + virgule(c.humidite, 2));
    } else h += ligne("case", "aucune");
    h += groupe("⏱️ La boucle");
    h += ligne("temps de jeu", virgule(monde.temps, 1) + " s");
    h += ligne("images par seconde", mesures.ips);
    h += ligne("pas de calcul par seconde", mesures.majParSeconde);
    h += ligne("temps pour peindre une image", virgule(P.ms, 1) + " ms");
    etat.innerHTML = h;
    base.textContent = JSON.stringify(Village.Sauvegarde.donnees, null, 2);
  }

  return { initialiser, changerMonde, mettreAJour };
})();
