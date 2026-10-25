// ⚔️ TESSALINE EN 3D : le décorateur de la guerre civile (demande 115, édition « Guerre civile »)
//
// Le maçon (logique/guerre-civile.js) a décidé où sont les barricades, les postes de contrôle, les draps, les étals du
// souk, les mortiers et les drapeaux de quartier ; le peintre de la ville (affichage/ville3d.js) dessine déjà les épaves
// de voitures et de bus. Ce décorateur dessine le reste :
//   - les TAS DE PNEUS, les MURS DE SACS DE SABLE, les CONTENEURS (rouillés, de toutes les couleurs, côtelés), les BLOCS
//     DE BÉTON, les GUÉRITES des postes de contrôle (la barrière rayée levée, le petit drapeau du camp) ;
//   - les GRAFFITIS des deux camps (le RAMEAU vert du Front, l'ÉTOILE rouge de la Garde, des symboles barrés, « ATTENTION
//     TIREUR ! ») : une seule image pour tous, peinte au démarrage ; et, sur les murs de la ville, les affiches du camp et
//     les enseignes du souk (il repasse sur l'image des affiches de affichage/ville3d.js) ;
//   - les DRAPS tendus en travers de la rue des draps, et leurs cordes ;
//   - les ÉTALS DU SOUK : la table, les marchandises (des sacs d'épices, des paniers, des tissus), la toile rayée au-dessus ;
//   - les MORTIERS (le tube sur sa plaque, le cercle de sacs de sable, les caisses d'obus) ;
//   - l'HORLOGE de la tour (4 cadrans), cachée si la tour s'effondre ;
//   - les 5 DRAPEAUX DE QUARTIER : le mât, le drapeau qui monte et descend (à la couleur du camp qui le tient), et le
//     cercle peint par terre qui montre jusqu'où il faut venir pour le prendre ;
//   - sur la grande image du sol : la poussière, les traces de pneus, les pavés de la place du souk et de l'Horloge.
// Pour que le jeu ne rame pas (✍️ Maxance déteste le lag) : tout ce qui ne bouge pas est SOUDÉ par carré de 200 m (1 dessin
// par matière et par carré, et le carré n'est dessiné que près de toi) ; seuls les 5 drapeaux bougent.
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Civile3D = (function () {
  const C = Tanks.CONFIG, T = Tanks.Terrain, O = Tanks.Outils3D, GC = Tanks.GuerreCivile;
  const actif = !!GC && GC.actif;
  const bilan = { dessins: 0, triangles: 0, graffitis: 0, carres: 0, pneus: 0, sacs: 0, conteneurs: 0, beton: 0, guerites: 0, draps: 0, etals: 0, mortiers: 0, drapeaux: 0, ms: 0 };
  let etat = 1977;
  const h = () => ((etat = (etat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const drapeaux = []; // { p, toile, cercle, mat } : les drapeaux de quartier (ils bougent)
  let horloge = null, tour = null;
  const couleurCamp = (e) => (e === "bleus" ? C.equipes.bleus.marque : C.equipes.rouges.marque);

  // ------------------------------------------------------------------ les SYMBOLES inventés des deux camps
  // le RAMEAU d'olivier (le Front) : une tige courbe et 7 feuilles ; l'ÉTOILE à 5 branches (la Garde) dans son cercle
  function symbole(x, sorte, cx, cy, r, couleur) {
    x.save();
    x.translate(cx, cy);
    x.fillStyle = x.strokeStyle = couleur;
    if (sorte === "rameau") {
      const P = [[-0.8 * r, 0.6 * r], [-0.1 * r, -0.1 * r], [0.7 * r, -0.7 * r]];
      x.lineWidth = r * 0.09;
      x.beginPath(), x.moveTo(P[0][0], P[0][1]), x.quadraticCurveTo(P[1][0], P[1][1], P[2][0], P[2][1]), x.stroke();
      for (let k = 0; k < 8; k++) {
        const t = 0.12 + k * 0.11, u = 1 - t;
        const px = u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0], py = u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1];
        const tx = 2 * u * (P[1][0] - P[0][0]) + 2 * t * (P[2][0] - P[1][0]), ty = 2 * u * (P[1][1] - P[0][1]) + 2 * t * (P[2][1] - P[1][1]);
        const a = Math.atan2(ty, tx) + (k % 2 ? 0.9 : -0.9);
        x.beginPath(), x.ellipse(px + Math.cos(a) * r * 0.17, py + Math.sin(a) * r * 0.17, r * 0.19, r * 0.07, a, 0, Math.PI * 2), x.fill();
      }
      for (const [ox, oy] of [[-0.2, 0.25], [0.15, -0.05]]) x.beginPath(), x.arc(ox * r, oy * r, r * 0.07, 0, Math.PI * 2), x.fill(); // 2 olives
    } else {
      x.lineWidth = r * 0.1;
      x.beginPath(), x.arc(0, 0, r * 0.92, 0, Math.PI * 2), x.stroke();
      x.beginPath();
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.3 : r * 0.72; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      x.closePath(), x.fill();
    }
    x.restore();
  }
  // une grande croix noire tracée à la bombe (sur le symbole de l'autre camp)
  function barrer(x, cx, cy, r, couleur) {
    x.save();
    x.strokeStyle = couleur, x.lineWidth = r * 0.16, x.lineCap = "round";
    x.beginPath(), x.moveTo(cx - r, cy - r), x.lineTo(cx + r, cy + r), x.moveTo(cx + r, cy - r), x.lineTo(cx - r, cy + r), x.stroke();
    x.restore();
  }
  function ecrire(x, t, cx, cy, taille, couleur, contour) {
    x.font = "bold " + taille + "px Impact, Arial Black, Arial, sans-serif";
    x.textAlign = "center", x.textBaseline = "middle";
    if (contour) (x.lineWidth = taille * 0.12), (x.strokeStyle = contour), x.strokeText(t, cx, cy);
    x.fillStyle = couleur;
    x.fillText(t, cx, cy);
  }
  // l'effet « bombe de peinture » : un léger flou autour du trait
  const bombe = (x, couleur, flou) => ((x.shadowColor = couleur), (x.shadowBlur = flou));

  // ------------------------------------------------------------------ l'image des GRAFFITIS (8 cases de 256 × 256, fond transparent)
  const VERT = "#2e9a4e", ROUGE = "#c42a22", NOIR = "#1b1a18";
  function imageGraffitis() {
    const c = document.createElement("canvas");
    c.width = 1024, c.height = 512;
    const x = c.getContext("2d"), cases = [];
    for (let k = 0; k < 8; k++) cases.push([(k % 4) * 256 + 128, Math.floor(k / 4) * 256 + 128]);
    const peindre = (k, f) => { x.save(); f(cases[k][0], cases[k][1]); x.restore(); };
    peindre(0, (cx, cy) => (bombe(x, VERT, 8), symbole(x, "rameau", cx, cy, 95, VERT)));
    peindre(1, (cx, cy) => (bombe(x, ROUGE, 8), symbole(x, "etoile", cx, cy, 95, ROUGE)));
    peindre(2, (cx, cy) => (bombe(x, VERT, 6), ecrire(x, "LE FRONT", cx, cy - 40, 52, VERT), ecrire(x, "TIENT !", cx, cy + 22, 60, VERT), symbole(x, "rameau", cx + 70, cy + 85, 30, VERT)));
    peindre(3, (cx, cy) => (bombe(x, ROUGE, 6), ecrire(x, "VIVE LA", cx, cy - 40, 50, ROUGE), ecrire(x, "GARDE", cx, cy + 22, 66, ROUGE), symbole(x, "etoile", cx - 80, cy + 85, 26, ROUGE)));
    peindre(4, (cx, cy) => (bombe(x, ROUGE, 6), symbole(x, "etoile", cx, cy, 80, ROUGE), bombe(x, NOIR, 4), barrer(x, cx, cy, 80, NOIR)));
    peindre(5, (cx, cy) => (bombe(x, VERT, 6), symbole(x, "rameau", cx, cy, 80, VERT), bombe(x, ROUGE, 4), barrer(x, cx, cy, 80, ROUGE)));
    peindre(6, (cx, cy) => {
      bombe(x, NOIR, 5), ecrire(x, "ATTENTION", cx, cy - 50, 44, NOIR), ecrire(x, "TIREUR !", cx, cy + 4, 54, ROUGE, NOIR);
      x.strokeStyle = NOIR, x.lineWidth = 10, x.beginPath(), x.moveTo(cx - 70, cy + 70), x.lineTo(cx + 60, cy + 70), x.stroke();
      x.fillStyle = NOIR, x.beginPath(), x.moveTo(cx + 85, cy + 70), x.lineTo(cx + 50, cy + 50), x.lineTo(cx + 50, cy + 90), x.fill(); // « cours ! »
    });
    peindre(7, (cx, cy) => (bombe(x, NOIR, 4), ecrire(x, "TESSALINE", cx, cy - 25, 46, "#f2ead6", NOIR), ecrire(x, "LIBRE", cx, cy + 35, 62, VERT, NOIR)));
    // les gouttes qui coulent sous les lettres (la peinture fraîche)
    x.shadowBlur = 0;
    for (let k = 0; k < 120; k++) {
      const cx = h() * 1024, cy = h() * 512, d = x.getImageData(Math.floor(cx), Math.floor(cy), 1, 1).data;
      if (d[3] < 200) continue;
      x.fillStyle = "rgba(" + d[0] + "," + d[1] + "," + d[2] + ",0.85)";
      x.fillRect(cx - 1.5, cy, 3, 8 + h() * 26);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  // une case de l'image (0 à 7) → ses coordonnées de texture [u0, v0, u1, v1]
  const caseUV = (k) => { const u0 = (k % 4) / 4, v1 = 1 - Math.floor(k / 4) / 2; return [u0, v1 - 0.5, u0 + 0.25, v1]; };

  // ------------------------------------------------------------------ les AFFICHES de la ville (repeintes pour Tessaline)
  // (affichage/ville3d.js appelle ce peintre sur sa grande image : 8 affiches, 4 grands panneaux, 8 enseignes)
  function peindreAffiches(g, RECTS) {
    const A = RECTS.affiche, P = RECTS.pub, E = RECTS.enseigne;
    const fond = (r, c1, c2) => { const d = g.createLinearGradient(r[0], r[1], r[0], r[1] + r[3]); d.addColorStop(0, c1), d.addColorStop(1, c2 || c1); g.fillStyle = d, g.fillRect(r[0], r[1], r[2], r[3]); };
    const crepi = (r) => { fond(r, "#d6c39c", "#c8b28a"); for (let k = 0; k < 220; k++) (g.fillStyle = "rgba(" + (90 + h() * 60) + "," + (80 + h() * 50) + ",60," + h() * 0.15 + ")"), g.fillRect(r[0] + h() * r[2], r[1] + h() * r[3], 2 + h() * 8, 2 + h() * 8); };
    const milieu = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
    // 0 : l'affiche du Front (imprimée)
    let r = A[0], [cx, cy] = milieu(r);
    fond(r, "#e9e2c8"), (g.fillStyle = "#2f6b4a"), g.fillRect(r[0], r[1], r[2], 120), symbole(g, "rameau", cx, r[1] + 62, 48, "#e9e2c8");
    ecrire(g, "FRONT DES", cx, cy - 20, 30, "#2f6b4a"), ecrire(g, "OLIVIERS", cx, cy + 16, 38, "#2f6b4a"), ecrire(g, "Tessaline libre !", cx, cy + 100, 22, "#333");
    // 1 : l'affiche de la Garde (imprimée)
    r = A[1], [cx, cy] = milieu(r);
    fond(r, "#e6dcc0"), (g.fillStyle = "#7a1f24"), g.fillRect(r[0], r[1], r[2], 120), symbole(g, "etoile", cx, r[1] + 62, 46, "#e6dcc0");
    ecrire(g, "GARDE", cx, cy - 20, 40, "#7a1f24"), ecrire(g, "RÉPUBLICAINE", cx, cy + 16, 26, "#7a1f24"), ecrire(g, "L'ordre et la paix", cx, cy + 100, 22, "#333");
    // 2 : l'avis de couvre-feu (inventé)
    r = A[2], [cx, cy] = milieu(r);
    fond(r, "#f2eee2"), ecrire(g, "AVIS", cx, r[1] + 50, 46, "#111"), ecrire(g, "COUVRE-FEU", cx, r[1] + 110, 32, "#b8231c");
    ["De 18 h à 6 h,", "restez chez vous.", "Ne traversez pas", "la rue du Front."].forEach((l, i) => ecrire(g, l, cx, r[1] + 170 + i * 32, 20, "#333"));
    // 3 à 7 : des GRAFFITIS peints à la bombe sur le crépi (ils remplacent les publicités)
    const sur = (k, f) => { r = A[k]; crepi(r); [cx, cy] = milieu(r); g.save(); f(cx, cy); g.restore(); };
    sur(3, (x, y) => (bombe(g, VERT, 5), symbole(g, "rameau", x, y - 40, 85, VERT), ecrire(g, "LE FRONT TIENT", x, y + 110, 26, VERT)));
    sur(4, (x, y) => (bombe(g, ROUGE, 5), symbole(g, "etoile", x, y - 30, 80, ROUGE), ecrire(g, "VIVE LA GARDE", x, y + 110, 28, ROUGE)));
    sur(5, (x, y) => (bombe(g, ROUGE, 5), symbole(g, "etoile", x, y, 80, ROUGE), bombe(g, NOIR, 4), barrer(g, x, y, 80, NOIR)));
    sur(6, (x, y) => (bombe(g, NOIR, 4), ecrire(g, "ATTENTION", x, y - 40, 40, NOIR), ecrire(g, "TIREUR !", x, y + 20, 48, ROUGE, NOIR)));
    sur(7, (x, y) => (bombe(g, VERT, 5), symbole(g, "rameau", x, y, 80, VERT), bombe(g, ROUGE, 4), barrer(g, x, y, 80, ROUGE)));
    g.shadowBlur = 0;
    // les grands panneaux (des réclames d'avant la guerre, toutes inventées)
    r = P[0], fond(r, "#f0c060", "#d0802a"), ecrire(g, "TESSALINE", r[0] + 256, r[1] + 90, 70, "#fff", "#8a4a10"), ecrire(g, "la perle des sables", r[0] + 256, r[1] + 165, 34, "#5a2a08");
    r = P[1], fond(r, "#2a6a8a", "#164a66"), ecrire(g, "CORVANIE TÉLÉCOM", r[0] + 256, r[1] + 100, 48, "#fff"), ecrire(g, "Parlez, on écoute.", r[0] + 256, r[1] + 165, 28, "#bde4f4");
    r = P[2], fond(r, "#e8e2b0", "#c8c070"), ecrire(g, "HUILE DU MOULIN", r[0] + 256, r[1] + 90, 50, "#4a5a1a"), symbole(g, "rameau", r[0] + 256, r[1] + 175, 40, "#4a6a2a");
    r = P[3], fond(r, "#f4f0e8", "#e0d8c8"), ecrire(g, "THÉ ORIZA", r[0] + 256, r[1] + 95, 64, "#2a6a3a"), ecrire(g, "à la menthe fraîche", r[0] + 256, r[1] + 165, 30, "#2a6a3a");
    g.save(), bombe(g, NOIR, 4), barrer(g, P[1][0] + 400, P[1][1] + 130, 70, NOIR), g.restore(); // (un panneau barré par un camp)
    // les enseignes des boutiques du souk et des rues
    const NOMS = [["SOUK AUX ÉPICES", "#f4e2b0", "#7a3a14"], ["CAFÉ DE LA CITADELLE", "#f4e8c8", "#2a4a5a"], ["BOULANGERIE", "#6a3a14", "#f3e2c0"], ["TISSUS & TAPIS", "#fff", "#7a2e5a"],
      ["PHARMACIE", "#fff", "#1f8a3a"], ["QUINCAILLERIE", "#222", "#d8b84a"], ["PÂTISSERIE AU MIEL", "#5a2a08", "#f0c878"], ["ÉPICERIE", "#fff", "#2a5a8a"]];
    E.forEach((r2, i) => { const [nom, encre, fondE] = NOMS[i]; fond(r2, fondE); g.strokeStyle = encre, g.lineWidth = 4, g.strokeRect(r2[0] + 6, r2[1] + 6, r2[2] - 12, r2[3] - 12); g.font = "bold 40px Arial, sans-serif", g.textAlign = "center", g.textBaseline = "middle", g.fillStyle = encre, g.fillText(nom, r2[0] + 256, r2[1] + 50); });
    bilan.graffitis += 5;
  }
  if (actif && Tanks.Ville3D && Tanks.Ville3D.ajouterPeintre) Tanks.Ville3D.ajouterPeintre(peindreAffiches);

  // ------------------------------------------------------------------ construire (une fois, au chargement)
  const TAILLE = 200; // m : les carrés de soudure
  function construire(groupe, ajouter) {
    if (!actif) return;
    const t0 = performance.now();
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.05 });
    const matDraps = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide });
    const matGraf = new THREE.MeshStandardMaterial({ map: imageGraffitis(), transparent: true, alphaTest: 0.08, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const carres = new Map();
    const carre = (x, z) => { const cle = Math.floor(x / TAILLE) + ":" + Math.floor(z / TAILLE); if (!carres.has(cle)) carres.set(cle, new THREE.Group()); return carres.get(cle); };
    // poser une pièce (dans le repère de l'objet o : u le long, v en travers, y en haut) dans le monde
    const poser = (g, m, o, u, y, v, ry) => {
      const c = Math.cos(o.angle), s = Math.sin(o.angle);
      m.position.set(o.x + u * c - v * s, T.hauteur(o.x, o.z) + y, o.z + u * s + v * c);
      m.rotation.y = -o.angle + (ry || 0);
      g.add(m);
      return m;
    };
    const B = (g, o, lx, ly, lz, u, y, v, couleur, ry) => poser(g, O.boite(lx, ly, lz, mat, 0, 0, 0, couleur), o, u, y, v, ry);
    // un GRAFFITI (case k de l'image) posé à plat contre une face : (u, y, v) le milieu, « normale » vers où il regarde
    const graffiti = (g, o, k, u, y, v, largeur, haut, tourne) => {
      const geo = new THREE.PlaneGeometry(largeur, haut), uv = geo.attributes.uv, [u0, v0, u1, v1] = caseUV(k);
      for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0));
      poser(g, new THREE.Mesh(geo, matGraf), o, u, y, v, tourne);
      bilan.graffitis++;
    };
    const signe = (o) => (o.z > 0 ? 1 : -1); // (côté du Front : z > 0 ; côté de la Garde : z < 0)
    const grafCamp = (o) => (signe(o) > 0 ? choix([0, 2, 4, 7, 6]) : choix([1, 3, 5, 6]));
    const choix = (l) => l[Math.floor(h() * l.length)];
    for (const o of GC.pieces) {
      if (!o.dessinAutre) continue;
      const g = carre(o.x, o.z), s = o.sorte;
      if (s === "pneus") { // 3 piles de 2 à 4 pneus, quelques-uns brûlés
        for (let i = -1; i <= 1; i++) {
          const n = 2 + Math.floor(h() * 3);
          for (let k = 0; k < n; k++) poser(g, O.piece(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 10), mat, 0, 0, 0, h() < 0.3 ? 0x2a2622 : 0x161616), o, i * 0.95 + (h() - 0.5) * 0.12, 0.12 + k * 0.25, (h() - 0.5) * 0.15);
        }
        bilan.pneus++;
      } else if (s === "sacs") { // 3 rangs de sacs, en quinconce
        for (let r = 0; r < 3; r++) for (let i = 0; i < 5 - (r % 2); i++) {
          const u = -1.6 + i * 0.8 + (r % 2) * 0.4, t = 0.82 + h() * 0.18;
          B(g, o, 0.74, 0.36, 0.5, u, 0.18 + r * 0.36, (h() - 0.5) * 0.06, new THREE.Color(0.76 * t, 0.68 * t, 0.5 * t), (h() - 0.5) * 0.12);
        }
        bilan.sacs++;
      } else if (s === "conteneur") { // la grande boîte côtelée, les portes au bout, de la rouille
        const coul = new THREE.Color(o.couleur), sombre = coul.clone().multiplyScalar(0.75);
        B(g, o, 6.1, 2.55, 2.42, 0, 1.3, 0, coul);
        for (let i = 0; i < 14; i++) for (const sv of [-1, 1]) B(g, o, 0.12, 2.35, 0.05, -2.8 + i * 0.43, 1.3, sv * 1.22, sombre);
        B(g, o, 0.05, 2.4, 2.3, 3.06, 1.3, 0, sombre);
        for (const sv of [-0.5, 0.5]) B(g, o, 0.06, 2.3, 0.05, 3.09, 1.3, sv * 1.1, 0x444444); // les barres des portes
        for (let k = 0; k < 3; k++) B(g, o, 0.6 + h(), 0.3 + h() * 0.5, 0.03, (h() - 0.5) * 4.5, 0.4 + h() * 1.6, (h() < 0.5 ? -1 : 1) * 1.24, 0x6a3a1e); // la rouille
        if (h() < 0.75) { const sv = h() < 0.5 ? 1 : -1; graffiti(g, o, grafCamp(o), (h() - 0.5) * 2.5, 1.35, sv * 1.27, 2.1, 2.1, sv > 0 ? 0 : Math.PI); }
        bilan.conteneurs++;
      } else if (s === "beton") { // 2 blocs de béton (le profil en « J » des séparateurs de route)
        for (const u of [-0.95, 0.95]) {
          const m = O.profil([[-0.42, 0], [0.42, 0], [0.2, 0.3], [0.12, 1.02], [-0.12, 1.02], [-0.2, 0.3]], 1.85, mat, 0.02, h() < 0.5 ? 0xa8a49a : 0x989489);
          m.rotation.y = Math.PI / 2;
          const p = new THREE.Group();
          p.add(m);
          // (on le soude tout de suite : le profil a sa propre rotation)
          const [m2] = O.souder(p, true);
          poser(g, new THREE.Mesh(m2.geometry, mat), o, u, 0, 0);
        }
        if (h() < 0.6) { const sv = h() < 0.5 ? 1 : -1; graffiti(g, o, grafCamp(o), (h() - 0.5) * 1.5, 0.62, sv * 0.3, 0.8, 0.8, sv > 0 ? 0 : Math.PI); }
        bilan.beton++;
      } else if (s === "guerite") { // la guérite : 4 murs, les fenêtres, le toit, des sacs devant ; la barrière rayée levée ; le petit drapeau
        const camp = o.camp, coul = camp === "bleus" ? 0x8a8a72 : 0xb8a27a;
        for (const [u, v, lx, lz] of [[0.75, 0, 0.1, 1.6], [-0.75, 0, 0.1, 1.6], [0, 0.75, 1.6, 0.1], [0, -0.75, 1.6, 0.1]]) B(g, o, lx, 1.1, lz, u, 0.55, v, coul);
        for (const [u, v, lx, lz] of [[0.75, 0, 0.06, 1.4], [-0.75, 0, 0.06, 1.4], [0, 0.75, 1.4, 0.06], [0, -0.75, 1.4, 0.06]]) B(g, o, lx, 0.8, lz, u, 1.5, v, 0x2a3236);
        B(g, o, 1.9, 0.12, 1.9, 0, 2.0, 0, 0x5a5a56);
        for (let i = 0; i < 4; i++) B(g, o, 0.7, 0.34, 0.45, -1.05 + i * 0.7, 0.17, 1.15 * (camp === "bleus" ? -1 : 1), 0xb8a47a);
        // la barrière : le poteau, puis le bras rayé rouge et blanc, levé
        const poste = GC.postes.find((p) => p.guerite === o), cote = poste ? Math.sign(poste.x - o.x) || 1 : 1;
        B(g, o, 0.2, 1.0, 0.2, 1.3 * cote, 0.5, 0, 0x444444);
        for (let k = 0; k < 6; k++) { const L = 0.7, a = 1.2, d = 0.35 + k * L; const m = B(g, o, L, 0.1, 0.1, 1.3 * cote + Math.cos(a) * d * cote, 1.0 + Math.sin(a) * d, 0, k % 2 ? 0xeeeeea : 0xc42a22); m.rotation.z = a * cote; }
        // le petit drapeau du camp sur la guérite
        poser(g, O.tube([0, 0, 0], [0, 2.2, 0], 0.025, mat, 4, 0x333333), o, -0.6, 2.05, -0.6);
        B(g, o, 0.9, 0.55, 0.03, -0.15, 3.9, -0.6, new THREE.Color(couleurCamp(camp)));
        graffiti(g, o, camp === "bleus" ? 0 : 1, 0, 0.6, 0.81 * (camp === "bleus" ? -1 : 1), 0.9, 0.9, camp === "bleus" ? Math.PI : 0);
        bilan.guerites++;
      } else if (s === "etal") { // l'étal du souk : la table, les marchandises, 4 perches, la toile rayée
        const bois = 0x7a5a3a, toile = new THREE.Color(o.toile), clair = toile.clone().lerp(new THREE.Color(0xf0e8d8), 0.6);
        B(g, o, 2.5, 0.08, 1.2, 0, 0.88, 0, bois);
        for (const [u, v] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]]) B(g, o, 0.07, 0.86, 0.07, u, 0.43, v, bois);
        const MARCH = [[0xc8601a, 0xd8a020, 0x8a2a1a, 0x6a8a2a], [0x8a6a3a, 0xa07a40, 0xc89a5a, 0x7a5a30], [0x2a5a8a, 0xa02a5a, 0xe0c060, 0x2a7a5a], [0xd8c8a0, 0xe0d0b0, 0x5a7a3a, 0x8a3a2a]][o.marchandise || 0];
        for (let i = 0; i < 6; i++) {
          const u = -0.95 + (i % 3) * 0.95, v = i < 3 ? -0.28 : 0.28, c = MARCH[i % 4];
          if (o.marchandise === 0) poser(g, O.piece(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 8), mat, 0, 0, 0, c), o, u, 1.07, v); // des sacs d'épices ouverts
          else if (o.marchandise === 1) poser(g, O.piece(new THREE.CylinderGeometry(0.3, 0.22, 0.22, 8), mat, 0, 0, 0, c), o, u, 1.03, v); // des paniers
          else B(g, o, 0.75, 0.1 + h() * 0.15, 0.45, u, 0.98, v, c); // des tissus pliés
        }
        for (const [u, v, hh] of [[-1.25, -0.6, 2.2], [1.25, -0.6, 2.2], [-1.25, 0.6, 2.6], [1.25, 0.6, 2.6]]) B(g, o, 0.06, hh, 0.06, u, hh / 2, v, bois);
        for (let k = 0; k < 6; k++) { const m = B(g, o, 0.48, 0.03, 1.5, -1.22 + k * 0.49, 2.42, 0, k % 2 ? clair : toile); m.rotation.x = 0.27; } // la toile rayée, en pente
        bilan.etals++;
      }
    }
    // les DRAPS de la rue des draps : un drap qui pend un peu, ses deux cordes d'un mur à l'autre
    for (const o of GC.draps) {
      const g = carre(o.x, o.z), L = o.demiL * 2 - 1.2, H = 2.6 + o.teinte * 0.9, geo = new THREE.PlaneGeometry(L, H, 6, 3), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getX(i) / L) * Math.PI * 2 + o.teinte * 6) * 0.08 + (1 - Math.abs(p.getX(i) / (L / 2))) * 0.12);
      geo.computeVertexNormals();
      const m = O.piece(geo, matDraps, 0, 0, 0, o.couleur);
      poser(g, m, o, 0, 4.5 - H / 2 - 0.05, 0);
      for (const v of [-0.04, 0.04]) poser(g, O.tube([-o.demiL, 0, v], [o.demiL, 0, v], 0.012, mat, 3, 0x6a6052), o, 0, 4.55, 0);
      bilan.draps++;
    }
    // les MORTIERS : la plaque, le tube penché, le bipied, un cercle de sacs, les caisses d'obus
    for (const m0 of GC.mortiers) {
      const g = carre(m0.x, m0.z), o = { x: m0.x, z: m0.z, angle: m0.equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2 };
      poser(g, O.piece(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 10), mat, 0, 0, 0, 0x3a3a36), o, 0, 0.03, 0);
      const tube = poser(g, O.piece(new THREE.CylinderGeometry(0.07, 0.08, 1.3, 8), mat, 0, 0, 0, 0x4a5236), o, 0.25, 0.6, 0);
      tube.rotation.z = -0.75;
      for (const v of [-0.25, 0.25]) poser(g, O.tube([0, 0, v], [0.45, 0.7, 0], 0.02, mat, 4, 0x2a2a28), o, 0.25, 0, 0);
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; B(g, o, 0.75, 0.36, 0.45, Math.cos(a) * 2.2, 0.18 + (k % 2) * 0.05, Math.sin(a) * 2.2, 0xb4a078, -a + Math.PI / 2); }
      for (let k = 0; k < 3; k++) B(g, o, 0.5, 0.3, 0.35, -1.2, 0.15 + k * 0.3, -0.8 + (k % 2) * 0.1, 0x4e5634);
      bilan.mortiers++;
    }
    // L'HORLOGE de la tour : 4 cadrans (une image ronde), soudés en un dessin
    tour = T.boites.find((b) => b.nom === "la tour de l'Horloge") || null;
    if (tour) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const x = c.getContext("2d");
      x.fillStyle = "#e8e0c8", x.beginPath(), x.arc(64, 64, 60, 0, Math.PI * 2), x.fill();
      x.strokeStyle = "#2a2622", x.lineWidth = 5, x.stroke();
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; x.fillStyle = "#2a2622", x.fillRect(64 + Math.cos(a) * 48 - 3, 64 + Math.sin(a) * 48 - 3, 6, 6); }
      x.lineCap = "round", x.lineWidth = 6, x.beginPath(), x.moveTo(64, 64), x.lineTo(64 + 26, 64 - 18), x.stroke(); // (l'horloge s'est arrêtée à 4 h 10)
      x.lineWidth = 4, x.beginPath(), x.moveTo(64, 64), x.lineTo(64 + 12, 64 - 42), x.stroke();
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mh = new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.3, roughness: 0.6 }), gh = new THREE.Group(), y = T.hauteur(tour.x, tour.z) + tour.h - 2.6;
      for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2, d = Math.max(tour.demiL, tour.demiP) + 0.06, m = new THREE.Mesh(new THREE.CircleGeometry(1.25, 20), mh);
        m.position.set(tour.x + Math.cos(a) * d, y, tour.z + Math.sin(a) * d);
        m.rotation.y = Math.PI / 2 - a;
        gh.add(m);
      }
      const [m] = O.souder(gh, false);
      horloge = m;
      groupe.add(m);
      bilan.dessins++;
    }
    // LES DRAPEAUX DE QUARTIER : le mât (soudé avec le reste), le drapeau (il bouge) et le cercle par terre
    const textures = { bleus: imageDrapeau("bleus"), rouges: imageDrapeau("rouges"), neutre: imageDrapeau(null) };
    const matsDrapeau = {};
    for (const k of Object.keys(textures)) matsDrapeau[k] = new THREE.MeshStandardMaterial({ map: textures[k], side: THREE.DoubleSide, roughness: 0.9 });
    for (const p of GC.points) {
      const g = carre(p.x, p.z), y = T.hauteur(p.x, p.z);
      const mat1 = O.tube([p.x, y, p.z], [p.x, y + 9, p.z], 0.07, mat, 6, 0x9a9a94);
      g.add(mat1);
      g.add(O.piece(new THREE.SphereGeometry(0.14, 8, 6), mat, p.x, y + 9.05, p.z, 0xd8b04a));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; g.add(O.boite(0.7, 0.34, 0.45, mat, p.x + Math.cos(a) * 1.0, y + 0.17, p.z + Math.sin(a) * 1.0, 0xb4a078)); } // (des sacs au pied du mât)
      const geo = new THREE.PlaneGeometry(2.4, 1.5, 8, 3);
      geo.translate(1.2, 0, 0);
      const toile = new THREE.Mesh(geo, matsDrapeau.neutre);
      toile.position.set(p.x, y + 2, p.z);
      groupe.add(toile);
      const cercle = new THREE.Mesh(new THREE.RingGeometry(C.quartiers.rayon - 0.5, C.quartiers.rayon, 48, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }));
      cercle.rotation.x = -Math.PI / 2;
      cercle.position.set(p.x, y + 0.25, p.z);
      groupe.add(cercle);
      drapeaux.push({ p, toile, cercle, mats: matsDrapeau, base: geo.attributes.position.array.slice(), y, montre: null });
      bilan.drapeaux++;
    }
    // tout ce qui ne bouge pas : soudé par carré
    for (const [, g] of carres) {
      for (const m of O.souder(g, true)) {
        m.geometry.computeBoundingSphere();
        bilan.triangles += m.geometry.attributes.position.count / 3;
        ajouter(groupe, m);
        bilan.dessins++;
      }
      bilan.carres++;
    }
    bilan.dessins += drapeaux.length * 2;
    bilan.ms = Math.round(performance.now() - t0);
  }
  // l'image d'un drapeau de quartier : vert et crème au rameau (le Front), rouge et crème à l'étoile (la Garde), blanc (neutre)
  function imageDrapeau(camp) {
    const c = document.createElement("canvas");
    c.width = 128, c.height = 80;
    const x = c.getContext("2d"), D = (C.edition.textes.drapeaux || {})[camp];
    if (!D) (x.fillStyle = "#eeeae0"), x.fillRect(0, 0, 128, 80);
    else {
      x.fillStyle = D.fond[0], x.fillRect(0, 0, 128, 80);
      x.fillStyle = D.fond[1], x.fillRect(0, 54, 128, 26);
      symbole(x, camp === "bleus" ? "rameau" : "etoile", 64, 28, 22, D.fond[1]);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  // ------------------------------------------------------------------ chaque image : les drapeaux, l'horloge
  let horlogeTemps = 0;
  function maj(scene, monde, dt) {
    if (!actif) return;
    horlogeTemps += dt || 0;
    if (horloge && tour) horloge.visible = !tour.toit || tour.toit.intact !== false;
    for (const d of drapeaux) {
      const p = d.p, k = p.prise > 0.001 ? "bleus" : p.prise < -0.001 ? "rouges" : "neutre";
      if (d.montre !== k) (d.montre = k), (d.toile.material = d.mats[k]), d.cercle.material.color.set(k === "neutre" ? 0xffffff : couleurCamp(k));
      d.toile.position.y = d.y + 1.6 + 6.4 * Math.abs(p.prise);
      // il flotte : une petite vague le long du drapeau (on ne bouge que ses 36 sommets)
      const a = d.toile.geometry.attributes.position, b = d.base;
      for (let i = 0; i < a.count; i++) a.array[i * 3 + 2] = Math.sin(b[i * 3] * 2.2 - horlogeTemps * 5 + p.x) * 0.12 * (b[i * 3] / 2.4);
      a.needsUpdate = true;
      d.toile.rotation.y = 0.6 + Math.sin(horlogeTemps * 0.3 + p.z) * 0.2;
      // le cercle clignote quand le drapeau est disputé
      d.cercle.material.opacity = p.etat.startsWith("⚔️") ? 0.3 + 0.4 * (Math.floor(horlogeTemps * 4) % 2) : 0.45;
    }
  }

  // ------------------------------------------------------------------ la grande image du sol (decor.js)
  function peindreSol(ctx, X, k, hz) {
    if (!actif) return;
    const r = (x, z, l, p, c) => ((ctx.fillStyle = c), ctx.fillRect(X(x - l / 2), X(z - p / 2), l * k, p * k));
    // la poussière : des taches plus claires et plus sombres partout
    for (let i = 0; i < 260; i++) {
      const x = (hz() - 0.5) * 1900, z = (hz() - 0.5) * 1900, rr = (8 + hz() * 30) * k, g = ctx.createRadialGradient(X(x), X(z), 0, X(x), X(z), rr);
      g.addColorStop(0, hz() < 0.5 ? "rgba(222,204,160,0.35)" : "rgba(120,98,66,0.25)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(X(x) - rr, X(z) - rr, rr * 2, rr * 2);
    }
    // les PAVÉS de la place du souk et de la place de l'Horloge (les pâtés « vides »)
    const QU = T.variante.quartier;
    for (const [gi, gj] of QU.vides || []) {
      const cx = QU.x + (gi + 0.5) * QU.ilot, cz = QU.z + (gj + 0.5) * QU.ilot, L = QU.ilot - QU.rue - 2;
      r(cx, cz, L, L, "#c9b48c");
      ctx.fillStyle = "rgba(90,74,50,0.35)";
      for (let a = -L / 2; a < L / 2; a += 1.2) for (let b = -L / 2; b < L / 2; b += 1.2) if (hz() < 0.5) ctx.fillRect(X(cx + a), X(cz + b), Math.max(1, 0.1 * k), Math.max(1, 1.1 * k));
    }
    // la cour de la citadelle (de la terre battue) et le dépôt des bus (du goudron usé)
    for (const p of GC.points) {
      if (/Citadelle/.test(p.nom)) r(p.x, p.z, 46, 46, "rgba(168,140,100,0.8)");
      if (/dépôt/.test(p.nom)) r(p.x, p.z, 60, 50, "rgba(70,66,60,0.75)");
    }
    // la rue du Front : des traces noires de pneus brûlés, et des taches d'huile
    const F = C.quartiers.front;
    for (let i = 0; i < 70; i++) {
      const x = F.x[0] + hz() * (F.x[1] - F.x[0]), z = F.z + (hz() - 0.5) * 14, rr = (1.5 + hz() * 3) * k;
      ctx.fillStyle = "rgba(30,26,22," + (0.3 + hz() * 0.3) + ")";
      ctx.beginPath(), ctx.ellipse(X(x), X(z), rr, rr * 0.7, hz() * 3, 0, Math.PI * 2), ctx.fill();
    }
  }
  return { actif, construire, maj, peindreSol, bilan, drapeaux, symbole };
})();
