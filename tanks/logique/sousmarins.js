// 🐋 LES SOUS-MARINS : le chasseur silencieux (étape 63)
//
// Un sous-marin flotte comme un bateau, mais il peut aussi PLONGER. Sa « profondeur » dit de combien de mètres il est
// descendu sous la surface (0 = à la surface, 4,5 = tout au fond qu'il peut). Plus le lac est creux, plus il peut
// descendre (il ne touche jamais le fond).
//   - SOUS L'EAU (plus de 1,5 m), les obus et les roquettes explosent à la surface de l'eau : ils ne peuvent pas le
//     toucher. Seule une TORPILLE le peut : un petit projectile qui file sous l'eau à 26 m/s (94 km/h) et qui tourne
//     doucement vers sa cible (elle est « guidée », comme le missile, mais plus lentement).
//   - ✍️ TON SOUS-MARIN est amarré à côté de ta vedette (E pour monter). ↑ ↓ ← → naviguer, D plonger, Q remonter,
//     Espace : une torpille. Pour descendre, il faut être à la surface et près de la rive.
//   - ✍️ 2 SOUS-MARINS ENNEMIS : ils restent 20 s sous l'eau, puis 8 s à la surface (pour « respirer »). C'est le
//     moment de leur tirer dessus ! Ils écoutent avec leur SONAR (ils n'ont pas besoin de voir) et lancent des torpilles
//     sur ta vedette et ton sous-marin quand ils sont sur l'eau à moins de 220 m.
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.SousMarins = (function () {
  const C = Tanks.CONFIG, L = C.lac, S = C.sousMarins, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let etat = 63;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // La profondeur la plus grande possible ici (il garde 1 m sous la quille : il ne touche jamais le fond).
  function profondeurPossible(o) {
    const fond = L.niveau - T.hauteur(o.x, o.z); // (combien de mètres d'eau sous lui)
    return Math.max(0, Math.min(S.joueur.profondeurMax, fond - o.fiche.hauteur - 1));
  }
  // La hauteur du sous-marin (le bas de sa coque) : à la surface, on voit seulement le haut de la coque et le kiosque.
  const hauteurDe = (o) => L.niveau - 1.3 - o.profondeur;
  const sousLEau = (o) => o.profondeur > S.sousLEau;

  // Les 2 sous-marins ennemis.
  function creer() {
    const liste = [];
    for (let k = 0; k < S.ennemis.nombre; k++) {
      const p = Tanks.Bateaux.surLeLac(-Math.PI / 2 + (k ? 0.9 : -0.9), 0.45);
      const o = {
        genre: "sousmarin", sorte: "sousmarin", equipe: "rouges", nom: S.ennemis.nom + " " + (k + 1),
        fiche: Object.assign({}, S.joueur, S.ennemis), x: p.x, z: p.z, y: 0, angle: hasard() * Math.PI * 2, vitesse: 0, profondeur: 0,
        vie: S.ennemis.vie, detruit: false, touche: 9, recharge: 4 + k * 3,
        ia: { point: null, cible: null, chrono: k * 9, plonge: true, etat: "plonge" },
      };
      o.y = hauteurDe(o);
      liste.push(o);
    }
    return liste;
  }

  // Monter ou descendre vers la profondeur voulue (à 1,2 m/s), et bouger.
  function naviguer(o, voulue, dt) {
    const max = profondeurPossible(o), but = Math.max(0, Math.min(max, voulue));
    o.profondeur += Math.max(-S.joueur.plongee * dt, Math.min(S.joueur.plongee * dt, but - o.profondeur));
    o.x += Math.cos(o.angle) * o.vitesse * dt;
    o.z += Math.sin(o.angle) * o.vitesse * dt;
    const echoue = Tanks.Bateaux.resterSurLEau(o);
    o.profondeur = Math.min(o.profondeur, profondeurPossible(o)); // (là où c'est moins creux, il remonte)
    o.y = hauteurDe(o);
    return echoue;
  }

  // Une torpille : elle part de l'avant, à la profondeur du sous-marin, vers sa cible (ou tout droit).
  function torpille(o, monde, cible, ev, joueur) {
    const a = o.angle, dir = { x: Math.cos(a), y: 0, z: Math.sin(a) };
    const depart = { x: o.x + dir.x * (o.fiche.longueur / 2 + 1), y: Math.min(L.niveau - 0.8, o.y + 1.2), z: o.z + dir.z * (o.fiche.longueur / 2 + 1) };
    Tanks.Obus.lancer(monde.obus, o, "torpille", depart, dir, cible || null);
    ev.push(["torpille", { tireur: o, cible: cible || null, x: depart.x, y: depart.y, z: depart.z, joueur: !!joueur }]);
  }

  // Ce que les sous-marins ennemis entendent au sonar : ta vedette et ton sous-marin, quand tu es dedans.
  const proies = (monde) => monde.engins.filter((e) => (e.sorte === "bateau" || e.sorte === "sousmarin") && e.pilote && !e.detruit);

  function avancer(o, monde, dt) {
    const ev = [], R = o.fiche, ia = o.ia;
    o.touche += dt;
    if (o.detruit) {
      o.vitesse *= 1 - dt;
      o.profondeur = Math.min(profondeurPossible(o) + 2, o.profondeur + 0.4 * dt); // il coule
      o.y = hauteurDe(o);
      ia.etat = "coulé";
      return ev;
    }
    o.recharge = Math.max(0, o.recharge - dt);
    // 1. Plonger 20 s, remonter 8 s, et on recommence.
    ia.chrono += dt;
    if (ia.plonge && ia.chrono > R.sousLEau) {
      (ia.plonge = false), (ia.chrono = 0);
      ev.push(["surface", { nom: o.nom, x: o.x, z: o.z }]);
    } else if (!ia.plonge && ia.chrono > R.aLaSurface) {
      (ia.plonge = true), (ia.chrono = 0);
      ev.push(["plongee", { nom: o.nom, x: o.x, z: o.z }]);
    }
    // 2. Le sonar : la proie la plus proche.
    let cible = null, dmin = R.portee;
    for (const p of proies(monde)) {
      const d = Math.hypot(p.x - o.x, p.z - o.z);
      if (d < dmin) (dmin = d), (cible = p);
    }
    ia.cible = cible;
    // 3. Naviguer : vers la cible (pour la viser : la torpille part tout droit devant), sinon vers un point au hasard.
    if (!cible && (!ia.point || Math.hypot(ia.point.x - o.x, ia.point.z - o.z) < 15)) ia.point = Tanks.Bateaux.pointSurLEau();
    const but = cible || ia.point;
    const voulu = Math.atan2(but.z - o.z, but.x - o.x), diff = angleEntre(voulu - o.angle);
    o.angle = angleEntre(o.angle + Math.max(-R.virage * dt, Math.min(R.virage * dt, diff)));
    const vitesseVoulue = cible ? (dmin < 60 ? 2 : R.vitesse * 0.6) : R.vitesse;
    o.vitesse += Math.max(-2 * dt, Math.min(2 * dt, vitesseVoulue - o.vitesse));
    if (naviguer(o, ia.plonge ? 3.5 : 0, dt)) ia.point = null;
    ia.etat = (ia.plonge ? "sous l'eau" : "à la surface") + (cible ? " · vise " + cible.nom + " (" + Math.round(dmin) + " m)" : " · patrouille");
    // 4. Torpille !
    if (cible && Math.abs(diff) < 0.3 && o.recharge === 0) {
      o.recharge = R.recharge;
      torpille(o, monde, cible, ev, false);
    }
    return ev;
  }

  return { creer, avancer, naviguer, torpille, profondeurPossible, hauteurDe, sousLEau };
})();
