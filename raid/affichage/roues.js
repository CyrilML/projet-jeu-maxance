// 🛞 LES ROUES : l'atelier du pneumaticien (étape 51 du circuit, recopié pour le rallye-raid à l'étape 54)
//
// Une vraie roue, de l'extérieur vers l'intérieur :
//   - le PNEU : des flancs arrondis (avec des lettres moulées dedans) et une bande de roulement creusée de
//     SCULPTURES (les rainures qui chassent l'eau) ;
//   - la JANTE : un rebord (la « lèvre »), une cuvette creuse, des RAYONS qui partent du centre, 5 ÉCROUS et un cache central ;
//   - derrière la jante : le DISQUE de frein (percé de petits trous pour refroidir) et l'ÉTRIER (la pince qui serre
//     le disque pour freiner), souvent peint en couleur sur les voitures de sport.
//
// Le pneu, la jante et l'écrou tournent quand la voiture roule ; le disque tourne aussi, mais l'étrier, lui, reste
// en place (il est fixé à la voiture). Ce fichier ne connaît aucune voiture : on lui donne des mesures et un style.
//
// Styles de jante : "fins" (beaucoup de rayons fins), "doubles" (5 rayons doublés), "etoile" (5 branches larges),
// "y" (5 branches en Y), "turbine" (des pales courbées), "moto" (3 branches fines), "acier" (une jante pleine percée).
//
// Étape 70 : ✍️ « des voitures plus réalistes ». Deux styles de plus, ceux du Dakar :
//   - "beadlock" : 6 branches larges et un ANNEAU boulonné sur le bord (il serre le pneu sur la jante : même dégonflé
//     dans le sable, le pneu ne peut pas déjanter) ;
//   - "rayons" : la roue de moto, avec 36 rayons fins en fil d'acier croisés, un gros moyeu et une jante creuse.
// Et les crampons sont plus gros, avec des « épaulements » qui débordent sur le flanc, comme les vrais pneus de désert.

window.Raid = window.Raid || {};

