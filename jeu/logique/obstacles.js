// 🧱 LES OBSTACLES : naissance, vie et mort
//
// Chaque obstacle vit trois moments :
//   1. il NAÎT juste à droite de l'écran (on l'ajoute à la liste monde.obstacles) ;
//   2. il VIT : à chaque pas de temps, il glisse vers la gauche à la vitesse du monde ;
//   3. il MEURT quand il sort à gauche : on le retire de la liste pour libérer la mémoire.
//
// Sans l'étape 3, la liste grandirait à l'infini et le jeu finirait par ralentir.
// (Regarde « objets en mémoire » dans le panneau Sous le capot.)

window.Jeu = window.Jeu || {};

Jeu.Obstacles = (function () {
  const C = Jeu.CONFIG;

  // Le « catalogue » des obstacles. Chacun est fait de blocs de 40 px.
  // scoreMin : à partir de quel score cet obstacle peut apparaître.
  const TYPES = {
    caisse: { l: 40, h: 40, matiere: "bois", scoreMin: 0 },
    tour: { l: 40, h: 80, matiere: "pierre", scoreMin: 4 },
    muret: { l: 80, h: 40, matiere: "bois", scoreMin: 8 },
  };

  function tirerEcart() {
    const O = C.obstacles;
    return O.ecartMin + Math.random() * (O.ecartMax - O.ecartMin);
  }

  function choisirType(score) {
    const possibles = Object.keys(TYPES).filter((nom) => score >= TYPES[nom].scoreMin);
    return possibles[Math.floor(Math.random() * possibles.length)];
  }

  function creer(monde) {
    const nom = choisirType(monde.score);
    const type = TYPES[nom];
    const obstacle = {
      id: monde.prochainId++,
      type: nom,
      matiere: type.matiere,
      x: C.ecran.largeur,
      y: C.solY - type.h,
      l: type.l,
      h: type.h,
      passe: false,
    };
    monde.obstacles.push(obstacle);
    monde.tempsAvantProchain = tirerEcart();
    Jeu.Evenements.emettre("apparition", { type: nom, id: obstacle.id, enMemoire: monde.obstacles.length });
  }

  function mettreAJour(monde, dt) {
    const emettre = Jeu.Evenements.emettre;
    const deplacement = monde.vitesse * dt;

    // Naissance
    monde.tempsAvantProchain -= dt;
    if (monde.tempsAvantProchain <= 0) creer(monde);

    // Vie
    for (const o of monde.obstacles) {
      o.x -= deplacement;
      if (!o.passe && o.x + o.l < monde.joueur.x) {
        o.passe = true;
        monde.score += 1;
        emettre("esquive", { type: o.type, score: monde.score });
      }
    }

    // Mort : on ne garde que les obstacles encore visibles
    const avant = monde.obstacles.length;
    monde.obstacles = monde.obstacles.filter((o) => o.x + o.l > 0);
    if (monde.obstacles.length < avant) {
      emettre("suppression", { enMemoire: monde.obstacles.length });
    }
  }

  return { TYPES, tirerEcart, mettreAJour };
})();
