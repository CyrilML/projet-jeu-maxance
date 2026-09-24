// 🌍 LE MONDE : tout ce qui existe dans la partie en cours
//
// Le monde est un grand objet qui contient TOUT l'état du jeu à un instant donné :
// le joueur, la liste des obstacles, le score, la vitesse, la phase de jeu…
// C'est la MÉMOIRE VIVE du jeu : elle disparaît quand on ferme la page.
// (Ce qui doit survivre, comme le record, part dans la base de données : donnees/sauvegarde.js)
//
// Le jeu a trois PHASES : "accueil" → "jeu" → "perdu" → "jeu" → …

window.Jeu = window.Jeu || {};

Jeu.Monde = (function () {
  const C = Jeu.CONFIG;

  function creer() {
    return {
      phase: "accueil",
      tempsPhase: 0, // depuis combien de temps on est dans cette phase
      temps: 0, // durée de la partie en cours
      distance: 0, // distance parcourue (sert à faire défiler le décor)
      vitesse: C.obstacles.vitesseDepart,
      score: 0,
      nouveauRecord: false,
      joueur: Jeu.Joueur.creer(),
      obstacles: [],
      tempsAvantProchain: C.obstacles.premierObstacle,
      prochainId: 1,
    };
  }

  function demarrer(monde) {
    Object.assign(monde, creer(), { phase: "jeu" });
    Jeu.Evenements.emettre("debut-partie", {});
  }

  function perdre(monde, obstacle) {
    monde.phase = "perdu";
    monde.tempsPhase = 0;
    monde.joueur.etat = "touche";
    monde.nouveauRecord = monde.score > Jeu.Sauvegarde.donnees.record;
    Jeu.Evenements.emettre("collision", { type: obstacle.type, id: obstacle.id });
    Jeu.Evenements.emettre("fin-partie", { score: monde.score, temps: monde.temps });
  }

  function mettreAJour(monde, dt) {
    const Entrees = Jeu.Entrees;
    monde.tempsPhase += dt;

    if (monde.phase !== "jeu") {
      // On consomme les deux appuis (| et pas ||) pour qu'aucun ne reste en attente.
      const veutJouer = Entrees.consommer("sauter") | Entrees.consommer("valider");
      // Petite pause après une défaite pour ne pas relancer par accident.
      const pret = monde.phase === "accueil" || monde.tempsPhase > 0.4;
      if (veutJouer && pret) demarrer(monde);
      if (monde.phase === "accueil") monde.distance += 60 * dt;
      return;
    }

    monde.temps += dt;
    monde.vitesse = Math.min(
      C.obstacles.vitesseMax,
      C.obstacles.vitesseDepart + C.obstacles.accelerationParSeconde * monde.temps
    );
    monde.distance += monde.vitesse * dt;

    Jeu.Joueur.mettreAJour(monde.joueur, dt, monde);
    Jeu.Obstacles.mettreAJour(monde, dt);

    const zoneJoueur = Jeu.Joueur.hitbox(monde.joueur);
    for (const o of monde.obstacles) {
      if (Jeu.Physique.seChevauchent(zoneJoueur, o)) {
        perdre(monde, o);
        break;
      }
    }
  }

  return { creer, mettreAJour };
})();
