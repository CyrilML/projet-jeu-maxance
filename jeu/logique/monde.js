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
//   - on a 5 VIES. Un trou ou de la lave = 1 vie en moins (étape 4) ;
//   - tomber dans un trou → on réapparaît juste DEVANT ce trou, pour pouvoir le ressauter ;
//   - tomber dans la lave → on réapparaît au dernier drapeau atteint ;
//   - plus de vie → « Aïe ! », la partie est finie et tout recommence à zéro ;
//   - caisses, murets, tours → SOLIDES : on marche dessus, et par le côté c'est un mur (étape 3) ;
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
      vies: C.vies,
      chutes: 0,
      brulures: 0,
      obstaclesPasses: 0,
      nouveauRecord: false,
      prochainId: 1,
    };
  }

  function demarrer(monde) {
    Object.assign(monde, creer(), { phase: "jeu" });
    Jeu.Evenements.emettre("debut-partie", { graine: monde.graine });
  }

  // Plus de vie : la partie est finie.
  function perdre(monde, cause) {
    monde.phase = "perdu";
    monde.tempsPhase = 0;
    monde.cause = cause;
    monde.joueur.etat = "touche";
    monde.nouveauRecord = monde.score > Jeu.Sauvegarde.donnees.record;
    Jeu.Evenements.emettre("fin-partie", { score: monde.score, temps: monde.temps, chutes: monde.chutes, cause });
  }

  // Enlève une vie. Renvoie vrai s'il en reste (on peut réapparaître), faux sinon.
  function perdreUneVie(monde, cause) {
    monde.vies -= 1;
    Jeu.Evenements.emettre("vie-perdue", { vies: monde.vies, cause });
    if (monde.vies > 0) return true;
    perdre(monde, cause);
    return false;
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

  // Une colonne où l'on peut se tenir debout : de l'herbe sous les pieds, et rien de solide
  // à hauteur du héros (2 cases au-dessus de l'herbe).
  function placeDebout(monde, colonne) {
    const T = monde.terrain;
    const sol = C.carte.ligneSol;
    return (
      Jeu.Terrain.lireCase(T, colonne, sol) === Jeu.Terrain.CASES.herbe &&
      !Jeu.Terrain.estSolide(T, colonne, sol - 1) &&
      !Jeu.Terrain.estSolide(T, colonne, sol - 2)
    );
  }

  // Le héros est tombé dans un trou : 1 vie en moins, et on réapparaît juste devant le trou.
  function tomber(monde, colonne) {
    monde.chutes += 1;
    // Le bord gauche du trou : on recule tant que la case du sol est vide.
    let bord = colonne;
    while (bord > 0 && Jeu.Terrain.lireCase(monde.terrain, bord - 1, C.carte.ligneSol) === Jeu.Terrain.CASES.air) bord--;
    // Puis on cherche, juste avant, une colonne où l'on tient debout (pas sous une plateforme).
    let retour = bord - 1;
    while (retour > 0 && !placeDebout(monde, retour)) retour--;
    Jeu.Evenements.emettre("chute", { colonne, bordDuTrou: bord, retour });
    if (perdreUneVie(monde, "trou")) Jeu.Joueur.reapparaitre(monde.joueur, retour);
  }

  // Le héros est tombé dans la lave : 1 vie en moins, et retour au dernier drapeau.
  function bruler(monde, lave) {
    monde.brulures += 1;
    const drapeau = monde.drapeaux[monde.dernierDrapeau];
    Jeu.Evenements.emettre("brule", { id: lave.id, type: lave.type, colonne: lave.colonne, drapeau: drapeau.numero });
    if (perdreUneVie(monde, "lave")) Jeu.Joueur.reapparaitre(monde.joueur, drapeau.colonne);
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
    if (j.y > C.trous.chute) {
      tomber(monde, ici.colonne);
      if (monde.phase !== "jeu") return;
    }

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
    if (lave) {
      bruler(monde, lave);
      if (monde.phase !== "jeu") return;
    }

    suivreAvecLaCamera(monde, dt);
    fabriquerDevant(monde);
  }

  return { creer, mettreAJour };
})();
