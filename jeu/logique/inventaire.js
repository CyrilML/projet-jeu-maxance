// 🎒 L'INVENTAIRE : le sac à dos du héros
//
// Le héros part avec 10 BLOCS de brique dans son sac (étape 10). Pour en poser un :
//   1. il faut être EN L'AIR (sauter d'abord) ;
//   2. on appuie sur P ;
//   3. le bloc apparaît dans la case juste SOUS SES PIEDS, et il retombe dessus.
// En recommençant (saut, P, saut, P…), on monte comme sur un pilier : c'est ce qu'il faut faire
// pour atteindre la plateforme au-dessus d'un lac de lave.
//
// Poser un bloc, c'est simplement ÉCRIRE un numéro (8 = brique) dans la grille du terrain.
// Le bloc reste jusqu'à la fin de la partie. Plus de blocs dans le sac ? Tant pis !

window.Jeu = window.Jeu || {};

Jeu.Inventaire = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer() {
    return { blocs: C.inventaire.blocs, poses: 0 };
  }

  // La case où irait le bloc : celle qui est entièrement sous les pieds du héros.
  //   colonne = celle du milieu du héros ;  ligne = la première ligne qui commence sous ses pieds.
  function caseVisee(j) {
    return {
      colonne: Math.floor((j.x + j.l / 2) / B),
      ligne: Math.ceil((j.y + j.h) / B - 0.001),
    };
  }

  // Peut-on poser un bloc maintenant ? Renvoie la raison si c'est non.
  function raisonDuRefus(monde) {
    const j = monde.joueur;
    if (monde.inventaire.blocs <= 0) return "plus de blocs dans le sac";
    if (j.etat === "au-sol") return "il faut sauter d'abord";
    const cible = caseVisee(j);
    if (cible.ligne >= C.carte.lignes || cible.ligne < 0) return "trop bas";
    const numero = Jeu.Terrain.lireCase(monde.terrain, cible.colonne, cible.ligne);
    if (numero !== Jeu.Terrain.CASES.air) return "la case sous tes pieds n'est pas vide (" + Jeu.Terrain.NOMS[numero] + ")";
    return null;
  }

  // Appelé à chaque pas de temps : si P vient d'être appuyée, on essaie de poser un bloc.
  function mettreAJour(monde) {
    if (!Jeu.Entrees.consommer("poserBloc")) return;
    const raison = raisonDuRefus(monde);
    if (raison) {
      Jeu.Evenements.emettre("bloc-refuse", { raison });
      return;
    }
    const cible = caseVisee(monde.joueur);
    Jeu.Terrain.ecrireCase(monde.terrain, cible.colonne, cible.ligne, Jeu.Terrain.CASES.brique);
    monde.inventaire.blocs -= 1;
    monde.inventaire.poses += 1;
    Jeu.Evenements.emettre("bloc-pose", { colonne: cible.colonne, ligne: cible.ligne, reste: monde.inventaire.blocs });
  }

  return { creer, caseVisee, raisonDuRefus, mettreAJour };
})();
