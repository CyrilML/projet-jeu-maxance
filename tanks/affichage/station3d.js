// 🚇 LA STATION 3D : le décorateur du souterrain (étape 80)
//
// Comme le décorateur d'un film, il construit (une seule fois, la première fois qu'on descend) la station de métro que
// l'architecte a dessinée (logique/souterrain.js) : les QUAIS carrelés et leur bande jaune, la TRANCHÉE des rails
// (ballast, traverses, rails), la MEZZANINE et sa rambarde, les ESCALIERS, les ESCALATORS cassés (marches qui manquent,
// rampe tordue, morceaux tombés sur le quai), les PILIERS, les BANCS, les PORTIQUES, les panneaux, le PLAFOND, les
// TUNNELS bouchés par les gravats, les RAMES de métro (dont une déraillée) et les TRAMS EN FEU.
// Pour que ce soit rapide :
//   - tout ce qui ne bouge pas et qui a la même matière est SOUDÉ en un seul objet (affichage/outils3d.js) : les quais,
//     les murs, les rames… ≈ 20 dessins pour toute la station ;
//   - ce qui se répète (piliers, bancs, lampes, traverses) est en INSTANCES : 1 dessin par sorte ;
//   - peu de VRAIES lumières (elles coûtent cher) : 4 feux orange qui tremblent + 2 néons ; les autres lampes sont des
//     néons qui brillent sans éclairer (et certaines clignotent).
// Les images (carrelage, sol, ballast, béton, flancs des rames) sont PEINTES par le programme (des « canvas »).
// Les FLAMMES et la FUMÉE des trams sont des particules d'affichage/effets.js.
// ✍️ (livre de demandes n° 25) LES DEUX QG : derrière le mur du bout de chaque station, une salle de commandement (porte
// dans le mur, sacs de sable, table des cartes, bureaux de radios et d'écrans, groupe électrogène, éclairage de secours
// rouge) et ses 3 BAIES : leurs voyants passent du vert au rouge quand elles sont abîmées, et une baie détruite devient
// une carcasse noire, penchée (le feu et la fumée : affichage/explosions.js). Pas de vraie lumière en plus (trop cher) :
// les écrans, les voyants et les lampes rouges brillent tout seuls.
// Comme tout l'affichage, il lit le monde et ne le modifie jamais.

window.Tanks = window.Tanks || {};

