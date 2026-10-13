// 🧑‍✈️ LES PILOTES : les autres concurrents du rallye
//
// Étape 54. Une dizaine de véhicules (4x4, buggys, motos, camion) roulent tout seuls sur la piste. Chaque pilote :
//   - regarde un point de la piste 18 m DEVANT lui (comme un vrai pilote regarde loin devant, pas ses roues) ;
//   - tourne le volant vers ce point (s'il est à gauche : à gauche ; à droite : à droite) ;
//   - accélère jusqu'à SA vitesse (chacun a la sienne), et freine dans les virages serrés.
// Ils utilisent exactement les mêmes règles que toi (logique/vehicule.js) : le sable et la boue les ralentissent aussi.
// Étape 72 : un pilote LOIN de toi (plus de 250 m) n'est calculé qu'un pas sur 4, avec un pas 4 fois plus long. Comme un
// professeur qui surveille de près les élèves du premier rang, et ne jette un œil au fond de la classe que de temps en
// temps : le pilote roule pareil, et l'ordinateur travaille beaucoup moins.

window.Raid = window.Raid || {};

Raid.Pilotes = (function () {
  const C = Raid.CONFIG, P = C.pilotes, T = Raid.Terrain;

  function creer(hasard, depart) {
    const pilotes = [];
    const n = T.piste.length;
    for (let k = 0; k < P.nombre; k++) {
      const fiche = C.vehicules[k % C.vehicules.length];
      const i = (depart + 30 + Math.floor((k + 1) * (n / (P.nombre + 1)))) % n;
      const p = T.piste[i];
      const cote = (hasard() - 0.5) * 3;
      const v = Raid.Vehicule.creer(fiche, p.x - Math.sin(p.angle) * cote, p.z + Math.cos(p.angle) * cote, p.angle);
      pilotes.push({ v, point: i, allure: P.vitesse[0] + hasard() * (P.vitesse[1] - P.vitesse[0]), cote, loin: false, enRetard: 0, tour: k % P.pasLoin });
    }
    return pilotes;
  }

  // joueur : ton véhicule (pour savoir quels pilotes sont loin). Renvoie aussi combien de pilotes ont été calculés.
  function etape(pilotes, dt, joueur) {
    const n = T.piste.length, evenements = [];
    let calcules = 0;
    for (const pi of pilotes) {
      const v = pi.v;
      pi.loin = !!joueur && Math.abs(v.x - joueur.x) + Math.abs(v.z - joueur.z) > P.distanceLoin;
      pi.enRetard += dt;
      // Loin : on attend son tour (les pilotes loin ne sont pas tous calculés au même pas, pour étaler le travail).
      pi.tour = (pi.tour + 1) % P.pasLoin;
      if (pi.loin && pi.tour !== 0) continue;
      const pas = pi.enRetard;
      pi.enRetard = 0;
      calcules++;
      // Avancer son repère sur la piste (le point de piste le plus proche, en allant toujours vers l'avant).
      for (let k = 0; k < 8; k++) {
        const a = T.piste[pi.point], b = T.piste[(pi.point + 1) % n];
        if (Math.hypot(b.x - v.x, b.z - v.z) < Math.hypot(a.x - v.x, a.z - v.z)) pi.point = (pi.point + 1) % n;
        else break;
      }
      const cible = T.piste[(pi.point + Math.round(P.regardDevant / 3)) % n];
      const cx = cible.x - Math.sin(cible.angle) * pi.cote, cz = cible.z + Math.cos(cible.angle) * pi.cote;
      let diff = Math.atan2(cz - v.z, cx - v.x) - v.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const voulue = v.fiche.vitesseMax * pi.allure * (Math.abs(diff) > 0.35 ? 0.6 : 1);
      const intentions = { accelerer: v.vitesse < voulue, freiner: v.vitesse > voulue + 4, gauche: diff < -0.04, droite: diff > 0.04 };
      for (const e of Raid.Vehicule.avancer(v, intentions, pas)) evenements.push(e);
    }
    evenements.calcules = calcules;
    return evenements;
  }

  return { creer, etape };
})();
