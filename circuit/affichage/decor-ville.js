// 🏗️ LE DÉCOR DE LA VILLE : l'architecte
//
// Étape 39. Il fabrique la ville avec Three.js : le goudron des rues, les lignes blanches et les passages
// piétons, les trottoirs, les immeubles (une boîte avec une façade à fenêtres collée dessus, et un toit),
// les parcs (herbe, étang, arbres, allées), les feux tricolores à chaque carrefour et les lampadaires.
//
// Les FEUX changent de couleur pendant le jeu : chaque lampe a un matériau qu'on « allume » (il brille)
// ou qu'on « éteint ». La couleur vient de logique/circulation.js : ce que tu vois, c'est ce que les
// voitures de la circulation respectent.

window.Circuit = window.Circuit || {};

Circuit.DecorVille = (function () {
  const V = Circuit.CONFIG.ville;

  function repeter(texture, x, y) {
    const t = texture.clone();
    t.needsUpdate = true;
    t.repeat.set(x, y);
    return t;
  }

  function plat(largeur, profondeur, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largeur, profondeur), materiau);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    return m;
  }

  function construire() {
    const D = Circuit.DecorCircuit;
    const T = Circuit.Textures;
    const mat = D.mat;
    const Ville = Circuit.Ville;
    const g = new THREE.Group();
    const taille = Ville.taille;

    // Autour de la ville : de l'herbe. Dans la ville : le goudron des rues (les pâtés sont posés dessus).
    g.add(D.pelouse(taille + 900, T.herbe(), (taille + 900) / 12));
    g.add(plat(taille, taille, mat({ map: repeter(T.goudron(), taille / 10, taille / 10), roughness: 0.85 }), 0, 0.02, 0));

    // Les lignes blanches au milieu des rues, et les passages piétons aux carrefours. Il y en a plus de
    // 1 500 : on les dessine en « instances » (un seul rectangle blanc, et la place + la taille de chacun).
    const traits = [];
    for (let k = 0; k < Ville.n; k++) {
      for (let l = 0; l < Ville.n - 1; l++) {
        const a = Ville.rue(l) + V.largeurRue / 2 + 6, b = Ville.rue(l + 1) - V.largeurRue / 2 - 6;
        for (let s = a; s < b; s += 6) traits.push([s + 1.5, Ville.rue(k), 3, 0.25], [Ville.rue(k), s + 1.5, 0.25, 3]);
      }
      for (let l = 0; l < Ville.n; l++) {
        const cx = Ville.rue(k), cz = Ville.rue(l);
        for (const cote of [-1, 1]) {
          for (let b = -6; b <= 6; b += 2) traits.push([cx + cote * (V.largeurRue / 2 + 2), cz + b, 3.2, 0.9], [cx + b, cz + cote * (V.largeurRue / 2 + 2), 0.9, 3.2]);
        }
      }
    }
    const geoTrait = new THREE.PlaneGeometry(1, 1);
    geoTrait.rotateX(-Math.PI / 2);
    const peinture = new THREE.InstancedMesh(geoTrait, mat({ color: 0xf2f2f2, roughness: 0.6 }), traits.length);
    const m4 = new THREE.Matrix4();
    traits.forEach(([x, z, lx, lz], i) => peinture.setMatrixAt(i, m4.makeScale(lx, 1, lz).setPosition(x, 0.03, z)));
    peinture.receiveShadow = true;
    g.add(peinture);

    // Les pâtés de maisons : un trottoir tout autour, puis un parc ou 4 immeubles.
    const trottoir = mat({ map: repeter(T.trottoir(), V.tailleBloc / 3, V.tailleBloc / 3), roughness: 0.9 });
    const herbe = mat({ map: repeter(T.herbe(), 5, 5) });
    for (let i = 0; i < V.blocs; i++) {
      for (let j = 0; j < V.blocs; j++) {
        const cx = (Ville.rue(i) + Ville.rue(i + 1)) / 2, cz = (Ville.rue(j) + Ville.rue(j + 1)) / 2;
        const pave = new THREE.Mesh(new THREE.BoxGeometry(V.tailleBloc, 0.12, V.tailleBloc), trottoir);
        pave.position.set(cx, 0.06, cz);
        pave.receiveShadow = true;
        g.add(pave);
        const interieur = V.tailleBloc - 2 * V.trottoir;
        if (Ville.parc(i, j)) {
          g.add(plat(interieur, interieur, herbe, cx, 0.13, cz));
          // Les allées en croix, et l'étang au milieu.
          const allee = mat({ map: repeter(T.terre(), 6, 1) });
          g.add(plat(interieur, 4, allee, cx, 0.14, cz));
          g.add(plat(4, interieur, allee, cx, 0.14, cz));
          const etang = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ color: 0x2f6f9e, metalness: 0.3, roughness: 0.08 }));
          etang.rotation.x = -Math.PI / 2;
          etang.position.set(cx, 0.15, cz);
          g.add(etang);
          const bord = new THREE.Mesh(new THREE.TorusGeometry(9.2, 0.35, 8, 40), mat({ color: 0xa8a49a }));
          bord.rotation.x = Math.PI / 2;
          bord.position.set(cx, 0.18, cz);
          g.add(bord);
        } else {
          // La ruelle en croix, en goudron.
          const goudron = mat({ map: repeter(T.goudron(), 6, 1) });
          g.add(plat(interieur, V.ruelle, goudron, cx, 0.13, cz));
          g.add(plat(V.ruelle, interieur, goudron, cx, 0.131, cz));
        }
      }
    }

    // Les immeubles : la façade à fenêtres sur les 4 côtés, un toit sombre, et quelques machines sur le toit.
    const toit = mat({ map: repeter(T.toit(), 4, 4) });
    const machine = mat({ color: 0x9a9da2, metalness: 0.5, roughness: 0.5 });
    for (const b of Ville.immeubles) {
      const L = 2 * b.demiLongueur, P = 2 * b.demiLargeur, H = b.hauteur;
      const faceX = mat({ map: repeter(T.facade(b.style), P / 4, H / 3.5), roughness: 0.6, metalness: b.style === 3 ? 0.5 : 0.1 });
      const faceZ = mat({ map: repeter(T.facade(b.style), L / 4, H / 3.5), roughness: 0.6, metalness: b.style === 3 ? 0.5 : 0.1 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(L, H, P), [faceX, faceX, toit, toit, faceZ, faceZ]);
      m.position.set(b.x, H / 2 + 0.12, b.z);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      const clim = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 2.5), machine);
      clim.position.set(b.x + L * 0.2, H + 0.87, b.z - P * 0.2);
      clim.castShadow = true;
      g.add(clim);
    }

    // Les arbres des parcs (ce sont aussi des obstacles solides).
    g.add(D.foret(Ville.arbres.map((a) => [a.x, a.z, a.taille])));

    // Les feux tricolores : à 2 coins de chaque carrefour, un poteau et 2 boîtiers (un pour chaque rue).
    const feux = construireFeux(g);

    // Les lampadaires, le long des rues.
    const lampadaires = [];
    for (let k = 0; k < Ville.n; k++) {
      for (let l = 0; l < Ville.n - 1; l++) {
        const s = (Ville.rue(l) + Ville.rue(l + 1)) / 2;
        lampadaires.push([s, Ville.rue(k) - V.largeurRue / 2 - 1], [Ville.rue(k) + V.largeurRue / 2 + 1, s]);
      }
    }
    const poteaux = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), mat({ color: 0x3a3d42, metalness: 0.6, roughness: 0.4 }), lampadaires.length);
    const lampes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffe9a8, emissiveIntensity: 0.8 }), lampadaires.length);
    lampadaires.forEach(([x, z], i) => {
      poteaux.setMatrixAt(i, m4.makeTranslation(x, 3.5, z));
      lampes.setMatrixAt(i, m4.makeTranslation(x, 7.1, z));
    });
    poteaux.castShadow = true;
    g.add(poteaux, lampes);

    for (const c of D.cloture(taille / 2 + 22)) g.add(c);

    // Chaque image : on allume les bonnes lampes des feux.
    function maj(temps) {
      for (const groupe of feux) {
        for (const axe of ["x", "z"]) {
          const couleur = Circuit.Circulation.feu(temps, groupe.decalage, 0, axe);
          for (const nom of ["rouge", "orange", "vert"]) groupe[axe][nom].emissiveIntensity = couleur === nom ? 3 : 0.04;
        }
      }
    }
    return { groupe: g, maj };
  }

  // Les feux. Tous les carrefours qui ont le même décalage (i + j) changent de couleur en même temps :
  // ils partagent les mêmes matériaux de lampes. Poteaux, boîtiers et lampes sont des « instances ».
  function construireFeux(g) {
    const Ville = Circuit.Ville;
    const COULEURS = { rouge: 0xff2a1a, orange: 0xffa21a, vert: 0x2aff5a };
    const noir = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.5 });
    const poteaux = [], boitiers = [];
    const lampes = {}; // lampes["3-x-rouge"] = les positions des lampes rouges des feux « axe x » du groupe 3
    for (let i = 0; i < Ville.n; i++) {
      for (let j = 0; j < Ville.n; j++) {
        const cx = Ville.rue(i), cz = Ville.rue(j);
        const e = V.largeurRue / 2 + 1;
        for (const [px, pz, sens] of [[cx - e, cz - e, 1], [cx + e, cz + e, -1]]) {
          poteaux.push([px, 2.1, pz]);
          // Un boîtier tourné vers les voitures de la rue est-ouest (axe x), un autre vers la rue nord-sud (axe z).
          for (const axe of ["x", "z"]) {
            const bx = px + (axe === "z" ? sens * 0.3 : 0), bz = pz + (axe === "x" ? sens * 0.3 : 0);
            boitiers.push([bx, 4.5, bz]);
            ["rouge", "orange", "vert"].forEach((nom, k) => {
              const cle = (i + j) + "-" + axe + "-" + nom;
              (lampes[cle] = lampes[cle] || []).push([bx + (axe === "x" ? -sens * 0.2 : 0), 4.85 - k * 0.35, bz + (axe === "z" ? -sens * 0.2 : 0)]);
            });
          }
        }
      }
    }
    const instances = (geo, materiau, positions) => {
      const im = new THREE.InstancedMesh(geo, materiau, positions.length);
      const m4 = new THREE.Matrix4();
      positions.forEach(([x, y, z], k) => im.setMatrixAt(k, m4.makeTranslation(x, y, z)));
      im.castShadow = true;
      g.add(im);
    };
    instances(new THREE.CylinderGeometry(0.1, 0.1, 4.2, 8), noir, poteaux);
    instances(new THREE.BoxGeometry(0.4, 1.15, 0.4), noir, boitiers);
    const geoLampe = new THREE.SphereGeometry(0.15, 10, 8);
    const groupes = [];
    for (const [cle, positions] of Object.entries(lampes)) {
      const [decalage, axe, nom] = cle.split("-");
      const gr = (groupes[decalage] = groupes[decalage] || { decalage: +decalage, x: {}, z: {} });
      gr[axe][nom] = new THREE.MeshStandardMaterial({ color: COULEURS[nom], emissive: COULEURS[nom], emissiveIntensity: 0.04, roughness: 0.3 });
      instances(geoLampe, gr[axe][nom], positions);
    }
    return groupes.filter(Boolean);
  }

  return { construire };
})();
