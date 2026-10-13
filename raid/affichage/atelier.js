// 🧰 L'ATELIER : la boîte à outils du carrossier du désert (étape 70)
//
// ✍️ Maxance : « Améliore toutes les voitures pour qu'elles soient plus réalistes. » Alors on range ici les OUTILS de
// l'atelier, comme sur l'établi d'un vrai carrossier (ils viennent du bureau d'études du circuit, étape 69, recopiés et
// adaptés au rallye-raid) :
//   - la PEAU : la carrosserie d'un seul morceau (le capot, le pare-brise, le toit et l'arrière), avec une ÉPAULE sous
//     les vitres (affichage/coque.js) et des vitres qu'on voit à travers ;
//   - les pièces MOULÉES : posées sur le dessus (les phares qui épousent le coin du nez) ou collées sur le flanc (une
//     prise d'air qui suit le bombé de l'aile, un autocollant) : elles suivent les courbes de la carrosserie ;
//   - l'HABITACLE : le tableau de bord du rallye (le road-book, les écrans), les sièges baquets avec leurs harnais,
//     le volant, l'arceau, et l'ÉQUIPAGE en combinaison et casque (le pilote ET le copilote, qui lit le road-book) ;
//   - les détails : les blocs de phares, les phares ronds, les rétroviseurs, les essuie-glaces, les élargisseurs
//     d'ailes, les roues de secours, les emblèmes des marques (dessinés sur une petite toile)…
//   - la COLLE : une fois un véhicule fini, toutes les pièces de la même matière sont recollées en une seule (fusionner) :
//     le véhicule a exactement la même allure, mais la carte graphique le dessine en beaucoup moins de fois.
//
// Ce fichier ne connaît aucun véhicule : affichage/vehicules.js s'en sert pour les construire.
// Comme tous les véhicules : « nez vers x+ », posés sur y = 0, centrés en z = 0. Le conducteur est à gauche (z < 0).

window.Raid = window.Raid || {};

