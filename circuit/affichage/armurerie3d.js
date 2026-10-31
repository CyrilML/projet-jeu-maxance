// 🛠️ L'ARMURERIE EN 3D : le sculpteur d'armes
//
// Étape 138. Ce fichier fabrique, avec des boîtes et des cylindres (des formes « low-poly ») :
//   - la DEVANTURE de l'armurerie, avec sa grande enseigne « ARMURERIE » (on la voit de loin) ;
//   - le STAND DE TIR du parc d'en face : des caisses en bois et des cibles rouges et blanches ;
//   - (jusqu'à l'étape 139) l'arme dans la main du personnage : depuis l'étape 140, c'est affichage/armes-detail3d.js ;
//   - les grenades qui volent, les dynamites posées, et le trait jaune de chaque balle.
// Étape 139 : plus de 50 armes ! Le sculpteur a UN PATRON par forme (pistolet, fusil, arc, hache…) ; chaque arme
// prend le patron de sa forme avec SA couleur et SA taille (config.js). L'arme en main est 2,4 fois plus grande
// (✍️ avant, on ne la voyait pas). Il dessine aussi les flèches, roquettes, obus, le boomerang, les flammes du
// lance-flammes, le feu sur les voitures, la fumée des fumigènes, les mines et le C4.
// Il lit le monde (logique/armurerie.js) mais ne le change jamais.

window.Circuit = window.Circuit || {};

