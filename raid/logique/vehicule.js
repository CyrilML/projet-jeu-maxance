// 🚙 LE VÉHICULE : le moteur, le volant et les roues sur le terrain
//
// Étape 54. Chaque petit pas (1/120 s), pour chaque véhicule (le tien et ceux des autres concurrents) :
//   1. LE TERRAIN sous les roues (logique/terrain.js) : il change tout ! Dans le sable, la voiture glisse et ralentit ;
//      dans la boue, elle patine ; dans le gué, l'eau la freine fort ; sur la piste, ça accroche.
//      La « motricité » du véhicule aide : le camion passe mieux dans la boue que la moto.
//   2. LES PÉDALES : accélérer, freiner. Dans une MONTÉE, la gravité freine ; dans une DESCENTE, elle pousse
//      (comme un vélo dans une côte).
//   3. LE VOLANT change l'angle du nez. Le DÉPLACEMENT suit le nez plus ou moins vite selon l'adhérence : sur
//      le sable, il traîne → la voiture GLISSE.
//   4. LES SAUTS : quand le sol descend plus vite que la voiture ne tombe (le haut d'une dune), elle DÉCOLLE.
//      En l'air, la gravité la fait retomber. À l'atterrissage, on mesure le saut (durée, hauteur, longueur).
//
// Ce fichier ne dessine rien. Ses nombres sont dans config.js (vehicule, terrains, vehicules).

window.Raid = window.Raid || {};

