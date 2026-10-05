// 🧭 LES CHEMINS : la tache d'encre
//
// Comment un bûcheron trouve-t-il l'arbre le plus proche ? Il fait une RECHERCHE EN LARGEUR :
//   1. il regarde les cases à 1 pas de lui ;
//   2. puis toutes les cases à 2 pas, puis à 3 pas… comme une tache d'encre qui s'étale ;
//   3. la première case qui convient est forcément la plus proche (en nombre de pas) !
// Chaque case retient d'où l'encre est venue : en remontant ces flèches, on retrouve le chemin.
//
// Ce fichier ne connaît pas les arbres ni les bûcherons : on lui dit seulement quelles cases
// on peut traverser, et quelle case on cherche. Il peut servir à tous les métiers.

window.Village = window.Village || {};

Village.Chemins = (function () {
  const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // depart : { colonne, ligne }. Renvoie { chemin: [cases…], visitees } ou { chemin: null, visitees }.
  //   praticable(c, l) : vrai si on peut marcher sur cette case ;
  //   cherche(c, l) : vrai si c'est la case qu'on cherche ;
  //   rayon : on ne s'éloigne pas plus de ce nombre de pas.
  function chercher(colonnes, lignes, depart, praticable, cherche, rayon) {
    const venue = new Map(); // case → case d'où l'on vient
    const distance = new Map();
    const cle = (c, l) => l * colonnes + c;
    const d0 = cle(depart.colonne, depart.ligne);
    let file = [d0];
    venue.set(d0, -1);
    distance.set(d0, 0);
    while (file.length) {
      const suivante = [];
      for (const i of file) {
        const c = i % colonnes, l = Math.floor(i / colonnes);
        if (i !== d0 && cherche(c, l)) return { chemin: remonter(venue, i, colonnes), visitees: venue.size };
        if (distance.get(i) >= rayon) continue;
        for (const [dc, dl] of VOISINS) {
          const nc = c + dc, nl = l + dl;
          if (nc < 0 || nl < 0 || nc >= colonnes || nl >= lignes) continue;
          const j = cle(nc, nl);
          if (venue.has(j)) continue;
          // On peut « entrer » dans la case cherchée même si on ne peut pas marcher dessus (un arbre au bord de l'eau…).
          if (!praticable(nc, nl) && !cherche(nc, nl)) continue;
          venue.set(j, i);
          distance.set(j, distance.get(i) + 1);
          suivante.push(j);
        }
      }
      file = suivante;
    }
    return { chemin: null, visitees: venue.size };
  }

  function remonter(venue, i, colonnes) {
    const chemin = [];
    while (i !== -1) {
      chemin.push({ colonne: i % colonnes, ligne: Math.floor(i / colonnes) });
      i = venue.get(i);
    }
    return chemin.reverse(); // de la cabane jusqu'à la case trouvée
  }

  return { chercher };
})();
