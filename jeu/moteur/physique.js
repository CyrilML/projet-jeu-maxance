// 🍎 LA PHYSIQUE : les lois de la nature du jeu
//
// Un « corps » est un objet avec une position (x, y), une taille (l, h)
// et une vitesse (vx, vy). Ce fichier ne sait pas si c'est un héros, un monstre
// ou une flèche : il applique les mêmes lois à tout le monde.
//
// À chaque pas de temps dt (1/120 de seconde) :
//   1. la gravité augmente la vitesse vers le bas :  vy = vy + gravité × dt
//   2. la vitesse déplace le corps :                  x = x + vx × dt,  y = y + vy × dt
//   3. on corrige si le corps rentre dans une case solide de la grille (sol, plateforme…).
//
// La grille : le monde est découpé en cases carrées. Pour savoir dans quelle case est un point,
// on divise sa position par la taille d'une case et on garde la partie entière :
//   colonne = partie entière de (x ÷ 40)      ligne = partie entière de (y ÷ 40)
// Exemple : x = 130 → 130 ÷ 40 = 3,25 → colonne 3.

window.Jeu = window.Jeu || {};

Jeu.Physique = (function () {
  const C = Jeu.CONFIG;

  function appliquerGravite(corps, dt) {
    corps.vy = Math.min(corps.vy + C.gravite * dt, C.vitesseChuteMax);
  }

  function deplacer(corps, dt) {
    corps.x += corps.vx * dt;
    corps.y += corps.vy * dt;
  }

  // Dans quelle case (colonne ou ligne) tombe la position p ?
  function caseDe(p, taille) {
    return Math.floor(p / taille);
  }

  // Déplace le corps d'un pas, en l'empêchant d'entrer dans les cases solides.
  // `grille` donne la taille des cases et une fonction estSolide(colonne, ligne).
  // On bouge d'abord à l'horizontale, puis à la verticale : en séparant les deux,
  // on sait toujours de quel côté on a touché un mur, un plafond ou le sol.
  // Renvoie les côtés touchés : { gauche, droite, haut, bas }.
  function deplacerDansGrille(corps, dt, grille) {
    const T = grille.taille;
    const contact = { gauche: false, droite: false, haut: false, bas: false };
    const presque = 0.001; // pour qu'un bord posé pile sur une ligne de la grille ne compte pas la case d'à côté

    // 1. Horizontal
    corps.x += corps.vx * dt;
    const ligneHaut = caseDe(corps.y, T);
    const ligneBas = caseDe(corps.y + corps.h - presque, T);
    if (corps.vx > 0) {
      const col = caseDe(corps.x + corps.l - presque, T);
      for (let lig = ligneHaut; lig <= ligneBas; lig++) {
        if (grille.estSolide(col, lig)) {
          corps.x = col * T - corps.l; // on recule jusqu'au bord gauche de la case
          corps.vx = 0;
          contact.droite = true;
          break;
        }
      }
    } else if (corps.vx < 0) {
      const col = caseDe(corps.x, T);
      for (let lig = ligneHaut; lig <= ligneBas; lig++) {
        if (grille.estSolide(col, lig)) {
          corps.x = (col + 1) * T; // on avance jusqu'au bord droit de la case
          corps.vx = 0;
          contact.gauche = true;
          break;
        }
      }
    }

    // 2. Vertical
    corps.y += corps.vy * dt;
    const colGauche = caseDe(corps.x, T);
    const colDroite = caseDe(corps.x + corps.l - presque, T);
    if (corps.vy > 0) {
      const lig = caseDe(corps.y + corps.h - presque, T);
      for (let col = colGauche; col <= colDroite; col++) {
        if (grille.estSolide(col, lig)) {
          corps.y = lig * T - corps.h; // posé sur le dessus de la case
          corps.vy = 0;
          contact.bas = true;
          break;
        }
      }
    } else if (corps.vy < 0) {
      const lig = caseDe(corps.y, T);
      for (let col = colGauche; col <= colDroite; col++) {
        if (grille.estSolide(col, lig)) {
          corps.y = (lig + 1) * T; // la tête cogne le dessous de la case
          corps.vy = 0;
          contact.haut = true;
          break;
        }
      }
    }
    return contact;
  }

  // Deux rectangles se chevauchent-ils ? (on appelle ça une collision « AABB »)
  // Ils se touchent si aucun n'est entièrement à gauche, à droite, au-dessus ou en dessous de l'autre.
  function seChevauchent(a, b) {
    return a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  return { appliquerGravite, deplacer, caseDe, deplacerDansGrille, seChevauchent };
})();
