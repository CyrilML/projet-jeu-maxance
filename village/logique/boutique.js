// 💎 LA BOUTIQUE : dépenser ses gemmes
//
// Les gemmes 💎 se gagnent seulement en jouant : en réussissant des missions, et à chaque nouvel âge.
// Aucun vrai argent ! Elles achètent des améliorations (un porteur de plus, un chantier express),
// des réserves, ou des décorations (la couleur du drapeau). La liste est dans config.js (« boutique »).

window.Village = window.Village || {};

Village.Boutique = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const COULEURS_DRAPEAU = ["#3e7bff", "#e8402e", "#2fb34a", "#ffcf2e", "#a24bd6", "#ff8a1f", "#ffffff"];

  function raison(monde, id) {
    const o = C.boutique.find((x) => x.id === id);
    if (!o) return "objet inconnu";
    if (monde.gemmes < o.prix) return "il manque " + (o.prix - monde.gemmes) + " 💎";
    if (id === "porteur" && monde.porteurs.length >= C.porteursMax) return "il y a déjà " + C.porteursMax + " porteurs";
    if (id === "bourse" && (monde.age || 0) < 2) return "pas encore : les pièces arrivent avec le village 🏡";
    if (id === "express" && !(monde.selection && monde.selection.etat === "chantier")) return "touche d'abord un chantier";
    return null;
  }

  function acheter(monde, id) {
    const o = C.boutique.find((x) => x.id === id), pourquoi = raison(monde, id);
    if (pourquoi) { radio.emettre("achat-impossible", { nom: o ? o.nom : id, raison: pourquoi }); return false; }
    monde.gemmes -= o.prix;
    if (id === "porteur") Village.Porteurs.ajouterPorteur(monde);
    else if (id === "coffre") { monde.stock.planches += 20; monde.stock.pierres += 10; }
    else if (id === "festin") { monde.stock.poissons += 15; monde.stock.viande += 10; }
    else if (id === "bourse") monde.pieces += 40; // étape 8
    else if (id === "drapeau") monde.drapeau = ((monde.drapeau || 0) + 1) % COULEURS_DRAPEAU.length;
    else if (id === "express") {
      // Tous les matériaux arrivent d'un coup, et le chantier se termine au prochain pas.
      const b = monde.selection;
      b.livre = Object.assign({}, b.prix);
      b.attendu = {};
      b.enFile = {};
      monde.file = monde.file.filter((t) => t.batiment !== b);
      b.progres = 0.999;
    }
    radio.emettre("achat", { nom: o.nom, emoji: o.emoji, prix: o.prix, gemmes: monde.gemmes });
    return true;
  }

  return { raison, acheter, COULEURS_DRAPEAU };
})();
