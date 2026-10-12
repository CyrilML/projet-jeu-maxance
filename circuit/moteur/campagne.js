// ⛰️ LA CAMPAGNE : le sculpteur de paysage
//
// Étape 68. ✍️ Les cartes sont 3 fois plus grandes : il faut remplir la place avec des COLLINES et une RIVIÈRE.
// C'est un outil générique (il ne connaît aucune règle du jeu) : on lui donne la taille de la carte, des collines,
// le tracé de la rivière et les endroits qui doivent rester PLATS (la route, les tremplins…), et il fabrique le sol.
//
//   1. Les COLLINES : chacune est une « bosse en cloche » (haute au milieu, douce sur les bords). On les additionne.
//   2. Les endroits PLATS : près de la route, le sol est aplati (sinon la route serait enterrée dans une colline !).
//      Plus on s'éloigne de la route, plus la colline reprend sa hauteur : c'est un fondu, pas une marche.
//   3. La RIVIÈRE : une ligne qui serpente. Dans sa largeur, le sol est creusé (son lit) ; sur les bords, les berges
//      sont en pente douce (on peut en ressortir). L'eau est posée un peu plus bas que l'herbe.
//   4. Calculer tout ça à chaque pas de jeu serait trop lent : on le calcule UNE fois, sur une GRILLE (un point tous
//      les 4 m), et ensuite on lit la grille (en mélangeant les 4 points voisins : « interpolation »).
//
// reglages : { taille (m), pas (m), graine, collines: { nombre, rayon: [min, max], hauteur: [min, max] },
//              riviere: { points: [[x, z], …], largeur, profondeur, berge } (facultatif),
//              plats: [[x, z, rayon], …] (des ronds où le sol reste plat), marge (m : la largeur du fondu),
//              horsCollines: (x, z) → vrai si aucune colline ne doit pousser là (facultatif),
//              carrePlat (m : un carré tout plat au milieu, pour une ville ; facultatif),
//              bordPlat (m : le sol redevient plat près du bord de la carte, là où il y a la clôture ; facultatif) }

window.Circuit = window.Circuit || {};

