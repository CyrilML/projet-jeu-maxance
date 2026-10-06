// 🏭 LES CHARS EN 3D : l'usine de tanks (étape 60)
//
// ✍️ Trois vrais tanks modernes, construits avec leurs vraies mesures (longueur, largeur, hauteur de la caisse,
// longueur du canon) et leur « signature » :
//   - le LECLERC (France) : une tourelle carrée et haute, un gros coffre à l'arrière (le chargeur automatique) ;
//   - le M1 ABRAMS (États-Unis) : une tourelle large et plate, très longue, avec des faces avant inclinées ;
//   - le LEOPARD 2A6 (Allemagne) : la tourelle en FLÈCHE (deux blindages en pointe à l'avant).
// Chaque tank : des CHENILLES (une boucle de patins, qui défile), 7 galets de roulement, une roue dentée à l'arrière
// (le barbotin, qui entraîne la chenille) et une roue folle à l'avant, des jupes de protection sur les côtés, la
// caisse avec son glacis (la plaque inclinée de l'avant), la tourelle avec sa trappe, son périscope, ses lance-fumigènes,
// sa mitrailleuse et ses antennes, et le canon avec son manchon thermique.
// Le CAMOUFLAGE est une image peinte au hasard avec les 4 couleurs de l'équipe (vert OTAN ou sable).
//
// Tout est construit « nez vers x+ », posé au sol (y = 0). Ce fichier ne connaît pas les règles du jeu.

window.Tanks = window.Tanks || {};

