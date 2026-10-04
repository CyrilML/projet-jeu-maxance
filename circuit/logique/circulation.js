// 🚦 LA CIRCULATION : le code de la route
//
// Étape 39. Des voitures roulent toutes seules dans la ville. Chacune va d'un CARREFOUR à un carrefour
// voisin, sur la voie de DROITE. Arrivée au carrefour, elle tire au hasard : tout droit, à gauche ou
// à droite (jamais demi-tour). Pour tourner en douceur, elle suit une COURBE (une « courbe de Bézier » :
// un départ, une arrivée, et un point au coin qui « tire » la courbe vers lui).
//
// Les FEUX : chaque carrefour a des feux. Pendant 8 s, la rue est-ouest a le vert ; puis orange 2 s ;
// puis c'est au tour de la rue nord-sud. Une voiture qui arrive au feu rouge (ou orange) s'arrête.
//
// LES DISTANCES DE SÉCURITÉ : une voiture ralentit et s'arrête si une autre voiture (ou toi, ou ton
// personnage) est juste devant elle. Pas de carambolage !

window.Circuit = window.Circuit || {};

Circuit.Circulation = (function () {
  const V = Circuit.CONFIG.ville;
  const Ville = Circuit.Ville;
  const coin = V.largeurRue / 2; // la courbe du virage commence à 8 m du milieu du carrefour

  // Le feu d'un carrefour pour un sens : "vert", "orange" ou "rouge".
  // axe = "x" (rue est-ouest) ou "z" (rue nord-sud). Chaque carrefour est un peu décalé dans le temps.
  function feu(temps, i, j, axe) {
    const cycle = 2 * (V.feuVert + V.feuOrange);
    const t = (((temps + (i + j) * 3) % cycle) + cycle) % cycle;
    const demi = V.feuVert + V.feuOrange;
    const pourX = t < V.feuVert ? "vert" : t < demi ? "orange" : "rouge";
    const pourZ = t < demi ? "rouge" : t < demi + V.feuVert ? "vert" : "orange";
    return axe === "x" ? pourX : pourZ;
  }

  const droite = (d) => [-d[1], d[0]]; // la droite de la direction (dx, dz)

  // Une nouvelle voiture sur un tronçon pris au hasard.
  function creer(hasard, modeles) {
    const i = Math.floor(hasard() * Ville.n), j = Math.floor(hasard() * Ville.n);
    const choix = Ville.voisins(i, j);
    const [di, dj] = choix[Math.floor(hasard() * choix.length)];
    const modele = modeles[Math.floor(hasard() * modeles.length)];
    const fiche = Circuit.Garage.ficheDe(modele);
    const c = { de: [i, j], vers: [i + di, j + dj], d: [di, dj], etat: "droit", s: hasard() * 30, vitesse: V.vitesseCirculation, modele, couleurs: fiche.couleurs };
    c.voiture = { x: 0, z: 0, angle: 0, vitesse: 0, volant: 0, rotationRoues: 0, modele, y: 0 };
    placer(c);
    return c;
  }

  // Le tronçon droit : du bord du carrefour de départ au bord du carrefour d'arrivée.
  function longueurDroite() {
    return V.tailleBloc + V.largeurRue - 2 * coin;
  }

  // Met à jour la position (x, z, angle) d'une voiture de la circulation d'après son état.
  function placer(c) {
    const v = c.voiture;
    if (c.etat === "droit") {
      const r = droite(c.d);
      const x0 = Ville.rue(c.de[0]) + c.d[0] * coin, z0 = Ville.rue(c.de[1]) + c.d[1] * coin;
      v.x = x0 + c.d[0] * c.s + r[0] * V.voie;
      v.z = z0 + c.d[1] * c.s + r[1] * V.voie;
      v.angle = Math.atan2(c.d[1], c.d[0]);
    } else {
      // Le virage : une courbe de Bézier P0 → P2, tirée vers le coin P1.
      const [p0, p1, p2] = c.courbe, t = c.t, u = 1 - t;
      v.x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
      v.z = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
      const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), dz = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
      v.angle = Math.atan2(dz, dx);
    }
  }

  // Arrivée au carrefour : on choisit la suite et on prépare la courbe du virage.
  function choisirLaSuite(c, hasard) {
    const [i, j] = c.vers;
    const possibles = Ville.voisins(i, j).filter(([di, dj]) => !(di === -c.d[0] && dj === -c.d[1])); // pas de demi-tour
    const d2 = possibles.length ? possibles[Math.floor(hasard() * possibles.length)] : [-c.d[0], -c.d[1]];
    const r1 = droite(c.d), r2 = droite(d2);
    const cx = Ville.rue(i), cz = Ville.rue(j);
    const p0 = [cx - c.d[0] * coin + r1[0] * V.voie, cz - c.d[1] * coin + r1[1] * V.voie];
    const p2 = [cx + d2[0] * coin + r2[0] * V.voie, cz + d2[1] * coin + r2[1] * V.voie];
    // Le coin : là où la voie d'arrivée et la voie de départ se croisent.
    const p1 = c.d[0] !== 0 ? [p2[0], p0[1]] : [p0[0], p2[1]];
    if (d2[0] === c.d[0] && d2[1] === c.d[1]) p1[0] = (p0[0] + p2[0]) / 2, p1[1] = (p0[1] + p2[1]) / 2; // tout droit
    c.courbe = [p0, p1, p2];
    c.longueurCourbe = (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + Math.hypot(p2[0] - p1[0], p2[1] - p1[1])) * 0.85;
    c.suite = d2;
    c.etat = "virage";
    c.t = 0;
  }

  // Un pas de temps pour toute la circulation. obstacles = les positions à ne pas percuter (toi, ton personnage).
  function avancer(circulation, temps, dt, obstacles, hasard) {
    for (const c of circulation) {
      const v = c.voiture;
      // La vitesse voulue : normale, sauf s'il faut s'arrêter.
      let voulue = V.vitesseCirculation;
      const devant = [Math.cos(v.angle), Math.sin(v.angle)];
      // 1. Le feu
      if (c.etat === "droit") {
        const reste = longueurDroite() - c.s;
        const couleur = feu(temps, c.vers[0], c.vers[1], c.d[0] !== 0 ? "x" : "z");
        if (couleur !== "vert" && reste < 14 && reste > 0.5) voulue = Math.min(voulue, Math.max(0, (reste - 1.5) * 1.2));
      }
      // 2. Quelqu'un juste devant (une autre voiture, toi, ton personnage) ?
      // (Les autres voitures de la circulation comptent seulement si elles vont dans le même sens :
      // sinon, deux voitures qui tournent au même carrefour pourraient s'attendre pour toujours.)
      const autres = circulation
        .map((o) => o.voiture)
        .filter((o) => o !== v && Math.cos(o.angle - v.angle) > 0.5)
        .concat(obstacles);
      for (const o of autres) {
        const dx = o.x - v.x, dz = o.z - v.z;
        const loin = dx * devant[0] + dz * devant[1], cote = Math.abs(-dx * devant[1] + dz * devant[0]);
        if (loin > 0 && loin < 11 && cote < 2.6) voulue = Math.min(voulue, Math.max(0, (loin - 6) * 1.5));
      }
      // Accélérer doucement, freiner fort.
      c.vitesse += Math.max(-14 * dt, Math.min(5 * dt, voulue - c.vitesse));
      v.vitesse = c.vitesse;
      v.rotationRoues += (c.vitesse * dt) / 0.38;
      c.feuAttendu = voulue < 1 && c.vitesse < 1;
      // Avancer sur le tronçon ou dans le virage.
      if (c.etat === "droit") {
        c.s += c.vitesse * dt;
        if (c.s >= longueurDroite()) choisirLaSuite(c, hasard);
      } else {
        c.t += (c.vitesse * dt) / c.longueurCourbe;
        if (c.t >= 1) {
          c.de = c.vers;
          c.d = c.suite;
          c.vers = [c.de[0] + c.d[0], c.de[1] + c.d[1]];
          c.etat = "droit";
          c.s = 0;
        }
      }
      placer(c);
    }
  }

  return { feu, creer, avancer };
})();
