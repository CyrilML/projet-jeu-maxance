// 🧾 LE BUDGET : le trésorier de la ville
//
// Étape 2 : ✍️ « La gestion des impôts et des coûts sera importante : il faut bien réfléchir et paramétrer le système. »
// Choix de Maxance : un taux d'impôt PAR ZONE, un budget PAR SERVICE, des PRÊTS à la banque, et 3 DIFFICULTÉS.
//
// Chaque mois, le trésorier fait les comptes (comme une feuille de calcul) :
//
//   ➕ impôts 🏠 = habitants × leur revenu × taux 🏠      (le revenu dépend du niveau : un gratte-ciel est plus riche)
//   ➕ impôts 🛍️ 🏭 🌾 = emplois × leur revenu × taux de la zone
//   ➕ touristes (le parc d'attractions)
//   ➖ routes = cases × entretien × budget des routes
//   ➖ chaque service = son entretien × le budget de son poste (école → 🎓 Éducation, parc → 🎡 Loisirs…)
//   ➖ énergie et eau = l'entretien des centrales et des pompes + leur CARBURANT (selon ce qu'elles produisent vraiment)
//   ➖ les mensualités des prêts
//   = le SOLDE du mois, ajouté à la caisse
//
// Les curseurs ont un effet ! Un impôt trop haut fait fuir les gens de sa zone ; un service mal financé couvre un plus
// petit cercle (à 0 %, il ferme) ; des routes mal financées s'abîment (moins de voitures passent, le terrain vaut moins).
// Et une caisse vide trop longtemps… le conseil municipal renvoie le maire !

window.Megalopole = window.Megalopole || {};

