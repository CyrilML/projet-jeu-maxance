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
  const radio = Circuit.Evenements;

  function etape(v, dt) {
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    if (!fiche.ressorts) {
      v.suspension = null;
      return;
    }
    const y = v.y || 0;
    const s = v.suspension || (v.suspension = { ecrase: 0, vitesse: 0, yAvant: y, vyAvant: 0, dernierChoc: 0 });
    // La vitesse verticale des roues (mesurée avec la hauteur) et son changement depuis le pas d'avant.
    const vyRoues = (y - s.yAvant) / dt;
    let choc = vyRoues - s.vyAvant;
    if (Math.abs(vyRoues) > 40 || Math.abs(choc) > 30) choc = 0; // un « saut » de position (la voiture remise au départ) : ce n'est pas une bosse
    if (v.enLAir) choc = 0; // en l'air, toute la voiture tombe ensemble : le ressort ne bouge pas (il se rattrape à l'atterrissage)
    s.yAvant = y;
    s.vyAvant = Math.abs(vyRoues) > 40 ? 0 : vyRoues;
    // Les roues montent d'un coup → la caisse descend par rapport à elles (le ressort s'écrase).
    s.vitesse -= choc * R.transmission;
    s.depuisChoc = (s.depuisChoc || 0) + dt;
    if (choc > R.gros && s.depuisChoc > 0.5) { // (un atterrissage dure 2 ou 3 petits pas : on ne l'écrit qu'une fois)
      s.dernierChoc = choc;
      s.depuisChoc = 0;
      radio.emettre("ressorts", { choc, nom: fiche.nom });
    }
    // La loi du ressort, et l'amortisseur.
    s.vitesse += (-R.raideur * s.ecrase - R.amortissement * s.vitesse) * dt;
    s.ecrase += s.vitesse * dt;
    // La butée : un ressort ne s'écrase pas à l'infini.
    if (Math.abs(s.ecrase) > R.course) {
      s.ecrase = Math.sign(s.ecrase) * R.course;
      s.vitesse *= -0.3;
    }
  }

  return { etape };
})();
