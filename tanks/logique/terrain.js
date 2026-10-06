// 🗺️ LE TERRAIN : le géomètre du champ de bataille (étape 60)
//
// Il invente le champ de bataille (toujours le même, grâce à la graine) et répond aux questions des autres :
//   - « quelle est la hauteur du sol en (x, z) ? » (des collines douces faites avec du bruit, et le village bien à plat) ;
//   - « qu'y a-t-il ici ? » : les OBSTACLES. Les maisons en ruines et les murets sont des BOÎTES (solides) ;
//     les arbres sont des CERCLES (un tank qui roule vite les ÉCRASE) ;
//   - « est-ce que je vois ma cible ? » : on avance le long de la ligne droite entre les deux, par petits pas, et on
//     regarde si on rentre dans une maison ou dans une colline (c'est la « ligne de vue »).
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Terrain = (function () {
  const C = Tanks.CONFIG, W = C.monde, B = Tanks.Bruit;
  const bruit = B.creer(W.graine);
  let etat = W.graine;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const demi = W.taille / 2, V = W.village;

  // ------------------------------------------------------------------ la hauteur du sol
  function hauteur(x, z) {
    let h = B.fractal(bruit, x / W.collines.taille, z / W.collines.taille, 4) * W.collines.hauteur;
    // le village est sur un terrain presque plat : on « aplatit » les collines près du centre
    const d = Math.hypot(x - V.x, z - V.z), plat = Math.min(1, Math.max(0, (d - V.rayon * 0.8) / (V.rayon * 0.9)));
    h = h * (0.15 + 0.85 * plat);
    // au bord, le terrain remonte un peu (une cuvette : on voit que c'est la fin du champ de bataille)
    const bord = Math.max(Math.abs(x), Math.abs(z)) - (demi - 60);
    if (bord > 0) h += bord * bord * 0.012;
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
  const loinDe = (x, z, d) => boites.every((b) => Math.hypot(b.x - x, b.z - z) > d + Math.max(b.demiL, b.demiP));

  // Le village : des maisons en ruines le long de deux rues en croix, des murets, des tas de gravats.
  for (let essai = 0, n = 0; n < V.maisons && essai < 600; essai++) {
    const rue = hasard() < 0.5, le_long = (hasard() * 2 - 1) * V.rayon, cote = (hasard() < 0.5 ? -1 : 1) * (11 + hasard() * 10);
    const x = V.x + (rue ? le_long : cote), z = V.z + (rue ? cote : le_long);
    const demiL = 4 + hasard() * 3.5, demiP = 3.5 + hasard() * 2.5;
    if (!loinDe(x, z, 4)) continue;
    boites.push({ x, z, demiL, demiP, angle: rue ? 0 : Math.PI / 2, h: 4 + hasard() * 4, sorte: "maison", graine: Math.floor(hasard() * 1e6) });
    n++;
  }
  for (let essai = 0, n = 0; n < V.murets && essai < 600; essai++) {
    const a = hasard() * Math.PI * 2, r = V.rayon * (0.4 + hasard() * 0.9);
    const x = V.x + Math.cos(a) * r, z = V.z + Math.sin(a) * r;
    if (!loinDe(x, z, 3)) continue;
    boites.push({ x, z, demiL: 3 + hasard() * 5, demiP: 0.35, angle: hasard() < 0.5 ? a : a + Math.PI / 2, h: 1.1, sorte: "muret" });
    n++;
  }
  // Les haies et les murets dans la campagne (pour se cacher), et quelques ruines isolées (des granges).
  for (let k = 0; k < W.haies; k++) {
    const x = (hasard() * 2 - 1) * (demi - 80), z = (hasard() * 2 - 1) * (demi - 80);
    if (Math.hypot(x, z) < V.rayon + 20 || !loinDe(x, z, 8)) continue;
    boites.push({ x, z, demiL: 8 + hasard() * 10, demiP: 0.6, angle: hasard() * Math.PI, h: 1.6, sorte: "muret" });
  }
  for (let k = 0; k < 6; k++) {
    const a = hasard() * Math.PI * 2, r = V.rayon + 60 + hasard() * 150;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (!loinDe(x, z, 10)) continue;
    boites.push({ x, z, demiL: 6 + hasard() * 3, demiP: 4.5, angle: hasard() * Math.PI, h: 5, sorte: "maison", graine: Math.floor(hasard() * 1e6) });
  }
  // Les arbres : en bosquets (des petits bois), et quelques-uns tout seuls.
  const centres = [];
  for (let k = 0; k < W.bosquets; k++) centres.push({ x: (hasard() * 2 - 1) * (demi - 70), z: (hasard() * 2 - 1) * (demi - 70), r: 18 + hasard() * 22 });
  for (let k = 0; k < W.arbres; k++) {
    let x, z;
    if (hasard() < 0.8) {
      const c = centres[Math.floor(hasard() * centres.length)], a = hasard() * Math.PI * 2, r = Math.sqrt(hasard()) * c.r;
      x = c.x + Math.cos(a) * r;
      z = c.z + Math.sin(a) * r;
    } else {
      x = (hasard() * 2 - 1) * (demi - 40);
      z = (hasard() * 2 - 1) * (demi - 40);
    }
    if (Math.hypot(x - V.x, z - V.z) < V.rayon * 0.9 || !loinDe(x, z, 2) || Math.abs(z) > demi - 90 && Math.abs(x) < 120) continue; // (pas sur les départs)
    arbres.push({ x, z, r: 0.6, taille: 0.8 + hasard() * 0.6, ecrase: false, sorte: hasard() < 0.35 ? "sapin" : "feuillu", angleChute: 0 });
  }

  // Un point (x, z) dans une boîte ? (on le ramène dans le repère de la boîte : le long, et en travers)
  function dansBoite(b, x, z, marge) {
    const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x - b.x, dz = z - b.z;
    const u = dx * c + dz * s, v = -dx * s + dz * c;
    return Math.abs(u) < b.demiL + (marge || 0) && Math.abs(v) < b.demiP + (marge || 0);
  }

  // Pousse un cercle (un tank) hors des boîtes. Renvoie la boîte touchée (ou null).
  function repousser(o, r) {
    let touche = null;
    for (const b of boites) {
      if (Math.abs(o.x - b.x) > b.demiL + b.demiP + r || Math.abs(o.z - b.z) > b.demiL + b.demiP + r) continue;
      const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = o.x - b.x, dz = o.z - b.z;
      const u = dx * c + dz * s, v = -dx * s + dz * c;
      // le point de la boîte le plus proche du centre du tank
      const pu = Math.max(-b.demiL, Math.min(b.demiL, u)), pv = Math.max(-b.demiP, Math.min(b.demiP, v));
      let eu = u - pu, ev = v - pv, d = Math.hypot(eu, ev);
      if (d >= r) continue;
      if (d < 1e-6) { // (le centre est dans la boîte : on sort par le côté le plus proche)
        const versU = b.demiL - Math.abs(u), versV = b.demiP - Math.abs(v);
        if (versU < versV) (eu = Math.sign(u) || 1), (ev = 0);
        else (eu = 0), (ev = Math.sign(v) || 1);
        d = 0;
      }
      const l = Math.hypot(eu, ev) || 1, pousse = r - d;
      const nu = eu / l, nv = ev / l;
      o.x += (nu * c - nv * s) * pousse;
      o.z += (nu * s + nv * c) * pousse;
      touche = b;
    }
    return touche;
  }

  // La ligne de vue entre deux points (à la hauteur y au-dessus du sol) : rien entre les deux ?
  function vueLibre(x1, y1, z1, x2, y2, z2) {
    const d = Math.hypot(x2 - x1, z2 - z1), n = Math.max(2, Math.ceil(d / 4));
    for (let i = 1; i < n; i++) {
      const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t, z = z1 + (z2 - z1) * t;
      if (y < hauteur(x, z)) return false; // une colline entre les deux
      for (const b of boites) if (y < hauteur(b.x, b.z) + b.h && dansBoite(b, x, z)) return false;
    }
    return true;
  }

  // Les places de départ : les Bleus au sud (z > 0), les Rouges au nord, en ligne.
  function departs(equipe, n) {
    const z = (equipe === "bleus" ? 1 : -1) * (demi - 70), liste = [];
    for (let k = 0; k < n; k++) liste.push({ x: (k - (n - 1) / 2) * C.equipes.ecart, z, angle: equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2 });
    return liste;
  }

  return { hauteur, normale, boites, arbres, dansBoite, repousser, vueLibre, departs, demi };
})();
