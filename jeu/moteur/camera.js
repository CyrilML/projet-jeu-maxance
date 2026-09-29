// 🎥 LA CAMÉRA : le cadreur qui suit l'action
//
// Le monde est beaucoup plus grand que l'écran. La caméra, c'est une fenêtre qui glisse
// au-dessus du monde : elle retient juste UN nombre, camera.x, la position (dans le monde)
// du bord gauche de l'écran.
//
// Deux sortes de coordonnées :
//   - coordonnées MONDE : où est l'objet dans le monde entier (le héros peut être à x = 5 000) ;
//   - coordonnées ÉCRAN : où on le dessine sur l'écran de 960 px.
//   Pour passer de l'une à l'autre :  x écran = x monde − camera.x   (et y écran = y monde − camera.y)
//
// La caméra ne saute pas d'un coup sur sa cible : à chaque pas, elle parcourt une partie
// de l'écart qui reste. C'est ce qui rend le mouvement doux.

window.Jeu = window.Jeu || {};

Jeu.Camera = (function () {
  function creer() {
    return { x: 0, cible: 0, y: 0, cibleY: 0 };
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

  // Pareil, mais de haut en bas (étape 13 : la caméra descend dans les grottes ; étape 26 : elle monte
  // aussi quand le héros grimpe, et camera.y devient alors négatif : on regarde au-dessus du monde).
  // `min` et `max` : la caméra ne sort jamais du monde.
  function suivreY(camera, cibleY, dt, tempsDeReaction, min, max) {
    camera.cibleY = Math.max(min, Math.min(max, cibleY));
    const part = 1 - Math.exp(-dt / tempsDeReaction);
    camera.y += (camera.cibleY - camera.y) * part;
    if (Math.abs(camera.cibleY - camera.y) < 0.05) camera.y = camera.cibleY;
  }

  return { creer, suivre, suivreY };
})();
