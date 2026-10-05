// 🏙️ LA VILLE : l'urbaniste
//
// Étape 39. La ville est une GRILLE, comme un damier : des rues droites qui se croisent à angle droit.
//   - 6 rues dans un sens (est-ouest), 6 dans l'autre (nord-sud) → 36 CARREFOURS ;
//   - entre les rues, 5 × 5 PÂTÉS DE MAISONS. Chaque pâté a un trottoir tout autour, et une petite
//     RUELLE en croix qui le coupe en 4. Sur chaque quart, un IMMEUBLE de hauteur tirée au hasard ;
//   - quelques pâtés sont des PARCS : de l'herbe, des arbres et un petit étang.
//
// Pour savoir où est un carrefour, une seule formule : position = début + numéro × (pâté + rue).
// Les immeubles et les arbres sont des « boîtes » solides : on se cogne dedans (moteur/chocs.js).

window.Circuit = window.Circuit || {};

Circuit.Ville = (function () {
  const V = Circuit.CONFIG.ville;
  const n = V.blocs + 1; // le nombre de rues dans chaque sens
  const pas = V.tailleBloc + V.largeurRue;
  const taille = V.blocs * V.tailleBloc + n * V.largeurRue; // la largeur de toute la ville
  const debut = -taille / 2 + V.largeurRue / 2; // le milieu de la première rue

  // La position du milieu de la rue numéro k (de 0 à 5).
  const rue = (k) => debut + k * pas;

  let etat = V.graine;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  const parc = (i, j) => V.parcs.some(([a, b]) => a === i && b === j);

  // Les immeubles et les arbres des parcs (des boîtes solides).
  const immeubles = [];
  const arbres = [];
  const etangs = [];
  for (let i = 0; i < V.blocs; i++) {
    for (let j = 0; j < V.blocs; j++) {
      const x0 = rue(i) + V.largeurRue / 2 + V.trottoir, z0 = rue(j) + V.largeurRue / 2 + V.trottoir;
      const interieur = V.tailleBloc - 2 * V.trottoir; // la partie du pâté sans le trottoir
      if (parc(i, j)) {
        const cx = x0 + interieur / 2, cz = z0 + interieur / 2;
        etangs.push({ x: cx, z: cz, rayon: 9 });
        for (let k = 0; k < 18; k++) {
          const x = x0 + 4 + hasard() * (interieur - 8), z = z0 + 4 + hasard() * (interieur - 8);
          if (Math.hypot(x - cx, z - cz) < 13 || Math.abs(x - cx) < 3 || Math.abs(z - cz) < 3) continue; // pas dans l'étang ni sur les allées
          arbres.push({ x, z, angle: 0, demiLongueur: 0.5, demiLargeur: 0.5, taille: 0.8 + hasard() * 0.6 });
        }
        continue;
      }
      // 4 immeubles, séparés par la ruelle en croix.
      const lot = (interieur - V.ruelle) / 2;
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const marge = 1 + hasard() * 3;
        const largeur = lot - marge * 2, profondeur = lot - marge * 2;
        const hauteur = V.hauteurMin + Math.pow(hasard(), 1.6) * (V.hauteurMax - V.hauteurMin);
        immeubles.push({
          x: x0 + a * (lot + V.ruelle) + lot / 2, z: z0 + b * (lot + V.ruelle) + lot / 2, angle: 0,
          demiLongueur: largeur / 2, demiLargeur: profondeur / 2, hauteur,
          style: Math.floor(hasard() * 4), // la façade : 4 styles différents
        });
      }
    }
  }
  const solides = immeubles.concat(arbres);

  // Pousse une voiture (ou le personnage) hors des immeubles et des arbres. Renvoie la vitesse du choc.
  function murs(v, rayon) {
    let pire = 0;
    for (const b of solides) {
      if (Math.abs(v.x - b.x) > b.demiLongueur + 4 || Math.abs(v.z - b.z) > b.demiLargeur + 4) continue; // trop loin
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, b, rayon));
    }
    return pire;
  }

  // Les carrefours voisins d'un carrefour (pour la circulation).
  function voisins(i, j) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => i + di >= 0 && i + di < n && j + dj >= 0 && j + dj < n);
  }

  // Les voitures garées le long des trottoirs : au milieu d'un côté de rue, sur la voie de droite.
  function placerGarees() {
    const modeles = Circuit.CONFIG.vehiculesVille.concat(Circuit.CONFIG.voitures, Circuit.CONFIG.vehiculesParcours).map((v) => v.modele);
    const garees = [];
    let essais = 0;
    while (garees.length < V.garees && essais < 200) {
      essais++;
      const horizontale = hasard() < 0.5;
      const k = Math.floor(hasard() * n), l = Math.floor(hasard() * V.blocs);
      const sens = hasard() < 0.5 ? 1 : -1;
      const le_long = (rue(l) + rue(l + 1)) / 2 + (hasard() - 0.5) * 30;
      const cote = rue(k) + sens * (V.largeurRue / 2 - 1.5); // collée au trottoir
      const x = horizontale ? le_long : cote, z = horizontale ? cote : le_long;
      if (garees.some((g) => Math.hypot(g.x - x, g.z - z) < 12)) continue;
      if (Math.hypot(x - depart().x, z - depart().z) < 20) continue;
      // Garée dans le sens de la circulation (on roule à droite).
      const angle = horizontale ? (sens > 0 ? 0 : Math.PI) : sens > 0 ? -Math.PI / 2 : Math.PI / 2;
      const modele = hasard() < 0.75 ? modeles[Math.floor(hasard() * 5)] : modeles[Math.floor(hasard() * modeles.length)];
      garees.push({ x, z, angle, modele });
    }
    return garees;
  }

  // ✍️ Des pièces cachées partout : au milieu des ruelles, dans les parcs, sur les rues.
  function placerPieces() {
    const pieces = [];
    const ajouter = (x, z, ou) => pieces.push({ numero: pieces.length + 1, x, y: 1.2, z, ou, prise: false });
    for (let i = 0; i < V.blocs; i++) {
      for (let j = 0; j < V.blocs; j++) {
        const cx = (rue(i) + rue(i + 1)) / 2, cz = (rue(j) + rue(j + 1)) / 2;
        if (parc(i, j)) {
          for (let k = 0; k < 6; k++) ajouter(cx + Math.cos(k) * 18, cz + Math.sin(k) * 18, "parc");
        } else {
          ajouter(cx, cz, "ruelle"); // au croisement de la ruelle
          if (hasard() < 0.5) ajouter(cx + (hasard() < 0.5 ? -1 : 1) * 20, cz, "ruelle");
        }
      }
    }
    while (pieces.length < V.pieces) {
      const k = Math.floor(hasard() * n), l = Math.floor(hasard() * V.blocs);
      const le_long = rue(l) + V.largeurRue / 2 + 8 + hasard() * (V.tailleBloc - 16);
      if (hasard() < 0.5) ajouter(le_long, rue(k), "rue");
      else ajouter(rue(k), le_long, "rue");
    }
    return pieces.slice(0, V.pieces);
  }

  // Le départ : sur la voie de droite d'une rue du milieu, tourné vers l'est (x+).
  function depart() {
    return { x: (rue(2) + rue(3)) / 2, z: rue(3) + V.voie, angle: 0 };
  }

  // Étape 50 : sur quelle rue est-on ? Les rues « est-ouest » sont à z = rue(k), les rues « nord-sud » à x = rue(k).
  // Renvoie le nom de la rue, « le carrefour … » si on est sur les deux, ou null (pas sur une rue).
  function nomDeRue(x, z) {
    if (Math.abs(x) > taille / 2 || Math.abs(z) > taille / 2) return null;
    const proche = (a) => {
      const k = Math.round((a - debut) / pas);
      return k >= 0 && k < n && Math.abs(a - rue(k)) <= V.largeurRue / 2 ? k : -1;
    };
    const kz = proche(z), kx = proche(x);
    const N = V.nomsRues;
    if (kz >= 0 && kx >= 0) return "le carrefour " + N.estOuest[kz] + " / " + N.nordSud[kx];
    if (kz >= 0) return N.estOuest[kz];
    if (kx >= 0) return N.nordSud[kx];
    return null;
  }

  return { n, taille, rue, parc, nomDeRue, immeubles, arbres, etangs, murs, voisins, placerGarees, placerPieces, depart };
})();
