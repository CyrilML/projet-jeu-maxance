// 🌍 LE MONDE : tout ce qui existe dans la partie en cours
//
// Le monde est un grand objet qui contient TOUT l'état du jeu à un instant donné :
// la carte (terrain), le joueur, les obstacles, les drapeaux, la caméra, le score…
// C'est la MÉMOIRE VIVE du jeu : elle disparaît quand on ferme la page.
// (Ce qui doit survivre, comme le record, part dans la base de données : donnees/sauvegarde.js)
//
// Le jeu a quatre PHASES : "accueil" (on tape son pseudo) → "jeu" → "perdu" ou "gagne" → "jeu" → …
//
// Les règles :
//   - on a 5 VIES. Un trou ou de la lave = 1 vie en moins (étape 4) ;
//   - tomber dans un trou → on réapparaît juste DEVANT ce trou, pour pouvoir le ressauter ;
//   - tomber dans la lave → le héros BRÛLE 1 s sur place, avec des flammes (étape 7), puis réapparaît
//     au dernier drapeau ;
//   - toucher une caisse ou un muret en bois → on réapparaît au dernier
//     drapeau atteint (étape 5 : seules les tours en pierre ne font pas mourir) ;
//   - plus de vie → « Aïe ! », la partie est finie et tout recommence à zéro ;
//   - drapeau n° 10 atteint (300 blocs) → c'est l'ARRIVÉE, la partie est gagnée (étape 6) ;
//   - à la fin de chaque partie, le score entre au classement (logique/classement.js) ;
//   - tours en pierre → SOLIDES : on marche dessus, et par le côté c'est un mur ;
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
      pseudo: "", // le nom du joueur, tapé à l'accueil
      cause: null, // ce qui a fait perdre la dernière vie
      gagne: false,
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
      piegesTouches: 0,
      brulure: null, // pendant que le héros brûle : { reste, allumees, colonneRetour } (étape 7)
      flammes: [], // les petites flammes (des particules, voir moteur/particules.js)
      obstaclesPasses: 0,
      nouveauRecord: false,
      prochainId: 1,
    };
  }

  // Lance une nouvelle partie pour ce joueur. Appelé par main.js quand le pseudo est validé,
  // ou par la touche Espace à la fin d'une partie (même joueur).
  function demarrer(monde, pseudo) {
    Object.assign(monde, creer(), { phase: "jeu", pseudo });
    Jeu.Evenements.emettre("debut-partie", { graine: monde.graine, pseudo });
  }

  // La partie est finie : perdue (plus de vie) ou gagnée (arrivée).
  function finir(monde, gagne, cause) {
    monde.phase = gagne ? "gagne" : "perdu";
    monde.gagne = gagne;
    monde.tempsPhase = 0;
    monde.cause = cause;
    if (!gagne) monde.joueur.etat = "touche";
    monde.nouveauRecord = monde.score > Jeu.Sauvegarde.donnees.record;
    Jeu.Evenements.emettre("fin-partie", {
      pseudo: monde.pseudo,
      score: monde.score,
      temps: monde.temps,
      vies: monde.vies,
      chutes: monde.chutes,
      gagne,
      cause,
    });
  }

  function perdre(monde, cause) {
    finir(monde, false, cause);
  }

  function gagner(monde) {
    Jeu.Evenements.emettre("arrivee", { pseudo: monde.pseudo, temps: monde.temps, vies: monde.vies });
    finir(monde, true, null);
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
    while (!monde.terrain.fini && monde.terrain.colonnes.length <= colonneVoulue) {
      const arrivee = monde.terrain.troncons === C.arrivee.drapeau;
      const infos = Jeu.Terrain.fabriquerTroncon(monde.terrain, arrivee);
      monde.drapeaux.push({ numero: infos.numero, colonne: infos.colonneDrapeau, atteint: infos.numero === 0, arrivee });
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
      Jeu.Terrain.lireCase(T, colonne, sol - 1) === Jeu.Terrain.CASES.air &&
      Jeu.Terrain.lireCase(T, colonne, sol - 2) === Jeu.Terrain.CASES.air
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

  // Le héros a touché un obstacle mortel : 1 vie en moins, et retour au dernier drapeau.
  //   lave → événement « brule » ;  caisse ou muret → événement « piege ».
  function toucherObstacleMortel(monde, o) {
    const drapeau = monde.drapeaux[monde.dernierDrapeau];
    const infos = { id: o.id, type: o.type, colonne: o.colonne, drapeau: drapeau.numero };
    const estDeLaLave = o.type === "lave" || o.type === "fosse";
    if (estDeLaLave) {
      monde.brulures += 1;
      Jeu.Evenements.emettre("brule", Object.assign(infos, { duree: C.brulure.duree, flammes: C.brulure.flammes }));
      // Le héros ne réapparaît pas tout de suite : il brûle d'abord sur place (voir brulerUnPeu).
      monde.brulure = { reste: C.brulure.duree, allumees: 0, colonneRetour: drapeau.colonne };
      const j = monde.joueur;
      j.etat = "brule";
      j.vx = 0;
      j.vy = 0;
      return;
    } else {
      monde.piegesTouches += 1;
      Jeu.Evenements.emettre("piege", infos);
    }
    if (perdreUneVie(monde, estDeLaLave ? "lave" : o.type)) Jeu.Joueur.reapparaitre(monde.joueur, drapeau.colonne);
  }

  // Pendant que le héros brûle : il s'enfonce doucement, les flammes s'allument une à une,
  // puis, au bout d'une seconde, il perd une vie et réapparaît au dernier drapeau.
  function brulerUnPeu(monde, dt) {
    const b = monde.brulure;
    const R = C.brulure;
    const j = monde.joueur;
    b.reste -= dt;
    j.animation += dt; // pour que l'affichage fasse clignoter le héros
    j.y = Math.min(j.y + 25 * dt, C.solY - j.h + 20); // il s'enfonce un peu dans la lave
    // Combien de flammes devraient être allumées à ce moment ? (elles s'allument régulièrement)
    const voulues = Math.min(R.flammes, Math.ceil(R.flammes * (1 - Math.max(0, b.reste) / R.duree)));
    while (b.allumees < voulues) {
      b.allumees++;
      const x = j.x - 8 + Math.random() * (j.l + 16);
      const y = C.solY + 6 - Math.random() * 30;
      const vitesse = R.vitesseMontee * (0.6 + Math.random() * 0.8);
      Jeu.Particules.ajouter(monde.flammes, x, y, (Math.random() - 0.5) * 20, -vitesse, R.vieFlamme * (0.6 + Math.random() * 0.4), 9 + Math.random() * 9);
    }
    if (b.reste > 0) return;
    monde.brulure = null;
    if (perdreUneVie(monde, "lave")) Jeu.Joueur.reapparaitre(j, b.colonneRetour);
  }

  function mettreAJour(monde, dt) {
    const Entrees = Jeu.Entrees;
    monde.tempsPhase += dt;
    // Les flammes vivent dans toutes les phases : elles finissent de s'éteindre même après la partie.
    Jeu.Particules.mettreAJour(monde.flammes, dt, C.brulure.tremblement);

    if (monde.phase !== "jeu") {
      // On consomme les appuis (| et pas ||) pour qu'aucun ne reste en attente.
      const veutJouer = Entrees.consommer("sauter") | Entrees.consommer("valider");
      const veutChanger = Entrees.consommer("changerPseudo");
      // À l'accueil, c'est le formulaire du pseudo qui lance la partie (voir main.js).
      // À la fin d'une partie : petite pause pour ne pas relancer par accident.
      const pret = monde.phase !== "accueil" && monde.tempsPhase > 0.4;
      if (veutJouer && pret) demarrer(monde, monde.pseudo);
      else if (veutChanger && pret) Object.assign(monde, creer()); // retour à l'accueil
      suivreAvecLaCamera(monde, dt);
      fabriquerDevant(monde);
      return;
    }

    monde.temps += dt;
    if (monde.brulure) {
      brulerUnPeu(monde, dt);
      suivreAvecLaCamera(monde, dt);
      return;
    }
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
        if (d.arrivee) {
          monde.score = d.colonne - monde.colonneDepart;
          gagner(monde);
          return;
        }
      }
    }

    // Le score : la colonne la plus à droite atteinte, comptée depuis le départ.
    const blocs = ici.colonne - monde.colonneDepart;
    if (blocs > monde.score) monde.score = blocs;

    Jeu.Obstacles.mettreAJour(monde);
    // La tour (solide) n'a pas besoin de règle ici : la physique s'en occupe, comme pour le sol.
    // Les obstacles mortels (lave, caisse, muret) coûtent une vie.
    const piege = Jeu.Obstacles.obstacleMortelTouche(monde, Jeu.Joueur.hitbox(j));
    if (piege) {
      toucherObstacleMortel(monde, piege);
      if (monde.phase !== "jeu") return;
    }

    suivreAvecLaCamera(monde, dt);
    fabriquerDevant(monde);
  }

  return { creer, demarrer, mettreAJour };
})();
