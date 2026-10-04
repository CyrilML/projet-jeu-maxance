// 🗺️ LA PISTE : le plan du circuit
//
// Le circuit le plus simple : un ovale, comme une piste d'athlétisme.
// Deux lignes droites, reliées par deux demi-cercles.
//
// Astuce de géomètre : tous les points du MILIEU de la route sont exactement à la même distance
// (le rayon, 40 m) d'un segment caché au centre du stade, le « squelette » :
//
//        ╭──────────────────────╮
//       │   ●────squelette────●   │    ← chaque point du milieu de la route
//        ╰──────────────────────╯       est à 40 m du squelette
//
// Donc, pour savoir si la voiture est sur la route, il suffit de mesurer sa distance au squelette :
//   distance au milieu de la route = | distance au squelette − 40 |
//   si c'est moins que la moitié de la largeur (7 m) → sur la route, sinon → dans l'herbe.
//
// Ce fichier sait aussi dire « où en est la voiture » sur le tour : la PROGRESSION, en mètres
// depuis la ligne de départ (0 m = sur la ligne ; un tour complet ≈ 491 m).

window.Circuit = window.Circuit || {};

Circuit.Piste = (function () {
  const P = Circuit.CONFIG.piste;
  const L = P.longueurDroite, R = P.rayon;
  const DEMI = L / 2;
  const longueurTour = 2 * L + 2 * Math.PI * R;

  // Le point du milieu de la route, à `s` mètres de la ligne de départ.
  // Renvoie aussi la direction de la route (dx, dz) à cet endroit.
  // La ligne de départ est au milieu de la ligne droite du bas (x = 0, z = +40), et on roule vers x+.
  function pointA(s) {
    let d = (((s + DEMI) % longueurTour) + longueurTour) % longueurTour; // distance depuis le bout gauche de la droite du bas
    if (d < L) return { x: -DEMI + d, z: R, dx: 1, dz: 0 }; // droite du bas, vers x+
    d -= L;
    if (d < Math.PI * R) {
      const t = d / R; // virage de droite, centré en (+60, 0)
      return { x: DEMI + R * Math.sin(t), z: R * Math.cos(t), dx: Math.cos(t), dz: -Math.sin(t) };
    }
    d -= Math.PI * R;
    if (d < L) return { x: DEMI - d, z: -R, dx: -1, dz: 0 }; // droite du haut, vers x−
    d -= L;
    const t = d / R; // virage de gauche, centré en (−60, 0)
    return { x: -DEMI - R * Math.sin(t), z: -R * Math.cos(t), dx: -Math.cos(t), dz: Math.sin(t) };
  }

  // Où est le point (x, z) par rapport au circuit ?
  function reperer(x, z) {
    // Le point le plus proche sur le squelette (le segment de x = −60 à x = +60, en z = 0).
    const sx = Math.max(-DEMI, Math.min(DEMI, x));
    const distanceSquelette = Math.hypot(x - sx, z);
    const ecart = distanceSquelette - R; // > 0 : côté extérieur ; < 0 : côté intérieur

    // La progression sur le tour (en mètres depuis le bout gauche de la droite du bas).
    let d;
    if (x >= -DEMI && x <= DEMI) d = z >= 0 ? x + DEMI : L + Math.PI * R + (DEMI - x);
    else if (x > DEMI) d = L + R * Math.atan2(x - DEMI, z);
    else d = 2 * L + Math.PI * R + R * Math.atan2(-(x + DEMI), -z);
    const s = (((d - DEMI) % longueurTour) + longueurTour) % longueurTour;

    const demiLargeur = P.largeur / 2;
    const absEcart = Math.abs(ecart);
    return {
      s, // progression en mètres depuis la ligne de départ
      ecart, // distance au milieu de la route (positive = vers l'extérieur)
      surLaRoute: absEcart <= demiLargeur,
      surLaBordure: absEcart > demiLargeur && absEcart <= demiLargeur + P.largeurBordure,
      dansLHerbe: absEcart > demiLargeur + P.largeurBordure,
    };
  }

  // Les portes invisibles : la ligne d'arrivée (porte 0) et 3 portes réparties sur le tour.
  // Il faut les passer dans l'ordre pour qu'un tour compte (sinon on pourrait tricher en reculant !).
  const portes = [];
  for (let i = 0; i < Circuit.CONFIG.course.portes; i++) portes.push((i * longueurTour) / Circuit.CONFIG.course.portes);

  return { longueurTour, pointA, reperer, portes };
})();