Circuit.Campagne = (function () {
  const cloche = (d, r) => (d >= r ? 0 : 0.5 * (1 + Math.cos((Math.PI * d) / r))); // 1 au milieu, 0 au bord
  const lisse = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

  // La distance d'un point à un segment [a, b] (et où on est sur le segment : 0 = en a, 1 = en b).
  function distanceSegment(x, z, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    return { d: Math.hypot(x - ax - dx * t, z - az - dz * t), t };
  }

  function creer(reglages) {
    const taille = reglages.taille, pas = reglages.pas || 4;
    const demi = taille / 2;
    const n = Math.round(taille / pas) + 1; // nombre de points sur un côté de la grille
    let etat = (reglages.graine || 1) >>> 0;
    const alea = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

    // La rivière : on la découpe en petits morceaux de 8 m (pour mesurer vite la distance).
    const R = reglages.riviere || null;
    const riviere = [];
    if (R) {
      for (let i = 0; i < R.points.length - 1; i++) {
        const [ax, az] = R.points[i], [bx, bz] = R.points[i + 1];
        const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 8));
        for (let j = 0; j < k; j++) riviere.push([ax + ((bx - ax) * j) / k, az + ((bz - az) * j) / k]);
      }
      riviere.push(R.points[R.points.length - 1]);
    }
    const demiLit = R ? R.largeur / 2 : 0;
    function distanceRiviere(x, z) {
      let mieux = Infinity;
      for (let i = 0; i < riviere.length - 1; i++) {
        const a = riviere[i], b = riviere[i + 1];
        if (Math.abs(x - a[0]) > 60 + mieux && Math.abs(x - b[0]) > 60 + mieux) continue;
        if (Math.abs(z - a[1]) > 60 + mieux && Math.abs(z - b[1]) > 60 + mieux) continue;
        mieux = Math.min(mieux, distanceSegment(x, z, a[0], a[1], b[0], b[1]).d);
      }
      return mieux;
    }

    // Les collines : posées au hasard (toujours les mêmes grâce à la graine), pas sur la rivière.
    const collines = [];
    const Co = reglages.collines || { nombre: 0 };
    let essais = 0;
    while (collines.length < Co.nombre && essais++ < Co.nombre * 30) {
      const x = (alea() * 2 - 1) * demi, z = (alea() * 2 - 1) * demi;
      const r = Co.rayon[0] + alea() * (Co.rayon[1] - Co.rayon[0]);
      if (reglages.horsCollines && reglages.horsCollines(x, z)) continue;
      if (R && distanceRiviere(x, z) < r * 0.6) continue;
      collines.push({ x, z, rayon: r, hauteur: Co.hauteur[0] + alea() * (Co.hauteur[1] - Co.hauteur[0]) });
    }

    // La grille des distances aux endroits plats : chaque endroit plat « tamponne » les cases autour de lui.
    const marge = reglages.marge || 40;
    const plat = new Float32Array(n * n).fill(Infinity);
    for (const [px, pz, pr] of reglages.plats || []) {
      const portee = pr + marge;
      const i1 = Math.max(0, Math.floor((px - portee + demi) / pas)), i2 = Math.min(n - 1, Math.ceil((px + portee + demi) / pas));
      const j1 = Math.max(0, Math.floor((pz - portee + demi) / pas)), j2 = Math.min(n - 1, Math.ceil((pz + portee + demi) / pas));
      for (let j = j1; j <= j2; j++) {
        for (let i = i1; i <= i2; i++) {
          const d = Math.hypot(i * pas - demi - px, j * pas - demi - pz) - pr;
          const k = j * n + i;
          if (d < plat[k]) plat[k] = d;
        }
      }
    }

    // La grille des distances à la rivière (même tampon : chaque morceau de rivière marque les cases proches).
    const portee = demiLit + (R ? R.berge : 0) + 45;
    const loinRiviere = new Float32Array(n * n).fill(Infinity);
    for (let s = 0; s < riviere.length - 1; s++) {
      const [ax, az] = riviere[s], [bx, bz] = riviere[s + 1];
      const i1 = Math.max(0, Math.floor((Math.min(ax, bx) - portee + demi) / pas)), i2 = Math.min(n - 1, Math.ceil((Math.max(ax, bx) + portee + demi) / pas));
      const j1 = Math.max(0, Math.floor((Math.min(az, bz) - portee + demi) / pas)), j2 = Math.min(n - 1, Math.ceil((Math.max(az, bz) + portee + demi) / pas));
      for (let j = j1; j <= j2; j++) {
        for (let i = i1; i <= i2; i++) {
          const d = distanceSegment(i * pas - demi, j * pas - demi, ax, az, bx, bz).d, k = j * n + i;
          if (d < loinRiviere[k]) loinRiviere[k] = d;
        }
      }
    }

    // La grille des hauteurs.
    const hauteurs = new Float32Array(n * n);
    const dansLit = new Uint8Array(n * n); // 1 = dans le lit de la rivière (pour le peintre)
    const P = R ? R.profondeur : 0, B = R ? R.berge : 1;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = i * pas - demi, z = j * pas - demi, k = j * n + i;
        let h = 0;
        for (const c of collines) {
          if (Math.abs(x - c.x) > c.rayon || Math.abs(z - c.z) > c.rayon) continue;
          h += c.hauteur * cloche(Math.hypot(x - c.x, z - c.z), c.rayon);
        }
        h *= lisse(plat[k] / marge); // aplati près de la route
        if (reglages.carrePlat) h *= lisse((Math.max(Math.abs(x), Math.abs(z)) - reglages.carrePlat) / marge); // un carré plat au milieu (une ville)
        if (reglages.bordPlat) h *= lisse((demi - Math.max(Math.abs(x), Math.abs(z))) / reglages.bordPlat); // et près de la clôture
        if (R) {
          const d = loinRiviere[k];
          h *= lisse((d - demiLit) / (B + 40)); // les collines descendent doucement vers la rivière
          if (d < demiLit + B) h -= P * (d <= demiLit ? 1 : 1 - lisse((d - demiLit) / B));
          if (d <= demiLit) dansLit[k] = 1;
        }
        hauteurs[k] = h;
      }
    }

    // La hauteur du sol en (x, z) : on mélange les 4 points de la grille autour.
    function hauteur(x, z) {
      const fx = Math.max(0, Math.min(n - 1.001, (x + demi) / pas)), fz = Math.max(0, Math.min(n - 1.001, (z + demi) / pas));
      const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * n + i;
      return (hauteurs[k] * (1 - u) + hauteurs[k + 1] * u) * (1 - v) + (hauteurs[k + n] * (1 - u) + hauteurs[k + n + 1] * u) * v;
    }
    const niveauEau = R ? -P + (R.eau === undefined ? 1.2 : R.eau) : -Infinity;
    // Est-on dans l'eau ? (dans le lit de la rivière, et plus bas que la surface de l'eau)
    const dansLEau = (x, z, y) => !!R && (y === undefined ? hauteur(x, z) : y) < niveauEau - 0.2 && distanceRiviere(x, z) < demiLit + B;

    return { taille, pas, n, hauteurs, dansLit, collines, riviere: R ? { points: R.points, largeur: R.largeur, niveau: niveauEau, berge: B } : null, hauteur, dansLEau, distanceRiviere };
  }

  // Un tracé de rivière qui serpente : de (x1, z1) à (x2, z2), avec des virages de `amplitude` mètres.
  function serpent(x1, z1, x2, z2, amplitude, virages, graine) {
    const points = [], l = Math.hypot(x2 - x1, z2 - z1), nx = -(z2 - z1) / l, nz = (x2 - x1) / l;
    const morceaux = Math.max(8, Math.round(l / 25));
    for (let i = 0; i <= morceaux; i++) {
      const t = i / morceaux;
      const e = amplitude * (Math.sin(t * Math.PI * virages + graine) * 0.75 + Math.sin(t * Math.PI * virages * 2.3 + graine * 2) * 0.25);
      points.push([x1 + (x2 - x1) * t + nx * e, z1 + (z2 - z1) * t + nz * e]);
    }
    return points;
  }

  return { creer, serpent, distanceSegment };
})();
