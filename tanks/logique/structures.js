// 🧱 LES STRUCTURES : le maçon… et le démolisseur (étape 75)
//
// ✍️ « Si tu tires dessus avec un tank ou une mitraillette, tu fais des dégâts, cela se détruit, et je veux que ce soit
// un peu réaliste. » Alors une maison n'est plus un gros bloc : c'est un vrai mur de LEGO.
//   - Chaque mur est découpé en MORCEAUX : des colonnes de 1,6 m de large et des rangées d'un étage (2,8 m) de haut.
//     Certains morceaux ont une FENÊTRE (un trou, on voit et on tire au travers) ou une PORTE (en bois, plus fragile).
//   - Chaque morceau a sa VIE (des points) : une balle enlève 1 point (la mitrailleuse « grignote » le mur) ; une
//     explosion enlève beaucoup de points au centre, et de moins en moins jusqu'au bord de son rayon : un obus fait un
//     GROS TROU (plusieurs morceaux d'un coup).
//   - Un morceau à 0 point TOMBE : ceux qui étaient posés dessus tombent aussi (rien ne tient en l'air !) et il reste un
//     tas de GRAVATS au pied du mur : on peut marcher et rouler dessus, mais il arrête les balles tirées bas (un abri).
//   - Quand trop de morceaux sont tombés (36 %), ou que le toit a reçu 3 coups directs, le TOIT S'EFFONDRE : la maison
//     devient une RUINE, et les soldats qui étaient dedans sont blessés.
//   - Un tank lancé vite (plus de 6 m/s) DÉFONCE le mur qu'il percute.
// Pour aller vite, tout est calculé dans le « repère de la maison » : u le long de la maison, v en travers, y vers le
// haut depuis le sol. Dans ce repère, chaque morceau est une simple BOÎTE alignée (comme une brique posée droite), et
// savoir si une ligne (un regard, un obus, une balle) traverse une boîte est un petit calcul : la méthode des « tranches »
// (on regarde quand la ligne entre et sort de la boîte dans chaque direction ; si les trois intervalles se chevauchent,
// elle la traverse).
// Livre de demandes n° 8 : ✍️ « entrer dans les maisons ». Un soldat se cogne aux morceaux À SA HAUTEUR (à l'étage, ceux de
// l'étage) ; la porte OUVERTE laisse passer les soldats (jamais les tanks) et les balles ; le plancher de l'étage et les
// cloisons (logique/interieurs.js) arrêtent les balles, les regards et les grenades ; une maison qui s'effondre pousse
// dehors les soldats qui étaient dedans.
// Livre de demandes n° 9 et 11 : ✍️ la ville réaliste et abandonnée. Les gros objets de la rue (voitures, bus, kiosques…,
// logique/ville.js) sont des boîtes, testées comme les murs ; une explosion les abîme aussi ; des fenêtres sont déjà
// cassées au début ; les IMMEUBLES ont jusqu'à 5 rangées.
// Ce fichier ne dessine rien : il renvoie des événements (« mur-abime », « mur-troue », « maison-effondree »).

window.Tanks = window.Tanks || {};

