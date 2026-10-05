// 🔌 LE BRANCHEMENT : main.js met toutes les pièces ensemble et fait tourner la boucle
//
// La boucle de jeu, 60 fois par seconde :
//   1. on lit les intentions du joueur (clavier, souris, doigts) ;
//      un toucher sur un bouton de l'écran va au bouton, sinon il va à la carte ;
//   2. on fait avancer le monde par petits pas FIXES de 1/120 s ;
//   3. le peintre dessine l'image, et « sous le capot » se met à jour.
// Pourquoi des pas fixes ? Pour que le jeu se comporte pareil sur un ordinateur rapide ou lent.

(function () {
  const C = Village.CONFIG;
  const E = Village.Entrees;
  const radio = Village.Evenements;
  const toile = document.getElementById("ecran");
  document.getElementById("version").textContent = "version " + C.version;

  const options = { rayonsX: false, pause: false, ralenti: false };
  const mesures = { ips: 0, majParSeconde: 0 };

  // Une nouvelle graine au hasard (un nombre entre 1 et 999 999).
  const nouvelleGraine = () => 1 + Math.floor(Math.random() * 999999);

  Village.Ecran.initialiser(toile);
  const sauvees = Village.Sauvegarde.lire();
  let monde = sauvees.graine
    ? Village.Monde.creer(sauvees.graine, sauvees.partie, sauvees.camera)
    : Village.Monde.creer(nouvelleGraine(), null, null);
  let debutDuMonde = monde.temps, derniereSauvegarde = monde.temps;
  // Pour les curieux : tape « Village.monde » dans la console du navigateur (F12) pour fouiller le monde.
  Village.monde = monde;

  E.initialiser(toile);
  Village.Peintre.initialiser(toile);
  Village.SousLeCapot.initialiser(monde, mesures);

  const sauver = (raison) => {
    Village.Sauvegarde.sauverPartie(monde, monde.temps - debutDuMonde, raison);
    debutDuMonde = derniereSauvegarde = monde.temps;
  };
  if (!sauvees.partie) sauver("nouvelle partie sur la carte n° " + monde.carte.graine);
  radio.ecouter("batiment-pose", () => sauver("nouveau chantier"));

  // Les boutons sous l'écran font comme les touches.
  for (const bouton of document.querySelectorAll("[data-action]")) {
    bouton.addEventListener("click", () => { E.appuyer(bouton.dataset.action); toile.focus(); });
  }
  function rafraichirBoutons() {
    for (const bouton of document.querySelectorAll("[data-option]")) bouton.setAttribute("aria-pressed", String(options[bouton.dataset.option]));
  }

  // Le plein écran. Sur les téléphones qui ne savent pas le faire (iPhone), la toile prend quand même
  // toute la page : c'est un « faux » plein écran, fait avec du CSS.
  function basculerPleinEcran() {
    const actif = !document.body.classList.contains("plein-ecran");
    document.body.classList.toggle("plein-ecran", actif);
    try {
      if (actif && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
      else if (!actif && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch (e) {}
    Village.Ecran.ajuster();
    radio.emettre("plein-ecran", { actif });
  }
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && document.body.classList.contains("plein-ecran")) {
      document.body.classList.remove("plein-ecran");
      Village.Ecran.ajuster();
      radio.emettre("plein-ecran", { actif: false });
    }
  });

  // Quand on ferme la page ou qu'on change d'onglet (ou d'application sur un téléphone) : on sauvegarde.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sauver("la page se cache ou se ferme");
  });

  // Ce que veut le joueur. Un toucher sur un bouton de l'écran est « mangé » par le bouton.
  function lireIntentions(souris) {
    const i = {
      dx: (E.estEnfoncee("droite") ? 1 : 0) - (E.estEnfoncee("gauche") ? 1 : 0),
      dy: (E.estEnfoncee("bas") ? 1 : 0) - (E.estEnfoncee("haut") ? 1 : 0),
      zoom: (souris ? souris.molette : 0) + (E.consommer("zoomPlus") ? 1 : 0) - (E.consommer("zoomMoins") ? 1 : 0),
      village: E.consommer("village"),
      construire: null,
      outil: E.consommer("route") ? "route" : E.consommer("demolir") ? "demolir" : E.consommer("deplacer") ? "deplacer" : null,
      annuler: false,
      allerA: null,
      souris,
    };
    for (const type of Village.Batiments.A_CONSTRUIRE) if (E.consommer(type)) i.construire = type;
    if (souris && souris.clic) {
      const z = Village.Interface.zoneSous(souris.clic.x, souris.clic.y);
      if (z) {
        if (z.action === "menu") Village.Interface.basculerMenu(z.valeur); // étape 5 : ouvrir un groupe du menu
        else if (z.action === "construire") { i.construire = z.valeur; Village.Interface.fermerMenu(); }
        else if (z.action === "outil") { i.outil = z.valeur; Village.Interface.fermerMenu(); }
        else if (z.action === "annuler" || z.action === "fermer") i.annuler = true;
        else if (z.action === "pleinEcran") basculerPleinEcran();
        else if (z.action === "miniCarte") i.allerA = z.versMonde(souris.clic.x, souris.clic.y);
        i.souris = Object.assign({}, souris, { clic: null });
      } else if (Village.Interface.menuOuvert) {
        // Toucher la carte quand le menu est ouvert : on ferme juste le menu.
        Village.Interface.fermerMenu();
        i.souris = Object.assign({}, souris, { clic: null });
      }
    }
    return i;
  }

  let precedent = performance.now();
  let reserve = 0;
  let images = 0, pas = 0, debutMesure = precedent;

  function battement(maintenant) {
    if (E.consommer("rayonsX")) options.rayonsX = !options.rayonsX;
    if (E.consommer("pause")) options.pause = !options.pause;
    if (E.consommer("ralenti")) options.ralenti = !options.ralenti;
    // Échap : d'abord annuler ce qu'on est en train de faire ; s'il n'y a rien à annuler, pause.
    let annuler = false;
    if (E.consommer("annuler")) {
      if (monde.construction || monde.selection || monde.outil) annuler = true;
      else options.pause = !options.pause;
    }
    if (E.consommer("nouvelleCarte")) {
      sauver("avant de changer de carte");
      Village.Effets.vider();
      monde = Village.Monde.creer(nouvelleGraine(), null, null);
      Village.SousLeCapot.changerMonde(monde);
      Village.monde = monde;
      debutDuMonde = monde.temps;
      sauver("nouvelle partie sur la carte n° " + monde.carte.graine);
    }
    rafraichirBoutons();

    let ecoule = Math.min(0.25, (maintenant - precedent) / 1000);
    precedent = maintenant;
    if (options.ralenti) ecoule /= 4;
    const pasSuivant = E.consommer("pasSuivant");

    // La souris est lue une fois par image et donnée au premier pas seulement
    // (sinon un clic serait compté 2 fois).
    let souris = E.consommerSouris();
    let intentions = lireIntentions(souris);
    intentions.annuler = intentions.annuler || annuler;
    const unPas = (dt) => {
      Village.Monde.etape(monde, dt, intentions);
      // Les pas suivants de la même image : plus de clic, de glissé ni de zoom (déjà faits).
      intentions = Object.assign({}, intentions, {
        zoom: 0, village: false, construire: null, outil: null, annuler: false, allerA: null,
        souris: Object.assign({}, intentions.souris, { glisseX: 0, glisseY: 0, molette: 0, pince: 1, centrePince: null, clic: null }),
      });
      pas++;
    };
    if (!options.pause) {
      reserve += ecoule;
      let fait = false;
      while (reserve >= C.pasFixe) { unPas(C.pasFixe); reserve -= C.pasFixe; fait = true; }
      // Écran très rapide (120 images par seconde) : parfois aucun pas cette image-ci.
      // On applique quand même ce que le joueur a fait (toucher un bouton, glisser), sans avancer l'horloge.
      if (!fait) Village.Monde.etapeEnPause(monde, 0, intentions);
    } else if (pasSuivant) {
      unPas(C.pasFixe);
    } else {
      // En pause, la caméra bouge quand même, mais l'horloge et le village ne bougent pas.
      Village.Monde.etapeEnPause(monde, 1 / 60, intentions);
    }

    if (monde.temps - derniereSauvegarde >= C.sauvegardeAuto) sauver("sauvegarde automatique");

    Village.Peintre.dessiner(monde, options);
    Village.SousLeCapot.mettreAJour(maintenant);

    images++;
    if (maintenant - debutMesure >= 1000) {
      mesures.ips = images;
      mesures.majParSeconde = pas;
      images = pas = 0;
      debutMesure = maintenant;
    }
    requestAnimationFrame(battement);
  }
  requestAnimationFrame(battement);
  toile.focus();
})();
