// 🔥 LE SOUDEUR : il soude les pièces du décor qui ne bougent jamais (étape 72)
//
// ✍️ « Ça rame trop. » Pour la carte graphique, chaque pièce est un DESSIN à faire, et chaque dessin coûte cher, même
// tout petit. Une ville, c'est des centaines de morceaux de rue, de trottoirs, de murs… Le soudeur les colle ensemble :
// toutes les pièces qui ont la même allure (la même image, la même couleur, la même brillance) deviennent UNE seule
// pièce. L'image a exactement la même allure, mais la carte graphique fait un dessin au lieu de cent.
//
// Une difficulté : deux trottoirs ont la même image (texture), mais répétée un nombre de fois différent (un trottoir
// long la répète plus). Alors, avant de souder, on « cuit » la répétition dans la pièce elle-même (on multiplie ses
// coordonnées de texture), et toutes les pièces partagent une seule matière, sans répétition.
//
// On ne soude JAMAIS ce qui brille (les fenêtres qui s'allument, les feux, les nitros : leur lumière change pendant le
// jeu), ce qui est transparent, les instances (déjà groupées), ni les pièces à plusieurs matières.
// Outil d'affichage générique : il ne connaît aucune carte.

window.Circuit = window.Circuit || {};

Circuit.Souder = (function () {
  const bilan = { avant: 0, apres: 0 };

  // L'« allure » d'une matière : tout ce qui doit être pareil pour que deux pièces puissent être soudées.
  function allure(m) {
    if (!m || !m.isMeshStandardMaterial || m.transparent || m.emissiveMap || (m.emissive && m.emissive.getHex() !== 0) || m.userData.neige || m.alphaTest > 0 || m.normalMap) return null;
    const carte = m.map;
    if (carte && (carte.wrapS !== THREE.RepeatWrapping || carte.wrapT !== THREE.RepeatWrapping || carte.rotation)) return null;
    return [carte ? carte.source.uuid : "-", m.color.getHexString(), m.roughness, m.metalness, m.side, m.vertexColors, m.flatShading, m.envMapIntensity].join("|");
  }

  function souder(groupe) {
    groupe.updateMatrixWorld(true);
    const inverse = groupe.matrixWorld.clone().invert();
    const paquets = new Map();
    const ranger = (o, materiau, morceau) => {
      const g = o.geometry, cle = allure(materiau);
      if (!cle) return false;
      const cleUV = cle + (g.attributes.uv ? "+uv" : "") + (g.attributes.color ? "+couleur" : "") + (o.castShadow ? "+ombre" : "");
      if (!paquets.has(cleUV)) paquets.set(cleUV, []);
      paquets.get(cleUV).push({ o, materiau, morceau });
      return true;
    };
    const aDecouper = [];
    groupe.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.visible || o.userData.bouge) return;
      const g = o.geometry;
      if (!g.attributes.normal || g.morphAttributes.position) return;
      if (!Array.isArray(o.material)) return void ranger(o, o.material, null);
      // Une pièce à plusieurs matières (une boîte : le dessus en planches, les côtés en béton) : chaque face
      // (« groupe ») est soudée avec les pièces de sa matière, si TOUTES ses matières peuvent l'être.
      if (!g.groups.length || g.groups.some((gr) => !allure(o.material[gr.materialIndex]))) return;
      aDecouper.push(o);
    });
    for (const o of aDecouper) for (const gr of o.geometry.groups) ranger(o, o.material[gr.materialIndex], gr);
    const matrice = new THREE.Matrix4();
    for (const pieces of paquets.values()) {
      // (une seule pièce : rien à souder… sauf si c'est le morceau d'une pièce découpée : sinon cette face disparaîtrait)
      if (pieces.length < 2 && !pieces[0].morceau) continue;
      const modele = pieces[0].materiau, g0 = pieces[0].o.geometry, avecUV = !!g0.attributes.uv, avecCouleur = !!g0.attributes.color;
      const pos = [], nor = [], uv = [], col = [];
      const enleves = new Set();
      for (const { o: m, materiau, morceau } of pieces) {
        const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        matrice.multiplyMatrices(inverse, m.matrixWorld);
        geo.applyMatrix4(matrice);
        // (un morceau d'une pièce à plusieurs matières : seulement ses sommets à lui)
        const tranche = (attr, n) => (morceau ? attr.array.slice(morceau.start * n, (morceau.start + morceau.count) * n) : attr.array);
        pos.push(tranche(geo.attributes.position, 3));
        nor.push(tranche(geo.attributes.normal, 3));
        if (avecCouleur) col.push(tranche(geo.attributes.color, geo.attributes.color.itemSize));
        if (avecUV) {
          // la répétition de la texture de CETTE pièce est « cuite » dans ses coordonnées
          const a = tranche(geo.attributes.uv, 2).slice(), carte = materiau.map;
          if (carte) {
            carte.updateMatrix();
            const e = carte.matrix.elements;
            for (let k = 0; k < a.length; k += 2) {
              const u = a[k], v = a[k + 1];
              a[k] = e[0] * u + e[3] * v + e[6];
              a[k + 1] = e[1] * u + e[4] * v + e[7];
            }
          }
          uv.push(a);
        }
        geo.dispose();
        if (!enleves.has(m)) { enleves.add(m); bilan.avant++; }
      }
      for (const m of enleves) if (m.parent) m.parent.remove(m);
      const colle = (listes) => {
        const tout = new Float32Array(listes.reduce((n, a) => n + a.length, 0));
        let k = 0;
        for (const a of listes) { tout.set(a, k); k += a.length; }
        return tout;
      };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(colle(pos), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(colle(nor), 3));
      if (avecUV) geo.setAttribute("uv", new THREE.BufferAttribute(colle(uv), 2));
      if (avecCouleur) geo.setAttribute("color", new THREE.BufferAttribute(colle(col), g0.attributes.color.itemSize));
      const materiau = modele.clone();
      if (materiau.map) {
        materiau.map = modele.map.clone();
        materiau.map.repeat.set(1, 1);
        materiau.map.offset.set(0, 0);
        materiau.map.needsUpdate = true;
      }
      const piece = new THREE.Mesh(geo, materiau);
      piece.castShadow = pieces[0].o.castShadow;
      piece.receiveShadow = true;
      piece.name = "soudure";
      groupe.add(piece);
      bilan.apres++;
    }
    return bilan;
  }

  return { souder, bilan };
})();
