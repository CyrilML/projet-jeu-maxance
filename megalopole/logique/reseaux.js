// 🔌 LES RÉSEAUX : l'accès aux routes, l'électricité ⚡ et l'eau 💧
//
// 1. L'ACCÈS. Un terrain ne peut accueillir un bâtiment que s'il est à 2 cases au plus d'une route : c'est par la
//    route qu'arrivent les camions de chantier, les habitants, et les tuyaux. On le calcule avec une « tache d'encre »
//    (une recherche en largeur) qui part de toutes les routes à la fois et s'arrête à 2 cases.
// 2. L'ÉLECTRICITÉ et l'EAU suivent les routes (les câbles et les tuyaux sont sous la chaussée), comme dans le village :
//    une seconde tache d'encre part des centrales (ou des pompes) le long des routes, et compte la distance. Les
//    bâtiments les plus PROCHES sont servis d'abord ; quand la production est épuisée, les plus loin n'ont rien : c'est
//    une PÉNURIE, il faut une centrale (ou une pompe) de plus.
// Les sources ne produisent pas toutes pareil : l'éolienne dépend du vent, le solaire du soleil (rien la nuit !).

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
    if (!B[quoi]) return 0;
    if (quoi === "eau" && !monde.reseaux.courantDe(b)) return 0; // une pompe a besoin de courant pour pomper
    return Math.round(B[quoi] * (B.vent ? vent(monde) : 1) * (B.soleil ? soleil(monde) : 1));
  }

  // 1. L'accès : pour chaque case, la route la plus proche (à 2 cases au plus), ou -1
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

  // 2. Un réseau (« courant » ou « eau ») : la tache d'encre depuis les sources, le long des routes
  function distribuer(monde, quoi) {
    const k = monde.carte, n = k.colonnes, N = n * n, R = monde.route, servi = quoi === "courant" ? monde.courant : monde.eau;
    servi.fill(0);
    const sources = monde.batiments.filter((b) => C.batiments[b.type][quoi]);
    const dist = new Int32Array(N).fill(-1);
    let file = [], offre = 0;
    for (const b of sources) {
      const p = production(monde, b, quoi);
      b[quoi === "courant" ? "production" : "productionEau"] = p;
      offre += p;
      if (p <= 0) continue;
      // la tache d'encre part des routes qui touchent la source
      for (let dl = -1; dl <= b.taille; dl++) for (let dc = -1; dc <= b.taille; dc++) {
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
    let demande = 0, horsReseau = 0;
    const conso = C.consommation[quoi];
    for (let i = 0; i < N; i++) {
      const nv = monde.niveau[i];
      if (!nv || !monde.zone[i]) continue;
      if (quoi === "eau" && monde.zone[i] === C.zones.A.id && nv < 2) continue; // un champ n'a pas besoin de l'eau courante
      const r = monde.routeProche[i], d = r >= 0 ? dist[r] : -1;
      demande += conso[nv];
      if (d < 0) { horsReseau++; continue; }
      clients.push(d * 4 + (i & 3), conso[nv], i); // (le petit « i & 3 » mélange les égalités)
    }
    const ordre = [];
    for (let k2 = 0; k2 < clients.length; k2 += 3) ordre.push(k2);
    ordre.sort((a, b) => clients[a] - clients[b]);
    let utilise = 0, coupes = 0;
    for (const k2 of ordre) {
      const besoin = clients[k2 + 1];
      if (utilise + besoin <= offre) { utilise += besoin; servi[clients[k2 + 2]] = 1; } else coupes++;
    }
    const etat = monde.reseaux[quoi], avant = etat.penurie;
    Object.assign(etat, { offre, demande, utilise, coupes, horsReseau, penurie: coupes > 0, reste: Math.max(0, offre - utilise), sources: sources.length, atteint: dist });
    if (etat.penurie !== avant) radio.emettre(quoi + (etat.penurie ? "-penurie" : "-ok"), { offre, demande, coupes });
    return etat;
  }

  // Un terrain vide peut-il recevoir du courant (ou de l'eau) ? Oui si sa route est sur le réseau et qu'il en reste.
  function possible(monde, i, quoi) {
    const e = monde.reseaux[quoi], r = monde.routeProche[i];
    return !!(e && e.atteint && r >= 0 && e.atteint[r] >= 0 && e.reste > 0);
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
  }

  return { vent, soleil, heure, production, calculer, possible };
})();
