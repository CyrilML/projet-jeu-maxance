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
    // Étape 29 : le monde à la taille du héros (2 blocs) : caisse de 2 blocs, tour de 4, muret de 2 de haut.
    caisse: { l: 1, h: C.obstacles.hauteurs.caisse, case: CASES.bois },
    tour: { l: 1, h: C.obstacles.hauteurs.tour, case: CASES.pierre },
    muret: { l: 2, h: C.obstacles.hauteurs.muret, case: CASES.pics }, // bois à pics : mortel (étape 8)
    fer: { l: 1, h: 1, case: CASES.fer }, // bloc de fer : solide, à casser avec la pioche (étape 12)
    charbon: { l: 1, h: 1, case: CASES.charbon }, // minerai de charbon, dans les grottes (étape 13)
    lave: { l: 1, h: 1, case: CASES.lave, sousSol: true },
    fosse: { l: 3, h: 1, case: CASES.lave, sousSol: true }, // jamais tirée au hasard : une par tronçon
    lac: { l: C.lacs.largeur, h: C.lacs.hauteurLave, case: CASES.lave, sousSol: true }, // étape 10 : plusieurs cases de haut
  };

  // Les obstacles possibles à cette colonne du monde (plus on va loin, plus il y a de choix).
  function typesPossibles(colonne) {
    // La fosse et le muret ont leurs propres places (ils ne sont jamais tirés au hasard).
    return Object.keys(TYPES).filter((nom) => !["fosse", "muret", "lac", "fer", "charbon"].includes(nom) && colonne >= C.obstacles.debloque[nom]);
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
    // Ni dans la zone de combat d'un monstre (étape 11).
    if (infos.monstre !== null && infos.monstre !== undefined) {
      if (colonne + largeur - 1 >= infos.monstre - C.monstres.espace - O.margeTrou && colonne <= infos.monstre + C.monstres.espaceDerriere + O.margeTrou) return false;
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

  // Le bloc de fer (étape 12) est sans danger : il lui faut juste de l'herbe dessous et à côté
  // (pas au bord d'un trou ou de la lave), rien au-dessus, et pas trop près d'un lac ou d'un monstre.
  function placePourLeFer(terrain, colonne, infos) {
    const T = Jeu.Terrain;
    const sol = C.carte.ligneSol;
    if (colonne < infos.debut || colonne > infos.fin) return false;
    if (Math.abs(colonne - infos.colonneDrapeau) < 2) return false; // pas sur le drapeau
    for (let c = colonne - 1; c <= colonne + 1; c++) {
      if (T.lireCase(terrain, c, sol) !== T.CASES.herbe) return false;
      for (let l = 0; l < sol; l++) if (T.lireCase(terrain, c, l) !== T.CASES.air) return false;
    }
    if (infos.lac !== null && infos.lac !== undefined) {
      const loin = C.lacs.sansObstacle;
      if (colonne >= infos.lac - loin && colonne <= infos.lac + C.lacs.largeur - 1 + loin) return false;
    }
    if (infos.monstre !== null && infos.monstre !== undefined) {
      if (colonne >= infos.monstre - C.monstres.espace - 1 && colonne <= infos.monstre + C.monstres.espaceDerriere + 1) return false;
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

  // Un minerai (fer ou charbon) déjà écrit dans la grille : on le note dans la liste, avec ses coups de pioche.
  function noterMinerai(monde, type, colonne, ligne) {
    monde.obstacles.push({
      id: monde.prochainId++,
      type,
      solide: true,
      mortel: false,
      colonne,
      ligne,
      largeur: 1,
      x: colonne * B,
      y: ligne * B,
      l: B,
      h: B,
      passe: false,
      coups: type === "fer" ? C.fer.coupsPioche : C.pioche.coupsCharbon,
    });
  }

  // Étape 31 : les obstacles des chemins spéciaux (sous terre, route, carrefour) sont déjà choisis par
  // logique/terrain.js : on les note dans la liste (pour la règle « mortel », le journal, les rayons X).
  function placerSurUnChemin(monde, infos) {
    let poses = 0;
    for (const v of infos.laves || []) {
      monde.obstacles.push({ id: monde.prochainId++, type: "lave", solide: false, mortel: true, colonne: v.colonne, largeur: v.largeur, x: v.colonne * B, y: v.ligne * B, l: v.largeur * B, h: B, passe: false });
      poses++;
    }
    for (const m of infos.minerais || []) {
      noterMinerai(monde, m.type, m.colonne, m.ligne);
      poses++;
    }
    return poses;
  }

  // Pose les obstacles d'un tronçon qui vient d'être fabriqué.
  function placerDansTroncon(monde, infos) {
    const O = C.obstacles;
    const de = infos.de;
    if (infos.arrivee) return 0; // le tronçon d'arrivée est tout plat, sans danger
    if (infos.chemin && infos.chemin !== "ciel") return placerSurUnChemin(monde, infos); // étape 31
    if (infos.grotte) {
      // Dans une grotte (étape 13) : seulement du minerai de charbon, posé sur le sol de la grotte.
      for (const colonne of infos.grotte.charbons) {
        const ligne = C.grottes.ligneSol - 1;
        Jeu.Terrain.ecrireCase(monde.terrain, colonne, ligne, CASES.charbon);
        monde.obstacles.push({
          id: monde.prochainId++,
          type: "charbon",
          solide: true,
          mortel: false,
          colonne,
          ligne,
          largeur: 1,
          x: colonne * B,
          y: ligne * B,
          l: B,
          h: B,
          passe: false,
          coups: C.pioche.coupsCharbon,
        });
      }
      return infos.grotte.charbons.length;
    }
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
    // Puis les blocs de fer, tous les 20 blocs (étape 12), le plus près possible de leur rendez-vous.
    const F = C.fer;
    for (const bloc of Jeu.Terrain.rendezVous(F.ecart, F.ecart, C.arrivee.bloc - 1)) {
      const ideale = C.carte.colonneDrapeau + bloc;
      if (Jeu.Terrain.tronconDe(ideale) !== infos.numero) continue;
      for (let d = 0; d <= F.decalageMax; d++) {
        const colonne = [ideale + d, ideale - d].find((c) => placePourLeFer(monde.terrain, c, infos));
        if (colonne !== undefined) {
          poser(monde, "fer", colonne, 1);
          monde.obstacles[monde.obstacles.length - 1].coups = F.coupsPioche; // coups de pioche restants
          poses++;
          break;
        }
      }
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

  // L'obstacle mortel (muret, lave) touché par la zone du héros, s'il y en a un.
  // Étape 29 : on regarde aussi la GRILLE, car un bout de muret cassé à la pioche ne pique plus.
  function obstacleMortelTouche(monde, zone) {
    const T = Jeu.Terrain;
    return monde.obstacles.find((o) => {
      if (!o.mortel || o.casse || !Jeu.Physique.seChevauchent(zone, o)) return false;
      const gauche = Math.max(zone.x, o.x), droite = Math.min(zone.x + zone.l, o.x + o.l);
      const haut = Math.max(zone.y, o.y), bas = Math.min(zone.y + zone.h, o.y + o.h);
      for (let c = Math.floor(gauche / B); c < Math.ceil(droite / B); c++) {
        for (let l = Math.floor(haut / B); l < Math.ceil(bas / B); l++) if (T.MORTELS[T.lireCase(monde.terrain, c, l)]) return true;
      }
      return false;
    });
  }

  return { TYPES, placerDansTroncon, noterMinerai, mettreAJour, obstacleMortelTouche };
})();
