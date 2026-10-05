// 🔌 LE BRANCHEMENT : main.js met toutes les pièces ensemble et fait tourner la boucle
//
// La boucle de jeu, 60 fois par seconde :
//   1. on lit les intentions du joueur (clavier, souris) ;
//   2. on fait avancer le monde par petits pas FIXES de 1/120 s ;
//   3. le peintre dessine l'image, et « sous le capot » se met à jour.
// Pourquoi des pas fixes ? Pour que le jeu se comporte pareil sur un ordinateur rapide ou lent.

(function () {
  const C = Village.CONFIG;
  const E = Village.Entrees;
  const toile = document.getElementById("ecran");
  document.getElementById("version").textContent = "version " + C.version;

  const options = { rayonsX: false, pause: false, ralenti: false };
  const mesures = { ips: 0, majParSeconde: 0 };

  // Une nouvelle graine au hasard (un nombre entre 1 et 999 999).
  const nouvelleGraine = () => 1 + Math.floor(Math.random() * 999999);

  const sauvees = Village.Sauvegarde.lire();
  let monde = Village.Monde.creer(sauvees.graine || nouvelleGraine(), sauvees.graine ? sauvees.camera : null);
  let debutDuMonde = monde.temps;

  E.initialiser(toile);
  Village.Peintre.initialiser(toile);
  Village.SousLeCapot.initialiser(monde, mesures);

  // Les boutons sous l'écran font comme les touches.
  for (const bouton of document.querySelectorAll("[data-action]")) {
    bouton.addEventListener("click", () => { E.appuyer(bouton.dataset.action); toile.focus(); });
  }
  function rafraichirBoutons() {
    for (const bouton of document.querySelectorAll("[data-option]")) bouton.setAttribute("aria-pressed", String(options[bouton.dataset.option]));
  }

  // Quand on ferme la page ou qu'on change d'onglet : on range la caméra et le temps de jeu.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") return;
    Village.Sauvegarde.quitter(monde, monde.temps - debutDuMonde);
    debutDuMonde = monde.temps;
  });

  function lireIntentions(souris) {
    return {
      dx: (E.estEnfoncee("droite") ? 1 : 0) - (E.estEnfoncee("gauche") ? 1 : 0),
      dy: (E.estEnfoncee("bas") ? 1 : 0) - (E.estEnfoncee("haut") ? 1 : 0),
      zoom: (souris ? souris.molette : 0) + (E.consommer("zoomPlus") ? 1 : 0) - (E.consommer("zoomMoins") ? 1 : 0),
      village: E.consommer("village"),
      souris,
    };
  }

  let precedent = performance.now();
  let reserve = 0;
  let images = 0, pas = 0, debutMesure = precedent;

  function battement(maintenant) {
    if (E.consommer("rayonsX")) options.rayonsX = !options.rayonsX;
    if (E.consommer("pause")) options.pause = !options.pause;
    if (E.consommer("ralenti")) options.ralenti = !options.ralenti;
    if (E.consommer("nouvelleCarte")) {
      Village.Sauvegarde.quitter(monde, monde.temps - debutDuMonde);
      monde = Village.Monde.creer(nouvelleGraine(), null);
      debutDuMonde = monde.temps;
      Village.SousLeCapot.changerMonde(monde);
    }
    rafraichirBoutons();

    let ecoule = Math.min(0.25, (maintenant - precedent) / 1000);
    precedent = maintenant;
    if (options.ralenti) ecoule /= 4;
    const pasSuivant = E.consommer("pasSuivant");

    // La souris est lue une fois par image et donnée au premier pas seulement
    // (sinon un clic serait compté 2 fois).
    let souris = E.consommerSouris();
    const unPas = () => {
      Village.Monde.etape(monde, C.pasFixe, lireIntentions(souris));
      souris = Object.assign({}, souris, { glisseX: 0, glisseY: 0, molette: 0, clic: null });
      pas++;
    };
    if (!options.pause) {
      reserve += ecoule;
      let fait = false;
      while (reserve >= C.pasFixe) { unPas(); reserve -= C.pasFixe; fait = true; }
      // Même sans pas de calcul cette image-ci, on garde ce que la souris a fait pour la prochaine.
      if (!fait) E.rendreSouris(souris);
    } else if (pasSuivant) {
      unPas();
    } else {
      // En pause, la caméra bouge quand même (sans faire avancer l'horloge) : on peut explorer l'image figée.
      const t = monde.temps;
      Village.Monde.etape(monde, 1 / 60, lireIntentions(souris));
      monde.temps = t;
    }

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
