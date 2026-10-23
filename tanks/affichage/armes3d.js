// 🔫 LES ARMES EN 3D : l'armurier (demande 88)
//
// ✍️ « Refais toutes les armes, style Battlefield. » Avant, tous les soldats tenaient le MÊME fusil. Maintenant,
// l'armurier fabrique un VRAI modèle pour chaque arme du menu, pièce par pièce, comme un maquettiste :
//   - la CARCASSE (le « boîtier » où se trouve le mécanisme), le CANON, le GARDE-MAIN (là où se pose la main gauche),
//     la CROSSE (contre l'épaule), la POIGNÉE et le PONTET (l'anneau qui protège la détente), le CHARGEUR (droit,
//     courbe, en « banane », posé dessus…), les ORGANES DE VISÉE (le guidon et le cran de mire) ;
//   - des MATIÈRES différentes : le polymère noir mat, le métal sombre qui brille un peu, le BOIS (AK, Dragunov,
//     RPG-7, avec ses veines dessinées au démarrage), la couleur « terre » (FDE) ou vert armée ;
//   - chaque pièce de l'ATELIER a son propre objet, vissé au bon endroit : sur le RAIL du dessus (point rouge,
//     holographique, lunettes ×4 et ×6), au bout du canon (silencieux, compensateur, cache-flamme), sous le garde-main
//     (poignées), sur le côté (lampe, laser), dans le puits de chargeur (grand chargeur, double chargeur, tambour).
// Comme le carrossier (outils3d.js), il SOUDE toutes les pièces d'une même matière : une arme = 4 ou 5 objets à
// dessiner (et 1 seul pour les soldats de l'ordinateur), pas 200. Et un modèle déjà fabriqué est gardé dans le
// MAGASIN : 30 soldats avec un AK-12 partagent la même forme.
// Il s'occupe aussi :
//   - de l'APERÇU qui tourne dans le menu (sa propre petite carte graphique, arrêtée quand le menu est fermé) ;
//   - de la VUE À LA PREMIÈRE PERSONNE (C) : l'arme tenue par deux mains gantées, dessinée PAR-DESSUS le monde avec sa
//     propre caméra (elle ne rentre jamais dans un mur), qui respire, bouge en marchant, recule à chaque tir, crache
//     une flamme, éjecte ses douilles, se recharge (le chargeur tombe, la main en remet un) et se baisse quand tu
//     changes d'arme ; épaulé (V), le viseur vient pile devant ton œil ;
//   - de la LAMPE qui éclaire vraiment (une lumière « projecteur ») et du LASER (un trait fin et un point là où il touche).
// Demande 97 : L'ARMURERIE. ✍️ « Ajoute des armes, des canons, des viseurs, des chargeurs et tout ça. » L'armurier sait
// maintenant fabriquer 11 armes de plus (G36, SCAR-H, UMP45, Carl Gustaf, M24, Mk 14, MP7, Bizon, Glock 17, MR73, Desert
// Eagle), et beaucoup de nouvelles pièces : viseurs ×2, ×8 et thermique, mini point rouge sur les pistolets, canon lourd
// cannelé, 4 bouts de canon (cache-flamme, compensateur, frein, silencieux), poignées (arrêtoir, bipied déplié), crosses
// (légère, repliée, lourde), une bande de couleur sur le chargeur pour les munitions spéciales, et les PEINTURES : le
// peintre en camouflage dessine chaque motif (taches, pixels, rayures de tigre, carbone, or gravé) sur une petite toile au
// démarrage, puis la « colle » sur les pièces de l'arme (pas sur le canon, les lunettes ni les vis).
// La VITRINE de l'armurerie : une grande arme qu'on fait tourner à la souris (ou au doigt), qu'on zoome à la molette (ou
// en pinçant), qui se balance toute seule quand on n'y touche plus, dans un studio photo sombre ; elle dit au menu où se
// trouve chaque pièce sur l'écran (pour tracer les traits jusqu'aux étiquettes). Elle ne tourne QUE quand l'armurerie
// est affichée, et les modèles déjà fabriqués restent au magasin (les plus vieux de la vitrine sont jetés au-delà de 48).
// Comme tout l'affichage, il LIT le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Armes3D = (function () {
  const C = Tanks.CONFIG, A3 = C.armes3d, OT = Tanks.Outils3D;
  const bilan = { modeles: 0, ms: 0, triangles: 0, vueTriangles: 0, vueObjets: 0, nom: "—", pieces: [], soldatsArmes: {}, apercu: "arrêté", lampe: "éteinte", laser: "—" };

  // ------------------------------------------------------------------ les couleurs et les matières
  const K = {
    noir: 0x37383b, anodise: 0x3d3f43, acier: 0x55585d, canon: 0x3b3d41, fente: 0x0a0a0a, caoutchouc: 0x252525,
    fde: 0xa08760, fdeFonce: 0x857050, od: 0x4d5536, odClair: 0x5f6844, gris: 0x3a3c3a, olive: 0x40463a,
    bakelite: 0x58291a, laiton: 0xc89b45, blanc: 0xe0ddd2, jaune: 0xc9a227, rouge: 0x9a2216, bois: 0xffffff,
  };
  let M = null, MS = null; // les matières de la belle version, et la matière unique des soldats de l'ordinateur
  function toile(l, h, peindre) {
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    peindre(c.getContext("2d"), l, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  let graine = 12345;
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  function matieres() {
    if (M) return M;
    // le GRAIN : un fin bruit gris (les petites bosses du polymère et du métal, que la lumière accroche)
    const grain = toile(256, 256, (ctx, l, h) => {
      const img = ctx.createImageData(l, h);
      for (let i = 0; i < l * h; i++) { const v = 118 + hasard() * 40 + (hasard() < 0.03 ? 40 : 0); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
      ctx.putImageData(img, 0, 0);
    });
    // le BOIS : des veines claires et sombres qui ondulent (un « sinus » déformé par du bruit), comme une planche de noyer
    const veines = (ctx, l, h, couleur) => {
      const img = ctx.createImageData(l, h), b = [];
      for (let k = 0; k < 64; k++) b.push(hasard());
      const bruit = (x) => { const i = Math.floor(x) & 63, f = x - Math.floor(x); return b[i] * (1 - f) + b[(i + 1) & 63] * f; };
      for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
        const t = (y + bruit(x * 0.012 + y * 0.002) * 18 + bruit(x * 0.07) * 3) * 0.36;
        let v = 0.5 + 0.5 * Math.sin(t) * Math.sin(t * 0.37 + 1.3);
        v = Math.pow(v, 1.6) * 0.75 + hasard() * 0.08 + (bruit(x * 0.6 + y * 3.1) > 0.92 ? -0.2 : 0);
        const i = (y * l + x) * 4;
        img.data[i] = couleur ? 74 + v * 92 : 40 + v * 200;
        img.data[i + 1] = couleur ? 40 + v * 50 : 40 + v * 200;
        img.data[i + 2] = couleur ? 22 + v * 22 : 40 + v * 200;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
    };
    const bois = toile(256, 256, (ctx, l, h) => veines(ctx, l, h, true)), boisRelief = toile(256, 256, (ctx, l, h) => veines(ctx, l, h, false));
    bois.colorSpace = THREE.SRGBColorSpace;
    M = {
      poly: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.74, metalness: 0.06, bumpMap: grain, bumpScale: 0.5 }),
      metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.65, bumpMap: grain, bumpScale: 0.18 }),
      bois: new THREE.MeshStandardMaterial({ map: bois, roughness: 0.5, metalness: 0.02, bumpMap: boisRelief, bumpScale: 0.6 }),
      verre: new THREE.MeshPhysicalMaterial({ color: 0x132634, metalness: 0.4, roughness: 0.03, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.6, envMapIntensity: 2 }),
      vitre: new THREE.MeshPhysicalMaterial({ color: 0xa8d4ff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.16, depthWrite: false }),
      fume: new THREE.MeshPhysicalMaterial({ color: 0x9a7a40, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.42, depthWrite: false }),
      lumiere: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    };
    MS = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.58, metalness: 0.38 });
    return M;
  }

  // ------------------------------------------------------------------ (demande 97) LE PEINTRE EN CAMOUFLAGE
  // Un « bruit » doux qui se RÉPÈTE (n cases de côté) : la texture se recolle à elle-même sans couture.
  function bruitPeriodique(n, sel) {
    const g = new Float32Array(n * n);
    let h = (sel * 7919 + 13) >>> 0;
    for (let i = 0; i < n * n; i++) g[i] = (h = (h * 1664525 + 1013904223) >>> 0) / 4294967296;
    const lis = (t) => t * t * (3 - 2 * t), at = (i, j) => g[(((j % n) + n) % n) * n + (((i % n) + n) % n)];
    return (u, v) => {
      const x = u * n, y = v * n, i = Math.floor(x), j = Math.floor(y), fx = lis(x - i), fy = lis(y - j);
      return (at(i, j) * (1 - fx) + at(i + 1, j) * fx) * (1 - fy) + (at(i, j + 1) * (1 - fx) + at(i + 1, j + 1) * fx) * fy;
    };
  }
  // 3 bruits superposés (gros, moyens, petits) : des taches aux bords irréguliers
  function fractal(sel) {
    const f = [bruitPeriodique(4, sel), bruitPeriodique(8, sel + 1), bruitPeriodique(16, sel + 2), bruitPeriodique(32, sel + 3)];
    return (u, v) => f[0](u, v) * 0.5 + f[1](u, v) * 0.28 + f[2](u, v) * 0.14 + f[3](u, v) * 0.08;
  }
  const rvb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function peindreMotif(ctx, l, h, P) {
    const img = ctx.createImageData(l, h), d = img.data, c = P.couleurs.map(rvb);
    const champs = c.map((_, i) => fractal(31 * i + P.id.length * 7));
    for (let y = 0; y < h; y++) for (let x = 0; x < l; x++) {
      let u = x / l, v = y / h, col = c[0];
      if (P.motif === "pixels") (u = (Math.floor(x / 8) * 8) / l), (v = (Math.floor(y / 8) * 8) / h);
      if (P.motif === "taches" || P.motif === "pixels") {
        // des couches de taches, l'une sur l'autre (plus la couche est haute, plus ses taches sont petites)
        for (let k = 1; k < c.length; k++) if (champs[k](u, v) > 0.5 + k * 0.025) col = c[k];
      } else if (P.motif === "rayures") {
        // les rayures du TIGRE : des vagues noires en travers, plus ou moins épaisses, sur un orange qui varie
        const fond = champs[2](u, v), vague = Math.sin((u * 9 + champs[0](u, v) * 1.6 + v * 0.6) * Math.PI * 2);
        col = fond > 0.55 ? c[2] : c[0];
        if (vague > 0.42 + (champs[1](u, v) - 0.5) * 0.9) col = c[1];
      } else if (P.motif === "carbone") {
        // la TRAME du carbone : des petits carrés de fils, couchés une fois sur deux
        const ci = Math.floor(x / 16), cj = Math.floor(y / 16), fx = (x % 16) / 16, fy = (y % 16) / 16, couche = (ci + cj) % 2;
        const t = Math.sin(Math.PI * (couche ? fy : fx)), k = 0.35 + 0.65 * t;
        col = [c[1][0] + (c[2][0] - c[1][0]) * k, c[1][1] + (c[2][1] - c[1][1]) * k, c[1][2] + (c[2][2] - c[1][2]) * k];
      } else if (P.motif === "or") {
        // l'OR gravé : un dégradé doré, des arabesques creusées et quelques paillettes
        const f = champs[1](u, v), k = 0.5 + 0.5 * Math.sin(f * 9);
        col = [c[0][0] + (c[2][0] - c[0][0]) * k * 0.6, c[0][1] + (c[2][1] - c[0][1]) * k * 0.6, c[0][2] + (c[2][2] - c[0][2]) * k * 0.6];
        if (Math.abs(Math.sin(champs[2](u, v) * 46)) < 0.09) col = c[1];
      }
      const i = (y * l + x) * 4, bruit = (hasard() - 0.5) * 12;
      d[i] = Math.max(0, Math.min(255, col[0] + bruit));
      d[i + 1] = Math.max(0, Math.min(255, col[1] + bruit));
      d[i + 2] = Math.max(0, Math.min(255, col[2] + bruit));
      d[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  // Les matières PEINTES (une paire polymère + métal par peinture), fabriquées la 1re fois qu'on en a besoin.
  const MP = {};
  const piecePeinture = (id) => C.atelier.peinture.pieces.find((x) => x.id === id);
  function matierePeinture(id) {
    if (MP[id]) return MP[id];
    matieres();
    const P = piecePeinture(id), t = toile(256, 256, (ctx, l, h) => peindreMotif(ctx, l, h, P)), b = P.brillant || 0;
    t.colorSpace = THREE.SRGBColorSpace;
    const commun = { vertexColors: true, map: t, bumpMap: M.poly.bumpMap, bumpScale: 0.3 };
    MP[id] = {
      poly: new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.74 - 0.46 * b, metalness: 0.05 + 0.9 * b }, commun)),
      metal: new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.55 - 0.3 * b, metalness: 0.3 + 0.65 * b }, commun)),
      toile: t.image,
    };
    MP[id].poly.userData.peinture = MP[id].metal.userData.peinture = id;
    return MP[id];
  }
  // (les petites pièces qu'on ne peint jamais : le canon, l'acier, les fentes, le caoutchouc, le laiton…)
  const NON_PEINT = new Set([K.canon, K.acier, K.fente, K.caoutchouc, K.laiton, K.rouge, K.jaune, K.blanc, 0x0e0e0e, 0x101010, 0x0d0d0d, 0x0a0a0a, 0x0c0c0c, 0x0f0f10, 0x151617, 0x141414, 0x15160f, 0x161616, 0x18191a, 0x18191b, 0x1c1d1b, 0x202225, 0x2a1608, 0x2c2d2f]);
  const clarte = (hex) => { const c = new THREE.Color(hex); return Math.max(c.r, c.g, c.b); };
  const DEFAUT = { poly: K.noir, metal: K.anodise, bois: 0x8a5028, verre: 0x1a2c3a, vitre: 0x6a8aa0, fume: 0x4a3c28, lumiere: 0xff2a1a };

  // Les coordonnées de texture « à plat » (comme le camouflage des tanks) : pour chaque triangle, on projette selon sa
  // direction principale (de côté, de dessus ou de face), « k » répétitions par mètre.
  function uvAPlat(g, k, kv) {
    kv = kv || k * 4;
    const p = g.attributes.position.array, uv = new Float32Array((p.length / 3) * 2);
    for (let t = 0; t < p.length; t += 9) {
      const ux = p[t + 3] - p[t], uy = p[t + 4] - p[t + 1], uz = p[t + 5] - p[t + 2], vx = p[t + 6] - p[t], vy = p[t + 7] - p[t + 1], vz = p[t + 8] - p[t + 2];
      const nx = Math.abs(uy * vz - uz * vy), ny = Math.abs(uz * vx - ux * vz), nz = Math.abs(ux * vy - uy * vx);
      for (let j = 0; j < 3; j++) {
        const i = t + j * 3, q = (t / 3 + j) * 2;
        if (nz >= nx && nz >= ny) (uv[q] = p[i] * k), (uv[q + 1] = p[i + 1] * kv);
        else if (ny >= nx) (uv[q] = p[i] * k), (uv[q + 1] = p[i + 2] * kv + 0.3);
        else (uv[q] = p[i + 2] * k + 0.6), (uv[q + 1] = p[i + 1] * kv);
      }
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }

  // ------------------------------------------------------------------ L'ÉTABLI : les outils pour poser les pièces
  // Repère d'une arme : x vers l'avant (la bouche du canon), y en haut, z à droite. Le point (0, 0, 0) est le HAUT DE
  // LA POIGNÉE (là où la main droite serre l'arme). « qualite » : "beau" (plusieurs matières : toi, le menu, la vue à la
  // première personne), "jeu" (une seule matière : les soldats de l'ordinateur de près), "simple" (moins de facettes, de loin).
  function etabli(qualite, peinture) {
    matieres();
    const seul = qualite !== "beau", leger = qualite === "simple", MPx = peinture && !seul ? matierePeinture(peinture) : null;
    const groupes = { corps: new THREE.Group(), chargeur: new THREE.Group(), culasse: new THREE.Group() };
    let ici = groupes.corps;
    const S = (n) => (leger ? Math.max(5, Math.round(n * 0.45)) : n);
    const Y = new THREE.Vector3(0, 1, 0);
    function poser(geo, mat, coul, x, y, z, rx, ry, rz) {
      // (demande 97) une pièce PEINTE : la matière peinte, et une teinte claire (la couleur vient du camouflage)
      const peinte = MPx && e.peindre && (mat === "poly" || mat === "metal") && (coul === undefined || coul === null || (!NON_PEINT.has(coul) && clarte(coul) > 0.035));
      const m = new THREE.Mesh(geo, seul ? MS : peinte ? MPx[mat] : M[mat]);
      m.position.set(x || 0, y || 0, z || 0);
      m.rotation.set(rx || 0, ry || 0, rz || 0);
      const c = (m.userData.teinte = new THREE.Color(coul !== undefined && coul !== null ? coul : DEFAUT[mat]));
      // un noir trop noir ne montre plus aucune forme : le métal garde au moins 13 % de clarté, le polymère 5 % (sauf les fentes)
      const plancher = mat === "metal" ? 0.13 : mat === "poly" && coul !== K.fente && coul !== 0x0e0e0e && coul !== 0x101010 && coul !== 0x0d0d0d ? 0.05 : 0, max = Math.max(c.r, c.g, c.b);
      if (max < plancher) max > 0.001 ? c.multiplyScalar(plancher / max) : c.setScalar(plancher);
      if (seul && mat === "bois") m.userData.teinte = new THREE.Color(0x7a4320);
      if (seul && (mat === "vitre" || mat === "fume")) m.userData.teinte = new THREE.Color(0x2a3036);
      if (peinte) m.userData.teinte = new THREE.Color(0xffffff).multiplyScalar((0.74 + 0.26 * Math.min(1, clarte(coul === undefined || coul === null ? DEFAUT[mat] : coul) * 2.5)) * (mat === "metal" ? 0.9 : 1));
      ici.add(m);
      return m;
    }
    function galetGeo(lx, ly, lz, rond, n) {
      const g = new THREE.SphereGeometry(1, S(n || 12), Math.max(4, Math.round(S(n || 12) * 0.7))), p = g.attributes.position, e = rond === undefined ? 0.3 : rond;
      for (let i = 0; i < p.count; i++) {
        const f = (v) => Math.sign(v) * Math.pow(Math.abs(v), e);
        p.setXYZ(i, (f(p.getX(i)) * lx) / 2, (f(p.getY(i)) * ly) / 2, (f(p.getZ(i)) * lz) / 2);
      }
      g.computeVertexNormals();
      return g;
    }
    const e = {
      leger, beau: !seul, peindre: true, // (demande 97 : false pendant qu'on visse les accessoires : on ne les peint pas)
      dans(nom, f) { const avant = ici; if (!seul) ici = groupes[nom]; f(); ici = avant; },
      boite: (lx, ly, lz, x, y, z, mat, coul, rx, ry, rz) => poser(new THREE.BoxGeometry(lx, ly, lz), mat || "metal", coul, x, y, z, rx, ry, rz),
      // un TUBE couché le long de x, de xa (rayon ra) à xb (rayon rb), centré en (y, z) ; « tourne » : pour un tube à pans
      tube(xa, xb, ra, rb, y, z, mat, coul, n, tourne) {
        const g = new THREE.CylinderGeometry(rb, ra, Math.abs(xb - xa), S(n || 16));
        if (tourne) g.rotateY(tourne);
        g.rotateZ(-Math.PI / 2);
        return poser(g, mat || "metal", coul, (xa + xb) / 2, y, z || 0);
      },
      // un cylindre DEBOUT (axe y)
      cyl: (r1, r2, h, x, y, z, mat, coul, n, rx, ry, rz) => poser(new THREE.CylinderGeometry(r1, r2, h, S(n || 14)), mat || "metal", coul, x, y, z, rx, ry, rz),
      // un cylindre couché de côté (axe z) : une molette, un tambour
      disque(r, l, x, y, z, mat, coul, n) { const g = new THREE.CylinderGeometry(r, r, l, S(n || 18)); g.rotateX(Math.PI / 2); return poser(g, mat || "metal", coul, x, y, z); },
      // une BARRE ronde entre deux points
      barre(a, b, r, mat, coul, n) {
        const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
        const m = poser(new THREE.CylinderGeometry(r, r, d.length(), S(n || 8)), mat || "metal", coul, 0, 0, 0);
        m.position.copy(A).add(B).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(Y, d.normalize());
        return m;
      },
      // un PROFIL vu de côté (des points [x, y]) « tiré » sur une épaisseur l (en z), avec des TROUS éventuels
      cote(points, l, mat, coul, z, biseau, trous, segments) {
        const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
        for (const t of trous || []) s.holes.push(new THREE.Path(t.map(([x, y]) => new THREE.Vector2(x, y))));
        const b = Math.min(biseau === undefined ? 0.003 : biseau, l * 0.3);
        const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.0005, l - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: leger ? 1 : segments || 1, curveSegments: S(10) });
        g.translate(0, 0, -(l - 2 * b) / 2);
        return poser(g, mat || "metal", coul, 0, 0, z || 0);
      },
      // une forme TOURNÉE autour de l'axe x : [[x, rayon], …]
      tour(profil, y, z, mat, coul, n) {
        const g = new THREE.LatheGeometry(profil.map(([x, r]) => new THREE.Vector2(Math.max(0.0001, r), x)), S(n || 18));
        g.rotateZ(-Math.PI / 2);
        return poser(g, mat || "metal", coul, 0, y, z || 0);
      },
      galet: (lx, ly, lz, x, y, z, mat, coul, rond, n, rx, ry, rz) => poser(galetGeo(lx, ly, lz, rond, n), mat || "poly", coul, x, y, z, rx, ry, rz),
      boule: (r, x, y, z, mat, coul, n) => poser(new THREE.SphereGeometry(r, S(n || 10), S(Math.max(4, Math.round((n || 10) * 0.7)))), mat || "metal", coul, x, y, z),
      // un ANNEAU (tore) dont le trou regarde vers x
      anneau(R, r, x, y, z, mat, coul) { const g = new THREE.TorusGeometry(R, r, S(8), S(24)); g.rotateY(Math.PI / 2); return poser(g, mat || "metal", coul, x, y, z); },
      fin: () => groupes,
    };
    return e;
  }

  // ------------------------------------------------------------------ les PIÈCES communes
  // Le RAIL PICATINNY : une barre avec des dents tous les 1 cm. sens : "haut", "bas", "gauche" (z−), "droite" (z+).
  // Il est posé SUR la surface (y ou z) et renvoie la hauteur de son dessus.
  function rail(e, xa, xb, y, z, sens, coul) {
    const c = coul === undefined ? K.noir : coul, L = xb - xa, mx = (xa + xb) / 2;
    const [ny, nz] = { haut: [1, 0], bas: [-1, 0], gauche: [0, -1], droite: [0, 1] }[sens || "haut"];
    const d = (lx, h, w) => (ny ? [lx, h, w] : [lx, w, h]);
    e.boite(...d(L, 0.006, 0.016), mx, y + ny * 0.003, z + nz * 0.003, "metal", c);
    if (e.leger) e.boite(...d(L, 0.004, 0.021), mx, y + ny * 0.008, z + nz * 0.008, "metal", c);
    else for (let x = xa + 0.0045; x < xb - 0.002; x += 0.01) e.boite(...d(0.0052, 0.0042, 0.021), x, y + ny * 0.008, z + nz * 0.008, "metal", c);
    return ny ? y + ny * 0.01 : z + nz * 0.01;
  }
  // La POIGNÉE PISTOLET (vue de côté, inclinée vers l'arrière), avec ses creux pour les doigts.
  const POIGNEES = {
    ar: [[0.012, 0.0], [0.002, -0.028], [-0.004, -0.048], [-0.01, -0.06], [-0.012, -0.08], [-0.02, -0.102], [-0.046, -0.106], [-0.056, -0.096], [-0.047, -0.06], [-0.038, -0.024], [-0.046, -0.006], [-0.048, 0.0]],
    ak: [[0.008, 0.0], [-0.004, -0.045], [-0.016, -0.1], [-0.044, -0.102], [-0.04, -0.06], [-0.03, -0.018], [-0.038, 0.0]],
    droite: [[0.01, 0.0], [0.004, -0.05], [0.0, -0.098], [-0.034, -0.1], [-0.036, -0.05], [-0.032, -0.01], [-0.04, 0.0]],
  };
  function poignee(e, forme, coul, x, y, l, mat, z) {
    const p = POIGNEES[forme] || POIGNEES.ar;
    e.cote(p.map(([a, b]) => [a + (x || 0), b + (y || 0)]), l || 0.03, mat || "poly", coul, z || 0, 0.006, null, 2);
    if (!e.leger) for (const k of [0.3, 0.55, 0.8]) { // les petites stries de la poignée
      const [a, b] = [p[p.length - 3][0] * (1 - k) + p[p.length - 5][0] * k, -0.02 - k * 0.075];
      e.boite(0.012, 0.0025, (l || 0.03) + 0.002, a + (x || 0) - 0.004, b + (y || 0), z || 0, "poly", 0x0d0d0d);
    }
  }
  // Le PONTET (l'anneau sous la détente) et la DÉTENTE.
  function pontet(e, x0, x1, y, coul) {
    e.boite(x1 - x0, 0.004, 0.012, (x0 + x1) / 2, y - 0.03, 0, "metal", coul);
    e.boite(0.004, 0.03, 0.012, x1, y - 0.015, 0, "metal", coul);
    e.boite(0.004, 0.022, 0.006, x0 + 0.022, y - 0.012, 0, "metal", K.acier, 0, 0, -0.3); // la détente
  }

  // LES CHARGEURS. « f » : la forme d'origine de l'arme : l (longueur), p (profondeur en x), w (largeur en z), k (combien
  // il se courbe vers l'avant), a (inclinaison), coul, mat, nervures ("ak" : des nervures en relief, "pmag" : des stries
  // en bas). « piece » : standard, grand (× 1,5), rapide (2 chargeurs scotchés côte à côte), tambour.
  function unChargeur(e, x, y, l, f, z) {
    const N = e.leger ? 4 : 12, av = [], ar = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, cx = x + (f.a || 0) * l * t + f.k * l * t * t, cy = y - l * t, p = f.p * (1 + 0.12 * t);
      av.push([cx + p / 2, cy]);
      ar.unshift([cx - p / 2, cy]);
    }
    e.cote(av.concat(ar), f.w, f.mat || "poly", f.coul, z || 0, 0.003);
    // la semelle (le fond du chargeur), un peu plus large, penchée comme le bas du chargeur
    const bx = x + (f.a || 0) * l + f.k * l, pente = Math.atan((f.a || 0) + 2 * f.k);
    e.boite(f.p * 1.18, 0.008, f.w + 0.004, bx, y - l - 0.003, z || 0, f.mat || "poly", f.semelle || f.coul, 0, 0, pente);
    if (!e.leger && f.nervures === "ak") for (let t = 0.15; t < 0.95; t += 0.11) {
      const cx = x + (f.a || 0) * l * t + f.k * l * t * t, a = Math.atan((f.a || 0) + 2 * f.k * t);
      for (const s of [-1, 1]) e.boite(f.p * 0.75, 0.004, 0.003, cx, y - l * t, (z || 0) + s * (f.w / 2 + 0.001), f.mat || "poly", f.coul, 0, 0, a);
    }
    if (!e.leger && f.nervures === "pmag") for (let t = 0.7; t < 0.96; t += 0.06) {
      const cx = x + (f.a || 0) * l * t + f.k * l * t * t, a = Math.atan((f.a || 0) + 2 * f.k * t);
      for (const s of [-1, 1]) e.boite(f.p * 0.9, 0.0035, 0.002, cx, y - l * t, (z || 0) + s * (f.w / 2 + 0.0008), "poly", 0x0e0e0e, 0, 0, a);
    }
    // (demande 97) la place de la BANDE DE COULEUR des munitions spéciales : aux 3/4 du chargeur
    const tb = 0.78;
    return { x: x + (f.a || 0) * l * tb + f.k * l * tb * tb, y: y - l * tb, z: z || 0, p: f.p * (1 + 0.12 * tb), w: f.w, a: Math.atan((f.a || 0) + 2 * f.k * tb) };
  }
  function chargeur(e, f, piece, x, y) {
    let bas = { x: x + ((f.a || 0) + f.k) * f.l, y: y - f.l }, bande = null;
    e.dans("chargeur", () => {
      if (piece === "grand") (bande = unChargeur(e, x, y, f.l * 1.5, Object.assign({}, f, { k: f.k / 1.5 }))), (bas = { x: x + ((f.a || 0) + f.k / 1.5) * f.l * 1.5, y: y - f.l * 1.5 });
      else if (piece === "rapide") {
        // 2 chargeurs côte à côte, tenus par une pince : on retourne l'arme, on glisse l'autre (très vite !)
        bande = unChargeur(e, x, y, f.l, f, 0);
        unChargeur(e, x + 0.004, y - 0.012, f.l, f, -(f.w + 0.004));
        e.boite(f.p * 0.9, 0.022, f.w * 2 + 0.012, x + (f.a || 0) * f.l * 0.4 + f.k * f.l * 0.16, y - f.l * 0.4, -(f.w + 0.004) / 2, "poly", K.noir);
      } else if (piece === "tambour") {
        // un TAMBOUR : un cou court, puis une grosse boîte ronde (double pour les fusils « AR », comme un C-Mag)
        const cou = f.l * 0.32;
        bande = unChargeur(e, x, y, cou, Object.assign({}, f, { k: 0 }));
        const r = Math.max(0.05, f.l * 0.36), cx = x + (f.a || 0) * cou + 0.01, cy = y - cou - r * 0.75;
        if (f.double) {
          for (const s of [-1, 1]) {
            e.disque(r, 0.042, cx, cy, s * 0.026, "poly", f.coul);
            e.disque(r * 0.55, 0.046, cx, cy, s * 0.026, "poly", 0x101010);
          }
          e.boite(r * 0.7, r * 0.9, 0.012, cx, cy + r * 0.2, 0, "poly", f.coul);
        } else {
          e.disque(r, f.w * 2.1, cx, cy, 0, "poly", f.coul);
          e.disque(r * 0.72, f.w * 2.1 + 0.004, cx, cy, 0, "poly", 0x141414);
          e.disque(r * 0.18, f.w * 2.1 + 0.01, cx, cy, 0, "metal", K.acier); // la clé pour remonter le ressort
        }
        bas = { x: cx, y: cy - r };
      } else bande = unChargeur(e, x, y, f.l, f);
    });
    bas.bande = bande;
    return bas;
  }

  // LES BOUTS DE CANON (demande 97 : l'emplacement « bouche »). x0 : la fin du canon ; r : son rayon. Renvoie le bout (là
  // où sort la flamme). piece : "aucune" (le bout d'origine de l'arme, selon son « style »), "silencieux", "compensateur",
  // "cacheFlamme", "frein".
  function bout(e, piece, x0, y, r, style, coulSil) {
    const fente = K.fente;
    if (piece === "frein" && style !== "frein") style = "frein";
    else if (piece === "compensateur") piece = "court";
    else if (piece === "cacheFlamme") piece = "long";
    if (piece === "silencieux") {
      // le SILENCIEUX : un gros tube (les gaz se calment dedans : moins de bruit, presque pas de flamme)
      const L = { pistolet: 0.13, pm: 0.17, lourd: 0.26, precision: 0.21 }[style] || 0.18, R = Math.max(0.0165, Math.min(0.029, r * 2.3));
      e.tour([[x0 - 0.01, r * 1.25], [x0 + 0.004, R * 0.92], [x0 + 0.014, R], [x0 + L - 0.012, R], [x0 + L, R * 0.84], [x0 + L, r * 0.8]], y, 0, "metal", coulSil || 0x3d3e40, 22);
      if (!e.leger) for (const k of [0.02, 0.026]) e.tube(x0 + k, x0 + k + 0.0025, R + 0.0008, R + 0.0008, y, 0, "metal", 0x2c2d2f, 22);
      e.tube(x0 + L - 0.001, x0 + L + 0.0005, r * 0.75, r * 0.75, y, 0, "poly", fente, 10);
      return x0 + L;
    }
    if (piece === "court") {
      // le COMPENSATEUR : des trous sur le dessus (les gaz poussent le canon vers le bas : il remonte moins)
      const R = r * 1.9, L = 0.055;
      e.tube(x0, x0 + L, R, R, y, 0, "metal", K.acier, 12, Math.PI / 12);
      if (!e.leger) {
        for (let k = 0; k < 3; k++) e.boite(0.007, 0.003, R * 1.2, x0 + 0.014 + k * 0.013, y + R - 0.0005, 0, "poly", fente);
        for (const s of [-1, 1]) e.boite(0.012, R * 0.9, 0.003, x0 + L - 0.012, y, s * (R - 0.0005), "poly", fente);
      }
      return x0 + L;
    }
    if (piece === "long") {
      // le CACHE-FLAMME à 3 dents (le long canon)
      e.tube(x0, x0 + 0.02, r * 1.5, r * 1.5, y, 0, "metal", K.acier, 12);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
        e.boite(0.045, 0.006, 0.005, x0 + 0.042, y + Math.sin(a) * r * 1.2, Math.cos(a) * r * 1.2, "metal", K.acier, a, 0, 0);
      }
      return x0 + 0.065;
    }
    if (style === "ak") { // le frein de bouche de l'AK, coupé en biais, avec ses fentes de côté
      e.cote([[x0, y - r * 1.6], [x0 + 0.06, y - r * 1.6], [x0 + 0.066, y + r * 1.6], [x0, y + r * 1.6]], r * 3.2, "metal", K.acier, 0, 0.003);
      if (!e.leger) for (const s of [-1, 1]) e.boite(0.01, r * 1.8, 0.003, x0 + 0.04, y, s * r * 1.6, "poly", fente);
      return x0 + 0.064;
    }
    if (style === "mp5") { // le canon à 3 ergots du MP5
      e.tube(x0, x0 + 0.03, r * 1.5, r * 1.5, y, 0, "metal", K.acier, 12);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; e.boite(0.012, 0.006, 0.006, x0 + 0.012, y + Math.sin(a) * r * 1.7, Math.cos(a) * r * 1.7, "metal", K.acier, a); }
      return x0 + 0.03;
    }
    if (style === "svd") { // le long cache-flamme à fentes du Dragunov
      e.tour([[x0, r * 1.2], [x0 + 0.01, r * 1.7], [x0 + 0.075, r * 1.75], [x0 + 0.085, r * 1.4]], y, 0, "metal", K.acier, 14);
      if (!e.leger) for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; e.boite(0.05, 0.003, 0.0035, x0 + 0.046, y + Math.sin(a) * r * 1.74, Math.cos(a) * r * 1.74, "poly", fente, a); }
      return x0 + 0.085;
    }
    if (style === "frein") { // un gros frein de bouche à trous (fusil de précision)
      const R2 = Math.max(r * 2, 0.014);
      e.tube(x0, x0 + 0.075, R2, R2, y, 0, "metal", K.acier, 16);
      if (!e.leger) for (let k = 0; k < 4; k++) for (const s of [-1, 1]) e.boite(0.008, R2 * 1.1, 0.003, x0 + 0.014 + k * 0.016, y, s * R2 * 0.99, "poly", fente);
      e.tube(x0 + 0.074, x0 + 0.0755, r * 0.8, r * 0.8, y, 0, "poly", fente, 10);
      return x0 + 0.075;
    }
    if (style === "aucun") return x0;
    // le cache-flamme « cage à oiseaux » (A2) : un petit tube avec des fentes
    e.tube(x0, x0 + 0.05, r * 1.5, r * 1.5, y, 0, "metal", K.acier, 12);
    if (!e.leger) for (const a of [0.6, 2.1, -0.6, -2.1, Math.PI / 2]) e.boite(0.028, 0.0025, 0.003, x0 + 0.03, y + Math.sin(a) * r * 1.5, Math.cos(a) * r * 1.5, "poly", fente, a);
    return x0 + 0.05;
  }

  // LES VISEURS (posés sur un rail dont le dessus est à la hauteur y, au milieu en x). Ils renvoient la LIGNE DE VISÉE :
  // la hauteur de l'œil (ligne), l'arrière du viseur (arriere) et son décalage de côté (z).
  function pointRouge(e, x, y, z) {
    z = z || 0;
    e.boite(0.034, 0.008, 0.024, x, y + 0.004, z, "metal", K.noir);
    e.boite(0.026, 0.018, 0.017, x, y + 0.017, z, "metal", K.noir);
    e.boite(0.012, 0.008, 0.008, x - 0.006, y + 0.006, z + 0.014, "metal", K.noir); // le levier de serrage
    const yc = y + 0.04;
    e.tour([[x - 0.031, 0.0145], [x - 0.028, 0.0165], [x + 0.022, 0.0165], [x + 0.028, 0.018], [x + 0.036, 0.018], [x + 0.036, 0.0155]], yc, z, "metal", 0x36383b, 22);
    e.tube(x - 0.029, x - 0.027, 0.0135, 0.0135, yc, z, "vitre", null, 22); // (des vitres claires : on voit à travers !)
    e.tube(x + 0.032, x + 0.034, 0.0148, 0.0148, yc, z, "vitre", 0x9a7ab0, 22);
    e.cyl(0.0075, 0.0075, 0.009, x + 0.002, yc + 0.019, z, "metal", 0x2c2d2f, 12); // les molettes de réglage
    const g = e.cyl(0.0075, 0.0075, 0.009, x + 0.002, yc, z + 0.019, "metal", 0x2c2d2f, 12);
    g.rotation.x = Math.PI / 2;
    e.boule(0.0011, x + 0.031, yc, z, "lumiere", 0xff1a0a, 8); // ✍️ le POINT ROUGE (il brille : on le voit même dans le noir)
    return { ligne: yc, arriere: x - 0.031, z, nom: "point rouge" };
  }
  function holo(e, x, y, z) {
    z = z || 0;
    e.boite(0.09, 0.012, 0.034, x, y + 0.006, z, "metal", K.noir);
    e.galet(0.07, 0.02, 0.033, x - 0.004, y + 0.021, z, "metal", 0x35373a, 0.3);
    const yc = y + 0.047;
    for (const s of [-1, 1]) e.boite(0.052, 0.04, 0.004, x + 0.006, y + 0.045, z + s * 0.0175, "metal", 0x35373a); // les 2 murs du capot
    e.galet(0.054, 0.006, 0.039, x + 0.006, y + 0.066, z, "metal", 0x35373a, 0.4);
    e.boite(0.002, 0.032, 0.031, x + 0.026, yc, z, "vitre"); // la fenêtre
    e.boite(0.002, 0.032, 0.031, x - 0.018, yc, z, "vitre");
    e.anneau(0.0062, 0.0004, x + 0.025, yc, z, "lumiere", 0xff220c); // ✍️ le CERCLE et son point
    e.boule(0.0007, x + 0.025, yc, z, "lumiere", 0xff220c, 6);
    for (const s of [-1, 1]) e.boite(0.006, 0.006, 0.006, x - 0.038, y + 0.022, z + s * 0.009, "poly", 0x101010); // les boutons
    return { ligne: yc, arriere: x - 0.02, z, nom: "holographique" };
  }
  function lunette4(e, x, y, z) {
    z = z || 0;
    e.boite(0.07, 0.01, 0.028, x, y + 0.005, z, "metal", K.noir);
    e.boite(0.085, 0.02, 0.024, x, y + 0.018, z, "metal", 0x36383b);
    const yc = y + 0.043;
    e.tour([[x - 0.078, 0.0155], [x - 0.07, 0.017], [x - 0.05, 0.0165], [x - 0.035, 0.0135], [x + 0.025, 0.0155], [x + 0.045, 0.0205], [x + 0.078, 0.0205], [x + 0.078, 0.019]], yc, z, "metal", 0x36383b, 22);
    e.boite(0.07, 0.03, 0.026, x - 0.005, yc - 0.006, z, "metal", 0x36383b);
    e.tube(x - 0.077, x - 0.075, 0.0135, 0.0135, yc, z, "verre", null, 20);
    e.tube(x + 0.075, x + 0.077, 0.0185, 0.0185, yc, z, "verre", null, 20);
    e.boite(0.07, 0.004, 0.008, x - 0.002, yc + 0.018, z, "lumiere", 0xffa020); // la fibre optique (qui s'allume au soleil)
    return { ligne: yc, arriere: x - 0.078, z, nom: "lunette ×4" };
  }
  // la grande LUNETTE (×6, et celles des fusils de précision : o.long, o.obj = rayon de l'objectif, o.haut = hauteur)
  function lunette(e, x, y, z, o) {
    o = Object.assign({ long: 0.32, obj: 0.026, tube: 0.0152, haut: 0.048, coul: 0x343538, nom: "lunette ×6" }, o);
    z = z || 0;
    const L = o.long, a = x - L / 2, b = x + L / 2, yc = y + o.haut;
    e.tour([[a, 0.0195], [a + 0.006, 0.0205], [a + 0.05, 0.0195], [a + 0.07, o.tube], [b - 0.1, o.tube], [b - 0.05, o.obj], [b - 0.004, o.obj], [b, o.obj - 0.0015]], yc, z, "metal", o.coul, 26);
    e.tube(a + 0.002, a + 0.004, 0.017, 0.017, yc, z, "verre", null, 22);
    e.tube(b - 0.004, b - 0.002, o.obj - 0.003, o.obj - 0.003, yc, z, "verre", null, 24);
    // les tourelles : en haut (la hausse), à droite (la dérive), à gauche (la mise au point)
    const tx = x - 0.01;
    e.cyl(0.0125, 0.0125, 0.02, tx, yc + o.tube + 0.01, z, "metal", o.coul, 16);
    e.cyl(0.0085, 0.0085, 0.01, tx, yc + o.tube + 0.002, z, "metal", o.coul, 14);
    for (const s of [-1, 1]) {
      const t = e.cyl(s > 0 ? 0.011 : 0.013, s > 0 ? 0.011 : 0.013, 0.018, tx, yc, z + s * (o.tube + 0.009), "metal", o.coul, 16);
      t.rotation.x = Math.PI / 2;
    }
    if (!e.leger) for (let k = 0; k < 8; k++) e.boite(0.0025, 0.016, 0.0015, tx + Math.cos((k / 8) * Math.PI * 2) * 0.0126, yc + o.tube + 0.011, z + Math.sin((k / 8) * Math.PI * 2) * 0.0126, "metal", 0x0c0c0c, 0, -(k / 8) * Math.PI * 2);
    // les 2 colliers et leur pied sur le rail
    for (const xx of [x - 0.07, x + 0.05]) {
      e.tube(xx - 0.008, xx + 0.008, o.tube + 0.0035, o.tube + 0.0035, yc, z, "metal", K.noir, 18);
      e.boite(0.016, o.haut - o.tube, 0.022, xx, y + (o.haut - o.tube) / 2, z, "metal", K.noir);
      e.boite(0.022, 0.006, 0.026, xx, y + 0.003, z, "metal", K.noir);
    }
    return { ligne: yc, arriere: a, z, nom: o.nom };
  }
  // la PSO-1 du Dragunov : fixée sur le CÔTÉ GAUCHE, avec son grand œilleton en caoutchouc et son pare-soleil
  function pso(e, x, y, z) {
    const yc = y + 0.055, zc = z;
    e.boite(0.13, 0.03, 0.012, x, y + 0.012, z + 0.022, "metal", K.noir); // la pince sur le côté de la carcasse
    e.boite(0.06, 0.035, 0.03, x, yc - 0.022, zc + 0.006, "metal", K.noir);
    e.tour([[x - 0.16, 0.019], [x - 0.12, 0.016], [x - 0.1, 0.013], [x + 0.06, 0.013], [x + 0.08, 0.0175], [x + 0.13, 0.0175]], yc, zc, "metal", 0x37393c, 22);
    e.tour([[x - 0.2, 0.021], [x - 0.17, 0.018], [x - 0.15, 0.016]], yc, zc, "poly", K.caoutchouc, 20); // l'œilleton
    e.tube(x - 0.152, x - 0.15, 0.013, 0.013, yc, zc, "verre", null, 20);
    e.tube(x + 0.124, x + 0.126, 0.015, 0.015, yc, zc, "verre", null, 20);
    e.cyl(0.011, 0.011, 0.02, x - 0.01, yc + 0.02, zc, "metal", 0x37393c, 14);
    const g = e.cyl(0.011, 0.011, 0.02, x - 0.01, yc, zc - 0.02, "metal", 0x37393c, 14);
    g.rotation.x = Math.PI / 2;
    return { ligne: yc, arriere: x - 0.2, z: zc, nom: "lunette PSO-1" };
  }
  // la MIRE MÉTALLIQUE repliable (cran de mire derrière, guidon devant)
  function mire(e, xa, xb, y) {
    e.boite(0.03, 0.008, 0.022, xa, y + 0.004, 0, "metal", K.noir);
    e.boite(0.012, 0.022, 0.02, xa, y + 0.018, 0, "metal", K.noir);
    e.anneau(0.0042, 0.0016, xa, y + 0.026, 0, "metal", K.noir);
    e.boite(0.03, 0.008, 0.022, xb, y + 0.004, 0, "metal", K.noir);
    for (const s of [-1, 1]) e.boite(0.014, 0.028, 0.0035, xb, y + 0.019, s * 0.0085, "metal", K.noir);
    e.boite(0.003, 0.022, 0.003, xb, y + 0.017, 0, "metal", K.noir);
    return { ligne: y + 0.026, arriere: xa - 0.004, z: 0, nom: "mire métallique" };
  }

  // LA LAMPE (vissée sur le côté). sens : -1 à gauche (z−), 1 à droite. Renvoie le centre de sa vitre.
  function lampe(e, piece, x, y, z, sens) {
    const fort = piece === "puissante", r = fort ? 0.019 : 0.0125, L = fort ? 0.135 : 0.1, zc = z + sens * (r + 0.01);
    e.boite(0.03, 0.016, Math.abs(zc - z), x - L * 0.45, y, (z + zc) / 2, "metal", K.noir);
    e.tour([[x - L, r * 0.8], [x - L + 0.008, r * 0.88], [x - L + 0.012, r * 0.82], [x - 0.04, r * 0.82], [x - (fort ? 0.03 : 0.022), r], [x - 0.004, r], [x, r * 0.96]], y, zc, "metal", K.noir, 18);
    if (!e.leger) for (let k = 0; k < 6; k++) e.tube(x - L + 0.02 + k * 0.006, x - L + 0.023 + k * 0.006, r * 0.86, r * 0.86, y, zc, "metal", 0x0f0f10, 14); // le moletage
    e.tube(x - 0.002, x + 0.0005, r * 0.82, r * 0.82, y, zc, "lumiere", 0xbfc8d0, 18); // la vitre
    if (fort) { // l'interrupteur à distance, et son fil
      e.boite(0.03, 0.006, 0.014, x - L - 0.01, y - 0.012, z + sens * 0.004, "poly", K.noir);
      e.barre([x - L, y, zc], [x - L - 0.01, y - 0.01, z + sens * 0.005], 0.0018, "poly", K.noir);
    }
    return new THREE.Vector3(x + 0.001, y, zc);
  }
  // LE LASER (une boîte « PEQ » couleur sable, posée sur le rail) : il renvoie la place de sa lentille.
  function laser(e, couleur, x, y, z, sens) {
    const hz = sens === "haut", w = 0.042, h = 0.03, cx = hz ? x : x, cy = hz ? y + h / 2 : y, cz = hz ? z : z + (sens === "droite" ? 1 : -1) * (h / 2);
    e.galet(0.07, hz ? h : w, hz ? w : h, cx, cy, cz, "poly", K.fde, 0.2);
    const col = new THREE.Color(couleur).getHex();
    const ly = hz ? cy + 0.004 : cy + 0.008, lz = hz ? cz + 0.01 : cz;
    e.tube(x + 0.034, x + 0.04, 0.0055, 0.0055, ly, lz, "metal", K.noir, 12);
    e.tube(x + 0.0395, x + 0.0405, 0.0045, 0.0045, ly, lz, "lumiere", col, 12);
    e.tube(x + 0.034, x + 0.039, 0.0065, 0.0065, hz ? cy - 0.006 : cy - 0.007, hz ? cz - 0.008 : cz, "verre", null, 12);
    if (!e.leger) for (const k of [-1, 1]) e.boite(0.008, 0.004, 0.008, x - 0.018 + k * 0.01, hz ? cy + h / 2 : cy + w / 2, cz, "poly", 0x222222);
    return new THREE.Vector3(x + 0.041, ly, lz);
  }
  // LES POIGNÉES sous le garde-main (sur le rail du dessous, dont la surface est à la hauteur y).
  function poigneeAvant(e, piece, x, y) {
    if (piece === "arretoir") {
      // (demande 97) l'ARRÊTOIR : une petite butée devant la main (la main reste à sa place)
      e.cote([[x - 0.01, y], [x + 0.03, y], [x + 0.03, y - 0.008], [x + 0.022, y - 0.022], [x + 0.012, y - 0.022]], 0.022, "poly", K.noir, 0, 0.004, null, 2);
      return { centre: new THREE.Vector3(x - 0.05, y - 0.025, 0), axe: new THREE.Vector3(1, 0, 0), sorte: "dessous" };
    }
    if (piece === "bipied") {
      // (demande 97) le BIPIED déplié : une pince, une charnière et 2 pieds écartés avec leurs patins
      e.boite(0.03, 0.012, 0.03, x, y - 0.006, 0, "metal", K.noir);
      e.cyl(0.008, 0.008, 0.04, x, y - 0.016, 0, "metal", K.noir, 12, Math.PI / 2);
      for (const s of [-1, 1]) {
        e.barre([x, y - 0.016, s * 0.012], [x + 0.03, y - 0.19, s * 0.07], 0.005, "metal", K.noir);
        e.barre([x + 0.018, y - 0.11, s * 0.045], [x + 0.03, y - 0.19, s * 0.07], 0.0042, "metal", K.acier);
        e.galet(0.02, 0.014, 0.02, x + 0.031, y - 0.196, s * 0.071, "poly", K.caoutchouc, 0.4);
      }
      return { centre: new THREE.Vector3(x - 0.08, y - 0.025, 0), axe: new THREE.Vector3(1, 0, 0), sorte: "dessous" };
    }
    if (piece === "vertical") {
      e.boite(0.032, 0.012, 0.026, x, y - 0.006, 0, "poly", K.noir);
      e.cyl(0.0145, 0.0135, 0.085, x + 0.004, y - 0.054, 0, "poly", K.noir, 14, 0, 0, 0.1);
      if (!e.leger) for (let k = 0; k < 4; k++) e.cyl(0.0151, 0.0151, 0.003, x + 0.003 - k * 0.0008, y - 0.03 - k * 0.012, 0, "poly", 0x0e0e0e, 14, 0, 0, 0.1);
      e.cyl(0.0155, 0.0155, 0.006, x + 0.0005, y - 0.097, 0, "poly", 0x101010, 14, 0, 0, 0.1);
      return { centre: new THREE.Vector3(x + 0.002, y - 0.05, 0), axe: new THREE.Vector3(-0.1, 1, 0).normalize(), sorte: "vertical" };
    }
    // la poignée INCLINÉE : une sorte de rampe où le creux de la main se pose
    e.cote([[x - 0.045, y], [x + 0.035, y], [x + 0.032, y - 0.01], [x - 0.02, y - 0.036], [x - 0.04, y - 0.034], [x - 0.05, y - 0.012]], 0.026, "poly", K.noir, 0, 0.005, null, 2);
    return { centre: new THREE.Vector3(x - 0.01, y - 0.03, 0), axe: new THREE.Vector3(1, 0.35, 0).normalize(), sorte: "dessous" };
  }
  // LA CROSSE LOURDE (l'atelier) : une grosse crosse de précision, avec un appui-joue et une épaisse plaque de caoutchouc.
  function crosseLourde(e, x, y, coul) {
    e.cote([[x + 0.01, y + 0.012], [x - 0.2, y + 0.02], [x - 0.27, y + 0.024], [x - 0.27, y - 0.1], [x - 0.24, y - 0.105], [x - 0.15, y - 0.06], [x - 0.04, y - 0.035], [x + 0.01, y - 0.02]], 0.046, "poly", coul, 0, 0.007, [[[x - 0.06, y - 0.004], [x - 0.15, y - 0.004], [x - 0.2, y - 0.02], [x - 0.2, y - 0.055], [x - 0.15, y - 0.04], [x - 0.07, y - 0.022]]], 2);
    e.galet(0.13, 0.024, 0.042, x - 0.17, y + 0.034, 0, "poly", coul, 0.3);
    for (const xx of [x - 0.13, x - 0.21]) e.cyl(0.004, 0.004, 0.02, xx, y + 0.022, 0, "metal", K.acier, 8);
    e.boite(0.03, 0.135, 0.05, x - 0.286, y - 0.04, 0, "poly", K.caoutchouc);
    e.disque(0.01, 0.054, x - 0.24, y - 0.07, 0, "metal", K.acier, 12);
  }

  // ------------------------------------------------------------------ (demande 97) LES NOUVELLES PIÈCES
  // Le CANON (de xa à xb) : standard, ou LOURD (plus épais, avec des cannelures : des rainures qui l'allègent et le refroidissent).
  function canonTube(e, p, xa, xb, y, r, z) {
    const lourd = p.canon === "lourd", R2 = lourd ? r * 1.4 : r;
    e.tube(xa, xb, R2, lourd ? r * 1.3 : r, y, z || 0, "metal", K.canon, lourd ? 18 : 14);
    if (lourd && !e.leger) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; e.boite((xb - xa) * 0.7, 0.0025, 0.0025, xa + (xb - xa) * 0.48, y + Math.sin(a) * R2 * 0.97, (z || 0) + Math.cos(a) * R2 * 0.97, "poly", 0x101010, a); }
    e.dernierCanon = { xa, xb, y, z: z || 0 };
  }
  // Les CROSSES de l'armurerie. x, y : l'arrière de la carcasse (là où la crosse s'accroche). Renvoie false pour la crosse
  // d'origine (l'arme la dessine elle-même).
  function crosseSpeciale(e, p, x, y, coul) {
    e.crossePos = { x, y };
    if (p.crosse === "lourde") { crosseLourde(e, x, y, coul === undefined ? K.noir : coul); return true; }
    if (p.crosse === "legere") {
      // la crosse LÉGÈRE : un simple squelette en tubes, une petite plaque et un appui-joue
      e.boite(0.02, 0.04, 0.03, x - 0.01, y, 0, "metal", K.noir);
      e.barre([x - 0.01, y + 0.012, 0], [x - 0.27, y + 0.018, 0], 0.0065, "metal", K.noir);
      e.barre([x - 0.01, y - 0.018, 0], [x - 0.26, y - 0.075, 0], 0.0065, "metal", K.noir);
      e.barre([x - 0.27, y + 0.018, 0], [x - 0.26, y - 0.075, 0], 0.0065, "metal", K.noir);
      e.boite(0.014, 0.11, 0.04, x - 0.277, y - 0.03, 0, "poly", K.caoutchouc);
      e.galet(0.08, 0.016, 0.03, x - 0.2, y + 0.026, 0, "poly", coul === undefined ? K.noir : coul, 0.35);
      return true;
    }
    if (p.crosse === "repliable") {
      // la crosse REPLIÉE contre le flanc gauche : l'arme devient toute courte
      e.boite(0.022, 0.05, 0.034, x - 0.012, y - 0.004, 0, "metal", K.noir); // la charnière
      e.cote([[x - 0.004, y + 0.02], [x + 0.21, y + 0.016], [x + 0.22, y + 0.004], [x + 0.22, y - 0.05], [x + 0.205, y - 0.055], [x - 0.004, y - 0.03]], 0.012, "poly", coul === undefined ? K.noir : coul, -0.032, 0.003,
        [[[x + 0.02, y + 0.006], [x + 0.18, y + 0.003], [x + 0.19, y - 0.008], [x + 0.19, y - 0.036], [x + 0.02, y - 0.018]]], 2);
      e.boite(0.012, 0.075, 0.018, x + 0.226, y - 0.018, -0.032, "poly", K.caoutchouc);
      return true;
    }
    return false;
  }
  // La couleur de la bande des munitions spéciales (dessinée sur le chargeur).
  const COULEUR_MUNITIONS = { pointeCreuse: 0xc8742e, perforantes: 0xd0281a, subsoniques: 0x3aa84a };
  // Le petit POINT ROUGE des pistolets (posé sur la culasse) : un boîtier, une fenêtre penchée, un point.
  function miniPointRouge(e, x, y) {
    e.boite(0.034, 0.008, 0.022, x, y + 0.004, 0, "metal", K.noir);
    e.cote([[x - 0.017, y + 0.008], [x - 0.017, y + 0.026], [x - 0.012, y + 0.03], [x + 0.008, y + 0.03], [x + 0.017, y + 0.014], [x + 0.017, y + 0.008]], 0.022, "metal", 0x303236, 0, 0.002,
      [[[x - 0.013, y + 0.012], [x - 0.013, y + 0.025], [x + 0.006, y + 0.025], [x + 0.012, y + 0.012]]], 2);
    e.boite(0.001, 0.014, 0.017, x + 0.004, y + 0.019, 0, "vitre", 0x9a7ab0);
    e.boule(0.0009, x + 0.004, y + 0.019, 0, "lumiere", 0xff1a0a, 6);
    return { ligne: y + 0.019, arriere: x - 0.017, z: 0, nom: "mini point rouge" };
  }
  // le VISEUR ×2 COMPACT : un petit prisme carré, une lentille ronde devant
  function lunette2(e, x, y, z) {
    z = z || 0;
    e.boite(0.05, 0.008, 0.026, x, y + 0.004, z, "metal", K.noir);
    e.galet(0.064, 0.032, 0.032, x - 0.004, y + 0.026, z, "metal", 0x36383b, 0.25);
    const yc = y + 0.03;
    e.tour([[x + 0.024, 0.0125], [x + 0.03, 0.0155], [x + 0.044, 0.0155], [x + 0.046, 0.014]], yc, z, "metal", 0x36383b, 20);
    e.tube(x + 0.044, x + 0.046, 0.012, 0.012, yc, z, "verre", null, 18);
    e.tour([[x - 0.046, 0.012], [x - 0.04, 0.0135], [x - 0.032, 0.0135]], yc, z, "poly", K.caoutchouc, 16);
    e.tube(x - 0.044, x - 0.042, 0.01, 0.01, yc, z, "verre", null, 16);
    e.cyl(0.006, 0.006, 0.008, x - 0.006, yc + 0.019, z, "metal", 0x2c2d2f, 10);
    return { ligne: yc, arriere: x - 0.046, z, nom: "viseur ×2" };
  }
  // la LUNETTE THERMIQUE : un gros boîtier carré, une lentille de germanium (presque noire) et des boutons
  function thermique(e, x, y, z) {
    z = z || 0;
    e.boite(0.07, 0.01, 0.03, x, y + 0.005, z, "metal", K.noir);
    e.galet(0.12, 0.05, 0.048, x, y + 0.035, z, "metal", 0x3c3e3a, 0.18);
    const yc = y + 0.036;
    e.tour([[x + 0.058, 0.021], [x + 0.064, 0.026], [x + 0.09, 0.026], [x + 0.092, 0.024]], yc, z, "metal", 0x323430, 22);
    e.tube(x + 0.09, x + 0.092, 0.022, 0.022, yc, z, "verre", 0x2a1c24, 22);
    e.tour([[x - 0.09, 0.017], [x - 0.08, 0.018], [x - 0.06, 0.016]], yc, z, "poly", K.caoutchouc, 18);
    e.tube(x - 0.088, x - 0.086, 0.011, 0.011, yc, z, "lumiere", 0x1d4a26, 16); // (l'écran qui s'allume dedans)
    if (!e.leger) for (let k = 0; k < 3; k++) e.cyl(0.0045, 0.0045, 0.006, x - 0.03 + k * 0.016, yc + 0.026, z, "poly", k === 0 ? 0x9a2216 : 0x101010, 10);
    e.cyl(0.009, 0.009, 0.014, x + 0.02, yc, z + 0.027, "metal", 0x2c2d2f, 14, Math.PI / 2);
    return { ligne: yc, arriere: x - 0.09, z, nom: "lunette thermique" };
  }
  const lunette8 = (e, x, y, z) => lunette(e, x, y, z, { long: 0.4, obj: 0.034, tube: 0.016, haut: 0.06, coul: 0x2c2d30, nom: "lunette ×8" });
  // le VISEUR choisi, posé sur un rail (x : le milieu) ; renvoie la ligne de visée
  const VISEURS = { pointRouge, holo, lunette2, lunette4, thermique, lunette: (e, x, y, z) => lunette(e, x, y, z), lunette8 };
  const DECALAGE_VISEUR = { pointRouge: 0.06, holo: 0.065, lunette2: 0.065, lunette4: 0.09, thermique: 0.1, lunette: 0.13, lunette8: 0.15 };

  // ------------------------------------------------------------------ LES ARMES, une par une
  // Chaque fabrique pose ses pièces et renvoie ses POINTS : la poignée (main droite), le garde-main (main gauche), la
  // bouche, l'éjection des douilles, les rails (pour l'atelier), la ligne de visée d'origine…
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z || 0);
  // (demande 97) la longueur du canon : standard (et lourd : même longueur, plus épais), long ou court
  const LONGUEUR_CANON = (piece, base, long, court) => ({ long, court }[piece] !== undefined ? { long, court }[piece] : base);

  const FABRIQUES = {
    // ✍️ AR-4 : le fusil d'assaut classique (comme un M4) : carcasse en alu noir, crosse à tube réglable, garde-main
    // octogonal à fentes « M-LOK », rail sur toute la longueur, chargeur sable courbe.
    ar4(e, p) {
      const by = 0.045, A = K.anodise;
      e.cote([[-0.072, 0.0], [-0.072, 0.03], [0.112, 0.03], [0.112, 0.012], [0.104, 0.0], [0.1, -0.038], [0.034, -0.038], [0.03, -0.006], [0.014, 0.0]], 0.032, "metal", A, 0, 0.003);
      e.cote([[-0.078, 0.03], [-0.078, 0.064], [0.116, 0.064], [0.116, 0.03]], 0.03, "metal", A, 0, 0.003);
      e.boite(0.045, 0.014, 0.002, 0.025, 0.046, 0.0158, "poly", K.fente); // la fenêtre d'éjection
      e.barre([-0.038, 0.052, 0.012], [-0.014, 0.052, 0.022], 0.0055, "metal", A); // l'assistance de fermeture
      e.boite(0.012, 0.014, 0.008, -0.004, 0.05, 0.018, "metal", A);
      e.boite(0.014, 0.007, 0.04, -0.086, 0.059, 0, "metal", A); // le levier d'armement
      e.boite(0.194, 0.006, 0.022, 0.019, 0.066, 0, "metal", A);
      e.boite(0.014, 0.008, 0.006, -0.025, 0.012, 0.018, "metal", A); // le sélecteur de tir
      if (!crosseSpeciale(e, p, -0.072, by, K.noir)) {
        e.tube(-0.262, -0.072, 0.0145, 0.0145, by, 0, "metal", A, 16); // le tube de crosse
        e.tube(-0.084, -0.074, 0.019, 0.019, by, 0, "metal", A, 8);
        // la crosse réglable : le corps, l'appui-joue bombé, les 2 « poches » à piles sur les côtés, la plaque de couche
        e.cote([[-0.2, 0.062], [-0.2, 0.026], [-0.3, -0.03], [-0.335, -0.048], [-0.342, -0.048], [-0.342, 0.074], [-0.33, 0.078], [-0.24, 0.07]], 0.04, "poly", K.noir, 0, 0.006, null, 2);
        e.galet(0.12, 0.022, 0.046, -0.275, 0.072, 0, "poly", K.noir, 0.32);
        for (const zz of [-1, 1]) e.galet(0.1, 0.034, 0.016, -0.262, 0.03, zz * 0.026, "poly", K.noir, 0.35, 12, 0, 0, 0.42);
        e.boite(0.014, 0.126, 0.046, -0.348, 0.014, 0, "poly", K.caoutchouc);
        e.boite(0.03, 0.01, 0.03, -0.22, 0.018, 0, "poly", K.noir, 0, 0, 0.5); // le levier de réglage
        e.boite(0.016, 0.01, 0.03, -0.31, -0.03, 0, "metal", K.acier, 0, 0, 0.5); // l'anneau de la sangle
      }
      poignee(e, "ar", K.noir);
      pontet(e, 0.008, 0.075, 0.0, A);
      const ch = chargeur(e, { l: 0.15, p: 0.058, w: 0.022, k: 0.2, a: 0.05, coul: K.fde, nervures: "pmag", double: true }, p.chargeur, 0.067, -0.03);
      // le garde-main octogonal, ses fentes M-LOK, son rail du haut, ses petits rails dessous et à gauche
      const hg = 0.44;
      e.tube(0.116, hg, 0.028, 0.028, by, 0, "metal", A, 8, Math.PI / 8);
      e.tube(hg - 0.004, hg, 0.0295, 0.0295, by, 0, "metal", 0x18191b, 8, Math.PI / 8);
      if (!e.leger) for (let x = 0.16; x < hg - 0.03; x += 0.05) for (const s of [-1, 1]) e.boite(0.032, 0.007, 0.004, x, by, s * 0.026, "poly", K.fente);
      const yr = rail(e, -0.076, hg - 0.004, 0.069, 0);
      const yb = rail(e, 0.28, hg - 0.02, by - 0.027, 0, "bas");
      rail(e, hg - 0.08, hg - 0.006, by, -0.027, "gauche");
      const lc = LONGUEUR_CANON(p.canon, 0.105, 0.2, 0.03, 0.06);
      canonTube(e, p, hg, hg + lc, by, 0.0095);
      const tip = bout(e, p.bouche, hg + lc, by, 0.0095, "a2");
      return { by, tip, ch, rail: { xa: -0.075, xb: hg - 0.01, y: yr }, dessous: { x: 0.36, y: yb, rail: true }, garde: { centre: V3(0.24, by - 0.03), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: hg - 0.012, y: by, z: -0.037, sens: -1 }, laser: { x: hg - 0.07, y: yr, z: 0, sens: "haut" }, ejection: V3(0.025, 0.047, 0.017), mireAvant: hg - 0.03, mireArriere: -0.06, crosse: -0.35 };
    },

    // ✍️ FAMAS : le « clairon » français. Un « bullpup » : le chargeur est DERRIÈRE la poignée (l'arme est courte), et la
    // grande poignée de transport court sur tout le dessus. Les pieds du bipied sont repliés sur les côtés.
    famas(e, p) {
      const by = 0.035, G = 0x484b41, G2 = 0x3c3f37;
      e.cote([[-0.335, -0.075], [-0.335, 0.058], [-0.31, 0.07], [0.07, 0.07], [0.17, 0.062], [0.205, 0.045], [0.205, 0.012], [0.16, 0.0], [0.03, 0.0], [-0.06, 0.0], [-0.1, -0.018], [-0.135, -0.022], [-0.135, -0.036], [-0.2, -0.036], [-0.23, -0.032], [-0.3, -0.06], [-0.32, -0.075]], 0.05, "poly", G, 0, 0.007, null, 2);
      if (!e.leger) {
        for (let x = 0.085; x < 0.195; x += 0.014) for (const s of [-1, 1]) e.boite(0.005, 0.034, 0.003, x, 0.03, s * 0.0255, "poly", 0x15160f, 0, 0, -0.12); // les nervures du garde-main
        for (const s of [-1, 1]) e.boite(0.05, 0.012, 0.002, -0.12, 0.045, s * 0.0255, "poly", K.fente); // les fenêtres d'éjection (des 2 côtés !)
      }
      // la poignée de transport, le « clairon »
      e.cote([[-0.258, 0.068], [-0.218, 0.132], [0.12, 0.132], [0.152, 0.104], [0.158, 0.068]], 0.022, "poly", G2, 0, 0.005, [[[-0.192, 0.08], [0.112, 0.08], [0.112, 0.118], [-0.192, 0.118]]], 2);
      e.boite(0.02, 0.01, 0.01, 0.05, 0.085, 0, "metal", K.noir); // le levier d'armement, sous la poignée
      e.galet(0.08, 0.02, 0.046, -0.29, 0.074, 0, "poly", G2, 0.35); // l'appui-joue
      e.boite(0.012, 0.135, 0.052, -0.342, -0.008, 0, "poly", K.caoutchouc);
      if (p.crosse === "lourde") { e.boite(0.03, 0.14, 0.058, -0.36, -0.01, 0, "poly", K.caoutchouc); e.galet(0.1, 0.026, 0.05, -0.27, 0.09, 0, "poly", K.noir, 0.3); } // (la crosse lourde d'un bullpup : une grosse plaque et un appui-joue)
      poignee(e, "ar", G2);
      // le grand pontet qui protège toute la main
      for (const [a, b] of [[[0.045, -0.002, 0], [0.052, -0.06, 0]], [[0.052, -0.06, 0], [0.032, -0.104, 0]], [[0.032, -0.104, 0], [-0.03, -0.11, 0]]]) e.barre(a, b, 0.0055, "poly", G2);
      e.boite(0.004, 0.022, 0.006, 0.022, -0.012, 0, "metal", K.acier, 0, 0, -0.3);
      const ch = chargeur(e, { l: 0.13, p: 0.056, w: 0.022, k: 0.06, a: 0.02, coul: K.noir, mat: "metal" }, p.chargeur, -0.168, -0.03);
      // le bipied replié contre les flancs
      for (const s of [-1, 1]) { e.barre([0.17, 0.028, s * 0.028], [0.005, 0.016, s * 0.031], 0.0035, "metal", K.noir); e.boite(0.016, 0.008, 0.006, 0.0, 0.016, s * 0.031, "poly", K.caoutchouc); }
      const lc = LONGUEUR_CANON(p.canon, 0.08, 0.16, 0.025, 0.045);
      canonTube(e, p, 0.205, 0.205 + lc, by, 0.0095);
      if (p.canon === "standard") for (const k of [0.02, 0.045]) e.tube(0.205 + lc - k, 0.205 + lc - k + 0.008, 0.0125, 0.0125, by, 0, "metal", K.acier, 14); // les anneaux du lance-grenades à fusil
      const tip = bout(e, p.bouche, 0.205 + lc, by, 0.0095, "a2");
      const yr = rail(e, -0.18, 0.09, 0.132, 0);
      const yl = rail(e, 0.12, 0.19, by, -0.026, "gauche");
      return { by, tip, ch, rail: { xa: -0.17, xb: 0.08, y: yr }, dessous: { x: 0.13, y: 0.0 }, garde: { centre: V3(0.13, -0.005), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.19, y: by, z: yl, sens: -1 }, laser: { x: 0.11, y: 0.07, z: 0.0, sens: "haut" }, ejection: V3(-0.12, 0.045, 0.026), mireAvant: 0.07, mireArriere: -0.16, crosse: -0.34 };
    },

    // ✍️ AK-12 : la silhouette des AK : la carcasse emboutie et son couvercle arrondi, le GARDE-MAIN EN BOIS, le tube des
    // gaz au-dessus du canon, le guidon triangulaire, le frein de bouche coupé en biais, la crosse en bois et le
    // chargeur « banane » en bakélite à nervures.
    ak12(e, p) {
      const by = 0.035, N = 0x36383b;
      e.cote([[-0.105, -0.004], [-0.105, 0.046], [0.172, 0.046], [0.172, 0.01], [0.14, -0.002], [0.112, -0.012], [0.04, -0.012], [0.02, -0.004]], 0.04, "metal", N, 0, 0.002);
      e.galet(0.27, 0.026, 0.039, 0.03, 0.05, 0, "metal", 0x393a3d, 0.22); // le couvercle
      if (!e.leger) {
        for (const x of [-0.08, 0.12, 0.15]) for (const s of [-1, 1]) e.boule(0.0025, x, 0.004, s * 0.0205, "metal", K.acier, 6); // les rivets
        e.boite(0.13, 0.012, 0.003, 0.035, 0.036, 0.021, "metal", N, 0, 0, 0.06); // le grand sélecteur (à droite)
        e.boite(0.06, 0.01, 0.002, 0.08, 0.026, 0.0205, "poly", K.fente);
      }
      e.boite(0.012, 0.012, 0.016, 0.125, 0.036, 0.026, "metal", K.acier); // le levier d'armement
      const yr = rail(e, -0.08, 0.14, 0.063, 0);
      e.boite(0.03, 0.02, 0.026, 0.186, 0.058, 0, "metal", N); // la hausse
      e.boite(0.02, 0.008, 0.02, 0.19, 0.072, 0, "metal", N);
      e.tube(0.17, 0.43, 0.011, 0.011, by + 0.028, 0, "metal", N, 12); // le tube des gaz
      e.galet(0.14, 0.026, 0.034, 0.27, by + 0.03, 0, "bois", null, 0.28); // le garde-main du haut (bois)
      e.cote([[0.172, by + 0.016], [0.34, by + 0.016], [0.34, by - 0.016], [0.325, by - 0.03], [0.19, by - 0.03], [0.172, by - 0.018]], 0.05, "bois", null, 0, 0.008, null, 3);
      e.tube(0.338, 0.35, 0.028, 0.028, by + 0.004, 0, "metal", N, 14);
      e.boite(0.03, 0.05, 0.026, 0.42, by + 0.012, 0, "metal", N); // le bloc des gaz
      e.cote([[0.448, by - 0.012], [0.474, by - 0.012], [0.474, by + 0.02], [0.465, by + 0.05], [0.455, by + 0.05], [0.448, by + 0.02]], 0.018, "metal", N, 0, 0.002); // le guidon
      e.boite(0.003, 0.012, 0.003, 0.461, by + 0.058, 0, "metal", N);
      if (!crosseSpeciale(e, p, -0.105, by + 0.005, K.noir)) {
        e.cote([[-0.105, 0.044], [-0.105, -0.012], [-0.135, -0.022], [-0.42, -0.075], [-0.432, -0.073], [-0.432, 0.03], [-0.42, 0.033], [-0.14, 0.046]], 0.04, "bois", null, 0, 0.006, null, 2);
        e.boite(0.008, 0.11, 0.043, -0.436, -0.022, 0, "metal", N);
      }
      poignee(e, "ak", K.bakelite);
      pontet(e, 0.005, 0.045, 0.0, N);
      const ch = chargeur(e, { l: 0.19, p: 0.06, w: 0.024, k: 0.5, a: 0.07, coul: K.bakelite, nervures: "ak" }, p.chargeur, 0.076, -0.012);
      const lc = LONGUEUR_CANON(p.canon, 0.03, 0.11, 0.008, 0.015);
      canonTube(e, p, 0.35, 0.474 + lc, by, 0.009);
      const tip = bout(e, p.bouche, 0.474 + lc, by, 0.009, "ak");
      return { by, tip, ch, rail: { xa: -0.075, xb: 0.135, y: yr }, dessous: { x: 0.27, y: by - 0.03 }, garde: { centre: V3(0.26, by - 0.032), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.325, y: by - 0.004, z: -0.026, sens: -1, petitRail: true }, laser: { x: 0.28, y: by + 0.043, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.08, 0.04, 0.021),
        mireNative: { ligne: by + 0.058, arriere: 0.186, z: 0, nom: "hausse et guidon d'AK" }, crosse: -0.43 };
    },

    // ✍️ M110 : le fusil de tireur d'élite semi-automatique, tout en couleur « terre » (FDE) : long garde-main rond, crosse
    // réglable avec appui-joue, chargeur droit de 20, bipied replié, et sa lunette.
    m110(e, p) {
      const by = 0.05, F = K.fde, F2 = K.fdeFonce;
      e.cote([[-0.085, 0.0], [-0.085, 0.034], [0.13, 0.034], [0.13, 0.015], [0.12, 0.0], [0.115, -0.042], [0.035, -0.042], [0.03, -0.008], [0.014, 0.0]], 0.036, "metal", F, 0, 0.003);
      e.cote([[-0.09, 0.034], [-0.09, 0.072], [0.135, 0.072], [0.135, 0.034]], 0.034, "metal", F, 0, 0.003);
      e.boite(0.055, 0.016, 0.002, 0.03, 0.052, 0.0178, "poly", K.fente);
      e.boite(0.016, 0.008, 0.044, -0.096, 0.066, 0, "metal", F2);
      if (!crosseSpeciale(e, p, -0.085, by, F)) {
        e.tube(-0.24, -0.085, 0.016, 0.016, by, 0, "metal", F2, 16);
        e.cote([[-0.2, 0.066], [-0.2, 0.024], [-0.3, -0.02], [-0.37, -0.052], [-0.385, -0.052], [-0.385, 0.068], [-0.36, 0.074]], 0.045, "poly", F, 0, 0.006, null, 2);
        e.galet(0.13, 0.024, 0.042, -0.3, 0.086, 0, "poly", F, 0.3); // l'appui-joue réglable
        e.cyl(0.004, 0.004, 0.018, -0.27, 0.074, 0, "metal", K.acier, 8);
        e.boite(0.016, 0.125, 0.048, -0.392, 0.008, 0, "poly", K.caoutchouc);
        e.barre([-0.345, -0.048, 0], [-0.345, -0.08, 0], 0.006, "metal", K.noir); // le monopied
      }
      poignee(e, "ar", F2);
      pontet(e, 0.008, 0.078, 0.0, F2);
      const ch = chargeur(e, { l: 0.12, p: 0.072, w: 0.026, k: 0.03, a: 0.02, coul: K.noir, mat: "metal", double: true }, p.chargeur, 0.075, -0.034);
      const hg = 0.52;
      e.tube(0.135, hg, 0.031, 0.031, by, 0, "metal", F, 20);
      if (!e.leger) for (let x = 0.17; x < hg - 0.03; x += 0.055) for (const s of [-1, 1]) e.galet(0.035, 0.009, 0.006, x, by, s * 0.029, "poly", K.fente, 0.5);
      const yr = rail(e, -0.088, hg - 0.004, 0.081, 0, "haut", F2);
      e.boite(0.22, 0.01, 0.024, 0.02, 0.077, 0, "metal", F);
      const yb = rail(e, hg - 0.13, hg - 0.02, by - 0.03, 0, "bas", F2);
      // le bipied replié sous le garde-main
      for (const s of [-1, 1]) { e.barre([hg - 0.03, by - 0.04, s * 0.012], [hg - 0.25, by - 0.05, s * 0.02], 0.004, "metal", K.noir); e.galet(0.02, 0.012, 0.012, hg - 0.255, by - 0.05, s * 0.02, "poly", K.caoutchouc, 0.4); }
      e.boite(0.03, 0.015, 0.03, hg - 0.025, by - 0.042, 0, "metal", K.noir);
      const lc = LONGUEUR_CANON(p.canon, 0.15, 0.25, 0.06, 0.08);
      canonTube(e, p, hg, hg + lc, by, 0.011);
      const tip = bout(e, p.bouche, hg + lc, by, 0.011, "a2", F);
      return { by, tip, ch, rail: { xa: -0.085, xb: hg - 0.02, y: yr }, dessous: { x: hg - 0.16, y: yb, rail: true }, garde: { centre: V3(0.27, by - 0.033), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: hg - 0.04, y: by, z: -0.031, sens: -1, petitRail: true }, laser: { x: hg - 0.09, y: yr, z: 0, sens: "haut" }, ejection: V3(0.03, 0.054, 0.019),
        lunetteNative: (e2, y) => lunette(e2, 0.05, y, 0, { long: 0.34, obj: 0.028, coul: 0x3f3f39, nom: "lunette de tireur d'élite" }), crosse: -0.39 };
    },

    // ✍️ SVD DRAGUNOV : très long et fin, la crosse « squelette » en bois avec son grand trou pour le pouce, le
    // garde-main en bois à fentes, le long cache-flamme, et la lunette PSO-1 fixée sur le côté gauche.
    svd(e, p) {
      const by = 0.03, N = 0x35373a;
      e.cote([[-0.1, -0.004], [-0.1, 0.044], [0.17, 0.044], [0.17, 0.0], [0.11, -0.01], [0.045, -0.01], [0.02, -0.004]], 0.038, "metal", N, 0, 0.002);
      e.galet(0.27, 0.022, 0.036, 0.035, 0.046, 0, "metal", 0x38393c, 0.22);
      e.boite(0.012, 0.012, 0.014, 0.13, 0.034, 0.024, "metal", K.acier);
      if (!crosseSpeciale(e, p, -0.1, by + 0.006, K.noir)) {
        e.cote([[0.005, 0.0], [-0.1, 0.0], [-0.1, 0.044], [-0.44, 0.034], [-0.475, 0.034], [-0.475, -0.1], [-0.44, -0.106], [-0.06, -0.112], [-0.03, -0.108], [-0.012, -0.06]], 0.038, "bois", null, 0, 0.006,
          [[[-0.068, -0.012], [-0.36, 0.01], [-0.398, 0.0], [-0.398, -0.068], [-0.37, -0.084], [-0.09, -0.09], [-0.072, -0.07]]], 2);
        e.galet(0.13, 0.03, 0.044, -0.25, 0.046, 0, "poly", 0x3e342b, 0.3); // l'appui-joue
        e.boite(0.008, 0.14, 0.04, -0.478, -0.033, 0, "metal", N);
      }
      if (p.crosse !== "standard") poignee(e, "ak", K.noir);
      pontet(e, 0.004, 0.044, 0.0, N);
      const ch = chargeur(e, { l: 0.105, p: 0.056, w: 0.024, k: 0.22, a: 0.05, coul: 0x202022, mat: "metal", nervures: "ak" }, p.chargeur, 0.077, -0.01);
      e.galet(0.22, 0.042, 0.046, 0.285, by - 0.008, 0, "bois", null, 0.28); // le garde-main du bas
      e.galet(0.2, 0.022, 0.04, 0.29, by + 0.03, 0, "bois", null, 0.3); // celui du haut
      if (!e.leger) for (let k = 0; k < 6; k++) for (const s of [-1, 1]) e.boite(0.006, 0.026, 0.003, 0.2 + k * 0.03, by - 0.006, s * 0.0225, "poly", K.fente, 0, 0, 0.25);
      e.tube(0.17, 0.42, 0.009, 0.009, by + 0.026, 0, "metal", N, 10);
      e.tube(0.394, 0.406, 0.026, 0.026, by + 0.008, 0, "metal", N, 14);
      const lc = LONGUEUR_CANON(p.canon, 0.3, 0.38, 0.2, 0.22);
      canonTube(e, p, 0.4, 0.4 + lc, by, 0.0085);
      const xg = 0.4 + lc - 0.05; // le guidon et sa protection
      e.boite(0.025, 0.03, 0.02, xg, by + 0.012, 0, "metal", N);
      e.anneau(0.012, 0.002, xg, by + 0.034, 0, "metal", N);
      const tip = bout(e, p.bouche, 0.4 + lc, by, 0.0085, "svd");
      return { by, tip, ch, rail: { xa: -0.06, xb: 0.15, y: 0.06 }, dessous: { x: 0.3, y: by - 0.03 }, garde: { centre: V3(0.27, by - 0.032), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.385, y: by - 0.006, z: -0.024, sens: -1, petitRail: true }, laser: { x: 0.33, y: by + 0.041, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.08, 0.036, 0.02),
        lunetteNative: (e2) => pso(e2, 0.03, by + 0.01, -0.052), railHaut: true, crosse: -0.48, grip: p.crosse !== "standard" ? null : { centre: V3(-0.03, -0.055), axe: V3(0.3, 1, 0).normalize() } };
    },

    // ✍️ SNIPER .338 : le fusil À VERROU (on tire la culasse en arrière après chaque balle), sur un châssis vert armée :
    // crosse squelette réglable, canon épais cannelé, gros frein de bouche, petit chargeur de 5, et une grosse lunette.
    lapua(e, p) {
      const by = 0.05, O = 0x48553a;
      e.tube(-0.13, 0.13, 0.023, 0.023, by, 0, "metal", K.noir, 20); // la carcasse ronde
      e.boite(0.05, 0.016, 0.003, 0.0, by + 0.006, 0.022, "poly", K.fente);
      e.dans("culasse", () => { // ✍️ la CULASSE et son levier (elle recule après chaque tir)
        e.tube(-0.165, -0.128, 0.019, 0.017, by, 0, "metal", 0x404246, 16);
        e.barre([-0.06, by, 0.02], [-0.075, by - 0.038, 0.07], 0.0048, "metal", K.acier);
        e.boule(0.011, -0.077, by - 0.042, 0.075, "poly", K.noir, 12);
      });
      const yr = rail(e, -0.12, 0.31, by + 0.023, 0);
      e.cote([[0.13, by - 0.014], [-0.135, by - 0.014], [-0.14, 0.0], [0.012, 0.0], [0.03, -0.012], [0.13, -0.012]], 0.052, "poly", O, 0, 0.004);
      e.galet(0.36, 0.06, 0.056, 0.31, by - 0.004, 0, "poly", O, 0.22); // le garde-main
      if (!e.leger) for (let x = 0.17; x < 0.47; x += 0.045) for (const s of [-1, 1]) e.galet(0.03, 0.01, 0.006, x, by - 0.004, s * 0.0275, "poly", K.fente, 0.5);
      if (crosseSpeciale(e, p, -0.135, by, O)) poignee(e, "ar", K.noir);
      else {
        e.cote([[-0.135, by + 0.008], [-0.48, by + 0.008], [-0.49, by + 0.002], [-0.49, -0.1], [-0.47, -0.105], [-0.38, -0.105], [-0.2, -0.05], [-0.06, -0.09], [-0.035, -0.096], [-0.012, -0.05], [0.0, 0.0], [-0.135, 0.0]], 0.044, "poly", O, 0, 0.006,
          [[[-0.075, -0.012], [-0.35, -0.012], [-0.37, -0.03], [-0.37, -0.07], [-0.35, -0.08], [-0.27, -0.048], [-0.1, -0.06], [-0.08, -0.04]]], 2);
        e.galet(0.14, 0.024, 0.04, -0.3, by + 0.022, 0, "poly", O, 0.3);
        for (const x of [-0.26, -0.34]) e.cyl(0.004, 0.004, 0.016, x, by + 0.012, 0, "metal", K.acier, 8);
        e.boite(0.025, 0.16, 0.05, -0.502, -0.025, 0, "poly", K.caoutchouc);
        e.barre([-0.43, -0.1, 0], [-0.43, -0.14, 0], 0.006, "metal", K.noir);
        e.disque(0.012, 0.01, -0.43, -0.142, 0, "poly", K.caoutchouc, 12);
      }
      pontet(e, 0.006, 0.05, 0.0, K.noir);
      const ch = chargeur(e, { l: 0.07, p: 0.08, w: 0.03, k: 0, a: 0, coul: K.noir, mat: "metal" }, p.chargeur, 0.09, -0.008);
      const lc = LONGUEUR_CANON(p.canon, 0.2, 0.29, 0.12, 0.13);
      canonTube(e, p, 0.49, 0.49 + lc, by, 0.0125);
      if (!e.leger) for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; e.boite(lc * 0.75, 0.003, 0.003, 0.49 + lc * 0.45, by + Math.sin(a) * 0.0115, Math.cos(a) * 0.0115, "poly", 0x101010, a); }
      for (const s of [-1, 1]) e.barre([0.44, by - 0.034, s * 0.01], [0.24, by - 0.05, s * 0.022], 0.004, "metal", K.noir); // le bipied replié
      e.boite(0.03, 0.016, 0.034, 0.45, by - 0.038, 0, "metal", K.noir);
      const tip = bout(e, p.bouche, 0.49 + lc, by, 0.011, "frein");
      return { by, tip, ch, rail: { xa: -0.12, xb: 0.3, y: yr }, dessous: { x: 0.4, y: by - 0.034 }, garde: { centre: V3(0.25, by - 0.036), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.47, y: by - 0.004, z: -0.028, sens: -1, petitRail: true }, laser: { x: 0.43, y: by + 0.026, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.0, by + 0.01, 0.024),
        lunetteNative: (e2, y) => lunette(e2, 0.08, y, 0, { long: 0.37, obj: 0.031, tube: 0.017, haut: 0.054, coul: 0x323232, nom: "grosse lunette de précision" }), crosse: -0.5, grip: p.crosse !== "standard" ? null : { centre: V3(-0.028, -0.05), axe: V3(0.35, 1, 0).normalize() } };
    },

    // ✍️ BARRETT .50 : ÉNORME. Une grosse carcasse plate grise, un canon épais, le gros FREIN DE BOUCHE en pointe de flèche,
    // la poignée de transport, le bipied, le monopied sous la crosse, et un gros chargeur droit.
    barrett(e, p) {
      const by = 0.06, G = 0x4c4d49, G2 = 0x434440;
      e.cote([[-0.25, by - 0.02], [-0.25, by + 0.036], [0.34, by + 0.036], [0.37, by + 0.02], [0.37, by - 0.03], [0.13, by - 0.03], [0.13, by - 0.02]], 0.066, "metal", G, 0, 0.004);
      if (!e.leger) for (let k = 0; k < 6; k++) for (const s of [-1, 1]) e.disque(0.01, 0.004, 0.18 + k * 0.03, by + 0.006, s * 0.032, "poly", K.fente, 10); // les trous de refroidissement
      e.cote([[-0.25, by - 0.02], [0.13, by - 0.02], [0.13, -0.03], [0.04, -0.035], [0.03, -0.006], [0.012, 0.0], [-0.03, 0.0], [-0.06, -0.008], [-0.34, -0.035], [-0.42, -0.062], [-0.45, -0.062], [-0.45, by + 0.032], [-0.42, by + 0.036], [-0.25, by + 0.036]], 0.058, "metal", G2, 0, 0.004);
      poignee(e, "ar", K.noir);
      pontet(e, 0.006, 0.04, 0.0, G2);
      e.boite(0.04, 0.15, 0.08, -0.475, -0.012, 0, "poly", K.caoutchouc); // le gros amortisseur de crosse
      if (p.crosse === "lourde") e.boite(0.03, 0.17, 0.09, -0.505, -0.014, 0, "poly", K.caoutchouc);
      e.barre([-0.33, -0.03, 0], [-0.33, -0.085, 0], 0.008, "metal", K.noir);
      e.disque(0.014, 0.012, -0.33, -0.088, 0, "poly", K.caoutchouc, 12);
      // la poignée de transport repliée
      for (const [a, b] of [[[0.0, by + 0.036, 0], [0.02, by + 0.07, 0]], [[0.02, by + 0.07, 0], [0.14, by + 0.07, 0]], [[0.14, by + 0.07, 0], [0.16, by + 0.036, 0]]]) e.barre(a, b, 0.007, "metal", K.noir);
      const yr = rail(e, -0.24, 0.0, by + 0.036, 0);
      const ch = chargeur(e, { l: 0.12, p: 0.085, w: 0.046, k: 0, a: 0, coul: 0x3e3f3d, mat: "metal" }, p.chargeur, 0.085, -0.03);
      const lc = LONGUEUR_CANON(p.canon, 0.32, 0.42, 0.2, 0.22);
      canonTube(e, p, 0.37, 0.37 + lc, by, 0.0175);
      for (const s of [-1, 1]) { e.barre([0.34, by - 0.03, s * 0.03], [0.62, by - 0.06, s * 0.05], 0.0065, "metal", K.noir); e.galet(0.04, 0.012, 0.03, 0.635, by - 0.064, s * 0.052, "poly", K.caoutchouc, 0.4); }
      let tip;
      if (p.bouche !== "aucune") tip = bout(e, p.bouche, 0.37 + lc, by, 0.016, "lourd");
      else { // le frein de bouche à 2 chambres, en pointe de flèche
        const x0 = 0.37 + lc;
        e.cote([[x0, by - 0.03], [x0 + 0.08, by - 0.03], [x0 + 0.11, by - 0.012], [x0 + 0.11, by + 0.012], [x0 + 0.08, by + 0.03], [x0, by + 0.03]], 0.072, "metal", K.noir, 0, 0.004);
        for (const s of [-1, 1]) for (const k of [0.025, 0.06]) e.boite(0.022, 0.044, 0.004, x0 + k, by, s * 0.035, "poly", K.fente);
        tip = x0 + 0.11;
      }
      return { by, tip, ch, rail: { xa: -0.23, xb: -0.01, y: yr }, dessous: { x: 0.25, y: by - 0.03 }, garde: { centre: V3(0.22, by - 0.035), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.36, y: by + 0.01, z: -0.034, sens: -1, petitRail: true }, laser: { x: 0.3, y: by + 0.036, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.05, by + 0.01, 0.034),
        lunetteNative: (e2, y) => lunette(e2, -0.1, y, 0, { long: 0.36, obj: 0.033, tube: 0.017, haut: 0.065, coul: 0x323232, nom: "lunette du Barrett" }), crosse: -0.45 };
    },

    // ✍️ MP5 : le pistolet-mitrailleur fin et noir : la carcasse ronde à nervures, le tube d'armement au-dessus du canon
    // avec son levier à gauche, le guidon dans un anneau, la hausse « tambour », le chargeur très courbe et la crosse à
    // 2 tiges qui rentre.
    mp5(e, p) {
      const by = 0.035, N = 0x343538;
      e.cote([[-0.095, by - 0.012], [-0.095, by + 0.026], [-0.08, by + 0.038], [0.15, by + 0.038], [0.15, by - 0.012]], 0.038, "metal", N, 0, 0.009, null, 3);
      if (!e.leger) for (const s of [-1, 1]) for (const yy of [by + 0.004, by + 0.02]) e.boite(0.2, 0.003, 0.002, 0.03, yy, s * 0.0195, "metal", 0x151617);
      e.cote([[0.04, by - 0.01], [-0.075, by - 0.01], [-0.08, 0.0], [0.03, 0.0]], 0.034, "poly", K.noir, 0, 0.004);
      poignee(e, "droite", K.noir);
      pontet(e, 0.006, 0.05, 0.0, K.noir);
      e.boite(0.05, 0.03, 0.03, 0.065, by - 0.025, 0, "metal", N);
      const ch = chargeur(e, { l: 0.15, p: 0.034, w: 0.022, k: 0.33, a: 0.12, coul: 0x323232, mat: "metal" }, p.chargeur, 0.066, -0.006);
      e.tube(0.15, 0.315, 0.012, 0.012, by + 0.028, 0, "metal", N, 12); // le tube d'armement
      e.barre([0.27, by + 0.03, -0.01], [0.262, by + 0.046, -0.034], 0.0035, "metal", N);
      e.boule(0.006, 0.261, by + 0.047, -0.036, "poly", K.noir, 8);
      e.tour([[0.15, 0.021], [0.16, 0.025], [0.29, 0.023], [0.3, 0.019]], by - 0.002, 0, "poly", K.noir, 16); // le garde-main fin
      if (!e.leger) for (let x = 0.18; x < 0.29; x += 0.022) e.tube(x, x + 0.004, 0.0245, 0.0245, by - 0.002, 0, "poly", 0x101010, 16);
      e.boite(0.03, 0.03, 0.016, 0.31, by + 0.044, 0, "metal", N);
      e.anneau(0.012, 0.0025, 0.31, by + 0.062, 0, "metal", N); // le guidon dans son anneau
      e.boite(0.003, 0.012, 0.003, 0.31, by + 0.058, 0, "metal", N);
      e.anneau(0.007, 0.0035, -0.07, by + 0.062, 0, "metal", N); // la hausse « tambour » (on vise à travers son petit trou)
      e.disque(0.0095, 0.012, -0.072, by + 0.062, -0.014, "metal", N, 14);
      e.boite(0.02, 0.016, 0.024, -0.07, by + 0.046, 0, "metal", N);
      if (!crosseSpeciale(e, p, -0.095, by + 0.008, K.noir)) {
        for (const s of [-1, 1]) e.barre([-0.095, by + 0.012, s * 0.017], [-0.32, by + 0.0, s * 0.018], 0.0045, "metal", N);
        e.cote([[-0.318, by + 0.03], [-0.338, by + 0.03], [-0.338, -0.065], [-0.318, -0.065]], 0.05, "metal", N, 0, 0.004);
        e.boite(0.008, 0.1, 0.048, -0.342, -0.018, 0, "poly", K.caoutchouc);
      }
      const lc = LONGUEUR_CANON(p.canon, 0.03, 0.085, 0.006, 0.0);
      canonTube(e, p, 0.3, 0.315 + lc, by, 0.0085);
      const tip = bout(e, p.bouche, 0.315 + lc, by, 0.0085, "mp5");
      return { by, tip, ch, rail: { xa: -0.06, xb: 0.08, y: by + 0.072, griffe: true }, dessous: { x: 0.23, y: by - 0.026 }, garde: { centre: V3(0.22, by - 0.028), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.28, y: by - 0.002, z: -0.025, sens: -1, petitRail: true }, laser: { x: 0.24, y: by - 0.002, z: 0.025, sens: "droite", petitRail: true }, ejection: V3(0.06, by + 0.02, 0.02),
        mireNative: { ligne: by + 0.062, arriere: -0.08, z: 0, nom: "hausse tambour et guidon" }, crosse: -0.34 };
    },

    // ✍️ VECTOR : un pistolet-mitrailleur de science-fiction : un gros « nez » en biais sous le canon (le mécanisme qui
    // absorbe le recul), le chargeur tout droit devant, une couleur sable, un rail noir sur tout le dessus.
    vector(e, p) {
      const by = 0.035, F = K.fde;
      e.cote([[-0.1, 0.045], [-0.1, 0.07], [0.24, 0.07], [0.24, 0.045]], 0.042, "metal", K.noir, 0, 0.004);
      e.cote([[-0.1, 0.046], [0.245, 0.046], [0.252, 0.02], [0.222, -0.006], [0.192, -0.056], [0.172, -0.078], [0.104, -0.078], [0.082, -0.04], [0.052, -0.012], [0.012, 0.0], [-0.004, 0.0], [-0.06, 0.012], [-0.1, 0.022]], 0.05, "poly", F, 0, 0.006, null, 2);
      if (!e.leger) { for (const s of [-1, 1]) e.boite(0.07, 0.01, 0.002, 0.16, 0.0, s * 0.0255, "poly", 0x6e5c40, 0, 0, -0.95); e.boite(0.04, 0.012, 0.002, 0.05, 0.035, 0.0255, "poly", K.fente); }
      e.boite(0.014, 0.012, 0.012, 0.2, 0.058, -0.026, "metal", K.noir); // le levier d'armement
      const yr = rail(e, -0.095, 0.235, 0.07, 0);
      poignee(e, "ar", F);
      pontet(e, 0.006, 0.06, 0.0, K.noir);
      if (!crosseSpeciale(e, p, -0.1, by + 0.01, F)) {
        e.tube(-0.2, -0.1, 0.012, 0.012, by + 0.012, 0, "metal", K.noir, 12);
        e.cote([[-0.2, 0.06], [-0.2, 0.03], [-0.31, -0.04], [-0.325, -0.04], [-0.325, 0.07], [-0.3, 0.074]], 0.034, "poly", K.noir, 0, 0.005, [[[-0.215, 0.048], [-0.295, 0.0], [-0.305, 0.0], [-0.305, 0.055], [-0.29, 0.06]]]);
        e.boite(0.01, 0.11, 0.036, -0.33, 0.014, 0, "poly", K.caoutchouc);
      }
      const ch = chargeur(e, { l: 0.15, p: 0.034, w: 0.023, k: 0, a: -0.02, coul: K.noir }, p.chargeur, 0.138, -0.07);
      const lc = LONGUEUR_CANON(p.canon, 0.05, 0.14, 0.015, 0.03);
      canonTube(e, p, 0.25, 0.25 + lc, by + 0.012, 0.01);
      const tip = bout(e, p.bouche, 0.25 + lc, by + 0.012, 0.01, "a2");
      return { by: by + 0.012, tip, ch, rail: { xa: -0.09, xb: 0.225, y: yr }, dessous: { x: 0.235, y: 0.012 }, garde: { centre: V3(0.165, -0.045), axe: V3(-0.55, 1, 0).normalize(), sorte: "vertical" },
        lampe: { x: 0.235, y: 0.056, z: -0.022, sens: -1 }, laser: { x: 0.235, y: 0.056, z: 0.022, sens: "droite" }, ejection: V3(0.05, 0.035, 0.026), mireAvant: 0.21, mireArriere: -0.075, crosse: -0.33 };
    },

    // ✍️ P90 : une forme ronde comme un galet, avec des TROUS pour les mains, et le chargeur TRANSPARENT posé dessus, où l'on
    // voit les 50 balles couchées en travers ; son petit viseur est intégré.
    p90(e, p) {
      const by = 0.022, O = 0x3e4433;
      const ell = (cx, cy, rx, ry) => { const t = []; for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; t.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return t; };
      e.cote([[-0.272, -0.085], [-0.272, 0.05], [-0.24, 0.06], [0.13, 0.06], [0.2, 0.05], [0.235, 0.03], [0.242, 0.0], [0.226, -0.03], [0.2, -0.065], [0.17, -0.088], [0.12, -0.092], [0.075, -0.085], [0.03, -0.1], [-0.03, -0.106], [-0.08, -0.1], [-0.2, -0.094]], 0.06, "poly", O, 0, 0.014,
        [ell(-0.062, -0.052, 0.045, 0.03), ell(0.066, -0.055, 0.045, 0.03), ell(0.176, -0.045, 0.03, 0.022)], 3);
      e.boite(0.004, 0.022, 0.006, 0.034, -0.04, 0, "metal", K.acier, 0, 0, -0.3); // la détente
      e.disque(0.012, 0.064, 0.06, -0.093, 0, "poly", K.noir, 14); // le sélecteur sous la détente
      for (const s of [-1, 1]) e.boite(0.012, 0.008, 0.008, 0.125, 0.034, s * 0.034, "poly", K.noir); // les leviers d'armement
      e.dans("chargeur", () => {
        const l = p.chargeur === "grand" || p.chargeur === "tambour" ? 0.43 : 0.36, x0 = -0.2;
        e.boite(l, 0.026, 0.056, x0 + l / 2, 0.074, 0, "fume");
        e.boite(0.018, 0.03, 0.058, x0 + 0.009, 0.074, 0, "poly", K.noir);
        e.boite(0.03, 0.03, 0.058, x0 + l - 0.015, 0.074, 0, "poly", K.noir);
        if (e.beau) for (let k = 0; k < Math.floor((l - 0.06) / 0.0068); k++) for (const r of [0, 1]) e.disque(0.0029, 0.026, x0 + 0.025 + k * 0.0068 + r * 0.0034, 0.068 + r * 0.008, 0, "metal", K.laiton, 6);
        if (p.chargeur === "rapide") e.boite(0.03, 0.012, 0.02, x0 + l + 0.005, 0.09, 0, "poly", K.rouge); // la languette pour l'arracher vite
      });
      const ch = { x: 0.0, y: 0.06, bande: { x: -0.03, y: 0.074, z: 0, p: 0.012, w: 0.058, h: 0.03 } };
      const yr = rail(e, -0.12, 0.13, 0.087, 0);
      const lc = LONGUEUR_CANON(p.canon, 0.03, 0.09, 0.008, 0.012);
      canonTube(e, p, 0.235, 0.24 + lc, by, 0.009);
      if (p.crosse === "lourde") { e.boite(0.03, 0.14, 0.064, -0.29, -0.018, 0, "poly", K.caoutchouc); e.galet(0.12, 0.022, 0.05, -0.2, 0.0, 0.034, "poly", K.noir, 0.3); }
      const tip = bout(e, p.bouche, 0.24 + lc, by, 0.009, "a2");
      return { by, tip, ch, rail: { xa: -0.11, xb: 0.12, y: yr }, dessous: { x: 0.2, y: -0.07 }, garde: { centre: V3(0.176, -0.078), axe: V3(1, 0.2, 0).normalize(), sorte: "dessous" },
        lampe: { x: 0.215, y: 0.0, z: -0.031, sens: -1, petitRail: true }, laser: { x: 0.215, y: 0.0, z: 0.031, sens: "droite", petitRail: true }, ejection: V3(-0.06, -0.09, 0),
        mireNative: null, integre: true, grip: { centre: V3(0.0, -0.052), axe: V3(0.12, 1, 0).normalize() }, crosse: -0.27 };
    },

    // ✍️ LE PISTOLET : la carcasse sable, la culasse noire striée (elle recule à chaque tir !), les points lumineux des
    // organes de visée, le chargeur dans la poignée.
    pistolet(e, p) {
      const by = 0.03, F = 0x9a8460;
      e.cote([[-0.035, 0.0], [-0.035, 0.015], [0.15, 0.015], [0.15, 0.0], [0.07, 0.0], [0.06, -0.004], [0.03, -0.004], [0.012, 0.0]], 0.026, "poly", F, 0, 0.003);
      e.cote([[0.0, 0.002], [0.074, 0.002], [0.078, -0.01], [0.062, -0.032], [0.0, -0.034]], 0.018, "poly", F, 0, 0.003, [[[0.008, -0.004], [0.062, -0.004], [0.064, -0.012], [0.054, -0.026], [0.008, -0.026]]]);
      e.cote([[0.008, 0.0], [-0.004, -0.04], [-0.014, -0.1], [-0.052, -0.103], [-0.05, -0.08], [-0.04, -0.03], [-0.046, 0.0], [-0.05, 0.01], [-0.035, 0.012]], 0.03, "poly", F, 0, 0.006, null, 2);
      if (!e.leger) for (let k = 0; k < 5; k++) for (const s of [-1, 1]) e.boite(0.03, 0.006, 0.002, -0.026 + k * 0.0012, -0.03 - k * 0.013, s * 0.0152, "poly", 0x7a6848, 0, 0, -0.2);
      e.boite(0.004, 0.02, 0.006, 0.026, -0.012, 0, "metal", K.acier, 0, 0, -0.3);
      const yb = rail(e, 0.09, 0.145, 0.0, 0, "bas", F);
      e.dans("culasse", () => {
        e.cote([[-0.042, 0.014], [-0.042, 0.043], [-0.032, 0.047], [0.15, 0.047], [0.157, 0.04], [0.157, 0.014]], 0.026, "metal", K.noir, 0, 0.003);
        if (!e.leger) {
          for (let k = 0; k < 6; k++) for (const s of [-1, 1]) e.boite(0.0025, 0.026, 0.002, -0.036 + k * 0.006, 0.03, s * 0.0132, "poly", 0x0a0a0a);
          e.boite(0.04, 0.012, 0.002, 0.03, 0.035, 0.0132, "poly", K.fente);
        }
        e.boite(0.012, 0.008, 0.024, -0.026, 0.051, 0, "metal", K.noir);
        e.boite(0.006, 0.007, 0.006, 0.145, 0.05, 0, "metal", K.noir);
        for (const s of [-1, 1]) e.boule(0.0015, -0.032, 0.053, s * 0.006, "lumiere", 0x52ff60, 6);
        e.boule(0.0015, 0.145, 0.0535, 0, "lumiere", 0x52ff60, 6);
        e.tube(0.155, 0.159, 0.006, 0.006, by, 0, "poly", K.fente, 10);
      });
      e.dans("chargeur", () => {
        const g = p.chargeur === "grand" || p.chargeur === "tambour";
        e.cote([[-0.012, -0.01], [-0.042, -0.01], [-0.054, -0.105 - (g ? 0.035 : 0)], [-0.022, -0.105 - (g ? 0.035 : 0)]], 0.022, "metal", 0x343434, 0, 0.002);
        e.boite(0.044, 0.008, 0.032, -0.035, -0.107 - (g ? 0.035 : 0), 0, "poly", K.noir, 0, 0, 0.1);
        if (g) e.cote([[-0.018, -0.1], [-0.054, -0.1], [-0.058, -0.138], [-0.022, -0.138]], 0.032, "poly", F, 0, 0.004);
      });
      return { by, tip: 0.159, ch: { x: -0.035, y: -0.11 }, rail: null, dessous: { x: 0.12, y: yb }, garde: { centre: V3(-0.016, -0.072, -0.034), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
        lampe: null, laser: null, ejection: V3(0.03, 0.038, 0.014), mireNative: { ligne: 0.054, arriere: -0.028, z: 0, nom: "points lumineux" }, glissiere: { x: 0.035, y: 0.047 }, bout: { x: 0.159, y: by, r: 0.006 }, grip: { centre: V3(-0.026, -0.05), axe: V3(0.25, 1, 0).normalize() }, crosse: -0.05 };
    },

    // ✍️ RPG-7 : le tube vert, ses 2 protections en BOIS, l'entonnoir à l'arrière (le souffle sort par là !), les 2
    // poignées, et la grosse ROQUETTE en pointe (c'est elle qu'on recharge).
    rpg7(e, p) {
      const by = 0.062, V = 0x3c4232;
      e.tube(-0.44, 0.42, 0.023, 0.023, by, 0, "metal", V, 20);
      e.tour([[-0.6, 0.05], [-0.585, 0.048], [-0.53, 0.035], [-0.47, 0.027], [-0.44, 0.024]], by, 0, "metal", V, 22);
      e.tube(-0.598, -0.596, 0.044, 0.044, by, 0, "poly", K.fente, 20);
      for (const [a, b] of [[-0.27, -0.06], [0.07, 0.24]]) {
        e.tour([[a, 0.024], [a + 0.006, 0.034], [b - 0.006, 0.034], [b, 0.024]], by, 0, "bois", null, 20);
        if (!e.leger) for (let x = a + 0.03; x < b - 0.02; x += 0.035) e.tube(x, x + 0.003, 0.0345, 0.0345, by, 0, "poly", 0x2a1608, 20);
      }
      e.boite(0.08, 0.03, 0.03, 0.015, by - 0.036, 0, "metal", V); // le mécanisme de mise à feu
      poignee(e, "ak", K.noir);
      pontet(e, 0.004, 0.044, 0.0, V);
      poignee(e, "ak", K.noir, 0.3, 0.0); // la poignée de devant
      e.boite(0.03, 0.03, 0.024, 0.31, by - 0.035, 0, "metal", V);
      // le guidon et la hausse repliables, sur le côté GAUCHE du tube (l'œil vise à côté du tube)
      e.boite(0.03, 0.012, 0.05, 0.33, by + 0.012, -0.035, "metal", V);
      e.boite(0.004, 0.034, 0.004, 0.33, by + 0.034, -0.058, "metal", V);
      e.boite(0.03, 0.012, 0.05, 0.06, by + 0.012, -0.035, "metal", V);
      e.anneau(0.006, 0.002, 0.06, by + 0.05, -0.058, "metal", V);
      e.boite(0.006, 0.03, 0.006, 0.06, by + 0.03, -0.058, "metal", V);
      e.dans("chargeur", () => { // la ROQUETTE PG-7
        e.tube(0.42, 0.5, 0.019, 0.02, by, 0, "metal", 0x3a3d33, 16);
        e.tour([[0.5, 0.02], [0.52, 0.034], [0.56, 0.042], [0.64, 0.042], [0.68, 0.036], [0.8, 0.012], [0.83, 0.007]], by, 0, "metal", 0x56603a, 22);
        e.tube(0.6, 0.615, 0.0425, 0.0425, by, 0, "poly", 0xb59a52, 22);
        e.tube(0.83, 0.865, 0.006, 0.004, by, 0, "metal", K.acier, 10);
      });
      return { by, tip: 0.42, ch: { x: 0.6, y: by }, rail: null, dessous: { x: 0.3, y: by - 0.05 }, garde: { centre: V3(0.278, -0.05), axe: V3(0.3, 1, 0).normalize(), sorte: "vertical" },
        lampe: { x: 0.4, y: by, z: -0.024, sens: -1, petitRail: true }, laser: { x: 0.36, y: by + 0.023, z: 0, sens: "haut", petitRail: true }, ejection: null,
        mireNative: { ligne: by + 0.05, arriere: 0.06, z: -0.058, nom: "hausse repliable" }, bracket: { x: 0.0, y: by + 0.012, z: -0.06 }, arriere: -0.6, crosse: -0.2 };
    },

    // ✍️ AT4 : un gros tube vert à jeter après le tir : l'amortisseur noir devant, la bande jaune (« roquette chargée »),
    // le capuchon à l'arrière, les viseurs repliables sur le dessus, la détente devant.
    at4(e, p) {
      const by = 0.07, V = 0x59613c;
      e.tube(-0.48, 0.46, 0.042, 0.042, by, 0, "poly", V, 26);
      if (!e.leger) for (const x of [-0.4, -0.3, -0.12, 0.05, 0.2, 0.38]) e.tube(x, x + 0.012, 0.0445, 0.0445, by, 0, "poly", 0x515836, 26);
      e.tour([[0.46, 0.044], [0.47, 0.05], [0.535, 0.05], [0.545, 0.043]], by, 0, "poly", K.caoutchouc, 26);
      e.tube(0.543, 0.545, 0.038, 0.038, by, 0, "poly", 0x2c2c26, 22);
      e.tour([[-0.565, 0.044], [-0.555, 0.05], [-0.49, 0.05], [-0.48, 0.044]], by, 0, "poly", K.caoutchouc, 26);
      e.tube(0.3, 0.33, 0.0428, 0.0428, by, 0, "poly", K.jaune, 26);
      // les viseurs repliables, sur le dessus à gauche
      e.boite(0.03, 0.03, 0.012, 0.22, by + 0.055, -0.018, "metal", K.noir);
      e.boite(0.03, 0.03, 0.012, -0.04, by + 0.055, -0.018, "metal", K.noir);
      e.anneau(0.006, 0.002, -0.04, by + 0.072, -0.018, "metal", K.noir);
      e.boite(0.05, 0.016, 0.02, 0.05, by + 0.048, 0.012, "poly", K.noir); // le levier d'armement
      e.boite(0.012, 0.01, 0.012, 0.08, by + 0.058, 0.012, "poly", K.rouge); // la sûreté rouge
      e.boite(0.06, 0.03, 0.036, 0.0, by - 0.046, 0, "poly", K.noir);
      poignee(e, "droite", K.noir);
      e.boite(0.16, 0.026, 0.05, -0.25, by - 0.054, 0, "poly", K.noir); // l'appui-épaule
      e.boite(0.05, 0.024, 0.03, 0.27, by - 0.05, 0, "poly", K.noir);
      return { by, tip: 0.545, ch: null, rail: null, dessous: { x: 0.27, y: by - 0.062 }, garde: { centre: V3(0.27, by - 0.07), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.44, y: by, z: -0.043, sens: -1, petitRail: true }, laser: { x: 0.4, y: by + 0.043, z: 0, sens: "haut", petitRail: true }, ejection: null,
        mireNative: { ligne: by + 0.072, arriere: -0.04, z: -0.018, nom: "viseurs repliables" }, bracket: { x: 0.06, y: by + 0.03, z: -0.062 }, arriere: -0.565, crosse: -0.25 };
    },

    // ✍️ JAVELIN : un gros tube (le missile est dedans) et, sur le côté, la grosse caméra de tir (le « CLU ») avec ses
    // grandes lentilles, son œilleton et ses 2 poignées.
    javelin(e, p) {
      const by = 0.1, T = 0x6b6a4a, zt = 0.085, CLU = 0x575c48;
      e.tube(-0.58, 0.48, 0.068, 0.068, by, zt, "poly", T, 28);
      for (const x of [-0.58, 0.44]) e.tour([[x, 0.07], [x + 0.008, 0.078], [x + 0.032, 0.078], [x + 0.04, 0.07]], by, zt, "poly", K.caoutchouc, 28);
      e.tube(0.478, 0.48, 0.064, 0.064, by, zt, "poly", 0x3a3a2c, 24);
      e.tube(-0.6, -0.58, 0.05, 0.05, by, zt, "poly", 0x3a3a2c, 24);
      e.tube(-0.38, -0.24, 0.03, 0.03, by - 0.075, zt, "poly", K.noir, 14); // la batterie
      e.galet(0.27, 0.17, 0.15, -0.03, by + 0.02, -0.06, "poly", CLU, 0.18);
      e.tube(0.1, 0.14, 0.045, 0.045, by + 0.05, -0.065, "metal", K.noir, 22);
      e.tube(0.138, 0.142, 0.039, 0.039, by + 0.05, -0.065, "verre", null, 22);
      e.boite(0.03, 0.05, 0.07, 0.115, by - 0.03, -0.06, "metal", K.noir);
      e.boite(0.004, 0.04, 0.058, 0.131, by - 0.03, -0.06, "verre");
      e.tour([[-0.24, 0.024], [-0.21, 0.02], [-0.165, 0.022]], by + 0.045, -0.06, "poly", K.caoutchouc, 18); // l'œilleton
      e.tube(-0.168, -0.165, 0.017, 0.017, by + 0.045, -0.06, "verre", null, 16);
      for (const k of [0, 1, 2]) e.cyl(0.008, 0.008, 0.012, -0.08 + k * 0.04, by + 0.11, -0.06, "poly", K.noir, 10);
      poignee(e, "droite", K.noir); // la poignée de droite (entre le tube et la caméra)
      poignee(e, "droite", K.noir, 0.0, 0.0, 0.03, "poly", -0.12); // la poignée de gauche (de l'autre côté de la caméra)
      return { by, tip: 0.48, tipZ: zt, ch: null, rail: null, dessous: null, garde: { centre: V3(-0.02, -0.05, -0.12), axe: V3(0.25, 1, 0).normalize(), sorte: "vertical" },
        lampe: { x: 0.45, y: by, z: zt - 0.07, sens: -1, petitRail: true }, laser: { x: 0.4, y: by + 0.068, z: zt, sens: "haut", petitRail: true }, ejection: null,
        mireNative: { ligne: by + 0.045, arriere: -0.24, z: -0.06, nom: "caméra de tir (CLU)" }, bracket: null, arriere: -0.6, crosse: -0.3, vue: [-0.06, -0.07, -0.2] };
    },

    // ------------------------------------------------------------------ (demande 97) LES NOUVELLES ARMES
    // ✍️ G36 : le fusil allemand tout en polymère vert-noir : la grande POIGNÉE DE TRANSPORT avec son trou (elle porte le
    // viseur), le garde-main percé de trous ronds, le chargeur TRANSPARENT (on voit s'il reste des balles) et la crosse
    // squelette repliable.
    g36(e, p) {
      const by = 0.04, N = 0x2d2f2b, N2 = 0x363833;
      e.cote([[-0.095, -0.004], [-0.095, 0.068], [0.205, 0.068], [0.215, 0.055], [0.215, 0.012], [0.11, 0.0], [0.105, -0.03], [0.04, -0.03], [0.034, -0.004]], 0.044, "poly", N, 0, 0.005, null, 2);
      if (!e.leger) {
        e.boite(0.05, 0.014, 0.002, 0.02, 0.05, 0.0222, "poly", K.fente); // la fenêtre d'éjection
        for (const s of [-1, 1]) e.boite(0.26, 0.003, 0.002, 0.06, 0.03, s * 0.0222, "poly", 0x1c1d1b); // la ligne du moule
      }
      // la poignée de transport (avec son trou pour la main) qui porte le viseur
      e.cote([[-0.075, 0.068], [-0.06, 0.122], [0.13, 0.122], [0.16, 0.068]], 0.036, "poly", N2, 0, 0.005, [[[-0.04, 0.078], [0.12, 0.078], [0.12, 0.108], [-0.04, 0.108]]], 2);
      e.boite(0.02, 0.012, 0.03, 0.172, 0.075, 0, "metal", K.noir); // le levier d'armement, sous la poignée
      const yr = rail(e, -0.055, 0.125, 0.122, 0);
      // le garde-main ventilé (des trous ronds sur les côtés)
      e.cote([[0.215, 0.064], [0.4, 0.064], [0.41, 0.05], [0.41, 0.006], [0.395, -0.008], [0.215, -0.008]], 0.05, "poly", N, 0, 0.006, null, 2);
      if (!e.leger) for (let x = 0.25; x < 0.39; x += 0.03) for (const s of [-1, 1]) e.disque(0.008, 0.004, x, 0.03, s * 0.0245, "poly", K.fente, 10);
      if (!crosseSpeciale(e, p, -0.095, by, N)) {
        e.boite(0.02, 0.05, 0.05, -0.1, 0.035, 0, "poly", N2); // la charnière
        e.cote([[-0.095, 0.066], [-0.34, 0.066], [-0.355, 0.05], [-0.355, -0.06], [-0.33, -0.065], [-0.2, -0.012], [-0.095, 0.0]], 0.032, "poly", N, 0, 0.005,
          [[[-0.12, 0.05], [-0.3, 0.05], [-0.315, 0.03], [-0.315, -0.03], [-0.22, -0.002], [-0.12, 0.014]]], 2);
        e.boite(0.012, 0.13, 0.04, -0.36, 0.0, 0, "poly", K.caoutchouc);
      }
      poignee(e, "ar", N);
      pontet(e, 0.006, 0.07, 0.0, N);
      const ch = chargeur(e, { l: 0.15, p: 0.058, w: 0.026, k: 0.15, a: 0.05, coul: 0x9a7e52, mat: "fume", double: true }, p.chargeur, 0.072, -0.03);
      e.dans("chargeur", () => { for (const s of [-1, 1]) e.boite(0.012, 0.03, 0.004, 0.098, -0.05, s * 0.015, "poly", 0x3a3020); }); // les attaches (on clipse 2 chargeurs ensemble)
      const lc = LONGUEUR_CANON(p.canon, 0.1, 0.19, 0.03);
      canonTube(e, p, 0.41, 0.41 + lc, by, 0.0095);
      const tip = bout(e, p.bouche, 0.41 + lc, by, 0.0095, "a2");
      return { by, tip, ch, rail: { xa: -0.05, xb: 0.12, y: yr }, dessous: { x: 0.33, y: -0.008 }, garde: { centre: V3(0.3, -0.012), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.4, y: by, z: -0.025, sens: -1, petitRail: true }, laser: { x: 0.35, y: 0.064, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.02, 0.05, 0.022), mireAvant: 0.115, mireArriere: -0.045, crosse: -0.36 };
    },

    // ✍️ SCAR-H : le gros fusil de combat couleur SABLE : un long receveur avec un rail sur tout le dessus, des rails sur les
    // côtés, le levier d'armement à gauche, la crosse repliable avec son appui-joue, et un chargeur droit en acier noir.
    scarh(e, p) {
      const by = 0.045, F = K.fde, F2 = K.fdeFonce, N = K.noir;
      e.cote([[-0.085, 0.028], [-0.085, 0.076], [0.38, 0.076], [0.39, 0.066], [0.39, 0.02], [0.13, 0.02], [0.12, 0.028]], 0.04, "metal", F, 0, 0.004);
      const yr = rail(e, -0.08, 0.385, 0.076, 0);
      for (const s of [-1, 1]) rail(e, 0.2, 0.37, by - 0.002, s * 0.02, s > 0 ? "droite" : "gauche", N);
      const yb = rail(e, 0.22, 0.37, 0.02, 0, "bas", N);
      e.cote([[-0.07, 0.028], [0.125, 0.028], [0.125, 0.0], [0.115, -0.03], [0.04, -0.03], [0.03, -0.006], [0.012, 0.0], [-0.07, 0.0]], 0.036, "poly", F2, 0, 0.004);
      e.boite(0.03, 0.012, 0.03, 0.1, 0.06, -0.026, "metal", N); // le levier d'armement (à gauche)
      if (!e.leger) {
        e.boite(0.05, 0.014, 0.002, 0.03, 0.05, 0.0202, "poly", K.fente);
        for (let x = 0.17; x < 0.36; x += 0.04) for (const s of [-1, 1]) e.boite(0.02, 0.008, 0.002, x, 0.064, s * 0.0202, "poly", K.fente);
      }
      if (!crosseSpeciale(e, p, -0.085, by, F2)) {
        e.boite(0.03, 0.045, 0.04, -0.1, 0.05, 0, "poly", N); // la charnière
        e.cote([[-0.11, 0.074], [-0.36, 0.068], [-0.37, 0.06], [-0.37, -0.045], [-0.355, -0.05], [-0.22, -0.01], [-0.11, 0.025]], 0.038, "poly", F2, 0, 0.006,
          [[[-0.15, 0.04], [-0.3, 0.035], [-0.31, 0.0], [-0.22, 0.012], [-0.15, 0.028]]], 2);
        e.galet(0.12, 0.024, 0.044, -0.27, 0.074, 0, "poly", F, 0.3);
        e.boite(0.014, 0.12, 0.044, -0.375, 0.008, 0, "poly", K.caoutchouc);
      }
      poignee(e, "ar", N);
      pontet(e, 0.006, 0.075, 0.0, F2);
      const ch = chargeur(e, { l: 0.11, p: 0.07, w: 0.028, k: 0.04, a: 0.03, coul: 0x2c2c2c, mat: "metal", double: true }, p.chargeur, 0.078, -0.03);
      const lc = LONGUEUR_CANON(p.canon, 0.1, 0.19, 0.035);
      canonTube(e, p, 0.39, 0.39 + lc, by, 0.0105);
      const tip = bout(e, p.bouche, 0.39 + lc, by, 0.0105, "a2");
      return { by, tip, ch, rail: { xa: -0.075, xb: 0.37, y: yr }, dessous: { x: 0.3, y: yb, rail: true }, garde: { centre: V3(0.29, -0.004), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.37, y: by - 0.002, z: -0.03, sens: -1 }, laser: { x: 0.33, y: yr, z: 0, sens: "haut" }, ejection: V3(0.03, 0.05, 0.02), mireAvant: 0.355, mireArriere: -0.06, crosse: -0.37 };
    },

    // ✍️ UMP45 : un boîtier carré en polymère noir, un chargeur large (les balles de .45 sont grosses !), des petits rails
    // tout autour du canon et une crosse squelette qui se replie sur le côté.
    ump45(e, p) {
      const by = 0.035, N = 0x2a2b2d;
      e.cote([[-0.11, -0.002], [-0.11, 0.07], [0.26, 0.07], [0.27, 0.058], [0.27, 0.005], [0.2, -0.002], [0.12, -0.002], [0.11, -0.03], [0.04, -0.03], [0.03, -0.002]], 0.046, "poly", N, 0, 0.006, null, 2);
      if (!e.leger) {
        for (const s of [-1, 1]) e.boite(0.13, 0.005, 0.002, 0.19, 0.03, s * 0.0232, "poly", 0x18191a);
        e.boite(0.05, 0.016, 0.002, 0.02, 0.05, 0.0232, "poly", K.fente);
      }
      const yr = rail(e, -0.1, 0.25, 0.07, 0);
      rail(e, 0.19, 0.26, by, -0.024, "gauche");
      rail(e, 0.19, 0.26, by, 0.024, "droite");
      const yb = rail(e, 0.18, 0.26, -0.002, 0, "bas");
      e.boite(0.014, 0.012, 0.016, 0.2, 0.062, -0.03, "metal", K.noir); // le levier d'armement
      poignee(e, "droite", N);
      pontet(e, 0.006, 0.065, 0.0, N);
      const ch = chargeur(e, { l: 0.13, p: 0.052, w: 0.03, k: 0.06, a: 0.02, coul: 0x262626, nervures: "pmag" }, p.chargeur, 0.072, -0.03);
      if (!crosseSpeciale(e, p, -0.11, by, N)) {
        e.boite(0.02, 0.05, 0.04, -0.12, 0.035, 0, "poly", N);
        e.cote([[-0.12, 0.068], [-0.36, 0.06], [-0.37, 0.05], [-0.37, -0.05], [-0.355, -0.055], [-0.12, 0.005]], 0.028, "poly", N, 0, 0.004, [[[-0.14, 0.05], [-0.34, 0.045], [-0.345, -0.03], [-0.15, 0.018]]], 2);
        e.boite(0.012, 0.11, 0.032, -0.375, 0.0, 0, "poly", K.caoutchouc);
      }
      const lc = LONGUEUR_CANON(p.canon, 0.04, 0.12, 0.012);
      canonTube(e, p, 0.27, 0.27 + lc, by, 0.0095);
      const tip = bout(e, p.bouche, 0.27 + lc, by, 0.0095, "a2");
      return { by, tip, ch, rail: { xa: -0.09, xb: 0.24, y: yr }, dessous: { x: 0.225, y: yb, rail: true }, garde: { centre: V3(0.21, -0.022), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.26, y: by, z: -0.034, sens: -1 }, laser: { x: 0.25, y: by, z: 0.034, sens: "droite" }, ejection: V3(0.02, 0.05, 0.024), mireAvant: 0.235, mireArriere: -0.08, crosse: -0.37 };
    },

    // ✍️ CARL GUSTAF M4 : un gros tube vert, l'entonnoir (« venturi ») à l'arrière par où sort le souffle, 2 poignées, un
    // appui-épaule, une poignée de transport, et sa petite lunette ×3 sur le côté gauche.
    carlgustaf(e, p) {
      const by = 0.075, V = 0x5c5e44, V2 = 0x4c4d38, N = K.noir;
      e.tube(-0.42, 0.52, 0.052, 0.052, by, 0, "metal", V, 26);
      if (!e.leger) for (const x of [-0.3, -0.1, 0.12, 0.32]) e.tube(x, x + 0.02, 0.0545, 0.0545, by, 0, "metal", V2, 26);
      e.tour([[0.52, 0.054], [0.53, 0.06], [0.56, 0.06], [0.565, 0.056]], by, 0, "metal", N, 26);
      e.tube(0.563, 0.565, 0.046, 0.046, by, 0, "poly", K.fente, 22);
      e.tour([[-0.42, 0.056], [-0.46, 0.062], [-0.53, 0.056], [-0.62, 0.075], [-0.64, 0.078]], by, 0, "metal", 0x3a3b36, 26); // le venturi
      e.tube(-0.638, -0.636, 0.07, 0.07, by, 0, "poly", K.fente, 22);
      e.boite(0.05, 0.03, 0.03, -0.44, by + 0.06, 0.0, "metal", N); // le levier de la culasse
      e.tube(-0.45, -0.43, 0.06, 0.06, by, 0, "metal", K.jaune, 26); // la bande jaune : « arme chargée »
      e.boite(0.07, 0.03, 0.036, 0.0, by - 0.058, 0, "poly", N);
      poignee(e, "droite", N);
      pontet(e, 0.004, 0.045, 0.0, N);
      e.boite(0.05, 0.03, 0.036, 0.28, by - 0.058, 0, "poly", N);
      poignee(e, "droite", N, 0.29, 0.0); // la poignée de devant
      e.cote([[-0.1, by - 0.05], [-0.32, by - 0.05], [-0.34, by - 0.07], [-0.34, by - 0.11], [-0.3, by - 0.11], [-0.12, by - 0.08]], 0.05, "poly", N, 0, 0.006); // l'appui-épaule
      for (const [a, b] of [[[0.05, by + 0.052, 0], [0.07, by + 0.1, 0]], [[0.07, by + 0.1, 0], [0.2, by + 0.1, 0]], [[0.2, by + 0.1, 0], [0.22, by + 0.052, 0]]]) e.barre(a, b, 0.007, "metal", N);
      if (p.viseur === "mire") { // la lunette d'origine ×3, sur un support à gauche
        e.boite(0.06, 0.04, 0.03, -0.05, by + 0.04, -0.058, "metal", N);
        e.tour([[-0.13, 0.016], [-0.1, 0.014], [0.03, 0.014], [0.05, 0.018], [0.08, 0.018]], by + 0.066, -0.075, "metal", 0x35373a, 20);
        e.tube(-0.131, -0.129, 0.013, 0.013, by + 0.066, -0.075, "verre", null, 18);
        e.tube(0.079, 0.081, 0.016, 0.016, by + 0.066, -0.075, "verre", null, 18);
      }
      return { by, tip: 0.565, ch: null, rail: null, dessous: null, garde: { centre: V3(0.27, -0.05), axe: V3(0.3, 1, 0).normalize(), sorte: "vertical" },
        lampe: { x: 0.5, y: by, z: -0.052, sens: -1, petitRail: true }, laser: { x: 0.45, y: by + 0.052, z: 0, sens: "haut", petitRail: true }, ejection: null,
        mireNative: { ligne: by + 0.066, arriere: -0.13, z: -0.075, nom: "lunette d'origine ×3" }, bracket: { x: -0.02, y: by + 0.035, z: -0.075 }, arriere: -0.64, crosse: -0.34 };
    },

    // ✍️ M24 : le fusil à verrou « classique » : une longue crosse de chasse vert très foncé (en fibre de verre), le boîtier
    // rond en acier bleui, le levier du verrou, un canon long et fin, et sa lunette à fort grossissement.
    m24(e, p) {
      const by = 0.045, B = 0x343a2c, A = 0x2e3033;
      e.tube(-0.12, 0.11, 0.019, 0.019, by, 0, "metal", A, 20);
      e.boite(0.045, 0.012, 0.002, 0.0, by + 0.006, 0.019, "poly", K.fente);
      e.dans("culasse", () => {
        e.tube(-0.15, -0.118, 0.016, 0.015, by, 0, "metal", 0x45484c, 16);
        e.barre([-0.08, by, 0.016], [-0.09, by - 0.03, 0.06], 0.0045, "metal", K.acier);
        e.boule(0.01, -0.092, by - 0.034, 0.064, "metal", 0x2a2a2a, 12);
      });
      const yr = rail(e, -0.1, 0.1, by + 0.019, 0);
      if (p.crosse === "standard") {
        e.cote([[0.44, 0.033], [0.44, 0.02], [0.42, 0.01], [0.12, 0.006], [0.09, -0.004], [0.0, -0.008], [-0.02, -0.04], [-0.045, -0.095], [-0.085, -0.1], [-0.09, -0.07], [-0.12, -0.056], [-0.46, -0.088], [-0.476, -0.082],
          [-0.476, 0.05], [-0.46, 0.058], [-0.2, 0.046], [-0.14, 0.04], [-0.12, 0.03], [0.12, 0.03], [0.14, 0.033]], 0.044, "poly", B, 0, 0.007, null, 3);
        e.boite(0.016, 0.142, 0.046, -0.484, -0.016, 0, "poly", K.caoutchouc);
        if (!e.leger) for (let k = 0; k < 40; k++) e.boule(0.0022, -0.45 + hasard() * 0.86, -0.06 + hasard() * 0.1, (hasard() < 0.5 ? -1 : 1) * 0.0225, "poly", 0x1a1d16, 5); // les mouchetures
      } else {
        e.cote([[0.44, 0.033], [0.44, 0.02], [0.42, 0.01], [0.12, 0.006], [0.09, -0.004], [-0.12, -0.004], [-0.12, 0.03], [0.12, 0.03], [0.14, 0.033]], 0.044, "poly", B, 0, 0.006, null, 2);
        crosseSpeciale(e, p, -0.12, by, B);
        poignee(e, "ar", K.noir);
      }
      pontet(e, 0.008, 0.06, 0.0, A);
      let ch = { x: 0.06, y: -0.012 };
      if (p.chargeur === "grand") ch = chargeur(e, { l: 0.07, p: 0.075, w: 0.028, k: 0, a: 0, coul: K.noir, mat: "metal" }, "standard", 0.07, -0.004);
      else e.dans("chargeur", () => e.boite(0.08, 0.006, 0.03, 0.065, -0.008, 0, "metal", A)); // (le plancher du magasin intégré)
      const lc = LONGUEUR_CANON(p.canon, 0.26, 0.34, 0.16);
      canonTube(e, p, 0.11, 0.44 + lc, by, 0.0105);
      const tip = bout(e, p.bouche, 0.44 + lc, by, 0.0095, "aucun");
      return { by, tip, ch, rail: { xa: -0.095, xb: 0.095, y: yr }, dessous: { x: 0.33, y: 0.012 }, garde: { centre: V3(0.28, 0.0), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.42, y: 0.022, z: -0.022, sens: -1, petitRail: true }, laser: { x: 0.38, y: 0.022, z: 0.022, sens: "droite", petitRail: true }, ejection: V3(0.0, by + 0.01, 0.02),
        lunetteNative: (e2, y) => lunette(e2, 0.0, y, 0, { long: 0.34, obj: 0.028, haut: 0.05, coul: 0x2f3032, nom: "lunette ×10 de précision" }), crosse: -0.48,
        grip: p.crosse === "standard" ? { centre: V3(-0.062, -0.05), axe: V3(0.45, 1, 0).normalize() } : null };
    },

    // ✍️ Mk 14 EBR : le vieux fusil M14 glissé dans un CHÂSSIS en alu plein de rails : on voit sa tige de manœuvre à droite,
    // une crosse réglable sur un tube, un chargeur droit de 20 et un gros frein de bouche.
    mk14(e, p) {
      const by = 0.05, N = 0x2f3134, O = 0x4a4f3c;
      e.cote([[-0.09, 0.0], [-0.09, 0.08], [0.5, 0.08], [0.51, 0.07], [0.51, 0.02], [0.13, 0.02], [0.12, -0.03], [0.04, -0.03], [0.03, -0.004], [0.012, 0.0]], 0.05, "metal", N, 0, 0.004);
      if (!e.leger) for (let x = 0.17; x < 0.49; x += 0.04) for (const s of [-1, 1]) e.boite(0.022, 0.012, 0.003, x, 0.05, s * 0.0255, "poly", K.fente);
      const yr = rail(e, -0.085, 0.505, 0.08, 0);
      for (const s of [-1, 1]) rail(e, 0.3, 0.5, 0.05, s * 0.025, s > 0 ? "droite" : "gauche", N);
      const yb = rail(e, 0.3, 0.5, 0.02, 0, "bas", N);
      e.boite(0.2, 0.01, 0.006, 0.12, 0.062, 0.028, "metal", K.acier); // la tige de manœuvre du M14
      e.boite(0.016, 0.014, 0.014, 0.21, 0.066, 0.035, "metal", K.acier);
      e.boite(0.06, 0.016, 0.002, 0.0, 0.07, 0.0255, "poly", K.fente);
      if (!crosseSpeciale(e, p, -0.09, by, O)) {
        e.tube(-0.26, -0.09, 0.016, 0.016, by, 0, "metal", N, 16);
        e.cote([[-0.2, 0.072], [-0.2, 0.024], [-0.3, -0.02], [-0.38, -0.055], [-0.392, -0.055], [-0.392, 0.07], [-0.37, 0.076]], 0.044, "poly", O, 0, 0.006, null, 2);
        e.galet(0.13, 0.026, 0.042, -0.3, 0.09, 0, "poly", O, 0.3);
        e.boite(0.016, 0.13, 0.046, -0.4, 0.008, 0, "poly", K.caoutchouc);
      }
      poignee(e, "ar", O);
      pontet(e, 0.008, 0.078, 0.0, N);
      const ch = chargeur(e, { l: 0.11, p: 0.072, w: 0.028, k: 0.05, a: 0.02, coul: 0x2a2a2a, mat: "metal", nervures: "ak" }, p.chargeur, 0.078, -0.03);
      const lc = LONGUEUR_CANON(p.canon, 0.14, 0.24, 0.05);
      canonTube(e, p, 0.51, 0.51 + lc, by, 0.011);
      const tip = bout(e, p.bouche, 0.51 + lc, by, 0.011, "frein");
      return { by, tip, ch, rail: { xa: -0.08, xb: 0.49, y: yr }, dessous: { x: 0.42, y: yb, rail: true }, garde: { centre: V3(0.36, -0.004), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.49, y: by, z: -0.035, sens: -1 }, laser: { x: 0.46, y: yr, z: 0, sens: "haut" }, ejection: V3(0.0, 0.07, 0.028),
        lunetteNative: (e2, y) => lunette(e2, 0.06, y, 0, { long: 0.3, obj: 0.026, coul: 0x2f3032, nom: "lunette de tireur ×6" }), crosse: -0.4 };
    },

    // ✍️ MP7 : tout petit et haut, le chargeur rentre DANS la poignée, la poignée avant se replie sous le canon, et la crosse
    // n'est que 2 tiges et une petite plaque.
    mp7(e, p) {
      const by = 0.042, N = 0x2c2d2f;
      e.cote([[-0.07, 0.0], [-0.07, 0.075], [0.15, 0.075], [0.17, 0.06], [0.17, 0.012], [0.12, 0.0], [0.02, 0.0]], 0.042, "poly", N, 0, 0.006, null, 2);
      if (!e.leger) {
        for (const s of [-1, 1]) e.boite(0.1, 0.004, 0.002, 0.07, 0.022, s * 0.0212, "poly", 0x18191a);
        e.boite(0.04, 0.012, 0.002, 0.04, 0.055, 0.0212, "poly", K.fente);
      }
      const yr = rail(e, -0.065, 0.16, 0.075, 0);
      e.boite(0.02, 0.016, 0.046, -0.062, 0.068, 0, "metal", K.noir); // le levier en T, à l'arrière
      // la poignée (le chargeur entre par en dessous)
      e.cote([[0.02, 0.0], [0.008, -0.1], [-0.03, -0.102], [-0.036, -0.06], [-0.03, -0.01], [-0.04, 0.0]], 0.034, "poly", N, 0, 0.006, null, 2);
      pontet(e, 0.025, 0.08, 0.0, N);
      const g = p.chargeur === "grand" ? 0.05 : 0;
      e.dans("chargeur", () => {
        e.cote([[0.003, -0.095], [-0.028, -0.095], [-0.036, -0.13 - g], [-0.002, -0.13 - g]], 0.026, "poly", 0x252525, 0, 0.003);
        e.boite(0.04, 0.008, 0.03, -0.019, -0.133 - g, 0, "poly", K.noir, 0, 0, 0.12);
      });
      if (p.poignee === "aucun") { // la poignée avant d'origine, repliée sous le canon
        e.boite(0.03, 0.012, 0.024, 0.13, -0.004, 0, "poly", N);
        e.galet(0.075, 0.014, 0.022, 0.1, -0.016, 0, "poly", N, 0.3);
      }
      if (!crosseSpeciale(e, p, -0.07, by - 0.01, N)) {
        for (const s of [-1, 1]) e.barre([-0.07, 0.03, s * 0.016], [-0.25, 0.03, s * 0.016], 0.0042, "metal", N);
        e.cote([[-0.245, 0.06], [-0.265, 0.06], [-0.265, -0.04], [-0.245, -0.04]], 0.044, "poly", N, 0, 0.004);
      }
      const lc = LONGUEUR_CANON(p.canon, 0.035, 0.1, 0.01);
      canonTube(e, p, 0.17, 0.17 + lc, by, 0.0085);
      const tip = bout(e, p.bouche, 0.17 + lc, by, 0.0085, "a2");
      return { by, tip, ch: { x: -0.019, y: -0.133 - g, bande: { x: -0.017, y: -0.115 - g * 0.5, z: 0, p: 0.034, w: 0.026, a: 0.12 } }, rail: { xa: -0.06, xb: 0.155, y: yr }, dessous: { x: 0.12, y: 0.0 },
        garde: { centre: V3(0.11, -0.03), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.165, y: by, z: -0.021, sens: -1, petitRail: true }, laser: { x: 0.165, y: by, z: 0.021, sens: "droite", petitRail: true }, ejection: V3(0.04, 0.055, 0.022),
        mireAvant: 0.14, mireArriere: -0.05, crosse: -0.265, grip: { centre: V3(-0.012, -0.05), axe: V3(0.2, 1, 0).normalize() } };
    },

    // ✍️ PP-19 BIZON : la carcasse emboutie d'un AK, mais un énorme chargeur en TUBE sous le canon (64 balles rangées en
    // spirale), qui sert aussi de poignée ; la crosse en tubes d'acier se replie.
    bizon(e, p) {
      const by = 0.04, N = 0x36383b;
      e.cote([[-0.1, -0.004], [-0.1, 0.05], [0.16, 0.05], [0.16, 0.006], [0.12, -0.004]], 0.038, "metal", N, 0, 0.002);
      e.galet(0.25, 0.024, 0.037, 0.03, 0.054, 0, "metal", 0x393a3d, 0.22); // le couvercle
      e.boite(0.012, 0.012, 0.016, 0.12, 0.04, 0.025, "metal", K.acier); // le levier d'armement
      if (!e.leger) for (const x of [-0.08, 0.12]) for (const s of [-1, 1]) e.boule(0.0025, x, 0.006, s * 0.0195, "metal", K.acier, 6);
      const yr = rail(e, -0.08, 0.13, 0.066, 0);
      e.boite(0.03, 0.02, 0.026, 0.17, 0.06, 0, "metal", N); // la hausse
      e.tube(0.16, 0.36, 0.016, 0.016, by, 0, "metal", N, 14); // le manchon du canon
      e.boite(0.02, 0.03, 0.02, 0.35, by + 0.024, 0, "metal", N); // le guidon
      e.boite(0.003, 0.012, 0.003, 0.35, by + 0.043, 0, "metal", N);
      const L = p.chargeur === "grand" ? 0.34 : 0.27, yc = by - 0.052;
      e.dans("chargeur", () => {
        e.tube(0.03, 0.03 + L, 0.031, 0.031, yc, 0, "poly", 0x2a2a2a, 20);
        e.tour([[0.03 + L, 0.031], [0.04 + L, 0.025], [0.046 + L, 0.012]], yc, 0, "poly", 0x2a2a2a, 20);
        if (!e.leger) for (let x = 0.06; x < 0.03 + L - 0.01; x += 0.022) e.tube(x, x + 0.004, 0.0318, 0.0318, yc, 0, "poly", 0x161616, 20);
        e.boite(0.04, 0.03, 0.03, 0.05, by - 0.022, 0, "poly", 0x2a2a2a);
      });
      poignee(e, "ak", K.noir);
      pontet(e, 0.005, 0.045, 0.0, N);
      if (!crosseSpeciale(e, p, -0.1, by, N)) {
        e.barre([-0.1, 0.04, 0], [-0.38, 0.03, 0], 0.007, "metal", N);
        e.barre([-0.1, -0.002, 0], [-0.38, -0.06, 0], 0.007, "metal", N);
        e.cote([[-0.37, 0.045], [-0.392, 0.045], [-0.392, -0.075], [-0.37, -0.075]], 0.03, "metal", N, 0, 0.003);
      }
      const lc = LONGUEUR_CANON(p.canon, 0.03, 0.1, 0.008);
      canonTube(e, p, 0.36, 0.36 + lc, by, 0.0085);
      const tip = bout(e, p.bouche, 0.36 + lc, by, 0.0085, "ak");
      return { by, tip, ch: { x: 0.12, y: yc, bandeTube: { x: 0.03 + L - 0.03, y: yc, r: 0.032 } }, rail: { xa: -0.075, xb: 0.125, y: yr }, dessous: null,
        garde: { centre: V3(0.2, yc - 0.03), axe: V3(1, 0, 0), sorte: "dessous" },
        lampe: { x: 0.34, y: by, z: -0.016, sens: -1, petitRail: true }, laser: { x: 0.3, y: by + 0.016, z: 0, sens: "haut", petitRail: true }, ejection: V3(0.08, 0.045, 0.021),
        mireNative: { ligne: by + 0.047, arriere: 0.16, z: 0, nom: "hausse et guidon" }, crosse: -0.39 };
    },

    // ✍️ GLOCK 17 : tout carré : la culasse plate, le pontet carré, la poignée très penchée et ses petits carrés anti-glisse,
    // les organes de visée blancs.
    glock17(e, p) {
      const by = 0.03, N = 0x2a2b2c, G = 0x232425;
      e.cote([[-0.03, 0.0], [-0.03, 0.014], [0.15, 0.014], [0.15, 0.0], [0.075, -0.002], [0.07, -0.006], [0.012, 0.0]], 0.028, "poly", G, 0, 0.003);
      e.cote([[0.0, 0.002], [0.07, 0.002], [0.072, -0.034], [0.0, -0.034]], 0.018, "poly", G, 0, 0.003, [[[0.008, -0.004], [0.062, -0.004], [0.062, -0.026], [0.008, -0.026]]]);
      e.cote([[0.008, 0.0], [-0.008, -0.05], [-0.022, -0.105], [-0.058, -0.104], [-0.05, -0.06], [-0.04, -0.012], [-0.05, 0.004], [-0.034, 0.012]], 0.031, "poly", G, 0, 0.006, null, 2);
      if (!e.leger) for (let k = 0; k < 6; k++) for (const s of [-1, 1]) e.boite(0.03, 0.004, 0.002, -0.026 - k * 0.0026, -0.03 - k * 0.011, s * 0.0158, "poly", 0x161616, 0, 0, -0.25);
      e.boite(0.004, 0.02, 0.006, 0.028, -0.012, 0, "metal", K.acier, 0, 0, -0.15); // la détente (avec sa petite sûreté)
      const yb = rail(e, 0.09, 0.145, 0.0, 0, "bas", G);
      e.dans("culasse", () => {
        e.cote([[-0.04, 0.014], [-0.04, 0.046], [0.152, 0.046], [0.158, 0.038], [0.158, 0.014]], 0.026, "metal", N, 0, 0.0025);
        if (!e.leger) {
          for (let k = 0; k < 7; k++) for (const s of [-1, 1]) e.boite(0.003, 0.024, 0.002, -0.034 + k * 0.0055, 0.03, s * 0.0132, "poly", 0x0a0a0a);
          e.boite(0.04, 0.012, 0.002, 0.035, 0.036, 0.0132, "poly", K.fente);
        }
        e.boite(0.01, 0.007, 0.018, -0.032, 0.05, 0, "metal", N);
        e.boite(0.006, 0.006, 0.005, 0.148, 0.049, 0, "metal", N);
        e.boule(0.0014, 0.148, 0.0525, 0, "poly", 0xf0f0f0, 6);
        for (const s of [-1, 1]) e.boite(0.002, 0.004, 0.002, -0.032, 0.0525, s * 0.0052, "poly", 0xf0f0f0);
        e.tube(0.157, 0.16, 0.006, 0.006, by, 0, "poly", K.fente, 10);
      });
      const g = p.chargeur === "grand" ? 0.035 : 0;
      e.dans("chargeur", () => {
        e.cote([[-0.014, -0.099], [-0.058, -0.099], [-0.06, -0.109 - g], [-0.017, -0.109 - g]], 0.026, "poly", 0x1c1c1c, 0, 0.003);
        e.boite(0.046, 0.007, 0.033, -0.038, -0.111 - g, 0, "poly", K.noir, 0, 0, 0.18);
      });
      return { by, tip: 0.16, ch: { x: -0.038, y: -0.111 - g }, rail: null, dessous: { x: 0.12, y: yb }, garde: { centre: V3(-0.018, -0.072, -0.034), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
        lampe: null, laser: null, ejection: V3(0.035, 0.04, 0.014), mireNative: { ligne: 0.054, arriere: -0.032, z: 0, nom: "points blancs" }, glissiere: { x: 0.035, y: 0.046 }, bout: { x: 0.16, y: by, r: 0.006 },
        grip: { centre: V3(-0.03, -0.05), axe: V3(0.3, 1, 0).normalize() }, crosse: -0.05 };
    },

    // ✍️ DESERT EAGLE : ÉNORME, en acier brillant : la longue glissière, le canon TRIANGULAIRE avec son rail sur le dessus, le
    // chien à l'arrière et la grosse poignée en caoutchouc.
    deagle(e, p) {
      const by = 0.034, A = 0x8d9096, A2 = 0x6f7278, N = 0x262626;
      e.cote([[-0.035, 0.0], [-0.035, 0.016], [0.2, 0.016], [0.2, 0.0], [0.09, -0.002], [0.08, -0.008], [0.014, 0.0]], 0.03, "metal", A2, 0, 0.003);
      e.cote([[0.0, 0.002], [0.08, 0.002], [0.085, -0.012], [0.068, -0.04], [0.0, -0.042]], 0.018, "metal", A2, 0, 0.003, [[[0.008, -0.004], [0.07, -0.004], [0.072, -0.012], [0.06, -0.032], [0.008, -0.034]]]);
      e.cote([[0.008, 0.0], [-0.004, -0.05], [-0.016, -0.115], [-0.062, -0.118], [-0.058, -0.07], [-0.048, -0.014], [-0.056, 0.004], [-0.038, 0.014]], 0.037, "poly", N, 0, 0.007, null, 2);
      if (!e.leger) for (let k = 0; k < 5; k++) for (const s of [-1, 1]) e.boite(0.034, 0.005, 0.002, -0.03 - k * 0.0025, -0.035 - k * 0.015, s * 0.0188, "poly", 0x101010, 0, 0, -0.2);
      e.boite(0.004, 0.022, 0.006, 0.03, -0.014, 0, "metal", K.acier, 0, 0, -0.25);
      e.boite(0.012, 0.016, 0.012, -0.046, 0.042, 0, "metal", A2, 0, 0, 0.4); // le chien
      e.dans("culasse", () => {
        e.cote([[-0.044, 0.016], [-0.044, 0.05], [0.128, 0.05], [0.128, 0.016]], 0.03, "metal", A, 0, 0.003);
        if (!e.leger) for (let k = 0; k < 8; k++) for (const s of [-1, 1]) e.boite(0.003, 0.026, 0.002, -0.038 + k * 0.005, 0.033, s * 0.0152, "poly", 0x3a3c40);
        e.boite(0.012, 0.018, 0.022, -0.036, 0.059, 0, "metal", N); // la hausse
      });
      // le canon triangulaire et son rail
      e.cote([[0.128, 0.016], [0.128, 0.056], [0.25, 0.056], [0.256, 0.05], [0.256, 0.022], [0.25, 0.016]], 0.024, "metal", A, 0, 0.004);
      for (const s of [-1, 1]) e.boite(0.12, 0.024, 0.006, 0.19, 0.046, s * 0.009, "metal", A, s * 0.5);
      const yr = rail(e, 0.135, 0.245, 0.056, 0, "haut", A2);
      e.boite(0.006, 0.008, 0.004, 0.24, yr + 0.004, 0, "metal", N); // le guidon
      if (!e.leger) for (const x of [0.15, 0.19, 0.23]) for (const s of [-1, 1]) e.boite(0.022, 0.006, 0.002, x, 0.028, s * 0.0121, "poly", 0x30323a);
      e.tube(0.256, 0.258, 0.008, 0.008, by, 0, "poly", K.fente, 12);
      const g = p.chargeur === "grand" ? 0.035 : 0;
      e.dans("chargeur", () => {
        e.cote([[-0.016, -0.11], [-0.06, -0.11], [-0.064, -0.12 - g], [-0.018, -0.12 - g]], 0.03, "metal", 0x4a4c50, 0, 0.003);
        e.boite(0.05, 0.008, 0.036, -0.041, -0.122 - g, 0, "metal", A2, 0, 0, 0.12);
      });
      return { by, tip: 0.258, ch: { x: -0.041, y: -0.122 - g }, rail: null, dessous: null, garde: { centre: V3(-0.02, -0.08, -0.038), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
        lampe: null, laser: null, ejection: V3(0.04, 0.045, 0.016), mireNative: { ligne: yr + 0.008, arriere: -0.042, z: 0, nom: "hausse et guidon" }, glissiere: { x: 0.03, y: 0.05 }, bout: { x: 0.258, y: by, r: 0.008 },
        grip: { centre: V3(-0.032, -0.055), axe: V3(0.28, 1, 0).normalize() }, crosse: -0.06 };
    },

    // ✍️ MR73 : le revolver des gendarmes français : le BARILLET à 6 coups (on voit le culot des balles derrière), le canon
    // rond avec sa bande sur le dessus, le chien, et la poignée en bois.
    mr73(e, p) {
      const by = 0.04, A = 0x2b2e33, A2 = 0x3a3d42, L = 0.1;
      e.cote([[-0.045, 0.0], [-0.045, 0.062], [-0.01, 0.066], [0.07, 0.066], [0.076, 0.06], [0.076, 0.004], [0.06, -0.006], [0.02, -0.006], [0.012, 0.0]], 0.03, "metal", A, 0, 0.003,
        [[[-0.008, 0.014], [0.062, 0.014], [0.062, 0.06], [-0.008, 0.06]]]);
      // le barillet : 6 chambres, des cannelures, et le culot des balles (de la couleur des munitions spéciales)
      e.tube(-0.006, 0.058, 0.0215, 0.0215, by, 0, "metal", A2, 24);
      const culot = COULEUR_MUNITIONS[p.munitions] || K.laiton;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
        if (!e.leger) e.boite(0.042, 0.0045, 0.006, 0.028, by + Math.sin(a) * 0.0205, Math.cos(a) * 0.0205, "metal", 0x202225, a);
        e.tube(-0.009, -0.006, 0.0048, 0.0048, by + Math.sin(a + Math.PI / 6) * 0.012, Math.cos(a + Math.PI / 6) * 0.012, "metal", culot, 10);
      }
      // le canon, sa bande et la protection de la tige d'éjection
      e.tube(0.076, 0.076 + L, 0.0085, 0.0085, by, 0, "metal", A, 16);
      e.boite(L, 0.008, 0.009, 0.076 + L / 2, by + 0.011, 0, "metal", A);
      e.tube(0.076, 0.076 + L * 0.6, 0.0062, 0.0062, by - 0.015, 0, "metal", A, 12);
      e.cote([[0.076 + L - 0.022, by + 0.015], [0.076 + L, by + 0.015], [0.076 + L, by + 0.029]], 0.004, "metal", A, 0, 0.001); // le guidon
      e.tube(0.076 + L, 0.078 + L, 0.006, 0.006, by, 0, "poly", K.fente, 12);
      e.boite(0.016, 0.008, 0.014, -0.03, 0.07, 0, "metal", A); // la hausse
      e.boite(0.012, 0.026, 0.008, -0.052, 0.058, 0, "metal", A, 0, 0, 0.55); // le chien
      e.cote([[0.0, 0.0], [-0.012, -0.04], [-0.02, -0.1], [-0.06, -0.104], [-0.062, -0.06], [-0.052, -0.01], [-0.046, 0.0]], 0.036, "bois", null, 0, 0.008, null, 3);
      pontet(e, 0.004, 0.05, 0.0, A);
      return { by, tip: 0.078 + L, ch: null, rail: null, dessous: null, garde: { centre: V3(-0.02, -0.07, -0.036), axe: V3(0.55, 1, 0.25).normalize(), sorte: "pistolet" },
        lampe: null, laser: null, ejection: null, mireNative: { ligne: by + 0.032, arriere: -0.036, z: 0, nom: "hausse et guidon" }, glissiere: { x: 0.03, y: 0.066 }, bout: { x: 0.078 + L, y: by, r: 0.0075 },
        munitionsVisibles: true, grip: { centre: V3(-0.03, -0.05), axe: V3(0.25, 1, 0).normalize() }, crosse: -0.06 };
    },
  };
  // ✍️ LES FUSILS À POMPE (« qu'ils soient assez beaux et réalistes ») : le M870 (façon Remington 870) et sa version
  // « Dragon » aux cartouches incendiaires. Un boîtier en acier, un long canon avec son guidon-bille, le MAGASIN TUBULAIRE
  // sous le canon (les cartouches y sont rangées l'une derrière l'autre), la POMPE (le garde-main qui glisse : elle est
  // dans le groupe « culasse », c'est elle qui recule et revient après chaque tir, avec ses 2 barres d'action), la
  // crosse. Sur le flanc gauche, une cartouchière (« side saddle ») avec des cartouches de rechange : rouges pour le M870,
  // ORANGE vif pour le Dragon (qui a aussi une crosse en polymère noir et des bandes orange sur la pompe).
  function fusilPompe(e, p, dragon) {
    const by = 0.03, A = 0x2c2e31, Bx = dragon ? K.noir : null, matCrosse = dragon ? "poly" : "bois";
    const ORANGE = 0xe0661c, ROUGE = 0x8a1c14;
    // le BOÎTIER (l'acier bronzé), la fenêtre d'éjection à droite, la fenêtre de chargement dessous
    e.cote([[-0.085, -0.018], [-0.085, 0.036], [-0.07, 0.048], [0.125, 0.048], [0.132, 0.04], [0.132, -0.012], [0.12, -0.02], [0.03, -0.02], [0.0, -0.018]], 0.038, "metal", A, 0, 0.004, null, 2);
    e.boite(0.07, 0.022, 0.002, 0.045, 0.026, 0.0192, "poly", K.fente); // la fenêtre d'éjection
    e.boite(0.075, 0.002, 0.026, 0.07, -0.0205, 0, "poly", K.fente); // la fenêtre de chargement (dessous)
    e.cyl(0.0045, 0.0045, 0.044, 0.025, -0.008, 0, "metal", K.acier, 10, Math.PI / 2); // la sûreté (un bouton qui traverse)
    e.boite(0.016, 0.008, 0.006, 0.105, -0.012, -0.0205, "metal", K.acier); // le bouton qui libère la pompe
    if (!e.leger) for (const x of [-0.06, 0.1]) for (const z of [-1, 1]) e.boule(0.0028, x, 0.012, z * 0.0192, "metal", K.acier, 6); // les goupilles
    const yr = rail(e, -0.06, 0.115, 0.048, 0);
    // le PONTET et la DÉTENTE
    pontet(e, -0.005, 0.055, -0.016, A);
    // la CROSSE : d'origine, en bois verni (M870) ou en polymère noir (Dragon), avec une poignée « col de cygne » et une plaque de couche
    if (!crosseSpeciale(e, p, -0.085, by, dragon ? K.noir : undefined)) {
      e.cote([[-0.083, 0.04], [-0.083, -0.014], [-0.1, -0.032], [-0.13, -0.065], [-0.17, -0.078], [-0.42, -0.1], [-0.435, -0.098], [-0.435, 0.046], [-0.42, 0.05], [-0.16, 0.042]], 0.04, matCrosse, Bx, 0, 0.007, null, 3);
      e.boite(0.016, 0.152, 0.044, -0.443, -0.026, 0, "poly", K.caoutchouc); // la plaque de couche en caoutchouc
      if (!e.leger) for (let k = 0; k < 4; k++) e.boite(0.0165, 0.003, 0.0445, -0.443, -0.085 + k * 0.035, 0, "poly", 0x141414);
      e.disque(0.008, 0.042, -0.36, -0.08, 0, "metal", K.acier, 12); // l'anneau de la sangle
      if (dragon && !e.leger) for (const zz of [-1, 1]) e.boite(0.06, 0.03, 0.002, -0.27, -0.03, zz * 0.0205, "poly", 0x1c1c1c); // le quadrillage
    } else poignee(e, "ar", K.noir, -0.01, -0.016);
    // le CANON (long : un fusil à pompe tire des plombs, pas une balle) et son guidon-bille
    const lc = LONGUEUR_CANON(p.canon, 0.47, 0.56, 0.33);
    canonTube(e, p, 0.13, 0.13 + lc, by, 0.0118);
    e.tube(0.13 + lc - 0.004, 0.13 + lc, 0.0085, 0.0085, by, 0, "poly", K.fente, 14); // l'âme du canon (le trou)
    e.boule(0.0032, 0.13 + lc - 0.02, by + 0.014, 0, "metal", dragon ? 0xff8a2a : 0xd8d0b8, 8); // le guidon-bille
    if (!e.leger) e.boite(lc * 0.9, 0.003, 0.006, 0.13 + lc * 0.5, by + 0.0125, 0, "metal", A); // la bande ventilée du dessus
    // le MAGASIN TUBULAIRE sous le canon, son bouchon et le collier qui le tient au canon
    const L = p.chargeur === "grand" ? 0.47 : 0.36, yt = by - 0.026, xt = 0.132;
    e.dans("chargeur", () => {
      e.tube(xt, xt + L, 0.0112, 0.0112, yt, 0, "metal", A, 16);
      e.tour([[xt + L, 0.012], [xt + L + 0.012, 0.012], [xt + L + 0.018, 0.009], [xt + L + 0.02, 0.003]], yt, 0, "metal", A, 16); // le bouchon
    });
    e.boite(0.02, 0.04, 0.026, xt + L - 0.02, by - 0.013, 0, "metal", A); // le collier canon-magasin
    // la POMPE : elle glisse sur le magasin (groupe « culasse ») ; ses 2 barres d'action vont jusqu'au boîtier
    const xp = 0.25, lp = 0.16;
    e.dans("culasse", () => {
      if (dragon) e.cote([[xp - lp / 2, yt + 0.02], [xp + lp / 2, yt + 0.02], [xp + lp / 2 + 0.006, yt + 0.008], [xp + lp / 2 + 0.006, yt - 0.016], [xp + lp / 2 - 0.01, yt - 0.024], [xp - lp / 2 + 0.01, yt - 0.024], [xp - lp / 2, yt - 0.014]], 0.044, "poly", K.noir, 0, 0.007, null, 2);
      else e.galet(lp, 0.044, 0.046, xp, yt - 0.002, 0, "bois", null, 0.3, 18);
      if (!e.leger) for (let k = 0; k < 9; k++) for (const zz of [-1, 1]) e.boite(0.006, 0.026, 0.003, xp - lp / 2 + 0.03 + k * 0.012, yt - 0.003, zz * (dragon ? 0.0225 : 0.0222), "poly", dragon ? 0x161616 : 0x3a1e0c); // les rainures (pour ne pas glisser)
      if (dragon) for (const x of [xp - lp / 2 + 0.012, xp + lp / 2 - 0.012]) e.tube(x - 0.005, x + 0.005, 0.0235, 0.0235, yt - 0.002, 0, "poly", ORANGE, 18); // les bandes ORANGE
      for (const zz of [-1, 1]) e.boite(0.08, 0.005, 0.003, 0.14, yt + 0.006, zz * 0.0145, "metal", K.acier); // les barres d'action
    });
    // la CARTOUCHIÈRE sur le flanc gauche, avec ses cartouches (le culot en laiton vers le bas)
    e.boite(0.09, 0.05, 0.006, 0.05, 0.012, -0.022, "poly", 0x1e1f21);
    for (let k = 0; k < 5; k++) {
      const x = 0.014 + k * 0.018;
      e.cyl(0.0078, 0.0078, 0.05, x, 0.019, -0.031, "poly", dragon ? ORANGE : ROUGE, 12);
      e.cyl(0.0082, 0.0082, 0.012, x, -0.01, -0.031, "metal", K.laiton, 12);
    }
    return { by, tip: 0.13 + lc, ch: { x: 0.07, y: yt, bandeTube: { x: xt + L - 0.03, y: yt, r: 0.0112 } }, rail: { xa: -0.055, xb: 0.11, y: yr }, dessous: null,
      garde: { centre: V3(xp, yt - 0.026), axe: V3(1, 0, 0), sorte: "dessous" },
      lampe: { x: xt + L - 0.03, y: by - 0.012, z: -0.022, sens: -1, petitRail: true }, laser: { x: xt + L - 0.07, y: by - 0.012, z: 0.022, sens: "droite", petitRail: true },
      ejection: V3(0.045, 0.026, 0.02), mireAvant: 0.13 + lc - 0.02, mireArriere: 0.0, mireNative: { ligne: by + 0.017, arriere: -0.02, z: 0, nom: "guidon-bille" }, crosse: -0.44,
      grip: p.crosse === "standard" ? { centre: V3(-0.115, -0.05), axe: V3(0.55, 1, 0).normalize() } : null };
  }
  FABRIQUES.m870 = (e, p) => fusilPompe(e, p, false);
  FABRIQUES.m870dragon = (e, p) => fusilPompe(e, p, true);

  const FAMILLES_FUSIL = ["fusil", "pm", "precision"];

  // Le M320 : le lance-grenades sous le canon (le gadget de l'Assaut).
  function lanceGrenades(e, x, y) {
    e.tube(x - 0.2, x, 0.023, 0.023, y - 0.03, 0, "metal", 0x3e3f3b, 18);
    e.tube(x - 0.005, x + 0.002, 0.019, 0.019, y - 0.03, 0, "poly", K.fente, 16);
    e.boite(0.09, 0.05, 0.05, x - 0.22, y - 0.032, 0, "poly", K.noir);
    e.boite(0.18, 0.012, 0.03, x - 0.11, y - 0.004, 0, "metal", K.noir);
    poignee(e, "droite", K.noir, x - 0.24, y - 0.057);
    e.boite(0.04, 0.004, 0.01, x - 0.22, y - 0.088, 0, "metal", K.noir);
    e.boite(0.03, 0.026, 0.004, x - 0.13, y - 0.012, -0.026, "metal", K.noir); // la hausse sur le côté
    return { centre: V3(x - 0.27, y - 0.11), axe: V3(0.2, 1, 0).normalize(), sorte: "vertical" };
  }

  // ------------------------------------------------------------------ LE MAGASIN : fabriquer (une fois) et ranger
  const vides = () => { const r = {}; for (const emp in C.atelier) r[emp] = C.atelier[emp].pieces[0].id; return r; };
  // (demande 97) seulement les emplacements et les pièces qui existent sur CETTE arme (le quartier-maître les connaît)
  function normaliser(id, pieces) {
    const r = vides(), EQ = Tanks.Equipement;
    if (pieces) for (const emp of EQ.emplacementsDe(id)) if (EQ.piecesDe(id, emp).some((x) => x.id === pieces[emp])) r[emp] = pieces[emp];
    return r;
  }
  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];
  const nomPiece = (emp, id) => (C.atelier[emp].pieces.find((x) => x.id === id) || C.atelier[emp].pieces[0]).nom;
  const cleDe = (id, pieces, qualite, lg) => [id, qualite, lg ? "lg" : ""].concat(Object.keys(C.atelier).map((emp) => pieces[emp])).join(":");
  const magasin = new Map();
  function jeter(m) {
    m.racine.traverse((o) => o.isMesh && o.geometry.dispose());
    bilan.jetes = (bilan.jetes || 0) + 1;
  }

  function fabriquer(id, piecesBrutes, qualite, options) {
    options = options || {};
    const F = fiche(id) || C.armesPrincipales.ar4;
    if (!fiche(id)) id = "ar4";
    const pieces = normaliser(id, piecesBrutes);
    const cle = cleDe(id, pieces, qualite, options.lanceGrenades);
    if (magasin.has(cle)) {
      const m = magasin.get(cle);
      if (magasin.size > 40) (magasin.delete(cle)), magasin.set(cle, m); // (le plus récemment servi passe au bout de la file)
      return m;
    }
    const t0 = performance.now();
    // (demande 97) la PEINTURE : seulement sur les belles armes (la tienne, celles du menu) ; pas sur les soldats de l'ordinateur
    const peinture = qualite === "beau" && pieces.peinture !== "aucune" ? pieces.peinture : null;
    const e = etabli(qualite, peinture), famille = F.famille, liste = [], ancres = {};
    const P = FABRIQUES[id](e, pieces);
    e.peindre = false; // (les accessoires vissés ensuite ne sont pas peints)
    // ---- le VISEUR
    let visee = P.mireNative ? Object.assign({}, P.mireNative) : null;
    const v = pieces.viseur, lunetteNative = P.lunetteNative && (v === "mire" || v === "pointRouge" || v === "holo");
    const railY = P.rail ? P.rail.y : 0;
    if (P.rail && P.rail.griffe && v !== "mire") { // la griffe du MP5 : une monture qui porte un petit rail
      e.boite(0.13, 0.024, 0.03, (P.rail.xa + P.rail.xb) / 2, P.by + 0.05, 0, "metal", K.noir);
      rail(e, P.rail.xa, P.rail.xb, P.by + 0.062, 0);
    }
    if (famille === "roquettes") {
      if (v !== "mire" && P.bracket) { // un support sur le côté gauche du tube, qui porte le viseur
        const b = P.bracket;
        e.boite(0.03, 0.03, Math.abs(b.z) + 0.02, b.x, b.y - 0.01, b.z / 2, "metal", K.noir);
        const yb = rail(e, b.x - 0.06, b.x + 0.06, b.y + 0.006, b.z);
        visee = (VISEURS[v] && v !== "lunette" && v !== "lunette8" ? VISEURS[v] : (ee, x, y, z) => lunette(ee, x, y, z, { long: 0.22, obj: 0.022 }))(e, b.x, yb, b.z);
        liste.push("support de viseur sur le côté");
      }
    } else if (famille === "pistolet") {
      if (v === "pointRouge" && P.glissiere) e.dans("culasse", () => (visee = miniPointRouge(e, P.glissiere.x, P.glissiere.y))); // (il recule avec la culasse !)
    } else if (lunetteNative) {
      visee = P.lunetteNative(e, railY);
      if (v === "pointRouge" || v === "holo") { // un petit point rouge posé SUR la lunette, pour tirer de près
        const x = P.rail.xa + 0.2, yc = visee.ligne + 0.024;
        e.boite(0.04, 0.01, 0.026, x, yc - 0.004, 0, "metal", K.noir);
        e.galet(0.044, 0.026, 0.03, x, yc + 0.01, 0, "metal", 0x36383b, 0.3);
        e.boite(0.002, 0.016, 0.022, x + 0.012, yc + 0.014, 0, "vitre");
        e.boule(0.001, x + 0.012, yc + 0.014, 0, "lumiere", 0xff1a0a, 6);
        liste.push("mini point rouge sur la lunette");
      }
    } else if (P.rail && (v !== "mire" || !visee)) {
      const xr = P.rail.xa;
      if (VISEURS[v]) visee = VISEURS[v](e, xr + DECALAGE_VISEUR[v], railY);
      else if (!P.integre) visee = mire(e, P.mireArriere !== undefined ? P.mireArriere : xr + 0.015, P.mireAvant !== undefined ? P.mireAvant : P.rail.xb - 0.02, railY);
    }
    if (P.integre && (v === "mire" || !visee)) { // le viseur intégré du P90
      // le boîtier du viseur : un socle, deux joues et un toit, avec une vitre (on regarde À TRAVERS, vers l'avant)
      e.cote([[0.06, 0.087], [0.064, 0.108], [0.124, 0.108], [0.135, 0.087]], 0.034, "poly", 0x3e4433, 0, 0.005);
      for (const zz of [-0.0145, 0.0145]) e.cote([[0.066, 0.106], [0.07, 0.134], [0.116, 0.134], [0.124, 0.106]], 0.006, "poly", 0x3e4433, zz, 0.002);
      e.boite(0.05, 0.005, 0.035, 0.094, 0.136, 0, "poly", 0x3e4433);
      e.boite(0.002, 0.024, 0.024, 0.1, 0.121, 0, "vitre");
      e.anneau(0.0055, 0.0005, 0.099, 0.121, 0, "lumiere", 0xff3010);
      e.boule(0.0007, 0.099, 0.121, 0, "lumiere", 0xff3010, 6);
      visee = { ligne: 0.121, arriere: 0.066, z: 0, nom: "viseur intégré" };
    }
    if (!visee) visee = { ligne: P.by + 0.04, arriere: 0, z: 0, nom: "—" };
    liste.push("viseur : " + visee.nom);
    ancres.viseur = V3(visee.arriere + 0.055, visee.ligne + 0.006, visee.z || 0);
    // ---- la BOUCHE des pistolets (celle des autres armes est vissée par l'arme elle-même, au bout de son canon)
    let tip = P.tip;
    if (famille === "pistolet" && pieces.bouche !== "aucune" && P.bout) tip = bout(e, pieces.bouche, P.bout.x, P.bout.y, P.bout.r, "pistolet");
    // ---- la POIGNÉE de devant (sauf sous un lance-grenades, et pas sur les lance-roquettes ni le pistolet)
    let garde = P.garde;
    if (options.lanceGrenades && P.dessous && FAMILLES_FUSIL.includes(famille)) garde = lanceGrenades(e, P.dessous.x + 0.07, P.dessous.y + 0.01), liste.push("lance-grenades M320 sous le canon");
    else if (pieces.poignee !== "aucun" && P.dessous && FAMILLES_FUSIL.includes(famille)) {
      // (un petit rail sous le garde-main, si l'arme n'en a pas déjà un)
      const y = P.dessous.rail ? P.dessous.y : rail(e, P.dessous.x - 0.035, P.dessous.x + 0.035, P.dessous.y, 0, "bas");
      garde = poigneeAvant(e, pieces.poignee, P.dessous.x + (pieces.poignee === "bipied" ? 0.05 : 0), y);
    }
    ancres.poignee = P.dessous ? V3(P.dessous.x, P.dessous.y - 0.035, 0) : garde.centre.clone();
    // ---- la LAMPE et le LASER
    let pLampe = null, pLaser = null;
    if (pieces.lampe !== "aucune" && P.lampe) {
      const L = P.lampe;
      if (L.petitRail) rail(e, L.x - 0.07, L.x - 0.005, L.y, L.z, "gauche");
      pLampe = lampe(e, pieces.lampe, L.x, L.y, L.petitRail ? L.z - 0.01 : L.z, -1);
    }
    if (pieces.laser !== "aucun" && P.laser) {
      const L = P.laser, couleur = C.atelier.laser.pieces.find((x) => x.id === pieces.laser).effets.laser;
      let y = L.y, z = L.z;
      if (L.petitRail && L.sens === "haut") y = rail(e, L.x - 0.04, L.x + 0.04, L.y, 0);
      if (L.petitRail && L.sens === "droite") (z = rail(e, L.x - 0.04, L.x + 0.04, L.y, L.z, "droite"));
      pLaser = laser(e, couleur, L.x, y, z, L.sens);
    }
    ancres.lampe = pLampe ? pLampe.clone().add(V3(-0.04, 0, 0)) : P.lampe ? V3(P.lampe.x - 0.04, P.lampe.y, P.lampe.z) : null;
    ancres.laser = pLaser ? pLaser.clone().add(V3(-0.035, 0, 0)) : P.laser ? V3(P.laser.x, P.laser.y + (P.laser.sens === "haut" ? 0.01 : 0), P.laser.z) : null;
    // ---- (demande 97) les MUNITIONS spéciales : une bande de couleur sur le chargeur (cuivre, rouge ou vert)
    const ch = P.ch, b = ch && ch.bande, bt = ch && ch.bandeTube;
    if (pieces.munitions !== "standard" && !P.munitionsVisibles && ch) {
      const col = COULEUR_MUNITIONS[pieces.munitions];
      e.dans("chargeur", () => {
        if (bt) e.tube(bt.x - 0.008, bt.x + 0.008, bt.r + 0.0012, bt.r + 0.0012, bt.y, 0, "poly", col, 20);
        else if (b) e.boite(b.p * 1.06, b.h || 0.013, b.w + 0.004, b.x, b.y, b.z || 0, "poly", col, 0, 0, b.a || 0);
        else e.boite(0.05, 0.006, 0.037, ch.x, ch.y - 0.007, 0, "poly", col);
      });
    }
    ancres.munitions = bt ? V3(bt.x, bt.y, 0) : b ? V3(b.x, b.y, b.z || 0) : ch ? V3(ch.x, ch.y + 0.01, 0) : P.munitionsVisibles ? V3(-0.01, P.by, 0.012) : null;
    ancres.chargeur = ch ? V3(ch.x, ch.y + (bt ? 0 : 0.035), 0) : null;
    // ---- les autres points de l'arme (pour les traits de l'armurerie)
    const dc = e.dernierCanon;
    ancres.canon = dc ? V3(dc.xa + (dc.xb - dc.xa) * 0.55, dc.y, dc.z) : null;
    ancres.bouche = V3(tip - 0.012, P.bout ? P.bout.y : P.by, P.tipZ || 0);
    ancres.crosse = pieces.crosse === "repliable" && e.crossePos ? V3(e.crossePos.x + 0.12, e.crossePos.y - 0.02, -0.035) : V3((P.crosse || -0.2) + 0.07, P.by - 0.03, 0);
    ancres.peinture = V3((P.crosse || -0.2) * 0.25, P.by - 0.012, 0.024);
    // la liste des pièces visibles (l'aperçu et « sous le capot »)
    for (const emp of Tanks.Equipement.emplacementsDe(id)) if (emp !== "viseur" && emp !== "assistance" && pieces[emp] !== C.atelier[emp].pieces[0].id) liste.push(C.atelier[emp].icone + " " + nomPiece(emp, pieces[emp]));
    // ---- on soude, matière par matière, et on range
    const groupes = e.fin(), racine = new THREE.Group();
    let tri = 0, objets = 0;
    for (const nom of ["corps", "chargeur", "culasse"]) {
      const g = groupes[nom];
      if (!g.children.length) continue;
      for (const m of OT.souder(g, true)) {
        const mp = m.material.userData.peinture;
        if (qualite === "beau" && (mp || m.material === M.poly || m.material === M.metal || m.material === M.bois)) uvAPlat(m.geometry, mp ? 2.6 : m.material === M.bois ? 1.2 : 9, mp ? 2.6 : m.material === M.bois ? 3.5 : 9);
        tri += m.geometry.attributes.position.count / 3;
        objets++;
      }
      g.name = nom;
      racine.add(g);
    }
    const grip = P.grip || { centre: V3(-0.026, -0.05), axe: V3(0.34, 0.94, 0).normalize() };
    const modele = {
      cle, id, qualite, nom: F.nom, famille, pieces, liste, racine, triangles: Math.round(tri), objets, peinture,
      by: P.by, bouche: V3(tip, P.bout ? P.bout.y : P.by, P.tipZ || 0), visee, poignee: grip, garde, lampe: pLampe, laser: pLaser, ancres,
      ejection: P.ejection, chargeur: P.ch, arriere: P.arriere !== undefined ? P.arriere : P.crosse, decalageVue: P.vue || null,
    };
    magasin.set(cle, modele);
    // (demande 97) l'armurerie fabrique beaucoup de variantes : au-delà de 48 modèles, on jette les plus vieux (sauf ceux
    // qu'on voit : l'arme de la vitrine, celle de la vue à la 1re personne, celle de ton soldat, et ceux des soldats de l'ordinateur)
    if (magasin.size > 48) for (const [k, m] of magasin) {
      if (magasin.size <= 40) break;
      if (m === VI.modele || m === V.modele || (armeDuJoueur && armeDuJoueur.modele === m) || m.qualite !== "beau" || m === modele) continue;
      jeter(m);
      magasin.delete(k);
    }
    bilan.modeles = magasin.size;
    bilan.ms += performance.now() - t0;
    return modele;
  }
  // Un EXEMPLAIRE d'un modèle (il partage les formes et les matières du modèle : ça ne coûte presque rien).
  function exemplaire(modele) {
    const o = modele.racine.clone();
    o.userData.modele = modele;
    o.traverse((x) => x.isMesh && (x.castShadow = true));
    return o;
  }

  // ------------------------------------------------------------------ QUI TIENT QUOI ?
  // Les soldats de l'ordinateur : une arme tirée au sort selon leur NOM (toujours la même pour un même soldat).
  function hacher(texte, sel) {
    let h = 2166136261 ^ (sel || 0);
    for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
    return ((h >>> 0) % 100000) / 100000;
  }
  const tirer = (liste, x) => { const total = liste.reduce((t, [, p]) => t + p, 0); let k = x * total; for (const [v, p] of liste) if ((k -= p) < 0) return v; return liste[0][0]; };
  const choixIA = new Map();
  function armeIA(nom, equipe, roquettes) {
    const cle = nom + ":" + equipe + ":" + (roquettes ? 1 : 0);
    if (choixIA.has(cle)) return choixIA.get(cle);
    const I = A3.ia, id = tirer(roquettes ? I.roquettes : I[equipe] || I.bleus, hacher(nom, 1));
    // ses pièces : une des 4 « versions » de cette arme (pas une par soldat : le magasin reste petit, et 30 soldats avec
    // la même version partagent la même forme)
    const pieces = vides(), version = Math.floor(hacher(nom, 3) * 4);
    if (!roquettes) for (const emp of ["viseur", "canon", "bouche", "chargeur", "poignee"]) pieces[emp] = tirer(I[emp], hacher(id + ":" + version + ":" + emp, 11)); // (demande 97 : les nouveaux emplacements)
    const c = { id, pieces, version };
    choixIA.set(cle, c);
    return c;
  }
  // Pour un soldat : quelle arme, avec quelles pièces, et en quelle qualité ?
  const memoire = new WeakMap(); // soldat → ses modèles déjà trouvés (pour ne pas refaire la recherche à chaque image)
  function pourSoldat(s, pres) {
    const qualite = s.joueur ? "beau" : pres ? "jeu" : "simple";
    let m = memoire.get(s);
    if (!m) memoire.set(s, (m = {}));
    const enMain = s.armes ? (s.arme === "pistolet" ? s.armes.pistolet : s.armes.principale) : null;
    const signe = enMain ? enMain.id + ":" + (s.gadget && s.gadget.id) : (s.roquettesIA ? "R" : "") + s.arme, pieces = enMain ? enMain.pieces : null;
    if (m.signe !== signe || m.pieces !== pieces) (m.beau = m.jeu = m.simple = null), (m.signe = signe), (m.pieces = pieces);
    return m[qualite] || (m[qualite] = trouverPourSoldat(s, qualite));
  }
  function trouverPourSoldat(s, qualite) {
    let id, pieces, lg = false;
    if (s.armes) { // toi : ton équipement exact
      const enMain = s.arme === "pistolet" ? s.armes.pistolet : s.armes.principale;
      id = enMain.id;
      pieces = enMain.pieces;
      lg = s.gadget && s.gadget.id === "lanceGrenades";
    } else {
      const c = armeIA(s.nom || "?", s.equipe, !!s.roquettesIA || s.arme === "roquettes");
      id = c.id;
      pieces = c.pieces;
    }
    const m = fabriquer(id, pieces, qualite, { lanceGrenades: lg });
    bilan.soldatsArmes[m.nom] = true;
    return m;
  }
  // La famille de son d'un tireur (affichage/sons.js) : d'après son arme.
  function sonDe(e, monde) {
    if (!monde) return "fusil";
    let s = null;
    if (e.parToi && monde.toi && monde.toi.soldat && monde.toi.mode === "pied") s = monde.toi.soldat;
    else for (const o of monde.soldats) if (o.nom === e.tireur && o.equipe === e.equipeTireur) { s = o; break; }
    if (!s) return "ak"; // (une mitrailleuse de véhicule)
    let id, pieces;
    if (s.armes) { const A = s.arme === "pistolet" ? s.armes.pistolet : s.armes.principale; id = A.id; pieces = A.pieces || {}; }
    else { const c = armeIA(s.nom || "?", s.equipe, !!s.roquettesIA); id = c.id; pieces = c.pieces; }
    if (pieces.bouche === "silencieux") return "silencieux"; // (demande 97 : le silencieux est dans la « bouche »)
    const F = fiche(id);
    if (!F) return "fusil";
    if (id === "barrett") return "lourd";
    if (id === "ak12" || id === "bizon" || id === "scarh" || id === "mk14") return "ak";
    if (id === "deagle" || id === "mr73") return "precision"; // (les gros calibres de poing claquent fort)
    return { pistolet: "pistolet", pm: "pm", fusil: "fusil", precision: "precision", pompe: "pompe" }[F.famille] || "fusil";
  }

  // ------------------------------------------------------------------ (demande 97) LA VITRINE DE L'ARMURERIE
  // Un petit STUDIO PHOTO : sa propre carte graphique (un « WebGLRenderer » à part), une lumière douce au-dessus, une
  // lumière orange sur le côté, une lumière bleutée derrière (pour détacher le bord de l'arme du fond sombre), et une
  // ombre douce dessous. La caméra TOURNE autour de l'arme : à la souris (on la fait glisser), au doigt, à la molette
  // (ou en pinçant) pour zoomer ; sans rien toucher pendant quelques secondes, l'arme se balance doucement de profil.
  // À chaque image, la vitrine dit au menu où se trouve chaque pièce sur l'écran (« ancres ») : il trace les traits.
  const VU = C.menu.vue;
  const VI = { rendu: null, scene: null, cam: null, objet: null, cle: null, modele: null, actif: false, avant: 0, toile: null, boite: null,
    lacet: VU.depart, tangage: VU.hauteur, zoom: 1, touche: -99, t: 0, doigts: new Map(), pince: 0, surImage: null, centre: new THREE.Vector3(), long: 0.5, haut: 0.2, images: 0 };
  function preparerVitrine() {
    if (VI.rendu) return;
    VI.boite = document.createElement("div");
    VI.boite.className = "ar-vitrine-3d";
    VI.boite.style.cssText = "position:absolute;inset:0;touch-action:none;cursor:grab";
    VI.toile = document.createElement("canvas");
    VI.toile.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    VI.boite.append(VI.toile);
    VI.rendu = new THREE.WebGLRenderer({ canvas: VI.toile, antialias: true, alpha: true });
    VI.rendu.outputColorSpace = THREE.SRGBColorSpace;
    VI.rendu.toneMapping = THREE.ACESFilmicToneMapping;
    VI.rendu.toneMappingExposure = 1.35;
    VI.scene = new THREE.Scene();
    const studio = new THREE.Scene(), boule = new THREE.Mesh(new THREE.SphereGeometry(10, 24, 12), new THREE.MeshBasicMaterial({ color: 0x24262a, side: THREE.BackSide }));
    studio.add(boule);
    for (const [x, y, z, l, h, c] of [[0, 8, 0, 10, 6, 0xffffff], [-8, 3, 4, 3, 8, 0xffd2a0], [8, 2, -4, 3, 6, 0xb8d0ff], [0, -6, 6, 8, 2, 0x404040]]) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      pl.position.set(x, y, z);
      pl.lookAt(0, 0, 0);
      studio.add(pl);
    }
    VI.scene.environment = new THREE.PMREMGenerator(VI.rendu).fromScene(studio, 0.03).texture;
    VI.scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2a2420, 0.45));
    const cle = new THREE.DirectionalLight(0xfff0dc, 2.6), orange = new THREE.DirectionalLight(0xff9a40, 0.85), contre = new THREE.DirectionalLight(0xa8c8ff, 1.8);
    cle.position.set(1.5, 4, 3);
    orange.position.set(-4, 0.5, 1.5);
    contre.position.set(-2, 2, -4);
    VI.scene.add(cle, orange, contre);
    VI.cam = new THREE.PerspectiveCamera(24, 2, 0.03, 30);
    const ombre = toile(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      g.addColorStop(0, "rgba(0,0,0,.6)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    });
    VI.ombre = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: ombre, transparent: true, depthWrite: false }));
    VI.scene.add(VI.ombre);
    // LES MAINS DU JOUEUR sur la vitrine : glisser = tourner, molette ou pincer = zoomer, double-clic = revenir de profil
    const t = VI.boite;
    t.addEventListener("pointerdown", (ev) => {
      VI.doigts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      t.setPointerCapture(ev.pointerId);
      t.style.cursor = "grabbing";
      VI.touche = VI.t;
      if (VI.doigts.size === 2) { const [a, b] = [...VI.doigts.values()]; VI.pince = Math.hypot(a.x - b.x, a.y - b.y); }
    });
    t.addEventListener("pointermove", (ev) => {
      const d = VI.doigts.get(ev.pointerId);
      if (!d) return;
      if (VI.doigts.size === 1) {
        VI.lacet -= (ev.clientX - d.x) * 0.0085;
        VI.tangage = Math.max(-0.85, Math.min(0.95, VI.tangage + (ev.clientY - d.y) * 0.006));
      }
      d.x = ev.clientX;
      d.y = ev.clientY;
      if (VI.doigts.size === 2) {
        const [a, b] = [...VI.doigts.values()], e2 = Math.hypot(a.x - b.x, a.y - b.y);
        if (VI.pince > 0) VI.zoom = Math.max(VU.zoomMin, Math.min(VU.zoomMax, VI.zoom * (VI.pince / e2)));
        VI.pince = e2;
      }
      VI.touche = VI.t;
    });
    const lacher = (ev) => { VI.doigts.delete(ev.pointerId); VI.pince = 0; t.style.cursor = "grab"; };
    for (const n of ["pointerup", "pointercancel", "lostpointercapture"]) t.addEventListener(n, lacher);
    t.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      VI.zoom = Math.max(VU.zoomMin, Math.min(VU.zoomMax, VI.zoom * Math.exp(ev.deltaY * 0.0012)));
      VI.touche = VI.t;
    }, { passive: false });
    t.addEventListener("dblclick", () => { VI.lacet = VU.depart; VI.tangage = VU.hauteur; VI.zoom = 1; VI.touche = -99; });
  }
  // Montrer une arme dans la vitrine (conteneur = la boîte de l'armurerie) ; vitrine(null) : on éteint le studio.
  function vitrine(conteneur, id, pieces, options) {
    if (!conteneur) { VI.actif = false; VI.surImage = null; bilan.apercu = "arrêtée (l'armurerie n'est pas affichée)"; return; }
    options = options || {};
    preparerVitrine();
    if (VI.boite.parentNode !== conteneur) conteneur.appendChild(VI.boite);
    const m = fabriquer(id, pieces, "beau", options);
    VI.surImage = options.surImage || null;
    if (VI.cle !== m.cle) {
      if (VI.objet) VI.scene.remove(VI.objet);
      VI.objet = exemplaire(m);
      VI.cle = m.cle;
      VI.modele = m;
      // on centre l'arme (le milieu de sa boîte) ; la caméra reculera selon sa longueur
      const b = new THREE.Box3().setFromObject(VI.objet), c = b.getCenter(new THREE.Vector3()), tl = b.getSize(new THREE.Vector3());
      VI.objet.children.forEach((g) => g.position.sub(c));
      VI.centre.copy(c);
      VI.long = Math.max(tl.x, 0.5); // (un pistolet reste petit : on le voit en entier, comme dans une vraie armurerie)
      VI.haut = Math.max(tl.y, 0.2);
      VI.ombre.position.y = -tl.y / 2 - 0.035;
      VI.ombre.scale.set(tl.x * 1.15, 1, Math.max(tl.x * 0.3, 0.12));
      VI.scene.add(VI.objet);
    }
    if (!VI.actif) {
      VI.actif = true;
      VI.avant = performance.now();
      requestAnimationFrame(tournerVitrine);
    }
    bilan.apercu = "allumée : " + m.nom + " (" + m.triangles.toLocaleString("fr-FR") + " triangles)";
  }
  const _ancre = new THREE.Vector3();
  function tournerVitrine(t) {
    if (!VI.actif || !VI.boite.isConnected) { VI.actif = false; bilan.apercu = "arrêtée"; return; }
    const dt = Math.min(0.1, Math.max(0, (t - VI.avant) / 1000));
    VI.avant = t;
    VI.t += dt;
    // sans rien toucher pendant « reprise » s, l'arme revient doucement se balancer de profil
    if (VI.t - VI.touche > VU.reprise && !VI.doigts.size) {
      const voulu = VU.depart + Math.sin(VI.t * VU.vitesse) * VU.balancement;
      let d = voulu - VI.lacet;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const k = Math.min(1, dt * 1.2);
      VI.lacet += d * k;
      VI.tangage += (VU.hauteur - VI.tangage) * k;
    }
    const l = VI.boite.clientWidth, h = VI.boite.clientHeight;
    if (l > 0 && h > 0) {
      const pr = Math.min(2, devicePixelRatio || 1);
      if (VI.toile.width !== Math.round(l * pr) || VI.toile.height !== Math.round(h * pr)) VI.rendu.setPixelRatio(pr), VI.rendu.setSize(l, h, false);
      VI.cam.aspect = l / h;
      const tv = Math.tan((VI.cam.fov * Math.PI) / 360), th = tv * VI.cam.aspect;
      const d = (Math.max(VI.long / 2 / th, VI.haut / 2 / tv) * 1.2 + VI.long * 0.1) * VI.zoom;
      VI.cam.position.set(Math.sin(VI.lacet) * Math.cos(VI.tangage) * d, Math.sin(VI.tangage) * d, Math.cos(VI.lacet) * Math.cos(VI.tangage) * d);
      VI.cam.lookAt(0, 0, 0);
      VI.cam.updateProjectionMatrix();
      VI.rendu.render(VI.scene, VI.cam);
      VI.images++;
      // où est chaque pièce sur l'écran ? (en pixels dans la boîte ; « devant » = pas cachée derrière l'arme)
      if (VI.surImage && VI.modele) {
        const A = VI.modele.ancres, r = {};
        VI.cam.updateMatrixWorld();
        for (const emp in A) {
          if (!A[emp]) continue;
          _ancre.copy(A[emp]).sub(VI.centre);
          const devant = _ancre.z * Math.cos(VI.lacet) + _ancre.x * Math.sin(VI.lacet) > -0.012;
          _ancre.project(VI.cam);
          r[emp] = { x: ((_ancre.x + 1) / 2) * l, y: ((1 - _ancre.y) / 2) * h, devant };
        }
        VI.surImage(r, l, h);
      }
    }
    requestAnimationFrame(tournerVitrine);
  }
  // ------------------------------------------------------------------ LA LAMPE ET LE LASER (dans le monde)
  const LM = { spot: null, faisceau: null, trait: null, point: null, lueur: null };
  function texturePoint() {
    return toile(64, 64, (ctx) => {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.18, "rgba(255,255,255,.85)");
      g.addColorStop(0.45, "rgba(255,255,255,.18)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    });
  }
  function preparerLumieres(scene) {
    if (LM.faisceau) return;
    // le faisceau qu'on VOIT (dans la poussière) : un cône transparent, plus clair au centre et près de la lampe
    const cone = new THREE.ConeGeometry(1, 1, 28, 1, true);
    cone.translate(0, -0.5, 0);
    cone.rotateX(Math.PI); // (la pointe à l'origine, le cône vers +y)
    LM.faisceau = new THREE.Mesh(cone, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { opacite: { value: 0.15 }, couleur: { value: new THREE.Color(0xfff1dc) } },
      vertexShader: "varying float vL; varying vec3 vN; varying vec3 vV; void main() { vL = position.y; vec4 p = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-p.xyz); gl_Position = projectionMatrix * p; }",
      fragmentShader: "uniform float opacite; uniform vec3 couleur; varying float vL; varying vec3 vN; varying vec3 vV; void main() { float bord = pow(abs(dot(normalize(vN), normalize(vV))), 2.0); float a = opacite * bord * pow(1.0 - clamp(vL, 0.0, 1.0), 1.6); gl_FragColor = vec4(couleur * a, a); }",
    }));
    LM.faisceau.frustumCulled = false;
    LM.faisceau.renderOrder = 5;
    const tex = texturePoint();
    LM.lueur = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xfff4e0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true }));
    LM.trait = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    LM.trait.frustumCulled = false;
    LM.point = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xff2020, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false, transparent: true }));
    LM.point.renderOrder = 6;
    scene.add(LM.faisceau, LM.lueur, LM.trait, LM.point);
    for (const o of [LM.faisceau, LM.lueur, LM.trait, LM.point]) o.visible = false;
  }
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), AXE_Y = new THREE.Vector3(0, 1, 0);
  let armeDuJoueur = null; // (posé par engins3d.js quand il dessine ton soldat : l'arme dans ses mains)
  // Où est un point de ton arme dans le monde ? (en vue à la première personne : on le recalcule depuis la vue de l'arme)
  function pointDansLeMonde(local, cam, sortie) {
    if (V.actif && V.objet && V.modele) {
      V.objet.updateMatrixWorld();
      sortie.copy(local).applyMatrix4(V.objet.matrixWorld); // (dans le repère de la caméra de l'arme)
      sortie.project(V.cam); // → l'écran
      sortie.z = Math.min(0.999, sortie.z);
      // même endroit de l'écran, à la même distance de l'œil, vu par la caméra du monde
      const dist = local.clone().applyMatrix4(V.objet.matrixWorld).length();
      _d.set(sortie.x, sortie.y, 0.5).unproject(cam).sub(cam.position).normalize();
      return sortie.copy(cam.position).addScaledVector(_d, dist * 1.4);
    }
    if (armeDuJoueur && armeDuJoueur.objet.parent) {
      armeDuJoueur.objet.updateWorldMatrix(true, false);
      return sortie.copy(local).applyMatrix4(armeDuJoueur.objet.matrixWorld);
    }
    return null;
  }
  function majLumieres(monde, cam, scene, s) {
    preparerLumieres(scene);
    const A = s && s.armes && s.armes.principale, st = A && A.stats, enMain = s && s.arme !== "pistolet" && !s.mort && !s.nage && !s.dansUnEngin;
    const modele = V.actif ? V.modele : armeDuJoueur && armeDuJoueur.modele;
    const allume = !!(enMain && st && st.lampe && s.lampeAllumee && modele && modele.lampe);
    if (!LM.spot && st && st.lampe) {
      // la VRAIE lumière (un projecteur, sans ombres) : ajoutée seulement si ton arme a une lampe (une lumière de plus,
      // c'est un peu plus de calcul pour chaque pixel de l'écran)
      LM.spot = new THREE.SpotLight(0xfff1dc, 0, 30, 0.3, 0.45, 1);
      LM.spot.castShadow = false;
      scene.add(LM.spot, LM.spot.target);
    }
    if (LM.spot) LM.spot.intensity = 0;
    LM.faisceau.visible = LM.lueur.visible = false;
    bilan.lampe = st && st.lampe ? (allume ? "allumée : " + st.lampe.portee + " m, " + Math.round(st.lampe.force * A3.lampe.force) + " cd" : !enMain ? "(ton arme principale n'est pas en main)" : "éteinte (L)") : "pas de lampe";
    if (allume && pointDansLeMonde(modele.lampe, cam, _a)) {
      const dx = Math.cos(s.angle), dz = Math.sin(s.angle);
      _d.set(dx, -0.035, dz).normalize();
      LM.spot.position.copy(_a);
      LM.spot.target.position.copy(_a).addScaledVector(_d, 10);
      LM.spot.target.updateMatrixWorld();
      LM.spot.distance = st.lampe.portee;
      LM.spot.angle = st.lampe.angle;
      LM.spot.intensity = st.lampe.force * A3.lampe.force;
      // le faisceau visible : jusqu'au premier obstacle (le point visé), au plus la portée de la lampe
      const L = Math.min(st.lampe.portee * 0.6, s.vise ? Math.max(1, s.vise.d) : st.lampe.portee);
      LM.faisceau.position.copy(_a);
      LM.faisceau.quaternion.setFromUnitVectors(AXE_Y, _d);
      LM.faisceau.scale.set(Math.tan(st.lampe.angle) * L * 0.8, L, Math.tan(st.lampe.angle) * L * 0.8);
      LM.faisceau.material.uniforms.opacite.value = A3.lampe.faisceau * (Tanks.Scene.sousTerre ? 1.6 : 0.6) * (st.lampe.force > 60 ? 1.3 : 1);
      LM.faisceau.visible = true;
      LM.lueur.position.copy(_a).addScaledVector(_d, 0.02);
      LM.lueur.scale.setScalar(V.actif ? 0.05 : 0.16);
      LM.lueur.visible = true;
    }
    // le LASER : un trait fin de ta lentille jusqu'au point visé (calculé par logique/armes.js), et un point qui brille
    const laserOk = !!(enMain && st && st.laser && s.vise && modele && modele.laser);
    LM.trait.visible = LM.point.visible = false;
    bilan.laser = st && st.laser ? (laserOk ? st.laser + " → " + s.vise.sur + " à " + s.vise.d.toFixed(1).replace(".", ",") + " m" : "(pas en main)") : "pas de laser";
    if (laserOk && pointDansLeMonde(modele.laser, cam, _a)) {
      _b.set(s.vise.x, s.vise.y, s.vise.z);
      _d.copy(_b).sub(_a);
      const L = _d.length();
      LM.trait.position.copy(_a);
      LM.trait.quaternion.setFromUnitVectors(AXE_Y, _d.normalize());
      LM.trait.scale.set(A3.laser.epaisseur, L, A3.laser.epaisseur);
      LM.trait.material.color.set(st.laser);
      LM.trait.material.opacity = A3.laser.opacite * (Tanks.Scene.sousTerre ? 1.3 : 0.8);
      LM.point.position.copy(_b).addScaledVector(_d, -0.03);
      LM.point.material.color.set(st.laser);
      LM.point.scale.setScalar(A3.laser.point * (1 + L / 25));
      LM.trait.visible = LM.point.visible = true;
    }
  }

  // ------------------------------------------------------------------ LA VUE À LA PREMIÈRE PERSONNE
  // L'arme a sa propre petite scène et sa propre caméra (immobile : c'est l'arme qui bouge devant elle). On la dessine
  // APRÈS le monde, en effaçant d'abord la profondeur : elle passe toujours devant (même collé à un mur).
  const V = { scene: null, cam: null, objet: null, modele: null, cle: null, actif: false, mains: null, avantBras: null, flamme: null, eclair: null, douilles: [], t: 0,
    baisse: 1, recul: 0, vRecul: 0, roulis: 0, tirs: -1, dernierTir: -9, culasse: 0, angleAvant: null, traine: 0, rechargeVu: 0, chargeurTombe: null, ciel: null, soleil: null };
  function gantGeo(sens) {
    // ✍️ un POING GANTÉ autour d'une poignée : le dos de la main, 4 doigts en 3 morceaux qui s'enroulent autour, le pouce,
    // l'index (pour la main droite : posé sur la détente), les coussinets renforcés et le poignet.
    // Repère : la poignée passe par l'axe y ; les jointures regardent vers x ; le dos de la main est du côté z (sens).
    const e = etabli("beau"), G = 0x6e5d47, G2 = 0x4c4237, G3 = 0x5d5040, z = sens, r = 0.0098;
    const doigt = (pts, rr) => {
      for (let k = 0; k < pts.length - 1; k++) e.barre(pts[k], pts[k + 1], rr, "poly", G, 10);
      for (const p of pts) e.boule(rr * 1.02, p[0], p[1], p[2], "poly", G, 10);
    };
    e.galet(0.066, 0.088, 0.026, -0.01, 0.0, 0.027 * z, "poly", G, 0.42, 14); // le dos de la main
    e.galet(0.05, 0.05, 0.03, -0.022, -0.004, 0.006 * z, "poly", G, 0.5, 12); // la paume
    for (let k = 0; k < 4; k++) {
      const y = 0.03 - k * 0.0195, rr = r * (k === 3 ? 0.85 : 1);
      if (k === 0 && sens > 0) { doigt([[0.016, y + 0.004, 0.024 * z], [0.042, y + 0.006, 0.014 * z], [0.062, y, 0.006 * z], [0.074, y - 0.008, 0.002 * z]], rr); continue; } // l'index, sur la détente
      doigt([[0.016, y, 0.026 * z], [0.03, y, 0.008 * z], [0.026, y, -0.014 * z], [0.008, y - 0.002, -0.024 * z]], rr);
      e.galet(0.014, 0.016, 0.01, 0.022, y, 0.033 * z, "poly", G2, 0.5, 8); // le coussinet de la jointure
    }
    doigt([[-0.026, 0.012, 0.004 * z], [-0.018, 0.03, -0.018 * z], [0.0, 0.044, -0.026 * z], [0.016, 0.05, -0.024 * z]], 0.0105); // le pouce
    e.cyl(0.03, 0.028, 0.06, -0.05, -0.034, 0.016 * z, "poly", G3, 16, 0, 0, 2.2); // le poignet du gant
    e.galet(0.03, 0.05, 0.012, -0.014, 0.004, 0.04 * z, "poly", G2, 0.4, 10); // la plaque de protection
    const g = e.fin().corps;
    const [m] = OT.souder(g, false);
    uvAPlat(m.geometry, 9);
    return m.geometry;
  }
  function preparerVue() {
    if (V.scene) return;
    matieres();
    V.scene = new THREE.Scene();
    V.cam = new THREE.PerspectiveCamera(A3.vue.champ, 16 / 9, 0.05, 6); // (rien à moins de 5 cm de l'œil : la crosse, collée à la joue, ne cache pas l'écran)
    V.ciel = new THREE.HemisphereLight(0xdfe8f0, 0x5a5040, 1.2);
    V.soleil = new THREE.DirectionalLight(0xfff0dc, 2.4);
    V.eclair = new THREE.PointLight(0xffb060, 0, 1.6, 2);
    V.scene.add(V.ciel, V.soleil, V.soleil.target, V.eclair);
    // les mains et les avant-bras (la manche camouflée, le gant)
    const gant = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02, bumpMap: M.poly.bumpMap, bumpScale: 0.8 });
    const camo = Tanks.Chars3D && Tanks.Chars3D.camouflage ? Tanks.Chars3D.camouflage(C.equipes.bleus.camouflage).clone() : null;
    if (camo) (camo.needsUpdate = true), camo.repeat.set(1.5, 3);
    const manche = new THREE.MeshStandardMaterial({ map: camo, color: camo ? 0xffffff : 0x55603e, roughness: 0.95 });
    V.mains = [gantGeo(1), gantGeo(-1)].map((g) => { const m = new THREE.Mesh(g, gant); m.matrixAutoUpdate = false; V.scene.add(m); return m; });
    V.avantBras = [0, 1].map(() => {
      const g = new THREE.Group();
      const bras = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.036, 1, 16, 1, true).translate(0, 0.5, 0), manche);
      const poignet = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.035, 0.07, 14).translate(0, 0.02, 0), gant);
      const revers = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 18).rotateX(Math.PI / 2), manche);
      revers.position.y = 0.06;
      g.add(bras, poignet, revers);
      g.userData.bras = bras;
      V.scene.add(g);
      return g;
    });
    // la flamme du coup de feu : 3 plans en croix avec une étoile peinte, qui s'additionnent à la lumière
    const etoile = toile(128, 128, (ctx) => {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, "rgba(255,250,220,1)");
      g.addColorStop(0.25, "rgba(255,200,90,.9)");
      g.addColorStop(0.6, "rgba(255,120,30,.25)");
      g.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, r = k % 2 ? 22 : 64; ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
      ctx.fill();
    });
    const mf = new THREE.MeshBasicMaterial({ map: etoile, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    V.flamme = new THREE.Group();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11).rotateY(Math.PI / 2), mf);
    V.flamme.add(face);
    for (const r of [0, Math.PI / 2]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08).translate(0.09, 0, 0).rotateX(r), mf); V.flamme.add(c); }
    V.flamme.visible = false;
    // les douilles (de petits cylindres en laiton)
    const douille = new THREE.CylinderGeometry(0.0045, 0.0045, 0.03, 8).rotateZ(Math.PI / 2), laiton = new THREE.MeshStandardMaterial({ color: K.laiton, metalness: 0.9, roughness: 0.25 });
    for (let k = 0; k < A3.vue.douilles; k++) { const d = new THREE.Mesh(douille, laiton); d.visible = false; d.userData = { v: new THREE.Vector3(), w: new THREE.Vector3(), vie: 0 }; V.scene.add(d); V.douilles.push(d); }
  }
  const lisse = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const entre = (t, a, b) => lisse((t - a) / (b - a));
  // La famille de la vue (où l'arme est tenue, comment elle recule).
  const familleVue = (m) => m.famille;
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _e = new THREE.Euler(), _q2 = new THREE.Quaternion(), _x = new THREE.Vector3(1, 0, 0), _ndc = new THREE.Vector3();
  function poserMain(main, modele, objet, prise, sens, decalage) {
    // la main : son axe y suit l'axe de la poignée, ses jointures regardent devant (ou sur le côté pour le garde-main)
    const axe = prise.axe.clone().normalize();
    let devant = prise.sorte === "dessous" ? new THREE.Vector3(0, 0, sens) : new THREE.Vector3(1, 0, 0);
    devant.sub(axe.clone().multiplyScalar(devant.dot(axe))).normalize();
    const cote = new THREE.Vector3().crossVectors(devant, axe);
    _m.makeBasis(devant, axe, cote);
    if (prise.sorte === "dessous") _m.multiply(new THREE.Matrix4().makeRotationY(sens > 0 ? 0 : 0));
    _m.setPosition(prise.centre.clone().add(decalage || new THREE.Vector3()));
    main.matrix.multiplyMatrices(objet.matrix, _m);
    main.matrixWorldNeedsUpdate = true;
  }
  function poserAvantBras(g, main, coude) {
    // du poignet (dans le repère de la main : un peu derrière et en dessous) vers le coude (hors de l'écran)
    _p.set(-0.06, -0.04, 0.012).applyMatrix4(main.matrix);
    _d.copy(coude).sub(_p);
    const L = Math.min(0.62, _d.length());
    g.position.copy(_p);
    g.quaternion.setFromUnitVectors(AXE_Y, _d.normalize());
    g.userData.bras.scale.set(1, L, 1);
  }
  function majVue(monde, dt, cam, scene, s, premiere) {
    const D = A3.vue;
    const ok = premiere && s && s.armes && !s.mort && !s.nage && !s.parachute && !s.corde && !s.dansUnEngin;
    if (!ok) {
      V.actif = false;
      return;
    }
    preparerVue();
    V.t += dt;
    // 1. quelle arme en main ? (les grenades et la plupart des gadgets : l'arme est baissée hors de l'écran)
    const tenue = s.arme === "pistolet" ? s.armes.pistolet : s.armes.principale;
    const range = s.arme === "grenades" || (s.arme === "gadget" && s.gadget.id !== "lanceGrenades");
    const lg = s.gadget && s.gadget.id === "lanceGrenades";
    const voulu = fabriquer(tenue.id, tenue.pieces, "beau", { lanceGrenades: lg });
    // 2. changer d'arme : on baisse l'ancienne, on prend la nouvelle, on la lève
    if (!V.modele) V.baisse = 1;
    if (V.modele !== voulu || range) V.baisse = Math.min(1, V.baisse + dt / D.changement);
    else V.baisse = Math.max(0, V.baisse - dt / D.changement);
    if (V.modele !== voulu && V.baisse >= 1) {
      if (V.objet) V.scene.remove(V.objet);
      V.modele = voulu;
      V.objet = exemplaire(voulu);
      V.objet.matrixAutoUpdate = true;
      V.scene.add(V.objet);
      V.tirs = s.compteurs ? s.compteurs.tirs : 0;
      let tri = voulu.triangles;
      for (const m of V.mains) tri += m.geometry.attributes.position.count / 3;
      bilan.vueTriangles = Math.round(tri + 2 * 32);
      bilan.vueObjets = voulu.objets + 6;
    }
    const m = V.modele, st = tenue.stats, fam = familleVue(m);
    V.actif = true;
    // 3. la direction où l'arme pointe : vers le viseur du tableau de bord (40 m devant, à hauteur d'homme). Épaulé : pile
    // dessus ; à la hanche : à mi-chemin entre ce viseur et « tout droit », et un peu tournée vers le centre (on voit son flanc)
    _a.set(s.x + Math.cos(s.angle) * 40, s.y + 1.4, s.z + Math.sin(s.angle) * 40).project(cam);
    V.cam.aspect = cam.aspect;
    V.cam.near = 0.05 + (V.modele && V.modele.famille === "roquettes" ? 0 : 0.07 * lisse(s.visee || 0)); // (épaulé : la crosse et le tube qui passent sous l'œil sont coupés, comme la joue posée dessus)
    V.cam.updateProjectionMatrix();
    const dir = _ndc.set(_a.x, _a.y, 0.5).unproject(V.cam).normalize();
    const k = lisse(s.visee || 0);
    const d = new THREE.Vector3(0, 0, -1).lerp(dir, 0.5 + 0.5 * k).normalize();
    const droite = new THREE.Vector3().crossVectors(d, AXE_Y).normalize(), haut = new THREE.Vector3().crossVectors(droite, d);
    const qVise = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(d, haut, droite));
    // 4. à la hanche, ou épaulé (le viseur pile devant l'œil)
    const hanche = new THREE.Vector3(...(D.hanche[fam] || D.hanche.fusil));
    if (m.decalageVue) hanche.add(new THREE.Vector3(...m.decalageVue)); // (le Javelin est énorme : on le tient plus loin)
    const vis = m.visee, oeil = (D.oeil[fam] || 0.1) + (vis.nom.includes("lunette") ? 0.05 : 0);
    const ligne = new THREE.Vector3(vis.arriere, vis.ligne, vis.z || 0).applyQuaternion(qVise);
    const epaule = d.clone().multiplyScalar(oeil).sub(ligne);
    const pos = hanche.lerp(epaule, k);
    // 5. ce qui fait vivre l'arme : la respiration, les pas, le retard quand tu tournes, le recul, le rechargement, le changement
    const calme = 1 - 0.75 * k;
    pos.x += Math.sin(V.t * D.respiration[1] * Math.PI) * D.respiration[0] * 0.6 * calme;
    pos.y += Math.sin(V.t * D.respiration[1] * Math.PI * 2) * D.respiration[0] * calme;
    const vitesse = Math.min(1, Math.abs(s.vitesse || 0) / 3.5), phase = (s.pas || 0) * 2.6;
    pos.y += -Math.abs(Math.sin(phase)) * D.pas * vitesse * (1 - 0.8 * k);
    pos.x += Math.sin(phase) * D.pas * 0.7 * vitesse * (1 - 0.8 * k);
    if (V.angleAvant !== null && dt > 0) {
      const w = Math.atan2(Math.sin(s.angle - V.angleAvant), Math.cos(s.angle - V.angleAvant)) / dt;
      V.traine += (Math.max(-3, Math.min(3, w)) * D.retard - V.traine) * Math.min(1, dt * 10);
    }
    V.angleAvant = s.angle;
    // le RECUL : un ressort. Chaque tir lui donne un coup ; il revient tout seul (et l'éclair, et la douille)
    const tirs = s.compteurs ? s.compteurs.tirs : 0;
    if (tirs !== V.tirs) {
      if (tirs > V.tirs && V.baisse < 0.5) {
        V.vRecul += 38;
        V.roulis = (Math.random() * 2 - 1) * 0.04;
        V.dernierTir = V.t;
        V.culasse = 1;
        ejecter(m);
      }
      V.tirs = tirs;
    }
    // (le ressort est calculé en petits pas de 1/240 s : même quand l'ordinateur rame, il ne s'affole pas)
    for (let n = Math.ceil(dt * 240), h = dt / Math.max(1, n), i = 0; i < n; i++) {
      V.vRecul += (-D.ressort * V.recul - D.amorti * V.vRecul) * h;
      V.recul += V.vRecul * h;
    }
    V.culasse = Math.max(0, V.culasse - dt * 14);
    const R = D.recul[fam] || D.recul.fusil, fort = 1 - 0.45 * k;
    const reculZ = V.recul * R[0] * fort, reculH = V.recul * R[1] * fort;
    // le RECHARGEMENT (t de 0 à 1) : on penche l'arme, le chargeur tombe, la main en remet un neuf, clac
    const pompe = fam === "pompe", glisse = pompe && s.rechargement > 0 && s.rechargementDe === tenue; // (fusil à pompe : cartouche par cartouche)
    const recharge = s.rechargement > 0 && s.rechargementDe === tenue && !pompe ? 1 - s.rechargement / st.rechargement : 0;
    V.penchePompe = Math.max(0, Math.min(1, (V.penchePompe || 0) + (glisse ? 1 : -1) * dt * 6));
    const penche = pompe ? lisse(V.penchePompe) : recharge > 0 ? entre(recharge, 0, 0.14) * (1 - entre(recharge, 0.82, 1)) : 0;
    const roquettes = fam === "roquettes", sansChargeur = !m.chargeur;
    const descente = roquettes && sansChargeur ? Math.sin(Math.PI * Math.min(1, recharge * 1.05)) : 0;
    // (pendant le rechargement, l'arme vient vers le centre et se couche sur le côté : on voit le puits du chargeur)
    const P = D.rechargePose[fam] || D.rechargePose.fusil;
    pos.x += penche * P[0];
    pos.y += penche * P[1] - V.baisse * 0.35 - descente * 0.4;
    pos.z += reculZ + penche * P[2];
    // l'orientation finale
    // (les petites rotations, dans le repère de l'arme : x = roulis autour du canon, y = vers la gauche, z = le canon qui monte)
    const roulis = V.roulis * V.recul + penche * P[3] + (1 - k) * (D.hancheRoulis[fam] || 0);
    const lacet = -V.traine * (1 - 0.6 * k) + (1 - k) * (D.hancheLacet[fam] || 0);
    const tangage = reculH - V.baisse * 0.9 + penche * P[4];
    V.objet.position.copy(pos);
    V.objet.quaternion.copy(qVise).multiply(_q2.setFromEuler(_e.set(roulis, lacet, tangage, "YZX")));
    V.objet.updateMatrix();
    // le chargeur pendant le rechargement : il descend et tombe, puis le neuf remonte
    const groupeCh = V.objet.getObjectByName("chargeur"), groupeCul = V.objet.getObjectByName("culasse");
    if (groupeCh) {
      groupeCh.visible = true;
      groupeCh.position.set(0, 0, 0);
      if (recharge > 0) {
        if (roquettes) { // la roquette sort par l'avant, puis une neuve rentre
          const sort = entre(recharge, 0.1, 0.35), rentre = 1 - entre(recharge, 0.5, 0.85);
          groupeCh.visible = recharge < 0.36 || recharge > 0.5;
          groupeCh.position.set((recharge < 0.4 ? sort : rentre) * 0.35, (recharge < 0.4 ? sort : rentre) * -0.25, 0);
        } else {
          const sort = entre(recharge, 0.12, 0.32), rentre = 1 - entre(recharge, 0.48, 0.74);
          if (recharge < 0.4) groupeCh.position.set(sort * 0.02, -sort * sort * 0.45, 0);
          else groupeCh.position.set(0, -rentre * 0.22, 0);
          groupeCh.visible = recharge < 0.33 || recharge > 0.42;
        }
      }
    }
    if (groupeCul) {
      if (pompe) { // (fusil à pompe) la POMPE : le garde-main recule puis revient, juste après chaque tir
        const PO = A3.pompe, t = V.t - V.dernierTir, c = t > PO.debut && t < PO.fin ? Math.sin(Math.PI * (t - PO.debut) / (PO.fin - PO.debut)) : 0;
        groupeCul.position.set(-c * PO.course, 0, 0);
      } else if (fiche(m.id).verrou) { // le verrou (le .338 et le M24) : on le tire en arrière puis on le repousse, après chaque tir
        const t = V.t - V.dernierTir, c = t > 0.15 && t < 0.85 ? Math.sin(Math.PI * Math.min(1, (t - 0.15) / 0.6)) : 0;
        groupeCul.position.set(-c * 0.075, 0, 0);
      } else groupeCul.position.set(-V.culasse * 0.03, 0, 0);
    }
    // 6. les mains
    const M0 = V.mains[0], M1 = V.mains[1];
    poserMain(M0, m, V.objet, m.poignee, 1);
    let decG = null;
    if (recharge > 0 && m.chargeur && !roquettes) { // la main gauche va chercher un chargeur neuf, puis le pousse dans l'arme
      const loin = entre(recharge, 0.14, 0.3) * (1 - entre(recharge, 0.46, 0.6)), surCh = entre(recharge, 0.42, 0.55) * (1 - entre(recharge, 0.76, 0.86));
      const ch = new THREE.Vector3(m.chargeur.x, m.chargeur.y - 0.07, 0).add(groupeCh ? groupeCh.position : new THREE.Vector3());
      decG = new THREE.Vector3(0, -0.3 * loin, 0.05 * loin).add(ch.clone().sub(m.garde.centre).multiplyScalar(surCh));
    } else if (recharge > 0 && roquettes && m.chargeur) {
      const surR = entre(recharge, 0.05, 0.2) * (1 - entre(recharge, 0.85, 0.95));
      decG = new THREE.Vector3(m.chargeur.x - m.garde.centre.x, m.chargeur.y - 0.04 - m.garde.centre.y, 0).add(groupeCh.position).multiplyScalar(surR);
    }
    if (pompe && groupeCul) { // la main gauche tient la pompe (elle la suit) ; en rechargeant, elle glisse des cartouches par-dessous
      decG = groupeCul.position.clone();
      if (glisse) {
        const ph = 1 - s.rechargement / st.rechargement, va = Math.sin(Math.PI * ph);
        decG.add(new THREE.Vector3(0.07 - m.garde.centre.x, -0.02 - m.garde.centre.y, 0).multiplyScalar(0.85 * lisse(V.penchePompe))).add(new THREE.Vector3(0, -0.09 * va, 0.02 * va));
      }
    }
    poserMain(M1, m, V.objet, m.garde, -1, decG);
    poserAvantBras(V.avantBras[0], M0, _b.set(0.24, -0.45, 0.12));
    poserAvantBras(V.avantBras[1], M1, _b.set(fam === "pistolet" ? 0.0 : -0.2, -0.45, 0.02));
    // 7. l'éclair au bout du canon (presque rien avec un silencieux), et sa lumière sur l'arme et les mains
    const flamme = V.t - V.dernierTir < D.flamme && !roquettes;
    if (V.flamme.parent !== V.objet) V.objet.add(V.flamme);
    V.flamme.position.copy(m.bouche);
    V.flamme.visible = flamme;
    // (demande 97 : l'éclair dépend de la BOUCHE : presque rien avec un silencieux ou un cache-flamme, énorme avec le frein)
    const fl = Math.max(0.1, (Tanks.Equipement.piece("bouche", m.pieces.bouche).effets.flamme || 1));
    if (flamme) {
      V.flamme.rotation.x = Math.random() * Math.PI;
      V.flamme.scale.setScalar(fl * (fl < 0.5 ? 1 : 1 + Math.random() * 0.6) * (fam === "precision" ? 1.6 : fam === "pistolet" ? 0.6 : 1.2));
    }
    V.eclair.intensity = flamme ? 3 * Math.min(1.3, fl) : 0;
    if (flamme) V.eclair.position.copy(m.bouche).applyMatrix4(V.objet.matrix);
    // 8. les douilles qui volent
    for (const d of V.douilles) {
      const u = d.userData;
      if (u.vie <= 0) continue;
      u.vie -= dt;
      u.v.y -= 9.8 * dt;
      d.position.addScaledVector(u.v, dt);
      d.rotation.x += u.w.x * dt;
      d.rotation.z += u.w.z * dt;
      d.visible = u.vie > 0;
    }
    // 9. la lumière de la vue suit celle du monde (le soleil vu depuis la caméra ; sous terre : plus sombre)
    const dessous = Tanks.Scene.sousTerre;
    V.scene.environment = scene.environment;
    V.ciel.intensity = dessous ? 0.95 : 1.15;
    V.soleil.intensity = dessous ? 0.6 : 2.3;
    V.ciel.color.set(dessous ? 0xd8c8b0 : 0xdfe8f0); // (sous terre : la lumière chaude des feux et des néons)
    const soleil = new THREE.Vector3(...C.beaute.soleil.direction).normalize().transformDirection(cam.matrixWorldInverse);
    V.soleil.position.copy(soleil);
    bilan.nom = m.nom;
    bilan.pieces = m.liste;
    // épaulé avec une LUNETTE : c'est la vraie lunette du tableau de bord qui prend la place (étape 79)
    if (st.lunette && (s.visee || 0) > 0.82) V.actif = false;
  }
  function ejecter(m) {
    if (!m.ejection || V.douilles.length === 0) return;
    const d = V.douilles.find((x) => x.userData.vie <= 0) || V.douilles[0], u = d.userData;
    d.position.copy(m.ejection).applyMatrix4(V.objet.matrix);
    const droite = new THREE.Vector3(0, 0, 1).applyQuaternion(V.objet.quaternion), haut = new THREE.Vector3(0, 1, 0).applyQuaternion(V.objet.quaternion), arriere = new THREE.Vector3(-1, 0, 0).applyQuaternion(V.objet.quaternion);
    u.v.copy(droite).multiplyScalar(1.3 + Math.random() * 0.6).addScaledVector(haut, 1.1 + Math.random() * 0.5).addScaledVector(arriere, 0.3);
    u.w.set(20 + Math.random() * 20, 0, 15 + Math.random() * 15);
    u.vie = 0.7;
    d.quaternion.copy(V.objet.quaternion);
    d.visible = true;
  }

  // ------------------------------------------------------------------ chaque image (appelé par scene.js)
  // maj : AVANT le dessin du monde (la vue de l'arme, la lampe et le laser) ; dessinerVue : APRÈS (l'arme par-dessus).
  function maj(monde, dt, cam, scene, premiere) {
    const t = monde && monde.toi, s = t && t.mode === "pied" && monde.phase !== "garage" ? t.soldat : null;
    majVue(monde, dt, cam, scene, s, premiere);
    majLumieres(monde, cam, scene, s);
  }
  function dessinerVue(rendu) {
    if (!V.actif || !V.objet) return;
    const auto = rendu.autoClear;
    rendu.autoClear = false;
    rendu.clearDepth();
    rendu.render(V.scene, V.cam);
    rendu.autoClear = auto;
  }

  return {
    bilan, fabriquer, exemplaire, pourSoldat, armeIA, sonDe, vitrine, maj, dessinerVue, normaliser, matierePeinture,
    get vitrineEtat() { return { actif: VI.actif, images: VI.images, zoom: VI.zoom, lacet: VI.lacet, modele: VI.modele, magasin: magasin.size }; },
    noterArmeDuJoueur: (objet, modele) => (armeDuJoueur = objet ? { objet, modele } : null),
    get armeDuJoueur() { return armeDuJoueur; },
    get vue() { return { actif: V.actif, modele: V.modele, objet: V.objet, cam: V.cam, baisse: V.baisse, recul: V.recul, scene: V.scene }; },
    LISTE: () => Object.keys(C.armesPrincipales).concat(Object.keys(C.pistolets)),
  };
})();
