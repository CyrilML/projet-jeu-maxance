// ✈️ LE VOL : le moniteur de pilotage
//
// Étape 44. ✍️ On peut piloter ce qui vole : le petit avion, l'avion de ligne, l'avion de chasse et l'hélicoptère.
// Pilotage simple (choix de Maxance) :
//   - AVION : ↑ ↓ = les gaz (accélérer, ralentir) ; ← → = tourner ; Z (ou Espace) = monter ; S (ou Maj) = descendre.
//     Pour DÉCOLLER, il faut rouler sur la piste jusqu'à la « vitesse de décollage », puis monter (Z).
//     En l'air, un avion trop lent DÉCROCHE : ses ailes ne le portent plus, il tombe (la gravité) !
//   - HÉLICO : Z (ou Espace) = monter, S (ou Maj) = descendre ; ↑ ↓ = avancer, reculer ; ← → = tourner sur place.
//     L'hélico peut rester immobile en l'air (le « vol stationnaire »).
//
// ATTERRIR : toucher le sol doucement (moins de 7 m/s vers le bas), sur la terre. Plus fort, ou dans la mer,
// ou contre un immeuble : c'est le CRASH. Le pilote se retrouve à pied devant l'aérogare la plus proche,
// et l'appareil retourne à sa place (on dit qu'il « réapparaît »).
//
// ✍️ L'avion de ligne : le poser sur la piste d'un AUTRE aéroport rapporte des pièces.
//
// Les nombres de chaque appareil sont dans config.js (vehiculesAir) ; ceux du vol dans config.js (vol).

window.Circuit = window.Circuit || {};

