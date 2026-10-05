// 🛶 LA COQUE : le constructeur de coques (étape 51)
//
// Comment construire une carrosserie qui a de VRAIES courbes ? Comme on construit la coque d'un bateau :
//   1. on décrit la voiture par des TRANCHES (des « couples », disent les charpentiers de marine) : à quelques
//      endroits de la longueur, on dit la forme de la voiture vue de face (sa largeur, la hauteur du bas, des
//      épaules et du dessus) ;
//   2. entre deux tranches, le constructeur en invente d'autres, tous les 4 cm, en suivant une courbe douce
//      (une « spline ») : le capot, le toit et les ailes n'ont plus d'angles ;
//   3. il relie chaque tranche à la suivante par de petits triangles : c'est la peau de la voiture.
//
// Une tranche, vue de face : un fond plat (yb), des flancs (jusqu'à yc, à la demi-largeur w), puis un dessus
// arrondi qui va des épaules jusqu'au milieu (yt). La rondeur n dit la forme du dessus : 2 = tout rond (une
// ellipse), 4 = presque carré. Si yt est plus BAS que yc, les ailes sont plus hautes que le capot (comme une Porsche).
//
// Les VITRES font partie de la peau de la cabine : chaque petit triangle est rangé « peinture » ou « vitre »,
// selon l'endroit où il est et le sens dans lequel il regarde. Les vitres sont donc parfaitement au ras.
//
// Toutes les coques sont « nez vers x+ », posées sur y = 0, centrées en z = 0. Ce fichier ne connaît aucune voiture.

window.Circuit = window.Circuit || {};

