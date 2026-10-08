// ⚡ L'ÉLECTRICITÉ : le réseau qui suit les routes
//
// Étape 34 : ✍️ « ajouter la gestion de l'énergie électrique, au fil des avancées dans le temps ». À l'époque industrielle,
// la CENTRALE à charbon brûle du charbon et fournit de l'électricité (config.js : « electricite »). Choix de Maxance :
// l'électricité suit les ROUTES (des poteaux le long des routes) : tout bâtiment relié par la route à une centrale qui
// tourne peut être alimenté.
// Mais une centrale a une puissance limitée ! Le réseau sert d'abord les bâtiments les plus PROCHES (par la route) ; quand
// il n'y a plus assez, les plus loin sont coupés : c'est une PÉNURIE. Il faut alors une centrale de plus.
// Ce que l'électricité change (choix de Maxance) : les ateliers vont 1,5 fois plus vite, les usines ne marchent pas sans,
// et c'est un nouveau besoin des habitants (⚡ dans le panneau 👥).

window.Village = window.Village || {};

Village.Electricite = (function () {
  const C = Village.CONFIG, E = C.electricite;
  const radio = Village.Evenements;
  const B = () => Village.Batiments;

  const active = (monde) => (monde.age || 0) >= E.age;
  // Combien consomme ce bâtiment ?
  function consommation(b) {
    if (b.type === "centrale" || b.etat !== "pret") return 0;
    if (E.consommation[b.type] !== undefined) return E.consommation[b.type];
    if (C.ateliers[b.type] && C.ateliers[b.type].electrique) return E.usine;
    if (C.logement[b.type] && b.type !== "entrepot") return E.logement;
    return B().TYPES[b.type].metier ? E.atelier : 0;
  }
  const centraleEnMarche = (b) => b.type === "centrale" && b.etat === "pret" && !!b.travail;

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 2;
    calculer(monde);
  }

  function calculer(monde) {
    const k = monde.carte, R = monde.route, col = k.colonnes;
    const etat = monde.electricite || (monde.electricite = { offre: 0, demande: 0, utilise: 0, alimentes: 0, coupes: 0, horsReseau: 0, penurie: false, routes: new Set() });
    for (const b of monde.batiments) b.courant = false;
    etat.routes = new Set();
    if (!active(monde)) { etat.offre = etat.demande = etat.utilise = etat.alimentes = etat.coupes = etat.horsReseau = 0; return etat; }
    // 1. La tache d'encre sur les routes, depuis chaque centrale qui tourne : la distance (en cases de route)
    const dist = new Map();
    let file = [];
    const centrales = monde.batiments.filter(centraleEnMarche);
    for (const c of centrales) for (const i of B().casesDe(c, k)) for (const d of [1, -1, col, -col]) { const j = i + d; if (j >= 0 && j < R.length && R[j] && !dist.has(j)) { dist.set(j, 0); file.push(j); } }
    while (file.length) {
      const suivante = [];
      for (const i of file) for (const d of [1, -1, col, -col]) {
        const j = i + d;
        if (j < 0 || j >= R.length || !R[j] || dist.has(j) || (d === 1 && j % col === 0) || (d === -1 && i % col === 0)) continue;
        dist.set(j, dist.get(i) + 1); suivante.push(j);
      }
      file = suivante;
    }
    etat.routes = new Set(dist.keys());
    // 2. Chaque bâtiment qui consomme : à quelle distance de route alimentée est-il ?
    const clients = [];
    let horsReseau = 0;
    for (const b of monde.batiments) {
      const besoin = consommation(b);
      if (!besoin) continue;
      let dmin = Infinity;
      for (const i of B().casesDe(b, k)) for (const d of [1, -1, col, -col]) { const j = i + d; if (dist.has(j) && dist.get(j) < dmin) dmin = dist.get(j); }
      if (dmin === Infinity) { horsReseau++; continue; }
      clients.push([dmin, besoin, b]);
    }
    // 3. Les plus proches d'abord, tant qu'il reste de la puissance
    clients.sort((a, c) => a[0] - c[0]);
    const offre = centrales.length * E.parCentrale;
    let utilise = 0, alimentes = 0, coupes = 0;
    for (const [, besoin, b] of clients) {
      if (utilise + besoin <= offre) { utilise += besoin; b.courant = true; alimentes++; } else coupes++;
    }
    const demande = clients.reduce((s, c) => s + c[1], 0);
    const penurie = coupes > 0;
    if (penurie !== etat.penurie) radio.emettre(penurie ? "electricite-penurie" : "electricite-ok", { offre, demande, coupes, centrales: centrales.length });
    Object.assign(etat, { offre, demande, utilise, alimentes, coupes, horsReseau, penurie });
    return etat;
  }

  // La part des lits qui ont l'électricité (pour le besoin ⚡ des habitants)
  function partLogements(monde) {
    let lits = 0, avec = 0;
    for (const b of monde.batiments) if (C.logement[b.type] && b.type !== "entrepot" && b.etat === "pret") { lits += C.logement[b.type]; if (b.courant) avec += C.logement[b.type]; }
    return lits ? avec / lits : 1;
  }

  return { active, consommation, calculer, etape, partLogements, centraleEnMarche };
})();
