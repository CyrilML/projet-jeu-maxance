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

window.Megalopole = window.Megalopole || {};

Megalopole.Sauvegarde = (function () {
  const CLE = "megalopole:sauvegarde";
  const VERSION = 2;
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
      routes: encoder(monde.route), zones: encoder(monde.zone), niveaux: encoder(monde.niveau), arbres: encoder(monde.carte.arbre),
      batiments: monde.batiments.map((b) => ({ type: b.type, colonne: b.colonne, ligne: b.ligne })),
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
    decoder(p.routes, monde.route); decoder(p.zones, monde.zone); decoder(p.niveaux, monde.niveau);
    if (p.arbres) decoder(p.arbres, monde.carte.arbre);
    for (const b of p.batiments || []) Megalopole.Construction.remettre(monde, b);
    monde.historique = p.historique || [];
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
