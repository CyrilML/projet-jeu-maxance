// 🏙️ LA VILLE EN 3D : le décorateur de plateau de cinéma (livre de demandes n° 9 et 11)
//
// ✍️ « Une map en ville très réaliste », « abandonnée rapidement ». Ce peintre dessine tout ce que l'urbaniste
// (logique/ville.js) a inventé : les trottoirs et leurs bordures, les passages piétons, les lignes, les plaques d'égout,
// les lampadaires, les feux, les panneaux, les bancs, les arbres en bac, les kiosques, les abribus, les grands panneaux
// de pub, les stores des boutiques, les balcons et leur linge, les climatiseurs, les AFFICHES et les PUBLICITÉS (des
// marques inventées, peintes au démarrage sur une grande image ; ✍️ livre n° 27 « bannir toute publicité » : ce sont
// des affiches du DÉCOR, aucune vraie marque — les noms qui ressemblaient à une vraie marque ont été changés), les voitures, les bus, les scooters… et les objets
// laissés dans la fuite (sacs, valises, téléphones, nounours, journaux, chaises renversées, papiers partout).
// Pour que le jeu ne rame pas (✍️ Iron Wolf Studio déteste le lag) :
//   - tout ce qui ne bouge pas est RECOLLÉ par quartier de 70 m : 1 dessin pour le mobilier, 1 pour les affiches, 1 pour
//     les petits objets — et les petits objets ne sont dessinés qu'à moins de « objetsVille » m (le niveau de qualité) ;
//   - chaque sommet porte un petit nombre « cache » : un objet écrasé par un tank (ou un store dont le mur est tombé) est
//     écrasé en un point par la carte graphique (comme les morceaux de mur, affichage/maisons3d.js) ;
//   - les voitures, les portières, les bus et les scooters (qui bougent, brûlent) sont des « instances » : 1 dessin par
//     forme pour toute la ville.
// Comme tout l'affichage, ce fichier LIT le monde et ne le change jamais.

window.Tanks = window.Tanks || {};

