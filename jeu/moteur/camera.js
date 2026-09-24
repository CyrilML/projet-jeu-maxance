// 🎥 LA CAMÉRA : le cadreur qui suit l'action
//
// Le monde est beaucoup plus grand que l'écran. La caméra, c'est une fenêtre qui glisse
// au-dessus du monde : elle retient juste UN nombre, camera.x, la position (dans le monde)
// du bord gauche de l'écran.
//
// Deux sortes de coordonnées :
//   - coordonnées MONDE : où est l'objet dans le monde entier (le héros peut être à x = 5 000) ;
//   - coordonnées ÉCRAN : où on le dessine sur l'écran de 960 px.
//   Pour passer de l'une à l'autre :  x écran = x monde − camera.x
//
// La caméra ne saute pas d'un coup sur sa cible : à chaque pas, elle parcourt une partie
// de l'écart qui reste. C'est ce qui rend le mouvement doux.

window.Jeu = window.Jeu || {};

Jeu.Camera = (function () {
  function creer() {
    return { x: 0, cible: 0 };
  }

  // Rapproche la caméra de cibleX. `tempsDeReaction` (en s) règle la douceur :
  // au bout de 5 fois ce temps, il reste moins de 1 % de l'écart.
  // `minimum` : la caméra ne va jamais plus à gauche que ça (le début du monde).
  function suivre(camera, cibleX, dt, tempsDeReaction, minimum) {
    camera.cible = Math.max(minimum, cibleX);
    const part = 1 - Math.exp(-dt / tempsDeReaction); // la part de l'écart parcourue pendant ce pas
    camera.x += (camera.cible - camera.x) * part;
    if (Math.abs(camera.cible - camera.x) < 0.05) camera.x = camera.cible;
  }

  return { creer, suivre };
})();
