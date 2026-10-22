// 🎬 LA CINÉMATIQUE : le réalisateur du film (demande 101)
//
// ✍️ « Quand tu commences la campagne, tu as la cinématique qui explique ce qui se passe. La caméra montre une ville
// dévastée avec des soldats ennemis et ton escadron. Ils avancent doucement en se méfiant. Certains se tournent,
// certains tournent de droite à gauche rapidement, avec leur arme pointée. Le commandant prend la parole et explique
// la mission. Après, la caméra se place derrière ton personnage et tu es sur ton personnage. »
// Comme un réalisateur sur un tournage, ce fichier suit le SCÉNARIO d'un film (config.js : cinematiques.films) :
//   1. le CHRONOMÈTRE du film avance (à chaque petit pas du jeu) ; le film est découpé en PLANS (un plan = un morceau
//      filmé d'une seule façon) : il sait toujours quel plan tourne (« plan 4 / 10 ») ;
//   2. il dirige les ACTEURS : ce sont de VRAIS soldats du monde (ton escouade, des ennemis, toi), qu'il fait marcher le
//      long d'un chemin, en formation, prudemment : l'arme levée, certains s'arrêtent et se retournent, d'autres
//      balaient de droite à gauche très vite en visant, s'accroupissent, ou font signe d'avancer (le bras en avant) ;
//   3. il donne la parole : chaque RÉPLIQUE (qui parle, le texte, combien de temps) part à la radio du jeu ;
//   4. à la fin (ou si tu appuies sur Entrée ou Échap pour passer), il rend les soldats à leur vie normale et passe la
//      main à celui qui a lancé le film (la campagne : « et maintenant, la mission commence ! »).
// (demande 101, morceau 2) Les FIGURANTS : pour les films de fin de mission, on ne compte pas sur les soldats qui restent
// (ton soldat est peut-être à terre, les ennemis tous partis…) : le réalisateur engage des soldats et des chars rien que
// pour le film (« prendre: "figurants" » ou « "chars" »), et ils repartent à la fin. Ils peuvent aussi CÉLÉBRER
// (sauter, lever le bras) ; un char « épave » est une carcasse qui brûle.
// (demande 101, morceau 3) La BANDE-ANNONCE : des figurants volants aussi (« prendre: "engins" » : l'hélico Tigre, le
// Chinook, le Black Hawk, l'avion de chasse…) qui suivent un chemin à une hauteur donnée (« hauteurs »), qui roulent
// sur la piste puis décollent ; des EXPLOSIONS commandées (action « explose ») ; un tireur d'élite avec sa vraie arme
// (« armeId »). La base aérienne est montrée même au garage (« bases: true »), puis tout est rangé comme avant.
// Pendant le film, le monde est en phase "cinematique" : la bataille est FIGÉE (personne ne tire, personne n'est
// blessé, l'ordinateur ne réfléchit pas) ; seuls les acteurs bougent, et seulement comme le scénario le dit.
// Ce fichier ne dessine rien : la caméra de cinéma, les bandes noires, les sous-titres et la voix sont faits par
// affichage/cinematique.js, qui lit « monde.cinematique » et écoute la radio du jeu (« cinematique-… »).

window.Tanks = window.Tanks || {};

