// 🏆 LE CLASSEMENT : l'arbitre du tableau d'honneur
//
// Ce fichier connaît les RÈGLES du classement, mais il ne range rien lui-même :
// c'est donnees/sauvegarde.js qui garde la liste dans la base de données.
//
// Les règles (décidées par Maxance) :
//   1. le plus de BLOCS parcourus passe devant ;
//   2. à égalité de blocs, celui qui a le plus de VIES restantes passe devant ;
//   3. encore à égalité ? Le plus RAPIDE (le moins de temps) passe devant.
// Chaque joueur n'a qu'UNE ligne : sa meilleure partie. On garde les 10 meilleurs.
//
// Pour comparer deux parties, on écrit une fonction qui répond « qui passe devant ? ».
// Le tableau se trie ensuite tout seul avec .sort() : c'est comme ranger des cartes.

window.Jeu = window.Jeu || {};

Jeu.Classement = (function () {
  const C = Jeu.CONFIG;

  // Renvoie un nombre négatif si a passe devant b, positif si b passe devant a.
  function comparer(a, b) {
    if (a.blocs !== b.blocs) return b.blocs - a.blocs; // règle 1 : plus de blocs
    if (a.vies !== b.vies) return b.vies - a.vies; // règle 2 : plus de vies
    return a.temps - b.temps; // règle 3 : moins de temps
  }

  // Deux pseudos sont le même joueur même si les majuscules diffèrent (« Max » = « max »).
  function memeJoueur(a, b) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  // Ajoute une partie à la liste et renvoie la nouvelle liste et le rang du joueur (1 = premier),
  // ou rang 0 s'il n'est pas dans les 10 meilleurs.
  function ajouter(liste, partie) {
    const ancienne = liste.find((p) => memeJoueur(p.pseudo, partie.pseudo));
    let nouvelle = liste;
    let ameliore = false;
    if (!ancienne) {
      nouvelle = liste.concat([partie]);
      ameliore = true;
    } else if (comparer(partie, ancienne) < 0) {
      // Meilleure que son ancienne partie : on remplace sa ligne.
      nouvelle = liste.filter((p) => p !== ancienne).concat([partie]);
      ameliore = true;
    }
    nouvelle = nouvelle.slice().sort(comparer).slice(0, C.classement.taille);
    const rang = nouvelle.findIndex((p) => memeJoueur(p.pseudo, partie.pseudo)) + 1;
    return { liste: nouvelle, rang, ameliore };
  }

  // « 1er », « 2e », « 3e »…
  function nomDuRang(rang) {
    return rang === 1 ? "1er" : rang + "e";
  }

  // Nettoie un pseudo tapé au clavier : pas d'espaces au bord, pas trop long.
  function nettoyerPseudo(texte) {
    return String(texte || "").replace(/\s+/g, " ").trim().slice(0, C.classement.pseudoMax);
  }

  return { comparer, ajouter, nomDuRang, nettoyerPseudo, memeJoueur };
})();
