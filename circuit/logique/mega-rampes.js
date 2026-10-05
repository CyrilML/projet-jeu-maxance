// ☁️ LES MÉGA-RAMPES : la piste dans le ciel
//
// Étape 41. ✍️ Une piste en bois, toute seule au-dessus des nuages, comme dans les jeux de « méga-rampes ».
// Elle est fabriquée par le ruban (moteur/ruban.js), comme le grand parcours, mais :
//   - elle ne fait pas de boucle : elle va du DÉPART à l'ARRIVÉE ;
//   - ✍️ elle a des BORDS RELEVÉS des deux côtés (comme un toboggan) : on ne tombe pas sur le côté,
//     on glisse contre le bord. On ne peut tomber qu'aux SAUTS (là où la piste s'arrête : "vide") ;
//   - sous la piste, il n'y a rien : seulement les nuages. Celui qui tombe… tombe, et les règles de
//     logique/rampes.js le ramènent au dernier drapeau.
//
// Ce fichier est le TERRAIN (où est le sol, où sont les murs). Les règles de la course (chrono, drapeaux,
// dégâts, véhicules à doubler) sont dans logique/rampes.js. Il ne dessine rien : c'est affichage/decor-rampes.js.

window.Circuit = window.Circuit || {};

Circuit.MegaRampes = (function () {
  const C = Circuit.CONFIG;
  const M = C.rampes;
  const MARCHE = C.parcours.marche;
  const R = Circuit.Ruban.creer(M.points, { ferme: false, largeur: M.largeur });
  const { points, echantillons, troncons, routes } = R;
  const VIDE = -100000; // la hauteur du « sol » quand il n'y a pas de piste : aucun !

  // Sur quoi roule-t-on ? La piste… ou rien du tout.
  function sous(x, z, y) {
    const route = R.routeSous(x, z, y, MARCHE);
    if (!route) return { h: VIDE, quoi: "le vide (les nuages)" };
    return { h: route.h, quoi: route.sorte === "tremplin" ? "le tremplin" : "la piste", troncon: route.troncon };
  }
  const hauteurSol = (x, z, y) => sous(x, z, y).h;

  // Les MURS.
  //   - Les bords relevés : la voiture GLISSE contre eux (on la remet sur la piste et on la tourne un peu dans
  //     le sens de la piste). Seul un choc franc (plus de 8 m/s vers le bord) compte comme un choc (à moitié).
  //   - Le bout de la piste après un saut : si on arrive trop bas, on se cogne dedans (et on tombe).
  // Renvoie la plus grande vitesse de choc. (`glisse: true` dit à la balade de ne pas faire rebondir la voiture.)
  function murs(v, rayon) {
    const y = v.y || 0;
    let pire = 0;
    for (const t of routes) {
      if (R.loin(t, v.x, v.z, R.demiLargeur + 4)) continue;
      const l = R.local(t, v.x, v.z);
      const h = R.hauteurTroncon(t, l.u);
      if (R.dansLaLongueur(t, l.u)) {
        // Le bord relevé : seulement si la voiture roule sur CETTE piste (pas au-dessus, pas en dessous).
        if (y < h - 1 || y > h + M.bord || Math.abs(l.w) < R.demiLargeur - rayon || Math.abs(l.w) > R.demiLargeur + 3) continue;
        const cote = Math.sign(l.w);
        const nx = -t.uz * cote, nz = t.ux * cote; // la direction « vers le bord »
        v.x -= nx * (Math.abs(l.w) - (R.demiLargeur - rayon));
        v.z -= nz * (Math.abs(l.w) - (R.demiLargeur - rayon));
        const versLeBord = v.vitesse * (Math.cos(v.angle) * nx + Math.sin(v.angle) * nz);
        if (versLeBord > 0) {
          // On glisse : la voiture se tourne un peu dans le sens de la piste et perd un peu de vitesse.
          const sens = v.vitesse >= 0 ? t.angle : t.angle + Math.PI;
          const ecart = Math.atan2(Math.sin(sens - v.angle), Math.cos(sens - v.angle));
          v.angle += ecart * 0.25;
          v.vitesse *= 1 - Math.min(0.3, versLeBord / Math.max(1, Math.abs(v.vitesse)) * 0.3);
          if (versLeBord > 8) pire = Math.max(pire, versLeBord * 0.5); // frotter le bord abîme moins qu'un vrai choc
        }
      } else if (Math.abs(l.w) <= R.demiLargeur) {
        // Le bout de la piste, de l'autre côté d'un saut : un mur si on arrive en dessous.
        let hb = null;
        if (l.u < 0 && l.u > -rayon - 1 && !t.avantRoute) hb = t.ya;
        else if (l.u > t.longueur && l.u < t.longueur + rayon + 1 && !t.apresRoute) hb = t.yb;
        if (hb === null || !(hb > y + MARCHE && hb - 2 < y + 1.6)) continue;
        const choc = Circuit.Chocs.contreBoite(v, { x: t.x, z: t.z, angle: t.angle, demiLongueur: t.longueur / 2, demiLargeur: R.demiLargeur }, rayon);
        if (choc > 0) {
          v.vitesse = -v.vitesse * 0.2;
          pire = Math.max(pire, choc);
        }
      }
    }
    return pire;
  }

  // ✍️ Les plaques de NITRO.
  const nitros = R.plaques(M.nitros, M.longueurNitro, M.largeurNitro);
  const plaqueSous = (v) => R.plaqueSous(nitros, v);

  // ✍️ Les DRAPEAUX (les points de contrôle) : où ils sont, et à combien de mètres du départ.
  const premierEchantillon = (i) => echantillons.findIndex((e) => e.morceau === i);
  const drapeaux = M.drapeaux.map((i, numero) => {
    const k = premierEchantillon(i);
    return Object.assign({ numero, s: echantillons[k].s, echantillon: k }, R.pointSurLaRoute(Math.min(i, points.length - 2), i === points.length - 1 ? 1 : 0));
  });
  const arrivee = Object.assign({ s: R.longueur - M.arrivee }, R.pointAuMetre(R.longueur - M.arrivee, 0));

  // Les SAUTS : chaque endroit où la piste s'arrête, puis reprend plus loin.
  const sauts = [];
  points.forEach((p, i) => {
    if (p[3] !== "vide") return;
    const depart = R.pointSurLaRoute(i, 0), arriveeSaut = R.pointSurLaRoute(i + 1, 0);
    sauts.push({ numero: sauts.length + 1, depart, arrivee: arriveeSaut, longueur: Math.hypot(arriveeSaut.x - depart.x, arriveeSaut.z - depart.z), pente: (p[2] - points[i - 1][2]) / Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) });
  });

  // ✍️ Des pièces : le long de la piste (à gauche, au milieu, à droite), et en l'air au-dessus des sauts.
  function placerPieces() {
    const pieces = [];
    const ajouter = (x, y, z, ou) => pieces.push({ numero: pieces.length + 1, x, y, z, ou, prise: false });
    let prochaine = 25, k = 0;
    for (const t of routes) {
      if (echantillons[t.numero].s < prochaine || echantillons[t.numero].s > arrivee.s) continue;
      prochaine += M.ecartPieces;
      const w = [-3, 0, 3][k++ % 3];
      ajouter(t.ax - t.uz * w, t.ya + 1.2, t.az + t.ux * w, "piste");
    }
    // Au-dessus des sauts : la trajectoire d'une voiture qui saute à 160 km/h.
    for (const s of sauts) {
      for (const f of [0.25, 0.5, 0.75]) {
        const d = f * s.longueur, temps = d / 45;
        ajouter(s.depart.x + s.depart.cos * d, s.depart.y + s.pente * 45 * temps - 0.5 * C.parcours.gravite * temps * temps + 1, s.depart.z + s.depart.sin * d, "saut n° " + s.numero);
      }
    }
    return pieces;
  }

  return {
    points, echantillons, troncons, routes, nitros, drapeaux, arrivee, sauts, longueur: R.longueur, largeur: M.largeur,
    loopings: [], // pas de looping ici (les règles de la balade les cherchent)
    depart: { x: drapeaux[0].x, z: drapeaux[0].z, y: drapeaux[0].y, angle: drapeaux[0].angle },
    limite: 5000,
    glisse: true, // les bords relevés font glisser la voiture (pas de rebond)
    sous, hauteurSol, murs, plaqueSous, placerPieces, pointAuMetre: R.pointAuMetre, pointSurLaRoute: R.pointSurLaRoute,
    placerCartons: () => [],
  };
})();
