// 🧑‍✈️ LES PILOTES : les autres concurrents du rallye
//
// Étape 54. Une dizaine de véhicules (4x4, buggys, motos, camion) roulent tout seuls sur la piste. Chaque pilote :
//   - regarde un point de la piste 18 m DEVANT lui (comme un vrai pilote regarde loin devant, pas ses roues) ;
//   - tourne le volant vers ce point (s'il est à gauche : à gauche ; à droite : à droite) ;
//   - accélère jusqu'à SA vitesse (chacun a la sienne), et freine dans les virages serrés.
// Ils utilisent exactement les mêmes règles que toi (logique/vehicule.js) : le sable et la boue les ralentissent aussi.

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
      pilotes.push({ v, point: i, allure: P.vitesse[0] + hasard() * (P.vitesse[1] - P.vitesse[0]), cote });
    }
    return pilotes;
  }

  function etape(pilotes, dt) {
    const n = T.piste.length, evenements = [];
    for (const pi of pilotes) {
      const v = pi.v;
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
      for (const e of Raid.Vehicule.avancer(v, intentions, dt)) evenements.push(e);
    }
    return evenements;
  }

  return { creer, etape };
})();
