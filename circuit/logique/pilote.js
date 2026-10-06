// 🤖 LE PILOTE : le cerveau de la voiture adverse
//
// La voiture adverse est EXACTEMENT la même que la tienne (même fichier logique/voiture.js).
// La seule différence : ce n'est pas le clavier qui appuie sur les pédales et tourne le volant,
// c'est ce petit cerveau. À chaque pas de temps, il fabrique les mêmes INTENTIONS que toi :
// { accelerer, gauche, droite }.
//
// Sa méthode, c'est celle de la « carotte » :
//   1. il regarde un point 18 m devant lui, au milieu de sa VOIE (à 3,5 m du milieu de la route) ;
//   2. si ce point est à sa gauche, il tourne à gauche ; à sa droite, il tourne à droite ;
//   3. il garde toujours le pied sur l'accélérateur (sa vitesse maximale : 140 km/h).
//
// Et pour te doubler : si tu es juste devant lui, sur sa voie, il passe de l'autre côté.
//
// Étape 58 : ils sont 11 ! Chacun a 3 voies possibles (intérieur, milieu, extérieur) : si la voiture juste devant
// bouche sa voie, il prend la voie libre la plus proche. Et avant un virage, il regarde 45 m devant lui : si la route
// tourne trop pour sa vitesse, il lève le pied (il freine même, si c'est beaucoup trop vite).

window.Circuit = window.Circuit || {};

Circuit.Pilote = (function () {
  const A = Circuit.CONFIG.adversaire;

  // Calcule les intentions du pilote. `devant` = où est l'autre voiture : { avance, ecart }
  // (avance = combien de mètres elle a d'avance sur nous ; ecart = son décalage sur la route).
  function decider(adversaire, devant) {
    const v = adversaire.voiture;

    // Changer de voie si une voiture juste devant nous bouche le passage : on prend la voie libre la plus proche.
    if (devant && devant.avance > 0 && devant.avance < A.distanceDepassement && Math.abs(devant.ecart - adversaire.voie) < 3) {
      const libres = A.voies.filter((voie) => Math.abs(devant.ecart - voie) >= 3);
      if (libres.length) {
        const nouvelle = libres.reduce((a, b) => (Math.abs(b - adversaire.voie) < Math.abs(a - adversaire.voie) ? b : a));
        if (nouvelle !== adversaire.voie) {
          adversaire.voie = nouvelle;
          Circuit.Evenements.emettre("adversaire-change-de-voie", { voie: nouvelle, avance: devant.avance, nom: adversaire.nom });
        }
      }
    }

    // Un virage arrive ? On compare la direction de la route ici et 45 m plus loin. Un virage de rayon r, c'est un
    // changement de direction de 45 ÷ r radians sur 45 m : donc r ≈ 45 ÷ (le changement).
    const ici = Circuit.Piste.pointDecale(adversaire.reperage.s, 0), loin = Circuit.Piste.pointDecale(adversaire.reperage.s + A.regardVirage, 0);
    let tourne = Math.atan2(loin.dz, loin.dx) - Math.atan2(ici.dz, ici.dx);
    tourne = Math.abs(Math.atan2(Math.sin(tourne), Math.cos(tourne)));
    const rayon = tourne > 0.01 ? A.regardVirage / tourne : Infinity;
    const vitesseSure = A.vitesseVirage * Math.sqrt(rayon);
    adversaire.vitesseSure = vitesseSure; // gardé pour « sous le capot »

    // La carotte : un point devant, sur notre voie.
    const cible = Circuit.Piste.pointDecale(adversaire.reperage.s + A.regardDevant, adversaire.voie);
    adversaire.cible = cible; // gardé pour les rayons X
    let difference = Math.atan2(cible.z - v.z, cible.x - v.x) - v.angle;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference)); // entre −180° et +180°
    adversaire.difference = difference; // gardé pour « sous le capot »

    return {
      accelerer: v.vitesse < vitesseSure,
      freiner: v.vitesse > vitesseSure + 4,
      gauche: difference < -0.02,
      droite: difference > 0.02,
    };
  }

  return { decider };
})();
