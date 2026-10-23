// 🎖️ LA PROGRESSION : le sergent instructeur et son carnet de notes (demande 97)
//
// ✍️ « Lance les déblocages. » Le sergent instructeur regarde tout ce que tu fais pendant la bataille et te donne des
// POINTS D'EXPÉRIENCE (« XP ») : un ennemi abattu, un tir à la tête, un tank détruit, un soin, un ami relevé, un ennemi
// marqué, un objectif, une victoire… (les nombres sont dans config.js, « progression.points »).
//   - Tes XP te font monter de NIVEAU DE JOUEUR (comme les grades) : chaque niveau demande un peu plus de points que le
//     précédent (« base + pas × (niveau − 1) »). Un nouveau niveau DÉBLOQUE des armes (celles dont le « niveau » est atteint).
//   - Chaque ARME a aussi son propre carnet : les ennemis abattus AVEC elle lui donnent des points, et son NIVEAU D'ARME
//     débloque ses pièces et ses peintures, une par une.
//   - Au début : la 1re arme de chaque classe, le 1er pistolet et la 1re pièce de chaque liste sont débloqués.
//   - (demande 98) Les GADGETS et les EXPLOSIFS aussi : le 1er de chaque classe est libre, le 2e se débloque à son
//     « niveau » de joueur (config.js : « gadgets », « explosifs »).
//   - ✍️ Tout est écrit dans la sauvegarde (donnees/sauvegarde.js) : ta progression est gardée quand tu reviens.
// Il compte aussi le BILAN de la bataille en cours (les XP par catégorie), que l'écran de fin montre en barres.
// Pour tester seulement : l'adresse « …/tanks/index.html?toutdebloquer=1 » débloque tout (sans rien écrire dans la sauvegarde).
// Ce fichier ne dessine rien : il annonce « xp », « niveau-joueur », « niveau-arme » et « bilan-xp » à la radio.

window.Tanks = window.Tanks || {};

