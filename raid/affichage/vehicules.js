// 🏜️ LES VÉHICULES : le carrossier du désert (étape 54, refaits à l'étape 70)
//
// ✍️ Iron Wolf Studio veut « des véhicules vraiment très réalistes » : des 4x4 de rallye-raid, des buggys, des motos de rallye
// et un camion, comme au Dakar. Chacun est construit avec ses VRAIES mesures (longueur, largeur, hauteur, empattement,
// taille des roues).
//
// Étape 70 : ✍️ « Améliore toutes les voitures pour qu'elles soient plus réalistes. » Alors chaque véhicule est redessiné
// à la main, avec les outils de l'atelier (affichage/atelier.js) :
//   - la FORME : une seule peau (le capot, le pare-brise, le toit et l'arrière d'un seul morceau), une épaule sous les
//     vitres, des ailes bombées au-dessus des roues et des élargisseurs en plastique noir ;
//   - les DÉTAILS : les phares moulés dans le nez, la calandre, l'emblème de la marque, la prise d'air sur le toit, la
//     rampe de phares, les rétroviseurs, les essuie-glaces, la plaque de protection, les bavettes, les antennes, le
//     panneau de course sur les portières, les autocollants des sponsors…
//   - les ROUES : des pneus de désert à gros crampons sur des jantes « beadlock » (avec leur anneau boulonné), et des
//     roues à rayons pour les motos ;
//   - l'INTÉRIEUR : le tableau de bord du rallye (l'écran, le road-book), les baquets avec leurs harnais, le volant,
//     l'arceau, et l'ÉQUIPAGE en casque (le pilote et le copilote) qu'on voit à travers les vitres.
//
// Tout ce qui est posé sur les ressorts (la carrosserie…) est rangé dans la CAISSE ; les roues restent par terre.
// Tous les véhicules sont construits « nez vers x+ », posés au sol (y = 0), centrés en x = 0 et z = 0.

window.Raid = window.Raid || {};