Raid.Roues = (function () {
  const cache = {};
  const memo = (cle, f) => cache[cle] || (cache[cle] = f());

  // ---------------------------------------------------------------- les images
  // La bande de roulement : des pavés de caoutchouc séparés par des rainures (une image qui se répète autour du pneu),
  // et les flancs avec des lettres. v = 0 → 1 : d'un flanc à l'autre en passant par la bande de roulement.
  function imagePneu(style) {
    return memo("pneu-" + style, () => {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 256;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#1c1c1e";
      ctx.fillRect(0, 0, 1024, 256);
      // la bande de roulement : de v = 0,3 à 0,7 (y de 77 à 179)
      const haut = 77, bas = 179;
      ctx.fillStyle = "#0b0b0c";
      if (style === "crampons") {
        // (étape 70) le fond des rainures, bien noir, puis les gros pavés en quinconce et les épaulements sur les flancs
        ctx.fillRect(0, haut - 18, 1024, bas - haut + 36);
        ctx.fillStyle = "#2c2c2f";
        for (let x = 0; x < 1024; x += 32) {
          ctx.fillRect(x + 2, haut + 3, 22, 30);
          ctx.fillRect(x + 12, haut + 37, 18, 28);
          ctx.fillRect(x + 2, haut + 69, 22, 30);
          ctx.fillRect(x + (x % 64 ? 4 : 10), haut - 16, 16, 17); // les épaulements, qui débordent sur le flanc
          ctx.fillRect(x + (x % 64 ? 10 : 4), bas - 1, 16, 17);
        }
      } else {
        // 3 rainures dans le sens de la roue, et des petites rainures en biais
        for (const y of [0.3, 0.5, 0.7]) ctx.fillRect(0, haut + (bas - haut) * y - 3, 1024, 6);
        ctx.strokeStyle = "#0b0b0c";
        ctx.lineWidth = 3;
        for (let x = 0; x < 1024; x += 16) {
          ctx.beginPath();
          ctx.moveTo(x, haut);
          ctx.lineTo(x + 10, haut + 28);
          ctx.moveTo(x + 8, bas);
          ctx.lineTo(x + 18, bas - 28);
          ctx.stroke();
        }
      }
      // les flancs : les lettres moulées, en gris un peu plus clair
      ctx.fillStyle = "#4a4a4e";
      ctx.font = "bold 30px 'Trebuchet MS', sans-serif";
      ctx.textBaseline = "middle";
      for (const [y, texte] of [[30, "DESERT RALLY · 37x12.5 R17 · "], [226, "DESERT RALLY · 37x12.5 R17 · "]]) {
        for (let x = 0; x < 1024; x += 512) ctx.fillText(texte, x + 10, y, 490);
      }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    });
  }

  // Le disque de frein : du métal brossé, percé de petits trous, avec le moyeu au milieu.
  function imageDisque() {
    return memo("disque", () => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
      g.addColorStop(0, "#6c6f74");
      g.addColorStop(0.45, "#9a9da3");
      g.addColorStop(1, "#7d8086");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(128, 128, 127, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a2b2e";
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2, r = 70 + (k % 3) * 16;
        ctx.beginPath();
        ctx.arc(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#3a3b3e";
      ctx.beginPath();
      ctx.arc(128, 128, 46, 0, Math.PI * 2);
      ctx.fill();
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });
  }

  // ---------------------------------------------------------------- les formes
  // Le pneu : un « tour » (on fait tourner un profil autour de l'axe), avec des flancs bombés.
  function formePneu(rayon, largeur, flanc) {
    return memo("forme-pneu-" + rayon + "-" + largeur + "-" + flanc, () => {
      const e = largeur / 2, rJ = rayon - flanc, pts = [];
      // du bord de la jante (côté intérieur) → le flanc bombé → la bande de roulement → l'autre flanc → la jante
      const N = 10;
      for (let i = 0; i <= N; i++) { // flanc intérieur
        const t = i / N, y = rJ + (rayon - rJ - 0.02) * t;
        pts.push(new THREE.Vector2(y, -e * (0.88 + 0.12 * Math.sin(t * Math.PI))));
      }
      for (let i = 0; i <= 8; i++) { // la bande de roulement, presque plate, aux bords arrondis
        const a = -Math.PI / 2 + (i / 8) * Math.PI;
        pts.push(new THREE.Vector2(rayon - 0.02 + 0.02 * Math.cos(a), Math.sin(a) * e * 0.97));
      }
      for (let i = N; i >= 0; i--) { // flanc extérieur
        const t = i / N, y = rJ + (rayon - rJ - 0.02) * t;
        pts.push(new THREE.Vector2(y, e * (0.88 + 0.12 * Math.sin(t * Math.PI))));
      }
      // (LatheGeometry tourne autour de y : x = la distance à l'axe, y = la position le long de l'axe)
      const geo = new THREE.LatheGeometry(pts, 48);
      // on recalcule v (0 → 1 le long du profil) pour poser l'image : flancs aux bords, bande au milieu
      const uv = geo.attributes.uv;
      const n = pts.length;
      for (let i = 0; i < uv.count; i++) {
        const k = i % n;
        uv.setY(i, k / (n - 1));
        uv.setX(i, (Math.floor(i / n) / 48) * 4);
      }
      geo.rotateX(Math.PI / 2); // l'axe de la roue devient z
      return geo;
    });
  }

  // Un rayon de jante : une forme plate qui s'élargit vers le bord, poussée en épaisseur, un peu creusée.
  function formeRayon(rJante, largeurPied, largeurBout, epaisseur, courbe) {
    return memo(["rayon", rJante, largeurPied, largeurBout, epaisseur, courbe].join("-"), () => {
      const s = new THREE.Shape();
      const r0 = rJante * 0.22, r1 = rJante * 0.96;
      s.moveTo(r0, -largeurPied / 2);
      s.quadraticCurveTo((r0 + r1) / 2, -largeurPied / 2 + (courbe || 0), r1, -largeurBout / 2);
      s.lineTo(r1, largeurBout / 2);
      s.quadraticCurveTo((r0 + r1) / 2, largeurPied / 2 + (courbe || 0), r0, largeurPied / 2);
      s.closePath();
      const geo = new THREE.ExtrudeGeometry(s, { depth: epaisseur, bevelEnabled: true, bevelThickness: epaisseur * 0.3, bevelSize: epaisseur * 0.25, bevelSegments: 2, curveSegments: 6 });
      // le rayon est « bombé » : le bout près du bord recule vers l'intérieur de la roue (la jante est concave)
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const r = Math.hypot(p.getX(i), p.getY(i));
        p.setZ(i, p.getZ(i) - ((r - r0) / (r1 - r0)) * rJante * 0.18);
      }
      geo.computeVertexNormals();
      return geo;
    });
  }

  // ---------------------------------------------------------------- la roue
  // o : { rayon (du pneu), largeur, jante (rayon de la jante), style, metal (matériau de la jante),
  //       etrier (couleur [r,g,b], ou false = pas de frein visible), pneu ("route" ou "crampons"), rayons (combien) }
  //       cote (−1 = roue de gauche : on la retourne pour que la belle face de la jante regarde dehors) }
  // Renvoie { pivot (braque), roue (tourne), sens (+1, ou −1 pour une roue retournée), etrier }.
  function fabriquer(o) {
    const M = Raid.Materiaux.M;
    const rayon = o.rayon, largeur = o.largeur, rJ = o.jante || rayon * 0.68;
    const pivot = new THREE.Group();
    const retourne = new THREE.Group(); // (une roue de gauche est la même roue, tournée d'un demi-tour)
    if (o.cote < 0) retourne.rotation.y = Math.PI;
    pivot.add(retourne);
    const roue = new THREE.Group();
    retourne.add(roue);
    const ombre = (m) => {
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };
    // le pneu
    const matPneu = memo("mat-pneu-" + (o.pneu || "route"), () => new THREE.MeshStandardMaterial({ map: imagePneu(o.pneu || "route"), bumpMap: imagePneu(o.pneu || "route"), bumpScale: 3, roughness: 0.92 }));
    roue.add(ombre(new THREE.Mesh(formePneu(rayon, largeur, rayon - rJ), matPneu)));
    const metal = o.metal || M.jante;
    const sombre = memo("mat-cuvette", () => new THREE.MeshStandardMaterial({ color: 0x232427, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }));
    const zFace = largeur / 2 - 0.02; // le côté extérieur de la roue (z > 0 ; la roue de gauche est retournée)
    // le fût de la jante (un tube) et la lèvre brillante
    const fut = new THREE.Mesh(new THREE.CylinderGeometry(rJ, rJ, largeur * 0.92, 32, 1, true), sombre);
    fut.rotation.x = Math.PI / 2;
    roue.add(fut);
    const levre = new THREE.Mesh(new THREE.TorusGeometry(rJ, rJ * 0.035, 8, 40), metal);
    levre.position.z = zFace;
    roue.add(levre);
    // la cuvette (le fond de la jante, en retrait)
    const fond = new THREE.Mesh(new THREE.CircleGeometry(rJ * 0.98, 32), sombre);
    fond.position.z = zFace - rJ * 0.32;
    if (o.style !== "rayons") roue.add(fond); // (une roue à rayons : on voit à travers)
    // les rayons
    const style = o.style || "fins";
    const n = o.rayons || { fins: 10, doubles: 5, etoile: 5, y: 5, turbine: 12, moto: 3, acier: 0, beadlock: 6, rayons: 0 }[style];
    const ajouterRayon = (angle, l0, l1, ep, courbe) => {
      const r = ombre(new THREE.Mesh(formeRayon(rJ, l0, l1, ep, courbe), metal));
      r.rotation.z = angle;
      r.position.z = zFace - ep * 0.6;
      roue.add(r);
    };
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      if (style === "doubles") {
        ajouterRayon(a - 0.11, rJ * 0.16, rJ * 0.12, 0.03);
        ajouterRayon(a + 0.11, rJ * 0.16, rJ * 0.12, 0.03);
      } else if (style === "y") {
        ajouterRayon(a, rJ * 0.22, rJ * 0.12, 0.035);
        ajouterRayon(a + 0.22, rJ * 0.08, rJ * 0.1, 0.03, rJ * 0.05);
        ajouterRayon(a - 0.22, rJ * 0.08, rJ * 0.1, 0.03, -rJ * 0.05);
      } else if (style === "etoile") ajouterRayon(a, rJ * 0.32, rJ * 0.3, 0.04);
      else if (style === "turbine") ajouterRayon(a, rJ * 0.14, rJ * 0.2, 0.03, rJ * 0.12);
      else if (style === "moto") ajouterRayon(a, rJ * 0.14, rJ * 0.08, 0.03, rJ * 0.06);
      else if (style === "beadlock") ajouterRayon(a, rJ * 0.3, rJ * 0.2, 0.04);
      else ajouterRayon(a, rJ * 0.13, rJ * 0.1, 0.03);
    }
    if (style === "acier") {
      const plein = new THREE.Mesh(new THREE.CircleGeometry(rJ * 0.95, 32), metal);
      plein.position.z = zFace - rJ * 0.15;
      roue.add(plein);
      for (let k = 0; k < 8; k++) {
        const trou = new THREE.Mesh(new THREE.CircleGeometry(rJ * 0.1, 12), sombre);
        const a = (k / 8) * Math.PI * 2;
        trou.position.set(Math.cos(a) * rJ * 0.62, Math.sin(a) * rJ * 0.62, zFace - rJ * 0.15 + 0.004);
        roue.add(trou);
      }
    }
    if (style === "beadlock") {
      // (étape 70) l'anneau de serrage, et ses boulons tout autour
      const anneau = new THREE.Mesh(new THREE.TorusGeometry(rJ * 1.02, rJ * 0.07, 6, 40), metal);
      anneau.scale.z = 0.6;
      anneau.position.z = zFace + 0.004;
      roue.add(anneau);
      const boulon = memo("geo-boulon", () => {
        const g = new THREE.CylinderGeometry(0.009, 0.009, 0.02, 6);
        g.rotateX(Math.PI / 2);
        return g;
      });
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2, b = new THREE.Mesh(boulon, M.chrome);
        b.position.set(Math.cos(a) * rJ * 1.02, Math.sin(a) * rJ * 1.02, zFace + 0.018);
        roue.add(b);
      }
    }
    if (style === "rayons") {
      // (étape 70) la roue de moto : 36 rayons fins, du moyeu (au milieu de la roue) jusqu'à la jante, croisés
      const matRayon = memo("mat-rayon", () => new THREE.MeshStandardMaterial({ color: 0xc9ccd1, metalness: 0.9, roughness: 0.3 }));
      const rMoyeu = Math.min(0.07, rJ * 0.2);
      for (let k = 0; k < 36; k++) {
        const a = (k / 36) * Math.PI * 2, cote = k % 2 ? 1 : -1, decale = cote * 0.35;
        const pied = new THREE.Vector3(Math.cos(a) * rMoyeu, Math.sin(a) * rMoyeu, cote * largeur * 0.22);
        const bout = new THREE.Vector3(Math.cos(a + decale) * rJ * 0.97, Math.sin(a + decale) * rJ * 0.97, 0);
        const r = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, pied.distanceTo(bout), 4), matRayon);
        r.position.copy(pied).add(bout).multiplyScalar(0.5);
        r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bout.clone().sub(pied).normalize());
        roue.add(r);
      }
      const gros = new THREE.Mesh(new THREE.CylinderGeometry(rMoyeu, rMoyeu, largeur * 0.5, 18), metal);
      gros.rotation.x = Math.PI / 2;
      roue.add(gros);
    }
    // le moyeu, les 5 écrous, le cache central
    const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(rJ * 0.24, rJ * 0.26, 0.05, 24), metal);

    moyeu.rotation.x = Math.PI / 2;
    moyeu.position.z = zFace - 0.02;
    if (style !== "rayons") roue.add(moyeu);
    const ecrou = memo("geo-ecrou", () => {
      const g = new THREE.CylinderGeometry(0.014, 0.014, 0.03, 6);
      g.rotateX(Math.PI / 2);
      return g;
    });
    const nombreEcrous = style === "moto" || style === "rayons" ? 0 : style === "beadlock" ? 6 : 5;
    for (let k = 0; k < nombreEcrous; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      const e = new THREE.Mesh(ecrou, M.chrome);
      e.position.set(Math.cos(a) * rJ * 0.15, Math.sin(a) * rJ * 0.15, zFace + 0.01);
      roue.add(e);
    }
    const cache = new THREE.Mesh(new THREE.CylinderGeometry(rJ * 0.07, rJ * 0.07, 0.02, 16), M.noir);
    cache.rotation.x = Math.PI / 2;
    cache.position.z = zFace + 0.015;
    if (style !== "rayons") roue.add(cache);
    // le frein : le disque (il tourne, avec la roue) et l'étrier (il ne tourne pas : il est accroché au pivot)
    let etrier = null;
    if (o.etrier !== false) {
      const matDisque = memo("mat-disque", () => new THREE.MeshStandardMaterial({ map: imageDisque(), metalness: 0.7, roughness: 0.35 }));
      const disque = new THREE.Mesh(new THREE.CylinderGeometry(rJ * 0.8, rJ * 0.8, 0.03, 32), [M.disque, matDisque, matDisque]);
      disque.rotation.x = Math.PI / 2;
      disque.position.z = zFace - rJ * 0.42;
      roue.add(disque);
      const couleur = o.etrier || [0.15, 0.15, 0.16];
      const matEtrier = memo("mat-etrier-" + couleur.join(","), () => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(...couleur).convertSRGBToLinear(), roughness: 0.35, clearcoat: 1 }));
      // un étrier en arc, qui « pince » le haut-arrière du disque
      const forme = new THREE.Shape();
      forme.absarc(0, 0, rJ * 0.86, 0.35, 1.25, false);
      forme.absarc(0, 0, rJ * 0.6, 1.25, 0.35, true);
      const geoEtrier = new THREE.ExtrudeGeometry(forme, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
      etrier = new THREE.Mesh(geoEtrier, matEtrier);
      etrier.position.z = zFace - rJ * 0.42 - 0.035;
      etrier.castShadow = true;
      retourne.add(etrier);
    }
    return { pivot, roue, etrier, sens: o.cote < 0 ? -1 : 1 };
  }

  return { fabriquer, imagePneu };
})();
