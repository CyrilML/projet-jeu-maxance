// 🎨 LE PEINTRE : il dessine le village, 60 fois par seconde
//
// Le peintre LIT le monde (la carte, la caméra, l'horloge) et le dessine. Il ne change jamais rien.
//
// Comment il peint, comme un vrai peintre :
//   1. le fond : la mer tout autour de l'île ;
//   2. le SOL, case par case : un losange de couleur (herbe, sable, eau…), l'écume sur les côtes,
//      les fleurs et les touffes d'herbe ;
//   3. les OBJETS (arbres, rochers, montagnes, tente, bâtiments, ouvriers…), du FOND vers l'AVANT : ce qui est dessiné
//      en dernier passe par-dessus. Un arbre devant une montagne doit être peint après elle !
//      En vue de biais, « devant » veut dire « colonne + ligne plus grand ».
//   4. les nuages et leur ombre ; (étape 4) les pétales, les feuilles ou la neige qui tombent ;
//   Et tout change avec la SAISON : herbe jaunie en automne, neige et glace en hiver.
//   5. par-dessus tout, à plat sur l'écran : les panneaux et les boutons (affichage/interface.js),
//      et les rayons X.
//
// Style dessin animé : couleurs vives, contours foncés et épais, petites ombres rondes.

window.Village = window.Village || {};

