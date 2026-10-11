// 🗺️ LA CARTE : le terrain sur lequel on construit la ville
//
// Comme pour le village, la carte est inventée à partir d'une GRAINE, avec du « bruit » (un hasard tout doux) :
//   - en dessous de 0,3 : de l'EAU (des lacs et une rivière, où l'on pompe l'eau potable) ;
//   - au-dessus de 0,62 : des ARBRES (on peut construire dessus : les bulldozers les enlèvent, c'est un peu plus cher) ;
//   - entre les deux : de l'HERBE, prête à recevoir des routes et des zones.
// La carte ne change presque jamais (seuls les arbres disparaissent) : c'est le décor de la ville.
//
// Étape 5 (demande de Maxance : « il doit y avoir des arbres, des rivières… ») : une NOUVELLE carte (version 2) :
//   - la MER 🌊 sur un des 4 bords, avec une longue PLAGE 🏖️ de sable (le terrain y vaut plus cher) ;
//   - une grande RIVIÈRE qui descend jusqu'à la mer en serpentant, et un AFFLUENT qui la rejoint ;
//   - des LACS dans les creux ;
//   - de GRANDES FORÊTS avec 3 sortes d'arbres (🌲 sapins, 🌳 chênes, bouleaux), et quelques arbres seuls.
// Une ville commencée avant garde sa carte de la version 1 (sinon ses routes se retrouveraient dans la mer !).

window.Megalopole = window.Megalopole || {};

Megalopole.Carte = (function () {
  const C = Megalopole.CONFIG, H = Megalopole.Hasard;
  const TERRAIN = { herbe: 0, eau: 1, sable: 2 };

  function inventer(graine, version) {
    const k = version === 1 ? inventerV1(graine) : inventerV2(graine);
    k.version = version === 1 ? 1 : 2;
    finir(k);
    return k;
  }
  // Ce qui se calcule à partir du terrain (pas besoin de le sauvegarder) : le rivage (l'eau peu profonde, plus claire),
  // et la sorte de chaque arbre
  function finir(k) {
    const n = k.colonnes, N = n * n;
    k.rivage = new Uint8Array(N); k.espece = new Uint8Array(N); k.mer = k.mer || new Uint8Array(N); k.teinte = new Uint8Array(N);
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
      const i = l * n + c;
      if (k.terrain[i] === TERRAIN.eau) { for (const [dc, dl] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cc = c + dc, ll = l + dl; if (cc >= 0 && ll >= 0 && cc < n && ll < n && k.terrain[ll * n + cc] !== TERRAIN.eau) k.rivage[i] = 1; } }
      const e = H.bruit(k.graine + 4242, c, l, 20); // 0 : chêne 🌳, 1 : sapin 🌲, 2 : bouleau
      k.espece[i] = e > 0.56 ? 1 : e < 0.42 ? 2 : 0;
      const g = H.bruit(k.graine + 1717, c, l, 9); k.teinte[i] = g > 0.58 ? 2 : g < 0.42 ? 0 : 1; // des taches d'herbe plus ou moins vertes
    }
  }
  function inventerV2(graine) {
    const n = C.carte.taille, P = C.carte, terrain = new Uint8Array(n * n), arbre = new Uint8Array(n * n), mer = new Uint8Array(n * n);
    const de = H.creer(graine + 31), cote = de.entier(0, 3); // le bord de la mer : 0 en haut, 1 à droite, 2 en bas, 3 à gauche
    // u : la distance au bord de la mer ; v : la position le long de la côte
    const uv = (c, l) => (cote === 0 ? [l, c] : cote === 1 ? [n - 1 - c, l] : cote === 2 ? [n - 1 - l, c] : [c, l]);
    const cotePos = (v) => P.mer + (H.bruit(graine + 5, v, 0, 20) - 0.5) * 14;
    // les rivières : des points (u, v) espacés d'une demi-case, avec leur largeur
    const points = [];
    const v0 = de.entre(0.3, 0.7) * n, ondule = de.entre(7, 12), phase = de.entre(0, 6), amp = de.entre(6, 11);
    const vRiviere = (u) => v0 + Math.sin(u / ondule + phase) * amp + (H.bruit(graine + 8, u, 0, 16) - 0.5) * 10;
    for (let u = n + 2; u >= 0; u -= 0.5) points.push([u, vRiviere(u), 1.5 + 1.6 * (1 - u / n)]);
    const uS = de.entre(0.6, 0.85) * n, uJ = de.entre(0.3, 0.5) * n, gauche = vRiviere(uJ) > n / 2, vS = gauche ? -2 : n + 1;
    for (let s = 0; s <= 1; s += 0.004) points.push([uS + (uJ - uS) * s + Math.sin(s * Math.PI) * 6, vS + (vRiviere(uJ) - vS) * s + Math.sin(s * Math.PI * 3) * 4, 1.25]);
    for (let l = 0; l < n; l++) for (let c = 0; c < n; c++) {
      const i = l * n + c, [u, v] = uv(c, l), cp = cotePos(v);
      let d = 99, large = 0; // la distance à la rivière la plus proche (moins sa largeur)
      for (const [pu, pv, w] of points) { if (Math.abs(pu - u) > 4 || Math.abs(pv - v) > 4) continue; const e = Math.hypot(pu - u, pv - v) - w; if (e < d) { d = e; large = w; } }
      const h = H.bruit(graine, c, l, 26);
      if (u < cp) { terrain[i] = TERRAIN.eau; mer[i] = 1; }
      else if (u < cp + 2.5 + H.bruit(graine + 6, v, 0, 9) * 2) terrain[i] = TERRAIN.sable; // 🏖️ la plage
      else if (d < 0) terrain[i] = TERRAIN.eau;
      else if (d < 0.8 && H.pourCase(graine + 3, c, l) < 0.55) terrain[i] = TERRAIN.sable; // les berges
      else if (h < P.lacs && u > cp + 8) terrain[i] = TERRAIN.eau; // un lac
      else if (h < P.lacs + 0.02 && u > cp + 8) terrain[i] = TERRAIN.sable;
      else terrain[i] = TERRAIN.herbe;
      if (terrain[i] !== TERRAIN.herbe) continue;
      // 🌳 les forêts : là où le bruit des forêts est haut, presque toutes les cases ont un arbre ; ailleurs, quelques-uns
      const f = H.bruit(graine + 999, c, l, 18), r = H.pourCase(graine + 77, c, l);
      if ((f > P.forets && r < 0.92) || (f > P.forets - 0.05 && r < 0.45) || r < 0.025) arbre[i] = 1;
    }
    return { graine, colonnes: n, lignes: n, terrain, arbre, mer, coteMer: cote };
  }
  // La carte de l'étape 1 (gardée pour les villes commencées avant l'étape 5)
  function inventerV1(graine) {
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
