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
// Le lance-roquettes (le RK-7) est celui de l'édition Moderne ; le fusil à
// verrou à lunette et les pistolets, ceux de 1944. Il ne fait que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, poignee, lunette } = A.outils;
  const N = 0x1e1f21, P = 0x2c2d30, BOIS = 0x6a3e22, OLIVE = 0x4a5232;

  // ------------------------------------------------------------------ LE FUSIL D'ASSAUT CARLTON M-17
  A.ajouterFabrique("carlton", (e, p) => {
    const by = 0.045, tip = 0.62;
    e.cote([[-0.07, 0.0], [-0.07, 0.065], [0.11, 0.065], [0.11, 0.0], [0.03, -0.035], [0.0, -0.002]], 0.032, "metal", N, 0, 0.003); // la carcasse
    // la poignée de transport, avec la hausse à l'arrière
    e.cote([[-0.07, 0.065], [-0.06, 0.115], [0.09, 0.115], [0.1, 0.065]], 0.018, "metal", N, 0, 0.003, [[[-0.04, 0.073], [0.07, 0.073], [0.07, 0.103], [-0.04, 0.103]]], 2);
    e.boite(0.02, 0.022, 0.02, -0.055, 0.124, 0, "metal", N);
    // la crosse fixe (en plastique noir) et sa plaque de couche
    e.cote([[-0.07, 0.06], [-0.07, 0.0], [-0.33, -0.05], [-0.34, -0.05], [-0.34, 0.07], [-0.07, 0.066]], 0.038, "poly", N, 0, 0.006, null, 2);
    e.boite(0.012, 0.125, 0.04, -0.345, 0.01, 0, "poly", 0x141414);
    poignee(e, "ar", N);
    pontet(e, 0.008, 0.07, 0.0, N);
    // le garde-main rond, à côtes (2 coquilles)
    e.tube(0.11, 0.34, 0.028, 0.026, by, 0, "poly", N, 12);
    if (!e.leger) for (let x = 0.13; x < 0.33; x += 0.022) e.tube(x, x + 0.006, 0.0295, 0.0295, by, 0, "poly", 0x141414, 12);
    e.tube(0.34, tip - 0.04, 0.009, 0.009, by, 0, "metal", K.canon, 10); // le canon
    e.boite(0.012, 0.06, 0.012, 0.43, by + 0.03, 0, "metal", N); // le guidon en triangle
    e.boite(0.03, 0.01, 0.014, 0.43, by + 0.005, 0, "metal", N);
    for (let k = 0; k < 3; k++) e.boite(0.04, 0.004, 0.004, tip - 0.02, by + Math.cos((k * 2 * Math.PI) / 3) * 0.009, Math.sin((k * 2 * Math.PI) / 3) * 0.009, "metal", N); // le cache-flamme à 3 dents
    e.boite(0.01, 0.01, 0.03, -0.08, 0.05, 0, "metal", N); // le levier d'armement (derrière la poignée)
    e.dans("culasse", () => e.boite(0.04, 0.012, 0.004, 0.03, 0.045, 0.017, "metal", 0x3a3c3e)); // le volet d'éjection
    const ch = { x: 0.065, y: -0.03 };
    e.dans("chargeur", () => e.boite(0.055, 0.13, 0.024, 0.066, -0.095, 0, "metal", 0x3a3b3d, 0, 0, 0.08)); // le chargeur droit de 20
    return { by, tip, ch, rail: null, dessous: { x: 0.24, y: by - 0.03 }, garde: { centre: V3(0.24, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, 0.045, 0.017),
      mireNative: { ligne: 0.135, arriere: -0.055, z: 0, nom: "hausse dans la poignée" }, crosse: -0.345, grip: { centre: V3(-0.03, -0.05), axe: V3(0.4, 0.92, 0).normalize() } };
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
