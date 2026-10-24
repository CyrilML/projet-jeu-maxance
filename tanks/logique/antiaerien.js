// 🚚 LE CAMION ANTIAÉRIEN : un chauffeur et un tireur (demande 113)
//
// ✍️ Maxance : « Le canon antiaérien, il est mauvais. Je ne connais pas ça. Je veux que tu fasses un camion. Toi, tu
// pilotes le camion, et quelqu'un d'autre tire avec le canon antiaérien. »
// C'est comme une équipe de deux dans une voiture de rallye : le CHAUFFEUR regarde la route, le TIREUR regarde le ciel.
//   - LE CHAUFFEUR (toi, touche E) conduit le camion comme le camion de transport (la même mécanique de roues :
//     logique/vehicules.js, « rouler ») ;
//   - LE TIREUR (l'ordinateur) est assis au canon double sur le plateau. 4 fois par seconde, il regarde le ciel et choisit
//     l'avion ou l'hélico ennemi le plus proche. Il ne vise pas l'avion, mais DEVANT l'avion : là où il sera quand l'obus
//     arrivera (temps de vol = distance ÷ vitesse de l'obus ; on recommence le calcul 2 fois, car le point visé change la
//     distance). Le canon tourne moins vite qu'on voudrait (il est lourd) ; quand il est pile sur le point, il tire des
//     RAFALES, puis fait une petite pause. Il parle à la radio : « Avion ennemi à 2 heures, j'engage ! » (2 heures : comme
//     sur une horloge posée sur le camion, 12 heures = droit devant), « Touché ! », « Abattu ! » ;
//   - F : CHANGER DE SIÈGE. Tu prends le canon (à la main, comme l'ancienne DCA : ← → tourner, ↑ ↓ lever, Espace tirer,
//     avec la visée assistée) ; le camion freine et s'arrête. F encore : tu reprends le volant ;
//   - le tireur est à découvert : les BALLES peuvent le toucher. Tombé, le canon se tait ; ramène le camion à ta base :
//     un nouveau tireur monte. Un obus ou une roquette abîme le camion (« vie ») ; détruit, un neuf revient plus tard ;
//   - L'ENNEMI a le même camion, conduit par l'ordinateur : il patrouille près de sa base (sa route : « patrouille »),
//     s'arrête quand son tireur a une cible, et tire sur TES avions et hélicos (le Rafale, le Tigre, le drone, le Chinook,
//     le Black Hawk).
// Ce fichier ne dessine rien : il renvoie des événements (« aa-engage », « aa-touche », « aa-abattu »…).

window.Tanks = window.Tanks || {};

