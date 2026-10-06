// 🛏️ LE LOGEMENT : le gardien des lits
//
// Étape 8 : ✍️ Maxance a choisi la règle 2B : chaque ouvrier a besoin d'une PLACE pour dormir.
// C'est comme compter les lits d'une colonie de vacances :
//   places = 6 (les tentes du campement, autour de l'entrepôt) + 3 par hutte 🛖 + 6 par maison 🏠
//   habitants = les ouvriers des bâtiments (les porteurs dorment à l'entrepôt : ils ne comptent pas)
// Tant que habitants < places, un nouvel ouvrier peut s'installer. Sinon, la cabane attend, vide,
// qu'on construise un logement. (Les nombres sont dans config.js, « logement ».)
//
// Une partie commencée avant l'étape 8 reçoit des places offertes (monde.logementBonus) :
// personne ne doit perdre son ouvrier à cause d'une mise à jour !

window.Village = window.Village || {};

Village.Logement = (function () {
  const C = Village.CONFIG;

  // Le nombre de places : l'entrepôt, plus chaque hutte et chaque maison FINIE.
  function capacite(monde) {
    let n = C.logement.entrepot + (monde.logementBonus || 0);
    for (const b of monde.batiments) if (b.etat === "pret" && C.logement[b.type] && b.type !== "entrepot") n += C.logement[b.type];
    return n;
  }

  // Le nombre d'habitants : les bâtiments qui ont un ouvrier.
  const habitants = (monde) => monde.batiments.filter((b) => b.ouvrier).length;

  const placeLibre = (monde) => habitants(monde) < capacite(monde);

  return { capacite, habitants, placeLibre };
})();
