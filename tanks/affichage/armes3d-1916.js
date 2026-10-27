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
// Chaque fabrique répond comme celles de l'armurier : où est le canon, le viseur, la poignée, la main gauche… Elle ne fait
// que dessiner (comme tout l'affichage).

window.Tanks = window.Tanks || {};

(function () {
  const A = Tanks.Armes3D, { K, V3, pontet, bout, lunette } = A.outils;
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

  // ------------------------------------------------------------------ LE REVOLVER 92
  A.ajouterFabrique("revolver92", (e, p) => {
    const by = 0.04, L = 0.115, Ac = 0x2a2c30;
    if (e.beau) {
      // ✍️ (armes réalistes : « Fais pareil pour les armes. ») la carcasse au dos arrondi, et le barillet aux bords chanfreinés
      // creusé de 6 cannelures (les sillons entre les chambres)
      e.cote([[0.0, 0.0], [-0.04, 0.0], [-0.047, 0.026], [-0.046, 0.05], [-0.036, 0.062], [0.0, 0.065], [0.07, 0.062], [0.074, 0.056], [0.074, 0.006], [0.06, -0.004], [0.02, -0.006]], 0.028, "metal", Ac, 0, 0.003, [[[-0.006, 0.015], [0.058, 0.015], [0.058, 0.052], [-0.006, 0.052]]], 2);
      e.tour([[-0.004, 0.0165], [-0.002, 0.0198], [0.052, 0.0198], [0.056, 0.0172]], by, 0, "metal", 0x34363a, 30);
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; e.boite(0.034, 0.0042, 0.003, 0.028, by + Math.sin(a) * 0.0192, Math.cos(a) * 0.0192, "metal", 0x1e2023, a); }
    } else {
      e.cote([[-0.04, 0.0], [-0.04, 0.06], [0.07, 0.06], [0.07, 0.004], [0.02, -0.006], [0.0, 0.0]], 0.028, "metal", Ac, 0, 0.003, [[[-0.006, 0.015], [0.058, 0.015], [0.058, 0.052], [-0.006, 0.052]]]);
      e.tube(-0.004, 0.056, 0.02, 0.02, by, 0, "metal", 0x34363a, 18); // le barillet
    }
    if (!e.leger) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; e.tube(-0.007, -0.004, 0.0045, 0.0045, by + Math.sin(a) * 0.011, Math.cos(a) * 0.011, "metal", LAITON, 8); }
    e.tube(0.07, 0.07 + L, 0.0085, 0.0075, by, 0, "metal", Ac, 8); // le canon octogonal
    e.boite(0.006, 0.01, 0.003, 0.068 + L, by + 0.012, 0, "metal", Ac);
    e.boite(0.012, 0.024, 0.008, -0.046, 0.056, 0, "metal", Ac, 0, 0, 0.6); // le chien
    e.cote([[0.0, 0.0], [-0.008, -0.04], [-0.016, -0.095], [-0.052, -0.098], [-0.054, -0.055], [-0.046, -0.01], [-0.04, 0.0]], 0.032, "bois", 0x5a3a20, 0, 0.007, null, 2);
    e.anneau(0.009, 0.0018, -0.04, -0.104, 0, "metal", Ac); // l'anneau de dragonne
    pontet(e, 0.002, 0.045, 0.002, Ac);
    return { by, tip: 0.07 + L, ch: null, rail: null, dessous: null, garde: { centre: V3(-0.02, -0.07, -0.036), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: null, mireNative: { ligne: by + 0.026, arriere: -0.03, z: 0, nom: "hausse et guidon" }, glissiere: { x: 0.03, y: 0.06 }, bout: { x: 0.07 + L, y: by, r: 0.007 },
      munitionsVisibles: true, grip: { centre: V3(-0.03, -0.05), axe: V3(0.25, 1, 0).normalize() }, crosse: -0.06 };
  });

  // ------------------------------------------------------------------ LE PISTOLET KRESS 08 (la genouillère)
  A.ajouterFabrique("pistolet08", (e, p) => {
    const by = 0.042, Ac = 0x2c2e31;
    // la carcasse ; (armes réalistes) dans la belle version, découpée avec son avant arrondi sous le canon
    if (e.beau) e.cote([[-0.04, by - 0.017], [-0.04, by + 0.009], [0.08, by + 0.009], [0.084, by + 0.002], [0.078, by - 0.008], [0.06, by - 0.017]], 0.024, "metal", Ac, 0, 0.003, null, 2);
    else e.boite(0.12, 0.026, 0.024, 0.02, by - 0.004, 0, "metal", Ac);
    e.tube(0.06, 0.16, 0.0085, 0.0085, by + 0.006, 0, "metal", Ac, 12); // le canon fin
    e.boite(0.006, 0.01, 0.003, 0.155, by + 0.017, 0, "metal", Ac);
    e.cote([[0.0, by - 0.016], [-0.02, by - 0.07], [-0.034, by - 0.12], [-0.068, by - 0.118], [-0.054, by - 0.07], [-0.04, by - 0.016]], 0.03, "bois", 0x5a3a20, 0, 0.006, null, 2); // la poignée, très penchée
    pontet(e, -0.004, 0.04, by - 0.014, Ac);
    e.dans("culasse", () => { // la GENOUILLÈRE : deux bras et deux boutons ronds sur le dessus
      e.boite(0.05, 0.014, 0.018, -0.005, by + 0.016, 0, "metal", ACIER);
      for (const z of [-0.012, 0.012]) e.disque(0.009, 0.006, -0.032, by + 0.016, z, "metal", ACIER, 12);
    });
    return { by, tip: 0.16, ch: { x: -0.035, y: by - 0.02 }, rail: null, dessous: null, garde: { centre: V3(-0.03, -0.08, -0.036), axe: V3(0.6, 1, 0.25).normalize(), sorte: "pistolet" },
      lampe: null, laser: null, ejection: V3(0.0, by + 0.02, 0.0), mireNative: { ligne: by + 0.026, arriere: -0.02, z: 0, nom: "cran et guidon" }, glissiere: { x: 0.0, y: by + 0.02 }, bout: { x: 0.16, y: by + 0.006, r: 0.0075 },
      grip: { centre: V3(-0.036, -0.05), axe: V3(0.4, 1, 0).normalize() }, crosse: -0.07 };
  });
})();
