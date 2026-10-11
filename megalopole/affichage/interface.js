// 🧭 L'INTERFACE : le tableau de bord du maire
//
// Ce sont des morceaux de page (du HTML) posés par-dessus la carte :
//   - en haut, la BARRE : l'argent 🪙, les habitants 👥, le palier de la ville, le bonheur 😊, la date, et la DEMANDE
//     R C I A (4 petites barres : vers le haut = la ville en veut, vers le bas = il y en a trop) ;
//   - en bas, les OUTILS du maire, rangés par groupes (routes, zones, énergie, eau, services, loisirs, transports) ;
//   - à droite, des ICÔNES RONDES : les missions 🎓, les réclamations 📢, les besoins et la production 📊, le budget 🧾 ;
//     toucher une case de la carte (sans outil) ouvre ce qu'il y a dessus ; le bouton rond des calques est en bas à droite ;
//     (étape 2) le budget 🧾 est un vrai tableau de bord : un impôt par zone, un curseur par service, la banque ;
//   - (étape 3) le GUIDE 🎓 (une mission à la fois), et la barre ✅ / ❌ pour construire un tracé fait au doigt ;
//     (étape 6) les missions ont leur propre ICÔNE 🎓 dans la colonne de droite (avec la mission en cours : « 3/9 ») ;
//   - au tout début, le CHOIX DE LA DIFFICULTÉ ; et si la caisse reste vide trop longtemps, l'écran « maire renvoyé » ;
//   - les CALQUES 🗺️ : voir le courant, l'eau, la valeur du terrain, la pollution, le trafic, les services…
// L'interface ne change jamais le monde elle-même : elle range ce que veut le joueur dans « demandes », que main.js
// donne au monde au pas suivant.

window.Megalopole = window.Megalopole || {};

