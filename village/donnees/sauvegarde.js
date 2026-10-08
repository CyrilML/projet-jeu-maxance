// 💾 LA SAUVEGARDE : la mémoire qui survit
//
// La carte, la caméra… tout s'efface quand on ferme la page : c'est la mémoire VIVE.
// Pour retrouver SA carte, on n'a pas besoin de ranger les 4 096 cases : il suffit de ranger la
// GRAINE (un seul numéro). Avec la même graine, l'inventeur refait exactement la même carte !
//
// Depuis l'étape 2, la carte CHANGE (arbres coupés, pousses plantées, rochers vidés). On range donc
// la graine PLUS la liste des changements : « case 1234 : plus rien », « case 2001 : une pousse »…
// Au rechargement, on refait la carte d'origine, puis on rejoue les changements un par un.
// C'est beaucoup plus petit que de ranger toute la carte.
//
// On range tout ça dans le « localStorage » du navigateur, sous une étiquette (une CLÉ),
// au format JSON. Ce tiroir est séparé de ceux des autres jeux (clé différente).
//
// Versions du format :
//   1 (étape 1) : la graine, le nombre de cartes inventées, de cases choisies, la caméra, le temps de jeu.
//   2 (étape 2) : la partie : le stock, les bâtiments, les changements de la carte, les pousses.
//                  Une sauvegarde en version 1 est convertie : sa carte est gardée, la partie commence.
//   3 (étape 3) : les routes (la liste des cases), et pour chaque bâtiment : ce qui attend devant la porte
//                  (sortie), les troncs en réserve (entree), et pour un chantier les matériaux arrivés (livre)
//                  et ceux encore réservés dans l'entrepôt (attendu). En version 2, les chantiers avaient
//                  déjà tout payé : on les convertit comme si tous leurs matériaux étaient arrivés.
//                  Les porteurs et la file d'attente ne sont pas sauvegardés : ils recommencent à zéro,
//                  et ce qu'un porteur avait dans les bras est remis à sa place.
//   4 (étape 4) : l'horloge de la partie (pour les saisons), la nourriture (poissons, viande) dans le stock,
//                  les repas gardés dans chaque cabane (jusqu'à la version 5), la faim de chaque ouvrier et de chaque porteur,
//                  les habitants partis, et les animaux (position et sorte).
//                  Une partie en version 3 reçoit la nourriture de départ (sinon tout le monde aurait faim !).
//   5 (étape 5)  : on mange à la cantine (l'entrepôt) : plus de repas gardés dans les cabanes.
//                  Les repas qui étaient dans les cabanes retournent dans le stock. Les rochers, eux,
//                  ont maintenant 8 pierres au départ. Ce qui attend devant une cabane peut valoir plus
//                  qu'un (un cerf = 4 viandes) : c'est la liste « lots ».
//   6 (étape 6)  : l'âge du village (age : 0 = le campement). Une partie plus ancienne qui avait déjà
//                  un géologue commence au hameau (sinon il serait construit « trop tôt »).
//   7 (étape 7)  : les 💎 gemmes, les recherches (faites et en cours), les missions, la couleur du drapeau,
//                  le nombre de porteurs, les filons découverts (4e nombre de chaque « modif »),
//                  et les routes en pierre (routesPierre).
//   8 (étape 8)  : les 🪙 pièces, les prix du marché (marche.facteurs), les nouvelles ressources (fer, lingots,
//                  outils), les places offertes (logementBonus), et pour chaque atelier ses ingrédients en réserve
//                  (entrees : { troncs: 2 }). Avant, la scierie avait seulement « entree » (des troncs) : on la
//                  convertit. Une partie plus ancienne reçoit une place offerte pour chacun de ses bâtiments :
//                  la nouvelle règle des logements ne fait partir personne.
//   9 (étape 11) : le niveau de la réserve (reserve), le rythme du village (rythme : ce qu'il gagne par minute),
//                  l'heure de la dernière image (derniereVue, pour calculer l'absence), les pubs regardées (pub),
//                  l'usure de chaque bâtiment (usure), et les ressources du bourg (blé, farine, pain, or, bijoux).
//                  Une partie plus ancienne commence avec une réserve au niveau 1 et un rythme vide.
//  11 (étape 13) : les villageois sans travail (villageois : [x, y, faim]), les places de porteur achetées
//                  (porteursBonus), et pour chaque bâtiment ses améliorations (ameliorations) et son niveau (niveau,
//                  pour l'entrepôt). Les porteurs dorment maintenant dans les lits : une partie plus ancienne reçoit
//                  une place offerte par porteur, et ses porteurs achetés deviennent des places achetées.
//  10 (étape 12) : le prix de chaque chantier (prix), car un bâtiment peut être offert (le coup de pouce).
//                  Un chantier plus ancien garde le prix normal de son bâtiment.
//  12 (étape 15) : le bonheur (la jauge, de 0 à 100), les goûts (gouts : aliment → horloge du dernier repas),
//                  les étables malades (malade : depuis combien de secondes) et les ressources de l'élevage (eau,
//                  foin, lait, beurre, fromage, yaourt). Rien à convertir : une partie plus ancienne commence à 0
//                  de chaque nouvelle ressource, et sa jauge part de sa note au premier calcul.
//  13 (étape 16) : les habits (habits : [secondes avant la prochaine distribution, part des habitants servis]),
//                  et les ressources des poules, des moutons et des cochons (oeufs, laine, tissu, vetements,
//                  jambon). Rien à convertir : une partie plus ancienne commence à 0.
//  14 (étape 17) : pour chaque porteur d'un entrepôt secondaire, la place de son entrepôt (m). Une partie plus
//                  ancienne n'en a pas : tous ses porteurs habitent l'entrepôt principal. Si « Routes pavées » était
//                  déjà faite, toutes ses routes deviennent pavées au chargement.
//  15 (étape 18) : la jauge d'évolution de chaque logement (evo, en secondes), et un nouveau type de logement
//                  (manoir : la maison bourgeoise). Rien à convertir : les huttes et les maisons partent de 0.
//  16 (étape 24) : la taille de la carte (taille). Une partie plus ancienne n'en a pas : elle garde sa carte de 64 × 64.
//                  Ses bâtiments, qui prennent maintenant 2 × 2 cases, sont déplacés au chargement s'ils manquent de place.
//  17 (étape 28) : les filons découverts (filonsVus : la liste des cases). Il n'y a plus de montagnes : elles deviennent
//                  un sol rocheux, et leurs filons sont cachés. Une partie plus ancienne voit les filons près de ses
//                  mines et ceux trouvés par un géologue ; les autres sont à découvrir.