Raid.Vehicule = (function () {
  const C = Raid.CONFIG, V = C.vehicule, T = Raid.Terrain;

  function creer(fiche, x, z, angle) {
    const y = T.hauteur(x, z);
    return {
      fiche, modele: fiche.modele, x, z, y, vy: 0, angle, deplacement: angle,
      vitesse: 0, volant: 0, enLAir: false, tempsEnLAir: 0, hauteurDepart: 0, xDepart: 0, zDepart: 0, plusHaut: 0,
      terrain: T.terrain(x, z), distance: 0, rotationRoues: 0, derapage: 0, pedale: "aucune", dansLEau: 0,
    };
  }

  // Un pas. intentions = { accelerer, freiner, gauche, droite }. Renvoie les événements du pas (un saut fini…).
  function avancer(v, intentions, dt) {
    const f = v.fiche, evenements = [];
    const nom = T.terrain(v.x, v.z), ter = C.terrains[nom];
    v.terrain = nom;
    // La motricité aide dans les terrains difficiles (sable, boue, eau), sans dépasser l'adhérence de la piste.
    const difficile = 1 - ter.adherence;
    const adherence = Math.min(0.95, ter.adherence + difficile * (f.motricite - 1) * 0.8);
    const vitesseMax = f.vitesseMax * Math.min(1, ter.vitesse * (1 + (f.motricite - 1) * 0.6));

    // 1. En l'air : la gravité, et c'est tout (les roues ne touchent rien).
    if (v.enLAir) {
      v.vy -= C.gravite * dt;
      v.y += v.vy * dt;
      v.x += Math.cos(v.deplacement) * v.vitesse * dt;
      v.z += Math.sin(v.deplacement) * v.vitesse * dt;
      v.tempsEnLAir += dt;
      v.plusHaut = Math.max(v.plusHaut, v.y - v.hauteurDepart);
      const sol = T.hauteur(v.x, v.z);
      if (v.y <= sol) {
        // L'atterrissage !
        const choc = -v.vy;
        v.y = sol;
        v.vy = 0;
        v.enLAir = false;
        if (v.tempsEnLAir >= V.sautMin) {
          evenements.push(["saut", { duree: v.tempsEnLAir, hauteur: v.plusHaut, longueur: Math.hypot(v.x - v.xDepart, v.z - v.zDepart), choc, nom: f.nom }]);
        }
        v.vitesse *= choc > 9 ? 0.75 : 0.95; // un atterrissage brutal fait perdre de la vitesse
      }
      v.distance += Math.abs(v.vitesse) * dt;
      v.rotationRoues += (v.vitesse * dt) / 0.45;
      return evenements;
    }

    // 2. Les pédales.
    let vit = v.vitesse;
    if (intentions.accelerer && !intentions.freiner) {
      v.pedale = "accélérateur";
      vit += (vit < 0 ? V.freinage : f.acceleration * (0.45 + 0.55 * adherence)) * dt;
    } else if (intentions.freiner && !intentions.accelerer) {
      v.pedale = "frein";
      vit -= (vit > 0 ? V.freinage * (0.4 + 0.6 * adherence) : f.acceleration * 0.6) * dt;
      vit = Math.max(vit, -V.marcheArriere);
    } else {
      v.pedale = "aucune";
      const fr = V.ralentissement * dt;
      vit = Math.abs(vit) <= fr ? 0 : vit - Math.sign(vit) * fr;
    }
    // Le terrain freine (le sable, la boue, l'eau), et la pente aussi : la gravité tire vers le bas de la côte.
    const avantX = Math.cos(v.angle), avantZ = Math.sin(v.angle);
    const hAvant = T.hauteur(v.x + avantX, v.z + avantZ), hArriere = T.hauteur(v.x - avantX, v.z - avantZ);
    const pente = (hAvant - hArriere) / 2; // (> 0 : ça monte)
    vit -= C.gravite * (pente / Math.sqrt(1 + pente * pente)) * dt;
    const frottement = ter.frottement / (0.6 + 0.4 * f.motricite) * dt;
    vit = Math.abs(vit) <= frottement ? 0 : vit - Math.sign(vit) * frottement;
    if (vit > vitesseMax) vit = Math.max(vitesseMax, vit - 6 * dt); // trop vite pour ce terrain : on ralentit (en douceur)
    v.vitesse = vit;

    // 3. Le volant, et la glissade.
    const direction = (intentions.droite ? 1 : 0) - (intentions.gauche ? 1 : 0);
    v.volant += (direction - v.volant) * Math.min(1, dt * 8);
    const efficacite = Math.min(1, Math.abs(vit) / 8) * Math.sign(vit);
    v.angle += v.volant * f.virage * efficacite * dt;
    v.angle = Math.atan2(Math.sin(v.angle), Math.cos(v.angle));
    const ecart = Math.atan2(Math.sin(v.angle - v.deplacement), Math.cos(v.angle - v.deplacement));
    v.deplacement += ecart * Math.min(1, adherence * V.adherenceRoute * dt);
    v.derapage = Math.atan2(Math.sin(v.angle - v.deplacement), Math.cos(v.angle - v.deplacement));
    v.x += Math.cos(v.deplacement) * vit * dt;
    v.z += Math.sin(v.deplacement) * vit * dt;
    // Le bord du monde : une grande barrière invisible.
    const bord = T.demi - 20;
    if (Math.abs(v.x) > bord || Math.abs(v.z) > bord) {
      v.x = Math.max(-bord, Math.min(bord, v.x));
      v.z = Math.max(-bord, Math.min(bord, v.z));
      v.vitesse *= 0.5;
    }

    // 4. Rester sur le sol… ou décoller ! On regarde où le sol sera : s'il descend plus vite que la voiture ne
    // peut tomber, elle s'envole (elle garde sa vitesse vers le haut ou vers le bas).
    const sol = T.hauteur(v.x, v.z);
    const vySol = (sol - v.y) / dt; // la vitesse verticale qu'il faudrait pour suivre le sol
    if (vySol < v.vy - C.gravite * dt * 1.5 && Math.abs(vit) > 6) {
      v.enLAir = true;
      v.vy = v.vy * f.saut;
      v.tempsEnLAir = 0;
      v.hauteurDepart = v.y;
      v.plusHaut = 0;
      v.xDepart = v.x;
      v.zDepart = v.z;
      v.y += v.vy * dt;
    } else {
      v.vy = Math.max(-30, Math.min(30, vySol));
      v.y = sol;
    }
    // L'eau : jusqu'où le véhicule est mouillé (pour les éclaboussures).
    const eau = T.eau(v.x, v.z);
    v.dansLEau = eau === null ? 0 : Math.max(0, eau - v.y);
    v.distance += Math.abs(vit) * dt;
    v.rotationRoues += (vit * dt) / 0.45;
    return evenements;
  }

  // Deux véhicules qui se touchent se repoussent (comme deux boules), et ralentissent un peu.
  function chocs(liste) {
    const r = V.rayonChoc * 2, evenements = [];
    for (let i = 0; i < liste.length; i++) {
      for (let j = i + 1; j < liste.length; j++) {
        const a = liste[i], b = liste[j];
        const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
        if (d >= r || d < 0.01 || Math.abs(a.y - b.y) > 2.5) continue;
        const pousse = (r - d) / 2, ux = dx / d, uz = dz / d;
        a.x -= ux * pousse;
        a.z -= uz * pousse;
        b.x += ux * pousse;
        b.z += uz * pousse;
        const force = Math.abs(a.vitesse - b.vitesse);
        a.vitesse *= 0.85;
        b.vitesse *= 0.85;
        evenements.push(["choc", { a, b, force }]);
      }
    }
    return evenements;
  }

  return { creer, avancer, chocs };
})();
