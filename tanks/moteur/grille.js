// 🗂️ LE QUADRILLAGE : les cases d'un cahier à carreaux (étape 72)
//
// Pour savoir « qu'est-ce qui est près de moi ? », la façon simple, c'est de regarder TOUT (les 400 arbres, les 150
// murs…) et de calculer la distance à chacun. Si 60 soldats et 8 tanks le font 120 fois par seconde, ça fait des
// millions de calculs : le jeu rame.
// L'astuce : on découpe la carte en CASES (comme un cahier à carreaux) et on range chaque objet dans sa case. Pour
// trouver ce qui est près de toi, on ouvre seulement ta case et ses voisines : une dizaine d'objets au lieu de 400.
// Ce fichier est un outil : il ne connaît ni les arbres ni les tanks, juste des objets posés en (x, z).

window.Tanks = window.Tanks || {};

Tanks.Grille = (function () {
  // Un quadrillage carré de « cote » mètres de côté (centré sur 0), en cases de « taille » mètres.
  function creer(cote, taille) {
    const n = Math.max(1, Math.ceil(cote / taille));
    const cases = [];
    for (let i = 0; i < n * n; i++) cases.push([]);
    return { n, taille, demi: cote / 2, cases, remplies: [], objets: 0, etales: false };
  }
  // Le numéro de colonne (ou de ligne) d'une coordonnée (on reste dans le cahier, même tout au bord).
  const colonne = (g, x) => Math.max(0, Math.min(g.n - 1, Math.floor((x + g.demi) / g.taille)));

  // Ranger un objet : dans toutes les cases que touche le carré de « rayon » autour de (x, z).
  function ajouter(g, objet, x, z, rayon) {
    const r = rayon || 0;
    const i0 = colonne(g, x - r), i1 = colonne(g, x + r), j0 = colonne(g, z - r), j1 = colonne(g, z + r);
    if (i0 !== i1 || j0 !== j1) g.etales = true; // (un objet rangé dans plusieurs cases : il faudra éviter les doublons)
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const c = g.cases[j * g.n + i];
        if (!c.length) g.remplies.push(c);
        c.push(objet);
      }
    }
    g.objets++;
  }
  // Tout enlever (pour les objets qui bougent : on refait le rangement à chaque pas ; on ne vide que les cases remplies).
  function vider(g) {
    for (const c of g.remplies) c.length = 0;
    g.remplies.length = 0;
    g.objets = 0;
    g.etales = false;
  }
  // Mettre dans « sortie » (une liste qu'on réutilise, pour ne pas en fabriquer une nouvelle à chaque fois) les objets
  // rangés dans les cases que touche le carré de « rayon » autour de (x, z). Un objet rangé dans plusieurs cases n'y
  // est mis qu'une fois. (Ce sont les objets PROCHES : il faut encore vérifier la vraie distance.)
  function chercher(g, x, z, rayon, sortie) {
    sortie.length = 0;
    const i0 = colonne(g, x - rayon), i1 = colonne(g, x + rayon), j0 = colonne(g, z - rayon), j1 = colonne(g, z + rayon);
    const plusieurs = g.etales && (i0 !== i1 || j0 !== j1);
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const c = g.cases[j * g.n + i];
        for (let k = 0; k < c.length; k++) if (!plusieurs || sortie.indexOf(c[k]) < 0) sortie.push(c[k]);
      }
    }
    return sortie;
  }

  return { creer, ajouter, vider, chercher };
})();