window.Village = window.Village || {};

Village.Sauvegarde = (function () {
  const CLE = "village-maxance:sauvegarde";
  const VERSION = 17;
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
      //   batiments : [{ type, colonne, ligne, progres, produits, sortie, entrees, livre, attendu }]
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
    if ((lues.version || 1) < 8 && d.partie) {
      const batiments = d.partie.batiments || [];
      for (const b of batiments) if (b.entree) { b.entrees = { troncs: b.entree }; delete b.entree; }
      // Une place offerte pour chaque bâtiment au-delà des places du campement (même les chantiers).
      const avecOuvrier = batiments.filter((b) => b.type !== "entrepot").length;
      d.partie.logementBonus = Math.max(0, avecOuvrier - Village.CONFIG.logement.entrepot);
    }
    // (Après la conversion 7 → 8, qui calcule les places offertes aux ouvriers.)
    if ((lues.version || 1) < 11 && d.partie) {
      const porteurs = (d.partie.porteurs || []).filter((p) => !p.parti).length;
      d.partie.porteursBonus = Math.max(0, (d.partie.porteurs || []).length - Village.CONFIG.entrepot.porteurs);
      d.partie.logementBonus = (d.partie.logementBonus || 0) + porteurs;
    }
    if ((lues.version || 1) < 6 && d.partie && d.partie.age === undefined) {
      d.partie.age = (d.partie.batiments || []).some((b) => b.type === "geologue") ? 1 : 0;
    }
    if ((lues.version || 1) < 5 && d.partie && d.partie.stock) {
      for (const b of d.partie.batiments || []) {
        if (!b.repas) continue;
        d.partie.stock.poissons = (d.partie.stock.poissons || 0) + (b.repas.poissons || 0);
        d.partie.stock.viande = (d.partie.stock.viande || 0) + (b.repas.viande || 0);
        delete b.repas;
      }
    }
    if ((lues.version || 1) < 4 && d.partie && d.partie.stock) {
      d.partie.stock.poissons = d.partie.stock.poissons || Village.CONFIG.depart.poissons;
      d.partie.stock.viande = d.partie.stock.viande || Village.CONFIG.depart.viande;
    }
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
    radio.emettre("lecture", { trouve, converti, depuis: converti ? lueVersion : null, vers: VERSION, graine: donnees.graine });
    return donnees;
  }

  let bloquee = false; // étape 7 : après avoir chargé une copie, on n'écrit plus rien avant de recharger la page

  function ecrire(raison) {
    if (bloquee) return;
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
      taille: monde.carte.colonnes, // étape 24 : la taille de la carte (64 avant l'étape 24, 96 depuis)
      batiments: monde.batiments.map((b) => {
        const d = { type: b.type, colonne: b.colonne, ligne: b.ligne, progres: b.progres >= 1 ? 1 : Math.floor(b.progres * 100) / 100, produits: b.produits };
        if (b.sortie) { d.sortie = b.sortie; if (b.lots.some((q) => q !== 1)) d.lots = b.lots; }
        if (Object.values(b.entrees).some((n) => n > 0)) d.entrees = b.entrees; // étape 8
        if (b.usure > 0) d.usure = Math.round(b.usure * 1000) / 1000; // étape 11
        if (b.ameliorations) d.ameliorations = b.ameliorations; // étape 13
        if (b.niveau > 1) d.niveau = b.niveau;
        if (b.evolution) d.evo = Math.round(b.evolution); // étape 18
        if (b.malade) d.malade = Math.round(b.malade.depuis) || 1; // étape 15 : depuis combien de secondes
        if (b.etat === "chantier") { d.prix = b.prix; d.livre = b.livre; d.attendu = ajout(b.attendu, enCours.attendu.get(b)); } // étape 12 : le prix du chantier (il peut être offert)
        const o = b.ouvrier;
        if (o && o.faim) { d.faim = Math.round(o.faim); if (o.affame) { d.affame = true; d.ventreVide = Math.round(o.ventreVide); } }
        if (b.etat === "pret" && Village.Batiments.TYPES[b.type].metier && !o) d.vide = true; // l'habitant est parti
        return d;
      }),
      routes: monde.route.reduce((liste, v, i) => (v === 1 ? (liste.push(i), liste) : liste), []),
      routesPierre: monde.route.reduce((liste, v, i) => (v === 2 ? (liste.push(i), liste) : liste), []), // étape 7
      horloge: Math.round(monde.horloge),
      age: monde.age,
      gemmes: monde.gemmes,
      drapeau: monde.drapeau,
      pieces: monde.pieces, // étape 8
      reserve: monde.reserve, // étape 11
      villageois: monde.villageois.map((v) => [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10, Math.round(v.faim || 0)]), // étape 13
      porteursBonus: monde.porteursBonus,
      rythme: Village.Reserve.rythme(monde),
      derniereVue: monde.derniereVue,
      pub: { vues: monde.pub.vues, jour: monde.pub.jour, vuesDuJour: monde.pub.vuesDuJour },
      logementBonus: monde.logementBonus,
      marche: { facteurs: Object.fromEntries(Object.entries(monde.marche.facteurs).map(([r, f]) => [r, Math.round(f * 1000) / 1000])), ventes: monde.marche.ventes, achats: monde.marche.achats },
      recherches: { faites: monde.recherches.faites, enCours: monde.recherches.enCours && { id: monde.recherches.enCours.id, reste: Math.round(monde.recherches.enCours.reste) } },
      missions: { actuelle: monde.missions.actuelle && Object.assign({}, monde.missions.actuelle, { reste: Math.round(monde.missions.actuelle.reste) }), attente: Math.round(monde.missions.attente), derniere: monde.missions.derniere, reussies: monde.missions.reussies },
      partis: monde.partis,
      bonheur: monde.bonheur.valeur === null ? undefined : Math.round(monde.bonheur.valeur * 10) / 10, // étape 15
      gouts: monde.gouts,
      habits: [Math.round(monde.habits.minuteur), Math.round(monde.habits.part * 100) / 100], // étape 16
      porteurs: monde.porteurs.map((p) => { const d = { faim: Math.round(p.faim || 0), affame: !!p.affame, ventreVide: Math.round(p.ventreVide || 0), parti: !!p.parti }; if (p.maison && p.maison.type === "depot") d.m = monde.batiments.indexOf(p.maison); return d; }), // étape 17 : m = la place de son entrepôt secondaire
      animaux: monde.animaux.map((a) => [Math.round(a.x * 10) / 10, Math.round(a.y * 10) / 10, a.sorte]),
      modifs: [...monde.modifs].map(([i, m]) => (m.f ? [i, m.o, m.r, m.f] : [i, m.o, m.r])),
      pousses: [...monde.pousses].map(([i, age]) => [i, Math.round(age)]),
      filonsVus: monde.carte.revele.reduce((liste, v, i) => (v ? (liste.push(i), liste) : liste), []), // étape 28
    };
    ecrire(raison);
  }

  // Étape 7 : la copie de secours. On peut copier toute la base de données (du texte JSON), la garder
  // dans une note, et la recoller plus tard (ou sur un autre appareil).
  function exporter() { return JSON.stringify(donnees); }
  function importer(texte) {
    let lues;
    try { lues = JSON.parse(texte); } catch (e) { return "ce n'est pas une sauvegarde (le texte est abîmé)"; }
    if (!lues || typeof lues !== "object" || !lues.graine) return "ce n'est pas une sauvegarde du village";
    try { localStorage.setItem(CLE, JSON.stringify(lues)); } catch (e) { return "impossible d'écrire dans le navigateur"; }
    bloquee = true; // sinon la sauvegarde automatique écraserait la copie avant le rechargement
    radio.emettre("partie-importee", { graine: lues.graine, version: lues.version });
    return null;
  }

  return { CLE, lire, ecrire, effacer, sauverPartie, exporter, importer, get donnees() { return donnees; } };
})();
