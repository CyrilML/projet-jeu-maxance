// 🛠️ L'ARMURERIE EN 3D : le sculpteur d'armes
//
// Étape 138. Ce fichier fabrique, avec des boîtes et des cylindres (des formes « low-poly ») :
//   - la DEVANTURE de l'armurerie, avec sa grande enseigne « ARMURERIE » (on la voit de loin) ;
//   - le STAND DE TIR du parc d'en face : des caisses en bois et des cibles rouges et blanches ;
//   - l'ARME DANS LA MAIN du personnage : un pistolet (un canon + une crosse), un gros pistolet (avec son
//     barillet), une épée (une lame, une garde, une poignée), un katana, une grenade, un bâton de dynamite ;
//   - les grenades qui volent, les dynamites posées, et le trait jaune de chaque balle.
// Il lit le monde (logique/armurerie.js) mais ne le change jamais.

window.Circuit = window.Circuit || {};

Circuit.Armurerie3D = (function () {
  const C = Circuit.CONFIG;
  let r3 = null; // tout ce qui est fabriqué (une seule fois)
  const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.6 }, o));
  function boite(l, h, p, m, x, y, z) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), m);
    b.position.set(x || 0, y || 0, z || 0);
    b.castShadow = true;
    return b;
  }
  function cylindre(r, h, m, x, y, z, couche) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), m);
    c.position.set(x || 0, y || 0, z || 0);
    if (couche) c.rotation.z = Math.PI / 2; // couché le long de x
    return c;
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

  // ---------------------------------------------------------------- les armes (repère : x = vers l'avant, y = en haut)
  function modeles() {
    const metal = mat({ color: 0x2b2d33, metalness: 0.8, roughness: 0.35 });
    const acier = mat({ color: 0xd8dde6, metalness: 1, roughness: 0.2 });
    const bois = mat({ color: 0x6b3a1c });
    const or = mat({ color: 0xc9a227, metalness: 1, roughness: 0.3 });
    const noir = mat({ color: 0x111111 });
    const fabriquer = (morceaux) => {
      const g = new THREE.Group();
      for (const m of morceaux) g.add(m);
      g.visible = false;
      return g;
    };
    return {
      pistolet: fabriquer([boite(0.32, 0.09, 0.06, metal, 0.12, 0.05, 0), boite(0.08, 0.16, 0.06, noir, -0.01, -0.06, 0)]),
      revolver: fabriquer([boite(0.36, 0.07, 0.06, acier, 0.17, 0.06, 0), cylindre(0.05, 0.1, metal, 0.03, 0.05, 0, true), boite(0.08, 0.17, 0.06, bois, -0.04, -0.06, 0)]),
      epee: fabriquer([boite(1, 0.07, 0.02, acier, 0.62, 0, 0), boite(0.04, 0.05, 0.26, or, 0.1, 0, 0), boite(0.16, 0.05, 0.05, bois, 0, 0, 0)]),
      katana: fabriquer([boite(1.25, 0.05, 0.015, acier, 0.78, 0.02, 0), cylindre(0.06, 0.02, or, 0.14, 0, 0, true), boite(0.26, 0.05, 0.05, noir, -0.01, 0, 0)]),
      grenade: fabriquer([new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), mat({ color: 0x3f5a2a })), boite(0.04, 0.05, 0.03, metal, 0, 0.09, 0)]),
      dynamite: fabriquer([cylindre(0.04, 0.24, mat({ color: 0xc8261e }), 0, 0.05, 0), cylindre(0.006, 0.08, noir, 0, 0.2, 0)]),
    };
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
    const S = C.armurerie.stand;
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
    // 3. Les grenades qui volent, les dynamites posées, les traits des balles.
    const vertes = [], rouges = [];
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), mat({ color: 0x3f5a2a }));
      b.visible = false;
      g.add(b);
      vertes.push(b);
    }
    for (let i = 0; i < 3; i++) {
      const b = cylindre(0.07, 0.4, mat({ color: 0xc8261e, emissive: 0x330000 }), 0, 0, 0);
      b.visible = false;
      g.add(b);
      rouges.push(b);
    }
    const geoTraits = new THREE.BufferGeometry();
    geoTraits.setAttribute("position", new THREE.BufferAttribute(new Float32Array(20 * 6), 3));
    const traits = new THREE.LineSegments(geoTraits, new THREE.LineBasicMaterial({ color: 0xffe066 }));
    traits.frustumCulled = false;
    g.add(traits);
    scene.add(g);
    r3 = { g, stand, vertes, rouges, traits, armes: modeles(), main: null };
  }

  function dessiner(monde, scene, bonhomme) {
    const ici = monde.carte === "ville" && monde.phase === "ville" && monde.stand;
    if (!ici) {
      if (r3) r3.g.visible = false;
      return;
    }
    if (!r3) construire(monde, scene);
    r3.g.visible = true;
    monde.stand.forEach((c, i) => (r3.stand[i].visible = !c.cassee));
    r3.vertes.forEach((b, i) => {
      const gr = monde.grenades[i];
      b.visible = !!gr;
      if (gr) b.position.set(gr.x, gr.y, gr.z);
    });
    r3.rouges.forEach((b, i) => {
      const dy = monde.dynamites[i];
      b.visible = !!dy;
      if (dy) {
        b.position.set(dy.x, dy.y + 0.2, dy.z);
        b.material.emissiveIntensity = Math.floor(monde.temps * 6) % 2 ? 3 : 0.3; // la mèche qui clignote
      }
    });
    const pos = r3.traits.geometry.attributes.position;
    let n = 0;
    for (const t of monde.traits.slice(-20)) pos.array.set([t.de.x, t.de.y, t.de.z, t.a.x, t.a.y, t.a.z], 6 * n++);
    r3.traits.geometry.setDrawRange(0, n * 2);
    pos.needsUpdate = true;
    // L'arme dans la main droite (le bras n° 2 du personnage).
    if (!bonhomme) return;
    if (r3.main !== bonhomme) {
      const tenue = new THREE.Group();
      tenue.position.y = -0.72; // au bout du bras
      tenue.rotation.z = -Math.PI / 2; // l'arme reste droite quand le bras est levé devant
      tenue.scale.setScalar(1.5); // (un peu plus grande que la réalité, pour bien la voir de derrière)
      for (const a of Object.values(r3.armes)) tenue.add(a);
      bonhomme.bras[1].add(tenue);
      r3.main = bonhomme;
    }
    const arme = monde.arme || "mains";
    for (const [nom, a] of Object.entries(r3.armes)) a.visible = nom === arme;
    if (arme === "mains") return;
    const depuis = monde.temps - monde.coup;
    const lame = arme === "epee" || arme === "katana";
    // Le bras est levé devant (1,4 rad). Un coup d'épée le fait descendre d'un coup ; un tir le fait reculer un peu.
    let leve = lame ? 2.1 : 1.45;
    if (depuis < 0.25) leve = lame ? 2.4 - depuis * 7 : 1.45 + Math.sin((depuis / 0.25) * Math.PI) * 0.35;
    bonhomme.bras[1].rotation.z = leve;
  }

  return { dessiner };
})();
