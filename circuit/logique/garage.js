// 🏠 LE GARAGE : le vendeur de voitures
//
// Avant chaque course, on passe par le garage. On y voit les 5 voitures, une par une (← →).
//   - si la voiture est à toi : Entrée → tu la prends et la course commence ;
//   - sinon, si tu as assez de pièces : Entrée → tu l'achètes (le prix est enlevé de tes pièces) ;
//   - sinon : le garage te dit combien de pièces il te manque.
//
// Le garage LIT la base de données (tes pièces, tes voitures) mais ne l'écrit jamais lui-même :
// il annonce « achat » ou « choix-voiture » à la radio, et c'est donnees/sauvegarde.js qui range.

window.Circuit = window.Circuit || {};

Circuit.Garage = (function () {
  const VOITURES = Circuit.CONFIG.voitures;
  const radio = Circuit.Evenements;

  function voitureNumero(index) {
    return VOITURES[index];
  }

  function trouver(id) {
    return Math.max(0, VOITURES.findIndex((v) => v.id === id));
  }

  function possede(id) {
    return Circuit.Sauvegarde.donnees.voituresAchetees.includes(id);
  }

  // Ce que le garage peut dire de la voiture regardée : "a-toi", "achetable", ou "trop-chere".
  function statut(index) {
    const v = VOITURES[index];
    if (possede(v.id)) return "a-toi";
    return Circuit.Sauvegarde.donnees.pieces >= v.prix ? "achetable" : "trop-chere";
  }

  // Un pas de temps dans le garage. Renvoie true quand on part en course.
  function etape(monde, intentions) {
    const g = monde.garage;
    if (intentions.gaucheAppui || intentions.droiteAppui) {
      g.index = (g.index + (intentions.droiteAppui ? 1 : -1) + VOITURES.length) % VOITURES.length;
      g.message = null;
      radio.emettre("garage-regarde", { voiture: VOITURES[g.index].nom, statut: statut(g.index) });
      return "regarde";
    }
    if (!intentions.valider) return null;

    const v = VOITURES[g.index];
    const s = statut(g.index);
    if (s === "trop-chere") {
      const manque = v.prix - Circuit.Sauvegarde.donnees.pieces;
      g.message = "Il te manque " + manque + " pièce" + (manque > 1 ? "s" : "") + " 🪙";
      radio.emettre("pas-assez", { voiture: v.nom, prix: v.prix, manque });
      return null;
    }
    if (s === "achetable") {
      radio.emettre("achat", { id: v.id, voiture: v.nom, prix: v.prix });
      g.message = "🎉 Elle est à toi ! Entrée pour rouler";
      return null;
    }
    radio.emettre("choix-voiture", { id: v.id, voiture: v.nom });
    return "depart";
  }

  return { VOITURES, voitureNumero, trouver, possede, statut, etape };
})();
