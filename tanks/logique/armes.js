// 🔫 LES ARMES : le moniteur de tir (étape 77)
//
// ✍️ « Des armes avec de vrais effets. » Ton arme (le pistolet en 1, ton arme principale en 2) n'est plus une simple
// « chance de toucher » : elle a une vraie mécanique, comme dans les jeux de tir.
//   - le CHARGEUR : chaque balle en enlève une. Vide ? Il faut RECHARGER (touche R) : ça prend du temps (rechargement),
//     et les balles viennent de ta RÉSERVE (le pistolet en a toujours).
//   - la DISPERSION : une balle ne part jamais pile droit. Elle s'écarte au hasard d'un petit angle (en radians). À la
//     HANCHE, l'écart est grand ; quand tu ÉPAULES (V ou clic droit), il devient tout petit (mais il faut « visee »
//     secondes pour épauler, et tu marches moins vite). Le LASER réduit l'écart à la hanche.
//     Une balle TOUCHE si son écart tombe dans la « silhouette » de l'ennemi : ± 0,32 m de côté et ± 0,85 m de haut.
//     Plus il est loin, plus ce rectangle paraît petit (0,32 ÷ distance) : de loin, il faut épauler !
//   - le RECUL : chaque balle fait sauter ton arme : la dispersion grandit (puis redescend toute seule), et l'arme
//     tourne un tout petit peu de côté. Une poignée ou une crosse réduit le recul.
//   - les DÉGÂTS baissent avec la distance : pleins jusqu'à « porteeEfficace », puis de moins en moins jusqu'à la portée.
//   - l'ASSISTANCE À LA VISÉE : un ennemi dans le petit cône autour de ton viseur ? Ton arme GLISSE vers lui
//     (« aimant », en radians par seconde) : c'est un vrai aimant, tu peux lutter contre avec les flèches.
//   - le BRUIT : quand tu tires, les ennemis t'entendent jusqu'à 160 m × le bruit de l'arme (le silencieux : × 0,3) :
//     pendant 4 s, tu es « repéré » et ils te cherchent. La LAMPE et le LASER se voient aussi de loin (« visibilite »).
//   - le POINT VISÉ : là où arrive le laser (un mur, le sol, un soldat), recalculé 40 fois par seconde.
// Ce fichier ne dessine rien : il renvoie des événements (« balle », « roquette », « recharge-arme », « vide »…).

window.Tanks = window.Tanks || {};