Tanks.Structures = (function () {
  const C = Tanks.CONFIG, S = C.structures, T = Tanks.Terrain;
  const liste = T.boites; // (les mêmes objets que les boîtes du terrain : on leur ajoute leurs morceaux)
  const AVEC_TOIT = { maison: true, grange: true, tour: true };
  const bilan = { morceaux: 0, debout: 0, testsLigne: 0, testsBoite: 0, balles: 0, trous: 0, effondrees: 0, chocs: 0 };
  let generation = 0; // (augmente à chaque nouvelle bataille : l'affichage sait qu'il doit tout reconstruire)

  // ------------------------------------------------------------------ 1. Découper chaque boîte en morceaux
  const compteurs = {};
  function nommer(b) {
    const cle = b.type + ":" + (b.lieu || ""), n = (compteurs[cle] = (compteurs[cle] || 0) + 1);
    if (b.type === "tour") return "la vieille tour de " + b.lieu;
    if (b.type === "grange") return "la grange n° " + n;
    if (b.type === "maison") return "la maison n° " + n + " (" + b.lieu + ")";
    if (b.type === "haie") return "la haie n° " + n;
    return "le muret n° " + n + " (" + b.lieu + ")";
  }
  function decouper(b) {
    let graine = (b.graine || 7) + 17;
    const h2 = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
    b.type = b.type || (b.sorte === "maison" ? "maison" : "muret");
    b.nom = nommer(b);
    b.morceaux = [];
    b.colonnes = [];
    b.murs = [];
    const toit = AVEC_TOIT[b.type];
    const ep = toit ? (b.type === "tour" ? 0.7 : S.epaisseur) : b.demiP * 2;
    b.ep = ep;
    const matiereDe = (rang) => (b.type === "haie" ? "haie" : b.type === "muret" || b.type === "tour" ? "pierre" : b.type === "grange" ? (rang === 0 ? "pierre" : "bois") : "brique");
    const rangs = toit ? Math.max(1, Math.min(b.immeuble ? 5 : 3, Math.round(b.h / S.etage))) : 1, hr = b.h / rangs; // (livre n° 9 : les immeubles, jusqu'à 5 étages)
    // les murs : [axe le long (« u » ou « v »), position en travers, de, à, sens de la normale]
    const murs = toit
      ? [["u", b.demiP - ep / 2, -b.demiL, b.demiL, 1], ["u", -b.demiP + ep / 2, -b.demiL, b.demiL, -1], ["v", b.demiL - ep / 2, -b.demiP + ep, b.demiP - ep, 1], ["v", -b.demiL + ep / 2, -b.demiP + ep, b.demiP - ep, -1]]
      : [["u", 0, -b.demiL, b.demiL, 1]];
    const largeurCol = toit ? S.colonne : S.colonne * 1.3;
    murs.forEach(([axe, pos, de, a, sens], im) => {
      const n = Math.max(1, Math.round((a - de) / largeurCol)), l = (a - de) / n;
      const mur = { axe, pos, sens, de, a, colonnes: [], u0: 0, u1: 0, v0: 0, v1: 0, y1: b.h };
      // la porte : au milieu du 1er mur (la façade) ; une grange a sa grande porte au milieu d'un pignon
      const colPorte = b.type === "maison" || b.type === "tour" ? (im === 0 ? Math.floor(n / 2) : -1) : b.type === "grange" ? (im === 2 ? Math.floor(n / 2) : -1) : -1;
      for (let c = 0; c < n; c++) {
        const a0 = de + c * l, a1 = a0 + l;
        const col = { mur: im, c, morceaux: [], gravats: 0, a0, a1 };
        for (let r = 0; r < rangs; r++) {
          const y0 = r * hr, y1 = (r + 1) * hr;
          const m = { b, k: b.morceaux.length, mur: im, c, rang: r, y0, y1, a0, a1, axe, sens, colonne: col, matiere: matiereDe(r), tombe: false, ouverture: null, porte: false, fenetre: false };
          if (axe === "u") (m.u0 = a0), (m.u1 = a1), (m.v0 = pos - ep / 2), (m.v1 = pos + ep / 2);
          else (m.v0 = a0), (m.v1 = a1), (m.u0 = pos - ep / 2), (m.u1 = pos + ep / 2);
          // une porte (en bas) ou une fenêtre (un trou : on voit et on tire au travers)
          if (r === 0 && c === colPorte) {
            m.porte = true;
            m.matiere = b.type === "grange" ? "bois" : "porte";
          } else if (toit && b.type !== "grange" && n >= 3 && c > 0 && c < n - 1 && (c + im) % 2 === 1 && (r > 0 || h2() < 0.85)) {
            const lo = Math.min(b.type === "tour" ? 0.5 : 0.95, l - 0.55), bas = r === 0 ? 0.95 : 0.75, haut = Math.min(hr - 0.45, bas + (b.type === "tour" ? 0.9 : 1.3));
            m.fenetre = true;
            m.ouverture = { a0: (a0 + a1) / 2 - lo / 2, a1: (a0 + a1) / 2 + lo / 2, y0: y0 + bas, y1: y0 + haut };
          } else if (b.type === "grange" && r > 0 && c % 3 === 1) {
            const lo = Math.min(0.7, l - 0.6);
            m.fenetre = true; // (une petite lucarne dans les planches)
            m.ouverture = { a0: (a0 + a1) / 2 - lo / 2, a1: (a0 + a1) / 2 + lo / 2, y0: y0 + hr * 0.45, y1: y0 + hr * 0.45 + 0.6 };
          }
          m.vieMax = m.vie = S.vie[m.matiere] || S.vie.brique;
          b.morceaux.push(m);
          col.morceaux.push(m);
        }
        mur.colonnes.push(col);
        b.colonnes.push(col);
      }
      // la boîte qui entoure tout le mur (pour aller vite : si une ligne ne la touche pas, elle ne touche aucun morceau)
      const ms = b.morceaux.filter((m) => m.mur === im);
      mur.u0 = Math.min(...ms.map((m) => m.u0));
      mur.u1 = Math.max(...ms.map((m) => m.u1));
      mur.v0 = Math.min(...ms.map((m) => m.v0));
      mur.v1 = Math.max(...ms.map((m) => m.v1));
      b.murs.push(mur);
    });
    // le toit : à deux pentes, le faîte (le sommet) dans la longueur de la maison
    b.toit = toit ? { hauteur: b.quartier && Tanks.Terrain.variante.toitPlat ? 0.7 : Math.min(b.demiP * (b.type === "tour" ? 1.25 : 0.82), 4.2), /* (étape 81 : toit presque plat dans le désert) */ intact: true, vie: S.toitVie } : null;
    // ✍️ (livre n° 9 et 11) la ville abandonnée : des fenêtres déjà cassées (le morceau est à moitié abîmé : la vitre est tombée)
    const VV = Tanks.Terrain.variante || {};
    if (b.quartier && VV.ville) {
      const part = VV.ville === "ruines" ? Tanks.CONFIG.ville.ruines.vitresCassees : Tanks.CONFIG.ville.vitresCassees;
      for (const m of b.morceaux) if (m.fenetre && h2() < part) m.vie = m.vieDepart = Math.floor(m.vieMax * 0.45);
    }
    b.etat = toit ? "intacte" : "debout";
    b.gravatsDedans = 0;
    b.changements = 0;
    b.total = b.morceaux.length;
    b.tombes = 0;
    // ✍️ (choix de Claude) quelques maisons des hameaux sont DÉJÀ en ruines au début de la bataille
    // (étape 81) et celles de la ville selon la variante (« ruinesDepart » de la carte : 80 % dans la ville en ruines)
    if (b.type === "maison" && h2() < (b.quartier ? b.ruinesDepart : b.hameau ? S.ruinesDepart : 0)) {
      for (const m of b.morceaux) if (!m.tombe && (m.rang > 0 ? h2() < 0.8 : h2() < 0.3)) tomber(m, null);
      b.toit.intact = false;
      b.gravatsDedans = S.gravatsDedans * 0.8;
      b.etat = "ruine";
      b.ruineDepart = true;
    }
    b.depart = { etat: b.etat, gravatsDedans: b.gravatsDedans, toit: b.toit ? b.toit.intact : null, tombe: b.morceaux.map((m) => m.tombe) };
  }

  // Un morceau tombe : ceux posés dessus aussi ; au pied, un tas de gravats.
  function tomber(m, liste) {
    if (m.tombe) return;
    m.tombe = true;
    m.vie = 0;
    m.b.tombes++;
    if (liste) liste.push(m.k);
    const col = m.colonne;
    col.gravats = Math.min(S.gravats * 2.6, col.gravats + S.gravats * (m.y1 - m.y0) / S.etage);
    for (const autre of col.morceaux) if (autre.rang > m.rang) tomber(autre, liste);
  }

  for (const b of liste) decouper(b);
  for (const b of liste) bilan.morceaux += b.total;

  // Une nouvelle bataille : tout est reconstruit comme au départ.
  function reinitialiser() {
    for (const b of liste) {
      b.morceaux.forEach((m, i) => ((m.tombe = b.depart.tombe[i]), (m.vie = m.tombe ? 0 : m.vieDepart || m.vieMax)));
      for (const col of b.colonnes) col.gravats = 0;
      b.tombes = 0;
      for (const m of b.morceaux) if (m.tombe) {
        const col = m.colonne;
        col.gravats = Math.min(S.gravats * 2.6, col.gravats + S.gravats * (m.y1 - m.y0) / S.etage);
        b.tombes++;
      }
      b.etat = b.depart.etat;
      b.gravatsDedans = b.depart.gravatsDedans;
      if (b.toit) (b.toit.intact = b.depart.toit), (b.toit.vie = S.toitVie);
      b.changements++;
    }
    bilan.trous = bilan.effondrees = bilan.balles = bilan.chocs = 0;
    generation++;
  }

  // ------------------------------------------------------------------ 2. Le repère de la maison
  // (x, z) du monde → (u, v) dans la maison. On range le résultat dans un petit objet réutilisé.
  const L = { u: 0, v: 0 };
  function versMaison(b, x, z) {
    const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x - b.x, dz = z - b.z;
    L.u = dx * c + dz * s;
    L.v = -dx * s + dz * c;
    return L;
  }
  // Un point est-il DANS la maison (entre ses murs) ?
  function dedans(b, x, z, marge) {
    const p = versMaison(b, x, z), m = marge || 0;
    return Math.abs(p.u) < b.demiL + m && Math.abs(p.v) < b.demiP + m;
  }

  // ------------------------------------------------------------------ 3. Pousser un cercle hors des morceaux (marcher, rouler)
  // Seuls les morceaux À TA HAUTEUR comptent (livre de demandes n° 8 : à l'étage, ce sont les morceaux de l'étage ; avant,
  // seulement la rangée du bas) : ceux du dessus sont plus hauts que toi.
  // Pousser le cercle (centre P = { u, v }, rayon r) hors d'une boîte [u0, u1] × [v0, v1]. Renvoie vrai s'il la touchait.
  function pousserBoite(P, u0, u1, v0, v1, r) {
    const pu = Math.max(u0, Math.min(u1, P.u)), pv = Math.max(v0, Math.min(v1, P.v));
    let eu = P.u - pu, ev = P.v - pv, d = Math.hypot(eu, ev);
    if (d >= r) return false;
    if (d < 1e-6) { // (le centre est dans la boîte : on sort par le côté le plus proche)
      const vers = [u1 - P.u, P.u - u0, v1 - P.v, P.v - v0], k = vers.indexOf(Math.min(...vers));
      (eu = k === 0 ? 1 : k === 1 ? -1 : 0), (ev = k === 2 ? 1 : k === 3 ? -1 : 0);
      d = 0;
    }
    const l = Math.hypot(eu, ev) || 1, pousse = r - d;
    P.u += (eu / l) * pousse;
    P.v += (ev / l) * pousse;
    return true;
  }
  const PP = { u: 0, v: 0 };
  function pousser(b, o, r) {
    if (!b.morceaux) return null;
    const c = Math.cos(b.angle), s = Math.sin(b.angle);
    PP.u = (o.x - b.x) * c + (o.z - b.z) * s;
    PP.v = -(o.x - b.x) * s + (o.z - b.z) * c;
    if (Math.abs(PP.u) > b.demiL + r + 0.1 || Math.abs(PP.v) > b.demiP + r + 0.1) return null;
    // (livre n° 8) à quelle hauteur est-il ? un soldat à l'étage se cogne aux murs de l'étage ; un tank, à ceux du bas
    const soldat = o.genre === "soldat", yPieds = soldat && o.y !== undefined ? o.y - b.sol : 0, haut = yPieds + 1.5, bas = yPieds + 0.3;
    // (livre n° 8) la porte ouverte : un soldat qui a le droit de passer ne se cogne qu'aux deux montants de la porte
    const po = b.porte, ouverte = soldat && po && po.ouverture > 0.5 && Tanks.Interieurs.peutPasser(o, b);
    let touche = null;
    for (const mur of b.murs) {
      if (PP.u < mur.u0 - r || PP.u > mur.u1 + r || PP.v < mur.v0 - r || PP.v > mur.v1 + r) continue;
      for (const col of mur.colonnes) {
        for (const m of col.morceaux) {
          if (m.tombe || m.y0 > (soldat ? haut : 0.5) || (soldat && m.y1 < bas)) continue;
          if (m.porte && ouverte && b.type === "maison") {
            if (pousserBoite(PP, m.u0, po.trou.a0, m.v0, m.v1, r)) touche = m;
            if (pousserBoite(PP, po.trou.a1, m.u1, m.v0, m.v1, r)) touche = m;
            continue;
          }
          if (pousserBoite(PP, m.u0, m.u1, m.v0, m.v1, r)) touche = m;
        }
      }
    }
    // (livre n° 8) dans la maison : les cloisons, les gros meubles, le dessous de l'escalier
    if (soldat && b.plan && Math.abs(PP.u) < b.demiL && Math.abs(PP.v) < b.demiP) Tanks.Interieurs.pousserDedans(b, PP, yPieds, r);
    o.x = b.x + PP.u * c - PP.v * s;
    o.z = b.z + PP.u * s + PP.v * c;
    return touche;
  }

  // ------------------------------------------------------------------ 4. Une ligne traverse-t-elle quelque chose ?
  // La méthode des « tranches » dans le repère de la maison : la ligne va de P (t = 0) à P + D (t = 1).
  // Dans chaque direction (u, y, v), on calcule quand elle entre et quand elle sort de la boîte ; on garde le plus
  // tardif des « entre » (t0) et le plus tôt des « sort » (t1). Si t0 ≤ t1, la ligne est dans la boîte entre t0 et t1.
  // On retient aussi PAR QUELLE FACE elle est entrée (pour savoir dans quel sens la balle ou la grenade rebondit).
  const R = { t0: 0, t1: 0, axe: -1, signe: 0 };
  let pu, py, pv, du, dy, dv;
  function tranche(u0, u1, y0, y1, v0, v1) {
    bilan.testsBoite++;
    let t0 = 0, t1 = 1, axe = -1, signe = 0, ta, tb, sg;
    // u
    if (du > -1e-9 && du < 1e-9) { if (pu < u0 || pu > u1) return false; }
    else {
      ta = (u0 - pu) / du; tb = (u1 - pu) / du; sg = -1;
      if (ta > tb) (sg = ta), (ta = tb), (tb = sg), (sg = 1);
      if (ta > t0) (t0 = ta), (axe = 0), (signe = sg);
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
    // y
    if (dy > -1e-9 && dy < 1e-9) { if (py < y0 || py > y1) return false; }
    else {
      ta = (y0 - py) / dy; tb = (y1 - py) / dy; sg = -1;
      if (ta > tb) (sg = ta), (ta = tb), (tb = sg), (sg = 1);
      if (ta > t0) (t0 = ta), (axe = 1), (signe = sg);
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
    // v
    if (dv > -1e-9 && dv < 1e-9) { if (pv < v0 || pv > v1) return false; }
    else {
      ta = (v0 - pv) / dv; tb = (v1 - pv) / dv; sg = -1;
      if (ta > tb) (sg = ta), (ta = tb), (tb = sg), (sg = 1);
      if (ta > t0) (t0 = ta), (axe = 2), (signe = sg);
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
    R.t0 = t0; R.t1 = t1; R.axe = axe; R.signe = signe;
    return true;
  }
  // La ligne passe-t-elle par le TROU d'une fenêtre ? (là où elle entre ET là où elle sort du morceau)
  function parLaFenetre(m, trou) {
    const o = trou || m.ouverture;
    for (const t of [R.t0, Math.min(1, R.t1)]) {
      const a = m.axe === "u" ? pu + du * t : pv + dv * t, y = py + dy * t;
      if (a < o.a0 || a > o.a1 || y < o.y0 || y > o.y1) return false;
    }
    return true;
  }
  // Le résultat (réutilisé) : la boîte, le morceau (ou null : des gravats, le toit), où, et la face (normale du monde).
  const coup = { b: null, morceau: null, toit: false, gravats: false, plancher: null, t: 1, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0 };
  let meilleurT = 1, trouve = false, premierSeulement = false;
  const candidat = (b, m, toit, gravats, plancher) => {
    if (R.t0 >= meilleurT) return;
    meilleurT = R.t0;
    trouve = true;
    coup.b = b; coup.morceau = m; coup.toit = toit; coup.gravats = gravats; coup.axe = R.axe; coup.signe = R.signe; coup.plancher = plancher || null;
  };
  // Tester une maison (le segment est déjà dans son repère : pu, py, pv, du, dy, dv).
  function testerMaison(b) {
    const hTot = b.h + (b.toit && b.toit.intact ? b.toit.hauteur : 0) + 0.5, marge = 0.8;
    if (!tranche(-b.demiL - marge, b.demiL + marge, -0.5, hTot, -b.demiP - marge, b.demiP + marge)) return;
    for (const mur of b.murs) {
      if (!tranche(mur.u0, mur.u1, 0, mur.y1, mur.v0, mur.v1)) continue;
      for (const col of mur.colonnes) {
        for (const m of col.morceaux) {
          if (m.tombe || !tranche(m.u0, m.u1, m.y0, m.y1, m.v0, m.v1)) continue;
          if (m.ouverture && parLaFenetre(m)) continue;
          if (m.porte && b.porte && b.porte.ouverture > 0.5 && parLaFenetre(m, b.porte.trou)) continue; // (livre n° 8 : la porte ouverte)
          candidat(b, m, false, false);
          if (premierSeulement && trouve) return;
        }
        if (col.gravats > 0) { // le tas de gravats au pied du mur (il déborde de 0,7 m de chaque côté)
          const m = col.morceaux[0], eu = mur.axe === "v" ? 0.7 : 0, ev = mur.axe === "u" ? 0.7 : 0;
          if (tranche(m.u0 - eu, m.u1 + eu, -0.2, col.gravats, m.v0 - ev, m.v1 + ev)) candidat(b, null, false, true);
          if (premierSeulement && trouve) return;
        }
      }
    }
    // (livre n° 8) l'intérieur : le plancher de l'étage et les cloisons arrêtent les balles, les regards et les grenades
    if (b.plan && b.toit && b.toit.intact) for (const q of b.plan.boites) {
      if (q.bloque && tranche(q.u0, q.u1, q.y0, q.y1, q.v0, q.v1)) candidat(b, null, false, false, q.sorte);
      if (premierSeulement && trouve) return;
    }
    if (b.gravatsDedans > 0 && tranche(-b.demiL + b.ep, b.demiL - b.ep, -0.2, b.gravatsDedans, -b.demiP + b.ep, b.demiP - b.ep)) candidat(b, null, false, true);
    if (b.toit && b.toit.intact && tranche(-b.demiL - 0.3, b.demiL + 0.3, b.h, b.h + b.toit.hauteur * 0.6, -b.demiP - 0.3, b.demiP + 0.3)) candidat(b, null, true, false);
  }
  // Les maisons dont la boîte entoure peut toucher le segment : celles du rectangle autour de lui.
  const proches = [], prochesVille = [];
  function chercher(x1, y1, z1, x2, y2, z2, premier) {
    bilan.testsLigne++;
    // (étape 80) dans le souterrain, pas de maison : c'est l'architecte de la station qui répond (murs, rames, piliers…)
    if (T.souterrain) {
      const h = Tanks.Souterrain.ligne(x1, y1, z1, x2, y2, z2, premier);
      if (!h || premier) return !!h;
      Object.assign(coup, { b: Tanks.Souterrain.BOITE, morceau: null, toit: false, gravats: false, t: h.t, x: h.x, y: h.y, z: h.z, nx: h.nx, ny: h.ny, nz: h.nz });
      Tanks.Souterrain.BOITE.nom = h.quoi.nom || "le mur de la station";
      return true;
    }
    meilleurT = 1.0000001;
    trouve = false;
    premierSeulement = premier;
    const minX = Math.min(x1, x2), maxX = Math.max(x1, x2), minZ = Math.min(z1, z2), maxZ = Math.max(z1, z2);
    const longue = maxX - minX + maxZ - minZ > 60;
    const boites = longue ? liste : T.boitesAutour((x1 + x2) / 2, (z1 + z2) / 2, Math.hypot(x2 - x1, z2 - z1) / 2 + 2, proches);
    for (let i = 0; i < boites.length; i++) {
      const b = boites[i];
      if (b.x + b.rayon + 1 < minX || b.x - b.rayon - 1 > maxX || b.z + b.rayon + 1 < minZ || b.z - b.rayon - 1 > maxZ) continue;
      const c = Math.cos(b.angle), s = Math.sin(b.angle), dx = x1 - b.x, dz = z1 - b.z, ex = x2 - x1, ez = z2 - z1;
      pu = dx * c + dz * s; pv = -dx * s + dz * c; py = y1 - b.sol;
      du = ex * c + ez * s; dv = -ex * s + ez * c; dy = y2 - y1;
      const avant = meilleurT;
      testerMaison(b);
      if (premier && trouve) return true;
      if (meilleurT < avant) coup.cs = [c, s]; // (pour remettre la normale dans le repère du monde)
    }
    // ✍️ (livre n° 9 et 11) les gros objets de la ville (voitures, bus, kiosques, abribus, bacs) : des boîtes, eux aussi
    const VI = Tanks.Ville;
    if (VI && VI.actif && maxX > VI.boite[0] && minX < VI.boite[1] && maxZ > VI.boite[2] && minZ < VI.boite[3]) for (const o of VI.solidesAutour((x1 + x2) / 2, (z1 + z2) / 2, Math.hypot(x2 - x1, z2 - z1) / 2, prochesVille)) {
      const rr = Math.max(o.demiL, o.demiP) + 0.5;
      if (o.ecrase || o.x + rr < minX || o.x - rr > maxX || o.z + rr < minZ || o.z - rr > maxZ) continue;
      const c = Math.cos(o.angle), s = Math.sin(o.angle), dx = x1 - o.x, dz = z1 - o.z, ex = x2 - x1, ez = z2 - z1;
      pu = dx * c + dz * s; pv = -dx * s + dz * c; py = y1 - o.y;
      du = ex * c + ez * s; dv = -ex * s + ez * c; dy = y2 - y1;
      const avant = meilleurT;
      if (tranche(-o.demiL, o.demiL, 0.15, o.brule ? o.h * 0.8 : o.h, -o.demiP, o.demiP)) candidat(o.boite, null, false, false, "objet");
      if (premier && trouve) return true;
      if (meilleurT < avant) coup.cs = [c, s];
    }
    if (!trouve) return false;
    const t = meilleurT, [c, s] = coup.cs;
    coup.t = t;
    coup.x = x1 + (x2 - x1) * t;
    coup.y = y1 + (y2 - y1) * t;
    coup.z = z1 + (z2 - z1) * t;
    // la face d'entrée : dans le repère de la maison (u, y ou v), puis dans le monde
    const g = coup.signe || 1;
    if (coup.axe === 0) (coup.nx = c * g), (coup.ny = 0), (coup.nz = s * g);
    else if (coup.axe === 2) (coup.nx = -s * g), (coup.ny = 0), (coup.nz = c * g);
    else if (coup.axe === 1) (coup.nx = 0), (coup.ny = g), (coup.nz = 0);
    else { // (on était déjà dedans : on renvoie vers l'arrière)
      const l = Math.hypot(x2 - x1, y2 - y1, z2 - z1) || 1;
      (coup.nx = -(x2 - x1) / l), (coup.ny = -(y2 - y1) / l), (coup.nz = -(z2 - z1) / l);
    }
    return true;
  }
  // « Y a-t-il un mur entre les deux ? » (vrai / faux, le plus vite possible)
  const touche = (x1, y1, z1, x2, y2, z2) => chercher(x1, y1, z1, x2, y2, z2, true);
  // « Qu'est-ce que la ligne touche EN PREMIER ? » (le résultat, ou null)
  const premier = (x1, y1, z1, x2, y2, z2) => (chercher(x1, y1, z1, x2, y2, z2, false) ? coup : null);

  // ------------------------------------------------------------------ 5. Les dégâts
  const effondrable = (b) => b.toit && b.toit.intact;
  function verifierEffondrement(b, tireur, ev, monde, sorte) {
    if (!effondrable(b)) return;
    if (b.tombes / b.total < S.effondrement && b.toit.vie > 0) return;
    // ✍️ Le toit s'effondre : tout ce qui est en haut tombe, et une partie des murs du bas avec lui.
    let graine = (b.graine || 3) * 31 + b.tombes * 7 + generation;
    const h2 = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
    const tombes = [];
    for (const m of b.morceaux) if (!m.tombe && (m.rang > 0 || h2() < S.tombeAvecLeToit)) tomber(m, tombes);
    b.toit.intact = false;
    b.gravatsDedans = S.gravatsDedans;
    b.etat = "ruine";
    b.changements++;
    bilan.effondrees++;
    // les soldats qui étaient dedans sont blessés par ce qui tombe
    let blesses = 0;
    if (monde) for (const s of monde.soldats) {
      if (s.mort || s.dansUnEngin || s.parachute || !dedans(b, s.x, s.z, -0.2)) continue;
      Tanks.Soldat.blesser(s, S.ecrasesSousLeToit, tireur || { nom: "la maison", equipe: "aucune" }, ev, "effondrement");
      blesses++;
      if (!s.mort && b.plan) Tanks.Interieurs.ejecter(b, s, ev); // (livre n° 8 : et il est poussé dehors, au milieu de la poussière)
    }
    ev.push(["maison-effondree", { b, nom: b.nom, type: b.type, x: b.x, y: b.sol + b.h * 0.5, z: b.z, tireur, sorte, morceaux: tombes, debout: b.total - b.tombes, total: b.total, blesses }]);
  }
  // Abîmer un morceau. Renvoie vrai s'il tombe.
  function abimer(m, points, liste) {
    if (m.tombe) return false;
    m.vie -= points;
    if (m.vie > 0) return false;
    tomber(m, liste);
    return true;
  }
  // Une BALLE arrive sur ce que « premier » a trouvé (coup). Renvoie l'événement à annoncer.
  function balle(c, degats, tireur, ev, monde) {
    bilan.balles++;
    const m = c.morceau, b = c.b;
    const d = { b, k: m ? m.k : -1, nom: b.nom, matiere: m ? m.matiere : c.toit ? "tuiles" : c.plancher === "plancher" ? "bois" : c.plancher === "objet" ? "metal" : "gravats", x: c.x, y: c.y, z: c.z, nx: c.nx, ny: c.ny, nz: c.nz, tireur, vie: m ? m.vie : 0, vieMax: m ? m.vieMax : 0 };
    if (!m && b.objet) Tanks.Ville.balle(b.objet, degats, tireur, ev); // (livre n° 9 et 11 : une voiture, un bus…)
    if (!m) return void ev.push(["mur-abime", d]);
    const avant = m.vie, tombes = [];
    abimer(m, degats * S.degatsBalle, tombes);
    d.vie = Math.max(0, m.vie);
    d.fissure = avant > m.vieMax / 2 && m.vie <= m.vieMax / 2; // (il vient de passer sous la moitié : il se fissure)
    b.changements++;
    ev.push(["mur-abime", d]);
    if (tombes.length) {
      bilan.trous++;
      ev.push(["mur-troue", { b, nom: b.nom, type: b.type, x: c.x, y: c.y, z: c.z, sorte: "balle", tireur, morceaux: tombes, debout: b.total - b.tombes, total: b.total }]);
      verifierEffondrement(b, tireur, ev, monde, "balle");
    }
  }
  // Une EXPLOSION en (x, y, z) : chaque morceau proche perd des points (beaucoup au centre, rien au bord du rayon).
  // surLeToit : l'obus est tombé pile sur le toit (coup direct).
  const prochesExplosion = [];
  function exploser(x, y, z, sorte, tireur, ev, monde, surLeToit) {
    Tanks.Base.exploser(x, y, z, sorte, tireur, ev, monde); // (demande 99 : sur une piste, l'explosion creuse un cratère)
    if (Tanks.Ville) Tanks.Ville.exploser(x, y, z, sorte, tireur, ev); // (livre n° 9 et 11 : les voitures, les petits objets)
    const E = S.explosions[sorte];
    if (!E || !E[0]) return;
    const [D, Ray] = E;
    for (const b of T.boitesAutour(x, z, Ray + 1, prochesExplosion)) {
      if (!b.morceaux) continue;
      const p = versMaison(b, x, z), u = p.u, v = p.v, yy = y - b.sol;
      if (Math.abs(u) > b.demiL + Ray || Math.abs(v) > b.demiP + Ray) continue;
      const tombes = [];
      let abimes = 0;
      for (const m of b.morceaux) {
        if (m.tombe) continue;
        const eu = Math.max(m.u0 - u, 0, u - m.u1), ey = Math.max(m.y0 - yy, 0, yy - m.y1), evv = Math.max(m.v0 - v, 0, v - m.v1);
        const d = Math.sqrt(eu * eu + ey * ey + evv * evv);
        if (d >= Ray) continue;
        abimes++;
        abimer(m, D * (1 - d / Ray), tombes);
      }
      if (surLeToit === b && b.toit && b.toit.intact) (b.toit.vie--), abimes++;
      if (!abimes) continue;
      b.changements++;
      if (tombes.length) {
        bilan.trous++;
        ev.push(["mur-troue", { b, nom: b.nom, type: b.type, x, y, z, sorte, tireur, morceaux: tombes, debout: b.total - b.tombes, total: b.total }]);
      }
      verifierEffondrement(b, tireur, ev, monde, sorte);
    }
  }
  // Un TANK fonce dans un mur : s'il va assez vite, le morceau (et celui d'à côté) est défoncé.
  function choc(m, c, ev, monde) {
    if (!m || m.tombe || Math.abs(c.vitesse) < S.ecraserMur) return false;
    bilan.chocs++;
    const b = m.b, tombes = [];
    abimer(m, S.degatsChoc, tombes);
    for (const col of b.colonnes) {
      const voisin = col.morceaux[0];
      if (voisin !== m && voisin.mur === m.mur && Math.abs(voisin.c - m.c) === 1) abimer(voisin, S.degatsChoc * 0.5, tombes);
    }
    b.changements++;
    if (tombes.length) {
      bilan.trous++;
      ev.push(["mur-troue", { b, nom: b.nom, type: b.type, x: c.x, y: c.y + 1, z: c.z, sorte: "char", tireur: c, morceaux: tombes, debout: b.total - b.tombes, total: b.total }]);
      verifierEffondrement(b, c, ev, monde, "char");
    }
    return tombes.length > 0;
  }

  // Quelqu'un qui arrive du ciel (en parachute, à la corde) DANS une maison encore couverte (il serait passé à travers le
  // toit !) : on le pose dehors, devant le mur le plus proche.
  const prochesSortir = [];
  function sortir(o) {
    for (const b of T.boitesAutour(o.x, o.z, 1, prochesSortir)) {
      if (!b.toit || !b.toit.intact || !dedans(b, o.x, o.z, 0.3)) continue;
      const p = versMaison(b, o.x, o.z), c = Math.cos(b.angle), s = Math.sin(b.angle);
      let u = p.u, v = p.v;
      if (b.demiL - Math.abs(u) < b.demiP - Math.abs(v)) u = Math.sign(u || 1) * (b.demiL + 1);
      else v = Math.sign(v || 1) * (b.demiP + 1);
      o.x = b.x + u * c - v * s;
      o.z = b.z + u * s + v * c;
      o.y = T.hauteur(o.x, o.z);
    }
  }

  // La maison (avec un toit) la plus proche d'un point (pour « sous le capot »).
  function plusProche(x, z, max) {
    let meilleur = null, dm = max || 1e9;
    for (const b of T.boitesAutour(x, z, max || 60, proches)) {
      if (!b.toit) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d < dm) (dm = d), (meilleur = b);
    }
    return meilleur;
  }
  // Le compte de tout : intactes, abîmées, en ruines ; morceaux debout.
  function compter() {
    const r = { maisons: 0, intactes: 0, abimees: 0, ruines: 0, ruinesDepart: 0, murets: 0, morceaux: 0, debout: 0 };
    for (const b of liste) {
      r.morceaux += b.total;
      r.debout += b.total - b.tombes;
      if (!b.toit) { r.murets++; continue; }
      r.maisons++;
      if (b.etat === "ruine") (r.ruines++, b.ruineDepart && r.ruinesDepart++);
      else if (b.tombes || b.morceaux.some((m) => m.vie < m.vieMax)) r.abimees++;
      else r.intactes++;
    }
    return r;
  }

  return { liste, pousser, pousserBoite, touche, premier, dedans, sortir, balle, exploser, choc, reinitialiser, plusProche, compter, bilan, get generation() { return generation; } };
})();
