// 🗺️ LA CARTE DU JOUR : le panneau à l'entrée du chantier (étape 81)
//
// Les 4 nouvelles cartes (la ville, la ville en ruines, le désert, le village du désert) sont des VARIANTES de la
// grande bataille : le même terrain, mais d'autres réglages (plus de maisons, moins d'arbres, du sable…). Le décor est
// fabriqué UNE FOIS, au chargement de la page. Alors, avant que le géomètre (logique/terrain.js) et les peintres ne
// commencent, ce panneau lit dans la sauvegarde QUELLE carte a été choisie, et affiche ses réglages pour tout le monde.
// Changer de décor dans le menu = recharger la page (main.js s'en occupe), pour tout refaire avec les nouveaux réglages.
// (C'est un fichier de « donnees/ » parce qu'il lit le stockage ; il ne fait que lire.)

window.Tanks = window.Tanks || {};

Tanks.CarteDuJour = (function () {
  const C = Tanks.CONFIG;
  const CLE = "tanks-maxance:sauvegarde"; // (la même clé que donnees/sauvegarde.js)
  let id = "bataille";
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) id = JSON.parse(brut).carte || "bataille";
  } catch (e) {
    id = "bataille";
  }
  const carte = C.cartes.find((c) => c.id === id) || C.cartes[0];
  // le DÉCOR : la carte elle-même pour une variante ; sinon (la grande bataille ou le souterrain), la campagne habituelle
  const decorDe = (c) => (c && c.variante ? c.id : "bataille");
  return { id: carte.id, decor: decorDe(carte), variante: carte.variante || {}, nom: carte.nom, icone: carte.icone, decorDe };
})();
