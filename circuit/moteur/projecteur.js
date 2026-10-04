// 📽️ LE PROJECTEUR : le moteur 3D, fait maison
//
// Une carte graphique ne sait dessiner qu'une seule forme : le TRIANGLE.
// Une voiture, un arbre, la route… tout est fait de triangles, comme une sculpture en papier plié.
//
// Ce fichier contient deux outils :
//   1. Le CONSTRUCTEUR : on lui dit « une boîte ici, un cône là », il découpe tout en triangles.
//      Chaque coin de triangle (un « sommet ») a 9 nombres : position (x, y, z),
//      direction de la face (nx, ny, nz, pour la lumière) et couleur (rouge, vert, bleu).
//   2. Le PROJECTEUR : il envoie ces triangles à la carte graphique (WebGL) et lui demande
//      de les dessiner, vus depuis la caméra, avec un soleil qui éclaire les faces.
//
// Aucun outil extérieur : tout est là, en quelques centaines de lignes.

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

  // Un segment (pour les rayons X), dessiné comme une ligne.
  function ligne(a, b, couleur) {
    nombres.push(a[0], a[1], a[2], 0, 1, 0, couleur[0], couleur[1], couleur[2]);
    nombres.push(b[0], b[1], b[2], 0, 1, 0, couleur[0], couleur[1], couleur[2]);
  }

  function fin() {
    return new Float32Array(nombres);
  }

  return { triangle, quad, boite, cone, roue, ligne, fin };
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

// ---------------------------------------------------------------------------------------------
// 2. LE PROJECTEUR (WebGL)
// ---------------------------------------------------------------------------------------------
Circuit.Projecteur = (function () {
  // Les deux petits programmes qui tournent DANS la carte graphique (en langage GLSL).
  // Le premier place chaque sommet sur l'écran ; le second colorie chaque pixel.
  const PROGRAMME_SOMMETS = `
    attribute vec3 aPosition;
    attribute vec3 aNormale;
    attribute vec3 aCouleur;
    uniform mat4 uVueProjection;
    uniform mat4 uModele;
    uniform vec3 uSoleil;
    uniform float uLumiere;
    uniform vec3 uOeil;
    varying vec3 vCouleur;
    varying float vDistance;
    void main() {
      vec4 monde = uModele * vec4(aPosition, 1.0);
      gl_Position = uVueProjection * monde;
      vec3 n = normalize(mat3(uModele) * aNormale);
      float eclairage = 0.55 + 0.45 * max(dot(n, uSoleil), 0.0);
      vCouleur = aCouleur * mix(1.0, eclairage, uLumiere);
      vDistance = distance(monde.xyz, uOeil);
    }`;
  const PROGRAMME_PIXELS = `
    precision mediump float;
    varying vec3 vCouleur;
    varying float vDistance;
    uniform vec3 uCiel;
    uniform float uBrouillard;
    void main() {
      float brume = smoothstep(300.0, 750.0, vDistance) * uBrouillard;
      gl_FragColor = vec4(mix(vCouleur, uCiel, brume), 1.0);
    }`;

  let gl = null;
  let programme = null;
  const emplacements = {};
  const compteur = { triangles: 0, lignes: 0, dessins: 0 }; // ce qui a été dessiné dans l'image

  function compiler(type, texte) {
    const s = gl.createShader(type);
    gl.shaderSource(s, texte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  // Renvoie false si l'ordinateur ne sait pas faire de 3D (WebGL absent).
  function initialiser(canvas) {
    gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return false;
    programme = gl.createProgram();
    gl.attachShader(programme, compiler(gl.VERTEX_SHADER, PROGRAMME_SOMMETS));
    gl.attachShader(programme, compiler(gl.FRAGMENT_SHADER, PROGRAMME_PIXELS));
    gl.linkProgram(programme);
    if (!gl.getProgramParameter(programme, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(programme));
    gl.useProgram(programme);
    for (const nom of ["aPosition", "aNormale", "aCouleur"]) emplacements[nom] = gl.getAttribLocation(programme, nom);
    for (const nom of ["uVueProjection", "uModele", "uSoleil", "uLumiere", "uOeil", "uCiel", "uBrouillard"]) {
      emplacements[nom] = gl.getUniformLocation(programme, nom);
    }
    gl.enable(gl.DEPTH_TEST); // ce qui est devant cache ce qui est derrière
    return true;
  }

  // Envoie une liste de sommets à la carte graphique, une fois pour toutes.
  // `lignes` = true pour des segments (rayons X) au lieu de triangles.
  function creerMaillage(sommets, lignes) {
    const tampon = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tampon);
    gl.bufferData(gl.ARRAY_BUFFER, sommets, gl.STATIC_DRAW);
    return { tampon, nombre: sommets.length / 9, lignes: !!lignes };
  }

  // Pour ce qui change à chaque image (les flèches des rayons X).
  function remplacerSommets(maillage, sommets) {
    gl.bindBuffer(gl.ARRAY_BUFFER, maillage.tampon);
    gl.bufferData(gl.ARRAY_BUFFER, sommets, gl.DYNAMIC_DRAW);
    maillage.nombre = sommets.length / 9;
  }

  // Efface l'écran (couleur du ciel) et prépare la caméra pour toute l'image.
  function commencerImage(reglages) {
    compteur.triangles = compteur.lignes = compteur.dessins = 0;
    const ciel = reglages.ciel;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(ciel[0], ciel[1], ciel[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(emplacements.uVueProjection, false, reglages.vueProjection);
    gl.uniform3fv(emplacements.uSoleil, reglages.soleil);
    gl.uniform3fv(emplacements.uOeil, reglages.oeil);
    gl.uniform3fv(emplacements.uCiel, ciel);
    gl.uniform1f(emplacements.uBrouillard, reglages.brouillard ? 1 : 0);
  }

  // Dessine un maillage, placé dans le monde par sa matrice « modèle ».
  // options.sansLumiere : couleurs pures (rayons X) ; options.parDessus : visible à travers tout.
  function dessiner(maillage, modele, options) {
    options = options || {};
    if (!maillage.nombre) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, maillage.tampon);
    const taille = 9 * 4; // 9 nombres de 4 octets par sommet
    gl.vertexAttribPointer(emplacements.aPosition, 3, gl.FLOAT, false, taille, 0);
    gl.vertexAttribPointer(emplacements.aNormale, 3, gl.FLOAT, false, taille, 12);
    gl.vertexAttribPointer(emplacements.aCouleur, 3, gl.FLOAT, false, taille, 24);
    for (const nom of ["aPosition", "aNormale", "aCouleur"]) gl.enableVertexAttribArray(emplacements[nom]);
    gl.uniformMatrix4fv(emplacements.uModele, false, modele || Circuit.Maths3D.identite());
    gl.uniform1f(emplacements.uLumiere, options.sansLumiere || maillage.lignes ? 0 : 1);
    if (options.parDessus) gl.disable(gl.DEPTH_TEST);
    gl.drawArrays(maillage.lignes ? gl.LINES : gl.TRIANGLES, 0, maillage.nombre);
    if (options.parDessus) gl.enable(gl.DEPTH_TEST);
    compteur.dessins++;
    if (maillage.lignes) compteur.lignes += maillage.nombre / 2;
    else compteur.triangles += maillage.nombre / 3;
  }

  return { initialiser, creerMaillage, remplacerSommets, commencerImage, dessiner, compteur };
})();
