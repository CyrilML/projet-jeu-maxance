// 🌿 LA NATURE : le jardinier
//
// Étape 48. Il sème l'herbe en touffes, les fleurs des champs et les rochers, et il plante des arbres de
// plusieurs espèces (des feuillus, des sapins et des bouleaux).
//
//   - Des MILLIERS de plantes : on utilise des « instances » (une seule forme envoyée à la carte graphique,
//     puis seulement la place, la taille et la couleur de chacune).
//   - Une touffe d'herbe = 3 petites images d'herbe croisées en étoile (vue de n'importe quel côté, elle a
//     l'air ronde). Les parties transparentes de l'image sont découpées (« alphaTest »).
//   - L'herbe PLIE AU VENT : c'est la carte graphique qui la fait bouger (un petit programme, un « shader »).
//     Le bas de la touffe ne bouge pas, le haut plie dans le sens du vent de la météo.
//   - LES PARCELLES : l'herbe est rangée par carrés de 80 m. On ne dessine que les carrés proches de la
//     caméra : l'herbe à 500 m, on ne la verrait pas, mais elle coûterait du travail.
//   - La NEIGE : les plantes et les arbres sont marqués « neige » : la météo les blanchit (affichage/meteo3d.js).
//
// Comme tout l'affichage, ce fichier ne modifie jamais le monde du jeu. Ses nombres sont dans config.js (nature).

window.Circuit = window.Circuit || {};

