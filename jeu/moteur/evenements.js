// 📻 LES ÉVÉNEMENTS : la radio du jeu
//
// Quand quelque chose d'important arrive (un saut, une collision, une fin de partie…),
// la partie du code concernée « annonce » l'événement à la radio. Toutes les parties
// qui écoutent cette radio réagissent, chacune de son côté.
//
// Pourquoi ? Le joueur n'a pas besoin de savoir qu'il existe une sauvegarde ou un journal :
// il annonce juste « j'ai sauté ». Demain, on pourra brancher des sons ou des succès
// sans toucher au code du joueur.

window.Jeu = window.Jeu || {};

Jeu.Evenements = (function () {
  const ecouteurs = {};

  // Demander à être prévenu quand l'événement `nom` arrive ("*" = tous les événements).
  function ecouter(nom, fonction) {
    (ecouteurs[nom] = ecouteurs[nom] || []).push(fonction);
  }

  // Annoncer un événement à tous ceux qui écoutent.
  function emettre(nom, donnees) {
    donnees = donnees || {};
    // Ceux qui écoutent tout (le journal) d'abord, pour garder l'ordre chronologique.
    for (const fonction of ecouteurs["*"] || []) fonction(donnees, nom);
    for (const fonction of ecouteurs[nom] || []) fonction(donnees, nom);
  }

  return { ecouter, emettre };
})();
