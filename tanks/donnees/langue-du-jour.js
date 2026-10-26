// 🌐 LA LANGUE DU JOUR : l'étiquette sur la porte (demande 116)
//
// ✍️ « Je veux le jeu entier en anglais. » → ✍️ « Bouton FR / EN ».
// Comme l'édition du jour (donnees/edition-du-jour.js) : la langue est choisie UNE FOIS, au chargement de la page,
// avant que l'interprète (affichage/interprete.js) ne se mette au travail. Alors, tout au début, ce panneau lit dans le
// livret (la sauvegarde) QUELLE langue a été choisie : "fr" (le français, au départ) ou "en" (l'anglais).
// Changer de langue = recharger la page (le bouton FR / EN de l'accueil s'en occupe).
// Pour essayer sans toucher au livret : « index.html?langue=en ».
// (C'est un fichier de « donnees/ » parce qu'il lit le stockage ; il ne fait que lire.)

window.Tanks = window.Tanks || {};

Tanks.LangueDuJour = (function () {
  const CLE = "tanks-maxance:sauvegarde"; // (la même clé que donnees/sauvegarde.js)
  const CONNUES = ["fr", "en"];
  let code = "fr", source = "départ";
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const d = JSON.parse(brut);
      if (d && typeof d.langue === "string") (code = d.langue), (source = "livret");
    }
  } catch (e) {
    code = "fr";
  }
  try {
    const p = new URLSearchParams(location.search).get("langue");
    if (p) (code = p), (source = "adresse");
  } catch (e) { /* (pas d'adresse : rien) */ }
  if (!CONNUES.includes(code)) (code = "fr"), (source += " (inconnue : français)");
  return { code, source, connues: CONNUES };
})();
