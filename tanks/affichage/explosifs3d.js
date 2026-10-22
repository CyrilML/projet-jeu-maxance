// 🧨 LES EXPLOSIFS EN 3D : le maquettiste du génie (demande 98)
//
// ✍️ Il dessine ce que le sapeur (logique/explosifs.js) a posé :
//   - la MINE ANTICHAR : un gros disque vert olive à moitié enterré, avec son bouton au milieu ;
//   - le C4 : un pain beige avec son détonateur et une petite LUMIÈRE ROUGE qui clignote (collé sur un véhicule, il roule avec lui) ;
//   - la CLAYMORE : une boîte bombée vert olive sur ses 2 petits pieds, tournée vers l'ennemi ;
//   - le NUAGE DU FUMIGÈNE : des bouffées de fumée blanche (les « autocollants » de l'imprimerie, affichage/particules.js),
//     plus ou moins nombreuses selon la qualité (config.js : « posesEnBataille.nuage.bouffees ») : pas de lag !
// On les dessine 2 fois plus gros que les vrais (sinon on ne les verrait pas). Une seule forme par sorte, recopiée.
// Comme tout l'affichage, il ne touche jamais au monde : il le regarde.

window.Tanks = window.Tanks || {};

Tanks.Explosifs3D = (function () {
  const C = Tanks.CONFIG, N = C.posesEnBataille.nuage;
  let pret = false, scene = null, FUMEE = null;
  const formes = { mine: [], c4: [], claymore: [] }; // les maquettes déjà fabriquées (réutilisées)
  const nuages = new Map(); // nuage du monde → { bouffées en attente } (côté dessin seulement)
  const bilan = { poses: 0, nuages: 0, bouffees: 0 };

  function preparer(s) {
    scene = s;
    const P = Tanks.Particules;
    FUMEE = { image: P.IMG.fumee2, mode: P.FACE, eclaire: true, vie: N.vie, taille: [0.5, 1.1], couleur: [0.8, 0.82, 0.83], opacite: 0.92, frein: 1.2, monte: 0.25, vent: 0.12, tourne: 0.15, entree: 0.15, sortie: 1.3, portee: 10 };
    pret = true;
  }
  const mat = (couleur, rugueux, metal) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugueux, metalness: metal || 0 });
  let M = null;
  function matieres() {
    return (M = M || { olive: mat(0x4b5434, 0.8), fonce: mat(0x2e3322, 0.7, 0.2), beige: mat(0xc9b88a, 0.9), noir: mat(0x1a1a1a, 0.5, 0.4), rouge: new THREE.MeshBasicMaterial({ color: 0xff2020 }) });
  }
  // Fabriquer une maquette de la sorte voulue.
  function fabriquer(sorte) {
    const m = matieres(), g = new THREE.Group(), ajouter = (geo, matiere, x, y, z) => { const o = new THREE.Mesh(geo, matiere); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    if (sorte === "mine") {
      ajouter(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 16), m.olive, 0, 0.03, 0);
      ajouter(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), m.fonce, 0, 0.085, 0);
    } else if (sorte === "c4") {
      ajouter(new THREE.BoxGeometry(0.26, 0.06, 0.14), m.beige, 0, 0.03, 0);
      ajouter(new THREE.BoxGeometry(0.06, 0.03, 0.05), m.noir, 0.05, 0.075, 0);
      g.lumiere = ajouter(new THREE.SphereGeometry(0.016, 6, 4), m.rouge, 0.05, 0.1, 0.02);
    } else {
      ajouter(new THREE.BoxGeometry(0.05, 0.12, 0.22), m.olive, 0, 0.13, 0);
      ajouter(new THREE.BoxGeometry(0.06, 0.02, 0.12), m.fonce, 0, 0.2, 0);
      for (const z of [-0.07, 0.07]) ajouter(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 4), m.noir, -0.02, 0.05, z);
    }
    g.scale.setScalar(2);
    scene.add(g);
    return g;
  }

  // À chaque image (affichage/scene.js l'appelle).
  function maj(monde, dt, s) {
    if (!pret) preparer(s);
    const compte = { mine: 0, c4: 0, claymore: 0 }, t = performance.now() / 1000;
    for (const e of monde.explosifs || []) {
      const l = formes[e.sorte];
      if (!l) continue;
      const g = l[compte[e.sorte]] || (l[compte[e.sorte]] = fabriquer(e.sorte));
      compte[e.sorte]++;
      g.visible = true;
      g.position.set(e.x, e.y + (e.sorte === "mine" ? -0.02 : 0), e.z);
      g.rotation.y = -e.angle;
      if (g.lumiere) g.lumiere.visible = t % 1 < 0.3; // (la petite lumière rouge du C4 clignote)
    }
    for (const sorte in formes) for (let i = compte[sorte]; i < formes[sorte].length; i++) formes[sorte][i].visible = false;
    bilan.poses = compte.mine + compte.c4 + compte.claymore;
    // les nuages de fumée : des bouffées (un gros paquet quand il naît, puis quelques-unes par seconde)
    const P = Tanks.Particules, liste = monde.fumees || [], parSeconde = N.bouffees[Math.min(N.bouffees.length - 1, P.niveau || 0)];
    for (const f of liste) {
      let n = nuages.get(f);
      if (!n) nuages.set(f, (n = { attente: parSeconde * 3 }));
      if (f.age < f.duree - 2) n.attente += parSeconde * dt;
      while (n.attente >= 1) {
        n.attente--;
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * f.rayon * 0.65;
        if (P.emettre(FUMEE, f.x + Math.cos(a) * r, f.y + 0.6 + Math.random() * 2.2, f.z + Math.sin(a) * r, Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6, f.rayon * (0.75 + Math.random() * 0.4)) !== undefined) bilan.bouffees++;
      }
    }
    for (const f of nuages.keys()) if (!liste.includes(f)) nuages.delete(f);
    bilan.nuages = liste.length;
  }

  return { maj, bilan };
})();
