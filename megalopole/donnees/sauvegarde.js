// 💾 LA SAUVEGARDE : la mémoire de la ville (la « base de données »)
//
// Seul fichier qui touche au stockage du navigateur (localStorage, sous la clé « megalopole:sauvegarde »).
// On ne range pas tout : les cartes calculées (courant, valeur du terrain, trafic…) se recalculent au chargement.
// On range ce que le JOUEUR a fait : les routes, les zones, les niveaux des bâtiments, les gros bâtiments, l'argent…
//
// Les grands tableaux (12 544 cases) sont COMPRESSÉS avec un codage par plages : au lieu d'écrire « 0 » 500 fois,
// on écrit « 0x500 ». Une carte vide tient alors en quelques lettres :
//   [0, 0, 0, 0, 1, 1, 0]  →  « 0x4,1x2,0 »
//
// Versions du format :
//   1 (étape 1) : la première version.
//   2 (étape 2) : la difficulté, un taux d'impôt par zone (taux : { R, C, I, A }), le budget de chaque poste (postes),
//                 les prêts, l'état des routes et les mois dans le rouge. Une ville de la version 1 : le même taux pour
//                 les 4 zones, tous les postes à 100 %, pas de prêt, difficulté « Normal ».
//   3 (étape 3) : le guide (guide : { etape, fini, cache }). Une ville plus ancienne : le guide saute tout seul,
//                 sans rien dire, les missions qu'elle a déjà réussies.
//   4 (étape 5) : le numéro de la carte (carte : 2 = avec la mer, les rivières et les forêts). Une ville plus ancienne
//                 n'a pas ce numéro : elle garde la carte 1 (sinon ses routes tomberaient dans la mer !).
//   5 (étape 11) : ce que contient chaque décharge (rempli). Une ville plus ancienne n'a pas de décharge : rien à convertir.
//   6 (étape 17) : les étoiles de chaque bâtiment (etoiles) et le laboratoire (recherches : { faites, enCours }).
//                 Une ville plus ancienne : aucun bâtiment n'a d'étoile, aucune recherche n'est faite.
//   7 (étape 19) : les objectifs réussis, les monuments débloqués et les défis mis de côté (objectifs : { faits, monuments, cote }).
//                 Une ville plus ancienne : aucun objectif n'est encore réussi ; le tableau les validera tout seul s'ils sont déjà atteints.
//   8 (étape 20) : l'interrupteur des problèmes (problemesCoupes). Une ville plus ancienne : les problèmes sont activés.
//                 (Les problèmes en cours, eux, ne sont pas sauvegardés : un rechargement les efface.)

window.Megalopole = window.Megalopole || {};

