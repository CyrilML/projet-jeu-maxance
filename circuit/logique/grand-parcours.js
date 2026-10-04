// 🛣️ LE GRAND PARCOURS : le circuit Carrera
//
// Étape 40. ✍️ Une grande route qui fait une boucle, comme un circuit de petites voitures Carrera :
// elle monte, elle descend, elle passe sur des ponts (et même au-dessus d'elle-même !).
// Sur le chemin : une GRANDE RAMPE qui monte à 14 m, une PLATEFORME avec des trous et des bosses,
// une plateforme plate, une longue ligne droite avec des NITROS, et un CREUX à sauter.
//
// Comment fabriquer une route qui tourne en douceur avec seulement une liste de points ?
//   1. On relie les points par une COURBE (une « spline de Catmull-Rom ») : elle passe par chaque point
//      sans faire d'angle. Pour la hauteur, on va tout droit d'un point à l'autre (une pente régulière).
//   2. On découpe la courbe en petits morceaux de 3 m : les ÉCHANTILLONS.
//   3. Entre deux échantillons, la route est un petit rectangle (un « tronçon ») de 14 m de large.
//
// Comme au parcours (logique/parcours.js), le terrain sait dire la HAUTEUR DU SOL sous un point.
// Mais ici il y a des étages : sous un pont, le sol c'est la route d'en bas ! On garde donc le sol le
// plus haut qui soit SOUS la voiture (pas plus de 0,7 m au-dessus d'elle : sinon c'est un pont, ou un mur).
//
// Pas de barrières sur les bords : ✍️ si tu tombes (d'un pont, dans un trou, dans le creux)… tu tombes en bas !
// Ce fichier ne dessine rien : c'est affichage/decor-grand-parcours.js qui dessine ce terrain.

window.Circuit = window.Circuit || {};

