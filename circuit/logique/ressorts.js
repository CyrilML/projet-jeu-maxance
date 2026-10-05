// 🌀 LES RESSORTS : le rebond du monster truck (étape 49)
//
// ✍️ Maxance veut un monster truck avec des ressorts qui le font rebondir un peu sur les bosses.
//
// Un ressort, c'est une règle toute simple (la « loi de Hooke ») : plus on l'écrase, plus il pousse fort pour
// reprendre sa place. On ajoute un AMORTISSEUR, qui freine le mouvement : sans lui, ça rebondirait pour toujours.
//
//   - Quand les roues montent d'un coup (une bosse, l'arrivée d'un saut), la caisse, elle, est lourde : elle
//     continue sur sa lancée (c'est « l'inertie »). Le ressort s'ÉCRASE.
//   - Le ressort repousse la caisse vers le haut… elle dépasse, redescend, remonte un peu moins… : elle REBONDIT.
//
// Chaque petit pas (1/120 s) :
//     poussée du ressort = − raideur × écrasement − amortissement × vitesse de la caisse
// On ne touche qu'à la CAISSE : la voiture, elle, roule exactement pareil. Ce fichier ne dessine rien
// (affichage/scene3d.js lit v.suspension pour faire monter et descendre la caisse et étirer les ressorts).
// Les nombres sont dans config.js (ressorts).

window.Circuit = window.Circuit || {};

Circuit.Ressorts = (function () {
  const R = Circuit.CONFIG.ressorts;
  // (Étape 51 : toutes les voitures ont des ressorts ; le monster truck a les siens, très mous.)
  const radio = Circuit.Evenements;

  // Un ressort et son amortisseur, vers une valeur visée : renvoie la nouvelle vitesse.
  function ressort(etat, cle, vise, p, dt) {
    etat[cle + "V"] += (p.raideur * (vise - etat[cle]) - p.amortissement * etat[cle + "V"]) * dt;
    etat[cle] += etat[cle + "V"] * dt;
  }

  function etape(v, dt) {
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    if (fiche.vol) {
      v.suspension = null; // (les avions et l'hélico n'ont pas de suspension)
      return;
    }
    const p = fiche.ressorts ? R.monster : R.voiture;
    const y = v.y || 0;
    const s = v.suspension || (v.suspension = { ecrase: 0, vitesse: 0, yAvant: y, vyAvant: 0, dernierChoc: 0,
      tangage: 0, tangageV: 0, roulis: 0, roulisV: 0, vAvant: v.vitesse || 0, angleAvant: v.angle || 0 });
    // 1. Le rebond : la vitesse verticale des roues (mesurée avec la hauteur) et son changement depuis le pas d'avant.
    const vyRoues = (y - s.yAvant) / dt;
    let choc = vyRoues - s.vyAvant;
    if (Math.abs(vyRoues) > 40 || Math.abs(choc) > 30) choc = 0; // un « saut » de position (la voiture remise au départ) : ce n'est pas une bosse
    if (v.enLAir) choc = 0; // en l'air, toute la voiture tombe ensemble : le ressort ne bouge pas (il se rattrape à l'atterrissage)
    s.yAvant = y;
    s.vyAvant = Math.abs(vyRoues) > 40 ? 0 : vyRoues;
    // Les roues montent d'un coup → la caisse descend par rapport à elles (le ressort s'écrase).
    s.vitesse -= choc * p.transmission;
    s.depuisChoc = (s.depuisChoc || 0) + dt;
    if (choc > R.gros && s.depuisChoc > 0.5) { // (un atterrissage dure 2 ou 3 petits pas : on ne l'écrit qu'une fois)
      s.dernierChoc = choc;
      s.depuisChoc = 0;
      radio.emettre("ressorts", { choc, nom: fiche.nom });
    }
    // La loi du ressort, et l'amortisseur.
    s.vitesse += (-p.raideur * s.ecrase - p.amortissement * s.vitesse) * dt;
    s.ecrase += s.vitesse * dt;
    // La butée : un ressort ne s'écrase pas à l'infini.
    if (Math.abs(s.ecrase) > p.course) {
      s.ecrase = Math.sign(s.ecrase) * p.course;
      s.vitesse *= -0.3;
    }
    // 2. (Étape 51) La caisse PENCHE. L'accélération en avant (ou le freinage), et l'accélération sur le côté dans
    // un virage (vitesse × vitesse à laquelle on tourne). La caisse vise un angle, et un ressort l'y amène en douceur.
    const vitesse = v.vitesse || 0;
    let tourne = (v.angle || 0) - s.angleAvant;
    tourne = Math.atan2(Math.sin(tourne), Math.cos(tourne));
    const enAvant = Math.max(-30, Math.min(30, (vitesse - s.vAvant) / dt));
    const surLeCote = Math.max(-30, Math.min(30, (vitesse * tourne) / dt));
    s.vAvant = vitesse;
    s.angleAvant = v.angle || 0;
    s.accelerationAvant = enAvant;
    s.accelerationCote = surLeCote;
    const borne = (a) => Math.max(-R.penteMax, Math.min(R.penteMax, a));
    ressort(s, "tangage", v.enLAir ? 0 : borne(enAvant * R.tangage), p, dt); // on accélère : le nez se lève
    ressort(s, "roulis", v.enLAir ? 0 : borne(-surLeCote * R.roulis), p, dt); // on tourne : la caisse penche vers l'extérieur
  }

  return { etape };
})();
