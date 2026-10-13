// 🔧 LES VOITURES REFAITES : l'atelier de restauration (étape 70)
//
// ✍️ « Améliore toutes les voitures pour qu'elles soient plus réalistes. » Les 16 nouvelles voitures avaient été
// redessinées à l'étape 69 (affichage/voitures-nouvelles.js). Ici, on refait TOUTES LES AUTRES, avec les mêmes outils :
// la Peugeot 208, la Clio, le taxi, la police, la 508, le Vito, la NSX, la 911, l'Aventador, la Chiron, la Ninja, le
// kart, la Formule 1, le 4x4, le pickup, le buggy, le quad, le monster truck, la voiture de rallye et le camion.
//
// Comme un atelier de restauration : on garde la voiture (son nom, sa place au garage, sa façon de rouler), mais on
// refait sa carrosserie (avec ses vraies mesures), ses phares, ses roues et son intérieur.
// La plupart sont dessinées avec la SILHOUETTE (5 lignes, comme sur le dessin d'un designer : le profil, la ceinture,
// la largeur, le toit et le bas). Les véhicules sans carrosserie fermée (kart, F1, buggy, quad, moto) sont montés
// pièce par pièce : des tubes, des boîtes et des formes extrudées.
//
// Comme toutes les autres : « nez vers x+ », posées sur y = 0, centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.VoituresRefaites = (function () {
  const O = Circuit.Modeles.outils, B = Circuit.VoituresMarques.outils, N = Circuit.VoituresNouvelles.outils;
  const { M, peinture, boite, cylindre, tube } = O;
  const { surLeDessus, surLeFlanc, plat, auBout, portiere, echappement, optiqueAuBout, grille, lettres, phareRond, plaque, voiture, lettresFlanc } = B;
  const { peau, silhouette, vitresUnies, habitacle, emblemeAuBout, emblemeDessus, pieceDessus, pieceFlanc, pharePose, bande, traitFlanc, essuieGlaces, poignees, retro, diffuseur, basDeCaisse, roues4, roueSecours, elargisseur, trou, carbone, nidAbeille, fonce, LOGOS } = N;
  const etiquette = O.etiquette;

  // ---------------------------------------------------------------- de nouveaux emblèmes
  Object.assign(LOGOS, {
    peugeot(ctx) {
      ctx.fillStyle = "#1b1d22"; ctx.beginPath(); ctx.moveTo(110, 60); ctx.lineTo(402, 60); ctx.lineTo(402, 330); ctx.quadraticCurveTo(402, 440, 256, 480); ctx.quadraticCurveTo(110, 440, 110, 330); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#dfe3e8"; ctx.lineWidth = 14; ctx.stroke();
      ctx.fillStyle = "#dfe3e8"; ctx.font = "bold 230px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("P", 256, 280);
    },
    toyota(ctx) {
      ctx.strokeStyle = "#e9ecef"; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.ellipse(256, 256, 230, 150, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(256, 200, 150, 70, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(256, 300, 60, 130, 0, 0, Math.PI * 2); ctx.stroke();
    },
    honda(ctx) {
      ctx.strokeStyle = "#e9ecef"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(90, 80); ctx.lineTo(422, 80); ctx.lineTo(392, 430); ctx.lineTo(120, 430); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = "#e9ecef"; ctx.font = "bold 290px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("H", 256, 262);
    },
    lamborghini(ctx) {
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(110, 50); ctx.lineTo(402, 50); ctx.lineTo(402, 300); ctx.quadraticCurveTo(402, 430, 256, 480); ctx.quadraticCurveTo(110, 430, 110, 300); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#d4a52a"; ctx.lineWidth = 16; ctx.stroke();
      ctx.fillStyle = "#d4a52a"; ctx.font = "bold 200px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♉", 256, 280);
    },
    kawasaki(ctx) { ctx.fillStyle = "#e9ecef"; ctx.font = "bold italic 110px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Kawasaki", 256, 262, 480); },
    suzuki(ctx) {
      ctx.fillStyle = "#d8232a"; ctx.font = "bold 360px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("S", 256, 270);
    },
    hyundai(ctx) {
      ctx.strokeStyle = "#e9ecef"; ctx.lineWidth = 24; ctx.beginPath(); ctx.ellipse(256, 256, 230, 140, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.translate(256, 256); ctx.transform(1, 0, -0.35, 1, 0, 0); ctx.fillStyle = "#e9ecef"; ctx.font = "bold 220px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("H", 0, 10); ctx.restore();
    },
    renaultTrucks(ctx) { LOGOS.renault(ctx); },
    police(ctx) {
      ctx.fillStyle = "#1d3f9a"; ctx.beginPath(); ctx.arc(256, 256, 230, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 92px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("POLICE", 256, 262);
    },
  });

  // ---------------------------------------------------------------- les outils de l'atelier
  // Le début de chaque voiture : le groupe, la caisse (sur les ressorts) et ses roues [{ x, r, l, j }].
  const debut = () => {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    return { g, caisse };
  };
  // Un troisième feu stop, en haut de la lunette (ou du hayon).
  function troisiemeFeu(caisse, c, x, largeur) {
    caisse.add(surLeDessus(plat(0.04, largeur || 0.3, M.feuLed, 0.012), c, x, 0, 0.01));
  }
  // Les répétiteurs de clignotants sur les ailes avant (de petits feux orange).
  function repetiteurs(caisse, c, R, x, y) {
    pieceFlanc(caisse, c, R, [[x - 0.05, y - 0.012], [x + 0.05, y - 0.012], [x + 0.05, y + 0.012], [x - 0.05, y + 0.012]], M.orange, 0.012);
  }
  // L'antenne « aileron de requin » sur le toit.
  function antenne(caisse, c, x) {
    const forme = new THREE.Shape();
    forme.moveTo(0, 0); forme.lineTo(0.16, 0); forme.quadraticCurveTo(0.04, 0.02, 0.02, 0.06); forme.closePath();
    const geo = new THREE.ExtrudeGeometry(forme, { depth: 0.035, bevelEnabled: false });
    geo.translate(-0.08, 0, -0.0175);
    const m = new THREE.Mesh(geo, M.noir);
    m.position.set(x, c.dessus(x, 0) - 0.005, 0);
    caisse.add(m);
  }
  // La trappe à carburant (un petit rond sur l'aile arrière, côté droit).
  function trappe(caisse, c, R, x, y) {
    const pts = [];
    for (let k = 0; k < 4; k++) pts.push(null);
    caisse.add(Object.assign(new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), M.noir), { position: new THREE.Vector3(x, y, c.tranche(x).w + 0.012) }));
  }

  // ================================================================ LES CITADINES ET LES BERLINES

  // 🇫🇷 Peugeot 208 (4,06 m × 1,75 m × 1,43 m, empattement 2,54 m). Les 3 « crocs » de lumière qui descendent des
  // phares, le toit noir, la calandre large, les feux arrière à 3 griffes reliés par une bande noire.
  function classique(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.28, r: 0.31, l: 0.205, j: 0.216 }, { x: -1.26, r: 0.31, l: 0.205, j: 0.216 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.03, 0.98], [-1.96, 1.08], [-1.78, 1.3], [-1.5, 1.4], [-0.6, 1.43], [0.15, 1.41], [0.55, 1.2], [0.93, 0.92], [1.28, 0.86], [1.75, 0.8], [1.95, 0.74], [2.03, 0.67]],
      ceinture: [[-2.03, 0.96], [-1.9, 0.99], [-1.0, 0.97], [0.93, 0.92], [1.28, 0.88], [1.75, 0.8], [1.95, 0.74], [2.03, 0.66]],
      largeur: [[-2.03, 0.74], [-1.88, 0.85], [-1.26, 0.875], [1.28, 0.875], [1.8, 0.85], [2.03, 0.76]],
      toit: [[-2.03, 0.55], [-1.6, 0.6], [-0.6, 0.62], [0.4, 0.64], [0.93, 0.7], [2.03, 0.55]],
      bas: [[-2.03, 0.34], [-1.9, 0.24], [-1.4, 0.2], [1.5, 0.2], [1.95, 0.24], [2.03, 0.3]],
    }), R, 0.76, peinture(k1), vitresUnies({ pareBrise: [0.17, 0.92], cotes: [-1.55, 0.9], montants: [-0.38], lunette: [-1.9, -1.5], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.9, xS: 0.0, sol: 0.28, hS: 0.5, w: 0.66, tdb: 0.98, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.14, 0.14, 0.15], surpiqure: [0.1, 0.6, 0.3], volant: "plat" });
    pieceDessus(caisse, c, [[-1.55, 0], [0.12, 0], [0.12, 0.62], [-1.55, 0.62]], peinture(k2), 0.005); // le toit noir
    // les phares en amande, et les 3 crocs de lumière
    pharePose(caisse, c, [[1.62, 0.84], [1.98, 0.68], [1.97, 0.5], [1.7, 0.66]], [bande(1.66, 0.8, 1.96, 0.66, 0.02), bande(1.78, 0.7, 1.84, 0.68, 0.05)]);
    for (const cote of [-1, 1]) for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, true, 0.46 - i * 0.02, cote * (0.56 - i * 0.04), 0.2, 0.014, [[0, 0, 0.18, 0.01]]);
    auBout(caisse, c, true, 0.42, 0, 0.18, 0.9, trou(), 0.012);
    grille(caisse, c, true, 0.42, 0, 0.16, 0.86);
    emblemeAuBout(caisse, c, "peugeot", true, 0.54, 0.11, 0.13);
    auBout(caisse, c, true, 0.27, 0, 0.06, 1.2, M.plastique, 0.02);
    // l'arrière : la bande noire, les 3 griffes, PEUGEOT, la plaque
    auBout(caisse, c, false, 0.86, 0, 0.12, 1.36, M.noir, 0.012);
    for (const cote of [-1, 1]) for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.9 - i * 0.04, cote * 0.55, 0.02, 0.24, [[0, 0, 0.01, 0.22]], "feu");
    lettres(caisse, c, false, 0.86, 0, "PEUGEOT", 0.42, 0.05);
    troisiemeFeu(caisse, c, -1.52, 0.3);
    plaque(caisse, c, false, 0.55, "GT-208-RG");
    plaque(caisse, c, true, 0.36, "GT-208-RG");
    auBout(caisse, c, false, 0.34, 0, 0.12, 1.3, M.plastique, 0.03);
    echappement(caisse, c.xMin - 0.04, 0.3, 0.45, 0.035);
    // les détails
    essuieGlaces(caisse, c, 0.92, 0.5);
    for (const x of [0.32, -0.6]) poignees(caisse, c, x, 0.88, 0.16, M.noir);
    retro(caisse, 0.78, 0.98, 0.79, peinture(k2), 1);
    repetiteurs(caisse, c, R, 1.0, 0.76);
    antenne(caisse, c, -1.35);
    basDeCaisse(caisse, c, 0.95, -0.95, 0.24);
    portiere(caisse, c, 0.9, -0.38, 0.27, 0.9, false);
    portiere(caisse, c, -0.4, -1.05, 0.27, 0.92, false);
    const roues = roues4(g, R, 0.76, "doubles", {});
    return voiture(g, caisse, roues, 1.32);
  }

  // 🇫🇷 Renault Clio V (4,05 m × 1,80 m × 1,44 m, empattement 2,58 m). Les phares en « C » de lumière, la calandre
  // au grand losange, les poignées des portes arrière cachées près de la vitre, les feux en « C ».
  function citadine(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.3, r: 0.31, l: 0.205, j: 0.216 }, { x: -1.28, r: 0.31, l: 0.205, j: 0.216 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.02, 0.96], [-1.95, 1.08], [-1.75, 1.3], [-1.45, 1.41], [-0.6, 1.44], [0.15, 1.42], [0.55, 1.2], [0.95, 0.93], [1.3, 0.87], [1.78, 0.8], [1.95, 0.75], [2.02, 0.68]],
      ceinture: [[-2.02, 0.95], [-1.9, 0.98], [-1.0, 0.97], [0.95, 0.93], [1.3, 0.89], [1.78, 0.81], [1.95, 0.75], [2.02, 0.67]],
      largeur: [[-2.02, 0.76], [-1.88, 0.88], [-1.28, 0.9], [1.3, 0.9], [1.8, 0.87], [2.02, 0.78]],
      toit: [[-2.02, 0.55], [-1.6, 0.6], [-0.6, 0.63], [0.4, 0.65], [0.95, 0.7], [2.02, 0.55]],
      bas: [[-2.02, 0.34], [-1.9, 0.24], [-1.4, 0.2], [1.5, 0.2], [1.95, 0.24], [2.02, 0.3]],
    }), R, 0.78, peinture(k1), vitresUnies({ pareBrise: [0.17, 0.94], cotes: [-1.5, 0.92], montants: [-0.38], lunette: [-1.9, -1.45], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.92, xS: 0.0, sol: 0.28, hS: 0.5, w: 0.68, tdb: 0.98, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.2, 0.2, 0.22], surpiqure: [0.9, 0.5, 0.1], volant: "rond" });
    // les phares, et le « C » de lumière qui descend dans le bouclier
    pharePose(caisse, c, [[1.62, 0.86], [1.98, 0.7], [1.97, 0.52], [1.7, 0.66]], [bande(1.66, 0.82, 1.96, 0.68, 0.02), bande(1.78, 0.72, 1.86, 0.7, 0.06), bande(1.88, 0.66, 1.94, 0.62, 0.05)]);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, true, 0.4, cote * 0.6, 0.22, 0.06, [[0, -cote * 0.01, 0.2, 0.012], [0.09, 0.012, 0.012, 0.04], [-0.09, 0.012, 0.012, 0.04]]);
    auBout(caisse, c, true, 0.5, 0, 0.14, 0.7, trou(), 0.012);
    grille(caisse, c, true, 0.5, 0, 0.12, 0.66, M.chrome);
    emblemeAuBout(caisse, c, "renault", true, 0.52, 0.15, 0.15, 0, 0.02);
    auBout(caisse, c, true, 0.3, 0, 0.1, 0.9, trou(), 0.012);
    // l'arrière : les feux en « C », le losange, CLIO
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.88, cote * 0.58, 0.14, 0.24, [[0.05, 0, 0.012, 0.22], [-0.05, 0, 0.012, 0.22], [0, cote * 0.1, 0.1, 0.012]], "feu");
    emblemeAuBout(caisse, c, "renault", false, 0.9, 0.13);
    lettres(caisse, c, false, 0.74, 0, "CLIO", 0.25, 0.05);
    troisiemeFeu(caisse, c, -1.48, 0.3);
    plaque(caisse, c, false, 0.55, "CL-150-IO");
    plaque(caisse, c, true, 0.36, "CL-150-IO");
    auBout(caisse, c, false, 0.34, 0, 0.12, 1.3, M.plastique, 0.03);
    essuieGlaces(caisse, c, 0.93, 0.5);
    poignees(caisse, c, 0.32, 0.9, 0.16, M.chrome);
    surLeFlanc(caisse, c, -0.95, 1.02, 1, 0.05, 0.06, M.noir, 0.01); // (la poignée arrière, cachée près de la vitre)
    surLeFlanc(caisse, c, -0.95, 1.02, -1, 0.05, 0.06, M.noir, 0.01);
    retro(caisse, 0.8, 0.98, 0.82, peinture(k2), 1);
    repetiteurs(caisse, c, R, 1.0, 0.78);
    antenne(caisse, c, -1.3);
    basDeCaisse(caisse, c, 0.95, -0.95, 0.24);
    portiere(caisse, c, 0.92, -0.38, 0.27, 0.92, false);
    portiere(caisse, c, -0.4, -1.05, 0.27, 0.94, false);
    const roues = roues4(g, R, 0.78, "y", {});
    return voiture(g, caisse, roues, 1.32);
  }

  // Une berline à coffre (la Corolla du taxi, la 508) ou à hayon (la 308) : la même silhouette, réglée par quelques nombres.
  // o = { L, W, H, xAv, xAr, r, j, hCapot, hCein, xPB (le bas du pare-brise), xTa / xTr (le toit avant / arrière),
  //       xLu (le bas de la lunette), hCoffre, coffre (true : un coffre ; false : un hayon) }
  function berline(o, k1, k2, vitres) {
    const { g, caisse } = debut();
    const L2 = o.L / 2, W2 = o.W / 2;
    const R = [{ x: o.xAv, r: o.r, l: 0.215, j: o.j }, { x: o.xAr, r: o.r, l: 0.215, j: o.j }];
    const profil = [[-L2, o.hCoffre - 0.05], [-L2 + 0.08, o.hCoffre], [o.xLu, o.hCoffre + 0.03], [o.xTr, o.H - 0.03], [(o.xTr + o.xTa) / 2, o.H], [o.xTa, o.H - 0.02], [o.xPB, o.hCapot + 0.04], [o.xAv, o.hCapot - 0.04], [L2 - 0.3, o.hCapot - 0.1], [L2 - 0.08, o.hCapot - 0.16], [L2, o.hCapot - 0.22]];
    const c = peau(caisse, silhouette({
      profil,
      ceinture: [[-L2, o.hCoffre - 0.06], [-L2 + 0.1, o.hCoffre - 0.01], [o.xAr, o.hCein + 0.02], [o.xPB, o.hCein - 0.02], [o.xAv, o.hCapot - 0.02], [L2 - 0.3, o.hCapot - 0.1], [L2 - 0.08, o.hCapot - 0.16], [L2, o.hCapot - 0.23]],
      largeur: [[-L2, W2 - 0.14], [-L2 + 0.15, W2 - 0.03], [o.xAr, W2], [o.xAv, W2], [L2 - 0.3, W2 - 0.03], [L2, W2 - 0.12]],
      toit: [[-L2, W2 - 0.3], [o.xTr, W2 - 0.28], [o.xTa, W2 - 0.25], [o.xPB, W2 - 0.18], [L2, W2 - 0.32]],
      bas: [[-L2, 0.34], [-L2 + 0.15, 0.24], [o.xAr + 0.4, 0.2], [o.xAv - 0.3, 0.2], [L2 - 0.12, 0.24], [L2, 0.3]],
    }), R, W2 - 0.12, peinture(k1), vitresUnies(Object.assign({ pareBrise: [o.xTa + 0.03, o.xPB - 0.02], cotes: [o.xTr - (o.coffre ? 0.25 : 0.05), o.xPB - 0.04], montants: [(o.xAv + o.xAr) / 2 - 0.25], lunette: [o.xLu + 0.03, o.xTr - 0.03], pilier: 0.08 }, vitres || {})));
    habitacle(caisse, { xPB: o.xPB - 0.03, xS: (o.xAv + o.xAr) / 2 + 0.1, sol: 0.28, hS: 0.5, w: W2 - 0.2, tdb: o.hCein + 0.05, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: o.cuir || [0.15, 0.15, 0.16], surpiqure: [0.4, 0.4, 0.4], volant: "rond" });
    const milieu = (o.xAv + o.xAr) / 2 - 0.25;
    essuieGlaces(caisse, c, o.xPB - 0.01, 0.55);
    for (const x of [milieu + 0.62, milieu - 0.45]) poignees(caisse, c, x, o.hCein - 0.06, 0.17, M.chrome);
    retro(caisse, o.xPB - 0.12, o.hCein + 0.06, W2 - 0.08, peinture(k1), 1);
    repetiteurs(caisse, c, R, o.xAv - 0.35, o.hCapot - 0.12);
    antenne(caisse, c, o.xTr + 0.2);
    basDeCaisse(caisse, c, o.xAv - 0.38, o.xAr + 0.38, 0.24);
    portiere(caisse, c, o.xPB - 0.04, milieu, 0.27, o.hCein - 0.03, false);
    portiere(caisse, c, milieu - 0.02, o.xAr + 0.35, 0.27, o.hCein - 0.02, false);
    plaque(caisse, c, false, o.hCoffre - 0.4, o.plaque);
    plaque(caisse, c, true, 0.36, o.plaque);
    auBout(caisse, c, false, 0.36, 0, 0.12, o.W - 0.4, M.plastique, 0.03);
    troisiemeFeu(caisse, c, o.coffre ? o.xLu + 0.08 : o.xTr - 0.02, 0.3);
    return { g, caisse, c, R, L2, W2 };
  }

  // 🇯🇵 Le taxi : une Toyota Corolla (4,63 m × 1,78 m × 1,44 m, empattement 2,70 m), avec le lumineux TAXI PARISIEN.
  function taxi(k1, k2) {
    const b = berline({ L: 4.63, W: 1.78, H: 1.44, xAv: 1.42, xAr: -1.28, r: 0.32, j: 0.216, hCapot: 0.88, hCein: 0.96, xPB: 0.98, xTa: 0.25, xTr: -0.95, xLu: -1.7, hCoffre: 1.0, coffre: true, plaque: "TX-750-PA" }, k1, k2);
    const { caisse, c } = b;
    pharePose(caisse, c, [[1.9, 0.84], [2.3, 0.62], [2.29, 0.46], [1.98, 0.64]], [bande(1.94, 0.8, 2.28, 0.6, 0.02), bande(2.06, 0.68, 2.14, 0.64, 0.06)]);
    auBout(caisse, c, true, 0.4, 0, 0.22, 1.1, trou(), 0.012);
    grille(caisse, c, true, 0.4, 0, 0.2, 1.04);
    emblemeAuBout(caisse, c, "toyota", true, 0.58, 0.16, 0.1);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.88, cote * 0.58, 0.1, 0.34, [[0.03, 0, 0.012, 0.32], [-0.02, 0, 0.04, 0.2]], "feu");
    emblemeAuBout(caisse, c, "toyota", false, 0.88, 0.13, 0.08);
    lettres(caisse, c, false, 0.76, -0.45, "COROLLA", 0.3, 0.045);
    // le lumineux TAXI PARISIEN, sur ses deux pieds
    const enseigne = new THREE.Group();
    enseigne.add(boite(0.24, 0.12, 0.6, M.phare, 0, 0, 0));
    for (const z of [-1, 1]) {
      const mot = etiquette("TAXI PARISIEN", "#f7f3e2", "#1b1b1b", 0.58, 0.11);
      mot.position.x = z * 0.125;
      mot.rotation.y = z > 0 ? Math.PI / 2 : -Math.PI / 2;
      enseigne.add(mot);
      enseigne.add(boite(0.03, 0.04, 0.03, M.noir, 0, -0.08, z * 0.22));
    }
    enseigne.position.set(-0.3, c.dessus(-0.3, 0) + 0.12, 0);
    enseigne.rotation.y = Math.PI / 2;
    caisse.add(enseigne);
    const roues = roues4(b.g, b.R, b.W2 - 0.12, "acier", {});
    return voiture(b.g, caisse, roues, 1.32);
  }

  // 🇫🇷 La voiture de police : une Peugeot 308 (4,37 m × 1,85 m × 1,46 m, empattement 2,68 m), avec les bandes bleues
  // et rouges de la Police nationale, POLICE sur les flancs et la rampe de gyrophares sur le toit.
  function police(k1, k2) {
    const b = berline({ L: 4.37, W: 1.85, H: 1.46, xAv: 1.36, xAr: -1.31, r: 0.32, j: 0.229, hCapot: 0.88, hCein: 0.97, xPB: 0.95, xTa: 0.2, xTr: -1.25, xLu: -2.1, hCoffre: 1.0, coffre: false, plaque: "PN-308-75" }, [0.95, 0.95, 0.95], k2, { lunette: [-2.1, -1.3] });
    const { caisse, c, R } = b;
    const bleu = peinture([0.05, 0.15, 0.45]), rouge = peinture([0.75, 0.05, 0.05]);
    pharePose(caisse, c, [[1.75, 0.86], [2.15, 0.64], [2.14, 0.46], [1.84, 0.64]], [bande(1.78, 0.82, 2.13, 0.62, 0.02), bande(1.9, 0.72, 1.98, 0.68, 0.05)]);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, true, 0.36, cote * 0.62, 0.18, 0.02, [[0, 0, 0.16, 0.012]]); // les crocs
    auBout(caisse, c, true, 0.4, 0, 0.18, 0.9, trou(), 0.012);
    grille(caisse, c, true, 0.4, 0, 0.16, 0.86, M.chrome);
    emblemeAuBout(caisse, c, "peugeot", true, 0.54, 0.11, 0.13);
    for (const cote of [-1, 1]) for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.92 - i * 0.04, cote * 0.6, 0.02, 0.24, [[0, 0, 0.01, 0.22]], "feu");
    lettres(caisse, c, false, 0.78, 0, "POLICE", 0.4, 0.06, "#1d3f9a");
    // les bandes, POLICE écrit sur les flancs, le blason sur le capot
    pieceFlanc(caisse, c, R, [[-0.92, 0.36], [1.0, 0.36], [1.0, 0.56], [-0.92, 0.56]], bleu, 0.005);
    pieceFlanc(caisse, c, R, [[-0.92, 0.57], [1.0, 0.57], [1.0, 0.6], [-0.92, 0.6]], rouge, 0.005);
    for (const cote of [-1, 1]) lettresFlanc(caisse, c, 0.0, 0.46, cote, "POLICE", 0.9, 0.17, "#ffffff");
    emblemeDessus(caisse, c, "police", 1.6, 0.3);
    // la rampe de gyrophares : un socle noir, une lampe bleue et une rouge (affichage/scene3d.js les fait clignoter)
    const gyro = {
      rouge: new THREE.MeshStandardMaterial({ color: 0x661010, emissive: 0xff1a1a, emissiveIntensity: 0.05, roughness: 0.2, transparent: true, opacity: 0.9 }),
      bleu: new THREE.MeshStandardMaterial({ color: 0x101a66, emissive: 0x1a5cff, emissiveIntensity: 0.05, roughness: 0.2, transparent: true, opacity: 0.9 }),
    };
    const y = c.dessus(-0.25, 0);
    caisse.add(boite(0.26, 0.05, 1.2, M.noir, -0.25, y + 0.03, 0));
    caisse.add(boite(0.22, 0.09, 0.5, gyro.bleu, -0.25, y + 0.1, -0.3));
    caisse.add(boite(0.22, 0.09, 0.5, gyro.rouge, -0.25, y + 0.1, 0.3));
    const roues = roues4(b.g, R, b.W2 - 0.12, "doubles", {});
    return Object.assign(voiture(b.g, caisse, roues, 1.34), { gyro });
  }

  // 🇫🇷 Peugeot 508 (4,75 m × 1,86 m × 1,40 m, empattement 2,79 m). Une berline basse sans cadres de vitres, au
  // coffre qui s'ouvre avec la lunette (un « fastback »), les crocs de lumière, les feux en 3 griffes sur une bande noire.
  function suv(k1, k2) {
    const b = berline({ L: 4.75, W: 1.86, H: 1.4, xAv: 1.42, xAr: -1.37, r: 0.33, j: 0.229, hCapot: 0.86, hCein: 0.94, xPB: 1.02, xTa: 0.3, xTr: -0.75, xLu: -1.95, hCoffre: 0.98, coffre: true, plaque: "PG-508-FB", cuir: [0.45, 0.1, 0.1] }, k1, k2, { lunette: [-1.92, -0.8] });
    const { caisse, c } = b;
    pharePose(caisse, c, [[1.9, 0.86], [2.36, 0.64], [2.35, 0.48], [1.98, 0.64]], [bande(1.94, 0.82, 2.34, 0.62, 0.02), bande(2.06, 0.72, 2.14, 0.68, 0.05)]);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, true, 0.36, cote * 0.66, 0.24, 0.02, [[0, 0, 0.22, 0.012]]); // les crocs
    auBout(caisse, c, true, 0.4, 0, 0.18, 1.0, trou(), 0.012);
    grille(caisse, c, true, 0.4, 0, 0.16, 0.96, M.chrome);
    emblemeAuBout(caisse, c, "peugeot", true, 0.52, 0.12, 0.14);
    auBout(caisse, c, false, 0.86, 0, 0.12, 1.5, M.noir, 0.012);
    for (const cote of [-1, 1]) for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.9 - i * 0.04, cote * 0.6, 0.02, 0.26, [[0, 0, 0.01, 0.24]], "feu");
    lettres(caisse, c, false, 0.86, 0, "PEUGEOT", 0.5, 0.05);
    lettres(caisse, c, false, 0.66, 0.5, "508", 0.16, 0.05);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.32, cote * 0.5, 0.04);
    const roues = roues4(b.g, b.R, b.W2 - 0.12, "y", {});
    return voiture(b.g, caisse, roues, 1.3);
  }

  // ================================================================ LES SPORTIVES

  // 🇫🇷 Bugatti Chiron (4,54 m × 2,04 m × 1,21 m, empattement 2,71 m). La calandre en fer à cheval, la ligne en « C »
  // chromée sur le flanc, les phares à 4 lampes, le toit de couleur 2 avec son arête au milieu, la barre de feux.
  function chiron(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.32, r: 0.345, l: 0.285, j: 0.255 }, { x: -1.39, r: 0.355, l: 0.355, j: 0.267 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.27, 0.9], [-2.12, 0.95], [-1.85, 0.96], [-1.5, 0.98], [-1.0, 1.08], [-0.55, 1.17], [-0.15, 1.21], [0.25, 1.16], [0.6, 1.0], [0.95, 0.8], [1.32, 0.7], [1.8, 0.6], [2.12, 0.52], [2.27, 0.46]],
      ceinture: [[-2.27, 0.86], [-2.12, 0.92], [-1.4, 0.92], [-0.8, 0.87], [-0.2, 0.84], [0.5, 0.8], [1.0, 0.82], [1.32, 0.84], [1.8, 0.7], [2.12, 0.56], [2.27, 0.47]],
      largeur: [[-2.27, 0.86], [-2.12, 0.97], [-1.4, 1.02], [-0.8, 0.99], [0, 0.97], [1.0, 1.0], [1.32, 1.0], [1.8, 0.96], [2.12, 0.88], [2.27, 0.74]],
      toit: [[-2.27, 0.5], [-1.85, 0.32], [-1.0, 0.42], [-0.15, 0.5], [0.6, 0.56], [0.95, 0.62], [2.27, 0.5]],
      bas: [[-2.27, 0.3], [-2.12, 0.2], [-1.4, 0.13], [1.32, 0.13], [2.12, 0.16], [2.27, 0.22]],
      epaule: 0.18,
    }), R, 0.85, peinture(k1), vitresUnies({ pareBrise: [0.28, 0.93], cotes: [-0.8, 0.72], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.9, xS: -0.15, sol: 0.18, hS: 0.32, w: 0.6, tdb: 0.82, toit: (x) => c.tranche(x).yt, cuir: [0.55, 0.38, 0.22], surpiqure: [0.1, 0.1, 0.2], volant: "rond" });
    pieceDessus(caisse, c, [[-1.85, 0], [0.32, 0], [0.32, 0.5], [-1.85, 0.36]], peinture(k2), 0.005); // le toit de couleur 2
    const dorsale = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0.3, 1.18], [-0.15, 1.235], [-0.6, 1.2], [-1.1, 1.1], [-1.6, 1.0], [-2.1, 0.97]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 30, 0.02, 6), peinture(k2));
    caisse.add(dorsale);
    // le fer à cheval chromé et sa grille, les phares à 4 lampes, les entrées d'air
    const fond = new THREE.Mesh(new THREE.CircleGeometry(0.19, 30), nidAbeille());
    fond.scale.set(0.85, 1.05, 1);
    fond.rotation.y = Math.PI / 2;
    fond.position.set(c.xMax + 0.012, 0.36, 0);
    caisse.add(fond);
    const forme = new THREE.Shape();
    forme.absarc(0, 0, 0.2, -Math.PI * 0.32, Math.PI * 1.32, false);
    forme.absarc(0, 0, 0.17, Math.PI * 1.32, -Math.PI * 0.32, true);
    const fer = new THREE.Mesh(new THREE.ExtrudeGeometry(forme, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 32 }), M.chrome);
    fer.scale.set(0.85, 1.05, 1);
    fer.rotation.y = Math.PI / 2;
    fer.position.set(c.xMax - 0.004, 0.36, 0);
    caisse.add(fer);
    emblemeAuBout(caisse, c, "bugatti", true, 0.5, 0.1, 0.06, 0, 0.02);
    pharePose(caisse, c, [[1.82, 0.88], [2.2, 0.72], [2.19, 0.5], [1.88, 0.62]], [bande(1.9, 0.8, 1.95, 0.78, 0.06), bande(1.98, 0.75, 2.03, 0.73, 0.06), bande(2.06, 0.7, 2.11, 0.67, 0.06), bande(2.12, 0.64, 2.17, 0.6, 0.06), bande(1.85, 0.66, 2.17, 0.53, 0.015)]);
    for (const cote of [-1, 1]) auBout(caisse, c, true, 0.3, cote * 0.48, 0.16, 0.3, trou(), 0.012);
    auBout(caisse, c, true, 0.22, 0, 0.025, 1.3, carbone(), 0.06);
    // la ligne en « C » chromée, et la prise d'air dedans
    const pts = [];
    for (let k = 0; k <= 16; k++) {
      const t = (k / 16) * (Math.PI * 1.22) + Math.PI * 0.4;
      pts.push([-0.12 + Math.cos(t) * 0.85, 0.52 + Math.sin(t) * 0.31]);
    }
    traitFlanc(caisse, c, R, pts, 0.016, M.chrome);
    pieceFlanc(caisse, c, R, [[-0.92, 0.42], [-0.62, 0.42], [-0.6, 0.76], [-0.88, 0.78]], trou(), 0.01);
    // l'arrière : la grande grille, la barre de feux, BUGATTI, le diffuseur, 4 sorties
    auBout(caisse, c, false, 0.55, 0, 0.44, 1.56, trou(), 0.012);
    grille(caisse, c, false, 0.55, 0, 0.4, 1.5);
    optiqueAuBout(caisse, c, false, 0.82, 0, 0.04, 1.62, [[0, 0, 0.018, 1.58]], "feu");
    lettres(caisse, c, false, 0.88, 0, "BUGATTI", 0.5, 0.06);
    diffuseur(caisse, c, 0.24, 1.5, 9);
    for (const [y, z] of [[0.44, -0.12], [0.44, 0.12], [0.32, -0.12], [0.32, 0.12]]) echappement(caisse, c.xMin - 0.04, y, z, 0.045);
    caisse.add(surLeDessus(plat(0.36, 1.55, peinture(k2), 0.03), c, -2.0, 0, 0.03)); // l'aileron rentré
    essuieGlaces(caisse, c, 0.92, 0.5, false);
    poignees(caisse, c, 0.2, 0.78, 0.14);
    retro(caisse, 0.68, 0.9, 0.78, peinture(k2), 0.95);
    basDeCaisse(caisse, c, 1.0, -0.95, 0.18, carbone());
    portiere(caisse, c, 0.72, -0.62, 0.22, 0.8, false);
    const roues = roues4(g, R, 0.85, "turbine", { etrier: [0.12, 0.28, 0.85] });
    return voiture(g, caisse, roues, 1.1);
  }

  // 🇩🇪 Porsche 911 (4,52 m × 1,85 m × 1,30 m, empattement 2,45 m). La silhouette qui descend jusqu'au moteur
  // (derrière !), les ailes arrière larges, les phares RONDS, la barre de feux, la grille du moteur à lamelles.
  function porsche911(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.3, r: 0.34, l: 0.245, j: 0.254 }, { x: -1.15, r: 0.35, l: 0.305, j: 0.267 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.26, 0.84], [-2.1, 0.9], [-1.8, 0.94], [-1.3, 1.07], [-0.8, 1.21], [-0.3, 1.3], [0.1, 1.27], [0.45, 1.1], [0.8, 0.82], [1.3, 0.69], [1.8, 0.61], [2.1, 0.54], [2.26, 0.47]],
      ceinture: [[-2.26, 0.8], [-2.1, 0.86], [-1.6, 0.88], [-1.15, 0.89], [-0.6, 0.84], [0, 0.82], [0.6, 0.8], [1.0, 0.79], [1.3, 0.8], [1.8, 0.7], [2.1, 0.57], [2.26, 0.47]],
      largeur: [[-2.26, 0.8], [-2.1, 0.9], [-1.6, 0.93], [-1.15, 0.93], [-0.6, 0.87], [0, 0.86], [0.6, 0.89], [1.3, 0.91], [1.8, 0.88], [2.1, 0.81], [2.26, 0.66]],
      toit: [[-2.26, 0.42], [-1.3, 0.45], [-0.3, 0.5], [0.45, 0.55], [0.8, 0.6], [2.26, 0.5]],
      bas: [[-2.26, 0.32], [-2.1, 0.22], [-1.6, 0.15], [1.3, 0.15], [2.1, 0.18], [2.26, 0.24]],
      epaule: 0.16,
    }), R, 0.79, peinture(k1), vitresUnies({ pareBrise: [0.22, 0.78], cotes: [-1.05, 0.62], montants: [-0.5], lunette: [-1.62, -0.82], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.76, xS: -0.15, sol: 0.2, hS: 0.34, w: 0.6, tdb: 0.8, toit: (x) => c.tranche(x).yt, rangs: 1, cuir: [0.55, 0.12, 0.1], surpiqure: [0.1, 0.1, 0.1], volant: "rond" });
    // les phares RONDS sur le haut des ailes, un peu redressés
    for (const cote of [-1, 1]) {
      const lampe = surLeDessus(phareRond(0.12 * Circuit.CONFIG.phares.taille), c, 1.98, cote * 0.6, 0.012);
      lampe.rotateZ(-0.35);
      caisse.add(lampe);
      auBout(caisse, c, true, 0.32, cote * 0.42, 0.14, 0.34, trou(), 0.012);
      optiqueAuBout(caisse, c, true, 0.43, cote * 0.48, 0.03, 0.2, [[0, 0, 0.012, 0.18]]);
    }
    auBout(caisse, c, true, 0.32, 0, 0.1, 0.3, trou(), 0.012);
    emblemeDessus(caisse, c, "porsche", 2.08, 0.08, 0.1);
    // l'arrière : la grille du moteur (lamelles), le becquet, la barre de feux, PORSCHE, 2 sorties
    for (let i = 0; i < 9; i++) caisse.add(surLeDessus(plat(0.022, 0.62, M.noir, 0.01), c, -1.8 - i * 0.04, 0, 0.004));
    caisse.add(surLeDessus(plat(0.22, 1.3, peinture(k1), 0.03), c, -2.08, 0, 0.03));
    optiqueAuBout(caisse, c, false, 0.68, 0, 0.05, 1.5, [[0, 0, 0.016, 1.46], [0, 0.6, 0.03, 0.26], [0, -0.6, 0.03, 0.26]], "feu");
    lettres(caisse, c, false, 0.6, 0, "PORSCHE", 0.6, 0.075);
    troisiemeFeu(caisse, c, -1.62, 0.3);
    auBout(caisse, c, false, 0.36, 0, 0.14, 1.2, trou(), 0.012);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.32, cote * 0.18, 0.05);
    plaque(caisse, c, false, 0.48, "911-GT-S");
    plaque(caisse, c, true, 0.28, "911-GT-S");
    essuieGlaces(caisse, c, 0.77, 0.48);
    poignees(caisse, c, -0.25, 0.77, 0.16);
    retro(caisse, 0.6, 0.9, 0.72, peinture(k1), 0.95);
    repetiteurs(caisse, c, R, 1.0, 0.7);
    basDeCaisse(caisse, c, 0.95, -0.8, 0.2);
    portiere(caisse, c, 0.72, -0.48, 0.22, 0.8, false);
    const roues = roues4(g, R, 0.79, "fins", { etrier: [0.85, 0.1, 0.1] });
    return voiture(g, caisse, roues, 1.2);
  }

  // 🇮🇹 Lamborghini Aventador (4,78 m × 2,03 m × 1,14 m, empattement 2,70 m). Toute en angles : la cabine en flèche,
  // les phares et les feux en « Y », les énormes prises d'air sur les flancs, le capot moteur à lamelles, l'aileron
  // et l'échappement hexagonal au milieu.
  function aventador(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.33, r: 0.34, l: 0.255, j: 0.254 }, { x: -1.37, r: 0.355, l: 0.355, j: 0.267 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.39, 0.94], [-2.25, 1.0], [-1.8, 1.02], [-1.37, 1.0], [-0.9, 1.05], [-0.45, 1.12], [-0.05, 1.136], [0.35, 1.05], [0.75, 0.86], [1.05, 0.72], [1.33, 0.66], [1.8, 0.55], [2.2, 0.43], [2.39, 0.37]],
      ceinture: [[-2.39, 0.9], [-2.25, 0.96], [-1.37, 0.98], [-0.8, 0.86], [0, 0.8], [0.8, 0.76], [1.33, 0.72], [1.8, 0.58], [2.2, 0.45], [2.39, 0.37]],
      largeur: [[-2.39, 0.9], [-2.25, 0.98], [-1.37, 1.015], [-0.8, 0.98], [0, 0.95], [0.8, 0.96], [1.33, 1.0], [1.8, 0.95], [2.2, 0.84], [2.39, 0.7]],
      toit: [[-2.39, 0.6], [-1.37, 0.5], [-0.45, 0.45], [0.35, 0.5], [0.9, 0.58], [2.39, 0.5]],
      bas: [[-2.39, 0.3], [-2.25, 0.2], [-1.37, 0.12], [1.33, 0.12], [2.2, 0.14], [2.39, 0.2]],
      epaule: 0.2, rt: 0.04,
    }), R, 0.86, peinture(k1), vitresUnies({ pareBrise: [-0.02, 0.92], cotes: [-0.6, 0.85], pilier: 0.07 }));
    habitacle(caisse, { xPB: 0.9, xS: -0.2, sol: 0.16, hS: 0.29, w: 0.58, tdb: 0.78, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.1], surpiqure: [0.95, 0.75, 0.1], volant: "course" });
    // le capot moteur à lamelles noires
    for (let i = 0; i < 10; i++) caisse.add(surLeDessus(plat(0.03, 0.7, M.noir, 0.012), c, -0.75 - i * 0.1, 0, 0.012));
    // les phares en Y, les grandes entrées d'air triangulaires devant
    pharePose(caisse, c, [[1.82, 0.9], [2.28, 0.74], [2.26, 0.58], [1.9, 0.72]], [bande(1.86, 0.86, 2.26, 0.7, 0.018), bande(2.05, 0.78, 2.14, 0.64, 0.018), bande(2.05, 0.78, 2.12, 0.84, 0.018)]);
    for (const cote of [-1, 1]) {
      const prise = auBout(caisse, c, true, 0.27, cote * 0.5, 0.18, 0.34, trou(), 0.012);
      prise.rotation.x = cote * 0.2;
      // la prise d'air géante derrière la portière, et la petite au-dessus
      pieceFlanc(caisse, c, R, [[-1.0, 0.24], [-0.42, 0.24], [-0.58, 0.62], [-0.92, 0.62]], trou(), 0.008);
      pieceFlanc(caisse, c, R, [[-1.15, 0.8], [-0.8, 0.82], [-0.82, 0.92], [-1.1, 0.92]], trou(), 0.01);
      // les feux en Y
      for (const a of [0.5, -0.5, 1.57]) {
        const f = optiqueAuBout(caisse, c, false, 0.82, cote * 0.6, 0.022, 0.26, [[0, 0, 0.012, 0.24]], "feu");
        f.rotateY(a);
      }
    }
    traitFlanc(caisse, c, R, [[1.9, 0.5], [0.6, 0.42], [-0.42, 0.24]], 0.008, peinture(fonce(k1, 0.7)));
    emblemeDessus(caisse, c, "lamborghini", 2.15, 0.09, 0.11);
    auBout(caisse, c, true, 0.2, 0, 0.025, 1.2, carbone(), 0.06);
    // l'arrière : l'aileron, la grande grille, l'échappement hexagonal
    caisse.add(surLeDessus(plat(0.26, 1.5, carbone(), 0.03), c, -2.15, 0, 0.06));
    auBout(caisse, c, false, 0.5, 0, 0.34, 1.6, trou(), 0.012);
    grille(caisse, c, false, 0.5, 0, 0.3, 1.5);
    const hexa = cylindre(0.13, 0.14, M.chrome, 6);
    hexa.rotation.z = Math.PI / 2;
    hexa.position.set(c.xMin - 0.05, 0.4, 0);
    caisse.add(hexa);
    const hexaFond = cylindre(0.1, 0.15, trou(), 6);
    hexaFond.rotation.z = Math.PI / 2;
    hexaFond.position.set(c.xMin - 0.055, 0.4, 0);
    caisse.add(hexaFond);
    lettres(caisse, c, false, 0.72, 0, "LAMBORGHINI", 0.6, 0.05);
    diffuseur(caisse, c, 0.24, 1.5, 9);
    essuieGlaces(caisse, c, 0.9, 0.5, false);
    retro(caisse, 0.62, 0.86, 0.8, peinture(k1), 0.9);
    basDeCaisse(caisse, c, 1.0, -0.95, 0.16, carbone());
    portiere(caisse, c, 0.86, -0.58, 0.24, 0.8, false);
    const roues = roues4(g, R, 0.86, "y", { etrier: [0.95, 0.75, 0.1] });
    return voiture(g, caisse, roues, 1.0);
  }

  // 🇯🇵 Honda NSX (1990 : 4,41 m × 1,81 m × 1,17 m, empattement 2,53 m). Le moteur au milieu, les phares ESCAMOTABLES
  // (cachés dans le capot), la cabine « bulle » au toit noir, et la longue bande de feux sur toute la largeur.
  function basse(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.25, r: 0.31, l: 0.215, j: 0.216 }, { x: -1.28, r: 0.33, l: 0.245, j: 0.229 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.2, 0.92], [-2.1, 0.98], [-1.6, 1.0], [-1.0, 1.02], [-0.6, 1.1], [-0.2, 1.17], [0.2, 1.15], [0.6, 0.97], [0.9, 0.8], [1.25, 0.72], [1.8, 0.62], [2.1, 0.53], [2.2, 0.48]],
      ceinture: [[-2.2, 0.88], [-2.1, 0.95], [-1.28, 0.96], [-0.6, 0.86], [0.4, 0.8], [1.25, 0.74], [1.8, 0.64], [2.1, 0.55], [2.2, 0.48]],
      largeur: [[-2.2, 0.82], [-2.05, 0.9], [-1.28, 0.905], [0, 0.88], [1.25, 0.89], [1.9, 0.86], [2.2, 0.74]],
      toit: [[-2.2, 0.6], [-1.0, 0.48], [-0.2, 0.5], [0.6, 0.56], [2.2, 0.5]],
      bas: [[-2.2, 0.32], [-2.05, 0.22], [-1.28, 0.16], [1.9, 0.18], [2.2, 0.26]],
      epaule: 0.14,
    }), R, 0.77, peinture(k1), vitresUnies({ pareBrise: [0.2, 0.88], cotes: [-0.95, 0.85], lunette: [-1.05, -0.55], pilier: 0.07 }));
    habitacle(caisse, { xPB: 0.86, xS: -0.15, sol: 0.2, hS: 0.34, w: 0.6, tdb: 0.8, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.1], surpiqure: [0.8, 0.1, 0.1], volant: "rond" });
    pieceDessus(caisse, c, [[-1.0, 0], [0.2, 0], [0.2, 0.48], [-1.0, 0.46]], peinture(k2), 0.005); // le toit noir
    // les phares escamotables (fermés : on voit seulement leur couvercle noir), les clignotants, l'entrée d'air
    pieceDessus(caisse, c, [[1.72, 0.74], [1.98, 0.66], [1.98, 0.44], [1.72, 0.48]], peinture(fonce(k1, 0.6)), 0.006);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, true, 0.4, cote * 0.58, 0.06, 0.24, [[0, 0, 0.04, 0.2]]);
    auBout(caisse, c, true, 0.3, 0, 0.08, 1.0, trou(), 0.012);
    emblemeAuBout(caisse, c, "honda", true, 0.44, 0.08, 0.07);
    // le flanc : la prise d'air devant la roue arrière
    pieceFlanc(caisse, c, R, [[-0.98, 0.42], [-0.68, 0.42], [-0.68, 0.7], [-0.9, 0.7]], trou(), 0.01);
    // l'arrière : la bande de feux sur toute la largeur, NSX, 2 sorties
    optiqueAuBout(caisse, c, false, 0.82, 0, 0.14, 1.56, [[0.04, 0, 0.04, 1.5], [-0.03, 0, 0.03, 1.5]], "feu");
    lettres(caisse, c, false, 0.66, 0, "NSX", 0.24, 0.07);
    emblemeAuBout(caisse, c, "honda", false, 0.66, 0.08, 0.07, 0.4);
    troisiemeFeu(caisse, c, -1.95, 0.5);
    auBout(caisse, c, false, 0.4, 0, 0.12, 1.3, M.plastique, 0.03);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.32, cote * 0.5, 0.045);
    plaque(caisse, c, false, 0.52, "NSX-1990");
    plaque(caisse, c, true, 0.3, "NSX-1990");
    essuieGlaces(caisse, c, 0.86, 0.5);
    poignees(caisse, c, -0.3, 0.76, 0.14);
    retro(caisse, 0.62, 0.88, 0.76, peinture(k1), 0.9);
    basDeCaisse(caisse, c, 0.9, -0.9, 0.2);
    portiere(caisse, c, 0.84, -0.6, 0.22, 0.8, false);
    const roues = roues4(g, R, 0.77, "etoile", {});
    return voiture(g, caisse, roues, 1.05);
  }

  // 🇩🇪 Mercedes Vito (5,14 m × 1,93 m × 1,91 m, empattement 3,20 m). Une camionnette : le nez court, le pare-brise
  // très penché, la grande boîte à l'arrière, la porte coulissante (on voit son rail), l'étoile dans la calandre.
  function camionnette(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.72, r: 0.34, l: 0.225, j: 0.216 }, { x: -1.48, r: 0.34, l: 0.225, j: 0.216 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.57, 1.75], [-2.5, 1.88], [-2.3, 1.91], [0.7, 1.91], [1.0, 1.86], [1.6, 1.22], [1.8, 1.08], [2.3, 0.98], [2.5, 0.88], [2.57, 0.8]],
      ceinture: [[-2.57, 1.0], [-2.5, 1.05], [0, 1.06], [1.6, 1.05], [1.8, 1.0], [2.3, 0.95], [2.5, 0.87], [2.57, 0.79]],
      largeur: [[-2.57, 0.92], [-2.45, 0.96], [1.6, 0.964], [2.2, 0.94], [2.57, 0.84]],
      toit: [[-2.57, 0.82], [-2.3, 0.86], [0.9, 0.86], [1.6, 0.84], [2.57, 0.7]],
      bas: [[-2.57, 0.42], [-2.4, 0.32], [1.9, 0.32], [2.57, 0.4]],
      epaule: 0.04, rt: 0.12,
    }), R, 0.82, peinture(k1), vitresUnies({ pareBrise: [1.0, 1.58], cotes: [-2.4, 1.56], montants: [0.75, -0.6, -1.6], lunette: [-2.57, -2.5], pilier: 0.08, haut: 0.08 }));
    habitacle(caisse, { xPB: 1.55, xS: 0.75, sol: 0.42, hS: 0.78, w: 0.8, tdb: 1.18, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.18, 0.18, 0.2], surpiqure: [0.3, 0.3, 0.3], volant: "rond" });
    // l'avant : les phares, la calandre à barres et la grande étoile, le pare-chocs
    pharePose(caisse, c, [[2.15, 0.94], [2.5, 0.84], [2.5, 0.6], [2.2, 0.7]], [bande(2.2, 0.9, 2.48, 0.8, 0.02), bande(2.3, 0.78, 2.36, 0.74, 0.06)]);
    auBout(caisse, c, true, 0.62, 0, 0.26, 0.9, trou(), 0.015);
    for (let i = 0; i < 3; i++) auBout(caisse, c, true, 0.54 + i * 0.08, 0, 0.02, 0.86, M.chrome, 0.03);
    emblemeAuBout(caisse, c, "mercedes", true, 0.62, 0.22, 0.22, 0, 0.035);
    auBout(caisse, c, true, 0.42, 0, 0.16, 1.86, M.plastique, 0.06);
    // le flanc : le rail de la porte coulissante, les poignées
    traitFlanc(caisse, c, R, [[0.7, 1.05], [-1.0, 1.05]], 0.012, M.noir);
    poignees(caisse, c, 1.15, 0.98, 0.18, M.noir);
    poignees(caisse, c, 0.5, 0.98, 0.18, M.noir);
    portiere(caisse, c, 1.56, 0.78, 0.4, 1.02, false);
    portiere(caisse, c, 0.76, -0.62, 0.4, 1.02, false);
    // l'arrière : les feux verticaux, les deux portes, la plaque
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 1.0, cote * 0.84, 0.5, 0.14, [[0.15, 0, 0.12, 0.1], [-0.12, 0, 0.12, 0.1]], "feu");
    caisse.add(boite(0.012, 1.0, 0.012, M.noir, c.xMin - 0.006, 1.2, 0));
    lettres(caisse, c, false, 0.8, 0.5, "VITO", 0.24, 0.05);
    emblemeAuBout(caisse, c, "mercedes", false, 0.9, 0.16, 0.16);
    plaque(caisse, c, false, 0.62, "VT-447-MB");
    plaque(caisse, c, true, 0.42, "VT-447-MB");
    auBout(caisse, c, false, 0.44, 0, 0.14, 1.86, M.plastique, 0.06);
    essuieGlaces(caisse, c, 1.57, 0.6);
    retro(caisse, 1.5, 1.2, 0.94, M.noir, 1.3);
    repetiteurs(caisse, c, R, 2.0, 0.85);
    basDeCaisse(caisse, c, 1.3, -1.05, 0.34);
    const roues = roues4(g, R, 0.82, "acier", {});
    return voiture(g, caisse, roues, 1.75);
  }

  // ================================================================ LES TOUT-TERRAIN, LE RALLYE ET LE CAMION

  // 🇯🇵 Le 4x4 : un Suzuki Jimny (3,48 m × 1,65 m × 1,73 m, empattement 2,25 m). Une petite boîte carrée : les phares
  // ronds, la calandre à 5 fentes, les ailes noires, le toit noir et la roue de secours sur la porte arrière.
  function quatre(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.14, r: 0.347, l: 0.195, j: 0.19 }, { x: -1.11, r: 0.347, l: 0.195, j: 0.19 }];
    const c = peau(caisse, silhouette({
      profil: [[-1.74, 1.15], [-1.7, 1.62], [-1.6, 1.7], [0.25, 1.72], [0.45, 1.66], [0.75, 1.12], [0.85, 1.07], [1.6, 1.03], [1.74, 0.98]],
      ceinture: [[-1.74, 1.08], [-1.6, 1.1], [0.75, 1.08], [0.85, 1.06], [1.6, 1.02], [1.74, 0.96]],
      largeur: [[-1.74, 0.78], [-1.6, 0.8], [1.6, 0.8], [1.74, 0.77]],
      toit: [[-1.74, 0.7], [-1.6, 0.72], [0.4, 0.72], [0.75, 0.7], [1.74, 0.66]],
      bas: [[-1.74, 0.52], [-1.6, 0.46], [1.6, 0.46], [1.74, 0.52]],
      epaule: 0.03, rt: 0.07, de: 0.01,
    }), R, 0.7, peinture(k1), vitresUnies({ pareBrise: [0.45, 0.76], cotes: [-1.55, 0.72], montants: [-0.05], lunette: [-1.74, -1.7], pilier: 0.07, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.72, xS: -0.15, sol: 0.55, hS: 0.92, w: 0.64, tdb: 1.22, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.14, 0.14, 0.15], surpiqure: [0.3, 0.3, 0.3], volant: "rond" });
    pieceDessus(caisse, c, [[-1.6, 0], [0.4, 0], [0.4, 0.7], [-1.6, 0.7]], peinture(k2), 0.004); // le toit noir
    for (const r of R) elargisseur(caisse, c, R, r, 0.05);
    // l'avant : les phares ronds, la calandre à 5 fentes, le S rouge, le pare-chocs noir
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.11);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.02, 0.82, cote * 0.55);
      caisse.add(ph);
      auBout(caisse, c, true, 0.86, cote * 0.72, 0.05, 0.1, M.orange, 0.03);
    }
    for (let i = -2; i <= 2; i++) auBout(caisse, c, true, 0.82, i * 0.1, 0.2, 0.05, trou(), 0.02);
    emblemeAuBout(caisse, c, "suzuki", true, 0.94, 0.12, 0.12, 0, 0.02);
    auBout(caisse, c, true, 0.58, 0, 0.16, 1.62, M.plastique, 0.1);
    // l'arrière : les feux dans le pare-chocs, la roue de secours, la plaque
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.66, cote * 0.62, 0.12, 0.22, [[0, 0, 0.08, 0.18]], "feu");
    roueSecours(caisse, c.xMin - 0.18, 1.08, 0.36, M.jante);
    plaque(caisse, c, false, 0.86, "JM-4X4-SZ");
    plaque(caisse, c, true, 0.55, "JM-4X4-SZ");
    auBout(caisse, c, false, 0.6, 0, 0.16, 1.62, M.plastique, 0.1);
    essuieGlaces(caisse, c, 0.74, 0.5);
    poignees(caisse, c, -0.1, 1.02, 0.15, M.noir);
    retro(caisse, 0.62, 1.2, 0.8, M.noir, 1.1);
    portiere(caisse, c, 0.72, -0.62, 0.5, 1.06, false);
    const roues = roues4(g, R, 0.7, "etoile", { pneu: "crampons" });
    return voiture(g, caisse, roues, 1.6);
  }

  // 🇯🇵 Le pickup : un Toyota Hilux à double cabine (5,33 m × 1,86 m × 1,82 m, empattement 3,09 m). La cabine à 4 portes,
  // la benne, la grosse calandre noire et chromée, les phares en lame, l'arceau dans la benne.
  function pickup(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.55, r: 0.388, l: 0.265, j: 0.216 }, { x: -1.53, r: 0.388, l: 0.265, j: 0.216 }];
    const mat = peinture(k1);
    const c = peau(caisse, silhouette({
      profil: [[-0.62, 1.3], [-0.56, 1.72], [-0.45, 1.79], [0.85, 1.8], [1.05, 1.75], [1.6, 1.24], [1.7, 1.2], [2.4, 1.1], [2.58, 1.02], [2.665, 0.94]],
      ceinture: [[-0.62, 1.25], [-0.5, 1.27], [1.6, 1.25], [2.4, 1.1], [2.58, 1.01], [2.665, 0.93]],
      largeur: [[-0.62, 0.9], [-0.5, 0.92], [1.6, 0.925], [2.4, 0.91], [2.665, 0.86]],
      toit: [[-0.62, 0.8], [0.85, 0.8], [1.6, 0.78], [2.665, 0.7]],
      bas: [[-0.62, 0.6], [2.4, 0.58], [2.665, 0.62]],
      epaule: 0.04, rt: 0.08,
    }), [R[0]], 0.82, mat, vitresUnies({ pareBrise: [1.05, 1.6], cotes: [-0.48, 1.56], montants: [0.45], lunette: [-0.62, -0.56], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 1.58, xS: 0.75, sol: 0.66, hS: 1.02, w: 0.78, tdb: 1.4, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.15, 0.15, 0.16], surpiqure: [0.3, 0.3, 0.3], volant: "rond" });
    // la benne : le fond, les côtés (avec leurs ailes au-dessus de la roue), le hayon, l'arceau
    const xB1 = -2.665, xB2 = -0.64, lB = xB2 - xB1, xM = (xB1 + xB2) / 2;
    caisse.add(boite(lB, 0.04, 1.65, M.plastique, xM, 0.9, 0));
    for (const cote of [-1, 1]) {
      caisse.add(boite(lB, 0.5, 0.07, mat, xM, 1.02, cote * 0.89));
      caisse.add(boite(lB, 0.36, 0.1, mat, xM, 0.74, cote * 0.88));
      caisse.add(tube([-0.75, 1.27, cote * 0.82], [-0.75, 1.72, cote * 0.7], 0.035, M.chrome));
      optiqueAuBout(caisse, { xMin: xB1 }, false, 1.0, cote * 0.82, 0.36, 0.12, [[0.1, 0, 0.12, 0.08], [-0.1, 0, 0.12, 0.08]], "feu");
    }
    caisse.add(tube([-0.75, 1.72, -0.7], [-0.75, 1.72, 0.7], 0.035, M.chrome)); // l'arceau
    caisse.add(boite(0.06, 0.5, 1.72, mat, xB1 + 0.03, 1.02, 0)); // le hayon
    lettres(caisse, { xMin: xB1 }, false, 1.1, 0, "TOYOTA", 0.6, 0.09, "#2a2a2a");
    caisse.add(boite(0.16, 0.16, 1.8, M.plastique, xB1 - 0.05, 0.62, 0));
    plaque(caisse, { xMin: xB1 - 0.13 }, false, 0.62, "HLX-4WD-21");
    // l'avant : les phares en lame, la grosse calandre, l'emblème, le pare-chocs avec sa plaque de protection
    pharePose(caisse, c, [[2.3, 0.92], [2.62, 0.84], [2.62, 0.62], [2.38, 0.68]], [bande(2.34, 0.88, 2.6, 0.8, 0.025), bande(2.45, 0.76, 2.52, 0.72, 0.06)]);
    auBout(caisse, c, true, 0.78, 0, 0.32, 1.1, trou(), 0.02);
    for (let i = 0; i < 4; i++) auBout(caisse, c, true, 0.66 + i * 0.08, 0, 0.02, 1.08, M.chrome, 0.03);
    emblemeAuBout(caisse, c, "toyota", true, 0.8, 0.22, 0.14, 0, 0.035);
    auBout(caisse, c, true, 0.62, 0, 0.18, 1.8, M.plastique, 0.08);
    auBout(caisse, c, true, 0.5, 0, 0.06, 0.8, M.chrome, 0.12);
    for (const r of [R[0]]) elargisseur(caisse, c, R, r, 0.045);
    portiere(caisse, c, 1.56, 0.45, 0.62, 1.22, false);
    portiere(caisse, c, 0.43, -0.48, 0.62, 1.22, false);
    for (const x of [1.0, -0.05]) poignees(caisse, c, x, 1.15, 0.18, M.chrome);
    caisse.add(boite(1.8, 0.05, 0.16, M.plastique, 0.5, 0.52, -0.95));
    caisse.add(boite(1.8, 0.05, 0.16, M.plastique, 0.5, 0.52, 0.95)); // les marchepieds
    essuieGlaces(caisse, c, 1.58, 0.6);
    retro(caisse, 1.48, 1.4, 0.92, peinture(k1), 1.2);
    const roues = roues4(g, R, 0.82, "doubles", { pneu: "crampons" });
    return voiture(g, caisse, roues, 1.75);
  }

  // 🇯🇵 La voiture de rallye : une Toyota GR Yaris Rally1 (4,10 m × 1,88 m × 1,25 m, empattement 2,63 m). Une petite
  // voiture très élargie : les ailes gonflées, l'énorme aileron, l'écope sur le toit, les bavettes, le numéro sur les
  // portières, les jantes blanches et l'arceau de sécurité à l'intérieur.
  function rallye(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.33, r: 0.33, l: 0.235, j: 0.229 }, { x: -1.3, r: 0.33, l: 0.235, j: 0.229 }];
    const c = peau(caisse, silhouette({
      profil: [[-2.05, 1.0], [-1.98, 1.1], [-1.75, 1.28], [-1.45, 1.35], [-0.5, 1.37], [0.15, 1.35], [0.55, 1.12], [0.9, 0.88], [1.33, 0.82], [1.8, 0.75], [1.98, 0.7], [2.05, 0.63]],
      ceinture: [[-2.05, 0.98], [-1.9, 1.0], [-1.3, 1.02], [0.9, 0.88], [1.33, 0.84], [1.8, 0.76], [1.98, 0.7], [2.05, 0.62]],
      largeur: [[-2.05, 0.8], [-1.9, 0.9], [-1.3, 0.94], [1.33, 0.94], [1.8, 0.91], [2.05, 0.78]],
      toit: [[-2.05, 0.55], [-1.45, 0.58], [0, 0.62], [0.9, 0.66], [2.05, 0.55]],
      bas: [[-2.05, 0.32], [-1.9, 0.22], [1.9, 0.2], [2.05, 0.28]],
      epaule: 0.12,
    }), R, 0.83, peinture(k1), vitresUnies({ pareBrise: [0.17, 0.88], cotes: [-1.3, 0.85], montants: [-0.4], lunette: [-1.92, -1.45], pilier: 0.08 }), 0.09);
    habitacle(caisse, { xPB: 0.86, xS: -0.1, sol: 0.24, hS: 0.4, w: 0.68, tdb: 0.92, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.12], surpiqure: [0.9, 0.1, 0.1], volant: "course", casque: true });
    // l'arceau de sécurité, dans la cabine
    for (const cote of [-1, 1]) {
      caisse.add(tube([-0.6, 0.3, cote * 0.55], [-0.55, 1.2, cote * 0.42], 0.022, M.chrome));
      caisse.add(tube([-0.55, 1.2, cote * 0.42], [0.45, 1.18, cote * 0.42], 0.022, M.chrome));
      caisse.add(tube([0.45, 1.18, cote * 0.42], [0.8, 0.85, cote * 0.55], 0.022, M.chrome));
    }
    caisse.add(tube([-0.55, 1.2, -0.42], [-0.55, 1.2, 0.42], 0.022, M.chrome));
    // la décoration : une bande de couleur 2 sur le capot et le toit, le numéro, les mots des sponsors
    pieceDessus(caisse, c, [[-1.4, 0], [1.95, 0], [1.95, 0.22], [-1.4, 0.22]], peinture(k2), 0.005);
    for (const cote of [-1, 1]) {
      const plaqueNum = etiquette("7", "#ffffff", "#111111", 0.38, 0.3);
      plaqueNum.rotation.y = cote > 0 ? 0 : Math.PI;
      plaqueNum.position.set(0.1, 0.68, cote * (c.tranche(0.1).w + 0.015));
      caisse.add(plaqueNum);
      lettresFlanc(caisse, c, -0.95, 0.55, cote, "MAXANCE RALLY", 0.62, 0.11, "#ffffff");
      // les bavettes rouges derrière chaque roue
      for (const r of R) caisse.add(boite(0.02, 0.3, 0.26, peinture([0.8, 0.05, 0.05]), r.x - r.r - 0.12, 0.22, cote * 0.8));
    }
    // l'avant : les phares, la grande calandre, la lame, les crochets de remorquage rouges
    pharePose(caisse, c, [[1.7, 0.88], [2.0, 0.74], [2.0, 0.56], [1.76, 0.68]], [bande(1.74, 0.84, 1.98, 0.71, 0.02), bande(1.84, 0.74, 1.9, 0.71, 0.06)]);
    auBout(caisse, c, true, 0.4, 0, 0.24, 1.2, trou(), 0.012);
    grille(caisse, c, true, 0.4, 0, 0.2, 1.1);
    emblemeAuBout(caisse, c, "toyota", true, 0.56, 0.14, 0.09, 0, 0.012);
    auBout(caisse, c, true, 0.2, 0, 0.03, 1.6, carbone(), 0.12);
    caisse.add(boite(0.1, 0.03, 0.05, peinture([0.8, 0.05, 0.05]), c.xMax + 0.05, 0.32, 0.45));
    // l'écope sur le toit, l'énorme aileron, le diffuseur, l'échappement
    caisse.add(surLeDessus(boite(0.3, 0.08, 0.22, carbone(), 0, 0, 0), c, 0.0, 0, 0.04));
    caisse.add(boite(0.36, 0.035, 1.75, peinture(k2), -2.12, 1.32, 0));
    for (const z of [-0.88, 0.88]) caisse.add(boite(0.42, 0.3, 0.02, peinture(k2), -2.12, 1.22, z));
    for (const z of [-0.4, 0.4]) caisse.add(boite(0.08, 0.32, 0.03, carbone(), -2.0, 1.15, z));
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.86, cote * 0.6, 0.1, 0.24, [[0, 0, 0.06, 0.2]], "feu");
    diffuseur(caisse, c, 0.28, 1.2, 7);
    echappement(caisse, c.xMin - 0.04, 0.34, 0.45, 0.06);
    essuieGlaces(caisse, c, 0.87, 0.55, false);
    retro(caisse, 0.75, 0.96, 0.84, peinture(k2), 0.9);
    portiere(caisse, c, 0.86, -0.4, 0.24, 0.86, false);
    const roues = roues4(g, R, 0.83, "y", { pneu: "crampons", metal: new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0.3, roughness: 0.4 }), etrier: [0.95, 0.75, 0.1] });
    return voiture(g, caisse, roues, 1.25);
  }

  // 🇫🇷 Le camion : un Renault Trucks D (7,20 m × 2,48 m × 3,50 m, empattement 4,10 m). La cabine avancée au-dessus du
  // moteur, le grand pare-brise, la calandre à lames, la grosse caisse de livraison, les roues jumelées à l'arrière.
  function camion(k1, k2) {
    const { g, caisse } = debut();
    const Rav = { x: 2.25, r: 0.52, l: 0.3, j: 0.286 };
    const R = [Rav, { x: -1.85, r: 0.52, l: 0.3, j: 0.286, voie: 0.88 }, { x: -1.85, r: 0.52, l: 0.3, j: 0.286, voie: 1.2 }];
    const c = peau(caisse, silhouette({
      profil: [[1.62, 2.9], [1.68, 2.96], [3.2, 2.96], [3.42, 2.86], [3.55, 1.76], [3.6, 1.6], [3.62, 1.25]],
      ceinture: [[1.62, 1.85], [3.42, 1.85], [3.55, 1.74], [3.62, 1.24]],
      largeur: [[1.62, 1.2], [1.7, 1.24], [3.4, 1.24], [3.62, 1.2]],
      toit: [[1.62, 1.1], [3.4, 1.1], [3.62, 1.05]],
      bas: [[1.62, 0.6], [3.62, 0.55]],
      epaule: 0.03, rt: 0.14, de: 0.01, pas: 0.15,
    }), [Rav], 1.04, peinture(k1), vitresUnies({ pareBrise: [3.44, 3.555], cotes: [2.6, 3.42], pilier: 0.1, haut: 0.12 }), 0.03);
    habitacle(caisse, { xPB: 3.42, xS: 2.75, sol: 1.25, hS: 1.65, w: 1.0, tdb: 2.02, toit: (x) => c.tranche(x).yt, cuir: [0.2, 0.22, 0.25], surpiqure: [0.4, 0.4, 0.4], volant: "rond" });
    // l'avant : la calandre à lames, les phares, le losange, le marchepied, le pare-chocs
    auBout(caisse, c, true, 0.95, 0, 0.55, 2.1, trou(), 0.02);
    for (let i = 0; i < 6; i++) auBout(caisse, c, true, 0.75 + i * 0.08, 0, 0.025, 2.0, peinture(fonce(k1, 0.6)), 0.03);
    emblemeAuBout(caisse, c, "renault", true, 1.42, 0.28, 0.28, 0, 0.02);
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 0.62, cote * 0.92, 0.18, 0.36, [[0.04, 0, 0.06, 0.3], [-0.05, 0, 0.04, 0.3]]);
      caisse.add(boite(0.3, 0.04, 0.4, M.plastique, 3.45, 0.5, cote * 1.08)); // les marches
      caisse.add(boite(0.3, 0.04, 0.4, M.plastique, 3.45, 0.85, cote * 1.08));
      caisse.add(tube([3.1, 1.2, cote * 1.26], [3.1, 2.4, cote * 1.26], 0.02, M.chrome)); // les poignées pour monter
    }
    auBout(caisse, c, true, 0.42, 0, 0.26, 2.44, M.plastique, 0.12);
    poignees(caisse, c, 2.7, 1.7, 0.2, M.noir);
    portiere(caisse, c, 3.42, 2.55, 0.62, 1.85, false);
    essuieGlaces(caisse, c, 3.52, 0.9);
    retro(caisse, 3.3, 2.1, 1.24, M.noir, 2.0);
    // la grande caisse (couleur 2), ses portes arrière, son nom, les feux, le châssis, le réservoir, les protections
    const boiteC = peinture(k2), xC1 = -3.6, xC2 = 1.5, lC = xC2 - xC1, xMC = (xC1 + xC2) / 2;
    caisse.add(boite(lC, 2.45, 2.48, boiteC, xMC, 2.28, 0));
    for (const y of [1.08, 3.48]) for (const z of [-1.24, 1.24]) caisse.add(boite(lC, 0.05, 0.05, M.chrome, xMC, y, z));
    for (const cote of [-1, 1]) {
      const nom = etiquette("MAXANCE TRANSPORTS", "#f2f2f0", "#1d3f9a", 4.2, 0.55);
      nom.rotation.y = cote > 0 ? 0 : Math.PI;
      nom.position.set(xMC, 2.5, cote * 1.25);
      caisse.add(nom);
      caisse.add(boite(3.0, 0.3, 0.04, M.plastique, -0.2, 0.62, cote * 1.18)); // la protection latérale
      optiqueAuBout(caisse, { xMin: xC1 }, false, 0.85, cote * 1.0, 0.2, 0.3, [[0.05, 0, 0.06, 0.26], [-0.05, 0, 0.06, 0.26]], "feu");
    }
    caisse.add(boite(0.02, 2.3, 0.02, M.noir, xC1 - 0.01, 2.28, 0)); // la fente entre les deux portes
    for (const z of [-0.6, 0.6]) caisse.add(tube([xC1 - 0.04, 1.3, z * 0.3], [xC1 - 0.04, 3.2, z * 0.3], 0.02, M.chrome));
    caisse.add(boite(0.1, 0.12, 2.3, M.plastique, xC1 + 0.2, 0.55, 0)); // la barre anti-encastrement
    plaque({ add: (o) => caisse.add(o) }, { xMin: xC1 - 0.01 }, false, 0.75, "TR-750-RT");
    for (const z of [-0.45, 0.45]) caisse.add(boite(5.6, 0.25, 0.12, M.noir, -0.2, 0.92, z)); // le châssis
    const reservoir = cylindre(0.28, 0.8, inoxBrosse(), 20);
    reservoir.rotation.z = Math.PI / 2;
    reservoir.position.set(0.8, 0.75, -1.0);
    caisse.add(reservoir);
    const roues = roues4(g, R, 1.04, "acier", {});
    return voiture(g, caisse, roues, 2.6);
  }
  const inoxBrosse = () => new THREE.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 0.85, roughness: 0.3 });

  // Un ressort (une hélice en tube) de hauteur 1 : on l'étire avec scale.y (affichage/scene3d.js le fait vivre).
  function ressort(rayon, tours, epaisseur, materiau) {
    const pts = [];
    for (let k = 0; k <= tours * 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rayon, k / (tours * 16), Math.sin(a) * rayon));
    }
    return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), tours * 16, epaisseur, 6, false), materiau);
  }

  // 🇺🇸 Le monster truck : un vieux pick-up des années 80 (comme « Bigfoot ») posé sur des roues de 1,90 m. Tout carré,
  // le long capot, la benne avec son arceau à 4 phares, les chromes, les bandes rétro, et les RESSORTS qui travaillent.
  function monster(k1, k2) {
    const { g, caisse } = debut();
    const h = 1.55; // le bas de la carrosserie
    const peint = peinture(k1);
    const c = peau(caisse, silhouette({
      profil: [[-0.47, h + 0.9], [-0.42, h + 1.4], [-0.3, h + 1.5], [0.6, h + 1.52], [0.78, h + 1.46], [0.98, h + 0.96], [1.1, h + 0.92], [2.35, h + 0.88], [2.47, h + 0.78]],
      ceinture: [[-0.47, h + 0.88], [0.98, h + 0.9], [2.35, h + 0.86], [2.47, h + 0.76]],
      largeur: [[-0.47, 1.0], [-0.4, 1.03], [2.35, 1.03], [2.47, 1.0]],
      toit: [[-0.47, 0.9], [0.6, 0.9], [2.47, 0.84]],
      bas: [[-0.47, h + 0.05], [2.47, h + 0.05]],
      epaule: 0.03, rt: 0.07, de: 0.01,
    }), [], 1.0, peint, vitresUnies({ pareBrise: [0.78, 0.98], cotes: [-0.38, 0.95], lunette: [-0.47, -0.42], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.95, xS: 0.2, sol: h + 0.3, hS: h + 0.62, w: 0.84, tdb: h + 1.0, toit: (x) => c.tranche(x).yt, cuir: [0.35, 0.2, 0.1], surpiqure: [0.9, 0.8, 0.1], volant: "rond", casque: true });
    // la benne, et l'arceau avec ses 4 phares ronds
    for (const cote of [-1, 1]) caisse.add(boite(1.95, 0.48, 0.08, peint, -1.45, h + 0.68, cote * 1.0));
    caisse.add(boite(0.08, 0.48, 2.06, peint, -2.43, h + 0.68, 0));
    caisse.add(boite(1.95, 0.36, 2.06, peint, -1.45, h + 0.24, 0));
    caisse.add(boite(1.95, 0.02, 1.9, M.noir, -1.45, h + 0.46, 0));
    for (const cote of [-1, 1]) caisse.add(tube([-0.6, h + 0.9, cote * 0.85], [-0.6, h + 1.75, cote * 0.85], 0.05, M.chrome));
    caisse.add(tube([-0.6, h + 1.75, -0.85], [-0.6, h + 1.75, 0.85], 0.05, M.chrome));
    for (const z of [-0.6, -0.2, 0.2, 0.6]) {
      const ph = phareRond(0.1);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(-0.5, h + 1.86, z);
      caisse.add(ph);
    }
    // les chromes : le gros pare-chocs, la calandre à barreaux, les 4 phares ronds
    caisse.add(boite(0.2, 0.25, 2.2, M.chrome, 2.55, h + 0.12, 0));
    caisse.add(boite(0.2, 0.22, 2.2, M.chrome, -2.52, h + 0.12, 0));
    auBout(caisse, c, true, h + 0.48, 0, 0.42, 1.0, trou(), 0.02);
    for (let i = 0; i < 4; i++) auBout(caisse, c, true, h + 0.33 + i * 0.1, 0, 0.03, 1.0, M.chrome, 0.04);
    emblemeAuBout(caisse, c, "ford", true, h + 0.48, 0.26, 0.14, 0, 0.05);
    for (const cote of [-1, 1]) {
      for (const dz of [0, 0.2]) {
        const ph = phareRond(0.085);
        ph.rotation.z = -Math.PI / 2;
        ph.position.set(c.xMax + 0.02, h + 0.48, cote * (0.62 + dz));
        caisse.add(ph);
      }
      optiqueAuBout(caisse, { xMin: -2.47 }, false, h + 0.6, cote * 0.85, 0.25, 0.15, [[0, 0, 0.2, 0.1]], "feu");
      // les GROS rétroviseurs chromés, au bout d'un long bras
      caisse.add(tube([0.9, h + 1.0, cote * 1.03], [0.85, h + 1.15, cote * 1.35], 0.025, M.chrome));
      caisse.add(boite(0.08, 0.38, 0.25, M.chrome, 0.85, h + 1.25, cote * 1.38));
      caisse.add(boite(0.01, 0.33, 0.21, M.vitre, 0.81, h + 1.25, cote * 1.38));
      // les bandes rétro (3 bandes, comme dans les années 80)
      ["#ff8a1a", "#ffd21a", "#e8352e"].forEach((couleur, i) => {
        const col = new THREE.Color(couleur);
        caisse.add(boite(4.6, 0.07, 0.02, i === 0 ? peinture(k2) : peinture([col.r, col.g, col.b]), -0.05, h + 0.62 - i * 0.1, cote * 1.045));
      });
    }
    poignees(caisse, c, 0.15, h + 0.82, 0.2, M.chrome);
    portiere(caisse, c, 0.95, -0.35, h + 0.1, h + 0.88, false);
    essuieGlaces(caisse, c, 0.96, 0.6);
    // le châssis, les essieux, les RESSORTS et les amortisseurs
    caisse.add(boite(4.0, 0.22, 0.25, M.noir, 0, 1.18, -0.6));
    caisse.add(boite(4.0, 0.22, 0.25, M.noir, 0, 1.18, 0.6));
    const ressorts = [];
    const bas = 0.95, haut = 1.08;
    for (const x of [-1.65, 1.65]) {
      const essieu = cylindre(0.11, 2.4, M.noir, 10);
      essieu.rotation.x = Math.PI / 2;
      essieu.position.set(x, bas, 0);
      g.add(essieu);
      g.add(boite(0.4, 0.3, 0.4, M.noir, x, bas, 0)); // le différentiel
      for (const z of [-0.6, 0.6]) {
        for (const dx of [-0.22, 0.22]) {
          const r = ressort(0.11, 6, 0.025, peinture(k2));
          r.position.set(x + dx, bas, z);
          r.userData.base = haut - bas + 0.25;
          r.scale.y = r.userData.base;
          g.add(r);
          ressorts.push(r);
        }
        const amorti = cylindre(0.05, 0.4, M.chrome, 10);
        amorti.position.set(x, bas + 0.25, z);
        g.add(amorti);
      }
    }
    const roues = [];
    for (const [x, avant] of [[1.65, true], [-1.65, false]]) {
      for (const cote of [-1, 1]) {
        const r = O.roue(0.95, 0.75, M.chrome, { rayons: 8, crampons: true, etrier: false });
        r.pivot.position.set(x, 0.95, cote * 1.32);
        g.add(r.pivot);
        roues.push(Object.assign(r, { avant }));
      }
    }
    return Object.assign(voiture(g, caisse, roues, 3.3), { ressorts });
  }

  // ================================================================ LES VÉHICULES OUVERTS

  // Une peau OUVERTE (le buggy, la F1) : la règle dit quels petits morceaux du dessus sont des trous (le cockpit,
  // le moteur à l'air). On les range dans le groupe « vitre », et on leur donne une matière invisible.
  const invisible = new THREE.MeshBasicMaterial({ visible: false });
  function peauOuverte(caisse, cles, R, voie, mat, trous, ailes) {
    const c = Circuit.Coque.construire({ cles, arches: R.length ? N.arches(R, voie) : [], ailes: ailes === undefined ? 0 : ailes, vitre: (centre, n) => Math.abs(n[2]) < 0.6 && trous(centre[0], Math.abs(centre[2])) });
    const m = new THREE.Mesh(c.geometrie, [mat, invisible]);
    m.castShadow = m.receiveShadow = true;
    caisse.add(m);
    return c;
  }
  // Un pilote assis (pour les véhicules sans habitacle) : le buste, la tête dans son casque, les bras vers (xMain, yMain).
  function pilote(caisse, x, y, z, combinaison, casque, xMain, yMain, ecartMains, penche) {
    const mat = combinaison;
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.3, 4, 10), mat);
    buste.position.set(x, y + 0.25, z);
    buste.rotation.z = penche === undefined ? 0.35 : penche;
    buste.scale.set(0.8, 1, 1.1);
    caisse.add(buste);
    const xTete = x - Math.sin(buste.rotation.z) * 0.38, yTete = y + 0.25 + Math.cos(buste.rotation.z) * 0.38;
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 12), casque);
    tete.position.set(xTete + 0.02, yTete, z);
    caisse.add(tete);
    const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.137, 18, 8, -0.9, 1.8, 1.1, 0.7), M.vitre);
    visiere.rotation.y = Math.PI / 2;
    visiere.position.set(xTete + 0.02, yTete, z);
    caisse.add(visiere);
    for (const dz of [-1, 1]) {
      const epaule = [x - 0.05, y + 0.42, z + dz * 0.17], main = [xMain, yMain, z + dz * ecartMains];
      const coude = [(epaule[0] + main[0]) / 2, Math.min(epaule[1], main[1]) - 0.05, z + dz * (0.2 + ecartMains) / 2];
      caisse.add(tube(epaule, coude, 0.042, mat));
      caisse.add(tube(coude, main, 0.036, mat));
      const gant = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.noir);
      gant.position.set(...main);
      caisse.add(gant);
    }
  }

  // Le kart (1,85 m de long, 1,35 m de large, empattement 1,04 m) : un cadre en tubes, le carénage avant, les pontons
  // sur les côtés, le pare-chocs arrière, le siège moulé, le petit moteur à côté du pilote et son pot d'échappement.
  function kart(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 0.55, r: 0.14, l: 0.13, j: 0.065, voie: 0.56 }, { x: -0.5, r: 0.14, l: 0.2, j: 0.065, voie: 0.62 }];
    const coul = peinture(k1), coul2 = peinture(k2);
    // le cadre en tubes, le plancher
    for (const z of [-0.28, 0.28]) caisse.add(tube([-0.62, 0.1, z], [0.68, 0.1, z * 0.75], 0.016, M.chrome));
    for (const x of [-0.5, 0.0, 0.55]) caisse.add(tube([x, 0.1, -0.3], [x, 0.1, 0.3], 0.014, M.chrome));
    caisse.add(boite(0.75, 0.01, 0.42, M.noir, 0.32, 0.085, 0));
    // le carénage avant (une petite coque), le panneau devant les jambes avec le numéro
    const nez = Circuit.Coque.construire({ cles: [
      { x: 0.62, yb: 0.08, yc: 0.2, yt: 0.24, w: 0.4, n: 3 }, { x: 0.8, yb: 0.07, yc: 0.18, yt: 0.21, w: 0.44, n: 3 }, { x: 0.95, yb: 0.08, yc: 0.13, yt: 0.15, w: 0.38, n: 2.5 },
    ] });
    caisse.add(new THREE.Mesh(nez.geometrie, coul));
    const panneau = boite(0.03, 0.26, 0.4, coul, 0.5, 0.3, 0);
    panneau.rotation.z = 0.35;
    caisse.add(panneau);
    const numero = etiquette("7", "#ffd21a", "#111111", 0.22, 0.18);
    numero.rotation.y = Math.PI / 2;
    numero.rotation.x = 0;
    numero.position.set(0.53, 0.32, 0);
    caisse.add(numero);
    // les pontons (couleur 1) sur les côtés, le pare-chocs arrière (couleur 2)
    for (const cote of [-1, 1]) {
      const ponton = Circuit.Coque.construire({ cles: [
        { x: -0.32, yb: 0.08, yc: 0.2, yt: 0.22, w: 0.07, n: 3 }, { x: 0.0, yb: 0.08, yc: 0.24, yt: 0.26, w: 0.08, n: 3 }, { x: 0.3, yb: 0.08, yc: 0.18, yt: 0.2, w: 0.07, n: 3 },
      ] });
      const m = new THREE.Mesh(ponton.geometrie, coul);
      m.position.z = cote * 0.55;
      caisse.add(m);
    }
    caisse.add(tube([-0.82, 0.18, -0.68], [-0.82, 0.18, 0.68], 0.025, coul2));
    for (const z of [-0.5, 0.5]) caisse.add(tube([-0.62, 0.1, z * 0.56], [-0.82, 0.18, z * 1.2], 0.02, coul2));
    // le siège moulé, le moteur, son pot d'échappement, la chaîne
    const siege = boite(0.36, 0.42, 0.36, M.noir, -0.28, 0.32, 0);
    siege.rotation.z = 0.35;
    caisse.add(siege);
    caisse.add(boite(0.18, 0.2, 0.16, inoxBrosse(), -0.35, 0.25, 0.34));
    for (let i = 0; i < 5; i++) caisse.add(boite(0.2, 0.01, 0.18, inoxBrosse(), -0.35, 0.36 + i * 0.022, 0.34)); // les ailettes du cylindre
    const pot = cylindre(0.05, 0.36, M.noir, 14);
    pot.rotation.z = Math.PI / 2;
    pot.position.set(-0.62, 0.24, 0.3);
    caisse.add(pot);
    caisse.add(boite(0.4, 0.02, 0.02, M.noir, -0.5, 0.1, 0.4));
    // la colonne de direction et le petit volant
    caisse.add(tube([0.6, 0.12, 0], [0.22, 0.5, 0], 0.015, M.chrome));
    const volant = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.018, 8, 20), M.noir);
    volant.position.set(0.22, 0.52, 0);
    volant.rotation.y = Math.PI / 2;
    volant.rotateX(-0.45);
    caisse.add(volant);
    // le pilote, casqué, en combinaison (couleur 2), les jambes allongées dans le nez
    pilote(caisse, -0.3, 0.22, 0, coul2, M.casque, 0.2, 0.52, 0.12, 0.45);
    for (const dz of [-0.1, 0.1]) caisse.add(tube([-0.15, 0.25, dz], [0.55, 0.2, dz * 1.3], 0.055, coul2));
    const roues = roues4(g, R, 0.6, "etoile", {});
    return voiture(g, caisse, roues, 0.9);
  }

  // La Formule 1 (5,60 m × 2,00 m × 0,95 m, empattement 3,60 m) : le nez fin, la monocoque, les pontons, la prise d'air
  // au-dessus du pilote, le « halo » qui le protège, l'aileron avant à plusieurs étages, le grand aileron arrière, les
  // bras de suspension et les roues de 18 pouces avec leurs caches.
  function f1(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.85, r: 0.36, l: 0.305, j: 0.229, voie: 0.8 }, { x: -1.75, r: 0.36, l: 0.405, j: 0.229, voie: 0.78 }];
    const coul = peinture(k1), coul2 = peinture(k2);
    const c = peauOuverte(caisse, [
      { x: -2.5, yb: 0.12, yc: 0.28, yt: 0.32, w: 0.1, n: 3 },
      { x: -2.2, yb: 0.08, yc: 0.36, yt: 0.4, w: 0.18, n: 3.5 },
      { x: -1.6, yb: 0.06, yc: 0.42, yt: 0.48, w: 0.32, n: 4 },
      { x: -1.1, yb: 0.05, yc: 0.5, yt: 0.56, w: 0.6, n: 4.5 },
      { x: -0.6, yb: 0.05, yc: 0.55, yt: 0.6, w: 0.74, n: 4.5 },
      { x: -0.15, yb: 0.05, yc: 0.58, yt: 0.64, w: 0.72, n: 4.5 },
      { x: 0.2, yb: 0.05, yc: 0.6, yt: 0.66, w: 0.42, n: 4 },
      { x: 0.7, yb: 0.06, yc: 0.58, yt: 0.66, w: 0.36, n: 3.5 },
      { x: 1.2, yb: 0.08, yc: 0.5, yt: 0.58, w: 0.28, n: 3 },
      { x: 1.8, yb: 0.11, yc: 0.4, yt: 0.46, w: 0.2, n: 3 },
      { x: 2.4, yb: 0.14, yc: 0.3, yt: 0.34, w: 0.13, n: 2.5 },
      { x: 2.75, yb: 0.17, yc: 0.25, yt: 0.27, w: 0.07, n: 2.2 },
    ], [], 0.8, coul, (x, z) => x > -0.12 && x < 0.62 && z < 0.24);
    // la prise d'air au-dessus du pilote, et le capot moteur qui descend jusqu'à l'aileron
    const capot = Circuit.Coque.construire({ cles: [
      { x: -2.3, yb: 0.36, yc: 0.4, yt: 0.42, w: 0.08, n: 2.5 }, { x: -1.4, yb: 0.5, yc: 0.62, yt: 0.66, w: 0.18, n: 2.5 },
      { x: -0.6, yb: 0.58, yc: 0.82, yt: 0.92, w: 0.2, n: 2.5 }, { x: -0.25, yb: 0.6, yc: 0.86, yt: 0.98, w: 0.16, n: 2.5 }, { x: -0.12, yb: 0.62, yc: 0.84, yt: 0.95, w: 0.12, n: 2.5 },
    ] });
    caisse.add(new THREE.Mesh(capot.geometrie, coul2));
    caisse.add(boite(0.02, 0.1, 0.16, trou(), -0.1, 0.9, 0)); // l'entrée d'air
    caisse.add(boite(1.4, 0.18, 0.012, coul, -1.3, 0.72, 0)); // la dérive
    // le pilote (seul son casque dépasse), le halo
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), coul2);
    casque.position.set(0.05, 0.74, 0);
    caisse.add(casque);
    const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.132, 18, 8, -0.9, 1.8, 1.1, 0.7), M.vitre);
    visiere.rotation.y = Math.PI / 2;
    visiere.position.set(0.05, 0.74, 0);
    caisse.add(visiere);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 28, Math.PI), carbone());
    halo.rotation.x = -Math.PI / 2;
    halo.scale.set(1.4, 1, 1);
    halo.position.set(0.15, 0.86, 0);
    caisse.add(halo);
    caisse.add(tube([0.62, 0.66, 0], [0.62, 0.86, 0], 0.025, carbone()));
    for (const cote of [-1, 1]) caisse.add(tube([-0.32, 0.64, cote * 0.34], [-0.33, 0.86, cote * 0.34], 0.02, carbone()));
    // l'aileron avant : le plan principal, 3 volets, les dérives (couleur 2)
    for (let i = 0; i < 4; i++) {
      const plan = boite(0.22 - i * 0.03, 0.012, 1.85, i ? carbone() : coul2, 2.62 - i * 0.12, 0.1 + i * 0.045, 0);
      plan.rotation.z = -0.1 - i * 0.12;
      caisse.add(plan);
    }
    for (const cote of [-1, 1]) caisse.add(boite(0.55, 0.26, 0.012, coul2, 2.55, 0.2, cote * 0.94));
    // l'aileron arrière : 2 plans, les dérives, l'aileron bas, les supports
    for (let i = 0; i < 2; i++) {
      const plan = boite(0.28 - i * 0.08, 0.015, 1.0, i ? carbone() : coul2, -2.35 + i * 0.05, 0.86 + i * 0.1, 0);
      plan.rotation.z = 0.15 + i * 0.25;
      caisse.add(plan);
    }
    for (const cote of [-1, 1]) caisse.add(boite(0.55, 0.62, 0.015, coul2, -2.38, 0.7, cote * 0.51));
    caisse.add(boite(0.2, 0.012, 0.8, carbone(), -2.3, 0.4, 0));
    caisse.add(tube([-2.2, 0.42, 0], [-2.3, 0.86, 0], 0.025, carbone()));
    // le fond plat, la planche, le diffuseur, le feu de pluie
    caisse.add(boite(3.2, 0.02, 1.4, carbone(), -0.4, 0.04, 0));
    for (let i = -3; i <= 3; i++) caisse.add(boite(0.4, 0.14, 0.01, carbone(), -2.25, 0.12, i * 0.14));
    caisse.add(boite(0.02, 0.06, 0.06, M.feuLed, -2.52, 0.36, 0));
    // les bras de suspension (des tubes du châssis aux moyeux), les rétroviseurs, le numéro
    for (const r of R) for (const cote of [-1, 1]) {
      const zMoyeu = cote * (r.voie - 0.1);
      caisse.add(tube([r.x - 0.25, 0.22, cote * 0.18], [r.x, r.r, zMoyeu], 0.016, carbone()));
      caisse.add(tube([r.x + 0.25, 0.22, cote * 0.18], [r.x, r.r, zMoyeu], 0.016, carbone()));
      caisse.add(tube([r.x - 0.2, 0.42, cote * 0.18], [r.x, r.r + 0.12, zMoyeu], 0.014, carbone()));
    }
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.35, 0.6, cote * 0.36], [0.3, 0.7, cote * 0.48], 0.012, carbone()));
      caisse.add(boite(0.05, 0.06, 0.12, coul2, 0.3, 0.72, cote * 0.5));
      const num = etiquette("7", "#ffffff", "#111111", 0.2, 0.18);
      num.rotation.y = cote > 0 ? 0 : Math.PI;
      num.position.set(-1.2, 0.72, cote * 0.21);
      caisse.add(num);
      lettresFlanc(caisse, c, -0.6, 0.38, cote, "MAXANCE RACING", 0.8, 0.1, "#ffffff");
    }
    const roues = roues4(g, R, 0.8, "turbine", { etrier: false });
    return voiture(g, caisse, roues, 0.85);
  }

  // Le buggy (3,50 m × 1,75 m, empattement 2,05 m), comme les buggys des dunes : une coque en résine toute ronde, sans
  // toit et sans portes, les ailes qui couvrent les roues, le moteur à l'air derrière, l'arceau et les gros pneus arrière.
  function buggy(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 1.05, r: 0.3, l: 0.19, j: 0.19, voie: 0.68 }, { x: -1.0, r: 0.37, l: 0.3, j: 0.19, voie: 0.7 }];
    const coul = peinture(k1);
    const c = peauOuverte(caisse, [
      { x: -1.65, yb: 0.42, yc: 0.68, yt: 0.72, w: 0.6, n: 3 },
      { x: -1.45, yb: 0.38, yc: 0.82, yt: 0.86, w: 0.82, n: 3.5 },
      { x: -1.0, yb: 0.36, yc: 0.9, yt: 0.92, w: 0.88, n: 3.5 },
      { x: -0.65, yb: 0.34, yc: 0.78, yt: 0.8, w: 0.74, n: 3.5 },
      { x: 0.0, yb: 0.32, yc: 0.72, yt: 0.74, w: 0.7, n: 3.5 },
      { x: 0.6, yb: 0.32, yc: 0.78, yt: 0.8, w: 0.74, n: 3.5 },
      { x: 1.05, yb: 0.34, yc: 0.86, yt: 0.86, w: 0.84, n: 3.5 },
      { x: 1.5, yb: 0.38, yc: 0.74, yt: 0.74, w: 0.78, n: 3 },
      { x: 1.75, yb: 0.44, yc: 0.58, yt: 0.6, w: 0.56, n: 2.5 },
    ], R, 0.7, coul, (x, z) => (x > -0.75 && x < 0.55 && z < 0.56) || (x > -1.62 && x < -1.12 && z < 0.4), 0.06);
    habitacle(caisse, { xPB: 0.52, xS: -0.35, sol: 0.36, hS: 0.5, w: 0.52, tdb: 0.8, toit: () => 2, cuir: [0.15, 0.12, 0.1], surpiqure: [0.8, 0.6, 0.1], volant: "rond", casque: true });
    // l'arceau
    for (const cote of [-1, 1]) caisse.add(tube([-0.75, 0.78, cote * 0.58], [-0.68, 1.45, cote * 0.45], 0.035, M.chrome));
    caisse.add(tube([-0.68, 1.45, -0.45], [-0.68, 1.45, 0.45], 0.035, M.chrome));
    for (const cote of [-1, 1]) caisse.add(tube([-0.68, 1.45, cote * 0.4], [-1.25, 0.86, cote * 0.35], 0.03, M.chrome));
    // le moteur à l'air (4 cylindres à plat), le filtre à air chromé, les 2 pots
    caisse.add(boite(0.4, 0.26, 0.62, inoxBrosse(), -1.38, 0.62, 0));
    const filtre = cylindre(0.12, 0.08, M.chrome, 20);
    filtre.position.set(-1.38, 0.82, 0);
    caisse.add(filtre);
    for (const cote of [-1, 1]) {
      const pot = cylindre(0.06, 0.4, M.chrome, 14);
      pot.rotation.z = Math.PI / 2 - 0.15;
      pot.position.set(-1.75, 0.55, cote * 0.18);
      caisse.add(pot);
    }
    // les phares ronds sur les ailes avant, les petits feux ronds
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.09);
      ph.rotation.z = -Math.PI / 2 + 0.3;
      ph.position.set(1.3, 0.86, cote * 0.55);
      caisse.add(ph);
      const feu = cylindre(0.045, 0.03, M.feuLed, 16);
      feu.rotation.z = Math.PI / 2;
      feu.position.set(-1.63, 0.7, cote * 0.48);
      caisse.add(feu);
    }
    // la roue de secours couchée sur le nez
    const secours = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.08, 10, 24), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 }));
    secours.rotation.x = Math.PI / 2;
    secours.position.set(1.15, 0.9, 0);
    caisse.add(secours);
    const roues = roues4(g, R, 0.7, "etoile", { pneu: "crampons", metal: M.chrome });
    return voiture(g, caisse, roues, 1.2);
  }

  // Le quad sportif (1,85 m × 1,17 m, empattement 1,28 m), comme une Yamaha Raptor : les garde-boue en plastique, la
  // selle longue, le guidon, le moteur, le pot qui remonte à l'arrière, les repose-pieds, et le pilote penché en avant.
  function quad(k1, k2) {
    const { g, caisse } = debut();
    const R = [{ x: 0.62, r: 0.28, l: 0.18, j: 0.127, voie: 0.45 }, { x: -0.66, r: 0.255, l: 0.25, j: 0.114, voie: 0.44 }];
    const coul = peinture(k1);
    // les garde-boue (une forme vue de côté, épaissie sur toute la largeur), avec les phares devant
    const gardeBoue = (pts, largeur, x0) => {
      const forme = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
      const geo = new THREE.ExtrudeGeometry(forme, { depth: largeur, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3 });
      geo.translate(0, 0, -largeur / 2);
      const m = new THREE.Mesh(geo, coul);
      m.castShadow = true;
      caisse.add(m);
    };
    gardeBoue([[0.15, 0.62], [0.35, 0.78], [0.75, 0.8], [1.0, 0.66], [1.0, 0.6], [0.7, 0.68], [0.3, 0.66]], 1.0);
    gardeBoue([[-0.25, 0.7], [-0.45, 0.82], [-0.95, 0.8], [-1.0, 0.68], [-0.7, 0.72], [-0.3, 0.64]], 1.0);
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.06);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(1.05, 0.64, cote * 0.2);
      caisse.add(ph);
    }
    caisse.add(boite(0.02, 0.05, 0.16, M.feuLed, -1.02, 0.72, 0));
    // le cadre, les bras de suspension, le moteur, le pot
    for (const z of [-0.12, 0.12]) caisse.add(tube([-0.7, 0.4, z], [0.75, 0.4, z], 0.022, M.noir));
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.5, 0.36, cote * 0.12], [0.62, 0.28, cote * 0.36], 0.018, M.noir));
      caisse.add(tube([0.75, 0.36, cote * 0.12], [0.62, 0.28, cote * 0.36], 0.018, M.noir));
      caisse.add(tube([0.62, 0.5, cote * 0.12], [0.62, 0.36, cote * 0.34], 0.03, peinture([0.9, 0.5, 0.05]))); // l'amortisseur
      caisse.add(tube([-0.35, 0.3, cote * 0.3], [0.25, 0.3, cote * 0.34], 0.02, M.chrome)); // les repose-pieds
    }
    caisse.add(boite(0.4, 0.3, 0.3, inoxBrosse(), -0.1, 0.45, 0));
    caisse.add(tube([-0.1, 0.45, 0.16], [-0.6, 0.62, 0.22], 0.035, M.chrome));
    const pot = cylindre(0.07, 0.42, M.chrome, 14);
    pot.rotation.z = Math.PI / 2 - 0.3;
    pot.position.set(-0.8, 0.72, 0.24);
    caisse.add(pot);
    // la selle, le réservoir, le guidon
    const selle = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.75, 4, 12), M.noir);
    selle.rotation.z = Math.PI / 2 - 0.05;
    selle.scale.set(1, 1, 1.15);
    selle.position.set(-0.32, 0.82, 0);
    caisse.add(selle);
    caisse.add(boite(0.36, 0.16, 0.34, coul, 0.15, 0.82, 0));
    caisse.add(tube([0.32, 0.86, 0], [0.38, 1.02, 0], 0.025, M.noir));
    caisse.add(tube([0.36, 1.02, -0.4], [0.36, 1.02, 0.4], 0.02, M.chrome));
    for (const cote of [-1, 1]) caisse.add(tube([0.36, 1.02, cote * 0.32], [0.36, 1.02, cote * 0.42], 0.03, M.noir));
    // le pilote, penché en avant
    pilote(caisse, -0.32, 0.85, 0, peinture(k2), M.casque, 0.36, 1.02, 0.36, 0.55);
    for (const dz of [-0.18, 0.18]) {
      caisse.add(tube([-0.3, 0.92, dz], [0.0, 0.7, dz * 1.6], 0.06, peinture(k2)));
      caisse.add(tube([0.0, 0.7, dz * 1.6], [-0.05, 0.36, dz * 1.7], 0.05, peinture(k2)));
    }
    const roues = roues4(g, R, 0.45, "etoile", { pneu: "crampons" });
    return voiture(g, caisse, roues, 1.3);
  }

  // 🇯🇵 Kawasaki Ninja 650 (2,06 m × 0,74 m × 1,14 m, empattement 1,41 m, roues de 17 pouces). Le carénage pointu
  // avec sa bulle fumée, les deux phares en amande, le réservoir, la coque arrière qui remonte, le moteur bicylindre,
  // le cadre en tubes, le bras oscillant, le pot court, et le pilote en combinaison de cuir couché sur le réservoir.
  // (Toute la moto est agrandie × 1,5 dans le jeu, comme avant : config.js, taille.moto.)
  function moto(k1, k2) {
    const { g, caisse } = debut();
    const vert = peinture(k1), noir = peinture(k2), blanc = peinture([0.95, 0.95, 0.95]);
    const coqueMoto = (cles, mat, vitre) => {
      const c = Circuit.Coque.construire({ cles, vitre });
      const m = new THREE.Mesh(c.geometrie, [mat, M.vitreFumee]);
      m.castShadow = true;
      caisse.add(m);
      return c;
    };
    // le carénage avant et sa bulle, le réservoir, la coque arrière
    coqueMoto([
      { x: 0.25, yb: 0.45, yc: 0.92, yt: 0.98, w: 0.19, wb: 0.1, n: 2.2 },
      { x: 0.55, yb: 0.42, yc: 0.98, yt: 1.1, w: 0.2, wb: 0.11, n: 2.2 },
      { x: 0.85, yb: 0.5, yc: 0.92, yt: 1.0, w: 0.16, wb: 0.09, n: 2.2 },
      { x: 1.05, yb: 0.66, yc: 0.82, yt: 0.86, w: 0.08, wb: 0.05, n: 2 },
    ], vert, (ctr, n) => ctr[1] > 0.98 && n[1] > 0.35 && ctr[0] > 0.45 && ctr[0] < 0.92);
    coqueMoto([
      { x: -0.22, yb: 0.8, yc: 0.94, yt: 1.0, w: 0.12, n: 2.2 },
      { x: 0.05, yb: 0.78, yc: 1.02, yt: 1.12, w: 0.17, n: 2.2 },
      { x: 0.35, yb: 0.8, yc: 1.0, yt: 1.08, w: 0.15, n: 2.2 },
    ], vert);
    coqueMoto([
      { x: -1.02, yb: 1.06, yc: 1.12, yt: 1.14, w: 0.05, n: 2 },
      { x: -0.75, yb: 0.96, yc: 1.05, yt: 1.07, w: 0.1, n: 2.2 },
      { x: -0.45, yb: 0.86, yc: 0.97, yt: 0.98, w: 0.13, n: 2.4 },
      { x: -0.25, yb: 0.84, yc: 0.94, yt: 0.95, w: 0.13, n: 2.4 },
    ], vert);
    // la selle (pilote et passager), le bouchon du réservoir
    const selle = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.3, 4, 10), M.siege);
    selle.rotation.z = Math.PI / 2 + 0.12;
    selle.scale.set(0.45, 1, 1.15);
    selle.position.set(-0.36, 0.99, 0);
    caisse.add(selle);
    caisse.add(boite(0.18, 0.05, 0.18, M.siege, -0.72, 1.08, 0));
    const bouchon = cylindre(0.035, 0.012, M.chrome, 16);
    bouchon.position.set(0.12, 1.125, 0);
    caisse.add(bouchon);
    // les phares en amande (moulés dans le nez), les clignotants, les décorations, le feu arrière
    for (const cote of [-1, 1]) {
      const oeil = boite(0.14, 0.035, 0.06, M.led, 0.96, 0.84, cote * 0.07);
      oeil.rotation.set(cote * 0.5, cote * 0.3, -0.5);
      caisse.add(oeil);
      caisse.add(boite(0.04, 0.025, 0.06, M.orange, 0.78, 0.8, cote * 0.21));
      caisse.add(boite(0.5, 0.05, 0.01, noir, 0.58, 0.68, cote * 0.195));
      caisse.add(boite(0.36, 0.025, 0.01, blanc, 0.56, 0.75, cote * 0.195));
      const ninja = etiquette("NINJA", "rgba(0,0,0,0)", "#ffffff", 0.22, 0.06);
      ninja.rotation.y = cote > 0 ? 0 : Math.PI;
      ninja.position.set(-0.6, 1.0, cote * 0.105);
      caisse.add(ninja);
    }
    caisse.add(boite(0.03, 0.04, 0.12, M.feuLed, -1.02, 1.1, 0));
    caisse.add(boite(0.12, 0.08, 0.18, M.noir, -0.98, 0.95, 0)); // le support de plaque
    const plaqueMoto = etiquette("MX-650", "#f4f4f2", "#111", 0.17, 0.1);
    plaqueMoto.rotation.y = -Math.PI / 2;
    plaqueMoto.position.set(-1.045, 0.93, 0);
    caisse.add(plaqueMoto);
    // le moteur bicylindre (les cylindres penchés en avant, avec leurs ailettes), le carter, le radiateur
    caisse.add(boite(0.42, 0.24, 0.3, M.noir, 0.02, 0.44, 0));
    for (let i = 0; i < 6; i++) {
      const ailette = boite(0.26, 0.012, 0.28, inoxBrosse(), 0.18, 0.6 + i * 0.03, 0);
      ailette.rotation.z = -0.4;
      caisse.add(ailette);
    }
    caisse.add(boite(0.06, 0.32, 0.36, nidAbeille(), 0.42, 0.62, 0));
    for (const cote of [-1, 1]) {
      const carter = cylindre(0.1, 0.03, inoxBrosse(), 20);
      carter.rotation.x = Math.PI / 2;
      carter.position.set(-0.05, 0.45, cote * 0.16);
      caisse.add(carter);
    }
    // le cadre en tubes, le pot d'échappement court, la chaîne, les repose-pieds
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.62, 0.98, cote * 0.1], [-0.2, 0.72, cote * 0.13], 0.03, inoxBrosse()));
      caisse.add(tube([-0.2, 0.72, cote * 0.13], [-0.2, 0.4, cote * 0.13], 0.025, inoxBrosse()));
      caisse.add(tube([-0.3, 0.42, cote * 0.12], [-0.3, 0.42, cote * 0.22], 0.015, M.chrome));
    }
    caisse.add(tube([0.25, 0.42, 0.1], [-0.2, 0.25, 0.16], 0.035, inoxBrosse()));
    const pot = cylindre(0.075, 0.32, noir, 14);
    pot.rotation.z = Math.PI / 2 - 0.05;
    pot.position.set(-0.35, 0.26, 0.18);
    caisse.add(pot);
    caisse.add(tube([-0.86, 0.31, -0.1], [0.05, 0.38, -0.1], 0.012, M.noir));
    // la fourche, le bras oscillant, l'amortisseur arrière, les guidons, les rétros
    for (const z of [-0.08, 0.08]) {
      g.add(tube([0.86, 0.31, z], [0.75, 0.62, z], 0.035, M.chrome));
      caisse.add(tube([0.75, 0.62, z], [0.66, 1.0, z], 0.04, M.chrome));
    }
    for (const z of [-0.11, 0.11]) g.add(tube([-0.86, 0.31, z], [-0.05, 0.48, z], 0.03, inoxBrosse()));
    caisse.add(tube([-0.3, 0.5, 0], [-0.18, 0.85, 0], 0.03, peinture([0.9, 0.5, 0.05])));
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.64, 1.0, cote * 0.08], [0.6, 0.98, cote * 0.24], 0.016, M.noir));
      caisse.add(tube([0.83, 1.02, cote * 0.18], [0.82, 1.1, cote * 0.26], 0.008, M.noir));
      caisse.add(boite(0.05, 0.05, 0.09, noir, 0.81, 1.12, cote * 0.28));
    }
    // le pilote, couché sur le réservoir : combinaison de cuir noire avec le haut vert, casque vert avec sa visière
    const cuir = new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.45, metalness: 0.1 });
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.34, 4, 12), vert);
    buste.position.set(-0.08, 1.3, 0);
    buste.rotation.z = 1.05;
    buste.scale.set(0.85, 1, 1.15);
    caisse.add(buste);
    caisse.add(tube([-0.32, 1.12, 0], [-0.4, 1.06, 0], 0.13, cuir)); // le bassin
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), vert);
    casque.position.set(0.24, 1.42, 0);
    casque.scale.set(1.15, 1, 1);
    caisse.add(casque);
    const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.152, 18, 8, -0.9, 1.8, 1.0, 0.8), M.vitreFumee);
    visiere.scale.set(1.15, 1, 1);
    visiere.rotation.y = Math.PI / 2;
    visiere.position.copy(casque.position);
    caisse.add(visiere);
    for (const cote of [-1, 1]) {
      // les bras vers les guidons, les cuisses le long du réservoir, les tibias vers les repose-pieds
      caisse.add(tube([0.06, 1.34, cote * 0.18], [0.32, 1.1, cote * 0.24], 0.045, cuir));
      caisse.add(tube([0.32, 1.1, cote * 0.24], [0.6, 1.0, cote * 0.24], 0.04, cuir));
      const gant = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), noir);
      gant.position.set(0.6, 1.0, cote * 0.24);
      caisse.add(gant);
      caisse.add(tube([-0.36, 1.06, cote * 0.12], [0.0, 0.9, cote * 0.2], 0.07, cuir));
      caisse.add(tube([0.0, 0.9, cote * 0.2], [-0.28, 0.48, cote * 0.22], 0.055, cuir));
      caisse.add(boite(0.2, 0.08, 0.08, M.noir, -0.24, 0.45, cote * 0.22)); // la botte
    }
    // les roues : 17 pouces, 3 branches, 2 disques devant
    const roues = [];
    for (const [x, avant, l] of [[0.86, true, 0.12], [-0.86, false, 0.18]]) {
      const w = Circuit.Roues.fabriquer({ rayon: 0.31, largeur: l, jante: 0.22, style: "moto", metal: noir, etrier: avant ? [0.75, 0.08, 0.08] : [0.2, 0.2, 0.22], cote: 1 });
      w.pivot.position.set(x, 0.31, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant }));
    }
    // les garde-boue : devant (sur la fourche) et derrière (sous la coque)
    const gb = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 6, 16, Math.PI * 0.6), noir);
    gb.rotation.z = Math.PI * 0.2;
    gb.scale.set(1, 1, 1.4);
    gb.position.set(0.86, 0.31, 0);
    g.add(gb);
    return voiture(g, caisse, roues, 1.5);
  }

  Circuit.Modeles.ajouter({ classique, citadine, taxi, police, suv, chiron, porsche911, aventador, basse, camionnette, quatre, pickup, rallye, camion, monster, kart, f1, buggy, quad, moto });
  return {};
})();
