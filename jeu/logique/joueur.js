// 🧍 LE JOUEUR : ses données et ses règles
//
// Le joueur est un simple objet (des nombres rangés dans des cases) :
//   x, y     → position (coin en haut à gauche)
//   l, h     → largeur et hauteur
//   vx, vy   → vitesse horizontale et verticale (vy négatif = vers le haut)
//   etat     → "au-sol", "monte", "descend" ou "touche" : c'est une MACHINE À ÉTATS.
//              Ce que le joueur a le droit de faire dépend de son état
//              (exemple : on ne peut sauter que depuis "au-sol").
//
// À chaque pas de temps, mettreAJour() suit toujours le même ordre :
//   1. lire les intentions   2. décider   3. appliquer la physique   4. mettre à jour l'état
//
// Le héros vit en coordonnées MONDE : x = 4 000 veut dire « 4 000 px après le début du monde »,
// même si l'écran ne fait que 960 px de large. C'est la caméra qui décide ce qu'on voit.

window.Jeu = window.Jeu || {};

Jeu.Joueur = (function () {
  const C = Jeu.CONFIG;

  // Crée le héros debout sur la colonne donnée (en général, celle du drapeau de départ).
  function creer(colonne) {
    const J = C.joueur;
    return {
      x: xAuCentreDe(colonne),
      y: C.solY - J.hauteur,
      l: J.largeur,
      h: J.hauteur,
      vx: 0,
      vy: 0,
      etat: "au-sol",
      tamponSaut: 0, // temps restant pendant lequel un saut demandé est gardé en mémoire
      sautMemorise: false,
      sautCoupe: false,
      contreMur: false, // est-il en train de pousser contre un bloc solide ?
      debutSaut: 0,
      animation: 0,
    };
  }

  // La position x qui place le héros au milieu d'une colonne.
  function xAuCentreDe(colonne) {
    return colonne * C.tailleBloc + (C.tailleBloc - C.joueur.largeur) / 2;
  }

  // Remet le héros debout sur une colonne, immobile (après une chute dans un trou).
  function reapparaitre(j, colonne) {
    j.x = xAuCentreDe(colonne);
    j.y = C.solY - j.h;
    j.vx = 0;
    j.vy = 0;
    j.tamponSaut = 0;
    j.etat = "au-sol";
  }

  // Sur quelle case est le héros ? On prend le milieu de ses pieds :
  //   colonne = partie entière de (x du milieu ÷ 40),  ligne = partie entière de (y des pieds ÷ 40)
  function caseDuJoueur(j) {
    const B = C.tailleBloc;
    const milieu = j.x + j.l / 2;
    const pieds = j.y + j.h - 1; // 1 px au-dessus du bas : encore DANS le héros
    return {
      milieu,
      pieds,
      colonne: Jeu.Physique.caseDe(milieu, B),
      ligne: Jeu.Physique.caseDe(pieds, B),
    };
  }

  // La zone qui compte pour les collisions (un peu plus petite que le dessin).
  function hitbox(j) {
    const m = C.joueur.margeHitbox;
    return { x: j.x + m, y: j.y + m, l: j.l - 2 * m, h: j.h - m };
  }

  function mettreAJour(j, dt, monde) {
    const J = C.joueur;
    const Entrees = Jeu.Entrees;
    const emettre = Jeu.Evenements.emettre;

    // 1. Lire les intentions
    let direction = 0;
    if (Entrees.estEnfoncee("gauche")) direction -= 1;
    if (Entrees.estEnfoncee("droite")) direction += 1;
    j.vx = direction * J.vitesse;

    if (Entrees.consommer("sauter")) {
      j.tamponSaut = J.memoireSaut;
      j.sautMemorise = j.etat !== "au-sol";
      if (j.sautMemorise) emettre("saut-memorise", { memoire: J.memoireSaut });
    } else {
      j.tamponSaut = Math.max(0, j.tamponSaut - dt);
    }

    // 2. Décider : on saute seulement si on est au sol ET qu'un saut est demandé
    if (j.tamponSaut > 0 && j.etat === "au-sol") {
      j.vy = -J.forceSaut;
      j.tamponSaut = 0;
      j.sautCoupe = false;
      j.debutSaut = monde.temps;
      j.etat = "monte";
      emettre("saut", { vy: j.vy, depuisMemoire: j.sautMemorise });
    }

    // Saut variable : si on relâche la touche pendant la montée, on monte moins haut.
    if (j.vy < 0 && !j.sautCoupe && !Entrees.estEnfoncee("sauter")) {
      j.vy *= J.coupureSaut;
      j.sautCoupe = true;
      emettre("saut-coupe", { y: Math.round(j.y) });
    }

    // 3. Appliquer la physique : gravité, puis déplacement case par case dans la grille du terrain
    Jeu.Physique.appliquerGravite(j, dt);
    const contact = Jeu.Physique.deplacerDansGrille(j, dt, {
      taille: C.tailleBloc,
      estSolide: (colonne, ligne) => Jeu.Terrain.estSolide(monde.terrain, colonne, ligne),
    });
    const auSol = contact.bas;
    if (contact.haut) emettre("tete-cognee", { ligne: Jeu.Physique.caseDe(j.y, C.tailleBloc) - 1 });
    // Un bloc solide touché par le côté = un mur. On ne l'annonce qu'au premier contact.
    const contreMur = contact.gauche || contact.droite;
    if (contreMur && !j.contreMur) {
      const B = C.tailleBloc;
      const colonne = contact.droite ? Jeu.Physique.caseDe(j.x + j.l, B) : Jeu.Physique.caseDe(j.x, B) - 1;
      let numero = 0; // quelle matière forme le mur ? On cherche la case solide à hauteur du héros.
      for (let l = Jeu.Physique.caseDe(j.y, B); l <= Jeu.Physique.caseDe(j.y + j.h - 1, B); l++) {
        if (Jeu.Terrain.estSolide(monde.terrain, colonne, l)) numero = Jeu.Terrain.lireCase(monde.terrain, colonne, l);
      }
      emettre("mur", { colonne, matiere: Jeu.Terrain.NOMS[numero] });
    }
    j.contreMur = contreMur;

    // 4. Mettre à jour l'état
    if (auSol) {
      if (j.etat !== "au-sol") {
        const ligne = Jeu.Physique.caseDe(j.y + j.h, C.tailleBloc); // la ligne des cases sous les pieds
        emettre("atterrissage", { duree: monde.temps - j.debutSaut, ligne });
      }
      j.etat = "au-sol";
    } else {
      if (j.etat === "au-sol") j.debutSaut = monde.temps; // on vient de marcher dans le vide
      j.etat = j.vy < 0 ? "monte" : "descend";
    }
    j.animation += dt;
  }

  return { creer, reapparaitre, caseDuJoueur, hitbox, mettreAJour };
})();
