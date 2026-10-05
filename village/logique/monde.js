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
      routeDepart: null, // la première case touchée pour tracer une route
      aDeplacer: null, // étape 5 : le bâtiment qu'on est en train de déplacer
      // Étape 4
      horloge: 0, // secondes depuis le début de LA PARTIE (sauvegardé) : c'est lui qui fait les saisons
      saison: null, // { nom, emoji, annee, avancement… } (voir logique/saisons.js)
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
    Village.Porteurs.creerTous(monde);
    if (partie && partie.porteurs) partie.porteurs.forEach((d, n) => { if (monde.porteurs[n]) Object.assign(monde.porteurs[n], d); });
    Village.Routes.recalculerReseau(monde);
    monde.saison = Village.Saisons.lire(monde.horloge);
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
    for (const [i, o, r] of partie.modifs || []) {
      k.objet[i] = o;
      k.reste[i] = r;
      monde.modifs.set(i, { o, r });
    }
    for (const [i, age] of partie.pousses || []) if (k.objet[i] === Village.Carte.OBJET.pousse) monde.pousses.set(i, age);
    Village.Carte.compter(k);
    if (partie.stock) Object.assign(monde.stock, partie.stock);
    for (const i of partie.routes || []) monde.route[i] = 1;
    monde.horloge = partie.horloge || 0;
    monde.partis = partie.partis || 0;
    for (const [x, y, sorte] of partie.animaux || []) Village.Animaux.creer(monde, x, y, sorte);
    for (const b of partie.batiments || []) {
      const nouveau = Village.Batiments.creer(monde, b.type, b.colonne, b.ligne, b.progres, b);
      nouveau.produits = b.produits || 0;
    }
  }

  // Changer l'objet d'une case (un arbre coupé, une pousse plantée…) ET noter le changement pour la sauvegarde.
  function changerObjet(monde, i, objet) {
    monde.carte.objet[i] = objet;
    monde.modifs.set(i, { o: objet, r: monde.carte.reste[i] });
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
    Village.Porteurs.etape(monde, dt);
    Village.Animaux.etape(monde, dt);
    Village.Repas.etape(monde, dt);
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
    if (s) {
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

  function joueur(monde, intentions) {
    const s = intentions.souris, B = Village.Batiments;
    if (intentions.construire) {
      // Appuyer 2 fois sur le même bouton = annuler.
      monde.construction = monde.construction === intentions.construire ? null : intentions.construire;
      monde.outil = null;
      monde.selection = null;
      radio.emettre(monde.construction ? "choix-construction" : "construction-annulee", { nom: B.TYPES[intentions.construire].nom, cout: B.cout(intentions.construire) });
    }
    if (intentions.outil) {
      // Étape 3 : les outils 🛤️ route et 🧹 démolir.
      monde.outil = monde.outil === intentions.outil ? null : intentions.outil;
      monde.construction = null;
      monde.selection = null;
      monde.routeDepart = null;
      monde.aDeplacer = null;
      radio.emettre("choix-outil", { outil: monde.outil });
    }
    if (intentions.annuler) {
      if (monde.construction) radio.emettre("construction-annulee", { nom: B.TYPES[monde.construction].nom });
      if (monde.outil && monde.routeDepart) monde.routeDepart = null; // d'abord : oublier le départ de la route
      else if (monde.outil && monde.aDeplacer) monde.aDeplacer = null; // ou le bâtiment qu'on allait déplacer
      else monde.outil = null;
      monde.construction = null;
      monde.selection = null;
    }
    if (!s || !s.clic) return;
    const k = caseSous(monde, s.clic.x, s.clic.y).k;
    if (!k) return;
    if (monde.construction) {
      // On pose le chantier. Raté (pas la place, pas assez de planches) : on reste en mode construction.
      if (B.poser(monde, monde.construction, k.colonne, k.ligne)) monde.construction = null;
      return;
    }
    if (monde.outil === "route") return tracerRoute(monde, k);
    if (monde.outil === "deplacer") {
      // Étape 5 : 1er toucher = le bâtiment, 2e toucher = sa nouvelle place.
      if (!monde.aDeplacer) {
        const b = monde.occupees.get(k.numero);
        if (!b) { radio.emettre("deplacement-impossible", { nom: "Rien", raison: "touche d'abord un bâtiment" }); return; }
        if (b.type === "entrepot") { radio.emettre("deplacement-impossible", { nom: "L'entrepôt", raison: "il reste au cœur du village" }); return; }
        monde.aDeplacer = b;
        radio.emettre("deplacement-choisi", { nom: B.TYPES[b.type].nom, numero: b.numero });
        return;
      }
      if (B.deplacer(monde, monde.aDeplacer, k.colonne, k.ligne)) monde.aDeplacer = null;
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

  // Tracer une route : 1er toucher = le départ, 2e toucher = l'arrivée. Puis on peut continuer
  // depuis l'arrivée (elle devient le nouveau départ).
  function tracerRoute(monde, k) {
    const ok = monde.occupees.has(k.numero) || monde.route[k.numero] || Village.Routes.routable(monde, k.colonne, k.ligne);
    if (!monde.routeDepart) {
      if (!ok) { radio.emettre("route-impossible", { raison: "on ne peut pas commencer une route ici (" + k.nomTerrain + (k.objet ? ", " + k.nomObjet : "") + ")" }); return; }
      monde.routeDepart = { colonne: k.colonne, ligne: k.ligne };
      radio.emettre("route-depart", { colonne: k.colonne, ligne: k.ligne });
      return;
    }
    if (k.colonne === monde.routeDepart.colonne && k.ligne === monde.routeDepart.ligne) { monde.routeDepart = null; return; }
    if (Village.Routes.construire(monde, monde.routeDepart, { colonne: k.colonne, ligne: k.ligne })) {
      // Si on est arrivé sur un bâtiment, on s'arrête là. Sinon, on peut continuer depuis l'arrivée.
      monde.routeDepart = monde.occupees.has(k.numero) ? null : { colonne: k.colonne, ligne: k.ligne };
    }
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
