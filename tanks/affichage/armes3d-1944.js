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
// Il ne fait que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, poignee } = A.outils;
  const N = 0x2b2d30, P = 0x3a3c3e, LAITON = 0xb08a40, BAKE = 0x2a1a12, OLIVE = 0x4a5232;

  // ------------------------------------------------------------------ les FUSILS SEMI-AUTOMATIQUES
  function semiAuto(e, p, o) {
    const by = 0.04, xr = 0.15, tip = xr + o.canon;
    e.boite(0.24, 0.03, 0.03, 0.02, by + 0.004, 0, "metal", N); // la carcasse
    e.boite(0.12, 0.012, 0.032, 0.0, by + 0.024, 0, "metal", P);
    e.cote([[0.04, by - 0.02], [-0.06, by - 0.03], [-0.12, by - 0.065], [-0.44, by - 0.11], [-0.46, by - 0.11], [-0.46, by + 0.025], [-0.42, by + 0.03], [-0.13, by + 0.012], [-0.09, by + 0.012]], 0.042, "bois", null, 0, 0.007, null, 2);
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

  // ------------------------------------------------------------------ LES PISTOLETS-MITRAILLEURS
  A.ajouterFabrique("thornton", (e, p) => {
    const by = 0.04, tip = 0.38;
    e.boite(0.26, 0.05, 0.034, 0.03, by, 0, "metal", N);
    e.tube(0.16, tip, 0.011, 0.011, by + 0.004, 0, "metal", K.canon, 12);
    if (!e.leger) for (let x = 0.17; x < 0.26; x += 0.012) e.tube(x, x + 0.005, 0.014, 0.014, by + 0.004, 0, "metal", N, 12); // les ailettes du canon
    e.tube(tip - 0.03, tip, 0.016, 0.016, by + 0.004, 0, "metal", N, 12); // le compensateur
    e.cote([[-0.1, by - 0.01], [-0.36, by - 0.06], [-0.36, by + 0.04], [-0.1, by + 0.02]], 0.04, "bois", null, 0, 0.007); // la crosse
    poignee(e, "droite", null, -0.03, by - 0.025, 0.032, "bois");
    poignee(e, "droite", null, 0.2, by - 0.02, 0.03, "bois"); // la poignée avant
    pontet(e, -0.02, 0.03, by - 0.025, N);
    e.boite(0.02, 0.016, 0.01, 0.09, by + 0.03, 0.014, "metal", 0x8a8e92); // le levier d'armement
    const ch = { x: 0.08, y: by - 0.07 };
    e.dans("chargeur", () => { e.disque(0.075, 0.04, 0.08, by - 0.085, 0, "metal", P, 22); e.disque(0.02, 0.045, 0.08, by - 0.085, 0, "metal", N, 12); }); // le TAMBOUR
    return { by, tip, ch, rail: null, dessous: { x: 0.2, y: by - 0.03 }, garde: { centre: V3(0.205, by - 0.07), axe: V3(0.1, 1, 0).normalize(), sorte: "pistolet" }, lampe: null, laser: null, ejection: V3(0.04, by + 0.026, 0.018),
      mireNative: { ligne: by + 0.04, arriere: -0.05, z: 0, nom: "hausse et guidon" }, crosse: -0.36, grip: { centre: V3(-0.06, -0.04), axe: V3(0.3, 0.95, 0).normalize() } };
  });
  A.ajouterFabrique("varn40", (e, p) => {
    const by = 0.04, tip = 0.36;
    e.tube(-0.06, 0.18, 0.02, 0.02, by, 0, "metal", N, 16);
    e.tube(0.18, tip, 0.01, 0.01, by, 0, "metal", K.canon, 12);
    e.boite(0.08, 0.012, 0.012, 0.32, by - 0.016, 0, "metal", N); // l'arrêtoir sous le canon
    poignee(e, "ak", BAKE, -0.01, by - 0.022, 0.03, "poly");
    pontet(e, -0.01, 0.035, by - 0.022, N);
    e.cote([[0.03, by - 0.02], [0.03, by - 0.03], [0.17, by - 0.035], [0.17, by - 0.02]], 0.03, "poly", BAKE, 0, 0.004); // le bas en bakélite
    for (const z of [-0.016, 0.016]) e.barre([-0.06, by - 0.01, z], [0.12, by - 0.045, z], 0.004, "metal", N); // la crosse REPLIÉE sous l'arme
    e.boite(0.03, 0.012, 0.012, 0.06, by + 0.016, -0.02, "metal", N);
    const ch = { x: 0.1, y: by - 0.08 };
    e.dans("chargeur", () => e.boite(0.03, 0.18, 0.026, 0.1, by - 0.11, 0, "metal", P));
    return { by, tip, ch, rail: null, dessous: { x: 0.1, y: by - 0.03 }, garde: { centre: V3(0.1, by - 0.1), axe: V3(0.05, 1, 0).normalize(), sorte: "pistolet" }, lampe: null, laser: null, ejection: V3(0.06, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.032, arriere: -0.05, z: 0, nom: "hausse et guidon" }, crosse: -0.07, grip: { centre: V3(-0.035, -0.04), axe: V3(0.35, 0.94, 0).normalize() } };
  });
  A.ajouterFabrique("stellan", (e, p) => {
    const by = 0.04, tip = 0.36;
    e.tube(-0.06, 0.24, 0.018, 0.018, by, 0, "metal", N, 16); // le tube
    if (!e.leger) for (let x = 0.15; x < 0.23; x += 0.016) e.tube(x, x + 0.006, 0.021, 0.021, by, 0, "metal", 0x232426, 14); // le manchon troué
    e.tube(0.24, tip, 0.009, 0.009, by, 0, "metal", K.canon, 10);
    for (const z of [-0.012, 0.012]) e.barre([-0.06, by, z], [-0.34, by - 0.03, z], 0.004, "metal", N); // la crosse en fil de fer
    e.boite(0.01, 0.08, 0.05, -0.34, by - 0.03, 0, "metal", N);
    poignee(e, "droite", N, 0.0, by - 0.018, 0.02, "metal");
    pontet(e, -0.005, 0.03, by - 0.018, N);
    const ch = { x: 0.12, y: by };
    e.dans("chargeur", () => e.boite(0.03, 0.026, 0.17, 0.12, by, -0.1, "metal", P)); // le chargeur SUR LE CÔTÉ (gauche)
    return { by, tip, ch, rail: null, dessous: { x: 0.12, y: by - 0.02 }, garde: { centre: V3(0.12, by - 0.005, -0.04), axe: V3(0, 0, -1), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.06, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.03, arriere: -0.04, z: 0, nom: "œilleton" }, crosse: -0.34, grip: { centre: V3(-0.03, -0.04), axe: V3(0.2, 0.98, 0).normalize() } };
  });

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
    e.boite(0.1, 0.022, 0.024, 0.01, by - 0.006, 0, "metal", N); // la carcasse
    e.cote([[0.0, by - 0.016], [-0.012, by - 0.07], [-0.022, by - 0.12], [-0.06, by - 0.118], [-0.052, by - 0.07], [-0.04, by - 0.016]], 0.03, o.bois ? "bois" : "poly", o.bois ? 0x5a3a20 : BAKE, 0, 0.006, null, 2);
    pontet(e, -0.004, 0.04, by - 0.014, N);
    e.dans("culasse", () => { e.boite(L, 0.026, 0.026, L / 2 - 0.05, by + 0.014, 0, "metal", o.couleur); e.boite(0.006, 0.008, 0.004, L - 0.06, by + 0.031, 0, "metal", N); });
    e.tube(L - 0.05, L - 0.04, 0.007, 0.007, by + 0.012, 0, "metal", K.canon, 10);
    return { by, tip: L - 0.04, ch: { x: -0.03, y: by - 0.02 }, rail: null, dessous: null, garde: { centre: V3(-0.03, -0.08, -0.036), axe: V3(0.6, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.02, 0.0), mireNative: { ligne: by + 0.034, arriere: -0.04, z: 0, nom: "cran et guidon" }, glissiere: { x: 0.0, y: by + 0.026 }, bout: { x: L - 0.04, y: by + 0.012, r: 0.007 },
      grip: { centre: V3(-0.03, -0.05), axe: V3(0.3, 1, 0).normalize() }, crosse: -0.06 };
  }
  A.ajouterFabrique("colton45", (e, p) => pistolet(e, p, { long: 0.2, couleur: 0x2e3034, bois: true }));
  A.ajouterFabrique("varnP38", (e, p) => pistolet(e, p, { long: 0.19, couleur: 0x262729 }));
})();
