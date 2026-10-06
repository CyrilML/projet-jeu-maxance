// 🤖 L'ORDINATEUR : le chef de char des autres tanks (étape 60)
//
// Les 3 alliés et les 4 ennemis sont conduits par ce petit cerveau. Il fabrique les mêmes INTENTIONS que toi
// (avancer, tourner, tirer), avec la même machine (logique/char.js). Toutes les 4 secondes, il choisit sa CIBLE :
// l'ennemi vivant le plus proche (en préférant celui qu'il VOIT). Puis :
//   1. il ROULE vers un point à 90 m de sa cible (assez près pour toucher, assez loin pour avoir le temps de bouger),
//      en se poussant loin des maisons, des arbres et des autres tanks (comme des aimants qui se repoussent) ;
//   2. il TOURNE sa tourelle vers la cible, avec une petite erreur (sinon il ne raterait jamais) ;
//   3. il TIRE quand le canon est presque aligné (2,3°), que la cible est à moins de 380 m, qu'il la VOIT (ligne de vue
//      libre) et que son obus est rechargé (3,2 s : plus lent que toi) ;
//   4. touché, il fait un ÉCART sur le côté pendant 2,5 s ;
//   5. s'il ne VOIT plus sa cible depuis 3 s (une maison entre eux), il la CONTOURNE par le côté.

window.Tanks = window.Tanks || {};

Tanks.IA = (function () {
  const C = Tanks.CONFIG, I = C.ia, T = Tanks.Terrain, Ch = Tanks.Char;
  let etat = 60;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  function preparer(c) {
    c.ia = { cible: null, prochainChoix: hasard() * 1.5, erreur: 0, esquive: 0, sensEsquive: 1, etat: "cherche", voit: false, vieAvant: c.vie, sansVue: 0, cote: hasard() < 0.5 ? -1 : 1 };
  }

  function choisirCible(c, tous) {
    let meilleur = null, score = Infinity;
    for (const o of tous) {
      if (o.equipe === c.equipe || o.detruit) continue;
      const d = Math.hypot(o.x - c.x, o.z - c.z);
      const voit = T.vueLibre(c.x, c.y + 2.4, c.z, o.x, o.y + 1.5, o.z);
      const s = d * (voit ? 1 : 1.8);
      if (s < score) (score = s), (meilleur = o);
    }
    return meilleur;
  }

  // Les intentions de ce tank pour ce pas de temps.
  function decider(c, tous, dt) {
    const ia = c.ia;
    if (c.detruit) return {};
    ia.prochainChoix -= dt;
    if (!ia.cible || ia.cible.detruit || ia.prochainChoix <= 0) {
      ia.cible = choisirCible(c, tous);
      ia.prochainChoix = I.changeDeCible;
      ia.erreur = (hasard() * 2 - 1) * I.erreur * 2;
    }
    // Touché ? On fait un écart.
    if (c.vie < ia.vieAvant) {
      ia.esquive = I.esquive;
      ia.sensEsquive = hasard() < 0.5 ? -1 : 1;
    }
    ia.vieAvant = c.vie;
    if (ia.esquive > 0) ia.esquive -= dt;
    const cible = ia.cible;
    if (!cible) {
      ia.etat = "attend";
      return {};
    }
    const dx = cible.x - c.x, dz = cible.z - c.z, d = Math.hypot(dx, dz);
    const versCible = Math.atan2(dz, dx);
    // 1. Où aller ? Un point à 110 m de la cible (ou un écart sur le côté, si on vient d'être touché).
    let gx, gz;
    if (ia.esquive > 0) {
      gx = Math.cos(c.angle + ia.sensEsquive * Math.PI / 2) * 30;
      gz = Math.sin(c.angle + ia.sensEsquive * Math.PI / 2) * 30;
      ia.etat = "esquive";
    } else if (ia.sansVue > I.contourner) {
      // il ne voit plus sa cible depuis un moment (une maison, une colline entre les deux) : il la CONTOURNE
      // (il fonce vers un point à côté d'elle, sur le flanc)
      gx = dx + Math.cos(versCible + ia.cote * Math.PI / 2) * 50;
      gz = dz + Math.sin(versCible + ia.cote * Math.PI / 2) * 50;
      ia.etat = "contourne";
    } else if (d > I.distanceCombat + 15) {
      gx = dx * (1 - I.distanceCombat / d);
      gz = dz * (1 - I.distanceCombat / d);
      ia.etat = "s'approche";
    } else if (d < I.distanceCombat - 40) {
      gx = -dx;
      gz = -dz;
      ia.etat = "recule";
    } else {
      gx = gz = 0;
      ia.etat = "combat";
    }
    // les « aimants » qui repoussent : les maisons, les murets, les arbres, les autres tanks
    let rx = 0, rz = 0;
    const repousse = (ox, oz, rayon, force) => {
      const ex = c.x - ox, ez = c.z - oz, e = Math.hypot(ex, ez);
      if (e < rayon && e > 0.01) {
        rx += (ex / e) * force * (1 - e / rayon);
        rz += (ez / e) * force * (1 - e / rayon);
      }
    };
    for (const b of T.boites) if (Math.abs(b.x - c.x) < 30 && Math.abs(b.z - c.z) < 30) repousse(b.x, b.z, Math.max(b.demiL, b.demiP) + I.regardObstacles * 0.6, 60);
    for (const a of T.arbres) if (!a.ecrase && Math.abs(a.x - c.x) < 10 && Math.abs(a.z - c.z) < 10) repousse(a.x, a.z, 8, 15);
    for (const o of tous) if (o !== c) repousse(o.x, o.z, 14, 40);
    const vx = gx + rx, vz = gz + rz, envie = Math.hypot(vx, vz);
    const intentions = {};
    if (envie > 8) {
      const diff = Ch.angleEntre(Math.atan2(vz, vx) - c.angle);
      intentions.gauche = diff < -0.1;
      intentions.droite = diff > 0.1;
      if (Math.abs(diff) < 1.2) intentions.avancer = true;
      else if (Math.abs(diff) > 2.6 && envie < 40) intentions.reculer = true;
    }
    // 2. La tourelle vers la cible (avec la petite erreur de visée)
    intentions.viseAngle = versCible + ia.erreur;
    intentions.cible = cible;
    intentions.recharge = I.recharge;
    // 3. Tirer ?
    const aligne = Math.abs(Ch.angleEntre(intentions.viseAngle - Ch.angleTourelle(c))) < I.alignement;
    ia.voit = d < I.portee && T.vueLibre(c.x, c.y + 2.4, c.z, cible.x, cible.y + 1.5, cible.z);
    ia.sansVue = ia.voit ? 0 : ia.sansVue + dt;
    if (aligne && ia.voit && c.recharge === 0) {
      intentions.tirer = true;
      ia.etat = "tire !";
      ia.erreur = (hasard() * 2 - 1) * I.erreur * 2; // (le prochain tir aura une autre petite erreur)
    }
    return intentions;
  }

  return { preparer, decider };
})();
