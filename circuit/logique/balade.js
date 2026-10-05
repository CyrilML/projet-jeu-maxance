// 🚙 LA BALADE : les règles du parcours libre
//
// Étape 37. ✍️ Sur le parcours, pas de chrono ni d'adversaire : on roule où on veut.
//   - LE SAUT : la voiture suit le sol (logique/parcours.js). Si le sol disparaît sous elle (au bout d'un
//     tremplin), elle s'envole avec sa vitesse vers le haut, et la gravité (20 m/s²) la fait retomber.
//   - LE LOOPING : si on arrive à l'entrée assez vite (54 km/h) et dans le bon sens, la voiture est
//     « accrochée » au rail : elle fait un tour complet, la tête en bas en haut du looping !
//   - LES CARTONS : quand on fonce dedans, chaque carton reçoit une vitesse (celle de la voiture, plus un
//     petit bond vers le haut) et vole, en tournant, jusqu'à retomber. Certaines piles cachent une pièce.
//   - LES PIÈCES : des pièces partout, même en l'air. Pour les prendre, il faut passer tout près,
//     aussi en HAUTEUR (on compare x, z ET y).
//
// Étape 40 : les mêmes règles servent au GRAND PARCOURS (logique/grand-parcours.js), qui a en plus :
//   - LES NITROS : ✍️ des plaques au sol. Dès que tu roules dessus, la voiture est poussée (voiture.nitro) ;
//   - LES CHUTES : ✍️ si tu tombes d'une route en hauteur, d'une plateforme ou dans le creux, tu tombes en bas !
//
// Touches : R = retour au départ, ⌫ = changer de carte.

window.Circuit = window.Circuit || {};

