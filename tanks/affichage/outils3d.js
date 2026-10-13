// 🧰 LA BOÎTE À OUTILS 3D : l'établi du carrossier (étape 70)
//
// ✍️ « Améliore toutes les voitures pour qu'elles soient plus réalistes. » Pour fabriquer des engins plus vrais, il
// faut BEAUCOUP de petites pièces (des boulons, des poignées, des phares, des outils…). Mais la carte graphique
// n'aime pas dessiner 1 000 petits objets : elle préfère 1 gros objet. Alors on fait comme un carrossier :
//   1. on pose toutes les pièces sur l'établi (une boîte, un cylindre, un tube entre deux points, une forme vue de
//      côté « tirée » sur une largeur, une forme « lissée » entre deux contours…) ;
//   2. puis on les SOUDE : toutes les pièces d'une même matière deviennent UN SEUL objet à dessiner.
// Deux astuces de plus :
//   - les TEINTES : beaucoup de petites pièces (caoutchouc, acier, plastique, la peau du pilote…) partagent UNE seule
//     matière, et chaque pièce garde sa couleur, écrite dans ses sommets (les « couleurs de sommets ») ;
//   - le CAMOUFLAGE posé « à plat » : pour les pièces peintes, l'image du camouflage est projetée selon la direction
//     de chaque face (de côté, de face ou de dessus), en mètres. Les taches continuent d'une pièce à l'autre, comme
//     sur une vraie peinture faite au pistolet sur le tank assemblé.
// Ce fichier ne connaît aucun engin : ce sont des outils.

window.Tanks = window.Tanks || {};

