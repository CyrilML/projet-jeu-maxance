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

window.Jeu = window.Jeu || {};

Jeu.Joueur = (function () {
  const C = Jeu.CONFIG;

  function creer() {
    const J = C.joueur;
    return {
      x: J.departX,
      y: C.solY - J.hauteur,
      l: J.largeur,
      h: J.hauteur,
      vx: 0,
      vy: 0,
      etat: "au-sol",
      tamponSaut: 0, // temps restant pendant lequel un saut demandé est gardé en mémoire
      sautMemorise: false,
      sautCoupe: false,
      debutSaut: 0,
      animation: 0,
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

    // 3. Appliquer la physique
    Jeu.Physique.appliquerGravite(j, dt);
    Jeu.Physique.deplacer(j, dt);
    Jeu.Physique.garderDansEcran(j);
    const auSol = Jeu.Physique.poserSurLeSol(j);

    // 4. Mettre à jour l'état
    if (auSol) {
      if (j.etat !== "au-sol") emettre("atterrissage", { duree: monde.temps - j.debutSaut });
      j.etat = "au-sol";
    } else {
      j.etat = j.vy < 0 ? "monte" : "descend";
    }
    j.animation += dt;
  }

  return { creer, hitbox, mettreAJour };
})();