Village.Peintre = (function () {
  const C = Village.CONFIG, K = Village.Carte, Iso = Village.Iso;
  const T = K.TERRAIN, O = K.OBJET, F = K.FILON;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const Ec = Village.Ecran; // la taille de l'écran change (téléphone, plein écran…) : on la relit à chaque image
  const TOUR = Math.PI * 2;

  // Ce que le peintre a fait à la dernière image (lu par « sous le capot »).
  const stats = { casesDessinees: 0, objetsDessines: 0, ms: 0 };

  let ctx = null;
  let cache = null; // ce qui est préparé une seule fois par carte : les couleurs et la mini-carte
  let versionMini = -1; // la mini-carte est refaite quand la carte change (arbre coupé…)
  let saison = 0, couleursSol = null; // étape 4 : la saison de l'image en cours (0 printemps … 3 hiver)
  const secousses = new Set(); // étape 5 : les arbres qu'on est en train de couper
  let chutes = new Map(); // étape 5 : animal visé → à quel point il tombe (0 à 1)

  // Les couleurs des terrains (rouge, vert, bleu), dans l'ordre des numéros de Village.Carte.TERRAIN.
  const COULEURS = [
    [47, 127, 209], // eau profonde
    [73, 166, 234], // eau
    [243, 216, 139], // sable
    [123, 207, 79], // herbe
    [154, 219, 92], // prairie fleurie
    [92, 170, 60], // forêt
    [186, 177, 146], // rochers
    [158, 141, 118], // montagne
  ];
  // Les « familles » de terrain : on trace un trait foncé entre deux familles différentes (effet dessin animé).
  const FAMILLE = [0, 0, 1, 2, 2, 2, 3, 4];
  const FLEURS = ["#ff6fa8", "#fff36b", "#ffffff", "#c48bff", "#ff9a3c"];
  const FILONS = { 1: ["#2b2b30", "#6a6a75"], 2: ["#c4622f", "#f0a070"], 3: ["#ffcf2e", "#fff6b0"] };

  function initialiser(toile) {
    ctx = toile.getContext("2d");
  }

  const rgb = (c, f) => "rgb(" + Math.round(Math.min(255, c[0] * f)) + "," + Math.round(Math.min(255, c[1] * f)) + "," + Math.round(Math.min(255, c[2] * f)) + ")";

  // Préparé UNE fois par carte : chaque case a une couleur un tout petit peu différente
  // (sinon l'herbe ressemble à du plastique), et la mini-carte est dessinée d'avance.
  function preparer(monde) {
    const carte = monde.carte, version = monde.changements * 1000 + monde.batiments.length;
    if (cache && cache.carte === carte) {
      if (versionMini !== version) { dessinerMini(monde); versionMini = version; }
      return;
    }
    const n = carte.terrain.length;
    const couleurs = new Array(n), variante = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const c = i % carte.colonnes, l = Math.floor(i / carte.colonnes);
      const v = Village.Hasard.pourCase(carte.graine, c, l);
      variante[i] = v;
      const t = carte.terrain[i];
      let f = 0.95 + v * 0.1;
      if (t >= T.herbe && t <= T.foret) f -= (carte.altitude[i] - 0.45) * 0.25; // plus haut = un peu plus foncé
      couleurs[i] = rgb(COULEURS[t], f);
    }

    const mini = document.createElement("canvas");
    mini.width = carte.colonnes + carte.lignes;
    mini.height = Math.ceil((carte.colonnes + carte.lignes) / 2) + 1;
    cache = { carte, couleurs, variante, mini, saisons: [couleurs] };
    dessinerMini(monde);
    versionMini = version;
  }

  // Étape 4 : les couleurs du sol pour chaque saison, calculées une seule fois (puis gardées).
  //   été : un vert un peu plus chaud ; automne : l'herbe jaunit ; hiver : la neige recouvre tout,
  //   et l'eau peu profonde (lacs, rivières, bord de mer) devient de la GLACE. La mer profonde ne gèle pas.
  const MELANGES = {
    1: { herbe: [[110, 175, 50], 0.18] },
    2: { herbe: [[205, 170, 70], 0.42] },
    3: { herbe: [[240, 246, 252], 0.82], sable: [[240, 244, 250], 0.65], rochers: [[235, 240, 248], 0.6], montagne: [[235, 240, 248], 0.45], eau: [[214, 236, 248], 0.85] },
  };
  function couleursDeLaSaison(numero) {
    if (cache.saisons[numero]) return cache.saisons[numero];
    const carte = cache.carte, n = carte.terrain.length, liste = new Array(n), m = MELANGES[numero];
    for (let i = 0; i < n; i++) {
      const t = carte.terrain[i], v = cache.variante[i];
      const famille = t === T.eau ? "eau" : t === T.sable ? "sable" : t === T.rochers ? "rochers" : t === T.montagne ? "montagne" : t >= T.herbe && t <= T.foret ? "herbe" : null;
      const regle = famille && m[famille];
      if (!regle) { liste[i] = cache.couleurs[i]; continue; }
      let f = 0.95 + v * 0.1;
      if (t >= T.herbe && t <= T.foret) f -= (carte.altitude[i] - 0.45) * 0.25;
      const base = COULEURS[t].map((x) => x * f), [cible, part] = regle;
      liste[i] = rgb(base.map((x, k) => x + (cible[k] - x) * part), 1);
    }
    cache.saisons[numero] = liste;
    return liste;
  }

  // La mini-carte : chaque case = 2 × 1 pixels, rangés en losange comme la grande carte.
  function dessinerMini(monde) {
    const carte = monde.carte, m = cache.mini.getContext("2d"), couleurs = cache.couleurs;
    m.clearRect(0, 0, cache.mini.width, cache.mini.height);
    for (let l = 0; l < carte.lignes; l++) {
      for (let c = 0; c < carte.colonnes; c++) {
        const i = l * carte.colonnes + c, o = carte.objet[i];
        m.fillStyle = o === O.arbre || o === O.sapin ? "#3d8a2e" : o === O.montagne ? "#7a6a58" : o === O.rocher ? "#9b9480" : couleurs[i];
        if (carte.filon[i]) m.fillStyle = FILONS[carte.filon[i]][0];
        if (monde.route[i]) m.fillStyle = "#e2c38c";
        if (o === O.feuDeCamp || o === O.tente || monde.occupees.has(i)) m.fillStyle = "#ff4b3e";
        m.fillRect(c - l + carte.lignes - 1, (c + l) / 2, 2, 1);
      }
    }
  }

  // Le milieu de la case (c, l) en px du monde.
  const milieu = (c, l) => ({ x: (c - l) * (L / 2), y: (c + l + 1) * (Hc / 2) });

  function losange(x, y, marge) {
    const a = L / 2 + marge, b = Hc / 2 + marge / 2;
    ctx.beginPath();
    ctx.moveTo(x, y - b); ctx.lineTo(x + a, y); ctx.lineTo(x, y + b); ctx.lineTo(x - a, y);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- l'image complète
  function dessiner(monde, options) {
    const debut = performance.now();
    const carte = monde.carte, cam = monde.camera, z = cam.zoom, t = monde.temps;
    const W = Ec.largeur, He = Ec.hauteur, d = Ec.densite;
    preparer(monde);
    saison = monde.saison ? monde.saison.numero : 0;
    couleursSol = couleursDeLaSaison(saison);

    // 1. La mer tout autour
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = rgb(COULEURS[0], 1);
    ctx.fillRect(0, 0, W, He);

    // La caméra : on décale et on agrandit tout le dessin d'un coup.
    // (× d : un téléphone a 2 ou 3 vrais pixels par point, on les utilise tous pour une image nette.)
    ctx.setTransform(z * d, 0, 0, z * d, d * (W / 2 - cam.x * z), d * (He / 2 - cam.y * z));

    // Quelles cases sont visibles ? On retourne les 4 coins de l'écran en colonnes et lignes.
    const coins = [[0, 0], [W, 0], [0, He], [W, He]].map(([x, y]) => {
      const m = Village.Monde.ecranVersMonde(cam, x, y);
      return Iso.versGrille(m.x, m.y, L, Hc);
    });
    const borne = (v, max) => Math.max(0, Math.min(max - 1, v));
    const cMin = borne(Math.floor(Math.min(...coins.map((p) => p.colonne))) - 1, carte.colonnes);
    const cMax = borne(Math.ceil(Math.max(...coins.map((p) => p.colonne))) + 3, carte.colonnes);
    const lMin = borne(Math.floor(Math.min(...coins.map((p) => p.ligne))) - 1, carte.lignes);
    const lMax = borne(Math.ceil(Math.max(...coins.map((p) => p.ligne))) + 3, carte.lignes);
    // Le rectangle visible, en px du monde (pour sauter les cases hors de l'écran).
    const vue = { x0: cam.x - W / 2 / z - L, x1: cam.x + W / 2 / z + L, y0: cam.y - He / 2 / z - Hc, y1: cam.y + He / 2 / z + 110 };

    stats.casesDessinees = 0;
    stats.objetsDessines = 0;

    // 2. Le sol
    for (let l = lMin; l <= lMax; l++) {
      for (let c = cMin; c <= cMax; c++) {
        const p = milieu(c, l);
        if (p.x < vue.x0 || p.x > vue.x1 || p.y < vue.y0 || p.y > vue.y1 - 90) continue;
        dessinerSol(carte, c, l, p.x, p.y, t, z);
        stats.casesDessinees++;
      }
    }

    // 2 bis. Les routes, par-dessus le sol (étape 3)
    dessinerRoutes(monde, cMin, cMax, lMin, lMax, vue, t);
    // Étape 4 : ✍️ le trou dans la glace du pêcheur qui pêche en hiver
    if (saison === 3) for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (b.type !== "pecheur" || !o || o.etat !== "travailler" || !o.cible) continue;
      if (carte.terrain[o.cible.ligne * carte.colonnes + o.cible.colonne] !== T.eau) continue;
      const p = milieu(o.cible.colonne, o.cible.ligne);
      ctx.fillStyle = "#2f7fd1"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 9, 4.5, 0, 0, TOUR); ctx.fill(); ctx.stroke();
    }

    // Étape 5 : qui est en train de couper un arbre, et quel animal est en train d'être touché ?
    secousses.clear();
    chutes = new Map();
    for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (!o || o.etat !== "travailler" || !o.cible) continue;
      if (b.type === "bucheron") secousses.add(o.cible.ligne * carte.colonnes + o.cible.colonne);
      if (b.type === "chasseur" && o.proie && o.minuteur < 0.7) chutes.set(o.proie, (0.7 - o.minuteur) / 0.7);
    }

    // Les bâtiments et les ouvriers sont rangés par diagonale, pour être peints au bon moment.
    const parDiagonale = new Map();
    const ranger = (diag, chose) => { if (!parDiagonale.has(diag)) parDiagonale.set(diag, []); parDiagonale.get(diag).push(chose); };
    for (const b of monde.batiments) {
      ranger(b.colonne + b.ligne, { b });
      const dehors = (e) => e === "aller" || e === "travailler" || e === "revenir";
      if (b.ouvrier && dehors(b.ouvrier.etat)) {
        ranger(Math.floor(b.ouvrier.x) + Math.floor(b.ouvrier.y), { o: b.ouvrier, type: b.type });
      }
    }
    // Étape 3 : les porteurs dehors (ceux qui attendent sont dans l'entrepôt)
    for (const porteur of monde.porteurs) {
      if (porteur.etat !== "attend" && !porteur.parti) ranger(Math.floor(porteur.x) + Math.floor(porteur.y), { porteur });
    }
    // Étape 4 : le gibier
    for (const a of monde.animaux) ranger(Math.floor(a.x) + Math.floor(a.y), { animal: a });
    // Étape 5 : les effets (arbre qui tombe, souche, animal qui tombe…)
    for (const ef of Village.Effets.enCours()) {
      const e = ef.e;
      if (e.sorte === "animal") ranger(Math.floor(e.animal.x) + Math.floor(e.animal.y), { effet: ef });
      else if (e.sorte === "chute" || e.sorte === "souche") ranger(e.colonne + e.ligne, { effet: ef });
    }

    // 3. Les objets, du fond vers l'avant : diagonale par diagonale (colonne + ligne = diag).
    for (let diag = cMin + lMin; diag <= cMax + lMax; diag++) {
      for (let c = Math.max(cMin, diag - lMax); c <= Math.min(cMax, diag - lMin); c++) {
        const l = diag - c, i = l * carte.colonnes + c, o = carte.objet[i];
        if (!o) continue;
        const p = milieu(c, l);
        if (p.x < vue.x0 || p.x > vue.x1 || p.y < vue.y0 || p.y > vue.y1) continue;
        if (o === O.pousse) Village.Batisses.dessinerPousse(ctx, p.x, p.y, (monde.pousses.get(i) || 0) / C.nature.croissance, t);
        else dessinerObjet(o, p.x, p.y, cache.variante[i], t, carte.filon[i], z, i);
        stats.objetsDessines++;
      }
      for (const chose of parDiagonale.get(diag) || []) {
        if (chose.b) {
          const p = milieu(chose.b.colonne, chose.b.ligne);
          Village.Batisses.dessinerBatiment(ctx, chose.b, p.x, p.y, t);
        } else if (chose.effet) {
          dessinerEffet(chose.effet, t);
        } else if (chose.animal) {
          const p = Iso.versMonde(chose.animal.x, chose.animal.y, L, Hc);
          Village.Batisses.dessinerAnimal(ctx, chose.animal, p.x, p.y + 2, t, saison === 3, chutes.get(chose.animal) || 0);
        } else if (chose.porteur) {
          const p = Iso.versMonde(chose.porteur.x, chose.porteur.y, L, Hc);
          Village.Batisses.dessinerPorteur(ctx, chose.porteur, p.x, p.y + 2, t);
        } else {
          const p = Iso.versMonde(chose.o.x, chose.o.y, L, Hc);
          Village.Batisses.dessinerOuvrier(ctx, chose.type, chose.o, p.x, p.y + 4, t, saison === 3);
        }
        stats.objetsDessines++;
      }
    }

    // Le fantôme du bâtiment qu'on veut poser, sous la souris
    if (monde.construction && monde.survol) {
      const k = monde.survol, p = milieu(k.colonne, k.ligne);
      const possible = !Village.Batiments.raisonInterdite(monde, monde.construction, k.colonne, k.ligne) && Village.Batiments.assezPour(monde, monde.construction);
      Village.Batisses.dessinerFantome(ctx, monde.construction, p.x, p.y, possible, t, L, Hc);
    }

    // Les outils route et démolir
    if (monde.outil) dessinerOutil(monde, t, z);

    // La case sous la souris, et la case choisie
    if (monde.survol && !monde.construction && !monde.outil) {
      const p = milieu(monde.survol.colonne, monde.survol.ligne);
      losange(p.x, p.y, 0);
      ctx.lineWidth = 2.5 / z; ctx.strokeStyle = "rgba(255, 240, 120, .95)"; ctx.stroke();
    }
    if (monde.choisie) {
      const p = milieu(monde.choisie.colonne, monde.choisie.ligne);
      losange(p.x, p.y, 0);
      ctx.lineWidth = 3 / z; ctx.strokeStyle = "rgba(255,255,255," + (0.6 + 0.4 * Math.sin(t * 6)) + ")"; ctx.stroke();
    }

    // Étape 4 : la ligne de pêche, du bout de la canne jusqu'au bouchon
    for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (b.type !== "pecheur" || !o || o.etat !== "travailler" || !o.cible) continue;
      const a = Iso.versMonde(o.x, o.y, L, Hc), q = milieu(o.cible.colonne, o.cible.ligne);
      const bouchon = Math.sin(t * 4) * 1.5;
      ctx.strokeStyle = "rgba(40, 30, 20, .7)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.x + 12 * o.direction, a.y - 22); ctx.quadraticCurveTo((a.x + q.x) / 2, a.y - 18, q.x, q.y + bouchon); ctx.stroke();
      ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.arc(q.x, q.y + bouchon - 1, 2.2, 0, TOUR); ctx.fill();
    }

    // Étape 5 : les copeaux de bois, la flèche du chasseur, les poissons qui sautent, les étincelles
    dessinerPetitsEffets(monde, carte, t, vue, z);

    // 4. Les nuages
    dessinerNuages(carte, t, z);

    if (options.rayonsX) Village.RayonsX.dessinerDansLeMonde(ctx, monde, { cMin, cMax, lMin, lMax });

    // 5. Les panneaux et les boutons, à plat sur l'écran
    ctx.setTransform(d, 0, 0, d, 0, 0);
    tombe(W, He, t);
    Village.Interface.dessiner(ctx, monde, options, cache.mini);
    if (options.rayonsX) Village.RayonsX.dessinerSurLEcran(ctx, monde);

    stats.ms = performance.now() - debut;
  }

  // ---------------------------------------------------------------- les routes
  // Une route = un rond de terre battue au milieu de la case, et une bande vers chaque voisin qui est
  // aussi une route (ou un bâtiment). On dessine d'abord TOUS les bords foncés, puis toute la terre claire
  // par-dessus : comme ça, les morceaux se rejoignent sans trait au milieu.
  // Astuce : on dessine dans un monde « pas écrasé » (y × 2), puis on écrase tout de moitié en hauteur :
  // les bandes ont l'air couchées sur le sol, en vue de biais.
  const VERS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function dessinerRoutes(monde, cMin, cMax, lMin, lMax, vue, t) {
    const k = monde.carte, segments = [];
    for (let l = lMin; l <= lMax; l++) for (let c = cMin; c <= cMax; c++) {
      const i = l * k.colonnes + c;
      if (!monde.route[i]) continue;
      const p = milieu(c, l);
      if (p.x < vue.x0 || p.x > vue.x1 || p.y < vue.y0 || p.y > vue.y1) continue;
      segments.push([p.x, p.y, p.x, p.y]);
      for (const [dc, dl] of VERS) {
        const nc = c + dc, nl = l + dl;
        if (nc < 0 || nl < 0 || nc >= k.colonnes || nl >= k.lignes) continue;
        const j = nl * k.colonnes + nc;
        if (!monde.route[j] && !monde.occupees.has(j)) continue;
        const q = milieu(nc, nl);
        segments.push([p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2]);
      }
    }
    if (!segments.length) return;
    ctx.save();
    ctx.scale(1, 0.5);
    ctx.lineCap = "round";
    const passe = (largeur, couleur) => {
      ctx.lineWidth = largeur; ctx.strokeStyle = couleur;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of segments) { ctx.moveTo(x1, y1 * 2); ctx.lineTo(x2 + 0.01, y2 * 2); }
      ctx.stroke();
    };
    passe(26, "#9b7440");
    passe(20, "#e2c38c");
    passe(6, "rgba(255, 245, 220, .35)");
    ctx.restore();
  }

  // L'aperçu de la route qu'on trace, ou la case qu'on va démolir
  function dessinerOutil(monde, t, z) {
    const k = monde.survol;
    if (monde.outil === "route") {
      if (monde.routeDepart && k) {
        const tr = Village.Routes.trajet(monde, monde.routeDepart, { colonne: k.colonne, ligne: k.ligne });
        const assez = tr && tr.cout <= Village.Porteurs.disponible(monde, "pierres");
        for (const p of tr ? tr.cases : []) {
          const m = milieu(p.colonne, p.ligne);
          losange(m.x, m.y, 0);
          ctx.fillStyle = assez ? "rgba(255, 226, 122, .75)" : "rgba(255, 80, 60, .7)";
          ctx.fill();
          ctx.lineWidth = 1.5 / z; ctx.strokeStyle = assez ? "#b8860b" : "#a02818"; ctx.stroke();
        }
        if (tr) {
          const m = milieu(k.colonne, k.ligne);
          // Le prix, dans une petite bulle
          const f = 1 / Math.min(z, 1.3);
          ctx.font = "bold " + 14 * f + "px 'Trebuchet MS', sans-serif";
          const texte = tr.cout ? tr.cout + " 🪨" : tr.nouvelles + " case(s) · gratuit", lt = ctx.measureText(texte).width + 14 * f;
          ctx.fillStyle = assez ? "rgba(255, 250, 235, .95)" : "rgba(255, 225, 220, .95)";
          ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(m.x - lt / 2, m.y - 40 * f, lt, 22 * f, 8 * f); else ctx.rect(m.x - lt / 2, m.y - 40 * f, lt, 22 * f);
          ctx.fill(); ctx.lineWidth = 2 * f; ctx.strokeStyle = "#5a4220"; ctx.stroke();
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#3b2614";
          ctx.fillText(texte, m.x, m.y - 29 * f);
          ctx.textAlign = "left";
        }
      }
      if (monde.routeDepart) {
        // Un petit piquet avec un fanion jaune : le départ de la route
        const m = milieu(monde.routeDepart.colonne, monde.routeDepart.ligne);
        ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x, m.y - 26); ctx.stroke();
        ctx.fillStyle = "#ffd23f";
        ctx.beginPath(); ctx.moveTo(m.x, m.y - 26); ctx.lineTo(m.x + 13, m.y - 22 + Math.sin(t * 6)); ctx.lineTo(m.x, m.y - 17); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (k) {
        const m = milieu(k.colonne, k.ligne);
        losange(m.x, m.y, 0);
        ctx.lineWidth = 2.5 / z; ctx.strokeStyle = "rgba(255, 226, 122, .95)"; ctx.stroke();
      }
    } else if (monde.outil === "demolir" && k) {
      const m = milieu(k.colonne, k.ligne);
      losange(m.x, m.y, 0);
      ctx.fillStyle = "rgba(255, 70, 60, .35)"; ctx.fill();
      ctx.lineWidth = 2.5 / z; ctx.strokeStyle = "#ff6b5b"; ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- le sol
  function dessinerSol(carte, c, l, x, y, t, z) {
    const i = l * carte.colonnes + c, ter = carte.terrain[i], v = cache.variante[i];
    losange(x, y, 0.7);
    ctx.fillStyle = couleursSol[i];
    ctx.fill();

    const voisin = (dc, dl) => {
      const nc = c + dc, nl = l + dl;
      if (nc < 0 || nl < 0 || nc >= carte.colonnes || nl >= carte.lignes) return T.eauProfonde;
      return carte.terrain[nl * carte.colonnes + nc];
    };
    // Les 4 bords du losange, et la case voisine de l'autre côté de chaque bord.
    const a = L / 2, b = Hc / 2;
    const bords = [
      { dc: 0, dl: -1, x1: x, y1: y - b, x2: x + a, y2: y }, // haut-droite
      { dc: 1, dl: 0, x1: x + a, y1: y, x2: x, y2: y + b }, // bas-droite
      { dc: 0, dl: 1, x1: x, y1: y + b, x2: x - a, y2: y }, // bas-gauche
      { dc: -1, dl: 0, x1: x - a, y1: y, x2: x, y2: y - b }, // haut-gauche
    ];

    if (ter === T.eau && saison === 3) {
      // ❄️ La glace : quelques fissures blanches, et un reflet.
      if (v < 0.5 && z > 0.45) {
        ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(x - 12 + v * 10, y - 3); ctx.lineTo(x - 2, y + 1); ctx.lineTo(x + 4, y - 4); ctx.moveTo(x - 2, y + 1); ctx.lineTo(x + 2, y + 6);
        ctx.stroke();
      }
      for (const e of bords) {
        if (voisin(e.dc, e.dl) !== T.eauProfonde) continue;
        ctx.strokeStyle = "rgba(120, 170, 200, .7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke(); // le bord de la glace
      }
      return;
    }
    if (ter <= T.eau) {
      // L'écume : un trait blanc qui « respire » là où l'eau touche la terre.
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (const e of bords) {
        if (voisin(e.dc, e.dl) <= T.eau && !(saison === 3 && voisin(e.dc, e.dl) === T.eau)) continue;
        ctx.strokeStyle = "rgba(255,255,255," + (0.55 + 0.3 * Math.sin(t * C.animation.vagues * 2 + c * 0.9 + l * 0.7)) + ")";
        // Le trait est un peu rentré dans l'eau.
        const rx = (x - (e.x1 + e.x2) / 2) * 0.12, ry = (y - (e.y1 + e.y2) / 2) * 0.12;
        ctx.beginPath(); ctx.moveTo(e.x1 + rx, e.y1 + ry); ctx.lineTo(e.x2 + rx, e.y2 + ry); ctx.stroke();
      }
      // Des vaguelettes qui glissent sur certaines cases.
      if (v < 0.3 && z > 0.45) {
        const dx = Math.sin(t * C.animation.vagues + v * 40) * 6;
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 10 + dx, y); ctx.quadraticCurveTo(x - 5 + dx, y - 4, x + dx, y); ctx.quadraticCurveTo(x + 5 + dx, y + 4, x + 10 + dx, y);
        ctx.stroke();
      }
      return;
    }

    // Un trait foncé entre deux familles de terrain (herbe / sable / rochers / montagne).
    for (const e of bords) {
      const tv = voisin(e.dc, e.dl);
      if (tv <= T.eau || FAMILLE[tv] === FAMILLE[ter]) continue;
      if (FAMILLE[tv] < FAMILLE[ter]) continue; // un seul des deux voisins trace le trait
      ctx.strokeStyle = "rgba(60, 50, 30, .28)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(e.x1, e.y1); ctx.lineTo(e.x2, e.y2); ctx.stroke();
    }

    if (z < 0.55) return; // de loin, on ne voit pas les petits détails : on gagne du temps
    if (saison === 3) {
      // ❄️ Des petits tas de neige qui brillent
      if (v > 0.6) { ctx.fillStyle = "rgba(255,255,255,.9)"; ronds([[x - 8 + v * 8, y + 2, 3], [x + 6, y - 3, 2]]); }
      return;
    }
    if (carte.objet[i] === O.fleurs && (saison === 0 || saison === 1 || v > 0.5)) {
      for (let k = 0; k < 5; k++) {
        const r1 = Village.Hasard.pourCase(carte.graine + k, c, l), r2 = Village.Hasard.pourCase(carte.graine + 50 + k, c, l);
        const fx = x + (r1 - 0.5) * L * 0.55, fy = y + (r2 - 0.5) * Hc * 0.55;
        ctx.fillStyle = "#3e8a2a";
        ctx.fillRect(fx - 0.5, fy, 1, 3);
        ctx.fillStyle = FLEURS[(k + Math.floor(v * 10)) % FLEURS.length];
        ctx.beginPath(); ctx.arc(fx, fy, 2.2, 0, TOUR); ctx.fill();
      }
    } else if ((ter === T.herbe || ter === T.foret) && v > 0.55) {
      // Des touffes d'herbe en « v », qui bougent un peu avec le vent.
      const vent = Math.sin(t * C.animation.vent * 2 + v * 30) * 1.5;
      ctx.strokeStyle = "rgba(40, 110, 30, .55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let k = 0; k < 2; k++) {
        const gx = x + (Village.Hasard.pourCase(carte.graine + 9 + k, c, l) - 0.5) * L * 0.5, gy = y + (k - 0.5) * 6;
        ctx.moveTo(gx - 3, gy - 4); ctx.lineTo(gx, gy); ctx.lineTo(gx + 3 + vent, gy - 5);
      }
      ctx.stroke();
    } else if (ter === T.sable && v > 0.8) {
      ctx.fillStyle = "rgba(160, 120, 60, .35)";
      ronds([[x - 6, y + 2, 1.5], [x + 7, y - 3, 1.2]]);
    }
  }

  // ---------------------------------------------------------------- les objets
  // Plusieurs ronds dans un seul dessin. Le moveTo évite qu'un trait relie un rond au suivant.
  function ronds(liste) {
    ctx.beginPath();
    for (const [x, y, r] of liste) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, TOUR); }
    ctx.fill();
  }

  function ombre(x, y, rx, ry) {
    ctx.fillStyle = "rgba(20, 40, 10, .22)";
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TOUR); ctx.fill();
  }

  // Le balancement dans le vent : chaque arbre a son propre décalage (sinon ils bougeraient tous ensemble).
  const balancement = (t, v) => Math.sin(t * C.animation.vent * 2 + v * 50) * C.animation.forceDuVent;

  function dessinerObjet(o, x, y, v, t, filon, z, i) {
    // Étape 5 : l'arbre qu'un bûcheron est en train de couper tremble à chaque coup de hache.
    const secousse = secousses.has(i) ? Math.sin(t * 28) * 0.07 * Math.max(0, Math.sin(t * 6)) : 0;
    switch (o) {
      case O.arbre: return arbre(x, y + 2, v, t, secousse);
      case O.sapin: return sapin(x, y + 3, v, t, secousse);
      case O.rocher: return rochers(x, y, v);
      case O.montagne: return montagne(x, y, v, t, filon);
      case O.buisson: return buisson(x, y, v, t);
      case O.feuDeCamp: return feuDeCamp(x, y, t);
      case O.tente: return tente(x, y, t);
    }
  }

  function arbre(x, y, v, t, secousse) {
    const e = 0.85 + v * 0.35; // la taille de cet arbre
    ombre(x + 5, y, 17 * e, 7 * e);
    ctx.lineJoin = "round";
    // Le tronc
    ctx.fillStyle = "#8a5a2b"; ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(x - 3 * e, y - 16 * e, 6 * e, 16 * e); ctx.fill(); ctx.stroke();
    // Le feuillage, qui se balance autour du haut du tronc
    ctx.save();
    ctx.translate(x, y - 14 * e);
    ctx.rotate(balancement(t, v) + (secousse || 0));
    ctx.scale(e, e);
    // Étape 4 : la couleur des feuilles change avec la saison.
    const verts = saison === 2 ? ["#e8a33a", "#d9652b", "#f2c94c", "#c9552a"] : saison === 3 ? ["#7f9a7c", "#8aa386", "#738f70", "#86a081"] : saison === 1 ? ["#3f9e36", "#4cad3c", "#3a9332", "#58b844"] : ["#4caf3e", "#5cbf45", "#43a33a", "#6cc94a"];
    const boules = [[-9, -9, 11], [9, -9, 11], [0, -20, 13], [0, -6, 10]];
    // D'abord le contour foncé (des boules un peu plus grosses), puis le vert par-dessus :
    // les boules se fondent en un seul nuage de feuilles, entouré d'un trait. Style dessin animé !
    ctx.fillStyle = saison === 2 ? "#6b3a14" : "#24521c";
    ronds(boules.map(([bx, by, r]) => [bx, by, r + 2]));
    ctx.fillStyle = verts[Math.floor(v * 4)];
    ronds(boules);
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ronds([[-4, -24, 5], [-11, -12, 3.5]]);
    if (saison === 3) { ctx.fillStyle = "#f7fbff"; ronds([[0, -27, 9], [-10, -16, 6.5], [10, -16, 6.5], [-4, -22, 7], [5, -23, 7]]); } // la neige sur l'arbre
    // Quelques arbres ont des pommes 🍎 (en été et en automne)
    if (v > 0.8 && (saison === 1 || saison === 2)) {
      ctx.fillStyle = "#e8402e";
      ronds([[6, -12, 2.4], [-6, -4, 2.4], [3, -22, 2.4]]);
    }
    ctx.restore();
  }

  function sapin(x, y, v, t, secousse) {
    const e = 0.85 + v * 0.4;
    ombre(x + 4, y, 13 * e, 6 * e);
    ctx.fillStyle = "#6e4523"; ctx.strokeStyle = "#2e1d0e"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(x - 2.5, y - 8 * e, 5, 8 * e); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.translate(x, y - 6 * e);
    ctx.rotate(balancement(t, v) * 0.7 + (secousse || 0));
    ctx.scale(e, e);
    ctx.lineJoin = "round"; ctx.lineWidth = 2.2; ctx.strokeStyle = "#173d22";
    const etages = [[0, 14, 30], [-11, 11, 25], [-21, 8, 19]]; // [hauteur de la base, demi-largeur, hauteur]
    etages.forEach(([b, dl, h], k) => {
      ctx.fillStyle = k === 1 ? "#2f8a4a" : "#3a9d55";
      ctx.beginPath(); ctx.moveTo(-dl, b); ctx.lineTo(0, b - h); ctx.lineTo(dl, b); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
    // ❄️ En hiver, de la neige sur chaque étage du sapin
    if (saison === 3) {
      ctx.fillStyle = "#f7fbff";
      for (const [b, dl, h] of etages) { ctx.beginPath(); ctx.moveTo(-dl * 0.45, b - h * 0.55); ctx.lineTo(0, b - h); ctx.lineTo(dl * 0.45, b - h * 0.55); ctx.closePath(); ctx.fill(); }
    }
    // Un peu de neige sur les sapins les plus hauts
    else if (v > 0.75) {
      ctx.fillStyle = "#f5f9ff";
      ctx.beginPath(); ctx.moveTo(-4, -34); ctx.lineTo(0, -40); ctx.lineTo(4, -34); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function rochers(x, y, v) {
    const pierres = [[-8, 2, 9 + v * 4], [7, -1, 7 + v * 3], [1, 6, 5]];
    for (const [dx, dy, r] of pierres) {
      const px = x + dx, py = y + dy;
      ombre(px + 2, py + 2, r, r * 0.45);
      ctx.fillStyle = "#a3a8ad"; ctx.strokeStyle = "#4a4f55"; ctx.lineWidth = 2; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(px - r, py); ctx.lineTo(px - r * 0.7, py - r * 0.8); ctx.lineTo(px + r * 0.1, py - r * 1.1);
      ctx.lineTo(px + r * 0.85, py - r * 0.6); ctx.lineTo(px + r, py); ctx.quadraticCurveTo(px, py + r * 0.45, px - r, py);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath(); ctx.moveTo(px - r * 0.6, py - r * 0.6); ctx.lineTo(px + r * 0.1, py - r * 0.95); ctx.lineTo(px - r * 0.1, py - r * 0.45); ctx.closePath(); ctx.fill();
    }
  }

  function montagne(x, y, v, t, filon) {
    const h = 46 + v * 34, lb = L * 0.5;
    const sommet = { x: x + (v - 0.5) * 14, y: y - h };
    ctx.lineJoin = "round";
    // Face éclairée (gauche) et face à l'ombre (droite)
    ctx.fillStyle = "#a99883";
    ctx.beginPath(); ctx.moveTo(x - lb, y + 3); ctx.lineTo(sommet.x, sommet.y); ctx.lineTo(x + 4, y + 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#7f705f";
    ctx.beginPath(); ctx.moveTo(sommet.x, sommet.y); ctx.lineTo(x + lb, y + 3); ctx.lineTo(x + 4, y + 9); ctx.closePath(); ctx.fill();
    // La neige du sommet, avec un bord en zigzag
    const n = 0.3; // la neige couvre 30 % du haut
    const g = { x: sommet.x + (x - lb - sommet.x) * n, y: sommet.y + (y + 3 - sommet.y) * n };
    const d = { x: sommet.x + (x + lb - sommet.x) * n, y: sommet.y + (y + 3 - sommet.y) * n };
    ctx.fillStyle = "#f4f7ff";
    ctx.beginPath(); ctx.moveTo(sommet.x, sommet.y); ctx.lineTo(d.x, d.y);
    ctx.lineTo(d.x - 5, d.y + 4); ctx.lineTo((g.x + d.x) / 2 + 2, (g.y + d.y) / 2 - 1); ctx.lineTo(g.x + 5, g.y + 5); ctx.lineTo(g.x, g.y);
    ctx.closePath(); ctx.fill();
    // Le contour
    ctx.strokeStyle = "#3d342b"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - lb, y + 3); ctx.lineTo(sommet.x, sommet.y); ctx.lineTo(x + lb, y + 3); ctx.stroke();

    // Le filon : des cristaux de couleur au pied de la montagne
    if (filon) {
      const [fonce, clair] = FILONS[filon];
      for (const [dx, dy, r] of [[-10, -4, 5], [-2, 0, 6.5], [7, -5, 4.5]]) {
        const px = x + dx, py = y + dy;
        ctx.fillStyle = fonce; ctx.strokeStyle = "#1c1814"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py - r * 1.3); ctx.lineTo(px + r * 0.7, py); ctx.lineTo(px, py + r * 0.5); ctx.lineTo(px - r * 0.7, py); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = clair;
        ctx.beginPath(); ctx.moveTo(px, py - r * 1.3); ctx.lineTo(px - r * 0.7, py); ctx.lineTo(px - r * 0.15, py); ctx.closePath(); ctx.fill();
      }
      // L'or scintille ✨
      if (filon === F.or) {
        const eclat = Math.max(0, Math.sin(t * 3 + v * 20));
        if (eclat > 0.6) {
          const r = (eclat - 0.6) * 18;
          ctx.strokeStyle = "#fffbe0"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - 2 - r, y - 8); ctx.lineTo(x - 2 + r, y - 8); ctx.moveTo(x - 2, y - 8 - r); ctx.lineTo(x - 2, y - 8 + r); ctx.stroke();
        }
      }
    }
  }

  function buisson(x, y, v, t) {
    ombre(x + 3, y + 2, 11, 5);
    const b = balancement(t, v) * 20;
    ctx.fillStyle = "#24521c";
    ronds([[x - 5 + b * 0.3, y - 4, 7.5], [x + 5 + b * 0.3, y - 4, 7.5], [x + b * 0.5, y - 9, 8]]);
    ctx.fillStyle = saison === 2 ? (v > 0.5 ? "#d98a2b" : "#c46a24") : saison === 3 ? "#7f9a7c" : v > 0.5 ? "#55b843" : "#4aa83c";
    ronds([[x - 5 + b * 0.3, y - 4, 5.7], [x + 5 + b * 0.3, y - 4, 5.7], [x + b * 0.5, y - 9, 6.2]]);
    if (saison === 3) { ctx.fillStyle = "#f7fbff"; ronds([[x + b * 0.5, y - 13, 5], [x - 5, y - 8, 3.5], [x + 5, y - 8, 3.5]]); }
    else if (v > 0.6) {
      ctx.fillStyle = "#e33a6b";
      ronds([[x - 4, y - 7, 1.8], [x + 4, y - 3, 1.8], [x + 1, y - 12, 1.8]]);
    }
  }

  function feuDeCamp(x, y, t) {
    // La lumière du feu, qui tremble
    const lueur = 0.22 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 23);
    const g = ctx.createRadialGradient(x, y - 4, 2, x, y - 4, 46);
    g.addColorStop(0, "rgba(255, 190, 80," + lueur + ")"); g.addColorStop(1, "rgba(255, 190, 80, 0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 46, 26, 0, 0, TOUR); ctx.fill();
    // Le cercle de pierres
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TOUR;
      ctx.fillStyle = "#8d9196"; ctx.strokeStyle = "#3d4045"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 11, y + Math.sin(a) * 5.5, 3.5, 2.6, 0, 0, TOUR); ctx.fill(); ctx.stroke();
    }
    // Les bûches
    ctx.strokeStyle = "#5a3818"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 7, y + 2); ctx.lineTo(x + 7, y - 2); ctx.moveTo(x - 7, y - 2); ctx.lineTo(x + 7, y + 2); ctx.stroke();
    // Les flammes : 3 gouttes qui dansent
    const flammes = [[-4, 0.9, 0], [4, 0.8, 2], [0, 1.2, 4]];
    for (const [dx, taille, phase] of flammes) {
      const h = (12 + 4 * Math.sin(t * 11 + phase)) * taille;
      const penche = Math.sin(t * 7 + phase) * 2;
      ctx.fillStyle = "#ff7b1c";
      goutte(x + dx, y, 4.5 * taille, h, penche);
      ctx.fillStyle = "#ffd93b";
      goutte(x + dx, y, 2.4 * taille, h * 0.6, penche * 0.6);
    }
    // La fumée : des boules grises qui montent, grossissent et s'effacent, poussées par le vent
    for (let k = 0; k < 6; k++) {
      const p = (t * 0.3 + k / 6) % 1;
      const fx = x + Math.sin(p * 7 + k) * 5 + p * 22, fy = y - 18 - p * 80, r = 4 + p * 11;
      ctx.fillStyle = "rgba(235, 235, 240," + 0.55 * (1 - p) + ")";
      ctx.beginPath(); ctx.arc(fx, fy, r, 0, TOUR); ctx.fill();
    }
  }

  function goutte(x, y, largeur, hauteur, penche) {
    ctx.beginPath();
    ctx.moveTo(x - largeur, y - 1);
    ctx.quadraticCurveTo(x - largeur, y - hauteur * 0.6, x + penche, y - hauteur);
    ctx.quadraticCurveTo(x + largeur, y - hauteur * 0.6, x + largeur, y - 1);
    ctx.closePath(); ctx.fill();
  }

  function tente(x, y, t) {
    ombre(x + 4, y + 2, 24, 9);
    ctx.lineJoin = "round"; ctx.lineWidth = 2.2; ctx.strokeStyle = "#5a4220";
    // Le côté au soleil et le côté à l'ombre
    ctx.fillStyle = "#f1d9a6";
    ctx.beginPath(); ctx.moveTo(x - 22, y + 4); ctx.lineTo(x - 2, y - 30); ctx.lineTo(x + 2, y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d4b27a";
    ctx.beginPath(); ctx.moveTo(x - 2, y - 30); ctx.lineTo(x + 22, y + 2); ctx.lineTo(x + 2, y + 9); ctx.closePath(); ctx.fill(); ctx.stroke();
    // La porte
    ctx.fillStyle = "#6b4a22";
    ctx.beginPath(); ctx.moveTo(x - 9, y + 6); ctx.lineTo(x - 3, y - 10); ctx.lineTo(x + 1, y + 8); ctx.closePath(); ctx.fill();
    // Le mât et le drapeau rouge qui flotte
    ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 2, y - 30); ctx.lineTo(x - 2, y - 46); ctx.stroke();
    ctx.fillStyle = "#e8402e"; ctx.strokeStyle = "#7a1d12"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - 2, y - 46);
    for (let k = 0; k <= 4; k++) ctx.lineTo(x - 2 + k * 4, y - 46 + Math.sin(t * 6 + k) * 1.5);
    for (let k = 4; k >= 0; k--) ctx.lineTo(x - 2 + k * 4, y - 38 + Math.sin(t * 6 + k) * 1.5);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // ---------------------------------------------------------------- les effets (étape 5)
  function dessinerEffet(ef, t) {
    const e = ef.e, p = ef.p;
    if (e.sorte === "chute") {
      // L'arbre bascule autour de son pied (de plus en plus vite, comme un vrai), puis s'efface.
      const m = milieu(e.colonne, e.ligne), tombe = Math.min(1, ef.age / 0.9);
      const angle = e.sens * 1.45 * tombe * tombe;
      ctx.save();
      ctx.globalAlpha = ef.age < 1.2 ? 1 : Math.max(0, 1 - (ef.age - 1.2) / 1.4);
      ctx.translate(m.x, m.y + 2);
      ctx.rotate(angle);
      if (e.arbre === "sapin") sapin(0, 1, e.v || 0.5, 0, 0); else arbre(0, 0, e.v || 0.5, 0, 0);
      ctx.restore();
      // Le « boum » : un petit nuage de poussière quand il touche le sol
      if (ef.age > 0.85 && ef.age < 1.6) {
        const q = (ef.age - 0.85) / 0.75;
        ctx.fillStyle = "rgba(200, 180, 140," + 0.5 * (1 - q) + ")";
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(m.x + e.sens * (10 + k * 7), m.y + 2 - q * 6, 4 + q * 8, 0, TOUR); ctx.fill(); }
      }
    } else if (e.sorte === "souche") {
      const m = milieu(e.colonne, e.ligne);
      ctx.globalAlpha = p < 0.8 ? 1 : (1 - p) / 0.2;
      ctx.fillStyle = "#8a5a2b"; ctx.strokeStyle = "#3b2614"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(m.x - 4, m.y - 4, 8, 5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(m.x, m.y - 4, 4, 2, 0, 0, TOUR); ctx.fillStyle = "#e0b277"; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(120, 80, 40, .7)"; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(m.x, m.y - 4, 2, 1, 0, 0, TOUR); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (e.sorte === "animal") {
      const a = e.animal, m = Iso.versMonde(a.x, a.y, L, Hc);
      ctx.globalAlpha = Math.max(0, 1 - p);
      Village.Batisses.dessinerAnimal(ctx, Object.assign({ etat: "brouter" }, a), m.x, m.y + 2, t, saison === 3, 1);
      ctx.globalAlpha = 1;
    }
  }

  // Un poisson qui saute. Étape 6 : ✍️ dans le bon sens ! La tête est devant (vers +x), le ventre clair
  // en bas, et `angle` suit la direction du saut : le nez monte au début, puis il plonge.
  function poissonSautant(x, y, taille, angle, couleur) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(taille, taille);
    ctx.lineWidth = 1 / taille; ctx.strokeStyle = "#1f3a4a";
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-9, -3.2); ctx.lineTo(-8, 0); ctx.lineTo(-9, 3.2); ctx.closePath(); ctx.fillStyle = couleur; ctx.fill(); ctx.stroke(); // la queue
    ctx.beginPath(); ctx.moveTo(-1, -2.4); ctx.lineTo(1.5, -4.5); ctx.lineTo(3, -2.2); ctx.closePath(); ctx.fill(); ctx.stroke(); // la nageoire du dos
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 2.7, 0, 0, TOUR); ctx.fill(); ctx.stroke(); // le corps
    ctx.beginPath(); ctx.ellipse(0.5, 1.1, 4.5, 1.2, 0, 0, TOUR); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill(); // le ventre clair
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(3.6, -0.7, 1, 0, TOUR); ctx.fill();
    ctx.fillStyle = "#1f3a4a"; ctx.beginPath(); ctx.arc(3.8, -0.7, 0.5, 0, TOUR); ctx.fill(); // l'œil
    ctx.restore();
  }
  const POISSONS = { sardine: { taille: 0.8, couleur: "#9fc9e6" }, truite: { taille: 1.15, couleur: "#d7a37a" }, thon: { taille: 1.8, couleur: "#4f6f9a" } };

  function rondsDansLEau(x, y, p) {
    ctx.strokeStyle = "rgba(255,255,255," + 0.8 * (1 - p) + ")"; ctx.lineWidth = 1.5;
    for (const r of [p * 14, p * 8]) { ctx.beginPath(); ctx.ellipse(x, y, r + 2, (r + 2) / 2, 0, 0, TOUR); ctx.stroke(); }
  }

  function dessinerPetitsEffets(monde, carte, t, vue, z) {
    // Les copeaux qui volent quand le bûcheron frappe
    for (const b of monde.batiments) {
      const o = b.ouvrier;
      if (!o || o.etat !== "travailler" || !o.cible) continue;
      if (b.type === "bucheron") {
        const m = milieu(o.cible.colonne, o.cible.ligne);
        for (let k = 0; k < 4; k++) {
          const q = (t * 2.2 + k / 4) % 1;
          ctx.fillStyle = "rgba(230, 190, 120," + (1 - q) + ")";
          ctx.save(); ctx.translate(m.x + (k % 2 ? 1 : -1) * q * 16, m.y - 8 - Math.sin(q * Math.PI) * 14); ctx.rotate(q * 8 + k);
          ctx.fillRect(-2, -1, 4, 2); ctx.restore();
        }
      } else if (b.type === "chasseur" && o.proie && o.minuteur <= 1 && o.minuteur > 0.7) {
        // La flèche part de l'arc et file vers l'animal
        const f = (1 - o.minuteur) / 0.3, a = Iso.versMonde(o.x, o.y, L, Hc), c = Iso.versMonde(o.proie.x, o.proie.y, L, Hc);
        const x1 = a.x + 6 * o.direction, y1 = a.y - 10, x2 = c.x, y2 = c.y - 6;
        const x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f - Math.sin(f * Math.PI) * 6, ang = Math.atan2(y2 - y1, x2 - x1);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.strokeStyle = "#6b4520"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(4, 0); ctx.stroke();
        ctx.fillStyle = "#c9ccd1"; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(3, -2); ctx.lineTo(3, 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#e8402e"; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-11, -2.5); ctx.lineTo(-7, 0); ctx.lineTo(-11, 2.5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    }
    // Le poisson pêché saute de l'eau jusqu'au pêcheur
    for (const ef of Village.Effets.enCours()) {
      const e = ef.e;
      if (e.sorte === "poisson") {
        const m = milieu(e.colonne, e.ligne), d = Iso.versMonde(e.vers.x, e.vers.y, L, Hc), p = Math.min(1, ef.p * 1.6);
        if (ef.p < 0.6) rondsDansLEau(m.x, m.y, ef.p / 0.6);
        if (p < 1) {
          const pos = (q) => ({ x: m.x + (d.x - m.x) * q, y: m.y + (d.y - 14 - m.y) * q - Math.sin(q * Math.PI) * 30 });
          const a = pos(p), b = pos(Math.min(1, p + 0.02));
          const f = POISSONS[e.espece] || POISSONS.sardine;
          // Le poisson regarde là où il va : à gauche, on le retourne (sinon il aurait le ventre en l'air).
          const versLaGauche = b.x < a.x;
          ctx.save(); ctx.translate(a.x, a.y); if (versLaGauche) ctx.scale(-1, 1);
          poissonSautant(0, 0, f.taille, Math.atan2(b.y - a.y, Math.abs(b.x - a.x) || 0.01), f.couleur);
          ctx.restore();
        }
      } else if (e.sorte === "etincelles") {
        const m = milieu(e.colonne, e.ligne);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * TOUR + ef.p * 2, r = 6 + ef.p * 22, s = (1 - ef.p) * 4;
          const x = m.x + Math.cos(a) * r, y = m.y - 10 + Math.sin(a) * r * 0.5 - ef.p * 10;
          ctx.strokeStyle = k % 2 ? "#fff6b0" : "#ffffff"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
        }
      }
    }
    // Étape 5 : des poissons qui sautent tout seuls dans l'eau (pas en hiver sur la glace).
    // Chaque « place » choisit une case d'eau au hasard, et un poisson y saute toutes les 5 secondes.
    if (z < 0.45) return;
    const eaux = cache.eaux || (cache.eaux = carte.terrain.reduce((liste, ter, i) => (ter <= T.eau ? (liste.push(i), liste) : liste), []));
    if (!eaux.length) return;
    for (let k = 0; k < 40; k++) {
      const cycle = Math.floor((t + k * 0.37) / 5), q = ((t + k * 0.37) % 5) / 1.1;
      if (q > 1) continue;
      const i = eaux[Math.floor(Village.Hasard.pourCase(cycle, k, 55) * eaux.length)];
      const ter = carte.terrain[i];
      if (ter === T.eau && saison === 3) continue; // gelé
      const m = milieu(i % carte.colonnes, Math.floor(i / carte.colonnes));
      if (m.x < vue.x0 || m.x > vue.x1 || m.y < vue.y0 || m.y > vue.y1) continue;
      const espece = ter === T.eauProfonde ? (Village.Hasard.pourCase(cycle, k, 56) < 0.35 ? "thon" : "truite") : (Village.Hasard.pourCase(cycle, k, 56) < 0.6 ? "sardine" : "truite");
      const f = POISSONS[espece], haut = 10 + f.taille * 8;
      // L'angle du saut : vers le haut au début, vers le bas à la fin (la pente de la courbe).
      const angle = Math.atan2(-Math.PI * Math.cos(q * Math.PI) * haut, 16);
      poissonSautant(m.x - 8 + q * 16, m.y - Math.sin(q * Math.PI) * haut, f.taille, angle, f.couleur);
      if (q < 0.25 || q > 0.8) rondsDansLEau(q < 0.25 ? m.x - 8 : m.x + 8, m.y, q < 0.25 ? q * 4 : (q - 0.8) * 5);
    }
  }

  // ---------------------------------------------------------------- ce qui tombe du ciel (étape 4)
  // Au printemps, des pétales roses ; en automne, des feuilles orange ; en hiver, la neige.
  // Chaque flocon a sa place au départ (un nombre « au hasard » toujours le même), puis il descend
  // et repart d'en haut quand il sort de l'écran (le reste de la division, encore lui !).
  function tombe(W, He, t) {
    const sorte = [{ n: 14, c: ["#ffc0d9", "#ffe3ef"] }, null, { n: 26, c: ["#e8a33a", "#d9652b", "#f2c94c"] }, { n: 110, c: ["#ffffff"] }][saison];
    if (!sorte) return;
    for (let k = 0; k < sorte.n; k++) {
      const r1 = Village.Hasard.pourCase(77, k, 1), r2 = Village.Hasard.pourCase(77, k, 2), r3 = Village.Hasard.pourCase(77, k, 3);
      const vitesse = saison === 3 ? 30 + r3 * 40 : 22 + r3 * 20;
      const y = (r2 * (He + 40) + t * vitesse) % (He + 40) - 20;
      const x = (r1 * (W + 60) + t * (12 + r3 * 10) + Math.sin(t * (1 + r3) + k) * 14) % (W + 60) - 30;
      ctx.fillStyle = sorte.c[k % sorte.c.length];
      ctx.globalAlpha = saison === 3 ? 0.85 : 0.9;
      ctx.beginPath();
      if (saison === 3) ctx.arc(x, y, 1.2 + r3 * 2, 0, TOUR);
      else ctx.ellipse(x, y, 3.5, 2, t * 2 + k, 0, TOUR);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- les nuages
  function dessinerNuages(carte, t, z) {
    const largeur = (carte.colonnes + carte.lignes) * (L / 2), x0 = -carte.lignes * (L / 2);
    const hauteur = (carte.colonnes + carte.lignes) * (Hc / 2);
    // Vu de près, on est « sous » les nuages : ils deviennent plus transparents.
    const opacite = Math.max(0.15, Math.min(0.85, 1.25 - z * 0.6));
    for (let k = 0; k < C.animation.nuages; k++) {
      const r1 = Village.Hasard.pourCase(carte.graine, k, 901), r2 = Village.Hasard.pourCase(carte.graine, k, 902);
      const taille = 0.8 + Village.Hasard.pourCase(carte.graine, k, 903) * 0.8;
      // Les nuages vont vers la droite et réapparaissent à gauche quand ils sortent de la carte.
      const x = x0 + ((r1 * largeur + t * C.animation.vitesseNuages * (0.7 + taille * 0.3)) % largeur);
      const y = 80 + r2 * (hauteur - 160);
      // L'ombre sur le sol
      ctx.fillStyle = "rgba(10, 30, 60, .1)";
      ctx.beginPath(); ctx.ellipse(x + 40, y + 60, 70 * taille, 28 * taille, 0, 0, TOUR); ctx.fill();
      // Le nuage, en l'air
      ctx.globalAlpha = opacite;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      for (const [dx, dy, r] of [[-40, 0, 26], [-10, -14, 34], [26, -6, 28], [50, 6, 20], [0, 10, 26]]) {
        ctx.moveTo(x + dx * taille + r * taille, y + dy * taille); ctx.arc(x + dx * taille, y + dy * taille, r * taille, 0, TOUR);
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  return { initialiser, dessiner, stats, milieu };
})();
