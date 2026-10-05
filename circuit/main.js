// ❤️ LE CŒUR DU JEU : la boucle de jeu
//
// Ce fichier branche toutes les pièces ensemble, puis fait battre le cœur du jeu :
// environ 60 fois par seconde, le navigateur nous dit « c'est le moment de dessiner une image ».
// À chaque battement :
//   1. on regarde combien de temps s'est écoulé depuis la dernière image ;
//   2. on fait avancer la course par petits pas FIXES de 1/120 s ;
//   3. on dessine la 3D, puis le tableau de bord par-dessus.
//
// Pas fixes = la voiture accélère exactement pareil sur un ordinateur rapide ou lent.

(function () {
  const C = Circuit.CONFIG;
  const toile3D = document.getElementById("ecran3d");
  const toile2D = document.getElementById("ecran2d");

  // Vérifie que tous les fichiers viennent de la même version.
  const attendue = String(C.version);
  const melange = [...document.scripts].some((s) => s.src && !s.src.endsWith("?v=" + attendue));
  document.getElementById("version").textContent = melange ? "⚠️ versions mélangées : fais Ctrl + F5" : "version " + attendue;

  // 1. Brancher les pièces
  Circuit.Entrees.initialiser(window);
  if (!Circuit.Scene3D.initialiser(toile3D)) {
    document.getElementById("sans-3d").hidden = false;
    return;
  }
  Circuit.TableauDeBord.initialiser(toile2D);
  const monde = Circuit.Course.creer();
  Circuit.monde = monde; // pour les curieux : tape « Circuit.monde » dans la console du navigateur (F12)
  const options = { rayonsX: false, pause: false, ralenti: false };
  const mesures = { ips: 0, majParSeconde: 0 };

  Circuit.SousLeCapot.initialiser({
    lireMonde: () => monde,
    lireMesures: () => mesures,
    elements: {
      etat: document.getElementById("etat"),
      journal: document.getElementById("journal"),
      viderJournal: document.getElementById("vider-journal"),
      base: document.getElementById("base"),
      cle: document.getElementById("cle"),
      effacerBase: document.getElementById("effacer-base"),
    },
  });
  // La sauvegarde est lue APRÈS le branchement du panneau, pour que le journal voie la lecture.
  Circuit.Sauvegarde.initialiser(() => monde.voiture.distance);
  Circuit.Sons.initialiser(); // étape 35 : le bruit du moteur, de l'herbe, des chocs et du départ
  Circuit.Course.ouvrirCartes(monde); // étape 37 : on commence par choisir la carte, puis le garage

  // Les boutons sous l'écran font comme les touches.
  for (const bouton of document.querySelectorAll("[data-action]")) {
    bouton.addEventListener("click", () => {
      Circuit.Entrees.appuyer(bouton.dataset.action);
      toile2D.focus();
    });
  }
  function rafraichirBoutons() {
    for (const bouton of document.querySelectorAll("[data-option]")) bouton.setAttribute("aria-pressed", String(options[bouton.dataset.option]));
  }

  // Ce que veut le joueur, traduit en intentions (la logique ne connaît pas les touches).
  function lireIntentions() {
    const E = Circuit.Entrees;
    return {
      accelerer: E.estEnfoncee("accelerer"),
      freiner: E.estEnfoncee("freiner"),
      gauche: E.estEnfoncee("gauche"),
      droite: E.estEnfoncee("droite"),
      // Étape 36 : un appui (et pas « tenue ») sur ← ou →, pour passer d'une voiture à l'autre au garage.
      gaucheAppui: E.consommer("gauche"),
      droiteAppui: E.consommer("droite"),
      // Étape 37 : le menu des cartes.
      carte1: E.consommer("carte1"),
      carte2: E.consommer("carte2"),
      carte3: E.consommer("carte3"),
      carte4: E.consommer("carte4"), // étape 40
      carte5: E.consommer("carte5"), // étape 41
      sirene: E.consommer("sirene"), // étape 40 : H
      klaxon: E.consommer("klaxon"), // étape 42 : K
      boulot: E.consommer("boulot"), // étape 43 : J
      // Étape 44 : voler et tirer.
      gaz: E.estEnfoncee("gaz"),
      freinVol: E.estEnfoncee("freinVol"),
      volMonter: E.estEnfoncee("volMonter"),
      volDescendre: E.estEnfoncee("volDescendre"),
      tir: E.estEnfoncee("tir"),
      missile: E.consommer("missile"),
      retour: E.consommer("retour"),
      monter: E.consommer("monter"), // étape 39 : E en ville
      valider: E.consommer("valider"),
      recommencer: E.consommer("recommencer"),
    };
  }

  // 2. La boucle
  let precedent = performance.now();
  let reserve = 0; // le temps pas encore « calculé »
  let images = 0, pas = 0, debutMesure = precedent;

  function battement(maintenant) {
    const E = Circuit.Entrees;
    if (E.consommer("rayonsX")) options.rayonsX = !options.rayonsX;
    if (E.consommer("pause")) options.pause = !options.pause;
    if (E.consommer("ralenti")) options.ralenti = !options.ralenti;
    if (E.consommer("son")) Circuit.Sons.basculer();
    if (E.consommer("camera")) Circuit.Evenements.emettre("camera", { mode: Circuit.Scene3D.changerCamera() });
    rafraichirBoutons();

    let ecoule = Math.min(0.25, (maintenant - precedent) / 1000); // jamais plus de 0,25 s d'un coup
    precedent = maintenant;
    if (options.ralenti) ecoule /= 4;
    const pasSuivant = E.consommer("pasSuivant");

    if (!options.pause) {
      reserve += ecoule;
      while (reserve >= C.pasFixe) {
        Circuit.Course.etape(monde, C.pasFixe, lireIntentions());
        reserve -= C.pasFixe;
        pas++;
      }
    } else if (pasSuivant) {
      Circuit.Course.etape(monde, C.pasFixe, lireIntentions());
      pas++;
    }

    Circuit.Scene3D.dessiner(monde, options, options.pause ? 0 : ecoule);
    Circuit.TableauDeBord.dessiner(monde, options, Circuit.Sauvegarde.donnees);
    Circuit.Sons.mettreAJour(monde, options);
    Circuit.SousLeCapot.mettreAJour(maintenant);

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
  toile2D.focus();
})();
