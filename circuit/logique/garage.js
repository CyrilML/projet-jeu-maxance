// 🏠 LE GARAGE : le vendeur de voitures
//
// Avant chaque course, on passe par le garage. On y voit les voitures, une par une (← →).
// Étape 37 : chaque carte a son garage (le circuit : 5 voitures de course ; le parcours : 4 tout-terrain).
// Les pièces et les voitures achetées sont les mêmes partout.
//   - si la voiture est à toi : Entrée → tu la prends et la course commence ;
//   - sinon, si tu as assez de pièces : Entrée → tu l'achètes (le prix est enlevé de tes pièces) ;
//   - sinon : le garage te dit combien de pièces il te manque.
//
// Le garage LIT la base de données (tes pièces, tes voitures) mais ne l'écrit jamais lui-même :
// il annonce « achat » ou « choix-voiture » à la radio, et c'est donnees/sauvegarde.js qui range.

window.Circuit = window.Circuit || {};

Circuit.Garage = (function () {
  const C = Circuit.CONFIG;
  const radio = Circuit.Evenements;
  // Étape 37 : ✍️ un garage par carte, avec des véhicules qui s'adaptent à la carte.
  const LISTES = { course: C.voitures, parcours: C.vehiculesParcours };
  let carte = "course";

  // Le garage de quelle carte ?
  function utiliser(id) {
    carte = id;
  }

  function liste() {
    return LISTES[carte] || C.voitures;
  }

  function voitureNumero(index) {
    return liste()[index];
  }

  function trouver(id) {
    return Math.max(0, liste().findIndex((v) => v.id === id));
  }

  // La fiche d'un véhicule, d'après sa forme (cherchée dans tous les garages).
  function ficheDe(modele) {
    for (const l of Object.values(LISTES)) {
      const f = l.find((v) => v.modele === modele);
      if (f) return f;
    }
    return null;
  }

  function possede(id) {
    return Circuit.Sauvegarde.donnees.voituresAchetees.includes(id);
  }

  // Ce que le garage peut dire de la voiture regardée : "a-toi", "achetable", ou "trop-chere".
  function statut(index) {
    const v = liste()[index];
    if (possede(v.id)) return "a-toi";
    return Circuit.Sauvegarde.donnees.pieces >= v.prix ? "achetable" : "trop-chere";
  }

  // Un pas de temps dans le garage. Renvoie true quand on part en course.
  function etape(monde, intentions) {
    const g = monde.garage;
    if (intentions.gaucheAppui || intentions.droiteAppui) {
      const n = liste().length;
      g.index = (g.index + (intentions.droiteAppui ? 1 : -1) + n) % n;
      g.message = null;
      radio.emettre("garage-regarde", { voiture: liste()[g.index].nom, statut: statut(g.index) });
      return "regarde";
    }
    if (!intentions.valider) return null;

    const v = liste()[g.index];
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
    radio.emettre("choix-voiture", { id: v.id, voiture: v.nom, carte });
    return "depart";
  }

  return { utiliser, liste, voitureNumero, trouver, ficheDe, possede, statut, etape, get carte() { return carte; } };
})();
