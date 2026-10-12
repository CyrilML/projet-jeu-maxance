// 🏛️ LES CARTES DE LA VILLE : services, loisirs, pollution, trafic et valeur du terrain
//
// Ce module dessine des CARTES INVISIBLES (une valeur par case), que tu peux voir avec les calques (bouton 🗺️) :
//   - les SERVICES (étape 14, ✍️ Maxance : « plutôt que des rayons d'action, travailler au nombre d'habitants ») :
//     chaque école, hôpital, commissariat, caserne, parc, arrêt de bus… a une CAPACITÉ (1 500 habitants pour une école).
//     Comme l'eau, il sert d'abord les plus proches PAR LA ROUTE, tant qu'il reste de la place. Peu importe où on le
//     pose, pourvu qu'il touche une route reliée à la ville (et qu'il ait l'électricité ; un parc, lui, s'en passe) ;
//   - la POLLUTION 🌫️ : les industries et la centrale à charbon salissent l'air autour d'elles ;
//   - le TRAFIC 🚗 : chaque habitant et chaque emploi fait des trajets sur les routes proches. Une route trop chargée,
//     c'est un bouchon ! Les bus et le métro en enlèvent une partie ; une avenue en laisse passer plus ;
//   - la VALEUR DU TERRAIN 💎 : de 0 à 1. Elle monte au bord de l'eau, avec chaque service REÇU (étape 14), et baisse avec
//     la pollution et les bouchons (étape 11 : et près d'une décharge, avec des poubelles pas ramassées, ou une eau sale). Les beaux bâtiments ne poussent que là où le terrain vaut cher !

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

  // 🏘️ Étape 15 : le BONUS DE QUARTIER de chaque case (ajouté à l'envie de venir, voir zones.js)
  //   les voisins : le niveau MOYEN des bâtiments construits à « rayon » cases autour × parNiveau
  //   + les services : parService par service reçu (au plus maxServices) ; le tout au plus « max »
  // (on compte les voisins avec un « tableau des sommes », comme pour le trafic : très rapide)
  function quartier(monde) {
    const n = monde.carte.colonnes, N = n * n, Q = C.croissance.quartier, W = n + 1, r = Q.rayon;
    if (!monde.quartier || monde.quartier.length !== N) { monde.quartier = new Float32Array(N); monde.quartierVoisins = new Float32Array(N); monde.quartierServices = new Float32Array(N); monde.quartierValeur = new Float32Array(N); }
    const somNv = new Float32Array(W * W), somNb = new Float32Array(W * W);
    for (let l = 0; l < n; l++) { let a = 0, b = 0; for (let c = 0; c < n; c++) { const i = l * n + c, bati = monde.zone[i] && monde.niveau[i]; a += bati ? monde.niveau[i] : 0; b += bati ? 1 : 0; const k = (l + 1) * W + c + 1; somNv[k] = somNv[k - W] + a; somNb[k] = somNb[k - W] + b; } }
    const rect = (S, c0, l0, c1, l1) => S[(l1 + 1) * W + c1 + 1] - S[l0 * W + c1 + 1] - S[(l1 + 1) * W + c0] + S[l0 * W + c0];
    let total = 0, nb = 0;
    for (const i of monde.zonees) {
      const c = i % n, l = (i / n) | 0, c0 = Math.max(0, c - r), l0 = Math.max(0, l - r), c1 = Math.min(n - 1, c + r), l1 = Math.min(n - 1, l + r);
      const moi = monde.niveau[i] ? 1 : 0; // (on ne se compte pas soi-même : ce sont les VOISINS qui attirent)
      const nbv = rect(somNb, c0, l0, c1, l1) - moi, nv = rect(somNv, c0, l0, c1, l1) - monde.niveau[i];
      const voisins = nbv > 0 ? (nv / nbv) * Q.parNiveau : 0;
      monde.quartierValeur[i] = nbv > 0 ? Math.min(C.valeur.quartier.max, (nv / nbv) * C.valeur.quartier.parNiveau) : 0; // (étape 18 : ce que le quartier ajoute à la VALEUR)
      let s = 0; for (const t of TYPES) if (monde.couverture[t][i]) s++;
      const services = Math.min(Q.maxServices, s * Q.parService);
      monde.quartierVoisins[i] = voisins; monde.quartierServices[i] = services;
      monde.quartier[i] = Math.min(Q.max, voisins + services);
      total += monde.quartier[i]; nb++;
    }
    monde.quartierMoyen = nb ? total / nb : 0;
  }

  function calculer(monde) {
    const k = monde.carte, n = k.colonnes, N = n * n;
    // 1. Les services : chacun sert un NOMBRE d'habitants (ou d'habitants + emplois), les plus proches par la route d'abord
    const bonus = new Float32Array(N);
    distribuer(monde);
    quartier(monde);
    for (const t of TYPES) { const v = C.valeur.services[t] || 0, cv = monde.couverture[t]; for (let i = 0; i < N; i++) if (cv[i]) bonus[i] += v; } // (ce qu'un service reçu ajoute à la valeur)
    // (étape 11) une décharge salit le terrain autour d'elle
    for (const b of monde.batiments) { const S = C.batiments[b.type].salete; if (S) cercle(monde, b, S.rayon, (i, part) => (bonus[i] -= S.force * (1 - part * 0.6))); }
    // 2. La pollution : l'industrie (selon son niveau) et la centrale à charbon
    const P = monde.pollution;
    P.fill(0);
    const salir = (c0, l0, force, rayon) => { for (let l = Math.max(0, l0 - rayon); l <= Math.min(n - 1, l0 + rayon); l++) for (let c = Math.max(0, c0 - rayon); c <= Math.min(n - 1, c0 + rayon); c++) { const d = Math.hypot(c - c0, l - l0); if (d <= rayon) P[l * n + c] += force * (1 - d / (rayon + 1)); } };
    const propre = Megalopole.Ameliorations.effet(monde, "pollutionIndustrie"); // (étape 17 : les recherches 🔬 de l'industrie propre)
    for (let i = 0; i < N; i++) if (monde.zone[i] === C.zones.I.id && monde.niveau[i]) salir(i % n, (i / n) | 0, C.pollution.industrie * propre * Math.min(4, monde.niveau[i]) / 2, C.pollution.rayon);
    for (const b of monde.batiments) { const B = C.batiments[b.type]; if (B.pollution) salir(b.colonne + (b.taille >> 1), b.ligne + (b.taille >> 1), B.pollution, C.pollution.centraleRayon); }
    for (let i = 0; i < N; i++) if (P[i] > 1) P[i] = 1;
    // 3. Le trafic : on fait la somme des gens autour de chaque route (avec un « tableau des sommes », très rapide)
    const gens = new Float32Array((n + 1) * (n + 1)); // gens[(l+1)*(n+1) + c+1] = la somme du rectangle (0,0)-(c,l)
    // (étape 14 : ceux qui prennent le bus ou le métro ne prennent pas la voiture : moinsDeTrafic)
    for (let l = 0; l < n; l++) { let ligne = 0; for (let c = 0; c < n; c++) { const i = l * n + c; ligne += monde.zone[i] && monde.niveau[i] ? Megalopole.Zones.gensDe(monde, i) * (1 - monde.moinsDeTrafic[i]) : 0; gens[(l + 1) * (n + 1) + c + 1] = gens[l * (n + 1) + c + 1] + ligne; } }
    const somme = (c0, l0, c1, l1) => { c0 = Math.max(0, c0); l0 = Math.max(0, l0); c1 = Math.min(n - 1, c1); l1 = Math.min(n - 1, l1); const W = n + 1; return gens[(l1 + 1) * W + c1 + 1] - gens[l0 * W + c1 + 1] - gens[(l1 + 1) * W + c0] + gens[l0 * W + c0]; };
    const T = monde.trafic, r = C.trafic.rayon;
    let bouchons = 0, routes = 0, total = 0;
    for (let i = 0; i < N; i++) {
      if (!monde.route[i]) { T[i] = 0; continue; }
      const c = i % n, l = (i / n) | 0, cap = (monde.route[i] === 2 ? C.routes.avenue.capacite : C.routes.route.capacite) * (0.6 + 0.4 * monde.etatRoutes); // étape 2 : une route abîmée laisse passer moins de voitures
      // le nombre de routes autour : le trafic se partage entre elles
      let voisines = 0; for (let dl = -r; dl <= r; dl += r) for (let dc = -r; dc <= r; dc += r) { const cc = c + dc, ll = l + dl; if (cc >= 0 && ll >= 0 && cc < n && ll < n && monde.route[ll * n + cc]) voisines++; }
      let t = (somme(c - r, l - r, c + r, l + r) * C.trafic.parGens) / Math.max(1, voisines) / cap;
      T[i] = Math.min(2, t); routes++; total += T[i]; if (T[i] > 1) bouchons++;
    }
    monde.statsTrafic = { routes, bouchons, moyen: routes ? total / routes : 0 };
    // 4. La valeur du terrain
    const V = monde.valeur, Vb = C.valeur, ratioEpure = monde.reseaux.epuration ? monde.reseaux.epuration.ratio : 1;
    for (let i = 0; i < N; i++) {
      let v = Vb.base - (1 - monde.etatRoutes) * 0.1 + bonus[i] + (monde.zone[i] === C.zones.R.id ? monde.quartierValeur[i] : 0) + /* (étape 18 : seulement les habitations) */  (monde.bordDeLEau[i] ? Vb.bordDeLEau * (1 - 1.5 * (1 - ratioEpure)) : 0) - P[i] * Vb.parPollution; // (étape 11 : l'eau sale gâche le bord de l'eau)
      if (monde.zone[i] && monde.niveau[i] && !monde.collecte[i]) v -= C.dechets.valeurSale; // (étape 11 : des poubelles pas ramassées)
      const rp = monde.routeProche[i];
      if (rp >= 0) v -= Math.max(0, T[rp] - 0.6) * Vb.parTrafic;
      V[i] = Math.max(0, Math.min(1, v));
    }
  }
  // ---------------------------------------------------------------- 🏛️ la distribution des services (étape 14)
  // 1. On numérote les « morceaux » de routes reliées entre elles (une ville peut avoir 2 quartiers séparés).
  // 2. Pour chaque sorte de service, une tache d'encre part des routes qui touchent ses bâtiments (la distance par la route),
  //    et chaque morceau de routes a une RÉSERVE de places : la somme des capacités de ses bâtiments (× le budget).
  // 3. Les terrains bâtis demandent des places (leurs habitants, ou habitants + emplois) ; les plus proches d'abord, tant
  //    que la réserve de leur morceau n'est pas vide.
  const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function morceaux(monde) {
    const n = monde.carte.colonnes, N = n * n, R = monde.route, num = new Int32Array(N).fill(-1);
    let k2 = 0;
    for (let i = 0; i < N; i++) {
      if (!R[i] || num[i] >= 0) continue;
      const pile = [i]; num[i] = k2;
      while (pile.length) { const j = pile.pop(), c = j % n, l = (j / n) | 0; for (const [dc, dl] of VOISINS) { const cc = c + dc, ll = l + dl; if (cc < 0 || ll < 0 || cc >= n || ll >= n) continue; const q = ll * n + cc; if (R[q] && num[q] < 0) { num[q] = k2; pile.push(q); } } }
      k2++;
    }
    return num;
  }
  function distribuer(monde) {
    const k = monde.carte, n = k.colonnes, N = n * n, R = monde.route, A = C.routes.accesMax, num = morceaux(monde);
    monde.moinsDeTrafic = monde.moinsDeTrafic && monde.moinsDeTrafic.length === N ? monde.moinsDeTrafic.fill(0) : new Float32Array(N);
    monde.services = {};
    for (const t of TYPES) {
      const cv = monde.couverture[t]; cv.fill(0);
      const sources = monde.batiments.filter((b) => C.batiments[b.type].service === t);
      const dist = new Int32Array(N).fill(-1), reserve = new Map(), meilleurTrafic = new Map(), avant = new Map();
      let file = [], capacite = 0;
      for (const b of sources) {
        const B = C.batiments[b.type];
        b.marche = monde.reseaux.courantDe ? monde.reseaux.courantDe(b) : false;
        b.capaciteService = (b.marche || t === "loisirs" ? B.capacite : 0) * Megalopole.Budget.facteurRayon(monde, B) * Megalopole.Ameliorations.facteur(b); // (étape 17 : × ses étoiles ⭐) // (un parc n'a pas besoin de courant ; le budget change la capacité)
        b.relie = false; b.servis = 0;
        if (b.capaciteService <= 0) continue;
        for (let dl = -1; dl <= b.taille; dl++) for (let dc = -1; dc <= b.taille; dc++) {
          const c = b.colonne + dc, l = b.ligne + dl;
          if (c < 0 || l < 0 || c >= n || l >= n) continue;
          const j = l * n + c;
          if (!R[j]) continue;
          if (!b.relie) { b.relie = true; b.morceau = num[j]; reserve.set(num[j], (reserve.get(num[j]) || 0) + b.capaciteService); capacite += b.capaciteService; if (B.trafic) meilleurTrafic.set(num[j], Math.max(meilleurTrafic.get(num[j]) || 0, B.trafic)); }
          if (dist[j] < 0) { dist[j] = 0; file.push(j); }
        }
      }
      for (const [m2, r] of reserve) avant.set(m2, r);
      for (let d = 1; file.length; d++) { const suivante = []; for (const i of file) { const c = i % n, l = (i / n) | 0; for (const [dc, dl] of VOISINS) { const cc = c + dc, ll = l + dl; if (cc < 0 || ll < 0 || cc >= n || ll >= n) continue; const j = ll * n + cc; if (!R[j] || dist[j] >= 0) continue; dist[j] = d; suivante.push(j); } } file = suivante; }
      // les clients : les terrains bâtis (les habitations seulement, ou tout le monde pour la police, les pompiers et les bus)
      const tous = sources.length ? C.batiments[sources[0].type].pour === "tous" : t === "securite" || t === "feu" || t === "transport", clients = [];
      let demande = 0, horsReseau = 0;
      for (let i = 0; i < N; i++) {
        if (!monde.niveau[i] || !monde.zone[i] || (!tous && monde.zone[i] !== C.zones.R.id)) continue;
        const gens = Megalopole.Zones.gensDe(monde, i);
        demande += gens;
        let best = -1, morceau = -1;
        const c = i % n, l = (i / n) | 0;
        for (let dl = -A; dl <= A; dl++) for (let dc = -A; dc <= A; dc++) { const pas = Math.abs(dl) + Math.abs(dc), cc = c + dc, ll = l + dl; if (pas > A || cc < 0 || ll < 0 || cc >= n || ll >= n) continue; const j = ll * n + cc; if (!R[j] || dist[j] < 0) continue; if (best < 0 || dist[j] + pas < best) { best = dist[j] + pas; morceau = num[j]; } }
        if (best < 0) { horsReseau++; continue; }
        clients.push([best * 4 + (i & 3), gens, i, morceau]);
      }
      clients.sort((x, y) => x[0] - y[0]);
      let servis = 0;
      for (const [, gens, i, m2] of clients) { const r = reserve.get(m2) || 0; if (r >= gens) { reserve.set(m2, r - gens); cv[i] = 1; servis += gens; if (t === "transport") monde.moinsDeTrafic[i] = meilleurTrafic.get(m2) || 0; } }
      for (const b of sources) if (b.relie) { const r0 = avant.get(b.morceau) || 1; b.servis = Math.round((b.capaciteService * (r0 - (reserve.get(b.morceau) || 0))) / r0); } // (la part de ce bâtiment)
      monde.services[t] = { capacite: Math.round(capacite), demande, servis, horsReseau, batiments: sources.length, tous };
    }
  }

  return { TYPES, calculer, cercle, distribuer };
})();