Megalopole.Sauvegarde = (function () {
  const CLE = "megalopole:sauvegarde", C = Megalopole.CONFIG;
  const VERSION = 8;
  const radio = Megalopole.Evenements;

  function encoder(tab) {
    const morceaux = [];
    for (let i = 0; i < tab.length;) {
      let j = i;
      while (j < tab.length && tab[j] === tab[i]) j++;
      morceaux.push(j - i > 1 ? tab[i] + "x" + (j - i) : String(tab[i]));
      i = j;
    }
    return morceaux.join(",");
  }
  function decoder(texte, tab) {
    if (!texte) return tab;
    let i = 0;
    for (const m of texte.split(",")) {
      const [v, n] = m.split("x"), val = +v, fois = n ? +n : 1;
      for (let k = 0; k < fois && i < tab.length; k++) tab[i++] = val;
    }
    return tab;
  }

  function partieDe(monde) {
    return {
      temps: Math.round(monde.temps), mois: monde.mois, compteMois: Math.round(monde.compteMois),
      argent: Math.round(monde.argent), taux: monde.taux, palier: monde.palier,
      difficulte: monde.difficulte, postes: monde.postes, prets: monde.prets, etatRoutes: Math.round(monde.etatRoutes * 1000) / 1000, moisDansLeRouge: monde.moisDansLeRouge, renvoye: monde.renvoye, // étape 2
      carte: monde.carte.version, // étape 5
      guide: { etape: monde.guide.etape, fini: monde.guide.fini, cache: monde.guide.cache }, // étape 3
      routes: encoder(monde.route), zones: encoder(monde.zone), niveaux: encoder(monde.niveau), arbres: encoder(monde.carte.arbre),
      batiments: monde.batiments.concat(monde.enMain ? [monde.enMain.b] : []).map((b) => Object.assign({ type: b.type, colonne: b.colonne, ligne: b.ligne }, b.rempli ? { rempli: Math.round(b.rempli) } : {}, b.etoiles ? { etoiles: b.etoiles } : {})),
      problemesCoupes: !!(monde.problemes && monde.problemes.coupes), // étape 20
      objectifs: { faits: monde.objectifs.faits.slice(), monuments: monde.objectifs.monuments.slice(), cote: (monde.objectifs.cote || []).slice() }, // étape 19
      recherches: { faites: monde.recherches.faites.slice(), enCours: monde.recherches.enCours ? { id: monde.recherches.enCours.id, reste: Math.round(monde.recherches.enCours.reste) } : null }, // étape 17
      historique: monde.historique,
    };
  }
  function appliquer(monde, p) {
    monde.temps = p.temps || 0; monde.mois = p.mois || 0; monde.compteMois = p.compteMois || 0;
    monde.argent = p.argent; monde.palier = p.palier || 0;
    // étape 2 : la version 1 avait un seul taux (un nombre) → le même pour les 4 zones
    monde.taux = typeof p.taux === "number" ? { R: p.taux, C: p.taux, I: p.taux, A: p.taux } : Object.assign({}, monde.taux, p.taux);
    monde.difficulte = p.difficulte || "normal"; monde.postes = p.postes || {}; monde.prets = p.prets || [];
    monde.etatRoutes = p.etatRoutes === undefined ? 1 : p.etatRoutes; monde.moisDansLeRouge = p.moisDansLeRouge || 0; monde.renvoye = !!p.renvoye;
    monde.guide = p.guide ? Object.assign({ etape: 0, fini: false, cache: false }, p.guide) : { etape: 0, fini: false, cache: false, rattraper: true }; // étape 3
    decoder(p.routes, monde.route); decoder(p.zones, monde.zone); decoder(p.niveaux, monde.niveau);
    if (p.arbres) decoder(p.arbres, monde.carte.arbre);
    for (const b of p.batiments || []) Megalopole.Construction.remettre(monde, b);
    monde.historique = p.historique || [];
    // étape 17 : le laboratoire (une ville de la version 5 ou avant n'en a pas : rien n'est encore trouvé)
    monde.problemes = { coupes: !!p.problemesCoupes, prochain: 0, feux: [], effets: [], greve: null }; // étape 20
    monde.objectifs = p.objectifs ? { faits: (p.objectifs.faits || []).filter((id) => C.objectifs.some((o) => o.id === id)), monuments: (p.objectifs.monuments || []).filter((t) => C.batiments[t]), cote: p.objectifs.cote || [] } : { faits: [], monuments: [], cote: [] }; // étape 19
    monde.recherches = p.recherches ? { faites: (p.recherches.faites || []).filter((id) => C.recherches.some((r) => r.id === id)), enCours: p.recherches.enCours || null } : { faites: [], enCours: null };
  }

  function lire() {
    try {
      const texte = localStorage.getItem(CLE);
      if (!texte) return { graine: null };
      const d = JSON.parse(texte);
      radio.emettre("lecture", { trouve: true, version: d.version, graine: d.graine, taille: texte.length });
      return d;
    } catch (e) { radio.emettre("lecture", { trouve: false, erreur: String(e) }); return { graine: null }; }
  }
  function sauver(monde, raison) {
    const d = { version: VERSION, graine: monde.carte.graine, camera: monde.camera, partie: partieDe(monde) };
    try {
      const texte = JSON.stringify(d);
      localStorage.setItem(CLE, texte);
      radio.emettre("sauvegarde", { raison, taille: texte.length });
    } catch (e) { radio.emettre("sauvegarde-ratee", { erreur: String(e) }); }
  }
  function effacer() { try { localStorage.removeItem(CLE); } catch (e) {} }
  function brut() { try { return localStorage.getItem(CLE) || ""; } catch (e) { return ""; } }

  return { CLE, VERSION, encoder, decoder, lire, sauver, appliquer, effacer, brut };
})();
