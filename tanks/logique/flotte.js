// 🎮 TA FLOTTE DE DRONES : le pupitre du pilote (demande 115, édition « Bataille de drones »)
//
// ✍️ « Chaque joueur pilote des drones (reconnaissance, kamikaze, bombardier). » Dans cette édition, l'engin « drone » de
// ton aire n'est plus UN drone mais TOUTE TA FLOTTE (« engins.drone.types » de l'édition) : assis dans ton POSTE DE
// COMMANDEMENT, tu choisis le drone avec les touches 1 à 5, et tu le pilotes à la 1re personne :
//   - 1 « quadri » de RECONNAISSANCE : Espace MARQUE les ennemis sous lui (◆ jaune pour tes alliés, comme les jumelles) ;
//   - 2 « quadri » FPV KAMIKAZE : Espace (ou un choc) le fait EXPLOSER ;
//   - 3 « quadri » BOMBARDIER : Espace LÂCHE une grenade (elle garde la vitesse du drone en tombant) ;
//   - 4 « aile » MUNITION RÔDEUSE : elle avance toujours (une aile ne fait pas de sur-place !) ; Espace la fait PLONGER sur
//     le véhicule ou l'antenne au centre de l'image, et elle se guide toute seule jusqu'à l'explosion ;
//   - 5 « sol » ROBOT TERRESTRE : il roule, Espace tire avec sa mitrailleuse.
// Chaque drone a sa BATTERIE, ses points de VIE (on peut l'abattre : les soldats ennemis tirent dessus, les canons
// anti-drones aussi) et son SIGNAL (la portée des antennes relais de ton camp : logique/relais.js ; dans le brouilleur
// d'une antenne ennemie, l'image se brouille). Un drone perdu (explosé, abattu, batterie vide, hors de portée) : tu
// restes dans ton poste, et la même sorte sera prête dans « recharge » s ; une autre touche en prend une autre tout de
// suite. Changer de drone en vol le RAPPELLE (il rentre, sans attente). E : tu sors du poste, à pied.
// Ce fichier ne dessine rien (les lunettes : affichage/drones-fpv3d.js ; le robot : affichage/relais3d.js).

window.Tanks = window.Tanks || {};

