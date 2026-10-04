// 🩻 LES RAYONS X : le dessinateur de traits invisibles
//
// Ce fichier fabrique les TRAITS qu'on voit aux rayons X (touche X) : le milieu et les bords de la route,
// les portes invisibles, la flèche de vitesse, la « carotte » du pilote adverse, les cercles de choc…
// Ces traits n'existent pas dans le jeu : ils montrent les nombres que le jeu utilise en secret.
//
// Les traits sont d'abord écrits avec notre petit constructeur (moteur/projecteur.js), puis donnés à
// Three.js sous forme de « segments » colorés.

window.Circuit = window.Circuit || {};

Circuit.RayonsX = (function () {
  const C = Circuit.CONFIG;
  const Piste = Circuit.Piste;
  const COULEURS = {
    milieu: [1, 0.89, 0.48], bords: [0.3, 0.9, 1], porte: [0.85, 0.45, 1], prochaine: [0.3, 1, 0.45],
    fleche: [0.3, 1, 0.45], ecart: [1, 0.6, 0.2], carotte: [0.45, 0.75, 1], cercles: [1, 1, 1], rouge: [1, 0.2, 0.2],
    nitro: [0.2, 0.95, 1],
  };

  // Transforme les traits du constructeur en un objet Three.js (des segments colorés).
  function versThree(nombres, objet) {
    const n = nombres.length / 9;
    const positions = new Float32Array(n * 3), couleurs = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      positions.set(nombres.subarray(i * 9, i * 9 + 3), i * 3);
      couleurs.set(nombres.subarray(i * 9 + 6, i * 9 + 9), i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(couleurs, 3));
    if (objet) {
      objet.geometry.dispose();
      objet.geometry = geo;
      return objet;
    }
    const lignes = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, transparent: true }));
    lignes.renderOrder = 10; // dessinées par-dessus tout le reste
    lignes.frustumCulled = false;
    return lignes;
  }

  // Une porte invisible : un cadre vertical en travers de la route.
  function porte(c, s, couleur) {
    const p = Piste.pointA(s);
    const e = C.piste.largeur / 2 + C.piste.largeurBordure;
    const a = [p.x - p.dz * e, 0, p.z + p.dx * e], b = [p.x + p.dz * e, 0, p.z - p.dx * e];
    const h = 5;
    c.ligne(a, [a[0], h, a[2]], couleur);
    c.ligne(b, [b[0], h, b[2]], couleur);
    c.ligne([a[0], h, a[2]], [b[0], h, b[2]], couleur);
    c.ligne([a[0], h * 0.5, a[2]], [b[0], h * 0.5, b[2]], couleur);
  }

  // Les traits qui ne bougent pas : la route et les portes (circuit), les formes et les loopings (parcours).
  function fixes(carte) {
    if (carte === "parcours") return versThree(Circuit.DecorParcours.rayonsX({ bords: COULEURS.bords, entree: COULEURS.prochaine, rail: COULEURS.milieu }));
    if (carte === "grand") return versThree(Circuit.DecorGrandParcours.rayonsX({ bords: COULEURS.bords, danger: COULEURS.rouge, nitro: COULEURS.nitro, saut: COULEURS.milieu }));
    if (carte === "ville") {
      // Étape 39 : le milieu des rues (en jaune) et le contour des immeubles (en bleu).
      const c = Circuit.Constructeur();
      const Ville = Circuit.Ville;
      const a = Ville.rue(0), b = Ville.rue(Ville.n - 1);
      for (let k = 0; k < Ville.n; k++) {
        c.ligne([a, 0.3, Ville.rue(k)], [b, 0.3, Ville.rue(k)], COULEURS.milieu);
        c.ligne([Ville.rue(k), 0.3, a], [Ville.rue(k), 0.3, b], COULEURS.milieu);
      }
      for (const im of Ville.immeubles) {
        const L = im.demiLongueur, W = im.demiLargeur, h = 0.4;
        const coins = [[im.x - L, h, im.z - W], [im.x + L, h, im.z - W], [im.x + L, h, im.z + W], [im.x - L, h, im.z + W]];
        for (let i = 0; i < 4; i++) c.ligne(coins[i], coins[(i + 1) % 4], COULEURS.bords);
      }
      return versThree(c.fin());
    }
    const c = Circuit.Constructeur();
    const morceaux = Math.round(Piste.longueurTour / 3);
    const pas = Piste.longueurTour / morceaux;
    const demi = C.piste.largeur / 2;
    const cote = (s, e, y) => {
      const p = Piste.pointA(s);
      return [p.x + p.dz * e, y, p.z - p.dx * e];
    };
    for (let i = 0; i < morceaux; i++) {
      const s0 = i * pas, s1 = (i + 1) * pas;
      c.ligne(cote(s0, 0, 0.2), cote(s1, 0, 0.2), COULEURS.milieu);
      c.ligne(cote(s0, -demi, 0.2), cote(s1, -demi, 0.2), COULEURS.bords);
      c.ligne(cote(s0, demi, 0.2), cote(s1, demi, 0.2), COULEURS.bords);
    }
    // Le squelette caché au centre de l'ovale (voir logique/piste.js) et quelques rayons.
    const D = C.piste.longueurDroite / 2;
    c.ligne([-D, 0.3, 0], [D, 0.3, 0], COULEURS.ecart);
    for (const x of [-D, 0, D]) {
      c.ligne([x, 0.3, 0], [x, 0.3, C.piste.rayon], COULEURS.ecart);
      c.ligne([x, 0.3, 0], [x, 0.3, -C.piste.rayon], COULEURS.ecart);
    }
    for (const s of Piste.portes) porte(c, s, COULEURS.porte);
    return versThree(c.fin());
  }

  // Les traits qui bougent avec les voitures (refaits à chaque image).
  function mobiles(monde, objet) {
    const c = Circuit.Constructeur();
    const v = monde.voiture;
    const cos = Math.cos(v.angle), sin = Math.sin(v.angle);
    const h = (v.y || 0) + 1.8;
    // La flèche de vitesse : sa longueur = la distance parcourue en 0,5 s.
    const L = v.vitesse * 0.5;
    const bout = [v.x + cos * L, h, v.z + sin * L];
    c.ligne([v.x, h, v.z], bout, COULEURS.fleche);
    if (Math.abs(L) > 0.5) {
      const recul = Math.sign(L) * 1.2;
      c.ligne(bout, [bout[0] - cos * recul - sin * 0.8, h, bout[2] - sin * recul + cos * 0.8], COULEURS.fleche);
      c.ligne(bout, [bout[0] - cos * recul + sin * 0.8, h, bout[2] - sin * recul - cos * 0.8], COULEURS.fleche);
    }
    if (monde.carte === "course") {
      // Le trait vers le milieu de la route le plus proche : sa longueur, c'est « l'écart ».
      const m = Piste.pointA(monde.reperage.s);
      c.ligne([v.x, 0.3, v.z], [m.x, 0.3, m.z], COULEURS.ecart);
      porte(c, Piste.portes[monde.prochainePorte], COULEURS.prochaine);
    }
    // Un trait jaune entre la voiture et le sol : sa longueur, c'est la hauteur au-dessus du sol.
    const sol = monde.carte === "grand" ? Circuit.GrandParcours.solDeBase(v.x, v.z) : 0;
    if ((v.y || 0) - sol > 0.05) c.ligne([v.x, sol, v.z], [v.x, v.y, v.z], COULEURS.milieu);
    // Étape 40 : en l'air, la COURBE DU SAUT prévue (une parabole) : où la voiture va passer dans les 2 prochaines secondes.
    if (v.enLAir) {
      let x = v.x, y = v.y, z = v.z, vy = v.vy;
      const dt = 0.1;
      for (let i = 0; i < 20; i++) {
        const avant = [x, y, z];
        x += cos * v.vitesse * dt;
        z += sin * v.vitesse * dt;
        vy -= C.parcours.gravite * dt;
        y += vy * dt;
        c.ligne(avant, [x, y, z], COULEURS.ecart);
      }
    }
    // Étape 39 : pour chaque voiture de la circulation, un trait vers le carrefour où elle va.
    for (const cv of monde.circulation || []) {
      const cible = [Circuit.Ville.rue(cv.vers[0]), 0.5, Circuit.Ville.rue(cv.vers[1])];
      c.ligne([cv.voiture.x, 0.5, cv.voiture.z], cible, cv.feuAttendu ? COULEURS.rouge : COULEURS.carotte);
    }
    // La « carotte » du pilote adverse (le point qu'il vise).
    const adv = monde.adversaire;
    if (adv && adv.cible) {
      c.ligne([adv.voiture.x, 1.2, adv.voiture.z], [adv.cible.x, 1.2, adv.cible.z], COULEURS.carotte);
      c.ligne([adv.cible.x, 0, adv.cible.z], [adv.cible.x, 3, adv.cible.z], COULEURS.carotte);
    }
    // Les cercles de choc (voir moteur/chocs.js).
    const r = C.chocs.rayon;
    for (const voiture of adv ? [v, adv.voiture] : [v]) {
      for (const centre of Circuit.Chocs.cercles(voiture, r)) {
        for (let i = 0; i < 16; i++) {
          const a1 = (i / 16) * Math.PI * 2, a2 = ((i + 1) / 16) * Math.PI * 2;
          const y = (voiture.y || 0) + 0.3;
          c.ligne(
            [centre[0] + Math.cos(a1) * r, y, centre[1] + Math.sin(a1) * r],
            [centre[0] + Math.cos(a2) * r, y, centre[1] + Math.sin(a2) * r],
            monde.enContact ? COULEURS.rouge : COULEURS.cercles
          );
        }
      }
    }
    return versThree(c.fin(), objet);
  }

  return { fixes, mobiles };
})();
