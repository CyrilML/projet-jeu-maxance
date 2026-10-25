// 🏙️ LA VILLE ABANDONNÉE : l'urbaniste… et le témoin de la fuite (livre de demandes n° 9 et 11)
//
// ✍️ « Faire une map en ville très réaliste. » ✍️ « Faire comme si la map avait été abandonnée rapidement : laisser les
// affiches, les publicités, les véhicules et parfois même des objets du quotidien (téléphone, table, sac à dos). »
// Sur les cartes « la ville » et « la ville en ruines », cet urbaniste invente (toujours pareil, grâce à la graine) tout ce
// qu'il y a dans les rues, en suivant le plan en damier de logique/terrain.js :
//   - les TROTTOIRS (une bordure de 15 cm), les passages piétons, les lignes, les plaques d'égout ;
//   - le mobilier : lampadaires, feux, panneaux, abribus, bancs, poubelles, arbres en bac, kiosques, panneaux de pub ;
//   - les VOITURES : garées le long du trottoir, ou abandonnées de travers au milieu de la rue, portes ouvertes (les gens
//     sont partis en courant !), certaines accidentées, certaines brûlées ; des scooters couchés, un ou deux bus ;
//   - les FAÇADES : des boutiques (un store, une enseigne), des balcons avec du linge, des climatiseurs, des affiches ;
//   - les OBJETS DU QUOTIDIEN laissés là : téléphones, sacs à dos, valises, nounours, ballons, journaux, cartons, vestes,
//     caddies, vélos, tables et chaises de café renversées… et des papiers partout.
// Les règles :
//   - les gros objets (voitures, bus, kiosques, abribus, bacs) sont SOLIDES : on se cache derrière, ils arrêtent les balles
//     et les regards (logique/structures.js leur demande, comme aux murs) ; un tank qui roule les POUSSE (la voiture glisse) ;
//   - une voiture a des POINTS de vie : les explosions (et un peu les balles) l'abîment ; à 0, elle EXPLOSE et brûle ;
//   - un tank ou un engin lancé (plus de 2,5 m/s) ÉCRASE les petits objets (bancs, poubelles, chaises, objets…) et
//     couche les lampadaires et les panneaux ; une explosion souffle les petits objets tout près.
// Ce fichier ne dessine rien (c'est affichage/ville3d.js). Il renvoie des événements (« voiture-detruite »).

window.Tanks = window.Tanks || {};

