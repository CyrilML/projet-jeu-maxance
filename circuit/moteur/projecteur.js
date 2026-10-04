// 📐 LE CONSTRUCTEUR DE TRIANGLES ET DE TRAITS
//
// Étapes 32 à 37 : ce fichier contenait notre moteur 3D fait maison (le « projecteur », en WebGL).
// Étape 38 : pour un rendu réaliste, c'est maintenant Three.js qui dessine (voir affichage/scene3d.js).
// On garde ici le petit CONSTRUCTEUR : il découpe des formes en triangles, et surtout il écrit les TRAITS
// des rayons X (affichage/rayons-x.js). Chaque coin (un « sommet ») a 9 nombres : position (x, y, z),
// direction de la face (nx, ny, nz) et couleur (rouge, vert, bleu).

window.Circuit = window.Circuit || {};

// ---------------------------------------------------------------------------------------------
// 1. LE CONSTRUCTEUR DE TRIANGLES
// ---------------------------------------------------------------------------------------------
Circuit.Constructeur = function () {
  const nombres = []; // 9 nombres par sommet, 3 sommets par triangle

  // Un triangle a, b, c (chacun [x, y, z]), d'une seule couleur [r, g, b] (de 0 à 1).
  // Les sommets sont donnés dans le sens inverse des aiguilles d'une montre, vus de devant.
  function triangle(a, b, c, couleur) {
    // La « normale » : une flèche perpendiculaire à la face. Elle dit vers où la face regarde.
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const n = Math.hypot(nx, ny, nz) || 1;
    nx /= n; ny /= n; nz /= n;
    for (const p of [a, b, c]) nombres.push(p[0], p[1], p[2], nx, ny, nz, couleur[0], couleur[1], couleur[2]);
  }

  // Un quadrilatère = 2 triangles.
  function quad(a, b, c, d, couleur) {
    triangle(a, b, c, couleur);
    triangle(a, c, d, couleur);
  }

  // Une boîte (un pavé) centrée en (cx, cy, cz), de taille lx × ly × lz : 6 faces = 12 triangles.
  function boite(cx, cy, cz, lx, ly, lz, couleur) {
    const x0 = cx - lx / 2, x1 = cx + lx / 2, y0 = cy - ly / 2, y1 = cy + ly / 2, z0 = cz - lz / 2, z1 = cz + lz / 2;
    quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], couleur); // dessus
    quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], couleur); // dessous
    quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], couleur); // face z+
    quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], couleur); // face z-
    quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], couleur); // face x+
    quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], couleur); // face x-
  }

  // Un cône (une pyramide à `cotes` côtés) posé en (cx, y0, cz) : pour les sapins.
  function cone(cx, y0, cz, rayon, hauteur, cotes, couleur) {
    const sommet = [cx, y0 + hauteur, cz];
    for (let i = 0; i < cotes; i++) {
      const a1 = (i / cotes) * Math.PI * 2, a2 = ((i + 1) / cotes) * Math.PI * 2;
      const p1 = [cx + Math.cos(a1) * rayon, y0, cz - Math.sin(a1) * rayon];
      const p2 = [cx + Math.cos(a2) * rayon, y0, cz - Math.sin(a2) * rayon];
      triangle(p1, p2, sommet, couleur);
      triangle(p2, p1, [cx, y0, cz], couleur); // le fond
    }
  }

  // Une roue : un cylindre couché, son axe le long de z, centré en (cx, cy, cz).
  function roue(cx, cy, cz, rayon, epaisseur, cotes, couleur, couleurJante) {
    const z0 = cz - epaisseur / 2, z1 = cz + epaisseur / 2;
    for (let i = 0; i < cotes; i++) {
      const a1 = (i / cotes) * Math.PI * 2, a2 = ((i + 1) / cotes) * Math.PI * 2;
      const x1 = cx + Math.cos(a1) * rayon, y1 = cy + Math.sin(a1) * rayon;
      const x2 = cx + Math.cos(a2) * rayon, y2 = cy + Math.sin(a2) * rayon;
      quad([x1, y1, z1], [x1, y1, z0], [x2, y2, z0], [x2, y2, z1], couleur); // le pneu
      // Les flancs : une part sur deux en couleur de jante, pour VOIR la roue tourner.
      const flanc = i % 2 === 0 ? couleurJante : couleur;
      triangle([cx, cy, z1], [x1, y1, z1], [x2, y2, z1], flanc);
      triangle([cx, cy, z0], [x2, y2, z0], [x1, y1, z0], flanc);
    }
  }

  // Étape 36 : une FORME à 8 coins, comme une boîte qu'on aurait écrasée ou penchée (un capot en pente,
  // un aileron…). `bas` et `haut` : 4 coins chacun, dans le même ordre (avant-gauche, avant-droit,
  // arrière-droit, arrière-gauche). Les normales sont tournées vers l'extérieur toutes seules.
  function forme(bas, haut, couleur) {
    const centre = [0, 1, 2].map((k) => (bas.concat(haut).reduce((somme, p) => somme + p[k], 0)) / 8);
    const face = (a, b, c, d) => {
      quadOriente(a, b, c, d, couleur, centre);
    };
    face(haut[0], haut[1], haut[2], haut[3]); // dessus
    face(bas[0], bas[1], bas[2], bas[3]); // dessous
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      face(bas[i], bas[j], haut[j], haut[i]); // les 4 côtés
    }
  }

  // Un quadrilatère dont la face regarde « loin du centre » (pour que la lumière tombe du bon côté).
  function quadOriente(a, b, c, d, couleur, centre) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const mx = (a[0] + c[0]) / 2 - centre[0], my = (a[1] + c[1]) / 2 - centre[1], mz = (a[2] + c[2]) / 2 - centre[2];
    if (nx * mx + ny * my + nz * mz >= 0) quad(a, b, c, d, couleur);
    else quad(a, d, c, b, couleur);
  }

  // Un segment (pour les rayons X), dessiné comme une ligne.
  function ligne(a, b, couleur) {
    nombres.push(a[0], a[1], a[2], 0, 1, 0, couleur[0], couleur[1], couleur[2]);
    nombres.push(b[0], b[1], b[2], 0, 1, 0, couleur[0], couleur[1], couleur[2]);
  }

  function fin() {
    return new Float32Array(nombres);
  }

  return { triangle, quad, boite, cone, roue, forme, ligne, fin };
};

// Transforme une liste de triangles en liste d'arêtes (pour voir le « fil de fer » aux rayons X).
Circuit.Constructeur.aretes = function (triangles, couleur) {
  const c = Circuit.Constructeur();
  for (let i = 0; i < triangles.length; i += 27) {
    const p = [0, 1, 2].map((k) => [triangles[i + k * 9], triangles[i + k * 9 + 1] + 0.02, triangles[i + k * 9 + 2]]);
    c.ligne(p[0], p[1], couleur);
    c.ligne(p[1], p[2], couleur);
    c.ligne(p[2], p[0], couleur);
  }
  return c.fin();
};
