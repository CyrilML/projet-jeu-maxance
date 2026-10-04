// 🏎️ LA VOITURE : le moteur et le volant
//
// La voiture n'est qu'une poignée de nombres :
//   x, z     → où elle est sur le sol (en mètres) ;
//   angle    → vers où elle regarde (en radians : 0 = vers x+, la ligne droite du départ) ;
//   vitesse  → combien de mètres elle avance chaque seconde (négative = marche arrière).
//
// À chaque petit pas de temps (1/120 s) :
//   1. les pédales changent la VITESSE (accélérer, freiner, ou ralentir tout seul) ;
//   2. le volant change l'ANGLE (seulement si la voiture roule : on ne tourne pas sur place !) ;
//   3. on avance : x += cos(angle) × vitesse × temps ; z += sin(angle) × vitesse × temps.
//
// Le point 3, c'est de la trigonométrie : cos et sin découpent « avancer tout droit »
// en « un peu vers x » + « un peu vers z », selon l'angle.
//
// Étape 40 : LE NITRO. Tant que voiture.nitro > 0 (des secondes), la vitesse max est multipliée par 1,5
// et une poussée s'ajoute, même sans appuyer sur ↑. Après, la voiture revient DOUCEMENT à sa vitesse max.
//
// Ce fichier ne dessine rien : il calcule. C'est affichage/scene3d.js qui dessine la voiture.

window.Circuit = window.Circuit || {};

Circuit.Voiture = (function () {
  const V = Circuit.CONFIG.voiture;
  const RAYON_ROUE = 0.38; // m, pour faire tourner les roues à la bonne vitesse

  // reglages (facultatif) : { vitesseMax, acceleration, modele } pour une voiture différente
  // (l'adversaire, ou une voiture achetée au garage).
  function creer(x, z, angle, reglages) {
    return {
      x, z, angle,
      vitesseMax: (reglages && reglages.vitesseMax) || V.vitesseMax, // m/s sur la route
      acceleration: (reglages && reglages.acceleration) || V.acceleration, // m/s²
      modele: (reglages && reglages.modele) || "classique", // étape 36 : la forme de la voiture (voir affichage/modeles.js)
      vitesse: 0, // m/s
      y: 0, // étape 37 : la hauteur (m) ; 0 = posée sur le sol
      vy: 0, // étape 37 : la vitesse vers le haut (m/s)
      enLAir: false, // étape 37 : vrai pendant un saut de tremplin
      nitro: 0, // étape 40 : les secondes de nitro qui restent (0 = pas de nitro)
      volant: 0, // de −1 (à fond à gauche) à +1 (à fond à droite), pour tourner les roues avant du dessin
      rotationRoues: 0, // radians : de combien les roues ont tourné depuis le départ
      distance: 0, // m parcourus dans la course
      pedale: "aucune", // pour le panneau « sous le capot »
    };
  }

  // Avance la voiture d'un petit pas de temps dt.
  // intentions = { accelerer, freiner, gauche, droite } (vrai ou faux)
  // sol = "route", "bordure", "herbe", "terre" (le parcours) ou "air"
  // virage (facultatif, étape 37) : la vitesse de rotation de ce véhicule, en rad/s.
  function avancer(voiture, intentions, dt, sol, virage) {
    const N = Circuit.CONFIG.nitro;
    const nitro = voiture.nitro > 0;
    if (nitro) voiture.nitro = Math.max(0, voiture.nitro - dt);
    // Étape 37 : en l'air, les pédales et le volant ne servent à rien. La voiture file tout droit.
    if (sol === "air") {
      voiture.pedale = "aucune (en l'air)";
      voiture.x += Math.cos(voiture.angle) * voiture.vitesse * dt;
      voiture.z += Math.sin(voiture.angle) * voiture.vitesse * dt;
      voiture.distance += Math.abs(voiture.vitesse) * dt;
      voiture.rotationRoues += (voiture.vitesse * dt) / RAYON_ROUE;
      return;
    }
    // 1. Les pédales
    let v = voiture.vitesse;
    if (intentions.accelerer && !intentions.freiner) {
      voiture.pedale = "accélérateur";
      v += (v < 0 ? V.freinage : voiture.acceleration) * dt;
    } else if (intentions.freiner && !intentions.accelerer) {
      voiture.pedale = "frein";
      // On freine… et une fois arrêté, on recule.
      v -= (v > 0 ? V.freinage : voiture.acceleration * 0.6) * dt;
      v = Math.max(v, -V.vitesseMarcheArriere);
    } else {
      voiture.pedale = "aucune";
      // Personne n'appuie : les frottements ralentissent la voiture jusqu'à l'arrêt.
      const frottement = V.ralentissement * dt;
      v = Math.abs(v) <= frottement ? 0 : v - Math.sign(v) * frottement;
    }

    // La vitesse maximale dépend du sol : l'herbe freine fort.
    let max = sol === "herbe" ? Math.min(V.vitesseMaxHerbe, voiture.vitesseMax) : voiture.vitesseMax;
    if (nitro) {
      // Étape 40 : la poussée du nitro.
      max *= N.facteur;
      if (v < max) v = Math.min(max, v + N.poussee * dt);
      voiture.pedale += " + 🔥 nitro";
    }
    // Trop vite ? Dans l'herbe, ça freine fort ; ailleurs (après un nitro), on ralentit doucement.
    // (on part de la vitesse d'avant : au-dessus de la vitesse max, l'accélérateur ne fait plus monter la vitesse)
    if (v > max) v = Math.max(max, Math.min(v, voiture.vitesse) - (sol === "herbe" ? V.freinHerbe : intentions.freiner ? V.freinage : N.ralentissement) * dt);
    voiture.vitesse = v;

    // 2. Le volant : on tourne d'autant plus vite qu'on roule (jusqu'à 10 m/s), et à l'envers en marche arrière.
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    const efficacite = Math.min(1, Math.abs(v) / 10) * Math.sign(v);
    voiture.angle += direction * (virage || V.vitesseVirage) * efficacite * dt;
    voiture.angle = ((voiture.angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; // rester entre −π et π
    voiture.volant += (direction - voiture.volant) * Math.min(1, dt * 10); // le volant tourne en douceur

    // 3. Avancer dans la direction de l'angle
    voiture.x += Math.cos(voiture.angle) * v * dt;
    voiture.z += Math.sin(voiture.angle) * v * dt;
    voiture.distance += Math.abs(v) * dt;
    voiture.rotationRoues += (v * dt) / RAYON_ROUE;
  }

  return { creer, avancer };
})();
