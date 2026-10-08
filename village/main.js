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
  // Étape 11 : le village a-t-il travaillé pendant ton absence ? (la réserve)
  const absent = (monde.derniereVue ? (Date.now() - monde.derniereVue) / 1000 : 0);
  if (sauvees.partie && absent > 30) Village.Reserve.absence(monde, absent);
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
    else {
      // Étape 11 : de retour après un moment (le téléphone était en veille, ou un autre onglet) ?
      const absent = (Date.now() - monde.derniereVue) / 1000;
      if (absent > 30) Village.Reserve.absence(monde, absent);
      monde.derniereVue = Date.now();
    }
  });
  // Étape 7 : plus de sécurité. « pagehide » arrive aussi quand un téléphone ferme la page d'un coup,
  // et on sauvegarde toutes les 15 vraies secondes (même en pause).
  window.addEventListener("pagehide", () => sauver("la page se ferme"));
  setInterval(() => sauver("sauvegarde automatique"), C.sauvegardeAuto * 1000);
  // On demande au navigateur de ne pas effacer notre tiroir quand il manque de place.
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  // Étape 7 : ✍️ « Nouvelle carte » efface ta partie : on demande de toucher 2 fois pour confirmer.
  let confirmerNouvelleCarte = 0;

  // Ce que veut le joueur. Un toucher sur un bouton de l'écran est « mangé » par le bouton.
  function lireIntentions(souris) {
    const i = {
      dx: (E.estEnfoncee("droite") ? 1 : 0) - (E.estEnfoncee("gauche") ? 1 : 0),
      dy: (E.estEnfoncee("bas") ? 1 : 0) - (E.estEnfoncee("haut") ? 1 : 0),
      zoom: (souris ? souris.molette : 0) + (E.consommer("zoomPlus") ? 1 : 0) - (E.consommer("zoomMoins") ? 1 : 0),
      village: E.consommer("village"),
      construire: null,
      outil: E.consommer("route") ? "route" : E.consommer("routePierre") ? "routePierre" : E.consommer("demolir") ? "demolir" : E.consommer("deplacer") ? "deplacer" : null,
      recherche: null, mission: null, achat: null, // étape 7
      marche: null, // étape 8 : { sens: "vendre" ou "acheter", quoi: "planches" }
      reserve: null, pub: null, absenceVue: false, // étape 11
      valider: E.consommer("valider"), annulerProjet: false, // étape 12 : ✅ et ❌
      ameliorer: null, agrandirEntrepot: false, // étape 13
      annuler: false,
      allerA: null,
      souris,
    };
    for (const type of Village.Batiments.A_CONSTRUIRE) if (E.consommer(type)) i.construire = type;
    // Étape 12 : un appui qui commence sur un bouton ne doit pas attraper la carte
    if (souris && souris.debutAppui && Village.Interface.zoneSous(souris.debutAppui.x, souris.debutAppui.y)) i.souris = souris = Object.assign({}, souris, { debutAppui: null });
    if (souris && souris.appuiLong && Village.Interface.zoneSous(souris.appuiLong.x, souris.appuiLong.y)) i.souris = souris = Object.assign({}, souris, { appuiLong: null });
    if (souris && souris.clic) {
      const z = Village.Interface.zoneSous(souris.clic.x, souris.clic.y);
      if (z) {
        if (z.action === "menu") Village.Interface.basculerMenu(z.valeur); // étape 5 : ouvrir un groupe du menu
        else if (z.action === "objectifs") Village.Interface.basculerObjectifs(); // étape 6 : les objectifs de l'âge
        else if (z.action === "panneau") Village.Interface.basculerPanneau(z.valeur); // étape 7 : missions, boutique
        else if (z.action === "fermerPanneau") Village.Interface.fermerPanneau();
        else if (z.action === "inventaire") Village.Interface.choisirInventaire(z.valeur); // étape 25 : ce que c'est
        else if (z.action === "recherche") i.recherche = z.valeur;
        else if (z.action === "info") Village.Interface.info(z.valeur); // étape 17 : ce qui manque
        else if (z.action === "pageUniversite") Village.Interface.changerPage(z.valeur); // étape 21 : les pages de l'université
        else if (z.action === "mission") i.mission = z.valeur;
        else if (z.action === "achat") i.achat = z.valeur;
        else if (z.action === "marche") i.marche = z.valeur; // étape 8
        else if (z.action === "reserve") i.reserve = z.valeur; // étape 11
        else if (z.action === "pub") i.pub = z.valeur;
        else if (z.action === "absenceVue") i.absenceVue = true;
        else if (z.action === "valider") i.valider = true; // étape 12
        else if (z.action === "annulerProjet") i.annulerProjet = true;
        else if (z.action === "ameliorer") i.ameliorer = z.valeur; // étape 13
        else if (z.action === "agrandirEntrepot") i.agrandirEntrepot = true;
        else if (z.action === "construire") { i.construire = z.valeur; Village.Interface.fermerMenu(); }
        else if (z.action === "construireConseil") { i.construire = z.valeur; Village.Interface.fermerPanneau(); Village.Interface.fermerMenu(); } // étape 29 : depuis le conseiller
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
    if (E.consommer("inventaire")) Village.Interface.basculerPanneau("inventaire"); // étape 25
    // Échap : d'abord annuler ce qu'on est en train de faire ; s'il n'y a rien à annuler, pause.
    let annuler = false;
    if (E.consommer("annuler")) {
      if (Village.Interface.panneauOuvert) Village.Interface.fermerPanneau(); // étape 25 : Échap ferme d'abord le panneau (l'inventaire…)
      else if (monde.construction || monde.selection || monde.outil || monde.projet) annuler = true;
      else options.pause = !options.pause;
    }
    if (E.consommer("nouvelleCarte")) {
      if (performance.now() > confirmerNouvelleCarte) {
        // 1er appui : on prévient. 2e appui dans les 4 secondes : on change vraiment de carte.
        confirmerNouvelleCarte = performance.now() + 4000;
        radio.emettre("confirmer-nouvelle-carte");
        const bouton = document.querySelector('[data-action="nouvelleCarte"]');
        if (bouton) { bouton.textContent = "⚠️ Sûr ? Ta partie sera perdue : touche encore"; setTimeout(() => (bouton.innerHTML = "🎲 Nouvelle carte <kbd>G</kbd>"), 4000); }
      } else {
        confirmerNouvelleCarte = 0;
        sauver("avant de changer de carte");
        Village.Effets.vider();
        monde = Village.Monde.creer(nouvelleGraine(), null, null);
        Village.SousLeCapot.changerMonde(monde);
        Village.monde = monde;
        debutDuMonde = monde.temps;
        sauver("nouvelle partie sur la carte n° " + monde.carte.graine);
      }
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
        zoom: 0, village: false, construire: null, outil: null, annuler: false, allerA: null, recherche: null, mission: null, achat: null,
        marche: null, reserve: null, pub: null, absenceVue: false, // étape 11 : sinon, une vente se faisait 2 fois !
        valider: false, annulerProjet: false, ameliorer: null, agrandirEntrepot: false,
        souris: Object.assign({}, intentions.souris, { glisseX: 0, glisseY: 0, molette: 0, pince: 1, centrePince: null, clic: null, debutAppui: null, leve: null, appuiLong: null }),
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


    if (document.visibilityState !== "hidden") monde.derniereVue = Date.now(); // étape 11 : le jeu tourne
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
