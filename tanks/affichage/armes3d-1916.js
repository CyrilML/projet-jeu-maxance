// 🔫 LES ARMES DE 1916 EN 3D : l'armurier du vieux temps (demande 115, édition « Première Guerre mondiale »)
//
// ✍️ « Fusils à verrou, mitrailleuses lourdes… » L'armurier moderne (affichage/armes3d.js) sait souder des pièces ; on lui
// apprend ici à fabriquer les armes INVENTÉES de 1916 (inspirées des vraies, mais avec d'autres noms) :
//   - le FUSIL VALMONT 86 : très long, tout en bois de noyer (la crosse, le fût jusqu'au bout, le garde-main), le canon
//     bleui, ses 2 grenadières (les anneaux), la hausse, le levier de VERROU à boule sur le côté droit (dans la
//     « culasse » : c'est lui qui tourne et recule à la 1re personne), et la longue BAÏONNETTE à lame fine ;
//   - le FUSIL KRESS 98 : plus court, la crosse à poignée creusée, le levier coudé, et une lame-chargeur ;
//   - le MOUSQUETON 92 : la carabine courte ; les deux fusils À LUNETTE (une petite lunette décalée à gauche) ;
//   - le FUSIL-MITRAILLEUR CHAUMARD : le manchon à ailettes autour du canon, le CHARGEUR EN DEMI-LUNE (troué sur le
//     côté pour voir les cartouches), la poignée pistolet en bois, la poignée avant, le bipied replié ;
//   - le FUSIL DE TRANCHÉE WARDELL : un fusil à pompe en bois, avec son cache-chaleur troué et sa baïonnette ;
//   - le REVOLVER 92 (barillet, canon octogonal, anneau de dragonne) et le PISTOLET KRESS 08 (la culasse à genouillère).
// ✍️ (demande 128, d'après les photos d'Iron Wolf Studio) les PISTOLETS D'AUTREFOIS : 4 familles réglables (le revolver dont le
// barillet tourne à chaque tir, l'automatique, le pistolet à genouillère qui se plie, le « manche à balai » à magasin avant),
// 7 nouvelles armes de poing pour 1916 (et prêtées à 1944), et le PISTOLET-MITRAILLEUR KRESS 18 et son chargeur « escargot ».
// Chaque fabrique répond comme celles de l'armurier : où est le canon, le viseur, la poignée, la main gauche… Elle ne fait
// que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, bout, lunette, culasseStriee, rectRond } = A.outils;
  const N = 0x2b2d30, ACIER = 0x6e7276, LAITON = 0xb08a40, LAME = 0xaab0b6;

  // ------------------------------------------------------------------ LE FUSIL À VERROU (la base de 5 armes)
  //   o.canon : la longueur du canon (m) devant la carcasse ; o.fut : jusqu'où va le bois ; o.kress : le style de Kressia
  //   (poignée creusée, levier coudé vers le bas) ; o.lame : une baïonnette ; o.lunette : la lunette décalée à gauche.
  function fusil(e, p, o) {
    const by = 0.035, xr = 0.13, tip = xr + o.canon;
    // la carcasse (le « boîtier » du verrou) et le pontet de la détente
    e.tube(-0.075, xr, 0.0165, 0.0165, by + 0.01, 0, "metal", N, 14);
    e.boite(0.2, 0.024, 0.028, 0.025, by - 0.006, 0, "metal", N);
    pontet(e, -0.015, 0.04, by - 0.02, N);
    // la CROSSE et le poignet (en bois), et la plaque de couche en acier
    const cr = -0.48;
    if (o.kress) e.cote([[0.0, by - 0.02], [-0.05, by - 0.03], [-0.09, by - 0.085], [-0.12, by - 0.08], [-0.42, by - 0.13], [cr, by - 0.135], [cr, by + 0.02], [-0.44, by + 0.025], [-0.16, by + 0.0], [-0.08, by + 0.006], [-0.075, by + 0.01]], 0.042, "bois", null, 0, 0.007, null, 2, { x: [-0.44, 1, -0.08, 0.7] });
    else e.cote([[0.0, by - 0.02], [-0.07, by - 0.03], [-0.13, by - 0.06], [-0.42, by - 0.115], [cr, by - 0.12], [cr, by + 0.025], [-0.44, by + 0.03], [-0.15, by + 0.005], [-0.08, by + 0.006], [-0.075, by + 0.01]], 0.04, "bois", null, 0, 0.007, null, 2, { x: [-0.44, 1, -0.08, 0.7] });
    e.boite(0.008, 0.15, 0.044, cr - 0.002, by - 0.05, 0, "metal", N);
    // le FÛT sous le canon, et le garde-main au-dessus
    e.cote([[xr - 0.13, by - 0.028], [o.fut, by - 0.012], [o.fut, by + 0.006], [xr - 0.13, by + 0.002]], 0.036, "bois", null, 0, 0.005);
    e.galet(o.fut - xr - 0.06, 0.016, 0.03, (xr + 0.06 + o.fut) / 2, by + 0.019, 0, "bois", null, 0.25);
    // le CANON (bleui) et les grenadières
    e.tube(xr, tip, 0.0105, 0.0085, by + 0.01, 0, "metal", K.canon, 14);
    for (const x of [xr + (o.fut - xr) * 0.45, o.fut - 0.02]) e.tube(x - 0.009, x + 0.009, 0.022, 0.022, by + 0.004, 0, "metal", N, 12);
    // la hausse (une échelle) et le guidon
    e.boite(0.05, 0.012, 0.018, xr + 0.06, by + 0.03, 0, "metal", N);
    e.boite(0.006, 0.014, 0.012, xr + 0.08, by + 0.042, 0, "metal", N);
    e.boite(0.012, 0.016, 0.004, tip - 0.025, by + 0.026, 0, "metal", N);
    // la bretelle (ses 2 anneaux) et un bout de cuir
    e.anneau(0.012, 0.002, o.fut - 0.06, by - 0.03, 0, "metal", N);
    e.anneau(0.012, 0.002, -0.3, by - 0.1, 0, "metal", N);
    // le VERROU : le cylindre, le levier, sa boule (sur le côté droit, z > 0) — dans la « culasse » : il bouge
    let levier;
    e.dans("culasse", () => {
      e.tube(-0.08, -0.03, 0.0095, 0.0095, by + 0.012, 0, "metal", ACIER, 12); // l'arrière du verrou
      e.boite(0.02, 0.014, 0.012, -0.085, by + 0.018, 0, "metal", ACIER); // le chien
      if (o.kress) {
        e.barre([-0.045, by + 0.012, 0.012], [-0.03, by - 0.03, 0.05], 0.0045, "metal", ACIER);
        levier = V3(-0.03, by - 0.034, 0.053);
      } else {
        e.barre([-0.04, by + 0.012, 0.012], [-0.042, by + 0.004, 0.06], 0.0045, "metal", ACIER);
        levier = V3(-0.042, by + 0.002, 0.064);
      }
      e.boule(0.0105, levier.x, levier.y, levier.z, "metal", ACIER, 10);
    });
    // la BAÏONNETTE : la douille autour du canon, la croisière, la longue lame
    let fin = tip;
    if (o.lame) {
      e.tube(tip - 0.04, tip + 0.005, 0.0125, 0.0125, by + 0.01, 0, "metal", N, 12);
      e.boite(0.012, 0.05, 0.01, tip - 0.03, by - 0.008, 0, "metal", N);
      const L = o.lame, yL = by - 0.02;
      e.cote([[tip - 0.01, yL - 0.007], [tip + L * 0.85, yL - 0.005], [tip + L, yL], [tip + L * 0.85, yL + 0.005], [tip - 0.01, yL + 0.007]], 0.004, "metal", LAME, 0, 0.001);
      fin = tip + L;
    }
    // la LUNETTE (décalée à gauche, pour garder la hausse) : le tireur d'élite
    let lunetteNative = null;
    if (o.lunette) lunetteNative = (e2) => { e2.boite(0.07, 0.03, 0.03, 0.04, by + 0.03, -0.028, "metal", N); return lunette(e2, 0.04, by + 0.032, -0.03, { long: 0.3, obj: 0.019, tube: 0.012, haut: 0.03, coul: 0x2a2b2d, nom: "lunette ×" + o.lunette }); };
    return { by, tip: o.lame ? tip + 0.005 : tip, fin, ch: null, rail: null, dessous: { x: (xr + o.fut) / 2, y: by - 0.03 }, garde: { centre: V3(Math.min(0.32, (xr + o.fut) / 2), by - 0.028), axe: V3(1, 0, 0), sorte: "dessous" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.03, 0.018), mireNative: { ligne: by + 0.047, arriere: xr - 0.1, z: 0, nom: "hausse et guidon" }, lunetteNative, levier,
      crosse: cr, grip: { centre: V3(-0.085, by - 0.045), axe: V3(0.5, 0.86, 0).normalize() } };
  }
  Tanks.Armes1916 = { fusil }; // (demande 115 : prêté aux éditions suivantes : le fusil à verrou de 1944)
  A.ajouterFabrique("fusil86", (e, p) => fusil(e, p, { canon: 0.68, fut: 0.66, lame: 0.4 }));
  A.ajouterFabrique("kress98", (e, p) => fusil(e, p, { canon: 0.6, fut: 0.6, kress: true, lame: 0.25 }));
  A.ajouterFabrique("mousqueton92", (e, p) => fusil(e, p, { canon: 0.36, fut: 0.4 }));
  A.ajouterFabrique("fusil86lunette", (e, p) => fusil(e, p, { canon: 0.68, fut: 0.66, lunette: 3 }));
  A.ajouterFabrique("kress98lunette", (e, p) => fusil(e, p, { canon: 0.6, fut: 0.6, kress: true, lunette: 4 }));

  // ------------------------------------------------------------------ LE FUSIL-MITRAILLEUR CHAUMARD
  A.ajouterFabrique("chaumard", (e, p) => {
    const by = 0.04, tip = 0.62;
    // la carcasse en tôle, la poignée pistolet en bois, la crosse
    e.boite(0.3, 0.06, 0.04, 0.02, by, 0, "metal", N);
    e.tube(0.17, 0.42, 0.028, 0.028, by + 0.008, 0, "metal", N, 16); // le manchon autour du canon
    if (!e.leger) for (let x = 0.19; x < 0.41; x += 0.022) e.tube(x, x + 0.006, 0.034, 0.034, by + 0.008, 0, "metal", 0x3a3c40, 14); // ses ailettes
    e.tube(0.42, tip, 0.011, 0.01, by + 0.008, 0, "metal", K.canon, 12);
    e.tube(tip - 0.03, tip, 0.016, 0.016, by + 0.008, 0, "metal", N, 12); // le cache-flamme
    e.boite(0.012, 0.03, 0.004, tip - 0.05, by + 0.035, 0, "metal", N); // le guidon
    e.boite(0.03, 0.025, 0.02, -0.06, by + 0.045, 0, "metal", N); // la hausse
    e.cote([[-0.02, by - 0.028], [-0.03, by - 0.07], [-0.045, by - 0.13], [-0.075, by - 0.13], [-0.068, by - 0.07], [-0.06, by - 0.028]], 0.034, "bois", null, 0, 0.006); // la poignée
    pontet(e, -0.03, 0.02, by - 0.03, N);
    e.cote([[-0.13, by + 0.02], [-0.42, by - 0.03], [-0.44, by - 0.1], [-0.44, by + 0.04], [-0.13, by + 0.03]], 0.04, "bois", null, 0, 0.007); // la crosse
    e.boite(0.008, 0.14, 0.042, -0.444, by - 0.03, 0, "metal", N);
    e.tube(-0.135, -0.11, 0.02, 0.02, by + 0.01, 0, "metal", N, 12);
    // la poignée avant en bois, et le bipied replié le long du manchon
    e.cote([[0.14, by - 0.03], [0.13, by - 0.11], [0.16, by - 0.115], [0.17, by - 0.03]], 0.03, "bois", null, 0, 0.005);
    for (const z of [-0.035, 0.035]) e.barre([0.42, by - 0.02, z], [0.18, by - 0.035, z], 0.005, "metal", N);
    // le CHARGEUR EN DEMI-LUNE, dessous, avec ses fenêtres (on voit les cartouches en laiton)
    const ch = { x: 0.06, y: by - 0.03 };
    e.dans("chargeur", () => {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const a = Math.PI * (k / 12); pts.push([0.06 + Math.cos(a) * 0.075, by - 0.03 - Math.sin(a) * 0.11]); }
      for (let k = 12; k >= 0; k--) { const a = Math.PI * (k / 12); pts.push([0.06 + Math.cos(a) * 0.035, by - 0.03 - Math.sin(a) * 0.065]); }
      e.cote(pts, 0.022, "metal", 0x3a3d40, 0, 0.002);
      if (!e.leger) for (let k = 2; k <= 10; k += 2) { const a = Math.PI * (k / 12); e.boite(0.016, 0.006, 0.024, 0.06 + Math.cos(a) * 0.055, by - 0.03 - Math.sin(a) * 0.088, 0, "metal", LAITON, 0, 0, a); }
    });
    return { by, tip, ch, rail: null, dessous: { x: 0.155, y: by - 0.04 }, garde: { centre: V3(0.155, by - 0.075), axe: V3(0.12, 1, 0).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.03, by + 0.03, 0.02), mireNative: { ligne: by + 0.058, arriere: -0.07, z: 0, nom: "hausse et guidon" }, crosse: -0.44, grip: { centre: V3(-0.045, -0.04), axe: V3(0.25, 0.97, 0).normalize() } };
  });

  // ------------------------------------------------------------------ ✍️ LE PISTOLET-MITRAILLEUR KRESS 18 (demande 128)
  // ✍️ « Les pistolets-mitrailleurs de la Première … Guerre mondiale. » Le tout premier pistolet-mitrailleur, arrivé à la fin de
  // la guerre : une crosse en bois comme un fusil, le tube de la culasse, le MANCHON percé de gros trous autour du canon, et
  // le chargeur « ESCARGOT » (un tambour de 32 balles) planté sur le côté GAUCHE.
  A.ajouterFabrique("kress18", (e, p) => {
    const by = 0.04, tip = 0.3, R = 0.0175;
    e.cote([[0.06, by - 0.008], [0.06, by - 0.026], [-0.06, by - 0.03], [-0.12, by - 0.06], [-0.4, by - 0.105], [-0.42, by - 0.105], [-0.42, by + 0.03], [-0.39, by + 0.032], [-0.12, by + 0.004], [-0.08, by + 0.0], [0.06, by + 0.0]], 0.04, "bois", null, 0, 0.007, null, 2, { x: [-0.42, 1, -0.08, 0.72] });
    e.boite(0.008, 0.13, 0.042, -0.424, by - 0.036, 0, "metal", N); // la plaque de couche
    e.tube(-0.1, 0.065, 0.019, 0.019, by + 0.008, 0, "metal", N, 22); // le tube de la culasse
    e.tour([[-0.112, 0.006], [-0.108, 0.016], [-0.1, 0.0195]], by + 0.008, 0, "metal", N, 20);
    e.tube(0.065, 0.27, R, R, by + 0.008, 0, "metal", N, 22); // le manchon…
    for (let k = 0; k < (e.leger ? 0 : 9); k++) for (const a of [0, 0.75, -0.75, 1.5, -1.5]) e.cyl(0.0042, 0.0042, 0.004, 0.08 + k * 0.021, by + 0.008 + Math.cos(a) * (R - 0.0012), Math.sin(a) * (R - 0.0012), "poly", K.fente, 10, a); // … et ses gros trous
    e.tour([[0.27, R], [0.277, 0.012], [0.277, 0.0095]], by + 0.008, 0, "metal", N, 20);
    e.tube(0.274, tip, 0.0088, 0.0088, by + 0.008, 0, "metal", K.canon, 16);
    e.tube(tip - 0.0004, tip + 0.0004, 0.0046, 0.0046, by + 0.008, 0, "poly", K.fente, 10);
    e.cote([[0.255, by + 0.023], [0.268, by + 0.023], [0.266, by + 0.035], [0.258, by + 0.035]], 0.003, "metal", N, 0, 0.0005); // le guidon
    e.cote([[-0.02, by + 0.026], [0.02, by + 0.026], [0.02, by + 0.033], [-0.02, by + 0.033]], 0.014, "metal", N, 0, 0.0015); // la hausse
    for (const s of [-1, 1]) e.boite(0.006, 0.006, 0.004, -0.016, by + 0.036, s * 0.0035, "metal", N);
    pontet(e, -0.035, 0.015, by - 0.022, N);
    e.anneau(0.01, 0.002, -0.3, by - 0.09, 0, "metal", N);
    e.anneau(0.01, 0.002, 0.04, by - 0.032, 0, "metal", N);
    e.boite(0.034, 0.03, 0.05, 0.085, by + 0.004, -0.04, "metal", N); // le puits du chargeur, à GAUCHE
    if (!e.leger) e.boite(0.1, 0.004, 0.002, 0.0, by + 0.008, 0.0192, "poly", K.fente);
    e.dans("culasse", () => { e.barre([-0.05, by + 0.008, 0.018], [-0.05, by + 0.008, 0.034], 0.0035, "metal", ACIER, 8); e.boule(0.006, -0.05, by + 0.008, 0.036, "metal", ACIER, 10); }); // le levier d'armement, à droite
    const ch = { x: 0.085, y: by - 0.03 };
    e.dans("chargeur", () => { // l'ESCARGOT : un long cou, puis le tambour (sa face ronde regarde vers la gauche) et sa bosse en spirale
      e.boite(0.028, 0.026, 0.034, 0.085, by + 0.002, -0.078, "metal", 0x3a3d40);
      e.disque(0.05, 0.04, 0.072, by - 0.032, -0.112, "metal", 0x3a3d40, 30);
      e.disque(0.033, 0.044, 0.095, by - 0.018, -0.112, "metal", 0x3a3d40, 24); // la bosse de la spirale
      for (const s of [-1, 1]) e.disque(0.052, 0.004, 0.072, by - 0.032, -0.112 + s * 0.02, "metal", N, 30);
      e.disque(0.012, 0.05, 0.072, by - 0.032, -0.112, "metal", ACIER, 14); // le moyeu
      e.cote([[0.067, by - 0.032], [0.077, by - 0.032], [0.08, by - 0.064], [0.064, by - 0.064]], 0.006, "metal", ACIER, -0.137, 0.001); // la manivelle pour bander le ressort
    });
    return { by: by + 0.008, tip, ch, rail: null, dessous: null, garde: { centre: V3(0.025, by - 0.022), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, by + 0.02, 0.02),
      mireNative: { ligne: by + 0.035, arriere: -0.02, z: 0, nom: "hausse et guidon" }, crosse: -0.42, grip: { centre: V3(-0.085, by - 0.045), axe: V3(0.5, 0.86, 0).normalize() } };
  });

  // ------------------------------------------------------------------ LE FUSIL DE TRANCHÉE WARDELL (à pompe)
  A.ajouterFabrique("fusilTranchee", (e, p) => {
    const by = 0.04, tip = 0.5;
    e.boite(0.18, 0.05, 0.036, 0.03, by - 0.005, 0, "metal", N);
    e.tube(0.12, tip, 0.012, 0.012, by + 0.01, 0, "metal", K.canon, 14); // le canon
    e.tube(0.12, tip - 0.06, 0.0095, 0.0095, by - 0.016, 0, "metal", N, 12); // le magasin tubulaire dessous
    e.tube(0.16, tip - 0.08, 0.019, 0.019, by + 0.012, 0, "metal", 0x3c3e41, 12); // le CACHE-CHALEUR…
    if (!e.leger) for (let x = 0.18; x < tip - 0.1; x += 0.03) for (const s of [-1, 1]) e.boite(0.012, 0.006, 0.004, x, by + 0.014, s * 0.018, "poly", K.fente); // … et ses trous
    e.boite(0.01, 0.012, 0.004, tip - 0.01, by + 0.026, 0, "metal", N);
    e.cote([[-0.06, by - 0.02], [-0.11, by - 0.05], [-0.4, by - 0.1], [-0.42, by - 0.1], [-0.42, by + 0.02], [-0.38, by + 0.024], [-0.1, by + 0.012], [-0.06, by + 0.015]], 0.04, "bois", null, 0, 0.007, null, 2, { x: [-0.44, 1, -0.08, 0.7] });
    e.boite(0.008, 0.13, 0.044, -0.424, by - 0.04, 0, "metal", N);
    pontet(e, -0.02, 0.03, by - 0.025, N);
    // la baïonnette au bout
    e.boite(0.025, 0.035, 0.012, tip - 0.02, by - 0.02, 0, "metal", N);
    e.cote([[tip, by - 0.03], [tip + 0.22, by - 0.026], [tip + 0.26, by - 0.02], [tip + 0.22, by - 0.014], [tip, by - 0.012]], 0.004, "metal", LAME, 0, 0.001);
    // la POMPE en bois (dans la « culasse » : elle recule et revient après chaque tir)
    e.dans("culasse", () => {
      e.tube(0.13, 0.24, 0.02, 0.02, by - 0.014, 0, "bois", null, 14);
      if (!e.leger) for (let x = 0.14; x < 0.24; x += 0.014) e.tube(x, x + 0.004, 0.0205, 0.0205, by - 0.014, 0, "poly", 0x2a1a0e, 14);
    });
    return { by, tip, ch: null, rail: null, dessous: { x: 0.18, y: by - 0.03 }, garde: { centre: V3(0.185, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" }, lampe: null, laser: null, ejection: V3(0.03, by + 0.02, 0.019),
      mireNative: { ligne: by + 0.03, arriere: 0.0, z: 0, nom: "bille" }, crosse: -0.42, munitionsVisibles: true, grip: { centre: V3(-0.075, by - 0.045), axe: V3(0.5, 0.86, 0).normalize() } };
  });

  // ================================================================== ✍️ LES PISTOLETS D'AUTREFOIS (demande 128)
  // ✍️ « Ajoute ça dans l'édition de la Première et de la Seconde Guerre mondiale. » (une photo d'une vingtaine d'armes de poing
  // anciennes). L'armurier sait maintenant fabriquer 4 FAMILLES, chacune réglable :
  //   - le REVOLVER : le barillet (6 ou 7 chambres, ses cannelures, les balles qu'on voit devant) TOURNE d'un cran à chaque
  //     tir ; « ouverture » : « basculant » (le canon et le barillet basculent vers l'avant : on voit la charnière devant et
  //     le verrou en étrier derrière), « portillon » (une petite porte à droite pour glisser les cartouches une par une, et la
  //     baguette sous le canon) ou « lateral » (le barillet sort sur le côté : le poussoir à gauche, l'éjecteur sous le canon) ;
  //     la crosse carrée, en bec d'oiseau ou ronde, en bois, en bois quadrillé ou en ébonite noire, et son anneau de dragonne ;
  //   - le PISTOLET AUTOMATIQUE (de poche ou d'ordonnance) : la culasse striée (elle recule), le nez rond ou droit, le chien
  //     ou pas, la poignée plus ou moins penchée, les plaquettes et leurs vis, et parfois un magasin fixe (on le remplit par
  //     le haut avec une lame-chargeur) ;
  //   - le PISTOLET À GENOUILLÈRE : la genouillère se PLIE vers le haut à chaque tir (voir « genou ») ;
  //   - le PISTOLET À MAGASIN AVANT (« manche à balai ») : le magasin devant le pontet, le long canon, la hausse, la poignée
  //     ronde rainurée et le chien à anneau.
  const BLEUI = 0x2b3038, USE = 0x50545a, EBONITE = 0x1c1a19;
  const cercle = (cx, cy, r, n) => { const t = []; for (let k = 0; k < (n || 10); k++) { const a = (k / (n || 10)) * Math.PI * 2; t.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return t; };
  // une plaquette : la même forme que la poignée, un peu rentrée (vers son centre), posée des 2 côtés, avec sa vis
  function plaquettes(e, pts, k, matiere, demi, vis) {
    let cx = 0, cy = 0;
    for (const [x, y] of pts) (cx += x / pts.length), (cy += y / pts.length);
    const dedans = pts.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
    const mat = matiere === "ebonite" ? "poly" : matiere, coul = matiere === "ebonite" ? EBONITE : null;
    for (const s of [-1, 1]) {
      e.cote(dedans, 0.004, mat, coul, s * (demi + 0.0018), 0.0013, null, 2);
      for (const [x, y] of vis || [[cx, cy]]) {
        e.disque(0.0026, 0.0012, x, y, s * (demi + 0.0042), "metal", 0x8a8e94, 10);
        if (!e.leger) e.boite(0.0042, 0.0007, 0.0005, x, y, s * (demi + 0.0049), "poly", K.fente);
      }
    }
  }
  const CROSSES = {
    carree: (by) => [[0.0, by - 0.036], [-0.008, by - 0.07], [-0.012, by - 0.12], [-0.05, by - 0.124], [-0.057, by - 0.09], [-0.05, by - 0.04], [-0.046, by - 0.02], [-0.03, by - 0.034]],
    bec: (by) => [[0.0, by - 0.036], [-0.01, by - 0.07], [-0.012, by - 0.098], [-0.022, by - 0.114], [-0.042, by - 0.118], [-0.058, by - 0.108], [-0.057, by - 0.08], [-0.049, by - 0.04], [-0.046, by - 0.02], [-0.03, by - 0.034]],
    ronde: (by) => [[0.0, by - 0.036], [-0.008, by - 0.07], [-0.01, by - 0.1], [-0.018, by - 0.114], [-0.034, by - 0.119], [-0.05, by - 0.113], [-0.054, by - 0.088], [-0.048, by - 0.04], [-0.046, by - 0.02], [-0.03, by - 0.034]],
  };
  function revolver(e, p, o) {
    const by = 0.042, n = o.n || 6, R = o.rayon || 0.0205, rc = R * 0.56, ya = by - rc, L = o.canon, c = o.coul || BLEUI, x0 = -0.004, x1 = o.long || 0.05, xf = x1 + 0.009;
    // la CARCASSE et sa fenêtre pour le barillet
    e.cote([[-0.045, by - 0.03], [-0.048, by + 0.0], [-0.044, by + 0.012], [-0.034, by + 0.017], [xf, by + 0.015], [xf + 0.004, by + 0.008], [xf + 0.004, by - 0.016], [xf - 0.001, by - 0.036], [0.02, by - 0.038], [-0.008, by - 0.036], [-0.03, by - 0.034]],
      0.026, "metal", c, 0, 0.003, [rectRond(x0 - 0.002, ya - R - 0.0015, x1 + 0.002, ya + R + 0.0015, 0.004)], 2);
    // le BARILLET (il tourne d'un cran à chaque tir)
    e.dans("barillet", () => {
      if (e.beau) e.tour([[x0, R - 0.003], [x0 + 0.002, R], [x1 - 0.004, R], [x1, R - 0.003], [x1, 0.004]], ya, 0, "metal", c, 30);
      else e.tube(x0, x1, R, R, ya, 0, "metal", c, 14);
      for (let k = 0; k < n; k++) {
        const b = (k / n) * Math.PI * 2, f = b + Math.PI / n;
        if (!e.leger) e.boite((x1 - x0) * 0.5, 0.0045, 0.0052, x0 + (x1 - x0) * 0.58, ya + Math.cos(f) * (R - 0.0006), Math.sin(f) * (R - 0.0006), "metal", 0x1b1d21, f); // les cannelures
        if (e.beau) {
          e.tube(x1 - 0.0012, x1 + 0.0004, 0.0049, 0.0049, ya + Math.cos(b) * rc, Math.sin(b) * rc, "poly", K.fente, 10); // la chambre
          e.tube(x1 - 0.0022, x1 - 0.0008, 0.0038, 0.0038, ya + Math.cos(b) * rc, Math.sin(b) * rc, "metal", 0x8c8578, 10); // la balle en plomb
          e.boite(0.003, 0.0022, 0.003, x0 + 0.01, ya + Math.cos(b) * (R - 0.0004), Math.sin(b) * (R - 0.0004), "poly", K.fente, b); // l'encoche d'arrêt
        }
      }
      e.tube(x1, x1 + 0.0035, 0.0034, 0.0034, ya, 0, "metal", USE, 10); // le bout de l'axe
    });
    // le CANON (rond ou à pans), sa nervure, le guidon
    const xa = xf + 0.004, tip = xa + L;
    if (o.pans) e.tube(xa - 0.002, tip, 0.0082, 0.0074, by, 0, "metal", c, 8, Math.PI / 8);
    else e.tube(xa - 0.002, tip, 0.0078, 0.0071, by, 0, "metal", c, 18);
    if (o.nervure) e.boite(L, 0.0048, 0.0055, xa + L / 2, by + 0.0085, 0, "metal", c);
    e.tube(tip - 0.0005, tip + 0.0004, 0.0047, 0.0047, by, 0, "poly", K.fente, 10);
    e.cote([[tip - 0.012, by + 0.006], [tip - 0.002, by + 0.006], [tip - 0.003, by + 0.019], [tip - 0.008, by + 0.019]], 0.0028, "metal", c, 0, 0.0004);
    // l'OUVERTURE
    if (o.ouverture === "basculant") {
      if (!e.leger) e.boite(0.0012, 0.009, 0.027, -0.007, by + 0.012, 0, "poly", K.fente); // la jointure du canon qui bascule
      e.cote([[-0.035, by + 0.012], [-0.013, by + 0.013], [-0.01, by + 0.024], [-0.019, by + 0.027], [-0.03, by + 0.021]], 0.031, "metal", c, 0, 0.0015); // le verrou en étrier
      e.boite(0.014, 0.008, 0.004, -0.022, by + 0.003, -0.0145, "metal", c, 0, 0, 0.3); // son levier, à gauche
      e.disque(0.0038, 0.031, xf, by - 0.03, 0, "metal", USE, 12); // la charnière, devant en bas
    } else if (o.ouverture === "portillon") {
      e.cote([[-0.012, ya - 0.009], [-0.003, ya - 0.009], [-0.003, ya + 0.013], [-0.012, ya + 0.013]], 0.0022, "metal", USE, 0.0138, 0.0006); // le portillon (à droite)
      e.tube(xa, xa + L * 0.8, 0.0032, 0.0032, by - 0.0118, 0, "metal", USE, 10); // la baguette d'éjection
      e.boite(0.008, 0.008, 0.008, xa + L * 0.8, by - 0.009, 0, "metal", c);
    } else {
      e.boite(0.014, 0.008, 0.003, -0.018, by + 0.002, -0.0142, "metal", USE); // le poussoir qui libère le barillet (à gauche)
      if (!e.leger) for (let k = 0; k < 4; k++) e.boite(0.0008, 0.008, 0.0008, -0.023 + k * 0.003, by + 0.002, -0.0158, "poly", K.fente);
      e.tube(xa, xa + L * 0.82, 0.0034, 0.0034, by - 0.0118, 0, "metal", USE, 10); // la tige de l'éjecteur
      e.cote([[xa - 0.004, by - 0.006], [xa + L * 0.85, by - 0.006], [xa + L * 0.85, by - 0.016], [xa + L * 0.78, by - 0.017], [xa - 0.004, by - 0.016]], 0.009, "metal", c, 0, 0.0015); // son logement sous le canon
    }
    // le CHIEN et son ergot, le cran de mire dans le pont du dessus, la détente et le pontet
    e.cote([[-0.037, by + 0.008], [-0.03, by + 0.009], [-0.034, by + 0.025], [-0.045, by + 0.034], [-0.051, by + 0.032], [-0.043, by + 0.021]], 0.0072, "metal", c, 0, 0.0012, null, 2);
    if (!e.leger) for (let k = 0; k < 3; k++) e.boite(0.006, 0.0008, 0.0076, -0.047 + k * 0.0018, by + 0.031 - k * 0.003, 0, "poly", K.fente, 0, 0, 0.7);
    for (const s of [-1, 1]) e.boite(0.006, 0.004, 0.004, -0.03, by + 0.017, s * 0.0035, "metal", c);
    pontet(e, 0.0, 0.045, by - 0.036, c);
    // la CROSSE : l'armature en acier, les plaquettes, l'anneau de dragonne
    const cr = CROSSES[o.crosse || "carree"](by);
    e.cote(cr, 0.018, "metal", c, 0, 0.003, null, 2);
    const yb = Math.min(...cr.map((q) => q[1])), xb = cr.find((q) => q[1] === yb)[0];
    plaquettes(e, cr.filter((q) => q[1] < by - 0.03), 0.8, o.plaquettes || "bois", 0.009, [[-0.024, by - 0.06], [-0.03, by - 0.1]]);
    if (o.anneau !== false) e.anneau(0.0075, 0.0016, xb - 0.004, yb - 0.008, 0, "metal", USE);
    return { by, tip, ch: null, rail: null, dessous: null, garde: { centre: V3(-0.02, by - 0.11, -0.036), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: null, mireNative: { ligne: by + 0.019, arriere: -0.033, z: 0, nom: "cran et guidon" }, bout: { x: tip, y: by, r: 0.006 },
      munitionsVisibles: true, barillet: { y: ya, z: 0, n }, grip: { centre: V3(-0.028, by - 0.08), axe: V3(0.22, 1, 0).normalize() }, crosse: -0.06 };
  }
  // le PISTOLET AUTOMATIQUE : o.long (la culasse), o.haut, o.nez ("rond" ou "droit"), o.chien, o.penche (la pente de la
  // poignée), o.plaquettes, o.stries, o.fixe (magasin fixe), o.surete (une sûreté de poignée), o.coul
  function automatique(e, p, o) {
    const by = 0.03, c = o.coul || BLEUI, h = o.haut || 0.028, xa = -0.045, xb = xa + o.long, kp = o.penche || 0.3, y0 = 0.012, yt = y0 + h, gh = o.grip || 0.098;
    const av = (y) => 0.012 + kp * y, ar = (y) => -0.04 + kp * y; // le devant et le dos de la poignée à la hauteur y (y < 0)
    const cadre = [[xa - 0.002, y0 + 0.0005], [xb - 0.016, y0 + 0.0005], [xb - 0.014, 0.005], [xb - 0.02, 0.0], [0.068, 0.0], [0.066, -0.003], [0.014, -0.003], [0.012, 0.0], [av(-gh * 0.5) + 0.002, -gh * 0.5], [av(-gh), -gh], [av(-gh) - 0.006, -gh - 0.004], [ar(-gh) + 0.002, -gh - 0.004], [ar(-gh) - 0.002, -gh], [ar(-0.02), -0.02], [ar(0) - 0.002, -0.002], [xa - 0.004, 0.004]];
    e.cote(cadre, 0.02, "metal", c, 0, 0.003, null, 2);
    e.cote(rectRond(0.01, -0.028, 0.068, 0.001, 0.008), 0.009, "metal", c, 0, 0.0016, [rectRond(0.0145, -0.0235, 0.063, -0.002, 0.006)], 2);
    e.cote([[0.026, 0.0], [0.032, 0.0], [0.031, -0.008], [0.026, -0.018], [0.023, -0.016], [0.027, -0.008]], 0.005, "metal", USE, 0, 0.0008);
    const pq = [[av(-0.012) - 0.004, -0.012], [av(-gh + 0.008) - 0.004, -gh + 0.008], [ar(-gh + 0.008) + 0.004, -gh + 0.008], [ar(-0.012) + 0.003, -0.012]];
    plaquettes(e, pq, 0.96, o.plaquettes || "quadrille", 0.0105, [[(av(-0.05) + ar(-0.05)) / 2, -0.05]]);
    if (o.chien) {
      const hx = xa - 0.008, hy = yt - 0.004;
      e.cote([[xa + 0.003, y0 + 0.002], [xa + 0.004, yt - 0.008], [hx + 0.002, hy + 0.005], [hx - 0.005, hy + 0.002], [hx - 0.004, hy - 0.003], [xa - 0.003, y0 + 0.002]], 0.007, "metal", c, 0, 0.0012, null, 2);
    }
    if (o.surete) e.cote([[ar(-0.004), -0.004], [ar(-0.03), -0.03], [ar(-0.03) - 0.005, -0.028], [ar(-0.004) - 0.006, 0.0]], 0.015, "metal", c, 0, 0.0015);
    e.cote([[-0.034, 0.004], [-0.018, 0.005], [-0.014, 0.01], [-0.032, 0.01]], 0.0024, "metal", c, -0.0112, 0.0006); // la sûreté (à gauche)
    if (!e.leger) e.disque(0.0024, 0.0215, 0.03, 0.007, 0, "metal", USE, 10);
    e.dans("culasse", () => {
      if (e.beau) culasseStriee(e, xa, xb, y0, h, 0.011, c, o.stries || 7, xa + 0.007, 0.004, null, o.nez === "rond" ? 0.45 : 0.18);
      else e.cote([[xa, y0], [xa, yt], [xb, yt], [xb, y0]], 0.022, "metal", c, 0, 0.002);
      if (o.nez === "rond") e.tube(xb - 0.022, xb + 0.002, h * 0.42, h * 0.42, y0 + h * 0.48, 0, "metal", c, 18);
      e.boite(0.03, h * 0.38, 0.0018, (xa + xb) / 2 + 0.01, y0 + h * 0.6, 0.0108, "poly", K.fente); // la fenêtre d'éjection
      e.boite(0.006, 0.0035, 0.005, xb - 0.01, yt + 0.0016, 0, "metal", c); // le guidon
      for (const s of [-1, 1]) e.boite(0.006, 0.0035, 0.0035, xa + 0.006, yt + 0.0016, s * 0.0032, "metal", c); // le cran de mire
      e.tube(xb + 0.0015, xb + 0.0025, 0.0044, 0.0044, y0 + h * 0.48, 0, "poly", K.fente, 10);
    });
    let ch = null;
    if (!o.fixe) {
      e.dans("chargeur", () => e.boite(0.032, 0.005, 0.022, (av(-gh) + ar(-gh)) / 2 + 0.002, -gh - 0.0055, 0, "metal", c, 0, 0, Math.atan(kp)));
      ch = { x: (av(-gh) + ar(-gh)) / 2, y: -gh - 0.004 };
    } else if (!e.leger) e.boite(0.018, 0.004, 0.0105, xa + 0.04, yt + 0.0005, 0, "metal", USE); // la fente de la lame-chargeur, sur le dessus
    const ytip = y0 + h * 0.48;
    return { by: ytip, tip: xb + 0.0025, ch, rail: null, dessous: null, garde: { centre: V3(-0.022, -0.068, -0.034), axe: V3(0.6, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3((xa + xb) / 2 + 0.01, y0 + h * 0.6, 0.012), mireNative: { ligne: yt + 0.0032, arriere: xa + 0.002, z: 0, nom: "cran et guidon" },
      bout: { x: xb + 0.0025, y: ytip, r: 0.005 }, grip: { centre: V3(-0.028, -0.05), axe: V3(kp, 1, 0).normalize() }, crosse: -0.07, munitionsVisibles: !!o.fixe };
  }
  // le PISTOLET À GENOUILLÈRE : le canon et sa boîte reculent (« culasse »), la GENOUILLÈRE se plie vers le haut (« genou »)
  function genouillere(e, p, o) {
    const by = 0.042, c = o.coul || BLEUI, L = o.canon || 0.1;
    e.cote([[-0.052, by - 0.018], [-0.052, by + 0.0], [0.072, by + 0.0], [0.077, by - 0.006], [0.07, by - 0.018]], 0.024, "metal", c, 0, 0.003, null, 2); // la carcasse
    if (!e.leger) e.cote([[-0.034, by - 0.016], [0.04, by - 0.016], [0.044, by - 0.003], [-0.03, by - 0.003]], 0.0012, "metal", c, -0.0126, 0.0003); // la plaque de côté
    const poign = [[0.0, by - 0.017], [-0.02, by - 0.07], [-0.034, by - 0.118], [-0.07, by - 0.116], [-0.056, by - 0.07], [-0.042, by - 0.017]];
    e.cote(poign, 0.02, "metal", c, 0, 0.003, null, 2);
    plaquettes(e, poign, 0.84, "quadrille", 0.01, [[-0.036, by - 0.07]]);
    pontet(e, -0.004, 0.04, by - 0.016, c);
    e.cote([[-0.05, by - 0.008], [-0.04, by - 0.006], [-0.042, by + 0.0], [-0.052, by - 0.002]], 0.003, "metal", USE, -0.0128, 0.0006); // la sûreté
    e.dans("chargeur", () => e.disque(0.009, 0.006, -0.054, by - 0.12, 0, "bois", null, 14)); // le bouton en bois du chargeur
    e.dans("culasse", () => {
      e.cote([[-0.044, by], [0.074, by], [0.074, by + 0.015], [0.034, by + 0.016], [0.0, by + 0.016], [0.0, by + 0.005], [-0.044, by + 0.005]], 0.021, "metal", c, 0, 0.002); // la boîte du canon
      e.tube(0.074, 0.074 + L, 0.0078, 0.0068, by + 0.008, 0, "metal", c, 18);
      e.tube(0.074 + L - 0.0004, 0.0744 + L, 0.0042, 0.0042, by + 0.008, 0, "poly", K.fente, 10);
      e.cote([[0.064 + L, by + 0.014], [0.072 + L, by + 0.014], [0.071 + L, by + 0.022], [0.066 + L, by + 0.022]], 0.0026, "metal", c, 0, 0.0004); // le guidon
    });
    e.dans("genou", () => { // la genouillère : 2 bras et les 2 boutons moletés qu'on attrape pour armer
      e.boite(0.045, 0.011, 0.016, -0.022, by + 0.017, 0, "metal", USE);
      e.boite(0.03, 0.011, 0.017, 0.016, by + 0.017, 0, "metal", USE);
      for (const s of [-1, 1]) {
        e.disque(0.0088, 0.006, -0.036, by + 0.019, s * 0.0115, "metal", USE, 16);
        if (!e.leger) for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; e.boite(0.0016, 0.0016, 0.0062, -0.036 + Math.cos(a) * 0.0088, by + 0.019 + Math.sin(a) * 0.0088, s * 0.0115, "poly", 0x1a1b1d); }
      }
      for (const s of [-1, 1]) e.boite(0.005, 0.004, 0.004, -0.004, by + 0.0245, s * 0.003, "metal", USE); // le cran de mire
    });
    return { by: by + 0.008, tip: 0.0744 + L, ch: { x: -0.054, y: by - 0.115 }, rail: null, dessous: null, garde: { centre: V3(-0.03, -0.08, -0.036), axe: V3(0.6, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.022, 0.0), mireNative: { ligne: by + 0.0245, arriere: -0.008, z: 0, nom: "cran et guidon" }, bout: { x: 0.0744 + L, y: by + 0.008, r: 0.0065 },
      genou: { x: -0.048, y: by + 0.017, angle: 0.75 }, grip: { centre: V3(-0.036, -0.05), axe: V3(0.4, 1, 0).normalize() }, crosse: -0.07 };
  }
  // le PISTOLET À MAGASIN AVANT (« manche à balai ») : la boîte usinée, le MAGASIN DEVANT le pontet (10 cartouches, rempli
  // par le haut avec une lame-chargeur), le long canon, la hausse, la poignée ronde rainurée en bois, le chien à anneau
  function magasinAvant(e, p, o) {
    const by = 0.05, c = o.coul || BLEUI, L = o.canon || 0.14;
    e.cote([[-0.064, by - 0.03], [-0.064, by + 0.012], [-0.056, by + 0.016], [0.062, by + 0.016], [0.066, by + 0.008], [0.066, by - 0.03]], 0.026, "metal", c, 0, 0.003, null, 2); // la boîte
    if (!e.leger) for (const s of [-1, 1]) { // les flancs creusés de la boîte (des panneaux fraisés)
      e.cote(rectRond(-0.05, by - 0.024, 0.0, by + 0.008, 0.004), 0.0012, "metal", 0x22262c, s * 0.0131, 0.0003);
      e.cote(rectRond(0.008, by - 0.024, 0.056, by + 0.008, 0.004), 0.0012, "metal", 0x22262c, s * 0.0131, 0.0003);
    }
    // le MAGASIN, devant le pontet, et ses cannelures
    e.cote([[0.018, by - 0.03], [0.072, by - 0.03], [0.07, by - 0.072], [0.062, by - 0.08], [0.026, by - 0.08], [0.02, by - 0.072]], 0.024, "metal", c, 0, 0.003, null, 2);
    if (!e.leger) for (const s of [-1, 1]) for (const yy of [by - 0.044, by - 0.058]) e.boite(0.036, 0.004, 0.0015, 0.045, yy, s * 0.012, "metal", 0x1b1d21);
    e.dans("chargeur", () => e.boite(0.042, 0.004, 0.022, 0.044, by - 0.0815, 0, "metal", USE)); // la plaque de fond (elle s'enlève)
    pontet(e, -0.028, 0.016, by - 0.03, c);
    // la poignée ronde en bois, rainurée, et l'anneau
    const pg = [[-0.026, by - 0.03], [-0.034, by - 0.07], [-0.044, by - 0.118], [-0.058, by - 0.126], [-0.074, by - 0.12], [-0.072, by - 0.08], [-0.064, by - 0.03]];
    e.cote(pg, 0.026, "bois", null, 0, 0.009, null, 3);
    if (!e.leger) for (let k = 0; k < 11; k++) { const t = k / 10, yy = by - 0.04 - t * 0.072; e.boite(0.036, 0.0018, 0.028, -0.049 - t * 0.012, yy, 0, "bois", 0x3a2212, 0, 0, 0.18); }
    e.anneau(0.007, 0.0016, -0.066, by - 0.13, 0, "metal", USE);
    // le chien à anneau
    e.anneau(0.0075, 0.0022, -0.07, by + 0.018, 0, "metal", c);
    e.boite(0.006, 0.014, 0.006, -0.066, by + 0.008, 0, "metal", c);
    // le canon, la hausse (sur le devant de la boîte) et le guidon
    e.tube(0.066, 0.066 + L, 0.0085, 0.0068, by + 0.002, 0, "metal", c, 18);
    e.tube(0.0656 + L, 0.0664 + L, 0.0042, 0.0042, by + 0.002, 0, "poly", K.fente, 10);
    e.cote([[0.03, by + 0.016], [0.064, by + 0.016], [0.064, by + 0.024], [0.034, by + 0.02]], 0.012, "metal", c, 0, 0.0015); // la hausse
    e.cote([[0.054 + L, by + 0.008], [0.064 + L, by + 0.008], [0.063 + L, by + 0.0215], [0.058 + L, by + 0.0215]], 0.0026, "metal", c, 0, 0.0004);
    e.dans("culasse", () => { // la culasse et ses 2 « oreilles » pour l'armer (elle recule à chaque tir)
      e.boite(0.05, 0.008, 0.012, -0.03, by + 0.019, 0, "metal", USE);
      for (const s of [-1, 1]) e.boite(0.01, 0.01, 0.006, -0.054, by + 0.02, s * 0.008, "metal", USE);
      if (!e.leger) e.boite(0.03, 0.002, 0.008, 0.0, by + 0.0235, 0, "poly", K.fente); // le guide de la lame-chargeur
    });
    return { by: by + 0.002, tip: 0.0664 + L, ch: { x: 0.044, y: by - 0.08 }, rail: null, dessous: null, garde: { centre: V3(0.045, by - 0.09, -0.03), axe: V3(0.1, 1, 0.1).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(-0.02, by + 0.02, 0.0), mireNative: { ligne: by + 0.0225, arriere: 0.03, z: 0, nom: "hausse et guidon" }, bout: { x: 0.0664 + L, y: by + 0.002, r: 0.0065 },
      grip: { centre: V3(-0.05, by - 0.08), axe: V3(0.32, 1, 0).normalize() }, crosse: -0.08 };
  }
  Object.assign(Tanks.Armes1916, { revolver, automatique, genouillere, magasinAvant });

  // ------------------------------------------------------------------ LES PISTOLETS DE 1916 (et prêtés à 1944)
  A.ajouterFabrique("revolver92", (e, p) => revolver(e, p, { canon: 0.115, pans: true, ouverture: "lateral", crosse: "bec", plaquettes: "quadrille" })); // le revolver d'ordonnance (il s'ouvre sur le côté)
  A.ajouterFabrique("pistolet08", (e, p) => genouillere(e, p, { canon: 0.1 }));
  A.ajouterFabrique("hartwell6", (e, p) => revolver(e, p, { canon: 0.15, ouverture: "basculant", crosse: "bec", plaquettes: "ebonite", nervure: true, long: 0.044 }));
  A.ajouterFabrique("ostrel95", (e, p) => revolver(e, p, { canon: 0.112, pans: true, ouverture: "portillon", crosse: "ronde", plaquettes: "bois", n: 7, rayon: 0.0188, long: 0.054, coul: 0x30343a }));
  A.ajouterFabrique("brandt17", (e, p) => revolver(e, p, { canon: 0.14, ouverture: "lateral", crosse: "carree", plaquettes: "bois", rayon: 0.0218, coul: 0x2a2d31 }));
  A.ajouterFabrique("kress96", (e, p) => magasinAvant(e, p, { canon: 0.14 }));
  A.ajouterFabrique("marne10", (e, p) => automatique(e, p, { long: 0.15, haut: 0.026, nez: "rond", penche: 0.2, plaquettes: "ebonite", surete: true, grip: 0.082 }));
  A.ajouterFabrique("varnhahn12", (e, p) => automatique(e, p, { long: 0.2, haut: 0.027, chien: true, penche: 0.32, plaquettes: "bois", fixe: true, stries: 5 }));
  A.ajouterFabrique("colton11", "pistolet"); // (le 1911 de l'armurier moderne : déjà là en 1916)
})();
