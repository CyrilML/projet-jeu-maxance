// 🛋️ LES INTÉRIEURS : l'architecte d'intérieur… et le concierge (livre de demandes n° 8)
//
// ✍️ « Pouvoir entrer dans les maisons. » Jusqu'ici, une maison était 4 murs et un toit, VIDES dedans. Maintenant,
// chaque maison (pas les granges ni la vieille tour) reçoit un PLAN, comme celui d'un architecte :
//   - un PLANCHER au rez-de-chaussée, et si la maison a 2 rangées de fenêtres, un ÉTAGE (un plancher en l'air) avec un
//     ESCALIER le long du mur du fond. L'escalier est une PENTE : plus tu avances dessus, plus tu montes. Ta hauteur, c'est
//     « le plus haut sol qui n'est pas plus haut que tes pieds + une marche (0,7 m) » : l'escalier monte doucement, donc
//     tu montes ; l'étage est trop haut quand tu es en bas, donc tu restes en bas ;
//   - une CLOISON avec un passage, si la maison est assez longue (une 2e pièce : la cuisine) ;
//   - des MEUBLES (table et chaises, étagère, canapé, buffet, frigo, lit, armoire, bureau, tapis, lampe), posés contre les
//     murs ou au milieu, sans boucher la porte, l'escalier, le passage ni les fenêtres ;
//   - la PORTE d'entrée, qui s'ouvre toute seule quand un soldat arrive devant (et se referme derrière lui). Un tank,
//     lui, ne passe jamais : la porte fait 1,2 m de large.
// Le concierge (« placer ») dit à chaque soldat, à chaque pas, s'il est DEDANS, à quel étage, et à quelle hauteur sont
// ses pieds ; il guide aussi les soldats de l'ordinateur (« sortie », « versAbri ») : sortir par la porte, ou courir se
// mettre à l'abri derrière une fenêtre.
// Tout est calculé dans le « repère de la maison » (u le long, v en travers, y depuis le sol), comme les murs
// (logique/structures.js). Si le toit s'effondre (une ruine), l'intérieur s'effondre avec lui : plus d'étage.
// Ce fichier ne dessine rien (c'est affichage/interieurs3d.js) : il renvoie des événements (« porte », « maison-entree »,
// « maison-sortie », « maison-etage », « maison-ejecte »).

window.Tanks = window.Tanks || {};

