// ⚡🚰🚽 LES RÉSEAUX : l'électricité, l'eau courante et les égouts, qui suivent les routes
//
// Étape 34 : ✍️ « ajouter la gestion de l'énergie électrique, au fil des avancées dans le temps ». À l'époque industrielle,
// la CENTRALE à charbon brûle du charbon et fournit de l'électricité (config.js : « electricite »). Choix de Maxance :
// l'électricité suit les ROUTES (des poteaux le long des routes) : tout bâtiment relié par la route à une centrale qui
// tourne peut être alimenté.
// Mais une centrale a une puissance limitée ! Le réseau sert d'abord les bâtiments les plus PROCHES (par la route) ; quand
// il n'y a plus assez, les plus loin sont coupés : c'est une PÉNURIE. Il faut alors une centrale de plus.
// Ce que l'électricité change (choix de Maxance) : les ateliers vont 1,5 fois plus vite, les usines ne marchent pas sans,
// et c'est un nouveau besoin des habitants (⚡ dans le panneau 👥).
//
// Étape 35 : ✍️ l'EAU COURANTE et les ÉGOUTS marchent exactement pareil (choix de Maxance : « comme l'électricité ») :
//   🚰 la station de pompage (au bord de l'eau, avec de l'électricité) envoie l'eau dans des tuyaux sous les routes ;
//   🚽 la station d'épuration (avec de l'électricité) nettoie les eaux usées, elle aussi par les tuyaux des routes.
// Un seul outil, la fonction « distribuer », sert pour les 3 réseaux : seules les sources et les consommations changent.

window.Village = window.Village || {};

