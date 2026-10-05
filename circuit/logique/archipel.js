// 🏝️ L'ARCHIPEL : le géographe de la map énorme
//
// Étape 42. ✍️ La ville est maintenant sur une ÎLE au milieu de la mer. De grands PONTS mènent à d'autres îles,
// chacune avec un AÉROPORT (une piste, une aérogare, une tour de contrôle, des hangars, un parking plein de
// véhicules, un héliport). La 3e île est trop loin pour un pont : on y ira en avion (étape 44).
//
// Ce fichier sait répondre à 3 questions :
//   - « Ce point est-il sur la terre (une île ou un pont) ? » Si non, c'est la mer : on ne peut pas y aller ;
//   - « À quelle hauteur est le sol ici ? » Sur un pont, la route monte en ARC (un morceau de sinus) ;
//   - « Y a-t-il un mur ? » Les bâtiments et les avions de l'aéroport sont des boîtes solides.
//
// Une île-aéroport est décrite UNE fois, dans ses propres coordonnées (u = le long de la piste, w = en travers).
// Pour chaque aéroport, on la TOURNE et on la DÉPLACE à sa place : c'est un « repère local » (comme un plan
// d'architecte qu'on pose sur la carte). Ce fichier ne dessine rien : c'est affichage/decor-archipel.js.

window.Circuit = window.Circuit || {};

