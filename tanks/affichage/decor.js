// 🎨 LE DÉCOR : le peintre du champ de bataille (étape 60)
//
// Il fabrique (une seule fois) ce qu'on voit :
//   - LE SOL : une grande grille de 2 100 m (étape 71 ; avant : 700 m) posée sur les collines (logique/terrain.js) ;
//   - LES MAISONS : (étape 75) elles sont maintenant dessinées par affichage/maisons3d.js (on peut les détruire) ;
//   - LES MURETS et les haies, LES ARBRES (feuillus et sapins). Un arbre écrasé par un tank se couche par terre.
// Pour que ce soit rapide, tout ce qui a la même matière est « recollé » en une seule forme (une maison = des
// dizaines de pierres, mais un seul dessin pour tout le village), et les arbres sont des « instances ».
// Étape 72 (« ça rame ») : le décor est découpé en MORCEAUX de 140 m (comme un puzzle) : le sol en tuiles, le village
// et les murets par morceau. La carte graphique ne dessine que les morceaux devant la caméra, et le régulateur de
// qualité (affichage/qualite.js) cache ceux qui sont trop loin. Les arbres trop loin ne sont pas dessinés non plus.
// Étape 71 : la carte est 3 fois plus grande (2 100 m). Le sol a un point tous les 5 m (au lieu de 4) : 15 × 15 tuiles,
// et seules celles qui sont près de toi et devant la caméra sont dessinées. Les hameaux ont aussi leur terre battue.
// ✍️ Étape 74 (« le plus beau possible ») :
//   - LE SOL est peint comme un tableau : une GRANDE IMAGE de toute la carte (1 point ≈ 1 m) avec l'herbe et ses nuances
//     (plus sombre ici, plus jaune et sèche là), des taches de terre, la terre battue des villages et des camps, le sol
//     sombre sous les arbres (les feuilles mortes), le sable et la boue au bord du lac, et les CHEMINS de terre (avec
//     leurs deux ornières et l'herbe au milieu) qui relient les camps, le village, le hameau, la ferme et le lac.
//     De près, une petite image de DÉTAIL (des brins d'herbe sur l'herbe, des cailloux sur la terre) est répétée par
//     dessus : le sol n'est plus flou quand on a le nez dessus. (Le « peintre » de la carte graphique choisit lui-même
//     le détail d'herbe ou de terre selon la couleur : plus rouge que verte = de la terre.)
//   - L'HERBE en TOUFFES autour de la caméra (des petits bouquets de brins qui se balancent dans le vent), seulement
//     sur l'herbe (pas sur les chemins, la terre, le sable ni l'eau), et plus ou moins loin selon la qualité ;
//   - LES ARBRES : des feuillus à GRAPPES de feuillage arrondies (7 boules bosselées, plus sombres dessous, avec une
//     image de feuilles), un vrai tronc avec ses branches et son écorce ; des sapins à ÉTAGES de branches qui tombent ;
//     chacun avec sa nuance de vert. Près de la caméra : ces beaux arbres ; plus loin : des arbres simples ;
//   - LE LAC : une eau plus profonde et plus foncée, lisse, qui reflète le ciel (plus fort quand on la regarde de
//     loin, comme une vraie eau), avec deux couches de vaguelettes qui glissent.
// Comme tout l'affichage, il ne change jamais le monde : il le lit.

window.Tanks = window.Tanks || {};

