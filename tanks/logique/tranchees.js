// 🪖 LES TRANCHÉES : le chef de section du front de 1916 (demande 115, édition « Première Guerre mondiale »)
//
// ✍️ « Première Guerre mondiale (1916) : tranchées, barbelés, boue, fusils à verrou, mitrailleuses lourdes, tanks
// losanges, biplans. » Ce fichier ne marche que dans une édition qui a des tranchées (règle « tranchees » et carte avec
// « tranchees: true ») ; en Moderne, il dort (actif = false) et ne change rien. Il s'occupe de :
//   1. LE RÉSEAU DE TRANCHÉES : pour chaque camp, une tranchée de TIR (en zigzag, avec sa banquette de tir côté ennemi,
//      la marche où l'on monte pour tirer par-dessus le parapet), une tranchée de SOUTIEN derrière, et des BOYAUX (les
//      couloirs qui les relient, vers l'arrière). Chaque tranchée est une LIGNE calculée (un « zigzag » : une vague en
//      dents de scie) : pour savoir si un point est dans une tranchée, on mesure sa distance à la ligne. Le géomètre
//      (logique/terrain.js) lui demande « de combien le sol est-il CREUSÉ ici ? » (le « creux ») : les soldats y
//      marchent 1,85 m plus bas, à l'abri ;
//   2. LES CRATÈRES d'obus du no man's land (des cuvettes rondes dans le sol) ;
//   3. LES BARBELÉS : une bande devant chaque tranchée de tir, en tronçons de 8 m. Un soldat qui marche dedans est FREINÉ
//      (il s'accroche) ; un tank qui roule dessus l'ÉCRASE ; le sapeur le COUPE avec ses cisailles (Espace tenu) ; un obus
//      du barrage qui tombe tout près le déchire aussi ;
//   4. LES MITRAILLEUSES LOURDES sur leur trépied, posées sur le parapet : des engins qui ne roulent pas. Un servant de
//      l'ordinateur tire des RAFALES sur les soldats ennemis qu'il voit ; TOI, E pour la prendre (← → ou Q D : tourner,
//      ↑ ↓ : lever et baisser, Espace : tirer ; elle CHAUFFE si tu tires trop longtemps) ;
//   5. LES VAGUES D'ASSAUT : les soldats de l'ordinateur TIENNENT leur tranchée (debout sur la banquette pour tirer,
//      accroupis sinon) ; à chaque COUP DE SIFFLET, une partie d'entre eux « monte à l'assaut » (ils sortent et
//      traversent le no man's land) et des renforts arrivent par l'arrière ;
//   6. LE BARRAGE D'ARTILLERIE : de temps en temps, chaque artillerie fait pleuvoir des obus sur le no man's land, du
//      côté de l'ennemi (on entend le sifflement avant l'explosion : à l'abri dans la tranchée, on risque moins !).
// Tout se voit sous le capot (affichage/sous-le-capot.js) : les vagues, le barrage, les barbelés coupés, les mitrailleuses.
// Ce fichier ne dessine rien (le dessin : affichage/tranchees3d.js).

window.Tanks = window.Tanks || {};