Circuit.GrandParcours = (function () {
  const C = Circuit.CONFIG;
  const G = C.grandParcours;
  const MARCHE = C.parcours.marche;
  const PAS = 3; // m : la longueur d'un tronçon
  const RECOUVREMENT = 0.6; // m : les tronçons voisins se chevauchent un peu (sinon il y aurait des fentes dans les virages)
  const demiLargeur = G.largeur / 2;
  const points = G.points;
  const n = points.length;

  // Un point de la courbe de Catmull-Rom, entre les points i et i + 1 (t de 0 à 1).
  // C'est la version « centripète » : les points sont espacés selon la racine de leur distance. Ainsi la courbe
  // ne fait jamais de boucle ni de retour en arrière, même quand un point est tout près du suivant (le tremplin !).
  function courbe(i, t) {
    const P = [points[(i - 1 + n) % n], points[i], points[(i + 1) % n], points[(i + 2) % n]];
    const k = [0];
    for (let j = 1; j < 4; j++) k.push(k[j - 1] + Math.max(0.01, Math.sqrt(Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]))));
    const u = k[1] + (k[2] - k[1]) * t;
    const melange = (a, b, ka, kb) => [((kb - u) * a[0] + (u - ka) * b[0]) / (kb - ka), ((kb - u) * a[1] + (u - ka) * b[1]) / (kb - ka)];
    const A1 = melange(P[0], P[1], k[0], k[1]), A2 = melange(P[1], P[2], k[1], k[2]), A3 = melange(P[2], P[3], k[2], k[3]);
    const B1 = melange(A1, A2, k[0], k[2]), B2 = melange(A2, A3, k[1], k[3]);
    const R = melange(B1, B2, k[1], k[2]);
    return {
      x: R[0],
      z: R[1],
      y: P[1][2] + (P[2][2] - P[1][2]) * t, // la hauteur : en ligne droite d'un point à l'autre
    };
  }

  // Ce qu'il y a sur le morceau qui part du point i : "route", "tremplin", "plateforme" ou "vide".
  const sorte = (i) => points[i][3] || "route";
  const estRoute = (s) => s === "route" || s === "tremplin";

  // 1 et 2. Les échantillons, tous les 3 m environ.
  const echantillons = [];
  let distance = 0;
  for (let i = 0; i < n; i++) {
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

  // 3. Les tronçons : un petit rectangle de route entre deux échantillons qui se suivent.
  const troncons = echantillons.map((a, k) => {
    const b = echantillons[(k + 1) % echantillons.length];
    const longueur = Math.hypot(b.x - a.x, b.z - a.z);
    a.s = distance;
    distance += longueur;
    const ux = (b.x - a.x) / longueur, uz = (b.z - a.z) / longueur;
    return { numero: k, ax: a.x, az: a.z, ya: a.y, yb: b.y, ux, uz, longueur, sorte: a.sorte, morceau: a.morceau,
      x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, angle: Math.atan2(uz, ux), route: estRoute(a.sorte) };
  });
  troncons.forEach((t, k) => {
    t.avantRoute = troncons[(k - 1 + troncons.length) % troncons.length].route;
    t.apresRoute = troncons[(k + 1) % troncons.length].route;
  });
  const longueurTour = distance;
  const routes = troncons.filter((t) => t.route);

  // Le point (x, z) vu depuis un tronçon : u le long de la route (depuis son début), w en travers.
  function local(t, x, z) {
    const dx = x - t.ax, dz = z - t.az;
    return { u: dx * t.ux + dz * t.uz, w: -dx * t.uz + dz * t.ux };
  }
  const hauteurTroncon = (t, u) => t.ya + (t.yb - t.ya) * Math.max(0, Math.min(1, u / t.longueur));
  const loin = (t, x, z, marge) => Math.abs(x - t.x) > t.longueur / 2 + marge || Math.abs(z - t.z) > t.longueur / 2 + marge;

  // Le CREUX : un grand trou dans le sol, avec des bords en pente (on peut en ressortir en roulant).
  const K = G.creux;
  function solDeBase(x, z) {
    const bordX = K.longueur / 2 - Math.abs(x - K.x), bordZ = K.largeur / 2 - Math.abs(z - K.z);
    if (bordX <= 0 || bordZ <= 0) return 0;
    return -K.profondeur * Math.min(1, Math.min(bordX, bordZ) / K.pente);
  }

  // Les plateformes : un rectangle à la hauteur y, moins les trous, plus les bosses.
  const plateformes = G.plateformes.map((p) => Object.assign({ demiLongueur: p.longueur / 2, demiLargeur: p.largeur / 2, angle: 0 }, p));
  const dansRectangle = (r, x, z) => Math.abs(x - r.x) <= r.longueur / 2 && Math.abs(z - r.z) <= r.largeur / 2;
  function dessusPlateforme(p, x, z) {
    if (!dansRectangle(p, x, z)) return null;
    for (const trou of p.trous) if (dansRectangle(trou, x, z)) return "trou";
    let h = p.y;
    for (const b of p.bosses) {
      const d = Math.hypot(x - b.x, z - b.z);
      if (d < G.bosse.rayon) h += G.bosse.hauteur * 0.5 * (1 + Math.cos((Math.PI * d) / G.bosse.rayon));
    }
    return h;
  }

  // Sur quoi roule-t-on en (x, z), pour une voiture à la hauteur y ? Renvoie { h, quoi }.
  function sous(x, z, y) {
    const base = solDeBase(x, z);
    let meilleur = { h: base, quoi: base < -0.5 ? "le creux" : "l'herbe" };
    for (const t of routes) {
      if (loin(t, x, z, demiLargeur + 1)) continue;
      const l = local(t, x, z);
      if (Math.abs(l.w) > demiLargeur) continue;
      if (l.u < (t.avantRoute ? -RECOUVREMENT : 0) || l.u > t.longueur + (t.apresRoute ? RECOUVREMENT : 0)) continue;
      const h = hauteurTroncon(t, l.u);
      if (h <= y + MARCHE && h > meilleur.h) meilleur = { h, quoi: t.sorte === "tremplin" ? "le tremplin" : h > 0.5 ? "la route (en hauteur)" : "la route", troncon: t.numero };
    }
    for (const p of plateformes) {
      const h = dessusPlateforme(p, x, z);
      if (h === "trou") {
        if (p.y <= y + MARCHE && meilleur.h < p.y - 1) meilleur = Object.assign({}, meilleur, { quoi: "un TROU de la " + p.nom });
        continue;
      }
      if (h !== null && h <= y + MARCHE && h > meilleur.h) meilleur = { h, quoi: h > p.y + 0.05 ? "une bosse" : "la " + p.nom };
    }
    return meilleur;
  }

  function hauteurSol(x, z, y) {
    return sous(x, z, y).h;
  }

  // Les piliers sous les ponts et sous les plateformes (ils tiennent la route… et on se cogne dedans).
  const piliers = [];
  function ajouterPilier(x, z, haut) {
    const bas = solDeBase(x, z);
    if (haut - bas < 3) return;
    // Pas de pilier sur une route plus basse (sous un pont qui la croise).
    for (const t of routes) {
      if (loin(t, x, z, demiLargeur + 3)) continue;
      const l = local(t, x, z);
      if (Math.abs(l.w) < demiLargeur + 2 && l.u > -2 && l.u < t.longueur + 2 && hauteurTroncon(t, l.u) < haut - 3) return;
    }
    piliers.push({ x, z, bas, haut, angle: 0, demiLongueur: 0.6, demiLargeur: 0.6 });
  }
  routes.forEach((t, k) => {
    if (k % 8 !== 0 || t.ya < 4) return;
    for (const cote of [-1, 1]) ajouterPilier(t.ax - t.uz * cote * (demiLargeur - 1.5), t.az + t.ux * cote * (demiLargeur - 1.5), t.ya - G.epaisseur);
  });
  for (const p of plateformes) {
    for (const fx of [-1, 0, 1]) for (const fz of [-1, 1]) {
      const x = p.x + fx * (p.demiLongueur - 3), z = p.z + fz * (p.demiLargeur - 3);
      if (!p.trous.some((trou) => dansRectangle(trou, x, z))) ajouterPilier(x, z, p.y - 1.5);
    }
  }

  // Les MURS : le côté des routes en hauteur, le bout d'une route (devant le creux !), le côté des
  // plateformes, les bords des trous et les piliers. Seulement s'ils sont à la hauteur de la voiture. Renvoie la plus grande vitesse de choc.
  function murs(v, rayon) {
    const y = v.y || 0;
    const bloque = (haut, bas) => haut > y + MARCHE && bas < y + G.hauteurVoiture;
    let pire = 0;
    for (const t of routes) {
      if (loin(t, v.x, v.z, demiLargeur + 4)) continue;
      const l = local(t, v.x, v.z);
      let h;
      if (Math.abs(l.w) <= demiLargeur) {
        // La voiture est en face de la route : seulement le BOUT d'une route (là où elle commence, après le vide).
        if (l.u < 0 && !t.avantRoute) h = t.ya;
        else if (l.u > t.longueur && !t.apresRoute) h = t.yb;
        else continue;
      } else {
        h = hauteurTroncon(t, l.u); // le côté de la route
      }
      // Une rampe près du sol est pleine jusqu'en bas ; plus haut, c'est un pont (épais de 1 m) : on passe dessous.
      const bas = h - G.epaisseur < G.hauteurVoiture ? solDeBase(t.x, t.z) : h - G.epaisseur;
      if (!bloque(h, bas)) continue;
      const boite = { x: t.x, z: t.z, angle: t.angle, demiLongueur: t.longueur / 2 + RECOUVREMENT, demiLargeur };
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, boite, rayon));
    }
    for (const p of plateformes) {
      if (dansRectangle(p, v.x, v.z) || !bloque(p.y, p.y - 1.5)) continue;
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, p, rayon));
    }
    // Tombé dans un TROU d'une plateforme : ses 4 bords sont des murs (on ne traverse pas le béton).
    for (const p of plateformes) {
      if (!bloque(p.y, p.y - 1.5)) continue;
      for (const trou of p.trous) {
        if (!dansRectangle(trou, v.x, v.z)) continue;
        for (const [axe, demi, centre] of [["x", trou.longueur / 2 - rayon, trou.x], ["z", trou.largeur / 2 - rayon, trou.z]]) {
          const d = v[axe] - centre;
          if (Math.abs(d) <= demi) continue;
          v[axe] = centre + Math.sign(d) * demi;
          pire = Math.max(pire, Math.abs(v.vitesse * (axe === "x" ? Math.cos(v.angle) : Math.sin(v.angle))));
        }
      }
    }
    for (const p of piliers) {
      if (Math.abs(v.x - p.x) > 4 || Math.abs(v.z - p.z) > 4 || !bloque(p.haut, p.bas)) continue;
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, p, rayon));
    }
    return pire;
  }

  // Un point de la route, au milieu, sur le morceau i (f de 0 à 1), avec sa direction.
  function pointSurLaRoute(i, f) {
    const p = courbe(i, f), q = courbe(i, Math.min(1, f + 0.01)), r = courbe(i, Math.max(0, f - 0.01));
    const angle = Math.atan2(q.z - r.z, q.x - r.x);
    return { x: p.x, z: p.z, y: p.y, angle, cos: Math.cos(angle), sin: Math.sin(angle) };
  }

  // ✍️ Les plaques de NITRO.
  const nitros = G.nitros.map(([i, f], numero) => Object.assign({ numero, demiLongueur: G.longueurNitro / 2, demiLargeur: G.largeurNitro / 2 }, pointSurLaRoute(i, f)));

  // Sur quelle plaque de nitro roule la voiture ? (−1 = aucune)
  function plaqueSous(v) {
    for (const p of nitros) {
      const dx = v.x - p.x, dz = v.z - p.z;
      const u = dx * p.cos + dz * p.sin, w = -dx * p.sin + dz * p.cos;
      if (Math.abs(u) <= p.demiLongueur && Math.abs(w) <= p.demiLargeur && Math.abs((v.y || 0) - p.y) < 1) return p.numero;
    }
    return -1;
  }

  // Le saut du creux : les deux bords de la route (le tremplin, puis l'arrivée).
  const iVide = points.findIndex((p) => p[3] === "vide");
  const saut = { depart: pointSurLaRoute(iVide, 0), arrivee: pointSurLaRoute((iVide + 1) % n, 0) };
  saut.longueur = Math.hypot(saut.arrivee.x - saut.depart.x, saut.arrivee.z - saut.depart.z);

  // ✍️ Des pièces partout : le long de la route, au-dessus du creux (il faut les attraper en l'air !),
  // sur les plateformes, et quelques-unes au fond du creux pour se consoler.
  function placerPieces() {
    const pieces = [];
    const ajouter = (x, y, z, ou) => pieces.push({ numero: pieces.length + 1, x, y, z, ou, prise: false });
    let prochaine = 20, k = 0;
    for (const t of troncons) {
      if (!t.route || echantillons[t.numero].s < prochaine) continue;
      prochaine += G.ecartPieces;
      const w = [-4, 0, 4][k++ % 3];
      ajouter(t.ax - t.uz * w, t.ya + 1.2, t.az + t.ux * w, t.ya > 0.5 ? "route en hauteur" : "route");
    }
    // L'arc au-dessus du creux : la trajectoire d'une voiture qui saute à 180 km/h.
    const d = saut.depart;
    const pente = (d.y - points[(iVide - 1 + n) % n][2]) / Math.hypot(d.x - points[(iVide - 1 + n) % n][0], d.z - points[(iVide - 1 + n) % n][1]);
    for (const f of [0.15, 0.35, 0.55, 0.75]) {
      const x = f * saut.longueur, temps = x / 50;
      ajouter(d.x + d.cos * x, d.y + pente * 50 * temps - 0.5 * C.parcours.gravite * temps * temps + 1, d.z + d.sin * x, "au-dessus du creux");
    }
    const A = plateformes[0], B = plateformes[1];
    for (const [x, z] of [[-178, -160], [-178, -120], [-200, -150], [-213, -125], [-236, -140]]) ajouter(x, A.y + 1.2, z, A.nom);
    for (const [dx, dz] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) ajouter(B.x + dx, B.y + 1.2, B.z + dz, B.nom);
    for (const dx of [-35, 0, 35]) ajouter(K.x + dx, -K.profondeur + 1.2, K.z, "au fond du creux");
    return pieces;
  }

  return {
    points, echantillons, troncons, routes, plateformes, piliers, nitros, saut, longueurTour,
    loopings: [], // pas de looping ici (les règles de la balade les cherchent)
    depart: { x: 0, z: 0, angle: 0 },
    limite: G.taille / 2 - 3,
    largeur: G.largeur,
    creux: K,
    solDeBase, sous, hauteurSol, murs, plaqueSous, placerPieces, pointSurLaRoute, dessusPlateforme,
    placerCartons: () => [],
  };
})();
