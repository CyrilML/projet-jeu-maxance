// 🛠️ LES MODÈLES : le carrossier
//
// Ici, on fabrique la FORME des 5 voitures du garage, avec des triangles (voir moteur/projecteur.js).
// Toutes sont construites « nez vers x+ », posées au sol (y = 0), centrées en x = 0 et z = 0 :
// la scène 3D les déplace et les tourne ensuite.
//
// La brique de base, c'est la TRANCHE : une boîte qu'on peut pincer (plus étroite en haut ou à l'avant)
// et pencher (plus basse à l'avant qu'à l'arrière). En empilant des tranches, on sculpte un capot
// en pente, un pare-brise penché, un aileron… comme avec de la pâte à modeler, mais en chiffres.
//
//   la Rouge       → la voiture du début, telle quelle
//   le Taureau     → très basse, toute en pointes et en angles (style Lamborghini)
//   la Flèche      → arrondie, avec un toit qui descend jusqu'à l'arrière (style Porsche)
//   la Fusée       → longue, deux couleurs, grosse calandre en fer à cheval (style Bugatti)
//   la Formule 1   → fine, sans toit, roues dehors, ailerons devant et derrière
//
// Chaque modèle dit aussi où sont ses roues et quelle taille elles font.

window.Circuit = window.Circuit || {};

