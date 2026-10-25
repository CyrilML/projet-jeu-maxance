// 📜 L'ÉDITION DU JOUR : le panneau à l'entrée du théâtre (demande 115)
//
// Comme la carte du jour (donnees/carte-du-jour.js) : le costume du jeu (l'édition) est cousu UNE FOIS, au chargement de
// la page, avant que les autres fichiers ne lisent leurs réglages. Alors, tout au début, ce panneau lit dans le livret
// (la sauvegarde) QUELLE édition a été choisie. Changer d'édition = recharger la page (l'écran des éditions s'en occupe).
// Pour essayer sans toucher au livret : « index.html?edition=1916 ».
// (C'est un fichier de « donnees/ » parce qu'il lit le stockage ; il ne fait que lire.)

window.Tanks = window.Tanks || {};

Tanks.EditionDuJour = (function () {
  const CLE = "tanks-maxance:sauvegarde"; // (la même clé que donnees/sauvegarde.js)
  let id = "moderne", source = "départ";
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const d = JSON.parse(brut);
      if (d && typeof d.edition === "string") (id = d.edition), (source = "livret");
    }
  } catch (e) {
    id = "moderne";
  }
  try {
    const p = new URLSearchParams(location.search).get("edition");
    if (p) (id = p), (source = "adresse");
  } catch (e) { /* (pas d'adresse : rien) */ }
  const f = Tanks.EDITIONS.fiche(id);
  if (!f || !f.pret || (id !== "moderne" && !Tanks.EDITIONS.donnees[id])) (id = "moderne"), (source += " (pas prête : Moderne)");
  return { id, source };
})();
