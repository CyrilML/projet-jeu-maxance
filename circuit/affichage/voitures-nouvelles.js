// 🏭 LES NOUVELLES VOITURES : le bureau d'études (étape 68, redessinées à l'étape 69)
//
// ✍️ Maxance veut de nouvelles voitures : des ALLEMANDES (Audi R8, Mercedes Classe G, BMW M3, Porsche Taycan), des
// SUPERCARS (Ferrari SF90, McLaren 720S, Bugatti Bolide), des FRANÇAISES (Alpine A110, Renault 5, Citroën 2CV), des
// TOUT-TERRAIN (Land Rover Defender, Jeep Wrangler, Ford Raptor) et des VOITURES DE RÊVE (Tesla Cybertruck,
// Batmobile, DeLorean).
//
// Étape 69 : ✍️ « elles ne sont pas assez réalistes ». Alors chaque voiture est dessinée à la main, comme sur la table
// d'un bureau d'études, avec SES VRAIES MESURES (longueur, largeur, hauteur, empattement, taille des roues) :
//   - une seule PEAU, des tranches qui vont du bout de l'arrière au bout du nez : le capot, le pare-brise, le toit
//     et l'arrière ne font qu'un, et les vitres sont posées au-dessus d'une ÉPAULE (affichage/coque.js) ;
//   - des pièces MOULÉES sur la carrosserie (les phares qui épousent les coins du nez, les prises d'air, les lames) ;
//   - un HABITACLE détaillé (tableau de bord, écrans, console, sièges baquets, volant, conducteur) ;
//   - l'EMBLÈME de la marque, dessiné sur une petite toile ;
//   - les roues de chaque voiture (taille, jantes, étriers de frein) venues de l'atelier du pneumaticien.
//
// Comme toutes les autres : « nez vers x+ », posées sur y = 0, centrées en x = 0 et z = 0.

window.Circuit = window.Circuit || {};

