// ✈️ LES AVIONS : le contrôleur du ciel (étape 64)
//
// Deux sortes d'avions volent tout seuls au-dessus de la bataille :
//   - ✍️ les CHASSEURS ENNEMIS (2). Ils font « les deux » :
//       1. le BOMBARDEMENT : ils choisissent une cible au sol (un de tes tanks, ou toi), arrivent de loin à 95 m de haut
//          et lâchent 2 bombes UN PEU AVANT d'être au-dessus (la bombe garde leur vitesse : elle tombe en
//          √(2 × hauteur ÷ 9,8) secondes, et pendant ce temps elle avance) ; puis ils s'éloignent, font demi-tour, et
//          recommencent ;
//       2. le DUEL : si tu voles avec ton Rafale à moins de 900 m, ils te prennent en chasse et tirent des missiles.
//     ✍️ Abattu (par la DCA ou ton Rafale), un chasseur tombe en fumant, s'écrase, et un autre arrive 45 s plus tard ;
//   - ✍️ les AVIONS DE TRANSPORT : un par équipe, toutes les 60 s. Ils traversent la carte et lâchent 6 PARACHUTISTES
//     au-dessus de la zone de combat de leur camp. Au sol, les parachutistes deviennent des soldats comme les autres.
// Un avion vole « simplement » : il tourne d'au plus 0,55 radian par seconde, monte ou descend doucement, et penche
// ses ailes quand il tourne. Ce fichier ne dessine rien.

window.Tanks = window.Tanks || {};

