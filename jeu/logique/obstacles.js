// 🧱 LES OBSTACLES : des pièges et des tours
//
// Chaque obstacle est soit SANS DANGER, soit MORTEL (règles de l'étape 8) :
//   - la tour (pierre) et la caisse (bois) sont SOLIDES et sans danger : on peut monter dessus,
//     et par le côté c'est un mur ;
//   - le muret (bois à pics rouges) est MORTEL : le toucher, même par le côté, coûte une vie
//     (le héros devient un petit squelette qui danse) et renvoie au dernier drapeau.
//     Il n'est pas tiré au hasard : il y en a un tous les 50 blocs environ (étape 9).
//   - la lave est LIQUIDE et MORTELLE : on passe à travers… et on brûle. Il y a les petites mares
//     (1 ou 2 blocs, au hasard), une grande fosse tous les 30 blocs, et 3 LACS de lave (étape 10) :
//     8 blocs de large, la lave monte 2 blocs plus haut que le sol. On les passe par la plateforme
//     au-dessus, en posant des blocs pour y monter.
//
// Les obstacles sont écrits DANS LA GRILLE du terrain (numéros 4, 5, 6 et 7), comme le sol.
// Leurs propriétés (solide, mortel) viennent des listes de logique/terrain.js. La liste
// monde.obstacles garde en plus leur nom et leur numéro, pour le journal et les rayons X.

window.Jeu = window.Jeu || {};

