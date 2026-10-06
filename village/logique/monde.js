// 🌍 LE MONDE : le chef d'orchestre des règles
//
// Le monde contient tout ce qui existe en ce moment : la carte, le stock de l'entrepôt, les bâtiments
// et leurs ouvriers, les jeunes pousses, les routes, les porteurs et leur file d'attente, la caméra (là où l'on regarde), la case sous la souris…
// À chaque petit pas de temps (1/120 s), `etape` applique les intentions du joueur
// (glisser, zoomer, construire, choisir) puis fait vivre le village.
//
// Il ne dessine jamais : c'est le travail du peintre.

window.Village = window.Village || {};

Village.Monde = (function () {
  const C = Village.CONFIG;
  const radio = Village.Evenements;
  const L = C.carte.largeurCase, Hc = C.carte.hauteurCase;
  const E = Village.Ecran;

  // `partie` vient de la sauvegarde (null pour une carte toute neuve).
  function creer(graine, partie, cameraSauvee) {
    const carte = Village.Carte.inventer(graine);
    const monde = {
      carte,
      temps: 0, // secondes depuis le début de la partie
      camera: { x: 0, y: 0, zoom: C.camera.zoomDepart },
      survol: null, // la case sous la souris
      souris: null, // { ecranX, ecranY, mondeX, mondeY, colonne, ligne } avec les virgules
      choisie: null, // la dernière case touchée
      // Étape 2
      stock: Object.assign({}, C.depart),
      batiments: [],
      occupees: new Map(), // numéro de case → bâtiment posé dessus
      reservees: new Set(), // les cases où un ouvrier va travailler
      pousses: new Map(), // numéro de case → âge de la pousse (s)
      modifs: new Map(), // numéro de case → { o, r } : ce qui a changé depuis l'invention de la carte
      changements: 0, // combien de fois la carte a changé (le peintre refait la mini-carte quand ça bouge)
      construction: null, // le bâtiment qu'on est en train de placer (ex. "scierie"), ou null
      selection: null, // le bâtiment touché (son panneau s'affiche)
      // Étape 3
      route: new Uint8Array(carte.colonnes * carte.lignes), // 1 = une route sur cette case
      reseau: new Set(), // les routes reliées à l'entrepôt
      porteurs: [],
      file: [], // la file d'attente des livraisons
      outil: null, // "route" ou "demolir" quand on utilise un de ces outils
      // Étape 12 : l'aperçu avant de valider (logique/placement.js)
      projet: null, // le bâtiment transparent qu'on place ou qu'on déplace
      trace: null, // la route qu'on trace : { depart, cases, pret }
      prise: null, // ce que le doigt tient : "projet" ou "trace"
      age: 0, // étape 6 : le numéro de l'âge (0 = le campement)
      // Étape 7
      gemmes: 0, // 💎 gagnées en jouant (missions, nouveaux âges)
      recherches: { faites: [], enCours: null }, // 🎓 les recherches de l'université
      missions: { actuelle: null, attente: 45, derniere: null, reussies: [] }, // 📜 la première arrive après 45 s
      drapeau: 0, // la couleur du drapeau du village (achetée à la boutique)
      // Étape 8
      pieces: 0, // 🪙 la monnaie du marché (ventes, missions du village)
      marche: { facteurs: {}, ventes: 0, achats: 0 }, // 🏪 les prix qui bougent (1 = prix normal), et les totaux
      logementBonus: 0, // 🛏️ places offertes à une partie commencée avant l'étape 8
      stats: null, // 📊 le carnet du compteur de l'entrepôt (logique/statistiques.js)
      // Étape 11
      reserve: { niveau: 1 }, // 📦 le silo de l'entrepôt (logique/reserve.js)
      rythme: {}, // ce que le village gagne ou perd par minute (gardé dans la sauvegarde)
      absence: null, // le résumé de la dernière absence (affiché au retour)
      derniereVue: Date.now(), // l'heure (vraie) de la dernière image du jeu
      pub: { attente: Village.Publicite.attente(), offre: null, vues: 0, jour: null, vuesDuJour: 0 }, // 📺
      froid: false, chauffage: 0, // 🥶 l'hiver au bourg
      // Étape 13
      villageois: [], // 👥 les villageois sans travail (logique/villageois.js)
      porteursBonus: 0, // places de manutentionnaire achetées à la boutique
      // Étape 15
      bonheur: { valeur: null, cible: null, humeur: null }, // 😊 la jauge (logique/bonheur.js) ; null = pas encore calculée
      gouts: { poissons: 0, viande: 0 }, // aliment → horloge du dernier repas où on en a mangé (au début : le repas d'hier soir)
      // Étape 4
      horloge: 0, // secondes depuis le début de LA PARTIE (sauvegardé) : c'est lui qui fait les saisons
      saison: null, // { nom, emoji, annee, avancement… } (voir logique/saisons.js)
      moment: null, // étape 9 : le moment de la journée { nom, noirceur, heure… } (seulement pour les yeux)
      animaux: [], // le gibier
      partis: 0, // les habitants qui ont quitté le village (trop faim)
    };
    if (cameraSauvee) Object.assign(monde.camera, cameraSauvee);
    else centrerSurLeVillage(monde);
    borner(monde);

    if (partie) restaurer(monde, partie);
    if (!partie || !partie.animaux) Village.Animaux.peupler(monde, Village.Hasard.creer(graine + 5).suivant);
    if (!partie) {
      // Une nouvelle partie : l'entrepôt est déjà construit, à côté du feu de camp.
      const v = carte.village;
      Village.Batiments.creer(monde, "entrepot", v.colonne + 2, v.ligne - 1, 1);
    }
    const porteursSauves = partie && partie.porteurs ? partie.porteurs.filter((d) => !d.parti) : null;
    if (porteursSauves) { monde.porteurs = []; for (const d of porteursSauves) { Village.Porteurs.ajouterPorteur(monde); Object.assign(monde.porteurs[monde.porteurs.length - 1], { faim: d.faim || 0, affame: !!d.affame, ventreVide: d.ventreVide || 0 }); } }
    else Village.Porteurs.creerTous(monde);
    // Étape 13 : les villageois sans travail
    if (partie && partie.villageois) for (const [x, y, faim] of partie.villageois) Village.Villageois.creer(monde, x, y, faim);
    else if (!partie) Village.Villageois.peupler(monde);
    Village.Routes.recalculerReseau(monde);
    monde.saison = Village.Saisons.lire(monde.horloge);
    monde.moment = Village.Saisons.lireJour(monde.horloge);
    Village.Statistiques.surveiller(monde); // étape 8 : le compteur se met à la porte de l'entrepôt
    radio.emettre("carte-inventee", {
      graine, colonnes: carte.colonnes, lignes: carte.lignes, compte: carte.compte, village: carte.village, rivieres: carte.rivieres.length,
      reprise: !!partie, batiments: monde.batiments.length, modifs: monde.modifs.size, routes: Village.Routes.compter(monde),
    });
    return monde;
  }

  // Remettre la carte comme on l'avait laissée : la graine refait la carte d'origine,
  // puis on rejoue la liste des changements, un par un.
  function restaurer(monde, partie) {
    const k = monde.carte;
    for (const [i, o, r, f] of partie.modifs || []) {
      k.objet[i] = o;
      k.reste[i] = r;
      if (f !== undefined) k.filon[i] = f; // étape 7 : les filons découverts par le géologue
      monde.modifs.set(i, { o, r, f: k.filon[i] });
    }
    for (const [i, age] of partie.pousses || []) if (k.objet[i] === Village.Carte.OBJET.pousse) monde.pousses.set(i, age);
    Village.Carte.compter(k);
    if (partie.stock) Object.assign(monde.stock, partie.stock);
    for (const i of partie.routes || []) monde.route[i] = 1;
    for (const i of partie.routesPierre || []) monde.route[i] = 2; // étape 7
    monde.horloge = partie.horloge || 0;
    monde.age = partie.age || 0;
    monde.gemmes = partie.gemmes || 0;
    monde.drapeau = partie.drapeau || 0;
    monde.pieces = partie.pieces || 0; // étape 8
    monde.logementBonus = partie.logementBonus || 0;
    monde.porteursBonus = partie.porteursBonus || 0; // étape 13
    if (partie.reserve) monde.reserve = { niveau: Math.max(1, partie.reserve.niveau || 1) }; // étape 11
    monde.rythme = Object.assign({}, partie.rythme);
    if (partie.derniereVue) monde.derniereVue = partie.derniereVue;
    if (partie.pub) Object.assign(monde.pub, { vues: partie.pub.vues || 0, jour: partie.pub.jour || null, vuesDuJour: partie.pub.vuesDuJour || 0 });
    if (partie.marche) monde.marche = { facteurs: Object.assign({}, partie.marche.facteurs), ventes: partie.marche.ventes || 0, achats: partie.marche.achats || 0 };
    if (partie.recherches) monde.recherches = { faites: (partie.recherches.faites || []).slice(), enCours: partie.recherches.enCours || null };
    if (partie.missions) Object.assign(monde.missions, partie.missions);
    monde.partis = partie.partis || 0;
    if (partie.bonheur !== undefined) monde.bonheur.valeur = partie.bonheur; // étape 15
    monde.gouts = partie.gouts ? Object.assign({}, partie.gouts) : { poissons: monde.horloge, viande: monde.horloge }; // une partie plus ancienne : ils viennent de manger
    for (const [x, y, sorte] of partie.animaux || []) Village.Animaux.creer(monde, x, y, sorte);
    for (const b of partie.batiments || []) {
      const nouveau = Village.Batiments.creer(monde, b.type, b.colonne, b.ligne, b.progres, b);
      nouveau.produits = b.produits || 0;
    }
  }

  // Changer l'objet d'une case (un arbre coupé, une pousse plantée…) ET noter le changement pour la sauvegarde.
  function changerObjet(monde, i, objet) {
    monde.carte.objet[i] = objet;
    monde.modifs.set(i, { o: objet, r: monde.carte.reste[i], f: monde.carte.filon[i] });
    monde.changements++;
    Village.Carte.compter(monde.carte);
  }

  function centrerSurLeVillage(monde) {
    const v = monde.carte.village;
    const p = Village.Iso.versMonde(v.colonne + 0.5, v.ligne + 0.5, L, Hc);
    monde.camera.x = p.x;
    monde.camera.y = p.y;
  }

  // Écran → monde : on enlève la caméra et le zoom (le calcul inverse du peintre).
  function ecranVersMonde(camera, x, y) {
    return { x: camera.x + (x - E.largeur / 2) / camera.zoom, y: camera.y + (y - E.hauteur / 2) / camera.zoom };
  }

  function caseSous(monde, x, y) {
    const m = ecranVersMonde(monde.camera, x, y);
    const g = Village.Iso.versGrille(m.x, m.y, L, Hc);
    return { m, g, k: Village.Carte.lireCase(monde.carte, Math.floor(g.colonne), Math.floor(g.ligne)) };
  }

  // La caméra ne doit pas partir trop loin de la carte.
  function borner(monde) {
    const k = monde.carte, cam = monde.camera;
    cam.zoom = Math.min(C.camera.zoomMax, Math.max(C.camera.zoomMin, cam.zoom));
    const xMin = -k.lignes * (L / 2), xMax = k.colonnes * (L / 2);
    const yMax = (k.colonnes + k.lignes) * (Hc / 2);
    cam.x = Math.min(xMax, Math.max(xMin, cam.x));
    cam.y = Math.min(yMax, Math.max(0, cam.y));
  }

  // Un pas de temps. `intentions` vient de main.js : { dx, dy, zoom, souris, village, construire, outil, annuler }.
  function etape(monde, dt, intentions) {
    monde.temps += dt;
    monde.horloge += dt;
    Village.Saisons.etape(monde);
    camera(monde, dt, intentions);
    joueur(monde, intentions);
    Village.Batiments.etape(monde, dt);
    Village.Elevage.etape(monde, dt); // étape 15 : la santé des troupeaux
    Village.Porteurs.etape(monde, dt);
    Village.Animaux.etape(monde, dt);
    Village.Repas.etape(monde, dt);
    Village.Bonheur.etape(monde, dt); // étape 15 : le moral des habitants
    Village.Ages.etape(monde, dt);
    Village.Recherches.etape(monde, dt); // étape 7
    Village.Missions.etape(monde, dt); // étape 7
    Village.Marche.etape(monde, dt); // étape 8 : les prix reviennent vers la normale
    Village.Statistiques.etape(monde, dt); // étape 8 : le compteur tourne la page toutes les 10 s
    Village.Publicite.etape(monde, dt); // étape 11 : une proposition de pub, de temps en temps
    Village.Villageois.etape(monde, dt); // étape 13 : les villageois arrivent et vont travailler
    nature(monde, dt);
  }

  // En pause : on peut regarder partout et choisir une case, mais le village ne bouge pas.
  function etapeEnPause(monde, dt, intentions) {
    camera(monde, dt, intentions);
    joueur(monde, intentions);
  }

  function camera(monde, dt, intentions) {
    const cam = monde.camera, s = intentions.souris;
    cam.x += (intentions.dx * C.camera.vitesse * dt) / cam.zoom;
    cam.y += (intentions.dy * C.camera.vitesse * dt) / cam.zoom;
    if (s && !(monde.prise && s.doigts <= 1)) { // étape 12 : quand le doigt tient l'aperçu, la carte ne bouge pas
      cam.x -= s.glisseX / cam.zoom;
      cam.y -= s.glisseY / cam.zoom;
    }
    // Zoomer « là où est la souris » (ou entre les deux doigts) : ce point doit rester sous la souris.
    const facteur = Math.pow(C.camera.pasDeZoom, intentions.zoom || 0) * (s ? s.pince : 1);
    if (Math.abs(facteur - 1) > 1e-4) {
      const ancien = cam.zoom;
      const ancre = s && s.centrePince ? s.centrePince : s && s.dessus ? { x: s.x, y: s.y } : { x: E.largeur / 2, y: E.hauteur / 2 };
      const avant = ecranVersMonde(cam, ancre.x, ancre.y);
      cam.zoom = Math.min(C.camera.zoomMax, Math.max(C.camera.zoomMin, cam.zoom * facteur));
      const apres = ecranVersMonde(cam, ancre.x, ancre.y);
      cam.x += avant.x - apres.x;
      cam.y += avant.y - apres.y;
      // Avec les doigts, le zoom change un tout petit peu à chaque image : on ne l'annonce qu'à la molette.
      if (cam.zoom !== ancien && intentions.zoom) radio.emettre("zoom", { zoom: cam.zoom, ancien });
    }
    if (intentions.allerA) { cam.x = intentions.allerA.x; cam.y = intentions.allerA.y; } // un toucher sur la mini-carte
    if (intentions.village) {
      centrerSurLeVillage(monde);
      radio.emettre("retour-village", { colonne: monde.carte.village.colonne, ligne: monde.carte.village.ligne });
    }
    borner(monde);

    if (s && s.dessus) {
      const r = caseSous(monde, s.x, s.y);
      monde.souris = { ecranX: s.x, ecranY: s.y, mondeX: r.m.x, mondeY: r.m.y, colonne: r.g.colonne, ligne: r.g.ligne };
      monde.survol = r.k;
    } else {
      monde.souris = null;
      monde.survol = null;
    }
  }

  // Étape 11 : tout ce que fait le joueur est marqué d'une étoile ★ par le compteur des statistiques.
  function joueur(monde, intentions) { Village.Statistiques.horsCompte(monde, () => joueurSansCompte(monde, intentions)); }
  function joueurSansCompte(monde, intentions) {
    const s = intentions.souris, B = Village.Batiments;
    // Étape 11 : la réserve, les pubs, le résumé de l'absence
    if (intentions.reserve) Village.Reserve.agrandir(monde, intentions.reserve);
    if (intentions.pub === "regarder") Village.Publicite.regarder(monde);
    else if (intentions.pub === "refuser") Village.Publicite.refuser(monde);
    if (intentions.absenceVue) monde.absence = null;
    // Étape 13 : améliorer un bâtiment, agrandir l'entrepôt
    if (intentions.ameliorer) { const b = monde.batiments.find((x) => x.numero === intentions.ameliorer); if (b) Village.Ameliorations.ameliorer(monde, b); }
    if (intentions.agrandirEntrepot) Village.Ameliorations.agrandir(monde);
    const Pl = Village.Placement;
    if (intentions.construire) {
      // Appuyer 2 fois sur le même bouton = annuler.
      monde.construction = monde.construction === intentions.construire ? null : intentions.construire;
      monde.outil = null; monde.trace = null;
      monde.selection = null;
      radio.emettre(monde.construction ? "choix-construction" : "construction-annulee", { nom: B.TYPES[intentions.construire].nom, cout: B.cout(intentions.construire) });
      // Étape 12 : l'aperçu apparaît au milieu de l'écran ; on le déplace au doigt, puis ✅
      if (monde.construction) { const k = caseSous(monde, E.largeur / 2, E.hauteur / 2).k; Pl.commencer(monde, monde.construction, k ? k.colonne : monde.carte.village.colonne, k ? k.ligne : monde.carte.village.ligne); }
      else monde.projet = null;
    }
    if (intentions.outil) {
      // Étape 3 : les outils 🛤️ route et 🧹 démolir (étape 12 : et ↔️ déplacer, qui attend un toucher sur un bâtiment).
      monde.outil = monde.outil === intentions.outil ? null : intentions.outil;
      monde.construction = null; monde.projet = null; monde.trace = null;
      monde.selection = null;
      radio.emettre("choix-outil", { outil: monde.outil });
    }
    // Étape 12 : ✅ et ❌ (et la touche Entrée)
    if (intentions.valider) { if (monde.projet) Pl.valider(monde); else if (monde.trace && monde.trace.pret) Pl.validerRoute(monde); }
    if (intentions.annulerProjet) { if (monde.trace && (monde.trace.pret || monde.trace.depart)) Pl.annulerRoute(monde); else Pl.annuler(monde); }
    // Étape 7 : les recherches, les missions et la boutique (des boutons dans l'écran)
    if (intentions.recherche) Village.Recherches.lancer(monde, intentions.recherche);
    if (intentions.mission === "accepter") Village.Missions.accepter(monde);
    else if (intentions.mission === "plusTard") Village.Missions.plusTard(monde);
    else if (intentions.mission === "livrer") Village.Missions.livrer(monde);
    if (intentions.achat) Village.Boutique.acheter(monde, intentions.achat);
    // Étape 8 : vendre ou acheter au marché ({ sens: "vendre", quoi: "planches" })
    if (intentions.marche) { if (intentions.marche.sens === "vendre") Village.Marche.vendre(monde, intentions.marche.quoi); else Village.Marche.acheter(monde, intentions.marche.quoi); }
    if (intentions.annuler) {
      if (monde.construction) radio.emettre("construction-annulee", { nom: B.TYPES[monde.construction].nom });
      if (monde.trace && (monde.trace.pret || monde.trace.depart)) monde.trace = null; // d'abord : oublier la route en cours
      else if (monde.projet && monde.projet.deplacer) monde.projet = null; // ou le bâtiment qu'on déplaçait
      else monde.outil = null;
      monde.construction = null; monde.projet = null;
      monde.selection = null;
    }
    if (!s) return;
    // Étape 12 : le doigt (ou la souris) sur la carte
    const versCase = (pt) => caseSous(monde, pt.x, pt.y).k;
    const routeOutil = monde.outil === "route" || monde.outil === "routePierre";
    if (s.debutAppui) {
      const k = versCase(s.debutAppui), p = monde.projet;
      // On attrape l'aperçu (à 1 case près : un doigt n'est pas précis) : il suivra le doigt.
      if (k && p && Math.abs(k.colonne - p.colonne) <= 1 && Math.abs(k.ligne - p.ligne) <= 1) monde.prise = "projet";
      else if (k && routeOutil && !(monde.trace && monde.trace.pret)) { monde.prise = "trace"; Pl.debutGlisse(monde, k); }
    }
    if (monde.prise && s.doigts > 1) { monde.prise = null; if (monde.trace) monde.trace.cases = []; } // 2 doigts : on zoome
    if (monde.prise && s.enfoncee && s.dessus) {
      const k = versCase(s);
      if (k && monde.prise === "projet" && (k.colonne !== monde.projet.colonne || k.ligne !== monde.projet.ligne)) Pl.placer(monde, k.colonne, k.ligne);
      else if (k && monde.prise === "trace") Pl.ajouterCase(monde, k);
    }
    if (s.leve && monde.prise) { if (monde.prise === "trace") Pl.finGlisse(monde); monde.prise = null; }
    // ✍️ L'appui long sur un bâtiment : on le soulève pour le déplacer
    if (s.appuiLong && !monde.construction && !monde.outil && !monde.projet) {
      const k = versCase(s.appuiLong), b = k && monde.occupees.get(k.numero);
      if (b && b.type === "entrepot") radio.emettre("deplacement-impossible", { nom: "L'entrepôt", raison: "il reste au cœur du village" });
      else if (b) Pl.commencerDeplacement(monde, b);
    }
    if (!s.clic) return;
    const k = caseSous(monde, s.clic.x, s.clic.y).k;
    if (!k) return;
    if (monde.projet) {
      // Un toucher ailleurs : l'aperçu va là
      Pl.placer(monde, k.colonne, k.ligne);
      return;
    }
    if (routeOutil) { Pl.toucher(monde, k); return; }
    if (monde.outil === "deplacer") {
      const b = monde.occupees.get(k.numero);
      if (!b) { radio.emettre("deplacement-impossible", { nom: "Rien", raison: "touche d'abord un bâtiment (ou reste appuyé dessus)" }); return; }
      if (b.type === "entrepot") { radio.emettre("deplacement-impossible", { nom: "L'entrepôt", raison: "il reste au cœur du village" }); return; }
      Pl.commencerDeplacement(monde, b);
      return;
    }
    if (monde.outil === "demolir") {
      const b = monde.occupees.get(k.numero);
      if (b) B.demolir(monde, b);
      else if (!Village.Routes.demolir(monde, k.numero)) radio.emettre("demolition-impossible", { raison: "rien à démolir ici" });
      return;
    }
    monde.choisie = k;
    monde.selection = monde.occupees.get(k.numero) || null;
    radio.emettre("case-choisie", Object.assign({ batiment: monde.selection ? B.TYPES[monde.selection.type].nom : null }, k));
  }

  // Les pousses grandissent. Au bout de 60 s, elles deviennent de vrais arbres.
  // En hiver, rien ne pousse (étape 4).
  function nature(monde, dt) {
    const O = Village.Carte.OBJET, k = monde.carte;
    if (monde.saison && monde.saison.hiver) return;
    for (const [i, age] of monde.pousses) {
      const nouvelAge = age + dt;
      if (nouvelAge < C.nature.croissance) { monde.pousses.set(i, nouvelAge); continue; }
      monde.pousses.delete(i);
      // Comme à l'invention de la carte : plus c'est haut, plus il y a de sapins.
      const sapin = k.altitude[i] > (k.seuils.sable + k.seuils.rochers) / 2;
      changerObjet(monde, i, sapin ? O.sapin : O.arbre);
      radio.emettre("arbre-pousse", { colonne: i % k.colonnes, ligne: Math.floor(i / k.colonnes), sorte: sapin ? "sapin" : "arbre", arbres: k.compte.arbres });
    }
  }

  return { creer, etape, etapeEnPause, ecranVersMonde, changerObjet };
})();
