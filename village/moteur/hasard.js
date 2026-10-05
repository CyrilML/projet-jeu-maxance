// 🎲 LE HASARD À GRAINE : un dé qui se souvient
//
// Un ordinateur ne sait pas vraiment tirer au hasard : il fait un calcul compliqué qui donne des
// nombres qui ont l'AIR mélangés. On part d'un numéro, la GRAINE. Même graine = mêmes nombres,
// dans le même ordre. C'est pour ça qu'avec la même graine, on retrouve exactement la même carte.
//
// Le BRUIT, lui, est un hasard « tout doux » : deux cases voisines ont des valeurs proches.
// Sans lui, la carte serait un gribouillis de cases mélangées ; avec lui, on a des lacs, des forêts
// et des collines bien rondes.

window.Village = window.Village || {};

Village.Hasard = (function () {
  // Un tireur de nombres entre 0 et 1, à partir d'une graine (méthode « mulberry32 »).
  function creer(graine) {
    let etat = graine >>> 0;
    function suivant() {
      etat = (etat + 0x6d2b79f5) >>> 0;
      let t = etat;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      suivant,
      entre: (min, max) => min + suivant() * (max - min),
      entier: (min, max) => Math.floor(min + suivant() * (max - min + 1)),
    };
  }

  // Un nombre « au hasard » mais toujours le même pour une case donnée (sert aux petits détails).
  function pourCase(graine, x, y) {
    let h = (graine ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // Le bruit doux : on tire une valeur au hasard tous les `taille` cases (les « piquets »),
  // et entre deux piquets on passe en douceur de l'un à l'autre.
  // On additionne plusieurs couches (grosses bosses + petites bosses) : c'est le bruit « fractal ».
  function bruit(graine, x, y, taille) {
    let total = 0, poids = 1, somme = 0;
    for (let couche = 0; couche < 4; couche++) {
      total += poids * bruitSimple(graine + couche * 1013, x / taille, y / taille);
      somme += poids;
      poids /= 2;
      taille /= 2;
    }
    return total / somme;
  }

  function bruitSimple(graine, x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = lisser(x - x0), fy = lisser(y - y0);
    const a = pourCase(graine, x0, y0), b = pourCase(graine, x0 + 1, y0);
    const c = pourCase(graine, x0, y0 + 1), d = pourCase(graine, x0 + 1, y0 + 1);
    const haut = a + (b - a) * fx, bas = c + (d - c) * fx;
    return haut + (bas - haut) * fy;
  }

  // Une courbe en S : on démarre et on arrive doucement (pas d'angle entre deux piquets).
  const lisser = (t) => t * t * (3 - 2 * t);

  return { creer, pourCase, bruit };
})();
