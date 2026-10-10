// 👣 LE GUIDE : les objectifs pas à pas
//
// Étape 30 : ✍️ les objectifs d'un âge étaient une grosse liste d'un coup (« 18 bâtiments, 16 habitants, 7 recherches… »).
// Le guide les découpe en PETITES ÉTAPES, une à la fois, chacune avec sa raison : « Construis une scierie : elle
// transforme les troncs en planches ». Quand l'étape est réussie, on gagne quelques 🪙 et on passe à la suivante.
// Les étapes sont rangées comme des données dans config.js (« guide »). Le guide lit le monde ; il ne fait que compter.

window.Village = window.Village || {};

Village.Guide = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;

  const liste = (monde) => C.guide.ages[monde.age || 0] || [];
  // Où en est-on d'une étape ? { valeur, cible }
  function avancement(monde, e) {
    if (e.batiment) return { valeur: monde.batiments.filter((b) => b.type === e.batiment && b.etat === "pret").length, cible: e.nombre };
    if (e.stock) return { valeur: monde.stock[e.stock] || 0, cible: e.nombre };
    if (e.recherche) return { valeur: monde.recherches.faites.includes(e.recherche) ? 1 : 0, cible: 1 }; // étape 51
    if (e.recherches) return { valeur: monde.recherches.faites.length, cible: e.recherches };
    if (e.habitants) return { valeur: Village.Logement.habitants(monde), cible: e.habitants };
    if (e.filons) return { valeur: monde.carte.compte.vus || 0, cible: e.filons };
    if (e.commandes) return { valeur: monde.commandes.livrees, cible: e.commandes };
    if (e.pieces) return { valeur: monde.pieces, cible: e.pieces };
    if (e.courant) return { valeur: monde.batiments.filter((b) => b.courant).length, cible: e.courant }; // étape 34
    if (e.logementsCourant) return { valeur: Math.round(Village.Electricite.partLogements(monde) * 100), cible: e.logementsCourant };
    if (e.logementsEau) return { valeur: Math.round(Village.Electricite.partLogements(monde, "eau") * 100), cible: e.logementsEau }; // étape 35
    if (e.logementsReseaux) return { valeur: Math.round(Village.Electricite.partLogements(monde, ["courant", "eau", "egout"]) * 100), cible: e.logementsReseaux }; // étape 48
    if (e.logementsService) return { valeur: Math.round(Village.Services.part(monde, e.logementsService) * 100), cible: e.cible };
    if (e.merveille) return { valeur: Village.Monument.paliersFaits(monde, "merveille"), cible: e.merveille }; // étape 53
    if (e.monument) return { valeur: Village.Monument.paliersFaits(monde), cible: e.monument }; // étape 31
    if (e.bonheur) return { valeur: Math.round(monde.bonheur.valeur || 0), cible: e.bonheur };
    return { valeur: 0, cible: 1 };
  }
  // L'étape en cours (null : toutes faites pour cet âge)
  function actuelle(monde) {
    const l = liste(monde), n = monde.guide.age === (monde.age || 0) ? monde.guide.numero : 0;
    return n < l.length ? Object.assign({ numero: n, total: l.length }, l[n], avancement(monde, l[n])) : null;
  }

  let minuteur = 0;
  function etape(monde, dt) {
    minuteur -= dt;
    if (minuteur > 0) return;
    minuteur = 1;
    const g = monde.guide;
    if (g.age !== (monde.age || 0)) { g.age = monde.age || 0; g.numero = 0; } // un nouvel âge : on recommence au début
    const e = actuelle(monde);
    if (!e || e.valeur < e.cible) return;
    const gain = C.guide.recompense * ((monde.age || 0) + 1);
    monde.pieces += gain;
    g.numero++;
    radio.emettre("guide-etape", { texte: e.texte, numero: e.numero + 1, total: e.total, pieces: gain, suivante: (actuelle(monde) || {}).texte || null });
  }

  return { actuelle, avancement, etape };
})();
