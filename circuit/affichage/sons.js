// 🎺 LES SONS DU CIRCUIT : l'ingénieur du son
//
// Ce fichier décide QUAND et COMMENT le jeu fait du bruit. Il ne fabrique pas les sons lui-même
// (c'est moteur/son.js, le synthétiseur) : il lit le monde et il écoute la radio.
//
//   - TON MOTEUR : sa fréquence suit la vitesse :
//       fréquence = ralenti + (max − ralenti) × (vitesse ÷ vitesse max)
//     Depuis l'étape 36, chaque voiture du garage a ses propres fréquences (dans config.js) :
//     la Rouge garde son gros moteur grave (38 → 90 Hz) et la Formule 1 crie dans les aigus (170 → 560 Hz).
//     Quand tu accélères, il est plus fort et moins étouffé ; quand tu lâches, il ronronne.
//   - LE MOTEUR DE LA VOITURE BLEUE : le même, mais son volume dépend de la DISTANCE
//     (fort tout près, plus rien après 70 m), et il est à gauche ou à droite dans le casque,
//     selon où elle est par rapport à toi.
//   - L'HERBE : un « chhhh » qui monte avec la vitesse quand tu roules dans l'herbe.
//   - LE CHOC : « BOUM » quand les voitures se cognent (plus fort si le choc est violent).
//   - LES BIPS DU DÉPART : un bip grave à chaque feu rouge, un bip aigu au « GO ».
//   - Étape 40 : le NITRO fait « fffff » (un souffle aigu), et la SIRÈNE de la police fait « pin-pon » :
//     deux notes qui changent toutes les demi-secondes (440 Hz, puis 587 Hz).
//
// Comme le reste de l'affichage, ce fichier LIT le monde, il ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.Sons = (function () {
  const S = Circuit.CONFIG.sons;
  const Son = Circuit.Son;
  let moteurJoueur = null, moteurAdversaire = null, herbe = null, souffle = null, sirene = null;
  // Ce qu'on entend en ce moment : lu par le panneau « sous le capot ».
  const enDirect = { frequence: 0, volume: 0, frequenceAdversaire: 0, volumeAdversaire: 0, cote: 0, herbe: 0 };

  function initialiser() {
    Son.initialiser(S.volumeGeneral);
    moteurJoueur = Son.creerMoteur();
    moteurAdversaire = Son.creerMoteur();
    herbe = Son.creerBruit(S.herbe.frequenceFiltre);
    souffle = Son.creerBruit(2600); // étape 40 : le nitro
    sirene = Son.creerMoteur(); // étape 40 : la sirène (un « moteur » qui joue 2 notes)

    const radio = Circuit.Evenements;
    radio.ecouter("decompte", () => Son.bip(S.bips.frequenceFeu, 0.18, S.bips.volume));
    radio.ecouter("feu", () => Son.bip(S.bips.frequenceFeu, 0.18, S.bips.volume));
    radio.ecouter("depart", () => Son.bip(S.bips.frequenceGo, 0.5, S.bips.volume));
    radio.ecouter("choc", (d) => Son.boum(d.force));
    // Étape 37 : le parcours.
    radio.ecouter("carton", () => Son.boum(3));
    radio.ecouter("atterrissage", (d) => { if (d.duree > 0.3) Son.boum(Math.min(10, d.hauteurMax * 2)); });
    radio.ecouter("looping-fini", () => {
      Son.bip(660, 0.1, 0.12);
      setTimeout(() => Son.bip(990, 0.25, 0.12), 110);
    });
    // Étape 36 : « ding » quand on prend une pièce, « ding-ding » quand on achète une voiture.
    radio.ecouter("piece", () => Son.bip(1320, 0.08, 0.12));
    radio.ecouter("nitro", () => Son.bip(220, 0.25, 0.12));
    radio.ecouter("chute", (d) => Son.boum(Math.min(12, d.hauteur)));
    radio.ecouter("achat", () => {
      Son.bip(988, 0.12, 0.15);
      setTimeout(() => Son.bip(1319, 0.25, 0.15), 130);
    });
  }

  // La fréquence d'un moteur selon sa vitesse, et selon le modèle de voiture.
  function frequenceDuMoteur(voiture) {
    const fiche = Circuit.Garage.ficheDe(voiture.modele); // étape 37 : dans tous les garages
    const son = fiche ? fiche.son : { ralenti: S.moteur.frequenceRalenti, max: S.moteur.frequenceMax };
    const part = Math.min(1, Math.abs(voiture.vitesse) / voiture.vitesseMax);
    return son.ralenti + (son.max - son.ralenti) * part;
  }

  // Appelé à chaque image.
  function mettreAJour(monde, options) {
    const silence = options.pause;
    const v = monde.voiture;

    // 1. Ton moteur
    const accelere = v.pedale.startsWith("accélérateur") || v.nitro > 0;
    const f = frequenceDuMoteur(v);
    // Étape 39 : à pied, le moteur de ta voiture est coupé.
    const volume = silence || monde.pieton ? 0 : accelere ? S.moteur.volumeAccelere : S.moteur.volumeLache;
    Son.reglerMoteur(moteurJoueur, f, volume, accelere ? 1 : 0.2, 0);
    enDirect.frequence = f;
    enDirect.volume = volume;

    // 2. Le moteur de la voiture bleue : plus elle est loin, moins on l'entend.
    if (!monde.adversaire) {
      // Pas de voiture bleue (le parcours) : son moteur se tait.
      Son.reglerMoteur(moteurAdversaire, 50, 0, 0, 0);
      enDirect.volumeAdversaire = 0;
      enDirect.distance = 0;
    } else {
    const a = monde.adversaire.voiture;
    const dx = a.x - v.x, dz = a.z - v.z;
    const distance = Math.hypot(dx, dz);
    const proche = Math.max(0, 1 - distance / S.adversaire.distanceMax);
    const volumeAdv = silence ? 0 : S.adversaire.volume * proche * proche;
    // Gauche ou droite ? On compare la direction de la voiture bleue avec la droite de ta voiture.
    const droiteX = -Math.sin(v.angle), droiteZ = Math.cos(v.angle);
    const cote = distance > 0.1 ? (dx * droiteX + dz * droiteZ) / distance : 0;
    const fAdv = frequenceDuMoteur(a) * 1.06; // un tout petit peu plus aigu, pour les reconnaître
    Son.reglerMoteur(moteurAdversaire, fAdv, volumeAdv, 0.7, cote);
    enDirect.frequenceAdversaire = fAdv;
    enDirect.volumeAdversaire = volumeAdv;
    enDirect.cote = cote;
    enDirect.distance = distance;
    }

    // 3. L'herbe
    const volumeHerbe = !silence && monde.sol === "herbe" ? S.herbe.volume * Math.min(1, Math.abs(v.vitesse) / 10) : 0;
    Son.reglerBruit(herbe, volumeHerbe);
    enDirect.herbe = volumeHerbe;

    // 4. Étape 40 : le souffle du nitro, et la sirène de la police.
    const volumeNitro = !silence && v.nitro > 0 && !monde.pieton ? 0.35 * Math.min(1, v.nitro) : 0;
    Son.reglerBruit(souffle, volumeNitro);
    enDirect.nitro = volumeNitro;
    const fiche = Circuit.Garage.ficheDe(v.modele) || {};
    const hurle = !silence && monde.sirene && fiche.sirene && !monde.pieton;
    const note = Math.floor(monde.temps * 2) % 2 ? 587 : 440;
    Son.reglerMoteur(sirene, note, hurle ? 0.16 : 0, 1, 0);
    enDirect.sirene = hurle ? note : 0;
  }

  function basculer() {
    const allume = Son.basculer();
    Circuit.Evenements.emettre("son", { allume });
  }

  return { initialiser, mettreAJour, basculer, enDirect };
})();