Circuit.Coque = (function () {
  const PAS = 0.04; // m : une tranche tous les 4 cm
  const CHAMPS = ["yb", "yc", "yt", "w", "n", "wb"];

  // Une valeur entre les tranches clés, en suivant une courbe douce (Catmull-Rom).
  function interpoler(cles, x) {
    if (x <= cles[0].x) return Object.assign({}, cles[0], { x });
    if (x >= cles[cles.length - 1].x) return Object.assign({}, cles[cles.length - 1], { x });
    let i = 0;
    while (cles[i + 1].x < x) i++;
    const a = cles[Math.max(0, i - 1)], b = cles[i], c = cles[i + 1], d = cles[Math.min(cles.length - 1, i + 2)];
    const t = (x - b.x) / (c.x - b.x);
    const r = { x };
    for (const k of CHAMPS) {
      const p0 = a[k], p1 = b[k], p2 = c[k], p3 = d[k];
      if (p1 === undefined) continue;
      const t2 = t * t, t3 = t2 * t;
      // (on « serre » un peu la courbe pour qu'elle ne dépasse jamais trop les valeurs des tranches clés)
      const m1 = ((p2 - (p0 === undefined ? p1 : p0)) / 2) * 0.8, m2 = (((p3 === undefined ? p2 : p3) - p1) / 2) * 0.8;
      r[k] = (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
    }
    return r;
  }

  // La moitié d'une tranche (côté z > 0), du milieu du fond jusqu'au milieu du dessus : une liste de [z, y].
  const N_DESSUS = 12;
  // (Au-dessus d'une roue, le bas de la tranche fait une « marche » : le milieu reste en bas (le plancher), et seule
  // la partie extérieure, au-dessus du pneu, remonte jusqu'à ya : c'est le passage de roue.)
  function demiTranche(s) {
    const wb = s.wb === undefined ? s.w * 0.96 : s.wb;
    const ya = s.ya === undefined ? s.yb : s.ya, za = Math.min(s.za === undefined ? wb * 0.6 : s.za, wb - 0.06);
    const r = Math.min(0.1, Math.max(0.02, (s.yc - ya) * 0.4));
    const pts = [[0, s.yb], [za * 0.5, s.yb], [za, s.yb], [za, ya], [Math.max(za, wb - r), ya]];
    // le coin du bas, arrondi
    for (let k = 1; k <= 3; k++) {
      const a = -Math.PI / 2 + (k / 3) * (Math.PI / 2);
      pts.push([wb - r + Math.cos(a) * r + (s.w - wb) * (k / 3), ya + r + Math.sin(a) * r]);
    }
    // le flanc, qui monte jusqu'aux épaules
    for (let k = 1; k <= 2; k++) pts.push([s.w, ya + r + (s.yc - ya - r) * (k / 2)]);
    // le dessus : un quart de « super-ellipse » des épaules (w, yc) au milieu (0, yt)
    const n = s.n || 2.5;
    for (let k = 1; k <= N_DESSUS; k++) {
      const a = (k / N_DESSUS) * (Math.PI / 2);
      const c = Math.pow(Math.cos(a), 2 / n), si = Math.pow(Math.sin(a), 2 / n);
      pts.push([s.w * c, s.yc + (s.yt - s.yc) * si]);
    }
    pts[pts.length - 1][0] = 0;
    return pts;
  }

  // options : {
  //   cles: [{ x, yb, yc, yt, w, n, wb }, …] (les tranches clés, de l'arrière vers l'avant),
  //   arches: [{ x, y, r, z }] (les passages de roues : à partir de z (vers l'extérieur), le bas de la coque remonte en arc),
  //   vitre: (centre, normale, tranche) → vrai si ce petit morceau de peau est une vitre,
  //   pas (m, 4 cm par défaut) }
  // Renvoie { geometrie (groupe 0 = peinture, groupe 1 = vitres), tranche(x), dessus(x, z), xMin, xMax }.
  function construire(options) {
    const cles = options.cles.slice().sort((a, b) => a.x - b.x);
    const xMin = cles[0].x, xMax = cles[cles.length - 1].x;
    const pas = options.pas || PAS;
    const arches = options.arches || [];
    // Les tranches : tous les 4 cm, et plus serrées autour des arches de roues (pour que l'arc soit bien rond).
    const xs = [];
    for (let x = xMin; x < xMax - 1e-6; x += pas) xs.push(x);
    xs.push(xMax);
    for (const a of arches) for (let k = -12; k <= 12; k++) xs.push(a.x + (k / 12) * a.r * 0.999);
    xs.sort((a, b) => a - b);
    const tranches = [];
    for (const x of xs) {
      if (x < xMin || x > xMax || (tranches.length && x - tranches[tranches.length - 1].x < 0.004)) continue;
      const s = interpoler(cles, x);
      s.ya = s.yb;
      for (const a of arches) {
        const dx = x - a.x;
        if (Math.abs(dx) < a.r) {
          s.ya = Math.max(s.ya, a.y + Math.sqrt(a.r * a.r - dx * dx));
          s.za = a.z;
        }
      }
      s.ya = Math.min(s.ya, s.yc - 0.04);
      tranches.push(s);
    }
    // Les points : chaque tranche fait un anneau (la demi-tranche, puis son reflet de l'autre côté).
    const positions = [];
    let parAnneau = 0;
    for (const s of tranches) {
      const d = demiTranche(s);
      const anneau = d.concat(d.slice(1, -1).reverse().map(([z, y]) => [-z, y]));
      parAnneau = anneau.length;
      for (const [z, y] of anneau) positions.push(s.x, y, z);
    }
    // Les petits triangles, rangés en « peinture » ou « vitre ».
    const peinture = [], vitres = [];
    const P = (i) => [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
    for (let t = 0; t < tranches.length - 1; t++) {
      for (let k = 0; k < parAnneau; k++) {
        const a = t * parAnneau + k, b = t * parAnneau + ((k + 1) % parAnneau), c = a + parAnneau, e = b + parAnneau;
        let liste = peinture;
        if (options.vitre) {
          const pa = P(a), pb = P(b), pc = P(c), pe = P(e);
          const centre = [(pa[0] + pb[0] + pc[0] + pe[0]) / 4, (pa[1] + pb[1] + pc[1] + pe[1]) / 4, (pa[2] + pb[2] + pc[2] + pe[2]) / 4];
          const u = [pc[0] - pa[0], pc[1] - pa[1], pc[2] - pa[2]], v = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]];
          let nrm = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
          const l = Math.hypot(...nrm) || 1;
          nrm = nrm.map((q) => q / l);
          // (la normale doit regarder vers l'extérieur : à l'opposé du milieu de la voiture)
          if (nrm[1] * (centre[1] - (tranches[t].yb + tranches[t].yt) / 2) + nrm[2] * centre[2] < 0) nrm = nrm.map((q) => -q);
          if (options.vitre(centre, nrm, tranches[t])) liste = vitres;
        }
        liste.push(a, c, b, b, c, e);
      }
    }
    // Les deux bouts : on ferme chaque anneau avec un éventail de triangles autour de son centre.
    // (Les points du bord sont recopiés : comme ça, le bout est bien plat et ne « bave » pas sur les côtés.)
    for (const [t, sens] of [[0, -1], [tranches.length - 1, 1]]) {
      const s = tranches[t], centre = positions.length / 3;
      positions.push(s.x, (s.yb + s.yt) / 2, 0);
      const debut = positions.length / 3;
      for (let k = 0; k < parAnneau; k++) {
        const i = (t * parAnneau + k) * 3;
        positions.push(positions[i], positions[i + 1], positions[i + 2]);
      }
      for (let k = 0; k < parAnneau; k++) {
        const a = debut + k, b = debut + ((k + 1) % parAnneau);
        if (sens > 0) peinture.push(centre, b, a);
        else peinture.push(centre, a, b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(peinture.concat(vitres));
    geo.addGroup(0, peinture.length, 0);
    geo.addGroup(peinture.length, vitres.length, 1);
    geo.computeVertexNormals();
    // Le sens des triangles : on vérifie que les normales regardent dehors (sinon on les retourne).
    retournerSiBesoin(geo);

    const tranche = (x) => interpoler(cles, Math.max(xMin, Math.min(xMax, x)));
    // La hauteur du dessus de la coque en (x, z) (sur les flancs : la hauteur des épaules).
    function dessus(x, z) {
      const s = tranche(x), n = s.n || 2.5, q = Math.min(1, Math.abs(z) / s.w);
      const a = Math.acos(Math.pow(q, n / 2));
      return s.yc + (s.yt - s.yc) * Math.pow(Math.sin(a), 2 / n);
    }
    return { geometrie: geo, tranche, dessus, xMin, xMax };
  }

  function retournerSiBesoin(geo) {
    const pos = geo.attributes.position, nor = geo.attributes.normal;
    let dehors = 0;
    const centre = new THREE.Vector3();
    geo.computeBoundingBox();
    geo.boundingBox.getCenter(centre);
    for (let i = 0; i < pos.count; i += 7) {
      const dx = pos.getX(i) - centre.x, dy = pos.getY(i) - centre.y, dz = pos.getZ(i) - centre.z;
      dehors += Math.sign(dx * nor.getX(i) + dy * nor.getY(i) + dz * nor.getZ(i));
    }
    if (dehors >= 0) return;
    const idx = geo.index.array;
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1];
      idx[i + 1] = idx[i + 2];
      idx[i + 2] = t;
    }
    geo.computeVertexNormals();
  }

  return { construire, interpoler };
})();
