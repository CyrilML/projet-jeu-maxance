// ❤️ LE CŒUR DU JEU : la boucle de jeu
//
// Ce fichier branche toutes les pièces ensemble, puis fait battre le cœur du jeu :
// environ 60 fois par seconde, le navigateur nous dit « c'est le moment de dessiner une image ».
// À chaque battement :
//   1. on regarde combien de temps s'est écoulé depuis la dernière image ;
//   2. on fait avancer le monde par petits pas FIXES de 1/120 s (souvent 2 pas par image) ;
//   3. on dessine le résultat.
//
// Pourquoi des pas fixes ? Pour que le saut ait exactement la même hauteur sur un ordinateur
// rapide et sur un ordinateur lent. Seul le nombre d'images affichées change.

(function () {
  const C = Jeu.CONFIG;
  const canvas = document.getElementById("ecran");

  // Vérifie que tous les fichiers viennent de la même version (voir index.html).
  const attendue = String(C.version);
  const melange = [...document.scripts].some((s) => !s.src.endsWith("?v=" + attendue));
  document.getElementById("version").textContent = melange
    ? "⚠️ versions mélangées : fais Ctrl + F5"
    : "version " + attendue;

  // 1. Brancher les pièces
  Jeu.Entrees.initialiser(window);
  Jeu.Rendu.initialiser(canvas);
  const monde = Jeu.Monde.creer();
  const options = { rayonsX: false, pause: false, ralenti: false };

  const mesures = { ips: 0, majParSeconde: 0 };
  let compteurImages = 0;
  let compteurMaj = 0;
  let debutMesure = performance.now();

  Jeu.SousLeCapot.initialiser({
    lireMonde: () => monde,
    lireMesures: () => mesures,
    elements: {
      etat: document.getElementById("etat"),
      journal: document.getElementById("journal"),
      viderJournal: document.getElementById("vider-journal"),
      base: document.getElementById("base"),
      cle: document.getElementById("cle"),
      effacerBase: document.getElementById("effacer-base"),
      carte: document.getElementById("carte"),
      classement: document.getElementById("classement"),
    },
  });
  // La sauvegarde est lue APRÈS le branchement du panneau, pour que le journal voie la lecture.
  Jeu.Sauvegarde.initialiser();

  // Le formulaire du pseudo, affiché par-dessus l'écran pendant l'accueil (étape 6).
  const formulaire = document.getElementById("accueil");
  const champPseudo = document.getElementById("pseudo");
  const erreurPseudo = document.getElementById("pseudo-erreur");
  champPseudo.maxLength = C.classement.pseudoMax;
  formulaire.addEventListener("submit", (e) => {
    e.preventDefault(); // sinon la page se rechargerait
    const pseudo = Jeu.Classement.nettoyerPseudo(champPseudo.value);
    if (!pseudo) {
      erreurPseudo.textContent = "Écris ton pseudo pour jouer 🙂";
      champPseudo.focus();
      return;
    }
    erreurPseudo.textContent = "";
    Jeu.Monde.demarrer(monde, pseudo);
    canvas.focus();
  });

  // Montre le formulaire seulement à l'accueil, rempli avec le dernier pseudo utilisé.
  let formulaireVisible = false;
  function afficherFormulaire() {
    const visible = monde.phase === "accueil";
    if (visible === formulaireVisible) return;
    formulaireVisible = visible;
    formulaire.hidden = !visible;
    if (visible) {
      champPseudo.value = Jeu.Sauvegarde.donnees.dernierPseudo || "";
      champPseudo.focus();
      champPseudo.select();
    }
  }

  // Les touches « outils » sont gérées ici : elles ne font pas partie des règles du jeu.
  function touchesOutils() {
    const E = Jeu.Entrees;
    if (E.consommer("rayonsX")) options.rayonsX = !options.rayonsX;
    if (E.consommer("ralenti")) options.ralenti = !options.ralenti;
    if (E.consommer("pause") && monde.phase === "jeu") options.pause = !options.pause;
    // En pause, un appui sur P (poser un bloc) est oublié : sinon le bloc apparaîtrait à la reprise.
    if (options.pause) for (const action of ["poserBloc", "frapper", "boirePotion", "piocher", "reparer"]) E.consommer(action);
    if (monde.phase !== "jeu") options.pause = false;
    if (E.consommer("pasSuivant") && options.pause) {
      Jeu.Monde.mettreAJour(monde, C.pasDeTemps);
      compteurMaj++;
    }
    for (const bouton of document.querySelectorAll("[data-option]")) {
      bouton.setAttribute("aria-pressed", String(options[bouton.dataset.option]));
    }
  }

  // 2. La boucle
  let accumulateur = 0;
  let precedent = performance.now();

  function boucle(maintenant) {
    // Si l'onglet était caché longtemps, on ne rattrape pas plus de 0,1 s (sinon tout « saute »).
    const ecoule = Math.min((maintenant - precedent) / 1000, 0.1);
    precedent = maintenant;

    touchesOutils();
    afficherFormulaire();

    if (!options.pause) {
      accumulateur += options.ralenti ? ecoule * 0.25 : ecoule;
      while (accumulateur >= C.pasDeTemps) {
        Jeu.Monde.mettreAJour(monde, C.pasDeTemps);
        accumulateur -= C.pasDeTemps;
        compteurMaj++;
      }
    }

    Jeu.Rendu.dessiner(monde, options);
    compteurImages++;

    if (maintenant - debutMesure >= 1000) {
      const secondes = (maintenant - debutMesure) / 1000;
      mesures.ips = Math.round(compteurImages / secondes);
      mesures.majParSeconde = Math.round(compteurMaj / secondes);
      compteurImages = 0;
      compteurMaj = 0;
      debutMesure = maintenant;
    }

    requestAnimationFrame(boucle);
  }

  requestAnimationFrame(boucle);

  // Boutons à l'écran (mêmes effets que les touches)
  for (const bouton of document.querySelectorAll("[data-action]")) {
    bouton.addEventListener("click", () => {
      Jeu.Entrees.appuyer(bouton.dataset.action);
      canvas.focus();
    });
  }
  canvas.focus();

  // Accès pour les tests et la curiosité : tape Jeu.monde dans la console du navigateur (F12).
  Jeu.monde = monde;
  Jeu.options = options;
})();
