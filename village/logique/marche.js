// 🏪 LE MARCHÉ : la balance du marchand
//
// Étape 8 : au marché, on VEND ce qu'on a en trop contre des pièces 🪙, et on ACHÈTE ce qui manque.
// Le prix n'est pas fixe : il suit l'OFFRE et la DEMANDE, comme sur un vrai marché.
//   - chaque ressource a un prix de base (config.js, « marche.prix ») ;
//   - chacune a aussi un FACTEUR (1 = le prix normal, 0,5 = moitié prix, 2 = le double) ;
//   - vendre 1 objet fait baisser le facteur de 3 % (« encore des planches ? on en a plein ! ») ;
//   - acheter 1 objet le fait monter de 3 % (« ça part vite, j'augmente ! ») ;
//   - avec le temps, chaque facteur revient tout doucement vers 1.
// Acheter coûte toujours plus cher que vendre (la « marge » du marchand) : on ne peut pas s'enrichir
// en achetant puis en revendant tout de suite.
//
// Il faut un marché construit, relié par une route, avec son marchand.

window.Village = window.Village || {};

Village.Marche = (function () {
  const C = Village.CONFIG, M = C.marche;
  const radio = Village.Evenements;

  const facteur = (monde, r) => (monde.marche.facteurs[r] === undefined ? 1 : monde.marche.facteurs[r]);
  // Le prix d'UN PAQUET (5 objets), arrondi à la pièce. La recherche « Commerce » fait payer le marchand plus cher.
  const prixVente = (monde, r) => Math.max(1, Math.round(M.prix[r] * M.lot * facteur(monde, r) * Village.Recherches.bonus(monde, "vente")));
  const prixAchat = (monde, r) => Math.max(1, Math.round(M.prix[r] * M.lot * facteur(monde, r) * M.marge));

  const leMarche = (monde) => monde.batiments.find((b) => b.type === "marche" && b.etat === "pret");

  // Peut-on vendre (ou acheter) un lot de cette ressource ? null = oui, sinon la raison.
  function raison(monde, sens, r) {
    const b = leMarche(monde);
    if (!b) return "il faut d'abord construire le marché";
    if (!b.relie) return "le marché n'est pas relié à l'entrepôt";
    if (!b.ouvrier) return "il n'y a pas de marchand (il faut une place pour le loger)";
    if (!M.prix[r]) return "ça ne se vend pas";
    if (sens === "vendre" && Village.Porteurs.disponible(monde, r) < M.lot) return "il faut " + M.lot + " " + Village.Batiments.NOMS_RESSOURCES[r] + " libres";
    if (sens === "acheter" && monde.pieces < prixAchat(monde, r)) return "il manque " + (prixAchat(monde, r) - monde.pieces) + " 🪙";
    return null;
  }

  function changer(monde, r, f) { monde.marche.facteurs[r] = Math.min(M.max, Math.max(M.min, f)); }

  function vendre(monde, r) {
    const pourquoi = raison(monde, "vendre", r);
    if (pourquoi) { radio.emettre("marche-impossible", { sens: "vendre", quoi: r, raison: pourquoi }); return false; }
    const gain = prixVente(monde, r);
    monde.stock[r] -= M.lot;
    monde.pieces += gain;
    monde.marche.ventes += gain;
    changer(monde, r, facteur(monde, r) * (1 - M.baisse * M.lot));
    radio.emettre("marche-vente", { quoi: r, quantite: M.lot, gain, pieces: monde.pieces, nouveauPrix: prixVente(monde, r) });
    return true;
  }

  function acheter(monde, r) {
    const pourquoi = raison(monde, "acheter", r);
    if (pourquoi) { radio.emettre("marche-impossible", { sens: "acheter", quoi: r, raison: pourquoi }); return false; }
    const depense = prixAchat(monde, r);
    monde.pieces -= depense;
    monde.stock[r] += M.lot; // le marchand livre directement à l'entrepôt
    monde.marche.achats += depense;
    changer(monde, r, facteur(monde, r) * (1 + M.hausse * M.lot));
    radio.emettre("marche-achat", { quoi: r, quantite: M.lot, depense, pieces: monde.pieces, nouveauPrix: prixAchat(monde, r) });
    return true;
  }

  // Les prix reviennent tout doucement vers le prix normal (facteur 1).
  function etape(monde, dt) {
    const f = monde.marche.facteurs, k = Math.min(1, dt / M.retour);
    for (const r in f) {
      f[r] += (1 - f[r]) * k;
      if (Math.abs(f[r] - 1) < 0.002) delete f[r];
    }
  }

  return { prixVente, prixAchat, facteur, raison, vendre, acheter, etape, leMarche };
})();
