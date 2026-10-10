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
//
// Étape 59 : ✍️ « donner le choix de mettre des éoliennes, des panneaux solaires, une centrale nucléaire, qui ont des prix
// différents et des productions différentes ». Chaque SOURCE a sa production (config.js : « electricite.production ») :
//   ⚡ charbon 40 (s'il y a du charbon) · 🌬️ éolienne 12 × le vent · ☀️ solaire 30 × le soleil · ☢️ nucléaire 300.
// Le vent et le soleil changent : l'offre du réseau monte et descend toute la journée ! Il faut donc des sources « sûres »
// (charbon, nucléaire) en plus des sources gratuites (vent, soleil), sinon c'est la pénurie la nuit.
// Étape 59 aussi : ✍️ « les fonderies doivent être remplacées automatiquement par les aciéries » : à l'époque industrielle,
// une fonderie qui a l'électricité devient une aciérie (gratuitement).

window.Village = window.Village || {};

Village.Electricite = (function () {
  const C = Village.CONFIG, E = C.electricite;
  const radio = Village.Evenements;
  const B = () => Village.Batiments;

  const active = (monde) => (monde.age || 0) >= E.age;
  // Combien d'électricité consomme ce bâtiment ?
  const estSource = (type) => E.sources.includes(type); // étape 59
  function consommation(b) {
    if (estSource(b.type) || b.etat !== "pret") return 0;
    if (E.consommation[b.type] !== undefined) return E.consommation[b.type];
    if (C.ateliers[b.type] && C.ateliers[b.type].electrique) return E.usine;
    if (C.logement[b.type] && b.type !== "entrepot") return E.logement;
    return B().TYPES[b.type].metier ? E.atelier : 0;
  }
  // Étape 35 : combien d'eau, combien d'égouts ? (config.js : « eau »)
  const consoEau = (b) => (b.etat !== "pret" ? 0 : C.eau.consommation[b.type] !== undefined ? C.eau.consommation[b.type] : C.logement[b.type] && b.type !== "entrepot" ? C.eau.logement : C.elevage.troupeaux[b.type] ? C.eau.elevage : 0);
  const consoEgout = (b) => (b.etat !== "pret" ? 0 : C.eau.consommation[b.type] !== undefined ? C.eau.consommation[b.type] : C.logement[b.type] && b.type !== "entrepot" ? C.eau.logement : C.ateliers[b.type] && C.ateliers[b.type].electrique ? C.eau.usine : 0);
  const centraleEnMarche = (b) => b.type === "centrale" && b.etat === "pret" && !!b.travail;
  // Étape 59 : le vent (de 0,3 à 1), qui change lentement ; chaque éolienne a un petit décalage
  const vent = (monde, b) => Math.max(0.3, Math.min(1, 0.65 + 0.25 * Math.sin(monde.horloge / 47) + 0.12 * Math.sin(monde.horloge / 13 + (b ? b.numero : 0))));
  // Le soleil (de 0 à 1) : rien la nuit, moins en hiver
  const soleil = (monde) => { const n = monde.moment ? monde.moment.noirceur : 0; return Math.max(0, 1 - n * 1.15) * (monde.saison && monde.saison.hiver ? E.solaireHiver : 1); };
  // Ce que produit une source en ce moment (0 si elle est à l'arrêt)
  function production(monde, b) {
    if (b.etat !== "pret") return 0;
    if (b.type === "centrale" || b.type === "nucleaire") return b.travail ? E.production[b.type] : 0;
    if (b.type === "eolienne") return Math.round(E.production.eolienne * vent(monde, b));
    if (b.type === "solaire") return Math.round(E.production.solaire * soleil(monde));
    return 0;
  }
  const sourceEnMarche = (monde) => (b) => production(monde, b) > 0;
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
    const offre = typeof parSource === "function" ? sources.reduce((s, b) => s + parSource(b), 0) : sources.length * parSource; // étape 59 : chaque source sa production
    let utilise = 0, alimentes = 0, coupes = 0;
    for (const [, besoin, b] of clients) { if (utilise + besoin <= offre) { utilise += besoin; b[champ] = true; alimentes++; } else coupes++; }
    const demande = clients.reduce((s, c) => s + c[1], 0), penurie = coupes > 0;
    if (penurie !== etat.penurie && evenements) radio.emettre(penurie ? evenements[0] : evenements[1], Object.assign({ offre, demande, coupes, sources: sources.length, centrales: sources.length }, evenements[2] || {})); // étape 48 : evenements[2], des détails en plus
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
    const tout = monde.batiments.filter((b) => estSource(b.type) && b.etat === "pret");
    for (const b of tout) b.production = production(monde, b); // (pour le panneau)
    const el = distribuer(monde, "electricite", tout, sourceEnMarche(monde), (b) => b.production, consommation, "courant", ["electricite-penurie", "electricite-ok"]);
    el.parSorte = {}; for (const b of tout) el.parSorte[b.type] = (el.parSorte[b.type] || 0) + b.production; // étape 59 : ce que fait chaque sorte
    remplacerFonderies(monde);
    // Étape 35 : l'eau et les égouts (leurs stations ont besoin d'électricité : on les calcule après)
    distribuer(monde, "eau", construits("pompage"), stationEnMarche("pompage"), C.eau.parStation, consoEau, "eau", ["eau-penurie", "eau-ok"]);
    distribuer(monde, "egouts", construits("epuration"), stationEnMarche("epuration"), C.eau.parStation, consoEgout, "egout", ["egouts-penurie", "egouts-ok"]);
    return el;
  }

  // Étape 59 : une fonderie qui a l'électricité, à l'époque industrielle, devient une aciérie (on garde ses réserves)
  function remplacerFonderies(monde) {
    if (!E.remplacerFonderies) return;
    for (const b of monde.batiments) {
      if (b.type !== "fonderie" || b.etat !== "pret" || !b.courant) continue;
      b.type = "acierie"; b.travail = null; b.attend = null;
      monde.changements++;
      radio.emettre("fonderie-remplacee", { numero: b.numero, colonne: b.colonne, ligne: b.ligne });
    }
  }

  // La part des lits qui ont l'électricité (ou l'eau, ou les égouts) : pour les besoins des habitants
  // Étape 48 : champ peut être une liste (["courant", "eau", "egout"] : les lits qui ont les 3 à la fois)
  function partLogements(monde, champ) {
    let lits = 0, avec = 0;
    const champs = Array.isArray(champ) ? champ : [champ || "courant"];
    for (const b of monde.batiments) if (C.logement[b.type] && b.type !== "entrepot" && b.etat === "pret") { lits += C.logement[b.type]; if (champs.every((ch) => b[ch])) avec += C.logement[b.type]; }
    return lits ? avec / lits : 1;
  }

  return { estSource, production, vent, soleil, active, distribuer, consommation, consoEau, consoEgout, calculer, etape, partLogements, centraleEnMarche, stationEnMarche };
})();