Tanks.Interieurs = (function () {
  const C = Tanks.CONFIG, I = C.interieurs, T = Tanks.Terrain, ST = Tanks.Structures;
  const bilan = { maisons: 0, avecEtage: 0, avecCloison: 0, meubles: 0, portesOuvertes: 0, soldatsDedans: 0, enHaut: 0, abris: 0, sorties: 0, ejectes: 0 };
  const maisons = []; // les maisons qui ont un plan (on peut y entrer)
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const proches = [], prochesSol = [];

  // ------------------------------------------------------------------ 1. Dessiner le PLAN de chaque maison
  // Pour simplifier, on dessine le plan « en miroir » si besoin : l'escalier part toujours du bout opposé à la porte
  // (k = +1 ou −1 : on retourne le plan dans le sens de la longueur à la fin).
  function preparer(b) {
    if (b.type !== "maison" || !b.toit) return;
    const mp = b.morceaux.find((m) => m.porte && m.rang === 0);
    if (!mp) return;
    let g = (b.graine || 5) * 13 + 11;
    const h2 = () => ((g = (g * 1664525 + 1013904223) >>> 0) / 4294967296);
    const ep = b.ep, iu0 = -b.demiL + ep, iu1 = b.demiL - ep, iv0 = -b.demiP + ep, iv1 = b.demiP - ep;
    const rangs = b.morceaux.reduce((n, m) => Math.max(n, m.rang + 1), 1), hr = b.h / rangs, E = I.plancher.epaisseur;
    // le sol du rez-de-chaussée : juste au-dessus du terrain (le plus haut point sous la maison), au plus 45 cm
    let p0 = 0.06;
    for (const [fu, fv] of [[0, 0], [0.9, 0.9], [0.9, -0.9], [-0.9, 0.9], [-0.9, -0.9], [0, 0.9], [0, -0.9], [0.9, 0], [-0.9, 0]]) {
      const u = fu * (iu1 - 0.1), v = fv * (iv1 - 0.1), c = Math.cos(b.angle), s = Math.sin(b.angle);
      p0 = Math.max(p0, T.hauteur(b.x + u * c - v * s, b.z + u * s + v * c) - b.sol + 0.06);
    }
    p0 = Math.min(p0, 0.45);
    const ud = (mp.a0 + mp.a1) / 2, k = ud >= 0 ? 1 : -1, udm = ud * k; // (dans le plan « en miroir », la porte est à droite)
    const deuxEtages = rangs >= 2 && hr >= 2.3;
    const W = I.escalier.largeur, sv0 = iv0, sv1 = iv0 + W;
    let esc = null;
    if (deuxEtages) {
      const L = (hr - p0) / I.escalier.pente;
      if (L < iu1 - iu0 - 1.4) esc = { u0: iu0, u1: iu0 + L, v0: sv0, v1: sv1 };
    }
    const plafond0 = deuxEtages ? hr - E : b.h;
    // la cloison : après l'escalier, à plus de 1,3 m de la porte, s'il reste assez de place pour la 2e pièce
    const CL = I.cloison, up = Math.max(esc ? esc.u1 + 0.5 : iu0 + 2.6, udm + 1.3);
    const vc = ((esc ? sv1 : iv0) + iv1) / 2;
    const cloison = iu1 - up >= CL.salleMin ? { u: up, vc } : null;
    // --- les boîtes du plan (dans le repère de la maison, « dé-miroirées »)
    const boites = [], meubles = [];
    const enU = (a, b2) => (k > 0 ? [a, b2] : [-b2, -a]);
    const boite = (u0, u1, y0, y1, v0, v1, sorte, bloque) => {
      const [a, c] = enU(u0, u1);
      const o = { u0: a, u1: c, y0, y1, v0, v1, sorte, bloque };
      boites.push(o);
      return o;
    };
    if (deuxEtages) {
      if (esc) {
        boite(iu0, iu1, hr - E, hr, sv1, iv1, "plancher", true);
        boite(esc.u1, iu1, hr - E, hr, iv0, sv1, "plancher", true);
        boite(esc.u0, esc.u1, hr, hr + 0.95, sv1, sv1 + 0.06, "rampe", false); // (le garde-corps, le long du trou de l'escalier)
      } else boite(iu0, iu1, hr - E, hr, iv0, iv1, "plancher", true);
    }
    if (cloison) {
      const e = CL.epaisseur / 2, p = CL.passage / 2;
      boite(up - e, up + e, p0, plafond0, iv0, vc - p, "cloison", true);
      boite(up - e, up + e, p0, plafond0, vc + p, iv1, "cloison", true);
    }
    // --- les MEUBLES : on essaie des places au hasard (toujours les mêmes pour une maison), on garde la 1re libre
    const reserves = { 0: [], 1: [] }, couloirs = { 0: [], 1: [] };
    const reserver = (etage, u0, u1, v0, v1) => reserves[etage].push([u0, u1, v0, v1]);
    reserver(0, udm - 0.9, udm + 0.9, iv1 - 1.9, iv1 + 1); // (devant la porte)
    const entreeM = [udm, iv1 - 0.85];
    if (esc) {
      reserver(0, iu0 - 1, esc.u1 + 0.3, iv0 - 1, sv1 + 0.15); // l'escalier (et le dessous)
      reserver(0, iu0 - 1, iu0 + 1.4, sv1, sv1 + 1.2); // le pied de l'escalier
      couloirs[0].push([entreeM, [iu0 + 0.7, sv1 + 0.7]]);
      reserver(1, iu0 - 1, esc.u1, iv0 - 1, sv1 + 0.2); // le trou de l'escalier
      reserver(1, esc.u1 - 0.2, esc.u1 + 1.5, iv0 - 1, sv1 + 1.1); // la sortie de l'escalier, en haut
    }
    if (cloison) {
      reserver(0, up - 0.25, up + 0.25, iv0 - 1, iv1 + 1);
      reserver(0, up - 1.2, up + 1.2, vc - 0.85, vc + 0.85);
      couloirs[0].push([entreeM, [up - 0.8, vc]]);
    }
    // les fenêtres : rien devant (on doit pouvoir s'y mettre, et voir dehors)
    const fenetres = [];
    for (const m of b.morceaux) {
      if (!m.fenetre || m.rang > 1) continue;
      const etage = m.rang === 0 ? 0 : 1;
      if (etage === 1 && !esc) continue;
      const mur = b.murs[m.mur];
      let r;
      if (m.axe === "u") { // (façade ou mur du fond : la fenêtre est le long de u)
        const [a, c] = k > 0 ? [m.ouverture.a0, m.ouverture.a1] : [-m.ouverture.a1, -m.ouverture.a0];
        r = mur.sens > 0 ? [a - 0.2, c + 0.2, iv1 - 1.0, iv1 + 1] : [a - 0.2, c + 0.2, iv0 - 1, iv0 + 1.0];
      } else { // (un pignon : la fenêtre est le long de v ; le bout de la maison est en u = ± demiL, retourné par le miroir)
        const bout = mur.sens * k;
        r = bout > 0 ? [iu1 - 1.0, iu1 + 1, m.ouverture.a0 - 0.2, m.ouverture.a1 + 0.2] : [iu0 - 1, iu0 + 1.0, m.ouverture.a0 - 0.2, m.ouverture.a1 + 0.2];
      }
      reserver(etage, r[0], r[1], r[2], r[3]);
      if (etage === 0) {
        // la place du tireur derrière cette fenêtre (0,75 m dedans) et la direction de la fenêtre vers dehors (le monde)
        const a = (m.ouverture.a0 + m.ouverture.a1) / 2;
        let pu, pv, nu, nv;
        if (m.axe === "u") (pu = a), (pv = mur.sens > 0 ? iv1 - 0.75 : iv0 + 0.75), (nu = 0), (nv = mur.sens);
        else (pu = mur.sens > 0 ? iu1 - 0.75 : iu0 + 0.75), (pv = a), (nu = mur.sens), (nv = 0);
        fenetres.push({ u: pu, v: pv, nu, nv, k: m.k, occupant: null });
      }
    }
    const piece0A = cloison ? [iu0, up - CL.epaisseur / 2, iv0, iv1] : [iu0, iu1, iv0, iv1];
    const piece0B = cloison ? [up + CL.epaisseur / 2, iu1, iv0, iv1] : null;
    const pieceHaut = [iu0, iu1, iv0, iv1];
    const chevauche = (r, etage, marge) => reserves[etage].some((q) => r[0] < q[1] + marge && r[1] > q[0] - marge && r[2] < q[3] + marge && r[3] > q[2] - marge);
    const surCouloir = (r, etage) => couloirs[etage].some(([a, c]) => {
      for (let t = 0; t <= 1.0001; t += 0.1) {
        const x = a[0] + (c[0] - a[0]) * t, y = a[1] + (c[1] - a[1]) * t;
        if (x > r[0] - 0.7 && x < r[1] + 0.7 && y > r[2] - 0.7 && y < r[3] + 0.7) return true;
      }
      return false;
    });
    // poser un meuble : « mur » (dos contre un mur de la pièce) ou « milieu » ; dims = [largeur, profondeur, hauteur]
    function poser(sorte, etage, piece, mode, dims, bloque, sansReserve) {
      if (!piece) return null;
      const [l, p, h] = dims, [pu0, pu1, pv0, pv1] = piece;
      for (let essai = 0; essai < 36; essai++) {
        let r, face;
        if (mode === "milieu") {
          const tourne = h2() < 0.5, dl = tourne ? p : l, dp = tourne ? l : p;
          const cu = pu0 + 0.9 + dl / 2 + h2() * Math.max(0, pu1 - pu0 - 1.8 - dl), cv = pv0 + 0.9 + dp / 2 + h2() * Math.max(0, pv1 - pv0 - 1.8 - dp);
          r = [cu - dl / 2, cu + dl / 2, cv - dp / 2, cv + dp / 2];
          face = tourne ? "u+" : "v+";
        } else {
          const cote = Math.floor(h2() * 4);
          if (cote < 2) { // contre un mur le long de u
            const c = pu0 + l / 2 + 0.05 + h2() * Math.max(0, pu1 - pu0 - l - 0.1);
            r = cote === 0 ? [c - l / 2, c + l / 2, pv1 - p, pv1] : [c - l / 2, c + l / 2, pv0, pv0 + p];
            face = cote === 0 ? "v-" : "v+";
          } else {
            const c = pv0 + l / 2 + 0.05 + h2() * Math.max(0, pv1 - pv0 - l - 0.1);
            r = cote === 2 ? [pu1 - p, pu1, c - l / 2, c + l / 2] : [pu0, pu0 + p, c - l / 2, c + l / 2];
            face = cote === 2 ? "u-" : "u+";
          }
        }
        if (r[0] < pu0 - 1e-6 || r[1] > pu1 + 1e-6 || r[2] < pv0 - 1e-6 || r[3] > pv1 + 1e-6) continue;
        if (chevauche(r, etage, 0.06) || surCouloir(r, etage)) continue;
        if (!sansReserve) reserver(etage, r[0], r[1], r[2], r[3]);
        // « dé-miroirer » : u → k × u (et la face qui regardait vers +u regarde vers −u)
        const [a, c] = enU(r[0], r[1]);
        const faceVraie = k < 0 && face[0] === "u" ? (face === "u+" ? "u-" : "u+") : face;
        const y = etage === 0 ? p0 : hr;
        const o = { sorte, etage, u0: a, u1: c, v0: r[2], v1: r[3], y, h, face: faceVraie, bloque };
        meubles.push(o);
        if (bloque) boites.push({ u0: a, u1: c, y0: y, y1: y + h, v0: r[2], v1: r[3], sorte: "meuble", bloque: false, nom: sorte });
        return o;
      }
      return null;
    }
    const M = I.meubles;
    // le coin repas : une table au milieu, ses chaises de chaque côté, un tapis dessous
    const repas = poser("coin-repas", 0, piece0A, "milieu", [M.table[0] + 0.2, M.table[1] + 1.1, M.table[2]], false);
    if (repas) {
      meubles.pop();
      const cu = (repas.u0 + repas.u1) / 2, cv = (repas.v0 + repas.v1) / 2, long = repas.face === "v+"; // (la table est le long de u ?)
      const [tl, tp] = M.table, dl = long ? tl : tp, dp = long ? tp : tl;
      meubles.push({ sorte: "tapis", etage: 0, u0: cu - M.tapis[0] / 2 * (long ? 1 : M.tapis[1] / M.tapis[0]), u1: cu + M.tapis[0] / 2 * (long ? 1 : M.tapis[1] / M.tapis[0]), v0: cv - M.tapis[1] / 2 * (long ? 1 : M.tapis[0] / M.tapis[1]), v1: cv + M.tapis[1] / 2 * (long ? 1 : M.tapis[0] / M.tapis[1]), y: p0, h: M.tapis[2], face: "v+", bloque: false });
      const table = { sorte: "table", etage: 0, u0: cu - dl / 2, u1: cu + dl / 2, v0: cv - dp / 2, v1: cv + dp / 2, y: p0, h: M.table[2], face: "v+", bloque: true };
      meubles.push(table);
      boites.push({ u0: table.u0, u1: table.u1, y0: p0, y1: p0 + table.h, v0: table.v0, v1: table.v1, sorte: "meuble", bloque: false, nom: "table" });
      const c = M.chaise[1] / 2 + 0.12;
      for (const sgn of [-1, 1]) for (const dec of [-0.35, 0.35]) {
        const pu = long ? cu + dec : cu + sgn * (dl / 2 + c), pv = long ? cv + sgn * (dp / 2 + c) : cv + dec;
        const face = long ? (sgn > 0 ? "v-" : "v+") : sgn > 0 ? "u-" : "u+";
        meubles.push({ sorte: "chaise", etage: 0, u0: pu - M.chaise[0] / 2, u1: pu + M.chaise[0] / 2, v0: pv - M.chaise[1] / 2, v1: pv + M.chaise[1] / 2, y: p0, h: M.chaise[2], face, bloque: false });
      }
    }
    poser("etagere", 0, piece0A, "mur", M.etagere, true);
    poser("canape", 0, piece0A, "mur", M.canape, true);
    poser("lampe", 0, piece0A, "mur", M.lampe, false);
    if (piece0B) {
      poser("buffet", 0, piece0B, "mur", M.buffet, true);
      poser("frigo", 0, piece0B, "mur", M.frigo, true);
      poser("lampe", 0, piece0B, "mur", M.lampe, false);
    } else poser("buffet", 0, piece0A, "mur", M.buffet, true);
    if (esc) {
      const lit = poser("lit", 1, pieceHaut, "mur", M.lit, true);
      if (lit) poser("chevet", 1, pieceHaut, "mur", M.chevet, false);
      poser("armoire", 1, pieceHaut, "mur", M.armoire, true);
      const bureau = poser("bureau", 1, pieceHaut, "mur", M.bureau, true);
      if (bureau) { // sa chaise, devant
        const cu = (bureau.u0 + bureau.u1) / 2, cv = (bureau.v0 + bureau.v1) / 2, d = M.bureau[1] / 2 + 0.3;
        const [du, dv] = { "u+": [1, 0], "u-": [-1, 0], "v+": [0, 1], "v-": [0, -1] }[bureau.face];
        const pu = cu + du * d, pv = cv + dv * d;
        meubles.push({ sorte: "chaise", etage: 1, u0: pu - 0.22, u1: pu + 0.22, v0: pv - 0.22, v1: pv + 0.22, y: hr, h: M.chaise[2], face: bureau.face[0] + (bureau.face[1] === "+" ? "-" : "+"), bloque: false });
      }
      poser("tapis", 1, pieceHaut, "milieu", M.tapis, false, true);
      poser("lampe", 1, pieceHaut, "mur", M.lampe, false);
    }
    // --- les POINTS de passage (pour les soldats de l'ordinateur), dans le repère de la maison
    const pt = (u, v) => ({ u: k * u, v });
    const P = {
      k, iu0, iu1, iv0, iv1, p0, hr, haut: deuxEtages ? hr : null, plafond0, rangs,
      esc: esc ? Object.assign({}, esc, { u0: Math.min(k * esc.u0, k * esc.u1), u1: Math.max(k * esc.u0, k * esc.u1), sens: k }) : null,
      cloison: cloison ? { u: k * up, vc } : null,
      boites, meubles, fenetres: fenetres.map((f) => Object.assign(f, { u: k * f.u, nu: f.nu * k, libre: true })),
      points: {
        dehors: { u: ud, v: b.demiP + 1.1 }, entree: { u: ud, v: iv1 - 0.85 },
        piedEsc: esc ? pt(iu0 + 0.7, sv1 + 0.7) : null, basEsc: esc ? pt(iu0 + 0.3, (sv0 + sv1) / 2) : null,
        hautEsc: esc ? pt(esc.u1 - 0.35, (sv0 + sv1) / 2) : null, sortieHaut: esc ? pt(esc.u1 + 0.8, (sv0 + sv1) / 2) : null,
      },
    };
    // une fenêtre « libre » : rien entre l'entrée et la place du tireur (pas de meuble sur la ligne)
    for (const f of P.fenetres) {
      for (let t = 0; t <= 1.0001 && f.libre; t += 0.08) {
        const u = P.points.entree.u + (f.u - P.points.entree.u) * t, v = P.points.entree.v + (f.v - P.points.entree.v) * t;
        if (boites.some((q) => q.sorte !== "plancher" && q.sorte !== "rampe" && q.y0 < p0 + 1.4 && u > q.u0 - 0.45 && u < q.u1 + 0.45 && v > q.v0 - 0.45 && v < q.v1 + 0.45)) f.libre = false;
      }
      // (et pas de l'autre côté de la cloison, pour faire simple)
      if (P.cloison && Math.sign(f.u - P.cloison.u) !== Math.sign(P.points.entree.u - P.cloison.u)) f.libre = false;
    }
    b.plan = P;
    const c = Math.cos(b.angle), s = Math.sin(b.angle);
    b.porte = { k: mp.k, u: ud, ouverture: 0, attente: 0, x: b.x + ud * c - b.demiP * s, z: b.z + ud * s + b.demiP * c, trou: { a0: ud - I.porte.largeur / 2, a1: ud + I.porte.largeur / 2, y0: -1, y1: Math.min(mp.y1 - 0.35, 2.25) }, ouvrePar: null };
    maisons.push(b);
    bilan.maisons++;
    if (esc) bilan.avecEtage++;
    if (cloison) bilan.avecCloison++;
    bilan.meubles += meubles.length;
  }
  for (const b of ST.liste) preparer(b);

  // ------------------------------------------------------------------ 2. Les questions de base
  const actif = (b) => !!(b.plan && b.toit && b.toit.intact); // (une ruine : plus d'étage, plus d'escalier, plus de meubles)
  const L = { u: 0, v: 0 };
  function versMaison(b, x, z) {
    const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x - b.x, dz = z - b.z;
    L.u = dx * c + dz * s;
    L.v = -dx * s + dz * c;
    return L;
  }
  const versMonde = (b, u, v) => {
    const c = Math.cos(b.angle), s = Math.sin(b.angle);
    return { x: b.x + u * c - v * s, z: b.z + u * s + v * c };
  };
  // la hauteur de la pente de l'escalier en u
  function rampe(P, u) {
    const E = P.esc, t = clamp(E.sens > 0 ? (u - E.u0) / (E.u1 - E.u0) : (E.u1 - u) / (E.u1 - E.u0), 0, 1);
    return P.p0 + (P.haut - P.p0) * t;
  }
  const dansEsc = (P, u, v) => P.esc && u >= P.esc.u0 && u <= P.esc.u1 && v >= P.esc.v0 && v <= P.esc.v1;
  // ✍️ LE SOL ICI : le plus haut sol (plancher, pente de l'escalier, étage) pas plus haut que tes pieds + une marche.
  const N = { y: 0, etage: 0 };
  function niveau(b, u, v, yPieds, marche) {
    const P = b.plan;
    N.y = P.p0;
    N.etage = 0;
    if (dansEsc(P, u, v)) {
      const h = rampe(P, u);
      if (h <= yPieds + marche && h > N.y) (N.y = h), (N.etage = h > P.p0 + 0.25 ? "escalier" : 0);
    } else if (P.haut !== null && P.haut <= yPieds + marche) (N.y = P.haut), (N.etage = 1);
    return N;
  }
  // dans les murs de la maison (porte comprise) ?
  const dansLesMurs = (b, u, v) => Math.abs(u) < b.demiL - b.ep * 0.4 && Math.abs(v) < b.demiP - b.ep * 0.4;

  // ------------------------------------------------------------------ 3. Le concierge : où est ce soldat, à quelle hauteur ?
  // Appelé par logique/soldat.js à chaque pas, à la place de « la hauteur du terrain ». Il ouvre aussi les portes.
  function placer(s, dt, ev) {
    const sol = T.hauteur(s.x, s.z);
    if (T.souterrain) return (s.dedans = null), (s.dedansMaison = null), sol;
    const avant = s.dedans;
    let dedans = null, maison = null, cible = sol;
    for (const b of T.boitesAutour(s.x, s.z, I.porte.ouvre + 0.6, proches)) {
      if (!b.plan) continue;
      // la porte : un soldat qui a le droit de passer, tout près ? elle s'ouvre
      const po = b.porte, dpx = s.x - po.x, dpz = s.z - po.z;
      if (dpx * dpx + dpz * dpz < I.porte.ouvre * I.porte.ouvre && peutPasser(s, b)) {
        if (po.attente <= 0 && po.ouverture < 0.05) (po.ouvrePar = s), s.joueur && ev && ev.push(["porte", { nom: b.nom, soldat: s.nom, joueur: true }]);
        po.attente = I.porte.attente;
      }
      const p = versMaison(b, s.x, s.z);
      if (Math.abs(p.u) > b.demiL || Math.abs(p.v) > b.demiP) continue;
      maison = b;
      if (!actif(b)) continue;
      const n = niveau(b, p.u, p.v, s.y - b.sol, I.marche);
      cible = b.sol + n.y;
      if (dansLesMurs(b, p.u, p.v)) dedans = { b, etage: n.etage, nom: b.nom };
    }
    s.dedansMaison = maison;
    s.dedans = dedans;
    // les événements de TON soldat : il entre, il sort, il change d'étage
    if (s.joueur && ev) {
      if (dedans && (!avant || avant.b !== dedans.b)) ev.push(["maison-entree", { nom: dedans.b.nom, etage: dedans.etage, etages: dedans.b.plan.haut !== null ? 2 : 1, meubles: dedans.b.plan.meubles.length, pieces: dedans.b.plan.cloison ? 2 : 1 }]);
      else if (!dedans && avant) ev.push(["maison-sortie", { nom: avant.b.nom }]);
      else if (dedans && avant && typeof dedans.etage === "number" && dedans.etage !== (typeof avant.etage === "number" ? avant.etage : avant.dernier)) ev.push(["maison-etage", { nom: dedans.b.nom, etage: dedans.etage, hauteur: Math.round((s.y - dedans.b.sol) * 10) / 10 }]);
      if (dedans) dedans.dernier = typeof dedans.etage === "number" ? dedans.etage : avant && avant.b === dedans.b ? (typeof avant.etage === "number" ? avant.etage : avant.dernier) : 0;
    }
    // descendre doucement (un trou, l'escalier vu d'en haut) ; monter une marche d'un coup
    if (cible < s.y - I.marche && dt) return Math.max(cible, s.y - I.chute * dt);
    return cible;
  }
  // Qui a le droit de passer la porte ? Toi, un soldat déjà dedans, un soldat de l'ordinateur qui VEUT entrer ou sortir
  // (sinon, un soldat qui longe la façade entrerait par hasard, puis ressortirait, puis rentrerait…).
  const peutPasser = (s, b) => s.genre === "soldat" && !s.dansUnEngin && (s.joueur || s.dedansMaison === b || !!(s.ia && s.ia.maison === b));

  // Le sol sous un objet qui tombe (une grenade) : le plancher de l'étage l'arrête.
  function sol(x, y, z) {
    const h = T.hauteur(x, z);
    if (T.souterrain) return h;
    for (const b of T.boitesAutour(x, z, 0.5, prochesSol)) {
      if (!actif(b)) continue;
      const p = versMaison(b, x, z);
      if (!dansLesMurs(b, p.u, p.v)) continue;
      return b.sol + niveau(b, p.u, p.v, y - b.sol, 0.25).y;
    }
    return h;
  }

  // ------------------------------------------------------------------ 4. Les obstacles du dedans (cloisons, meubles, escalier)
  // Appelé par logique/structures.js (pousser) pour un soldat dans les murs d'une maison. P = { u, v } (modifié).
  function pousserDedans(b, P, yPieds, r) {
    if (!actif(b)) return false;
    const pl = b.plan, haut = yPieds + 1.5, bas = yPieds + 0.3;
    let touche = false;
    for (const q of pl.boites) {
      if (q.sorte === "plancher" || q.y0 > haut || q.y1 < bas) continue;
      if (ST.pousserBoite(P, q.u0, q.u1, q.v0, q.v1, r)) touche = true;
    }
    // l'escalier vu d'en bas : la partie de la pente plus haute qu'une marche est un mur (on ne passe pas dessous)
    const E = pl.esc;
    if (E && yPieds < pl.haut - 0.3) {
      const t = (yPieds + I.marche - pl.p0) / (pl.haut - pl.p0);
      if (t < 1) {
        const l = E.u1 - E.u0, ua = E.sens > 0 ? E.u0 + Math.max(0, t) * l : E.u0, ub = E.sens > 0 ? E.u1 : E.u1 - Math.max(0, t) * l;
        if (ST.pousserBoite(P, ua, ub, E.v0, E.v1, r)) touche = true;
      }
    }
    return touche;
  }

  // ------------------------------------------------------------------ 5. Les portes (chaque pas)
  let generation = -1;
  function avancer(monde, dt, ev) {
    if (ST.generation !== generation) { // (une nouvelle bataille : toutes les portes fermées, les places libres)
      generation = ST.generation;
      for (const b of maisons) (b.porte.ouverture = 0), (b.porte.attente = 0), b.plan.fenetres.forEach((f) => (f.occupant = null));
    }
    let ouvertes = 0;
    for (const b of maisons) {
      const po = b.porte;
      if (po.attente <= 0 && po.ouverture <= 0) continue;
      po.attente -= dt;
      po.ouverture = clamp(po.ouverture + (po.attente > 0 ? 1 : -1) * I.porte.vitesse * dt, 0, 1);
      if (po.ouverture > 0) ouvertes++;
    }
    bilan.portesOuvertes = ouvertes;
    let n = 0, h = 0;
    for (const s of monde.soldats) if (!s.mort && s.dedans) (n++, s.dedans.etage === 1 && h++);
    bilan.soldatsDedans = n;
    bilan.enHaut = h;
  }

  // ------------------------------------------------------------------ 6. Quand le toit s'effondre : on est poussé dehors
  function ejecter(b, s, ev) {
    const p = versMaison(b, s.x, s.z);
    let u = p.u, v = p.v;
    if (b.demiL - Math.abs(u) < b.demiP - Math.abs(v)) u = Math.sign(u || 1) * (b.demiL + I.ecrase);
    else v = Math.sign(v || 1) * (b.demiP + I.ecrase);
    const w = versMonde(b, u, v);
    s.x = w.x;
    s.z = w.z;
    s.y = T.hauteur(s.x, s.z);
    s.dedans = null;
    bilan.ejectes++;
    if (s.ia) (s.ia.abri = null), (s.ia.maison = null);
    if (s.joueur) ev.push(["maison-ejecte", { nom: b.nom }]);
  }

  // ------------------------------------------------------------------ 7. Le guide des soldats de l'ordinateur
  const R = { x: 0, z: 0, arrive: false, quoi: "" };
  const vers = (b, pt, quoi) => {
    const w = versMonde(b, pt.u, pt.v);
    R.x = w.x;
    R.z = w.z;
    R.arrive = false;
    R.quoi = quoi;
    return R;
  };
  // Le prochain point pour SORTIR de la maison où il est (ou null s'il n'est dans aucune).
  function sortie(s) {
    const b = s.dedansMaison;
    if (!b || !actif(b)) return null;
    const P = b.plan, pt = P.points, p = versMaison(b, s.x, s.z), u = p.u, v = p.v, y = s.y - b.sol;
    if (s.ia) s.ia.maison = b;
    if (P.haut !== null && y > P.haut - 0.3 && !dansEsc(P, u, v)) {
      // (à l'étage : d'abord devant le haut de l'escalier — le garde-corps empêche d'y entrer par le côté —, puis dedans)
      const E = P.esc, milieu = (E.v0 + E.v1) / 2, auBout = E.sens > 0 ? u > E.u1 - 0.1 : u < E.u0 + 0.1;
      return auBout && Math.abs(v - milieu) < 0.4 ? vers(b, pt.hautEsc, "prend l'escalier") : vers(b, pt.sortieHaut, "va vers l'escalier");
    }
    if (dansEsc(P, u, v)) return y > P.p0 + 0.45 ? vers(b, pt.basEsc, "descend l'escalier") : vers(b, pt.piedEsc, "quitte l'escalier");
    if (P.cloison && Math.sign(u - P.cloison.u) !== Math.sign(pt.entree.u - P.cloison.u)) {
      const sgn = Math.sign(u - P.cloison.u) || 1;
      return Math.abs(v - P.cloison.vc) < 0.4 ? vers(b, { u: P.cloison.u - sgn * 0.9, v: P.cloison.vc }, "passe la cloison") : vers(b, { u: P.cloison.u + sgn * 0.7, v: P.cloison.vc }, "va vers le passage");
    }
    if (v > b.demiP - b.ep - 0.1 || Math.abs(u - pt.entree.u) < 0.3) return vers(b, pt.dehors, "sort par la porte");
    return vers(b, pt.entree, "va vers la porte");
  }
  // Chercher un ABRI : une maison tout près (porte à moins de « distance » m), une fenêtre libre tournée vers l'ennemi.
  function chercherAbri(s, ennemi) {
    if (T.souterrain) return null;
    let meilleur = null;
    for (const b of T.boitesAutour(s.x, s.z, I.ia.distance, proches)) {
      if (!actif(b)) continue;
      const d = Math.hypot(b.porte.x - s.x, b.porte.z - s.z);
      if (d > I.ia.distance || (meilleur && d > meilleur.d)) continue;
      const c = Math.cos(b.angle), sn = Math.sin(b.angle);
      for (const f of b.plan.fenetres) {
        if (!f.libre || (f.occupant && !f.occupant.mort && f.occupant.ia && f.occupant.ia.abri && f.occupant.ia.abri.f === f)) continue;
        if (b.morceaux[f.k].tombe) continue;
        const w = versMonde(b, f.u, f.v), nx = f.nu * c - f.nv * sn, nz = f.nu * sn + f.nv * c, ex = ennemi.x - w.x, ez = ennemi.z - w.z, l = Math.hypot(ex, ez) || 1;
        if ((ex * nx + ez * nz) / l < 0.45) continue;
        meilleur = { b, f, d, nom: b.nom };
        break;
      }
    }
    if (!meilleur) return null;
    meilleur.f.occupant = s;
    bilan.abris++;
    return meilleur;
  }
  // Le prochain point pour aller à son abri (contourner la maison, la porte, l'entrée, la fenêtre).
  function versAbri(s, a) {
    const b = a.b, P = b.plan, pt = P.points, p = versMaison(b, s.x, s.z), u = p.u, v = p.v;
    if (s.ia) s.ia.maison = b;
    if (Math.abs(u) > b.demiL - b.ep * 0.4 || Math.abs(v) > b.demiP - b.ep * 0.4) { // dehors (ou dans l'épaisseur d'un mur)
      if (v > b.demiP - 0.6 && Math.abs(u - pt.dehors.u) < 0.45) return vers(b, pt.entree, "entre par la porte");
      if (v > b.demiP + 0.3) return vers(b, pt.dehors, "va devant la porte");
      if (Math.abs(u) > b.demiL + 0.5) return vers(b, { u: Math.sign(u) * (b.demiL + 1.2), v: b.demiP + 1.2 }, "fait le tour de la maison");
      return vers(b, { u: Math.sign(u || 1) * (b.demiL + 1.2), v }, "longe la maison");
    }
    if (P.cloison && Math.sign(u - P.cloison.u) !== Math.sign(a.f.u - P.cloison.u)) return sortie(s);
    const r = vers(b, { u: a.f.u, v: a.f.v }, "va à la fenêtre");
    if (Math.hypot(u - a.f.u, v - a.f.v) < 0.4) r.arrive = true;
    return r;
  }
  // La direction de la fenêtre de son abri (vers dehors, dans le monde).
  function regardFenetre(a) {
    const c = Math.cos(a.b.angle), s = Math.sin(a.b.angle);
    return Math.atan2(a.f.nu * s + a.f.nv * c, a.f.nu * c - a.f.nv * s);
  }

  // Pour « sous le capot » et l'affichage.
  function compter() {
    let actives = 0;
    for (const b of maisons) if (actif(b)) actives++;
    return { total: maisons.length, actives };
  }

  return { maisons, bilan, actif, placer, sol, pousserDedans, peutPasser, avancer, ejecter, sortie, chercherAbri, versAbri, regardFenetre, compter, rampe, niveau, versMonde };
})();
