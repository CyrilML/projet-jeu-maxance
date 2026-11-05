// 🚩 LA PERCÉE : l'arbitre de l'attaque et de la défense (demande 142)
//
// ✍️ « J'aimerais un nouveau mode de jeu attaque et défense, donc PERCÉE. Un camp doit rester à la base sur trois points
// et les défendre sans que l'ennemi les ait. L'attaque doit capturer ces points sans qu'elle perde tous ses renforts. À
// chaque point capturé, tu gagnes des renforts. »
// Imagine un ARBITRE avec un carnet et un chronomètre, debout au milieu du terrain :
//   1. LES 3 POINTS A, B, C sont chez la DÉFENSE, du front vers le fond de sa base. ✍️ Un seul est OUVERT à la fois :
//      au début A ; quand A tombe, B s'ouvre ; puis C (la ligne de front avance). Les autres sont VERROUILLÉS 🔒.
//   2. LA CAPTURE : 4 fois par seconde, l'arbitre compte les soldats (un tank compte pour 2) de chaque camp dans le cercle
//      du point ouvert. Plus d'attaquants que de défenseurs ? La barre monte (20 s pour 1 attaquant seul, plus vite à
//      plusieurs). Plus de défenseurs ? Elle redescend. Autant ? Le point est DISPUTÉ : la barre ne bouge plus.
//   3. ✍️ LA CONTRE-ATTAQUE : pendant que l'attaque est sur le point suivant, la défense peut REPRENDRE le dernier point
//      pris (plus de défenseurs que d'attaquants dans son cercle). Repris ? Le front recule : le point suivant se referme.
//   4. LES RENFORTS (les tickets) de l'ATTAQUE : 120 au départ ; chaque attaquant tombé (ou tank détruit) en coûte 1 ;
//      ✍️ chaque point capturé pour la PREMIÈRE fois en rapporte 40. La défense a des renforts sans fin.
//   5. LA FIN : les 3 points pris → l'attaque gagne ; plus de renforts, ou ✍️ les 15 minutes écoulées → la défense gagne.
//   6. LES RENFORTS ARRIVENT : un camp à qui il manque des soldats en fait arriver un toutes les 2 s, à son point
//      d'arrivée (l'attaque : derrière le front ; la défense : derrière le point ouvert). TOI aussi : à terre, tu
//      reviens au bout de quelques secondes (à pied, avec ta classe) au lieu de perdre la bataille.
// Tous les nombres sont dans config.js (« percee »). Ce fichier ne dessine rien : il renvoie des événements
// (« point-capture-commence », « point-capture », « renforts-gagnes », « percee-victoire »…) que le journal écrit.

window.Tanks = window.Tanks || {};

