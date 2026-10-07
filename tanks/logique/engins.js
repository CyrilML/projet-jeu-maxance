// 🚁 LES ENGINS : le garage et l'aérodrome de ton camp (étape 61)
//
// ✍️ Garés derrière ton camp, et seulement pour toi (touche E pour monter et descendre) :
//   - le 4x4 À MITRAILLEUSE : il roule vite (94 km/h) ; sa mitrailleuse est sur une tourelle (Q / D) ; Espace : tirer.
//     Les obus et les roquettes peuvent le détruire (2 coups) ;
//   - l'HÉLICOPTÈRE TIGRE : ↑ ↓ avancer / reculer, ← → tourner, Q monter, D descendre ; Espace lâche une BOMBE (8, puis
//     une nouvelle toutes les 5 s). La bombe garde la vitesse de l'hélico en tombant : il faut la lâcher AVANT d'être
//     au-dessus de la cible !
//   - l'AVION DE CHASSE RAFALE : il vole toujours vite (340 km/h) ; ↑ piquer, ↓ cabrer (comme un vrai manche), ← → virer ;
//     Espace tire un MISSILE guidé vers l'ennemi le plus en face. Il ne peut pas se poser : E = s'ÉJECTER, et tu
//     redescends en parachute (l'avion revient à l'aérodrome) ;
//   - le DRONE : petit et rapide, piloté comme l'hélico ; il lâche des GRENADES (contre les soldats).
//   - (étape 62) la VEDETTE DE COMBAT, amarrée au bord du lac (logique/bateaux.js) : un petit canon sur tourelle ;
//   - (étape 64) la DCA : un canon anti-aérien double. ← → tourner, ↑ ↓ lever / baisser, Espace tirer. Sa VISÉE ASSISTÉE
//     calcule où sera l'avion quand l'obus arrivera (on vise DEVANT l'avion, comme un chasseur de canards) ;
//   - (étape 63) le SOUS-MARIN, amarré à côté (logique/sousmarins.js) : D plonger, Q remonter, Espace une torpille.
// Les engins volants ne peuvent pas être touchés (les tanks ne tirent pas en l'air).
// Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Engins = (function () {
  const C = Tanks.CONFIG, G = C.engins, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const yCamp = () => T.demi - 30;

  // Les places de parking (derrière les Bleus) : le 4x4, puis l'aérodrome (l'hélico, l'avion, le drone).
  const PLACES = { jeep: [40, -12], helico: [-60, 0], avion: [-120, 0], drone: [-30, 4], dca: [80, -50] }; // (la DCA, un peu devant, sur du plat)
  function creer() {
    const liste = Object.keys(PLACES).map((sorte) => garer({ sorte, fiche: Object.assign({ longueur: 4.8, largeur: 2.2, hauteur: 2 }, G[sorte]) }));
    liste.push(garer({ sorte: "bateau", fiche: Object.assign({}, C.bateaux.joueur) })); // (étape 62)
    liste.push(garer({ sorte: "sousmarin", fiche: Object.assign({}, C.sousMarins.joueur) })); // (étape 63)
    return liste;
  }
  // (étape 62) La place de la vedette : au bord du lac, au sud-ouest (de ton côté), le nez vers le milieu du lac.
  const QUAI = { t: 1.85, dl: 0.95 };
  const QUAI_SOUSMARIN = { t: 2.02, dl: 0.92 };
  function garer(e) {
    if (e.sorte === "sousmarin") {
      const p = Tanks.Bateaux.surLeLac(QUAI_SOUSMARIN.t, QUAI_SOUSMARIN.dl), R = C.sousMarins.joueur;
      Object.assign(e, {
        equipe: "bleus", genre: "sousmarin", nom: R.nom, x: p.x, z: p.z, angle: Math.atan2(C.lac.z - p.z, C.lac.x - p.x),
        vitesse: 0, profondeur: 0, vie: R.vie, detruit: false, touche: 9, recharge: 0, pilote: false, cible: null, tirs: 0, reussis: 0,
      });
      e.y = Tanks.SousMarins.hauteurDe(e);
      return e;
    }
    if (e.sorte === "bateau") {
      const p = Tanks.Bateaux.surLeLac(QUAI.t, QUAI.dl), R = C.bateaux.joueur;
      return Object.assign(e, {
        equipe: "bleus", genre: "bateau", nom: R.nom, x: p.x, z: p.z, y: C.lac.niveau, angle: Math.atan2(C.lac.z - p.z, C.lac.x - p.x),
        vitesse: 0, tourelle: 0, vie: R.vie, detruit: false, touche: 9, recharge: 0, pilote: false, cible: null, tirs: 0, reussis: 0,
      });
    }
    const [x, dz] = PLACES[e.sorte];
    Object.assign(e, {
      equipe: "bleus", nom: G[e.sorte].nom, x, z: yCamp() + dz, y: T.hauteur(x, yCamp() + dz), angle: -Math.PI / 2,
      vitesse: 0, vy: 0, tangage: 0, roulis: 0, tourelle: 0, vie: G[e.sorte].vie || 1, detruit: false, touche: 9,
      munitions: G[e.sorte].munitions || 0, recharge: 0, rechargeMunition: 0, pilote: false, rotor: 0, enVol: false,
    });
    if (e.sorte === "dca") Object.assign(e, { tourelle: 0, hausse: 0.5, canon: 0, cible: null, angle: -Math.PI / 2 });
    return e;
  }

  // Un pas de temps. intentions : celles du joueur (si c'est lui qui conduit), sinon {}.
  // tous = { chars, soldats } pour viser. Renvoie des événements.
  function avancer(e, intentions, dt, monde) {
    const ev = [], R = G[e.sorte];
    e.touche += dt;
    if (e.detruit) {
      if (e.sorte === "bateau") Tanks.Bateaux.couler(e, dt);
      else if (e.sorte === "sousmarin") {
        e.vitesse *= 1 - dt;
        e.profondeur += 0.4 * dt;
        e.y = Tanks.SousMarins.hauteurDe(e);
      } else e.vitesse = 0;
      return ev;
    }
    if (e.sorte === "sousmarin") {
      plonger(e, intentions, dt, C.sousMarins.joueur, monde, ev);
      return ev;
    }
    if (e.sorte === "bateau") {
      naviguer(e, intentions, dt, C.bateaux.joueur, monde, ev);
      return ev;
    }
    e.recharge = Math.max(0, e.recharge - dt);
    if (R.munitions && e.munitions < R.munitions) {
      e.rechargeMunition += dt;
      if (e.rechargeMunition >= R.recharge) {
        e.rechargeMunition = 0;
        e.munitions++;
      }
    }
    if (e.sorte === "dca") viserLeCiel(e, intentions, dt, R, monde, ev);
    else if (e.sorte === "jeep") rouler(e, intentions, dt, R, monde, ev);
    else if (e.sorte === "avion") voler(e, intentions, dt, R, monde, ev);
    else planer(e, intentions, dt, R, monde, ev);
    return ev;
  }

  // Le 4x4 : comme une voiture (il tourne seulement en roulant), avec une mitrailleuse sur tourelle.
  function rouler(e, I, dt, R, monde, ev) {
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(-8, e.vitesse - (e.vitesse > 0 ? 14 : R.acceleration) * dt);
    else e.vitesse -= Math.sign(e.vitesse) * Math.min(Math.abs(e.vitesse), 3 * dt);
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * Math.min(1, Math.abs(e.vitesse) / 6) * Math.sign(e.vitesse || 1) * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    if (T.repousser(e, 2)) e.vitesse *= 0.6;
    for (const a of T.arbres) {
      if (!a.ecrase && Math.hypot(a.x - e.x, a.z - e.z) < 2.4) {
        if (Math.abs(e.vitesse) > 8) (a.ecrase = true), (a.angleChute = e.angle), ev.push(["arbre-ecrase", { nom: "toi", vitesse: e.vitesse }]);
        else e.vitesse *= 0.3;
      }
    }
    e.y = T.hauteur(e.x, e.z);
    e.tourelle = angleEntre(e.tourelle + ((I.tourelleDroite ? 1 : 0) - (I.tourelleGauche ? 1 : 0)) * R.tourelle * dt);
    if (I.tirer && e.recharge === 0 && e.pilote) {
      e.recharge = C.armes.mitrailleuse.cadence;
      const a = e.angle + e.tourelle;
      Tanks.Soldat.balle(e, e.x + Math.cos(a) * 1.2, e.y + 2.6, e.z + Math.sin(a) * 1.2, a, "mitrailleuse", monde.soldats, monde.chars, ev);
    }
  }

  // (étape 62) La vedette : elle accélère doucement, et ne tourne bien que si elle avance (le gouvernail).
  function naviguer(e, I, dt, R, monde, ev) {
    e.recharge = Math.max(0, e.recharge - dt);
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(-4, e.vitesse - R.acceleration * dt);
    else e.vitesse -= Math.sign(e.vitesse) * Math.min(Math.abs(e.vitesse), 1.5 * dt); // (l'eau freine)
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * (0.25 + 0.75 * Math.min(1, Math.abs(e.vitesse) / 6)) * Math.sign(e.vitesse || 1) * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    if (Tanks.Bateaux.resterSurLEau(e) && Math.abs(e.vitesse) > 2 && !e.echoue) ev.push(["echoue", { nom: e.nom }]);
    e.echoue = T.distLac(e.x, e.z) > 0.955;
    e.y = C.lac.niveau;
    e.tourelle = angleEntre(e.tourelle + ((I.tourelleDroite ? 1 : 0) - (I.tourelleGauche ? 1 : 0)) * R.tourelle * dt);
    // la visée assistée, comme pour le tank : l'ennemi le plus proche dans le cône de 4° devant le canon
    const a = e.angle + e.tourelle;
    let meilleur = null;
    for (const o of monde.chars.concat(monde.bateaux, monde.sousMarins.filter((m) => !Tanks.SousMarins.sousLEau(m)))) {
      if (o.equipe === e.equipe || o.detruit) continue;
      const d = Math.hypot(o.x - e.x, o.z - e.z), ecart = Math.abs(angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - a));
      if (d < C.obus.porteeAssistee && ecart < C.obus.viseeAssistee && (!meilleur || ecart < meilleur.ecart)) meilleur = { o, ecart };
    }
    e.cible = meilleur ? meilleur.o : null;
    if (I.tirer && e.recharge === 0 && e.pilote) {
      e.recharge = R.recharge;
      e.tirs++;
      Tanks.Bateaux.tirer(e, monde, e.cible, 0, ev, true);
    }
  }

  // (étape 64) La DCA : elle ne bouge pas ; on tourne les canons (← →) et on les lève (↑ ↓).
  // La visée assistée : si un avion ennemi est à moins de 10° de là où pointent les canons, on calcule où il sera quand
  // l'obus arrivera (temps = distance ÷ vitesse de l'obus), et on vise là (un peu plus haut, car l'obus retombe).
  function viserLeCiel(e, I, dt, R, monde, ev) {
    e.recharge = Math.max(0, e.recharge - dt);
    e.tourelle = angleEntre(e.tourelle + ((I.droite ? 1 : 0) - (I.gauche ? 1 : 0)) * R.rotation * dt);
    e.hausse = Math.max(0.05, Math.min(1.4, e.hausse + ((I.avancer ? 1 : 0) - (I.reculer ? 1 : 0)) * R.levee * dt));
    const a = e.angle + e.tourelle, h = e.hausse, F = C.projectiles.flak;
    const vise = { x: Math.cos(a) * Math.cos(h), y: Math.sin(h), z: Math.sin(a) * Math.cos(h) };
    const depart = { x: e.x, y: e.y + 2.2, z: e.z };
    let meilleur = null;
    for (const av of Tanks.Avions.enLAir(monde)) {
      if (av.equipe === e.equipe) continue;
      const d = { x: av.x - depart.x, y: av.y - depart.y, z: av.z - depart.z }, l = Math.hypot(d.x, d.y, d.z);
      const ecart = Math.acos(Math.max(-1, Math.min(1, (d.x * vise.x + d.y * vise.y + d.z * vise.z) / l)));
      if (l < 2200 && ecart < 0.18 && (!meilleur || ecart < meilleur.ecart)) meilleur = { av, ecart };
    }
    e.cible = meilleur ? meilleur.av : null;
    let dir = vise;
    if (e.cible) {
      // on vise DEVANT l'avion : là où il sera dans t secondes (2 essais suffisent pour bien tomber)
      let t = Math.hypot(e.cible.x - depart.x, e.cible.y - depart.y, e.cible.z - depart.z) / F.vitesse;
      let p;
      for (let k = 0; k < 2; k++) {
        p = { x: e.cible.x + e.cible.vx * t, y: e.cible.y + e.cible.vy * t + 0.5 * F.gravite * t * t, z: e.cible.z + e.cible.vz * t };
        t = Math.hypot(p.x - depart.x, p.y - depart.y, p.z - depart.z) / F.vitesse;
      }
      const l = Math.hypot(p.x - depart.x, p.y - depart.y, p.z - depart.z);
      dir = { x: (p.x - depart.x) / l, y: (p.y - depart.y) / l, z: (p.z - depart.z) / l };
      e.avance = p; // (pour le dessin : le petit rond « vise ici »)
    } else e.avance = null;
    if (I.tirer && e.recharge === 0 && e.pilote) {
      e.recharge = R.cadence;
      e.canon = 1 - e.canon; // (les 2 canons tirent chacun leur tour)
      const g = a + Math.PI / 2, ecartCanon = e.canon ? 0.35 : -0.35, alea = () => (Math.random() - 0.5) * 0.012;
      const d2 = { x: dir.x + alea(), y: dir.y + alea(), z: dir.z + alea() };
      Tanks.Obus.lancer(monde.obus, e, "flak", { x: depart.x + Math.cos(g) * ecartCanon + d2.x * 2.5, y: depart.y + d2.y * 2.5, z: depart.z + Math.sin(g) * ecartCanon + d2.z * 2.5 }, d2, null);
      ev.push(["flak", { tireur: e, x: depart.x, y: depart.y, z: depart.z, assiste: !!e.cible }]);
    }
  }

  // (étape 63) Le sous-marin : il navigue comme la vedette (en plus lent), D le fait plonger, Q le fait remonter.
  function plonger(e, I, dt, R, monde, ev) {
    e.recharge = Math.max(0, e.recharge - dt);
    if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
    else if (I.reculer) e.vitesse = Math.max(-3, e.vitesse - R.acceleration * dt);
    else e.vitesse -= Math.sign(e.vitesse) * Math.min(Math.abs(e.vitesse), 1 * dt);
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * (0.25 + 0.75 * Math.min(1, Math.abs(e.vitesse) / 4)) * Math.sign(e.vitesse || 1) * dt);
    const avant = e.profondeur;
    // (on garde la profondeur voulue : D la fait descendre, Q la fait remonter)
    e.voulue = Math.max(0, Math.min(R.profondeurMax, (e.voulue || 0) + ((I.tourelleDroite ? 1 : 0) - (I.tourelleGauche ? 1 : 0)) * R.plongee * dt));
    if (Tanks.SousMarins.naviguer(e, e.voulue, dt) && Math.abs(e.vitesse) > 1.5 && !e.echoue) ev.push(["echoue", { nom: e.nom }]);
    e.echoue = Math.abs(e.vitesse) < 0.5 && e.echoue;
    const S = C.sousMarins.sousLEau;
    if (avant <= S && e.profondeur > S) ev.push(["plongee", { nom: e.nom, toi: true, x: e.x, z: e.z }]);
    if (avant > S && e.profondeur <= S) ev.push(["surface", { nom: e.nom, toi: true, x: e.x, z: e.z }]);
    // la cible de la torpille : le bateau ou sous-marin ennemi le plus en face (dans un cône de 20°)
    let meilleur = null;
    for (const o of monde.bateaux.concat(monde.sousMarins)) {
      if (o.detruit) continue;
      const d = Math.hypot(o.x - e.x, o.z - e.z), ecart = Math.abs(angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - e.angle));
      if (d < 300 && ecart < 0.35 && (!meilleur || ecart < meilleur.ecart)) meilleur = { o, ecart };
    }
    e.cible = meilleur ? meilleur.o : null;
    if (I.tirer && e.recharge === 0 && e.pilote) {
      e.recharge = R.recharge;
      e.tirs++;
      Tanks.SousMarins.torpille(e, monde, e.cible, ev, true);
    }
  }

  // L'hélico et le drone : ils restent en l'air sur place, avancent, reculent, tournent, montent, descendent.
  function planer(e, I, dt, R, monde, ev) {
    const sol = T.hauteur(e.x, e.z);
    e.rotor += dt * (e.pilote || e.y > sol + 0.5 ? 40 : 4);
    const monte = (I.tourelleGauche ? 1 : 0) - (I.tourelleDroite ? 1 : 0); // Q monte, D descend
    const voulueVy = e.pilote ? monte * R.montee : -3;
    e.vy += (voulueVy - e.vy) * Math.min(1, dt * 3);
    e.y = Math.min(sol + R.hauteurMax, e.y + e.vy * dt);
    if (e.y <= sol + 0.02) {
      e.y = sol;
      e.vy = Math.max(0, e.vy);
    }
    e.enVol = e.y > sol + 1;
    const voulue = !e.enVol ? 0 : I.avancer ? R.vitesseMax : I.reculer ? -R.vitesseMax * 0.35 : 0;
    e.vitesse += Math.max(-R.acceleration * dt, Math.min(R.acceleration * dt, voulue - e.vitesse));
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.angle = angleEntre(e.angle + sens * R.virage * dt);
    e.x += Math.cos(e.angle) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * e.vitesse * dt;
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    // il penche vers l'avant quand il accélère, et sur le côté quand il tourne (pour le dessin)
    e.tangage += (-(voulue - e.vitesse) * 0.02 - e.vitesse * 0.004 - e.tangage) * Math.min(1, dt * 3);
    e.roulis += (sens * 0.25 * Math.min(1, Math.abs(e.vitesse) / 10) - e.roulis) * Math.min(1, dt * 3);
    if (I.tirer && e.recharge === 0 && e.munitions > 0 && e.enVol) {
      e.recharge = 0.6;
      e.munitions--;
      const depart = { x: e.x, y: e.y - 1, z: e.z };
      const p = Tanks.Obus.lancer(monde.obus, e, R.arme, depart, { x: 0, y: 0, z: 0 }, null, { x: Math.cos(e.angle) * e.vitesse, y: 0, z: Math.sin(e.angle) * e.vitesse });
      ev.push(["largage", { sorte: R.arme, engin: e.nom, reste: e.munitions, x: p.x, y: p.y, z: p.z }]);
    }
  }

  // L'avion : il avance toujours, il pique et il cabre, il vire.
  function voler(e, I, dt, R, monde, ev) {
    const sol = T.hauteur(e.x, e.z);
    if (!e.pilote) {
      e.vitesse = 0;
      e.y = sol;
      e.tangage = e.roulis = 0;
      e.enVol = false;
      return;
    }
    e.vitesse += (R.vitesse - e.vitesse) * Math.min(1, dt * 0.8); // (au décollage, il accélère sur la piste)
    const pique = (I.avancer ? -1 : 0) + (I.reculer ? 1 : 0);
    e.tangage = Math.max(-0.6, Math.min(0.6, e.tangage + pique * R.tangage * dt));
    if (!pique) e.tangage *= 1 - dt * 0.5; // (il revient doucement à plat)
    const sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    e.roulis += (sens * 0.9 - e.roulis) * Math.min(1, dt * 2.5);
    e.angle = angleEntre(e.angle + sens * R.virage * dt);
    e.x += Math.cos(e.angle) * Math.cos(e.tangage) * e.vitesse * dt;
    e.z += Math.sin(e.angle) * Math.cos(e.tangage) * e.vitesse * dt;
    e.y += Math.sin(e.tangage) * e.vitesse * dt;
    // le pilote automatique : jamais plus bas que 25 m au-dessus du sol (sauf au décollage), jamais plus haut que 400 m
    if (e.vitesse > R.vitesse * 0.6) e.enVol = true;
    if (e.enVol && e.y < sol + R.hauteurMin) {
      e.y += (sol + R.hauteurMin - e.y) * Math.min(1, dt * 3);
      e.tangage = Math.max(e.tangage, 0.05);
    }
    if (!e.enVol) e.y = sol;
    e.y = Math.min(sol + R.hauteurMax, e.y);
    // au bord du champ de bataille, il fait demi-tour tout seul
    const lim = T.demi + 150;
    if (Math.abs(e.x) > lim || Math.abs(e.z) > lim) e.angle = angleEntre(e.angle + Math.PI * dt * 0.8);
    if (I.tirer && e.recharge === 0 && e.munitions > 0 && e.enVol) {
      e.recharge = 0.8;
      e.munitions--;
      // la cible : un AVION ennemi devant toi (étape 64, il passe en premier), sinon le tank ennemi le plus en face
      // (dans un cône de 25°)
      let cible = null, meilleur = 0.45;
      for (const av of Tanks.Avions.enLAir(monde)) {
        if (av.equipe === e.equipe) continue;
        const ecart = Math.abs(angleEntre(Math.atan2(av.z - e.z, av.x - e.x) - e.angle));
        if (ecart < meilleur && Math.hypot(av.x - e.x, av.z - e.z) < 1200) (meilleur = ecart), (cible = av);
      }
      for (const c of cible ? [] : monde.chars) {
        if (c.detruit || c.equipe === e.equipe) continue;
        const ecart = Math.abs(angleEntre(Math.atan2(c.z - e.z, c.x - e.x) - e.angle));
        if (ecart < meilleur && Math.hypot(c.x - e.x, c.z - e.z) < 700) (meilleur = ecart), (cible = c);
      }
      const dir = { x: Math.cos(e.angle) * Math.cos(e.tangage), y: Math.sin(e.tangage), z: Math.sin(e.angle) * Math.cos(e.tangage) };
      const depart = { x: e.x + dir.x * 6, y: e.y - 1, z: e.z + dir.z * 6 };
      Tanks.Obus.lancer(monde.obus, e, "missile", depart, dir, cible);
      ev.push(["missile", { cible, reste: e.munitions, x: depart.x, y: depart.y, z: depart.z }]);
    }
  }

  return { creer, garer, avancer };
})();
