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
//   3 (étape 36) : on ajoute les PIÈCES (ton porte-monnaie), les voitures achetées et la voiture choisie.
//                  Chaque course gardée dit aussi avec quelle voiture, et combien de pièces ramassées.
//   4 (étape 37) : un garage par carte. « voitureChoisie » devient « voituresChoisies » (une par carte),
//                  et le 4x4 du parcours est offert.
//   5 (étape 39) : le garage de la ville ; la citadine est offerte.
//   6 (étape 40) : le garage du grand parcours ; le kart est offert.
//   7 (étape 41) : les méga-rampes : la voiture choisie là-bas, et le record du chrono (recordRampes).
//   8 (étape 42) : les objets achetés au magasin (objets) et les voitures repeintes en or (peintures).
//   9 (étape 43) : les petits boulots : combien de tâches réussies pour chacun, et les pièces gagnées en travaillant.
//  10 (étape 44) : les vols (décollages, vols de ligne, crashs) et les tirs (cibles touchées, voitures explosées).
//  11 (étape 45) : la police : le plus d'étoiles atteint, combien de fois attrapé, combien de fois semée.
//
// Les pièces sont comptées dès qu'on les ramasse, mais écrites dans le tiroir à la fin de la course
// (ou si on recommence, ou si on ferme la page) : écrire 50 fois par course, ce serait du gaspillage.

window.Circuit = window.Circuit || {};

