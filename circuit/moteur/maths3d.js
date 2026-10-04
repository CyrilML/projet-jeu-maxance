// 📐 LES MATHS DE LA 3D : la boîte à outils du géomètre
//
// Pour dessiner en 3D, l'ordinateur doit répondre à une seule question, des milliers de fois
// par image : « ce point du monde (x, y, z), où tombe-t-il sur l'écran plat ? »
//
// Pour ça, on utilise des MATRICES : des tableaux de 16 nombres (4 × 4) qui savent
// déplacer, tourner, ou « mettre en perspective » un point. On peut les enchaîner :
//   matrice de la caméra × matrice de la voiture × point de la voiture = point sur l'écran.
//
// Rangement des 16 nombres : colonne par colonne (c'est ce qu'attend la carte graphique).

window.Circuit = window.Circuit || {};

Circuit.Maths3D = (function () {
  // La matrice « qui ne fait rien » (comme multiplier par 1).
  function identite() {
    const m = new Float32Array(16);
    m[0] = m[5] = m[10] = m[15] = 1;
    return m;
  }

  // a × b : d'abord b, puis a.
  function multiplier(a, b) {
    const r = new Float32Array(16);
    for (let colonne = 0; colonne < 4; colonne++) {
      for (let ligne = 0; ligne < 4; ligne++) {
        let somme = 0;
        for (let k = 0; k < 4; k++) somme += a[k * 4 + ligne] * b[colonne * 4 + k];
        r[colonne * 4 + ligne] = somme;
      }
    }
    return r;
  }

  // Enchaîne plusieurs matrices : enchainer(a, b, c) = a × b × c.
  function enchainer(...matrices) {
    return matrices.reduce((acc, m) => multiplier(acc, m));
  }

  // Déplacer de (x, y, z).
  function deplacement(x, y, z) {
    const m = identite();
    m[12] = x;
    m[13] = y;
    m[14] = z;
    return m;
  }

  // Tourner autour de l'axe vertical (y), comme une toupie. Angle en radians.
  function rotationY(angle) {
    const m = identite();
    const c = Math.cos(angle), s = Math.sin(angle);
    m[0] = c;
    m[2] = -s;
    m[8] = s;
    m[10] = c;
    return m;
  }

  // Tourner autour de l'axe z (comme une roue qui roule vers l'avant, quand la voiture regarde vers x).
  function rotationZ(angle) {
    const m = identite();
    const c = Math.cos(angle), s = Math.sin(angle);
    m[0] = c;
    m[1] = s;
    m[4] = -s;
    m[5] = c;
    return m;
  }

  // La PERSPECTIVE : ce qui est loin paraît plus petit.
  // champ = angle d'ouverture de l'œil (radians), proche/loin = ce qu'on voit entre ces 2 distances.
  function perspective(champ, rapport, proche, loin) {
    const f = 1 / Math.tan(champ / 2);
    const m = new Float32Array(16);
    m[0] = f / rapport;
    m[5] = f;
    m[10] = (loin + proche) / (proche - loin);
    m[11] = -1;
    m[14] = (2 * loin * proche) / (proche - loin);
    return m;
  }

  // La CAMÉRA : « je suis à l'endroit oeil, et je regarde vers cible ».
  function regarder(oeil, cible, haut) {
    let zx = oeil[0] - cible[0], zy = oeil[1] - cible[1], zz = oeil[2] - cible[2];
    let n = Math.hypot(zx, zy, zz) || 1;
    zx /= n; zy /= n; zz /= n;
    let xx = haut[1] * zz - haut[2] * zy, xy = haut[2] * zx - haut[0] * zz, xz = haut[0] * zy - haut[1] * zx;
    n = Math.hypot(xx, xy, xz) || 1;
    xx /= n; xy /= n; xz /= n;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const m = new Float32Array(16);
    m[0] = xx; m[4] = xy; m[8] = xz;
    m[1] = yx; m[5] = yy; m[9] = yz;
    m[2] = zx; m[6] = zy; m[10] = zz;
    m[12] = -(xx * oeil[0] + xy * oeil[1] + xz * oeil[2]);
    m[13] = -(yx * oeil[0] + yy * oeil[1] + yz * oeil[2]);
    m[14] = -(zx * oeil[0] + zy * oeil[1] + zz * oeil[2]);
    m[15] = 1;
    return m;
  }

  // Applique une matrice à un point : renvoie [x, y, z, w].
  function transformer(m, x, y, z) {
    return [
      m[0] * x + m[4] * y + m[8] * z + m[12],
      m[1] * x + m[5] * y + m[9] * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      m[3] * x + m[7] * y + m[11] * z + m[15],
    ];
  }

  // Où tombe le point (x, y, z) sur un écran de largeur × hauteur pixels ? (null s'il est derrière l'œil)
  function versEcran(vueProjection, x, y, z, largeur, hauteur) {
    const p = transformer(vueProjection, x, y, z);
    if (p[3] <= 0.1) return null;
    return { x: (p[0] / p[3] * 0.5 + 0.5) * largeur, y: (0.5 - p[1] / p[3] * 0.5) * hauteur };
  }

  return { identite, multiplier, enchainer, deplacement, rotationY, rotationZ, perspective, regarder, transformer, versEcran };
})();
