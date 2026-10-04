// 🎬 LA SCÈNE 3D : le décorateur et le caméraman
//
// Au démarrage, le décorateur fabrique une fois pour toutes les objets du décor avec des triangles :
// l'herbe, la route, les bordures rouges et blanches, la ligne d'arrivée en damier, le portique,
// la tribune, les arbres, la clôture… et la voiture.
//
// Ensuite, à chaque image, le caméraman :
//   1. place la caméra derrière la voiture (ou au-dessus, ou sur le capot : touche C) ;
//   2. demande au projecteur de dessiner chaque objet, à sa place.
//
// Ce fichier LIT le monde (où est la voiture ?) mais ne le modifie jamais.

window.Circuit = window.Circuit || {};

Circuit.Scene3D = (function () {
  const C = Circuit.CONFIG;
  const M = Circuit.Maths3D;
  const Projecteur = Circuit.Projecteur;
  const Piste = Circuit.Piste;

  const COULEURS = {
    ciel: [0.55, 0.78, 0.97],
    herbe1: [0.32, 0.62, 0.25],
    herbe2: [0.29, 0.57, 0.23],
    route: [0.27, 0.28, 0.31],
    blanc: [0.95, 0.95, 0.95],
    rouge: [0.85, 0.12, 0.12],
    noir: [0.08, 0.08, 0.09],
    gris: [0.6, 0.62, 0.66],
    tronc: [0.45, 0.3, 0.16],
    sapin: [0.13, 0.42, 0.2],
    sapinClair: [0.2, 0.52, 0.24],
    carrosserie: [0.9, 0.15, 0.1],
    carrosserieFoncee: [0.65, 0.08, 0.06],
    adversaire: [0.12, 0.38, 0.92], // étape 34 : la voiture adverse est bleue
    adversaireFoncee: [0.07, 0.22, 0.6],
    vitre: [0.15, 0.22, 0.35],
    phare: [1, 0.9, 0.5],
    tribune: [0.55, 0.57, 0.62],
    // Rayons X
    xMilieu: [1, 0.89, 0.48],
    xBords: [0.3, 0.9, 1],
    xPorte: [0.85, 0.45, 1],
    xProchaine: [0.3, 1, 0.45],
    xFil: [0.35, 0.95, 0.6],
    xFleche: [0.3, 1, 0.45],
    xEcart: [1, 0.6, 0.2],
    xCarotte: [0.45, 0.75, 1], // le point que vise le pilote adverse
    xCercles: [1, 1, 1], // les cercles de choc
  };

  const maillages = {};
  const camera = { mode: "poursuite", angle: 0, x: 0, y: 0, z: 0, pret: false };
  const MODES = ["poursuite", "ciel", "capot"];
  let vueProjection = M.identite();
  let rapport = 16 / 9;

  // Un petit générateur de hasard « à graine » : les arbres sont toujours au même endroit.
  function hasard(graine) {
    let etat = graine >>> 0;
    return () => {
      etat = (etat * 1664525 + 1013904223) >>> 0;
      return etat / 4294967296;
    };
  }

  // ------------------------------------------------------------------ le décor
  function construireDecor() {
    const c = Circuit.Constructeur();
    const P = C.piste;
    const demiTerrain = P.tailleHerbe / 2;

    // L'herbe : un damier de grands carreaux de 20 m (deux verts, comme une pelouse tondue).
    const carreau = 20;
    for (let x = -demiTerrain; x < demiTerrain; x += carreau) {
      for (let z = -demiTerrain; z < demiTerrain; z += carreau) {
        const couleur = Math.floor((x + demiTerrain) / carreau) % 2 ? COULEURS.herbe1 : COULEURS.herbe2;
        c.quad([x, 0, z], [x, 0, z + carreau], [x + carreau, 0, z + carreau], [x + carreau, 0, z], couleur);
      }
    }
    // Derrière la clôture, encore 200 m d'herbe (en plus grands carreaux) : sinon, vu du ciel,
    // on verrait le bout du monde.
    const bord = demiTerrain + 200, grand = 50;
    for (let x = -bord; x < bord; x += grand) {
      for (let z = -bord; z < bord; z += grand) {
        if (x >= -demiTerrain && x < demiTerrain && z >= -demiTerrain && z < demiTerrain) continue;
        c.quad([x, -0.01, z], [x, -0.01, z + grand], [x + grand, -0.01, z + grand], [x + grand, -0.01, z], COULEURS.herbe2);
      }
    }

    // La route et ses bordures : on suit le milieu de la route tous les 3 m environ.
    const morceaux = Math.round(Piste.longueurTour / 3);
    const pas = Piste.longueurTour / morceaux;
    const demi = P.largeur / 2;
    const ext = demi + P.largeurBordure;
    // Le point à `s` mètres, décalé de `ecart` mètres sur le côté (vers la gauche de la route), à la hauteur y.
    const cote = (s, ecart, y) => {
      const p = Piste.pointA(s);
      return [p.x + p.dz * ecart, y, p.z - p.dx * ecart];
    };
    for (let i = 0; i < morceaux; i++) {
      const s0 = i * pas, s1 = (i + 1) * pas;
      // la route
      c.quad(cote(s0, -demi, 0.02), cote(s1, -demi, 0.02), cote(s1, demi, 0.02), cote(s0, demi, 0.02), COULEURS.route);
      // les bordures : rouge, blanc, rouge, blanc…
      const couleur = i % 2 ? COULEURS.rouge : COULEURS.blanc;
      c.quad(cote(s0, demi, 0.04), cote(s1, demi, 0.04), cote(s1, ext, 0.04), cote(s0, ext, 0.04), couleur);
      c.quad(cote(s0, -ext, 0.04), cote(s1, -ext, 0.04), cote(s1, -demi, 0.04), cote(s0, -demi, 0.04), couleur);
      // la ligne blanche du milieu, en pointillés
      if (i % 3 === 0) c.quad(cote(s0, -0.15, 0.03), cote(s1, -0.15, 0.03), cote(s1, 0.15, 0.03), cote(s0, 0.15, 0.03), COULEURS.blanc);
    }

    // La ligne d'arrivée : un damier noir et blanc, 2 rangées de carrés de 1 m.
    for (let rangee = 0; rangee < 2; rangee++) {
      for (let k = 0; k < P.largeur; k++) {
        const couleur = (k + rangee) % 2 ? COULEURS.noir : COULEURS.blanc;
        const s0 = rangee - 1, s1 = rangee;
        const e0 = -demi + k, e1 = e0 + 1;
        c.quad(cote(s0, e0, 0.05), cote(s1, e0, 0.05), cote(s1, e1, 0.05), cote(s0, e1, 0.05), couleur);
      }
    }

    // Le portique au-dessus de la ligne : 2 poteaux et une banderole.
    const depart = Piste.pointA(0);
    for (const e of [-(ext + 1), ext + 1]) {
      const p = cote(0, e, 0);
      c.boite(p[0], 3.2, p[2], 0.5, 6.4, 0.5, COULEURS.gris);
    }
    c.boite(depart.x, 6.6, depart.z, 0.5, 1.4, 2 * ext + 3, COULEURS.rouge);
    for (let k = 0; k < 8; k++) {
      c.boite(depart.x - 0.3, 6.6, depart.z - ext + k * (2 * ext / 7), 0.05, 0.7, 0.7, k % 2 ? COULEURS.noir : COULEURS.blanc);
    }

    // La tribune, le long de la ligne droite du départ, côté extérieur : 4 marches et des spectateurs.
    const alea = hasard(C.decor.graine);
    const zTribune = P.rayon + ext + 6;
    for (let marche = 0; marche < 4; marche++) {
      c.boite(0, 0.5 + marche * 0.8, zTribune + 1.5 + marche * 1.6, 70, 1 + marche * 1.6, 1.6, COULEURS.tribune);
      for (let x = -33; x <= 33; x += 1.6) {
        if (alea() < 0.35) continue;
        const habit = [alea(), alea(), alea()];
        c.boite(x + alea() * 0.4, 1.4 + marche * 1.6, zTribune + 1.5 + marche * 1.6, 0.6, 0.9, 0.5, habit);
      }
    }
    c.boite(0, 7, zTribune + 8, 72, 0.3, 4, COULEURS.rouge); // le toit
    for (const x of [-35, 35]) c.boite(x, 3.5, zTribune + 8.5, 0.4, 7, 0.4, COULEURS.gris);

    // La clôture tout autour du terrain.
    const limite = demiTerrain - 2;
    for (let k = -limite, n = 0; k < limite; k += 8, n++) {
      const couleur = n % 2 ? COULEURS.blanc : COULEURS.rouge;
      c.boite(k + 4, 0.6, -limite, 8, 1.2, 0.4, couleur);
      c.boite(k + 4, 0.6, limite, 8, 1.2, 0.4, couleur);
      c.boite(-limite, 0.6, k + 4, 0.4, 1.2, 8, couleur);
      c.boite(limite, 0.6, k + 4, 0.4, 1.2, 8, couleur);
    }

    // Les sapins : loin de la route (au moins 8 m du bord) et pas sur la tribune.
    let poses = 0, essais = 0;
    while (poses < C.decor.arbres && essais < 5000) {
      essais++;
      const x = (alea() * 2 - 1) * (limite - 6), z = (alea() * 2 - 1) * (limite - 6);
      const r = Piste.reperer(x, z);
      if (Math.abs(r.ecart) < ext + 8) continue;
      if (Math.abs(x) < 42 && z > zTribune - 3 && z < zTribune + 14) continue;
      const taille = 0.8 + alea() * 0.6;
      c.boite(x, 1 * taille, z, 0.6 * taille, 2 * taille, 0.6 * taille, COULEURS.tronc);
      c.cone(x, 1.6 * taille, z, 2.4 * taille, 3.2 * taille, 7, COULEURS.sapin);
      c.cone(x, 3.4 * taille, z, 1.7 * taille, 2.8 * taille, 7, COULEURS.sapinClair);
      poses++;
    }

    return c.fin();
  }

  // ------------------------------------------------------------------ la voiture
  // Fabriquée « nez vers x+ », centrée en (0, 0, 0) : la scène la déplace et la tourne ensuite.
  // Les deux voitures ont la même forme : seules les couleurs changent (rouge pour toi, bleu pour l'adversaire).
  function construireCarrosserie(couleur, couleurFoncee) {
    const c = Circuit.Constructeur();
    const k = COULEURS;
    c.boite(0, 0.55, 0, 4.2, 0.5, 1.9, couleur); // le bas de caisse
    c.boite(1.6, 0.86, 0, 1, 0.14, 1.7, couleur); // le capot (un peu plus haut)
    c.boite(-0.3, 1.06, 0, 2, 0.5, 1.62, k.vitre); // les vitres
    c.boite(-0.3, 1.34, 0, 1.8, 0.08, 1.5, couleurFoncee); // le toit
    c.boite(-2.05, 1.2, 0, 0.35, 0.08, 1.9, k.noir); // l'aileron
    for (const z of [-0.7, 0.7]) {
      c.boite(-2.05, 0.95, z, 0.1, 0.45, 0.1, k.noir); // les pieds de l'aileron
      c.boite(2.11, 0.6, z, 0.04, 0.18, 0.35, k.phare); // les phares
      c.boite(-2.11, 0.6, z, 0.04, 0.15, 0.4, k.rouge); // les feux arrière
    }
    c.boite(0.1, 0.81, 0, 0.6, 0.02, 1.9, k.blanc); // une bande de course
    return c.fin();
  }

  function construireRoue() {
    const c = Circuit.Constructeur();
    c.roue(0, 0, 0, 0.38, 0.3, 12, COULEURS.noir, COULEURS.gris);
    return c.fin();
  }

  function construireOmbre() {
    const c = Circuit.Constructeur();
    c.quad([-2.3, 0.06, -1.1], [-2.3, 0.06, 1.1], [2.3, 0.06, 1.1], [2.3, 0.06, -1.1], [0.12, 0.14, 0.1]);
    return c.fin();
  }

  // ------------------------------------------------------------------ les rayons X
  function construireRayonsX() {
    const c = Circuit.Constructeur();
    const morceaux = Math.round(Piste.longueurTour / 3);
    const pas = Piste.longueurTour / morceaux;
    const demi = C.piste.largeur / 2;
    const cote = (s, ecart, y) => {
      const p = Piste.pointA(s);
      return [p.x + p.dz * ecart, y, p.z - p.dx * ecart];
    };
    for (let i = 0; i < morceaux; i++) {
      const s0 = i * pas, s1 = (i + 1) * pas;
      c.ligne(cote(s0, 0, 0.2), cote(s1, 0, 0.2), COULEURS.xMilieu); // le milieu de la route
      c.ligne(cote(s0, -demi, 0.2), cote(s1, -demi, 0.2), COULEURS.xBords); // le bord intérieur
      c.ligne(cote(s0, demi, 0.2), cote(s1, demi, 0.2), COULEURS.xBords); // le bord extérieur
    }
    // Le squelette caché au centre (voir logique/piste.js) et quelques rayons de 40 m.
    const D = C.piste.longueurDroite / 2;
    c.ligne([-D, 0.3, 0], [D, 0.3, 0], COULEURS.xEcart);
    for (const x of [-D, 0, D]) {
      c.ligne([x, 0.3, 0], [x, 0.3, C.piste.rayon], COULEURS.xEcart);
      c.ligne([x, 0.3, 0], [x, 0.3, -C.piste.rayon], COULEURS.xEcart);
    }
    for (const s of Piste.portes) ajouterPorte(c, s, COULEURS.xPorte);
    return c.fin();
  }

  // Une porte invisible : un cadre vertical en travers de la route.
  function ajouterPorte(c, s, couleur) {
    const p = Piste.pointA(s);
    const e = C.piste.largeur / 2 + C.piste.largeurBordure;
    const a = [p.x - p.dz * e, 0, p.z + p.dx * e], b = [p.x + p.dz * e, 0, p.z - p.dx * e];
    const h = 5;
    c.ligne(a, [a[0], h, a[2]], couleur);
    c.ligne(b, [b[0], h, b[2]], couleur);
    c.ligne([a[0], h, a[2]], [b[0], h, b[2]], couleur);
    c.ligne([a[0], h * 0.5, a[2]], [b[0], h * 0.5, b[2]], couleur);
  }

  // Les flèches des rayons X qui bougent avec la voiture (refaites à chaque image).
  function construireRayonsXVoiture(monde) {
    const c = Circuit.Constructeur();
    const v = monde.voiture;
    const cos = Math.cos(v.angle), sin = Math.sin(v.angle);
    const h = 1.8;
    // La flèche de vitesse : sa longueur = la distance parcourue en 0,5 s.
    const L = v.vitesse * 0.5;
    const bout = [v.x + cos * L, h, v.z + sin * L];
    c.ligne([v.x, h, v.z], bout, COULEURS.xFleche);
    if (Math.abs(L) > 0.5) {
      const recul = Math.sign(L) * 1.2;
      c.ligne(bout, [bout[0] - cos * recul - sin * 0.8, h, bout[2] - sin * recul + cos * 0.8], COULEURS.xFleche);
      c.ligne(bout, [bout[0] - cos * recul + sin * 0.8, h, bout[2] - sin * recul - cos * 0.8], COULEURS.xFleche);
    }
    // Le trait vers le milieu de la route le plus proche : sa longueur, c'est « l'écart ».
    const m = Piste.pointA(monde.reperage.s);
    c.ligne([v.x, 0.3, v.z], [m.x, 0.3, m.z], COULEURS.xEcart);
    // La prochaine porte à passer, en vert.
    ajouterPorte(c, Piste.portes[monde.prochainePorte], COULEURS.xProchaine);

    // Étape 34 : la « carotte » du pilote adverse (le point qu'il vise) et sa voie.
    const adv = monde.adversaire;
    if (adv.cible) {
      c.ligne([adv.voiture.x, 1.2, adv.voiture.z], [adv.cible.x, 1.2, adv.cible.z], COULEURS.xCarotte);
      c.ligne([adv.cible.x, 0, adv.cible.z], [adv.cible.x, 3, adv.cible.z], COULEURS.xCarotte);
    }
    // Les cercles de choc des deux voitures (voir moteur/chocs.js).
    const r = C.chocs.rayon;
    for (const voiture of [v, adv.voiture]) {
      for (const centre of Circuit.Chocs.cercles(voiture, r)) {
        for (let i = 0; i < 16; i++) {
          const a1 = (i / 16) * Math.PI * 2, a2 = ((i + 1) / 16) * Math.PI * 2;
          c.ligne(
            [centre[0] + Math.cos(a1) * r, 0.3, centre[1] + Math.sin(a1) * r],
            [centre[0] + Math.cos(a2) * r, 0.3, centre[1] + Math.sin(a2) * r],
            monde.enContact ? COULEURS.rouge : COULEURS.xCercles
          );
        }
      }
    }
    return c.fin();
  }

  // ------------------------------------------------------------------ démarrage
  function initialiser(canvas) {
    if (!Projecteur.initialiser(canvas)) return false;
    rapport = canvas.width / canvas.height;
    const decor = construireDecor();
    const carrosserie = construireCarrosserie(COULEURS.carrosserie, COULEURS.carrosserieFoncee);
    const carrosserieAdverse = construireCarrosserie(COULEURS.adversaire, COULEURS.adversaireFoncee);
    const roue = construireRoue();
    maillages.decor = Projecteur.creerMaillage(decor);
    maillages.carrosserie = Projecteur.creerMaillage(carrosserie);
    maillages.carrosserieAdverse = Projecteur.creerMaillage(carrosserieAdverse);
    maillages.roue = Projecteur.creerMaillage(roue);
    maillages.ombre = Projecteur.creerMaillage(construireOmbre());
    maillages.rayonsX = Projecteur.creerMaillage(construireRayonsX(), true);
    maillages.rayonsXVoiture = Projecteur.creerMaillage(new Float32Array(0), true);
    // Le « fil de fer » : les arêtes de tous les triangles, pour voir de quoi tout est fait.
    maillages.filDecor = Projecteur.creerMaillage(Circuit.Constructeur.aretes(decor, COULEURS.xFil), true);
    maillages.filCarrosserie = Projecteur.creerMaillage(Circuit.Constructeur.aretes(carrosserie, COULEURS.xFil), true);
    maillages.filRoue = Projecteur.creerMaillage(Circuit.Constructeur.aretes(roue, COULEURS.xFil), true);
    return true;
  }

  function changerCamera() {
    camera.mode = MODES[(MODES.indexOf(camera.mode) + 1) % MODES.length];
    return camera.mode;
  }

  // ------------------------------------------------------------------ chaque image
  function placerCamera(monde, dt) {
    const v = monde.voiture;
    const R = C.camera;
    // La caméra tourne en douceur pour suivre l'angle de la voiture (par le chemin le plus court).
    let difference = v.angle - camera.angle;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    const douceur = camera.pret ? 1 - Math.exp(-R.souplesse * dt) : 1;
    camera.angle += difference * douceur;
    camera.pret = true;
    const cos = Math.cos(camera.angle), sin = Math.sin(camera.angle);

    let oeil, cible, haut = [0, 1, 0];
    if (camera.mode === "ciel") {
      // Vue d'hélicoptère, droit vers le bas : le « haut » de l'écran est l'avant de la voiture.
      oeil = [v.x, 110, v.z];
      cible = [v.x, 0, v.z];
      haut = [cos, 0, sin];
    } else if (camera.mode === "capot") {
      oeil = [v.x + Math.cos(v.angle) * 0.6, 1.5, v.z + Math.sin(v.angle) * 0.6];
      cible = [v.x + Math.cos(v.angle) * 20, 1.2, v.z + Math.sin(v.angle) * 20];
    } else {
      oeil = [v.x - cos * R.distance, R.hauteur, v.z - sin * R.distance];
      cible = [v.x + cos * R.regardDevant, 1, v.z + sin * R.regardDevant];
    }
    camera.x = oeil[0];
    camera.y = oeil[1];
    camera.z = oeil[2];
    const projection = M.perspective((R.champDeVision * Math.PI) / 180, rapport, 0.3, 1600);
    vueProjection = M.multiplier(projection, M.regarder(oeil, cible, haut));
    return oeil;
  }

  function dessiner(monde, options, dt) {
    const oeil = placerCamera(monde, dt);
    Projecteur.commencerImage({
      ciel: COULEURS.ciel,
      vueProjection,
      soleil: normaliser([0.4, 0.8, 0.3]),
      oeil,
      brouillard: true,
    });

    // Le décor ne bouge jamais : sa matrice « modèle » est l'identité.
    Projecteur.dessiner(maillages.decor, null);

    // Les deux voitures. En vue « capot », on ne dessine pas la nôtre (on est dedans !).
    if (camera.mode !== "capot") dessinerVoiture(monde.voiture, maillages.carrosserie, options.rayonsX);
    dessinerVoiture(monde.adversaire.voiture, maillages.carrosserieAdverse, options.rayonsX);

    if (options.rayonsX) {
      Projecteur.dessiner(maillages.filDecor, null);
      Projecteur.dessiner(maillages.rayonsX, null, { parDessus: true });
      Projecteur.remplacerSommets(maillages.rayonsXVoiture, construireRayonsXVoiture(monde));
      Projecteur.dessiner(maillages.rayonsXVoiture, null, { parDessus: true });
    }
  }

  // Une voiture : on la tourne de son angle, puis on la déplace à sa place. Ses 4 roues suivent.
  function dessinerVoiture(v, carrosserie, rayonsX) {
    const placeVoiture = M.multiplier(M.deplacement(v.x, 0, v.z), M.rotationY(-v.angle));
    Projecteur.dessiner(maillages.ombre, placeVoiture, { sansLumiere: true });
    Projecteur.dessiner(carrosserie, placeVoiture);
    if (rayonsX) Projecteur.dessiner(maillages.filCarrosserie, placeVoiture);
    for (const [rx, rz, avant] of [[1.35, -0.95, true], [1.35, 0.95, true], [-1.35, -0.95, false], [-1.35, 0.95, false]]) {
      const braquage = avant ? -v.volant * C.voiture.angleRoues : 0;
      const place = M.enchainer(placeVoiture, M.deplacement(rx, 0.38, rz), M.rotationY(braquage), M.rotationZ(-v.rotationRoues));
      Projecteur.dessiner(maillages.roue, place);
      if (rayonsX) Projecteur.dessiner(maillages.filRoue, place);
    }
  }

  function normaliser(v) {
    const n = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / n, v[1] / n, v[2] / n];
  }

  return {
    initialiser,
    dessiner,
    changerCamera,
    camera,
    get vueProjection() {
      return vueProjection;
    },
  };
})();