Village.Electricite = (function () {
  const C = Village.CONFIG, E = C.electricite;
  const radio = Village.Evenements;
  const B = () => Village.Batiments;

  const active = (monde) => (monde.age || 0) >= E.age;
  // Combien d'électricité consomme ce bâtiment ?
  function consommation(b) {
    if (b.type === "centrale" || b.etat !== "pret") return 0;
    if (E.consommation[b.type] !== undefined) return E.consommation[b.type];
    if (C.ateliers[b.type] && C.ateliers[b.type].electrique) return E.usine;
    if (C.logement[b.type] && b.type !== "entrepot") return E.logement;
    return B().TYPES[b.type].metier ? E.atelier : 0;
  }
  // Étape 35 : combien d'eau, combien d'égouts ? (config.js : « eau »)
  const consoEau = (b) => (b.etat !== "pret" ? 0 : C.eau.consommation[b.type] !== undefined ? C.eau.consommation[b.type] : C.logement[b.type] && b.type !== "entrepot" ? C.eau.logement : C.elevage.troupeaux[b.type] ? C.eau.elevage : 0);
  const consoEgout = (b) => (b.etat !== "pret" ? 0 : C.eau.consommation[b.type] !== undefined ? C.eau.consommation[b.type] : C.logement[b.type] && b.type !== "entrepot" ? C.eau.logement : C.ateliers[b.type] && C.ateliers[b.type].electrique ? C.eau.usine : 0);
  const centraleEnMarche = (b) => b.type === "centrale" && b.etat === "pret" && !!b.travail;
  const stationEnMarche = (type) => (b) => b.type === type && b.etat === "pret" && !!b.courant && !!b.ouvrier;

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 2;
    calculer(monde);
  }

  // Distribuer un réseau. reseau : TOUTES les sources construites (les fils et les tuyaux partent d'elles, même à l'arrêt) ;
  // enMarche(b) : celles qui fournissent vraiment ; parSource : combien chacune ; conso(b) : ce que b consomme ;
  // champ : le nom du drapeau posé sur chaque bâtiment servi (b.courant, b.eau, b.egout).
  function distribuer(monde, nom, reseau, enMarche, parSource, conso, champ, evenements) {
    const sources = reseau.filter(enMarche);
    const k = monde.carte, R = monde.route, col = k.colonnes;
    const etat = monde[nom] || (monde[nom] = { offre: 0, demande: 0, utilise: 0, alimentes: 0, coupes: 0, horsReseau: 0, penurie: false, routes: new Set() });
    for (const b of monde.batiments) b[champ] = false;
    // 1. La tache d'encre sur les routes, depuis chaque source : la distance (en cases de route)
    const dist = new Map();
    let file = [];
    for (const c of reseau) for (const i of B().casesDe(c, k)) for (const d of [1, -1, col, -col]) { const j = i + d; if (j >= 0 && j < R.length && R[j] && !dist.has(j)) { dist.set(j, 0); file.push(j); } }
    while (file.length) {
      const suivante = [];
      for (const i of file) for (const d of [1, -1, col, -col]) {
        const j = i + d;
        if (j < 0 || j >= R.length || !R[j] || dist.has(j) || (d === 1 && j % col === 0) || (d === -1 && i % col === 0)) continue;
        dist.set(j, dist.get(i) + 1); suivante.push(j);
      }
      file = suivante;
    }
    // 2. Chaque bâtiment qui consomme : à quelle distance d'une route servie ?
    const clients = [];
    let horsReseau = 0;
    for (const b of monde.batiments) {
      const besoin = conso(b);
      if (!besoin) continue;
      let dmin = Infinity;
      for (const i of B().casesDe(b, k)) for (const d of [1, -1, col, -col]) { const j = i + d; if (dist.has(j) && dist.get(j) < dmin) dmin = dist.get(j); }
      if (dmin === Infinity) { horsReseau++; continue; }
      clients.push([dmin, besoin, b]);
    }
    // 3. Les plus proches d'abord, tant qu'il en reste
    clients.sort((a, c) => a[0] - c[0]);
    const offre = sources.length * parSource;
    let utilise = 0, alimentes = 0, coupes = 0;
    for (const [, besoin, b] of clients) { if (utilise + besoin <= offre) { utilise += besoin; b[champ] = true; alimentes++; } else coupes++; }
    const demande = clients.reduce((s, c) => s + c[1], 0), penurie = coupes > 0;
    if (penurie !== etat.penurie && evenements) radio.emettre(penurie ? evenements[0] : evenements[1], { offre, demande, coupes, sources: sources.length, centrales: sources.length });
    Object.assign(etat, { offre, demande, utilise, alimentes, coupes, horsReseau, penurie, routes: new Set(dist.keys()) });
    return etat;
  }

  function calculer(monde) {
    if (!active(monde)) {
      for (const b of monde.batiments) { b.courant = false; b.eau = false; b.egout = false; }
      for (const nom of ["electricite", "eau", "egouts"]) monde[nom] = { offre: 0, demande: 0, utilise: 0, alimentes: 0, coupes: 0, horsReseau: 0, penurie: false, routes: new Set() };
      return monde.electricite;
    }
    const construits = (type) => monde.batiments.filter((b) => b.type === type && b.etat === "pret");
    const el = distribuer(monde, "electricite", construits("centrale"), centraleEnMarche, E.parCentrale, consommation, "courant", ["electricite-penurie", "electricite-ok"]);
    // Étape 35 : l'eau et les égouts (leurs stations ont besoin d'électricité : on les calcule après)
    distribuer(monde, "eau", construits("pompage"), stationEnMarche("pompage"), C.eau.parStation, consoEau, "eau", ["eau-penurie", "eau-ok"]);
    distribuer(monde, "egouts", construits("epuration"), stationEnMarche("epuration"), C.eau.parStation, consoEgout, "egout", ["egouts-penurie", "egouts-ok"]);
    return el;
  }

  // La part des lits qui ont l'électricité (ou l'eau, ou les égouts) : pour les besoins des habitants
  function partLogements(monde, champ) {
    let lits = 0, avec = 0;
    for (const b of monde.batiments) if (C.logement[b.type] && b.type !== "entrepot" && b.etat === "pret") { lits += C.logement[b.type]; if (b[champ || "courant"]) avec += C.logement[b.type]; }
    return lits ? avec / lits : 1;
  }

  return { active, consommation, consoEau, consoEgout, calculer, etape, partLogements, centraleEnMarche, stationEnMarche };
})();
