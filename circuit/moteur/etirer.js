// 📏 L'ÉTIREUR : l'élastique des routes
//
// Étape 68. ✍️ Les cartes deviennent 3 fois plus grandes. Pour une route faite de points (le ruban), on pourrait
// tout multiplier par 3… mais alors un saut de 50 m deviendrait un saut de 150 m (impossible !) et une plateforme
// de 40 m deviendrait géante. L'astuce : la route est comme un ÉLASTIQUE avec des morceaux en bois.
//   - les morceaux de route normaux sont ÉTIRÉS (× 3) ;
//   - les morceaux « spéciaux » (un tremplin, un vide à sauter, une plateforme) gardent EXACTEMENT leur taille :
//     ils sont seulement DÉPLACÉS, avec tout ce qui est posé dessus.
// Pour une route en boucle, les morceaux spéciaux font que la boucle ne se referme plus tout à fait : on répartit
// le petit écart sur les morceaux étirés (chacun selon sa longueur).
//
// Outil générique : il ne connaît pas les cartes. Il renvoie les nouveaux points, et le DÉPLACEMENT de chaque point
// (pour déplacer aussi ce qui est posé près de lui).

window.Circuit = window.Circuit || {};

Circuit.Etirer = (function () {
  // points : [[x, z, h, sorte], …] ; facteur : 3 ; fixe : (sorte) → vrai si le morceau qui part de ce point ne s'étire pas.
  function points(liste, facteur, fixe, ferme) {
    const n = liste.length, morceaux = ferme ? n : n - 1;
    const pas = [];
    let ex = 0, ez = 0, total = 0;
    for (let i = 0; i < morceaux; i++) {
      const a = liste[i], b = liste[(i + 1) % n];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const fige = fixe(a[3] || "route");
      const f = fige ? 1 : facteur;
      pas.push({ dx: dx * f, dz: dz * f, fige, l: Math.hypot(dx, dz) * f });
      ex += dx * f;
      ez += dz * f;
      if (!fige) total += Math.hypot(dx, dz) * f;
    }
    // La boucle doit se refermer : on retire l'écart (ex, ez) aux morceaux étirés.
    if (ferme && total > 0) for (const p of pas) if (!p.fige) { p.dx -= (ex * p.l) / total; p.dz -= (ez * p.l) / total; }
    const nouveaux = [liste[0].slice()];
    for (let i = 1; i < n; i++) {
      const avant = nouveaux[i - 1];
      const point = liste[i].slice();
      point[0] = Math.round((avant[0] + pas[i - 1].dx) * 100) / 100;
      point[1] = Math.round((avant[1] + pas[i - 1].dz) * 100) / 100;
      nouveaux.push(point);
    }
    const deplacements = liste.map((p, i) => [nouveaux[i][0] - p[0], nouveaux[i][1] - p[1]]);
    return { points: nouveaux, deplacements };
  }

  // Le déplacement du point d'origine le plus proche de (x, z).
  function deplacementPres(liste, deplacements, x, z) {
    let mieux = 0, d = Infinity;
    liste.forEach((p, i) => {
      const e = Math.hypot(p[0] - x, p[1] - z);
      if (e < d) { d = e; mieux = i; }
    });
    return deplacements[mieux];
  }

  return { points, deplacementPres };
})();