Tanks.AntiAerien = (function () {
  const C = Tanks.CONFIG, R = C.engins.dca, TI = R.tireur, T = Tanks.Terrain, F = C.projectiles.flak;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  const FREIN = { freiner: true };
  const listeCiel = [];
  let etat = 113;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // Un tireur tout neuf (et ce qu'il retient : pour « sous le capot »).
  const nouveauTireur = () => ({ vivant: true, vie: TI.vie, etat: "guette le ciel", cible: null, distance: 0, avanceAngle: 0, ecart: 0, heures: 12, pense: hasard() * TI.pense, rafale: 0, pause: 0, remplace: 0, parole: -99 });

  // Garer le camion (neuf) à sa place : le parking de la base aérienne de son camp (logique/base.js).
  function garer(e, equipe) {
    equipe = equipe || e.equipe || "bleus";
    const p = Tanks.Base.place(equipe, "dca");
    Object.assign(e, {
      genre: "antiaerien", equipe, nom: equipe === "bleus" ? R.nom : R.nom + " ennemi", x: p.x, z: p.z, y: T.hauteur(p.x, p.z), angle: p.angle,
      vitesse: 0, vy: 0, braquage: 0, rotation: 0, roulis: 0, tangage: 0, vie: R.vie, detruit: false, touche: 9, recharge: 0, feu: 0,
      tourelle: 0, hausse: 0.5, canon: 0, cible: null, avance: null, siege: "volant", retour: 0, enVol: false, pilote: false, ia: null,
      tireur: nouveauTireur(), tirs: (e.tirs || 0), reussis: (e.reussis || 0), touches: (e.touches || 0), abattus: (e.abattus || 0),
    });
    if (equipe !== "bleus") {
      // l'ordinateur au volant : les pensées que demande « Tanks.Vehicules.decider » (il suit une route)
      e.ia = { etat: "part en patrouille", pense: 0, cible: null, bloque: 0, recule: 0, detour: 0, coteDetour: 1, couloir: 0, tour: 1, erreur: 0, retour: 0, route: null };
      e.pilote = false;
    }
    return e;
  }
  // Le camion antiaérien de l'ENNEMI (un par bataille, dans monde.engins avec les tiens).
  function ennemi() {
    return garer({ sorte: "dca", fiche: Object.assign({}, R) }, "rouges");
  }

  // ------------------------------------------------------------------ le ciel : qui peut-on viser ?
  // Les avions et les hélicos qui volent (logique/avions.js : « enLAir »), et (demande 113) ton Tigre et ton drone en vol.
  function ciel(monde) {
    const l = listeCiel;
    l.length = 0;
    for (const a of Tanks.Avions.enLAir(monde)) l.push(a);
    for (const e of monde.engins) if ((e.sorte === "helico" || e.sorte === "drone") && e.pilote && e.enVol && !e.detruit && e.y - T.hauteur(e.x, e.z) > TI.hauteurMin) l.push(e);
    return l;
  }
  // Sa vitesse (m/s), en x, y, z : les avions la donnent (vx, vy, vz) ; pour les autres, on la calcule.
  function vitesseDe(o) {
    if (o.vx !== undefined && o.genre === "avion" && o.sorte !== "avion") return { x: o.vx, y: o.vy || 0, z: o.vz };
    const t = o.tangage && o.sorte === "avion" ? o.tangage : 0, v = o.vitesse || 0;
    return { x: Math.cos(o.angle) * Math.cos(t) * v, y: o.sorte === "avion" ? Math.sin(t) * v : o.vy || 0, z: Math.sin(o.angle) * Math.cos(t) * v };
  }
  // Ce qu'on dit à la radio : « Avion ennemi », « Hélico ennemi »…
  function quoi(o) {
    const camp = o.equipe === "bleus" ? "" : " ennemi";
    if (o.sorte === "transport") return "Avion de transport" + camp;
    if (o.genre === "avion" || o.sorte === "avion") return "Avion" + camp;
    if (o.sorte === "drone") return "Drone" + camp;
    return "Hélico" + camp;
  }
  // L'heure sur l'horloge du camion : 12 h devant, 3 h à droite, 6 h derrière, 9 h à gauche.
  function heures(e, o) {
    const rel = angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - e.angle); // (positif = à droite : l'angle monte quand on tourne à droite)
    const h = ((Math.round(rel / (Math.PI / 6)) % 12) + 12) % 12;
    return h === 0 ? 12 : h;
  }
  // La bouche des canons (sur le plateau, un peu derrière le milieu du camion).
  function bouche(e) {
    return { x: e.x + Math.cos(e.angle) * R.canon.x, y: e.y + R.canon.y, z: e.z + Math.sin(e.angle) * R.canon.x };
  }
  // Viser DEVANT : là où sera la cible quand l'obus arrivera (2 essais suffisent), un peu plus haut (l'obus retombe).
  function pointAvance(o, depart) {
    const v = vitesseDe(o);
    let t = Math.hypot(o.x - depart.x, o.y - depart.y, o.z - depart.z) / F.vitesse, p = null;
    for (let k = 0; k < 2; k++) {
      p = { x: o.x + v.x * t, y: o.y + v.y * t + 0.5 * F.gravite * t * t, z: o.z + v.z * t };
      t = Math.hypot(p.x - depart.x, p.y - depart.y, p.z - depart.z) / F.vitesse;
    }
    return p;
  }

  // ------------------------------------------------------------------ un pas
  // I : tes touches (si tu es dedans), sinon {}. Renvoie rien : les événements vont dans « ev ».
  function avancer(e, I, dt, monde, ev) {
    const ti = e.tireur;
    e.touche += dt;
    e.horloge = (e.horloge || 0) + dt;
    e.feu = Math.max(0, e.feu - dt);
    if (e.detruit) {
      e.vitesse *= Math.max(0, 1 - dt * 3);
      e.cible = ti.cible = null;
      e.retour += dt;
      if (e.retour >= R.retour && !e.pilote) {
        garer(e, e.equipe);
        ev.push(["aa-retour", { nom: e.nom, equipe: e.equipe }]);
      }
      return;
    }
    // F : changer de siège (le volant ↔ le canon)
    if (!e.pilote) e.siege = "volant";
    else if (I.decharger) {
      e.siege = e.siege === "volant" ? "canon" : "volant";
      ev.push(["aa-siege", { nom: e.nom, siege: e.siege, tireur: ti.vivant }]);
    }
    // 1. le camion roule : toi au volant, l'ordinateur (l'ennemi), ou personne (il freine)
    const conduite = e.pilote ? (e.siege === "volant" ? I : FREIN) : e.ia ? decider(e, monde, dt, ev) : FREIN;
    if (e.pilote || e.ia || Math.abs(e.vitesse) > 0.01) Tanks.Vehicules.rouler(e, conduite, dt, monde, ev);
    // 2. le canon : toi (à la main), le tireur (tout seul), ou personne
    if (e.pilote && e.siege === "canon") viserALaMain(e, I, dt, monde, ev);
    else if (ti.vivant && (e.pilote || e.ia)) tireurAuto(e, dt, monde, ev);
    else {
      e.cible = ti.cible = e.avance = null;
      ti.etat = ti.vivant ? "attend son chauffeur" : "personne au canon";
    }
    // 3. pas de tireur ? arrêté près de sa base, un nouveau monte au bout de « remplace » s
    if (!ti.vivant) {
      const p = Tanks.Base.place(e.equipe, "dca"), pres = Math.hypot(e.x - p.x, e.z - p.z) < C.vehicules.rechargerA && Math.abs(e.vitesse) < 1;
      ti.remplace = pres ? ti.remplace + dt : 0;
      if (ti.remplace >= TI.remplace) {
        const n = e.tireur = nouveauTireur();
        ev.push(["aa-nouveau-tireur", { nom: e.nom, equipe: e.equipe, tireur: e, toi: !!e.pilote }]);
        if (e.ia) e.ia.route = null; // (l'ennemi repart en patrouille)
        n.etat = "monte au canon";
      }
    }
  }

  // L'ordinateur au volant (l'ennemi) : sa patrouille, l'arrêt pour tirer, le retour à sa base sans tireur.
  function decider(e, monde, dt, ev) {
    const ia = e.ia, ti = e.tireur, sens = e.equipe === "bleus" ? 1 : -1;
    if (!ti.vivant) {
      if (!ia.versBase) {
        const p = Tanks.Base.place(e.equipe, "dca");
        ia.route = [[p.x, p.z]];
        ia.versBase = true;
      }
    } else {
      ia.versBase = false;
      if (!ia.route || !ia.route.length) {
        // (une nouvelle boucle de patrouille, en partant d'un point au hasard)
        const k0 = Math.floor(hasard() * R.patrouille.length);
        ia.route = R.patrouille.map((_, k) => R.patrouille[(k0 + k) % R.patrouille.length]).map(([x, z]) => [x, sens * z]);
      }
    }
    ia.pause = ti.vivant && !!ti.cible && ti.distance < TI.portee; // (il s'arrête pour tirer : on vise mieux à l'arrêt)
    const I = Tanks.Vehicules.decider(e, monde, dt, ev);
    if (ia.pause) ia.etat = "arrêté : son tireur tire sur " + ti.cible.nom;
    else if (!ti.vivant) ia.etat = "rentre à sa base chercher un tireur";
    else ia.etat = "patrouille (" + ia.route.length + " points)";
    return I;
  }

  // LE TIREUR (l'ordinateur) : chercher, tourner le canon, viser devant, tirer des rafales.
  function tireurAuto(e, dt, monde, ev) {
    const ti = e.tireur, depart = bouche(e);
    ti.pense -= dt;
    if (ti.pense <= 0) {
      // (on ne regarde le ciel que 4 fois par seconde : ça coûte moins cher que 120 fois)
      ti.pense = TI.pense;
      let meilleur = null, dm = TI.portee;
      for (const o of ciel(monde)) {
        if (o.equipe === e.equipe) continue;
        const d = Math.hypot(o.x - depart.x, o.y - depart.y, o.z - depart.z);
        if (d < dm) (dm = d), (meilleur = o);
      }
      if (meilleur && meilleur !== ti.cible && meilleur !== ti.annonce) (ti.annonce = meilleur), ev.push(["aa-engage", { tireur: e, cible: meilleur, quoi: quoi(meilleur), heures: heures(e, meilleur), distance: Math.round(dm), equipe: e.equipe, toi: !!e.pilote }]);
      ti.cible = meilleur;
    }
    const c = ti.cible && !ti.cible.detruit ? ti.cible : null;
    if (!c) {
      ti.cible = e.cible = e.avance = null;
      ti.etat = "guette le ciel";
      ti.rafale = 0;
      e.hausse += (0.5 - e.hausse) * Math.min(1, dt * 0.5); // (il remet doucement le canon à mi-hauteur)
      return;
    }
    const p = pointAvance(c, depart), dx = p.x - depart.x, dy = p.y - depart.y, dz = p.z - depart.z, horiz = Math.hypot(dx, dz);
    const voulu = Math.atan2(dz, dx), haut = borne(Math.atan2(dy, horiz), R.hausse[0], R.hausse[1]);
    // le canon tourne et se lève, mais pas plus vite que « rotation » et « levee » (rad/s)
    const da = angleEntre(voulu - (e.angle + e.tourelle)), dh = haut - e.hausse;
    e.tourelle = angleEntre(e.tourelle + borne(da, -TI.rotation * dt, TI.rotation * dt));
    e.hausse = borne(e.hausse + borne(dh, -TI.levee * dt, TI.levee * dt), R.hausse[0], R.hausse[1]);
    // ce que « sous le capot » montre : la distance, l'angle d'avance (entre l'avion et le point visé), l'écart du canon
    const lc = Math.hypot(c.x - depart.x, c.y - depart.y, c.z - depart.z), lp = Math.hypot(dx, dy, dz);
    ti.distance = Math.round(lc);
    ti.avanceAngle = Math.acos(borne(((c.x - depart.x) * dx + (c.y - depart.y) * dy + (c.z - depart.z) * dz) / (lc * lp || 1), -1, 1));
    ti.ecart = Math.hypot(angleEntre(voulu - (e.angle + e.tourelle)) * Math.cos(e.hausse), haut - e.hausse);
    ti.heures = heures(e, c);
    e.cible = c;
    e.avance = p;
    ti.pause = Math.max(0, ti.pause - dt);
    const pret = ti.ecart < TI.vise && lc < TI.portee;
    ti.etat = !pret ? "tourne le canon vers " + c.nom : ti.pause > 0 ? "pause entre deux rafales" : "TIRE sur " + c.nom;
    if (pret && ti.pause === 0 && e.feu === 0) {
      tirer(e, monde, ev, TI.erreur[e.equipe] || TI.erreur.rouges, true);
      if (++ti.rafale >= TI.rafale) (ti.rafale = 0), (ti.pause = TI.pause);
    }
  }

  // TOI au canon (F) : comme l'ancienne DCA. ← → tourner, ↑ ↓ lever, Espace tirer ; la VISÉE ASSISTÉE : si un avion
  // ennemi est à moins de 10° de là où pointent les canons, les obus partent vers le point DEVANT lui.
  function viserALaMain(e, I, dt, monde, ev) {
    const ti = e.tireur;
    e.tourelle = angleEntre(e.tourelle + ((I.droite ? 1 : 0) - (I.gauche ? 1 : 0)) * R.rotation * dt);
    e.hausse = borne(e.hausse + ((I.avancer ? 1 : 0) - (I.reculer ? 1 : 0)) * R.levee * dt, R.hausse[0], R.hausse[1]);
    const a = e.angle + e.tourelle, h = e.hausse, depart = bouche(e);
    const vise = { x: Math.cos(a) * Math.cos(h), y: Math.sin(h), z: Math.sin(a) * Math.cos(h) };
    let meilleur = null;
    for (const o of ciel(monde)) {
      if (o.equipe === e.equipe) continue;
      const d = { x: o.x - depart.x, y: o.y - depart.y, z: o.z - depart.z }, l = Math.hypot(d.x, d.y, d.z);
      const ecart = Math.acos(borne((d.x * vise.x + d.y * vise.y + d.z * vise.z) / l, -1, 1));
      if (l < 2200 && ecart < 0.18 && (!meilleur || ecart < meilleur.ecart)) meilleur = { o, ecart };
    }
    e.cible = meilleur ? meilleur.o : null;
    e.avance = e.cible ? pointAvance(e.cible, depart) : null;
    ti.cible = null;
    ti.etat = ti.vivant ? "au volant (c'est toi qui tires)" : "personne (c'est toi qui tires)";
    if (I.tirer && e.feu === 0) tirer(e, monde, ev, 0.006, false);
  }

  // Un obus de flak part (les 2 canons tirent chacun leur tour). auto : c'est le tireur de l'ordinateur.
  function tirer(e, monde, ev, erreur, auto) {
    e.feu = R.cadence;
    e.canon = 1 - e.canon;
    e.tirs++;
    const depart = bouche(e), a = e.angle + e.tourelle;
    let dir = { x: Math.cos(a) * Math.cos(e.hausse), y: Math.sin(e.hausse), z: Math.sin(a) * Math.cos(e.hausse) };
    if (e.avance && !auto) { // (la visée assistée, à la main)
      const l = Math.hypot(e.avance.x - depart.x, e.avance.y - depart.y, e.avance.z - depart.z);
      dir = { x: (e.avance.x - depart.x) / l, y: (e.avance.y - depart.y) / l, z: (e.avance.z - depart.z) / l };
    }
    const g = a + Math.PI / 2, ecartCanon = e.canon ? 0.32 : -0.32, alea = () => (Math.random() - 0.5) * 2 * erreur;
    const d2 = { x: dir.x + alea(), y: dir.y + alea(), z: dir.z + alea() };
    Tanks.Obus.lancer(monde.obus, e, "flak", { x: depart.x + Math.cos(g) * ecartCanon + d2.x * 2.5, y: depart.y + d2.y * 2.5, z: depart.z + Math.sin(g) * ecartCanon + d2.z * 2.5 }, d2, null);
    ev.push(["flak", { tireur: e, x: depart.x, y: depart.y, z: depart.z, assiste: !!e.avance, auto }]);
  }

  // (appelé par logique/obus.js) Un obus de flak de ce camion éclate près d'un avion : touché ! (et abattu ?)
  function touche(e, cible, ev) {
    if (e.genre !== "antiaerien") return;
    e.touches++;
    const ti = e.tireur, tps = e.horloge || 0, parToi = !!e.pilote && e.siege === "canon";
    if (cible.detruit) {
      e.abattus++;
      ev.push(["aa-abattu", { tireur: e, cible, quoi: quoi(cible), equipe: e.equipe, toi: !!e.pilote, parToi, touches: e.touches, abattus: e.abattus }]);
    } else if (tps - ti.parole > TI.parole) {
      ti.parole = tps;
      ev.push(["aa-touche", { tireur: e, cible, quoi: quoi(cible), vie: cible.vie, equipe: e.equipe, toi: !!e.pilote, parToi, touches: e.touches }]);
    }
  }

  // Le tireur est-il à découvert (les balles peuvent-elles le toucher) ? Vivant, au canon, et le camion en service.
  const tireurExpose = (e) => !e.detruit && e.tireur.vivant && (e.pilote || !!e.ia) && !(e.pilote && e.siege === "canon");
  // (appelé par logique/vehicules.js « blesserPilote ») une balle touche le tireur
  function blesserTireur(e, degats, tireur, ev) {
    const ti = e.tireur;
    if (!ti.vivant) return;
    ti.vie = Math.max(0, ti.vie - degats);
    e.touche = 0;
    ev.push(["aa-tireur-touche", { nom: e.nom, equipe: e.equipe, tireur, cible: e, vie: ti.vie, vieMax: TI.vie, toi: !!e.pilote }]);
    if (ti.vie <= 0) {
      ti.vivant = false;
      ti.cible = e.cible = e.avance = null;
      ti.etat = "à terre";
      ev.push(["aa-tireur-abattu", { nom: e.nom, equipe: e.equipe, tireur, cible: e, toi: !!e.pilote }]);
    }
  }

  return { garer, ennemi, avancer, ciel, touche, tireurExpose, blesserTireur, heures, quoi, pointAvance, vitesseDe, bouche };
})();
