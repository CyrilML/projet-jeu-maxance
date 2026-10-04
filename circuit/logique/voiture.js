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
// Ce fichier ne dessine rien : il calcule. C'est affichage/scene3d.js qui dessine la voiture.

window.Circuit = window.Circuit || {};

Circuit.Voiture = (function () {
  const V = Circuit.CONFIG.voiture;
  const RAYON_ROUE = 0.38; // m, pour faire tourner les roues à la bonne vitesse

  function creer(x, z, angle) {
    return {
      x, z, angle,
      vitesse: 0, // m/s
      volant: 0, // de −1 (à fond à gauche) à +1 (à fond à droite), pour tourner les roues avant du dessin
      rotationRoues: 0, // radians : de combien les roues ont tourné depuis le départ
      distance: 0, // m parcourus dans la course
      pedale: "aucune", // pour le panneau « sous le capot »
    };
  }

  // Avance la voiture d'un petit pas de temps dt.
  // intentions = { accelerer, freiner, gauche, droite } (vrai ou faux)
  // sol = "route", "bordure" ou "herbe"
  function avancer(voiture, intentions, dt, sol) {
    // 1. Les pédales
    let v = voiture.vitesse;
    if (intentions.accelerer && !intentions.freiner) {
      voiture.pedale = "accélérateur";
      v += (v < 0 ? V.freinage : V.acceleration) * dt;
    } else if (intentions.freiner && !intentions.accelerer) {
      voiture.pedale = "frein";
      // On freine… et une fois arrêté, on recule.
      v -= (v > 0 ? V.freinage : V.acceleration * 0.6) * dt;
      v = Math.max(v, -V.vitesseMarcheArriere);
    } else {
      voiture.pedale = "aucune";
      // Personne n'appuie : les frottements ralentissent la voiture jusqu'à l'arrêt.
      const frottement = V.ralentissement * dt;
      v = Math.abs(v) <= frottement ? 0 : v - Math.sign(v) * frottement;
    }

    // La vitesse maximale dépend du sol : l'herbe freine fort.
    const max = sol === "herbe" ? V.vitesseMaxHerbe : V.vitesseMax;
    if (v > max) v = Math.max(max, v - (sol === "herbe" ? V.freinHerbe : V.freinage) * dt);
    voiture.vitesse = v;

    // 2. Le volant : on tourne d'autant plus vite qu'on roule (jusqu'à 10 m/s), et à l'envers en marche arrière.
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    const efficacite = Math.min(1, Math.abs(v) / 10) * Math.sign(v);
    voiture.angle += direction * V.vitesseVirage * efficacite * dt;
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
