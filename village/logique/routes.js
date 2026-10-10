// 🛤️ LES ROUTES : le cantonnier
//
// Les routes sont rangées dans un tableau d'une case par case de la carte : 1 = route, 0 = pas de route.
//
// Tracer une route : on donne une case de départ et une case d'arrivée, et la « tache d'encre »
// (Village.Chemins) trouve le plus court chemin entre les deux, en évitant l'eau, les montagnes,
// les arbres, les rochers et les bâtiments. Chaque NOUVELLE case de route coûte 1 pierre.
//
// Étape 6 : ✍️ au campement, ce sont des chemins de TERRE (valeur 1 dans le tableau), gratuits.
// Plus tard viendront les routes en PIERRE (valeur 2), plus rapides (voir config.js, « sols »).
// La fonction `vitesseDuSol` dit à quelle vitesse on marche sur une case.
//
// Le RÉSEAU : en partant de l'entrepôt, on suit toutes les routes qui se touchent (encore une tache
// d'encre !). Un bâtiment est RELIÉ si une route du réseau touche un de ses 4 côtés.
// Un bâtiment qui n'est pas relié est bloqué : aucun porteur ne peut venir chez lui.
//
// Étape 36 : ✍️ « il y a beaucoup d'endroits où les routes ne peuvent pas passer (rochers, arbres…) : c'est très
// embêtant, il faut qu'une route puisse toujours passer ». Maintenant la route est un BULLDOZER (choix de Maxance) :
//   🪓 un arbre ou un sapin sur le passage est abattu : son tronc va à l'entrepôt ;
//   ⛏️ un rocher est cassé : ses pierres vont à l'entrepôt ; une jeune pousse est arrachée ;
//   🌉 sur l'eau (même profonde), la route devient un PONT, qui coûte 2 planches par case.
// Seuls les bâtiments (et le feu de camp du chef) l'arrêtent encore.

window.Village = window.Village || {};

