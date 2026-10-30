// 🔫 LES ARMES DE 1944 EN 3D : l'armurier de l'Union et de la Ligue (demande 115, édition « Seconde Guerre mondiale »)
//
// ✍️ « Fusils semi-auto, pistolets-mitrailleurs… » Des armes INVENTÉES, inspirées de celles de 1944 :
//   - le FUSIL HARTLEY M2 (semi-automatique) : la crosse et le fût en noyer, le canon sous son garde-main, la LAME-CHARGEUR
//     de 8 cartouches qu'on voit dans la fenêtre (elle saute quand il est vide : « PING ! ») ;
//   - le FUSIL VARN 43 : plus court, son chargeur de 10 dessous ;
//   - le FUSIL-MITRAILLEUR BRENNAN : long et lourd, le chargeur droit dessous, le bipied à l'avant ;
//   - les PISTOLETS-MITRAILLEURS : le THORNTON (son tambour, sa poignée avant en bois), le VARN 40 (tout en métal, la crosse
//     repliée, le long chargeur droit), la mitraillette STELLAN (un tube, la crosse en fil de fer, le chargeur sur le côté) ;
//   - les LANCE-ROQUETTES : le long tube BAZKO à épaule, et le gros tube VARN 54 avec son bouclier ;
//   - les fusils à LUNETTE (le fusil à verrou de 1916, avec une lunette) et les pistolets COLTON 45 et VARN 38.
// ✍️ (demande 128, d'après les photos d'Iron Wolf Studio) le Varn 40, la Stellan et le Thornton refaits pièce par pièce ; le Thornton
// M1, les carabines Hartley M1 (et parachutiste), la mitraillette Corwin M3, 6 autres armes de poing, et la grenade « ANANAS ».
// Il ne fait que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, poignee, culasseStriee, rectRond } = A.outils;
  const N = 0x2b2d30, P = 0x3a3c3e, LAITON = 0xb08a40, BAKE = 0x2a1a12, OLIVE = 0x4a5232;

  // ------------------------------------------------------------------ les FUSILS SEMI-AUTOMATIQUES
  function semiAuto(e, p, o) {
    const by = 0.04, xr = 0.15, tip = xr + o.canon;
    e.boite(0.24, 0.03, 0.03, 0.02, by + 0.004, 0, "metal", N); // la carcasse
    e.boite(0.12, 0.012, 0.032, 0.0, by + 0.024, 0, "metal", P);
    e.cote([[0.04, by - 0.02], [-0.06, by - 0.03], [-0.12, by - 0.065], [-0.44, by - 0.11], [-0.46, by - 0.11], [-0.46, by + 0.025], [-0.42, by + 0.03], [-0.13, by + 0.012], [-0.09, by + 0.012]], 0.042, "bois", null, 0, 0.007, null, 2, { x: [-0.44, 1, -0.08, 0.7] });
    e.boite(0.008, 0.14, 0.044, -0.462, by - 0.042, 0, "metal", N);
    e.cote([[0.05, by - 0.03], [o.fut, by - 0.012], [o.fut, by + 0.008], [0.05, by + 0.006]], 0.038, "bois", null, 0, 0.005);
    e.galet(o.fut - xr, 0.018, 0.032, (xr + o.fut) / 2, by + 0.022, 0, "bois", null, 0.3);
    e.tube(xr, tip, 0.0105, 0.009, by + 0.01, 0, "metal", K.canon, 14);
    e.tube(xr, o.fut - 0.03, 0.006, 0.006, by - 0.01, 0, "metal", N, 8); // le tube des gaz sous le canon
    e.boite(0.014, 0.022, 0.008, tip - 0.02, by + 0.03, 0, "metal", N); // le guidon et ses oreilles
    e.boite(0.026, 0.02, 0.026, -0.04, by + 0.034, 0, "metal", N); // la hausse
    pontet(e, 0.0, 0.05, by - 0.02, N);
    e.anneau(0.012, 0.002, o.fut - 0.05, by - 0.03, 0, "metal", N);
    let ch = null;
    if (o.lame) e.dans("chargeur", () => { // la LAME-CHARGEUR : on voit les culots en laiton dans la fenêtre du dessus
      for (let k = 0; k < 4; k++) e.tube(-0.03 + k * 0.012, -0.02 + k * 0.012, 0.0055, 0.0055, by + 0.031, (k % 2 ? 0.005 : -0.005), "metal", LAITON, 8);
      e.boite(0.05, 0.004, 0.022, -0.012, by + 0.028, 0, "metal", P);
    });
    else ch = (e.dans("chargeur", () => e.boite(0.05, 0.1, 0.03, 0.03, by - 0.06, 0, "metal", N, 0, 0, 0.12)), { x: 0.03, y: by - 0.02 });
    e.dans("culasse", () => e.boite(0.03, 0.012, 0.012, 0.05, by + 0.014, 0.022, "metal", 0x8a8e92)); // le levier d'armement (il recule à chaque tir)
    return { by, tip, ch: ch || { x: -0.012, y: by + 0.03 }, rail: null, dessous: { x: (xr + o.fut) / 2, y: by - 0.03 }, garde: { centre: V3(Math.min(0.3, (xr + o.fut) / 2), by - 0.028), axe: V3(1, 0, 0), sorte: "dessous" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.03, 0.018), mireNative: { ligne: by + 0.046, arriere: -0.06, z: 0, nom: "hausse à œilleton" }, crosse: -0.46, grip: { centre: V3(-0.09, by - 0.05), axe: V3(0.5, 0.86, 0).normalize() } };
  }
  A.ajouterFabrique("hartley", (e, p) => semiAuto(e, p, { canon: 0.55, fut: 0.5, lame: true }));
  A.ajouterFabrique("varn43", (e, p) => semiAuto(e, p, { canon: 0.48, fut: 0.42, lame: false }));

  // ------------------------------------------------------------------ LE FUSIL-MITRAILLEUR BRENNAN
  A.ajouterFabrique("brennan", (e, p) => {
    const by = 0.04, tip = 0.78;
    e.boite(0.36, 0.06, 0.04, 0.04, by, 0, "metal", N);
    e.cote([[-0.14, by - 0.02], [-0.46, by - 0.06], [-0.46, by + 0.04], [-0.14, by + 0.03]], 0.04, "bois", null, 0, 0.007);
    e.boite(0.008, 0.11, 0.042, -0.462, by - 0.01, 0, "metal", N);
    poignee(e, "ak", BAKE, -0.04, by - 0.03, 0.032, "bois");
    pontet(e, -0.02, 0.04, by - 0.03, N);
    e.galet(0.2, 0.03, 0.044, 0.33, by - 0.01, 0, "bois", null, 0.3); // le garde-main
    e.tube(0.22, tip, 0.012, 0.011, by + 0.006, 0, "metal", K.canon, 14);
    e.tube(tip - 0.04, tip, 0.016, 0.016, by + 0.006, 0, "metal", N, 12); // le cache-flamme
    e.boite(0.012, 0.03, 0.004, tip - 0.06, by + 0.03, 0, "metal", N);
    for (const z of [-0.03, 0.03]) e.barre([tip - 0.1, by - 0.005, z], [tip - 0.35, by - 0.02, z * 1.4], 0.005, "metal", N); // le bipied replié
    const ch = { x: 0.08, y: by - 0.04 };
    e.dans("chargeur", () => e.boite(0.07, 0.12, 0.03, 0.08, by - 0.09, 0, "metal", P));
    return { by, tip, ch, rail: null, dessous: { x: 0.32, y: by - 0.04 }, garde: { centre: V3(0.32, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.05, by + 0.03, 0.022),
      mireNative: { ligne: by + 0.05, arriere: -0.1, z: 0, nom: "hausse et guidon" }, crosse: -0.46, grip: { centre: V3(-0.06, -0.04), axe: V3(0.3, 0.95, 0).normalize() } };
  });

  // ------------------------------------------------------------------ LES PISTOLETS-MITRAILLEURS ET LES CARABINES
  // ✍️ (demande 128) « Les pistolets-mitrailleurs de la … Seconde Guerre mondiale. » et « Voici d'autres armes pour … la Seconde
  // Guerre mondiale. » (des photos) : le Varn 40 et la Stellan refaits d'après elles, le Thornton (son canon à AILETTES, son
  // compensateur, sa poignée avant, son tambour de 50) et sa version M1 (canon lisse, fût en bois, chargeur droit), la
  // carabine Hartley M1 (et sa version PARACHUTISTE à crosse pliante en fil d'acier), la mitraillette Corwin M3 (le gros tube
  // embouti, la crosse en fil de fer).
  // des TROUS sur un tube (un manchon troué) : une rangée par angle (0 = sur le dessus), n trous de xa à xb
  function trous(e, xa, xb, y, R, angles, n, r) {
    if (e.leger) return;
    for (const a of angles) for (let k = 0; k < n; k++) { const x = xa + ((k + 0.5) / n) * (xb - xa); e.cyl(r, r, 0.004, x, y + Math.cos(a) * (R - 0.0012), Math.sin(a) * (R - 0.0012), "poly", K.fente, 8, a); }
  }
  // des RAINURES de part et d'autre d'une pièce (une poignée en bakélite, un puits de chargeur) : de (xa, ya) à (xb, yb)
  function rainures(e, xa, ya, xb, yb, n, l, z, a) {
    if (e.leger) return;
    for (let k = 0; k < n; k++) { const t = n > 1 ? k / (n - 1) : 0; for (const s of [-1, 1]) e.boite(l, 0.0022, 0.0014, xa + (xb - xa) * t, ya + (yb - ya) * t, s * z, "poly", K.fente, 0, 0, a || 0); }
  }
  // ✍️ THORNTON (le « 1928 ») et THORNTON M1 (o.m1 : la version simplifiée de la guerre)
  function thornton(e, p, o) {
    const by = 0.04, tip = o.m1 ? 0.37 : 0.4;
    e.cote([[-0.09, by - 0.02], [-0.09, by + 0.018], [-0.08, by + 0.028], [0.12, by + 0.028], [0.13, by + 0.02], [0.13, by - 0.02]], 0.034, "metal", N, 0, 0.004, null, 2); // la carcasse
    e.cote([[0.13, by - 0.02], [-0.09, by - 0.02], [-0.092, by - 0.036], [-0.06, by - 0.04], [0.09, by - 0.04], [0.11, by - 0.03]], 0.03, "metal", N, 0, 0.003, null, 2); // le bas (la carcasse de détente)
    e.boite(0.07, 0.012, 0.002, 0.03, by + 0.01, 0.0172, "poly", K.fente); // la fenêtre d'éjection (à droite)
    if (!e.leger) {
      e.cote([[0.004, by - 0.036], [0.016, by - 0.036], [0.02, by - 0.026], [0.006, by - 0.026]], 0.003, "metal", P, -0.0165, 0.0008); // le sélecteur
      e.cote([[-0.034, by - 0.036], [-0.022, by - 0.036], [-0.018, by - 0.026], [-0.032, by - 0.026]], 0.003, "metal", P, -0.0165, 0.0008); // la sûreté
      for (const x of [-0.07, 0.1]) e.disque(0.003, 0.036, x, by - 0.03, 0, "metal", 0x6a6e72, 10);
    }
    // la hausse : à échelle (le « 1928 ») ou fixe avec ses oreilles (le M1)
    if (o.m1) for (const s of [-1, 1]) e.boite(0.012, 0.012, 0.003, -0.062, by + 0.034, s * 0.006, "metal", N);
    else e.cote([[-0.075, by + 0.028], [-0.045, by + 0.028], [-0.05, by + 0.036], [-0.07, by + 0.038]], 0.016, "metal", N, 0, 0.0015);
    e.anneau(0.0032, 0.0014, -0.062, by + 0.034, 0, "metal", N);
    // la poignée en bois aux creux pour les doigts, le pontet
    e.cote([[-0.04, by - 0.04], [-0.045, by - 0.06], [-0.04, by - 0.07], [-0.047, by - 0.08], [-0.042, by - 0.09], [-0.05, by - 0.1], [-0.054, by - 0.125], [-0.088, by - 0.127], [-0.084, by - 0.09], [-0.075, by - 0.042]], 0.032, "bois", null, 0, 0.007, null, 2);
    pontet(e, -0.03, 0.02, by - 0.04, N);
    // la CROSSE en noyer, sa plaque de couche et l'anneau de la bretelle
    e.cote([[-0.092, by + 0.022], [-0.13, by + 0.02], [-0.4, by + 0.025], [-0.41, by + 0.026], [-0.41, by - 0.082], [-0.39, by - 0.09], [-0.15, by - 0.032], [-0.092, by - 0.032]], 0.038, "bois", null, 0, 0.008, null, 2, { x: [-0.41, 1, -0.1, 0.8] });
    e.boite(0.006, 0.115, 0.04, -0.414, by - 0.03, 0, "metal", N);
    e.anneau(0.009, 0.0018, -0.3, by - 0.07, 0, "metal", P);
    let ch;
    if (o.m1) {
      e.tube(0.13, tip, 0.0105, 0.0095, by + 0.004, 0, "metal", K.canon, 18); // le canon lisse
      e.cote([[0.13, by - 0.008], [0.29, by - 0.008], [0.302, by - 0.016], [0.296, by - 0.032], [0.13, by - 0.034]], 0.036, "bois", null, 0, 0.007, null, 2); // le fût horizontal
      e.cote([[tip - 0.014, by + 0.012], [tip - 0.004, by + 0.012], [tip - 0.005, by + 0.034], [tip - 0.012, by + 0.034]], 0.003, "metal", N, 0, 0.0005);
      e.dans("culasse", () => { e.boite(0.012, 0.008, 0.012, 0.08, by + 0.006, 0.024, "metal", P); e.boule(0.005, 0.08, by + 0.006, 0.031, "metal", P, 8); }); // le levier d'armement, à droite
      e.dans("chargeur", () => { e.boite(0.034, 0.2, 0.022, 0.056, by - 0.14, 0, "metal", P); e.boite(0.036, 0.006, 0.024, 0.056, by - 0.242, 0, "metal", N); });
      ch = { x: 0.056, y: by - 0.24, bande: { x: 0.056, y: by - 0.2, z: 0, p: 0.034, w: 0.022 } };
    } else {
      e.tube(0.13, tip - 0.054, 0.0105, 0.0095, by + 0.004, 0, "metal", K.canon, 18);
      if (!e.leger) for (let x = 0.135; x < 0.27; x += 0.0085) e.tube(x, x + 0.0035, 0.0165, 0.0165, by + 0.004, 0, "metal", 0x34363a, 18); // les AILETTES
      e.boite(0.054, 0.028, 0.026, tip - 0.027, by + 0.004, 0, "metal", N); // le compensateur…
      if (!e.leger) for (let k = 0; k < 4; k++) e.boite(0.006, 0.002, 0.016, tip - 0.044 + k * 0.011, by + 0.0185, 0, "poly", K.fente); // … et ses fentes sur le dessus
      e.tube(tip - 0.0004, tip + 0.0004, 0.0062, 0.0062, by + 0.004, 0, "poly", K.fente, 12);
      e.cote([[tip - 0.03, by + 0.017], [tip - 0.02, by + 0.017], [tip - 0.021, by + 0.034], [tip - 0.028, by + 0.034]], 0.003, "metal", N, 0, 0.0005);
      e.tube(0.2, 0.25, 0.0128, 0.0128, by + 0.004, 0, "metal", N, 16); // le collier de la poignée avant
      e.cote([[0.205, by - 0.01], [0.245, by - 0.01], [0.243, by - 0.03], [0.248, by - 0.04], [0.243, by - 0.05], [0.248, by - 0.06], [0.24, by - 0.085], [0.215, by - 0.088], [0.207, by - 0.06], [0.21, by - 0.03]], 0.03, "bois", null, 0, 0.007, null, 2);
      e.dans("culasse", () => { e.boite(0.012, 0.01, 0.008, 0.06, by + 0.033, 0, "metal", P); e.boule(0.0065, 0.06, by + 0.039, 0, "metal", P, 10); }); // le bouton d'armement, SUR le dessus
      if (!e.leger) e.boite(0.08, 0.002, 0.006, 0.05, by + 0.0285, 0, "poly", K.fente);
      e.dans("chargeur", () => { // le TAMBOUR de 50 : la boîte ronde, ses bords, le moyeu, la clé pour remonter le ressort
        e.disque(0.07, 0.04, 0.055, by - 0.098, 0, "metal", P, 32);
        for (const s of [-1, 1]) e.disque(0.072, 0.005, 0.055, by - 0.098, s * 0.019, "metal", N, 32);
        e.disque(0.022, 0.046, 0.055, by - 0.098, 0, "metal", N, 18);
        if (!e.leger) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; for (const s of [-1, 1]) e.boite(0.04, 0.004, 0.002, 0.055 + Math.cos(a) * 0.044, by - 0.098 + Math.sin(a) * 0.044, s * 0.0205, "metal", N, 0, 0, a); }
        e.cote([[0.05, by - 0.098], [0.06, by - 0.098], [0.062, by - 0.07], [0.048, by - 0.07]], 0.006, "metal", 0x8a8e92, 0.026, 0.001); // la clé
        e.boite(0.03, 0.014, 0.03, 0.055, by - 0.034, 0, "metal", N); // le cou qui entre dans l'arme
      });
      ch = { x: 0.055, y: by - 0.16, bandeTube: null };
    }
    return { by: by + 0.004, tip, ch, rail: null, dessous: { x: 0.225, y: by - 0.03 }, garde: o.m1 ? { centre: V3(0.22, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" } : { centre: V3(0.227, by - 0.055), axe: V3(0.1, 1, 0).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.03, by + 0.012, 0.018), mireNative: { ligne: by + 0.034, arriere: -0.066, z: 0, nom: "hausse et guidon" }, crosse: -0.41, grip: { centre: V3(-0.064, by - 0.085), axe: V3(0.3, 0.95, 0).normalize() } };
  }
  A.ajouterFabrique("thornton", (e, p) => thornton(e, p, {}));
  A.ajouterFabrique("thorntonM1", (e, p) => thornton(e, p, { m1: true }));

  // ✍️ VARN 40 : le tube rainuré, l'écrou du canon, l'ARRÊTOIR sous la bouche, le guidon dans son tunnel, le long chargeur droit
  // dans son puits rainuré (on le tient par là), le bas et la poignée en BAKÉLITE rainurée, la crosse repliable dépliée
  // (2 tiges et la boucle de couche) et son gros pivot.
  A.ajouterFabrique("varn40", (e, p) => {
    const by = 0.04, tip = 0.345, R = 0.0175;
    e.tube(-0.095, 0.13, R, R, by, 0, "metal", N, 22);
    if (!e.leger) for (const a of [0.75, 1.25, -0.75, -1.25]) e.boite(0.15, 0.0026, 0.003, 0.045, by + Math.cos(a) * R, Math.sin(a) * R, "poly", K.fente, a); // les rainures
    e.tour([[-0.11, 0.006], [-0.106, 0.015], [-0.099, R + 0.001], [-0.09, R + 0.001]], by, 0, "metal", N, 20); // la calotte arrière
    e.tube(0.13, 0.164, 0.0145, 0.0145, by, 0, "metal", N, 20); // l'écrou du canon
    if (!e.leger) for (const x of [0.136, 0.156]) e.tube(x, x + 0.004, 0.0152, 0.0152, by, 0, "metal", 0x1c1d1f, 20);
    e.tube(0.164, tip, 0.0092, 0.0082, by, 0, "metal", K.canon, 18);
    e.tube(tip - 0.0004, tip + 0.0004, 0.0048, 0.0048, by, 0, "poly", K.fente, 10);
    e.cote([[0.255, by - 0.005], [0.3, by - 0.005], [0.302, by - 0.012], [0.29, by - 0.027], [0.278, by - 0.027], [0.284, by - 0.014], [0.255, by - 0.011]], 0.012, "metal", N, 0, 0.0015); // l'arrêtoir
    e.boite(0.016, 0.012, 0.009, tip - 0.012, by + 0.012, 0, "metal", N); // le guidon dans son tunnel
    e.anneau(0.0085, 0.0022, tip - 0.012, by + 0.024, 0, "metal", N);
    e.boite(0.003, 0.012, 0.002, tip - 0.012, by + 0.02, 0, "metal", N);
    e.boite(0.03, 0.006, 0.014, -0.03, by + R + 0.002, 0, "metal", N); // la hausse
    for (const s of [-1, 1]) e.boite(0.003, 0.009, 0.005, -0.035, by + 0.0255, s * 0.0035, "metal", N);
    // le puits rainuré, le bas en bakélite, la poignée, le pontet
    e.cote([[0.044, by - 0.012], [0.09, by - 0.012], [0.09, by - 0.085], [0.044, by - 0.085]], 0.03, "metal", N, 0, 0.003, null, 2);
    rainures(e, 0.067, by - 0.035, 0.067, by - 0.075, 5, 0.03, 0.0152);
    e.disque(0.006, 0.004, 0.08, by - 0.02, -0.016, "metal", P, 12); // le bouton du chargeur
    e.cote([[0.044, by - 0.014], [-0.085, by - 0.014], [-0.092, by - 0.03], [-0.07, by - 0.042], [0.044, by - 0.036]], 0.028, "poly", BAKE, 0, 0.004, null, 2);
    rainures(e, -0.05, by - 0.022, 0.02, by - 0.022, 6, 0.008, 0.0142, 0.9);
    pontet(e, -0.03, 0.02, by - 0.036, N);
    e.cote([[-0.04, by - 0.04], [-0.05, by - 0.08], [-0.06, by - 0.13], [-0.09, by - 0.134], [-0.088, by - 0.09], [-0.075, by - 0.042]], 0.03, "poly", BAKE, 0, 0.006, null, 2);
    rainures(e, -0.061, by - 0.055, -0.073, by - 0.122, 11, 0.026, 0.0152, -0.2);
    // la crosse dépliée : le pivot, 2 tiges, la boucle de couche
    e.disque(0.012, 0.034, -0.084, by - 0.034, 0, "metal", N, 16);
    for (const s of [-1, 1]) e.barre([-0.086, by - 0.03, s * 0.016], [-0.33, by - 0.045, s * 0.014], 0.0042, "metal", N, 10);
    e.cote(rectRond(-0.346, by - 0.11, -0.326, by + 0.008, 0.009), 0.03, "metal", N, 0, 0.002, [rectRond(-0.341, by - 0.098, -0.331, by - 0.004, 0.004)], 2);
    // le levier d'armement, à gauche (il recule à chaque tir)
    if (!e.leger) e.boite(0.11, 0.004, 0.002, 0.05, by, -0.0176, "poly", K.fente);
    e.dans("culasse", () => { e.barre([0.1, by, -0.016], [0.1, by - 0.004, -0.03], 0.0035, "metal", P, 8); e.boule(0.0055, 0.1, by - 0.005, -0.033, "metal", P, 10); });
    const ch = { x: 0.067, y: by - 0.3 };
    e.dans("chargeur", () => {
      e.cote([[0.05, by - 0.085], [0.084, by - 0.085], [0.084, by - 0.3], [0.05, by - 0.3]], 0.024, "metal", P, 0, 0.002);
      if (!e.leger) for (const s of [-1, 1]) for (const x of [0.06, 0.074]) e.boite(0.003, 0.17, 0.0012, x, by - 0.2, s * 0.0124, "metal", 0x1f2124);
      e.boite(0.038, 0.006, 0.026, 0.067, by - 0.302, 0, "metal", N);
    });
    return { by, tip, ch, rail: null, dessous: null, garde: { centre: V3(0.067, by - 0.06), axe: V3(0.05, 1, 0).normalize(), sorte: "pistolet" }, lampe: null, laser: null, ejection: V3(0.03, by + 0.012, 0.018),
      mireNative: { ligne: by + 0.026, arriere: -0.037, z: 0, nom: "hausse et guidon" }, crosse: -0.346, grip: { centre: V3(-0.068, by - 0.085), axe: V3(0.3, 0.95, 0).normalize() } };
  });
  // ✍️ STELLAN : un simple tube, le MANCHON TROUÉ autour du canon, le puits du chargeur qui sort à GAUCHE (et le chargeur
  // couché dedans), la carcasse de détente en tôle, la crosse squelette (un tube, une jambe de force, la boucle de couche).
  A.ajouterFabrique("stellan", (e, p) => {
    const by = 0.04, R = 0.0185, tip = 0.33;
    e.tube(-0.09, 0.15, R, R, by, 0, "metal", N, 22);
    e.tour([[-0.1, 0.005], [-0.097, 0.016], [-0.09, R + 0.001]], by, 0, "metal", N, 20);
    e.tube(0.15, 0.265, 0.0165, 0.0165, by, 0, "metal", N, 22); // le manchon…
    trous(e, 0.155, 0.26, by, 0.0165, [0, 0.8, -0.8, 1.6, -1.6], 7, 0.0027); // … et ses trous
    e.tour([[0.265, 0.0165], [0.272, 0.012], [0.272, 0.0095]], by, 0, "metal", N, 20);
    e.tube(0.27, tip, 0.0092, 0.0092, by, 0, "metal", K.canon, 16);
    e.tube(tip - 0.0004, tip + 0.0004, 0.0048, 0.0048, by, 0, "poly", K.fente, 10);
    e.cote([[0.252, by + 0.015], [0.266, by + 0.015], [0.264, by + 0.026], [0.256, by + 0.026]], 0.003, "metal", N, 0, 0.0005); // le guidon
    e.boite(0.014, 0.01, 0.012, -0.07, by + 0.02, 0, "metal", N); // l'œilleton
    e.anneau(0.0034, 0.0013, -0.07, by + 0.026, 0, "metal", N);
    // le puits du chargeur, à GAUCHE
    e.boite(0.042, 0.036, 0.06, 0.13, by, -0.046, "metal", N);
    e.boite(0.032, 0.026, 0.002, 0.13, by, -0.0765, "poly", K.fente);
    // la carcasse de détente et le pontet
    e.cote([[0.07, by - 0.015], [-0.08, by - 0.015], [-0.08, by - 0.03], [-0.04, by - 0.056], [0.03, by - 0.056], [0.07, by - 0.03]], 0.024, "metal", N, 0, 0.002, null, 2);
    if (!e.leger) e.disque(0.004, 0.026, 0.0, by - 0.04, 0, "metal", P, 10);
    pontet(e, -0.02, 0.025, by - 0.056, N);
    // la crosse squelette
    e.barre([-0.09, by - 0.006, 0], [-0.33, by - 0.035, 0], 0.0075, "metal", N, 12);
    e.barre([-0.075, by - 0.03, 0], [-0.17, by - 0.024, 0], 0.006, "metal", N, 10);
    e.cote(rectRond(-0.345, by - 0.1, -0.328, by + 0.015, 0.008), 0.024, "metal", N, 0, 0.002, [rectRond(-0.341, by - 0.088, -0.332, by + 0.004, 0.004)], 2);
    // le levier d'armement, à droite
    if (!e.leger) e.boite(0.1, 0.004, 0.002, 0.03, by + 0.004, 0.0186, "poly", K.fente);
    e.dans("culasse", () => { e.barre([0.07, by + 0.004, 0.017], [0.07, by + 0.004, 0.032], 0.0035, "metal", P, 8); e.boule(0.006, 0.07, by + 0.004, 0.034, "metal", P, 10); });
    const ch = { x: 0.13, y: by };
    e.dans("chargeur", () => { e.boite(0.03, 0.026, 0.2, 0.13, by, -0.17, "metal", P); e.boite(0.032, 0.028, 0.006, 0.13, by, -0.272, "metal", N); }); // le chargeur couché, à gauche
    return { by, tip, ch, rail: null, dessous: null, garde: { centre: V3(0.13, by, -0.058), axe: V3(0, 0, -1), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.06, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.026, arriere: -0.074, z: 0, nom: "œilleton" }, crosse: -0.345, grip: { centre: V3(-0.11, by - 0.02), axe: V3(0.5, 0.86, 0).normalize() } };
  });
  // ✍️ CORWIN M3 (la « burette » : un gros tube embouti) : le tube et ses soudures, le couvercle de la fenêtre d'éjection et la
  // manivelle d'armement à droite, le long chargeur droit, la poignée en tôle, la crosse en fil de fer.
  A.ajouterFabrique("corwinM3", (e, p) => {
    const by = 0.04, R = 0.027, tip = 0.29, G = 0x3c3f3b;
    e.tube(-0.08, 0.15, R, R, by, 0, "metal", G, 26);
    e.tour([[0.15, R], [0.157, R * 0.78], [0.16, 0.012]], by, 0, "metal", G, 24);
    e.tour([[-0.08, R], [-0.086, R * 0.82], [-0.088, 0.01]], by, 0, "metal", G, 24);
    if (!e.leger) for (const s of [-1, 1]) e.boite(0.22, 0.0016, 0.0016, 0.035, by, s * (R + 0.0004), "metal", 0x2a2c2a); // la soudure des 2 demi-coques
    e.tube(0.155, 0.178, 0.0125, 0.0125, by, 0, "metal", N, 18); // le collier du canon
    if (!e.leger) for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; e.boite(0.02, 0.0016, 0.0016, 0.1665, by + Math.cos(a) * 0.0127, Math.sin(a) * 0.0127, "poly", 0x18191b, a); }
    e.tube(0.178, tip, 0.0088, 0.0088, by, 0, "metal", K.canon, 16);
    e.tube(tip - 0.0004, tip + 0.0004, 0.0048, 0.0048, by, 0, "poly", K.fente, 10);
    e.boite(0.006, 0.012, 0.003, 0.152, by + R - 0.001, 0, "metal", G); // le guidon
    e.boite(0.014, 0.008, 0.012, -0.065, by + R + 0.002, 0, "metal", G); // l'œilleton
    e.anneau(0.0034, 0.0013, -0.065, by + R + 0.008, 0, "metal", G);
    e.boite(0.06, 0.022, 0.003, 0.03, by + 0.004, R + 0.001, "metal", 0x333532); // le couvercle d'éjection (à droite)
    e.barre([-0.035, by - 0.01, R], [-0.05, by - 0.03, R + 0.009], 0.003, "metal", N); // la manivelle d'armement
    e.boule(0.005, -0.05, by - 0.032, R + 0.01, "metal", N, 8);
    // le puits et la carcasse de détente en tôle, la poignée, le pontet
    e.boite(0.042, 0.03, 0.034, 0.11, by - R - 0.008, 0, "metal", G);
    e.cote([[0.02, by - R + 0.004], [-0.07, by - R + 0.004], [-0.07, by - 0.045], [0.02, by - 0.045]], 0.026, "metal", G, 0, 0.002);
    const pg = [[-0.025, by - 0.045], [-0.03, by - 0.08], [-0.04, by - 0.125], [-0.07, by - 0.125], [-0.066, by - 0.08], [-0.06, by - 0.045]];
    e.cote(pg, 0.03, "metal", G, 0, 0.004, null, 2);
    if (!e.leger) for (const s of [-1, 1]) e.cote([[-0.033, by - 0.055], [-0.04, by - 0.115], [-0.062, by - 0.115], [-0.056, by - 0.055]], 0.0012, "metal", 0x2a2c2a, s * 0.0152, 0.0003);
    pontet(e, -0.03, 0.015, by - 0.045, G);
    // la crosse en fil de fer
    for (const s of [-1, 1]) e.barre([-0.075, by - 0.02, s * 0.012], [-0.34, by - 0.03, s * 0.012], 0.0035, "metal", N, 8);
    e.barre([-0.34, by - 0.03, -0.012], [-0.34, by - 0.03, 0.012], 0.0035, "metal", N, 8);
    e.barre([-0.34, by - 0.03, 0], [-0.345, by - 0.1, 0], 0.004, "metal", N, 8);
    e.barre([-0.345, by - 0.1, 0], [-0.33, by - 0.11, 0], 0.004, "metal", N, 8);
    const ch = { x: 0.11, y: by - 0.25 };
    e.dans("chargeur", () => { e.boite(0.032, 0.2, 0.022, 0.11, by - 0.15, 0, "metal", P); e.boite(0.034, 0.006, 0.024, 0.11, by - 0.252, 0, "metal", N); });
    return { by, tip, ch, rail: null, dessous: null, garde: { centre: V3(0.11, by - 0.08), axe: V3(0.02, 1, 0).normalize(), sorte: "pistolet" }, lampe: null, laser: null, ejection: V3(0.03, by + 0.01, 0.03),
      mireNative: { ligne: by + R + 0.008, arriere: -0.069, z: 0, nom: "œilleton" }, crosse: -0.345, grip: { centre: V3(-0.048, by - 0.085), axe: V3(0.25, 0.97, 0).normalize() } };
  });
  // ✍️ CARABINE HARTLEY M1 : la crosse d'une seule pièce en bois clair, son garde-main, le canon fin et sa bague, le petit
  // chargeur de 15 ; o.para : la version PARACHUTISTE (une poignée pistolet et la crosse PLIANTE en tubes d'acier, sa
  // joue en cuir).
  function carabine(e, p, o) {
    const by = 0.04, tip = 0.52, BC = 0xc08a58;
    if (o.para) {
      e.cote([[0.3, by - 0.012], [0.3, by - 0.026], [0.1, by - 0.03], [0.04, by - 0.034], [-0.03, by - 0.036], [-0.085, by - 0.03], [-0.09, by + 0.004], [0.3, by + 0.004]], 0.036, "bois", BC, 0, 0.007, null, 2);
      e.cote([[-0.045, by - 0.03], [-0.055, by - 0.07], [-0.065, by - 0.12], [-0.095, by - 0.122], [-0.09, by - 0.075], [-0.082, by - 0.03]], 0.032, "bois", BC, 0, 0.008, null, 2); // la poignée pistolet
      e.disque(0.008, 0.04, -0.09, by - 0.012, 0, "metal", N, 14); // le pivot de la crosse
      e.barre([-0.09, by - 0.004, 0], [-0.38, by - 0.02, 0], 0.006, "metal", N, 12);
      e.barre([-0.09, by - 0.03, 0], [-0.38, by - 0.075, 0], 0.006, "metal", N, 12);
      e.cote(rectRond(-0.392, by - 0.09, -0.376, by - 0.006, 0.007), 0.03, "metal", N, 0, 0.002);
      e.galet(0.1, 0.016, 0.03, -0.24, by - 0.006, 0, "poly", 0x6b4a2a, 0.35); // la joue en cuir
    } else {
      e.cote([[0.3, by - 0.012], [0.3, by - 0.026], [0.1, by - 0.03], [0.04, by - 0.034], [-0.03, by - 0.036], [-0.08, by - 0.03], [-0.13, by - 0.05], [-0.42, by - 0.1], [-0.43, by - 0.1], [-0.43, by + 0.02], [-0.39, by + 0.025], [-0.13, by + 0.006], [-0.09, by + 0.004], [0.3, by + 0.004]], 0.036, "bois", BC, 0, 0.007, null, 2, { x: [-0.43, 1, -0.08, 0.75] });
      e.boite(0.008, 0.12, 0.038, -0.433, by - 0.04, 0, "metal", N); // la plaque de couche
      if (!e.leger) e.fenteRonde(-0.27, -0.22, by - 0.04, 0.012, 0, 0.0372, 0x3a2414); // la fente de la bretelle (et la burette d'huile)
    }
    e.galet(0.2, 0.014, 0.03, 0.19, by + 0.014, 0, "bois", BC, 0.3); // le garde-main
    e.boite(0.18, 0.024, 0.026, 0.0, by + 0.008, 0, "metal", N); // la carcasse
    e.tube(0.09, tip, 0.008, 0.0072, by + 0.008, 0, "metal", K.canon, 16);
    e.tube(tip - 0.0004, tip + 0.0004, 0.0042, 0.0042, by + 0.008, 0, "poly", K.fente, 10);
    e.tube(0.272, 0.292, 0.0185, 0.0185, by - 0.004, 0, "metal", N, 16); // la bague
    e.anneau(0.008, 0.0016, 0.282, by - 0.03, 0, "metal", P);
    e.boite(0.012, 0.012, 0.014, tip - 0.014, by + 0.016, 0, "metal", N); // le guidon et ses oreilles
    for (const s of [-1, 1]) e.boite(0.01, 0.012, 0.0025, tip - 0.014, by + 0.025, s * 0.0055, "metal", N);
    e.boite(0.0025, 0.011, 0.002, tip - 0.014, by + 0.0215, 0, "metal", N);
    e.boite(0.018, 0.008, 0.016, -0.062, by + 0.024, 0, "metal", N); // la hausse en L et son œilleton
    e.anneau(0.0032, 0.0014, -0.062, by + 0.027, 0, "metal", N);
    pontet(e, -0.02, 0.025, by - 0.034, N);
    e.dans("culasse", () => { e.boite(0.15, 0.008, 0.006, 0.08, by + 0.004, 0.0155, "metal", P); e.boite(0.012, 0.01, 0.012, 0.02, by + 0.004, 0.021, "metal", P); }); // la glissière et sa poignée (à droite)
    const ch = { x: 0.03, y: by - 0.1 };
    e.dans("chargeur", () => { e.boite(0.03, 0.07, 0.02, 0.03, by - 0.065, 0, "metal", P); e.boite(0.032, 0.005, 0.022, 0.03, by - 0.1, 0, "metal", N); });
    return { by: by + 0.008, tip, ch, rail: null, dessous: { x: 0.2, y: by - 0.03 }, garde: { centre: V3(0.2, by - 0.025), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.02, by + 0.02, 0.018),
      mireNative: { ligne: by + 0.027, arriere: -0.066, z: 0, nom: "hausse en L et guidon" }, crosse: o.para ? -0.39 : -0.43,
      grip: o.para ? { centre: V3(-0.072, by - 0.075), axe: V3(0.3, 0.95, 0).normalize() } : { centre: V3(-0.085, by - 0.04), axe: V3(0.5, 0.86, 0).normalize() } };
  }
  A.ajouterFabrique("carabineM1", (e, p) => carabine(e, p, {}));
  A.ajouterFabrique("carabineM1para", (e, p) => carabine(e, p, { para: true }));
  // ------------------------------------------------------------------ LES LANCE-ROQUETTES
  function tube(e, p, o) {
    const by = 0.06, V = o.couleur;
    e.tube(-0.62, 0.72, o.r, o.r, by, 0, "metal", V, 20);
    e.tube(0.7, 0.74, o.r + 0.008, o.r + 0.004, by, 0, "metal", V, 20); // le bord de la bouche
    e.tube(-0.64, -0.6, o.r + 0.01, o.r + 0.01, by, 0, "metal", 0x2a2b2c, 20);
    e.cote([[-0.2, by - 0.02], [-0.3, by - 0.11], [-0.18, by - 0.11], [-0.08, by - 0.02]], 0.04, "bois", null, 0, 0.006); // l'appui d'épaule
    poignee(e, "droite", BAKE, 0.1, by - 0.03, 0.03, "bois");
    poignee(e, "droite", BAKE, 0.35, by - 0.03, 0.03, "bois");
    pontet(e, 0.09, 0.13, by - 0.03, N);
    e.boite(0.02, 0.05, 0.01, 0.45, by + o.r + 0.02, -0.03, "metal", N); // le viseur à cadre, à gauche
    e.boite(0.02, 0.03, 0.01, 0.05, by + o.r + 0.012, -0.03, "metal", N);
    if (o.bouclier) {
      e.boite(0.01, 0.32, 0.34, 0.3, by + 0.02, -0.02, "metal", 0x5a5e4c);
      e.boite(0.012, 0.06, 0.07, 0.3, by + 0.09, -0.03, "vitre"); // la fenêtre du bouclier
    }
    e.dans("chargeur", () => { // la roquette
      e.tube(0.6, 0.72, 0.02, 0.025, by, 0, "metal", 0x4a4e3c, 14);
      e.tour([[0.72, o.r - 0.004], [0.78, o.r], [0.84, o.r * 0.6], [0.88, 0.01]], by, 0, "metal", 0x56603a, 18);
    });
    return { by, tip: 0.72, ch: { x: 0.78, y: by }, rail: null, dessous: { x: 0.35, y: by - 0.05 }, garde: { centre: V3(0.33, by - 0.08), axe: V3(0.2, 1, 0).normalize(), sorte: "vertical" },
      lampe: null, laser: null, ejection: null, mireNative: { ligne: by + o.r + 0.04, arriere: 0.05, z: -0.03, nom: "viseur à cadre" }, arriere: -0.62, crosse: -0.3, grip: { centre: V3(0.08, by - 0.09), axe: V3(0.2, 1, 0).normalize() } };
  }
  A.ajouterFabrique("bazko", (e, p) => tube(e, p, { r: 0.032, couleur: OLIVE }));
  A.ajouterFabrique("varn54", (e, p) => tube(e, p, { r: 0.045, couleur: 0x5a5e4c, bouclier: true }));

  // ------------------------------------------------------------------ LES FUSILS À VERROU À LUNETTE (ceux de 1916, avec une lunette)
  A.ajouterFabrique("rennick03", (e, p) => Tanks.Armes1916.fusil(e, p, { canon: 0.6, fut: 0.58, lunette: 4 }));
  A.ajouterFabrique("varn98lunette", (e, p) => Tanks.Armes1916.fusil(e, p, { canon: 0.58, fut: 0.56, kress: true, lunette: 4 }));

  // ------------------------------------------------------------------ LES PISTOLETS
  function pistolet(e, p, o) {
    const by = 0.042, L = o.long;
    // la carcasse ; (armes réalistes, 2e passe) dans la belle version, découpée de côté avec l'avant arrondi sous le canon
    if (e.beau) e.cote([[-0.04, by - 0.017], [-0.04, by + 0.005], [0.06, by + 0.005], [0.064, by - 0.004], [0.056, by - 0.017]], 0.024, "metal", N, 0, 0.003, null, 2);
    else e.boite(0.1, 0.022, 0.024, 0.01, by - 0.006, 0, "metal", N);
    e.cote([[0.0, by - 0.016], [-0.012, by - 0.07], [-0.022, by - 0.12], [-0.06, by - 0.118], [-0.052, by - 0.07], [-0.04, by - 0.016]], 0.03, o.bois ? "bois" : "poly", o.bois ? 0x5a3a20 : BAKE, 0, 0.006, null, 2);
    pontet(e, -0.004, 0.04, by - 0.014, N);
    e.dans("culasse", () => { if (e.beau) culasseStriee(e, -0.05, L - 0.05, by + 0.001, 0.026, 0.013, o.couleur, 8, -0.043, 0.0042); else e.boite(L, 0.026, 0.026, L / 2 - 0.05, by + 0.014, 0, "metal", o.couleur); e.boite(0.006, 0.008, 0.004, L - 0.06, by + 0.031, 0, "metal", N); });
    e.tube(L - 0.05, L - 0.04, 0.007, 0.007, by + 0.012, 0, "metal", K.canon, 10);
    return { by, tip: L - 0.04, ch: { x: -0.03, y: by - 0.02 }, rail: null, dessous: null, garde: { centre: V3(-0.03, -0.08, -0.036), axe: V3(0.6, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.02, 0.0), mireNative: { ligne: by + 0.034, arriere: -0.04, z: 0, nom: "cran et guidon" }, glissiere: { x: 0.0, y: by + 0.026 }, bout: { x: L - 0.04, y: by + 0.012, r: 0.007 },
      grip: { centre: V3(-0.03, -0.05), axe: V3(0.3, 1, 0).normalize() }, crosse: -0.06 };
  }
  // ✍️ (demande 128) le Colton 45 est maintenant le vrai 1911 de l'armurier moderne (acier bleui, plaquettes quadrillées)
  A.ajouterFabrique("colton45", "pistolet");
  // ✍️ (demande 128) les autres armes de poing de 1944 (avec les familles de l'armurier de 1916 : revolver, automatique…)
  const V16 = Tanks.Armes1916;
  A.ajouterFabrique("hartwellV", (e, p) => V16.revolver(e, p, { canon: 0.1, ouverture: "lateral", crosse: "ronde", plaquettes: "bois", coul: 0x3a3e40 })); // le fini « de guerre » : gris mat
  A.ajouterFabrique("ostrel33", (e, p) => V16.automatique(e, p, { long: 0.19, haut: 0.028, chien: true, penche: 0.2, plaquettes: "ebonite", stries: 9 }));
  A.ajouterFabrique("marne35", (e, p) => V16.automatique(e, p, { long: 0.2, haut: 0.029, chien: true, penche: 0.3, plaquettes: "quadrille", stries: 8 }));
  A.ajouterFabrique("varnPP", (e, p) => V16.automatique(e, p, { long: 0.155, haut: 0.026, chien: true, nez: "rond", penche: 0.18, plaquettes: "ebonite", grip: 0.08, stries: 6 }));
  A.ajouterFabrique("varn08", "pistolet08");
  A.ajouterFabrique("varnP38", (e, p) => V16.automatique(e, p, { long: 0.19, haut: 0.026, chien: true, penche: 0.26, plaquettes: "ebonite", stries: 0, coul: 0x262729 })); // (demande 128 : refait avec la famille « automatique »)

  // ------------------------------------------------------------------ ✍️ (demande 128) LA GRENADE « ANANAS » de 1944
  // Sur la photo d'Iron Wolf Studio : la grenade à corps QUADRILLÉ (des rangées de petits pavés, pour qu'elle éclate en morceaux), son
  // bouchon allumeur, sa longue cuillère et l'anneau de la goupille. En 1944, c'est elle que ton soldat tient dans la main
  // (l'accessoiriste, affichage/objets3d.js, demande sa maquette : on lui prête celle-ci à la place de la ronde).
  let MA = null;
  function ananas() {
    MA = MA || { olive: new THREE.MeshStandardMaterial({ color: 0x55603a, roughness: 0.78, metalness: 0.1 }), fonce: new THREE.MeshStandardMaterial({ color: 0x3b4428, roughness: 0.8, metalness: 0.1 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x7f837c, roughness: 0.4, metalness: 0.8 }), acier: new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.9 }) };
    const g = new THREE.Group(), mesh = (geo, mat, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; g.add(o); return o; };
    const corps = mesh(new THREE.SphereGeometry(0.026, 16, 12), MA.olive);
    corps.scale.set(1, 1.22, 1);
    const pave = new THREE.BoxGeometry(0.009, 0.0085, 0.006);
    for (let r = 0; r < 5; r++) for (let k = 0; k < 8; k++) { // les pavés, rangée par rangée, tournés vers l'extérieur
      const v = -0.75 + (r / 4) * 1.5, a = (k / 8) * Math.PI * 2 + (r % 2) * 0.2, R = 0.0262 * Math.cos(v);
      const o = mesh(pave, MA.fonce, Math.cos(a) * R, Math.sin(v) * 0.0262 * 1.22, Math.sin(a) * R);
      o.lookAt(o.position.x * 3, o.position.y * 3, o.position.z * 3);
    }
    mesh(new THREE.CylinderGeometry(0.0095, 0.011, 0.018, 12), MA.metal, 0, 0.036, 0); // le bouchon allumeur
    mesh(new THREE.BoxGeometry(0.009, 0.064, 0.011), MA.metal, -0.028, 0.012, 0, 0, 0, 0.26); // la cuillère
    const anneau = mesh(new THREE.TorusGeometry(0.011, 0.0018, 6, 16), MA.acier, 0.012, 0.043, 0.016, 0, 0.6, 0);
    return { g, prise: { centre: V3(-0.014, -0.004, 0), axe: V3(0, 1, 0), sorte: "poignee" }, anneau };
  }
  window.addEventListener("DOMContentLoaded", () => {
    const O = Tanks.Objets3D;
    if (!O || !O.FAB || !O.FAB.grenade) return;
    const ronde = O.FAB.grenade;
    O.FAB.grenade = O.FAB.grenades = () => (Tanks.CONFIG.edition && Tanks.CONFIG.edition.id === "1944" ? ananas() : ronde());
  });
  Tanks.Armes1944 = { ananas };
})();