Circuit.Nature = (function () {
  const N = Circuit.CONFIG.nature;
  // Les « uniformes » : des nombres partagés avec la carte graphique (le temps, et le vent).
  const uTemps = { value: 0 };
  const uVent = { value: new THREE.Vector2() };
  const parcelles = []; // { objet, x, z }
  const bilan = {}; // carte → { herbes, fleurs, rochers, arbres, especes }
  const cache = {};

  const ficheDe = (carte) =>
    bilan[carte] || (bilan[carte] = { herbes: 0, fleurs: 0, rochers: 0, arbres: 0, especes: { feuillu: 0, sapin: 0, bouleau: 0 } });

  // Un hasard qui donne toujours la même suite avec la même graine (le décor est le même à chaque partie).
  function hasardDepuis(graine) {
    let etat = graine >>> 0;
    return () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  // Un « hasard » fixe pour un endroit (x, z) : toujours le même nombre entre 0 et 1 au même endroit.
  const hasardIci = (x, z) => {
    const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };

  // ---------- Les images (dessinées sur une toile, comme affichage/textures.js) ----------
  function toile(nom, taille, peindre) {
    if (cache[nom]) return cache[nom];
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.name = nom;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    cache[nom] = t;
    return t;
  }

  // Une touffe d'herbe : des brins qui partent du bas, du vert foncé (en bas) au vert clair (en haut).
  const imageHerbe = () =>
    toile("touffe", 128, (ctx, t) => {
      const alea = hasardDepuis(31);
      for (let i = 0; i < 46; i++) {
        const x = t * (0.12 + alea() * 0.76), haut = t * (0.05 + alea() * 0.55), penche = (alea() - 0.5) * t * 0.35, large = 2.5 + alea() * 4;
        const degrade = ctx.createLinearGradient(0, t, 0, haut);
        const clair = 0.7 + alea() * 0.3;
        degrade.addColorStop(0, "rgb(62,100,34)");
        degrade.addColorStop(0.5, "rgb(" + Math.round(100 * clair) + "," + Math.round(150 * clair) + "," + Math.round(52 * clair) + ")");
        degrade.addColorStop(1, "rgb(" + Math.round(150 * clair) + "," + Math.round(200 * clair) + "," + Math.round(85 * clair) + ")");
        ctx.fillStyle = degrade;
        ctx.beginPath();
        ctx.moveTo(x - large, t);
        ctx.quadraticCurveTo(x - large * 0.3, (t + haut) / 2, x + penche, haut);
        ctx.quadraticCurveTo(x + large * 0.3, (t + haut) / 2, x + large, t);
        ctx.fill();
      }
    });

  // Un bouquet de fleurs des champs : des tiges vertes et des fleurs de toutes les couleurs.
  const imageFleurs = () =>
    toile("fleurs", 128, (ctx, t) => {
      const alea = hasardDepuis(57);
      const couleurs = ["#e8352e", "#f5d02a", "#ffffff", "#a660d8", "#f08ac0", "#5d8fe8"];
      for (let i = 0; i < 16; i++) {
        const x = t * (0.15 + alea() * 0.7), haut = t * (0.25 + alea() * 0.5);
        ctx.strokeStyle = "rgb(55,105,35)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + (alea() - 0.5) * 10, t);
        ctx.quadraticCurveTo(x, (t + haut) / 2, x + (alea() - 0.5) * 8, haut);
        ctx.stroke();
        // la fleur : 5 pétales autour d'un cœur jaune
        const fx = x, fy = haut, r = 4 + alea() * 4;
        ctx.fillStyle = couleurs[Math.floor(alea() * couleurs.length)];
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * r * 0.7, fy + Math.sin(a) * r * 0.7, r * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "#f2b81c";
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  // L'écorce du bouleau : blanche avec des traits noirs.
  const imageBouleau = () =>
    toile("ecorce-bouleau", 64, (ctx, t) => {
      const alea = hasardDepuis(77);
      ctx.fillStyle = "#e9e6dc";
      ctx.fillRect(0, 0, t, t);
      ctx.fillStyle = "#2a2a28";
      for (let i = 0; i < 26; i++) ctx.fillRect(alea() * t, alea() * t, 4 + alea() * 12, 1 + alea() * 2.5);
    });

  // Le grain d'un rocher (gris, avec des taches et du lichen vert-jaune).
  const imageRoche = () =>
    toile("roche", 128, (ctx, t) => {
      const alea = hasardDepuis(91);
      ctx.fillStyle = "#8a8780";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 4000; i++) {
        const v = (alea() - 0.5) * 0.35;
        ctx.fillStyle = v > 0 ? "rgba(255,255,255," + v + ")" : "rgba(0,0,0," + -v + ")";
        ctx.fillRect(alea() * t, alea() * t, 2, 2);
      }
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = "rgba(150,160,70,.35)";
        ctx.beginPath();
        ctx.arc(alea() * t, alea() * t, 3 + alea() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  // ---------- Les formes ----------
  // Recoller plusieurs formes en une seule (pour qu'une touffe = une seule instance).
  function fusionner(formes) {
    const positions = [], normales = [], uvs = [], indices = [];
    let decalage = 0;
    for (const f of formes) {
      const p = f.attributes.position;
      positions.push(...p.array);
      normales.push(...f.attributes.normal.array);
      uvs.push(...f.attributes.uv.array);
      for (const i of f.index.array) indices.push(i + decalage);
      decalage += p.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normales, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    return g;
  }

  // 3 images croisées en étoile, de 1 m de large et 1 m de haut, posées sur le sol.
  // Astuce : leurs « normales » regardent vers le ciel, pour que l'herbe soit éclairée comme le sol (sinon,
  // vue de dos, une image paraît toute sombre).
  function formeEtoile() {
    if (cache.etoile) return cache.etoile;
    const formes = [0, 1, 2].map((k) => {
      const f = new THREE.PlaneGeometry(1, 1);
      f.translate(0, 0.5, 0);
      f.rotateY((k * Math.PI) / 3);
      const n = f.attributes.normal;
      for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
      return f;
    });
    return (cache.etoile = fusionner(formes));
  }

  // Une boule cabossée (pour les feuillages et les rochers) : on bouge chaque sommet un peu au hasard.
  // Un même sommet partagé par plusieurs triangles bouge pareil (le hasard dépend de sa place).
  function bouleCabossee(nom, details, force) {
    if (cache[nom]) return cache[nom];
    const g = new THREE.IcosahedronGeometry(1, details);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + (hasardIci(Math.round(x * 100) + 0.37 * Math.round(z * 100), Math.round(y * 100)) - 0.5) * force;
      p.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals();
    return (cache[nom] = g);
  }

  // Le petit programme de la carte graphique qui fait plier le haut des touffes au vent.
  function plieAuVent(materiau) {
    materiau.onBeforeCompile = (s) => {
      s.uniforms.uTemps = uTemps;
      s.uniforms.uVent = uVent;
      s.vertexShader = "uniform float uTemps;\nuniform vec2 uVent;\n" + s.vertexShader.replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "#ifdef USE_INSTANCING",
          "  float phase = instanceMatrix[3].x * 0.35 + instanceMatrix[3].z * 0.27;",
          "  float echelle = max(0.01, dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz));",
          // le vent du monde, ramené dans le « repère » de la touffe (qui est tournée et agrandie)
          "  vec3 ventIci = transpose(mat3(instanceMatrix)) * vec3(uVent.x, 0.0, uVent.y) / echelle;",
          "  float plie = position.y * position.y;",
          "  float rafale = 0.65 + 0.35 * sin(uTemps * 2.3 + phase);",
          "  transformed.x += (ventIci.x * rafale + sin(uTemps * 1.6 + phase) * 0.04) * plie;",
          "  transformed.z += (ventIci.z * rafale + cos(uTemps * 1.2 + phase) * 0.04) * plie;",
          "#endif",
        ].join("\n")
      );
      // Vue de dos, une image « double face » retourne sa normale (elle regarderait le sol : la touffe serait noire).
      // On garde la normale qui regarde le ciel, des deux côtés.
      s.fragmentShader = s.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n  normal = normalize(vNormal);");
    };
    return materiau;
  }

  // ---------- Semer ----------
  // On tire des centres de touffes au hasard (candidat), on garde ceux où il y a de la place (libre),
  // et autour de chacun on pose quelques plantes.
  function semer(nombre, candidat, libre, alea, parTouffe, rayon) {
    const points = [];
    let essais = 0;
    while (points.length < nombre && essais < nombre * 3) {
      essais++;
      const c = candidat(alea);
      if (!c || !libre(c.x, c.z)) continue;
      const k = 1 + Math.floor(alea() * parTouffe);
      for (let i = 0; i < k && points.length < nombre; i++) {
        const a = alea() * Math.PI * 2, r = Math.sqrt(alea()) * rayon;
        points.push({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, y: c.y || 0 });
      }
    }
    return points;
  }

  // Ranger des plantes par parcelles de 80 m : un InstancedMesh par parcelle.
  function planter(groupe, points, forme, materiau, placer, ombre) {
    const cases = new Map();
    for (const p of points) {
      const cle = Math.floor(p.x / N.parcelle) + "," + Math.floor(p.z / N.parcelle);
      if (!cases.has(cle)) cases.set(cle, []);
      cases.get(cle).push(p);
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), v = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
    const couleur = new THREE.Color();
    for (const [cle, liste] of cases) {
      const im = new THREE.InstancedMesh(forme, materiau, liste.length);
      liste.forEach((p, i) => {
        const r = placer(p, couleur); // { taille: [sx, sy, sz], dessous }
        q.setFromAxisAngle(haut, hasardIci(p.x, p.z) * Math.PI * 2);
        m.compose(v.set(p.x, p.y - (r.dessous || 0), p.z), q, e.set(r.taille[0], r.taille[1], r.taille[2]));
        im.setMatrixAt(i, m);
        im.setColorAt(i, couleur);
      });
      im.castShadow = !!ombre;
      im.receiveShadow = true;
      im.computeBoundingSphere();
      groupe.add(im);
      const [i, j] = cle.split(",").map(Number);
      parcelles.push({ objet: im, x: (i + 0.5) * N.parcelle, z: (j + 0.5) * N.parcelle });
    }
  }

  // Le tapis de nature d'une carte.
  // options : { carte, graine, zone: [xMin, xMax, zMin, zMax] (ou candidat: (alea) → {x, z}), libre: (x, z) → vrai/faux,
  //             herbes, fleurs, rochers (combien ; par défaut ceux de config.js), seche (herbe jaunie), roseaux (grandes herbes) }
  function tapis(options) {
    const g = new THREE.Group();
    const fiche = ficheDe(options.carte);
    const alea = hasardDepuis(options.graine || 1);
    const z = options.zone;
    const candidat = options.candidat || ((a) => ({ x: z[0] + a() * (z[1] - z[0]), z: z[2] + a() * (z[3] - z[2]) }));
    const libre = options.libre || (() => true);
    const nombre = (cle) => (options[cle] === undefined ? N[cle] : options[cle]);

    // L'herbe.
    const herbes = semer(nombre("herbes"), candidat, libre, alea, N.parTouffe, N.rayonTouffe);
    if (herbes.length) {
      const mat = plieAuVent(new THREE.MeshStandardMaterial({ map: imageHerbe(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.95 }));
      mat.userData.neige = true;
      const [hMin, hMax] = N.tailleHerbe;
      planter(g, herbes, formeEtoile(), mat, (p, c) => {
        const h = hasardIci(p.z, p.x);
        const s = options.roseaux ? 1.4 + h * 0.9 : hMin + h * (hMax - hMin);
        // chaque touffe a sa couleur : plus ou moins verte, plus ou moins jaune (et jaune paille si « sèche »)
        if (options.seche) c.setRGB(1.15 + h * 0.2, 1.0 + h * 0.1, 0.55);
        else if (options.roseaux) c.setRGB(0.65, 0.8, 0.55);
        else c.setRGB(0.85 + h * 0.3, 0.9 + h * 0.15, 0.75 + h * 0.15);
        return { taille: [s * (options.roseaux ? 0.6 : 1.2), s, s * (options.roseaux ? 0.6 : 1.2)] };
      });
      fiche.herbes += herbes.length;
    }

    // Les fleurs.
    const fleurs = semer(nombre("fleurs"), candidat, libre, alea, 4, 1.5);
    if (fleurs.length) {
      const mat = plieAuVent(new THREE.MeshStandardMaterial({ map: imageFleurs(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }));
      mat.userData.neige = true;
      planter(g, fleurs, formeEtoile(), mat, (p, c) => {
        const s = 0.35 + hasardIci(p.x + 3, p.z) * 0.35;
        c.setRGB(1, 1, 1);
        return { taille: [s * 1.3, s, s * 1.3] };
      });
      fiche.fleurs += fleurs.length;
    }

    // Les rochers : à moitié enfoncés dans le sol, aplatis, gris ou un peu bruns.
    const rochers = semer(nombre("rochers"), candidat, libre, alea, 2, 3);
    if (rochers.length) {
      const tex = imageRoche();
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, flatShading: true });
      mat.userData.neige = true;
      const [rMin, rMax] = N.tailleRocher;
      planter(g, rochers, bouleCabossee("rocher", 1, 0.55), mat, (p, c) => {
        const h = hasardIci(p.x, p.z + 7), s = rMin + h * h * (rMax - rMin);
        const gris = 0.75 + hasardIci(p.z, p.x + 1) * 0.35;
        c.setRGB(gris * 1.02, gris, gris * (0.9 + h * 0.1));
        return { taille: [s * 1.2, s * 0.7, s], dessous: s * 0.25 };
      }, true);
      fiche.rochers += rochers.length;
    }
    return g;
  }

  // ---------- Les arbres ----------
  // positions : [[x, z, taille, y?], …]. Chaque arbre prend une espèce selon sa place (toujours la même).
  function foret(positions, carte) {
    const groupe = new THREE.Group();
    const fiche = carte ? ficheDe(carte) : null;
    const E = N.especes;
    const parEspece = { feuillu: [], sapin: [], bouleau: [] };
    for (const p of positions) {
      const h = hasardIci(p[0], p[1]);
      const espece = h < E.feuillu ? "feuillu" : h < E.feuillu + E.sapin ? "sapin" : "bouleau";
      parEspece[espece].push(p);
      if (fiche) {
        fiche.arbres++;
        fiche.especes[espece]++;
      }
    }
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), v = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
    const couleur = new THREE.Color();
    const neigeux = (mat) => {
      mat.userData.neige = true;
      return mat;
    };
    // Une famille d'instances : `morceaux` = combien de morceaux par arbre, `placer(p, k)` → { x, y, z, s: [sx,sy,sz], couleur }.
    function famille(liste, forme, materiau, morceaux, placer) {
      if (!liste.length) return;
      const im = new THREE.InstancedMesh(forme, materiau, liste.length * morceaux);
      let i = 0;
      for (const p of liste) {
        for (let k = 0; k < morceaux; k++) {
          const r = placer(p, k);
          q.setFromAxisAngle(haut, hasardIci(p[0] + k, p[1]) * Math.PI * 2);
          m.compose(v.set(r.x, r.y, r.z), q, e.set(r.s[0], r.s[1], r.s[2]));
          im.setMatrixAt(i, m);
          im.setColorAt(i, couleur.set(r.couleur || 0xffffff));
          i++;
        }
      }
      im.castShadow = im.receiveShadow = true;
      im.computeBoundingSphere();
      groupe.add(im);
    }
    const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85 }, o));
    const VERTS_FEUILLU = [0x2f6b2a, 0x3d7a2c, 0x4a8a35, 0x5a7a2a, 0x356a35];
    const VERTS_SAPIN = [0x1d4a2a, 0x24543a, 0x2a5a30];
    const VERTS_BOULEAU = [0x7aa83f, 0x8cb84a, 0x6c9a3a];
    const choisir = (liste, p, k) => liste[Math.floor(hasardIci(p[1] + k * 3, p[0]) * liste.length)];
    const y0 = (p) => p[3] || 0;

    // Les feuillus : un tronc brun et un feuillage fait de 3 boules cabossées.
    const F = parEspece.feuillu;
    famille(F, new THREE.CylinderGeometry(0.22, 0.38, 3.4, 7), mat({ color: 0x5b3d22, roughness: 0.95 }), 1, (p) => ({ x: p[0], y: y0(p) + 1.7 * p[2], z: p[1], s: [p[2], p[2], p[2]] }));
    famille(F, bouleCabossee("feuillage", 1, 0.35), neigeux(mat({ color: 0xffffff, roughness: 0.8 })), 3, (p, k) => {
      const t = p[2], a = (k / 3) * Math.PI * 2 + p[0];
      const r = k === 0 ? 0 : 0.9 * t;
      return { x: p[0] + Math.cos(a) * r, y: y0(p) + (k === 0 ? 4.6 : 3.8) * t, z: p[1] + Math.sin(a) * r,
        s: [2.3 * t, (k === 0 ? 2.0 : 1.7) * t, 2.1 * t], couleur: choisir(VERTS_FEUILLU, p, k) };
    });

    // Les sapins : un petit tronc et 3 cônes empilés, de plus en plus petits.
    const S = parEspece.sapin;
    famille(S, new THREE.CylinderGeometry(0.2, 0.3, 2, 6), mat({ color: 0x4a3020, roughness: 0.95 }), 1, (p) => ({ x: p[0], y: y0(p) + 1 * p[2], z: p[1], s: [p[2], p[2], p[2]] }));
    famille(S, new THREE.ConeGeometry(1, 1, 9), neigeux(mat({ color: 0xffffff, roughness: 0.85 })), 3, (p, k) => {
      const t = p[2] * 1.15;
      return { x: p[0], y: y0(p) + (2.6 + k * 1.9) * t, z: p[1], s: [(2.4 - k * 0.65) * t, (3.2 - k * 0.5) * t, (2.4 - k * 0.65) * t], couleur: choisir(VERTS_SAPIN, p, 0) };
    });

    // Les bouleaux : un tronc blanc tacheté de noir, fin et haut, et un feuillage vert clair en 2 boules.
    const B = parEspece.bouleau;
    famille(B, new THREE.CylinderGeometry(0.14, 0.2, 5, 7), mat({ map: imageBouleau(), roughness: 0.8 }), 1, (p) => ({ x: p[0], y: y0(p) + 2.5 * p[2], z: p[1], s: [p[2], p[2], p[2]] }));
    famille(B, bouleCabossee("feuillage", 1, 0.35), neigeux(mat({ color: 0xffffff, roughness: 0.8 })), 2, (p, k) => {
      const t = p[2];
      return { x: p[0] + (k ? 0.5 : -0.3) * t, y: y0(p) + (k ? 6.2 : 5.0) * t, z: p[1] + (k ? -0.3 : 0.4) * t,
        s: [1.5 * t, 1.9 * t, 1.5 * t], couleur: choisir(VERTS_BOULEAU, p, k) };
    });
    return groupe;
  }

  // ---------- Chaque image ----------
  // Le temps avance (l'herbe ondule), le vent de la météo plie l'herbe, et on cache les parcelles trop loin.
  let affichees = 0;
  function maj(dt, cam) {
    uTemps.value += dt;
    const vent = Circuit.Meteo ? Circuit.Meteo.vent() : { x: 0, z: 0 };
    const limite = 0.45; // m : l'herbe ne plie jamais plus que ça (sinon elle se couche par terre)
    uVent.value.set(Math.max(-limite, Math.min(limite, vent.x * N.flexion)), Math.max(-limite, Math.min(limite, vent.z * N.flexion)));
    const d2 = (N.distanceAffichage + N.parcelle * 0.7) ** 2;
    affichees = 0;
    for (const p of parcelles) {
      const dx = p.x - cam.position.x, dz = p.z - cam.position.z;
      p.objet.visible = dx * dx + dz * dz < d2;
      if (p.objet.visible && p.objet.parent && p.objet.parent.parent && p.objet.parent.parent.visible) affichees++;
    }
  }

  return { tapis, foret, maj, bilan, hasardDepuis, get parcellesAffichees() { return affichees; }, get parcelles() { return parcelles.length; } };
})();