Circuit.Balade = (function () {
  const C = Circuit.CONFIG;
  const P = C.parcours;
  const radio = Circuit.Evenements;

  // Le terrain : le parcours, ou le grand parcours (étape 40). Ils savent dire les mêmes choses.
  function terrain(monde) {
    if (monde.carte === "ciel") return Circuit.MegaRampes; // étape 41
    return monde.carte === "grand" ? Circuit.GrandParcours : Circuit.Parcours;
  }
  const depart = (T) => Object.assign({ x: 0, z: 0, y: 0, angle: 0 }, T.depart);
  const limite = (T) => T.limite || P.taille / 2 - 3;

  // Commence la balade (après le garage).
  function lancer(monde, voiture) {
    const T = terrain(monde);
    const d = depart(T);
    Object.assign(voiture, { x: d.x, z: d.z, angle: d.angle, y: d.y, vy: 0, vitesse: 0, enLAir: false, nitro: 0 });
    monde.phase = "balade";
    monde.voiture = voiture;
    monde.pieces = T.placerPieces();
    monde.cartons = T.placerCartons();
    monde.piecesCourse = 0;
    monde.cartonsCasses = 0;
    monde.pilesOuvertes = []; // les piles qui ont déjà donné leur pièce cachée
    monde.pilesTouchees = []; // les piles déjà défoncées (pour n'écrire qu'une ligne au journal par pile)
    monde.sol = "terre";
    monde.boucle = null; // le looping en cours : { looping, theta }
    monde.message = null; // { texte, jusqua } : un message au milieu de l'écran
    monde.saut = null; // le saut en cours : { debut, x, z, hauteurMax }
    monde.dernierSaut = null;
    monde.nitrosPris = 0; // étape 40
    monde.plaque = -1; // la plaque de nitro sous la voiture (−1 = aucune)
    monde.chutes = 0;
    monde.surQuoi = null;
    if (monde.carte === "ciel") radio.emettre("mega-rampes", { pieces: monde.pieces.length, nitros: T.nitros.length, longueur: T.longueur, drapeaux: T.drapeaux.length });
    else if (monde.carte === "grand") radio.emettre("grand-parcours", { pieces: monde.pieces.length, nitros: T.nitros.length, longueur: T.longueurTour });
    else radio.emettre("balade", { pieces: monde.pieces.length, cartons: monde.cartons.length });
  }

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2) };
  }

  function etape(monde, dt, intentions) {
    const v = monde.voiture;
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    const T = terrain(monde);
    if (intentions.recommencer) {
      const d = depart(T);
      Object.assign(v, { x: d.x, z: d.z, y: d.y, vy: 0, angle: d.angle, vitesse: 0, enLAir: false, nitro: 0 });
      monde.boucle = null;
      radio.emettre("retour-depart", {});
      return;
    }

    // 1. Le looping : la voiture est accrochée au rail.
    if (monde.boucle) {
      faireLeLooping(monde, dt);
    } else {
      Circuit.Voiture.avancer(v, intentions, dt, v.enLAir ? "air" : "terre", fiche.virage);
      // La clôture tout autour.
      const LIMITE = limite(T);
      if (Math.abs(v.x) > LIMITE || Math.abs(v.z) > LIMITE) {
        v.x = Math.max(-LIMITE, Math.min(LIMITE, v.x));
        v.z = Math.max(-LIMITE, Math.min(LIMITE, v.z));
        if (Math.abs(v.vitesse) > 2) radio.emettre("cloture", { vitesse: v.vitesse });
        v.vitesse = 0;
      }
      // 2. Les murs (côtés des plateaux, murs des tunnels…)
      const choc = T.murs(v, C.chocs.rayon);
      if (choc > 1) {
        if (!T.glisse) v.vitesse = -v.vitesse * 0.25; // étape 41 : sur les méga-rampes, le terrain s'en occupe
        radio.emettre("choc", { force: choc, vitesse: v.vitesse, contre: "mur" });
      }
      // 3. Monter, descendre, sauter
      sauter(monde, v, dt, fiche, T);
      // 4. Entrer dans un looping ?
      if (!v.enLAir) entrerDansUnLooping(monde, v, T);
      // 4 bis (étape 40). Une plaque de nitro sous les roues ?
      if (T.plaqueSous) nitro(monde, v, T);
    }

    // 5. Les cartons et les pièces
    cartons(monde, v, dt, fiche);
    ramasser(monde, v);
  }

  // LE SAUT (comme à l'étape 37 du plan) : on suit le sol, ou on vole.
  function sauter(monde, v, dt, fiche, T) {
    const info = T.sous ? T.sous(v.x, v.z, v.y) : { h: T.hauteurSol(v.x, v.z, v.y) };
    const sol = info.h;
    if (!v.enLAir) {
      if (sol >= v.y - 0.3) {
        v.vy = dt > 0 ? (sol - v.y) / dt : 0; // en montant (ou en descendant) une pente
        v.y = sol;
        monde.surQuoi = info; // étape 40 : sur quoi on roule (pour savoir d'où on s'envole)
      } else {
        // Le sol s'est dérobé : on s'envole ! Le monster truck saute plus haut (fiche.saut).
        v.enLAir = true;
        v.vy = Math.max(0, v.vy) * (fiche.saut || 1);
        monde.saut = { debut: monde.temps, x: v.x, z: v.z, hauteurMax: v.y, yDepart: v.y, troncon: monde.surQuoi ? monde.surQuoi.troncon : null };
        radio.emettre("decollage", { vitesse: v.vitesse, vy: v.vy, hauteur: v.y });
      }
      return;
    }
    v.vy -= P.gravite * dt;
    v.y += v.vy * dt;
    if (monde.saut) monde.saut.hauteurMax = Math.max(monde.saut.hauteurMax, v.y);
    if (v.y <= sol) {
      v.y = sol;
      v.vy = 0;
      v.enLAir = false;
      if (monde.saut) {
        const s = monde.saut;
        const distance = Math.hypot(v.x - s.x, v.z - s.z);
        monde.dernierSaut = { duree: monde.temps - s.debut, hauteurMax: s.hauteurMax, distance };
        radio.emettre("atterrissage", monde.dernierSaut);
        // Une CHUTE : on atterrit beaucoup plus bas, et pas sur la suite de la route (dans l'herbe, le creux,
        // ou sur une route plus basse). Un grand saut réussi, lui, retombe sur la suite de la route.
        const chute = s.yDepart - v.y;
        const ici = T.sous ? info : null;
        const n = T.troncons ? T.troncons.length : 1;
        const suite = ici && ici.troncon !== undefined && s.troncon !== null && s.troncon !== undefined && (ici.troncon - s.troncon + n) % n < 60;
        if (chute > 5 && !suite) {
          // Étape 40 : ✍️ tombé d'une route, d'une plateforme ou dans le creux… on est en bas !
          monde.chutes++;
          message(monde, "😵 Tu es tombé de " + Math.round(chute) + " m !", 2.5);
          radio.emettre("chute", { hauteur: chute, ou: T.sous ? T.sous(v.x, v.z, v.y).quoi : "le sol" });
        } else if (distance > 8) message(monde, "✈️ Saut de " + Math.round(distance) + " m !", 2);
        monde.saut = null;
      }
    }
  }

  // Étape 40 : LE NITRO. En roulant sur une plaque, la voiture reçoit une poussée de quelques secondes
  // (le calcul de la poussée est dans logique/voiture.js). On compte une plaque une seule fois par passage.
  function nitro(monde, v, T) {
    const plaque = v.enLAir ? -1 : T.plaqueSous(v);
    if (plaque >= 0) {
      if (plaque !== monde.plaque) {
        monde.nitrosPris++;
        radio.emettre("nitro", { plaque: plaque + 1, vitesse: v.vitesse, duree: C.nitro.duree });
      }
      v.nitro = C.nitro.duree;
    }
    monde.plaque = plaque;
  }

  // Le looping : on vérifie qu'on est à l'entrée, dans le bon sens, assez vite.
  function entrerDansUnLooping(monde, v, T) {
    for (const l of T.loopings) {
      const dx = v.x - l.x, dz = v.z - l.z;
      const avance = dx * l.dx + dz * l.dz, cote = dx * l.lx + dz * l.lz;
      if (Math.abs(avance) > 1.5 || Math.abs(cote) > 2.5) continue; // pas à l'entrée
      const sens = Math.cos(v.angle) * l.dx + Math.sin(v.angle) * l.dz;
      if (sens < 0.75 || v.vitesse <= 0) continue; // pas dans le bon sens
      if (monde.boucle === null && monde.temps - (monde.derniereEntree || -9) < 1) continue;
      monde.derniereEntree = monde.temps;
      if (v.vitesse < P.vitesseLooping) {
        message(monde, "🐢 Trop lent pour le looping : il faut " + Math.round(P.vitesseLooping * 3.6) + " km/h !", 2.5);
        radio.emettre("looping-trop-lent", { vitesse: v.vitesse, besoin: P.vitesseLooping });
        continue;
      }
      monde.boucle = { looping: l, theta: 0 };
      v.angle = l.angle; // on s'aligne sur le rail
      radio.emettre("looping-debut", { rayon: l.rayon, vitesse: v.vitesse });
      return;
    }
  }

  // Sur le rail du looping : θ avance de (vitesse × temps ÷ rayon) à chaque pas.
  function faireLeLooping(monde, dt) {
    const v = monde.voiture, b = monde.boucle, l = b.looping;
    b.theta += (v.vitesse * dt) / l.rayon;
    const fini = b.theta >= Math.PI * 2;
    const p = Circuit.Parcours.pointLooping(l, Math.min(b.theta, Math.PI * 2));
    v.x = p.x;
    v.y = p.y;
    v.z = p.z;
    v.tangage = fini ? 0 : b.theta; // la voiture tourne sur elle-même (la tête en bas à mi-chemin)
    v.rotationRoues += (v.vitesse * dt) / 0.38;
    if (fini) {
      monde.boucle = null;
      v.y = 0;
      v.tangage = 0;
      message(monde, "🎢 LOOPING !", 2);
      radio.emettre("looping-fini", { vitesse: v.vitesse });
    }
  }

  // Les cartons : on fonce dedans, ils volent.
  function cartons(monde, v, dt, fiche) {
    for (const c of monde.cartons) {
      if (c.vole) {
        // Un carton qui vole : la gravité, et il tourne sur lui-même. Au sol, il glisse et s'arrête.
        c.vy -= P.gravite * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.z += c.vz * dt;
        c.rotation += c.vrotation * dt;
        if (c.y < 0.6) {
          c.y = 0.6;
          c.vy = Math.abs(c.vy) > 3 ? -c.vy * 0.3 : 0; // petit rebond
          c.vx *= 0.8;
          c.vz *= 0.8;
          c.vrotation *= 0.8;
        }
        continue;
      }
      if (Math.abs(v.vitesse) < 2 || Math.abs(c.y - (v.y + 0.6)) > 1.6) continue;
      if (!Circuit.Chocs.toucheCercle(v, c.x, c.z, 0.7, C.chocs.rayon)) continue;
      // BOUM : le carton part dans la direction de la voiture, avec un bond vers le haut.
      const vx = Math.cos(v.angle) * v.vitesse, vz = Math.sin(v.angle) * v.vitesse;
      c.vole = true;
      c.vx = vx * (0.8 + Math.random() * 0.4) + (Math.random() - 0.5) * 6;
      c.vz = vz * (0.8 + Math.random() * 0.4) + (Math.random() - 0.5) * 6;
      c.vy = 4 + Math.random() * 6 + Math.abs(v.vitesse) * 0.15;
      c.vrotation = (Math.random() - 0.5) * 12;
      if (!fiche.ecrase) v.vitesse *= 0.92; // le monster truck, lui, écrase tout sans ralentir
      monde.cartonsCasses++;
      const pile = P.cartons[c.pile];
      const nouvellePile = !monde.pilesTouchees.includes(c.pile);
      if (nouvellePile) monde.pilesTouchees.push(c.pile);
      let piece = false;
      if (pile.piece && !monde.pilesOuvertes.includes(c.pile)) {
        // ✍️ Cette pile cachait une pièce : elle apparaît là où était la pile.
        monde.pilesOuvertes.push(c.pile);
        piece = true;
        monde.pieces.push({ numero: monde.pieces.length + 1, x: pile.x, y: 1.2, z: pile.z, ou: "carton", prise: false });
      }
      if (nouvellePile) radio.emettre("carton", { pile: c.pile + 1, vitesse: v.vitesse, piece }); // une fois par pile
    }
  }

  // Les pièces : il faut passer tout près, en x, en z ET en hauteur.
  function ramasser(monde, v) {
    for (const p of monde.pieces) {
      if (p.prise) continue;
      if (Math.hypot(p.x - v.x, p.z - v.z) > C.pieces.rayonRamassage) continue;
      if (Math.abs(p.y - (v.y + 0.8)) > 2.2) continue;
      p.prise = true;
      monde.piecesCourse++;
      radio.emettre("piece", { numero: p.numero, s: Math.round(Math.hypot(p.x, p.z)), total: monde.piecesCourse, ou: p.ou });
      if (monde.pieces.every((q) => q.prise)) {
        message(monde, "🏆 Toutes les pièces trouvées !", 4);
        radio.emettre("toutes-les-pieces", { total: monde.piecesCourse });
      }
    }
  }

  return { lancer, etape };
})();
