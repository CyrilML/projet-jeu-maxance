// 🧱 LES OBSTACLES : posés dans le monde
//
// À l'étape 1, les obstacles glissaient vers le héros. Maintenant, ils ne bougent plus :
// ils sont POSÉS sur le sol du monde, et c'est le héros qui avance vers eux.
// Quand un tronçon du monde est fabriqué, ce fichier choisit où poser ses obstacles.
//
// Les obstacles ne sont PAS rangés dans la grille du terrain : ce sont des objets à part,
// dans la liste monde.obstacles, avec leur numéro, leur type et leur position en pixels.
// Pourquoi ? Parce qu'ils ont leurs propres règles (les toucher = perdu) et qu'une tour ou un muret
// occupe plusieurs cases mais reste UN seul obstacle.

window.Jeu = window.Jeu || {};

Jeu.Obstacles = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  // Le « catalogue » des obstacles, en blocs de 40 px.
  const TYPES = {
    caisse: { l: 1, h: 1, matiere: "bois" },
    tour: { l: 1, h: 2, matiere: "pierre" },
    muret: { l: 2, h: 1, matiere: "bois" },
  };

  // Les obstacles possibles à cette colonne du monde (plus on va loin, plus il y a de choix).
  function typesPossibles(colonne) {
    return Object.keys(TYPES).filter((nom) => colonne >= C.obstacles.debloque[nom]);
  }

  // Peut-on poser un obstacle de `largeur` blocs à cette colonne ?
  // Il faut du sol tout autour (pour prendre son élan et atterrir) et pas de plateforme juste au-dessus.
  function placeLibre(terrain, colonne, largeur, infos) {
    const O = C.obstacles;
    const CARTE = C.carte;
    for (let c = colonne - O.margeTrou; c < colonne + largeur + O.margeTrou; c++) {
      if (c < infos.debut + infos.zoneSure || c > infos.fin) return false;
      if (Jeu.Terrain.lireCase(terrain, c, CARTE.ligneSol) === Jeu.Terrain.CASES.air) return false; // un trou
    }
    for (let c = colonne - 1; c <= colonne + largeur; c++) {
      for (let l = 0; l < CARTE.ligneSol; l++) {
        if (Jeu.Terrain.estSolide(terrain, c, l)) return false; // une plateforme au-dessus
      }
    }
    return true;
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
      if (!placeLibre(monde.terrain, colonne, type.l, infos)) {
        colonne++; // pas de place ici : on essaie la colonne suivante
        continue;
      }
      monde.obstacles.push({
        id: monde.prochainId++,
        type: nom,
        matiere: type.matiere,
        colonne,
        x: colonne * B,
        y: C.solY - type.h * B,
        l: type.l * B,
        h: type.h * B,
        passe: false,
      });
      poses++;
      colonne += type.l + de.entre(O.ecartMin, O.ecartMax);
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

  return { TYPES, placerDansTroncon, mettreAJour };
})();