Jeu.Obstacles = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;
  const CASES = Jeu.Terrain.CASES;

  // Le « catalogue » des obstacles, en blocs de 40 px.
  //   case   : le numéro écrit dans la grille
  //   sousSol : la lave REMPLACE l'herbe (c'est une mare creusée dans le sol) ;
  //             les autres sont posés PAR-DESSUS le sol.
  const TYPES = {
    caisse: { l: 1, h: 1, case: CASES.bois },
    tour: { l: 1, h: 2, case: CASES.pierre },
    muret: { l: 2, h: 1, case: CASES.pics }, // bois à pics : mortel (étape 8)
    lave: { l: 1, h: 1, case: CASES.lave, sousSol: true },
    fosse: { l: 3, h: 1, case: CASES.lave, sousSol: true }, // jamais tirée au hasard : une par tronçon
    lac: { l: C.lacs.largeur, h: C.lacs.hauteurLave, case: CASES.lave, sousSol: true }, // étape 10 : plusieurs cases de haut
  };

  // Les obstacles possibles à cette colonne du monde (plus on va loin, plus il y a de choix).
  function typesPossibles(colonne) {
    // La fosse et le muret ont leurs propres places (ils ne sont jamais tirés au hasard).
    return Object.keys(TYPES).filter((nom) => !["fosse", "muret", "lac"].includes(nom) && colonne >= C.obstacles.debloque[nom]);
  }

  // Peut-on poser un obstacle de `largeur` blocs à cette colonne ?
  // Il faut de l'herbe tout autour (pour prendre son élan et atterrir) et pas de plateforme juste au-dessus.
  function placeLibre(terrain, colonne, largeur, infos) {
    const O = C.obstacles;
    const CARTE = C.carte;
    // Près d'un lac : aucun obstacle (une tour permettrait de sauter jusqu'à la plateforme sans poser de blocs).
    if (infos.lac !== null && infos.lac !== undefined) {
      const loin = C.lacs.sansObstacle;
      if (colonne + largeur - 1 >= infos.lac - loin && colonne <= infos.lac + C.lacs.largeur - 1 + loin) return false;
    }
    for (let c = colonne - O.margeTrou; c < colonne + largeur + O.margeTrou; c++) {
      if (c < infos.debut + infos.zoneSure || c > infos.fin) return false;
      if (Jeu.Terrain.lireCase(terrain, c, CARTE.ligneSol) !== CASES.herbe) return false; // un trou ou de la lave
    }
    for (let c = colonne - 1; c <= colonne + largeur; c++) {
      for (let l = 0; l < CARTE.ligneSol; l++) {
        if (Jeu.Terrain.lireCase(terrain, c, l) !== CASES.air) return false; // une plateforme ou un autre obstacle
      }
    }
    return true;
  }

  // Écrit l'obstacle dans la grille, case par case.
  function ecrireDansLaGrille(terrain, o, type) {
    const ligneSol = C.carte.ligneSol;
    for (let c = o.colonne; c < o.colonne + o.largeur; c++) {
      if (type.sousSol) {
        // La lave remplit h cases : la ligne du sol, et (pour un lac) les lignes au-dessus.
        for (let k = 0; k < type.h; k++) Jeu.Terrain.ecrireCase(terrain, c, ligneSol - k, type.case);
      } else {
        for (let k = 1; k <= type.h; k++) Jeu.Terrain.ecrireCase(terrain, c, ligneSol - k, type.case);
      }
    }
  }

  // Crée un obstacle, l'écrit dans la grille et l'ajoute à la liste.
  function poser(monde, nom, colonne, largeur) {
    const type = TYPES[nom];
    const o = {
      id: monde.prochainId++,
      type: nom,
      solide: Jeu.Terrain.SOLIDES[type.case],
      mortel: Jeu.Terrain.MORTELS[type.case],
      colonne,
      largeur,
      // Le rectangle occupé, en pixels (la lave est DANS le sol, les autres au-dessus).
      x: colonne * B,
      y: type.sousSol ? C.solY - (type.h - 1) * B : C.solY - type.h * B,
      l: largeur * B,
      h: type.h * B,
      passe: false,
    };
    ecrireDansLaGrille(monde.terrain, o, type);
    monde.obstacles.push(o);
  }

  // Pose un muret le plus près possible de sa colonne cible : cible, puis cible ± 1, ± 2… jusqu'à ± 5.
  // Renvoie la colonne choisie, ou -1 s'il n'y avait vraiment pas de place.
  function poserMuretVers(monde, cible, infos) {
    const largeur = TYPES.muret.l;
    for (let decalage = 0; decalage <= C.obstacles.murets.decalageMax; decalage++) {
      for (const colonne of [cible + decalage, cible - decalage]) {
        if (placeLibre(monde.terrain, colonne, largeur, infos)) {
          poser(monde, "muret", colonne, largeur);
          return colonne;
        }
      }
    }
    return -1;
  }

  // Pose les obstacles d'un tronçon qui vient d'être fabriqué.
  function placerDansTroncon(monde, infos) {
    const O = C.obstacles;
    const de = infos.de;
    if (infos.arrivee) return 0; // le tronçon d'arrivée est tout plat, sans danger
    // D'abord la grande fosse de lave (ou le lac), à sa place réservée.
    if (infos.fosse) poser(monde, "fosse", infos.fosse.colonne, infos.fosse.largeur);
    else poser(monde, "lac", infos.lac, C.lacs.largeur);
    let poses = 1;
    // Ensuite les murets, à leurs rendez-vous (tous les 50 blocs environ).
    for (const cible of infos.murets) {
      const colonne = poserMuretVers(monde, cible, infos);
      Jeu.Evenements.emettre("muret-pose", { cible: cible - C.carte.colonneDrapeau, bloc: colonne - C.carte.colonneDrapeau, colonne });
      if (colonne >= 0) poses++;
    }
    // Enfin, les autres obstacles au hasard, dans la place qui reste.
    let colonne = infos.debut + infos.zoneSure + O.margeTrou + de.entre(0, 4);
    while (colonne <= infos.fin) {
      const nom = de.choisir(typesPossibles(colonne));
      const type = TYPES[nom];
      const largeur = nom === "lave" ? de.entre(O.laveLargeurMin, O.laveLargeurMax) : type.l;
      if (!placeLibre(monde.terrain, colonne, largeur, infos)) {
        colonne++; // pas de place ici : on essaie la colonne suivante
        continue;
      }
      poser(monde, nom, colonne, largeur);
      poses++;
      colonne += largeur + de.entre(O.ecartMin, O.ecartMax);
    }
    return poses;
  }

  // Annonce chaque obstacle dépassé (le héros est entièrement passé à sa droite).
  function mettreAJour(monde) {
    const j = monde.joueur;
    for (const o of monde.obstacles) {
      if (!o.passe && j.x > o.x + o.l) {
        o.passe = true;
        monde.obstaclesPasses += 1;
        Jeu.Evenements.emettre("esquive", { type: o.type, id: o.id, total: monde.obstaclesPasses });
      }
    }
  }

  // L'obstacle mortel (caisse, muret, lave) touché par la zone du héros, s'il y en a un.
  function obstacleMortelTouche(monde, zone) {
    return monde.obstacles.find((o) => o.mortel && Jeu.Physique.seChevauchent(zone, o));
  }

  return { TYPES, placerDansTroncon, mettreAJour, obstacleMortelTouche };
})();
