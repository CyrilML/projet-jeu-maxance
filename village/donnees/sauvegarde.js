// 💾 LA SAUVEGARDE : la mémoire qui survit
//
// La carte, la caméra… tout s'efface quand on ferme la page : c'est la mémoire VIVE.
// Pour retrouver SA carte, on n'a pas besoin de ranger les 4 096 cases : il suffit de ranger la
// GRAINE (un seul numéro). Avec la même graine, l'inventeur refait exactement la même carte !
//
// Depuis l'étape 47, la carte CHANGE (arbres coupés, pousses plantées, rochers vidés). On range donc
// la graine PLUS la liste des changements : « case 1234 : plus rien », « case 2001 : une pousse »…
// Au rechargement, on refait la carte d'origine, puis on rejoue les changements un par un.
// C'est beaucoup plus petit que de ranger toute la carte.
//
// On range tout ça dans le « localStorage » du navigateur, sous une étiquette (une CLÉ),
// au format JSON. Ce tiroir est séparé de ceux des autres jeux (clé différente).
//
// Versions du format :
//   1 (étape 46) : la graine, le nombre de cartes inventées, de cases choisies, la caméra, le temps de jeu.
//   2 (étape 47) : la partie : le stock, les bâtiments, les changements de la carte, les pousses.
//                  Une sauvegarde en version 1 est convertie : sa carte est gardée, la partie commence.
//   3 (étape 48) : les routes (la liste des cases), et pour chaque bâtiment : ce qui attend devant la porte
//                  (sortie), les troncs en réserve (entree), et pour un chantier les matériaux arrivés (livre)
//                  et ceux encore réservés dans l'entrepôt (attendu). En version 2, les chantiers avaient
//                  déjà tout payé : on les convertit comme si tous leurs matériaux étaient arrivés.
//                  Les porteurs et la file d'attente ne sont pas sauvegardés : ils recommencent à zéro,
//                  et ce qu'un porteur avait dans les bras est remis à sa place.

window.Village = window.Village || {};

Village.Sauvegarde = (function () {
  const CLE = "village-maxance:sauvegarde";
  const VERSION = 3;
  const radio = Village.Evenements;

  function vide() {
    return {
      version: VERSION,
      graine: null, // le numéro de la carte en cours
      cartesInventees: 0,
      casesChoisies: 0,
      batimentsConstruits: 0, // depuis la version 2
      camera: null, // { x, y, zoom } : là où tu regardais en partant
      tempsDeJeu: 0, // secondes passées sur toutes les cartes
      // Depuis la version 2 : la partie en cours sur cette carte.
      //   stock : { troncs, planches, pierres }
      //   batiments : [{ type, colonne, ligne, progres, produits, sortie, entree, livre, attendu }]
      //   routes : [numéro de case, …] (depuis la version 3)
      //   modifs : [[numéro de case, objet, pierres restantes], …]
      //   pousses : [[numéro de case, âge en s], …]
      partie: null,
    };
  }

  let donnees = vide();

  function convertir(lues) {
    const d = Object.assign(vide(), lues);
    // Version 1 → 2 : il n'y avait pas encore de partie. On garde la carte (la graine) et la caméra.
    // Version 2 → 3 : pas encore de routes ; les chantiers avaient déjà payé tous leurs matériaux.
    if ((lues.version || 1) < 3 && d.partie) {
      d.partie.routes = d.partie.routes || [];
      for (const b of d.partie.batiments || []) {
        if (b.progres < 1 && !b.livre) { b.livre = Object.assign({}, (Village.CONFIG.batiments[b.type] || {}).cout); b.attendu = {}; }
      }
    }
    d.version = VERSION;
    return d;
  }

  function lire() {
    let trouve = false, converti = false, lueVersion = null;
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) {
        const lues = JSON.parse(texte);
        lueVersion = lues.version || 1;
        converti = lueVersion < VERSION;
        donnees = convertir(lues);
        trouve = true;
      }
    } catch (e) {
      donnees = vide();
    }
    radio.emettre("lecture", { trouve, converti, depuis: converti ? lueVersion : null, graine: donnees.graine });
    return donnees;
  }

  function ecrire(raison) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      radio.emettre("sauvegarde", { raison, octets: JSON.stringify(donnees).length });
    } catch (e) {
      // Navigation privée, stockage plein… le jeu continue sans sauvegarde.
    }
  }

  function effacer() {
    try { localStorage.removeItem(CLE); } catch (e) {}
    donnees = vide();
    radio.emettre("base-effacee");
  }

  // Ce que la sauvegarde écoute à la radio.
  radio.ecouter("carte-inventee", (d) => {
    if (donnees.graine === d.graine) return; // c'est la carte qu'on vient de relire : rien de neuf
    donnees.graine = d.graine;
    donnees.cartesInventees++;
    donnees.camera = null;
    donnees.partie = null;
  });
  radio.ecouter("case-choisie", () => { donnees.casesChoisies++; });
  radio.ecouter("batiment-pose", () => { donnees.batimentsConstruits++; });

  // Photographier la partie (le monde) et l'écrire dans le tiroir.
  function sauverPartie(monde, tempsEnPlus, raison) {
    donnees.graine = monde.carte.graine;
    donnees.camera = { x: Math.round(monde.camera.x), y: Math.round(monde.camera.y), zoom: Math.round(monde.camera.zoom * 100) / 100 };
    donnees.tempsDeJeu = Math.round(donnees.tempsDeJeu + tempsEnPlus);
    // Ce que les porteurs ont dans les bras retourne à sa place (dans l'entrepôt, ou réservé pour le chantier).
    const enCours = Village.Porteurs.enCours(monde);
    const stock = {};
    for (const r in monde.stock) stock[r] = monde.stock[r] + (enCours.stock[r] || 0);
    const ajout = (a, b) => { const r = Object.assign({}, a); for (const k in b || {}) r[k] = (r[k] || 0) + b[k]; return r; };
    donnees.partie = {
      stock,
      batiments: monde.batiments.map((b) => {
        const d = { type: b.type, colonne: b.colonne, ligne: b.ligne, progres: b.progres >= 1 ? 1 : Math.floor(b.progres * 100) / 100, produits: b.produits };
        if (b.sortie) d.sortie = b.sortie;
        if (b.entree) d.entree = b.entree;
        if (b.etat === "chantier") { d.livre = b.livre; d.attendu = ajout(b.attendu, enCours.attendu.get(b)); }
        return d;
      }),
      routes: monde.route.reduce((liste, v, i) => (v ? (liste.push(i), liste) : liste), []),
      modifs: [...monde.modifs].map(([i, m]) => [i, m.o, m.r]),
      pousses: [...monde.pousses].map(([i, age]) => [i, Math.round(age)]),
    };
    ecrire(raison);
  }

  return { CLE, lire, ecrire, effacer, sauverPartie, get donnees() { return donnees; } };
})();
