// 🌴 LA JUNGLE EN 3D : le paysagiste de la vallée de Ternovie (demande 115, édition « Guerre froide »)
//
// Le géomètre (logique/terrain.js) a aplati les TERRASSES des rizières et la COLLINE de la base de feu, et rangé des
// palmiers parmi les arbres. Le paysagiste pose ce qu'on voit :
//   - les PALMIERS : un tronc fin et un peu penché, avec ses anneaux, et une couronne de 11 grandes palmes qui retombent
//     (le peintre des arbres, affichage/decor.js, les dessine à la place des sapins : mêmes instances, même vent) ;
//   - les RIZIÈRES : l'eau de chaque terrasse (avec les rangs de jeunes plants de riz peints dessus), et les DIGUETTES de
//     terre entre les cases, sur lesquelles on marche ;
//   - la BASE DE FEU : la terre rouge battue du sommet, et la PLATEFORME DES HÉLICOS (des plaques d'acier perforées, le
//     grand « H » blanc) ;
//   - les HUTTES SUR PILOTIS du village de Ban-Tarak (des perchoirs : logique/perchoirs.js) : les pilotis, le plancher, les
//     murs bas en bambou tressé, les poteaux d'angle et le grand toit de chaume (le charpentier, affichage/perchoirs3d.js,
//     les construit avec ce dessin).
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Jungle3D = (function () {
  const T = Tanks.Terrain, O = Tanks.Outils3D;
  const bilan = { rizieres: 0, cases: 0, diguettes: 0, palmiers: 0, huttes: 0 };
  let etat = 1970;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ------------------------------------------------------------------ LE PALMIER (prêté au peintre des arbres)
  // outils = { fusion, peindre, tronc, lin } (ceux de affichage/decor.js : chaque forme a ses couleurs dans les sommets)
  function palmier(outils) {
    const { fusion, peindre, tronc, lin } = outils;
    const ECORCE = lin(128, 112, 88), PALME = lin(86, 128, 52), PALME_SECHE = lin(132, 128, 70);
    const H = 8.4, PENCHE = 1.3; // m : la hauteur du tronc, et de combien le haut penche
    const pencher = (g) => { // le tronc se courbe doucement (plus en haut)
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + PENCHE * (p.getY(i) / H) ** 2);
      g.computeVertexNormals();
      return g;
    };
    function palmes(n, seg, longueur) {
      const geos = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + (k % 2) * 0.2, retombe = 0.6 + (k % 3) * 0.25, L = longueur * (0.85 + (k % 4) * 0.08);
        const g = new THREE.PlaneGeometry(1, 1, 2, seg), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const u = p.getX(i), t = p.getY(i) + 0.5; // u : en travers (−0,5 à 0,5) ; t : le long de la palme (0 à 1)
          const largeur = 1.5 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.05, d = L * t;
          // la palme monte un peu puis RETOMBE (une parabole), les deux moitiés en V (la nervure au milieu)
          const y = H + 0.2 + d * 0.45 - retombe * d * d * 0.16 - Math.abs(u) * largeur * 0.35, l = u * largeur;
          p.setXYZ(i, PENCHE + Math.cos(a) * d - Math.sin(a) * l, y, Math.sin(a) * d + Math.cos(a) * l);
        }
        g.computeVertexNormals();
        const seche = k % 5 === 4; // (une palme sur 5 est sèche, jaunie)
        geos.push(peindre(g.toNonIndexed(), (x, y, z, nx, ny) => (seche ? PALME_SECHE : PALME).clone().multiplyScalar(0.7 + 0.3 * Math.max(0, ny))));
      }
      // les noix de coco sous la couronne
      for (let k = 0; k < 4; k++) {
        const a = k * 1.7, c = new THREE.SphereGeometry(0.18, 6, 4).translate(PENCHE + Math.cos(a) * 0.3, H - 0.15, Math.sin(a) * 0.3);
        geos.push(peindre(c.toNonIndexed(), () => lin(92, 74, 40)));
      }
      return fusion(geos);
    }
    // le tronc : fin, un peu plus large au pied, avec des ANNEAUX (des bourrelets tous les 0,45 m)
    const pts = [[0.001, 0], [0.34, 0], [0.24, 0.5]];
    for (let y = 0.9; y < H; y += 0.45) pts.push([0.2 - (y / H) * 0.06, y - 0.08], [0.215 - (y / H) * 0.06, y]);
    pts.push([0.12, H + 0.1], [0.001, H + 0.2]);
    const geoTronc = pencher(tronc(pts, 8));
    geoTronc.attributes.color && peindre(geoTronc, (x, y) => ECORCE.clone().multiplyScalar(0.7 + 0.3 * Math.min(1, y / 3)));
    const simpleTronc = pencher(peindre(new THREE.CylinderGeometry(0.13, 0.28, H, 5).translate(0, H / 2, 0).toNonIndexed(), () => ECORCE));
    bilan.palmiers++;
    return { tronc: fusion([geoTronc]), palmes: palmes(12, 8, 5.6), simple: fusion([simpleTronc, palmes(7, 3, 5.4)]) };
  }

  // ------------------------------------------------------------------ LES RIZIÈRES, LA BASE DE FEU
  // l'image de l'eau : des rangs de jeunes plants de riz (des petits traits verts sur l'eau boueuse)
  function imageRiz() {
    const c = document.createElement("canvas"), t = 128;
    c.width = c.height = t;
    const x = c.getContext("2d");
    x.fillStyle = "#8b9a72";
    x.fillRect(0, 0, t, t);
    for (let r = 0; r < 8; r++) for (let k = 0; k < 16; k++) {
      const px = k * 8 + (r % 2) * 4 + hasard() * 2, py = r * 16 + 4 + hasard() * 3;
      x.fillStyle = "rgba(" + (70 + hasard() * 40) + "," + (130 + hasard() * 50) + ",50,0.95)";
      for (let b = 0; b < 4; b++) x.fillRect(px + b - 1.5, py - 4 + Math.abs(b - 1.5), 1, 6);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  function construire(groupe, ajouter) {
    const RZ = T.rizieres || [], BF = T.baseDeFeu;
    if (!RZ.length && !BF) return;
    const eau = new THREE.MeshStandardMaterial({ color: 0xc8d2b8, map: imageRiz(), roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.92 });
    const terre = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
    for (const r of RZ) {
      // 1. l'eau : un rectangle par rangée de cases (à la hauteur de sa terrasse + 15 cm), l'image répétée tous les 4 m
      const pos = [], uv = [], idx = [];
      for (let j = 0; j < r.nr; j++) {
        const z0 = r.z0 + j * r.c, z1 = z0 + r.c, y = T.niveauRiz(r, z0 + r.c / 2) + 0.15, n = pos.length / 3;
        for (const [x, z] of [[r.x0, z0], [r.x1, z0], [r.x1, z1], [r.x0, z1]]) pos.push(x, y, z), uv.push(x / 4, z / 4);
        idx.push(n, n + 2, n + 1, n, n + 3, n + 2);
        bilan.cases += r.nc;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, eau);
      m.receiveShadow = true;
      ajouter(groupe, m);
      // 2. les DIGUETTES : des bourrelets de terre sur les bords des cases (plus hauts entre deux terrasses)
      const pieces = new THREE.Group(), BRUN = [0x6e5434, 0x7a5e3a, 0x655032];
      for (let j = 0; j < r.nr; j++) {
        const zc = r.z0 + j * r.c + r.c / 2, y = T.niveauRiz(r, zc);
        for (let i = 0; i <= r.nc; i++) pieces.add(O.boite(0.9, 0.7, r.c + 0.9, terre, r.x0 + i * r.c, y + 0.05, zc, BRUN[(i + j) % 3]));
        for (const bord of j === 0 ? [0, 1] : [1]) {
          const z = r.z0 + (j + bord) * r.c, y2 = bord ? Math.max(y, T.niveauRiz(r, Math.min(r.z1 - 0.1, z + r.c / 2))) : y;
          pieces.add(O.boite(r.x1 - r.x0 + 0.9, 0.7, 0.9, terre, (r.x0 + r.x1) / 2, y2 + 0.05, z, BRUN[(j + bord) % 3]));
        }
        bilan.diguettes += r.nc + 2;
      }
      for (const d of O.souder(pieces, false)) ajouter(groupe, d);
      bilan.rizieres++;
    }
    // 3. LA PLATEFORME DES HÉLICOS de la base de feu : des plaques d'acier perforées, le « H » blanc, les fanions
    if (BF && BF.helipad) {
      const [hx, hz] = BF.helipad, y = T.hauteurExacte(hx, hz), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.3 });
      const g = new THREE.Group();
      for (let k = 0; k < 8; k++) g.add(O.boite(18, 0.12, 2.2, mat, hx, y + 0.05, hz - 7.7 + k * 2.2, k % 2 ? 0x4c5240 : 0x535944)); // les plaques
      g.add(O.boite(1.2, 0.04, 7, mat, hx - 2.6, y + 0.13, hz, 0xe8e8de), O.boite(1.2, 0.04, 7, mat, hx + 2.6, y + 0.13, hz, 0xe8e8de), O.boite(4, 0.04, 1.2, mat, hx, y + 0.13, hz, 0xe8e8de)); // le H
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(O.boite(0.4, 0.3, 0.4, mat, hx + sx * 9.3, y + 0.15, hz + sz * 8.9, 0xd8b030)); // les balises d'angle
      g.add(O.tube([hx + 11, y, hz - 9], [hx + 11, y + 5, hz - 9], 0.05, mat, 6, 0x8a8a84)); // le mât de la manche à air
      const manche = O.piece(new THREE.CylinderGeometry(0.25, 0.12, 1.6, 8, 1, true), mat, hx + 11.8, y + 4.8, hz - 9, 0xe07020);
      manche.rotation.z = Math.PI / 2 + 0.3;
      g.add(manche);
      for (const m of O.souder(g, true)) ajouter(groupe, m);
    }
  }
  // les rizières et la base de feu, peintes sur la grande image du sol (decor.js)
  function peindreSol(ctx, X, k) {
    for (const r of T.rizieres || []) {
      ctx.fillStyle = "rgba(92,84,54,0.9)";
      ctx.fillRect(X(r.x0) - 3 * k, X(r.z0) - 3 * k, (r.x1 - r.x0 + 6) * k, (r.z1 - r.z0 + 6) * k);
    }
    const BF = T.baseDeFeu;
    if (BF) { // la terre rouge battue du sommet (le plateau, et les chemins des camions)
      const g = ctx.createRadialGradient(X(BF.x), X(BF.z), 0, X(BF.x), X(BF.z), (BF.plateau + 16) * k);
      g.addColorStop(0, "rgba(150,92,58,0.95)");
      g.addColorStop(0.7, "rgba(140,90,60,0.85)");
      g.addColorStop(1, "rgba(120,96,64,0)");
      ctx.fillStyle = g;
      ctx.fillRect(X(BF.x) - (BF.plateau + 16) * k, X(BF.z) - (BF.plateau + 16) * k, (BF.plateau + 16) * 2 * k, (BF.plateau + 16) * 2 * k);
    }
  }

  // ------------------------------------------------------------------ LA HUTTE SUR PILOTIS (un perchoir)
  // (dans le repère du perchoir : x = u, z = v, y depuis le pied ; l'échelle est du côté +v)
  if (Tanks.Perchoirs3D) Tanks.Perchoirs3D.ajouterModele("hutte", (p, H, mat, outils) => {
    const pieces = [], a = p.demiL, f = p.piedL, B = outils.couleurs, BAMBOU = 0xa89060, CHAUME = 0xb39a5c, CHAUME_S = 0x8c7646;
    for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) pieces.push(O.tube([sx * f, -0.6, sz * f], [sx * f, H, sz * f], 0.12, mat, 6, B.BOIS_SOMBRE)); // les pilotis
    for (const sz of [-1, 1]) pieces.push(O.tube([-f, H * 0.45, sz * f], [f, H * 0.45, sz * f], 0.06, mat, 4, B.BOIS)); // les traverses
    pieces.push(O.boite(a * 2 + 0.3, 0.16, a * 2 + 0.3, mat, 0, H - 0.08, 0, B.PLANCHE)); // le plancher
    // les murs bas en bambou tressé (1 m), avec la porte du côté de l'échelle, et les poteaux d'angle jusqu'au toit
    const mur = (l, x, z, rot) => { const m = O.boite(l, 1.0, 0.1, mat, x, H + 0.5, z, BAMBOU); m.rotation.y = rot; pieces.push(m); };
    mur(a * 2, 0, -a, 0);
    mur(a * 2, -a, 0, Math.PI / 2);
    mur(a * 2, a, 0, Math.PI / 2);
    mur(a * 0.7, -a * 0.65, a, 0);
    mur(a * 0.7, a * 0.65, a, 0);
    for (const y of [0.25, 0.5, 0.75, 0.98]) for (const [l, x, z, r] of [[a * 2, 0, -a - 0.06, 0], [a * 2, -a - 0.06, 0, Math.PI / 2], [a * 2, a + 0.06, 0, Math.PI / 2]]) {
      const b = O.boite(l, 0.035, 0.04, mat, x, H + y, z, 0x7a6640); // (les lattes du tressage)
      b.rotation.y = r;
      pieces.push(b);
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pieces.push(O.tube([sx * a, H, sz * a], [sx * a, H + 2.3, sz * a], 0.08, mat, 5, B.BOIS));
    // le grand toit de chaume à 4 pentes, qui déborde largement (contre la pluie de la mousson)
    const toit = O.piece(new THREE.ConeGeometry(a * 2.05, 2.0, 4, 1), mat, 0, H + 3.25, 0, CHAUME);
    toit.rotation.y = Math.PI / 4;
    toit.scale.set(1, 1, 0.85);
    pieces.push(toit);
    const dessous = O.piece(new THREE.ConeGeometry(a * 2.0, 0.3, 4, 1, true), mat, 0, H + 2.3, 0, CHAUME_S);
    dessous.rotation.y = Math.PI / 4;
    pieces.push(dessous);
    outils.echelle(pieces, mat, p.echelle.vBas, p.echelle.vHaut, H, BAMBOU);
    bilan.huttes++;
    return pieces;
  });

  return { palmier, construire, peindreSol, bilan };
})();
