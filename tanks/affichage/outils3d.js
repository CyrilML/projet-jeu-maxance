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

  // ------------------------------------------------------------------ (étape 74) les formes LISSES : le potier
  // ✍️ « Des vraies formes arrondies. » Un potier ne colle pas des boîtes : il tourne une forme qui change doucement.
  // Une COQUE (un fuselage d'hélico, une nacelle, une pale) est faite de « tranches » (des anneaux), comme le fuseau,
  // mais :
  //   - on ne donne que quelques tranches CLÉS ; entre deux clés, l'outil invente des tranches intermédiaires qui
  //     glissent en douceur (une « courbe monotone » : elle ne dépasse jamais les clés, pas de bosse bizarre) ;
  //   - chaque anneau a beaucoup de points (40) et les normales sont LISSÉES (moyenne des faces voisines) : plus de
  //     facettes, la lumière glisse sur la peinture comme sur une vraie tôle ;
  //   - une fonction « zone » range chaque triangle dans une matière (la peinture, la vitre, l'intérieur sombre…) : les
  //     vitres du cockpit sont DÉCOUPÉES dans la coque, elles suivent exactement sa courbe ;
  //   - les coordonnées de texture (u, v) sont en MÈTRES le long et autour de la coque : les lignes de tôle (les
  //     « panneaux ») suivent la forme sans se casser.
  // Une interpolation monotone (Fritsch-Carlson) : les valeurs v aux abscisses xs → une fonction x → valeur.
  function courbeMonotone(xs, vs) {
    const n = xs.length, d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((vs[i + 1] - vs[i]) / (xs[i + 1] - xs[i] || 1e-6));
    for (let i = 0; i < n; i++) {
      if (i === 0) m.push(d[0] || 0);
      else if (i === n - 1) m.push(d[n - 2] || 0);
      else m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
    }
    for (let i = 0; i < n - 1; i++) {
      if (d[i] === 0) (m[i] = 0), (m[i + 1] = 0);
      else {
        const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
        if (s > 9) (m[i] = (3 * a * d[i]) / Math.sqrt(s)), (m[i + 1] = (3 * b * d[i]) / Math.sqrt(s));
      }
    }
    return (x) => {
      if (x <= xs[0]) return vs[0];
      if (x >= xs[n - 1]) return vs[n - 1];
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * m[i + 1];
    };
  }
  // cles : [{ x, y (centre), w (demi-largeur), h (demi-hauteur du haut), b (du bas, sinon h), n (2 = rond, 4 = presque
  // carré), z (décalage de côté) }], de l'arrière vers l'avant.
  // options : tours (points par anneau), pas (m entre deux tranches), deformer(p) (pour plier un point), zone(c, n) →
  // nom de matière ou null (triangle enlevé), couleur(p, n) → [r, g, b], uv (m par répétition), fermer (true : on
  // bouche les deux bouts ; [debut, fin] sinon), retourner (true : les faces regardent vers l'intérieur).
  function coque(cles, options) {
    const o = options || {}, N = o.tours || 40, pas = o.pas || 0.15;
    const xs = cles.map((c) => c.x), prop = (nom, def) => courbeMonotone(xs, cles.map((c) => (c[nom] === undefined ? (typeof def === "string" ? c[def] : def) : c[nom])));
    const Y = prop("y", 0), W = prop("w", 0.5), H = prop("h", 0.5), B = prop("b", "h"), NN = prop("n", 2), Z = prop("z", 0);
    // les abscisses des tranches : un pas régulier, plus les clés elles-mêmes
    const tranches = [];
    for (let i = 0; i < cles.length - 1; i++) {
      const k = Math.max(1, Math.ceil((xs[i + 1] - xs[i]) / pas));
      for (let j = 0; j < k; j++) tranches.push(xs[i] + ((xs[i + 1] - xs[i]) * j) / k);
    }
    tranches.push(xs[xs.length - 1]);
    // (les « coupes » : des tranches en plus, pile au bord d'une vitre ou d'une porte, pour que leur bord soit bien droit)
    for (const x of o.coupes || []) if (x > xs[0] && x < xs[xs.length - 1]) tranches.push(x);
    tranches.sort((a, b) => a - b);
    for (let i = tranches.length - 1; i > 0; i--) if (tranches[i] - tranches[i - 1] < 0.02) tranches.splice(i, 1);
    // les angles des points d'un anneau : répartis pour que les points soient À ÉGALE DISTANCE le long du contour (sur
    // une forme presque carrée, des angles réguliers mettraient presque tous les points dans les coins)
    const ref = cles.reduce((m, c) => ((c.w || 0) * (c.h || 0) > (m.w || 0) * (m.h || 0) ? c : m), cles[0]);
    const angles = [], echant = [], M = 720;
    {
      const nr = ref.n || 2, e = 2 / nr, bb = ref.b === undefined ? ref.h : ref.b;
      let l = 0, py = 0, pz = 0;
      for (let k = 0; k <= M; k++) {
        const a = -Math.PI / 2 + (k / M) * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
        const y = Math.sign(si) * Math.pow(Math.abs(si), e) * (si >= 0 ? ref.h : bb), z = Math.sign(c) * Math.pow(Math.abs(c), e) * ref.w;
        if (k) l += Math.hypot(y - py, z - pz);
        (py = y), (pz = z);
        echant.push([a, l]);
      }
      for (let j = 0, k = 0; j <= N; j++) {
        const voulu = (j / N) * l;
        while (k < M && echant[k + 1][1] < voulu) k++;
        const [a0, l0] = echant[k], [a1, l1] = echant[Math.min(M, k + 1)];
        angles.push(a0 + (a1 - a0) * (l1 > l0 ? (voulu - l0) / (l1 - l0) : 0));
      }
    }
    const v3 = new THREE.Vector3();
    // un point de la coque : à l'abscisse x, à l'angle a (0 = côté droit z+, π/2 = le dessus, −π/2 = le dessous)
    function brut(x, a, p) {
      const c = Math.cos(a), s = Math.sin(a), n = NN(x), e = 2 / n;
      p.set(x, Y(x) + Math.sign(s) * Math.pow(Math.abs(s), e) * (s >= 0 ? H(x) : B(x)), Z(x) + Math.sign(c) * Math.pow(Math.abs(c), e) * W(x));
      if (o.deformer) o.deformer(p, a);
      return p;
    }
    const pos = [], uv = [], idx = [], NT = tranches.length;
    for (let i = 0; i < NT; i++) {
      let arc = 0;
      const prec = new THREE.Vector3();
      for (let j = 0; j <= N; j++) {
        brut(tranches[i], angles[j], v3);
        if (j) arc += v3.distanceTo(prec);
        prec.copy(v3);
        pos.push(v3.x, v3.y, v3.z);
        uv.push(tranches[i] / (o.uv || 1), arc / (o.uv || 1));
      }
    }
    const R = N + 1;
    for (let i = 0; i < NT - 1; i++) for (let j = 0; j < N; j++) {
      const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const fermer = o.fermer === undefined ? [true, true] : o.fermer === true ? [true, true] : o.fermer || [false, false];
    for (const [i, sens] of [[0, -1], [NT - 1, 1]]) {
      if (!fermer[sens < 0 ? 0 : 1]) continue;
      const centre = pos.length / 3, x = tranches[i];
      brut(x, 0, v3);
      pos.push(x, Y(x), Z(x));
      uv.push(x / (o.uv || 1), 0);
      for (let j = 0; j < N; j++) {
        const a = i * R + j, b = a + 1;
        if (sens > 0) idx.push(centre, b, a);
        else idx.push(centre, a, b);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const nor = g.attributes.normal;
    // (les faces doivent regarder vers l'extérieur : on calcule le « volume signé » de la forme ; s'il est négatif, les
    // triangles tournent dans le mauvais sens, et on retourne tout)
    let volume = 0;
    const ia = g.index.array, A = new THREE.Vector3(), Bv = new THREE.Vector3(), Cv = new THREE.Vector3();
    const centre = new THREE.Vector3(tranches[Math.floor(NT / 2)], Y(tranches[Math.floor(NT / 2)]), Z(tranches[Math.floor(NT / 2)]));
    for (let t = 0; t < ia.length; t += 3) {
      A.fromArray(pos, ia[t] * 3).sub(centre);
      Bv.fromArray(pos, ia[t + 1] * 3).sub(centre);
      Cv.fromArray(pos, ia[t + 2] * 3).sub(centre);
      volume += A.dot(Bv.cross(Cv));
    }
    if ((volume < 0) !== !!o.retourner) {
      const t = g.index.array;
      for (let j = 0; j < t.length; j += 3) [t[j + 1], t[j + 2]] = [t[j + 2], t[j + 1]];
      g.computeVertexNormals();
    }
    // la couture (le premier et le dernier point de chaque anneau sont au même endroit) : même normale des deux côtés
    for (let i = 0; i < NT; i++) {
      const a = i * R, b = a + N;
      v3.set(nor.getX(a) + nor.getX(b), nor.getY(a) + nor.getY(b), nor.getZ(a) + nor.getZ(b)).normalize();
      nor.setXYZ(a, v3.x, v3.y, v3.z);
      nor.setXYZ(b, v3.x, v3.y, v3.z);
    }
    // les couleurs (par point) et les zones (par triangle)
    const P = g.attributes.position, tout = g.toNonIndexed(), np = tout.attributes.position, nn = tout.attributes.normal, n = np.count;
    const col = new Float32Array(n * 3), cp = new THREE.Vector3(), cn = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const c = o.couleur ? o.couleur(cp.fromBufferAttribute(np, i), cn.fromBufferAttribute(nn, i)) : [1, 1, 1];
      (col[i * 3] = c[0]), (col[i * 3 + 1] = c[1]), (col[i * 3 + 2] = c[2]);
    }
    tout.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const zones = {};
    const mettre = (nom, t) => {
      const z = zones[nom] || (zones[nom] = { position: [], normal: [], uv: [], color: [] });
      for (let k = 0; k < 3; k++) {
        const i = t + k;
        z.position.push(np.getX(i), np.getY(i), np.getZ(i));
        z.normal.push(nn.getX(i), nn.getY(i), nn.getZ(i));
        z.uv.push(tout.attributes.uv.getX(i), tout.attributes.uv.getY(i));
        z.color.push(col[i * 3], col[i * 3 + 1], col[i * 3 + 2]);
      }
    };
    // (la zone est choisie pour chaque CARRÉ de la grille — ses 2 triangles ensemble — : les bords des vitres suivent les
    // lignes de la grille, sans dents de scie)
    const nQuads = (NT - 1) * N, infoZone = { x: 0, a: 0, droite: true };
    for (let t = 0; t < n; t += 3) {
      const q = Math.floor(t / 3);
      let nom;
      if (q < nQuads * 2) {
        if (q % 2) continue; // (le 2e triangle du carré est rangé avec le 1er)
        const t2 = t + 3; // (les 6 sommets des 2 triangles : leur moyenne est le centre du carré)
        cp.set(0, 0, 0);
        cn.set(0, 0, 0);
        for (let i = t; i < t + 6; i++) {
          cp.x += np.getX(i) / 6, cp.y += np.getY(i) / 6, cp.z += np.getZ(i) / 6;
          cn.x += nn.getX(i), cn.y += nn.getY(i), cn.z += nn.getZ(i);
        }
        cn.normalize();
        // (on dit aussi à « zone » où est le carré sur la grille : son abscisse et son angle autour de la coque, ramené
        // du côté droit — comme ça, une vitre se décrit par « de x1 à x2, de l'angle a1 à l'angle a2 » et ses bords sont
        // pile sur les lignes de la grille)
        const iq = Math.floor(q / 2 / N), jq = (q / 2) % N, a = (angles[jq] + angles[jq + 1]) / 2;
        infoZone.x = (tranches[iq] + tranches[iq + 1]) / 2;
        infoZone.a = a <= Math.PI / 2 ? a : Math.PI - a;
        infoZone.droite = a <= Math.PI / 2 && a > -Math.PI / 2 + 1e-6;
        nom = o.zone ? o.zone(cp, cn, infoZone) : "coque";
        if (nom) (mettre(nom, t), mettre(nom, t2));
        continue;
      }
      cp.set((np.getX(t) + np.getX(t + 1) + np.getX(t + 2)) / 3, (np.getY(t) + np.getY(t + 1) + np.getY(t + 2)) / 3, (np.getZ(t) + np.getZ(t + 1) + np.getZ(t + 2)) / 3);
      cn.set(nn.getX(t) + nn.getX(t + 1) + nn.getX(t + 2), nn.getY(t) + nn.getY(t + 1) + nn.getY(t + 2), nn.getZ(t) + nn.getZ(t + 1) + nn.getZ(t + 2)).normalize();
      infoZone.x = cp.x;
      infoZone.a = 0;
      nom = o.zone ? o.zone(cp, cn, infoZone) : "coque";
      if (nom) mettre(nom, t);
    }
    const geos = {};
    for (const nom in zones) {
      const z = zones[nom], r = new THREE.BufferGeometry();
      r.setAttribute("position", new THREE.Float32BufferAttribute(z.position, 3));
      r.setAttribute("normal", new THREE.Float32BufferAttribute(z.normal, 3));
      r.setAttribute("uv", new THREE.Float32BufferAttribute(z.uv, 2));
      r.setAttribute("color", new THREE.Float32BufferAttribute(z.color, 3));
      geos[nom] = r;
    }
    g.dispose();
    // un point de la surface et sa normale (pour y poser un hublot, une antenne, une poignée…)
    function point(x, a, decalage) {
      const p = brut(x, a, new THREE.Vector3()), e = 0.01;
      const px = brut(x + e, a, new THREE.Vector3()).sub(brut(x - e, a, new THREE.Vector3()));
      const pa = brut(x, a + e, new THREE.Vector3()).sub(brut(x, a - e, new THREE.Vector3()));
      const normale = pa.cross(px).normalize();
      if (o.retourner) normale.negate();
      if (decalage) p.addScaledVector(normale, decalage);
      return { p, n: normale };
    }
    return { geos, point, Y, W, H, B };
  }
  // Une SURFACE en grille (nu × nv points) donnée par une fonction f(u, v) → [x, y, z] (u, v entre 0 et 1), aux normales
  // lissées. fermeeV : l'anneau en v se referme (une pale, un tube).
  function surface(nu, nv, f, fermeeV) {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
      const p = f(i / nu, j / nv);
      pos.push(p[0], p[1], p[2]);
      uv.push(i / nu, j / nv);
    }
    const R = nv + 1;
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = i * R + j, b = a + 1, c = a + R, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (fermeeV) { // (la couture : même normale des deux côtés)
      const nor = g.attributes.normal, v = new THREE.Vector3();
      for (let i = 0; i <= nu; i++) {
        const a = i * R, b = a + nv;
        v.set(nor.getX(a) + nor.getX(b), nor.getY(a) + nor.getY(b), nor.getZ(a) + nor.getZ(b)).normalize();
        nor.setXYZ(a, v.x, v.y, v.z);
        nor.setXYZ(b, v.x, v.y, v.z);
      }
    }
    return g;
  }
  // Une forme TOURNÉE autour de l'axe x (une nacelle de moteur, un réservoir, un pneu couché…) : profil [[x, rayon], …].
  function tourX(profil, mat, n, teinte) {
    const g = new THREE.LatheGeometry(profil.map(([x, r]) => new THREE.Vector2(Math.max(0, r), x)), n || 24);
    g.rotateZ(-Math.PI / 2);
    return piece(g, mat, 0, 0, 0, teinte);
  }
  // Une pièce « posée » sur une surface : placée au point p, son axe y tourné vers la normale n.
  function surLaSurface(m, p, n) {
    m.position.copy(p);
    m.quaternion.setFromUnitVectors(AXE_Y, n);
    return m;
  }

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
      // (étape 74 : une pièce qui a déjà ses propres couleurs de sommets, sans teinte, les garde : une coque peinte)
      if (mat.vertexColors && !(g.attributes.color && g.attributes.color.itemSize === 3 && enfant.userData.teinte === undefined)) {
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

  return { bilan, piece, boite, cylindre, couche, tube, cable, profil, contourComplet, lisse, fuseau, tour, souder, geometrieTeintee, camoAPlat, coque, surface, tourX, surLaSurface, courbeMonotone };
})();
