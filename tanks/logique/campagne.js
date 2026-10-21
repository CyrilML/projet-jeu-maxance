// 🎬 LA CAMPAGNE : le metteur en scène (étape 88)
//
// ✍️ « Refais l'histoire style Battlefield, refais la campagne. » Comme un metteur en scène de cinéma, ce fichier a le
// SCÉNARIO de chaque chapitre (config.js : campagne.chapitres) et fait jouer la bataille d'après lui :
//   1. il INSTALLE le décor et les acteurs : où tu commences (à pied ou dans ton char), les chars et les soldats des
//      deux camps, les cibles spéciales (canons antiaériens, char de commandement, camion à escorter…) ;
//   2. il suit les OBJECTIFS un par un (atteindre, tenir, survivre, éliminer, détruire, escorter) : chacun a son
//      compteur (« 5 / 8 », « 23 s / 40 s ») ; quand il est accompli, on passe au suivant ;
//   3. il déclenche les ÉVÉNEMENTS du scénario au bon moment : des chars qui arrivent, une colonne de soldats, un hélico
//      qui dépose des soldats à la corde, une frappe aérienne, un convoi ennemi, un hélico qui décolle ;
//   4. il fait parler la RADIO : une réplique à la fois, chacune assez longtemps pour être lue (une file d'attente) ;
//   5. à la fin, il calcule le BILAN (temps, ennemis mis hors de combat, précision, étoiles) et débloque le chapitre
//      suivant dans le livret militaire (donnees/sauvegarde.js).
//   6. (demande 90) il applique la DIFFICULTÉ choisie (config.js : campagne.difficultes) : ta vie, le nombre d'ennemis,
//      les durées à tenir, l'aide des alliés… Les autres règles (logique/soldat.js, ia.js, troupes.js, obus.js) lui
//      demandent leurs multiplicateurs (« facteur ») : en bataille libre, tout reste × 1.
// Les phases du monde : "briefing" (tout est installé mais rien ne bouge : le survol et le briefing), puis "bataille",
// puis "victoire" ou "defaite". « monde.campagne » garde l'état du chapitre en cours (null en bataille libre).
// Ce fichier ne dessine rien : il annonce tout à la radio du jeu (« campagne-… ») ; affichage/campagne-*.js montrent.

window.Tanks = window.Tanks || {};

