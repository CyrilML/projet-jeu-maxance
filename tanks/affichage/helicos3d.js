// 🚁 LES HÉLICOS DE TRANSPORT EN 3D : le hangar du pont aérien (étape 73)
//
// ✍️ « Un Chinook (le gros, à 2 rotors, rampe à l'arrière) et un Black Hawk (1 rotor, portes sur les côtés). »
//   - le CHINOOK (CH-47) : un long fuselage carré aux coins arrondis, ses hublots ronds, le nez vitré avec les 2 pilotes,
//     les gros réservoirs sur les côtés (les « sponsons »), 4 roues devant et 2 derrière, la haute tour arrière (le
//     « pylône ») avec ses 2 moteurs, et DEUX rotors à 3 pales (devant et derrière) qui tournent en SENS INVERSE (comme
//     ça, l'hélico ne tourne pas sur lui-même : pas besoin de rotor de queue !). La RAMPE arrière s'ouvre : baissée au
//     sol, à plat pendant la descente à la corde, relevée en vol. Le mitrailleur est dans la porte avant droite, l'autre
//     à la fenêtre avant gauche ;
//   - le BLACK HAWK (UH-60) : un fuselage plus court et plus fin, le nez pointu, les 2 moteurs sur le dos, la longue
//     poutre de queue avec la dérive, le petit rotor de queue (sur le côté droit) et le stabilisateur, le train à 2 roues
//     et la roulette de queue, le grand rotor à 4 pales. Les grandes PORTES coulissantes sont ouvertes (glissées vers
//     l'arrière) : on voit les soldats assis au bord, les jambes dans le vide, tant qu'ils sont à bord ; les 2
//     mitrailleurs sont aux fenêtres juste derrière les pilotes ; les bras des cordes sont au-dessus des portes.
// Pendant la descente à la corde, les 2 CORDES pendent jusqu'au sol ; quand une mitrailleuse tire, une petite flamme.
// Comme les autres engins (étape 70) : les pièces sont fabriquées avec la boîte à outils (outils3d.js) et SOUDÉES
// (presque tout dans une seule matière à couleurs de sommets : 1 dessin pour tout le fuselage). Un modèle par sorte et
// par équipe, puis des COPIES. Et de loin : une version SIMPLE en instances (1 dessin pour tous ceux d'une équipe).
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Helicos3D = (function () {
  const O = Tanks.Outils3D, CT = Tanks.Chars3D.C;
  const MT = () => Tanks.Chars3D.materiaux();
  const OU = () => Tanks.Engins3D.outils;
  const SORTES = ["chinook", "blackhawk"];
  const sait = (sorte) => SORTES.includes(sorte);
  const K = () => Tanks.CONFIG.helicosTransport;
  // les couleurs : vert olive pour les Bleus, sable pour les Rouges (les vrais hélicos ne sont pas camouflés à taches)
  const PEINTURE = { bleus: 0x4a5236, rouges: 0x8f7d57 };
  const COUL = { pale: 0x26292c, bout: 0xd8b020, sombre: 0x16181a, interieur: 0x23251f, pneu: 0x161616 };
  let matCorde = null, matFlamme = null;

  // Un petit personnage fait de quelques pièces (un pilote, un mitrailleur, un soldat assis) : le buste avec son gilet,
  // la tête, le casque. (x, y, z) = le bas du buste.
  function bonhomme(g, m, x, y, z, gilet, casque) {
    g.add(O.boite(0.3, 0.5, 0.36, m.teinte, x, y + 0.25, z, gilet));
    g.add(O.piece(new THREE.SphereGeometry(0.1, 8, 6), m.teinte, x + 0.02, y + 0.62, z, CT.peau));
    g.add(O.piece(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, x, y + 0.66, z, casque || CT.casque));
  }
  // Une roue (pneu + moyeu), couchée sur l'axe z.
  function roue(g, m, x, r, z, larg) {
    g.add(O.couche(O.cylindre(r, r, larg, m.teinte, 14, COUL.pneu), "z", x, r, z));
    g.add(O.couche(O.cylindre(r * 0.45, r * 0.45, larg + 0.04, m.teinte, 10, CT.acier), "z", x, r, z));
  }
  // Un rotor : le moyeu et n pales (longueur r, largeur « corde »), le bout de chaque pale peint en jaune.
  function rotor(nom, x, y, n, r, corde, decalage) {
    const m = MT(), g = new THREE.Group();
    g.name = nom;
    g.position.set(x, y, 0);
    g.add(O.cylindre(0.42, 0.34, 0.3, m.teinte, 12, CT.noir));
    g.add(O.cylindre(0.12, 0.12, 0.5, m.teinte, 8, CT.acier).translateY(0.3));
    for (let k = 0; k < n; k++) {
      const a = (k * Math.PI * 2) / n + (decalage || 0), c = Math.cos(a), s = -Math.sin(a);
      const pale = O.profil([[0, -corde / 2], [r - 0.25, -corde / 2], [r, -corde * 0.15], [r, corde * 0.35], [0, corde / 2]], 0.06, m.teinte, 0.01, COUL.pale);
      pale.rotation.set(-Math.PI / 2, a, 0, "YXZ");
      pale.position.set(c * 0.35, 0.02, s * 0.35);
      g.add(pale);
      g.add(O.boite(0.7, 0.14, 0.2, m.teinte, c * 0.5, 0, s * 0.5, CT.acier).rotateY(a)); // l'attache
      g.add(O.boite(0.35, 0.065, corde * 0.95, m.teinte, c * (r - 0.25), 0.025, s * (r - 0.25), COUL.bout).rotateY(a));
    }
    O.souder(g);
    return g;
  }
  // Les 2 cordes (cachées tant qu'on ne descend pas) et les 2 petites flammes des mitrailleuses.
  function cordesEtFlammes(g, sorte) {
    matCorde = matCorde || new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.95 });
    matFlamme = matFlamme || new THREE.MeshBasicMaterial({ color: 0xffc860 });
    const geo = new THREE.CylinderGeometry(0.035, 0.035, 1, 5).translate(0, -0.5, 0); // (haut à 0 : on l'allonge vers le bas)
    K().cordes[sorte].forEach(([x, y, z], k) => {
      const c = new THREE.Mesh(geo, matCorde);
      c.name = "corde" + k;
      c.position.set(x, y, z);
      c.visible = false;
      c.castShadow = false;
      g.add(c);
    });
    K().portes[sorte].forEach(([x, y, z], k) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 5), matFlamme);
      f.name = "flamme" + k;
      f.position.set(x, y, z + Math.sign(z) * 0.75);
      f.visible = false;
      g.add(f);
    });
  }
  // Une mitrailleuse de porte (M240) qui pointe vers le côté s (+1 droite, -1 gauche) : le support, le boîtier, la
  // caisse de munitions, le canon, le cache-flamme.
  function mitrailleuse(g, m, x, y, z, s) {
    g.add(O.tube([x, y - 0.45, z - s * 0.15], [x, y - 0.06, z], 0.035, m.teinte, 6, CT.acier));
    g.add(O.boite(0.11, 0.13, 0.5, m.teinte, x, y, z, CT.noir));
    g.add(O.boite(0.18, 0.15, 0.14, m.teinte, x - 0.14, y - 0.03, z - s * 0.05, CT.olive));
    g.add(O.couche(O.cylindre(0.025, 0.025, 0.6, m.teinte, 8, CT.noir), "z", x, y + 0.01, z + s * 0.5));
    g.add(O.couche(O.cylindre(0.035, 0.03, 0.09, m.teinte, 8, CT.noir), "z", x, y + 0.01, z + s * 0.82));
  }

  // ------------------------------------------------------------------ le CHINOOK (CH-47)
  // Mesures : fuselage de 15,5 m, 3,8 m de large avec les réservoirs, 2 rotors de 18,3 m, écartés de 12 m.
  function chinook(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], V = OU().vitreClaire();
    const P = PEINTURE[equipe], fonce = new THREE.Color(P).multiplyScalar(0.72), clair = new THREE.Color(P).multiplyScalar(1.12);
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // 1. La cabine : un long fuseau presque carré (le plancher à 1,15 m), le nez arrondi qui descend.
    caisse.add(O.fuseau([
      { x: -5.6, y: 2.35, w: 1.28, h: 1.25, n: 4, b: 1.2 }, { x: 3.6, y: 2.35, w: 1.28, h: 1.25, n: 4, b: 1.2 },
      { x: 5.4, y: 2.3, w: 1.25, h: 1.2, n: 3.6, b: 1.15 }, { x: 6.6, y: 2.08, w: 1.1, h: 0.98, n: 3, b: 0.95 },
      { x: 7.3, y: 1.82, w: 0.76, h: 0.62, n: 2.6, b: 0.62 }, { x: 7.65, y: 1.72, w: 0.3, h: 0.26 },
    ], m.teinte, 20, P));
    // 2. L'arrière : le dessus (au-dessus de la rampe), les 2 parois, le fond sombre de la cabine (vu rampe ouverte).
    caisse.add(O.fuseau([{ x: -7.85, y: 3.35, w: 0.95, h: 0.32, n: 3 }, { x: -7.3, y: 3.3, w: 1.22, h: 0.45, n: 4 }, { x: -5.6, y: 3.2, w: 1.28, h: 0.55, n: 4 }], m.teinte, 16, P));
    for (const s of [-1, 1]) caisse.add(O.profil([[-5.6, 1.15], [-5.6, 3.05], [-7.85, 3.05], [-7.85, 2.95], [-6.4, 1.5]], 0.08, m.teinte, 0.01, P).translateZ(s * 1.22));
    caisse.add(O.boite(0.03, 1.85, 2.3, m.teinte, -5.55, 2.1, 0, COUL.interieur));
    // 3. La tour arrière (le « pylône ») avec ses 2 moteurs, la tour avant, et le dos qui les relie.
    caisse.add(O.profil([[-2.8, 3.55], [-4.4, 4.95], [-6.9, 5.2], [-7.85, 4.7], [-7.85, 3.4], [-2.8, 3.4]], 1.5, m.teinte, 0.12, P));
    caisse.add(O.fuseau([{ x: 3.0, y: 3.72, w: 0.25, h: 0.2 }, { x: 3.8, y: 3.85, w: 0.68, h: 0.48, n: 3 }, { x: 6.4, y: 3.8, w: 0.62, h: 0.42, n: 3 }, { x: 7.0, y: 3.55, w: 0.3, h: 0.2 }], m.teinte, 14, P));
    caisse.add(O.boite(6.0, 0.32, 0.9, m.teinte, 0.1, 3.68, 0, fonce)); // le dos (le tunnel de l'arbre de transmission)
    caisse.add(O.cylindre(0.22, 0.3, 0.6, m.teinte, 10, CT.noir).translateX(5.9).translateY(4.25)); // les mâts des rotors
    caisse.add(O.cylindre(0.22, 0.3, 0.5, m.teinte, 10, CT.noir).translateX(-6.1).translateY(5.3));
    for (const s of [-1, 1]) {
      caisse.add(O.fuseau([{ x: -7.0, y: 4.05, w: 0.32, h: 0.32 }, { x: -6.6, y: 4.05, w: 0.46, h: 0.46 }, { x: -3.9, y: 4.05, w: 0.46, h: 0.46 }, { x: -3.45, y: 4.05, w: 0.4, h: 0.4 }], m.teinte, 14, clair).translateZ(s * 1.25));
      caisse.add(O.couche(O.cylindre(0.34, 0.34, 0.04, m.teinte, 12, COUL.sombre), "x", -3.43, 4.05, s * 1.25)); // l'entrée d'air
      caisse.add(O.couche(O.cylindre(0.26, 0.3, 0.3, m.teinte, 12, COUL.sombre), "x", -7.1, 4.05, s * 1.25)); // la tuyère
      for (const x of [-6.0, -4.4]) caisse.add(O.tube([x, 3.75, s * 0.7], [x, 4.0, s * 1.05], 0.06, m.teinte, 6, CT.acier)); // les supports
      // 4. Les réservoirs de côté (« sponsons »), le train (4 roues devant, 2 derrière), les hublots ronds.
      caisse.add(O.fuseau([{ x: -4.7, y: 1.5, w: 0.18, h: 0.25 }, { x: -4.1, y: 1.5, w: 0.42, h: 0.5, n: 3 }, { x: 2.6, y: 1.5, w: 0.42, h: 0.5, n: 3 }, { x: 3.4, y: 1.5, w: 0.18, h: 0.25 }], m.teinte, 14, P).translateZ(s * 1.42));
      for (const dz of [1.2, 1.6]) roue(caisse, m, 3.1, 0.45, s * dz, 0.26);
      caisse.add(O.tube([3.1, 0.45, s * 1.4], [3.0, 1.2, s * 1.4], 0.08, m.teinte, 8, CT.acier));
      roue(caisse, m, -4.4, 0.45, s * 1.42, 0.3);
      caisse.add(O.tube([-4.4, 0.45, s * 1.42], [-4.3, 1.15, s * 1.45], 0.08, m.teinte, 8, CT.acier));
      for (let x = -4.4; x < 3; x += 1.15) caisse.add(O.couche(O.cylindre(0.17, 0.17, 0.03, m.teinte, 12, COUL.sombre), "z", x, 2.62, s * 1.285));
      // 5. Le nez : les vitres du poste de pilotage (le pare-brise, les côtés, les vitres du bas) et les 2 pilotes.
      caisse.add(O.boite(0.04, 0.72, 0.82, V, 7.02, 2.45, s * 0.46).rotateY(s * 0.35).rotateZ(0.62));
      caisse.add(O.boite(1.15, 0.62, 0.03, V, 6.15, 2.5, s * 1.19).rotateX(s * -0.12));
      caisse.add(O.boite(0.5, 0.03, 0.5, V, 7.15, 1.25, s * 0.35).rotateZ(-0.5));
      bonhomme(caisse, m, 6.25, 1.95, s * 0.5, CT.tissu, CT.casque);
      // la marque de l'équipe : sur la tour arrière et sur la cabine
      caisse.add(O.boite(1.5, 0.5, 0.02, m.teinte, -5.6, 4.35, s * 0.77, E.marque));
      caisse.add(O.boite(1.7, 0.38, 0.02, m.teinte, -0.3, 3.0, s * 1.29, E.marque));
    }
    caisse.add(O.boite(0.06, 0.06, 1.0, m.teinte, 6.55, 3.05, 0, CT.noir)); // le montant du pare-brise
    caisse.add(O.tube([7.3, 1.9, 0.0], [8.4, 2.05, 0.4], 0.05, m.teinte, 6, CT.noir)); // la perche de ravitaillement
    // 6. Les mitrailleurs : la porte avant droite (ouverte, sombre) et la fenêtre avant gauche ; chacun avec sa M240.
    caisse.add(O.boite(1.1, 1.6, 0.02, m.teinte, 4.2, 2.05, 1.292, COUL.interieur));
    caisse.add(O.boite(0.8, 0.8, 0.02, m.teinte, 4.2, 2.4, -1.292, COUL.interieur));
    K().portes.chinook.forEach(([x, y, z]) => {
      const s = Math.sign(z);
      bonhomme(caisse, m, x + 0.35, y - 0.5, s * 1.3, 0x5f6a4a, CT.casque);
      caisse.add(O.tube([x + 0.35, y + 0.0, s * 1.35], [x, y - 0.03, s * 1.55], 0.045, m.teinte, 6, CT.tissu)); // les bras vers la poignée
      mitrailleuse(caisse, m, x, y, s * 1.75, s);
    });
    O.souder(caisse);
    // 7. La RAMPE (elle tourne autour de sa charnière, au bout du plancher) : la plaque, ses nervures, le bord.
    const rampe = new THREE.Group();
    rampe.name = "rampe";
    rampe.position.set(-5.6, 1.15, 0);
    rampe.add(O.boite(2.4, 0.12, 2.3, m.teinte, -1.2, -0.06, 0, P));
    for (const z of [-0.8, -0.27, 0.27, 0.8]) rampe.add(O.boite(2.2, 0.03, 0.1, m.teinte, -1.2, 0.01, z, COUL.sombre));
    rampe.add(O.boite(0.12, 0.16, 2.3, m.teinte, -2.38, -0.04, 0, fonce));
    O.souder(rampe);
    g.add(rampe);
    // 8. Les 2 rotors à 3 pales (celui de derrière est plus haut).
    g.add(rotor("rotor0", 5.9, 4.6, 3, 9.15, 0.8, 0), rotor("rotor1", -6.1, 5.6, 3, 9.15, 0.8, Math.PI / 3));
    cordesEtFlammes(g, "chinook");
    return g;
  }

  // ------------------------------------------------------------------ le BLACK HAWK (UH-60)
  // Mesures : 15,3 m de long (sans les rotors), cabine de 2,4 m de large, grand rotor de 16,4 m, rotor de queue de 3,4 m.
  function blackhawk(equipe) {
    const m = MT(), E = Tanks.CONFIG.equipes[equipe], V = OU().vitreClaire();
    const P = PEINTURE[equipe], fonce = new THREE.Color(P).multiplyScalar(0.72), clair = new THREE.Color(P).multiplyScalar(1.1);
    const gilet = equipe === "bleus" ? 0x5f6a4a : 0x8a7a56, tenue = new THREE.Color(E.camouflage[0]);
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // 1. La cabine et le nez, la poutre de queue, le capot des moteurs sur le dos.
    caisse.add(O.fuseau([
      { x: -2.4, y: 1.85, w: 0.85, h: 0.85, n: 3, b: 0.95 }, { x: -1.9, y: 1.75, w: 1.12, h: 0.95, n: 3.4, b: 1.0 },
      { x: 1.9, y: 1.75, w: 1.15, h: 0.95, n: 3.4, b: 1.0 }, { x: 2.9, y: 1.7, w: 1.05, h: 0.85, n: 3, b: 0.95 },
      { x: 3.7, y: 1.5, w: 0.8, h: 0.6, n: 2.6, b: 0.75 }, { x: 4.3, y: 1.3, w: 0.35, h: 0.3 },
    ], m.teinte, 20, P));
    caisse.add(O.fuseau([{ x: -9.6, y: 2.45, w: 0.18, h: 0.22 }, { x: -8.6, y: 2.35, w: 0.24, h: 0.28 }, { x: -4.0, y: 2.12, w: 0.45, h: 0.5, n: 2.6 }, { x: -2.3, y: 1.98, w: 0.8, h: 0.8, n: 3 }], m.teinte, 14, P));
    caisse.add(O.fuseau([{ x: -2.7, y: 2.75, w: 0.35, h: 0.18 }, { x: -2.0, y: 2.82, w: 0.78, h: 0.32, n: 3 }, { x: 0.9, y: 2.85, w: 0.78, h: 0.32, n: 3 }, { x: 1.6, y: 2.72, w: 0.4, h: 0.15 }], m.teinte, 14, fonce));
    caisse.add(O.cylindre(0.2, 0.28, 0.55, m.teinte, 10, CT.noir).translateX(0.35).translateY(3.35)); // le mât du rotor
    for (const s of [-1, 1]) {
      caisse.add(O.fuseau([{ x: -1.9, y: 2.98, w: 0.25, h: 0.25 }, { x: -1.5, y: 2.98, w: 0.34, h: 0.34 }, { x: 0.6, y: 2.98, w: 0.34, h: 0.34 }, { x: 0.95, y: 2.98, w: 0.28, h: 0.28 }], m.teinte, 12, clair).translateZ(s * 0.62));
      caisse.add(O.couche(O.cylindre(0.26, 0.26, 0.04, m.teinte, 12, COUL.sombre), "x", 0.97, 2.98, s * 0.62)); // l'entrée d'air
      caisse.add(O.tube([-1.9, 2.98, s * 0.62], [-2.4, 3.05, s * 0.95], 0.2, m.teinte, 10, COUL.sombre)); // la tuyère (tournée vers l'extérieur)
      // 2. Le train : la roue, la jambe et le bras ; les vitres du cockpit et les pilotes.
      roue(caisse, m, 2.75, 0.38, s * 1.45, 0.24);
      caisse.add(O.tube([2.75, 0.38, s * 1.38], [2.9, 1.25, s * 0.98], 0.06, m.teinte, 6, CT.acier), O.tube([2.75, 0.38, s * 1.38], [2.1, 1.0, s * 1.0], 0.05, m.teinte, 6, CT.acier));
      caisse.add(O.boite(0.04, 0.66, 0.74, V, 3.62, 2.05, s * 0.4).rotateY(s * 0.3).rotateZ(0.72));
      caisse.add(O.boite(1.0, 0.58, 0.03, V, 2.85, 2.0, s * 1.06).rotateX(s * -0.15));
      caisse.add(O.boite(0.45, 0.03, 0.45, V, 3.9, 0.95, s * 0.3).rotateZ(-0.5));
      bonhomme(caisse, m, 2.75, 1.45, s * 0.48, CT.tissu, CT.casque);
      // 3. Les grandes PORTES ouvertes : l'ouverture (sombre), la porte glissée vers l'arrière, son rail, le bras de la corde.
      caisse.add(O.boite(1.9, 1.5, 0.02, m.teinte, -0.65, 1.6, s * 1.162, COUL.interieur));
      caisse.add(O.boite(1.6, 1.42, 0.05, m.teinte, -2.25, 1.62, s * 1.21, P));
      caisse.add(O.boite(1.0, 0.45, 0.06, V, -2.15, 1.95, s * 1.24));
      caisse.add(O.boite(4.0, 0.04, 0.05, m.teinte, -1.2, 2.42, s * 1.18, CT.noir));
      caisse.add(O.tube([0.1, 2.62, s * 0.95], [0.1, 2.78, s * 1.58], 0.045, m.teinte, 6, CT.noir));
      caisse.add(O.boite(0.06, 0.12, 0.06, m.teinte, 0.1, 2.74, s * 1.56, CT.acier));
      // 4. La fenêtre du mitrailleur (sombre), juste derrière les pilotes.
      caisse.add(O.boite(0.7, 0.68, 0.02, m.teinte, 1.55, 1.95, s * 1.162, COUL.interieur));
      // la marque de l'équipe : sur la poutre de queue et sous la fenêtre
      caisse.add(O.boite(1.6, 0.34, 0.02, m.teinte, -5.6, 2.12, s * 0.47, E.marque).rotateX(s * -0.08));
      caisse.add(O.boite(0.7, 0.2, 0.02, m.teinte, 1.55, 1.38, s * 1.165, E.marque));
    }
    K().portes.blackhawk.forEach(([x, y, z]) => {
      const s = Math.sign(z);
      bonhomme(caisse, m, x - 0.25, y - 0.55, s * 1.05, gilet, CT.casque);
      caisse.add(O.tube([x - 0.2, y + 0.0, s * 1.15], [x, y - 0.03, s * 1.3], 0.045, m.teinte, 6, CT.tissu));
      mitrailleuse(caisse, m, x, y, s * 1.5, s);
    });
    // 5. La queue : la dérive, le stabilisateur, la roulette, la boîte du rotor de queue.
    caisse.add(O.profil([[-8.9, 2.35], [-9.9, 2.45], [-10.7, 4.3], [-10.15, 4.35], [-9.3, 2.9]], 0.24, m.teinte, 0.05, P));
    caisse.add(O.boite(0.85, 0.07, 4.3, m.teinte, -9.75, 2.1, 0, P));
    caisse.add(O.tube([-8.4, 2.1, 0], [-8.5, 0.25, 0], 0.05, m.teinte, 6, CT.acier));
    roue(caisse, m, -8.5, 0.22, 0, 0.14);
    caisse.add(O.boite(0.35, 0.35, 0.3, m.teinte, -10.45, 3.75, 0.12, CT.noir));
    caisse.add(O.tube([0.0, 1.3, -1.0], [-0.2, 1.2, -1.35], 0.04, m.teinte, 5, CT.noir)); // le marchepied
    O.souder(caisse);
    // 6. Les soldats assis au bord des portes, les jambes dans le vide (cachés quand ils sont tous descendus).
    const passagers = new THREE.Group();
    passagers.name = "passagers";
    for (const s of [-1, 1]) for (const x of [-1.2, -0.25]) {
      passagers.add(O.boite(0.34, 0.52, 0.3, m.teinte, x, 1.12, s * 1.06, gilet));
      passagers.add(O.piece(new THREE.SphereGeometry(0.1, 8, 6), m.teinte, x, 1.5, s * 1.12, CT.peau));
      passagers.add(O.piece(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), m.teinte, x, 1.54, s * 1.1, CT.casque));
      for (const d of [-0.09, 0.09]) {
        passagers.add(O.tube([x + d, 0.9, s * 1.0], [x + d, 0.88, s * 1.42], 0.07, m.teinte, 6, tenue)); // la cuisse
        passagers.add(O.tube([x + d, 0.88, s * 1.42], [x + d, 0.42, s * 1.5], 0.06, m.teinte, 6, tenue)); // la jambe dans le vide
        passagers.add(O.boite(0.24, 0.1, 0.11, m.teinte, x + d + 0.04, 0.4, s * 1.52, 0x3a2c20));
      }
      passagers.add(O.boite(0.05, 0.8, 0.05, m.teinte, x + 0.16, 1.2, s * 1.2, 0x23252a).rotateX(s * 0.3)); // le fusil
    }
    O.souder(passagers);
    g.add(passagers);
    // 7. Le grand rotor à 4 pales, et le rotor de queue (sur le côté droit, il tourne dans le plan de la dérive).
    g.add(rotor("rotor0", 0.35, 3.7, 4, 8.18, 0.53, Math.PI / 4));
    const queue = new THREE.Group();
    queue.name = "rotorQueue";
    queue.position.set(-10.45, 3.75, 0.32);
    queue.add(O.couche(O.cylindre(0.12, 0.12, 0.16, m.teinte, 8, CT.noir), "z", 0, 0, 0));
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2, pale = O.boite(0.24, 1.6, 0.03, m.teinte, -Math.sin(a) * 0.85, Math.cos(a) * 0.85, 0, COUL.pale);
      pale.rotation.z = a;
      queue.add(pale);
    }
    O.souder(queue);
    g.add(queue);
    cordesEtFlammes(g, "blackhawk");
    return g;
  }

  // ------------------------------------------------------------------ les modèles (une fois), et leurs copies
  const modeles = {}, FABRIQUES = { chinook, blackhawk };
  function fabriquer(sorte, equipe) {
    const cle = sorte + ":" + equipe;
    if (!modeles[cle]) modeles[cle] = FABRIQUES[sorte](equipe);
    const g = modeles[cle].clone(true); // (une copie : les formes et les matières sont partagées)
    const nom = (n) => g.getObjectByName(n) || null;
    return {
      g, sorte, helicoTransport: true,
      rotors: [nom("rotor0"), nom("rotor1")].filter(Boolean), rotorQueue: nom("rotorQueue"), rampe: nom("rampe"), passagers: nom("passagers"),
      cordes: [nom("corde0"), nom("corde1")], flammes: [nom("flamme0"), nom("flamme1")], angleRampe: -0.9,
    };
  }

  // ------------------------------------------------------------------ la version SIMPLE, pour de loin (des instances)
  function formeSimple(sorte, equipe) {
    const E = Tanks.CONFIG.equipes[equipe], mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
    const g = new THREE.Group(), P = PEINTURE[equipe];
    const b = (lx, ly, lz, x, y, z, c, ry) => {
      const p = O.boite(lx, ly, lz, mat, x, y, z, c);
      if (ry) p.rotation.y = ry;
      g.add(p);
    };
    if (sorte === "chinook") {
      b(13.6, 2.5, 2.56, 0.9, 2.35, 0, P);
      b(1.6, 1.6, 2.0, 7.0, 2.0, 0, P);
      b(4.8, 1.8, 1.5, -5.4, 4.3, 0, P);
      b(2.2, 1.0, 2.3, -6.7, 3.2, 0, P);
      b(3.4, 0.8, 1.3, 5.3, 3.8, 0, P);
      b(6.8, 0.8, 0.9, -0.3, 1.5, 0, new THREE.Color(P).multiplyScalar(0.8));
      for (const [x, y] of [[5.9, 4.6], [-6.1, 5.6]]) for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) b(18.3, 0.06, 0.7, x, y, 0, COUL.pale, a);
      b(1.2, 0.4, 0.04, -0.3, 3.0, 1.3, E.marque);
      b(1.2, 0.4, 0.04, -0.3, 3.0, -1.3, E.marque);
    } else {
      b(5.4, 1.9, 2.3, 0.6, 1.75, 0, P);
      b(1.6, 1.2, 1.7, 3.6, 1.5, 0, P);
      b(7.4, 0.6, 0.6, -5.8, 2.2, 0, P);
      b(0.8, 2.0, 0.24, -10.0, 3.3, 0, P);
      b(0.8, 0.07, 4.3, -9.75, 2.1, 0, P);
      b(3.6, 0.6, 1.5, -0.5, 2.9, 0, new THREE.Color(P).multiplyScalar(0.8));
      b(1.8, 1.4, 0.05, -0.65, 1.6, 1.17, COUL.interieur);
      b(1.8, 1.4, 0.05, -0.65, 1.6, -1.17, COUL.interieur);
      for (const a of [Math.PI / 4, -Math.PI / 4]) b(16.4, 0.06, 0.55, 0.35, 3.7, 0, COUL.pale, a);
      b(1.4, 0.3, 0.04, -5.6, 2.15, 0.31, E.marque);
      b(1.4, 0.3, 0.04, -5.6, 2.15, -0.31, E.marque);
    }
    const [piece] = O.souder(g, false);
    return piece.geometry;
  }
  function lotSimple(sorte, equipe, max) {
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.25 });
    const lot = new THREE.InstancedMesh(formeSimple(sorte, equipe), mat, max);
    lot.count = 0;
    lot.frustumCulled = false;
    lot.castShadow = false;
    lot.receiveShadow = true;
    lot.setColorAt(0, new THREE.Color(1, 1, 1));
    return lot;
  }

  return { sait, fabriquer, lotSimple, SORTES };
})();
