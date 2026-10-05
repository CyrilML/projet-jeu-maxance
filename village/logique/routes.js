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

window.Village = window.Village || {};

Village.Routes = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Peut-on mettre une route sur cette case ? (une case déjà en route : oui, elle est gratuite)
  function routable(monde, c, l) {
    const k = monde.carte, O = Village.Carte.OBJET;
    if (!Village.Carte.praticable(k, c, l)) return false;
    const i = l * k.colonnes + c, o = k.objet[i];
    if (monde.occupees.has(i)) return false;
    return o === O.rien || o === O.fleurs || o === O.buisson;
  }

  // Étape 6 : au campement, le chemin de terre est gratuit (pas de pierre dans « cout »).
  function coutDe(n) { return n * (C.routes.cout.pierres || 0); }

  // Le chemin que prendrait la route entre deux cases (sans la construire). Sert aussi à l'aperçu.
  //   Le départ ou l'arrivée peuvent être un bâtiment : la route s'arrête alors juste à côté.
  function trajet(monde, depart, arrivee) {
    const k = monde.carte, iA = arrivee.ligne * k.colonnes + arrivee.colonne;
    const finBatiment = monde.occupees.has(iA);
    const r = Village.Chemins.chercher(
      k.colonnes, k.lignes, depart,
      (c, l) => routable(monde, c, l),
      (c, l) => c === arrivee.colonne && l === arrivee.ligne,
      C.routes.longueurMax
    );
    if (!r.chemin) return null;
    // On ne met pas de route sur les bâtiments eux-mêmes (le départ ou l'arrivée).
    const cases = r.chemin.filter((p) => !monde.occupees.has(p.ligne * k.colonnes + p.colonne));
    if (finBatiment && !cases.length) return null;
    const nouvelles = cases.filter((p) => !monde.route[p.ligne * k.colonnes + p.colonne]).length;
    return { cases, nouvelles, cout: coutDe(nouvelles) };
  }

  // Construire la route. Renvoie vrai si c'est fait.
  function construire(monde, depart, arrivee) {
    const t = trajet(monde, depart, arrivee);
    if (!t || !t.cases.length) {
      radio.emettre("route-impossible", { raison: "pas de chemin possible (eau, montagne, arbre, rocher ou bâtiment sur le passage, ou plus de " + C.routes.longueurMax + " cases)" });
      return false;
    }
    const dispo = Village.Porteurs.disponible(monde, "pierres");
    if (t.cout > dispo) {
      radio.emettre("route-impossible", { raison: "il faut " + t.cout + " pierre(s), tu en as " + dispo + " de libre(s)" });
      return false;
    }
    const k = monde.carte;
    for (const p of t.cases) {
      const i = p.ligne * k.colonnes + p.colonne;
      if (k.objet[i]) Village.Monde.changerObjet(monde, i, Village.Carte.OBJET.rien); // on enlève les fleurs
      monde.route[i] = 1;
    }
    monde.stock.pierres -= t.cout;
    monde.changements++;
    recalculerReseau(monde);
    radio.emettre("route-construite", { cases: t.cases.length, nouvelles: t.nouvelles, cout: t.cout, total: compter(monde), pierres: monde.stock.pierres });
    return true;
  }

  function demolir(monde, i) {
    if (!monde.route[i]) return false;
    monde.route[i] = 0;
    monde.stock.pierres += C.routes.cout.pierres || 0; // si la route avait coûté une pierre, on la rend
    monde.changements++;
    recalculerReseau(monde);
    radio.emettre("route-demolie", { rendu: C.routes.cout.pierres || 0, colonne: i % monde.carte.colonnes, ligne: Math.floor(i / monde.carte.colonnes), total: compter(monde) });
    return true;
  }

  function compter(monde) {
    let n = 0;
    for (const v of monde.route) n += v;
    return n;
  }

  // La tache d'encre du réseau : toutes les routes qu'on peut atteindre depuis l'entrepôt.
  function recalculerReseau(monde) {
    const k = monde.carte, reseau = new Set();
    const e = monde.batiments.find((b) => b.type === "entrepot");
    if (e) {
      let file = [];
      for (const [dc, dl] of VOISINS) {
        const c = e.colonne + dc, l = e.ligne + dl, i = l * k.colonnes + c;
        if (c >= 0 && l >= 0 && c < k.colonnes && l < k.lignes && monde.route[i]) { reseau.add(i); file.push(i); }
      }
      while (file.length) {
        const suivante = [];
        for (const i of file) {
          const c = i % k.colonnes, l = Math.floor(i / k.colonnes);
          for (const [dc, dl] of VOISINS) {
            const nc = c + dc, nl = l + dl, j = nl * k.colonnes + nc;
            if (nc < 0 || nl < 0 || nc >= k.colonnes || nl >= k.lignes || reseau.has(j) || !monde.route[j]) continue;
            reseau.add(j);
            suivante.push(j);
          }
        }
        file = suivante;
      }
    }
    monde.reseau = reseau;
    // Qui est relié ? On prévient la radio quand ça change.
    for (const b of monde.batiments) {
      const relie = b.type === "entrepot" || VOISINS.some(([dc, dl]) => {
        const c = b.colonne + dc, l = b.ligne + dl;
        return c >= 0 && l >= 0 && c < k.colonnes && l < k.lignes && reseau.has(l * k.colonnes + c);
      });
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
    return r === 2 ? C.sols.pierre : r === 1 ? C.sols.terre : C.sols.horsRoute;
  }

  return { routable, trajet, construire, demolir, recalculerReseau, compter, vitesseDuSol };
})();
