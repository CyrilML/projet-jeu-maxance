// 🔌 LES RÉSEAUX : l'accès aux routes, l'électricité ⚡ et l'eau 💧
//
// 1. L'ACCÈS. Un terrain ne peut accueillir un bâtiment que s'il est à 3 cases au plus d'une route (« accesMax ») : c'est par la
//    route qu'arrivent les camions de chantier, les habitants, et les tuyaux. On le calcule avec une « tache d'encre »
//    (une recherche en largeur) qui part de toutes les routes à la fois et s'arrête à 3 cases.
// 2. L'ÉLECTRICITÉ et l'EAU suivent les routes (les câbles et les tuyaux sont sous la chaussée), comme dans le village :
//    une seconde tache d'encre part des centrales (ou des pompes) le long des routes, et compte la distance. Les
//    bâtiments les plus PROCHES sont servis d'abord ; quand la production est épuisée, les plus loin n'ont rien : c'est
//    une PÉNURIE, il faut une centrale (ou une pompe) de plus.
// Les sources ne produisent pas toutes pareil : l'éolienne dépend du vent, le solaire du soleil (rien la nuit !).
//
// Étape 9 (✍️ « certaines maisons n'ont pas l'eau alors que j'ai assez de stations ») :
//   - D'ABORD CEUX QUI EN ONT BESOIN : une petite maison (niveau 1) a un puits ; elle ne reçoit l'eau courante qu'avec
//     ce qui reste. Avant, une petite maison proche de la station passait devant un immeuble plus loin, qui était coupé !
//   - un terrain prend la route RELIÉE la plus proche (à « accesMax » cases), pas seulement la première route trouvée.
//
// Étape 11 (✍️ « gérer le ramassage des poubelles : incinérateur, enfouissement… ») : un 3e réseau, les DÉCHETS 🗑️.
//   Ça marche comme l'eau, mais à l'envers : chaque bâtiment PRODUIT des déchets, et les camions les emportent par les
//   routes jusqu'à une décharge ou un incinérateur (les plus proches d'abord), tant qu'il reste de la place.
//   - la décharge se REMPLIT chaque mois (quand elle est pleine, il faut en construire une autre) ;
//   - l'incinérateur fait un peu d'ÉLECTRICITÉ avec ce qu'il brûle ;
//   - chaque centre de recyclage enlève 30 % des déchets (jusqu'à 150) avant le ramassage.
// Et les EAUX USÉES : toute l'eau utilisée ressort sale ; les stations d'épuration la nettoient (sinon, l'eau des rivières
// et de la plage est sale, et le terrain au bord de l'eau vaut moins).

window.Megalopole = window.Megalopole || {};

