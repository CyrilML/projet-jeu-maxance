// 💥 LES CHOCS : les pare-chocs
//
// Comment savoir si deux voitures se touchent ? Une voiture est un rectangle, et tester deux
// rectangles tournés, c'est compliqué. Astuce de jeu vidéo : on remplace chaque voiture par
// 2 CERCLES, un à l'avant et un à l'arrière :
//
//        ┌──────────────┐
//        │  (  ●  )(  ●  )│   ← 2 cercles de 1,05 m de rayon couvrent presque toute la voiture
//        └──────────────┘
//
// Deux cercles se touchent si la distance entre leurs centres est plus petite que 2 rayons.
// Quand ça touche :
//   1. on ÉCARTE les deux voitures pour qu'elles ne se rentrent plus dedans ;
//   2. on les fait REBONDIR : chacune reçoit une poussée dans la direction du choc.
//
// Ce fichier est un outil générique : il ne sait pas qui est le joueur ou l'adversaire.

window.Circuit = window.Circuit || {};

Circuit.Chocs = (function () {
  // Les centres des 2 cercles d'une voiture (x, z, angle) : à ± `decalage` mètres du milieu.
  function cercles(v, decalage) {
    const c = Math.cos(v.angle), s = Math.sin(v.angle);
    return [
      [v.x + c * decalage, v.z + s * decalage],
      [v.x - c * decalage, v.z - s * decalage],
    ];
  }

  // Regarde si les voitures a et b se touchent, et règle le choc.
  // Renvoie { touche: false } ou { touche: true, force } (force = vitesse du choc, en m/s).
  function resoudre(a, b, reglages) {
    const r = reglages.rayon;
    const decalage = r; // les 2 cercles se touchent au milieu de la voiture
    let meilleur = null;
    for (const p of cercles(a, decalage)) {
      for (const q of cercles(b, decalage)) {
        const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (d < 2 * r && (!meilleur || d < meilleur.d)) meilleur = { d, p, q };
      }
    }
    if (!meilleur) return { touche: false };

    // La direction du choc (de b vers a), et de combien les voitures se rentrent dedans.
    const d = meilleur.d || 0.001;
    const nx = (meilleur.p[0] - meilleur.q[0]) / d, nz = (meilleur.p[1] - meilleur.q[1]) / d;
    const enfoncement = 2 * r - d;

    // 1. On écarte : chaque voiture recule de la moitié.
    a.x += (nx * enfoncement) / 2;
    a.z += (nz * enfoncement) / 2;
    b.x -= (nx * enfoncement) / 2;
    b.z -= (nz * enfoncement) / 2;

    // 2. Le rebond. On écrit chaque vitesse comme une flèche (vx, vz)…
    const ax = Math.cos(a.angle) * a.vitesse, az = Math.sin(a.angle) * a.vitesse;
    const bx = Math.cos(b.angle) * b.vitesse, bz = Math.sin(b.angle) * b.vitesse;
    // …et on regarde si elles se rapprochent dans la direction du choc.
    const rapprochement = (ax - bx) * nx + (az - bz) * nz;
    if (rapprochement >= 0) return { touche: true, force: 0 }; // elles s'éloignent déjà
    const poussee = (-(1 + reglages.rebond) * rapprochement) / 2;
    const nax = ax + poussee * nx, naz = az + poussee * nz;
    const nbx = bx - poussee * nx, nbz = bz - poussee * nz;
    // Une voiture ne glisse pas sur le côté : on garde seulement la partie de la vitesse dans son axe.
    a.vitesse = nax * Math.cos(a.angle) + naz * Math.sin(a.angle);
    b.vitesse = nbx * Math.cos(b.angle) + nbz * Math.sin(b.angle);
    return { touche: true, force: -rapprochement };
  }

  // Étape 37 : une voiture contre une BOÎTE fixe (un muret, un immeuble), même tournée.
  // boite = { x, z, angle, demiLongueur, demiLargeur }. Pour chaque cercle de la voiture, on se met
  // « dans le repère de la boîte » (comme si elle était droite), on trouve le point de la boîte le plus
  // proche du cercle, et on regarde s'il est à moins d'un rayon. Si oui, on repousse la voiture.
  // Renvoie la vitesse du choc (0 si pas de choc).
  function contreBoite(v, boite, rayon) {
    const cb = Math.cos(boite.angle), sb = Math.sin(boite.angle);
    let pire = 0;
    for (const centre of cercles(v, rayon)) {
      // Le centre du cercle, vu depuis la boîte (u = le long de la boîte, w = en travers).
      const dx = centre[0] - boite.x, dz = centre[1] - boite.z;
      const u = dx * cb + dz * sb, w = -dx * sb + dz * cb;
      const pu = Math.max(-boite.demiLongueur, Math.min(boite.demiLongueur, u));
      const pw = Math.max(-boite.demiLargeur, Math.min(boite.demiLargeur, w));
      let nu = u - pu, nw = w - pw;
      let d = Math.hypot(nu, nw);
      if (d >= rayon) continue;
      if (d < 0.0001) {
        // Le centre est DANS la boîte : on sort par le côté le plus proche.
        const versU = boite.demiLongueur - Math.abs(u), versW = boite.demiLargeur - Math.abs(w);
        if (versU < versW) { nu = Math.sign(u) || 1; nw = 0; d = -versU; }
        else { nu = 0; nw = Math.sign(w) || 1; d = -versW; }
      } else {
        nu /= d;
        nw /= d;
      }
      // La direction pour sortir, dans le monde.
      const nx = nu * cb - nw * sb, nz = nu * sb + nw * cb;
      const enfoncement = rayon - d;
      v.x += nx * enfoncement;
      v.z += nz * enfoncement;
      const vers = Math.cos(v.angle) * v.vitesse * nx + Math.sin(v.angle) * v.vitesse * nz;
      if (vers < 0) pire = Math.max(pire, -vers);
    }
    return pire;
  }

  // Un petit cercle (un plot) touche-t-il la voiture ?
  function toucheCercle(v, x, z, r, rayon) {
    return cercles(v, rayon).some((c) => Math.hypot(c[0] - x, c[1] - z) < r + rayon);
  }

  return { cercles, resoudre, contreBoite, toucheCercle };
})();