Tanks.Tranchees = (function () {
  const C = Tanks.CONFIG, VAR = (Tanks.CarteDuJour && Tanks.CarteDuJour.variante) || {};
  const actif = !!(VAR.tranchees && C.edition && C.edition.regles.tranchees && C.tranchees);
  const R = C.tranchees || {};
  // (demande 115, édition 1944) « reseau: false » : pas de tranchées, de cratères ni de barbelés, seulement les nids de
  // mitrailleuse posés aux « places » de config (derrière les haies du bocage)
  const reseau = actif && R.reseau !== false;
  const radio = Tanks.Evenements;
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  let graine = 1916;
  const hasard = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  const bilan = { lignes: 0, longueur: 0, crateres: 0, barbeles: 0, coupes: 0, ecrases: 0, dechires: 0, vagues: { bleus: 0, rouges: 0 }, montes: { bleus: 0, rouges: 0 }, renforts: { bleus: 0, rouges: 0 }, barrages: 0, obusBarrage: 0, tiennent: { bleus: 0, rouges: 0 }, assaut: { bleus: 0, rouges: 0 }, freines: 0 };

  // ------------------------------------------------------------------ 1. LE RÉSEAU DE TRANCHÉES (des lignes en zigzag)
  // tri(t) : une dent de scie entre −1 et +1, de période 1 (la forme du zigzag).
  const tri = (t) => 4 * Math.abs(t - Math.floor(t + 0.5)) - 1;
  // Une ligne : « sorte » x (elle court le long de x : z = c + A × tri((x + phase) ÷ P)) ou z (un boyau : x = c + …(z)) ;
  // [de, a] : là où elle commence et finit (le long de x, ou de z) ; « avant » : de quel côté est l'ennemi (+1 : vers z+,
  // −1 : vers z−), pour la banquette de tir (seulement les tranchées de tir).
  const lignes = [];
  function ligne(sorte, c, A, P, phase, de, a, equipe, role, avant) {
    const k = 1 / Math.sqrt(1 + Math.pow((4 * A) / P, 2)); // (on mesure la distance de travers : × cos de la pente du zigzag)
    const l = { sorte, c, A, P, phase, de: Math.min(de, a), a: Math.max(de, a), equipe, role, avant: avant || 0, k, nom: role + " " + (equipe === "bleus" ? "bleue" : "rouge") };
    lignes.push(l);
    return l;
  }
  if (reseau) {
    for (const equipe of ["bleus", "rouges"]) {
      const s = equipe === "bleus" ? 1 : -1, X = R.x;
      ligne("x", s * R.feu, R.zigzag[0], R.zigzag[1], equipe === "bleus" ? 0 : 0.5, X[0], X[1], equipe, "tranchée de tir", -s);
      ligne("x", s * R.soutien, R.zigzagSoutien[0], R.zigzagSoutien[1], 0.25, X[0] + 60, X[1] - 40, equipe, "tranchée de soutien", 0);
      for (const xb of R.boyaux) ligne("z", xb, R.zigzagBoyau[0], R.zigzagBoyau[1], 0.1, s * R.feu, s * R.arriere, equipe, "boyau", 0);
    }
  }
  bilan.lignes = lignes.length;
  // La distance (signée) d'un point à une ligne, ou null s'il est loin. u > 0 : du côté +z (ou +x pour un boyau).
  function ecart(l, x, z) {
    const le = l.sorte === "x" ? x : z, tr = l.sorte === "x" ? z : x;
    if (le < l.de - 1 || le > l.a + 1) return null;
    const d = tr - (l.c + l.A * tri((le + l.phase * l.P) / l.P));
    if (Math.abs(d) > l.A * 2 + 4) return null;
    return d * l.k;
  }
  const P = R.profil || {};
  // ✍️ LE CREUX ici (m) : 0 hors des tranchées ; dans une tranchée de tir, le fond (profondeur), la BANQUETTE côté ennemi
  // (moins profonde : on y monte pour tirer), et les parois raides jusqu'au bord.
  function creux(x, z) {
    if (!reseau || Math.abs(z) > R.arriere + 6 || x < R.x[0] - 20 || x > R.x[1] + 20) return 0;
    let h = 0;
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i], u = ecart(l, x, z);
      if (u === null) continue;
      const v = u * (l.avant || 1), a = Math.abs(u);
      if (a >= P.bord) continue;
      // (aux deux bouts, la tranchée remonte doucement : elle ne finit pas par un mur)
      const le = l.sorte === "x" ? x : z, bout = Math.min(1, Math.max(0, Math.min(le - l.de, l.a - le) / 3 + 0.4));
      let p;
      if (l.avant && v > P.marche[0] && v < P.marche[1]) p = P.banquette; // la banquette de tir
      else if (l.avant && v >= P.marche[1]) p = P.banquette * (P.bord - v) / (P.bord - P.marche[1]); // la paroi avant, au-dessus de la banquette
      else if (a <= P.fond) p = P.profondeur;
      else p = P.profondeur * (P.bord - a) / (P.bord - P.fond); // la paroi
      h = Math.max(h, p * bout);
    }
    return h;
  }
  // Dans une tranchée (plus d'un mètre de creux) ? et laquelle (la plus proche) ?
  const dansTranchee = (x, z) => creux(x, z) > 0.9;
  function ligneProche(x, z) {
    let m = null, d = Infinity;
    for (const l of lignes) {
      const u = ecart(l, x, z);
      if (u !== null && Math.abs(u) < d) (d = Math.abs(u)), (m = l);
    }
    return m && d < P.bord ? m : null;
  }

  // ------------------------------------------------------------------ 2. LES CRATÈRES (des cuvettes, dans le no man's land)
  const crateres = [], CASE = 32, casesCrateres = new Map();
  if (reseau && R.crateres) {
    const K = R.crateres;
    for (let essai = 0; crateres.length < K.nombre && essai < K.nombre * 6; essai++) {
      const derriere = hasard() < K.partDerriere, x = R.x[0] + 40 + hasard() * (R.x[1] - R.x[0] - 60);
      const z = derriere ? (hasard() < 0.5 ? 1 : -1) * (R.feu + 25 + hasard() * K.derriere) : (hasard() * 2 - 1) * K.zone;
      const r = K.rayon[0] + Math.pow(hasard(), 1.6) * (K.rayon[1] - K.rayon[0]);
      if (lignes.some((l) => { const u = ecart(l, x, z); return u !== null && Math.abs(u) < r + 3; })) continue; // (pas dans une tranchée)
      if (Math.hypot(x, z) < 60) continue; // (le village garde son sol)
      const c = { x, z, r, p: K.profondeur[0] + hasard() * (K.profondeur[1] - K.profondeur[0]) * (r / K.rayon[1]), eau: hasard() < K.eau };
      crateres.push(c);
      const i0 = Math.floor((x - r) / CASE), i1 = Math.floor((x + r) / CASE), j0 = Math.floor((z - r) / CASE), j1 = Math.floor((z + r) / CASE);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
        const k = i + ":" + j;
        if (!casesCrateres.has(k)) casesCrateres.set(k, []);
        casesCrateres.get(k).push(c);
      }
    }
  }
  bilan.crateres = crateres.length;
  // Le sol abaissé par les cratères en (x, z) (m, négatif : un creux avec un petit bourrelet de terre autour).
  function cratere(x, z) {
    if (!reseau) return 0;
    const l = casesCrateres.get(Math.floor(x / CASE) + ":" + Math.floor(z / CASE));
    if (!l) return 0;
    let h = 0;
    for (const c of l) {
      const d = Math.hypot(x - c.x, z - c.z) / c.r;
      if (d < 1) h = Math.min(h, -c.p * Math.pow(1 - d * d, 1.6));
      else if (d < 1.35) h += 0.18 * c.p * Math.sin(((d - 1) / 0.35) * Math.PI); // le bourrelet
    }
    return h;
  }

  // ------------------------------------------------------------------ 3. LES BARBELÉS (des tronçons de 8 m)
  const barbeles = []; // { equipe, z, x0, x1, segments: [{ x0, x1, z, coupe, par }] }
  if (reseau && R.barbeles) {
    const B = R.barbeles;
    for (const equipe of ["bleus", "rouges"]) {
      const s = equipe === "bleus" ? 1 : -1;
      for (const devant of B.rangs) {
        const z = s * (R.feu - devant), b = { equipe, z, segments: [] };
        for (let x = R.x[0] + 20; x < R.x[1] - 10; x += B.segment) {
          if (crateres.some((c) => Math.abs(c.z - z) < c.r * 0.7 && x + B.segment > c.x - c.r * 0.7 && x < c.x + c.r * 0.7)) continue; // (un cratère l'a déjà emporté)
          b.segments.push({ x0: x, x1: x + B.segment, z: z + (hasard() - 0.5) * 1.6, coupe: false, par: null });
        }
        barbeles.push(b);
      }
    }
  }
  bilan.barbeles = barbeles.reduce((t, b) => t + b.segments.length, 0);
  let versionBarbeles = 0; // (augmente à chaque tronçon coupé : le dessin se met à jour)
  // Le tronçon de barbelés sous (x, z), à moins de « marge » m (ou null)
  function segmentIci(x, z, marge) {
    for (const b of barbeles) {
      if (Math.abs(z - b.z) > marge + 1.2) continue;
      for (const g of b.segments) if (!g.coupe && x > g.x0 - marge && x < g.x1 + marge && Math.abs(z - g.z) < marge + R.barbeles.largeur / 2) return g;
    }
    return null;
  }
  function couperSegment(g, par, comment, ev) {
    if (g.coupe) return;
    g.coupe = true;
    g.par = par;
    versionBarbeles++;
    bilan[comment === "cisailles" ? "coupes" : comment === "tank" ? "ecrases" : "dechires"]++;
    ev.push(["barbele-coupe", { x: (g.x0 + g.x1) / 2, z: g.z, comment, par, longueur: R.barbeles.segment, restent: bilan.barbeles - bilan.coupes - bilan.ecrases - bilan.dechires }]);
  }
  // ✍️ FREINÉ dans les barbelés : × la vitesse d'un soldat (1 = pas de barbelés)
  function frein(s) {
    if (!barbeles.length || s.dansUnEngin || s.mort || Math.abs(Math.abs(s.z) - (R.feu - R.barbeles.rangs[0])) > 12) return 1;
    const g = segmentIci(s.x, s.z, 0);
    if (!g) return (s.accroche = false), 1;
    if (!s.accroche) bilan.freines++;
    s.accroche = true;
    return R.barbeles.frein;
  }
  // ✍️ LES CISAILLES du sapeur (logique/gadgets.js lui passe la main) : Espace tenu devant un barbelé
  function couper(s, intentions, dt, monde, ev) {
    const g = s.gadget, F = g.fiche;
    g.cible = null;
    if (!intentions.tirer) return void (g.progres = 0);
    const x = s.x + Math.cos(s.angle) * 1.2, z = s.z + Math.sin(s.angle) * 1.2, seg = segmentIci(x, z, F.distance - 1.2);
    if (!seg) return void (g.attente === 0 && (ev.push(["impossible", { raison: "aucun barbelé devant toi (moins de " + F.distance + " m)" }]), (g.attente = 1.5)));
    g.cible = seg;
    g.progres = (g.cible === g.dernier ? g.progres || 0 : 0) + dt / F.duree;
    g.dernier = seg;
    if (g.progres >= 1) {
      g.progres = 0;
      couperSegment(seg, s.nom === "toi" ? "toi" : s.nom, "cisailles", ev);
      // (on coupe un passage : le tronçon d'à côté aussi, s'il est dans la même rangée et tout près)
      for (const b of barbeles) for (const o of b.segments) if (!o.coupe && o !== seg && Math.abs(o.z - seg.z) < 3 && (Math.abs(o.x0 - seg.x1) < 0.5 || Math.abs(o.x1 - seg.x0) < 0.5) && Math.random() < 0.5) couperSegment(o, s.nom === "toi" ? "toi" : s.nom, "cisailles", ev);
    }
  }

  // ------------------------------------------------------------------ 4. LES MITRAILLEUSES LOURDES (sur le parapet)
  const M = R.mitrailleuses || {};
  // la place d'une mitrailleuse : sur la banquette de la tranchée de tir, contre le parapet, le canon vers l'ennemi
  function poste(equipe, x, enAvant) {
    const l = lignes.find((q) => q.equipe === equipe && q.avant);
    const zl = l.c + l.A * tri((x + l.phase * l.P) / l.P);
    return { x, z: zl + l.avant * (enAvant / l.k), angle: l.avant > 0 ? Math.PI / 2 : -Math.PI / 2 };
  }
  function creerMitrailleuses() {
    const liste = [];
    if (!actif) return liste;
    let n = 0;
    const places = M.places ? M.places.map(([x, z, angle, equipe]) => ({ x, z, angle, equipe })) : [];
    if (!M.places) for (const equipe of ["bleus", "rouges"]) for (const x of M.x) places.push(Object.assign({ equipe }, poste(equipe, equipe === "bleus" ? x : -x * 0.9 + 30, P.bord + 0.35)));
    for (const p of places) {
      const equipe = p.equipe; // (1916 : sur le parapet, devant la banquette ; 1944 : aux places de config.js)
      liste.push({
        genre: "mitrailleuse", sorte: "mitrailleuse", equipe, nom: (M.nom || "Mitrailleuse lourde") + " " + (equipe === "bleus" ? "bleue" : "rouge") + " n° " + ++n,
        fiche: { longueur: 1.6, largeur: 0, hauteur: 1.2, rayon: 1.2, vie: 99 }, x: p.x, z: p.z, y: Tanks.Terrain.hauteurExacte(p.x, p.z) - M.enfonce, angle: p.angle, base: p.angle,
        tourelle: 0, hausse: 0, vitesse: 0, vie: 99, detruit: false, touche: 9, pilote: false, recharge: 0, chaleur: 0, enrayee: 0, tirs: 0, reussis: 0,
        servant: { etat: "guette", pense: hasard() * 0.3, cible: null, rafale: 0, pause: 0, pris: 0 },
      });
    }
    return liste;
  }
  const prochesMg = [];
  // Un pas d'une mitrailleuse : TOI (intentions) ou son servant (l'ordinateur)
  function avancerMitrailleuse(e, I, dt, monde, ev) {
    e.recharge = Math.max(0, e.recharge - dt);
    e.chaleur = Math.max(0, e.chaleur - dt * M.refroidit);
    e.enrayee = Math.max(0, e.enrayee - dt);
    e.feu = Math.max(0, (e.feu || 0) - dt);
    e.y = Tanks.Terrain.hauteurExacte(e.x, e.z) - M.enfonce; // (posée sur le parapet, un peu enfoncée dans les sacs de sable)
    if (e.pilote) {
      const tourne = ((I.droite || I.tourelleDroite ? 1 : 0) - (I.gauche || I.tourelleGauche ? 1 : 0)) * M.rotation * dt;
      e.tourelle = Math.max(-M.cone, Math.min(M.cone, e.tourelle + tourne));
      e.hausse = Math.max(-0.12, Math.min(0.3, e.hausse + ((I.avancer ? 1 : 0) - (I.reculer ? 1 : 0)) * M.levee * dt));
      e.servant.etat = "TOI";
      if (I.tirer) tirerMitrailleuse(e, e.angle + e.tourelle, 0, monde, ev, true);
      return;
    }
    // le servant de l'ordinateur
    const S = e.servant;
    S.pris = Math.max(0, S.pris - dt);
    if (S.pris > 0) return void (S.etat = "😶 silencieuse (servant à terre, un autre arrive dans " + Math.ceil(S.pris) + " s)");
    S.pense -= dt;
    if (S.pense <= 0) {
      S.pense = M.pense;
      // un ennemi tout près (dans la tranchée) ? le servant tombe : elle se tait un moment
      for (const o of Tanks.Grille.chercher(monde.grilleSoldats, e.x, e.z, M.prise, prochesMg)) {
        if (o.mort || o.equipe === e.equipe || Math.hypot(o.x - e.x, o.z - e.z) > M.prise) continue;
        S.pris = M.retour;
        S.cible = null;
        ev.push(["mitrailleuse-prise", { nom: e.nom, equipe: e.equipe, par: o.nom === "toi" ? "toi" : o.nom, retour: M.retour }]);
        return;
      }
      // la cible : le soldat ennemi visible le plus proche dans son secteur de tir
      let m = null, dm = M.portee;
      for (const o of monde.soldats) {
        if (o.mort || o.dansUnEngin || o.equipe === e.equipe || o.parachute) continue;
        const d = Math.hypot(o.x - e.x, o.z - e.z);
        if (d > dm || Math.abs(angleEntre(Math.atan2(o.z - e.z, o.x - e.x) - e.base)) > M.cone) continue;
        if (!Tanks.Terrain.vueLibre(e.x, e.y + 0.9, e.z, o.x, o.y + Tanks.Soldat.hauteurVisee(o), o.z)) continue;
        (m = o), (dm = d);
      }
      if (m !== S.cible && m) ev.push(["mitrailleuse-cible", { nom: e.nom, equipe: e.equipe, cible: m.nom === "toi" ? "toi" : m.nom, distance: Math.round(dm) }]);
      S.cible = m;
    }
    const c = S.cible && !S.cible.mort ? S.cible : null;
    if (!c) return void (S.etat = "👀 guette son secteur (± " + Math.round((M.cone * 180) / Math.PI) + "°)");
    // il tourne la mitrailleuse vers la cible (lourde : pas trop vite), puis tire des rafales
    const voulu = angleEntre(Math.atan2(c.z - e.z, c.x - e.x) - e.base), diff = voulu - e.tourelle;
    e.tourelle += Math.max(-M.rotation * 0.7 * dt, Math.min(M.rotation * 0.7 * dt, diff));
    S.pause = Math.max(0, S.pause - dt);
    if (S.pause > 0) return void (S.etat = "⏸️ entre deux rafales, sur " + c.nom);
    if (Math.abs(diff) > 0.05) return void (S.etat = "↪️ tourne vers " + c.nom);
    S.etat = "🔥 RAFALE sur " + c.nom + " (" + Math.round(Math.hypot(c.x - e.x, c.z - e.z)) + " m)";
    if (tirerMitrailleuse(e, e.angle + e.tourelle + (Math.random() - 0.5) * M.erreur, 0, monde, ev, false) && ++S.rafale >= M.rafale) (S.rafale = 0), (S.pause = M.pause[0] + Math.random() * (M.pause[1] - M.pause[0]));
  }
  function tirerMitrailleuse(e, angle, hausse, monde, ev, toi) {
    if (e.recharge > 0 || e.enrayee > 0) return false;
    e.recharge = toi ? M.cadence : M.cadenceIA;
    e.tirs++;
    e.feu = 0.06;
    if (toi) {
      e.chaleur += M.chauffe;
      if (e.chaleur >= 1) (e.enrayee = M.enrayage), (e.chaleur = 0.6), ev.push(["mitrailleuse-chaude", { nom: e.nom, duree: M.enrayage }]);
    }
    const ca = Math.cos(angle), sa = Math.sin(angle);
    Tanks.Soldat.balle(e, e.x + ca * 1.1, e.y + 0.95, e.z + sa * 1.1, angle, "mitrailleuse", monde.soldats, Tanks.Soldat.vehiculesDe(monde), ev, Tanks.Vehicules.legers(monde));
    return true;
  }

  // ------------------------------------------------------------------ 5. LES VAGUES D'ASSAUT
  const V = R.vagues || {}, B = R.barrage || {};
  // Les places sur la banquette de tir de chaque camp (pour les soldats qui TIENNENT la tranchée)
  function postes(equipe, n) {
    const liste = [], x0 = V.front[0], x1 = V.front[1];
    for (let k = 0; k < n; k++) {
      const x = x0 + ((k + 0.5) / n) * (x1 - x0) + (hasard() - 0.5) * 3;
      liste.push(poste(equipe, x, (P.marche[0] + P.marche[1]) / 2));
    }
    return liste;
  }
  const etat = { vague: { bleus: 0, rouges: 0 }, chrono: { bleus: 0, rouges: 0 }, barrage: null, prochainBarrage: 0, campBarrage: "rouges", nVague: { bleus: 0, rouges: 0 } };
  // Au début de la bataille : chaque soldat de l'ordinateur prend sa place sur la banquette ; TOI, à pied dans ta tranchée.
  function installer(monde) {
    if (!reseau) return; // (sans tranchées : chacun part de son camp, comme en Moderne)
    for (const k of ["vagues", "montes", "renforts", "tiennent", "assaut"]) bilan[k] = { bleus: 0, rouges: 0 };
    for (const k of ["coupes", "ecrases", "dechires", "barrages", "obusBarrage", "freines"]) bilan[k] = 0;
    for (const b of barbeles) for (const g of b.segments) (g.coupe = false), (g.par = null);
    versionBarbeles++;
    for (const equipe of ["bleus", "rouges"]) {
      const l = monde.soldats.filter((s) => s.equipe === equipe && !s.joueur && s.ia), places = postes(equipe, l.length);
      l.forEach((s, i) => tenir(s, places[i]));
      etat.chrono[equipe] = 0;
      etat.vague[equipe] = V.premier + (equipe === "rouges" ? V.decalage : 0);
      etat.nVague[equipe] = 0;
    }
    etat.barrage = null;
    etat.prochainBarrage = B.premier;
    etat.campBarrage = "rouges";
    if (C.edition.regles.departAPied && monde.toi && monde.toi.soldat) {
      const toi = monde.toi.soldat, p = poste("bleus", V.toi, (P.marche[0] + P.marche[1]) / 2 - 0.15);
      Object.assign(toi, { x: p.x, z: p.z, angle: p.angle, dansUnEngin: null, vitesse: 0 });
      toi.y = Tanks.Terrain.hauteur(toi.x, toi.z);
      monde.toi = { mode: "pied", engin: null, soldat: toi };
    }
  }
  function tenir(s, p) {
    Object.assign(s, { x: p.x, z: p.z, angle: p.angle });
    s.y = Tanks.Terrain.hauteur(s.x, s.z);
    s.ia.vague = "tient";
    s.ia.poste = p;
  }
  const versEnnemi = (equipe) => (equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2);
  // Les intentions d'un soldat qui TIENT la tranchée : il reste à son poste (debout pour tirer, accroupi sinon).
  function retoucher(s, monde, I) {
    if (!actif || !s.ia || s.ia.vague !== "tient" || s.ordre || I.grenade || I.descendre) return I;
    const p = s.ia.poste, d = Math.hypot(p.x - s.x, p.z - s.z);
    if (I.secours) return I;
    if (d > 1.4) { // (poussé hors de sa place : il y retourne)
      I.versAngle = Math.atan2(p.z - s.z, p.x - s.x);
      I.avancer = true;
      I.direction = undefined;
      I.accroupi = false;
      I.tirer = false;
      s.ia.etat = "🪖 retourne à son poste dans la tranchée";
      return I;
    }
    I.avancer = false;
    I.direction = undefined;
    I.lent = false;
    if (I.cible || I.tirer) {
      I.accroupi = false; // (debout sur la banquette : il tire par-dessus le parapet)
      s.ia.etat = "🪖 tient la tranchée · tire par-dessus le parapet" + (I.cible ? " sur " + I.cible.nom : "");
    } else {
      I.accroupi = true; // (à l'abri sous le parapet)
      I.versAngle = versEnnemi(s.equipe) + Math.sin(monde.temps * 0.3 + s.x) * 0.3;
      s.ia.etat = "🪖 tient la tranchée · à l'abri sous le parapet";
    }
    s.ia.tactique = "tient la tranchée";
    return I;
  }

  // ------------------------------------------------------------------ 6. LE PAS : vagues, renforts, barrage, tanks sur les barbelés
  const ARTILLERIE = { bleus: { nom: "l'artillerie de " + C.equipes.bleus.nom, equipe: "bleus", genre: "artillerie", reussis: 0, x: 0, z: 900 }, rouges: { nom: "l'artillerie de " + C.equipes.rouges.nom, equipe: "rouges", genre: "artillerie", reussis: 0, x: 0, z: -900 } };
  function etape(monde, dt) {
    const ev = [];
    if (!reseau || monde.phase !== "bataille" || monde.metro) return ev;
    const T = Tanks.Terrain;
    // a) LES VAGUES : au coup de sifflet, une partie de ceux qui tiennent la tranchée monte à l'assaut ; des renforts arrivent
    for (const equipe of ["bleus", "rouges"]) {
      etat.chrono[equipe] += dt;
      const tiennent = monde.soldats.filter((s) => s.equipe === equipe && !s.mort && s.ia && s.ia.vague === "tient");
      bilan.tiennent[equipe] = tiennent.length;
      bilan.assaut[equipe] = monde.soldats.filter((s) => s.equipe === equipe && !s.mort && s.ia && s.ia.vague === "assaut").length;
      if (etat.chrono[equipe] < etat.vague[equipe]) continue;
      etat.chrono[equipe] = 0;
      etat.vague[equipe] = V.toutesLes * (0.85 + Math.random() * 0.3);
      if (!C.edition.regles.vagues) continue;
      const n = Math.max(1, Math.round(tiennent.length * V.part));
      const montent = tiennent.sort(() => Math.random() - 0.5).slice(0, n);
      for (const s of montent) (s.ia.vague = "assaut"), (s.ia.etat = "🎺 monte à l'assaut !"), (s.ia.couloir = s.x * 1.1);
      // des renforts par les boyaux : ils reprennent les places libres sur la banquette
      const place = Tanks.Troupes.place(monde, equipe), k = Math.min(place, V.renforts);
      const libres = postes(equipe, k + 2);
      for (let i = 0; i < k; i++) {
        const p = libres[i], s = Tanks.Troupes.recrue(equipe, p.x, p.z, p.angle, "renfort " + (equipe === "bleus" ? "bleu" : "rouge") + " n° " + ++bilan.renforts[equipe]);
        tenir(s, p);
        monde.soldats.push(s);
      }
      bilan.vagues[equipe]++;
      bilan.montes[equipe] += montent.length;
      etat.nVague[equipe]++;
      ev.push(["coup-de-sifflet", { equipe, nom: C.equipes[equipe].nom, vague: etat.nVague[equipe], soldats: montent.length, renforts: k, x: montent[0] ? montent[0].x : 0, z: equipe === "bleus" ? R.feu : -R.feu }]);
    }
    // b) LE BARRAGE D'ARTILLERIE : chaque camp à son tour fait pleuvoir des obus sur le no man's land, côté ennemi
    if (C.edition.regles.barrage) {
      etat.prochainBarrage -= dt;
      if (!etat.barrage && etat.prochainBarrage <= 0) {
        const camp = etat.campBarrage;
        etat.campBarrage = camp === "rouges" ? "bleus" : "rouges";
        etat.barrage = { camp, reste: B.obus, chrono: 0, duree: B.duree };
        bilan.barrages++;
        ev.push(["barrage", { camp, nom: ARTILLERIE[camp].nom, obus: B.obus, duree: B.duree, debut: true }]);
      }
      const b = etat.barrage;
      if (b) {
        b.chrono += dt;
        while (b.reste > 0 && b.chrono >= (B.obus - b.reste) * (b.duree / B.obus)) {
          b.reste--;
          // où tombe l'obus : le plus souvent près des soldats ennemis dans le no man's land, sinon au hasard dans la moitié ennemie
          const cibles = monde.soldats.filter((s) => !s.mort && s.equipe !== b.camp && Math.abs(s.z) < B.zone + 25);
          const s = cibles.length && Math.random() < B.vise ? cibles[Math.floor(Math.random() * cibles.length)] : null;
          const cote = b.camp === "rouges" ? 1 : -1;
          const x = s ? s.x + (Math.random() - 0.5) * B.ecart * 2 : R.x[0] + 100 + Math.random() * (R.x[1] - R.x[0] - 150);
          const z = s ? s.z + (Math.random() - 0.5) * B.ecart * 2 : cote * Math.random() * B.zone;
          const y = T.hauteur(x, z) + B.hauteur;
          Tanks.Obus.lancer(monde.obus, ARTILLERIE[b.camp], "barrage", { x, y, z }, { x: 0, y: -1, z: 0 }, null);
          bilan.obusBarrage++;
          ev.push(["obus-siffle", { x, z, camp: b.camp, arrive: B.hauteur / C.projectiles.barrage.vitesse }]);
        }
        if (b.reste <= 0 && b.chrono > b.duree + 2) {
          ev.push(["barrage", { camp: b.camp, nom: ARTILLERIE[b.camp].nom, obus: B.obus, fin: true }]);
          etat.barrage = null;
          etat.prochainBarrage = B.toutesLes * (0.8 + Math.random() * 0.4);
        }
      }
    }
    // c) les TANKS écrasent les barbelés sur lesquels ils roulent
    for (const c of monde.chars) {
      if (c.detruit || Math.abs(c.vitesse || 0) < 0.3 || Math.abs(Math.abs(c.z) - (R.feu - R.barbeles.rangs[0])) > 14) continue;
      const g = segmentIci(c.x, c.z, 1.5);
      if (g) couperSegment(g, c.nom === "toi" ? "toi" : c.nom, "tank", ev);
    }
    return ev;
  }
  // (un obus du barrage, une grenade, un obus de tank qui explose tout près d'un barbelé le déchire : monde.js appelle ceci)
  function explosion(x, z, sorte, ev) {
    if (!barbeles.length || Math.abs(Math.abs(z) - (R.feu - R.barbeles.rangs[0])) > 16) return;
    const r = sorte === "barrage" || sorte === "bombe" ? B.rayonCoupe : sorte === "obus" || sorte === "c4" ? B.rayonCoupe * 0.7 : 0;
    if (!r) return;
    for (const b of barbeles) for (const g of b.segments) if (!g.coupe && Math.abs(g.z - z) < r && x > g.x0 - r && x < g.x1 + r) couperSegment(g, "l'explosion", "obus", ev);
  }
  // ✍️ À L'ABRI dans la tranchée : × la chance d'être touché par une balle (tiré de loin, d'en dehors de la tranchée)
  function abrite(cible, x, z) {
    if (!actif || cible.genre === "vehicule" || cible.sorte) return false;
    const c = creux(cible.x, cible.z);
    return c > 0.9 && Math.hypot(cible.x - x, cible.z - z) > 6 && creux(x, z) < 0.9;
  }

  return { actif, reseau, lignes, ecart, tri, creux, cratere, crateres, dansTranchee, ligneProche, barbeles, get versionBarbeles() { return versionBarbeles; }, frein, couper, creerMitrailleuses, avancerMitrailleuse, installer, retoucher, etape, explosion, abrite, poste, etat, bilan, R, P };
})();
