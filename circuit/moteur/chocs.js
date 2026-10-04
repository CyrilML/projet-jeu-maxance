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

  return { cercles, resoudre };
})();