Tanks.Campagne = (function () {
  const C = Tanks.CONFIG, K = C.campagne, R = K.regles, T = Tanks.Terrain, radio = Tanks.Evenements;
  const S = () => Tanks.Sauvegarde.donnees;
  const chapitre = (id) => K.chapitres.find((c) => c.id === id) || null;
  const angleVers = (de, vers) => Math.atan2(vers.z - de.z, vers.x - de.x);
  let actuel = null; // (le monde, pour les oreilles de la radio)
  let hasardEtat = 88;
  const hasard = () => ((hasardEtat = (hasardEtat * 1664525 + 1013904223) >>> 0) / 4294967296);

  // ------------------------------------------------------------------ le livret de campagne (la progression)
  // { debloque : le plus grand numéro de chapitre ouvert, chapitres : { id : { etoiles, temps, essais, reussi } },
  //   enCours : { id, carte } (le chapitre choisi : il survit au rechargement de la page) }
  function progression() {
    const d = S();
    if (!d.campagne) d.campagne = { debloque: 1, chapitres: {}, enCours: null };
    if (!niveau(d.campagne.difficulte)) d.campagne.difficulte = K.difficulteDepart; // (demande 90)
    return d.campagne;
  }

  // ------------------------------------------------------------------ (demande 90) la difficulté
  const niveau = (id) => K.difficultes.find((n) => n.id === id) || null;
  // Le niveau choisi (celui du livret), ou celui du chapitre en cours (il ne change pas pendant une mission).
  function difficulte() {
    const e = actuel && actuel.campagne;
    return (e && e.difficulte) || niveau(progression().difficulte) || niveau(K.difficulteDepart);
  }
  // Un multiplicateur de la difficulté (× 1 en bataille libre : la campagne n'est pas en cours).
  function facteur(nom) {
    const e = actuel && actuel.campagne;
    return e && e.difficulte && e.difficulte[nom] !== undefined ? e.difficulte[nom] : 1;
  }
  // Les dégâts d'un coup : le Front sur ton camp (× degats), tes alliés sur le Front (× degatsAllies ; pas toi).
  function facteurDegats(tireur, cible) {
    const e = actuel && actuel.campagne;
    if (!e || !e.difficulte || !tireur || !cible) return 1;
    if (tireur.equipe === "rouges" && cible.equipe === "bleus") return e.difficulte.degats;
    if (tireur.equipe === "bleus" && cible.equipe === "rouges") {
      const toi = actuel.toi || {};
      return tireur === actuel.joueur || tireur.joueur || tireur === toi.soldat || tireur === toi.engin ? 1 : e.difficulte.degatsAllies;
    }
    return 1;
  }
  // Un nombre d'ennemis à faire APPARAÎTRE (arrondi au-dessus : au moins 1) ou à ÉLIMINER (arrondi au-dessous : au
  // moins 1) : comme ça, il y a toujours assez d'ennemis pour finir un objectif.
  const apparait = (n, f) => (n > 0 ? Math.max(1, Math.ceil(n * f - 1e-9)) : 0);
  const aFaire = (n, f) => Math.max(1, Math.floor(n * f + 1e-9));
  // Ta vie selon la difficulté (ton tank et ton soldat).
  function appliquerVie(monde) {
    const D = monde.campagne.difficulte, j = monde.joueur, s = monde.toi.soldat;
    j.vie = j.vieMax = Math.round(C.char.vieJoueur * D.vieChar);
    if (s) s.vie = s.vieMax = Math.round(s.vieMax * D.vieSoldat);
  }
  // (très facile, facile) ta vie revient toute seule quand personne ne t'a touché depuis un moment
  function soigner(monde, dt) {
    const D = monde.campagne.difficulte;
    if (!D.soin || monde.phase !== "bataille") return;
    for (const o of [monde.joueur, monde.toi.soldat]) {
      if (!o || o.detruit || o.mort || o.vie >= o.vieMax || o.touche < D.attente) continue;
      o.vie = Math.min(o.vieMax, o.vie + D.soin * o.vieMax * dt);
    }
  }
  function choisirDifficulte(id) {
    const n = niveau(id), P = progression();
    if (!n) return false;
    const avant = niveau(P.difficulte);
    if (P.difficulte === id) return true;
    P.difficulte = id;
    Tanks.Sauvegarde.ecrire("difficulté de la campagne", true);
    radio.emettre("campagne-difficulte", { id, nom: n.nom, icone: n.icone, avant: avant ? avant.nom : "", vieChar: n.vieChar, vieSoldat: n.vieSoldat, degats: n.degats, chars: n.chars, soldats: n.soldats, durees: n.durees });
    return true;
  }
  const estDebloque = (ch) => !!ch && ch.numero <= progression().debloque;

  // ------------------------------------------------------------------ installer les acteurs
  function poser(o, x, z, angle) {
    o.x = x;
    o.z = z;
    o.y = T.hauteur(x, z);
    if (angle !== undefined) o.angle = angle;
    o.av = null; // (le dessin ne doit pas glisser depuis l'ancienne place)
  }
  // Un point au hasard dans un rond (pour placer un groupe de soldats sans les empiler).
  function autour(x, z, rayon) {
    const a = hasard() * Math.PI * 2, d = Math.sqrt(hasard()) * rayon;
    return { x: x + Math.cos(a) * d, z: z + Math.sin(a) * d };
  }
  function nouveauSoldat(equipe, x, z, angle, n) {
    const s = Tanks.Soldat.creer(equipe, x, z, angle, (equipe === "bleus" ? "Lion n° " : "soldat du Front n° ") + n);
    if (n % 6 === 3) s.arme = "roquettes";
    s.ia = { pense: ((n % 6) / 6) * C.soldats.pense, cible: null, voit: false, couloir: x, etat: "avance", erreur: 0 };
    return s;
  }
  // « reste » : garder sa place (une garnison) ; « va » : aller quelque part, puis se battre sur place.
  function ordre(u, action, x, z, rang, sorte, nom) {
    u.ordre = { action, x, z, rang, sorte, depuis: actuel ? actuel.temps : 0, nom: nom || "l'objectif" };
  }
  function soldatsDebout(monde, equipe) {
    let n = 0;
    for (const s of monde.soldats) if (s.equipe === equipe && !s.mort) n++;
    return n;
  }
  function placerSoldat(s, x, z) {
    poser(s, x, z);
    T.repousser(s, 0.5);
    Tanks.Structures.sortir(s);
    s.y = T.hauteur(s.x, s.z);
  }
  // Les soldats d'un camp : on garde les premiers, on les place en groupes, on enlève ceux qui sont de trop.
  function rangerSoldats(monde, equipe, groupes, garde) {
    const libres = monde.soldats.filter((s) => s.equipe === equipe && !s.joueur);
    const gardes = [];
    let n = 0;
    for (const g of groupes) {
      for (let k = 0; k < g.nombre; k++) {
        n++;
        const p = autour(g.x, g.z, g.rayon);
        let s = libres.shift();
        if (!s) monde.soldats.push((s = nouveauSoldat(equipe, p.x, p.z, 0, 100 + n)));
        s.angle = equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2;
        placerSoldat(s, p.x, p.z);
        if (garde) ordre(s, "reste", s.x, s.z, n, "soldat", "sa position");
        gardes.push(s);
      }
    }
    monde.soldats = monde.soldats.filter((s) => s.equipe !== equipe || s.joueur || gardes.includes(s));
  }
  function nouveauChar(monde, equipe, x, z, angle, nom, k) {
    const c = Tanks.Char.creer(C.chars[(k + (equipe === "rouges" ? 1 : 0)) % C.chars.length], equipe, { x, z, angle }, nom);
    Tanks.IA.preparer(c);
    monde.chars.push(c);
    return c;
  }
  // Les chars d'un camp : chacun à sa place (on réutilise ceux de la bataille, on ajoute ou on enlève).
  function rangerChars(monde, equipe, liste, garde) {
    const anciens = monde.chars.filter((c) => c.equipe === equipe && c !== monde.joueur);
    const gardes = [];
    liste.forEach(([x, z, nom], k) => {
      const angle = equipe === "bleus" ? -Math.PI / 2 : Math.PI / 2;
      let c = anciens.shift();
      if (c) (c.nom = nom), poser(c, x, z, angle);
      else c = nouveauChar(monde, equipe, x, z, angle, nom, k);
      if (garde) ordre(c, "reste", x, z, k, "tank", "sa position");
      gardes.push(c);
    });
    monde.chars = monde.chars.filter((c) => c.equipe !== equipe || c === monde.joueur || gardes.includes(c));
  }

  // Une CIBLE SPÉCIALE du scénario (config : cibles).
  function creerCible(monde, etat, c) {
    let o = null;
    if (c.sorte === "dca") {
      o = Tanks.Engins.garer({ sorte: "dca", fiche: Object.assign({ longueur: 4.8, largeur: 2.2, hauteur: 2 }, C.engins.dca) });
      Object.assign(o, { equipe: "rouges", nom: c.nom, angle: c.angle === undefined ? Math.PI / 2 : c.angle, tourelle: hasard() * 6, hausse: 0.7 });
      poser(o, c.x, c.z);
      monde.engins.push(o);
    } else if (c.sorte === "char") {
      o = nouveauChar(monde, c.equipe || "rouges", c.x, c.z, c.angle || 0, c.nom, etat.nChars++);
      ordre(o, "reste", c.x, c.z, 0, "tank", "sa position");
      if (c.vie) o.vie = o.vieMax = c.vie;
    } else if (c.sorte === "camion") {
      const V = Tanks.Vehicules;
      o = V.garerAuCamp(V.nouveau("camion", c.equipe || "rouges", 9 + etat.nVehicules++));
      poser(o, c.x, c.z, c.angle || 0);
      Object.assign(o, { nom: c.nom, passagers: 0 });
      if (c.vie) o.vie = o.vieMax = c.vie;
      o.ia.route = (c.route || []).map((p) => [p[0], p[1]]);
      o.ia.prudent = true;
      monde.vehicules.push(o);
    } else if (c.sorte === "helico") {
      o = monde.helicos.find((h) => h.equipe === (c.equipe || "bleus") && h.sorte === (c.modele || "blackhawk") && !h.campagne) || monde.helicos.find((h) => h.equipe === (c.equipe || "bleus") && !h.campagne);
      if (!o) return null;
      poser(o, c.x, c.z, c.angle || 0);
      Object.assign(o, { nom: c.nom, enVol: false, vitesse: 0, vy: 0, passagers: 0 });
      o.ia.etat = "au camp";
      o.ia.attente = 1e9;
    }
    if (!o) return null;
    o.campagne = c.id || c.groupe || "cible";
    if (c.id) etat.cibles[c.id] = o;
    if (c.groupe) (etat.groupes[c.groupe] = etat.groupes[c.groupe] || []).push(o);
    return o;
  }

  function installer(monde, ch, etat) {
    const F = ch.forces || {};
    if (monde.metro) {
      // (le souterrain : les deux camps sont déjà à leur bout de la station ; on règle seulement les renforts)
      if (F.renfortsRouges !== undefined) monde.metro.renforts.rouges = apparait(F.renfortsRouges, etat.difficulte.soldats); // (demande 90)
      if (F.renfortsBleus !== undefined) monde.metro.renforts.bleus = Math.round(F.renfortsBleus * etat.difficulte.allies);
    } else {
      const j = monde.joueur, toi = monde.toi.soldat, D = F.toi || { mode: "char", x: 0, z: 400, angle: -Math.PI / 2 };
      if (D.mode === "pied") {
        // à pied : ton char est garé tout près (ou reste au camp), ton soldat est dehors
        if (D.char) poser(j, D.char[0], D.char[1], D.angle);
        toi.dansUnEngin = null;
        placerSoldat(toi, D.x, D.z);
        toi.angle = D.angle;
        monde.toi = { mode: "pied", engin: null, soldat: toi };
      } else {
        poser(j, D.x, D.z, D.angle);
        poser(toi, D.x, D.z, D.angle);
      }
      rangerChars(monde, "bleus", F.alliesChars || [], false);
      // (demande 90) la difficulté change le nombre de chars et de soldats (on copie : le scénario ne change pas)
      const N = etat.difficulte, liste = F.ennemisChars || [], nChars = apparait(liste.length, N.chars);
      rangerChars(monde, "rouges", Array.from({ length: nChars }, (_, k) => (k < liste.length ? liste[k] : [liste[k % liste.length][0] + 14, liste[k % liste.length][1] - 10, liste[k % liste.length][2] + " bis"])), true);
      const A = F.alliesSoldats || { nombre: 8, x: D.x, z: D.z + 15, rayon: 12 };
      rangerSoldats(monde, "bleus", [Object.assign({}, A, { nombre: Math.max(1, Math.round(A.nombre * N.allies)) })], false);
      rangerSoldats(monde, "rouges", (F.ennemisSoldats || []).map((g) => Object.assign({}, g, { nombre: Math.max(1, Math.round(g.nombre * N.soldats)) })), true);
      if (!F.avions) monde.avions = monde.avions.filter((a) => a.sorte !== "chasseur");
      if (!F.paras) monde.chronoParas = -1e9; // (les avions de transport ne viendront pas)
      if (!F.vehicules) monde.vehicules = [];
      if (!F.lac) (monde.bateaux = []), (monde.sousMarins = []);
      for (const h of monde.helicos) if (!F.helicos) h.ia.attente = 1e9; // (les hélicos restent au camp : seuls ceux du scénario volent)
    }
    for (const c of ch.cibles || []) creerCible(monde, etat, c);
  }

  // ------------------------------------------------------------------ préparer, commencer, quitter
  function nouvelEtat(ch) {
    return {
      id: ch.id, numero: ch.numero, titre: ch.titre, etat: "briefing", chrono: 0, index: -1,
      objectifs: ch.objectifs.map((o, k) => ({ numero: k + 1, type: o.type, texte: o.texte, etat: "à venir", progres: 0, total: 1, depuis: 0, fini: 0, dedans: false, base: 0 })),
      attente: [], radio: null, file: [], repliques: 0,
      cibles: {}, groupes: {}, nChars: 0, nVehicules: 0, avions: [],
      compteurs: { eliminesCamp: 0, parToi: 0, soldatsParToi: 0, vehiculesParToi: 0 },
      bilan: null, ecranDans: 0, raison: "", escorte: null, apparitions: 0,
      difficulte: Object.assign({}, niveau(progression().difficulte) || niveau(K.difficulteDepart)), // (demande 90 : figée pour tout le chapitre)
    };
  }
  // ✍️ Préparer un chapitre : la bataille est installée d'après le scénario, mais tout est figé (phase "briefing")
  // pendant le survol et le briefing.
  function preparer(monde, id) {
    const ch = chapitre(id);
    if (!ch || !estDebloque(ch)) return false;
    actuel = monde;
    monde.campagne = null;
    monde.carte = ch.carte;
    Tanks.Monde.lancer(monde); // (toute la bataille, comme d'habitude…)
    const etat = nouvelEtat(ch);
    monde.campagne = etat;
    installer(monde, ch, etat); // (…puis le metteur en scène place chacun selon le scénario)
    appliquerVie(monde); // (demande 90)
    monde.phase = "briefing";
    const P = progression();
    P.enCours = { id: ch.id, carte: ch.carte };
    Tanks.Sauvegarde.ecrire("campagne : chapitre " + ch.numero, true);
    radio.emettre("campagne-chapitre", { numero: ch.numero, titre: ch.titre, lieu: ch.lieu, date: ch.date, carte: ch.carte, objectifs: ch.objectifs.length, chars: monde.chars.length, soldats: monde.soldats.length, difficulte: etat.difficulte.icone + " " + etat.difficulte.nom });
    return true;
  }
  // « Commencer la mission » (le bouton du briefing) : ton soldat prend la classe choisie, et l'action commence.
  function commencer(monde) {
    const etat = monde.campagne;
    if (!etat || monde.phase !== "briefing") return false;
    const ch = chapitre(etat.id);
    const eq = Tanks.Equipement.equiper(monde.toi.soldat); // (la classe a peut-être changé pendant le briefing)
    appliquerVie(monde); // (demande 90 : la vie selon la difficulté, après l'équipement qui l'a remise à zéro)
    monde.phase = "bataille";
    monde.chrono = 0;
    etat.etat = "en cours";
    for (const r of ch.radio || []) etat.file.push(r);
    radio.emettre("campagne-debut", { numero: ch.numero, titre: ch.titre, classe: C.classes[eq.classe].nom, mode: monde.toi.mode });
    demarrerObjectif(monde, 0);
    return true;
  }
  // Quitter la campagne : retour au garage de la bataille libre (avec ta carte à toi).
  function quitter(monde, raison) {
    const etat = monde.campagne;
    if (etat) radio.emettre("campagne-quitte", { numero: etat.numero, titre: etat.titre, raison: raison || "retour" });
    monde.campagne = null;
    monde.carte = C.cartes.some((c) => c.id === S().carte) ? S().carte : "bataille";
    monde.phase = "garage";
    Tanks.Monde.choisirChar(monde, monde.choix);
    progression().enCours = null;
    Tanks.Sauvegarde.ecrire("campagne quittée", true);
  }

  // ------------------------------------------------------------------ les objectifs
  const rougesDetruits = (monde) => monde.chars.filter((c) => c.equipe === "rouges" && c.detruit).length;
  const rougesVivants = (monde) => monde.chars.filter((c) => c.equipe === "rouges" && !c.detruit);
  // Les objets à détruire d'un objectif « detruire » (ses cibles, ou tout son groupe).
  function membres(etat, def) {
    if (def.groupe) return etat.groupes[def.groupe] || [];
    return (def.cibles || []).map((id) => etat.cibles[id]).filter(Boolean);
  }
  // OÙ est l'objectif en cours ? (pour le marqueur à l'écran, la carte et tes alliés) : une liste de points.
  function points(monde) {
    const etat = monde.campagne;
    if (!etat || etat.index < 0 || etat.index >= etat.objectifs.length) return [];
    const def = chapitre(etat.id).objectifs[etat.index];
    if (def.zone) return [{ x: def.zone[0], z: def.zone[1], rayon: def.zone[2], y: T.hauteur(def.zone[0], def.zone[1]), zone: true, nom: def.type === "escorter" ? "arrivée" : "" }];
    if (def.type === "detruire") return membres(etat, def).filter((o) => !o.detruit).map((o) => ({ x: o.x, y: o.y, z: o.z, nom: o.nom, cible: true }));
    if (def.type === "chars") return rougesVivants(monde).map((o) => ({ x: o.x, y: o.y, z: o.z, nom: o.nom, cible: true }));
    if (def.type === "eliminer") {
      // (le soldat du Front le plus proche, pour savoir où aller)
      const moi = ici(monde);
      let meilleur = null, d0 = 450;
      for (const s of monde.soldats) {
        if (s.mort || s.equipe !== "rouges" || s.dansUnEngin || s.parachute || s.corde) continue;
        const d = Math.hypot(s.x - moi.x, s.z - moi.z);
        if (d < d0) (d0 = d), (meilleur = s);
      }
      return meilleur ? [{ x: meilleur.x, y: meilleur.y, z: meilleur.z, nom: "ennemi le plus proche", cible: true, petit: true }] : [];
    }
    return [];
  }
  function demarrerObjectif(monde, k) {
    const etat = monde.campagne, ch = chapitre(etat.id), def = ch.objectifs[k], o = etat.objectifs[k];
    etat.index = k;
    o.etat = "en cours";
    o.depuis = etat.chrono;
    o.progres = 0;
    const N = etat.difficulte; // (demande 90 : les durées et les nombres selon la difficulté)
    if (def.type === "tenir" || def.type === "survivre") o.total = Math.max(5, Math.round(def.duree * N.durees));
    else if (def.type === "eliminer") (o.base = etat.compteurs.eliminesCamp), (o.total = aFaire(def.nombre, N.soldats));
    else if (def.type === "chars") (o.base = rougesDetruits(monde)), (o.total = def.tous ? Math.max(1, rougesVivants(monde).length) : aFaire(def.nombre, N.chars));
    else o.total = 1;
    if (def.renfortsRouges !== undefined && monde.metro) monde.metro.renforts.rouges = apparait(def.renfortsRouges, N.soldats);
    for (const e of def.debut || []) etat.attente.push({ t: etat.chrono + (e.apres || 0), e });
    jouerEvenements(monde);
    // tes alliés (chars et soldats) avancent vers l'objectif
    const p = points(monde)[0] || (def.type === "survivre" ? Tanks.Ordres.ici(monde) : null);
    if (p && !monde.metro) {
      monde.chars.filter((c) => c.equipe === "bleus" && c !== monde.joueur && !c.detruit).forEach((c, r) => ordre(c, "va", p.x + Math.cos(r * 2.4) * (14 + r * 4), p.z + Math.sin(r * 2.4) * (14 + r * 4) + 20, r, "tank"));
      monde.soldats.filter((s) => s.equipe === "bleus" && !s.joueur && !s.mort).forEach((s, r) => ordre(s, "va", p.x + Math.cos(r * 2.4) * (3 + r * 0.8), p.z + Math.sin(r * 2.4) * (3 + r * 0.8), r, "soldat"));
    }
    radio.emettre("campagne-objectif-nouveau", { numero: k + 1, total: etat.objectifs.length, type: def.type, texte: def.texte, verbe: K.verbes[def.type], objectif: o.total });
  }
  // Où es-tu ? (ton char, ton soldat, ou l'engin que tu conduis)
  const ici = (monde) => Tanks.Ordres.ici(monde);
  function suivreObjectif(monde, dt) {
    const etat = monde.campagne, def = chapitre(etat.id).objectifs[etat.index], o = etat.objectifs[etat.index];
    const moi = ici(monde);
    let fini = false;
    if (def.type === "atteindre") {
      o.progres = Math.hypot(moi.x - def.zone[0], moi.z - def.zone[1]);
      fini = o.progres <= def.zone[2];
    } else if (def.type === "tenir") {
      o.dedans = Math.hypot(moi.x - def.zone[0], moi.z - def.zone[1]) <= def.zone[2];
      if (o.dedans) o.progres += dt;
      fini = o.progres >= o.total;
    } else if (def.type === "survivre") {
      o.progres += dt;
      fini = o.progres >= o.total;
    } else if (def.type === "eliminer") {
      o.progres = etat.compteurs.eliminesCamp - o.base;
      fini = o.progres >= o.total;
    } else if (def.type === "chars") {
      o.progres = rougesDetruits(monde) - o.base;
      fini = o.progres >= o.total;
    } else if (def.type === "detruire") {
      const l = membres(etat, def);
      o.total = Math.max(1, l.length);
      o.progres = l.filter((x) => x.detruit).length;
      fini = l.length > 0 && o.progres >= l.length;
    } else if (def.type === "escorter") {
      const v = etat.cibles[def.cible];
      if (!v || v.detruit) return echouer(monde, (v ? v.nom : "Le véhicule") + " est détruit");
      // ✍️ le camion t'ATTEND si tu es trop loin (et repart quand tu reviens)
      const loin = Math.hypot(moi.x - v.x, moi.z - v.z), avant = !!v.ia.pause;
      v.ia.pause = avant ? loin > R.escorte.repart : loin > R.escorte.attend;
      if (v.ia.pause !== avant) radio.emettre("campagne-escorte", { nom: v.nom, attend: v.ia.pause, distance: Math.round(loin) });
      o.progres = Math.hypot(v.x - def.zone[0], v.z - def.zone[1]);
      etat.escorte = { nom: v.nom, vie: v.vie, vieMax: v.vieMax || C.engins.camion.vie, attend: v.ia.pause };
      fini = o.progres <= def.zone[2] + 4;
    }
    if (fini) objectifAccompli(monde);
  }
  function objectifAccompli(monde) {
    const etat = monde.campagne, ch = chapitre(etat.id), def = ch.objectifs[etat.index], o = etat.objectifs[etat.index];
    o.etat = "fait";
    o.fini = etat.chrono;
    if (o.type !== "atteindre" && o.type !== "escorter") o.progres = o.total;
    for (const r of def.fin || []) etat.file.push(r);
    radio.emettre("campagne-objectif", { numero: o.numero, total: etat.objectifs.length, texte: o.texte, temps: etat.chrono - o.depuis });
    if (etat.index + 1 < etat.objectifs.length) demarrerObjectif(monde, etat.index + 1);
    else reussir(monde);
  }

  // ------------------------------------------------------------------ les événements du scénario
  function jouerEvenements(monde) {
    const etat = monde.campagne;
    for (let i = 0; i < etat.attente.length; i++) {
      const a = etat.attente[i];
      if (a.t > etat.chrono) continue;
      etat.attente.splice(i--, 1);
      if (a.e.radio) etat.file.push(a.e.radio);
      if (a.e.action) agir(monde, a.e);
    }
  }
  const versPoint = (monde, v) => (v === "toi" ? ici(monde) : { x: v[0], z: v[1] });
  function agir(monde, e) {
    const etat = monde.campagne, equipe = e.equipe || "rouges";
    if (e.action === "tanks") {
      // (demande 90) le nombre de chars selon la difficulté (sauf les chars « cibles » du scénario, qui ont un id)
      const vers = versPoint(monde, e.vers || [0, 0]), base = e.noms || ["Renfort"];
      const n = e.id ? base.length : apparait(base.length, equipe === "rouges" ? etat.difficulte.chars : etat.difficulte.allies);
      const noms = Array.from({ length: n }, (_, k) => base[k % base.length] + (k >= base.length ? " bis" : ""));
      noms.forEach((nom, k) => {
        const de = (e.de && (e.de[k] || e.de[0])) || [0, -700];
        const c = nouveauChar(monde, equipe, de[0], de[1], angleVers({ x: de[0], z: de[1] }, vers), nom, etat.nChars++);
        const vie = e.vie && e.vie[k];
        if (vie) c.vie = c.vieMax = vie;
        if (e.id && e.id[k]) (etat.cibles[e.id[k]] = c), (c.campagne = e.id[k]);
        ordre(c, "va", vers.x + Math.cos(k * 2.1) * 14 * k, vers.z + Math.sin(k * 2.1) * 14 * k, k, "tank");
      });
      radio.emettre("campagne-renforts", { equipe, sorte: "chars", nombre: noms.length, noms, x: e.de[0][0], z: e.de[0][1] });
    } else if (e.action === "soldats") {
      const vers = versPoint(monde, e.vers || [0, 0]);
      let n = 0;
      const nombre = apparait(e.nombre, equipe === "rouges" ? etat.difficulte.soldats : etat.difficulte.allies); // (demande 90)
      for (let k = 0; k < nombre; k++) {
        if (soldatsDebout(monde, equipe) >= R.soldatsDebout) break;
        const p = autour(e.de[0], e.de[1], 10), s = nouveauSoldat(equipe, p.x, p.z, angleVers(p, vers), 200 + ++etat.apparitions);
        placerSoldat(s, p.x, p.z);
        ordre(s, "va", vers.x + (hasard() - 0.5) * 16, vers.z + (hasard() - 0.5) * 16, k, "soldat");
        monde.soldats.push(s);
        n++;
      }
      radio.emettre("campagne-renforts", { equipe, sorte: "soldats", nombre: n, x: e.de[0], z: e.de[1] });
    } else if (e.action === "helico") {
      const h = monde.helicos.find((x) => x.equipe === equipe && !x.detruit && !x.campagne && x.ia.etat === "au camp");
      if (!h) return void agir(monde, { action: "soldats", equipe, nombre: 6, de: e.vers, vers: e.vers }); // (plus d'hélico libre : des soldats à pied)
      const vers = versPoint(monde, e.vers);
      poser(h, e.de[0], e.de[1], angleVers({ x: e.de[0], z: e.de[1] }, vers));
      h.y = T.hauteur(h.x, h.z) + C.helicosTransport.croisiere;
      Object.assign(h, { enVol: true, vitesse: 25, vy: 0, passagers: C.engins[h.sorte].places, campagneBut: vers });
      Object.assign(h.ia, { etat: "en vol vers le front", but: { x: vers.x, z: vers.z }, attente: 0 });
      radio.emettre("campagne-helico", { equipe, nom: h.nom, passagers: h.passagers, x: vers.x, z: vers.z });
    } else if (e.action === "decollage") {
      const h = etat.cibles[e.cible];
      if (!h || h.detruit) return;
      const vers = versPoint(monde, e.vers);
      h.passagers = 4;
      h.campagneBut = vers;
      Object.assign(h.ia, { etat: "décolle", but: { x: vers.x, z: vers.z }, attente: 0 });
      radio.emettre("campagne-decollage", { nom: h.nom, x: vers.x, z: vers.z });
    } else if (e.action === "frappe") frappe(monde, e);
    else if (e.action === "convoi") {
      const r = e.route, dx = r[1][0] - r[0][0], dz = r[1][1] - r[0][1], l = Math.hypot(dx, dz) || 1;
      for (let k = 0; k < e.nombre; k++) {
        const x = r[0][0] - (dx / l) * k * 24, z = r[0][1] - (dz / l) * k * 24;
        creerCible(monde, etat, { sorte: "camion", equipe, groupe: e.groupe, nom: e.nom + " " + (k + 1), x, z, angle: Math.atan2(dz, dx), route: r.slice(1) });
      }
      radio.emettre("campagne-convoi", { nombre: e.nombre, nom: e.nom, x: r[0][0], z: r[0][1], vers: r[r.length - 1] });
    }
  }

  // ✍️ LA FRAPPE AÉRIENNE : 2 avions arrivent de loin, en ligne droite, et lâchent leurs bombes en chapelet. Pour
  // tomber au bon endroit, chaque bombe est lâchée AVANT d'être au-dessus : elle garde la vitesse de l'avion pendant sa
  // chute (√(2 × hauteur ÷ 9,8) secondes), comme les bombardiers ennemis (logique/avions.js).
  // « sur: "tanks" » : chaque avion SUIT un des 2 chars ennemis les plus proches de toi (il corrige son cap jusqu'au
  // largage, en visant là où le char SERA quand la bombe arrivera).
  function frappe(monde, e) {
    const etat = monde.campagne, F = R.frappe, equipe = e.equipe || "bleus";
    let cible, suivis = [];
    if (e.sur === "tanks") {
      const moi = ici(monde);
      suivis = rougesVivants(monde).sort((a, b) => Math.hypot(a.x - moi.x, a.z - moi.z) - Math.hypot(b.x - moi.x, b.z - moi.z)).slice(0, 2);
      cible = suivis.length ? { x: suivis[0].x, z: suivis[0].z } : moi;
    } else cible = { x: e.sur[0], z: e.sur[1] };
    const cap = -Math.PI / 2 + (hasard() - 0.5) * 0.8, dx = Math.cos(cap), dz = Math.sin(cap);
    for (let k = 0; k < 2; k++) {
      const cote = (k ? 1 : -1) * F.decalage, x = cible.x - dx * F.loin - dz * cote, z = cible.z - dz * F.loin + dx * cote;
      const a = {
        genre: "avion", sorte: "chasseur", equipe, nom: "Tonnerre " + (k + 1), pilote: true, enVol: true, scripte: true,
        fiche: { vie: 3, longueur: 14, largeur: 10, hauteur: 4 },
        x, y: Math.max(T.hauteur(Math.max(-T.demi, Math.min(T.demi, x)), Math.max(-T.demi, Math.min(T.demi, z))) + 40, F.altitude), z, angle: cap, tangage: 0, roulis: 0, vitesse: F.vitesse,
        vx: dx * F.vitesse, vy: 0, vz: dz * F.vitesse, vie: 3, detruit: false, touche: 9, etat: "frappe", chute: 0,
        bombes: F.bombes, prochaineBombe: k * 0.08, cible: { x: cible.x - dz * cote * 0.4, z: cible.z + dx * cote * 0.4 }, dx, dz, largue: false,
        suivi: suivis[k] || suivis[0] || null,
      };
      monde.avions.push(a);
      etat.avions.push(a);
    }
    radio.emettre("campagne-frappe", { equipe, avions: 2, bombes: 2 * F.bombes, x: Math.round(cible.x), z: Math.round(cible.z) });
  }
  function piloterFrappes(monde, dt) {
    const etat = monde.campagne, F = R.frappe;
    for (let i = etat.avions.length - 1; i >= 0; i--) {
      const a = etat.avions[i];
      const chuteVisee = Math.sqrt((2 * Math.max(10, a.y - T.hauteur(a.cible.x, a.cible.z))) / C.projectiles.bombe.gravite);
      if (!a.largue && a.suivi && !a.suivi.detruit) {
        // (il vise là où le char sera quand la bombe tombera)
        const c = a.suivi, d = Math.hypot(c.x - a.x, c.z - a.z), t = d / a.vitesse;
        a.cible = { x: c.x + Math.cos(c.angle) * (c.vitesse || 0) * t, z: c.z + Math.sin(c.angle) * (c.vitesse || 0) * t };
      }
      // avant le largage, il tourne vers sa cible (après, il file tout droit)
      const versCible = Math.atan2(a.cible.z - a.z, a.cible.x - a.x), loin = Math.hypot(a.cible.x - a.x, a.cible.z - a.z) > a.vitesse * chuteVisee * 0.8;
      Tanks.Avions.piloter(a, !a.largue && loin ? versCible : a.angle, F.altitude, dt, 0.6);
      (a.dx = Math.cos(a.angle)), (a.dz = Math.sin(a.angle));
      // la distance qui reste jusqu'au-dessus de la cible, le long de sa route
      const reste = (a.cible.x - a.x) * a.dx + (a.cible.z - a.z) * a.dz;
      const chute = Math.sqrt((2 * Math.max(10, a.y - T.hauteur(a.cible.x, a.cible.z))) / C.projectiles.bombe.gravite);
      const lacher = a.vitesse * chute + ((F.bombes - 1) * F.ecart * a.vitesse) / 2; // (le milieu du chapelet tombe sur la cible)
      if (a.bombes > 0 && reste <= lacher) {
        a.prochaineBombe -= dt;
        if (a.prochaineBombe <= 0) {
          a.prochaineBombe = F.ecart;
          a.bombes--;
          a.largue = true;
          Tanks.Obus.lancer(monde.obus, a, "bombe", { x: a.x, y: a.y - 2, z: a.z }, { x: 0, y: 0, z: 0 }, null, { x: a.vx, y: 0, z: a.vz });
        }
      }
      if (reste < -F.loin * 0.8) {
        etat.avions.splice(i, 1);
        const k = monde.avions.indexOf(a);
        if (k >= 0) monde.avions.splice(k, 1);
      }
    }
  }

  // ------------------------------------------------------------------ la radio (une réplique à la fois)
  function parler(etat, dt) {
    if (etat.radio) {
      etat.radio.t += dt;
      if (etat.radio.t < etat.radio.duree + R.radio.pause) return;
      etat.radio = null;
    }
    // (trop de répliques en retard — tu as été trop rapide ! — on saute les plus vieilles : la radio reste à l'heure)
    while (etat.file.length > 3 && etat.etat === "en cours") etat.file.shift();
    const r = etat.file.shift();
    if (!r) return;
    const [qui, texte] = r, P = K.personnages[qui] || { nom: qui, role: "", icone: "📻", couleur: "#fff", camp: "bleus" };
    etat.radio = { qui, nom: P.nom, role: P.role, icone: P.icone, couleur: P.couleur, camp: P.camp, texte, t: 0, duree: Math.min(R.radio.max, R.radio.base + texte.length * R.radio.parLettre) };
    etat.repliques++;
    radio.emettre("campagne-radio", { qui, nom: P.nom, role: P.role, camp: P.camp, texte, duree: etat.radio.duree });
  }

  // ------------------------------------------------------------------ un petit pas de la campagne (appelé par logique/monde.js)
  function etape(monde, dt) {
    const etat = monde.campagne;
    if (!etat) return;
    actuel = monde;
    parler(etat, dt);
    soigner(monde, dt); // (demande 90)
    if (etat.avions.length) piloterFrappes(monde, dt);
    // (les hélicos du scénario gardent leur but ; ceux qui ne sont pas du scénario restent au camp)
    for (const h of monde.helicos) {
      if (h.campagneBut && (h.ia.etat === "décolle" || h.ia.etat === "en vol vers le front")) h.ia.but = { x: h.campagneBut.x, z: h.campagneBut.z };
      else if (h.campagneBut && h.ia.etat === "retour au camp") h.campagneBut = null;
      if (h.ia.etat === "au camp" && h.ia.attente < 1e8 && !(chapitre(etat.id).forces || {}).helicos) h.ia.attente = 1e9;
    }
    // (les canons antiaériens du Front fouillent le ciel)
    for (const e of monde.engins) if (e.equipe === "rouges" && e.sorte === "dca" && !e.detruit) (e.tourelle += dt * 0.35), (e.hausse = 0.75 + Math.sin(etat.chrono * 0.6 + e.x) * 0.25);
    // (les épaves des camions du scénario disparaissent avant de « revenir au camp » comme un camion normal)
    for (let i = monde.vehicules.length - 1; i >= 0; i--) {
      const v = monde.vehicules[i];
      if (v.campagne && v.detruit && (v.epave = (v.epave || 0) + dt) > C.vehicules.retour - 5) monde.vehicules.splice(i, 1);
    }
    if (etat.etat === "en cours") {
      if (monde.phase === "defaite") return echouer(monde, etat.raison || "Tu es hors de combat");
      if (monde.phase !== "bataille") return;
      etat.chrono += dt;
      jouerEvenements(monde);
      if (etat.index >= 0 && etat.index < etat.objectifs.length) suivreObjectif(monde, dt);
    } else if (etat.ecranDans > 0) etat.ecranDans = Math.max(0, etat.ecranDans - dt);
  }

  // ------------------------------------------------------------------ la fin : le bilan, les étoiles, le livret
  function bilan(monde, reussi) {
    const etat = monde.campagne, ch = chapitre(etat.id), toi = monde.toi.soldat, j = monde.joueur;
    const tirs = ((toi && toi.compteurs && toi.compteurs.tirs) || 0) + (j.tirs || 0), touches = ((toi && toi.compteurs && toi.compteurs.touches) || 0) + (j.reussis || 0);
    const precision = tirs ? Math.min(1, touches / tirs) : 0;
    const N = etat.difficulte, tempsEtoile = Math.round(ch.etoiles.temps * N.etoiles), elimEtoile = aFaire(ch.etoiles.eliminations, N.soldats); // (demande 90)
    const etoiles = reussi ? [true, etat.chrono <= tempsEtoile, etat.compteurs.parToi >= elimEtoile] : [false, false, false];
    return {
      reussi, temps: etat.chrono, eliminations: etat.compteurs.parToi, soldats: etat.compteurs.soldatsParToi, vehicules: etat.compteurs.vehiculesParToi,
      tirs, touches, precision, objectifs: etat.objectifs.filter((o) => o.etat === "fait").length, total: etat.objectifs.length,
      etoiles, nbEtoiles: etoiles.filter(Boolean).length, criteres: { temps: tempsEtoile, eliminations: elimEtoile },
      difficulte: { id: N.id, nom: N.nom, icone: N.icone, couleur: N.couleur },
    };
  }
  function terminer(monde, reussi, raison) {
    const etat = monde.campagne, ch = chapitre(etat.id), P = progression();
    etat.etat = reussi ? "reussie" : "echouee";
    etat.raison = raison || "";
    etat.bilan = bilan(monde, reussi);
    // l'écran de fin attend que la radio ait fini (pas plus de 14 s)
    const reste = (etat.radio ? etat.radio.duree - etat.radio.t : 0) + etat.file.reduce((s, [, t]) => s + Math.min(R.radio.max, R.radio.base + t.length * R.radio.parLettre) + R.radio.pause, 0);
    etat.ecranDans = Math.min(14, Math.max(R.fin, reste + 0.5));
    // le livret : meilleures étoiles, meilleur temps, nombre d'essais ; et le chapitre suivant s'ouvre
    const f = (P.chapitres[ch.id] = Object.assign({ etoiles: 0, temps: 0, essais: 0, reussi: false }, P.chapitres[ch.id]));
    f.essais++;
    if (reussi) {
      f.reussi = true;
      f.etoiles = Math.max(f.etoiles, etat.bilan.nbEtoiles);
      f.temps = f.temps ? Math.min(f.temps, Math.round(etat.chrono)) : Math.round(etat.chrono);
      f.niveaux = f.niveaux || {}; // (demande 90 : les meilleures étoiles à chaque difficulté)
      f.niveaux[etat.difficulte.id] = Math.max(f.niveaux[etat.difficulte.id] || 0, etat.bilan.nbEtoiles);
      etat.bilan.record = f.temps === Math.round(etat.chrono);
      if (P.debloque < ch.numero + 1 && ch.numero < K.chapitres.length) {
        P.debloque = ch.numero + 1;
        etat.bilan.debloque = K.chapitres[ch.numero].titre;
        radio.emettre("campagne-debloque", { numero: ch.numero + 1, titre: K.chapitres[ch.numero].titre });
      }
    }
    Tanks.Sauvegarde.ecrire(reussi ? "campagne : chapitre réussi" : "campagne : chapitre échoué", true);
    radio.emettre(reussi ? "campagne-reussie" : "campagne-echouee", Object.assign({ numero: ch.numero, titre: ch.titre, raison: etat.raison }, etat.bilan));
  }
  function reussir(monde) {
    monde.phase = "victoire";
    terminer(monde, true);
  }
  function echouer(monde, raison) {
    if (monde.phase === "bataille") monde.phase = "defaite";
    const etat = monde.campagne;
    if (etat.index >= 0 && etat.objectifs[etat.index].etat === "en cours") etat.objectifs[etat.index].etat = "raté";
    terminer(monde, false, raison);
  }

  // ------------------------------------------------------------------ les oreilles (les compteurs de la mission)
  radio.ecouter("soldat-mort", (d) => {
    const etat = actuel && actuel.campagne;
    if (!etat || etat.etat !== "en cours" || d.equipeCible !== "rouges") return;
    if (d.equipeTireur === "bleus" || d.parToi) etat.compteurs.eliminesCamp++;
    if (d.parToi) etat.compteurs.parToi++, etat.compteurs.soldatsParToi++;
  });
  for (const nom of ["detruit", "abattu", "pilote-abattu"]) {
    radio.ecouter(nom, (d) => {
      const etat = actuel && actuel.campagne;
      if (etat && etat.etat === "en cours" && d.parToi && d.equipeCible === "rouges") etat.compteurs.parToi++, etat.compteurs.vehiculesParToi++;
    });
  }
  radio.ecouter("defaite", (d) => {
    const etat = actuel && actuel.campagne;
    if (etat && etat.etat === "en cours") etat.raison = d.comment ? d.comment.charAt(0).toUpperCase() + d.comment.slice(1) : "";
  });

  // ------------------------------------------------------------------ les demandes des écrans (comme le menu)
  // Renvoie { ok, recharger } : « recharger » = ce chapitre a un autre décor, la page doit être rechargée.
  function demander(monde, type, valeur) {
    actuel = monde;
    if (type === "chapitre" || type === "suivant") {
      const id = type === "suivant" ? (K.chapitres[(chapitre(monde.campagne.id).numero)] || {}).id : valeur, ch = chapitre(id);
      if (!ch || !estDebloque(ch)) return { ok: false };
      if (Tanks.CarteDuJour.decorDe(C.cartes.find((c) => c.id === ch.carte)) !== Tanks.CarteDuJour.decor) {
        progression().enCours = { id: ch.id, carte: ch.carte };
        Tanks.Sauvegarde.ecrire("campagne : nouveau décor", true);
        radio.emettre("campagne-decor", { numero: ch.numero, carte: ch.carte });
        return { ok: true, recharger: true };
      }
      return { ok: preparer(monde, id) };
    }
    if (type === "commencer") return { ok: commencer(monde) };
    if (type === "rejouer") {
      const id = monde.campagne && monde.campagne.id;
      return { ok: !!id && preparer(monde, id) && commencer(monde) };
    }
    if (type === "difficulte") return { ok: choisirDifficulte(valeur) }; // (demande 90)
    if (type === "classe") return { ok: Tanks.Equipement.demander(monde, "classe", valeur) };
    if (type === "abandonner") {
      if (monde.campagne && monde.campagne.etat === "en cours") echouer(monde, "Mission abandonnée");
      return { ok: true };
    }
    if (type === "quitter") {
      quitter(monde, valeur);
      return { ok: true, recharger: Tanks.CarteDuJour.decorDe(C.cartes.find((c) => c.id === monde.carte)) !== Tanks.CarteDuJour.decor };
    }
    return { ok: false };
  }

  return { demander, facteur, facteurDegats, difficulte, niveau, preparer, commencer, quitter, etape, points, progression, chapitre, estDebloque, get chapitres() { return K.chapitres; } };
})();
