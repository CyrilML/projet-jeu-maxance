// 🏍️ LES MOTOS TOUT-TERRAIN : l'atelier du mécano de motocross (étape 71)
//
// ✍️ « Fais une moto cross, un peu une Honda. » Et ✍️ une moto de TRIAL, encore plus sauteuse.
//   - la MOTO CROSS, comme une Honda CRF450R : haute sur pattes (la selle à 96 cm !), une grande roue de 21 pouces
//     devant et de 18 pouces derrière, des pneus à gros crampons, une longue fourche, des plastiques rouges et blancs
//     (la plaque numéro devant, les « ouïes » sur les côtés), le pot qui remonte sous la selle, et le pilote DEBOUT sur
//     les repose-pieds, en maillot, casque à visière et lunettes de cross ;
//   - la MOTO DE TRIAL, comme une Montesa Cota (Honda) : toute petite et légère, presque pas de selle (on roule
//     debout), un minuscule réservoir, les roues très fines, et un cadre en alu qu'on voit partout.
//
// Les roues à rayons viennent de l'atelier du pneumaticien (affichage/roues.js, style « rayons »).
// Comme toutes les autres : « nez vers x+ », posées sur y = 0, centrées en x = 0 et z = 0.
// (Le jeu agrandit les motos pour qu'on les voie bien : config.js, taille.)

window.Circuit = window.Circuit || {};