Circuit.VoituresNouvelles = (function () {
  const O = Circuit.Modeles.outils, B = Circuit.VoituresMarques.outils;
  const { M, peinture, boite, cylindre, tube } = O;
  const { coque, arches, quatreRoues, surLeDessus, surLeFlanc, plat, auBout, portiere, echappement, ligneFlanc, optique, optiqueAuBout, grille, lettres, phareRond, plaque, voiture } = B;
  const nidAbeille = () => new THREE.MeshStandardMaterial({ map: Circuit.Textures.nidAbeille(), color: 0x9a9da2, roughness: 0.5, metalness: 0.6 });
  const inox = () => new THREE.MeshStandardMaterial({ color: 0xb9bec4, metalness: 0.88, roughness: 0.33 }); // (l'acier brossé)
  const inoxClair = () => new THREE.MeshStandardMaterial({ color: 0xd2d6db, metalness: 0.72, roughness: 0.4 }); // (étape 69 : l'acier brut, plus clair)
  const fonce = (k, f) => k.map((q) => q * (f || 0.8));

  // ================================================================ ÉTAPE 69 : LE BUREAU D'ÉTUDES
  // ✍️ « Elles ne sont pas assez réalistes » : la forme, les détails, les roues et l'intérieur. Alors chaque voiture
  // est maintenant dessinée À LA MAIN, avec ses vraies mesures, d'UNE SEULE PEAU (le capot, le pare-brise, le toit et
  // l'arrière sont la même coque, sans marche), avec une ÉPAULE sous les vitres (affichage/coque.js), un HABITACLE
  // détaillé, son EMBLÈME et ses roues à elle.

  // Une tranche de la peau : x, le bas (yb), l'épaule (yc), le dessus (yt), la largeur (w), le bord de la vitre (we),
  // le toit (wt), et des réglages en plus (wl : le bas de caisse rentré, rt : l'arrondi du toit, de : la hauteur du rebord).
  const T = (x, yb, yc, yt, w, we, wt, e) => Object.assign({ x, yb, yc, yt, w, we, wt, wl: w - 0.05, rt: 0.09, de: 0.02 }, e || {});

  // La peau d'une voiture : la carrosserie peinte et les vitres, d'un seul morceau.
  function peau(caisse, cles, R, voie, mat, vitre, ailes) {
    const c = Circuit.Coque.construire({ cles, arches: arches(R, voie), vitre, ailes: ailes === undefined ? Circuit.CONFIG.formes.ailes : ailes });
    const m = new THREE.Mesh(c.geometrie, [mat, M.vitreClaire]);
    m.castShadow = m.receiveShadow = true;
    caisse.add(m);
    passagesDeRoues(caisse, c, R, voie);
    return c;
  }
  // Étape 70 : les PASSAGES DE ROUES. Sous chaque aile, une coque noire en demi-cercle (en plastique, comme sur les
  // vraies voitures) : sinon, en regardant entre le pneu et l'aile, on voyait à travers la carrosserie.
  const MPR = {};
  function passagesDeRoues(caisse, c, R, voie) {
    const mat = MPR.m || (MPR.m = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 1, side: THREE.DoubleSide }));
    for (const r of R) {
      const rayon = r.r + 0.055, z1 = Math.max(0.05, (r.voie || voie) - r.l / 2 - 0.08), z2 = c.tranche(r.x).w + 0.05;
      const pos = [], idx = [], n = 16;
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * Math.PI, x = r.x + Math.cos(a) * rayon, y = r.r + Math.sin(a) * rayon;
        pos.push(x, y, z1, x, y, z2);
        if (k < n) idx.push(k * 2, k * 2 + 1, k * 2 + 2, k * 2 + 1, k * 2 + 3, k * 2 + 2);
      }
      for (const cote of [-1, 1]) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 2 ? v * cote : v)), 3));
        geo.setIndex(idx);
        geo.computeVertexNormals();
        caisse.add(new THREE.Mesh(geo, mat));
      }
    }
  }

  // Étape 70 : LA SILHOUETTE. Au lieu d'écrire chaque tranche à la main, on donne 5 lignes, comme sur le dessin d'un
  // designer : le PROFIL (la hauteur du dessus, vue de côté), la CEINTURE (la hauteur de l'épaule), la LARGEUR (vue
  // de dessus), le TOIT (la demi-largeur du toit) et le BAS. Chaque ligne est une liste de points [x, valeur] ; entre
  // deux points, on va tout droit. L'outil fabrique une tranche tous les 20 cm (et à chaque point donné).
  const lin = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) return pts[i][1] + ((pts[i + 1][1] - pts[i][1]) * (x - pts[i][0])) / (pts[i + 1][0] - pts[i][0]);
    return pts[pts.length - 1][1];
  };
  function silhouette(o) {
    const P = o.profil, x0 = P[0][0], x1 = P[P.length - 1][0], pas = o.pas || 0.2;
    let xs = [];
    for (let x = x0; x < x1; x += pas) xs.push(x);
    for (const l of [o.profil, o.ceinture, o.largeur, o.toit, o.bas]) for (const p of l) xs.push(p[0]);
    xs.push(x1);
    xs = xs.filter((x) => x >= x0 && x <= x1).sort((a, b) => a - b).filter((x, i, t) => i === 0 || x - t[i - 1] > 0.03);
    return xs.map((x) => {
      const w = lin(o.largeur, x), epaule = o.epaule === undefined ? 0.07 : o.epaule;
      const wt = Math.min(lin(o.toit, x), w - epaule - 0.02);
      return T(x, lin(o.bas, x), lin(o.ceinture, x), lin(o.profil, x), w, w - epaule, wt, { rt: o.rt || 0.09, de: o.de === undefined ? 0.015 : o.de, wl: w - (o.galbe === undefined ? 0.05 : o.galbe) });
    });
  }

  // La règle des vitres d'une peau d'un seul morceau : les vitres sont AU-DESSUS de l'épaule.
  // f = { pareBrise: [x du haut, x du bas], lunette: [x, x] (ou null), cotes: [x arrière, x avant] (les vitres des
  //       côtés), montants: [x…] (les montants entre les vitres), pilier (la largeur des montants du pare-brise),
  //       toitVitre: [x, x] (un toit en verre), haut (de combien la vitre s'arrête sous le toit) }
  function vitresUnies(f) {
    const p = f.pilier || 0.07;
    const dans = (x, r) => r && x > r[0] && x < r[1];
    return (centre, n, s) => {
      const [x, y, z] = centre;
      if (y < s.yc + (s.de || 0) + 0.025) return false; // (sous l'épaule : c'est la portière)
      if (Math.abs(n[2]) > 0.6) {
        if (!dans(x, f.cotes) || y > s.yt - (f.haut || 0.04)) return false;
        return !(f.montants || []).some((m) => Math.abs(x - m) < (f.largeurMontant || 0.045));
      }
      if (dans(x, f.pareBrise)) return Math.abs(z) < s.wt + ((s.we === undefined ? s.w : s.we) - s.wt) * 0.45 - p;
      if (dans(x, f.lunette)) return Math.abs(z) < s.wt - p * 0.6;
      if (dans(x, f.toitVitre)) return Math.abs(z) < s.wt - 0.12;
      return false;
    };
  }

  // ---------------------------------------------------------------- l'habitacle
  const MH = {};
  function matHabitacle(cuir, surpiqure) {
    const cle = (cuir || [0.13, 0.12, 0.12]).join(",") + (surpiqure || "");
    if (MH[cle]) return MH[cle];
    return (MH[cle] = {
      cuir: new THREE.MeshStandardMaterial({ color: new THREE.Color(...(cuir || [0.13, 0.12, 0.12])), roughness: 0.62 }),
      couture: new THREE.MeshStandardMaterial({ color: new THREE.Color(...(surpiqure || [0.75, 0.1, 0.08])), roughness: 0.5 }),
      plastique: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.75 }),
      moquette: new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 1 }),
      alu: new THREE.MeshStandardMaterial({ color: 0x9da2a8, metalness: 0.9, roughness: 0.3 }),
      ecran: new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x3b8cff, emissiveIntensity: 0.55, roughness: 0.2 }),
      compteur: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0xff5a1a, emissiveIntensity: 0.45, roughness: 0.3 }),
      peau: new THREE.MeshStandardMaterial({ color: 0xd9a77f, roughness: 0.7 }),
      pull: new THREE.MeshStandardMaterial({ color: 0x24324a, roughness: 0.85 }),
      cheveux: new THREE.MeshStandardMaterial({ color: 0x3a2a1d, roughness: 0.9 }),
      casque: new THREE.MeshPhysicalMaterial({ color: 0xf0f0f0, roughness: 0.25, clearcoat: 1 }),
    });
  }
  // o = { xPB (le bas du pare-brise), xS (le siège avant), sol (le plancher), hS (le haut de l'assise), w (la demi-largeur
  //       intérieure), tdb (le haut du tableau de bord), toit: (x) → y, rangs (1 ou 2), cuir, surpiqure, volant: "rond" |
  //       "plat" | "course" | "fin" (2CV), casque (le pilote en casque), sansConducteur }
  // Le conducteur est à gauche (côté z < 0) : on roule à droite.
  function habitacle(caisse, o) {
    const m = matHabitacle(o.cuir, o.surpiqure);
    const w = o.w, zC = -w * 0.48, xT = o.xPB - 0.12;
    const fond = o.rangs === 2 ? o.xS - 1.05 : o.xS - 0.45;
    caisse.add(boite(o.xPB - fond, 0.03, 2 * w, m.moquette, (o.xPB + fond) / 2, o.sol, 0)); // le plancher
    // le tableau de bord : un bloc, avec un bord arrondi vers les passagers, et la casquette du compteur
    const prof = 0.42, xD = xT - prof / 2;
    caisse.add(boite(prof, 0.24, 2 * w, m.plastique, xD, o.tdb - 0.12, 0));
    const bord = cylindre(0.06, 2 * w, m.plastique, 14);
    bord.rotation.x = Math.PI / 2;
    bord.position.set(xT - prof, o.tdb - 0.07, 0);
    caisse.add(bord);
    caisse.add(boite(0.36, 0.012, 2 * w - 0.02, m.cuir, xD, o.tdb + 0.002, 0)); // le dessus, recouvert de cuir
    const casquette = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 18, 1, false, 0, Math.PI), m.plastique);
    casquette.rotation.set(0, 0, Math.PI / 2);
    casquette.rotation.order = "ZYX";
    casquette.scale.set(1, 1, 0.55);
    casquette.position.set(xT - prof + 0.08, o.tdb, zC);
    caisse.add(casquette);
    const compteur = boite(0.01, 0.1, 0.26, o.volant === "fin" ? m.alu : m.ecran, xT - prof + 0.02, o.tdb + 0.01, zC);
    compteur.rotation.z = 0.25;
    caisse.add(compteur);
    if (o.volant !== "fin") {
      const ecran = boite(0.012, 0.15, 0.26, m.ecran, xT - prof + 0.03, o.tdb + 0.06, 0); // l'écran du milieu
      ecran.rotation.z = 0.2;
      caisse.add(ecran);
      for (const z of [-w + 0.1, w - 0.1]) caisse.add(boite(0.02, 0.06, 0.1, m.alu, xT - prof - 0.005, o.tdb - 0.09, z)); // les aérateurs
    }
    // la console du milieu, et le levier de vitesse
    const xC1 = xT - prof, xC2 = o.xS - 0.25;
    if (xC1 > xC2) {
      caisse.add(boite(xC1 - xC2, o.hS - o.sol + 0.06, 0.24, m.plastique, (xC1 + xC2) / 2, (o.hS + o.sol) / 2 + 0.03, 0));
      caisse.add(boite(xC1 - xC2 - 0.05, 0.01, 0.2, m.alu, (xC1 + xC2) / 2, o.hS + 0.065, 0));
      caisse.add(tube([o.xS + 0.25, o.hS + 0.06, 0], [o.xS + 0.27, o.hS + 0.16, 0], 0.012, m.alu));
      const pommeau = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 8), m.cuir);
      pommeau.position.set(o.xS + 0.27, o.hS + 0.17, 0);
      caisse.add(pommeau);
    }
    // les sièges baquets : une assise avec ses bourrelets, un dossier penché (lui aussi avec ses bourrelets), un appui-tête
    const largeurSiege = Math.min(0.54, w * 0.86);
    const siege = (x, z, hauteur) => {
      caisse.add(boite(0.5, 0.1, largeurSiege - 0.1, m.cuir, x + 0.02, hauteur - 0.05, z));
      for (const dz of [-1, 1]) caisse.add(boite(0.5, 0.14, 0.07, m.cuir, x + 0.02, hauteur - 0.03, z + dz * (largeurSiege / 2 - 0.035)));
      const dossier = new THREE.Group();
      dossier.add(boite(0.1, 0.6, largeurSiege - 0.1, m.cuir, 0, 0.3, 0));
      for (const dz of [-1, 1]) dossier.add(boite(0.15, 0.5, 0.07, m.cuir, 0.03, 0.27, dz * (largeurSiege / 2 - 0.035)));
      dossier.add(boite(0.104, 0.5, 0.012, m.couture, 0.002, 0.28, 0)); // la couture du milieu
      dossier.add(boite(0.09, 0.15, 0.24, m.cuir, -0.01, 0.72, 0)); // l'appui-tête
      dossier.position.set(x - 0.24, hauteur - 0.06, z);
      const place = o.toit(x - 0.4) - 0.04 - (hauteur - 0.06); // (le dossier ne doit pas sortir par le toit)
      if (place < 0.8) dossier.scale.y = Math.max(0.5, place / 0.8);
      dossier.rotation.z = 0.24;
      caisse.add(dossier);
    };
    siege(o.xS, zC, o.hS);
    siege(o.xS, -zC, o.hS);
    if (o.rangs === 2) {
      // la banquette arrière, un peu plus haute
      const xB = o.xS - 0.82, hDos = Math.min(0.55, o.toit(xB - 0.3) - o.hS - 0.12);
      caisse.add(boite(0.48, 0.12, 2 * w - 0.12, m.cuir, xB, o.hS - 0.02, 0));
      const dos = boite(0.12, hDos, 2 * w - 0.12, m.cuir, xB - 0.27, o.hS + hDos / 2 - 0.02, 0);
      dos.rotation.z = 0.22;
      caisse.add(dos);
      if (hDos > 0.45) for (const z of [-w * 0.55, 0, w * 0.55]) caisse.add(boite(0.08, 0.13, 0.22, m.cuir, xB - 0.35, o.hS + hDos + 0.06, z));
    }
    // les panneaux des portières (avec l'accoudoir)
    for (const cote of [-1, 1]) {
      caisse.add(boite(o.xPB - 0.2 - (o.xS - 0.4), 0.012, 0.012, m.alu, (o.xPB - 0.2 + o.xS - 0.4) / 2, o.hS + 0.2, cote * (w - 0.02)));
      caisse.add(boite(0.4, 0.05, 0.08, m.cuir, o.xS + 0.15, o.hS + 0.12, cote * (w - 0.05)));
    }
    // le volant : la jante, 3 branches, le moyeu (avec le coussin d'air) et la colonne
    const xV = o.xS + 0.5, yV = o.hS + 0.36;
    const volant = new THREE.Group();
    const R = o.volant === "fin" ? 0.2 : 0.175;
    if (o.volant === "plat" || o.volant === "course") {
      const forme = new THREE.Shape();
      forme.absarc(0, 0, R, -Math.PI * 0.82, Math.PI * 1.82 - Math.PI, false);
      const jante = new THREE.Mesh(new THREE.TorusGeometry(R, 0.02, 8, 30, Math.PI * 1.64), m.cuir);
      jante.rotation.z = -Math.PI * 0.32;
      volant.add(jante);
      volant.add(boite(0.03, 0.04, R * 1.5, m.cuir, 0, -R * 0.82, 0).rotateX(0)); // le bas plat
    } else {
      volant.add(new THREE.Mesh(new THREE.TorusGeometry(R, o.volant === "fin" ? 0.012 : 0.02, 8, 30), o.volant === "fin" ? m.plastique : m.cuir));
    }
    for (const a of [0, Math.PI * 0.95, Math.PI * 1.55]) {
      const branche = boite(R * 0.95, 0.03, 0.012, o.volant === "fin" ? m.alu : m.plastique, Math.cos(a + Math.PI) * R * 0.45, Math.sin(a + Math.PI) * R * 0.45, 0);
      branche.rotation.z = a;
      volant.add(branche);
    }
    const moyeu = cylindre(0.06, 0.05, m.plastique, 16);
    moyeu.rotation.x = Math.PI / 2;
    volant.add(moyeu);
    volant.rotation.y = Math.PI / 2;
    volant.rotateX(0); // (le volant regarde le conducteur…)
    const support = new THREE.Group();
    support.add(volant);
    support.position.set(xV, yV, zC);
    support.rotation.z = -0.35; // (… et il est penché, comme dans une vraie voiture)
    caisse.add(support);
    caisse.add(tube([xV + 0.03, yV - 0.01, zC], [xT - prof + 0.05, o.tdb - 0.1, zC], 0.03, m.plastique));
    if (o.sansConducteur) return;
    // le conducteur : son buste penché, sa tête (sous le toit !), ses bras sur le volant, ses jambes vers les pédales
    const xTete = o.xS - 0.18, yTete = Math.min(o.hS + 0.66, o.toit(xTete) - 0.14);
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, Math.max(0.12, yTete - o.hS - 0.5), 4, 10), m.pull);
    buste.position.set(o.xS - 0.1, (o.hS + yTete) / 2 - 0.08, zC);
    buste.rotation.z = 0.24;
    buste.scale.set(0.75, 1, 1.1);
    caisse.add(buste);
    if (o.casque) {
      const casque = new THREE.Mesh(new THREE.SphereGeometry(0.135, 18, 12), m.casque);
      casque.position.set(xTete, yTete, zC);
      caisse.add(casque);
      const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.137, 18, 8, -0.9, 1.8, 1.1, 0.7), M.vitre);
      visiere.rotation.y = Math.PI / 2;
      visiere.position.set(xTete, yTete, zC);
      caisse.add(visiere);
    } else {
      const tete = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), m.peau);
      tete.scale.set(1.05, 1.15, 0.95);
      tete.position.set(xTete, yTete, zC);
      caisse.add(tete);
      const cheveux = new THREE.Mesh(new THREE.SphereGeometry(0.106, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), m.cheveux);
      cheveux.scale.set(1.05, 1.15, 0.95);
      cheveux.position.set(xTete - 0.015, yTete + 0.012, zC);
      caisse.add(cheveux);
    }
    for (const dz of [-0.18, 0.18]) {
      const epaule = [o.xS - 0.12, yTete - 0.24, zC + dz], coude = [(o.xS + xV) / 2, yV - 0.1, zC + dz * 1.05], main = [xV - 0.02, yV + 0.02, zC + dz * 0.85];
      caisse.add(tube(epaule, coude, 0.042, m.pull));
      caisse.add(tube(coude, main, 0.036, m.pull));
      const poing = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), m.peau);
      poing.position.set(...main);
      caisse.add(poing);
      caisse.add(tube([o.xS + 0.05, o.hS + 0.05, zC + dz * 0.6], [o.xS + 0.45, o.hS + 0.1, zC + dz * 0.6], 0.06, m.pull)); // les cuisses
      caisse.add(tube([o.xS + 0.45, o.hS + 0.1, zC + dz * 0.6], [Math.min(o.xPB - 0.1, o.xS + 0.8), o.sol + 0.05, zC + dz * 0.6], 0.05, m.pull)); // les jambes
    }
  }

  // ---------------------------------------------------------------- les emblèmes
  // Chaque marque a son emblème, dessiné sur une petite toile (un « canvas ») avec un fond transparent.
  const LOGOS = {
    audi(ctx) {
      ctx.strokeStyle = "#e9ecef"; ctx.lineWidth = 22;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(104 + i * 101, 256, 82, 0, Math.PI * 2); ctx.stroke(); }
    },
    mercedes(ctx) {
      ctx.strokeStyle = "#eceff2"; ctx.fillStyle = "#eceff2"; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.arc(256, 256, 220, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 3, b1 = a + Math.PI / 2, b2 = a - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214);
        ctx.lineTo(256 + Math.cos(b1) * 22, 256 + Math.sin(b1) * 22); ctx.lineTo(256 + Math.cos(b2) * 22, 256 + Math.sin(b2) * 22); ctx.fill();
      }
    },
    bmw(ctx) {
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(256, 256, 240, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c9cdd2"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(256, 256, 236, 0, Math.PI * 2); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = k % 2 ? "#ffffff" : "#1c69d4";
        ctx.beginPath(); ctx.moveTo(256, 256); ctx.arc(256, 256, 150, (k * Math.PI) / 2 - Math.PI / 2, ((k + 1) * Math.PI) / 2 - Math.PI / 2); ctx.fill();
      }
      ctx.fillStyle = "#fff"; ctx.font = "bold 62px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      [["B", -0.75], ["M", 0], ["W", 0.75]].forEach(([l, a]) => { ctx.save(); ctx.translate(256 + Math.sin(a) * 192, 256 - Math.cos(a) * 192); ctx.rotate(a); ctx.fillText(l, 0, 0); ctx.restore(); });
    },
    porsche(ctx) {
      ctx.fillStyle = "#d4a52a"; ctx.beginPath(); ctx.moveTo(116, 70); ctx.lineTo(396, 70); ctx.lineTo(396, 300); ctx.quadraticCurveTo(396, 420, 256, 470); ctx.quadraticCurveTo(116, 420, 116, 300); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#b31b1b"; ctx.fillRect(150, 200, 90, 26); ctx.fillRect(272, 300, 90, 26); ctx.fillRect(150, 300, 90, 26); ctx.fillRect(272, 200, 90, 26);
      ctx.fillStyle = "#111"; ctx.fillRect(150, 236, 90, 22); ctx.fillRect(272, 336, 90, 22);
      ctx.fillStyle = "#f2d36b"; ctx.beginPath(); ctx.arc(256, 280, 46, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.font = "bold 40px Arial"; ctx.textAlign = "center"; ctx.fillText("PORSCHE", 256, 140);
    },
    ferrari(ctx) {
      ctx.fillStyle = "#ffd200"; ctx.beginPath(); ctx.moveTo(130, 40); ctx.lineTo(382, 40); ctx.lineTo(382, 330); ctx.quadraticCurveTo(382, 430, 256, 480); ctx.quadraticCurveTo(130, 430, 130, 330); ctx.closePath(); ctx.fill();
      for (const [x, c] of [[130, "#009246"], [214, "#ffffff"], [298, "#ce2b37"]]) { ctx.fillStyle = c; ctx.fillRect(x, 40, 84, 50); }
      ctx.fillStyle = "#111"; ctx.font = "bold 250px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("♞", 256, 285);
    },
    mclaren(ctx) {
      ctx.fillStyle = "#ff8000"; ctx.beginPath(); ctx.moveTo(60, 330); ctx.quadraticCurveTo(300, 120, 470, 170); ctx.quadraticCurveTo(320, 190, 120, 330); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e9ecef"; ctx.font = "bold 70px Arial"; ctx.textAlign = "center"; ctx.fillText("McLAREN", 256, 420);
    },
    bugatti(ctx) {
      ctx.fillStyle = "#c8102e"; ctx.beginPath(); ctx.ellipse(256, 256, 236, 150, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#f0f0f0"; ctx.lineWidth = 14; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 92px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("BUGATTI", 256, 270);
    },
    alpine(ctx) {
      ctx.fillStyle = "#0a4ea8"; ctx.beginPath(); ctx.arc(256, 256, 230, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(150, 380); ctx.lineTo(256, 120); ctx.lineTo(362, 380); ctx.moveTo(190, 290); ctx.lineTo(380, 250); ctx.stroke();
    },
    renault(ctx) {
      ctx.strokeStyle = "#eceff2"; ctx.lineWidth = 34;
      ctx.beginPath(); ctx.moveTo(256, 40); ctx.lineTo(400, 256); ctx.lineTo(256, 472); ctx.lineTo(112, 256); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(256, 140); ctx.lineTo(332, 256); ctx.lineTo(256, 372); ctx.lineTo(180, 256); ctx.closePath(); ctx.stroke();
    },
    citroen(ctx) {
      ctx.strokeStyle = "#eceff2"; ctx.lineWidth = 48; ctx.lineJoin = "round";
      for (const y of [210, 330]) { ctx.beginPath(); ctx.moveTo(90, y + 50); ctx.lineTo(256, y - 60); ctx.lineTo(422, y + 50); ctx.stroke(); }
    },
    landrover(ctx) {
      ctx.fillStyle = "#0b5a2c"; ctx.beginPath(); ctx.ellipse(256, 256, 240, 120, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#c0c4c8"; ctx.lineWidth = 12; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "bold 66px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("LAND ROVER", 256, 262, 420);
    },
    jeep(ctx) { ctx.fillStyle = "#e9ecef"; ctx.font = "bold 190px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Jeep", 256, 262); },
    ford(ctx) {
      ctx.fillStyle = "#0b2f6b"; ctx.beginPath(); ctx.ellipse(256, 256, 240, 130, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#d8dce0"; ctx.lineWidth = 12; ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = "italic bold 150px Georgia, serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Ford", 256, 262);
    },
    tesla(ctx) {
      ctx.fillStyle = "#e9ecef"; ctx.beginPath(); ctx.moveTo(60, 110); ctx.quadraticCurveTo(256, 50, 452, 110); ctx.lineTo(440, 150); ctx.quadraticCurveTo(256, 110, 72, 150); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(220, 150); ctx.lineTo(292, 150); ctx.lineTo(266, 470); ctx.lineTo(246, 470); ctx.closePath(); ctx.fill();
    },
    batman(ctx) {
      ctx.fillStyle = "#f5c518"; ctx.beginPath(); ctx.ellipse(256, 256, 246, 150, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath();
      ctx.moveTo(30, 230); ctx.quadraticCurveTo(110, 170, 150, 140); ctx.quadraticCurveTo(160, 200, 220, 210); ctx.lineTo(236, 160); ctx.lineTo(248, 190); ctx.lineTo(264, 190); ctx.lineTo(276, 160); ctx.lineTo(292, 210);
      ctx.quadraticCurveTo(352, 200, 362, 140); ctx.quadraticCurveTo(402, 170, 482, 230); ctx.quadraticCurveTo(420, 250, 400, 320); ctx.quadraticCurveTo(360, 280, 320, 300); ctx.quadraticCurveTo(280, 320, 256, 380);
      ctx.quadraticCurveTo(232, 320, 192, 300); ctx.quadraticCurveTo(152, 280, 112, 320); ctx.quadraticCurveTo(92, 250, 30, 230); ctx.fill();
    },
    delorean(ctx) { ctx.fillStyle = "#e9ecef"; ctx.font = "bold 170px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("DMC", 256, 262); },
  };
  const texturesLogo = {};
  function embleme(nom, taille, hauteur) {
    if (!texturesLogo[nom]) {
      const toile = document.createElement("canvas");
      toile.width = toile.height = 512;
      LOGOS[nom](toile.getContext("2d"));
      const t = new THREE.CanvasTexture(toile);
      t.colorSpace = THREE.SRGBColorSpace;
      texturesLogo[nom] = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, metalness: 0.55, roughness: 0.3 });
    }
    return new THREE.Mesh(new THREE.PlaneGeometry(taille, hauteur || taille), texturesLogo[nom]);
  }
  // Un emblème sur le bout (l'avant ou l'arrière), ou couché sur le dessus (le capot).
  // (avance : de combien il dépasse du bout, pour passer devant une calandre posée elle aussi sur le bout)
  function emblemeAuBout(caisse, c, nom, avant, y, taille, hauteur, z, avance) {
    const e = embleme(nom, taille, hauteur);
    e.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    const d = 0.008 + (avance || 0);
    e.position.set(avant ? c.xMax + d : c.xMin - d, y, z || 0);
    caisse.add(e);
    return e;
  }
  function emblemeDessus(caisse, c, nom, x, taille, hauteur) {
    const e = embleme(nom, taille, hauteur);
    e.geometry.rotateX(-Math.PI / 2);
    e.geometry.rotateY(-Math.PI / 2); // (le haut du dessin vers l'arrière : on le lit en regardant la voiture de face)
    caisse.add(surLeDessus(e, c, x, 0, 0.004));
    return e;
  }

  // ---------------------------------------------------------------- les pièces collées sur le flanc
  // Où est la peau du flanc en (x, y) ? Comme dans affichage/voitures-marques.js, mais en comptant aussi les ailes
  // bombées au-dessus des roues (sinon une pièce posée près d'une roue s'enfoncerait dans l'aile).
  function flancIci(c, R, x, y) {
    const s = c.tranche(x), wl = s.wl === undefined ? s.w : s.wl;
    const t = Math.max(0, Math.min(1, (y - s.yb) / Math.max(0.05, s.yc - s.yb)));
    let z = wl + (s.w - wl) * Math.sin((t * Math.PI) / 2);
    for (const r of R) z += Math.exp(-Math.pow((x - r.x) / ((r.r + 0.045) * 1.6), 2)) * Circuit.CONFIG.formes.ailes * (0.7 + 0.3 * t);
    return z;
  }
  // Une pièce à 4 coins collée sur le flanc (une prise d'air, une lame de couleur…) : coins = [[x, y] × 4], dans l'ordre
  // arrière-bas, avant-bas, avant-haut, arrière-haut. Elle suit les courbes de la carrosserie.
  function pieceFlanc(caisse, c, R, coins, materiau, decale) {
    const nx = 12, ny = 8;
    for (const cote of [-1, 1]) {
      const pos = [], idx = [], uv = [];
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const u = i / nx, v = j / ny;
          const bas = [coins[0][0] + (coins[1][0] - coins[0][0]) * u, coins[0][1] + (coins[1][1] - coins[0][1]) * u];
          const haut = [coins[3][0] + (coins[2][0] - coins[3][0]) * u, coins[3][1] + (coins[2][1] - coins[3][1]) * u];
          const x = bas[0] + (haut[0] - bas[0]) * v, y = bas[1] + (haut[1] - bas[1]) * v;
          pos.push(x, y, cote * (flancIci(c, R, x, y) + (decale || 0.008)));
          uv.push(u * 3, v * 2);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
          if (cote > 0) idx.push(a, b, d, b, e, d);
          else idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, materiau);
      m.receiveShadow = true;
      caisse.add(m);
    }
  }
  // Une pièce à 4 coins posée SUR LE DESSUS (le capot, les ailes, le coin du nez) : coins = [[x, z] × 4]. Elle suit les
  // bosses de la carrosserie. Elle est recopiée de l'autre côté (z → −z), sauf si miroir === false.
  function pieceDessus(caisse, c, coins, materiau, decale, miroir) {
    const nx = 10, ny = 6;
    for (const cote of miroir === false ? [1] : [1, -1]) {
      const pos = [], idx = [], uv = [];
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const u = i / nx, v = j / ny;
          const a = [coins[0][0] + (coins[1][0] - coins[0][0]) * u, coins[0][1] + (coins[1][1] - coins[0][1]) * u];
          const b = [coins[3][0] + (coins[2][0] - coins[3][0]) * u, coins[3][1] + (coins[2][1] - coins[3][1]) * u];
          const x = a[0] + (b[0] - a[0]) * v, z = (a[1] + (b[1] - a[1]) * v) * cote;
          pos.push(x, c.dessus(x, z) + (decale || 0.006), z);
          uv.push(u, v);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
          idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      // (les triangles doivent regarder vers le haut : sinon on les retourne)
      if (geo.attributes.normal.getY(Math.floor(geo.attributes.normal.count / 2)) < 0) {
        const t = geo.index.array;
        for (let k = 0; k < t.length; k += 3) [t[k + 1], t[k + 2]] = [t[k + 2], t[k + 1]];
        geo.computeVertexNormals();
      }
      const m = new THREE.Mesh(geo, materiau);
      m.receiveShadow = true;
      caisse.add(m);
    }
  }
  // Un PHARE moulé dans la carrosserie : le boîtier sombre (contour), des lignes de LED, et le verre par-dessus.
  // contour = [[x, z] × 4] ; leds = une liste de contours (des bandes fines) ; tout est recopié de l'autre côté.
  function pharePose(caisse, c, contour, leds) {
    pieceDessus(caisse, c, contour, M.boitier, 0.008);
    for (const l of leds) pieceDessus(caisse, c, l, M.led, 0.013);
    pieceDessus(caisse, c, contour, M.lentille, 0.02);
  }
  // Une bande fine (une LED) de (x1, z1) à (x2, z2), de largeur e.
  const bande = (x1, z1, x2, z2, e) => {
    const l = Math.hypot(x2 - x1, z2 - z1) || 1, nx = (-(z2 - z1) / l) * (e / 2), nz = ((x2 - x1) / l) * (e / 2);
    return [[x1 - nx, z1 - nz], [x2 - nx, z2 - nz], [x2 + nx, z2 + nz], [x1 + nx, z1 + nz]];
  };
  // Une ligne sur le flanc (un pli, un jonc) qui suit aussi les ailes.
  function traitFlanc(caisse, c, R, points, rayon, materiau) {
    for (const cote of [-1, 1]) {
      const courbe = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, cote * (flancIci(c, R, x, y) + rayon * 0.4))));
      caisse.add(new THREE.Mesh(new THREE.TubeGeometry(courbe, points.length * 10, rayon, 6, false), materiau));
    }
  }
  // Une prise d'air : le trou noir (presque sans reflet), avec des ailettes dedans.
  const MP = {};
  const trou = () => MP.trou || (MP.trou = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.95 }));
  const carbone = () => MP.carbone || (MP.carbone = new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.35, metalness: 0.4 }));

  // ---------------------------------------------------------------- étape 70 : les finitions
  // ✍️ « Encore plus de détails » : sur chaque voiture, ce qu'on remarque quand on s'approche d'une vraie. Les plaques
  // (quand elle n'en avait pas), les répétiteurs de clignotants sur les ailes avant, l'antenne « aileron de requin »,
  // les capteurs de stationnement (de petits ronds dans les pare-chocs), et la caméra de recul.
  // o = { plaque: [texte, y avant, y arrière] (facultatif), repetiteur: [x, y], antenne: x, capteurs: [y avant, y arrière, demi-largeur] }
  function finitions(caisse, c, R, o) {
    if (o.plaque) {
      plaque(caisse, c, true, o.plaque[1], o.plaque[0]);
      plaque(caisse, c, false, o.plaque[2], o.plaque[0]);
    }
    if (o.repetiteur) {
      const [x, y] = o.repetiteur;
      pieceFlanc(caisse, c, R, [[x - 0.05, y - 0.012], [x + 0.05, y - 0.012], [x + 0.05, y + 0.012], [x - 0.05, y + 0.012]], M.orange, 0.012);
    }
    if (o.antenne !== undefined) {
      const forme = new THREE.Shape();
      forme.moveTo(0, 0); forme.lineTo(0.16, 0); forme.quadraticCurveTo(0.04, 0.02, 0.02, 0.06); forme.closePath();
      const geo = new THREE.ExtrudeGeometry(forme, { depth: 0.035, bevelEnabled: false });
      geo.translate(-0.08, 0, -0.0175);
      const m = new THREE.Mesh(geo, M.noir);
      m.position.set(o.antenne, c.dessus(o.antenne, 0) - 0.005, 0);
      caisse.add(m);
    }
    if (o.capteurs) {
      const [yAv, yAr, l] = o.capteurs;
      for (const [avant, y] of [[true, yAv], [false, yAr]]) {
        for (const z of [-l, -l / 3, l / 3, l]) {
          const capteur = cylindre(0.012, 0.01, M.noir, 10);
          capteur.rotation.z = Math.PI / 2;
          capteur.position.set(avant ? c.xMax + 0.004 : c.xMin - 0.004, y, z);
          caisse.add(capteur);
        }
      }
      const camera = cylindre(0.012, 0.012, M.vitre, 10);
      camera.rotation.z = Math.PI / 2;
      camera.position.set(c.xMin - 0.006, yAr + 0.25, 0.08);
      caisse.add(camera);
    }
  }

  // ---------------------------------------------------------------- les petits détails
  // Les essuie-glaces, couchés au bas du pare-brise.
  function essuieGlaces(caisse, c, x, longueur, deux) {
    for (const z of deux === false ? [0] : [-0.32, 0.18]) {
      const bras = surLeDessus(plat(0.018, longueur, M.noir, 0.012), c, x - 0.02, z, 0.01);
      bras.rotateY(0.18);
      caisse.add(bras);
    }
  }
  // Une poignée affleurante (posée sur le flanc, à peine en relief).
  function poignees(caisse, c, x, y, longueur, materiau) {
    for (const cote of [-1, 1]) surLeFlanc(caisse, c, x, y, cote, longueur || 0.22, 0.035, materiau || M.noir, 0.01);
  }
  // Un rétroviseur moderne : un bras, une coque en goutte d'eau et le miroir.
  function retro(caisse, x, y, zBase, materiau, taille) {
    const k = taille || 1;
    for (const cote of [-1, 1]) {
      caisse.add(tube([x, y - 0.04, cote * zBase], [x - 0.05, y, cote * (zBase + 0.08 * k)], 0.016, M.noir));
      const coqueR = new THREE.Mesh(new THREE.SphereGeometry(0.07 * k, 16, 10), materiau);
      coqueR.scale.set(0.9, 0.62, 1.55);
      coqueR.position.set(x - 0.06, y + 0.03, cote * (zBase + 0.16 * k));
      coqueR.castShadow = true;
      caisse.add(coqueR);
      caisse.add(boite(0.006, 0.07 * k, 0.17 * k, M.chrome, x - 0.12 * k, y + 0.03, cote * (zBase + 0.16 * k)));
    }
  }
  // Un diffuseur (sous l'arrière) : des ailettes noires.
  function diffuseur(caisse, c, y, largeur, ailettes) {
    caisse.add(boite(0.4, 0.02, largeur, M.plastique, c.xMin + 0.16, y - 0.06, 0));
    for (let i = 0; i < ailettes; i++) caisse.add(boite(0.36, 0.12, 0.012, M.plastique, c.xMin + 0.14, y, -largeur / 2 + (largeur * (i + 0.5)) / ailettes));
  }
  // Le bas de caisse noir, et une fine lame de couleur dessous.
  function basDeCaisse(caisse, c, xAv, xAr, y, couleur) {
    for (const cote of [-1, 1]) ligneFlanc(caisse, c, [[xAv, y + 0.02], [(xAv + xAr) / 2, y], [xAr, y + 0.02]], 0.03, couleur || M.plastique, cote);
  }
  const roues4 = (g, R, voie, style, options) => quatreRoues(g, R, voie, Object.assign({ style, metal: M.jante }, options || {}));

  // ================================================================ ÉTAPE 69 : LES VOITURES REDESSINÉES

  // 🇩🇪 Audi R8 V10 (4,43 m × 1,94 m × 1,24 m, empattement 2,65 m). Le moteur au milieu (sous la vitre derrière les
  // sièges), les « sideblades » (les grandes lames de couleur derrière les portières), la calandre « Singleframe » en
  // nid d'abeille, les phares à LED en biseau, la barre de feux et les 2 grosses sorties ovales.
  function audiR8(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.3, r: 0.33, l: 0.25, j: 0.254 }, { x: -1.35, r: 0.345, l: 0.3, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.215, 0.3, 0.86, 0.88, 0.84, 0.8, 0.62, { rt: 0.06 }),
      T(-2.12, 0.22, 0.92, 0.95, 0.91, 0.86, 0.66),
      T(-1.8, 0.15, 0.95, 0.98, 0.94, 0.9, 0.66),
      T(-1.35, 0.13, 0.95, 1.04, 0.95, 0.9, 0.6),
      T(-1.0, 0.12, 0.92, 1.11, 0.94, 0.86, 0.55),
      T(-0.6, 0.12, 0.88, 1.2, 0.92, 0.8, 0.56),
      T(-0.2, 0.12, 0.87, 1.24, 0.91, 0.79, 0.58),
      T(0.25, 0.12, 0.86, 1.19, 0.92, 0.8, 0.6),
      T(0.6, 0.12, 0.84, 1.02, 0.93, 0.82, 0.64),
      T(0.92, 0.12, 0.81, 0.82, 0.94, 0.86, 0.68, { de: 0.01 }),
      T(1.3, 0.12, 0.74, 0.71, 0.95, 0.9, 0.64, { de: 0.01 }),
      T(1.8, 0.13, 0.66, 0.64, 0.93, 0.88, 0.6, { de: 0.01 }),
      T(2.08, 0.16, 0.57, 0.58, 0.88, 0.84, 0.6, { de: 0.01 }),
      T(2.18, 0.19, 0.51, 0.53, 0.82, 0.78, 0.57, { de: 0.01, rt: 0.08 }),
      T(2.215, 0.22, 0.47, 0.49, 0.74, 0.7, 0.53, { de: 0.01, rt: 0.08 }),
    ], R, 0.82, peinture(k1), vitresUnies({ pareBrise: [0.25, 0.9], cotes: [-0.5, 0.88], lunette: [-1.65, -0.62], pilier: 0.08 }), 0);
    habitacle(caisse, { xPB: 0.88, xS: -0.15, sol: 0.18, hS: 0.32, w: 0.62, tdb: 0.82, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.1], surpiqure: [0.8, 0.08, 0.06], volant: "plat" });
    // les sideblades : la lame de couleur derrière la portière, et sa prise d'air
    pieceFlanc(caisse, c, R, [[-1.0, 0.24], [-0.56, 0.24], [-0.44, 0.86], [-0.86, 0.88]], peinture(k2), 0.006);
    pieceFlanc(caisse, c, R, [[-0.96, 0.42], [-0.72, 0.42], [-0.66, 0.76], [-0.86, 0.78]], trou(), 0.01);
    for (let i = 0; i < 4; i++) pieceFlanc(caisse, c, R, [[-0.95 + i * 0.012, 0.47 + i * 0.07], [-0.71 + i * 0.012, 0.47 + i * 0.07], [-0.71 + i * 0.012, 0.49 + i * 0.07], [-0.95 + i * 0.012, 0.49 + i * 0.07]], carbone(), 0.014);
    traitFlanc(caisse, c, R, [[1.75, 0.52], [1.0, 0.6], [0.2, 0.66], [-0.4, 0.7]], 0.006, peinture(fonce(k1, 0.75)));
    // l'avant : la calandre « Singleframe » (un hexagone large), les prises d'air sur les côtés, les phares en biseau
    const forme = [[-0.3, 0.1], [0.3, 0.1], [0.36, 0], [0.27, -0.11], [-0.27, -0.11], [-0.36, 0]];
    const calandre = new THREE.Shape();
    forme.forEach(([a2, b2], i) => (i ? calandre.lineTo(a2, b2) : calandre.moveTo(a2, b2)));
    const singleframe = new THREE.Mesh(new THREE.ShapeGeometry(calandre), nidAbeille());
    singleframe.rotation.y = Math.PI / 2;
    singleframe.position.set(c.xMax + 0.006, 0.35, 0);
    caisse.add(singleframe);
    const cadre = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(forme.map(([a2, b2]) => new THREE.Vector3(0, b2, -a2)), true, "catmullrom", 0.05), 48, 0.009, 6, true), M.chrome);
    cadre.position.set(c.xMax + 0.008, 0.35, 0);
    caisse.add(cadre);
    emblemeAuBout(caisse, c, "audi", true, 0.47, 0.26, 0.07, 0, 0.01);
    for (const cote of [-1, 1]) {
      const prise = auBout(caisse, c, true, 0.33, cote * 0.55, 0.17, 0.24, trou(), 0.012);
      prise.rotation.x = cote * 0.15;
    }
    // les phares en biseau, sur les coins du nez : le boîtier, la ligne de LED du feu de jour, et 3 lampes
    pharePose(caisse, c, [[1.76, 0.9], [2.19, 0.7], [2.17, 0.5], [1.82, 0.66]], [
      bande(1.79, 0.86, 2.17, 0.67, 0.022), bande(1.88, 0.74, 1.95, 0.71, 0.06), bande(1.98, 0.69, 2.05, 0.66, 0.06), bande(2.08, 0.64, 2.14, 0.6, 0.06)]);
    auBout(caisse, c, true, 0.235, 0, 0.03, 1.3, carbone(), 0.06); // la lame du bas
    // l'arrière : la grille du moteur, la barre de feux, les feux en biseau, le diffuseur, 2 sorties ovales
    optiqueAuBout(caisse, c, false, 0.82, 0, 0.025, 1.45, [[0, 0, 0.01, 1.41]], "feu");
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.76, cote * 0.58, 0.09, 0.4, [[0.02, 0, 0.02, 0.36], [-0.02, 0, 0.02, 0.28]], "feu");
    auBout(caisse, c, false, 0.55, 0, 0.2, 1.36, trou(), 0.012);
    grille(caisse, c, false, 0.55, 0, 0.17, 1.3);
    emblemeAuBout(caisse, c, "audi", false, 0.68, 0.24, 0.065);
    lettres(caisse, c, false, 0.42, 0.55, "R8", 0.14, 0.06);
    diffuseur(caisse, c, 0.3, 1.2, 7);
    for (const cote of [-1, 1]) {
      const sortie = cylindre(0.06, 0.12, M.chrome, 24);
      sortie.rotation.z = Math.PI / 2;
      sortie.scale.set(1, 1, 1.6);
      sortie.position.set(c.xMin - 0.03, 0.36, cote * 0.55);
      caisse.add(sortie);
      const fond = cylindre(0.05, 0.13, trou(), 24);
      fond.rotation.z = Math.PI / 2;
      fond.scale.set(1, 1, 1.6);
      fond.position.set(c.xMin - 0.035, 0.36, cote * 0.55);
      caisse.add(fond);
    }
    essuieGlaces(caisse, c, 0.86, 0.5);
    poignees(caisse, c, -0.18, 0.79, 0.16);
    retro(caisse, 0.62, 0.92, 0.79, peinture(k2), 0.95);
    basDeCaisse(caisse, c, 0.9, -0.95, 0.2);
    portiere(caisse, c, 0.88, -0.46, 0.22, 0.82, false);
    finitions(caisse, c, R, { plaque: ["R8-V10-AU", 0.24, 0.5], repetiteur: [1.62, 0.6], capteurs: [0.27, 0.3, 0.5] }); // (étape 70)
    const roues = roues4(g, R, 0.82, "y", { etrier: [0.75, 0.06, 0.06] });
    return voiture(g, caisse, roues, 1.05);
  }

  // 🇮🇹 Ferrari SF90 Stradale (4,71 m × 1,97 m × 1,19 m, empattement 2,65 m). Hybride, la cabine très en avant,
  // le nez fin entre deux grosses ailes, les phares en lame avec la prise d'air en dessous, le haut de l'arrière
  // en « shut-off Gurney » (la lame qui monte), 4 feux carrés et 2 sorties hautes.
  function ferrariSF90(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.38, r: 0.33, l: 0.255, j: 0.254 }, { x: -1.27, r: 0.345, l: 0.315, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.355, 0.32, 0.92, 0.94, 0.88, 0.84, 0.66, { rt: 0.05 }),
      T(-2.25, 0.24, 0.98, 1.0, 0.94, 0.9, 0.7),
      T(-1.85, 0.16, 0.98, 1.0, 0.98, 0.93, 0.68),
      T(-1.27, 0.13, 0.95, 1.0, 0.98, 0.92, 0.58),
      T(-0.85, 0.12, 0.9, 1.06, 0.95, 0.86, 0.54),
      T(-0.45, 0.12, 0.86, 1.15, 0.93, 0.79, 0.55),
      T(-0.05, 0.12, 0.84, 1.19, 0.92, 0.78, 0.57),
      T(0.4, 0.12, 0.82, 1.12, 0.93, 0.8, 0.6),
      T(0.75, 0.12, 0.79, 0.94, 0.94, 0.83, 0.64),
      T(1.05, 0.12, 0.76, 0.76, 0.96, 0.88, 0.62, { de: 0.01 }),
      T(1.38, 0.12, 0.74, 0.66, 0.98, 0.92, 0.55, { de: 0.01 }),
      T(1.85, 0.13, 0.64, 0.56, 0.95, 0.9, 0.5, { de: 0.01 }),
      T(2.2, 0.15, 0.51, 0.47, 0.86, 0.8, 0.5, { de: 0.01 }),
      T(2.355, 0.19, 0.43, 0.41, 0.74, 0.7, 0.46, { de: 0.01, rt: 0.06 }),
    ], R, 0.84, peinture(k1), vitresUnies({ pareBrise: [0.3, 0.98], cotes: [-0.55, 0.95], pilier: 0.085 }));
    habitacle(caisse, { xPB: 0.95, xS: -0.2, sol: 0.17, hS: 0.3, w: 0.6, tdb: 0.8, toit: (x) => c.tranche(x).yt, cuir: [0.12, 0.1, 0.09], surpiqure: [0.9, 0.75, 0.1], volant: "course" });
    // le « S-duct » : l'air rentre sous le nez et ressort par une fente noire sur le capot
    caisse.add(surLeDessus(plat(0.12, 0.62, trou(), 0.01), c, 2.0, 0, 0.004));
    emblemeDessus(caisse, c, "ferrari", 2.2, 0.1, 0.14);
    for (const cote of [-1, 1]) {
      auBout(caisse, c, true, 0.29, cote * 0.48, 0.12, 0.34, trou(), 0.012);
      // la grande prise d'air devant la roue arrière, avec ses ailettes, et le pli qui y mène
      pieceFlanc(caisse, c, R, [[-0.88, 0.36], [-0.48, 0.36], [-0.5, 0.74], [-0.78, 0.74]], trou(), 0.008);
      for (let i = 0; i < 3; i++) pieceFlanc(caisse, c, R, [[-0.86, 0.44 + i * 0.1], [-0.49, 0.44 + i * 0.1], [-0.49, 0.46 + i * 0.1], [-0.84, 0.46 + i * 0.1]], carbone(), 0.012);
    }
    traitFlanc(caisse, c, R, [[0.8, 0.3], [0.1, 0.42], [-0.48, 0.74]], 0.008, peinture(fonce(k1, 0.7)));
    // les phares en lame, tout en haut des ailes avant, avec la prise d'air noire juste dessous
    pharePose(caisse, c, [[1.86, 0.9], [2.27, 0.68], [2.25, 0.6], [1.9, 0.8]], [bande(1.89, 0.86, 2.25, 0.65, 0.025), bande(1.96, 0.8, 2.2, 0.66, 0.012)]);
    pieceDessus(caisse, c, [[1.95, 0.76], [2.25, 0.58], [2.24, 0.5], [1.98, 0.66]], trou(), 0.006);
    auBout(caisse, c, true, 0.27, 0, 0.1, 0.42, trou(), 0.012);
    auBout(caisse, c, true, 0.195, 0, 0.025, 1.2, carbone(), 0.06);
    // l'arrière : la lame qui monte (couleur 2), 4 feux carrés, le diffuseur, 2 sorties hautes
    caisse.add(boite(0.08, 0.06, 1.7, peinture(k2), c.xMin + 0.06, 1.01, 0));
    for (const cote of [-1, 1]) for (const dz of [0.32, 0.62]) optiqueAuBout(caisse, c, false, 0.83, cote * dz, 0.07, 0.16, [[0, 0, 0.02, 0.14], [0, 0, 0.06, 0.02]], "feu");
    auBout(caisse, c, false, 0.6, 0, 0.18, 1.45, trou(), 0.012);
    grille(caisse, c, false, 0.6, 0, 0.16, 1.4);
    emblemeAuBout(caisse, c, "ferrari", false, 0.83, 0.07, 0.09);
    lettres(caisse, c, false, 0.73, 0, "FERRARI", 0.42, 0.05);
    diffuseur(caisse, c, 0.3, 1.3, 9);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.6, cote * 0.12, 0.05);
    essuieGlaces(caisse, c, 0.93, 0.5);
    poignees(caisse, c, -0.15, 0.77, 0.15);
    retro(caisse, 0.72, 0.9, 0.8, peinture(k1), 0.9);
    basDeCaisse(caisse, c, 1.0, -0.9, 0.2);
    portiere(caisse, c, 0.95, -0.5, 0.22, 0.8, false);
    finitions(caisse, c, R, { plaque: ["SF-90-ST", 0.22, 0.5], repetiteur: [1.7, 0.6], capteurs: [0.26, 0.3, 0.5] }); // (étape 70)
    const roues = roues4(g, R, 0.84, "doubles", { etrier: [0.95, 0.75, 0.05] });
    return voiture(g, caisse, roues, 1.0);
  }

  // 🇬🇧 McLaren 720S (4,54 m × 1,93 m × 1,20 m, empattement 2,67 m). La cabine en GOUTTE D'EAU (un dôme étroit, au
  // toit noir), les phares dans des « orbites » creuses, les grosses ailes arrière avec leur prise d'air, les portes en
  // élytre, l'aileron et les feux très fins en lames.
  function mcLaren720S(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.3, r: 0.33, l: 0.245, j: 0.245 }, { x: -1.37, r: 0.345, l: 0.305, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.27, 0.32, 0.9, 0.92, 0.86, 0.82, 0.64, { rt: 0.05 }),
      T(-2.15, 0.24, 0.96, 0.98, 0.93, 0.88, 0.62),
      T(-1.75, 0.15, 0.97, 0.98, 0.96, 0.92, 0.58),
      T(-1.37, 0.13, 0.93, 0.99, 0.965, 0.9, 0.5),
      T(-0.95, 0.12, 0.86, 1.07, 0.93, 0.76, 0.46),
      T(-0.5, 0.12, 0.82, 1.16, 0.91, 0.7, 0.48),
      T(-0.1, 0.12, 0.8, 1.2, 0.9, 0.7, 0.5),
      T(0.35, 0.12, 0.78, 1.12, 0.9, 0.72, 0.52),
      T(0.7, 0.12, 0.76, 0.95, 0.91, 0.76, 0.56),
      T(0.98, 0.12, 0.73, 0.76, 0.93, 0.84, 0.6, { de: 0.01 }),
      T(1.3, 0.12, 0.72, 0.68, 0.95, 0.9, 0.56, { de: 0.01 }),
      T(1.8, 0.13, 0.62, 0.58, 0.92, 0.86, 0.54, { de: 0.01 }),
      T(2.13, 0.15, 0.5, 0.48, 0.84, 0.8, 0.52, { de: 0.01 }),
      T(2.27, 0.19, 0.42, 0.41, 0.72, 0.68, 0.46, { de: 0.01, rt: 0.06 }),
    ], R, 0.83, peinture(k1), vitresUnies({ pareBrise: [0.05, 0.95], cotes: [-0.75, 0.9], lunette: [-1.45, -0.85], pilier: 0.06, haut: 0.08 }));
    habitacle(caisse, { xPB: 0.92, xS: -0.2, sol: 0.17, hS: 0.3, w: 0.56, tdb: 0.78, toit: (x) => c.tranche(x).yt, cuir: [0.12, 0.12, 0.12], surpiqure: [1, 0.5, 0], volant: "rond" });
    // les « orbites » : un creux noir autour de chaque phare, avec la prise d'air dedans
    for (const cote of [-1, 1]) {
      // la grosse prise d'air de l'aile arrière (le « dièdre » qui va de la portière à la roue)
      pieceFlanc(caisse, c, R, [[-1.1, 0.44], [-0.62, 0.4], [-0.68, 0.84], [-0.98, 0.86]], trou(), 0.008);
      auBout(caisse, c, true, 0.29, cote * 0.46, 0.1, 0.3, trou(), 0.012);
    }
    traitFlanc(caisse, c, R, [[0.85, 0.36], [0.1, 0.52], [-0.62, 0.84]], 0.008, peinture(fonce(k1, 0.7)));
    // les « orbites » : un creux noir sur chaque coin du nez, avec le phare en haut et la prise d'air en bas
    pieceDessus(caisse, c, [[1.78, 0.86], [2.2, 0.66], [2.19, 0.44], [1.84, 0.58]], trou(), 0.006);
    pharePose(caisse, c, [[1.86, 0.84], [2.18, 0.67], [2.16, 0.6], [1.9, 0.75]], [bande(1.89, 0.81, 2.16, 0.65, 0.02), bande(2.0, 0.76, 2.04, 0.7, 0.05)]);
    emblemeDessus(caisse, c, "mclaren", 2.18, 0.16, 0.16);
    auBout(caisse, c, true, 0.195, 0, 0.025, 1.1, carbone(), 0.06);
    // l'arrière : l'aileron (couleur 2), les feux en fines lames, la grille, 2 sorties hautes au milieu
    caisse.add(surLeDessus(plat(0.34, 1.6, peinture(k2), 0.035), c, -2.05, 0, 0.05));
    for (const cote of [-1, 1]) for (let i = 0; i < 3; i++) optiqueAuBout(caisse, c, false, 0.87 - i * 0.035, cote * 0.55, 0.012, 0.5 - i * 0.08, [[0, 0, 0.008, 0.46 - i * 0.08]], "feu");
    auBout(caisse, c, false, 0.55, 0, 0.26, 1.5, trou(), 0.012);
    grille(caisse, c, false, 0.55, 0, 0.24, 1.4);
    lettres(caisse, c, false, 0.73, 0, "McLAREN", 0.4, 0.05);
    diffuseur(caisse, c, 0.3, 1.3, 9);
    for (const cote of [-1, 1]) echappement(caisse, c.xMin - 0.04, 0.6, cote * 0.1, 0.055);
    essuieGlaces(caisse, c, 0.9, 0.5, false);
    poignees(caisse, c, -0.38, 0.74, 0.12);
    retro(caisse, 0.64, 0.86, 0.72, peinture(k2), 0.9);
    basDeCaisse(caisse, c, 0.95, -1.0, 0.2);
    portiere(caisse, c, 0.9, -0.66, 0.24, 0.78, false);
    finitions(caisse, c, R, { plaque: ["MC-720-S", 0.22, 0.48], repetiteur: [1.62, 0.58], capteurs: [0.26, 0.3, 0.5] }); // (étape 70)
    const roues = roues4(g, R, 0.83, "fins", { etrier: [1, 0.5, 0.02] });
    return voiture(g, caisse, roues, 1.0);
  }

  // 🇩🇪 BMW M3 Competition (4,79 m × 1,90 m × 1,43 m, empattement 2,86 m). Une berline à coffre : le long capot avec
  // sa bosse, l'énorme « double haricot » vertical, les phares en L, les ouïes sur les ailes, le pli « Hofmeister »
  // au bas de la vitre arrière, les feux en L et 4 sorties d'échappement.
  function bmwM3(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.46, r: 0.337, l: 0.27, j: 0.241 }, { x: -1.4, r: 0.34, l: 0.28, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.397, 0.3, 0.95, 0.97, 0.84, 0.8, 0.62, { rt: 0.08 }),
      T(-2.3, 0.24, 1.0, 1.02, 0.91, 0.87, 0.66),
      T(-1.9, 0.2, 1.0, 1.04, 0.94, 0.9, 0.66),
      T(-1.55, 0.2, 0.99, 1.07, 0.95, 0.86, 0.62),
      T(-1.0, 0.2, 0.98, 1.36, 0.93, 0.82, 0.6),
      T(-0.5, 0.2, 0.97, 1.43, 0.92, 0.81, 0.62),
      T(0.2, 0.2, 0.96, 1.43, 0.92, 0.81, 0.63),
      T(0.6, 0.2, 0.96, 1.3, 0.92, 0.82, 0.64),
      T(1.0, 0.2, 0.95, 1.03, 0.93, 0.86, 0.66, { de: 0.01 }),
      T(1.46, 0.2, 0.93, 0.95, 0.95, 0.9, 0.66, { de: 0.01 }),
      T(2.0, 0.21, 0.86, 0.87, 0.92, 0.88, 0.64, { de: 0.01 }),
      T(2.3, 0.24, 0.75, 0.75, 0.86, 0.82, 0.6, { de: 0.01 }),
      T(2.397, 0.29, 0.66, 0.66, 0.77, 0.73, 0.55, { de: 0.01, rt: 0.08 }),
    ], R, 0.8, peinture(k1), vitresUnies({ pareBrise: [0.45, 1.0], cotes: [-1.3, 0.96], montants: [-0.12, -0.92], lunette: [-1.55, -0.95], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.95, xS: 0.0, sol: 0.28, hS: 0.48, w: 0.68, tdb: 0.98, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.75, 0.32, 0.08], surpiqure: [0.1, 0.1, 0.1], volant: "rond" });
    // le double haricot, vertical et immense (le cadre chromé, le fond noir à lamelles)
    for (const cote of [-1, 1]) {
      auBout(caisse, c, true, 0.47, cote * 0.13, 0.32, 0.2, trou(), 0.012);
      for (let i = 0; i < 6; i++) auBout(caisse, c, true, 0.36 + i * 0.045, cote * 0.13, 0.012, 0.18, carbone(), 0.018);
      const cadre = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 24), M.chrome);
      cadre.rotation.y = Math.PI / 2;
      cadre.scale.set(1, 1.62, 1); // (un anneau étiré vers le haut : un haricot)
      cadre.position.set(c.xMax + 0.02, 0.47, cote * 0.13);
      caisse.add(cadre);
      auBout(caisse, c, true, 0.3, cote * 0.56, 0.12, 0.26, trou(), 0.012); // les entrées d'air des côtés
    }
    auBout(caisse, c, true, 0.26, 0, 0.1, 0.5, trou(), 0.012);
    emblemeDessus(caisse, c, "bmw", 2.27, 0.09);
    // les phares : le boîtier, et les 2 « L » de LED du feu de jour
    pharePose(caisse, c, [[1.98, 0.86], [2.36, 0.72], [2.34, 0.42], [2.06, 0.58]], [bande(2.04, 0.8, 2.32, 0.68, 0.02), bande(2.3, 0.68, 2.31, 0.5, 0.02), bande(2.08, 0.66, 2.2, 0.62, 0.05)]);
    // la bosse du capot, les ouïes sur les ailes avant
    pieceDessus(caisse, c, [[1.2, 0.25], [2.0, 0.22], [2.0, 0.3], [1.2, 0.33]], peinture(fonce(k1, 0.85)), 0.004);
    pieceFlanc(caisse, c, R, [[1.7, 0.6], [1.95, 0.6], [1.93, 0.66], [1.72, 0.66]], trou(), 0.008);
    traitFlanc(caisse, c, R, [[2.1, 0.72], [1.0, 0.8], [-0.5, 0.84], [-1.8, 0.88]], 0.006, peinture(fonce(k1, 0.75)));
    // l'arrière : les feux en L, le becquet, le diffuseur et les 4 sorties
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, false, 0.86, cote * 0.58, 0.12, 0.36, [[0.03, 0, 0.02, 0.32], [0, cote * 0.12, 0.08, 0.02]], "feu");
      for (const dz of [0.4, 0.55]) echappement(caisse, c.xMin - 0.04, 0.3, cote * dz, 0.05);
    }
    caisse.add(surLeDessus(plat(0.1, 1.4, carbone(), 0.03), c, -2.3, 0, 0.02));
    lettres(caisse, c, false, 0.66, 0.5, "M3", 0.14, 0.06);
    emblemeAuBout(caisse, c, "bmw", false, 0.82, 0.08);
    diffuseur(caisse, c, 0.3, 0.6, 5);
    plaque(caisse, c, false, 0.55, "M3-COMP-01");
    plaque(caisse, c, true, 0.3, "M3-COMP-01");
    essuieGlaces(caisse, c, 0.98, 0.55);
    for (const x of [0.4, -0.55]) poignees(caisse, c, x, 0.88, 0.18, M.chrome);
    retro(caisse, 0.85, 1.02, 0.86, peinture(k1), 1);
    basDeCaisse(caisse, c, 1.0, -1.0, 0.24, carbone());
    portiere(caisse, c, 0.96, -0.12, 0.26, 0.92, false);
    portiere(caisse, c, -0.14, -1.05, 0.26, 0.94, false);
    finitions(caisse, c, R, { repetiteur: [1.7, 0.78], antenne: -0.9, capteurs: [0.3, 0.38, 0.6] }); // (étape 70)
    const roues = roues4(g, R, 0.8, "y", { etrier: [0.1, 0.3, 0.8] });
    return voiture(g, caisse, roues, 1.3);
  }

  // 🇩🇪 Porsche Taycan Turbo S (4,96 m × 1,97 m × 1,38 m, empattement 2,90 m). Électrique : une berline basse comme
  // une sportive, les ailes plus hautes que le capot, les phares à 4 points, les « larmes » d'air sous les phares,
  // la barre de feux sur toute la largeur et le mot PORSCHE dedans.
  function taycan(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.47, r: 0.36, l: 0.265, j: 0.267 }, { x: -1.43, r: 0.36, l: 0.3, j: 0.267 }];
    const c = peau(caisse, [
      T(-2.48, 0.32, 0.86, 0.88, 0.84, 0.8, 0.6, { rt: 0.08 }),
      T(-2.35, 0.25, 0.92, 0.95, 0.93, 0.88, 0.64),
      T(-1.95, 0.18, 0.94, 1.0, 0.98, 0.9, 0.62),
      T(-1.43, 0.17, 0.93, 1.06, 0.98, 0.86, 0.58),
      T(-0.9, 0.17, 0.9, 1.27, 0.95, 0.8, 0.56),
      T(-0.3, 0.17, 0.89, 1.37, 0.94, 0.79, 0.58),
      T(0.3, 0.17, 0.88, 1.35, 0.94, 0.79, 0.59),
      T(0.75, 0.17, 0.86, 1.14, 0.95, 0.81, 0.62),
      T(1.1, 0.17, 0.84, 0.9, 0.96, 0.84, 0.64, { de: 0.01 }),
      T(1.47, 0.17, 0.82, 0.76, 0.97, 0.9, 0.6, { de: 0.01 }),
      T(2.0, 0.18, 0.74, 0.68, 0.93, 0.86, 0.58, { de: 0.01 }),
      T(2.35, 0.2, 0.6, 0.58, 0.85, 0.8, 0.56, { de: 0.01 }),
      T(2.48, 0.25, 0.5, 0.5, 0.74, 0.7, 0.5, { de: 0.01, rt: 0.08 }),
    ], R, 0.84, peinture(k1), vitresUnies({ pareBrise: [0.35, 1.08], cotes: [-1.25, 1.0], montants: [-0.15], lunette: [-1.95, -1.0], pilier: 0.075 }));
    habitacle(caisse, { xPB: 1.05, xS: 0.05, sol: 0.24, hS: 0.4, w: 0.66, tdb: 0.9, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.55, 0.42, 0.3], surpiqure: [0.2, 0.15, 0.1], volant: "rond" });
    // les phares à 4 points (les « yeux » Porsche), et la « larme » d'air dessous
    pharePose(caisse, c, [[2.02, 0.86], [2.38, 0.74], [2.36, 0.56], [2.08, 0.66]], [
      bande(2.12, 0.76, 2.16, 0.74, 0.05), bande(2.22, 0.73, 2.26, 0.71, 0.05), bande(2.14, 0.68, 2.18, 0.66, 0.05), bande(2.24, 0.65, 2.28, 0.63, 0.05), bande(2.05, 0.82, 2.35, 0.7, 0.012)]);
    for (const cote of [-1, 1]) {
      const larme = auBout(caisse, c, true, 0.36, cote * 0.55, 0.22, 0.07, trou(), 0.012);
      larme.rotation.x = cote * -0.3;
      auBout(caisse, c, true, 0.27, cote * 0.3, 0.07, 0.36, trou(), 0.012);
    }
    emblemeDessus(caisse, c, "porsche", 2.32, 0.07, 0.085);
    traitFlanc(caisse, c, R, [[2.1, 0.5], [1.2, 0.48], [-0.8, 0.5], [-1.9, 0.6]], 0.006, peinture(fonce(k1, 0.75)));
    // l'arrière : la barre de feux 3D, le mot PORSCHE, le becquet, le diffuseur (pas d'échappement : c'est électrique !)
    optiqueAuBout(caisse, c, false, 0.84, 0, 0.06, 1.55, [[0.015, 0, 0.012, 1.5], [-0.015, 0, 0.012, 1.5]], "feu");
    lettres(caisse, c, false, 0.84, 0, "PORSCHE", 0.5, 0.045, "#2a0505");
    lettres(caisse, c, false, 0.62, 0.45, "TAYCAN", 0.24, 0.04);
    caisse.add(surLeDessus(plat(0.14, 1.3, carbone(), 0.02), c, -2.38, 0, 0.012));
    diffuseur(caisse, c, 0.32, 1.1, 7);
    plaque(caisse, c, false, 0.6, "TC-4S-911");
    plaque(caisse, c, true, 0.3, "TC-4S-911");
    essuieGlaces(caisse, c, 1.06, 0.55);
    for (const x of [0.45, -0.55]) poignees(caisse, c, x, 0.82, 0.2);
    retro(caisse, 0.88, 0.94, 0.84, peinture(k1), 0.95);
    basDeCaisse(caisse, c, 1.05, -1.05, 0.22, carbone());
    portiere(caisse, c, 1.0, -0.15, 0.22, 0.86, false);
    portiere(caisse, c, -0.17, -1.12, 0.22, 0.88, false);
    finitions(caisse, c, R, { repetiteur: [1.75, 0.68], antenne: -0.95, capteurs: [0.28, 0.36, 0.6] }); // (étape 70)
    const roues = roues4(g, R, 0.84, "turbine", { etrier: [0.95, 0.85, 0.15] });
    return voiture(g, caisse, roues, 1.25);
  }

  // 🇫🇷 Bugatti Bolide (4,76 m × 1,99 m × 0,995 m, empattement 2,75 m). Une voiture de course : moins d'un mètre de
  // haut ! Une bulle de pilote toute petite, l'aileron géant sur ses 2 bras, l'arête (la « dérive ») au milieu,
  // les feux en X, le fer à cheval devant et l'ovale rouge BUGATTI.
  function bolide(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.4, r: 0.335, l: 0.3, j: 0.24 }, { x: -1.35, r: 0.35, l: 0.36, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.38, 0.3, 0.76, 0.78, 0.9, 0.86, 0.6, { rt: 0.05 }),
      T(-2.2, 0.2, 0.84, 0.86, 0.97, 0.92, 0.6),
      T(-1.35, 0.12, 0.8, 0.86, 0.995, 0.9, 0.5),
      T(-0.9, 0.12, 0.72, 0.88, 0.95, 0.7, 0.42),
      T(-0.4, 0.12, 0.68, 0.99, 0.92, 0.62, 0.44),
      T(0.1, 0.12, 0.66, 0.98, 0.92, 0.62, 0.45),
      T(0.5, 0.12, 0.64, 0.84, 0.94, 0.66, 0.48),
      T(0.8, 0.12, 0.62, 0.66, 0.96, 0.78, 0.5, { de: 0.01 }),
      T(1.4, 0.12, 0.64, 0.56, 0.995, 0.9, 0.46, { de: 0.01 }),
      T(2.0, 0.12, 0.52, 0.44, 0.92, 0.84, 0.46, { de: 0.01 }),
      T(2.3, 0.13, 0.38, 0.36, 0.78, 0.74, 0.44, { de: 0.01 }),
      T(2.378, 0.15, 0.32, 0.31, 0.68, 0.64, 0.42, { de: 0.01, rt: 0.05 }),
    ], R, 0.84, peinture(k1), vitresUnies({ pareBrise: [0.05, 0.8], cotes: [-0.55, 0.75], pilier: 0.05, haut: 0.06 }));
    habitacle(caisse, { xPB: 0.75, xS: -0.25, sol: 0.14, hS: 0.24, w: 0.5, tdb: 0.66, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.12], surpiqure: [0.1, 0.3, 0.9], volant: "course", casque: true });
    // la dérive au milieu, l'aileron géant (couleur 2) sur ses deux bras
    const derive = new THREE.Shape();
    derive.moveTo(-0.4, 0.97); derive.lineTo(-2.3, 0.9); derive.lineTo(-2.3, 1.3); derive.lineTo(-1.8, 1.3); derive.closePath();
    const geoDerive = new THREE.ExtrudeGeometry(derive, { depth: 0.03, bevelEnabled: false });
    geoDerive.translate(0, 0, -0.015);
    caisse.add(new THREE.Mesh(geoDerive, peinture(k2)));
    caisse.add(boite(0.42, 0.04, 1.9, peinture(k2), -2.35, 1.3, 0));
    for (const z of [-0.95, 0.95]) caisse.add(boite(0.44, 0.24, 0.025, peinture(k2), -2.35, 1.2, z));
    for (const z of [-0.5, 0.5]) caisse.add(boite(0.1, 0.48, 0.03, carbone(), -2.25, 1.06, z));
    // le fer à cheval, les phares en X, les énormes prises d'air
    const fer = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 28, Math.PI * 1.6), M.chrome);
    fer.rotation.set(0, Math.PI / 2, Math.PI * 1.3);
    fer.position.set(c.xMax + 0.02, 0.24, 0);
    caisse.add(fer);
    auBout(caisse, c, true, 0.24, 0, 0.18, 0.18, trou(), 0.012);
    emblemeAuBout(caisse, c, "bugatti", true, 0.35, 0.12, 0.08);
    pharePose(caisse, c, [[1.95, 0.84], [2.3, 0.7], [2.28, 0.52], [2.0, 0.62]], [bande(1.99, 0.8, 2.27, 0.57, 0.02), bande(1.99, 0.64, 2.27, 0.68, 0.02)]);
    for (const cote of [-1, 1]) {
      auBout(caisse, c, true, 0.23, cote * 0.48, 0.14, 0.3, trou(), 0.012);
      pieceFlanc(caisse, c, R, [[-1.0, 0.2], [-0.4, 0.2], [-0.45, 0.6], [-0.9, 0.62]], trou(), 0.008); // la prise d'air du radiateur
      // les feux en X à l'arrière
      for (const s2 of [-1, 1]) {
        const barre = optiqueAuBout(caisse, c, false, 0.6, cote * 0.55, 0.03, 0.4, [[0, 0, 0.012, 0.38]], "feu");
        barre.rotateY(s2 * 0.6);
      }
    }
    grille(caisse, c, false, 0.42, 0, 0.18, 1.6);
    diffuseur(caisse, c, 0.24, 1.5, 9);
    for (const z of [-0.12, 0.12]) echappement(caisse, c.xMin - 0.04, 0.68, z, 0.06);
    emblemeAuBout(caisse, c, "bugatti", false, 0.74, 0.12, 0.08);
    retro(caisse, 0.5, 0.74, 0.7, carbone(), 0.8);
    basDeCaisse(caisse, c, 1.0, -0.95, 0.15, carbone());
    finitions(caisse, c, R, { repetiteur: [1.7, 0.5] }); // (étape 70)
    const roues = roues4(g, R, 0.84, "turbine", { etrier: [0.1, 0.2, 0.9] });
    return voiture(g, caisse, roues, 0.85);
  }

  // 🇫🇷 Alpine A110 (4,18 m × 1,80 m × 1,25 m, empattement 2,42 m). Petite, ronde et légère : le moteur derrière, les
  // 4 phares (2 grands, et 2 ronds avec une croix de LED), la petite vitre en V à l'arrière, les feux en X.
  function alpineA110(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.2, r: 0.31, l: 0.205, j: 0.229 }, { x: -1.22, r: 0.323, l: 0.235, j: 0.229 }];
    const c = peau(caisse, [
      T(-2.09, 0.3, 0.8, 0.84, 0.8, 0.76, 0.55, { rt: 0.12 }),
      T(-1.98, 0.22, 0.88, 0.92, 0.86, 0.82, 0.6, { rt: 0.12 }),
      T(-1.6, 0.16, 0.9, 0.96, 0.9, 0.84, 0.58),
      T(-1.22, 0.15, 0.89, 1.0, 0.9, 0.8, 0.52),
      T(-0.75, 0.15, 0.86, 1.18, 0.88, 0.74, 0.5),
      T(-0.3, 0.15, 0.84, 1.25, 0.87, 0.72, 0.52),
      T(0.15, 0.15, 0.83, 1.22, 0.87, 0.73, 0.54),
      T(0.55, 0.15, 0.8, 1.0, 0.88, 0.76, 0.58),
      T(0.8, 0.15, 0.78, 0.82, 0.88, 0.8, 0.6, { de: 0.01 }),
      T(1.2, 0.15, 0.76, 0.72, 0.89, 0.84, 0.58, { de: 0.01 }),
      T(1.7, 0.16, 0.66, 0.64, 0.86, 0.8, 0.58, { de: 0.01 }),
      T(1.98, 0.19, 0.55, 0.55, 0.77, 0.73, 0.54, { de: 0.01, rt: 0.12 }),
      T(2.09, 0.25, 0.46, 0.46, 0.64, 0.6, 0.46, { de: 0.01, rt: 0.12 }),
    ], R, 0.78, peinture(k1), vitresUnies({ pareBrise: [0.2, 0.8], cotes: [-0.62, 0.78], lunette: [-1.15, -0.62], pilier: 0.07 }));
    habitacle(caisse, { xPB: 0.78, xS: -0.2, sol: 0.2, hS: 0.34, w: 0.6, tdb: 0.78, toit: (x) => c.tranche(x).yt, cuir: [0.1, 0.1, 0.12], surpiqure: [0.1, 0.35, 0.9], volant: "rond" });
    // les phares : 2 grands en amande, et 2 ronds plus bas avec leur croix de LED
    pharePose(caisse, c, [[1.62, 0.82], [1.98, 0.72], [1.98, 0.56], [1.68, 0.66]], [bande(1.66, 0.78, 1.96, 0.69, 0.018)]);
    for (const cote of [-1, 1]) {
      const rond = phareRond(0.07);
      rond.rotation.z = -Math.PI / 2;
      rond.position.set(c.xMax + 0.005, 0.38, cote * 0.48);
      caisse.add(rond);
      for (const a of [0.78, -0.78]) {
        const croix = boite(0.01, 0.1, 0.012, M.led, c.xMax + 0.03, 0.38, cote * 0.48);
        croix.rotation.x = a;
        caisse.add(croix);
      }
      // les feux en X
      for (const a of [0.7, -0.7]) {
        const f = optiqueAuBout(caisse, c, false, 0.66, cote * 0.55, 0.02, 0.24, [[0, 0, 0.01, 0.22]], "feu");
        f.rotateY(a);
      }
    }
    auBout(caisse, c, true, 0.27, 0, 0.1, 0.62, trou(), 0.012);
    emblemeAuBout(caisse, c, "alpine", true, 0.42, 0.12);
    emblemeAuBout(caisse, c, "alpine", false, 0.56, 0.1);
    lettres(caisse, c, false, 0.46, 0, "ALPINE", 0.36, 0.05);
    echappement(caisse, c.xMin - 0.04, 0.3, 0, 0.055);
    diffuseur(caisse, c, 0.28, 0.9, 5);
    essuieGlaces(caisse, c, 0.78, 0.48);
    poignees(caisse, c, 0.0, 0.73, 0.15);
    retro(caisse, 0.62, 0.86, 0.76, peinture(k1), 0.9);
    basDeCaisse(caisse, c, 0.85, -0.85, 0.2);
    portiere(caisse, c, 0.78, -0.6, 0.22, 0.78, false);
    traitFlanc(caisse, c, R, [[1.6, 0.42], [0.5, 0.36], [-0.7, 0.4], [-1.6, 0.5]], 0.006, peinture(fonce(k1, 0.75)));
    finitions(caisse, c, R, { plaque: ["A110-ALP", 0.27, 0.42], repetiteur: [1.5, 0.6], capteurs: [0.25, 0.34, 0.45] }); // (étape 70)
    const roues = roues4(g, R, 0.78, "etoile", { etrier: [0.1, 0.35, 0.9] });
    return voiture(g, caisse, roues, 1.05);
  }

  // 🇫🇷 Renault 5 E-Tech (3,92 m × 1,77 m × 1,50 m, empattement 2,54 m). La petite électrique qui ressemble à la R5
  // des années 70 : les phares carrés avec leurs « sourcils », la prise d'air du capot avec le 5 qui s'allume quand
  // elle charge, le toit noir, les feux verticaux.
  function renault5(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.2, r: 0.336, l: 0.195, j: 0.229 }, { x: -1.34, r: 0.336, l: 0.195, j: 0.229 }];
    const c = peau(caisse, [
      T(-1.96, 0.36, 0.96, 1.0, 0.8, 0.78, 0.64, { rt: 0.1 }),
      T(-1.9, 0.3, 0.98, 1.1, 0.85, 0.82, 0.66, { rt: 0.1 }),
      T(-1.72, 0.25, 1.0, 1.3, 0.87, 0.8, 0.66),
      T(-1.4, 0.23, 0.99, 1.46, 0.88, 0.8, 0.68),
      T(-0.3, 0.22, 0.98, 1.5, 0.88, 0.8, 0.69),
      T(0.12, 0.22, 0.97, 1.47, 0.88, 0.8, 0.7),
      T(0.55, 0.22, 0.96, 1.24, 0.88, 0.82, 0.71),
      T(0.92, 0.22, 0.95, 1.0, 0.88, 0.85, 0.7, { de: 0.01 }),
      T(1.2, 0.22, 0.94, 0.96, 0.88, 0.84, 0.68, { de: 0.01 }),
      T(1.75, 0.24, 0.9, 0.9, 0.86, 0.82, 0.66, { de: 0.01 }),
      T(1.96, 0.3, 0.8, 0.8, 0.8, 0.76, 0.62, { de: 0.01, rt: 0.1 }),
    ], R, 0.76, peinture(k1), vitresUnies({ pareBrise: [0.14, 0.92], cotes: [-1.45, 0.88], montants: [-0.3], lunette: [-1.88, -1.42], pilier: 0.08 }));
    habitacle(caisse, { xPB: 0.9, xS: -0.05, sol: 0.3, hS: 0.55, w: 0.66, tdb: 1.02, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.25, 0.27, 0.32], surpiqure: [0.9, 0.8, 0.1], volant: "rond" });
    // le toit noir (couleur 2)
    pieceDessus(caisse, c, [[-1.38, 0], [0.08, 0], [0.08, 0.6], [-1.38, 0.6]], peinture(k2), 0.005);
    // l'avant : les phares carrés et leur sourcil de LED, la calandre fine, le losange, le « 5 » sur le capot
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 0.66, cote * 0.55, 0.16, 0.26, [[0, 0, 0.12, 0.2], [0.075, 0, 0.012, 0.24]]);
      auBout(caisse, c, true, 0.36, cote * 0.5, 0.1, 0.24, trou(), 0.012);
    }
    auBout(caisse, c, true, 0.66, 0, 0.05, 0.5, trou(), 0.012);
    emblemeAuBout(caisse, c, "renault", true, 0.66, 0.13);
    pieceDessus(caisse, c, [[1.45, -0.18], [1.75, -0.18], [1.75, 0.18], [1.45, 0.18]], trou(), 0.006, false);
    lettres(caisse, c, true, 0.78, 0, "5", 0.12, 0.08, "#ffcf1a");
    caisse.add(surLeDessus(Object.assign(plat(0.18, 0.12, M.orange, 0.012)), c, 1.6, 0, 0.012)); // le « 5 » lumineux de la charge
    // l'arrière : les feux verticaux, le hayon, le losange
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.86, cote * 0.68, 0.34, 0.1, [[0, 0, 0.3, 0.03]], "feu");
    emblemeAuBout(caisse, c, "renault", false, 0.9, 0.12);
    lettres(caisse, c, false, 0.78, 0.4, "R5", 0.12, 0.05);
    auBout(caisse, c, false, 0.42, 0, 0.14, 1.4, M.plastique, 0.04);
    plaque(caisse, c, false, 0.6, "R5-ETECH");
    plaque(caisse, c, true, 0.46, "R5-ETECH");
    essuieGlaces(caisse, c, 0.97, 0.5);
    for (const x of [0.25, -0.7]) poignees(caisse, c, x, 0.88, 0.15);
    retro(caisse, 0.8, 1.02, 0.8, peinture(k2), 1);
    basDeCaisse(caisse, c, 0.9, -1.0, 0.26);
    for (const r of R) traitFlanc(caisse, c, R, [[r.x + 0.48, 0.3], [r.x + 0.38, 0.62], [r.x, 0.74], [r.x - 0.38, 0.62], [r.x - 0.48, 0.3]], 0.03, M.plastique); // les élargisseurs d'ailes
    portiere(caisse, c, 0.9, -0.3, 0.28, 0.92, false);
    portiere(caisse, c, -0.32, -1.05, 0.28, 0.94, false);
    finitions(caisse, c, R, { repetiteur: [1.55, 0.8], antenne: -1.2, capteurs: [0.36, 0.45, 0.55] }); // (étape 70)
    const roues = roues4(g, R, 0.76, "turbine", {});
    return voiture(g, caisse, roues, 1.35);
  }

  // 🇺🇸 DeLorean DMC-12 (4,27 m × 1,86 m × 1,14 m, empattement 2,41 m), la voiture de « Retour vers le futur » :
  // une cale en ACIER INOXYDABLE brossé (pas de peinture !), les portes papillon, les 4 phares carrés, la calandre
  // noire, les lamelles sur la vitre arrière et les gros pare-chocs noirs.
  function delorean(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.18, r: 0.3, l: 0.195, j: 0.178 }, { x: -1.23, r: 0.33, l: 0.235, j: 0.19 }];
    const acier = inox();
    const c = peau(caisse, [
      T(-2.13, 0.36, 0.8, 0.84, 0.86, 0.84, 0.66, { rt: 0.03 }),
      T(-2.05, 0.3, 0.86, 0.9, 0.92, 0.88, 0.66, { rt: 0.04 }),
      T(-1.23, 0.24, 0.88, 0.93, 0.93, 0.88, 0.62, { rt: 0.04 }),
      T(-0.75, 0.24, 0.87, 1.05, 0.92, 0.8, 0.58, { rt: 0.05 }),
      T(-0.25, 0.24, 0.86, 1.14, 0.92, 0.78, 0.58, { rt: 0.05 }),
      T(0.15, 0.24, 0.85, 1.13, 0.92, 0.78, 0.59, { rt: 0.05 }),
      T(0.5, 0.24, 0.82, 0.98, 0.92, 0.8, 0.61, { rt: 0.05 }),
      T(0.85, 0.24, 0.78, 0.8, 0.92, 0.84, 0.64, { de: 0.01, rt: 0.04 }),
      T(1.18, 0.24, 0.74, 0.74, 0.92, 0.86, 0.64, { de: 0.01, rt: 0.04 }),
      T(1.9, 0.26, 0.63, 0.63, 0.9, 0.84, 0.62, { de: 0.01, rt: 0.03 }),
      T(2.13, 0.32, 0.56, 0.56, 0.86, 0.82, 0.6, { de: 0.01, rt: 0.03 }),
    ], R, 0.78, acier, vitresUnies({ pareBrise: [0.25, 0.85], cotes: [-0.62, 0.8], lunette: [-0.95, -0.4], pilier: 0.08 }), 0.02);
    habitacle(caisse, { xPB: 0.82, xS: -0.15, sol: 0.28, hS: 0.42, w: 0.62, tdb: 0.82, toit: (x) => c.tranche(x).yt, cuir: [0.2, 0.2, 0.22], surpiqure: [0.3, 0.3, 0.3], volant: "rond" });
    // les lamelles noires sur la vitre arrière et le capot moteur
    for (let i = 0; i < 9; i++) caisse.add(surLeDessus(plat(0.03, 1.1, M.noir, 0.02), c, -1.0 + i * 0.07, 0, 0.02));
    // les gros pare-chocs noirs, la calandre noire avec les 4 phares carrés, DMC
    auBout(caisse, c, true, 0.4, 0, 0.18, 1.78, M.plastique, 0.12);
    auBout(caisse, c, false, 0.42, 0, 0.2, 1.78, M.plastique, 0.12);
    auBout(caisse, c, true, 0.53, 0, 0.12, 1.5, trou(), 0.02);
    for (let i = -3; i <= 3; i++) auBout(caisse, c, true, 0.53, i * 0.08, 0.1, 0.012, M.plastique, 0.03);
    for (const cote of [-1, 1]) for (const dz of [0.48, 0.66]) optiqueAuBout(caisse, c, true, 0.53, cote * dz, 0.11, 0.16, [[0, 0, 0.08, 0.13]]);
    emblemeAuBout(caisse, c, "delorean", true, 0.53, 0.16, 0.06, 0, 0.035);
    // l'arrière : la grille noire des feux (rouge, orange, blanc), DMC, 2 sorties
    auBout(caisse, c, false, 0.68, 0, 0.18, 1.7, trou(), 0.02);
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, false, 0.68, cote * 0.6, 0.14, 0.4, [[0.03, 0, 0.05, 0.36], [-0.03, 0, 0.05, 0.36]], "feu");
      optiqueAuBout(caisse, c, false, 0.68, cote * 0.32, 0.14, 0.14, [[0, 0, 0.1, 0.1]]);
      echappement(caisse, c.xMin - 0.08, 0.3, cote * 0.35, 0.04);
    }
    emblemeAuBout(caisse, c, "delorean", false, 0.86, 0.22, 0.08);
    // les portes papillon : la ligne qui monte jusqu'au toit, et la bande noire tout le long du flanc
    for (const cote of [-1, 1]) for (const x of [0.82, -0.6]) surLeFlanc(caisse, c, x, 0.55, cote, 0.006, 0.5, M.noir, 0.004);
    traitFlanc(caisse, c, R, [[2.0, 0.52], [1.2, 0.5], [0, 0.48], [-1.2, 0.5], [-2.0, 0.52]], 0.022, M.plastique);
    essuieGlaces(caisse, c, 0.84, 0.55);
    retro(caisse, 0.62, 0.86, 0.82, M.noir, 0.9);
    finitions(caisse, c, R, { plaque: ["OUTATIME", 0.4, 0.42], repetiteur: [1.6, 0.6] }); // (étape 70)
    const roues = roues4(g, R, 0.78, "fins", {});
    return voiture(g, caisse, roues, 1.0);
  }

  // 🇺🇸 Tesla Cybertruck (5,68 m × 2,03 m × 1,79 m, empattement 3,81 m). Tout en facettes plates, en ACIER INOXYDABLE
  // brut : une seule ligne monte du nez jusqu'au sommet du toit, une autre redescend jusqu'au bout de la benne.
  // La peau est faite de tranches très rapprochées sur des lignes droites : elle reste en angles vifs.
  function cybertruck(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const L2 = 2.84, S = 0.25, H = 1.79;
    const haut = (x) => (x >= S ? H - ((x - S) / (L2 - S)) * (H - 1.06) : H - ((S - x) / (L2 + S)) * (H - 1.3));
    const R = [{ x: 1.9, r: 0.43, l: 0.3, j: 0.3 }, { x: -1.9, r: 0.43, l: 0.3, j: 0.3 }];
    const cles = [];
    for (const x of [-L2, -L2 + 0.03, -2.4, -1.9, -1.4, -0.9, -0.4, 0.05, S - 0.02, S + 0.02, 0.6, 1.0, 1.4, 1.9, 2.3, L2 - 0.03, L2]) {
      const yt = haut(x), yc = Math.min(1.18, yt - 0.03), bout = Math.abs(x) > L2 - 0.02;
      cles.push(T(x, bout ? 0.55 : 0.5, yc, yt, bout ? 0.99 : 1.015, bout ? 0.97 : 0.99, x > 1.6 || x < -1.6 ? 0.96 : 0.84, { wl: bout ? 0.98 : 1.0, rt: 0.02, de: 0.0 }));
    }
    const acier = inoxClair();
    const c = peau(caisse, cles, R, 0.9, acier, vitresUnies({ pareBrise: [S + 0.06, 1.55], cotes: [-1.35, 1.3], montants: [-0.2], lunette: [-0.9, S - 0.06], pilier: 0.06, haut: 0.03 }), 0);
    habitacle(caisse, { xPB: 1.35, xS: 0.15, sol: 0.72, hS: 1.02, w: 0.84, tdb: 1.36, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.85, 0.85, 0.84], surpiqure: [0.2, 0.2, 0.2], volant: "plat" });
    // les passages de roues : des trapèzes en plastique noir, en angles
    for (const r of R) pieceFlanc(caisse, c, R, [[r.x - 0.72, 0.5], [r.x + 0.72, 0.5], [r.x + 0.48, 1.0], [r.x - 0.48, 1.0]], M.plastique, 0.012);
    pieceFlanc(caisse, c, R, [[-1.2, 0.5], [1.2, 0.5], [1.2, 0.58], [-1.2, 0.58]], M.plastique, 0.01); // le bas de caisse
    // la barre de lumière sur toute la largeur, devant (blanche) et derrière (rouge)
    auBout(caisse, c, true, 1.02, 0, 0.025, 1.95, M.led, 0.012);
    auBout(caisse, c, false, 1.26, 0, 0.03, 1.95, M.feuLed, 0.012);
    auBout(caisse, c, false, 0.78, 0, 0.42, 1.9, M.plastique, 0.03); // le hayon et le pare-chocs
    lettres(caisse, c, false, 1.12, 0, "CYBERTRUCK", 1.1, 0.07, "#2b2d30");
    emblemeAuBout(caisse, c, "tesla", true, 0.82, 0.14);
    // la ligne de la porte, la poignée (il n'y en a pas : c'est un bouton !), les caméras à la place des rétroviseurs
    for (const x of [1.25, -0.2, -1.4]) for (const cote of [-1, 1]) surLeFlanc(caisse, c, x, 0.85, cote, 0.006, 0.6, M.noir, 0.004);
    for (const cote of [-1, 1]) caisse.add(boite(0.08, 0.05, 0.06, M.noir, 1.25, 1.22, cote * 1.03));
    essuieGlaces(caisse, c, 1.5, 1.2, false);
    finitions(caisse, c, R, { plaque: ["CYB-3R-TS", 0.62, 0.66] }); // (étape 70)
    const roues = roues4(g, R, 0.9, "turbine", { pneu: "crampons", metal: new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.5, roughness: 0.4 }) });
    return voiture(g, caisse, roues, 1.65);
  }

  // 🦇 La Batmobile (celle du film de 1989 : 6,5 m de long !). Toute noire et brillante, le long nez avec sa grosse prise
  // d'air de turbine, la bulle du cockpit, les deux ailerons en ailes de chauve-souris et le réacteur à l'arrière.
  function batmobile(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const noir = new THREE.MeshPhysicalMaterial({ color: 0x17171b, metalness: 0.55, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 });
    const R = [{ x: 1.9, r: 0.38, l: 0.32, j: 0.27 }, { x: -1.6, r: 0.4, l: 0.4, j: 0.28 }];
    const c = peau(caisse, [
      T(-3.0, 0.3, 0.62, 0.66, 0.66, 0.62, 0.4, { rt: 0.1 }),
      T(-2.6, 0.2, 0.82, 0.86, 0.98, 0.9, 0.42),
      T(-1.6, 0.13, 0.86, 0.88, 1.05, 0.92, 0.42),
      T(-1.0, 0.12, 0.8, 0.9, 1.0, 0.6, 0.32),
      T(-0.6, 0.12, 0.8, 1.1, 0.98, 0.52, 0.3),
      T(0.0, 0.12, 0.78, 1.15, 0.96, 0.52, 0.32),
      T(0.5, 0.12, 0.76, 0.96, 0.95, 0.5, 0.32),
      T(0.95, 0.12, 0.75, 0.78, 0.95, 0.48, 0.32, { de: 0.01 }),
      T(1.9, 0.13, 0.78, 0.66, 0.98, 0.9, 0.4, { de: 0.01 }),
      T(2.7, 0.15, 0.52, 0.46, 0.8, 0.74, 0.4, { de: 0.01 }),
      T(3.1, 0.22, 0.34, 0.33, 0.48, 0.44, 0.3, { de: 0.01, rt: 0.1 }),
    ], R, 0.85, noir, vitresUnies({ pareBrise: [-0.05, 0.95], cotes: [-0.9, 0.9], lunette: [-1.0, -0.3], pilier: 0.04 }));
    habitacle(caisse, { xPB: 0.9, xS: -0.25, sol: 0.18, hS: 0.32, w: 0.46, tdb: 0.82, toit: (x) => c.tranche(x).yt, cuir: [0.08, 0.08, 0.09], surpiqure: [0.95, 0.75, 0.1], volant: "course" });
    // le long capot : la grosse prise d'air de la turbine, et la grille ronde devant
    pieceDessus(caisse, c, [[1.4, 0], [2.6, 0], [2.6, 0.22], [1.4, 0.28]], trou(), 0.006);
    for (let i = 0; i < 8; i++) pieceDessus(caisse, c, [[1.45 + i * 0.14, 0], [1.5 + i * 0.14, 0], [1.5 + i * 0.14, 0.24], [1.45 + i * 0.14, 0.26]], carbone(), 0.012);
    const turbine = cylindre(0.2, 0.05, nidAbeille(), 28);
    turbine.rotation.z = Math.PI / 2;
    turbine.position.set(c.xMax + 0.01, 0.3, 0);
    caisse.add(turbine);
    emblemeAuBout(caisse, c, "batman", true, 0.3, 0.32, 0.2);
    // les phares en fente (bleutés), les feux rouges dans les ailerons, le jonc argent le long du flanc
    pharePose(caisse, c, [[2.4, 0.66], [2.95, 0.4], [2.94, 0.34], [2.42, 0.6]], [bande(2.44, 0.63, 2.92, 0.37, 0.02)]);
    traitFlanc(caisse, c, R, [[2.9, 0.3], [1.0, 0.36], [-1.0, 0.38], [-2.8, 0.4]], 0.008, M.chrome);
    // les deux ailerons « ailes de chauve-souris », avec leurs feux
    for (const cote of [-1, 1]) {
      const aile = new THREE.Shape([new THREE.Vector2(-1.2, 0), new THREE.Vector2(-3.05, 0), new THREE.Vector2(-3.25, 0.75), new THREE.Vector2(-2.85, 0.55), new THREE.Vector2(-2.55, 0.7), new THREE.Vector2(-2.3, 0.45)]);
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(aile, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 }), noir);
      m.position.set(0, 0.8, cote * 0.84 - 0.02);
      m.castShadow = true;
      caisse.add(m);
      caisse.add(boite(0.03, 0.3, 0.06, M.feuLed, -3.12, 1.25, cote * 0.84));
    }
    // le réacteur, avec sa flamme orange
    const tuyere = cylindre(0.24, 0.4, M.noir, 24);
    tuyere.rotation.z = Math.PI / 2;
    tuyere.position.set(-3.05, 0.48, 0);
    caisse.add(tuyere);
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.025, 8, 28), M.chrome);
    anneau.rotation.y = Math.PI / 2;
    anneau.position.set(-3.25, 0.48, 0);
    caisse.add(anneau);
    const flamme = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshStandardMaterial({ color: 0xff7a1a, emissive: 0xff5a00, emissiveIntensity: 2 }));
    flamme.rotation.y = -Math.PI / 2;
    flamme.position.set(-3.26, 0.48, 0);
    caisse.add(flamme);
    basDeCaisse(caisse, c, 1.4, -1.1, 0.16, M.chrome);
    finitions(caisse, c, R, { capteurs: [0.28, 0.4, 0.4] }); // (étape 70)
    const roues = roues4(g, R, 0.85, "turbine", { metal: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.7, roughness: 0.3 }), etrier: [0.95, 0.75, 0.1] });
    return voiture(g, caisse, roues, 1.0);
  }

  // 🇫🇷 Citroën 2CV (3,83 m × 1,48 m × 1,60 m, empattement 2,40 m), la « Deudeuche » : une caisse ronde et haute, les
  // ailes séparées au-dessus des roues, le capot ondulé, les phares ronds posés sur les ailes, et le toit en toile
  // qu'on peut enrouler.
  function citroen2CV(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.2, r: 0.3, l: 0.13, j: 0.19 }, { x: -1.2, r: 0.3, l: 0.13, j: 0.19 }];
    const mat = peinture(k1);
    const c = Circuit.Coque.construire({
      cles: [
        { x: -1.92, yb: 0.42, yc: 0.62, yt: 0.66, w: 0.56, wl: 0.53, n: 2.2 },
        { x: -1.75, yb: 0.32, yc: 0.85, yt: 1.05, w: 0.66, wl: 0.62, n: 2.2 },
        { x: -1.2, yb: 0.3, yc: 0.9, yt: 1.18, w: 0.68, wl: 0.64, n: 2.2 },
        { x: 0.0, yb: 0.3, yc: 0.9, yt: 1.18, w: 0.68, wl: 0.64, n: 2.2 },
        { x: 0.75, yb: 0.32, yc: 0.86, yt: 1.0, w: 0.66, wl: 0.62, n: 2.2 },
        { x: 1.35, yb: 0.36, yc: 0.78, yt: 0.86, w: 0.52, wl: 0.48, n: 2.2 },
        { x: 1.88, yb: 0.42, yc: 0.62, yt: 0.66, w: 0.4, wl: 0.38, n: 2 },
      ],
    });
    const corps = new THREE.Mesh(c.geometrie, [mat, M.vitreClaire]);
    corps.castShadow = corps.receiveShadow = true;
    caisse.add(corps);
    // la cabine ronde (avec de vraies vitres), et la capote en toile grise, posée sur le toit
    const cab = coque(caisse, {
      cles: [
        { x: -1.55, yb: 1.05, yc: 1.07, yt: 1.12, w: 0.6, wt: 0.42, rt: 0.12 },
        { x: -1.25, yb: 1.08, yc: 1.1, yt: 1.48, w: 0.64, wt: 0.5, rt: 0.2 },
        { x: -0.2, yb: 1.08, yc: 1.1, yt: 1.6, w: 0.66, wt: 0.52, rt: 0.2 },
        { x: 0.45, yb: 1.06, yc: 1.08, yt: 1.55, w: 0.65, wt: 0.5, rt: 0.18 },
        { x: 0.72, yb: 1.0, yc: 1.02, yt: 1.04, w: 0.62, wt: 0.55, rt: 0.06 },
      ],
      vitre: vitresUnies({ pareBrise: [0.45, 0.78], cotes: [-1.12, 0.48], montants: [-0.35], lunette: [-1.5, -1.25], pilier: 0.06, haut: 0.1 }),
    }, mat);
    const toile = new THREE.MeshStandardMaterial({ color: 0x2c2d30, roughness: 1 });
    pieceDessus(caisse, cab, [[-1.15, 0], [0.38, 0], [0.38, 0.5], [-1.15, 0.5]], toile, 0.008);
    for (let i = 0; i < 4; i++) pieceDessus(caisse, cab, [[-1.0 + i * 0.35, 0], [-0.98 + i * 0.35, 0], [-0.98 + i * 0.35, 0.49], [-1.0 + i * 0.35, 0.49]], M.noir, 0.012); // les arceaux de la toile
    habitacle(caisse, { xPB: 0.68, xS: -0.15, sol: 0.38, hS: 0.66, w: 0.58, tdb: 1.05, toit: (x) => cab.tranche(x).yt, rangs: 2, cuir: [0.32, 0.3, 0.28], surpiqure: [0.3, 0.3, 0.3], volant: "fin" });
    // les ailes rondes, séparées de la caisse, au-dessus de chaque roue
    for (const r of R) for (const cote of [-1, 1]) {
      const aile = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      aile.scale.set(r.x > 0 ? 1.45 : 1.25, 0.95, 0.42);
      aile.position.set(r.x - (r.x > 0 ? 0.08 : 0), 0.46, cote * 0.68);
      aile.castShadow = true;
      caisse.add(aile);
    }
    // le capot ondulé (5 nervures), les phares ronds sur leur pied, la calandre avec ses chevrons
    for (let i = -2; i <= 2; i++) caisse.add(surLeDessus(plat(0.62, 0.025, peinture(fonce(k1, 0.85)), 0.012), c, 1.28, i * 0.09, 0.004));
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.1);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(1.62, 0.92, cote * 0.45);
      caisse.add(ph);
      caisse.add(boite(0.08, 0.12, 0.04, mat, 1.55, 0.83, cote * 0.45));
      const feu = cylindre(0.05, 0.03, M.feuLed, 16);
      feu.rotation.z = Math.PI / 2;
      feu.position.set(c.xMin - 0.01, 0.8, cote * 0.42);
      caisse.add(feu);
      for (const x of [0.45, -0.75]) surLeFlanc(caisse, c, x, 0.98, cote, 0.12, 0.025, M.chrome, 0.02); // les poignées
    }
    grille(caisse, c, true, 0.6, 0, 0.18, 0.36, M.chrome);
    emblemeAuBout(caisse, c, "citroen", true, 0.6, 0.14);
    // les pare-chocs fins en tube chromé
    for (const [x, y] of [[c.xMax + 0.05, 0.42], [c.xMin - 0.05, 0.45]]) caisse.add(tube([x, y, -0.62], [x, y, 0.62], 0.025, M.chrome));
    lettres(caisse, c, false, 0.62, 0, "2CV", 0.22, 0.06);
    plaque(caisse, c, false, 0.52, "2CV-1949");
    for (const x of [0.6, -0.4, -1.15]) for (const cote of [-1, 1]) surLeFlanc(caisse, c, x, 0.68, cote, 0.006, 0.5, M.noir, 0.004);
    retro(caisse, 0.62, 1.08, 0.66, M.chrome, 0.75);
    finitions(caisse, c, R, {}); // (étape 70)
    const roues = roues4(g, R, 0.62, "acier", {});
    return voiture(g, caisse, roues, 1.5);
  }

  // La roue de secours accrochée derrière (le pneu à crampons, la jante, et un cache peint si on veut).
  function roueSecours(caisse, x, y, r, cache) {
    const pneu = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, r * 0.3, 12, 30), new THREE.MeshStandardMaterial({ color: 0x1c1c1e, roughness: 0.9 }));
    pneu.rotation.y = Math.PI / 2;
    pneu.position.set(x, y, 0);
    caisse.add(pneu);
    const jante = cylindre(r * 0.62, 0.2, cache || M.jante, 28);
    jante.rotation.z = Math.PI / 2;
    jante.position.set(x - 0.02, y, 0);
    caisse.add(jante);
  }
  // Un élargisseur d'aile en plastique noir, autour d'un passage de roue (un arc épais, collé sur le flanc).
  function elargisseur(caisse, c, R, r, epaisseur, haut) {
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (k / 12);
      pts.push([r.x + Math.cos(a) * (r.r + 0.07), r.r + Math.sin(a) * (r.r + 0.07) * (haut || 1)]);
    }
    traitFlanc(caisse, c, R, pts, epaisseur || 0.05, M.plastique);
  }

  // 🇩🇪 Mercedes-AMG G 63 (4,87 m × 1,98 m × 1,97 m, empattement 2,89 m), la « Classe G » : une vraie boîte, les phares
  // ronds, les clignotants posés sur les ailes, la calandre à barres verticales (« Panamericana »), les charnières de
  // portes apparentes, les sorties d'échappement sur les côtés et la roue de secours derrière.
  function mercedesG(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.43, r: 0.417, l: 0.275, j: 0.279 }, { x: -1.46, r: 0.417, l: 0.275, j: 0.279 }];
    const c = peau(caisse, [
      T(-2.33, 0.5, 1.15, 1.22, 0.96, 0.95, 0.9, { rt: 0.05, de: 0.01 }),
      T(-2.25, 0.46, 1.2, 1.9, 0.99, 0.97, 0.9, { rt: 0.06 }),
      T(-2.15, 0.45, 1.2, 1.95, 0.99, 0.97, 0.9, { rt: 0.06 }),
      T(-1.46, 0.45, 1.2, 1.96, 0.99, 0.97, 0.9, { rt: 0.06 }),
      T(0.3, 0.45, 1.2, 1.96, 0.99, 0.97, 0.9, { rt: 0.06 }),
      T(0.55, 0.45, 1.2, 1.9, 0.99, 0.97, 0.88, { rt: 0.06 }),
      T(0.88, 0.45, 1.19, 1.25, 0.99, 0.96, 0.86, { de: 0.02, rt: 0.04 }),
      T(0.98, 0.45, 1.19, 1.16, 0.99, 0.94, 0.78, { de: 0.03, rt: 0.04 }),
      T(1.45, 0.45, 1.19, 1.15, 0.99, 0.94, 0.78, { de: 0.03, rt: 0.04 }),
      T(2.3, 0.48, 1.17, 1.12, 0.98, 0.93, 0.76, { de: 0.03, rt: 0.04 }),
      T(2.42, 0.55, 1.1, 1.06, 0.95, 0.9, 0.74, { de: 0.02, rt: 0.05 }),
    ], R, 0.84, peinture(k1), vitresUnies({ pareBrise: [0.55, 0.88], cotes: [-2.18, 0.84], montants: [-0.35, -1.4], lunette: [-2.33, -2.25], pilier: 0.07, haut: 0.05 }));
    habitacle(caisse, { xPB: 0.86, xS: -0.1, sol: 0.62, hS: 0.98, w: 0.8, tdb: 1.32, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.6, 0.12, 0.1], surpiqure: [0.1, 0.1, 0.1], volant: "rond" });
    // l'avant : les phares ronds, les clignotants sur les ailes, la calandre à barres verticales et la grande étoile
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.13);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.01, 0.9, cote * 0.68);
      caisse.add(ph);
      caisse.add(surLeDessus(plat(0.16, 0.08, M.orange, 0.04), c, 2.28, cote * 0.92, 0.02));
      auBout(caisse, c, true, 0.62, cote * 0.6, 0.06, 0.14, M.led, 0.04); // les antibrouillards
    }
    auBout(caisse, c, true, 0.86, 0, 0.32, 0.86, trou(), 0.02);
    for (let i = -7; i <= 7; i++) auBout(caisse, c, true, 0.86, i * 0.055, 0.3, 0.014, M.chrome, 0.035);
    emblemeAuBout(caisse, c, "mercedes", true, 0.86, 0.22, 0.22, 0, 0.04);
    auBout(caisse, c, true, 0.6, 0, 0.2, 1.84, M.plastique, 0.12); // le pare-chocs
    // les flancs : la baguette de protection, les charnières, le marchepied, les sorties d'échappement sur le côté
    traitFlanc(caisse, c, R, [[2.3, 0.86], [0.9, 0.86], [-0.9, 0.86], [-2.3, 0.86]], 0.025, M.plastique);
    for (const cote of [-1, 1]) {
      for (const [x, y] of [[0.86, 0.68], [0.86, 1.05], [-0.4, 0.68], [-0.4, 1.05]]) caisse.add(boite(0.06, 0.1, 0.03, M.noir, x, y, cote * 1.0));
      caisse.add(boite(1.8, 0.05, 0.2, M.plastique, -0.05, 0.42, cote * 1.0));
      for (const dz of [0, 0.1]) {
        const tuyau = cylindre(0.035, 0.18, M.chrome, 14);
        tuyau.rotation.x = Math.PI / 2;
        tuyau.position.set(0.95 - dz * 1.5, 0.36, cote * (1.0 + 0.05));
        caisse.add(tuyau);
      }
      optiqueAuBout(caisse, c, false, 0.95, cote * 0.8, 0.3, 0.12, [[0.06, 0, 0.12, 0.08], [-0.08, 0, 0.1, 0.08]], "feu");
    }
    for (const x of [0.86, -0.38, -1.42]) portiere(caisse, c, x, x - 0.02, 0.5, 1.15, false);
    poignees(caisse, c, 0.4, 1.08, 0.16, M.chrome);
    poignees(caisse, c, -0.85, 1.08, 0.16, M.chrome);
    // l'arrière : la roue de secours avec son cache peint, la plaque, G 63
    roueSecours(caisse, c.xMin - 0.18, 1.08, 0.42, peinture(k1));
    emblemeAuBout(caisse, c, "mercedes", false, 1.08, 0.18, 0.18, 0, 0.3);
    lettres(caisse, c, false, 0.68, 0.55, "G 63", 0.26, 0.06);
    plaque(caisse, c, false, 0.68, "AMG-G-63");
    plaque(caisse, c, true, 0.62, "AMG-G-63");
    auBout(caisse, c, false, 0.55, 0, 0.16, 1.9, M.plastique, 0.1);
    essuieGlaces(caisse, c, 0.87, 0.6);
    retro(caisse, 0.78, 1.32, 0.98, peinture(k1), 1.25);
    finitions(caisse, c, R, { repetiteur: [1.8, 1.0], antenne: -1.6, capteurs: [0.55, 0.55, 0.7] }); // (étape 70)
    const roues = roues4(g, R, 0.84, "y", { etrier: [0.75, 0.06, 0.06] });
    return voiture(g, caisse, roues, 1.8);
  }

  // 🇬🇧 Land Rover Defender 110 (4,76 m × 2,00 m × 1,97 m, empattement 3,02 m). Le nouveau : une boîte aux coins
  // arrondis, le toit de couleur 2, les phares ronds dans des carrés, DEFENDER écrit sur le capot, les élargisseurs
  // noirs, le panneau noir derrière les portes arrière, et la roue de secours sur la porte (qui s'ouvre sur le côté).
  function defender(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.52, r: 0.407, l: 0.255, j: 0.254 }, { x: -1.5, r: 0.407, l: 0.255, j: 0.254 }];
    const c = peau(caisse, [
      T(-2.38, 0.55, 1.12, 1.2, 0.97, 0.95, 0.88, { rt: 0.12, de: 0.01 }),
      T(-2.3, 0.5, 1.15, 1.88, 0.99, 0.97, 0.88, { rt: 0.12 }),
      T(-2.2, 0.48, 1.16, 1.94, 1.0, 0.97, 0.88, { rt: 0.12 }),
      T(-1.5, 0.48, 1.18, 1.96, 1.0, 0.97, 0.88, { rt: 0.12 }),
      T(0.4, 0.48, 1.18, 1.96, 1.0, 0.97, 0.88, { rt: 0.12 }),
      T(0.75, 0.48, 1.17, 1.88, 1.0, 0.97, 0.87, { rt: 0.12 }),
      T(1.12, 0.48, 1.15, 1.22, 1.0, 0.96, 0.84, { de: 0.02, rt: 0.08 }),
      T(1.22, 0.48, 1.14, 1.15, 1.0, 0.95, 0.82, { de: 0.02, rt: 0.08 }),
      T(1.52, 0.48, 1.13, 1.14, 1.0, 0.95, 0.82, { de: 0.02, rt: 0.1 }),
      T(2.2, 0.5, 1.1, 1.1, 0.98, 0.94, 0.8, { de: 0.02, rt: 0.14 }),
      T(2.38, 0.6, 0.98, 1.0, 0.92, 0.88, 0.76, { de: 0.01, rt: 0.14 }),
    ], R, 0.84, peinture(k1), vitresUnies({ pareBrise: [0.75, 1.12], cotes: [-2.2, 1.08], montants: [-0.3, -1.3], lunette: [-2.38, -2.3], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 1.1, xS: 0.25, sol: 0.62, hS: 0.98, w: 0.8, tdb: 1.32, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.45, 0.35, 0.25], surpiqure: [0.2, 0.15, 0.1], volant: "rond" });
    pieceDessus(caisse, c, [[-2.22, 0], [0.7, 0], [0.7, 0.84], [-2.22, 0.84]], peinture(k2), 0.004); // le toit de couleur 2
    // l'avant : les phares (un rond dans un carré), la calandre noire, DEFENDER, l'ovale vert, la plaque de protection
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 0.84, cote * 0.66, 0.24, 0.3, [[0, 0, 0.2, 0.025], [0.1, 0, 0.025, 0.26], [-0.1, 0, 0.025, 0.26]]);
      const rond = phareRond(0.075);
      rond.rotation.z = -Math.PI / 2;
      rond.position.set(c.xMax + 0.03, 0.84, cote * 0.66);
      caisse.add(rond);
    }
    auBout(caisse, c, true, 0.82, 0, 0.2, 0.84, trou(), 0.02);
    for (let i = 0; i < 4; i++) auBout(caisse, c, true, 0.75 + i * 0.05, 0, 0.014, 0.8, carbone(), 0.03);
    emblemeAuBout(caisse, c, "landrover", true, 0.82, 0.24, 0.12, 0, 0.035);
    lettres(caisse, c, true, 0.96, 0, "DEFENDER", 0.6, 0.06, "#e9ecef");
    auBout(caisse, c, true, 0.62, 0, 0.16, 1.8, M.plastique, 0.08);
    auBout(caisse, c, true, 0.52, 0, 0.06, 0.9, inox(), 0.1);
    // les flancs : les élargisseurs noirs, le panneau noir (« side gear »), le bas de caisse
    for (const r of R) elargisseur(caisse, c, R, r, 0.045);
    pieceFlanc(caisse, c, R, [[-1.95, 0.75], [-1.6, 0.75], [-1.6, 1.12], [-1.95, 1.12]], M.plastique, 0.01);
    traitFlanc(caisse, c, R, [[1.0, 0.55], [0, 0.53], [-1.0, 0.55]], 0.04, M.plastique);
    for (const x of [0.4, -0.65]) poignees(caisse, c, x, 1.02, 0.18, M.noir);
    portiere(caisse, c, 1.08, -0.3, 0.55, 1.12, false);
    portiere(caisse, c, -0.32, -1.25, 0.55, 1.14, false);
    // l'arrière : les feux carrés, la roue de secours sur la porte, la plaque
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 1.0, cote * 0.78, 0.22, 0.14, [[0.05, 0, 0.06, 0.1], [-0.05, 0, 0.06, 0.1]], "feu");
    roueSecours(caisse, c.xMin - 0.18, 1.05, 0.4, peinture(k2));
    plaque(caisse, c, false, 0.68, "DF-110-LR");
    plaque(caisse, c, true, 0.62, "DF-110-LR");
    auBout(caisse, c, false, 0.6, 0, 0.14, 1.9, M.plastique, 0.08);
    essuieGlaces(caisse, c, 1.11, 0.6);
    retro(caisse, 1.0, 1.3, 0.99, peinture(k2), 1.25);
    finitions(caisse, c, R, { repetiteur: [1.8, 1.0], antenne: -1.7, capteurs: [0.6, 0.6, 0.7] }); // (étape 70)
    const roues = roues4(g, R, 0.84, "etoile", { pneu: "crampons" });
    return voiture(g, caisse, roues, 1.8);
  }

  // 🇺🇸 Jeep Wrangler (4,33 m × 1,89 m × 1,84 m, empattement 2,46 m). La calandre à 7 FENTES avec les phares ronds
  // dans les fentes du bout, le pare-brise presque droit, les ailes en trapèze séparées de la caisse, le toit rigide
  // noir (couleur 2), les charnières apparentes et la roue de secours sur le hayon.
  function wrangler(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.23, r: 0.416, l: 0.285, j: 0.216 }, { x: -1.23, r: 0.416, l: 0.285, j: 0.216 }];
    const c = peau(caisse, [
      T(-2.05, 0.6, 1.08, 1.12, 0.86, 0.85, 0.8, { rt: 0.06, de: 0.01 }),
      T(-1.98, 0.56, 1.12, 1.78, 0.88, 0.86, 0.8, { rt: 0.08 }),
      T(-1.85, 0.55, 1.13, 1.84, 0.88, 0.86, 0.8, { rt: 0.08 }),
      T(0.1, 0.55, 1.13, 1.84, 0.88, 0.86, 0.8, { rt: 0.08 }),
      T(0.3, 0.55, 1.13, 1.8, 0.88, 0.86, 0.8, { rt: 0.06 }),
      T(0.7, 0.55, 1.13, 1.2, 0.88, 0.86, 0.8, { de: 0.02, rt: 0.04 }),
      T(0.8, 0.55, 1.12, 1.17, 0.87, 0.84, 0.72, { de: 0.02, rt: 0.06 }),
      T(1.95, 0.58, 1.1, 1.13, 0.86, 0.83, 0.72, { de: 0.02, rt: 0.06 }),
      T(2.1, 0.62, 1.04, 1.08, 0.84, 0.82, 0.7, { de: 0.01, rt: 0.05 }),
      T(2.165, 0.66, 0.98, 1.02, 0.82, 0.8, 0.68, { de: 0.01, rt: 0.05 }),
    ], R, 0.81, peinture(k1), vitresUnies({ pareBrise: [0.3, 0.7], cotes: [-1.92, 0.68], montants: [-0.35], lunette: [-2.05, -1.98], pilier: 0.06, haut: 0.06 }), 0);
    habitacle(caisse, { xPB: 0.68, xS: -0.25, sol: 0.66, hS: 1.0, w: 0.72, tdb: 1.32, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.12, 0.12, 0.12], surpiqure: [0.9, 0.55, 0.1], volant: "rond" });
    pieceDessus(caisse, c, [[-1.92, 0], [0.28, 0], [0.28, 0.78], [-1.92, 0.78]], peinture(k2), 0.004); // le toit rigide noir
    // les ailes en trapèze, séparées de la caisse (couleur 2)
    for (const r of R) for (const cote of [-1, 1]) {
      const forme = new THREE.Shape();
      forme.moveTo(r.x - 0.72, 0.62); forme.lineTo(r.x - 0.48, 1.06); forme.lineTo(r.x + 0.48, 1.06); forme.lineTo(r.x + 0.72, 0.62);
      forme.lineTo(r.x + 0.5, 0.62); forme.absarc(r.x, r.r, r.r + 0.08, 0.2, Math.PI - 0.2, false); forme.lineTo(r.x - 0.72, 0.62);
      const geo = new THREE.ExtrudeGeometry(forme, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 });
      const aile = new THREE.Mesh(geo, peinture(k2));
      aile.position.z = cote > 0 ? 0.8 : -0.96;
      aile.castShadow = true;
      caisse.add(aile);
    }
    // la calandre à 7 fentes, et les phares ronds dans les fentes du bout
    for (let i = -2; i <= 2; i++) auBout(caisse, c, true, 0.86, i * 0.12, 0.3, 0.06, trou(), 0.02);
    for (const cote of [-1, 1]) {
      const ph = phareRond(0.12);
      ph.rotation.z = -Math.PI / 2;
      ph.position.set(c.xMax + 0.02, 0.86, cote * 0.48);
      caisse.add(ph);
      auBout(caisse, c, true, 0.96, cote * 0.7, 0.05, 0.1, M.orange, 0.03);
    }
    emblemeDessus(caisse, c, "jeep", 1.95, 0.3, 0.12);
    // le pare-chocs en acier, les crochets rouges, les charnières, le marchepied
    auBout(caisse, c, true, 0.6, 0, 0.18, 1.86, M.plastique, 0.16);
    for (const cote of [-1, 1]) {
      caisse.add(boite(0.1, 0.06, 0.05, peinture([0.8, 0.05, 0.05]), c.xMax + 0.2, 0.6, cote * 0.55));
      for (const y of [0.75, 1.05]) caisse.add(boite(0.08, 0.08, 0.04, M.noir, 0.66, y, cote * 0.9));
      caisse.add(boite(0.04, 0.04, 0.06, M.noir, 0.7, 1.22, cote * 0.86)); // la charnière du pare-brise
      caisse.add(tube([0.75, 0.48, cote * 0.92], [-0.75, 0.48, cote * 0.92], 0.04, M.plastique));
    }
    portiere(caisse, c, 0.66, -0.36, 0.6, 1.1, false);
    poignees(caisse, c, -0.1, 1.04, 0.16, M.noir);
    // l'arrière : les feux carrés, la roue de secours sur le hayon
    for (const cote of [-1, 1]) optiqueAuBout(caisse, c, false, 0.86, cote * 0.74, 0.28, 0.12, [[0.06, 0, 0.1, 0.08], [-0.07, 0, 0.08, 0.08]], "feu");
    roueSecours(caisse, c.xMin - 0.2, 1.05, 0.42, M.jante);
    plaque(caisse, c, false, 0.68, "JP-4X4-WR");
    plaque(caisse, c, true, 0.5, "JP-4X4-WR");
    auBout(caisse, c, false, 0.6, 0, 0.14, 1.7, M.plastique, 0.08);
    essuieGlaces(caisse, c, 0.69, 0.55);
    retro(caisse, 0.62, 1.22, 0.88, M.noir, 1.2);
    finitions(caisse, c, R, { repetiteur: [1.5, 0.98], antenne: 0.1 }); // (étape 70)
    const roues = roues4(g, R, 0.81, "doubles", { pneu: "crampons" });
    return voiture(g, caisse, roues, 1.75);
  }

  // 🇺🇸 Ford F-150 Raptor (5,89 m × 2,19 m × 2,00 m, empattement 3,69 m). Un énorme pick-up de désert : les 4 portes,
  // la benne derrière, la calandre noire avec FORD en lettres géantes, les phares en C, les 3 feux orange au-dessus,
  // les ailes élargies et les pneus à crampons de 87 cm.
  function raptor(k1, k2) {
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    const R = [{ x: 1.92, r: 0.437, l: 0.315, j: 0.216 }, { x: -1.77, r: 0.437, l: 0.315, j: 0.216 }];
    const mat = peinture(k1);
    const c = peau(caisse, [
      T(-0.82, 0.68, 1.3, 1.38, 1.0, 0.98, 0.9, { rt: 0.06, de: 0.01 }),
      T(-0.74, 0.66, 1.34, 1.94, 1.02, 0.99, 0.9, { rt: 0.08 }),
      T(-0.6, 0.65, 1.35, 1.99, 1.02, 0.99, 0.9, { rt: 0.08 }),
      T(0.9, 0.65, 1.36, 2.0, 1.02, 0.99, 0.9, { rt: 0.08 }),
      T(1.15, 0.65, 1.37, 1.94, 1.02, 0.99, 0.89, { rt: 0.08 }),
      T(1.72, 0.65, 1.38, 1.44, 1.03, 1.0, 0.88, { de: 0.02, rt: 0.05 }),
      T(1.82, 0.65, 1.38, 1.42, 1.04, 1.0, 0.82, { de: 0.02, rt: 0.06 }),
      T(2.5, 0.68, 1.37, 1.4, 1.06, 1.0, 0.82, { de: 0.02, rt: 0.06 }),
      T(2.85, 0.72, 1.3, 1.33, 1.04, 0.98, 0.8, { de: 0.01, rt: 0.06 }),
      T(2.945, 0.78, 1.2, 1.22, 1.0, 0.96, 0.78, { de: 0.01, rt: 0.06 }),
    ], R, 0.92, mat, vitresUnies({ pareBrise: [1.15, 1.72], cotes: [-0.7, 1.68], montants: [0.42], lunette: [-0.82, -0.74], pilier: 0.08, haut: 0.06 }));
    habitacle(caisse, { xPB: 1.7, xS: 0.85, sol: 0.72, hS: 1.08, w: 0.86, tdb: 1.46, toit: (x) => c.tranche(x).yt, rangs: 2, cuir: [0.1, 0.1, 0.1], surpiqure: [0.95, 0.4, 0.05], volant: "rond" });
    // la benne : le fond, les deux côtés, le hayon, les feux verticaux
    const xB1 = -2.945, xB2 = -0.86, lB = xB2 - xB1, xM = (xB1 + xB2) / 2;
    caisse.add(boite(lB, 0.04, 1.9, M.plastique, xM, 0.95, 0));
    for (const cote of [-1, 1]) {
      caisse.add(boite(lB, 0.66, 0.08, mat, xM, 1.03, cote * 0.99));
      caisse.add(boite(lB, 0.03, 0.12, M.plastique, xM, 1.375, cote * 0.99)); // le dessus des rebords
      optiqueAuBout(caisse, { xMin: xB1 }, false, 1.12, cote * 0.92, 0.42, 0.12, [[0.1, 0, 0.12, 0.08], [-0.1, 0, 0.12, 0.08]], "feu");
    }
    caisse.add(boite(0.08, 0.62, 1.86, mat, xB1 + 0.04, 1.03, 0)); // le hayon
    caisse.add(boite(lB, 0.36, 1.92, mat, xM, 0.78, 0)); // le bas de la benne (au-dessus de la roue)
    lettres(caisse, { xMin: xB1 }, false, 1.12, 0, "F O R D", 0.8, 0.12, "#1b1b1b");
    caisse.add(boite(0.2, 0.18, 2.0, M.plastique, xB1 - 0.08, 0.62, 0)); // le pare-chocs arrière
    plaque(caisse, { xMin: xB1 - 0.18 }, false, 0.62, "RAP-TOR-01");
    // l'avant : la grande calandre noire et FORD, les phares en C, les 3 feux orange, la plaque de protection
    auBout(caisse, c, true, 1.0, 0, 0.36, 1.3, trou(), 0.02);
    lettres(caisse, c, true, 1.0, 0, "FORD", 1.0, 0.22, "#e9ecef", "bold 60px Arial").position.x += 0.03;
    for (let i = -1; i <= 1; i++) auBout(caisse, c, true, 1.2, i * 0.12, 0.03, 0.07, M.orange, 0.03);
    for (const cote of [-1, 1]) {
      optiqueAuBout(caisse, c, true, 1.0, cote * 0.82, 0.28, 0.28, [[0.11, 0, 0.025, 0.24], [-0.11, 0, 0.025, 0.24], [0, cote * 0.11, 0.24, 0.025], [0, 0, 0.1, 0.1]]);
    }
    auBout(caisse, c, true, 0.72, 0, 0.26, 2.0, M.plastique, 0.15);
    auBout(caisse, c, true, 0.58, 0, 0.08, 1.0, inox(), 0.12);
    emblemeAuBout(caisse, c, "ford", true, 0.74, 0.2, 0.11, 0, 0.16);
    // les flancs : les ailes élargies, le marchepied, les portes, les rétroviseurs
    for (const r of R) for (const cote of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 14; k++) {
        const a = Math.PI * (k / 14);
        pts.push(new THREE.Vector3(r.x + Math.cos(a) * (r.r + 0.1), r.r + Math.sin(a) * (r.r + 0.12), cote * 1.06));
      }
      caisse.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.07, 8, false), M.plastique));
    }
    for (const cote of [-1, 1]) caisse.add(boite(2.2, 0.06, 0.2, M.plastique, 0.55, 0.55, cote * 1.08));
    portiere(caisse, c, 1.66, 0.42, 0.68, 1.33, false);
    portiere(caisse, c, 0.4, -0.7, 0.68, 1.33, false);
    for (const x of [1.0, -0.15]) poignees(caisse, c, x, 1.25, 0.2, M.noir);
    essuieGlaces(caisse, c, 1.7, 0.65);
    retro(caisse, 1.55, 1.48, 1.02, M.noir, 1.4);
    finitions(caisse, c, R, { repetiteur: [2.3, 1.2], antenne: -0.2 }); // (étape 70)
    const roues = roues4(g, R, 0.92, "acier", { pneu: "crampons", metal: new THREE.MeshStandardMaterial({ color: 0x2a2b2e, metalness: 0.6, roughness: 0.35 }) });
    return voiture(g, caisse, roues, 1.9);
  }

  Circuit.Modeles.ajouter({ audiR8, mercedesG, bmwM3, taycan, ferrariSF90, mcLaren720S, bolide, alpineA110, renault5, citroen2CV, defender, wrangler, raptor, cybertruck, batmobile, delorean });
  // (étape 70 : tous les outils du bureau d'études sont prêtés à l'atelier des voitures refaites : affichage/voitures-refaites.js)
  return { outils: { arches, T, peau, silhouette, lin, vitresUnies, habitacle, embleme, emblemeAuBout, emblemeDessus, pieceDessus, pieceFlanc, pharePose, bande, traitFlanc, essuieGlaces, poignees, retro, diffuseur, basDeCaisse, roues4, roueSecours, elargisseur, trou, carbone, nidAbeille, inox, inoxClair, fonce, LOGOS } };
})();
