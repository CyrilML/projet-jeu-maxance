// 🧱 LES OBSTACLES : des blocs solides et des mares de lave
//
// Depuis l'étape 3, un obstacle est soit SOLIDE, soit LIQUIDE :
//   - caisse, muret (bois) et tour (pierre) sont SOLIDES : on peut atterrir dessus,
//     et quand on les touche par le côté, c'est un mur qui bloque (sans faire mal) ;
//   - la lave est LIQUIDE : on passe à travers… et on brûle. C'est perdu !
//
// Les obstacles sont écrits DANS LA GRILLE du terrain (numéros 4, 5 et 6), comme le sol.
// Grâce à ça, la physique les traite exactement comme le sol : il n'y a rien de spécial à coder
// pour pouvoir marcher dessus. La liste monde.obstacles garde en plus leur nom et leur numéro,
// pour le journal et les rayons X.

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
    muret: { l: 2, h: 1, case: CASES.bois },
    lave: { l: 1, h: 1, case: CASES.lave, sousSol: true },
  };

  // Les obstacles possibles à cette colonne du monde (plus on va loin, plus il y a de choix).
  function typesPossibles(colonne) {
    return Object.keys(TYPES).filter((nom) => colonne >= C.obstacles.debloque[nom]);
  }

  // Peut-on poser un obstacle de `largeur` blocs à cette colonne ?
  // Il faut de l'herbe tout autour (pour prendre son élan et atterrir) et pas de plateforme juste au-dessus.
  function placeLibre(terrain, colonne, largeur, infos) {
    const O = C.obstacles;
    const CARTE = C.carte;
    for (let c = colonne - O.margeTrou; c < colonne + largeur + O.margeTrou; c++) {
      if (c < infos.debut + infos.zoneSure || c > infos.fin) return false;
      if (Jeu.Terrain.lireCase(terrain, c, CARTE.ligneSol) !== CASES.herbe) return false; // un trou ou de la lave
    }
    for (let c = colonne - 1; c <= colonne + largeur; c++) {
      for (let l = 0; l < CARTE.ligneSol; l++) {
        if (Jeu.Terrain.estSolide(terrain, c, l)) return false; // une plateforme ou un autre obstacle
      }
    }
    return true;
  }

  // Écrit l'obstacle dans la grille, case par case.
  function ecrireDansLaGrille(terrain, o, type) {
    const ligneSol = C.carte.ligneSol;
    for (let c = o.colonne; c < o.colonne + o.largeur; c++) {
      if (type.sousSol) {
        Jeu.Terrain.ecrireCase(terrain, c, ligneSol, type.case);
      } else {
        for (let k = 1; k <= type.h; k++) Jeu.Terrain.ecrireCase(terrain, c, ligneSol - k, type.case);
      }
    }
  }

  // Pose les obstacles d'un tronçon qui vient d'être fabriqué.
  function placerDansTroncon(monde, infos) {
    const O = C.obstacles;
    const de = infos.de;
    let poses = 0;
    let colonne = infos.debut + infos.zoneSure + O.margeTrou + de.entre(0, 4);
    while (colonne <= infos.fin) {
      const nom = de.choisir(typesPossibles(colonne));
      const type = TYPES[nom];
      const largeur = nom === "lave" ? de.entre(O.laveLargeurMin, O.laveLargeurMax) : type.l;
      if (!placeLibre(monde.terrain, colonne, largeur, infos)) {
        colonne++; // pas de place ici : on essaie la colonne suivante
        continue;
      }
      const o = {
        id: monde.prochainId++,
        type: nom,
        solide: Jeu.Terrain.SOLIDES[type.case],
        colonne,
        largeur,
        // Le rectangle occupé, en pixels (la lave est DANS le sol, les autres au-dessus).
        x: colonne * B,
        y: type.sousSol ? C.solY : C.solY - type.h * B,
        l: largeur * B,
        h: type.h * B,
        passe: false,
      };
      ecrireDansLaGrille(monde.terrain, o, type);
      monde.obstacles.push(o);
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

  // La mare de lave touchée par la zone du héros, s'il y en a une.
  function laveTouchee(monde, zone) {
    return monde.obstacles.find((o) => !o.solide && Jeu.Physique.seChevauchent(zone, o));
  }

  return { TYPES, placerDansTroncon, mettreAJour, laveTouchee };
})();