Village.Routes = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Peut-on mettre une route sur cette case ? (une case déjà en route : oui, elle est gratuite)
  //   sansDegager : comme avant l'étape 36, seulement les cases libres (pour essayer d'abord de contourner)
  function routable(monde, c, l, sansDegager) {
    const k = monde.carte, O = Village.Carte.OBJET;
    if (c < 0 || l < 0 || c >= k.colonnes || l >= k.lignes) return false;
    const i = l * k.colonnes + c, o = k.objet[i];
    if (monde.occupees.has(i)) return false;
    if (sansDegager) return (monde.route[i] > 0 || Village.Carte.praticable(k, c, l)) && (o === O.rien || o === O.fleurs || o === O.buisson);
    return o !== O.feuDeCamp && o !== O.tente; // étape 36 : tout le reste se dégage (ou se traverse en pont)
  }
  // Étape 36 : ce qu'il faut faire sur cette case avant d'y mettre la route : null (rien), "arbre", "rocher",
  // "pousse" ou "pont" (de l'eau)
  function obstacle(monde, i) {
    const k = monde.carte, O = Village.Carte.OBJET, T = Village.Carte.TERRAIN, o = k.objet[i];
    if (k.terrain[i] === T.eau || k.terrain[i] === T.eauProfonde) return "pont";
    if (o === O.arbre || o === O.sapin) return "arbre";
    if (o === O.rocher || o === O.montagne) return "rocher";
    if (o === O.pousse) return "pousse";
    return null;
  }
  // Ce que le passage de la route va dégager et rapporter, sur une liste de cases
  function bilanDegagement(monde, cases) {
    const k = monde.carte, b = { arbres: 0, rochers: 0, pousses: 0, ponts: 0, troncs: 0, pierres: 0 };
    for (const p of cases) {
      const i = p.ligne * k.colonnes + p.colonne, ob = obstacle(monde, i);
      if (ob === "arbre") { b.arbres++; b.troncs += C.routes.troncsParArbre; }
      else if (ob === "rocher") { b.rochers++; b.pierres += k.filon[i] ? C.nature.pierresParRocher : Math.min(C.nature.pierresParRocher, k.reste[i] || 0); }
      else if (ob === "pousse") b.pousses++;
      else if (ob === "pont" && !monde.route[i]) b.ponts++;
    }
    return b;
  }
  // Dégager vraiment (au moment de construire), et ranger ce qu'on récupère à l'entrepôt
  function degager(monde, cases, qui) { // (étape 45 : qui = la route, ou le chantier d'un bâtiment)
    const k = monde.carte, O = Village.Carte.OBJET, b = bilanDegagement(monde, cases);
    for (const p of cases) {
      const i = p.ligne * k.colonnes + p.colonne, ob = obstacle(monde, i);
      if (ob === "arbre" || ob === "rocher" || ob === "pousse") {
        if (ob === "rocher" && !k.filon[i]) k.reste[i] = 0;
        if (ob === "pousse") monde.pousses.delete(i);
        monde.reservees.delete(i); // l'ouvrier qui venait la chercher trouvera la place vide
        Village.Monde.changerObjet(monde, i, O.rien);
      }
    }
    monde.stock.troncs += b.troncs;
    monde.stock.pierres += b.pierres;
    monde.aReplanter = (monde.aReplanter || 0) + (b.arbres || 0); // étape 54 : les arbres abattus sont à replanter
    if (b.arbres || b.rochers || b.pousses) radio.emettre("route-degagee", Object.assign({ qui: qui || "la route" }, b));
    return b;
  }

  // Étape 41 : ✍️ « les routes doivent toutes être pavées à partir de l'amélioration : plus de chemin en terre possible ».
  // Après la recherche « Routes pavées », toute nouvelle route est pavée, quel que soit l'outil (même la route proposée
  // jusqu'à la porte d'un nouveau bâtiment).
  const sorteDe = (monde, sorte) => (Village.Recherches.a(monde, "routePierre") ? 2 : sorte || 1);
  // Étape 6 : au campement, le chemin de terre est gratuit (pas de pierre dans « cout »).
  function coutDe(n) { return n * (C.routes.cout.pierres || 0); }
  // Étape 36 : ce que coûtent les ponts (en planches)
  const planchesPour = (b) => b.ponts * C.routes.pont.planches;
  // Peut-on payer ? (null : oui ; sinon la raison)
  function manque(monde, e) {
    const pierres = Village.Porteurs.disponible(monde, "pierres"), planches = Village.Porteurs.disponible(monde, "planches");
    if (e.cout > pierres) return "il faut " + e.cout + " pierre(s), tu en as " + pierres + " de libre(s)";
    if (e.planches > planches) return "il faut " + e.planches + " planche(s) pour " + e.degagement.ponts + " case(s) de pont 🌉, tu en as " + planches + " de libre(s)";
    return null;
  }
  function payer(monde, e) { monde.stock.pierres -= e.cout; monde.stock.planches -= e.planches; }

  // Le chemin que prendrait la route entre deux cases (sans la construire). Sert aussi à l'aperçu.
  //   Le départ ou l'arrivée peuvent être un bâtiment : la route s'arrête alors juste à côté.
  function trajet(monde, depart, arrivee, sorte) {
    sorte = sorteDe(monde, sorte);
    const k = monde.carte, iA = arrivee.ligne * k.colonnes + arrivee.colonne;
    const finBatiment = monde.occupees.has(iA);
    // Étape 36 : on essaie d'abord de CONTOURNER les obstacles (rien à abattre, pas de pont à payer) ; si c'est
    // impossible, la route passe tout droit et dégage ce qui la gêne.
    const chercher = (sansDegager) => Village.Chemins.chercher(k.colonnes, k.lignes, depart,
      (c, l) => routable(monde, c, l, sansDegager) || (c === arrivee.colonne && l === arrivee.ligne && finBatiment),
      (c, l) => c === arrivee.colonne && l === arrivee.ligne, C.routes.longueurMax);
    let r = chercher(true);
    if (!r.chemin || r.chemin.length > C.routes.detourMax * (Math.abs(arrivee.colonne - depart.colonne) + Math.abs(arrivee.ligne - depart.ligne) + 1)) { const direct = chercher(false); if (direct.chemin) r = direct; }
    if (!r.chemin) return null;
    // On ne met pas de route sur les bâtiments eux-mêmes (le départ ou l'arrivée).
    const cases = r.chemin.filter((p) => !monde.occupees.has(p.ligne * k.colonnes + p.colonne));
    if (finBatiment && !cases.length) return null;
    // Les cases déjà de cette sorte (ou mieux) ne coûtent rien. Une route en pierre coûte 1 🪨 par case.
    const nouvelles = cases.filter((p) => (monde.route[p.ligne * k.colonnes + p.colonne] || 0) < sorte).length;
    const degagement = bilanDegagement(monde, cases);
    return { cases, nouvelles, sorte, cout: sorte === 2 ? nouvelles * C.routes.coutPierre.pierres : coutDe(nouvelles), planches: planchesPour(degagement), degagement };
  }

  // Construire la route. Renvoie vrai si c'est fait.
  function construire(monde, depart, arrivee, sorte) {
    sorte = sorteDe(monde, sorte);
    if (sorte === 2 && !Village.Recherches.a(monde, "routePierre")) { radio.emettre("route-impossible", { raison: "il faut d'abord la recherche « Routes pavées » 🧱" }); return false; }
    const t = trajet(monde, depart, arrivee, sorte);
    if (!t || !t.cases.length) {
      radio.emettre("route-impossible", { raison: "pas de chemin possible (des bâtiments tout autour, ou plus de " + C.routes.longueurMax + " cases)" });
      return false;
    }
    const pb = manque(monde, t);
    if (pb) { radio.emettre("route-impossible", { raison: pb }); return false; }
    const k = monde.carte;
    payer(monde, t);
    degager(monde, t.cases); // étape 36
    for (const p of t.cases) {
      const i = p.ligne * k.colonnes + p.colonne;
      if (k.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien); // on enlève les fleurs
      monde.route[i] = Math.max(monde.route[i], sorte); // une route en pierre remplace un chemin de terre
    }
    monde.changements++;
    recalculerReseau(monde);
    radio.emettre("route-construite", { sorte, cases: t.cases.length, nouvelles: t.nouvelles, cout: t.cout, planches: t.planches, ponts: t.degagement.ponts, total: compter(monde), pierres: monde.stock.pierres });
    return true;
  }

  // Étape 12 : construire une route sur une LISTE de cases (le tracé au doigt, ou la route proposée
  // jusqu'à la porte d'un bâtiment). Les cases déjà en route ou les bâtiments sont sautés.
  //   Renvoie vrai si c'est fait. `raison` (si on la demande) dit ce qui ne va pas.
  function evaluerCases(monde, cases, sorte) {
    sorte = sorteDe(monde, sorte);
    const k = monde.carte, vues = new Set(), ok = [], mauvaises = [];
    for (const p of cases) {
      const i = p.ligne * k.colonnes + p.colonne;
      if (vues.has(i)) continue;
      vues.add(i);
      if (monde.occupees.has(i)) continue; // on passe « à travers » un bâtiment : pas de route dessus
      if ((monde.route[i] || 0) >= sorte) { ok.push(p); continue; }
      if (routable(monde, p.colonne, p.ligne)) ok.push(p); else mauvaises.push(p);
    }
    const nouvelles = ok.filter((p) => (monde.route[p.ligne * k.colonnes + p.colonne] || 0) < sorte).length;
    const degagement = bilanDegagement(monde, ok);
    return { cases: ok, mauvaises, nouvelles, cout: sorte === 2 ? nouvelles * C.routes.coutPierre.pierres : coutDe(nouvelles), planches: planchesPour(degagement), degagement };
  }
  function construireCases(monde, cases, sorte) {
    sorte = sorteDe(monde, sorte);
    if (sorte === 2 && !Village.Recherches.a(monde, "routePierre")) { radio.emettre("route-impossible", { raison: "il faut d'abord la recherche « Routes pavées » 🧱" }); return false; }
    const e = evaluerCases(monde, cases, sorte);
    if (e.mauvaises.length) { radio.emettre("route-impossible", { raison: "la route passe sur " + e.mauvaises.length + " case(s) impossible(s) (le feu de camp du chef)" }); return false; }
    if (!e.nouvelles) return true;
    const pb = manque(monde, e);
    if (pb) { radio.emettre("route-impossible", { raison: pb }); return false; }
    const k = monde.carte;
    payer(monde, e);
    degager(monde, e.cases); // étape 36
    for (const p of e.cases) {
      const i = p.ligne * k.colonnes + p.colonne;
      if (k.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien);
      monde.route[i] = Math.max(monde.route[i], sorte);
    }
    monde.changements++;
    recalculerReseau(monde);
    radio.emettre("route-construite", { sorte, cases: e.cases.length, nouvelles: e.nouvelles, cout: e.cout, planches: e.planches, ponts: e.degagement.ponts, total: compter(monde), pierres: monde.stock.pierres });
    return true;
  }

  // Étape 12 : la PORTE d'un bâtiment est sur son mur de gauche (en bas à gauche à l'écran) : la case
  // juste devant est (colonne, ligne + 1). La route proposée arrive là, et le dessin ne relie un
  // bâtiment à la route que par sa porte (plus de quadrillage tout autour !).
  const porte = (b) => ({ colonne: b.colonne, ligne: b.ligne + 1 });

  function demolir(monde, i) {
    if (!monde.route[i]) return false;
    const rendu = monde.route[i] === 2 ? C.routes.coutPierre.pierres : C.routes.cout.pierres || 0;
    const pont = obstacle(monde, i) === "pont" ? C.routes.pont.planches : 0; // étape 36 : les planches d'un pont sont rendues
    monde.route[i] = 0;
    monde.stock.pierres += rendu; // la pierre d'une route pavée est rendue
    monde.stock.planches += pont;
    monde.changements++;
    recalculerReseau(monde);
    radio.emettre("route-demolie", { rendu, colonne: i % monde.carte.colonnes, ligne: Math.floor(i / monde.carte.colonnes), total: compter(monde) });
    return true;
  }

  function compter(monde) {
    let n = 0;
    for (const v of monde.route) if (v) n++; // une case compte pour 1, terre ou pierre
    return n;
  }

  // La tache d'encre du réseau : toutes les routes qu'on peut atteindre depuis l'entrepôt.
  // Étape 17 : depuis TOUS les entrepôts en même temps. Chaque case de route retient l'entrepôt le plus proche
  // (celui dont l'encre est arrivée en premier) : monde.zone. C'est lui qui fera les livraisons de ce coin.
  const estEntrepot = (b) => b.type === "entrepot" || (b.type === "depot" && b.etat === "pret");
  function recalculerReseau(monde) {
    const k = monde.carte, reseau = new Set(), zone = new Map();
    let file = [];
    // Étape 24 : les voisines de TOUTES les cases d'un bâtiment (il peut prendre 2 × 2 cases)
    const voisines = (b) => { const liste = []; for (const j of Village.Batiments.casesDe(b, k)) { const c0 = j % k.colonnes, l0 = Math.floor(j / k.colonnes); for (const [dc, dl] of VOISINS) { const c = c0 + dc, l = l0 + dl; if (c >= 0 && l >= 0 && c < k.colonnes && l < k.lignes) liste.push(l * k.colonnes + c); } } return liste; };
    for (const e of monde.batiments) {
      if (!estEntrepot(e)) continue;
      for (const i of voisines(e)) if (monde.route[i] && !reseau.has(i)) { reseau.add(i); zone.set(i, e); file.push(i); }
    }
    while (file.length) {
      const suivante = [];
      for (const i of file) {
        const c = i % k.colonnes, l = Math.floor(i / k.colonnes);
        for (const [dc, dl] of VOISINS) {
          const nc = c + dc, nl = l + dl, j = nl * k.colonnes + nc;
          if (nc < 0 || nl < 0 || nc >= k.colonnes || nl >= k.lignes || reseau.has(j) || !monde.route[j]) continue;
          reseau.add(j);
          zone.set(j, zone.get(i));
          suivante.push(j);
        }
      }
      file = suivante;
    }
    monde.reseau = reseau;
    monde.zone = zone;
    // Qui est relié ? On prévient la radio quand ça change.
    for (const b of monde.batiments) {
      let pres = null; // étape 17 : l'entrepôt de ce bâtiment (celui de sa route)
      const relie = estEntrepot(b) || voisines(b).some((i) => { if (reseau.has(i)) { pres = pres || zone.get(i); return true; } return false; }); // étape 24 : par n'importe quelle case
      b.entrepotProche = estEntrepot(b) ? b : pres;
      if (relie !== b.relie && b.type !== "entrepot" && b.relie !== undefined) {
        radio.emettre(relie ? "batiment-relie" : "batiment-coupe", { nom: Village.Batiments.TYPES[b.type].nom, numero: b.numero });
      }
      b.relie = relie;
    }
  }

  // À quelle vitesse marche-t-on sur cette case ? (× la vitesse normale)
  function vitesseDuSol(monde, x, y) {
    const k = monde.carte, c = Math.floor(x), l = Math.floor(y);
    if (c < 0 || l < 0 || c >= k.colonnes || l >= k.lignes) return C.sols.horsRoute;
    const r = monde.route[l * k.colonnes + c];
    return r === 2 ? (Village.Recherches.a(monde, "goudron") ? C.sols.goudron : C.sols.pierre) : r === 1 ? C.sols.terre : C.sols.horsRoute;
  }

  // Étape 17 : ✍️ la recherche « Routes pavées » est finie : TOUTES les routes deviennent pavées, d'un coup.
  function paver(monde, sansMessage) {
    let n = 0;
    for (let i = 0; i < monde.route.length; i++) if (monde.route[i] === 1) { monde.route[i] = 2; n++; }
    if (n) monde.changements++;
    if (n && !sansMessage) radio.emettre("routes-pavees", { cases: n });
    return n;
  }

  return { degager, sorteDe, obstacle, bilanDegagement, paver, estEntrepot, routable, trajet, construire, evaluerCases, construireCases, porte, demolir, recalculerReseau, compter, vitesseDuSol, VOISINS };
})();