Tanks.Flotte = (function () {
  const C = Tanks.CONFIG, G = C.engins.drone || {}, T = Tanks.Terrain;
  const actif = !!G.types;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const fiches = {};
  if (actif) for (const id of Object.keys(G.types)) fiches[id] = Object.assign({ id }, G, G.types[id]);
  const bilan = { vols: 0, perdus: 0, explosions: 0, touches: 0, marques: 0, grenades: 0, balles: 0, rappels: 0, abattu: 0, parSorte: {} };
  const DF = () => Tanks.DronesFPV, RL = () => (Tanks.Relais && Tanks.Relais.actif ? Tanks.Relais : null);

  // Au début de la bataille : TOI, assis dans ton poste, aux commandes de ton premier drone (règle « operateur »)
  function installer(monde) {
    if (!actif) return;
    for (const k of Object.keys(bilan)) bilan[k] = k === "parSorte" ? {} : 0;
    const e = monde.engins.find((x) => x.sorte === "drone");
    if (!e) return;
    Object.assign(e, { typeDrone: G.typeDepart, attentes: {}, vol: 0, nom: fiches[G.typeDepart].nom });
    if (C.edition.regles.operateur && monde.toi && monde.toi.soldat) {
      const s = monde.toi.soldat;
      e.pilote = true;
      s.dansUnEngin = e;
      monde.toi = { mode: "drone", engin: e, soldat: s };
    }
  }
  const fiche = (e) => fiches[e.typeDrone || G.typeDepart];

  // Le drone rentre sur son aire (rappelé, ou perdu) : tu restes aux commandes, dans ton poste
  function rentrer(e) {
    Tanks.Engins.garer(e);
    Object.assign(e, { pilote: true, vol: 0, plongee: null, lache: false, nom: fiche(e).nom });
  }
  // ✍️ La FIN d'un vol : explosion (kamikaze, rôdeuse), crash, abattu, batterie vide, signal perdu
  function finVol(e, monde, ev, raison, explose, cible, charge) {
    const R = fiche(e), toi = monde.toi.soldat;
    let sorte = null;
    if (explose) {
      const d = { x: e.x, y: e.y, z: e.z, vx: Math.cos(e.angle) * e.vitesse, vy: e.vy - 2, vz: Math.sin(e.angle) * e.vitesse };
      sorte = DF().exploser(monde, d, cible, cible ? "cible" : "sol", ev, toi, charge);
      bilan.explosions++;
      if (cible) bilan.touches++;
    } else bilan.perdus++;
    ev.push(["flotte-fin", { nom: R.nom, icone: R.icone, raison, explose: !!explose, vise: cible ? DF().nomDe(cible, monde) : null, cage: sorte === "fpvCage", vol: Math.round(e.vol), attente: R.recharge }]);
    e.attentes[e.typeDrone] = R.recharge;
    rentrer(e);
  }
  // Ton drone est TOUCHÉ (un soldat ennemi, un canon anti-drones) : -1 point ; à 0, il tombe
  function toucher(e, monde, ev, par) {
    if (!e.vol) return;
    e.vieDrone = (e.vieDrone || 1) - 1;
    ev.push(["flotte-touche", { nom: fiche(e).nom, par, vie: Math.max(0, e.vieDrone), vieMax: fiche(e).vie }]);
    if (e.vieDrone <= 0) (bilan.abattu++, finVol(e, monde, ev, "abattu par " + par, fiche(e).action === "exploser" || fiche(e).action === "plonger", null, fiche(e).action === "plonger" ? "rodeuse" : "fpv"));
  }
  // Une touche 1 à 5 : changer de drone (celui en vol est rappelé)
  function choisir(e, id, monde, ev) {
    if (e.vol > 0) (bilan.rappels++, ev.push(["flotte-rappel", { nom: fiche(e).nom }]));
    e.typeDrone = id;
    rentrer(e);
    ev.push(["flotte-choix", { nom: fiches[id].nom, icone: fiches[id].icone, touche: fiches[id].touche, attente: Math.ceil(e.attentes[id] || 0), aide: fiches[id].aide }]);
  }
  // E : tu sors de ton poste (à pied, à côté de lui)
  function quitter(monde) {
    const t = monde.toi, e = t.engin, s = t.soldat, rl = RL();
    const p = rl ? rl.postes[e.equipe] : e;
    Tanks.Engins.garer(e);
    e.pilote = false;
    e.vol = 0;
    Object.assign(s, { x: p.x + 4, z: p.z + 4, angle: e.angle, dansUnEngin: null, vitesse: 0 });
    s.y = T.hauteur(s.x, s.z);
    t.mode = "pied";
    t.engin = null;
    Tanks.Evenements.emettre("sortir", { de: "ton poste de commandement" });
  }

  // La cible de la munition rôdeuse : le véhicule ennemi (ou l'antenne, le poste) le plus au centre de l'image
  function viser(e, monde, R) {
    let meilleur = null, me = R.cone;
    const rl = RL(), l = [];
    for (const c of monde.chars.concat(monde.vehicules)) if (!c.detruit && c.equipe !== e.equipe) l.push(c);
    if (rl) for (const o of rl.cibles(e.equipe)) l.push(o);
    for (const c of l) {
      const dh = Math.hypot(c.x - e.x, c.z - e.z);
      if (dh > R.porteeVisee || dh < 5) continue;
      const ecart = Math.abs(angleEntre(Math.atan2(c.z - e.z, c.x - e.x) - e.angle)) + Math.abs(Math.atan2(c.y - e.y, dh) - (e.pique || 0)) * 0.5;
      if (ecart < me) (me = ecart), (meilleur = c);
    }
    return meilleur;
  }

  // ------------------------------------------------------------------ LE PILOTAGE (logique/engins.js appelle ceci)
  function piloter(e, I, dt, R0, monde, ev) {
    if (!e.attentes) Object.assign(e, { typeDrone: G.typeDepart, attentes: {}, vol: 0 });
    for (const k of Object.keys(e.attentes)) if (e.attentes[k] > 0 && (e.attentes[k] = Math.max(0, e.attentes[k] - dt)) === 0) ev.push(["flotte-pret", { nom: fiches[k].nom, icone: fiches[k].icone, touche: fiches[k].touche }]);
    const R = fiche(e), sol = T.hauteur(e.x, e.z);
    e.rotor += dt * (e.pilote && e.vol > 0 ? 60 : 0);
    if (!e.pilote) return void Object.assign(e, { y: sol, vitesse: 0, vy: 0, enVol: false, vol: 0 });
    if (!e.operateur) e.operateur = { x: e.x, z: e.z, angle: e.angle };
    for (const id of Object.keys(fiches)) if (I["arme" + fiches[id].touche] && id !== e.typeDrone) return choisir(e, id, monde, ev);
    if (e.lache) return void (e.lache = false);
    e.attenteFlotte = e.attentes[e.typeDrone] > 0;
    if (e.attenteFlotte) return void Object.assign(e, { y: sol, vitesse: 0, vy: 0, enVol: false });
    // le décollage : un drone neuf
    if (!e.vol) {
      Object.assign(e, { batterie: R.batterie, vieDrone: R.vie, munitionsDrone: R.munitions || 0, nom: R.nom, plongee: null, rechargeAction: 0, penseTir: 0.5, vitesse: R.vol === "aile" ? R.vitesseMin : 0 });
      bilan.vols++;
      bilan.parSorte[R.id] = (bilan.parSorte[R.id] || 0) + 1;
      ev.push(["flotte-decolle", { nom: R.nom, icone: R.icone }]);
    }
    e.vol += dt;
    e.batterie = Math.max(0, e.batterie - dt);
    const rl = RL(), brouille = rl ? rl.brouillePar(e.equipe, e.x, e.z) : null;
    e.signal = rl ? rl.couverture(e.equipe, e.x, e.z) * (brouille ? 1 - C.relais.perteSignal : 1) : Math.max(0, 1 - Math.hypot(e.x - e.operateur.x, e.z - e.operateur.z) / R.portee);
    e.brouille = !!brouille;
    const monte = (I.tourelleGauche ? 1 : 0) - (I.tourelleDroite ? 1 : 0), sens = (I.droite ? 1 : 0) - (I.gauche ? 1 : 0);
    const ax = e.x, ay = e.y, az = e.z;
    if (R.vol === "sol") {
      // 🤖 LE ROBOT : il roule (comme un petit char)
      if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
      else if (I.reculer) e.vitesse = Math.max(-R.vitesseMax * 0.5, e.vitesse - R.acceleration * dt);
      else e.vitesse *= 1 - dt * 2;
      e.angle = angleEntre(e.angle + sens * R.virage * dt);
      e.x += Math.cos(e.angle) * e.vitesse * dt;
      e.z += Math.sin(e.angle) * e.vitesse * dt;
      T.repousser(e, 1.1);
      e.y = T.hauteur(e.x, e.z);
      e.vy = 0;
      e.pique = 0;
      e.enVol = true;
    } else if (R.vol === "aile") {
      // ✈️ LA MUNITION RÔDEUSE : elle avance toujours ; en piqué, elle se guide seule vers sa cible
      const c = e.plongee;
      if (c && !c.detruit) {
        const dx = c.x - e.x, dy = c.y + (c.fiche ? 1.2 : 2) - e.y, dz = c.z - e.z, n = Math.hypot(dx, dy, dz) || 1;
        e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * 2 * dt);
        e.angle = angleEntre(e.angle + Math.max(-2.5 * dt, Math.min(2.5 * dt, angleEntre(Math.atan2(dz, dx) - e.angle))));
        e.vy += (dy / n * e.vitesse - e.vy) * Math.min(1, dt * 4);
        if (n < 3.2) return finVol(e, monde, ev, "plongée réussie", true, c, "rodeuse");
      } else {
        e.plongee = null;
        e.vitesse = Math.max(R.vitesseMin, Math.min(R.vitesseMax, e.vitesse + ((I.avancer ? 1 : 0) - (I.reculer ? 1 : 0)) * R.acceleration * dt));
        e.angle = angleEntre(e.angle + sens * R.virage * dt);
        e.vy += (monte * R.montee - e.vy) * Math.min(1, dt * 2);
        if (e.y < sol + 6 && monte <= 0) e.vy = Math.max(e.vy, 2); // (le pilote automatique ne la laisse pas toucher le sol)
      }
      e.x += Math.cos(e.angle) * e.vitesse * dt;
      e.z += Math.sin(e.angle) * e.vitesse * dt;
      e.y = Math.min(T.hauteur(e.x, e.z) + R.hauteurMax, e.y + e.vy * dt);
      e.roulis += (sens * 0.6 - e.roulis) * Math.min(1, dt * 3);
      e.pique = Math.atan2(e.vy, Math.max(2, e.vitesse));
      e.enVol = true;
    } else {
      // 🛸 LES QUADRICOPTÈRES (reconnaissance, kamikaze, bombardier) : comme le drone FPV d'Europe de l'Est
      const voulueVy = e.y < sol + 2.5 && monte >= 0 && e.vol < 3 ? R.montee : monte * R.montee;
      e.vy += (voulueVy - e.vy) * Math.min(1, dt * 3);
      if (I.avancer) e.vitesse = Math.min(R.vitesseMax, e.vitesse + R.acceleration * dt);
      else if (I.reculer) e.vitesse = Math.max(0, e.vitesse - R.acceleration * 1.5 * dt);
      else e.vitesse *= 1 - dt * 0.4;
      e.angle = angleEntre(e.angle + sens * R.virage * dt);
      e.x += Math.cos(e.angle) * e.vitesse * dt;
      e.z += Math.sin(e.angle) * e.vitesse * dt;
      e.y = Math.min(T.hauteur(e.x, e.z) + R.hauteurMax, e.y + e.vy * dt);
      e.roulis += (sens * 0.35 - e.roulis) * Math.min(1, dt * 3);
      e.pique = Math.atan2(e.vy, Math.max(10, e.vitesse)); // (au décollage, la caméra ne regarde pas le ciel)
      e.enVol = true;
    }
    const lim = T.demi - C.monde.bord;
    e.x = Math.max(-lim, Math.min(lim, e.x));
    e.z = Math.max(-lim, Math.min(lim, e.z));
    // l'ACTION (Espace)
    e.rechargeAction = Math.max(0, e.rechargeAction - dt);
    if (I.tirer && e.rechargeAction === 0 && e.vol > 0.6) {
      if (R.action === "exploser") return finVol(e, monde, ev, "Espace", true, null, "fpv");
      if (R.action === "marquer") {
        e.rechargeAction = 1.5;
        const l = [];
        for (const o of monde.soldats.concat(monde.chars, monde.vehicules)) if (!o.mort && !o.detruit && !o.dansUnEngin && o.equipe !== e.equipe && Math.hypot(o.x - e.x, o.z - e.z) < R.rayonMarque) l.push(o);
        const noms = [];
        for (const o of l) (!(o.marque > 0) && noms.push(o.nom), (o.marque = C.marques.duree));
        bilan.marques += l.length;
        ev.push(["marque", { nombre: l.length, nouveaux: noms.length, noms: noms.slice(0, 4), comment: "le drone de reconnaissance", duree: C.marques.duree }]);
      } else if (R.action === "bombe") {
        if (e.munitionsDrone <= 0) (e.rechargeAction = 1), ev.push(["impossible", { raison: "plus de grenades : rappelle le bombardier (touche 3 sur un autre drone, puis 3)" }]);
        else {
          e.rechargeAction = R.cadence;
          e.munitionsDrone--;
          bilan.grenades++;
          const p = Tanks.Obus.lancer(monde.obus, monde.toi.soldat, "grenade", { x: e.x, y: e.y - 0.6, z: e.z }, { x: 0, y: 0, z: 0 }, null, { x: Math.cos(e.angle) * e.vitesse, y: 0, z: Math.sin(e.angle) * e.vitesse });
          ev.push(["largage", { sorte: "grenade", engin: R.nom, reste: e.munitionsDrone, x: p.x, y: p.y, z: p.z }]);
        }
      } else if (R.action === "plonger" && !e.plongee) {
        e.rechargeAction = 0.5;
        const c = viser(e, monde, R);
        if (c) (e.plongee = c), ev.push(["rodeuse-plonge", { nom: R.nom, vise: DF().nomDe(c, monde), distance: Math.round(Math.hypot(c.x - e.x, c.z - e.z)) }]);
        else ev.push(["impossible", { raison: "aucun véhicule ni antenne ennemis au centre de l'image (à moins de " + R.porteeVisee + " m)" }]);
      } else if (R.action === "mitrailleuse") {
        if (e.munitionsDrone <= 0) (e.rechargeAction = 1), ev.push(["impossible", { raison: "plus de balles dans le robot" }]);
        else {
          e.rechargeAction = R.cadence;
          e.munitionsDrone--;
          bilan.balles++;
          Tanks.Soldat.balle(e, e.x + Math.cos(e.angle) * 0.9, e.y + 0.9, e.z + Math.sin(e.angle) * 0.9, e.angle, "mitrailleuse", monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
        }
      }
    }
    // les soldats ennemis tout près tirent sur ton drone (2 fois par seconde)
    const tir = C.fpv && C.fpv.tir;
    e.penseTir -= dt;
    if (tir && e.penseTir <= 0) {
      e.penseTir = 0.5;
      if (e.y - T.hauteur(e.x, e.z) < tir.hauteur) for (const s of monde.soldats) {
        if (s.mort || s.dansUnEngin || s.equipe === e.equipe || Math.abs(s.x - e.x) > tir.portee || Math.abs(s.z - e.z) > tir.portee) continue;
        ev.push(["balle", { tireur: s, de: { x: s.x, y: s.y + 1.5, z: s.z }, a: { x: e.x + (Math.random() - 0.5) * 3, y: e.y, z: e.z + (Math.random() - 0.5) * 3 }, matiere: "metal", antiDrone: true }]);
        if (Math.random() < tir.chance) return toucher(e, monde, ev, s.nom);
        break;
      }
    }
    // la fin du vol ?
    const kamikaze = R.action === "exploser" || R.action === "plonger", charge = R.action === "plonger" ? "rodeuse" : "fpv";
    if (e.batterie <= 0) return finVol(e, monde, ev, "batterie vide", kamikaze, null, charge);
    if (e.signal <= 0) return finVol(e, monde, ev, brouille ? "brouillé par " + brouille.nom : "hors de portée de tes antennes relais", kamikaze, null, charge);
    if (R.vol === "sol") return;
    const solIci = T.hauteur(e.x, e.z);
    if (e.y <= solIci + 0.3 && e.vol > 1.5 && (e.vitesse > 6 || e.vy < -4)) return finVol(e, monde, ev, "le sol", kamikaze, null, charge);
    for (const c of Tanks.Obus.cibles(monde)) if (!c.detruit && c.equipe !== e.equipe && c !== e && Tanks.Obus.dansLeChar(c, e.x, e.y, e.z)) return finVol(e, monde, ev, "un véhicule", kamikaze, c, charge);
    if (kamikaze) for (const s of monde.soldats) if (!s.mort && !s.dansUnEngin && s.equipe !== e.equipe && Math.abs(s.x - e.x) < 1.5 && Math.abs(s.z - e.z) < 1.5 && Math.abs(s.y + 1 - e.y) < 1.5) return finVol(e, monde, ev, "un soldat", true, s, charge);
    if (e.y < solIci + 30) {
      const m = Tanks.Structures.premier(ax, ay, az, e.x, e.y, e.z);
      if (m) return (e.x = m.x), (e.y = m.y), (e.z = m.z), finVol(e, monde, ev, "un mur", kamikaze, null, charge);
    }
    if (e.y < solIci) e.y = solIci;
  }
  return { actif, fiches, fiche, installer, piloter, toucher, quitter, bilan };
})();
