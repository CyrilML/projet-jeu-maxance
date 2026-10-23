// 💥 LES EXPLOSIONS : le chef artificier (demande 92)
//
// ✍️ « Les explosions et la lumière : boule de feu, fumée qui monte, débris, onde de choc, l'écran qui tremble. »
// Une vraie explosion, au cinéma, c'est un MILLE-FEUILLE : plusieurs couches qui arrivent l'une après l'autre.
//   1. l'ÉCLAIR (1/10 de seconde) : une lueur énorme et une vraie lumière qui éclaire tout autour ;
//   2. la BOULE DE FEU : des flammes qui « bouillonnent » (4 images qui défilent), du blanc au jaune, à l'orange, au
//      rouge sombre, et qui montent (l'air chaud est léger) ;
//   3. l'ONDE DE CHOC : un anneau de poussière qui court sur le sol, très vite, et des bouffées qui roulent vers l'extérieur ;
//   4. les DÉBRIS : des cailloux en 3D et des mottes de terre qui retombent (la gravité), des ÉTINCELLES ;
//   5. la COLONNE DE FUMÉE noire, qui sort pendant 1 seconde, monte longtemps et part avec le VENT ;
//   6. l'ÉCRAN QUI TREMBLE (la caméra tourne un tout petit peu, au hasard) : fort tout près, rien au loin ;
//   7. le BOUM, que les sons jouent EN RETARD (le son va à 340 m/s : à 340 m, on l'entend 1 s après l'éclair) et plus
//      sourd de loin (affichage/sons.js).
// Et un TANK DÉTRUIT devient une épave qui BRÛLE : des flammes, une lueur qui tremble, et une fumée noire pendant 2 minutes.
// (Demande 93 : le feu CACHE ce qui est derrière au lieu de s'ajouter à l'image, qui devenait toute blanche ; il finit en
// fumée noire ; de grosses gerbes de TERRE brune ; et des NAPPES de fumée qui traînent au ras du sol, longtemps.)
// Sur l'eau : une grande gerbe blanche. En l'air (un avion touché, le flak) : pas d'onde au sol.
// (Livre n° 25) Une BAIE de QG qui saute : une explosion de C4 et une épave qui brûle ; le QG détruit : encore 2 boums.
// Il ne change jamais le monde : la caméra qui tremble est remise droite à chaque image par la scène.

window.Tanks = window.Tanks || {};

