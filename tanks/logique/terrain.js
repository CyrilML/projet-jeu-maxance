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
  const VILLAGES = [V].concat(W.hameaux || []);
  const presDUnVillage = (x, z, plus) => VILLAGES.some((v) => Math.hypot(x - v.x, z - v.z) < v.rayon + (plus || 0));
  // (étape 71) les camps (et le parking des engins juste derrière) : ni arbre ni muret
  const dansUnCamp = (x, z) => Math.abs(x) < 210 && Math.abs(Math.abs(z) - CAMP - 15) < 95;
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
    if (i < 0 || j < 0 || i >= NH - 1 || j >= NH - 1) return hauteurExacte(x, z); // (hors de la carte : le calcul exact)
    const fu = u - i, fv = v - j;
    const h00 = coin(i, j), h10 = coin(i + 1, j), h01 = coin(i, j + 1), h11 = coin(i + 1, j + 1);
    return (h00 * (1 - fu) + h10 * fu) * (1 - fv) + (h01 * (1 - fu) + h11 * fu) * fv;
  }
  function hauteurExacte(x, z) {
    let h = B.fractal(bruit, x / W.collines.taille, z / W.collines.taille, 4) * W.collines.hauteur;
    // le village est sur un terrain presque plat : on « aplatit » les collines près du centre (étape 71 : et sous les hameaux)
    let plat = 1;
    for (let i = 0; i < VILLAGES.length; i++) {
      const v = VILLAGES[i], d = Math.hypot(x - v.x, z - v.z);
      if (d < v.rayon * 1.7) plat = Math.min(plat, Math.max(0, (d - v.rayon * 0.8) / (v.rayon * 0.9)));
    }
    h = h * (0.15 + 0.85 * plat);
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

  // Le village : des maisons en ruines le long de deux rues en croix, des murets, des tas de gravats.
  // (étape 71 : pareil pour chaque hameau, avec moins de maisons)
  for (const vi of VILLAGES) {
    for (let essai = 0, n = 0; n < vi.maisons && essai < 600; essai++) {
      const rue = hasard() < 0.5, le_long = (hasard() * 2 - 1) * vi.rayon, cote = (hasard() < 0.5 ? -1 : 1) * (11 + hasard() * 10);
      const x = vi.x + (rue ? le_long : cote), z = vi.z + (rue ? cote : le_long);
      const demiL = 4 + hasard() * 3.5, demiP = 3.5 + hasard() * 2.5;
      if (!loinDe(x, z, 4)) continue;
      boites.push({ x, z, demiL, demiP, angle: rue ? 0 : Math.PI / 2, h: 4 + hasard() * 4, sorte: "maison", type: "maison", hameau: vi !== V, lieu: vi.nom, graine: Math.floor(hasard() * 1e6) });
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
  // Les haies et les murets dans la campagne (pour se cacher), et quelques ruines isolées (des granges).
  for (let k = 0; k < W.haies; k++) {
    const x = (hasard() * 2 - 1) * (demi - 80), z = (hasard() * 2 - 1) * (demi - 80);
    if (presDUnVillage(x, z, 20) || dansUnCamp(x, z) || !loinDe(x, z, 8)) continue;
    boites.push({ x, z, demiL: 8 + hasard() * 10, demiP: 0.6, angle: hasard() * Math.PI, h: 1.6, sorte: "muret", type: "haie", lieu: "la campagne" });
  }
  for (let k = 0; k < W.granges; k++) {
    const x = (hasard() * 2 - 1) * (demi - 120), z = (hasard() * 2 - 1) * (demi - 120);
    if (presDUnVillage(x, z, 40) || dansUnCamp(x, z) || !loinDe(x, z, 10)) continue;
    boites.push({ x, z, demiL: 6 + hasard() * 3, demiP: 4.5, angle: hasard() * Math.PI, h: 5, sorte: "maison", type: "grange", lieu: "la campagne", graine: Math.floor(hasard() * 1e6) });
  }
  // Les arbres : en grandes forêts (étape 71), en bosquets (des petits bois), et quelques-uns tout seuls.
  const centres = [], forets = [];
  for (let k = 0; k < W.bosquets; k++) centres.push({ x: (hasard() * 2 - 1) * (demi - 70), z: (hasard() * 2 - 1) * (demi - 70), r: 18 + hasard() * 22 });
  for (let k = 0; k < W.forets; k++) forets.push({ x: (hasard() * 2 - 1) * (demi - 150), z: (hasard() * 2 - 1) * (demi - 150), r: 60 + hasard() * 70 });
  for (let k = 0; k < W.arbres; k++) {
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
    if (Math.max(Math.abs(x), Math.abs(z)) > demi - 30 || presDUnVillage(x, z, -0.1 * V.rayon) || dansUnCamp(x, z) || !loinDe(x, z, 2) || dansLEau(x, z, 3) || presDUnPortail(x, z, 9)) continue; // (pas sur les départs)
    arbres.push({ x, z, r: 0.6, taille: 0.8 + hasard() * 0.6, ecrase: false, sorte: hasard() < 0.35 ? "sapin" : "feuillu", angleChute: 0 });
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
  const LAC_BOITE = { sorte: "eau" };

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

  return { choisirCarte, get carte() { return carte; }, get souterrain() { return carte === "souterrain"; }, hauteur, hauteurExacte, cahierBilan, normale, boites, arbres, arbresAutour, boitesAutour, grilles: { arbres: grilleArbres, boites: grilleBoites }, dansBoite, repousser, vueLibre, departs, demi, camp: CAMP, villages: VILLAGES, forets, distLac, dansLEau, ileProche, iles: ILES };
})();
