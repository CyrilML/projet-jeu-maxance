// 🛡️ LES CHARS À CAGE EN 3D : l'atelier de soudure de la plaine de Velmora (demande 115, édition « Europe de l'Est »)
//
// ✍️ « Des chars modernes peints en blanc, avec des cages anti-drones. » Les deux chars de l'édition sont des chars
// modernes (le même dessin que le Leopard et l'Abrams : affichage/chars3d.js), avec :
//   - la peinture à la CHAUX blanche (les couleurs « peinture » de l'édition : le vert et le gris ressortent par plaques) ;
//   - la CAGE ANTI-DRONES (en vrai, on l'appelle aussi « cage à hamster ») : des poteaux soudés sur la tourelle, un toit
//     de barreaux d'acier au-dessus, des barreaux en biais sur les côtés. Un drone FPV qui plonge éclate souvent sur la
//     cage, à 1 m du blindage (logique/drones-fpv.js : « cage » de la fiche du char).
// Toute la cage est SOUDÉE en un seul objet (1 seul dessin par char) et tourne avec la tourelle.

window.Tanks = window.Tanks || {};

(function () {
  const C3 = Tanks.Chars3D, O = Tanks.Outils3D;
  let acier = null;
  function matiere() {
    return acier || (acier = new THREE.MeshStandardMaterial({ color: 0x5a5c58, roughness: 0.75, metalness: 0.55 }));
  }
  // La cage, posée sur la tourelle « t » (on MESURE la tourelle pour que la cage ait la bonne taille : on range les points
  // de la tourelle du plus bas au plus haut, et on oublie les 3 % qui dépassent le plus — les antennes, les mitrailleuses)
  function cage(t) {
    const xs = [], ys = [], zs = [], v = new THREE.Vector3();
    for (const m of t.children) {
      if (!m.isMesh) continue;
      m.updateMatrix();
      const p = m.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 3) v.fromBufferAttribute(p, i).applyMatrix4(m.matrix), xs.push(v.x), ys.push(v.y), zs.push(v.z);
    }
    const centile = (l, q) => (l.sort((a, b) => a - b), l[Math.min(l.length - 1, Math.floor(l.length * q))]);
    const b = xs.length ? { min: { x: centile(xs, 0.06), y: centile(ys, 0.03) }, max: { x: centile(xs, 0.94), y: centile(ys, 0.72), z: Math.max(-centile(zs, 0.08), centile(zs, 0.92)) } } : { min: { x: -1.5, y: 1.8 }, max: { x: 1.5, y: 2.6, z: 1.4 } };
    const M = matiere(), g = new THREE.Group();
    const x0 = b.min.x - 0.15, x1 = b.max.x - 0.25, z = b.max.z + 0.12, haut = b.max.y + 0.75, pied = b.max.y - 0.1;
    const barre = (a, c, r) => g.add(O.tube(a, c, r || 0.025, M, 4));
    // les poteaux (6), du toit de la tourelle au toit de la cage
    for (const x of [x0 + 0.1, (x0 + x1) / 2, x1 - 0.1]) for (const s of [-1, 1]) barre([x, pied, s * (z - 0.25)], [x, haut, s * z], 0.035);
    // le cadre du toit
    barre([x0, haut, -z], [x1, haut, -z], 0.03), barre([x0, haut, z], [x1, haut, z], 0.03), barre([x0, haut, -z], [x0, haut, z], 0.03), barre([x1, haut, -z], [x1, haut, z], 0.03);
    // les barreaux du toit (en travers, tous les 35 cm) et 2 longerons
    for (let x = x0 + 0.35; x < x1 - 0.1; x += 0.35) barre([x, haut + 0.02, -z], [x, haut + 0.02, z], 0.016);
    for (const s of [-0.35, 0.35]) barre([x0, haut + 0.03, s * z], [x1, haut + 0.03, s * z], 0.018);
    // les barreaux en biais sur les côtés (contre un drone qui arrive de travers)
    for (let x = x0 + 0.25; x < x1; x += 0.5) for (const s of [-1, 1]) barre([x, haut, s * z], [x + 0.25, pied + 0.35, s * (z - 0.1)], 0.014);
    for (const m of O.souder(g, true)) m.castShadow = true;
    g.name = "cage";
    return g;
  }
  // « cage-leopard », « cage-abrams », « cage-leclerc » : le char moderne + sa cage
  for (const base of ["leopard", "abrams", "leclerc"]) {
    C3.ajouterModele("cage-" + base, (fiche, equipe, numero) => {
      const o = C3.fabriquer(Object.assign({}, fiche, { modele3d: null, id: base }), equipe, numero);
      o.tourelle.add(cage(o.tourelle));
      return o;
    });
  }
})();