Tanks.Progression = (function () {
  const C = Tanks.CONFIG, P = C.progression, radio = Tanks.Evenements;
  const carnet = () => Tanks.Sauvegarde.donnees.progression;
  let toutDebloque = false;
  try { toutDebloque = new URLSearchParams(location.search).get("toutdebloquer") === "1"; } catch (e) { /* (pas d'adresse : on ne débloque rien) */ }

  const fiche = (id) => C.armesPrincipales[id] || C.pistolets[id];

  // ------------------------------------------------------------------ LES NIVEAUX
  // Combien de points pour passer du niveau n au n+1 ?
  const marche = (courbe, n) => courbe.base + courbe.pas * (n - 1);
  // Le niveau atteint avec « xp » points : { niveau, dans (les points déjà faits dans ce niveau), pour (ceux qu'il faut), max }
  function niveauDe(xp, courbe) {
    let n = 1, reste = Math.max(0, Math.floor(xp || 0));
    while (n < courbe.max && reste >= marche(courbe, n)) (reste -= marche(courbe, n)), n++;
    const max = n >= courbe.max;
    return { niveau: n, dans: max ? 0 : reste, pour: max ? 0 : marche(courbe, n), max, xp: Math.floor(xp || 0) };
  }
  // Le total de points qu'il faut pour ATTEINDRE le niveau n.
  const xpDuNiveau = (n, courbe) => { let t = 0; for (let k = 1; k < n; k++) t += marche(courbe, k); return t; };
  const niveauJoueur = () => niveauDe(carnet().xp, P.joueur);
  const niveauArme = (id) => niveauDe((carnet().armes || {})[id] || 0, P.arme);

  // ------------------------------------------------------------------ CE QUI EST DÉBLOQUÉ
  const cadeau = (id) => (carnet().cadeaux.armes || []).includes(id);
  function armeDebloquee(id) {
    const F = fiche(id);
    return !!F && (toutDebloque || (F.niveau || 0) <= niveauJoueur().niveau || cadeau(id));
  }
  function pieceDebloquee(armeId, emp, pieceId) {
    const A = C.atelier[emp], p = A && A.pieces.find((x) => x.id === pieceId);
    if (!p) return false;
    if (p.boutique) return toutDebloque || (!!Tanks.Boutique && Tanks.Boutique.possede("peinture:" + p.id)); // (livre n° 28 : les peintures rares s'achètent)
    if (toutDebloque || p === A.pieces[0] || (p.niveau || 0) <= niveauArme(armeId).niveau) return true;
    return ((carnet().cadeaux.pieces || {})[armeId] || []).includes(emp + ":" + pieceId);
  }
  // (demande 98) Un gadget ou un explosif (type : "gadget" ou "explosif") : le 1er de la liste de sa classe est toujours
  // libre ; les autres, quand ton niveau de joueur atteint leur « niveau ».
  const ficheOutil = (type, id) => (type === "gadget" ? C.gadgets : C.explosifs)[id];
  function outilDebloque(classe, type, id) {
    const K = C.classes[classe], liste = K && K[type + "s"], F = ficheOutil(type, id);
    if (!F || !liste || !liste.includes(id)) return false;
    return toutDebloque || id === liste[0] || (F.niveau || 0) <= niveauJoueur().niveau;
  }
  // Les gadgets et explosifs débloqués pile au niveau n (pas le 1er d'une classe : il est libre).
  function outilsAuNiveau(n) {
    const l = [];
    for (const type of ["gadget", "explosif"]) {
      const vus = {};
      for (const k in C.classes) for (const id of C.classes[k][type + "s"].slice(1)) {
        const F = ficheOutil(type, id);
        if (vus[id] || (F.niveau || 0) !== n || Object.keys(C.classes).some((k2) => C.classes[k2][type + "s"][0] === id)) continue;
        vus[id] = true;
        l.push({ id, type, nom: F.nom, icone: F.icone, classe: Object.keys(C.classes).filter((k2) => C.classes[k2][type + "s"].includes(id)).map((k2) => C.classes[k2].nom).join(", ") });
      }
    }
    return l;
  }
  // Les armes débloquées pile au niveau de joueur n, et les pièces d'une arme débloquées pile à son niveau n.
  const toutesLesArmes = () => Object.keys(C.armesPrincipales).concat(Object.keys(C.pistolets));
  const armesAuNiveau = (n) => toutesLesArmes().filter((id) => (fiche(id).niveau || 0) === n);
  function piecesAuNiveau(armeId, n) {
    const l = [], E = Tanks.Equipement;
    for (const emp of E.emplacementsDe(armeId)) for (const p of E.piecesDe(armeId, emp)) if ((p.niveau || 0) === n && p !== C.atelier[emp].pieces[0]) l.push({ emp, id: p.id, nom: p.nom, icone: C.atelier[emp].icone });
    return l;
  }
  // La prochaine chose à débloquer pour une arme (pour l'armurerie : « Prochain : Lunette ×4 au niveau 5 »).
  function prochainePiece(armeId) {
    const n = niveauArme(armeId).niveau;
    for (let k = n + 1; k <= P.arme.max; k++) { const l = piecesAuNiveau(armeId, k); if (l.length) return { niveau: k, pieces: l }; }
    return null;
  }
  // Combien de choses sont débloquées (pour « sous le capot »).
  function comptes() {
    const E = Tanks.Equipement, armes = toutesLesArmes();
    let pieces = 0, piecesTotal = 0;
    for (const a of armes) for (const emp of E.emplacementsDe(a)) for (const p of E.piecesDe(a, emp)) (piecesTotal++), pieceDebloquee(a, emp, p.id) && pieces++;
    // (demande 98) les gadgets et les explosifs (chaque paire « classe + outil » compte une fois)
    let outils = 0, outilsTotal = 0;
    for (const k in C.classes) for (const type of ["gadget", "explosif"]) for (const id of C.classes[k][type + "s"]) (outilsTotal++), outilDebloque(k, type, id) && outils++;
    return { armes: armes.filter(armeDebloquee).length, armesTotal: armes.length, pieces, piecesTotal, outils, outilsTotal };
  }

  // ------------------------------------------------------------------ LE BILAN DE LA BATAILLE EN COURS
  let bataille = null, monde = null;
  function commencer(mode) {
    bataille = { mode, total: 0, categories: {}, armes: {}, depart: niveauJoueur(), departArmes: {}, debloques: [], niveaux: [], fini: false, eliminations: {}, mvp: false };
  }
  // ✍️ GAGNER des points. cle : la ligne de « progression.points » ; fois : combien de fois ; armeId : l'arme qui gagne aussi.
  function gagner(cle, fois, armeId) {
    const R = P.points[cle];
    if (!R || !(fois > 0)) return;
    // (livre n° 28) l'avancement « Double XP » de la boutique : × 2 (jamais sur la promotion achetée elle-même)
    const fois2 = cle === "boutique" || !Tanks.Boutique ? 1 : Tanks.Boutique.multiplicateurXP();
    const c = carnet(), xp = Math.round(R.xp * fois * fois2), avant = niveauJoueur();
    c.xp = (c.xp || 0) + xp;
    let xpArme = 0, avantArme = null, F = armeId && fiche(armeId);
    if (F && R.arme) {
      avantArme = niveauArme(armeId);
      xpArme = Math.round(R.arme * fois);
      c.armes[armeId] = (c.armes[armeId] || 0) + xpArme;
    }
    if (bataille && !bataille.fini) {
      const k = (bataille.categories[cle] = bataille.categories[cle] || { xp: 0, nombre: 0 });
      k.xp += xp;
      k.nombre += fois;
      bataille.total += xp;
      if (F && xpArme) {
        if (!bataille.departArmes[armeId]) bataille.departArmes[armeId] = avantArme;
        bataille.armes[armeId] = (bataille.armes[armeId] || 0) + xpArme;
      }
    }
    radio.emettre("xp", { cle, nom: R.nom, icone: R.icone, xp, fois, total: c.xp, arme: F ? F.nom : null, xpArme, double: fois2 > 1 });
    // un NIVEAU DE JOUEUR de plus ? (on peut en sauter plusieurs d'un coup : on annonce chacun)
    const apres = niveauJoueur();
    for (let n = avant.niveau + 1; n <= apres.niveau; n++) {
      const armes = armesAuNiveau(n).map((id) => ({ id, nom: fiche(id).nom, classe: fiche(id).classe ? Object.keys(C.classes).filter((k) => C.classes[k].armes.includes(id) || (C.classes[k].armesBonus || []).includes(id)).map((k) => C.classes[k].nom + ((C.classes[k].armesBonus || []).includes(id) ? " (arme bonus)" : "")).join(", ") : "Pistolet" })); // (livre n° 6 : + les armes bonus)
      const outils = outilsAuNiveau(n); // (demande 98 : les gadgets et les explosifs)
      if (bataille) bataille.niveaux.push(n), bataille.debloques.push(...armes.map((a) => ({ groupe: "Armes", nom: a.nom })), ...outils.map((o) => ({ groupe: o.type === "gadget" ? "Gadgets" : "Explosifs", nom: o.icone + " " + o.nom })));
      radio.emettre("niveau-joueur", { niveau: n, armes, outils });
    }
    if (F && xpArme) {
      const na = niveauArme(armeId);
      for (let n = avantArme.niveau + 1; n <= na.niveau; n++) {
        const pieces = piecesAuNiveau(armeId, n);
        if (bataille) bataille.debloques.push(...pieces.map((p) => ({ groupe: F.nom, nom: p.icone + " " + p.nom })));
        radio.emettre("niveau-arme", { id: armeId, arme: F.nom, niveau: n, pieces });
      }
    }
    Tanks.Sauvegarde.ecrire("xp", true);
  }

  // (livre n° 28) LA PROMOTION de la boutique : juste assez de points pour le niveau de joueur suivant (false : déjà au max).
  function promotion() {
    const n = niveauJoueur();
    if (n.max) return false;
    gagner("boutique", xpDuNiveau(n.niveau + 1, P.joueur) - Math.floor(carnet().xp || 0));
    return true;
  }

  // ✍️ LES OREILLES DU SERGENT : chaque événement de la bataille, avec les vrais objets (logique/monde.js l'appelle).
  // deToi : c'est toi qui as tiré (à pied, dans ton tank, dans un engin).
  function noter(m, nom, d, deToi) {
    monde = m;
    if (!bataille || bataille.fini || m.phase !== "bataille") return;
    const toi = m.toi && m.toi.soldat;
    // l'arme qui gagne les points : celle que ton SOLDAT tenait (pas ton tank)
    const armeDe = (d) => {
      if (!toi || d.tireur !== toi || !toi.armes) return null;
      // (fusil à pompe incendiaire : le feu compte pour lui ; livre n° 6 : il peut aussi être l'arme bonus)
      if (d.par === "feu") return (toi.armes.bonus && toi.armes.bonus.stats.incendiaire ? toi.armes.bonus : toi.armes.principale).id;
      // (livre n° 6) une balle : l'arme EN MAIN (le pistolet, l'arme principale ou l'arme bonus de l'Ingénieur)
      if (d.par === "balle") return toi.arme === "pistolet" || toi.arme === "principale" || (toi.arme === "bonus" && toi.armes.bonus) ? toi.armes[toi.arme].id : null;
      const P2 = toi.armes.principale;
      return ["roquette", "at4", "javelin"].includes(d.par) || (nom !== "soldat-mort" && toi.arme === "principale" && P2.stats.famille === "roquettes") ? P2.id : null;
    };
    const ennemi = d.cible && d.cible.equipe && d.cible.equipe !== "bleus";
    // (pour le MVP : qui, dans ton camp, a abattu le plus d'ennemis ?)
    if (ennemi && ["soldat-mort", "detruit", "abattu", "pilote-abattu"].includes(nom) && d.tireur && d.tireur.equipe === "bleus") {
      const qui = deToi ? "toi" : d.tireur.nom || "?";
      bataille.eliminations[qui] = (bataille.eliminations[qui] || 0) + 1;
    }
    if (!deToi && !(nom === "soigne" || nom === "releve" || nom === "reparation" || nom === "marque")) return;
    if (nom === "soldat-mort" && ennemi) gagner("ennemi", 1, armeDe(d));
    else if (nom === "soldat-tombe" && ennemi && d.genre === "tete") gagner("tete", 1, armeDe(Object.assign({}, d, { par: "balle" })));
    else if ((nom === "detruit" || nom === "abattu") && ennemi) gagner(m.chars.includes(d.cible) ? "tank" : "vehicule", 1, armeDe(d)); // (un tank n'a pas de « genre » : il est dans monde.chars)
    else if (nom === "pilote-abattu" && ennemi) gagner("vehicule", 1, armeDe(Object.assign({}, d, { par: "balle" })));
    else if (nom === "soigne" && d.cible !== "toi") gagner("soin", 1);
    else if (nom === "releve") gagner("releve", 1);
    else if (nom === "reparation") gagner("reparation", 1);
    else if (nom === "marque" && d.nouveaux > 0) gagner("marque", d.nouveaux);
  }

  // ✍️ LA FIN DE LA BATAILLE : la victoire (ou la participation), les étoiles de la campagne, le MVP ; puis le bilan.
  function finir(gagne, extra) {
    if (!bataille || bataille.fini) return;
    gagner(gagne ? "victoire" : "participation", 1);
    if (extra && extra.etoiles) gagner("etoile", extra.etoiles);
    const e = bataille.eliminations, moi = e.toi || 0, meilleur = Math.max(0, ...Object.keys(e).filter((k) => k !== "toi").map((k) => e[k]));
    if (moi >= P.mvp.minimum && moi >= meilleur) (bataille.mvp = true), gagner("mvp", 1);
    bataille.fini = true;
    bataille.arrivee = niveauJoueur();
    bataille.gagne = !!gagne;
    carnet().parties = (carnet().parties || 0) + 1;
    Tanks.Sauvegarde.ecrire("bilan d'expérience", true);
    radio.emettre("bilan-xp", { total: bataille.total, niveau: bataille.arrivee.niveau, depart: bataille.depart.niveau, mvp: bataille.mvp, categories: Object.keys(bataille.categories).length, debloques: bataille.debloques.length });
  }

  // (les débuts et les fins de bataille : on écoute la radio, pas besoin des vrais objets)
  radio.ecouter("bataille", () => commencer("bataille"));
  radio.ecouter("souterrain", () => commencer("souterrain"));
  radio.ecouter("campagne-debut", () => commencer("campagne"));
  radio.ecouter("victoire", () => monde && !monde.campagne && finir(true));
  radio.ecouter("defaite", () => monde && !monde.campagne && finir(false));
  radio.ecouter("campagne-reussie", (d) => finir(true, { etoiles: d.nbEtoiles }));
  radio.ecouter("campagne-echouee", () => finir(false));
  radio.ecouter("campagne-objectif", () => bataille && !bataille.fini && gagner("objectif", 1));

  return {
    niveauJoueur, niveauArme, niveauDe, xpDuNiveau, promotion, armeDebloquee, pieceDebloquee, outilDebloque, outilsAuNiveau, armesAuNiveau, piecesAuNiveau, prochainePiece, comptes, gagner, noter, finir,
    brancher: (m) => (monde = m), get bataille() { return bataille; }, get toutDebloque() { return toutDebloque; },
  };
})();
