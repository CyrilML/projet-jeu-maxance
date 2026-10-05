// 🌊 L'EAU : le faiseur de vagues
//
// Étape 48. La mer de l'archipel et les étangs des parcs ne sont plus des miroirs immobiles : ils ONDULENT.
//
//   - Dessiner des millions de petites vagues en 3D coûterait trop cher. L'astuce : une « CARTE DES PENTES »
//     (en anglais, une « normal map »). C'est une image dont chaque point dit dans quel sens la surface PENCHE
//     à cet endroit. La lumière et les reflets du ciel en tiennent compte : l'eau toute plate a l'air pleine
//     de vagues !
//   - Pour que les vagues bougent, on fait GLISSER cette image un peu à chaque image (on change son « décalage »).
//     Le vent de la météo les pousse plus vite, et les rend plus grosses (dans la tempête, la mer est agitée).
//   - L'eau est très LISSE (rugosité presque 0) : elle reflète le ciel, comme un miroir cabossé.
//
// Comme tout l'affichage, ce fichier ne modifie pas le monde. Ses nombres sont dans config.js (eau).

window.Circuit = window.Circuit || {};

Circuit.Eau = (function () {
  const E = Circuit.CONFIG.eau;
  const eaux = []; // { materiau, pentes, carte, vitesse }
  let image = null;
  let force = E.vaguesCalmes;

  // La carte des pentes. On invente d'abord une « carte des hauteurs » (des vagues qui se croisent, faites
  // de sinus), puis on calcule la pente en chaque point. Les fréquences sont des nombres entiers : l'image
  // se raccorde parfaitement sur ses bords (on peut la répéter sans voir de couture).
  function cartePentes() {
    if (image) return image;
    const T = 256;
    const vagues = [[3, 1, 0.5, 0], [1, 4, 0.4, 1.3], [-5, 2, 0.25, 2.1], [7, -3, 0.15, 0.4], [2, 9, 0.12, 3], [-11, 6, 0.08, 1.7], [13, 12, 0.05, 2.6]];
    const hauteur = (x, y) => {
      let h = 0;
      for (const [fx, fy, a, p] of vagues) h += a * Math.sin(((fx * x + fy * y) / T) * Math.PI * 2 + p);
      return h;
    };
    const c = document.createElement("canvas");
    c.width = c.height = T;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(T, T);
    for (let y = 0; y < T; y++) {
      for (let x = 0; x < T; x++) {
        // la pente dans les deux directions (la différence de hauteur entre les voisins)
        const px = (hauteur(x + 1, y) - hauteur(x - 1, y)) * 9, py = (hauteur(x, y + 1) - hauteur(x, y - 1)) * 9;
        const l = Math.hypot(px, py, 1);
        const i = (y * T + x) * 4;
        img.data[i] = Math.round(((-px / l) * 0.5 + 0.5) * 255);
        img.data[i + 1] = Math.round(((-py / l) * 0.5 + 0.5) * 255);
        img.data[i + 2] = Math.round(((1 / l) * 0.5 + 0.5) * 255);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    image = new THREE.CanvasTexture(c);
    image.name = "pentes-eau";
    image.wrapS = image.wrapT = THREE.RepeatWrapping;
    return image;
  }

  // Un matériau d'eau. options : { couleur, repetition (combien de fois la carte des pentes se répète),
  // carte (une texture de couleur, facultative), vitesse (1 = normale) }
  function materiau(options) {
    const pentes = cartePentes().clone();
    pentes.needsUpdate = true;
    pentes.repeat.set(options.repetition, options.repetition);
    const m = new THREE.MeshStandardMaterial({
      color: options.carte ? 0xc8dcea : options.couleur,
      map: options.carte || null,
      normalMap: pentes,
      normalScale: new THREE.Vector2(force, force),
      roughness: 0.07,
      metalness: 0.15,
      envMapIntensity: 1.3,
    });
    eaux.push({ materiau: m, pentes, carte: options.carte || null, vitesse: options.vitesse || 1 });
    return m;
  }

  // Chaque image : les vagues glissent (poussées par le vent), et grossissent avec le vent.
  function maj(dt) {
    const vent = Circuit.Meteo ? Circuit.Meteo.vent() : { x: 0, z: 0, force: 0 };
    force = E.vaguesCalmes + E.vaguesParVent * vent.force;
    for (const e of eaux) {
      const v = (E.vitesseVagues + E.effetVent * vent.force) * e.vitesse * dt;
      const d = Math.hypot(vent.x, vent.z) || 1;
      e.pentes.offset.x = (e.pentes.offset.x + v * (0.3 + 0.7 * vent.x / d)) % 1; // (% 1 : on revient au début, l'image se répète)
      e.pentes.offset.y = (e.pentes.offset.y + v * (0.5 + 0.5 * vent.z / d)) % 1;
      if (e.carte) e.carte.offset.x = (e.carte.offset.x - v * 0.15) % 1;
      e.materiau.normalScale.set(force, force);
    }
  }

  return { materiau, maj, get force() { return force; }, get nombre() { return eaux.length; } };
})();
