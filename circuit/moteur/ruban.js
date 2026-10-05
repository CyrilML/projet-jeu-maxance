// 🎀 LE RUBAN : la règle souple du traceur de routes
//
// Étape 41. Un outil générique (il ne connaît aucune règle du jeu) : on lui donne une liste de points
// [x, z, hauteur, sorte] et il fabrique une ROUTE qui passe par tous ces points en tournant en douceur.
// Il sert au grand parcours (étape 40, une route en boucle) et aux méga-rampes (étape 41, une route qui
// va d'un départ à une arrivée).
//
//   1. On relie les points par une COURBE (une « spline de Catmull-Rom centripète ») : elle passe par
//      chaque point sans faire d'angle. Pour la hauteur, on va tout droit d'un point à l'autre.
//   2. On découpe la courbe en petits morceaux de 3 m : les ÉCHANTILLONS (chacun sait à quelle distance
//      du départ il est : s, en mètres).
//   3. Entre deux échantillons, la route est un petit rectangle : un TRONÇON.
//
// La « sorte » d'un point dit ce qu'il y a jusqu'au point suivant : "route", "tremplin" (on roule dessus),
// ou autre chose ("vide", "plateforme"…) : là, pas de route.

window.Circuit = window.Circuit || {};

Circuit.Ruban = (function () {
  const PAS = 3; // m : la longueur d'un tronçon
  const RECOUVREMENT = 0.6; // m : les tronçons voisins se chevauchent un peu (sinon il y aurait des fentes dans les virages)
  const estRoute = (s) => s === "route" || s === "tremplin";

  // reglages : { ferme (la route fait une boucle ?), largeur (m) }
  function creer(points, reglages) {
    const ferme = !!reglages.ferme;
    const demiLargeur = reglages.largeur / 2;
    const n = points.length;
    const nombreMorceaux = ferme ? n : n - 1;

    // Le point numéro i (pour une route ouverte, on invente un point avant le début et après la fin).
    function pt(i) {
      if (ferme) return points[((i % n) + n) % n];
      if (i < 0) return [2 * points[0][0] - points[1][0], 2 * points[0][1] - points[1][1], points[0][2]];
      if (i >= n) return [2 * points[n - 1][0] - points[n - 2][0], 2 * points[n - 1][1] - points[n - 2][1], points[n - 1][2]];
      return points[i];
    }

    // Un point de la courbe entre les points i et i + 1 (t de 0 à 1). Version « centripète » : les points sont
    // espacés selon la racine de leur distance, pour que la courbe ne fasse jamais de boucle ni de retour en arrière.
    function courbe(i, t) {
      const P = [pt(i - 1), pt(i), pt(i + 1), pt(i + 2)];
      const k = [0];
      for (let j = 1; j < 4; j++) k.push(k[j - 1] + Math.max(0.01, Math.sqrt(Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]))));
      const u = k[1] + (k[2] - k[1]) * t;
      const melange = (a, b, ka, kb) => [((kb - u) * a[0] + (u - ka) * b[0]) / (kb - ka), ((kb - u) * a[1] + (u - ka) * b[1]) / (kb - ka)];
      const A1 = melange(P[0], P[1], k[0], k[1]), A2 = melange(P[1], P[2], k[1], k[2]), A3 = melange(P[2], P[3], k[2], k[3]);
      const B1 = melange(A1, A2, k[0], k[2]), B2 = melange(A2, A3, k[1], k[3]);
      const R = melange(B1, B2, k[1], k[2]);
      return { x: R[0], z: R[1], y: P[1][2] + (P[2][2] - P[1][2]) * t };
    }
    const sorte = (i) => pt(i)[3] || "route";

    // Les échantillons, tous les 3 m environ.
    const echantillons = [];
    for (let i = 0; i < nombreMorceaux; i++) {
      let longueur = 0, avant = courbe(i, 0);
      for (let k = 1; k <= 20; k++) {
        const p = courbe(i, k / 20);
        longueur += Math.hypot(p.x - avant.x, p.z - avant.z);
        avant = p;
      }
      const morceaux = Math.max(2, Math.round(longueur / PAS));
      for (let k = 0; k < morceaux; k++) {
        const p = courbe(i, k / morceaux);
        echantillons.push({ x: p.x, z: p.z, y: p.y, morceau: i, sorte: sorte(i), s: 0 });
      }
    }
    if (!ferme) {
      const fin = points[n - 1];
      echantillons.push({ x: fin[0], z: fin[1], y: fin[2], morceau: n - 1, sorte: "fin", s: 0 });
    }

    // Les tronçons : un petit rectangle de route entre deux échantillons qui se suivent.
    let distance = 0;
    const nombreTroncons = ferme ? echantillons.length : echantillons.length - 1;
    const troncons = [];
    for (let k = 0; k < nombreTroncons; k++) {
      const a = echantillons[k], b = echantillons[(k + 1) % echantillons.length];
      const longueur = Math.hypot(b.x - a.x, b.z - a.z);
      a.s = distance;
      distance += longueur;
      const ux = (b.x - a.x) / longueur, uz = (b.z - a.z) / longueur;
      troncons.push({ numero: k, ax: a.x, az: a.z, ya: a.y, yb: b.y, ux, uz, longueur, sorte: a.sorte, morceau: a.morceau,
        x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, angle: Math.atan2(uz, ux), route: estRoute(a.sorte) });
    }
    if (!ferme) echantillons[echantillons.length - 1].s = distance;
    troncons.forEach((t, k) => {
      const avant = ferme ? troncons[(k - 1 + nombreTroncons) % nombreTroncons] : troncons[k - 1];
      const apres = ferme ? troncons[(k + 1) % nombreTroncons] : troncons[k + 1];
      t.avantRoute = !!(avant && avant.route);
      t.apresRoute = !!(apres && apres.route);
    });
    const routes = troncons.filter((t) => t.route);

    // Le point (x, z) vu depuis un tronçon : u le long de la route (depuis son début), w en travers.
    function local(t, x, z) {
      const dx = x - t.ax, dz = z - t.az;
      return { u: dx * t.ux + dz * t.uz, w: -dx * t.uz + dz * t.ux };
    }
    const hauteurTroncon = (t, u) => t.ya + (t.yb - t.ya) * Math.max(0, Math.min(1, u / t.longueur));
    const loin = (t, x, z, marge) => Math.abs(x - t.x) > t.longueur / 2 + marge || Math.abs(z - t.z) > t.longueur / 2 + marge;
    const dansLaLongueur = (t, u) => u >= (t.avantRoute ? -RECOUVREMENT : 0) && u <= t.longueur + (t.apresRoute ? RECOUVREMENT : 0);

    // La route la plus haute sous (x, z), mais pas plus de `marche` m au-dessus de y. null s'il n'y en a pas.
    function routeSous(x, z, y, marche) {
      let meilleure = null;
      for (const t of routes) {
        if (loin(t, x, z, demiLargeur + 1)) continue;
        const l = local(t, x, z);
        if (Math.abs(l.w) > demiLargeur || !dansLaLongueur(t, l.u)) continue;
        // (Étape 46 : dans la petite zone où deux tronçons se chevauchent, on PROLONGE la pente du tronçon au lieu
        // de la couper net. Avant, la route semblait plate sur 60 cm à chaque bout de tronçon, puis remontait d'un
        // coup : 10 petits à-coups par seconde dans les montées et les descentes, la voiture tremblait !)
        const h = t.ya + ((t.yb - t.ya) * l.u) / t.longueur;
        if (h <= y + marche && (!meilleure || h > meilleure.h)) meilleure = { h, troncon: t.numero, sorte: t.sorte, w: l.w };
      }
      return meilleure;
    }

    // Un point de la route, au milieu, sur le morceau i (f de 0 à 1), avec sa direction.
    function pointSurLaRoute(i, f) {
      const p = courbe(i, f), q = courbe(i, Math.min(1, f + 0.01)), r = courbe(i, Math.max(0, f - 0.01));
      const angle = Math.atan2(q.z - r.z, q.x - r.x);
      return { x: p.x, z: p.z, y: p.y, angle, cos: Math.cos(angle), sin: Math.sin(angle) };
    }

    // Le point à `s` mètres du départ, décalé de `w` m sur le côté (pour les véhicules qui suivent la route).
    function pointAuMetre(s, w) {
      let k = 0;
      while (k < troncons.length - 1 && echantillons[k + 1].s <= s) k++;
      const t = troncons[k];
      const u = Math.max(0, Math.min(t.longueur, s - echantillons[k].s));
      return { x: t.ax + t.ux * u - t.uz * (w || 0), z: t.az + t.uz * u + t.ux * (w || 0), y: hauteurTroncon(t, u), angle: t.angle,
        pente: (t.yb - t.ya) / t.longueur, troncon: k };
    }

    // Des plaques posées sur la route : [[morceau, f], …] → leur position, leur direction et leur taille.
    function plaques(liste, longueur, largeur) {
      return liste.map(([i, f], numero) => Object.assign({ numero, demiLongueur: longueur / 2, demiLargeur: largeur / 2 }, pointSurLaRoute(i, f)));
    }
    // Sur quelle plaque roule la voiture ? (−1 = aucune)
    function plaqueSous(liste, v) {
      for (const p of liste) {
        const dx = v.x - p.x, dz = v.z - p.z;
        const u = dx * p.cos + dz * p.sin, w = -dx * p.sin + dz * p.cos;
        if (Math.abs(u) <= p.demiLongueur && Math.abs(w) <= p.demiLargeur && Math.abs((v.y || 0) - p.y) < 1) return p.numero;
      }
      return -1;
    }

    return {
      points, echantillons, troncons, routes, longueur: distance, demiLargeur, recouvrement: RECOUVREMENT,
      courbe, local, hauteurTroncon, loin, dansLaLongueur, routeSous, pointSurLaRoute, pointAuMetre, plaques, plaqueSous,
    };
  }

  return { creer };
})();
