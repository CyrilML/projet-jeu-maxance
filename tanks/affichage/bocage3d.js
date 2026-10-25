// 🌉 LE BOCAGE EN 3D : le paysagiste de 1944 (demande 115, édition « Seconde Guerre mondiale »)
//
// Le géomètre (logique/terrain.js) a creusé le LIT DE LA RIVIÈRE (peu profond : on la traverse à gué) et laissé le sol au
// sec sous les PONTS. Le paysagiste pose ce qu'on voit :
//   - l'EAU de la rivière : un long ruban qui suit les méandres, un peu sous le bord des talus, vert-brun et lisse, qui
//     reflète un peu le ciel ;
//   - les PONTS de pierre : le tablier (on marche dessus), les parapets de chaque côté, et l'arche dessous ;
// (les haies du bocage, les fermes et les vergers sont des haies, des granges et des arbres : les autres peintres les
// dessinent déjà). Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Bocage3D = (function () {
  const T = Tanks.Terrain, O = Tanks.Outils3D;
  const bilan = { eau: 0, ponts: 0, triangles: 0 };
  function construire(groupe, ajouter) {
    const RV = T.riviere;
    if (!RV) return;
    const R = RV.R, PAS = 6, pos = [], idx = [];
    // 1. l'eau : un ruban, 2 points par tranche (les 2 rives), coupé en morceaux de 140 m (pour ne dessiner que ce qu'on voit)
    const mat = new THREE.MeshStandardMaterial({ color: 0x4d5a40, roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.88 });
    let x = R.x[0];
    while (x < R.x[1]) {
      const pts = [], fin = Math.min(R.x[1], x + 140);
      for (let xx = x; xx <= fin + 0.01; xx += PAS) {
        const z = RV.zRiviere(xx), bord = (T.hauteurExacte(xx, z - R.largeur / 2 - R.talus) + T.hauteurExacte(xx, z + R.largeur / 2 + R.talus)) / 2, y = bord - R.profondeur * 0.55;
        pts.push([xx, y, z - R.largeur / 2 - R.talus * 0.5], [xx, y, z + R.largeur / 2 + R.talus * 0.5]);
      }
      const p = [], ix = [];
      pts.forEach((q) => p.push(...q));
      for (let k = 0; k < pts.length / 2 - 1; k++) { const a = k * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
      g.setIndex(ix);
      g.computeVertexNormals();
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = true;
      ajouter(groupe, m);
      bilan.eau++;
      bilan.triangles += ix.length / 3;
      x = fin;
    }
    // 2. les ponts de pierre
    const pierre = Tanks.Chars3D.materiaux().teinte;
    for (const px of R.ponts) {
      const z = RV.zRiviere(px), y = T.hauteurExacte(px, z), L = R.largeur + R.talus * 2 + 6, g = new THREE.Group();
      g.add(O.boite(R.pont, 0.5, L, pierre, px, y - 0.2, z, 0x8f8a7c)); // le tablier
      for (const s of [-1, 1]) g.add(O.boite(0.45, 0.9, L, pierre, px + s * (R.pont / 2 - 0.22), y + 0.45, z, 0x9a9484)); // les parapets
      for (const s of [-1, 1]) { // l'arche : un demi-anneau sous le tablier, de chaque côté
        const a = O.piece(new THREE.TorusGeometry(R.largeur * 0.42, 0.55, 6, 14, Math.PI), pierre, px + s * (R.pont / 2 - 0.3), y - 0.5 - R.largeur * 0.42, z, 0x7f7a6d);
        a.rotation.set(0, Math.PI / 2, 0);
        g.add(a);
      }
      for (const m of O.souder(g, true)) (m.receiveShadow = true), ajouter(groupe, m);
      bilan.ponts++;
    }
  }
  // la rivière peinte sur la grande image du sol (decor.js) : la vase brun-vert du lit et l'herbe sombre des berges
  function peindreSol(ctx, X, k) {
    const RV = T.riviere;
    if (!RV) return;
    const R = RV.R;
    ctx.lineCap = ctx.lineJoin = "round";
    for (const [l, c] of [[R.largeur + R.talus * 2 + 6, "rgba(52,70,34,0.55)"], [R.largeur + R.talus, "rgba(86,82,58,0.9)"], [R.largeur, "rgba(58,72,60,0.95)"]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = l * k;
      ctx.beginPath();
      for (let x = R.x[0]; x <= R.x[1]; x += 6) x === R.x[0] ? ctx.moveTo(X(x), X(RV.zRiviere(x))) : ctx.lineTo(X(x), X(RV.zRiviere(x)));
      ctx.stroke();
    }
  }
  return { construire, peindreSol, bilan };
})();