Raid.Vehicules = (function () {
  const { M, peinture } = Raid.Materiaux;
  const A = Raid.Atelier;
  const { boite, cylindre, tube, arceau, tuyau, T, peau, vitresUnies, surLeDessus, plat, auBout, pieceFlanc, pieceDessus, pharePose, bande } = A;
  const { traitFlanc, portiere, elargisseur, optiqueAuBout, phareRond, phareAdditionnel, barreLed, emblemeAuBout, lettres, panneauCourse } = A;
  const { sponsors, grillage, essuieGlaces, retro, roueSecours, bavette, habitacle, equipier, baquet, volantCourse } = A;
  const hexa = (k) => "#" + k.map((q) => Math.round(q * 255).toString(16).padStart(2, "0")).join(""); // (la couleur, écrite pour une toile)

  // ---------------------------------------------------------------- les outils propres au rallye
  // Les 4 roues : des pneus de désert à crampons, sur des jantes beadlock.
  function quatreRoues(g, Rs, voie, options) {
    const roues = [];
    for (const r of Rs) {
      for (const cote of [-1, 1]) {
        const w = Raid.Roues.fabriquer(Object.assign({ pneu: "crampons", style: "beadlock", metal: M.jante }, options, { rayon: r.r, largeur: r.l, jante: r.j, cote }));
        w.pivot.position.set(r.x, r.r, cote * voie);
        g.add(w.pivot);
        roues.push(Object.assign(w, { avant: r.x > 0 }));
      }
    }
    return roues;
  }
  // Le PANNEAU DE COURSE sur les deux portières (le numéro), et la bande de sponsors juste dessous.
  function decoCourse(caisse, c, x0, x1, y0, y1, numero, mots, couleurs) {
    pieceFlanc(caisse, c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], panneauCourse(numero), 0.012, true);
    if (mots) pieceFlanc(caisse, c, [[x0 - 0.2, y0 - 0.16], [x1 + 0.2, y0 - 0.16], [x1 + 0.2, y0 - 0.03], [x0 - 0.2, y0 - 0.03]], sponsors(mots, couleurs), 0.012, true);
  }
  // Une antenne (les balises de sécurité du rallye : le GPS, l'Iritrack…), plantée en (x, y, z).
  function antenne(caisse, x, y, z, haut) {
    caisse.add(cylindre(0.025, 0.03, M.noir, 10).translateX(x).translateY(y + 0.015).translateZ(z));
    caisse.add(tube([x, y, z], [x - 0.05, y + haut, z], 0.006, M.noir));
  }
  // Une PRISE D'AIR de toit : une écope peinte, ouverte devant (le trou noir et sa grille).
  function ecope(caisse, x, y, long, large, haut, mat) {
    const forme = new THREE.Shape();
    forme.moveTo(-long / 2, 0);
    forme.lineTo(long / 2, 0);
    forme.lineTo(long / 2 - 0.04, haut);
    forme.quadraticCurveTo(0, haut + 0.02, -long / 2, 0.01);
    const geo = new THREE.ExtrudeGeometry(forme, { depth: large, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
    geo.translate(0, 0, -large / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, 0);
    m.castShadow = true;
    caisse.add(m);
    caisse.add(boite(0.02, haut * 0.75, large - 0.04, grillage(), x + long / 2 - 0.02 + 0.012, y + haut * 0.45, 0));
  }
  // Les 2 crochets de remorquage rouges (pour se faire tirer quand on est planté dans le sable).
  function crochets(caisse, x, y, z, sens) {
    const rouge = peinture([0.85, 0.08, 0.08]);
    for (const cote of [-1, 1]) {
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.014, 6, 14), rouge);
      anneau.rotation.x = Math.PI / 2;
      anneau.position.set(x + sens * 0.04, y, cote * z);
      caisse.add(anneau);
    }
  }
  // Les plaques de protection sous le nez (en alu brossé), penchées pour glisser sur les cailloux.
  function sabot(caisse, x, y, long, large, pente) {
    const s = boite(long, 0.03, large, M.sabot, x, y, 0);
    s.rotation.z = pente || 0.35;
    caisse.add(s);
  }
  const fin = (g, caisse, roues, famille, hauteur) => ({ g, caisse, roues, famille, hauteur });

  // ---------------------------------------------------------------- 🇯🇵 Toyota GR DKR Hilux T1+ (4,8 m × 2,3 m × 1,9 m)
  // Le pick-up du Dakar : un long capot, la cabine à 2 places (étroite, avec les vitres penchées), la benne fermée où
  // sont rangées ✍️ les 3 roues de secours debout, des ailes énormes pour les pneus de 94 cm, la grande calandre noire,
  // les phares fins, la prise d'air sur le toit, l'échappement qui sort sur le côté devant la roue arrière.
  function hilux(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const Rs = [{ x: 1.5, r: 0.47, l: 0.32, j: 0.23 }, { x: -1.5, r: 0.47, l: 0.32, j: 0.23 }], voie = 0.97;
    const blanc = peinture(k1), rouge = peinture(k2), noir = peinture(k3);
    const c = peau(caisse, [
      T(-2.42, 0.66, 1.04, 1.08, 1.0, 0.99, 0.86, { rt: 0.06, de: 0 }),
      T(-2.34, 0.55, 1.14, 1.17, 1.05, 1.03, 0.9, { de: 0.01 }),
      T(-1.5, 0.5, 1.18, 1.2, 1.06, 1.04, 0.92, { de: 0.01 }),
      T(-1.0, 0.48, 1.19, 1.21, 1.06, 1.04, 0.92, { de: 0.01 }),
      T(-0.66, 0.46, 1.2, 1.22, 1.06, 1.04, 0.92, { de: 0.01 }),
      T(-0.6, 0.46, 1.2, 1.74, 1.06, 0.99, 0.74, { rt: 0.08 }),
      T(-0.5, 0.46, 1.2, 1.84, 1.06, 0.99, 0.76, { rt: 0.1 }),
      T(0.05, 0.46, 1.2, 1.86, 1.06, 0.99, 0.77, { rt: 0.1 }),
      T(0.3, 0.46, 1.2, 1.8, 1.06, 0.99, 0.78, { rt: 0.1 }),
      T(0.95, 0.46, 1.2, 1.25, 1.06, 0.99, 0.8, { rt: 0.06 }),
      T(1.05, 0.47, 1.19, 1.22, 1.07, 1.0, 0.84, { de: 0.01 }),
      T(1.5, 0.5, 1.16, 1.19, 1.08, 1.02, 0.86, { de: 0.01 }),
      T(2.1, 0.56, 1.07, 1.1, 1.04, 1.0, 0.82, { de: 0.01 }),
      T(2.32, 0.62, 0.97, 1.0, 0.98, 0.95, 0.78, { de: 0.01 }),
      T(2.42, 0.72, 0.87, 0.88, 0.9, 0.88, 0.72, { de: 0 }),
    ], Rs, voie, blanc, vitresUnies({ pareBrise: [0.3, 0.95], cotes: [-0.56, 0.9], montants: [0.08], lunette: [-0.66, -0.58], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.93, xS: 0.2, sol: 0.5, hS: 0.84, w: 0.86, tdb: 1.28, toit: (x) => c.tranche(x).yt, equipage: [k2, k1], copilote: [k3, k2] });
    // la déco GR : le bas des flancs noir, une large bande rouge en biais, le capot avec ses bandes, le numéro
    pieceFlanc(caisse, c, [[-2.38, 0.52], [2.38, 0.6], [2.38, 0.74], [-2.38, 0.7]], noir, 0.006);
    pieceFlanc(caisse, c, [[-2.3, 0.7], [0.3, 0.72], [-0.3, 1.0], [-2.3, 1.0]], rouge, 0.007);
    pieceFlanc(caisse, c, [[0.3, 0.72], [2.36, 0.74], [2.3, 0.84], [0.0, 0.84]], rouge, 0.007);
    pieceDessus(caisse, c, [[1.08, 0.1], [2.3, 0.1], [2.3, 0.3], [1.08, 0.3]], rouge, 0.004);
    pieceDessus(caisse, c, [[1.08, 0.33], [2.3, 0.33], [2.3, 0.38], [1.08, 0.38]], noir, 0.004);
    decoCourse(caisse, c, 0.05, 0.75, 0.84, 1.12, numero, ["GAZOO", "DAKAR", "TOYO", "SHELL"], ["#111111", "#ffffff", "#d01818", "#ffcc00"]);
    // la face : la grande calandre noire (avec l'emblème Toyota et GR), les phares fins, le pare-chocs, le sabot
    auBout(caisse, c, true, 0.78, 0, 0.26, 1.2, M.trou, 0.02);
    auBout(caisse, c, true, 0.78, 0, 0.22, 1.12, grillage(), 0.035);
    emblemeAuBout(caisse, c, "toyota", true, 0.8, 0.2, 0.14, 0, 0.04);
    for (const cote of [-1, 1]) {
      pharePose(caisse, c, [[2.22, 0.52], [2.38, 0.56], [2.36, 0.86], [2.2, 0.9]], [bande(2.25, 0.58, 2.24, 0.86, 0.025), bande(2.3, 0.6, 2.36, 0.62, 0.03)]);
      auBout(caisse, c, true, 0.6, cote * 0.72, 0.08, 0.22, M.led, 0.04); // les feux de jour
    }
    auBout(caisse, c, true, 0.58, 0, 0.2, 1.8, M.plastique, 0.1);
    emblemeAuBout(caisse, c, "gr", true, 0.58, 0.14, 0.14, 0.4, 0.1);
    sabot(caisse, 2.38, 0.42, 0.55, 1.3, 0.45);
    crochets(caisse, c.xMax + 0.1, 0.52, 0.55, 1);
    // les ailes : les élargisseurs noirs, les ouïes sur les ailes avant (pour sortir l'air chaud des freins)
    for (const r of Rs) elargisseur(caisse, c, r, 0.06, 0.06);
    for (let i = 0; i < 5; i++) pieceDessus(caisse, c, bande(1.25 + i * 0.09, 0.82, 1.35 + i * 0.09, 0.98, 0.03), M.trou, 0.006);
    // les flancs : les portes, les rétroviseurs, les marchepieds tubulaires, l'échappement qui sort sur le côté
    portiere(caisse, c, 0.92, -0.55, 0.62, 1.2, M.noir);
    retro(caisse, 0.85, 1.32, 1.0, blanc, 1.1);
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.95, 0.5, cote * 1.04], [-0.95, 0.5, cote * 1.04], 0.045, M.noir));
      const pot = cylindre(0.055, 0.25, M.chrome, 14);
      pot.rotation.x = Math.PI / 2;
      pot.position.set(-0.85, 0.52, cote * 1.12);
      caisse.add(pot);
    }
    essuieGlaces(caisse, c, 0.95, 0.6);
    // le toit : la grande prise d'air (elle donne de l'air frais au moteur, loin de la poussière), la rampe de LED, les antennes
    ecope(caisse, 0.05, 1.85, 0.75, 0.42, 0.18, blanc);
    barreLed(caisse, 0.38, 1.87, 0, 1.0, 0.06);
    antenne(caisse, -0.35, 1.86, 0.45, 0.45);
    antenne(caisse, -0.4, 1.86, -0.45, 0.3);
    // la benne : ✍️ les 3 roues de secours debout (comme sur l'image du Dakar !), sanglées, et l'arceau en X derrière la cabine
    arceau(caisse, [[-0.7, 1.22, -0.92], [-0.72, 1.92, -0.72], [-0.72, 1.92, 0.72], [-0.7, 1.22, 0.92]], 0.035, M.tube);
    caisse.add(tube([-0.7, 1.24, -0.88], [-0.72, 1.9, 0.7], 0.03, M.tube));
    for (const z of [-0.6, 0, 0.6]) {
      const s = roueSecours(0.47, 0.32, 0.23);
      s.rotation.y = Math.PI / 2;
      s.position.set(-1.45, 1.27, z);
      caisse.add(s);
      caisse.add(boite(0.03, 0.02, 0.36, peinture([0.95, 0.75, 0.1], true), -1.45, 1.75, z)); // la sangle
    }
    // l'arrière : les feux, le pare-chocs, les bavettes
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.88, cote * 0.84, 0.34, 0.14, [[0.1, 0, 0.1, 0.08], [-0.02, 0, 0.1, 0.08], [-0.13, 0, 0.05, 0.08]], "feu");
    auBout(caisse, c, false, 0.66, 0, 0.18, 1.9, M.plastique, 0.1);
    lettres(caisse, c.xMin - 0.012, 0.92, 0, false, "TOYOTA", 0.9, 0.13, hexa(k3));
    lettres(caisse, c.xMin - 0.012, 0.78, 0, false, "GAZOO RACING", 0.7, 0.07, hexa(k2));
    for (const y of [1.1, 0.82]) caisse.add(boite(0.01, 0.008, 1.6, M.noir, c.xMin - 0.004, y, 0)); // les bords du hayon
    crochets(caisse, c.xMin - 0.1, 0.62, 0.55, -1);
    for (const x of [1.02, -2.02]) for (const s of [-1, 1]) bavette(caisse, x, 0.5, s * voie, 0.34, 0.36);
    const roues = quatreRoues(g, Rs, voie, { etrier: [0.82, 0.07, 0.1] });
    return fin(g, caisse, roues, "4x4", 1.95);
  }


  // Un AILERON de requin (la grande dérive sur le dos des buggys : elle les garde droits pendant les sauts).
  function aileron(caisse, c, x0, x1, haut, mat) {
    const forme = new THREE.Shape();
    const y0 = c.dessus(x0, 0), y1 = c.dessus(x1, 0);
    forme.moveTo(x1, y1 - 0.02);
    forme.lineTo(x0, y0 - 0.02);
    forme.lineTo(x0 - 0.12, y0 + haut);
    forme.quadraticCurveTo(x0 + (x1 - x0) * 0.35, y0 + haut * 0.9, x1, y1 + 0.03);
    const geo = new THREE.ExtrudeGeometry(forme, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1 });
    geo.translate(0, 0, -0.01);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    caisse.add(m);
  }

  // ---------------------------------------------------------------- 🇫🇷 Peugeot 3008 DKR Maxi (4,3 m × 2,4 m × 1,9 m)
  // Un « buggy » à 2 roues motrices déguisé en 3008 : des porte-à-faux tout courts, des roues immenses, une cabine étroite
  // posée entre de larges ailes, le capot creusé entre les ailes, la calandre Peugeot en damier avec le lion, les
  // « crocs » de lumière, la grande prise d'air sur le toit et la dérive sur le dos.
  function dkr(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const Rs = [{ x: 1.45, r: 0.47, l: 0.33, j: 0.24 }, { x: -1.45, r: 0.47, l: 0.33, j: 0.24 }], voie = 1.03;
    const blanc = peinture(k1), bleu = peinture(k2), noir = peinture(k3);
    const c = peau(caisse, [
      T(-2.18, 0.68, 0.98, 1.0, 1.0, 0.9, 0.7, { rt: 0.1, de: 0.02 }),
      T(-2.08, 0.55, 1.12, 1.16, 1.12, 0.86, 0.62, { de: 0.04 }),
      T(-1.45, 0.5, 1.2, 1.36, 1.18, 0.86, 0.6, { de: 0.05 }),
      T(-0.8, 0.45, 1.13, 1.66, 1.12, 0.84, 0.6, { de: 0.06 }),
      T(-0.35, 0.45, 1.1, 1.82, 1.1, 0.84, 0.62, { de: 0.06, rt: 0.12 }),
      T(0.05, 0.45, 1.1, 1.8, 1.1, 0.84, 0.62, { de: 0.06, rt: 0.12 }),
      T(0.62, 0.47, 1.12, 1.2, 1.14, 0.86, 0.66, { de: 0.04 }),
      T(1.0, 0.48, 1.16, 1.12, 1.17, 0.95, 0.7, { de: 0.01 }),
      T(1.45, 0.5, 1.18, 1.08, 1.2, 0.98, 0.72, { de: 0 }),
      T(1.95, 0.55, 1.0, 0.94, 1.12, 0.92, 0.7, { de: 0 }),
      T(2.18, 0.7, 0.82, 0.8, 0.95, 0.85, 0.65, { de: 0 }),
    ], Rs, voie, blanc, vitresUnies({ pareBrise: [0.08, 0.62], cotes: [-0.7, 0.55], montants: [-0.25], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.6, xS: -0.08, sol: 0.48, hS: 0.8, w: 0.78, tdb: 1.2, toit: (x) => c.tranche(x).yt, equipage: [k2, k1], copilote: [k2, k3] });
    // la déco : le grand trait bleu en biais sur les flancs, le dos noir, le capot bleu et le numéro
    pieceFlanc(caisse, c, [[-2.1, 0.55], [1.2, 0.55], [2.0, 0.85], [-2.0, 0.85]], bleu, 0.006);
    pieceFlanc(caisse, c, [[-2.1, 0.5], [2.1, 0.55], [2.1, 0.6], [-2.1, 0.56]], noir, 0.007);
    pieceDessus(caisse, c, [[0.7, 0], [2.0, 0], [2.0, 0.42], [0.7, 0.5]], bleu, 0.004);
    pieceDessus(caisse, c, [[-2.0, 0], [-0.75, 0], [-0.75, 0.35], [-2.0, 0.42]], noir, 0.004);
    decoCourse(caisse, c, -0.62, 0.12, 0.8, 1.08, numero, ["TOTAL", "DAKAR", "BFG", "PEUGEOT"], ["#d01818", "#ffffff", "#111111", "#1d3f9a"]);
    // la face : la calandre en damier, le lion, les phares en biais sur le nez, les 3 « crocs » de LED de chaque côté
    auBout(caisse, c, true, 0.72, 0, 0.2, 1.1, M.trou, 0.02);
    auBout(caisse, c, true, 0.72, 0, 0.16, 1.04, grillage(), 0.03);
    emblemeAuBout(caisse, c, "peugeot", true, 0.74, 0.17, 0.17, 0, 0.04);
    for (const cote of [-1, 1]) {
      pharePose(caisse, c, [[1.9, 0.56], [2.12, 0.6], [2.1, 0.86], [1.86, 0.92]], [bande(1.94, 0.62, 2.07, 0.66, 0.02), bande(1.93, 0.7, 2.06, 0.74, 0.02), bande(1.92, 0.78, 2.05, 0.82, 0.02)]);
      for (let i = 0; i < 3; i++) pieceDessus(caisse, c, bande(2.06, 0.5 + i * 0.07, 2.16, 0.52 + i * 0.07, 0.022), M.led, 0.012, true); // les « crocs »
    }
    auBout(caisse, c, true, 0.56, 0, 0.12, 1.7, M.plastique, 0.08);
    sabot(caisse, 2.15, 0.45, 0.5, 1.3, 0.5);
    crochets(caisse, c.xMax + 0.08, 0.55, 0.45, 1);
    // les ailes : les ouïes qui sortent l'air des roues, les élargisseurs, la prise d'air du radiateur sur le flanc
    for (const r of Rs) elargisseur(caisse, c, r, 0.045, 0.05);
    for (const x0 of [1.2, -1.75]) for (let i = 0; i < 4; i++) pieceDessus(caisse, c, bande(x0 + i * 0.1, 0.95, x0 + i * 0.1 + 0.08, 1.1, 0.03), M.trou, 0.006);
    pieceFlanc(caisse, c, [[-0.95, 0.68], [-0.72, 0.68], [-0.72, 1.02], [-0.98, 0.98]], M.trou, 0.01);
    portiere(caisse, c, 0.56, -0.7, 0.6, 1.1, M.noir);
    retro(caisse, 0.52, 1.25, 0.88, noir, 1.05);
    essuieGlaces(caisse, c, 0.6, 0.55, [0]);
    for (const cote of [-1, 1]) {
      const pot = cylindre(0.05, 0.22, M.chrome, 14);
      pot.rotation.x = Math.PI / 2;
      pot.position.set(-0.98, 0.55, cote * 1.12);
      caisse.add(pot);
    }
    // le toit : la grande prise d'air, la dérive, les antennes
    ecope(caisse, -0.15, 1.8, 0.7, 0.4, 0.2, noir);
    aileron(caisse, c, -0.55, -1.9, 0.14, bleu);
    antenne(caisse, 0.05, 1.8, 0.4, 0.35);
    // l'arrière : la roue de secours couchée dans son logement, les feux « griffes », PEUGEOT
    const sec = roueSecours(0.45, 0.3, 0.22);
    sec.rotation.x = Math.PI / 2;
    sec.position.set(-1.62, 1.28, 0);
    caisse.add(sec);
    caisse.add(boite(0.05, 0.02, 1.0, noir, -1.62, 1.44, 0)); // la sangle
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.88, cote * 0.68, 0.18, 0.26, [[0.05, -0.06, 0.03, 0.12], [0, 0, 0.03, 0.12], [-0.05, 0.06, 0.03, 0.12]], "feu");
    lettres(caisse, c.xMin - 0.01, 0.82, 0, false, "PEUGEOT", 0.7, 0.09, "#e9ecef");
    auBout(caisse, c, false, 0.68, 0, 0.12, 1.6, M.plastique, 0.08);
    for (const x of [0.98, -1.98]) for (const s of [-1, 1]) bavette(caisse, x, 0.48, s * voie, 0.3, 0.36);
    const roues = quatreRoues(g, Rs, voie, { etrier: [0.1, 0.25, 0.7] });
    return fin(g, caisse, roues, "4x4", 1.95);
  }

  // ---------------------------------------------------------------- 🇬🇧 Mini JCW Buggy (4,4 m × 2,3 m × 1,95 m)
  // Le buggy X-raid, déguisé en Mini : les PHARES RONDS cerclés de chrome posés sur le nez, la calandre hexagonale avec
  // sa barre rouge, la prise d'air sur le capot, ✍️ le toit blanc (la signature des Mini) avec son écope et sa dérive, et
  // les feux arrière en Union Jack.
  function buggy(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const Rs = [{ x: 1.55, r: 0.48, l: 0.34, j: 0.24 }, { x: -1.55, r: 0.48, l: 0.34, j: 0.24 }], voie = 1.0;
    const bleu = peinture(k1), blanc = peinture(k2), rouge = peinture(k3);
    const c = peau(caisse, [
      T(-2.22, 0.7, 1.0, 1.03, 0.95, 0.9, 0.72, { rt: 0.1, de: 0.01 }),
      T(-2.1, 0.56, 1.16, 1.2, 1.1, 0.88, 0.66, { de: 0.03 }),
      T(-1.55, 0.52, 1.22, 1.32, 1.16, 0.86, 0.62, { de: 0.04 }),
      T(-1.05, 0.48, 1.14, 1.55, 1.08, 0.84, 0.64, { de: 0.05 }),
      T(-0.85, 0.48, 1.12, 1.84, 1.06, 0.84, 0.66, { de: 0.05, rt: 0.1 }),
      T(0.1, 0.48, 1.12, 1.9, 1.06, 0.84, 0.68, { de: 0.05, rt: 0.1 }),
      T(0.4, 0.48, 1.12, 1.82, 1.06, 0.84, 0.69, { de: 0.05, rt: 0.1 }),
      T(0.85, 0.5, 1.14, 1.22, 1.08, 0.86, 0.7, { de: 0.03 }),
      T(1.2, 0.52, 1.18, 1.16, 1.12, 0.96, 0.74, { de: 0.01 }),
      T(1.55, 0.55, 1.2, 1.12, 1.16, 1.0, 0.76, { de: 0 }),
      T(2.0, 0.6, 1.06, 1.02, 1.08, 0.96, 0.74, { de: 0 }),
      T(2.22, 0.72, 0.9, 0.88, 0.92, 0.86, 0.68, { de: 0 }),
    ], Rs, voie, bleu, vitresUnies({ pareBrise: [0.42, 0.85], cotes: [-1.0, 0.8], montants: [-0.25], lunette: [-1.06, -0.86], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.82, xS: 0.1, sol: 0.5, hS: 0.84, w: 0.8, tdb: 1.24, toit: (x) => c.tranche(x).yt, equipage: [k3, k2], copilote: [k3, k1] });
    // ✍️ le toit blanc et ses montants noirs (le toit a l'air de flotter), la prise d'air et la dérive
    pieceDessus(caisse, c, [[-0.9, 0], [0.42, 0], [0.42, 0.7], [-0.9, 0.7]], blanc, 0.005);
    ecope(caisse, -0.25, 1.9, 0.55, 0.36, 0.18, blanc);
    aileron(caisse, c, -0.95, -1.95, 0.13, blanc);
    antenne(caisse, 0.25, 1.9, 0.45, 0.35);
    // la déco : les bandes rouges, le numéro, le capot avec sa prise d'air et ses deux bandes blanches
    pieceFlanc(caisse, c, [[-2.15, 0.58], [2.15, 0.62], [2.15, 0.7], [-2.15, 0.66]], rouge, 0.006);
    pieceDessus(caisse, c, [[0.9, 0.12], [2.05, 0.12], [2.05, 0.22], [0.9, 0.22]], blanc, 0.004);
    decoCourse(caisse, c, -0.6, 0.1, 0.84, 1.1, numero, ["MINI", "X-RAID", "BFG", "DAKAR"], ["#111111", "#ffffff", "#d01818", "#ffcc00"]);
    ecope(caisse, 1.45, c.dessus(1.45, 0) - 0.03, 0.4, 0.34, 0.08, bleu);
    // la face Mini : les phares ronds cerclés de chrome sur le nez, la calandre hexagonale et sa barre rouge
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.13, M.chrome);
      surLeDessus(ph, c, 2.0, cote * 0.68, 0.02);
      ph.rotateZ(-0.9);
      caisse.add(ph);
      auBout(caisse, c, true, 0.6, cote * 0.68, 0.06, 0.14, M.led, 0.05); // les antibrouillards
    }
    const hexagone = new THREE.Shape();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6, p = [Math.cos(a) * 0.5, Math.sin(a) * 0.2];
      if (k === 0) hexagone.moveTo(...p);
      else hexagone.lineTo(...p);
    }
    const calandre = new THREE.Mesh(new THREE.ShapeGeometry(hexagone), grillage());
    calandre.rotation.y = Math.PI / 2;
    calandre.position.set(c.xMax + 0.012, 0.74, 0);
    caisse.add(calandre);
    caisse.add(boite(0.03, 0.035, 0.9, rouge, c.xMax + 0.02, 0.78, 0));
    emblemeAuBout(caisse, c, "mini", true, 0.86, 0.26, 0.13, 0, 0.004);
    auBout(caisse, c, true, 0.56, 0, 0.12, 1.6, M.plastique, 0.08);
    sabot(caisse, 2.18, 0.46, 0.45, 1.2, 0.5);
    crochets(caisse, c.xMax + 0.08, 0.56, 0.45, 1);
    // les flancs et les ailes
    for (const r of Rs) elargisseur(caisse, c, r, 0.05, 0.05);
    for (const x0 of [1.25, -1.85]) for (let i = 0; i < 4; i++) pieceDessus(caisse, c, bande(x0 + i * 0.1, 0.95, x0 + i * 0.1 + 0.08, 1.08, 0.03), M.trou, 0.006);
    portiere(caisse, c, 0.8, -0.95, 0.62, 1.12, M.noir);
    retro(caisse, 0.76, 1.28, 0.88, blanc, 1.05);
    essuieGlaces(caisse, c, 0.84, 0.55, [0]);
    for (const cote of [-1, 1]) {
      const pot = cylindre(0.05, 0.22, M.chrome, 14);
      pot.rotation.x = Math.PI / 2;
      pot.position.set(-1.05, 0.56, cote * 1.1);
      caisse.add(pot);
    }
    // les grands amortisseurs (on les voit derrière les roues : le buggy a 25 cm de débattement)
    for (const x of [1.55, -1.55]) for (const s of [-1, 1]) g.add(tube([x, 0.48, s * 0.72], [x - 0.15, 1.1, s * 0.6], 0.05, rouge));
    // l'arrière : les feux en Union Jack, la roue de secours dans son logement, MINI
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.92, cote * 0.66, 0.2, 0.2, [[0, 0, 0.18, 0.03], [0, 0, 0.03, 0.18], [0, 0, 0.2, 0.012], [0, 0, 0.012, 0.2]], "feu");
    const sec = roueSecours(0.46, 0.32, 0.22);
    sec.rotation.x = Math.PI / 2;
    sec.position.set(-1.68, 1.26, 0);
    caisse.add(sec);
    caisse.add(boite(0.05, 0.02, 1.0, rouge, -1.68, 1.43, 0)); // la sangle
    lettres(caisse, c.xMin - 0.01, 0.84, 0, false, "MINI", 0.4, 0.1, "#e9ecef");
    auBout(caisse, c, false, 0.7, 0, 0.12, 1.6, M.plastique, 0.08);
    for (const x of [1.0, -2.1]) for (const s of [-1, 1]) bavette(caisse, x, 0.5, s * voie, 0.32, 0.38);
    const roues = quatreRoues(g, Rs, voie, { etrier: [0.8, 0.1, 0.12] });
    return fin(g, caisse, roues, "buggy", 2.0);
  }


  // Un emblème (ou un nom) collé sur les deux flancs, qui se lit de dehors.
  function emblemeFlanc(caisse, c, nom, x, y, l, h, decale) {
    for (const cote of [-1, 1]) {
      const e = A.embleme(nom, l, h);
      e.rotation.y = cote > 0 ? 0 : Math.PI;
      e.position.set(x, y, cote * (A.flancIci(c, x, y) + (decale || 0.014)));
      caisse.add(e);
    }
  }
  // Un RESSORT (un tube en hélice), de a vers b : il habille un amortisseur.
  function ressort(groupe, a, b, rayon, spires, materiau) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), axe = vb.clone().sub(va), l = axe.length();
    const pts = [];
    for (let k = 0; k <= spires * 12; k++) {
      const t = k / (spires * 12), an = t * spires * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(an) * rayon, t * l, Math.sin(an) * rayon));
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), spires * 12, rayon * 0.16, 5, false), materiau);
    m.position.copy(va);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axe.normalize());
    groupe.add(m);
  }
  // Un COMBINÉ amortisseur : le corps (avec sa bonbonne), la tige chromée et le ressort autour.
  function amortisseur(groupe, a, b, rayon, couleurRessort) {
    const milieu = a.map((q, i) => q + (b[i] - q) * 0.55);
    groupe.add(tube(a, milieu, rayon * 0.5, M.chrome));
    groupe.add(tube(milieu, b, rayon * 0.75, M.noir));
    ressort(groupe, a.map((q, i) => q + (b[i] - q) * 0.12), a.map((q, i) => q + (b[i] - q) * 0.85), rayon * 1.25, 6, couleurRessort);
  }
  // Un garde-boue de buggy : un morceau de cylindre au-dessus de la roue (r = rayon de la roue).
  // (les angles partent du BAS de la roue et tournent vers l'avant : 0,5 π = devant, π = en haut, 1,5 π = derrière)
  function gardeBoue(groupe, x, z, r, large, mat, debut, longueur) {
    const geo = new THREE.CylinderGeometry(r + 0.07, r + 0.07, large, 24, 1, true, debut, longueur);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.material.side = THREE.DoubleSide;
    m.position.set(x, r, z);
    m.castShadow = true;
    groupe.add(m);
  }

  // ---------------------------------------------------------------- 🇨🇦 Can-Am Maverick X3, un SSV (3,4 m × 1,9 m × 1,7 m)
  // Le « side-by-side » : une coque basse et étroite (on est assis presque par terre), ouverte, avec une CAGE de tubes
  // et un toit ; les roues sont loin dehors, au bout de longs triangles de suspension, avec d'énormes combinés
  // amortisseurs ; les phares « yeux méchants » sur le nez, le moteur derrière les sièges et la galerie au-dessus.
  function ssv(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const Rs = [{ x: 1.3, r: 0.41, l: 0.27, j: 0.19 }, { x: -1.3, r: 0.41, l: 0.27, j: 0.19 }], voie = 0.84;
    const jaune = peinture(k1), noir = peinture(k2), gris = peinture(k3, true);
    const matGarde = new THREE.MeshPhysicalMaterial({ color: jaune.color, metalness: jaune.metalness, roughness: jaune.roughness, clearcoat: 1, side: THREE.DoubleSide });
    // la coque : un « bateau » creusé au milieu (le poste de pilotage), avec le capot devant et le moteur derrière
    const c = peau(caisse, [
      T(-1.7, 0.55, 0.92, 0.95, 0.6, 0.58, 0.45, { de: 0.01, rt: 0.06 }),
      T(-1.55, 0.48, 1.0, 1.04, 0.68, 0.66, 0.52, { rt: 0.06 }),
      T(-0.95, 0.42, 1.0, 1.05, 0.7, 0.68, 0.55, { rt: 0.06 }),
      T(-0.78, 0.38, 0.95, 0.98, 0.72, 0.68, 0.55, { rt: 0.04 }),
      T(-0.7, 0.36, 0.92, 0.5, 0.72, 0.66, 0.5, { rt: 0.04 }),
      T(0.45, 0.36, 0.92, 0.5, 0.72, 0.66, 0.5, { rt: 0.04 }),
      T(0.55, 0.38, 0.93, 0.98, 0.72, 0.66, 0.52, { rt: 0.06 }),
      T(1.0, 0.42, 0.95, 0.98, 0.7, 0.64, 0.5, { rt: 0.08 }),
      T(1.45, 0.48, 0.84, 0.86, 0.62, 0.58, 0.45, { rt: 0.08 }),
      T(1.72, 0.55, 0.7, 0.7, 0.5, 0.48, 0.38, { rt: 0.08 }),
    ], Rs, voie, jaune, null, 0.02);
    // les garde-boue, au-dessus des roues (loin dehors)
    for (const r of Rs) for (const cote of [-1, 1]) gardeBoue(caisse, r.x, cote * voie, r.r, 0.36, matGarde, r.x > 0 ? Math.PI * 0.62 : Math.PI * 0.55, Math.PI * 0.85);
    // la déco : le bas noir, le numéro sur la portière, CAN-AM sur l'arrière
    pieceFlanc(caisse, c, [[-1.65, 0.48], [1.65, 0.55], [1.6, 0.62], [-1.65, 0.6]], noir, 0.006);
    decoCourse(caisse, c, -0.55, 0.12, 0.6, 0.86, numero);
    emblemeFlanc(caisse, c, "canam", -1.2, 0.78, 0.5, 0.5);
    // le nez : les phares « yeux méchants », la grille, les ouïes du capot, le pare-chocs tubulaire
    pharePose(caisse, c, [[1.45, 0.3], [1.66, 0.2], [1.66, 0.34], [1.44, 0.46]], [bande(1.47, 0.36, 1.64, 0.25, 0.02), bande(1.5, 0.43, 1.6, 0.36, 0.015)]);
    auBout(caisse, c, true, 0.62, 0, 0.12, 0.55, grillage(), 0.03);
    for (let i = 0; i < 4; i++) pieceDessus(caisse, c, bande(0.85 + i * 0.1, 0.2, 0.92 + i * 0.1, 0.42, 0.035), M.trou, 0.006);
    emblemeAuBout(caisse, c, "canam", true, 0.64, 0.3, 0.3, 0, 0.03);
    arceau(caisse, [[1.6, 0.5, -0.45], [1.85, 0.48, -0.35], [1.85, 0.48, 0.35], [1.6, 0.5, 0.45]], 0.03, M.tube);
    sabot(caisse, 1.6, 0.36, 0.45, 0.7, 0.45);
    // la CAGE : les montants du pare-brise, le toit, l'arceau derrière les sièges, les renforts vers l'arrière
    const t = M.tube;
    for (const cote of [-1, 1]) {
      arceau(caisse, [[0.62, 0.95, cote * 0.62], [0.2, 1.64, cote * 0.58], [-0.85, 1.64, cote * 0.58], [-0.92, 0.98, cote * 0.68]], 0.032, t);
      caisse.add(tube([-0.85, 1.6, cote * 0.58], [-1.55, 1.04, cote * 0.5], 0.028, t));
      caisse.add(tube([0.3, 0.92, cote * 0.7], [-0.55, 0.92, cote * 0.7], 0.022, t)); // la barre de portière
    }
    for (const x of [0.2, -0.85]) caisse.add(tube([x, 1.64, -0.58], [x, 1.64, 0.58], 0.03, t));
    caisse.add(tube([-0.9, 1.0, -0.66], [-0.85, 1.6, 0.58], 0.026, t));
    const toit = boite(1.15, 0.035, 1.24, noir, -0.32, 1.69, 0);
    caisse.add(toit);
    barreLed(caisse, 0.22, 1.74, 0, 0.9, 0.05);
    // le poste de pilotage : 2 baquets, l'équipage en casque, le volant, le tableau de bord avec le road-book
    const mh = A.matHabitacle();
    for (const cote of [-1, 1]) baquet(caisse, -0.62, 0.62, cote * 0.33, 0.8);
    equipier(caisse, { x: -0.56, y: 0.62, z: -0.33, sol: 0.5, toit: 1.62, combi: k2, casque: k1, mains: [0.22, 1.0] });
    equipier(caisse, { x: -0.56, y: 0.62, z: 0.33, sol: 0.5, toit: 1.62, combi: k2, casque: k3, mains: [0.1, 0.8], serre: 0.5 });
    volantCourse(caisse, 0.25, 0.98, -0.33, 0.52, 0.86);
    caisse.add(boite(0.18, 0.12, 1.2, mh.plastique, 0.55, 0.88, 0));
    const ecran = boite(0.02, 0.12, 0.2, mh.ecran, 0.46, 0.98, 0);
    ecran.rotation.z = 0.3;
    caisse.add(ecran);
    const rb = boite(0.03, 0.12, 0.2, mh.roadbook, 0.48, 0.98, 0.33);
    rb.rotation.z = 0.3;
    caisse.add(rb);
    // derrière : la grille du moteur, la prise d'air, la galerie avec la roue de secours, l'échappement, les feux
    pieceDessus(caisse, c, [[-1.5, 0.05], [-1.0, 0.05], [-1.0, 0.45], [-1.5, 0.45]], grillage(), 0.006);
    tuyau(caisse, [[-0.95, 1.05, 0.4], [-0.98, 1.4, 0.45], [-0.9, 1.52, 0.42]], 0.06, M.plastique);
    arceau(caisse, [[-1.0, 1.05, -0.5], [-1.0, 1.25, -0.5], [-1.62, 1.18, -0.45], [-1.62, 1.0, -0.45]], 0.02, t);
    arceau(caisse, [[-1.0, 1.05, 0.5], [-1.0, 1.25, 0.5], [-1.62, 1.18, 0.45], [-1.62, 1.0, 0.45]], 0.02, t);
    const sec = roueSecours(0.41, 0.27, 0.19, gris);
    sec.rotation.x = Math.PI / 2;
    sec.position.set(-1.3, 1.3, 0);
    caisse.add(sec);
    const pot = cylindre(0.06, 0.3, M.alu, 14);
    pot.rotation.z = Math.PI / 2;
    pot.position.set(-1.7, 0.85, 0.3);
    caisse.add(pot);
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.8, cote * 0.42, 0.06, 0.16, [[0, 0, 0.04, 0.14]], "feu");
    // les longs triangles de suspension et les gros combinés (posés dans g : ils ne bougent pas avec la caisse)
    for (const r of Rs) {
      for (const cote of [-1, 1]) {
        const zR = cote * (voie - 0.12), zC = cote * 0.4;
        if (r.x > 0) {
          for (const [y0, y1] of [[0.45, 0.33], [0.72, 0.52]]) {
            g.add(tube([r.x + 0.25, y0, zC], [r.x, y1, zR], 0.022, gris));
            g.add(tube([r.x - 0.25, y0, zC], [r.x, y1, zR], 0.022, gris));
          }
          amortisseur(g, [r.x - 0.02, 0.36, cote * (voie - 0.2)], [r.x - 0.12, 1.05, cote * 0.42], 0.05, jaune);
        } else {
          g.add(tube([-0.55, 0.45, zC], [r.x, 0.38, zR], 0.03, gris));
          g.add(tube([-0.55, 0.62, zC], [r.x, 0.48, zR], 0.025, gris));
          amortisseur(g, [r.x + 0.08, 0.38, cote * (voie - 0.2)], [r.x + 0.3, 1.05, cote * 0.5], 0.05, jaune);
        }
      }
    }
    const roues = quatreRoues(g, Rs, voie, { etrier: false, style: "beadlock", metal: gris });
    return fin(g, caisse, roues, "buggy", 1.75);
  }

  // ---------------------------------------------------------------- 🇦🇹 KTM 450 Rally et 🇯🇵 Honda CRF450 Rally
  // La moto de rallye (2,3 m, empattement 1,52 m, selle à 96 cm !) : la TOUR DE NAVIGATION (le grand carénage avec sa
  // bulle et les 2 phares l'un au-dessus de l'autre ; derrière : le road-book et les écrans), les réservoirs de chaque
  // côté (un rallye, c'est 500 km sans station !), la longue fourche, le bras oscillant et son amortisseur, le pot
  // d'échappement haut, les roues à rayons (21 pouces devant, 18 derrière) et le pilote DEBOUT sur les repose-pieds.
  function motoDeRallye(k1, k2, k3, numero, modele) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const honda = modele === "honda";
    const c1 = peinture(k1), c2 = peinture(k2), c3 = peinture(k3);
    const cadre = honda ? M.alu : peinture(k1, true); // (le cadre : orange chez KTM, alu chez Honda)
    const AV = { x: 0.76, r: 0.36, j: 0.27, l: 0.1 }, AR = { x: -0.76, r: 0.35, j: 0.235, l: 0.15 };
    const coqueMoto = (cles, mat, vitre) => {
      const cq = Raid.Coque.construire({ cles, vitre });
      const m = new THREE.Mesh(cq.geometrie, [mat, M.vitreFumee]);
      m.castShadow = m.receiveShadow = true;
      caisse.add(m);
      return cq;
    };
    // la tour de navigation : le carénage, sa bulle fumée (en haut) et les deux phares
    coqueMoto([
      { x: 0.42, yb: 0.98, yc: 1.24, yt: 1.42, w: 0.16, wb: 0.12, n: 2.2 },
      { x: 0.6, yb: 0.92, yc: 1.24, yt: 1.48, w: 0.2, wb: 0.14, n: 2.2 },
      { x: 0.74, yb: 0.92, yc: 1.2, yt: 1.38, w: 0.17, wb: 0.12, n: 2.2 },
      { x: 0.8, yb: 0.96, yc: 1.12, yt: 1.18, w: 0.12, wb: 0.09, n: 2.2 },
    ], c1, (ct) => ct[1] > 1.35);
    for (const [y, h] of [[1.2, 0.08], [1.07, 0.09]]) {
      const ph = A.optique(h, 0.11, [[0, 0, h * 0.7, 0.08]]);
      ph.rotation.z = -Math.PI / 2 + 0.35;
      ph.position.set(y > 1.1 ? 0.8 : 0.825, y, 0);
      caisse.add(ph);
    }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), panneauCourse(numero));
    plaque.rotation.set(0, Math.PI / 2, -0.35);
    plaque.position.set(0.73, 1.3, 0);
    caisse.add(plaque);
    // derrière la bulle : le road-book (un rouleau de papier dans sa boîte) et les écrans de navigation
    const mh = A.matHabitacle();
    caisse.add(boite(0.1, 0.06, 0.22, M.noir, 0.48, 1.33, 0));
    caisse.add(boite(0.002, 0.05, 0.18, peinture([0.95, 0.94, 0.88], true), 0.47, 1.365, 0).rotateZ(-0.4));
    for (const z of [-0.12, 0.12]) caisse.add(boite(0.02, 0.06, 0.08, mh.ecran, 0.5, 1.28, z));
    // les réservoirs avant, de chaque côté du carénage (avec le nom), et le réservoir du milieu
    coqueMoto([
      { x: 0.05, yb: 0.66, yc: 1.0, yt: 1.08, w: 0.17, wb: 0.12, n: 2.4 },
      { x: 0.32, yb: 0.6, yc: 1.04, yt: 1.13, w: 0.22, wb: 0.15, n: 2.4 },
      { x: 0.56, yb: 0.72, yc: 1.06, yt: 1.1, w: 0.19, wb: 0.13, n: 2.4 },
    ], c2);
    for (const cote of [-1, 1]) {
      const e = A.embleme(honda ? "honda" : "ktm", 0.26, 0.12);
      e.rotation.y = cote > 0 ? 0 : Math.PI;
      e.position.set(0.33, 0.9, cote * 0.225);
      caisse.add(e);
    }
    // la selle, longue et plate, et les flancs (avec le réservoir arrière dedans et le numéro)
    coqueMoto([
      { x: -0.95, yb: 0.86, yc: 0.94, yt: 0.96, w: 0.07, n: 2.2 },
      { x: -0.6, yb: 0.66, yc: 0.92, yt: 0.95, w: 0.17, n: 2.4 },
      { x: -0.2, yb: 0.6, yc: 0.92, yt: 0.96, w: 0.19, n: 2.4 },
      { x: 0.1, yb: 0.66, yc: 0.95, yt: 1.0, w: 0.16, n: 2.4 },
    ], c1);
    caisse.add(boite(0.85, 0.07, 0.24, M.siege, -0.3, 0.99, 0));
    for (const cote of [-1, 1]) {
      const n = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), panneauCourse(numero));
      n.rotation.y = cote > 0 ? 0 : Math.PI;
      n.position.set(-0.55, 0.82, cote * 0.18);
      caisse.add(n);
      caisse.add(boite(0.55, 0.05, 0.005, c3, -0.25, 0.68, cote * 0.195));
    }
    // l'arrière : le garde-boue, le feu, la plaque
    caisse.add(boite(0.4, 0.02, 0.14, c2, -1.12, 0.94, 0).rotateZ(0.15));
    caisse.add(boite(0.02, 0.04, 0.1, M.feuLed, -1.32, 0.95, 0));
    caisse.add(boite(0.01, 0.12, 0.16, peinture([0.95, 0.95, 0.9], true), -1.3, 0.85, 0));
    // le moteur (le carter, le cylindre, le radiateur de chaque côté), le cadre, le sabot
    caisse.add(boite(0.36, 0.3, 0.2, M.noir, -0.02, 0.5, 0));
    caisse.add(boite(0.18, 0.24, 0.16, M.alu, 0.08, 0.72, 0).rotateZ(-0.3));
    for (const cote of [-1, 1]) caisse.add(boite(0.05, 0.28, 0.16, M.noir, 0.32, 0.72, cote * 0.15));
    caisse.add(boite(0.55, 0.04, 0.24, M.sabot, 0.02, 0.33, 0).rotateZ(0.08));
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.58, 1.08, cote * 0.05], [0.15, 0.95, cote * 0.1], 0.024, cadre));
      caisse.add(tube([0.15, 0.95, cote * 0.1], [-0.18, 0.58, cote * 0.1], 0.024, cadre));
      caisse.add(tube([0.58, 1.06, cote * 0.05], [0.3, 0.42, cote * 0.08], 0.022, cadre));
      caisse.add(tube([-0.15, 0.85, cote * 0.1], [-0.95, 0.9, cote * 0.06], 0.016, cadre)); // le support de selle
    }
    // le pot d'échappement : il remonte sous la selle, à droite, avec son silencieux
    tuyau(caisse, [[0.15, 0.62, 0.05], [0.0, 0.42, 0.14], [-0.3, 0.45, 0.18], [-0.55, 0.72, 0.2]], 0.03, M.alu);
    const silencieux = cylindre(0.06, 0.38, honda ? M.alu : M.carbone, 16);
    silencieux.rotation.z = Math.PI / 2 - 0.25;
    silencieux.position.set(-0.75, 0.82, 0.2);
    caisse.add(silencieux);
    // la longue fourche (30 cm de débattement !), le garde-boue avant, le guidon et ses protège-mains
    const fourche = honda ? M.noir : peinture([0.95, 0.55, 0.05], true);
    for (const z of [-0.08, 0.08]) {
      g.add(tube([AV.x, AV.r, z], [AV.x - 0.14, AV.r + 0.45, z], 0.034, fourche));
      caisse.add(tube([AV.x - 0.14, AV.r + 0.45, z], [0.56, 1.1, z], 0.026, M.chrome));
    }
    g.add(boite(0.36, 0.02, 0.13, c2, AV.x, AV.r * 2 + 0.06, 0).rotateZ(-0.15));
    caisse.add(boite(0.08, 0.04, 0.24, M.alu, 0.55, 1.12, 0));
    caisse.add(tube([0.5, 1.2, -0.4], [0.52, 1.18, 0.4], 0.014, M.noir));
    for (const cote of [-1, 1]) {
      caisse.add(boite(0.14, 0.07, 0.03, c1, 0.56, 1.21, cote * 0.4).rotateY(cote * 0.35)); // les protège-mains
    }
    // le bras oscillant, l'amortisseur arrière, la chaîne, les repose-pieds
    for (const z of [-0.09, 0.09]) g.add(tube([AR.x, AR.r, z], [-0.08, 0.5, z * 0.8], 0.028, M.alu));
    amortisseur(caisse, [-0.35, 0.48, 0], [-0.18, 0.86, 0], 0.035, honda ? peinture([0.9, 0.1, 0.1], true) : peinture([0.95, 0.55, 0.05], true));
    g.add(tube([AR.x, AR.r + 0.04, -0.11], [-0.05, 0.55, -0.11], 0.012, M.noir));
    for (const cote of [-1, 1]) caisse.add(boite(0.08, 0.02, 0.1, M.alu, -0.05, 0.42, cote * 0.16));
    // le pilote, debout sur les repose-pieds (comme les vrais pilotes de rallye, pour amortir les bosses)
    const combi = peinture(k2, true), casque = peinture(k1), botte = peinture([0.12, 0.12, 0.13], true);
    for (const cote of [-1, 1]) {
      const pied = [-0.04, 0.47, cote * 0.17], genou = [0.15, 0.86, cote * 0.18], hanche = [-0.18, 1.22, cote * 0.12];
      caisse.add(tube(pied, [0.05, 0.68, cote * 0.18], 0.06, botte));
      caisse.add(tube([0.05, 0.68, cote * 0.18], genou, 0.055, combi));
      caisse.add(tube(genou, hanche, 0.075, combi));
      caisse.add(boite(0.24, 0.07, 0.1, botte, 0.02, 0.46, cote * 0.17));
    }
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 4, 10), combi);
    buste.position.set(-0.04, 1.42, 0);
    buste.rotation.z = -0.55;
    buste.scale.set(0.8, 1, 1.1);
    caisse.add(buste);
    caisse.add(boite(0.08, 0.3, 0.24, c3, -0.2, 1.48, 0).rotateZ(-0.55)); // le sac à dos (l'eau, les outils)
    for (const cote of [-1, 1]) {
      caisse.add(tube([0.06, 1.6, cote * 0.2], [0.28, 1.36, cote * 0.3], 0.045, combi));
      caisse.add(tube([0.28, 1.36, cote * 0.3], [0.5, 1.22, cote * 0.36], 0.04, combi));
      caisse.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mh.gants).translateX(0.5).translateY(1.22).translateZ(cote * 0.36));
    }
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), casque);
    tete.scale.set(1.15, 1, 0.95);
    tete.position.set(0.16, 1.78, 0);
    caisse.add(tete);
    const masque = new THREE.Mesh(new THREE.SphereGeometry(0.162, 16, 6, -0.9, 1.8, 1.25, 0.4), mh.visiere); // le masque (les lunettes de cross)
    masque.rotation.y = Math.PI / 2;
    masque.scale.set(1.15, 1, 0.95);
    masque.position.copy(tete.position);
    caisse.add(masque);
    caisse.add(boite(0.1, 0.07, 0.12, casque, 0.32, 1.68, 0).rotateZ(-0.4)); // la mentonnière, en avant
    caisse.add(boite(0.16, 0.015, 0.2, casque, 0.3, 1.9, 0).rotateZ(-0.25)); // la visière du casque de cross
    // les roues : 21 pouces devant, 18 pouces derrière, à gros crampons, avec des RAYONS
    const roues = [];
    for (const r of [AV, AR]) {
      const avant = r === AV;
      const w = Raid.Roues.fabriquer({ rayon: r.r, largeur: r.l, jante: r.j, style: "rayons", metal: M.noir, pneu: "crampons", etrier: avant ? [0.85, 0.85, 0.87] : false, cote: 1 });
      w.pivot.position.set(r.x, r.r, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant }));
    }
    return fin(g, caisse, roues, "moto", 1.95);
  }

  // ---------------------------------------------------------------- 🇷🇺 Kamaz 43509 « Kamaz-master » (7 m × 2,55 m × 3,4 m)
  // Le camion de course : la cabine AVANCÉE (le moteur est dessous), haute et carrée, avec son grand pare-brise, son
  // pare-soleil et la rampe de phares ; la grosse calandre et le pare-chocs en acier avec ses phares ; le châssis, les
  // réservoirs, les ressorts et les amortisseurs qu'on voit sous la caisse ; la caisse arrière avec les roues de secours ;
  // les pneus de 1,25 m ; et l'équipage de 3 (le pilote, le navigateur et le mécanicien).
  function kamaz(k1, k2, k3, numero) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const Rs = [{ x: 1.85, r: 0.62, l: 0.42, j: 0.32 }, { x: -2.35, r: 0.62, l: 0.42, j: 0.32 }], voie = 1.05;
    const bleu = peinture(k1), blanc = peinture(k2), rouge = peinture(k3);
    // la cabine (de x = 0,95 à 3,05), posée haut sur le châssis
    const c = peau(caisse, [
      T(0.95, 1.4, 2.0, 3.1, 1.22, 1.2, 1.12, { rt: 0.12, de: 0.0, wl: 1.2 }),
      T(1.05, 1.4, 2.02, 3.18, 1.24, 1.21, 1.14, { rt: 0.14, wl: 1.22 }),
      T(2.4, 1.4, 2.02, 3.2, 1.25, 1.21, 1.15, { rt: 0.14, wl: 1.23 }),
      T(2.85, 1.4, 2.02, 3.12, 1.25, 1.21, 1.14, { rt: 0.14, wl: 1.23 }),
      T(2.98, 1.4, 1.98, 2.1, 1.24, 1.2, 1.12, { rt: 0.08, wl: 1.22 }),
      T(3.05, 1.42, 1.9, 1.94, 1.22, 1.18, 1.1, { rt: 0.06, wl: 1.2 }),
    ], [], voie, bleu, vitresUnies({ pareBrise: [2.85, 2.99], cotes: [1.95, 2.85], montants: [], pilier: 0.1, haut: 0.12 }), 0);
    habitacle(caisse, { xPB: 2.92, xS: 2.15, sol: 1.45, hS: 1.85, w: 1.1, tdb: 2.15, toit: (x) => c.tranche(x).yt, equipage: [k1, k2], copilote: [k1, k3], arceau: false });
    equipier(caisse, { x: 1.4, y: 1.85, z: 0, sol: 1.45, toit: 3.1, combi: k1, casque: k1, mains: [1.85, 2.0], serre: 0.6 }); // le mécanicien, au milieu derrière
    // la face : le pare-soleil, la grande calandre avec KAMAZ, les phares dans le pare-chocs en acier, la rampe sur le toit
    caisse.add(boite(0.3, 0.05, 2.3, bleu, 3.08, 3.08, 0).rotateZ(-0.15));
    auBout(caisse, c, true, 1.68, 0, 0.42, 1.9, M.trou, 0.02);
    for (let i = 0; i < 5; i++) auBout(caisse, c, true, 1.52 + i * 0.08, 0, 0.025, 1.85, M.alu, 0.04);
    A.emblemeAuBout(caisse, c, "kamaz", true, 1.92, 1.0, 0.25, 0, 0.0);
    caisse.add(boite(0.38, 0.4, 2.5, peinture([0.2, 0.21, 0.23], true), 3.18, 1.2, 0)); // le pare-chocs en acier
    for (const cote of [-1, 1]) {
      for (const z of [0.75, 1.0]) phareAdditionnel(caisse, 3.38, 1.24, cote * z, 0.09, M.noir);
      optiqueAuBout(caisse, c, true, 1.62, cote * 1.02, 0.14, 0.32, [[0, 0.06, 0.1, 0.12], [0, -0.08, 0.1, 0.1]], undefined, 3.065);
      caisse.add(boite(0.08, 0.06, 0.1, rouge, 3.4, 1.05, cote * 0.55)); // les crochets
    }
    sabot(caisse, 3.15, 0.95, 0.6, 1.8, 0.4);
    caisse.add(boite(0.16, 0.12, 2.1, M.noir, 2.85, 3.28, 0));
    for (let i = 0; i < 6; i++) phareAdditionnel(caisse, 2.96, 3.28, -0.85 + i * 0.34, 0.075, M.noir);
    antenne(caisse, 1.3, 3.18, 0.8, 0.7);
    antenne(caisse, 1.3, 3.18, -0.8, 0.5);
    // les côtés de la cabine : la porte, les marches, le grand rétroviseur, le tuba (la prise d'air en hauteur)
    portiere(caisse, c, 2.85, 1.85, 1.5, 2.95, M.noir);
    for (const cote of [-1, 1]) {
      for (const y of [1.05, 1.32]) caisse.add(boite(0.4, 0.04, 0.22, M.alu, 2.45, y, cote * 1.15));
      caisse.add(tube([2.95, 2.4, cote * 1.24], [3.15, 2.55, cote * 1.5], 0.025, M.noir));
      caisse.add(boite(0.08, 0.4, 0.22, M.noir, 3.12, 2.42, cote * 1.52));
      caisse.add(boite(0.01, 0.36, 0.18, M.chrome, 3.07, 2.42, cote * 1.52));
      tuyau(caisse, [[1.05, 1.9, cote * 1.2], [0.95, 2.4, cote * 1.22], [0.95, 3.3, cote * 1.18], [1.05, 3.45, cote * 1.12]], 0.1, M.noir);
      caisse.add(boite(0.22, 0.14, 0.24, M.noir, 1.12, 3.46, cote * 1.1));
    }
    // la déco : la bande blanche et rouge, le numéro sur la porte, KAMAZ-MASTER sur la caisse
    pieceFlanc(caisse, c, [[0.97, 1.6], [3.0, 1.6], [3.0, 1.78], [0.97, 1.78]], blanc, 0.008);
    pieceFlanc(caisse, c, [[0.97, 1.78], [3.0, 1.78], [3.0, 1.84], [0.97, 1.84]], rouge, 0.008);
    decoCourse(caisse, c, 1.95, 2.75, 2.0, 2.45, numero, ["KAMAZ", "MASTER", "DAKAR", "SHELL"], ["#1d3f9a", "#ffffff", "#d01818", "#ffcc00"]);
    // le châssis, les réservoirs, les ailes arrière, les essieux
    for (const cote of [-1, 1]) caisse.add(boite(6.6, 0.28, 0.12, M.noir, -0.25, 1.1, cote * 0.5));
    for (const cote of [-1, 1]) {
      const r = cylindre(0.28, 1.1, M.alu, 18);
      r.rotation.z = Math.PI / 2;
      r.position.set(0.2, 1.05, cote * 0.85);
      caisse.add(r);
      caisse.add(boite(1.4, 0.06, 0.6, M.noir, -2.35, 1.42, cote * 1.0)); // les ailes au-dessus des roues arrière
    }
    for (const r of Rs) {
      g.add(tube([r.x, r.r, -0.85], [r.x, r.r, 0.85], 0.09, M.noir)); // l'essieu
      g.add(boite(0.4, 0.28, 0.4, M.noir, r.x, r.r, 0)); // le différentiel
      for (const cote of [-1, 1]) {
        for (const dx of [-0.18, 0.18]) amortisseur(g, [r.x + dx, r.r + 0.1, cote * 0.72], [r.x + dx * 1.5, 1.25, cote * 0.62], 0.07, peinture([0.95, 0.75, 0.1], true));
        g.add(boite(1.2, 0.08, 0.12, M.noir, r.x, r.r + 0.2, cote * 0.55)); // les lames de ressort
      }
    }
    // la caisse arrière : peinte, avec les bandes, les roues de secours, le hayon et les feux
    const k = peau(caisse, [
      T(-3.7, 1.32, 2.85, 2.95, 1.2, 1.2, 1.12, { rt: 0.1, de: 0, wl: 1.2 }),
      T(-3.62, 1.32, 2.9, 3.0, 1.25, 1.25, 1.18, { rt: 0.12, de: 0, wl: 1.25 }),
      T(0.68, 1.32, 2.9, 3.0, 1.25, 1.25, 1.18, { rt: 0.12, de: 0, wl: 1.25 }),
      T(0.76, 1.32, 2.85, 2.95, 1.2, 1.2, 1.12, { rt: 0.1, de: 0, wl: 1.2 }),
    ], [], voie, blanc, null, 0);
    pieceFlanc(caisse, k, [[-3.6, 2.05], [0.7, 2.05], [0.7, 2.55], [-3.6, 2.55]], A.bandeauTexte("KAMAZ-MASTER", hexa(k1), "#ffffff"), 0.008, true);
    pieceFlanc(caisse, k, [[-3.6, 1.9], [0.7, 1.9], [0.7, 2.0], [-3.6, 2.0]], rouge, 0.008);
    for (const cote of [-1, 1]) {
      const sec = roueSecours(0.62, 0.42, 0.32, rouge); // les 2 roues de secours, accrochées aux portes arrière
      sec.rotation.y = -Math.PI / 2;
      sec.position.set(-3.95, 2.15, cote * 0.6);
      caisse.add(sec);
    }
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, k, false, 1.5, cote * 0.95, 0.2, 0.36, [[0.05, 0.08, 0.08, 0.14], [-0.05, -0.08, 0.08, 0.14]], "feu");
      bavette(caisse, -3.0, 0.75, cote * voie, 0.6, 0.55);
      bavette(caisse, 1.15, 0.75, cote * voie, 0.6, 0.55);
    }
    caisse.add(boite(0.01, 1.4, 0.02, M.noir, k.xMin - 0.005, 2.15, 0)); // les 2 portes arrière
    for (const z of [-1.0, 1.0]) caisse.add(boite(0.04, 1.3, 0.05, M.alu, k.xMin - 0.02, 2.15, z)); // les charnières
    caisse.add(boite(0.25, 0.18, 2.2, M.noir, -3.75, 1.15, 0)); // le pare-chocs arrière
    const roues = quatreRoues(g, Rs, voie, { etrier: false, style: "acier", metal: rouge });
    return fin(g, caisse, roues, "camion", 3.4);
  }

  // ================================================================ FIN_DES_VEHICULES
  const FABRIQUES = { hilux, dkr, buggy, ssv, ktm: motoDeRallye, honda: motoDeRallye, kamaz };
  // Fabrique un véhicule d'après sa fiche (config.js), puis recolle ses pièces (affichage/atelier.js : fusionner).
  function fabriquer(fiche) {
    const [k1, k2, k3] = fiche.couleurs;
    const v = FABRIQUES[fiche.modele](k1, k2, k3, fiche.numero, fiche.modele);
    v.g.traverse((o) => {
      if (o.isMesh && !(o.material && o.material.transparent)) o.castShadow = true;
    });
    A.recoller(v);
    return v;
  }

  // Étape 72 : la MAQUETTE d'un véhicule, pour le dessiner de loin. Comme un jouet en bois : une boîte de sa couleur pour
  // le bas, une boîte plus petite pour la cabine (un peu plus sombre), et un cube noir par roue. Tout est recollé en une
  // seule pièce : 1 dessin au lieu d'une soixantaine. De loin (au-delà de 60 à 160 m), on ne voit pas la différence.
  const matMaquette = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.1 });
  function maquette(objet, fiche) {
    objet.g.updateMatrixWorld(true);
    const boite3 = new THREE.Box3().setFromObject(objet.caisse), taille = boite3.getSize(new THREE.Vector3()), milieu = boite3.getCenter(new THREE.Vector3());
    const k = fiche.couleurs[0], couleur = new THREE.Color(k[0], k[1], k[2]).convertSRGBToLinear();
    const sombre = couleur.clone().multiplyScalar(0.55), noir = new THREE.Color(0.02, 0.02, 0.02);
    const pieces = [];
    const cube = (l, h, p, x, y, z, c) => pieces.push({ geo: new THREE.BoxGeometry(l, h, p).translate(x, y, z), c });
    const moto = objet.famille === "moto";
    const bas = taille.y * (moto ? 0.5 : 0.55), plancher = boite3.min.y + taille.y * (moto ? 0.3 : 0.12);
    cube(taille.x * 0.96, bas - (plancher - boite3.min.y), taille.z * (moto ? 0.5 : 0.92), milieu.x, (plancher + boite3.min.y + bas) / 2, milieu.z, couleur);
    cube(taille.x * (moto ? 0.3 : 0.5), taille.y - bas, taille.z * (moto ? 0.6 : 0.8), milieu.x - taille.x * (objet.famille === "camion" ? -0.3 : 0.08), boite3.min.y + bas + (taille.y - bas) / 2, milieu.z, sombre);
    const ici = new THREE.Vector3();
    for (const r of objet.roues) {
      r.pivot.getWorldPosition(ici);
      const d = ici.y * 2; // (le centre de la roue est à un rayon du sol)
      cube(d, d, moto ? 0.15 : 0.35, ici.x, ici.y, ici.z, noir);
    }
    // On recolle tout (avec une couleur par point).
    const pos = [], nor = [], col = [];
    for (const { geo, c } of pieces) {
      const g = geo.toNonIndexed();
      pos.push(...g.attributes.position.array);
      nor.push(...g.attributes.normal.array);
      for (let i = 0; i < g.attributes.position.count; i++) col.push(c.r, c.g, c.b);
      g.dispose();
      geo.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, matMaquette);
    m.receiveShadow = true;
    return m;
  }

  return { fabriquer, maquette };
})();