Tanks.Armes = (function () {
  const C = Tanks.CONFIG, TIR = C.tir, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const vehicules = [];

  // L'arme que tu tiens (les gadgets et les explosifs se tiennent avec l'arme principale)
  const enMain = (s) => (s.arme === "pistolet" ? s.armes.pistolet : s.armes.principale);
  const estUneArme = (s) => s.arme === "pistolet" || s.arme === "principale";

  // Les véhicules ennemis qu'un lance-roquettes peut viser.
  function vehiculesEnnemis(s, monde) {
    vehicules.length = 0;
    const ajouter = (o) => !o.detruit && o.equipe !== s.equipe && vehicules.push(o);
    for (const c of monde.chars) ajouter(c);
    for (const v of monde.vehicules) ajouter(v);
    for (const h of Tanks.Helicos.bas(monde, [])) ajouter(h);
    for (const b of monde.bateaux) ajouter(b);
    return vehicules;
  }

  // ✍️ L'ASSISTANCE À LA VISÉE : l'ennemi le plus près du centre de ton viseur, dans le cône, à portée, qu'on VOIT.
  function chercherCible(s, st, monde) {
    const roquettes = st.famille === "roquettes", cone = st.cone * (1 + 0.3 * s.visee);
    let meilleur = null;
    const regarder = (o, hauteur) => {
      const d = Math.hypot(o.x - s.x, o.z - s.z);
      if (d > st.portee || d < 1) return;
      const ecart = Math.abs(angleEntre(Math.atan2(o.z - s.z, o.x - s.x) - s.angle));
      if (ecart > cone || (meilleur && ecart >= meilleur.ecart)) return;
      if (!T.vueLibre(s.x, s.y + 1.5, s.z, o.x, o.y + hauteur, o.z)) return;
      meilleur = { o, ecart, d };
    };
    if (roquettes) for (const v of vehiculesEnnemis(s, monde)) regarder(v, 1.5);
    else for (const o of monde.soldats) if (!o.mort && !o.dansUnEngin && o.equipe !== s.equipe) regarder(o, 1.2);
    return meilleur;
  }

  // ✍️ LE POINT VISÉ (le laser) : on avance sur la ligne du viseur jusqu'au premier obstacle (un soldat, un véhicule,
  // un mur, le sol). Les soldats et les véhicules sont regardés d'abord (ils sont devant le mur, ou pas).
  function pointVise(s, monde, portee) {
    const x = s.x + Math.cos(s.angle) * 0.6, y = s.y + 1.42, z = s.z + Math.sin(s.angle) * 0.6;
    const dx = Math.cos(s.angle), dz = Math.sin(s.angle);
    let fin = portee, sur = "rien", nom = null;
    for (const o of monde.soldats) {
      if (o === s || o.dansUnEngin || o.parachute) continue;
      const ox = o.x - x, oz = o.z - z, le = ox * dx + oz * dz;
      if (le < 0.5 || le > fin) continue;
      const cote = Math.abs(ox * dz - oz * dx);
      if (cote < (o.mort ? 0.15 : 0.32) && (!o.mort || Math.abs(T.hauteur(o.x, o.z) + 0.3 - y) < 0.5)) (fin = le - 0.25), (sur = "soldat"), (nom = o.nom);
    }
    for (const c of monde.chars.concat(monde.vehicules)) {
      const le = (c.x - x) * dx + (c.z - z) * dz;
      if (le < 1 || le > fin + 4) continue;
      for (let k = Math.max(0.5, le - 4); k < Math.min(fin, le + 4); k += 0.4) {
        if (Tanks.Obus.dansLeChar(c, x + dx * k, y, z + dz * k)) {
          (fin = k), (sur = c.genre === "vehicule" ? "engin" : "tank"), (nom = c.nom);
          break;
        }
      }
    }
    const m = Tanks.Structures.premier(x, y, z, x + dx * fin, y, z + dz * fin);
    if (m) (fin = Math.hypot(m.x - x, m.z - z)), (sur = "mur"), (nom = m.b.nom);
    // le sol : on avance par pas de 1 m (puis on affine), tant que la ligne est au-dessus de la colline
    for (let k = 1; k < fin; k += 1) {
      if (T.hauteur(x + dx * k, z + dz * k) > y) {
        let a = k - 1, b = k;
        for (let i = 0; i < 5; i++) { const mi = (a + b) / 2; if (T.hauteur(x + dx * mi, z + dz * mi) > y) b = mi; else a = mi; }
        (fin = a), (sur = "sol"), (nom = null);
        break;
      }
    }
    const v = s.vise || (s.vise = {});
    (v.x = x + dx * fin), (v.y = y), (v.z = z + dz * fin), (v.d = fin), (v.sur = sur), (v.nom = nom), (v.de = { x, y, z });
    return v;
  }

  // La dispersion de CE tir : de la hanche à l'épaule selon « visee », plus le recul, plus un peu quand tu bouges.
  function dispersion(s, st) {
    return st.dispersion + (st.dispersionVisee - st.dispersion) * s.visee + s.dispersionRecul + Math.min(1, Math.abs(s.vitesse) / 4) * 0.012 * (1 - s.visee * 0.5);
  }

  // Un tir : une balle (avec la nouvelle mécanique : voir Soldat.balle), ou une roquette.
  function tirer(s, A, monde, ev) {
    const st = A.stats, sigma = dispersion(s, st);
    A.chargeur--;
    s.recharge = st.cadence;
    s.tir = 0.08;
    s.compteurs.tirs++;
    const y = s.y + 1.45;
    if (st.famille === "roquettes") {
      // une roquette : elle vole ; s'il y a un véhicule dans le cône, on lève le tube juste ce qu'il faut
      const R = C.projectiles[st.projectile], vise = s.assist || chercherCible(s, Object.assign({}, st, { cone: Math.max(st.cone, 0.1) }), monde);
      const cible = vise && vise.o, d = cible ? Math.hypot(cible.x - s.x, cible.z - s.z) : 60;
      const h = cible ? Math.atan2(cible.y + 1.2 - y, d) + 0.5 * Math.asin(Math.min(1, (R.gravite * d) / (R.vitesse ** 2))) : 0.02;
      const a = s.angle + (Math.random() * 2 - 1) * sigma, hh = h + (Math.random() * 2 - 1) * sigma * 0.5;
      const dir = { x: Math.cos(a) * Math.cos(hh), y: Math.sin(hh), z: Math.sin(a) * Math.cos(hh) };
      const depart = { x: s.x + Math.cos(s.angle) * 0.8, y, z: s.z + Math.sin(s.angle) * 0.8 };
      const p = Tanks.Obus.lancer(monde.obus, s, st.projectile, depart, dir, R.guide && cible ? cible : null);
      p.degatsChar = st.degats;
      ev.push(["roquette", { tireur: s, x: depart.x, y, z: depart.z, dir, arme: st.nom, guide: !!(R.guide && cible), cible: cible && cible.nom }]);
    } else {
      // une balle : elle part dans la direction du viseur (l'écart au hasard est tiré dans Soldat.balle)
      const R = { portee: st.portee, porteeEfficace: st.porteeEfficace, degats: st.degats, degatsLoin: st.degatsLoin, degatsVehicule: st.degatsVehicule, cone: st.cone, dispersionTir: sigma, precision: 0.8, nom: st.nom };
      const x = s.x + Math.cos(s.angle) * 0.7, z = s.z + Math.sin(s.angle) * 0.7;
      const avant = ev.length;
      Tanks.Soldat.balle(s, x, y, z, s.angle, R, monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
      for (let k = avant; k < ev.length; k++) if (ev[k][0] === "balle" && ev[k][1].touche) s.compteurs.touches++;
    }
    // le RECUL : la dispersion grandit, et l'arme saute un peu de côté
    s.dispersionRecul = Math.min(TIR.reculMax, s.dispersionRecul + st.recul);
    s.angle = angleEntre(s.angle + (Math.random() * 2 - 1) * st.recul * TIR.reculCote);
    s.coup = 1; // (pour le dessin : la caméra et l'arme sautent)
    // le BRUIT : les ennemis autour t'entendent
    s.repere = TIR.repere;
    s.bruitTir = TIR.bruit * st.bruit;
  }

  function commencerRechargement(s, A, ev) {
    if (s.rechargement > 0 || A.chargeur >= A.stats.chargeur || A.reserve <= 0) return false;
    s.rechargement = A.stats.rechargement;
    s.rechargementDe = A;
    ev.push(["recharge-arme", { tireur: s, arme: A.stats.nom, duree: A.stats.rechargement, fini: false }]);
    return true;
  }

  // Un petit pas pour TON arme (à pied, hors de l'eau).
  function avancer(s, intentions, dt, monde, ev) {
    const A = enMain(s), st = A.stats, arme = estUneArme(s);
    // 1. épauler (V ou clic droit) : « visee » va de 0 (hanche) à 1 (épaulé) en st.visee secondes
    const jumelles = s.arme === "gadget" && s.gadget.id === "jumelles";
    const voulu = intentions.viser && (arme || jumelles) && !s.nage ? 1 : 0;
    const duree = jumelles ? 0.3 : st.visee;
    s.visee = Math.max(0, Math.min(1, s.visee + (voulu ? 1 : -1) * (dt / duree)));
    // 2. le recul redescend, le « coup » s'efface, le repérage s'oublie
    s.dispersionRecul = Math.max(0, s.dispersionRecul - TIR.reculRetour * dt);
    s.coup = Math.max(0, (s.coup || 0) - dt * 8);
    s.repere = Math.max(0, (s.repere || 0) - dt);
    // la visibilité : la lampe allumée et le laser se voient de loin
    const lampe = A === s.armes.principale && st.lampe && s.lampeAllumee;
    s.visibilite = (lampe ? C.atelier.lampe.pieces.find((p) => p.effets.lampe === st.lampe).effets.visibilite : 0) + (st.laser && A === s.armes.principale ? C.atelier.laser.pieces.find((p) => p.effets.laser === st.laser).effets.visibilite : 0);
    // 3. le rechargement
    if (s.rechargement > 0) {
      s.rechargement -= dt;
      if (s.rechargementDe !== A) s.rechargement = 0; // (tu as changé d'arme : le rechargement est annulé)
      else if (s.rechargement <= 0) {
        const n = Math.min(st.chargeur - A.chargeur, A.reserve);
        A.chargeur += n;
        A.reserve -= n;
        s.rechargement = 0;
        ev.push(["recharge-arme", { tireur: s, arme: st.nom, chargeur: A.chargeur, reserve: A.reserve, fini: true }]);
      }
    }
    if (intentions.recharger && arme) commencerRechargement(s, A, ev);
    // 4. l'assistance à la visée (10 fois par seconde on cherche la cible ; à chaque pas, l'aimant tire l'arme vers elle)
    s.attenteAssist = (s.attenteAssist || 0) - dt;
    if (s.attenteAssist <= 0) {
      s.attenteAssist = 0.1;
      s.assist = arme ? chercherCible(s, st, monde) : null;
    }
    if (s.assist && (s.assist.o.mort || s.assist.o.detruit)) s.assist = null;
    if (s.assist && st.aimant > 0) {
      const o = s.assist.o, diff = angleEntre(Math.atan2(o.z - s.z, o.x - s.x) - s.angle);
      const pas = st.aimant * (0.6 + 0.4 * s.visee) * dt;
      s.angle = angleEntre(s.angle + Math.max(-pas, Math.min(pas, diff)));
      s.aimantActif = Math.abs(diff) > 0.002;
    } else s.aimantActif = false;
    // 5. le point visé (le laser), 40 fois par seconde
    s.attenteVise = (s.attenteVise || 0) - dt;
    if (s.attenteVise <= 0) {
      s.attenteVise = 1 / 40;
      pointVise(s, monde, Math.min(st.portee, 120));
    }
    // 6. tirer
    if (!arme || !intentions.tirer || s.recharge > 0 || s.rechargement > 0 || s.nage) return;
    if (A.chargeur <= 0) {
      s.recharge = 0.3;
      if (!commencerRechargement(s, A, ev)) ev.push(["vide", { tireur: s, arme: st.nom }]);
      return;
    }
    tirer(s, A, monde, ev);
    if (A.chargeur === 0) commencerRechargement(s, A, ev); // (le dernier coup : on recharge tout seul)
  }

  // La vitesse de marche : × la mobilité de l'arme, et plus lent quand on épaule.
  function mobilite(s) {
    if (!s.armes) return 1;
    const st = enMain(s).stats;
    return st.mobilite * (1 + (TIR.viseeLent - 1) * s.visee);
  }

  return { avancer, mobilite, dispersion, enMain, chercherCible, pointVise };
})();
