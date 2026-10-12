// 🔧 SOUS LE CAPOT : le tableau de bord du développeur
//
// Ce panneau n'existe pas dans un jeu du commerce : c'est un outil pour COMPRENDRE. Trois colonnes :
//   📊 l'état en direct : les nombres que le jeu calcule en ce moment (habitants, demande R C I A et sa formule,
//      réseaux, trafic, ce que fait le jardinier des zones, et le trésorier ligne par ligne…) ;
//   📻 le journal : tout ce qui est annoncé à la radio du jeu (chaque événement a sa phrase) ;
//   💾 la base de données : ce qui est rangé dans le navigateur, et la taille que ça prend.

window.Megalopole = window.Megalopole || {};

Megalopole.SousLeCapot = (function () {
  const C = Megalopole.CONFIG;
  const radio = Megalopole.Evenements;
  const fr = (n) => Math.round(n).toLocaleString("fr-FR");
  const virgule = (n, k) => n.toFixed(k).replace(".", ",");
  let monde = null, mesures = null;

  // Chaque événement de la radio, et la phrase qui l'explique
  const PHRASES = {
    "route-construite": (d) => "🛣️ " + d.sorte + " : " + d.cases + " case(s) construite(s)" + (d.ponts ? " dont " + d.ponts + " pont(s)" : "") + " · −" + fr(d.prix) + " 🪙 · il reste " + fr(d.argent) + " 🪙",
    "zone-peinte": (d) => d.emoji + " Zone " + d.zone.toLowerCase() + " peinte sur " + d.cases + " case(s) · −" + fr(d.prix) + " 🪙",
    "zone-effacee": (d) => "🧽 Zone effacée sur " + d.cases + " case(s)",
    "batiment-pose": (d) => d.emoji + " " + d.nom + " posé(e) en (" + d.colonne + ", " + d.ligne + ") · −" + fr(d.prix) + " 🪙 · il reste " + fr(d.argent) + " 🪙",
    "batiment-demoli": (d) => "🧨 " + d.nom + " démoli(e)",
    "demolition": (d) => "🧨 Démolition de " + d.cases + " case(s) · −" + fr(d.prix) + " 🪙",
    "construction-impossible": (d) => "🚫 " + d.nom + " : " + d.raison,
    "pas-assez": (d) => "🪙 Pas assez d'argent pour " + d.quoi + " (" + fr(d.prix) + " 🪙 ; tu as " + fr(d.argent) + " 🪙)",
    "batiment-grandit": (d) => "📈 (" + d.colonne + ", " + d.ligne + ") " + d.emoji + " " + d.avant + " → " + d.apres + " (niveau " + d.niveau + ")",
    "batiment-baisse": (d) => "📉 (" + d.colonne + ", " + d.ligne + ") " + d.emoji + " " + d.avant + " → " + d.apres + " : " + (d.raison || "les gens partent"),
    "nouveau-palier": (d) => "🎉 " + d.emoji + " La ville devient un(e) " + d.nom + " (" + fr(d.habitants) + " habitants) · les bâtiments montent jusqu'au niveau " + d.niveauMax + (d.nouveaux.length ? " · débloqués : " + d.nouveaux.join(", ") : ""),
    "courant-penurie": (d) => "⚡❌ Pénurie d'électricité : offre " + fr(d.offre) + " < demande " + fr(d.demande) + " · " + d.coupes + " bâtiment(s) coupé(s) (les plus loin des centrales)",
    "courant-ok": (d) => "⚡✅ Assez d'électricité : offre " + fr(d.offre) + ", demande " + fr(d.demande),
    "dechets-penurie": (d) => "🗑️❌ Ramassage insuffisant : place " + fr(d.offre) + " < déchets " + fr(d.demande) + " · " + d.coupes + " bâtiment(s) pas ramassé(s)",
    "dechets-ok": (d) => "🗑️✅ Toutes les poubelles sont ramassées : place " + fr(d.offre) + ", déchets " + fr(d.demande),
    "decharge-pleine": (d) => "🗑️⛔ La décharge en (" + d.colonne + ", " + d.ligne + ") est pleine (" + fr(d.contenance) + ") : elle ne prend plus rien",
    "decharge-presque-pleine": (d) => "🗑️⚠️ La décharge en (" + d.colonne + ", " + d.ligne + ") est pleine à " + d.pourcent + " %",
    "eau-penurie": (d) => "💧❌ Pénurie d'eau : offre " + fr(d.offre) + " < demande " + fr(d.demande) + " · " + d.coupes + " bâtiment(s) sans eau",
    "eau-ok": (d) => "💧✅ Assez d'eau : offre " + fr(d.offre) + ", demande " + fr(d.demande),
    "reclamation": (d) => "📢 Réclamation n° 1 des habitants : " + d.emoji + " " + d.texte + " → " + d.conseil,
    "budget-mois": (d) => "🧾 Mois " + d.mois + " : recettes +" + fr(d.recettes) + " (impôts 🏠 " + fr(d.impots.R) + " · 🛍️ " + fr(d.impots.C) + " · 🏭 " + fr(d.impots.I) + " · 🌾 " + fr(d.impots.A) + "), dépenses −" + fr(d.depenses) + " (dont carburant " + fr(d.carburant) + ", prêts " + fr(d.prets) + ") = " + (d.solde >= 0 ? "+" : "") + fr(d.solde) + " 🪙 · caisse : " + fr(d.argent) + " 🪙",
    "impots-changes": (d) => "🧾 Impôts " + d.emoji + " " + d.zone.toLowerCase() + " : " + d.taux + " % → envie de venir " + (d.effet >= 0 ? "+" : "") + virgule(d.effet, 2),
    "budget-poste": (d) => "🧾 Budget « " + d.poste + " » : " + d.budget + " % (entretien × " + virgule(d.budget / 100, 1) + ")",
    "pret": (d) => "🏦 Prêt de " + fr(d.montant) + " 🪙 : " + d.mois + " mensualités de " + fr(d.mensualite) + " 🪙 (total " + fr(d.total) + " 🪙) · caisse : " + fr(d.argent) + " 🪙",
    "pret-refuse": (d) => "🏦❌ Prêt de " + fr(d.montant) + " 🪙 refusé : " + d.raison,
    "pret-rembourse": (d) => "🏦✅ Prêt de " + fr(d.montant) + " 🪙 entièrement remboursé",
    "routes-abimees": (d) => "🛣️⚠️ Routes abîmées (" + d.etat + " %) : moins de voitures passent, le terrain perd de la valeur",
    "caisse-vide": (d) => "🧾⚠️ Caisse sous zéro (" + fr(d.argent) + " 🪙) depuis " + d.mois + " mois · renvoi du maire dans " + d.reste + " mois",
    "batiment-souleve": (d) => "📦 " + d.emoji + " " + d.nom + " soulevé(e) en (" + d.colonne + ", " + d.ligne + ") : il quitte la carte en attendant sa nouvelle place",
    "batiment-ameliore": (d) => "⭐ " + d.emoji + " " + d.nom + " amélioré(e) : ★" + d.etoiles + " → production / places × " + virgule(d.facteur, 1) + " · −" + fr(d.prix) + " 🪙 · il reste " + fr(d.argent) + " 🪙", // étape 17
    "recherche-commencee": (d) => "🔬 Recherche lancée : " + d.emoji + " " + d.nom + " (" + d.duree + " s de jeu) · −" + fr(d.prix) + " 🪙",
    "recherche-finie": (d) => "🔬✅ Recherche trouvée : " + d.emoji + " " + d.nom + " → " + d.texte,
    "batiment-deplace": (d) => "📦✅ " + d.emoji + " " + d.nom + " déplacé(e) : (" + d.de.colonne + ", " + d.de.ligne + ") → (" + d.vers.colonne + ", " + d.vers.ligne + ") · gratuit",
    "deplacement-annule": (d) => "📦↩️ " + d.emoji + " " + d.nom + " remis(e) à sa place",
    "deplacement-impossible": (d) => "📦🚫 Déplacement impossible : " + d.raison,
    "mission-reussie": (d) => "🎓✅ Guide : mission " + d.numero + " / " + d.total + " réussie (" + d.emoji + " " + d.titre + ") → la suivante",
    "mission-passee": (d) => "🎓⏭️ Guide : mission " + d.numero + " / " + d.total + " passée (" + d.emoji + " " + d.titre + ")",
    "guide-fini": (d) => "🎓🎉 Guide terminé : les " + d.missions + " missions sont faites",
    "maire-renvoye": (d) => "🧾❌ " + d.mois + " mois dans le rouge (" + fr(d.argent) + " 🪙) : le conseil municipal renvoie le maire. Fin de la partie.",
    "sauvegarde": (d) => "💾 Sauvegarde (" + d.raison + ") : " + fr(d.taille) + " lettres",
    "sauvegarde-ratee": (d) => "💾❌ La sauvegarde a raté : " + d.erreur,
    "lecture": (d) => (d.trouve ? "💾 Partie retrouvée (version " + d.version + ", carte n° " + d.graine + ", " + fr(d.taille) + " lettres)" : "💾 Pas de partie lisible : " + (d.erreur || "")),
    "nouvelle-ville": (d) => "🆕 Nouvelle ville sur la carte n° " + d.graine + (d.difficulte ? " · difficulté : " + d.difficulte : ""),
  };

  function initialiser(m, mes) {
    monde = m; mesures = mes;
    radio.ecouter("*", (d, nom) => journal(PHRASES[nom] ? PHRASES[nom](d) : "📻 " + nom));
    document.getElementById("vider-journal").addEventListener("click", () => (document.getElementById("journal").innerHTML = ""));
    document.getElementById("effacer-base").addEventListener("click", () => { if (confirm("Effacer la ville sauvegardée ?")) { Megalopole.Sauvegarde.effacer(); location.reload(); } });
  }
  const changerMonde = (m) => (monde = m);

  function journal(texte) {
    const ul = document.getElementById("journal");
    if (!ul) return;
    const li = document.createElement("li");
    const h = new Date();
    li.textContent = String(h.getHours()).padStart(2, "0") + ":" + String(h.getMinutes()).padStart(2, "0") + ":" + String(h.getSeconds()).padStart(2, "0") + "  " + texte;
    ul.prepend(li);
    while (ul.children.length > 80) ul.lastChild.remove();
  }

  let dernier = 0, visible = true;
  function mettreAJour(maintenant) {
    if (maintenant - dernier < 250 || !visible) return;
    dernier = maintenant;
    const m = monde, s = m.stats, D = C.demande, P = Megalopole.Peintre.stats;
    const ligne = (a, b) => "<tr><td>" + a + "</td><td>" + b + "</td></tr>", groupe = (t) => "<tr><th colspan='2'>" + t + "</th></tr>";
    let h = "<table>";
    h += groupe("👥 La population et les emplois");
    h += ligne("habitants · actifs (× " + virgule(D.actifs, 2) + ") · emplois · chômeurs", fr(s.habitants) + " · " + fr(s.actifs) + " · " + fr(s.emplois) + " · " + fr(s.chomeurs));
    h += ligne("emplois : 🛍️ commerce · 🏭 industrie · 🌾 agriculture", fr(s.commerce) + " · " + fr(s.industrie) + " · " + fr(s.agriculture));
    h += ligne("palier · niveau max des bâtiments", C.paliers[m.palier].emoji + " " + C.paliers[m.palier].nom + " · " + C.paliers[m.palier].niveauMax);
    h += ligne("😊 bonheur", m.bonheur + " %");
    if (m.bilan) h += ligne("📊 bilan (menu 📊) : habitants nourris (🌾 × 22) · servis en biens fabriqués (🏭 × 7) · vendus (🛍️ × 9)", fr(m.bilan.nourris) + " · " + fr(m.bilan.fabriques) + " · " + fr(m.bilan.vendus) + " / " + fr(m.bilan.habitants)); // étape 8
    h += groupe("📈 La demande R C I A (de −1 à +1)");
    h += ligne("🏠 R = (emplois × " + virgule(D.attirance, 2) + " − actifs + " + D.base.R + ") ÷ actifs × (0,5 + bonheur)", virgule(m.demande.R, 2));
    h += ligne("🛍️ C = (habitants × " + virgule(D.commerceParHabitant, 2) + " − emplois C + " + D.base.C + ") ÷ besoin", virgule(m.demande.C, 2));
    h += ligne("🏭 I = (habitants × " + virgule(D.industrieParHabitant, 2) + " − emplois I + " + D.base.I + ") ÷ besoin", virgule(m.demande.I, 2));
    h += ligne("🌾 A = (habitants × " + virgule(D.agricultureParHabitant, 2) + " − emplois A + " + D.base.A + ") ÷ besoin", virgule(m.demande.A, 2));
    const Bu = C.budget, Bd = Megalopole.Budget;
    h += ligne("🧾 effet des impôts : au-dessus de " + Bu.tauxNeutre + " % −" + virgule(Bu.malusParPoint, 2) + "/point, en dessous +" + virgule(Bu.bonusParPoint, 2) + "/point", C.ordreZones.map((z) => C.zones[z].emoji + " " + (Bd.effetTaux(m.taux[z]) >= 0 ? "+" : "") + virgule(Bd.effetTaux(m.taux[z]), 2)).join(" "));
    h += groupe("😊 Les besoins (de 0 à 1)");
    for (const x of C.besoins) h += ligne(x.emoji + " " + x.nom + " (poids " + virgule(x.poids, 1) + ")" + ((x.palier || 0) > m.palier ? " 🔒" : ""), virgule(m.besoins[x.id] || 0, 2));
    h += groupe("🔌 Les réseaux (ils suivent les routes, les plus proches d'abord)");
    for (const [q, e] of [["⚡ électricité", m.reseaux.courant], ["💧 eau", m.reseaux.eau]]) h += ligne(q + " : utilisé / offre · demande · coupés · loin du réseau", fr(e.utilise || 0) + " / " + fr(e.offre || 0) + " · " + fr(e.demande || 0) + " · " + (e.coupes || 0) + " · " + (e.horsReseau || 0));
    { const d = m.reseaux.dechets || {}, ep = m.reseaux.epuration || {}; // étape 11
      h += ligne("🗑️ déchets : traités / place · jetés · pas ramassés · recyclés", fr(d.utilise || 0) + " / " + fr(d.offre || 0) + " · " + fr(d.demande || 0) + " · " + (d.coupes || 0) + " · " + Math.round((d.recycle || 0) * 100) + " %");
      const dech = m.batiments.filter((b) => C.batiments[b.type].contenance); if (dech.length) h += ligne("🗑️ décharges : remplies (chaque mois + ce qu'elles reçoivent)", dech.map((b) => Math.round(100 * (b.rempli || 0) / C.batiments[b.type].contenance) + " %").join(" · "));
      h += ligne("🚽 eaux usées : nettoyées / utilisées (le bord de l'eau perd de la valeur si c'est sale)", fr(ep.capacite || 0) + " / " + fr(ep.eauxUsees || 0) + " · " + Math.round((ep.ratio || 0) * 100) + " %"); }
    h += ligne("💧 étape 9 : eau NÉCESSAIRE (niveau ≥ 2) · petites maisons non servies (elles ont un puits) · reste pour grandir", fr(m.reseaux.eau.demandeBesoin || 0) + " · " + (m.reseaux.eau.coupesSansBesoin || 0) + " · " + fr(m.reseaux.eau.reste || 0));
    h += ligne("🌬️ vent · ☀️ soleil · 🕐 heure du jour", virgule(Megalopole.Reseaux.vent(m), 2) + " · " + virgule(Megalopole.Reseaux.soleil(m), 2) + " · " + Math.floor(Megalopole.Reseaux.heure(m) * 24) + " h");
    const T = m.statsTrafic || { routes: 0, bouchons: 0, moyen: 0 };
    h += groupe("🚗 Le trafic et la ville");
    h += ligne("cases de route · bouchons (trafic > 100 %) · trafic moyen", T.routes + " · " + T.bouchons + " · " + Math.round(T.moyen * 100) + " %");
    h += ligne("terrains peints · gros bâtiments", fr(m.zonees.length) + " · " + m.batiments.length);
    { const Q = C.croissance.quartier; h += ligne("🏘️ étape 15 : bonus de quartier moyen = niveau moyen des voisins (" + Q.rayon + " cases) × " + virgule(Q.parNiveau, 2) + " + services × " + virgule(Q.parService, 2) + " (≤ " + virgule(Q.maxServices, 1) + "), au plus +" + virgule(Q.max, 1), "+" + virgule(m.quartierMoyen || 0, 2)); }
    { const Vb = C.valeur; let n = 0, q = 0, v = 0; for (const i of m.zonees) if (m.zone[i] === C.zones.R.id && m.niveau[i]) { n++; v += m.valeur[i]; q += m.quartierValeur ? m.quartierValeur[i] : 0; } // étape 18
      h += ligne("💎 étape 18 : valeur d'une habitation = " + virgule(Vb.base, 2) + " + services reçus + 🏘️ quartier (niveau moyen des voisins × " + virgule(Vb.quartier.parNiveau, 2) + ", ≤ " + virgule(Vb.quartier.max, 2) + ") − pollution − bouchons − poubelles · seuils " + Vb.seuilsR.map((x) => virgule(x, 2)).join(" / "), "moyenne " + virgule(n ? v / n : 0, 2) + " · dont quartier +" + virgule(n ? q / n : 0, 2)); }
    { const Am = Megalopole.Ameliorations, et = m.batiments.filter((b) => b.etoiles), R = m.recherches; // étape 17
      h += ligne("⭐ étape 17 : bâtiments améliorés (★1 · ★2 · ★3) · chaque étoile +" + Math.round(C.ameliorations.bonus * 100) + " % de la base, entretien +" + Math.round(C.ameliorations.entretien * 100) + " %", et.length + " (" + [1, 2, 3].map((k) => et.filter((b) => b.etoiles === k).length).join(" · ") + ")");
      h += ligne("🔬 recherches trouvées · en cours", R.faites.length + " / " + C.recherches.length + " · " + (R.enCours ? Am.fiche(R.enCours.id).nom + " (encore " + Math.ceil(R.enCours.reste) + " s)" : "aucune"));
      h += ligne("🔬 effets : 🏭 pollution des usines × · ⚡ courant × · 🔥 carburant × · 🗑️ déchets × · 🚽 épuration × · 🌾 fermes ×", ["pollutionIndustrie", "production", "carburant", "dechets", "epuration", "agriculture"].map((k) => virgule(Am.effet(m, k), 2)).join(" · ")); }
    h += ligne("🌱 le jardinier : bâtiments grandis · baissés (depuis le début)", fr(m.compteurs.grandis) + " · " + fr(m.compteurs.baisses));
    { let attendent = 0; for (const i of m.zonees) if (m.depuis[i]) attendent++; h += ligne("⏳ étape 12 : terrains qui ont un problème (ils baissent seulement après " + C.croissance.patience + " s)", fr(attendent)); }
    // 🧾 le trésorier (étape 2) : la prévision du mois, ligne par ligne, avec ses formules
    const p = Bd.prevision(m), Df = Bd.difficulte(m);
    h += groupe("🧾 Le trésorier (prévision du mois en cours)");
    h += ligne("difficulté · coûts × · caisse · prochain bilan dans", Df.emoji + " " + Df.nom + " · " + virgule(Df.couts, 2) + " · " + fr(m.argent) + " 🪙 · " + Math.ceil(C.moisDuree - m.compteMois) + " s");
    for (const z of C.ordreZones) h += ligne(C.zones[z].emoji + " impôt = revenus (gens × revenu du niveau) " + fr(p.assiette[z]) + " × " + m.taux[z] + " %", "+" + fr(p.impots[z]));
    if (p.touristes) h += ligne("🎢 touristes", "+" + fr(p.touristes));
    for (const q of Bu.postes) h += ligne(q.emoji + " " + q.nom + " = entretien × " + Math.round(Bd.poste(m, q.id) * 100) + " % × " + virgule(Df.couts, 2) + (q.id === "routes" ? " · état des routes " + Math.round(m.etatRoutes * 100) + " %" : " · cercle × " + virgule(Bd.facteurRayon(m, { poste: q.id }), 2)), "−" + fr(q.id === "routes" ? p.routes : p.postes[q.id]));
    h += ligne("⚡ centrales · 💧 eau · 🏛️ mairie (entretien)", "−" + fr(p.autres.energie) + " · −" + fr(p.autres.eau) + " · −" + fr(p.autres.mairie));
    h += ligne("🔥 carburant = production utilisée × prix par unité", "−" + fr(p.carburant));
    h += ligne("🏦 prêts : " + m.prets.length + " en cours (" + m.prets.map((x) => x.reste + " mois").join(", ") + ")", "−" + fr(p.prets));
    h += ligne("= solde prévu (recettes − dépenses)", (p.solde >= 0 ? "+" : "") + fr(p.solde));
    h += ligne("mois de suite dans le rouge (renvoi à " + C.prets.moisDansLeRouge + ")", m.moisDansLeRouge + (m.renvoye ? " · ❌ renvoyé" : ""));
    if (m.dernierBudget) h += ligne("dernier mois : recettes − dépenses", fr(m.dernierBudget.recettes) + " − " + fr(m.dernierBudget.depenses) + " = " + fr(m.dernierBudget.solde));
    // 🎓 le professeur (étape 3) : la mission en cours et ce qu'il vérifie
    const gp = Megalopole.Guide.progres(m);
    h += groupe("🎓 Le guide (le professeur vérifie 2 fois par seconde)");
    h += ligne(gp ? "mission " + gp.numero + " / " + gp.total + " : " + gp.mission.emoji + " " + gp.mission.titre + " · test « " + gp.mission.test + " »" + (m.guide.cache ? " · caché" : "") : "guide", gp ? gp.detail + " · " + Math.round(gp.fait * 100) + " %" : "✅ terminé");
    if (m.enMain) h += ligne("📦 bâtiment soulevé (maintien long) : il attend sa nouvelle place", C.batiments[m.enMain.b.type].emoji + " " + C.batiments[m.enMain.b.type].nom + " · venait de (" + m.enMain.b.colonne + ", " + m.enMain.b.ligne + ")");
    if (m.fantome) h += ligne("👻 fantôme (l'aimant cherche à " + (m.fantome.sorte === "zone" ? C.placement.aimantZone : C.placement.aimant) + " cases) : place · collé à une route · possible", "(" + m.fantome.colonne + ", " + m.fantome.ligne + ") " + m.fantome.taille + "×" + m.fantome.taille + " · " + (m.fantome.collee ? "🧲 oui" : "non") + " · " + (m.fantome.raison ? "🚫 " + m.fantome.raison : "✅"));
    if (m.trace && m.trace.doigt) h += ligne("👆 tracé au doigt : départ → arrivée", "(" + m.trace.depart.colonne + ", " + m.trace.depart.ligne + ") → (" + m.trace.arrivee.colonne + ", " + m.trace.arrivee.ligne + ")" + (m.trace.pret ? " · attend ✅" : " · attend l'arrivée"));
    // 🏛️ étape 14 : les services en capacité (servis par la route, les plus proches d'abord)
    h += groupe("🏛️ Les services : places · demande · servis · terrains pas reliés");
    for (const [t, e] of [["education", "🎓"], ["sante", "🏥"], ["securite", "🚓"], ["feu", "🚒"], ["loisirs", "🎡"], ["transport", "🚌"]]) { const S = (m.services || {})[t]; if (S) h += ligne(e + " " + t + (S.tous ? " (habitants + emplois)" : " (habitants)"), fr(S.capacite) + " · " + fr(S.demande) + " · " + fr(S.servis) + " · " + S.horsReseau); }
    h += groupe("🎨 Le peintre");
    h += ligne("images par seconde · pas de calcul par seconde", mesures.ips + " · " + mesures.majParSeconde);
    h += ligne("cases · objets · voitures dessinés · temps de dessin", P.cases + " · " + P.objets + " · " + P.voitures + " · " + virgule(P.ms, 1) + " ms");
    h += ligne("caméra : zoom", virgule(m.camera.zoom, 2));
    if (m.survol) h += ligne("case sous la souris", "(" + m.survol.colonne + ", " + m.survol.ligne + ")");
    h += "</table>";
    document.getElementById("etat").innerHTML = h;
    // la base de données
    const brut = Megalopole.Sauvegarde.brut();
    document.getElementById("base").textContent = brut ? "clé « " + Megalopole.Sauvegarde.CLE + " » · " + fr(brut.length) + " lettres\n\n" + brut.slice(0, 1600) + (brut.length > 1600 ? "…" : "") : "(rien de sauvegardé)";
  }
  if (window.IntersectionObserver) setTimeout(() => { const el = document.getElementById("sous-le-capot"); if (el) new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(el); }, 0);

  return { initialiser, changerMonde, mettreAJour, PHRASES };
})();