Tanks.Percee = (function () {
  const C = Tanks.CONFIG, P = C.percee, radio = Tanks.Evenements;
  const AUTRE = { bleus: "rouges", rouges: "bleus" };
  // ✍️ la Percée se joue dans les éditions où la grande carte est la même (pas de règle spéciale qui prend toute la place)
  const permise = !!(P && C.edition && P.editions.includes(C.edition.id));
  let voulu = null; // "attaque" ou "defense" : le camp choisi à l'accueil (null = bataille libre normale)
  const etat = { actif: false, camp: "attaque", attaque: "bleus", defense: "rouges", points: [], renforts: 0, temps: 0, pense: 0, chronoRenforts: 0,
    toiAttente: 0, arrives: { bleus: 0, rouges: 0 }, raison: "", fin: null, alerte: 1 };
  const bilan = { captures: 0, reprises: 0, gagnes: 0, perdus: 0, tombes: { bleus: 0, rouges: 0 }, renforts: { bleus: 0, rouges: 0 }, toiRevenu: 0, pensees: 0 };
  let graine = 1420;
  const h = () => ((graine = (graine * 1664525 + 1013904223) >>> 0) / 4294967296);
  const sensDe = (equipe) => (equipe === "bleus" ? 1 : -1); // (les Bleus au sud : z > 0)

  // ✍️ Choisir son camp à l'accueil (une DEMANDE : l'arbitre la note, le livret la retient)
  function choisir(camp) {
    if (!permise) return void radio.emettre("percee-refusee", { edition: C.edition.nom, raison: "pas dans cette édition" });
    voulu = camp === "defense" ? "defense" : "attaque";
    const S = Tanks.Sauvegarde;
    S.donnees.percee.camp = voulu;
    S.ecrire("percée : " + voulu, true);
    radio.emettre("percee-choix", { camp: voulu, nom: P.camps[voulu].nom });
  }
  function oublier() { voulu = null; } // (la porte ⚔️ BATAILLE : une bataille libre normale)

  // ✍️ Installer la Percée au début de la bataille (monde.js « lancer » l'appelle)
  function installer(monde) {
    etat.actif = !!(voulu && permise && !monde.campagne && !monde.metro);
    if (!etat.actif) return;
    const attaque = voulu === "attaque" ? "bleus" : "rouges", defense = AUTRE[attaque], sd = sensDe(defense);
    Object.assign(etat, { camp: voulu, attaque, defense, renforts: P.renforts.depart, temps: 0, pense: 0, chronoRenforts: 0, toiAttente: 0, arrives: { bleus: 0, rouges: 0 }, raison: "", fin: null, alerte: 1, note: false });
    Object.assign(bilan, { captures: 0, reprises: 0, gagnes: 0, perdus: 0, tombes: { bleus: 0, rouges: 0 }, renforts: { bleus: 0, rouges: 0 }, toiRevenu: 0, pensees: 0 });
    etat.points = P.points.map(([x, profondeur], k) => ({ lettre: "ABC"[k], nom: "le point " + "ABC"[k], x, z: sd * profondeur, y: Tanks.Terrain.hauteur(x, sd * profondeur),
      etat: k === 0 ? "ouvert" : "verrouille", prise: 0, presents: { bleus: 0, rouges: 0 }, dispute: false, deja: false, avance: "" }));
    for (const s of monde.soldats) s.perceeCompte = false;
    for (const c of monde.chars) c.perceeCompte = false;
    // les soldats de chaque camp partent de leur point d'arrivée (l'attaque derrière le front, la défense derrière A)
    for (const s of monde.soldats) if (!s.joueur) {
      const a = arrivee(s.equipe);
      Object.assign(s, { x: a.x + (h() - 0.5) * 120, z: a.z + (h() - 0.5) * 30 });
      s.y = Tanks.Terrain.hauteur(s.x, s.z);
    }
    // les tanks aussi : l'attaque à son point d'arrivée, la défense derrière le point A (toi : ton soldat reste assis dedans)
    const k = { bleus: 0, rouges: 0 };
    for (const c of monde.chars) {
      const a = arrivee(c.equipe), n = k[c.equipe]++;
      Object.assign(c, { x: a.x + (n - 2) * 22, z: a.z - sensDe(c.equipe) * 10 });
      c.y = Tanks.Terrain.hauteur(c.x, c.z);
    }
    const toi = monde.toi && monde.toi.soldat;
    if (toi && toi.dansUnEngin) Object.assign(toi, { x: toi.dansUnEngin.x, z: toi.dansUnEngin.z });
    radio.emettre("percee", { camp: voulu, attaque: C.equipes[attaque].nom, defense: C.equipes[defense].nom, renforts: etat.renforts, points: etat.points.length, limite: P.limite, rayon: P.rayon });
  }

  // Le point ouvert (celui qu'on se dispute), et le dernier pris (celui que la défense peut reprendre)
  const ouvert = () => etat.points.find((p) => p.etat === "ouvert") || null;
  const dernierPris = () => { let d = null; for (const p of etat.points) if (p.etat === "capture") d = p; return d; };
  const pris = () => etat.points.filter((p) => p.etat === "capture").length;
  // ✍️ Où arrivent les renforts : l'attaque à « recul » m derrière le front ; la défense à « recul » m derrière le point ouvert
  function arrivee(equipe) {
    const o = ouvert() || etat.points[etat.points.length - 1], sd = sensDe(etat.defense), R = P.arrivee;
    if (equipe === etat.defense) return { x: o.x * 0.5, z: sd * Math.min(Math.abs(o.z) + R.defense, C.monde.camp - 20) };
    const d = dernierPris();
    const z = d ? d.z - sd * R.attaque * 0.6 : o.z - sd * R.attaque;
    return { x: (d || o).x, z }; // (dans l'axe du point : loin des maisons du village au centre)
  }

  // Combien de soldats (un tank = 2) de chaque camp dans le cercle de chaque point ?
  function compter(monde) {
    const R2 = P.rayon * P.rayon;
    for (const p of etat.points) (p.presents.bleus = 0), (p.presents.rouges = 0);
    const ajouter = (x, z, equipe, n) => { for (const p of etat.points) { const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < R2) p.presents[equipe] += n; } };
    for (const s of monde.soldats) if (!s.mort && !s.parachute && !s.corde && !s.dansUnEngin) ajouter(s.x, s.z, s.equipe, 1);
    for (const c of monde.chars) if (!c.detruit && !c.resteDehors) ajouter(c.x, c.z, c.equipe, P.char);
    const t = monde.toi;
    if (t && t.soldat && t.soldat.dansUnEngin && t.engin && t.mode !== "char" && !t.engin.detruit && !t.engin.enVol) ajouter(t.engin.x, t.engin.z, "bleus", 1);
  }
  const toiDedans = (monde, p) => { const s = monde.toi && monde.toi.soldat, o = s && (s.dansUnEngin || s); return !!o && !s.mort && Math.hypot(o.x - p.x, o.z - p.z) < P.rayon; };

  // ✍️ UN PAS (4 fois par seconde pour les points)
  function etape(monde, dt) {
    const ev = [];
    if (!etat.actif || monde.phase !== "bataille") return ev;
    etat.temps += dt;
    etat.pense -= dt;
    if (etat.pense <= 0) {
      const pas = P.pense - etat.pense;
      etat.pense = P.pense;
      bilan.pensees++;
      compter(monde);
      const o = ouvert(), d = dernierPris();
      if (o) avancerPoint(monde, o, pas, ev, false);
      if (d && o) avancerPoint(monde, d, pas, ev, true); // (✍️ la contre-attaque : seulement tant qu'un point est encore ouvert)
      // les pertes de l'attaque coûtent des renforts
      for (const s of monde.soldats) if (s.mort && !s.perceeCompte) (s.perceeCompte = true), (bilan.tombes[s.equipe]++), s.equipe === etat.attaque && retirer(1, ev);
      for (const c of monde.chars) if (c.detruit && !c.perceeCompte && !c.resteDehors) (c.perceeCompte = true), c.equipe === etat.attaque && retirer(P.renforts.char, ev);
    }
    // les renforts arrivent (un soldat là où il en manque)
    etat.chronoRenforts += dt;
    if (etat.chronoRenforts >= P.arrivee.toutesLes) {
      etat.chronoRenforts = 0;
      for (const equipe of ["bleus", "rouges"]) renfort(monde, equipe, ev);
    }
    return ev;
  }
  // La barre d'un point : « prise » de 0 (à la défense) à 1 (capturé par l'attaque)
  function avancerPoint(monde, p, pas, ev, contre) {
    const a = p.presents[etat.attaque], d = p.presents[etat.defense], avant = p.prise;
    p.dispute = a > 0 && d > 0 && a === d;
    const ecart = a - d, vitesse = Math.min(P.plusieurs, 1 + (Math.abs(ecart) - 1) * 0.5) / P.capture;
    if (ecart > 0) p.prise = Math.min(1, p.prise + vitesse * pas), (p.avance = "l'attaque prend (" + a + " contre " + d + ")");
    else if (ecart < 0 && p.prise > 0) p.prise = Math.max(0, p.prise - vitesse * pas), (p.avance = "la défense reprend (" + d + " contre " + a + ")");
    else p.avance = p.dispute ? "⚔️ disputé (" + a + " contre " + d + ")" : a || d ? "tenu (" + a + " contre " + d + ")" : "calme";
    // l'attaque commence à prendre un point (la barre décolle de 0)
    if (!contre && avant === 0 && p.prise > 0) ev.push(["point-capture-commence", { lettre: p.lettre, nom: p.nom, attaque: etat.attaque, camp: etat.camp, x: p.x, z: p.z, attaquants: a, defenseurs: d, avecToi: toiDedans(monde, p) }]);
    if (!contre && p.prise >= 1) capturer(monde, p, ev);
    if (contre && p.prise <= 0) reprendre(monde, p, ev);
  }
  function capturer(monde, p, ev) {
    p.etat = "capture";
    p.prise = 1;
    bilan.captures++;
    const suivant = etat.points[etat.points.indexOf(p) + 1];
    let gain = 0;
    if (!p.deja) (p.deja = true), (gain = P.renforts.parPoint), (etat.renforts += gain), (bilan.gagnes += gain);
    if (suivant) (suivant.etat = "ouvert"), (suivant.prise = 0);
    ev.push(["point-capture", { lettre: p.lettre, nom: p.nom, attaque: etat.attaque, camp: etat.camp, gain, renforts: etat.renforts, pris: pris(), total: etat.points.length, suivant: suivant ? suivant.lettre : "", x: p.x, z: p.z, avecToi: toiDedans(monde, p) }]);
    if (gain) ev.push(["renforts-gagnes", { gain, renforts: etat.renforts, lettre: p.lettre, camp: etat.camp }]);
    if (!suivant) etat.fin = "attaque", (etat.raison = "les 3 points sont pris : la ligne de défense est percée !");
  }
  function reprendre(monde, p, ev) {
    p.etat = "ouvert";
    p.prise = 0;
    bilan.reprises++;
    const suivant = etat.points[etat.points.indexOf(p) + 1];
    if (suivant) (suivant.etat = "verrouille"), (suivant.prise = 0);
    ev.push(["point-repris", { lettre: p.lettre, nom: p.nom, defense: etat.defense, camp: etat.camp, ferme: suivant ? suivant.lettre : "", x: p.x, z: p.z, avecToi: toiDedans(monde, p) }]);
  }
  function retirer(n, ev) {
    const avant = etat.renforts;
    etat.renforts = Math.max(0, avant - n);
    bilan.perdus += avant - etat.renforts;
    const part = etat.renforts / P.renforts.depart;
    for (const seuil of [0.5, 0.25, 10 / P.renforts.depart, 0]) if (part <= seuil && etat.alerte > seuil) {
      etat.alerte = seuil;
      ev.push(["percee-renforts", { reste: etat.renforts, camp: etat.camp, attaque: etat.attaque }]);
      break;
    }
    if (part > 0.5) etat.alerte = 1; // (des renforts gagnés : on pourra re-prévenir)
    if (etat.renforts <= 0 && !etat.fin) etat.fin = "defense", (etat.raison = "l'attaque n'a plus de renforts : la défense tient ses points !");
  }
  function renfort(monde, equipe, ev) {
    if (equipe === etat.attaque && etat.renforts <= 0) return;
    const debout = monde.soldats.filter((s) => s.equipe === equipe && !s.mort && !s.joueur).length;
    if (debout >= P.soldats[equipe === etat.attaque ? "attaque" : "defense"] || Tanks.Troupes.place(monde, equipe) <= 0) return;
    const a = arrivee(equipe), x = a.x + (h() - 0.5) * 140, z = a.z + (h() - 0.5) * 30;
    const s = Tanks.Troupes.recrue(equipe, x, z, sensDe(equipe) > 0 ? -Math.PI / 2 : Math.PI / 2, "renfort " + (equipe === etat.attaque ? "de l'attaque" : "de la défense") + " n° " + ++etat.arrives[equipe]);
    s.ia.etat = "arrive en renfort";
    s.perceeCompte = false;
    monde.soldats.push(s);
    bilan.renforts[equipe]++;
    if (bilan.renforts[equipe] % 10 === 1) ev.push(["percee-arrivee", { equipe, nom: C.equipes[equipe].nom, role: equipe === etat.attaque ? "attaque" : "défense", arrives: bilan.renforts[equipe], renforts: etat.renforts, x, z }]);
  }

  // ✍️ TOI, À TERRE : au lieu de perdre, tu reviens (monde.js le demande quand tu es hors de combat). Renvoie true si
  // l'arbitre s'en occupe (la bataille continue).
  function toiHorsDeCombat(monde, dt) {
    if (!etat.actif) return false;
    if (etat.camp === "attaque" && etat.renforts <= 0) return false;
    if (etat.toiAttente <= 0) {
      etat.toiAttente = P.retour;
      radio.emettre("percee-redeploiement", { dans: P.retour, renforts: etat.renforts, camp: etat.camp });
      return true;
    }
    etat.toiAttente -= dt;
    if (etat.toiAttente > 0) return true;
    etat.toiAttente = 0;
    // un soldat neuf, avec ta classe, à ton point d'arrivée
    const t = monde.toi, ancien = t.soldat, a = arrivee("bleus"), x = a.x + (h() - 0.5) * 20, z = a.z;
    if (t.engin && t.engin.pilote) t.engin.pilote = false;
    const toi = Tanks.Soldat.creer("bleus", x, z, sensDe("bleus") > 0 ? -Math.PI / 2 : Math.PI / 2, "toi", true);
    const eq = Tanks.Equipement.equiper(toi);
    const i = monde.soldats.indexOf(ancien);
    if (i >= 0) monde.soldats.splice(i, 1);
    toi.perceeCompte = false;
    monde.soldats.push(toi);
    monde.toi = { mode: "pied", engin: null, soldat: toi };
    bilan.toiRevenu++;
    radio.emettre("percee-retour", { x: Math.round(x), z: Math.round(z), classe: C.classes[eq.classe].nom, fois: bilan.toiRevenu, renforts: etat.renforts });
    return true;
  }

  // ✍️ OÙ VA UN SOLDAT DE L'ORDINATEUR (troupes.js le demande quand il n'a pas d'ennemi en vue) : vers le point ouvert.
  // L'attaque s'y jette ; la défense le garde (la plupart dans le cercle, quelques-uns un peu en avant). Si l'attaque est
  // sur le point suivant, une partie de la défense contre-attaque le dernier point pris. Il garde son choix ~15 s.
  function but(s, monde) {
    if (!etat.actif || !s.ia) return null;
    const ia = s.ia, t = monde.temps, o = ouvert();
    if (!o) return null;
    if (!ia.percee || t > ia.perceeJusqua || (ia.percee.etat !== "ouvert" && ia.percee !== dernierPris())) {
      const d = dernierPris(), defense = s.equipe === etat.defense, r = h();
      ia.percee = defense && d && r < P.ia.contreAttaque ? d : o;
      ia.perceeAvant = defense && ia.percee === o && r > 1 - P.ia.enAvant; // (quelques défenseurs se postent en avant)
      ia.perceeJusqua = t + 12 + h() * 8;
      const ang = h() * Math.PI * 2, rr = h() * P.rayon * 0.7;
      ia.perceeEcart = [Math.cos(ang) * rr, Math.sin(ang) * rr];
    }
    const p = ia.percee, avant = ia.perceeAvant ? -sensDe(etat.defense) * P.ia.avance : 0;
    return { x: p.x + ia.perceeEcart[0], z: p.z + ia.perceeEcart[1] + avant, nom: p.nom + (ia.perceeAvant ? " (en avant)" : "") };
  }
  // ✍️ LA RUÉE (troupes.js la demande avant tout le reste) : certains attaquants foncent sur le point ouvert sans s'arrêter
  // pour tirer ; quand l'attaque prend le point (la barre monte), certains défenseurs y courent aussi. Choix gardé ~15 s.
  function ruee(s, monde) {
    if (!etat.actif || !s.ia || s.joueur) return null;
    const ia = s.ia, t = monde.temps, o = ouvert();
    if (!o) return null;
    if (ia.rueeJusqua === undefined || t > ia.rueeJusqua) {
      const attaque = s.equipe === etat.attaque, chance = attaque ? P.ia.ruee : o.prise > 0 ? P.ia.rueeDefense : 0;
      ia.ruee = h() < chance;
      ia.rueeJusqua = t + (attaque || o.prise > 0 ? 12 + h() * 8 : 3);
    }
    if (!ia.ruee) return null;
    const b = but(s, monde);
    return b && Math.hypot(o.x - s.x, o.z - s.z) > P.rayon * 0.7 ? { x: b.x, z: b.z, rayon: P.rayon * 0.5, nom: b.nom } : null;
  }
  // ✍️ Les TANKS : l'attaque appuie à « appui » m devant le point ouvert ; la défense se poste derrière le point
  function butChar(c, monde) {
    if (!etat.actif) return null;
    const o = ouvert();
    if (!o) return null;
    const sd = sensDe(etat.defense), cote = ((c.nom || "").length % 3 - 1) * 30;
    const z = c.equipe === etat.attaque ? o.z - sd * P.ia.appui : o.z + sd * P.ia.garde;
    return { x: o.x + cote, z, rayon: 25, nom: "point " + o.lettre };
  }

  // ✍️ LA FIN : « victoire » ou « defaite » vue par TOI (les Bleus), ou null
  function fin() {
    if (!etat.actif) return null;
    if (!etat.fin && P.limite > 0 && etat.temps >= P.limite) etat.fin = "defense", (etat.raison = "le temps est écoulé (" + Math.round(P.limite / 60) + " min) : la défense a tenu !");
    if (!etat.fin) return null;
    const gagnant = etat.fin === "attaque" ? etat.attaque : etat.defense;
    return gagnant === "bleus" ? "victoire" : "defaite";
  }
  // le livret retient les victoires et défaites de chaque camp, et le meilleur résultat (main.js / monde.js appelle à la fin)
  function noterFin(gagne) {
    if (!etat.actif || etat.note) return;
    etat.note = true;
    const S = Tanks.Sauvegarde.donnees.percee, cle = etat.camp;
    S[gagne ? "victoires" : "defaites"][cle]++;
    if (cle === "attaque" && gagne) S.meilleurAttaque = Math.max(S.meilleurAttaque || 0, etat.renforts);
    if (cle === "defense" && gagne) S.meilleurDefense = Math.max(S.meilleurDefense || 0, etat.points.length - pris()); // (les points encore tenus)
    radio.emettre("percee-victoire", { gagnant: etat.fin, camp: etat.camp, gagne, raison: etat.raison, pris: pris(), renforts: etat.renforts, temps: Math.round(etat.temps), captures: bilan.captures, reprises: bilan.reprises });
  }
  const tempsRestant = () => (P.limite > 0 ? Math.max(0, P.limite - etat.temps) : Infinity);
  return { get actif() { return etat.actif; }, get voulu() { return voulu; }, permise, etat, bilan, choisir, oublier, installer, etape, but, butChar, fin, noterFin, toiHorsDeCombat, ruee, ouvert, dernierPris, pris, tempsRestant, arrivee };
})();
