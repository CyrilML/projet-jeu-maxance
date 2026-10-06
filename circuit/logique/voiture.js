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
// (depuis l'étape 41 : sans dépasser la vitesse max + 16 m/s)
// et une poussée s'ajoute, même sans appuyer sur ↑. Après, la voiture revient DOUCEMENT à sa vitesse max.
//
// Étape 47 : LA MÉTÉO (logique/meteo.js). Sur une route mouillée ou enneigée, l'ADHÉRENCE baisse :
//   - on accélère et on freine moins fort ;
//   - la voiture GLISSE : elle avance dans la direction de son DÉPLACEMENT, qui rattrape seulement petit à petit
//     la direction de son nez. Plus ça glisse, plus elle met de temps à rattraper (c'est le « dérapage ») ;
//   - le VENT la pousse sur le côté.
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
  // Étape 53 : on n'écrit dans le journal que ce que fait TA voiture (pas la police ni les autres).
  const estLeJoueur = (voiture) => !!(Circuit.monde && Circuit.monde.voiture === voiture);
  const radio = () => Circuit.Evenements;

  function avancer(voiture, intentions, dt, sol, virage) {
    const N = Circuit.CONFIG.nitro;
    // Étape 47 : la météo (1 = ça accroche, moins = ça glisse) et le vent.
    const adherence = Circuit.Meteo ? Circuit.Meteo.adherence() : 1;
    if (Circuit.Meteo) {
      const vent = Circuit.Meteo.vent(), k = Circuit.CONFIG.meteo.effetVent * dt;
      voiture.x += vent.x * k;
      voiture.z += vent.z * k;
    }
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
      v += (v < 0 ? V.freinage : voiture.acceleration) * (0.4 + 0.6 * adherence) * dt;
    } else if (intentions.freiner && !intentions.accelerer) {
      voiture.pedale = "frein";
      // On freine… et une fois arrêté, on recule.
      v -= (v > 0 ? V.freinage * (0.35 + 0.65 * adherence) : voiture.acceleration * 0.6) * dt; // étape 47 : on freine moins bien quand ça glisse
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
      max = Math.min(max * N.facteur, max + N.bonusMax); // étape 41 : jamais plus de +16 m/s (les F1 allaient à 285 km/h !)
      if (v < max) v = Math.min(max, v + N.poussee * dt);
      voiture.pedale += " + 🔥 nitro";
    }
    // Trop vite ? Dans l'herbe, ça freine fort ; ailleurs (après un nitro), on ralentit doucement.
    // (on part de la vitesse d'avant : au-dessus de la vitesse max, l'accélérateur ne fait plus monter la vitesse)
    if (v > max) v = Math.max(max, Math.min(v, voiture.vitesse) - (sol === "herbe" ? V.freinHerbe : intentions.freiner ? V.freinage : N.ralentissement) * dt);
    // Étape 53 : le PATINAGE. Une sportive qui démarre à fond : ses roues arrière tournent plus vite que la route,
    // le caoutchouc chauffe… et fume ! (pendant 1,3 s au plus, et tant qu'elle va moins vite que 9 m/s).
    const D = Circuit.CONFIG.drift;
    const fiche = (Circuit.Garage && Circuit.Garage.ficheDe(voiture.modele)) || {};
    if (Math.abs(voiture.vitesse) < 0.5 && !intentions.accelerer) voiture.depuisDepart = 0;
    if (intentions.accelerer) voiture.depuisDepart = (voiture.depuisDepart || 0) + dt;
    const patine = !!fiche.sportive && intentions.accelerer && !intentions.freiner && v > 0 && v < D.patinageVitesse && voiture.depuisDepart < D.patinageDuree;
    if (patine && !voiture.patine && estLeJoueur(voiture)) radio().emettre("patinage", { voiture: fiche.nom });
    voiture.patine = patine;
    if (voiture.drift) v = Math.max(0, v - D.frottement * dt); // (les pneus qui glissent freinent un peu)
    voiture.vitesse = v;

    // 2. Le volant : on tourne d'autant plus vite qu'on roule (jusqu'à 10 m/s), et à l'envers en marche arrière.
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    const efficacite = Math.min(1, Math.abs(v) / 10) * Math.sign(v);
    // Étape 53 : le DRIFT. Vite (plus de 70 % de la vitesse max) et en tournant à fond : l'arrière décroche, la voiture
    // pivote plus vite que là où elle va (elle avance « en crabe »). On sort du drift en redressant, ou en ralentissant.
    const relative = v / voiture.vitesseMax; // (étape 58 : les pilotes de la course, eux, ne driftent jamais : sansDrift)
    if (!voiture.drift && !voiture.sansDrift && sol !== "herbe" && relative > D.entree && Math.abs(voiture.volant) > D.volant && direction !== 0) {
      voiture.drift = { duree: 0, angleMax: 0 };
      if (estLeJoueur(voiture)) radio().emettre("drift-debut", { vitesse: v });
    } else if (voiture.drift) {
      voiture.drift.duree += dt;
      voiture.drift.angleMax = Math.max(voiture.drift.angleMax, Math.abs(voiture.derapage || 0));
      if (relative < D.sortie || sol === "herbe" || (direction === 0 && Math.abs(voiture.derapage || 0) < 0.06)) {
        if (estLeJoueur(voiture)) radio().emettre("drift-fin", { duree: voiture.drift.duree, angle: voiture.drift.angleMax });
        voiture.drift = null;
      }
    }
    voiture.angle += direction * (virage || V.vitesseVirage) * efficacite * (voiture.drift ? D.virage : 1) * dt;
    voiture.angle = ((voiture.angle + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; // rester entre −π et π
    voiture.volant += (direction - voiture.volant) * Math.min(1, dt * 10); // le volant tourne en douceur

    // 3. Avancer dans la direction de l'angle… ou, si ça glisse (étape 47), dans la direction du déplacement,
    // qui rattrape celle du nez petit à petit (14 fois l'adhérence par seconde).
    // (Étape 53 : en drift, il le rattrape beaucoup plus lentement, 4,5 fois par seconde : c'est ça, la glissade.)
    if (voiture.deplacement === undefined || (adherence >= 0.999 && !voiture.drift && Math.abs(voiture.derapage || 0) < 0.01)) voiture.deplacement = voiture.angle;
    else {
      const ecart = Math.atan2(Math.sin(voiture.angle - voiture.deplacement), Math.cos(voiture.angle - voiture.deplacement));
      const rattrape = voiture.drift ? D.adherence * (0.5 + 0.5 * adherence) : adherence * 14;
      voiture.deplacement += ecart * Math.min(1, rattrape * dt);
      // jamais plus de 43° de glissade (sinon : tête-à-queue)
      const reste = Math.atan2(Math.sin(voiture.angle - voiture.deplacement), Math.cos(voiture.angle - voiture.deplacement));
      if (Math.abs(reste) > D.angleMax) voiture.deplacement = voiture.angle - Math.sign(reste) * D.angleMax;
    }
    voiture.derapage = Math.atan2(Math.sin(voiture.angle - voiture.deplacement), Math.cos(voiture.angle - voiture.deplacement));
    // Étape 53 : combien les pneus crissent (de 0 à 1) : en drift, en patinant, ou en glissant fort sur la route mouillée.
    voiture.crisse = voiture.drift ? Math.min(1, 0.45 + Math.abs(voiture.derapage) * 1.4) : patine ? 0.8 : Math.abs(voiture.derapage) > 0.2 && Math.abs(v) > 8 ? 0.4 : 0;
    voiture.x += Math.cos(voiture.deplacement) * v * dt;
    voiture.z += Math.sin(voiture.deplacement) * v * dt;
    voiture.distance += Math.abs(v) * dt;
    voiture.rotationRoues += (v * dt) / RAYON_ROUE;
  }

  return { creer, avancer };
})();
