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
//
// Versions du format :
//   1 (étape 32) : records, nombre de courses, de tours, de sorties, les 5 dernières courses.
//   2 (étape 34) : on ajoute les victoires et les défaites contre l'adversaire,
//                  et chaque course gardée dit si elle est « gagnée » ou « perdue ».

window.Circuit = window.Circuit || {};

Circuit.Sauvegarde = (function () {
  const CLE = "circuit-maxance:sauvegarde";
  const VERSION = 2;
  const radio = Circuit.Evenements;

  function vide() {
    return {
      version: VERSION, // si le format change un jour, ce numéro permettra de convertir les anciennes données
      meilleurTour: null, // en secondes
      meilleureCourse: null, // en secondes, pour les 3 tours
      courses: 0, // nombre de courses finies (gagnées ou perdues)
      victoires: 0, // depuis la version 2
      defaites: 0, // depuis la version 2
      toursTotal: 0,
      sortiesTotal: 0,
      distanceTotale: 0, // m parcourus dans toutes les courses finies
      dernieresCourses: [], // les 5 dernières : { date, resultat, temps, meilleurTour, sorties }
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
      let converti = false;
      if (texte) {
        const lues = JSON.parse(texte);
        converti = (lues.version || 1) < VERSION;
        donnees = convertir(lues);
      }
      radio.emettre("lecture", { trouve: !!texte, converti });
      if (converti) ecrire("conversion en version " + VERSION);
    } catch (e) {
      donnees = vide();
      radio.emettre("lecture", { trouve: false, erreur: true });
    }
  }

  // Transforme une ancienne sauvegarde en sauvegarde de la version actuelle, marche par marche.
  function convertir(anciennes) {
    const d = Object.assign(vide(), anciennes);
    if ((anciennes.version || 1) < 2) {
      // Version 1 → 2 : il n'y avait pas d'adversaire, toutes les courses finies étaient des courses « seul ».
      d.victoires = 0;
      d.defaites = 0;
      d.dernieresCourses = (anciennes.dernieresCourses || []).map((c) => Object.assign({ resultat: "seul" }, c));
    }
    d.version = VERSION;
    return d;
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
      donnees.victoires++;
      donnees.distanceTotale = Math.round(donnees.distanceTotale + lireDistance());
      if (recordDerniereCourse) {
        const ancien = donnees.meilleureCourse;
        donnees.meilleureCourse = arrondir(d.temps);
        radio.emettre("nouveau-record", { quoi: "course", temps: d.temps, ancien });
      }
      donnees.dernieresCourses.unshift({
        date: new Date().toLocaleDateString("fr-FR"),
        resultat: "gagnée",
        temps: arrondir(d.temps),
        meilleurTour: arrondir(d.meilleurTour),
        sorties: d.sorties,
      });
      donnees.dernieresCourses = donnees.dernieresCourses.slice(0, 5);
      ecrire("course gagnée");
    });

    radio.ecouter("perdu", (d) => {
      recordDerniereCourse = false;
      donnees.courses++;
      donnees.defaites++;
      donnees.distanceTotale = Math.round(donnees.distanceTotale + lireDistance());
      donnees.dernieresCourses.unshift({
        date: new Date().toLocaleDateString("fr-FR"),
        resultat: "perdue",
        temps: arrondir(d.temps),
        tourAtteint: d.tourJoueur,
        sorties: d.sorties,
      });
      donnees.dernieresCourses = donnees.dernieresCourses.slice(0, 5);
      ecrire("course perdue");
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
