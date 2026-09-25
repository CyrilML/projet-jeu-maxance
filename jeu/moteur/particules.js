// ✨ LES PARTICULES : des milliers de petits riens qui font un grand effet
//
// Une flamme, une étincelle, une bulle, un nuage de poussière… ce sont des PARTICULES :
// de tout petits objets qui naissent, bougent un peu, puis meurent. Chacune est juste
// quelques nombres rangés dans une liste :
//   x, y       → où elle est
//   vx, vy     → sa vitesse (vy négatif = elle monte)
//   vie        → combien de secondes il lui reste
//   vieMax     → combien de secondes elle vivait au départ (pour savoir si elle est « jeune » ou « vieille »)
//   taille     → sa taille au départ, en px
//
// Ce fichier ne sait pas si c'est du feu ou de l'eau : c'est l'affichage qui choisit les couleurs.
// Comme les obstacles de l'étape 1, une particule morte est retirée de la liste pour libérer la mémoire.

window.Jeu = window.Jeu || {};

Jeu.Particules = (function () {
  // Ajoute une particule à la liste.
  function ajouter(liste, x, y, vx, vy, vie, taille) {
    liste.push({ x, y, vx, vy, vie, vieMax: vie, taille, phase: Math.random() * 6.28 });
  }

  // Fait vivre toutes les particules pendant dt secondes, et enlève celles qui sont mortes.
  // `tremblement` (en px/s) fait onduler les particules de gauche à droite, comme une flamme.
  function mettreAJour(liste, dt, tremblement) {
    for (const p of liste) {
      p.vie -= dt;
      p.phase += dt * 12;
      p.x += (p.vx + Math.sin(p.phase) * (tremblement || 0)) * dt;
      p.y += p.vy * dt;
    }
    for (let i = liste.length - 1; i >= 0; i--) {
      if (liste[i].vie <= 0) liste.splice(i, 1);
    }
  }

  return { ajouter, mettreAJour };
})();
