// 🍎 LA PHYSIQUE : les lois de la nature du jeu
//
// Un « corps » est un objet avec une position (x, y), une taille (l, h)
// et une vitesse (vx, vy). Ce fichier ne sait pas si c'est un héros, un monstre
// ou une flèche : il applique les mêmes lois à tout le monde.
//
// À chaque pas de temps dt (1/120 de seconde) :
//   1. la gravité augmente la vitesse vers le bas :  vy = vy + gravité × dt
//   2. la vitesse déplace le corps :                  x = x + vx × dt,  y = y + vy × dt
//   3. on corrige si le corps traverse le sol ou sort de l'écran.

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

  // Si le corps s'est enfoncé dans le sol, on le remet dessus et on arrête sa chute.
  // Renvoie vrai si le corps touche le sol.
  function poserSurLeSol(corps) {
    if (corps.y + corps.h < C.solY) return false;
    corps.y = C.solY - corps.h;
    corps.vy = 0;
    return true;
  }

  function garderDansEcran(corps) {
    corps.x = Math.max(0, Math.min(C.ecran.largeur - corps.l, corps.x));
  }

  // Deux rectangles se chevauchent-ils ? (on appelle ça une collision « AABB »)
  // Ils se touchent si aucun n'est entièrement à gauche, à droite, au-dessus ou en dessous de l'autre.
  function seChevauchent(a, b) {
    return a.x < b.x + b.l && a.x + a.l > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  return { appliquerGravite, deplacer, poserSurLeSol, garderDansEcran, seChevauchent };
})();