Tanks.Chars3D = (function () {
  const cache = {};
  function camouflage(couleurs) {
    const cle = couleurs.join(",");
    if (cache[cle]) return cache[cle];
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    ctx.fillStyle = couleurs[0];
    ctx.fillRect(0, 0, 256, 256);
    let etat = 7;
    const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let k = 0; k < 40; k++) {
      ctx.fillStyle = couleurs[1 + (k % 3)];
      const x = h() * 256, y = h() * 256, r = 14 + h() * 30;
      for (const [dx, dy] of [[0, 0], [-256, 0], [256, 0], [0, -256], [0, 256]]) {
        ctx.beginPath();
        for (let a = 0; a < 9; a++) {
          const ang = (a / 9) * Math.PI * 2, rr = r * (0.6 + h() * 0.6);
          ctx.lineTo(x + dx + Math.cos(ang) * rr * 1.6, y + dy + Math.sin(ang) * rr);
        }
        ctx.fill();
      }
    }
    for (let i = 0; i < 4000; i++) { // de la poussière et de l'usure
      ctx.fillStyle = "rgba(" + (h() < 0.5 ? "0,0,0," : "255,240,210,") + h() * 0.08 + ")";
      ctx.fillRect(h() * 256, h() * 256, 2, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.repeat.set(0.25, 0.25);
    return (cache[cle] = t);
  }
  function texturePatins() {
    if (cache.patins) return cache.patins;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 32;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#26272a";
    ctx.fillRect(0, 0, 256, 32);
    for (let x = 0; x < 256; x += 16) {
      ctx.fillStyle = "#3a3c40";
      ctx.fillRect(x + 1, 2, 12, 28);
      ctx.fillStyle = "#151618";
      ctx.fillRect(x + 13, 0, 3, 32);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return (cache.patins = t);
  }
  const mats = {};
  function materiaux() {
    if (mats.metal) return mats;
    mats.metal = new THREE.MeshStandardMaterial({ color: 0x3a3d40, metalness: 0.6, roughness: 0.5 });
    mats.noir = new THREE.MeshStandardMaterial({ color: 0x18191b, metalness: 0.3, roughness: 0.7 });
    mats.caoutchouc = new THREE.MeshStandardMaterial({ color: 0x1d1e20, roughness: 0.95 });
    mats.verre = new THREE.MeshStandardMaterial({ color: 0x2a5068, metalness: 0.8, roughness: 0.1, emissive: 0x0a1a28 });
    mats.brule = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1, metalness: 0.1 });
    return mats;
  }

  const boite = (lx, ly, lz, m, x, y, z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), m);
    b.position.set(x, y, z);
    b.castShadow = b.receiveShadow = true;
    return b;
  };
  const cylindre = (r, l, m, n) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, n || 20), m);
    c.castShadow = true;
    return c;
  };
  // Un profil (vu de côté, points [x, y]) extrudé sur une largeur, centré en z = 0.
  function profilExtrude(points, largeur, m, biseau) {
    const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const b = biseau || 0.05;
    const g = new THREE.ExtrudeGeometry(s, { depth: largeur - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2 });
    g.translate(0, 0, -(largeur - 2 * b) / 2);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
  // Un contour vu de dessus (points [x, z], la moitié z ≥ 0 de l'avant vers l'arrière ; on fait le reflet),
  // extrudé vers le haut de y0 à y0 + hauteur, avec des bords biseautés.
  function dessusExtrude(moitie, y0, hauteur, m) {
    const pts = moitie.concat(moitie.slice().reverse().map(([x, z]) => [x, -z]));
    const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const b = 0.08;
    const g = new THREE.ExtrudeGeometry(s, { depth: hauteur - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); // (le contour était dans le plan x-y : on le couche, et l'épaisseur devient la hauteur)
    g.translate(0, y0 + b, 0);
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }

  // Les formes de tourelle (vue de dessus, la moitié gauche, de l'avant vers l'arrière) et leur hauteur.
  const TOURELLES = {
    leclerc: { moitie: [[2.05, 0.55], [1.75, 1.15], [-1.4, 1.25], [-2.55, 1.05]], h: 0.9, x: -0.2, coffre: true },
    abrams: { moitie: [[2.35, 0.5], [1.15, 1.55], [-1.6, 1.6], [-2.9, 1.25]], h: 0.78, x: -0.45 },
    leopard: { moitie: [[2.75, 0.12], [1.35, 1.1], [0.9, 1.38], [-1.7, 1.42], [-2.5, 1.1]], h: 0.85, x: -0.25 },
  };

  function fabriquer(fiche, equipe) {
    const m = materiaux(), E = Tanks.CONFIG.equipes[equipe];
    const peinture = new THREE.MeshStandardMaterial({ map: camouflage(E.camouflage), roughness: 0.85, metalness: 0.15 });
    const L = fiche.longueur, W = fiche.largeur, H = fiche.hauteur, tw = 0.66, zc = W / 2 - tw / 2 - 0.05;
    const g = new THREE.Group(), caisse = new THREE.Group();
    g.add(caisse);
    // 1. Les chenilles : une boucle (un « stade » vu de côté, creux), qui fait le tour des roues.
    const patins = texturePatins();
    const chenilles = [], roues = [];
    for (const cote of [-1, 1]) {
      const exterieur = new THREE.Shape(), r = 0.47, x0 = -L / 2 + 0.45, x1 = L / 2 - 0.3;
      exterieur.absarc(x1, r + 0.02, r, -Math.PI / 2, Math.PI / 2, false);
      exterieur.lineTo(x0, 1.0);
      exterieur.absarc(x0, r + 0.02, r * 0.95, Math.PI / 2, (3 * Math.PI) / 2, false);
      exterieur.closePath();
      const trou = new THREE.Path();
      trou.absarc(x1, r + 0.02, r - 0.11, -Math.PI / 2, Math.PI / 2, false);
      trou.lineTo(x0, 1.0 - 0.11);
      trou.absarc(x0, r + 0.02, r * 0.95 - 0.11, Math.PI / 2, (3 * Math.PI) / 2, false);
      exterieur.holes.push(trou);
      const geo = new THREE.ExtrudeGeometry(exterieur, { depth: tw, bevelEnabled: false, curveSegments: 10 });
      geo.translate(0, 0, -tw / 2);
      const mat = new THREE.MeshStandardMaterial({ map: patins.clone(), roughness: 0.9, metalness: 0.4 });
      mat.map.needsUpdate = true;
      mat.map.repeat.set(0.9, 0.9);
      const chenille = new THREE.Mesh(geo, mat);
      chenille.position.z = cote * zc;
      chenille.castShadow = chenille.receiveShadow = true;
      g.add(chenille);
      chenilles.push(mat);
      // les galets (7), le barbotin (à l'arrière, denté), la roue folle (à l'avant), les rouleaux du haut
      const n = 7;
      for (let k = 0; k < n; k++) {
        const x = x0 + 0.35 + (k / (n - 1)) * (x1 - x0 - 0.75);
        const galet = cylindre(0.36, tw * 0.8, m.metal, 18);
        galet.rotation.x = Math.PI / 2;
        galet.position.set(x, 0.42, cote * zc);
        const moyeu = cylindre(0.13, tw * 0.85, m.noir, 10);
        moyeu.rotation.x = Math.PI / 2;
        moyeu.position.copy(galet.position);
        g.add(galet, moyeu);
        roues.push(galet);
      }
      for (const [x, rr] of [[x0, 0.4], [x1, 0.38]]) {
        const roue = cylindre(rr, tw * 0.7, m.metal, 12);
        roue.rotation.x = Math.PI / 2;
        roue.position.set(x, 0.5, cote * zc);
        g.add(roue);
        roues.push(roue);
      }
      for (const x of [x0 + 1.4, 0, x1 - 1.4]) {
        const rouleau = cylindre(0.1, tw * 0.6, m.noir, 10);
        rouleau.rotation.x = Math.PI / 2;
        rouleau.position.set(x, 0.92, cote * zc);
        g.add(rouleau);
      }
      // la jupe de protection (elle cache le haut de la chenille), en deux parties
      const jupe = boite(L * 0.82, 0.55, 0.07, peinture, 0.1, 1.05, cote * (W / 2 + 0.02));
      jupe.rotation.x = cote * 0.06;
      caisse.add(jupe);
      caisse.add(boite(L * 0.82, 0.05, 0.08, m.noir, 0.1, 0.79, cote * (W / 2 + 0.03))); // le bas caoutchouté
    }
    // 2. La caisse : le dessous (entre les chenilles), puis le dessus avec le glacis incliné de l'avant.
    caisse.add(boite(L - 0.9, 0.7, W - 2 * tw - 0.1, m.noir, 0, 0.8, 0));
    caisse.add(profilExtrude([[-L / 2, 1.0], [-L / 2 + 0.1, 1.62], [L / 2 - 1.75, 1.66], [L / 2, 1.22], [L / 2 - 0.15, 0.85], [L / 2 - 0.8, 0.75], [-L / 2 + 0.3, 0.8]], W, peinture, 0.06));
    // les phares (de petites lampes sous le glacis), les crochets de remorquage, la plaque arrière (les moteurs)
    for (const cote of [-1, 1]) {
      caisse.add(boite(0.08, 0.12, 0.2, m.verre, L / 2 - 0.05, 1.12, cote * (W / 2 - 0.4)));
      caisse.add(boite(0.15, 0.1, 0.1, m.noir, L / 2 - 0.12, 0.85, cote * 0.6));
    }
    for (let k = 0; k < 6; k++) caisse.add(boite(0.9, 0.03, 0.08, m.noir, -L / 2 + 1.1, 1.66, -0.9 + k * 0.36)); // la grille du moteur
    caisse.add(boite(0.25, 0.35, W * 0.8, m.noir, -L / 2 - 0.05, 1.3, 0)); // la plaque arrière
    // 3. La tourelle (elle tourne) : sa forme, et dessus la trappe, le périscope, la mitrailleuse, les antennes.
    const fo = TOURELLES[fiche.id];
    const tourelle = new THREE.Group();
    tourelle.position.set(fo.x, 0, 0);
    caisse.add(tourelle);
    const yT = 1.66;
    tourelle.add(dessusExtrude(fo.moitie, yT, fo.h, peinture));
    if (fo.coffre) tourelle.add(boite(0.8, fo.h * 0.8, 1.9, peinture, -2.75, yT + fo.h * 0.45, 0)); // le coffre du chargeur automatique (Leclerc)
    const haut = yT + fo.h;
    const trappe = cylindre(0.38, 0.22, peinture, 16);
    trappe.position.set(-0.6, haut + 0.1, 0.55);
    tourelle.add(trappe);
    tourelle.add(boite(0.28, 0.06, 0.6, m.noir, -0.6, haut + 0.24, 0.55)); // le couvercle de la trappe
    const viseur = boite(0.45, 0.35, 0.4, peinture, 0.6, haut + 0.17, -0.65); // le viseur du tireur (avec sa vitre)
    tourelle.add(viseur);
    tourelle.add(boite(0.02, 0.2, 0.3, m.verre, 0.83, haut + 0.2, -0.65));
    const periscope = cylindre(0.14, 0.45, peinture, 12); // le viseur panoramique du chef de char
    periscope.position.set(-0.1, haut + 0.25, 0.75);
    tourelle.add(periscope);
    tourelle.add(boite(0.22, 0.18, 0.22, m.verre, -0.1, haut + 0.5, 0.75));
    const mg = cylindre(0.04, 1.1, m.noir, 8); // la mitrailleuse
    mg.rotation.z = Math.PI / 2;
    mg.position.set(-0.15, haut + 0.32, 0.55);
    tourelle.add(mg);
    for (const cote of [-1, 1]) {
      for (let k = 0; k < 4; k++) { // les lance-fumigènes, 4 tubes de chaque côté
        const tube = cylindre(0.06, 0.32, m.noir, 8);
        tube.rotation.z = Math.PI / 2 - 0.4;
        tube.rotation.y = cote * 0.5;
        tube.position.set(fo.moitie[1][0] - 0.3 - k * 0.14, yT + fo.h * 0.65, cote * (fo.moitie[1][1] + 0.05));
        tourelle.add(tube);
      }
      const antenne = cylindre(0.012, 2.4, m.noir, 4);
      antenne.position.set(fo.moitie[fo.moitie.length - 1][0] + 0.3, haut + 1.2, cote * 0.7);
      tourelle.add(antenne);
      // ✍️ la marque de l'équipe : un panneau de couleur sur chaque côté de la tourelle
      const marque = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.25, side: THREE.DoubleSide }));
      marque.position.set(-0.5, yT + fo.h * 0.55, cote * (fo.moitie[2][1] + 0.1));
      tourelle.add(marque);
    }
    // une flèche de la couleur de l'équipe sur le toit (pour les avions… et pour toi, d'en haut)
    const fleche = new THREE.Mesh(new THREE.CircleGeometry(0.45, 3), new THREE.MeshStandardMaterial({ color: E.marque, emissive: E.marque, emissiveIntensity: 0.3 }));
    fleche.rotation.x = -Math.PI / 2;
    fleche.position.set(-1.2, haut + 0.02, 0);
    tourelle.add(fleche);
    // 4. Le canon (il monte et descend) : le masque, le tube, le manchon thermique, le bout.
    const canon = new THREE.Group();
    canon.position.set(fo.moitie[0][0] - 0.25, yT + fo.h * 0.48, 0);
    tourelle.add(canon);
    canon.add(boite(0.55, 0.55, 0.85, peinture, 0.1, 0, 0)); // le masque
    const Lc = fiche.canon;
    const tube = cylindre(0.1, Lc, m.metal, 14);
    tube.rotation.z = -Math.PI / 2;
    tube.position.x = 0.3 + Lc / 2;
    canon.add(tube);
    for (const [x, l, r] of [[0.3 + Lc * 0.28, Lc * 0.4, 0.14], [0.3 + Lc * 0.68, Lc * 0.28, 0.13]]) {
      const manchon = cylindre(r, l, peinture, 14);
      manchon.rotation.z = -Math.PI / 2;
      manchon.position.x = x;
      canon.add(manchon);
    }
    const bout = cylindre(0.12, 0.25, m.noir, 14);
    bout.rotation.z = -Math.PI / 2;
    bout.position.x = 0.3 + Lc - 0.1;
    canon.add(bout);
    return { g, caisse, tourelle, canon, roues, chenilles, bouche: 0.3 + Lc, peinture };
  }

  // Un tank détruit : tout devient noir et brûlé, la tourelle est soufflée de travers.
  function bruler(o) {
    const m = materiaux();
    o.g.traverse((x) => {
      if (x.isMesh) x.material = m.brule;
    });
    o.tourelle.rotation.z = 0.12;
    o.tourelle.position.y = 0.25;
    o.canon.rotation.z = -0.15;
  }

  return { fabriquer, bruler, camouflage };
})();
