// 🛡️ LE CHAR : le pilote et le tireur (étape 60)
//
// Un tank, ce sont deux machines en une :
//   - la CAISSE, posée sur ses CHENILLES : elle avance, recule, et tourne sur place (une chenille avance, l'autre
//     recule : c'est comme ça qu'un tank pivote) ;
//   - la TOURELLE, qui tourne toute seule au-dessus de la caisse, avec le CANON qui monte et descend.
// Donc un tank peut rouler vers le nord en tirant vers l'est !
//
// La VISÉE ASSISTÉE : si un ennemi est presque devant le canon (à moins de 4°), le canon se règle tout seul :
// il tourne un tout petit peu vers lui, et il monte juste ce qu'il faut pour que l'obus, qui retombe en volant,
// arrive sur lui. La formule (pour un sol plat) : angle = ½ × arcsin(gravité × distance ÷ vitesse²).
//
// Ce fichier ne dessine rien. Il renvoie des événements (« tir », « arbre-ecrase »…) que le monde annonce à la radio.

window.Tanks = window.Tanks || {};

Tanks.Char = (function () {
  const C = Tanks.CONFIG, K = C.char, O = C.obus, T = Tanks.Terrain;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a)); // ramène un angle entre −π et π

  function creer(fiche, equipe, place, nom) {
    return {
      fiche, equipe, nom,
      x: place.x, z: place.z, y: T.hauteur(place.x, place.z), angle: place.angle,
      vitesse: 0, rotation: 0, // m/s, rad/s
      tourelle: 0, // l'angle de la tourelle PAR RAPPORT à la caisse
      hausse: 0, // l'angle du canon vers le haut
      vie: K.vie, vieMax: K.vie, soin: 0, recharge: 0, detruit: false, depuisDetruit: 0,
      chenilles: { gauche: 0, droite: 0 }, // m parcourus par chaque chenille (pour les faire défiler à l'écran)
      cible: null, // l'ennemi visé par la visée assistée (ou par l'ordinateur)
      touche: 0, // s depuis le dernier obus reçu (pour faire clignoter la barre de vie)
      tirs: 0, reussis: 0,
    };
  }

  // L'angle de la tourelle dans le monde (pas par rapport à la caisse).
  const angleTourelle = (c) => c.angle + c.tourelle;

  // La hausse qu'il faut pour toucher un point à la distance d et à dy mètres plus haut.
  function hausseVers(d, dy) {
    const g = O.gravite, v = O.vitesse;
    return Math.atan2(dy, d) + 0.5 * Math.asin(Math.min(1, (g * d) / (v * v)));
  }

  // Avancer d'un petit pas. intentions = { avancer, reculer, gauche, droite, tourelleGauche, tourelleDroite, tirer }
  // (pour l'ordinateur : viseAngle = l'angle du monde vers lequel tourner la tourelle).
  // tous = tous les tanks (pour la visée assistée). Renvoie une liste d'événements [nom, données].
  function avancer(c, intentions, dt, tous) {
    const ev = [];
    if (c.detruit) {
      c.depuisDetruit += dt;
      c.vitesse = 0;
      return ev;
    }
    const f = c.fiche;
    c.touche += dt;
    // 1. Les chenilles : avancer, reculer, freiner.
    if (intentions.avancer) c.vitesse = Math.min(f.vitesseMax, c.vitesse + (c.vitesse < 0 ? K.freinage : f.acceleration) * dt);
    else if (intentions.reculer) c.vitesse = Math.max(-K.marcheArriere, c.vitesse - (c.vitesse > 0 ? K.freinage : f.acceleration) * dt);
    else c.vitesse -= Math.sign(c.vitesse) * Math.min(Math.abs(c.vitesse), K.ralentissement * dt);
    // la pente : en montée, la gravité freine ; en descente, elle pousse
    const avant = { x: Math.cos(c.angle), z: Math.sin(c.angle) };
    const pente = (T.hauteur(c.x + avant.x * 2, c.z + avant.z * 2) - T.hauteur(c.x - avant.x * 2, c.z - avant.z * 2)) / 4;
    c.vitesse -= pente * 9.8 * 0.5 * dt;
    // 2. Tourner sur place (plus lentement quand on va vite)
    const sens = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    c.rotation = sens * f.rotation * (1 - 0.35 * Math.min(1, Math.abs(c.vitesse) / f.vitesseMax)) * (c.vitesse < -0.5 ? -1 : 1);
    c.angle = angleEntre(c.angle + c.rotation * dt);
    c.x += avant.x * c.vitesse * dt;
    c.z += avant.z * c.vitesse * dt;
    // les chenilles défilent : en tournant, l'une va plus vite que l'autre
    const demiLargeur = f.largeur / 2;
    c.chenilles.gauche += (c.vitesse - c.rotation * demiLargeur) * dt;
    c.chenilles.droite += (c.vitesse + c.rotation * demiLargeur) * dt;
    // 3. Ne pas sortir du champ de bataille, ne pas traverser les maisons.
    const lim = T.demi - C.monde.bord;
    c.x = Math.max(-lim, Math.min(lim, c.x));
    c.z = Math.max(-lim, Math.min(lim, c.z));
    if (T.repousser(c, K.rayon * 0.8)) c.vitesse *= 0.9;
    // 4. Écraser les arbres (à plus de 9 km/h) ; sinon, l'arbre arrête le tank.
    for (const a of T.arbres) {
      if (a.ecrase || Math.abs(a.x - c.x) > 5 || Math.abs(a.z - c.z) > 5) continue;
      const d = Math.hypot(a.x - c.x, a.z - c.z);
      if (d > K.rayon * 0.75 + a.r) continue;
      if (Math.abs(c.vitesse) > K.ecraserArbre) {
        a.ecrase = true;
        a.angleChute = Math.atan2(a.z - c.z, a.x - c.x);
        ev.push(["arbre-ecrase", { nom: c.nom, vitesse: c.vitesse }]);
      } else {
        c.x -= ((a.x - c.x) / d) * (K.rayon * 0.75 + a.r - d);
        c.z -= ((a.z - c.z) / d) * (K.rayon * 0.75 + a.r - d);
        c.vitesse *= 0.5;
      }
    }
    c.y = T.hauteur(c.x, c.z);
    // 5. La tourelle : les touches (le joueur), ou viser un angle (l'ordinateur).
    let vise = null;
    if (intentions.viseAngle !== undefined) {
      const diff = angleEntre(intentions.viseAngle - angleTourelle(c));
      c.tourelle = angleEntre(c.tourelle + Math.max(-f.tourelle * dt, Math.min(f.tourelle * dt, diff)));
      vise = intentions.cible || null;
    } else {
      const t = (intentions.tourelleDroite ? 1 : 0) - (intentions.tourelleGauche ? 1 : 0);
      c.tourelle = angleEntre(c.tourelle + t * f.tourelle * dt);
      // la visée assistée : l'ennemi vivant le plus proche dans le cône de 4° devant le canon
      let meilleur = null;
      for (const o of tous) {
        if (o.equipe === c.equipe || o.detruit) continue;
        const d = Math.hypot(o.x - c.x, o.z - c.z);
        if (d > O.porteeAssistee) continue;
        const ecart = Math.abs(angleEntre(Math.atan2(o.z - c.z, o.x - c.x) - angleTourelle(c)));
        if (ecart < O.viseeAssistee && (!meilleur || ecart < meilleur.ecart)) meilleur = { o, ecart };
      }
      vise = meilleur ? meilleur.o : null;
    }
    c.cible = vise;
    // le canon monte juste ce qu'il faut pour la cible (sans cible : pour 150 m devant, sur un sol plat)
    const yCanon = c.y + C.char.hauteurCanon;
    const d = vise ? Math.hypot(vise.x - c.x, vise.z - c.z) : K.porteeReticule;
    const dy = vise ? vise.y + 1.4 - yCanon : -C.char.hauteurCanon + 1;
    const voulue = Math.max(K.hausseMin, Math.min(K.hausseMax, hausseVers(d, dy)));
    c.hausse += Math.max(-0.4 * dt, Math.min(0.4 * dt, voulue - c.hausse));
    // 6. Recharger et tirer
    if (c.recharge > 0) {
      c.recharge = Math.max(0, c.recharge - dt);
      if (c.recharge === 0) ev.push(["recharge", { nom: c.nom }]);
    }
    if (intentions.tirer && c.recharge === 0) {
      c.recharge = intentions.recharge || f.recharge;
      c.tirs++;
      ev.push(["tir", { tireur: c, assiste: !!vise && intentions.viseAngle === undefined, cible: vise ? vise.nom : null, distance: Math.round(d) }]);
    }
    return ev;
  }

  // Le bout du canon (d'où part l'obus), et la direction du tir.
  function boucheDuCanon(c) {
    const a = angleTourelle(c) + (c.erreurTir || 0), h = c.hausse;
    const dir = { x: Math.cos(a) * Math.cos(h), y: Math.sin(h), z: Math.sin(a) * Math.cos(h) };
    const L = c.fiche.canon * 0.75 + 1.2;
    return { x: c.x + dir.x * L, y: c.y + C.char.hauteurCanon + dir.y * L, z: c.z + dir.z * L, dir };
  }

  // Les tanks se poussent quand ils se touchent (deux cercles), et les épaves aussi sont solides.
  function chocs(tous) {
    for (let i = 0; i < tous.length; i++) {
      for (let j = i + 1; j < tous.length; j++) {
        const a = tous[i], b = tous[j], dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = K.rayon * 1.6;
        if (d >= min || d < 1e-6) continue;
        const p = (min - d) / 2, nx = dx / d, nz = dz / d;
        const ka = a.detruit ? 0 : b.detruit ? 2 : 1, kb = b.detruit ? 0 : a.detruit ? 2 : 1;
        a.x -= nx * p * ka;
        a.z -= nz * p * ka;
        b.x += nx * p * kb;
        b.z += nz * p * kb;
        a.vitesse *= 0.95;
        b.vitesse *= 0.95;
      }
    }
  }

  return { creer, avancer, boucheDuCanon, chocs, angleTourelle, hausseVers, angleEntre };
})();