Circuit.MotosCross = (function () {
  const O = Circuit.Modeles.outils, B = Circuit.VoituresMarques.outils, N = Circuit.VoituresNouvelles.outils;
  const { M, peinture, boite, cylindre, tube } = O;
  const { voiture } = B;
  const { embleme, LOGOS } = N;

  Object.assign(LOGOS, {
    hondaAile(ctx) {
      // l'aile de Honda (les motos ont une aile, les voitures un H)
      ctx.fillStyle = "#e9ecef";
      ctx.beginPath(); ctx.moveTo(40, 300); ctx.quadraticCurveTo(250, 120, 480, 130); ctx.lineTo(470, 175); ctx.quadraticCurveTo(300, 175, 120, 320); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(150 + i * 70, 300 - i * 30); ctx.lineTo(440 - i * 10, 210 + i * 20); ctx.lineTo(430 - i * 10, 235 + i * 20); ctx.lineTo(170 + i * 70, 330 - i * 30); ctx.closePath(); ctx.fill(); }
      ctx.font = "bold 90px Arial"; ctx.textAlign = "center"; ctx.fillText("HONDA", 256, 440);
    },
  });

  const metal = () => new THREE.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 0.85, roughness: 0.3 });
  const alu = () => new THREE.MeshStandardMaterial({ color: 0xd9dce0, metalness: 0.75, roughness: 0.35 });
  const caoutchouc = () => new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.95 });

  // Une pièce de plastique plate (vue de côté : la liste de points [x, y]), épaisse de « ep », centrée en z (ou décalée).
  function plaque(points, ep, materiau, z) {
    const forme = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(forme, { depth: ep, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
    geo.translate(0, 0, -ep / 2 + (z || 0));
    const m = new THREE.Mesh(geo, materiau);
    m.castShadow = true;
    return m;
  }
  // Une étiquette (le numéro, le nom) : un texte sur une toile, posée de côté (cote = ±1) ou de face (cote = 0).
  function texte(chaine, fond, encre, l, h) {
    return O.etiquette(chaine, fond, encre, l, h);
  }

  // Le pilote de cross : DEBOUT sur les repose-pieds, penché en avant, les coudes écartés. Maillot (couleur 1),
  // pantalon (couleur 2), bottes blanches, gants, casque à visière avec ses lunettes.
  // o = { xPied, yPied (les repose-pieds), xMain, yMain (les poignées), lMains (demi-largeur du guidon), debout (0 à 1) }
  function piloteCross(caisse, o, maillot, pantalon, casqueMat) {
    const botte = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 });
    const gant = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.7 });
    const hanche = [o.xPied - 0.12, o.yPied + 0.55 + 0.25 * (o.debout || 1), 0];
    const epaule = [hanche[0] + 0.28, hanche[1] + 0.42, 0];
    for (const cote of [-1, 1]) {
      const pied = [o.xPied, o.yPied + 0.04, cote * 0.2], genou = [o.xPied + 0.22, (o.yPied + hanche[1]) / 2 + 0.05, cote * 0.2];
      caisse.add(tube(pied, genou, 0.065, botte)); // la botte et le tibia
      caisse.add(tube(genou, [hanche[0], hanche[1], cote * 0.12], 0.075, pantalon)); // la cuisse
      caisse.add(boite(0.26, 0.08, 0.1, botte, o.xPied + 0.04, o.yPied + 0.02, cote * 0.2));
      const main = [o.xMain, o.yMain, cote * (o.lMains - 0.06)], coude = [(epaule[0] + main[0]) / 2 - 0.05, (epaule[1] + main[1]) / 2 - 0.04, cote * (o.lMains + 0.08)];
      caisse.add(tube([epaule[0], epaule[1], cote * 0.18], coude, 0.05, maillot));
      caisse.add(tube(coude, main, 0.045, maillot));
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), gant);
      g.position.set(...main);
      caisse.add(g);
    }
    // le bassin et le buste penché
    const bassin = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.12, 4, 10), pantalon);
    bassin.rotation.x = Math.PI / 2;
    bassin.position.set(...hanche);
    caisse.add(bassin);
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 4, 12), maillot);
    buste.position.set((hanche[0] + epaule[0]) / 2, (hanche[1] + epaule[1]) / 2, 0);
    buste.rotation.z = -Math.atan2(epaule[0] - hanche[0], epaule[1] - hanche[1]);
    buste.scale.set(0.85, 1, 1.15);
    caisse.add(buste);
    // le numéro dans le dos
    const dos = texte("7", "rgba(0,0,0,0)", "#ffffff", 0.2, 0.2);
    dos.rotation.y = -Math.PI / 2;
    dos.rotation.z = buste.rotation.z;
    dos.position.set(buste.position.x - 0.16, buste.position.y + 0.04, 0);
    caisse.add(dos);
    // le casque de cross : la coque, la mentonnière avancée, la visière (le « peak ») et les lunettes
    const xT = epaule[0] + 0.1, yT = epaule[1] + 0.2;
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), casqueMat);
    casque.scale.set(1.1, 1, 0.95);
    casque.position.set(xT, yT, 0);
    caisse.add(casque);
    const menton = boite(0.14, 0.1, 0.14, casqueMat, xT + 0.13, yT - 0.08, 0);
    menton.rotation.z = -0.3;
    caisse.add(menton);
    const visiere = boite(0.2, 0.012, 0.22, casqueMat, xT + 0.12, yT + 0.11, 0);
    visiere.rotation.z = -0.25;
    caisse.add(visiere);
    caisse.add(boite(0.04, 0.06, 0.2, M.vitreFumee, xT + 0.15, yT + 0.01, 0)); // les lunettes
    caisse.add(boite(0.02, 0.03, 0.31, new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.6 }), xT + 0.02, yT + 0.01, 0)); // l'élastique
  }

  // Une fourche (deux tubes, du moyeu de la roue avant jusqu'au té de fourche), un guidon avec ses poignées et ses leviers.
  function avant(g, caisse, xRoue, rRoue, xTe, yTe, lGuidon, couleurFourche) {
    const fourreau = couleurFourche || new THREE.MeshStandardMaterial({ color: 0xd4a52a, metalness: 0.8, roughness: 0.3 });
    for (const z of [-0.09, 0.09]) {
      g.add(tube([xRoue, rRoue, z], [xRoue + (xTe - xRoue) * 0.45, rRoue + (yTe - rRoue) * 0.45, z], 0.035, M.noir)); // le bas (qui suit la roue)
      caisse.add(tube([xRoue + (xTe - xRoue) * 0.4, rRoue + (yTe - rRoue) * 0.4, z], [xTe, yTe, z], 0.03, fourreau));
    }
    caisse.add(boite(0.08, 0.04, 0.26, alu(), xTe, yTe, 0)); // le té de fourche
    caisse.add(tube([xTe - 0.04, yTe + 0.08, -lGuidon], [xTe - 0.04, yTe + 0.08, lGuidon], 0.014, alu()));
    for (const cote of [-1, 1]) {
      caisse.add(tube([xTe - 0.04, yTe + 0.08, cote * (lGuidon - 0.12)], [xTe - 0.04, yTe + 0.08, cote * (lGuidon + 0.02)], 0.022, caoutchouc()));
      caisse.add(tube([xTe - 0.02, yTe + 0.09, cote * (lGuidon - 0.14)], [xTe + 0.1, yTe + 0.07, cote * (lGuidon - 0.02)], 0.006, alu())); // le levier
    }
  }

  // 🇯🇵 La moto cross : une Honda CRF450R (2,18 m de long, empattement 1,49 m, selle à 0,96 m).
  function crf(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const rouge = peinture(k1), blanc = peinture([0.96, 0.96, 0.96]), noir = peinture(k2 || [0.08, 0.08, 0.09]);
    const xAv = 0.76, xAr = -0.73, rAv = 0.36, rAr = 0.34;
    // le cadre en alu (une poutre double qui passe sous le réservoir), le berceau, la boucle arrière
    for (const z of [-0.07, 0.07]) {
      caisse.add(tube([0.52, 0.92, z], [0.05, 0.86, z * 1.6], 0.028, alu()));
      caisse.add(tube([0.05, 0.86, z * 1.6], [-0.12, 0.42, z * 1.6], 0.028, alu()));
      caisse.add(tube([0.52, 0.9, z], [0.38, 0.32, z], 0.02, alu()));
      caisse.add(tube([-0.05, 0.82, z * 1.5], [-0.62, 0.92, z * 1.3], 0.016, alu()));
    }
    // le moteur monocylindre : le carter, le cylindre penché, ses ailettes, le carter d'embrayage
    caisse.add(boite(0.36, 0.26, 0.24, M.noir, 0.15, 0.42, 0));
    const cylindre1 = boite(0.16, 0.24, 0.16, metal(), 0.28, 0.66, 0);
    cylindre1.rotation.z = -0.25;
    caisse.add(cylindre1);
    for (let i = 0; i < 5; i++) {
      const a = boite(0.2, 0.012, 0.2, metal(), 0.28 + i * 0.012, 0.6 + i * 0.04, 0);
      a.rotation.z = -0.25;
      caisse.add(a);
    }
    const embrayage = cylindre(0.11, 0.04, metal(), 22);
    embrayage.rotation.x = Math.PI / 2;
    embrayage.position.set(0.12, 0.42, 0.13);
    caisse.add(embrayage);
    // le radiateur de chaque côté (avec ses ouïes), le réservoir, la selle longue et plate
    for (const cote of [-1, 1]) caisse.add(boite(0.12, 0.26, 0.04, nid(), 0.42, 0.7, cote * 0.13));
    caisse.add(plaque([[0.48, 0.92], [0.2, 1.0], [-0.08, 0.95], [-0.05, 0.84], [0.42, 0.82]], 0.26, rouge));
    const selle = boite(0.92, 0.07, 0.24, noir, -0.32, 0.98, 0);
    selle.rotation.z = 0.03;
    caisse.add(selle);
    // les plastiques : les ouïes de radiateur (rouges, avec HONDA), les flancs arrière (rouges), la plaque avant blanche
    for (const cote of [-1, 1]) {
      caisse.add(plaque([[0.55, 0.92], [0.22, 0.96], [0.2, 0.62], [0.35, 0.52], [0.58, 0.72]], 0.02, rouge, cote * 0.17));
      caisse.add(plaque([[-0.12, 0.98], [-0.85, 1.07], [-0.86, 1.0], [-0.3, 0.84], [-0.12, 0.86]], 0.02, rouge, cote * 0.14));
      const h = texte("HONDA", "rgba(0,0,0,0)", "#ffffff", 0.32, 0.08);
      h.rotation.y = cote > 0 ? 0 : Math.PI;
      h.position.set(0.37, 0.8, cote * 0.192);
      caisse.add(h);
      const crf = texte("CRF 450R", "rgba(0,0,0,0)", "#ffffff", 0.3, 0.06);
      crf.rotation.y = cote > 0 ? 0 : Math.PI;
      crf.position.set(-0.45, 0.94, cote * 0.162);
      caisse.add(crf);
      // la plaque numéro de côté (blanche, sous la selle)
      const num = texte("7", "#ffffff", "#111111", 0.24, 0.18);
      num.rotation.y = cote > 0 ? 0 : Math.PI;
      num.position.set(-0.4, 0.82, cote * 0.165);
      caisse.add(num);
    }
    // le garde-boue arrière (rouge, long et relevé), le garde-boue avant (blanc, haut au-dessus de la roue)
    caisse.add(plaque([[-0.5, 1.02], [-1.12, 1.17], [-1.12, 1.13], [-0.5, 0.96]], 0.22, rouge));
    caisse.add(plaque([[0.62, 0.97], [1.08, 0.86], [1.12, 0.82], [0.62, 0.9]], 0.18, blanc));
    // la plaque avant (blanche, avec le numéro), et l'aile Honda sur le réservoir
    caisse.add(plaque([[0.62, 1.15], [0.68, 1.15], [0.6, 0.86], [0.55, 0.86]], 0.26, blanc));
    const numAv = texte("7", "rgba(0,0,0,0)", "#111111", 0.18, 0.16);
    numAv.rotation.y = Math.PI / 2;
    numAv.rotation.x = 0;
    numAv.position.set(0.68, 1.0, 0);
    caisse.add(numAv);
    for (const cote of [-1, 1]) {
      const aile = embleme("hondaAile", 0.18, 0.18);
      aile.rotation.y = cote > 0 ? 0 : Math.PI;
      aile.position.set(0.18, 0.92, cote * 0.135);
      caisse.add(aile);
    }
    // l'échappement : le collecteur qui sort du cylindre, et le silencieux sous la selle (côté droit)
    caisse.add(tube([0.34, 0.58, 0.06], [0.3, 0.36, 0.14], 0.03, metal()));
    caisse.add(tube([0.3, 0.36, 0.14], [-0.2, 0.62, 0.16], 0.03, metal()));
    const silencieux = cylindre(0.055, 0.42, alu(), 18);
    silencieux.rotation.z = Math.PI / 2 - 0.25;
    silencieux.position.set(-0.45, 0.78, 0.15);
    caisse.add(silencieux);
    caisse.add(cylindre(0.035, 0.03, M.noir, 14).translateX(-0.66).translateY(0.84).translateZ(0.15));
    // le bras oscillant (il suit la roue arrière), l'amortisseur arrière (ressort jaune), la chaîne, le sabot, les repose-pieds
    for (const z of [-0.09, 0.09]) g.add(tube([xAr, rAr, z], [-0.08, 0.44, z * 0.8], 0.03, alu()));
    caisse.add(tube([-0.18, 0.5, 0], [-0.1, 0.84, 0], 0.04, new THREE.MeshStandardMaterial({ color: 0xf2c014, roughness: 0.5 })));
    caisse.add(tube([xAr, rAr, -0.11], [0.08, 0.38, -0.11], 0.012, M.noir));
    caisse.add(boite(0.4, 0.04, 0.2, M.noir, 0.15, 0.27, 0));
    for (const cote of [-1, 1]) caisse.add(boite(0.1, 0.03, 0.08, alu(), -0.05, 0.4, cote * 0.18));
    // l'avant : la fourche dorée, le guidon large
    avant(g, caisse, xAv, rAv, 0.58, 1.12, 0.4);
    // le pilote debout
    piloteCross(caisse, { xPied: -0.05, yPied: 0.42, xMain: 0.54, yMain: 1.2, lMains: 0.4, debout: 0.85 }, rouge, noir, rouge);
    // les roues à rayons, avec les gros crampons (21 pouces devant, 18 derrière)
    const roues = [];
    for (const [x, r, l, j, av] of [[xAv, rAv, 0.09, 0.27, true], [xAr, rAr, 0.12, 0.23, false]]) {
      const w = Circuit.Roues.fabriquer({ rayon: r, largeur: l, jante: j, style: "rayons", pneu: "crampons", metal: noir, etrier: [0.8, 0.1, 0.1], cote: 1 });
      w.pivot.position.set(x, r, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant: av }));
    }
    return Object.assign(voiture(g, caisse, roues, 1.7), { deuxRoues: true });
  }

  // 🇯🇵 La moto de trial, comme une Montesa Cota 4RT (Honda) : 2,03 m, empattement 1,32 m, 74 kg seulement. Presque pas
  // de selle (le pilote roule debout), un petit réservoir sous une coque, les roues fines aux pneus « mous », un grand
  // sabot pour passer sur les rochers, et le cadre en alu bien visible.
  function trial(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const coul = peinture(k1), blanc = peinture([0.96, 0.96, 0.96]), noir = peinture(k2 || [0.08, 0.08, 0.09]);
    const xAv = 0.68, xAr = -0.64, rAv = 0.34, rAr = 0.33;
    // le cadre en alu poli (deux longerons qui descendent jusqu'au sabot)
    for (const z of [-0.06, 0.06]) {
      caisse.add(tube([0.5, 0.88, z], [0.0, 0.78, z * 1.5], 0.03, alu()));
      caisse.add(tube([0.0, 0.78, z * 1.5], [-0.15, 0.38, z * 1.5], 0.03, alu()));
      caisse.add(tube([0.5, 0.86, z], [0.32, 0.28, z], 0.022, alu()));
      caisse.add(tube([-0.05, 0.76, z * 1.4], [-0.58, 0.82, z * 1.2], 0.014, alu()));
    }
    // le petit moteur, le grand sabot, les repose-pieds dentés
    caisse.add(boite(0.3, 0.24, 0.2, M.noir, 0.1, 0.4, 0));
    const cyl = boite(0.13, 0.2, 0.13, metal(), 0.22, 0.6, 0);
    cyl.rotation.z = -0.2;
    caisse.add(cyl);
    caisse.add(boite(0.5, 0.025, 0.22, alu(), 0.08, 0.25, 0));
    for (const cote of [-1, 1]) caisse.add(boite(0.1, 0.025, 0.1, alu(), -0.08, 0.36, cote * 0.18));
    // la coque du réservoir et la toute petite selle, la plaque latérale
    caisse.add(plaque([[0.48, 0.88], [0.15, 0.9], [-0.25, 0.86], [-0.25, 0.78], [0.42, 0.8]], 0.24, coul));
    caisse.add(boite(0.3, 0.035, 0.16, noir, -0.38, 0.88, 0));
    for (const cote of [-1, 1]) {
      caisse.add(plaque([[-0.25, 0.86], [-0.7, 0.96], [-0.7, 0.9], [-0.3, 0.76]], 0.02, blanc, cote * 0.11));
      const nom = texte("COTA", "rgba(0,0,0,0)", coul.color ? "#c81e1e" : "#c81e1e", 0.24, 0.07);
      nom.rotation.y = cote > 0 ? 0 : Math.PI;
      nom.position.set(0.15, 0.85, cote * 0.125);
      caisse.add(nom);
      const aile = embleme("hondaAile", 0.12, 0.12);
      aile.rotation.y = cote > 0 ? 0 : Math.PI;
      aile.position.set(-0.08, 0.83, cote * 0.125);
      caisse.add(aile);
    }
    // les garde-boue : derrière (court, relevé), devant (tout près de la roue), la petite plaque avant
    caisse.add(plaque([[-0.45, 0.95], [-0.95, 1.08], [-0.95, 1.04], [-0.45, 0.9]], 0.18, blanc));
    g.add(plaque([[xAv - 0.25, rAv + 0.38], [xAv + 0.28, rAv + 0.36], [xAv + 0.3, rAv + 0.33], [xAv - 0.25, rAv + 0.34]], 0.14, blanc));
    caisse.add(plaque([[0.56, 1.06], [0.6, 1.06], [0.55, 0.9], [0.51, 0.9]], 0.2, blanc));
    // l'échappement qui fait le tour du moteur, le silencieux court
    caisse.add(tube([0.27, 0.56, 0.07], [0.24, 0.3, 0.12], 0.025, metal()));
    caisse.add(tube([0.24, 0.3, 0.12], [-0.3, 0.6, 0.14], 0.025, metal()));
    const sil = cylindre(0.045, 0.3, alu(), 16);
    sil.rotation.z = Math.PI / 2 - 0.2;
    sil.position.set(-0.45, 0.68, 0.14);
    caisse.add(sil);
    // le bras oscillant, l'amortisseur, la chaîne
    for (const z of [-0.08, 0.08]) g.add(tube([xAr, rAr, z], [-0.1, 0.4, z * 0.8], 0.026, alu()));
    caisse.add(tube([-0.2, 0.46, 0], [-0.12, 0.78, 0], 0.035, new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.5 })));
    caisse.add(tube([xAr, rAr, -0.1], [0.06, 0.36, -0.1], 0.011, M.noir));
    // la fourche (noire), le guidon très haut et large
    avant(g, caisse, xAv, rAv, 0.52, 1.06, 0.42, new THREE.MeshStandardMaterial({ color: 0x202024, metalness: 0.6, roughness: 0.35 }));
    // le pilote, complètement debout
    piloteCross(caisse, { xPied: -0.08, yPied: 0.37, xMain: 0.48, yMain: 1.15, lMains: 0.42, debout: 1.1 }, coul, noir, blanc);
    // les roues fines aux pneus de trial
    const roues = [];
    for (const [x, r, l, j, av] of [[xAv, rAv, 0.08, 0.27, true], [xAr, rAr, 0.1, 0.235, false]]) {
      const w = Circuit.Roues.fabriquer({ rayon: r, largeur: l, jante: j, style: "rayons", pneu: "crampons", metal: alu(), etrier: [0.15, 0.15, 0.17], cote: 1 });
      w.pivot.position.set(x, r, 0);
      g.add(w.pivot);
      roues.push(Object.assign(w, { avant: av }));
    }
    return Object.assign(voiture(g, caisse, roues, 1.6), { deuxRoues: true });
  }
  const nid = () => new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 });

  Circuit.Modeles.ajouter({ crf, trial });
  return {};
})();
