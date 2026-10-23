// 🌬️ LE RÉALISME ABSURDE : le professeur de physique du champ de bataille (livre de demandes n° 26)
//
// ✍️ « Faire un réalisme absurde. » (= un réalisme EXTRÊME.) Comme un professeur de physique qui répond aux questions
// des autres fichiers, celui-ci sait :
//   - LE VENT (dehors seulement) : sa force et sa direction, qui tournent doucement, avec des RAFALES. Il pousse la fumée
//     (l'affichage le lit) et les BALLES : une balle qui vole longtemps (de loin) DÉRIVE sur le côté :
//     dérive (m) = vent de côté (m/s) × temps de vol (s) × « derive ». Dans la lunette, un indicateur te le dit ;
//   - LA TRAVERSÉE : une balle passe à travers une porte en bois, des planches, une haie, des tuiles, une portière, la
//     tôle d'un métro… et fait moins mal derrière (× le nombre de « traverse.matieres ») ; le béton et la brique l'arrêtent ;
//   - LE RICOCHET : une balle qui arrive en RASANT sur du béton, de la pierre ou du métal rebondit (des étincelles, un
//     « piouu ») : on calcule son REFLET (comme une balle de ping-pong) : r = d − 2 × (d · n) × n ;
//   - LA SUPPRESSION : les balles ennemies qui passent tout près de ta tête te font PEUR (de 0 à 1) : ta visée tremble ;
//   - LA FATIGUE : courir t'essouffle (de 0 à 1) : ta visée bouge plus, et on entend ton souffle ;
//   - et il COMPTE tout (pour « sous le capot ») : les balles qui ont traversé, les ricochets, les balles perdues dans les
//     chargeurs jetés (logique/armes.js), les enrayages…
// Tous les nombres sont dans config.js (« realismeAbsurde »). Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Realisme = (function () {
  const C = Tanks.CONFIG, RA = C.realismeAbsurde, T = Tanks.Terrain;
  const bilan = { traversees: 0, parMatiere: {}, ricochets: 0, frolements: 0, peurMax: 0, ballesPerdues: 0, chargeursJetes: 0, rechargementsVides: 0, rechargementsTactiques: 0, enrayages: 0, derives: 0, deriveMax: 0, fatigueMax: 0 };
  const vent = { x: 0, z: 0, force: 0, direction: 0, rafale: 1 };
  let monde = null;

  // ------------------------------------------------------------------ brancher (main.js, une fois)
  function brancher(m) {
    monde = m;
    const radio = Tanks.Evenements;
    radio.ecouter("balle", frole);
    for (const n of ["bataille", "souterrain"]) radio.ecouter(n, () => { for (const k in bilan) bilan[k] = typeof bilan[k] === "number" ? 0 : {}; });
  }

  // ------------------------------------------------------------------ 1. LE VENT
  function majVent(t) {
    const V = RA.vent;
    if (!V.actif || T.souterrain) return void Object.assign(vent, { x: 0, z: 0, force: 0, rafale: 1 });
    const w = (Math.PI * 2) / V.periode;
    vent.rafale = Math.max(0.2, 1 + V.rafales * (0.6 * Math.sin(t * w) + 0.4 * Math.sin(t * w * 2.7 + 1.3)));
    vent.direction = V.direction + V.tourne * Math.sin(t / 41);
    vent.force = V.force * vent.rafale;
    vent.x = Math.cos(vent.direction) * vent.force;
    vent.z = Math.sin(vent.direction) * vent.force;
  }
  // Le vent DE CÔTÉ pour un tir vers « angle » (m/s : positif = il pousse la balle vers ta droite).
  const ventTravers = (angle) => -vent.x * Math.sin(angle) + vent.z * Math.cos(angle);
  // La dérive d'une balle à « d » mètres (m, positif = vers la droite), à la vitesse « v » (m/s).
  function derive(angle, d, v) {
    if (!RA.vent.actif || !vent.force) return 0;
    return ventTravers(angle) * (d / (v || RA.vent.vitesse)) * RA.vent.derive;
  }
  function noterDerive(m) {
    bilan.derives++;
    bilan.deriveMax = Math.max(bilan.deriveMax, Math.abs(m));
  }

  // ------------------------------------------------------------------ 2. LA TRAVERSÉE et 3. LE RICOCHET
  // De quoi est fait ce qu'une balle a touché ? (la clé de « traverse.matieres » ; null : ça ne se traverse pas)
  function cleTraverse(m) {
    if (m.metro) return m.metro.sorte === "metro" || m.metro.sorte === "tram" ? "tole" : m.metro.sorte === "banc" ? "banc" : null;
    if (m.morceau) return m.morceau.matiere;
    return m.toit ? "tuiles" : m.plancher === "objet" ? "objet" : m.plancher === "plancher" ? "bois" : null;
  }
  // Ce qui reste des dégâts derrière (0 : la balle s'arrête)
  function traverse(m) {
    const R = RA.traverse;
    if (!R.actif) return 0;
    const cle = cleTraverse(m);
    return cle ? R.matieres[cle] || 0 : 0;
  }
  // l'épaisseur (m) la plus grande qu'une balle traverse dans cette matière (une porte : quelques cm ; une voiture : ses
  // deux portières, 2 m plus loin) ; plus épais : elle reste coincée dedans
  const epaisseur = (cle) => RA.traverse.epaisseurs[cle] || 0.6;
  function noterTraversee(cle) {
    bilan.traversees++;
    bilan.parMatiere[cle] = (bilan.parMatiere[cle] || 0) + 1;
  }
  // La balle (direction ux, uy, uz) touche une face (nx, ny, nz) de cette matière : ricoche-t-elle ? Renvoie la nouvelle
  // direction (et sa longueur), ou null.
  const reflet = { x: 0, y: 0, z: 0, longueur: 0 };
  function ricochet(ux, uy, uz, nx, ny, nz, matiere) {
    const R = RA.ricochet;
    if (!R.actif || !R.matieres.includes(matiere)) return null;
    const dn = ux * nx + uy * ny + uz * nz; // (négatif : la balle arrive contre la face)
    if (dn >= 0) return null;
    const rase = Math.asin(Math.min(1, -dn)); // l'angle entre la balle et la surface (0 = elle la frôle)
    if (rase > (R.angle * Math.PI) / 180 || Math.random() > R.chance) return null;
    let rx = ux - 2 * dn * nx + (Math.random() - 0.5) * R.ecart, ry = uy - 2 * dn * ny + Math.random() * R.ecart * 0.5, rz = uz - 2 * dn * nz + (Math.random() - 0.5) * R.ecart;
    const l = Math.hypot(rx, ry, rz) || 1;
    (reflet.x = rx / l), (reflet.y = ry / l), (reflet.z = rz / l);
    reflet.longueur = R.longueur[0] + Math.random() * (R.longueur[1] - R.longueur[0]);
    reflet.angle = Math.round((rase * 180) / Math.PI);
    bilan.ricochets++;
    return reflet;
  }

  // ------------------------------------------------------------------ 4. LA SUPPRESSION (une balle ennemie frôle ta tête)
  function frole(d) {
    const P = RA.suppression;
    if (!P.actif || !monde || monde.phase !== "bataille" || !d.de || !d.a || d.parToi || d.suite) return;
    const t = monde.toi, s = t && t.mode === "pied" ? t.soldat : null;
    if (!s || s.mort || d.equipeTireur === s.equipe || d.touche) return;
    const dx = d.a.x - d.de.x, dy = d.a.y - d.de.y, dz = d.a.z - d.de.z, l = Math.hypot(dx, dy, dz) || 1;
    const ox = s.x - d.de.x, oy = s.y + 1.5 - d.de.y, oz = s.z - d.de.z, k = (ox * dx + oy * dy + oz * dz) / l;
    if (k < 3 || k > l + 1) return;
    const ecart = Math.hypot(ox - (dx / l) * k, oy - (dy / l) * k, oz - (dz / l) * k);
    if (ecart > P.distance) return;
    s.peur = Math.min(1, (s.peur || 0) + P.gain * (1 - ecart / P.distance));
    s.peurAttente = P.attente;
    bilan.frolements++;
    bilan.peurMax = Math.max(bilan.peurMax, s.peur);
  }

  // ------------------------------------------------------------------ chaque petit pas (logique/monde.js)
  function etape(m, dt) {
    monde = m;
    majVent(m.temps || 0);
    m.vent = vent;
    const t = m.toi, s = t && t.soldat;
    if (!s) return;
    // la peur redescend (après « attente » s sans balle)
    if (s.peur > 0) {
      s.peurAttente = (s.peurAttente || 0) - dt;
      if (s.peurAttente <= 0) s.peur = Math.max(0, s.peur - RA.suppression.baisse * dt);
    }
    if (!RA.suppression.actif || s.mort || t.mode !== "pied") s.peur = 0;
    // la fatigue : elle monte quand tu cours, redescend quand tu marches, plus vite à l'arrêt ou accroupi
    const F = RA.fatigue;
    if (!F.actif || t.mode !== "pied" || s.mort) return void (s.fatigue = 0);
    const vmax = C.soldats.vitesse * (s.armes ? Tanks.Armes.mobilite(s) : 1);
    const court = !s.accroupi && !s.nage && (s.visee || 0) < 0.3 && Math.abs(s.vitesse) > vmax * F.course;
    if (court) s.fatigue = Math.min(1, (s.fatigue || 0) + F.gain * dt);
    else if (s.fatigue > 0) s.fatigue = Math.max(0, s.fatigue - F.recup * dt * (s.accroupi ? 2.5 : Math.abs(s.vitesse) < 0.3 ? 2 : 1));
    bilan.fatigueMax = Math.max(bilan.fatigueMax, s.fatigue || 0);
  }

  return { brancher, etape, vent, ventTravers, derive, noterDerive, traverse, cleTraverse, epaisseur, noterTraversee, ricochet, bilan };
})();
