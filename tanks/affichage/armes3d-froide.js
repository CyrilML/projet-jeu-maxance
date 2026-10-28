// 🔫 LES ARMES DE LA GUERRE FROIDE EN 3D : l'armurier d'Ostrel et de Khavar (demande 115, édition « Guerre froide »)
//
// ✍️ « Fusils d'assaut, mitrailleuse, lance-grenades… » Des armes INVENTÉES, inspirées de celles des années 70 :
//   - le CARLTON M-17 (Ostrel) : noir, en plastique et en alu ; la grande POIGNÉE DE TRANSPORT sur le dessus (avec la
//     hausse dedans), le garde-main rond à côtes, le guidon en triangle, le cache-flamme à 3 dents, le chargeur droit de
//     20, la crosse fixe ;
//   - le DROVNIK DK-47 (Khavar) : la crosse et le garde-main en BOIS, le long levier d'armement à droite, le tube des gaz
//     au-dessus du canon, le chargeur COURBE en « banane » de 30 ;
//   - la mitrailleuse M-61 « GARROW » : longue et lourde, la poignée de transport sur le canon, le BIPIED déplié, la
//     caisse de la BANDE de cartouches accrochée à gauche ;
//   - le lance-grenades BECKER 40 : un gros canon court et large (40 mm), la crosse en bois, la hausse à échelle (relevée).
//   - le fusil de précision DV-63 (Khavar) : la crosse évidée, le long canon, la lunette ×4 décalée à gauche.
// ✍️ (demande 128, un râtelier de musée) le Carlton refait comme le vrai fusil noir des années 70, le fusil de combat M-14 en
// bois et sa version M-21 à lunette, la carabine SK-45 à baïonnette repliée, et le fusil à verrou M-40 « de chasse ».
// Le lance-roquettes (le RK-7) est celui de l'édition Moderne ; le fusil à
// verrou à lunette et les pistolets, ceux de 1944. Il ne fait que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, poignee, lunette, rectRond } = A.outils;
  const N = 0x1e1f21, P = 0x2c2d30, BOIS = 0x6a3e22, OLIVE = 0x4a5232;

  // ------------------------------------------------------------------ LE FUSIL D'ASSAUT CARLTON M-17
  // ✍️ (demande 128, « Et cela pour les éditions. » : un râtelier de musée) refait d'après le vrai fusil noir des années 70 :
  // la carcasse inférieure et la supérieure (l'assistance de fermeture en goutte d'eau, la fenêtre d'éjection), la grande
  // POIGNÉE DE TRANSPORT et sa hausse à œilleton entre 2 oreilles, la crosse fixe, le garde-main rond à CÔTES, le haut
  // guidon en triangle sur le bloc des gaz, le cache-flamme « cage à oiseaux », le chargeur droit de 20 en alu.
  A.ajouterFabrique("carlton", (e, p) => {
    const by = 0.045, A1 = 0x26282b, ligne = 0.118, { chargeur, bout, guidonA2 } = A.outils;
    e.cote([[-0.072, 0.0], [-0.072, 0.03], [0.112, 0.03], [0.112, 0.012], [0.104, 0.0], [0.1, -0.038], [0.034, -0.038], [0.03, -0.006], [0.014, 0.0]], 0.032, "metal", A1, 0, 0.003);
    e.cote([[-0.078, 0.03], [-0.078, 0.064], [0.116, 0.064], [0.116, 0.03]], 0.03, "metal", A1, 0, 0.003);
    e.boite(0.045, 0.014, 0.002, 0.025, 0.046, 0.0158, "poly", K.fente);
    e.barre([-0.036, 0.051, 0.012], [-0.016, 0.051, 0.021], 0.006, "metal", A1); // l'assistance de fermeture (en goutte d'eau)
    e.boite(0.014, 0.008, 0.006, -0.025, 0.012, -0.018, "metal", N);
    if (e.beau) {
      e.boite(0.07, 0.007, 0.036, 0.067, -0.0355, 0, "metal", A1);
      for (const [x, y] of [[-0.062, 0.022], [0.098, 0.02], [-0.062, 0.042]]) e.disque(0.0032, 0.0345, x, y, 0, "metal", 0x4a4c50, 14);
      e.disque(0.0048, 0.004, 0.034, 0.012, 0.0168, "metal", 0x2c2e31, 16);
    }
    // la POIGNÉE DE TRANSPORT et sa hausse
    e.cote([[-0.074, 0.064], [-0.07, 0.106], [-0.04, 0.11], [0.082, 0.11], [0.094, 0.1], [0.104, 0.064]], 0.018, "metal", A1, 0, 0.003, [[[-0.036, 0.072], [0.074, 0.072], [0.074, 0.1], [-0.036, 0.1]]], 2);
    for (const s of [-1, 1]) e.boite(0.016, 0.014, 0.003, -0.06, ligne - 0.003, s * 0.0078, "metal", A1);
    e.boite(0.004, 0.012, 0.008, -0.06, ligne - 0.007, 0, "metal", A1);
    e.anneau(0.0034, 0.0014, -0.06, ligne, 0, "metal", A1);
    if (!e.leger) e.disque(0.006, 0.004, -0.055, 0.1, 0.011, "metal", A1, 14); // la molette de la dérive
    e.boite(0.014, 0.007, 0.03, -0.086, 0.059, 0, "metal", A1); // le levier d'armement (sous la poignée)
    // la crosse fixe, la poignée, le pontet
    e.cote([[-0.075, 0.062], [-0.075, 0.004], [-0.33, -0.048], [-0.345, -0.048], [-0.345, 0.07], [-0.33, 0.072], [-0.075, 0.066]], 0.038, "poly", N, 0, 0.006, null, 2, { x: [-0.345, 1, -0.08, 0.85] });
    e.boite(0.012, 0.124, 0.04, -0.35, 0.011, 0, "metal", 0x3a3c3e);
    poignee(e, "ar", N);
    pontet(e, 0.008, 0.075, 0.0, A1);
    // le garde-main rond à côtes, les bagues, le guidon, le canon, la cage à oiseaux
    e.tube(0.114, 0.126, 0.03, 0.03, by, 0, "metal", A1, 24); // la bague
    e.tube(0.126, 0.33, 0.028, 0.025, by, 0, "poly", N, 12, Math.PI / 12);
    if (!e.leger) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; e.boite(0.19, 0.003, 0.004, 0.228, by + Math.cos(a) * 0.0272, Math.sin(a) * 0.0272, "poly", 0x101112, a); } // les côtes
    e.tube(0.33, 0.338, 0.0255, 0.0255, by, 0, "metal", A1, 20);
    e.tube(0.338, 0.5, 0.0092, 0.0086, by, 0, "metal", K.canon, 16);
    guidonA2(e, 0.37, by, ligne, A1);
    const tip = bout(e, "aucune", 0.5, by, 0.0092, "a2");
    e.anneau(0.008, 0.0016, -0.31, -0.035, 0, "metal", 0x6a6e72);
    e.dans("culasse", () => e.boite(0.04, 0.012, 0.004, 0.03, 0.045, 0.017, "metal", 0x3a3c3e)); // le volet d'éjection
    const ch = chargeur(e, { l: 0.1, p: 0.058, w: 0.022, k: 0, a: 0.05, coul: 0x3a3b3d, mat: "metal", nervures: "stanag" }, "standard", 0.067, -0.03);
    return { by, tip, ch, rail: null, dessous: { x: 0.24, y: by - 0.03 }, garde: { centre: V3(0.24, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, 0.045, 0.017),
      mireNative: { ligne, arriere: -0.064, z: 0, nom: "hausse dans la poignée" }, crosse: -0.35, grip: { centre: V3(-0.03, -0.05), axe: V3(0.4, 0.92, 0).normalize() } };
  });

  // ------------------------------------------------------------------ ✍️ (demande 128) LE FUSIL DE COMBAT M-14 (et le M-21 à lunette)
  // La longue crosse en NOYER, la carcasse en acier et sa tige d'armement à droite (elle recule), la hausse à œilleton et ses 2
  // molettes, le garde-main du dessus, le tube des gaz sous le canon et sa bague, le cache-flamme à fentes, le chargeur droit
  // de 20 ; o.lunette : le M-21 du tireur d'élite, sa lunette sur un haut montage.
  function m14(e, p, o) {
    const by = 0.045, tip = 0.64, BC = o.lunette ? 0x6a4022 : null;
    e.cote([[0.4, by - 0.008], [0.4, by - 0.022], [0.12, by - 0.03], [0.07, by - 0.036], [-0.04, by - 0.04], [-0.08, by - 0.036], [-0.13, by - 0.056], [-0.44, by - 0.11], [-0.455, by - 0.11], [-0.455, by + 0.022], [-0.42, by + 0.027], [-0.14, by + 0.004], [-0.09, by + 0.002], [0.4, by + 0.002]], 0.04, "bois", BC, 0, 0.008, null, 2, { x: [-0.455, 1, -0.08, 0.75] });
    e.boite(0.008, 0.13, 0.042, -0.459, by - 0.044, 0, "metal", N);
    e.galet(0.2, 0.012, 0.03, 0.23, by + 0.016, 0, "poly", 0x3a3020, 0.3); // le garde-main du dessus
    e.cote([[-0.08, by - 0.006], [-0.08, by + 0.016], [-0.07, by + 0.022], [0.115, by + 0.022], [0.12, by + 0.01], [0.12, by - 0.006]], 0.028, "metal", P, 0, 0.003, null, 2); // la carcasse
    e.tube(0.12, tip - 0.04, 0.0098, 0.009, by + 0.008, 0, "metal", K.canon, 16);
    e.tube(0.38, 0.47, 0.0085, 0.0085, by - 0.01, 0, "metal", N, 12); // le tube des gaz
    e.tube(0.37, 0.4, 0.019, 0.019, by - 0.002, 0, "metal", N, 16); // la bague avant
    e.tour([[tip - 0.04, 0.0105], [tip - 0.034, 0.0125], [tip, 0.0125], [tip, 0.008]], by + 0.008, 0, "metal", N, 16); // le cache-flamme…
    if (!e.leger) for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; e.boite(0.026, 0.002, 0.003, tip - 0.016, by + 0.008 + Math.cos(a) * 0.0125, Math.sin(a) * 0.0125, "poly", K.fente, a); }
    e.tube(tip - 0.0004, tip + 0.0004, 0.0052, 0.0052, by + 0.008, 0, "poly", K.fente, 10);
    e.boite(0.01, 0.014, 0.012, tip - 0.03, by + 0.022, 0, "metal", N); // le guidon et ses oreilles
    for (const s of [-1, 1]) e.boite(0.01, 0.014, 0.0025, tip - 0.03, by + 0.033, s * 0.0055, "metal", N);
    e.boite(0.0025, 0.012, 0.0022, tip - 0.03, by + 0.03, 0, "metal", N);
    e.boite(0.024, 0.014, 0.022, -0.062, by + 0.029, 0, "metal", N); // la hausse, ses molettes et son œilleton
    for (const s of [-1, 1]) e.disque(0.007, 0.004, -0.062, by + 0.028, s * 0.013, "metal", P, 14);
    e.anneau(0.0034, 0.0014, -0.062, by + 0.036, 0, "metal", N);
    e.cote(rectRond(-0.03, by - 0.06, 0.03, by - 0.036, 0.01), 0.012, "metal", N, 0, 0.0015, [rectRond(-0.024, by - 0.055, 0.024, by - 0.04, 0.006)], 2); // le grand pontet
    e.boite(0.004, 0.016, 0.006, 0.0, by - 0.046, 0, "metal", K.acier, 0, 0, -0.25);
    e.anneau(0.009, 0.0018, 0.38, by - 0.032, 0, "metal", P);
    e.anneau(0.009, 0.0018, -0.33, by - 0.1, 0, "metal", P);
    e.dans("culasse", () => { e.boite(0.2, 0.008, 0.006, 0.05, by + 0.006, 0.017, "metal", P); e.boite(0.014, 0.012, 0.012, -0.045, by + 0.012, 0.022, "metal", P); }); // la tige d'armement
    const ch = { x: 0.06, y: by - 0.135 };
    e.dans("chargeur", () => { e.boite(0.05, 0.1, 0.024, 0.06, by - 0.085, 0, "metal", N, 0, 0, 0.06); e.boite(0.052, 0.006, 0.026, 0.063, by - 0.136, 0, "metal", P, 0, 0, 0.06); });
    let lunetteNative = null;
    if (o.lunette) lunetteNative = (e2) => { e2.boite(0.06, 0.04, 0.02, 0.0, by + 0.04, -0.012, "metal", N); return lunette(e2, 0.02, by + 0.05, 0, { long: 0.3, obj: 0.022, tube: 0.013, haut: 0.034, coul: 0x26272a, nom: "lunette ×4" }); };
    return { by: by + 0.008, tip, ch, rail: null, dessous: { x: 0.28, y: by - 0.022 }, garde: { centre: V3(0.26, by - 0.028), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.02, by + 0.02, 0.016),
      mireNative: { ligne: by + 0.036, arriere: -0.066, z: 0, nom: "hausse à œilleton" }, lunetteNative, crosse: -0.455, grip: { centre: V3(-0.1, by - 0.04), axe: V3(0.5, 0.86, 0).normalize() } };
  }
  A.ajouterFabrique("m14", (e, p) => m14(e, p, {}));
  A.ajouterFabrique("m21", (e, p) => m14(e, p, { lunette: true }));

  // ------------------------------------------------------------------ ✍️ (demande 128) LA CARABINE SK-45 (Khavar)
  // La crosse en bois, le magasin FIXE de 10 (on le remplit par le haut avec une lame-chargeur), le tube des gaz au-dessus du
  // canon sous son garde-main en bois, la hausse à curseur, le guidon dans son capuchon, et la BAÏONNETTE repliée sous le canon.
  A.ajouterFabrique("sks", (e, p) => {
    const by = 0.04, tip = 0.52;
    e.cote([[0.3, by - 0.01], [0.3, by - 0.024], [0.1, by - 0.03], [0.06, by - 0.034], [-0.03, by - 0.036], [-0.07, by - 0.032], [-0.12, by - 0.06], [-0.4, by - 0.105], [-0.41, by - 0.105], [-0.41, by + 0.018], [-0.38, by + 0.022], [-0.12, by + 0.002], [-0.08, by + 0.0], [0.3, by + 0.0]], 0.04, "bois", BOIS, 0, 0.008, null, 2, { x: [-0.41, 1, -0.08, 0.75] });
    e.boite(0.008, 0.12, 0.042, -0.414, by - 0.044, 0, "metal", N);
    e.cote([[-0.075, by - 0.004], [-0.075, by + 0.016], [-0.066, by + 0.024], [0.11, by + 0.024], [0.115, by + 0.01], [0.115, by - 0.004]], 0.028, "metal", P, 0, 0.003, null, 2); // la carcasse
    e.cote([[0.012, by - 0.034], [0.07, by - 0.034], [0.064, by - 0.06], [0.03, by - 0.066], [0.012, by - 0.05]], 0.022, "metal", P, 0, 0.002, null, 2); // le magasin fixe
    pontet(e, -0.04, 0.008, by - 0.036, N);
    e.tube(0.115, tip, 0.0092, 0.0084, by + 0.008, 0, "metal", K.canon, 16);
    e.tube(0.13, 0.33, 0.0085, 0.0085, by + 0.026, 0, "metal", N, 12); // le tube des gaz…
    e.galet(0.17, 0.016, 0.03, 0.22, by + 0.026, 0, "bois", BOIS, 0.3); // … sous son garde-main en bois
    e.tube(0.32, 0.345, 0.014, 0.014, by + 0.016, 0, "metal", N, 14); // le bloc des gaz
    e.cote([[0.12, by + 0.024], [0.16, by + 0.024], [0.16, by + 0.032], [0.125, by + 0.03]], 0.012, "metal", N, 0, 0.0015); // la hausse à curseur
    e.tube(tip - 0.02, tip - 0.006, 0.011, 0.011, by + 0.008, 0, "metal", N, 14);
    e.anneau(0.0075, 0.002, tip - 0.013, by + 0.024, 0, "metal", N);
    e.boite(0.0025, 0.012, 0.002, tip - 0.013, by + 0.023, 0, "metal", N);
    // la BAÏONNETTE repliée : la charnière sous la bouche, la lame couchée sous le canon
    e.boite(0.016, 0.012, 0.012, tip - 0.04, by - 0.006, 0, "metal", N);
    e.cote([[tip - 0.045, by - 0.008], [tip - 0.28, by - 0.006], [tip - 0.3, by - 0.002], [tip - 0.28, by + 0.002], [tip - 0.045, by - 0.001]], 0.004, "metal", 0xaab0b6, 0, 0.001);
    e.dans("culasse", () => { e.boite(0.07, 0.014, 0.018, 0.04, by + 0.026, 0, "metal", 0x3e4044); e.barre([0.06, by + 0.022, 0.009], [0.062, by + 0.022, 0.03], 0.0035, "metal", 0x3e4044, 8); e.boule(0.006, 0.062, by + 0.022, 0.032, "metal", 0x3e4044, 10); });
    return { by: by + 0.008, tip, ch: { x: 0.04, y: by + 0.026 }, rail: null, dessous: { x: 0.2, y: by - 0.025 }, garde: { centre: V3(0.2, by - 0.025), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.04, by + 0.028, 0.016),
      mireNative: { ligne: by + 0.032, arriere: 0.12, z: 0, nom: "hausse à curseur" }, crosse: -0.41, munitionsVisibles: true, grip: { centre: V3(-0.09, by - 0.04), axe: V3(0.5, 0.86, 0).normalize() } };
  });

  // ------------------------------------------------------------------ ✍️ (demande 128) LE FUSIL À VERROU M-40 « Rennick »
  // La crosse « de chasse » en noyer (poignée bombée, appui-joue), le gros canon, le boîtier rond, le VERROU à boule à droite
  // (il se lève et recule à chaque tir), et la longue lunette.
  A.ajouterFabrique("m40", (e, p) => {
    const by = 0.04, tip = 0.72;
    e.cote([[0.34, by - 0.008], [0.34, by - 0.024], [0.1, by - 0.03], [0.04, by - 0.034], [-0.05, by - 0.036], [-0.07, by - 0.05], [-0.1, by - 0.085], [-0.13, by - 0.08], [-0.44, by - 0.112], [-0.46, by - 0.112], [-0.46, by + 0.024], [-0.42, by + 0.03], [-0.16, by + 0.012], [-0.09, by + 0.004], [0.34, by + 0.002]], 0.042, "bois", BOIS, 0, 0.008, null, 2, { x: [-0.46, 1, -0.08, 0.72] });
    e.boite(0.012, 0.135, 0.044, -0.466, by - 0.044, 0, "poly", 0x1a1a1a); // la plaque de couche en caoutchouc
    e.tube(-0.08, 0.12, 0.0165, 0.0165, by + 0.012, 0, "metal", N, 20); // le boîtier rond
    e.tube(0.12, tip, 0.0125, 0.0095, by + 0.012, 0, "metal", K.canon, 18); // le gros canon
    e.tube(tip - 0.0004, tip + 0.0004, 0.0048, 0.0048, by + 0.012, 0, "poly", K.fente, 10);
    pontet(e, -0.025, 0.03, by - 0.034, N);
    e.boite(0.07, 0.004, 0.03, 0.03, by - 0.035, 0, "metal", N); // la plaque de magasin
    e.anneau(0.009, 0.0018, 0.3, by - 0.03, 0, "metal", P);
    e.anneau(0.009, 0.0018, -0.33, by - 0.1, 0, "metal", P);
    let levier;
    e.dans("culasse", () => {
      e.tube(-0.095, -0.06, 0.01, 0.01, by + 0.012, 0, "metal", 0x6e7276, 14);
      e.barre([-0.05, by + 0.012, 0.012], [-0.052, by + 0.0, 0.06], 0.0045, "metal", 0x6e7276, 8);
      levier = V3(-0.052, by - 0.002, 0.064);
      e.boule(0.011, levier.x, levier.y, levier.z, "metal", 0x6e7276, 12);
    });
    const lunetteNative = (e2) => lunette(e2, 0.02, by + 0.03, 0, { long: 0.34, obj: 0.025, tube: 0.0135, haut: 0.035, coul: 0x26272a, nom: "lunette ×4" });
    return { by: by + 0.012, tip, ch: null, rail: null, dessous: { x: 0.24, y: by - 0.026 }, garde: { centre: V3(0.24, by - 0.028), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(-0.02, by + 0.028, 0.018),
      mireNative: { ligne: by + 0.03, arriere: -0.05, z: 0, nom: "—" }, lunetteNative, levier, crosse: -0.46, munitionsVisibles: true, grip: { centre: V3(-0.085, by - 0.05), axe: V3(0.5, 0.86, 0).normalize() } };
  });
  // ------------------------------------------------------------------ LE FUSIL D'ASSAUT DROVNIK DK-47
  A.ajouterFabrique("drovnik", (e, p) => {
    const by = 0.04, tip = 0.56;
    e.boite(0.25, 0.05, 0.034, 0.02, by - 0.004, 0, "metal", P); // la carcasse
    e.boite(0.24, 0.012, 0.035, 0.02, by + 0.026, 0, "metal", N, 0, 0, 0); // le couvercle
    e.cote([[-0.1, by + 0.02], [-0.1, by - 0.022], [-0.38, by - 0.085], [-0.39, by - 0.085], [-0.39, by + 0.015], [-0.1, by + 0.025]], 0.04, "bois", BOIS, 0, 0.007, null, 2); // la crosse en bois
    e.boite(0.01, 0.1, 0.042, -0.392, by - 0.035, 0, "metal", N);
    poignee(e, "ak", 0x5a3820, -0.05, by - 0.03, 0.032, "bois");
    pontet(e, -0.04, 0.03, by - 0.03, N);
    e.galet(0.2, 0.04, 0.046, 0.25, by - 0.004, 0, "bois", BOIS, 0.3); // le garde-main en bois
    e.galet(0.16, 0.022, 0.036, 0.25, by + 0.03, 0, "bois", BOIS, 0.3); // le dessus du tube des gaz, en bois
    e.tube(0.33, 0.44, 0.011, 0.011, by + 0.032, 0, "metal", N, 8); // le tube des gaz
    e.tube(0.15, tip, 0.0095, 0.009, by + 0.006, 0, "metal", K.canon, 10); // le canon
    e.boite(0.014, 0.04, 0.012, 0.47, by + 0.034, 0, "metal", N); // le guidon
    e.boite(0.03, 0.016, 0.03, 0.1, by + 0.038, 0, "metal", N); // la hausse
    e.dans("culasse", () => e.boite(0.05, 0.01, 0.012, 0.09, by + 0.012, 0.024, "metal", 0x8a8e92)); // le long levier d'armement, à droite
    // le CHARGEUR COURBE en « banane » : 3 tronçons de plus en plus penchés vers l'avant
    const ch = { x: 0.06, y: by - 0.03 };
    e.dans("chargeur", () => {
      e.boite(0.052, 0.07, 0.026, 0.065, by - 0.06, 0, "metal", 0x6a4a2a, 0, 0, 0.1);
      e.boite(0.052, 0.07, 0.026, 0.08, by - 0.12, 0, "metal", 0x6a4a2a, 0, 0, 0.35);
      e.boite(0.05, 0.06, 0.026, 0.108, by - 0.172, 0, "metal", 0x6a4a2a, 0, 0, 0.6);
    });
    return { by, tip, ch, rail: null, dessous: { x: 0.25, y: by - 0.03 }, garde: { centre: V3(0.25, by - 0.035), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.04, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.05, arriere: 0.1, z: 0, nom: "hausse à curseur" }, crosse: -0.39, grip: { centre: V3(-0.07, -0.04), axe: V3(0.35, 0.94, 0).normalize() } };
  });

  // ------------------------------------------------------------------ LE FUSIL DE PRÉCISION DV-63 (Khavar)
  // Le long fusil semi-automatique : la crosse ÉVIDÉE (un grand trou pour le pouce), le garde-main en bois, le long canon
  // fin et son cache-flamme à fentes, le chargeur de 10, et la LUNETTE ×4 décalée à gauche sur son rail de côté.
  A.ajouterFabrique("dv63", (e, p) => {
    const by = 0.04, tip = 0.78;
    e.boite(0.24, 0.05, 0.034, 0.02, by - 0.004, 0, "metal", P);
    e.boite(0.23, 0.012, 0.035, 0.02, by + 0.026, 0, "metal", N);
    e.cote([[-0.1, by + 0.02], [-0.1, by - 0.03], [-0.42, by - 0.09], [-0.43, by - 0.09], [-0.43, by + 0.04], [-0.3, by + 0.04], [-0.1, by + 0.025]], 0.04, "bois", BOIS, 0, 0.007, [[[-0.32, by - 0.03], [-0.16, by - 0.005], [-0.16, by + 0.012], [-0.32, by + 0.012]]], 2); // la crosse évidée
    e.boite(0.01, 0.13, 0.042, -0.432, by - 0.025, 0, "metal", N);
    poignee(e, "ak", 0x5a3820, -0.05, by - 0.03, 0.032, "bois");
    pontet(e, -0.04, 0.03, by - 0.03, N);
    e.galet(0.22, 0.038, 0.044, 0.26, by - 0.002, 0, "bois", BOIS, 0.3);
    e.tube(0.15, tip, 0.009, 0.0085, by + 0.006, 0, "metal", K.canon, 10);
    e.tube(tip - 0.06, tip, 0.012, 0.012, by + 0.006, 0, "metal", N, 10); // le cache-flamme à fentes
    e.boite(0.012, 0.03, 0.01, tip - 0.08, by + 0.03, 0, "metal", N);
    const ch = { x: 0.06, y: by - 0.03 };
    e.dans("chargeur", () => e.boite(0.05, 0.09, 0.024, 0.065, by - 0.065, 0, "metal", 0x3a3b3d, 0, 0, 0.12));
    const lunetteNative = (e2) => { e2.boite(0.08, 0.03, 0.025, 0.02, by + 0.03, -0.028, "metal", N); return lunette(e2, 0.02, by + 0.032, -0.03, { long: 0.32, obj: 0.02, tube: 0.013, haut: 0.032, coul: 0x2a2b2d, nom: "lunette ×4" }); };
    return { by, tip, ch, rail: null, dessous: { x: 0.26, y: by - 0.03 }, garde: { centre: V3(0.26, by - 0.035), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.04, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.05, arriere: 0.1, z: 0, nom: "hausse à curseur" }, lunetteNative, crosse: -0.43, grip: { centre: V3(-0.07, -0.04), axe: V3(0.35, 0.94, 0).normalize() } };
  });

  // ------------------------------------------------------------------ LA MITRAILLEUSE M-61 « GARROW »
  A.ajouterFabrique("garrow", (e, p) => {
    const by = 0.045, tip = 0.9;
    e.boite(0.36, 0.07, 0.045, 0.02, by, 0, "metal", P); // le boîtier
    e.boite(0.2, 0.02, 0.05, 0.0, by + 0.045, 0, "metal", N); // le couvercle d'alimentation
    e.cote([[-0.16, by + 0.03], [-0.16, by - 0.02], [-0.5, by - 0.05], [-0.5, by + 0.05], [-0.4, by + 0.05]], 0.045, "poly", 0x2a2a28, 0, 0.007, null, 2); // la crosse
    e.boite(0.012, 0.11, 0.05, -0.505, by, 0, "poly", 0x141414);
    poignee(e, "droite", N, -0.08, by - 0.04, 0.034, "poly");
    pontet(e, -0.09, -0.03, by - 0.04, N);
    e.galet(0.16, 0.05, 0.05, 0.27, by - 0.005, 0, "poly", 0x2a2a28, 0.3); // le garde-main
    e.tube(0.2, tip, 0.014, 0.013, by + 0.006, 0, "metal", K.canon, 12); // le canon
    e.tube(tip - 0.05, tip, 0.018, 0.016, by + 0.006, 0, "metal", N, 12); // le cache-flamme
    e.boite(0.015, 0.04, 0.012, tip - 0.08, by + 0.035, 0, "metal", N); // le guidon
    e.boite(0.06, 0.035, 0.012, 0.5, by + 0.05, 0, "metal", N); // la poignée de transport sur le canon
    e.barre([0.47, by + 0.03, 0], [0.53, by + 0.075, 0], 0.006, "metal", N);
    for (const z of [-1, 1]) e.barre([0.62, by - 0.01, 0], [0.66, by - 0.22, z * 0.07], 0.006, "metal", N); // le BIPIED déplié
    // la caisse de la bande, à gauche, et la bande de cartouches qui entre dans l'arme
    const ch = { x: 0.0, y: by - 0.04 };
    e.dans("chargeur", () => {
      e.boite(0.1, 0.09, 0.06, 0.0, by - 0.06, -0.05, "metal", OLIVE);
      if (!e.leger) for (let k = 0; k < 6; k++) e.tube(-0.02 + k * 0.01, -0.015 + k * 0.01, 0.005, 0.005, by + 0.02, -0.03 - k * 0.002, "metal", 0xb08a40, 6);
    });
    return { by, tip, ch, rail: null, dessous: { x: 0.27, y: by - 0.03 }, garde: { centre: V3(0.27, by - 0.035), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.02, by + 0.02, 0.025),
      mireNative: { ligne: by + 0.06, arriere: -0.05, z: 0, nom: "hausse rabattable" }, crosse: -0.5, grip: { centre: V3(-0.1, -0.04), axe: V3(0.2, 0.98, 0).normalize() } };
  });

  // ------------------------------------------------------------------ LE LANCE-GRENADES BECKER 40
  A.ajouterFabrique("becker40", (e, p) => {
    const by = 0.04, tip = 0.36;
    e.boite(0.1, 0.05, 0.05, 0.0, by - 0.005, 0, "metal", P); // le bloc de la culasse (il « casse » comme un fusil de chasse)
    e.tube(0.05, tip, 0.024, 0.024, by + 0.005, 0, "metal", 0x34383a, 18); // le gros canon court
    e.tube(tip - 0.01, tip, 0.027, 0.027, by + 0.005, 0, "metal", N, 18);
    e.galet(0.2, 0.045, 0.052, 0.17, by - 0.03, 0, "bois", BOIS, 0.3); // le fût en bois sous le canon
    e.cote([[-0.04, by + 0.015], [-0.04, by - 0.03], [-0.35, by - 0.09], [-0.36, by - 0.09], [-0.36, by + 0.02], [-0.04, by + 0.025]], 0.042, "bois", BOIS, 0, 0.007, null, 2); // la crosse
    e.boite(0.016, 0.12, 0.046, -0.365, by - 0.035, 0, "poly", 0x222222); // la plaque de couche en caoutchouc
    poignee(e, "droite", null, -0.04, by - 0.035, 0.03, "bois");
    pontet(e, -0.05, 0.0, by - 0.035, N);
    e.boite(0.004, 0.04, 0.02, 0.12, by + 0.05, 0, "metal", N); // la hausse à échelle (relevée)
    e.boite(0.01, 0.018, 0.006, tip - 0.03, by + 0.035, 0, "metal", N); // le guidon
    e.dans("chargeur", () => e.tube(0.05, 0.12, 0.02, 0.02, by + 0.005, 0, "metal", 0xb08a40, 14)); // la grenade dans la chambre (on la voit au rechargement)
    return { by, tip, ch: { x: 0.08, y: by }, rail: null, dessous: { x: 0.17, y: by - 0.05 }, garde: { centre: V3(0.17, by - 0.05), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: null,
      mireNative: { ligne: by + 0.07, arriere: 0.12, z: 0, nom: "hausse à échelle" }, crosse: -0.36, grip: { centre: V3(-0.06, -0.05), axe: V3(0.3, 0.95, 0).normalize() } };
  });
})();