Tanks.Ville3D = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain;
  const VI = () => Tanks.Ville;
  const bilan = { dessins: 0, triangles: 0, quartiers: 0, petitsVus: 0, instances: 0, affiches: 0, majCaches: 0, msConstruction: 0 };
  const TAILLE = 70; // m : la taille d'un quartier de dessin
  let atlas = null, matMobilier = null, matAffiches = null, matPetits = null, profondeur = null;
  const quartiers = new Map(); // numéro → { mobilier, affiches, petits : lots ; meshes }
  const instances = {}; // forme → InstancedMesh
  let pret = false;

  // ------------------------------------------------------------------ 1. LES AFFICHES ET LES PUBLICITÉS (une grande image)
  // 8 affiches (256 × 384), 4 grands panneaux (512 × 256), 8 enseignes (512 × 96). Que des marques INVENTÉES.
  const W = 2048, H = 1024, RECTS = { affiche: [], pub: [], enseigne: [] };
  for (let i = 0; i < 8; i++) RECTS.affiche.push([i * 256, 0, 256, 384]);
  for (let i = 0; i < 4; i++) RECTS.pub.push([i * 512, 384, 512, 256]);
  for (let i = 0; i < 8; i++) RECTS.enseigne.push([(i % 4) * 512, 640 + Math.floor(i / 4) * 96, 512, 96]);
  const uvDe = (r) => [r[0] / W, 1 - (r[1] + r[3]) / H, r[2] / W, r[3] / H];
  const PEINTRES = []; // (demande 115 : les peintres d'une édition, qui repassent par-dessus les affiches)
  function peindreAtlas() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    let gr = 4242;
    const h = () => ((gr = (gr * 1664525 + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = "#777";
    g.fillRect(0, 0, W, H);
    const texte = (t, x, y, taille, coul, gras, align) => {
      g.font = (gras ? "bold " : "") + taille + "px Arial, Helvetica, sans-serif";
      g.fillStyle = coul;
      g.textAlign = align || "center";
      g.textBaseline = "middle";
      g.fillText(t, x, y);
    };
    const fond = (r, c1, c2) => {
      const gd = g.createLinearGradient(r[0], r[1], r[0], r[1] + r[3]);
      gd.addColorStop(0, c1);
      gd.addColorStop(1, c2 || c1);
      g.fillStyle = gd;
      g.fillRect(r[0], r[1], r[2], r[3]);
    };
    const A = RECTS.affiche;
    // 0 : l'avis d'évacuation (la ville a été abandonnée !)
    let r = A[0], cx = r[0] + 128;
    fond(r, "#f4f1e6");
    g.fillStyle = "#b8231c"; g.fillRect(r[0], r[1], 256, 70);
    texte("AVIS À LA", cx, r[1] + 24, 26, "#fff", true); texte("POPULATION", cx, r[1] + 52, 26, "#fff", true);
    texte("ÉVACUATION", cx, r[1] + 110, 34, "#111", true); texte("IMMÉDIATE", cx, r[1] + 146, 34, "#111", true);
    ["Rejoignez la gare centrale", "avant 18 h. Un seul sac", "par personne. Laissez", "les véhicules sur place."].forEach((l, i) => texte(l, cx, r[1] + 196 + i * 26, 17, "#222"));
    texte("— Mairie de Valdrie —", cx, r[1] + 345, 16, "#555", true);
    // 1 : chat perdu
    r = A[1]; cx = r[0] + 128;
    fond(r, "#fbfbf5");
    texte("CHAT PERDU", cx, r[1] + 40, 34, "#111", true);
    g.fillStyle = "#e09b3d"; g.beginPath(); g.ellipse(cx, r[1] + 170, 62, 50, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(cx - 52, r[1] + 140); g.lineTo(cx - 38, r[1] + 92); g.lineTo(cx - 18, r[1] + 128); g.fill();
    g.beginPath(); g.moveTo(cx + 52, r[1] + 140); g.lineTo(cx + 38, r[1] + 92); g.lineTo(cx + 18, r[1] + 128); g.fill();
    g.fillStyle = "#222"; g.fillRect(cx - 28, r[1] + 158, 12, 12); g.fillRect(cx + 16, r[1] + 158, 12, 12);
    texte("« Pistache », roux, très gentil", cx, r[1] + 258, 16, "#333"); texte("RÉCOMPENSE", cx, r[1] + 296, 26, "#b8231c", true);
    for (let i = 0; i < 8; i++) (g.fillStyle = "#ddd"), g.fillRect(r[0] + 6 + i * 31, r[1] + 330, 26, 50), texte("06 41", r[0] + 19 + i * 31, r[1] + 355, 9, "#333");
    // 2 : KRAKO, la boisson
    r = A[2]; cx = r[0] + 128;
    fond(r, "#d81e2a", "#7a0d14");
    texte("KRAKO", cx, r[1] + 60, 58, "#fff", true); texte("ça pétille !", cx, r[1] + 105, 24, "#ffe08a", true);
    g.fillStyle = "#2a1408"; g.fillRect(cx - 30, r[1] + 150, 60, 170); g.fillRect(cx - 14, r[1] + 120, 28, 34);
    g.fillStyle = "#fff"; g.fillRect(cx - 30, r[1] + 205, 60, 44); texte("KRAKO", cx, r[1] + 227, 17, "#d81e2a", true);
    // 3 : concert
    r = A[3]; cx = r[0] + 128;
    fond(r, "#1a1033", "#401060");
    for (let i = 0; i < 12; i++) (g.fillStyle = "rgba(255,200,60," + (0.15 + h() * 0.3) + ")"), g.beginPath(), g.arc(r[0] + h() * 256, r[1] + h() * 200, 8 + h() * 30, 0, 7), g.fill();
    texte("LES FRELONS", cx, r[1] + 190, 34, "#ffd23c", true); texte("en concert", cx, r[1] + 230, 24, "#fff");
    texte("SAMEDI 14 MARS", cx, r[1] + 290, 24, "#fff", true); texte("Salle du Rempart", cx, r[1] + 330, 18, "#c9b6ff");
    g.fillStyle = "#c22"; g.save(); g.translate(cx, r[1] + 260); g.rotate(-0.3); g.fillRect(-120, -16, 240, 32); texte("ANNULÉ", 0, 0, 26, "#fff", true); g.restore();
    // 4 : Zéphyr mobile
    r = A[4]; cx = r[0] + 128;
    fond(r, "#e8f3ff", "#7fb3e6");
    texte("ONDIVAL", cx, r[1] + 50, 42, "#0b3d7a", true); texte("mobile", cx, r[1] + 88, 26, "#0b3d7a");
    g.fillStyle = "#111"; g.fillRect(cx - 50, r[1] + 120, 100, 190); g.fillStyle = "#3aa0ff"; g.fillRect(cx - 42, r[1] + 132, 84, 160);
    texte("5G partout", cx, r[1] + 345, 24, "#0b3d7a", true);
    // 5 : biscuits Valdrine (livre n° 27 : un nom inventé, qui ne ressemble à aucune vraie marque)
    r = A[5]; cx = r[0] + 128;
    fond(r, "#ffd56b", "#f29a2e");
    texte("VALDRINE", cx, r[1] + 60, 40, "#5a2a0a", true); texte("biscuits au beurre", cx, r[1] + 100, 20, "#5a2a0a");
    for (let i = 0; i < 5; i++) (g.fillStyle = "#c97a2a"), g.beginPath(), g.arc(cx - 70 + i * 35, r[1] + 200 + (i % 2) * 30, 30, 0, 7), g.fill(), (g.fillStyle = "#e9a95a"), g.beginPath(), g.arc(cx - 70 + i * 35, r[1] + 200 + (i % 2) * 30, 22, 0, 7), g.fill();
    texte("Le goût d'avant", cx, r[1] + 320, 22, "#5a2a0a", true);
    // 6 : fête de la ville
    r = A[6]; cx = r[0] + 128;
    fond(r, "#2a8a5a", "#14503a");
    for (let i = 0; i < 20; i++) (g.fillStyle = ["#ff5", "#f55", "#5cf", "#fff"][i % 4]), g.fillRect(r[0] + h() * 256, r[1] + h() * 130, 8, 8);
    texte("FÊTE", cx, r[1] + 170, 56, "#fff", true); texte("DE LA VILLE", cx, r[1] + 220, 30, "#fff", true); texte("21 juin · place du Marché", cx, r[1] + 280, 18, "#dfffe8");
    // 7 : cirque Miranda
    r = A[7]; cx = r[0] + 128;
    fond(r, "#f6e7c8");
    for (let i = 0; i < 8; i++) (g.fillStyle = i % 2 ? "#c8202a" : "#f6e7c8"), g.fillRect(r[0] + i * 32, r[1], 32, 140);
    texte("CIRQUE", cx, r[1] + 180, 40, "#c8202a", true); texte("MIRANDA", cx, r[1] + 225, 40, "#1d2b6b", true); texte("Clowns · acrobates · lions", cx, r[1] + 280, 16, "#333");
    // les grands panneaux de pub
    const P = RECTS.pub;
    r = P[0]; fond(r, "#ff6a00", "#c43c00"); texte("PIZZA VOLTA", r[0] + 256, r[1] + 80, 64, "#fff", true); texte("livrée chaude en 20 minutes", r[0] + 256, r[1] + 150, 30, "#fff3d0"); g.fillStyle = "#ffd"; g.beginPath(); g.arc(r[0] + 440, r[1] + 205, 40, 0, 7); g.fill(); texte("📞 33 20", r[0] + 140, r[1] + 210, 30, "#fff", true);
    r = P[1]; fond(r, "#bcd6e8", "#5c7e98"); g.fillStyle = "#b8202a"; g.beginPath(); g.ellipse(r[0] + 330, r[1] + 170, 150, 45, 0, 0, 7); g.fill(); g.fillRect(r[0] + 240, r[1] + 110, 160, 50); g.fillStyle = "#222"; g.beginPath(); g.arc(r[0] + 245, r[1] + 210, 26, 0, 7); g.arc(r[0] + 420, r[1] + 210, 26, 0, 7); g.fill(); texte("AUTO DELMAR", r[0] + 140, r[1] + 60, 38, "#0d2840", true); texte("la nouvelle Ondine", r[0] + 140, r[1] + 105, 24, "#0d2840");
    r = P[2]; fond(r, "#0d2b4f", "#174a7a"); texte("BANQUE DE VALDRIE", r[0] + 256, r[1] + 90, 44, "#e8c66a", true); texte("Votre avenir, notre métier", r[0] + 256, r[1] + 155, 28, "#fff");
    r = P[3]; fond(r, "#ffffff", "#d8eef8"); texte("MONTVALDRE", r[0] + 180, r[1] + 90, 48, "#1a5aa8", true); texte("lait frais de nos montagnes", r[0] + 180, r[1] + 150, 24, "#1a5aa8"); g.fillStyle = "#fff"; g.strokeStyle = "#1a5aa8"; g.lineWidth = 6; g.strokeRect(r[0] + 390, r[1] + 50, 80, 170); texte("1 L", r[0] + 430, r[1] + 140, 30, "#1a5aa8", true);
    // les enseignes des boutiques
    const E = RECTS.enseigne, NOMS = [["BOULANGERIE", "#6a3a14", "#f3e2c0"], ["PHARMACIE", "#fff", "#1f8a3a"], ["CAFÉ DU MARCHÉ", "#f4e8c8", "#5a1e14"], ["TABAC · PRESSE", "#fff", "#b8202a"], ["COIFFURE ÉLODIE", "#4a1a4a", "#f2c6e0"], ["ÉPICERIE FINE", "#fff", "#2a5a2a"], ["BAR LE CENTRAL", "#ffd23c", "#1a1a1a"], ["LIBRAIRIE", "#1a2a5a", "#e6dcc0"]];
    E.forEach((r2, i) => { fond(r2, NOMS[i][2]); g.strokeStyle = NOMS[i][0]; g.lineWidth = 4; g.strokeRect(r2[0] + 6, r2[1] + 6, r2[2] - 12, r2[3] - 12); texte(NOMS[i][0], r2[0] + 256, r2[1] + 50, 46, NOMS[i][1], true); });
    // ✍️ (demande 115) une ÉDITION peut repeindre les affiches, les panneaux et les enseignes (Guerre civile : les GRAFFITIS
    // des deux camps, les boutiques du souk) : affichage/civile3d.js
    for (const f of PEINTRES) f(g, RECTS, h);
    // ✍️ l'abandon : des coulures, des taches, des déchirures, et une couleur passée
    for (let i = 0; i < 900; i++) {
      const x = h() * W, y = h() * H;
      g.fillStyle = h() < 0.5 ? "rgba(60,50,30," + h() * 0.12 + ")" : "rgba(255,255,240," + h() * 0.12 + ")";
      g.fillRect(x, y, 2 + h() * 18, 2 + h() * 18);
    }
    for (const r2 of A.concat(P)) for (let k = 0; k < 3; k++) {
      if (h() < 0.4) continue;
      const x = r2[0] + h() * r2[2], y = r2[1] + (h() < 0.5 ? 0 : r2[3] * 0.75);
      g.fillStyle = "#8a8478";
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + h() * 50, y + h() * 30); g.lineTo(x + h() * 30, y + 30 + h() * 60); g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  // ------------------------------------------------------------------ 2. Les « lots » de sommets (et les boîtes)
  const lot = () => ({ pos: [], nor: [], col: [], uv: [], cache: [], idx: [] });
  const m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(1, 1, 1), p3 = new THREE.Vector3();
  const coul = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
  // la place de l'objet qu'on dessine : position, rotation (y, puis x et z pour un objet couché), échelle
  function placer(x, y, z, ry, rx, rz, sx) {
    e3.set(rx || 0, ry || 0, rz || 0, "YXZ");
    q4.setFromEuler(e3);
    p3.set(x, y, z);
    s3.set(sx || 1, 1, 1);
    m4.compose(p3, q4, s3);
    n3.getNormalMatrix(m4);
  }
  // tourner ce qu'on dessine ensuite autour de l'axe vertical de l'objet (le feuillage n'est pas un cube tout droit) ; null : fini
  const base4 = new THREE.Matrix4(), rot4 = new THREE.Matrix4();
  let tourne = false;
  function tourner(a) {
    if (!tourne) base4.copy(m4), (tourne = true);
    if (a === null) (m4.copy(base4), (tourne = false));
    else m4.copy(base4).multiply(rot4.makeRotationY(a));
    n3.getNormalMatrix(m4);
  }
  // une boîte (dans le repère de l'objet) ; rect : la zone de l'image (affiches) pour la face +z, sinon null
  function boite(L, x0, x1, y0, y1, z0, z1, c, rect, sansDessous) {
    const F = [
      [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]],
      [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]],
      [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]],
      [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]],
      [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]],
      [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]],
    ];
    F.forEach((f, i) => {
      if (rect && i > 0) return; // (une affiche : seulement sa face avant)
      if (i === 5 && sansDessous) return;
      const o = L.pos.length / 3, k = i === 4 ? 1 : i === 5 ? 0.6 : 0.85;
      v3.set(f[4][0], f[4][1], f[4][2]).applyMatrix3(n3).normalize();
      for (let j = 0; j < 4; j++) {
        p3.set(f[j][0], f[j][1], f[j][2]).applyMatrix4(m4);
        L.pos.push(p3.x, p3.y, p3.z);
        L.nor.push(v3.x, v3.y, v3.z);
        L.col.push(c[0] * k, c[1] * k, c[2] * k);
        L.cache.push(0);
        if (rect) L.uv.push(rect[0] + (j === 1 || j === 2 ? rect[2] : 0), rect[1] + (j >= 2 ? rect[3] : 0));
        else L.uv.push(0, 0);
      }
      L.idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
    });
  }
  // un quadrilatère posé à plat sur le sol (les lignes, les passages piétons, les papiers…), coins dans le monde
  function aPlat(L, pts, y, c) {
    const o = L.pos.length / 3;
    for (const [x, z] of pts) (L.pos.push(x, (y === undefined ? T.hauteur(x, z) : y) + 0.035, z), L.nor.push(0, 1, 0), L.col.push(c[0], c[1], c[2]), L.cache.push(0), L.uv.push(0, 0));
    L.idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  }

  // ------------------------------------------------------------------ 3. LES FORMES (dans le repère de l'objet : x = devant)
  const GRIS = coul(0x6a6c6e), FONCE = coul(0x2a2b2d), NOIR = coul(0x111111), BLANC = coul(0xeeeeea), BOIS = coul(0x7a5232), VERT = coul(0x2f5a3a), BETON = coul(0xa8a49a);
  const VITRE = coul(0x1c2228), PNEU = coul(0x141414), CHROME = coul(0x9a9ea2), FEU_AV = coul(0xf4f0d8), FEU_AR = coul(0xa01010);
  const F = {
    // --- les véhicules (blanc = la couleur de l'instance)
    berline(L) {
      const B = [1, 1, 1];
      boite(L, -2.2, 2.2, 0.32, 0.92, -0.9, 0.9, B, null, true);
      boite(L, -1.25, 0.95, 0.92, 1.38, -0.8, 0.8, VITRE, null, true);
      boite(L, -1.15, 0.85, 1.38, 1.45, -0.76, 0.76, B, null, true);
      for (const [x, z] of [[1.4, 0.82], [-1.35, 0.82], [1.4, -0.82], [-1.35, -0.82]]) boite(L, x - 0.33, x + 0.33, 0, 0.66, z - 0.12, z + 0.12, PNEU, null, true);
      boite(L, 2.2, 2.25, 0.62, 0.8, -0.82, 0.82, FEU_AV, null, true); boite(L, -2.25, -2.2, 0.62, 0.8, -0.84, 0.84, FEU_AR, null, true);
    },
    fourgonnette(L) {
      const B = [1, 1, 1];
      boite(L, -2.45, 2.45, 0.34, 1.05, -0.92, 0.92, B);
      boite(L, -2.45, 1.2, 1.05, 1.92, -0.92, 0.92, B);
      boite(L, 1.2, 1.9, 1.05, 1.78, -0.86, 0.86, VITRE);
      boite(L, 0.2, 1.2, 1.15, 1.7, -0.93, 0.93, VITRE);
      for (const [x, z] of [[1.6, 0.82], [-1.6, 0.82], [1.6, -0.82], [-1.6, -0.82]]) boite(L, x - 0.34, x + 0.34, 0, 0.68, z - 0.14, z + 0.14, PNEU);
      boite(L, 2.43, 2.49, 0.75, 0.88, -0.85, -0.55, FEU_AV); boite(L, 2.43, 2.49, 0.75, 0.88, 0.55, 0.85, FEU_AV);
      boite(L, -2.5, -2.44, 0.7, 0.9, -0.88, -0.6, FEU_AR); boite(L, -2.5, -2.44, 0.7, 0.9, 0.6, 0.88, FEU_AR);
    },
    // une portière (charnière en x = 0, elle va vers l'arrière, −x) : la tôle et sa vitre
    portiere(L) { boite(L, -1.0, 0, 0.36, 0.92, -0.04, 0.04, [1, 1, 1]); boite(L, -0.95, -0.05, 0.92, 1.33, -0.025, 0.025, VITRE); },
    bus(L) {
      const B = [1, 1, 1];
      boite(L, -6, 6, 0.38, 1.2, -1.27, 1.27, B);
      boite(L, -6, 6, 1.2, 2.35, -1.25, 1.25, VITRE);
      boite(L, -6, 6, 2.35, 3.1, -1.27, 1.27, B);
      for (let x = -4.6; x < 6; x += 1.6) boite(L, x, x + 0.12, 1.2, 2.35, -1.28, 1.28, B);
      boite(L, 5.9, 6.05, 0.5, 2.6, -1.2, 1.2, VITRE);
      for (const [x, z] of [[4.2, 1.1], [-3.8, 1.1], [4.2, -1.1], [-3.8, -1.1]]) boite(L, x - 0.5, x + 0.5, 0, 1, z - 0.18, z + 0.18, PNEU);
      boite(L, 6.0, 6.08, 2.6, 2.95, -0.9, 0.9, coul(0x111111));
    },
    scooter(L) {
      const B = [1, 1, 1];
      boite(L, -0.7, 0.55, 0.25, 0.55, -0.2, 0.2, B); boite(L, -0.6, 0.05, 0.55, 0.75, -0.18, 0.18, FONCE);
      boite(L, 0.45, 0.65, 0.3, 1.05, -0.12, 0.12, B); boite(L, 0.55, 0.62, 1.05, 1.1, -0.35, 0.35, FONCE);
      boite(L, 0.55, 0.95, 0, 0.42, -0.06, 0.06, PNEU); boite(L, -0.95, -0.55, 0, 0.42, -0.06, 0.06, PNEU);
    },
    // --- le mobilier
    lampadaire(L) {
      boite(L, -0.09, 0.09, 0, 0.5, -0.09, 0.09, FONCE); boite(L, -0.06, 0.06, 0.5, 6, -0.06, 0.06, GRIS);
      boite(L, 0, 1.6, 5.9, 6, -0.04, 0.04, GRIS); boite(L, 1.2, 1.75, 5.75, 5.95, -0.15, 0.15, FONCE); boite(L, 1.25, 1.7, 5.72, 5.75, -0.12, 0.12, coul(0xd8d2b0));
    },
    feu(L) {
      boite(L, -0.06, 0.06, 0, 2.9, -0.06, 0.06, FONCE); boite(L, -0.14, 0.14, 2.1, 3.0, -0.14, 0.14, NOIR);
      boite(L, 0.14, 0.17, 2.75, 2.92, -0.08, 0.08, coul(0x701010)); boite(L, 0.14, 0.17, 2.47, 2.64, -0.08, 0.08, coul(0x6a4a08)); boite(L, 0.14, 0.17, 2.19, 2.36, -0.08, 0.08, coul(0x0a5a20));
      boite(L, -0.04, 0.04, 1.0, 1.35, -0.18, -0.06, coul(0xb8b020));
    },
    panneau0(L) { boite(L, -0.04, 0.04, 0, 2.3, -0.04, 0.04, GRIS); boite(L, 0.04, 0.07, 1.7, 2.4, -0.35, 0.35, coul(0xb81c1c)); boite(L, 0.07, 0.075, 1.95, 2.15, -0.25, 0.25, BLANC); },
    panneau1(L) { boite(L, -0.04, 0.04, 0, 2.3, -0.04, 0.04, GRIS); boite(L, 0.04, 0.07, 1.7, 2.4, -0.35, 0.35, coul(0x1d4fa0)); boite(L, 0.07, 0.075, 1.9, 2.2, -0.05, 0.2, BLANC); },
    panneau2(L) { boite(L, -0.04, 0.04, 0, 2.3, -0.04, 0.04, GRIS); boite(L, 0.04, 0.07, 1.7, 2.35, -0.33, 0.33, BLANC); boite(L, 0.07, 0.075, 1.75, 2.3, -0.28, 0.28, coul(0xc8202a)); boite(L, 0.075, 0.08, 1.85, 2.18, -0.18, 0.18, BLANC); },
    banc(L) {
      for (const z of [-0.8, 0.8]) boite(L, -0.25, 0.25, 0, 0.45, z - 0.04, z + 0.04, FONCE);
      for (let i = 0; i < 3; i++) boite(L, -0.22 + i * 0.15, -0.1 + i * 0.15, 0.42, 0.46, -0.95, 0.95, BOIS);
      for (let i = 0; i < 2; i++) boite(L, -0.28, -0.24, 0.55 + i * 0.16, 0.67 + i * 0.16, -0.95, 0.95, BOIS);
    },
    poubelle(L) { boite(L, -0.25, 0.25, 0, 0.85, -0.25, 0.25, coul(0x2e5a3a)); boite(L, -0.27, 0.27, 0.85, 0.92, -0.27, 0.27, coul(0x23462d)); },
    bac(L) {
      boite(L, -0.6, 0.6, 0, 0.55, -0.6, 0.6, BETON); boite(L, -0.52, 0.52, 0.55, 0.57, -0.52, 0.52, coul(0x4a3a28));
      boite(L, -0.07, 0.07, 0.55, 2.6, -0.07, 0.07, coul(0x5a4632));
      const fe = coul(0x3e6a2e);
      tourner(0.6); boite(L, -0.85, 0.85, 2.2, 3.3, -0.85, 0.85, fe); tourner(-0.3); boite(L, -0.6, 0.6, 3.1, 3.9, -0.6, 0.6, coul(0x4a7a36)); tourner(null);
    },
    barriere(L) {
      for (const z of [-1.15, 1.15]) boite(L, -0.2, 0.2, 0, 0.12, z - 0.3, z + 0.3, BETON);
      boite(L, -0.025, 0.025, 0.1, 2.0, -1.15, 1.15, coul(0x9aa0a4));
      for (let z = -1.0; z < 1.1; z += 0.25) boite(L, -0.03, 0.03, 0.1, 2.0, z - 0.01, z + 0.01, coul(0x8a9094));
      for (const y of [0.1, 1.95]) boite(L, -0.035, 0.035, y, y + 0.05, -1.15, 1.15, coul(0x8a9094));
    },
    table(L) { boite(L, -0.35, 0.35, 0.72, 0.75, -0.35, 0.35, coul(0xd8d8d0)); boite(L, -0.03, 0.03, 0.05, 0.72, -0.03, 0.03, FONCE); boite(L, -0.22, 0.22, 0, 0.05, -0.22, 0.22, FONCE); },
    chaise(L) { boite(L, -0.2, 0.2, 0.44, 0.48, -0.2, 0.2, [1, 1, 1]); boite(L, -0.22, -0.18, 0.48, 0.9, -0.2, 0.2, [1, 1, 1]); for (const [x, z] of [[-0.18, -0.18], [0.16, -0.18], [-0.18, 0.16], [0.16, 0.16]]) boite(L, x, x + 0.025, 0, 0.44, z, z + 0.025, GRIS); },
    // --- les objets du quotidien (blanc = leur couleur)
    sac(L) { boite(L, -0.15, 0.15, 0, 0.42, -0.12, 0.12, [1, 1, 1]); boite(L, 0.15, 0.22, 0.05, 0.25, -0.09, 0.09, [0.85, 0.85, 0.85]); boite(L, -0.17, -0.15, 0.1, 0.38, -0.08, -0.05, NOIR); boite(L, -0.17, -0.15, 0.1, 0.38, 0.05, 0.08, NOIR); },
    valise(L) { boite(L, -0.35, 0.35, 0, 0.24, -0.23, 0.23, [1, 1, 1]); boite(L, -0.08, 0.08, 0.24, 0.27, -0.02, 0.02, NOIR); },
    valiseOuverte(L) {
      boite(L, -0.35, 0.35, 0, 0.12, -0.23, 0.23, [1, 1, 1]); boite(L, -0.35, 0.35, 0, 0.12, 0.25, 0.71, [1, 1, 1]);
      boite(L, -0.3, 0.0, 0.12, 0.17, -0.2, 0.05, coul(0xc05050)); boite(L, 0.0, 0.3, 0.12, 0.16, -0.18, 0.15, coul(0xe0e0d8)); boite(L, -0.6, -0.2, 0, 0.03, -0.6, -0.25, coul(0x5a7aa8));
    },
    telephone(L) { boite(L, -0.08, 0.08, 0, 0.012, -0.04, 0.04, NOIR); boite(L, -0.07, 0.07, 0.012, 0.014, -0.035, 0.035, coul(0x3a5a7a)); },
    ours(L) { const b = coul(0x8a5a2a); boite(L, -0.12, 0.12, 0, 0.28, -0.13, 0.13, b); boite(L, -0.1, 0.1, 0.28, 0.46, -0.1, 0.1, b); for (const z of [-0.09, 0.09]) boite(L, -0.03, 0.03, 0.44, 0.52, z - 0.04, z + 0.04, b); boite(L, 0.1, 0.14, 0.33, 0.39, -0.03, 0.03, NOIR); for (const z of [-0.16, 0.16]) boite(L, 0.05, 0.25, 0, 0.08, z - 0.05, z + 0.05, b); },
    ballon(L) { boite(L, -0.11, 0.11, 0.0, 0.22, -0.11, 0.11, [1, 1, 1]); boite(L, -0.08, 0.08, -0.02, 0.24, -0.08, 0.08, [0.15, 0.15, 0.15]); boite(L, -0.115, 0.115, 0.03, 0.19, -0.05, 0.05, [1, 1, 1]); },
    journal(L) { boite(L, -0.2, 0.2, 0, 0.015, -0.15, 0.15, coul(0xdcdad0)); boite(L, -0.18, 0.05, 0.015, 0.017, -0.13, -0.05, coul(0x333333)); boite(L, -0.6, -0.25, 0, 0.008, 0.05, 0.3, coul(0xd0cec4)); },
    carton(L) { const k = coul(0xa07a4a); boite(L, -0.28, 0.28, 0, 0.4, -0.22, 0.22, k); boite(L, -0.28, 0.28, 0.4, 0.42, 0.22, 0.5, coul(0x8a6a3a)); },
    veste(L) { boite(L, -0.3, 0.3, 0, 0.04, -0.25, 0.25, [1, 1, 1]); boite(L, -0.25, 0.05, 0, 0.035, 0.25, 0.65, [0.9, 0.9, 0.9]); boite(L, -0.25, 0.1, 0, 0.035, -0.75, -0.25, [0.9, 0.9, 0.9]); },
    chaussure(L) { boite(L, -0.14, 0.14, 0, 0.1, -0.05, 0.05, [1, 1, 1]); boite(L, -0.14, -0.02, 0.1, 0.16, -0.05, 0.05, [1, 1, 1]); },
    caddie(L) {
      const m = coul(0xb0b4b8);
      for (const z of [-0.28, 0.28]) boite(L, -0.45, 0.45, 0.35, 0.95, z - 0.01, z + 0.01, m);
      boite(L, -0.45, 0.45, 0.35, 0.37, -0.28, 0.28, m); boite(L, 0.43, 0.45, 0.35, 0.95, -0.28, 0.28, m); boite(L, -0.45, -0.43, 0.35, 0.95, -0.28, 0.28, m);
      boite(L, -0.6, -0.55, 0.95, 1.0, -0.28, 0.28, coul(0xc02020));
      for (const [x, z] of [[0.35, 0.22], [-0.35, 0.22], [0.35, -0.22], [-0.35, -0.22]]) boite(L, x - 0.05, x + 0.05, 0, 0.1, z - 0.02, z + 0.02, NOIR);
    },
    velo(L) {
      const c = [1, 1, 1];
      for (const x of [-0.55, 0.55]) (boite(L, x - 0.33, x + 0.33, 0.02, 0.06, -0.02, 0.02, PNEU), boite(L, x - 0.33, x + 0.33, 0.62, 0.66, -0.02, 0.02, PNEU), boite(L, x - 0.35, x - 0.31, 0.04, 0.64, -0.02, 0.02, PNEU), boite(L, x + 0.31, x + 0.35, 0.04, 0.64, -0.02, 0.02, PNEU));
      boite(L, -0.55, 0.55, 0.32, 0.36, -0.02, 0.02, c); boite(L, -0.2, 0.45, 0.6, 0.64, -0.02, 0.02, c); boite(L, -0.22, -0.18, 0.32, 0.8, -0.02, 0.02, c); boite(L, -0.3, -0.1, 0.8, 0.84, -0.06, 0.06, NOIR); boite(L, 0.42, 0.46, 0.34, 0.95, -0.02, 0.02, c); boite(L, 0.42, 0.46, 0.93, 0.97, -0.25, 0.25, NOIR);
    },
    // --- accrochés aux façades (z = devant le mur, vers la rue)
    store(L) { const c = [1, 1, 1]; boite(L, -0.8, 0.8, -0.05, 0.02, 0, 1.3, c); boite(L, -0.8, 0.8, -0.32, -0.05, 1.22, 1.32, [0.85, 0.85, 0.85]); boite(L, -0.82, -0.78, -0.3, 0.02, 0, 1.3, FONCE); boite(L, 0.78, 0.82, -0.3, 0.02, 0, 1.3, FONCE); },
    balcon(L) {
      boite(L, -0.7, 0.7, -0.12, 0.0, 0, 0.9, BETON);
      boite(L, -0.7, 0.7, 0.0, 0.95, 0.86, 0.9, coul(0x1e1f22), null, true); // (un garde-corps plein, en métal noir)
      for (const x of [-0.7, 0.66]) boite(L, x, x + 0.04, 0, 0.95, 0, 0.9, coul(0x1e1f22), null, true);
    },
    linge(L) {
      boite(L, -0.65, 0.65, -0.01, 0.0, 0.7, 0.71, coul(0xdddddd));
      const cs = [coul(0xe8e4dc), coul(0x5a7aa8), coul(0xc05050), coul(0xe0c060), coul(0x6a9a6a)];
      for (let i = 0; i < 3; i++) boite(L, -0.6 + i * 0.42, -0.3 + i * 0.42, -0.5 + (i % 2) * 0.12, -0.01, 0.69, 0.71, cs[i + 1], null, true);
    },
    clim(L) { boite(L, -0.4, 0.4, 0, 0.55, 0, 0.32, coul(0xd8d8d2)); boite(L, -0.3, 0.1, 0.08, 0.47, 0.32, 0.325, FONCE, null, true); },
  };

  // ------------------------------------------------------------------ 4. Les quartiers de dessin (70 m)
  // (le mobilier et les affiches : par quartier de 140 m — moins de dessins ; les petits objets : par 70 m — plus fin)
  const numero = (x, z, t) => Math.floor((x + 5000) / t) * 1000 + Math.floor((z + 5000) / t) + (t === TAILLE ? 0 : 5e6);
  const vide = () => ({ mobilier: lot(), affiches: lot(), petits: lot() });
  function quartier(x, z) {
    const n = numero(x, z, TAILLE * 2), m = numero(x, z, TAILLE);
    if (!quartiers.has(n)) quartiers.set(n, vide());
    if (!quartiers.has(m)) quartiers.set(m, vide());
    const gros = quartiers.get(n);
    return { mobilier: gros.mobilier, affiches: gros.affiches, petits: quartiers.get(m).petits };
  }
  // On note, pour chaque objet, la plage de ses sommets (pour le cacher quand il est écrasé)
  function dessinerObjet(L, o, faire) {
    const debut = L.pos.length / 3;
    faire();
    o.plage = { L, debut, fin: L.pos.length / 3 };
  }

  function construire(g, ajouterMorceau) {
    if (!VI() || !VI().actif) return;
    const t0 = performance.now();
    const V = VI(), Q = T.variante.quartier, R = V.reglages, ruines = V.mode === "ruines";
    atlas = peindreAtlas();
    // les matières : « cache » écrase un sommet (objet écrasé, store tombé avec son mur)
    const avecCache = (mat, ombre) => {
      mat.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float cache;").replace("#include <begin_vertex>", "#include <begin_vertex>\nif (cache > 0.5) transformed = vec3(0.0);");
      };
      mat.customProgramCacheKey = () => "ville-cache" + (ombre ? "o" : "") + (mat.map ? "m" : "");
      return mat;
    };
    matMobilier = avecCache(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }));
    matPetits = avecCache(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
    matAffiches = avecCache(new THREE.MeshStandardMaterial({ map: atlas, vertexColors: true, roughness: 0.75 }));
    profondeur = avecCache(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), true);
    // --- les trottoirs (une bordure de 15 cm) : 4 bandes autour de chaque îlot bâti, qui suivent le sol
    const BO = R.rue.bordure, DALLE = coul(ruines ? 0x7a7872 : 0x8f8b83), BORD = coul(ruines ? 0x8a8780 : 0xa8a49b);
    const solEn = (x, z) => T.hauteur(x, z) + BO;
    for (const t of V.sols.trottoirs) {
      const a = t.exterieur, b = t.interieur, bandes = [[-a, a, b, a], [-a, a, -a, -b], [b, a, -b, b], [-a, -b, -b, b]]; // [x0, x1, z0, z1] relatifs
      for (const [x0, x1, z0, z1] of bandes) {
        const long = x1 - x0 > z1 - z0, nb = Math.ceil((long ? x1 - x0 : z1 - z0) / 3.1);
        for (let k = 0; k < nb; k++) {
          const f0 = k / nb, f1 = (k + 1) / nb;
          const X0 = t.x + (long ? x0 + (x1 - x0) * f0 : x0), X1 = t.x + (long ? x0 + (x1 - x0) * f1 : x1), Z0 = t.z + (long ? z0 : z0 + (z1 - z0) * f0), Z1 = t.z + (long ? z1 : z0 + (z1 - z0) * f1);
          const L = quartier((X0 + X1) / 2, (Z0 + Z1) / 2).mobilier, c = k % 2 ? DALLE : DALLE.map((v) => v * 0.95);
          const o = L.pos.length / 3, pts = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]];
          for (const [x, z] of pts) (L.pos.push(x, solEn(x, z), z), L.nor.push(0, 1, 0), L.col.push(c[0], c[1], c[2]), L.cache.push(0), L.uv.push(0, 0));
          L.idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
          // la bordure (le côté qui donne sur la chaussée), en pierre plus claire
          const cote = (xa, za, xb, zb, nx, nz) => {
            const p = L.pos.length / 3;
            for (const [x, z, y] of [[xa, za, T.hauteur(xa, za) - 0.05], [xb, zb, T.hauteur(xb, zb) - 0.05], [xb, zb, solEn(xb, zb)], [xa, za, solEn(xa, za)]]) (L.pos.push(x, y, z), L.nor.push(nx, 0, nz), L.col.push(BORD[0], BORD[1], BORD[2]), L.cache.push(0), L.uv.push(0, 0));
            L.idx.push(p, p + 1, p + 2, p, p + 2, p + 3);
          };
          const ex = t.x, ez = t.z;
          if (Math.abs(Z1 - ez - a) < 0.01) cote(X1, Z1, X0, Z1, 0, 1);
          if (Math.abs(Z0 - ez + a) < 0.01) cote(X0, Z0, X1, Z0, 0, -1);
          if (Math.abs(X1 - ex - a) < 0.01) cote(X1, Z0, X1, Z1, 1, 0);
          if (Math.abs(X0 - ex + a) < 0.01) cote(X0, Z1, X0, Z0, -1, 0);
        }
      }
    }
    // --- les passages piétons, les lignes pointillées, les plaques d'égout
    const PEINT = coul(ruines ? 0x9c9a94 : 0xe6e4dc), demiCh = R.rue.chaussee / 2;
    for (const p of V.sols.passages) {
      const L = quartier(p.x, p.z).mobilier;
      for (let k = -3; k <= 3; k++) {
        if (ruines && (k * 7 + Math.round(p.x)) % 3 === 0) continue; // (effacées par endroits)
        const t = k * 0.95;
        const pts = p.long ? [[p.x - 1.5, p.z + t - 0.25], [p.x + 1.5, p.z + t - 0.25], [p.x + 1.5, p.z + t + 0.25], [p.x - 1.5, p.z + t + 0.25]] : [[p.x + t - 0.25, p.z - 1.5], [p.x + t + 0.25, p.z - 1.5], [p.x + t + 0.25, p.z + 1.5], [p.x + t - 0.25, p.z + 1.5]];
        if (Math.abs(t) < demiCh) aPlat(L, pts, undefined, PEINT);
      }
    }
    for (const l of V.sols.lignes) {
      const d = Math.hypot(l.x1 - l.x0, l.z1 - l.z0), ux = (l.x1 - l.x0) / d, uz = (l.z1 - l.z0) / d;
      for (let s = 0; s + 3 <= d; s += 6) {
        const ax = l.x0 + ux * s, az = l.z0 + uz * s, bx = ax + ux * 3, bz = az + uz * 3, w = 0.08;
        aPlat(quartier(ax, az).mobilier, [[ax - uz * w, az + ux * w], [bx - uz * w, bz + ux * w], [bx + uz * w, bz - ux * w], [ax + uz * w, az - ux * w]], undefined, PEINT);
      }
    }
    for (const e of V.sols.egouts) {
      const L = quartier(e.x, e.z).mobilier, pts = [];
      for (let k = 0; k < 8; k++) pts.push([e.x + Math.cos((k / 8) * 6.283) * 0.4, e.z + Math.sin((k / 8) * 6.283) * 0.4]);
      const y = T.hauteur(e.x, e.z), o = L.pos.length / 3, c = coul(0x2c2c2a);
      L.pos.push(e.x, y + 0.04, e.z), L.nor.push(0, 1, 0), L.col.push(...c), L.cache.push(0), L.uv.push(0, 0);
      for (const [x, z] of pts) L.pos.push(x, y + 0.04, z), L.nor.push(0, 1, 0), L.col.push(...c), L.cache.push(0), L.uv.push(0, 0);
      for (let k = 0; k < 8; k++) L.idx.push(o, o + 1 + ((k + 1) % 8), o + 1 + k);
    }
    // --- les objets : le mobilier, les petits objets, les affiches (recollés), et les instances
    const insts = {};
    const instance = (forme, o, couleur, y, rx, rz) => (insts[forme] = insts[forme] || []).push({ o, couleur, y, rx, rz });
    for (const o of V.objets) {
      const s = o.sorte;
      if (o.dessinAutre) continue; // (demande 115, Guerre civile : les barricades, les draps, les étals : c'est affichage/civile3d.js qui les peint)
      if (s === "voiture") {
        instance(o.modele, o, o.couleur);
        const P = [[0.75, 0.9], [0.75, -0.9], [-0.35, 0.9]];
        o.portes.forEach((ouverte, i) => ouverte && instance("portiere", Object.assign({ porteDe: o, porte: P[i] }, {}), o.couleur));
        continue;
      }
      if (s === "bus") { instance("bus", o, o.couleur); continue; }
      if (s === "scooter") { instance("scooter", o, o.couleur, 0, o.couche ? Math.PI / 2 : 0); continue; }
      if (s === "papier") { // un papier : un petit carré à plat
        const L = quartier(o.x, o.z).petits, c = Math.cos(o.rot) * o.taille, sn = Math.sin(o.rot) * o.taille, k = 0.7 + o.teinte * 0.3;
        aPlat(L, [[o.x - c + sn, o.z - sn - c], [o.x + c + sn, o.z + sn - c], [o.x + c - sn, o.z + sn + c], [o.x - c - sn, o.z - sn + c]], o.y + (trottoir(o.x, o.z) ? R.rue.bordure : 0) - 0.02, o.teinte < 0.2 ? [0.9 * k, 0.85 * k, 0.6 * k] : [k, k, k * 0.97]);
        continue;
      }
      if (o.b) { // accroché à une façade (z = la rue) : store, enseigne, affiche, balcon, linge, clim
        const qo = quartier(o.x, o.z);
        if (s === "affiche" || s === "enseigne") {
          dessinerObjet(qo.affiches, o, () => {
            const r = uvDe((s === "affiche" ? RECTS.affiche : RECTS.enseigne)[o.pub]);
            placer(o.x + o.nx * 0.02, o.y, o.z + o.nz * 0.02, o.rot, 0, o.penche || 0);
            if (s === "affiche") boite(qo.affiches, -0.42, 0.42, 0, 1.26, -0.005, 0.005, o.dechire ? [0.8, 0.78, 0.74] : [1, 1, 1], r);
            else boite(qo.affiches, -1.2, 1.2, 0, 0.5, 0, 0.06, [1, 1, 1], r);
          });
          bilan.affiches++;
        } else dessinerObjet(qo.mobilier, o, () => {
          placer(o.x + o.nx * 0.01, o.y, o.z + o.nz * 0.01, o.rot, 0, 0, s === "store" ? Math.max(0.6, o.larg / 1.6) : s === "balcon" ? o.larg / 1.4 : 1);
          const L0 = qo.mobilier, debut = L0.col.length;
          F[s](L0);
          if (o.couleur !== undefined) { const c = coul(o.couleur); for (let i = debut; i < L0.col.length; i += 3) (L0.col[i] *= c[0]), (L0.col[i + 1] *= c[1]), (L0.col[i + 2] *= c[2]); }
        });
        continue;
      }
      // le reste : posé par terre (sur le trottoir : 15 cm plus haut)
      const y = o.y + (trottoir(o.x, o.z) ? R.rue.bordure : 0);
      const gros = ["lampadaire", "feu", "panneau", "banc", "poubelle", "bac", "barriere", "abribus", "kiosque", "pub"].includes(s);
      const qo = quartier(o.x, o.z), L = gros ? qo.mobilier : qo.petits;
      const couche = o.renversee || (o.couche && (s === "velo" || s === "caddie"));
      if (s === "abribus" || s === "kiosque" || s === "pub") {
        dessinerObjet(L, o, () => abriEtCo(qo, o, y));
        continue;
      }
      dessinerObjet(L, o, () => {
        const rot = o.rot !== undefined ? o.rot : -o.angle;
        placer(o.x, y + (couche ? (s === "table" ? 0.35 : s === "chaise" ? 0.22 : s === "poubelle" ? 0.25 : 0.02) : 0), o.z, rot, 0, couche ? Math.PI / 2 * (s === "chaise" ? 0.9 : 1) : 0, s === "bac" ? 1 : 1);
        const debut = L.col.length;
        const forme = s === "panneau" ? "panneau" + (o.modele || 0) : s === "valise" && o.ouvert ? "valiseOuverte" : s;
        (F[forme] || F.carton)(L);
        if (o.couleur !== undefined && !["lampadaire", "feu", "panneau", "banc", "poubelle", "bac", "barriere"].includes(s)) { const c = coul(o.couleur); for (let i = debut; i < L.col.length; i += 3) (L.col[i] *= c[0]), (L.col[i + 1] *= c[1]), (L.col[i + 2] *= c[2]); }
      });
    }
    // --- les quartiers deviennent des objets 3D (3 par quartier : mobilier, affiches, petits)
    for (const [, q] of quartiers) {
      for (const [nom, mat] of [["mobilier", matMobilier], ["affiches", matAffiches], ["petits", matPetits]]) {
        const L = q[nom];
        if (!L.pos.length) continue;
        const geo = new THREE.BufferGeometry(), n = L.pos.length / 3;
        geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(L.pos), 3));
        geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(L.nor), 3));
        geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(L.col), 3));
        geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(L.uv), 2));
        geo.setAttribute("cache", new THREE.BufferAttribute(new Float32Array(L.cache), 1));
        geo.setIndex(new THREE.BufferAttribute(n > 65535 ? new Uint32Array(L.idx) : new Uint16Array(L.idx), 1));
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = nom === "mobilier";
        mesh.receiveShadow = true;
        mesh.customDepthMaterial = profondeur;
        L.mesh = mesh;
        L.triangles = L.idx.length / 3;
        L.pos = L.nor = L.col = L.uv = L.idx = null;
        ajouterMorceau(g, mesh);
        bilan.quartiers++;
      }
    }
    // --- les instances (voitures, portières, bus, scooters)
    for (const forme of ["berline", "fourgonnette", "portiere", "bus", "scooter"]) {
      const liste = insts[forme] || [];
      const L = lot();
      placer(0, 0, 0, 0, 0, 0, 1);
      F[forme](L);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(L.pos), 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(L.nor), 3));
      geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(L.col), 3));
      geo.setIndex(L.idx);
      const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, metalness: 0.25 }), Math.max(1, liste.length));
      im.count = liste.length;
      im.castShadow = true;
      im.receiveShadow = true;
      im.userData = { liste, triangles: L.idx.length / 3 };
      if (liste.length) im.setColorAt(0, new THREE.Color()); // (crée les couleurs des instances)
      instances[forme] = im;
      g.add(im);
      bilan.instances += liste.length;
    }
    majInstances(true);
    pret = true;
    bilan.msConstruction = performance.now() - t0;
    ecouter();
  }
  // L'abribus, le kiosque, le grand panneau de pub : leur forme, et leurs affiches (dans le lot des affiches)
  function abriEtCo(qo, o, y) {
    const L = qo.mobilier, A = qo.affiches;
    if (o.sorte === "abribus") {
      placer(o.x, y, o.z, -o.angle);
      boite(L, -1.9, 1.9, 2.4, 2.5, -0.75, 0.75, GRIS);
      for (const x of [-1.85, 1.8]) boite(L, x, x + 0.06, 0, 2.4, -0.7, -0.64, GRIS);
      boite(L, -1.85, 1.85, 0.2, 2.35, -0.7, -0.66, coul(0x8fa3ad));
      boite(L, -1.2, 1.2, 0.42, 0.47, -0.62, -0.3, BOIS);
      boite(L, 1.86, 1.92, 0.15, 2.3, -0.7, 0.75, GRIS);
      placer(o.x, y, o.z, -o.angle + Math.PI / 2);
      boite(A, -0.7, 0.7, 0.2, 2.25, -1.93, -1.92, [1, 1, 1], uvDe(RECTS.affiche[o.pub]));
    } else if (o.sorte === "kiosque") {
      placer(o.x, y, o.z, -o.angle);
      boite(L, -1.4, 1.4, 0, 2.3, -1.1, 1.1, coul(0x2f4a3a));
      boite(L, -1.6, 1.6, 2.3, 2.45, -1.3, 1.3, coul(0x24382c));
      boite(L, -0.4, 0.4, 2.45, 2.75, -0.4, 0.4, coul(0x24382c));
      boite(L, -1.2, 1.2, 0.9, 1.0, 1.1, 1.45, coul(0x5a4a3a));
      for (let i = 0; i < 6; i++) boite(L, -1.1 + i * 0.38, -0.8 + i * 0.38, 1.0, 1.02, 1.12, 1.4, coul([0xdcdad0, 0xd8c8a0, 0xe0e0e8][i % 3]));
      boite(A, -1.35, -0.2, 1.1, 2.2, 1.1, 1.11, [1, 1, 1], uvDe(RECTS.affiche[o.pub]));
      boite(A, 0.2, 1.35, 1.1, 2.2, 1.1, 1.11, [1, 1, 1], uvDe(RECTS.affiche[(o.pub + 3) % 8]));
    } else { // le grand panneau de pub : 2 pieds, un cadre, l'affiche des deux côtés
      placer(o.x, y, o.z, o.rot);
      for (const x of [-2, 2]) boite(L, x - 0.12, x + 0.12, 0, 3.2, -0.12, 0.12, FONCE);
      boite(L, -3.15, 3.15, 3.1, 6.25, -0.15, 0.1, coul(0x3a3c40));
      boite(A, -3, 3, 3.2, 6.15, 0.1, 0.11, [1, 1, 1], uvDe(RECTS.pub[o.pub]));
      placer(o.x, y, o.z, o.rot + Math.PI);
      boite(A, -3, 3, 3.2, 6.15, 0.15, 0.16, [1, 1, 1], uvDe(RECTS.pub[(o.pub + 2) % 4]));
    }
  }
  const trottoir = (x, z) => VI().trottoir(x, z) > 0;

  // ------------------------------------------------------------------ 5. Chaque image
  const mI = new THREE.Matrix4(), cI = new THREE.Color(), BRULE = new THREE.Color(0x1d1a17);
  function poseInstance(it) {
    const o = it.o;
    if (o.porteDe) { // une portière : sur le côté de sa voiture, ouverte de 55°
      const v = o.porteDe, ca = Math.cos(v.angle), sa = Math.sin(v.angle), [px, pz] = o.porte;
      const x = v.x + px * ca - pz * sa, z = v.z + px * sa + pz * ca;
      placer(x, v.y + (v.brule ? -0.12 : 0), z, -v.angle + Math.sign(pz) * 0.95, 0, v.penche || 0);
      return v.ecrase ? 0 : 1;
    }
    placer(o.x, o.y + (o.brule ? -0.12 : 0), o.z, o.rot !== undefined && o.sorte === "scooter" ? o.rot : -o.angle, it.rx || 0, o.penche || 0);
    return o.ecrase ? 0 : 1;
  }
  // (demande 123 : « ça rame totalement ») Les voitures, portières, bus et scooters : chaque forme est UN dessin pour toutes
  // ses copies. Avant, les 433 voitures de toute la ville étaient dessinées à chaque image (2 fois : l'image et les
  // ombres), même à 1 km derrière toi. Maintenant on ne met dans le dessin que celles à moins de « voitures » m de la
  // caméra (selon le niveau de qualité), et on ne refait la liste que si la caméra a bougé de plus de 8 m ou qu'une
  // voiture a changé (déplacée, brûlée, écrasée). Chaque voiture garde sa matrice toute prête (it.m).
  let voituresX = 1e9, voituresZ = 1e9, voituresD = -1;
  function majInstances(tout, cam, distance) {
    let change = !!tout;
    for (const forme in instances) {
      const liste = instances[forme].userData.liste;
      // on compare les NOMBRES gardés de la dernière fois (avant : un texte fabriqué pour chaque voiture à CHAQUE image)
      for (let i = 0; i < liste.length; i++) {
        const it = liste[i], o = it.o.porteDe || it.o, a = o.angle || 0, etat = (o.brule ? 1 : 0) + (o.ecrase ? 2 : 0);
        if (!tout && it.vuX === o.x && it.vuZ === o.z && it.vuA === a && it.vuE === etat) continue;
        it.vuX = o.x, it.vuZ = o.z, it.vuA = a, it.vuE = etat;
        it.visible = !!poseInstance(it);
        it.m = (it.m || new THREE.Matrix4()).copy(m4);
        it.coul = (it.coul || new THREE.Color()).copy(o.brule ? BRULE : cI.setHex(it.couleur || 0xffffff));
        change = true;
      }
    }
    const cx = cam ? cam.x : 0, cz = cam ? cam.z : 0, d = distance || 1e9;
    if (!change && d === voituresD && Math.abs(cx - voituresX) < 8 && Math.abs(cz - voituresZ) < 8) return;
    (voituresX = cx), (voituresZ = cz), (voituresD = d);
    const d2 = (d + 8) * (d + 8);
    let total = 0;
    for (const forme in instances) {
      const im = instances[forme], liste = im.userData.liste;
      let n = 0;
      for (let i = 0; i < liste.length; i++) {
        const it = liste[i], o = it.o.porteDe || it.o;
        if (!it.visible || (cam && (o.x - cx) * (o.x - cx) + (o.z - cz) * (o.z - cz) > d2)) continue;
        im.setMatrixAt(n, it.m);
        im.setColorAt(n, it.coul);
        n++;
      }
      im.count = n;
      total += n;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.computeBoundingSphere();
    }
    bilan.voituresDessinees = total;
  }
  // cacher (attribut « cache ») les sommets d'un objet écrasé, ou accroché à un morceau de mur tombé
  const aEnvoyer = new Set();
  function cacher(o, oui) {
    if (!o.plage || !o.plage.L.mesh || !!o.vuCache === oui) return;
    o.vuCache = oui;
    const a = o.plage.L.mesh.geometry.attributes.cache;
    for (let i = o.plage.debut; i < o.plage.fin; i++) a.array[i] = oui ? 1 : 0;
    aEnvoyer.add(a);
    bilan.majCaches++;
  }
  const changements = new Map();
  let attente = 0, generationVue = -1;
  function maj(dt, cam, distance) {
    if (!pret) return;
    const V = VI();
    majInstances(false, cam, Tanks.Qualite.reglages.voitures || 400);
    // les objets écrasés (ou remis à leur place à une nouvelle bataille)
    attente -= dt;
    if (attente <= 0 || generationVue !== Tanks.Structures.generation) {
      attente = 0.15;
      generationVue = Tanks.Structures.generation;
      for (const o of V.petits) cacher(o, !!o.ecrase);
      // les objets accrochés à un mur : cachés si leur morceau est tombé (ou la maison en ruine)
      for (const o of V.accroches) {
        const c = o.b.changements + ":" + Tanks.Structures.generation;
        if (changements.get(o) === c) continue;
        changements.set(o, c);
        cacher(o, o.b.morceaux[o.k].tombe || o.b.etat === "ruine");
      }
    }
    for (const a of aEnvoyer) a.needsUpdate = true;
    aEnvoyer.clear();
    // les petits objets : dessinés seulement près de la caméra (et le décor cache déjà ce qui est trop loin)
    let dessins = 0, triangles = 0, petitsVus = 0;
    for (const [, q] of quartiers) for (const nom of ["mobilier", "affiches", "petits"]) {
      const L = q[nom];
      if (!L.mesh) continue;
      if (L.mesh.visible) { // (le décor a déjà caché ce qui est au-delà de la vue ; ici, plus près encore selon la sorte)
        const sp = L.mesh.geometry.boundingSphere, d = Math.hypot(sp.center.x - cam.x, sp.center.z - cam.z) - sp.radius;
        L.mesh.visible = d < (nom === "petits" ? distance : nom === "affiches" ? distance * 1.5 : Math.max(150, distance * 1.8));
        if (nom === "petits" && L.mesh.visible) petitsVus++;
      }
      if (L.mesh.visible) (dessins++, (triangles += L.triangles));
    }
    for (const forme in instances) {
      const im = instances[forme];
      im.visible = im.count > 0;
      if (im.visible) (dessins++, (triangles += im.count * im.userData.triangles));
    }
    bilan.dessins = dessins;
    bilan.triangles = triangles;
    bilan.petitsVus = petitsVus;
    bilan.distance = distance;
  }

  // ------------------------------------------------------------------ 6. La radio : une voiture explose
  function ecouter() {
    Tanks.Evenements.ecouter("voiture-detruite", (d) => {
      Tanks.Explosions.exploser(d.x, d.y + 0.4, d.z, d.sorte === "bus" ? 1.6 : 1.1, "metal", "char");
      Tanks.Explosions.epave(d.x, d.y, d.z, d.sorte === "bus" ? 0.9 : 0.6, 0.7);
    });
  }

  return { construire, maj, bilan, quartiers, instances, get pret() { return pret; }, ajouterPeintre: (f) => PEINTRES.push(f) };
})();