Circuit.Sauvegarde = (function () {
  const CLE = "circuit-maxance:sauvegarde";
  const VERSION = 11;
  const radio = Circuit.Evenements;

  function vide() {
    return {
      version: VERSION, // si le format change un jour, ce numéro permettra de convertir les anciennes données
      meilleurTour: null, // en secondes
      meilleureCourse: null, // en secondes, pour les 3 tours
      courses: 0, // nombre de courses finies (gagnées ou perdues)
      victoires: 0, // depuis la version 2
      defaites: 0, // depuis la version 2
      pieces: 0, // depuis la version 3 : les pièces que tu as (ton porte-monnaie)
      piecesTotal: 0, // depuis la version 3 : toutes les pièces ramassées depuis le début
      voituresAchetees: ["classique", "4x4", "citadine", "kart"], // depuis la version 3 : la Rouge est offerte (puis le 4x4, la citadine, le kart)
      voituresChoisies: { course: "classique", parcours: "4x4", ville: "citadine", grand: "kart", ciel: "classique" }, // depuis la version 4 : la voiture choisie sur chaque carte
      recordRampes: null, // depuis la version 7 : le meilleur temps sur les méga-rampes (en secondes)
      objets: {}, // depuis la version 8 : ce que tu as acheté au magasin, ex. { baskets: true, glace: 3 }
      peintures: {}, // depuis la version 8 : les voitures repeintes, ex. { citadine: "or" }
      boulots: { pizzas: 0, taxi: 0, vendeur: 0, poubelles: 0 }, // depuis la version 9 : les tâches réussies
      piecesGagneesAuTravail: 0, // depuis la version 9
      vols: { decollages: 0, volsDeLigne: 0, crashs: 0, ciblesTouchees: 0, voituresExplosees: 0 }, // depuis la version 10
      police: { etoilesMax: 0, arrestations: 0, semee: 0 }, // depuis la version 11
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
    if ((anciennes.version || 1) < 3) {
      // Version 2 → 3 : pas encore de pièces ni de garage. Tu avais la Rouge.
      d.pieces = 0;
      d.piecesTotal = 0;
      d.voituresAchetees = ["classique"];
      d.voitureChoisie = "classique"; // (remplacé par voituresChoisies à la version 4, juste en dessous)
    }
    if ((anciennes.version || 1) < 4) {
      // Version 3 → 4 : la voiture choisie était celle du circuit ; on offre le 4x4 du parcours.
      d.voituresChoisies = { course: anciennes.voitureChoisie || "classique", parcours: "4x4" };
      delete d.voitureChoisie;
      if (!d.voituresAchetees.includes("4x4")) d.voituresAchetees.push("4x4");
    }
    if ((anciennes.version || 1) < 5) {
      // Version 4 → 5 : la ville arrive, avec sa citadine offerte.
      d.voituresChoisies = Object.assign({ ville: "citadine" }, d.voituresChoisies);
      if (!d.voituresAchetees.includes("citadine")) d.voituresAchetees.push("citadine");
    }
    if ((anciennes.version || 1) < 6) {
      // Version 5 → 6 : le grand parcours arrive, avec son kart offert.
      d.voituresChoisies = Object.assign({ grand: "kart" }, d.voituresChoisies);
      if (!d.voituresAchetees.includes("kart")) d.voituresAchetees.push("kart");
    }
    if ((anciennes.version || 1) < 7) {
      // Version 6 → 7 : les méga-rampes arrivent (on y roule avec la Rouge, et pas encore de record).
      d.voituresChoisies = Object.assign({ ciel: "classique" }, d.voituresChoisies);
      d.recordRampes = null;
    }
    if ((anciennes.version || 1) < 8) {
      // Version 7 → 8 : les magasins arrivent. Rien d'acheté pour l'instant.
      d.objets = {};
      d.peintures = {};
    }
    if ((anciennes.version || 1) < 9) {
      // Version 8 → 9 : les petits boulots arrivent. Personne n'a encore travaillé.
      d.boulots = { pizzas: 0, taxi: 0, vendeur: 0, poubelles: 0 };
      d.piecesGagneesAuTravail = 0;
    }
    if ((anciennes.version || 1) < 10) {
      // Version 9 → 10 : les avions arrivent. Personne n'a encore volé.
      d.vols = { decollages: 0, volsDeLigne: 0, crashs: 0, ciblesTouchees: 0, voituresExplosees: 0 };
    }
    if ((anciennes.version || 1) < 11) {
      // Version 10 → 11 : la police arrive. Jamais poursuivi pour l'instant.
      d.police = { etoilesMax: 0, arrestations: 0, semee: 0 };
    }
    d.version = VERSION;
    return d;
  }

  function ecrire(raison) {
    try {
      localStorage.setItem(CLE, JSON.stringify(donnees));
      piecesAEcrire = false;
      radio.emettre("sauvegarde", { raison });
    } catch (e) {
      // Navigation privée ou tiroir plein : le jeu continue, sans mémoire.
    }
  }

  let piecesAEcrire = false; // des pièces ramassées pas encore écrites dans le tiroir

  function initialiser(lireDistance) {
    lire();

    // Étape 36 : les pièces et le garage.
    radio.ecouter("piece", () => {
      donnees.pieces++;
      donnees.piecesTotal++;
      piecesAEcrire = true;
    });
    radio.ecouter("achat", (d) => {
      donnees.pieces -= d.prix;
      donnees.voituresAchetees.push(d.id);
      ecrire("achat : " + d.voiture + " pour " + d.prix + " pièces");
    });
    radio.ecouter("choix-voiture", (d) => {
      if (donnees.voituresChoisies[d.carte] === d.id) return;
      donnees.voituresChoisies[d.carte] = d.id;
      ecrire("voiture choisie pour « " + d.carte + " » : " + d.voiture);
    });
    radio.ecouter("menu-cartes", () => {
      if (piecesAEcrire) ecrire("pièces de la balade");
    });
    radio.ecouter("decompte", () => {
      if (piecesAEcrire) ecrire("pièces de la course d'avant (recommencée)");
    });
    window.addEventListener("pagehide", () => {
      if (piecesAEcrire) ecrire("page fermée");
    });

    radio.ecouter("tour-termine", (d) => {
      donnees.toursTotal++;
      if (donnees.meilleurTour === null || d.temps < donnees.meilleurTour) {
        const ancien = donnees.meilleurTour;
        donnees.meilleurTour = arrondir(d.temps);
        radio.emettre("nouveau-record", { quoi: "tour", temps: d.temps, ancien });
      }
      ecrire("tour " + d.numero + " terminé");
    });

    // Étape 45 : la police.
    radio.ecouter("etoiles", (d) => { donnees.police.etoilesMax = Math.max(donnees.police.etoilesMax, d.etoiles); });
    radio.ecouter("arrete", () => {
      donnees.police.arrestations++;
      ecrire("attrapé par la police");
    });
    radio.ecouter("police-semee", () => {
      donnees.police.semee++;
      ecrire("police semée");
    });

    // Étape 44 : les vols et les tirs.
    radio.ecouter("decollage-avion", () => donnees.vols.decollages++);
    radio.ecouter("crash", () => {
      donnees.vols.crashs++;
      ecrire("crash d'avion");
    });
    radio.ecouter("vol-ligne", (d) => {
      donnees.vols.volsDeLigne++;
      donnees.pieces += d.montant;
      ecrire("vol de ligne : +" + d.montant + " pièces");
    });
    radio.ecouter("cible-touchee", (d) => {
      donnees.vols.ciblesTouchees++;
      donnees.pieces += d.montant;
      piecesAEcrire = true;
    });
    radio.ecouter("explosion", (d) => {
      if (d.sorte === "voiture") donnees.vols.voituresExplosees++;
    });

    // Étape 43 : une paie de petit boulot.
    radio.ecouter("boulot-etape", (d) => {
      if (!d.montant) return;
      donnees.pieces += d.montant;
      donnees.piecesGagneesAuTravail += d.montant;
      donnees.boulots[d.sorte] = (donnees.boulots[d.sorte] || 0) + 1;
      ecrire("paie du boulot (" + d.sorte + ") : +" + d.montant + " pièce(s)");
    });

    // Étape 42 : un achat au magasin.
    radio.ecouter("achat-objet", (d) => {
      donnees.pieces -= d.prix;
      if (d.id === "peinture") donnees.peintures[d.voiture] = "or";
      else if (d.id === "glace") donnees.objets.glace = (donnees.objets.glace || 0) + 1;
      else donnees.objets[d.id] = true;
      ecrire("achat au magasin : " + d.nom + " pour " + d.prix + " pièce(s)");
    });

    // Étape 41 : l'arrivée des méga-rampes. Un nouveau record ?
    radio.ecouter("rampes-arrivee", (d) => {
      const ancien = donnees.recordRampes;
      if (ancien === null || d.temps < ancien) {
        donnees.recordRampes = arrondir(d.temps);
        radio.emettre("nouveau-record", { quoi: "rampes", temps: d.temps, ancien });
      }
      ecrire("arrivée des méga-rampes");
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
        voiture: d.voiture,
        pieces: d.pieces,
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
        voiture: d.voiture,
        pieces: d.pieces,
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