Tanks.Cinematique = (function () {
  const C = Tanks.CONFIG, F = C.cinematiques, R = F.regles, T = Tanks.Terrain, radio = Tanks.Evenements;
  let hasardEtat = 101;
  const hasard = () => ((hasardEtat = (hasardEtat * 1664525 + 1013904223) >>> 0) / 4294967296);
  const angleEntre = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const film = (id) => (F.films && F.films[id]) || null;

  // ------------------------------------------------------------------ le scénario « à plat »
  // Les plans se suivent : chacun commence quand le précédent finit. Les répliques et les actions d'un plan sont
  // écrites « a » secondes après le début de SON plan : on les range toutes sur une seule ligne du temps.
  function aPlat(f) {
    const debuts = [];
    let t = 0;
    const actions = (f.actions || []).map((a) => Object.assign({}, a));
    const repliques = (f.repliques || []).map((r) => Object.assign({}, r));
    for (const p of f.plans) {
      debuts.push(t);
      for (const a of p.actions || []) actions.push(Object.assign({}, a, { a: t + (a.a || 0) }));
      for (const r of p.repliques || []) repliques.push(Object.assign({}, r, { a: t + (r.a || 0) }));
      t += p.duree;
    }
    actions.sort((x, y) => x.a - y.a);
    repliques.sort((x, y) => x.a - y.a);
    for (const r of repliques) if (!r.duree) r.duree = Math.min(R.replique.max, R.replique.base + r.texte.length * R.replique.parLettre);
    return { debuts, duree: t, actions, repliques };
  }

  // ------------------------------------------------------------------ choisir les acteurs
  // Les soldats d'un camp (debout, pas toi), du plus proche au plus loin d'un point.
  function prendre(monde, g, deja) {
    if (g.prendre === "toi") return monde.toi && monde.toi.soldat && monde.toi.mode === "pied" && !monde.toi.soldat.mort ? [monde.toi.soldat] : [];
    if (g.prendre === "figurants" || g.prendre === "chars" || g.prendre === "engins") return engager(monde, g);
    const equipe = g.prendre === "ennemis" ? "rouges" : "bleus", p = g.proches || (g.chemin && g.chemin[0]) || [0, 0];
    const libres = monde.soldats.filter((s) => s.equipe === equipe && !s.joueur && !s.mort && !s.dansUnEngin && !s.parachute && !s.corde && !deja.has(s));
    libres.sort((a, b) => Math.hypot(a.x - p[0], a.z - p[1]) - Math.hypot(b.x - p[0], b.z - p[1]));
    return g.nombre ? libres.slice(0, g.nombre) : libres;
  }
  // (morceau 2) Engager des FIGURANTS : des soldats (ou des chars) tout neufs, rien que pour le film. Ils sont rangés
  // avec les autres (pour être dessinés comme eux), marqués « figurant », et enlevés à la fin du film.
  function engager(monde, g) {
    const equipe = g.camp || "bleus", n = g.nombre || (g.places ? g.places.length : 6), p0 = (g.chemin && g.chemin[0]) || [0, 0], l = [];
    if (g.prendre === "engins") {
      // (morceau 3) les engins de ton camp, tout neufs (garés à la base), de ces sortes-là
      const tous = Tanks.Engins.creer(), l2 = [];
      for (const sorte of g.sortes || []) {
        const e = tous.find((x) => x.sorte === sorte && !l2.includes(x));
        if (!e) continue;
        Object.assign(e, { figurant: true, pilote: true, vitesse: 0, rotor: 0, av: null, equipe: e.equipe || "bleus" });
        if (e.y === undefined) e.y = T.hauteur(e.x, e.z);
        monde.engins.push(e);
        l2.push(e);
      }
      return l2;
    }
    for (let k = 0; k < n; k++) {
      const pl = g.places && g.places[k], x = pl ? pl[0] : p0[0], z = pl ? pl[1] : p0[1], angle = pl && pl[2] !== undefined ? pl[2] : 0;
      let o;
      if (g.prendre === "chars") {
        o = Tanks.Char.creer(C.chars[(k + (equipe === "rouges" ? 1 : 0)) % C.chars.length], equipe, { x, z, angle }, (g.nom || "Char") + " " + (k + 1));
        Tanks.IA.preparer(o);
        if (g.epave) (o.detruit = true), (o.vie = 0), (o.depuisDetruit = 30);
        o.tourelle = g.epave ? (k % 2 ? 0.7 : -0.5) : 0;
        monde.chars.push(o);
      } else {
        o = Tanks.Soldat.creer(equipe, x, z, angle, (equipe === "bleus" ? "Lion " : "soldat du Front ") + (k + 1));
        if (k % 5 === 3) o.arme = "roquettes";
        if (g.armeId && C.armesPrincipales[g.armeId]) {
          // (morceau 3) une vraie arme de l'armurerie (le tireur d'élite et son fusil à lunette), avec ses pièces d'origine
          const pieces = {};
          for (const emp in C.atelier) pieces[emp] = C.atelier[emp].pieces[0].id;
          o.armes = { principale: { id: g.armeId, pieces } };
          o.arme = "principale";
        }
        monde.soldats.push(o);
      }
      o.figurant = true;
      o.av = null;
      l.push(o);
    }
    return l;
  }
  // Un chemin : ses morceaux et sa longueur (pour trouver le point qui est à « d » mètres du départ).
  function preparerChemin(points) {
    const pts = points.map((p) => ({ x: p[0], z: p[1] })), longueurs = [0];
    for (let i = 1; i < pts.length; i++) longueurs.push(longueurs[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
    return { pts, longueurs, total: longueurs[longueurs.length - 1] };
  }
  // Le point à « d » mètres le long du chemin, et la direction du chemin à cet endroit (le « cap »).
  function surChemin(ch, d) {
    const L = ch.longueurs, P = ch.pts;
    if (P.length === 1) return { x: P[0].x, z: P[0].z, cap: 0 };
    if (d < 0) {
      // (avant le début du chemin : on le prolonge en arrière, pour que les derniers de la colonne aient leur place)
      const cap = Math.atan2(P[1].z - P[0].z, P[1].x - P[0].x);
      return { x: P[0].x + Math.cos(cap) * d, z: P[0].z + Math.sin(cap) * d, cap };
    }
    d = Math.min(ch.total, d);
    let i = 1;
    while (i < P.length - 1 && L[i] < d) i++;
    const a = P[i - 1], b = P[i], k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, cap: Math.atan2(b.z - a.z, b.x - a.x) };
  }
  // La place de chaque soldat dans la formation : « colonne » (2 files l'une derrière l'autre), « ligne » (côte à côte),
  // « coin » (en V, le chef devant). [en arrière (m), sur le côté (m)].
  function place(g, rang) {
    const e = g.ecart || 2.6;
    if (g.formation === "ligne") return [0, (rang - (g.membres.length - 1) / 2) * e];
    if (g.formation === "coin") return rang === 0 ? [0, 0] : [Math.ceil(rang / 2) * e * 0.8, (rang % 2 ? -1 : 1) * Math.ceil(rang / 2) * e * 0.7];
    return rang === 0 ? [0, 0] : [Math.ceil(rang / 2) * e, (rang % 2 ? -1 : 1) * (g.largeur || 1.4)]; // (colonne : le chef devant, puis 2 files)
  }

  // ------------------------------------------------------------------ lancer, arrêter
  // options : { pour : qui l'a demandé ("campagne"…), alaFin(monde, passee) : ce qui se passe après le film }
  function lancer(monde, id, options) {
    const f = film(id);
    if (!f || !f.plans || !f.plans.length) return false;
    if (monde.cinematique) arreter(monde);
    const o = options || {}, plat = aPlat(f);
    const etat = {
      id, titre: f.titre || id, pour: o.pour || "", alaFin: o.alaFin || null, t: 0, duree: plat.duree, plan: 0, plans: f.plans.length,
      debuts: plat.debuts, actions: plat.actions, repliques: plat.repliques, prochaineAction: 0, prochaineReplique: 0,
      replique: null, dites: 0, groupes: {}, acteurs: [], phaseAvant: monde.phase, passable: f.passable !== false,
    };
    // (morceau 3) « bases: true » : la base aérienne est montrée même au garage (on la rend à la fin)
    if (f.bases && !(monde.bases && monde.bases.length)) (etat.basesAvant = monde.bases || []), (monde.bases = Tanks.Base.creer());
    // les acteurs : chaque groupe prend ses soldats, les place au début de son chemin, en formation
    const deja = new Set();
    for (const g0 of f.acteurs || []) {
      const g = Object.assign({}, g0, { membres: [], chemin: preparerChemin(g0.chemin || [g0.proches || [0, 0]]), avance: 0, enMarche: (g0.depart || 0) <= 0, arrete: false });
      const soldats = prendre(monde, g0, deja);
      // « avecToi » : ton soldat marche dans ce groupe, à ce rang (s'il est à pied)
      if (g0.avecToi !== undefined && monde.toi && monde.toi.mode === "pied" && monde.toi.soldat && !monde.toi.soldat.mort && !deja.has(monde.toi.soldat)) soldats.splice(Math.min(g0.avecToi, soldats.length), 0, monde.toi.soldat);
      soldats.forEach((s, rang) => {
        deja.add(s);
        const a = { s, groupe: g.id, rang, role: rang === 0 && g.chef ? "chef" : "", qui: rang === 0 && g.chef ? g.chef : "", avant: { x: s.x, z: s.z, angle: s.angle, accroupi: s.accroupi, visee: s.visee || 0, vitesse: s.vitesse },
          geste: null, gesteDans: 1.5 + hasard() * 3, voulu: s.angle, tourne: R.tourne, arme: g.arme !== "basse", halte: false, regard: null, cap: 0 };
        g.membres.push(a);
        etat.acteurs.push(a);
      });
      // au départ : chacun à sa place dans la formation (sauf « surPlace » : ils partent d'où ils sont)
      if (!g.surPlace && !g.places) for (const a of g.membres) poserEnFormation(g, a);
      else if (g.places) for (const a of g.membres) a.halte = true; // (des places fixes : ils restent où le scénario les a mis)
      etat.groupes[g.id] = g;
    }
    monde.cinematique = etat;
    monde.phase = "cinematique";
    radio.emettre("cinematique-debut", { id, titre: etat.titre, duree: etat.duree, plans: etat.plans, acteurs: etat.acteurs.length, groupes: Object.keys(etat.groupes).map((k) => k + " (" + etat.groupes[k].membres.length + ")"), pour: etat.pour });
    radio.emettre("cinematique-plan", { numero: 1, total: etat.plans, nom: f.plans[0].nom || "", camera: (f.plans[0].camera || {}).type || "fixe", t: 0 });
    return true;
  }
  function poserEnFormation(g, a) {
    const s = a.s, [arriere, cote] = place(g, a.rang), p = surChemin(g.chemin, g.avance - arriere);
    s.x = p.x - Math.sin(p.cap) * cote;
    s.z = p.z + Math.cos(p.cap) * cote;
    if (s.genre === "soldat") T.repousser(s, 0.45);
    s.y = T.hauteur(s.x, s.z);
    s.angle = a.voulu = p.cap;
    a.cap = p.cap;
    s.av = null; // (le dessin ne doit pas glisser depuis l'ancienne place)
  }
  // Rendre les soldats à leur vie normale (les ennemis reviennent à leur poste : on les avait « empruntés »).
  function rendre(monde, etat) {
    // les figurants repartent (ils n'étaient là que pour le film)
    if (etat.acteurs.some((a) => a.s.figurant)) {
      monde.soldats = monde.soldats.filter((s) => !s.figurant);
      monde.chars = monde.chars.filter((c) => !c.figurant);
      monde.engins = monde.engins.filter((e) => !e.figurant);
    }
    if (etat.basesAvant) monde.bases = etat.basesAvant; // (morceau 3 : la base aérienne prêtée pour le film)
    for (const a of etat.acteurs) {
      const s = a.s;
      if (s.figurant || s.genre !== "soldat") continue;
      s.visee = a.avant.visee;
      s.accroupi = a.avant.accroupi;
      s.vitesse = 0;
      s.lancer = 0;
      if (s.equipe === "rouges") (s.x = a.avant.x), (s.z = a.avant.z), (s.angle = a.avant.angle), (s.y = T.hauteur(s.x, s.z)), (s.av = null);
    }
  }
  // La fin du film (passee = true : le joueur a appuyé sur Entrée ou Échap).
  function finir(monde, passee) {
    const etat = monde.cinematique;
    if (!etat) return;
    rendre(monde, etat);
    monde.cinematique = null;
    if (monde.phase === "cinematique") monde.phase = etat.phaseAvant === "cinematique" ? "bataille" : etat.phaseAvant;
    radio.emettre(passee ? "cinematique-passee" : "cinematique-fin", { pour: etat.pour, id: etat.id, titre: etat.titre, t: etat.t, duree: etat.duree, plan: etat.plan + 1, plans: etat.plans, dites: etat.dites, repliques: etat.repliques.length });
    if (etat.alaFin) etat.alaFin(monde, !!passee);
  }
  // Arrêter sans rien lancer après (on quitte la campagne, un autre film commence…).
  function arreter(monde) {
    const etat = monde.cinematique;
    if (!etat) return;
    etat.alaFin = null;
    finir(monde, true);
  }

  // ------------------------------------------------------------------ les actions du scénario
  // « acteur » : "escouade" (tout le groupe), "escouade.chef", "escouade.3" (le 4e : on compte à partir de 0), "toi".
  function quiEst(etat, ref) {
    if (!etat || !ref) return [];
    if (ref === "toi") return etat.acteurs.filter((a) => a.s.joueur);
    const [g, n] = String(ref).split(".");
    const G = etat.groupes[g];
    if (!G) return [];
    if (n === undefined) return G.membres;
    if (n === "chef") return G.membres.filter((a) => a.role === "chef");
    return G.membres.length ? [G.membres[+n % G.membres.length]] : []; // (moins de soldats que prévu, en « très difficile » : on reprend au début)
  }
  // Un point du monde : [x, z], ou un acteur (sa place), ou un groupe (son milieu).
  function point(monde, ref) {
    const etat = monde.cinematique;
    if (Array.isArray(ref)) return { x: ref[0], y: T.hauteur(ref[0], ref[1]), z: ref[1], angle: 0 };
    if (ref === "toi" && (!etat || !quiEst(etat, "toi").length)) {
      const m = Tanks.Ordres.ici(monde);
      return { x: m.x, y: m.y, z: m.z, angle: m.angle || 0 };
    }
    const l = quiEst(etat, ref);
    if (!l.length) return null;
    if (l.length === 1) return { x: l[0].s.x, y: l[0].s.y, z: l[0].s.z, angle: l[0].s.angle, cap: l[0].cap, s: l[0].s };
    let x = 0, y = 0, z = 0;
    for (const a of l) (x += a.s.x), (y += a.s.y), (z += a.s.z);
    return { x: x / l.length, y: y / l.length, z: z / l.length, angle: l[0].cap, cap: l[0].cap };
  }
  function agir(monde, act) {
    const etat = monde.cinematique, l = quiEst(etat, act.acteur), g = etat.groupes[String(act.acteur).split(".")[0]];
    const tout = g && String(act.acteur).indexOf(".") < 0;
    if (act.faire === "marche") {
      if (tout) (g.enMarche = true), (g.arrete = false);
      for (const a of l) (a.halte = false), (a.regard = null), (a.s.accroupi = false);
    } else if (act.faire === "halte") {
      if (tout) g.arrete = true;
      for (const a of l) (a.halte = true), (a.geste = null);
    } else if (act.faire === "seTourne") {
      for (const a of l) (a.regard = act.vers || null), (a.geste = null), (a.halte = true);
    } else if (act.faire === "accroupi" || act.faire === "debout") {
      for (const a of l) a.s.accroupi = act.faire === "accroupi";
    } else if (act.faire === "balaye" || act.faire === "retourne") {
      for (const a of l) commencerGeste(a, act.faire, act.duree);
    } else if (act.faire === "signe") {
      for (const a of l) a.s.lancer = R.signe; // (le bras part en arrière puis en avant : « on avance ! »)
    } else if (act.faire === "arme") {
      for (const a of l) a.arme = act.levee !== false;
    } else if (act.faire === "explose") {
      // (morceau 3) une explosion de cinéma : rien n'est abîmé, c'est l'écran qui la montre (affichage/cinematique.js)
      const q = Array.isArray(act.ou) ? act.ou : [0, 0];
      radio.emettre("cinematique-explosion", { x: q[0], z: q[1], force: act.force || 1, sorte: act.sorte || "obus", t: etat.t });
      return;
    } else if (act.faire === "celebre") {
      for (const a of l) (a.fete = act.duree || 6), (a.geste = null), (a.s.accroupi = false), (a.feteDans = hasard() * 0.6);
    }
    radio.emettre("cinematique-action", { acteur: act.acteur, faire: act.faire, soldats: l.length, t: etat.t });
  }

  // ------------------------------------------------------------------ les gestes de soldat prudent
  // ✍️ « Certains se tournent, certains tournent de droite à gauche rapidement, avec leur arme pointée. »
  //   balaye : il balaie de droite à gauche, vite, l'arme en joue (il ralentit) ;
  //   retourne : il s'arrête et se retourne pour surveiller derrière, puis repart ;
  //   accroupi : il s'arrête, s'accroupit un instant en visant, puis rattrape les autres.
  function commencerGeste(a, sorte, duree) {
    const T0 = R.gestes[sorte];
    a.geste = { sorte, t: 0, duree: duree || T0.duree * (0.8 + hasard() * 0.4), sens: hasard() < 0.5 ? -1 : 1 };
    if (sorte === "accroupi") a.s.accroupi = true;
  }
  function choisirGeste(g, a) {
    const chances = g.tactique || {}, tirage = hasard();
    let cumul = 0;
    for (const sorte of ["balaye", "retourne", "accroupi"]) {
      cumul += chances[sorte] || 0;
      if (tirage < cumul) return commencerGeste(a, sorte);
    }
  }

  // ------------------------------------------------------------------ un petit pas du film (appelé par logique/monde.js)
  function etape(monde, dt) {
    const etat = monde.cinematique;
    if (!etat) {
      if (monde.phase === "cinematique") monde.phase = "bataille"; // (jamais coincé dans un film qui n'existe plus)
      return;
    }
    const f = film(etat.id);
    etat.t += dt;
    // le plan en cours
    let p = etat.plan;
    while (p + 1 < etat.debuts.length && etat.t >= etat.debuts[p + 1]) p++;
    if (p !== etat.plan) {
      etat.plan = p;
      radio.emettre("cinematique-plan", { numero: p + 1, total: etat.plans, nom: f.plans[p].nom || "", camera: (f.plans[p].camera || {}).type || "fixe", t: etat.t });
    }
    // les actions et les répliques dont c'est l'heure
    while (etat.prochaineAction < etat.actions.length && etat.actions[etat.prochaineAction].a <= etat.t) agir(monde, etat.actions[etat.prochaineAction++]);
    if (etat.replique && etat.t >= etat.replique.debut + etat.replique.duree) etat.replique = null;
    while (etat.prochaineReplique < etat.repliques.length && etat.repliques[etat.prochaineReplique].a <= etat.t) {
      const r = etat.repliques[etat.prochaineReplique++], P = (C.campagne.personnages || {})[r.qui] || { nom: r.qui, role: "", icone: "📻", couleur: "#fff", camp: "bleus" };
      etat.replique = { qui: r.qui, nom: P.nom, role: P.role, icone: P.icone, couleur: P.couleur, camp: P.camp, texte: r.texte, debut: r.a, duree: r.duree, radio: !!r.radio };
      etat.dites++;
      radio.emettre("cinematique-replique", { qui: r.qui, nom: P.nom, role: P.role, camp: P.camp, texte: r.texte, duree: r.duree, radio: !!r.radio, numero: etat.dites, total: etat.repliques.length });
    }
    // les acteurs
    for (const id in etat.groupes) avancerGroupe(monde, etat.groupes[id], dt);
    if (etat.t >= etat.duree) finir(monde, false);
  }
  function avancerGroupe(monde, g, dt) {
    const etat = monde.cinematique;
    if (!g.enMarche && etat.t >= (g.depart || 0)) g.enMarche = true;
    // (morceau 3) « acceleration » : le groupe part de 0 et prend de la vitesse (un avion sur la piste)
    g.vitesseActuelle = g.acceleration ? Math.min(g.vitesse || 1, (g.vitesseActuelle || 0) + (g.enMarche && !g.arrete ? g.acceleration * dt : 0)) : g.vitesse || 1;
    if (g.enMarche && !g.arrete) g.avance = Math.min(g.chemin.total, g.avance + g.vitesseActuelle * dt);
    for (const a of g.membres) avancerActeur(monde, g, a, dt);
  }
  // (morceau 2) Un char du film : il roule le long du chemin, à sa place dans la colonne (une épave ne bouge pas).
  function avancerChar(g, a, dt) {
    const c = a.s;
    if (c.detruit || a.halte) return void (c.vitesse = 0);
    const [arriere, cote] = place(g, a.rang), p = surChemin(g.chemin, g.avance - arriere);
    const bx = p.x - Math.sin(p.cap) * cote, bz = p.z + Math.cos(p.cap) * cote, dx = bx - c.x, dz = bz - c.z, d = Math.hypot(dx, dz);
    a.cap = p.cap;
    const v = d > 0.05 ? Math.min((g.vitesse || 4) * (d > 3 ? R.rattrape : 1), d / Math.max(dt, 0.25)) : 0;
    if (v > 0) {
      const voulu = Math.atan2(dz, dx), ecart = angleEntre(voulu - c.angle);
      c.angle = angleEntre(c.angle + Math.max(-R.tourneChar * dt, Math.min(R.tourneChar * dt, ecart)));
      const avance = v * Math.max(0, Math.cos(ecart)) * dt;
      c.x += Math.cos(c.angle) * avance;
      c.z += Math.sin(c.angle) * avance;
      c.chenilles.gauche += avance;
      c.chenilles.droite += avance;
    }
    c.vitesse = v;
    c.y = T.hauteur(c.x, c.z);
  }
  // (morceau 3) Un engin du film (hélico, avion) : il suit le chemin, à la hauteur voulue à cet endroit (« hauteurs » :
  // [[mètres parcourus, hauteur au-dessus du sol], …]) ; il penche le nez quand il monte ; les rotors tournent.
  function hauteurA(g, d) {
    const H = g.hauteurs || [[0, 0]];
    if (d <= H[0][0]) return H[0][1];
    for (let i = 1; i < H.length; i++) if (d <= H[i][0]) return H[i - 1][1] + ((H[i][1] - H[i - 1][1]) * (d - H[i - 1][0])) / (H[i][0] - H[i - 1][0] || 1);
    return H[H.length - 1][1];
  }
  function avancerVol(g, a, dt) {
    const e = a.s, [arriere, cote] = place(g, a.rang), d = g.avance - arriere, p = surChemin(g.chemin, d);
    const x = p.x - Math.sin(p.cap) * cote, z = p.z + Math.cos(p.cap) * cote, h = hauteurA(g, d), y = T.hauteur(x, z) + h;
    const v = g.enMarche && !g.arrete ? g.vitesseActuelle || 0 : 0;
    // (un avion lève le nez quand il monte ; un hélico, lui, penche à peine le nez vers l'avant en avançant)
    e.tangage = e.rotor !== undefined ? -Math.min(0.12, v * 0.004) : v > 1 ? Math.atan2(y - e.y, Math.max(0.01, v * dt)) * 0.6 : 0;
    Object.assign(e, { x, z, y, angle: p.cap, vitesse: v, enVol: h > 0.4, roulis: 0 });
    a.cap = p.cap;
    if (e.rotor !== undefined) e.rotor += (g.rotor || 28) * dt;
  }
  function avancerActeur(monde, g, a, dt) {
    if (g.prendre === "engins") return avancerVol(g, a, dt);
    if (a.s.genre !== "soldat") return avancerChar(g, a, dt);
    const s = a.s, G = a.geste, [arriere, cote] = place(g, a.rang), p = surChemin(g.chemin, g.avance - arriere);
    a.cap = p.cap;
    // 1. où il voudrait être : sa place dans la formation (sauf s'il s'est arrêté)
    let vx = 0, vz = 0;
    const arretGeste = G && (G.sorte === "retourne" || G.sorte === "accroupi");
    if (!a.halte && !arretGeste) {
      const bx = p.x - Math.sin(p.cap) * cote, bz = p.z + Math.cos(p.cap) * cote, dx = bx - s.x, dz = bz - s.z, d = Math.hypot(dx, dz);
      // (il rattrape sa place un peu plus vite s'il est en retard ; en balayant, il ralentit)
      const max = (g.vitesse || 1) * (d > 1.5 ? R.rattrape : 1) * (G && G.sorte === "balaye" ? R.gestes.balaye.ralenti : 1);
      if (d > 0.05) {
        const v = Math.min(max, d / Math.max(dt, 0.25));
        (vx = (dx / d) * v), (vz = (dz / d) * v);
      }
    }
    const v = Math.hypot(vx, vz);
    s.x += vx * dt;
    s.z += vz * dt;
    if (v > 0.01) T.repousser(s, 0.45);
    s.y = T.hauteur(s.x, s.z);
    s.vitesse = v;
    s.pas = (s.pas || 0) + v * dt; // (les jambes du dessin suivent les pas)
    // 2. où il regarde : devant lui en marchant ; ou vers ce que le scénario lui dit (« seTourne ») ; ou son geste
    let voulu = v > 0.2 ? Math.atan2(vz, vx) : a.voulu, vitesseTour = R.tourne;
    if (a.regard) {
      const q = point(monde, a.regard);
      if (q && Math.hypot(q.x - s.x, q.z - s.z) > 0.5) voulu = Math.atan2(q.z - s.z, q.x - s.x);
    } else if (a.halte && g.garde) voulu = p.cap + (a.rang % 2 ? -1 : 1) * g.garde * (a.rang ? 1 : 0); // (à l'arrêt : chacun surveille son côté)
    if (G) {
      G.t += dt;
      const RG = R.gestes[G.sorte];
      if (G.sorte === "balaye") {
        // de droite à gauche, vite (une sinusoïde), l'arme en joue
        voulu = p.cap + G.sens * RG.angle * Math.sin((G.t / G.duree) * Math.PI * 2 * RG.allers);
        vitesseTour = RG.tourne;
      } else if (G.sorte === "retourne") {
        voulu = p.cap + Math.PI + G.sens * 0.3; // (il surveille derrière)
        vitesseTour = RG.tourne;
      } else if (G.sorte === "accroupi") voulu = p.cap + G.sens * 0.6;
      if (G.t >= G.duree) {
        if (G.sorte === "accroupi") s.accroupi = false;
        a.geste = null;
        a.gesteDans = R.entreGestes[0] + hasard() * (R.entreGestes[1] - R.entreGestes[0]);
      }
    } else if (g.tactique && !a.regard && a.role !== "chef" && !s.joueur && (g.enMarche || a.halte)) {
      a.gesteDans -= dt;
      if (a.gesteDans <= 0) {
        a.gesteDans = R.entreGestes[0] + hasard() * (R.entreGestes[1] - R.entreGestes[0]);
        if (!(a.halte && hasard() < 0.5)) choisirGeste(g, a);
      }
    }
    // (morceau 2) CÉLÉBRER : il saute de joie et lève le bras, encore et encore (chacun à son rythme)
    if (a.fete > 0) {
      a.fete -= dt;
      a.feteDans -= dt;
      if (a.feteDans <= 0) (s.lancer = R.signe), (a.feteDans = R.fete.toutesLes * (0.8 + hasard() * 0.5));
      s.y += Math.max(0, Math.sin((R.fete.toutesLes - a.feteDans) * Math.PI / R.fete.toutesLes * 2)) * R.fete.saut;
    }
    a.voulu = voulu;
    const ecart = angleEntre(voulu - s.angle), pasMax = vitesseTour * dt;
    s.angle = angleEntre(s.angle + Math.max(-pasMax, Math.min(pasMax, ecart)));
    // 3. l'arme : levée (en joue) pour un soldat prudent ; jamais pour toi (sinon la caméra « épaule » et zoome)
    if (!s.joueur) s.visee = a.arme && !(a.fete > 0) ? 1 : 0;
    if (s.lancer > 0) s.lancer = Math.max(0, s.lancer - dt);
  }

  // ------------------------------------------------------------------ les demandes de l'écran (Entrée, Échap)
  function demander(monde, type) {
    const etat = monde.cinematique;
    if (type === "passer" && etat && etat.passable) {
      finir(monde, true);
      return { ok: true };
    }
    return { ok: false };
  }

  // Pour l'affichage : le plan en cours, le temps dans ce plan (s) et sa part (0 → 1).
  function planEnCours(monde) {
    const etat = monde.cinematique;
    if (!etat) return null;
    const f = film(etat.id), p = f.plans[etat.plan], debut = etat.debuts[etat.plan];
    return { film: f, plan: p, numero: etat.plan, debut, t: etat.t - debut, k: Math.max(0, Math.min(1, (etat.t - debut) / p.duree)) };
  }

  return { lancer, arreter, etape, demander, point, quiEst, planEnCours, film, aPlat };
})();