Megalopole.Budget = (function () {
  const C = Megalopole.CONFIG, Bu = C.budget;
  const radio = Megalopole.Evenements;

  const difficulte = (monde) => C.difficultes[monde.difficulte] || C.difficultes.normal;
  // Ce que coûte vraiment quelque chose (× la difficulté)
  const prix = (monde, base) => Math.round(base * difficulte(monde).couts);
  const poste = (monde, id) => (monde.postes[id] === undefined ? 1 : monde.postes[id]);
  // Le cercle d'un service, selon son budget : × (0,4 + 0,6 × budget) ; 0 s'il n'a plus d'argent
  function facteurRayon(monde, B) {
    if (!B.poste) return 1;
    const f = poste(monde, B.poste);
    return f <= 0 ? 0 : Bu.rayonMin + (1 - Bu.rayonMin) * f;
  }
  // L'effet d'un impôt sur l'envie de venir dans sa zone (de −0,55 à +0,27)
  function effetTaux(t) { return t > Bu.tauxNeutre ? -(t - Bu.tauxNeutre) * Bu.malusParPoint : (Bu.tauxNeutre - t) * Bu.bonusParPoint; }

  // La prévision du mois (le trésorier la recalcule quand on veut : c'est ce que montre le panneau 🧾)
  function prevision(monde) {
    const Z = C.zones, N = monde.zone.length, impots = { R: 0, C: 0, I: 0, A: 0 }, assiette = { R: 0, C: 0, I: 0, A: 0 };
    for (let i = 0; i < N; i++) {
      const z = Megalopole.Zones.LETTRE[monde.zone[i]], nv = monde.niveau[i];
      if (!z || !nv) continue;
      assiette[z] += Z[z].gens[nv] * Bu.revenus[z][nv]; // tout ce que gagnent les gens de cette zone
    }
    for (const z of C.ordreZones) impots[z] = Math.round((assiette[z] * monde.taux[z]) / 100);
    const k = difficulte(monde).couts;
    let routes = 0;
    for (let i = 0; i < N; i++) if (monde.route[i]) routes += monde.route[i] === 2 ? C.routes.avenue.entretien : C.routes.route.entretien;
    routes = Math.round(routes * poste(monde, "routes") * k);
    const postes = {}, autres = { energie: 0, eau: 0, mairie: 0 };
    for (const p of Bu.postes) if (p.id !== "routes") postes[p.id] = 0;
    for (const b of monde.batiments) {
      const B = C.batiments[b.type];
      if (B.poste) postes[B.poste] += B.entretien * poste(monde, B.poste) * k;
      else autres[B.groupe === "energie" ? "energie" : B.groupe === "eau" ? "eau" : "mairie"] += B.entretien * k;
    }
    for (const id in postes) postes[id] = Math.round(postes[id]);
    // le carburant : la part de la production vraiment utilisée
    const el = monde.reseaux.courant, ea = monde.reseaux.eau, partEl = el.offre ? el.utilise / el.offre : 0, partEa = ea.offre ? ea.utilise / ea.offre : 0;
    let carburant = 0;
    for (const b of monde.batiments) {
      const c = Bu.carburant[b.type];
      if (!c) continue;
      carburant += (C.batiments[b.type].courant ? (b.production || 0) * partEl : (b.productionEau || 0) * partEa) * c * k;
    }
    carburant = Math.round(carburant);
    autres.energie = Math.round(autres.energie); autres.eau = Math.round(autres.eau); autres.mairie = Math.round(autres.mairie);
    const prets = monde.prets.reduce((s, p) => s + p.mensualite, 0);
    const touristes = Math.round(monde.batiments.reduce((t, b) => t + (C.batiments[b.type].touristes || 0), 0) * monde.stats.habitants * 0.02);
    const recettes = impots.R + impots.C + impots.I + impots.A + touristes;
    const depenses = routes + Object.values(postes).reduce((a, b) => a + b, 0) + autres.energie + autres.eau + autres.mairie + carburant + prets;
    return { impots, assiette, touristes, routes, postes, autres, carburant, prets, recettes, depenses, solde: recettes - depenses };
  }

  // Le bilan du mois : on applique la prévision
  function mois(monde) {
    const b = prevision(monde);
    monde.argent += b.solde;
    monde.mois++;
    monde.dernierBudget = b;
    // les prêts : une mensualité de moins
    for (const p of monde.prets) p.reste--;
    const finis = monde.prets.filter((p) => p.reste <= 0);
    monde.prets = monde.prets.filter((p) => p.reste > 0);
    for (const p of finis) radio.emettre("pret-rembourse", { montant: p.montant });
    // les routes s'usent (budget < 100 %) ou se réparent (budget > 100 %)
    const f = poste(monde, "routes"), avant = monde.etatRoutes;
    monde.etatRoutes = Math.max(0, Math.min(1, monde.etatRoutes + (f - 1) * Bu.usureRoutes));
    if (avant >= 0.6 && monde.etatRoutes < 0.6) radio.emettre("routes-abimees", { etat: Math.round(monde.etatRoutes * 100) });
    // la caisse vide
    if (monde.argent < 0) {
      monde.moisDansLeRouge++;
      const reste = C.prets.moisDansLeRouge - monde.moisDansLeRouge;
      if (reste <= 0) { monde.renvoye = true; radio.emettre("maire-renvoye", { mois: monde.moisDansLeRouge, argent: Math.round(monde.argent) }); }
      else if ([1, 6, 9, 11].includes(monde.moisDansLeRouge)) radio.emettre("caisse-vide", { mois: monde.moisDansLeRouge, reste, argent: Math.round(monde.argent) });
    } else monde.moisDansLeRouge = 0;
    monde.historique.push({ habitants: monde.stats.habitants, argent: Math.round(monde.argent), bonheur: monde.bonheur, solde: b.solde });
    if (monde.historique.length > 60) monde.historique.shift();
    radio.emettre("budget-mois", { mois: monde.mois, argent: Math.round(monde.argent), recettes: b.recettes, depenses: b.depenses, solde: b.solde, impots: b.impots, carburant: b.carburant, prets: b.prets });
  }

  // 🏦 Emprunter (null = d'accord, sinon la raison)
  function raisonPret(monde, montant) {
    const o = C.prets.offres.find((x) => x.montant === montant);
    if (!o) return "la banque ne prête pas cette somme";
    if (Megalopole.Population.palier(monde) < o.palier) return "la banque ne prête pas autant à un(e) " + C.paliers[Megalopole.Population.palier(monde)].nom.toLowerCase() + " (il faut être un(e) " + C.paliers[o.palier].nom.toLowerCase() + ")";
    if (monde.prets.length >= C.prets.max) return "pas plus de " + C.prets.max + " prêts en même temps";
    return null;
  }
  function emprunter(monde, montant) {
    const r = raisonPret(monde, montant);
    if (r) { radio.emettre("pret-refuse", { montant, raison: r }); return false; }
    const mensualite = Math.round((montant * C.prets.interet) / C.prets.mois);
    monde.prets.push({ montant, reste: C.prets.mois, mensualite });
    monde.argent += montant;
    radio.emettre("pret", { montant, mensualite, mois: C.prets.mois, total: mensualite * C.prets.mois, argent: Math.round(monde.argent) });
    return true;
  }

  function changerTaux(monde, z, d) {
    const avant = monde.taux[z];
    monde.taux[z] = Math.max(Bu.tauxMin, Math.min(Bu.tauxMax, avant + d));
    if (monde.taux[z] !== avant) radio.emettre("impots-changes", { zone: C.zones[z].nom, emoji: C.zones[z].emoji, taux: monde.taux[z], effet: effetTaux(monde.taux[z]) });
  }
  function changerPoste(monde, id, d) {
    const avant = poste(monde, id), apres = Math.max(Bu.posteMin, Math.min(Bu.posteMax, Math.round((avant + d) * 10) / 10));
    monde.postes[id] = apres;
    if (apres !== avant) radio.emettre("budget-poste", { poste: Bu.postes.find((p) => p.id === id).nom, budget: Math.round(apres * 100) });
  }

  function etape(monde, dt) {
    monde.compteMois += dt;
    if (monde.compteMois >= C.moisDuree) { monde.compteMois -= C.moisDuree; mois(monde); }
  }

  return { difficulte, prix, poste, facteurRayon, effetTaux, prevision, mois, raisonPret, emprunter, changerTaux, changerPoste, etape };
})();
