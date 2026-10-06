// 📻 LES ÉVÉNEMENTS : la radio du jeu
//
// Quand quelque chose d'important arrive (un tir, un obus qui touche, un tank détruit…), la partie du code
// concernée « annonce » l'événement à la radio. Toutes les parties qui écoutent la radio réagissent, chacune de son
// côté : le journal l'écrit, les sons font du bruit, la sauvegarde compte les victoires.

window.Tanks = window.Tanks || {};

Tanks.Evenements = (function () {
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
