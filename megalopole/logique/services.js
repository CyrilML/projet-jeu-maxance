// 🏛️ LES CARTES DE LA VILLE : services, loisirs, pollution, trafic et valeur du terrain
//
// Ce module dessine des CARTES INVISIBLES (une valeur par case), que tu peux voir avec les calques (bouton 🗺️) :
//   - les SERVICES : chaque école, hôpital, commissariat, caserne, parc, arrêt de bus… couvre un cercle autour de lui
//     (son « rayon »). Une maison dans le cercle a ce service. Il faut que le bâtiment ait l'électricité ;
//   - la POLLUTION 🌫️ : les industries et la centrale à charbon salissent l'air autour d'elles ;
//   - le TRAFIC 🚗 : chaque habitant et chaque emploi fait des trajets sur les routes proches. Une route trop chargée,
//     c'est un bouchon ! Les bus et le métro en enlèvent une partie ; une avenue en laisse passer plus ;
//   - la VALEUR DU TERRAIN 💎 : de 0 à 1. Elle monte au bord de l'eau, près des parcs et des services, et baisse avec
//     la pollution et les bouchons. Les beaux bâtiments ne poussent que là où le terrain vaut cher !

window.Megalopole = window.Megalopole || {};

Megalopole.Services = (function () {
  const C = Megalopole.CONFIG;
  const TYPES = ["education", "sante", "securite", "feu", "loisirs", "transport"];

  // Marquer un cercle autour d'un bâtiment (f reçoit l'index de la case et la part de distance, de 0 au centre à 1 au bord)
  function cercle(monde, b, rayon, f) {
    const n = monde.carte.colonnes, cx = b.colonne + b.taille / 2, cy = b.ligne + b.taille / 2;
    for (let l = Math.max(0, Math.floor(cy - rayon)); l <= Math.min(n - 1, Math.ceil(cy + rayon)); l++) for (let c = Math.max(0, Math.floor(cx - rayon)); c <= Math.min(n - 1, Math.ceil(cx + rayon)); c++) {
      const d = Math.hypot(c + 0.5 - cx, l + 0.5 - cy);
      if (d <= rayon) f(l * n + c, d / rayon);
    }
  }

  function calculer(monde) {
    const k = monde.carte, n = k.colonnes, N = n * n;
    // 1. Les services (et ce qu'ils ajoutent à la valeur du terrain)
    for (const t of TYPES) monde.couverture[t].fill(0);
    const bonus = new Float32Array(N);
    for (const b of monde.batiments) {
      const B = C.batiments[b.type];
      if (!B.rayon) continue;
      b.marche = monde.reseaux.courantDe ? monde.reseaux.courantDe(b) : false;
      if (!b.marche && B.service !== "loisirs") continue; // (un parc n'a pas besoin de courant)
      b.rayon = B.rayon * Megalopole.Budget.facteurRayon(monde, B); // étape 2 : selon le budget de son poste
      if (b.rayon <= 0) continue; // budget à 0 % : le service est fermé
      cercle(monde, b, b.rayon, (i, part) => {
        if (B.service) monde.couverture[B.service][i] = 1;
        if (B.valeur) bonus[i] += B.valeur * (1 - part * 0.6);
      });
    }
    // 2. La pollution : l'industrie (selon son niveau) et la centrale à charbon
    const P = monde.pollution;
    P.fill(0);
    const salir = (c0, l0, force, rayon) => { for (let l = Math.max(0, l0 - rayon); l <= Math.min(n - 1, l0 + rayon); l++) for (let c = Math.max(0, c0 - rayon); c <= Math.min(n - 1, c0 + rayon); c++) { const d = Math.hypot(c - c0, l - l0); if (d <= rayon) P[l * n + c] += force * (1 - d / (rayon + 1)); } };
    for (let i = 0; i < N; i++) if (monde.zone[i] === C.zones.I.id && monde.niveau[i]) salir(i % n, (i / n) | 0, C.pollution.industrie * Math.min(4, monde.niveau[i]) / 2, C.pollution.rayon);
    for (const b of monde.batiments) { const B = C.batiments[b.type]; if (B.pollution) salir(b.colonne + (b.taille >> 1), b.ligne + (b.taille >> 1), B.pollution, C.pollution.centraleRayon); }
    for (let i = 0; i < N; i++) if (P[i] > 1) P[i] = 1;
    // 3. Le trafic : on fait la somme des gens autour de chaque route (avec un « tableau des sommes », très rapide)
    const gens = new Float32Array((n + 1) * (n + 1)); // gens[(l+1)*(n+1) + c+1] = la somme du rectangle (0,0)-(c,l)
    for (let l = 0; l < n; l++) { let ligne = 0; for (let c = 0; c < n; c++) { const i = l * n + c; ligne += monde.zone[i] && monde.niveau[i] ? Megalopole.Zones.gensDe(monde, i) : 0; gens[(l + 1) * (n + 1) + c + 1] = gens[l * (n + 1) + c + 1] + ligne; } }
    const somme = (c0, l0, c1, l1) => { c0 = Math.max(0, c0); l0 = Math.max(0, l0); c1 = Math.min(n - 1, c1); l1 = Math.min(n - 1, l1); const W = n + 1; return gens[(l1 + 1) * W + c1 + 1] - gens[l0 * W + c1 + 1] - gens[(l1 + 1) * W + c0] + gens[l0 * W + c0]; };
    const T = monde.trafic, r = C.trafic.rayon;
    let bouchons = 0, routes = 0, total = 0;
    for (let i = 0; i < N; i++) {
      if (!monde.route[i]) { T[i] = 0; continue; }
      const c = i % n, l = (i / n) | 0, cap = (monde.route[i] === 2 ? C.routes.avenue.capacite : C.routes.route.capacite) * (0.6 + 0.4 * monde.etatRoutes); // étape 2 : une route abîmée laisse passer moins de voitures
      // le nombre de routes autour : le trafic se partage entre elles
      let voisines = 0; for (let dl = -r; dl <= r; dl += r) for (let dc = -r; dc <= r; dc += r) { const cc = c + dc, ll = l + dl; if (cc >= 0 && ll >= 0 && cc < n && ll < n && monde.route[ll * n + cc]) voisines++; }
      let t = (somme(c - r, l - r, c + r, l + r) * C.trafic.parGens) / Math.max(1, voisines) / cap;
      if (monde.couverture.transport[i]) t *= 1 - meilleurTransport(monde, i);
      T[i] = Math.min(2, t); routes++; total += T[i]; if (T[i] > 1) bouchons++;
    }
    monde.statsTrafic = { routes, bouchons, moyen: routes ? total / routes : 0 };
    // 4. La valeur du terrain
    const V = monde.valeur, Vb = C.valeur;
    for (let i = 0; i < N; i++) {
      let v = Vb.base - (1 - monde.etatRoutes) * 0.1 + bonus[i] + (monde.bordDeLEau[i] ? Vb.bordDeLEau : 0) - P[i] * Vb.parPollution;
      const rp = monde.routeProche[i];
      if (rp >= 0) v -= Math.max(0, T[rp] - 0.6) * Vb.parTrafic;
      V[i] = Math.max(0, Math.min(1, v));
    }
  }
  // Les bus et le métro enlèvent une part du trafic (le meilleur des deux, s'il y en a plusieurs)
  function meilleurTransport(monde, i) {
    let m = 0;
    const n = monde.carte.colonnes, c = i % n, l = (i / n) | 0;
    for (const b of monde.batiments) { const B = C.batiments[b.type]; if (B.trafic && b.marche && Math.hypot(c - b.colonne - b.taille / 2, l - b.ligne - b.taille / 2) <= (b.rayon || 0)) m = Math.max(m, B.trafic); }
    return m;
  }

  return { TYPES, calculer, cercle };
})();
