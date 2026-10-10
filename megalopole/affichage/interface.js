// 🧭 L'INTERFACE : le tableau de bord du maire
//
// Ce sont des morceaux de page (du HTML) posés par-dessus la carte :
//   - en haut, la BARRE : l'argent 🪙, les habitants 👥, le palier de la ville, le bonheur 😊, la date, et la DEMANDE
//     R C I A (4 petites barres : vers le haut = la ville en veut, vers le bas = il y en a trop) ;
//   - en bas, les OUTILS du maire, rangés par groupes (routes, zones, énergie, eau, services, loisirs, transports) ;
//   - à droite, le PANNEAU : les réclamations 📢, les besoins 😊, le budget 🧾, et ce qu'il y a sur la case touchée 🔎 ;
//   - les CALQUES 🗺️ : voir le courant, l'eau, la valeur du terrain, la pollution, le trafic, les services…
// L'interface ne change jamais le monde elle-même : elle range ce que veut le joueur dans « demandes », que main.js
// donne au monde au pas suivant.

window.Megalopole = window.Megalopole || {};

Megalopole.Interface = (function () {
  const C = Megalopole.CONFIG;
  const radio = Megalopole.Evenements;
  const $ = (id) => document.getElementById(id);
  const fr = (n) => Math.round(n).toLocaleString("fr-FR");
  const demandes = { outil: undefined, taux: 0, vitesse: null, calque: undefined };
  let groupeOuvert = null, onglet = "reclamations", monde = null;

  // Les outils de chaque groupe : { sorte, valeur, emoji, nom, prix }
  function outilsDu(groupe) {
    if (groupe === "routes") return [
      { sorte: "route", valeur: "route", emoji: "🛣️", nom: "Route", prix: C.routes.route.prix + " 🪙/case", touche: "R" },
      { sorte: "route", valeur: "avenue", emoji: "🛤️", nom: "Avenue (2 fois et demie plus de voitures)", prix: C.routes.avenue.prix + " 🪙/case" },
      { sorte: "demolir", valeur: null, emoji: "🧨", nom: "Démolir", prix: "5 🪙/case", touche: "B" },
    ];
    if (groupe === "zones") return C.ordreZones.map((z, k) => ({ sorte: "zone", valeur: z, emoji: C.zones[z].emoji, nom: "Zone " + C.zones[z].nom.toLowerCase(), prix: C.zones[z].prix + " 🪙/case", touche: String(k + 1), couleur: C.zones[z].couleur }))
      .concat([{ sorte: "dezoner", valeur: null, emoji: "🧽", nom: "Effacer la zone", prix: "gratuit" }]);
    return Object.entries(C.batiments).filter(([, B]) => B.groupe === groupe).map(([t, B]) => ({ sorte: "batiment", valeur: t, emoji: B.emoji, nom: B.nom, prix: fr(B.prix) + " 🪙", palier: B.palier }));
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
    // les calques
    const lc = $("liste-calques");
    const aucun = document.createElement("button"); aucun.textContent = "🌍 Aucun"; aucun.addEventListener("click", () => { demandes.calque = null; lc.classList.remove("ouvert"); }); lc.appendChild(aucun);
    for (const [id, cq] of Object.entries(Megalopole.Peintre.CALQUES)) { const b = document.createElement("button"); b.textContent = cq.nom; b.addEventListener("click", () => { demandes.calque = id; lc.classList.remove("ouvert"); }); lc.appendChild(b); }
    $("bouton-calques").addEventListener("click", () => lc.classList.toggle("ouvert"));
    // (les boutons des impôts sont redessinés 4 fois par seconde : on écoute leur parent, qui, lui, reste)
    $("contenu-panneau").addEventListener("click", (e) => { const bt = e.target.closest("[data-taux]"); if (bt) { demandes.taux += +bt.dataset.taux; } });
    for (const b of document.querySelectorAll("[data-vitesse]")) b.addEventListener("click", () => (demandes.vitesse = +b.dataset.vitesse));
    // les messages
    for (const [nom, f] of Object.entries(MESSAGES)) radio.ecouter(nom, (d) => afficher(f(d)));
  }
  function changerMonde(m) { monde = m; }

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
    t.classList.add("ouvert");
    marquerGroupes();
  }
  function fermerTiroir() { groupeOuvert = null; $("tiroir").classList.remove("ouvert"); marquerGroupes(); }
  function marquerGroupes() { for (const b of document.querySelectorAll(".groupe")) b.classList.toggle("actif", b.dataset.groupe === groupeOuvert); }

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
    "impots-changes": (d) => "🧾 Impôts : " + d.taux + " %",
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
    // l'outil en cours
    const o = m.outil;
    $("outil-en-cours").textContent = o ? "🖌️ " + nomOutil(o) + " · touche (ou glisse) la carte · Échap pour arrêter" : "";
    $("outil-en-cours").classList.toggle("visible", !!o);
    // la case touchée ouvre l'onglet 🔎
    if (m.selection && m.selection !== dejaVue) { dejaVue = m.selection; onglet = "case"; $("panneau").classList.add("ouvert"); }
    for (const b of document.querySelectorAll("[data-onglet]")) b.classList.toggle("actif", b.dataset.onglet === onglet && $("panneau").classList.contains("ouvert"));
    if ($("panneau").classList.contains("ouvert")) { const html = contenu(onglet); if (html !== dernierHTML) { $("contenu-panneau").innerHTML = html; dernierHTML = html; } } // (seulement s'il a changé : sinon un bouton disparaît sous le doigt)
  }
  let dejaVue = null, dernierHTML = "";
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
    if (o === "budget") {
      const b = m.dernierBudget;
      let h = "<h3>🧾 Le budget de la ville</h3><div class='impots'>Impôts : <button data-taux='-1'>−</button> <b>" + m.taux + " %</b> <button data-taux='1'>+</button></div>";
      h += "<p><small>Plus d'impôts = plus d'argent, mais moins d'envie de venir (au-dessus de 9 %) et des habitants moins contents.</small></p>";
      if (b) h += "<p>Le mois dernier :<br>➕ impôts : " + fr(b.recettes) + " 🪙" + (b.touristes ? "<br>➕ touristes : " + fr(b.touristes) + " 🪙" : "") + "<br>➖ routes : " + fr(b.routes) + " 🪙<br>➖ bâtiments : " + fr(b.batiments) + " 🪙<br><b>= " + (b.solde >= 0 ? "+" : "") + fr(b.solde) + " 🪙</b></p>";
      else h += "<p>Le premier bilan arrive à la fin du mois (" + Math.ceil(C.moisDuree - m.compteMois) + " s).</p>";
      if (m.historique.length > 1) h += graphique(m.historique);
      return h;
    }
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
      h += "<p>🔧 Entretien : " + B.entretien + " 🪙 par mois</p>";
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
  // Une petite courbe des habitants (les derniers mois)
  function graphique(hist) {
    const W = 260, Hh = 70, max = Math.max(1, ...hist.map((x) => x.habitants));
    const pts = hist.map((x, k) => (k / (hist.length - 1)) * W + "," + (Hh - (x.habitants / max) * (Hh - 6) - 3)).join(" ");
    return "<p><small>👥 Les habitants, mois après mois :</small></p><svg width='" + W + "' height='" + Hh + "' style='background:#f4f1e8;border-radius:6px'><polyline points='" + pts + "' fill='none' stroke='#3f6fc4' stroke-width='2'/></svg>";
  }

  // Ce que l'interface a reçu du joueur depuis la dernière fois (et on remet à zéro)
  function consommer() { const d = Object.assign({}, demandes); demandes.outil = undefined; demandes.taux = 0; demandes.vitesse = null; demandes.calque = undefined; return d; }

  return { initialiser, changerMonde, rafraichir, consommer, afficher, fermerTiroir, ouvrirTiroir, demandes };
})();
