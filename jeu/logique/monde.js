// 🌍 LE MONDE : tout ce qui existe dans la partie en cours
//
// Le monde est un grand objet qui contient TOUT l'état du jeu à un instant donné :
// la carte (terrain), le joueur, les obstacles, les drapeaux, la caméra, le score…
// C'est la MÉMOIRE VIVE du jeu : elle disparaît quand on ferme la page.
// (Ce qui doit survivre, comme le record, part dans la base de données : donnees/sauvegarde.js)
//
// Le jeu a trois PHASES : "accueil" → "jeu" → "perdu" → "jeu" → …
//
// Les règles :
//   - tomber dans un trou → on réapparaît au dernier drapeau atteint ;
//   - caisses, murets, tours → SOLIDES : on marche dessus, et par le côté c'est un mur (étape 3) ;
//   - tomber dans la lave → « Aïe ! », la partie est finie et tout recommence à zéro (étape 3) ;
//   - le score = le nombre de blocs parcourus vers la droite (la colonne la plus loin atteinte).

window.Jeu = window.Jeu || {};

Jeu.Monde = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer() {
    const graine = Jeu.Hasard.nouvelleGraine();
    const colonneDepart = C.carte.colonneDrapeau; // on part du drapeau n° 0
    return {
      phase: "accueil",
      tempsPhase: 0, // depuis combien de temps on est dans cette phase
      temps: 0, // durée de la partie en cours
      graine,
      terrain: Jeu.Terrain.creer(graine),
      camera: Jeu.Camera.creer(),
      joueur: Jeu.Joueur.creer(colonneDepart),
      obstacles: [],
      drapeaux: [],
      dernierDrapeau: 0, // numéro du drapeau où l'on réapparaît
      colonneDepart,
      score: 0,
      chutes: 0,
      obstaclesPasses: 0,
      nouveauRecord: false,
      prochainId: 1,
    };
  }

  function demarrer(monde) {
    Object.assign(monde, creer(), { phase: "jeu" });
    Jeu.Evenements.emettre("debut-partie", { graine: monde.graine });
  }

  function perdre(monde, lave) {
    monde.phase = "perdu";
    monde.tempsPhase = 0;
    monde.joueur.etat = "touche";
    monde.nouveauRecord = monde.score > Jeu.Sauvegarde.donnees.record;
    Jeu.Evenements.emettre("brule", { id: lave.id, colonne: lave.colonne });
    Jeu.Evenements.emettre("fin-partie", { score: monde.score, temps: monde.temps, chutes: monde.chutes });
  }

  // Fabrique les tronçons du monde qui vont bientôt apparaître à droite de l'écran.
  function fabriquerDevant(monde) {
    const colonneVoulue = Math.floor((monde.camera.x + C.ecran.largeur) / B) + C.carte.avance;
    while (monde.terrain.colonnes.length <= colonneVoulue) {
      const infos = Jeu.Terrain.fabriquerTroncon(monde.terrain);
      monde.drapeaux.push({ numero: infos.numero, colonne: infos.colonneDrapeau, atteint: infos.numero === 0 });
      const obstacles = Jeu.Obstacles.placerDansTroncon(monde, infos);
      Jeu.Evenements.emettre("troncon-fabrique", {
        numero: infos.numero,
        debut: infos.debut,
        fin: infos.fin,
        trous: infos.trous.length,
        plateformes: infos.plateformes.length,
        obstacles,
        cases: Jeu.Terrain.nombreDeCases(monde.terrain),
      });
    }
  }

  function suivreAvecLaCamera(monde, dt) {
    const j = monde.joueur;
    const cible = j.x + j.l / 2 - C.camera.positionJoueur;
    Jeu.Camera.suivre(monde.camera, cible, dt, C.camera.tempsDeReaction, 0);
  }

  // Le héros est tombé dans un trou : retour au dernier drapeau.
  function tomber(monde, colonne) {
    const drapeau = monde.drapeaux[monde.dernierDrapeau];
    monde.chutes += 1;
    Jeu.Joueur.reapparaitre(monde.joueur, drapeau.colonne);
    Jeu.Evenements.emettre("chute", { colonne, drapeau: drapeau.numero, colonneDrapeau: drapeau.colonne });
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
      suivreAvecLaCamera(monde, dt);
      fabriquerDevant(monde);
      return;
    }

    monde.temps += dt;
    const j = monde.joueur;
    Jeu.Joueur.mettreAJour(j, dt, monde);
    const ici = Jeu.Joueur.caseDuJoueur(j);

    // Tombé dans un trou ?
    if (j.y > C.trous.chute) tomber(monde, ici.colonne);

    // Un nouveau drapeau atteint ?
    for (const d of monde.drapeaux) {
      if (!d.atteint && ici.colonne >= d.colonne) {
        d.atteint = true;
        monde.dernierDrapeau = d.numero;
        Jeu.Evenements.emettre("drapeau", { numero: d.numero, colonne: d.colonne });
      }
    }

    // Le score : la colonne la plus à droite atteinte, comptée depuis le départ.
    const blocs = ici.colonne - monde.colonneDepart;
    if (blocs > monde.score) monde.score = blocs;

    Jeu.Obstacles.mettreAJour(monde);
    // Les obstacles solides n'ont plus besoin de règle ici : la physique s'en occupe, comme pour le sol.
    // Seule la lave (liquide) est dangereuse.
    const lave = Jeu.Obstacles.laveTouchee(monde, Jeu.Joueur.hitbox(j));
    if (lave) perdre(monde, lave);

    suivreAvecLaCamera(monde, dt);
    fabriquerDevant(monde);
  }

  return { creer, mettreAJour };
})();
