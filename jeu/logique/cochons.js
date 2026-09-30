// 🐷 LES COCHONS : les promeneurs du monde (étape 13)
//
// Un petit cochon se promène environ tous les 40 blocs. Il marche tranquillement de gauche à droite,
// sans s'éloigner de plus de 3 blocs de chez lui, et fait demi-tour au bord d'un trou ou devant un mur.
// Il ne se défend pas et ne bloque pas le passage. Deux coups d'épée (10 PV) : il donne 1 viande crue.
// C'est une toute petite INTELLIGENCE ARTIFICIELLE : une seule règle, « marche, et fais demi-tour
// si tu ne peux pas avancer ».

window.Jeu = window.Jeu || {};

Jeu.Cochons = (function () {
  const C = Jeu.CONFIG;
  const B = C.tailleBloc;

  function creer(id, colonne) {
    return {
      id,
      colonne,
      maison: colonne * B + 4, // son point de départ (px)
      x: colonne * B + 4,
      y: C.solY - 26,
      l: 32,
      h: 26,
      pv: C.cochons.pv,
      direction: Math.random() < 0.5 ? -1 : 1,
      touche: 0,
      vivant: true,
      animation: Math.random(),
    };
  }

  // Une colonne où un cochon peut se promener : de l'herbe dessous, rien au-dessus, sur 3 colonnes.
  function bonnePlace(terrain, colonne) {
    const T = Jeu.Terrain;
    for (let c = colonne - 1; c <= colonne + 1; c++) {
      if (T.lireCase(terrain, c, C.carte.ligneSol) !== T.CASES.herbe) return false;
      for (let l = C.carte.ligneSol - 2; l < C.carte.ligneSol; l++) if (T.lireCase(terrain, c, l) !== T.CASES.air) return false;
    }
    return true;
  }

  // Place les cochons d'un tronçon qui vient d'être fabriqué (environ tous les 40 blocs).
  function placerDansTroncon(monde, infos) {
    if (infos.arrivee || infos.grotte) return 0;
    let poses = 0;
    for (const bloc of Jeu.Terrain.rendezVous(C.cochons.ecart, C.cochons.ecart, C.arrivee.bloc - 1)) {
      const ideale = C.carte.colonneDrapeau + bloc;
      if (Jeu.Terrain.tronconDe(ideale) !== infos.numero) continue;
      for (let d = 0; d <= 6; d++) {
        const colonne = [ideale + d, ideale - d].find((c) => c >= infos.debut && c <= infos.fin && bonnePlace(monde.terrain, c));
        if (colonne !== undefined) {
          monde.cochons.push(creer(monde.prochainId++, colonne));
          poses++;
          break;
        }
      }
    }
    return poses;
  }

  // Chaque cochon avance un peu, et fait demi-tour s'il ne peut pas continuer.
  function mettreAJour(monde, dt) {
    const T = Jeu.Terrain;
    for (const co of monde.cochons) {
      co.touche = Math.max(0, co.touche - dt);
      if (!co.vivant) {
        co.danseMort = Math.max(0, (co.danseMort || 0) - dt); // l'affichage le fait danser (étape 28)
        continue;
      }
      co.animation += dt;
      const suivant = co.x + co.direction * C.cochons.vitesse * dt;
      const bord = co.direction > 0 ? suivant + co.l : suivant; // le bout de son groin
      const colonne = Math.floor(bord / B);
      const tropLoin = Math.abs(suivant - co.maison) > C.cochons.promenade * B;
      const pasDeSol = !T.estSolide(monde.terrain, colonne, C.carte.ligneSol);
      const mur = T.estSolide(monde.terrain, colonne, C.carte.ligneSol - 1);
      if (tropLoin || pasDeSol || mur) co.direction *= -1; // demi-tour !
      else co.x = suivant;
    }
  }

  // Le cochon vivant juste devant le héros, à portée d'épée.
  function cochonDevant(monde) {
    const j = monde.joueur;
    for (const co of monde.cochons) {
      if (!co.vivant) continue;
      const devant = j.regard > 0 ? co.x - (j.x + j.l) : j.x - (co.x + co.l);
      const memeHauteur = j.y < co.y + co.h && j.y + j.h > co.y;
      if (devant >= -co.l && devant <= C.combat.porteeEpee && memeHauteur) return co;
    }
    return null;
  }

  return { creer, placerDansTroncon, mettreAJour, cochonDevant };
})();
