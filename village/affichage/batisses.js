// 🏡 LES BÂTISSES : le dessinateur des maisons et des petits bonshommes
//
// Ce fichier sait dessiner chaque bâtiment (entrepôt, cabane du bûcheron, scierie…), les chantiers,
// les ouvriers, les porteurs (étape 3) et les jeunes pousses. Il est appelé par le peintre, au bon moment (du fond vers l'avant).
//
// Une maison en vue de biais, c'est une BOÎTE : un losange au sol, deux murs qu'on voit (gauche et
// droite), et un toit. Beaucoup de bâtiments utilisent cette boîte, avec d'autres couleurs et d'autres
// décorations. Étape 25 : ✍️ « on a du mal à les distinguer » : chaque métier a maintenant sa SILHOUETTE (sa forme
// de toit, ses tours, sa grue, sa colline…) : voir « l'architecte », plus bas.

window.Village = window.Village || {};

Village.Batisses = (function () {
  const TOUR = Math.PI * 2;
  const CONTOUR = "rgba(38, 30, 24, .72)"; // étape 32 : ✍️ « moins enfantin » : un trait plus fin et moins noir
  const C_ = Village.CONFIG;

  // Les couleurs et la taille de chaque bâtiment.
  //   a : demi-largeur du losange au sol (px) ; h : hauteur des murs ; toit : hauteur du toit.
  // Étape 17 : ✍️ « les bâtiments ne sont pas assez distincts ». Certains sont maintenant LONGS (a2 : la moitié
  //   de la longueur du mur de droite) : la scierie, la ferme, l'étable, la bergerie, le marché…
  // Étape 9 : chaque bâtiment a aussi sa MATIÈRE (mur : rondins, planches, pierre, enduit, colombage),
  // son toit (bardeaux, tuiles, paille, ardoise), ses fenêtres, sa cheminée et sa lanterne.
  const MODELES = {
    entrepot: { a: 27, h: 20, toit: 18, murG: "#d39a5e", murD: "#b07740", toitA: "#d9553b", toitB: "#b8432c", mur: "planches", toitSorte: "tuiles", fenetres: 2, cheminee: 0.3, lanterne: true },
    bucheron: { a: 19, h: 14, toit: 14, murG: "#a87443", murD: "#865a31", toitA: "#7a9a3a", toitB: "#5f7d2b", mur: "rondins", toitSorte: "bardeaux", fenetres: 1, cheminee: 0.7, toitForme: "appentis" },
    forestier: { a: 19, h: 14, toit: 15, murG: "#efdcb4", murD: "#cfb68a", toitA: "#4fb556", toitB: "#3a8e3e", mur: "colombage", toitSorte: "bardeaux", fenetres: 1, volets: "#3a8e3e", jardiniere: true },
    scierie: { a: 20, a2: 31, h: 15, toit: 15, murG: "#c48f5d", murD: "#a2703f", toitA: "#6f86b3", toitB: "#556b94", mur: "planches", toitSorte: "ardoise", fenetres: 1, toitForme: "appentis" },
    carriere: { a: 19, h: 13, toit: 30, murG: "#b5b5b0", murD: "#90908b", toitA: "#9a6a3c", toitB: "#7c522b", mur: "pierre", toitSorte: "bardeaux", fenetres: 1 },
    pecheur: { a: 18, h: 13, toit: 14, murG: "#e3c896", murD: "#c2a46f", toitA: "#3fa7b5", toitB: "#2d8592", mur: "planches", toitSorte: "bardeaux", fenetres: 1, lanterne: true, pilotis: 8 }, // étape 4 ; étape 25 : sur pilotis
    chasseur: { a: 18, h: 13, toit: 14, murG: "#8e6038", murD: "#6f4826", toitA: "#6f8a3a", toitB: "#56702c", mur: "rondins", toitSorte: "bardeaux", fenetres: 1, cheminee: 0.65 },
    geologue: { a: 18, h: 13, toit: 14, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#8a5ab0", toitB: "#6c428c", mur: "pierre", toitSorte: "ardoise", fenetres: 1, toitForme: "pavillon" }, // étape 5
    universite: { a: 22, a2: 32, h: 28, toit: 16, murG: "#e8e2d4", murD: "#c7bfae", toitA: "#3f6fc4", toitB: "#2f569c", mur: "pierre", toitSorte: "ardoise", fenetres: 2, lanterne: true, toitForme: "plat" }, // étape 7 ; étape 25 : un dôme
    mineCharbon: { a: 18, h: 12, toit: 10, murG: "#8a6a48", murD: "#6c5036", toitA: "#555a60", toitB: "#43474c", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, lanterne: true }, // étape 7
    // Étape 8
    hutte: { a: 15, h: 9, toit: 15, murG: "#b98a55", murD: "#97693b", toitA: "#d8b65a", toitB: "#b8963f", mur: "rondins", toitSorte: "paille", fenetres: 0, linge: true }, // un toit de paille
    maison: { a: 20, h: 16, toit: 15, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#c8503a", toitB: "#a43e2b", mur: "colombage", toitSorte: "tuiles", fenetres: 2, volets: "#3f7a4a", cheminee: 0.25, jardiniere: true, lanterne: true, linge: true },
    mineFer: { a: 18, h: 12, toit: 10, murG: "#8a6a48", murD: "#6c5036", toitA: "#9a5a3a", toitB: "#7c472c", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, lanterne: true },
    fonderie: { a: 20, a2: 28, h: 16, toit: 12, murG: "#a9a39a", murD: "#878177", toitA: "#5d4a3e", toitB: "#4a3a30", mur: "pierre", toitSorte: "ardoise", fenetres: 1, feu: true, toitForme: "voute" },
    forge: { a: 20, h: 14, toit: 13, murG: "#8b8f96", murD: "#6d7178", toitA: "#3f4a5a", toitB: "#2f3846", mur: "pierre", toitSorte: "ardoise", fenetres: 1, feu: true, toitForme: "appentis" },
    marche: { a: 20, a2: 34, h: 10, toit: 12, murG: "#d9b07a", murD: "#b88e5a", toitA: "#e8c64a", toitB: "#c9a636", mur: "planches", toitSorte: "bardeaux", fenetres: 0, lanterne: true },
    // Étape 11 : le bourg
    ferme: { a: 19, a2: 32, h: 13, toit: 15, murG: "#c8503a", murD: "#a43e2b", toitA: "#8a6a48", toitB: "#6c5036", mur: "planches", toitSorte: "bardeaux", fenetres: 0, toitForme: "mansarde", porteGrange: "#8a2e1e" }, // une grange rouge (étape 25 : avec son toit de grange et son silo)
    moulin: { a: 15, h: 26, toit: 12, murG: "#e8e2d4", murD: "#c7bfae", toitA: "#8a5a3a", toitB: "#6c442c", mur: "pierre", toitSorte: "bardeaux", fenetres: 1 },
    boulangerie: { a: 20, h: 15, toit: 14, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#c8503a", toitB: "#a43e2b", mur: "colombage", toitSorte: "tuiles", fenetres: 1, volets: "#a43e2b", cheminee: 0.7, lanterne: true, feu: true },
    mineOr: { a: 18, h: 12, toit: 10, murG: "#8a6a48", murD: "#6c5036", toitA: "#c9a636", toitB: "#a8892a", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, lanterne: true },
    macon: { a: 19, h: 13, toit: 14, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#c8503a", toitB: "#a43e2b", mur: "pierre", toitSorte: "tuiles", fenetres: 1 }, // étape 12
    orfevre: { a: 19, h: 16, toit: 14, murG: "#e8e2d4", murD: "#c7bfae", toitA: "#6b3fa0", toitB: "#52307c", mur: "pierre", toitSorte: "ardoise", fenetres: 2, volets: "#6b3fa0", lanterne: true },
    // Étape 15 : l'élevage. Chacun a sa couleur de toit, pour le reconnaître d'un coup d'œil.
    puits: { a: 16, h: 11, toit: 12, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#3f7ac4", toitB: "#2f5c9c", mur: "pierre", toitSorte: "ardoise", fenetres: 1 },
    faneur: { a: 19, h: 15, toit: 18, murG: "#c49a5a", murD: "#a27a3e", toitA: "#9a6a42", toitB: "#7a5232", mur: "planches", toitSorte: "bardeaux", fenetres: 0, toitForme: "mansarde" }, // étape 25 : un hangar ouvert
    etable: { a: 19, a2: 32, h: 13, toit: 19, murG: "#f1ede4", murD: "#d2cbbd", toitA: "#5f7d2b", toitB: "#4a6322", mur: "colombage", toitSorte: "bardeaux", fenetres: 1, volets: "#4a6322", toitForme: "mansarde", porteGrange: "#4a6322" },
    laiterie: { a: 19, h: 14, toit: 14, murG: "#f6f2e8", murD: "#d9d2c2", toitA: "#5fa8d9", toitB: "#4a8ab8", mur: "pierre", toitSorte: "tuiles", fenetres: 1, volets: "#4a8ab8", toitForme: "pavillon" },
    veterinaire: { a: 18, h: 14, toit: 14, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#4f9e3e", toitB: "#3a7a2e", mur: "colombage", toitSorte: "tuiles", fenetres: 1, volets: "#3a7a2e", lanterne: true, toitForme: "pavillon" },
    fromagerie: { a: 20, h: 15, toit: 14, murG: "#e8d9a8", murD: "#c9b884", toitA: "#c8503a", toitB: "#a43e2b", mur: "pierre", toitSorte: "tuiles", fenetres: 1, volets: "#e0a81e", toitForme: "voute" },
    cremerie: { a: 18, h: 14, toit: 14, murG: "#fbf6ee", murD: "#ddd5c6", toitA: "#d96aa0", toitB: "#b8508a", mur: "colombage", toitSorte: "tuiles", fenetres: 1, volets: "#d96aa0" },
    // Étape 16
    poulailler: { a: 15, h: 10, toit: 12, murG: "#d9a066", murD: "#b8834a", toitA: "#c8503a", toitB: "#a43e2b", mur: "planches", toitSorte: "bardeaux", fenetres: 0, pilotis: 7 },
    bergerie: { a: 19, a2: 30, h: 12, toit: 15, murG: "#c9c2b4", murD: "#a59d8e", toitA: "#d8b65a", toitB: "#b8963f", mur: "pierre", toitSorte: "paille", fenetres: 1 },
    porcherie: { a: 17, a2: 27, h: 11, toit: 13, murG: "#a87443", murD: "#865a31", toitA: "#d97a8a", toitB: "#b85a6a", mur: "rondins", toitSorte: "bardeaux", fenetres: 0, toitForme: "appentis" },
    tisserand: { a: 19, h: 15, toit: 14, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#7a5ab0", toitB: "#5c428c", mur: "colombage", toitSorte: "ardoise", fenetres: 2, volets: "#7a5ab0" },
    tailleur: { a: 16, h: 25, toit: 13, murG: "#e8e2d4", murD: "#c7bfae", toitA: "#3f8a8a", toitB: "#2f6a6a", mur: "pierre", toitSorte: "tuiles", fenetres: 1, volets: "#3f8a8a", lanterne: true },
    charcuterie: { a: 20, h: 14, toit: 14, murG: "#f1e3c4", murD: "#d2c09a", toitA: "#8a3a2a", toitB: "#6a2a1e", mur: "colombage", toitSorte: "tuiles", fenetres: 1, volets: "#8a3a2a", cheminee: 0.6 },
    // Étape 17 : l'entrepôt secondaire (long, avec un toit bleu)
    // Étape 18 : la maison bourgeoise (2 étages, en pierre, avec un toit d'ardoise)
    manoir: { a: 21, a2: 27, h: 26, toit: 16, murG: "#efe6d2", murD: "#cfc4ac", toitA: "#4a5a7a", toitB: "#38465f", mur: "pierre", toitSorte: "ardoise", fenetres: 2, volets: "#2f6a4a", cheminee: 0.3, jardiniere: true, lanterne: true, toitForme: "pavillon" },
    monument: { a: 20, a2: 26, h: 20, toit: 14, murG: "#f2ede2", murD: "#d4ccbc", toitA: "#3f6fc4", toitB: "#2f569c", mur: "pierre", toitSorte: "ardoise", fenetres: 2, lanterne: true }, // étape 31
    depot: { a: 22, a2: 32, h: 18, toit: 20, murG: "#c9a26a", murD: "#a8834a", toitA: "#3f6fc4", toitB: "#2f569c", mur: "planches", toitSorte: "tuiles", fenetres: 2, lanterne: true, toitForme: "mansarde" },
  };

  // Étape 32 : ✍️ « moins enfantin » : toutes les couleurs des modèles sont adoucies (moins vives, un peu plus sombres),
  // comme de vrais matériaux : tuiles, ardoise, bois, pierre.
  function adoucir(h) {
    if (typeof h !== "string" || h[0] !== "#" || h.length !== 7) return h;
    let [r, g, b] = [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
    const gris = (r + g + b) / 3, f = 0.62; // garde 62 % de la couleur, le reste en gris
    [r, g, b] = [r, g, b].map((v) => Math.round((gris + (v - gris) * f) * 0.93));
    return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("");
  }
  for (const m of Object.values(MODELES)) for (const k of ["murG", "murD", "toitA", "toitB", "volets"]) if (m[k]) m[k] = adoucir(m[k]);

  // Étape 9 : ce que le peintre nous dit au début de chaque image.
  //   fin : on est assez près pour dessiner les petits détails ; noirceur : 0 le jour, 1 à minuit ;
  //   lumieres : les points lumineux de l'image (fenêtres, lanternes…), que le peintre allume la nuit.
  const vue = { fin: true, noirceur: 0, hiver: false, t: 0, bonshommes: 0, dernierCompte: 0 };
  let lumieres = [];
  function debutImage(monde, t) {
    vue.fin = monde.camera.zoom >= C_.detail.zoomFin;
    vue.anim = monde.camera.zoom >= C_.detail.zoomAnimations; // étape 17 : ✍️ les animations se voient de plus loin
    vue.fer = Village.Recherches.faite(monde, "outilsFer"); // étape 17 : la recherche « Outils en fer » se VOIT
    vue.noirceur = monde.moment ? monde.moment.noirceur : 0;
    vue.hiver = !!(monde.saison && monde.saison.hiver);
    vue.t = t;
    vue.dernierCompte = vue.bonshommes; vue.bonshommes = 0; // étape 10 : combien de bonshommes à l'image précédente
    lumieres = [];
  }
  // Allumer une lumière (r : son rayon en px du monde ; force : de 0 à 1)
  // Étape 14 : quand on dessine un bâtiment « à la loupe » (plus gros), ses lumières doivent suivre la loupe.
  let loupe = null; // { x, y, s } : le centre et le grossissement en cours
  function lumiere(x, y, r, couleur, force) {
    if (vue.noirceur <= 0.05) return;
    if (loupe) { x = loupe.x + (x - loupe.x) * loupe.s; y = loupe.y + (y - loupe.y) * loupe.s; r *= loupe.s; }
    lumieres.push({ x, y, r, couleur, force: force === undefined ? 1 : force });
  }
  // Dessiner quelque chose « à la loupe » : grossi de s autour du point (x, y)
  function aLaLoupe(ctx, x, y, s, dessiner) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
    const avant = loupe; loupe = { x, y, s };
    try { dessiner(); } finally { loupe = avant; ctx.restore(); }
  }
  // Étape 24 : ✍️ presque tous les bâtiments prennent 2 × 2 cases : ils sont dessinés au MILIEU de leur bloc, bien plus gros
  // Étape 28 : ✍️ la taille varie (config.js : « tailles ») : un bloc de N × N cases est dessiné × (N + 0,3), son milieu
  // est (N − 1) demi-cases à droite de sa case. L'entrepôt (déjà large, avec sa cour) un peu moins.
  const Bt = () => Village.Batiments;
  const echelleTaille = (type, n) => (n <= 1 ? C_.detail.echelleBatiments : (n + 0.3) * C_.detail.echelleParCase * (type === "entrepot" || type === "depot" ? 0.83 : type === "universite" ? 0.88 : 1));
  const decalageTaille = (n) => ((n - 1) * C_.carte.largeurCase) / 2;

  // Un point sur un mur : u va de 0 (début du mur) à 1 (fin), v de 0 (le sol) à 1 (le haut du mur).
  const surMur = (P, Q, h, u, v) => [P[0] + (Q[0] - P[0]) * u, P[1] + (Q[1] - P[1]) * u - v * h];
  const entre = (P, Q, k) => [P[0] + (Q[0] - P[0]) * k, P[1] + (Q[1] - P[1]) * k];

  // La matière d'un mur (de P à Q au sol, de hauteur h), dessinée par-dessus sa couleur.
  function matiere(ctx, P, Q, h, sorte, coin) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] - h); ctx.lineTo(P[0], P[1] - h); ctx.closePath(); ctx.clip();
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(40, 25, 10, .32)";
    ctx.beginPath();
    if (sorte === "rondins") {
      for (let k = 1; k < 5; k++) { const A = surMur(P, Q, h, 0, k / 5), B = surMur(P, Q, h, 1, k / 5); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      // Le bout rond des rondins, au coin de la maison
      for (let k = 0; k < 5; k++) { const A = surMur(P, Q, h, coin, (k + 0.5) / 5); ctx.beginPath(); ctx.ellipse(A[0], A[1], 1.6, h / 11, 0, 0, TOUR); ctx.fillStyle = "#e0b47a"; ctx.fill(); ctx.strokeStyle = "rgba(60,35,10,.6)"; ctx.stroke(); }
    } else if (sorte === "planches") {
      for (let k = 1; k < 7; k++) { const A = surMur(P, Q, h, k / 7, 0), B = surMur(P, Q, h, k / 7, 1); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      ctx.fillStyle = "rgba(40,25,10,.4)"; // les clous
      for (let k = 0; k < 7; k++) for (const v of [0.15, 0.85]) { const A = surMur(P, Q, h, (k + 0.5) / 7, v); ctx.fillRect(A[0] - 0.4, A[1] - 0.4, 0.8, 0.8); }
    } else if (sorte === "pierre") {
      const rangs = 4;
      for (let k = 1; k < rangs; k++) { const A = surMur(P, Q, h, 0, k / rangs), B = surMur(P, Q, h, 1, k / rangs); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      for (let r = 0; r < rangs; r++) for (let k = 0; k < 5; k++) { const u = (k + (r % 2 ? 0.5 : 0)) / 5, A = surMur(P, Q, h, u, r / rangs), B = surMur(P, Q, h, u, (r + 1) / rangs); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.14)"; // quelques pierres plus claires
      for (let r = 0; r < rangs; r++) for (let k = (r * 3) % 4; k < 5; k += 3) { const A = surMur(P, Q, h, (k + 0.15 + (r % 2 ? 0.5 : 0)) / 5, (r + 0.25) / rangs), B = surMur(P, Q, h, (k + 0.85 + (r % 2 ? 0.5 : 0)) / 5, (r + 0.75) / rangs); ctx.fillRect(Math.min(A[0], B[0]), Math.min(A[1], B[1]), Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); }
    } else if (sorte === "verre") { // étape 25 : les vitres de la serre
      ctx.strokeStyle = "rgba(255, 255, 255, .8)"; ctx.lineWidth = 1.2;
      for (let k = 0; k <= 5; k++) { const A = surMur(P, Q, h, k / 5, 0), B = surMur(P, Q, h, k / 5, 1); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); }
      const A = surMur(P, Q, h, 0, 0.5), B = surMur(P, Q, h, 1, 0.5); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
      ctx.stroke();
    } else if (sorte === "colombage") {
      // Les poutres en bois d'une maison à colombages
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6;
      const ligne = (u1, v1, u2, v2) => { const A = surMur(P, Q, h, u1, v1), B = surMur(P, Q, h, u2, v2); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); };
      ligne(0, 0.06, 1, 0.06); ligne(0, 0.94, 1, 0.94); ligne(0, 0.5, 1, 0.5);
      for (const u of [0.04, 0.5, 0.96]) ligne(u, 0, u, 1);
      ligne(0.04, 0.5, 0.25, 0.94); ligne(0.96, 0.5, 0.75, 0.94);
      ctx.stroke();
    }
    // L'ombre au pied du mur (la lumière vient d'en haut)
    const A = surMur(P, Q, h, 0, 0.28), B = surMur(P, Q, h, 1, 0.28);
    ctx.fillStyle = "rgba(30, 20, 10, .13)";
    ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(A[0], A[1]); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Les rangées de tuiles (ou de bardeaux, d'ardoises, de paille) sur un pan de toit.
  // Le pan va du bas (A → B, le bord du toit) au haut (A2 → B2, le faîte).
  function tuiles(ctx, A, B, A2, B2, sorte) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(B2[0], B2[1]); ctx.lineTo(A2[0], A2[1]); ctx.closePath(); ctx.clip();
    const rangs = sorte === "paille" ? 6 : 5;
    ctx.strokeStyle = sorte === "paille" ? "rgba(120, 90, 30, .5)" : "rgba(40, 20, 10, .3)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 1; k < rangs; k++) {
      const P = entre(A, A2, k / rangs), Q = entre(B, B2, k / rangs);
      if (sorte === "paille") { // de la paille : des lignes qui ondulent
        for (let n = 0; n <= 8; n++) { const R = entre(P, Q, n / 8); n ? ctx.lineTo(R[0], R[1] + (n % 2 ? 1 : -0.5)) : ctx.moveTo(R[0], R[1]); }
      } else { ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); }
      // Les petits traits entre les tuiles, décalés d'un rang à l'autre
      if (sorte !== "paille") {
        const P0 = entre(A, A2, (k - 1) / rangs), Q0 = entre(B, B2, (k - 1) / rangs);
        const n = sorte === "tuiles" ? 7 : 6;
        for (let j = 0; j < n; j++) { const u = (j + (k % 2 ? 0.5 : 0)) / n, R1 = entre(P0, Q0, u), R2 = entre(P, Q, u); ctx.moveTo(R1[0], R1[1]); ctx.lineTo(R2[0], R2[1]); }
      }
    }
    ctx.stroke();
    if (sorte === "tuiles") { // des tuiles rondes : un reflet clair sur chaque rang
      ctx.strokeStyle = "rgba(255, 220, 190, .25)"; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let k = 0; k < rangs; k++) { const P = entre(A, A2, (k + 0.6) / rangs), Q = entre(B, B2, (k + 0.6) / rangs); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Une fenêtre sur un mur. La nuit, elle s'allume (une lumière jaune, et un halo).
  function fenetre(ctx, P, Q, h, u, volets) {
    const du = 0.085, v0 = 0.36, v1 = 0.78;
    const pts = [surMur(P, Q, h, u - du, v0), surMur(P, Q, h, u + du, v0), surMur(P, Q, h, u + du, v1), surMur(P, Q, h, u - du, v1)];
    if (volets) for (const s of [-1, 1]) {
      const a = u + s * du, b = u + s * (du + 0.07);
      forme(ctx, [surMur(P, Q, h, a, v0), surMur(P, Q, h, b, v0), surMur(P, Q, h, b, v1), surMur(P, Q, h, a, v1)], volets);
    }
    const nuit = vue.noirceur;
    forme(ctx, pts, nuit > 0.15 ? "#ffd866" : "#9fd3f0");
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1;
    const m1 = surMur(P, Q, h, u, v0), m2 = surMur(P, Q, h, u, v1), m3 = surMur(P, Q, h, u - du, (v0 + v1) / 2), m4 = surMur(P, Q, h, u + du, (v0 + v1) / 2);
    ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.moveTo(m3[0], m3[1]); ctx.lineTo(m4[0], m4[1]); ctx.stroke();
    if (nuit <= 0.15) { // un reflet du ciel
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); const r1 = surMur(P, Q, h, u - du * 0.6, v1 - 0.08), r2 = surMur(P, Q, h, u - du * 0.1, v1 - 0.2); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.stroke();
    }
    const c = surMur(P, Q, h, u, (v0 + v1) / 2);
    lumiere(c[0], c[1], 13, "jaune", 0.9);
  }

  // La boîte : (x, y) est le milieu du losange au sol. `murs` de 0 à 1 (pour un chantier qui monte).
  function boite(ctx, x, y, m, murs, avecToit) {
    const a = m.a, a2 = m.a2 || a, b = a / 2, h = m.h * murs;
    const G = [x - a, y], B = [x, y + b], D = [x + a2, y + b - a2 / 2], H = [x - a + a2, y - a2 / 2]; // étape 17 : a2, un bâtiment long
    const up = ([px, py], dh) => [px, py - dh];
    const fin = vue.fin;
    // Les 2 murs qu'on voit (étape 25 : un hangar « ouvert » n'en a pas)
    if (!m.ouvert) {
    forme(ctx, [G, B, up(B, h), up(G, h)], m.murG);
    forme(ctx, [B, D, up(D, h), up(B, h)], m.murD);
    }
    if (m.ouvert) { /* rien */ } else if (fin && m.mur) {
      // Étape 9 : la matière des murs, de près
      matiere(ctx, G, B, h, m.mur, 0);
      matiere(ctx, B, D, h, m.mur, 1);
      ctx.beginPath(); ctx.moveTo(G[0], G[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(D[0], D[1]); ctx.lineTo(D[0], D[1] - h); ctx.lineTo(B[0], B[1] - h); ctx.lineTo(G[0], G[1] - h); ctx.closePath(); contour(ctx, 2);
      ctx.beginPath(); ctx.moveTo(B[0], B[1]); ctx.lineTo(B[0], B[1] - h); contour(ctx, 1.5);
    } else if (m.mur === "rondins" || m.mur === "pierre") {
      // De loin : quelques traits suffisent
      ctx.strokeStyle = "rgba(40, 25, 10, .35)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 1; k < 4; k++) {
        const dh = (h * k) / 4;
        ctx.moveTo(G[0], G[1] - dh); ctx.lineTo(B[0], B[1] - dh); ctx.lineTo(D[0], D[1] - dh);
      }
      ctx.stroke();
    }
    if (m.socle) { // étape 23 : le socle en pierre d'un bâtiment amélioré
      const hs = Math.min(5, h * 0.22);
      forme(ctx, [G, B, up(B, hs), up(G, hs)], "#a39d92");
      forme(ctx, [B, D, up(D, hs), up(B, hs)], "#857f75");
      if (fin) { ctx.strokeStyle = "rgba(40, 30, 20, .35)"; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 1; k < 6; k++) { const A = entre(G, B, k / 6), Q = entre(B, D, k / 6); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], A[1] - hs); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] - hs); } ctx.stroke(); }
    }
    if (!avecToit) {
      // Pas de toit (chantier) : on voit le haut des murs.
      forme(ctx, [up(G, h), up(B, h), up(D, h), up(H, h)], "rgba(120, 85, 50, .6)");
      return;
    }
    // Les fenêtres, sur le mur de droite
    if (murs >= 1 && m.fenetres) {
      const places = m.fenetres === 1 ? [0.55] : [0.3, 0.72];
      if (fin) for (const u of places) fenetre(ctx, B, D, h, u, m.volets);
      else for (const u of places) { const c = surMur(B, D, h, u, 0.57); ctx.fillStyle = vue.noirceur > 0.15 ? "#ffd866" : "#7fb3d0"; ctx.fillRect(c[0] - 2.5, c[1] - 3, 5, 6); lumiere(c[0], c[1], 11, "jaune", 0.8); }
      if (fin && m.jardiniere) { // une jardinière de fleurs sous la première fenêtre
        const u = places[0], p1 = surMur(B, D, h, u - 0.1, 0.3), p2 = surMur(B, D, h, u + 0.1, 0.3);
        forme(ctx, [p1, p2, [p2[0], p2[1] + 2.5], [p1[0], p1[1] + 2.5]], "#9a6a3c");
        if (!vue.hiver) for (let k = 0; k < 4; k++) { const f = entre(p1, p2, (k + 0.5) / 4); ctx.fillStyle = ["#e8402e", "#ffcf2e", "#ff7ab6", "#ffffff"][k]; ctx.beginPath(); ctx.arc(f[0], f[1] - 1, 1.3, 0, TOUR); ctx.fill(); }
      }
    }
    // Le toit à deux pentes : le faîte (la ligne du haut) va du milieu du mur gauche-haut au milieu du mur bas-droite.
    const deb = 3; // le toit dépasse un peu des murs
    const Gt = [G[0] - deb, G[1] - h + 1], Bt = [B[0], B[1] - h + deb], Dt = [D[0] + deb, D[1] - h + 1], Ht = [H[0], H[1] - h - deb];
    // Étape 25 : les autres formes de toit (pavillon, grange, appentis, voûte, plat)
    if (m.toitForme) { const s = toitVariante(ctx, m, x, y, G, B, D, H, h, Gt, Bt, Dt, Ht); if (m.girouette && s) girouette(ctx, s); return s; }
    const F1 = [(Gt[0] + Ht[0]) / 2, (Gt[1] + Ht[1]) / 2 - m.toit];
    const F2 = [(Bt[0] + Dt[0]) / 2, (Bt[1] + Dt[1]) / 2 - m.toit];
    // Le pignon (le triangle de mur sous le toit, côté droit)
    forme(ctx, [up(B, h), up(D, h), [F2[0], F2[1] + 3]], m.murD);
    forme(ctx, [Ht, Dt, F2, F1], m.toitB); // la pente du fond
    // Étape 9 : la cheminée sort de la pente du fond (elle est dessinée avant la pente de devant)
    if (m.cheminee) {
      const pied = entre(F1, F2, m.cheminee), base = [pied[0] + 4, pied[1] + 1];
      forme(ctx, [[base[0] - 3, base[1]], [base[0] + 3, base[1] + 1.5], [base[0] + 3, base[1] - 12], [base[0] - 3, base[1] - 13.5]], "#9a5a3c");
      forme(ctx, [[base[0] - 4, base[1] - 13], [base[0] + 4, base[1] - 11], [base[0] + 4, base[1] - 13.5], [base[0] - 4, base[1] - 15.5]], "#7a4a30");
      m.fumeeX = base[0] - x; m.fumeeY = base[1] - 17 - y; // pour la fumée (dessinée plus tard)
    }
    forme(ctx, [Gt, F1, F2, Bt], m.toitA); // la pente de devant
    if (fin && m.toitSorte) { tuiles(ctx, Gt, Bt, F1, F2, m.toitSorte); tuiles(ctx, Dt, Ht, F2, F1, m.toitSorte); }
    // ❄️ En hiver, de la neige sur le toit
    if (vue.hiver) {
      forme(ctx, [F1, F2, entre(F2, Bt, 0.45), entre(F1, Gt, 0.45)], "#f4f8ff");
      ctx.fillStyle = "#f4f8ff"; for (let k = 0; k < 4; k++) { const p = entre(entre(F1, Gt, 0.45), entre(F2, Bt, 0.45), (k + 0.5) / 4); ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, TOUR); ctx.fill(); }
    }
    // Un trait clair sur le faîte
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(F1[0] + 2, F1[1] + 2); ctx.lineTo(F2[0] - 2, F2[1] + 2); ctx.stroke();
    if (m.girouette) girouette(ctx, entre(F1, F2, 0.5));
    return entre(F1, F2, 0.5); // étape 25 : le point le plus haut du toit
  }
  function girouette(ctx, g) { // étape 23 : la girouette dorée d'un bâtiment au niveau 2, qui tourne au vent
    const an = Math.sin(vue.t * 0.7) * 0.9;
    ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(g[0], g[1]); ctx.lineTo(g[0], g[1] - 12); ctx.stroke();
    ctx.save(); ctx.translate(g[0], g[1] - 11); ctx.scale(Math.cos(an), 1);
    forme(ctx, [[-6, 0], [4, -1.6], [6, 0], [4, 1.6]], "#e8b830"); ctx.restore();
    rond(ctx, g[0], g[1] - 12, 1.3, "#e8b830");
  }

  // Étape 5 : un beau rondin, avec son écorce et les cernes du bois au bout, un peu penché.
  function rondin(ctx, x, y, penche) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-penche);
    ctx.beginPath(); ctx.moveTo(-9, -2.8); ctx.lineTo(8, -2.8); ctx.lineTo(8, 2.8); ctx.lineTo(-9, 2.8); ctx.closePath();
    ctx.fillStyle = "#8f5e2e"; ctx.fill(); contour(ctx, 1.2);
    ctx.strokeStyle = "rgba(50, 30, 10, .45)"; ctx.lineWidth = 0.8; // l'écorce
    ctx.beginPath(); ctx.moveTo(-7, -1); ctx.lineTo(-1, -1.2); ctx.moveTo(1, 1); ctx.lineTo(6, 0.8); ctx.moveTo(-5, 1.4); ctx.lineTo(-2, 1.5); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-9, 0, 1.4, 2.8, 0, 0, TOUR); ctx.fillStyle = "#c9955a"; ctx.fill(); contour(ctx, 1);
    ctx.beginPath(); ctx.ellipse(8, 0, 1.6, 2.8, 0, 0, TOUR); ctx.fillStyle = "#e6be85"; ctx.fill(); contour(ctx, 1.1);
    ctx.strokeStyle = "rgba(140, 90, 40, .8)"; ctx.lineWidth = 0.6; // les cernes
    ctx.beginPath(); ctx.ellipse(8, 0, 0.8, 1.6, 0, 0, TOUR); ctx.stroke();
    ctx.restore();
  }

  // Étape 6 : ✍️ une vraie planche : longue, fine et plate, posée en biais sur le sol (comme les cases),
  // avec le dessus clair, la tranche plus foncée, et les lignes du bois.
  function planche(ctx, x, y, longueur) {
    const L2 = (longueur || 26) / 2, e = 1.6, l = 3; // demi-longueur, épaisseur, demi-largeur
    const ax = x - L2 * 0.9, ay = y - L2 * 0.45, bx = x + L2 * 0.9, by = y + L2 * 0.45;
    const dessus = [[ax - l * 0.9, ay + l * 0.45], [ax + l * 0.9, ay - l * 0.45], [bx + l * 0.9, by - l * 0.45], [bx - l * 0.9, by + l * 0.45]];
    // Un trait fin et brun (pas noir) : sinon, une pile de planches ressemble à un bloc sombre.
    const face = (points, couleur) => {
      ctx.beginPath(); points.forEach(([px, py], n) => (n ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
      ctx.fillStyle = couleur; ctx.fill(); ctx.strokeStyle = "#7a4e22"; ctx.lineWidth = 0.8; ctx.lineJoin = "round"; ctx.stroke();
    };
    face([dessus[3], dessus[2], [dessus[2][0], dessus[2][1] + e], [dessus[3][0], dessus[3][1] + e]], "#c9965a"); // la tranche longue
    face([dessus[0], dessus[3], [dessus[3][0], dessus[3][1] + e], [dessus[0][0], dessus[0][1] + e]], "#d9a866"); // le bout
    face(dessus, "#f0cf98"); // le dessus, clair
    // Les veines du bois, dans le sens de la longueur
    ctx.strokeStyle = "rgba(170, 115, 60, .6)"; ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(ax + 1, ay - 0.6); ctx.quadraticCurveTo(x, y - 0.2, bx - 2, by - 1.2);
    ctx.moveTo(ax + 3, ay + 0.8); ctx.quadraticCurveTo(x + 1, y + 1.3, bx - 4, by + 0.4);
    ctx.stroke();
    // Un petit nœud du bois
    ctx.beginPath(); ctx.ellipse(x - 2, y - 0.6, 1, 0.5, 0.45, 0, TOUR); ctx.stroke();
  }

  // Étape 14 : ✍️ les minerais en PÉPITES. Une pépite, c'est un caillou à facettes : une face claire (au soleil),
  // une face foncée (à l'ombre), et un petit éclat qui brille. On en met 3 ensemble, un peu de travers.
  function facettes(ctx, x, y, r, clair, moyen, fonce, eclat) {
    const p = [[x - r, y + r * 0.3], [x - r * 0.55, y - r * 0.8], [x + r * 0.35, y - r], [x + r, y - r * 0.2], [x + r * 0.6, y + r * 0.7], [x - r * 0.35, y + r * 0.8]];
    forme(ctx, p, moyen);
    ctx.fillStyle = clair; ctx.beginPath(); ctx.moveTo(p[1][0], p[1][1]); ctx.lineTo(p[2][0], p[2][1]); ctx.lineTo(x + r * 0.1, y - r * 0.1); ctx.lineTo(p[0][0], p[0][1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = fonce; ctx.beginPath(); ctx.moveTo(x + r * 0.1, y - r * 0.1); ctx.lineTo(p[3][0], p[3][1]); ctx.lineTo(p[4][0], p[4][1]); ctx.lineTo(p[5][0], p[5][1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.9; ctx.beginPath(); p.forEach(([px, py], n) => (n ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.stroke();
    if (eclat) { ctx.fillStyle = eclat; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.45, r * 0.22, 0, TOUR); ctx.fill(); }
  }
  const tas = (ctx, x, y, f) => { f(ctx, x - 2.4, y + 0.8, 2.4); f(ctx, x + 2.2, y + 1, 2.2); f(ctx, x, y - 1.6, 2.6); };
  // Le charbon : des pépites noires, avec des reflets bleutés
  function charbon(ctx, x, y) { tas(ctx, x, y, (c, a, b, r) => facettes(c, a, b, r, "#5a5f6e", "#2e3036", "#141518", "rgba(190, 210, 255, .8)")); }
  // Le minerai de fer : des pépites brun-rouge, avec des taches de rouille
  function minerai(ctx, x, y) { tas(ctx, x, y, (c, a, b, r) => { facettes(c, a, b, r, "#b8785a", "#8e5a3c", "#5e3a26", null); c.fillStyle = "#e09a5a"; c.beginPath(); c.arc(a + r * 0.3, b + r * 0.2, r * 0.18, 0, TOUR); c.fill(); }); }
  // Étape 8 : un lingot (une barre de fer en trapèze, brillante)
  function lingot(ctx, x, y) {
    forme(ctx, [[x - 6, y + 2], [x + 4, y + 2], [x + 6, y - 1], [x - 4, y - 1]], "#9aa3ad");
    forme(ctx, [[x - 4, y - 1], [x + 6, y - 1], [x + 4.5, y - 3.5], [x - 2.5, y - 3.5]], "#c9d1da");
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 1.5, y - 2.4); ctx.lineTo(x + 3, y - 2.4); ctx.stroke();
  }
  // Étape 8 : un outil (un marteau : un manche en bois et une tête en fer)
  function outil(ctx, x, y) {
    ctx.strokeStyle = "#7a4e22"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + 2, y - 2); ctx.stroke();
    forme(ctx, [[x - 0.5, y - 5], [x + 2.5, y - 6.5], [x + 6, y - 1.5], [x + 3, y]], "#8b9099");
  }

  // Un poisson ou un morceau de viande (pour les piles et pour ce qu'on porte)
  function poisson(ctx, x, y) {
    ctx.beginPath(); ctx.ellipse(x, y, 4.5, 2.4, 0, 0, TOUR); ctx.fillStyle = "#7fb8e0"; ctx.fill(); contour(ctx, 1);
    forme(ctx, [[x + 4, y], [x + 7.5, y - 2.5], [x + 7.5, y + 2.5]], "#5a9cc8");
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(x - 2.5, y - 0.5, 0.7, 0, TOUR); ctx.fill();
  }
  // Étape 17 : ✍️ la viande ne se reconnaissait pas : c'est maintenant un gros pilon, avec son os blanc
  function viande(ctx, x, y) {
    ctx.strokeStyle = "#f6efe0"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x + 1, y - 0.5); ctx.lineTo(x + 5, y - 3.6); ctx.stroke();
    for (const [ox, oy] of [[5.2, -4.8], [6.4, -3.4]]) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 1.2, 0, TOUR); ctx.fillStyle = "#f6efe0"; ctx.fill(); contour(ctx, 0.7); }
    ctx.beginPath(); ctx.moveTo(x + 2, y - 1.4); ctx.quadraticCurveTo(x - 1, y - 4.4, x - 4, y - 1.6); ctx.quadraticCurveTo(x - 5.6, y + 2.4, x - 2, y + 3.6); ctx.quadraticCurveTo(x + 1.6, y + 3.4, x + 2, y - 1.4); ctx.closePath();
    ctx.fillStyle = "#a8432a"; ctx.fill(); contour(ctx, 0.9);
    ctx.fillStyle = "rgba(255, 190, 150, .55)"; ctx.beginPath(); ctx.ellipse(x - 2.4, y - 0.8, 1.4, 0.8, -0.5, 0, TOUR); ctx.fill();
  }

  let trait = 0.55; // étape 14 : pour les icônes grossies, des traits plus fins (sinon tout devient noir) ; étape 32 : 0,55 partout (1 avant)
  function contour(ctx, largeur) {
    ctx.strokeStyle = CONTOUR;
    ctx.lineWidth = (largeur || 2) * trait;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function forme(ctx, points, couleur) {
    ctx.beginPath();
    points.forEach(([x, y], n) => (n ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = couleur;
    ctx.fill();
    contour(ctx);
  }

  // La porte, sur le mur de gauche
  function porte(ctx, x, y, m, couleur) {
    const a = m.a, b = a / 2;
    const px = x - a * 0.45, py = y + b * 0.55;
    if (vue.fin) { // Étape 9 : une marche en pierre devant la porte, et un cadre plus clair
      forme(ctx, [[px - 6, py - 1], [px + 1, py + 4.5], [px + 6, py + 2], [px - 1, py - 3.5]], "#b9b2a6");
      forme(ctx, [[px - 5, py - 2.5], [px + 5, py + 2.5], [px + 5, py - 11.5], [px - 5, py - 16.5]], "#e6cfa2");
    }
    ctx.beginPath();
    ctx.moveTo(px - 4, py - 2); ctx.lineTo(px + 4, py + 2); ctx.lineTo(px + 4, py - 10); ctx.lineTo(px - 4, py - 14); ctx.closePath();
    ctx.fillStyle = couleur || "#5a3818"; ctx.fill(); contour(ctx, 1.5);
    if (vue.fin) {
      ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - 12); ctx.stroke(); // les planches de la porte
      ctx.fillStyle = "#e8c64a"; ctx.beginPath(); ctx.arc(px + 2.3, py - 5, 0.9, 0, TOUR); ctx.fill(); // la poignée
    }
    if (m.lanterne) { // Étape 9 : une lanterne accrochée à côté de la porte, allumée la nuit
      const lx = px + 7, ly = py - 12;
      ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx - 2, ly - 3); ctx.lineTo(lx + 1, ly - 3); ctx.lineTo(lx + 1, ly - 1); ctx.stroke();
      forme(ctx, [[lx - 1.5, ly - 1], [lx + 3.5, ly - 1], [lx + 3, ly + 5], [lx - 1, ly + 5]], vue.noirceur > 0.15 ? "#ffd04a" : "#6b6050");
      lumiere(lx + 1, ly + 2, 22, "orange", 1);
    }
  }

  // Étape 9 : une caisse en bois (pour la cour de l'entrepôt), avec ce qu'elle contient sur le dessus
  function caisse(ctx, x, y, contenu) {
    forme(ctx, [[x - 6, y], [x, y + 3], [x + 6, y], [x + 6, y - 6], [x, y - 3], [x - 6, y - 6]], "#c98b4f");
    forme(ctx, [[x - 6, y - 6], [x, y - 3], [x + 6, y - 6], [x, y - 9]], "#ddaa6a");
    ctx.beginPath(); ctx.moveTo(x, y + 3); ctx.lineTo(x, y - 3); contour(ctx, 1);
    if (contenu === "poissons") { poisson(ctx, x - 2, y - 7); poisson(ctx, x + 1.5, y - 6); }
    else if (contenu === "viande") { viande(ctx, x - 1, y - 7); viande(ctx, x + 2, y - 6); }
    else if (contenu === "charbon") { charbon(ctx, x - 2, y - 7); charbon(ctx, x + 2, y - 6.5); }
    else if (contenu === "fer") { minerai(ctx, x - 2, y - 7); minerai(ctx, x + 2, y - 6.5); }
    else if (contenu === "outils") { outil(ctx, x, y - 7); }
    else if (contenu === "lingots") { lingot(ctx, x, y - 6.5); lingot(ctx, x + 1, y - 8.5); }
    else if (contenu) { objetPorte(ctx, contenu, x - 1.5, y - 7); objetPorte(ctx, contenu, x + 2, y - 6.5); } // étape 11
  }
  // Étape 9 : la cour de l'entrepôt montre le stock (plus il y en a, plus les piles sont hautes)
  function cour(ctx, x, y, stock) {
    const n = (r) => Math.min(9, Math.ceil(Math.sqrt(Math.max(0, stock[r] || 0))));
    pile(ctx, x - 30, y + 2, "rondin", n("troncs"));
    pile(ctx, x - 20, y + 13, "pierre", Math.min(6, n("pierres")));
    pile(ctx, x + 24, y + 4, "planche", Math.min(7, n("planches")));
    const caisses = ["pain", "poissons", "viande", "charbon", "fer", "lingots", "outils", "or", "bijoux"].filter((r) => stock[r] > 0).slice(0, 3);
    caisses.forEach((r, k) => caisse(ctx, x + 6 + k * 9, y + 15 - k * 3.5, r));
  }

  // Étape 11 : le silo de la réserve, derrière l'entrepôt. Plus la réserve est grande, plus il est haut et large.
  function silo(ctx, x, y, niveau) {
    const r = 6 + Math.min(6, niveau - 1) * 1.2, h = 16 + Math.min(10, niveau - 1) * 5;
    ctx.fillStyle = "rgba(20, 40, 10, .2)"; ctx.beginPath(); ctx.ellipse(x + 3, y + 2, r * 1.3, r * 0.6, 0, 0, TOUR); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r, y - h); ctx.ellipse(x, y - h, r, r * 0.45, 0, Math.PI, 0); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI); ctx.closePath();
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, "#d9d2c3"); g.addColorStop(0.45, "#f3eee4"); g.addColorStop(1, "#a9a090");
    ctx.fillStyle = g; ctx.fill(); contour(ctx, 1.5);
    if (vue.fin) { ctx.strokeStyle = "rgba(60,40,20,.25)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.ellipse(x, y - (h * k) / 4, r, r * 0.45, 0, 0, Math.PI); } ctx.stroke(); }
    forme(ctx, [[x - r - 1.5, y - h], [x, y - h - r * 1.1], [x + r + 1.5, y - h]], "#b8432c"); // le toit pointu
    ctx.fillStyle = "#3b2614"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.fillText(String(niveau), x, y - h * 0.45); ctx.textAlign = "left"; // le numéro du niveau
  }

  // Étape 11 : la ferme et ses champs de blé (verts au printemps, dorés en été et en automne, rien l'hiver)
  function champs(ctx, x, y, t) {
    const s = Village.monde && Village.monde.saison ? Village.monde.saison.numero : 1;
    const couleur = ["#7cc24a", "#e8c64a", "#d9a640", "#e8eef5"][s];
    for (const [dx, dy] of [[-30, 6], [24, 10]]) {
      forme(ctx, [[x + dx - 12, y + dy], [x + dx, y + dy + 6], [x + dx + 12, y + dy], [x + dx, y + dy - 6]], s === 3 ? "#e8eef5" : "#9a6a3c");
      if (s === 3 || !vue.fin) continue;
      ctx.strokeStyle = couleur; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.beginPath();
      for (let k = -2; k <= 2; k++) for (let j = -2; j <= 2; j++) {
        const px = x + dx + k * 4.5 + j * 1.5 - 1.5, py = y + dy + j * 2.2 - k * 0.6, vent = Math.sin(t * 2 + k + j) * 0.8;
        if (Math.abs(px - (x + dx)) / 12 + Math.abs(py - (y + dy)) / 6 > 0.85) continue;
        ctx.moveTo(px, py); ctx.lineTo(px + vent, py - 4);
      }
      ctx.stroke();
    }
  }

  // Étape 9 : du linge qui sèche sur une corde, et qui bouge dans le vent
  function linge(ctx, x, y, t) {
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 14); ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16, y - 6); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.quadraticCurveTo(x + 8, y - 6, x + 16, y - 5); ctx.stroke();
    ["#e8402e", "#ffffff", "#3e7bff"].forEach((c, k) => {
      const cx = x + 3 + k * 4.5, cy = y - 11.5 + k * 2.6, vent = Math.sin(t * 2.4 + k) * 1.2;
      forme(ctx, [[cx - 1.6, cy], [cx + 1.6, cy + 0.8], [cx + 1.6 + vent, cy + 5.8], [cx - 1.6 + vent, cy + 5]], c);
    });
  }

  // Étape 9 : un âne (de profil, tourné vers la droite). Il broute quand il attend.
  function ane(ctx, x, y, t, marche) {
    const pas = marche ? Math.sin(t * 8) : 0, poil = "#8b7a6b", clair = "#d8cfc4", fonce = "#5e5148";
    ctx.strokeStyle = fonce; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); for (const [dx, s] of [[-6, 1], [-3.5, -1], [4.5, -1], [7, 1]]) { ctx.moveTo(x + dx, y - 7); ctx.lineTo(x + dx + pas * 1.8 * s, y); } ctx.stroke();
    ctx.fillStyle = "#2b2420"; for (const [dx, s] of [[-6, 1], [-3.5, -1], [4.5, -1], [7, 1]]) ctx.fillRect(x + dx + pas * 1.8 * s - 1.2, y - 1, 2.4, 1.4); // les sabots
    ctx.beginPath(); ctx.ellipse(x, y - 10, 9, 4.8, 0, 0, TOUR); ctx.fillStyle = poil; ctx.fill(); contour(ctx, 1.3);
    ctx.beginPath(); ctx.ellipse(x + 0.5, y - 8, 5.5, 2, 0, 0, TOUR); ctx.fillStyle = clair; ctx.fill(); // le ventre clair
    const tete = marche ? Math.sin(t * 8) * 0.6 : Math.max(0, Math.sin(t * 1.5)) * 6; // il baisse la tête pour brouter
    // Le cou, puis la tête allongée avec son museau clair
    forme(ctx, [[x + 6, y - 13], [x + 10, y - 19 + tete], [x + 13, y - 17 + tete], [x + 9, y - 9]], poil);
    ctx.beginPath(); ctx.ellipse(x + 13.5, y - 17 + tete, 4.6, 2.6, 0.45, 0, TOUR); ctx.fillStyle = poil; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(x + 16.5, y - 15.2 + tete, 2, 1.7, 0.45, 0, TOUR); ctx.fillStyle = clair; ctx.fill(); contour(ctx, 1);
    forme(ctx, [[x + 10.5, y - 19 + tete], [x + 8.5, y - 27 + tete], [x + 12.3, y - 19.5 + tete]], poil); // les grandes oreilles
    forme(ctx, [[x + 12.5, y - 19.5 + tete], [x + 13.5, y - 27.5 + tete], [x + 14.3, y - 18.8 + tete]], poil);
    ctx.strokeStyle = fonce; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 6.5, y - 14); ctx.lineTo(x + 10.5, y - 20 + tete); ctx.stroke(); // la crinière
    ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(x + 13.5, y - 18 + tete, 0.8, 0, TOUR); ctx.fill(); // l'œil
    ctx.strokeStyle = fonce; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 11); ctx.quadraticCurveTo(x - 12, y - 8 + Math.sin(t * 3), x - 11, y - 4); ctx.stroke(); // la queue
  }
  // Étape 9 : une charrette à 2 roues (de profil), avec son chargement
  function charrette(ctx, x, y, t, quoi, nombre, marche) {
    const tour = marche ? t * 4 : 0;
    forme(ctx, [[x - 9, y - 9], [x + 7, y - 9], [x + 6, y - 4], [x - 8, y - 4]], "#a8743f");
    ctx.strokeStyle = "rgba(40,25,10,.4)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 8.5, y - 6.5); ctx.lineTo(x + 6.5, y - 6.5); ctx.stroke();
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + 6, y - 7); ctx.lineTo(x + 15, y - 9); ctx.stroke(); // le timon
    for (let k = 0; k < (quoi ? nombre : 0); k++) objetPorte(ctx, quoi, x - 5 + k * 5, y - 11 - (k % 2) * 1.5);
    ctx.beginPath(); ctx.arc(x - 1, y - 3, 3.6, 0, TOUR); ctx.fillStyle = "#7a5230"; ctx.fill(); contour(ctx, 1.2);
    ctx.strokeStyle = "#e0b47a"; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = 0; k < 3; k++) { const an = tour + (k * Math.PI) / 3; ctx.moveTo(x - 1 - Math.cos(an) * 3, y - 3 - Math.sin(an) * 3); ctx.lineTo(x - 1 + Math.cos(an) * 3, y - 3 + Math.sin(an) * 3); }
    ctx.stroke();
  }
  // Étape 9 : une brouette (de profil, la roue devant)
  function brouette(ctx, x, y, t, quoi, marche) {
    const tour = marche ? t * 9 : 0;
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x + 4, y - 4); ctx.stroke(); // les bras
    forme(ctx, [[x - 4, y - 10], [x + 7, y - 10], [x + 5, y - 5], [x - 2, y - 5]], "#8b9099");
    if (quoi) { objetPorte(ctx, quoi, x, y - 11); objetPorte(ctx, quoi, x + 3, y - 12); }
    ctx.beginPath(); ctx.arc(x + 6, y - 3, 3, 0, TOUR); ctx.fillStyle = "#5a3818"; ctx.fill(); contour(ctx, 1);
    ctx.strokeStyle = "#c9a06a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x + 6 - Math.cos(tour) * 2.4, y - 3 - Math.sin(tour) * 2.4); ctx.lineTo(x + 6 + Math.cos(tour) * 2.4, y - 3 + Math.sin(tour) * 2.4); ctx.stroke();
  }

  function ombre(ctx, x, y, a) {
    ctx.fillStyle = "rgba(20, 40, 10, .22)";
    ctx.beginPath(); ctx.ellipse(x + 6, y + 3, a * 1.15, a * 0.55, 0, 0, TOUR); ctx.fill();
  }

  function rond(ctx, x, y, r, couleur) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TOUR); ctx.fillStyle = couleur; ctx.fill(); contour(ctx, 1.5);
  }

  // Une pile de rondins ou de planches à côté du bâtiment
  function pile(ctx, x, y, sorte, nombre) {
    for (let k = 0; k < nombre; k++) {
      const px = x + (k % 3) * 6 - (Math.floor(k / 3) % 2) * 3, py = y - Math.floor(k / 3) * 5;
      if (sorte === "rondin") {
        // Étape 14 : ✍️ des bûches COUCHÉES et empilées (avant, on ne voyait que leurs bouts ronds : des « boulets » !)
        const rang = Math.floor(k / 3), pos = k % 3;
        ctx.save(); ctx.translate(x + pos * 1.5 + (rang % 2) * 1.2, y + pos * 3.4 - rang * 3.6); ctx.scale(0.62, 0.62); rondin(ctx, 0, 0, 0.42); ctx.restore();
      }
      else if (sorte === "poisson") poisson(ctx, px, py);
      else if (sorte === "viande") viande(ctx, px, py);
      else if (sorte === "charbon") charbon(ctx, px, py);
      else if (sorte === "fer") minerai(ctx, px, py); // étape 8
      else if (sorte === "lingots") lingot(ctx, px + 1, py + 1);
      else if (sorte === "outils") outil(ctx, px, py);
      else if (sorte === "ble" || sorte === "farine" || sorte === "pain" || sorte === "or" || sorte === "bijoux") objetPorte(ctx, sorte, px, py); // étape 11
      else if (C_.ressources[sorte]) objetPorte(ctx, sorte, px, py); // étape 15 et 16 : toutes les autres ressources
      else if (sorte === "planche") planche(ctx, x + (k % 2 ? 2.5 : -1), y - k * 2.6, 24); // étape 6 : une pile de longues planches, un peu décalées
      else caillou(ctx, px, py, k); // étape 9 : de vraies pierres taillées
    }
  }

  // ---------------------------------------------------------------- étape 22 : les grands champs et les enclos
  // ✍️ « on ne devrait pas avoir besoin de cliquer : on devrait le voir ». La ferme a de vrais champs, et les élevages de
  // vrais enclos pleins d'animaux, sur les cases à côté du bâtiment (config.js : « emprises »).
  // Étape 24 : seulement les cases des champs (config.js : « champs »), pas celles du bloc du bâtiment ; à la vraie taille.
  const estChamp = (b, dc, dl) => Bt().champsDe(b.type, Bt().tailleDe(b)).some(([a, c]) => a === dc && c === dl); // étape 28 : selon sa taille
  const aDesChamps = (b) => !!(b.emprise && b.emprise.some(([dc, dl]) => estChamp(b, dc, dl)));
  function empriseDessin(ctx, b, x, y, t) {
    const L = C_.carte.largeurCase / 2, H = C_.carte.hauteurCase / 2;
    const tr = C_.elevage.troupeaux[b.type];
    let n = 0;
    for (const [dc, dl] of b.emprise) {
      if (!estChamp(b, dc, dl)) continue; // le bloc du bâtiment lui-même
      const cx = x + (dc - dl) * L, cy = y + (dc + dl) * H;
      const P = [[cx - L * 0.92, cy], [cx, cy + H * 0.92], [cx + L * 0.92, cy], [cx, cy - H * 0.92]];
      if (b.type === "ferme") {
        // Un champ labouré, avec ses rangées de blé (vert au printemps, doré l'été, chaumes à l'automne, neige l'hiver)
        const sa = Village.monde && Village.monde.saison ? Village.monde.saison.numero : 1, couleur = ["#7cc24a", "#e8c64a", "#d9a640", "#e8eef5"][sa];
        forme(ctx, P, sa === 3 ? "#e8eef5" : "#9a6a3c");
        if (sa !== 3) {
          ctx.strokeStyle = couleur; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.beginPath();
          for (let r = -3; r <= 3; r++) for (let k = -4; k <= 4; k++) {
            const u = k / 5, v = r / 4, px = cx + (u - v) * L * 0.8, py = cy + (u + v) * H * 0.8, vent = Math.sin(t * 2 + k + r + dc) * 1;
            ctx.moveTo(px, py); ctx.lineTo(px + vent, py - (sa === 2 ? 2.5 : 5));
          }
          ctx.stroke();
        }
      } else if (tr) {
        // Un enclos : de l'herbe (ou de la boue pour les cochons), une barrière tout autour, et des animaux dedans
        forme(ctx, P, vue.hiver ? "#eef3f7" : b.type === "porcherie" ? "#8a6a48" : "#7fb24a");
        if (b.type === "porcherie" && !vue.hiver) { ctx.beginPath(); ctx.ellipse(cx + L * 0.2, cy + H * 0.1, L * 0.3, H * 0.28, 0, 0, TOUR); ctx.fillStyle = "#6b4a2c"; ctx.fill(); }
        ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.3; ctx.beginPath();
        for (let k = 0; k < 4; k++) { const A = P[k], Bq = P[(k + 1) % 4]; ctx.moveTo(A[0], A[1] - 4); ctx.lineTo(Bq[0], Bq[1] - 4); for (let j = 0; j <= 4; j++) { const px = A[0] + (Bq[0] - A[0]) * j / 4, py = A[1] + (Bq[1] - A[1]) * j / 4; ctx.moveTo(px, py); ctx.lineTo(px, py - 6); } }
        ctx.stroke();
        if (b.type === "etable" || b.type === "bergerie") { forme(ctx, [[cx + L * 0.35, cy - H * 0.05], [cx + L * 0.6, cy + H * 0.08], [cx + L * 0.6, cy + H * 0.25], [cx + L * 0.35, cy + H * 0.12]], "#9a6a3c"); ctx.fillStyle = "#5fb4e8"; ctx.fillRect(cx + L * 0.38, cy + H * 0.02, L * 0.2, 1.5); } // l'abreuvoir
        const places = [[-0.35, -0.1, 1], [0.15, 0.25, -1], [0, -0.35, 1], [-0.1, 0.45, -1]];
        const parCase = b.type === "poulailler" ? 4 : 2;
        for (let k = 0; k < parCase; k++) { const [u, v, d] = places[k]; animal(ctx, tr.animal, cx + (u - v) * L * 0.9, cy + (u + v) * H * 0.9 + 3, t + n * 1.7 + b.numero, d, n + b.numero, !!b.malade); n++; }
      }
    }
  }

  // ---------------------------------------------------------------- étape 15 : l'élevage
  // L'enclos : un losange d'herbe broutée, entouré d'une barrière en bois
  function enclos(ctx, x, y, a, b) {
    const P = [[x - a, y], [x, y + b], [x + a, y], [x, y - b]];
    ctx.beginPath(); P.forEach(([px, py], n) => (n ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
    ctx.fillStyle = vue.hiver ? "rgba(255, 255, 255, .5)" : "rgba(120, 150, 60, .55)"; ctx.fill();
    ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const A = P[k], B = P[(k + 1) % 4];
      ctx.moveTo(A[0], A[1] - 3); ctx.lineTo(B[0], B[1] - 3); // la barre du haut
      for (let j = 0; j <= 3; j++) { const px = A[0] + (B[0] - A[0]) * j / 3, py = A[1] + (B[1] - A[1]) * j / 3; ctx.moveTo(px, py); ctx.lineTo(px, py - 4); } // les piquets
    }
    ctx.stroke();
  }
  // Une vache (les pieds en x, y), qui broute, remue la queue… ou qui se couche quand elle est malade
  function vache(ctx, x, y, t, dir, graine, malade) {
    const rousse = graine % 3 === 1, robe = malade ? "#dfe8cf" : rousse ? "#b8743a" : "#f6f2e8", taches = rousse ? "#f6f2e8" : "#2b2b2b";
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * 1.4, 1.4); // un peu plus grosses que les bonshommes : ce sont des vaches !
    ctx.fillStyle = "rgba(20, 40, 10, .25)"; ctx.beginPath(); ctx.ellipse(0, 0.5, 5, 1.6, 0, 0, TOUR); ctx.fill();
    const couchee = malade ? 2.2 : 0, broute = !malade && Math.sin(t * 0.7) > 0.2 ? 1 : 0;
    if (!couchee) { // les 4 pattes
      ctx.strokeStyle = "#5a4630"; ctx.lineWidth = 1.1;
      ctx.beginPath(); for (const px of [-3, -1.6, 2, 3.2]) { ctx.moveTo(px, -3); ctx.lineTo(px, 0); } ctx.stroke();
    }
    // La queue qui balaie les mouches
    const q = Math.sin(t * 3) * 0.6;
    ctx.strokeStyle = robe === "#f6f2e8" ? "#8a8070" : "#7a4a20"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-4.4, -4.6 + couchee); ctx.quadraticCurveTo(-5.5, -3 + couchee, -5 + q, -1.5 + couchee); ctx.stroke();
    // Le corps, et ses taches
    ctx.beginPath(); ctx.ellipse(0, -4.6 + couchee, 4.6, 2.5, 0, 0, TOUR); ctx.fillStyle = robe; ctx.fill(); contour(ctx, 0.9);
    if (vue.fin) { ctx.fillStyle = taches; ctx.beginPath(); ctx.ellipse(-1.6, -5.2 + couchee, 1.3, 0.9, 0.4, 0, TOUR); ctx.ellipse(1.8, -4 + couchee, 1, 0.8, -0.3, 0, TOUR); ctx.fill(); }
    // La tête (baissée quand elle broute), le museau rose et les cornes
    const hx = 4.8, hy = -5.6 + couchee + broute * 3;
    ctx.beginPath(); ctx.ellipse(hx, hy, 1.7, 1.5, 0, 0, TOUR); ctx.fillStyle = robe; ctx.fill(); contour(ctx, 0.8);
    ctx.beginPath(); ctx.ellipse(hx + 1.2, hy + 0.7, 1, 0.8, 0, 0, TOUR); ctx.fillStyle = "#f2a9a0"; ctx.fill();
    if (vue.fin) { ctx.strokeStyle = "#efe6c8"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx - 0.6, hy - 1.3); ctx.lineTo(hx - 1.2, hy - 2.4); ctx.moveTo(hx + 0.6, hy - 1.3); ctx.lineTo(hx + 1, hy - 2.5); ctx.stroke(); }
    ctx.restore();
    if (malade && vue.fin) { ctx.strokeStyle = "rgba(90, 160, 60, .8)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 0; k < 2; k++) { const fy = y - 8 - k * 3 - ((t * 4) % 3); ctx.moveTo(x - 1 + k * 2, fy); ctx.quadraticCurveTo(x + k * 2, fy - 1.5, x + 1 + k * 2, fy); } ctx.stroke(); } // les petites spirales vertes
  }
  // Étape 16 : choisir le bon animal
  function animal(ctx, sorte, x, y, t, dir, graine, malade) {
    if (sorte === "vache") vache(ctx, x, y, t, dir, graine, malade);
    else if (sorte === "mouton") mouton(ctx, x, y, t, dir, graine, malade);
    else if (sorte === "cochon") cochon(ctx, x, y, t, dir, graine, malade);
    else if (sorte === "poule") {
      ctx.save(); ctx.translate(x, y); ctx.scale(1.2, 1.2);
      Village.Vie.poule(ctx, 0, 0, t, { droite: dir > 0, picore: !malade && Math.sin(t * 0.9 + graine) > 0, s: graine * 0.7 });
      ctx.restore();
      if (malade) spirales(ctx, x, y + 2, t);
    }
  }
  // Les petites spirales vertes au-dessus d'un animal malade
  function spirales(ctx, x, y, t) {
    if (!vue.fin) return;
    ctx.strokeStyle = "rgba(90, 160, 60, .8)"; ctx.lineWidth = 0.8; ctx.beginPath();
    for (let k = 0; k < 2; k++) { const fy = y - 8 - k * 3 - ((t * 4) % 3); ctx.moveTo(x - 1 + k * 2, fy); ctx.quadraticCurveTo(x + k * 2, fy - 1.5, x + 1 + k * 2, fy); }
    ctx.stroke();
  }
  // Un mouton : un nuage de laine, une tête et des pattes noires
  function mouton(ctx, x, y, t, dir, graine, malade) {
    const laine = malade ? "#dfe8cf" : graine % 4 === 3 ? "#6b5a4a" : "#f4f1ea", couche = malade ? 2 : 0, broute = !malade && Math.sin(t * 0.8) > 0.2 ? 1 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * 1.3, 1.3);
    ctx.fillStyle = "rgba(20, 40, 10, .25)"; ctx.beginPath(); ctx.ellipse(0, 0.5, 4.4, 1.5, 0, 0, TOUR); ctx.fill();
    if (!couche) { ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = 0.9; ctx.beginPath(); for (const px of [-2.4, -1, 1.6, 2.8]) { ctx.moveTo(px, -2.5); ctx.lineTo(px, 0); } ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -4 + couche, 4.2, 2.6, 0, 0, TOUR); ctx.fillStyle = laine; ctx.fill(); contour(ctx, 0.8);
    if (vue.fin) { ctx.fillStyle = laine; for (const [bx, by] of [[-2.6, -5.8], [0, -6.4], [2.4, -5.8], [-3.4, -3.6]]) { ctx.beginPath(); ctx.arc(bx, by + couche, 1.5, 0, TOUR); ctx.fill(); } }
    const hy = -5 + couche + broute * 2.6;
    ctx.beginPath(); ctx.ellipse(4.4, hy, 1.4, 1.7, 0.3, 0, TOUR); ctx.fillStyle = "#2b2b2b"; ctx.fill();
    ctx.restore();
    if (malade) spirales(ctx, x, y, t);
  }
  // Un cochon rose, son groin et sa queue en tire-bouchon
  function cochon(ctx, x, y, t, dir, graine, malade) {
    const rose = malade ? "#e8d8d0" : graine % 3 === 2 ? "#c99a7a" : "#f2a9b8", couche = malade ? 1.8 : 0, fouille = !malade && Math.sin(t * 1.1 + graine) > 0.3 ? 1 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(dir * 1.3, 1.3);
    ctx.fillStyle = "rgba(20, 40, 10, .25)"; ctx.beginPath(); ctx.ellipse(0, 0.5, 4.6, 1.5, 0, 0, TOUR); ctx.fill();
    if (!couche) { ctx.strokeStyle = "#c97a8a"; ctx.lineWidth = 1.2; ctx.beginPath(); for (const px of [-2.6, -1.2, 1.8, 3]) { ctx.moveTo(px, -2.2); ctx.lineTo(px, 0); } ctx.stroke(); }
    ctx.strokeStyle = "#c97a8a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(-4.8, -4.6 + couche, 0.9, 0, Math.PI * 1.6); ctx.stroke(); // la queue en tire-bouchon
    ctx.beginPath(); ctx.ellipse(0, -3.8 + couche, 4.4, 2.5, 0, 0, TOUR); ctx.fillStyle = rose; ctx.fill(); contour(ctx, 0.8);
    const hy = -4.4 + couche + fouille * 1.4;
    ctx.beginPath(); ctx.ellipse(4.2, hy, 1.8, 1.6, 0, 0, TOUR); ctx.fillStyle = rose; ctx.fill(); contour(ctx, 0.7);
    ctx.beginPath(); ctx.ellipse(5.8, hy + 0.3, 0.8, 1, 0, 0, TOUR); ctx.fillStyle = "#e88a9a"; ctx.fill(); // le groin
    forme(ctx, [[3.4, hy - 1.2], [3.2, hy - 2.8], [4.6, hy - 1.4]], rose); // l'oreille
    ctx.restore();
    if (malade) spirales(ctx, x, y, t);
  }
  function oeufs(ctx, x, y) { // deux œufs dans un peu de paille
    ctx.strokeStyle = "#d9c35a"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 4, y + 2.6); ctx.lineTo(x + 4, y + 2); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3.5, y + 3.2); ctx.stroke();
    for (const [ox, c] of [[-1.6, "#fbf6ee"], [1.8, "#e8c49a"]]) { ctx.beginPath(); ctx.ellipse(x + ox, y, 1.8, 2.4, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 0.7); }
  }
  function pelote(ctx, x, y) { // une pelote de laine
    ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TOUR); ctx.fillStyle = "#e8e2f4"; ctx.fill(); contour(ctx, 0.8);
    ctx.strokeStyle = "#b8a8d0"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x, y, 2.2, -0.6, 2); ctx.moveTo(x - 2.8, y - 1); ctx.quadraticCurveTo(x, y + 1, x + 2.6, y - 1.6); ctx.moveTo(x - 2, y + 2); ctx.quadraticCurveTo(x + 0.5, y - 0.4, x + 2.4, y + 1.6); ctx.stroke();
  }
  function rouleau(ctx, x, y) { // un rouleau de tissu
    forme(ctx, [[x - 4, y - 1], [x + 3, y - 3.4], [x + 3, y + 0.6], [x - 4, y + 3]], "#7a5ab0");
    ctx.beginPath(); ctx.ellipse(x + 3, y - 1.4, 1, 2, 0, 0, TOUR); ctx.fillStyle = "#a58ad0"; ctx.fill(); contour(ctx, 0.7);
  }
  function veste(ctx, x, y) { // une chemise pliée
    forme(ctx, [[x - 2.4, y - 3], [x - 4.4, y - 1.4], [x - 3.4, y], [x - 2.4, y - 0.6], [x - 2.4, y + 3], [x + 2.4, y + 3], [x + 2.4, y - 0.6], [x + 3.4, y], [x + 4.4, y - 1.4], [x + 2.4, y - 3], [x + 1, y - 2], [x - 1, y - 2]], "#3f8a8a");
    ctx.fillStyle = "#ffcf2e"; ctx.fillRect(x - 0.3, y - 1, 0.7, 0.7); ctx.fillRect(x - 0.3, y + 1, 0.7, 0.7);
  }
  function jambon(ctx, x, y) { // un jambon fumé, avec son os
    ctx.beginPath(); ctx.moveTo(x, y - 3.6); ctx.quadraticCurveTo(x + 3.6, y - 1, x + 2.4, y + 2.6); ctx.quadraticCurveTo(x, y + 4, x - 2.4, y + 2.6); ctx.quadraticCurveTo(x - 3.6, y - 1, x, y - 3.6); ctx.closePath(); ctx.fillStyle = "#b8503a"; ctx.fill(); contour(ctx, 0.8);
    ctx.fillStyle = "#f2c9b0"; ctx.beginPath(); ctx.ellipse(x, y + 1.6, 1.6, 1, 0, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#fbf6ee"; ctx.fillRect(x - 0.5, y - 5, 1, 1.8);
  }
  // Les objets de l'élevage
  function seau(ctx, x, y) {
    forme(ctx, [[x - 3, y - 2.6], [x + 3, y - 2.6], [x + 2.2, y + 3], [x - 2.2, y + 3]], "#9a6a3c");
    ctx.beginPath(); ctx.ellipse(x, y - 2.6, 3, 1.1, 0, 0, TOUR); ctx.fillStyle = "#5fb4e8"; ctx.fill(); contour(ctx, 0.8);
    ctx.strokeStyle = "#5a5f68"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 2.7, y); ctx.lineTo(x + 2.7, y); ctx.stroke();
  }
  function botte(ctx, x, y) { // une botte de foin, avec ses 2 liens
    forme(ctx, [[x - 4, y - 2.4], [x + 4, y - 2.4], [x + 4, y + 2.6], [x - 4, y + 2.6]], "#d9c35a");
    ctx.strokeStyle = "rgba(140, 110, 30, .55)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(x - 3.6, y + k * 1.4); ctx.lineTo(x + 3.6, y + k * 1.4 + 0.3); } ctx.stroke();
    ctx.fillStyle = "#8a5a2b"; ctx.fillRect(x - 2, y - 2.4, 0.9, 5); ctx.fillRect(x + 1.2, y - 2.4, 0.9, 5);
  }
  function bidon(ctx, x, y) { // un bidon de lait en fer-blanc
    forme(ctx, [[x - 2.6, y + 3.4], [x + 2.6, y + 3.4], [x + 2.6, y - 1], [x + 1.3, y - 2.4], [x + 1.3, y - 3.8], [x - 1.3, y - 3.8], [x - 1.3, y - 2.4], [x - 2.6, y - 1]], "#e6eaee");
    ctx.fillStyle = "#9aa3ad"; ctx.fillRect(x - 2.6, y + 0.6, 5.2, 1);
    ctx.fillStyle = "rgba(255, 255, 255, .8)"; ctx.fillRect(x - 1.8, y - 0.6, 0.8, 3.4);
  }
  function motte(ctx, x, y) { // une motte de beurre dans son papier
    forme(ctx, [[x - 3.6, y], [x, y + 1.8], [x + 3.6, y], [x, y - 1.8]], "#ffe27a");
    forme(ctx, [[x - 3.6, y], [x, y + 1.8], [x, y + 4], [x - 3.6, y + 2.2]], "#f2c230");
    forme(ctx, [[x, y + 1.8], [x + 3.6, y], [x + 3.6, y + 2.2], [x, y + 4]], "#d9a820");
  }
  function fromage(ctx, x, y) { // une part de fromage, avec ses trous
    forme(ctx, [[x - 4, y + 1], [x + 3.6, y - 1.6], [x + 3.6, y - 4], [x - 4, y - 1.4]], "#ffd75a");
    forme(ctx, [[x - 4, y + 1], [x + 3.6, y - 1.6], [x + 3.6, y + 1.2], [x - 4, y + 3.6]], "#f2c230");
    ctx.fillStyle = "#d9a820"; ctx.beginPath(); ctx.arc(x - 1.4, y + 1.6, 0.7, 0, TOUR); ctx.arc(x + 1.6, y + 0.4, 0.55, 0, TOUR); ctx.arc(x + 0.2, y - 2, 0.5, 0, TOUR); ctx.fill();
  }
  function pot(ctx, x, y) { // un pot de yaourt, avec son couvercle
    forme(ctx, [[x - 2.2, y - 2], [x + 2.2, y - 2], [x + 1.8, y + 2.6], [x - 1.8, y + 2.6]], "#fbf6ee");
    ctx.beginPath(); ctx.ellipse(x, y - 2, 2.4, 0.9, 0, 0, TOUR); ctx.fillStyle = "#d96aa0"; ctx.fill(); contour(ctx, 0.7);
    ctx.fillStyle = "#5fa8d9"; ctx.fillRect(x - 2, y, 4, 0.8);
  }

  // ---------------------------------------------------------------- un bâtiment
  // ---------------------------------------------------------------- étape 25 : l'architecte (des formes différentes)
  // ✍️ « La forme des bâtiments reste toujours pareille : on a du mal à les distinguer. » Jusqu'ici, TOUS les
  // bâtiments étaient la même boîte avec un toit à deux pentes : seules les couleurs changeaient. De loin, on ne voit
  // que la SILHOUETTE (le contour). Maintenant, chaque métier a sa silhouette à lui :
  //   - 5 formes de toit (config de chaque modèle, « toitForme ») : à deux pentes, en pavillon (4 pentes), de grange
  //     (mansarde, cassé en deux), en appentis (une seule pente) et en voûte (arrondi) ; ou un toit plat ;
  //   - de grands morceaux qui dépassent : tours rondes, cheminées d'usine, grue, chevalement de mine, roue à aubes,
  //     ailes de moulin, dôme, tentes, étals…
  //   - et certains n'ont plus du tout de boîte : la mine est une colline, le marché des étals, le moulin une tour.
  const haut = ([px, py], dh) => [px, py - dh];
  const coins = (x, y, m) => { const a = m.a, a2 = m.a2 || a; return { G: [x - a, y], B: [x, y + a / 2], D: [x + a2, y + a / 2 - a2 / 2], H: [x - a + a2, y - a2 / 2] }; };
  function neige(ctx, A, B, A2, B2) { if (vue.hiver) forme(ctx, [A2, B2, entre(B2, B, 0.45), entre(A2, A, 0.45)], "#f4f8ff"); }
  function chemineeEn(ctx, base, x, y) {
    forme(ctx, [[base[0] - 3, base[1]], [base[0] + 3, base[1] + 1.5], [base[0] + 3, base[1] - 12], [base[0] - 3, base[1] - 13.5]], "#9a5a3c");
    forme(ctx, [[base[0] - 4, base[1] - 13], [base[0] + 4, base[1] - 11], [base[0] + 4, base[1] - 13.5], [base[0] - 4, base[1] - 15.5]], "#7a4a30");
    return [base[0] - x, base[1] - 17 - y];
  }
  // Les toits qui ne sont pas « à deux pentes ». Gt, Bt, Dt, Ht : les 4 coins du bas du toit. Renvoie son point le plus haut.
  function toitVariante(ctx, m, x, y, G, B, D, H, h, Gt, Bt, Dt, Ht) {
    const M1 = entre(Gt, Ht, 0.5), M2 = entre(Bt, Dt, 0.5), fin = vue.fin, sorte = m.toitSorte;
    if (m.toitForme === "plat") { // un toit plat avec un petit muret (l'université)
      const P = [haut(G, h), haut(B, h), haut(D, h), haut(H, h)];
      forme(ctx, P, m.toitB);
      const k = 0.12, c = entre(P[0], P[2], 0.5), Q = P.map((p) => entre(p, c, k));
      forme(ctx, Q, m.toitA);
      return c;
    }
    if (m.toitForme === "appentis") { // une seule pente, qui monte vers le fond
      const Hh = haut(Ht, m.toit), Dh = haut(Dt, m.toit);
      forme(ctx, [haut(B, h), haut(D, h), [D[0], D[1] - h - m.toit + 1]], m.murD); // le mur en triangle, à droite
      forme(ctx, [Gt, Bt, Dh, Hh], m.toitA);
      if (fin && sorte) tuiles(ctx, Gt, Bt, Hh, Dh, sorte);
      neige(ctx, Gt, Bt, Hh, Dh);
      if (m.cheminee) [m.fumeeX, m.fumeeY] = chemineeEn(ctx, haut(entre(Hh, Dh, m.cheminee), -1), x, y);
      return entre(Hh, Dh, 0.5);
    }
    if (m.toitForme === "pavillon") { // 4 pentes : pas de mur en triangle
      const long = (m.a2 || m.a) > m.a + 2;
      const F1 = haut(entre(M1, M2, long ? 0.28 : 0.5), m.toit), F2 = haut(entre(M1, M2, long ? 0.72 : 0.5), m.toit);
      forme(ctx, [Ht, Dt, F2, F1], m.toitB);
      forme(ctx, [Gt, Ht, F1], m.toitB);
      if (m.cheminee) [m.fumeeX, m.fumeeY] = chemineeEn(ctx, [entre(F1, Dt, 0.45)[0] + 2, entre(F1, Dt, 0.45)[1] + 2], x, y);
      forme(ctx, [Bt, Dt, F2], assombrir(m.toitA));
      forme(ctx, [Gt, F1, F2, Bt], m.toitA);
      if (fin && sorte) { tuiles(ctx, Gt, Bt, F1, F2, sorte); tuiles(ctx, Bt, Dt, F2, F2, sorte); }
      neige(ctx, Gt, Bt, F1, F2);
      return entre(F1, F2, 0.5);
    }
    if (m.toitForme === "mansarde") { // le toit des granges, cassé en deux : très raide en bas, plat en haut
      const k = 0.32, r = 0.62;
      const Gm = haut(entre(Gt, M1, k), m.toit * r), Bm = haut(entre(Bt, M2, k), m.toit * r), Dm = haut(entre(Dt, M2, k), m.toit * r), Hm = haut(entre(Ht, M1, k), m.toit * r);
      const F1 = haut(M1, m.toit), F2 = haut(M2, m.toit);
      forme(ctx, [Ht, Hm, F1, F2, Dm, Dt], m.toitB);
      forme(ctx, [haut(B, h), Bt, Bm, F2, Dm, Dt, haut(D, h)], m.murD); // le pignon de la grange
      if (fin) { ctx.strokeStyle = "rgba(40, 25, 10, .35)"; ctx.lineWidth = 1; ctx.beginPath(); for (let u = 0.2; u < 0.9; u += 0.15) { const p = entre(Bt, Dt, u); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[0], p[1] - m.toit * 0.6 * (1 - Math.abs(u - 0.5) * 1.6)); } ctx.stroke(); }
      const oeil = entre(entre(Bm, Dm, 0.5), F2, 0.35); // la lucarne du grenier à foin
      forme(ctx, [[oeil[0] - 3, oeil[1] + 3.5], [oeil[0] + 3, oeil[1] + 0.5], [oeil[0] + 3, oeil[1] - 4.5], [oeil[0] - 3, oeil[1] - 1.5]], "#4a2f18");
      if (m.cheminee) [m.fumeeX, m.fumeeY] = chemineeEn(ctx, haut(entre(F1, F2, m.cheminee), -2), x, y);
      forme(ctx, [Gt, Gm, Bm, Bt], m.toitA);
      forme(ctx, [Gm, F1, F2, Bm], m.toitA);
      ctx.fillStyle = "rgba(255, 255, 255, .13)"; ctx.beginPath(); ctx.moveTo(Gm[0], Gm[1]); ctx.lineTo(F1[0], F1[1]); ctx.lineTo(F2[0], F2[1]); ctx.lineTo(Bm[0], Bm[1]); ctx.fill();
      if (fin && sorte) { tuiles(ctx, Gt, Bt, Gm, Bm, sorte); tuiles(ctx, Gm, Bm, F1, F2, sorte); }
      neige(ctx, Gm, Bm, F1, F2);
      return entre(F1, F2, 0.5);
    }
    if (m.toitForme === "voute") { // une voûte arrondie (la cave de la fromagerie, la fonderie)
      const arc = (P, Q, s0, s1) => { const pts = []; for (let k = 0; k <= 8; k++) { const s = s0 + ((s1 - s0) * k) / 8; pts.push(haut(entre(P, Q, s), m.toit * Math.sin(Math.PI * s))); } return pts; };
      forme(ctx, arc(Gt, Ht, 0.5, 1).concat(arc(Bt, Dt, 1, 0.5)), m.toitB);
      forme(ctx, [haut(B, h), haut(D, h)].concat(arc(Bt, Dt, 1, 0)), m.murD);
      if (fin) { ctx.strokeStyle = "rgba(40, 25, 10, .35)"; ctx.lineWidth = 1; ctx.beginPath(); const pts = arc(Bt, Dt, 0.06, 0.94); pts.forEach((p, n) => (n ? ctx.lineTo(p[0], p[1] + 2.5) : ctx.moveTo(p[0], p[1] + 2.5))); ctx.stroke(); }
      if (m.cheminee) [m.fumeeX, m.fumeeY] = chemineeEn(ctx, haut(entre(M1, M2, m.cheminee), m.toit - 2), x, y);
      forme(ctx, arc(Gt, Ht, 0, 0.5).concat(arc(Bt, Dt, 0.5, 0)), m.toitA);
      if (fin) { ctx.strokeStyle = "rgba(40, 25, 10, .28)"; ctx.lineWidth = 1; ctx.beginPath(); for (const s of [0.12, 0.25, 0.38]) { const p = haut(entre(Gt, Ht, s), m.toit * Math.sin(Math.PI * s)), q = haut(entre(Bt, Dt, s), m.toit * Math.sin(Math.PI * s)); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
      if (vue.hiver) { const p = arc(Gt, Ht, 0.3, 0.5), q = arc(Bt, Dt, 0.5, 0.3); forme(ctx, p.concat(q), "#f4f8ff"); }
      return haut(entre(M1, M2, 0.5), m.toit);
    }
    return null;
  }

  // Une tour ronde. (x, y) : le milieu de son pied ; r : son rayon en bas, rh : en haut ; h : sa hauteur.
  // toit : "cone", "dome", "bulbe" (en oignon), "creneaux" ou rien. Renvoie le point du sommet.
  function tourRonde(ctx, x, y, o) {
    const r = o.r, rh = o.rh || r, h = o.h, ht = o.ht || r;
    const g = ctx.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, o.clair); g.addColorStop(0.4, o.clair); g.addColorStop(1, o.fonce);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - rh, y - h); ctx.lineTo(x + rh, y - h); ctx.lineTo(x + r, y); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI); ctx.closePath();
    ctx.fillStyle = g; ctx.fill(); contour(ctx, 1.6);
    if (vue.fin && o.pierre) { ctx.save(); ctx.clip(); ctx.strokeStyle = "rgba(40, 25, 10, .25)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 6; k++) { const yy = y - (h * k) / 6, rr = r + (rh - r) * (k / 6); ctx.ellipse(x, yy, rr, rr * 0.5, 0, 0, Math.PI); } ctx.stroke(); ctx.restore(); }
    if (o.bandes) { ctx.save(); ctx.clip(); ctx.strokeStyle = o.bandes; ctx.lineWidth = 1.6; ctx.beginPath(); for (const k of [0.3, 0.7]) { const rr = r + (rh - r) * k; ctx.ellipse(x, y - h * k, rr, rr * 0.5, 0, 0, Math.PI); } ctx.stroke(); ctx.restore(); }
    const tg = ctx.createLinearGradient(x - rh, 0, x + rh, 0); tg.addColorStop(0, o.toitA || o.clair); tg.addColorStop(1, o.toitB || o.fonce);
    const yt = y - h, rt = rh + (o.toit === "cone" ? 2.5 : 0.5);
    if (o.toit === "cone") {
      ctx.beginPath(); ctx.moveTo(x - rt, yt); ctx.lineTo(x, yt - ht); ctx.lineTo(x + rt, yt); ctx.ellipse(x, yt, rt, rt * 0.5, 0, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = tg; ctx.fill(); contour(ctx, 1.6);
      if (vue.fin && o.paille) { ctx.strokeStyle = "rgba(120, 90, 30, .5)"; ctx.lineWidth = 0.9; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(x, yt - ht + 2); ctx.lineTo(x + (k / 3.4) * rt, yt + Math.sqrt(1 - (k / 3.4) ** 2) * rt * 0.5); } ctx.stroke(); }
      if (vue.hiver) forme(ctx, [[x - rt * 0.45, yt - ht * 0.55], [x, yt - ht], [x + rt * 0.45, yt - ht * 0.55]], "#f4f8ff");
      return [x, yt - ht];
    }
    if (o.toit === "dome" || o.toit === "bulbe") {
      ctx.beginPath(); ctx.moveTo(x - rt, yt);
      if (o.toit === "dome") ctx.ellipse(x, yt, rt, ht, 0, Math.PI, 0);
      else { ctx.bezierCurveTo(x - rt * 1.5, yt - ht * 0.5, x - rt * 0.2, yt - ht * 0.75, x, yt - ht); ctx.bezierCurveTo(x + rt * 0.2, yt - ht * 0.75, x + rt * 1.5, yt - ht * 0.5, x + rt, yt); }
      ctx.ellipse(x, yt, rt, rt * 0.5, 0, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = tg; ctx.fill(); contour(ctx, 1.6);
      ctx.strokeStyle = "rgba(255, 255, 255, .45)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x - rt * 0.35, yt - ht * 0.45, rt * 0.2, ht * 0.25, -0.3, Math.PI, Math.PI * 1.6); ctx.stroke(); // un reflet
      if (vue.hiver && o.toit === "dome") { ctx.beginPath(); ctx.ellipse(x, yt - ht * 0.55, rt * 0.6, ht * 0.45, 0, Math.PI, 0); ctx.fillStyle = "#f4f8ff"; ctx.fill(); }
      return [x, yt - ht];
    }
    // plat ou créneaux : on voit le dessus
    ctx.beginPath(); ctx.ellipse(x, yt, rh, rh * 0.5, 0, 0, TOUR); ctx.fillStyle = o.dessus || o.fonce; ctx.fill(); contour(ctx, 1.4);
    if (o.toit === "creneaux") for (let k = 0; k < 5; k++) { const u = -0.8 + k * 0.4, cx = x + u * rh, cy = yt + Math.sqrt(1 - u * u) * rh * 0.5; forme(ctx, [[cx - 1.6, cy], [cx + 1.6, cy], [cx + 1.6, cy - 3.5], [cx - 1.6, cy - 3.5]], o.clair); }
    return [x, yt];
  }
  // Un bloc en forme de boîte sans toit (des pierres taillées, une estrade…) : (x, y) le milieu du pied, a sa demi-largeur.
  function bloc(ctx, x, y, a, h, dessus, gauche, droite, rayures) {
    const G = [x - a, y], B = [x, y + a / 2], D = [x + a, y], H = [x, y - a / 2];
    forme(ctx, [G, B, haut(B, h), haut(G, h)], gauche);
    forme(ctx, [B, D, haut(D, h), haut(B, h)], droite);
    forme(ctx, [haut(G, h), haut(B, h), haut(D, h), haut(H, h)], dessus);
    if (rayures && vue.fin) { ctx.strokeStyle = "rgba(40, 25, 10, .3)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 4; k++) { const A = surMur(G, B, h, k / 4, 0), C = surMur(B, D, h, k / 4, 0); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0], A[1] - h); ctx.moveTo(C[0], C[1]); ctx.lineTo(C[0], C[1] - h); } ctx.stroke(); }
  }
  // Un auvent rayé au-dessus de la porte (sur le mur de gauche, entre u0 et u1)
  function auventRaye(ctx, G, B, h, u0, u1, c1, c2) {
    const n = 6;
    for (let k = 0; k < n; k++) {
      const a = surMur(G, B, h, u0 + ((u1 - u0) * k) / n, 0.86), b = surMur(G, B, h, u0 + ((u1 - u0) * (k + 1)) / n, 0.86);
      forme(ctx, [a, b, [b[0] - 7, b[1] + 7.5], [a[0] - 7, a[1] + 7.5]], k % 2 ? c2 : c1);
    }
    for (let k = 0; k < n; k++) { const a = surMur(G, B, h, u0 + ((u1 - u0) * (k + 0.5)) / n, 0.86); ctx.beginPath(); ctx.arc(a[0] - 7, a[1] + 7.5, 2.2, 0, Math.PI); ctx.fillStyle = k % 2 ? c2 : c1; ctx.fill(); contour(ctx, 0.8); }
  }
  // Une grande porte de grange, avec son X blanc (sur le mur de gauche)
  function porteGrange(ctx, G, B, h, u, couleur) {
    const P = [surMur(G, B, h, u - 0.17, 0), surMur(G, B, h, u + 0.17, 0), surMur(G, B, h, u + 0.17, 0.72), surMur(G, B, h, u - 0.17, 0.72)];
    forme(ctx, P, couleur);
    ctx.strokeStyle = "#f4efe4"; ctx.lineWidth = 1.6; ctx.beginPath();
    for (const s of [-1, 1]) { const A = surMur(G, B, h, u + s * 0.17, 0.02), C = surMur(G, B, h, u, 0.36), E = surMur(G, B, h, u + s * 0.17, 0.7); ctx.moveTo(A[0], A[1]); ctx.lineTo(C[0], C[1]); ctx.lineTo(E[0], E[1]); }
    const A = surMur(G, B, h, u, 0), E = surMur(G, B, h, u, 0.72); ctx.moveTo(A[0], A[1]); ctx.lineTo(E[0], E[1]);
    ctx.stroke(); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); P.forEach((p) => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
  }
  // Une roue (de moulin à eau, de chevalement), vue de biais : elle est dans le plan du mur de gauche
  function roue(ctx, cx, cy, r, an, bois, rayons, aubes) {
    ctx.save(); ctx.translate(cx, cy); ctx.transform(0.55, 0.28, 0, 1, 0, 0);
    ctx.strokeStyle = bois; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, r, 0, TOUR); ctx.stroke();
    ctx.lineWidth = 1.4; ctx.beginPath(); for (let k = 0; k < rayons; k++) { const a = an + (k / rayons) * TOUR; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke();
    if (aubes) { ctx.fillStyle = "#8a5a2b"; for (let k = 0; k < rayons; k++) { const a = an + (k / rayons) * TOUR; ctx.save(); ctx.rotate(a); ctx.fillRect(r - 2, -2.5, 6, 5); ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.8; ctx.strokeRect(r - 2, -2.5, 6, 5); ctx.restore(); } }
    ctx.restore();
    rond(ctx, cx, cy, 2, "#5a5f68");
  }
  // Un poteau en bois (de P vers le haut, sur la hauteur h)
  function poteau(ctx, P, h, largeur) { ctx.strokeStyle = CONTOUR; ctx.lineWidth = (largeur || 2.4) + 1.4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0], P[1] - h); ctx.stroke(); ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = largeur || 2.4; ctx.stroke(); ctx.lineCap = "butt"; }
  function poutre(ctx, P, Q, largeur, couleur) { ctx.strokeStyle = CONTOUR; ctx.lineWidth = (largeur || 2) + 1.4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(Q[0], Q[1]); ctx.stroke(); ctx.strokeStyle = couleur || "#8a5a2b"; ctx.lineWidth = largeur || 2; ctx.stroke(); ctx.lineCap = "butt"; }
  // Des cristaux (le géologue) : des aiguilles pointues, claires d'un côté et sombres de l'autre
  function cristaux(ctx, x, y, t) {
    for (const [dx, h, l, pen] of [[-7, 16, 3.5, -0.35], [7, 14, 3.2, 0.4], [-2, 26, 4.5, -0.08], [3, 20, 4, 0.18]]) {
      const bx = x + dx, tx = bx + pen * h, ty = y - h;
      forme(ctx, [[bx - l, y], [bx, y + 1.5], [tx, ty]], "#7a4ab8");
      forme(ctx, [[bx, y + 1.5], [bx + l, y], [tx, ty]], "#b98ae8");
    }
    if (Math.sin(t * 3) > 0.5) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 6, y - 26); ctx.lineTo(x, y - 26); ctx.moveTo(x - 3, y - 29); ctx.lineTo(x - 3, y - 23); ctx.stroke(); }
  }
  // Une pile de bûches rangées (le bûcheron) : on voit le bout rond des bûches
  function tasDeBuches(ctx, x, y, n) {
    forme(ctx, [[x, y], [x + 22, y - 11], [x + 22, y - 11 - 13], [x + 14, y - 11 - 16], [x - 3, y - 7.5], [x - 3, y - 4]], "#7a5030");
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) {
      const cx = x + 2 + k * 3.6 + r * 1.8, cy = y - 3 - k * 1.8 - r * 3.4 + r * 0.9;
      ctx.beginPath(); ctx.ellipse(cx, cy, 1.9, 1.9, 0, 0, TOUR); ctx.fillStyle = "#e0b47a"; ctx.fill(); ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 0.8; ctx.stroke();
      if (vue.fin) { ctx.beginPath(); ctx.arc(cx, cy, 0.8, 0, TOUR); ctx.stroke(); }
    }
    if (vue.hiver) forme(ctx, [[x - 3, y - 7.5], [x + 14, y - 27], [x + 22, y - 24], [x + 4, y - 4]], "rgba(244, 248, 255, .85)");
  }

  // Le corps du bâtiment : sa boîte avec son toit et sa porte… ou une tout autre forme.
  // (b peut manquer : c'est l'aperçu, quand on choisit où construire.)
  function structure(ctx, type, x, y, m, t, b) {
    const travail = !!(b && b.travail), num = b ? b.numero : 0;
    const { G, B, D, H } = coins(x, y, m);
    switch (type) {
      case "moulin": { // une tour en pierre qui se rétrécit, un chapeau pointu, et de GRANDES ailes
        const sommet = tourRonde(ctx, x, y + 2, { r: 14, rh: 9.5, h: 40, ht: 13, clair: "#f1ece0", fonce: "#b9b0a0", pierre: true, toit: "cone", toitA: "#9a6a42", toitB: "#6c442c" });
        forme(ctx, [[x - 4, y + 8], [x + 3, y + 9], [x + 3, y - 2], [x - 4, y - 3]], "#5a3818"); // la porte
        forme(ctx, [[x - 2, y - 20], [x + 2, y - 20], [x + 2, y - 26], [x - 2, y - 26]], vue.noirceur > 0.15 ? "#ffd866" : "#4a6a8a");
        const cx = x + 3, cy = y - 36, an = t * (travail ? 1.6 : 0.3) + num;
        ctx.save(); ctx.translate(cx, cy);
        for (let k = 0; k < 4; k++) {
          ctx.save(); ctx.rotate(an + (k * Math.PI) / 2);
          ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -32); ctx.stroke();
          forme(ctx, [[1.2, -7], [8, -8], [8, -31], [1.2, -32]], "rgba(246, 240, 228, .93)");
          if (vue.fin) { ctx.strokeStyle = "rgba(107,68,35,.5)"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let j = 1; j < 6; j++) { ctx.moveTo(1.2, -7 - j * 4); ctx.lineTo(8, -8 - j * 4); } ctx.stroke(); }
          ctx.restore();
        }
        ctx.restore(); rond(ctx, cx, cy, 2.6, "#6b4423");
        return sommet;
      }
      case "hutte": { // une hutte RONDE avec un toit de paille en cône
        tourRonde(ctx, x, y + 1, { r: 13, h: 9, clair: "#c49a62", fonce: "#8a6238", toit: "cone", ht: 17, toitA: "#e2c46a", toitB: "#b0903a", paille: true });
        forme(ctx, [[x - 6, y + 7], [x - 1, y + 8], [x - 1, y + 1], [x - 6, y]], "#4a2f18");
        return [x, y - 25];
      }
      case "chasseur": { // une grande tente en peaux (un tipi), et un cadre où sèche une peau
        const ax = x - 3, ay = y - 40;
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6; ctx.beginPath(); for (const d of [-5, -1, 4]) { ctx.moveTo(ax, ay + 6); ctx.lineTo(ax + d, ay - 2); } ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay + 4); ctx.lineTo(x - 20, y + 3); ctx.ellipse(ax, y + 3, 17, 8, 0, Math.PI, 0, true); ctx.lineTo(ax, ay + 4); ctx.closePath();
        const g = ctx.createLinearGradient(x - 20, 0, x + 14, 0); g.addColorStop(0, "#e8cfa0"); g.addColorStop(1, "#a8864e"); ctx.fillStyle = g; ctx.fill(); contour(ctx, 1.8);
        ctx.strokeStyle = "#a8432c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 13.5, y - 9); ctx.quadraticCurveTo(ax, y - 4, x + 7.5, y - 9); ctx.stroke(); // une bande peinte
        ctx.strokeStyle = "#3f6a8a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 9, y - 19); ctx.quadraticCurveTo(ax, y - 15, x + 3, y - 19); ctx.stroke();
        forme(ctx, [[ax - 5, y + 10], [ax, y - 10], [ax + 4, y + 10.5]], "#4a2f18"); // l'entrée
        return [ax, ay - 2];
      }
      case "carriere": { // des gradins de pierre taillée, et une grue en bois qui soulève un bloc
        bloc(ctx, x - 2, y + 4, 22, 7, "#c9c5bc", "#a9a59b", "#8a867c", true);
        bloc(ctx, x - 5, y - 4, 15, 7, "#d6d2c9", "#b0aca2", "#918d83", true);
        bloc(ctx, x - 8, y - 11, 8, 6, "#e0ddd5", "#b8b4aa", "#9a968c", true);
        const px = x + 15, py = y + 2, hm = 46, bras = travail ? Math.sin(t * 0.8) * 0.25 : 0.1;
        poteau(ctx, [px, py], hm, 2.8);
        poutre(ctx, [px + 6, py + 3], [px, py - hm * 0.55], 1.8); poutre(ctx, [px - 6, py + 2], [px, py - hm * 0.55], 1.8);
        const bx = px - Math.cos(bras) * 30, by = py - hm - 2 + Math.sin(bras) * 10;
        poutre(ctx, [px + 6, py - hm + 4], [bx, by], 2.4);
        const monte = travail ? (Math.sin(t * 1.3) + 1) * 6 : 6, cy = by + 16 - monte;
        ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(bx + 1, by); ctx.lineTo(bx + 1, cy - 5); ctx.stroke();
        bloc(ctx, bx + 1, cy, 4.5, 5, "#e8e5de", "#c4c0b6", "#a5a197", false);
        return [px, py - hm - 4];
      }
      case "mineCharbon": case "mineFer": case "mineOr": {
        // Étape 28 : ✍️ « la mine doit creuser dans le sol » : plus de colline. Un PUITS carré creusé dans la terre, bordé
        // de pierres et de planches, le chevalement (la tour en bois et sa roue) juste au-dessus, la cabane du mineur, et
        // le tas de minerai sorti du trou.
        const roc = type === "mineCharbon" ? ["#4a4e5a", "#25272d", "#0d0e10"] : type === "mineFer" ? ["#c97a50", "#a8603e", "#6e3a22"] : ["#fff1a0", "#f2c230", "#b8860b"];
        boite(ctx, x - 15, y - 9, { a: 9, h: 10, toit: 9, murG: "#a87443", murD: "#865a31", toitA: type === "mineOr" ? "#c9a636" : type === "mineFer" ? "#9a5a3a" : "#555a60", toitB: "#43474c", mur: "rondins", toitSorte: "bardeaux", fenetres: 1, cheminee: 0.6 }, 1, true);
        const px = x - 2, py = y + 3; // le puits
        forme(ctx, [[px - 13, py], [px, py + 6.5], [px + 13, py], [px, py - 6.5]], "#8d8579"); // le bord en pierre
        forme(ctx, [[px - 9, py], [px, py + 4.5], [px + 9, py], [px, py - 4.5]], "#120f0c"); // le trou, tout noir
        forme(ctx, [[px - 9, py], [px, py - 4.5], [px + 9, py], [px + 9, py + 2.5], [px, py - 2], [px - 9, py + 2.5]], "#2a221b"); // la paroi du fond
        ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(px - 13, py); ctx.lineTo(px, py + 6.5); ctx.lineTo(px + 13, py); ctx.stroke(); // les planches du bord
        // le chevalement, à cheval sur le puits
        const hc = 46, haut = [px, py - hc];
        poutre(ctx, [px - 11, py + 1], [px - 1, py - hc], 2.6); poutre(ctx, [px + 11, py + 1], [px + 1, py - hc], 2.6);
        poutre(ctx, [px - 7.5, py - hc * 0.35], [px + 7.5, py - hc * 0.35], 1.6); poutre(ctx, [px - 4, py - hc * 0.7], [px + 4, py - hc * 0.7], 1.6);
        poutre(ctx, [px + 22, py + 6], [px + 1, py - hc * 0.85], 1.8);
        const tourne = travail ? t * 4 : 0;
        ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(px + 3, haut[1] - 2); ctx.lineTo(px + 3, py - 1 - (travail ? (Math.sin(t * 1.5) + 1) * 6 : 0)); ctx.stroke(); // le câble qui descend
        roue(ctx, haut[0], haut[1] - 2, 8, tourne, "#5a5f68", 6, false);
        // le tas de minerai sorti du trou
        ctx.beginPath(); ctx.ellipse(x + 17, y + 6, 10, 5, 0, Math.PI, 0); ctx.lineTo(x + 27, y + 7); ctx.ellipse(x + 17, y + 7, 10, 3, 0, 0, Math.PI); ctx.closePath(); ctx.fillStyle = "#7a6a58"; ctx.fill(); contour(ctx, 1.4);
        for (const [dx, dy, r] of [[-5, 3, 2.6], [1, 1, 3], [6, 4, 2.4], [-1, 5, 2.2], [3, -1.5, 2]]) facettes(ctx, x + 17 + dx, y + dy, r, roc[0], roc[1], roc[2], type === "mineCharbon" ? "rgba(190, 210, 255, .9)" : null);
        if (travail && Math.sin(t * 10) > 0.6) { ctx.fillStyle = "#ffcf2e"; ctx.beginPath(); ctx.arc(px, py, 1.6, 0, TOUR); ctx.fill(); lumiere(px, py, 14, "orange", 0.8); } // la lampe du mineur, au fond
        return [haut[0], haut[1] - 12];
      }
      case "marche": { // 3 étals avec des toiles rayées de couleurs différentes : pas de maison
        const etal = (ex, ey, c1, c2, fruits) => {
          bloc(ctx, ex, ey, 9, 6, "#c48f5d", "#a2703f", "#865a31", false);
          for (let k = 0; k < 3; k++) rond(ctx, ex - 4 + k * 4, ey - 7.5 + (k - 1) * 0.6, 1.9, fruits[k]);
          poteau(ctx, [ex - 9, ey], 17, 1.4); poteau(ctx, [ex + 9, ey], 17, 1.4); poteau(ctx, [ex, ey - 4.5], 21, 1.4);
          const n = 5;
          for (let k = 0; k < n; k++) { const a = entre([ex - 11, ey - 17], [ex, ey - 11.5], k / n), c = entre([ex - 11, ey - 17], [ex, ey - 11.5], (k + 1) / n); forme(ctx, [a, c, [c[0] + 11, c[1] - 6.5], [a[0] + 11, a[1] - 6.5]], k % 2 ? c2 : c1); }
          for (let k = 0; k < n; k++) { const a = entre([ex, ey - 11.5], [ex + 11, ey - 17], k / n), c = entre([ex, ey - 11.5], [ex + 11, ey - 17], (k + 1) / n); forme(ctx, [a, c, [c[0] - 11, c[1] - 6.5], [a[0] - 11, a[1] - 6.5]], k % 2 ? c2 : c1); }
        };
        etal(x - 2, y - 9, "#3f6fc4", "#f4efe4", ["#e8402e", "#ffcf2e", "#4fc25a"]);
        etal(x - 15, y + 2, "#d9553b", "#f4efe4", ["#ffcf2e", "#ff9a2e", "#e8402e"]);
        etal(x + 12, y + 3, "#e8b830", "#f4efe4", ["#4fc25a", "#8a3a2a", "#ffcf2e"]);
        // la balance du marchand, qui se balance doucement
        const p = Math.sin(t * 1.5) * 2;
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 1, y + 14); ctx.lineTo(x - 1, y + 4); ctx.moveTo(x - 7, y + 4 + p); ctx.lineTo(x + 5, y + 4 - p); ctx.stroke();
        ctx.fillStyle = "#ffcf2e"; ctx.beginPath(); ctx.arc(x - 7, y + 6 + p, 2, 0, Math.PI); ctx.arc(x + 5, y + 6 - p, 2, 0, Math.PI); ctx.fill();
        return [x - 2, y - 32];
      }
      case "monument": {
        // Étape 31 : 🏛️ le Grand Beffroi grandit à chaque palier (b.palier : 0 à 4 ; l'aperçu le montre fini)
        const p = b ? b.palier || 0 : 4;
        const echafaudage = (P, h, l) => { for (const dx of [-l, 0, l]) poteau(ctx, [P[0] + dx, P[1] + Math.abs(dx) * 0.2], h, 1.3); for (let v = 0.3; v < 1; v += 0.33) poutre(ctx, [P[0] - l, P[1] + l * 0.2 - h * v], [P[0] + l, P[1] + l * 0.2 - h * v], 1.4, "#c9965a"); };
        // le socle en pierre (toujours) : 3 marches
        bloc(ctx, x, y + 2, 27, 3, "#d8d2c6", "#b8b2a6", "#99938a", false);
        bloc(ctx, x, y - 1, 23, 3, "#e2ddd2", "#c4beb2", "#a6a094", false);
        if (p === 0) { // les fondations : des pierres taillées empilées et des échafaudages
          bloc(ctx, x - 8, y - 4, 7, 6, "#e8e5de", "#c4c0b6", "#a5a197", true); bloc(ctx, x + 9, y - 2, 6, 5, "#e8e5de", "#c4c0b6", "#a5a197", true);
          echafaudage([x + 2, y - 4], 26, 9);
          return [x, y - 34];
        }
        // la tour, derrière (palier 2 : à moitié, avec échafaudage ; 3 et plus : finie, avec son dôme doré)
        if (p >= 2) {
          const s = tourRonde(ctx, x + 4, y - 14, { r: 9, h: p >= 3 ? 52 : 28, ht: 14, clair: "#f4efe4", fonce: "#bdb5a5", pierre: true, toit: p >= 3 ? "dome" : null, toitA: "#ffe27a", toitB: "#c99a1e", dessus: "#cfc8ba" });
          if (p >= 3) { // la flèche et le drapeau
            ctx.strokeStyle = "#8a6a2a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(s[0], s[1] - 12); ctx.stroke();
            drapeau(ctx, s[0], s[1] - 12, t, Village.Boutique.COULEURS_DRAPEAU[(Village.monde && Village.monde.drapeau) || 0]);
            // l'horloge du beffroi
            ctx.beginPath(); ctx.arc(x + 1, y - 46, 4.5, 0, TOUR); ctx.fillStyle = "#fbf6ee"; ctx.fill(); contour(ctx, 1.2);
            ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x + 1, y - 46); ctx.lineTo(x + 1 + Math.cos(t * 0.5) * 3, y - 46 + Math.sin(t * 0.5) * 3); ctx.moveTo(x + 1, y - 46); ctx.lineTo(x + 1, y - 49); ctx.stroke();
          } else echafaudage([x + 4, y - 14], 40, 8);
        }
        // la grande salle, devant
        const m2 = Object.assign({}, m, { h: p >= 2 ? 20 : 12, toitForme: p >= 3 ? "pavillon" : "plat", toitA: p >= 3 ? "#3f6fc4" : "#cfc8ba", toitB: p >= 3 ? "#2f569c" : "#b8b0a0", fenetres: p >= 2 ? 2 : 0 });
        const sommet = boite(ctx, x - 3, y + 1, m2, 1, true);
        const c = coins(x - 3, y + 1, m2);
        if (p >= 2) { // les colonnes et le fronton, sur la façade de gauche
          for (let k = 0; k < 5; k++) { const P = surMur(c.G, c.B, m2.h, 0.1 + k * 0.2, 0), Q = [P[0] - 5, P[1] + 2.5]; ctx.strokeStyle = CONTOUR; ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] - m2.h * 0.85); ctx.stroke(); ctx.strokeStyle = "#fbf8f0"; ctx.lineWidth = 3; ctx.stroke(); }
          const P0 = surMur(c.G, c.B, m2.h, 0.02, 0.85), P1 = surMur(c.G, c.B, m2.h, 0.98, 0.85);
          forme(ctx, [[P0[0] - 6, P0[1] + 3], [P1[0] - 4, P1[1] + 4], [(P0[0] + P1[0]) / 2 - 5, (P0[1] + P1[1]) / 2 - 8]], "#efe9dc");
          if (p >= 3) forme(ctx, [[(P0[0] + P1[0]) / 2 - 5, (P0[1] + P1[1]) / 2 - 4.5], [(P0[0] + P1[0]) / 2 - 2, (P0[1] + P1[1]) / 2 - 2], [(P0[0] + P1[0]) / 2 - 5, (P0[1] + P1[1]) / 2 + 0.5], [(P0[0] + P1[0]) / 2 - 8, (P0[1] + P1[1]) / 2 - 2]], "#ffcf2e"); // l'étoile d'or
        } else echafaudage([x - 3, y], 22, 12);
        porte(ctx, x - 3, y + 1, m2, "#7a4a2a");
        if (p >= 4) { // la fête : une statue, des bannières, et des feux d'artifice de temps en temps
          bloc(ctx, x + 16, y + 9, 3.5, 4, "#d8d2c6", "#b8b2a6", "#99938a", false);
          ctx.fillStyle = "#c9a636"; ctx.beginPath(); ctx.ellipse(x + 16, y + 1, 1.8, 4, 0, 0, TOUR); ctx.fill(); contour(ctx, 0.8); rond(ctx, x + 16, y - 4, 1.7, "#c9a636");
          ["#d9553b", "#3f6fc4", "#e8b830", "#4fc25a"].forEach((col, k) => { const P = surMur(c.B, c.D, m2.h, 0.15 + k * 0.23, 0.95), o = Math.sin(t * 2 + k) * 0.8; forme(ctx, [[P[0] - 1.6, P[1]], [P[0] + 1.6, P[1] - 0.8], [P[0] + 1.6 + o, P[1] + 8], [P[0] + o, P[1] + 10], [P[0] - 1.6 + o, P[1] + 8.8]], col); });
          const ph = (t * 0.4 + num * 0.13) % 1;
          if (ph < 0.35) { const r = ph * 40, fx = x + (num % 2 ? 10 : -12), fy = y - 70 - ph * 20; ["#ff6b6b", "#ffd84a", "#7fd6ff", "#b98ae8"].forEach((col, k) => { ctx.fillStyle = col; for (let j = 0; j < 6; j++) { const a = (j / 6) * TOUR + k * 0.4; ctx.globalAlpha = 1 - ph * 2.5; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * r * (0.6 + k * 0.15), fy + Math.sin(a) * r * (0.6 + k * 0.15), 1.4, 0, TOUR); ctx.fill(); } }); ctx.globalAlpha = 1; }
        }
        return p >= 3 ? [x + 4, y - 96] : sommet;
      }
      case "faneur": { // un grand hangar OUVERT, plein de foin, avec un toit de grange
        bloc(ctx, x, y, 16, 11, vue.hiver ? "#e8eef5" : "#e8c64a", "#d9b23a", "#b8962e", false);
        if (vue.fin) { ctx.strokeStyle = "rgba(140, 110, 30, .5)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 4; k++) { const A = surMur([x - 16, y], [x, y + 8], 11, k / 4, 0), C = surMur([x, y + 8], [x + 16, y], 11, k / 4, 0); ctx.moveTo(A[0], A[1] - 1); ctx.lineTo(A[0], A[1] - 10); ctx.moveTo(C[0], C[1] - 1); ctx.lineTo(C[0], C[1] - 10); } ctx.stroke(); }
        for (const P of [G, B, D]) poteau(ctx, P, m.h, 2.2);
        boite(ctx, x, y, Object.assign({}, m, { ouvert: true }), 1, true);
        return null;
      }
      case "forestier": { // une serre en verre, avec des jeunes arbres dedans
        for (let k = 0; k < 6; k++) { const px = x - 10 + (k % 3) * 9, py = y - 3 + Math.floor(k / 3) * 6 - (k % 3) * 1; forme(ctx, [[px - 3.5, py + 3], [px, py - 9], [px + 3.5, py + 3]], k % 2 ? "#3a9d55" : "#4fb556"); }
        boite(ctx, x, y, Object.assign({}, m, { murG: "rgba(200, 236, 245, .45)", murD: "rgba(160, 210, 228, .5)", toitA: "rgba(215, 244, 252, .55)", toitB: "rgba(170, 220, 236, .6)", mur: "verre", toitSorte: "verre", fenetres: 0 }), 1, true);
        porte(ctx, x, y, m, "#3a8e3e");
        return null;
      }
    }
    // --- les autres : la boîte, avec des morceaux devant ou derrière
    const avant = { // ce qui est DERRIÈRE le bâtiment (dessiné avant lui)
      ferme: () => tourRonde(ctx, x + 18, y - 8, { r: 7.5, h: 34, ht: 7, clair: "#d8d2c4", fonce: "#9a9282", toit: "dome", toitA: "#8a9aa8", toitB: "#5a6a78", bandes: "rgba(90, 80, 70, .5)" }),
      orfevre: () => tourRonde(ctx, x + 13, y - 9, { r: 7.5, h: 36, ht: 15, clair: "#efe8d8", fonce: "#b5ab98", pierre: true, toit: "bulbe", toitA: "#ffe27a", toitB: "#c99a1e" }),
      charcuterie: () => boite(ctx, x - 12, y - 9, { a: 8, h: 32, toit: 10, murG: "#8a7a6a", murD: "#6a5a4c", toitA: "#5a3a2a", toitB: "#3f281c", mur: "pierre", toitSorte: "ardoise", toitForme: "pavillon" }, 1, true),
      fonderie: () => { bloc(ctx, x - 12, y - 10, 6, 70, "#5a3a2a", "#a8553a", "#7a3a28", false); ctx.strokeStyle = "rgba(255, 230, 200, .35)"; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 1; k < 9; k++) { ctx.moveTo(x - 18, y - 10 - k * 8); ctx.lineTo(x - 12, y - 7 - k * 8); ctx.lineTo(x - 6, y - 10 - k * 8); } ctx.stroke(); },
      forge: () => { bloc(ctx, x - 6, y - 6, 7, 40, "#3f3a36", "#8b8f96", "#6d7178", true); forme(ctx, [[x - 15, y - 44], [x - 6, y - 40], [x + 3, y - 44], [x + 1, y - 49], [x - 6, y - 52], [x - 13, y - 49]], "#55595f"); },
      tisserand: () => { // un grand séchoir où pendent des tissus de couleur, qui flottent au vent
        const sx = x + 4, sy = y - 16;
        poteau(ctx, [sx - 16, sy + 6], 46, 2); poteau(ctx, [sx + 16, sy - 6], 46, 2); poutre(ctx, [sx - 16, sy - 40], [sx + 16, sy - 52], 2);
        ["#7a5ab0", "#e8b830", "#d9553b", "#3f8a8a"].forEach((c, k) => { const u = (k + 0.5) / 4, px = sx - 16 + u * 32, py = sy - 40 - u * 12, o = Math.sin(t * 2 + k) * 2; forme(ctx, [[px - 3, py + 1], [px + 3, py - 1], [px + 3 + o, py + 30], [px - 3 + o, py + 32]], c); });
      },
      universite: null,
      etable: null,
      laiterie: () => { for (const [dx, dy] of [[-5, 0], [5, 0], [0, -3], [0, 3]]) poteau(ctx, [x + 22 + dx, y - 6 + dy], 14, 1.6); tourRonde(ctx, x + 22, y - 20, { r: 7, h: 13, ht: 5, clair: "#e8eef2", fonce: "#9aa6ae", toit: "dome", toitA: "#cfd8de", toitB: "#8a969e", bandes: "rgba(90, 100, 110, .6)" }); },
    };
    if (avant[type]) avant[type]();
    if (m.pilotis) { // sur pilotis (le pêcheur, le poulailler)
      const p = m.pilotis;
      for (const P of [G, B, D]) poteau(ctx, P, p, 2);
      forme(ctx, [[G[0] - 4, G[1] - p], [B[0], B[1] + 2 - p], [D[0] + 4, D[1] - p], [H[0], H[1] - 2 - p], [H[0], H[1] - 2 - p + 2.5], [D[0] + 4, D[1] - p + 2.5], [B[0], B[1] + 2 - p + 2.5], [G[0] - 4, G[1] - p + 2.5]], "#9a6a3c");
      forme(ctx, [[G[0] - 4, G[1] - p], [B[0], B[1] + 2 - p], [D[0] + 4, D[1] - p], [H[0], H[1] - 2 - p]], "#c48f5d");
      y -= p;
    }
    const sommet = boite(ctx, x, y, m, 1, true);
    const c = coins(x, y, m);
    if (m.porteGrange) porteGrange(ctx, c.G, c.B, m.h, 0.5, m.porteGrange); else porte(ctx, x, y, m);
    if (m.pilotis) { // la passerelle pour monter
      const p = m.pilotis, px = x - m.a * 0.45, py = y + m.a / 4 * 1.1 + 2;
      forme(ctx, [[px - 4, py], [px + 4, py + 2], [px - 6, py + p + 9], [px - 14, py + p + 7]], "#b07740");
      if (vue.fin) { ctx.strokeStyle = "rgba(60, 35, 15, .6)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 5; k++) { const a = entre([px - 4, py], [px - 14, py + p + 7], k / 5), d = entre([px + 4, py + 2], [px - 6, py + p + 9], k / 5); ctx.moveTo(a[0], a[1]); ctx.lineTo(d[0], d[1]); } ctx.stroke(); }
    }
    const apres = { // ce qui est DEVANT le bâtiment (dessiné après lui)
      universite: () => { // un dôme sur le toit plat, et des colonnes devant
        const ctop = sommet || [x, y - m.h];
        for (let k = 0; k < 5; k++) { const P = surMur(c.G, c.B, m.h, 0.1 + k * 0.2, 0); const Q = [P[0] - 4, P[1] + 2]; ctx.strokeStyle = CONTOUR; ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(Q[0], Q[1]); ctx.lineTo(Q[0], Q[1] - m.h * 0.8); ctx.stroke(); ctx.strokeStyle = "#fbf8f0"; ctx.lineWidth = 2.8; ctx.stroke(); }
        const P0 = surMur(c.G, c.B, m.h, 0.02, 0.8), P1 = surMur(c.G, c.B, m.h, 0.98, 0.8);
        forme(ctx, [[P0[0] - 5, P0[1] + 2], [P1[0] - 3, P1[1] + 3], [(P0[0] + P1[0]) / 2 - 4, (P0[1] + P1[1]) / 2 - 7]], "#efe9dc"); // le fronton
        const s2 = tourRonde(ctx, ctop[0], ctop[1] + 4, { r: 11, h: 7, ht: 13, clair: "#efe9dc", fonce: "#b8b0a0", toit: "dome", toitA: "#5f8fe4", toitB: "#2f569c" });
        ctx.strokeStyle = "#7a5a30"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(s2[0] + 2, s2[1] + 4); ctx.lineTo(s2[0] + 11, s2[1] - 4); ctx.stroke(); ctx.lineCap = "butt"; // le télescope
        return [s2[0], s2[1] - 6];
      },
      scierie: () => { ctx.fillStyle = "rgba(80, 150, 210, .75)"; forme(ctx, [[c.G[0] - 14, c.G[1] + 9], [c.G[0] - 4, c.G[1] + 14], [c.G[0] + 2, c.G[1] + 11], [c.G[0] - 8, c.G[1] + 6]], "rgba(90, 160, 220, .85)"); roue(ctx, c.G[0] - 3, c.G[1] - 4, 15, travail ? -t * 2 : 0, "#6b4423", 8, true); },
      bucheron: () => tasDeBuches(ctx, c.B[0] + 3, c.B[1] + 3, 0),
      ferme: null,
      etable: () => { const s = sommet || [x, y - m.h - m.toit]; boite(ctx, s[0], s[1] + 4, { a: 5, h: 6, toit: 7, murG: "#f4efe4", murD: "#d2cbbd", toitA: m.toitA, toitB: m.toitB, toitForme: "pavillon", fenetres: 0 }, 1, true); },
      boulangerie: () => { // le grand four à pain, rond, en briques
        const fx = c.D[0] + 4, fy = c.D[1] + 8;
        ctx.beginPath(); ctx.ellipse(fx, fy, 11, 11, 0, Math.PI, 0); ctx.ellipse(fx, fy, 11, 5.5, 0, 0, Math.PI); ctx.closePath();
        const g = ctx.createLinearGradient(fx - 11, 0, fx + 11, 0); g.addColorStop(0, "#d9785a"); g.addColorStop(1, "#9a4a32"); ctx.fillStyle = g; ctx.fill(); contour(ctx, 1.6);
        if (vue.fin) { ctx.strokeStyle = "rgba(60, 20, 10, .35)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = 1; k < 4; k++) ctx.ellipse(fx, fy, 11 * Math.cos((k * Math.PI) / 8), 11 * Math.sin((k * Math.PI) / 8) + 0.01, 0, Math.PI, 0); ctx.stroke(); }
        const lueur = travail ? 0.6 + 0.4 * Math.sin(t * 7) : 0.2;
        ctx.beginPath(); ctx.arc(fx - 3, fy + 3, 4.5, Math.PI, 0); ctx.closePath(); ctx.fillStyle = "rgba(255, " + Math.round(120 + 60 * lueur) + ", 40, " + (0.5 + lueur * 0.5) + ")"; ctx.fill(); contour(ctx, 1);
        lumiere(fx - 3, fy + 2, 22, "orange", lueur);
        forme(ctx, [[fx + 3, fy - 9], [fx + 7, fy - 8], [fx + 7, fy - 17], [fx + 3, fy - 18]], "#8a4a32");
        if (travail) fumee(ctx, fx + 5, fy - 21, t);
      },
      cremerie: () => auventRaye(ctx, c.G, c.B, m.h, 0.12, 0.88, "#d96aa0", "#fbf6ee"),
      tailleur: () => auventRaye(ctx, c.G, c.B, m.h * 0.5, 0.12, 0.88, "#3f8a8a", "#f4efe4"),
      veterinaire: () => { poteau(ctx, surMur(c.G, c.B, m.h, 0.05, 0), m.h * 0.75, 1.6); const a = surMur(c.G, c.B, m.h, 0, 0.78), d = surMur(c.G, c.B, m.h, 0.75, 0.78); forme(ctx, [[a[0] - 8, a[1] + 6], [d[0] - 8, d[1] + 6], d, a], "#4f9e3e"); },
      macon: () => { // un échafaudage sur le mur de droite, qui dépasse du toit
        const o = [5, 2.5];
        for (const u of [0.08, 0.5, 0.92]) { const P = surMur(c.B, c.D, m.h, u, 0); poteau(ctx, [P[0] + o[0], P[1] + o[1]], m.h + m.toit + 6, 1.5); }
        for (const v of [0.45, 1.05, 1.6]) { const P = surMur(c.B, c.D, m.h, 0.02, v), Q = surMur(c.B, c.D, m.h, 0.98, v); poutre(ctx, [P[0] + o[0], P[1] + o[1]], [Q[0] + o[0], Q[1] + o[1]], 2.2, "#c9965a"); }
      },
      laiterie: () => { for (let k = 0; k < 3; k++) objetPorte(ctx, "lait", c.D[0] - 2 + k * 3.5, c.D[1] + 14 - k * 1.6); },
      fonderie: () => { // le haut-fourneau, en briques, qui rougeoie en haut
        const s = tourRonde(ctx, x - 22, y + 4, { r: 10, rh: 6.5, h: 24, clair: "#c46a48", fonce: "#7a3a28", dessus: travail ? "#ffb040" : "#4a2a1e" });
        if (travail) { lumiere(s[0], s[1], 26, "orange", 0.9); fumee(ctx, s[0], s[1] - 6, t); }
      },
      geologue: () => cristaux(ctx, c.D[0] + 4, c.D[1] + 12, t),
    };
    let s = sommet;
    if (apres[type]) s = apres[type]() || s;
    return s;
  }

  function dessinerBatiment(ctx, b, x, y, t) {
    const m = MODELES[b.type];
    const souleve = Village.monde && Village.monde.projet && Village.monde.projet.deplacer === b; // étape 12
    const n = Bt().tailleDe(b); // étape 28 : la taille de son bloc
    const s = echelleTaille(b.type, n) * (1 + 0.07 * niveauDe(b)); // étape 23 : un bâtiment amélioré est un peu plus grand
    const x0 = x; x += decalageTaille(n); // étape 24 : le milieu du bloc
    if (souleve) { ctx.save(); ctx.globalAlpha = 0.4; aLaLoupe(ctx, x, y - 6, s, () => dessinerBatimentDedans(ctx, b, x, y - 6, t, m)); ctx.restore(); return; }
    // Étape 22 et 24 : les champs et les enclos, sur le sol, à la taille des cases (pas à la loupe)
    if (b.etat === "pret" && b.emprise && b.emprise.length) empriseDessin(ctx, b, x0, y, t);
    // Étape 14 : ✍️ le bâtiment est dessiné plus GROS (à la loupe) ; ses ouvriers restent à la taille des autres
    aLaLoupe(ctx, x, y, s, () => dessinerBatimentDedans(ctx, b, x, y, t, m));
    if (b.etat === "pret") ouvrierDevant(ctx, b, x, y, t, s);
  }
  // Étape 23 : ✍️ « le bâtiment change en fonction de son niveau, pour qu'on repère ceux qu'on a oublié d'améliorer ».
  //   niveau 1 (1 amélioration) : un socle en pierre, des volets et une lanterne ;
  //   niveau 2 (2 améliorations) : en plus, des murs plus hauts, un plus beau toit et une girouette.
  // (Pour l'entrepôt, c'est son agrandissement qui compte.)
  const niveauDe = (b) => Math.min(2, b.type === "entrepot" ? (b.niveau || 1) - 1 : b.ameliorations || 0);
  function modeleNiveau(m, n) {
    if (!n) return m;
    const v = Object.assign({}, m, { socle: true, lanterne: true, volets: m.volets || "#3f7a4a" });
    if (n >= 2) Object.assign(v, { girouette: true, h: m.h * 1.12, toitSorte: m.toitSorte === "paille" ? "bardeaux" : m.toitSorte === "bardeaux" ? "tuiles" : m.toitSorte, cheminee: m.cheminee || 0.7 });
    return v;
  }
  function dessinerBatimentDedans(ctx, b, x, y, t, m) {
    if (b.etat === "pret") m = modeleNiveau(m, niveauDe(b));
    ombre(ctx, x, y, m.a);
    if (b.etat === "chantier") return chantier(ctx, b, x, y, m, t);
    if (b.type === "entrepot") { cour(ctx, x, y, (Village.monde && Village.monde.stock) || {}); silo(ctx, x - 24, y - 12, Village.monde ? Village.monde.reserve.niveau : 1); } // étape 9 : la cour ; étape 11 : le silo
    if (m.linge && vue.fin && !vue.hiver) linge(ctx, x - m.a - 12, y - 2, t); // étape 9
    if (b.type === "ferme" && !aDesChamps(b)) champs(ctx, x, y, t); // étape 11 (une ferme sans place pour ses champs)
    // (Étape 24 : les champs et les enclos sont dessinés avant, dans dessinerBatiment.)
    const sommet = structure(ctx, b.type, x, y, m, t, b); // étape 25 : la boîte, ou une autre forme
    const yBulle = sommet ? Math.min(sommet[1] - 6, y - m.h - m.toit - 18) : y - m.h - m.toit - 18; // au-dessus du plus haut
    const travaille = b.ouvrier && b.ouvrier.etat === "travailler";
    // Étape 9 : la cheminée fume quand quelqu'un habite là (ou travaille)
    const habite = b.type === "entrepot" || b.type === "maison" || b.type === "hutte" || !!b.ouvrier;
    if (m.cheminee && habite && m.fumeeX !== undefined) fumee(ctx, x + m.fumeeX, y + m.fumeeY, t + b.numero);
    if (m.feu && b.travail) lumiere(x + 7, y - 2, 30, "orange", 1); // la lueur du four
    switch (b.type) {
      case "entrepot":
        // Étape 9 : les ânes qui attendent à côté de l'entrepôt (avec la recherche « Ânes et charrettes »)
        if (Village.monde && Village.Recherches.bonus(Village.monde, "chargement") > 1) {
          const auRepos = Village.monde.porteurs.filter((p) => p.etat === "attend" && !p.parti).length;
          for (let k = 0; k < Math.min(2, auRepos); k++) ane(ctx, x + 28 + k * 8, y - 8 + k * 7, t + k * 2, false);
        }
        // Le drapeau du village sur le toit
        drapeau(ctx, x - 6, y - 50, t, Village.Boutique.COULEURS_DRAPEAU[(Village.monde && Village.monde.drapeau) || 0]); // étape 7 : la couleur achetée
        break;
      case "bucheron":
        pile(ctx, x + 14, y + 8, "rondin", b.sortie); // les troncs qui attendent un porteur
        // Une hache plantée dans une souche
        rond(ctx, x - 22, y + 10, 4, "#c78b4a");
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 22, y + 7); ctx.lineTo(x - 18, y - 3); ctx.stroke();
        forme(ctx, [[x - 23, y + 7], [x - 19, y + 5], [x - 20, y + 10]], "#c9ccd1");
        break;
      case "forestier":
        // Un petit sapin dans un pot, devant la porte
        forme(ctx, [[x + 14, y + 12], [x + 20, y + 12], [x + 19, y + 6], [x + 15, y + 6]], "#c4622f");
        forme(ctx, [[x + 11, y + 6], [x + 17, y - 6], [x + 23, y + 6]], "#3a9d55");
        break;
      case "scierie": {
        pile(ctx, x + 16, y + 10, "planche", b.sortie);
        pile(ctx, x - 20, y + 12, "rondin", b.entrees.troncs || 0); // les troncs en réserve
        // La grande lame de scie, qui tourne quand on scie
        const angle = b.travail ? t * 12 : 0, cx = x + 12, cy = y - 8;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
        ctx.beginPath();
        for (let k = 0; k < 16; k++) {
          const r = k % 2 ? 7 : 9, a = (k / 16) * TOUR;
          k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fillStyle = "#d8dce2"; ctx.fill(); contour(ctx, 1.4);
        ctx.restore();
        rond(ctx, cx, cy, 2, "#7a7f88");
        if (b.travail) sciure(ctx, cx, cy, t);
        break;
      }
      case "carriere":
        pile(ctx, x + 14, y + 9, "pierre", b.sortie);
        // Une pioche posée contre le mur
        ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 20, y + 9); ctx.lineTo(x - 16, y - 6); ctx.stroke();
        ctx.strokeStyle = "#7a7f88"; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x - 22, y - 4); ctx.quadraticCurveTo(x - 16, y - 9, x - 10, y - 5); ctx.stroke();
        break;
    }
    if (b.type === "pecheur") {
      pile(ctx, x + 14, y + 9, "poisson", b.sortie);
      // Un filet de pêche accroché au mur
      ctx.strokeStyle = "rgba(60, 40, 20, .7)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) { ctx.moveTo(x + 4 + k * 3, y - 3 + k * 1.5); ctx.lineTo(x + 4 + k * 3, y - 11 + k * 1.5); }
      for (let k = 0; k < 3; k++) { ctx.moveTo(x + 4, y - 4 - k * 3); ctx.lineTo(x + 13, y + 0.5 - k * 3); }
      ctx.stroke();
    } else if (b.type === "universite") {
      // Étape 7 : la tour et son télescope ; étape 25 : le dôme et les colonnes (voir structure)
      const etudie = Village.monde && Village.monde.recherches.enCours;
      if (etudie && Math.sin(t * 4) > 0 && sommet) { ctx.fillStyle = "#fff36b"; ctx.beginPath(); ctx.arc(sommet[0] + 14, sommet[1] - 2, 2, 0, TOUR); ctx.fill(); } // une étoile : il cherche !
      if (etudie) bulleDePensee(ctx, x - 10, yBulle - 4, t, Village.Recherches.trouver(etudie.id).emoji);
    } else if (b.type === "moulin") {
      // Étape 11 : les ailes ; étape 25 : plus grandes, sur une tour ronde (voir structure)
      pile(ctx, x + 14, y + 10, "farine", b.sortie);
      pile(ctx, x - 20, y + 12, "ble", b.entrees.ble || 0);
    } else if (b.type === "boulangerie") {
      // Étape 11 : des pains sur l'étal ; étape 25 : le four est maintenant un grand four rond, dehors (voir structure)
      forme(ctx, [[x + 14, y + 12], [x + 26, y + 6], [x + 26, y + 4], [x + 14, y + 10]], "#9a6a3c"); // l'étal
      for (let k = 0; k < Math.min(3, b.sortie); k++) miche(ctx, x + 17 + k * 3.5, y + 8 - k * 1.8);
      pile(ctx, x - 22, y + 12, "farine", b.entrees.farine || 0);
      pile(ctx, x - 14, y + 16, "rondin", b.entrees.troncs || 0);
    } else if (b.type === "orfevre") {
      // Étape 11 : une enseigne en forme de bague, et des éclats qui brillent quand l'orfèvre travaille
      bijou(ctx, x + 12, y - m.h - 2);
      if (b.travail && Math.sin(t * 6) > 0.3) { ctx.strokeStyle = "#fff6b0"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 18, y - 4); ctx.lineTo(x + 22, y - 4); ctx.moveTo(x + 20, y - 6); ctx.lineTo(x + 20, y - 2); ctx.stroke(); }
      pile(ctx, x - 22, y + 12, "or", b.entrees.or || 0);
      pile(ctx, x - 14, y + 16, "charbon", b.entrees.charbon || 0);
      pile(ctx, x + 14, y + 10, "bijoux", b.sortie);
    } else if (b.type === "macon") {
      // Étape 12 : une échelle contre le mur, une pile de tuiles et un seau de mortier
      ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.4; ctx.beginPath();
      ctx.moveTo(x + 13, y + 6); ctx.lineTo(x + 17, y - 22); ctx.moveTo(x + 18, y + 8); ctx.lineTo(x + 22, y - 20);
      for (let k = 1; k < 7; k++) { const yy = y + 6 - k * 4.2; ctx.moveTo(x + 13 + k * 0.57, yy); ctx.lineTo(x + 18 + k * 0.57, yy + 2); }
      ctx.stroke();
      for (let k = 0; k < 3; k++) forme(ctx, [[x - 24, y + 12 - k * 2], [x - 18, y + 15 - k * 2], [x - 12, y + 12 - k * 2], [x - 18, y + 9 - k * 2]], "#c8503a");
      forme(ctx, [[x - 6, y + 16], [x - 1, y + 16], [x, y + 11], [x - 7, y + 11]], "#8b9099");
      pile(ctx, x + 2, y + 18, "outils", b.entrees.outils || 0);
    } else if (b.type === "ferme") {
      pile(ctx, x + 2, y + 16, "ble", b.sortie);
      // une meule de foin
      ctx.beginPath(); ctx.ellipse(x - 20, y + 2, 6, 5, 0, Math.PI, 0); ctx.lineTo(x - 14, y + 4); ctx.lineTo(x - 26, y + 4); ctx.closePath(); ctx.fillStyle = vue.hiver ? "#f4f8ff" : "#e8c64a"; ctx.fill(); contour(ctx, 1.2);
    } else if (b.type === "puits") {
      // Étape 15 : un vrai puits en pierre, avec son petit toit, sa manivelle et son seau qui monte et descend
      const px = x + 14, py = y + 8;
      ctx.beginPath(); ctx.ellipse(px, py, 6, 3, 0, 0, Math.PI); ctx.lineTo(px - 6, py - 5); ctx.ellipse(px, py - 5, 6, 3, 0, Math.PI, 0, true); ctx.closePath(); ctx.fillStyle = "#a3a8ad"; ctx.fill(); contour(ctx, 1.2);
      ctx.beginPath(); ctx.ellipse(px, py - 5, 6, 3, 0, 0, TOUR); ctx.fillStyle = "#b8bcc0"; ctx.fill(); contour(ctx, 1.2);
      ctx.beginPath(); ctx.ellipse(px, py - 5, 4.2, 2, 0, 0, TOUR); ctx.fillStyle = vue.hiver ? "#cfe3f2" : "#2f5c8c"; ctx.fill();
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(px - 6, py - 5); ctx.lineTo(px - 6, py - 18); ctx.moveTo(px + 6, py - 5); ctx.lineTo(px + 6, py - 18); ctx.stroke();
      forme(ctx, [[px - 9, py - 17], [px, py - 23], [px + 9, py - 17], [px, py - 14]], "#3f7ac4"); // le petit toit
      const monte = b.travail ? (Math.sin(t * 2.4) + 1) / 2 : 1, sy = py - 7 - monte * 8;
      ctx.strokeStyle = "#c9a26a"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(px, py - 15); ctx.lineTo(px, sy - 2); ctx.stroke();
      if (vue.fin) objetPorte(ctx, "eau", px, sy);
      ctx.strokeStyle = "#5a5f68"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(px + 6, py - 15); ctx.lineTo(px + 6 + Math.cos(t * 2.4 * (b.travail ? 1 : 0)) * 3, py - 15 + Math.sin(t * 2.4 * (b.travail ? 1 : 0)) * 3); ctx.stroke(); // la manivelle
      pile(ctx, x - 22, y + 12, "eau", b.sortie);
    } else if (b.type === "faneur") {
      // Étape 15 : deux meules de foin, un râteau, et les bottes qui attendent un porteur
      for (const [mx, my, r] of [[x + 16, y + 6, 6], [x + 23, y + 11, 4.5]]) {
        ctx.beginPath(); ctx.ellipse(mx, my, r, r * 0.9, 0, Math.PI, 0); ctx.lineTo(mx + r, my + 2); ctx.lineTo(mx - r, my + 2); ctx.closePath(); ctx.fillStyle = vue.hiver ? "#f4f8ff" : "#d9c35a"; ctx.fill(); contour(ctx, 1.2);
        if (vue.fin && !vue.hiver) { ctx.strokeStyle = "rgba(140, 110, 30, .5)"; ctx.lineWidth = 0.8; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(mx + k * r * 0.5, my - r * 0.6); ctx.lineTo(mx + k * r * 0.7, my + 1); } ctx.stroke(); }
      }
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 18, y + 10); ctx.lineTo(x - 13, y - 6); ctx.stroke();
      ctx.strokeStyle = "#8b9099"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 16, y - 7); ctx.lineTo(x - 10, y - 5); for (let k = 0; k < 4; k++) { ctx.moveTo(x - 15.5 + k * 1.8, y - 6.8 + k * 0.6); ctx.lineTo(x - 15.5 + k * 1.8, y - 4 + k * 0.6); } ctx.stroke();
      pile(ctx, x - 24, y + 14, "foin", b.sortie);
    } else if (C_.elevage.troupeaux[b.type]) {
      // Étape 15 : ✍️ l'enclos, avec ses vaches qui broutent (et qui se couchent quand elles sont malades)
      // Étape 16 : pareil pour les poules, les moutons et les cochons (qui ont leur mare de boue !)
      const tr = C_.elevage.troupeaux[b.type];
      if (!aDesChamps(b)) { // étape 22 : sans place à côté, le petit enclos devant
        if (b.type === "porcherie") { ctx.beginPath(); ctx.ellipse(x + 18, y + 14, 6, 2.6, 0, 0, TOUR); ctx.fillStyle = vue.hiver ? "#cfd8e0" : "#7a5a3a"; ctx.fill(); }
        enclos(ctx, x + 17, y + 13, 14, 7);
        const places = [[x + 10, y + 12, 1], [x + 23, y + 13, -1], [x + 16, y + 17, 1], [x + 18, y + 9, -1]];
        for (let k = 0; k < Math.min(tr.nombre, places.length); k++) animal(ctx, tr.animal, places[k][0], places[k][1], t + k * 1.7 + b.numero, places[k][2], k + b.numero, !!b.malade);
      }
      pile(ctx, x - 22, y + 12, b.sortieQuoi, b.sortie);
      pile(ctx, x - 14, y + 16, "eau", b.entrees.eau || 0);
      pile(ctx, x - 5, y + 18, "foin", b.entrees.foin || 0);
    } else if (b.type === "laiterie") {
      // Étape 15 : la baratte ! Le bâton monte et descend quand le laitier fait le beurre
      const bx = x + 12, by = y + 10, haut = b.travail ? Math.abs(Math.sin(t * 5)) * 4 : 0;
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(bx, by - 11 - haut); ctx.lineTo(bx, by - 20 - haut); ctx.stroke();
      forme(ctx, [[bx - 3.5, by], [bx + 3.5, by], [bx + 2.6, by - 11], [bx - 2.6, by - 11]], "#b07740");
      ctx.strokeStyle = "#5a5f68"; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(bx - 3.3, by - 3); ctx.lineTo(bx + 3.3, by - 3); ctx.moveTo(bx - 2.9, by - 8); ctx.lineTo(bx + 2.9, by - 8); ctx.stroke();
      if (b.travail && Math.sin(t * 5) > 0.8) { ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(bx - 2, by - 12, 0.9, 0, TOUR); ctx.arc(bx + 2.4, by - 13, 0.7, 0, TOUR); ctx.fill(); } // des éclaboussures de crème
      pile(ctx, x - 22, y + 12, "lait", b.entrees.lait || 0);
      pile(ctx, x + 18, y + 14, "beurre", b.sortie);
    } else if (b.type === "veterinaire") {
      // Étape 15 : la croix verte au-dessus de la porte, et une sacoche de soins
      const cx = x + 10, cy = y - m.h - 2;
      ctx.fillStyle = "#ffffff"; ctx.fillRect(cx - 5, cy - 5, 10, 10); ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1 * trait; ctx.strokeRect(cx - 5, cy - 5, 10, 10);
      ctx.fillStyle = "#2e9a4a"; ctx.fillRect(cx - 1.5, cy - 4, 3, 8); ctx.fillRect(cx - 4, cy - 1.5, 8, 3);
      forme(ctx, [[x + 14, y + 12], [x + 22, y + 12], [x + 22, y + 7], [x + 14, y + 7]], "#7a4a2a");
      ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x + 18, y + 7, 2.2, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 17.3, y + 8.2, 1.4, 3); ctx.fillRect(x + 16.5, y + 9, 3, 1.4);
    } else if (b.type === "fromagerie") {
      // Étape 15 : une étagère de meules de fromage qui s'affinent
      forme(ctx, [[x + 10, y + 12], [x + 26, y + 4], [x + 26, y + 2], [x + 10, y + 10]], "#8a5a2b");
      for (let k = 0; k < 3; k++) { const fx = x + 13 + k * 5, fy = y + 8 - k * 2.5; ctx.beginPath(); ctx.ellipse(fx, fy, 2.6, 1.3, 0, 0, TOUR); ctx.fillStyle = "#f2c230"; ctx.fill(); contour(ctx, 0.9); ctx.fillStyle = "#e0a81e"; ctx.fillRect(fx - 2.6, fy, 5.2, 1.6); }
      pile(ctx, x - 22, y + 12, "lait", b.entrees.lait || 0);
      pile(ctx, x + 4, y + 17, "fromage", b.sortie);
    } else if (b.type === "cremerie") {
      // Étape 15 : une table avec des pots de yaourt, et une grande cuillère qui tourne quand le crémier travaille
      forme(ctx, [[x + 10, y + 12], [x + 24, y + 5], [x + 24, y + 3], [x + 10, y + 10]], "#c9965a");
      for (let k = 0; k < 4; k++) objetPorte(ctx, "yaourt", x + 12 + k * 3.5, y + 8 - k * 1.8);
      if (b.travail) { ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x + 4, y + 2); ctx.lineTo(x + 4 + Math.cos(t * 6) * 3, y - 6 + Math.sin(t * 6)); ctx.stroke(); }
      pile(ctx, x - 22, y + 12, "lait", b.entrees.lait || 0);
      pile(ctx, x + 4, y + 17, "yaourt", b.sortie);
    } else if (b.type === "manoir") {
      // Étape 18 : une corniche entre les 2 étages, une haie taillée et un arbre en boule
      ctx.strokeStyle = "rgba(255, 255, 255, .75)"; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(x - m.a, y - m.h * 0.5); ctx.lineTo(x, y + m.a / 2 - m.h * 0.5); ctx.lineTo(x + m.a2, y + m.a / 2 - m.a2 / 2 - m.h * 0.5); ctx.stroke();
      for (let k = 0; k < 4; k++) rond(ctx, x + 10 + k * 4.5, y + 14 - k * 2.2, 2.6, vue.hiver ? "#e8eef5" : "#3f8a3a");
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 25, y + 10); ctx.lineTo(x - 25, y + 3); ctx.stroke();
      rond(ctx, x - 25, y + 1, 4.5, vue.hiver ? "#e8eef5" : "#4fa84a");
      if (!vue.hiver && vue.fin) { ctx.fillStyle = "#ff7ab6"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * 4.5, y + 12 - k * 2.2, 0.9, 0, TOUR); ctx.fill(); } }
    } else if (b.type === "depot") {
      // Étape 17 : des caisses, des tonneaux et le drapeau du village
      for (const [cx, cy, c] of [[x + 16, y + 10, "#b07740"], [x + 22, y + 7, "#9a6a3c"], [x + 19, y + 3, "#c48f5d"]]) forme(ctx, [[cx - 4, cy], [cx, cy + 2], [cx + 4, cy], [cx + 4, cy - 5], [cx, cy - 7], [cx - 4, cy - 5]], c);
      ctx.beginPath(); ctx.ellipse(x - 20, y + 12, 3, 1.4, 0, 0, TOUR); ctx.fillStyle = "#8a5a2b"; ctx.fill(); contour(ctx, 0.8);
      drapeau(ctx, x + 2, y - m.h - m.toit - 10, t, Village.Boutique.COULEURS_DRAPEAU[(Village.monde && Village.monde.drapeau) || 0]);
    } else if (b.type === "tisserand") {
      // Étape 16 : le métier à tisser, avec ses fils, et la navette qui va et vient
      const mx = x + 14, my = y + 10;
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(mx - 7, my); ctx.lineTo(mx - 7, my - 14); ctx.moveTo(mx + 7, my - 4); ctx.lineTo(mx + 7, my - 18); ctx.moveTo(mx - 8, my - 13); ctx.lineTo(mx + 8, my - 17); ctx.moveTo(mx - 8, my - 2); ctx.lineTo(mx + 8, my - 6); ctx.stroke();
      ctx.strokeStyle = "#c4b6d6"; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = 1; k < 7; k++) { ctx.moveTo(mx - 7 + k * 2, my - 13.5 - k * 0.5); ctx.lineTo(mx - 7 + k * 2, my - 2.5 - k * 0.5); } ctx.stroke();
      forme(ctx, [[mx - 6, my - 3], [mx + 6, my - 6], [mx + 6, my - 8], [mx - 6, my - 5]], "#7a5ab0"); // le tissu déjà fait
      if (b.travail) { const nx = Math.sin(t * 4) * 5; forme(ctx, [[mx + nx - 2, my - 9 - nx * 0.25], [mx + nx + 2, my - 10 - nx * 0.25], [mx + nx + 2, my - 11 - nx * 0.25], [mx + nx - 2, my - 10 - nx * 0.25]], "#c78b4a"); }
      pile(ctx, x - 22, y + 12, "laine", b.entrees.laine || 0);
      pile(ctx, x + 2, y + 18, "tissu", b.sortie);
    } else if (b.type === "tailleur") {
      // Étape 16 : un mannequin avec une belle veste, et une enseigne en forme de ciseaux
      const mx = x + 15, my = y + 10;
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, my - 8); ctx.moveTo(mx - 3, my); ctx.lineTo(mx + 3, my); ctx.stroke();
      forme(ctx, [[mx - 4, my - 8], [mx + 4, my - 8], [mx + 5, my - 15], [mx + 2, my - 17], [mx - 2, my - 17], [mx - 5, my - 15]], "#3f8a8a");
      ctx.fillStyle = "#ffcf2e"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(mx, my - 15 + k * 2.4, 0.6, 0, TOUR); ctx.fill(); } // les boutons
      if (vue.fin) { ctx.strokeStyle = "#8b9099"; ctx.lineWidth = 1; ctx.beginPath(); const ox = x + 6, oy = y - m.h - 4, ouv = b.travail ? Math.abs(Math.sin(t * 8)) * 0.5 : 0.3; ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(-ouv) * 7, oy + Math.sin(-ouv) * 7); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(ouv) * 7, oy + Math.sin(ouv) * 7); ctx.stroke(); }
      pile(ctx, x - 22, y + 12, "tissu", b.entrees.tissu || 0);
      pile(ctx, x + 2, y + 18, "vetements", b.sortie);
    } else if (b.type === "charcuterie") {
      // Étape 16 : un auvent où sèchent des jambons qui se balancent, et la fumée du fumoir
      const ax = x + 8, ay = y + 2;
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ax, ay + 10); ctx.lineTo(ax, ay - 8); ctx.moveTo(ax + 16, ay + 2); ctx.lineTo(ax + 16, ay - 16); ctx.moveTo(ax - 1, ay - 8); ctx.lineTo(ax + 17, ay - 16); ctx.stroke();
      for (let k = 0; k < 3; k++) { const hx = ax + 3 + k * 5, hy = ay - 9 - k * 2.2, bal = Math.sin(t * 1.5 + k) * 0.15; ctx.save(); ctx.translate(hx, hy); ctx.rotate(bal); ctx.strokeStyle = "#c9a26a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 3); ctx.stroke(); jambon(ctx, 0, 6); ctx.restore(); }
      if (b.travail) fumee(ctx, x - 4, y - 36, t);
      pile(ctx, x - 22, y + 12, "viande", b.entrees.viande || 0);
      pile(ctx, x - 14, y + 16, "charbon", b.entrees.charbon || 0);
      pile(ctx, x + 2, y + 18, "jambon", b.sortie);
    } else if (b.type === "hutte") {
      // Étape 8 : une hutte ronde en paille (étape 25 : vraiment ronde), avec un petit feu devant
      fumee(ctx, x + 14, y - 26, t);
    } else if (b.type === "maison") {
      // Étape 9 : les fenêtres, les volets et la cheminée sont maintenant dessinés pour tous (voir boite)
    } else if (b.type === "fonderie") {
      // Étape 8 : la grande cheminée, la bouche du four qui rougeoie, et la fonte qui coule
      if (b.travail) fumee(ctx, x - 12, y - 88, t); // étape 25 : la grande cheminée d'usine (voir structure)
      const lueur = b.travail ? 0.6 + 0.4 * Math.sin(t * 9) : 0.25;
      forme(ctx, [[x + 2, y + 6], [x + 12, y + 1], [x + 12, y - 6], [x + 2, y - 1]], "rgba(255, " + Math.round(110 + 60 * lueur) + ", 40, " + (0.4 + lueur * 0.6) + ")");
      pile(ctx, x - 22, y + 12, "fer", b.entrees.fer || 0);
      pile(ctx, x - 16, y + 16, "charbon", b.entrees.charbon || 0);
      pile(ctx, x + 16, y + 10, "lingots", b.sortie);
    } else if (b.type === "forge") {
      // Étape 8 : l'enclume devant la porte. Quand le forgeron travaille, le marteau tape et des étincelles sautent.
      forme(ctx, [[x + 10, y + 12], [x + 20, y + 12], [x + 18, y + 8], [x + 22, y + 6], [x + 8, y + 6], [x + 12, y + 8]], "#4a4f57");
      if (b.travail) {
        const coup = Math.sin(t * 10) > 0; // étape 10 : c'est le forgeron qui tape (voir ouvrierDevant)
        if (coup) { ctx.fillStyle = "#ffcf2e"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 15 + Math.cos(t * 30 + k * 2) * 5, y + 3 - Math.abs(Math.sin(t * 30 + k)) * 6, 1, 0, TOUR); ctx.fill(); } }
      }
      fumee(ctx, x - 6, y - 56, t); // étape 25 : la grosse cheminée de pierre
      pile(ctx, x - 22, y + 12, "lingots", b.entrees.lingots || 0);
      pile(ctx, x - 14, y + 16, "planche", b.entrees.planches || 0);
      pile(ctx, x + 2, y + 16, "outils", b.sortie);
    } else if (b.type === "marche") {
      // Étape 8 ; étape 25 : 3 étals rayés et la balance, à la place de la maison (voir structure)
    } else if (b.type === "mineCharbon" || b.type === "mineFer" || b.type === "mineOr") {
      // Étape 7 : des rails et un wagonnet ; étape 25 : la colline, l'entrée et le chevalement sont dans structure
      ctx.strokeStyle = "#7d8187"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x + 2, y + 9); ctx.lineTo(x - 18, y + 19); ctx.moveTo(x + 5, y + 11); ctx.lineTo(x - 15, y + 21); ctx.stroke(); // (étape 28 : du puits vers l'avant)
      forme(ctx, [[x - 14, y + 16], [x - 6, y + 12], [x - 6, y + 7], [x - 14, y + 11]], "#6c5036");
      if (b.type === "mineFer") minerai(ctx, x - 10, y + 9); else if (b.type === "mineOr") pepite(ctx, x - 10, y + 9); else charbon(ctx, x - 10, y + 9);
      pile(ctx, x + 6, y + 17, b.type === "mineFer" ? "fer" : b.type === "mineOr" ? "or" : "charbon", b.sortie);
    } else if (b.type === "geologue") {
      // Une loupe géante accrochée au mur, et un caillou brillant
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y - 2); ctx.lineTo(x + 14, y + 4); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 8, y - 5, 4, 0, TOUR); ctx.fillStyle = "rgba(180, 230, 255, .8)"; ctx.fill(); contour(ctx, 1.6);
      rond(ctx, x - 20, y + 10, 3, "#a3a8ad");
      if (Math.sin(t * 3) > 0.6) { ctx.strokeStyle = "#fff6b0"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 23, y + 7); ctx.lineTo(x - 17, y + 7); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x - 20, y + 10); ctx.stroke(); }
    } else if (b.type === "chasseur") {
      pile(ctx, x + 14, y + 9, "viande", b.sortie);
      // (Étape 25 : le chasseur vit sous une grande tente : voir structure)
    }
    if (vue.anim) animations(ctx, b, x, y, t, m); // étape 14 ; étape 17 : de plus loin
    // Étape 11 : un bâtiment usé a des fissures et une planche de travers
    if (b.usure >= 0.5 && vue.fin) {
      ctx.strokeStyle = "rgba(40, 25, 10, " + (0.3 + b.usure * 0.4) + ")"; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x + m.a * 0.55, y - m.h * 0.8); ctx.lineTo(x + m.a * 0.45, y - m.h * 0.55); ctx.lineTo(x + m.a * 0.6, y - m.h * 0.35);
      if (b.usure >= 0.8) { ctx.moveTo(x - m.a * 0.2, y - m.h * 0.2); ctx.lineTo(x - m.a * 0.1, y - m.h * 0.5); }
      ctx.stroke();
    }
    // (Étape 10 : les ouvriers des ateliers travaillent devant leur bâtiment : voir dessinerBatiment)
    // Étape 18 : ✍️ « tous doivent être reconnaissables de loin ». Quand on dézoome, chaque bâtiment (sauf les
    // logements, qu'on reconnaît à leur forme) montre un REPÈRE : son emoji dans un rond, toujours de la même
    // taille à l'écran, comme les icônes d'une carte.
    // Étape 23 : ✍️ « des icônes sur chaque bâtiment, j'aime pas trop ça ». Plus de repère, plus d'enseigne, plus
    // d'étoiles : chaque bâtiment se reconnaît à sa FORME, ses couleurs et ce qu'il y a devant lui, et son niveau se
    // voit à son socle, son toit et sa girouette (voir modeleNiveau).
    if (travaille && b.type === "carriere") poussiere(ctx, x, y, t);
    if (!b.relie) panneauSansRoute(ctx, x, yBulle + 2, t);
    // Étape 4 : l'ouvrier a trop faim, ou il est parti (la cabane est vide)
    else if (b.malade) bulleDePensee(ctx, x, yBulle, t, "🤒"); // étape 15 : les vaches sont malades
    else if (b.ouvrier && b.ouvrier.affame) bulleDePensee(ctx, x, yBulle, t, "🍽️");
    else if (b.usure >= 1) bulleDePensee(ctx, x, yBulle, t, "🔧"); // étape 11 : usé !
    // (Étape 22 : ✍️ plus de bulle 🍞 ni 🥶 au-dessus de chaque bâtiment : ça devenait illisible. Le pain et le froid
    // concernent tout le village : ils sont montrés une seule fois, en bas de l'écran.)
    else if (!b.ouvrier && Village.Batiments.TYPES[b.type].metier) bulleDePensee(ctx, x, yBulle, t, Village.monde && !Village.Logement.placeLibre(Village.monde) ? "🛏️" : "vide"); // étape 8 : 🛏️ pas de logement
    // Étape 12 : le bâtiment qu'on déplace est « soulevé » : transparent, avec un cadre qui clignote
    if (Village.monde && Village.monde.projet && Village.monde.projet.deplacer === b) {
      ctx.strokeStyle = "rgba(255, 226, 122," + (0.5 + 0.5 * Math.sin(t * 8)) + ")"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - m.a - 4, y); ctx.lineTo(x, y + m.a / 2 + 2); ctx.lineTo(x + m.a + 4, y); ctx.lineTo(x, y - m.a / 2 - 2); ctx.closePath(); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- étape 14 : la vie devant les bâtiments
  // ✍️ Maxance voulait plus d'animations devant chaque bâtiment. Chacune a sa petite scène, qui bouge avec
  // l'heure (t) : pas besoin de mémoire, comme les figurants de l'étape 9.
  function animations(ctx, b, x, y, t, m) {
    const s = b.numero * 1.3, aLaMaison = b.ouvrier && !["aller", "travailler", "revenir"].includes(b.ouvrier.etat);
    switch (b.type) {
      case "scierie": {
        // Le tas de sciure sous la lame, et un tronc qui avance vers la scie quand elle travaille
        ctx.beginPath(); ctx.ellipse(x + 13, y + 3, 6, 2.4, 0, 0, TOUR); ctx.fillStyle = "#e8cf9a"; ctx.fill();
        if (b.travail) {
          const p = 1 - b.travail.reste / Math.max(0.1, b.travail.duree || 6);
          ctx.save(); ctx.translate(x - 4 + p * 12, y - 5 + p * 2); ctx.scale(0.75, 0.75); rondin(ctx, 0, 0, 0.12); ctx.restore();
          for (let k = 0; k < 8; k++) { const q = (t * 2.2 + k / 8) % 1; ctx.fillStyle = "rgba(240, 205, 140," + (1 - q) + ")"; ctx.beginPath(); ctx.arc(x + 14 + q * 16 * Math.cos(k), y - 6 + q * 12 - Math.sin(q * 3) * 10, 1.3, 0, TOUR); ctx.fill(); }
        }
        break;
      }
      case "bucheron": {
        // ✍️ Le bûcheron, quand il est à la maison, fend une bûche sur le billot : les morceaux sautent
        forme(ctx, [[x - 26, y + 14], [x - 18, y + 14], [x - 18, y + 9], [x - 26, y + 9]], "#a87443");
        if (aLaMaison) {
          const ph = (t * 0.8 + s) % 1;
          if (ph < 0.5) { ctx.save(); ctx.translate(x - 22, y + 6); ctx.scale(0.5, 0.5); rondin(ctx, 0, 0, 1.4); ctx.restore(); }
          else for (const c of [-1, 1]) { const q = (ph - 0.5) * 2; ctx.save(); ctx.translate(x - 22 + c * q * 7, y + 7 - Math.sin(q * Math.PI) * 6); ctx.rotate(c * q * 1.5); ctx.fillStyle = "#e6be85"; ctx.fillRect(-1.5, -3.5, 3, 7); ctx.strokeStyle = "#8f5e2e"; ctx.lineWidth = 0.8; ctx.strokeRect(-1.5, -3.5, 3, 7); ctx.restore(); }
        }
        ctx.fillStyle = "#e6be85"; for (const [dx, dy] of [[-30, 15], [-15, 16], [-28, 11]]) ctx.fillRect(x + dx, y + dy, 2, 1); // des copeaux
        break;
      }
      case "pecheur": {
        // Un séchoir à poissons : 3 poissons qui se balancent au vent
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 26, y + 12); ctx.lineTo(x - 26, y - 4); ctx.moveTo(x - 12, y + 16); ctx.lineTo(x - 12, y); ctx.moveTo(x - 26, y - 3); ctx.lineTo(x - 12, y + 1); ctx.stroke();
        for (let k = 0; k < 3; k++) { const px = x - 23 + k * 4.5, py = y - 1.4 + k * 1.2, a = Math.sin(t * 2 + k + s) * 0.25; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.PI / 2 + a); poisson(ctx, 3, 0); ctx.restore(); }
        break;
      }
      case "chasseur": {
        // Une peau tendue sur un cadre, et un petit feu qui fume
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.3; ctx.strokeRect(x - 28, y - 4, 10, 12);
        forme(ctx, [[x - 27, y - 3], [x - 19, y - 2], [x - 20, y + 7], [x - 26, y + 6]], "#b07a4a");
        fumee(ctx, x + 22, y + 4, t + s);
        break;
      }
      case "forestier": {
        // Des jeunes pousses dans leurs pots, qui bougent au vent
        for (let k = 0; k < 3; k++) { const px = x - 26 + k * 6, py = y + 12 + k * 1.5, a = Math.sin(t * 2.5 + k) * 0.15; forme(ctx, [[px - 2, py], [px + 2, py], [px + 1.6, py - 3], [px - 1.6, py - 3]], "#c4622f"); ctx.save(); ctx.translate(px, py - 3); ctx.rotate(a); ctx.fillStyle = "#4fb556"; ctx.beginPath(); ctx.ellipse(-1.5, -2.5, 1.8, 1, -0.6, 0, TOUR); ctx.ellipse(1.5, -3.2, 1.8, 1, 0.6, 0, TOUR); ctx.fill(); ctx.restore(); }
        break;
      }
      case "carriere": {
        // Un bloc de pierre en train d'être taillé : des éclats qui sautent
        forme(ctx, [[x - 26, y + 10], [x - 20, y + 13], [x - 14, y + 10], [x - 14, y + 4], [x - 20, y + 1], [x - 26, y + 4]], "#b5b5b0");
        if (aLaMaison && Math.sin(t * 6 + s) > 0.6) { ctx.fillStyle = "#e8e8e2"; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 20 + Math.cos(t * 20 + k) * 5, y + 1 - Math.abs(Math.sin(t * 20 + k)) * 5, 0.9, 0, TOUR); ctx.fill(); } }
        break;
      }
      case "mineCharbon": case "mineFer": case "mineOr": {
        // Le wagonnet roule sur les rails quand la mine travaille
        if (b.travail) { const d = Math.sin(t * 1.4 + s) * 6; ctx.save(); ctx.translate(d, d * 0.5); forme(ctx, [[x + 2, y + 6], [x + 10, y + 10], [x + 10, y + 5], [x + 2, y + 1]], "#6c5036"); rond(ctx, x + 4, y + 7, 1.4, "#3b2614"); rond(ctx, x + 9, y + 9.5, 1.4, "#3b2614"); ctx.restore(); }
        break;
      }
      // ---- Étape 17 : ✍️ une animation pour CHAQUE bâtiment (avant, beaucoup n'en avaient pas)
      case "universite": {
        // La lunette du savant tourne sur le toit ; pendant une recherche, des feuilles s'envolent
        ctx.save(); ctx.translate(x + 10, y - m.h - m.toit + 4); ctx.rotate(-0.7 + Math.sin(t * 0.4 + s) * 0.5);
        forme(ctx, [[0, -1.6], [12, -2.6], [12, 2.6], [0, 1.6]], "#c9a636"); ctx.restore();
        if (Village.monde && Village.monde.recherches.enCours) for (let k = 0; k < 3; k++) { const q = (t * 0.5 + k / 3) % 1; ctx.save(); ctx.globalAlpha = 1 - q; ctx.translate(x - 6 + Math.sin(q * 6 + k) * 6, y - 4 - q * 30); ctx.rotate(q * 4); ctx.fillStyle = "#fbf6ee"; ctx.fillRect(-2.5, -3, 5, 6); ctx.restore(); }
        break;
      }
      case "forge": {
        // Les braises du foyer rougeoient toujours
        const f = 0.5 + 0.5 * Math.sin(t * 5 + s);
        ctx.beginPath(); ctx.ellipse(x - 2, y + 9, 5, 2.2, 0, 0, TOUR); ctx.fillStyle = "#3b2614"; ctx.fill();
        ctx.fillStyle = "rgba(255, " + Math.round(110 + 80 * f) + ", 30, .95)"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - 4 + k * 2, y + 9 - (k % 2), 1.1 + f * 0.4, 0, TOUR); ctx.fill(); }
        lumiere(x - 2, y + 8, 14, "orange", 0.7);
        break;
      }
      case "marche": {
        // Des fanions de toutes les couleurs, qui flottent au vent
        const couleurs = ["#e8402e", "#ffcf2e", "#4fc25a", "#3e7bff", "#ff8a1f", "#a24bd6"];
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 20, y - 16); ctx.quadraticCurveTo(x + 4, y - 8, x + 30, y - 26); ctx.stroke();
        for (let k = 0; k < 6; k++) { const u = (k + 0.5) / 6, px = x - 20 + u * 50, py = y - 16 + u * (1 - u) * 16 - u * 10, bal = Math.sin(t * 3 + k) * 1.5; forme(ctx, [[px - 2.5, py], [px + 2.5, py], [px + bal, py + 5]], couleurs[k]); }
        break;
      }
      case "ferme": {
        // Un épouvantail qui agite les bras, et des corbeaux qui tournent au-dessus des champs
        const ex = x - 32, ey = y + 4, bras = Math.sin(t * 2 + s) * 0.3;
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, ey - 14); ctx.moveTo(ex - 6, ey - 10 + bras * 6); ctx.lineTo(ex + 6, ey - 10 - bras * 6); ctx.stroke();
        forme(ctx, [[ex - 3, ey - 11], [ex + 3, ey - 11], [ex + 2.4, ey - 5], [ex - 2.4, ey - 5]], "#c8503a");
        rond(ctx, ex, ey - 14, 2.2, "#e8c64a");
        ctx.strokeStyle = "#2b2b2b"; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < 2; k++) { const a = t * 0.8 + k * 3 + s, cx = ex + 20 + Math.cos(a) * 14, cy = ey - 26 + Math.sin(a) * 4, ail = Math.sin(t * 8 + k) * 1.5; ctx.moveTo(cx - 3, cy - ail); ctx.lineTo(cx, cy); ctx.lineTo(cx + 3, cy - ail); }
        ctx.stroke();
        break;
      }
      case "boulangerie": {
        // La bonne odeur du pain chaud : de la vapeur qui monte de l'étal
        ctx.strokeStyle = "rgba(255, 255, 255, .75)"; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = 0; k < 3; k++) { const q = (t * 0.6 + k / 3) % 1, px = x + 18 + k * 3, py = y + 4 - q * 14; ctx.moveTo(px, py + 4); ctx.quadraticCurveTo(px + 2 * Math.sin(t * 3 + k), py + 2, px, py); }
        ctx.stroke();
        break;
      }
      case "orfevre": {
        // La pierre de la bague brille et scintille
        const sc = 0.5 + 0.5 * Math.sin(t * 3 + s);
        ctx.save(); ctx.translate(x + 12, y - m.h - 6); ctx.rotate(t * 1.5); ctx.strokeStyle = "rgba(255, 246, 176, " + sc + ")"; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * Math.PI / 2) * (4 + sc * 3), Math.sin(k * Math.PI / 2) * (4 + sc * 3)); } ctx.stroke(); ctx.restore();
        break;
      }
      case "macon": {
        // La truelle qui gâche le mortier dans le seau
        const a = t * 3 + s; ctx.strokeStyle = "#8b9099"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 3.5, y + 11); ctx.lineTo(x - 3.5 + Math.cos(a) * 3, y + 7 + Math.sin(a)); ctx.stroke();
        break;
      }
      case "hutte": {
        // Un petit feu de camp devant la hutte, avec ses flammes qui dansent
        const fx = x + 16, fy = y + 12;
        ronds(ctx, [[fx - 3, fy + 1, 1.3, "#8b9099"], [fx + 3, fy + 1, 1.3, "#8b9099"], [fx, fy + 2, 1.3, "#8b9099"]]);
        for (let k = 0; k < 3; k++) { const h = 4 + Math.sin(t * 9 + k * 2) * 1.6; forme(ctx, [[fx - 2 + k * 1.6, fy], [fx - 1 + k * 1.6, fy - h], [fx + k * 1.6, fy]], k === 1 ? "#ffcf2e" : "#ff8a1f"); }
        lumiere(fx, fy - 2, 16, "orange", 0.8);
        break;
      }
      case "maison": {
        // Un chat sur le pas de la porte, qui remue la queue
        const cx = x - m.a * 0.45 + 9, cy = y + m.a * 0.28 + 6, q = Math.sin(t * 2 + s) * 2;
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 2.6, 1.8, 0, 0, TOUR); ctx.fillStyle = s % 2 > 1 ? "#d9822b" : "#3b3b3b"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 2.4, cy - 3.6, 1.4, 0, TOUR); ctx.fill();
        forme(ctx, [[cx + 1.6, cy - 4.6], [cx + 2, cy - 6], [cx + 2.6, cy - 4.8]], ctx.fillStyle);
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - 2.4, cy - 2); ctx.quadraticCurveTo(cx - 5, cy - 3, cx - 4 + q * 0.5, cy - 6); ctx.stroke();
        break;
      }
      case "geologue": {
        // Il tamise des cailloux : le tamis se secoue, et quelquefois une pépite brille
        const sx = x + 16 + Math.sin(t * 8 + s) * 1.2;
        ctx.beginPath(); ctx.ellipse(sx, y + 10, 4.5, 2, 0, 0, TOUR); ctx.fillStyle = "#9a6a3c"; ctx.fill(); contour(ctx, 0.8);
        ronds(ctx, [[sx - 1.5, y + 9.6, 0.9, "#a3a8ad"], [sx + 1.2, y + 10.2, 0.8, "#8b9099"]]);
        break;
      }
      case "entrepot": case "depot": {
        // Une caisse hissée par une poulie, qui monte et redescend
        const q = (Math.sin(t * 0.9 + s) + 1) / 2, px = x - 10, py = y - m.h - 2;
        ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 8, py - 2); ctx.stroke();
        ctx.strokeStyle = "#c9a26a"; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(px - 8, py - 2); ctx.lineTo(px - 8, py + 4 + q * 14); ctx.stroke();
        forme(ctx, [[px - 11, py + 4 + q * 14], [px - 5, py + 4 + q * 14], [px - 5, py + 9 + q * 14], [px - 11, py + 9 + q * 14]], "#b07740");
        break;
      }
      case "fonderie": {
        // Le métal en fusion coule du creuset, et des étincelles sautent
        if (b.travail) {
          ctx.strokeStyle = "rgba(255, " + Math.round(140 + 60 * Math.sin(t * 8)) + ", 40, .95)"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x + 14, y + 3); ctx.quadraticCurveTo(x + 17, y + 6, x + 16, y + 12); ctx.stroke();
          ctx.fillStyle = "#ffcf2e"; for (let k = 0; k < 4; k++) { const q = (t * 3 + k / 4) % 1; ctx.beginPath(); ctx.arc(x + 16 + Math.cos(k * 2) * q * 8, y + 12 - Math.sin(q * Math.PI) * 8, 0.9, 0, TOUR); ctx.fill(); }
          lumiere(x + 16, y + 10, 18, "orange", 0.9);
        }
        break;
      }
    }
  }

  // Une bulle de pensée, comme dans les bandes dessinées
  function bulleDePensee(ctx, x, y, t, contenu) {
    if (loupe && loupe.s > 1.6) { const k = 1.6 / loupe.s, l0 = loupe; ctx.save(); ctx.translate(x, y + 18); ctx.scale(k, k); ctx.translate(-x, -y - 18); loupe = null; bulleDePensee(ctx, x, y, t, contenu); loupe = l0; ctx.restore(); return; } // étape 24
    const s = Math.sin(t * 2) * 1.5;
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#5a4220"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x - 5, y + 13, 2, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 2, y + 8, 3, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x + 2, y - 3 + s, contenu === "vide" ? 16 : 11, 9, 0, 0, TOUR); ctx.fill(); ctx.stroke();
    ctx.font = (contenu === "vide" ? "bold 9px 'Trebuchet MS', sans-serif" : "11px sans-serif");
    ctx.fillStyle = "#c0392b"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(contenu, x + 2, y - 2.5 + s);
    ctx.textAlign = "left";
  }

  // ✍️ Pas de route jusqu'à l'entrepôt : un panneau qui saute, au-dessus du toit (un chemin barré).
  function panneauSansRoute(ctx, x, y, t) {
    if (loupe && loupe.s > 1.6) { const k = 1.6 / loupe.s, l0 = loupe; ctx.save(); ctx.translate(x, y + 16); ctx.scale(k, k); ctx.translate(-x, -y - 16); loupe = null; panneauSansRoute(ctx, x, y, t); loupe = l0; ctx.restore(); return; } // étape 24
    const saut = Math.abs(Math.sin(t * 3)) * 4;
    ctx.fillStyle = "#fff4f0";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 14, y - 14 - saut, 28, 22, 6); else ctx.rect(x - 14, y - 14 - saut, 28, 22);
    ctx.fill(); ctx.strokeStyle = "#c0392b"; ctx.lineWidth = 2; ctx.stroke();
    iconeRoute(ctx, x, y - 3 - saut, 0.55);
    ctx.strokeStyle = "#e0301e"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 7, y - 10 - saut); ctx.lineTo(x + 7, y + 4 - saut); ctx.moveTo(x + 7, y - 10 - saut); ctx.lineTo(x - 7, y + 4 - saut); ctx.stroke();
  }

  // Une petite icône de chemin de terre qui serpente (il n'existe pas d'emoji « chemin »).
  function iconeRoute(ctx, x, y, e, pierre) {
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
    ctx.lineCap = "round";
    const chemin = () => { ctx.beginPath(); ctx.moveTo(-12, 14); ctx.bezierCurveTo(-14, 2, 12, 4, 6, -6); ctx.bezierCurveTo(2, -12, 8, -14, 10, -16); };
    chemin(); ctx.strokeStyle = pierre ? "#5e6268" : "#9b7440"; ctx.lineWidth = 10; ctx.stroke();
    chemin(); ctx.strokeStyle = pierre ? "#b9bdc2" : "#e2c38c"; ctx.lineWidth = 6.5; ctx.stroke();
    if (pierre) { chemin(); ctx.setLineDash([3, 3]); ctx.strokeStyle = "#7d8187"; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); } // les pavés
    ctx.restore();
  }

  // Étape 14 : ✍️ une enseigne plus grande, pour reconnaître le bâtiment d'un coup d'œil
  function repere(ctx, x, y, emoji, taille) {
    ctx.beginPath(); ctx.arc(x, y, taille * 0.72, 0, TOUR); ctx.fillStyle = "rgba(255, 250, 235, .93)"; ctx.fill();
    ctx.lineWidth = taille * 0.09; ctx.strokeStyle = "#5a4220"; ctx.stroke();
    ctx.font = Math.round(taille) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, x, y + taille * 0.06);
    ctx.textAlign = "left";
  }
  function enseigne(ctx, x, y, emoji) {
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 4, y - 15); ctx.lineTo(x - 4, y - 18); ctx.moveTo(x + 4, y - 15); ctx.lineTo(x + 4, y - 18); ctx.stroke();
    ctx.fillStyle = "#f6e7c4";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 8, y - 15, 16, 14, 3.5); else ctx.rect(x - 8, y - 15, 16, 14);
    ctx.fill(); contour(ctx, 1.2);
    ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(emoji, x, y - 7.8);
    ctx.textAlign = "left";
  }

  function etoile(ctx, x, y) {
    ctx.beginPath();
    for (let k = 0; k < 10; k++) { const r = k % 2 ? 1.6 : 3.6, a = -Math.PI / 2 + (k * Math.PI) / 5; k ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = "#ffcf2e"; ctx.fill(); contour(ctx, 0.9);
  }

  function drapeau(ctx, x, y, t, couleur) {
    ctx.strokeStyle = CONTOUR; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k <= 4; k++) ctx.lineTo(x + k * 4, y + Math.sin(t * 6 + k) * 1.5);
    for (let k = 4; k >= 0; k--) ctx.lineTo(x + k * 4, y + 8 + Math.sin(t * 6 + k) * 1.5);
    ctx.closePath(); ctx.fillStyle = couleur; ctx.fill(); contour(ctx, 1.2);
  }

  function sciure(ctx, x, y, t) {
    for (let k = 0; k < 5; k++) {
      const p = (t * 1.5 + k / 5) % 1;
      ctx.fillStyle = "rgba(230, 190, 120," + (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x + 4 + p * 14, y + 4 + p * 10 - Math.sin(p * 3) * 8, 1.6, 0, TOUR); ctx.fill();
    }
  }

  // Étape 8 : de la fumée qui monte d'une cheminée (des ronds gris qui grossissent et s'effacent)
  function fumee(ctx, x, y, t) {
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.5 + k / 4) % 1;
      ctx.fillStyle = "rgba(225, 225, 230," + 0.55 * (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x + Math.sin(p * 4 + k) * 3 + p * 6, y - p * 22, 2.5 + p * 4, 0, TOUR); ctx.fill();
    }
  }
  // Plusieurs petits ronds d'un coup : [x, y, rayon, couleur]
  function ronds(ctx, liste) { for (const [rx, ry, r, c] of liste) rond(ctx, rx, ry, r, c); }

  function poussiere(ctx, x, y, t) {
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.8 + k / 4) % 1;
      ctx.fillStyle = "rgba(200, 200, 195," + 0.5 * (1 - p) + ")";
      ctx.beginPath(); ctx.arc(x - 26 - p * 6, y - 4 - p * 20, 3 + p * 5, 0, TOUR); ctx.fill();
    }
  }

  // Un chantier : les murs montent petit à petit, avec des poteaux et une barre de progression.
  function chantier(ctx, b, x, y, m, t) {
    const a = m.a, bb = a / 2;
    forme(ctx, [[x - a, y], [x, y + bb], [x + a, y], [x, y - bb]], "#cdbb94"); // la dalle
    if (b.progres > 0.05) boite(ctx, x, y, m, b.progres, false);
    // Les 4 poteaux de l'échafaudage
    ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const [px, py] of [[x - a, y], [x, y + bb], [x + a, y], [x, y - bb]]) { ctx.moveTo(px, py); ctx.lineTo(px, py - m.h - 6); }
    ctx.stroke();
    if (vue.fin) {
      // Étape 9 : un vrai échafaudage : des croix pour le tenir, une plateforme qui monte avec les murs, une échelle
      ctx.strokeStyle = "rgba(138, 90, 43, .8)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - a, y); ctx.lineTo(x, y + bb - m.h - 6); ctx.moveTo(x, y + bb); ctx.lineTo(x - a, y - m.h - 6);
      ctx.moveTo(x, y + bb); ctx.lineTo(x + a, y - m.h - 6); ctx.moveTo(x + a, y); ctx.lineTo(x, y + bb - m.h - 6); ctx.stroke();
      const hp = Math.max(4, m.h * b.progres);
      forme(ctx, [[x - a - 2, y - hp], [x, y + bb - hp + 2], [x, y + bb - hp - 1], [x - a - 2, y - hp - 3]], "#d9a866");
      forme(ctx, [[x, y + bb - hp + 2], [x + a + 2, y - hp], [x + a + 2, y - hp - 3], [x, y + bb - hp - 1]], "#c9965a");
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.2; ctx.beginPath(); // l'échelle
      ctx.moveTo(x - a * 0.6, y + 8); ctx.lineTo(x - a * 0.7, y - hp); ctx.moveTo(x - a * 0.6 + 4, y + 10); ctx.lineTo(x - a * 0.7 + 4, y - hp + 2);
      for (let k = 1; k * 4 < hp + 8; k++) { const yy = y + 8 - k * 4; ctx.moveTo(x - a * 0.6 - k * 0.3, yy); ctx.lineTo(x - a * 0.6 + 4 - k * 0.3, yy + 2); }
      ctx.stroke();
      // Un peu de poussière qui s'envole quand ça avance
      if (b.relie && b.progres < 1 && b.progres > 0.02) for (let k = 0; k < 3; k++) { const p = (t * 0.7 + k / 3) % 1; ctx.fillStyle = "rgba(220, 205, 175," + 0.5 * (1 - p) + ")"; ctx.beginPath(); ctx.arc(x + 8 - p * 10 + k * 5, y + 4 - p * 14, 2 + p * 3, 0, TOUR); ctx.fill(); }
    }
    // Les matériaux arrivés (apportés par les porteurs)
    pile(ctx, x + a * 0.7, y + 10, "planche", b.livre.planches || 0);
    pile(ctx, x - a * 0.8, y + 8, "pierre", b.livre.pierres || 0);
    if (!b.relie) panneauSansRoute(ctx, x, y - m.h - 34, t);
    // La barre de progression
    const l = 36, bx = x - l / 2, by = y - m.h - 22;
    ctx.fillStyle = "rgba(255,250,235,.95)";
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx - 2, by - 2, l + 4, 9, 4); else ctx.rect(bx - 2, by - 2, l + 4, 9);
    ctx.fill(); contour(ctx, 1.5);
    ctx.fillStyle = "#4fc25a";
    ctx.fillRect(bx, by, l * b.progres, 5);
    // Un marteau qui tape
    const coup = Math.abs(Math.sin(t * 8));
    ctx.save(); ctx.translate(x - 4, y - m.h * b.progres - 2); ctx.rotate(-0.8 + coup * 0.9);
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
    ctx.fillStyle = "#7a7f88"; ctx.fillRect(-3, -12, 6, 4);
    ctx.restore();
  }

  // ---------------------------------------------------------------- les bonshommes (étape 10)
  // ✍️ Étape 10 : tous les personnages (ouvriers, porteurs, enfants) sont dessinés par le MÊME
  // « bonhomme », comme une poupée qu'on habille : on lui donne une peau, des cheveux, des habits,
  // un chapeau, et la POSE de ses bras et de ses jambes. Puis chaque métier l'anime à sa façon.
  //
  // Un bras, c'est un segment qui part de l'épaule, avec un ANGLE :
  //   0 = le bras pend le long du corps ; π/2 (1,57) = tendu devant ; π (3,14) = levé au-dessus de la tête.
  // Un geste (couper un arbre, taper sur l'enclume), c'est une suite d'angles qui changent avec le temps.
  //
  // Chaque habitant est un peu différent (peau, cheveux, barbe) : on tire ses traits au hasard avec
  // une GRAINE (son numéro), toujours la même, pour qu'il garde sa tête toute sa vie !
  const PEAUX = ["#f2c79b", "#e8b48a", "#d29a6c", "#a8714a", "#7d4f33", "#f6d8bd"];
  const CHEVEUX = ["#2b1d12", "#5a3818", "#a0622d", "#d9a640", "#7d7d7d", "#1a1410", "#b04a2a"];
  const EPAULE = [0, -14], LONG_BRAS = 6.5;
  const hasard = (graine, k) => { const v = Math.sin(graine * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  function traits(graine) {
    return { peau: PEAUX[Math.floor(hasard(graine, 1) * PEAUX.length)], cheveux: CHEVEUX[Math.floor(hasard(graine, 2) * CHEVEUX.length)], barbe: hasard(graine, 3) < 0.35, coupe: Math.floor(hasard(graine, 4) * 3), cligne: hasard(graine, 5) * 4 };
  }
  // Où est la main au bout d'un bras qui fait cet angle ?
  const main = (angle, long) => [EPAULE[0] + Math.sin(angle) * (long || LONG_BRAS), EPAULE[1] + Math.cos(angle) * (long || LONG_BRAS)];

  // Les habits de chaque métier : habit (le haut), pantalon, coiffe (et sa couleur), tablier, outil.
  const TENUES = {
    bucheron: { habit: "#d8433a", carreaux: true, pantalon: "#4a3a2a", coiffe: "bonnet", coiffeCouleur: "#b52f27", outil: "hache" },
    forestier: { habit: "#4f9e3e", pantalon: "#5a4630", coiffe: "feutre", coiffeCouleur: "#3a6a2c", outil: "pelle" },
    carriere: { habit: "#5a7bb5", pantalon: "#3b3f5a", coiffe: "casque", coiffeCouleur: "#f2c230", outil: "pioche" },
    pecheur: { habit: "#f2c230", pantalon: "#2f4f7a", coiffe: "suroit", coiffeCouleur: "#e0a81e", outil: "canne" }, // le ciré jaune du pêcheur
    chasseur: { habit: "#7a5a2e", pantalon: "#4a3a20", coiffe: "capuche", coiffeCouleur: "#4f6b2a", outil: "arc" },
    geologue: { habit: "#8a5ab0", pantalon: "#4a3a5a", coiffe: "explorateur", coiffeCouleur: "#d8c49a", outil: "marteau" }, // étape 5
    scierie: { habit: "#d9c9a3", pantalon: "#5a4630", coiffe: "calot", coiffeCouleur: "#7a5a30", tablier: "#8a5a2b", outil: "scie" },
    mineCharbon: { habit: "#6b6f78", pantalon: "#3b3f4a", coiffe: "mineur", coiffeCouleur: "#b8862e", outil: "pioche", suie: true },
    mineFer: { habit: "#7a6658", pantalon: "#3b3f4a", coiffe: "mineur", coiffeCouleur: "#b8862e", outil: "pioche", suie: true },
    fonderie: { habit: "#c9b48f", pantalon: "#3b3330", coiffe: "calot", coiffeCouleur: "#5a4a40", tablier: "#6b4423", outil: "ringard", suie: true },
    forge: { habit: "#e8dcc4", pantalon: "#3b3330", coiffe: null, tablier: "#5a3818", outil: "marteauForge", barbe: true },
    universite: { habit: "#3f6fc4", pantalon: "#2f3a5a", coiffe: "savant", coiffeCouleur: "#2f569c", outil: "livre", robe: true },
    marche: { habit: "#b5523a", pantalon: "#4a3a2a", coiffe: "feutre", coiffeCouleur: "#6b4423", tablier: "#f1e3c4", outil: null },
    // Étape 11
    ferme: { habit: "#4f7cba", pantalon: "#7a5a30", coiffe: "paille", coiffeCouleur: "#e8c64a", outil: "fourche" },
    moulin: { habit: "#f1ede4", pantalon: "#b9b2a6", coiffe: "calot", coiffeCouleur: "#ffffff", outil: null, farine: true },
    boulangerie: { habit: "#ffffff", pantalon: "#6b6058", coiffe: "toque", coiffeCouleur: "#ffffff", tablier: "#f1e3c4", outil: "pelleAPain" },
    mineOr: { habit: "#7a6a40", pantalon: "#3b3f4a", coiffe: "mineur", coiffeCouleur: "#b8862e", outil: "pioche", suie: true },
    orfevre: { habit: "#6b3fa0", pantalon: "#2f2a3a", coiffe: "calot", coiffeCouleur: "#3b2a5a", tablier: "#c9b48f", outil: "marteau" },
    macon: { habit: "#d9c9a3", pantalon: "#6b6058", coiffe: "calot", coiffeCouleur: "#f6f2e8", tablier: "#8a7a60", outil: "marteauForge", suie: false }, // étape 12 : le maçon-couvreur
    // Étape 15 : l'élevage
    puits: { habit: "#5a7bb5", pantalon: "#5a4630", coiffe: "feutre", coiffeCouleur: "#3b4a6a", outil: null },
    faneur: { habit: "#c9a24a", pantalon: "#5a4630", coiffe: "paille", coiffeCouleur: "#e8c64a", outil: "fourche" },
    etable: { habit: "#7a9a4a", pantalon: "#3b4a6a", coiffe: "bonnet", coiffeCouleur: "#8a5a2b", tablier: "#c9b48f", outil: null },
    laiterie: { habit: "#ffffff", pantalon: "#5a6a8a", coiffe: "calot", coiffeCouleur: "#5fa8d9", tablier: "#dfe8f0", outil: null },
    veterinaire: { habit: "#f6f2e8", pantalon: "#3b4a3a", coiffe: "feutre", coiffeCouleur: "#4f9e3e", outil: null, soigne: true },
    fromagerie: { habit: "#e8d9a8", pantalon: "#6b6058", coiffe: "calot", coiffeCouleur: "#ffffff", tablier: "#ffffff", outil: null },
    cremerie: { habit: "#f6d8e8", pantalon: "#6b6058", coiffe: "calot", coiffeCouleur: "#ffffff", tablier: "#ffffff", outil: null },
    // Étape 16
    poulailler: { habit: "#e8a0b0", pantalon: "#6b6058", coiffe: "bonnet", coiffeCouleur: "#ffffff", tablier: "#f1e3c4", outil: null },
    bergerie: { habit: "#8a6a48", pantalon: "#4a3a2a", coiffe: "feutre", coiffeCouleur: "#5a4630", outil: null },
    porcherie: { habit: "#a8b8c9", pantalon: "#5a4630", coiffe: "bonnet", coiffeCouleur: "#6b4423", outil: "fourche" },
    tisserand: { habit: "#7a5ab0", pantalon: "#3b3a5a", coiffe: "calot", coiffeCouleur: "#c4b6d6", outil: null },
    tailleur: { habit: "#3f8a8a", pantalon: "#2f3a4a", coiffe: null, tablier: "#c9b48f", outil: null },
    charcuterie: { habit: "#ffffff", pantalon: "#6b6058", coiffe: "calot", coiffeCouleur: "#ffffff", tablier: "#e8b0b0", outil: null },
    porteur: { habit: "#4a90d9", pantalon: "#5a3a20", coiffe: "bonnet", coiffeCouleur: "#2f6db5", outil: null },
  };

  // Le bonhomme lui-même, les pieds en (0, 0), regardant vers la droite.
  //   p : { tenue, traits, pas (de −1 à 1 en marchant), brasArriere, brasAvant (des angles), accroupi (0 à 1),
  //         triste, hiver, taille }
  function bonhomme(ctx, p) {
    const T = p.tenue, tr = p.traits, fin = vue.fin, pas = p.pas || 0, acc = p.accroupi || 0;
    vue.bonshommes++;
    ctx.save();
    if (p.taille && p.taille !== 1) ctx.scale(p.taille, p.taille);
    const bas = acc * 3; // accroupi : tout le haut du corps descend
    ctx.translate(0, bas);
    // Le bras de derrière (il passe derrière le corps)
    brasDessin(ctx, p.brasArriere || 0, T, tr, true);
    // Les jambes, avec des chaussures
    ctx.lineCap = "round";
    const genou = acc * 3;
    ctx.strokeStyle = T.pantalon; ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-2, -6); ctx.lineTo(-2 + pas * 1.4 + genou, -3 - bas / 2); ctx.lineTo(-2 + pas * 2.5, -bas);
    ctx.moveTo(2, -6); ctx.lineTo(2 - pas * 1.4 + genou, -3 - bas / 2); ctx.lineTo(2 - pas * 2.5, -bas);
    ctx.stroke();
    ctx.fillStyle = "#3b2614";
    for (const s of [1, -1]) { ctx.beginPath(); ctx.ellipse(s * 2 + s * pas * 2.5 + 0.8, -bas + 0.2, 1.8, 1, 0, 0, TOUR); ctx.fill(); }
    // Le corps (un œuf), ou une robe pour le savant
    if (T.robe) forme(ctx, [[-4.5, -16], [4.5, -16], [6, -4], [-6, -4]], T.habit);
    else { ctx.beginPath(); ctx.ellipse(0, -10, 4.8, 6, 0, 0, TOUR); ctx.fillStyle = T.habit; ctx.fill(); contour(ctx, 1.4); }
    if (fin) {
      if (T.carreaux) { // la chemise à carreaux du bûcheron
        ctx.save(); ctx.beginPath(); ctx.ellipse(0, -10, 4.6, 5.8, 0, 0, TOUR); ctx.clip();
        ctx.strokeStyle = "rgba(40, 10, 10, .45)"; ctx.lineWidth = 0.8; ctx.beginPath();
        for (let k = -4; k <= 4; k += 2.5) { ctx.moveTo(k, -17); ctx.lineTo(k, -3); ctx.moveTo(-6, -14 + k); ctx.lineTo(6, -14 + k); }
        ctx.stroke(); ctx.restore();
      }
      ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.ellipse(-1.6, -12, 1.5, 3, 0, 0, TOUR); ctx.fill(); // un reflet
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.beginPath(); ctx.ellipse(2.2, -9, 1.8, 4, 0, 0, TOUR); ctx.fill(); // une ombre
    }
    if (T.tablier) { forme(ctx, [[1, -13], [4.6, -12], [4.4, -5], [1.4, -4.2]], T.tablier); }
    else if (!T.robe) { ctx.fillStyle = "#6b4423"; ctx.fillRect(-4.6, -9, 9.2, 1.8); } // la ceinture
    // ❄️ En hiver, une écharpe rouge
    if (p.hiver) { ctx.fillStyle = "#e8402e"; ctx.fillRect(-3.8, -15.6, 7.6, 2.4); ctx.fillRect(-3.6, -15, 2.4, 5.5); }
    // La tête
    const ht = p.triste ? 0.8 : 0; // la tête un peu baissée quand on a faim
    ctx.translate(0, ht);
    rond(ctx, 0, -19, 4.3, tr.peau);
    // Les cheveux (3 coupes)
    ctx.fillStyle = tr.cheveux;
    ctx.beginPath();
    if (tr.coupe === 0) { ctx.arc(-0.5, -20, 4.4, Math.PI * 0.85, Math.PI * 1.82); }
    else if (tr.coupe === 1) { ctx.arc(-0.8, -20.3, 4.5, Math.PI * 0.6, Math.PI * 1.8); ctx.lineTo(-4.6, -16); }
    else { ctx.ellipse(-1, -20.5, 4.5, 3.3, 0, Math.PI * 0.9, Math.PI * 1.82); ctx.arc(-3.8, -17, 1.6, 0, TOUR); }
    ctx.fill();
    if (tr.barbe || T.barbe) { ctx.beginPath(); ctx.ellipse(1.8, -16.2, 2.4, 1.8, 0.2, 0, Math.PI); ctx.fillStyle = tr.cheveux; ctx.fill(); }
    // Le visage (de près seulement)
    const cligne = (vue.t + tr.cligne) % 4 < 0.14; // il cligne des yeux de temps en temps
    if (fin) {
      ctx.fillStyle = "rgba(230, 110, 100, .35)"; ctx.beginPath(); ctx.arc(2.6, -17.6, 1, 0, TOUR); ctx.fill(); // la joue rose
      ctx.strokeStyle = CONTOUR; ctx.lineWidth = 0.7; ctx.lineCap = "round";
      if (cligne) { ctx.beginPath(); ctx.moveTo(1.2, -19.4); ctx.lineTo(2.6, -19.4); ctx.stroke(); }
      else { ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(2, -19.5, 0.75, 0, TOUR); ctx.fill(); ctx.fillStyle = "#ffffff"; ctx.fillRect(2.1, -20, 0.35, 0.35); }
      ctx.beginPath(); ctx.moveTo(1, p.triste ? -21 : -21.3); ctx.lineTo(2.9, p.triste ? -20.6 : -21.4); ctx.stroke(); // le sourcil
      ctx.beginPath(); ctx.moveTo(4.1, -19); ctx.quadraticCurveTo(5.1, -18.3, 4.2, -17.8); ctx.stroke(); // le nez
      ctx.beginPath(); // la bouche : un sourire, ou triste quand on a faim
      if (p.triste) { ctx.moveTo(1.6, -15.9); ctx.quadraticCurveTo(2.6, -16.7, 3.6, -16); }
      else { ctx.moveTo(1.6, -16.6); ctx.quadraticCurveTo(2.7, -15.6, 3.7, -16.5); }
      ctx.stroke();
      if (T.suie) { ctx.fillStyle = "rgba(40,40,40,.35)"; ctx.beginPath(); ctx.arc(0.6, -17.4, 0.9, 0, TOUR); ctx.arc(3.3, -20.5, 0.6, 0, TOUR); ctx.fill(); } // des traces de suie
    } else { ctx.fillStyle = CONTOUR; ctx.beginPath(); ctx.arc(1.8, -19.5, 0.8, 0, TOUR); ctx.fill(); }
    coiffe(ctx, T);
    ctx.translate(0, -ht);
    // Le bras de devant
    brasDessin(ctx, p.brasAvant || 0, T, tr, false);
    ctx.restore();
  }

  function brasDessin(ctx, angle, T, tr, derriere) {
    const [hx, hy] = main(angle);
    ctx.strokeStyle = derriere ? assombrir(T.habit) : T.habit; ctx.lineWidth = 2.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(EPAULE[0], EPAULE[1]); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.beginPath(); ctx.arc(hx, hy, 1.3, 0, TOUR); ctx.fillStyle = tr.peau; ctx.fill(); // la main
  }
  // Une couleur un peu plus foncée (pour ce qui est derrière)
  function assombrir(c) {
    const n = parseInt(c.slice(1), 16), f = 0.75;
    return "rgb(" + Math.round(((n >> 16) & 255) * f) + "," + Math.round(((n >> 8) & 255) * f) + "," + Math.round((n & 255) * f) + ")";
  }

  // Les chapeaux de chaque métier
  function coiffe(ctx, T) {
    const c = T.coiffeCouleur;
    switch (T.coiffe) {
      case "bonnet": ctx.beginPath(); ctx.arc(-0.2, -20.4, 4.5, Math.PI, 0); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1.1);
        ctx.beginPath(); ctx.arc(-0.5, -25.2, 1.3, 0, TOUR); ctx.fillStyle = "#ffffff"; ctx.fill(); break; // le pompon
      case "casque": ctx.beginPath(); ctx.ellipse(0, -21, 5.2, 3, 0, Math.PI, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1.1);
        ctx.fillStyle = c; ctx.fillRect(-5.5, -21.3, 11, 1.4); break;
      case "mineur": ctx.beginPath(); ctx.ellipse(0, -21, 5, 3, 0, Math.PI, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1.1);
        ctx.fillStyle = "#fff6b0"; ctx.beginPath(); ctx.arc(3.6, -22.4, 1.3, 0, TOUR); ctx.fill(); contour(ctx, 0.7); break; // la lampe frontale
      case "feutre": ctx.beginPath(); ctx.ellipse(0, -21.4, 6.5, 1.6, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1);
        forme(ctx, [[-3.4, -21.6], [3.4, -21.6], [2.8, -25.5], [-2.8, -25.5]], c); break;
      case "suroit": ctx.beginPath(); ctx.ellipse(-0.6, -21, 5.6, 3.4, -0.15, Math.PI, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1);
        ctx.beginPath(); ctx.moveTo(-6, -20.2); ctx.lineTo(-7.5, -17.5); ctx.lineTo(-3.8, -19.5); ctx.closePath(); ctx.fill(); break; // le rabat dans le cou
      case "capuche": ctx.beginPath(); ctx.arc(-0.6, -19.4, 5, Math.PI * 0.55, Math.PI * 1.9); ctx.lineTo(-1.5, -26); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1); break;
      case "explorateur": ctx.beginPath(); ctx.ellipse(0, -21.6, 6.2, 1.8, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1);
        ctx.beginPath(); ctx.arc(0, -22, 3.6, Math.PI, 0); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1); ctx.fillStyle = "#6b4423"; ctx.fillRect(-3.5, -22.6, 7, 1); break;
      case "calot": ctx.beginPath(); ctx.ellipse(-0.3, -22.2, 4.2, 2.2, -0.1, Math.PI, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1); break;
      case "paille": ctx.beginPath(); ctx.ellipse(0, -21.2, 7, 1.9, 0, 0, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1); // le chapeau de paille
        ctx.beginPath(); ctx.arc(0, -21.6, 3.5, Math.PI, 0); ctx.fill(); contour(ctx, 1); ctx.fillStyle = "#c8503a"; ctx.fillRect(-3.4, -22.2, 6.8, 0.9); break;
      case "toque": forme(ctx, [[-3.2, -21.6], [3.2, -21.6], [3.4, -25], [-3.4, -25]], c); // la toque du boulanger
        ctx.beginPath(); ctx.arc(-2, -26, 2.4, 0, TOUR); ctx.arc(2, -26, 2.4, 0, TOUR); ctx.arc(0, -27.4, 2.6, 0, TOUR); ctx.fillStyle = c; ctx.fill(); contour(ctx, 1); break;
      case "savant": forme(ctx, [[-4.6, -21.5], [4.6, -21.5], [0.5, -30]], c); ctx.fillStyle = "#ffcf2e"; ctx.beginPath(); ctx.arc(0.6, -26, 0.9, 0, TOUR); ctx.arc(-1.5, -23.4, 0.7, 0, TOUR); ctx.fill(); break; // le chapeau pointu étoilé
    }
  }

  // Les outils, tenus dans la main (ma = la position de la main, angle = la direction de l'outil)
  function outilEnMain(ctx, sorte, ma, angle) {
    ctx.save(); ctx.translate(ma[0], ma[1]); ctx.rotate(-angle + Math.PI); // l'outil continue le bras
    const manche = (l) => { ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -l); ctx.stroke(); };
    // Étape 17 : des outils en PIERRE (gris-brun), puis en FER (gris clair et brillant) après la recherche
    ctx.fillStyle = vue.fer ? "#c9ccd1" : "#a39a8c"; ctx.strokeStyle = CONTOUR; ctx.lineWidth = 1;
    if (sorte === "hache") { manche(10); ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(4.8, -11.5); ctx.quadraticCurveTo(5.8, -8.5, 4.8, -6); ctx.lineTo(0, -7.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (sorte === "pioche") { manche(10); ctx.beginPath(); ctx.moveTo(-4.2, -8.8); ctx.quadraticCurveTo(0, -12.2, 4.2, -8.8); ctx.lineTo(0, -10.4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (sorte === "pelle") { manche(9); ctx.beginPath(); ctx.moveTo(-2.6, -9); ctx.lineTo(2.6, -9); ctx.lineTo(1.8, -14.5); ctx.quadraticCurveTo(0, -16, -1.8, -14.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (sorte === "marteau") { manche(6); ctx.fillRect(-2.6, -8.5, 5.2, 2.6); ctx.strokeRect(-2.6, -8.5, 5.2, 2.6); }
    else if (sorte === "marteauForge") { manche(7); ctx.fillStyle = "#5a5f68"; ctx.fillRect(-3.2, -10, 6.4, 3.4); ctx.strokeRect(-3.2, -10, 6.4, 3.4); }
    else if (sorte === "ringard") { ctx.strokeStyle = "#5a5f68"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -16); ctx.stroke(); ctx.strokeStyle = "#ff8a1f"; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -16.5); ctx.stroke(); }
    else if (sorte === "fourche") { manche(11); ctx.strokeStyle = "#8b9099"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2.5, -11); ctx.lineTo(2.5, -11); for (const k of [-2.5, 0, 2.5]) { ctx.moveTo(k, -11); ctx.lineTo(k, -15); } ctx.stroke(); }
    else if (sorte === "pelleAPain") { manche(12); forme(ctx, [[-3, -12], [3, -12], [3.5, -17], [-3.5, -17]], "#c9965a"); }
    else if (sorte === "scie") { ctx.fillStyle = "#d8dce2"; ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-1, -12); ctx.lineTo(2.5, -12); ctx.lineTo(2.5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(-1.8, 0, 5, 3); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- un ouvrier qui marche ou travaille dehors
  // `graine` : le numéro du bâtiment (chaque ouvrier garde sa tête). Les gestes de travail :
  //   bûcheron et carrier : lever l'outil (lentement), frapper (vite), revenir ;
  //   forestier : enfoncer la pelle, soulever la terre, puis s'accroupir pour planter ;
  //   pêcheur : la canne tenue à 2 mains, et une petite secousse de temps en temps ;
  //   chasseur : tendre l'arc (le bras recule), puis lâcher ; géologue : accroupi, il tape sur la roche.
  function dessinerOuvrier(ctx, type, o, x, y, t, hiver, graine) {
    const T = TENUES[type] || TENUES.porteur, tr = traits(graine || 1);
    const marche = o.etat === "aller" || o.etat === "revenir";
    const travaille = o.etat === "travailler";
    const cycle = t * 14, pas = marche ? Math.sin(cycle) : 0;
    const saut = marche ? Math.abs(Math.sin(cycle)) * 1.4 : 0;
    let brasAvant = marche ? 0.15 + pas * 0.55 : 0.2, brasArriere = marche ? 0.15 - pas * 0.55 : 0.1, penche = 0, accroupi = 0;
    let outil = T.outil, angleOutil = null; // angleOutil null : l'outil suit le bras de devant
    if (travaille) {
      if (outil === "hache" || outil === "pioche") {
        // Lever (60 % du temps), frapper (15 %), revenir
        const ph = (t * 1.5) % 1;
        const a = ph < 0.6 ? 0.9 + (ph / 0.6) * 2.1 : ph < 0.75 ? 3 - ((ph - 0.6) / 0.15) * 2 : 1 + ((ph - 0.75) / 0.25) * -0.1;
        brasAvant = a; brasArriere = a - 0.15; penche = ph >= 0.6 && ph < 0.85 ? 0.18 : -0.05;
      } else if (outil === "pelle") {
        const ph = (t * 0.8) % 1;
        if (ph < 0.7) { const d = Math.sin(ph / 0.7 * Math.PI); brasAvant = 0.8 + d * 0.7; brasArriere = 1.1 + d * 0.5; penche = 0.25 - d * 0.2; }
        else { accroupi = 1; brasAvant = 0.9 + Math.sin(t * 8) * 0.2; brasArriere = 0.5; outil = null; } // il plante la pousse avec les mains
      } else if (outil === "canne") {
        const secousse = Math.sin(t * 1.3) > 0.95 ? 0.25 : 0;
        brasAvant = 1.45 + secousse; brasArriere = 1.25 + secousse; angleOutil = 2.35 + secousse;
      } else if (outil === "marteauForge") { // étape 12 : le maçon tape sur le mur et le toit
        const coup = Math.sin(t * 9) > 0; brasAvant = coup ? 1.6 : 2.8; brasArriere = 2.2; penche = coup ? 0.12 : -0.05;
      } else if (T.soigne) { // étape 15 : le vétérinaire, accroupi, soigne la vache
        accroupi = 1; brasAvant = 1.2 + Math.sin(t * 5) * 0.3; brasArriere = 0.9; penche = 0.1;
      } else if (outil === "marteau") {
        accroupi = 1; brasAvant = 1.0 + Math.abs(Math.sin(t * 9)) * 0.6; brasArriere = 0.7; penche = 0.15;
      }
    } else if (marche && outil && !o.porte && outil !== "arc" && outil !== "canne") { brasAvant = 0.35 + pas * 0.3; } // l'outil sur l'épaule
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(o.direction, 1); // il regarde à gauche ou à droite
    ctx.fillStyle = "rgba(20, 40, 10, .25)";
    ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.5, 0, 0, TOUR); ctx.fill();
    ctx.translate(0, -saut);
    if (outil === "arc") { ctx.fillStyle = "#6b4423"; ctx.fillRect(-6, -18, 2.5, 9); ctx.strokeStyle = "#e8402e"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, -18); ctx.lineTo(-6.5, -21); ctx.moveTo(-4, -18); ctx.lineTo(-4, -21.5); ctx.stroke(); } // le carquois
    // Ce qu'il rapporte : comme les porteurs (sur l'épaule, ou dans une hotte sur le dos)
    const facon = o.porte ? FACON[o.porte] || "hotte" : null;
    if (facon === "hotte") { forme(ctx, [[-8, -20], [-2, -20], [-3, -9], [-7, -9]], "#b98a55"); objetPorte(ctx, o.porte, -5.5, -22); }
    if (facon === "epaule") { brasAvant = 2.7; outil = null; }
    else if (facon === "hotte") { brasArriere = -2.6; }
    let tir = 0;
    if (outil === "arc") {
      const m = o.minuteur;
      tir = travaille && m > 1 ? Math.min(1, (C_.ouvriers.chasser - m) / 2.5) : 0;
      if (travaille) { brasAvant = 1.57; brasArriere = 1.57; }
    }
    ctx.rotate(penche);
    bonhomme(ctx, { tenue: T, traits: tr, pas, brasArriere, brasAvant, accroupi, triste: o.affame, hiver });
    if (accroupi) ctx.translate(0, 3);
    // L'outil dans la main de devant
    if (outil === "arc") arcEnMain(ctx, o, t, travaille, tir);
    else if (outil === "canne") { const ma = main(brasAvant); ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ma[0] - 2, ma[1] + 2); ctx.lineTo(travaille ? 12 : ma[0] + 3, travaille ? -22 : ma[1] - 15); ctx.stroke(); }
    else if (outil) outilEnMain(ctx, outil, main(brasAvant), angleOutil === null ? brasAvant : angleOutil);
    if (facon === "epaule") {
      if (o.porte === "troncs") { ctx.save(); ctx.translate(1, -23); ctx.rotate(-0.3); rondin(ctx, 0, 0, 0); ctx.restore(); }
      else objetPorte(ctx, o.porte, 2, -23);
    }
    ctx.restore();
    if (vue.noirceur > 0.3 && T.coiffe === "mineur") lumiere(x + 3.6 * o.direction, y - 22 - saut, 18, "jaune", 0.8);
  }

  // ---------------------------------------------------------------- un villageois sans travail (étape 13)
  // Habits simples (une tunique de couleur), pas d'outil. Quand il va au travail, une bulle montre où :
  // l'emoji du bâtiment qui l'attend.
  const TUNIQUES = ["#c9b48f", "#a8b8c9", "#c99a8f", "#a9c49a", "#c4b6d6", "#d6c48f"];
  function dessinerVillageois(ctx, v, x, y, t) {
    const marche = !!v.chemin && v.pas < (v.chemin ? v.chemin.length : 0);
    const pas = marche ? Math.sin(t * (v.etat === "travail" ? 14 : 9) + v.numero) : 0;
    const tenue = { habit: TUNIQUES[v.numero % TUNIQUES.length], pantalon: "#6b5a48", coiffe: null };
    ctx.save(); ctx.translate(x, y); ctx.scale(v.direction || 1, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .22)"; ctx.beginPath(); ctx.ellipse(0, 1, 5.5, 2.3, 0, 0, TOUR); ctx.fill();
    ctx.translate(0, marche ? -Math.abs(pas) * 1.2 : 0);
    bonhomme(ctx, { tenue, traits: traits(v.numero * 11 + 7), pas, brasAvant: marche ? 0.15 + pas * 0.5 : 0.1, brasArriere: marche ? 0.15 - pas * 0.5 : 0.05, triste: v.affame, hiver: vue.hiver });
    ctx.restore();
    if (v.etat === "travail" && v.vers) bulleDePensee(ctx, x + 3, y - 38, t, Village.Batiments.TYPES[v.vers.type].emoji);
    else if (!marche && vue.fin && Math.sin(t * 0.7 + v.numero) > 0.8) bulleDePensee(ctx, x + 3, y - 38, t, "💭"); // il attend du travail
  }

  // L'arc du chasseur : il le tend pendant 2,5 s (la corde recule avec la main), puis il lâche la flèche.
  function arcEnMain(ctx, o, t, travaille, tir) {
    const m = o.minuteur, vibre = travaille && m <= 1 && m > 0.7 ? Math.sin(t * 60) * 0.8 : 0;
    const ma = main(travaille ? 1.57 : 0.4);
    ctx.save(); ctx.translate(ma[0] + 1, ma[1]); ctx.rotate(travaille ? 0 : 0.5);
    ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-3, 0, 7.5, -1.25 - tir * 0.15, 1.25 + tir * 0.15); ctx.stroke(); // le bois de l'arc (il se plie)
    const hx = -3 + Math.cos(-1.25) * 7.5, hy = Math.sin(-1.25) * 7.5, bx = -3 + Math.cos(1.25) * 7.5, by = Math.sin(1.25) * 7.5;
    const cx = (hx + bx) / 2 - tir * 6 + vibre;
    ctx.strokeStyle = "#f3ead8"; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(cx, 0); ctx.lineTo(bx, by); ctx.stroke(); // la corde
    if (travaille && m > 1) {
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx + 15, 0); ctx.stroke();
      ctx.fillStyle = "#c9ccd1"; ctx.beginPath(); ctx.moveTo(cx + 17, 0); ctx.lineTo(cx + 14, -1.6); ctx.lineTo(cx + 14, 1.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx - 2, -2); ctx.lineTo(cx + 2, 0); ctx.lineTo(cx - 2, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, 0, 1.3, 0, TOUR); ctx.fillStyle = "#f2c79b"; ctx.fill(); // la main qui tire la corde
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- les ouvriers des ateliers (étape 10)
  // Le scieur, le fondeur, le forgeron, le mineur, le savant et le marchand travaillent devant leur
  // bâtiment : on les dessine avec lui, à une place fixe, avec leur geste.
  function ouvrierDevant(ctx, b, x, y, t, s) {
    s = s || 1;
    const T = TENUES[b.type];
    if (!T || !b.ouvrier) return;
    const tr = traits(b.numero), actif = !!b.travail || (b.type === "universite" && Village.monde && Village.monde.recherches.enCours) || b.type === "marche";
    if (!actif || (b.type === "marche" && vue.noirceur > 0.5)) return; // le marchand rentre le soir
    let dx = 0, dy = 0, dir = 1, brasAvant = 0.3, brasArriere = 0.2, penche = 0, outil = T.outil, angle = null, accroupi = 0;
    if (b.type === "scierie") { // il pousse et tire la scie
      dx = -2; dy = 14; const va = Math.sin(t * 7); brasAvant = 1.3 + va * 0.3; brasArriere = 1.2 + va * 0.3; penche = 0.1 + va * 0.05; angle = 1.57;
    } else if (b.type === "forge") { // il tape sur l'enclume, en même temps que les étincelles
      dx = 22; dy = 10; dir = -1; const coup = Math.sin(t * 10); brasAvant = coup > 0 ? 1.2 : 2.6; brasArriere = 1.0; penche = coup > 0 ? 0.15 : -0.05;
    } else if (b.type === "fonderie") { // il remue le four avec une longue barre
      dx = -4; dy = 14; const va = Math.sin(t * 3); brasAvant = 1.3 + va * 0.2; brasArriere = 1.4 + va * 0.2; angle = 1.9 + va * 0.15; penche = 0.12;
    } else if (b.type === "mineCharbon" || b.type === "mineFer" || b.type === "mineOr") { // il creuse à l'entrée de la mine
      dx = -16; dy = 6; const ph = (t * 1.2) % 1; brasAvant = ph < 0.6 ? 0.9 + ph * 3.5 : 3 - (ph - 0.6) * 5; brasArriere = brasAvant - 0.2; penche = ph > 0.6 ? 0.18 : 0;
      if (b.ouvrier && ["aller", "travailler", "revenir"].includes(b.ouvrier.etat)) return; // étape 26 : il est parti au filon (dessiné à sa place, sur la carte)
    } else if (b.type === "universite") { // il lit un gros livre, et tourne les pages
      dx = 10; dy = 14; brasAvant = 1.2; brasArriere = 1.1;
    } else if (b.type === "ferme") { // il remue la paille avec sa fourche
      dx = 20; dy = 8; dir = -1; const va = Math.sin(t * 3); brasAvant = 1.1 + va * 0.4; brasArriere = 0.9 + va * 0.3; penche = 0.1 + va * 0.08;
    } else if (b.type === "moulin") { // il porte un sac de farine
      dx = -12; dy = 14; brasAvant = 2.7; brasArriere = 0.3;
    } else if (b.type === "boulangerie") { // il enfourne le pain avec sa grande pelle
      dx = 2; dy = 13; const va = Math.sin(t * 2.5); brasAvant = 1.4 + va * 0.15; brasArriere = 1.3 + va * 0.15; angle = 1.7; penche = 0.08 + va * 0.05;
    } else if (b.type === "mineOr") {
      dx = -16; dy = 6; const ph = (t * 1.2) % 1; brasAvant = ph < 0.6 ? 0.9 + ph * 3.5 : 3 - (ph - 0.6) * 5; brasArriere = brasAvant - 0.2; penche = ph > 0.6 ? 0.18 : 0;
    } else if (b.type === "orfevre") { // de tout petits coups de marteau, très précis
      dx = 12; dy = 13; brasAvant = 1.3 + Math.abs(Math.sin(t * 12)) * 0.25; brasArriere = 1.1;
    } else if (b.type === "puits") { // étape 15 : il tourne la manivelle
      dx = 22; dy = 6; dir = -1; brasAvant = 1.5 + Math.sin(t * 2.4) * 0.5; brasArriere = 1.3 + Math.cos(t * 2.4) * 0.4;
    } else if (b.type === "faneur") { // il retourne le foin avec sa fourche
      dx = 6; dy = 14; const va = Math.sin(t * 3); brasAvant = 1.1 + va * 0.4; brasArriere = 0.9 + va * 0.3; penche = 0.1 + va * 0.08;
    } else if (b.type === "etable") { // il trait une vache, accroupi sur son tabouret
      dx = 4; dy = 17; accroupi = 1; brasAvant = 1.5 + Math.sin(t * 9) * 0.2; brasArriere = 1.4 - Math.sin(t * 9) * 0.2;
    } else if (b.type === "laiterie") { // il baratte : les bras montent et descendent avec le bâton
      dx = 6; dy = 14; brasAvant = 2 + Math.abs(Math.sin(t * 5)) * 0.5; brasArriere = 1.9 + Math.abs(Math.sin(t * 5)) * 0.5;
    } else if (b.type === "fromagerie") { // il retourne les fromages, un par un
      dx = 10; dy = 14; brasAvant = 1.3 + Math.sin(t * 1.5) * 0.3; brasArriere = 1.2 + Math.sin(t * 1.5) * 0.3;
    } else if (b.type === "cremerie") { // il remue le lait avec sa grande cuillère
      dx = 2; dy = 13; brasAvant = 1.4 + Math.sin(t * 6) * 0.2; brasArriere = 1.1;
    } else if (b.type === "poulailler") { // étape 16 : elle lance du grain aux poules
      dx = 4; dy = 16; brasAvant = 1.4 + Math.sin(t * 4) * 0.6; brasArriere = 0.4;
    } else if (b.type === "bergerie") { // il tond un mouton, accroupi
      dx = 4; dy = 17; accroupi = 1; brasAvant = 1.3 + Math.sin(t * 10) * 0.15; brasArriere = 1.2;
    } else if (b.type === "porcherie") { // il remplit l'auge avec sa fourche
      dx = 4; dy = 15; const va = Math.sin(t * 3); brasAvant = 1.1 + va * 0.4; brasArriere = 0.9 + va * 0.3; penche = 0.1 + va * 0.08;
    } else if (b.type === "manoir") {
      // Étape 18 : une corniche entre les 2 étages, une haie taillée et un arbre en boule
      ctx.strokeStyle = "rgba(255, 255, 255, .75)"; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(x - m.a, y - m.h * 0.5); ctx.lineTo(x, y + m.a / 2 - m.h * 0.5); ctx.lineTo(x + m.a2, y + m.a / 2 - m.a2 / 2 - m.h * 0.5); ctx.stroke();
      for (let k = 0; k < 4; k++) rond(ctx, x + 10 + k * 4.5, y + 14 - k * 2.2, 2.6, vue.hiver ? "#e8eef5" : "#3f8a3a");
      ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 25, y + 10); ctx.lineTo(x - 25, y + 3); ctx.stroke();
      rond(ctx, x - 25, y + 1, 4.5, vue.hiver ? "#e8eef5" : "#4fa84a");
      if (!vue.hiver && vue.fin) { ctx.fillStyle = "#ff7ab6"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + 10 + k * 4.5, y + 12 - k * 2.2, 0.9, 0, TOUR); ctx.fill(); } }
    } else if (b.type === "depot") {
      // Étape 17 : des caisses, des tonneaux et le drapeau du village
      for (const [cx, cy, c] of [[x + 16, y + 10, "#b07740"], [x + 22, y + 7, "#9a6a3c"], [x + 19, y + 3, "#c48f5d"]]) forme(ctx, [[cx - 4, cy], [cx, cy + 2], [cx + 4, cy], [cx + 4, cy - 5], [cx, cy - 7], [cx - 4, cy - 5]], c);
      ctx.beginPath(); ctx.ellipse(x - 20, y + 12, 3, 1.4, 0, 0, TOUR); ctx.fillStyle = "#8a5a2b"; ctx.fill(); contour(ctx, 0.8);
      drapeau(ctx, x + 2, y - m.h - m.toit - 10, t, Village.Boutique.COULEURS_DRAPEAU[(Village.monde && Village.monde.drapeau) || 0]);
    } else if (b.type === "tisserand") { // il lance la navette d'une main à l'autre
      dx = 4; dy = 15; brasAvant = 1.5 + Math.sin(t * 4) * 0.3; brasArriere = 1.5 - Math.sin(t * 4) * 0.3;
    } else if (b.type === "tailleur") { // il coupe le tissu à petits coups de ciseaux
      dx = 4; dy = 15; brasAvant = 1.4 + Math.abs(Math.sin(t * 8)) * 0.2; brasArriere = 1.1;
    } else if (b.type === "charcuterie") { // il accroche les jambons
      dx = 2; dy = 15; brasAvant = 2.3 + Math.sin(t * 2) * 0.3; brasArriere = 1.8;
    } else if (b.type === "marche") { // il fait signe aux passants
      dx = 4; dy = 15; brasAvant = Math.sin(t * 2) > 0.3 ? 2.7 + Math.sin(t * 12) * 0.25 : 0.4; brasArriere = 0.3; outil = null;
    }
    ctx.save(); ctx.translate(x + dx * s, y + dy * s); ctx.scale(dir, 1); // étape 14 : la place suit la loupe, pas la taille
    ctx.fillStyle = "rgba(20, 40, 10, .25)"; ctx.beginPath(); ctx.ellipse(0, 1, 5.5, 2.3, 0, 0, TOUR); ctx.fill();
    ctx.rotate(penche);
    bonhomme(ctx, { tenue: T, traits: tr, brasAvant, brasArriere, accroupi, triste: b.ouvrier.affame, hiver: vue.hiver });
    if (b.type === "moulin") objetPorte(ctx, "farine", 3, -23);
    if (outil === "livre") { const ma = main(brasAvant); forme(ctx, [[ma[0] - 3, ma[1] - 3], [ma[0] + 3, ma[1] - 4], [ma[0] + 3, ma[1] + 1], [ma[0] - 3, ma[1] + 2]], Math.sin(t * 0.8) > 0.9 ? "#f6ead2" : "#a24b3a"); }
    else if (outil) outilEnMain(ctx, outil, main(brasAvant), angle === null ? brasAvant : angle);
    ctx.restore();
  }

  // ---------------------------------------------------------------- un animal (étapes 4 et 5)
  // Étape 5 : redessinés pour être plus jolis. Le cerf a un ventre clair, des taches de faon pour
  // les plus jeunes, des bois ramifiés pour les mâles. Le lapin a de grandes oreilles roses et une queue
  // en pompon, et il s'écrase un peu quand il retombe d'un bond. En hiver, le lapin devient blanc.
  // `chute` (de 0 à 1) : l'animal touché par une flèche bascule sur le côté.
  function dessinerAnimal(ctx, a, x, y, t, hiver, chute) {
    const marche = a.etat === "promener" && !chute;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(a.direction || 1, 1);
    ctx.fillStyle = "rgba(20, 40, 10, .22)";
    const grand = a.sorte === "cerf" || a.sorte === "sanglier" || a.sorte === "bouquetin";
    ctx.beginPath(); ctx.ellipse(0, 1, grand ? 10 : 5.5, 3, 0, 0, TOUR); ctx.fill();
    if (chute) { ctx.translate(0, -2); ctx.rotate(chute * 1.45); ctx.translate(0, 2); }
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (a.sorte === "cerf") cerf(ctx, a, t, marche);
    else if (a.sorte === "sanglier") sanglier(ctx, a, t, marche);
    else if (a.sorte === "canard") canard(ctx, a, t, marche);
    else if (a.sorte === "bouquetin") bouquetin(ctx, a, t, marche, hiver);
    else lapin(ctx, a, t, marche, hiver);
    // La flèche plantée
    if (chute) {
      ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.3;
      const h = grand ? -12 : -6;
      ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(-7, h - 6); ctx.stroke();
      ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.arc(-7, h - 6, 1.6, 0, TOUR); ctx.fill();
    }
    ctx.restore();
  }

  function cerf(ctx, a, t, marche) {
    const male = a.numero % 3 !== 0, faon = a.numero % 5 === 0;
    const e = faon ? 0.75 : 1;
    ctx.scale(e, e);
    const pas = marche ? Math.sin(t * 9 + a.numero) : 0;
    // Les pattes (fines, avec un sabot foncé), qui avancent par paires
    const patte = (px, decal) => {
      ctx.strokeStyle = "#7a4f28"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, -9); ctx.quadraticCurveTo(px + decal * 1.5, -4, px + decal * 2.5, 0); ctx.stroke();
      ctx.fillStyle = "#3b2614"; ctx.beginPath(); ctx.arc(px + decal * 2.5, 0, 1.1, 0, TOUR); ctx.fill();
    };
    patte(-6, pas); patte(-3.5, -pas); patte(5, -pas); patte(7.5, pas);
    // Le corps : une forme de haricot, plus clair en dessous
    ctx.beginPath();
    ctx.moveTo(-9, -11); ctx.bezierCurveTo(-9, -17, 6, -18, 9, -13); ctx.bezierCurveTo(11, -9, 7, -7, 0, -7.5); ctx.bezierCurveTo(-6, -7.5, -9.5, -8, -9, -11);
    ctx.closePath(); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.4);
    ctx.beginPath(); ctx.ellipse(0, -8.8, 6.5, 1.8, 0, 0, Math.PI); ctx.fillStyle = "#ecd4b0"; ctx.fill(); // le ventre
    if (faon) { ctx.fillStyle = "#f6ead4"; for (const [sx, sy] of [[-4, -13], [0, -14], [3, -12], [-1, -11], [5, -14]]) { ctx.beginPath(); ctx.arc(sx, sy, 0.9, 0, TOUR); ctx.fill(); } }
    // La queue blanche
    ctx.fillStyle = "#f6ead4"; ctx.beginPath(); ctx.ellipse(-9.5, -12.5, 1.6, 2.2, 0.4, 0, TOUR); ctx.fill(); contour(ctx, 1);
    // Le cou et la tête (la tête se baisse quand il broute)
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.3 + a.numero)) * 7;
    ctx.save(); ctx.translate(7, -14); ctx.rotate(baisse * 0.09);
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(1.5, -6); ctx.lineTo(4.5, -6); ctx.lineTo(3.5, 3); ctx.closePath(); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(5, -7.5, 4, 2.6, 0.35, 0, TOUR); ctx.fillStyle = "#b9824c"; ctx.fill(); contour(ctx, 1.2); // la tête
    ctx.fillStyle = "#3b2614"; ctx.beginPath(); ctx.arc(8.6, -6.2, 0.9, 0, TOUR); ctx.fill(); // la truffe
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(4.6, -8.4, 0.9, 0, TOUR); ctx.fill(); // l'œil
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(4.9, -8.7, 0.35, 0, TOUR); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.8, -10, 1.3, 2.6, -0.6, 0, TOUR); ctx.fillStyle = "#a8743f"; ctx.fill(); contour(ctx, 1); // l'oreille
    if (male && !faon) {
      // Les bois ramifiés
      ctx.strokeStyle = "#e9dcc0"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(3.5, -10); ctx.quadraticCurveTo(2, -15, 4, -19); ctx.moveTo(2.6, -14); ctx.lineTo(0, -16); ctx.moveTo(3.3, -17); ctx.lineTo(6, -19);
      ctx.moveTo(5, -10); ctx.quadraticCurveTo(7, -14, 6.5, -17); ctx.moveTo(6.4, -13.5); ctx.lineTo(9, -15);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 🐗 Le sanglier : trapu, poilu, brun foncé, avec son groin rose et ses petites défenses blanches.
  function sanglier(ctx, a, t, marche) {
    const pas = marche ? Math.sin(t * 11 + a.numero) : 0;
    const marcassin = a.numero % 4 === 0;
    if (marcassin) ctx.scale(0.65, 0.65);
    ctx.strokeStyle = "#3b2a1c"; ctx.lineWidth = 2.4;
    for (const [px, d] of [[-5, pas], [-2, -pas], [4, -pas], [6.5, pas]]) { ctx.beginPath(); ctx.moveTo(px, -6); ctx.lineTo(px + d * 1.5, 0); ctx.stroke(); }
    // Le corps, plus haut devant (le garrot)
    ctx.beginPath();
    ctx.moveTo(-9, -7); ctx.bezierCurveTo(-10, -14, 0, -17, 6, -15); ctx.bezierCurveTo(10, -13, 10, -7, 6, -5); ctx.lineTo(-6, -5); ctx.closePath();
    ctx.fillStyle = marcassin ? "#9a6a3e" : "#5a4030"; ctx.fill(); contour(ctx, 1.4);
    if (marcassin) { ctx.strokeStyle = "#e9c99a"; ctx.lineWidth = 1; for (const yy of [-12, -9.5]) { ctx.beginPath(); ctx.moveTo(-7, yy); ctx.lineTo(5, yy - 1); ctx.stroke(); } } // les rayures du marcassin
    // La crinière hérissée sur le dos
    ctx.strokeStyle = "#2e2016"; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const bx = -5 + k * 2; ctx.moveTo(bx, -15.5 + Math.abs(k - 3) * 0.4); ctx.lineTo(bx - 0.6, -18 + Math.abs(k - 3) * 0.5); } ctx.stroke();
    // La tête, le groin, l'oreille, l'œil, la défense
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.5 + a.numero)) * 3;
    ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(13, -9 + baisse); ctx.lineTo(13, -6 + baisse); ctx.lineTo(6, -6); ctx.closePath(); ctx.fillStyle = marcassin ? "#9a6a3e" : "#5a4030"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(13.3, -7.5 + baisse, 1.2, 1.8, 0, 0, TOUR); ctx.fillStyle = "#e3a3a0"; ctx.fill(); contour(ctx, 0.8);
    ctx.beginPath(); ctx.moveTo(7, -14); ctx.lineTo(6, -17.5); ctx.lineTo(9, -14.5); ctx.closePath(); ctx.fillStyle = "#3b2a1c"; ctx.fill();
    ctx.fillStyle = "#ffd36b"; ctx.beginPath(); ctx.arc(9.5, -11 + baisse * 0.6, 0.8, 0, TOUR); ctx.fill();
    if (!marcassin) { ctx.strokeStyle = "#f6f0e2"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -6 + baisse); ctx.quadraticCurveTo(13.5, -5 + baisse, 13, -8 + baisse); ctx.stroke(); }
    // La petite queue en tire-bouchon
    ctx.strokeStyle = "#3b2a1c"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-10, -10, 1.5, 0, Math.PI * 1.5); ctx.stroke();
  }

  // 🦆 Le canard : un colvert, tête verte, collier blanc, bec jaune ; il se dandine en marchant.
  function canard(ctx, a, t, marche) {
    const dandine = marche ? Math.sin(t * 10 + a.numero) * 0.12 : 0;
    const femelle = a.numero % 2 === 0;
    ctx.rotate(dandine);
    ctx.strokeStyle = "#e88a1f"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-1, -2); ctx.lineTo(-1, 0); ctx.moveTo(1.5, -2); ctx.lineTo(1.5, 0); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -5, 5.5, 3.6, -0.1, 0, TOUR); ctx.fillStyle = femelle ? "#a8835a" : "#b9b2a6"; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(-0.5, -5.5, 3, 1.8, -0.2, 0, TOUR); ctx.fillStyle = femelle ? "#8c6a46" : "#7d6a58"; ctx.fill(); // l'aile
    ctx.fillStyle = "#3e6fd1"; ctx.fillRect(-2, -5.6, 2.4, 1); // la petite tache bleue de l'aile
    ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(-7.5, -7); ctx.lineTo(-5.5, -4); ctx.closePath(); ctx.fillStyle = "#3b2614"; ctx.fill(); // la queue
    ctx.beginPath(); ctx.arc(4.2, -9.5, 2.4, 0, TOUR); ctx.fillStyle = femelle ? "#a8835a" : "#2f8a4a"; ctx.fill(); contour(ctx, 1); // la tête
    if (!femelle) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(4, -8.3, 2.2, 0.3, 2.6); ctx.stroke(); } // le collier
    ctx.beginPath(); ctx.moveTo(6.2, -10); ctx.lineTo(8.8, -9.3); ctx.lineTo(6.3, -8.6); ctx.closePath(); ctx.fillStyle = "#f2c230"; ctx.fill(); contour(ctx, 0.7);
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(5, -10.2, 0.6, 0, TOUR); ctx.fill();
  }

  // 🐐 Le bouquetin : pelage gris-brun, ventre clair, petite barbe, et de grandes cornes recourbées.
  function bouquetin(ctx, a, t, marche, hiver) {
    const pas = marche ? Math.sin(t * 10 + a.numero) * 2 : 0;
    const pelage = hiver ? "#cfc6b8" : "#9c8a72";
    ctx.strokeStyle = "#5e5040"; ctx.lineWidth = 1.8;
    for (const [px, d] of [[-5, pas], [-2.5, -pas], [3.5, -pas], [6, pas]]) { ctx.beginPath(); ctx.moveTo(px, -8); ctx.lineTo(px + d, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(0, -10.5, 7.5, 4, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.3);
    ctx.beginPath(); ctx.ellipse(0, -8, 5, 1.5, 0, 0, Math.PI); ctx.fillStyle = "#e9dfcc"; ctx.fill();
    const baisse = marche ? 0 : Math.max(0, Math.sin(t * 1.4 + a.numero)) * 4;
    ctx.save(); ctx.translate(6, -13); ctx.rotate(baisse * 0.08);
    ctx.beginPath(); ctx.moveTo(-1, 2); ctx.lineTo(1, -4); ctx.lineTo(4, -4); ctx.lineTo(3, 2); ctx.closePath(); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.1);
    ctx.beginPath(); ctx.ellipse(4.2, -5, 3, 2.1, 0.4, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.1);
    ctx.strokeStyle = "#e9dfcc"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(5.5, -3.4); ctx.lineTo(5.2, -1.2); ctx.stroke(); // la barbiche
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(4.2, -5.8, 0.7, 0, TOUR); ctx.fill();
    // Les grandes cornes en arc, avec leurs anneaux
    ctx.strokeStyle = "#6e5e48"; ctx.lineWidth = 2.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(2.5, -6.5); ctx.bezierCurveTo(0, -12, -6, -12, -6, -6); ctx.stroke();
    ctx.strokeStyle = "rgba(240, 230, 210, .6)"; ctx.lineWidth = 0.6;
    ctx.beginPath(); for (const q of [0.25, 0.45, 0.65]) { const bx = 2.5 - q * 9, by = -6.5 - Math.sin(q * Math.PI) * 5; ctx.moveTo(bx - 1, by - 0.5); ctx.lineTo(bx + 1, by + 0.5); } ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#5e5040"; ctx.beginPath(); ctx.ellipse(-7.5, -12, 1.2, 1.6, 0.4, 0, TOUR); ctx.fill(); // la queue
  }

  function lapin(ctx, a, t, marche, hiver) {
    const phase = (t * 2.2 + a.numero * 0.37) % 1;
    const saut = marche ? Math.sin(phase * Math.PI) * 5 : 0;
    const ecrase = marche && phase > 0.9 ? 0.85 : 1; // il s'écrase un peu en retombant
    const pelage = hiver ? "#f4f6fa" : "#a8998a", ombre2 = hiver ? "#dfe4ec" : "#8c7e70";
    ctx.translate(0, -saut);
    ctx.scale(1 / ecrase, ecrase);
    // Le corps tout rond
    ctx.beginPath(); ctx.ellipse(0, -4.5, 5, 4, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.2);
    ctx.beginPath(); ctx.ellipse(-1, -2, 3, 1.4, 0, 0, Math.PI); ctx.fillStyle = ombre2; ctx.fill(); // la patte arrière
    // La tête et les grandes oreilles
    ctx.beginPath(); ctx.arc(4.5, -8, 3, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1.2);
    const oreille = marche ? -0.35 : Math.sin(t * 3 + a.numero) * 0.12;
    for (const [ox, rot] of [[3.6, -0.25 + oreille], [5.4, 0.15 + oreille]]) {
      ctx.save(); ctx.translate(ox, -10.5); ctx.rotate(rot);
      ctx.beginPath(); ctx.ellipse(0, -3.5, 1.3, 3.8, 0, 0, TOUR); ctx.fillStyle = pelage; ctx.fill(); contour(ctx, 1);
      ctx.beginPath(); ctx.ellipse(0, -3.4, 0.6, 2.7, 0, 0, TOUR); ctx.fillStyle = "#f2a6b8"; ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#1c1410"; ctx.beginPath(); ctx.arc(5.6, -8.5, 0.75, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#f2a6b8"; ctx.beginPath(); ctx.arc(7.4, -7.6, 0.7, 0, TOUR); ctx.fill(); // le nez
    // La queue en pompon
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-5, -5.5, 2, 0, TOUR); ctx.fill(); contour(ctx, 0.8);
  }

  // ---------------------------------------------------------------- un porteur
  // Étape 9 : un objet tout seul (dans une charrette, une brouette, ou dans les bras)
  function objetPorte(ctx, quoi, x, y) {
    if (quoi === "poissons") poisson(ctx, x, y);
    else if (quoi === "viande") viande(ctx, x, y);
    else if (quoi === "troncs") { ctx.save(); ctx.translate(x, y); ctx.scale(0.6, 0.8); rondin(ctx, 0, 0, 0); ctx.restore(); }
    else if (quoi === "planches") planche(ctx, x, y, 14);
    else if (quoi === "charbon") charbon(ctx, x, y);
    else if (quoi === "fer") minerai(ctx, x, y);
    else if (quoi === "lingots") lingot(ctx, x, y);
    else if (quoi === "outils") outil(ctx, x, y);
    else if (quoi === "ble") gerbe(ctx, x, y); // étape 11
    else if (quoi === "farine") sacFarine(ctx, x, y);
    else if (quoi === "pain") miche(ctx, x, y);
    else if (quoi === "or") pepite(ctx, x, y);
    else if (quoi === "bijoux") bijou(ctx, x, y);
    else if (quoi === "eau") seau(ctx, x, y); // étape 15
    else if (quoi === "foin") botte(ctx, x, y);
    else if (quoi === "lait") bidon(ctx, x, y);
    else if (quoi === "beurre") motte(ctx, x, y);
    else if (quoi === "fromage") fromage(ctx, x, y);
    else if (quoi === "yaourt") pot(ctx, x, y);
    else if (quoi === "oeufs") oeufs(ctx, x, y); // étape 16
    else if (quoi === "laine") pelote(ctx, x, y);
    else if (quoi === "tissu") rouleau(ctx, x, y);
    else if (quoi === "vetements") veste(ctx, x, y);
    else if (quoi === "jambon") jambon(ctx, x, y);
    else caillou(ctx, x, y);
  }
  // Étape 9 : une pierre taillée, grise avec un reflet
  function caillou(ctx, x, y, v) {
    const d = ((v || 0) % 3) * 0.4;
    forme(ctx, [[x - 3.6, y + 1.5], [x - 3, y - 2], [x + 0.5, y - 3.3 + d], [x + 3.6, y - 1.2], [x + 3.2, y + 2], [x, y + 2.8]], ["#a3a8ad", "#9a9c9f", "#b0b3b6"][(v || 0) % 3]);
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.moveTo(x - 2.4, y - 1.4); ctx.lineTo(x + 0.4, y - 2.5); ctx.lineTo(x - 0.6, y - 0.5); ctx.closePath(); ctx.fill();
  }

  // Étape 11 : les objets du bourg
  function gerbe(ctx, x, y) { // une gerbe de blé
    ctx.strokeStyle = "#c9a636"; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let k = -2; k <= 2; k++) { ctx.moveTo(x + k * 0.6, y + 3); ctx.lineTo(x + k * 1.6, y - 4); } ctx.stroke();
    ctx.fillStyle = "#e8c64a"; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x + k * 1.7, y - 5, 0.9, 1.8, k * 0.2, 0, TOUR); ctx.fill(); }
    ctx.fillStyle = "#8a5a2b"; ctx.fillRect(x - 2, y, 4, 1.2); // le lien
  }
  function sacFarine(ctx, x, y) {
    ctx.beginPath(); ctx.ellipse(x, y - 1, 3.6, 4, 0, 0, TOUR); ctx.fillStyle = "#f6f2e8"; ctx.fill(); contour(ctx, 1);
    ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 1.6, y - 4.4); ctx.lineTo(x + 1.6, y - 4.6); ctx.stroke();
  }
  function miche(ctx, x, y) { // une miche de pain doré
    ctx.beginPath(); ctx.ellipse(x, y, 4.2, 2.6, 0, 0, TOUR); ctx.fillStyle = "#d9963a"; ctx.fill(); contour(ctx, 1);
    ctx.strokeStyle = "#f3d28a"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 2, y - 1.4); ctx.lineTo(x - 0.8, y + 0.6); ctx.moveTo(x, y - 1.8); ctx.lineTo(x + 1.2, y + 0.4); ctx.moveTo(x + 2, y - 1.4); ctx.lineTo(x + 3, y + 0.2); ctx.stroke();
  }
  // L'or : des pépites dorées qui brillent
  function pepite(ctx, x, y) { tas(ctx, x, y, (c, a, b, r) => facettes(c, a, b, r, "#fff1a0", "#f2c230", "#b8860b", "#ffffff")); }
  function bijou(ctx, x, y) { // une bague avec une pierre
    ctx.strokeStyle = "#ffcf2e"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y + 0.5, 2.6, 0, TOUR); ctx.stroke();
    forme(ctx, [[x - 1.6, y - 2.2], [x, y - 4.2], [x + 1.6, y - 2.2], [x, y - 1]], "#e84aa6");
  }

  // Étape 14 : ✍️ l'ICÔNE d'une ressource, dessinée (pour la barre du stock, le marché, les statistiques) :
  // de vraies planches, de vraies pépites… au lieu des emojis qui ne ressemblaient à rien.
  // Étape 28 : ✍️ « certains objets ne sont pas ressemblants dans l'inventaire, il faut mieux les distinguer ». Chaque
  // ressource a maintenant sa GRANDE icône, dessinée dans une boîte de 24 × 24 (de −12 à +12), toutes à la même taille,
  // avec une forme bien à elle (pas seulement une couleur). Les petits objets portés par les bonshommes restent ceux
  // d'avant (objetPorte).
  const ell = (ctx, x, y, rx, ry, couleur, sans) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TOUR); ctx.fillStyle = couleur; ctx.fill(); if (!sans) contour(ctx, 1.2); };
  const trace = (ctx, couleur, l, f) => { ctx.strokeStyle = couleur; ctx.lineWidth = l; ctx.lineCap = "round"; ctx.beginPath(); f(); ctx.stroke(); ctx.lineCap = "butt"; };
  const ICONES = {
    troncs: (c) => { // 3 bûches empilées, on voit les cernes
      for (const [x, y] of [[-5, 5], [5, 5], [0, -3.5]]) {
        forme(c, [[x - 1, y - 5], [x + 9, y - 8], [x + 9, y + 0.5], [x - 1, y + 4.5]], "#8a5a30");
        ell(c, x - 1, y - 0.3, 4.6, 4.8, "#e0b47a");
        trace(c, "rgba(110, 70, 30, .7)", 0.8, () => { c.ellipse(x - 1, y - 0.3, 2.6, 2.8, 0, 0, TOUR); c.moveTo(x - 0.4, y - 0.3); c.arc(x - 1, y - 0.3, 0.6, 0, TOUR); });
      }
    },
    planches: (c) => { planche(c, -1, 7, 22); planche(c, 1, 1.5, 22); planche(c, -0.5, -4, 22); },
    pierres: (c) => { c.save(); c.scale(1.9, 1.9); caillou(c, -2.6, 1.4, 0); caillou(c, 2.6, 1.6, 1); caillou(c, 0, -2, 2); c.restore(); },
    poissons: (c) => {
      forme(c, [[-12, 0], [-6, -6], [4, -6], [9, -1], [9, 1], [4, 6], [-6, 6]], "#7fb3d9");
      forme(c, [[8, 0], [13, -6], [12, 0], [13, 6]], "#5a93c0");
      forme(c, [[-3, -6], [1, -10], [4, -6]], "#5a93c0");
      trace(c, "rgba(40, 80, 120, .6)", 1, () => { for (const x of [-2, 1.5, 5]) { c.moveTo(x, -4.5); c.quadraticCurveTo(x + 1.5, 0, x, 4.5); } });
      ell(c, -8, -1.5, 1.6, 1.6, "#ffffff"); ell(c, -7.8, -1.5, 0.8, 0.8, "#1b2430", true);
    },
    viande: (c) => { // un gros pilon
      trace(c, "#3b2614", 5.5, () => { c.moveTo(3, 3); c.lineTo(10, 10); }); trace(c, "#f4ecd8", 3.6, () => { c.moveTo(3, 3); c.lineTo(10, 10); });
      ell(c, 10.5, 9, 2.4, 2.4, "#f4ecd8"); ell(c, 9, 11, 2.4, 2.4, "#f4ecd8");
      c.beginPath(); c.ellipse(-2, -2, 9.5, 8, -0.7, 0, TOUR); c.fillStyle = "#b5462e"; c.fill(); contour(c, 1.4);
      c.beginPath(); c.ellipse(-4, -4.5, 4, 2.2, -0.7, 0, TOUR); c.fillStyle = "rgba(255, 190, 150, .55)"; c.fill();
    },
    charbon: (c) => { // un tas de gros morceaux NOIRS, mats, avec des reflets bleutés
      for (const [x, y, r] of [[-6, 4, 5.5], [5, 4.5, 5.5], [0, -3, 6.5], [-1, 7, 4]]) facettes(c, x, y, r, "#4a4e5a", "#25272d", "#0d0e10", "rgba(190, 210, 255, .9)");
      trace(c, "rgba(60, 60, 70, .6)", 1, () => { c.moveTo(-11, 10); c.lineTo(11, 10); });
    },
    fer: (c) => { // une grosse pierre ROUSSE, avec des veines grises de métal
      forme(c, [[-11, 5], [-9, -5], [-2, -10], [7, -8], [11, -1], [9, 7], [0, 10], [-7, 9]], "#a8603e");
      forme(c, [[-2, -10], [7, -8], [11, -1], [3, -2]], "#c97a50");
      trace(c, "#c9ccd2", 2.2, () => { c.moveTo(-8, 2); c.quadraticCurveTo(-2, -3, 6, 1); c.moveTo(-4, 7); c.quadraticCurveTo(1, 4, 7, 6); });
      trace(c, "#ffffff", 0.8, () => { c.moveTo(-6, 0.6); c.lineTo(-3, -1.2); });
    },
    lingots: (c) => { c.save(); c.scale(1.7, 1.7); lingot(c, -1.2, 3); lingot(c, 1.6, 2.6); lingot(c, 0.2, -0.6); c.restore(); },
    outils: (c) => { // un marteau et une pioche croisés
      trace(c, "#3b2614", 4, () => { c.moveTo(-9, 10); c.lineTo(8, -8); c.moveTo(9, 10); c.lineTo(-8, -8); });
      trace(c, "#a8743f", 2.4, () => { c.moveTo(-9, 10); c.lineTo(8, -8); c.moveTo(9, 10); c.lineTo(-8, -8); });
      forme(c, [[4, -12], [12, -4], [9, -1], [1, -9]], "#8d939b"); // la tête du marteau
      c.beginPath(); c.moveTo(-13, -3); c.quadraticCurveTo(-9, -12, 0, -12); c.quadraticCurveTo(-7, -9, -9.5, -1.5); c.closePath(); c.fillStyle = "#b9bdc4"; c.fill(); contour(c, 1.2); // la pioche
    },
    ble: (c) => { // une gerbe d'épis, avec son lien
      for (let k = -3; k <= 3; k++) { const a = k * 0.14; trace(c, "#c9a02e", 1.2, () => { c.moveTo(0, 11); c.lineTo(Math.sin(a) * 18, 11 - Math.cos(a) * 18); }); c.save(); c.translate(Math.sin(a) * 15, 11 - Math.cos(a) * 15); c.rotate(a); ell(c, 0, 0, 1.8, 4.2, "#ecc24a"); c.restore(); }
      forme(c, [[-4, 3], [4, 3], [4, 6], [-4, 6]], "#8a5a2b");
    },
    farine: (c) => { // un sac de toile ficelé, avec un épi imprimé et de la farine qui déborde
      forme(c, [[-8, -6], [8, -6], [10, 10], [-10, 10]], "#efe6d2");
      forme(c, [[-8, -6], [-4, -10], [0, -7], [4, -10], [8, -6]], "#e2d6bb");
      trace(c, "#8a5a2b", 1.6, () => { c.moveTo(-7, -6.5); c.lineTo(7, -6.5); });
      trace(c, "#d0a640", 1.3, () => { c.moveTo(0, 7); c.lineTo(0, -1); for (let k = 0; k < 3; k++) { c.moveTo(0, 5 - k * 2.5); c.lineTo(-2.5, 3 - k * 2.5); c.moveTo(0, 5 - k * 2.5); c.lineTo(2.5, 3 - k * 2.5); } });
      ell(c, 8, 11, 4, 1.5, "#ffffff", true);
    },
    pain: (c) => { // une grosse miche dorée, avec ses entailles
      c.beginPath(); c.ellipse(0, 2, 12, 8.5, 0, 0, TOUR); c.fillStyle = "#c98a3a"; c.fill(); contour(c, 1.4);
      c.beginPath(); c.ellipse(-1, 0, 9, 5.5, 0, Math.PI, 0); c.fillStyle = "rgba(255, 220, 150, .5)"; c.fill();
      trace(c, "#f2d49a", 1.8, () => { for (const x of [-5, 0, 5]) { c.moveTo(x - 2, 4); c.lineTo(x + 2, -2); } });
    },
    or: (c) => { // des pépites dorées qui brillent
      for (const [x, y, r] of [[-5, 4, 5], [5, 5, 4.5], [0, -3, 6]]) facettes(c, x, y, r, "#fff1a0", "#f2c230", "#b8860b", "#ffffff");
      trace(c, "#fffbe0", 1.2, () => { c.moveTo(8, -9); c.lineTo(8, -3); c.moveTo(5, -6); c.lineTo(11, -6); });
    },
    bijoux: (c) => { // une grosse bague dorée à pierre rose, et un collier de perles
      trace(c, "#c9a636", 1.4, () => { c.arc(0, -6, 11, 0.12 * Math.PI, 0.88 * Math.PI); });
      for (let k = 0; k <= 8; k++) { const a = (0.12 + (0.76 * k) / 8) * Math.PI; ell(c, Math.cos(a) * 11, -6 + Math.sin(a) * 11, 1.9, 1.9, "#fbf6ee"); }
      c.beginPath(); c.arc(0, 3, 6.5, 0, TOUR); c.strokeStyle = "#3b2614"; c.lineWidth = 4.6; c.stroke(); c.strokeStyle = "#f2c230"; c.lineWidth = 3; c.stroke();
      forme(c, [[0, -9], [4.5, -5], [0, -2], [-4.5, -5]], "#e8508a");
      forme(c, [[0, -9], [-4.5, -5], [-1.5, -5]], "#ff9ac0");
    },
    eau: (c) => { // un seau en bois plein d'eau, et une goutte
      forme(c, [[-9, -4], [9, -4], [7, 11], [-7, 11]], "#9a6a3c");
      trace(c, "#5a5f68", 1.6, () => { c.moveTo(-8.5, 0); c.lineTo(8.5, 0); c.moveTo(-7.5, 7); c.lineTo(7.5, 7); });
      ell(c, 0, -4, 9, 2.6, "#4f9be0");
      trace(c, "#5a5f68", 1.3, () => { c.moveTo(-9, -4); c.quadraticCurveTo(0, -15, 9, -4); });
      c.beginPath(); c.moveTo(10, -12); c.quadraticCurveTo(13, -7, 10, -6); c.quadraticCurveTo(7, -7, 10, -12); c.fillStyle = "#7fc0f0"; c.fill(); contour(c, 1);
    },
    foin: (c) => { // une grosse botte RONDE, roulée
      forme(c, [[-6, -8], [8, -8], [8, 8], [-6, 8]], "#d8b84a");
      ell(c, -6, 0, 5, 8, "#e8cf6a");
      trace(c, "rgba(140, 110, 30, .7)", 0.9, () => { c.ellipse(-6, 0, 3, 5, 0, 0, TOUR); c.moveTo(-5.4, 0); c.arc(-6, 0, 0.8, 0, TOUR); for (const y of [-4, 0, 4]) { c.moveTo(0, y); c.lineTo(8, y); } });
    },
    lait: (c) => { // un bidon de lait en fer-blanc, avec son couvercle et ses poignées
      forme(c, [[-6, -4], [6, -4], [8, 11], [-8, 11]], "#d5dbe0");
      forme(c, [[-4, -10], [4, -10], [6, -4], [-6, -4]], "#c3cad0");
      ell(c, 0, -10, 4, 1.4, "#8d969e");
      trace(c, "#5a5f68", 1.5, () => { c.moveTo(-7.5, 1); c.lineTo(-10, 0); c.lineTo(-10, 4); c.lineTo(-8, 4); c.moveTo(7.5, 1); c.lineTo(10, 0); c.lineTo(10, 4); c.lineTo(8, 4); });
      forme(c, [[-7, 3], [7, 3], [7.5, 7], [-7.5, 7]], "#4a8ab8"); // la bande bleue
      ell(c, -3, 0, 1.4, 4, "rgba(255, 255, 255, .7)", true);
    },
    beurre: (c) => { // une motte jaune sur une planchette, avec un couteau
      forme(c, [[-12, 6], [0, 11], [12, 6], [0, 1]], "#a8743f");
      forme(c, [[-8, 2], [0, 6], [0, -2], [-8, -6]], "#f6d24a"); forme(c, [[0, 6], [8, 2], [8, -6], [0, -2]], "#e8bc2e"); forme(c, [[-8, -6], [0, -2], [8, -6], [0, -10]], "#ffe680");
      trace(c, "#c9ccd2", 2, () => { c.moveTo(2, -8); c.lineTo(11, -13); });
    },
    fromage: (c) => { // une meule entamée, avec ses trous
      c.beginPath(); c.moveTo(-11, -2); c.lineTo(-11, 5); c.ellipse(0, 5, 11, 5, 0, Math.PI, 0, true); c.lineTo(11, -2); c.ellipse(0, -2, 11, 5, 0, 0, Math.PI); c.closePath(); c.fillStyle = "#e0a81e"; c.fill(); contour(c, 1.3);
      c.beginPath(); c.ellipse(0, -2, 11, 5, 0, 0, TOUR); c.fillStyle = "#f6cf4a"; c.fill(); contour(c, 1.3);
      forme(c, [[0, -2], [11, -2], [11, 5], [0, 5]], "#fbe07a"); // la part qui manque montre l'intérieur
      for (const [x, y, r] of [[4, 0.5, 1.4], [8, 3, 1], [-5, -3, 1.3], [5, -4, 0.9]]) ell(c, x, y, r, r * 0.8, "#c98c10", true);
    },
    yaourt: (c) => { // un pot avec son couvercle rose et une cuillère
      forme(c, [[-8, -5], [8, -5], [6.5, 11], [-6.5, 11]], "#fbf6ee");
      ell(c, 0, -5, 8, 2.6, "#d96aa0");
      forme(c, [[-7.5, 1], [7.5, 1], [7.2, 4], [-7.2, 4]], "#5fa8d9");
      trace(c, "#c9ccd2", 1.8, () => { c.moveTo(3, -6); c.lineTo(9, -13); }); ell(c, 10, -13.5, 2, 1.4, "#c9ccd2");
    },
    oeufs: (c) => { // 3 œufs dans un nid de paille
      for (const [x, y, col] of [[-5, -1, "#f6ead8"], [4, -2, "#e9c9a4"], [0, -4, "#fbf6ee"]]) { c.beginPath(); c.ellipse(x, y, 4, 5.4, 0, 0, TOUR); c.fillStyle = col; c.fill(); contour(c, 1.1); }
      c.beginPath(); c.ellipse(0, 4, 12, 6, 0, 0, Math.PI); c.lineTo(-12, 2); c.ellipse(0, 2, 12, 3, 0, Math.PI, 0, true); c.closePath(); c.fillStyle = "#c9a04a"; c.fill(); contour(c, 1.2);
      trace(c, "rgba(120, 90, 30, .7)", 0.8, () => { for (let k = -9; k <= 9; k += 3) { c.moveTo(k, 3); c.lineTo(k + 2, 8); } });
    },
    laine: (c) => { // une pelote avec 2 aiguilles à tricoter
      trace(c, "#8a5a2b", 1.6, () => { c.moveTo(-10, -11); c.lineTo(6, 8); c.moveTo(10, -11); c.lineTo(-6, 8); });
      ell(c, 0, 2, 9, 9, "#efe6f6");
      trace(c, "#b8a6d6", 1.2, () => { c.ellipse(0, 2, 6.5, 8.5, 0.6, 0, TOUR); c.moveTo(-8, -1); c.quadraticCurveTo(0, 4, 8, -1); c.moveTo(-6, 7); c.quadraticCurveTo(0, 2, 7, 8); });
      trace(c, "#b8a6d6", 1.2, () => { c.moveTo(8, 6); c.quadraticCurveTo(12, 10, 9, 12); });
    },
    tissu: (c) => { // une pile de 3 tissus pliés, de 3 couleurs
      for (const [y, col, rayure] of [[6, "#3f8a8a", "#7fc4c4"], [0, "#d9553b", "#f6a08a"], [-6, "#7a5ab0", "#c4b0e6"]]) {
        forme(c, [[-11, y], [11, y], [11, y + 5], [-11, y + 5]], col);
        trace(c, rayure, 1.1, () => { for (let x = -8; x < 11; x += 5) { c.moveTo(x, y + 0.8); c.lineTo(x, y + 4.2); } });
      }
    },
    vetements: (c) => { // une chemise avec son col et ses boutons
      forme(c, [[-5, -10], [5, -10], [12, -5], [9, 0], [6, -2], [6, 11], [-6, 11], [-6, -2], [-9, 0], [-12, -5]], "#3f8a8a");
      forme(c, [[-5, -10], [0, -5], [5, -10], [3, -10], [0, -7.5], [-3, -10]], "#f4efe4");
      trace(c, "rgba(20, 50, 50, .6)", 1, () => { c.moveTo(0, -5); c.lineTo(0, 11); });
      for (const y of [-2, 2.5, 7]) ell(c, 1.6, y, 0.9, 0.9, "#ffcf2e", true);
    },
    jambon: (c) => { // un jambon fumé, ficelé, avec son os
      trace(c, "#3b2614", 5, () => { c.moveTo(6, -6); c.lineTo(11, -11); }); trace(c, "#f4ecd8", 3.2, () => { c.moveTo(6, -6); c.lineTo(11, -11); });
      c.beginPath(); c.moveTo(7, -6); c.bezierCurveTo(14, 4, 2, 13, -6, 11); c.bezierCurveTo(-13, 9, -12, -1, -4, -5); c.closePath(); c.fillStyle = "#a8432c"; c.fill(); contour(c, 1.4);
      c.beginPath(); c.ellipse(-3, 4, 5, 4, -0.5, 0, TOUR); c.fillStyle = "#e88a7a"; c.fill();
      trace(c, "#f4ecd8", 1, () => { c.moveTo(-9, 0); c.lineTo(5, 7); c.moveTo(-6, -3); c.lineTo(8, 3); });
    },
  };
  function icone(ctx, r, x, y, taille) {
    if (ICONES[r]) { // étape 28 : la grande icône
      const e = (taille || 16) / 24, avant = trait;
      ctx.save(); ctx.translate(x, y); ctx.scale(e, e); ctx.lineJoin = "round"; trait = 0.55 / e;
      try { ICONES[r](ctx); } finally { trait = avant; ctx.restore(); }
      return;
    }
    const e = (taille || 16) / 13, avant = trait;
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e); ctx.lineJoin = "round"; trait = 0.6 / e;
    if (r === "troncs") { ctx.scale(0.62, 0.62); rondin(ctx, 0, 1, 0.42); }
    else if (r === "planches") { planche(ctx, -0.4, 3, 11); planche(ctx, 0.5, 0.4, 11); planche(ctx, -0.3, -2.2, 11); }
    else if (r === "pierres") { caillou(ctx, -2.3, 1.2, 0); caillou(ctx, 2.2, 1.4, 1); caillou(ctx, 0, -1.8, 2); }
    else if (r === "poissons") poisson(ctx, -1.6, 0);
    else if (r === "viande") viande(ctx, -0.5, 0.5);
    else if (r === "lingots") { lingot(ctx, 0, 2); lingot(ctx, 0.8, -0.8); }
    else if (r === "outils") outil(ctx, 0, 1.5);
    else objetPorte(ctx, r, 0, 0); // charbon, fer, blé, farine, pain, or, bijoux
    trait = avant;
    ctx.restore();
  }

  // Les choses lourdes vont dans la brouette (étape 9, avec la recherche « Brouettes »)
  const LOURD = { pierres: true, charbon: true, fer: true, lingots: true, farine: true, or: true, eau: true, lait: true };
  // Comment on porte chaque chose sans brouette ni charrette : sur l'épaule, dans une hotte sur le dos, ou dans les bras
  const FACON = { troncs: "epaule", planches: "epaule", outils: "epaule", poissons: "hotte", viande: "hotte", pierres: "hotte", charbon: "sac", fer: "sac", lingots: "bras", ble: "epaule", farine: "sac", pain: "hotte", or: "sac", bijoux: "bras", eau: "bras", foin: "epaule", lait: "bras", beurre: "hotte", fromage: "hotte", yaourt: "hotte", oeufs: "hotte", laine: "sac", tissu: "epaule", vetements: "bras", jambon: "hotte" }; // étape 15 et 16

  // Un petit bonhomme en tunique bleue : le porteur.
  // Étape 9 : ✍️ il porte mieux ! Les longues choses sur l'épaule, le reste dans une hotte ou un sac sur
  // le dos ; avec la recherche « Brouettes », il pousse une brouette pour ce qui est lourd ; avec
  // « Ânes et charrettes », il mène un âne qui tire une charrette (jusqu'à 3 objets). La nuit : une lanterne.
  // Étape 22 : ✍️ « les charrettes débordent des routes ». Avant, l'âne et la charrette suivaient le porteur à
  // l'HORIZONTALE, alors que les routes vont en diagonale ! Maintenant, ils sont derrière lui, dans le sens de son
  // chemin (le vecteur qui va de lui à la prochaine case), et un peu plus petits pour tenir sur la route.
  function attelage(ctx, p, x, y, t, dir) {
    let ux = dir * 0.89, uy = 0.45; // (à l'arrêt : derrière lui, un peu en haut)
    if (p.chemin && p.pas < p.chemin.length) {
      const q = p.chemin[p.pas], vx = q.x - p.x, vy = q.y - p.y, sx = (vx - vy) * 32, sy = (vx + vy) * 16, n = Math.hypot(sx, sy);
      if (n > 0.01) { ux = sx / n; uy = sy / n; }
    }
    const marche = p.etat !== "attend", d = Math.sign(ux) || dir;
    const morceau = (dist, f) => { ctx.save(); ctx.translate(x - ux * dist, y - uy * dist); ctx.scale(d * 0.72, 0.72); f(); ctx.restore(); };
    ctx.fillStyle = "rgba(20, 40, 10, .2)"; ctx.beginPath(); ctx.ellipse(x - ux * 22, y - uy * 22 + 1, 14, 3, Math.atan2(uy, ux), 0, TOUR); ctx.fill();
    morceau(30, () => charrette(ctx, 0, 0, t, p.porte, p.porte ? Math.min(3, p.nombre || 1) : 0, marche));
    morceau(15, () => ane(ctx, 0, 0, t, marche));
    ctx.strokeStyle = "#6b4423"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - ux * 15 + d * 8, y - uy * 15 - 12); ctx.lineTo(x + d * 4, y - 12); ctx.stroke(); // la longe
  }
  function dessinerPorteur(ctx, p, x, y, t) {
    const monde = Village.monde, R = Village.Recherches;
    const avecAne = monde && R.bonus(monde, "chargement") > 1;
    // Étape 22 : l'attelage qui est DERRIÈRE le porteur à l'écran (quand il descend vers nous) est dessiné avant lui ; sinon, après
    let attelageDerriere = true;
    if (avecAne && p.chemin && p.pas < p.chemin.length) { const q = p.chemin[p.pas]; attelageDerriere = q.x - p.x + q.y - p.y > 0; }
    if (avecAne && attelageDerriere) attelage(ctx, p, x, y, t, p.direction);
    const avecBrouette = !avecAne && monde && R.a(monde, "brouette") && p.porte && LOURD[p.porte];
    const pas = Math.sin(t * 15 + p.numero), saut = Math.abs(pas) * 1.5;
    const dir = p.direction;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    // (Étape 22 : l'âne et la charrette sont dessinés plus bas, le long du chemin : voir « attelage »)
    ctx.fillStyle = "rgba(20, 40, 10, .25)";
    ctx.beginPath(); ctx.ellipse(0, 1, 6, 2.5, 0, 0, TOUR); ctx.fill();
    if (avecBrouette) brouette(ctx, 14, 0, t, p.porte, true);
    ctx.translate(0, -saut);
    const facon = avecAne || avecBrouette || !p.porte ? null : FACON[p.porte] || "hotte";
    // La hotte (ou le sac) se voit derrière le dos
    if (facon === "hotte") {
      forme(ctx, [[-8, -20], [-2, -20], [-3, -9], [-7, -9]], "#b98a55");
      ctx.strokeStyle = "rgba(60,35,10,.5)"; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = 1; k < 4; k++) { ctx.moveTo(-7.7 + k * 0.1, -20 + k * 2.8); ctx.lineTo(-2.3 - k * 0.2, -20 + k * 2.8); } ctx.stroke();
      objetPorte(ctx, p.porte, -6, -23); objetPorte(ctx, p.porte, -4.5, -21.5);
    } else if (facon === "sac") {
      ctx.beginPath(); ctx.ellipse(-5, -15, 4.2, 5.5, -0.2, 0, TOUR); ctx.fillStyle = "#c9b58a"; ctx.fill(); contour(ctx, 1.2);
      ctx.strokeStyle = "#7a5a30"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6.5, -20); ctx.lineTo(-3, -20.5); ctx.stroke();
    }
    // Étape 10 : le porteur est un bonhomme comme les autres (avec sa tête à lui), en tunique bleue.
    let brasAvant = 0.15 + pas * 0.55, brasArriere = 0.15 - pas * 0.55;
    if (facon === "epaule") brasAvant = 2.7;
    else if (facon === "bras") { brasAvant = 1.35; brasArriere = 1.25; }
    else if (avecBrouette) { brasAvant = 1.05; brasArriere = 0.95; }
    else if (facon === "hotte" || facon === "sac") brasArriere = -2.6; // une main tient la sangle
    else if (avecAne) brasAvant = 1.5; // il tient la longe
    bonhomme(ctx, { tenue: TENUES.porteur, traits: traits(p.numero * 7 + 3), pas, brasAvant, brasArriere, triste: p.affame, hiver: vue.hiver });
    if (facon === "epaule") { // une longue chose posée en travers de l'épaule
      if (p.porte === "planches") { ctx.save(); ctx.translate(2, -23); ctx.rotate(-0.35); planche(ctx, 0, 0, 24); planche(ctx, 1, -2, 24); ctx.restore(); }
      else if (p.porte === "troncs") { ctx.save(); ctx.translate(1, -23); ctx.rotate(-0.3); rondin(ctx, 0, 0, 0); ctx.restore(); }
      else { ctx.save(); ctx.translate(3, -22); ctx.rotate(-0.6); outil(ctx, 0, 0); ctx.restore(); }
    } else if (facon === "bras") { lingot(ctx, 5, -12); lingot(ctx, 5, -14); }
    // La nuit : une lanterne au bout du bras
    if (vue.noirceur > 0.25 && !avecBrouette) {
      const ma = main(facon === "epaule" || facon === "hotte" || facon === "sac" ? (facon === "epaule" ? brasArriere : brasAvant) : brasAvant), lx = ma[0], ly = ma[1] + 1;
      forme(ctx, [[lx - 1.8, ly], [lx + 1.8, ly], [lx + 1.5, ly + 4.5], [lx - 1.5, ly + 4.5]], "#ffd04a");
      lumiere(x + lx * dir, y - saut + ly + 2, 26, "orange", 0.9);
    }
    ctx.restore();
    if (avecAne && !attelageDerriere) attelage(ctx, p, x, y, t, p.direction);
  }

  // ---------------------------------------------------------------- une jeune pousse
  // p : de 0 (on vient de la planter) à 1 (elle va devenir un arbre)
  function dessinerPousse(ctx, x, y, p, t) {
    const e = 0.35 + p * 0.65;
    const vent = Math.sin(t * 2.5 + x * 0.1) * 0.08;
    ctx.save(); ctx.translate(x, y + 2); ctx.rotate(vent); ctx.scale(e, e);
    ctx.fillStyle = "rgba(20, 40, 10, .2)"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#7a5a2b"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2, 0, 0, TOUR); ctx.fill(); // la terre retournée
    ctx.strokeStyle = "#4b7a28"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14); ctx.stroke();
    ctx.lineWidth = 1.2;
    for (const [dx, dy, s] of [[-6, -8, -1], [6, -11, 1], [0, -16, 0]]) {
      ctx.beginPath(); ctx.ellipse(dx * 0.7, dy, 4.5, 2.6, s * 0.5, 0, TOUR);
      ctx.fillStyle = "#6cc94a"; ctx.fill(); ctx.strokeStyle = "#24521c"; ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- le fantôme
  // Pendant qu'on choisit où construire : le bâtiment transparent, sur un losange vert (oui) ou rouge (non).
  function dessinerFantome(ctx, type, x, y, possible, t, L, Hc) {
    ctx.beginPath();
    ctx.moveTo(x, y - Hc / 2); ctx.lineTo(x + L / 2, y); ctx.lineTo(x, y + Hc / 2); ctx.lineTo(x - L / 2, y); ctx.closePath();
    ctx.fillStyle = possible ? "rgba(80, 230, 100, .45)" : "rgba(255, 70, 60, .45)";
    ctx.fill();
    ctx.strokeStyle = possible ? "#c6ffd0" : "#ffd0cc"; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 0.55 + 0.15 * Math.sin(t * 5);
    const n = Bt().tailleVoulue(type), xb = x + decalageTaille(n); // étape 24 : au milieu de son bloc (étape 28 : selon sa taille)
    aLaLoupe(ctx, xb, y, echelleTaille(type, n), () => structure(ctx, type, xb, y, MODELES[type], t, null)); // étape 25 : sa vraie forme // étape 14 : à la même taille que le vrai
    ctx.globalAlpha = 1;
  }

  return { icone, dessinerVillageois, bonhomme, traits, dessinerBatiment, dessinerOuvrier, dessinerPorteur, dessinerAnimal, dessinerPousse, dessinerFantome, iconeRoute, debutImage, lumiere, get lumieres() { return lumieres; }, vue }; // étape 9 : la vue et les lumières
})();
