// 📊 LES STATISTIQUES : le compteur à la porte de l'entrepôt
//
// Étape 8 : ✍️ (choix 3A) on veut savoir, pour chaque ressource, combien on en PRODUIT et combien on en
// CONSOMME par minute. Imagine un gardien assis à la porte de l'entrepôt avec un carnet : chaque fois
// qu'un objet entre, il fait un trait dans la colonne « entrées » ; chaque fois qu'un objet sort
// (un repas, des planches pour un chantier, une vente au marché…), un trait dans « sorties ».
//
// Toutes les 10 secondes (de jeu), il tourne la page. Il garde les 30 dernières pages (5 minutes).
//   par minute = (traits des pages gardées) ÷ (minutes que couvrent ces pages)
// Sur chaque page, il note aussi le stock du moment : ça donne la petite courbe du panneau 📊.
//
// Comment le gardien voit-il TOUT passer, sans qu'on change chaque ligne du jeu ? Le stock est
// enveloppé dans un « Proxy » : un objet-espion qui ressemble au stock, mais qui est prévenu chaque fois
// qu'on écrit dedans (stock.planches = 12). C'est comme une porte qui compte ceux qui la traversent.
// Les statistiques ne sont pas sauvegardées : elles recommencent à zéro à chaque partie.
//
// Étape 11 : le gardien met une petite étoile ★ à côté des traits qui viennent de TOI (vendre, acheter,
// livrer une mission, payer une recherche ou un chantier, une pub…). Sans les étoiles, il reste le
// TRAVAIL du village : c'est ce rythme-là qui continue quand tu n'es pas là (voir logique/reserve.js).

window.Village = window.Village || {};

Village.Statistiques = (function () {
  const C = Village.CONFIG, S = C.statistiques;

  const page = (stock) => ({ entrees: {}, sorties: {}, entreesT: {}, sortiesT: {}, stock: Object.assign({}, stock), duree: 0 });
  let parLeJoueur = 0; // > 0 pendant une action du joueur

  // Mettre le gardien à la porte : le stock du monde devient un Proxy qui compte tout.
  function surveiller(monde) {
    const brut = monde.stock;
    monde.stats = { pages: [page(brut)], temps: 0 };
    monde.stock = new Proxy(brut, {
      set(cible, r, valeur) {
        const ecart = valeur - (cible[r] || 0);
        cible[r] = valeur;
        if (ecart && typeof ecart === "number") {
          const p = monde.stats.pages[monde.stats.pages.length - 1], colonne = ecart > 0 ? p.entrees : p.sorties;
          colonne[r] = (colonne[r] || 0) + Math.abs(ecart);
          if (!parLeJoueur) { const t = ecart > 0 ? p.entreesT : p.sortiesT; t[r] = (t[r] || 0) + Math.abs(ecart); } // le travail du village
        }
        return true;
      },
    });
  }

  // Le temps passe : toutes les 10 s, on tourne la page.
  function etape(monde, dt) {
    const st = monde.stats, p = st.pages[st.pages.length - 1];
    st.temps += dt;
    p.duree += dt;
    if (p.duree < S.tranche) return;
    p.stock = Object.assign({}, monde.stock);
    st.pages.push(page(monde.stock));
    if (st.pages.length > S.tranches) st.pages.shift();
  }

  // Étape 11 : faire quelque chose « de la part du joueur » (le compteur met une étoile).
  function horsCompte(monde, faire) { parLeJoueur++; try { return faire(); } finally { parLeJoueur--; } }

  // Par minute, sur les pages gardées : { entrees, sorties, net } pour une ressource.
  // travail = true : seulement le travail du village (sans les actions du joueur).
  function parMinute(monde, r, travail) {
    let e = 0, s = 0, duree = 0;
    for (const p of monde.stats.pages) { e += (travail ? p.entreesT : p.entrees)[r] || 0; s += (travail ? p.sortiesT : p.sorties)[r] || 0; duree += p.duree; }
    const minutes = Math.max(duree, 1) / 60;
    return { entrees: e / minutes, sorties: s / minutes, net: (e - s) / minutes, minutes: duree / 60 };
  }

  // La petite courbe : le stock à la fin de chaque page (et maintenant).
  function courbe(monde, r) {
    const pages = monde.stats.pages;
    return pages.slice(0, -1).map((p) => p.stock[r] || 0).concat([monde.stock[r] || 0]);
  }

  return { surveiller, etape, parMinute, courbe, horsCompte };
})();
