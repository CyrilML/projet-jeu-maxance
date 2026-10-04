// 🎢 LE PARCOURS : le terrain de jeux
//
// Étape 37. Une grande map plate où l'on roule librement. Tout le relief est fait de 2 formes :
//   - le BLOC : une boîte au dessus plat (le plateau d'une montée, un mur de tunnel) ;
//   - la PENTE : une boîte dont le dessus monte de 0 m d'un côté à sa hauteur de l'autre côté.
// Une montée = une pente + un bloc + une pente qui redescend. Un tremplin = une pente toute seule :
// au bout, le sol disparaît… et la voiture s'envole.
//
// Pour chaque point (x, z), le terrain sait dire la HAUTEUR DU SOL. Pour savoir si c'est un sol
// ou un mur, on compare avec la hauteur de la voiture :
//   - le dessus est à moins de 0,7 m au-dessus de la voiture → c'est une marche, elle monte dessus ;
//   - plus haut → c'est un MUR, elle se cogne.
//
// Les loopings et les cartons ont leurs propres règles (logique/balade.js).

window.Circuit = window.Circuit || {};

Circuit.Parcours = (function () {
  const P = Circuit.CONFIG.parcours;
  const formes = []; // tous les blocs et toutes les pentes
  const loopings = [];
  const tunnels = [];

  // Ajoute une forme. u = la direction de l'angle (« la longueur »), w = en travers (« la largeur »).
  function ajouter(type, x, z, angle, longueur, largeur, hauteur, nom) {
    formes.push({ type, x, z, angle, cos: Math.cos(angle), sin: Math.sin(angle), demiLongueur: longueur / 2, demiLargeur: largeur / 2, hauteur, nom });
  }

  for (const m of P.montees) {
    const c = Math.cos(m.angle), s = Math.sin(m.angle);
    const d = m.longueur / 2 + m.pente / 2;
    ajouter("bloc", m.x, m.z, m.angle, m.longueur, m.largeur, m.hauteur, "plateau");
    ajouter("pente", m.x - c * d, m.z - s * d, m.angle, m.pente, m.largeur, m.hauteur, "montée"); // monte vers le plateau
    ajouter("pente", m.x + c * d, m.z + s * d, m.angle + Math.PI, m.pente, m.largeur, m.hauteur, "descente");
  }
  for (const t of P.tremplins) ajouter("pente", t.x, t.z, t.angle, t.longueur, t.largeur, t.hauteur, "tremplin");
  for (const t of P.tunnels) {
    // Deux murs de 1 m d'épaisseur, de chaque côté. Le toit est seulement dessiné.
    const ws = -Math.sin(t.angle), wc = Math.cos(t.angle);
    const e = t.largeur / 2 + 0.5;
    ajouter("bloc", t.x + ws * e, t.z + wc * e, t.angle, t.longueur, 1, t.hauteur, "mur de tunnel");
    ajouter("bloc", t.x - ws * e, t.z - wc * e, t.angle, t.longueur, 1, t.hauteur, "mur de tunnel");
    tunnels.push(t);
  }
  for (const l of P.loopings) {
    loopings.push(Object.assign({ dx: Math.cos(l.angle), dz: Math.sin(l.angle), lx: -Math.sin(l.angle), lz: Math.cos(l.angle) }, l));
  }

  // Le point (x, z) vu depuis la forme : u le long, w en travers.
  function local(f, x, z) {
    const dx = x - f.x, dz = z - f.z;
    return { u: dx * f.cos + dz * f.sin, w: -dx * f.sin + dz * f.cos };
  }

  // La hauteur du dessus d'une forme en (u, w), ou null si on n'est pas dessus.
  function dessus(f, u, w) {
    if (Math.abs(u) > f.demiLongueur || Math.abs(w) > f.demiLargeur) return null;
    if (f.type === "bloc") return f.hauteur;
    return (f.hauteur * (u + f.demiLongueur)) / (2 * f.demiLongueur);
  }

  // La hauteur du sol sous (x, z), pour une voiture à la hauteur y (on ne monte que sur les marches).
  function hauteurSol(x, z, y) {
    let sol = 0;
    for (const f of formes) {
      const l = local(f, x, z);
      const h = dessus(f, l.u, l.w);
      if (h !== null && h <= y + P.marche && h > sol) sol = h;
    }
    return sol;
  }

  // Les MURS : les formes trop hautes pour la voiture. On la repousse (moteur/chocs.js).
  // Renvoie la plus grande vitesse de choc.
  function murs(v, rayon) {
    let pire = 0;
    for (const f of formes) {
      // La hauteur du dessus à l'endroit le plus proche de la voiture.
      const l = local(f, v.x, v.z);
      const u = Math.max(-f.demiLongueur, Math.min(f.demiLongueur, l.u));
      const w = Math.max(-f.demiLargeur, Math.min(f.demiLargeur, l.w));
      if (Math.hypot(l.u - u, l.w - w) > 3) continue; // trop loin, pas la peine de calculer
      if (dessus(f, u, w) <= v.y + P.marche) continue; // c'est une marche, pas un mur
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, f, rayon));
    }
    return pire;
  }

  // Un petit générateur de hasard « à graine » : les pièces sont toujours aux mêmes endroits.
  function hasard(graine) {
    let etat = graine >>> 0;
    return () => {
      etat = (etat * 1664525 + 1013904223) >>> 0;
      return etat / 4294967296;
    };
  }

  // Un point du looping : θ = l'angle parcouru (0 = l'entrée, 2π = la sortie).
  function pointLooping(l, theta) {
    const avance = l.rayon * Math.sin(theta);
    const cote = (P.decalageLooping * theta) / (2 * Math.PI);
    return { x: l.x + l.dx * avance + l.lx * cote, y: l.rayon * (1 - Math.cos(theta)), z: l.z + l.dz * avance + l.lz * cote };
  }

  // ✍️ Des pièces partout : sur les plateaux, dans les airs après les tremplins, dans les loopings,
  // dans les tunnels, et éparpillées sur le sol.
  function placerPieces() {
    const pieces = [];
    const ajouterPiece = (x, y, z, ou) => pieces.push({ numero: pieces.length + 1, x, y, z, ou, prise: false });
    for (const m of P.montees) {
      const c = Math.cos(m.angle), s = Math.sin(m.angle);
      for (const k of [-1, 0, 1]) ajouterPiece(m.x + c * k * m.longueur * 0.3, m.hauteur + 1.2, m.z + s * k * m.longueur * 0.3, "plateau");
    }
    for (const t of P.tremplins) {
      const c = Math.cos(t.angle), s = Math.sin(t.angle);
      const bout = t.longueur / 2;
      [[8, 2.2], [16, 3], [24, 2.2]].forEach(([d, dy]) => ajouterPiece(t.x + c * (bout + d), t.hauteur + dy, t.z + s * (bout + d), "saut"));
    }
    for (const l of loopings) {
      for (const theta of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
        const p = pointLooping(l, theta);
        ajouterPiece(p.x, p.y + 1, p.z, "looping");
      }
    }
    for (const t of tunnels) {
      const c = Math.cos(t.angle), s = Math.sin(t.angle);
      for (let k = -2; k <= 2; k++) ajouterPiece(t.x + c * k * t.longueur * 0.18, 1.2, t.z + s * k * t.longueur * 0.18, "tunnel");
    }
    const alea = hasard(P.graine);
    let essais = 0, poses = 0;
    const bord = P.taille / 2 - 20;
    while (poses < P.piecesAuSol && essais < 1000) {
      essais++;
      const x = (alea() * 2 - 1) * bord, z = (alea() * 2 - 1) * bord;
      if (hauteurSol(x, z, 100) > 0 || Math.hypot(x, z) < 15) continue; // pas sur une forme, ni sur le départ
      ajouterPiece(x, 1.2, z, "sol");
      poses++;
    }
    return pieces;
  }

  // Les piles de cartons : 3 en bas, 2 au milieu, 1 en haut (une petite pyramide de caisses de 1,2 m).
  function placerCartons() {
    const cartons = [];
    P.cartons.forEach((pile, numero) => {
      const etages = [[-1.25, 0, 1.25], [-0.62, 0.62], [0]];
      etages.forEach((rangee, etage) => {
        for (const decalage of rangee) {
          cartons.push({ pile: numero, x: pile.x + decalage, y: 0.6 + etage * 1.2, z: pile.z, vx: 0, vy: 0, vz: 0, rotation: 0, vrotation: 0, vole: false });
        }
      });
    });
    return cartons;
  }

  return { formes, loopings, tunnels, hauteurSol, murs, pointLooping, placerPieces, placerCartons };
})();