Tanks.Outils3D = (function () {
  const couleurBlanche = new THREE.Color(1, 1, 1);

  // Une pièce : un objet 3D à sa place, avec (si besoin) sa teinte.
  function piece(geo, mat, x, y, z, teinte) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = m.receiveShadow = true;
    if (teinte !== undefined) m.userData.teinte = new THREE.Color(teinte);
    return m;
  }
  const boite = (lx, ly, lz, mat, x, y, z, teinte) => piece(new THREE.BoxGeometry(lx, ly, lz), mat, x, y, z, teinte);
  // Un cylindre debout (axe y). On le couche avec rotation.x (axe z) ou rotation.z (axe x).
  const cylindre = (r1, r2, l, mat, n, teinte) => piece(new THREE.CylinderGeometry(r1, r2, l, n || 12), mat, 0, 0, 0, teinte);
  const couche = (m, axe, x, y, z) => {
    if (axe === "x") m.rotation.z = Math.PI / 2;
    else if (axe === "z") m.rotation.x = Math.PI / 2;
    m.position.set(x, y, z);
    return m;
  };
  // Un tube droit entre deux points a et b ([x, y, z]).
  const AXE_Y = new THREE.Vector3(0, 1, 0);
  function tube(a, b, r, mat, n, teinte) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
    const m = piece(new THREE.CylinderGeometry(r, r, d.length(), n || 8), mat, 0, 0, 0, teinte);
    m.position.copy(A).add(B).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(AXE_Y, d.normalize());
    return m;
  }
  // Un tube qui suit une courbe douce passant par des points (un câble, une poignée, un arceau).
  function cable(points, r, mat, teinte, n) {
    const courbe = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return piece(new THREE.TubeGeometry(courbe, n || points.length * 6, r, 6, false), mat, 0, 0, 0, teinte);
  }
  // Un PROFIL vu de côté (des points [x, y]) « tiré » sur une largeur (le long de z), centré en z = 0, aux bords biseautés.
  function profil(points, largeur, mat, biseau, teinte) {
    const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
    const b = Math.min(biseau === undefined ? 0.03 : biseau, largeur * 0.3);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, largeur - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 8 });
    g.translate(0, 0, -(largeur - 2 * b) / 2);
    return piece(g, mat, 0, 0, 0, teinte);
  }
  // Un contour vu de DESSUS (la moitié z ≥ 0, de l'avant vers l'arrière, points [x, z]) rendu complet par reflet.
  function contourComplet(moitie) {
    const reflet = moitie.slice().reverse().filter(([, z]) => z > 1e-6).map(([x, z]) => [x, -z]);
    const debut = moitie.filter(([, z], i) => i === 0 || i === moitie.length - 1 || z > 1e-6);
    return debut.concat(reflet).filter((p, i, t) => i === 0 || Math.hypot(p[0] - t[i - 1][0], p[1] - t[i - 1][1]) > 1e-6);
  }
  // Une forme LISSÉE entre deux contours vus de dessus (même nombre de points) : le bas à y0, le haut à y1.
  // Les faces de côté penchent comme un vrai blindage (le haut est plus petit que le bas). Les arêtes restent vives.
  function lisse(bas, haut, y0, y1, mat, teinte) {
    const n = bas.length;
    let aire = 0;
    for (let i = 0; i < n; i++) {
      const [x1, z1] = bas[i], [x2, z2] = bas[(i + 1) % n];
      aire += x1 * z2 - x2 * z1;
    }
    const sens = aire > 0 ? 1 : -1;
    const pos = [], nor = [];
    const tri = (a, b, c) => {
      const u = new THREE.Vector3().subVectors(b, a), v = new THREE.Vector3().subVectors(c, a), nn = u.cross(v).normalize();
      for (const p of [a, b, c]) (pos.push(p.x, p.y, p.z), nor.push(nn.x, nn.y, nn.z));
    };
    const V = (p, y) => new THREE.Vector3(p[0], y, p[1]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, b1 = V(bas[i], y0), b2 = V(bas[j], y0), h1 = V(haut[i], y1), h2 = V(haut[j], y1);
      // la normale vers l'extérieur, dans le plan du sol (le contour tourne dans le sens « sens »)
      const ex = bas[j][0] - bas[i][0], ez = bas[j][1] - bas[i][1], dehors = new THREE.Vector3(ez * sens, 0, -ex * sens);
      const essai = new THREE.Vector3().subVectors(b2, b1).cross(new THREE.Vector3().subVectors(h1, b1));
      if (essai.dot(dehors) >= 0) (tri(b1, b2, h1), tri(h1, b2, h2));
      else (tri(b1, h1, b2), tri(h1, h2, b2));
    }
    for (const [contour, y, haut1] of [[haut, y1, true], [bas, y0, false]]) {
      const idx = THREE.ShapeUtils.triangulateShape(contour.map(([x, z]) => new THREE.Vector2(x, z)), []);
      for (const [a, b, c] of idx) {
        const A = V(contour[a], y), B = V(contour[b], y), C = V(contour[c], y);
        const ny = new THREE.Vector3().subVectors(B, A).cross(new THREE.Vector3().subVectors(C, A)).y;
        if ((ny > 0) === haut1) tri(A, B, C);
        else tri(A, C, B);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
    return piece(g, mat, 0, 0, 0, teinte);
  }
  // Un FUSEAU (un fuselage d'avion, une coque de sous-marin…) : des tranches le long de x, vues de face, chacune
  // une « super-ellipse » (n = 2 : toute ronde ; n = 4 : presque carrée). Entre deux tranches, on relie par des triangles.
  // sections : [{ x, y (le centre), w (la demi-largeur), h (la demi-hauteur), n, b (la demi-hauteur du bas, si le
  // dessous n'est pas comme le dessus) }], de l'arrière vers l'avant.
  function fuseau(sections, mat, tours, teinte) {
    const N = tours || 16, pos = [], idx = [];
    for (const s of sections) {
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a), n = s.n || 2;
        const hh = si >= 0 ? s.h : s.b === undefined ? s.h : s.b;
        pos.push(s.x, s.y + Math.sign(si) * Math.pow(Math.abs(si), 2 / n) * hh, Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * s.w);
      }
    }
    for (let t = 0; t < sections.length - 1; t++) {
      for (let k = 0; k < N; k++) {
        const a = t * N + k, b = t * N + ((k + 1) % N), c = a + N, d = b + N;
        idx.push(a, b, c, b, d, c);
      }
    }
    for (const [t, sens] of [[0, -1], [sections.length - 1, 1]]) { // on ferme les deux bouts
      const s = sections[t], centre = pos.length / 3;
      pos.push(s.x, s.y, 0);
      for (let k = 0; k < N; k++) {
        const a = t * N + k, b = t * N + ((k + 1) % N);
        if (sens > 0) idx.push(centre, b, a);
        else idx.push(centre, a, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    // (le sens des triangles : la normale du haut de la 2e tranche doit regarder vers le haut, sinon on retourne tout)
    const i = N + Math.round(N / 4);
    if (g.attributes.normal.getY(i) < 0) {
      const t = g.index.array;
      for (let j = 0; j < t.length; j += 3) [t[j + 1], t[j + 2]] = [t[j + 2], t[j + 1]];
      g.computeVertexNormals();
    }
    return piece(g, mat, 0, 0, 0, teinte);
  }
  // Une forme vue de face (un « tour » : rotation d'un profil [rayon, y] autour de l'axe y) : pneus, moyeux, phares ronds.
  const tour = (points, mat, n, teinte) => piece(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), n || 20), mat, 0, 0, 0, teinte);

  // Le camouflage « au pistolet » : pour chaque triangle, on projette selon sa direction principale.
  const TAILLE_CAMO = 1; // (avec la répétition 0,25 de la texture : une image de camouflage tous les 4 m)
  function camoAPlat(g) {
    const p = g.attributes.position.array, uv = new Float32Array((p.length / 3) * 2);
    for (let t = 0; t < p.length; t += 9) {
      const ux = p[t + 3] - p[t], uy = p[t + 4] - p[t + 1], uz = p[t + 5] - p[t + 2];
      const vx = p[t + 6] - p[t], vy = p[t + 7] - p[t + 1], vz = p[t + 8] - p[t + 2];
      const nx = Math.abs(uy * vz - uz * vy), ny = Math.abs(uz * vx - ux * vz), nz = Math.abs(ux * vy - uy * vx);
      for (let k = 0; k < 3; k++) {
        const i = t + k * 3, j = (t / 3 + k) * 2;
        if (ny >= nx && ny >= nz) (uv[j] = p[i] * TAILLE_CAMO), (uv[j + 1] = p[i + 2] * TAILLE_CAMO);
        else if (nx >= nz) (uv[j] = p[i + 2] * TAILLE_CAMO + 0.37), (uv[j + 1] = p[i + 1] * TAILLE_CAMO);
        else (uv[j] = p[i] * TAILLE_CAMO), (uv[j + 1] = p[i + 1] * TAILLE_CAMO + 0.21);
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  // SOUDER : toutes les pièces (enfants directs du groupe) d'une même matière deviennent un seul objet.
  // (Les pièces marquées userData.garder, et les sous-groupes qui bougent, comme une tourelle, restent à part.)
  const bilan = { pieces: 0, objets: 0 }; // (pour « sous le capot » : combien de pièces ont été soudées, en combien d'objets)
  function souder(groupe, ombre) {
    const parMatiere = new Map();
    for (const enfant of [...groupe.children]) {
      if (!enfant.isMesh || enfant.userData.garder) continue;
      enfant.updateMatrix();
      const g = (enfant.geometry.index ? enfant.geometry.toNonIndexed() : enfant.geometry.clone()).applyMatrix4(enfant.matrix);
      if (enfant.matrix.determinant() < 0) { // (une pièce retournée comme dans un miroir : on remet ses triangles à l'endroit)
        const p = g.attributes.position.array, nn = g.attributes.normal.array;
        for (let t = 0; t < p.length; t += 9) for (let k = 0; k < 3; k++) [p[t + 3 + k], p[t + 6 + k]] = [p[t + 6 + k], p[t + 3 + k]], [nn[t + 3 + k], nn[t + 6 + k]] = [nn[t + 6 + k], nn[t + 3 + k]];
      }
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      const mat = enfant.material;
      if (mat.userData.camo) camoAPlat(g);
      if (mat.vertexColors) {
        const c = enfant.userData.teinte || couleurBlanche, n = g.attributes.position.count, tab = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) (tab[i * 3] = c.r), (tab[i * 3 + 1] = c.g), (tab[i * 3 + 2] = c.b);
        g.setAttribute("color", new THREE.BufferAttribute(tab, 3));
      }
      if (!parMatiere.has(mat)) parMatiere.set(mat, []);
      parMatiere.get(mat).push(g);
      bilan.pieces++;
      groupe.remove(enfant);
      enfant.geometry.dispose();
    }
    const objets = [];
    for (const [matiere, geos] of parMatiere) {
      const noms = ["position", "normal", "uv"].concat(matiere.vertexColors ? ["color"] : []);
      const geo = new THREE.BufferGeometry();
      for (const nom of noms) {
        const taille = nom === "uv" ? 2 : 3, total = geos.reduce((t, g) => t + g.attributes[nom].count * taille, 0), tab = new Float32Array(total);
        let k = 0;
        for (const g of geos) {
          const a = g.attributes[nom];
          if (a.itemSize === taille && !a.isInterleavedBufferAttribute) tab.set(a.array.subarray(0, a.count * taille), k);
          else for (let i = 0; i < a.count; i++) for (let c = 0; c < taille; c++) tab[k + i * taille + c] = a.array[i * a.itemSize + c] || 0;
          k += a.count * taille;
        }
        geo.setAttribute(nom, new THREE.BufferAttribute(tab, taille));
      }
      geo.computeBoundingSphere();
      const m = new THREE.Mesh(geo, matiere);
      m.castShadow = ombre !== false && !matiere.transparent;
      m.receiveShadow = true;
      groupe.add(m);
      objets.push(m);
      bilan.objets++;
    }
    return objets;
  }
  // Souder un groupe de pièces en UNE géométrie à teintes (pour une roue qu'on fabrique une fois et qu'on réutilise).
  function geometrieTeintee(pieces, mat) {
    const g = new THREE.Group();
    for (const p of pieces) g.add(p);
    const [m] = souder(g);
    return m.geometry;
  }

  return { bilan, piece, boite, cylindre, couche, tube, cable, profil, contourComplet, lisse, fuseau, tour, souder, geometrieTeintee, camoAPlat };
})();