Circuit.Archipel = (function () {
  const C = Circuit.CONFIG;
  const A = C.archipel;

  // ---------------------------------------------------------------- le plan d'une île-aéroport (repère local)
  const PLAN = {
    piste: { u: 0, w: -150, longueur: 700, largeur: 50 }, // la piste d'atterrissage
    tarmac: { u: 0, w: 20, longueur: 600, largeur: 240 }, // le béton devant l'aérogare
    route: { u: -375, w: -6, longueur: 150, largeur: 16 }, // la route qui vient du pont
    // Les bâtiments (des boîtes solides) : u, w = le centre ; l = le long de u, p = le long de w ; h = la hauteur.
    batiments: [
      { nom: "l'aérogare", u: 0, w: 165, l: 220, p: 40, h: 18, sorte: "aerogare" },
      { nom: "la tour de contrôle", u: -200, w: 180, l: 10, p: 10, h: 42, sorte: "tour" },
      { nom: "le hangar n° 1", u: 240, w: 150, l: 60, p: 44, h: 16, sorte: "hangar" },
      { nom: "le hangar n° 2", u: 240, w: 230, l: 60, p: 44, h: 16, sorte: "hangar" },
    ],
    // Les avions et l'hélico garés (on les pilotera à l'étape 44) : ce sont aussi des obstacles.
    avions: [
      { modele: "avionDeLigne", u: -70, w: 60, angle: -Math.PI / 2, l: 34, p: 6 },
      { modele: "petitAvion", u: 120, w: 50, angle: -Math.PI / 2, l: 8, p: 3 },
      { modele: "helico", u: -280, w: 250, angle: 0, l: 10, p: 3 },
    ],
    heliport: { u: -280, w: 250, rayon: 12 },
    porte: { u: 0, w: 140 }, // la porte de la boutique de l'aérogare
    parking: { u: -110, w: 112, pas: 20 }, // la première place, puis une place tous les 20 m
  };

  // Du repère local d'un aéroport vers le monde (et l'inverse).
  function versMonde(ap, u, w) {
    const c = Math.cos(ap.angle), s = Math.sin(ap.angle);
    return { x: ap.x + c * u - s * w, z: ap.z + s * u + c * w };
  }
  function versLocal(ap, x, z) {
    const c = Math.cos(ap.angle), s = Math.sin(ap.angle), dx = x - ap.x, dz = z - ap.z;
    return { u: c * dx + s * dz, w: -s * dx + c * dz };
  }

  // Les aéroports, avec leurs bâtiments placés dans le monde (des boîtes tournées, pour moteur/chocs.js).
  const aeroports = A.aeroports.map((a) => {
    const ap = Object.assign({}, a);
    const boite = (u, w, l, p, angle, extra) => Object.assign(versMonde(ap, u, w), { angle: ap.angle + (angle || 0), demiLongueur: l / 2, demiLargeur: p / 2 }, extra);
    ap.batiments = PLAN.batiments.map((b) => boite(b.u, b.w, b.l, b.p, 0, { nom: b.nom, hauteur: b.h, sorte: b.sorte }));
    ap.avions = PLAN.avions.map((v) => boite(v.u, v.w, v.l, v.p, v.angle, { modele: v.modele, hauteur: 4 }));
    ap.porte = Object.assign(versMonde(ap, PLAN.porte.u, PLAN.porte.w), { nom: "la boutique de " + ap.nom.replace(/^l'/, "l'") });
    ap.heliport = Object.assign(versMonde(ap, PLAN.heliport.u, PLAN.heliport.w), { rayon: PLAN.heliport.rayon });
    return ap;
  });
  const solides = [];
  for (const ap of aeroports) solides.push(...ap.batiments, ...ap.avions);

  // ---------------------------------------------------------------- les ponts
  const ponts = A.ponts.map((p) => {
    const dx = p.a[0] - p.de[0], dz = p.a[1] - p.de[1], longueur = Math.hypot(dx, dz);
    return Object.assign({}, p, { longueur, ux: dx / longueur, uz: dz / longueur, angle: Math.atan2(dz, dx) });
  });
  // Où est-on sur un pont ? { pont, u (m depuis le début), w (m sur le côté) } ou null.
  function surQuelPont(x, z) {
    for (const p of ponts) {
      const dx = x - p.de[0], dz = z - p.de[1];
      const u = dx * p.ux + dz * p.uz, w = -dx * p.uz + dz * p.ux;
      if (u >= -2 && u <= p.longueur + 2 && Math.abs(w) <= p.largeur / 2 - 0.5) return { pont: p, u, w };
    }
    return null;
  }
  // La route du pont monte en arc : hauteur = H × sin(π × u ÷ L). 0 aux deux bouts, H au milieu.
  const hauteurPont = (p, u) => p.hauteur * Math.sin((Math.PI * Math.max(0, Math.min(p.longueur, u))) / p.longueur);

  // ---------------------------------------------------------------- la terre et la mer
  const surIleVille = (x, z) => Math.abs(x) <= A.ileVille && Math.abs(z) <= A.ileVille;
  function surIleAeroport(x, z) {
    for (const ap of aeroports) {
      const l = versLocal(ap, x, z);
      if (l.u >= A.ile.u[0] && l.u <= A.ile.u[1] && l.w >= A.ile.w[0] && l.w <= A.ile.w[1]) return ap;
    }
    return null;
  }

  // Où est ce point ? { ou (un nom), h (la hauteur du sol), terre (vrai/faux) }
  function lieu(x, z) {
    const p = surQuelPont(x, z);
    if (p) return { ou: p.pont.nom, h: hauteurPont(p.pont, p.u), terre: true, pont: p.pont };
    if (surIleVille(x, z)) return { ou: "la ville", h: 0, terre: true };
    const ap = surIleAeroport(x, z);
    if (ap) return { ou: "l'île de " + ap.nom, h: 0, terre: true, aeroport: ap };
    return { ou: "la mer", h: A.mer, terre: false };
  }

  // ✍️ On ne roule pas dans la mer : si le pas qu'on vient de faire mène dans l'eau, on revient en arrière.
  // Renvoie la vitesse du choc contre le bord de l'eau (0 s'il n'y en a pas). Met aussi à jour la hauteur y
  // (et vy, pour que la voiture penche dans la montée du pont).
  function garderSurTerre(o, avantX, avantZ, dt) {
    let choc = 0;
    if (!lieu(o.x, o.z).terre) {
      choc = Math.abs(o.vitesse || 0);
      o.x = avantX;
      o.z = avantZ;
      if (o.vitesse !== undefined) o.vitesse = -o.vitesse * 0.2;
    }
    const y = lieu(o.x, o.z).h;
    o.vy = dt > 0 ? (y - (o.y || 0)) / dt : 0;
    o.y = y;
    return choc;
  }

  // Les murs : les bâtiments et les avions garés des aéroports.
  function murs(v, rayon) {
    let pire = 0;
    for (const b of solides) {
      const d = Math.max(b.demiLongueur, b.demiLargeur) + 5;
      if (Math.abs(v.x - b.x) > d || Math.abs(v.z - b.z) > d) continue;
      pire = Math.max(pire, Circuit.Chocs.contreBoite(v, b, rayon));
    }
    return pire;
  }

  // ---------------------------------------------------------------- les magasins
  // ✍️ En ville : 4 immeubles ont une boutique au rez-de-chaussée (la porte est sur le côté qui donne sur la rue).
  // Dans chaque aéroport : la boutique de l'aérogare.
  // La porte d'un immeuble : sur le côté le plus proche d'une rue, à 1,5 m du mur, sur le trottoir.
  // (Étape 43 : sert aussi aux maisons où l'on livre les pizzas.)
  const rues = [];
  for (let r = 0; r < Circuit.Ville.n; r++) rues.push(Circuit.Ville.rue(r));
  const pres = (c) => Math.min(...rues.map((r) => Math.abs(r - c)));
  function porteImmeuble(b) {
    const cotes = [
      { x: b.x + b.demiLongueur + 1.5, z: b.z, angle: 0 }, { x: b.x - b.demiLongueur - 1.5, z: b.z, angle: Math.PI },
      { x: b.x, z: b.z + b.demiLargeur + 1.5, angle: Math.PI / 2 }, { x: b.x, z: b.z - b.demiLargeur - 1.5, angle: -Math.PI / 2 },
    ];
    cotes.sort((p, q) => (Math.abs(Math.cos(p.angle)) > 0.5 ? pres(p.x) : pres(p.z)) - (Math.abs(Math.cos(q.angle)) > 0.5 ? pres(q.x) : pres(q.z)));
    return cotes[0];
  }
  const magasins = [];
  [5, 30, 52, 77].forEach((k, i) => {
    const b = Circuit.Ville.immeubles[k % Circuit.Ville.immeubles.length];
    magasins.push(Object.assign({ numero: i, nom: C.magasins.noms[i], immeuble: b }, porteImmeuble(b)));
  });
  for (const ap of aeroports) magasins.push({ numero: magasins.length, nom: "la boutique de " + ap.nom, x: ap.porte.x, z: ap.porte.z, angle: ap.angle + Math.PI / 2, aeroport: ap });

  // Le magasin dont la porte est à moins de `distance` m, ou null.
  function magasinProche(x, z, distance) {
    let meilleur = null, d0 = distance;
    for (const m of magasins) {
      const d = Math.hypot(m.x - x, m.z - z);
      if (d < d0) {
        d0 = d;
        meilleur = m;
      }
    }
    return meilleur;
  }

  // ---------------------------------------------------------------- les véhicules garés et les pièces
  // ✍️ À l'aéroport, « plein de types de voitures » : une voiture de chaque garage (et des motos), en rang.
  function placerGarees() {
    const tous = [];
    for (const l of [C.vehiculesVille, C.voitures, C.vehiculesParcours, [C.vehiculesGrandParcours[0]]]) for (const f of l) if (typeof f !== "string") tous.push(f.modele);
    const garees = [];
    aeroports.forEach((ap, i) => {
      for (let k = 0; k < A.parking; k++) {
        const p = versMonde(ap, PLAN.parking.u + k * PLAN.parking.pas, PLAN.parking.w);
        garees.push({ x: p.x, z: p.z, angle: ap.angle - Math.PI / 2, modele: k % 4 === 3 ? "moto" : tous[(k + i * 5) % tous.length] });
      }
    });
    return garees;
  }

  function placerPieces() {
    const pieces = [];
    const ajouter = (x, y, z, ou) => pieces.push({ numero: 0, x, y, z, ou, prise: false });
    for (const p of ponts) {
      for (let k = 1; k <= A.piecesParPont; k++) {
        const u = (k / (A.piecesParPont + 1)) * p.longueur, w = [-4, 4][k % 2];
        ajouter(p.de[0] + p.ux * u - p.uz * w, hauteurPont(p, u) + 1.2, p.de[1] + p.uz * u + p.ux * w, p.nom);
      }
    }
    for (const ap of aeroports) {
      for (let k = 0; k < A.piecesParIle; k++) {
        // Une ligne de pièces sur la piste, puis quelques-unes sur le tarmac.
        const u = k < 8 ? -280 + k * 80 : -240 + (k - 8) * 160, w = k < 8 ? PLAN.piste.w : 30;
        const p = versMonde(ap, u, w);
        ajouter(p.x, 1.2, p.z, ap.nom);
      }
    }
    return pieces;
  }

  return {
    aeroports, ponts, magasins, solides, plan: PLAN, versMonde, versLocal,
    lieu, surQuelPont, hauteurPont, garderSurTerre, murs, magasinProche, placerGarees, placerPieces, porteImmeuble,
  };
})();