Megalopole.Reseaux = (function () {
  const C = Megalopole.CONFIG;
  const radio = Megalopole.Evenements;
  const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Le vent (de 0,3 à 1) et le soleil (0 la nuit, 1 à midi), qui changent avec le temps
  const vent = (monde) => Math.max(C.energie.ventMin, Math.min(1, 0.65 + 0.25 * Math.sin(monde.temps / 37) + 0.12 * Math.sin(monde.temps / 11)));
  const heure = (monde) => (monde.temps % C.journee) / C.journee; // 0 : minuit, 0,5 : midi
  const soleil = (monde) => Math.max(0, Math.sin((heure(monde) - 0.25) * Math.PI * 2));

  // Ce que produit une source en ce moment
  function production(monde, b, quoi) {
    const B = C.batiments[b.type];
    if (quoi === "courant" && B.courantDechets) return Math.round(B.courantDechets * Math.min(1, (b.traite || 0) / B.dechets)); // l'incinérateur
    if (!B[quoi]) return 0;
    if (quoi === "eau" && !monde.reseaux.courantDe(b)) return 0; // une pompe a besoin de courant pour pomper
    if (B.consoCourant && !b.alimente) return 0; // (le dessalement : il lui faut SON électricité)
    if (quoi === "dechets" && B.contenance && (b.rempli || 0) >= B.contenance) return 0; // une décharge pleine
    // (étape 17 : × les étoiles du bâtiment ⭐, et × la recherche « centrales efficaces » 🔬 pour le courant)
    const Am = Megalopole.Ameliorations, rech = quoi === "courant" ? Am.effet(monde, "production") : 1;
    return Math.round(B[quoi] * (B.vent ? vent(monde) : 1) * (B.soleil ? soleil(monde) : 1) * Am.facteur(b) * rech);
  }

  // 1. L'accès : pour chaque case, la route la plus proche (à « accesMax » cases au plus), ou -1
  function calculerAcces(monde) {
    const k = monde.carte, n = k.colonnes, N = n * n, proche = monde.routeProche, dist = new Uint8Array(N).fill(255);
    proche.fill(-1);
    let file = [];
    for (let i = 0; i < N; i++) if (monde.route[i]) { dist[i] = 0; proche[i] = i; file.push(i); }
    for (let d = 1; d <= C.routes.accesMax; d++) {
      const suivante = [];
      for (const i of file) {
        const c = i % n, l = (i / n) | 0;
        for (const [dc, dl] of VOISINS) {
          const cc = c + dc, ll = l + dl;
          if (cc < 0 || ll < 0 || cc >= n || ll >= n) continue;
          const j = ll * n + cc;
          if (dist[j] <= d) continue;
          dist[j] = d; proche[j] = proche[i]; suivante.push(j);
        }
      }
      file = suivante;
    }
  }

  // La distance d'un terrain au réseau : la meilleure route reliée à « accesMax » cases au plus (distance par la route
  // + les cases à traverser), ou −1 si aucune route reliée n'est assez près
  function distanceAuReseau(monde, dist, i) {
    const n = monde.carte.colonnes, c = i % n, l = (i / n) | 0, A = C.routes.accesMax, R = monde.route;
    let meilleure = -1;
    for (let dl = -A; dl <= A; dl++) for (let dc = -A; dc <= A; dc++) {
      const pas = Math.abs(dl) + Math.abs(dc), cc = c + dc, ll = l + dl;
      if (pas > A || cc < 0 || ll < 0 || cc >= n || ll >= n) continue;
      const j = ll * n + cc;
      if (!R[j] || dist[j] < 0) continue;
      const d = dist[j] + pas;
      if (meilleure < 0 || d < meilleure) meilleure = d;
    }
    return meilleure;
  }
  // Ce terrain a-t-il VRAIMENT besoin de l'eau courante ? (une petite maison a un puits ; un champ ou une ferme non plus)
  const aBesoinDEau = (monde, i) => monde.niveau[i] >= C.croissance.eauDesLeNiveau && !(monde.zone[i] === C.zones.A.id && monde.niveau[i] <= 2);

  // 2. Un réseau (« courant » ou « eau ») : la tache d'encre depuis les sources, le long des routes
  function distribuer(monde, quoi) {
    const k = monde.carte, n = k.colonnes, N = n * n, R = monde.route, servi = quoi === "courant" ? monde.courant : quoi === "eau" ? monde.eau : monde.collecte;
    servi.fill(0);
    const sources = monde.batiments.filter((b) => C.batiments[b.type][quoi] || (quoi === "courant" && C.batiments[b.type].courantDechets));
    const dist = new Int32Array(N).fill(-1);
    let file = [], offre = 0;
    for (const b of sources) {
      const p = production(monde, b, quoi);
      b[quoi === "courant" ? "production" : quoi === "eau" ? "productionEau" : "capacite"] = p;
      offre += p;
      if (p <= 0) continue;
      // la tache d'encre part des routes qui touchent la source (une éolienne en mer : la route la plus proche, par un câble)
      const r = C.batiments[b.type].surMer ? C.dechets.cableMer : 1;
      for (let dl = -r; dl < b.taille + r; dl++) for (let dc = -r; dc < b.taille + r; dc++) {
        const c = b.colonne + dc, l = b.ligne + dl;
        if (c < 0 || l < 0 || c >= n || l >= n) continue;
        const j = l * n + c;
        if (R[j] && dist[j] < 0) { dist[j] = 0; file.push(j); }
      }
    }
    for (let d = 1; file.length; d++) {
      const suivante = [];
      for (const i of file) {
        const c = i % n, l = (i / n) | 0;
        for (const [dc, dl] of VOISINS) {
          const cc = c + dc, ll = l + dl;
          if (cc < 0 || ll < 0 || cc >= n || ll >= n) continue;
          const j = ll * n + cc;
          if (!R[j] || dist[j] >= 0) continue;
          dist[j] = d; suivante.push(j);
        }
      }
      file = suivante;
    }
    // Les clients : les terrains bâtis (et les gros bâtiments), avec leur distance par la route
    const clients = [];
    let demande = 0, demandeBesoin = 0, horsReseau = 0;
    let conso = C.consommation[quoi];
    // (étape 11) le recyclage : chaque centre enlève jusqu'à 150, sans dépasser 30 % de tous les déchets
    let recycle = 0;
    if (quoi === "dechets") {
      let total = 0; for (let i = 0; i < N; i++) if (monde.niveau[i] && monde.zone[i]) total += conso[monde.niveau[i]];
      const capacite = monde.batiments.reduce((t, b) => t + (C.batiments[b.type].recyclage || 0) * Megalopole.Ameliorations.facteur(b), 0);
      recycle = total ? Math.min(C.dechets.recyclage, capacite / total) : 0;
      conso = conso.map((x) => x * (1 - recycle) * Megalopole.Ameliorations.effet(monde, "dechets")); // (étape 17 : le tri sélectif 🔬)
    }
    // (étape 11) les gros bâtiments qui consomment de l'électricité (le dessalement) passent en premier
    if (quoi === "courant") for (const b of monde.batiments) { const B = C.batiments[b.type]; if (!B.consoCourant) continue; b.alimente = false; }
    for (let i = 0; i < N; i++) {
      const nv = monde.niveau[i];
      if (!nv || !monde.zone[i]) continue;
      if (quoi === "eau" && monde.zone[i] === C.zones.A.id && nv < 2) continue; // un champ n'a pas besoin de l'eau courante
      if (monde.routeProche[i] < 0) continue;
      const d = distanceAuReseau(monde, dist, i);
      demande += conso[nv];
      if (quoi !== "eau" || aBesoinDEau(monde, i)) demandeBesoin += conso[nv];
      if (d < 0) { horsReseau++; continue; }
      const apres = quoi === "eau" && !aBesoinDEau(monde, i) ? 1e6 : 0; // (étape 9 : ceux qui n'en ont pas besoin passent après)
      clients.push(apres + d * 4 + (i & 3), conso[nv], i); // (le petit « i & 3 » mélange les égalités)
    }
    if (quoi === "courant") monde.batiments.forEach((b, k3) => { const B = C.batiments[b.type]; if (!B.consoCourant) return; let relie = false; for (let dl = -1; dl <= b.taille && !relie; dl++) for (let dc = -1; dc <= b.taille; dc++) { const c = b.colonne + dc, l = b.ligne + dl; if (c >= 0 && l >= 0 && c < n && l < n && dist[l * n + c] >= 0) { relie = true; break; } } if (relie) { demande += B.consoCourant; demandeBesoin += B.consoCourant; clients.push(-1, B.consoCourant, -1 - k3); } else horsReseau++; });
    const ordre = [];
    for (let k2 = 0; k2 < clients.length; k2 += 3) ordre.push(k2);
    ordre.sort((a, b) => clients[a] - clients[b]);
    let utilise = 0, coupes = 0, coupesSansBesoin = 0, utiliseBesoin = 0;
    for (const k2 of ordre) {
      const besoin = clients[k2 + 1], sansBesoin = clients[k2] >= 1e6;
      if (utilise + besoin <= offre) { utilise += besoin; if (!sansBesoin) utiliseBesoin += besoin; const ici = clients[k2 + 2]; if (ici >= 0) servi[ici] = 1; else monde.batiments[-1 - ici].alimente = true; } else if (sansBesoin) coupesSansBesoin++; else coupes++;
    }
    // (étape 11) ce que chaque source traite vraiment (pour remplir les décharges, et l'électricité de l'incinérateur)
    for (const b of sources) { const p = b[quoi === "courant" ? "production" : quoi === "eau" ? "productionEau" : "capacite"] || 0; if (quoi === "dechets") b.traite = offre ? (p * utilise) / offre : 0; }
    const etat = monde.reseaux[quoi], avant = etat.penurie;
    // (le reste : ce que n'utilisent pas ceux qui en ont BESOIN ; les petites maisons servies « en plus » se pousseront)
    Object.assign(etat, { offre, demande, demandeBesoin, recycle, utilise, coupes, coupesSansBesoin, horsReseau, penurie: coupes > 0, reste: Math.max(0, offre - utiliseBesoin), sources: sources.length, atteint: dist });
    if (etat.penurie !== avant) radio.emettre(quoi + (etat.penurie ? "-penurie" : "-ok"), { offre, demande, coupes });
    return etat;
  }

  // Un terrain vide peut-il recevoir du courant (ou de l'eau) ? Oui si sa route est sur le réseau et qu'il en reste.
  function possible(monde, i, quoi) {
    const e = monde.reseaux[quoi];
    return !!(e && e.atteint && monde.routeProche[i] >= 0 && distanceAuReseau(monde, e.atteint, i) >= 0 && e.reste > 0);
  }
  // Pourquoi ce terrain n'a-t-il pas l'eau (ou le courant) ? (pour le panneau de la case)
  function pourquoiPas(monde, i, quoi) {
    const e = monde.reseaux[quoi];
    if (!e || !e.atteint) return "pas encore calculé";
    if (monde.routeProche[i] < 0) return "trop loin d'une route";
    if (distanceAuReseau(monde, e.atteint, i) < 0) return "sa route n'est reliée à aucune " + (quoi === "eau" ? "station d'eau (en marche)" : quoi === "dechets" ? "décharge ni aucun incinérateur" : "centrale");
    if (quoi === "eau" && !aBesoinDEau(monde, i)) return "pas besoin : une petite maison a un puits (l'eau courante va d'abord aux grands bâtiments)";
    if (quoi === "dechets") return "pas assez de place : les décharges et incinérateurs traitent " + Math.round(e.offre) + ", la ville jette " + Math.round(e.demande) + " ; les plus loin ne sont pas ramassés";
    return "pénurie : la ville produit " + e.offre + " et en demande " + e.demande + " ; les plus loin " + (quoi === "eau" ? "des stations" : "des centrales") + " sont coupés";
  }

  function calculer(monde) {
    calculerAcces(monde);
    // Les gros bâtiments ont-ils le courant ? (oui s'ils touchent une route où arrive le courant, ou s'ils en font)
    monde.reseaux.courantDe = (b) => {
      if (C.batiments[b.type].courant) return true;
      const e = monde.reseaux.courant;
      if (!e.atteint) return false;
      const n = monde.carte.colonnes;
      for (let dl = -1; dl <= b.taille; dl++) for (let dc = -1; dc <= b.taille; dc++) { const c = b.colonne + dc, l = b.ligne + dl; if (c >= 0 && l >= 0 && c < n && l < n && e.atteint[l * n + c] >= 0) return true; }
      return false;
    };
    distribuer(monde, "courant");
    distribuer(monde, "eau");
    distribuer(monde, "dechets"); // étape 11
    // 🚽 les eaux usées : l'eau utilisée ressort sale ; les stations d'épuration (avec du courant) la nettoient
    const Am = Megalopole.Ameliorations; // (étape 17 : × les étoiles ⭐ et × l'épuration avancée 🔬)
    const capacite = Math.round(monde.batiments.reduce((t, b) => t + (C.batiments[b.type].epuration && monde.reseaux.courantDe(b) ? C.batiments[b.type].epuration * Am.facteur(b) : 0), 0) * Am.effet(monde, "epuration")), sale = monde.reseaux.eau.utilise || 0;
    monde.reseaux.epuration = { capacite, eauxUsees: sale, ratio: sale ? Math.min(1, capacite / sale) : 1 };
  }
  // 🗑️ Chaque mois, les décharges se remplissent de ce qu'elles ont reçu (appelé par le bilan du mois)
  function mois(monde) {
    for (const b of monde.batiments) {
      const B = C.batiments[b.type];
      if (!B.contenance) continue;
      const avant = b.rempli || 0;
      b.rempli = Math.min(B.contenance, avant + (b.traite || 0));
      if (avant < B.contenance && b.rempli >= B.contenance) radio.emettre("decharge-pleine", { colonne: b.colonne, ligne: b.ligne, contenance: B.contenance });
      else if (avant < B.contenance * 0.8 && b.rempli >= B.contenance * 0.8) radio.emettre("decharge-presque-pleine", { colonne: b.colonne, ligne: b.ligne, pourcent: 80 });
    }
  }

  return { vent, soleil, heure, production, calculer, possible, pourquoiPas, aBesoinDEau, mois };
})();