Tanks.Station3D = (function () {
  const C = Tanks.CONFIG, S = C.souterrain, O = Tanks.Outils3D;
  const L = S.longueur / 2, V = S.voies, M = S.mezzanine, Q = S.quai.fond, H = S.plafond, T = S.tunnel;
  let racine = null, lampes = null, feux = [], neons = [], horloge = 0;
  const etatLampes = []; // pour chaque lampe : "normale", "clignote" ou "eteinte"
  const bilan = { construite: false, dessins: 0, pieces: 0, lampes: 0, clignotent: 0, eteintes: 0, lumieres: 0, foyers: 0, traverses: 0, ms: 0 };
  let germe = 8080;
  const hasard = () => ((germe = (germe * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ------------------------------------------------------------------ les images peintes
  function image(l, h, peindre, metres) {
    const c = document.createElement("canvas");
    c.width = l;
    c.height = h;
    peindre(c.getContext("2d"), l, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.userData.metres = metres || 0; // (0 : l'image couvre toute la face)
    return t;
  }
  const grain = (g, l, h, n, couleurs, taille) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = couleurs[Math.floor(hasard() * couleurs.length)];
      const t = (taille || 2) * (0.5 + hasard());
      g.fillRect(hasard() * l, hasard() * h, t, t);
    }
  };
  // le CARRELAGE blanc cassé du métro (des carreaux « biseautés » de 20 × 10 cm), sali en bas
  const carrelage = () => image(512, 512, (g, l, h) => {
    g.fillStyle = "#59544a";
    g.fillRect(0, 0, l, h);
    const cl = l / 10, ch = h / 20;
    for (let j = 0; j < 20; j++) for (let i = -1; i < 11; i++) {
      const x = i * cl + (j % 2 ? cl / 2 : 0), y = j * ch, v = 200 + Math.floor(hasard() * 30);
      g.fillStyle = "rgb(" + v + "," + (v - 6) + "," + (v - 20) + ")";
      g.fillRect(x + 2, y + 2, cl - 4, ch - 4);
      g.fillStyle = "rgba(255,255,255,.25)";
      g.fillRect(x + 3, y + 3, cl - 6, 3);
    }
    const sale = g.createLinearGradient(0, 0, 0, h);
    sale.addColorStop(0, "rgba(40,34,26,.25)");
    sale.addColorStop(1, "rgba(40,34,26,.05)");
    g.fillStyle = sale;
    g.fillRect(0, 0, l, h);
    grain(g, l, h, 900, ["rgba(30,26,20,.25)", "rgba(80,70,50,.2)"], 3);
  }, 2);
  // le SOL du quai : de grandes dalles grises (terrazzo) avec des petits grains
  const dalles = () => image(512, 512, (g, l, h) => {
    g.fillStyle = "#3c3a37";
    g.fillRect(0, 0, l, h);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const v = 112 + Math.floor(hasard() * 22);
      g.fillStyle = "rgb(" + v + "," + (v - 3) + "," + (v - 8) + ")";
      g.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
    }
    grain(g, l, h, 5000, ["#8a857c", "#5d5a55", "#a9a39a", "#4a4743"], 2);
    grain(g, l, h, 60, ["rgba(20,18,16,.35)"], 18); // (des taches)
  }, 2.4);
  // le BALLAST (les cailloux sous les rails)
  const ballast = () => image(256, 256, (g, l, h) => {
    g.fillStyle = "#2e2b28";
    g.fillRect(0, 0, l, h);
    grain(g, l, h, 3500, ["#4a4540", "#3a3632", "#59524a", "#25221f", "#6a5e50"], 4);
  }, 1.5);
  // le BÉTON du plafond et des tunnels
  const beton = () => image(256, 256, (g, l, h) => {
    g.fillStyle = "#8c8a85";
    g.fillRect(0, 0, l, h);
    grain(g, l, h, 2500, ["#9a9893", "#7a7874", "#a5a29b", "#6a6864", "rgba(30,28,26,.4)"], 5);
    g.strokeStyle = "rgba(20,20,20,.35)";
    g.lineWidth = 2;
    g.strokeRect(0, 0, l, h);
  }, 4);
  // LE FLANC d'une voiture (toute la longueur) : les fenêtres, les portes, la bande de couleur ; « brule » : noirci ;
  // « feu » : l'image de ce qui BRILLE (le feu derrière les vitres cassées), pour la lumière propre (« emissive »)
  function flanc(sorte, etat) {
    const metro = sorte === "metro";
    return image(1024, 256, (g, l, h) => {
      const brule = etat !== "neuf";
      g.fillStyle = etat === "feu" ? "#000" : brule ? "#2a2522" : metro ? "#d9dcdf" : "#e9e2c8";
      g.fillRect(0, 0, l, h);
      if (etat !== "feu") {
        g.fillStyle = brule ? "#3a2e26" : metro ? "#1f5fae" : "#2f8a52";
        g.fillRect(0, h * 0.72, l, h * 0.1);
      }
      const portes = metro ? 3 : 2, fenetres = metro ? 4 : 3;
      for (let k = 0; k < portes; k++) {
        const x = ((k + 0.5) / portes) * l - 30;
        g.fillStyle = etat === "feu" ? "#000" : brule ? "#1d1916" : "#9aa0a6";
        g.fillRect(x, h * 0.12, 60, h * 0.83);
        g.fillStyle = etat === "feu" ? (hasard() < 0.6 ? "#ff7a1a" : "#000") : brule ? "#0c0a09" : "#1b2430";
        g.fillRect(x + 6, h * 0.18, 21, h * 0.4);
        g.fillRect(x + 33, h * 0.18, 21, h * 0.4);
      }
      for (let k = 0; k < portes + 1; k++) for (let f = 0; f < fenetres / (portes + 1) + 1; f++) {
        const x0 = (k / portes) * l + 40, x1 = ((k + 1) / portes) * l - 40, n = 2;
        for (let w = 0; w < n; w++) {
          const wx = x0 + (w / n) * (x1 - x0) + 6, ww = (x1 - x0) / n - 12;
          if (ww < 10 || wx > l) continue;
          if (etat === "feu") {
            const gr = g.createLinearGradient(0, h * 0.18, 0, h * 0.6);
            gr.addColorStop(0, "#ffd36a");
            gr.addColorStop(0.5, "#ff6a10");
            gr.addColorStop(1, "#5a1000");
            g.fillStyle = hasard() < 0.8 ? gr : "#000";
          } else g.fillStyle = brule ? "#0b0908" : "#22303c";
          g.fillRect(wx, h * 0.18, ww, h * 0.4);
          if (etat === "neuf") {
            g.fillStyle = "rgba(255,255,255,.12)";
            g.fillRect(wx, h * 0.18, ww * 0.3, h * 0.4);
          }
        }
      }
      if (brule && etat !== "feu") { // des traces de suie et de rouille
        grain(g, l, h, 400, ["rgba(0,0,0,.5)", "rgba(90,50,30,.4)", "rgba(140,90,50,.3)"], 14);
        g.fillStyle = "rgba(0,0,0,.55)";
        for (let k = 0; k < 6; k++) g.fillRect(hasard() * l, 0, 30 + hasard() * 90, h * (0.3 + hasard() * 0.4));
      }
    });
  }
  // un panneau : le nom de la station, « SORTIE », une affiche
  function panneau(texte, fond, encre, l, h, bord) {
    return image(l, h, (g) => {
      g.fillStyle = fond;
      g.fillRect(0, 0, l, h);
      if (bord) {
        g.strokeStyle = bord;
        g.lineWidth = 8;
        g.strokeRect(6, 6, l - 12, h - 12);
      }
      g.fillStyle = encre;
      g.font = "bold " + Math.floor(h * 0.5) + "px Trebuchet MS, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(texte, l / 2, h / 2 + 2);
    });
  }

  // (livre n° 25) la carte de la station (vue de dessus, pour la table des cartes et le mur), et un écran de QG
  function carteDeLaStation() {
    return image(512, 256, (g, l, h) => {
      g.fillStyle = "#d8cfae";
      g.fillRect(0, 0, l, h);
      g.fillStyle = "#8a8064";
      g.fillRect(20, 108, l - 40, 40); // les rails
      g.fillStyle = "#b8ad8c";
      g.fillRect(20, 60, l - 40, 48);
      g.fillRect(20, 148, l - 40, 48);
      g.strokeStyle = "#2a4a9a";
      g.lineWidth = 4;
      g.strokeRect(l - 70, 160, 50, 40);
      g.strokeStyle = "#9a2a2a";
      g.strokeRect(20, 56, 50, 40);
      g.strokeStyle = "rgba(160,30,30,.8)";
      g.lineWidth = 3;
      for (let k = 0; k < 5; k++) (g.beginPath(), g.moveTo(80 + k * 70, 80), g.lineTo(110 + k * 70, 175), g.stroke());
      grain(g, l, h, 300, ["rgba(60,50,30,.25)"], 3);
    });
  }
  function ecranQG(radar) {
    return image(128, 80, (g, l, h) => {
      g.fillStyle = "#03140a";
      g.fillRect(0, 0, l, h);
      g.strokeStyle = "#39ff7a";
      g.fillStyle = "#39ff7a";
      g.lineWidth = 2;
      if (radar) {
        for (const r of [12, 24, 36]) (g.beginPath(), g.arc(l / 2, h / 2, r, 0, 7), g.stroke());
        g.beginPath(), g.moveTo(l / 2, h / 2), g.lineTo(l / 2 + 34, h / 2 - 18), g.stroke();
        for (let k = 0; k < 5; k++) g.fillRect(20 + hasard() * 88, 10 + hasard() * 60, 3, 3);
      } else {
        g.font = "bold 10px monospace";
        for (let k = 0; k < 6; k++) g.fillText(["LIGNE 80", "QUAI N : OK", "QUAI S : ??", "MEZZ. : !!", "COM : 3/3", "ÉNERGIE 92%"][k], 6, 12 + k * 12);
      }
    });
  }

  // ------------------------------------------------------------------ des boîtes à la bonne échelle de carreaux
  // Une boîte dont l'image est répétée tous les « metres » mètres (sinon un mur de 200 m aurait des carreaux géants).
  function bloc(lx, ly, lz, mat, x, y, z) {
    const g = new THREE.BoxGeometry(lx, ly, lz), m = (mat.map && mat.map.userData.metres) || 0;
    if (m) {
      const uv = g.attributes.uv, dims = [[lz, ly], [lz, ly], [lx, lz], [lx, lz], [lx, ly], [lx, ly]];
      for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
        const i = f * 4 + k;
        uv.setXY(i, (uv.getX(i) * dims[f][0]) / m, (uv.getY(i) * dims[f][1]) / m);
      }
    }
    const p = O.piece(g, mat, x, y, z);
    p.castShadow = p.receiveShadow = false;
    return p;
  }
  // Recopier les pièces d'un sous-groupe (une voiture, un escalator, tourné ou penché) dans la racine, à leur vraie place,
  // pour qu'elles soient soudées avec les autres.
  function aplatir(sous, groupe) {
    sous.updateMatrixWorld(true);
    for (const m of [...sous.children]) {
      if (!m.isMesh) continue;
      m.matrixWorld.decompose(m.position, m.quaternion, m.scale); // (le sous-groupe n'a pas de parent : « monde » = sa place dans la station)
      groupe.add(m);
    }
  }

  // ------------------------------------------------------------------ construire la station (une seule fois)
  function construire(scene) {
    const t0 = performance.now();
    racine = new THREE.Group();
    racine.name = "station";
    const g = new THREE.Group(); // les pièces à souder
    const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));
    const MT = {
      carrelage: mat({ map: carrelage(), roughness: 0.35 }),
      sol: mat({ map: dalles(), roughness: 0.55 }),
      ballast: mat({ map: ballast(), roughness: 1 }),
      beton: mat({ map: beton(), roughness: 0.95, color: 0xd0cec8 }),
      jaune: mat({ color: 0xd8b21c, roughness: 0.6 }),
      pierre: mat({ color: 0x9a968e, roughness: 0.7 }),
      metal: mat({ color: 0x8c9096, roughness: 0.35, metalness: 0.85 }),
      rouille: mat({ color: 0x8a5a36, roughness: 0.8, metalness: 0.3 }),
      noir: mat({ color: 0x111214, roughness: 0.9 }),
      inox: mat({ color: 0xb9bec4, roughness: 0.28, metalness: 0.9 }),
      caoutchouc: mat({ color: 0x18181a, roughness: 0.6 }),
      vitre: new THREE.MeshStandardMaterial({ color: 0x9fc4d0, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.22, depthWrite: false }),
      gravats: mat({ color: 0x6d6862, roughness: 1 }),
      bleuNom: mat({ map: panneau("GARE MAXANCE", "#1b3d8a", "#ffffff", 1024, 192, "#e6e6e6"), roughness: 0.5 }),
      sortie: mat({ map: panneau("SORTIE ➜", "#13703a", "#ffffff", 512, 128), emissive: 0x0a3a1c, roughness: 0.5 }),
      horsService: mat({ map: panneau("HORS SERVICE", "#b81c1c", "#ffffff", 512, 128), emissive: 0x3a0606, roughness: 0.5 }),
      affiche: mat({ map: panneau("LIGNE 80", "#c9a227", "#1a1a1a", 512, 256, "#1a1a1a"), roughness: 0.6 }),
      carrosserieMetro: mat({ color: 0xcfd3d7, roughness: 0.4, metalness: 0.5 }),
      carrosserieTram: mat({ color: 0xe0d8bc, roughness: 0.45, metalness: 0.3 }),
      brulee: mat({ color: 0x231d19, roughness: 0.95, metalness: 0.2 }),
      flancMetro: mat({ map: flanc("metro", "neuf"), roughness: 0.35, metalness: 0.3 }),
      flancTram: mat({ map: flanc("tram", "neuf"), roughness: 0.4, metalness: 0.2 }),
      flancBrule: mat({ map: flanc("metro", "brule"), roughness: 0.95 }),
      flancFeu: mat({ map: flanc("tram", "brule"), emissiveMap: flanc("tram", "feu"), emissive: 0xffffff, emissiveIntensity: 2.2, roughness: 0.95 }),
    };
    // (livre n° 25) les matières des QG (un peu « émissives » : la salle n'a pas de vraie lampe, on doit la voir quand même)
    Object.assign(MT, {
      solQG: mat({ map: MT.beton.map, color: 0x6a6660, roughness: 0.9, emissive: 0x161312 }),
      murQG: mat({ map: MT.beton.map, color: 0x7c7a70, roughness: 0.95, emissive: 0x1c1514 }),
      sac: mat({ color: 0x9d8a62, roughness: 1, emissive: 0x0c0a06 }),
      bois: mat({ color: 0x6b4a2c, roughness: 0.75, emissive: 0x0a0604 }),
      groupe: mat({ color: 0xc9a227, roughness: 0.55, metalness: 0.3, emissive: 0x140f02 }),
      radio: mat({ color: 0x3d4a35, roughness: 0.6, metalness: 0.4 }),
      caisse: mat({ color: 0x4c5a32, roughness: 0.8, emissive: 0x060804 }),
      secours: new THREE.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false }),
      voyant: new THREE.MeshBasicMaterial({ color: 0x7dff8a, toneMapped: false }),
      pionBleu: new THREE.MeshBasicMaterial({ color: 0x4a8cff }),
      pionRouge: new THREE.MeshBasicMaterial({ color: 0xff4a3a }),
      carte: mat({ map: carteDeLaStation(), roughness: 0.8, emissive: 0x1a1a14 }),
      plan: mat({ map: carteDeLaStation(), roughness: 0.8, emissive: 0x222218 }),
      ecran: mat({ map: ecranQG(false), emissiveMap: ecranQG(false), emissive: 0xffffff, emissiveIntensity: 1.1 }),
      ecranRadar: mat({ map: ecranQG(true), emissiveMap: ecranQG(true), emissive: 0xffffff, emissiveIntensity: 1.1 }),
      panneauBleu: mat({ map: panneau("QG RAMPART", "#1b3d8a", "#ffffff", 512, 128, "#e6e6e6"), emissive: 0x0a1430, roughness: 0.5 }),
      panneauRouge: mat({ map: panneau("QG DU FRONT", "#7a1010", "#ffd0c0", 512, 128, "#2a0a0a"), emissive: 0x300606, roughness: 0.5 }),
      drapeauBleu: mat({ map: panneau("🦁", "#1d4fa0", "#ffd23c", 256, 160), side: THREE.DoubleSide, emissive: 0x0a1020 }),
      drapeauRouge: mat({ map: panneau("✪", "#9a1414", "#111111", 256, 160), side: THREE.DoubleSide, emissive: 0x200404 }),
    });

    // --- les quais, la tranchée, les rails
    for (const sz of [-1, 1]) {
      g.add(bloc(2 * L, V.profondeur + 0.3, Q - V.demi, MT.sol, 0, -(V.profondeur + 0.3) / 2, sz * (V.demi + Q) / 2));
      g.add(bloc(2 * L, 0.02, 0.45, MT.jaune, 0, 0.012, sz * (V.demi + 0.55)));
      g.add(bloc(2 * L, 0.08, 0.32, MT.pierre, 0, 0.02, sz * (V.demi + 0.16)));
    }
    g.add(bloc(2 * (L + T), 0.2, 2 * V.demi, MT.ballast, 0, -V.profondeur - 0.1, 0));
    for (const zr of V.rails) for (const c of [-1, 1]) g.add(bloc(2 * (L + T), 0.16, 0.08, MT.metal, 0, -V.profondeur + 0.2, zr + (c * V.ecartement) / 2));
    // --- les murs du fond (hors de la mezzanine), la mezzanine (des blocs pleins, carrelés), son sol, les murs du haut
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) g.add(bloc(L - M.demiX, H + 0.5, 0.5, MT.carrelage, sx * (M.demiX + (L - M.demiX) / 2), H / 2, sz * (Q + 0.25)));
      // la mezzanine : entre les rampes, des blocs pleins de 0 à 4,5 m, et leur sol
      const R = Tanks.Souterrain.rampes.slice().sort((a, b) => a.x0 - b.x0);
      let x0 = -M.demiX;
      for (const r of R.concat([{ x0: M.demiX, x1: M.demiX, haut: M.fond }])) {
        if (r.x0 - x0 > 0.01) {
          g.add(bloc(r.x0 - x0, M.hauteur - 0.1, M.fond - Q, MT.carrelage, (x0 + r.x0) / 2, (M.hauteur - 0.1) / 2, sz * (Q + M.fond) / 2));
          g.add(bloc(r.x0 - x0, 0.1, M.fond - Q, MT.sol, (x0 + r.x0) / 2, M.hauteur - 0.05, sz * (Q + M.fond) / 2));
        }
        if (r.x1 > r.x0) { // le palier en haut de la rampe
          g.add(bloc(r.x1 - r.x0, M.hauteur - 0.1, M.fond - r.haut, MT.carrelage, (r.x0 + r.x1) / 2, (M.hauteur - 0.1) / 2, sz * (r.haut + M.fond) / 2));
          g.add(bloc(r.x1 - r.x0, 0.1, M.fond - r.haut, MT.sol, (r.x0 + r.x1) / 2, M.hauteur - 0.05, sz * (r.haut + M.fond) / 2));
        }
        x0 = r.x1;
      }
      g.add(bloc(2 * M.demiX, H - M.hauteur + 0.5, 0.5, MT.carrelage, 0, (H + M.hauteur) / 2, sz * (M.fond + 0.25)));
      for (const sx of [-1, 1]) g.add(bloc(0.5, H - M.hauteur + 0.5, M.fond - Q, MT.carrelage, sx * (M.demiX + 0.25), (H + M.hauteur) / 2, sz * (Q + M.fond) / 2));
      // les couloirs de sortie (des trous noirs dans le mur du haut), leurs panneaux « SORTIE », et des gravats devant
      for (const sx of [-1, 1]) {
        g.add(bloc(4, 2.6, 0.1, MT.noir, sx * 18, M.hauteur + 1.3, sz * (M.fond - 0.02)));
        g.add(bloc(2.2, 0.55, 0.06, MT.sortie, sx * 18, M.hauteur + 3.0, sz * (M.fond - 0.06)));
        for (let k = 0; k < 6; k++) gravat(g, MT.gravats, sx * 18 + (hasard() - 0.5) * 4, M.hauteur, sz * (M.fond - 0.8 - hasard() * 1.5), 0.4 + hasard() * 0.6);
      }
      // le nom de la station et des affiches, sur le mur du fond des quais
      for (let x = -L + 15; x < L - 10; x += 30) {
        if (Math.abs(x) < M.demiX + 2) continue;
        g.add(bloc(5, 0.95, 0.06, MT.bleuNom, x, 3.2, sz * (Q - 0.03)));
        g.add(bloc(1.6, 2.2, 0.05, MT.affiche, x + 7, 1.9, sz * (Q - 0.03)));
      }
      for (const x of [-20, 4]) g.add(bloc(5, 0.95, 0.06, MT.bleuNom, x, 2.4, sz * (Q - 0.03)));
    }
    // --- le plafond (avec ses poutres), les bouts de la station, les tunnels bouchés
    g.add(bloc(2 * L + 1, 0.6, 2 * M.fond + 1, MT.beton, 0, H + 0.3, 0));
    for (let x = -L + 6; x < L; x += S.piliers.ecart) g.add(bloc(0.7, 0.6, 2 * Q, MT.beton, x, H - 0.3, 0));
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const qg = Object.values(Tanks.Souterrain.qg).find((q) => q.sx === sx && q.sz === sz);
        if (qg) murDuQG(g, MT, qg); // (livre n° 25 : le mur avec la porte du QG)
        else g.add(bloc(0.5, H + V.profondeur, Q - V.demi, MT.carrelage, sx * (L + 0.25), (H - V.profondeur) / 2, sz * (V.demi + Q) / 2));
      }
      g.add(bloc(0.5, H - 4.4, 2 * V.demi, MT.carrelage, sx * (L + 0.25), (H + 4.4) / 2, 0)); // au-dessus de la bouche du tunnel
      for (const sz of [-1, 1]) g.add(bloc(T, 5.6, 0.5, MT.beton, sx * (L + T / 2), 1.7, sz * (V.demi + 0.25)));
      g.add(bloc(T, 0.5, 2 * V.demi + 1, MT.beton, sx * (L + T / 2), 4.65, 0));
      g.add(bloc(0.5, 5.6, 2 * V.demi, MT.beton, sx * (L + T + 0.25), 1.7, 0));
      // l'éboulement qui bouche le tunnel
      for (let k = 0; k < 26; k++) gravat(g, MT.gravats, sx * (L + T - 0.5 - hasard() * 6), -V.profondeur, (hasard() - 0.5) * 2 * (V.demi - 0.5), 0.5 + hasard() * 1.3);
    }
    // --- les escaliers (des marches) et les escalators (cassés)
    for (const sz of [-1, 1]) {
      const E = S.escaliers, n = 25, prof = (E.haut - Q) / n, haut = M.hauteur / n;
      for (let k = 0; k < n; k++) {
        g.add(bloc(E.x1 - E.x0, haut * (k + 1), prof, MT.pierre, (E.x0 + E.x1) / 2, (haut * (k + 1)) / 2, sz * (Q + prof * (k + 0.5))));
        g.add(bloc(E.x1 - E.x0, 0.03, 0.06, MT.jaune, (E.x0 + E.x1) / 2, haut * (k + 1) + 0.01, sz * (Q + prof * k + 0.04)));
      }
      for (const x of [E.x0 + 0.15, (E.x0 + E.x1) / 2, E.x1 - 0.15]) g.add(O.tube([x, 1, sz * Q], [x, M.hauteur + 1, sz * E.haut], 0.04, MT.inox)); // les mains courantes
      escalators(g, MT, sz);
    }
    // --- la rambarde de la mezzanine (verre et inox), les portiques, les tas de gravats (les boîtes de l'architecte)
    for (const b of Tanks.Souterrain.boites) {
      if (b.sorte === "rambarde") {
        g.add(bloc(b.dl * 2, b.y1 - b.y0 - 0.1, 0.03, MT.vitre, b.x, (b.y0 + b.y1) / 2 - 0.05, b.z));
        g.add(bloc(b.dl * 2, 0.06, 0.12, MT.inox, b.x, b.y1, b.z));
      } else if (b.sorte === "portique") {
        g.add(bloc(b.dl * 2, b.y1 - b.y0, b.dp * 2, MT.inox, b.x, (b.y0 + b.y1) / 2, b.z));
        g.add(bloc(b.dl * 2 - 0.1, 0.04, b.dp * 2 + 0.02, MT.noir, b.x, b.y1 + 0.01, b.z));
      } else if (b.sorte === "gravats") {
        for (let k = 0; k < 9; k++) {
          const a = hasard() * Math.PI * 2, r = hasard();
          gravat(g, MT.gravats, b.x + Math.cos(a) * r * b.dl, 0, b.z + Math.sin(a) * r * b.dp, 0.4 + (1 - r) * (b.y1 - 0.2));
        }
      }
    }
    // des gravats éparpillés sur les rails et les quais
    for (let k = 0; k < 40; k++) gravat(g, MT.gravats, (hasard() - 0.5) * 2 * L, hasard() < 0.4 ? -V.profondeur : 0, (hasard() < 0.5 ? -1 : 1) * (hasard() < 0.4 ? hasard() * V.demi : V.demi + 1 + hasard() * 9), 0.15 + hasard() * 0.3);
    // --- les rames
    for (const v of Tanks.Souterrain.voitures) voiture(g, MT, v);

    for (const e in Tanks.Souterrain.qg) salleDuQG(g, MT, Tanks.Souterrain.qg[e]); // (livre n° 25)

    O.souder(g, false);
    racine.add(g);
    baiesDesQG(); // (livre n° 25 : les 6 baies restent à part : elles changent quand on les abîme)
    // --- les instances : piliers, bancs, lampes, traverses
    instances(MT);
    lumieres();
    racine.visible = false;
    scene.add(racine);
    let n = 0;
    racine.traverse((o) => o.isMesh && n++);
    bilan.dessins = n;
    bilan.pieces = O.bilan.pieces;
    bilan.construite = true;
    bilan.ms = Math.round(performance.now() - t0);
    return racine;
  }

  // ------------------------------------------------------------------ ✍️ (livre n° 25) LES QG
  // (u = la distance depuis le centre de la station le long des quais, v = la distance depuis le milieu des rails)
  const QC = S.qg;
  const ici = (q, u, v) => [q.sx * u, q.sz * v];
  // Le mur du bout de la station, côté QG : 2 morceaux et le linteau, avec un cadre en acier et le panneau au-dessus
  function murDuQG(g, MT, q) {
    const P = q.porte, hp = QC.hauteurPorte, y0 = -V.profondeur, X = q.sx * (L + 0.25);
    for (const [a, b] of [[V.demi, P[0]], [P[1], Q]]) g.add(bloc(0.5, H - y0, b - a, MT.carrelage, X, (H + y0) / 2, q.sz * (a + b) / 2));
    g.add(bloc(0.5, H - hp, P[1] - P[0], MT.carrelage, X, (H + hp) / 2, q.sz * (P[0] + P[1]) / 2));
    for (const v of P) g.add(bloc(0.6, hp, 0.12, MT.metal, X, hp / 2, q.sz * v));
    g.add(bloc(0.6, 0.12, P[1] - P[0] + 0.24, MT.metal, X, hp, q.sz * (P[0] + P[1]) / 2));
    const panneauQG = q.equipe === "bleus" ? MT.panneauBleu : MT.panneauRouge, face = X - q.sx * 0.28;
    g.add(bloc(0.04, 0.6, 2.6, panneauQG, face, hp + 0.55, q.sz * (P[0] + P[1]) / 2));
    // les rayures jaunes et noires sur le sol, devant la porte
    for (let k = 0; k < 6; k++) g.add(bloc(0.25, 0.015, P[1] - P[0], k % 2 ? MT.noir : MT.jaune, q.sx * (L - 0.2 - k * 0.25), 0.008, q.sz * (P[0] + P[1]) / 2));
  }
  // La salle : le sol, le plafond, les murs, et tout ce qu'il y a dedans
  function salleDuQG(g, MT, q) {
    const U0 = L + 0.5, U1 = L + QC.profondeur, P = q.porte, h = QC.plafond, mu = (U0 + U1) / 2, lu = U1 - U0, mv = (q.z0 + q.z1) / 2, lv = q.z1 - q.z0;
    const p = (u, v) => ici(q, u, v);
    let [x, z] = p(mu, mv);
    g.add(bloc(lu, 0.2, lv, MT.solQG, x, -0.1, z));
    g.add(bloc(lu + 0.5, 0.5, lv + 0.5, MT.beton, x, h + 0.25, z));
    [x, z] = p(U1 + 0.25, mv);
    g.add(bloc(0.5, h + 0.5, lv + 0.5, MT.murQG, x, h / 2, z));
    for (const v of [q.z0 - 0.15, q.z1 + 0.25]) ([x, z] = p(mu, v)), g.add(bloc(lu, h + 0.5, v < q.z0 ? 0.3 : 0.5, MT.murQG, x, h / 2, z));
    // la bande rouge de l'éclairage de secours, le long du plafond, et les lampes rouges grillagées
    for (const v of [q.z0 + 0.05, q.z1 - 0.05]) ([x, z] = p(mu, v)), g.add(bloc(lu - 1, 0.06, 0.06, MT.secours, x, h - 0.15, z));
    for (const u of [L + 4, L + 10, L + 16]) ([x, z] = p(u, mv)), g.add(bloc(0.5, 0.12, 0.3, MT.secours, x, h - 0.08, z));
    // les boîtes de l'architecte : les sacs de sable, les bureaux, le groupe électrogène
    for (const b of Tanks.Souterrain.boites) {
      if (b.qgDe !== q.equipe || b.sorte === "baie") continue;
      const lx = 2 * b.dl, lz = 2 * b.dp;
      if (b.sorte === "sacs") {
        for (let r = 0; r < 3; r++) for (let k = 0; k < Math.floor(lz / 0.7); k++) {
          const s2 = bloc(0.62, 0.32, 0.68, MT.sac, b.x + (hasard() - 0.5) * 0.08, 0.16 + r * 0.33, b.z - b.dp + 0.35 + k * 0.7 + (r % 2) * 0.2);
          s2.rotation.y = (hasard() - 0.5) * 0.2;
          g.add(s2);
        }
      } else if (b.sorte === "bureau") {
        g.add(bloc(lx, 0.06, lz, MT.bois, b.x, b.y1 - 0.03, b.z));
        for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(bloc(0.06, b.y1, 0.06, MT.metal, b.x + dx * (b.dl - 0.1), b.y1 / 2, b.z + dz * (b.dp - 0.1)));
        if (/cartes/.test(b.nom)) { // la grande carte de la station, avec des pions
          g.add(bloc(lx - 0.3, 0.01, lz - 0.2, MT.carte, b.x, b.y1 + 0.005, b.z));
          for (let k = 0; k < 6; k++) g.add(bloc(0.08, 0.1, 0.08, k % 2 ? MT.pionRouge : MT.pionBleu, b.x + (hasard() - 0.5) * (lx - 0.6), b.y1 + 0.05, b.z + (hasard() - 0.5) * (lz - 0.4)));
        } else if (/radios/.test(b.nom)) { // les postes de radio (avec leurs cadrans) et un casque
          for (let k = 0; k < 3; k++) {
            const xx = b.x + (k - 1) * 0.95 * (b.dl > b.dp ? 1 : 0), zz = b.z + (k - 1) * 0.95 * (b.dl > b.dp ? 0 : 1);
            g.add(bloc(0.5, 0.3, 0.32, MT.radio, xx, b.y1 + 0.15, zz));
            g.add(bloc(0.36, 0.05, 0.02, MT.voyant, xx, b.y1 + 0.22, zz - q.sz * 0.17));
          }
        } else { // les écrans (ils brillent : la carte de la ligne, des radars)
          for (let k = 0; k < 3; k++) {
            const xx = b.x + (k - 1) * 0.95;
            g.add(bloc(0.08, 0.4, 0.06, MT.metal, xx, b.y1 + 0.2, b.z));
            g.add(bloc(0.75, 0.45, 0.05, k === 1 ? MT.ecranRadar : MT.ecran, xx, b.y1 + 0.55, b.z + q.sz * 0.04));
          }
        }
      } else if (b.sorte === "groupe") { // le groupe électrogène : un gros caisson jaune, son pot d'échappement, ses câbles
        g.add(bloc(lx, b.y1, lz, MT.groupe, b.x, b.y1 / 2, b.z));
        g.add(bloc(lx * 0.7, 0.05, 0.02, MT.noir, b.x, b.y1 * 0.6, b.z - q.sz * (b.dp + 0.01)));
        g.add(O.tube([b.x + q.sx * 0.6, b.y1, b.z], [b.x + q.sx * 0.6, h, b.z], 0.07, MT.metal));
        g.add(O.tube([b.x, 0.1, b.z - q.sz * b.dp], [q.sx * (U1 - 0.7), 0.1, q.sz * 10], 0.035, MT.caoutchouc));
      }
    }
    // des caisses de munitions, une carte du réseau au mur, un drapeau du camp
    for (let k = 0; k < 4; k++) ([x, z] = p(L + 3.5 + k * 0.7, q.z0 + 0.5)), g.add(bloc(0.6, 0.35, 0.4, MT.caisse, x, 0.18 + (k === 3 ? 0.35 : 0), z));
    [x, z] = p(L + 9, q.z1 + 0.02);
    g.add(bloc(3, 1.6, 0.04, MT.plan, x, 2.2, z));
    [x, z] = p(U1 - 0.05, mv);
    g.add(bloc(0.04, 1.2, 1.9, q.equipe === "bleus" ? MT.drapeauBleu : MT.drapeauRouge, x, 3.1, z));
  }
  // Les BAIES : une armoire noire avec une façade de voyants (sa propre matière, pour changer de couleur)
  const baies = [];
  function baiesDesQG() {
    const geo = new THREE.BoxGeometry(1, 1, 1), face = facadeBaie();
    for (const e in Tanks.Souterrain.qg) {
      const q = Tanks.Souterrain.qg[e];
      q.baies.forEach((b, k) => {
        const mats = [];
        for (let f = 0; f < 6; f++) mats.push(new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.5, metalness: 0.6 }));
        const avant = q.sx > 0 ? 1 : 0; // (la face qui regarde la porte : −x pour le QG de l'est, +x pour l'ouest)
        mats[avant] = new THREE.MeshStandardMaterial({ map: face, emissiveMap: face, emissive: 0x55ff77, emissiveIntensity: 1.2, roughness: 0.4, metalness: 0.4 });
        const m = new THREE.Mesh(geo, mats);
        m.scale.set(2 * b.dl, b.y1 - b.y0, 2 * b.dp);
        m.position.set(b.x, (b.y1 + b.y0) / 2, b.z);
        racine.add(m);
        baies.push({ m, equipe: e, k, avant, etat: "neuve" });
      });
    }
  }
  // la façade d'une baie : des rangées de serveurs et leurs voyants
  function facadeBaie() {
    return image(128, 256, (g, l, h) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, l, h);
      for (let r = 0; r < 14; r++) {
        g.fillStyle = "#14171a";
        g.fillRect(6, 8 + r * 17, l - 12, 14);
        for (let k = 0; k < 6; k++) {
          g.fillStyle = hasard() < 0.7 ? "#7dff8a" : hasard() < 0.5 ? "#ffd04a" : "#4ab0ff";
          g.fillRect(12 + k * 7, 13 + r * 17, 3, 3);
        }
        g.fillStyle = "#222830";
        g.fillRect(70, 12 + r * 17, 46, 6);
      }
    });
  }
  // chaque image : la couleur des voyants suit la vie de la baie (vert → orange → rouge), détruite : carcasse noire penchée
  const vertVif = new THREE.Color(0x55ff77), orange = new THREE.Color(0xffa030), rouge = new THREE.Color(0xff3020);
  function majBaies() {
    const monde = Tanks.monde, qg = monde && monde.metro && monde.metro.qg;
    for (const B of baies) {
      const vie = qg && qg[B.equipe] ? qg[B.equipe].vies[B.k] / QC.vieBaie : 1;
      const etat = vie <= 0 ? "detruite" : vie < 0.35 ? "rouge" : vie < 0.7 ? "orange" : "neuve";
      const avant = B.m.material[B.avant];
      if (etat === "rouge") avant.emissiveIntensity = 0.6 + 0.6 * (Math.sin(horloge * 9 + B.k) > 0 ? 1 : 0); // (elle clignote : alarme)
      if (etat === B.etat) continue;
      B.etat = etat;
      if (etat === "detruite") {
        for (const mt of B.m.material) (mt.color.setHex(0x0e0c0b)), (mt.emissiveIntensity = 0), (mt.roughness = 1);
        B.m.rotation.set(0, 0, (B.equipe === "bleus" ? 1 : -1) * 0.12);
        B.m.scale.y *= 0.82;
        B.m.position.y *= 0.82;
      } else {
        avant.emissive.copy(etat === "neuve" ? vertVif : etat === "orange" ? orange : rouge);
        avant.emissiveIntensity = 1.2;
        if (etat === "neuve") (B.m.rotation.set(0, 0, 0), (B.m.scale.y = 2.1), (B.m.position.y = 1.05), B.m.material.forEach((mt, f) => (mt.color.setHex(f === B.avant ? 0xffffff : 0x1c1f22), (mt.roughness = f === B.avant ? 0.4 : 0.5))));
      }
    }
  }

  // Un morceau de gravats (un bloc de béton tombé du plafond, tourné au hasard)
  function gravat(g, m, x, y, z, t) {
    const b = bloc(t * (0.8 + hasard() * 0.8), t * (0.5 + hasard() * 0.6), t * (0.8 + hasard() * 0.8), m, x, y + t * 0.25, z);
    b.rotation.set(hasard() * 0.8, hasard() * 3, hasard() * 0.8);
    g.add(b);
  }

  // LES ESCALATORS : 3 côte à côte entre x0 et x1. Le 1er marche presque ; le 2e a perdu des marches ; le 3e s'est
  // AFFAISSÉ (penché plus fort, cassé au milieu), et des marches sont tombées sur le quai.
  function escalators(g, MT, sz) {
    const E = S.escalators, long = E.haut - Q, pente = Math.atan2(M.hauteur, long), d = Math.hypot(M.hauteur, long);
    const larg = (E.x1 - E.x0) / 3;
    for (let k = 0; k < 3; k++) {
      const xc = E.x0 + larg * (k + 0.5), sous = new THREE.Group();
      // le sous-groupe est posé au pied de l'escalator, tourné pour monter vers le fond (z = sz × haut)
      sous.position.set(xc, 0, sz * Q);
      sous.rotation.set(-sz * pente, 0, 0, "XYZ");
      const casse = k === 2;
      if (casse) sous.rotation.x += sz * 0.1; // (affaissé : moins penché, son haut ne touche plus la mezzanine)
      // la caisse (sous les marches), les flancs en inox, les mains courantes noires
      sous.add(bloc(larg - 0.5, 0.6, d, MT.rouille, 0, -0.4, sz * d / 2));
      for (const c of [-1, 1]) {
        sous.add(bloc(0.12, 0.9, d, MT.inox, c * (larg / 2 - 0.12), 0.35, sz * d / 2));
        if (!(casse && c > 0)) sous.add(bloc(0.1, 0.08, d * (k === 1 && c < 0 ? 0.6 : 1), MT.caoutchouc, c * (larg / 2 - 0.12), 0.95, sz * d * (k === 1 && c < 0 ? 0.3 : 0.5)));
      }
      // les marches (des petites lames) : il en manque
      const n = 22;
      for (let i = 0; i < n; i++) {
        if ((k === 1 && i > 7 && i < 15 && i % 2) || (casse && i > 9 && i < 16)) continue;
        sous.add(bloc(larg - 0.55, 0.12, 0.3, MT.metal, 0, -0.04, sz * ((i + 0.5) / n) * d));
      }
      aplatir(sous, g);
      // des marches tombées au pied, sur le quai
      if (k > 0) for (let i = 0; i < 4; i++) {
        const b = bloc(larg - 0.6, 0.1, 0.35, MT.metal, xc + (hasard() - 0.5) * 1.5, 0.06 + i * 0.05, sz * (Q - 0.6 - hasard() * 2));
        b.rotation.set(hasard() * 0.4, hasard() * 2, hasard() * 0.3);
        g.add(b);
      }
    }
    // le panneau « HORS SERVICE » au pied, et un gros morceau de l'escalator cassé, tombé de travers sur le quai
    g.add(bloc(0.05, 0.9, 0.05, MT.metal, (E.x0 + E.x1) / 2, 0.45, sz * (Q - 1.2)));
    g.add(bloc(1.8, 0.45, 0.04, MT.horsService, (E.x0 + E.x1) / 2, 1.1, sz * (Q - 1.2)));
    const morceau = bloc(larg - 0.4, 0.5, 3.2, MT.rouille, E.x1 - larg / 2 + 0.6, 0.5, sz * (Q - 2.6));
    morceau.rotation.set(sz * 0.35, 0.5, 0.15);
    g.add(morceau);
    // la main courante arrachée qui pend du haut de l'escalator cassé
    g.add(O.tube([E.x1 - 0.2, M.hauteur + 1, sz * E.haut], [E.x1 - 1.2, 1.4, sz * (Q + 1.5)], 0.05, MT.caoutchouc));
  }

  // UNE VOITURE de métro ou de tram (tournée si elle a déraillé, penchée sur le côté) ; brûlée, ou en feu.
  function voiture(g, MT, v) {
    const r = v.rame, [lon, lar, hau] = S.voiture[r.sorte], metro = r.sorte === "metro", sous = new THREE.Group();
    const derail = Math.abs(r.angle) > 0.02;
    sous.position.set(v.x, -V.profondeur + (derail ? 0.15 : 0), v.z);
    sous.rotation.set(derail ? Math.sign(r.angle) * 0.1 : 0, -r.angle, 0, "YXZ");
    const corps = r.feu || r.brule ? MT.brulee : metro ? MT.carrosserieMetro : MT.carrosserieTram;
    const cote = r.feu ? MT.flancFeu : r.brule ? MT.flancBrule : metro ? MT.flancMetro : MT.flancTram;
    const bas = 0.75, hc = hau - bas;
    sous.add(bloc(lon, hc, lar, corps, 0, bas + hc / 2, 0));
    for (const c of [-1, 1]) {
      const f = bloc(lon - 0.1, hc - 0.15, 0.03, cote, 0, bas + hc / 2, c * (lar / 2 + 0.015));
      if (c < 0) f.rotation.y = Math.PI; // (le flanc de l'autre côté, vu de dehors)
      sous.add(f);
      sous.add(bloc(0.05, hc * 0.55, lar - 0.3, MT.noir, c * (lon / 2 + 0.02), bas + hc * 0.62, 0)); // les vitres avant / arrière
    }
    sous.add(bloc(lon - 0.4, 0.22, lar - 0.3, corps === MT.brulee ? MT.brulee : MT.metal, 0, hau + 0.08, 0)); // le toit
    // les bogies (les chariots à roues) et leurs roues
    for (const c of [-1, 1]) {
      sous.add(bloc(2.6, 0.45, lar - 0.5, MT.noir, c * (lon / 2 - 2.6), 0.45, 0));
      for (const e of [-0.75, 0.75]) for (const w of [-1, 1]) {
        const roue = O.cylindre(0.38, 0.38, 0.12, MT.rouille, 12);
        O.couche(roue, "z", c * (lon / 2 - 2.6) + e, 0.38, (w * V.ecartement) / 2);
        sous.add(roue);
      }
    }
    if (!metro) { // le pantographe du tram (le bras sur le toit)
      sous.add(O.tube([-1, hau + 0.2, 0], [0.6, hau + 1.3, 0], 0.04, MT.noir));
      sous.add(O.tube([0.6, hau + 1.3, 0], [-0.6, hau + 1.9, 0], 0.04, MT.noir));
    }
    aplatir(sous, g);
  }

  // LES INSTANCES : 1 dessin pour tous les piliers, 1 pour tous les bancs, 1 pour toutes les lampes, 1 pour les traverses.
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), un = new THREE.Vector3(1, 1, 1);
  function instances(MT) {
    const SO = Tanks.Souterrain;
    // les piliers (de la tranchée jusqu'au plafond), carrelés de bleu
    const geoP = bloc(S.piliers.cote, H + V.profondeur, S.piliers.cote, MT.carrelage, 0, 0, 0).geometry;
    const matP = new THREE.MeshStandardMaterial({ map: MT.carrelage.map, color: 0x6f8fb8, roughness: 0.35 });
    const piliers = new THREE.InstancedMesh(geoP, matP, SO.piliers.length);
    SO.piliers.forEach((b, i) => piliers.setMatrixAt(i, m4.makeTranslation(b.x, (H - V.profondeur) / 2, b.z)));
    // les bancs : l'assise en bois, le dossier, les pieds en métal (une seule forme avec ses couleurs)
    const matB = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.3 });
    const pieces = [O.boite(2.1, 0.06, 0.45, matB, 0, 0.46, 0, 0x8a5a32), O.boite(2.1, 0.4, 0.05, matB, 0, 0.75, -0.24, 0x7a4e2a)];
    for (const x of [-0.85, 0.85]) pieces.push(O.boite(0.06, 0.46, 0.4, matB, x, 0.23, 0, 0x30343a), O.boite(0.06, 0.5, 0.05, matB, x, 0.7, -0.24, 0x30343a));
    const bancs = new THREE.InstancedMesh(O.geometrieTeintee(pieces, matB), matB, SO.bancs.length);
    SO.bancs.forEach((b, i) => bancs.setMatrixAt(i, m4.compose(p.set(b.x, 0, b.z), q.setFromEuler(e.set(0, b.z > 0 ? Math.PI : 0, 0)), un)));
    // les traverses sous les rails (tous les 65 cm)
    const nT = Math.floor((2 * (L + S.tunnel)) / 0.65), trav = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 0.12, 0.24), new THREE.MeshStandardMaterial({ color: 0x4a443e, roughness: 0.95 }), nT * V.rails.length);
    let k = 0;
    for (const zr of V.rails) for (let i = 0; i < nT; i++) trav.setMatrixAt(k++, m4.compose(p.set(-L - S.tunnel + 0.3 + i * 0.65, -V.profondeur + 0.06, zr), q.setFromEuler(e.set(0, Math.PI / 2 + (hasard() - 0.5) * 0.06, 0)), un));
    bilan.traverses = k;
    // les lampes (des néons sous le plafond, au-dessus des quais et de la mezzanine) : certaines clignotent, d'autres sont
    // éteintes ou pendent de travers
    const places = [];
    for (let x = -L + 4; x < L; x += S.lampes.ecart) for (const z of [-9.5, -1.5, 1.5, 9.5]) places.push([x, H - 0.25, z]);
    for (let x = -M.demiX + 4; x < M.demiX; x += S.lampes.ecart) for (const z of [-21, 21]) places.push([x, H - 0.25, z]);
    lampes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.08, 0.22), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), places.length);
    places.forEach(([x, y, z], i) => {
      const tirage = hasard(), etat = tirage < 0.1 ? "eteinte" : tirage < 0.1 + S.lampes.clignotent ? "clignote" : "normale";
      const pend = etat !== "normale" && hasard() < 0.4;
      etatLampes.push({ etat, phase: hasard() * 10 });
      lampes.setMatrixAt(i, m4.compose(p.set(x, y - (pend ? 0.5 : 0), z), q.setFromEuler(e.set(pend ? 0.6 : 0, 0, pend ? 0.5 : 0)), un));
      lampes.setColorAt(i, new THREE.Color(etat === "eteinte" ? 0x1a1a1a : 0xd8f0ff));
    });
    bilan.lampes = places.length;
    bilan.clignotent = etatLampes.filter((l) => l.etat === "clignote").length;
    bilan.eteintes = etatLampes.filter((l) => l.etat === "eteinte").length;
    for (const im of [piliers, bancs, trav, lampes]) (im.castShadow = im.receiveShadow = false), racine.add(im);
  }

  // LES VRAIES LUMIÈRES : un feu orange par rame en feu (au plus « feux.lumieres »), et 2 néons froids.
  function lumieres() {
    const F = S.feux;
    for (const r of S.rames) {
      if (!r.feu) continue;
      const v = Tanks.Souterrain.voitures.filter((x) => x.rame === r), a = r.angle, ca = Math.cos(a), sa = Math.sin(a);
      const [lon] = S.voiture[r.sorte];
      const foyers = [];
      for (const x of v) for (const d of [-0.32, 0, 0.3]) foyers.push({ x: x.x + ca * d * lon, z: x.z + sa * d * lon, y: 1.1 });
      const lum = feux.length < F.lumieres ? new THREE.PointLight(0xff7a2a, F.force, F.portee, 2) : null;
      if (lum) (lum.position.set(v[0].x, 2.6, v[0].z + (v[0].z > 0 ? 1.5 : -1.5)), racine.add(lum));
      feux.push({ foyers, lum, reste: 0, fumee: 0, phase: hasard() * 9 });
      bilan.foyers += foyers.length;
    }
    // (s'il reste une lumière : l'éboulement du tunnel ouest brûle un peu)
    if (feux.length < F.lumieres) {
      const lum = new THREE.PointLight(0xff6a20, F.force * 0.6, F.portee * 0.7, 2);
      lum.position.set(-L - 2, 1.5, 0);
      racine.add(lum);
      feux.push({ foyers: [{ x: -L - 4, y: -0.6, z: 1 }, { x: -L - 5, y: -0.5, z: -1.5 }], lum, reste: 0, fumee: 0, phase: 3 });
    }
    for (const x of [-30, 30]) {
      const n = new THREE.PointLight(0xcfe6ff, 30, 60, 1.6);
      n.position.set(x, H - 1, 0);
      racine.add(n);
      neons.push(n);
    }
    bilan.lumieres = feux.filter((f) => f.lum).length + neons.length;
  }

  // ------------------------------------------------------------------ chaque image
  // Les feux tremblent (la lumière orange monte et descend au hasard), les flammes et la fumée sortent des trams, les
  // néons cassés clignotent.
  const blanc = new THREE.Color(0xd8f0ff), sombre = new THREE.Color(0x202020), tiede = new THREE.Color(0xfff2c0);
  function maj(dt, cam) {
    if (!racine || !racine.visible) return;
    horloge += dt;
    majBaies(); // (livre n° 25)
    const F = S.feux, E = Tanks.Effets;
    for (const f of feux) {
      if (f.lum) f.lum.intensity = F.force * (0.7 + 0.18 * Math.sin(horloge * 13 + f.phase) + 0.12 * Math.sin(horloge * 31 + f.phase * 2) + Math.random() * 0.15);
      f.reste += dt * F.flammes;
      while (f.reste > 1) {
        f.reste -= 1;
        const o = f.foyers[Math.floor(Math.random() * f.foyers.length)];
        const toit = Math.random() < 0.35; // (des flammes sortent aussi par le toit crevé)
        E.particule(o.x + (Math.random() - 0.5) * 1.8, o.y + (toit ? 2.2 : Math.random() * 1.2), o.z + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6, 1.8 + Math.random() * 1.8, (Math.random() - 0.5) * 0.6, 0.6 + Math.random() * 0.5, 1.2, toit ? 3 : 2.4, 0.95, Math.random() < 0.5 ? [1, 0.5, 0.12] : [1, 0.72, 0.28], true);
      }
      f.fumee += dt * F.fumee;
      while (f.fumee > 1) {
        f.fumee -= 1;
        const o = f.foyers[Math.floor(Math.random() * f.foyers.length)];
        E.particule(o.x + (Math.random() - 0.5), o.y + 2, o.z + (Math.random() - 0.5), (Math.random() - 0.5) * 1.2, 1.1 + Math.random() * 0.6, (Math.random() - 0.5) * 1.2, 5 + Math.random() * 2, 1.6, 7, 0.5, [0.09, 0.085, 0.08]);
      }
    }
    // les néons qui clignotent (on ne réécrit que ceux-là)
    let change = false;
    etatLampes.forEach((l, i) => {
      if (l.etat !== "clignote") return;
      const allume = Math.sin(horloge * 7 + l.phase * 3) + Math.sin(horloge * 23 + l.phase) > 0.4 || Math.random() < 0.02;
      if (allume !== l.allume) (l.allume = allume), lampes.setColorAt(i, allume ? (l.phase > 5 ? tiede : blanc) : sombre), (change = true);
    });
    if (change) lampes.instanceColor.needsUpdate = true;
  }

  function montrer(oui) {
    if (racine) racine.visible = oui;
  }

  return { construire, maj, montrer, bilan, get construite() { return !!racine; }, get racine() { return racine; } };
})();
