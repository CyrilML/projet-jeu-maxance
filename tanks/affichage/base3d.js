// 🛬 LA BASE AÉRIENNE EN 3D : le maçon et le peintre de piste (demande 99)
//
// Il construit (une seule fois, au chargement) les 2 bases aériennes d'après le PLAN de logique/base.js :
//   - le BÉTON : les dalles (le tarmac, l'aire des hélicos, la zone de départ des tanks, le parking, la bretelle) et le
//     sol des hangars, avec leurs lignes peintes (les places des tanks et des véhicules) ;
//   - LA PISTE : une seule grande image peinte (comme une affiche) : l'asphalte, les bandes blanches du bord, la ligne
//     du milieu en pointillés, les « touches de piano » au bout, les numéros 27 et 09 (le cap en dizaines de degrés :
//     270° = vers l'ouest) et les traces de pneus noires ;
//   - les BALISES : de petites lampes le long des bords (blanches), vertes et rouges aux deux bouts, bleues le long de
//     la bretelle. Ce ne sont PAS de vraies lumières (trop cher) : des petites boîtes qui brillent toutes seules ;
//   - les HANGARS en tôle ondulée (un demi-tube), une tour de contrôle, les aires « H » des hélicos ;
//   - des avions de chasse rangés dans les hangars et un avion de transport garé sur le tarmac (le décor) ;
//   - les CRATÈRES de la piste (lus dans « monde.bases ») : des taches sombres avec de la terre projetée, et une grande
//     croix jaune « X » au bout d'une piste FERMÉE (comme sur les vrais aéroports).
// ✍️ « Ça rame » : chaque base = 9 dessins au plus (le béton, la piste, les bâtiments, les balises, les aires « H », les
// cratères, les croix, les chasseurs rangés, le transport garé). Tout ce qui se ressemble est soudé ou en « instances ».
// Une base trop loin de la caméra n'est pas dessinée du tout. Les images sont peintes par le programme (pas de fichier).
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Base3D = (function () {
  const C = Tanks.CONFIG, BA = C.baseAerienne, T = Tanks.Terrain;
  const bilan = { bases: 0, dessins: 0, balises: 0, triangles: 0, crateres: 0, croix: 0, visibles: 0, version: -1 };
  const bases = []; // { equipe, groupe, crateres, croix, h, centre, rayon }
  let etat = 99;
  const hasard = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ------------------------------------------------------------------ les images peintes
  function toile(l, h, peindre, repete) {
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    peindre(c.getContext("2d"), l, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.flipY = false;
    if (repete) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  function grain(ctx, l, h, n, clair, sombre) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = hasard() < 0.5 ? "rgba(255,255,255," + clair * hasard() + ")" : "rgba(0,0,0," + sombre * hasard() + ")";
      const r = 0.5 + hasard() * 1.5;
      ctx.fillRect(hasard() * l, hasard() * h, r, r);
    }
  }
  // Le BÉTON (répété tous les 10 m) : du gris avec du grain, quelques taches, et les joints des plaques.
  const imageBeton = () => toile(256, 256, (ctx, n) => {
    ctx.fillStyle = "#a3a29b";
    ctx.fillRect(0, 0, n, n);
    grain(ctx, n, n, 9000, 0.12, 0.14);
    for (let i = 0; i < 14; i++) {
      const x = hasard() * n, y = hasard() * n, r = 8 + hasard() * 30, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(60,58,50," + (0.08 + hasard() * 0.12) + ")");
      g.addColorStop(1, "rgba(60,58,50,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.fillStyle = "rgba(40,40,36,0.55)";
    ctx.fillRect(0, 0, n, 2);
    ctx.fillRect(0, 0, 2, n);
  }, true);
  // LA PISTE : toute la piste en une image (2048 points dans la longueur, 160 dans la largeur).
  function imagePiste() {
    const P = BA.piste, Lm = P.x[1] - P.x[0], Wm = P.largeur, L = 2048, H = 160, kx = L / Lm, kz = H / Wm;
    return toile(L, H, (ctx) => {
      ctx.fillStyle = "#4a4c4e";
      ctx.fillRect(0, 0, L, H);
      grain(ctx, L, H, 60000, 0.1, 0.16);
      // des plaques un peu plus claires ou plus foncées (l'asphalte refait par endroits)
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = "rgba(" + (hasard() < 0.5 ? "255,255,255," + hasard() * 0.05 : "0,0,0," + hasard() * 0.08) + ")";
        ctx.fillRect(hasard() * L, 0, 30 + hasard() * 160, H);
      }
      // les TRACES DE PNEUS noires, là où les avions touchent le sol (près des deux bouts)
      for (const bout of [0.12, 0.88]) for (let i = 0; i < 70; i++) {
        const x = (bout + (hasard() - 0.5) * 0.14) * L, y = H / 2 + (hasard() - 0.5) * 30, lg = 20 + hasard() * 90;
        ctx.fillStyle = "rgba(15,15,15," + (0.08 + hasard() * 0.18) + ")";
        ctx.fillRect(x, y, lg, 1.5 + hasard() * 2.5);
      }
      ctx.fillStyle = "#e8e6dc";
      // les bandes du bord (0,9 m) et la ligne du milieu en pointillés (30 m de trait, 20 m de vide)
      ctx.fillRect(0, 1.2 * kz, L, 0.9 * kz);
      ctx.fillRect(0, H - 2.1 * kz, L, 0.9 * kz);
      for (let x = 60; x < Lm - 60; x += 50) ctx.fillRect(x * kx, H / 2 - 0.45 * kz, 30 * kx, 0.9 * kz);
      // les « touches de piano » (le seuil) aux deux bouts : 8 bandes de 30 m
      for (const bout of [0, 1]) {
        const x0 = bout ? Lm - 36 : 6;
        for (let k = 0; k < 8; k++) {
          const y = 3.5 + k * 3.1 + (k >= 4 ? 2.8 : 0);
          ctx.fillRect(x0 * kx, y * kz, 30 * kx, 1.8 * kz);
        }
        // les marques de la zone où on touche le sol (2 grosses bandes)
        const xt = bout ? Lm - 130 : 100;
        ctx.fillRect(xt * kx, 6 * kz, 30 * kx, 3 * kz);
        ctx.fillRect(xt * kx, H - 9 * kz, 30 * kx, 3 * kz);
      }
      // les NUMÉROS : « 27 » au bout est (on décolle vers l'ouest = 270°), « 09 » au bout ouest (vers l'est = 90°)
      ctx.font = "bold " + Math.round(13 * kz) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const [texte, x, rot] of [["27", Lm - 52, -Math.PI / 2], ["09", 52, Math.PI / 2]]) {
        ctx.save();
        ctx.translate(x * kx, H / 2);
        ctx.rotate(rot);
        ctx.scale(1, kx / kz * 2.2); // (les chiffres sont étirés dans la longueur de la piste, comme les vrais)
        ctx.fillText(texte, 0, 0);
        ctx.restore();
      }
    });
  }
  // L'aire « H » : un carré de béton plus foncé, un cercle jaune et un grand H blanc.
  const imageAire = () => toile(256, 256, (ctx, n) => {
    ctx.fillStyle = "#7d7c76";
    ctx.fillRect(0, 0, n, n);
    grain(ctx, n, n, 5000, 0.1, 0.14);
    ctx.strokeStyle = "#e8e4d8";
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, n - 12, n - 12);
    ctx.strokeStyle = "#f2c230";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(n / 2, n / 2, n * 0.38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4f2ea";
    const w = n * 0.08, hh = n * 0.42, ww = n * 0.34;
    ctx.fillRect(n / 2 - ww / 2 - w / 2, n / 2 - hh / 2, w, hh);
    ctx.fillRect(n / 2 + ww / 2 - w / 2, n / 2 - hh / 2, w, hh);
    ctx.fillRect(n / 2 - ww / 2, n / 2 - w / 2, ww, w);
  });
  // Un CRATÈRE : le trou noir au milieu, le bord de terre retournée, les mottes projetées autour.
  const imageCratere = () => toile(128, 128, (ctx, n) => {
    const c = n / 2;
    for (let i = 0; i < 60; i++) {
      const a = hasard() * Math.PI * 2, d = c * (0.45 + hasard() * 0.5), r = 1 + hasard() * 4;
      ctx.fillStyle = "rgba(" + (70 + hasard() * 40) + "," + (58 + hasard() * 30) + ",40," + (0.5 + hasard() * 0.4) + ")";
      ctx.beginPath();
      ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, r, 0, Math.PI * 2);
      ctx.fill();
    }
    let g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.62);
    g.addColorStop(0, "rgba(18,15,12,0.97)");
    g.addColorStop(0.55, "rgba(48,40,30,0.92)");
    g.addColorStop(0.8, "rgba(96,80,58,0.85)");
    g.addColorStop(1, "rgba(96,80,58,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c, c, c * 0.62, 0, Math.PI * 2);
    ctx.fill();
    // des morceaux d'asphalte cassé sur le bord
    for (let i = 0; i < 18; i++) {
      const a = hasard() * Math.PI * 2, d = c * (0.5 + hasard() * 0.15);
      ctx.fillStyle = "rgba(60,62,64,0.95)";
      ctx.fillRect(c + Math.cos(a) * d, c + Math.sin(a) * d, 3 + hasard() * 5, 2 + hasard() * 4);
    }
  });
  // La croix « X » jaune d'une piste fermée.
  const imageCroix = () => toile(128, 128, (ctx, n) => {
    ctx.strokeStyle = "#f5c518";
    ctx.lineWidth = 16;
    ctx.lineCap = "butt";
    ctx.beginPath();
    ctx.moveTo(14, 14);
    ctx.lineTo(n - 14, n - 14);
    ctx.moveTo(n - 14, 14);
    ctx.lineTo(14, n - 14);
    ctx.stroke();
  });
  // La TÔLE ONDULÉE des hangars : des bandes claires et foncées (répétées).
  const imageTole = () => toile(64, 16, (ctx, l, h) => {
    for (let x = 0; x < l; x++) {
      const v = 150 + Math.sin((x / l) * Math.PI * 2 * 4) * 34;
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect(x, 0, 1, h);
    }
  }, true);

  // ------------------------------------------------------------------ le monteur (souder des formes simples en une)
  function monteur() {
    const pos = [], nor = [], uv = [], col = [], idx = [];
    const m = {
      // un sommet : position, normale, uv, couleur
      s(x, y, z, nx, ny, nz, u, v, c) {
        pos.push(x, y, z), nor.push(nx, ny, nz), uv.push(u, v), col.push(c.r, c.g, c.b);
        return pos.length / 3 - 1;
      },
      quad(a, b, c, d) { idx.push(a, b, c, a, c, d); },
      // un rectangle à plat (face vers le haut), uv = position ÷ « echelle » (ou fixes)
      plat(x0, x1, z0, z1, y, c, echelle, uvFixe) {
        const f = (x, z) => (uvFixe ? [uvFixe[0], uvFixe[1]] : [x / echelle, z / echelle]);
        const a = m.s(x0, y, z0, 0, 1, 0, ...f(x0, z0), c), b = m.s(x0, y, z1, 0, 1, 0, ...f(x0, z1), c), cc = m.s(x1, y, z1, 0, 1, 0, ...f(x1, z1), c), d = m.s(x1, y, z0, 0, 1, 0, ...f(x1, z0), c);
        m.quad(a, b, cc, d);
      },
      // une boîte (6 faces), uv fixes (une couleur unie)
      boite(cx, y0, cz, sx, sy, sz, c, uvFixe) {
        const u = uvFixe || [0.02, 0.5], x0 = cx - sx / 2, x1 = cx + sx / 2, y1 = y0 + sy, z0 = cz - sz / 2, z1 = cz + sz / 2;
        const face = (p, n) => {
          const k = p.map((q) => m.s(q[0], q[1], q[2], n[0], n[1], n[2], u[0], u[1], c));
          m.quad(k[0], k[1], k[2], k[3]);
        };
        face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0]);
        face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1]);
        face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1]);
        face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0]);
        face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0]);
      },
      geo() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
        g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
        g.setIndex(idx);
        g.computeBoundingSphere();
        bilan.triangles += idx.length / 3;
        return g;
      },
    };
    return m;
  }
  const couleur = (hex) => new THREE.Color(hex);

  // ------------------------------------------------------------------ une base
  function construireBase(groupe, equipe, mats) {
    const B = Tanks.Base.plan[equipe], piste = B.piste, h = T.hauteur((piste.x0 + piste.x1) / 2, piste.z), y = h + 0.02;
    const g = new THREE.Group();
    g.name = "base aérienne " + equipe;
    const versZ = (dz) => Tanks.Base.versZ(equipe, dz), s = equipe === "bleus" ? 1 : -1;
    // 1. LE BÉTON : les dalles, le sol des hangars, puis les lignes peintes (un peu au-dessus)
    const beton = monteur(), gris = couleur(0xffffff), grisFonce = couleur(0xd8d6d0);
    for (const d of B.dalles) beton.plat(d.x0, d.x1, d.z0, d.z1, y, d.nom.includes("tanks") ? grisFonce : gris, 10);
    for (const hg of B.hangars) beton.plat(hg.sol.x0, hg.sol.x1, hg.sol.z0, hg.sol.z1, y + 0.01, grisFonce, 10);
    const jaune = couleur(0xf0c020), blanc = couleur(0xf4f2ea), trait = (x0, x1, z0, z1, c) => beton.plat(x0, x1, z0, z1, y + 0.03, c, 1, [0.5, 0.5]);
    // la zone de départ des tanks : une case jaune par tank (là où logique/terrain.js les pose), ouverte vers l'ennemi
    const nTanks = Math.max(C.equipes.allies + 1, C.equipes.ennemis);
    for (let k = 0; k < nTanks; k++) {
      const cx = (k - (nTanks - 1) / 2) * C.equipes.ecart, zc = C.monde.camp * s;
      trait(cx - 6, cx - 5.6, zc - 6, zc + 6, jaune);
      trait(cx + 5.6, cx + 6, zc - 6, zc + 6, jaune);
      trait(cx - 6, cx + 6, zc + s * 5.6 - 0.2, zc + s * 5.6 + 0.2, jaune);
    }
    // le parking : les places en lignes blanches (2 rangées)
    for (const dz of [32, BA.parkingIA.dz]) for (let x = 60; x <= 172; x += 6) trait(x - 0.12, x + 0.12, Math.min(versZ(dz - 5), versZ(dz + 5)), Math.max(versZ(dz - 5), versZ(dz + 5)), blanc);
    // la bretelle : une ligne jaune au milieu (le chemin des avions)
    const br = B.dalles.find((d) => d.nom.includes("bretelle"));
    if (br) trait((br.x0 + br.x1) / 2 - 0.2, (br.x0 + br.x1) / 2 + 0.2, br.z0, br.z1, jaune);
    // le tarmac : une ligne jaune le long des hangars
    const tm = B.dalles.find((d) => d.nom.includes("tarmac"));
    if (tm) trait(tm.x0 + 4, tm.x1 - 4, (tm.z0 + tm.z1) / 2 - 0.2, (tm.z0 + tm.z1) / 2 + 0.2, jaune);
    const dalles = new THREE.Mesh(beton.geo(), mats.beton);
    dalles.receiveShadow = true;
    g.add(dalles);
    // 2. LA PISTE : un seul grand rectangle avec l'image peinte (uv : x le long, z en travers)
    const pm = monteur(), L = piste.x1 - piste.x0, W = piste.z1 - piste.z0;
    const a = pm.s(piste.x0, y + 0.01, piste.z0, 0, 1, 0, 0, 0, gris), b = pm.s(piste.x0, y + 0.01, piste.z1, 0, 1, 0, 0, 1, gris);
    const c = pm.s(piste.x1, y + 0.01, piste.z1, 0, 1, 0, 1, 1, gris), d = pm.s(piste.x1, y + 0.01, piste.z0, 0, 1, 0, 1, 0, gris);
    pm.quad(a, b, c, d);
    const laPiste = new THREE.Mesh(pm.geo(), mats.piste);
    laPiste.receiveShadow = true;
    g.add(laPiste);
    // 3. LES BÂTIMENTS : les hangars (un demi-tube de tôle, un mur au fond), la tour de contrôle, la manche à air
    const bat = monteur(), tole = couleur(equipe === "bleus" ? 0x8e9682 : 0xa89c80), fond = couleur(0x6c6a62), fonce = couleur(0x3a3c3a), vitre = couleur(0x1d2a30);
    const H = BA.hangars, N = 14;
    for (const hg of B.hangars) {
      const rx = H.largeur / 2, ry = H.hauteur, zA = hg.z + hg.ouvertVers * (H.profondeur / 2), zF = hg.z - hg.ouvertVers * (H.profondeur / 2);
      const ligne = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI, cx = Math.cos(t), cy = Math.sin(t), nl = Math.hypot(cx / rx, cy / ry);
        const arc = i / N * 9; // (uv le long de l'arc)
        ligne.push([bat.s(hg.x + cx * rx, y + cy * ry, zA, cx / rx / nl, cy / ry / nl, 0, 0, arc, tole), bat.s(hg.x + cx * rx, y + cy * ry, zF, cx / rx / nl, cy / ry / nl, 0, H.profondeur / 1.2, arc, tole)]);
      }
      for (let i = 0; i < N; i++) bat.quad(ligne[i][0], ligne[i][1], ligne[i + 1][1], ligne[i + 1][0]);
      // le mur du fond (un éventail), et un cadre plus foncé autour de l'ouverture
      const centre = bat.s(hg.x, y, zF, 0, 0, hg.ouvertVers, 0.02, 0.5, fond);
      const bord = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI;
        bord.push(bat.s(hg.x + Math.cos(t) * rx, y + Math.sin(t) * ry, zF, 0, 0, hg.ouvertVers, 0.02, 0.5, fond));
      }
      for (let i = 0; i < N; i++) bat.quad(centre, bord[i], bord[i + 1], centre);
      for (let i = 0; i < N; i++) {
        const t0 = (i / N) * Math.PI, t1 = ((i + 1) / N) * Math.PI, e = 0.6;
        const p = [[Math.cos(t0) * rx, Math.sin(t0) * ry], [Math.cos(t1) * rx, Math.sin(t1) * ry], [Math.cos(t1) * (rx + e), Math.sin(t1) * (ry + e)], [Math.cos(t0) * (rx + e), Math.sin(t0) * (ry + e)]];
        const k = p.map((q) => bat.s(hg.x + q[0], y + q[1], zA, 0, 0, hg.ouvertVers, 0.02, 0.5, fonce));
        bat.quad(k[0], k[1], k[2], k[3]);
      }
      // les 2 portes coulissantes, ouvertes sur les côtés
      for (const cote of [-1, 1]) bat.boite(hg.x + cote * (rx + 1.6), y, zA + hg.ouvertVers * 0.4, 3, ry * 0.55, 0.3, fond);
    }
    // la tour de contrôle (à l'est du tarmac) : le pied en béton, la cabine vitrée, le toit, l'antenne
    const tx = -118, tz = versZ(206);
    bat.boite(tx, y, tz, 6, 13, 6, couleur(0xbab6aa));
    bat.boite(tx, y + 13, tz, 8.5, 3.6, 8.5, vitre);
    bat.boite(tx, y + 16.6, tz, 9.5, 0.6, 9.5, couleur(0x5a5c58));
    bat.boite(tx, y + 17.2, tz, 0.25, 6, 0.25, fonce);
    // la manche à air (orange et blanc) sur son mât, près de la piste
    const mx = piste.x1 + 12, mz = piste.z + s * -22;
    bat.boite(mx, y, mz, 0.2, 7, 0.2, fonce);
    for (let k = 0; k < 4; k++) bat.boite(mx - 1 - k * 1.1, y + 6.4 - k * 0.12, mz, 1.1, 0.9 - k * 0.12, 0.9 - k * 0.12, couleur(k % 2 ? 0xf2f0e8 : 0xff6a1a));
    const bati = new THREE.Mesh(bat.geo(), mats.tole);
    bati.castShadow = true; // (il ne RECOIT pas d'ombres : une tôle des deux côtés se ferait de l'ombre à elle-même, toute noire)
    g.add(bati);
    // 4. LES BALISES : des petites boîtes qui brillent (blanches au bord, vertes / rouges aux bouts, bleues sur la bretelle)
    const lampes = [];
    for (let x = piste.x0; x <= piste.x1 + 0.1; x += BA.piste.balises) for (const z of [piste.z0 - 1, piste.z1 + 1]) lampes.push([x, z, 0xfff2c8]);
    for (let k = 0; k < 8; k++) {
      const z = piste.z0 + 2 + (k / 7) * (W - 4);
      lampes.push([piste.x1 + 1.5, z, 0x3cff6a], [piste.x0 - 1.5, z, 0xff3a2a]);
    }
    if (br) for (let zz = br.z0 + 4; zz < br.z1; zz += 12) for (const x of [br.x0 - 0.8, br.x1 + 0.8]) lampes.push([x, zz, 0x3a7cff]);
    const balises = new THREE.InstancedMesh(mats.lampeGeo, mats.lampe, lampes.length), m4 = new THREE.Matrix4(), col = new THREE.Color();
    lampes.forEach(([x, z, cc], i) => {
      balises.setMatrixAt(i, m4.makeTranslation(x, y + 0.18, z));
      balises.setColorAt(i, col.set(cc));
    });
    balises.computeBoundingSphere();
    g.add(balises);
    bilan.balises += lampes.length;
    // 5. LES AIRES « H » (et la petite aire du drone)
    const places = BA.aires.map(([x, dz]) => [x, versZ(dz), BA.aire]).concat([[BA.places.drone[0], versZ(BA.places.drone[1]), BA.petiteAire]]);
    const aires = new THREE.InstancedMesh(mats.plan, mats.aire, places.length), q = new THREE.Quaternion(), e3 = new THREE.Vector3(), p3 = new THREE.Vector3();
    places.forEach(([x, z, taille], i) => aires.setMatrixAt(i, m4.compose(p3.set(x, y + 0.035, z), q.setFromAxisAngle(e3.set(0, 1, 0), equipe === "bleus" ? 0 : Math.PI), new THREE.Vector3(taille, 1, taille))));
    aires.computeBoundingSphere();
    aires.receiveShadow = true;
    g.add(aires);
    // 6. LES CRATÈRES et 7. LES CROIX (remplis par « maj » : vides au départ)
    const max = BA.piste.troncons * BA.destruction.parTroncon;
    const crateres = new THREE.InstancedMesh(mats.plan, mats.cratere, max);
    crateres.count = 0;
    crateres.frustumCulled = false; // (peu de choses à dessiner : pas besoin de calculer s'ils sont dans l'image)
    g.add(crateres);
    const croix = new THREE.InstancedMesh(mats.plan, mats.croix, 2);
    for (const [k, x] of [[0, piste.x0 + 80], [1, piste.x1 - 80]]) croix.setMatrixAt(k, m4.compose(p3.set(x, y + 0.06, piste.z), q.identity(), new THREE.Vector3(W * 0.85, 1, W * 0.85))); // (après les numéros, bien visibles)
    croix.computeBoundingSphere();
    croix.visible = false;
    g.add(croix);
    // 8. LE DÉCOR : des avions de chasse rangés dans les hangars, et l'avion de transport garé sur le tarmac
    const A3 = Tanks.Avions3D, ranges = BA.rangesHangars, sorteChasse = equipe === "bleus" ? "avion" : "chasseur";
    const chasse = A3.lotSimple(sorteChasse, equipe, ranges.length);
    ranges.forEach(([x, dz], i) => {
      chasse.setMatrixAt(i, m4.compose(p3.set(x, y, versZ(dz)), q.setFromAxisAngle(e3.set(0, 1, 0), -Tanks.Base.place(equipe, "jeep").angle), new THREE.Vector3(1, 1, 1)));
      chasse.setColorAt(i, col.set(0xffffff));
    });
    chasse.count = ranges.length;
    chasse.frustumCulled = true;
    chasse.computeBoundingSphere();
    chasse.castShadow = true;
    g.add(chasse);
    const tr = A3.lotSimple("transport", equipe, 1), [tx2, tdz] = BA.transportGare;
    tr.setMatrixAt(0, m4.compose(p3.set(tx2, y, versZ(tdz)), q.setFromAxisAngle(e3.set(0, 1, 0), 0), new THREE.Vector3(1, 1, 1)));
    tr.setColorAt(0, col.set(0xffffff));
    tr.count = 1;
    tr.frustumCulled = true;
    tr.computeBoundingSphere();
    tr.castShadow = true;
    g.add(tr);
    groupe.add(g);
    const zone = B.zone;
    bases.push({ equipe, groupe: g, crateres, croix, y, centre: B.centre, rayon: Math.hypot(zone.x1 - zone.x0, zone.z1 - zone.z0) / 2 });
    bilan.dessins = g.children.length;
  }

  function construire(groupe) {
    const plan = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const decalco = (map) => new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const mats = {
      beton: new THREE.MeshStandardMaterial({ map: imageBeton(), vertexColors: true, roughness: 0.92, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
      piste: new THREE.MeshStandardMaterial({ map: imagePiste(), roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
      tole: new THREE.MeshStandardMaterial({ map: imageTole(), vertexColors: true, roughness: 0.75, metalness: 0.05, emissive: 0x23251f, side: THREE.DoubleSide, shadowSide: THREE.FrontSide }),
      lampe: new THREE.MeshBasicMaterial({ toneMapped: false }),
      lampeGeo: new THREE.BoxGeometry(0.45, 0.3, 0.45),
      aire: new THREE.MeshStandardMaterial({ map: imageAire(), roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }),
      cratere: decalco(imageCratere()),
      croix: decalco(imageCroix()),
      plan,
    };
    mats.tole.map.repeat.set(1, 1);
    for (const equipe of ["bleus", "rouges"]) construireBase(groupe, equipe, mats);
    bilan.bases = bases.length;
  }

  // À chaque image : les bases trop loin ne sont pas dessinées ; les cratères et les croix suivent « monde.bases ».
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p3 = new THREE.Vector3(), e3 = new THREE.Vector3(), haut = new THREE.Vector3(0, 1, 0);
  function maj(monde, position, vue) {
    bilan.visibles = 0;
    for (const b of bases) {
      b.groupe.visible = Math.hypot(b.centre.x - position.x, b.centre.z - position.z) < (vue || 800) + b.rayon;
      if (b.groupe.visible) bilan.visibles++;
    }
    const version = Tanks.Base.version + (monde.bases ? monde.bases.length * 1e6 : 0);
    if (version === bilan.version) return;
    bilan.version = version;
    bilan.crateres = bilan.croix = 0;
    for (const b of bases) {
      const etat = (monde.bases || []).find((x) => x.equipe === b.equipe);
      let n = 0;
      if (etat) for (const t of etat.troncons) for (const c of t.crateres) {
        if (n >= b.crateres.instanceMatrix.count) break;
        const r = c.r * (1 - 0.35 * c.repare); // (pendant que tu le rebouches, il rapetisse)
        b.crateres.setMatrixAt(n++, m4.compose(p3.set(c.x, b.y + 0.05, c.z), q.setFromAxisAngle(haut, c.angle), e3.set(r * 2, 1, r * 2)));
      }
      b.crateres.count = n;
      b.crateres.instanceMatrix.needsUpdate = true;
      b.croix.visible = !!etat && !etat.ouverte;
      bilan.crateres += n;
      if (b.croix.visible) bilan.croix++;
    }
  }

  return { construire, maj, bilan };
})();
