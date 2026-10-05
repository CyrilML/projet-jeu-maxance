// 🔷 LA VUE DE BIAIS (isométrique) : le traducteur entre la grille et l'écran
//
// La carte est une grille toute simple : colonne et ligne, comme une bataille navale.
// Pour la dessiner « de biais », on tourne la grille d'un quart de tour sur la pointe (45°),
// puis on l'écrase 2 fois en hauteur. Chaque carré devient un LOSANGE.
//
//   Quand on avance d'une COLONNE : on va de ½ case vers la droite et de ½ case vers le bas.
//   Quand on avance d'une LIGNE :   on va de ½ case vers la gauche et de ½ case vers le bas.
//
// Ce fichier fait les deux traductions :
//   - grille → écran : où dessiner une case ?
//   - écran → grille : sur quelle case est la souris ? (le même calcul, à l'envers)

window.Village = window.Village || {};

Village.Iso = (function () {
  // Un point de la grille → px du « monde » (avant la caméra).
  // La case (3, 5) va du point (3 ; 5) au point (4 ; 6) : son milieu est le point (3,5 ; 5,5).
  function versMonde(colonne, ligne, L, H) {
    return { x: (colonne - ligne) * (L / 2), y: (colonne + ligne) * (H / 2) };
  }

  // Le calcul à l'envers : un point du monde → colonne et ligne (avec des virgules).
  function versGrille(x, y, L, H) {
    const a = x / (L / 2), b = y / (H / 2);
    return { colonne: (a + b) / 2, ligne: (b - a) / 2 };
  }

  return { versMonde, versGrille };
})();
