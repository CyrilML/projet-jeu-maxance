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
// Demande 97 : les MUNITIONS de l'armurerie : les perforantes font plus mal aux motos, aux quads et à leurs pilotes
// (« vsVehicule »), les subsoniques font moins de bruit mais leur balle est plus lente (elle tombe plus).
// Étape 79 : LE SNIPER. Avec une lunette (les fusils de précision, ou la lunette ×6), épauler montre la vraie lunette.
//   - la RESPIRATION : ta visée dessine doucement un « 8 » (comme quand on respire en tenant un fusil lourd).
//   - Maj : tu RETIENS TON SOUFFLE quelques secondes : la visée s'arrête presque. Si tu tiens jusqu'au bout, tu dois
//     reprendre ton souffle : pendant « reprise » secondes, la visée bouge beaucoup plus.
//   - la CHUTE : une balle tombe pendant son vol, comme une pierre qu'on lance : chute = ½ × g × temps², avec
//     temps = distance ÷ vitesse de la balle. La lunette est réglée à 200 m : plus loin, la balle arrive sous la croix
//     (à 400 m, une cinquantaine de cm) : de très loin, ça peut te faire rater !
// ✍️ LES FUSILS À POMPE (« Je veux que tu fasses les fusils à pompe, normaux et incendiaires… ») : un coup lance
// « plombs » billes. Chaque bille est une balle à part : elle a SA chance de toucher (l'écart de l'arme + la « gerbe »).
// De près, la silhouette paraît grande : presque toutes les billes touchent. De loin, presque aucune. On recharge
// cartouche par cartouche (tirer arrête le rechargement). Les cartouches INCENDIAIRES mettent le feu au soldat touché :
// il perd un peu de vie toutes les 0,5 s pendant 3 s (« enflamme », puis « soldat-touche » par le feu).
// Ce fichier ne dessine rien : il renvoie des événements (« balle », « roquette », « recharge-arme », « vide »…).

window.Tanks = window.Tanks || {};