Tanks.Avions = (function () {
  const C = Tanks.CONFIG, A = C.avionsEnnemis, P = C.parachutistes, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let etat = 64;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const LOIN = T.demi + 700; // (là où ils arrivent et repartent : hors de la carte)

  function chasseur(n) {
    return {
      genre: "avion", sorte: "chasseur", equipe: "rouges", nom: A.nom + " " + n, pilote: true, enVol: true,
      fiche: { vie: A.vie, longueur: 14, largeur: 10, hauteur: 4 },
      x: 0, y: 0, z: 0, angle: 0, tangage: 0, roulis: 0, vitesse: A.vitesse, vx: 0, vy: 0, vz: 0,
      vie: A.vie, detruit: false, touche: 9, etat: "attend", attente: A.premierPassage + n * 8, cible: null, bombes: 0,
      recharge: 0, chute: 0,
    };
  }
  function creer() {
    const l = [];
    for (let n = 1; n <= A.nombre; n++) l.push(chasseur(n));
    return l;
  }
  // (Re)mettre un chasseur au départ : loin au nord, chez les Rouges.
  function depart(a) {
    Object.assign(a, { x: (hasard() * 2 - 1) * 300, z: -LOIN, angle: Math.PI / 2, tangage: 0, roulis: 0, vie: A.vie, detruit: false, etat: "approche", cible: null, recharge: 0, chute: 0 });
    a.y = A.altitude + 20;
  }

  // Le pilotage : tourner vers un cap, monter ou descendre vers une altitude.
  function piloter(a, cap, altitude, dt, virage) {
    const diff = angleEntre(cap - a.angle), tourne = Math.max(-virage, Math.min(virage, diff * 2));
    a.angle = angleEntre(a.angle + tourne * dt);
    a.roulis += (tourne * 1.2 - a.roulis) * Math.min(1, dt * 3);
    // (le sol, mesuré seulement DANS la carte : dehors, le bord de la cuvette monte très, très haut)
    const dans = (v) => Math.max(-T.demi, Math.min(T.demi, v));
    const sol = T.hauteur(dans(a.x), dans(a.z)), voulue = Math.max(sol + 40, altitude);
    const montee = Math.max(-25, Math.min(25, (voulue - a.y) * 0.8));
    a.tangage = Math.atan2(montee, a.vitesse);
    a.vx = Math.cos(a.angle) * a.vitesse;
    a.vz = Math.sin(a.angle) * a.vitesse;
    a.vy = montee;
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.z += a.vz * dt;
  }

  // Un chasseur ennemi pendant un pas.
  function avancerChasseur(a, monde, dt, ev) {
    if (a.etat === "attend" || a.etat === "parti") {
      a.attente -= dt;
      if (a.attente <= 0) {
        depart(a);
        ev.push(["avion-arrive", { nom: a.nom }]);
      }
      return;
    }
    if (a.detruit) {
      // il tombe en tournant, le nez vers le bas, puis s'écrase
      a.chute += dt;
      a.vy -= 9.8 * dt;
      a.angle += 0.8 * dt;
      a.roulis += 2.5 * dt;
      a.tangage = Math.max(-1.2, a.tangage - 0.5 * dt);
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += a.vz * dt;
      const sol = T.dansLEau(a.x, a.z) ? C.lac.niveau : T.hauteur(a.x, a.z);
      if (a.y <= sol) {
        ev.push(["crash", { nom: a.nom, x: a.x, y: sol, z: a.z, dansLEau: T.dansLEau(a.x, a.z) }]);
        a.etat = "parti";
        a.attente = A.retour;
      }
      return;
    }
    a.recharge = Math.max(0, a.recharge - dt);
    // 1. Ton Rafale est en l'air, tout près ? DUEL !
    const rafale = monde.engins.find((e) => e.sorte === "avion" && e.pilote && e.enVol && !e.detruit);
    const dRafale = rafale ? Math.hypot(rafale.x - a.x, rafale.y - a.y, rafale.z - a.z) : Infinity;
    if (dRafale < A.duel) {
      if (a.etat !== "duel") ev.push(["duel", { nom: a.nom }]);
      a.etat = "duel";
      piloter(a, Math.atan2(rafale.z - a.z, rafale.x - a.x), rafale.y, dt, A.virage * 1.3);
      const ecart = Math.abs(angleEntre(Math.atan2(rafale.z - a.z, rafale.x - a.x) - a.angle));
      if (ecart < A.missile.cone && dRafale < A.missile.portee && a.recharge === 0) {
        a.recharge = A.missile.recharge;
        const d = { x: rafale.x - a.x, y: rafale.y - a.y, z: rafale.z - a.z }, l = Math.hypot(d.x, d.y, d.z);
        const depart = { x: a.x + (d.x / l) * 8, y: a.y - 1, z: a.z + (d.z / l) * 8 };
        Tanks.Obus.lancer(monde.obus, a, "missile", depart, { x: d.x / l, y: d.y / l, z: d.z / l }, rafale);
        ev.push(["missile-ennemi", { tireur: a, cible: rafale, x: depart.x, y: depart.y, z: depart.z }]);
      }
      return;
    }
    if (a.etat === "duel") a.etat = "approche";
    // 2. Le bombardement.
    if (a.etat === "approche") {
      if (!a.cible || a.cible.detruit || a.cible.mort) {
        const possibles = monde.chars.filter((c) => c.equipe === "bleus" && !c.detruit);
        const toi = monde.toi && monde.toi.soldat;
        if (toi && !toi.mort && !toi.dansUnEngin) possibles.push(toi);
        a.cible = possibles.length ? possibles[Math.floor(hasard() * possibles.length)] : null;
        a.erreur = { x: (hasard() * 2 - 1) * A.erreurBombe, z: (hasard() * 2 - 1) * A.erreurBombe };
      }
      if (!a.cible) return piloter(a, a.angle, A.altitude, dt, A.virage);
      // où lâcher la bombe : là où elle tombera pile sur la cible (en visant là où la cible SERA)
      const chute = Math.sqrt((2 * Math.max(10, a.y - a.cible.y)) / C.projectiles.bombe.gravite);
      const vise = { x: a.cible.x + a.erreur.x + Math.cos(a.cible.angle || 0) * (a.cible.vitesse || 0) * chute, z: a.cible.z + a.erreur.z + Math.sin(a.cible.angle || 0) * (a.cible.vitesse || 0) * chute };
      const lacher = { x: vise.x - Math.cos(a.angle) * a.vitesse * chute, z: vise.z - Math.sin(a.angle) * a.vitesse * chute };
      // trop près pour bien viser ? il s'éloigne tout droit pour prendre de l'élan (sinon il tournerait en rond)
      const dVise = Math.hypot(vise.x - a.x, vise.z - a.z), elan = a.vitesse * chute;
      if (a.elan || dVise < elan * 0.8) {
        a.elan = dVise < elan * 1.8;
        return piloter(a, a.elan ? a.angle : Math.atan2(vise.z - a.z, vise.x - a.x), A.altitude, dt, A.virage);
      }
      piloter(a, Math.atan2(vise.z - a.z, vise.x - a.x), A.altitude, dt, A.virage);
      a.distanceLarguage = Math.hypot(lacher.x - a.x, lacher.z - a.z);
      const enFace = Math.abs(angleEntre(Math.atan2(vise.z - a.z, vise.x - a.x) - a.angle)) < 0.15;
      if (enFace && a.distanceLarguage < a.vitesse * 0.3 && dVise > elan * 0.8) {
        a.etat = "bombarde";
        a.bombes = A.bombes;
        a.prochaineBombe = 0;
        ev.push(["bombardement", { nom: a.nom, cible: a.cible.nom === "toi" ? "toi" : a.cible.nom }]);
      }
      return;
    }
    if (a.etat === "bombarde") {
      piloter(a, a.angle, A.altitude, dt, A.virage);
      a.prochaineBombe -= dt;
      if (a.prochaineBombe <= 0 && a.bombes > 0) {
        a.bombes--;
        a.prochaineBombe = 0.25;
        Tanks.Obus.lancer(monde.obus, a, "bombe", { x: a.x, y: a.y - 2, z: a.z }, { x: 0, y: 0, z: 0 }, null, { x: a.vx, y: 0, z: a.vz });
      }
      if (a.bombes === 0) (a.etat = "degage"), (a.degage = 9);
      return;
    }
    if (a.etat === "degage") {
      // il s'éloigne tout droit en remontant, puis fait demi-tour vers le champ de bataille
      a.degage -= dt;
      const dehors = Math.abs(a.x) > LOIN - 200 || Math.abs(a.z) > LOIN - 200;
      piloter(a, dehors || a.degage < 0 ? Math.atan2(-a.z, -a.x) : a.angle, A.altitude + 40, dt, A.virage);
      if (a.degage < -6) (a.etat = "approche"), (a.cible = null);
    }
  }

  // Les avions de transport : un par équipe, toutes les 60 s.
  function transport(equipe, monde) {
    const sens = equipe === "bleus" ? -1 : 1, [lx, lz] = P.largage[equipe];
    // il arrive par le côté (est ou ouest, au hasard), à la hauteur de la zone de largage, et traverse la carte
    const cote = hasard() < 0.5 ? -1 : 1;
    return {
      genre: "avion", sorte: "transport", equipe, nom: P.transport.nom + (equipe === "bleus" ? " bleu" : " rouge"), pilote: true, enVol: true,
      fiche: { vie: P.transport.vie, longueur: 24, largeur: 30, hauteur: 7 },
      x: cote * LOIN, y: P.altitude, z: lz + sens * 20, angle: cote > 0 ? Math.PI : 0, tangage: 0, roulis: 0, vitesse: P.transport.vitesse,
      vx: 0, vy: 0, vz: 0, vie: P.transport.vie, detruit: false, touche: 9, etat: "vole", largage: { x: lx, z: lz }, restent: P.nombre, prochain: 0, chute: 0,
    };
  }
  function avancerTransport(a, monde, dt, ev) {
    if (a.detruit) {
      a.vy -= 9.8 * dt;
      a.tangage = Math.max(-0.8, a.tangage - 0.3 * dt);
      a.roulis += 0.6 * dt;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.z += a.vz * dt;
      const sol = T.dansLEau(a.x, a.z) ? C.lac.niveau : T.hauteur(a.x, a.z);
      if (a.y <= sol) {
        ev.push(["crash", { nom: a.nom, x: a.x, y: sol, z: a.z }]);
        a.etat = "parti";
      }
      return;
    }
    piloter(a, a.angle, P.altitude, dt, 0.3);
    // au-dessus de la zone de largage : les parachutistes sautent, un toutes les 0,7 s
    if (a.restent > 0 && Math.abs(a.x - a.largage.x) < 60) {
      a.prochain -= dt;
      if (a.prochain <= 0) {
        a.prochain = 0.7;
        a.restent--;
        const vivants = monde.soldats.filter((s) => s.equipe === a.equipe && !s.mort).length;
        if (vivants < P.maxParEquipe) {
          const s = Tanks.Troupes.parachutiste(a.equipe, a.x - Math.cos(a.angle) * 8, a.y - 3, a.z, P.nombre - a.restent);
          monde.soldats.push(s);
          if (a.restent === P.nombre - 1) ev.push(["parachutistes", { equipe: a.equipe, nombre: P.nombre, x: a.x, z: a.z }]);
        }
      }
    }
    if (Math.abs(a.x) > LOIN + 50) a.etat = "parti";
  }

  // Tous les avions pendant un pas. Renvoie des événements.
  function avancer(monde, dt) {
    const ev = [];
    // les avions de transport : un par équipe, toutes les 60 s
    monde.chronoParas = (monde.chronoParas === undefined ? P.toutesLes - P.premier : monde.chronoParas) + dt;
    if (monde.chronoParas >= P.toutesLes) {
      monde.chronoParas = 0;
      for (const equipe of ["bleus", "rouges"]) monde.avions.push(transport(equipe, monde));
    }
    for (const a of monde.avions) {
      a.touche += dt;
      if (a.sorte === "chasseur") avancerChasseur(a, monde, dt, ev);
      else if (a.etat !== "parti") avancerTransport(a, monde, dt, ev);
    }
    // (les transports partis ne servent plus à rien)
    for (let i = monde.avions.length - 1; i >= 0; i--) if (monde.avions[i].sorte === "transport" && monde.avions[i].etat === "parti") monde.avions.splice(i, 1);
    return ev;
  }

  // Ceux qu'on peut toucher en l'air (pour les obus de DCA et les missiles) : les avions qui volent, et ton Rafale.
  const enLAir = (monde) => monde.avions.filter((a) => a.etat !== "attend" && a.etat !== "parti" && !a.detruit).concat(monde.engins.filter((e) => e.sorte === "avion" && e.pilote && e.enVol && !e.detruit));

  return { creer, avancer, enLAir };
})();
