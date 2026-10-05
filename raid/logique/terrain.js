// 🗺️ LE TERRAIN : le géographe
//
// Étape 54. Il connaît le désert par cœur : pour n'importe quel endroit (x, z), il sait dire
//   - la HAUTEUR du sol (hauteur), et dans quel sens il penche (normale) ;
//   - le TERRAIN : la piste, la terre, les herbes sèches, le sable des dunes, les cailloux, la boue, le gué, l'eau profonde ;
//   - la hauteur de l'EAU de la rivière (niveauEau), et à quelle distance on est de la PISTE.
//
// Comment on invente le paysage ? On additionne des « bruits » (moteur/bruit.js) :
//   collines douces + petites bosses + DUNES au nord + collines de CAILLOUX à l'est,
//   puis on creuse la cuvette de BOUE et le lit de la RIVIÈRE (peu profond là où passe la piste : le GUÉ).
// Sur la piste, on enlève les petites bosses : c'est une route de terre tassée par les camions.
//
// Ce fichier ne dessine rien : affichage/decor.js lui demande les hauteurs pour construire le sol.

window.Raid = window.Raid || {};

Raid.Terrain = (function () {
  const C = Raid.CONFIG, W = C.monde;
  const B = Raid.Bruit;
  const collines = B.creer(W.graine), bosses = B.creer(W.graine + 1), dunes = B.creer(W.graine + 2);
  const rocs = B.creer(W.graine + 3), cailloux = B.creer(W.graine + 4), herbes = B.creer(W.graine + 5);
  const demi = W.taille / 2;
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const lisse = (t) => t * t * (3 - 2 * t);

  // ---------------------------------------------------------------- la piste
  // Une boucle qui passe par les points de config.js, arrondie (courbe de Catmull-Rom), avec un point tous les 3 m.
  const points = W.piste;
  const piste = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length], p1 = points[i], p2 = points[(i + 1) % points.length], p3 = points[(i + 2) % points.length];
    const l = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(2, Math.round(l / 3));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      piste.push({ x: f(p0[0], p1[0], p2[0], p3[0]), z: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  let s = 0;
  piste.forEach((p, i) => {
    const q = piste[(i + 1) % piste.length];
    p.s = s;
    p.angle = Math.atan2(q.z - p.z, q.x - p.x);
    s += Math.hypot(q.x - p.x, q.z - p.z);
  });
  const longueurPiste = s;

  // Une grille de cases de 4 m qui retient, pour chaque case, la distance à la piste et le point de piste le plus proche
  // (calculé une seule fois au début : ensuite, c'est très rapide).
  const CASE = 4, N = Math.ceil(W.taille / CASE);
  const distance = new Float32Array(N * N).fill(999), plusProche = new Int32Array(N * N).fill(-1);
  const RAYON = 30;
  piste.forEach((p, i) => {
    const ci = Math.floor((p.x + demi) / CASE), cj = Math.floor((p.z + demi) / CASE), r = Math.ceil(RAYON / CASE);
    for (let a = ci - r; a <= ci + r; a++) {
      for (let b = cj - r; b <= cj + r; b++) {
        if (a < 0 || b < 0 || a >= N || b >= N) continue;
        const d = Math.hypot((a + 0.5) * CASE - demi - p.x, (b + 0.5) * CASE - demi - p.z);
        if (d < distance[a * N + b]) {
          distance[a * N + b] = d;
          plusProche[a * N + b] = i;
        }
      }
    }
  });
  const cellule = (x, z) => {
    const a = Math.floor((x + demi) / CASE), b = Math.floor((z + demi) / CASE);
    return a < 0 || b < 0 || a >= N || b >= N ? -1 : a * N + b;
  };
  // La distance exacte à la piste (on regarde les points de piste autour du plus proche de la case).
  function distancePiste(x, z) {
    const c = cellule(x, z);
    if (c < 0 || plusProche[c] < 0) return 999;
    const i0 = plusProche[c];
    let d = 999;
    for (let k = -3; k <= 3; k++) {
      const a = piste[(i0 + k + piste.length) % piste.length], b = piste[(i0 + k + 1 + piste.length) % piste.length];
      const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1;
      const t = clamp01(((x - a.x) * dx + (z - a.z) * dz) / l2);
      d = Math.min(d, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
    }
    return d;
  }
  const pointPiste = (x, z) => {
    const c = cellule(x, z);
    return c < 0 ? -1 : plusProche[c];
  };

  // ---------------------------------------------------------------- la rivière
  const R = W.riviere;
  const xRiviere = (z) => R.x + R.ondulation * Math.sin(z / R.longueur);
  // La demi-largeur de la rivière : 0 avant sa source (au bord des dunes), puis elle s'élargit sur 80 m.
  const demiLargeur = (z) => (R.largeur / 2) * lisse(clamp01((z - R.source) / 80));
  // Les endroits où la piste traverse la rivière : là, c'est le gué (peu profond).
  const gues = piste.filter((p) => Math.abs(p.x - xRiviere(p.z)) < demiLargeur(p.z)).map((p) => ({ x: p.x, z: p.z }));
  const pres = (liste, x, z, r) => liste.some((g) => Math.hypot(g.x - x, g.z - z) < r);
  // Le niveau de l'eau : il suit les grandes collines (pas les bosses), un peu plus bas que les berges.
  const niveauEau = (z) => collines(xRiviere(z) / 260, z / 260) * 7 - 0.6;

  // ---------------------------------------------------------------- la hauteur
  function poids(x, z) {
    const D = W.dunes, K = W.cailloux;
    return { dunes: lisse(clamp01((D.zDebut - z) / (D.zDebut - D.zPlein))), cailloux: lisse(clamp01((x - K.xDebut) / (K.xPlein - K.xDebut))) };
  }
  function hauteurBrute(x, z, dP) {
    const p = poids(x, z);
    let h = B.fractal(collines, x / 260, z / 260, 4) * 7;
    let petit = bosses(x / 14, z / 14) * 0.35;
    if (p.dunes > 0) {
      // les dunes : des crêtes de sable (on prend « 1 − |bruit| » : ça fait des arêtes), plus hautes vers le nord
      const crete = 1 - Math.abs(B.fractal(dunes, x / 120 + z / 600, z / 170, 3));
      h += p.dunes * W.dunes.hauteur * Math.pow(crete, 2.4);
    }
    if (p.cailloux > 0) {
      h += p.cailloux * W.cailloux.hauteur * Math.max(0, B.fractal(rocs, x / 190, z / 190, 4) + 0.15);
      petit += p.cailloux * Math.abs(cailloux(x / 6, z / 6)) * 0.9;
    }
    // sur la piste (et un peu autour), les petites bosses sont aplanies
    const surPiste = 1 - lisse(clamp01((dP - W.largeurPiste / 2) / 8));
    h += petit * (1 - 0.85 * surPiste);
    // la cuvette de boue
    const M = W.boue, dM = Math.hypot(x - M.x, z - M.z);
    if (dM < M.rayon) h -= M.profondeur * Math.pow(1 - (dM / M.rayon) ** 2, 2);
    return h;
  }
  // Le PROFIL de la piste : sa hauteur tout le long, LISSÉE (on fait la moyenne sur 45 m), comme si un bulldozer
  // avait aplani la route : plus de murs impossibles à monter.
  const brut = piste.map((p) => hauteurBrute(p.x, p.z, 0));
  const profil = brut.map((h, i) => {
    let somme = 0;
    for (let k = -7; k <= 7; k++) somme += brut[(i + k + brut.length) % brut.length];
    return somme / 15;
  });
  // La hauteur du sol : le paysage ; autour de la piste, il rejoint doucement le profil (sur 10 m de chaque côté) ;
  // puis on creuse la rivière (son lit, et ses berges en pente douce sur 12 m).
  function hauteur(x, z) {
    const dP = distancePiste(x, z);
    let h = hauteurBrute(x, z, dP);
    if (dP < W.largeurPiste / 2 + 10) {
      const i = pointPiste(x, z);
      if (i >= 0) {
        // (on mélange les profils des deux points de piste les plus proches, pour que ce soit bien lisse)
        const a = piste[i], b = piste[(i + 1) % piste.length], dx = b.x - a.x, dz = b.z - a.z;
        const t = clamp01(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1));
        const hp = profil[i] + (profil[(i + 1) % piste.length] - profil[i]) * t;
        h += (hp - h) * (1 - lisse(clamp01((dP - W.largeurPiste / 2) / 10)));
      }
    }
    const dR = Math.abs(x - xRiviere(z)), L = demiLargeur(z);
    if (L > 0.5 && dR < L + 12) {
      const eau = niveauEau(z), gue = pres(gues, x, z, R.largeurGue / 2);
      const fond = eau - (gue ? R.gue : R.profondeur);
      if (dR < L) h = eau - (eau - fond) * Math.min(1, 1.6 * (1 - (dR / L) ** 2));
      else h = eau + (Math.max(h, eau + 0.3) - eau) * lisse((dR - L) / 12);
    }
    return h;
  }

  // Dans quel sens penche le sol en (x, z) ? (le « vecteur normal », qui sort du sol)
  function normale(x, z) {
    const d = 0.8;
    const hx = hauteur(x + d, z) - hauteur(x - d, z), hz = hauteur(x, z + d) - hauteur(x, z - d);
    const l = Math.hypot(hx, 2 * d, hz);
    return { x: -hx / l, y: (2 * d) / l, z: -hz / l };
  }

  // ---------------------------------------------------------------- le terrain
  function terrain(x, z) {
    const dR = Math.abs(x - xRiviere(z));
    if (dR < demiLargeur(z)) {
      if (pres(gues, x, z, R.largeurGue / 2)) return "gue";
      return hauteur(x, z) < niveauEau(z) - 0.5 ? "eau" : "gue";
    }
    if (distancePiste(x, z) < W.largeurPiste / 2) return "piste";
    const M = W.boue;
    if (Math.hypot(x - M.x, z - M.z) < M.rayon * 0.82) return "boue";
    const p = poids(x, z);
    if (p.dunes > 0.5) return "sable";
    if (p.cailloux > 0.5) return "cailloux";
    return herbes(x / 45, z / 45) > 0.12 ? "herbe" : "terre";
  }

  // De l'eau ici ? (et à quelle hauteur est sa surface)
  function eau(x, z) {
    const dR = Math.abs(x - xRiviere(z));
    return dR < demiLargeur(z) ? niveauEau(z) : null;
  }

  return { hauteur, normale, terrain, eau, distancePiste, pointPiste, piste, longueurPiste, xRiviere, demiLargeur, niveauEau, gues, demi };
})();
