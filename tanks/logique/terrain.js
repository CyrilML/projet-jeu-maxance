// 🗺️ LE TERRAIN : le géomètre du champ de bataille (étape 60)
//
// Il invente le champ de bataille (toujours le même, grâce à la graine) et répond aux questions des autres :
//   - « quelle est la hauteur du sol en (x, z) ? » (des collines douces faites avec du bruit, et le village bien à plat) ;
//   - « qu'y a-t-il ici ? » : les OBSTACLES. Les maisons en ruines et les murets sont des BOÎTES (solides) ;
//     les arbres sont des CERCLES (un tank qui roule vite les ÉCRASE) ;
//   - « est-ce que je vois ma cible ? » : on avance le long de la ligne droite entre les deux, par petits pas, et on
//     regarde si on rentre dans une maison ou dans une colline (c'est la « ligne de vue »).
// Étape 62 : le LAC. C'est une ellipse (un cercle étiré) : pour savoir si un point (x, z) est dans l'eau, on calcule
// « dl » = √((dx ÷ rayonX)² + (dz ÷ rayonZ)²). Si dl < 1, on est dans l'eau. Au bord (dl = 1), le sol est juste à la
// hauteur de l'eau ; plus on va vers le milieu, plus il est creux. Ce qui roule est repoussé hors de l'eau (sur la rive,
// ou sur l'île la plus proche) ; un soldat, lui, NAGE (étape 63).
// Étape 63 : les ÎLES sont des petites collines rondes posées dans le lac : à moins de « rayon » de leur centre, le sol
// sort de l'eau. Un point est donc « dans l'eau » s'il est dans l'ellipse du lac ET sur aucune île.
// Étape 72 : pour aller vite, les arbres et les boîtes sont rangés dans un QUADRILLAGE (moteur/grille.js) : « qu'y a-t-il
// près de moi ? » ne regarde plus que les cases voisines.
// Étape 75 : ✍️ les MAISONS QU'ON PEUT DÉTRUIRE. Chaque boîte a maintenant un « type » (maison, grange, tour, muret,
// haie) ; ses murs sont découpés en MORCEAUX par logique/structures.js. Une maison n'est plus un bloc plein : c'est 4 murs
// et un toit (on peut entrer par un trou !). « repousser » et « vueLibre » demandent donc aux morceaux encore debout.
// Étape 71 : ✍️ la carte est 3 FOIS PLUS GRANDE (2 100 m de côté). Pour la remplir : deux HAMEAUX en ruines en plus du
// village (le sol est aplati sous chacun), de grandes FORÊTS en plus des bosquets, plus de haies et de granges. Les
// deux camps sont à 640 m du centre (« camp »). Les nombres sont dans config.js (monde).
// Étape 80 : ✍️ LES CARTES. Quand la carte « Le souterrain » est choisie (choisirCarte), le géomètre passe toutes les
// questions (la hauteur du sol, les obstacles, la ligne de vue) à l'architecte de la station (logique/souterrain.js) :
// les autres fichiers posent les mêmes questions sans savoir sur quelle carte ils sont.
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Terrain = (function () {
  const C = Tanks.CONFIG, W = C.monde, B = Tanks.Bruit;
  const bruit = B.creer(W.graine);
  let etat = W.graine;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  // (étape 80) la carte en cours : "bataille" (la grande campagne) ou "souterrain" (la station de métro)
  let carte = "bataille";
  const SO = () => Tanks.Souterrain;
  const demi = W.taille / 2, V = W.village, LAC = C.lac, CAMP = W.camp;
  // (étape 71) tous les groupes de maisons : le village, puis les hameaux
  // (étape 81) la VARIANTE de la carte du jour (donnees/carte-du-jour.js) : la ville, les ruines, le désert… (ou rien)
  const VAR = (Tanks.CarteDuJour && Tanks.CarteDuJour.variante) || {}, Q = VAR.quartier || null;
  // (étape 81) une VILLE en damier : elle prend la place du village (même terrain plat, mais plus grand)
  const VILLE = Q ? { nom: "la ville", x: Q.x, z: Q.z, rayon: Q.rayon, maisons: VAR.village === false ? 0 : V.maisons, murets: 14 } : null;
  const VILLAGES = [VILLE || (VAR.village === false ? Object.assign({}, V, { maisons: 0 }) : V)].concat(W.hameaux || []);
  const presDUnVillage = (x, z, plus) => VILLAGES.some((v) => Math.hypot(x - v.x, z - v.z) < v.rayon + (plus || 0));
  // (étape 71) les camps (et le parking des engins juste derrière) : ni arbre ni muret
  // (demande 99 : et les BASES AÉRIENNES, logique/base.js : ni arbre, ni haie, ni grange sur la piste ou les hangars)
  const BASE = Tanks.Base;
  const dansUnCamp = (x, z) => (Math.abs(x) < 210 && Math.abs(Math.abs(z) - CAMP - 15) < 95) || BASE.dans(x, z);
  // (étape 62) « dl » : 0 au milieu du lac, 1 sur la rive, plus de 1 en dehors
  const distLac = (x, z) => carte === "souterrain" ? 99 : Math.hypot((x - LAC.x) / LAC.rayonX, (z - LAC.z) / LAC.rayonZ);
  const ILES = LAC.iles || [];
  // l'île sur laquelle (ou tout près de laquelle) on est, ou null
  const ileProche = (x, z, plus) => ILES.find((i) => Math.hypot(x - i.x, z - i.z) < i.rayon + (plus || 0)) || null;
  const dansLEau = (x, z, marge) => {
    if (carte === "souterrain") return false;
    const m = marge || 0;
    return distLac(x, z) < 1 + m / Math.min(LAC.rayonX, LAC.rayonZ) && !ILES.some((i) => Math.hypot(x - i.x, z - i.z) < i.rayon - m);
  };
  // (et les portails : on ne met ni arbre ni maison tout près)
  const PORTAILS = C.portails.paires.flatMap((p) => [p.a, p.b]);
  const presDUnPortail = (x, z, d) => PORTAILS.some(([px, pz]) => Math.hypot(px - x, pz - z) < d);

  // ------------------------------------------------------------------ la hauteur du sol
  // (étape 71) « Quelle est la hauteur du sol ici ? » est la question la plus posée du jeu (chaque soldat, chaque engin,
  // chaque ligne de vue, 120 fois par seconde) et le calcul exact est long (4 couches de bruit, les villages, le lac…).
  // Alors on garde un CAHIER DES HAUTEURS : la hauteur exacte aux coins d'un quadrillage de 2 m, calculée la première
  // fois qu'on en a besoin, puis relue. Entre 4 coins, on fait la moyenne pondérée (« interpolation bilinéaire ») :
  // l'écart avec le calcul exact est de quelques millimètres.
  const PAS_H = C.monde.pasHauteurs, NH = Math.ceil(W.taille / PAS_H) + 1, cahier = new Float32Array(NH * NH).fill(NaN);
  const cahierBilan = { remplies: 0, cases: NH * NH };
  function coin(i, j) {
    const k = j * NH + i;
    let h = cahier[k];
    if (h !== h) { // (NaN : pas encore calculée)
      h = cahier[k] = hauteurExacte(i * PAS_H - demi, j * PAS_H - demi);
      cahierBilan.remplies++;
    }
    return h;
  }
  function hauteur(x, z) {
    if (carte === "souterrain") return SO().hauteur(x, z);
    const u = (x + demi) / PAS_H, v = (z + demi) / PAS_H, i = Math.floor(u), j = Math.floor(v);
    if (i < 0 || j < 0 || i >= NH - 1 || j >= NH - 1) return hauteurExacte(x, z) - TR.creux(x, z); // (hors de la carte : le calcul exact)
    const fu = u - i, fv = v - j;
    const h00 = coin(i, j), h10 = coin(i + 1, j), h01 = coin(i, j + 1), h11 = coin(i + 1, j + 1);
    // ✍️ (demande 115) les TRANCHÉES de 1916 sont trop fines pour le cahier (2,3 m de large, un point tous les 2 m) : leur
    // creux est calculé exactement à chaque fois (logique/tranchees.js), et retiré du sol naturel
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv - (TRA ? TR.creux(x, z) : 0);
  }
  // (demande 115) « hauteurExacte » est le sol NATUREL (avec les cratères d'obus de 1916, mais sans le creux des tranchées :
  // c'est ce sol que le peintre dessine ; les tranchées ont leurs propres parois, affichage/tranchees3d.js)
  const TR = Tanks.Tranchees, TRA = TR.actif;
  // ✍️ (demande 132) sur une TRANCHÉE (ou à moins de « r » m) ? Les tranchées de 1916 sont rapprochées : on n'y pose ni
  // grange ni haie (on regarde le creux au centre et sur un cercle de rayon r).
  const surUneTranchee = (x, z, r) => { if (!TRA || TR.creux(x, z) > 0) return TRA; for (let k = 0; k < 16; k++) if (TR.creux(x + r * Math.cos(k * Math.PI / 8), z + r * Math.sin(k * Math.PI / 8)) > 0) return true; return false; };
  // ✍️ (demande 115, édition 1944) LA RIVIÈRE : un lit peu profond (on la traverse à gué) qui serpente (z = z0 + A × sin(x ÷ P)),
  // de « largeur » m, avec ses talus ; sur les PONTS (x de « ponts »), le sol n'est pas creusé : on passe au sec.
  const RIV = VAR.riviere || null;
  const zRiviere = (x) => RIV.z0 + RIV.amplitude * Math.sin(x / RIV.periode);
  function creuxRiviere(x, z) {
    if (x < RIV.x[0] || x > RIV.x[1]) return 0;
    const d = Math.abs(z - zRiviere(x)), demiL = RIV.largeur / 2;
    if (d > demiL + RIV.talus) return 0;
    if (RIV.ponts.some((px) => Math.abs(x - px) < RIV.pont / 2)) return 0;
    return d < demiL ? RIV.profondeur : (RIV.profondeur * (demiL + RIV.talus - d)) / RIV.talus;
  }
  const dansRiviere = (x, z) => !!RIV && creuxRiviere(x, z) > RIV.profondeur * 0.6;
  // ✍️ (demande 115, Guerre froide) LES RIZIÈRES : des TERRASSES plates de « case » m de côté, rangée par rangée ; chaque
  // rangée est une marche plus haute que la précédente (« MARCHE » m, vers le sud : z plus grand). Chaque case est pleine
  // d'eau et bordée de DIGUETTES (dessinées par affichage/jungle3d.js). Autour, le sol rejoint la colline en douceur.
  // Et LA BASE DE FEU : une colline au sommet APLATI (un plateau de « plateau » m de rayon, qui descend jusqu'à « pied » m).
  const RIZ = (VAR.rizieres || []).map(([x, z, nc, nr, c]) => ({ x0: x, z0: z, x1: x + nc * c, z1: z + nr * c, nc, nr, c, h0: null }));
  const MARCHE_RIZ = 0.55, BORD_RIZ = 8, BF = VAR.baseDeFeu || null;
  const solNaturel = (x, z) => B.fractal(bruit, x / W.collines.taille, z / W.collines.taille, 4) * W.collines.hauteur * (VAR.collines || 1);
  function niveauRiz(r, z) {
    if (r.h0 === null) r.h0 = solNaturel((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
    const rang = Math.max(0, Math.min(r.nr - 1, Math.floor((z - r.z0) / r.c)));
    return r.h0 + (rang - (r.nr - 1) / 2) * MARCHE_RIZ;
  }
  // dans l'EAU d'une rizière ? (pas sur une diguette : à plus de 0,7 m du bord de sa case)
  function dansRiziere(x, z) {
    for (const r of RIZ) {
      if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) continue;
      const u = (x - r.x0) % r.c, v = (z - r.z0) % r.c;
      return u > 0.7 && u < r.c - 0.7 && v > 0.7 && v < r.c - 0.7 ? r : null;
    }
    return null;
  }
  let hautBase = null;
  function hauteurExacte(x, z) {
    let h = B.fractal(bruit, x / W.collines.taille, z / W.collines.taille, 4) * W.collines.hauteur * (VAR.collines || 1); // (étape 81 : × 1,8 dans le désert = des dunes)
    if (TRA) h += TR.cratere(x, z); // (demande 115 : les cratères du no man's land)
    if (RIV) h -= creuxRiviere(x, z); // (demande 115, 1944 : le lit de la rivière)
    // le village est sur un terrain presque plat : on « aplatit » les collines près du centre (étape 71 : et sous les hameaux)
    let plat = 1;
    for (let i = 0; i < VILLAGES.length; i++) {
      const v = VILLAGES[i], d = Math.hypot(x - v.x, z - v.z);
      if (d < v.rayon * 1.7) plat = Math.min(plat, Math.max(0, (d - v.rayon * 0.8) / (v.rayon * 0.9)));
    }
    h = h * (0.15 + 0.85 * plat);
    // (demande 115, Guerre froide) les rizières : à plat dans chaque rangée de cases ; le sol rejoint la colline sur « BORD_RIZ » m autour
    for (let i = 0; i < RIZ.length; i++) {
      const r = RIZ[i], dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
      if (dx > BORD_RIZ || dz > BORD_RIZ) continue;
      const t = Math.min(1, Math.hypot(dx, dz) / BORD_RIZ), f = t * t * (3 - 2 * t);
      h = niveauRiz(r, z) * (1 - f) + h * f;
    }
    // (demande 115, Guerre froide) la base de feu : la colline au sommet aplati
    if (BF) {
      const d = Math.hypot(x - BF.x, z - BF.z);
      if (d < BF.pied) {
        if (hautBase === null) hautBase = solNaturel(BF.x, BF.z) + BF.hauteur;
        const t = Math.min(1, (BF.pied - d) / (BF.pied - BF.plateau)), f = t * t * (3 - 2 * t);
        h = h * (1 - f) + hautBase * f;
      }
    }
    // ✍️ (demande 99) les BASES AÉRIENNES : bien à plat (une piste ne monte pas !), à la hauteur du milieu de la base,
    // avec une pente douce tout autour (« bord » m). On mélange : 0 dans la base, 1 à « bord » m de son bord.
    for (let i = 0; i < ZONES.length; i++) {
      const r = ZONES[i], dx = Math.max(r.x0 - x, 0, x - r.x1), dz = Math.max(r.z0 - z, 0, z - r.z1);
      if (dx > r.bord || dz > r.bord) continue;
      const d = Math.hypot(dx, dz);
      if (d >= r.bord) continue;
      const t = d / r.bord, f = t * t * (3 - 2 * t);
      h = r.h * (1 - f) + h * f;
    }
    // au bord, le terrain remonte un peu (une cuvette : on voit que c'est la fin du champ de bataille)
    const bord = Math.max(Math.abs(x), Math.abs(z)) - (demi - 60);
    if (bord > 0) h += bord * bord * 0.012;
    // le lac : au bord, le sol descend jusqu'à l'eau, puis il se creuse (pente de 12 m par « rayon »)
    const dl = distLac(x, z);
    if (dl < 1.35) {
      const creux = Math.max(LAC.niveau - LAC.profondeur, LAC.niveau + (dl - 1) * 12);
      const melange = Math.min(1, (1.35 - dl) / 0.35);
      h = h + (creux - h) * melange;
      // les îles : une colline ronde, juste à la hauteur de l'eau sur son bord, et un plateau au milieu
      for (const i of ILES) {
        const di = Math.hypot(x - i.x, z - i.z) / i.rayon;
        if (di < 1.5) h = Math.max(h, LAC.niveau + Math.min(i.hauteur, (1 - di) * i.hauteur * 4));
      }
    }
    return h;
  }
  // (demande 99) la hauteur de chaque base : les collines au milieu de la base (sans l'aplatir, bien sûr)
  const ZONES = BASE.zones.map((r) => Object.assign({}, r, { h: B.fractal(bruit, ((r.x0 + r.x1) / 2) / W.collines.taille, ((r.z0 + r.z1) / 2) / W.collines.taille, 4) * W.collines.hauteur * (VAR.collines || 1) }));
  function normale(x, z) {
    const e = 1.5;
    const nx = hauteur(x - e, z) - hauteur(x + e, z), nz = hauteur(x, z - e) - hauteur(x, z + e);
    const l = Math.hypot(nx, 2 * e, nz);
    return { x: nx / l, y: (2 * e) / l, z: nz / l };
  }

  // ------------------------------------------------------------------ les obstacles
  const boites = []; // { x, z, demiL, demiP, angle, h, sorte: "maison" | "muret" | "ruine" }
  const arbres = []; // { x, z, r, taille, ecrase: false }
  const loinDe = (x, z, d) => !dansLEau(x, z, d + 10) && !presDUnPortail(x, z, d + 12) && boites.every((b) => Math.hypot(b.x - x, b.z - z) > d + Math.max(b.demiL, b.demiP));

  // ✍️ (étape 81) LA VILLE : des rues en damier (tous les « ilot » m), et dans chaque pâté de maisons (entre 4 rues),
  // jusqu'à « maisons » maisons dans ses 4 coins, alignées sur les rues. « rues » : les lignes que le peintre colorie.
  const rues = [];
  if (Q) {
    const n = Math.floor(Q.rayon / Q.ilot), dedans = (Q.ilot - Q.rue) / 2;
    for (let k = -n; k <= n; k++) {
      const u = k * Q.ilot, l = Math.sqrt(Math.max(0, Q.rayon * Q.rayon - u * u)) + Q.ilot * 0.5;
      rues.push([[Q.x + u, Q.z - l], [Q.x + u, Q.z + l]], [[Q.x - l, Q.z + u], [Q.x + l, Q.z + u]]);
    }
    for (let gi = -n; gi < n; gi++) for (let gj = -n; gj < n; gj++) {
      const cx = Q.x + (gi + 0.5) * Q.ilot, cz = Q.z + (gj + 0.5) * Q.ilot;
      if (Math.hypot(cx - Q.x, cz - Q.z) > Q.rayon - Q.ilot * 0.3) continue;
      if ((Q.vides || []).some(([vi, vj]) => vi === gi && vj === gj)) continue; // (demande 115, Guerre civile : un pâté SANS maison — une place, le souk)
      const coins = [[-1, -1], [1, -1], [-1, 1], [1, 1]].sort(() => hasard() - 0.5).slice(0, Q.maisons);
      for (const [sx, sz] of coins) {
        const demiL = 4 + hasard() * 2.5, demiP = 3.5 + hasard() * 1.5, tourne = hasard() < 0.5;
        const ex = tourne ? demiP : demiL, ez = tourne ? demiL : demiP; // (la place qu'elle prend, le long des rues)
        const x = cx + sx * (dedans - ex - 1), z = cz + sz * (dedans - ez - 1);
        if (!loinDe(x, z, 1)) continue;
        // ✍️ (livre n° 9) la ville réaliste : certaines maisons sont des IMMEUBLES de 4 ou 5 étages
        let h = 4 + hasard() * 5, immeuble = false;
        if (VAR.ville && hasard() < C.ville.immeubles) (immeuble = true), (h = C.ville.etages[hasard() < 0.5 ? 0 : 1] * C.structures.etage + 0.2);
        boites.push({ x, z, demiL, demiP, angle: tourne ? Math.PI / 2 : 0, h, immeuble, sorte: "maison", type: "maison", hameau: false, quartier: true, ruinesDepart: Q.ruinesDepart || 0, lieu: "la ville", graine: Math.floor(hasard() * 1e6) });
      }
    }
  }

  // Le village : des maisons en ruines le long de deux rues en croix, des murets, des tas de gravats.
  // (étape 71 : pareil pour chaque hameau, avec moins de maisons)
  for (const vi of VILLAGES) {
    for (let essai = 0, n = 0; n < vi.maisons && essai < 600; essai++) {
      const rue = hasard() < 0.5, le_long = (hasard() * 2 - 1) * vi.rayon, cote = (hasard() < 0.5 ? -1 : 1) * (11 + hasard() * 10);
      const x = vi.x + (rue ? le_long : cote), z = vi.z + (rue ? cote : le_long);
      const demiL = 4 + hasard() * 3.5, demiP = 3.5 + hasard() * 2.5;
      if (!loinDe(x, z, 4)) continue;
      boites.push({ x, z, demiL, demiP, angle: rue ? 0 : Math.PI / 2, h: 4 + hasard() * 4, sorte: "maison", type: "maison", hameau: vi !== VILLAGES[0], lieu: vi.nom, graine: Math.floor(hasard() * 1e6), ruinesDepart: VAR.ruinesVillage }); // (demande 115 : « ruinesVillage » : la part déjà en ruines)
      n++;
    }
    for (let essai = 0, n = 0; n < vi.murets && essai < 600; essai++) {
      const a = hasard() * Math.PI * 2, r = vi.rayon * (0.4 + hasard() * 0.9);
      const x = vi.x + Math.cos(a) * r, z = vi.z + Math.sin(a) * r;
      if (!loinDe(x, z, 3)) continue;
      boites.push({ x, z, demiL: 3 + hasard() * 5, demiP: 0.35, angle: hasard() < 0.5 ? a : a + Math.PI / 2, h: 1.1, sorte: "muret", type: "muret", lieu: vi.nom });
      n++;
    }
  }
  // ✍️ (demande 115) L'ÉGLISE EN RUINES du village de 1916 : la nef (une longue maison haute) et son clocher (une tour).
  if (VAR.eglise) {
    const E2 = VAR.eglise;
    boites.push({ x: E2.x, z: E2.z, demiL: 11, demiP: 5.5, angle: 0, h: 8.5, sorte: "maison", type: "maison", lieu: "l'église", nom: "l'église de " + V.nom.replace(/^le village en ruines de /, ""), ruinesDepart: 0, eglise: true, graine: 1916 });
    boites.push({ x: E2.x - 14, z: E2.z, demiL: 3.2, demiP: 3.2, angle: 0, h: 17, sorte: "maison", type: "tour", lieu: "l'église", nom: "le clocher", graine: 1917 });
  }
  // ✍️ (demande 115, Europe de l'Est) DES BÂTIMENTS posés à la main (la zone industrielle : le grand silo à grain, les
  // hangars) : [x, z, demi-longueur, demi-largeur, angle, hauteur, type (« tour », « grange », « maison »), nom]
  // (demande 115, Guerre civile : un 9e nombre, le LIEU ; et le type « rempart » : un mur épais en pierre, sans toit — les remparts de la citadelle)
  for (const [x, z, demiL, demiP, angle, h, type, nom, lieu] of VAR.batiments || []) boites.push({ x, z, demiL, demiP, angle, h, sorte: type === "rempart" ? "muret" : "maison", type: type === "rempart" ? "muret" : type, lieu: lieu || "la zone industrielle", nom, ruinesDepart: 0, graine: Math.round(Math.abs(x * 31 + z * 17)) });
  // ✍️ (demande 115, édition 1944) LE BOCAGE : un damier de champs (« cellule » m), bordés de HAIES épaisses et hautes
  // (avec des trouées : « part » des bords ont une haie) ; et des VERGERS : des pommiers en rangées.
  if (VAR.bocage) {
    const Bo = VAR.bocage, n = Math.floor(Bo.etendue / Bo.cellule);
    for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) for (const vertical of [false, true]) {
      if (hasard() > Bo.part) continue;
      const L = Bo.cellule * (0.55 + hasard() * 0.35), x = (i + (vertical ? 0 : 0.5)) * Bo.cellule + (hasard() - 0.5) * 8, z = (j + (vertical ? 0.5 : 0)) * Bo.cellule + (hasard() - 0.5) * 8;
      if (Math.abs(z) > Bo.etendueZ || presDUnVillage(x, z, 25) || dansUnCamp(x, z) || !loinDe(x, z, 6) || (RIV && Math.abs(z - zRiviere(x)) < RIV.largeur + 10)) continue;
      boites.push({ x, z, demiL: L / 2, demiP: Bo.epaisseur / 2, angle: (vertical ? Math.PI / 2 : 0) + (hasard() - 0.5) * 0.08, h: Bo.hauteur, sorte: "muret", type: "haie", lieu: "le bocage" });
    }
  }
  // Les haies et les murets dans la campagne (pour se cacher), et quelques ruines isolées (des granges).
  for (let k = 0, nHaies = VAR.haies == null ? W.haies : VAR.haies; k < nHaies; k++) { // (étape 81 : pas de haies dans le désert)
    const x = (hasard() * 2 - 1) * (demi - 80), z = (hasard() * 2 - 1) * (demi - 80);
    if (presDUnVillage(x, z, 20) || dansUnCamp(x, z) || !loinDe(x, z, 8) || surUneTranchee(x, z, 19)) continue;
    boites.push({ x, z, demiL: 8 + hasard() * 10, demiP: 0.6, angle: hasard() * Math.PI, h: 1.6, sorte: "muret", type: "haie", lieu: "la campagne" });
  }
  for (let k = 0; k < W.granges; k++) {
    const x = (hasard() * 2 - 1) * (demi - 120), z = (hasard() * 2 - 1) * (demi - 120);
    if (presDUnVillage(x, z, 40) || dansUnCamp(x, z) || !loinDe(x, z, 10) || surUneTranchee(x, z, 12) || surUneTranchee(x, z, 6.5)) continue;
    boites.push({ x, z, demiL: 6 + hasard() * 3, demiP: 4.5, angle: hasard() * Math.PI, h: 5, sorte: "maison", type: "grange", lieu: "la campagne", graine: Math.floor(hasard() * 1e6) });
  }
  // Les arbres : en grandes forêts (étape 71), en bosquets (des petits bois), et quelques-uns tout seuls.
  const centres = [], forets = [];
  for (let k = 0; k < W.bosquets; k++) centres.push({ x: (hasard() * 2 - 1) * (demi - 70), z: (hasard() * 2 - 1) * (demi - 70), r: 18 + hasard() * 22 });
  for (let k = 0; k < W.forets; k++) forets.push({ x: (hasard() * 2 - 1) * (demi - 150), z: (hasard() * 2 - 1) * (demi - 150), r: 60 + hasard() * 70 });
  for (let k = 0, nArbres = Math.round(W.arbres * (VAR.arbres == null ? 1 : VAR.arbres)); k < nArbres; k++) { // (étape 81 : × « arbres » de la variante)
    let x, z;
    const tirage = hasard();
    if (tirage < W.partForets + W.partBosquets) {
      const liste = tirage < W.partForets ? forets : centres;
      const c = liste[Math.floor(hasard() * liste.length)], a = hasard() * Math.PI * 2, r = Math.sqrt(hasard()) * c.r;
      x = c.x + Math.cos(a) * r;
      z = c.z + Math.sin(a) * r;
    } else {
      x = (hasard() * 2 - 1) * (demi - 40);
      z = (hasard() * 2 - 1) * (demi - 40);
    }
    if (Math.max(Math.abs(x), Math.abs(z)) > demi - 30 || presDUnVillage(x, z, -0.1 * VILLAGES[0].rayon) || dansUnCamp(x, z) || !loinDe(x, z, 2) || dansLEau(x, z, 3) || presDUnPortail(x, z, 9)) continue; // (pas sur les départs)
    if (RIZ.length && RIZ.some((r) => x > r.x0 - 4 && x < r.x1 + 4 && z > r.z0 - 4 && z < r.z1 + 4)) continue; // (demande 115, Guerre froide : pas d'arbre dans les rizières)
    if (BF && Math.hypot(x - BF.x, z - BF.z) < BF.plateau + 12) continue; // (ni sur la base de feu : le terrain est dégagé)
    if (TR.reseau && Math.abs(z) < TR.R.arriere + 25 && x > TR.R.x[0] - 40 && x < TR.R.x[1] + 40) continue; // (demande 115 : sur le front de 1916, plus un arbre debout : seulement des troncs déchiquetés, dessinés par affichage/tranchees3d.js)
    // (demande 115, Guerre froide : dans la jungle, « palmiers » des arbres sont des PALMIERS — rangés avec les sapins, dessinés en palmiers —,
    // et les feuillus sont plus grands)
    const sorteArbre = VAR.palmiers ? (hasard() < VAR.palmiers ? "palmier" : "feuillu") : hasard() < 0.35 ? "sapin" : "feuillu";
    arbres.push({ x, z, r: 0.6, taille: (0.8 + hasard() * 0.6) * (VAR.palmiers && sorteArbre === "feuillu" ? 1.25 : 1), ecrase: false, sorte: sorteArbre, angleChute: 0 });
  }

  // (demande 115, 1944) les VERGERS : [x, z, rangées, colonnes, écart] → des pommiers bien alignés
  // (demande 115, Europe de l'Est : un 6e nombre, la « taille » des arbres : les grands RIDEAUX D'ARBRES contre le vent ; pas
  // d'arbre dans une tranchée)
  for (const [vx, vz, nr, nc, e, taille] of VAR.vergers || []) for (let a = 0; a < nr; a++) for (let b = 0; b < nc; b++) {
    const x = vx + b * e + (hasard() - 0.5), z = vz + a * e + (hasard() - 0.5);
    if (TR.reseau && TR.creux(x, z) > 0) continue;
    if (loinDe(x, z, 1.5)) arbres.push({ x, z, r: 0.45, taille: (taille || 0.55) + hasard() * 0.15, ecrase: false, sorte: "feuillu", angleChute: 0, verger: true });
  }
  // (étape 63) Sur les îles : des arbres (surtout des pins), et une vieille tour en ruines sur la grande île.
  for (const ile of ILES) {
    const n = Math.round(ile.rayon * 0.6);
    for (let k = 0; k < n; k++) {
      const a = hasard() * Math.PI * 2, r = Math.sqrt(hasard()) * ile.rayon * 0.75, x = ile.x + Math.cos(a) * r, z = ile.z + Math.sin(a) * r;
      if (presDUnPortail(x, z, 9)) continue;
      arbres.push({ x, z, r: 0.6, taille: 0.8 + hasard() * 0.5, ecrase: false, sorte: hasard() < 0.7 ? "sapin" : "feuillu", angleChute: 0 });
    }
  }
  if (ILES[0]) boites.push({ x: ILES[0].x + 10, z: ILES[0].z + 12, demiL: 3.5, demiP: 3.5, angle: 0.4, h: 9, sorte: "maison", type: "tour", lieu: ILES[0].nom, graine: 6301 });

  // (étape 72) LE QUADRILLAGE des obstacles (moteur/grille.js) : chaque arbre est rangé dans la case de son tronc,
  // chaque boîte dans toutes les cases qu'elle touche. « Qu'y a-t-il près de moi ? » = ouvrir ma case et ses voisines.
  const grilleArbres = Tanks.Grille.creer(W.taille, C.grille.case), grilleBoites = Tanks.Grille.creer(W.taille, C.grille.case);
  for (const a of arbres) Tanks.Grille.ajouter(grilleArbres, a, a.x, a.z, 0);
  for (const b of boites) Tanks.Grille.ajouter(grilleBoites, b, b.x, b.z, Math.hypot(b.demiL, b.demiP));
  // Les arbres (ou les boîtes) dont le centre est peut-être à moins de « rayon » de (x, z) : il faut encore vérifier la
  // vraie distance. « sortie » : la liste (réutilisée) où les mettre.
  const vide = (sortie) => ((sortie.length = 0), sortie); // (étape 80 : dans le souterrain, ni arbre ni maison)
  const arbresAutour = (x, z, rayon, sortie) => carte === "souterrain" ? vide(sortie) : Tanks.Grille.chercher(grilleArbres, x, z, rayon + 1, sortie);
  const boitesAutour = (x, z, rayon, sortie) => carte === "souterrain" ? vide(sortie) : Tanks.Grille.chercher(grilleBoites, x, z, rayon, sortie);
  const prochesRepousser = [];

  // Un point (x, z) dans une boîte ? (on le ramène dans le repère de la boîte : le long, et en travers)
  function dansBoite(b, x, z, marge) {
    const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x - b.x, dz = z - b.z;
    const u = dx * c + dz * s, v = -dx * s + dz * c;
    return Math.abs(u) < b.demiL + (marge || 0) && Math.abs(v) < b.demiP + (marge || 0);
  }

  // Pousse un cercle (un tank) hors des boîtes. Renvoie la boîte touchée (ou null).
  // (étape 75) Une boîte n'est plus pleine : on demande à ses MORCEAUX de mur encore debout (logique/structures.js) ;
  // le morceau touché est noté dans « o.morceauTouche » (un tank lancé vite peut défoncer le mur).
  function repousser(o, r) {
    if (carte === "souterrain") return SO().repousser(o, r);
    let touche = null;
    o.morceauTouche = null;
    for (const b of boitesAutour(o.x, o.z, r + 0.01, prochesRepousser)) { // (étape 72 : seulement les boîtes des cases voisines)
      if (Math.abs(o.x - b.x) > b.demiL + b.demiP + r || Math.abs(o.z - b.z) > b.demiL + b.demiP + r) continue;
      const m = Tanks.Structures.pousser(b, o, r);
      if (m) (touche = b), (o.morceauTouche = m);
    }
    if (BASE.repousser(o, r)) touche = touche || HANGAR_BOITE; // (demande 99 : les murs des hangars)
    if (Tanks.Perchoirs && Tanks.Perchoirs.repousser(o, r)) touche = touche || PERCHOIR_BOITE; // (livre n° 12 : le pied des miradors, des châteaux d'eau…)
    if (Tanks.Ville && Tanks.Ville.actif) { const v = Tanks.Ville.repousser(o, r); if (v) touche = touche || v.boite; } // (livre n° 9 et 11 : voitures, bus, kiosques…)
    // (étape 62) l'eau : on ramène le point sur la rive (en agrandissant son écart au centre du lac)…
    // (étape 63) …ou sur l'île d'où il vient, s'il est tout près d'une île (sinon un tank qui roule au bord d'une île
    // se retrouvait d'un coup sur la rive du lac : un bug !). Un soldat, lui, n'est pas repoussé : il nage.
    if (!o.flotte && o.genre !== "soldat" && dansLEau(o.x, o.z, r)) {
      const ile = ileProche(o.x, o.z, r + 25);
      if (ile) {
        const d = Math.hypot(o.x - ile.x, o.z - ile.z) || 0.01, voulu = Math.max(0.5, ile.rayon - r - 0.01);
        o.x = ile.x + (o.x - ile.x) * (voulu / d);
        o.z = ile.z + (o.z - ile.z) * (voulu / d);
      } else {
        const voulu = 1 + r / Math.min(LAC.rayonX, LAC.rayonZ), dl = distLac(o.x, o.z) || 0.01;
        o.x = LAC.x + (o.x - LAC.x) * (voulu / dl);
        o.z = LAC.z + (o.z - LAC.z) * (voulu / dl);
      }
      touche = touche || LAC_BOITE;
    }
    return touche;
  }
  const LAC_BOITE = { sorte: "eau" }, HANGAR_BOITE = { sorte: "hangar" }, PERCHOIR_BOITE = { sorte: "perchoir" };

  // La ligne de vue entre deux points (à la hauteur y au-dessus du sol) : rien entre les deux ?
  // (Étape 61 : pour aller vite — 24 soldats et 8 tanks se posent la question sans arrêt —, on ne regarde le sol que tous
  // les 9 m.) (Étape 75 : les murs, les gravats et les toits, c'est logique/structures.js qui répond : on peut voir à
  // travers une fenêtre ou un trou !)
  for (const b of boites) (b.rayon = Math.hypot(b.demiL, b.demiP)), (b.sol = hauteur(b.x, b.z));
  function vueLibre(x1, y1, z1, x2, y2, z2) {
    if (carte === "souterrain") return !SO().ligne(x1, y1, z1, x2, y2, z2, true);
    if (Tanks.Structures.touche(x1, y1, z1, x2, y2, z2)) return false;
    const d = Math.hypot(x2 - x1, z2 - z1), n = Math.max(2, Math.ceil(d / 9));
    for (let i = 1; i < n; i++) {
      const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t, z = z1 + (z2 - z1) * t;
      if (y < hauteur(x, z)) return false; // une colline entre les deux
    }
    return true;
  }

  // Les places de départ : les Bleus au sud (z > 0), les Rouges au nord, en ligne (étape 71 : à 640 m du centre).
  function departs(equipe, n) {
    const z = (equipe === "bleus" ? 1 : -1) * CAMP, liste = [];
    for (let k = 0; k < n; k++) liste.push({ x: (k - (n - 1) / 2) * C.equipes.ecart, z, angle: equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2 });
    return liste;
  }

  // (étape 80) changer de carte (au début de chaque bataille ; le garage est toujours dehors)
  function choisirCarte(nom) {
    carte = nom === "souterrain" ? "souterrain" : "bataille";
  }

  // (demande 92) DE QUOI EST FAIT LE SOL en (x, z) ? (pour que l'affichage sache quoi faire gicler quand une balle ou un
  // obus arrive : de la terre, du sable, des éclats de béton, de l'eau…). Les rues de la ville sont pavées.
  function matiere(x, z) {
    if (carte === "souterrain") return "beton";
    if (dansLEau(x, z)) return "eau";
    if (VAR.herbe === false) return VAR.matiereSol || "sable"; // (demande 115 : en 1916, de la boue, pas du sable)
    if (dansRiviere(x, z)) return "eau"; // (demande 115, 1944 : la rivière)
    if (RIZ.length && dansRiziere(x, z)) return "eau"; // (demande 115, Guerre froide : l'eau des rizières)
    if (Q && Math.hypot(x - Q.x, z - Q.z) < Q.rayon) {
      const ix = ((((x - Q.x) % Q.ilot) + Q.ilot) % Q.ilot), iz = ((((z - Q.z) % Q.ilot) + Q.ilot) % Q.ilot), demiRue = Q.rue / 2;
      if (ix < demiRue || ix > Q.ilot - demiRue || iz < demiRue || iz > Q.ilot - demiRue) return "pierre";
    }
    return "terre";
  }

  return { rizieres: RIZ, niveauRiz, dansRiziere, baseDeFeu: BF, matiere, riviere: RIV ? { zRiviere, creux: creuxRiviere, dans: dansRiviere, R: RIV } : null, variante: VAR, rues, choisirCarte, get carte() { return carte; }, get souterrain() { return carte === "souterrain"; }, hauteur, hauteurExacte, cahierBilan, normale, boites, arbres, arbresAutour, boitesAutour, grilles: { arbres: grilleArbres, boites: grilleBoites }, dansBoite, repousser, vueLibre, departs, demi, camp: CAMP, villages: VILLAGES, forets, distLac, dansLEau, ileProche, iles: ILES };
})();
