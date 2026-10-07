// 🌫️ LE BRUIT : le dessinateur de collines
//
// Pour inventer un terrain qui a l'air naturel, on ne tire pas des hauteurs complètement au hasard (ça ferait des
// pics partout !). On utilise un « BRUIT » : on pose des valeurs au hasard sur une grille, et ENTRE les points de la
// grille on glisse en douceur de l'une à l'autre. Puis on additionne plusieurs bruits : un gros (les grandes
// collines), un moyen, un petit (les bosses)… C'est le « bruit fractal », comme pour les nuages du circuit.
//
// Outil générique : il ne connaît aucune règle du jeu. Avec la même graine, il donne toujours le même paysage.

window.Tanks = window.Tanks || {};

Tanks.Bruit = (function () {
  // Un bruit de valeurs, avec une graine. Renvoie une fonction (x, z) → un nombre entre −1 et 1.
  function creer(graine) {
    const N = 256, valeurs = new Float32Array(N), perm = new Uint8Array(N * 2);
    let etat = graine >>> 0 || 1;
    const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < N; i++) {
      valeurs[i] = hasard() * 2 - 1;
      perm[i] = i;
    }
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(hasard() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < N; i++) perm[N + i] = perm[i];
    const v = (i, j) => valeurs[perm[(i & 255) + perm[j & 255]]];
    const lisse = (t) => t * t * (3 - 2 * t); // (un glissement doux : ni coin, ni marche)
    return function (x, z) {
      const i = Math.floor(x), j = Math.floor(z), fx = lisse(x - i), fz = lisse(z - j);
      const a = v(i, j), b = v(i + 1, j), c = v(i, j + 1), d = v(i + 1, j + 1);
      return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
    };
  }

  // Le bruit fractal : plusieurs « octaves » (chacune 2 fois plus petite et 2 fois moins forte que la précédente).
  function fractal(bruit, x, z, octaves) {
    let total = 0, force = 1, echelle = 1, somme = 0;
    for (let o = 0; o < octaves; o++) {
      total += bruit(x * echelle, z * echelle) * force;
      somme += force;
      force *= 0.5;
      echelle *= 2;
    }
    return total / somme;
  }

  return { creer, fractal };
})();