Tanks.Decor = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, BE = C.beaute;
  let arbresFeuilles = null, sapins = null; // (les arbres simples, de loin : le tronc est soudé avec le feuillage)
  let pres = null; // (étape 74) les beaux arbres, de près : { troncs, feuilles, troncsSapins, sapins }
  const etatArbre = []; // pour chaque arbre : couché ou pas (on refait sa place seulement quand ça change)
  // (étape 72) les morceaux du décor : { objet, x, z, rayon } ; et ce qu'on a dessiné à la dernière image
  const morceaux = [];
  const bilan = { morceaux: 0, morceauxVus: 0, arbres: 0, arbresVus: 0, arbresBeaux: 0, touffes: 0, touffesMax: 0, cailloux: 0, caillouxMax: 0, caseHerbe: 0, chemins: 0, imageSol: 0, detailSol: 0 };
  const M = C.decor.morceau, nM = Math.ceil(C.monde.taille / M);
  const numeroMorceau = (x, z) => {
    const i = Math.max(0, Math.min(nM - 1, Math.floor((x + C.monde.taille / 2) / M))), j = Math.max(0, Math.min(nM - 1, Math.floor((z + C.monde.taille / 2) / M)));
    return j * nM + i;
  };
  function ajouterMorceau(groupe, objet) {
    const b = objet.geometry.boundingSphere || (objet.geometry.computeBoundingSphere(), objet.geometry.boundingSphere);
    morceaux.push({ objet, x: b.center.x, z: b.center.z, rayon: b.radius });
    groupe.add(objet);
  }

  function image(taille, peindre) {
    const c = document.createElement("canvas");
    c.width = c.height = taille;
    peindre(c.getContext("2d"), taille);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  let etat = 61;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  // (étape 74) un hasard « par endroit » : toujours le même nombre pour la même case (i, j)
  const hasardIci = (i, j, k) => {
    let h = (i * 374761393 + j * 668265263 + (k || 0) * 2147483647) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // ------------------------------------------------------------------ (étape 74) LE SOL PEINT
  // 1. Le CHAMP : la couleur du sol tous les 4 m (512 × 512 cases), calculée case par case avec du « bruit » :
  //    l'herbe (2 verts qui se mélangent), l'herbe sèche, les taches de terre, les villages, les camps, sous les arbres,
  //    le bord du lac. On garde aussi, pour chaque case, « combien c'est de la terre » (pour savoir où pousse l'herbe).
  const demi = C.monde.taille / 2, NC = BE.sol.champ, pasC = C.monde.taille / NC;
  const champ = { couleur: new Float32Array(NC * NC * 3), terre: new Float32Array(NC * NC) };
  const NCH = 1024, masqueChemins = new Uint8Array(NCH * NCH); // (les chemins, tous les 2 m : 1 = chemin)
  const melanger = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const lisse = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const COUL = {
    herbe: [80, 104, 50], herbeSombre: [58, 82, 40], herbeSeche: [138, 130, 82], herbeJaune: [104, 114, 58], terre: [116, 96, 70], terreBattue: [126, 110, 86],
    sousBois: [60, 58, 38], sable: [176, 160, 122], boue: [82, 74, 54], fond: [70, 76, 62], chemin: [126, 108, 80],
  };
  // (étape 81) la variante de la carte (le désert, la ville en ruines…) peut changer les couleurs du sol
  const VAR = T.variante || {};
  Object.assign(COUL, VAR.sol || {});
  function peindreChamp() {
    const b1 = Tanks.Bruit.creer(741), b2 = Tanks.Bruit.creer(742), b3 = Tanks.Bruit.creer(743), b4 = Tanks.Bruit.creer(744);
    // la densité des arbres (pour le sol sombre des forêts) : chaque arbre « assombrit » sa case et ses voisines
    const dens = new Float32Array(NC * NC);
    for (const a of T.arbres) {
      const i0 = Math.floor((a.x + demi) / pasC), j0 = Math.floor((a.z + demi) / pasC);
      for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
        const i = i0 + di, j = j0 + dj;
        if (i < 0 || j < 0 || i >= NC || j >= NC) continue;
        dens[j * NC + i] += Math.max(0, 1 - Math.hypot(di, dj) / 2.6) * 0.45;
      }
    }
    const villages = T.villages;
    for (let j = 0; j < NC; j++) for (let i = 0; i < NC; i++) {
      const x = -demi + (i + 0.5) * pasC, z = -demi + (j + 0.5) * pasC, k = j * NC + i;
      // l'herbe : deux verts, de l'herbe sèche par plaques, de petites variations
      const n1 = Tanks.Bruit.fractal(b1, x / 110, z / 110, 3), n2 = Tanks.Bruit.fractal(b2, x / 170, z / 170, 3), n3 = b3(x / 18, z / 18);
      const n5 = Tanks.Bruit.fractal(b3, x / 38 + 40, z / 38, 2);
      let c = melanger(COUL.herbe, COUL.herbeSombre, lisse(-0.35, 0.45, n1));
      c = melanger(c, COUL.herbeJaune, lisse(0.0, 0.6, n5) * 0.45);
      c = melanger(c, COUL.herbeSeche, lisse(0.15, 0.55, n2) * 0.6);
      const v = 1 + n3 * 0.07;
      c = [c[0] * v, c[1] * v, c[2] * v];
      // les taches de terre (quelques-unes au hasard dans les champs)
      const n4 = Tanks.Bruit.fractal(b4, x / 45, z / 45, 4) + b3(x / 7, z / 7) * 0.08;
      let terre = lisse(0.44, 0.56, n4) * 0.85;
      // les villages et les hameaux : la terre battue (au bord, elle se mélange à l'herbe en taches)
      for (const vi of villages) {
        const d = Math.hypot(x - vi.x, z - vi.z) / vi.rayon;
        terre = Math.max(terre, lisse(1.35, 0.85, d + n4 * 0.25) * 0.9);
      }
      // les camps (et leur parking) : piétinés par les tanks
      const camp = Math.max(0, Math.min(1, (210 - Math.abs(x)) / 40)) * Math.max(0, Math.min(1, (95 - Math.abs(Math.abs(z) - T.camp - 15)) / 30));
      terre = Math.max(terre, camp * (0.55 + 0.35 * lisse(-0.2, 0.5, n4)));
      c = melanger(c, villages.some((vi) => Math.hypot(x - vi.x, z - vi.z) < vi.rayon * 1.3) ? COUL.terreBattue : COUL.terre, terre);
      // sous les arbres : le sol sombre (de l'ombre et des feuilles mortes)
      const foret = Math.min(1, dens[k]);
      c = melanger(c, COUL.sousBois, foret * 0.75);
      // le bord du lac (et des îles) : le sable, puis la boue et l'herbe mouillée ; sous l'eau, le fond
      let dl = T.distLac(x, z);
      for (const ile of T.iles) dl = Math.min(dl, 1 + (Math.hypot(x - ile.x, z - ile.z) - ile.rayon) / 120);
      const sable = lisse(0.965, 0.99, dl) * lisse(1.035, 1.012, dl), boue = lisse(1.01, 1.035, dl) * lisse(1.075, 1.045, dl);
      c = melanger(c, COUL.boue, boue * 0.7);
      c = melanger(c, COUL.sable, sable);
      if (dl < 0.96) c = melanger(c, COUL.fond, lisse(0.96, 0.9, dl));
      champ.couleur.set(c, k * 3);
      champ.terre[k] = Math.max(terre, sable, dl < 1.02 ? 1 : 0, boue * 0.6);
    }
  }
  // 2. Les CHEMINS : chaque ligne de config.js est « adoucie » (on coupe les coins 3 fois : la méthode de Chaikin), pour
  //    faire des courbes ; la même courbe sert à les peindre et à savoir où ne pas mettre d'herbe.
  function courbe(points) {
    let p = points.map(([x, z]) => [x, z]);
    for (let n = 0; n < 3; n++) {
      const q = [p[0]];
      for (let i = 0; i < p.length - 1; i++) {
        const [ax, az] = p[i], [bx, bz] = p[i + 1];
        q.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
      }
      q.push(p[p.length - 1]);
      p = q;
    }
    return p;
  }
  function tousLesChemins() {
    const lignes = BE.chemins.lignes.map(courbe);
    // les rues des villages : deux rues en croix (comme les maisons, logique/terrain.js)
    for (const v of T.villages) {
      lignes.push([[v.x - v.rayon * 1.15, v.z], [v.x + v.rayon * 1.15, v.z]], [[v.x, v.z - v.rayon * 1.15], [v.x, v.z + v.rayon * 1.15]]);
    }
    return lignes;
  }
  function marquerChemins(lignes) {
    const pasM = C.monde.taille / NCH, r = BE.chemins.largeur / 2 + 0.6;
    for (const l of lignes) for (let s = 0; s < l.length - 1; s++) {
      const [ax, az] = l[s], [bx, bz] = l[s + 1], long = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(long / 1));
      for (let t = 0; t <= n; t++) {
        const x = ax + ((bx - ax) * t) / n, z = az + ((bz - az) * t) / n;
        const i0 = Math.floor((x - r + demi) / pasM), i1 = Math.floor((x + r + demi) / pasM), j0 = Math.floor((z - r + demi) / pasM), j1 = Math.floor((z + r + demi) / pasM);
        for (let j = Math.max(0, j0); j <= Math.min(NCH - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(NCH - 1, i1); i++) {
          const cx = -demi + (i + 0.5) * pasM, cz = -demi + (j + 0.5) * pasM;
          if (Math.hypot(cx - x, cz - z) < r) masqueChemins[j * NCH + i] = 1;
        }
      }
    }
  }
  // Est-ce de l'herbe ici ? (1 = de l'herbe, 0 = de la terre, un chemin, du sable ou de l'eau)
  function herbeIci(x, z) {
    const u = (x + demi) / pasC - 0.5, v = (z + demi) / pasC - 0.5, i = Math.max(0, Math.min(NC - 2, Math.floor(u))), j = Math.max(0, Math.min(NC - 2, Math.floor(v)));
    const fu = Math.max(0, Math.min(1, u - i)), fv = Math.max(0, Math.min(1, v - j)), t = champ.terre;
    const terre = (t[j * NC + i] * (1 - fu) + t[j * NC + i + 1] * fu) * (1 - fv) + (t[(j + 1) * NC + i] * (1 - fu) + t[(j + 1) * NC + i + 1] * fu) * fv;
    const ic = Math.floor(((x + demi) / C.monde.taille) * NCH), jc = Math.floor(((z + demi) / C.monde.taille) * NCH);
    if (ic >= 0 && jc >= 0 && ic < NCH && jc < NCH && masqueChemins[jc * NCH + ic]) return 0;
    return 1 - terre;
  }
  function couleurIci(x, z, sortie) {
    const i = Math.max(0, Math.min(NC - 1, Math.floor((x + demi) / pasC))), j = Math.max(0, Math.min(NC - 1, Math.floor((z + demi) / pasC))), k = (j * NC + i) * 3;
    return sortie.setRGB(champ.couleur[k] / 255, champ.couleur[k + 1] / 255, champ.couleur[k + 2] / 255, THREE.SRGBColorSpace);
  }
  // 3. La GRANDE IMAGE : le champ agrandi (en douceur), puis les chemins et les petites taches peints par-dessus.
  function grandeImage(lignes) {
    const T2 = BE.sol.image, k = T2 / C.monde.taille;
    const petit = document.createElement("canvas");
    petit.width = petit.height = NC;
    const pc = petit.getContext("2d"), img = pc.createImageData(NC, NC);
    for (let i = 0; i < NC * NC; i++) {
      img.data[i * 4] = champ.couleur[i * 3];
      img.data[i * 4 + 1] = champ.couleur[i * 3 + 1];
      img.data[i * 4 + 2] = champ.couleur[i * 3 + 2];
      img.data[i * 4 + 3] = 255;
    }
    pc.putImageData(img, 0, 0);
    const c = document.createElement("canvas");
    c.width = c.height = T2;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(petit, 0, 0, T2, T2);
    const X = (x) => (x + demi) * k;
    // des petites touches de couleur partout (des fleurs, des cailloux, des trous d'obus près du village)
    for (let i = 0; i < 26000; i++) {
      const x = hasard() * T2, y = hasard() * T2, r = 0.5 + hasard() * 1.4;
      const sombre = hasard() < 0.55;
      ctx.fillStyle = sombre ? "rgba(30,38,18," + (0.03 + hasard() * 0.06) + ")" : "rgba(200,200,140," + (0.03 + hasard() * 0.06) + ")";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const v of T.villages) for (let i = 0; i < Math.round(v.rayon * 0.5); i++) { // des trous d'obus
      const a = hasard() * Math.PI * 2, d = Math.sqrt(hasard()) * v.rayon * 1.6, x = X(v.x + Math.cos(a) * d), y = X(v.z + Math.sin(a) * d), r = (1.5 + hasard() * 2.5) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(40,32,22,0.75)");
      g.addColorStop(0.6, "rgba(70,56,40,0.5)");
      g.addColorStop(1, "rgba(110,92,66,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // les chemins : le bord usé, la terre, les 2 ornières plus sombres, l'herbe au milieu
    const L = BE.chemins.largeur * k;
    const tracer = (l, largeur, style) => {
      ctx.strokeStyle = style;
      ctx.lineWidth = largeur;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath();
      l.forEach(([x, z], i) => (i ? ctx.lineTo(X(x), X(z)) : ctx.moveTo(X(x), X(z))));
      ctx.stroke();
    };
    for (const l of lignes) tracer(l, L * 1.9, "rgba(104,98,62,0.35)");
    for (const l of lignes) tracer(l, L, "rgb(" + COUL.chemin.join(",") + ")");
    for (const l of lignes) tracer(l, L * 0.78, "rgba(98,80,56,0.55)");
    for (const l of lignes) tracer(l, L * 0.42, "rgba(132,114,82,0.9)");
    for (const l of lignes) tracer(l, L * 0.16, "rgba(104,112,62,0.55)");
    // ✍️ (étape 81) les RUES de la ville : du bitume gris, un trottoir plus clair de chaque côté, une ligne blanche au milieu
    const Q = VAR.quartier;
    if (Q) {
      for (const l of T.rues) tracer(l, (Q.rue + 3) * k, "rgba(150,148,142,0.95)");
      for (const l of T.rues) tracer(l, Q.rue * k, VAR.rues || "#5a5c60");
      if (!VAR.toitPlat) for (const l of T.rues) tracer(l, 0.25 * k, "rgba(225,225,215,0.6)");
      // (des trous d'obus en plus dans la ville en ruines)
      for (let i = 0; i < Q.rayon * (VAR.trous || 0); i++) {
        const a = hasard() * Math.PI * 2, d = Math.sqrt(hasard()) * Q.rayon, x = X(Q.x + Math.cos(a) * d), y = X(Q.z + Math.sin(a) * d), r = (1.5 + hasard() * 3) * k;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(30,28,26,0.8)");
        g.addColorStop(1, "rgba(60,58,54,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    bilan.imageSol = T2;
    return t;
  }
  // 4. L'image de DÉTAIL (512 × 512, répétée) : dans le rouge, des brins d'herbe ; dans le vert, des cailloux et du grain
  //    de terre. 128 = « ne change rien » ; plus clair ou plus sombre = la marque d'un brin ou d'un caillou.
  function imageDetail() {
    const T2 = 512, faire = (peindre) => {
      const c = document.createElement("canvas");
      c.width = c.height = T2;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "rgb(128,128,128)";
      ctx.fillRect(0, 0, T2, T2);
      peindre(ctx);
      return ctx.getImageData(0, 0, T2, T2).data;
    };
    const autour = (ctx, dessin) => { for (const dx of [-T2, 0, T2]) for (const dy of [-T2, 0, T2]) dessin(dx, dy); };
    const herbe = faire((ctx) => {
      for (let i = 0; i < 9000; i++) {
        const x = hasard() * T2, y = hasard() * T2, l = 6 + hasard() * 16, a = -Math.PI / 2 + (hasard() - 0.5) * 1.3, v = Math.floor(70 + hasard() * 130);
        ctx.strokeStyle = "rgba(" + v + "," + v + "," + v + "," + (0.35 + hasard() * 0.5) + ")";
        ctx.lineWidth = 0.8 + hasard() * 1.4;
        autour(ctx, (dx, dy) => (ctx.beginPath(), ctx.moveTo(x + dx, y + dy), ctx.quadraticCurveTo(x + dx + Math.cos(a) * l * 0.5 + 2, y + dy + Math.sin(a) * l * 0.5, x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l), ctx.stroke()));
      }
    });
    const terre = faire((ctx) => {
      for (let i = 0; i < 26000; i++) {
        const x = hasard() * T2, y = hasard() * T2, v = Math.floor(60 + hasard() * 150);
        ctx.fillStyle = "rgba(" + v + "," + v + "," + v + "," + (0.25 + hasard() * 0.4) + ")";
        ctx.fillRect(x, y, 1 + hasard() * 2, 1 + hasard() * 2);
      }
      for (let i = 0; i < 1400; i++) { // des cailloux : un côté clair (le soleil), une ombre en dessous
        const x = hasard() * T2, y = hasard() * T2, r = 1.5 + hasard() * 4;
        autour(ctx, (dx, dy) => {
          ctx.fillStyle = "rgba(40,40,40,0.5)";
          ctx.beginPath(); ctx.ellipse(x + dx + 0.8, y + dy + 1, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(" + (150 + Math.floor(hasard() * 70)) + ",150,150,0.85)";
          ctx.beginPath(); ctx.ellipse(x + dx, y + dy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        });
      }
    });
    // (demande 93) dans le bleu : un bruit très doux, qui se répète parfaitement (4 puis 8 cases par image), pour les
    // grandes TACHES du sol (le peintre le lit en très grand : une image = 55 m ou 170 m)
    const taches = new Uint8Array(T2 * T2), cases = (n, graine) => {
      const h = (i, j) => { let k = Math.imul(((i % n) + n) % n, 374761393) + Math.imul(((j % n) + n) % n, 668265263) + graine; k = Math.imul(k ^ (k >>> 13), 1274126177); return ((k ^ (k >>> 16)) >>> 0) / 4294967295; };
      return (u, v) => { const x = u * n, y = v * n, i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        return (h(i, j) * (1 - sx) + h(i + 1, j) * sx) * (1 - sy) + (h(i, j + 1) * (1 - sx) + h(i + 1, j + 1) * sx) * sy; };
    };
    const b1 = cases(4, 911), b2 = cases(8, 913), b3 = cases(16, 917);
    for (let y = 0; y < T2; y++) for (let x = 0; x < T2; x++) taches[y * T2 + x] = Math.round((b1(x / T2, y / T2) * 0.55 + b2(x / T2, y / T2) * 0.3 + b3(x / T2, y / T2) * 0.15) * 255);
    const data = new Uint8Array(T2 * T2 * 4);
    for (let i = 0; i < T2 * T2; i++) {
      data[i * 4] = herbe[i * 4];
      data[i * 4 + 1] = terre[i * 4];
      data[i * 4 + 2] = taches[i]; // (demande 93) les grandes taches du sol (un bruit doux qui se répète)
      data[i * 4 + 3] = 255;
    }
    const t = new THREE.DataTexture(data, T2, T2, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.needsUpdate = true;
    bilan.detailSol = T2;
    return t;
  }

  // (demande 96) les réglages du sol qui suivent le niveau de qualité (appelé par la scène)
  let matiereSol = null;
  const solFin = { value: 1 };
  function qualiteSol(n) {
    solFin.value = n.solFin === false ? 0 : 1;
    const t = matiereSol && matiereSol.map, a = n.anisotropie || 8;
    if (t && t.anisotropy !== a) (t.anisotropy = a), (t.needsUpdate = true);
    bilan.solLeger = !solFin.value;
    bilan.anisotropie = a;
  }

  function sol(groupe) {
    const taille = C.monde.taille, n = Math.round(taille / C.monde.sol), geo = new THREE.PlaneGeometry(taille, taille, n, n);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, T.hauteurExacte(x, z));
      uv.setXY(i, (x + demi) / taille, (z + demi) / taille); // (étape 74 : toute la carte = toute la grande image)
    }
    geo.computeVertexNormals();
    peindreChamp();
    const lignes = tousLesChemins();
    marquerChemins(lignes);
    bilan.chemins = BE.chemins.lignes.length;
    const detail = imageDetail();
    // (étape 72) Le sol en TUILES : toutes les tuiles partagent les mêmes sommets (aucune couture), mais chacune a sa
    // liste de triangles : la carte graphique peut sauter les tuiles derrière la caméra, ou trop loin.
    const matiere = new THREE.MeshStandardMaterial({ map: grandeImage(lignes), roughness: 0.96, metalness: 0 });
    matiereSol = matiere;
    // (étape 74) le DÉTAIL, ajouté au « peintre » de la carte graphique (son programme, le « shader »)
    matiere.onBeforeCompile = (sh) => {
      sh.uniforms.detailSol = { value: detail };
      sh.uniforms.detailEchelle = { value: new THREE.Vector2(1 / BE.sol.detail, 1 / BE.sol.detailLoin) };
      sh.uniforms.detailFondu = { value: new THREE.Vector2(BE.sol.fondu[0], BE.sol.fondu[1]) };
      sh.uniforms.detailCasse = { value: new THREE.Vector2(1 / C.realisme.sol.detail.casse, C.realisme.sol.detail.pente) };
      sh.uniforms.detailTaches = { value: new THREE.Vector3(1 / C.realisme.sol.taches.echelle[0], 1 / C.realisme.sol.taches.echelle[1], C.realisme.sol.taches.force) }; // (demande 93)
      sh.uniforms.detailFin = solFin; // (demande 96 : 1 = les images de détail en plus ; 0 = on les saute, c'est plus léger)
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vSolMonde;\nvarying float vSolDist;")
        .replace("#include <common>", "#include <common>\nvarying float vSolPente;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvSolMonde = position;\nvSolDist = -mvPosition.z;\nvSolPente = 1.0 - normal.y;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D detailSol;\nuniform vec2 detailEchelle;\nuniform vec2 detailFondu;\nuniform vec2 detailCasse;\nuniform vec3 detailTaches;\nuniform float detailFin;\nvarying vec3 vSolMonde;\nvarying float vSolDist;\nvarying float vSolPente;")
        .replace("#include <map_fragment>", [
          "#include <map_fragment>",
          "{",
          "  vec2 p = vSolMonde.xz;",
          "  vec4 dA = texture2D(detailSol, p * detailEchelle.x);",
          "  vec4 dB = texture2D(detailSol, mat2(0.8, -0.6, 0.6, 0.8) * p * detailEchelle.y);",
          "  float terre = clamp((diffuseColor.r - diffuseColor.g) * 14.0 + 0.4, 0.0, 1.0);", // (plus rouge que vert : de la terre)
          "  float pres = 1.0 - smoothstep(detailFondu.x, detailFondu.y, vSolDist);",
          // (demande 92) une 2e image de détail, tournée et plus grande, mélangée à la 1re : on ne voit plus la répétition
          // (demande 96) aux niveaux légers (detailFin = 0), la carte graphique saute ces 3 images en plus (le « if » sur un
          // réglage commun à tout l'écran ne coûte presque rien)
          "  if (detailFin > 0.5) {",
          "  vec4 dC = texture2D(detailSol, mat2(0.6, 0.8, -0.8, 0.6) * p * detailCasse.x + 0.37);",
          "  float melange = smoothstep(0.3, 0.7, dB.r * 0.5 + dC.g * 0.5);",
          "  dA = mix(dA, dC, melange * 0.5);",
          "  }",
          "  float dPres = mix(dA.r, dA.g, terre) * 2.0, dLoin = mix(dB.r, dB.g, terre) * 2.0;",
          "  diffuseColor.rgb *= mix(mix(1.0, dLoin, 0.45), dPres * mix(1.0, dLoin, 0.35), pres);",
          // (demande 93) les grandes TACHES : plus sombre et plus vert (humide) ici, plus jaune (sec) là
          "  float tache = texture2D(detailSol, p * detailTaches.x).b;",
          "  if (detailFin > 0.5) tache = tache * 0.6 + texture2D(detailSol, mat2(0.8, 0.6, -0.6, 0.8) * p * detailTaches.y + 0.5).b * 0.4;",
          "  tache = smoothstep(0.25, 0.75, tache) - 0.5;",
          "  diffuseColor.rgb *= 1.0 + detailTaches.z * (tache < 0.0 ? vec3(0.5, 0.25, 0.55) * tache * 1.6 : vec3(0.35, 0.22, -0.15) * tache * 1.6) * (1.0 - terre * 0.5);",
          // (demande 92) les PENTES : plus sombres, et la terre y apparaît (l'herbe tient mal)
          "  float pente = smoothstep(0.03, 0.25, vSolPente) * detailCasse.y;",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.82, 0.7), pente * 0.6) * (1.0 - pente * 0.18);",
          "}",
        ].join("\n"));
    };
    const idx = geo.index.array, parTuile = [];
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const k = numeroMorceau((p.getX(a) + p.getX(b) + p.getX(c)) / 3, (p.getZ(a) + p.getZ(b) + p.getZ(c)) / 3);
      (parTuile[k] = parTuile[k] || []).push(a, b, c);
    }
    // (demande 96, « ça rame ») chaque tuile reçoit SA PROPRE petite copie des sommets qu'elle utilise (les mêmes nombres :
    // toujours aucune couture). Avant, chaque tuile pointait vers les 177 000 sommets de toute la carte, et certaines cartes
    // graphiques (celles qui calculent sans vraie carte graphique, ou les plus simples) les recalculaient TOUS à chaque tuile.
    for (const listeGlobale of parTuile) {
      if (!listeGlobale) continue;
      const g = new THREE.BufferGeometry(), nouveau = new Map(), liste = [];
      for (const i of listeGlobale) {
        let k = nouveau.get(i);
        if (k === undefined) nouveau.set(i, (k = nouveau.size));
        liste.push(k);
      }
      for (const [nom, t] of [["position", 3], ["normal", 3], ["uv", 2]]) {
        const source = geo.attributes[nom].array, tab = new Float32Array(nouveau.size * t);
        for (const [i, k] of nouveau) for (let c = 0; c < t; c++) tab[k * t + c] = source[i * t + c];
        g.setAttribute(nom, new THREE.BufferAttribute(tab, t));
      }
      g.setIndex(liste);
      const boite = new THREE.Box3(), v = new THREE.Vector3();
      for (const i of listeGlobale) boite.expandByPoint(v.fromBufferAttribute(p, i));
      g.boundingBox = boite;
      g.boundingSphere = boite.getBoundingSphere(new THREE.Sphere());
      const m = new THREE.Mesh(g, matiere);
      m.receiveShadow = true;
      ajouterMorceau(groupe, m);
    }
  }

  // ------------------------------------------------------------------ (étape 74) LES ARBRES
  // Un feuillu : un tronc qui s'affine (avec le pied plus large), 4 grosses branches, et 7 GRAPPES de feuillage (des
  // boules bosselées par du bruit). Astuce des jeux vidéo : la lumière sur le feuillage est calculée comme si l'arbre
  // était une grosse boule douce (les « normales » pointent vers l'extérieur de tout l'arbre) : ça donne un volume
  // tout rond et doux, au lieu de petites facettes. Dessous et dedans, c'est plus sombre (moins de lumière y entre).
  const bruitArbre = Tanks.Bruit.creer(7474);
  const bosse = (x, y, z) => bruitArbre(x * 1.3 + z * 0.7, y * 1.3 - z * 0.5) * 0.6 + bruitArbre(x * 3.1 - y, z * 3.1) * 0.25;
  const lin = (r, g, b) => new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
  // Recoller des formes (toutes avec position, normal, uv, color) en une seule.
  function fusion(geos) {
    const out = new THREE.BufferGeometry();
    for (const [nom, t] of [["position", 3], ["normal", 3], ["uv", 2], ["color", 3]]) {
      const tab = new Float32Array(geos.reduce((s, g) => s + g.attributes.position.count * t, 0));
      let k = 0;
      for (const g of geos) {
        const a = g.attributes[nom], n = g.attributes.position.count;
        if (a) tab.set(a.array.subarray(0, n * t), k);
        k += n * t;
      }
      out.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    out.computeBoundingSphere();
    return out;
  }
  function peindre(g, f) { // f(x, y, z, nx, ny, nz) → THREE.Color
    const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const col = f(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i));
      (c[i * 3] = col.r), (c[i * 3 + 1] = col.g), (c[i * 3 + 2] = col.b);
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
  }
  const ECORCE = lin(118, 98, 76), ECORCE_PIN = lin(124, 88, 62), FEUILLE = lin(112, 150, 66), AIGUILLE = lin(74, 116, 62);
  function tronc(points, seg) {
    const g = new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), seg).toNonIndexed();
    return peindre(g, (x, y) => ECORCE.clone().multiplyScalar(0.62 + 0.38 * Math.min(1, y / 2.5)));
  }
  function branche(y, angle, longueur, penche) {
    const g = new THREE.CylinderGeometry(0.035, 0.1, longueur, 6, 1, true).translate(0, longueur / 2, 0);
    g.rotateZ(-penche);
    g.rotateY(angle);
    g.translate(0, y, 0);
    return peindre(g.toNonIndexed(), () => ECORCE.clone().multiplyScalar(0.9));
  }
  const GRAPPES = [[0, 5.5, 0, 2.35], [1.5, 4.95, 0.5, 1.65], [-1.3, 5.1, -0.7, 1.7], [0.3, 6.75, -0.4, 1.6], [-0.6, 6.35, 1.05, 1.5], [0.95, 4.5, -1.35, 1.35], [-1.45, 4.45, 0.95, 1.3]];
  function feuillage(grappes, seg, centre) {
    const geos = [], n0 = new THREE.Vector3(), d = new THREE.Vector3();
    grappes.forEach(([cx, cy, cz, r], k) => {
      const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), b = 1 + 0.2 * bosse(x + k * 3.1, y + k, z);
        p.setXYZ(i, cx + x * r * b, cy + y * r * b * 0.86, cz + z * r * b);
      }
      g.computeVertexNormals();
      const nn = g.attributes.normal;
      for (let i = 0; i < p.count; i++) { // (la normale : moitié celle de la grappe, moitié celle de tout l'arbre)
        n0.fromBufferAttribute(nn, i);
        d.set(p.getX(i) - centre[0], (p.getY(i) - centre[1]) * 1.2, p.getZ(i) - centre[2]).normalize();
        n0.multiplyScalar(0.4).addScaledVector(d, 0.6).normalize();
        nn.setXYZ(i, n0.x, n0.y, n0.z);
      }
      const teinte = 0.92 + 0.16 * hasardIci(k, 3);
      geos.push(peindre(g.toNonIndexed(), (x, y, z, nx, ny) => {
        const dedans = Math.hypot(x - centre[0], z - centre[2]) / 3.2, haut = (y - centre[1] + 2.4) / 4.2;
        const ao = 0.62 + 0.32 * Math.max(0, Math.min(1, haut)) + 0.12 * Math.min(1, dedans) + 0.08 * ny;
        return FEUILLE.clone().multiplyScalar(ao * teinte);
      }));
    });
    return geos;
  }
  // Les BEAUX arbres (de près) et les arbres SIMPLES (de loin).
  function geoFeuilluTronc() {
    const geos = [tronc([[0.001, 0], [0.44, 0], [0.32, 0.3], [0.25, 1.4], [0.21, 2.8], [0.14, 4.3], [0.06, 5.4]], 10)];
    for (const [y, a, l, p] of [[2.6, 0.3, 2.0, 0.9], [3.0, 2.2, 1.8, 0.8], [3.3, 4.1, 1.9, 0.85], [3.7, 5.4, 1.5, 0.6]]) geos.push(branche(y, a, l, p));
    return fusion(geos);
  }
  const geoFeuilluFeuilles = () => fusion(feuillage(GRAPPES, 14, [0, 5.6, 0]));
  function geoSapin(tiges) { // le sapin : des ÉTAGES de branches (des cônes creux qui tombent, au bord dentelé)
    const geos = [];
    for (let k = 0; k < 6; k++) {
      const yb = 1.7 + k * 1.28, r = 2.55 - k * 0.38, h = 2.35 - k * 0.15;
      const g = new THREE.LatheGeometry([[0.2, yb + 0.6], [r * 0.95, yb + 0.02], [r, yb + 0.14], [r * 0.55, yb + h * 0.42], [0.03, yb + h]].map(([a, b]) => new THREE.Vector2(a, b)), tiges);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
        if (d < r * 0.7) continue;
        const a = Math.atan2(z, x), f = 1 + 0.13 * Math.sin(a * 9 + k * 1.7) + 0.06 * Math.sin(a * 23 + k);
        p.setXYZ(i, x * f, p.getY(i) - (f - 1) * 0.9, z * f);
      }
      g.computeVertexNormals();
      geos.push(peindre(g.toNonIndexed(), (x, y, z, nx, ny) => {
        const bord = Math.hypot(x, z) / r, dessous = ny < 0 ? 0.55 : 1;
        return AIGUILLE.clone().multiplyScalar((0.62 + 0.3 * (k / 5) + 0.25 * bord) * dessous);
      }));
    }
    return fusion(geos);
  }
  const geoSapinTronc = () => fusion([tronc([[0.001, 0], [0.32, 0], [0.22, 0.4], [0.17, 3], [0.1, 7], [0.03, 9.6]], 8)]);
  function geoFeuilluSimple() {
    const t = peindre(new THREE.CylinderGeometry(0.16, 0.3, 4.4, 5).translate(0, 2.2, 0).toNonIndexed(), () => ECORCE);
    return fusion([t].concat(feuillage([[0, 5.5, 0, 2.5], [1.0, 4.9, -0.6, 1.6], [-0.9, 5.0, 0.8, 1.6]], 8, [0, 5.4, 0])));
  }
  function geoSapinSimple() {
    const t = peindre(new THREE.CylinderGeometry(0.08, 0.26, 4, 5).translate(0, 2, 0).toNonIndexed(), () => ECORCE_PIN);
    const geos = [t];
    for (let k = 0; k < 3; k++) geos.push(peindre(new THREE.ConeGeometry(2.4 - k * 0.65, 3.4 - k * 0.3, 8, 1, true).translate(0, 3.3 + k * 2.1, 0).toNonIndexed(), (x, y, z, nx, ny) => AIGUILLE.clone().multiplyScalar(0.7 + 0.12 * k + (ny < 0 ? -0.2 : 0))));
    return fusion(geos);
  }
  // les images : l'écorce (des rainures verticales), les feuilles (des petites taches claires et sombres), les aiguilles
  function texture(taille, peindreImage, rx, ry) {
    const t = image(taille, peindreImage);
    t.repeat.set(rx, ry);
    return t;
  }
  function arbres(groupe) {
    const n = T.arbres.length;
    const ecorce = texture(128, (ctx, t) => {
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 160; i++) {
        const x = hasard() * t, v = Math.floor(110 + hasard() * 110);
        ctx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.55)";
        ctx.fillRect(x, 0, 1 + hasard() * 3, t);
      }
      for (let i = 0; i < 300; i++) ctx.fillRect(hasard() * t, hasard() * t, 4 + hasard() * 6, 1);
    }, 3, 2);
    const feuilles = texture(256, (ctx, t) => {
      ctx.fillStyle = "#cfcfcf";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 2600; i++) {
        const x = hasard() * t, y = hasard() * t, r = 2 + hasard() * 5, v = Math.floor(130 + hasard() * 125);
        ctx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.8)";
        for (const dx of [-t, 0, t]) for (const dy of [-t, 0, t]) {
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, r, r * 0.6, hasard() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (let i = 0; i < 500; i++) (ctx.fillStyle = "rgba(20,20,20,0.35)"), ctx.fillRect(hasard() * t, hasard() * t, 2 + hasard() * 3, 2 + hasard() * 3);
    }, 5, 3);
    const aiguilles = texture(128, (ctx, t) => {
      ctx.fillStyle = "#a8a8a8";
      ctx.fillRect(0, 0, t, t);
      for (let i = 0; i < 900; i++) {
        const x = hasard() * t, y = hasard() * t, v = Math.floor(80 + hasard() * 175);
        ctx.strokeStyle = "rgba(" + v + "," + v + "," + v + ",0.8)";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (hasard() - 0.5) * 4, y + 6 + hasard() * 8);
        ctx.stroke();
      }
    }, 8, 2);
    const matEcorce = new THREE.MeshStandardMaterial({ vertexColors: true, map: ecorce, roughness: 0.95 });
    const matFeuilles = new THREE.MeshStandardMaterial({ vertexColors: true, map: feuilles, roughness: 0.82 });
    const matAiguilles = new THREE.MeshStandardMaterial({ vertexColors: true, map: aiguilles, roughness: 0.88, side: THREE.DoubleSide });
    const matSimple = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const lot = (geo, mat, ombre) => {
      const m = new THREE.InstancedMesh(geo, mat, n);
      m.count = 0;
      m.castShadow = ombre;
      m.receiveShadow = true;
      groupe.add(m);
      return m;
    };
    pres = { troncs: lot(geoFeuilluTronc(), matEcorce, true), feuilles: lot(geoFeuilluFeuilles(), matFeuilles, true), troncsSapins: lot(geoSapinTronc(), matEcorce, true), sapins: lot(geoSapin(18), matAiguilles, true) };
    arbresFeuilles = lot(geoFeuilluSimple(), matSimple, false);
    sapins = lot(geoSapinSimple(), matSimple, false);
    T.arbres.forEach((a, i) => {
      const h = hasard(), jaune = hasard() < 0.15 ? 0.12 : 0;
      couleursArbres[i] = a.sorte === "feuillu" ? new THREE.Color(0.86 + h * 0.26 + jaune, 0.88 + hasard() * 0.22 + jaune * 0.5, 0.82 + hasard() * 0.2) : new THREE.Color(0.86 + h * 0.2, 0.9 + hasard() * 0.18, 0.88 + hasard() * 0.18);
      matricesArbres[i] = new THREE.Matrix4();
      etatArbre[i] = null;
    });
    for (const m of [pres.feuilles, pres.sapins, arbresFeuilles, sapins]) m.setColorAt(0, new THREE.Color(1, 1, 1));
    majArbres(true);
  }

  // Les arbres debout ou couchés (on ne refait que ceux qui ont changé).
  const matricesArbres = [], couleursArbres = [];
  let arbresARanger = true;
  const q = new THREE.Quaternion(), qc = new THREE.Quaternion(), v3 = new THREE.Vector3(), un = new THREE.Vector3(), axeY = new THREE.Vector3(0, 1, 0), axeChute = new THREE.Vector3();
  function majArbres(tout) {
    const arbres = T.arbres;
    for (let i = 0; i < arbres.length; i++) {
      const a = arbres[i];
      if (!tout && etatArbre[i] === a.ecrase) continue;
      etatArbre[i] = a.ecrase;
      arbresARanger = true;
      q.setFromAxisAngle(axeY, i * 1.7);
      if (a.ecrase) {
        // couché dans le sens où le tank l'a poussé
        qc.setFromAxisAngle(axeChute.set(-Math.sin(a.angleChute), 0, Math.cos(a.angleChute)), -Math.PI / 2 + 0.08);
        q.premultiply(qc);
      }
      v3.set(a.x, T.hauteur(a.x, a.z) - 0.1, a.z);
      un.setScalar(a.taille);
      matricesArbres[i].compose(v3, q, un);
    }
  }

  // (étape 72) Ce qu'on dessine selon la place de la caméra : les morceaux du décor à moins de « distance » (et devant
  // la caméra : ça, la carte graphique le vérifie toute seule), et les arbres à moins de « distance ».
  // Les arbres sont des « instances » : on remplit la liste avec seulement les arbres proches (on la refait quand la
  // caméra a bougé de plus de 10 m, ou qu'un arbre a été écrasé). (Étape 74 : à moins de « detail » m, les beaux arbres.)
  let dernierX = 1e9, dernierZ = 1e9, derniereDistance = -1, dernierDetail = -1;
  function majDistance(position, distance, detail) {
    let vus = 0;
    for (const m of morceaux) {
      const d = Math.hypot(m.x - position.x, m.z - position.z) - m.rayon;
      m.objet.visible = d < distance;
      if (m.objet.visible) vus++;
    }
    bilan.morceaux = morceaux.length;
    bilan.morceauxVus = vus;
    if (!pres) return;
    detail = detail || 0;
    if (!arbresARanger && distance === derniereDistance && detail === dernierDetail && Math.hypot(position.x - dernierX, position.z - dernierZ) < 8) return;
    arbresARanger = false;
    (dernierX = position.x), (dernierZ = position.z), (derniereDistance = distance), (dernierDetail = detail);
    const arbres = T.arbres, d2 = (distance + 10) * (distance + 10), p2 = detail * detail;
    let nf = 0, ns = 0, bf = 0, bs = 0;
    for (let i = 0; i < arbres.length; i++) {
      const a = arbres[i], dx = a.x - position.x, dz = a.z - position.z, dd = dx * dx + dz * dz;
      if (dd > d2) continue;
      const beau = dd < p2;
      if (a.sorte === "feuillu") {
        if (beau) {
          pres.troncs.setMatrixAt(bf, matricesArbres[i]);
          pres.feuilles.setMatrixAt(bf, matricesArbres[i]);
          pres.feuilles.setColorAt(bf++, couleursArbres[i]);
        } else {
          arbresFeuilles.setMatrixAt(nf, matricesArbres[i]);
          arbresFeuilles.setColorAt(nf++, couleursArbres[i]);
        }
      } else if (beau) {
        pres.troncsSapins.setMatrixAt(bs, matricesArbres[i]);
        pres.sapins.setMatrixAt(bs, matricesArbres[i]);
        pres.sapins.setColorAt(bs++, couleursArbres[i]);
      } else {
        sapins.setMatrixAt(ns, matricesArbres[i]);
        sapins.setColorAt(ns++, couleursArbres[i]);
      }
    }
    pres.troncs.count = pres.feuilles.count = bf;
    pres.troncsSapins.count = pres.sapins.count = bs;
    arbresFeuilles.count = nf;
    sapins.count = ns;
    for (const m of [pres.troncs, pres.feuilles, pres.troncsSapins, pres.sapins, arbresFeuilles, sapins]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
      m.boundingSphere = null; // (la carte graphique recalculera la bulle qui entoure ces arbres)
    }
    bilan.arbres = arbres.length;
    bilan.arbresVus = nf + ns + bf + bs;
    bilan.arbresBeaux = bf + bs;
  }

  // ------------------------------------------------------------------ (étape 74) L'HERBE EN TOUFFES
  // Une touffe = 3 petites images de brins d'herbe croisées (vues de n'importe quel côté, elle a l'air pleine). On ne
  // les met qu'autour de la caméra (au-delà, on ne les verrait pas), une par case de 1,3 m, au hasard dans la case mais
  // TOUJOURS au même endroit (le hasard dépend de la case : quand tu reviens, l'herbe est la même). Pas sur la terre,
  // les chemins, le sable ni l'eau. Toutes les touffes = 1 seul dessin (des instances). Elles se balancent dans le vent.
  let herbe = null, matHerbe = null, tempsVent = 0;
  const bruitHerbe = Tanks.Bruit.creer(7475);
  let herbeX = 1e9, herbeZ = 1e9, herbeR = -1;
  // (demande 93) ✍️ « Fais un peu plus réaliste » : l'herbe est plus DENSE (des cases plus petites, selon la qualité),
  // plus HAUTE et plus VARIÉE : 4 sortes de touffes peintes sur une même image (2 × 2) : des brins fins et hauts, de
  // larges feuilles, de l'herbe SÈCHE avec ses épis, de petites touffes courbées. Chaque touffe en prend une au hasard,
  // et elle est plus ou moins sèche (paille) selon de grandes plaques. Et de petits CAILLOUX (en 3D) sont semés autour
  // de la caméra, plus nombreux sur la terre et les chemins. Toujours 1 dessin pour toutes les touffes, 1 pour les cailloux.
  const RH = C.realisme.sol.herbe;
  const caseHerbe = () => RH.case[Tanks.Qualite ? Tanks.Qualite.niveau : 1] || BE.herbe.case;
  const bruitSec = Tanks.Bruit.creer(7476);
  function touffes(groupe) {
    const H = BE.herbe, max = Math.ceil(C.qualite.niveaux.reduce((m, n, k) => Math.max(m, Math.PI * Math.pow((n.herbe || 0) / (RH.case[k] || H.case), 2)), 0) * 1.08) + 16;
    const c = document.createElement("canvas"), N = 128;
    c.width = c.height = N * 2;
    const ctx = c.getContext("2d");
    // un brin : de la base (x, bas) vers la pointe, courbé, plus clair en haut
    const brin = (ox, oy, x, haut, pen, l, v, sec) => {
      const g = ctx.createLinearGradient(0, oy + N, 0, oy + N - haut);
      const t = (k) => "rgb(" + Math.floor(v * (k + sec * 0.25)) + "," + Math.floor(v * (k + 0.04)) + "," + Math.floor(v * (k - 0.2 + sec * 0.05)) + ")";
      g.addColorStop(0, t(0.55));
      g.addColorStop(0.5, t(0.85));
      g.addColorStop(1, t(1));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox + x - l, oy + N - 2);
      ctx.quadraticCurveTo(ox + x - l * 0.3 + pen * 0.2, oy + N - haut * 0.55, ox + x + pen, oy + N - haut);
      ctx.quadraticCurveTo(ox + x + l * 0.3 + pen * 0.2, oy + N - haut * 0.55, ox + x + l, oy + N - 2);
      ctx.fill();
    };
    const sortes = [
      { n: 60, haut: [50, 122], pen: 36, l: [0.9, 1.8], sec: 0 }, // 0 : des brins fins et hauts
      { n: 22, haut: [40, 95], pen: 50, l: [2.6, 4.6], sec: 0 }, // 1 : de larges feuilles
      { n: 44, haut: [60, 124], pen: 22, l: [0.8, 1.5], sec: 1, epis: true }, // 2 : l'herbe sèche, avec ses épis
      { n: 50, haut: [22, 70], pen: 60, l: [1.2, 2.4], sec: 0.4 }, // 3 : une petite touffe courbée
    ];
    sortes.forEach((S, k) => {
      const ox = (k % 2) * N, oy = Math.floor(k / 2) * N;
      ctx.save();
      ctx.beginPath();
      ctx.rect(ox + 3, oy + 3, N - 6, N - 6); // (une marge : pas de bavure d'une image à l'autre)
      ctx.clip();
      for (let i = 0; i < S.n; i++) {
        const x = 14 + Math.pow(hasard(), 0.9) * (N - 28) * (0.5 + hasard() * 0.5) + (hasard() < 0.5 ? 0 : (N - 28) * 0.25 * hasard());
        const haut = S.haut[0] + hasard() * (S.haut[1] - S.haut[0]), pen = (hasard() - 0.5) * S.pen, l = S.l[0] + hasard() * (S.l[1] - S.l[0]);
        const v = Math.floor(165 + hasard() * 90);
        brin(ox, oy, x, haut, pen, l, v, S.sec * (0.6 + hasard() * 0.4));
        if (S.epis && hasard() < 0.45) { // l'épi : une petite grappe au bout du brin
          ctx.fillStyle = "rgb(" + Math.floor(v * 1.0) + "," + Math.floor(v * 0.88) + "," + Math.floor(v * 0.6) + ")";
          for (let e = 0; e < 7; e++) ctx.fillRect(ox + x + pen - 1.5 + (hasard() - 0.5) * 3, oy + N - haut + e * 2.2, 2.4, 2.6);
        }
      }
      ctx.restore();
    });
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const geos = [];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.PlaneGeometry(H.largeur, H.hauteur).translate(0, H.hauteur / 2, 0).rotateY((k * Math.PI) / 3).toNonIndexed();
      const n = g.attributes.normal;
      for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); // (éclairée comme le sol : elle s'y fond)
      geos.push(g);
      // (et l'autre face, retournée, mais éclairée pareil : vue de derrière, une touffe n'est pas noire)
      const dos = g.clone(), pp = dos.attributes.position.array, uu = dos.attributes.uv.array;
      for (let t = 0; t < pp.length; t += 9) for (let c = 0; c < 3; c++) [pp[t + 3 + c], pp[t + 6 + c]] = [pp[t + 6 + c], pp[t + 3 + c]];
      for (let t = 0; t < uu.length; t += 6) for (let c = 0; c < 2; c++) [uu[t + 2 + c], uu[t + 4 + c]] = [uu[t + 4 + c], uu[t + 2 + c]];
      geos.push(dos);
    }
    const geo = new THREE.BufferGeometry();
    for (const [nom, t] of [["position", 3], ["normal", 3], ["uv", 2]]) {
      const tab = new Float32Array(geos.reduce((s, g) => s + g.attributes[nom].array.length, 0));
      let k = 0;
      for (const g of geos) (tab.set(g.attributes[nom].array, k), (k += g.attributes[nom].array.length));
      geo.setAttribute(nom, new THREE.BufferAttribute(tab, t));
    }
    varianteHerbe = new THREE.InstancedBufferAttribute(new Float32Array(max), 1);
    geo.setAttribute("variante", varianteHerbe);
    matHerbe = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.45, roughness: 1 });
    const vent = { value: 0 };
    matHerbe.userData.vent = vent;
    matHerbe.onBeforeCompile = (sh) => {
      sh.uniforms.tempsVent = vent;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float tempsVent;\nattribute float variante;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\n  vMapUv = vMapUv * 0.5 + vec2(mod(variante, 2.0), floor(variante / 2.0 + 0.01)) * 0.5;\n#endif")
        .replace("#include <begin_vertex>", [
        "#include <begin_vertex>",
        "#ifdef USE_INSTANCING",
        "  vec3 pied = instanceMatrix[3].xyz;",
        "  float h = max(position.y, 0.0), rafale = 0.6 + 0.4 * sin(tempsVent * 0.7 + pied.x * 0.05);", // (des rafales qui passent)
        "  transformed.x += (sin(tempsVent * 1.9 + pied.x * 0.35 + pied.z * 0.21) * 0.11 + 0.05) * h * h * rafale;",
        "  transformed.z += cos(tempsVent * 1.6 + pied.x * 0.17 - pied.z * 0.3) * 0.07 * h * h * rafale;",
        "#endif",
      ].join("\n"));
    };
    herbe = new THREE.InstancedMesh(geo, matHerbe, max);
    herbe.count = 0;
    herbe.frustumCulled = false;
    herbe.castShadow = false;
    herbe.receiveShadow = true;
    herbe.setColorAt(0, new THREE.Color(1, 1, 1));
    bilan.touffesMax = max;
    groupe.add(herbe);
    // les petits CAILLOUX : une seule forme (un caillou à facettes), recopiée
    const RC = C.realisme.sol.cailloux, maxC = Math.ceil(Math.PI * Math.pow(Math.max(...RC.rayon) / RC.case, 2) * 1.05) + 8;
    const gc = new THREE.IcosahedronGeometry(1, 0), pc = gc.attributes.position;
    for (let i = 0; i < pc.count; i++) pc.setY(i, Math.max(-0.3, pc.getY(i)) * 0.62); // (aplati, le dessous enfoncé dans la terre)
    gc.computeVertexNormals();
    caillouxSol = new THREE.InstancedMesh(gc, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), maxC);
    caillouxSol.count = 0;
    caillouxSol.frustumCulled = false;
    caillouxSol.castShadow = false;
    caillouxSol.receiveShadow = true;
    caillouxSol.name = "cailloux du sol";
    caillouxSol.setColorAt(0, new THREE.Color(1, 1, 1));
    bilan.caillouxMax = maxC;
    groupe.add(caillouxSol);
  }
  let varianteHerbe = null, caillouxSol = null, caillouxX = 1e9, caillouxZ = 1e9, caillouxR = -1;
  const mH = new THREE.Matrix4(), qH = new THREE.Quaternion(), pH = new THREE.Vector3(), sH = new THREE.Vector3(), cH = new THREE.Color(), PAILLE = new THREE.Color(0.66, 0.58, 0.36), PIERRE = new THREE.Color();
  // (demande 93) Les cailloux autour de la caméra : un par case au plus (au hasard, mais toujours au même endroit).
  function majCailloux(position) {
    if (!caillouxSol) return;
    const RC = C.realisme.sol.cailloux, haut = position.y - T.hauteur(position.x, position.z) > 15;
    const rayon = haut ? 0 : RC.rayon[Tanks.Qualite ? Tanks.Qualite.niveau : 1] || 0;
    caillouxSol.visible = rayon > 0;
    if (!rayon) return void ((bilan.cailloux = 0), (caillouxR = -1));
    if (rayon === caillouxR && Math.hypot(position.x - caillouxX, position.z - caillouxZ) < BE.herbe.bouge) return;
    (caillouxX = position.x), (caillouxZ = position.z), (caillouxR = rayon);
    const K = RC.case, i0 = Math.floor((position.x - rayon) / K), i1 = Math.floor((position.x + rayon) / K), j0 = Math.floor((position.z - rayon) / K), j1 = Math.floor((position.z + rayon) / K);
    let n = 0;
    const r2 = rayon * rayon, max = caillouxSol.instanceMatrix.count;
    for (let j = j0; j <= j1 && n < max; j++) for (let i = i0; i <= i1 && n < max; i++) {
      const x = (i + hasardIci(i, j, 11)) * K, z = (j + hasardIci(i, j, 12)) * K, dx = x - position.x, dz = z - position.z;
      if (dx * dx + dz * dz > r2 || Math.abs(x) > demi - 25 || Math.abs(z) > demi - 25) continue;
      const chance = RC.chance * (1 + (1 - herbeIci(x, z)) * RC.surTerre);
      if (hasardIci(i, j, 13) > chance || T.dansLEau(x, z, 0.5)) continue;
      const t = RC.taille[0] + Math.pow(hasardIci(i, j, 14), 2.5) * (RC.taille[1] - RC.taille[0]);
      qH.setFromAxisAngle(axeY, hasardIci(i, j, 15) * Math.PI * 2);
      caillouxSol.setMatrixAt(n, mH.compose(pH.set(x, T.hauteur(x, z) - t * 0.15, z), qH, sH.set(t * (0.8 + hasardIci(i, j, 16) * 0.5), t, t * (0.7 + hasardIci(i, j, 17) * 0.5))));
      const g = 0.26 + hasardIci(i, j, 18) * 0.22; // (un gris-brun, un peu de la couleur du sol : la poussière dessus)
      couleurIci(x, z, cH).lerp(PIERRE.setRGB(g, g * 0.94, g * 0.86), 0.5);
      caillouxSol.setColorAt(n++, cH);
    }
    caillouxSol.count = n;
    caillouxSol.instanceMatrix.needsUpdate = true;
    caillouxSol.instanceColor.needsUpdate = true;
    bilan.cailloux = n;
  }
  function majHerbe(position, rayon) {
    majCailloux(position);
    if (!herbe) return;
    if (VAR.herbe === false) rayon = 0; // (étape 81 : pas d'herbe dans le désert)
    herbe.visible = rayon > 0;
    // (vue de haut, de plus de 15 m au-dessus du sol, on ne verrait que le cercle d'herbe : pas de touffes)
    if (rayon && position.y - T.hauteur(position.x, position.z) > 15) rayon = 0;
    herbe.visible = rayon > 0;
    if (!rayon) return void ((bilan.touffes = 0), (herbeR = -1), (chantierHerbe = null));
    const K = caseHerbe();
    // (demande 96) l'herbe repousse PAR MORCEAUX : un « chantier » avance de quelques rangées à chaque image (au plus
    // qualite.herbeBudget ms), dans un brouillon ; quand il est fini, on montre la nouvelle herbe d'un coup. Avant, tout
    // était refait dans la même image (jusqu'à 14 ms au niveau beau : une petite saccade tous les 3 m).
    if (!chantierHerbe) {
      if (rayon === herbeR && K === herbeK && Math.hypot(position.x - herbeX, position.z - herbeZ) < BE.herbe.bouge) return;
      (herbeX = position.x), (herbeZ = position.z), (herbeR = rayon), (herbeK = K);
      const max = herbe.instanceMatrix.count;
      if (!brouillonHerbe) brouillonHerbe = { mat: new Float32Array(max * 16), col: new Float32Array(max * 3), sorte: new Float32Array(max) };
      chantierHerbe = { x: position.x, z: position.z, rayon, K, i0: Math.floor((position.x - rayon) / K), i1: Math.floor((position.x + rayon) / K), j: Math.floor((position.z - rayon) / K), j1: Math.floor((position.z + rayon) / K), n: 0, images: 0, ms: 0 };
    }
    const ch = chantierHerbe, B = brouillonHerbe, debut = performance.now(), budget = C.qualite.herbeBudget || 1.5;
    const r2 = ch.rayon * ch.rayon, max = herbe.instanceMatrix.count, [hMin, hMax] = RH.hauteur, Kc = ch.K, cx = ch.x, cz = ch.z, R = ch.rayon;
    ch.images++;
    for (; ch.j <= ch.j1 && ch.n < max; ch.j++) {
      if (performance.now() - debut > budget) break; // (assez pour cette image : la suite à la prochaine)
      const j = ch.j;
      for (let i = ch.i0; i <= ch.i1 && ch.n < max; i++) {
        const x = (i + hasardIci(i, j, 1)) * Kc, z = (j + hasardIci(i, j, 2)) * Kc, dx = x - cx, dz = z - cz;
        if (dx * dx + dz * dz > r2 || Math.abs(x) > demi - 25 || Math.abs(z) > demi - 25) continue;
        // (l'herbe pousse en PLAQUES : plus dense ici, plus clairsemée là ; et elle s'éclaircit vers le bord du cercle)
        const vert = herbeIci(x, z) * (0.25 + 0.95 * Math.max(0, bruitHerbe(x / 9, z / 9) * 0.8 + 0.45)) * Math.min(1, 1.6 - (dx * dx + dz * dz) / r2);
        if (hasardIci(i, j, 3) > vert || T.dansLEau(x, z, 1.5)) continue;
        const bord = Math.min(1, (R - Math.sqrt(dx * dx + dz * dz)) / (R * 0.3)); // (près du bord du cercle, elles rapetissent : pas de bord net)
        const taille = (0.5 + hasardIci(i, j, 4) * 0.55) * Math.max(0.15, bord);
        // (demande 93) la sorte de touffe, et si elle est sèche (de grandes plaques de paille)
        const sec = Math.max(0, Math.min(1, (bruitSec(x / 23, z / 23) * 0.5 + 0.5 - (1 - RH.seche)) * 2.5 + (hasardIci(i, j, 8) - 0.5) * 0.6));
        const sorte = sec > 0.55 && hasardIci(i, j, 9) < 0.7 ? 2 : Math.floor(hasardIci(i, j, 10) * 3.999) % 4 === 2 ? 0 : Math.floor(hasardIci(i, j, 10) * 3.999);
        const n = ch.n++;
        B.sorte[n] = sorte;
        qH.setFromAxisAngle(axeY, hasardIci(i, j, 5) * Math.PI * 2);
        mH.compose(pH.set(x, T.hauteur(x, z) - 0.05, z), qH, sH.set(taille, taille * (hMin + hasardIci(i, j, 6) * (hMax - hMin)) * (sorte === 3 ? 0.7 : 1), taille)).toArray(B.mat, n * 16);
        couleurIci(x, z, cH).multiplyScalar(1.3 + hasardIci(i, j, 7) * 0.45).lerp(PAILLE, sec * 0.75).toArray(B.col, n * 3);
      }
    }
    ch.ms += performance.now() - debut;
    if (ch.j <= ch.j1 && ch.n < max) return; // (pas encore fini)
    // le chantier est fini : la nouvelle herbe remplace l'ancienne, d'un coup
    const n = ch.n;
    herbe.instanceMatrix.array.set(B.mat.subarray(0, n * 16));
    herbe.instanceColor.array.set(B.col.subarray(0, n * 3));
    varianteHerbe.array.set(B.sorte.subarray(0, n));
    herbe.count = n;
    herbe.instanceMatrix.needsUpdate = true;
    herbe.instanceColor.needsUpdate = true;
    varianteHerbe.needsUpdate = true;
    bilan.touffes = n;
    bilan.caseHerbe = ch.K;
    bilan.herbeImages = ch.images; // (demande 96 : en combien d'images la dernière herbe a repoussé, et combien de ms en tout)
    bilan.herbeMs = ch.ms;
    chantierHerbe = null;
  }
  let chantierHerbe = null, brouillonHerbe = null;
  let herbeK = -1;

  // (étape 62) L'eau du lac : une ellipse plate et lisse, un peu transparente, qui reflète le ciel. On lui donne de
  // petites vagues avec une « carte de bosses » (normalMap) qu'on fait glisser doucement (voir majEau).
  // (Étape 74 : une eau plus profonde et plus foncée, très lisse : elle reflète le ciel, surtout quand on la regarde de
  // loin, en rasant ; les bosses sont faites de 14 vagues de tailles et de directions différentes, qui se répètent
  // parfaitement d'un bord de l'image à l'autre.)
  let vagues = null;
  function lac(groupe) {
    const L = C.lac, n = 256, ondes = [];
    for (let k = 0; k < 14; k++) ondes.push({ fx: Math.round((hasard() - 0.5) * 16), fy: Math.round(1 + hasard() * 9) * (hasard() < 0.5 ? -1 : 1), a: 0.4 + hasard(), ph: hasard() * Math.PI * 2 });
    const bosses = document.createElement("canvas");
    bosses.width = bosses.height = n;
    const ctx = bosses.getContext("2d"), img = ctx.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      let dx = 0, dy = 0;
      for (const o of ondes) {
        const c = Math.cos(((o.fx * x + o.fy * y) / n) * Math.PI * 2 + o.ph) * o.a;
        dx += c * o.fx;
        dy += c * o.fy;
      }
      const v = new THREE.Vector3(-dx * 0.006, -dy * 0.006, 1).normalize(), i = (y * n + x) * 4;
      img.data[i] = 128 + v.x * 127;
      img.data[i + 1] = 128 + v.y * 127;
      img.data[i + 2] = 128 + v.z * 127;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    vagues = new THREE.CanvasTexture(bosses);
    vagues.wrapS = vagues.wrapT = THREE.RepeatWrapping;
    vagues.repeat.set(L.rayonX / 9, L.rayonZ / 9); // (des vagues de la même taille, même si le lac est plus grand)
    const eau = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.MeshStandardMaterial({ color: 0x1f4652, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.95, normalMap: vagues, normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.8 }));
    // (le reflet du ciel, plus fort quand on regarde l'eau en rasant : c'est « l'effet Fresnel », comme sur un vrai lac)
    eau.material.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <opaque_fragment>", [
        "float rasant = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 4.0);",
        "outgoingLight = mix(outgoingLight, vec3(0.5, 0.64, 0.8), rasant * 0.75);",
        "#include <opaque_fragment>",
      ].join("\n"));
    };
    eau.rotation.x = -Math.PI / 2;
    eau.scale.set(L.rayonX * 1.02, L.rayonZ * 1.02, 1);
    eau.position.set(L.x, L.niveau, L.z);
    eau.receiveShadow = true;
    groupe.add(eau);
  }
  function majEau(dt) {
    if (vagues) (vagues.offset.x += dt * 0.012), (vagues.offset.y += dt * 0.007);
    tempsVent += dt;
    if (matHerbe) matHerbe.userData.vent.value = tempsVent;
  }

  function construire() {
    const g = new THREE.Group();
    sol(g);
    lac(g);
    Tanks.Maisons3D.construire(g, ajouterMorceau, numeroMorceau); // (étape 75 : les maisons qu'on peut détruire)
    arbres(g);
    touffes(g);
    Tanks.MarquesSol.construire(g); // (demande 92 : les traces de chenilles et les cratères, posés sur le sol)
    return g;
  }

  return { construire, majArbres, majEau, majDistance, majHerbe, herbeIci, qualiteSol, bilan };
})();
