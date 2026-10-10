// 📻 LES ÉVÉNEMENTS : la radio du jeu
//
// Quand quelque chose d'important arrive (une carte inventée, une case choisie…), la partie du code
// concernée « annonce » l'événement à la radio. Toutes les parties qui écoutent réagissent, chacune
// de son côté. La carte n'a pas besoin de savoir qu'il existe un journal ou une sauvegarde.

window.Megalopole = window.Megalopole || {};

Megalopole.Evenements = (function () {
  const ecouteurs = {};

  // Demander à être prévenu quand l'événement `nom` arrive ("*" = tous les événements).
  function ecouter(nom, fonction) {
    (ecouteurs[nom] = ecouteurs[nom] || []).push(fonction);
  }

  // Annoncer un événement à tous ceux qui écoutent.
  function emettre(nom, donnees) {
    donnees = donnees || {};
    for (const fonction of ecouteurs["*"] || []) fonction(donnees, nom);
    for (const fonction of ecouteurs[nom] || []) fonction(donnees, nom);
  }

  return { ecouter, emettre };
})();
