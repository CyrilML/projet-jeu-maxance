// 🚇 LE SOUTERRAIN : l'architecte de la station de métro (étape 80)
//
// ✍️ « Un souterrain avec des trams en feu, des trains, des trams, des bancs, des escalators détruits, des escaliers.
// Mais tu ne pourras pas entrer dans le souterrain avec les tanks : ce sera que de l'infanterie. »
// Comme l'architecte qui a dessiné le PLAN de la station, ce fichier répond aux questions des autres :
//   - « quelle est la hauteur du sol ici ? » : le quai (0 m), la tranchée des rails (1,1 m plus bas), la mezzanine (la
//     galerie du haut, 4,5 m plus haut), et entre les deux les ESCALIERS et les ESCALATORS (des pentes). Partout
//     ailleurs, c'est un MUR (une hauteur énorme : personne ne peut y monter) ;
//   - « est-ce que je peux aller là ? » : un soldat monte une marche de 1,15 m au plus (il remonte sur le quai depuis
//     les rails), pas un mur de 4,5 m ! Plus haut : il est bloqué, il reste où il était. Plus bas : il saute ;
//   - « qu'y a-t-il ici ? » : les OBSTACLES sont des boîtes (les rames, les piliers, les bancs, les portiques, la
//     rambarde de la mezzanine, les tas de gravats), rangées dans un quadrillage (moteur/grille.js) ;
//   - « la ligne entre deux points touche-t-elle quelque chose ? » : on avance sur la ligne par petits pas de 35 cm (le
//     sol, les murs, le plafond), et on teste chaque boîte proche avec la « méthode des tranches » (comme les maisons).
//     Les balles et les grenades s'arrêtent (ou rebondissent) sur les murs et sur les rames ;
//   - « où dois-je aller ? » : les ROUTES des soldats de l'ordinateur (une liste de points : le long d'un quai, ou par
//     l'escalator, la mezzanine et l'escalier d'en face).
// La station va de l'est (x > 0, les Bleus) à l'ouest (x < 0, les Rouges). Tous les nombres sont dans config.js
// (« souterrain »). Ce fichier ne dessine rien.
// ✍️ (livre de demandes n° 25) « Un QG à détruire à chacun. » Derrière le mur du bout de chaque station, une SALLE : le
// poste de commandement du camp (une porte dans le mur, des sacs de sable, des bureaux, un groupe électrogène et les
// 3 BAIES de serveurs et de radios, des boîtes « baie » que logique/qg.js abîme). L'architecte en donne le plan (« qg »)
// et les routes : celle des GARDES (ils patrouillent devant leur QG) et celle des SAPEURS (ils vont au QG ennemi).

window.Tanks = window.Tanks || {};