Raid.Atelier = (function () {
  const { M, peinture } = Raid.Materiaux;
  const R = Raid.CONFIG.carrosserie;

  // ---------------------------------------------------------------- les formes simples
  function boite(lx, ly, lz, materiau, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lx, ly, lz), materiau);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }
  function cylindre(r, l, materiau, segments) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, segments || 16), materiau);
    m.castShadow = true;
    return m;
  }
  // Un tube entre deux points (pour les arceaux, les fourches, les guidons…).
  function tube(a, b, r, materiau, segments) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
    const m = cylindre(r, va.distanceTo(vb), materiau, segments || 8);
    m.position.copy(va).add(vb).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return m;
  }
  // Une suite de tubes reliés (un arceau), avec une petite boule à chaque coude (la soudure).
  function arceau(groupe, points, r, materiau) {
    for (let i = 0; i < points.length - 1; i++) groupe.add(tube(points[i], points[i + 1], r, materiau));
    for (let i = 1; i < points.length - 1; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), materiau);
      s.position.set(...points[i]);
      groupe.add(s);
    }
  }
  // Un tube courbe qui passe par des points (un tuba, un pot d'échappement…).
  function tuyau(groupe, points, r, materiau, segments) {
    const courbe = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(courbe, segments || points.length * 8, r, 10, false), materiau);
    m.castShadow = true;
    groupe.add(m);
    return m;
  }

  // ---------------------------------------------------------------- la peau
  // Une tranche de la peau : x, le bas (yb), l'épaule (yc), le dessus (yt), la largeur (w), le bord de la vitre (we),
  // le toit (wt), et des réglages en plus (wl : le bas de caisse rentré, rt : l'arrondi du toit, de : la hauteur du rebord).
  const T = (x, yb, yc, yt, w, we, wt, e) => Object.assign({ x, yb, yc, yt, w, we, wt, wl: w - 0.05, rt: 0.09, de: 0.02 }, e || {});
  // Les passages de roues : la coque remonte en arc au-dessus de chaque roue.
  const arches = (Rs, voie) => Rs.map((r) => ({ x: r.x, y: r.r, r: r.r + 0.06, z: (r.voie || voie) - r.l / 2 - 0.06 }));

  // La peau d'un véhicule : la carrosserie peinte et les vitres (qu'on voit à travers), d'un seul morceau.
  function peau(caisse, cles, Rs, voie, mat, vitre, ailes) {
    const c = Raid.Coque.construire({ cles, arches: arches(Rs, voie), vitre, ailes: ailes === undefined ? R.ailes : ailes });
    const m = new THREE.Mesh(c.geometrie, [mat, M.vitreClaire]);
    m.castShadow = m.receiveShadow = true;
    caisse.add(m);
    c.Rs = Rs;
    c.ailes = ailes === undefined ? R.ailes : ailes;
    return c;
  }
  // La règle des vitres d'une peau d'un seul morceau : les vitres sont AU-DESSUS de l'épaule.
  // f = { pareBrise: [x du haut, x du bas], lunette: [x, x] (ou null), cotes: [x arrière, x avant] (les vitres des
  //       côtés), montants: [x…] (les montants entre les vitres), pilier (la largeur des montants du pare-brise),
  //       haut (de combien la vitre s'arrête sous le toit) }
  function vitresUnies(f) {
    const p = f.pilier || 0.07;
    const dans = (x, r) => r && x > r[0] && x < r[1];
    return (centre, n, s) => {
      const [x, y, z] = centre;
      if (y < s.yc + (s.de || 0) + 0.025) return false; // (sous l'épaule : c'est la portière)
      if (Math.abs(n[2]) > 0.6) {
        if (!dans(x, f.cotes) || y > s.yt - (f.haut || 0.04)) return false;
        return !(f.montants || []).some((m) => Math.abs(x - m) < (f.largeurMontant || 0.045));
      }
      if (dans(x, f.pareBrise)) return Math.abs(z) < s.wt + ((s.we === undefined ? s.w : s.we) - s.wt) * 0.45 - p;
      if (dans(x, f.lunette)) return Math.abs(z) < s.wt - p * 0.6;
      return false;
    };
  }

  // ---------------------------------------------------------------- poser des pièces sur la peau
  // Poser un détail À LA SURFACE du dessus de la coque, bien à plat sur la pente.
  function surLeDessus(objet, c, x, z, decale) {
    const y = c.dessus(x, z), d = 0.02;
    const gx = (c.dessus(x + d, z) - c.dessus(x - d, z)) / (2 * d);
    const gz = ((c.dessus(x, Math.abs(z) + d) - c.dessus(x, Math.max(0, Math.abs(z) - d))) / (2 * d)) * Math.sign(z || 1);
    const n = new THREE.Vector3(-gx, 1, -gz).normalize();
    objet.position.set(x, y + (decale || 0), z);
    objet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    return objet;
  }
  // Un plat (un phare, un feu…) : une petite boîte très plate, qu'on pose ensuite avec surLeDessus.
  const plat = (lx, lz, materiau, ep) => boite(lx, ep || 0.02, lz, materiau, 0, 0, 0);
  // Un détail posé sur l'avant ou l'arrière tout plat de la coque (le « bout »).
  function auBout(caisse, c, avant, y, z, ly, lz, materiau, epaisseur) {
    const e = epaisseur || 0.02;
    const b = boite(e, ly, lz, materiau, avant ? c.xMax + e / 2 : c.xMin - e / 2, y, z);
    caisse.add(b);
    return b;
  }
  // Où est la peau du flanc en (x, y) ? (le z de la carrosserie, côté z > 0, en comptant les ailes bombées)
  function flancIci(c, x, y) {
    const s = c.tranche(x), wl = s.wl === undefined ? s.w : s.wl;
    const t = Math.max(0, Math.min(1, (y - s.yb) / Math.max(0.05, s.yc - s.yb)));
    let z = wl + (s.w - wl) * Math.sin((t * Math.PI) / 2);
    for (const r of c.Rs || []) z += Math.exp(-Math.pow((x - r.x) / ((r.r + 0.06) * 1.6), 2)) * (c.ailes || 0) * (0.7 + 0.3 * t);
    return z;
  }
  // Une pièce à 4 coins collée sur le flanc (une prise d'air, une bande de couleur, un autocollant…) : coins = [[x, y] × 4],
  // dans l'ordre arrière-bas, avant-bas, avant-haut, arrière-haut. Elle suit les courbes de la carrosserie.
  // (uv1 : l'image va de 0 à 1 sur la pièce, et se lit de dehors des deux côtés ; cotes : [-1, 1] par défaut)
  function pieceFlanc(caisse, c, coins, materiau, decale, uv1, cotes) {
    const nx = 12, ny = 8;
    for (const cote of cotes || [-1, 1]) {
      const pos = [], idx = [], uv = [];
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const u = i / nx, v = j / ny;
          const bas = [coins[0][0] + (coins[1][0] - coins[0][0]) * u, coins[0][1] + (coins[1][1] - coins[0][1]) * u];
          const haut = [coins[3][0] + (coins[2][0] - coins[3][0]) * u, coins[3][1] + (coins[2][1] - coins[3][1]) * u];
          const x = bas[0] + (haut[0] - bas[0]) * v, y = bas[1] + (haut[1] - bas[1]) * v;
          pos.push(x, y, cote * (flancIci(c, x, y) + (decale || 0.008)));
          if (uv1) uv.push(cote > 0 ? u : 1 - u, v);
          else uv.push(u * 3, v * 2);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
          if (cote > 0) idx.push(a, b, d, b, e, d);
          else idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, materiau);
      m.receiveShadow = true;
      caisse.add(m);
    }
  }
  // Une pièce à 4 coins posée SUR LE DESSUS (le capot, les ailes, le coin du nez) : coins = [[x, z] × 4]. Elle suit les
  // bosses de la carrosserie. Elle est recopiée de l'autre côté (z → −z), sauf si miroir === false.
  function pieceDessus(caisse, c, coins, materiau, decale, miroir) {
    const nx = 10, ny = 6;
    for (const cote of miroir === false ? [1] : [1, -1]) {
      const pos = [], idx = [], uv = [];
      for (let j = 0; j <= ny; j++) {
        for (let i = 0; i <= nx; i++) {
          const u = i / nx, v = j / ny;
          const a = [coins[0][0] + (coins[1][0] - coins[0][0]) * u, coins[0][1] + (coins[1][1] - coins[0][1]) * u];
          const b = [coins[3][0] + (coins[2][0] - coins[3][0]) * u, coins[3][1] + (coins[2][1] - coins[3][1]) * u];
          const x = a[0] + (b[0] - a[0]) * v, z = (a[1] + (b[1] - a[1]) * v) * cote;
          pos.push(x, c.dessus(x, z) + (decale || 0.006), z);
          uv.push(u, v);
        }
      }
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1;
          idx.push(a, d, b, b, d, e);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      // (les triangles doivent regarder vers le haut : sinon on les retourne)
      if (geo.attributes.normal.getY(Math.floor(geo.attributes.normal.count / 2)) < 0) {
        const t = geo.index.array;
        for (let k = 0; k < t.length; k += 3) [t[k + 1], t[k + 2]] = [t[k + 2], t[k + 1]];
        geo.computeVertexNormals();
      }
      const m = new THREE.Mesh(geo, materiau);
      m.receiveShadow = true;
      caisse.add(m);
    }
  }
  // Un PHARE moulé dans la carrosserie : le boîtier sombre (contour), des lignes de LED, et le verre par-dessus.
  function pharePose(caisse, c, contour, leds) {
    pieceDessus(caisse, c, contour, M.boitier, 0.008);
    for (const l of leds) pieceDessus(caisse, c, l, M.led, 0.013);
    pieceDessus(caisse, c, contour, M.lentille, 0.02);
  }
  // Une bande fine (une LED) de (x1, z1) à (x2, z2), de largeur e.
  const bande = (x1, z1, x2, z2, e) => {
    const l = Math.hypot(x2 - x1, z2 - z1) || 1, nx = (-(z2 - z1) / l) * (e / 2), nz = ((x2 - x1) / l) * (e / 2);
    return [[x1 - nx, z1 - nz], [x2 - nx, z2 - nz], [x2 + nx, z2 + nz], [x1 + nx, z1 + nz]];
  };
  // Une ligne sur le flanc (un pli, un jonc, une baguette) qui suit aussi les ailes.
  function traitFlanc(caisse, c, points, rayon, materiau, cotes) {
    for (const cote of cotes || [-1, 1]) {
      const courbe = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, cote * (flancIci(c, x, y) + rayon * 0.4))));
      caisse.add(new THREE.Mesh(new THREE.TubeGeometry(courbe, points.length * 10, rayon, 6, false), materiau));
    }
  }
  // Une ligne de portière (un fin trait sombre), avec sa poignée.
  function portiere(caisse, c, xAv, xAr, yBas, yHaut, poignee) {
    traitFlanc(caisse, c, [[xAv, yHaut], [xAv + 0.005, (yBas + yHaut) / 2], [xAv, yBas]], 0.005, M.noir);
    traitFlanc(caisse, c, [[xAr, yHaut], [xAr - 0.005, (yBas + yHaut) / 2], [xAr, yBas]], 0.005, M.noir);
    traitFlanc(caisse, c, [[xAv, yBas], [(xAv + xAr) / 2, yBas - 0.005], [xAr, yBas]], 0.005, M.noir);
    if (poignee !== false) pieceFlanc(caisse, c, [[xAv - 0.38, yHaut - 0.1], [xAv - 0.18, yHaut - 0.1], [xAv - 0.18, yHaut - 0.065], [xAv - 0.38, yHaut - 0.065]], poignee || M.noir, 0.014);
  }
  // Un élargisseur d'aile en plastique noir, autour d'un passage de roue (un arc épais, collé sur le flanc).
  function elargisseur(caisse, c, r, epaisseur, ecart, materiau) {
    const pts = [];
    for (let k = 0; k <= 14; k++) {
      const a = Math.PI * (k / 14);
      pts.push([r.x + Math.cos(a) * (r.r + (ecart || 0.08)), r.r + Math.sin(a) * (r.r + (ecart || 0.08))]);
    }
    traitFlanc(caisse, c, pts, epaisseur || 0.05, materiau || M.plastique);
  }

  // ---------------------------------------------------------------- les blocs optiques
  // Un BLOC OPTIQUE : un boîtier (sombre pour un phare, rouge pour un feu), des LED qui brillent dedans, et une lentille
  // de verre par-dessus. Il est construit à plat (sa face regarde vers y+) : l × h, et les LED [dx, dz, lx, lz].
  function optique(l, h, leds, sorte) {
    const o = new THREE.Group(), feu = sorte === "feu";
    o.add(plat(l, h, feu ? M.feuVerre : M.boitier, 0.03));
    for (const [dx, dz, lx, lz] of leds) {
      const led = plat(lx, lz, feu ? M.feuLed : M.led, 0.012);
      led.position.set(dx, 0.02, dz);
      o.add(led);
    }
    if (feu) return o;
    const verre = plat(l, h, M.lentille, 0.006);
    verre.position.y = 0.032;
    o.add(verre);
    return o;
  }
  // Un bloc optique posé sur le bout (l'avant ou l'arrière) : y, z = son milieu, haut × large, les LED [dy, dz, ly, lz].
  function optiqueAuBout(caisse, c, avant, y, z, haut, large, leds, sorte, x) {
    const o = optique(haut, large, leds, sorte);
    o.rotation.z = avant ? -Math.PI / 2 : Math.PI / 2;
    o.position.set(x !== undefined ? x : avant ? c.xMax + 0.002 : c.xMin - 0.002, y, z);
    caisse.add(o);
    return o;
  }
  // Un PHARE ROND : la cuvette, un anneau de lumière, la lentille bombée et la bague chromée. Sa face regarde vers y+.
  function phareRond(rayon, bague) {
    const o = new THREE.Group();
    o.add(cylindre(rayon, 0.04, M.alu, 28)); // (le réflecteur chromé, au fond)
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(rayon * 0.72, rayon * 0.07, 8, 28), M.led);
    anneau.rotation.x = Math.PI / 2;
    anneau.position.y = 0.022;
    o.add(anneau);
    const coeur = cylindre(rayon * 0.3, 0.012, M.led, 18);
    coeur.position.y = 0.024;
    o.add(coeur);
    const verre = new THREE.Mesh(new THREE.SphereGeometry(rayon, 24, 8, 0, Math.PI * 2, 0, 0.5), M.lentille);
    verre.scale.y = 0.6;
    verre.position.y = -rayon * 0.5;
    o.add(verre);
    const b = new THREE.Mesh(new THREE.TorusGeometry(rayon, rayon * 0.08, 8, 28), bague || M.chrome);
    b.rotation.x = Math.PI / 2;
    b.position.y = 0.02;
    o.add(b);
    return o;
  }
  // Un PHARE ADDITIONNEL de rallye (les gros phares ronds pour rouler la nuit) : un pot noir, la lampe, le verre.
  // Il regarde vers x+ ; posé en (x, y, z).
  function phareAdditionnel(groupe, x, y, z, rayon, materiauPot) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rayon * 1.05, rayon * 0.75, rayon * 0.9, 18), materiauPot || M.plastique);
    pot.rotation.z = -Math.PI / 2;
    pot.position.set(x - rayon * 0.45, y, z);
    groupe.add(pot);
    const ph = phareRond(rayon, materiauPot || M.plastique);
    ph.rotation.z = -Math.PI / 2;
    ph.position.set(x, y, z);
    groupe.add(ph);
  }
  // Une barre de LED (une longue lampe fine), qui regarde vers x+.
  function barreLed(groupe, x, y, z, longueur, hauteur) {
    groupe.add(boite(0.08, hauteur + 0.03, longueur + 0.03, M.boitier, x - 0.04, y, z));
    groupe.add(boite(0.012, hauteur, longueur, M.led, x + 0.002, y, z));
  }

  // ---------------------------------------------------------------- les images (emblèmes, autocollants)
  // Chaque marque a son emblème, dessiné sur une petite toile (un « canvas ») avec un fond transparent.
  const LOGOS = {
    toyota(ctx) {
      ctx.strokeStyle = "#e9ecef"; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.ellipse(256, 256, 232, 156, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(256, 196, 132, 58, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(256, 290, 56, 128, 0, 0, Math.PI * 2); ctx.stroke();
    },
    gr(ctx) {
      ctx.fillStyle = "#e9ecef"; ctx.font = "italic bold 300px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("GR", 256, 270);
    },
    peugeot(ctx) {
      // le blason : un écu, avec la tête du lion de profil (très simplifiée)
      ctx.strokeStyle = "#e9ecef"; ctx.fillStyle = "#e9ecef"; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(96, 60); ctx.lineTo(416, 60); ctx.lineTo(416, 290); ctx.quadraticCurveTo(416, 420, 256, 480); ctx.quadraticCurveTo(96, 420, 96, 290); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(200, 120); ctx.lineTo(320, 130); ctx.lineTo(352, 210); ctx.lineTo(330, 260); ctx.lineTo(352, 330); ctx.lineTo(300, 400); ctx.lineTo(250, 370); ctx.lineTo(180, 400); ctx.lineTo(200, 300); ctx.lineTo(160, 250); ctx.lineTo(205, 200); ctx.closePath(); ctx.fill();
    },
    mini(ctx) {
      ctx.fillStyle = "#e9ecef";
      ctx.beginPath(); ctx.moveTo(150, 230); ctx.lineTo(10, 210); ctx.lineTo(40, 250); ctx.lineTo(150, 270); ctx.fill();
      ctx.beginPath(); ctx.moveTo(362, 230); ctx.lineTo(502, 210); ctx.lineTo(472, 250); ctx.lineTo(362, 270); ctx.fill();
      ctx.lineWidth = 18; ctx.strokeStyle = "#e9ecef"; ctx.beginPath(); ctx.arc(256, 250, 110, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(256, 250, 100, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e9ecef"; ctx.font = "bold 70px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("MINI", 256, 254);
    },
    canam(ctx) {
      ctx.fillStyle = "#e9ecef"; ctx.font = "italic bold 150px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("CAN-AM", 256, 262, 490);
    },
    ktm(ctx) {
      ctx.fillStyle = "#111"; ctx.font = "italic bold 210px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("KTM", 256, 262, 500);
    },
    honda(ctx) {
      ctx.fillStyle = "#c8102e";
      ctx.beginPath(); ctx.moveTo(256, 120); ctx.quadraticCurveTo(120, 140, 40, 240); ctx.quadraticCurveTo(150, 200, 240, 210); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(256, 120); ctx.quadraticCurveTo(392, 140, 472, 240); ctx.quadraticCurveTo(362, 200, 272, 210); ctx.closePath(); ctx.fill();
      ctx.font = "bold 120px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("HONDA", 256, 330, 470);
    },
    kamaz(ctx) {
      ctx.fillStyle = "#e9ecef"; ctx.font = "bold 150px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("KAMAZ", 256, 262, 500);
    },
  };
  const textures = {};
  function toile(cle, l, h, dessin) {
    if (!textures[cle]) {
      const t = document.createElement("canvas");
      t.width = l;
      t.height = h;
      dessin(t.getContext("2d"), l, h);
      const tex = new THREE.CanvasTexture(t);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      textures[cle] = tex;
    }
    return textures[cle];
  }
  const matsLogo = {};
  function embleme(nom, taille, hauteur) {
    if (!matsLogo[nom]) matsLogo[nom] = new THREE.MeshStandardMaterial({ map: toile("logo-" + nom, 512, 512, (ctx) => LOGOS[nom](ctx)), transparent: true, alphaTest: 0.35, metalness: 0.55, roughness: 0.3 });
    return new THREE.Mesh(new THREE.PlaneGeometry(taille, hauteur || taille), matsLogo[nom]);
  }
  // Un emblème sur le bout (l'avant ou l'arrière) ; avance : de combien il dépasse du bout.
  function emblemeAuBout(caisse, c, nom, avant, y, taille, hauteur, z, avance) {
    const e = embleme(nom, taille, hauteur);
    e.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    const d = 0.008 + (avance || 0);
    e.position.set(avant ? c.xMax + d : c.xMin - d, y, z || 0);
    caisse.add(e);
    return e;
  }
  // Un texte (des lettres) posé debout, qui regarde vers x+ (avant) ou x− (arrière). La toile est taillée à la mesure du
  // texte : les lettres font toute la hauteur « haut », et le mot ne dépasse jamais la largeur « large ».
  function lettres(caisse, x, y, z, avant, texte, large, haut, couleur, police) {
    const fonte = police || "bold 56px Arial, sans-serif";
    const mesure = document.createElement("canvas").getContext("2d");
    mesure.font = fonte;
    const lToile = Math.ceil(mesure.measureText(texte).width + 16);
    const tex = toile(["lettres", texte, couleur, fonte].join("|"), lToile, 64, (ctx) => {
      ctx.fillStyle = couleur || "#e6e8ec";
      ctx.font = fonte;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(texte, lToile / 2, 34);
    });
    const l = Math.min(large, (haut * lToile) / 64), h = (l * 64) / lToile;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, metalness: 0.5, roughness: 0.3 }));
    m.rotation.y = avant ? Math.PI / 2 : -Math.PI / 2;
    m.position.set(x, y, z);
    caisse.add(m);
    return m;
  }
  // Le PANNEAU DE COURSE (sur les portières) : le numéro dans un cadre blanc, le nom du rallye au-dessus.
  function panneauCourse(numero, fond) {
    return new THREE.MeshStandardMaterial({
      roughness: 0.5,
      map: toile("panneau-" + numero + "-" + fond, 512, 384, (ctx, l, h) => {
        ctx.fillStyle = fond || "#f4f4f2";
        ctx.beginPath(); ctx.roundRect(4, 4, l - 8, h - 8, 36); ctx.fill();
        ctx.fillStyle = "#e0a400"; ctx.fillRect(4, 4, l - 8, 70);
        ctx.fillStyle = "#111"; ctx.font = "bold 50px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RALLYE DU DÉSERT", l / 2, 42, l - 40);
        ctx.font = "bold 250px Arial"; ctx.fillText(numero, l / 2, 232, l - 40);
      }),
    });
  }
  // Un BANDEAU de couleur avec un grand mot écrit dedans (le nom de l'équipe sur la caisse du camion…).
  function bandeauTexte(texte, fond, encre) {
    return new THREE.MeshStandardMaterial({
      roughness: 0.45,
      map: toile(["bandeau", texte, fond, encre].join("|"), 1024, 128, (ctx, l, h) => {
        ctx.fillStyle = fond;
        ctx.fillRect(0, 0, l, h);
        ctx.fillStyle = encre;
        ctx.font = "italic bold 92px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(texte, l / 2, h / 2 + 4, l - 60);
      }),
    });
  }
  // Une bande d'AUTOCOLLANTS de sponsors (des petits rectangles de couleur avec des mots).
  function sponsors(mots, couleurs) {
    return new THREE.MeshStandardMaterial({
      roughness: 0.5, transparent: true, alphaTest: 0.3,
      map: toile("sponsors-" + mots.join(",") + couleurs.join(","), 1024, 128, (ctx, l, h) => {
        const n = mots.length, pas = l / n;
        mots.forEach((mot, i) => {
          ctx.fillStyle = couleurs[i % couleurs.length];
          ctx.fillRect(i * pas + 8, 14, pas - 16, h - 28);
          ctx.fillStyle = couleurs[i % couleurs.length] === "#ffffff" ? "#111" : "#fff";
          ctx.font = "bold 58px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(mot, i * pas + pas / 2, h / 2 + 2, pas - 30);
        });
      }),
    });
  }
  // Une grille (un grillage noir, avec des trous), pour les calandres et les prises d'air.
  let matGrille = null;
  function grillage() {
    if (!matGrille) {
      const tex = toile("grillage", 128, 128, (ctx) => {
        ctx.fillStyle = "#030303"; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = "#3a3c40";
        for (let y = 0; y < 128; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < 128; x += 16) { ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.lineTo(x + 8, y); ctx.lineTo(x + 16, y + 8); ctx.lineTo(x + 8, y + 16); ctx.closePath(); ctx.stroke(); ctx.lineWidth = 3; }
      });
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 3);
      matGrille = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.4 });
    }
    return matGrille;
  }

  // ---------------------------------------------------------------- les petits détails
  // Les essuie-glaces, couchés au bas du pare-brise.
  function essuieGlaces(caisse, c, x, longueur, zs) {
    for (const z of zs || [-0.32, 0.18]) {
      const bras = surLeDessus(plat(0.018, longueur, M.noir, 0.012), c, x - 0.02, z, 0.012);
      bras.rotateY(0.18);
      caisse.add(bras);
    }
  }
  // Un rétroviseur : un bras, une coque en goutte d'eau et le miroir.
  function retro(caisse, x, y, zBase, materiau, taille) {
    const k = taille || 1;
    for (const cote of [-1, 1]) {
      caisse.add(tube([x, y - 0.04, cote * zBase], [x - 0.05, y, cote * (zBase + 0.08 * k)], 0.016, M.noir));
      const coqueR = new THREE.Mesh(new THREE.SphereGeometry(0.07 * k, 14, 10), materiau);
      coqueR.scale.set(0.9, 0.62, 1.55);
      coqueR.position.set(x - 0.06, y + 0.03, cote * (zBase + 0.16 * k));
      coqueR.castShadow = true;
      caisse.add(coqueR);
      caisse.add(boite(0.006, 0.07 * k, 0.17 * k, M.chrome, x - 0.12 * k, y + 0.03, cote * (zBase + 0.16 * k)));
    }
  }
  // Une roue de secours (debout, face vers x) : le pneu à crampons et la jante. Rangée dans un groupe qu'on place.
  function roueSecours(r, l, jante, materiauJante) {
    const g = new THREE.Group();
    const w = Raid.Roues.fabriquer({ rayon: r, largeur: l, jante: jante || r * 0.55, pneu: "crampons", style: "beadlock", metal: materiauJante || M.jante, etrier: false, cote: 1 });
    g.add(w.pivot);
    return g;
  }
  // Une bavette (le pare-boue derrière la roue), avec le nom du fabricant.
  function bavette(groupe, x, y, z, haut, large) {
    groupe.add(boite(0.015, haut, large, M.caoutchouc, x, y, z));
  }

  // ---------------------------------------------------------------- l'habitacle et l'équipage
  const MH = {};
  function matHabitacle() {
    if (MH.cuir) return MH;
    Object.assign(MH, {
      cuir: new THREE.MeshStandardMaterial({ color: 0x1d1d20, roughness: 0.7 }), // l'alcantara noir des baquets
      plastique: new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.75 }),
      alu: new THREE.MeshStandardMaterial({ color: 0x9da2a8, metalness: 0.9, roughness: 0.3 }),
      ecran: new THREE.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x3b8cff, emissiveIntensity: 0.55, roughness: 0.2 }),
      roadbook: new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: 0x8a5a20, emissiveIntensity: 0.35, roughness: 0.3 }),
      harnais: new THREE.MeshStandardMaterial({ color: 0xc81e1e, roughness: 0.7 }),
      gants: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.8 }),
      visiere: new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, metalness: 0.6, roughness: 0.08, clearcoat: 1 }),
    });
    return MH;
  }
  // Un membre de l'ÉQUIPAGE, assis : le buste en combinaison, le casque intégral (avec sa visière et son col HANS),
  // les bras (sur le volant, ou sur le road-book pour le copilote) et les jambes vers le plancher.
  // o = { x (le dossier), y (le haut de l'assise), z, sol, toit (la hauteur dispo), combi, casque, mains: [x, y] }
  function equipier(caisse, o) {
    const m = matHabitacle();
    const combi = peinture(o.combi || [0.12, 0.2, 0.45], true), casque = peinture(o.casque || [0.95, 0.95, 0.96]);
    const yTete = Math.min(o.y + 0.68, o.toit - 0.16), xTete = o.x - 0.12;
    const buste = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, Math.max(0.12, yTete - o.y - 0.52), 4, 10), combi);
    buste.position.set(o.x - 0.04, (o.y + yTete) / 2 - 0.08, o.z);
    buste.rotation.z = 0.24;
    buste.scale.set(0.78, 1, 1.12);
    caisse.add(buste);
    // le collier HANS (il tient la tête en cas de choc) et le casque
    const hans = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 6, 14), m.plastique);
    hans.rotation.x = Math.PI / 2;
    hans.position.set(xTete + 0.02, yTete - 0.15, o.z);
    caisse.add(hans);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 12), casque);
    tete.scale.set(1.08, 1, 0.95);
    tete.position.set(xTete, yTete, o.z);
    caisse.add(tete);
    const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.143, 16, 8, -0.85, 1.7, 1.15, 0.6), m.visiere);
    visiere.rotation.y = Math.PI / 2;
    visiere.scale.set(1.08, 1, 0.95);
    visiere.position.set(xTete, yTete, o.z);
    caisse.add(visiere);
    // les bras et les mains
    const [xM, yM] = o.mains;
    for (const dz of [-0.17, 0.17]) {
      const epaule = [o.x - 0.02, yTete - 0.25, o.z + dz], coude = [(o.x + xM) / 2 + 0.02, yM - 0.12, o.z + dz * 1.1], main = [xM, yM, o.z + dz * (o.serre || 0.8)];
      caisse.add(tube(epaule, coude, 0.045, combi));
      caisse.add(tube(coude, main, 0.038, combi));
      const gant = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), m.gants);
      gant.position.set(...main);
      caisse.add(gant);
      caisse.add(tube([o.x + 0.1, o.y + 0.06, o.z + dz * 0.6], [o.x + 0.5, o.y + 0.12, o.z + dz * 0.6], 0.065, combi)); // les cuisses
      caisse.add(tube([o.x + 0.5, o.y + 0.12, o.z + dz * 0.6], [o.x + 0.82, o.sol + 0.06, o.z + dz * 0.6], 0.055, combi)); // les jambes
    }
  }
  // Un siège baquet de course : la coque (assise, dossier, oreilles pour la tête) et le harnais rouge à 6 points.
  function baquet(caisse, x, y, z, hautDispo) {
    const m = matHabitacle();
    const l = 0.5;
    caisse.add(boite(0.48, 0.1, l - 0.12, m.cuir, x + 0.24, y - 0.05, z));
    for (const dz of [-1, 1]) caisse.add(boite(0.48, 0.16, 0.06, m.cuir, x + 0.24, y - 0.02, z + dz * (l / 2 - 0.03)));
    const dos = new THREE.Group();
    const h = Math.max(0.5, Math.min(0.8, hautDispo));
    dos.add(boite(0.08, h, l - 0.12, m.cuir, 0, h / 2, 0));
    for (const dz of [-1, 1]) {
      dos.add(boite(0.16, h * 0.75, 0.06, m.cuir, 0.05, h * 0.38, dz * (l / 2 - 0.03))); // les bords
      dos.add(boite(0.14, 0.18, 0.05, m.cuir, 0.06, h - 0.1, dz * 0.14)); // les oreilles (pour la tête)
      dos.add(boite(0.012, h * 0.7, 0.05, m.harnais, 0.045, h * 0.55, dz * 0.1)); // les bretelles du harnais
    }
    dos.position.set(x, y - 0.05, z);
    dos.rotation.z = 0.2;
    caisse.add(dos);
  }
  // Le VOLANT de course (petit, à 3 branches, en daim, avec le repère rouge du haut) et sa colonne jusqu'au tableau de bord.
  function volantCourse(caisse, xV, yV, z, xCol, yCol) {
    const m = matHabitacle();
    const volant = new THREE.Group();
    volant.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.02, 8, 28), m.cuir));
    for (const a of [0, Math.PI * 0.95, Math.PI * 1.55]) {
      const branche = boite(0.15, 0.03, 0.012, m.alu, Math.cos(a + Math.PI) * 0.075, Math.sin(a + Math.PI) * 0.075, 0);
      branche.rotation.z = a;
      volant.add(branche);
    }
    volant.add(boite(0.03, 0.03, 0.012, m.harnais, 0, 0.16, 0));
    volant.rotation.y = Math.PI / 2;
    const support = new THREE.Group();
    support.add(volant);
    support.position.set(xV, yV, z);
    support.rotation.z = -0.4;
    caisse.add(support);
    caisse.add(tube([xV + 0.03, yV - 0.01, z], [xCol, yCol, z], 0.03, m.plastique));
  }
  // L'HABITACLE d'une voiture de rallye-raid. o = { xPB (le bas du pare-brise), xS (l'avant de l'assise), sol, hS (le haut
  // de l'assise), w (la demi-largeur intérieure), tdb (le haut du tableau de bord), toit: (x) → y, equipage: [combi, casque],
  // copilote: [combi, casque], arceau (le matériau des tubes de l'arceau, ou false) }
  function habitacle(caisse, o) {
    const m = matHabitacle();
    const w = o.w, zP = -w * 0.48, zC = w * 0.48, xT = o.xPB - 0.1;
    const xD = o.xS - 0.62; // le dossier
    caisse.add(boite(o.xPB - xD + 0.1, 0.03, 2 * w, m.plastique, (o.xPB + xD) / 2, o.sol, 0)); // le plancher
    caisse.add(boite(0.06, o.toit(xD - 0.1) - o.sol - 0.06, 2 * w, m.plastique, xD - 0.12, (o.toit(xD - 0.1) + o.sol) / 2, 0)); // la cloison derrière les sièges
    // le tableau de bord : un bloc, son bord arrondi, le road-book et les écrans du rallye
    const prof = 0.4, xTb = xT - prof / 2;
    caisse.add(boite(prof, 0.22, 2 * w, m.plastique, xTb, o.tdb - 0.11, 0));
    const bord = cylindre(0.055, 2 * w, m.plastique, 12);
    bord.rotation.x = Math.PI / 2;
    bord.position.set(xT - prof, o.tdb - 0.06, 0);
    caisse.add(bord);
    const ecranP = boite(0.012, 0.13, 0.24, m.ecran, xT - prof + 0.03, o.tdb + 0.06, zP); // l'écran du pilote
    ecranP.rotation.z = 0.25;
    caisse.add(ecranP);
    const rb = boite(0.03, 0.12, 0.22, m.roadbook, xT - prof + 0.02, o.tdb + 0.03, zC); // le road-book du copilote
    rb.rotation.z = 0.3;
    caisse.add(rb);
    for (const dz of [-0.07, 0.07]) caisse.add(boite(0.012, 0.06, 0.1, m.ecran, xT - prof + 0.01, o.tdb - 0.05, zC + dz)); // les compteurs (tripmaster)
    // la console du milieu, couverte d'interrupteurs, et le frein à main hydraulique
    caisse.add(boite(0.5, o.tdb - o.sol - 0.15, 0.22, m.plastique, xT - prof - 0.1, (o.tdb + o.sol) / 2 - 0.08, 0));
    for (let i = 0; i < 6; i++) caisse.add(boite(0.012, 0.03, 0.025, i % 2 ? m.harnais : m.alu, xT - prof - 0.35, o.tdb - 0.2 - (i % 3) * 0.05, -0.06 + Math.floor(i / 3) * 0.12));
    caisse.add(tube([o.xS + 0.05, o.hS + 0.02, 0], [o.xS + 0.12, o.hS + 0.36, 0], 0.016, m.alu));
    // les deux baquets
    const hDos = o.toit(xD) - o.hS - 0.06;
    baquet(caisse, xD, o.hS, zP, hDos);
    baquet(caisse, xD, o.hS, zC, hDos);
    // le volant et sa colonne
    const xV = o.xS + 0.25, yV = o.hS + 0.36;
    volantCourse(caisse, xV, yV, zP, xT - prof + 0.05, o.tdb - 0.1);
    // l'ARCEAU de sécurité : il suit les montants du pare-brise, le toit et descend derrière les sièges
    if (o.arceau !== false) {
      const t = o.arceau || M.tube, yH = (x) => o.toit(x) - 0.06;
      for (const cote of [-1, 1]) {
        const zA = cote * (w - 0.04);
        arceau(caisse, [[o.xPB - 0.05, o.tdb, zA], [o.xPB - 0.4, yH(o.xPB - 0.4), zA * 0.92], [xD - 0.05, yH(xD - 0.05), zA * 0.92], [xD - 0.12, o.sol, zA]], 0.024, t);
      }
      caisse.add(tube([xD - 0.05, yH(xD - 0.05), -(w - 0.04) * 0.92], [xD - 0.05, yH(xD - 0.05), (w - 0.04) * 0.92], 0.024, t));
      caisse.add(tube([xD - 0.08, yH(xD - 0.05), -(w - 0.04) * 0.92], [xD - 0.12, o.sol + 0.1, (w - 0.04)], 0.022, t)); // la diagonale
    }
    // l'équipage
    const toitIci = o.toit(xD - 0.1);
    if (o.equipage) equipier(caisse, { x: xD + 0.06, y: o.hS, z: zP, sol: o.sol, toit: toitIci, combi: o.equipage[0], casque: o.equipage[1], mains: [xV - 0.02, yV + 0.04] });
    if (o.copilote) equipier(caisse, { x: xD + 0.06, y: o.hS, z: zC, sol: o.sol, toit: toitIci, combi: o.copilote[0], casque: o.copilote[1], mains: [o.xS + 0.25, o.hS + 0.18], serre: 0.5 });
  }

  // ---------------------------------------------------------------- la colle
  // Une fois le véhicule fini, on RECOLLE ensemble toutes les pièces d'un groupe qui ont la même matière (tout le chrome
  // en une seule pièce, toutes les LED en une autre…). Le véhicule a exactement la même allure, mais il se dessine en
  // beaucoup moins de fois. Les pièces qui BOUGENT toutes seules (la caisse sur ses ressorts, les roues) sont recollées
  // chacune de leur côté, jamais avec le reste.
  function fusionner(groupe, bougent) {
    groupe.updateMatrixWorld(true);
    const inverse = groupe.matrixWorld.clone().invert(), paquets = new Map(), pieces = [];
    (function parcourir(o) {
      for (const enfant of o.children) {
        if (bougent && bougent.has(enfant)) continue;
        pieces.push(enfant);
        parcourir(enfant);
      }
    })(groupe);
    for (const m of pieces) {
      if (!m.isMesh || Array.isArray(m.material) || !m.geometry.attributes.normal) continue;
      const avecUV = !!m.geometry.attributes.uv, cle = m.material.uuid + (avecUV ? "+uv" : "");
      if (!paquets.has(cle)) paquets.set(cle, { materiau: m.material, avecUV, pieces: [] });
      paquets.get(cle).pieces.push(m);
    }
    const matrice = new THREE.Matrix4();
    for (const { materiau, avecUV, pieces: liste } of paquets.values()) {
      if (liste.length < 2) continue;
      const pos = [], nor = [], uv = [];
      for (const m of liste) {
        const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        matrice.multiplyMatrices(inverse, m.matrixWorld);
        geo.applyMatrix4(matrice);
        pos.push(geo.attributes.position.array);
        nor.push(geo.attributes.normal.array);
        if (avecUV) uv.push(geo.attributes.uv.array);
        geo.dispose();
        m.parent.remove(m);
      }
      const colle = (listes) => {
        const tout = new Float32Array(listes.reduce((n, a) => n + a.length, 0));
        let k = 0;
        for (const a of listes) {
          tout.set(a, k);
          k += a.length;
        }
        return tout;
      };
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(colle(pos), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(colle(nor), 3));
      if (avecUV) geo.setAttribute("uv", new THREE.BufferAttribute(colle(uv), 2));
      const piece = new THREE.Mesh(geo, materiau);
      piece.castShadow = !materiau.transparent;
      piece.receiveShadow = true;
      groupe.add(piece);
    }
    // (les groupes devenus vides sont enlevés)
    for (const p of pieces) if (!p.isMesh && p.parent && p.children.length === 0) p.parent.remove(p);
  }
  // Recoller un véhicule entier : { g, caisse, roues }.
  function recoller(v) {
    const bougent = new Set([v.caisse]);
    for (const r of v.roues) {
      bougent.add(r.pivot);
      bougent.add(r.roue);
      if (r.etrier) bougent.add(r.etrier);
    }
    fusionner(v.g, bougent);
    fusionner(v.caisse, bougent);
    for (const r of v.roues) fusionner(r.roue, bougent);
  }

  return {
    boite, cylindre, tube, arceau, tuyau, T, arches, peau, vitresUnies, surLeDessus, plat, auBout, flancIci, pieceFlanc, pieceDessus,
    pharePose, bande, traitFlanc, portiere, elargisseur, optique, optiqueAuBout, phareRond, phareAdditionnel, barreLed, embleme,
    emblemeAuBout, lettres, panneauCourse, sponsors, bandeauTexte, grillage, essuieGlaces, retro, roueSecours, bavette, equipier, baquet,
    habitacle, volantCourse, matHabitacle, fusionner, recoller,
  };
})();