Megalopole.Interface = (function () {
  const C = Megalopole.CONFIG;
  const radio = Megalopole.Evenements;
  const $ = (id) => document.getElementById(id);
  const fr = (n) => Math.round(n).toLocaleString("fr-FR");
  const demandes = { outil: undefined, taux: [], postes: [], pret: null, vitesse: null, calque: undefined, difficulte: null, guide: null, confirmer: false, annulerTrace: false, deplacer: false };
  const auDoigt = () => window.matchMedia && matchMedia("(pointer: coarse)").matches; // (un téléphone, une tablette)
  let groupeOuvert = null, onglet = "reclamations", monde = null;

  const prix = (base) => fr(Megalopole.Budget.prix(monde, base)); // (étape 2 : × la difficulté)
  // 📋 La fiche d'un bâtiment, sur sa carte du tiroir (étape 11 : « une puissance visible à l'achat ») :
  //   ce qu'il produit (⚡ 💧 🗑️ 🚽), ce qu'il consomme, sa pollution (▮ = un peu, ▮▮▮▮▮ = beaucoup), et où le poser
  function fiche(t, B) {
    const f = [];
    if (B.courant) f.push("⚡ " + fr(B.courant) + (B.vent ? " (selon le vent)" : B.soleil ? " (le jour)" : ""));
    if (B.courantDechets) f.push("⚡ jusqu'à " + B.courantDechets);
    if (B.eau) f.push("💧 " + fr(B.eau));
    if (B.consoCourant) f.push("−⚡ " + B.consoCourant);
    if (B.epuration) f.push("🚽 nettoie " + fr(B.epuration));
    if (B.dechets) f.push("🗑️ " + B.dechets + (B.contenance ? " · tient " + fr(B.contenance) : ""));
    if (B.recyclage) f.push("♻️ −30 % (jusqu'à " + B.recyclage + ")");
    if (B.rayon && B.service) f.push("🎯 " + B.rayon + " cases");
    if (B.pollution) f.push("🌫️ " + "▮".repeat(Math.max(1, Math.round(B.pollution * 5))));
    else if (B.salete) f.push("🌫️ salit autour");
    if (C.budget.carburant[t]) f.push("⛽ carburant");
    const ou = B.surMer ? "🌊 dans la mer" : B.riviere ? "🏞️ contre une rivière" : B.bordDeMer ? "🌊 au bord de la mer" : B.bordDeLEau ? "💧 au bord de l'eau" : "";
    if (ou) f.push(ou);
    return f.join(" · ");
  }
  // Ce qu'un nouveau bâtiment ajouterait à son réseau : « +600 ⚡ : la ville aura 1 400 / 900 »
  function gainReseau(m, B) {
    for (const [cle, q, emoji] of [["courant", "courant", "⚡"], ["eau", "eau", "💧"], ["dechets", "dechets", "🗑️"]]) {
      if (!B[cle]) continue;
      const e = m.reseaux[q] || {}, plus = B[cle];
      return "+" + fr(plus) + " " + emoji + " : la ville aura " + fr((e.offre || 0) + plus) + " / " + fr(q === "eau" ? e.demandeBesoin || 0 : e.demande || 0);
    }
    return null;
  }
  // Les outils de chaque groupe : { sorte, valeur, emoji, nom, prix }
  function outilsDu(groupe) {
    if (groupe === "routes") return [
      { sorte: "route", valeur: "route", emoji: "🛣️", nom: "Route", prix: prix(C.routes.route.prix) + " 🪙/case", touche: "R" },
      { sorte: "route", valeur: "avenue", emoji: "🛤️", nom: "Avenue (2 fois et demie plus de voitures)", prix: prix(C.routes.avenue.prix) + " 🪙/case" },
      { sorte: "demolir", valeur: null, emoji: "🧨", nom: "Démolir", prix: prix(5) + " 🪙/case", touche: "B" },
    ];
    if (groupe === "zones") return C.ordreZones.map((z, k) => ({ sorte: "zone", valeur: z, emoji: C.zones[z].emoji, nom: "Zone " + C.zones[z].nom.toLowerCase() + " (lot " + C.placement.lot + "×" + C.placement.lot + ")", prix: prix(C.zones[z].prix * C.placement.lot * C.placement.lot) + " 🪙/lot", touche: String(k + 1), couleur: C.zones[z].couleur }))
      .concat([{ sorte: "dezoner", valeur: null, emoji: "🧽", nom: "Effacer la zone", prix: "gratuit" }]);
    return Object.entries(C.batiments).filter(([, B]) => B.groupe === groupe).map(([t, B]) => ({ sorte: "batiment", valeur: t, emoji: B.emoji, nom: B.nom, prix: prix(B.prix) + " 🪙 · " + prix(B.entretien) + "/mois", fiche: fiche(t, B), palier: B.palier }));
  }

  function initialiser(m) {
    monde = m;
    // les groupes d'outils
    const barre = $("outils");
    // (étape 8 : plus de bouton « Regarder » : sans outil, on regarde ; ✖ de l'outil en cours le lâche)
    for (const g of C.groupes) {
      const b = document.createElement("button");
      b.className = "groupe"; b.dataset.groupe = g.id; b.innerHTML = "<span>" + g.emoji + "</span><small>" + g.nom + "</small>";
      b.addEventListener("click", () => (groupeOuvert === g.id ? fermerTiroir() : ouvrirTiroir(g.id)));
      barre.appendChild(b);
    }
    // les onglets du panneau
    for (const b of document.querySelectorAll("[data-onglet]")) b.addEventListener("click", () => { fermerTiroir(); onglet = onglet === b.dataset.onglet && $("panneau").classList.contains("ouvert") ? null : b.dataset.onglet; $("panneau").classList.toggle("ouvert", !!onglet); rafraichir(true); });
    // 🎓 le guide et ✅ / ❌ (les boutons sont redessinés : on écoute leur parent)
    $("contenu-panneau").addEventListener("click", (e) => {
      const bt = e.target.closest("[data-guide]");
      if (!bt) return;
      if (bt.dataset.guide === "montrer-moi") { const p = Megalopole.Guide.progres(monde); if (p && p.mission.groupe) { fermerPanneau(); montrerGroupe = p.mission.groupe; ouvrirTiroir(p.mission.groupe); } }
      else demandes.guide = bt.dataset.guide;
      setTimeout(() => rafraichir(true), 30);
    });
    radio.ecouter("mission-reussie", () => { const b = document.querySelector("[data-onglet='guide']"); b.classList.remove("nouveau"); void b.offsetWidth; b.classList.add("nouveau"); });
    $("confirmer").addEventListener("click", (e) => {
      if (e.target.closest("[data-oui]")) demandes.confirmer = true;
      if (e.target.closest("[data-non]")) { demandes.annulerTrace = true; demandes.outil = null; } // (étape 7 : ❌ annule ET lâche l'outil : un toucher sur la carte ne pose plus rien)
    });
    // ✖ fermer le panneau (et la touche Échap)
    $("fermer-panneau").addEventListener("click", fermerPanneau);
    // les calques
    const lc = $("liste-calques");
    // (étape 8 : comme sur Google Maps, une grille de petites tuiles : l'emoji en gros, le nom en dessous)
    const tuile = (id, emoji, nom) => { const b = document.createElement("button"); b.dataset.calque = id || ""; b.innerHTML = "<span>" + emoji + "</span>" + nom; b.addEventListener("click", () => { demandes.calque = id; lc.classList.remove("ouvert"); }); lc.appendChild(b); };
    tuile(null, "🌍", "Aucun");
    for (const [id, cq] of Object.entries(Megalopole.Peintre.CALQUES)) { const [emoji, ...mots] = cq.nom.split(" "); tuile(id, emoji, mots.join(" ").replace("Valeur du terrain", "Valeur")); }
    $("bouton-calques").addEventListener("click", () => { fermerTiroir(); lc.classList.toggle("ouvert"); });
    $("calque-actif").addEventListener("click", () => (demandes.calque = null));
    // ⏯️ un seul bouton pour le temps : pause → lecture → rapide → pause…
    $("vitesse").addEventListener("click", () => (demandes.vitesse = { 0: 1, 1: 3, 3: 0 }[Megalopole.vitesse] ?? 1));
    // ✖ dans l'outil en cours : on lâche l'outil
    $("outil-en-cours").addEventListener("click", (e) => { if (e.target.closest("[data-lacher]")) { demandes.outil = null; fermerTiroir(); } });
    // (les boutons du budget sont redessinés 4 fois par seconde : on écoute leur parent, qui, lui, reste)
    $("contenu-panneau").addEventListener("click", (e) => {
      if (e.target.closest("[data-deplacer]")) { demandes.deplacer = true; fermerPanneau(); return; }
      const bt = e.target.closest("[data-taux],[data-poste],[data-pret]");
      if (!bt) return;
      if (bt.dataset.taux) { const [zone, d] = bt.dataset.taux.split(":"); demandes.taux.push({ zone, d: +d }); }
      if (bt.dataset.poste) { const [id, d] = bt.dataset.poste.split(":"); demandes.postes.push({ id, d: +d }); }
      if (bt.dataset.pret) demandes.pret = +bt.dataset.pret;
      setTimeout(() => rafraichir(true), 30);
    });
    // le choix de la difficulté et l'écran « maire renvoyé »
    $("voile").addEventListener("click", (e) => { const bt = e.target.closest("[data-difficulte]"); if (bt) { demandes.difficulte = bt.dataset.difficulte; fermerVoile(); } if (e.target.closest("[data-annuler]")) fermerVoile(); });
    ouvrirGuideSiNeuf();
    // les messages
    for (const [nom, f] of Object.entries(MESSAGES)) radio.ecouter(nom, (d) => afficher(f(d)));
  }
  function changerMonde(m) { monde = m; dernierHTML = ""; ouvrirGuideSiNeuf(); }
  // une ville toute neuve : on ouvre la page des missions, pour que le maire sache par quoi commencer
  function ouvrirGuideSiNeuf() { if (monde && monde.guide && !monde.guide.fini && monde.guide.etape === 0 && !monde.batiments.length) { onglet = "guide"; $("panneau").classList.add("ouvert"); } }

  // 🎚️ Le voile : un grand panneau au milieu de l'écran (la difficulté, ou le maire renvoyé)
  function choisirDifficulte(titre, texte, annulable) {
    let h = "<div class='fenetre'><h2>" + titre + "</h2><p>" + texte + "</p><div class='choix'>";
    for (const [id, D] of Object.entries(C.difficultes)) h += "<button data-difficulte='" + id + "'><b>" + D.emoji + " " + D.nom + "</b><small>" + fr(D.argent) + " 🪙 au départ<br>coûts × " + String(D.couts).replace(".", ",") + "<br>" + (D.bonheur > 0 ? "habitants faciles à contenter (+" + D.bonheur + " 😊)" : D.bonheur < 0 ? "habitants exigeants (" + D.bonheur + " 😊)" : "habitants normaux") + "</small></button>";
    $("voile").innerHTML = h + "</div>" + (annulable ? "<p style='text-align:center;margin:10px 0 0'><button data-annuler='1' class='annuler'>↩️ Non, je garde ma ville</button></p>" : "") + "</div>";
    $("voile").classList.add("ouvert");
  }
  function fermerVoile() { $("voile").classList.remove("ouvert"); }
  function renvoye(m) {
    choisirDifficulte("🧾 Le maire est renvoyé !", "La caisse est restée vide pendant " + C.prets.moisDansLeRouge + " mois de suite (" + fr(m.argent) + " 🪙). Le conseil municipal a choisi un autre maire… Ta ville comptait " + fr(m.stats.habitants) + " habitants. Retente ta chance : surveille le solde du mois dans 🧾, et emprunte à la banque avant qu'il soit trop tard !");
  }

  function ouvrirTiroir(g) {
    groupeOuvert = g;
    const t = $("tiroir");
    t.innerHTML = "";
    for (const o of outilsDu(g)) {
      const b = document.createElement("button"), verrou = o.palier !== undefined && Megalopole.Population.palier(monde) < o.palier;
      b.className = "carte-outil" + (verrou ? " verrou" : "");
      b.innerHTML = "<span class='emoji'" + (o.couleur ? " style='background:" + o.couleur + "'" : "") + ">" + o.emoji + "</span><b>" + o.nom + "</b><small>" + (verrou ? "🔒 " + C.paliers[o.palier].emoji + " " + C.paliers[o.palier].nom + " (" + fr(C.paliers[o.palier].habitants) + " hab.)" : o.prix) + "</small>" + (o.fiche ? "<small class='fiche'>" + o.fiche + "</small>" : "");
      b.title = o.nom + (o.fiche ? " — " + o.fiche : "");
      b.addEventListener("click", () => { if (verrou) { afficher("🔒 " + o.nom + " : il faut d'abord être un(e) " + C.paliers[o.palier].nom.toLowerCase() + " (" + fr(C.paliers[o.palier].habitants) + " habitants)"); return; } demandes.outil = { sorte: o.sorte, valeur: o.valeur }; fermerTiroir(); });
      t.appendChild(b);
    }
    const x = document.createElement("button"); x.className = "fermer"; x.textContent = "✖"; x.title = "Fermer";
    x.addEventListener("click", () => { fermerTiroir(); demandes.outil = null; }); // (✖ : on ferme le tiroir et on lâche l'outil)
    t.prepend(x); // (en premier, et collé à gauche : toujours visible)
    t.classList.add("ouvert");
    marquerGroupes();
  }
  function fermerPanneau() { onglet = null; $("panneau").classList.remove("ouvert"); rafraichir(true); }
  function fermerTiroir() { groupeOuvert = null; $("tiroir").classList.remove("ouvert"); marquerGroupes(); }
  let montrerGroupe = null; // (le menu que « 👉 Montre-moi » fait clignoter, jusqu'à ce qu'on choisisse un outil)
  function marquerGroupes() {
    if (monde && monde.outil) montrerGroupe = null;
    const montre = montrerGroupe && groupeOuvert !== montrerGroupe ? montrerGroupe : null;
    for (const b of document.querySelectorAll(".groupe")) { b.classList.toggle("actif", b.dataset.groupe === groupeOuvert); b.classList.toggle("clignote", b.dataset.groupe === montre); }
  }

  // Les messages (en bas de l'écran, pendant 4 s)
  let minuteurMessage = null;
  function afficher(texte) {
    if (!texte) return;
    const m = $("message"); m.textContent = texte; m.classList.add("visible");
    clearTimeout(minuteurMessage); minuteurMessage = setTimeout(() => m.classList.remove("visible"), 4000);
  }
  const MESSAGES = {
    "pas-assez": (d) => "🪙 Pas assez d'argent pour " + d.quoi + " : il faut " + fr(d.prix) + " 🪙, tu en as " + fr(d.argent),
    "construction-impossible": (d) => "🚫 " + d.nom + " : " + d.raison,
    "nouveau-palier": (d) => "🎉 " + d.emoji + " Ta ville devient un(e) " + d.nom + " ! " + (d.nouveaux.length ? "Nouveau : " + d.nouveaux.join(", ") : "Les bâtiments peuvent monter jusqu'au niveau " + d.niveauMax),
    "courant-penurie": (d) => "⚡❌ Pénurie d'électricité : " + d.coupes + " bâtiment(s) dans le noir. Construis une centrale !",
    "dechets-penurie": (d) => "🗑️❌ Les poubelles débordent : " + d.coupes + " bâtiment(s) pas ramassé(s). Une décharge ou un incinérateur de plus !",
    "decharge-pleine": () => "🗑️⛔ Une décharge est pleine ! Construis-en une autre (ou un incinérateur).",
    "decharge-presque-pleine": () => "🗑️⚠️ Une décharge est pleine à 80 % : prépare la suivante.",
    "eau-penurie": (d) => "💧❌ Pénurie d'eau : " + d.coupes + " bâtiment(s) sans eau. Une station de pompage de plus !",
    "reclamation": (d) => "📢 Les habitants réclament : " + d.emoji + " " + d.texte,
    "budget-mois": (d) => (d.solde < 0 ? "🧾 Ce mois-ci, la ville a perdu " + fr(-d.solde) + " 🪙 !" : null),
    "impots-changes": (d) => "🧾 Impôts " + d.emoji + " " + d.zone.toLowerCase() + " : " + d.taux + " % (" + (d.effet >= 0 ? "envie +" : "envie ") + d.effet.toFixed(2).replace(".", ",") + ")",
    "budget-poste": (d) => "🧾 Budget " + d.poste.toLowerCase() + " : " + d.budget + " %",
    "pret": (d) => "🏦 La banque te prête " + fr(d.montant) + " 🪙 : tu rembourseras " + fr(d.mensualite) + " 🪙 par mois pendant " + d.mois + " mois",
    "pret-refuse": (d) => "🏦❌ Prêt refusé : " + d.raison,
    "pret-rembourse": (d) => "🏦✅ Le prêt de " + fr(d.montant) + " 🪙 est remboursé !",
    "routes-abimees": (d) => "🛣️⚠️ Les routes s'abîment (" + d.etat + " %) : augmente leur budget dans 🧾",
    "batiment-souleve": (d) => "📦 " + d.emoji + " " + d.nom + " soulevé(e) : touche sa nouvelle place, puis ✅ (❌ pour le remettre)",
    "batiment-deplace": (d) => "📦✅ " + d.emoji + " " + d.nom + " déplacé(e) !",
    "deplacement-impossible": (d) => "📦🚫 " + d.raison,
    "mission-reussie": (d) => "🎓✅ Mission " + d.numero + " réussie : " + d.emoji + " " + d.titre + " !",
    "guide-fini": () => "🎓🎉 Bravo, tu as fini le guide ! Maintenant, écoute ce que réclament les habitants (📢).",
    "caisse-vide": (d) => "🧾⚠️ La caisse est vide depuis " + d.mois + " mois ! Encore " + d.reste + " mois et le maire est renvoyé (🏦 un prêt ? moins de dépenses ?)",
  };

  // ---------------------------------------------------------------- le rafraîchissement (4 fois par seconde)
  let dernier = 0;
  function rafraichir(force) {
    const maintenant = performance.now();
    if (!force && maintenant - dernier < 250) return;
    dernier = maintenant;
    const m = monde, s = m.stats, P = C.paliers[m.palier];
    // la barre du haut
    $("argent").textContent = fr(m.argent) + " 🪙";
    $("argent").classList.toggle("rouge", m.argent < 0);
    $("habitants").textContent = fr(s.habitants);
    html("palier", P.emoji + "<span class='nom'> " + P.nom + "</span>");
    $("bonheur").textContent = (m.bonheur >= 75 ? "😄" : m.bonheur >= 55 ? "🙂" : m.bonheur >= 40 ? "😐" : "😟") + " " + m.bonheur + " %";
    const an = Math.floor(m.mois / 12) + 1, mois = (m.mois % 12) + 1, soleil = Megalopole.Reseaux.soleil(m);
    html("date", (soleil > 0.15 ? "☀️" : "🌙") + " <span class='date-longue'>mois </span>" + mois + " · <span class='date-longue'>an </span>" + an);
    // (la ligne du zéro et la place des barres viennent du CSS : elles changent sur téléphone)
    const col = $("rci-R").parentElement, hCol = col.clientHeight, zero = parseFloat(getComputedStyle(col, "::after").bottom) || hCol / 2;
    for (const z of C.ordreZones) {
      const v = Math.max(-1, Math.min(1, m.demande[z] || 0)), barre = $("rci-" + z), haut = Math.round(Math.abs(v) * (v >= 0 ? hCol - zero - 1 : zero - 2)); // (une barre vers le bas passe derrière les petits emojis)
      barre.style.height = haut + "px";
      barre.style.bottom = (v >= 0 ? zero : zero - haut) + "px";
      barre.style.background = v >= 0 ? C.zones[z].couleur : "#c8443a";
    }
    const icone = { 0: "⏸️", 1: "▶️", 3: "⏩" }[Megalopole.vitesse] || "▶️"; if ($("vitesse").textContent !== icone) $("vitesse").textContent = icone; // (l'icône montre où en est le temps)
    $("bouton-calques").classList.toggle("actif", !!Megalopole.calque);
    for (const b of document.querySelectorAll("[data-calque]")) b.classList.toggle("actif", (b.dataset.calque || null) === (Megalopole.calque || null));
    html("calque-actif", Megalopole.calque ? "<button title='Enlever le calque'>" + Megalopole.Peintre.CALQUES[Megalopole.calque].nom + " ✖</button>" : "");
    $("calque-actif").classList.toggle("visible", !!Megalopole.calque);
    // l'outil en cours (au doigt : 1 doigt bouge la carte, on TOUCHE le départ puis l'arrivée)
    const o = m.outil, tr = m.trace && m.trace.doigt ? m.trace : null, trace = o && o.sorte !== "batiment";
    const fa = m.fantome && m.fantome.doigt ? m.fantome : null, aimant = o && (o.sorte === "batiment" || o.sorte === "zone");
    const cvTexte = !auDoigt() && m.fantome ? couvertureNouvelle(m, m.fantome) || (m.fantome.sorte === "batiment" ? gainReseau(m, C.batiments[m.fantome.valeur]) : null) : null;
    const texteOutil = cvTexte ? "🖌️ " + nomOutil(o) + " · " + cvTexte + " · clic = construire" : !o ? "" : auDoigt() ? "🖌️ " + nomOutil(o) + (aimant ? " · touche près d'une route" : " · touche le départ") : "🖌️ " + nomOutil(o) + (aimant ? " · clique près d'une route (il s'y colle 🧲)" : " · glisse sur la carte") + " · Échap";
    html("outil-en-cours", texteOutil ? "<span>" + texteOutil + "</span><button data-lacher='1' title='Lâcher l'outil'>✖</button>" : "");
    $("outil-en-cours").classList.toggle("visible", !!o && !tr && !fa);
    // ✅ / ❌ : le tracé fait au doigt attend qu'on confirme
    let hc = "";
    if (fa) { // 👻 le fantôme posé au doigt
      const prix = o.deplacer ? 0 : fa.sorte === "batiment" ? Megalopole.Budget.prix(m, C.batiments[fa.valeur].prix) : Megalopole.Construction.evaluerZone(m, fa.cases, fa.valeur).prix;
      hc = "<span>" + (o.deplacer ? "📦 Déplacer : " : "") + nomOutil(o) + (o.deplacer ? " · <b>gratuit</b>" : "") + (fa.sorte === "zone" ? " · lot " + fa.taille + "×" + fa.taille : "") + (o.deplacer ? "" : " · <b>" + fr(prix) + " 🪙</b>") + (fa.raison ? "<br><b class='mal'>🚫 " + fa.raison + "</b>" : (fa.sorte === "batiment" && !o.deplacer && gainReseau(m, C.batiments[fa.valeur]) ? "<br><b class='bien'>" + gainReseau(m, C.batiments[fa.valeur]) + "</b>" : "") + (couvertureNouvelle(m, fa) ? "<br><b class='bien'>" + couvertureNouvelle(m, fa) + "</b>" : "") + "<br><small>" + (fa.collee ? "🧲 collé à la route · " : "⚠️ loin d'une route · ") + "retouche pour déplacer</small>") + "</span>" + (fa.raison ? "" : "<button data-oui='1' class='oui'>✅ " + (o.deplacer ? "Poser ici" : "Construire") + "</button>") + "<button data-non='1' class='non'>❌</button>";
    } else if (tr && trace) {
      const cases = Megalopole.Monde.casesDuTrace(o, tr);
      const e = o.sorte === "route" ? Megalopole.Construction.evaluerRoute(m, cases, o.valeur) : o.sorte === "zone" ? Megalopole.Construction.evaluerZone(m, cases, o.valeur) : null;
      hc = tr.pret ? "<span>" + nomOutil(o) + " · " + cases.length + " case(s)" + (e ? " · <b>" + fr(e.prix) + " 🪙</b>" : "") + "<br><small>retouche pour changer l'arrivée</small></span><button data-oui='1' class='oui'>✅ " + (o.sorte === "demolir" ? "Démolir" : o.sorte === "dezoner" ? "Effacer" : "Construire") + "</button>"
        : "<span>👆 Touche maintenant l'<b>arrivée</b><br><small>(1 doigt pour bouger la carte)</small></span>";
      hc += "<button data-non='1' class='non'>❌</button>";
    }
    if (hc !== dernierConfirmer) { $("confirmer").innerHTML = hc; dernierConfirmer = hc; }
    $("confirmer").classList.toggle("visible", !!hc);
    // 🎓 l'icône des missions : la mission en cours (« 3/9 »), ou ✅ quand tout est fait
    const g = Megalopole.Guide.progres(m), badge = g ? g.numero + "/" + g.total : m.guide && m.guide.fini ? "✅" : "";
    if ($("badge-guide").textContent !== badge) $("badge-guide").textContent = badge;
    marquerGroupes();
    // la case touchée ouvre l'onglet 🔎
    if (m.selection && m.selection !== dejaVue) { dejaVue = m.selection; onglet = "case"; $("panneau").classList.add("ouvert"); }
    for (const b of document.querySelectorAll("[data-onglet]")) b.classList.toggle("actif", b.dataset.onglet === onglet && $("panneau").classList.contains("ouvert"));
    if ($("panneau").classList.contains("ouvert")) { const html = contenu(onglet); if (html !== dernierHTML) { $("contenu-panneau").innerHTML = html; dernierHTML = html; } } // (seulement s'il a changé : sinon un bouton disparaît sous le doigt)
  }
  let dejaVue = null, dernierHTML = "", dernierConfirmer = "";
  // (on ne remplace le HTML d'un élément que s'il a changé : sinon un bouton disparaîtrait sous le doigt)
  const dejaHTML = {};
  function html(id, h) { if (dejaHTML[id] !== h) { $(id).innerHTML = h; dejaHTML[id] = h; } }
  function nomOutil(o) {
    if (o.sorte === "route") return C.routes[o.valeur].nom;
    if (o.sorte === "zone") return "Zone " + C.zones[o.valeur].nom.toLowerCase();
    if (o.sorte === "batiment") return C.batiments[o.valeur].emoji + " " + C.batiments[o.valeur].nom;
    return o.sorte === "demolir" ? "Démolir" : "Effacer la zone";
  }

  const barreHTML = (v, couleur) => "<span class='barre'><span style='width:" + Math.round(Math.max(0, Math.min(1, v)) * 100) + "%;background:" + (couleur || (v >= 0.75 ? "#3d8a4a" : v < 0.4 ? "#c8443a" : "#d9a030")) + "'></span></span>";
  function contenu(o) {
    const m = monde, s = m.stats;
    if (o === "guide") return guideHTML(m);
    if (o === "reclamations") {
      let h = "<h3>📢 Ce que réclament les habitants</h3>";
      if (!s.habitants) return h + "<p>Pas encore d'habitants. Commence par : 🛣️ une route, ⚡ une centrale (ou des éoliennes) touchant la route, puis peins des zones 🏠 habitation, 🛍️ commerce et 🏭 industrie le long de la route.</p>";
      if (!m.reclamations.length) return h + "<p>😄 Tout le monde est content ! La ville grandit toute seule.</p>";
      return h + m.reclamations.slice(0, 7).map((r) => "<div class='recl'><b>" + r.emoji + " " + r.texte + "</b><br><small>💡 " + r.conseil + "</small></div>").join("");
    }
    if (o === "besoins") return bilanHTML(m);
    if (o === "budget") return budgetHTML(m);
    // 🔎 la case touchée
    const sel = m.selection;
    if (!sel) return "<h3>🔎 Une case</h3><p>Touche une case de la carte (sans outil en main) pour voir ce qu'il y a.</p>";
    const n = m.carte.colonnes, i = sel.ligne * n + sel.colonne, Z = Megalopole.Zones, b = Megalopole.Construction.batimentSur(m, i);
    let h = "";
    if (b) {
      const B = C.batiments[b.type];
      h += "<h3>" + B.emoji + " " + B.nom + "</h3>";
      h += ficheReseau(m, b, B); // (étape 13 : capacité de ce bâtiment, de toute la ville, la demande, et le verdict)
      if (B.rayon) h += "<p>🎯 Sert un cercle de " + B.rayon + " cases" + (b.marche === false && B.service !== "loisirs" ? " — ⚠️ <b>pas d'électricité</b> : il ne marche pas !" : "") + "</p>";
      if (B.trafic) h += "<p>🚗 Enlève " + Math.round(B.trafic * 100) + " % du trafic autour</p>";
      if (B.joie) h += "<p>😊 +" + B.joie + " de bonheur pour toute la ville</p>";
      if (b.rayon !== undefined && b.rayon !== B.rayon) h += "<p>🧾 Budget " + C.budget.postes.find((q) => q.id === B.poste).nom.toLowerCase() + " à " + Math.round(Megalopole.Budget.poste(m, B.poste) * 100) + " % : cercle de " + b.rayon.toFixed(1).replace(".", ",") + " cases</p>";
      h += "<p><button data-deplacer='1' class='deplacer'>📦 Déplacer (gratuit)</button> <small>ou maintiens ton doigt dessus</small></p>";
      h += "<p>🔧 Entretien : " + fr(Megalopole.Budget.prix(m, B.entretien) * (B.poste ? Megalopole.Budget.poste(m, B.poste) : 1)) + " 🪙 par mois</p>";
      return h;
    }
    const z = Z.lettre(m, i), ter = m.carte.terrain[i];
    if (m.route[i]) h += "<h3>" + (m.route[i] === 2 ? "🛤️ Avenue" : "🛣️ Route") + "</h3><p>🚗 Trafic : " + Math.round(m.trafic[i] * 100) + " %" + (m.trafic[i] > 1 ? " — 🚧 <b>bouchon !</b> (une avenue, un arrêt de bus…)" : "") + "</p>";
    else if (z) {
      const nv = m.niveau[i], Zc = C.zones[z], nm = Z.niveauMax(m, i), e = Z.envie(m, i);
      h += "<h3>" + Zc.emoji + " " + Zc.niveaux[nv] + " <small>(niveau " + nv + ")</small></h3>";
      h += "<p>" + (z === "R" ? "👥 " + Zc.gens[nv] + " habitants" : "💼 " + Zc.gens[nv] + " emplois") + "</p>";
      // 📋 étape 12 : la liste « pour grandir », avec seulement ce qui compte pour CETTE zone
      const cd = Z.conditions(m, i), manque = cd.liste.filter((x) => !x.ok);
      h += "<h4>" + (nv >= 6 || (z !== "R" && z !== "C" && nv >= 5) ? "🏆 C'est le plus haut niveau" : manque.length ? "📈 Pour passer au niveau " + cd.cible + " (" + Zc.niveaux[cd.cible] + ")" : "📈 Tout est prêt pour le niveau " + cd.cible + " : il va grandir") + "</h4>";
      h += "<ul class='conditions'>" + cd.liste.map((x) => "<li class='" + (x.ok ? "bien" : "mal") + "'>" + (x.ok ? "✅ " : "❌ ") + x.texte + "</li>").join("") + "</ul>";
      if (m.depuis[i]) h += "<p class='mal'><small>⏳ Il a un problème depuis " + Math.round(m.temps - m.depuis[i]) + " s : au bout de " + C.croissance.patience + " s, il perdra un niveau.</small></p>";
    } else h += "<h3>" + (ter === 1 ? "🌊 Eau" : m.carte.arbre[i] ? "🌳 Forêt" : ter === 2 ? "🏖️ Sable" : "🌱 Herbe") + "</h3>";
    h += "<div class='ligne'><span>💎 Valeur</span>" + barreHTML(m.valeur[i], "#3d8a4a") + "<small>" + m.valeur[i].toFixed(2).replace(".", ",") + "</small></div>";
    h += "<div class='ligne'><span>🌫️ Pollution</span>" + barreHTML(m.pollution[i], "#8a6a4a") + "<small>" + Math.round(m.pollution[i] * 100) + " %</small></div>";
    if (!z) h += "<p>" + (m.routeProche[i] >= 0 ? "🛣️ près d'une route" : "🚫 trop loin d'une route") + "</p>"; // (un terrain bâti a sa liste « pour grandir » juste au-dessus)
    return h;
  }
  // 🏭 Étape 13 (✍️ Maxance : « quand je clique sur un incinérateur ou un traitement de l'eau, j'aimerais voir les capacités
  // unitaire et totale, et la demande, pour savoir s'il faut en faire plus ») : une fiche par réseau que sert ce bâtiment
  //   CE BÂTIMENT : sa capacité, et ce qu'il fait en ce moment
  //   TOUTE LA VILLE : combien il y en a, la capacité totale, la demande
  //   LE VERDICT : ✅ assez (+ la marge) · ⚠️ presque plein (moins de 10 % de marge) · ❌ il en faut N de plus
  function ficheReseau(m, b, B) {
    const meme = m.batiments.filter((x) => x.type === b.type).length, blocs = [];
    const verdict = (offre, demande, unite, emoji) => {
      if (!demande) return "<p class='bien'>✅ Personne n'en demande encore.</p>";
      if (offre >= demande * 1.1) return "<p class='bien'>✅ Assez : il reste <b>" + fr(offre - demande) + " " + emoji + "</b> de marge (" + Math.round(((offre - demande) / demande) * 100) + " %).</p>";
      if (offre >= demande) return "<p>⚠️ Presque plein : il ne reste que " + fr(offre - demande) + " " + emoji + ". Prévois-en un autre bientôt.</p>";
      const n = Math.ceil((demande - offre) / unite);
      return "<p class='mal'>❌ Il manque <b>" + fr(demande - offre) + " " + emoji + "</b> : il en faut <b>" + n + " de plus</b> comme celui-ci (ou un plus gros).</p>";
    };
    const bloc = (titre, ici, ville, v) => blocs.push("<div class='reseau'><h4>" + titre + "</h4><div class='deux'><div><small>CE BÂTIMENT</small>" + ici + "</div><div><small>TOUTE LA VILLE</small>" + ville + "</div></div>" + v + "</div>");
    const el = m.reseaux.courant || {}, ea = m.reseaux.eau || {}, de = m.reseaux.dechets || {}, ep = m.reseaux.epuration || {};
    const unite = B.courant || B.courantDechets || 0;
    if (unite) bloc("⚡ L'électricité", "<p>Capacité : <b>" + fr(unite) + "</b>" + (B.vent ? " (× le vent)" : B.soleil ? " (rien la nuit)" : B.courantDechets ? " (selon ce qu'il brûle)" : "") + "</p><p>En ce moment : <b>" + fr(b.production || 0) + "</b></p>",
      "<p>" + m.batiments.filter((x) => C.batiments[x.type].courant || C.batiments[x.type].courantDechets).length + " centrale(s)</p><p>Production : <b>" + fr(el.offre || 0) + "</b></p><p>Demande : <b>" + fr(el.demande || 0) + "</b></p>", verdict(el.offre || 0, el.demande || 0, unite, "⚡"));
    if (B.consoCourant) bloc("⚡ Son électricité", "<p>Il consomme <b>" + fr(B.consoCourant) + "</b></p><p>" + (b.alimente ? "✅ alimenté" : "❌ pas alimenté : il ne produit rien !") + "</p>", "<p>Production : <b>" + fr(el.offre || 0) + "</b></p><p>Demande : <b>" + fr(el.demande || 0) + "</b></p>", verdict(el.offre || 0, el.demande || 0, B.consoCourant, "⚡"));
    if (B.eau) bloc("💧 L'eau", "<p>Capacité : <b>" + fr(B.eau) + "</b></p><p>En ce moment : <b>" + fr(b.productionEau || 0) + "</b>" + (b.productionEau ? "" : " (il lui faut l'électricité !)") + "</p>",
      "<p>" + m.batiments.filter((x) => C.batiments[x.type].eau).length + " station(s)</p><p>Production : <b>" + fr(ea.offre || 0) + "</b></p><p>Demande : <b>" + fr(ea.demandeBesoin || 0) + "</b>" + (ea.demande > ea.demandeBesoin ? " <small>(+ " + fr(ea.demande - ea.demandeBesoin) + " petites maisons, s'il en reste)</small>" : "") + "</p>", verdict(ea.offre || 0, ea.demandeBesoin || 0, B.eau, "💧"));
    if (B.epuration) bloc("🚽 Les eaux usées", "<p>Capacité : <b>" + fr(B.epuration) + "</b></p><p>" + (m.reseaux.courantDe(b) ? "✅ en marche" : "❌ pas d'électricité : il ne nettoie rien") + "</p>",
      "<p>" + m.batiments.filter((x) => C.batiments[x.type].epuration).length + " station(s)</p><p>Capacité : <b>" + fr(ep.capacite || 0) + "</b></p><p>Eaux usées : <b>" + fr(ep.eauxUsees || 0) + "</b></p>", verdict(ep.capacite || 0, ep.eauxUsees || 0, B.epuration, "🚽"));
    if (B.dechets) {
      const reste = B.contenance ? B.contenance - (b.rempli || 0) : 0, moisRestants = B.contenance && b.traite ? Math.floor(reste / b.traite) : null;
      bloc("🗑️ Les déchets", "<p>Capacité : <b>" + fr(B.dechets) + "</b> par mois</p><p>En ce moment : <b>" + fr(b.traite || 0) + "</b></p>" + (B.contenance ? "<p>Rempli : <b>" + Math.round((100 * (b.rempli || 0)) / B.contenance) + " %</b> (" + fr(b.rempli || 0) + " / " + fr(B.contenance) + ")" + (moisRestants !== null ? "<br>⏳ plein dans ≈ " + moisRestants + " mois" : "") + "</p>" : ""),
        "<p>" + m.batiments.filter((x) => C.batiments[x.type].dechets).length + " décharge(s) / incinérateur(s)</p><p>Place : <b>" + fr(de.offre || 0) + "</b></p><p>Déchets jetés : <b>" + fr(de.demande || 0) + "</b>" + (de.recycle ? " <small>(♻️ déjà −" + Math.round(de.recycle * 100) + " %)</small>" : "") + "</p>", verdict(de.offre || 0, de.demande || 0, B.dechets, "🗑️"));
    }
    if (B.recyclage) { const total = (de.demande || 0) / (1 - (de.recycle || 0)), cap = m.batiments.reduce((t, x) => t + (C.batiments[x.type].recyclage || 0), 0), utile = total * C.dechets.recyclage;
      bloc("♻️ Le recyclage", "<p>Capacité : <b>" + fr(B.recyclage) + "</b> déchets en moins</p>", "<p>" + meme + " centre(s)</p><p>Recyclé : <b>" + Math.round((de.recycle || 0) * 100) + " %</b> (au plus 30 %)</p><p>Utile jusqu'à : <b>" + fr(utile) + "</b> · capacité " + fr(cap) + "</p>", cap >= utile ? "<p class='bien'>✅ Le recyclage est au maximum (30 %) : un centre de plus ne servirait à rien.</p>" : "<p>⚠️ Encore " + Math.ceil((utile - cap) / B.recyclage) + " centre(s) pour recycler 30 %.</p>"); }
    if (B.courantDechets) blocs.reverse(); // (l'incinérateur : d'abord les déchets, son vrai métier)
    return blocs.join("");
  }
  // 📊 Étape 8 (demande de Maxance) : les BESOINS de la ville face à ce qu'elle PRODUIT, ligne par ligne
  //   ✅ assez (100 % et plus) · ⚠️ presque (80 %) · ❌ pas assez — avec un conseil quand ça manque
  function bilanHTML(m) {
    const s = m.stats, b = m.bilan || { habitants: 0, actifs: 0, emplois: 0, nourris: 0, fabriques: 0, vendus: 0, couverts: {} }, H = b.habitants, el = m.reseaux.courant, ea = m.reseaux.eau;
    const CONS = Megalopole.Population.CONSEILS || {};
    const ligne = (emoji, nom, produit, besoin, unite, conseil) => {
      const r = besoin > 0 ? produit / besoin : 1, etat = r >= 1 ? "✅" : r >= 0.8 ? "⚠️" : "❌";
      return "<div class='bilan'><span>" + emoji + " " + nom + "</span>" + barreHTML(r) + "<span>" + etat + "</span><small>" + fr(produit) + " / " + fr(besoin) + " " + unite + (r < 1 && conseil ? " · 💡 " + conseil : "") + "</small></div>";
    };
    let h = "<h3>📊 Les besoins et la production</h3><p><small>Ce que la ville produit, face à ce dont elle a besoin. ✅ assez · ⚠️ presque · ❌ pas assez.</small></p>";
    h += "<h4>🏭 Ce que la ville produit</h4>";
    h += ligne("⚡", "Électricité", el.offre || 0, el.demande || 0, "unités produites / demandées", CONS.courant);
    h += ligne("💧", "Eau", ea.offre || 0, ea.demandeBesoin || 0, "unités produites / nécessaires" + (ea.demande > ea.demandeBesoin ? " (+ " + fr(ea.demande - ea.demandeBesoin) + " pour les petites maisons, s'il en reste : elles ont un puits)" : "") + (ea.coupes ? " · ❌ " + ea.coupes + " bâtiment(s) coupé(s)" : ""), CONS.eau);
    const de = m.reseaux.dechets || {}, ep = m.reseaux.epuration || {};
    h += ligne("🗑️", "Déchets ramassés", de.offre || 0, de.demande || 0, "place pour traiter / déchets jetés" + (de.recycle ? " (♻️ déjà −" + Math.round(de.recycle * 100) + " %)" : ""), CONS.dechets);
    if ((ep.eauxUsees || 0) > 0) h += ligne("🚽", "Eaux usées nettoyées", ep.capacite || 0, ep.eauxUsees || 0, "nettoyées / eau utilisée", CONS.epuration);
    h += ligne("💼", "Emplois", b.emplois, b.actifs, "emplois / habitants qui travaillent", CONS.emploi);
    h += ligne("🍞", "Nourriture", b.nourris, H, "habitants nourris / habitants", CONS.nourriture);
    h += ligne("🏭", "Biens fabriqués", b.fabriques, H, "habitants servis / habitants", "des zones 🏭 industrie");
    h += ligne("🛍️", "Biens vendus", b.vendus, H, "habitants servis / habitants", "des zones 🛍️ commerce");
    h += "<h4>🏛️ Les services (habitants couverts)</h4>";
    for (const [id, emoji, nom] of [["education", "🎓", "Éducation"], ["sante", "🏥", "Santé"], ["securite", "🚓", "Police"], ["feu", "🚒", "Pompiers"], ["loisirs", "🎡", "Loisirs"]]) h += ligne(emoji, nom, b.couverts[id] || 0, H, "habitants couverts", CONS[id]);
    h += "<h4>😊 Le bonheur : " + m.bonheur + " %</h4><p><small>La moyenne des besoins (avec leur poids). Une ville heureuse grandit vite.</small></p>";
    for (const x of C.besoins) { if ((x.palier || 0) > m.palier) continue; const v = m.besoins[x.id] || 0; h += "<div class='ligne'><span>" + x.emoji + " " + x.nom + "</span>" + barreHTML(v) + "<small>" + Math.round(v * 100) + " %</small></div>"; }
    const suivant = C.paliers[m.palier + 1];
    h += "<h4>👥 La population</h4><p>" + fr(s.habitants) + " habitants · " + fr(s.emplois) + " emplois · " + fr(s.chomeurs) + " chômeurs</p>";
    if (suivant) h += "<p>Prochain palier : " + suivant.emoji + " " + suivant.nom + " à " + fr(suivant.habitants) + " habitants" + barreHTML(s.habitants / suivant.habitants, "#7a5ab0") + "</p>";
    return h;
  }
  // 🎯 Ce que couvrirait ce service, en plus de ceux qui existent déjà : le nombre de terrains peints (habitations…)
  function couvertureNouvelle(m, f) {
    const B = f && f.sorte === "batiment" ? C.batiments[f.valeur] : null;
    if (!B || !B.service || !B.rayon) return null;
    const cv = m.couverture[B.service]; let neufs = 0, deja = 0;
    Megalopole.Services.cercle(m, { colonne: f.colonne, ligne: f.ligne, taille: f.taille }, B.rayon * Megalopole.Budget.facteurRayon(m, B), (i) => { if (m.zone[i]) cv[i] ? deja++ : neufs++; });
    return "🎯 +" + neufs + " terrain(s) couvert(s)" + (deja ? " · " + deja + " déjà couvert(s)" : "");
  }
  // 🎓 La page des missions : la mission en cours (avec 👉 Montre-moi et Passer), puis la liste de toutes les missions
  function guideHTML(m) {
    const G = C.guide.missions, g = Megalopole.Guide.progres(m), etape = m.guide ? m.guide.etape : G.length;
    let h = "<h3>🎓 Les missions du guide</h3>";
    if (g) h += "<div class='mission'><b>Mission " + g.numero + " / " + g.total + " : " + g.mission.emoji + " " + g.mission.titre + "</b><p>" + g.mission.texte + "</p>" + barreHTML(g.fait, "#7a5ab0") + "<div class='pied'><small>" + g.detail + "</small>" + (g.mission.groupe ? "<button data-guide='montrer-moi'>👉 Montre-moi</button>" : "") + "<button data-guide='passer' class='passer'>Passer ⏭️</button></div></div>";
    else h += "<div class='mission'><b>🎉 Bravo, tu as fini le guide !</b><p>Maintenant, écoute ce que réclament les habitants (📢) et regarde les besoins (😊).</p></div>";
    h += "<ul class='liste-missions'>" + G.map((x, k) => "<li class='" + (k < etape ? "faite" : k === etape ? "encours" : "") + "'>" + (k < etape ? "✅" : k === etape ? "👉" : "⬜") + " " + (k + 1) + ". " + x.emoji + " " + x.titre + "</li>").join("") + "</ul>";
    return h;
  }
  // 🧾 Le tableau de bord du budget : la PRÉVISION du mois en cours (recalculée à chaque fois)
  function budgetHTML(m) {
    const Bu = C.budget, Bd = Megalopole.Budget, p = Bd.prevision(m), D = Bd.difficulte(m);
    const signe = (n) => (n >= 0 ? "+" : "−") + fr(Math.abs(n));
    const pm = (attr, moins, plus, milieu) => "<button data-" + attr + "='" + moins + "'>−</button><b>" + milieu + "</b><button data-" + attr + "='" + plus + "'>+</button>";
    let h = "<h3>🧾 Le budget · " + D.emoji + " " + D.nom + "</h3>";
    if (m.moisDansLeRouge > 0) h += "<div class='recl rouge'><b>⚠️ Caisse vide depuis " + m.moisDansLeRouge + " mois !</b><br><small>Encore " + (C.prets.moisDansLeRouge - m.moisDansLeRouge) + " mois sous zéro et le conseil renvoie le maire. Emprunte, baisse des budgets ou monte les impôts.</small></div>";
    h += "<div class='solde " + (p.solde >= 0 ? "vert" : "rouge") + "'>Solde prévu ce mois-ci : <b>" + signe(p.solde) + " 🪙</b><small>bilan dans " + Math.ceil(C.moisDuree - m.compteMois) + " s</small></div>";
    // ➕ les recettes : un impôt par zone
    h += "<h4>➕ Les impôts (de " + Bu.tauxMin + " à " + Bu.tauxMax + " %)</h4>";
    for (const z of C.ordreZones) {
      const t = m.taux[z], e = Bd.effetTaux(t);
      h += "<div class='bud'><span>" + C.zones[z].emoji + " " + C.zones[z].nom + "</span><span class='pm'>" + pm("taux", z + ":-1", z + ":1", t + " %") + "</span><small class='" + (e < 0 ? "mal" : "bien") + "'>envie " + (e >= 0 ? "+" : "") + e.toFixed(2).replace(".", ",") + "</small><span class='somme'>+" + fr(p.impots[z]) + "</span></div>";
    }
    if (p.touristes) h += "<div class='bud'><span>🎢 Touristes</span><span></span><span></span><span class='somme'>+" + fr(p.touristes) + "</span></div>";
    h += "<p><small>Au-dessus de " + Bu.tauxNeutre + " %, les gens ont moins envie de venir dans cette zone (et les habitants râlent au-dessus de " + Bu.impotSupportable + " % 🏠). En dessous, ils en ont plus envie… mais la caisse se remplit moins vite.</small></p>";
    // ➖ les dépenses : un budget par poste
    h += "<h4>➖ Les services (de 0 à 150 %)</h4>";
    for (const q of Bu.postes) {
      const f = Bd.poste(m, q.id), cout = q.id === "routes" ? p.routes : p.postes[q.id];
      h += "<div class='bud'><span>" + q.emoji + " " + q.nom + "</span><span class='pm'>" + pm("poste", q.id + ":-" + Bu.postePas, q.id + ":" + Bu.postePas, Math.round(f * 100) + " %") + "</span><small class='" + (f < 1 ? "mal" : "bien") + "'>" + (q.id === "routes" ? "état " + Math.round(m.etatRoutes * 100) + " %" : f <= 0 ? "fermé !" : "cercle × " + (Bu.rayonMin + (1 - Bu.rayonMin) * f).toFixed(2).replace(".", ",")) + "</small><span class='somme'>−" + fr(cout) + "</span></div>";
    }
    h += "<p><small>Moins d'argent = un plus petit cercle autour de chaque bâtiment (à 0 %, il ferme). Des routes mal payées s'abîment : bouchons et terrain moins cher. Au-dessus de 100 %, elles se réparent.</small></p>";
    h += "<h4>➖ Le reste</h4>";
    for (const [nom, v] of [["⚡ Centrales (entretien)", p.autres.energie], ["🔥 Carburant des centrales et pompes", p.carburant], ["💧 Eau (entretien)", p.autres.eau], ["🏛️ Mairie", p.autres.mairie], ["🏦 Prêts (mensualités)", p.prets]]) if (v) h += "<div class='bud'><span>" + nom + "</span><span></span><span></span><span class='somme'>−" + fr(v) + "</span></div>";
    h += "<div class='bud total'><span>= " + fr(p.recettes) + " − " + fr(p.depenses) + "</span><span></span><span></span><span class='somme'>" + signe(p.solde) + "</span></div>";
    if (m.dernierBudget) h += "<p><small>Le mois dernier : " + signe(m.dernierBudget.solde) + " 🪙</small></p>";
    // 🏦 la banque
    h += "<h4>🏦 La banque (" + m.prets.length + " / " + C.prets.max + " prêts)</h4><div class='banque'>";
    for (const o of C.prets.offres) {
      const r = Bd.raisonPret(m, o.montant), mens = Math.round((o.montant * C.prets.interet) / C.prets.mois);
      h += "<button data-pret='" + o.montant + "'" + (r ? " class='verrou' title='" + r.replace(/'/g, "’") + "'" : "") + "><b>" + (r ? "🔒 " : "") + fr(o.montant) + " 🪙</b><small>" + fr(mens) + " 🪙/mois × " + C.prets.mois + "</small></button>";
    }
    h += "</div><p><small>Tu rembourses " + Math.round((C.prets.interet - 1) * 100) + " % de plus que ce qu'on t'a prêté (les intérêts). Les gros prêts arrivent avec une plus grande ville.</small></p>";
    for (const pr of m.prets) h += "<div class='bud'><span>🏦 " + fr(pr.montant) + " 🪙</span><span></span><small>encore " + pr.reste + " mois</small><span class='somme'>−" + fr(pr.mensualite) + "</span></div>";
    if (m.historique.length > 1) h += graphique(m.historique);
    return h;
  }
  // Deux petites courbes : les habitants (bleu) et la caisse (or), mois après mois
  function graphique(hist) {
    const W = 290, Hh = 80, courbe = (cle, couleur) => {
      const vals = hist.map((x) => x[cle] || 0), max = Math.max(1, ...vals), min = Math.min(0, ...vals);
      return "<polyline points='" + vals.map((v, k) => ((k / (hist.length - 1)) * W).toFixed(1) + "," + (Hh - 3 - ((v - min) / (max - min || 1)) * (Hh - 6)).toFixed(1)).join(" ") + "' fill='none' stroke='" + couleur + "' stroke-width='2'/>";
    };
    return "<p><small>Mois après mois : <b style='color:#3f6fc4'>👥 habitants</b> · <b style='color:#b8860b'>🪙 caisse</b></small></p><svg width='100%' viewBox='0 0 " + W + " " + Hh + "' style='background:#f4f1e8;border-radius:6px'>" + courbe("habitants", "#3f6fc4") + courbe("argent", "#b8860b") + "</svg>";
  }

  // Ce que l'interface a reçu du joueur depuis la dernière fois (et on remet à zéro)
  function consommer() { const d = Object.assign({}, demandes); demandes.outil = undefined; demandes.taux = []; demandes.postes = []; demandes.pret = null; demandes.vitesse = null; demandes.calque = undefined; demandes.difficulte = null; demandes.guide = null; demandes.confirmer = false; demandes.annulerTrace = false; demandes.deplacer = false; return d; }

  return { initialiser, changerMonde, rafraichir, consommer, afficher, fermerTiroir, fermerPanneau, ouvrirTiroir, choisirDifficulte, renvoye, demandes };
})();