Tanks.Ville = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, ST = Tanks.Structures, VAR = T.variante || {}, Q = VAR.quartier;
  const actif = !!(Q && VAR.ville);
  const V = Object.assign({}, C.ville, VAR.ville === "ruines" ? C.ville.ruines : {});
  const PARTS = Object.assign({}, C.ville.parts, VAR.ville === "ruines" ? { brulees: C.ville.ruines.brulees, accidentees: C.ville.ruines.accidentees } : {});
  const bilan = { parSorte: {}, total: 0, solides: 0, ecrases: 0, souffles: 0, detruites: 0, poussees: 0, balles: 0, accroches: 0, rues: 0, ilots: 0, carrefours: 0 };
  const objets = [], solides = [], petits = [], accroches = [], sols = { trottoirs: [], passages: [], lignes: [], egouts: [], lots: [] };
  let graine = (C.monde.graine || 7) * 977 + 31;
  const h = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  const choix = (l) => l[Math.floor(h() * l.length)];
  const COULEURS_VOITURES = [0xb8bcc0, 0x2a2d33, 0xf0f0ee, 0x8c1c1c, 0x1f3f78, 0x4d5a3a, 0xc9a227, 0x6b6f75, 0x7a2f5a, 0x2f6d6a, 0xd06a20];

  // ------------------------------------------------------------------ 1. Ajouter des objets
  function ajouter(o) {
    o.depart = { x: o.x, z: o.z, angle: o.angle, rot: o.rot, brule: !!o.brule, vie: o.vie, ecrase: false };
    o.y = T.hauteur(o.x, o.z);
    objets.push(o);
    bilan.parSorte[o.sorte] = (bilan.parSorte[o.sorte] || 0) + 1;
    bilan.total++;
    if (o.solide) {
      o.boite = { nom: o.nom || "l'objet", sorte: o.sorte, objet: o, x: o.x, z: o.z };
      solides.push(o);
      bilan.solides++;
    }
    if (o.ecrasable) petits.push(o);
    return o;
  }
  // un objet SOLIDE : demiL (le long), demiP (en travers), h (haut) ; angle : la direction de sa longueur
  const solide = (sorte, x, z, angle, demiL, demiP, haut, plus) => ajouter(Object.assign({ sorte, x, z, angle, demiL, demiP, h: haut, solide: true }, plus));
  // un petit objet (rot : la rotation d'affichage) ; ecrasable : un tank le fait disparaître (ou le couche)
  const petit = (sorte, x, z, rot, plus) => ajouter(Object.assign({ sorte, x, z, rot, ecrasable: true }, plus));
  // pas trop près d'une porte de maison (on doit pouvoir entrer) ni d'un autre objet posé
  const portes = Tanks.Interieurs ? Tanks.Interieurs.maisons.map((b) => b.porte) : [];
  const libre = (x, z, d) => portes.every((p) => Math.hypot(p.x - x, p.z - z) > 2.2) && objets.every((o) => !o.solide || Math.hypot(o.x - x, o.z - z) > d + Math.max(o.demiL, o.demiP));

  // Sur un TROTTOIR ? (la hauteur en plus : la bordure) — d'un îlot bâti seulement
  const ilotBati = (x, z) => { const gi = Math.floor((x - Q.x) / Q.ilot), gj = Math.floor((z - Q.z) / Q.ilot); return Math.hypot((gi + 0.5) * Q.ilot, (gj + 0.5) * Q.ilot) <= Q.rayon - Q.ilot * 0.3; };
  function trottoir(x, z) {
    if (!actif) return 0;
    const I = Q.ilot, lx = ((((x - Q.x) % I) + I) % I) - I / 2, lz = ((((z - Q.z) % I) + I) % I) - I / 2, m = Math.max(Math.abs(lx), Math.abs(lz));
    return m <= I / 2 - V.rue.chaussee / 2 && m >= I / 2 - Q.rue / 2 - 1.05 && ilotBati(x, z) ? V.rue.bordure : 0;
  }
  if (actif) inventer();

  function inventer() {
    const n = Math.floor(Q.rayon / Q.ilot), I = Q.ilot, demiI = I / 2, bord = demiI - V.rue.chaussee / 2; // (bord : la bordure du trottoir, depuis le milieu de l'îlot)
    const maisons = T.boites.filter((b) => b.quartier && b.type === "maison");
    const bati = (gi, gj) => Math.hypot(Q.x + (gi + 0.5) * I - Q.x, Q.z + (gj + 0.5) * I - Q.z) <= Q.rayon - I * 0.3;
    // --- les bus, abandonnés de travers au milieu de la rue (placés en premier : ils prennent de la place)
    const nbBus = VAR.ville === "ruines" ? 3 : 2;
    for (let k = 0, essais = 0; k < nbBus && essais < 40; essais++) {
      const i = Math.floor((h() - 0.5) * 2 * (n - 1)), j = Math.floor((h() - 0.5) * 2 * (n - 1)), long = h() < 0.5;
      const x = Q.x + (long ? (i + 0.5) * I : i * I), z = Q.z + (long ? j * I : (j + 0.5) * I);
      if (!bati(i, j) || !libre(x, z, 7)) continue;
      solide("bus", x, z, (long ? 0 : Math.PI / 2) + (h() - 0.5) * 0.5, 6, 1.27, 3.1, { nom: "le bus abandonné", vie: V.busVie, couleur: choix([0x2f7a3a, 0xc8a02a, 0x2a5a9a]), brule: h() < PARTS.brulees, mobile: false, pub: Math.floor(h() * 4), portes: [h() < 0.8] });
      k++;
    }
    // --- les îlots bâtis : un trottoir tout autour, et ce qu'on pose dessus
    for (let gi = -n; gi < n; gi++) for (let gj = -n; gj < n; gj++) {
      if (!bati(gi, gj)) continue;
      bilan.ilots++;
      const cx = Q.x + (gi + 0.5) * I, cz = Q.z + (gj + 0.5) * I;
      sols.trottoirs.push({ x: cx, z: cz, interieur: demiI - Q.rue / 2 - 1, exterieur: bord });
      // les 4 côtés : [direction le long (x ou z), signe du côté]
      for (const [axe, sg] of [["x", 1], ["x", -1], ["z", 1], ["z", -1]]) {
        // un point du côté : « a » le long (de −bord à +bord), « t » la distance au milieu de l'îlot
        const pt = (a, t) => (axe === "x" ? { x: cx + a, z: cz + sg * t } : { x: cx + sg * t, z: cz + a });
        const angleRue = axe === "x" ? 0 : Math.PI / 2; // (la rue de ce côté va le long de x, ou le long de z)
        const versRue = axe === "x" ? (sg > 0 ? Math.PI / 2 : -Math.PI / 2) : sg > 0 ? 0 : Math.PI; // (direction du trottoir vers la rue)
        // les lampadaires (au bord du trottoir), en quinconce
        for (let a = -bord + 6 + ((gi + gj + (sg > 0 ? 1 : 0)) % 2) * (V.lampadaire / 2); a < bord - 4; a += V.lampadaire) {
          const p = pt(a, bord - 0.35);
          if (libre(p.x, p.z, 0.5)) petit("lampadaire", p.x, p.z, -versRue, { couche: true, hauteur: 6 });
        }
        // un arbre dans son bac
        if (h() < 0.7) {
          const p = pt((h() - 0.5) * (bord * 1.2), bord - 0.95);
          if (libre(p.x, p.z, 1)) solide("bac", p.x, p.z, angleRue, 0.6, 0.6, 0.55, { ecrasable: true, arbre: 0.85 + h() * 0.4, nom: "un arbre en bac" });
        }
        // bancs, poubelles, abribus, kiosques, panneaux
        if (h() < V.banc) { const p = pt((h() - 0.5) * bord * 1.4, bord - 1.2); if (libre(p.x, p.z, 0.8)) petit("banc", p.x, p.z, -versRue); }
        if (h() < V.poubelle) { const p = pt((h() - 0.5) * bord * 1.5, bord - 0.6); if (libre(p.x, p.z, 0.4)) petit("poubelle", p.x, p.z, h() * 6, { renversee: h() < 0.3 }); }
        if (h() < V.abribus) { const p = pt((h() - 0.5) * bord * 0.8, bord - 1.2); if (libre(p.x, p.z, 2.5)) solide("abribus", p.x, p.z, angleRue, 1.9, 0.7, 2.5, { nom: "l'abribus", rotAffiche: -versRue + Math.PI, pub: Math.floor(h() * 8) }); }
        if (h() < V.panneau) { const p = pt(bord - 1.2, bord - 0.3); petit("panneau", p.x, p.z, -versRue, { couche: true, modele: Math.floor(h() * 3) }); }
        // les voitures garées le long du trottoir (sur la file de stationnement), parfois abandonnées au milieu
        for (let a = -bord + 4.5 + h() * 3; a < bord - 4.5; a += V.voiture * (0.6 + h() * 0.8)) {
          if (h() < 0.25) continue;
          const milieu = h() < PARTS.milieu, accident = !milieu && h() < PARTS.accidentees;
          const t = milieu ? bord + 2.2 + h() * 1.8 : bord + 1.15;
          const p = pt(a, t), ang = angleRue + (h() < 0.5 ? 0 : Math.PI) + (milieu ? (h() - 0.5) * 1.6 : accident ? (h() - 0.5) * 0.9 : (h() - 0.5) * 0.06);
          voiture(p.x, p.z, ang, accident);
        }
      }
      // --- les objets du quotidien et les papiers, sur les trottoirs et la chaussée autour de l'îlot
      const surRing = () => { // un point au hasard sur le trottoir ou le bord de la chaussée
        const cote = Math.floor(h() * 4), a = (h() - 0.5) * 2 * (bord + 2), t = demiI - Q.rue / 2 - 0.8 + h() * 5.5;
        return cote === 0 ? { x: cx + a, z: cz + t } : cote === 1 ? { x: cx + a, z: cz - t } : cote === 2 ? { x: cx + t, z: cz + a } : { x: cx - t, z: cz + a };
      };
      for (let k = 0; k < V.objets; k++) {
        const p = surRing(), s = choix(["sac", "sac", "valise", "valise", "telephone", "telephone", "ours", "ballon", "journal", "journal", "carton", "veste", "caddie", "velo", "chaussure"]);
        if (!libre(p.x, p.z, 0.3)) continue;
        petit(s, p.x, p.z, h() * 6.28, { couleur: choix([0x2b3a55, 0x7a2e2e, 0x3e5a3e, 0x222222, 0x8a6a3a, 0xc0c0c0, 0x5a3a6a, 0xd0a020]), ouvert: h() < 0.4, couche: s === "velo" || s === "caddie" ? h() < 0.6 : false });
      }
      for (let k = 0; k < V.papiers; k++) {
        const p = surRing();
        objets.push({ sorte: "papier", x: p.x, z: p.z, y: T.hauteur(p.x, p.z), rot: h() * 6.28, taille: 0.18 + h() * 0.3, teinte: h() });
      }
      bilan.parSorte.papier = (bilan.parSorte.papier || 0) + V.papiers;
      // --- les coins sans maison : un parking, un panneau de pub, ou une petite place
      // (demande 115, Guerre civile : pas dans un pâté « vide » — la place de l'Horloge, le souk —, il a son propre décor)
      if (!(Q.vides || []).some(([vi, vj]) => vi === gi && vj === gj)) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const qx = cx + sx * 7, qz = cz + sz * 7;
        if (maisons.some((b) => Math.abs(b.x - qx) < 7 + b.demiL && Math.abs(b.z - qz) < 7 + b.demiL && Math.sign(b.x - cx) === sx && Math.sign(b.z - cz) === sz)) continue;
        const genre = h();
        sols.lots.push({ x: qx, z: qz, genre: genre < 0.4 ? "parking" : genre < 0.7 ? "pub" : "place" });
        if (genre < 0.4) { // un parking : des voitures en épi (certaines sont parties… les autres sont restées)
          for (let i = -1; i <= 1; i++) for (const r of [-1, 1]) if (h() < 0.6) voiture(qx + i * 3.2, qz + r * 3, Math.PI / 2 + (h() - 0.5) * 0.15, false);
        } else if (genre < 0.7) { // un grand panneau de pub (sur ses 2 pieds) et des barrières de chantier
          ajouter({ sorte: "pub", x: qx, z: qz, rot: sx * sz > 0 ? Math.PI / 4 : -Math.PI / 4, pub: Math.floor(h() * 4) });
          for (let i = -2; i <= 2; i++) if (h() < 0.75) petit("barriere", qx + i * 2.3 * (sz > 0 ? 1 : 1), qz - sz * 5.5, h() < 0.25 ? 0.4 : 0, { couche: h() < 0.2 });
        } else { // une petite place : un kiosque, des bancs, des arbres
          if (h() < 0.7 && libre(qx, qz, 2)) solide("kiosque", qx, qz, h() < 0.5 ? 0 : Math.PI / 2, 1.4, 1.1, 2.7, { nom: "le kiosque à journaux", pub: Math.floor(h() * 8) });
          for (const [dx, dz] of [[-4, 0], [4, 0], [0, 4], [0, -4]]) if (h() < 0.5 && libre(qx + dx, qz + dz, 1)) solide("bac", qx + dx, qz + dz, 0, 0.6, 0.6, 0.55, { ecrasable: true, arbre: 0.9 + h() * 0.4, nom: "un arbre en bac" });
          for (let i = 0; i < 3; i++) if (h() < 0.6) petit("banc", qx + (h() - 0.5) * 8, qz + (h() - 0.5) * 8, h() * 6.28);
        }
      }
    }
    // --- les carrefours : feux, passages piétons, plaques d'égout ; et les lignes au milieu des rues
    for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) {
      const ix = Q.x + i * I, iz = Q.z + j * I;
      const voisins = [[i - 1, j - 1], [i, j - 1], [i - 1, j], [i, j]].filter(([a, b]) => bati(a, b)).length;
      if (!voisins) continue;
      bilan.carrefours++;
      // les 4 branches du carrefour : un passage piéton sur celles qui longent un îlot bâti
      const branches = [[1, 0, bati(i, j) || bati(i, j - 1)], [-1, 0, bati(i - 1, j) || bati(i - 1, j - 1)], [0, 1, bati(i, j) || bati(i - 1, j)], [0, -1, bati(i, j - 1) || bati(i - 1, j - 1)]];
      for (const [dx, dz, ok] of branches) {
        if (!ok) continue;
        sols.passages.push({ x: ix + dx * (demiI - bord + 2.2), z: iz + dz * (demiI - bord + 2.2), long: dx !== 0 }); // (« long » : les bandes vont le long de x)
        // la ligne pointillée au milieu, jusqu'au carrefour suivant (une seule fois par rue : vers +x et vers +z)
        if (dx > 0 || dz > 0) sols.lignes.push({ x0: ix + dx * (demiI - bord + 4.5), z0: iz + dz * (demiI - bord + 4.5), x1: ix + dx * (I - (demiI - bord + 4.5)), z1: iz + dz * (I - (demiI - bord + 4.5)) });
        bilan.rues++;
      }
      // les feux tricolores, à 2 coins
      for (const [sx, sz] of [[1, 1], [-1, -1]]) {
        if (!bati(sx > 0 ? i : i - 1, sz > 0 ? j : j - 1)) continue;
        petit("feu", ix + sx * (demiI - bord + 0.4), iz + sz * (demiI - bord + 0.4), sx > 0 ? Math.PI : 0, { couche: true });
      }
      sols.egouts.push({ x: ix + (h() - 0.5) * 4, z: iz + (h() - 0.5) * 4 });
      if (h() < 0.5) sols.egouts.push({ x: ix + (h() < 0.5 ? 1 : -1) * 11, z: iz + (h() - 0.5) * 2 });
    }
    // --- les scooters couchés
    for (let k = 0; k < bilan.ilots * 0.6; k++) {
      const p = { x: Q.x + (h() - 0.5) * Q.rayon * 1.6, z: Q.z + (h() - 0.5) * Q.rayon * 1.6 };
      const ix = ((((p.x - Q.x) % I) + I) % I), iz = ((((p.z - Q.z) % I) + I) % I);
      if (!(ix < Q.rue / 2 + 1 || ix > I - Q.rue / 2 - 1 || iz < Q.rue / 2 + 1 || iz > I - Q.rue / 2 - 1) || !libre(p.x, p.z, 1)) continue;
      petit("scooter", p.x, p.z, h() * 6.28, { couleur: choix(COULEURS_VOITURES), couche: h() < 0.6 });
    }
    // --- les FAÇADES : boutiques, enseignes, stores, balcons, linge, climatiseurs, affiches (accrochés à un morceau de mur)
    for (const b of maisons) {
      if (b.ruineDepart) continue;
      const ilotX = Q.x + (Math.floor((b.x - Q.x) / I) + 0.5) * I, ilotZ = Q.z + (Math.floor((b.z - Q.z) / I) + 0.5) * I;
      const c = Math.cos(b.angle), s = Math.sin(b.angle);
      const boutique = h() < V.boutiques ? Math.floor(h() * 2) : -1; // (sur le 1er ou le 2e mur qui donne sur la rue)
      let murRue = 0, enseigneFaite = false;
      b.murs.forEach((mur, im) => {
        // la normale du mur (vers dehors), dans le monde ; donne-t-il sur la rue (dos au milieu de l'îlot) ?
        const nu = mur.axe === "u" ? 0 : mur.sens, nv = mur.axe === "u" ? mur.sens : 0, nx = nu * c - nv * s, nz = nu * s + nv * c;
        const surRue = nx * (b.x - ilotX) + nz * (b.z - ilotZ) > 3;
        if (!surRue) return;
        const estBoutique = murRue++ === boutique;
        const rot = Math.atan2(nx, nz), couleurStore = choix([0xb03a2e, 0x2e6a3a, 0x2a4f8a, 0x8a6a2a, 0x5a2e5a, 0x3a3a3a]);
        for (const col of mur.colonnes) for (const m of col.morceaux) {
          const a = (m.a0 + m.a1) / 2, uL = mur.axe === "u" ? a : mur.pos + mur.sens * b.ep / 2, vL = mur.axe === "u" ? mur.pos + mur.sens * b.ep / 2 : a;
          const x = b.x + uL * c - vL * s, z = b.z + uL * s + vL * c, larg = m.a1 - m.a0;
          const accroche = (sorte, y, plus) => {
            const o = Object.assign({ sorte, b, k: m.k, x, z, y: b.sol + y, rot, nx, nz, larg }, plus);
            accroches.push(o);
            objets.push(o);
            bilan.parSorte[sorte] = (bilan.parSorte[sorte] || 0) + 1;
            bilan.accroches++;
            return o;
          };
          if (m.rang === 0) {
            if (estBoutique && (m.fenetre || m.porte)) {
              const yStore = Math.min(m.y0 + 2.35, m.y1 - 0.55);
              accroche("store", yStore, { couleur: couleurStore, dechire: h() < 0.3 });
              if (!enseigneFaite && m.fenetre) (enseigneFaite = true), accroche("enseigne", yStore + 0.06, { pub: Math.floor(h() * 8) });
            } else if (!m.fenetre && !m.porte && h() < V.affiches) accroche("affiche", 1.1 + h() * 0.5, { pub: Math.floor(h() * 8), penche: (h() - 0.5) * 0.12, dechire: h() < 0.35 });
          } else {
            if (m.fenetre && h() < V.balcons) {
              const o = accroche("balcon", m.y0 + 0.62, {});
              if (h() < 0.45) accroche("linge", m.y0 + 1.55, { couleur: choix([0xd8d8d0, 0x5a7aa8, 0xc05050, 0xe0c060, 0x6a9a6a]) });
              o.larg = Math.max(1.2, larg * 0.9);
            } else if (!m.fenetre && h() < V.clims) accroche("clim", m.y0 + 0.9 + h() * 0.8, {});
          }
        }
        // une boutique : une terrasse de café devant (tables et chaises, souvent renversées dans la fuite)
        if (estBoutique && h() < V.terrasses) {
          const along = mur.axe === "u" ? [c, s] : [-s, c], base = { x: b.x + nx * (mur.axe === "u" ? b.demiP + 1.4 : b.demiL + 1.4), z: b.z + nz * (mur.axe === "u" ? b.demiP + 1.4 : b.demiL + 1.4) };
          for (let i = -1; i <= 1; i++) {
            const tx = base.x + along[0] * i * 2.2, tz = base.z + along[1] * i * 2.2;
            if (!libre(tx, tz, 0.4)) continue;
            petit("table", tx, tz, h() * 6.28, { renversee: h() < 0.5 });
            for (let k = 0; k < 2; k++) petit("chaise", tx + (h() - 0.5) * 1.6, tz + (h() - 0.5) * 1.6, h() * 6.28, { renversee: h() < 0.55 });
          }
        }
      });
    }
  }

  // Une voiture : garée (droite) ou abandonnée (de travers), portes ouvertes, brûlée, accidentée.
  function voiture(x, z, angle, accident) {
    if (!libre(x, z, 2.4)) return null;
    const modele = h() < 0.75 ? "berline" : "fourgonnette", brule = h() < PARTS.brulees;
    const o = solide("voiture", x, z, angle, modele === "berline" ? 2.2 : 2.45, 0.92, modele === "berline" ? 1.45 : 1.95, {
      nom: brule ? "une épave de voiture brûlée" : "une voiture abandonnée", modele, couleur: choix(COULEURS_VOITURES), brule, accident, mobile: true,
      vie: brule ? 0 : V.voitureVie, portes: [h() < PARTS.portesOuvertes, h() < PARTS.portesOuvertes * 0.6, h() < PARTS.portesOuvertes * 0.3], coffre: h() < 0.15,
    });
    if (o && accident) o.penche = (h() - 0.5) * 0.12;
    return o;
  }

  // ------------------------------------------------------------------ 2. Le quadrillage (pour trouver vite les objets proches)
  const GS = Tanks.Grille.creer(C.monde.taille, 16), GP = Tanks.Grille.creer(C.monde.taille, 16);
  function ranger() {
    Tanks.Grille.vider(GS);
    // (rangés par leur centre seulement : on cherche ensuite avec 6,5 m de marge — la moitié d'un bus —, c'est plus rapide)
    for (const o of solides) (Tanks.Grille.ajouter(GS, o, o.x, o.z, 0), (o.xRange = o.x), (o.zRange = o.z));
  }
  ranger();
  for (const o of petits) Tanks.Grille.ajouter(GP, o, o.x, o.z, 0.5);
  const prochesS = [], prochesP = [], prochesB = [];
  const solidesAutour = (x, z, r, sortie) => (actif ? Tanks.Grille.chercher(GS, x, z, r + 6.5, sortie) : ((sortie.length = 0), sortie));

  // ------------------------------------------------------------------ 3. Se cogner aux gros objets (appelé par Terrain.repousser)
  const P = { u: 0, v: 0 };
  let aRanger = false;
  function repousser(o, r) {
    if (!actif || T.souterrain) return null;
    let touche = null;
    for (const p of solidesAutour(o.x, o.z, r, prochesS)) {
      if (p === o || p.ecrase || p.traversable) continue; // (demande 115, Guerre civile : on passe sous un drap tendu ; il cache seulement)
      if (o.y !== undefined && o.y - p.y > p.h - 0.2) continue; // (au-dessus : à l'étage d'une maison, sur un toit…)
      const c = Math.cos(p.angle), s = Math.sin(p.angle), dx = o.x - p.x, dz = o.z - p.z;
      P.u = dx * c + dz * s;
      P.v = -dx * s + dz * c;
      if (Math.abs(P.u) > p.demiL + r || Math.abs(P.v) > p.demiP + r) continue;
      const u0 = P.u, v0 = P.v;
      if (!ST.pousserBoite(P, -p.demiL, p.demiL, -p.demiP, p.demiP, r)) continue;
      const du = P.u - u0, dv = P.v - v0, wx = du * c - dv * s, wz = du * s + dv * c;
      // ✍️ un tank (ou un engin) qui roule POUSSE la voiture : elle prend « pousser » du choc, le tank le reste
      const pousse = p.mobile && o.genre !== "soldat" && Math.abs(o.vitesse || 0) > 0.4 ? V.pousser : 0;
      o.x += wx * (1 - pousse);
      o.z += wz * (1 - pousse);
      if (pousse) {
        p.x -= wx * pousse;
        p.z -= wz * pousse;
        p.angle += (P.u > 0 ? 1 : -1) * Math.sign(P.v || 1) * Math.hypot(wx, wz) * pousse * 0.25; // (elle tourne un peu)
        for (const b of T.boitesAutour(p.x, p.z, p.demiL + 1, prochesB)) ST.pousser(b, p, p.demiP + 0.2); // (pas dans les murs)
        p.boite.x = p.x;
        p.boite.z = p.z;
        if (!p.poussee) (p.poussee = true), bilan.poussees++;
        if (Math.hypot(p.x - p.xRange, p.z - p.zRange) > 3) aRanger = true;
        if (o.vitesse) o.vitesse *= 0.996;
      } else touche = p;
    }
    return touche;
  }

  // ------------------------------------------------------------------ 4. Les dégâts
  function abimer(o, points, tireur, ev, sorte) {
    if (o.brule || o.vie === undefined) return;
    o.vie -= points;
    if (o.vie > 0) return;
    o.vie = 0;
    o.brule = true;
    o.feu = V.feu;
    o.nom = o.sorte === "bus" ? "l'épave du bus" : "une épave de voiture brûlée";
    bilan.detruites++;
    ev.push(["voiture-detruite", { nom: o.sorte === "bus" ? "le bus abandonné" : "une voiture abandonnée", sorte: o.sorte, x: o.x, y: o.y + 0.8, z: o.z, par: sorte, tireur }]);
  }
  // une BALLE dans un gros objet (appelé par logique/structures.js : « balle »)
  function balle(o, degats, tireur, ev) {
    bilan.balles++;
    if (o.sorte === "voiture" || o.sorte === "bus") abimer(o, degats * V.balle, tireur, ev, "balle");
  }
  // une EXPLOSION : les voitures proches perdent des points ; les petits objets tout près sont soufflés
  function exploser(x, y, z, sorte, tireur, ev) {
    if (!actif || T.souterrain) return;
    const E = C.structures.explosions[sorte];
    if (!E || !E[0]) return;
    const [D, R] = E, Rv = R + V.souffle;
    for (const p of solidesAutour(x, z, Rv, prochesS)) {
      if (p.vie === undefined || p.brule) continue;
      const c = Math.cos(p.angle), s = Math.sin(p.angle), dx = x - p.x, dz = z - p.z, u = dx * c + dz * s, v = -dx * s + dz * c;
      const d = Math.hypot(Math.max(0, Math.abs(u) - p.demiL), Math.max(0, Math.abs(v) - p.demiP), Math.max(0, y - p.y - p.h));
      if (d < Rv) abimer(p, D * (1 - d / Rv), tireur, ev, sorte);
    }
    for (const p of Tanks.Grille.chercher(GP, x, z, R * 0.7, prochesP)) {
      if (p.ecrase || Math.hypot(p.x - x, p.z - z) > R * 0.7) continue;
      p.ecrase = "souffle";
      p.angleChute = Math.atan2(p.z - z, p.x - x);
      bilan.souffles++;
    }
  }

  // ------------------------------------------------------------------ 5. Chaque pas : écraser, brûler, une nouvelle bataille
  let generation = -1;
  function avancer(monde, dt) {
    if (!actif) return;
    if (ST.generation !== generation) { // (une nouvelle bataille : tout est remis comme au départ)
      generation = ST.generation;
      for (const o of objets) if (o.depart) Object.assign(o, { x: o.depart.x, z: o.depart.z, angle: o.depart.angle, brule: o.depart.brule, vie: o.depart.vie, ecrase: false, poussee: false, feu: 0 });
      for (const o of solides) (o.boite.x = o.x), (o.boite.z = o.z), o.nom && o.depart.brule && (o.nom = "une épave de voiture brûlée");
      bilan.ecrases = bilan.souffles = bilan.detruites = bilan.poussees = bilan.balles = 0;
      ranger();
      bilan.generation = generation;
    }
    if (aRanger) (ranger(), (aRanger = false));
    // les tanks et les engins lancés écrasent les petits objets (et couchent les lampadaires, les feux, les panneaux)
    const rouler = (v, r) => {
      if (!v || v.detruit || Math.abs(v.vitesse || 0) < V.ecraser) return;
      for (const p of Tanks.Grille.chercher(GP, v.x, v.z, r, prochesP)) {
        if (p.ecrase || Math.hypot(p.x - v.x, p.z - v.z) > r + 0.3) continue;
        p.ecrase = "tank";
        p.angleChute = v.angle;
        bilan.ecrases++;
      }
    };
    for (const c of monde.chars) rouler(c, C.char.rayon * 0.8);
    for (const v of monde.vehicules || []) rouler(v, 1.5);
    for (const e of monde.engins) if (e.genre === "vehicule" && !e.enVol) rouler(e, 1.5);
    for (const o of solides) if (o.feu > 0) o.feu -= dt;
  }

  // Pour « sous le capot ».
  function compter() {
    let voitures = 0, brulees = 0, portes = 0, ecrases = 0;
    for (const o of objets) {
      if (o.sorte === "voiture") (voitures++, o.brule && brulees++, o.portes && o.portes.some((p) => p) && portes++);
      if (o.ecrase) ecrases++;
    }
    return { voitures, brulees, portes, ecrases };
  }

  // ✍️ (demande 115, Guerre civile) un AUTRE urbaniste peut poser ses gros objets (les barricades : logique/guerre-civile.js) :
  // ils deviennent solides comme les voitures (on se cache derrière, ils arrêtent les balles et les regards). « poser » les
  // ajoute, « ranger » refait le quadrillage. (dessinAutre : c'est un autre peintre qui les dessine, pas affichage/ville3d.js)
  const poser = (o) => ajouter(o);
  return { actif, poser, ranger, trottoir, boite: actif ? [Q.x - Q.rayon - 40, Q.x + Q.rayon + 40, Q.z - Q.rayon - 40, Q.z + Q.rayon + 40] : [0, 0, 0, 0], mode: VAR.ville || null, objets, solides, petits, accroches, sols, bilan, solidesAutour, repousser, balle, exploser, avancer, compter, reglages: V };
})();