Tanks.Armes = (function () {
  const C = Tanks.CONFIG, TIR = C.tir, T = Tanks.Terrain, L = C.tir.lunette;
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

  // ✍️ (étape 79) LA CHUTE de la balle à « d » mètres (m) : ½ × g × (d ÷ v)².
  function chute(d, vitesse) {
    if (!vitesse) return 0;
    const temps = d / vitesse;
    return 0.5 * L.gravite * temps * temps;
  }
  // Comme un vrai tireur, ta lunette est RÉGLÉE à « zero » mètres : là, la balle arrive pile sur la croix (on vise un tout
  // petit peu vers le haut sans le savoir). Plus loin, elle arrive EN DESSOUS de la croix (m) ; plus près, un peu au-dessus.
  const sousLaCroix = (d, vitesse) => chute(d, vitesse) - chute(L.zero, vitesse) * (d / L.zero);

  // ✍️ (étape 79) LA RESPIRATION dans la lunette, et Maj pour retenir son souffle.
  // s.souffle = { reserve (1 = plein, 0 = vide), retenu, reprise (s), t (l'horloge du « 8 ») } ; s.balancement = { x, y } (rad).
  function respirer(s, st, intentions, dt) {
    const b = s.souffle || (s.souffle = { reserve: 1, retenu: false, reprise: 0, t: 0, force: 1 });
    const dansLaLunette = !!st.lunette && s.visee > 0.6;
    b.reprise = Math.max(0, b.reprise - dt);
    b.retenu = dansLaLunette && !!intentions.souffle && b.reprise <= 0 && b.reserve > 0;
    if (b.retenu) {
      b.reserve = Math.max(0, b.reserve - dt / L.souffle);
      if (b.reserve <= 0) (b.retenu = false), (b.reprise = L.reprise); // tenu jusqu'au bout : il faut reprendre son souffle
    } else b.reserve = Math.min(1, b.reserve + dt / L.souffle);
    // la force du balancement : presque rien souffle retenu, beaucoup plus en reprenant son souffle (on lisse un peu)
    const voulue = b.retenu ? L.retenu : b.reprise > 0 ? L.essouffle : 1;
    b.force += (voulue - b.force) * Math.min(1, dt * 6);
    b.t += dt * (b.reprise > 0 ? 1.8 : 1); // (essoufflé : on respire plus vite)
    const w = (Math.PI * 2) / L.periode, A = L.balancement * b.force * s.visee * (st.lunette ? 1 : 0);
    const bal = s.balancement || (s.balancement = { x: 0, y: 0 });
    bal.x = A * Math.sin(b.t * w); // un « 8 » couché : 1 aller-retour de côté pendant 2 en hauteur
    bal.y = A * 0.6 * Math.sin(2 * b.t * w);
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
      // (étape 79) avec la lunette : la balle part là où la respiration a mis ta visée, et elle TOMBE (vitesseBalle)
      const bal = s.balancement || { x: 0, y: 0 };
      const R = { portee: st.portee, porteeEfficace: st.porteeEfficace, degats: st.degats, degatsLoin: st.degatsLoin, degatsVehicule: st.degatsVehicule, vsVehicule: st.vsVehicule, cone: st.cone, dispersionTir: sigma, precision: 0.8, nom: st.nom,
        vitesseBalle: st.vitesseBalle, hausse: bal.y };
      const x = s.x + Math.cos(s.angle) * 0.7, z = s.z + Math.sin(s.angle) * 0.7;
      const avant = ev.length;
      // (fusils à pompe) « plombs » billes, chacune avec un écart plus grand (la gerbe) ; les autres armes : 1 balle
      const plombs = st.plombs || 1;
      if (st.gerbe) R.dispersionTir = sigma + st.gerbe;
      for (let p = 0; p < plombs; p++) {
        const debut = ev.length;
        Tanks.Soldat.balle(s, x, y, z, s.angle + bal.x, R, monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
        for (let k = debut; k < ev.length; k++) {
          const [nom, d] = ev[k];
          if (nom === "balle" && plombs > 1) (d.plomb = p), (d.pompe = true), (d.feu = !!st.incendiaire);
          if (nom === "soldat-touche" && st.incendiaire && d.cible && d.cible.genre === "soldat" && !d.cible.mort) enflammer(d.cible, s, st.incendiaire, ev);
        }
      }
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

  // ✍️ (fusils à pompe) METTRE LE FEU à un soldat : il brûle « duree » s (on repart de zéro s'il brûlait déjà).
  function enflammer(cible, tireur, I, ev) {
    const deja = !!cible.brule;
    cible.brule = { reste: I.duree, attente: I.intervalle, coup: (I.degats * I.intervalle) / I.duree, intervalle: I.intervalle, tireur };
    if (!deja) ev.push(["enflamme", { cible, tireur, duree: I.duree, degats: I.degats, x: cible.x, y: cible.y, z: cible.z }]);
  }
  // Un petit pas pour un soldat qui BRÛLE (appelé par logique/soldat.js) : un petit coup de feu toutes les « intervalle » s.
  function bruler(s, dt, ev) {
    const b = s.brule;
    if (!b) return;
    if (s.mort || s.nage) return void (s.brule = null); // (l'eau éteint le feu)
    b.reste -= dt;
    b.attente -= dt;
    if (b.attente <= 0) {
      b.attente += b.intervalle;
      Tanks.Soldat.blesser(s, b.coup, b.tireur, ev, "feu", b.tireur);
    }
    if (b.reste <= 0) s.brule = null;
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
    respirer(s, st, intentions, dt); // (étape 79 : la respiration dans la lunette, Maj)
    s.coup = Math.max(0, (s.coup || 0) - dt * 8);
    s.repere = Math.max(0, (s.repere || 0) - dt);
    // la visibilité : la lampe allumée et le laser se voient de loin
    // (demande 97) toutes les pièces comptent (le cache-flamme et le camouflage te cachent un peu, l'or te montre…) ; une
    // lampe éteinte (L) ne se voit pas. Les soldats de l'ordinateur te remarquent d'autant plus loin (logique/troupes.js).
    const lampeEteinte = st.lampe && !(A === s.armes.principale && s.lampeAllumee);
    s.visibilite = st.visibilite - (lampeEteinte ? st.visibiliteLampe : 0);
    // 3. le rechargement
    if (s.rechargement > 0) {
      s.rechargement -= dt;
      if (s.rechargementDe !== A) s.rechargement = 0; // (tu as changé d'arme : le rechargement est annulé)
      else if (s.rechargement <= 0) {
        // (fusils à pompe) une seule cartouche à la fois : on recommence tant que le tube n'est pas plein
        const n = Math.min(st.coupParCoup ? 1 : st.chargeur - A.chargeur, A.reserve);
        A.chargeur += n;
        A.reserve -= n;
        s.rechargement = 0;
        if (st.coupParCoup && A.chargeur < st.chargeur && A.reserve > 0) s.rechargement = st.rechargement;
        else ev.push(["recharge-arme", { tireur: s, arme: st.nom, chargeur: A.chargeur, reserve: A.reserve, fini: true }]);
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
    // (fusils à pompe) en train de glisser des cartouches ? Tirer arrête le rechargement (s'il y en a au moins une)
    if (arme && intentions.tirer && st.coupParCoup && s.rechargement > 0 && s.rechargementDe === A && A.chargeur > 0 && s.recharge <= 0) {
      s.rechargement = 0;
      ev.push(["recharge-arme", { tireur: s, arme: st.nom, chargeur: A.chargeur, reserve: A.reserve, fini: true }]);
    }
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

  return { avancer, mobilite, dispersion, enMain, chercherCible, pointVise, chute, sousLaCroix, bruler };
})();
