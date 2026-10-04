// 💾 LA SAUVEGARDE : la mémoire qui survit
//
// Le monde (la voiture, le chrono…) s'efface quand on ferme la page : c'est la mémoire VIVE.
// Les records, eux, doivent survivre : on les range dans le « localStorage » du navigateur,
// un petit tiroir où l'on range du texte sous une étiquette (une CLÉ), au format JSON.
//
// Les autres parties du jeu ne touchent jamais au tiroir : elles annoncent des événements
// (« tour-termine », « arrivee ») et c'est ce fichier qui décide quoi enregistrer.
//
// Attention : ce tiroir est séparé de celui du jeu de plateforme (clé différente).

window.Circuit = window.Circuit || {};

Circuit.Sauvegarde = (function () {
  const CLE = "circuit-maxance:sauvegarde";
  const VERSION = 1;
  const radio = Circuit.Evenements;

  function vide() {
    return {
      version: VERSION, // si le format change un jour, ce numéro permettra de convertir les anciennes données
      meilleurTour: null, // en secondes
      meilleureCourse: null, // en secondes, pour les 3 tours
      courses: 0, // nombre de courses finies
      toursTotal: 0,
      sortiesTotal: 0,
      distanceTotale: 0, // m parcourus dans toutes les courses finies
      dernieresCourses: [], // les 5 dernières : { date, temps, meilleurTour, sorties }
    };
  }

  let donnees = vide();

  // On garde les temps au centième de seconde : 11.441666… → 11.44
  const arrondir = (t) => Math.round(t * 100) / 100;

  // Vrai si la dernière course finie a battu le record (lu par le tableau de bord).
  let recordDerniereCourse = false;

  function lire() {
    try {
      const texte = localStorage.getItem(CLE);
      if (texte) donnees = Object.assign(vide(), JSON.parse(texte));
      radio.emettre("lecture", { trouve: !!texte });
    } catch (e) {
      donnees = vide();
      radio.emettre("lecture", { trouve: false, erreur: true });
    }
  }

  function ecrire(raison) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      radio.emettre("sauvegarde", { raison });
    } catch (e) {
      // Navigation privée ou tiroir plein : le jeu continue, sans mémoire.
    }
  }

  function initialiser(lireDistance) {
    lire();

    radio.ecouter("tour-termine", (d) => {
      donnees.toursTotal++;
      if (donnees.meilleurTour === null || d.temps < donnees.meilleurTour) {
        const ancien = donnees.meilleurTour;
        donnees.meilleurTour = arrondir(d.temps);
        radio.emettre("nouveau-record", { quoi: "tour", temps: d.temps, ancien });
      }
      ecrire("tour " + d.numero + " terminé");
    });

    radio.ecouter("sortie-de-piste", () => {
      donnees.sortiesTotal++;
    });

    radio.ecouter("arrivee", (d) => {
      recordDerniereCourse = donnees.meilleureCourse === null || d.temps < donnees.meilleureCourse;
      donnees.courses++;
      donnees.distanceTotale = Math.round(donnees.distanceTotale + lireDistance());
      if (recordDerniereCourse) {
        const ancien = donnees.meilleureCourse;
        donnees.meilleureCourse = arrondir(d.temps);
        radio.emettre("nouveau-record", { quoi: "course", temps: d.temps, ancien });
      }
      donnees.dernieresCourses.unshift({
        date: new Date().toLocaleDateString("fr-FR"),
        temps: arrondir(d.temps),
        meilleurTour: arrondir(d.meilleurTour),
        sorties: d.sorties,
      });
      donnees.dernieresCourses = donnees.dernieresCourses.slice(0, 5);
      ecrire("course finie");
    });
  }

  function effacer() {
    donnees = vide();
    try {
      localStorage.removeItem(CLE);
    } catch (e) {}
    radio.emettre("base-effacee", {});
  }

  return {
    CLE,
    initialiser,
    effacer,
    get donnees() {
      return donnees;
    },
    get recordDerniereCourse() {
      return recordDerniereCourse;
    },
  };
})();