Circuit.Vol = (function () {
  const C = Circuit.CONFIG;
  const VOL = C.vol;
  const AR = Circuit.Archipel;
  const radio = Circuit.Evenements;

  const fiche = (v) => Circuit.Garage.ficheDe(v.modele) || {};
  const estVolant = (v) => !!fiche(v).vol;

  function message(monde, texte, duree) {
    monde.message = { texte, jusqua: monde.temps + (duree || 2.5) };
  }

  // Le sol sous l'appareil : la terre (ou un pont), ou la mer.
  function solSous(x, z) {
    return AR.lieu(x, z);
  }

  // Est-on dans un immeuble ou un bâtiment de l'aéroport (en dessous de son toit) ?
  function dansUnBatiment(v) {
    for (const b of Circuit.Ville.immeubles.concat(AR.solides)) {
      if (Math.abs(v.x - b.x) > b.demiLongueur + 30 || Math.abs(v.z - b.z) > b.demiLargeur + 30) continue;
      const c = Math.cos(b.angle || 0), s = Math.sin(b.angle || 0), dx = v.x - b.x, dz = v.z - b.z;
      const u = dx * c + dz * s, w = -dx * s + dz * c;
      if (Math.abs(u) < b.demiLongueur + 1 && Math.abs(w) < b.demiLargeur + 1 && v.y < (b.hauteur || 10)) return b.nom || "un immeuble";
    }
    return null;
  }

  // Un pas de vol (ou de roulage sur la piste).
  function avancer(monde, v, dt, intentions) {
    const f = fiche(v);
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    const sol = solSous(v.x, v.z);
    v.rotationRoues += (f.vol === "helico" ? (v.enVol || intentions.volMonter ? 30 : 4) : 2 + Math.abs(v.vitesse) * 0.6) * dt; // le rotor, l'hélice
    if (!v.enVol) {
      auSol(monde, v, f, dt, intentions, direction, sol);
      return;
    }
    if (f.vol === "helico") voleHelico(v, f, dt, intentions, direction);
    else voleAvion(monde, v, f, dt, intentions, direction);
    v.y = Math.min(VOL.altitudeMax, v.y + v.vy * dt);
    v.x += Math.cos(v.angle) * v.vitesse * dt;
    v.z += Math.sin(v.angle) * v.vitesse * dt;
    // Étape 47 : le vent pousse les avions et les hélicos.
    if (Circuit.Meteo) {
      const vent = Circuit.Meteo.vent(), k = C.meteo.effetVentAvion * dt;
      v.x += vent.x * k;
      v.z += vent.z * k;
    }
    v.distance += Math.abs(v.vitesse) * dt;
    toucherLeSol(monde, v, f);
  }

  // Au sol : l'avion roule (comme une voiture lente à tourner), l'hélico attend.
  function auSol(monde, v, f, dt, intentions, direction, sol) {
    v.vy = 0;
    v.roulis = 0;
    v.tangage = 0;
    if (f.vol === "helico") {
      v.vitesse = 0;
      if (intentions.volMonter) decoller(monde, v, f);
      return;
    }
    const avant = { x: v.x, z: v.z };
    if (intentions.gaz) v.vitesse = Math.min(f.vitesseMax, v.vitesse + f.acceleration * dt);
    else if (intentions.freinVol) v.vitesse = Math.max(-3, v.vitesse - f.acceleration * 2 * dt);
    else v.vitesse -= Math.sign(v.vitesse) * Math.min(Math.abs(v.vitesse), 2 * dt);
    v.angle += direction * Math.min(1, Math.abs(v.vitesse) / 8) * Math.sign(v.vitesse || 1) * Math.max(0.35, f.virage) * dt;
    v.x += Math.cos(v.angle) * v.vitesse * dt;
    v.z += Math.sin(v.angle) * v.vitesse * dt;
    v.distance += Math.abs(v.vitesse) * dt;
    v.pedale = intentions.gaz ? "gaz" : intentions.freinVol ? "frein" : "aucune";
    AR.garderSurTerre(v, avant.x, avant.z, dt);
    if (Math.max(Circuit.Ville.murs(v, 2), AR.murs(v, 2)) > 1) v.vitesse = -v.vitesse * 0.2;
    if (intentions.volMonter) {
      if (v.vitesse >= f.decollage) decoller(monde, v, f);
      else if (monde.temps - (monde.dernierConseil || -9) > 3) {
        monde.dernierConseil = monde.temps;
        message(monde, "🛫 Trop lent pour décoller : il faut " + Math.round(f.decollage * 3.6) + " km/h (↑ pour accélérer)", 2.5);
      }
    }
  }

  function decoller(monde, v, f) {
    v.enVol = true;
    v.vy = f.montee * 0.6;
    v.decroche = false;
    v.aeroportDepart = AR.aeroportProche(v.x, v.z).numero;
    radio.emettre("decollage-avion", { voiture: f.nom, vitesse: v.vitesse, aeroport: AR.aeroportProche(v.x, v.z).nom });
    message(monde, f.vol === "helico" ? "🚁 Décollage !" : "🛫 Décollage ! Z/S pour monter et descendre", 2.5);
  }

  function voleAvion(monde, v, f, dt, intentions, direction) {
    if (intentions.gaz) v.vitesse = Math.min(f.vitesseMax, v.vitesse + f.acceleration * dt);
    else if (intentions.freinVol) v.vitesse = Math.max(0, v.vitesse - f.acceleration * dt);
    v.pedale = intentions.gaz ? "gaz" : intentions.freinVol ? "frein" : "aucune";
    // Le décrochage : en dessous de 75 % de la vitesse de décollage, les ailes ne portent plus.
    const decroche = v.vitesse < f.decollage * 0.75;
    if (decroche && !v.decroche) {
      radio.emettre("decrochage", { vitesse: v.vitesse, besoin: f.decollage * 0.75 });
      message(monde, "⚠️ DÉCROCHAGE ! Accélère (↑) !", 2);
    }
    v.decroche = decroche;
    if (decroche) {
      v.vy -= VOL.gravite * dt;
    } else {
      const voulu = intentions.volMonter ? f.montee : intentions.volDescendre ? -f.montee : 0;
      v.vy += (voulu - v.vy) * Math.min(1, 2 * dt);
    }
    v.angle += direction * f.virage * dt;
    v.roulis = (v.roulis || 0) + (direction * 0.7 - (v.roulis || 0)) * Math.min(1, 3 * dt); // l'avion penche dans le virage
    v.tangage = Math.atan2(v.vy, Math.max(1, v.vitesse));
  }

  function voleHelico(v, f, dt, intentions, direction) {
    if (intentions.gaz) v.vitesse = Math.min(f.vitesseMax, v.vitesse + f.acceleration * dt);
    else if (intentions.freinVol) v.vitesse = Math.max(-10, v.vitesse - f.acceleration * dt);
    else v.vitesse *= Math.max(0, 1 - 0.8 * dt); // l'hélico freine tout seul : il peut rester sur place
    v.pedale = intentions.gaz ? "en avant" : intentions.freinVol ? "en arrière" : "sur place";
    const voulu = intentions.volMonter ? f.montee : intentions.volDescendre ? -f.montee : 0;
    v.vy += (voulu - v.vy) * Math.min(1, 3 * dt);
    v.angle += direction * f.virage * dt;
    v.roulis = (v.roulis || 0) + (direction * 0.2 - (v.roulis || 0)) * Math.min(1, 3 * dt);
    v.tangage = -0.25 * (v.vitesse / f.vitesseMax); // il penche le nez pour avancer
  }

  // Le sol, la mer, un immeuble : atterrir ou s'écraser ?
  function toucherLeSol(monde, v, f) {
    const sol = solSous(v.x, v.z);
    const batiment = dansUnBatiment(v);
    if (batiment) return crash(monde, v, f, "contre " + batiment);
    if (v.y > sol.h) return;
    if (!sol.terre) return crash(monde, v, f, "dans la mer");
    if (v.vy < -VOL.atterrissageDoux) return crash(monde, v, f, "trop fort sur le sol (" + Math.round(-v.vy) + " m/s vers le bas)");
    // Atterrissage réussi !
    v.y = sol.h;
    v.vy = 0;
    v.enVol = false;
    v.roulis = v.tangage = 0;
    const piste = AR.surPiste(v.x, v.z);
    radio.emettre("atterrissage-avion", { voiture: f.nom, piste: piste ? piste.nom : null });
    if (f.ligne && piste && piste.numero !== v.aeroportDepart) {
      // ✍️ Un vrai vol de ligne : d'un aéroport à un autre.
      const depart = AR.aeroports.find((a) => a.numero === v.aeroportDepart);
      radio.emettre("vol-ligne", { de: depart ? depart.nom : "?", a: piste.nom, montant: VOL.paieVolDeLigne });
      message(monde, "✈️ Vol réussi jusqu'à " + piste.nom + " ! +" + VOL.paieVolDeLigne + " pièces", 4);
    } else {
      message(monde, piste ? "🛬 Atterrissage sur la piste de " + piste.nom + " !" : "🛬 Posé !", 2.5);
    }
  }

  function crash(monde, v, f, raison) {
    radio.emettre("crash", { voiture: f.nom, raison });
    radio.emettre("explosion", { sorte: "crash", nom: f.nom, x: v.x, y: Math.max(v.y, 0), z: v.z });
    message(monde, "💥 Crash " + raison + " !", 3.5);
    // Le pilote se retrouve à pied devant l'aérogare la plus proche ; l'appareil retourne à sa place.
    const ap = AR.aeroportProche(v.x, v.z);
    monde.pieton = { x: ap.porte.x, z: ap.porte.z, angle: ap.angle - Math.PI / 2, vitesse: 0, pas: 0, y: 0 };
    reparer(v);
  }

  // Remet un appareil à sa place de parking, au sol.
  function reparer(v) {
    const p = v.parking || { x: v.x, z: v.z, angle: v.angle };
    Object.assign(v, { x: p.x, z: p.z, angle: p.angle, y: 0, vy: 0, vitesse: 0, enVol: false, roulis: 0, tangage: 0, decroche: false });
  }

  return { avancer, estVolant, reparer };
})();
