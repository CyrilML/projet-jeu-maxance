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
  const A = Circuit.CONFIG.agrandir;
  const AP = A.parcours;

  // Étape 68 : ✍️ la carte est 3 fois plus grande. Le parcours d'avant devient une « TUILE » de 700 m, recopiée
  // 9 fois (3 × 3, comme un carrelage), chaque copie TOURNÉE d'un quart de tour de plus : on ne retrouve jamais
  // deux fois le même coin. Entre les tuiles : des collines, des forêts, et une rivière avec 3 ponts.
  if (!P.agrandi) {
    const ecart = AP.ecartTuiles;
    const tuiles = [];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) tuiles.push({ ox: i * ecart, oz: j * ecart, quart: (i + 1 + (j + 1) * 3) % 4 });
    const copier = (liste) => {
      const nouvelle = [];
      for (const t of tuiles) {
        const a = (t.quart * Math.PI) / 2, c = Math.round(Math.cos(a)), sn = Math.round(Math.sin(a));
        for (const o of liste) {
          const copie = Object.assign({}, o, { x: t.ox + o.x * c - o.z * sn, z: t.oz + o.x * sn + o.z * c });
          if (o.angle !== undefined) copie.angle = o.angle + a;
          nouvelle.push(copie);
        }
      }
      return nouvelle;
    };
    for (const cle of ["montees", "tremplins", "loopings", "tunnels", "cartons"]) P[cle] = copier(P[cle]);
    P.taille = AP.taille;
    P.piecesAuSol = AP.piecesAuSol;
    P.agrandi = true;
  }

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

  // Étape 68 : les collines et la rivière (moteur/campagne.js). Le sol reste plat sous les formes, autour des
  // loopings, des cartons, du départ et des ponts. La rivière passe entre deux colonnes de tuiles.
  const coursRiviere = Circuit.Campagne.serpent(...AP.coursRiviere, AP.graine);
  const ponts = AP.ponts.map((z) => {
    // Le pont : là où la rivière croise cette ligne (z), un tablier de bois en travers de l'eau.
    let mieux = coursRiviere[0];
    for (const p of coursRiviere) if (Math.abs(p[1] - z) < Math.abs(mieux[1] - z)) mieux = p;
    return { x: mieux[0], z, longueur: A.riviere.largeur + 2 * A.riviere.berge + 8, largeur: 12, y: 0.25 };
  });
  const campagne = Circuit.Campagne.creer(Object.assign({}, AP, {
    taille: P.taille,
    riviere: Object.assign({}, A.riviere, { points: coursRiviere }),
    plats: formes.map((f) => [f.x, f.z, Math.hypot(f.demiLongueur, f.demiLargeur) + 6])
      .concat(P.loopings.map((l) => [l.x, l.z, 26]))
      .concat(P.cartons.map((c) => [c.x, c.z, 6]))
      .concat(ponts.map((p) => [p.x, p.z, p.longueur / 2 + 20]))
      .concat([[0, 0, 25]]),
  }));
  campagne.ponts = ponts;
  const surPont = (x, z) => ponts.find((p) => Math.abs(x - p.x) <= p.longueur / 2 && Math.abs(z - p.z) <= p.largeur / 2);

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
    let sol = campagne.hauteur(x, z); // étape 68 : les collines (et le lit de la rivière)
    const pont = surPont(x, z);
    if (pont && pont.y <= y + P.marche) sol = Math.max(sol, pont.y); // sur un pont, on ne tombe pas dans l'eau
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
    while (poses < P.piecesAuSol && essais < 5000) {
      essais++;
      const x = (alea() * 2 - 1) * bord, z = (alea() * 2 - 1) * bord;
      if (formes.some((f) => dessus(f, local(f, x, z).u, local(f, x, z).w) !== null) || Math.hypot(x, z) < 15) continue; // pas sur une forme, ni sur le départ
      if (campagne.distanceRiviere(x, z) < A.riviere.largeur / 2 + A.riviere.berge) continue; // ni dans la rivière
      const h = campagne.hauteur(x, z);
      ajouterPiece(x, h + 1.2, z, h > 3 ? "colline" : "sol");
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

  // Étape 68 : dans l'eau ? (pas sur un pont)
  const dansLEau = (x, z, y) => !surPont(x, z) && campagne.dansLEau(x, z, y);

  return { formes, loopings, tunnels, hauteurSol, murs, pointLooping, placerPieces, placerCartons, campagne, ponts, dansLEau,
    limite: P.taille / 2 - 3 };
})();
