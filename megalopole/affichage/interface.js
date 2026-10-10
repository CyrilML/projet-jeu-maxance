// 🧭 L'INTERFACE : le tableau de bord du maire
//
// Ce sont des morceaux de page (du HTML) posés par-dessus la carte :
//   - en haut, la BARRE : l'argent 🪙, les habitants 👥, le palier de la ville, le bonheur 😊, la date, et la DEMANDE
//     R C I A (4 petites barres : vers le haut = la ville en veut, vers le bas = il y en a trop) ;
//   - en bas, les OUTILS du maire, rangés par groupes (routes, zones, énergie, eau, services, loisirs, transports) ;
//   - à droite, le PANNEAU : les réclamations 📢, les besoins 😊, le budget 🧾, et ce qu'il y a sur la case touchée 🔎 ;
//     (étape 2) le budget 🧾 est un vrai tableau de bord : un impôt par zone, un curseur par service, la banque ;
//   - (étape 3) la bulle du GUIDE 🎓 (une mission à la fois), et la barre ✅ / ❌ pour construire un tracé fait au doigt ;
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
  const demandes = { outil: undefined, taux: [], postes: [], pret: null, vitesse: null, calque: undefined, difficulte: null, guide: null, confirmer: false, annulerTrace: false };
  const auDoigt = () => window.matchMedia && matchMedia("(pointer: coarse)").matches; // (un téléphone, une tablette)
  let groupeOuvert = null, onglet = "reclamations", monde = null;

  const prix = (base) => fr(Megalopole.Budget.prix(monde, base)); // (étape 2 : × la difficulté)
  // Les outils de chaque groupe : { sorte, valeur, emoji, nom, prix }
  function outilsDu(groupe) {
    if (groupe === "routes") return [
      { sorte: "route", valeur: "route", emoji: "🛣️", nom: "Route", prix: prix(C.routes.route.prix) + " 🪙/case", touche: "R" },
      { sorte: "route", valeur: "avenue", emoji: "🛤️", nom: "Avenue (2 fois et demie plus de voitures)", prix: prix(C.routes.avenue.prix) + " 🪙/case" },
      { sorte: "demolir", valeur: null, emoji: "🧨", nom: "Démolir", prix: prix(5) + " 🪙/case", touche: "B" },
    ];
    if (groupe === "zones") return C.ordreZones.map((z, k) => ({ sorte: "zone", valeur: z, emoji: C.zones[z].emoji, nom: "Zone " + C.zones[z].nom.toLowerCase() + " (lot " + C.placement.lot + "×" + C.placement.lot + ")", prix: prix(C.zones[z].prix * C.placement.lot * C.placement.lot) + " 🪙/lot", touche: String(k + 1), couleur: C.zones[z].couleur }))
      .concat([{ sorte: "dezoner", valeur: null, emoji: "🧽", nom: "Effacer la zone", prix: "gratuit" }]);
    return Object.entries(C.batiments).filter(([, B]) => B.groupe === groupe).map(([t, B]) => ({ sorte: "batiment", valeur: t, emoji: B.emoji, nom: B.nom, prix: prix(B.prix) + " 🪙 · " + prix(B.entretien) + "/mois", palier: B.palier }));
  }

  function initialiser(m) {
    monde = m;
    // les groupes d'outils
    const barre = $("outils");
    const main = document.createElement("button");
    main.className = "groupe"; main.dataset.groupe = "main"; main.innerHTML = "<span>✋</span><small>Regarder</small>";
    main.addEventListener("click", () => { demandes.outil = null; fermerTiroir(); });
    barre.appendChild(main);
    for (const g of C.groupes) {
      const b = document.createElement("button");
      b.className = "groupe"; b.dataset.groupe = g.id; b.innerHTML = "<span>" + g.emoji + "</span><small>" + g.nom + "</small>";
      b.addEventListener("click", () => (groupeOuvert === g.id ? fermerTiroir() : ouvrirTiroir(g.id)));
      barre.appendChild(b);
    }
    // les onglets du panneau
    for (const b of document.querySelectorAll("[data-onglet]")) b.addEventListener("click", () => { fermerTiroir(); onglet = onglet === b.dataset.onglet && $("panneau").classList.contains("ouvert") ? null : b.dataset.onglet; $("panneau").classList.toggle("ouvert", !!onglet); rafraichir(true); });
    // 🎓 le guide et ✅ / ❌ (les boutons sont redessinés : on écoute leur parent)
    $("guide").addEventListener("click", (e) => {
      const bt = e.target.closest("[data-guide]");
      if (!bt) return;
      const quoi = bt.dataset.guide;
      if (quoi === "montrer-moi") { const p = Megalopole.Guide.progres(monde); if (p && p.mission.groupe) { $("panneau").classList.remove("ouvert"); onglet = null; ouvrirTiroir(p.mission.groupe); } }
      else demandes.guide = quoi;
      dernierGuide = "";
    });
    $("confirmer").addEventListener("click", (e) => {
      if (e.target.closest("[data-oui]")) demandes.confirmer = true;
      if (e.target.closest("[data-non]")) demandes.annulerTrace = true;
    });
    // ✖ fermer le panneau (et la touche Échap)
    $("fermer-panneau").addEventListener("click", fermerPanneau);
    // les calques
    const lc = $("liste-calques");
    const aucun = document.createElement("button"); aucun.textContent = "🌍 Aucun"; aucun.addEventListener("click", () => { demandes.calque = null; lc.classList.remove("ouvert"); }); lc.appendChild(aucun);
    for (const [id, cq] of Object.entries(Megalopole.Peintre.CALQUES)) { const b = document.createElement("button"); b.textContent = cq.nom; b.addEventListener("click", () => { demandes.calque = id; lc.classList.remove("ouvert"); }); lc.appendChild(b); }
    $("bouton-calques").addEventListener("click", () => lc.classList.toggle("ouvert"));
    // (les boutons du budget sont redessinés 4 fois par seconde : on écoute leur parent, qui, lui, reste)
    $("contenu-panneau").addEventListener("click", (e) => {
      const bt = e.target.closest("[data-taux],[data-poste],[data-pret]");
      if (!bt) return;
      if (bt.dataset.taux) { const [zone, d] = bt.dataset.taux.split(":"); demandes.taux.push({ zone, d: +d }); }
      if (bt.dataset.poste) { const [id, d] = bt.dataset.poste.split(":"); demandes.postes.push({ id, d: +d }); }
      if (bt.dataset.pret) demandes.pret = +bt.dataset.pret;
      setTimeout(() => rafraichir(true), 30);
    });
    // le choix de la difficulté et l'écran « maire renvoyé »
    $("voile").addEventListener("click", (e) => { const bt = e.target.closest("[data-difficulte]"); if (bt) { demandes.difficulte = bt.dataset.difficulte; fermerVoile(); } if (e.target.closest("[data-annuler]")) fermerVoile(); });
    for (const b of document.querySelectorAll("[data-vitesse]")) b.addEventListener("click", () => (demandes.vitesse = +b.dataset.vitesse));
    // les messages
    for (const [nom, f] of Object.entries(MESSAGES)) radio.ecouter(nom, (d) => afficher(f(d)));
  }
  function changerMonde(m) { monde = m; dernierHTML = ""; }

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
      b.innerHTML = "<span class='emoji'" + (o.couleur ? " style='background:" + o.couleur + "'" : "") + ">" + o.emoji + "</span><b>" + o.nom + "</b><small>" + (verrou ? "🔒 " + C.paliers[o.palier].emoji + " " + C.paliers[o.palier].nom + " (" + fr(C.paliers[o.palier].habitants) + " hab.)" : o.prix) + "</small>";
      b.title = o.nom;
      b.addEventListener("click", () => { if (verrou) { afficher("🔒 " + o.nom + " : il faut d'abord être un(e) " + C.paliers[o.palier].nom.toLowerCase() + " (" + fr(C.paliers[o.palier].habitants) + " habitants)"); return; } demandes.outil = { sorte: o.sorte, valeur: o.valeur }; fermerTiroir(); });
      t.appendChild(b);
    }
    const x = document.createElement("button"); x.className = "fermer"; x.textContent = "✖"; x.title = "Fermer";
    x.addEventListener("click", fermerTiroir); t.prepend(x); // (en premier, et collé à gauche : toujours visible)
    t.classList.add("ouvert");
    marquerGroupes();
  }
  function fermerPanneau() { onglet = null; $("panneau").classList.remove("ouvert"); rafraichir(true); }
  function fermerTiroir() { groupeOuvert = null; $("tiroir").classList.remove("ouvert"); marquerGroupes(); }
  function marquerGroupes() {
    const p = monde && Megalopole.Guide.progres(monde), montre = p && !monde.guide.cache && !monde.outil && !groupeOuvert ? p.mission.groupe : null;
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
    "eau-penurie": (d) => "💧❌ Pénurie d'eau : " + d.coupes + " bâtiment(s) sans eau. Une station de pompage de plus !",
    "reclamation": (d) => "📢 Les habitants réclament : " + d.emoji + " " + d.texte,
    "budget-mois": (d) => (d.solde < 0 ? "🧾 Ce mois-ci, la ville a perdu " + fr(-d.solde) + " 🪙 !" : null),
    "impots-changes": (d) => "🧾 Impôts " + d.emoji + " " + d.zone.toLowerCase() + " : " + d.taux + " % (" + (d.effet >= 0 ? "envie +" : "envie ") + d.effet.toFixed(2).replace(".", ",") + ")",
    "budget-poste": (d) => "🧾 Budget " + d.poste.toLowerCase() + " : " + d.budget + " %",
    "pret": (d) => "🏦 La banque te prête " + fr(d.montant) + " 🪙 : tu rembourseras " + fr(d.mensualite) + " 🪙 par mois pendant " + d.mois + " mois",
    "pret-refuse": (d) => "🏦❌ Prêt refusé : " + d.raison,
    "pret-rembourse": (d) => "🏦✅ Le prêt de " + fr(d.montant) + " 🪙 est remboursé !",
    "routes-abimees": (d) => "🛣️⚠️ Les routes s'abîment (" + d.etat + " %) : augmente leur budget dans 🧾",
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
    $("palier").textContent = P.emoji + " " + P.nom;
    $("bonheur").textContent = (m.bonheur >= 75 ? "😄" : m.bonheur >= 55 ? "🙂" : m.bonheur >= 40 ? "😐" : "😟") + " " + m.bonheur + " %";
    const an = Math.floor(m.mois / 12) + 1, mois = (m.mois % 12) + 1, soleil = Megalopole.Reseaux.soleil(m);
    $("date").textContent = (soleil > 0.15 ? "☀️" : "🌙") + " mois " + mois + " · an " + an;
    for (const z of C.ordreZones) {
      const v = m.demande[z] || 0, barre = $("rci-" + z);
      barre.style.height = Math.round(Math.abs(v) * 22) + "px";
      barre.style.bottom = v >= 0 ? "26px" : 26 - Math.round(Math.abs(v) * 22) + "px";
      barre.style.background = v >= 0 ? C.zones[z].couleur : "#c8443a";
    }
    for (const b of document.querySelectorAll("[data-vitesse]")) b.classList.toggle("actif", +b.dataset.vitesse === Megalopole.vitesse);
    $("bouton-calques").textContent = "🗺️ " + (Megalopole.calque ? Megalopole.Peintre.CALQUES[Megalopole.calque].nom : "Calques");
    // l'outil en cours (au doigt : 1 doigt bouge la carte, on TOUCHE le départ puis l'arrivée)
    const o = m.outil, tr = m.trace && m.trace.doigt ? m.trace : null, trace = o && o.sorte !== "batiment";
    const fa = m.fantome && m.fantome.doigt ? m.fantome : null, aimant = o && (o.sorte === "batiment" || o.sorte === "zone");
    $("outil-en-cours").textContent = !o ? "" : auDoigt() ? "🖌️ " + nomOutil(o) + (aimant ? " · touche près d'une route" : " · touche le départ") + " · ✋ = arrêter" : "🖌️ " + nomOutil(o) + (aimant ? " · clique près d'une route (il s'y colle 🧲)" : " · glisse sur la carte") + " · Échap pour arrêter";
    $("outil-en-cours").classList.toggle("visible", !!o && !tr && !fa);
    // ✅ / ❌ : le tracé fait au doigt attend qu'on confirme
    let hc = "";
    if (fa) { // 👻 le fantôme posé au doigt
      const prix = fa.sorte === "batiment" ? Megalopole.Budget.prix(m, C.batiments[fa.valeur].prix) : Megalopole.Construction.evaluerZone(m, fa.cases, fa.valeur).prix;
      hc = "<span>" + nomOutil(o) + (fa.sorte === "zone" ? " · lot " + fa.taille + "×" + fa.taille : "") + " · <b>" + fr(prix) + " 🪙</b>" + (fa.raison ? "<br><b class='mal'>🚫 " + fa.raison + "</b>" : "<br><small>" + (fa.collee ? "🧲 collé à la route · " : "⚠️ loin d'une route · ") + "retouche pour déplacer</small>") + "</span>" + (fa.raison ? "" : "<button data-oui='1' class='oui'>✅ Construire</button>") + "<button data-non='1' class='non'>❌</button>";
    } else if (tr && trace) {
      const cases = Megalopole.Monde.casesDuTrace(o, tr);
      const e = o.sorte === "route" ? Megalopole.Construction.evaluerRoute(m, cases, o.valeur) : o.sorte === "zone" ? Megalopole.Construction.evaluerZone(m, cases, o.valeur) : null;
      hc = tr.pret ? "<span>" + nomOutil(o) + " · " + cases.length + " case(s)" + (e ? " · <b>" + fr(e.prix) + " 🪙</b>" : "") + "<br><small>retouche pour changer l'arrivée</small></span><button data-oui='1' class='oui'>✅ " + (o.sorte === "demolir" ? "Démolir" : o.sorte === "dezoner" ? "Effacer" : "Construire") + "</button>"
        : "<span>👆 Touche maintenant l'<b>arrivée</b><br><small>(1 doigt pour bouger la carte)</small></span>";
      hc += "<button data-non='1' class='non'>❌</button>";
    }
    if (hc !== dernierConfirmer) { $("confirmer").innerHTML = hc; dernierConfirmer = hc; }
    $("confirmer").classList.toggle("visible", !!hc);
    // 🎓 la bulle du guide
    const g = Megalopole.Guide.progres(m);
    let hg = "";
    if (g && m.guide.cache) hg = "<button data-guide='montrer' class='petit-guide'>🎓 Le guide</button>";
    else if (g) hg = "<div class='bulle'><div class='tete'><b>🎓 Mission " + g.numero + " / " + g.total + " : " + g.mission.emoji + " " + g.mission.titre + "</b><button data-guide='cacher' class='fermer' title='Cacher le guide'>✖</button></div><p>" + g.mission.texte + "</p>" + barreHTML(g.fait, "#7a5ab0") + "<div class='pied'><small>" + g.detail + "</small>" + (g.mission.groupe ? "<button data-guide='montrer-moi'>👉 Montre-moi</button>" : "") + "<button data-guide='passer' class='passer'>Passer ⏭️</button></div></div>";
    if (hg !== dernierGuide) { $("guide").innerHTML = hg; dernierGuide = hg; marquerGroupes(); }
    $("guide").classList.toggle("compact", !!o); // (un outil en main : la bulle se fait toute petite, pour laisser voir la carte)
    // la case touchée ouvre l'onglet 🔎
    if (m.selection && m.selection !== dejaVue) { dejaVue = m.selection; onglet = "case"; $("panneau").classList.add("ouvert"); }
    for (const b of document.querySelectorAll("[data-onglet]")) b.classList.toggle("actif", b.dataset.onglet === onglet && $("panneau").classList.contains("ouvert"));
    if ($("panneau").classList.contains("ouvert")) { const html = contenu(onglet); if (html !== dernierHTML) { $("contenu-panneau").innerHTML = html; dernierHTML = html; } } // (seulement s'il a changé : sinon un bouton disparaît sous le doigt)
  }
  let dejaVue = null, dernierHTML = "", dernierGuide = "", dernierConfirmer = "";
  function nomOutil(o) {
    if (o.sorte === "route") return C.routes[o.valeur].nom;
    if (o.sorte === "zone") return "Zone " + C.zones[o.valeur].nom.toLowerCase();
    if (o.sorte === "batiment") return C.batiments[o.valeur].emoji + " " + C.batiments[o.valeur].nom;
    return o.sorte === "demolir" ? "Démolir" : "Effacer la zone";
  }

  const barreHTML = (v, couleur) => "<span class='barre'><span style='width:" + Math.round(Math.max(0, Math.min(1, v)) * 100) + "%;background:" + (couleur || (v >= 0.75 ? "#3d8a4a" : v < 0.4 ? "#c8443a" : "#d9a030")) + "'></span></span>";
  function contenu(o) {
    const m = monde, s = m.stats;
    if (o === "reclamations") {
      let h = "<h3>📢 Ce que réclament les habitants</h3>";
      if (!s.habitants) return h + "<p>Pas encore d'habitants. Commence par : 🛣️ une route, ⚡ une centrale (ou des éoliennes) touchant la route, puis peins des zones 🏠 habitation, 🛍️ commerce et 🏭 industrie le long de la route.</p>";
      if (!m.reclamations.length) return h + "<p>😄 Tout le monde est content ! La ville grandit toute seule.</p>";
      return h + m.reclamations.slice(0, 7).map((r) => "<div class='recl'><b>" + r.emoji + " " + r.texte + "</b><br><small>💡 " + r.conseil + "</small></div>").join("");
    }
    if (o === "besoins") {
      let h = "<h3>😊 Le bonheur : " + m.bonheur + " %</h3><p><small>La moyenne des besoins (avec leur poids). Une ville heureuse grandit vite.</small></p>";
      for (const x of C.besoins) { if ((x.palier || 0) > m.palier) continue; const v = m.besoins[x.id] || 0; h += "<div class='ligne'><span>" + x.emoji + " " + x.nom + "</span>" + barreHTML(v) + "<small>" + Math.round(v * 100) + " %</small></div>"; }
      h += "<h3>👥 La population</h3><p>" + fr(s.habitants) + " habitants · " + fr(s.emplois) + " emplois (🛍️ " + fr(s.commerce) + " · 🏭 " + fr(s.industrie) + " · 🌾 " + fr(s.agriculture) + ") · " + fr(s.chomeurs) + " chômeurs</p>";
      const suivant = C.paliers[m.palier + 1];
      if (suivant) h += "<p>Prochain palier : " + suivant.emoji + " " + suivant.nom + " à " + fr(suivant.habitants) + " habitants" + barreHTML(s.habitants / suivant.habitants, "#7a5ab0") + "</p>";
      return h;
    }
    if (o === "budget") return budgetHTML(m);
    // 🔎 la case touchée
    const sel = m.selection;
    if (!sel) return "<h3>🔎 Une case</h3><p>Choisis ✋, puis touche une case de la carte pour voir ce qu'il y a.</p>";
    const n = m.carte.colonnes, i = sel.ligne * n + sel.colonne, Z = Megalopole.Zones, b = Megalopole.Construction.batimentSur(m, i);
    let h = "";
    if (b) {
      const B = C.batiments[b.type];
      h += "<h3>" + B.emoji + " " + B.nom + "</h3>";
      if (B.courant) h += "<p>⚡ Produit " + (b.production || 0) + " / " + B.courant + " unités" + (B.vent ? " (le vent change)" : B.soleil ? " (rien la nuit !)" : "") + "</p><p>Réseau : " + fr(m.reseaux.courant.utilise || 0) + " / " + fr(m.reseaux.courant.offre || 0) + " utilisés · demande " + fr(m.reseaux.courant.demande || 0) + "</p>";
      if (B.eau) h += "<p>💧 Pompe " + (b.productionEau || 0) + " / " + B.eau + " unités" + (b.productionEau ? "" : " (il lui faut l'électricité !)") + "</p><p>Réseau : " + fr(m.reseaux.eau.utilise || 0) + " / " + fr(m.reseaux.eau.offre || 0) + " · demande " + fr(m.reseaux.eau.demande || 0) + "</p>";
      if (B.rayon) h += "<p>🎯 Sert un cercle de " + B.rayon + " cases" + (b.marche === false && B.service !== "loisirs" ? " — ⚠️ <b>pas d'électricité</b> : il ne marche pas !" : "") + "</p>";
      if (B.trafic) h += "<p>🚗 Enlève " + Math.round(B.trafic * 100) + " % du trafic autour</p>";
      if (B.joie) h += "<p>😊 +" + B.joie + " de bonheur pour toute la ville</p>";
      if (b.rayon !== undefined && b.rayon !== B.rayon) h += "<p>🧾 Budget " + C.budget.postes.find((q) => q.id === B.poste).nom.toLowerCase() + " à " + Math.round(Megalopole.Budget.poste(m, B.poste) * 100) + " % : cercle de " + b.rayon.toFixed(1).replace(".", ",") + " cases</p>";
      h += "<p>🔧 Entretien : " + fr(Megalopole.Budget.prix(m, B.entretien) * (B.poste ? Megalopole.Budget.poste(m, B.poste) : 1)) + " 🪙 par mois</p>";
      return h;
    }
    const z = Z.lettre(m, i), ter = m.carte.terrain[i];
    if (m.route[i]) h += "<h3>" + (m.route[i] === 2 ? "🛤️ Avenue" : "🛣️ Route") + "</h3><p>🚗 Trafic : " + Math.round(m.trafic[i] * 100) + " %" + (m.trafic[i] > 1 ? " — 🚧 <b>bouchon !</b> (une avenue, un arrêt de bus…)" : "") + "</p>";
    else if (z) {
      const nv = m.niveau[i], Zc = C.zones[z], nm = Z.niveauMax(m, i), e = Z.envie(m, i);
      h += "<h3>" + Zc.emoji + " " + Zc.niveaux[nv] + " <small>(niveau " + nv + ")</small></h3>";
      h += "<p>" + (z === "R" ? "👥 " + Zc.gens[nv] + " habitants" : "💼 " + Zc.gens[nv] + " emplois") + "</p>";
      h += "<p>📈 Peut monter jusqu'au niveau " + nm.max + (nm.manque && nm.max < 6 ? " — il lui faut : <b>" + nm.manque + "</b>" : "") + "</p>";
      h += "<p>💗 Envie d'y venir : " + (e > C.croissance.seuil ? "oui" : e < -0.4 ? "non, les gens partent" : "pas assez") + " (" + e.toFixed(2).replace(".", ",") + ")</p>";
    } else h += "<h3>" + (ter === 1 ? "🌊 Eau" : m.carte.arbre[i] ? "🌳 Forêt" : ter === 2 ? "🏖️ Sable" : "🌱 Herbe") + "</h3>";
    h += "<div class='ligne'><span>💎 Valeur</span>" + barreHTML(m.valeur[i], "#3d8a4a") + "<small>" + m.valeur[i].toFixed(2).replace(".", ",") + "</small></div>";
    h += "<div class='ligne'><span>🌫️ Pollution</span>" + barreHTML(m.pollution[i], "#8a6a4a") + "<small>" + Math.round(m.pollution[i] * 100) + " %</small></div>";
    h += "<p>" + (m.routeProche[i] >= 0 ? "🛣️ près d'une route" : "🚫 trop loin d'une route") + " · " + (m.courant[i] ? "⚡ ✅" : "⚡ ❌") + " · " + (m.eau[i] ? "💧 ✅" : "💧 ❌") + "</p>";
    h += "<p>" + Megalopole.Services.TYPES.map((t) => ({ education: "🎓", sante: "🏥", securite: "🚓", feu: "🚒", loisirs: "🎡", transport: "🚌" }[t] + (m.couverture[t][i] ? "✅" : "❌"))).join(" ") + "</p>";
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
  function consommer() { const d = Object.assign({}, demandes); demandes.outil = undefined; demandes.taux = []; demandes.postes = []; demandes.pret = null; demandes.vitesse = null; demandes.calque = undefined; demandes.difficulte = null; demandes.guide = null; demandes.confirmer = false; demandes.annulerTrace = false; return d; }

  return { initialiser, changerMonde, rafraichir, consommer, afficher, fermerTiroir, fermerPanneau, ouvrirTiroir, choisirDifficulte, renvoye, demandes };
})();