Circuit.Armurerie3D = (function () {
  const C = Circuit.CONFIG;
  const A = C.armurerie;
  let r3 = null; // tout ce qui est fabriqué (une seule fois)
  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6 }, o));
  function boite(l, h, p, m, x, y, z) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), m);
    b.position.set(x || 0, y || 0, z || 0);
    b.castShadow = true;
    return b;
  }
  function cylindre(r, h, m, x, y, z, couche, r2) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 === undefined ? r : r2, h, 12), m);
    c.position.set(x || 0, y || 0, z || 0);
    if (couche) c.rotation.z = -Math.PI / 2; // couché le long de x (le haut du cylindre vers l'avant)
    return c;
  }
  function boule(r, m, x, y, z) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
    b.position.set(x || 0, y || 0, z || 0);
    return b;
  }
  function panneauTexte(texte, fond, couleur, largeur, hauteur) {
    const toile = document.createElement("canvas");
    toile.width = 512;
    toile.height = 112;
    const ctx = toile.getContext("2d");
    ctx.fillStyle = fond;
    ctx.fillRect(0, 0, 512, 112);
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 100);
    ctx.fillStyle = couleur;
    ctx.font = "bold 62px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texte, 256, 58, 480);
    const tex = new THREE.CanvasTexture(toile);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(largeur, hauteur), mat({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.5, side: THREE.DoubleSide }));
  }

  // ---------------------------------------------------------------- les PATRONS des armes
  // (repère : x = vers l'avant, y = en haut ; 0 = la main). Chaque patron reçoit la fiche de l'arme.
  let M = null; // les matériaux communs
  function materiaux() {
    M = M || {
      noir: mat({ color: 0x151515 }),
      metal: mat({ color: 0x2b2d33, metalness: 0.8, roughness: 0.35 }),
      acier: mat({ color: 0xd8dde6, metalness: 1, roughness: 0.2 }),
      bois: mat({ color: 0x6b3a1c }),
      or: mat({ color: 0xc9a227, metalness: 1, roughness: 0.3 }),
      vert: mat({ color: 0x3f5a2a }),
      rouge: mat({ color: 0xc8261e }),
      feu: new THREE.MeshBasicMaterial({ color: 0xff8a20 }),
      corde: mat({ color: 0xeeeeee }),
    };
    return M;
  }
  const PATRONS = {
    pistolet: (c, m) => [boite(0.3, 0.09, 0.06, c, 0.12, 0.05, 0), boite(0.08, 0.17, 0.06, m.noir, -0.01, -0.07, 0)],
    revolver: (c, m) => [boite(0.36, 0.07, 0.06, c, 0.17, 0.06, 0), cylindre(0.05, 0.1, m.metal, 0.03, 0.05, 0, true), boite(0.08, 0.17, 0.06, m.bois, -0.04, -0.07, 0)],
    silex: (c, m) => [cylindre(0.025, 0.42, m.metal, 0.22, 0.06, 0, true), boite(0.22, 0.08, 0.06, c, -0.02, 0.03, 0), boite(0.09, 0.18, 0.07, c, -0.1, -0.06, 0), boite(0.04, 0.06, 0.02, m.or, 0.02, 0.11, 0)],
    mitraillette: (c, m) => [boite(0.42, 0.12, 0.07, c, 0.12, 0.06, 0), boite(0.05, 0.24, 0.05, m.noir, 0.14, -0.12, 0), cylindre(0.022, 0.16, m.metal, 0.4, 0.07, 0, true), boite(0.07, 0.15, 0.06, m.noir, -0.02, -0.06, 0), boite(0.18, 0.06, 0.04, m.noir, -0.17, 0.05, 0)],
    fusil: (c, m) => {
      const chargeur = boite(0.07, 0.24, 0.05, m.noir, 0.12, -0.13, 0);
      chargeur.rotation.z = 0.3; // le chargeur courbé
      return [boite(0.55, 0.11, 0.07, c, 0.12, 0.06, 0), boite(0.3, 0.13, 0.06, c, -0.3, 0.02, 0), cylindre(0.022, 0.4, m.metal, 0.58, 0.08, 0, true), chargeur, boite(0.07, 0.15, 0.06, m.noir, -0.02, -0.05, 0), boite(0.2, 0.03, 0.03, m.noir, 0.1, 0.13, 0)];
    },
    pompe: (c, m) => [cylindre(0.03, 0.85, m.metal, 0.4, 0.08, 0, true), cylindre(0.035, 0.32, m.bois, 0.38, 0.0, 0, true), boite(0.25, 0.12, 0.07, c, -0.02, 0.05, 0), boite(0.32, 0.12, 0.06, m.bois, -0.3, 0.0, 0)],
    precision: (c, m) => [cylindre(0.025, 0.95, m.metal, 0.55, 0.07, 0, true), boite(0.45, 0.11, 0.07, c, 0.0, 0.04, 0), boite(0.32, 0.14, 0.06, c, -0.36, 0.0, 0), cylindre(0.045, 0.34, m.noir, 0.05, 0.17, 0, true), boule(0.05, mat({ color: 0x66aaff, emissive: 0x112244 }), 0.22, 0.17, 0), boite(0.02, 0.2, 0.02, m.noir, 0.7, -0.06, 0.05), boite(0.02, 0.2, 0.02, m.noir, 0.7, -0.06, -0.05)],
    mitrailleuse: (c, m) => [boite(0.6, 0.16, 0.1, c, 0.1, 0.06, 0), cylindre(0.045, 0.6, m.metal, 0.68, 0.08, 0, true), boite(0.16, 0.16, 0.14, mat({ color: 0x4a5a3a }), 0.05, -0.12, 0.02), boite(0.3, 0.14, 0.07, c, -0.36, 0.02, 0), boite(0.02, 0.22, 0.02, m.noir, 0.8, -0.06, 0.06), boite(0.02, 0.22, 0.02, m.noir, 0.8, -0.06, -0.06)],
    minigun: (c, m) => {
      const morceaux = [boite(0.3, 0.22, 0.22, c, -0.05, 0.06, 0), cylindre(0.06, 0.08, m.metal, 0.75, 0.06, 0, true), boite(0.06, 0.2, 0.05, m.noir, -0.05, -0.12, 0)];
      for (let i = 0; i < 6; i++) morceaux.push(cylindre(0.022, 0.8, m.metal, 0.45, 0.06 + Math.cos(i) * 0.06, Math.sin(i) * 0.06, true));
      return morceaux;
    },
    lanceFlammes: (c, m) => [cylindre(0.035, 0.75, m.metal, 0.35, 0.06, 0, true), cylindre(0.05, 0.08, m.noir, 0.75, 0.06, 0, true), boule(0.03, m.feu, 0.82, 0.06, 0), cylindre(0.07, 0.35, c, -0.05, -0.1, 0.06), cylindre(0.07, 0.35, c, -0.05, -0.1, -0.08), boite(0.07, 0.14, 0.05, m.noir, 0.0, -0.02, 0)],
    tube: (c, m) => [cylindre(0.08, 1.15, c, 0.2, 0.12, 0, true), cylindre(0.06, 0.25, mat({ color: 0x556b2f }), 0.85, 0.12, 0, true, 0.11), boite(0.06, 0.16, 0.05, m.noir, 0.05, -0.03, 0), boite(0.06, 0.16, 0.05, m.noir, 0.3, -0.03, 0), boite(0.12, 0.08, 0.03, m.noir, 0.15, 0.24, 0.06)],
    lanceGrenades: (c, m) => [cylindre(0.06, 0.45, m.metal, 0.35, 0.07, 0, true), cylindre(0.1, 0.18, m.noir, 0.08, 0.07, 0, true), boite(0.32, 0.12, 0.07, c, -0.25, 0.02, 0), boite(0.07, 0.15, 0.06, m.noir, 0.0, -0.06, 0)],
    arc: (c, m) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 6, 20, Math.PI), c);
      arc.rotation.z = -Math.PI / 2; // la courbe vers l'avant
      arc.scale.x = 0.45;
      return [arc, boite(0.006, 1.1, 0.006, m.corde, 0, 0, 0), boite(0.75, 0.012, 0.012, m.bois, 0.3, 0, 0), new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), m.acier).translateX(0.7).rotateZ(-Math.PI / 2)];
    },
    arbalete: (c, m) => {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 6, 16, Math.PI), m.metal);
      arc.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
      arc.scale.x = 0.4;
      arc.position.x = 0.38;
      return [boite(0.62, 0.07, 0.07, c, 0.12, 0.04, 0), arc, boite(0.006, 0.006, 0.64, m.corde, 0.38, 0.06, 0), boite(0.4, 0.015, 0.015, m.acier, 0.3, 0.09, 0), boite(0.07, 0.15, 0.06, c, -0.06, -0.06, 0)];
    },
    mousquet: (c, m) => [boite(0.95, 0.08, 0.06, c, 0.05, 0.02, 0), cylindre(0.022, 0.9, m.metal, 0.35, 0.08, 0, true), boite(0.25, 0.16, 0.06, c, -0.48, -0.02, 0), boite(0.02, 0.1, 0.07, m.or, 0.3, 0.04, 0), boite(0.02, 0.1, 0.07, m.or, 0.6, 0.04, 0)],
    tromblon: (c, m) => [cylindre(0.08, 0.6, c, 0.35, 0.07, 0, true, 0.03), boite(0.35, 0.09, 0.06, m.bois, -0.05, 0.03, 0), boite(0.2, 0.16, 0.06, m.bois, -0.28, -0.02, 0)],
    lame: (c, m, f) => [boite(f.taille, 0.07, 0.02, c, 0.12 + f.taille / 2, 0, 0), boite(0.04, 0.05, 0.26 * Math.max(0.5, f.taille), m.or, 0.1, 0, 0), boite(0.18, 0.05, 0.05, f.id === "katana" ? m.noir : m.bois, 0, 0, 0)],
    hache: (c, m) => [cylindre(0.025, 0.85, m.bois, 0.3, 0, 0, true), boite(0.1, 0.24, 0.025, c, 0.66, 0.06, 0)],
    marteau: (c, m) => [cylindre(0.025, 0.85, m.bois, 0.3, 0, 0, true), boite(0.18, 0.13, 0.13, c, 0.72, 0, 0)],
    masse: (c, m) => {
      const morceaux = [cylindre(0.025, 0.75, m.bois, 0.25, 0, 0, true), boule(0.1, c, 0.68, 0, 0)];
      for (let i = 0; i < 6; i++) {
        const pique = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 6), m.acier);
        const a = (i / 6) * Math.PI * 2;
        pique.position.set(0.68 + Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0);
        pique.rotation.z = a - Math.PI / 2;
        morceaux.push(pique);
      }
      return morceaux;
    },
    lance: (c, m) => [cylindre(0.022, 1.9, m.bois, 0.55, 0, 0, true), new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.28, 8), c).translateX(1.62).rotateZ(-Math.PI / 2)],
    batte: (c) => [cylindre(0.055, 0.85, c, 0.38, 0, 0, true, 0.025)],
    nunchaku: (c, m) => {
      const b2 = cylindre(0.025, 0.32, c, 0.12, -0.16, 0);
      b2.rotation.z = 0.4;
      return [cylindre(0.025, 0.32, c, 0.12, 0, 0, true), boite(0.1, 0.01, 0.01, m.acier, 0.3, -0.03, 0), b2];
    },
    grenade: (c, m) => [boule(0.08, c, 0, 0, 0), boite(0.04, 0.05, 0.03, m.metal, 0, 0.09, 0)],
    dynamite: (c, m) => [cylindre(0.04, 0.24, c, 0, 0.05, 0), cylindre(0.006, 0.08, m.noir, 0, 0.2, 0)],
    c4: (c) => [boite(0.2, 0.08, 0.12, c, 0, 0, 0), boite(0.06, 0.02, 0.04, mat({ color: 0x22ff66, emissive: 0x22ff66 }), 0, 0.05, 0)],
    mine: (c, m) => [cylindre(0.14, 0.05, c, 0, 0, 0), cylindre(0.03, 0.03, m.rouge, 0, 0.04, 0)],
    boomerang: (c) => {
      const a = boite(0.4, 0.02, 0.07, c, 0.12, 0, 0.08);
      a.rotation.y = 0.5;
      const b = boite(0.4, 0.02, 0.07, c, 0.12, 0, -0.08);
      b.rotation.y = -0.5;
      return [a, b];
    },
  };
  // Fabrique l'arme d'une fiche : le patron de sa forme, peint de sa couleur.
  function fabriquer(f) {
    const m = materiaux();
    const couleur = mat({ color: f.couleur, metalness: 0.4, roughness: 0.45 });
    const g = new THREE.Group();
    for (const morceau of (PATRONS[f.forme] || PATRONS.pistolet)(couleur, m, f)) g.add(morceau);
    if (f.forme !== "lame") g.scale.setScalar(f.famille === "melee" ? 1 : f.taille || 1);
    g.traverse((o) => (o.castShadow = true));
    return g;
  }

  function construire(monde, scene) {
    const g = new THREE.Group();
    // 1. La devanture (même repère que les autres magasins : x vers la rue).
    const m = Circuit.Archipel.magasins.find((x) => x.armurerie);
    const d = new THREE.Group();
    d.add(boite(1.6, 0.25, 11, mat({ color: 0x3a1010 }), -0.3, 4.2, 0)); // l'auvent
    const nom = panneauTexte("🔫 ARMURERIE", "#1c1c1c", "#ff7a2a", 11, 2.4);
    nom.position.set(-1.0, 6.0, 0);
    nom.rotation.y = Math.PI / 2;
    d.add(nom);
    // une grande enseigne sur un mât, qu'on voit depuis le carrefour
    d.add(cylindre(0.12, 9, mat({ color: 0x333333 }), 1.2, 4.5, 6.2));
    const haut = panneauTexte("ARMURERIE", "#7a1010", "#ffd34d", 5, 1.2);
    haut.position.set(1.2, 9.4, 6.2);
    haut.rotation.y = Math.PI / 2;
    d.add(haut);
    d.add(boite(0.15, 3, 2.4, mat({ color: 0x1a1a1a }), -1.45, 1.5, 0)); // la porte
    d.add(boite(0.1, 1.6, 3, mat({ color: 0x223344, metalness: 0.6, roughness: 0.1 }), -1.45, 1.8, 3)); // la vitrine
    const tapis = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), mat({ color: 0xff7a2a, emissive: 0x401a00 }));
    tapis.rotation.x = -Math.PI / 2;
    tapis.position.set(0.6, 0.15, 0);
    d.add(tapis);
    d.position.set(m.x, 0, m.z);
    d.rotation.y = -m.angle;
    g.add(d);
    // 2. Le stand de tir : un panneau, et un objet 3D pour chaque caisse et chaque cible de monde.stand.
    const S = A.stand;
    const panneauStand = panneauTexte("🎯 STAND DE TIR", "#ffffff", "#c0392b", 6, 1.3);
    panneauStand.position.set(S.x - 4, 3, S.z - 16);
    panneauStand.rotation.y = Math.PI / 2;
    g.add(panneauStand, cylindre(0.08, 3, mat({ color: 0x555555 }), S.x - 4, 1.2, S.z - 16));
    const toile = document.createElement("canvas");
    toile.width = toile.height = 128;
    const ctx = toile.getContext("2d");
    for (let r = 6; r > 0; r--) {
      ctx.fillStyle = r % 2 ? "#e02020" : "#ffffff";
      ctx.beginPath();
      ctx.arc(64, 64, r * 10.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const texCible = new THREE.CanvasTexture(toile);
    texCible.colorSpace = THREE.SRGBColorSpace;
    const caisseMat = mat({ map: Circuit.Textures && Circuit.Textures.bois ? Circuit.Textures.bois() : null, color: 0xb07a3a });
    const stand = monde.stand.map((c) => {
      const o = new THREE.Group();
      if (c.sorte === "caisse") {
        o.add(boite(1.2, 1.2, 1.2, caisseMat, 0, 0, 0), boite(1.24, 0.12, 1.24, mat({ color: 0x5a3a1a }), 0, 0.3, 0), boite(1.24, 0.12, 1.24, mat({ color: 0x5a3a1a }), 0, -0.3, 0));
      } else {
        const disque = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), mat({ map: texCible, side: THREE.DoubleSide }));
        disque.rotation.y = -Math.PI / 2; // tournée vers l'armurerie (vers x négatifs)
        o.add(disque, cylindre(0.05, 1.6, mat({ color: 0x777777 }), 0.05, -1.1, 0));
      }
      o.position.set(c.x, c.y, c.z);
      g.add(o);
      return o;
    });
    // 3. Des réserves d'objets (on en montre autant qu'il en faut, on cache les autres).
    const reserve = (n, faire) => {
      const liste = [];
      for (let i = 0; i < n; i++) {
        const o = faire();
        o.visible = false;
        g.add(o);
        liste.push(o);
      }
      return liste;
    };
    const mm = materiaux();
    const lances = reserve(8, () => boule(0.12, mat({ color: 0x3f5a2a }))); // grenades, fumigènes, flashs
    const dynas = reserve(6, () => cylindre(0.07, 0.4, mat({ color: 0xc8261e, emissive: 0x330000 }), 0, 0, 0));
    const c4s = reserve(3, () => boite(0.4, 0.15, 0.25, mat({ color: 0xd8cfa0, emissive: 0x003300 }), 0, 0, 0));
    const mines = reserve(5, () => {
      const o = new THREE.Group();
      o.add(cylindre(0.35, 0.1, mat({ color: 0x4a5a3a }), 0, 0.05, 0), cylindre(0.06, 0.06, mat({ color: 0xff2020, emissive: 0xff0000 }), 0, 0.12, 0));
      return o;
    });
    const fleche = () => {
      const o = new THREE.Group();
      o.add(cylindre(0.02, 0.9, mm.bois, 0, 0, 0, true), new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 6), mm.acier).translateX(0.5).rotateZ(-Math.PI / 2), boite(0.12, 0.06, 0.01, mat({ color: 0xff3030 }), -0.42, 0, 0));
      return o;
    };
    const fleches = reserve(10, fleche);
    const plantees = reserve(20, fleche);
    const roquettes = reserve(6, () => {
      const o = new THREE.Group();
      o.add(cylindre(0.08, 0.7, mat({ color: 0x556b2f }), 0, 0, 0, true), new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xffa020, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })).translateX(-0.9).rotateZ(Math.PI / 2));
      return o;
    });
    const obus = reserve(10, () => boule(0.09, mat({ color: 0xb8a040, metalness: 0.7 })));
    const boomerangs = reserve(2, () => {
      const o = fabriquer(A.articles.find((a) => a.id === "boomerang"));
      o.scale.setScalar(2.2);
      return o;
    });
    // Les flammes : beaucoup de petites boules orange qui s'ajoutent (« additive » : elles brillent).
    const flammes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }), 100);
    flammes.frustumCulled = false;
    flammes.count = 0;
    g.add(flammes);
    const feuxVoitures = reserve(8, () => new THREE.Mesh(new THREE.ConeGeometry(1.3, 3, 8), new THREE.MeshBasicMaterial({ color: 0xff6a10, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
    const fumees = reserve(4, () => {
      const o = new THREE.Group();
      const gris = new THREE.MeshStandardMaterial({ color: 0xbfc3c8, transparent: true, opacity: 0.75, depthWrite: false });
      for (let i = 0; i < 9; i++) o.add(boule(1, gris, Math.cos(i * 2.4) * (i ? 0.6 : 0), 0.3 + (i % 3) * 0.35, Math.sin(i * 2.4) * (i ? 0.6 : 0)));
      return o;
    });
    const geoTraits = new THREE.BufferGeometry();
    geoTraits.setAttribute("position", new THREE.BufferAttribute(new Float32Array(40 * 6), 3));
    const traits = new THREE.LineSegments(geoTraits, new THREE.LineBasicMaterial({ color: 0xffe066 }));
    traits.frustumCulled = false;
    g.add(traits);
    scene.add(g);
    r3 = { g, stand, lances, dynas, c4s, mines, fleches, plantees, roquettes, obus, boomerangs, flammes, feuxVoitures, fumees, traits, armes: {}, tenue: null, main: null };
  }

  // Pose un objet à la position p et le tourne dans le sens de sa vitesse (une flèche regarde où elle va).
  const X = () => new THREE.Vector3(1, 0, 0);
  function orienter(o, p) {
    o.position.set(p.x, p.y, p.z);
    const v = new THREE.Vector3(p.vx, p.vy, p.vz);
    if (v.lengthSq() > 0.001) o.quaternion.setFromUnitVectors(X(), v.normalize());
  }
  function montrer(liste, objets, placer) {
    liste.forEach((o, i) => {
      const x = objets[i];
      o.visible = !!x;
      if (x) placer(o, x);
    });
  }

  function dessiner(monde, scene) {
    const ici = monde.carte === "ville" && monde.phase === "ville" && monde.stand;
    if (!ici) {
      if (r3) r3.g.visible = false;
      return;
    }
    if (!r3) construire(monde, scene);
    r3.g.visible = true;
    monde.stand.forEach((c, i) => (r3.stand[i].visible = !c.cassee));
    const couleurs = { explosion: 0x3f5a2a, fumee: 0x9aa0a8, flash: 0xf0f0f0 };
    montrer(r3.lances, monde.grenades, (b, gr) => {
      b.position.set(gr.x, gr.y, gr.z);
      b.material.color.setHex(couleurs[gr.effet] || 0x3f5a2a);
    });
    const clignote = Math.floor(monde.temps * 6) % 2 ? 3 : 0.3; // la mèche (ou la diode) qui clignote
    montrer(r3.dynas, monde.dynamites.filter((d) => d.id !== "c4"), (b, d) => {
      b.position.set(d.x, d.y + 0.2, d.z);
      b.material.emissiveIntensity = clignote;
    });
    montrer(r3.c4s, monde.dynamites.filter((d) => d.id === "c4"), (b, d) => {
      b.position.set(d.x, d.y + 0.08, d.z);
      b.material.emissiveIntensity = clignote;
    });
    montrer(r3.mines, monde.mines, (o, m) => {
      o.position.set(m.x, m.y, m.z);
      o.children[1].visible = monde.temps >= m.prete && clignote > 1; // la lumière rouge clignote quand elle est prête
    });
    const pr = monde.projectiles;
    montrer(r3.fleches, pr.filter((x) => x.sorte === "fleche"), orienter);
    montrer(r3.roquettes, pr.filter((x) => x.sorte === "roquette"), (o, x) => {
      orienter(o, x);
      o.children[1].scale.set(1, 0.7 + Math.random() * 0.6, 1);
    });
    montrer(r3.obus, pr.filter((x) => x.sorte === "obus"), (o, x) => o.position.set(x.x, x.y, x.z));
    montrer(r3.boomerangs, pr.filter((x) => x.sorte === "boomerang"), (o, x) => {
      o.position.set(x.x, x.y, x.z);
      o.rotation.set(0, monde.temps * 18, 0); // il tourne sur lui-même
    });
    montrer(r3.plantees, monde.flechesPlantees, orienter);
    // Les flammes grandissent en vieillissant, puis disparaissent.
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    monde.flammes.slice(-100).forEach((f, i) => {
      const t = 0.3 + f.age * 4;
      r3.flammes.setMatrixAt(i, m4.compose(new THREE.Vector3(f.x, f.y, f.z), q, new THREE.Vector3(t, t, t)));
    });
    r3.flammes.count = Math.min(100, monde.flammes.length);
    r3.flammes.instanceMatrix.needsUpdate = true;
    const enFeu = monde.garees.filter((v) => v.enFeu !== undefined).concat(monde.circulation.map((c) => c.voiture).filter((v) => v.enFeu !== undefined));
    montrer(r3.feuxVoitures, enFeu, (o, v) => {
      o.position.set(v.x, (v.y || 0) + 2.2, v.z);
      o.scale.set(1, 0.8 + Math.random() * 0.5, 1);
    });
    montrer(r3.fumees, monde.fumees, (o, f) => {
      o.position.set(f.x, f.y, f.z);
      const reste = f.fin - monde.temps;
      o.scale.setScalar(Math.min(f.rayon * 0.55, 1 + (12 - reste) * 3) * Math.min(1, reste / 2 + 0.1));
    });
    const pos = r3.traits.geometry.attributes.position;
    let n = 0;
    for (const t of monde.traits.slice(-40)) pos.array.set([t.de.x, t.de.y, t.de.z, t.a.x, t.a.y, t.a.z], 6 * n++);
    r3.traits.geometry.setDrawRange(0, n * 2);
    pos.needsUpdate = true;
    // (Étape 140 : l'arme EN MAIN est maintenant fabriquée par l'armurier, affichage/armes-detail3d.js, et tenue par le
    // personnage, affichage/personnage3d.js. Ce fichier garde ses patrons simples pour ce qui vole : le boomerang.)
  }

  return { dessiner, fabriquer };
})();
