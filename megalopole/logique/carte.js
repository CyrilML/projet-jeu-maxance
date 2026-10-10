// 🗺️ LA CARTE : le terrain sur lequel on construit la ville
//
// Comme pour le village, la carte est inventée à partir d'une GRAINE, avec du « bruit » (un hasard tout doux) :
//   - en dessous de 0,3 : de l'EAU (des lacs et une rivière, où l'on pompe l'eau potable) ;
//   - au-dessus de 0,62 : des ARBRES (on peut construire dessus : les bulldozers les enlèvent, c'est un peu plus cher) ;
//   - entre les deux : de l'HERBE, prête à recevoir des routes et des zones.
// La carte ne change presque jamais (seuls les arbres disparaissent) : c'est le décor de la ville.

window.Megalopole = window.Megalopole || {};

Megalopole.Carte = (function () {
  const C = Megalopole.CONFIG, H = Megalopole.Hasard;
  const TERRAIN = { herbe: 0, eau: 1, sable: 2 };

  function inventer(graine) {
    const n = C.carte.taille, terrain = new Uint8Array(n * n), arbre = new Uint8Array(n * n);
    // une rivière qui traverse la carte en serpentant
    const deRiviere = H.creer(graine + 77), depart = deRiviere.entre(0.25, 0.75) * n, ondule = deRiviere.entre(6, 14), phase = deRiviere.entre(0, 6);
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
      const i = l * n + c;
      let h = H.bruit(graine, c, l, 28);
      // la rivière : une bande qui serpente du haut vers le bas
      const milieu = depart + Math.sin(l / ondule + phase) * 9, d = Math.abs(c - milieu);
      if (d < 2.2) h = Math.min(h, 0.2); else if (d < 3.4) h = Math.min(h, 0.32);
      // les bords de la carte : pas d'eau tout au bord (on y laisse de la place)
      terrain[i] = h < C.carte.eau ? TERRAIN.eau : h < C.carte.eau + 0.025 ? TERRAIN.sable : TERRAIN.herbe;
      if (terrain[i] === TERRAIN.herbe && H.bruit(graine + 999, c, l, 14) > C.carte.arbres) arbre[i] = 1;
    }
    return { graine, colonnes: n, lignes: n, terrain, arbre };
  }

  const dans = (k, c, l) => c >= 0 && l >= 0 && c < k.colonnes && l < k.lignes;
  const constructible = (k, c, l) => dans(k, c, l) && k.terrain[l * k.colonnes + c] !== TERRAIN.eau;
  // Y a-t-il de l'eau à `r` cases au plus ?
  function presDeLEau(k, c, l, r) {
    for (let dl = -r; dl <= r; dl++) for (let dc = -r; dc <= r; dc++) if (dans(k, c + dc, l + dl) && k.terrain[(l + dl) * k.colonnes + c + dc] === TERRAIN.eau) return true;
    return false;
  }

  return { TERRAIN, inventer, dans, constructible, presDeLEau };
})();