Tanks.Explosions = (function () {
  const C = Tanks.CONFIG, R = C.realisme.explosions, T = Tanks.Terrain;
  let P, I, M = null, horloge = 0;
  const actives = []; // les explosions dont la fumée sort encore
  const epaves = []; // les épaves qui brûlent
  const secousse = { force: 0, angle: 0 };
  const bilan = { explosions: 0, actives: 0, epaves: 0, epavesEnFeu: 0, secousse: 0, parSorte: {}, debris: 0, nappes: 0, nappesMax: 0, nappesFaites: 0 };
  const alea = (f) => (Math.random() * 2 - 1) * f;
  const COULEURS = { terre: [0.36, 0.3, 0.23], sable: [0.8, 0.68, 0.5], pierre: [0.55, 0.53, 0.5], brique: [0.6, 0.45, 0.36], bois: [0.45, 0.35, 0.24], feuilles: [0.36, 0.42, 0.26], metal: [0.3, 0.3, 0.3], beton: [0.55, 0.55, 0.55], eau: [0.9, 0.95, 1] };
  const SORTES = { terre: "terre", sable: "sable", pierre: "pierre", gravats: "pierre", tuiles: "brique", brique: "brique", bois: "bois", porte: "bois", haie: "feuilles", metal: "metal", eau: "eau", beton: "beton" };

  function modeles() {
    const B = R.boule, F = R.fumee;
    return {
      // (demande 93) la lueur : plus petite et moins blanche ; le CŒUR blanc-jaune ne dure qu'un instant
      lueur: { image: I.lueur, mode: P.FACE, brille: true, vie: R.eclair.duree, taille: [3.5, 5.5], couleur: [1.1, 0.62, 0.26], opacite: 0.75, entree: 0.0001, sortie: 1.8, portee: 6 },
      coeur: { image: I.lueur, mode: P.FACE, brille: true, vie: R.coeur.vie, taille: [R.coeur.taille * 0.6, R.coeur.taille], couleur: [1.6, 1.15, 0.55], entree: 0.0001, sortie: 1.5, portee: 6 },
      // (demande 93) le FEU n'est plus « ajouté » à l'image (ça faisait une boule blanche) : il CACHE ce qui est derrière,
      // passe du jaune à l'orange, au rouge sombre, et finit en FUMÉE presque noire
      flamme: { image: I.flamme, images: 4, defile: 2, mode: P.FACE, vie: B.vie * 1.25, taille: [B.taille * 0.35, B.taille * 1.15], couleurs: [[2.1, 1.3, 0.5], [1.9, 0.72, 0.17], [1.05, 0.3, 0.06], [0.3, 0.11, 0.05], [0.09, 0.08, 0.075]], opacite: 0.96, monte: B.monte, frein: 3.5, tourne: 1.2, entree: 0.0001, sortie: 0.7, portee: 6 },
      fumeeFeu: { image: I.fumee, mode: P.FACE, eclaire: true, vie: 5, taille: [1.5, R.fumeeFeu.taille], couleur: [0.085, 0.078, 0.072], opacite: 0.92, frein: 1.6, monte: R.fumeeFeu.monte, vent: 0.3, tourne: 0.35, entree: 0.12, sortie: 1.6, portee: 8 },
      terre: { image: I.poussiere, mode: P.FACE, eclaire: true, vie: 2.6, taille: [0.8, R.terre.taille], opacite: 0.9, gravite: 5.5, frein: 0.6, tourne: 0.6, entree: 0.0001, sortie: 1.3, portee: 6 },
      nappe: { image: I.fumee2, mode: P.FACE, eclaire: true, vie: R.brume.vie, taille: [R.brume.taille * 0.45, R.brume.taille], couleur: [0.5, 0.48, 0.45], opacite: R.brume.opacite, frein: 0.4, vent: 0.18, tourne: 0.04, entree: 0.18, sortie: 1.2, portee: 10 },
      fumeeNoire: { image: I.fumee, mode: P.FACE, eclaire: true, vie: F.vie, taille: [2, F.taille], couleur: [0.11, 0.1, 0.095], opacite: 0.86, frein: 0.9, monte: F.monte, vent: 0.35, tourne: 0.25, entree: 0.05, sortie: 1.8, portee: 8 },
      fumeeGrise: { image: I.fumee2, mode: P.FACE, eclaire: true, vie: F.vie * 0.8, taille: [2, F.taille * 0.9], couleur: [0.42, 0.4, 0.37], opacite: 0.6, frein: 0.9, monte: F.monte * 0.8, vent: 0.4, tourne: 0.25, entree: 0.05, sortie: 1.6, portee: 8 },
      onde: { image: I.anneau, mode: P.PLAT, vie: R.onde.duree, taille: [1, R.onde.rayon * 2], opacite: R.onde.opacite, lineaire: true, entree: 0.0001, sortie: 1.3, portee: 4 },
      ondeAir: { image: I.anneau, mode: P.FACE, brille: true, vie: 0.16, taille: [1, R.onde.rayon * 1.2], couleur: [0.07, 0.065, 0.06], lineaire: true, entree: 0.0001, sortie: 1, portee: 4 },
      roule: { image: I.poussiere, mode: P.FACE, eclaire: true, vie: 3.2, taille: [1.2, 5], opacite: 0.6, frein: 2.4, monte: 0.4, vent: 0.4, tourne: 0.4, sortie: 1.4, portee: 6 },
      motte: { image: I.motte, mode: P.FACE, eclaire: true, vie: 2.2, taille: [0.28, 0.24], gravite: 9.8, rebond: 0.2, tourne: 8, entree: 0.0001, sortie: 0.2, portee: 4 },
      jet: { image: I.poussiere, mode: P.TRAIT, eclaire: true, vie: 1.4, etire: 0.08, taille: [0.3, 0.9], opacite: 0.7, gravite: 9.8, entree: 0.0001, sortie: 1.2, portee: 4 },
      etincelle: { image: I.trait, mode: P.TRAIT, brille: true, vie: 0.9, etire: 0.03, taille: [0.06, 0.03], couleurs: [[4, 3, 1.6], [3, 1.3, 0.3], [1, 0.3, 0.05]], gravite: 9.8, rebond: 0.35, entree: 0.0001, sortie: 1, portee: 4 },
      braise: { image: I.lueur, mode: P.FACE, brille: true, vie: 2.5, taille: [0.12, 0.05], couleurs: [[3, 1.6, 0.5], [1.5, 0.4, 0.05]], monte: 2.2, frein: 1.5, vent: 0.8, entree: 0.0001, sortie: 1, portee: 3 },
      poussiereBrulee: { image: I.poussiere, mode: P.FACE, eclaire: true, vie: 6, taille: [2, 6], couleur: [0.22, 0.19, 0.16], opacite: 0.45, frein: 1.5, monte: 0.15, vent: 0.4, tourne: 0.2, sortie: 1.5, portee: 6 },
      gerbe: { image: I.gouttes, mode: P.FACE, vie: 1.8, taille: [0.6, 1.6], couleur: [0.95, 0.97, 1], opacite: 0.9, gravite: 9.8, entree: 0.0001, sortie: 0.7, portee: 6 },
      colonneEau: { image: I.trait, mode: P.TRAIT, vie: 1.6, etire: 0.12, taille: [0.3, 0.6], couleur: [0.95, 0.97, 1], opacite: 0.75, gravite: 9.8, entree: 0.0001, sortie: 0.8, portee: 6 },
      brume: { image: I.fumee2, mode: P.FACE, eclaire: true, vie: 3.5, taille: [2, 7], couleur: [0.92, 0.95, 0.98], opacite: 0.45, frein: 1.5, monte: 0.3, vent: 0.5, sortie: 1.4, portee: 6 },
      rondEau: { image: I.anneau, mode: P.PLAT, vie: 2.4, taille: [1, 9], couleur: [0.95, 0.98, 1], opacite: 0.6, lineaire: true, entree: 0.0001, sortie: 1.2, portee: 5 },
      // l'épave qui brûle
      feu: { image: I.flamme, images: 4, defile: 3, mode: P.FACE, vie: 1, taille: [0.6, 2], couleurs: [[2.4, 1.7, 0.8], [2.1, 0.9, 0.22], [1, 0.3, 0.06], [0.12, 0.08, 0.06]], opacite: 0.92, monte: 3.2, frein: 1.5, tourne: 1.5, vent: 0.5, entree: 0.08, sortie: 1.2, portee: 6 },
      fumeeEpave: { image: I.fumee3, mode: P.FACE, eclaire: true, vie: 10, taille: [1.3, 8], couleur: [0.1, 0.095, 0.09], opacite: 0.72, frein: 0.6, monte: 2.8, vent: 0.45, tourne: 0.3, entree: 0.06, sortie: 1.7, portee: 8 },
    };
  }

  function initialiser() {
    P = Tanks.Particules;
    I = P.IMG;
    M = modeles();
    const radio = Tanks.Evenements, E = R.tailles;
    radio.ecouter("impact", (d) => {
      const g = d.grenade ? E.grenade : E[d.sorte] || 1;
      if (d.sur === "air") return void exploser(d.x, d.y, d.z, d.sorte === "flak" ? E.flak : g, "air", d.sorte);
      if (d.sur === "eau") return void exploser(d.x, d.y, d.z, g, "eau", d.sorte);
      if (d.sur === "char") return void exploser(d.x, d.y, d.z, g * 0.65, "metal", d.sorte); // (l'obus frappe le blindage)
      exploser(d.x, d.y, d.z, g, d.matiere || "terre", d.sorte);
    });
    radio.ecouter("detruit", (d) => {
      const g = d.petit ? E.petit : E.char;
      if (d.bateau) return void (exploser(d.x, d.y + 1, d.z, g, "eau", "char"), epave(d.x, d.y + 0.5, d.z, 0.4, 0.5));
      exploser(d.x, d.y + 1.2, d.z, g, "metal", "char");
      epave(d.x, d.y, d.z, d.petit ? 0.45 : 1, d.petit ? 0.5 : 1);
    });
    radio.ecouter("abattu", (d) => exploser(d.x, d.y, d.z, E.avion, "air", "avion"));
    // ✍️ (livre n° 25) une baie du QG saute : une explosion, puis elle brûle et fume ; le QG détruit : 2 explosions en plus
    radio.ecouter("qg-baie-detruite", (d) => (exploser(d.x, d.y, d.z, E.c4 * 0.7, "metal", "qg"), epave(d.x, 0.4, d.z, 0.5, 0.6)));
    radio.ecouter("qg-detruit", (d) => {
      exploser(d.x, 1.5, d.z, E.c4, "beton", "qg");
      exploser(d.x + 3, 1, d.z - 2, E.c4 * 0.6, "metal", "qg");
      epave(d.x, 0.3, d.z, 0.8, 1);
    });
    radio.ecouter("crash", (d) => {
      if (d.dansLEau) return void exploser(d.x, d.y, d.z, E.crash, "eau", "crash");
      exploser(d.x, d.y + 1, d.z, E.crash, "metal", "crash");
      epave(d.x, d.y - 1, d.z, 0.7, 0.6);
    });
  }

  // ------------------------------------------------------------------ une explosion
  // g : sa taille (1 = un obus de tank) ; matiere : ce qui a été touché ; sorte : obus, bombe… (pour le bilan)
  function exploser(x, y, z, g, matiere, sorte) {
    bilan.explosions++;
    bilan.parSorte[sorte] = (bilan.parSorte[sorte] || 0) + 1;
    const air = matiere === "air", eau = matiere === "eau", sol = eau ? C.lac.niveau : T.hauteur(x, z), auSol = !air && y - sol < 3;
    const s = SORTES[matiere] || (air ? "air" : "terre"), couleur = COULEURS[s] || COULEURS.terre, rg = Math.sqrt(g);
    // 1. l'éclair
    P.emettre(M.lueur, x, y + 0.6 * g, z, 0, 0, 0, g * (eau ? 0.5 : 1));
    P.emettre(M.coeur, x, y + 0.5 * g, z, 0, 0, 0, Math.sqrt(g) * (eau ? 0.6 : 1));
    P.lumiere(x, y + 1.5 * g, z, 0xffa048, R.eclair.lumiere * g, R.eclair.portee * rg, R.eclair.duree * (1 + g * 0.5));
    secousseIci(x, y, z, g);
    if (eau) return void gerbe(x, sol, z, g);
    // 2. la boule de feu (plus petite en l'air pour le flak, qui fait surtout de la fumée noire)
    const nb = Math.round(R.boule.nombre * (air && g < 0.5 ? 0.3 : 1) * Math.min(2, rg));
    for (let k = 0; k < nb; k++) {
      const a = Math.random() * Math.PI * 2, h = Math.random(), v = (2 + Math.random() * 5) * rg;
      P.emettre(M.flamme, x + Math.cos(a) * g * 0.6 * h, y + 0.4 * g + h * g * 0.8, z + Math.sin(a) * g * 0.6 * h, Math.cos(a) * v, (1.5 + Math.random() * 4) * rg, Math.sin(a) * v, g * (0.7 + Math.random() * 0.6), null, 0.8 + rg * 0.35);
    }
    // (demande 93) la FUMÉE NOIRE qui sort du feu et monte en bouillonnant
    for (let k = 0; k < Math.round(R.fumeeFeu.nombre * Math.min(2, rg) * (air && g < 0.5 ? 0.5 : 1)); k++) {
      const a = Math.random() * Math.PI * 2, v = (1 + Math.random() * 3) * rg;
      P.emettre(M.fumeeFeu, x + Math.cos(a) * g * 0.5, y + g * (0.6 + Math.random() * 0.8), z + Math.sin(a) * g * 0.5, Math.cos(a) * v, (2 + Math.random() * 3) * rg, Math.sin(a) * v, Math.min(2.2, g) * (0.6 + Math.random() * 0.5), null, 0.8 + Math.random() * 0.5);
    }
    // 3. l'onde de choc (sur le sol) et l'anneau qui s'écarte dans l'air
    if (auSol) {
      P.emettre(M.onde, x, sol + 0.15, z, 0, 0, 0, g, couleur);
      const n = Math.round(R.onde.bouffees * Math.min(1.6, rg));
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + alea(0.2), v = (9 + Math.random() * 6) * rg;
        P.emettre(M.roule, x + Math.cos(a) * g, sol + 0.5, z + Math.sin(a) * g, Math.cos(a) * v, 0.6 + Math.random(), Math.sin(a) * v, g * (0.7 + Math.random() * 0.5), couleur);
      }
    }
    // (demande 93) la TERRE projetée en l'air : de grosses gerbes brunes qui montent puis retombent
    if (auSol && s !== "metal") {
      const brun = [couleur[0] * 0.8, couleur[1] * 0.75, couleur[2] * 0.7];
      for (let k = 0; k < Math.round(R.terre.nombre * Math.min(1.8, rg)); k++) {
        const a = Math.random() * Math.PI * 2, o = Math.random() * 0.45, v = R.terre.vitesse * rg * (0.6 + Math.random() * 0.6);
        P.emettre(M.terre, x + Math.cos(a) * 0.4 * g, sol + 0.4, z + Math.sin(a) * 0.4 * g, Math.cos(a) * o * v, v, Math.sin(a) * o * v, g * (0.5 + Math.random() * 0.6), brun, 0.8 + Math.random() * 0.5);
      }
      nappes(x, sol, z, g, R.brume.parExplosion * Math.min(2, rg));
    }
    if (g >= 1.4) P.emettre(M.ondeAir, x, y + g, z, 0, 0, 0, g);
    // 4. les débris : des jets de terre (au sol), des mottes, des cailloux en 3D, des étincelles
    if (auSol && s !== "metal") {
      for (let k = 0; k < Math.round(10 * rg); k++) {
        const a = Math.random() * Math.PI * 2, o = 0.2 + Math.random() * 0.6;
        P.emettre(M.jet, x, sol + 0.3, z, Math.cos(a) * o * 9 * rg, (8 + Math.random() * 9) * rg, Math.sin(a) * o * 9 * rg, g * (0.6 + Math.random() * 0.6), couleur);
      }
    }
    const dm = R.debris;
    for (let k = 0; k < Math.round(dm.mottes * rg); k++) {
      const a = Math.random() * Math.PI * 2, v = dm.vitesse * rg * (0.3 + Math.random() * 0.7);
      P.emettre(M.motte, x, y + 0.3, z, Math.cos(a) * v * 0.6, v * (0.5 + Math.random() * 0.6), Math.sin(a) * v * 0.6, 0.6 + Math.random() * 0.9, s === "metal" || air ? [0.16, 0.15, 0.14] : couleur);
    }
    for (let k = 0; k < Math.round(dm.nombre * rg); k++) {
      const a = Math.random() * Math.PI * 2, v = dm.vitesse * rg * (0.4 + Math.random() * 0.6);
      P.caillou(x + alea(0.4), y + 0.4, z + alea(0.4), Math.cos(a) * v * 0.55, v * (0.45 + Math.random() * 0.6), Math.sin(a) * v * 0.55, dm.taille * (0.5 + Math.random()) * Math.min(2, rg), s === "metal" || air ? [0.2, 0.19, 0.18] : couleur, 4 + Math.random() * 4);
      bilan.debris++;
    }
    const ne = Math.round(R.etincelles.nombre * rg * (s === "metal" ? 1.6 : 1));
    for (let k = 0; k < ne; k++) {
      const a = Math.random() * Math.PI * 2, b = Math.random() * 1.3, v = R.etincelles.vitesse * (0.4 + Math.random() * 0.6);
      P.emettre(M.etincelle, x, y + 0.5, z, Math.cos(a) * Math.cos(b) * v, Math.sin(b) * v + 2, Math.sin(a) * Math.cos(b) * v, 0.7 + Math.random() * 0.6);
    }
    // 5. la fumée : elle sortira pendant « emission » s (une colonne qui monte), la poussière brûlée qui reste au sol
    actives.push({ x, y: air ? y : Math.max(y, sol), z, g, age: 0, sorties: 0, total: Math.round(R.fumee.nombre * Math.min(2.2, rg) * (air && g < 0.5 ? 0.4 : 1)), duree: R.fumee.emission * Math.min(2, rg), air, auSol, gris: s === "sable" || s === "pierre" || s === "beton" });
    if (auSol) for (let k = 0; k < 5 * rg; k++) P.emettre(M.poussiereBrulee, x + alea(g * 1.5), sol + 0.6, z + alea(g * 1.5), alea(1.5), 0.3, alea(1.5), g * (0.6 + Math.random() * 0.5), s === "sable" ? [0.55, 0.47, 0.36] : null);
  }

  // Une explosion sur l'eau : une colonne d'eau, des gouttes qui retombent, de la brume et un grand rond.
  function gerbe(x, y, z, g) {
    const rg = Math.sqrt(g);
    for (let k = 0; k < Math.round(16 * rg); k++) P.emettre(M.colonneEau, x + alea(0.8 * g), y, z + alea(0.8 * g), alea(2.5 * rg), (10 + Math.random() * 12) * rg, alea(2.5 * rg), g * (0.6 + Math.random() * 0.6));
    for (let k = 0; k < Math.round(14 * rg); k++) P.emettre(M.gerbe, x + alea(0.8 * g), y + 0.5, z + alea(0.8 * g), alea(3.5 * rg), (5 + Math.random() * 10) * rg, alea(3.5 * rg), g * (0.6 + Math.random() * 0.6));
    for (let k = 0; k < Math.round(8 * rg); k++) P.emettre(M.brume, x + alea(g), y + 1 + Math.random() * 3 * g, z + alea(g), alea(2), 0.5, alea(2), g * (0.6 + Math.random() * 0.6));
    P.emettre(M.rondEau, x, y + 0.03, z, 0, 0, 0, g);
    P.emettre(M.rondEau, x, y + 0.03, z, 0, 0, 0, g * 0.6, null, 1.5);
  }

  // ------------------------------------------------------------------ l'épave qui brûle
  function epave(x, y, z, feu, fumee) {
    if (epaves.length >= 12) epaves.shift(); // (les plus vieilles s'éteignent)
    const e = { x, y, z, age: 0, feu: R.epave.feu * feu, fumee: R.epave.fumee * fumee, accFeu: 0, accFumee: 0, accLumiere: 0, k: feu };
    epaves.push(e);
    return e;
  }
  // (demande 101) Éteindre des feux allumés pour un film : ils s'arrêtent net (la fumée déjà sortie s'envole encore).
  function eteindre(liste) {
    for (const e of liste) {
      const i = epaves.indexOf(e);
      if (i >= 0) epaves.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------ l'écran qui tremble
  // Une explosion près de la caméra « secoue » : la force dépend de la distance (rien au-delà de rayon × √taille).
  function secousseIci(x, y, z, g) {
    const c = P.camera, d = Math.hypot(x - c.x, y - c.y, z - c.z), rayon = R.secousse.rayon * Math.sqrt(g), k = Math.max(0, 1 - d / rayon);
    secousse.force = Math.min(1, secousse.force + k * k * Math.min(1.2, g));
  }
  // La scène appelle ceci juste avant de prendre la photo : la caméra tourne un tout petit peu (au hasard, mais en
  // douceur : des « sinus » de vitesses différentes) ; la scène la remet droite à l'image suivante (lookAt).
  function secouer(cam, dt) {
    if (secousse.force <= 0.001) return void (bilan.secousse = 0);
    secousse.force = Math.max(0, secousse.force - dt / R.secousse.calme);
    const a = R.secousse.angle * secousse.force * secousse.force, t = horloge * 31;
    cam.rotateX(a * (Math.sin(t) * 0.6 + Math.sin(t * 2.3 + 1) * 0.4));
    cam.rotateY(a * (Math.sin(t * 1.3 + 2) * 0.6 + Math.sin(t * 2.9) * 0.4));
    cam.rotateZ(a * 0.5 * Math.sin(t * 1.7 + 4));
    cam.updateMatrixWorld();
    bilan.secousse = secousse.force;
  }

  // ------------------------------------------------------------------ chaque image
  function maj(dt) {
    horloge += dt;
    // les colonnes de fumée qui sortent encore
    for (let i = actives.length - 1; i >= 0; i--) {
      const e = actives[i];
      e.age += dt;
      const voulu = Math.min(e.total, Math.ceil((e.age / e.duree) * e.total));
      while (e.sorties < voulu) {
        e.sorties++;
        const f = e.sorties / e.total, rg = Math.sqrt(e.g);
        const modele = e.gris && Math.random() < 0.5 ? M.fumeeGrise : M.fumeeNoire;
        P.emettre(modele, e.x + alea(e.g * 0.8), e.y + e.g * (0.6 + f * 1.4), e.z + alea(e.g * 0.8), alea(1.2), (R.fumee.monte * (1.2 - f * 0.5)) * Math.min(1.8, rg), alea(1.2), Math.min(2.2, e.g) * (0.6 + Math.random() * 0.5), null, 0.7 + Math.random() * 0.5);
      }
      if (e.sorties >= e.total) actives.splice(i, 1);
    }
    bilan.actives = actives.length;
    // les épaves : des flammes (de moins en moins), une lueur qui tremble, de la fumée noire
    let enFeu = 0;
    const EP = R.epave;
    for (let i = epaves.length - 1; i >= 0; i--) {
      const e = epaves[i];
      e.age += dt;
      if (e.age > e.fumee) { epaves.splice(i, 1); continue; }
      const feu = Math.max(0, 1 - e.age / e.feu), fumee = Math.max(0.15, 1 - e.age / e.fumee);
      if (feu > 0) {
        enFeu++;
        e.accFeu += dt * EP.flammes * (0.3 + 0.7 * feu) * e.k;
        while (e.accFeu > 1) {
          e.accFeu--;
          P.emettre(M.feu, e.x + alea(1.4 * e.k), e.y + 1.1 + Math.random() * 0.8, e.z + alea(1.4 * e.k), alea(0.4), 0.5, alea(0.4), (0.5 + feu * 0.7) * (0.6 + Math.random() * 0.6) * Math.max(0.5, e.k));
          if (Math.random() < 0.12) P.emettre(M.braise, e.x + alea(1), e.y + 2, e.z + alea(1), alea(1), 1.5 + Math.random() * 2, alea(1), 1);
        }
        e.accLumiere += dt;
        if (e.accLumiere > 0.12) (e.accLumiere = 0), P.lumiere(e.x, e.y + 2.4, e.z, 0xff7a2a, EP.lumiere * (0.4 + 0.6 * feu) * e.k, EP.portee, 0.2, true);
      }
      e.accNappe = (e.accNappe || 0) + dt;
      if (e.accNappe > R.brume.epave) (e.accNappe = 0), nappes(e.x, e.y, e.z, 1, 1, 6);
      e.accFumee += dt * EP.bouffees * fumee * Math.max(0.5, e.k);
      while (e.accFumee > 1) {
        e.accFumee--;
        P.emettre(M.fumeeEpave, e.x + alea(0.8), e.y + 2 + Math.random(), e.z + alea(0.8), alea(0.5), 1 + Math.random(), alea(0.5), 0.6 + fumee * 0.5, feu > 0 ? null : [0.2, 0.19, 0.18]);
      }
    }
    bilan.epaves = epaves.length;
    bilan.nappes = finsNappes.filter((t) => t >= horloge).length;
    bilan.nappesMax = R.brume.max[P.niveau] || 0;
    bilan.epavesEnFeu = enFeu;
  }

  // (demande 93) Les NAPPES de fumée qui traînent au ras du sol : de grands voiles très légers, qui partent lentement
  // avec le vent. Pas plus de « max » à la fois (selon la qualité) : on garde la date où chacune s'en ira.
  const finsNappes = [];
  function nappes(x, sol, z, g, n, ecart) {
    const max = R.brume.max[P.niveau] || 0;
    for (let k = 0; k < Math.round(n); k++) {
      for (let i = finsNappes.length - 1; i >= 0; i--) if (finsNappes[i] < horloge) finsNappes.splice(i, 1);
      if (finsNappes.length >= max) return;
      const a = Math.random() * Math.PI * 2, d = (ecart || 4) + Math.random() * 4 * g;
      const i = P.emettre(M.nappe, x + Math.cos(a) * d, sol + 1.6 + Math.random() * 2, z + Math.sin(a) * d, alea(0.5), 0, alea(0.5), 0.7 + Math.random() * 0.5, null, 0.8 + Math.random() * 0.4);
      if (i !== undefined) finsNappes.push(horloge + R.brume.vie * 1.2), bilan.nappesFaites++;
    }
  }

  function effacer() {
    finsNappes.length = 0;
    actives.length = epaves.length = 0;
    secousse.force = 0;
  }

  return { initialiser, maj, effacer, exploser, epave, eteindre, secouer, secousse: secousseIci, bilan };
})();
