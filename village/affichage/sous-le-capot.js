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
    "chantier-fini": (d) => "🎉 " + d.nom + " n° " + d.numero + " construit(e)" + (d.metier ? " : le " + d.metier + " arrive (s'il a une place pour dormir)" : "") + (d.places ? " · +" + d.places + " places pour dormir" : ""),
    "ouvrier-part": (d) => "🚶 Le " + d.metier + " (n° " + d.numero + ") part vers " + d.quoi + " en (" + d.colonne + ", " + d.ligne + ") : " + d.pas + " pas · la tache d'encre a regardé " + d.visitees + " cases",
    "rien-a-faire": (d) => "😴 " + d.nom + " n° " + d.numero + " : pas de " + d.quoi.replace(/^une? /, "") + " à moins de " + d.rayon + " pas (" + d.visitees + " cases regardées). On réessaie dans " + Village.CONFIG.ouvriers.attente + " s",
    "arbre-coupe": (d) => "🪓 Arbre coupé en (" + d.colonne + ", " + d.ligne + ") · il reste " + nombre(d.arbres) + " arbres sur la carte",
    "pousse-plantee": (d) => "🌱 Pousse plantée en (" + d.colonne + ", " + d.ligne + ") · " + d.pousses + " pousse(s) en train de grandir",
    "arbre-pousse": (d) => "🌳 La pousse en (" + d.colonne + ", " + d.ligne + ") est devenue un " + d.sorte + " · " + nombre(d.arbres) + " arbres sur la carte",
    "pierre-taillee": (d) => "⛏️ Pierre taillée en (" + d.colonne + ", " + d.ligne + ")" + (d.vide ? " · le rocher est vide, il disparaît" : " · il reste " + d.reste + " pierre(s) dans ce rocher"),
    depose: (d) => "📦 " + (d.quantite > 1 ? d.quantite + " " + d.quoi : emo(d.quoi)) + " posé(e)s devant la porte du bâtiment n° " + d.numero + " (" + d.devant + " qui attendent un porteur)",
    // Étape 8 : la scierie, la fonderie et la forge sont des ateliers qui suivent leur recette
    "atelier-attend": (d) => "⏳ " + d.nom + " n° " + d.numero + " : " + d.raison + ", il attend un porteur",
    "fabrication-debut": (d) => "⚙️ " + d.nom + " n° " + d.numero + " commence : utilise " + cout(d.entrees) + " · " + d.duree + " s (réserve : " + (cout(d.reserve) === "gratuit" ? "vide" : cout(d.reserve)) + ")",
    "fabrication-finie": (d) => "✨ " + d.nom + " n° " + d.numero + " : +" + d.quantite + " " + Village.Batiments.NOMS_RESSOURCES[d.quoi] + " devant la porte (" + d.devant + ")",
    // Étape 3
    "choix-outil": (d) => (d.outil === "route" ? "🛤️ Outil route : touche le départ, puis l'arrivée" : d.outil === "demolir" ? "🧹 Outil démolir : touche une route ou un bâtiment" : "↩️ Outil rangé"),
    "route-depart": (d) => "🚩 Départ de la route en (" + d.colonne + ", " + d.ligne + ")",
    "route-construite": (d) => "🛤️ Chemin tracé : " + d.cases + " case(s), dont " + d.nouvelles + " nouvelle(s) → " + (d.cout ? d.cout + " 🪨" : "gratuit (chemin de terre)") + " · " + d.total + " cases de chemin en tout",
    "route-impossible": (d) => "🚫 Route impossible : " + d.raison,
    "route-demolie": (d) => "🧹 Chemin démoli en (" + d.colonne + ", " + d.ligne + ")" + (d.rendu ? " : " + d.rendu + " 🪨 rendue(s)" : ""),
    "batiment-demoli": (d) => "🧹 " + d.nom + " n° " + d.numero + " démoli(e)",
    "demolition-impossible": (d) => "🚫 " + d.raison,
    "batiment-relie": (d) => "✅ " + d.nom + " n° " + d.numero + " est relié(e) à l'entrepôt",
    "batiment-coupe": (d) => "✂️ " + d.nom + " n° " + d.numero + " n'est plus relié(e) à l'entrepôt",
    "ouvrier-bloque": (d) => "🛤️❌ " + d.nom + " n° " + d.numero + " : pas de route jusqu'à l'entrepôt, l'ouvrier ne travaille pas",
    "livraison-demandee": (d) => "📋 Papier n° " + d.numero + " dans la file : " + (d.sorte === "ramener" ? "ramener " + emo(d.quoi) + " de " : "apporter " + emo(d.quoi) + " à ") + d.nom + " n° " + d.batiment + " (" + d.file + " dans la file)",
    "porteur-part": (d) => "🚚 Porteur " + d.porteur + " prend " + (d.nombre > 1 ? d.nombre + " papiers d'un coup (🫏 la charrette)" : "le papier") + " : " + (d.sorte === "ramener" ? "va chercher " + emo(d.quoi) + " chez " : "apporte " + emo(d.quoi) + " à ") + d.nom + " n° " + d.batiment + " (" + d.pas + " pas de route) · encore " + d.file + " dans la file",
    "porteur-livre": (d) => "🤲 Porteur " + d.porteur + " a livré " + emo(d.quoi) + " à " + d.nom + " n° " + d.batiment,
    "arrivee-entrepot": (d) => "🏠 Porteur " + d.porteur + " range " + (d.quantite > 1 ? d.quantite + " " + d.quoi : emo(d.quoi)) + " dans l'entrepôt → " + d.stock + " en stock",
    // Étape 4
    // Étape 13 : les villageois et les améliorations
    "villageois-arrive": (d) => "👥 Un villageois (n° " + d.numero + ") arrive au village : il y a un lit libre et à manger (" + d.habitants + " habitants / " + d.places + " lits)",
    "villageois-envoye": (d) => "🚶 Le villageois n° " + d.numero + " part " + (d.porteur ? "devenir manutentionnaire à l'entrepôt" : "travailler à : " + d.nom + " n° " + d.batiment) + " (" + d.pas + " pas)",
    "villageois-embauche": (d) => "👷 Le villageois n° " + d.numero + " devient " + d.metier + " (" + d.nom + ")",
    "cabane-attend": (d) => "👥 " + d.nom + " n° " + d.numero + " : aucun villageois libre pour y travailler",
    amelioration: (d) => "⬆️ " + d.batiment + " n° " + d.numero + " : " + d.emoji + " " + d.nom + " (amélioration " + d.niveau + ") · son travail est " + d.bonus + " % plus rapide",
    "amelioration-impossible": (d) => "🚫 Amélioration « " + d.nom + " » impossible : " + d.raison,
    // Étape 15 : l'élevage et le bonheur
    "vaches-malades": (d) => "🤒 " + d.nom + " : " + d.animaux + " sont malades" + (d.contagion ? " (attrapé d'un troupeau voisin !)" : "") + " · plus rien ne sort · " + (d.veterinaire ? "le vétérinaire 🩺 va venir" : "pas de vétérinaire : ils guériront seuls en " + Math.round(Village.CONFIG.elevage.guerirSeule / 60) + " min"),
    habits: (d) => "👕 Habits neufs : " + d.pris + " habitant(s) sur " + d.besoin + " (il reste " + d.reste + " vêtements)", // étape 16
    "vaches-gueries": (d) => "💚 " + d.nom + " : " + d.animaux + " sont guéris (" + d.parQui + ", après " + d.duree + " s)",
    "bonheur-change": (d) => d.emoji + " Le village est maintenant " + d.humeur + " (bonheur " + d.valeur + " %) : vitesse × " + String(d.vitesse).replace(".", ",") + " · arrivées × " + String(d.arrivee).replace(".", ","),
    "entrepot-agrandi": (d) => "🏗️ Entrepôt au niveau " + d.niveau + " : " + d.places + " places de manutentionnaire",
    // Étape 11 : le bourg, la réserve et les pubs
    "batiment-use": (d) => "🔧 " + d.nom + " n° " + d.numero + " est complètement usé : son ouvrier va 2 fois moins vite",
    reparation: (d) => "🪜 Le maçon-couvreur a réparé " + d.nom + " n° " + d.numero + " avec 1 🔨 (il était usé à " + d.avant + " %)",
    "macon-attend": (d) => "🪜 Maçon n° " + d.numero + " : pas de 🔨 outil, il attend qu'un porteur lui en apporte",
    // Étape 12 : le placement et le coup de pouce
    "route-apercu": (d) => "👆 Aperçu d'une route de " + d.cases + " case(s) (" + d.facon + ") : ✅ pour construire, ❌ pour effacer",
    "coup-de-pouce": (d) => "🎁 Coup de pouce : " + d.nom + " est offert, car le village n'en a aucun et n'a plus de quoi le payer",
    chauffage: (d) => "🔥 Chauffage : " + d.logements + " logement(s) brûlent " + d.bois + " 🪵 (il reste " + d.reste + " troncs)",
    froid: (d) => "🥶 Pas assez de bois pour chauffer (" + d.bois + " troncs nécessaires, " + d.troncs + " en stock) : tout le monde va 20 % moins vite",
    "plus-froid": () => "🔥 Les logements sont de nouveau chauffés",
    "sans-pain": (d) => "🍞 " + d.qui + " n'a pas eu de pain : il est mécontent (20 % moins vite jusqu'à son prochain repas avec du pain)",
    absence: (d) => "🌙 Absence de " + Math.round(d.secondes / 60) + " min : réserve → " + (Object.entries(d.gains).map(([r, n]) => "+" + n + " " + r).join(", ") || "rien") + (Object.keys(d.pertes).length ? " · mangé : " + Object.entries(d.pertes).map(([r, n]) => n + " " + r).join(", ") : "") + (d.plein ? " · réserve pleine au bout de " + d.minutesPlein + " min" : ""),
    "reserve-agrandie": (d) => "📦 Réserve au niveau " + d.niveau + " : " + d.capacite + " places (payé avec " + (d.avec === "gemmes" ? d.prix.gemmes + " 💎" : "des ressources") + ")",
    "reserve-impossible": (d) => "🚫 Réserve : " + d.raison,
    "pub-proposee": (d) => "📺 Proposition de pub : " + (d.sorte === "ressource" ? d.quantite + " " + d.quoi + " (valeur " + d.valeur + " %)" : d.sorte === "gemmes" ? "1 💎" : "la recherche " + d.nom + " avance de moitié"),
    "pub-lancee": (d) => "📺 La (fausse) pub commence : " + d.duree + " s",
    "pub-regardee": (d) => "🎁 Pub regardée (n° " + d.vues + ", " + d.vuesDuJour + " aujourd'hui) : récompense donnée · la prochaine vaudra " + d.prochaineValeur + " %",
    "pub-refusee": () => "📺 Pub refusée : une autre proposition viendra plus tard",
    "pub-expiree": () => "📺 La proposition de pub a expiré",
    moment: (d) => d.emoji + " " + ({ aube: "L'aube : le jour se lève (jour " + d.jour + ")", jour: "Plein jour", crepuscule: "Le crépuscule : le ciel devient orange", nuit: "La nuit tombe : les fenêtres et les lanternes s'allument" }[d.cle]), // étape 9
    saison: (d) => d.emoji + " Nouvelle saison : " + d.nom + " (année " + d.annee + ")" + (d.hiver ? " · les lacs gèlent, rien ne pousse, aucun animal ne naît" : ""),
    "poisson-peche": (d) => "🎣 " + ({ sardine: "Une sardine pêchée", truite: "Une truite pêchée", thon: "Un thon pêché" }[d.espece] || "Un poisson pêché") + " en (" + d.colonne + ", " + d.ligne + ") : " + d.quantite + " 🐟" + (d.glace ? " · par un trou dans la glace ❄️" : ""),
    "gibier-chasse": (d) => "🏹 " + Village.Animaux.NOMS[d.sorte].emoji + " " + Village.Animaux.NOMS[d.sorte].nom.replace(/^une? /, "") + " chassé en (" + d.colonne + ", " + d.ligne + ") : " + Village.CONFIG.prises[d.sorte] + " 🍖" + (d.neige ? " dans la neige ❄️" : "") + " · il reste " + d.animaux + " animaux",
    "animal-ne": (d) => Village.Animaux.NOMS[d.sorte].emoji + " " + Village.Animaux.NOMS[d.sorte].petit.replace(/^u/, "U") + " est né en (" + d.colonne + ", " + d.ligne + ") · " + d.total + " animaux",
    repas: (d) => "😋 " + d.qui + " mange " + emo(d.quoi) + (d.douceur ? " + " + emo(d.douceur) : "") + " à l'entrepôt (il reste " + d.reste + " repas)", // étape 15 : + une douceur
    affame: (d) => "🍽️ " + d.qui + " a faim et il n'y a rien à manger : il travaille 2 fois moins vite !",
    "plus-faim": (d) => "😊 " + d.qui + " a enfin mangé : il retrouve toute sa vitesse",
    // Étape 7
    "recherche-lancee": (d) => "🎓 Recherche lancée : " + d.emoji + " " + d.nom + " (" + cout(d.cout) + " payés) · " + d.duree + " s",
    "recherche-finie": (d) => "🎓 Recherche finie : " + d.emoji + " " + d.nom + " → " + d.texte + " (" + d.total + " faites)",
    "recherche-impossible": (d) => "🚫 Recherche « " + d.nom + " » impossible : " + d.raison,
    "mission-proposee": (d) => "📜 Nouvelle mission : " + d.emoji + " " + d.qui + " · « " + d.histoire + " »",
    "mission-acceptee": (d) => "📜 Mission acceptée : il faut " + cout(d.demande) + " en " + Math.round(d.duree / 60) + " min",
    "mission-refusee": (d) => "📜 Mission remise à plus tard (" + d.qui + ")",
    "mission-pas-assez": (d) => "📜 Pas encore assez pour " + d.qui,
    "mission-reussie": (d) => "🎉 Mission réussie pour " + d.qui + " ! Récompense : " + Object.entries(d.recompense).map(([r, n]) => n + " " + (r === "gemmes" ? "💎" : r === "pieces" ? "🪙" : r)).join(", ") + " · " + d.gemmes + " 💎 et " + d.pieces + " 🪙 en tout",
    "mission-ratee": (d) => "⌛ Mission ratée : le temps est écoulé (" + d.qui + "). Rien de grave !",
    achat: (d) => "💎 Achat : " + d.emoji + " " + d.nom + " pour " + d.prix + " 💎 (il en reste " + d.gemmes + ")",
    "achat-impossible": (d) => "🚫 Achat impossible (" + d.nom + ") : " + d.raison,
    "minerai-extrait": (d) => "⛏️ " + d.nom + " n° " + d.numero + " : +1 " + Village.Batiments.NOMS_RESSOURCES[d.quoi] + " · il reste " + d.reste + " dans le filon · " + d.devant + " devant la porte",
    "filon-epuise": (d) => "⛏️ " + d.nom + " n° " + d.numero + " : plus de " + d.minerai + " dans les filons voisins",
    "filon-trouve": (d) => "🔍 Filon de " + d.nom + " " + d.emoji + " trouvé près de (" + d.colonne + ", " + d.ligne + ") : " + d.reserve + " morceaux",
    // Étape 8 : le logement et le marché
    "pas-de-logement": (d) => "🛏️ " + d.nom + " n° " + d.numero + " : pas de place pour loger le " + d.metier + " (" + d.places + " places, toutes prises). Il faut une hutte ou une maison",
    "marche-vente": (d) => "🏪 Vente : " + d.quantite + " " + Village.Batiments.NOMS_RESSOURCES[d.quoi] + " = +" + d.gain + " 🪙 · le paquet suivant se vend " + d.nouveauPrix + " 🪙 · tu as " + d.pieces + " 🪙",
    "marche-achat": (d) => "🏪 Achat : " + d.quantite + " " + Village.Batiments.NOMS_RESSOURCES[d.quoi] + " = −" + d.depense + " 🪙 · le paquet suivant coûte " + d.nouveauPrix + " 🪙 · il te reste " + d.pieces + " 🪙",
    "marche-impossible": (d) => "🚫 Marché (" + (d.sens === "vendre" ? "vendre " : "acheter ") + d.quoi + ") : " + d.raison,
    // Étape 6
    "nouvel-age": (d) => "🎉 " + d.emoji + " NOUVEL ÂGE : " + d.nom + " (n° " + d.numero + ")" + (d.debloque.length ? " · débloqué : " + d.debloque.join(", ") : "") + (d.gemmes ? " · +" + d.gemmes + " 💎" : ""),
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
    "confirmer-nouvelle-carte": () => "⚠️ Nouvelle carte ? Ta partie sera perdue. Appuie encore une fois dans les 4 secondes pour confirmer",
    "copie-demandee": () => "📋 Copie de secours de ta partie : garde ce texte dans une note",
    "partie-importee": (d) => "📥 Partie chargée (carte n° " + d.graine + ", version " + d.version + ") : la page va se recharger",
  };

  const emo = (r) => ({ troncs: "🪵 1 tronc", planches: "🟫 1 planche", pierres: "🪨 1 pierre", poissons: "🐟 1 poisson", viande: "🍖 1 morceau de viande", charbon: "⚫ 1 charbon", fer: "🟤 1 minerai de fer", lingots: "🔩 1 lingot", outils: "🔨 1 outil", pain: "🍞 du pain", lait: "🥛 du lait", beurre: "🧈 du beurre", fromage: "🧀 du fromage", yaourt: "🍶 un yaourt", oeufs: "🥚 un œuf", jambon: "🥓 du jambon" }[r] || r);
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
    // Étape 7 : effacer demande une confirmation (2 clics), et on peut copier ou recharger sa partie.
    const effacer = document.getElementById("effacer-base");
    let confirmer = 0;
    effacer.addEventListener("click", () => {
      if (performance.now() > confirmer) { confirmer = performance.now() + 4000; effacer.textContent = "Sûr ? Clique encore"; setTimeout(() => (effacer.textContent = "Effacer"), 4000); return; }
      confirmer = 0; effacer.textContent = "Effacer";
      Village.Sauvegarde.effacer();
    });
    const copier = document.getElementById("copier-partie"), charger = document.getElementById("charger-partie"), zone = document.getElementById("zone-partie");
    if (copier) copier.addEventListener("click", async () => {
      Village.Evenements.emettre("copie-demandee");
      zone.hidden = false; zone.value = Village.Sauvegarde.exporter(); zone.select();
      try { await navigator.clipboard.writeText(zone.value); copier.textContent = "✅ Copiée !"; } catch (e) { copier.textContent = "Sélectionne le texte et copie-le"; }
      setTimeout(() => (copier.textContent = "📋 Copier ma partie"), 3000);
    });
    if (charger) charger.addEventListener("click", () => {
      if (zone.hidden || !zone.value.trim()) { zone.hidden = false; zone.value = ""; zone.placeholder = "Colle ici le texte de ta partie, puis clique encore sur « Charger »"; zone.focus(); return; }
      const erreur = Village.Sauvegarde.importer(zone.value.trim());
      if (erreur) { charger.textContent = "❌ " + erreur; setTimeout(() => (charger.textContent = "📥 Charger une partie"), 4000); return; }
      location.reload();
    });
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
    const ag = Village.Ages.actuel(monde), objs = Village.Ages.objectifs(monde);
    h += groupe("⏳ L'âge du village");
    h += ligne("âge", ag.emoji + " " + ag.nom + " (n° " + (monde.age || 0) + ")");
    for (const o of objs || []) h += ligne((o.fait ? "✅ " : "⬜ ") + o.texte, Math.min(o.valeur, o.cible) + " / " + o.cible);
    // Étape 7
    h += groupe("🎓 Recherches · 📜 missions · 💎 gemmes");
    h += ligne("💎 gemmes", monde.gemmes);
    h += ligne("recherches faites", monde.recherches.faites.length ? monde.recherches.faites.join(", ") : "aucune");
    const rc = monde.recherches.enCours;
    h += ligne("recherche en cours", rc ? rc.id + " · encore " + Math.ceil(rc.reste) + " s" : "aucune");
    for (const cle of ["couper", "planter", "pecher", "chasser", "tailler", "miner", "porteurs", "repas", "scier", "fondre", "forger", "vente", "traire", "baratter", "affiner", "puiser", "faner", "soigner", "maladie", "pondre", "tondre", "engraisser", "tisser", "coudre", "fumer"]) { const x = Village.Recherches.bonus(monde, cle); if (x !== 1) h += ligne("bonus « " + cle + " »", "× " + virgule(x, 2)); }
    const mi = monde.missions.actuelle;
    h += ligne("mission", mi ? mi.id + " · " + mi.etat + (mi.etat === "encours" ? " · encore " + Math.ceil(mi.reste) + " s" : "") : "prochaine dans " + Math.ceil(monde.missions.attente) + " s");
    h += ligne("missions réussies", monde.missions.reussies.length);
    // Étape 13 : les villageois et l'entrepôt
    h += groupe("👥 Les villageois · 🏗️ l'entrepôt");
    const Vi13 = monde.villageois;
    h += ligne("habitants = ouvriers + porteurs + villageois", Village.Logement.habitants(monde) + " = " + monde.batiments.filter((b) => b.ouvrier).length + " + " + monde.porteurs.length + " + " + Vi13.length + " (lits : " + Village.Logement.capacite(monde) + ")");
    h += ligne("villageois : se promènent · vont au travail", Vi13.filter((v) => v.etat !== "travail").length + " · " + Vi13.filter((v) => v.etat === "travail").length);
    h += ligne("cabanes vides (qui attendent quelqu'un)", monde.batiments.filter((b) => b.etat === "pret" && Village.Batiments.TYPES[b.type].metier && !b.ouvrier).length);
    h += ligne("entrepôt : niveau · places de porteur", Village.Ameliorations.niveau(monde) + " · " + Village.Ameliorations.placesPorteurs(monde) + (monde.porteursBonus ? " (dont " + monde.porteursBonus + " achetées)" : ""));
    h += ligne("vitesse des porteurs (écurie)", "× " + virgule(Village.Ameliorations.vitessePorteurs(monde), 2));
    // Étape 15 : le bonheur et l'élevage
    const Bh = Village.Bonheur, note = Bh.calculer(monde), C15 = Village.CONFIG;
    h += groupe("😊 Le bonheur · 🐄 l'élevage");
    h += ligne("bonheur : jauge → note", virgule(monde.bonheur.valeur || 0, 1) + " → " + virgule(note.total, 1) + " (" + Bh.emoji(monde) + " " + Bh.humeur(monde) + ")");
    for (const p of note.parts) h += ligne("   " + p.nom, (p.points >= 0 ? "+" : "") + virgule(p.points, 1) + (p.max ? " / " + p.max : ""));
    h += ligne("effet : vitesse · arrivées", "× " + virgule(Bh.vitesse(monde), 2) + " · × " + virgule(Bh.arrivee(monde), 1));
    h += ligne("🥛 lait · 🧈 beurre · 🧀 fromage · 🍶 yaourt", monde.stock.lait + " · " + monde.stock.beurre + " · " + monde.stock.fromage + " · " + monde.stock.yaourt);
    h += ligne("🥚 œufs · 🧶 laine · 🧵 tissu · 👕 vêtements · 🥓 jambon", monde.stock.oeufs + " · " + monde.stock.laine + " · " + monde.stock.tissu + " · " + monde.stock.vetements + " · " + monde.stock.jambon); // étape 16
    if ((monde.age || 0) >= C15.habits.age) h += ligne("👕 prochains habits neufs dans", Math.ceil(monde.habits.minuteur) + " s");
    h += ligne("💧 eau · 🌿 foin", monde.stock.eau + " · " + monde.stock.foin);
    const Et = Village.Elevage.etables(monde);
    h += ligne("🐄 troupeaux · malades", Et.length + " · " + Et.filter((b) => b.malade).length + ((monde.age || 0) < C15.elevage.ageMaladies ? " (pas de maladies avant le village)" : ""));
    for (const b of Et.slice(0, 6)) { const r = Village.Elevage.risque(monde, b); h += ligne("   " + Village.Batiments.TYPES[b.type].court + " n° " + b.numero, b.malade ? "🤒 malade depuis " + Math.round(b.malade.depuis) + " s" : "risque " + virgule(r.chance * 100, 1) + " %/min" + (Village.Elevage.affaiblies(b) ? " (affaiblies !)" : "") + (r.voisines ? " · " + r.voisines + " voisine(s) malade(s)" : "")); }
    // Étape 11 : la réserve, les pubs et les règles du bourg
    const Re = Village.Reserve, ry = Re.rythme(monde), mnp = Re.minutesAvantPlein(monde);
    h += groupe("📦 La réserve · 📺 les pubs · 🏰 le bourg");
    h += ligne("réserve : niveau · places", Re.niveau(monde) + " · " + Re.capacite(monde));
    h += ligne("rythme du village (par minute)", Object.entries(ry).map(([r, n]) => (n > 0 ? "+" : "") + virgule(n, 1) + " " + (Village.CONFIG.ressources[r] || {}).emoji).join(" ") || "pas encore mesuré");
    h += ligne("pleine au bout de (si tu pars)", mnp === Infinity ? "—" : Math.round(mnp) + " min");
    const po = monde.pub.offre;
    h += ligne("pub", po ? po.etat + " · encore " + Math.ceil(po.reste) + " s" : "prochaine proposition dans " + Math.ceil(monde.pub.attente) + " s");
    h += ligne("pubs regardées (en tout · aujourd'hui)", monde.pub.vues + " · " + monde.pub.vuesDuJour + " → valeur " + Math.round(Village.Publicite.valeur(monde) * 100) + " %");
    h += ligne("🥶 froid · bois de chauffage", (monde.froid ? "oui" : "non") + (monde.saison && monde.saison.hiver && (monde.age || 0) >= 3 ? " · prochain dans " + Math.ceil(Village.CONFIG.bourg.chauffage - (monde.chauffage || 0)) + " s" : ""));
    h += ligne("🔧 bâtiments usés (≥ 100 %) · à réparer (≥ 60 %)", monde.batiments.filter((b) => b.usure >= 1).length + " · " + monde.batiments.filter((b) => b.usure >= Village.CONFIG.bourg.reparer).length);
    // Étape 9 : le jour et la nuit, et les figurants
    const mo = monde.moment, Vi = Village.Vie.stats;
    if (mo) {
      h += groupe("🌗 Le jour et la nuit (une journée = " + Village.CONFIG.jour.duree + " s)");
      h += ligne("part de la journée = (horloge % " + Village.CONFIG.jour.duree + ") ÷ " + Village.CONFIG.jour.duree, virgule(mo.part, 2) + " · vers " + mo.heure + " h");
      h += ligne("moment", mo.emoji + " " + mo.nom + " · jour n° " + mo.jour);
      h += ligne("noirceur (0 = plein jour, 1 = minuit)", virgule(mo.noirceur, 2));
      h += ligne("lumières allumées", P.lumieres);
      h += ligne("🐔 poules · 🧒 enfants · 🐦 oiseaux", Vi.poules + " · " + Vi.enfants + " · " + Vi.oiseaux);
      h += ligne("🦋 papillons · ✨ lucioles", Vi.papillons + " · " + Vi.lucioles);
      h += ligne("détails fins (zoom ≥ " + Math.round(Village.CONFIG.detail.zoomFin * 100) + " %)", Village.Batisses.vue.fin ? "oui" : "non (pour aller plus vite)");
      h += ligne("🧑 bonshommes peints (étape 10)", Village.Batisses.vue.dernierCompte + (Village.Batisses.vue.fin ? " · avec leur visage" : " · sans visage (de loin)"));
      h += ligne("🫏 objets par voyage (charrette)", Math.round(Village.Recherches.bonus(monde, "chargement")));
    }
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
    for (const [sorte, n] of Object.entries(Village.Animaux.NOMS)) h += ligne(n.emoji + " " + n.nom.replace(/^une? /, "") + "s (" + Village.CONFIG.prises[sorte] + " 🍖 chacun)", monde.animaux.filter((a) => a.sorte === sorte).length);
    // Étape 8
    const Lg = Village.Logement;
    h += groupe("🛏️ Le logement");
    h += ligne("places = " + Village.CONFIG.logement.entrepot + " (campement) + huttes × 3 + maisons × 6" + (monde.logementBonus ? " + " + monde.logementBonus + " offertes" : ""), Lg.capacite(monde));
    h += ligne("habitants (ouvriers logés)", Lg.habitants(monde));
    h += ligne("place libre ?", Lg.placeLibre(monde) ? "oui" : "non : les cabanes vides attendent");
    h += groupe("🏪 Le marché · 🪙 " + monde.pieces + " pièces");
    const Ma = Village.Marche;
    for (const r of Object.keys(Village.CONFIG.marche.prix)) {
      const f = Ma.facteur(monde, r);
      if (f !== 1) h += ligne(Village.Batiments.NOMS_RESSOURCES[r] + " · facteur " + virgule(f, 2), "vente " + Ma.prixVente(monde, r) + " 🪙 · achat " + Ma.prixAchat(monde, r) + " 🪙");
    }
    h += ligne("ventes · achats depuis le début", monde.marche.ventes + " 🪙 · " + monde.marche.achats + " 🪙");
    h += groupe("📊 Le compteur de l'entrepôt (par minute)");
    h += ligne("pages gardées (10 s chacune)", monde.stats.pages.length + " / " + Village.CONFIG.statistiques.tranches);
    for (const r of Object.keys(Village.CONFIG.ressources)) {
      const m = Village.Statistiques.parMinute(monde, r);
      if (m.entrees || m.sorties) h += ligne(Village.Batiments.NOMS_RESSOURCES[r], "+" + virgule(m.entrees, 1) + " · −" + virgule(m.sorties, 1) + " = " + (m.net >= 0 ? "+" : "") + virgule(m.net, 1));
    }
    h += groupe("📦 Le stock de l'entrepôt");
    h += ligne("⚫ charbon · 🟤 fer · 🔩 lingots · 🔨 outils", monde.stock.charbon + " · " + monde.stock.fer + " · " + monde.stock.lingots + " · " + monde.stock.outils);
    h += ligne("🪵 troncs · 🟫 planches · 🪨 pierres", monde.stock.troncs + " · " + monde.stock.planches + " · " + monde.stock.pierres);
    const Po = Village.Porteurs;
    h += ligne("promis (réservés)", Po.promis(monde, "troncs") + " · " + Po.promis(monde, "planches") + " · " + Po.promis(monde, "pierres"));
    h += ligne("libres = stock − promis", Po.disponible(monde, "troncs") + " · " + Po.disponible(monde, "planches") + " · " + Po.disponible(monde, "pierres"));
    h += groupe("🏠 Les bâtiments et leurs ouvriers");
    for (const b of monde.batiments) {
      const T = Village.Batiments.TYPES[b.type];
      let etatB = b.etat === "chantier" ? "chantier " + Math.round(b.progres * 100) + " %" : Village.CONFIG.ateliers[b.type] ? (b.travail ? "fabrique (" + virgule(b.travail.reste, 1) + " s)" : b.attend || "prêt") + " · réserve " + JSON.stringify(b.entrees) : Village.CONFIG.mines[b.type] ? (b.epuise ? "filon épuisé" : b.travail ? "creuse (" + virgule(b.travail.reste, 1) + " s)" : "prêt") : b.ouvrier ? b.ouvrier.etat + (b.ouvrier.minuteur > 0 ? " " + virgule(b.ouvrier.minuteur, 1) + " s" : "") : "prêt";
      if (b.ouvrier && b.ouvrier.porte) etatB += " · porte des " + b.ouvrier.porte;
      if (b.usure > 0) etatB += " · usure " + Math.round(b.usure * 100) + " %"; // étape 11
      if (b.ameliorations) etatB += " · " + "★".repeat(b.ameliorations) + " × " + virgule(Village.Ameliorations.bonus(b), 2); // étape 13
      if (b.etat === "chantier") { const m = Village.Batiments.materiaux(b); etatB += " · " + m.arrives + "/" + m.total + " arrivés"; }
      if (b.sortie) etatB += " · " + b.sortie + " devant";
      if (b.ouvrier && b.etat === "pret") etatB += " · faim " + Math.floor(b.ouvrier.faim || 0) + " s" + (b.ouvrier.affame ? " 🍽️" : "");
      else if (b.etat === "pret" && Village.Batiments.TYPES[b.type].metier) etatB += Lg.placeLibre(monde) ? " · 😢 vide" : " · 🛏️ vide : pas de logement";
      if (Village.CONFIG.logement[b.type] && b.type !== "entrepot" && b.etat === "pret") etatB = "🛏️ " + Village.CONFIG.logement[b.type] + " places";
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