Circuit.Modeles = (function () {
  const NOIR = [0.08, 0.08, 0.09], VITRE = [0.15, 0.22, 0.35], PHARE = [1, 0.9, 0.5], FEU = [0.85, 0.1, 0.1];
  const BLANC = [0.95, 0.95, 0.95], ARGENT = [0.82, 0.84, 0.88], JAUNE = [1, 0.85, 0.1];

  // Une tranche : de x = ar (arrière) à x = av (avant), posée à la hauteur `bas`.
  //   hAv, hAr : la hauteur du dessus à l'avant et à l'arrière (pour pencher) ;
  //   l, lAr   : la demi-largeur en bas, à l'avant et à l'arrière ;
  //   lh, lhAr : la demi-largeur en haut (plus petite = pincée) ;
  //   xhAv, xhAr : où commence et finit le dessus (pour un pare-brise penché).
  function tranche(c, o, couleur) {
    const lAr = o.lAr !== undefined ? o.lAr : o.l;
    const lh = o.lh !== undefined ? o.lh : o.l;
    const lhAr = o.lhAr !== undefined ? o.lhAr : o.lAr !== undefined ? lAr : lh;
    const hAr = o.hAr !== undefined ? o.hAr : o.hAv;
    const xhAv = o.xhAv !== undefined ? o.xhAv : o.av, xhAr = o.xhAr !== undefined ? o.xhAr : o.ar;
    c.forme(
      [[o.av, o.bas, -o.l], [o.av, o.bas, o.l], [o.ar, o.bas, lAr], [o.ar, o.bas, -lAr]],
      [[xhAv, o.hAv, -lh], [xhAv, o.hAv, lh], [xhAr, hAr, lhAr], [xhAr, hAr, -lhAr]],
      couleur
    );
  }

  // 1. La Rouge : la voiture du début (étape 32), telle quelle.
  function classique(c, k1, k2) {
    c.boite(0, 0.55, 0, 4.2, 0.5, 1.9, k1); // le bas de caisse
    c.boite(1.6, 0.86, 0, 1, 0.14, 1.7, k1); // le capot
    c.boite(-0.3, 1.06, 0, 2, 0.5, 1.62, VITRE); // les vitres
    c.boite(-0.3, 1.34, 0, 1.8, 0.08, 1.5, k2); // le toit
    c.boite(-2.05, 1.2, 0, 0.35, 0.08, 1.9, NOIR); // l'aileron
    for (const z of [-0.7, 0.7]) {
      c.boite(-2.05, 0.95, z, 0.1, 0.45, 0.1, NOIR);
      c.boite(2.11, 0.6, z, 0.04, 0.18, 0.35, PHARE);
      c.boite(-2.11, 0.6, z, 0.04, 0.15, 0.4, FEU);
    }
    c.boite(0.1, 0.81, 0, 0.6, 0.02, 1.9, BLANC); // la bande de course
    return { avant: 1.35, arriere: -1.35, z: 0.95, rayon: 0.38, epaisseur: 0.3 };
  }

  // 2. Le Taureau (style Lamborghini) : très bas, en forme de coin, plein d'angles.
  function taureau(c, k1, k2) {
    tranche(c, { av: 2.35, ar: -2.2, bas: 0.25, hAv: 0.42, hAr: 0.82, l: 0.95, lAr: 1.02, lh: 0.9, lhAr: 1.0 }, k1); // la caisse en coin
    tranche(c, { av: 1.05, ar: -1.25, bas: 0.8, hAv: 1.12, xhAv: 0.05, xhAr: -0.75, l: 0.85, lh: 0.62, lAr: 0.9, lhAr: 0.62 }, VITRE); // la bulle vitrée, très penchée
    tranche(c, { av: 0.05, ar: -0.75, bas: 1.11, hAv: 1.15, l: 0.62 }, k1); // le toit
    tranche(c, { av: -0.75, ar: -2.1, bas: 0.8, hAv: 1.05, hAr: 0.86, xhAv: -0.85, l: 0.9, lh: 0.55, lAr: 0.95, lhAr: 0.8 }, k1); // le capot moteur
    for (const z of [-1, 1]) {
      tranche(c, { av: -0.1, ar: -1.1, bas: 0.4, hAv: 0.7, l: 0.06 }, k2); // les grandes prises d'air sur les côtés
      c.boite(-0.6, 0.55, z * 1.0, 1.0, 0.3, 0.06, k2);
      c.boite(2.25, 0.46, z * 0.62, 0.12, 0.05, 0.42, PHARE); // les phares fins, en fente
      c.boite(-2.2, 0.68, z * 0.62, 0.05, 0.06, 0.5, FEU); // les feux en « Y »
    }
    c.boite(-2.15, 0.4, 0, 0.12, 0.25, 1.6, k2); // le diffuseur arrière
    c.boite(-1.95, 1.0, 0, 0.3, 0.05, 1.7, k2); // le petit aileron
    return { avant: 1.45, arriere: -1.45, z: 1.0, rayon: 0.36, epaisseur: 0.34 };
  }

  // 3. La Flèche (style Porsche) : ronde, phares « yeux de grenouille », toit qui plonge vers l'arrière.
  function fleche(c, k1, k2) {
    tranche(c, { av: 2.15, ar: -2.15, bas: 0.25, hAv: 0.55, hAr: 0.72, l: 0.88, lh: 0.82, lAr: 0.95, lhAr: 0.9 }, k1); // la caisse
    tranche(c, { av: 2.1, ar: 0.95, bas: 0.55, hAv: 0.6, hAr: 0.8, l: 0.82, lh: 0.55, lAr: 0.88, lhAr: 0.75 }, k1); // le capot avant arrondi
    tranche(c, { av: 0.95, ar: -0.4, bas: 0.8, hAv: 1.25, xhAv: 0.35, xhAr: -0.4, l: 0.82, lh: 0.62, lAr: 0.85, lhAr: 0.66 }, VITRE); // pare-brise et vitres
    tranche(c, { av: 0.35, ar: -0.4, bas: 1.24, hAv: 1.28, l: 0.62, lAr: 0.66 }, k1); // le toit
    tranche(c, { av: -0.4, ar: -2.1, bas: 0.72, hAv: 1.27, hAr: 0.85, l: 0.88, lh: 0.66, lAr: 0.9, lhAr: 0.72 }, k1); // le dos qui plonge
    tranche(c, { av: -0.6, ar: -1.6, bas: 1.0, hAv: 1.16, hAr: 0.97, xhAv: -0.6, l: 0.55, lh: 0.45 }, VITRE); // la vitre arrière
    for (const z of [-1, 1]) {
      tranche(c, { av: 1.95, ar: 1.65, bas: 0.55, hAv: 0.78, l: 0.13 }, k1); // les « yeux » des phares
      c.boite(1.96, 0.68, z * 0.68, 0.06, 0.16, 0.22, PHARE);
      c.boite(1.8, 0.68, z * 0.68, 0.32, 0.22, 0.28, k1);
    }
    c.boite(-2.12, 0.65, 0, 0.05, 0.08, 1.7, FEU); // la barre de feux arrière, d'un côté à l'autre
    c.boite(-1.95, 0.88, 0, 0.3, 0.05, 1.3, k2); // le petit becquet « queue de canard »
    c.boite(0, 0.3, 0, 4.0, 0.12, 1.92, k2); // le bas de caisse sombre
    return { avant: 1.32, arriere: -1.32, z: 0.95, rayon: 0.37, epaisseur: 0.3 };
  }

  // 4. La Fusée (style Bugatti) : longue et large, deux couleurs, calandre en fer à cheval, la ligne en « C ».
  function fusee(c, k1, k2) {
    tranche(c, { av: 2.4, ar: -2.35, bas: 0.25, hAv: 0.6, hAr: 0.85, l: 0.95, lh: 0.9, lAr: 1.05, lhAr: 1.0 }, k1); // la caisse (couleur 1)
    tranche(c, { av: 2.35, ar: 1.0, bas: 0.6, hAv: 0.66, hAr: 0.85, l: 0.9, lh: 0.6 }, k1); // le long capot
    tranche(c, { av: 1.0, ar: -0.6, bas: 0.85, hAv: 1.22, xhAv: 0.4, xhAr: -0.4, l: 0.85, lh: 0.62 }, VITRE); // la bulle vitrée
    tranche(c, { av: 0.4, ar: -0.4, bas: 1.21, hAv: 1.25, l: 0.62 }, k2); // le toit (couleur 2)
    tranche(c, { av: -0.6, ar: -2.3, bas: 0.85, hAv: 1.15, hAr: 0.95, xhAv: -0.7, l: 0.95, lh: 0.65, lAr: 1.0, lhAr: 0.85 }, k2); // l'arrière (couleur 2)
    // La grande ligne en « C » sur les côtés, couleur argent.
    for (const z of [-1, 1]) {
      const zz = z * 0.97;
      c.boite(0.6, 0.55, zz, 0.1, 0.55, 0.06, ARGENT);
      c.boite(0.2, 0.84, zz, 0.9, 0.08, 0.06, ARGENT);
      c.boite(0.2, 0.3, zz, 0.9, 0.08, 0.06, ARGENT);
      c.boite(-0.4, 0.57, z * 1.0, 0.8, 0.45, 0.04, k2); // l'intérieur du « C » (couleur 2)
      c.boite(2.3, 0.6, z * 0.62, 0.12, 0.08, 0.4, PHARE); // les phares
    }
    // La calandre en fer à cheval, au milieu de l'avant.
    c.boite(2.42, 0.48, 0, 0.06, 0.32, 0.36, ARGENT);
    c.boite(2.44, 0.5, 0, 0.04, 0.22, 0.24, NOIR);
    c.boite(-2.36, 0.75, 0, 0.05, 0.08, 1.9, FEU); // la barre de feux arrière
    c.boite(-2.2, 1.0, 0, 0.35, 0.05, 1.6, k2); // l'aileron
    return { avant: 1.5, arriere: -1.5, z: 1.0, rayon: 0.4, epaisseur: 0.36 };
  }

  // 5. La Formule 1 : un corps très fin, le pilote assis dedans, roues à l'air, deux ailerons.
  function f1(c, k1, k2) {
    tranche(c, { av: 2.6, ar: 1.0, bas: 0.25, hAv: 0.38, hAr: 0.62, l: 0.14, lAr: 0.35, lh: 0.1, lhAr: 0.3 }, k1); // le nez
    tranche(c, { av: 1.0, ar: -0.4, bas: 0.2, hAv: 0.62, hAr: 0.7, l: 0.38, lh: 0.32 }, k1); // la coque du pilote
    tranche(c, { av: 0.4, ar: -1.5, bas: 0.2, hAv: 0.55, hAr: 0.5, l: 0.72, lh: 0.62 }, k1); // les pontons sur les côtés
    tranche(c, { av: -0.2, ar: -2.0, bas: 0.5, hAv: 1.05, hAr: 0.55, xhAv: -0.3, xhAr: -1.0, l: 0.3, lh: 0.12, lAr: 0.2, lhAr: 0.1 }, k2); // le capot moteur et la prise d'air
    c.boite(0.25, 0.8, 0, 0.32, 0.26, 0.28, JAUNE); // le casque du pilote
    c.boite(0.32, 0.8, 0, 0.18, 0.08, 0.3, NOIR); // la visière
    c.boite(0.55, 0.92, 0, 0.6, 0.04, 0.06, NOIR); // le « halo » qui protège la tête
    // L'aileron avant, très large, et ses deux petites plaques au bout.
    c.boite(2.45, 0.14, 0, 0.45, 0.05, 2.1, k2);
    c.boite(2.35, 0.22, 0, 0.3, 0.04, 1.9, k1);
    for (const z of [-1, 1]) c.boite(2.45, 0.22, z * 1.05, 0.5, 0.22, 0.04, k1);
    // L'aileron arrière, haut et large.
    c.boite(-2.15, 1.0, 0, 0.45, 0.06, 1.5, k2);
    c.boite(-2.15, 1.12, 0, 0.35, 0.05, 1.5, k1);
    for (const z of [-1, 1]) c.boite(-2.15, 0.85, z * 0.76, 0.5, 0.45, 0.04, k1);
    c.boite(-1.95, 0.75, 0, 0.1, 0.5, 0.1, NOIR); // le support de l'aileron
    c.boite(-2.05, 0.4, 0, 0.06, 0.08, 0.12, FEU); // le petit feu de pluie
    return { avant: 1.75, arriere: -1.6, z: 0.95, rayon: 0.45, epaisseur: 0.45 };
  }

  const FABRIQUES = { classique, taureau, fleche, fusee, f1 };

  // Fabrique les triangles d'un modèle. Renvoie { carrosserie (les triangles), roues (où et quelle taille) }.
  function fabriquer(modele, couleur1, couleur2) {
    const c = Circuit.Constructeur();
    const roues = FABRIQUES[modele](c, couleur1, couleur2);
    return { carrosserie: c.fin(), roues };
  }

  return { fabriquer };
})();