Tanks.Souterrain = (function () {
  const C = Tanks.CONFIG, S = C.souterrain, V = S.voies, M = S.mezzanine;
  const L = S.longueur / 2, MUR = S.plafond + 2;
  const RAMPES = [Object.assign({ nom: "l'escalier" }, S.escaliers), Object.assign({ nom: "l'escalator" }, S.escalators)];
  // (livre n° 25) les deux salles des QG : sx, sz = de quel côté (x : le bout de la station ; z : le quai)
  const Q = S.qg || null, QG = {};
  if (Q && Q.actif) for (const equipe of ["bleus", "rouges"]) {
    const c = Q.cote[equipe];
    QG[equipe] = { equipe, nom: Q.noms[equipe], sx: c.x, sz: c.z, x0: L, x1: L + Q.profondeur, z0: Q.z[0], z1: Q.z[1], porte: Q.porte, baies: [] };
  }
  // (x, z) est-il dans la salle d'un QG ?
  function dansQG(x, z) {
    for (const e in QG) {
      const q = QG[e], u = x * q.sx, v = z * q.sz;
      if (u > q.x0 && u < q.x1 && v >= q.z0 && v < q.z1) return q;
    }
    return null;
  }

  // ------------------------------------------------------------------ la hauteur du sol
  function hauteur(x, z) {
    const ax = Math.abs(x), az = Math.abs(z);
    if (az < V.demi) return ax <= L + S.tunnel ? -V.profondeur : MUR; // la tranchée des rails (et le tunnel, bouché au bout)
    if (ax > L) return dansQG(x, z) ? 0 : MUR; // le mur du bout des quais (livre n° 25 : sauf la salle du QG, derrière)
    if (az < S.quai.fond) return 0; // le quai
    if (az < M.fond && ax < M.demiX) {
      for (const R of RAMPES) if (x >= R.x0 && x <= R.x1 && az < R.haut) return ((az - S.quai.fond) / (R.haut - S.quai.fond)) * M.hauteur; // une pente
      return M.hauteur; // la mezzanine
    }
    return MUR;
  }
  const plafond = (x) => (Math.abs(x) > L ? 4.4 : S.plafond); // (le tunnel est plus bas que la station)
  const estMur = (x, z) => hauteur(x, z) >= MUR - 0.01;

  // ------------------------------------------------------------------ les obstacles (des boîtes)
  // { x, z, dl (demi-longueur), dp (demi-largeur), angle, y0, y1 (du bas au haut), sorte, nom }
  const boites = [], parties = { quais: 2, voies: 2, rames: 0, voitures: 0, metros: 0, trams: 0, enFeu: 0, deraillees: 0, piliers: 0, bancs: 0, portiques: 0, gravats: 0, escaliers: 2, escalators: 2, lampes: 0 };
  const boite = (o) => (boites.push(o), o);
  // les rames : chaque voiture est une boîte (penchée si elle a déraillé)
  const voitures = [];
  for (const r of S.rames) {
    const [lon, lar, hau] = S.voiture[r.sorte], pas = lon + S.voiture.espace, ca = Math.cos(r.angle), sa = Math.sin(r.angle);
    parties.rames++;
    parties[r.sorte === "tram" ? "trams" : "metros"]++;
    if (r.feu) parties.enFeu++;
    if (Math.abs(r.angle) > 0.02) parties.deraillees++;
    for (let k = 0; k < r.voitures; k++) {
      const d = (k - (r.voitures - 1) / 2) * pas;
      const v = boite({ x: r.x + ca * d, z: V.rails[r.voie] + sa * d, dl: lon / 2, dp: lar / 2, angle: r.angle, y0: -V.profondeur, y1: -V.profondeur + hau + 0.25, sorte: r.sorte, nom: r.sorte === "tram" ? (r.feu ? "le tram en feu" : "le tram") : "la rame de métro", rame: r, k });
      voitures.push(v);
      parties.voitures++;
    }
  }
  // un point (x, z) dans une boîte (avec une marge) ? (on le ramène dans le repère de la boîte : le long, en travers)
  function dans(b, x, z, marge) {
    const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x - b.x, dz = z - b.z;
    return Math.abs(dx * c + dz * s) < b.dl + (marge || 0) && Math.abs(-dx * s + dz * c) < b.dp + (marge || 0);
  }
  const libre = (x, z, marge) => !voitures.some((v) => dans(v, x, z, marge));
  // les piliers : le long du fond des deux quais, et entre les deux voies (sauf là où une rame déraillée est tombée)
  const P = S.piliers, piliers = [];
  for (let x = -L + 4; x <= L - 4; x += P.ecart) {
    for (const z of [-P.z, P.z, 0]) {
      if (z === 0 && !libre(x, z, 0.6)) continue;
      piliers.push(boite({ x, z, dl: P.cote / 2, dp: P.cote / 2, angle: 0, y0: -5, y1: S.plafond + 1, sorte: "pilier", nom: "un pilier" }));
      parties.piliers++;
    }
  }
  // les bancs : entre les piliers, le dos vers le mur du fond
  const bancs = [];
  for (let x = -L + 10; x <= L - 10; x += S.bancs.ecart) {
    if (RAMPES.some((R) => x > R.x0 - 4 && x < R.x1 + 4)) continue; // (pas devant un escalier ou un escalator)
    for (const z of [-S.bancs.z, S.bancs.z]) {
      bancs.push(boite({ x, z, dl: 1.1, dp: 0.32, angle: 0, y0: 0, y1: 0.55, sorte: "banc", nom: "un banc" }));
      parties.bancs++;
    }
  }
  // la rambarde de la mezzanine (au bord, au-dessus du quai), sauf devant les escaliers et les escalators
  const RAMBARDE = 1.1;
  for (const sz of [-1, 1]) {
    let x0 = -M.demiX;
    const coupures = RAMPES.map((R) => [R.x0, R.x1]).sort((a, b) => a[0] - b[0]);
    for (const [a, b] of coupures.concat([[M.demiX, M.demiX]])) {
      if (a - x0 > 0.5) boite({ x: (x0 + a) / 2, z: sz * (S.quai.fond + 0.12), dl: (a - x0) / 2, dp: 0.12, angle: 0, y0: M.hauteur, y1: M.hauteur + RAMBARDE, sorte: "rambarde", nom: "la rambarde" });
      x0 = b;
    }
    // les portiques (les tourniquets des tickets) : deux rangées de poteaux, avec des passages entre eux
    for (const px of [-8, 8]) for (let z = S.quai.fond + 1.2; z < M.fond - 0.5; z += 2) {
      boite({ x: px, z: sz * z, dl: 0.5, dp: 0.15, angle: 0, y0: M.hauteur, y1: M.hauteur + 1.05, sorte: "portique", nom: "un portique" });
      parties.portiques++;
    }
  }
  // des tas de gravats (le plafond s'est un peu effondré) et un morceau d'escalator tombé sur le quai
  const GRAVATS = [[-52, 13.9, 2.2, 0.9, 0.1, 1.3], [62, -13.9, 2.6, 0.9, -0.08, 1.5], [-6, 13.9, 1.8, 0.9, 0.12, 1.1], [74, 13.9, 3.2, 0.9, 0.05, 1.2]]; // (contre le mur du fond : pas sur les routes)
  for (const [x, z, dl, dp, angle, h] of GRAVATS) {
    boite({ x, z, dl, dp, angle, y0: 0, y1: h, sorte: "gravats", nom: "un tas de gravats" });
    parties.gravats++;
  }
  // (livre n° 25) LES QG : le mur du bout avec sa PORTE (2 morceaux de mur et le linteau au-dessus), des sacs de sable de
  // chaque côté de la porte (pour s'abriter), un grand bureau avec les cartes, 2 bureaux de radios et d'écrans, le groupe
  // électrogène et les 3 BAIES contre le mur du fond. (u = vers le fond de la salle, v = vers le mur du quai.)
  for (const e in QG) {
    const q = QG[e], ici = (u, v) => ({ x: q.sx * u, z: q.sz * v });
    const mur = (v0, v1, y0, y1) => boite(Object.assign(ici(L + 0.25, (v0 + v1) / 2), { dl: 0.25, dp: (v1 - v0) / 2, angle: 0, y0, y1, sorte: "mur-qg", nom: "le mur " + q.nom.replace(/^le /, "du ") }));
    mur(q.z0 - 0.5, q.porte[0], -5, MUR);
    mur(q.porte[1], q.z1 + 0.5, -5, MUR);
    mur(q.porte[0], q.porte[1], Q.hauteurPorte, MUR);
    const objet = (u, v, dl, dp, h, sorte, nom) => boite(Object.assign(ici(u, v), { dl, dp, angle: 0, y0: 0, y1: h, sorte, nom: nom + " (" + q.nom + ")", qgDe: e }));
    objet(L + 2.4, (q.z0 + q.porte[0]) / 2 - 0.2, 0.35, (q.porte[0] - q.z0) / 2 - 0.4, 1.05, "sacs", "les sacs de sable");
    objet(L + 2.4, (q.porte[1] + q.z1) / 2 + 0.2, 0.35, (q.z1 - q.porte[1]) / 2 - 0.4, 1.05, "sacs", "les sacs de sable");
    objet(L + 8.5, 10, 1.7, 0.85, 0.82, "bureau", "la table des cartes");
    objet(L + 5.5, q.z1 - 0.5, 1.6, 0.4, 0.8, "bureau", "le bureau des radios");
    objet(L + 12, q.z0 + 0.5, 1.6, 0.4, 0.8, "bureau", "le bureau des écrans");
    objet(L + 15.5, q.z1 - 0.7, 1.1, 0.55, 1.3, "groupe", "le groupe électrogène");
    Q.baies.forEach((v, k) => q.baies.push(objet(L + Q.profondeur - 0.6, v, 0.45, 0.62, 2.1, "baie", "la baie n° " + (k + 1))));
    q.porteX = q.sx * L;
    q.porteZ = q.sz * (q.porte[0] + q.porte[1]) / 2;
    q.centre = ici(L + Q.profondeur / 2, (q.z0 + q.z1) / 2);
  }
  // (les escalators : chacun des deux a sa rampe ; l'un des deux est cassé, ses marches manquent — c'est le dessin)
  parties.lampes = Math.floor(S.longueur / S.lampes.ecart) * 2;

  // le quadrillage des boîtes : « qu'y a-t-il près de moi ? » = ma case et ses voisines
  const grille = Tanks.Grille.creer(S.longueur + 2 * S.tunnel + 40, 8);
  for (const b of boites) (b.rayon = Math.hypot(b.dl, b.dp)), Tanks.Grille.ajouter(grille, b, b.x, b.z, b.rayon);
  const proches = [];

  // ------------------------------------------------------------------ « est-ce que je peux aller là ? »
  // Pousse un soldat (un cercle de rayon r) hors des boîtes, puis vérifie la MARCHE : si le sol devant lui est plus haut
  // que « marche » au-dessus de ses pieds, il reste où il était (on essaie d'abord de glisser le long du mur).
  function plusHaut(x, z, r) {
    let h = hauteur(x, z);
    for (const [dx, dz] of [[r, 0], [-r, 0], [0, r], [0, -r]]) h = Math.max(h, hauteur(x + dx * 0.7, z + dz * 0.7));
    return h;
  }
  function repousser(o, r) {
    let touche = null;
    const pieds = o.y === undefined ? 0 : o.y;
    for (const b of Tanks.Grille.chercher(grille, o.x, o.z, r + 1, proches)) {
      if (pieds + 1.7 < b.y0 || pieds > b.y1 - 0.2) continue; // (au-dessus ou en dessous : on passe)
      const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = o.x - b.x, dz = o.z - b.z;
      const u = dx * c + dz * s, v = -dx * s + dz * c, eu = b.dl + r - Math.abs(u), ev = b.dp + r - Math.abs(v);
      if (eu <= 0 || ev <= 0) continue;
      // on sort par le côté le plus proche
      let nu = u, nv = v;
      if (eu < ev) nu = Math.sign(u || 1) * (b.dl + r);
      else nv = Math.sign(v || 1) * (b.dp + r);
      o.x = b.x + nu * c - nv * s;
      o.z = b.z + nu * s + nv * c;
      touche = b;
    }
    // la marche : un mur, ou une marche trop haute ?
    if (o.ancienX !== undefined && plusHaut(o.x, o.z, r) > pieds + S.marche) {
      if (plusHaut(o.x, o.ancienZ, r) <= pieds + S.marche) o.z = o.ancienZ;
      else if (plusHaut(o.ancienX, o.z, r) <= pieds + S.marche) o.x = o.ancienX;
      else (o.x = o.ancienX), (o.z = o.ancienZ);
      touche = touche || BOITE;
    }
    o.ancienX = o.x;
    o.ancienZ = o.z;
    return touche;
  }
  const BOITE = { nom: "le mur de la station", sorte: "station", type: "station" };

  // ------------------------------------------------------------------ « la ligne touche-t-elle quelque chose ? »
  // Renvoie null, ou le premier point touché : { t (0 au départ, 1 à l'arrivée), x, y, z, nx, ny, nz (la face) }.
  // seulementSi : on veut juste savoir oui / non (on s'arrête au premier obstacle trouvé).
  const coup = { t: 1, x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, quoi: null };
  const bilan = { lignes: 0, pas: 0 };
  function ligne(x1, y1, z1, x2, y2, z2, seulementSi) {
    bilan.lignes++;
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, longueur = Math.hypot(dx, dy, dz);
    let meilleur = 1.0000001, quoi = null, nx = 0, ny = 0, nz = 0;
    // 1. les boîtes proches (la méthode des tranches, dans le repère de chaque boîte)
    const r = Math.hypot(dx, dz) / 2 + 2;
    const liste = r > 40 ? boites : Tanks.Grille.chercher(grille, (x1 + x2) / 2, (z1 + z2) / 2, r, proches);
    for (const b of liste) {
      const c = Math.cos(b.angle), s = Math.sin(b.angle), px = x1 - b.x, pz = z1 - b.z;
      const pu = px * c + pz * s, pv = -px * s + pz * c, du = dx * c + dz * s, dv = -dx * s + dz * c;
      let t0 = 0, t1 = meilleur, axe = -1, signe = 1;
      const tranches = [[pu, du, -b.dl, b.dl, 0], [y1, dy, b.y0, b.y1, 1], [pv, dv, -b.dp, b.dp, 2]];
      let ok = true;
      for (const [p, d, lo, hi, k] of tranches) {
        if (Math.abs(d) < 1e-9) {
          if (p < lo || p > hi) (ok = false);
          continue;
        }
        let ta = (lo - p) / d, tb = (hi - p) / d, sg = -1;
        if (ta > tb) ([ta, tb] = [tb, ta]), (sg = 1);
        if (ta > t0) (t0 = ta), (axe = k), (signe = sg);
        if (tb < t1) t1 = tb;
        if (t0 > t1) (ok = false);
        if (!ok) break;
      }
      if (!ok || t0 >= meilleur) continue;
      meilleur = t0;
      quoi = b;
      if (axe === 0) (nx = c * signe), (ny = 0), (nz = s * signe);
      else if (axe === 2) (nx = -s * signe), (ny = 0), (nz = c * signe);
      else if (axe === 1) (nx = 0), (ny = signe), (nz = 0);
      else (nx = -dx / (longueur || 1)), (ny = -dy / (longueur || 1)), (nz = -dz / (longueur || 1));
      if (seulementSi) return coup;
    }
    // 2. le sol, les murs et le plafond : on avance par pas de 35 cm (pas plus loin que la boîte trouvée)
    const n = Math.max(1, Math.ceil(longueur / 0.35));
    let ax = x1, az = z1;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      if (t >= meilleur) break;
      const x = x1 + dx * t, y = y1 + dy * t, z = z1 + dz * t;
      bilan.pas++;
      const h = hauteur(x, z);
      if (y < h || y > plafond(x)) {
        meilleur = t;
        quoi = BOITE;
        if (y > plafond(x)) (nx = 0), (ny = -1), (nz = 0);
        else if (h - hauteur(ax, az) > S.marche && y >= hauteur(ax, az)) { // un mur : de quel côté est-on entré ?
          if (hauteur(x, az) > y) (nx = -Math.sign(dx)), (ny = 0), (nz = 0);
          else (nx = 0), (ny = 0), (nz = -Math.sign(dz));
        } else (nx = 0), (ny = 1), (nz = 0);
        break;
      }
      ax = x;
      az = z;
    }
    if (!quoi) return null;
    Object.assign(coup, { t: meilleur, x: x1 + dx * meilleur, y: y1 + dy * meilleur, z: z1 + dz * meilleur, nx, ny, nz, quoi });
    return coup;
  }

  // ------------------------------------------------------------------ les soldats et leurs routes
  // Une ROUTE, c'est une liste de points, de son bout de la station jusqu'au bout d'en face. (Pour les Rouges : la même
  // liste, à l'envers.) Le long d'un quai, ou en passant par la mezzanine (escalator d'un côté, escalier de l'autre).
  const XE = (S.escalators.x0 + S.escalators.x1) / 2, XS = (S.escaliers.x0 + S.escaliers.x1) / 2, ZM = M.fond - 2;
  const ROUTES = [
    { nom: "le quai nord", points: (j) => [[L - 4, -7 - j], [-L + 4, -7 - j]] },
    { nom: "le quai sud", points: (j) => [[L - 4, 7 + j], [-L + 4, 7 + j]] },
    { nom: "la mezzanine nord", points: (j) => [[L - 4, -7 - j], [XE + 6, -11], [XE, -13.5], [XE + j * 0.5, -ZM], [XS + j * 0.5, -ZM], [XS, -13.5], [XS - 6, -11], [-L + 4, -7 - j]] },
    { nom: "le quai sud", points: (j) => [[L - 4, 11 - j * 0.5], [-L + 4, 11 - j * 0.5]] },
    { nom: "la mezzanine sud", points: (j) => [[L - 4, 7 + j], [XE + 6, 11], [XE, 13.5], [XE + j * 0.5, ZM], [XS + j * 0.5, ZM], [XS, 13.5], [XS - 6, 11], [-L + 4, 7 + j]] },
    { nom: "le quai nord", points: (j) => [[L - 4, -11 + j * 0.5], [-L + 4, -11 + j * 0.5]] },
  ];
  // (livre n° 25) La route d'un GARDE (devant et dans son QG, en aller-retour) ou d'un SAPEUR (son quai, puis la porte
  // du QG ennemi, puis jusqu'aux baies). j : un petit décalage, pour qu'ils ne marchent pas tous à la file.
  function routeQG(equipe, role, j, cote) {
    const ennemi = equipe === "bleus" ? "rouges" : "bleus", q = QG[role === "garde" ? equipe : ennemi];
    if (!q) return null;
    const p = (u, v) => ({ x: q.sx * u, z: q.sz * v }), vp = (q.porte[0] + q.porte[1]) / 2;
    if (role === "garde") return [p(L - 7 - j, vp + j * 0.6), p(L - 1.5, vp), p(L + 4, vp - 1.5 + j), p(L + 9, q.z0 + 2 + j), p(L + 4, q.z1 - 2 - j * 0.5)];
    // une route de SON quai (« cote » : le côté où il arrive) ; si le QG ennemi est de l'autre côté des rails, il les
    // traverse au bout de la station, là où il n'y a ni pilier ni rame (à 6,5 m du mur du bout)
    const R = ROUTES.filter((r) => Math.sign(r.points(0)[0][1]) === cote && /quai/.test(r.nom))[Math.floor(j * 7) % 2]; // (le long d'un quai : le plus direct)
    let pts = R.points(j).map(([x, z]) => ({ x, z }));
    if (equipe === "rouges") pts = pts.reverse();
    pts.pop();
    const xt = q.sx * (L - 6.5);
    pts.push({ x: xt, z: cote * 7 });
    if (cote !== q.sz) pts.push({ x: xt, z: cote * 3 }, { x: xt, z: -cote * 3 }, { x: xt, z: -cote * 7 });
    return { nom: R.nom + " → " + q.nom, points: pts.concat([p(L - 2.5, vp + (j - 1) * 0.6), p(L + 1.5, vp), p(L + 5, vp), p(L + 10, vp + (j - 1) * 1.5)]) };
  }
  // Où arrive un soldat de ce camp ? (au bout de la station : les Bleus à l'est, les Rouges à l'ouest)
  function depart(equipe, n) {
    const sens = equipe === "bleus" ? 1 : -1, cote = n % 2 ? -1 : 1;
    return { x: sens * (L - 3 - (n % 4) * 2.2), z: cote * (6 + ((n * 7) % 5) * 1.6), angle: sens > 0 ? Math.PI : 0 };
  }
  // Un soldat de l'ordinateur qui arrive dans la station (au départ, ou en renfort).
  function soldat(equipe, n) {
    const p = depart(equipe, n);
    const s = Tanks.Soldat.creer(equipe, p.x, p.z, p.angle, (equipe === "bleus" ? "soldat bleu n° " : "soldat rouge n° ") + n);
    s.metro = true;
    const R = ROUTES[n % ROUTES.length], j = ((n * 37) % 10) / 10 * 2;
    let pts = R.points(j).map(([x, z]) => ({ x, z }));
    if (equipe === "rouges") pts = pts.reverse();
    s.ia = { pense: ((n % 6) / 6) * C.soldats.pense, cible: null, voit: false, couloir: 0, etat: "arrive dans la station", erreur: 0, route: pts, etape: 0, nomRoute: R.nom, n, j }; // (livre n° 25 : n et j, pour son rôle au QG)
    return s;
  }
  // Le prochain point de sa route (arrivé à moins de 2,5 m d'un point, il passe au suivant ; au bout, il repart dans
  // l'autre sens : il patrouille).
  // (Coincé derrière un obstacle depuis 5 s sans s'approcher du point ? il passe au point suivant.)
  function prochainPoint(s) {
    const ia = s.ia, r = ia.route;
    let p = r[ia.etape];
    const d = Math.hypot(p.x - s.x, p.z - s.z);
    if (ia.meilleur === undefined || d < ia.meilleur - 0.5) (ia.meilleur = d), (ia.coince = 0);
    else ia.coince += C.pasFixe;
    if (d < 2.5 || ia.coince > 5) {
      ia.meilleur = undefined;
      ia.etape++;
      if (ia.etape >= r.length && ia.sansRetour) ia.etape = r.length - 1; // (livre n° 25 : le sapeur ne rentre pas chez lui)
      else if (ia.etape >= r.length) (ia.route = r.slice().reverse()), (ia.etape = 1);
      p = ia.route[ia.etape];
    }
    return p;
  }
  // Ton départ : sur le quai sud, au bout des Bleus, tourné vers l'ouest.
  const toi = () => ({ x: L - 6, z: 6.5, angle: Math.PI });

  return { hauteur, plafond, estMur, repousser, ligne, boites, voitures, piliers, bancs, parties, bilan, soldat, prochainPoint, toi, depart, routes: ROUTES, rampes: RAMPES, BOITE, MUR, L, qg: QG, dansQG, routeQG };
})();
